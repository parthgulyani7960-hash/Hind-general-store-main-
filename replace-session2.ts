import * as fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(/req\.session\.destroy\(\(\) => \{\}\);/g, "req.session = null;");

// find remaining session setups
content = content.replace(/app\.use\(session\(/g, "app.use(cookieSession(");

fs.writeFileSync('server.ts', content);
console.log('Fixed remaining session hooks');
