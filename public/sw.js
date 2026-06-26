const CACHE_NAME = 'kiranas-store-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/main.tsx',
  // Essential placeholder images or local assets
];

// API Cache for product data
const API_CACHE_NAME = 'kiranas-api-v1';
const IMAGE_CACHE_NAME = 'kiranas-images-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME && cacheName !== IMAGE_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  let url;
  try {
    url = new URL(request.url);
  } catch (err) {
    return; // Bypass invalid URLs
  }

  // Strictly filter: only GET requests and http/https schemes can be intercepted and cached.
  // This completely eliminates "Request method 'POST' is not supported" and chrome-extension scheme errors.
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Strategy: Network First, falling back to cache for API requests (GET only)
  const isApiGet = url.pathname.startsWith('/api/products') || 
    url.pathname.startsWith('/api/categories') || 
    url.pathname.startsWith('/api/cart') || 
    url.pathname.startsWith('/api/settings') || 
    url.pathname.startsWith('/api/promotions-rules') || 
    url.pathname.startsWith('/api/bulk-discounts') || 
    url.pathname.startsWith('/api/announcements') || 
    url.pathname.startsWith('/api/addresses');

  if (isApiGet) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clonedResponse = response.clone();
            caches.open(API_CACHE_NAME)
              .then((cache) => {
                cache.put(request, clonedResponse).catch((err) => {
                  console.warn('[SW] API cache put failed:', err);
                });
              })
              .catch((err) => {
                console.warn('[SW] API cache open failed:', err);
              });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return a safe offline JSON response to prevent uncaught rejections or malformed JSON errors
            return new Response(JSON.stringify({ error: "Offline mode active", data: [] }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
    return;
  }

  // Strategy: Cache First, falling back to network for Images
  if (request.destination === 'image' || url.hostname.includes('firebasestorage.googleapis.com')) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;

          return fetch(request).then((response) => {
            if (response && response.status === 200) {
              const clonedResponse = response.clone();
              caches.open(IMAGE_CACHE_NAME)
                .then((cache) => {
                  cache.put(request, clonedResponse).catch((err) => {
                    console.warn('[SW] Image cache put failed:', err);
                  });
                })
                .catch((err) => {
                  console.warn('[SW] Image cache open failed:', err);
                });
            }
            return response;
          }).catch((err) => {
            console.warn('[SW] Image fetch failed:', err);
            // Return a minimal transparent 1x1 GIF as a safe fallback
            return new Response(
              new Uint8Array([71, 73, 70, 56, 57, 97, 1, 0, 1, 0, 128, 0, 0, 0, 0, 0, 255, 255, 255, 33, 249, 4, 1, 0, 0, 0, 0, 44, 0, 0, 0, 0, 1, 0, 1, 0, 0, 2, 2, 68, 1, 0, 59]),
              { headers: { 'Content-Type': 'image/gif' } }
            );
          });
        })
        .catch(() => {
          // Fail-safe transparent GIF
          return new Response(
            new Uint8Array([71, 73, 70, 56, 57, 97, 1, 0, 1, 0, 128, 0, 0, 0, 0, 0, 255, 255, 255, 33, 249, 4, 1, 0, 0, 0, 0, 44, 0, 0, 0, 0, 1, 0, 1, 0, 0, 2, 2, 68, 1, 0, 59]),
            { headers: { 'Content-Type': 'image/gif' } }
          );
        })
    );
    return;
  }

  // Default Strategy: Stale-While-Revalidate for static assets
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseToCache).catch((err) => {
                    console.warn('[SW] Asset cache put failed:', err);
                  });
                })
                .catch((err) => {
                  console.warn('[SW] Asset cache open failed:', err);
                });
            }
            return networkResponse;
          })
          .catch((fetchErr) => {
            console.warn('[SW] Asset stale-while-revalidate fetch failed:', fetchErr);
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return standard index.html or simple text instead of throwing
            return new Response("Offline: Resource not cached.", {
              status: 503,
              headers: { 'Content-Type': 'text/plain' }
            });
          });

        if (cachedResponse) {
          // Keep service worker active until background fetch and caching finishes.
          // This prevents Response.clone() "body is already used" or stream consumption abort errors.
          event.waitUntil(fetchPromise);
          return cachedResponse;
        }
        return fetchPromise;
      })
      .catch((err) => {
        console.warn('[SW] Error matching caches:', err);
        return new Response("Offline: Service unavailable.", {
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        });
      })
  );
});

// BACKGROUND SYNC: Offline Order Queue
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(processQueuedOrders());
  }
});

async function processQueuedOrders() {
  const db = await openDB();
  const tx = db.transaction('orders', 'readonly');
  const store = tx.objectStore('orders');
  const orders = await getAllFromStore(store);

  for (const orderRecord of orders) {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...orderRecord.headers },
        body: JSON.stringify(orderRecord.data)
      });

      if (response.ok) {
        const deleteTx = db.transaction('orders', 'readwrite');
        await deleteTx.objectStore('orders').delete(orderRecord.id);
        console.log('Successfully synced offline order:', orderRecord.id);
      }
    } catch (err) {
      console.error('Failed to sync order:', err);
    }
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('kiranas-sync', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('orders', { keyPath: 'id', autoIncrement: true });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
