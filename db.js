const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");

// In production, set DB_PATH to a file on a persistent disk
// (e.g. /data/reviews.db on Render, /app/data/reviews.db on Railway).
const DB_PATH = process.env.DB_PATH || path.join(__dirname, "reviews.db");

let db;

async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs();

  // Ensure the directory exists (for mounted-volume paths like /data)
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sku TEXT UNIQUE,
      image_url TEXT,
      category TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_email TEXT NOT NULL,
      customer_name TEXT,
      order_date TEXT NOT NULL,
      delivered_date TEXT,
      status TEXT DEFAULT 'delivered',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS review_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT UNIQUE NOT NULL,
      order_id TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (order_id) REFERENCES orders(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id TEXT NOT NULL,
      order_id TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_name TEXT,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      title TEXT,
      comment TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (order_id) REFERENCES orders(id)
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_tokens_token ON review_tokens(token)`);

  // ─── Würthle game tables ────────────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS wurthle_users (
      email TEXT PRIMARY KEY,
      name TEXT,
      streak INTEGER DEFAULT 0,
      max_streak INTEGER DEFAULT 0,
      played INTEGER DEFAULT 0,
      wins INTEGER DEFAULT 0,
      distribution TEXT DEFAULT '[0,0,0,0,0,0]',
      balance INTEGER DEFAULT 0,
      last_played_date TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS wurthle_puzzles (
      date TEXT PRIMARY KEY,
      puzzle_no INTEGER NOT NULL,
      answer TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS wurthle_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_email TEXT NOT NULL,
      puzzle_date TEXT NOT NULL,
      attempt_no INTEGER NOT NULL,
      guess TEXT NOT NULL,
      result TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS wurthle_results (
      user_email TEXT NOT NULL,
      puzzle_date TEXT NOT NULL,
      won INTEGER NOT NULL,
      attempts INTEGER NOT NULL,
      points_earned INTEGER DEFAULT 0,
      PRIMARY KEY (user_email, puzzle_date)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS wurthle_vouchers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_email TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      value INTEGER NOT NULL,
      cost INTEGER NOT NULL,
      expires_at TEXT NOT NULL,
      redeemed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS wurthle_activity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_email TEXT NOT NULL,
      label TEXT NOT NULL,
      amount INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_w_attempts ON wurthle_attempts(user_email, puzzle_date)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_w_activity ON wurthle_activity(user_email)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_w_vouchers ON wurthle_vouchers(user_email)`);

  saveDb();
  return db;
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

module.exports = { getDb, saveDb };
