/** @module loading - Loading screen animation + PWA install prompt */

import { showToast } from './hud.js';

/**
 * @description Initialize the loading screen with progress bar animation
 */
export function initLoading() {
  const bar = document.getElementById('loader-bar');
  const screen = document.getElementById('loading-screen');
  if (!bar || !screen) return;
  const startTime = Date.now();
  const MIN_DISPLAY = 2500;
  let progress = 0;
  const iv = setInterval(() => {
    const elapsed = Date.now() - startTime;
    progress = Math.min(90, (elapsed / MIN_DISPLAY) * 90);
    bar.style.width = progress + '%';
  }, 80);

  window.addEventListener('load', () => {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, MIN_DISPLAY - elapsed);
    setTimeout(() => {
      clearInterval(iv);
      bar.style.width = '100%';
      setTimeout(() => {
        screen.classList.add('hidden');
        setTimeout(() => screen.remove(), 600);
      }, 400);
    }, remaining);
  });
}

/**
 * @description Initialize PWA install prompt handling
 */
export function initPWA() {
  // Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .then(() => console.log('[Tetroid] SW enregistré'))
      .catch(e => console.warn('[Tetroid] SW erreur:', e));
  }

  // Install prompt
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (new URLSearchParams(window.location.search).get('install') === '1') {
      setTimeout(() => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then(() => {
            deferredPrompt = null;
            history.replaceState(null, '', window.location.pathname);
          });
        }
      }, 1000);
    }
  });

  if (new URLSearchParams(window.location.search).get('install') === '1') {
    setTimeout(() => {
      if (!deferredPrompt) {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        if (isIOS) {
          showToast("📲 Pour installer : Partager ⬆ puis \"Sur l'ecran d'accueil\"");
        } else {
          showToast("📲 Pour installer : Menu ⋮ puis \"Installer l'application\"");
        }
        history.replaceState(null, '', window.location.pathname);
      }
    }, 2000);
  }
}
