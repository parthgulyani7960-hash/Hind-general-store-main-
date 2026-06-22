
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

async function check() {
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!sa) {
    console.error('No service account key');
    return;
  }
  
  const cert = JSON.parse(sa);
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(cert),
      projectId: cert.project_id
    });
  }
  
  const dbId = 'ai-studio-c0cf4846-a706-4147-ab7d-33e609e4a7fe';
  const db = getFirestore(admin.app(), dbId);
  
  const snap = await db.collection('users').where('email', '==', 'parthgulyani7960@gmail.com').get();
  console.log(`Found ${snap.size} users for email parthgulyani7960@gmail.com`);
  snap.forEach(doc => {
    console.log('User Data:', JSON.stringify(doc.data(), null, 2));
  });
  
  const whitelistSnap = await db.collection('admin_whitelist').doc('parthgulyani7960@gmail.com').get();
  console.log('Whitelist entry exists:', whitelistSnap.exists);
  if (whitelistSnap.exists) {
    console.log('Whitelist Data:', JSON.stringify(whitelistSnap.data(), null, 2));
  }
}

check().catch(console.error);
