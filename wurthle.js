const express = require("express");
const jwt = require("jsonwebtoken");
const { query } = require("./db");
const { SECRET } = require("./tokens");
const { hashPassword, verifyPassword } = require("./passwords");

const router = express.Router();

// ─── Word lists (server-side only — never sent to client) ───────────
const ANSWERS = [
  "HOUSE","PLANT","BRAIN","SHARE","LIGHT","WATER","SMILE","STONE","PRIDE","GRADE",
  "DRILL","BRACE","METAL","RIVET","PAINT","CLAMP","SCREW","TORCH","VALVE","HINGE",
  "LATCH","STEEL","BRASS","MOTOR","POWER","WHEEL","BUILD","FORGE","GLOVE","CRANE",
  "GRAIN","THINK","THANK","EVERY","OTHER","THERE","WHERE","WHICH","WRITE","PAPER",
  "POINT","PLACE","MONEY","STORY","SHINE","SHORE","STORM","STORE","SCORE","SHADE",
  "SHAPE","SHAKE","BRIDE","TRICK","BRICK","CLICK","CLOCK","BLOCK","STICK","THICK",
  "QUICK","PHASE","PRIZE","PRIME","CRIME","DRAIN","PLAIN","STAIN","FAITH","SAINT"
];

const EXTRA_GUESSES = [
  "SLATE","TRACE","CRATE","ADIEU","AUDIO","RAISE","AROSE","LEAST","STARE","TEARS",
  "NOTES","NIGHT","MIGHT","RIGHT","SIGHT","FIGHT","TIGHT","EIGHT","APPLE","HAPPY",
  "HELLO","WORLD","MUSIC","PIANO","TABLE","CHAIR","PHONE","BOARD","PRESS","CABLE",
  "TOOLS","PARTS","STOCK","TRADE","MIXER","PUMPS","TRAIN","TRAIL","BRING","THEIR",
  "WORDS","WROTE","PUNCH","TOUCH","WATCH","CATCH","MATCH","BATCH","PATCH","HATCH",
  "HOIST","SPARK","MOUNT","BOLTS","WELDS","PIPES","PIVOT","SHEET","ANGLE","EARTH",
  "EAGLE","LEMON","LEVEL","LABEL","MAGIC","MODEL","NORTH","SOUTH","GREEN","HEART",
  "HEAVY","HOTEL","HUMAN","LARGE","LEARN","MAYBE","MONTH","MOUTH","MOVIE","NEVER",
  "OCEAN","ORDER","PARTY","PEACE","PHOTO","PIECE","PILOT","PITCH","PRICE","PROUD",
  "QUEEN","QUEST","RADIO","RANGE","RAPID","REACH","READY","REPLY","RIVER","ROUGH",
  "ROUND","ROUTE","ROYAL","SCENE","SENSE","SHARP","SHEEP","SHIFT","SHIRT","SHORT",
  "SHOWN","SILLY","SINCE","SKILL","SLEEP","SLIDE","SMART","SOLID","SORRY","SOUND",
  "SPACE","SPEAK","SPEED","SPEND","SPLIT","SPOKE","SPORT","STAFF","STAGE","STAND",
  "START","STATE","STEAM","STIFF","STILL","STOOD","STUCK","STUDY","STUFF","SUGAR",
  "SUITE","SUPER","SWEET","TASTE","TEACH","TEETH","THEME","THOSE","THREE","THREW",
  "THROW","THUMB","TIRED","TITLE","TODAY","TOPIC","TOTAL","TOUGH","TOWER","TRACK",
  "TREAT","TREND","TRIAL","TRUCK","TRULY","TRUNK","TRUST","TRUTH","UNDER","UNION",
  "UNTIL","UPPER","UPSET","URBAN","USAGE","USUAL","VALID","VALUE","VIDEO","VISIT",
  "VITAL","VOICE","WASTE","WHILE","WHITE","WHOLE","WHOSE","WOMAN","WOMEN","WORRY",
  "WORSE","WORST","WORTH","WOULD","WRONG","YIELD","YOUNG","YOUTH"
];

const VALID_GUESSES = new Set([...ANSWERS, ...EXTRA_GUESSES]);

const EPOCH = new Date("2026-01-01T00:00:00Z");
const MAX_ATTEMPTS = 5;

// ─── PLAY. SPEND. WIN. campaign window ───────────────────────────────
const CAMPAIGN_START = process.env.CAMPAIGN_START || "2026-11-01";
const CAMPAIGN_END   = process.env.CAMPAIGN_END   || "2026-11-30";
const LEADERBOARD_SIZE = 50;

