
import fs from 'fs';
const content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const stack = [];
const divRegex = /<div|<AdminDashboardLayout|<\/div|<\/AdminDashboardLayout/g;
let match;
while ((match = divRegex.exec(content)) !== null) {
  const tag = match[0];
  if (tag === '<div' || tag === '<AdminDashboardLayout') {
    stack.push({ tag, index: match.index });
  } else {
    const openingTag = stack.pop();
    if (!openingTag || (tag === '</div>' && openingTag.tag !== '<div') || (tag === '</AdminDashboardLayout>' && openingTag.tag !== '<AdminDashboardLayout')) {
        console.log('Mismatch:', tag, 'at', match.index, 'opening', openingTag);
        break;
    }
  }
}
console.log('Stack size:', stack.length);
