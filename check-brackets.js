import fs from 'fs';

const content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

// Strip string literals and comments to avoid counting characters inside comments or string templates
let clean = content;
clean = clean.replace(/\/\/.*$/gm, ''); // line comments
clean = clean.replace(/\/\*[\s\S]*?\*\//g, ''); // block comments
clean = clean.replace(/`[\s\S]*?`/g, '""'); // backticks
clean = clean.replace(/'[\s\S]*?'/g, '""'); // single quotes
clean = clean.replace(/"[\s\S]*?"/g, '""'); // double quotes

let openParen = 0;
let closeParen = 0;
let openBrace = 0;
let closeBrace = 0;
let openBracket = 0;
let closeBracket = 0;

for (let i = 0; i < clean.length; i++) {
  const char = clean[i];
  if (char === '(') openParen++;
  if (char === ')') closeParen++;
  if (char === '{') openBrace++;
  if (char === '}') closeBrace++;
  if (char === '[') openBracket++;
  if (char === ']') closeBracket++;
}

console.log('--- BRACKET BALANCE REPORT ---');
console.log('Parentheses ( ):', openParen, 'open,', closeParen, 'closed. Difference:', openParen - closeParen);
console.log('Braces { }:', openBrace, 'open,', closeBrace, 'closed. Difference:', openBrace - closeBrace);
console.log('Square brackets [ ]:', openBracket, 'open,', closeBracket, 'closed. Difference:', openBracket - closeBracket);
