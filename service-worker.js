const CACHE_NAME = 'odisea-haikus-v2';
const FILES_TO_CACHE = [
  './',
  'index.html',
  'styles.css',
  'motor.js',
  'niveles.js',
  'fragmentos.js',
  'manifest.json',
  'favicon.ico',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first: siempre intenta traer la version mas nueva primero.
// Si no hay conexion, recien ahi usa lo que tenga cacheado.
// Las peticiones que no son GET (como el PUT al backend) pasan directo, sin cachear.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});