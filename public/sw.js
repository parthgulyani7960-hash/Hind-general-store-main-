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
  const url = new URL(request.url);

  // Strategy: Network First, falling back to cache for API requests
  if (url.pathname.startsWith('/api/products') || url.pathname.startsWith('/api/categories')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clonedResponse = response.clone();
          caches.open(API_CACHE_NAME).then((cache) => {
            cache.put(request, clonedResponse);
          });
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Strategy: Cache First, falling back to network for Images
  if (request.destination === 'image' || url.hostname.includes('firebasestorage.googleapis.com')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;

        return fetch(request).then((response) => {
          const clonedResponse = response.clone();
          caches.open(IMAGE_CACHE_NAME).then((cache) => {
            cache.put(request, clonedResponse);
          });
          return response;
        });
      })
    );
    return;
  }

  // Default Strategy: Stale-While-Revalidate for static assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, networkResponse.clone());
        });
        return networkResponse;
      });
      return cachedResponse || fetchPromise;
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
