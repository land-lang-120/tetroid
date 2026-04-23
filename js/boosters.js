/** @module boosters - Booster activation: freeze, laser, meteor, magnet + VFX */

import { S } from './state.js';
import { COLS, ROWS, BASE, BOOSTER_DESC } from './config.js';
import { HAPTICS, vibe } from './haptics.js';
import { sfxBooster } from './audio.js';
import { showToast, updateHUD, updateBoosterUI } from './hud.js';
import { clearLinesSilent } from './core.js';
import { addShockwave, addExplosion, spawnEmbers } from './particles.js';

// ── Save / Add helpers ──

/** @description Persist booster quantities to localStorage */
export function saveBoosters() {
  localStorage.setItem('tb_boosters', JSON.stringify(S.boosters));
}

/**
 * @description Add boosters of a given type
 * @param {string} type - Booster type
 * @param {number} [qty=1] - Quantity to add
 */
export function addBooster(type, qty = 1) {
  S.boosters[type] = (S.boosters[type] || 0) + qty;
  updateHUD();
  saveBoosters();
}

/** @description Show booster description toast (once per type) */
function maybeShowBoosterToast(type) {
  const key = 'tb_seen_' + type;
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, '1');
    showToast(BOOSTER_DESC[type]);
  }
}

/**
 * @description Activate a booster by type (consumes 1 unit)
 * @param {string} type - 'freeze'|'laser'|'meteor'|'magnet'
 */
export function activateBooster(type) {
  if (!S.running || S.gameOver || S.paused) return;
  if (!S.boosters[type] || S.boosters[type] <= 0) {
    showToast('⚠️ Plus de ' + type.toUpperCase() + ' ! Ouvre la boutique 🛒');
    vibe([30]);
    return;
  }
  S.boosters[type]--;
  saveBoosters();
  updateBoosterUI();
  vibe(HAPTICS.booster);
  sfxBooster(type);

  if (type === 'freeze') {
    S.freezeActive = true;
    S.freezeTimer = 20000;
    S.dropInterval = BASE;
    document.getElementById('freeze-overlay').style.display = 'block';
    spawnFreezeEffects();
    maybeShowBoosterToast('freeze');
  } else if (type === 'laser') {
    laserBlast();
    maybeShowBoosterToast('laser');
  } else if (type === 'meteor') {
    launchMeteor();
    maybeShowBoosterToast('meteor');
  } else if (type === 'magnet') {
    spawnMagnetWaves();
    gravityPull();
    maybeShowBoosterToast('magnet');
  }
}

// ── MAGNET ──

function gravityPull() {
  const btn = document.getElementById('bi-magnet');
  btn.classList.add('active');
  setTimeout(() => btn.classList.remove('active'), 1600);

  let bricksBefore = 0;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (S.grid[r][c]) bricksBefore++;

  let pass = 0;
  const maxPasses = ROWS;

  function applyOnePass() {
    let moved = false;
    for (let r = ROWS - 2; r >= 0; r--) {
      for (let c = 0; c < COLS; c++) {
        if (S.grid[r][c] && !S.grid[r + 1][c]) {
          addMagnetTrail(c * S.CELL + S.CELL / 2, r * S.CELL + S.CELL / 2, S.grid[r][c]);
          S.grid[r + 1][c] = S.grid[r][c];
          S.grid[r][c] = 0;
          moved = true;
        }
      }
    }
    return moved;
  }

  function runPass() {
    const moved = applyOnePass();
    pass++;
    clearLinesSilent();
    if (moved && pass < maxPasses) {
      setTimeout(runPass, 35);
    } else {
      let bricksAfter = 0;
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (S.grid[r][c]) bricksAfter++;
      const fallen = bricksBefore - bricksAfter;
      if (fallen > 0) { S.score += fallen * 8; updateHUD(); }
    }
  }

  runPass();
}

// ── LASER ──

