
import fs from 'fs';
const content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const commentIndices = [];
let idx = content.indexOf('/*');
while (idx !== -1) {
  commentIndices.push(idx);
  idx = content.indexOf('/*', idx + 2);
}

const unclosed = [];
for (let i = 0; i < commentIndices.length; i++) {
  const start = commentIndices[i];
  const end = content.indexOf('*/', start + 2);
  // Need to check if there is an *intermediate* /*.
  // This is too complex for a quick script. 
  // Let's just find the last /* that is not closed.
}
// Alternative: scan and track balance.
let balance = 0;
for (let i = 0; i < content.length - 1; i++) {
  if (content.slice(i, i+2) === '/*') {
    balance++;
  } else if (content.slice(i, i+2) === '*/') {
    if (balance > 0) balance--;
    else console.log('Found unmatched */');
  }
}
console.log('Balance:', balance);

// If balance > 0, find the last /* that is not closed!
