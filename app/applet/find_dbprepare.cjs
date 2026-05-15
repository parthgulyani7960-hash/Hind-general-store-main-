const fs = require('fs');
const lines = fs.readFileSync('server.ts', 'utf8').split('\n');
let count = 0;
lines.forEach((line, i) => {
  if (line.includes('db.prepare')) {
    count++;
    if (count <= 30) console.log(i + 1, line.trim());
  }
});
console.log('Total db.prepare:', count);
