/**
 * TETROID — Service Worker
 * Cache-first strategy for offline PWA support
 * Version: 1.0.0
 */
const CACHE_NAME = 'tetroid-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  // CSS
  '/css/variables.css',
  '/css/base.css',
  '/css/loading.css',
  '/css/hud.css',
  '/css/canvas.css',
  '/css/boosters.css',
  '/css/overlays.css',
  '/css/rank.css',
  '/css/leaderboard.css',
  '/css/settings.css',
  '/css/tutorial.css',
  '/css/monetization.css',
  '/css/social.css',
  // JS
  '/js/main.js',
  '/js/config.js',
  '/js/state.js',
  '/js/firebase.js',
  '/js/pieces.js',
  '/js/core.js',
  '/js/rendering.js',
  '/js/particles.js',
  '/js/game-loop.js',
  '/js/input.js',
  '/js/boosters.js',
  '/js/level-up.js',
  '/js/rank.js',
  '/js/hud.js',
  '/js/game-flow.js',
  '/js/settings.js',
  '/js/audio.js',
  '/js/haptics.js',
  '/js/translations.js',
  '/js/tutorial.js',
  '/js/monetization.js',
  '/js/social.js',
  '/js/loading.js',
];

// Install — cache all assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — cache-first, network fallback
self.addEventListener('fetch', e => {
  // Skip non-GET and Firebase requests
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('firebasejs') || e.request.url.includes('firestore')) return;
  if (e.request.url.includes('googleapis.com')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        // Cache successful responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      });
    }).catch(() => caches.match('/index.html'))
  );
});
