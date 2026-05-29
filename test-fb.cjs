
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  "projectId": "studio-8565200409-a3bd2",
  "appId": "1:998402666181:web:a2e3847085e9ec08394aac",
  "apiKey": "AIzaSyDQ6uuOgMOnj6BrJwW2PGv7R7CTN3AWE7w",
  "authDomain": "studio-8565200409-a3bd2.firebaseapp.com",
  "firestoreDatabaseId": "ai-studio-c0cf4846-a706-4147-ab7d-33e609e4a7fe"
};

async function run() {
  try {
    console.log('Testing with Client SDK...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    console.log('Fetching categories...');
    const snap = await getDocs(collection(db, 'categories'));
    console.log('Success! Count:', snap.docs.length);
  } catch (e) {
    console.error('FAILED (Client SDK):', e.message);
  }
}

run();
