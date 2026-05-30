
import admin from 'firebase-admin';

async function check() {
  console.log('Initializing with auto-discovery...');

  try {
    admin.initializeApp(); // Auto-discovery
    const db = admin.firestore();
    
    console.log('Attempting to list collections in (default) database...');
    const collections = await db.listCollections();
    console.log('Successfully listed', collections.length, 'collections.');
    collections.forEach(c => console.log(' - ' + c.id));
    
    // Specifically check for 'products' or 'settings' which we know are missing
    const settings = await db.collection('settings').limit(1).get();
    console.log('Settings exists:', !settings.empty);

  } catch (err: any) {
    console.error('ERROR during check:', err.message);
    console.error('Error Code:', err.code);
  }
}

check();
