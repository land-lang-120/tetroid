/** @module game-flow - Game lifecycle: init, start, end, pause, game-over */

import { S } from './state.js';
import { COLS, ROWS, BASE } from './config.js';
import { HAPTICS, vibe } from './haptics.js';
import { stopMusic, startMusic, sfxGameOver } from './audio.js';
import { updateHUD, updateBoosterUI, showToast } from './hud.js';
import { saveBoosters } from './boosters.js';
import { nextBag, fromBag, spawnPiece } from './pieces.js';
import { drawCell } from './rendering.js';
import { getTotalXP, getRankFromXP, addXP, updateRankBar, checkRankUp } from './rank.js';
import { loadSettings, applySettings, detectLang, saveSetting, updateSliderFill } from './settings.js';
import { isMusicOn } from './audio.js';
import { isFirstVisit, showTutorial, dismissBubble } from './tutorial.js';
import { loop } from './game-loop.js';
import { showFomo, incPartiesCount, showMoneyBar } from './monetization.js';

// ── Leaderboard helpers ──

/** @description Get saved pseudo */
export function getPseudo() { return localStorage.getItem('tb_pseudo') || ''; }

/** @description Save pseudo to localStorage */
export function savePseudo(p) { localStorage.setItem('tb_pseudo', p.trim().substring(0, 20)); }

/** @description Escape HTML entities */
export function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * @description Resize the canvas to fit the available space
 */
export function resize() {
  const wrap = document.getElementById('canvas-wrap');
  const availW = Math.floor(wrap.clientWidth * 0.90);
  const availH = wrap.clientHeight;
  const cellByW = Math.floor(availW / COLS);
  const cellByH = Math.floor(availH / ROWS);
  S.CELL = Math.min(cellByW, cellByH);
  S.canvas.width = COLS * S.CELL;
  S.canvas.height = ROWS * S.CELL;
  S.canvas.style.width = S.canvas.width + 'px';
  S.canvas.style.height = S.canvas.height + 'px';
}

/**
 * @description Initialize game state for a new game
 */
export function init() {
  S.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  S.score = 0; S.lines = 0; S.level = 1; S.combo = 1;
  S.bestScore = parseInt(localStorage.getItem('tb') || '0');
  S.freezeActive = false; S.freezeTimer = 0;

  const saved = localStorage.getItem('tb_boosters');
  if (saved) {
    S.boosters = JSON.parse(saved);
    const bonus = getRankFromXP(getTotalXP()).boostersBonus;
    if (bonus > 0 && !localStorage.getItem('tb_rank_bonus_applied')) {
      Object.keys(S.boosters).forEach(k => { S.boosters[k] = (S.boosters[k] || 0) + bonus; });
      localStorage.setItem('tb_rank_bonus_applied', '1');
      saveBoosters();
    }
  } else {
    S.boosters = { freeze: 10, laser: 10, meteor: 10, magnet: 10 };
    saveBoosters();
    showToast('🎁 Bienvenue ! Tu reçois 10 boosters de chaque type !');
  }

  S.particles = []; S.meteorites = []; S.laserBeams = [];
  S.freezeFlakes = []; S.freezeCrystals = [];
  S.laserBeams = []; S.laserFlash = null;
  S.magnetWaves = []; S.magnetTrails = [];
  S.shockwaves = []; S.emberParts = [];
  S.lvlUpActive = false; S.lvlUpTimer = 0; S.fireworks = []; S.lvlBanner = null; S.lvlFlash = 0;
  S.lvlUpTimeouts.forEach(id => clearTimeout(id)); S.lvlUpTimeouts = [];
  S.goActive = false; S.goDebris = []; S.goPhase = 0; S.goFlash = 0;
  S.dropInterval = BASE; S.dropTimer = 0; S.lastTime = null;
  S.paused = false; S.gameOver = false; S.running = true;
  S.canHold = true; S.held = null;

  nextBag();
  S.nextPiece = fromBag();
  spawnPiece();
  updateHUD();
  updateBoosterUI();
}

/**
 * @description Start a new game (called from the start overlay button)
 */
