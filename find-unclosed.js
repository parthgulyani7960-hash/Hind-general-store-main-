
import fs from 'fs';
const content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

let balance = 0;
let lastOpen = -1;

for (let i = 0; i < content.length - 1; i++) {
  if (content.slice(i, i+2) === '/*') {
    balance++;
    lastOpen = i;
  } else if (content.slice(i, i+2) === '*/') {
    balance--;
  }
}

if (balance !== 0) {
  console.log('Balance:', balance);
  console.log('Last unclosed /* is likely around index:', lastOpen);
  const lines = content.slice(0, lastOpen).split('\n').length;
  console.log('Line number:', lines);
}
