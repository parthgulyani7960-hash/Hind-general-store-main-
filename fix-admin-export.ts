import * as fs from 'fs';
let content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

content = content.replace(/\['orders', 'users', 'products', 'wallet_transactions'\]\.map/g, "['orders', 'users', 'products', 'wallet_transactions', 'system_logs', 'audit_logs'].map");

fs.writeFileSync('src/pages/AdminDashboard.tsx', content);
console.log('Fixed export list');
