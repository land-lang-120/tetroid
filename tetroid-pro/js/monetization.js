/** @module monetization - Shop, wheel, ads, chest, FOMO system */

import { S } from './state.js';
import { COLS, PACKS, WHEEL_PRIZES, FOMO_DUR, RING_CIRC, CHEST_EVERY } from './config.js';
import { addBooster, saveBoosters } from './boosters.js';
import { showToast, updateHUD } from './hud.js';
import { vibe } from './haptics.js';
import { TRANSLATIONS } from './translations.js';
import { detectLang } from './settings.js';
import { startMusic, stopMusic } from './audio.js';
import { loop } from './game-loop.js';

// ── Money overlay helpers ──

/** @description Show the money bar */
export function showMoneyBar() { document.getElementById('money-bar').style.display = 'flex'; }

/** @description Hide the money bar */
export function hideMoneyBar() { document.getElementById('money-bar').style.display = 'none'; }

/** @description Open a monetization overlay by id */
export function openMoneyOv(id) {
  document.getElementById(id).classList.add('visible');
  if (id === 'ov-wheel') drawWheel();
  if (id === 'ov-chest') prepareChest();
  if (S.running && !S.gameOver && !S.paused) {
    S.paused = true;
    S.pausedByShop = true;
  }
}

/** @description Close a monetization overlay by id */
export function closeMoneyOv(id) {
  document.getElementById(id).classList.remove('visible');
  if (id === 'ov-shop') {
    clearInterval(S.wheelCountdownInterval);
    S.wheelCountdownInterval = null;
  }
  const anyOpen = ['ov-shop', 'ov-wheel', 'ov-ad', 'ov-chest'].some(
    oid => document.getElementById(oid)?.classList.contains('visible')
  );
  if (!anyOpen && S.pausedByShop) {
    S.paused = false;
    S.pausedByShop = false;
  }
}

// ── FOMO ──

/** @description Show the FOMO continue-via-ad overlay */
export function showFomo() {
  const fs = document.getElementById('fomo-score');
  const fc = document.getElementById('fomo-countdown');
  const fs2 = document.getElementById('fomo-sec');
  const fr = document.getElementById('fomo-ring-fg');
  const ov = document.getElementById('ov-fomo');
  if (!ov) { showGameOverOverlayFallback(); return; }
  if (fs)  fs.textContent = S.score.toLocaleString();
  if (fc)  fc.textContent = FOMO_DUR;
  if (fs2) fs2.textContent = FOMO_DUR;
  if (fr)  fr.style.strokeDashoffset = '0';
  ov.style.display = 'flex';
  S.fomoSeconds = FOMO_DUR;
  clearInterval(S.fomoTimer);
  S.fomoTimer = setInterval(() => {
    S.fomoSeconds--;
    if (fc)  fc.textContent = S.fomoSeconds;
    if (fs2) fs2.textContent = S.fomoSeconds;
    if (fr) {
      const offset = RING_CIRC * (1 - S.fomoSeconds / FOMO_DUR);
      fr.style.strokeDashoffset = offset;
    }
    if (S.fomoSeconds <= 0) {
      clearInterval(S.fomoTimer);
      fomoSkip();
    }
  }, 1000);
}

function showGameOverOverlayFallback() {
  // Imported lazily to avoid circular — game-flow handles this
  import('./game-flow.js').then(m => m.showGameOverOverlay());
}

/** @description Watch ad via FOMO overlay then continue game */
export function fomoWatchAd() {
  clearInterval(S.fomoTimer);
  const fomoOv = document.getElementById('ov-fomo');
  if (fomoOv) fomoOv.style.display = 'none';
  openMoneyOv('ov-ad');
  const lbl = document.getElementById('ad-lbl');
  const brand = document.getElementById('ad-brand');
  const count = document.getElementById('ad-count');
  const fill = document.getElementById('ad-fill');
  const btn = document.getElementById('ad-btn');
  if (lbl)   lbl.textContent = 'PUBLICITÉ';
  if (brand) brand.textContent = '🎮';
  if (count) count.textContent = '5';
  if (fill)  fill.style.width = '0%';
  if (btn)   btn.style.display = 'none';
  S.adSec = 5;
  clearInterval(S.adTimer);
  const colors = ['#1a237e', '#b71c1c', '#1b5e20', '#e65100', '#4a148c'];
  const brands = ['🚀', '🎯', '💡', '🏆', '🎮'];
  let frame = 0;
  const screen = document.getElementById('ad-screen');
  S.adTimer = setInterval(() => {
    if (screen) screen.style.background = colors[frame % colors.length];
    if (brand) brand.textContent = brands[frame % brands.length];
    frame++;
    S.adSec--;
    if (count) count.textContent = S.adSec > 0 ? S.adSec : '✅';
    if (fill) fill.style.width = ((5 - Math.max(S.adSec, 0)) / 5 * 100) + '%';
    if (S.adSec <= 0) {
      clearInterval(S.adTimer);
      closeMoneyOv('ov-ad');
      continueAfterFomo();
    }
  }, 1000);
}

