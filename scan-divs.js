
import fs from 'fs';
const content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const divStack = [];
const lines = content.split('\n');
const divRegex = /<(\/)?div(\s|>)/g;

let match;
while ((match = divRegex.exec(content)) !== null) {
  const isClosing = match[1] === '/';
  const line = content.slice(0, match.index).split('\n').length;
  
  if (isClosing) {
    if (divStack.length > 0) {
      divStack.pop();
    } else {
      console.log(`Unmatched </div at line ${line}`);
    }
  } else {
    divStack.push(line);
  }
}

console.log('Unclosed divs left:');
divStack.slice(-5).forEach(line => console.log(`  - <div opened at line ${line}`));
