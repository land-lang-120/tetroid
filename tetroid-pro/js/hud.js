/** @module hud - HUD updates, toast notifications, floating score */

import { S } from './state.js';

/**
 * @description Update the heads-up display elements (score, level, combo, best)
 */
export function updateHUD() {
  document.getElementById('v-score').textContent = S.score.toLocaleString();
  document.getElementById('v-level').textContent = S.level;
  document.getElementById('v-combo').textContent = '×' + S.combo;
  document.getElementById('v-best').textContent = Math.max(S.score, S.bestScore).toLocaleString();
  document.getElementById('lvl-bar').style.width = ((S.lines % 15) / 15 * 100) + '%';
}

/**
 * @description Update booster quantity badges in the UI
 */
export function updateBoosterUI() {
  const types = ['freeze', 'laser', 'meteor', 'magnet'];
  types.forEach(t => {
    const el = document.querySelector(`.bb[onclick="activateBooster('${t}')"] .bcount`);
    if (!el) return;
    const qty = S.boosters[t] || 0;
    el.textContent = qty;
    el.classList.remove('inf');
    if (qty <= 0) {
      el.style.opacity = '0.4';
      el.style.color = '#ff4444';
    } else {
      el.style.opacity = '1';
      el.style.color = '';
    }
  });
}

/**
 * @description Show a temporary toast notification
 * @param {string} msg - Message text
 */
export function showToast(msg) {
  // Primary toast element
  const el = document.getElementById('toast');
  if (el) {
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => { if (el) el.style.display = 'none'; }, 2200);
    return;
  }
  // Fallback toast-notif
  let t = document.getElementById('toast-notif');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast-notif';
    t.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);'
      + 'background:rgba(20,10,0,.95);border:2px solid var(--gold);border-radius:20px;'
      + 'padding:8px 18px;font-family:Lilita One,sans-serif;font-size:.75rem;color:var(--gold-l);'
      + 'z-index:999;transition:opacity .3s;pointer-events:none;';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._to);
  t._to = setTimeout(() => { t.style.opacity = '0'; }, 2500);
}

/**
 * @description Show a floating score animation at a position
 * @param {string} text - Text to display (e.g. "+300")
 * @param {number} x - CSS left position
 * @param {number} y - CSS top position
 */
export function floatScore(text, x, y) {
  const el = document.createElement('div');
  el.className = 'fscore';
  el.textContent = text;
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1100);
}
