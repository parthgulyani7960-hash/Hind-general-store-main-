import fs from 'fs';

const content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

for (let r = 12355; r < lines.length; r++) {
  console.log(`Line ${r+1}: "${lines[r]}"`);
  for (let c = 0; c < lines[r].length; c++) {
    console.log(`  Char ${c}: '${lines[r][c]}' (code ${lines[r].charCodeAt(c)})`);
  }
}
