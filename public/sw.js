const CACHE_NAME = 'hgs-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests and skip API requests
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Serve from cache if available, otherwise fetch
      return response || fetch(event.request).catch(async () => {
        // Handle offline: if request failed, maybe return offline page
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('You are offline', { status: 503 });
      });
    })
  );
});