// ─── Accounts ───────────────────────────────────────────────────────
// Würth UK customer numbers start with 308.
const CUSTOMER_NUMBER_RE = /^308\d{4,9}$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_FAILED_LOGINS = 10;
const LOCKOUT_MINUTES = 15;
const SESSION_VERSION = 2; // bump to invalidate every existing session
const BAD_LOGIN = "Customer number or password is incorrect.";

// ─── Helpers ─────────────────────────────────────────────────────────
function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function puzzleNoFor(dateStr) {
  const d = new Date(dateStr + "T00:00:00Z");
  return Math.floor((d - EPOCH) / 86400000) + 1;
}

function pointsForStreak(streak) {
  if (streak >= 21) return 6;
  if (streak >= 14) return 5;
  if (streak >= 7) return 4;
  return 3;
}

function scoreGuess(guess, answer) {
  const g = guess.split("");
  const a = answer.split("");
  const result = ["absent", "absent", "absent", "absent", "absent"];
  const consumed = [false, false, false, false, false];
  for (let i = 0; i < 5; i++) {
    if (g[i] === a[i]) { result[i] = "correct"; consumed[i] = true; }
  }
  for (let i = 0; i < 5; i++) {
    if (result[i] === "correct") continue;
    for (let j = 0; j < 5; j++) {
      if (!consumed[j] && g[i] === a[j]) {
        result[i] = "present"; consumed[j] = true; break;
      }
    }
  }
  return result;
}

function generateVoucherCode() {
  return "WUR-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function getOrCreatePuzzle(dateStr) {
  const existing = await query(
    `SELECT date, puzzle_no, answer FROM wurthle_puzzles WHERE date = ?`,
    [dateStr]
  );
  if (existing.length) return existing[0];

  const puzzleNo = puzzleNoFor(dateStr);
  const answer = ANSWERS[(puzzleNo - 1) % ANSWERS.length];
  await query(
    `INSERT INTO wurthle_puzzles (date, puzzle_no, answer) VALUES (?, ?, ?)
     ON CONFLICT (date) DO NOTHING`,
    [dateStr, puzzleNo, answer]
  );
  return { date: dateStr, puzzle_no: puzzleNo, answer };
}

async function getUser(customerNumber) {
  const [row] = await query(`SELECT * FROM wurthle_users WHERE customer_number = ?`, [customerNumber]);
  return row || null;
}

async function addActivity(customerNumber, label, amount) {
  await query(
    `INSERT INTO wurthle_activity (customer_number, label, amount) VALUES (?, ?, ?)`,
    [customerNumber, label, amount]
  );
}

function normaliseCustomerNumber(raw) {
  return String(raw || "").replace(/\s+/g, "");
}

function issueSession(user) {
  const token = jwt.sign(
    { sub: user.customer_number, name: user.name, wurthle: SESSION_VERSION },
    SECRET,
    { expiresIn: "30d" }
  );
  return {
    token,
    user: { customerNumber: user.customer_number, name: user.name },
    mustChangePassword: !!user.must_change_password,
  };
}

// ─── Auth middleware ────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Sign in required" });
  try {
    const decoded = jwt.verify(token, SECRET);
    if (decoded.wurthle !== SESSION_VERSION || !decoded.sub) {
      return res.status(401).json({ error: "Please sign in again" });
    }
    req.user = { customerNumber: decoded.sub };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Session expired" });
  }
}

