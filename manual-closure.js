
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

  // Let's replace the last bit with just simple closure
  const testLines = lines.slice(0, 12475);
  testLines.push('</AdminDashboardLayout>');
  testLines.push('  );');
  testLines.push('}');
  
  const res = tryCompile(testLines.join('\n'));
  console.log(`Manual closure:`, res.success ? 'SUCCESS' : 'STILL FAILS');
  if (!res.success) {
    console.log('Error details:', res.output.split('\n').filter(l => l.includes('AdminDashboard.tsx')).join('\n'));
  }

} finally {
  fs.writeFileSync('src/pages/AdminDashboard.tsx', original);
}
