
import fs from 'fs';
const content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

let balance = 0;
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  let idx = line.indexOf('/*');
  while (idx !== -1) {
    balance++;
    // If we have more than 0 balance, this might be the start of an problematic comment
    if (balance > 0) {
      console.log(`Line ${i+1}: Open comment, balance ${balance}`);
    }
    idx = line.indexOf('/*', idx + 2);
  }
  
  idx = line.indexOf('*/');
  while (idx !== -1) {
    if (balance > 0) balance--;
    idx = line.indexOf('*/', idx + 2);
  }
}
