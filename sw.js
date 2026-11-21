const CACHE_NAME = 'echoes-of-the-abyss-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/style.css',
  '/css/game-ui.css',
  '/js/save-system.js',
  '/js/main.js',
  '/js/player.js',
  '/js/inventory.js',
  '/js/combat.js',
  '/js/enemies.js',
  '/js/dungeon.js',
  '/js/multiplayer.js',
  '/assets/audio/lobby.mp3',
  '/assets/audio/dungeon.mp3',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  '/assets/apple-touch-icon.png',
  '/assets/favicon-32.png',
  '/assets/logo.jpeg',
  '/assets/images/icon-192.png',
  '/assets/images/icon-512.png',
  '/assets/images/apple-touch-icon.png',
  '/assets/images/favicon-32.png',
  '/assets/images/logo.jpeg'
];

// Install: Cache core assets & take over immediately
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up old caches & claim clients
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network-first for navigation, Cache-first for assets with offline fallback
self.addEventListener('fetch', event => {
  const req = event.request;

  // Non-GET requests should bypass service worker
  if (req.method !== 'GET') return;

  // For HTML page requests: Network-first to get latest updates, fallback to cache
  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => caches.match(req).then(cached => cached || caches.match('/index.html')))
    );
    return;
  }

  // For static assets (scripts, styles, audio, images): Cache-first, fallback to network
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
        }
        return res;
      });
    }).catch(() => {
      // Offline fallback for images
      if (req.headers.get('accept')?.includes('image/')) {
        return caches.match('/assets/images/icon-192.png') || caches.match('/assets/icon-192.png');
      }
    })
  );
});
