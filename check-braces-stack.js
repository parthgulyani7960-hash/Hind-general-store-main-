import fs from 'fs';

const content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const stack = [];
const lines = content.split('\n');

for (let r = 0; r < lines.length; r++) {
  const line = lines[r];
  const lineNum = r + 1;
  for (let c = 0; c < line.length; c++) {
    const char = line[c];
    if (char === '{') {
      stack.push({ line: lineNum, col: c + 1, type: '{' });
    } else if (char === '}') {
      if (stack.length === 0) {
        console.log(`Orphan } at Line ${lineNum}, Col ${c + 1}`);
      } else {
        stack.pop();
      }
    }
  }
}

console.log('Unclosed braces left on stack:', stack.length);
if (stack.length > 0) {
  stack.forEach((item) => {
    console.log(`Unclosed { at Line ${item.line}, Col ${item.col}`);
  });
}
