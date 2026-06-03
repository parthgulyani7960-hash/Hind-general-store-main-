
import fs from 'fs';
const content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const stack = [];
let i = 0;
while (i < content.length) {
    if (content.slice(i, i + 2) === '/*') {
        stack.push(i);
        i += 2;
    } else if (content.slice(i, i + 2) === '*/') {
        if (stack.length > 0) {
            stack.pop();
        } else {
            console.log('Unmatched */ at index', i);
        }
        i += 2;
    } else {
        i++;
    }
}

console.log('Remaining unclosed comments:', stack.length);
stack.forEach(index => {
  const line = content.slice(0, index).split('\n').length;
  console.log('Unclosed /* at line', line);
});
