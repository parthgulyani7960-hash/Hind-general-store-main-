const fs = require('fs');
const content = fs.readFileSync('src/pages/Profile.tsx', 'utf8');

let stack = [];
const regex = /<div(\s|>)|<\/div>|<motion\.div(\s|>)|<\/motion\.div>/g;
let match;
let count = 0;

while ((match = regex.exec(content)) !== null) {
  const line = content.substring(0, match.index).split('\n').length;
  const tag = match[0];
  if (tag.startsWith('</')) {
    if (stack.length === 0) {
      console.log(`Unmatched closing tag ${tag} at line ${line}`);
    } else {
      stack.pop();
    }
  } else {
    stack.push({ tag, line });
  }
}

stack.forEach(s => {
  console.log(`Unclosed tag ${s.tag} at line ${s.line}`);
});
