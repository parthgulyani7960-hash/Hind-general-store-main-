// Self-cleaning Service Worker to resolve any caching issues and deactivate cleanly
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => caches.delete(key))
      );
    }).then(() => {
      return self.clients.claim();
    }).then(() => {
      console.log('[SW] Caches cleared and claiming clients completed.');
    })
  );
});

// Direct network pass-through for all requests
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
