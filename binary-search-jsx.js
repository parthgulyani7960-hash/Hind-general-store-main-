import fs from 'fs';
import { execSync } from 'child_process';

const original = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

function tryCompile(content) {
  fs.writeFileSync('src/pages/AdminDashboard.tsx', content);
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    return { success: true };
  } catch (err) {
    const output = err.stderr.toString() + err.stdout.toString();
    return { success: false, output };
  }
}

try {
  const lines = original.split('\n');

  // Let's test mocking lines 6970 to 9240 (Part A & B)
  const testLines = [...lines];
  for (let l = 6970 - 1; l < 9240; l++) {
    testLines[l] = `// MOCKED ${l + 1}`;
  }
  const res = tryCompile(testLines.join('\n'));
  console.log(`Mocking range 6970 to 9240 (Part A & B):`, res.success ? 'SUCCESS (Error is in this range!)' : 'STILL FAILS');
  if (!res.success) {
    console.log('Error details:', res.output.split('\n').filter(l => l.includes('AdminDashboard.tsx')).slice(0, 3).join('\n'));
  }

} finally {
  fs.writeFileSync('src/pages/AdminDashboard.tsx', original);
}
