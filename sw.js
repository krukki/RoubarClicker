/*
 * Faz o jogo abrir sem internet. Sempre tenta a rede primeiro (para pegar
 * atualizações) e usa a cópia guardada só quando a rede falha.
 */
const CACHE = 'roubar-clicker-v3';
const FILES = [
  './',
  'index.html',
  'css/style.css',
  'js/data.js',
  'js/game.js',
  'js/town-art.js',
  'js/town.js',
  'js/ui.js',
  'js/main.js',
  'assets/roubar.webp',
  'assets/roubar-face.webp',
  'assets/favicon.png',
  'assets/icon-192.png',
  'assets/icon-512.png',
  'manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok || res.type === 'opaque') {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || Response.error()))
  );
});