function laserBlast() {
  const targets = [];
  for (let r = ROWS - 1; r >= 0 && targets.length < 4; r--)
    if (S.grid[r].some(c => c)) targets.push(r);
  if (targets.length === 0) return;

  const rows = [...targets];
  S.laserFlash = { alpha: 0.85, decay: 0.06 };

  rows.forEach((row, i) => {
    setTimeout(() => {
      S.laserBeams.push({
        y: row * S.CELL + S.CELL / 2,
        row, x: 0, life: 520, maxLife: 520,
        sweepDone: false, erased: false
      });
    }, i * 80);
  });

  const sweepMs = Math.round((1 / 0.055) * (1000 / 60));
  const totalMs = (rows.length - 1) * 80 + sweepMs + 60;

  setTimeout(() => {
    rows.forEach(r => {
      S.grid[r].forEach(c => { if (c) S.score += 12; });
      S.grid[r] = Array(COLS).fill(0);
    });
    S.lines += rows.length;
    S.level = Math.floor(S.lines / 15) + 1;
    S.dropInterval = Math.max(80, Math.round(BASE * Math.pow(0.95, S.level - 1)));
    updateHUD();

    let pass = 0;
    function applyLaserGravity() {
      let moved = false;
      for (let r = ROWS - 2; r >= 0; r--) {
        for (let c = 0; c < COLS; c++) {
          if (S.grid[r][c] && !S.grid[r + 1][c]) {
            S.grid[r + 1][c] = S.grid[r][c];
            S.grid[r][c] = 0;
            moved = true;
          }
        }
      }
      pass++;
      if (moved && pass < ROWS) setTimeout(applyLaserGravity, 35);
    }
    applyLaserGravity();
  }, totalMs);
}

// ── METEOR ──

function launchMeteor() {
  for (let col = 0; col < COLS; col++) {
    const delay = col * 80;
    setTimeout(() => {
      S.meteorites.push({
        col, x: col * S.CELL + S.CELL / 2, y: -S.CELL,
        vy: S.CELL * 0.45, trail: [], impacted: false
      });
      spawnEmbers();
    }, delay);
  }
}

/**
 * @description Update meteor positions and impacts
 */
export function updateMeteors() {
  S.meteorites = S.meteorites.filter(m => {
    if (m.impacted) return false;
    m.trail.push({ x: m.x, y: m.y });
    if (m.trail.length > 22) m.trail.shift();
    m.y += m.vy;

    const col = m.col;
    let hitRow = -1;
    for (let r = 0; r < ROWS; r++) {
      if (S.grid[r][col]) { hitRow = r; break; }
    }
    const impactY = hitRow >= 0 ? hitRow * S.CELL : ROWS * S.CELL;

    if (m.y + S.CELL / 2 >= impactY) {
      m.impacted = true;
      if (hitRow >= 0) {
        for (let dr = 0; dr < 3; dr++) {
          const row = hitRow + dr;
          if (row < ROWS && S.grid[row][col]) {
            S.score += 15;
            S.grid[row][col] = 0;
          }
        }
        let filled = [];
        for (let r = 0; r < ROWS; r++) if (S.grid[r][col]) filled.push(S.grid[r][col]);
        for (let r = 0; r < ROWS; r++) S.grid[r][col] = 0;
        for (let i = 0; i < filled.length; i++) S.grid[ROWS - 1 - i][col] = filled[filled.length - 1 - i];
        addShockwave(m.x, hitRow * S.CELL);
        addExplosion(m.x, hitRow * S.CELL + S.CELL / 2, '#ffd740');
      } else {
        addShockwave(m.x, ROWS * S.CELL);
        addExplosion(m.x, ROWS * S.CELL - S.CELL / 2, '#ff8c00');
      }
      updateHUD();
      return false;
    }
    return true;
  });
}

// ── FREEZE VFX ──