export function startGame() {
  document.getElementById('ov-start').style.display = 'none';
  document.getElementById('ov-gameover').style.display = 'none';
  document.getElementById('rank-up-overlay').style.display = 'none';
  dismissBubble();
  updateRankBar();
  stopMusic();

  if (isFirstVisit()) {
    showTutorial();
  } else {
    requestAnimationFrame(() => { resize(); init(); startMusic(); requestAnimationFrame(loop); });
  }
}

/**
 * @description End the current game (called when a piece can't spawn)
 */
export function endGame() {
  S.gameOver = true;
  S.running = false;

  const prev = parseInt(localStorage.getItem('tb') || '0');
  if (S.score > prev) {
    localStorage.setItem('tb', S.score);
    document.getElementById('new-best').style.display = 'block';
  } else {
    document.getElementById('new-best').style.display = 'none';
  }

  const { prev: prevXP, next: newXP } = addXP(S.score);
  updateRankBar();
  checkRankUp(prevXP, newXP);

  document.getElementById('final-score').textContent = S.score.toLocaleString();
  document.getElementById('xp-earned').textContent = '+' + S.score.toLocaleString() + ' XP';

  vibe(HAPTICS.gameOver);
  stopMusic();
  sfxGameOver();
  startGameOverAnim();

  setTimeout(() => showFomo(), 800);
}

/**
 * @description Toggle pause on/off
 */
export function togglePause() {
  if (!S.running || S.gameOver) return;
  S.paused = !S.paused;
  if (S.paused) {
    const s = loadSettings();
    document.getElementById('set-pseudo').value = getPseudo() || '';
    document.getElementById('set-sound').checked = s.sound;
    document.getElementById('set-vibro').checked = s.vibro;
    const musicEl = document.getElementById('set-music');
    if (musicEl) musicEl.checked = isMusicOn();
    document.getElementById('set-theme').checked = s.theme === 'light';
    document.getElementById('set-move').value = s.moveSens;
    document.getElementById('set-drop').value = s.dropSens;
    document.getElementById('val-move').textContent = s.moveSens;
    document.getElementById('val-drop').textContent = s.dropSens;
    updateSliderFill('set-move', s.moveSens);
    updateSliderFill('set-drop', s.dropSens);
    document.querySelectorAll('.set-lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === s.lang);
    });
    const pb = document.getElementById('pause-btn');
    if (pb) pb.textContent = '▶';
    const ov = document.getElementById('ov-pause');
    ov.style.display = 'flex';
    requestAnimationFrame(() => ov.classList.add('open'));
  } else {
    const pb = document.getElementById('pause-btn');
    if (pb) pb.textContent = '⏸';
    S.lastTime = null;
    const ov = document.getElementById('ov-pause');
    ov.classList.remove('open');
    setTimeout(() => { ov.style.display = 'none'; }, 380);
  }
}

/**
 * @description Show the game-over overlay card
 */
export function showGameOverOverlay() {
  const card = document.querySelector('#ov-gameover .ov-card');
  document.getElementById('ov-gameover').style.display = 'flex';
  if (card) {
    card.style.animation = 'none';
    card.offsetHeight;
    card.style.animation = 'goCardIn .4s cubic-bezier(0.34,1.56,0.64,1) forwards';
  }
  incPartiesCount();
  showMoneyBar();
  setTimeout(() => promptScore(S.score), 900);
}

// ── Game-over animation ──

function startGameOverAnim() {
  S.goActive = true;
  S.goTimer = 0;
  S.goPhase = 0;
  S.goFlash = 1.0;
  S.goDebris = [];
  S.goColDone = 0;
  S.goColTimer = 0;

  document.getElementById('canvas-wrap').classList.add('shake');
  setTimeout(() => document.getElementById('canvas-wrap').classList.remove('shake'), 400);
  requestAnimationFrame(goLoop);
}

