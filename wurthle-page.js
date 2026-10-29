// Würthle game page — served at /wurthle
// All state lives on the server; this client just renders.

const { WURTH_LOGO_SRC } = require("./wurth-logo");
const { FONT_PRELOADS, BASE_CSS } = require("./wurthle-theme");

function getWurthleHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Würthle — Daily word game</title>
${FONT_PRELOADS}
<style>
${BASE_CSS}

  .wurthle-wrap {
    max-width: 560px;
    margin: 0 auto;
    padding: 20px 18px 60px;
    min-height: 100vh;
  }

  /* ─── Header card ────────────────────────────────────────── */
  .account-bar {
    display: flex; justify-content: space-between; align-items: center;
    padding: 14px 16px;
    background: var(--surface);
    border-radius: var(--radius);
    box-shadow: var(--shadow-sm);
    margin-bottom: 18px;
  }
  .account-left { display: flex; align-items: center; gap: 12px; }
  .avatar {
    width: 40px; height: 40px; border-radius: 50%;
    background: linear-gradient(135deg, #CC0000, #A30000);
    color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-weight: 600; font-size: 14px;
    letter-spacing: 0.02em;
    box-shadow: 0 2px 6px rgba(204, 0, 0, 0.25);
  }
  .account-name { font-size: 14px; font-weight: 500; line-height: 1.2; }
  .account-sub { font-size: 11.5px; color: var(--muted); margin-top: 2px; }
  .logout-link {
    background: none; border: none; color: var(--muted); cursor: pointer;
    font-size: 11px; padding: 2px 0; margin-top: 2px;
    text-decoration: none; border-bottom: 1px dotted var(--muted);
  }
  .logout-link:hover { color: var(--ink); border-bottom-color: var(--ink); }

  .balance-pill {
    display: flex; align-items: baseline; gap: 6px;
    padding: 8px 14px;
    background: var(--bg-chip);
    border-radius: 100px;
  }
  .balance-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 500; }
  .balance-val { font-size: 17px; font-weight: 600; color: var(--wurth-red); letter-spacing: -0.01em; }

  /* ─── Tabs ────────────────────────────────────────────────── */
  .tabs {
    display: flex;
    background: var(--surface);
    border-radius: 100px;
    padding: 4px;
    margin-bottom: 18px;
    box-shadow: var(--shadow-sm);
  }
  .tab-btn {
    flex: 1; padding: 10px 6px;
    background: transparent; border: none;
    font-size: 12.5px; font-weight: 500; color: var(--muted);
    cursor: pointer; border-radius: 100px;
    transition: all 0.2s var(--ease);
    letter-spacing: 0;
    white-space: nowrap;
  }
  .tab-btn.active {
    color: #fff;
    background: var(--ink);
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  }
  .tab-btn:not(.active):hover { color: var(--ink); }
  .tab-panel { display: none; }
  .tab-panel.active { display: block; animation: fadeIn 0.3s var(--ease); }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

  /* ─── Toast ──────────────────────────────────────────────── */
  .wurthle-toast {
    position: fixed; left: 50%; top: 24px; transform: translateX(-50%) translateY(-8px);
    background: var(--ink);
    color: #fff;
    padding: 12px 20px;
    border-radius: 100px;
    font-size: 13px; font-weight: 500;
    opacity: 0; pointer-events: none;
    transition: opacity 0.2s var(--ease), transform 0.3s var(--ease);
    z-index: 100;
    box-shadow: var(--shadow-lg);
    letter-spacing: 0;
  }
  .wurthle-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

  /* ─── Game header ────────────────────────────────────────── */
  .game-header {
    display: flex; justify-content: space-between; align-items: flex-start;
    padding: 0 4px 16px;
    border-bottom: 1px solid var(--line);
    margin-bottom: 16px;
  }
  .icon-btn {
    width: 36px; height: 36px; border-radius: 50%;
    border: 1px solid var(--line);
    background: var(--surface);
    color: var(--ink);
    cursor: pointer; font-size: 14px;
    display: flex; align-items: center; justify-content: center;
    font-weight: 500;
    transition: all 0.15s var(--ease);
  }
  .icon-btn:hover {
    background: var(--ink);
    color: #fff;
    border-color: var(--ink);
  }
  .brand-block { text-align: center; flex: 1; }
  .brand-title {
    font-size: 28px; font-weight: 700;
    line-height: 1; letter-spacing: -0.02em;
    font-feature-settings: 'ss01';
  }
  .brand-sub {
    font-size: 11.5px; color: var(--muted);
    margin-top: 6px; letter-spacing: 0.01em;
  }

  /* ─── Stat chips ─────────────────────────────────────────── */
  .stat-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 0 4px 16px;
  }
  .stat-chips { display: flex; gap: 10px; }
  .stat-chip {
    padding: 7px 12px;
    border-radius: var(--radius-sm);
    text-align: center;
    min-width: 56px;
  }
  .stat-chip.light { background: var(--bg-chip); color: var(--ink); }
  .stat-chip.dark { background: var(--ink); color: #fff; }
  .stat-chip-label {
    font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 500;
    opacity: 0.7;
  }
  .stat-chip-val {
    font-size: 16px; font-weight: 600; margin-top: 1px;
    letter-spacing: -0.01em;
  }
  .puzzle-no { font-size: 11px; color: var(--muted-2); letter-spacing: 0.02em; }

  /* ─── Board ──────────────────────────────────────────────── */
  .wurthle-board {
    display: grid; grid-template-rows: repeat(5, 1fr); gap: 6px;
    margin: 0 auto 20px; justify-content: center;
  }
  .wurthle-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
  .wurthle-tile {
    width: 60px; height: 60px;
    border: 2px solid var(--line-2);
    border-radius: var(--radius-sm);
    display: flex; align-items: center; justify-content: center;
    font-size: 30px; font-weight: 700; text-transform: uppercase;
    background: transparent; color: var(--ink);
    transition: transform 0.1s var(--ease);
    letter-spacing: 0;
  }
  .wurthle-tile.filled {
    border-color: var(--ink-2);
    animation: tilePop 0.12s var(--ease);
  }
  .wurthle-tile.flipping { animation: flip 0.6s var(--ease) forwards; }
  .wurthle-row.shake { animation: shake 0.5s; }
  .wurthle-row.bounce .wurthle-tile { animation: bounce 1s var(--ease) forwards; }
  @keyframes tilePop { 0% { transform: scale(0.9); } 60% { transform: scale(1.06); } 100% { transform: scale(1); } }
  @keyframes flip {
    0%   { transform: rotateX(0); }
    45%  { transform: rotateX(-90deg); background: transparent; color: var(--ink); border-color: var(--ink-2); }
    55%  { transform: rotateX(-90deg); }
    100% { transform: rotateX(0); }
  }
  @keyframes shake {
    10%, 90% { transform: translateX(-1px); }
    20%, 80% { transform: translateX(2px); }
    30%, 50%, 70% { transform: translateX(-5px); }
    40%, 60% { transform: translateX(5px); }
  }
  @keyframes bounce {
    0%, 20% { transform: translateY(0); }
    40%     { transform: translateY(-28px); }
    50%     { transform: translateY(6px); }
    60%     { transform: translateY(-16px); }
    80%     { transform: translateY(3px); }
    100%    { transform: translateY(0); }
  }

  /* ─── Keyboard ───────────────────────────────────────────── */
  #keyboard { display: flex; flex-direction: column; gap: 6px; }
  .kb-row { display: flex; gap: 5px; justify-content: center; }
  .wurthle-key {
    height: 54px;
    min-width: 32px;
    border: none; border-radius: 7px;
    background: var(--bg-chip);
    color: var(--ink);
    font-weight: 600; font-size: 14px;
    cursor: pointer;
    text-transform: uppercase;
    transition: all 0.15s var(--ease);
    flex: 1;
    letter-spacing: 0.02em;
  }
  .wurthle-key:hover { background: #E3E0D9; transform: translateY(-1px); }
  .wurthle-key:active { transform: translateY(0); }
  .wurthle-key.wide { font-size: 11px; flex: 1.5; letter-spacing: 0.04em; }

  /* ─── End-of-game panel ──────────────────────────────────── */
  .end-panel {
    display: none;
    margin-top: 20px;
    padding: 18px 20px;
    background: var(--surface);
    border-radius: var(--radius);
    box-shadow: var(--shadow-sm);
    position: relative;
    overflow: hidden;
  }
  .end-panel::before {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
    background: var(--wurth-red);
  }
  .end-status { font-size: 17px; font-weight: 600; letter-spacing: -0.01em; }
  .end-points { font-size: 12.5px; color: var(--muted); margin: 4px 0 14px; }
  .end-points strong { color: var(--wurth-red); font-weight: 600; }
  .end-actions { display: flex; gap: 8px; flex-wrap: wrap; }

  .btn {
    height: 40px; padding: 0 18px;
    border-radius: 100px; border: none;
    font-size: 12.5px; font-weight: 600;
    cursor: pointer;
    transition: all 0.15s var(--ease);
    letter-spacing: 0.01em;
  }
  .btn-primary { background: var(--wurth-red); color: #fff; }
  .btn-primary:hover { background: var(--wurth-red-dk); transform: translateY(-1px); box-shadow: 0 4px 10px rgba(204,0,0,0.2); }
  .btn-ghost {
    background: transparent; color: var(--ink);
    border: 1px solid var(--line-2);
  }
  .btn-ghost:hover { background: var(--bg-chip); }

  /* ─── Account tab ────────────────────────────────────────── */
  .card {
    background: var(--surface);
    border-radius: var(--radius);
    padding: 20px;
    margin-bottom: 14px;
    box-shadow: var(--shadow-sm);
  }
  .card-label {
    font-size: 10.5px; font-weight: 500;
    text-transform: uppercase; letter-spacing: 0.1em;
    color: var(--muted); margin-bottom: 10px;
  }
  .big-balance {
    font-size: 36px; font-weight: 700;
    color: var(--wurth-red); line-height: 1;
    letter-spacing: -0.03em;
    font-feature-settings: 'ss01';
  }
  .big-balance-sub { font-size: 12.5px; color: var(--muted); margin-top: 8px; }
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
  .stat-cell { text-align: left; }
  .stat-cell-val { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
  .stat-cell-label { font-size: 10.5px; color: var(--muted); margin-top: 2px; }

  .activity-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid var(--line);
    font-size: 13px;
  }
  .activity-row:last-child { border-bottom: none; }
  .activity-label { line-height: 1.3; }
  .activity-date { font-size: 11px; color: var(--muted); margin-top: 2px; }
  .activity-amt { font-weight: 600; font-size: 13px; }
  .activity-amt.plus { color: var(--ink); }
  .activity-amt.minus { color: var(--wurth-red); }
  .empty-note { color: var(--muted); font-style: italic; padding: 8px 0; font-size: 12.5px; }

  /* ─── Opt-in toggle ──────────────────────────────────────── */
  .opt-row {
    display: flex; justify-content: space-between; align-items: center;
    gap: 14px;
  }
  .opt-text { flex: 1; min-width: 0; }
  .opt-title { font-size: 13.5px; font-weight: 500; margin-bottom: 2px; }
  .opt-sub { font-size: 11.5px; color: var(--muted); line-height: 1.4; }
  .toggle {
    position: relative; width: 46px; height: 26px;
    background: var(--line-2); border-radius: 100px;
    cursor: pointer; flex-shrink: 0;
    transition: background 0.2s var(--ease);
  }
  .toggle::after {
    content: ''; position: absolute;
    top: 3px; left: 3px;
    width: 20px; height: 20px;
    background: #fff; border-radius: 50%;
    transition: transform 0.2s var(--ease);
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }
  .toggle.on { background: var(--wurth-red); }
  .toggle.on::after { transform: translateX(20px); }

  /* ─── Leaderboard ────────────────────────────────────────── */
  .lb-hero {
    background: linear-gradient(135deg, #1a1a1a 0%, #2a1414 100%);
    color: #fff;
    border-radius: var(--radius-lg);
    padding: 22px 20px;
    margin-bottom: 16px;
    position: relative;
    overflow: hidden;
    box-shadow: var(--shadow-md);
  }
  .lb-hero::after {
    content: ''; position: absolute;
    top: -40px; right: -40px;
    width: 180px; height: 180px;
    background: radial-gradient(circle, rgba(204,0,0,0.4) 0%, transparent 70%);
    pointer-events: none;
  }
  .lb-hero-eyebrow {
    font-size: 10px; font-weight: 600; letter-spacing: 0.14em;
    text-transform: uppercase; color: #FF6060;
    margin-bottom: 8px;
  }
  .lb-hero-title { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.15; }
  .lb-hero-sub { font-size: 12.5px; color: rgba(255,255,255,0.7); margin-top: 8px; line-height: 1.5; }
  .lb-hero-stats { display: flex; gap: 18px; margin-top: 16px; }
  .lb-stat-val { font-size: 20px; font-weight: 700; letter-spacing: -0.01em; }
  .lb-stat-label { font-size: 10.5px; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 0.08em; }

  .lb-list { background: var(--surface); border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow-sm); }
  .lb-row {
    display: grid;
    grid-template-columns: 42px 1fr auto;
    align-items: center;
    gap: 10px;
    padding: 11px 16px;
    border-bottom: 1px solid var(--line);
    font-size: 13.5px;
    transition: background 0.15s var(--ease);
  }
  .lb-row:last-child { border-bottom: none; }
  .lb-row.is-me {
    background: #FFF7F0;
    border-left: 3px solid var(--wurth-red);
    padding-left: 13px;
  }
  .lb-rank {
    font-size: 13px; font-weight: 600;
    color: var(--muted);
    letter-spacing: -0.01em;
    text-align: center;
  }
  .lb-row.top-1 .lb-rank,
  .lb-row.top-2 .lb-rank,
  .lb-row.top-3 .lb-rank {
    display: inline-flex; align-items: center; justify-content: center;
    width: 26px; height: 26px; border-radius: 50%;
    color: #fff; font-weight: 700; font-size: 12px;
    margin-left: 8px;
  }
  .lb-row.top-1 .lb-rank { background: linear-gradient(135deg, #D4AF37, #B8912E); }
  .lb-row.top-2 .lb-rank { background: linear-gradient(135deg, #B5B5B5, #8E8E8E); }
  .lb-row.top-3 .lb-rank { background: linear-gradient(135deg, #CD7F32, #A4652B); }
  .lb-name { font-weight: 500; letter-spacing: -0.005em; }
  .lb-name.anon { color: var(--muted-2); font-style: italic; font-weight: 400; }
  .lb-me-chip {
    display: inline-block; margin-left: 6px;
    padding: 1px 7px; border-radius: 100px;
    background: var(--wurth-red); color: #fff;
    font-size: 9.5px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
    vertical-align: 1px;
  }
  .lb-points {
    font-weight: 600; font-size: 14px; color: var(--ink);
    letter-spacing: -0.01em;
  }
  .lb-points-sub { font-size: 10px; color: var(--muted-2); font-weight: 400; margin-left: 2px; }

  .lb-cutoff {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 16px;
    background: var(--bg-chip);
    font-size: 10.5px; font-weight: 500;
    color: var(--muted);
    text-transform: uppercase; letter-spacing: 0.1em;
  }
  .lb-cutoff::before, .lb-cutoff::after {
    content: ''; flex: 1; height: 1px; background: var(--line-2);
  }
  .lb-pinned {
    margin-top: 12px;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
  }
  .lb-pinned-label {
    font-size: 10px; font-weight: 500;
    text-transform: uppercase; letter-spacing: 0.1em;
    color: var(--muted);
    padding: 10px 16px 2px;
  }

  .lb-empty {
    background: var(--surface);
    border-radius: var(--radius);
    padding: 32px 20px;
    text-align: center;
    box-shadow: var(--shadow-sm);
  }
  .lb-empty-title { font-size: 15px; font-weight: 600; margin-bottom: 6px; }
  .lb-empty-sub { font-size: 12.5px; color: var(--muted); line-height: 1.5; max-width: 320px; margin: 0 auto; }

  .lb-optin-prompt {
    background: #FFF7F0;
    border: 1px solid #FFDDC2;
    border-radius: var(--radius);
    padding: 14px 16px;
    margin-bottom: 14px;
    display: flex; gap: 12px; align-items: center;
    font-size: 13px;
  }
  .lb-optin-icon {
    width: 32px; height: 32px; border-radius: 50%;
    background: var(--wurth-red); color: #fff;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; font-weight: 700;
  }
  .lb-optin-text { flex: 1; }
  .lb-optin-text strong { font-weight: 600; }
  .lb-optin-text .small { font-size: 11.5px; color: var(--muted); margin-top: 2px; }
  .lb-optin-cta {
    padding: 7px 14px;
    background: var(--ink); color: #fff;
    border: none; border-radius: 100px;
    font-size: 11.5px; font-weight: 600; cursor: pointer;
    letter-spacing: 0.02em;
  }
  .lb-optin-cta:hover { background: var(--wurth-red); }

  /* ─── Login screen ───────────────────────────────────────── */
  .login-screen {
    display: none; flex-direction: column; align-items: center;
    padding: 64px 24px;
  }
  .login-screen.show { display: flex; }
  .login-logo { width: 200px; height: auto; display: block; margin-bottom: 28px; }
  .login-title { font-size: 26px; font-weight: 700; margin-bottom: 8px; letter-spacing: -0.02em; }
  .auth-tabs {
    display: flex; width: 100%; max-width: 320px;
    background: var(--surface); border-radius: 100px; padding: 4px;
    box-shadow: var(--shadow-sm); margin-bottom: 18px;
  }
  .auth-tab {
    flex: 1; padding: 9px 6px; border: none; background: transparent;
    font-size: 13px; font-weight: 500; color: var(--muted);
    border-radius: 100px; cursor: pointer; transition: all 0.2s var(--ease);
  }
  .auth-tab.active { background: var(--ink); color: #fff; }
  .auth-form:not(.active) { display: none; }
  .field-hint { font-size: 11.5px; color: var(--muted); margin: -4px 2px 2px; line-height: 1.4; }
  .login-sub {
    font-size: 13.5px; color: var(--muted);
    margin-bottom: 26px; text-align: center;
    line-height: 1.5; max-width: 320px;
  }
  .login-form { display: flex; flex-direction: column; gap: 10px; width: 100%; max-width: 320px; }
  .login-form input {
    padding: 13px 16px;
    border: 1px solid var(--line-2);
    border-radius: var(--radius-sm);
    font-size: 14px; font-family: inherit;
    outline: none;
    background: var(--surface);
    transition: all 0.15s var(--ease);
  }
  .login-form input:focus { border-color: var(--wurth-red); box-shadow: 0 0 0 3px rgba(204,0,0,0.1); }
  .login-form button {
    padding: 13px;
    background: var(--wurth-red); color: #fff;
    border: none; border-radius: var(--radius-sm);
    font-size: 13.5px; font-weight: 600; cursor: pointer;
    letter-spacing: 0.02em;
    transition: all 0.15s var(--ease);
    margin-top: 4px;
  }
  .login-form button:hover { background: var(--wurth-red-dk); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(204,0,0,0.2); }
  .login-form button:disabled { background: var(--line); color: var(--muted); cursor: not-allowed; transform: none; box-shadow: none; }
  .login-error { color: var(--wurth-red); font-size: 12px; min-height: 16px; text-align: center; }

  /* ─── Overlays ───────────────────────────────────────────── */
  .overlay-dim {
    position: fixed; inset: 0;
    background: rgba(16,16,14,0.4);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    z-index: 90; display: none;
    animation: fadeIn 0.2s var(--ease);
  }
  .overlay-dim.show { display: block; }
  .overlay-panel {
    position: fixed; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 92%; max-width: 440px; max-height: 88vh;
    background: var(--surface);
    border-radius: var(--radius-lg);
    z-index: 95; display: none; overflow: hidden;
    box-shadow: var(--shadow-lg);
    flex-direction: column;
  }
  .overlay-panel.show { display: flex; animation: fadeIn 0.25s var(--ease); }
  .overlay-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 18px 22px;
    border-bottom: 1px solid var(--line);
    flex-shrink: 0;
  }
  .overlay-title { font-size: 17px; font-weight: 600; letter-spacing: -0.01em; }
  .overlay-body { padding: 18px 22px 24px; overflow-y: auto; }
  .overlay-close {
    background: var(--bg-chip); border: none; cursor: pointer;
    font-size: 20px; color: var(--muted); line-height: 1;
    width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 50%;
    transition: all 0.15s var(--ease);
  }
  .overlay-close:hover { background: var(--ink); color: #fff; }

  .example-tile {
    display: inline-flex; align-items: center; justify-content: center;
    width: 32px; height: 32px; border-radius: var(--radius-sm);
    font-weight: 700; font-size: 15px; text-transform: uppercase;
    margin-right: 4px;
  }
  .ex-row { margin-bottom: 14px; }
  .ex-tiles { margin-bottom: 6px; }
  .ex-caption { font-size: 12.5px; line-height: 1.4; color: var(--ink-2); }
  .ex-caption strong { font-weight: 600; }
  .help-section {
    margin-top: 16px; padding-top: 16px;
    border-top: 1px solid var(--line);
  }
  .help-table { width: 100%; font-size: 12.5px; border-collapse: collapse; }
  .help-table td { padding: 5px 0; }
  .help-table td:first-child { color: var(--muted); }
  .help-table td:last-child { text-align: right; font-weight: 600; letter-spacing: -0.005em; }

  .dist-row {
    display: flex; align-items: center; gap: 10px;
    font-size: 12.5px; margin-bottom: 4px;
  }
  .dist-idx { width: 14px; font-weight: 600; color: var(--muted); }
  .dist-bar {
    flex: 1; background: var(--muted-2); color: #fff;
    padding: 3px 10px; border-radius: var(--radius-sm);
    min-width: 28px; text-align: right; font-weight: 600; font-size: 12px;
    transition: width 0.5s var(--ease), background 0.3s var(--ease);
  }
  .dist-bar.highlight { background: var(--tile-correct); color: var(--ink); }

  .app-shell { display: none; }
  .app-shell.show { display: block; }
  .footer-note {
    text-align: center; margin-top: 32px; padding-top: 18px;
    border-top: 1px solid var(--line);
    font-size: 11px; color: var(--muted-2);
    letter-spacing: 0.02em;
  }

  /* ─── Würth type: Extra Bold Condensed for headings, numbers, tiles
     and buttons; everything else stays in Wuerth Book (set on body). ── */
  .brand-title, .login-title, .overlay-title, .lb-hero-title, .lb-empty-title,
  .end-status, .card-label, .lb-hero-eyebrow, .opt-title,
  .big-balance, .stat-cell-val, .stat-chip-val, .lb-stat-val, .balance-val,
  .lb-rank, .lb-points, .avatar,
  .wurthle-tile, .example-tile, .wurthle-key, .dist-bar,
  .btn, .login-form button, .lb-optin-cta, .lb-me-chip {
    font-family: var(--font-head);
    font-weight: 800;
    letter-spacing: 0.01em;
  }
  .brand-title   { font-size: 36px; }
  .login-title   { font-size: 36px; }
  .overlay-title { font-size: 21px; }
  .lb-hero-title { font-size: 27px; line-height: 1.1; }
  .end-status    { font-size: 21px; }
  .card-label    { font-size: 12.5px; letter-spacing: 0.06em; }
  .opt-title { font-size: 16px; }
  .big-balance   { font-size: 42px; }
  .stat-cell-val { font-size: 26px; }
  .wurthle-tile  { font-size: 34px; }
  .wurthle-key   { font-size: 17px; letter-spacing: 0.03em; }
  .wurthle-key.wide { font-size: 13px; }
  .btn, .login-form button, .lb-optin-cta { font-size: 15px; letter-spacing: 0.03em; }

  /* Wuerth Book runs small next to the old DM Sans sizes */
  .login-sub { font-size: 15px; }
  .login-form input { font-size: 15px; }
  .auth-tab, .tab-btn { font-size: 14px; }
  .field-hint, .account-sub, .brand-sub, .end-points, .opt-sub, .lb-hero-sub { font-size: 13px; }
  .account-name, .activity-row, .lb-row, .ex-caption { font-size: 14.5px; }

  .terms-link { margin-top: 22px; font-size: 13.5px; color: var(--muted); text-decoration: underline; text-underline-offset: 3px; }
  .terms-link:hover { color: var(--ink); }
  .lb-hero-sub a { color: #fff; text-decoration: underline; text-underline-offset: 2px; }
  .opt-sub a, .lb-optin-text a { color: var(--ink); text-decoration: underline; text-underline-offset: 2px; }
  .pw-intro { font-size: 14.5px; color: var(--ink-2); margin-bottom: 14px; line-height: 1.5; }
  .pw-intro:empty { display: none; }
  .pw-form { max-width: none; }
  #change-pw-btn { flex-shrink: 0; }
</style>
</head>
<body>

<div class="wurthle-wrap">

  <!-- ─── Login screen ─── -->
  <div id="login-screen" class="login-screen">
    <img class="login-logo" src="${WURTH_LOGO_SRC}" alt="Würth" />
    <div class="login-title">Würthle</div>
    <div class="login-sub">Play the daily word puzzle and collect loyalty points with your Würth customer number.</div>

    <div class="auth-tabs" role="tablist">
      <button type="button" class="auth-tab active" data-auth="login" role="tab">Sign in</button>
      <button type="button" class="auth-tab" data-auth="register" role="tab">Create account</button>
    </div>

    <form class="login-form auth-form active" id="login-form" novalidate>
      <input type="text" id="login-customer" placeholder="Customer number, e.g. 3081234…" inputmode="numeric" autocomplete="username" />
      <input type="password" id="login-password" placeholder="Password" autocomplete="current-password" />
      <button type="submit" id="login-btn">Sign in &amp; play</button>
      <div class="login-error" id="login-error"></div>
    </form>

    <form class="login-form auth-form" id="register-form" novalidate>
      <input type="text" id="reg-customer" placeholder="Customer number, e.g. 3081234…" inputmode="numeric" autocomplete="username" />
      <div class="field-hint">Your Würth customer number — it starts with 308.</div>
      <input type="text" id="reg-name" placeholder="Your name" autocomplete="name" maxlength="60" />
      <div class="field-hint">Shown as e.g. “Jamie B.” if you join the leaderboard.</div>
      <input type="password" id="reg-password" placeholder="Create a password (8+ characters)" autocomplete="new-password" />
      <input type="password" id="reg-password2" placeholder="Confirm password" autocomplete="new-password" />
      <button type="submit" id="register-btn">Create account &amp; play</button>
      <div class="login-error" id="register-error"></div>
    </form>
    <a class="terms-link" href="/wurthle/terms">Play · Spend · Win — Terms &amp; Conditions</a>
  </div>

  <!-- ─── Main app shell ─── -->
  <div class="app-shell" id="app-shell">

    <div class="account-bar">
      <div class="account-left">
        <div class="avatar" id="user-avatar">?</div>
        <div>
          <div class="account-name" id="user-name">—</div>
          <div class="account-sub" id="user-email">—</div>
          <button class="logout-link" id="logout-btn">Sign out</button>
        </div>
      </div>
      <div class="balance-pill">
        <span class="balance-label">Points</span>
        <span class="balance-val" id="balance-val">0 pts</span>
      </div>
    </div>

    <div class="tabs">
      <button class="tab-btn active" data-tab="game">Puzzle</button>
      <button class="tab-btn" data-tab="leaderboard">Leaderboard</button>
      <button class="tab-btn" data-tab="account">Account</button>
    </div>

    <div id="toast" class="wurthle-toast"></div>

    <!-- ─── Game tab ─── -->
    <div class="tab-panel active" id="tab-game">
      <div class="game-header">
        <button id="helpbtn" class="icon-btn" title="How to play" aria-label="How to play">?</button>
        <div class="brand-block">
          <div class="brand-title">W&uuml;rthle</div>
          <div class="brand-sub" id="datelabel">Daily word</div>
        </div>
        <button id="statsbtn" class="icon-btn" title="Statistics" aria-label="Statistics">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="20" x2="6" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="18" y1="20" x2="18" y2="14"/></svg>
        </button>
      </div>

      <div class="stat-row">
        <div class="stat-chips">
          <div class="stat-chip light">
            <div class="stat-chip-label">Streak</div>
            <div class="stat-chip-val" id="streak-val">0</div>
          </div>
          <div class="stat-chip dark">
            <div class="stat-chip-label">Today</div>
            <div class="stat-chip-val" id="points-val">3 pts</div>
          </div>
        </div>
        <div class="puzzle-no" id="puzzle-no"></div>
      </div>

      <div id="board" class="wurthle-board"></div>
      <div id="keyboard"></div>

      <div id="endpanel" class="end-panel">
        <div id="endstatus" class="end-status"></div>
        <div id="endpoints" class="end-points"></div>
        <div class="end-actions">
          <button id="sharebtn" class="btn btn-primary">Share result</button>
          <button id="gotoleaderboardbtn" class="btn btn-ghost">View leaderboard →</button>
        </div>
      </div>
    </div>

    <!-- ─── Leaderboard tab ─── -->
    <div class="tab-panel" id="tab-leaderboard">
      <div class="lb-hero">
        <div class="lb-hero-eyebrow">Play · Spend · Win · November</div>
        <div class="lb-hero-title">Climb the leaderboard, win a 50″ Xiaomi TV.</div>
        <div class="lb-hero-sub">Top 50 point-earners who also spend £500+ on the eShop in November go into the prize draw. <a href="/wurthle/terms" target="_blank" rel="noopener">Terms &amp; Conditions</a></div>
        <div class="lb-hero-stats">
          <div>
            <div class="lb-stat-val" id="lb-my-points">0</div>
            <div class="lb-stat-label">Your Nov points</div>
          </div>
          <div>
            <div class="lb-stat-val" id="lb-my-rank">—</div>
            <div class="lb-stat-label">Your rank</div>
          </div>
          <div>
            <div class="lb-stat-val" id="lb-total">0</div>
            <div class="lb-stat-label">Players</div>
          </div>
        </div>
      </div>

      <div id="lb-optin-prompt" class="lb-optin-prompt" style="display:none;">
        <div class="lb-optin-icon">!</div>
        <div class="lb-optin-text">
          <strong>You're not on the leaderboard yet.</strong>
          <div class="small">Opt in to show your name and enter the Play · Spend · Win draw. By opting in you agree to the <a href="/wurthle/terms" target="_blank" rel="noopener">terms</a>.</div>
        </div>
        <button class="lb-optin-cta" id="lb-optin-cta">Opt in</button>
      </div>

      <div id="lb-content"></div>
    </div>

    <!-- ─── Account tab ─── -->
    <div class="tab-panel" id="tab-account">
      <div class="card">
        <div class="card-label">Your points</div>
        <div class="big-balance" id="acc-balance">0 pts</div>
      </div>

      <div class="card">
        <div class="card-label">Würthle stats</div>
        <div class="stats-grid">
          <div class="stat-cell"><div class="stat-cell-val" id="acc-played">0</div><div class="stat-cell-label">Played</div></div>
          <div class="stat-cell"><div class="stat-cell-val" id="acc-won">0</div><div class="stat-cell-label">Won</div></div>
          <div class="stat-cell"><div class="stat-cell-val" id="acc-streak">0</div><div class="stat-cell-label">Streak</div></div>
          <div class="stat-cell"><div class="stat-cell-val" id="acc-max">0</div><div class="stat-cell-label">Best</div></div>
        </div>
      </div>

      <div class="card">
        <div class="opt-row">
          <div class="opt-text">
            <div class="opt-title">Show my name on the November leaderboard</div>
            <div class="opt-sub">Required for the Play · Spend · Win draw. By turning this on you agree to the <a href="/wurthle/terms" target="_blank" rel="noopener">Terms &amp; Conditions</a>. You can turn it off any time.</div>
          </div>
          <div class="toggle" id="optin-toggle" role="switch" aria-checked="false" tabindex="0"></div>
        </div>
      </div>

      <div class="card">
        <div class="opt-row">
          <div class="opt-text">
            <div class="opt-title">Password</div>
            <div class="opt-sub">Change the password you use to sign in.</div>
          </div>
          <button class="btn btn-ghost" id="change-pw-btn">Change</button>
        </div>
      </div>

      <div class="card">
        <div class="card-label">Recent activity</div>
        <div id="activity-list">
          <div class="empty-note">No activity yet — play today's puzzle to start earning.</div>
        </div>
      </div>
    </div>

    <div class="footer-note">Würthle prototype · server-backed loyalty</div>
  </div>
</div>

<div id="dimmer" class="overlay-dim"></div>

<!-- ─── Help modal ─── -->
<div id="helpmodal" class="overlay-panel">
  <div class="overlay-header">
    <div class="overlay-title">How to play</div>
    <button class="overlay-close" id="closehelpbtn" aria-label="Close">×</button>
  </div>
  <div class="overlay-body">
    <div style="font-size: 13.5px; margin-bottom: 14px; line-height: 1.5;">Guess the W&uuml;rthle in <strong>5 tries</strong>. Each guess must be a valid 5-letter word.</div>

    <div class="card-label">Examples</div>

    <div class="ex-row">
      <div class="ex-tiles">
        <span class="example-tile" style="background: #B9C900;">D</span>
        <span class="example-tile" style="border: 2px solid #2C2C2A;">R</span>
        <span class="example-tile" style="border: 2px solid #2C2C2A;">I</span>
        <span class="example-tile" style="border: 2px solid #2C2C2A;">L</span>
        <span class="example-tile" style="border: 2px solid #2C2C2A;">L</span>
      </div>
      <div class="ex-caption"><strong>D</strong> is in the correct spot.</div>
    </div>

    <div class="ex-row">
      <div class="ex-tiles">
        <span class="example-tile" style="border: 2px solid #2C2C2A;">B</span>
        <span class="example-tile" style="background: #009EE0; color: #fff;">R</span>
        <span class="example-tile" style="border: 2px solid #2C2C2A;">A</span>
        <span class="example-tile" style="border: 2px solid #2C2C2A;">C</span>
        <span class="example-tile" style="border: 2px solid #2C2C2A;">E</span>
      </div>
      <div class="ex-caption"><strong>R</strong> is in the word, wrong spot.</div>
    </div>

    <div class="ex-row">
      <div class="ex-tiles">
        <span class="example-tile" style="border: 2px solid #2C2C2A;">G</span>
        <span class="example-tile" style="border: 2px solid #2C2C2A;">A</span>
        <span class="example-tile" style="background: #CC0000; color: #fff;">U</span>
        <span class="example-tile" style="border: 2px solid #2C2C2A;">G</span>
        <span class="example-tile" style="border: 2px solid #2C2C2A;">E</span>
      </div>
      <div class="ex-caption"><strong>U</strong> is not in the word.</div>
    </div>

    <div class="help-section">
      <div class="card-label">Earn loyalty points</div>
      <table class="help-table">
        <tr><td>Daily solve</td><td>3 pts</td></tr>
        <tr><td>7-day streak</td><td>4 pts</td></tr>
        <tr><td>14-day streak</td><td>5 pts</td></tr>
        <tr><td>21-day streak</td><td>6 pts</td></tr>
      </table>
    </div>
  </div>
</div>

<!-- ─── Stats modal ─── -->
<div id="statsmodal" class="overlay-panel">
  <div class="overlay-header">
    <div class="overlay-title">Statistics</div>
    <button class="overlay-close" id="closestatsbtn" aria-label="Close">×</button>
  </div>
  <div class="overlay-body">
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px;">
      <div style="text-align: center;"><div class="stat-cell-val" id="s-played">0</div><div class="stat-cell-label">Played</div></div>
      <div style="text-align: center;"><div class="stat-cell-val" id="s-winpct">0</div><div class="stat-cell-label">Win %</div></div>
      <div style="text-align: center;"><div class="stat-cell-val" id="s-streak">0</div><div class="stat-cell-label">Current</div></div>
      <div style="text-align: center;"><div class="stat-cell-val" id="s-max">0</div><div class="stat-cell-label">Max</div></div>
    </div>
    <div class="card-label">Guess distribution</div>
    <div id="distribution"></div>
  </div>
</div>

<!-- ─── Password modal ─── -->
<div id="pwmodal" class="overlay-panel" role="dialog" aria-modal="true">
  <div class="overlay-header">
    <div class="overlay-title" id="pw-title">Change password</div>
    <button class="overlay-close" id="closepwbtn" aria-label="Close">×</button>
  </div>
  <div class="overlay-body">
    <div class="pw-intro" id="pw-intro"></div>
    <form class="login-form pw-form" id="pw-form" novalidate>
      <input type="password" id="pw-current" placeholder="Current password" autocomplete="current-password" />
      <input type="password" id="pw-new" placeholder="New password (8+ characters)" autocomplete="new-password" />
      <input type="password" id="pw-new2" placeholder="Confirm new password" autocomplete="new-password" />
      <button type="submit" id="pw-submit">Save new password</button>
      <div class="login-error" id="pw-error"></div>
    </form>
  </div>
</div>

<script>
(function() {
  const API = window.location.origin + "/api/wurthle";
  const COLOURS = {
    correct: { bg: 'var(--tile-correct)', fg: 'var(--tile-correct-ink)' },
    present: { bg: 'var(--tile-present)', fg: 'var(--tile-present-ink)' },
    absent:  { bg: 'var(--tile-absent)',  fg: 'var(--tile-absent-ink)' }
  };
  const MAX_ATTEMPTS = 5;
  const TOKEN_KEY = 'wurthle_session';
  try { localStorage.removeItem('wurthle_jwt'); } catch (e) {}

  let token = localStorage.getItem(TOKEN_KEY);
  let state = null;
  let tiles = [], rows = [];
  let currentRow = 0, currentCol = 0;
  let gameOver = false;
  let submitting = false;
  let answer = null;

  const keyStates = {};
  const keyEls = {};

  // ─── API helpers ──────────────────────────────────────────────────
  async function api(path, method, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(API + path, {
      method: method || 'GET',
      headers: headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(function() { return {}; });
    if (!res.ok) {
      const err = new Error(data.error || 'Request failed');
      err.status = res.status;
      throw err;
    }
    return data;
  }

  // ─── Auth ─────────────────────────────────────────────────────────
  function showLogin() {
    document.getElementById('login-screen').classList.add('show');
    document.getElementById('app-shell').classList.remove('show');
  }
  function showApp() {
    document.getElementById('login-screen').classList.remove('show');
    document.getElementById('app-shell').classList.add('show');
  }

  function showAuthForm(which) {
    document.querySelectorAll('.auth-tab').forEach(function(t) { t.classList.toggle('active', t.dataset.auth === which); });
    document.getElementById('login-form').classList.toggle('active', which === 'login');
    document.getElementById('register-form').classList.toggle('active', which === 'register');
    document.getElementById('login-error').textContent = '';
    document.getElementById('register-error').textContent = '';
  }
  document.querySelectorAll('.auth-tab').forEach(function(t) {
    t.addEventListener('click', function() { showAuthForm(t.dataset.auth); });
  });

  function cleanCustomerNumber(v) { return v.replace(/\\s+/g, ''); }
  const CUSTOMER_RE = /^308\\d{4,9}$/;

  async function startSession(data) {
    token = data.token;
    localStorage.setItem(TOKEN_KEY, token);
    ['login-password', 'reg-password', 'reg-password2'].forEach(function(id) { document.getElementById(id).value = ''; });
    await boot();
  }

  document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const customerNumber = cleanCustomerNumber(document.getElementById('login-customer').value);
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('login-btn');
    const errEl = document.getElementById('login-error');
    errEl.textContent = '';
    if (!customerNumber || !password) { errEl.textContent = 'Enter your customer number and password.'; return; }
    btn.disabled = true; btn.textContent = 'Signing in…';
    try {
      await startSession(await api('/login', 'POST', { customerNumber: customerNumber, password: password }));
    } catch (err) {
      errEl.textContent = err.message;
    } finally {
      btn.disabled = false; btn.textContent = 'Sign in & play';
    }
  });

  document.getElementById('register-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const customerNumber = cleanCustomerNumber(document.getElementById('reg-customer').value);
    const name = document.getElementById('reg-name').value.trim();
    const password = document.getElementById('reg-password').value;
    const password2 = document.getElementById('reg-password2').value;
    const btn = document.getElementById('register-btn');
    const errEl = document.getElementById('register-error');
    errEl.textContent = '';
    if (!CUSTOMER_RE.test(customerNumber)) { errEl.textContent = 'Enter your Würth customer number — it starts with 308.'; return; }
    if (name.length < 2) { errEl.textContent = 'Enter your name.'; return; }
    if (password.length < 8) { errEl.textContent = 'Password must be at least 8 characters.'; return; }
    if (password !== password2) { errEl.textContent = 'Passwords don\\'t match.'; return; }
    btn.disabled = true; btn.textContent = 'Creating account…';
    try {
      await startSession(await api('/register', 'POST', { customerNumber: customerNumber, name: name, password: password }));
    } catch (err) {
      errEl.textContent = err.message;
    } finally {
      btn.disabled = false; btn.textContent = 'Create account & play';
    }
  });

  document.getElementById('logout-btn').addEventListener('click', function() {
    localStorage.removeItem(TOKEN_KEY);
    token = null;
    showAuthForm('login');
    showLogin();
  });

  // ─── Board / keyboard ────────────────────────────────────────────
  function buildBoard() {
    const board = document.getElementById('board');
    board.innerHTML = '';
    tiles = []; rows = [];
    for (let r = 0; r < MAX_ATTEMPTS; r++) {
      const row = document.createElement('div'); row.className = 'wurthle-row';
      const rowTiles = [];
      for (let c = 0; c < 5; c++) {
        const t = document.createElement('div'); t.className = 'wurthle-tile';
        row.appendChild(t); rowTiles.push(t);
      }
      board.appendChild(row); tiles.push(rowTiles); rows.push(row);
    }
  }

  function buildKeyboard() {
    const kb = document.getElementById('keyboard');
    if (kb.children.length) return;
    const KB = [['Q','W','E','R','T','Y','U','I','O','P'],['A','S','D','F','G','H','J','K','L'],['ENTER','Z','X','C','V','B','N','M','BACK']];
    KB.forEach(function(row) {
      const rowEl = document.createElement('div'); rowEl.className = 'kb-row';
      row.forEach(function(k) {
        const btn = document.createElement('button'); btn.className = 'wurthle-key';
        if (k === 'ENTER' || k === 'BACK') { btn.classList.add('wide'); btn.textContent = k === 'ENTER' ? 'Enter' : '⌫'; }
        else { btn.textContent = k; keyEls[k] = btn; }
        btn.addEventListener('click', function() { handleKey(k); });
        rowEl.appendChild(btn);
      });
      kb.appendChild(rowEl);
    });
  }

  function paintTile(tile, letter, res) {
    const c = COLOURS[res];
    tile.textContent = letter;
    tile.style.background = c.bg; tile.style.color = c.fg; tile.style.borderColor = c.bg;
    const priority = { correct: 3, present: 2, absent: 1 };
    if (!keyStates[letter] || priority[res] > priority[keyStates[letter]]) {
      keyStates[letter] = res;
      if (keyEls[letter]) { keyEls[letter].style.background = c.bg; keyEls[letter].style.color = c.fg; }
    }
  }

  function shake(row) { row.classList.remove('shake'); row.offsetHeight; row.classList.add('shake'); }

  let toastTimer;
  function toast(msg, dur) {
    dur = dur || 1600;
    const el = document.getElementById('toast');
    el.textContent = msg; el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function() { el.classList.remove('show'); }, dur);
  }

  function handleKey(k) {
    if (gameOver || submitting) return;
    if (k === 'ENTER') return submit();
    if (k === 'BACK') {
      if (currentCol > 0) {
        currentCol--;
        const t = tiles[currentRow][currentCol];
        t.textContent = ''; t.classList.remove('filled');
      }
      return;
    }
    if (/^[A-Z]$/.test(k) && currentCol < 5) {
      const t = tiles[currentRow][currentCol];
      t.textContent = k; t.classList.add('filled');
      t.style.animation = 'none'; t.offsetHeight; t.style.animation = '';
      currentCol++;
    }
  }

  async function submit() {
    if (currentCol < 5) { shake(rows[currentRow]); toast('Not enough letters'); return; }
    const guess = tiles[currentRow].map(function(t) { return t.textContent; }).join('');

    submitting = true;
    let data;
    try {
      data = await api('/guess', 'POST', { guess: guess });
    } catch (err) {
      submitting = false;
      shake(rows[currentRow]);
      toast(err.message || 'Could not submit');
      return;
    }

    const result = data.result;
    const FLIP_MS = 600, STAGGER = 300;
    result.forEach(function(res, i) {
      const tile = tiles[currentRow][i];
      setTimeout(function() {
        tile.classList.add('flipping');
        setTimeout(function() { paintTile(tile, guess[i], res); }, FLIP_MS / 2);
      }, i * STAGGER);
    });

    setTimeout(async function() {
      submitting = false;
      if (data.won) { rows[currentRow].classList.add('bounce'); }
      if (data.gameOver) {
        gameOver = true;
        answer = data.answer;
        await loadState();
        showEndPanel(data.won, currentRow + 1, data.pointsEarned, data.balance);
      } else {
        currentRow++;
        currentCol = 0;
      }
    }, result.length * STAGGER + FLIP_MS);
  }

  function showEndPanel(won, attempts, pointsEarned, balance) {
    document.getElementById('endpanel').style.display = 'block';
    if (won) {
      const labels = ['Genius!','Impressive!','Splendid!','Great!','Phew!'];
      document.getElementById('endstatus').textContent = labels[attempts - 1] || 'Solved!';
      document.getElementById('endpoints').innerHTML = 'Solved in ' + attempts + '/' + MAX_ATTEMPTS + ' · <strong>+' + pointsEarned + ' pts</strong> · Total: ' + balance + ' pts';
    } else {
      document.getElementById('endstatus').textContent = 'The word was ' + answer;
      document.getElementById('endpoints').textContent = 'Streak reset · come back tomorrow';
    }
  }

  // ─── Render full state ────────────────────────────────────────────
  function applyState(s) {
    state = s;
    answer = s.today.answer;
    gameOver = s.today.gameOver;

    const initials = (s.user.name || '').split(/\\s+/).filter(Boolean).map(function(p) { return p[0]; }).join('').slice(0,2).toUpperCase();
    document.getElementById('user-avatar').textContent = initials || 'W';
    document.getElementById('user-name').textContent = s.user.name || 'Würthle player';
    document.getElementById('user-email').textContent = 'Customer ' + s.user.customerNumber;

    document.getElementById('balance-val').textContent = s.balance + ' pts';
    document.getElementById('streak-val').textContent = s.stats.streak;
    document.getElementById('points-val').textContent = s.pointsForToday + ' pts';
    document.getElementById('puzzle-no').textContent = 'Puzzle #' + s.today.puzzleNo;
    document.getElementById('datelabel').textContent = new Date(s.today.date + 'T00:00:00').toLocaleDateString('en-GB', {weekday:'long', day:'numeric', month:'long'});

    document.getElementById('acc-balance').textContent = s.balance + ' pts';
    document.getElementById('acc-played').textContent = s.stats.played;
    document.getElementById('acc-won').textContent = s.stats.wins;
    document.getElementById('acc-streak').textContent = s.stats.streak;
    document.getElementById('acc-max').textContent = s.stats.maxStreak;

    const toggle = document.getElementById('optin-toggle');
    toggle.classList.toggle('on', !!s.leaderboardOptIn);
    toggle.setAttribute('aria-checked', s.leaderboardOptIn ? 'true' : 'false');

    if (s.mustChangePassword && !pwModal.classList.contains('show')) openPasswordModal(true);

    renderActivity(s.activity);

    buildBoard();
    buildKeyboard();
    Object.keys(keyStates).forEach(function(k) { delete keyStates[k]; });
    Object.values(keyEls).forEach(function(el) { el.style.background = ''; el.style.color = ''; });

    currentRow = 0; currentCol = 0;
    s.today.attempts.forEach(function(att, i) {
      for (let j = 0; j < 5; j++) {
        paintTile(tiles[i][j], att.guess[j], att.result[j]);
      }
    });
    currentRow = s.today.attempts.length;

    if (gameOver) {
      const last = s.today.attempts[s.today.attempts.length - 1];
      const won = s.today.won;
      if (won && last) {
        const attempts = s.today.attempts.length;
        showEndPanel(true, attempts, findLastPointsEarned(s.activity), s.balance);
      } else {
        showEndPanel(false, MAX_ATTEMPTS, 0, s.balance);
      }
    } else {
      document.getElementById('endpanel').style.display = 'none';
    }
  }

  function findLastPointsEarned(activity) {
    if (!activity || !activity.length) return 0;
    const recent = activity.find(function(a) { return a.amount > 0 && /solved/.test(a.label); });
    return recent ? recent.amount : 0;
  }

  function renderActivity(activity) {
    const el = document.getElementById('activity-list');
    if (!activity || !activity.length) {
      el.innerHTML = '<div class="empty-note">No activity yet — play today\\'s puzzle to start earning.</div>';
      return;
    }
    el.innerHTML = activity.slice(0, 6).map(function(a) {
      const dateStr = new Date(a.created_at + (a.created_at.endsWith('Z') ? '' : 'Z')).toLocaleDateString('en-GB', {day:'numeric', month:'short'});
      return '<div class="activity-row">' +
        '<div><div class="activity-label">' + escapeHtml(a.label) + '</div><div class="activity-date">' + dateStr + '</div></div>' +
        '<div class="activity-amt ' + (a.amount > 0 ? 'plus' : 'minus') + '">' + (a.amount > 0 ? '+' : '') + a.amount + ' pts</div>' +
      '</div>';
    }).join('');
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function(c) {
      return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
    });
  }

  // ─── Leaderboard ──────────────────────────────────────────────────
  async function loadLeaderboard() {
    const container = document.getElementById('lb-content');
    container.innerHTML = '<div class="lb-empty"><div class="lb-empty-title">Loading…</div></div>';
    try {
      const data = await api('/leaderboard');
      renderLeaderboard(data);
    } catch (err) {
      container.innerHTML = '<div class="lb-empty"><div class="lb-empty-title">Could not load leaderboard</div><div class="lb-empty-sub">' + escapeHtml(err.message) + '</div></div>';
    }
  }

  function renderLeaderboard(data) {
    const container = document.getElementById('lb-content');
    const myPts = state && state.campaign ? state.campaign.points : 0;
    document.getElementById('lb-my-points').textContent = myPts;
    document.getElementById('lb-total').textContent = data.totalPlayers || 0;

    // Hero: my rank
    const meInTop = data.top.find(function(r) { return r.isMe; });
    const meRank = meInTop ? meInTop.rank : (data.me ? data.me.rank : null);
    document.getElementById('lb-my-rank').textContent = meRank ? '#' + meRank : '—';

    // Opt-in prompt
    const promptEl = document.getElementById('lb-optin-prompt');
    const needsOptIn = state && !state.leaderboardOptIn && myPts > 0;
    promptEl.style.display = needsOptIn ? 'flex' : 'none';

    if (!data.top.length) {
      container.innerHTML =
        '<div class="lb-empty">' +
          '<div class="lb-empty-title">The race begins 1 November</div>' +
          '<div class="lb-empty-sub">Points earned during November 2026 count toward the leaderboard. Keep playing daily to build your streak.</div>' +
        '</div>';
      return;
    }

    let html = '<div class="lb-list">';
    data.top.forEach(function(r) {
      const topClass = r.rank <= 3 ? ' top-' + r.rank : '';
      const meClass = r.isMe ? ' is-me' : '';
      const nameClass = r.optedIn ? 'lb-name' : 'lb-name anon';
      html += '<div class="lb-row' + topClass + meClass + '">' +
        '<div class="lb-rank">' + r.rank + '</div>' +
        '<div class="' + nameClass + '">' + escapeHtml(r.displayName) +
          (r.isMe ? '<span class="lb-me-chip">You</span>' : '') +
        '</div>' +
        '<div class="lb-points">' + r.points + '<span class="lb-points-sub"> pts</span></div>' +
      '</div>';
    });
    html += '</div>';
    if (data.top.length >= 50) {
      html += '<div class="lb-cutoff" style="margin-top: 10px; border-radius: var(--radius-sm);">— Draw cutoff —</div>';
    }

    if (data.me) {
      html += '<div class="lb-pinned">' +
        '<div class="lb-pinned-label">Your position</div>' +
        '<div class="lb-row is-me">' +
          '<div class="lb-rank">#' + data.me.rank + '</div>' +
          '<div class="lb-name">' + escapeHtml(data.me.displayName) + '<span class="lb-me-chip">You</span></div>' +
          '<div class="lb-points">' + data.me.points + '<span class="lb-points-sub"> pts</span></div>' +
        '</div>' +
      '</div>';
    }

    container.innerHTML = html;
  }

  // Opt-in toggle (Account tab + leaderboard prompt)
  async function setOptIn(optIn) {
    try {
      const data = await api('/opt-in', 'POST', { optIn: !!optIn });
      if (state) state.leaderboardOptIn = data.leaderboardOptIn;
      const toggle = document.getElementById('optin-toggle');
      toggle.classList.toggle('on', data.leaderboardOptIn);
      toggle.setAttribute('aria-checked', data.leaderboardOptIn ? 'true' : 'false');
      toast(data.leaderboardOptIn ? 'You\\'re on the leaderboard' : 'Removed from leaderboard', 1800);
      await loadLeaderboard();
    } catch (err) {
      toast(err.message || 'Could not update');
    }
  }

  document.getElementById('optin-toggle').addEventListener('click', function() {
    const next = !this.classList.contains('on');
    setOptIn(next);
  });
  document.getElementById('optin-toggle').addEventListener('keydown', function(e) {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); this.click(); }
  });
  document.getElementById('lb-optin-cta').addEventListener('click', function() { setOptIn(true); });

  // ─── Tabs ─────────────────────────────────────────────────────────
  document.querySelectorAll('.tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
      document.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      document.getElementById('tab-' + tab).classList.add('active');
      if (tab === 'leaderboard') loadLeaderboard();
    });
  });
  document.getElementById('gotoleaderboardbtn').addEventListener('click', function() {
    document.querySelector('[data-tab="leaderboard"]').click();
  });

  // ─── Overlays ─────────────────────────────────────────────────────
  const dimmer = document.getElementById('dimmer');
  const helpModal = document.getElementById('helpmodal');
  const statsModal = document.getElementById('statsmodal');
  const pwModal = document.getElementById('pwmodal');
  const panels = [helpModal, statsModal, pwModal];
  let pwForced = false;
  function openOverlay(panel) { panels.forEach(function(p) { p.classList.remove('show'); }); panel.classList.add('show'); dimmer.classList.add('show'); }
  function closeOverlay() {
    if (pwForced && pwModal.classList.contains('show')) return;
    panels.forEach(function(p) { p.classList.remove('show'); });
    dimmer.classList.remove('show');
  }

  function openPasswordModal(forced) {
    pwForced = !!forced;
    document.getElementById('pw-title').textContent = forced ? 'Choose a new password' : 'Change password';
    document.getElementById('pw-intro').textContent = forced ? 'You signed in with a temporary password. Choose your own to keep playing.' : '';
    document.getElementById('pw-current').style.display = forced ? 'none' : '';
    document.getElementById('closepwbtn').style.display = forced ? 'none' : '';
    ['pw-current', 'pw-new', 'pw-new2'].forEach(function(id) { document.getElementById(id).value = ''; });
    document.getElementById('pw-error').textContent = '';
    openOverlay(pwModal);
    document.getElementById(forced ? 'pw-new' : 'pw-current').focus();
  }
  document.getElementById('change-pw-btn').addEventListener('click', function() { openPasswordModal(false); });
  document.getElementById('closepwbtn').addEventListener('click', closeOverlay);

  document.getElementById('pw-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const current = document.getElementById('pw-current').value;
    const next = document.getElementById('pw-new').value;
    const next2 = document.getElementById('pw-new2').value;
    const errEl = document.getElementById('pw-error');
    const btn = document.getElementById('pw-submit');
    errEl.textContent = '';
    if (!pwForced && !current) { errEl.textContent = 'Enter your current password.'; return; }
    if (next.length < 8) { errEl.textContent = 'Password must be at least 8 characters.'; return; }
    if (next !== next2) { errEl.textContent = 'Passwords don\\'t match.'; return; }
    btn.disabled = true; btn.textContent = 'Saving…';
    try {
      await api('/change-password', 'POST', { currentPassword: current, newPassword: next });
      pwForced = false;
      if (state) state.mustChangePassword = false;
      closeOverlay();
      ['pw-current', 'pw-new', 'pw-new2'].forEach(function(id) { document.getElementById(id).value = ''; });
      toast('Password updated', 1800);
    } catch (err) {
      errEl.textContent = err.message;
    } finally {
      btn.disabled = false; btn.textContent = 'Save new password';
    }
  });
  document.getElementById('helpbtn').addEventListener('click', function() { openOverlay(helpModal); });
  document.getElementById('closehelpbtn').addEventListener('click', closeOverlay);
  document.getElementById('statsbtn').addEventListener('click', function() { renderStats(); openOverlay(statsModal); });
  document.getElementById('closestatsbtn').addEventListener('click', closeOverlay);
  dimmer.addEventListener('click', closeOverlay);

  function renderStats() {
    if (!state) return;
    const s = state.stats;
    document.getElementById('s-played').textContent = s.played;
    document.getElementById('s-winpct').textContent = s.played ? Math.round(s.wins / s.played * 100) : 0;
    document.getElementById('s-streak').textContent = s.streak;
    document.getElementById('s-max').textContent = s.maxStreak;
    const dist = document.getElementById('distribution');
    dist.innerHTML = '';
    const max = Math.max(1, Math.max.apply(null, s.distribution));
    const latestAttempts = state.today.won ? state.today.attempts.length : null;
    s.distribution.forEach(function(n, i) {
      const row = document.createElement('div'); row.className = 'dist-row';
      const isLatest = latestAttempts === i + 1;
      row.innerHTML = '<div class="dist-idx">' + (i+1) + '</div><div class="dist-bar' + (isLatest ? ' highlight' : '') + '" style="width: ' + Math.max(8, n / max * 100) + '%;">' + n + '</div>';
      dist.appendChild(row);
    });
  }

  // ─── Share ────────────────────────────────────────────────────────
  document.getElementById('sharebtn').addEventListener('click', async function() {
    if (!state || !state.today.gameOver) return;
    const emoji = { correct: '🟩', present: '🟦', absent: '🟥' };
    const lines = state.today.attempts.map(function(a) {
      return a.result.map(function(s) { return emoji[s]; }).join('');
    }).join('\\n');
    const won = state.today.won;
    const text = 'Würthle #' + state.today.puzzleNo + ' ' + (won ? state.today.attempts.length + '/' + MAX_ATTEMPTS : 'X/' + MAX_ATTEMPTS) + '\\n\\n' + lines + '\\n\\nPlay daily at wurth.co.uk/wurthle';
    try {
      if (navigator.share) { await navigator.share({ text: text }); }
      else { await navigator.clipboard.writeText(text); toast('Copied to clipboard'); }
    } catch (e) { toast('Could not share'); }
  });

  // ─── Keyboard input ───────────────────────────────────────────────
  document.addEventListener('keydown', function(e) {
    if (!document.getElementById('tab-game').classList.contains('active')) return;
    if (!document.getElementById('app-shell').classList.contains('show')) return;
    if (e.target && e.target.closest && e.target.closest('input, textarea')) return;
    if (pwModal.classList.contains('show')) return;
    if (e.key === 'Escape') closeOverlay();
    else if (e.key === 'Enter') handleKey('ENTER');
    else if (e.key === 'Backspace') handleKey('BACK');
    else if (/^[a-zA-Z]$/.test(e.key) && e.key.length === 1) handleKey(e.key.toUpperCase());
  });

  // ─── Boot ─────────────────────────────────────────────────────────
  async function loadState() {
    const data = await api('/state');
    applyState(data);
  }

  async function boot() {
    showApp();
    buildBoard();
    buildKeyboard();
    try {
      await loadState();
    } catch (err) {
      if (err.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        token = null;
        showLogin();
      } else {
        toast('Could not load: ' + err.message, 2500);
      }
    }
  }

  if (token) boot();
  else showLogin();
})();
</script>

</body>
</html>`;
}

module.exports = { getWurthleHTML };
