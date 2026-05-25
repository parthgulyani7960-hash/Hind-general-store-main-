const fs = require('fs');
const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
console.log('Config:', config);
