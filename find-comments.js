
import fs from 'fs';
const lines = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8').split('\n');
lines.forEach((line, i) => {
  if (line.includes('/*')) {
    console.log(`${i + 1}: ${line}`);
  }
});
