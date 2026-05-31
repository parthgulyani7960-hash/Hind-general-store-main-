import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configDir = path.resolve(__dirname, 'src/config');
const configPath = path.resolve(configDir, 'firebase-applet-config.json');
const rootConfigPath = path.resolve(__dirname, 'firebase-applet-config.json');

if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

if (fs.existsSync(rootConfigPath)) {
  console.log('[BUILD] Found firebase-applet-config.json at root. Copying to src/config...');
  fs.copyFileSync(rootConfigPath, configPath);
} else if (!fs.existsSync(configPath)) {
  console.log('[BUILD] firebase-applet-config.json not found, creating placeholder config...');
  fs.writeFileSync(configPath, JSON.stringify({
    apiKey: "AIzaSyDQ6uuOgMOnj6BrJwW2PGv7R7CTN3AWE7w",
    authDomain: "studio-8565200409-a3bd2.firebaseapp.com",
    projectId: "studio-8565200409-a3bd2",
    storageBucket: "studio-8565200409-a3bd2.firebasestorage.app",
    messagingSenderId: "998402666181",
    appId: "1:998402666181:web:a2e3847085e9ec08394aac",
    firestoreDatabaseId: "ai-studio-c0cf4846-a706-4147-ab7d-33e609e4a7fe"
  }, null, 2));
  fs.copyFileSync(configPath, rootConfigPath);
} else {
  console.log('[BUILD] firebase-applet-config.json was found. Keeping existing configuration.');
  fs.copyFileSync(configPath, rootConfigPath);
}
