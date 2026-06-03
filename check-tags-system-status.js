import fs from 'fs';

const content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

const targetLines = lines.slice(6688, 6886);
// Simulate appending </div> at the end
let blockText = targetLines.join('\n') + '\n</div>';

// Basic tag matcher
const tagRegex = /<\/?[a-zA-Z0-9.\-_:]+(\s+[a-zA-Z0-9.\-_:]+(\s*=\s*({[^}]*}|"[^"]*"|'[^']*'|[^>\s{}]+))?)*\s*\/?>/g;

let match;
const stack = [];

console.log('Scanning tags in simulated System Status block...');

while ((match = tagRegex.exec(blockText)) !== null) {
  const tagStr = match[0];
  const isClosing = tagStr.startsWith('</');
  const isSelfClosing = tagStr.endsWith('/>') || tagStr.startsWith('<img') || tagStr.startsWith('<input') || tagStr.startsWith('<br') || tagStr.startsWith('<hr');
  
  if (isSelfClosing) continue;

  const tagNameMatch = tagStr.match(/<\/?([a-zA-Z0-9.\-_:]+)/);
  if (!tagNameMatch) continue;
  const tagName = tagNameMatch[1];

  if (isClosing) {
    if (stack.length === 0) {
      console.log(`[Mismatch] Extra closing tag: ${tagStr}`);
    } else {
      const last = stack.pop();
      if (last.name !== tagName) {
        console.log(`[Mismatch] Tag mismatch: opened ${last.tag} but closed with ${tagStr}`);
      }
    }
  } else {
    stack.push({ name: tagName, tag: tagStr, index: match.index });
  }
}

if (stack.length > 0) {
  console.log(`\nUnclosed tags inside System Status:`);
  stack.forEach(item => {
    console.log(` - Tag ${item.tag} opened at relative position ${item.index}`);
  });
} else {
  console.log('\nSUCCESS: All simulated JSX tags inside System Status are PERFECTLY balanced!');
}
