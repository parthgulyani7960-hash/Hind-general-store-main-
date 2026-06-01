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
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
    firestoreDatabaseId: ""
  }, null, 2));
  fs.copyFileSync(configPath, rootConfigPath);
} else {
  console.log('[BUILD] firebase-applet-config.json was found. Keeping existing configuration.');
  fs.copyFileSync(configPath, rootConfigPath);
}
