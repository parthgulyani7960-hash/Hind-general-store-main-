import fs from 'fs';

const content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

let i = 0;
const n = content.length;

let line = 1;
let col = 1;

const parenStack = [];
const braceStack = [];

while (i < n) {
  const char = content[i];
  
  const currentLine = line;
  const currentCol = col;
  
  if (char === '\n') {
    line++;
    col = 1;
  } else {
    col++;
  }

  // Handle line comment
  if (char === '/' && content[i + 1] === '/') {
    i += 2;
    col += 2;
    while (i < n && content[i] !== '\n') {
      i++;
    }
    continue;
  }

  // Handle block comment
  if (char === '/' && content[i + 1] === '*') {
    i += 2;
    col += 2;
    while (i < n && !(content[i] === '*' && content[i + 1] === '/')) {
      if (content[i] === '\n') {
        line++;
        col = 1;
      } else {
        col++;
      }
      i++;
    }
    if (i < n) {
      i += 2;
      col += 2;
    }
    continue;
  }

  // Handle double quoted string
  if (char === '"') {
    i++;
    while (i < n && content[i] !== '"') {
      if (content[i] === '\\') {
        i += 2;
        col += 2;
      } else {
        if (content[i] === '\n') {
          line++;
          col = 1;
        } else {
          col++;
        }
        i++;
      }
    }
    if (i < n) {
      i++;
      col++;
    }
    continue;
  }

  // Handle single quoted string
  if (char === "'") {
    i++;
    while (i < n && content[i] !== "'") {
      if (content[i] === '\\') {
        i += 2;
        col += 2;
      } else {
        if (content[i] === '\n') {
          line++;
          col = 1;
        } else {
          col++;
        }
        i++;
      }
    }
    if (i < n) {
      i++;
      col++;
    }
    continue;
  }

  // Handle backtick template literal
  if (char === '`') {
    i++;
    while (i < n && content[i] !== '`') {
      if (content[i] === '\\') {
        i += 2;
        col += 2;
      } else if (content[i] === '$' && content[i + 1] === '{') {
        i += 2;
        col += 2;
        // In template interpolation, we push a brace representing the dynamic expression
        braceStack.push({ line, col, char: '{', fromTemplate: true });
        continue;
      } else {
        if (content[i] === '\n') {
          line++;
          col = 1;
        } else {
          col++;
        }
        i++;
      }
    }
    if (i < n) {
      i++;
      col++;
    }
    continue;
  }

  // Bracket counting
  if (char === '(') {
    parenStack.push({ line: currentLine, col: currentCol, char });
  } else if (char === ')') {
    if (parenStack.length > 0) {
      parenStack.pop();
    }
  } else if (char === '{') {
    braceStack.push({ line: currentLine, col: currentCol, char });
  } else if (char === '}') {
    if (braceStack.length > 0) {
      braceStack.pop();
    }
  }

  i++;
}

console.log('--- SUMMARY BALANCE CHECK ---');
console.log('Unclosed ( parens left on stack:', parenStack.length);
if (parenStack.length > 0) {
  console.log('Top 15 unclosed parens:');
  parenStack.slice(-15).forEach(p => {
    const lineContent = content.split('\n')[p.line - 1];
    console.log(`  - Parenthesis '(' on line ${p.line}, col ${p.col} : "${lineContent.trim()}"`);
  });
}

console.log('Unclosed { braces left on stack:', braceStack.length);
if (braceStack.length > 0) {
  console.log('Top 15 unclosed braces:');
  braceStack.slice(-15).forEach(b => {
    const lineContent = content.split('\n')[b.line - 1];
    console.log(`  - Brace '{' on line ${b.line}, col ${b.col} (fromTemplate: ${!!b.fromTemplate}) : "${lineContent.trim()}"`);
  });
}
