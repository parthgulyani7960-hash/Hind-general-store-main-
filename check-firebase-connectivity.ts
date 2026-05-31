
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { normalizeEnvironment } from './src/lib/envCheck';

async function checkConnectivity() {
  console.log('--- Firebase Connectivity Diagnostic ---');
  normalizeEnvironment();
  
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const dbId = process.env.FIREBASE_DATABASE_ID || '(default)';
  const saKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  console.log(`Resolved Project: ${projectId}`);
  console.log(`Resolved Database: ${dbId}`);
  console.log(`Service Account Present: ${!!saKey}`);

  if (saKey) {
    console.log('Service Account Length:', saKey.length);
    console.log('Service Account Start:', saKey.substring(0, 20) + '...');
    try {
      const parsed = JSON.parse(saKey);
      console.log('✅ Service Account JSON: Valid');
      console.log(`   Key Project ID: ${parsed.project_id}`);
      console.log(`   Client Email: ${parsed.client_email}`);
    } catch (e: any) {
      console.error('❌ Service Account JSON: INVALID');
      console.error(`   Error: ${e.message}`);
      if (saKey.includes('project_id')) {
        console.log('   Note: The string contains "project_id" but failed to parse as JSON. Check for truncation or hidden characters.');
      }
    }
  } else {
    console.warn('⚠️ No Service Account Key found in process.env');
    console.log('Environment variables present (filtered):');
    Object.keys(process.env).filter(k => k.includes('FIREBASE') || k.includes('PROJECT') || k.includes('KEY')).forEach(k => {
      console.log(`   ${k}: [SET, length ${String(process.env[k]).length}]`);
    });
  }

  try {
    if (admin.apps.length === 0) {
      if (saKey) {
        admin.initializeApp({
          credential: admin.credential.cert(JSON.parse(saKey)),
          projectId: projectId
        });
      } else {
        admin.initializeApp({ projectId });
      }
    }

    const db = getFirestore(admin.app(), dbId);
    console.log('Attempting to list collections...');
    
    const collections = await db.listCollections();
    console.log(`✅ Success! Found ${collections.length} collections.`);
    collections.forEach(c => console.log(` - ${c.id}`));

  } catch (err: any) {
    console.error('❌ Connection Failed');
    console.error(`   Message: ${err.message}`);
    console.error(`   Code: ${err.code}`);
  }
}

checkConnectivity();
