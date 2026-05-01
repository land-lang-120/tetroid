/** @module main - Entry point: import all modules, wire up globals, call init */

import { S } from './state.js';
import { COLS, ROWS } from './config.js';
import { initFirebase } from './firebase.js';
import { activateBooster } from './boosters.js';
import {
  startGame, togglePause, resize, openSettings, closeSettings,
  handleSheetBackdrop, quitGame, savePseudoSettings,
  openLeaderboard, closeLeaderboard, switchTab,
  confirmScore, skipScore, resetPseudo, getPseudo, savePseudo,
} from './game-flow.js';
import { onMusicToggle } from './audio.js';
import { setLang, onThemeToggle, onSlider, toggleTheme, applySettings, applyLang, detectLang, loadSettings, saveSetting, applyTheme } from './settings.js';
import { shareScore } from './social.js';
import { tutNext, tutPrev, skipTutorial, dismissBubble } from './tutorial.js';
import { closeRankUp } from './rank.js';
import {
  openShop, buyPack, openWheel, spinWheel,
  openAd, closeAd, startAd, openChest, openChestReward,
  closeMoneyOv, showMoneyBar, fomoWatchAd, fomoSkip,
} from './monetization.js';
import { initLoading, initPWA } from './loading.js';
import { draw } from './rendering.js';

// ── Initialize canvas references on state ──
S.canvas = document.getElementById('game-canvas');
S.ctx = S.canvas.getContext('2d');
S.nCanvas = document.getElementById('next-canvas');
S.nctx = S.nCanvas.getContext('2d');

// ── Resize handler ──
window.addEventListener('resize', () => { resize(); if (S.running && !S.gameOver) draw(); });
requestAnimationFrame(() => { resize(); });

// ── Firebase init ──
initFirebase();

// ── Loading + PWA ──
initLoading();
initPWA();

// ── Apply saved settings ──
applySettings();
applyLang(detectLang());

// Apply saved theme immediately
(function () {
  const saved = localStorage.getItem('tb_theme');
  if (saved === 'light') applyTheme(true);
})();

// ── Import input handlers (self-initializing) ──
import('./input.js').then(m => m.initInput());

// ── Wire DOMContentLoaded listeners ──
document.addEventListener('DOMContentLoaded', () => {
  const inp = document.getElementById('pseudo-input');
  if (inp) inp.addEventListener('keydown', e => { if (e.key === 'Enter') confirmScore(); });

  // Pause body scroll isolation
  const pb = document.querySelector('.pause-body');
  if (pb) {
    pb.addEventListener('touchstart', e => e.stopPropagation(), { passive: true });
    pb.addEventListener('touchmove', e => e.stopPropagation(), { passive: true });
  }

  // Sheet drag-to-close
  const SHEET_CLOSE_THRESH = 70;
  const sheet = document.getElementById('pause-sheet');
  const dragZone = document.getElementById('pause-drag-zone');
  const hdr = document.querySelector('.pause-header');
  let dragY0 = null;
  let dragging = false;

  function startDrag(e) {
    dragY0 = e.touches[0].clientY;
    dragging = true;
    sheet.style.transition = 'none';
    e.stopPropagation();
  }
  function moveDrag(e) {
    if (!dragging) return;
    const dy = e.touches[0].clientY - dragY0;
    if (dy > 0) sheet.style.transform = `translateY(${dy}px)`;
    e.stopPropagation();
  }
  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    const dy = (e.changedTouches?.[0]?.clientY ?? dragY0) - dragY0;
    dragY0 = null;
    if (dy > SHEET_CLOSE_THRESH) {
      sheet.style.transition = 'transform .28s ease-in';
      sheet.style.transform = 'translateY(100%)';
      setTimeout(() => {
        sheet.style.transition = '';
        sheet.style.transform = '';
        if (S.paused) togglePause();
      }, 300);
    } else {
      sheet.style.transition = 'transform .22s cubic-bezier(0.34,1.2,0.64,1)';
      sheet.style.transform = '';
      setTimeout(() => { sheet.style.transition = ''; }, 240);
    }
    e.stopPropagation();
  }

  [dragZone, hdr].forEach(el => {
    if (!el) return;
    el.addEventListener('touchstart', startDrag, { passive: true });
    el.addEventListener('touchmove', moveDrag, { passive: true });
    el.addEventListener('touchend', endDrag, { passive: true });
  });
});

// ════════════════════════════════════════════════════════
//  Register all functions called from HTML onclick attributes
// ════════════════════════════════════════════════════════
window.activateBooster = activateBooster;
window.startGame = startGame;
window.togglePause = togglePause;
window.openSettings = openSettings;
window.closeSettings = closeSettings;
window.handleSheetBackdrop = handleSheetBackdrop;
window.quitGame = quitGame;
window.savePseudoSettings = savePseudoSettings;
window.onThemeToggle = onThemeToggle;
window.onSlider = onSlider;
window.toggleTheme = toggleTheme;
window.setLang = setLang;
window.onMusicToggle = onMusicToggle;
window.shareScore = shareScore;
window.tutNext = tutNext;
window.tutPrev = tutPrev;
window.skipTutorial = skipTutorial;
window.dismissBubble = dismissBubble;
window.closeRankUp = closeRankUp;
window.openLeaderboard = openLeaderboard;
window.closeLeaderboard = closeLeaderboard;
window.switchTab = switchTab;
window.confirmScore = confirmScore;
window.skipScore = skipScore;
window.resetPseudo = resetPseudo;
window.openShop = openShop;
window.buyPack = buyPack;
window.openWheel = openWheel;
window.spinWheel = spinWheel;
window.openAd = openAd;
window.closeAd = closeAd;
window.startAd = startAd;
window.openChest = openChest;
window.openChestReward = openChestReward;
window.closeMoneyOv = closeMoneyOv;
window.showMoneyBar = showMoneyBar;
window.fomoWatchAd = fomoWatchAd;
window.fomoSkip = fomoSkip;
window.saveSetting = saveSetting;
