const CACHE_NAME = 'hind-store-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use Promise.allSettled to ensure that even if one resource (like manifest.json or favicon)
      // fails to fetch, the rest are cached properly and no fatal rejection lands in the console.
      return Promise.allSettled(
        ASSETS_TO_CACHE.map((asset) =>
          fetch(asset)
            .then((res) => {
              if (res.ok) {
                return cache.put(asset, res);
              }
              console.warn(`[SW] Caching failed for asset: ${asset} (${res.status})`);
            })
            .catch((err) => {
              console.warn(`[SW] Network error during caching for asset: ${asset}:`, err);
            })
        )
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
