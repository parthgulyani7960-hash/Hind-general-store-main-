
export async function queueOfflineOrder(orderData: any) {
  if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
    throw new Error('Background Sync not supported');
  }

  const db = await openDB();
  const tx = db.transaction('orders', 'readwrite');
  const store = tx.objectStore('orders');
  
  // Capture current headers for the replay
  const authHeader = localStorage.getItem('hgs_token');
  const headers = authHeader ? { 'Authorization': `Bearer ${authHeader}` } : {};

  await store.add({ 
    data: orderData, 
    headers,
    timestamp: Date.now() 
  });

  const registration = await navigator.serviceWorker.ready as any;
  if (registration.sync) {
    await registration.sync.register('sync-orders');
  }
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('kiranas-sync', 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('orders')) {
        request.result.createObjectStore('orders', { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
