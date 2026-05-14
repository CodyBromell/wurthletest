const express = require("express");
const jwt = require("jsonwebtoken");
const { getDb, saveDb } = require("./db");
const { SECRET } = require("./tokens");

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

// ─── Helpers ─────────────────────────────────────────────────────────
function todayKey() {
  const d = new Date();
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
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
    if (g[i] === a[i]) {
      result[i] = "correct";
      consumed[i] = true;
    }
  }
  for (let i = 0; i < 5; i++) {
    if (result[i] === "correct") continue;
    for (let j = 0; j < 5; j++) {
      if (!consumed[j] && g[i] === a[j]) {
        result[i] = "present";
        consumed[j] = true;
        break;
      }
    }
  }
  return result;
}

function generateVoucherCode() {
  return "WUR-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

function rowsFromExec(execResult) {
  if (!execResult.length) return [];
  const { columns, values } = execResult[0];
  return values.map((row) => {
    const obj = {};
    columns.forEach((c, i) => (obj[c] = row[i]));
    return obj;
  });
}

function getOrCreatePuzzle(db, dateStr) {
  const existing = rowsFromExec(
    db.exec(`SELECT date, puzzle_no, answer FROM wurthle_puzzles WHERE date = ?`, [dateStr])
  );
  if (existing.length) return existing[0];

  const puzzleNo = puzzleNoFor(dateStr);
  const answer = ANSWERS[(puzzleNo - 1) % ANSWERS.length];
  db.run(
    `INSERT INTO wurthle_puzzles (date, puzzle_no, answer) VALUES (?, ?, ?)`,
    [dateStr, puzzleNo, answer]
  );
  return { date: dateStr, puzzle_no: puzzleNo, answer };
}

function getOrCreateUser(db, email, name) {
  const existing = rowsFromExec(
    db.exec(`SELECT * FROM wurthle_users WHERE email = ?`, [email])
  );
  if (existing.length) {
    if (name && existing[0].name !== name) {
      db.run(`UPDATE wurthle_users SET name = ? WHERE email = ?`, [name, email]);
      existing[0].name = name;
    }
    return existing[0];
  }
  db.run(
    `INSERT INTO wurthle_users (email, name) VALUES (?, ?)`,
    [email, name || null]
  );
  return rowsFromExec(
    db.exec(`SELECT * FROM wurthle_users WHERE email = ?`, [email])
  )[0];
}

function addActivity(db, email, label, amount) {
  db.run(
    `INSERT INTO wurthle_activity (user_email, label, amount) VALUES (?, ?, ?)`,
    [email, label, amount]
  );
}

// ─── Auth middleware ────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Sign in required" });
  try {
    const decoded = jwt.verify(token, SECRET);
    if (!decoded.wurthle) return res.status(401).json({ error: "Invalid session" });
    req.user = { email: decoded.email, name: decoded.name || "" };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Session expired" });
  }
}