function goLoop(ts) {
  if (!S.goActive) return;
  S.goTimer += 16;

  if (S.goPhase === 0) {
    S.goFlash = Math.max(0, 1 - S.goTimer / 400);
    if (S.goTimer >= 400) { S.goPhase = 1; S.goColTimer = 0; }
  }

  if (S.goPhase === 1) {
    S.goColTimer += 16;
    const colToExplode = Math.floor(S.goColTimer / 80);
    if (colToExplode > S.goColDone && S.goColDone < COLS) {
      const col = S.goColDone;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (S.grid[r][col]) {
          const color = S.grid[r][col];
          for (let i = 0; i < 6; i++) {
            const a = Math.random() * Math.PI * 2;
            const sp = 2 + Math.random() * 6;
            S.goDebris.push({
              x: col * S.CELL + S.CELL / 2 + (Math.random() - 0.5) * S.CELL,
              y: r * S.CELL + S.CELL / 2,
              vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2,
              color, size: 4 + Math.random() * 6,
              life: 800 + Math.random() * 400, maxLife: 1200,
              rot: Math.random() * Math.PI * 2,
              rotV: (Math.random() - 0.5) * 0.15
            });
          }
          S.grid[r][col] = 0;
        }
      }
      S.goColDone++;
    }
    if (S.goColDone >= COLS || S.goColTimer >= 1000) S.goPhase = 2;
  }

  S.goDebris = S.goDebris.filter(d => {
    d.x += d.vx; d.y += d.vy;
    d.vy += 0.25; d.vx *= 0.96;
    d.rot += d.rotV;
    d.life -= 16;
    return d.life > 0;
  });

  drawGameOverAnim();

  if (S.goPhase < 2 || S.goDebris.length > 0) {
    requestAnimationFrame(goLoop);
  } else {
    S.goActive = false;
    showGameOverOverlay();
  }
}

function drawGameOverAnim() {
  const { ctx, canvas, grid } = S;
  const CELL = S.CELL;
  ctx.fillStyle = '#06080f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (grid[r][c]) drawCell(ctx, c * CELL, r * CELL, grid[r][c]);

  S.goDebris.forEach(d => {
    const a = d.life / d.maxLife;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(d.x, d.y);
    ctx.rotate(d.rot);
    ctx.shadowColor = d.color; ctx.shadowBlur = 8;
    const s = d.size * Math.max(0.2, a);
    const r2 = s * 0.2;
    ctx.fillStyle = d.color;
    ctx.beginPath();
    ctx.roundRect(-s / 2, -s / 2, s, s, r2);
    ctx.fill();
    ctx.restore();
  });

  if (S.goFlash > 0) {
    ctx.save();
    ctx.globalAlpha = S.goFlash * 0.65;
    const grd = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, Math.max(1, canvas.width)
    );
    grd.addColorStop(0, 'rgba(255,40,20,0.9)');
    grd.addColorStop(1, 'rgba(180,0,0,0.3)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  if (S.goPhase >= 1) {
    ctx.save();
    const vgrd = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, Math.max(0, canvas.width * 0.2),
      canvas.width / 2, canvas.height / 2, Math.max(1, canvas.width * 0.8)
    );
    vgrd.addColorStop(0, 'rgba(0,0,0,0)');
    vgrd.addColorStop(1, 'rgba(0,0,0,0.7)');
    ctx.fillStyle = vgrd;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }
}

// ── Leaderboard ──

export function openLeaderboard() {
  document.getElementById('ov-leaderboard').style.display = 'flex';
  loadLeaderboard(S.lbMode);
}

export function closeLeaderboard() {
  document.getElementById('ov-leaderboard').style.display = 'none';
}

export function switchTab(mode) {
  S.lbMode = mode;
  document.getElementById('tab-all').classList.toggle('active', mode === 'all');
  document.getElementById('tab-weekly').classList.toggle('active', mode === 'weekly');
  loadLeaderboard(mode);
}

