const fs = require('fs');
const content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const stack = [];
let line = 1;

for (let i = 0; i < content.length; i++) {
  if (content[i] === '\n') {
    line++;
    continue;
  }
  
  if (content[i] === '<') {
    const isClosing = content[i+1] === '/';
    let tagEnd = i + 1;
    while (tagEnd < content.length && content[tagEnd] !== '>') {
      tagEnd++;
    }
    const fullTag = content.substring(i, tagEnd + 1);
    
    // Ignore self-closing
    if (fullTag.endsWith('/>')) {
      i = tagEnd;
      continue;
    }
    
    // Extract tag name
    let tagNameMatch = fullTag.match(/<\/?([a-zA-Z0-9\.]+)/);
    if (!tagNameMatch) continue;
    let tagName = tagNameMatch[1];
    
    // Only care about structural tags
    if (!['div', 'section', 'main', 'header', 'footer', 'aside', 'nav', 'motion.div', 'AnimatePresence'].includes(tagName)) {
      i = tagEnd;
      continue;
    }

    if (!isClosing) {
      stack.push({ tag: tagName, line: line, col: i, fullLength: fullTag.length });
    } else {
      if (stack.length === 0) {
        console.log(`Unmatched closing tag at line ${line}: ${fullTag}`);
        break;
      }
      const last = stack.pop();
      if (last.tag !== tagName) {
        console.log(`Mismatch at line ${line}! Expected </${last.tag}> (opened at ${last.line}), but found ${fullTag}`);
        break;
      }
    }
    i = tagEnd;
  }
}

if (stack.length > 0) {
  console.log(`Found ${stack.length} unclosed tags.`);
  console.log('Last unclosed tags:');
  for (let i = Math.max(0, stack.length - 10); i < stack.length; i++) {
    console.log(`  <${stack[i].tag}> opened at line ${stack[i].line}`);
  }
} else {
  console.log('All matched!');
}
