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

// 4 Groups of Modals:
const groups = [
  { name: 'Group 1: walletModal to supplierModal', start: 9562, end: 10556 },
  { name: 'Group 2: promotionRuleFormModal to customerModal', start: 10557, end: 11363 },
  { name: 'Group 3: reviewResponseModal to variantModal', start: 11364, end: 12242 },
  { name: 'Group 4: roleModal and reportDetailModal', start: 12243, end: 12475 }
];

try {
  const lines = original.split('\n');

  for (const group of groups) {
    const testLines = [...lines];
    for (let l = group.start - 1; l < group.end; l++) {
      testLines[l] = `// MOCKED ${group.name} line ${l + 1}`;
    }
    const res = tryCompile(testLines.join('\n'));
    console.log(`Mocking group "${group.name}" (${group.start} - ${group.end}):`, res.success ? 'SUCCESS (Bug is inside this group of modals!)' : 'STILL FAILS');
    if (!res.success) {
      console.log('Error details:', res.output.split('\n').filter(l => l.includes('AdminDashboard.tsx')).slice(0, 3).join('\n'));
    }
  }

} finally {
  fs.writeFileSync('src/pages/AdminDashboard.tsx', original);
}
