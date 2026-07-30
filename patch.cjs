const fs = require('fs');

const file = 'src/main.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /let currentToken = localStorage\.getItem\('hgs_token'\);/,
  `let currentToken: string | null = null;
          try {
            currentToken = localStorage.getItem('hgs_token');
          } catch (storageErr) {
            console.warn('[AUTH INTERCEPTOR] Cannot access localStorage', storageErr);
          }`
);

fs.writeFileSync(file, content);
console.log('patched main.tsx');
