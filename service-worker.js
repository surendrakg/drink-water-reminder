const CACHE_NAME = 'drink-water-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/drink_Water.gif',
  '/Reminder.mp3'
];

self.addEventListener('install', (event) => {
  // Perform install steps: cache all required assets.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  // Serve cached assets if available, otherwise fetch from network.
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // If a cache is hit, we return the cached response; otherwise, fetch from network.
        return response || fetch(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
  // Clean up old caches if any.
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});