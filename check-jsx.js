
import fs from 'fs';
const content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const tagStack = [];
const tagRegex = /<(\/?)([a-zA-Z0-9]+)(\s|>)/g;

let match;
while ((match = tagRegex.exec(content)) !== null) {
  const isClosing = match[1] === '/';
  const tagName = match[2];
  
  if (!isClosing && !match[0].endsWith('/>')) {
    tagStack.push({ tagName, index: match.index });
  } else if (isClosing) {
    if (tagStack.length > 0 && tagStack[tagStack.length - 1].tagName === tagName) {
      tagStack.pop();
    } else {
      console.log(`Unmatched closing tag: ${tagName} at index ${match.index}`);
    }
  }
}

console.log('Unclosed tags left:');
tagStack.forEach(tag => console.log(tag.tagName));
