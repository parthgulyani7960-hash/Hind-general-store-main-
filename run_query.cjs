const Database = require('better-sqlite3');
const db = new Database('database.sqlite');
db.exec(`
  CREATE TABLE IF NOT EXISTS promotional_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    type TEXT, -- 'bogo', 'percent_off', 'fixed_off', 'fixed', 'percentage'
    target_type TEXT, -- 'category', 'product', 'all'
    target_id TEXT, -- category name or product id
    condition_qty INTEGER,
    reward_qty INTEGER,
    discount_value REAL,
    active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  INSERT OR IGNORE INTO promotional_rules (id, title, type, target_type, target_id, condition_qty, discount_value, active)
  VALUES (1, 'Fixed discount 50 off on 5 of product 101', 'fixed', 'product', '101', 5, 50, 1);
`);
const res = db.prepare('SELECT * FROM promotional_rules').all();
console.log(res);
