import fs from 'fs';
const content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

let braceBalance = 0;
let parenBalance = 0;

for (let i = 0; i < content.length; i++) {
  const char = content[i];
  if (char === '{') braceBalance++;
  else if (char === '}') braceBalance--;
  else if (char === '(') parenBalance++;
  else if (char === ')') parenBalance--;
}

console.log('Brace balance:', braceBalance);
console.log('Paren balance:', parenBalance);