// ─── POST /api/wurthle/register ─────────────────────────────────────
// Customer numbers aren't verified against Würth's systems yet, so the
// first person to register a number owns it. Clearing password_hash in
// the database lets the real customer re-register and keep the progress.
router.post("/register", async (req, res) => {
  try {
    const customerNumber = normaliseCustomerNumber(req.body.customerNumber);
    const name = String(req.body.name || "").trim();
    const password = String(req.body.password || "");

    if (!CUSTOMER_NUMBER_RE.test(customerNumber)) {
      return res.status(400).json({ error: "Enter your Würth customer number — it starts with 308." });
    }
    if (name.length < 2 || name.length > 60) {
      return res.status(400).json({ error: "Enter your name (2–60 characters)." });
    }
    if (password.length < MIN_PASSWORD_LENGTH || password.length > 200) {
      return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
    }

    const existing = await getUser(customerNumber);
    if (existing && existing.password_hash) {
      return res.status(409).json({ error: "An account already exists for this customer number. Sign in instead." });
    }

    const passwordHash = await hashPassword(password);
    if (existing) {
      await query(
        `UPDATE wurthle_users SET name = ?, password_hash = ?, failed_logins = 0, locked_until = NULL,
           must_change_password = 0, last_login_at = NOW()
         WHERE customer_number = ?`,
        [name, passwordHash, customerNumber]
      );
    } else {
      await query(
        `INSERT INTO wurthle_users (customer_number, name, password_hash, last_login_at) VALUES (?, ?, ?, NOW())`,
        [customerNumber, name, passwordHash]
      );
    }

    res.json(issueSession({ customer_number: customerNumber, name }));
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "An account already exists for this customer number. Sign in instead." });
    }
    console.error("wurthle/register error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /api/wurthle/login ────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const customerNumber = normaliseCustomerNumber(req.body.customerNumber);
    const password = String(req.body.password || "");
    if (!customerNumber || !password) {
      return res.status(400).json({ error: "Enter your customer number and password." });
    }

    const user = await getUser(customerNumber);
    if (!user || !user.password_hash) {
      return res.status(401).json({ error: BAD_LOGIN });
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const mins = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      return res.status(429).json({ error: `Too many attempts. Try again in ${mins} minute${mins === 1 ? "" : "s"}.` });
    }

    if (!(await verifyPassword(password, user.password_hash))) {
      const failed = (user.failed_logins || 0) + 1;
      if (failed >= MAX_FAILED_LOGINS) {
        await query(
          `UPDATE wurthle_users SET failed_logins = 0,
             locked_until = NOW() + (? || ' minutes')::interval
           WHERE customer_number = ?`,
          [String(LOCKOUT_MINUTES), customerNumber]
        );
      } else {
        await query(`UPDATE wurthle_users SET failed_logins = ? WHERE customer_number = ?`, [failed, customerNumber]);
      }
      return res.status(401).json({ error: BAD_LOGIN });
    }

    await query(
      `UPDATE wurthle_users SET failed_logins = 0, locked_until = NULL, last_login_at = NOW()
       WHERE customer_number = ?`,
      [customerNumber]
    );

    res.json(issueSession(user));
  } catch (err) {
    console.error("wurthle/login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/wurthle/state ─────────────────────────────────────────
router.get("/state", requireAuth, async (req, res) => {
  try {
    const { customerNumber } = req.user;
    const dateStr = todayKey();

    const user = await getUser(customerNumber);
    if (!user) return res.status(401).json({ error: "Please sign in again" });
    const puzzle = await getOrCreatePuzzle(dateStr);

    const attemptRows = await query(
      `SELECT attempt_no, guess, result FROM wurthle_attempts
       WHERE customer_number = ? AND puzzle_date = ?
       ORDER BY attempt_no ASC`,
      [customerNumber, dateStr]
    );
    const attempts = attemptRows.map((r) => ({ guess: r.guess, result: JSON.parse(r.result) }));

    const resultRows = await query(
      `SELECT won, attempts, points_earned FROM wurthle_results
       WHERE customer_number = ? AND puzzle_date = ?`,
      [customerNumber, dateStr]
    );
    const todaysResult = resultRows[0] || null;

    const gameOver = !!todaysResult;
    const won = todaysResult ? !!todaysResult.won : false;

    const vouchers = await query(
      `SELECT id, code, value, expires_at FROM wurthle_vouchers
       WHERE customer_number = ? ORDER BY id DESC`,
      [customerNumber]
    );

    const activity = await query(
      `SELECT label, amount, created_at FROM wurthle_activity
       WHERE customer_number = ? ORDER BY id DESC LIMIT 10`,
      [customerNumber]
    );

    const [campaignRow] = await query(
      `SELECT COALESCE(SUM(points_earned), 0)::int AS pts
       FROM wurthle_results
       WHERE customer_number = ? AND puzzle_date BETWEEN ? AND ?`,
      [customerNumber,CAMPAIGN_START, CAMPAIGN_END]
    );
    const campaignPoints = campaignRow ? campaignRow.pts : 0;

    res.json({
      user: { customerNumber: user.customer_number, name: user.name },
      today: {
        puzzleNo: puzzle.puzzle_no,
        date: dateStr,
        attempts,
        won,
        gameOver,
        answer: gameOver ? puzzle.answer : null,
        maxAttempts: MAX_ATTEMPTS,
      },
      stats: {
        played: user.played,
        wins: user.wins,
        streak: user.streak,
        maxStreak: user.max_streak,
        distribution: JSON.parse(user.distribution),
      },
      balance: user.balance,
      pointsForToday: pointsForStreak(user.streak + (won ? 0 : 1)),
      vouchers,
      activity,
      leaderboardOptIn: !!user.leaderboard_opt_in,
      mustChangePassword: !!user.must_change_password,
      campaign: {
        start: CAMPAIGN_START,
        end: CAMPAIGN_END,
        points: campaignPoints,
      },
    });
  } catch (err) {
    console.error("wurthle/state error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /api/wurthle/opt-in ───────────────────────────────────────
router.post("/opt-in", requireAuth, async (req, res) => {
  try {
    const { customerNumber } = req.user;
    const optIn = req.body.optIn ? 1 : 0;
    // Opting in is acceptance of the campaign T&Cs, so keep when it happened.
    await query(
      `UPDATE wurthle_users SET leaderboard_opt_in = ?,
         leaderboard_opt_in_at = CASE WHEN ? = 1 THEN NOW() ELSE leaderboard_opt_in_at END
       WHERE customer_number = ?`,
      [optIn, optIn, customerNumber]
    );
    res.json({ success: true, leaderboardOptIn: !!optIn });
  } catch (err) {
    console.error("wurthle/opt-in error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /api/wurthle/change-password ──────────────────────────────
// After an admin reset (must_change_password = 1) the session itself
// proves the customer just signed in with the temporary password.
router.post("/change-password", requireAuth, async (req, res) => {
  try {
    const { customerNumber } = req.user;
    const currentPassword = String(req.body.currentPassword || "");
    const newPassword = String(req.body.newPassword || "");

    const user = await getUser(customerNumber);
    if (!user) return res.status(401).json({ error: "Please sign in again" });

    if (!user.must_change_password && !(await verifyPassword(currentPassword, user.password_hash))) {
      return res.status(400).json({ error: "Your current password is incorrect." });
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH || newPassword.length > 200) {
      return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
    }
    if (await verifyPassword(newPassword, user.password_hash)) {
      return res.status(400).json({ error: "Choose a password you haven't used here before." });
    }

    await query(
      `UPDATE wurthle_users SET password_hash = ?, must_change_password = 0 WHERE customer_number = ?`,
      [await hashPassword(newPassword), customerNumber]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("wurthle/change-password error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/wurthle/leaderboard ───────────────────────────────────
// Never falls back to the customer number — that must stay private.
function anonymiseName(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "Würthle player";
  if (parts.length >= 2) return parts[0] + " " + parts[1][0].toUpperCase() + ".";
  return parts[0].slice(0, 24);
}

router.get("/leaderboard", requireAuth, async (req, res) => {
  try {
    const { customerNumber: me } = req.user;

    const fullRanked = await query(
      `SELECT
          u.customer_number AS customer_number,
          u.name AS name,
          u.leaderboard_opt_in AS opt_in,
          SUM(r.points_earned)::int AS points,
          MAX(r.created_at) AS reached_at
       FROM wurthle_results r
       JOIN wurthle_users u ON u.customer_number = r.customer_number
       WHERE r.puzzle_date BETWEEN ? AND ?
       GROUP BY u.customer_number, u.name, u.leaderboard_opt_in
       HAVING SUM(r.points_earned) > 0
       ORDER BY points DESC, reached_at ASC`,
      [CAMPAIGN_START, CAMPAIGN_END]
    );

    const ranked = fullRanked.map((r, i) => ({
      rank: i + 1,
      displayName: r.opt_in ? anonymiseName(r.name) : "Anonymous player",
      points: r.points,
      isMe: r.customer_number === me,
      optedIn: !!r.opt_in,
    }));

    const top = ranked.slice(0, LEADERBOARD_SIZE);
    const meRow = ranked.find((r) => r.isMe) || null;

    res.json({
      campaign: { start: CAMPAIGN_START, end: CAMPAIGN_END, size: LEADERBOARD_SIZE },
      top,
      me: meRow && meRow.rank > LEADERBOARD_SIZE ? meRow : null,
      totalPlayers: ranked.length,
    });
  } catch (err) {
    console.error("wurthle/leaderboard error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /api/wurthle/guess ────────────────────────────────────────
router.post("/guess", requireAuth, async (req, res) => {
  try {
    const { customerNumber } = req.user;
    const dateStr = todayKey();
    const guess = (req.body.guess || "").toUpperCase();

    if (!/^[A-Z]{5}$/.test(guess)) {
      return res.status(400).json({ error: "Guess must be 5 letters" });
    }
    if (!VALID_GUESSES.has(guess)) {
      return res.status(400).json({ error: "Not in word list" });
    }

    const user = await getUser(customerNumber);
    if (!user) return res.status(401).json({ error: "Please sign in again" });
    const puzzle = await getOrCreatePuzzle(dateStr);

    const existingResult = await query(
      `SELECT won FROM wurthle_results WHERE customer_number = ? AND puzzle_date = ?`,
      [customerNumber,dateStr]
    );
    if (existingResult.length) {
      return res.status(400).json({ error: "Today's puzzle already finished" });
    }

    const [attemptCount] = await query(
      `SELECT COUNT(*)::int AS n FROM wurthle_attempts
       WHERE customer_number = ? AND puzzle_date = ?`,
      [customerNumber,dateStr]
    );
    const attempts = attemptCount ? attemptCount.n : 0;

    if (attempts >= MAX_ATTEMPTS) {
      return res.status(400).json({ error: "No attempts left" });
    }

    const result = scoreGuess(guess, puzzle.answer);
    const attemptNo = attempts + 1;
    await query(
      `INSERT INTO wurthle_attempts (customer_number, puzzle_date, attempt_no, guess, result)
       VALUES (?, ?, ?, ?, ?)`,
      [customerNumber,dateStr, attemptNo, guess, JSON.stringify(result)]
    );

    const won = guess === puzzle.answer;
    const finished = won || attemptNo === MAX_ATTEMPTS;
    let pointsEarned = 0;
    let newStreak = user.streak;
    let newBalance = user.balance;
    let newMaxStreak = user.max_streak;
    let newPlayed = user.played;
    let newWins = user.wins;
    let distribution = JSON.parse(user.distribution);
    while (distribution.length < MAX_ATTEMPTS) distribution.push(0);
    if (distribution.length > MAX_ATTEMPTS) distribution = distribution.slice(0, MAX_ATTEMPTS);

    if (finished) {
      newPlayed += 1;
      if (won) {
        newWins += 1;
        distribution[attemptNo - 1] += 1;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yKey = yesterday.toISOString().slice(0, 10);

        if (user.last_played_date === yKey || user.last_played_date == null) {
          newStreak += 1;
        } else if (user.last_played_date !== dateStr) {
          newStreak = 1;
        }
        newMaxStreak = Math.max(newMaxStreak, newStreak);
        pointsEarned = pointsForStreak(newStreak);
        newBalance += pointsEarned;
        await addActivity(customerNumber,`Würthle #${puzzle.puzzle_no} solved (${attemptNo}/${MAX_ATTEMPTS})`, pointsEarned);
      } else {
        newStreak = 0;
      }

      await query(
        `UPDATE wurthle_users SET
           streak = ?, max_streak = ?, played = ?, wins = ?,
           distribution = ?, balance = ?, last_played_date = ?
         WHERE customer_number = ?`,
        [newStreak, newMaxStreak, newPlayed, newWins,
         JSON.stringify(distribution), newBalance, dateStr, customerNumber]
      );

      await query(
        `INSERT INTO wurthle_results (customer_number, puzzle_date, won, attempts, points_earned)
         VALUES (?, ?, ?, ?, ?)`,
        [customerNumber,dateStr, won ? 1 : 0, attemptNo, pointsEarned]
      );
    }

    res.json({
      result,
      attemptNo,
      gameOver: finished,
      won,
      answer: finished ? puzzle.answer : null,
      pointsEarned,
      balance: newBalance,
      streak: newStreak,
      maxStreak: newMaxStreak,
    });
  } catch (err) {
    console.error("wurthle/guess error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /api/wurthle/redeem ───────────────────────────────────────
const REWARDS = {
  10: { cost: 100, minOrder: 50 },
  25: { cost: 240, minOrder: 100 },
  50: { cost: 450, minOrder: 200 },
};

router.post("/redeem", requireAuth, async (req, res) => {
  try {
    const { customerNumber } = req.user;
    const value = parseInt(req.body.value);

    if (!REWARDS[value]) return res.status(400).json({ error: "Unknown reward" });
    const { cost } = REWARDS[value];

    const [user] = await query(`SELECT balance FROM wurthle_users WHERE customer_number = ?`, [customerNumber]);
    if (!user || user.balance < cost) return res.status(400).json({ error: "Not enough points" });

    const code = generateVoucherCode();
    const expiresAt = new Date(Date.now() + 90 * 86400000).toISOString();

    await query(
      `INSERT INTO wurthle_vouchers (customer_number, code, value, cost, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
      [customerNumber,code, value, cost, expiresAt]
    );
    await query(
      `UPDATE wurthle_users SET balance = balance - ? WHERE customer_number = ?`,
      [cost, customerNumber]
    );
    await addActivity(customerNumber,`Redeemed £${value} voucher`, -cost);

    res.json({
      success: true,
      voucher: { code, value, expiresAt },
      balance: user.balance - cost,
    });
  } catch (err) {
    console.error("wurthle/redeem error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