function spawnFreezeEffects() {
  S.freezeFlakes = [];
  for (let i = 0; i < 4; i++) spawnOneFlake(true);
  S.freezeCrystals = [];
  for (let i = 0; i < 14; i++) {
    const side = i < 7 ? 0 : S.canvas.width;
    S.freezeCrystals.push({
      x: side,
      y: (i % 7) * (S.canvas.height / 7) + Math.random() * 20,
      size: 0,
      maxSize: 10 + Math.random() * 16,
      angle: (side === 0 ? 1 : -1) * (0.15 + Math.random() * 0.6)
    });
  }
}

function spawnOneFlake(random) {
  S.freezeFlakes.push({
    x: Math.random() * S.canvas.width,
    y: random ? Math.random() * S.canvas.height : -8,
    vy: 0.5 + Math.random() * 1.2,
    vx: (Math.random() - 0.5) * 0.6,
    size: 3 + Math.random() * 6,
    alpha: 0.5 + Math.random() * 0.5,
    rot: Math.random() * Math.PI * 2,
    rotV: (Math.random() - 0.5) * 0.04,
    wobble: Math.random() * Math.PI * 2,
    wobbleV: 0.02 + Math.random() * 0.03
  });
}

/** @description Update freeze visual effects */
export function updateFreezeEffects(dt) {
  if (!S.freezeActive) { S.freezeFlakes = []; S.freezeCrystals = []; return; }
  if (S.freezeFlakes.length < 5 && Math.random() < 0.04) spawnOneFlake(false);
  S.freezeFlakes = S.freezeFlakes.filter(f => {
    f.wobble += f.wobbleV;
    f.x += f.vx + Math.sin(f.wobble) * 0.4;
    f.y += f.vy;
    f.rot += f.rotV;
    return f.y < S.canvas.height + 10;
  });
  S.freezeCrystals.forEach(c => {
    if (c.size < c.maxSize) c.size += 0.5;
  });
}

/** @description Draw freeze overlay, crystals, and snowflakes */
export function drawFreezeEffects() {
  if (!S.freezeActive) return;
  const { ctx, canvas } = S;
  ctx.save();
  const ov = ctx.createLinearGradient(0, 0, 0, canvas.height);
  ov.addColorStop(0, 'rgba(168,240,255,0.12)');
  ov.addColorStop(1, 'rgba(100,200,255,0.04)');
  ctx.fillStyle = ov;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  S.freezeCrystals.forEach(c => {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.angle);
    ctx.shadowColor = '#a8f0ff'; ctx.shadowBlur = 10;
    ctx.strokeStyle = 'rgba(180,240,255,0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(c.size, 0); ctx.stroke();
    [0.45, -0.45, 0.7, -0.7].forEach(a => {
      const pos = c.size * (a > 0.5 ? 0.35 : 0.6);
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos + Math.cos(a) * c.size * 0.38, Math.sin(a) * c.size * 0.38);
      ctx.stroke();
    });
    ctx.restore();
  });

  S.freezeFlakes.forEach(f => {
    ctx.save();
    ctx.globalAlpha = f.alpha * 0.85;
    ctx.translate(f.x, f.y);
    ctx.rotate(f.rot);
    ctx.strokeStyle = '#d0f0ff';
    ctx.lineWidth = Math.max(0.8, f.size * 0.14);
    ctx.shadowColor = '#a8f0ff';
    ctx.shadowBlur = f.size * 1.2;
    for (let i = 0; i < 6; i++) {
      ctx.rotate(Math.PI / 3);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, f.size); ctx.stroke();
      const b = f.size * 0.45;
      ctx.beginPath(); ctx.moveTo(0, b); ctx.lineTo(f.size * 0.28, b + f.size * 0.22); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, b); ctx.lineTo(-f.size * 0.28, b + f.size * 0.22); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(220,245,255,0.9)';
    ctx.shadowBlur = 4;
    ctx.beginPath(); ctx.arc(0, 0, f.size * 0.12, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  });

  ctx.restore();
}

// ── LASER VFX ──

