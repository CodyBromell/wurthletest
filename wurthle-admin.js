// Würthle admin API — mounted at /api/wurthle/admin.
// Access is a single shared ADMIN_PASSWORD (env var, 12+ characters).

const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { query } = require("./db");
const { SECRET } = require("./tokens");
const { hashPassword, generateTemporaryPassword } = require("./passwords");

const router = express.Router();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const CAMPAIGN_START = process.env.CAMPAIGN_START || "2026-11-01";
const CAMPAIGN_END = process.env.CAMPAIGN_END || "2026-11-30";

function sameSecret(a, b) {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Admin sign-in required" });
  try {
    const decoded = jwt.verify(token, SECRET);
    if (decoded.wurthleAdmin !== 1) return res.status(401).json({ error: "Admin sign-in required" });
    next();
  } catch (err) {
    return res.status(401).json({ error: "Admin session expired" });
  }
}

// ─── POST /api/wurthle/admin/login ──────────────────────────────────
router.post("/login", async (req, res) => {
  if (ADMIN_PASSWORD.length < 12) {
    return res.status(503).json({ error: "Admin access isn't set up yet. Add ADMIN_PASSWORD (12+ characters) in Vercel and redeploy." });
  }
  const password = String(req.body.password || "");
  if (!sameSecret(password, ADMIN_PASSWORD)) {
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return res.status(401).json({ error: "Incorrect admin password." });
  }
  const token = jwt.sign({ wurthleAdmin: 1 }, SECRET, { expiresIn: "8h" });
  res.json({ token });
});

const PLAYER_COLUMNS = `
  u.customer_number, u.name, u.created_at, u.last_login_at, u.last_played_date,
  u.played, u.wins, u.streak, u.balance, u.leaderboard_opt_in, u.leaderboard_opt_in_at,
  u.must_change_password, u.locked_until, (u.password_hash IS NOT NULL) AS has_password,
  COALESCE((SELECT SUM(r.points_earned) FROM wurthle_results r
            WHERE r.customer_number = u.customer_number
              AND r.puzzle_date BETWEEN ? AND ?), 0)::int AS campaign_points`;

function likePattern(q) {
  return "%" + q.replace(/[\\%_]/g, (c) => "\\" + c) + "%";
}

async function findPlayers(search, limit) {
  const q = String(search || "").trim();
  return query(
    `SELECT ${PLAYER_COLUMNS}
     FROM wurthle_users u
     WHERE (? = '' OR u.customer_number ILIKE ? OR u.name ILIKE ?)
     ORDER BY u.created_at DESC
     ${limit ? "LIMIT " + Number(limit) : ""}`,
    [CAMPAIGN_START, CAMPAIGN_END, q, likePattern(q), likePattern(q)]
  );
}

function playerStatus(p) {
  if (!p.has_password) return "No password";
  if (p.locked_until && new Date(p.locked_until) > new Date()) return "Locked";
  if (p.must_change_password) return "Temporary password";
  return "Active";
}

// ─── GET /api/wurthle/admin/players?q= ──────────────────────────────
router.get("/players", requireAdmin, async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const [summary] = await query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE created_at >= date_trunc('day', NOW()))::int AS today,
         COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int AS week,
         COUNT(*) FILTER (WHERE last_played_date = ?)::int AS played_today,
         COUNT(*) FILTER (WHERE leaderboard_opt_in = 1)::int AS opted_in
       FROM wurthle_users`,
      [today]
    );
    const players = (await findPlayers(req.query.q, 500)).map((p) => ({ ...p, status: playerStatus(p) }));
    res.json({ summary, players, campaign: { start: CAMPAIGN_START, end: CAMPAIGN_END } });
  } catch (err) {
    console.error("admin/players error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/wurthle/admin/players.csv ─────────────────────────────
function csvCell(v) {
  if (v === null || v === undefined) return "";
  let s = v instanceof Date ? v.toISOString() : String(v);
  if (/^[=+\-@]/.test(s)) s = "'" + s; // stop spreadsheet formula injection
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

router.get("/players.csv", requireAdmin, async (req, res) => {
  try {
    const players = await findPlayers("", null);
    const header = ["customer_number", "name", "signed_up", "last_sign_in", "last_played", "played", "wins",
      "streak", "balance", "november_points", "leaderboard_opt_in", "opted_in_at", "status"];
    const rows = players.map((p) => [p.customer_number, p.name, p.created_at, p.last_login_at, p.last_played_date,
      p.played, p.wins, p.streak, p.balance, p.campaign_points, p.leaderboard_opt_in ? "yes" : "no",
      p.leaderboard_opt_in_at, playerStatus(p)].map(csvCell).join(","));
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="wurthle-players-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send("﻿" + [header.join(","), ...rows].join("\n"));
  } catch (err) {
    console.error("admin/players.csv error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /api/wurthle/admin/players/:customerNumber/reset-password ─
router.post("/players/:customerNumber/reset-password", requireAdmin, async (req, res) => {
  try {
    const customerNumber = String(req.params.customerNumber || "");
    const temporaryPassword = generateTemporaryPassword();
    const updated = await query(
      `UPDATE wurthle_users
       SET password_hash = ?, must_change_password = 1, failed_logins = 0, locked_until = NULL
       WHERE customer_number = ?
       RETURNING customer_number, name`,
      [await hashPassword(temporaryPassword), customerNumber]
    );
    if (!updated.length) return res.status(404).json({ error: "No player with that customer number." });
    console.log(`[admin] password reset for customer ${customerNumber}`);
    res.json({ customerNumber, name: updated[0].name, temporaryPassword });
  } catch (err) {
    console.error("admin/reset-password error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
