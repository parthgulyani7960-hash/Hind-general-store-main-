
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { normalizeEnvironment } from './src/lib/envCheck';
import fs from 'fs';
import path from 'path';

async function checkConnectivity() {
  console.log('--- Firebase Connectivity Diagnostic ---');
  normalizeEnvironment();
  
  let projectId = process.env.FIREBASE_PROJECT_ID;
  let dbId = process.env.FIREBASE_DATABASE_ID;
  
  let configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (!fs.existsSync(configPath)) {
    configPath = path.join(process.cwd(), 'src/config', 'firebase-applet-config.json');
  }
  
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (!projectId) projectId = config.projectId;
      if (!dbId) dbId = config.firestoreDatabaseId;
    } catch (e: any) {
      console.warn('Could not parse config file:', e.message);
    }
  }

  if (!dbId) dbId = '(default)';
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
  console.log(`Attempting to query custom database (${dbId}) categories collection...`);
  try {
    const snapshot = await db.collection('categories').limit(1).get();
    console.log('✅ Custom DB Query Success!');
  } catch (err: any) {
    console.error(`❌ Custom DB Query Failed: ${err.message}`);
  }

  console.log('Attempting to query (default) database categories collection...');
  try {
    const defaultDb = getFirestore(admin.app());
    const snapshotDefault = await defaultDb.collection('categories').limit(1).get();
    console.log('✅ (default) DB Query Success!');
  } catch (err: any) {
    console.error(`❌ (default) DB Query Failed: ${err.message}`);
  }

  } catch (err: any) {
    console.error('❌ Connection Failed');
    console.error(`   Message: ${err.message}`);
    console.error(`   Code: ${err.code}`);
  }
}

checkConnectivity();
