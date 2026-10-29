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
  th:last-child, td:last-child {
    position: sticky; right: 0; background: var(--surface);
    box-shadow: -10px 0 10px -10px rgba(16,16,14,0.18);
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
      <table>
        <thead><tr>
          <th>Customer no.</th><th>Name</th><th>Signed up</th><th>Last sign-in</th>
          <th>Played / won</th><th>Nov pts</th><th>Balance</th><th>Leaderboard</th><th>Status</th><th></th>
        </tr></thead>
        <tbody id="rows"><tr><td colspan="10" class="empty">Loading…</td></tr></tbody>
      </table>
    </div>
    <div class="note" id="note"></div>
  </div>
</div>

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
    try { sessionStorage.removeItem(KEY); } catch (e) {}
    show('login');
  }

  async function api(path, method, body) {
    var headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = 'Bearer ' + token;
    var res = await fetch(API + path, { method: method || 'GET', headers: headers, body: body ? JSON.stringify(body) : undefined });
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
      await load();
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
      $('rows').innerHTML = '<tr><td colspan="10" class="empty">No players found.</td></tr>';
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
          '<td>' + statusBadge(p.status) + '</td>' +
          '<td><button class="btn ghost small reset-btn" data-cn="' + esc(p.customer_number) + '" data-name="' + esc(p.name || '') + '">Reset password</button></td>' +
        '</tr>';
      }).join('');
    }
    $('note').textContent = rows.length >= 500 ? 'Showing the 500 most recent sign-ups. Search, or download the CSV for everyone.' :
      'November points count ' + data.campaign.start + ' to ' + data.campaign.end + '.';
  }

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

  if (token) { show('dash'); load(); } else { show('login'); }
})();
</script>
</body>
</html>`;
}

module.exports = { getAdminHTML };
