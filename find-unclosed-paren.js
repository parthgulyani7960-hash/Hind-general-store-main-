
import fs from 'fs';
const content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const stack = [];
for (let i = 0; i < content.length; i++) {
  if (content[i] === '(') {
    stack.push(i);
  } else if (content[i] === ')') {
    if (stack.length > 0) {
      stack.pop();
    } else {
      console.log('Unmatched ) at', i);
    }
  }
}

console.log('Unmatched ( at indices:', stack);
stack.forEach(index => {
  const line = content.slice(0, index).split('\n').length;
  console.log('Unclosed ( at line', line);
});
