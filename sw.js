const CACHE_NAME = 'echoes-abyss-v3';
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
  '/js/lobby.js',
  '/js/forest.js',
  '/js/village.js',
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

// Install: Simpan aset awal dan langsung aktifkan
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Bersihkan cache versi lama dan klaim kontrol
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

// Listener untuk pesan skipWaiting dari UI client
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch: Menggunakan Stale-While-Revalidate untuk script & style, Network-first untuk HTML
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Jangan cache eksternal selain origin sendiri
  if (url.origin !== self.location.origin) return;

  // 1. Dokumen HTML / Navigasi: Network-First (cek update halaman utama lebih dulu)
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

  // 2. Skrip JS, CSS, Media: Stale-While-Revalidate
  // Berikan cache lokal instan (0 detik), lalu di background download versi baru dari server jika ada perubahan
  event.respondWith(
    caches.match(req).then(cached => {
      const fetchPromise = fetch(req).then(networkRes => {
        if (networkRes && networkRes.status === 200 && networkRes.type === 'basic') {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
        }
        return networkRes;
      }).catch(() => null);

      // Kembalikan versi cache instan jika ada, jika belum ada tunggu jaringan
      return cached || fetchPromise;
    }).catch(() => {
      if (req.headers.get('accept')?.includes('image/')) {
        return caches.match('/assets/images/icon-192.png');
      }
    })
  );
});
