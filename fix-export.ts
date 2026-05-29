import * as fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace("const allowed = ['orders', 'users', 'products', 'wallet_transactions'];", "const allowed = ['orders', 'users', 'products', 'wallet_transactions', 'system_logs', 'audit_logs'];");

content = content.replace(/if \(entity === 'orders' \|\| entity === 'users' \|\| entity === 'wallet_transactions'\) \{/g, "if (entity === 'orders' || entity === 'users' || entity === 'wallet_transactions' || entity === 'system_logs' || entity === 'audit_logs') {");

fs.writeFileSync('server.ts', content);
console.log('Fixed export endpoints for system_logs');
