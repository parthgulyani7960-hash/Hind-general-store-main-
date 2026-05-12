
const fs = require('fs');
const content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

let tryCount = 0;
let catchCount = 0;

lines.forEach((line, index) => {
    const tries = (line.match(/\btry\b/g) || []).length;
    const catches = (line.match(/\bcatch\b/g) || []).length;
    const dots = (line.match(/\.catch/g) || []).length;
    
    // a catch block is a catch that is NOT a .catch call
    const catchBlocks = catches - dots;
    
    tryCount += tries;
    catchCount += catchBlocks;
    
    if (catchCount > tryCount) {
        console.log(`Mismatch at line ${index + 1}: tryCount=${tryCount}, catchCount=${catchCount}`);
        console.log(`Line content: ${line}`);
        // Only stop if they actually diverged
        // process.exit(1);
    }
});

console.log(`Final counts: try=${tryCount}, catch=${catchCount}`);
