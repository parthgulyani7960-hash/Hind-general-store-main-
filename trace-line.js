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
    if (currentLine === 6971) {
      console.log(`[Line ${currentLine}] Push '(' to parenStack. Current Stack:`, parenStack.length);
    }
  } else if (char === ')') {
    if (currentLine === 7509) {
      console.log(`[Line ${currentLine}] Popping ')' at line 7509. Stack before pop:`, parenStack.length, parenStack.slice(-3));
    }
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
