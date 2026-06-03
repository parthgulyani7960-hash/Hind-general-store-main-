import fs from 'fs';

const content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const lines = content.split('\n');

// We search for line 6167 (0-indexed 6166)
let idx = 0;
let currentLine = 1;
for (let i = 0; i < content.length; i++) {
  if (currentLine === 6167) {
    idx = i;
    break;
  }
  if (content[i] === '\n') currentLine++;
}

console.log('Line 6167 content processed starts at index:', idx);
console.log('Slice:', content.slice(idx, idx + 100));

let braceCount = 0;
let i = idx;
let n = content.length;

while (i < n) {
  const char = content[i];
  if (char === '\n') currentLine++;

  if (char === '{') {
    braceCount++;
    console.log(`[Line ${currentLine}] Open '{'. braceCount: ${braceCount}`);
  } else if (char === '}') {
    braceCount--;
    console.log(`[Line ${currentLine}] Close '}'. braceCount: ${braceCount}`);
    if (braceCount === 0) {
      console.log(`[Line ${currentLine}] BRACES BALANCED!`);
      break;
    }
  }
  i++;
}

console.log('Finished with braceCount:', braceCount);
