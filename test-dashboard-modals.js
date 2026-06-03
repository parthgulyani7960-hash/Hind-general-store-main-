
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

  // Let's remove DashboardModals
  const testLines = [...lines];
  testLines.splice(12476 - 1, 12485 - 12476 + 1);
  const res = tryCompile(testLines.join('\n'));
  console.log(`Commented out DashboardModals:`, res.success ? 'SUCCESS' : 'STILL FAILS');
  if (!res.success) {
    console.log('Error details lines:', res.output.slice(0, 500));
  }

} finally {
  fs.writeFileSync('src/pages/AdminDashboard.tsx', original);
}
