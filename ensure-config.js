import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.resolve(__dirname, 'firebase-applet-config.json');
if (!fs.existsSync(configPath)) {
  console.log('[BUILD] firebase-applet-config.json not found, creating placeholder config so compilation/deployment succeeds...');
  fs.writeFileSync(configPath, JSON.stringify({
    apiKey: "mock-api-key-please-run-firebase-setup",
    authDomain: "mock-project.firebaseapp.com",
    projectId: "mock-project",
    storageBucket: "mock-project.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:123456789",
    firestoreDatabaseId: "(default)"
  }, null, 2));
} else {
  console.log('[BUILD] firebase-applet-config.json was found. Keeping existing configuration.');
}