async function loadLeaderboard(mode) {
  const body = document.getElementById('lb-body');
  body.innerHTML = '<div class="lb-loading">Chargement…</div>';
  const myPseudo = getPseudo();
  const myBest = parseInt(localStorage.getItem('tb') || '0');
  let rows = [];
  if (typeof window.fetchLeaderboard === 'function') {
    rows = await window.fetchLeaderboard(mode);
  }
  if (!rows.length) {
    body.innerHTML = '<div class="lb-empty">Aucun score encore.<br>Sois le premier ! 🚀</div>';
    return;
  }
  const byPseudo = {};
  rows.forEach(r => {
    if (!byPseudo[r.pseudo] || r.score > byPseudo[r.pseudo].score) byPseudo[r.pseudo] = r;
  });
  const sorted = Object.values(byPseudo).sort((a, b) => b.score - a.score).slice(0, 100);
  const myPos = myPseudo ? sorted.findIndex(r => r.pseudo === myPseudo) : -1;
  const rankIcon = (i) => i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
  const rankCls = (i) => i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
  let html = '';
  sorted.forEach((r, i) => {
    const isMe = r.pseudo === myPseudo;
    html += `<div class="lb-row ${isMe ? 'me' : ''}">
      <span class="lb-rank ${rankCls(i)}">${rankIcon(i)}</span>
      <span class="lb-pseudo">${escHtml(r.pseudo)}</span>
      <span class="lb-score">${r.score.toLocaleString()}</span>
    </div>`;
  });
  if (myPseudo && myPos === -1 && myBest > 0) {
    const totalAbove = sorted.filter(r => r.score > myBest).length;
    html += `<div class="lb-sep">· · · · · ·</div>
    <div class="lb-row me">
      <span class="lb-rank">${totalAbove + 1}</span>
      <span class="lb-pseudo">${escHtml(myPseudo)} (toi)</span>
      <span class="lb-score">${myBest.toLocaleString()}</span>
    </div>`;
  }
  body.innerHTML = html;
}

function promptScore(scoreVal) {
  const pseudo = getPseudo();
  S.pendingScore = scoreVal;
  if (pseudo) {
    submitScoreNow(pseudo, scoreVal);
  } else {
    const inp = document.getElementById('pseudo-input');
    inp.value = '';
    inp.style.borderColor = '';
    document.getElementById('pseudo-msg').textContent = 'Choisis un pseudo pour apparaître dans le classement mondial';
    document.getElementById('pseudo-change').style.display = 'none';
    document.getElementById('ov-pseudo').style.display = 'flex';
    setTimeout(() => inp.focus(), 100);
  }
}

async function submitScoreNow(pseudo, score) {
  savePseudo(pseudo);
  if (typeof window.submitScore === 'function') {
    await window.submitScore(pseudo, score, true);
    await window.submitScore(pseudo, score, false);
  }
}

export function confirmScore() {
  const input = document.getElementById('pseudo-input');
  const pseudo = input.value.trim();
  if (!pseudo) { input.style.borderColor = '#ff4040'; return; }
  document.getElementById('ov-pseudo').style.display = 'none';
  submitScoreNow(pseudo, S.pendingScore);
  S.pendingScore = null;
}

export function skipScore() {
  document.getElementById('ov-pseudo').style.display = 'none';
  S.pendingScore = null;
}

export function resetPseudo() {
  localStorage.removeItem('tb_pseudo');
  const inp = document.getElementById('pseudo-input');
  inp.value = '';
  inp.style.borderColor = '';
  document.getElementById('pseudo-msg').textContent = 'Nouveau pseudo :';
  document.getElementById('pseudo-change').style.display = 'none';
  inp.focus();
}

// ── Settings callbacks ──

export function openSettings() { if (S.running && !S.gameOver) togglePause(); }
export function closeSettings() { if (S.paused) togglePause(); }

export function handleSheetBackdrop(e) {
  if (e.target === document.getElementById('ov-pause')) togglePause();
}

export function quitGame() {
  const ov = document.getElementById('ov-pause');
  ov.classList.remove('open');
  setTimeout(() => {
    ov.style.display = 'none';
    S.paused = false; S.gameOver = true; S.running = false;
    stopMusic();
    document.getElementById('ov-start').style.display = 'flex';
  }, 380);
}

export function savePseudoSettings() {
  const val = document.getElementById('set-pseudo').value.trim();
  if (val) { savePseudo(val); showToast('✓ Pseudo sauvegardé !'); }
}
