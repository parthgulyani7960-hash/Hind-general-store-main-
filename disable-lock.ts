import * as fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

// Disable all setFirebaseAccessDenied calls
content = content.replace(/setFirebaseAccessDenied\(true\)/g, "/* setFirebaseAccessDenied(true) */");

// Update isFirebaseAccessDenied to just return false always
content = content.replace(/const isFirebaseAccessDenied = \(\) => isFirebaseAccessDeniedFlag \|\| fs\.existsSync\(FLAG_PATH\) \|\| !isConfigured\(\);/g, "const isFirebaseAccessDenied = () => false;");

fs.writeFileSync('server.ts', content);
console.log('Disabled firebase access denied lock!');
