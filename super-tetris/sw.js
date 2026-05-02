/* ═══════════════════════════════════════════════════
   Super Tetris — Service Worker v1
   Network-first pour HTML/JS/CSS (bundle, index)
   Cache-first pour les libs et icônes (rarement modifiés)
   ═══════════════════════════════════════════════════ */

const CACHE_NAME = 'super-tetris-v1';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './bundle.js',
  './src/styles/variables.css',
  './src/styles/global.css',
  './icons/icon-192.svg',
  './icons/icon-512.svg',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS).catch(()=>{}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Ne pas cacher les CDN externes (React, fonts) — laisser le browser
  // gérer leur cache HTTP normalement.
  if (url.origin !== location.origin) return;

  const isAppShell = /\.(html|js|css)$/i.test(url.pathname)
    || url.pathname === '/'
    || url.pathname.endsWith('/index.html');

  if (isAppShell) {
    // Network-first
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(()=>{});
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
    );
  } else {
    // Cache-first
    e.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(()=>{});
        return res;
      }))
    );
  }
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
