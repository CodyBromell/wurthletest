// Daily report for the Würthle admin dashboard.
// A pure function: it takes the raw rows and returns everything the
// "Daily report" tab shows, so it can be tested without a database.
// Days are puzzle day keys (UTC dates, the same as UK dates in winter).
// Test accounts (is_test = 1) are left out of every number.

const DAY_MS = 864e5;
const PROJECTION_WEEKS = 26; // counted from week 1, about six months
const PUSH = 15;             // extra sign-ups from a monthly promotion, about half of launch week

function addDays(d, n) {
  const x = new Date(d + "T00:00:00Z");
  x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
}
const dayOfWeek = (d) => new Date(d + "T00:00:00Z").getUTCDay(); // 0 Sun … 6 Sat

// Week 1 starts on the first Monday on or after the campaign start.
function firstMonday(d) {
  let x = d;
  while (dayOfWeek(x) !== 1) x = addDays(x, 1);
  return x;
}

function countBy(items, keyFn) {
  const out = {};
  for (const it of items) {
    const k = keyFn(it);
    if (k) out[k] = (out[k] || 0) + 1;
  }
  return out;
}

const time = (v) => (v ? new Date(v).getTime() : 0);

function buildDailyReport({ date, now, campaign, users, activity, results, doublePoints }) {
  const nowMs = time(now);
  const real = users.filter((u) => !u.is_test);
  const people = new Map(real.map((u) => [u.customer_number, { ...u, days: new Map(), first: null }]));
  for (const a of activity) {
    const p = people.get(a.customer_number);
    if (p) p.days.set(a.date, a);
  }
  for (const p of people.values()) p.first = [...p.days.keys()].sort()[0] || null;
  const list = [...people.values()];
  const games = results.filter((r) => people.has(r.customer_number));

  // ── Today ──────────────────────────────────────────────────────────
  const resultFor = (d) => new Map(games.filter((r) => r.date === d).map((r) => [r.customer_number, r]));
  const todayResults = resultFor(date);
  const todayGames = list
    .filter((p) => p.days.has(date))
    .map((p) => {
      const r = todayResults.get(p.customer_number);
      const a = p.days.get(date);
      return {
        name: p.name || "",
        at: r ? r.created_at : a.first_at,
        status: r ? (r.won ? "won" : "lost") : "playing",
        guesses: r ? r.attempts : a.guesses,
        points: r ? r.points : 0,
        streak: p.streak,
        firstGame: p.first === date,
      };
    })
    .sort((x, y) => time(x.at) - time(y.at));

  // Yesterday, all day and by this time of day, for comparison.
  const yesterday = addDays(date, -1);
  const playedYesterday = list.filter((p) => p.days.has(yesterday));
  const today = {
    players: todayGames.length,
    won: todayGames.filter((g) => g.status === "won").length,
    lost: todayGames.filter((g) => g.status === "lost").length,
    playing: todayGames.filter((g) => g.status === "playing").length,
    signups: list.filter((p) => p.joined === date).length,
    firstGames: list.filter((p) => p.first === date).length,
    optIns: list.filter((p) => p.opt_in && p.opted_in_on === date).length,
    yesterday: {
      players: playedYesterday.length,
      byThisTime: playedYesterday.filter((p) => time(p.days.get(yesterday).first_at) <= nowMs - DAY_MS).length,
    },
  };

  // ── Campaign so far ────────────────────────────────────────────────
  const played = list.filter((p) => p.days.size > 0);
  const cutoff = addDays(date, -3); // first played by here = had 2+ full days to come back
  const couldReturn = played.filter((p) => p.first <= cutoff);
  const wins = games.filter((r) => r.won);
  const totals = {
    customers: list.length,
    played: played.length,
    couldReturn: couldReturn.length,
    cameBack: couldReturn.filter((p) => p.days.size >= 2).length,
    regulars: played.filter((p) => p.days.size >= 3).length,
    optedIn: list.filter((p) => p.opt_in).length,
    onStreak: list.filter((p) => p.streak >= 1).length,
    games: games.length,
    wins: wins.length,
    avgGuesses: wins.length ? wins.reduce((s, r) => s + r.attempts, 0) / wins.length : null,
  };

  // ── Day by day (up to the last four weeks) ─────────────────────────
  const week1 = firstMonday(campaign.start);
  const signupsOn = countBy(list, (p) => p.joined);
  const playersOn = {};
  for (const p of list) for (const d of p.days.keys()) playersOn[d] = (playersOn[d] || 0) + 1;
  const gamesOn = countBy(games, (r) => r.date);
  const winsOn = countBy(wins, (r) => r.date);
  const daily = [];
  const dailyFrom = week1 > addDays(date, -27) ? week1 : addDays(date, -27);
  for (let d = dailyFrom; d <= date; d = addDays(d, 1)) {
    daily.push({ date: d, players: playersOn[d] || 0, signups: signupsOn[d] || 0, games: gamesOn[d] || 0, wins: winsOn[d] || 0 });
  }

  // ── Week by week (Mon–Sun from week 1; anything earlier counts in week 1) ─
  const weekIndex = (d) => (d < week1 ? 0 : Math.floor((time(d + "T00:00:00Z") - time(week1 + "T00:00:00Z")) / (7 * DAY_MS)));
  const nWeeks = date < week1 ? 0 : weekIndex(date) + 1;
  const weeks = Array.from({ length: nWeeks }, (_, i) => {
    const start = addDays(week1, 7 * i), end = addDays(start, 6);
    return { n: i + 1, start, end, partial: date <= end, signups: 0, players: 0, newPlayers: 0, playerDays: 0, games: 0, wins: 0 };
  });
  const activeIn = weeks.map(() => new Set());
  for (const p of list) {
    if (weeks[weekIndex(p.joined)]) weeks[weekIndex(p.joined)].signups++;
    if (p.first && weeks[weekIndex(p.first)]) weeks[weekIndex(p.first)].newPlayers++;
    for (const d of p.days.keys()) {
      const w = weekIndex(d);
      if (!weeks[w]) continue;
      weeks[w].playerDays++;
      activeIn[w].add(p.customer_number);
    }
  }
  weeks.forEach((w, i) => { w.players = activeIn[i].size; });
  for (const r of games) {
    const w = weeks[weekIndex(r.date)];
    if (!w) continue;
    w.games++;
    if (r.won) w.wins++;
  }

  // ── Six-month outlook (from the last two full weeks) ───────────────
  let projection = null;
  const full = weeks.filter((w) => !w.partial);
  if (full.length >= 2 && full[full.length - 1].n < PROJECTION_WEEKS && list.length) {
    const last = full[full.length - 1], prev = full[full.length - 2];
    const ratio = prev.signups ? last.signups / prev.signups : 0;
    const trickle = Math.max(0, last.signups - (signupsOn[last.start] || 0)); // last full week without its Monday spike
    const hasFirstOfMonth = (k) => k < PROJECTION_WEEKS && [0, 1, 2, 3, 4, 5, 6].some((i) => addDays(week1, (k - 1) * 7 + i).slice(8) === "01");
    const base = full.reduce((s, w) => s + w.signups, 0);
    let low = base, mid = base, high = base, weekly = last.signups, pushes = 0;
    for (let k = last.n + 1; k <= PROJECTION_WEEKS; k++) {
      weekly *= ratio;
      low += weekly;
      mid += trickle;
      if (hasFirstOfMonth(k)) { high += trickle + PUSH; pushes++; } else high += trickle;
    }
    const playRate = totals.played / list.length, regRate = totals.regulars / list.length;
    const scenario = (name, tag, what, signups) => ({ name, tag, what, signups, played: signups * playRate, regulars: signups * regRate });
    projection = {
      endDate: addDays(week1, PROJECTION_WEEKS * 7 - 1),
      basedOn: { prev: prev.n, last: last.n },
      scenarios: [
        scenario("Low", "Let it run down",
          ratio < 1
            ? `Weekly sign-ups keep falling the way they did from week ${prev.n} to week ${last.n} (${Math.round((1 - ratio) * 100)}% fewer each week).`
            : `Weekly sign-ups carry on the way they went from week ${prev.n} to week ${last.n} (${ratio === 1 ? "no change" : Math.round((ratio - 1) * 100) + "% more each week"}).`, low),
        scenario("Mid", "Steady trickle",
          `About ${trickle} a week, week ${last.n}'s pace without its Monday spike.`, mid),
        scenario("High", "Monthly push",
          `The trickle, plus a promotion in the first week of each month (${pushes} more) that adds about ${PUSH} each.`, high),
      ],
    };
  }

  // ── Leaderboard (same order as the game: points, then who got there first) ─
  const scores = new Map();
  for (const r of games) {
    if (r.date < campaign.start || r.date > campaign.end) continue;
    const s = scores.get(r.customer_number) || { points: 0, reachedAt: 0 };
    s.points += r.points;
    if (r.points > 0) s.reachedAt = Math.max(s.reachedAt, time(r.created_at));
    scores.set(r.customer_number, s);
  }
  const ranked = [...scores.entries()]
    .filter(([, s]) => s.points > 0)
    .sort((a, b) => b[1].points - a[1].points || a[1].reachedAt - b[1].reachedAt)
    .map(([cn, s], i) => {
      const p = people.get(cn);
      return { rank: i + 1, name: p.name || "", points: s.points, streak: p.streak, daysPlayed: p.days.size, optIn: !!p.opt_in, pointsToday: todayResults.get(cn) ? todayResults.get(cn).points : 0 };
    });

  return {
    generatedAt: new Date(nowMs).toISOString(),
    date,
    campaign,
    doublePoints,
    testAccounts: users.length - real.length,
    today,
    todayGames,
    totals,
    daily,
    weeks,
    projection,
    leaderboard: { top: ranked.slice(0, 10), scoring: ranked.length },
  };
}

module.exports = { buildDailyReport, addDays, firstMonday };
