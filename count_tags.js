const fs = require('fs');
const content = fs.readFileSync('src/pages/Profile.tsx', 'utf8');

const openDivs = (content.match(/<div(\s|>)/g) || []).length;
const closeDivs = (content.match(/<\/div>/g) || []).length;
const openMotionDivs = (content.match(/<motion\.div(\s|>)/g) || []).length;
const closeMotionDivs = (content.match(/<\/motion\.div>/g) || []).length;

console.log('Open divs:', openDivs);
console.log('Close divs:', closeDivs);
console.log('Open motion divs:', openMotionDivs);
console.log('Close motion divs:', closeMotionDivs);
