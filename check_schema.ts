import Database from 'better-sqlite3';
import fs from 'fs';

const path = fs.existsSync('/tmp/store.db') ? '/tmp/store.db' : 'store.db';
const db = new Database(path);

try {
    const info = db.prepare('PRAGMA table_info(orders)').all();
    console.log('Path:', path);
    console.log(info);
} catch (err) {
    console.error(err);
}
