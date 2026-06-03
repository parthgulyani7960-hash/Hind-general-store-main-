import fs from 'fs';

const content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

// A simple lexical parser to find JSX tags and check their matching
const lines = content.split('\n');

const stack = [];
const tagRegex = /<(\/?[a-zA-Z][a-zA-Z0-9\.]*)([^>]*?)>/g;

for (let r = 0; r < lines.length; r++) {
  const line = lines[r];
  const lineNum = r + 1;
  let match;
  
  // We can also skip comments as a refinement, but let's see.
  // Match tags within the line
  while ((match = tagRegex.exec(line)) !== null) {
    const fullTag = match[0];
    const tagName = match[1];
    const isClosing = tagName.startsWith('/');
    const cleanTagName = isClosing ? tagName.slice(1) : tagName;
    const isSelfClosing = fullTag.endsWith('/>');

    if (isSelfClosing) {
      continue; // self-closing, ignore
    }

    if (!isClosing) {
      // Opening tag
      stack.push({ tag: cleanTagName, line: lineNum, text: fullTag });
    } else {
      // Closing tag
      if (stack.length === 0) {
        console.log(`Orphan closing tag </${cleanTagName}> at line ${lineNum}`);
      } else {
        const top = stack.pop();
        if (top.tag !== cleanTagName) {
          console.log(`Tag mismatch: </${cleanTagName}> at line ${lineNum} does not match <${top.tag}> at line ${top.line}`);
          // Put top back and continue to see other errors, or just exit.
          stack.push(top);
        }
      }
    }
  }
}

console.log('Unclosed tags left on stack:', stack.length);
if (stack.length > 0) {
  console.log('Top 15 unclosed tags:');
  stack.slice(-15).forEach((item, idx) => {
    console.log(`- <${item.tag}> opened at line ${item.line} (${item.text})`);
  });
}
