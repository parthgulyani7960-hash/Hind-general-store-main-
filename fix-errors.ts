import * as fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

// Replace standard empty catches with error messages
content = content.replace(/res\.status\(500\)\.json\(\{ success: false \}\)/g, "res.status(500).json({ success: false, message: err?.message || e?.message || 'Internal server error' })");
content = content.replace(/res\.status\(500\)\.json\(\{ \}\)/g, "res.status(500).json({ success: false, message: 'Internal server error' })");
content = content.replace(/res\.status\(500\)\.json\(\[\]\)/g, "res.status(500).json([])");

fs.writeFileSync('server.ts', content);
console.log('Fixed 500 error reporting');
