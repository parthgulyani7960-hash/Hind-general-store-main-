import fs from 'fs';

const content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

let i = 0;
const stack = [];
let lineNum = 1;
let colNum = 1;

while (i < content.length) {
  const char = content[i];

  // Helper function to advance
  function advance() {
    if (content[i] === '\n') {
      lineNum++;
      colNum = 1;
    } else {
      colNum++;
    }
    i++;
  }

  // Skip comments
  if (char === '/' && content[i + 1] === '/') {
    advance(); advance();
    while (i < content.length && content[i] !== '\n') {
      advance();
    }
    continue;
  }
  if (char === '/' && content[i + 1] === '*') {
    advance(); advance();
    while (i < content.length && !(content[i] === '*' && content[i + 1] === '/')) {
      advance();
    }
    advance(); advance();
    continue;
  }

  // Skip double-quoted string
  if (char === '"') {
    const startLine = lineNum;
    advance();
    while (i < content.length && content[i] !== '"') {
      if (content[i] === '\\') advance();
      advance();
    }
    if (i >= content.length) {
      console.log(`Unclosed double quote starting at line ${startLine}`);
    }
    advance();
    continue;
  }

  // Skip single-quoted string
  if (char === "'") {
    const startLine = lineNum;
    advance();
    while (i < content.length && content[i] !== "'") {
      if (content[i] === '\\') advance();
      advance();
    }
    if (i >= content.length) {
      console.log(`Unclosed single quote starting at line ${startLine}`);
    }
    advance();
    continue;
  }

  // Skip backtick string
  if (char === '`') {
    const startLine = lineNum;
    advance();
    while (i < content.length && content[i] !== '`') {
      if (content[i] === '\\') advance();
      advance();
    }
    if (i >= content.length) {
      console.log(`Unclosed backtick starting at line ${startLine}`);
    }
    advance();
    continue;
  }

  if (char === '(') {
    stack.push({ line: lineNum, col: colNum, type: '(' });
  } else if (char === ')') {
    if (stack.length === 0) {
      console.log(`Orphan ) at Line ${lineNum}, Col ${colNum}`);
    } else {
      stack.pop();
    }
  }
  advance();
}

console.log('Unclosed parenthesis left on stack:', stack.length);
if (stack.length > 0) {
  stack.forEach((item) => {
    console.log(`Unclosed ( at Line ${item.line}, Col ${item.col}`);
  });
}
