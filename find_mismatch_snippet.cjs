const fs = require('fs');
const content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const lines = content.split('\n');
const snippet = lines.slice(6173, 6782).join('\n'); // Store settings

let stack = [];
const regex = /<\/?(div|motion\.div|AnimatePresence|main|section|header|footer|aside|nav)\b[^>]*>/g;

let match;
while ((match = regex.exec(snippet)) !== null) {
  const tag = match[0];
  const isSelfClosing = tag.trim().endsWith('/>');
  if (isSelfClosing) continue;
  
  const isClosing = tag.startsWith('</');
  const tagNameMatch = tag.match(/<\/?([a-zA-Z0-9\.]+)/);
  if (!tagNameMatch) continue;
  
  const tagName = tagNameMatch[1];
  const lineNum = snippet.substring(0, match.index).split('\n').length + 6173;
  
  if (!isClosing) {
    stack.push(lineNum);
  } else {
    if (stack.length > 0) stack.pop();
  }
  
  if (stack.length === 1) { // We are back at root
    if (isClosing) {
      console.log('Depth 1 closed at line', lineNum);
    } else {
      console.log('Depth 1 opened at line', lineNum, tag);
    }
  } else if (stack.length === 2 && !isClosing) {
    console.log('  Depth 2 opened at line', lineNum, tag);
  } else if (stack.length === 1 && isClosing) {
    console.log('  Depth 2 closed at line', lineNum);
  }
}

if (stack.length > 0) {
  console.log('Unclosed tags:', stack);
}