function continueAfterFomo() {
  for (let c = 0; c < COLS; c++) S.grid[0][c] = 0;
  S.gameOver = false;
  S.running = true;
  document.getElementById('ov-gameover').style.display = 'none';
  startMusic();
  requestAnimationFrame(loop);
  showToast('🎉 Partie continuée ! Bonne chance !');
}

/** @description Skip FOMO and show game over overlay */
export function fomoSkip() {
  clearInterval(S.fomoTimer);
  document.getElementById('ov-fomo').style.display = 'none';
  import('./game-flow.js').then(m => m.showGameOverOverlay());
}

// ── SHOP ──

function updateWheelCountdown() {
  const last = parseInt(localStorage.getItem('tb_wheel_last') || '0');
  const diff = 86400000 - (Date.now() - last);
  const el = document.getElementById('wheel-countdown');
  const banner = document.getElementById('shop-wheel-banner');
  const lang = localStorage.getItem('tb_lang') || detectLang();
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  if (!el) return;
  if (diff <= 0) {
    el.style.color = '#ffcc00';
    el.style.fontSize = '.78rem';
    el.textContent = t.wh_banner_btn || 'SPIN';
    if (banner) { banner.classList.remove('disabled'); banner.style.pointerEvents = ''; }
    clearInterval(S.wheelCountdownInterval);
    S.wheelCountdownInterval = null;
  } else {
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    el.style.color = 'rgba(255,255,255,.45)';
    el.style.fontSize = '.7rem';
    el.textContent = `⏳ ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    if (banner) { banner.classList.add('disabled'); banner.style.pointerEvents = 'none'; }
  }
}

/** @description Open the shop overlay */
export function openShop() {
  const b = document.getElementById('shop-btn-badge');
  if (b) b.style.display = 'none';
  openMoneyOv('ov-shop');
  updateWheelCountdown();
  clearInterval(S.wheelCountdownInterval);
  S.wheelCountdownInterval = setInterval(updateWheelCountdown, 1000);
}

/**
 * @description Buy a booster pack
 * @param {string} type - Pack key from PACKS
 */
export function buyPack(type) {
  const p = PACKS[type];
  Object.entries(p).forEach(([k, v]) => { if (v > 0) addBooster(k, v); });
  closeMoneyOv('ov-shop');
  showToast('Achat simulé ! Boosters ajoutés 🎉');
}

// ── WHEEL ──

/**
 * @description Draw the fortune wheel on the wheel canvas
 * @param {number} [angle=0] - Current rotation angle
 */
export function drawWheel(angle = 0) {
  const c = document.getElementById('wheel-canvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  const cx = 120, cy = 120, r = 115;
  const slice = (Math.PI * 2) / WHEEL_PRIZES.length;
  ctx.clearRect(0, 0, 240, 240);

  ctx.beginPath();
  ctx.arc(cx, cy, r + 3, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(245,197,24,0.6)';
  ctx.lineWidth = 4;
  ctx.stroke();

  WHEEL_PRIZES.forEach((p, i) => {
    const a = angle + i * slice;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, a, a + slice); ctx.closePath();
    ctx.fillStyle = p.color; ctx.fill();
    try {
      const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, r);
      grad.addColorStop(0, 'rgba(255,255,255,0.18)');
      grad.addColorStop(1, 'rgba(0,0,0,0.15)');
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, a, a + slice); ctx.closePath();
      ctx.fillStyle = grad; ctx.fill();
    } catch (e) {}
    ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(a + slice / 2);
    ctx.textAlign = 'right';
    ctx.font = 'bold 13px Lilita One,sans-serif';
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 4;
    ctx.fillText(p.label, r - 10, 5);
    ctx.restore();
  });

  // Center disc
  ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2);
  try {
    const cg = ctx.createRadialGradient(cx, cy, 2, cx, cy, 20);
    cg.addColorStop(0, '#fff7a0'); cg.addColorStop(1, '#c87000');
    ctx.fillStyle = cg;
  } catch (e) { ctx.fillStyle = '#ffcc00'; }
  ctx.fill();
  ctx.strokeStyle = '#7a4000'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#3a1800';
  ctx.font = 'bold 11px Lilita One,sans-serif';
  ctx.textAlign = 'center'; ctx.shadowBlur = 0;
  ctx.fillText('GO', cx, cy + 4);
}

/** @description Open the wheel overlay */
export function openWheel() {
  const last = parseInt(localStorage.getItem('tb_wheel_last') || '0');
  const now = Date.now();
  openMoneyOv('ov-wheel');
  const btn = document.getElementById('wheel-spin-btn');
  const res = document.getElementById('wheel-result');
  if (now - last < 86400000) {
    const h = Math.ceil((86400000 - (now - last)) / 3600000);
    btn.disabled = true;
    btn.textContent = `⏳ Recharge dans ${h}h`;
    res.textContent = '';
  } else {
    btn.disabled = false;
    btn.textContent = '🎰 Lancer la roue !';
    res.textContent = '';
  }
}

/** @description Spin the fortune wheel with animation */
export function spinWheel() {
  if (S.wheelSpinning) return;
  S.wheelSpinning = true;
  document.getElementById('wheel-spin-btn').disabled = true;
  const prize = WHEEL_PRIZES[Math.floor(Math.random() * WHEEL_PRIZES.length)];
  const slice = (Math.PI * 2) / WHEEL_PRIZES.length;
  const targetIdx = WHEEL_PRIZES.indexOf(prize);
  const spins = 5 + Math.random() * 3;
  const target = spins * Math.PI * 2 + (Math.PI * 2 - targetIdx * slice - slice / 2);
  const dur = 3500;
  const start = performance.now();
  const from = S.wheelAngle;

  function step(now) {
    const t = Math.min((now - start) / dur, 1);
    const ease = 1 - Math.pow(1 - t, 4);
    S.wheelAngle = from + target * ease;
    drawWheel(S.wheelAngle);
    if (t < 1) { requestAnimationFrame(step); }
    else {
      S.wheelSpinning = false;
      if (prize.type === 'none') {
        document.getElementById('wheel-result').textContent = '😔 Pas de chance cette fois-ci ! Retente demain !';
        vibe([50, 50, 50]);
      } else {
        addBooster(prize.type, prize.qty);
        document.getElementById('wheel-result').textContent = `🎉 Tu gagnes ${prize.label} !`;
      }
      localStorage.setItem('tb_wheel_last', Date.now().toString());
      document.getElementById('wheel-spin-btn').textContent = '✓ À demain !';
    }
  }
  requestAnimationFrame(step);
}

// ── AD ──

/** @description Open the ad overlay */
export function openAd() {
  openMoneyOv('ov-ad');
  document.getElementById('ad-count').textContent = '5';
  document.getElementById('ad-fill').style.width = '0%';
  document.getElementById('ad-btn').style.display = 'block';
  document.getElementById('ad-btn').textContent = '▶ Regarder maintenant';
  S.adSec = 5;
  clearInterval(S.adTimer);
}

/** @description Close the ad overlay */
export function closeAd() {
  clearInterval(S.adTimer);
  closeMoneyOv('ov-ad');
}

/** @description Start playing the simulated ad */
export function startAd() {
  document.getElementById('ad-btn').style.display = 'none';
  S.adSec = 5;
  const brands = ['🚀', '🎯', '💡', '🏆', '🎮'];
  const colors = ['#1a237e', '#b71c1c', '#1b5e20', '#e65100', '#4a148c'];
  let frame = 0;
  const screen = document.getElementById('ad-screen');
  const brand = document.getElementById('ad-brand');
  S.adTimer = setInterval(() => {
    screen.style.background = colors[frame % colors.length];
    brand.textContent = brands[frame % brands.length];
    frame++;
    S.adSec--;
    document.getElementById('ad-count').textContent = S.adSec > 0 ? S.adSec : '🎁';
    document.getElementById('ad-fill').style.width = ((5 - Math.max(S.adSec, 0)) / 5 * 100) + '%';
    if (S.adSec <= 0) {
      clearInterval(S.adTimer);
      screen.style.background = 'linear-gradient(135deg,#1b5e20,#2e7d32)';
      brand.textContent = '🎁';
      const types = ['freeze', 'laser', 'meteor', 'magnet'];
      const icons = { freeze: '❄️', laser: '⚡', meteor: '☄️', magnet: '🧲' };
      const won = types[Math.floor(Math.random() * types.length)];
      addBooster(won, 1);
      document.getElementById('ad-lbl').textContent = 'RÉCOMPENSE !';
      const btn = document.getElementById('ad-btn');
      btn.style.display = 'block';
      btn.textContent = `✓ +1 ${icons[won]} Récupéré !`;
      btn.style.background = 'linear-gradient(180deg,#ffcc00,#ff9500)';
      btn.style.color = '#3a1800';
      btn.onclick = () => closeAd();
    }
  }, 1000);
}

// ── CHEST ──

/** @description Get the number of games played */
export function getPartiesCount() { return parseInt(localStorage.getItem('tb_parties') || '0'); }

/** @description Increment games played, show chest/badge notifications */
export function incPartiesCount() {
  const n = getPartiesCount() + 1;
  localStorage.setItem('tb_parties', n);
  if (n % CHEST_EVERY === 0) showChestNotif();
  if (n % 3 === 0) {
    const b = document.getElementById('shop-btn-badge');
    if (b) b.style.display = 'block';
  }
  return n;
}

function showChestNotif() {
  const el = document.getElementById('chest-notif');
  if (el) el.style.display = 'flex';
}

/** @description Open the chest overlay */
export function openChest() { openMoneyOv('ov-chest'); }

function prepareChest() {
  const n = getPartiesCount();
  const ready = n > 0 && n % CHEST_EVERY === 0;
  const icon = document.getElementById('chest-icon');
  const sub = document.getElementById('chest-sub');
  const btn = document.getElementById('chest-open-btn');
  const rew = document.getElementById('chest-rewards');
  rew.innerHTML = '';
  if (ready) {
    icon.textContent = '🎁';
    sub.textContent = 'Coffre disponible ! Ouvre-le pour récupérer tes récompenses.';
    btn.disabled = false;
  } else {
    const left = CHEST_EVERY - (n % CHEST_EVERY);
    icon.textContent = '📦';
    sub.textContent = `Plus que ${left} partie${left > 1 ? 's' : ''} avant le prochain coffre !`;
    btn.disabled = true;
    btn.textContent = `⏳ Encore ${left} partie${left > 1 ? 's' : ''}`;
  }
}

/** @description Open the chest and award random boosters */
export function openChestReward() {
  const types = ['freeze', 'laser', 'meteor', 'magnet'];
  const icons = { freeze: '❄️', laser: '⚡', meteor: '☄️', magnet: '🧲' };
  const names = { freeze: 'Freeze', laser: 'Laser', meteor: 'Météorite', magnet: 'Aimant' };
  const rewards = [];
  const nb = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < nb; i++) {
    const t = types[Math.floor(Math.random() * types.length)];
    const q = 1 + Math.floor(Math.random() * 2);
    rewards.push({ type: t, qty: q });
    addBooster(t, q);
  }
  const rew = document.getElementById('chest-rewards');
  rew.innerHTML = rewards.map(r => `
    <div class="chest-item">
      <span class="ci-ico">${icons[r.type]}</span>
      <span class="ci-qty">${names[r.type]} ×${r.qty}</span>
    </div>
  `).join('');
  document.getElementById('chest-icon').textContent = '✨';
  document.getElementById('chest-sub').textContent = 'Récompenses obtenues !';
  document.getElementById('chest-open-btn').textContent = '🎉 Récupéré !';
  document.getElementById('chest-open-btn').disabled = true;
  document.getElementById('chest-notif').style.display = 'none';
  localStorage.setItem('tb_parties', '0');
}
