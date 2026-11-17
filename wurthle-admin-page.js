// Würthle admin page — served at /wurthle/admin

const { WURTH_LOGO_SRC } = require("./wurth-logo");
const { FONT_PRELOADS, BASE_CSS } = require("./wurthle-theme");

function getAdminHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="robots" content="noindex, nofollow" />
<title>Würthle admin</title>
${FONT_PRELOADS}
<style>
${BASE_CSS}
  .head { font-family: var(--font-head); font-weight: 800; letter-spacing: 0.01em; }
  .view { display: none; }
  .view.show { display: block; }

  /* Login */
  .login { max-width: 340px; margin: 0 auto; padding: 80px 20px; text-align: center; }
  .login img { width: 190px; margin-bottom: 26px; }
  .login h1 { font-size: 34px; margin-bottom: 6px; }
  .login p { color: var(--muted); font-size: 14.5px; margin-bottom: 22px; }
  .field {
    width: 100%; padding: 13px 16px; border: 1px solid var(--line-2); border-radius: var(--radius-sm);
    font-size: 15px; background: var(--surface); outline: none;
  }
  .field:focus { border-color: var(--wurth-red); box-shadow: 0 0 0 3px rgba(204,0,0,0.1); }
  .btn {
    font-family: var(--font-head); font-weight: 800; letter-spacing: 0.03em; font-size: 15px;
    border: none; border-radius: var(--radius-sm); padding: 12px 18px; cursor: pointer;
    background: var(--wurth-red); color: #fff; transition: background 0.15s var(--ease);
  }
  .btn:hover { background: var(--wurth-red-dk); }
  .btn:disabled { background: var(--line); color: var(--muted); cursor: default; }
  .btn.ghost { background: var(--surface); color: var(--ink); border: 1px solid var(--line-2); }
  .btn.ghost:hover { background: var(--bg-chip); }
  .btn.small { font-size: 13px; padding: 7px 12px; }
  .login .btn { width: 100%; margin-top: 10px; }
  .err { color: var(--wurth-red); font-size: 13.5px; min-height: 18px; margin-top: 10px; }

  /* Dashboard */
  .bar {
    background: var(--surface); box-shadow: var(--shadow-sm);
    display: flex; align-items: center; justify-content: space-between; padding: 12px 24px; gap: 12px;
  }
  .bar-left { display: flex; align-items: center; gap: 14px; }
  .bar img { width: 120px; display: block; }
  .bar .title { font-size: 22px; border-left: 1px solid var(--line-2); padding-left: 14px; }
  .main { max-width: 1240px; margin: 0 auto; padding: 24px; }
  .stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 20px; }
  .stat { background: var(--surface); border-radius: var(--radius); box-shadow: var(--shadow-sm); padding: 16px 18px; }
  .stat .v { font-size: 34px; line-height: 1; }
  .stat .l { font-size: 13px; color: var(--muted); margin-top: 6px; }
  .tools { display: flex; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
  .tools .field { flex: 1; min-width: 220px; }
  .table-wrap { background: var(--surface); border-radius: var(--radius); box-shadow: var(--shadow-sm); overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th {
    font-family: var(--font-head); font-weight: 800; letter-spacing: 0.04em; font-size: 13px; text-transform: uppercase;
    color: var(--muted); text-align: left; padding: 12px 14px; border-bottom: 1px solid var(--line); white-space: nowrap;
  }
  td { padding: 11px 14px; border-bottom: 1px solid var(--line); white-space: nowrap; vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  .players-table th:last-child, .players-table td:last-child {
    position: sticky; right: 0; background: var(--surface);
    box-shadow: -10px 0 10px -10px rgba(16,16,14,0.18);
  }
  .chk { width: 17px; height: 17px; accent-color: var(--wurth-red); cursor: pointer; vertical-align: middle; }

  /* Tabs */
  .tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--line-2); margin-bottom: 22px; }
  .tab {
    font-family: var(--font-head); font-weight: 800; letter-spacing: 0.03em; font-size: 16px; text-transform: uppercase;
    background: none; border: none; border-bottom: 3px solid transparent; margin-bottom: -1px;
    padding: 10px 14px; color: var(--muted); cursor: pointer;
  }
  .tab:hover { color: var(--ink); }
  .tab.active { color: var(--ink); border-bottom-color: var(--wurth-red); }
  .tab-panel[hidden] { display: none; }

  /* Daily report */
  .rep-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 18px; }
  .rep-head h2 { font-size: 32px; line-height: 1; text-transform: uppercase; }
  .rep-head .sub { color: var(--muted); font-size: 13.5px; margin-top: 6px; }
  .rep-actions { display: flex; gap: 8px; }
  .section { margin-bottom: 30px; }
  .section > h3 {
    font-size: 20px; text-transform: uppercase; letter-spacing: 0.02em; margin-bottom: 10px;
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  }
  .pill {
    font-family: var(--font-body); font-weight: 400; text-transform: none; letter-spacing: 0;
    font-size: 12.5px; padding: 3px 10px; border-radius: 100px; background: var(--bg-chip); color: var(--ink-2);
  }
  .pill.red { background: var(--wurth-red); color: #fff; }
  .tiles { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .tiles.six { grid-template-columns: repeat(6, 1fr); }
  .tile { background: var(--surface); border-radius: var(--radius); box-shadow: var(--shadow-sm); padding: 16px 18px; }
  .tile .v { font-size: 34px; line-height: 1; }
  .tile .l { font-size: 13.5px; color: var(--ink-2); margin-top: 6px; }
  .tile .d { font-size: 12.5px; color: var(--muted); margin-top: 4px; line-height: 1.4; }
  .gap-top { margin-top: 12px; }
  .charts { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .card { background: var(--surface); border-radius: var(--radius); box-shadow: var(--shadow-sm); padding: 16px 18px; min-width: 0; }
  .chart-title { font-size: 15px; text-transform: uppercase; letter-spacing: 0.02em; }
  .chart-sub { font-size: 12.5px; color: var(--muted); margin: 2px 0 8px; }
  .chart svg { display: block; }
  .b-won { background: #E6F4EC; color: var(--success); }
  .b-lost { background: #FDE8E8; color: var(--wurth-red); }
  .b-playing { background: var(--bg-chip); color: var(--ink-2); }
  .new-tag {
    font-family: var(--font-head); font-weight: 800; font-size: 11px; letter-spacing: 0.05em; text-transform: uppercase;
    color: var(--wurth-red); margin-left: 8px;
  }
  .foot { font-size: 12.5px; color: var(--muted); line-height: 1.55; margin-top: 10px; }
  .tip {
    position: fixed; pointer-events: none; z-index: 40; background: var(--ink); color: #fff; font-size: 12.5px;
    padding: 6px 10px; border-radius: 6px; white-space: nowrap; opacity: 0; transition: opacity 0.1s;
  }
  .tip.show { opacity: 1; }
  @media (max-width: 1000px) { .tiles.six { grid-template-columns: repeat(3, 1fr); } }
  @media (max-width: 760px) {
    .tiles, .tiles.six { grid-template-columns: repeat(2, 1fr); }
    .charts { grid-template-columns: 1fr; }
    .rep-head h2 { font-size: 26px; }
    .tile .v { font-size: 28px; }
  }
  @media print {
    body { background: #fff; }
    .bar .btn, .tabs, .rep-actions, #tab-players, .toast, .tip { display: none !important; }
    .main { padding: 0; max-width: none; }
    .tile, .card, .table-wrap { box-shadow: none; border: 1px solid var(--line-2); }
    .section { break-inside: avoid; }
    .chart svg { max-width: 100%; height: auto; }
  }
  td.num { font-variant-numeric: tabular-nums; }
  .muted { color: var(--muted-2); }
  .badge { display: inline-block; font-size: 12px; padding: 3px 9px; border-radius: 100px; }
  .b-active { background: #E6F4EC; color: var(--success); }
  .b-temp { background: #FFF4DD; color: #8A5A00; }
  .b-locked { background: #FDE8E8; color: var(--wurth-red); }
  .b-none { background: var(--bg-chip); color: var(--muted); }
  .empty { padding: 40px; text-align: center; color: var(--muted); }
  .note { font-size: 13px; color: var(--muted); margin-top: 12px; }

  /* Dialogs */
  .dim { position: fixed; inset: 0; background: rgba(16,16,14,0.45); display: none; z-index: 50; }
  .dim.show { display: block; }
  .dialog {
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 60;
    width: 92%; max-width: 420px; background: var(--surface); border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg); padding: 24px; display: none;
  }
  .dialog.show { display: block; }
  .dialog h2 { font-size: 24px; margin-bottom: 8px; }
  .dialog p { font-size: 14.5px; color: var(--ink-2); line-height: 1.5; }
  .dialog .actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }
  .temp {
    margin-top: 14px; display: flex; align-items: center; gap: 10px;
    background: var(--bg-chip); border-radius: var(--radius-sm); padding: 12px 14px;
  }
  .temp code { flex: 1; font-family: Consolas, 'Courier New', monospace; font-size: 20px; letter-spacing: 0.04em; }
  .toast {
    position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%); background: var(--ink); color: #fff;
    padding: 10px 18px; border-radius: 100px; font-size: 14px; opacity: 0; transition: opacity 0.2s; z-index: 70;
    pointer-events: none;
  }
  .toast.show { opacity: 1; }
  @media (max-width: 760px) { .stats { grid-template-columns: repeat(2, 1fr); } .bar .title { display: none; } .main { padding: 16px; } }
</style>
</head>
<body>

<div id="view-login" class="view">
  <form class="login" id="login-form" novalidate>
    <img src="${WURTH_LOGO_SRC}" alt="Würth" />
    <h1 class="head">Würthle admin</h1>
    <p>Staff only. Enter the admin password.</p>
    <input class="field" type="password" id="admin-password" placeholder="Admin password" autocomplete="current-password" />
    <button class="btn" type="submit" id="login-btn">Sign in</button>
    <div class="err" id="login-err"></div>
  </form>
</div>

<div id="view-dash" class="view">
  <div class="bar">
    <div class="bar-left">
      <img src="${WURTH_LOGO_SRC}" alt="Würth" />
      <div class="title head">Würthle admin</div>
    </div>
    <button class="btn ghost small" id="signout">Sign out</button>
  </div>
  <div class="main">
    <div class="tabs" role="tablist">
      <button class="tab active" role="tab" aria-selected="true" data-tab="report">Daily report</button>
      <button class="tab" role="tab" aria-selected="false" data-tab="players">Players</button>
    </div>

    <section class="tab-panel" id="tab-report">
      <div class="rep-head">
        <div><h2 class="head">Daily report</h2><div class="sub" id="r-asat">Loading…</div></div>
        <div class="rep-actions">
          <button class="btn ghost small" id="r-refresh">Refresh</button>
          <button class="btn ghost small" id="r-print">Print / save as PDF</button>
        </div>
      </div>
      <div id="r-body"><div class="empty">Loading…</div></div>
    </section>

    <section class="tab-panel" id="tab-players" hidden>
    <div class="stats">
      <div class="stat"><div class="v head" id="s-total">–</div><div class="l">Total sign-ups</div></div>
      <div class="stat"><div class="v head" id="s-today">–</div><div class="l">Signed up today</div></div>
      <div class="stat"><div class="v head" id="s-week">–</div><div class="l">Last 7 days</div></div>
      <div class="stat"><div class="v head" id="s-played">–</div><div class="l">Played today</div></div>
      <div class="stat"><div class="v head" id="s-optin">–</div><div class="l">Leaderboard opt-ins</div></div>
    </div>
    <div class="tools">
      <input class="field" type="search" id="search" placeholder="Search by customer number or name" autocomplete="off" />
      <button class="btn ghost" id="csv">Download CSV</button>
    </div>
    <div class="table-wrap">
      <table class="players-table">
        <thead><tr>
          <th>Customer no.</th><th>Name</th><th>Signed up</th><th>Last sign-in</th>
          <th>Played / won</th><th>Nov pts</th><th>Balance</th><th>Leaderboard</th>
          <th title="Test accounts are left out of the daily report">Test</th><th>Status</th><th></th>
        </tr></thead>
        <tbody id="rows"><tr><td colspan="11" class="empty">Loading…</td></tr></tbody>
      </table>
    </div>
    <div class="note" id="note"></div>
    </section>
  </div>
</div>

<div class="tip" id="tip"></div>

<div class="dim" id="dim"></div>

<div class="dialog" id="confirm-dialog" role="dialog" aria-modal="true">
  <h2 class="head">Reset password?</h2>
  <p id="confirm-text"></p>
  <div class="actions">
    <button class="btn ghost" id="confirm-cancel">Cancel</button>
    <button class="btn" id="confirm-ok">Reset password</button>
  </div>
</div>

<div class="dialog" id="result-dialog" role="dialog" aria-modal="true">
  <h2 class="head">Temporary password</h2>
  <p id="result-text"></p>
  <div class="temp"><code id="temp-pw"></code><button class="btn small" id="copy">Copy</button></div>
  <p style="margin-top: 12px; font-size: 13px; color: var(--muted);">This is only shown once. When they sign in with it, they'll be asked to choose their own password.</p>
  <div class="actions"><button class="btn ghost" id="result-close">Done</button></div>
</div>

<div class="toast" id="toast"></div>

<script>
(function() {
  var API = window.location.origin + '/api/wurthle/admin';
  var KEY = 'wurthle_admin_session';
  var token = null;
  try { token = sessionStorage.getItem(KEY); } catch (e) {}
  var pendingReset = null;
  var searchTimer = null;

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmtDateTime(v) {
    if (!v) return '<span class="muted">—</span>';
    var d = new Date(v);
    var opts = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
    if (d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric';
    return '<span title="' + esc(d.toLocaleString('en-GB')) + '">' + d.toLocaleString('en-GB', opts) + '</span>';
  }
  function toast(msg) {
    var t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(t._timer); t._timer = setTimeout(function() { t.classList.remove('show'); }, 2000);
  }
  function show(view) {
    $('view-login').classList.toggle('show', view === 'login');
    $('view-dash').classList.toggle('show', view === 'dash');
  }
  function signOut() {
    token = null;
    report = null;
    $('r-body').innerHTML = '';
    try { sessionStorage.removeItem(KEY); } catch (e) {}
    show('login');
  }

  async function api(path, method, body, timeoutMs) {
    var headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = 'Bearer ' + token;
    var ctrl = timeoutMs && window.AbortController ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function() { ctrl.abort(); }, timeoutMs) : null;
    var res;
    try {
      res = await fetch(API + path, { method: method || 'GET', headers: headers, body: body ? JSON.stringify(body) : undefined, signal: ctrl ? ctrl.signal : undefined });
    } catch (err) {
      throw new Error(err && err.name === 'AbortError' ? 'This is taking too long. Press Refresh to try again.' : 'Could not reach the server. Check your connection and press Refresh.');
    } finally {
      clearTimeout(timer);
    }
    if (res.status === 401 && path !== '/login') { signOut(); throw new Error('Please sign in again.'); }
    var data = await res.json().catch(function() { return {}; });
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  $('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    var btn = $('login-btn'), err = $('login-err');
    err.textContent = '';
    var pw = $('admin-password').value;
    if (!pw) { err.textContent = 'Enter the admin password.'; return; }
    btn.disabled = true; btn.textContent = 'Signing in…';
    try {
      var data = await api('/login', 'POST', { password: pw });
      token = data.token;
      try { sessionStorage.setItem(KEY, token); } catch (e2) {}
      $('admin-password').value = '';
      show('dash');
      showTab('report');
    } catch (e3) {
      err.textContent = e3.message;
    } finally {
      btn.disabled = false; btn.textContent = 'Sign in';
    }
  });
  $('signout').addEventListener('click', signOut);

  function statusBadge(s) {
    var cls = { 'Active': 'b-active', 'Temporary password': 'b-temp', 'Locked': 'b-locked', 'No password': 'b-none' }[s] || 'b-none';
    return '<span class="badge ' + cls + '">' + esc(s) + '</span>';
  }

  function render(data) {
    var s = data.summary;
    $('s-total').textContent = s.total; $('s-today').textContent = s.today; $('s-week').textContent = s.week;
    $('s-played').textContent = s.played_today; $('s-optin').textContent = s.opted_in;
    var rows = data.players;
    if (!rows.length) {
      $('rows').innerHTML = '<tr><td colspan="11" class="empty">No players found.</td></tr>';
    } else {
      $('rows').innerHTML = rows.map(function(p) {
        return '<tr>' +
          '<td class="num">' + esc(p.customer_number) + '</td>' +
          '<td>' + (p.name ? esc(p.name) : '<span class="muted">—</span>') + '</td>' +
          '<td>' + fmtDateTime(p.created_at) + '</td>' +
          '<td>' + fmtDateTime(p.last_login_at) + '</td>' +
          '<td class="num">' + p.played + ' / ' + p.wins + '</td>' +
          '<td class="num">' + p.campaign_points + '</td>' +
          '<td class="num">' + p.balance + '</td>' +
          '<td>' + (p.leaderboard_opt_in ? 'Opted in' + (p.leaderboard_opt_in_at ? ' <span class="muted">· ' + fmtDateTime(p.leaderboard_opt_in_at) + '</span>' : '') : '<span class="muted">No</span>') + '</td>' +
          '<td><input type="checkbox" class="chk test-toggle" data-cn="' + esc(p.customer_number) + '" aria-label="Test account"' + (p.is_test ? ' checked' : '') + ' /></td>' +
          '<td>' + statusBadge(p.status) + '</td>' +
          '<td><button class="btn ghost small reset-btn" data-cn="' + esc(p.customer_number) + '" data-name="' + esc(p.name || '') + '">Reset password</button></td>' +
        '</tr>';
      }).join('');
    }
    $('note').textContent = (rows.length >= 500 ? 'Showing the 500 most recent sign-ups. Search, or download the CSV for everyone.' :
      'November points count ' + data.campaign.start + ' to ' + data.campaign.end + '.') +
      ' Tick Test for staff or test accounts: they are left out of the counts above and the daily report.';
  }

  $('rows').addEventListener('change', async function(e) {
    var box = e.target.closest('.test-toggle');
    if (!box) return;
    box.disabled = true;
    try {
      await api('/players/' + encodeURIComponent(box.dataset.cn) + '/test', 'POST', { isTest: box.checked });
      toast(box.checked ? 'Marked as a test account' : 'No longer a test account');
      reportStale = true;
      load();
    } catch (err) {
      box.checked = !box.checked;
      toast(err.message);
    } finally {
      box.disabled = false;
    }
  });

  async function load() {
    try { render(await api('/players?q=' + encodeURIComponent($('search').value.trim()))); }
    catch (e) { if (token) toast(e.message); }
  }

  $('search').addEventListener('input', function() {
    clearTimeout(searchTimer); searchTimer = setTimeout(load, 300);
  });

  $('csv').addEventListener('click', async function() {
    try {
      var res = await fetch(API + '/players.csv', { headers: { Authorization: 'Bearer ' + token } });
      if (res.status === 401) { signOut(); return; }
      if (!res.ok) throw new Error('Download failed');
      var blob = await res.blob();
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'wurthle-players-' + new Date().toISOString().slice(0, 10) + '.csv';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function() { URL.revokeObjectURL(a.href); }, 1000);
    } catch (e) { toast(e.message); }
  });

  // ─── Daily report ─────────────────────────────────────────────────
  // Live from the database: GET /daily. Reloads every 5 minutes while
  // the tab is open and visible, and when you come back to the page.
  var currentTab = 'report';
  var report = null, reportLoadedAt = 0, reportStale = false, reportLoading = false, resizeTimer = null;
  var REFRESH_MS = 5 * 60 * 1000;
  var C = { red: '#CC0000', today: '#9A9994', grid: '#ECEAE4', ink: '#121212', muted: '#6B6B67', weekend: '#F7F6F2' };

  function showTab(name) {
    currentTab = name;
    document.querySelectorAll('.tab').forEach(function(t) {
      var on = t.dataset.tab === name;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    $('tab-report').hidden = name !== 'report';
    $('tab-players').hidden = name !== 'players';
    if (name === 'report') {
      if (!report || reportStale || Date.now() - reportLoadedAt > 60000) loadReport(); else drawCharts();
    } else {
      load();
    }
  }
  document.querySelectorAll('.tab').forEach(function(t) {
    t.addEventListener('click', function() { showTab(t.dataset.tab); });
  });

  function day(d, opts) { return new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', Object.assign({ timeZone: 'UTC' }, opts)); }
  function clock(v) { return new Date(v).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' }); }
  function pct(a, b) { return b ? Math.round(a / b * 100) : 0; }
  function approx(n) { return n < 30 ? Math.round(n) : Math.round(n / 5) * 5; }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }
  function dash() { return '<span class="muted">—</span>'; }
  function tile(v, label, detail) {
    return '<div class="tile"><div class="v head">' + v + '</div><div class="l">' + label + '</div>' +
      (detail ? '<div class="d">' + detail + '</div>' : '') + '</div>';
  }
  function niceStep(max) {
    var steps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 500];
    for (var i = 0; i < steps.length; i++) if (max / steps[i] <= 5) return steps[i];
    return 1000;
  }

  // One series per chart. Bars rise from the baseline with 4px rounded tops;
  // only the busiest day and today carry a number, hover shows the rest.
  function columnChart(el, series, field, tipFn) {
    if (!el) return;
    var width = Math.max(260, el.clientWidth || 300), height = 190;
    var padL = 26, padR = 4, padT = 20, padB = 34;
    var w = width - padL - padR, h = height - padT - padB, base = padT + h;
    var vals = series.map(function(s) { return s[field]; });
    var max = Math.max.apply(null, vals.concat([1]));
    var step = niceStep(max), top = Math.ceil(max / step) * step;
    var n = series.length, slot = w / n;
    var bw = Math.max(2, Math.min(26, slot - Math.max(2, slot * 0.3)));
    var every = Math.ceil(28 / slot), wide = slot >= 24;
    var peak = -1;
    vals.forEach(function(v, i) { if (v > 0 && (peak < 0 || v >= vals[peak])) peak = i; });
    var svg = '<svg width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '" xmlns="http://www.w3.org/2000/svg" font-family="Wuerth Book, Arial, sans-serif" font-size="10.5" role="img">';
    series.forEach(function(s, i) {
      var dw = new Date(s.date + 'T00:00:00Z').getUTCDay();
      if (dw === 0 || dw === 6) svg += '<rect x="' + (padL + i * slot) + '" y="' + padT + '" width="' + slot + '" height="' + h + '" fill="' + C.weekend + '"/>';
    });
    for (var v = 0; v <= top; v += step) {
      var gy = base - v / top * h;
      svg += '<line x1="' + padL + '" x2="' + (width - padR) + '" y1="' + gy + '" y2="' + gy + '" stroke="' + C.grid + '"/>' +
        '<text x="' + (padL - 6) + '" y="' + (gy + 3.5) + '" text-anchor="end" fill="' + C.muted + '">' + v + '</text>';
    }
    series.forEach(function(s, i) {
      var val = s[field], last = i === n - 1;
      var x = padL + i * slot + (slot - bw) / 2, cx = x + bw / 2, bh = val / top * h, y = base - bh;
      if (val > 0) {
        var r = Math.min(4, bh, bw / 2);
        svg += '<path d="M' + x + ',' + base + ' V' + (y + r) + ' Q' + x + ',' + y + ' ' + (x + r) + ',' + y +
          ' H' + (x + bw - r) + ' Q' + (x + bw) + ',' + y + ' ' + (x + bw) + ',' + (y + r) + ' V' + base + ' Z" fill="' + (last ? C.today : C.red) + '"/>';
      }
      if (last || i === peak) {
        svg += '<text x="' + cx + '" y="' + (y - 5) + '" text-anchor="middle" fill="' + C.ink + '" font-family="Wuerth Extra Bold Cond, Arial Narrow, Arial, sans-serif" font-weight="800" font-size="12.5">' + val + '</text>';
      }
      if ((n - 1 - i) % every === 0) {
        svg += '<text x="' + cx + '" y="' + (base + 14) + '" text-anchor="middle" fill="' + C.ink + '">' + (last ? 'Today' : Number(s.date.slice(8))) + '</text>';
        if (wide && !last) svg += '<text x="' + cx + '" y="' + (base + 27) + '" text-anchor="middle" fill="' + C.muted + '" font-size="9.5">' + day(s.date, { weekday: 'short' }).slice(0, 2) + '</text>';
      }
      svg += '<rect x="' + (padL + i * slot) + '" y="' + padT + '" width="' + slot + '" height="' + (h + padB) + '" fill="transparent" data-tip="' + esc(tipFn(s)) + '"/>';
    });
    el.innerHTML = svg + '</svg>';
  }

  function drawCharts() {
    if (!report || !report.daily.length || currentTab !== 'report') return;
    var label = function(s) { return day(s.date, { weekday: 'short', day: 'numeric', month: 'short' }) + ': '; };
    columnChart($('c-players'), report.daily, 'players', function(s) {
      return label(s) + plural(s.players, 'player') + ' · ' + s.wins + ' of ' + plural(s.games, 'game') + ' won';
    });
    columnChart($('c-signups'), report.daily, 'signups', function(s) { return label(s) + plural(s.signups, 'sign-up'); });
  }
  window.addEventListener('resize', function() { clearTimeout(resizeTimer); resizeTimer = setTimeout(drawCharts, 150); });

  var tip = $('tip');
  document.addEventListener('mouseover', function(e) {
    var t = e.target.closest ? e.target.closest('[data-tip]') : null;
    if (!t) { tip.classList.remove('show'); return; }
    tip.textContent = t.getAttribute('data-tip');
    tip.classList.add('show');
  });
  document.addEventListener('mousemove', function(e) {
    if (!tip.classList.contains('show')) return;
    var x = e.clientX + 14, w = tip.offsetWidth;
    if (x + w > window.innerWidth - 8) x = e.clientX - w - 14;
    tip.style.left = Math.max(8, x) + 'px';
    tip.style.top = Math.max(8, e.clientY - 40) + 'px';
  });
  document.addEventListener('scroll', function() { tip.classList.remove('show'); }, true);

  function renderReport(r) {
    report = r; reportLoadedAt = Date.now(); reportStale = false;
    var t = r.today, T = r.totals, dp = r.doublePoints || {}, lb = r.leaderboard, P = r.projection;
    var shortDay = { day: 'numeric', month: 'short' };
    $('r-asat').textContent = day(r.date, { weekday: 'long', day: 'numeric', month: 'long' }) +
      ' · updated ' + clock(r.generatedAt) + ' · refreshes every 5 minutes while open';
    var h = '';

    // Today
    var dpPill = dp.today ? '<span class="pill red">Double points day</span>' :
      dp.next ? '<span class="pill">Next double points day: ' + esc(day(dp.next, { weekday: 'short', day: 'numeric', month: 'short' })) + '</span>' : '';
    var split = [t.won + ' won', t.lost + ' lost'].concat(t.playing ? [t.playing + ' still playing'] : []).join(' · ');
    h += '<div class="section"><h3 class="head">Today' + dpPill + '</h3><div class="tiles">' +
      tile(t.players, 'Played today', split + '<br>Yesterday: ' + t.yesterday.players + ' all day, ' + t.yesterday.byThisTime + ' by this time') +
      tile(t.signups, 'New sign-ups', 'Total now ' + T.customers) +
      tile(t.firstGames, 'First game today', 'New players trying it') +
      tile(t.optIns, 'Leaderboard opt-ins today', T.optedIn + ' opted in so far') +
      '</div>';
    if (r.todayGames.length) {
      h += '<div class="table-wrap gap-top"><table><thead><tr><th>Time</th><th>Player</th><th>Result</th><th>Points</th><th>Streak</th></tr></thead><tbody>' +
        r.todayGames.map(function(g) {
          var res = g.status === 'won' ? '<span class="badge b-won">Won in ' + g.guesses + '</span>' :
            g.status === 'lost' ? '<span class="badge b-lost">Lost</span>' :
            '<span class="badge b-playing">Playing · ' + plural(g.guesses, 'guess', 'guesses') + ' so far</span>';
          return '<tr><td class="num">' + clock(g.at) + '</td>' +
            '<td>' + (g.name ? esc(g.name) : dash()) + (g.firstGame ? '<span class="new-tag">First game</span>' : '') + '</td>' +
            '<td>' + res + '</td>' +
            '<td class="num">' + (g.points ? '+' + g.points : dash()) + '</td>' +
            '<td class="num">' + (g.streak ? plural(g.streak, 'day') : dash()) + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    } else {
      h += '<div class="card gap-top empty">No one has played yet today.</div>';
    }
    h += '</div>';

    // Campaign so far
    h += '<div class="section"><h3 class="head">Campaign so far</h3><div class="tiles six">' +
      tile(T.customers, 'Customers signed up', t.signups ? '+' + t.signups + ' today' : 'None new today') +
      tile(T.played, 'Have played', pct(T.played, T.customers) + '% of sign-ups') +
      tile(pct(T.cameBack, T.couldReturn) + '%', 'Came back', T.cameBack + ' of ' + T.couldReturn + ' who started 3+ days ago played again') +
      tile(T.regulars, 'Regulars', 'Played on 3 or more days') +
      tile(T.optedIn, 'Leaderboard opt-ins', pct(T.optedIn, T.customers) + '% of sign-ups') +
      tile(T.avgGuesses == null ? '–' : T.avgGuesses.toFixed(1), 'Guesses to win', 'Average · ' + pct(T.wins, T.games) + '% of ' + plural(T.games, 'game') + ' won') +
      '</div></div>';

    // Day by day
    if (r.daily.length) {
      h += '<div class="section"><h3 class="head">Day by day</h3><div class="charts">' +
        '<div class="card"><div class="chart-title head">Customers playing</div>' +
        '<div class="chart-sub">Each day from ' + day(r.daily[0].date, shortDay) + '. Weekends shaded, today so far in grey.</div><div class="chart" id="c-players"></div></div>' +
        '<div class="card"><div class="chart-title head">New sign-ups</div>' +
        '<div class="chart-sub">Same days. Hover over a day for its numbers.</div><div class="chart" id="c-signups"></div></div>' +
        '</div></div>';
    }

    // Week by week
    if (r.weeks.length) {
      h += '<div class="section"><h3 class="head">Week by week</h3><div class="table-wrap"><table><thead><tr>' +
        '<th>Week</th><th>Dates</th><th>Sign-ups</th><th>Players</th><th>New</th><th>Returning</th><th>Days each</th><th>Games</th><th>Won</th>' +
        '</tr></thead><tbody>' +
        r.weeks.map(function(w) {
          return '<tr><td>Week ' + w.n + '</td>' +
            '<td>' + day(w.start, shortDay) + ' – ' + (w.partial ? 'so far' : day(w.end, shortDay)) + '</td>' +
            '<td class="num">' + w.signups + '</td><td class="num">' + w.players + '</td>' +
            '<td class="num">' + w.newPlayers + '</td><td class="num">' + (w.players - w.newPlayers) + '</td>' +
            '<td class="num">' + (w.players ? (w.playerDays / w.players).toFixed(1) : '–') + '</td>' +
            '<td class="num">' + w.games + '</td><td class="num">' + (w.games ? pct(w.wins, w.games) + '%' : '–') + '</td></tr>';
        }).join('') + '</tbody></table></div>' +
        '<div class="foot">Weeks run Monday to Sunday. New means their first ever game was that week; returning means they also played in an earlier week. Days each is the average number of days each player played that week.</div></div>';
    }

    // Leaderboard
    h += '<div class="section"><h3 class="head">Leaderboard<span class="pill">Top 10 of ' + plural(lb.scoring, 'player') + ' with points</span></h3>';
    if (lb.top.length) {
      h += '<div class="table-wrap"><table><thead><tr><th>#</th><th>Player</th><th>November points</th><th>Today</th><th>Streak</th><th>Days played</th><th>On the public board</th></tr></thead><tbody>' +
        lb.top.map(function(p) {
          return '<tr><td class="num">' + p.rank + '</td><td>' + (p.name ? esc(p.name) : dash()) + '</td>' +
            '<td class="num">' + p.points + '</td>' +
            '<td class="num">' + (p.pointsToday ? '+' + p.pointsToday : dash()) + '</td>' +
            '<td class="num">' + (p.streak ? plural(p.streak, 'day') : dash()) + '</td>' +
            '<td class="num">' + p.daysPlayed + '</td>' +
            '<td>' + (p.optIn ? 'Name shown' : '<span class="muted">Anonymous player</span>') + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    } else {
      h += '<div class="card empty">No points scored yet.</div>';
    }
    h += '<div class="foot">Ties go to whoever reached the total first. The top 50 who spend £500+ go into the TV draw.</div></div>';

    // Six-month outlook
    if (P) {
      h += '<div class="section"><h3 class="head">Six-month outlook<span class="pill">Sign-ups by ' + day(P.endDate, { day: 'numeric', month: 'short', year: 'numeric' }) + '</span></h3>' +
        '<div class="table-wrap"><table><thead><tr><th>Scenario</th><th>What it assumes</th><th>Sign-ups</th><th>Played</th><th>Regulars</th></tr></thead><tbody>' +
        P.scenarios.map(function(s) {
          return '<tr><td><span class="head">' + esc(s.name) + '</span> <span class="muted">' + esc(s.tag) + '</span></td>' +
            '<td style="white-space: normal; min-width: 280px;">' + esc(s.what) + '</td>' +
            '<td class="num">' + approx(s.signups) + '</td><td class="num">' + approx(s.played) + '</td><td class="num">' + approx(s.regulars) + '</td></tr>';
        }).join('') + '</tbody></table></div>' +
        '<div class="foot">A rough guide, not a forecast. It is worked out from weeks ' + P.basedOn.prev + ' and ' + P.basedOn.last +
        ' (the last two full weeks), so it moves on each Monday. Played and regulars assume today’s rates: ' +
        pct(T.played, T.customers) + '% and ' + pct(T.regulars, T.customers) + '% of sign-ups. Numbers rounded.</div></div>';
    }

    h += '<div class="foot">' + (r.testAccounts ? plural(r.testAccounts, 'test account') + ' left out of every number here. ' :
      'No accounts are marked as test accounts yet, so any staff test accounts are counted. ') +
      'Mark them with the Test box on the Players tab.</div>';
    $('r-body').innerHTML = h;
    drawCharts();
  }

  async function loadReport() {
    if (reportLoading || !token) return;
    reportLoading = true;
    $('r-refresh').disabled = true;
    try {
      var data = await api('/daily', 'GET', null, 20000);
      try {
        renderReport(data);
      } catch (renderErr) {
        report = null;
        throw new Error('The report could not be shown (' + renderErr.message + '). Press Refresh to try again.');
      }
    } catch (e) {
      if (token) {
        toast(e.message);
        if (!report) {
          $('r-asat').textContent = 'Not loaded';
          $('r-body').innerHTML = '<div class="card empty">' + esc(e.message) + '</div>';
        }
      }
    } finally {
      reportLoading = false;
      $('r-refresh').disabled = false;
    }
  }
  $('r-refresh').addEventListener('click', loadReport);
  $('r-print').addEventListener('click', function() { window.print(); });
  setInterval(function() {
    if (token && currentTab === 'report' && document.visibilityState === 'visible') loadReport();
  }, REFRESH_MS);
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible' && token && currentTab === 'report' && Date.now() - reportLoadedAt > REFRESH_MS) loadReport();
  });

  function openDialog(id) { $('dim').classList.add('show'); $(id).classList.add('show'); }
  function closeDialogs() {
    $('dim').classList.remove('show');
    $('confirm-dialog').classList.remove('show');
    $('result-dialog').classList.remove('show');
    $('temp-pw').textContent = '';
    pendingReset = null;
  }

  $('rows').addEventListener('click', function(e) {
    var btn = e.target.closest('.reset-btn');
    if (!btn) return;
    pendingReset = btn.dataset.cn;
    var who = btn.dataset.name ? btn.dataset.name + ' (customer ' + btn.dataset.cn + ')' : 'customer ' + btn.dataset.cn;
    $('confirm-text').textContent = 'This gives ' + who + ' a new temporary password and unlocks the account. Their current password will stop working.';
    openDialog('confirm-dialog');
  });
  $('confirm-cancel').addEventListener('click', closeDialogs);
  $('result-close').addEventListener('click', closeDialogs);
  $('dim').addEventListener('click', closeDialogs);

  $('confirm-ok').addEventListener('click', async function() {
    var cn = pendingReset, btn = this;
    if (!cn) return;
    btn.disabled = true;
    try {
      var data = await api('/players/' + encodeURIComponent(cn) + '/reset-password', 'POST');
      $('confirm-dialog').classList.remove('show');
      $('result-text').textContent = 'Give this to ' + (data.name || 'the customer') + ' (customer ' + data.customerNumber + '):';
      $('temp-pw').textContent = data.temporaryPassword;
      openDialog('result-dialog');
      load();
    } catch (e) {
      closeDialogs(); toast(e.message);
    } finally {
      btn.disabled = false;
    }
  });

  $('copy').addEventListener('click', async function() {
    try { await navigator.clipboard.writeText($('temp-pw').textContent); toast('Copied'); }
    catch (e) { toast('Select the password and copy it manually'); }
  });

  document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeDialogs(); });

  if (token) { show('dash'); showTab('report'); } else { show('login'); }
})();
</script>
</body>
</html>`;
}

module.exports = { getAdminHTML };
