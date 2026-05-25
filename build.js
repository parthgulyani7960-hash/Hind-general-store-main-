import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = __dirname;

console.log('[BUILD] Initializing platform-independent robust build runner...');
console.log('[BUILD] Workspace Root Directory:', rootDir);

// 1. Ensure Firebase configuration placeholders exist before starting build steps
console.log('[BUILD] Running Firebase config verification...');
const ensureConfigScript = path.resolve(rootDir, 'ensure-config.js');
execSync(`node "${ensureConfigScript}"`, { stdio: 'inherit' });

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

console.log('[BUILD] Build process successfully completed with no resolution errors!');
