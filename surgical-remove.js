import fs from 'fs';

const content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

// Backup the file first
fs.writeFileSync('src/pages/AdminDashboard.tsx.bak', content, 'utf8');
console.log('Created backup as src/pages/AdminDashboard.tsx.bak');

const lines = content.split('\n');

// We will construct the new content line by line, skipping the ranges
const rangesToSkip = [
  { start: 3424, end: 4389 }, // Analytics dead block
  { start: 4741, end: 5347 }, // Orders dead block
  { start: 5348, end: 5834 }, // Product Catalog dead block
  { start: 6186, end: 6525 }, // Customers dead block
  { start: 6526, end: 6824 }, // Promotions dead block
];

let newContent = '';

for (let i = 0; i < lines.length; i++) {
  const lineNum = i + 1;
  const skip = rangesToSkip.some(r => lineNum >= r.start && lineNum <= r.end);
  if (!skip) {
    newContent += lines[i] + '\n';
  } else {
    // Optional placeholder comment
    if (lineNum === rangesToSkip.find(r => lineNum === r.start)?.start) {
      newContent += `        {/* Block skipped by surgical-remove on line ${lineNum} */}\n`;
    }
  }
}

fs.writeFileSync('src/pages/AdminDashboard.tsx', newContent, 'utf8');
console.log('Removed dead blocks!');
