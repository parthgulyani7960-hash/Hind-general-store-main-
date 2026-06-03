import fs from 'fs';

const original = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const indexToLineMap = [];
let currentLine = 1;
for (let i = 0; i < original.length; i++) {
  indexToLineMap.push(currentLine);
  if (original[i] === '\n') {
    currentLine++;
  }
}

let clean = original;
function maskBlock(regex) {
  clean = clean.replace(regex, (match) => {
    return match.split('').map(c => c === '\n' ? '\n' : ' ').join('');
  });
}

maskBlock(/\/\/.*$/gm); // line comments
maskBlock(/\/\*[\s\S]*?\*\//g); // block comments
maskBlock(/`[\s\S]*?`/g); // backticks
maskBlock(/'[\s\S]*?'/g); // single quotes
maskBlock(/"[\s\S]*?"/g); // double quotes

let parenBalance = 0;
let braceBalance = 0;

for (let i = 0; i < clean.length; i++) {
  const char = clean[i];
  const lineNo = indexToLineMap[i];
  
  if (char === '(') parenBalance++;
  if (char === ')') parenBalance--;
  if (char === '{') braceBalance++;
  if (char === '}') braceBalance--;

  // Print state for lines near the end
  if (lineNo >= 12330 && lineNo <= 12488 && original[i] === '\n') {
    const rawLine = original.split('\n')[lineNo - 1];
    console.log(`Line ${lineNo}: P:${parenBalance} B:${braceBalance} | ${rawLine.trim()}`);
  }
}
