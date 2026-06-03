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
function maskBlock(regex, label) {
  let count = 0;
  clean = clean.replace(regex, (match) => {
    count++;
    // print details for exceptionally long matches (potential runaway regex)
    if (match.length > 500) {
      console.log(`[MASK RUNAWAY] ${label} matched a massive block of size ${match.length} starting with: "${match.slice(0, 100).replace(/\r?\n/g, ' ')}"`);
    }
    return match.split('').map(c => c === '\n' ? '\n' : ' ').join('');
  });
}

maskBlock(/\/\/.*$/gm, 'line-comment');
maskBlock(/\/\*[\s\S]*?\*\//g, 'block-comment');
maskBlock(/`[\s\S]*?`/g, 'backtick');
maskBlock(/'[\s\S]*?'/g, 'single-quote');
maskBlock(/"[\s\S]*?"/g, 'double-quote');

// Check what the clean content looks like on line 11422
const lines = clean.split('\n');
console.log(`Cleaned line 11422: "${lines[11421]}"`);
console.log(`Original line 11422: "${original.split('\n')[11421]}"`);