/** @description Update laser beam sweep and decay */
export function updateLaserBeams(dt) {
  if (S.laserFlash) {
    S.laserFlash.alpha -= S.laserFlash.decay;
    if (S.laserFlash.alpha <= 0) S.laserFlash = null;
  }
  S.laserBeams = S.laserBeams.filter(b => {
    b.life -= dt;
    if (!b.sweepDone) {
      b.x += S.canvas.width * 0.055;
      if (b.x >= S.canvas.width) b.sweepDone = true;
    }
    return b.life > 0;
  });
}

/** @description Draw laser beams and flash */
export function drawLaserBeams() {
  const { ctx, canvas } = S;
  const CELL = S.CELL;
  if (S.laserFlash && S.laserFlash.alpha > 0) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, S.laserFlash.alpha);
    ctx.fillStyle = 'rgba(255,80,80,0.18)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }
  S.laserBeams.forEach(b => {
    const a = b.life / b.maxLife;
    const cx2 = b.sweepDone ? canvas.width : b.x;
    ctx.save();
    ctx.globalAlpha = a * 0.25;
    ctx.fillStyle = 'rgba(255,40,40,1)';
    ctx.fillRect(0, b.y - CELL * 0.6, cx2, CELL * 1.2);
    const grd = ctx.createLinearGradient(0, b.y, cx2, b.y);
    grd.addColorStop(0, 'rgba(255,80,80,0)');
    grd.addColorStop(0.1, '#ff4040');
    grd.addColorStop(0.5, '#ffffff');
    grd.addColorStop(0.9, '#ff4040');
    grd.addColorStop(1, 'rgba(255,80,80,0)');
    ctx.globalAlpha = a;
    ctx.shadowColor = '#ff2020'; ctx.shadowBlur = 20;
    ctx.fillStyle = grd;
    ctx.fillRect(0, b.y - 3, cx2, 6);
    ctx.globalAlpha = a * 0.9;
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, b.y - 1, cx2, 2);
    if (!b.sweepDone) {
      for (let i = 0; i < 3; i++) {
        const sx = b.x * (0.7 + Math.random() * 0.3);
        const sy = b.y + (Math.random() - 0.5) * 12;
        ctx.globalAlpha = a * Math.random();
        ctx.fillStyle = '#fff';
        ctx.fillRect(sx - 1, sy - 1, 2 + Math.random() * 3, 2);
      }
    }
    ctx.restore();
  });
}

// ── MAGNET VFX ──

function spawnMagnetWaves() {
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      S.magnetWaves.push({
        r: 0, maxR: S.canvas.height, life: 900, maxLife: 900,
        x: S.canvas.width / 2, y: S.canvas.height
      });
    }, i * 120);
  }
}

function addMagnetTrail(x, y, color) {
  S.magnetTrails.push({ x, y, vy: -2, life: 400, maxLife: 400, color });
}

/** @description Update magnet wave and trail animations */
export function updateMagnetWaves(dt) {
  S.magnetWaves = S.magnetWaves.filter(w => { w.r += 4; w.life -= dt; return w.life > 0; });
  S.magnetTrails = S.magnetTrails.filter(t => { t.y += t.vy; t.vy += 0.1; t.life -= dt; return t.life > 0; });
}

/** @description Draw magnet wave arcs and falling trails */
export function drawMagnetWaves() {
  const { ctx } = S;
  S.magnetWaves.forEach(w => {
    const a = (w.life / w.maxLife) * 0.35;
    ctx.save();
    ctx.strokeStyle = `rgba(180,60,255,${a})`;
    ctx.lineWidth = 2;
    ctx.shadowColor = '#aa30ff'; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(w.x, w.y, w.r, Math.PI, 0); ctx.stroke();
    ctx.restore();
  });
  S.magnetTrails.forEach(t => {
    const a = t.life / t.maxLife;
    ctx.save();
    ctx.globalAlpha = a * 0.7;
    ctx.fillStyle = t.color;
    ctx.shadowColor = '#aa30ff'; ctx.shadowBlur = 8;
    ctx.fillRect(t.x - 2, t.y - 4, 4, 8);
    ctx.restore();
  });
}
