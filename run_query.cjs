const Database = require('better-sqlite3');
const db = new Database('database.sqlite');
const count = db.prepare("SELECT COUNT(*) as count FROM users").get();
console.log(count);
