import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = __dirname;

console.log('[BUILD] Starting build script... [V2]');
console.log('[BUILD] Workspace Root Directory:', rootDir);

// 0. Diagnostic: Log environment variables
console.log('[BUILD] Running environment diagnostics...');
const diagnosticScript = path.resolve(rootDir, 'scripts/log-env.js');
execSync(`node "${diagnosticScript}"`, { stdio: 'inherit' });

// Validate essential environment variables
const REQUIRED_ENV_VARS = ['FIREBASE_SERVICE_ACCOUNT_KEY'];
for (const envVar of REQUIRED_ENV_VARS) {
  if (!process.env[envVar]) {
    console.warn(`[BUILD] WARNING: Missing required environment variable: ${envVar}. The app may not function correctly in production.`);
  }
}

// Check for relative imports in src/firebase.ts
const firebaseTsPath = path.resolve(rootDir, 'src/firebase.ts');
if (fs.existsSync(firebaseTsPath)) {
    const content = fs.readFileSync(firebaseTsPath, 'utf8');
    if (content.includes('import') && content.includes('../firebase-applet-config.json')) {
        console.error('[BUILD] FAILED: src/firebase.ts uses forbidden relative import to config. Use @config alias instead.');
        process.exit(1);
    }
}

// 1. Ensure Firebase configuration placeholders exist before starting build steps
console.log('[BUILD] Running Firebase config verification...');
const ensureConfigScript = path.resolve(rootDir, 'ensure-config.js');
execSync(`node "${ensureConfigScript}"`, { stdio: 'inherit' });

const configPath = path.resolve(rootDir, 'src/config/firebase-applet-config.json');

if (!fs.existsSync(configPath)) {
  console.error('[BUILD] FAILED: src/config/firebase-applet-config.json is missing.');
  console.error('[BUILD] Please ensure Firebase is configured.');
  process.exit(1);
}

// 2. Vite compilation with strict absolute path to config
console.log('[BUILD] Triggering Vite client-side bundle generation...');
const viteConfig = path.resolve(rootDir, 'vite.config.ts');
try {
  execSync(`npx vite build --config "${viteConfig}"`, { stdio: 'inherit', cwd: rootDir });
} catch (err) {
  console.error('[BUILD] Vite bundler failed with error:', err.message || err);
  process.exit(1);
}

// 3. Backend compilation with strict absolute path references
console.log('[BUILD] Compiling ES-modules Express server to standard CommonJS format via esbuild...');
const serverSrc = path.resolve(rootDir, 'server.ts');
const serverOut = path.resolve(rootDir, 'dist/server.cjs');

try {
  execSync(`npx esbuild "${serverSrc}" --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile="${serverOut}"`, { stdio: 'inherit', cwd: rootDir });
  console.log('[BUILD] Backend build complete. Target of compilation resolved at:', serverOut);
} catch (err) {
  console.error('[BUILD] esbuild compiler failed with error:', err.message || err);
  process.exit(1);
}

// 4. API entry point compilation
console.log('[BUILD] Compiling API entry point...');
const apiSrc = path.resolve(rootDir, 'api/index.ts');
const apiOut = path.resolve(rootDir, 'api/index.js');

try {
  execSync(`npx esbuild "${apiSrc}" --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile="${apiOut}"`, { stdio: 'inherit', cwd: rootDir });
  console.log('[BUILD] API entry point build complete.', apiOut);
} catch (err) {
  console.error('[BUILD] esbuild compiler for API failed:', err.message || err);
  process.exit(1);
}

console.log('[BUILD] Build process successfully completed with no resolution errors!');
