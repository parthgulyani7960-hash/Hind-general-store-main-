const Database = require('better-sqlite3');
const db = new Database('database.sqlite');
const user = db.prepare("SELECT email, role FROM users WHERE email = 'parthgulyani7960@gmail.com'").get();
console.log(user);
