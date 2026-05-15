const fs = require('fs');
const lines = fs.readFileSync('server.ts', 'utf8').split('\n');
let res = [];
lines.forEach((l, i) => { if(l.includes('db.prepare')) res.push((i+1) + ': ' + l.trim()); });
console.log('Total: ' + res.length);
console.log(res.slice(0, 30).join('\n'));
