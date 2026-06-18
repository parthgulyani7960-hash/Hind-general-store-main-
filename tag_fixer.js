const fs = require('fs');
const content = fs.readFileSync('src/pages/Profile.tsx', 'utf8');

let depth = 0;
const lines = content.split('\n');
lines.forEach((line, i) => {
  const opens = (line.match(/<div|<motion\.div/g) || []).length;
  const closes = (line.match(/<\/div>|<\/motion\.div>/g) || []).length;
  const prevDepth = depth;
  depth += opens - closes;
  if (depth < 0) {
    console.log(`Line ${i + 1}: Depth dropped below 0! (Prev: ${prevDepth}, Now: ${depth})`);
    console.log(`Line content: ${line}`);
    depth = 0;
  }
});
console.log(`Final depth: ${depth}`);
