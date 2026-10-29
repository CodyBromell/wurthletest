// Postgres via postgres.js. Works with Supabase's connection pooler
// (transaction mode, port 6543), Neon, or any Postgres connection string.
// On Vercel: set DATABASE_URL to your Supabase pooler URL.

const postgres = require("postgres");

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.warn("⚠ DATABASE_URL not set — every DB call will fail. Set it to your Supabase pooler connection string.");
}

// Serverless-friendly config: one connection per invocation, short timeouts.
// Supabase requires SSL.
const sql = DATABASE_URL
  ? postgres(DATABASE_URL, {
      ssl: "require",
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false, // required for Supabase transaction-mode pooler
    })
  : null;

// Convert `?` placeholders (SQLite style) to `$1, $2, ...` (Postgres style)
// so we don't have to rewrite every query.
function convertPlaceholders(sqlText) {
  let n = 0;
  return sqlText.replace(/\?/g, () => `$${++n}`);
}

async function query(sqlText, params = []) {
  if (!sql) throw new Error("Database not configured (DATABASE_URL missing)");
  const converted = convertPlaceholders(sqlText);
  // postgres.js returns a Result that's array-like; normalise to a plain array.
  const rows = await sql.unsafe(converted, params);
  return Array.from(rows);
}

// Idempotent schema migrations. Called once per cold-start on Vercel.
let initDone = false;
let initPromise = null;

async function initDb() {
  if (initDone) return;
  if (initPromise) return initPromise;
  if (!sql) throw new Error("DATABASE_URL not set");

  initPromise = (async () => {
    // ─── Review-system tables ───────────────────────────────────────
    await query(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        sku TEXT UNIQUE,
        image_url TEXT,
        category TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        customer_email TEXT NOT NULL,
        customer_name TEXT,
        order_date TEXT NOT NULL,
        delivered_date TEXT,
        status TEXT DEFAULT 'delivered',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        quantity INTEGER DEFAULT 1
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS review_tokens (
        id SERIAL PRIMARY KEY,
        token TEXT UNIQUE NOT NULL,
        order_id TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        used INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        product_id TEXT NOT NULL,
        order_id TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        customer_name TEXT,
        rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
        title TEXT,
        comment TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_tokens_token ON review_tokens(token)`);

    // ─── Würthle game tables ────────────────────────────────────────
    await query(`
      CREATE TABLE IF NOT EXISTS wurthle_users (
        email TEXT PRIMARY KEY,
        name TEXT,
        streak INTEGER DEFAULT 0,
        max_streak INTEGER DEFAULT 0,
        played INTEGER DEFAULT 0,
        wins INTEGER DEFAULT 0,
        distribution TEXT DEFAULT '[0,0,0,0,0]',
        balance INTEGER DEFAULT 0,
        last_played_date TEXT,
        leaderboard_opt_in INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS wurthle_puzzles (
        date TEXT PRIMARY KEY,
        puzzle_no INTEGER NOT NULL,
        answer TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS wurthle_attempts (
        id SERIAL PRIMARY KEY,
        user_email TEXT NOT NULL,
        puzzle_date TEXT NOT NULL,
        attempt_no INTEGER NOT NULL,
        guess TEXT NOT NULL,
        result TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS wurthle_results (
        user_email TEXT NOT NULL,
        puzzle_date TEXT NOT NULL,
        won INTEGER NOT NULL,
        attempts INTEGER NOT NULL,
        points_earned INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (user_email, puzzle_date)
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS wurthle_vouchers (
        id SERIAL PRIMARY KEY,
        user_email TEXT NOT NULL,
        code TEXT UNIQUE NOT NULL,
        value INTEGER NOT NULL,
        cost INTEGER NOT NULL,
        expires_at TEXT NOT NULL,
        redeemed INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS wurthle_activity (
        id SERIAL PRIMARY KEY,
        user_email TEXT NOT NULL,
        label TEXT NOT NULL,
        amount INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_w_attempts ON wurthle_attempts(user_email, puzzle_date)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_w_activity ON wurthle_activity(user_email)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_w_vouchers ON wurthle_vouchers(user_email)`);

    initDone = true;
  })();

  try {
    await initPromise;
  } catch (err) {
    initPromise = null;
    throw err;
  }
}

module.exports = { query, initDb };