// ─── POST /api/wurthle/login ────────────────────────────────────────
// Demo-grade login: accepts any email + name and returns a JWT.
// In production, swap this for SSO from the Würth eshop session,
// or a magic-link round-trip.
router.post("/login", async (req, res) => {
  try {
    const db = await getDb();
    const email = (req.body.email || "").trim().toLowerCase();
    const name = (req.body.name || "").trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Valid email required" });
    }

    getOrCreateUser(db, email, name);
    saveDb();

    const token = jwt.sign(
      { email, name, wurthle: true },
      SECRET,
      { expiresIn: "90d" }
    );

    res.json({ token, user: { email, name } });
  } catch (err) {
    console.error("wurthle/login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/wurthle/state ─────────────────────────────────────────
router.get("/state", requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const { email } = req.user;
    const dateStr = todayKey();

    const user = getOrCreateUser(db, email, req.user.name);
    const puzzle = getOrCreatePuzzle(db, dateStr);

    const attempts = rowsFromExec(
      db.exec(
        `SELECT attempt_no, guess, result FROM wurthle_attempts
         WHERE user_email = ? AND puzzle_date = ?
         ORDER BY attempt_no ASC`,
        [email, dateStr]
      )
    ).map((r) => ({ guess: r.guess, result: JSON.parse(r.result) }));

    const todaysResult = rowsFromExec(
      db.exec(
        `SELECT won, attempts, points_earned FROM wurthle_results
         WHERE user_email = ? AND puzzle_date = ?`,
        [email, dateStr]
      )
    )[0] || null;

    const gameOver = !!todaysResult;
    const won = todaysResult ? !!todaysResult.won : false;

    const vouchers = rowsFromExec(
      db.exec(
        `SELECT id, code, value, expires_at FROM wurthle_vouchers
         WHERE user_email = ? ORDER BY id DESC`,
        [email]
      )
    );

    const activity = rowsFromExec(
      db.exec(
        `SELECT label, amount, created_at FROM wurthle_activity
         WHERE user_email = ? ORDER BY id DESC LIMIT 10`,
        [email]
      )
    );

    saveDb();

    res.json({
      user: { email: user.email, name: user.name },
      today: {
        puzzleNo: puzzle.puzzle_no,
        date: dateStr,
        attempts,
        won,
        gameOver,
        answer: gameOver ? puzzle.answer : null,
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
    });
  } catch (err) {
    console.error("wurthle/state error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /api/wurthle/guess ────────────────────────────────────────
router.post("/guess", requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const { email } = req.user;
    const dateStr = todayKey();
    const guess = (req.body.guess || "").toUpperCase();

    if (!/^[A-Z]{5}$/.test(guess)) {
      return res.status(400).json({ error: "Guess must be 5 letters" });
    }
    if (!VALID_GUESSES.has(guess)) {
      return res.status(400).json({ error: "Not in word list" });
    }

    const user = getOrCreateUser(db, email, req.user.name);
    const puzzle = getOrCreatePuzzle(db, dateStr);

    const existingResult = rowsFromExec(
      db.exec(
        `SELECT won FROM wurthle_results WHERE user_email = ? AND puzzle_date = ?`,
        [email, dateStr]
      )
    )[0];
    if (existingResult) {
      return res.status(400).json({ error: "Today's puzzle already finished" });
    }

    const attempts = rowsFromExec(
      db.exec(
        `SELECT COUNT(*) AS n FROM wurthle_attempts
         WHERE user_email = ? AND puzzle_date = ?`,
        [email, dateStr]
      )
    )[0].n;

    if (attempts >= 6) {
      return res.status(400).json({ error: "No attempts left" });
    }

    const result = scoreGuess(guess, puzzle.answer);
    const attemptNo = attempts + 1;
    db.run(
      `INSERT INTO wurthle_attempts (user_email, puzzle_date, attempt_no, guess, result)
       VALUES (?, ?, ?, ?, ?)`,
      [email, dateStr, attemptNo, guess, JSON.stringify(result)]
    );

    const won = guess === puzzle.answer;
    const finished = won || attemptNo === 6;
    let pointsEarned = 0;
    let newStreak = user.streak;
    let newBalance = user.balance;
    let newMaxStreak = user.max_streak;
    let newPlayed = user.played;
    let newWins = user.wins;
    let distribution = JSON.parse(user.distribution);

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
        addActivity(db, email, `Würthle #${puzzle.puzzle_no} solved (${attemptNo}/6)`, pointsEarned);
      } else {
        newStreak = 0;
      }

      db.run(
        `UPDATE wurthle_users SET
           streak = ?, max_streak = ?, played = ?, wins = ?,
           distribution = ?, balance = ?, last_played_date = ?
         WHERE email = ?`,
        [newStreak, newMaxStreak, newPlayed, newWins,
         JSON.stringify(distribution), newBalance, dateStr, email]
      );

      db.run(
        `INSERT INTO wurthle_results (user_email, puzzle_date, won, attempts, points_earned)
         VALUES (?, ?, ?, ?, ?)`,
        [email, dateStr, won ? 1 : 0, attemptNo, pointsEarned]
      );
    }

    saveDb();

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
    const db = await getDb();
    const { email } = req.user;
    const value = parseInt(req.body.value);

    if (!REWARDS[value]) {
      return res.status(400).json({ error: "Unknown reward" });
    }
    const { cost } = REWARDS[value];

    const user = rowsFromExec(
      db.exec(`SELECT balance FROM wurthle_users WHERE email = ?`, [email])
    )[0];

    if (!user || user.balance < cost) {
      return res.status(400).json({ error: "Not enough points" });
    }

    const code = generateVoucherCode();
    const expiresAt = new Date(Date.now() + 90 * 86400000).toISOString();

    db.run(
      `INSERT INTO wurthle_vouchers (user_email, code, value, cost, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
      [email, code, value, cost, expiresAt]
    );
    db.run(
      `UPDATE wurthle_users SET balance = balance - ? WHERE email = ?`,
      [cost, email]
    );
    addActivity(db, email, `Redeemed £${value} voucher`, -cost);

    saveDb();

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
