// Würthle game page — served at /wurthle
// All state lives on the server; this client just renders.

function getWurthleHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Würthle — Daily word game</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    background: #F5F5F5;
    color: #000;
    -webkit-font-smoothing: antialiased;
  }
  .wurthle-wrap {
    max-width: 540px;
    margin: 0 auto;
    padding: 16px;
    position: relative;
    background: #fff;
    min-height: 100vh;
  }
  .wurthle-board { display: grid; grid-template-rows: repeat(6, 1fr); gap: 5px; margin: 0 auto 16px; justify-content: center; }
  .wurthle-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 5px; }
  .wurthle-tile {
    width: 56px; height: 56px; border: 2px solid #DEDEDE; border-radius: 3px;
    display: flex; align-items: center; justify-content: center;
    font-size: 28px; font-weight: 700; text-transform: uppercase;
    background: transparent; color: #000; transition: transform 0.1s;
  }
  .wurthle-tile.filled { border-color: #605D5C; animation: pop 0.1s ease-in-out; }
  .wurthle-tile.flipping { animation: flip 0.6s ease forwards; }
  .wurthle-row.shake { animation: shake 0.5s; }
  .wurthle-row.bounce .wurthle-tile { animation: bounce 1s ease forwards; }
  @keyframes pop { 0% { transform: scale(0.9); } 100% { transform: scale(1); } }
  @keyframes flip {
    0% { transform: rotateX(0); }
    45% { transform: rotateX(-90deg); background: transparent; color: #000; border-color: #605D5C; }
    55% { transform: rotateX(-90deg); }
    100% { transform: rotateX(0); }
  }
  @keyframes shake {
    10%, 90% { transform: translateX(-1px); }
    20%, 80% { transform: translateX(2px); }
    30%, 50%, 70% { transform: translateX(-4px); }
    40%, 60% { transform: translateX(4px); }
  }
  @keyframes bounce {
    0%, 20% { transform: translateY(0); }
    40% { transform: translateY(-25px); }
    50% { transform: translateY(5px); }
    60% { transform: translateY(-15px); }
    80% { transform: translateY(2px); }
    100% { transform: translateY(0); }
  }
  .wurthle-key {
    height: 52px; border: none; border-radius: 4px;
    background: #DEDEDE; color: #000;
    font-weight: 700; font-size: 13px; cursor: pointer;
    text-transform: uppercase; padding: 0;
    font-family: inherit;
  }
  .wurthle-key:hover { opacity: 0.85; }
  .wurthle-key.wide { font-size: 11px; }
  .wurthle-toast {
    position: fixed; left: 50%; top: 80px; transform: translateX(-50%);
    background: #000; color: #fff; padding: 10px 16px; border-radius: 4px;
    font-size: 13px; font-weight: 500; opacity: 0; pointer-events: none;
    transition: opacity 0.2s; white-space: nowrap; z-index: 100;
  }
  .wurthle-toast.show { opacity: 1; }
  .icon-btn {
    width: 34px; height: 34px; border-radius: 50%; border: 1px solid #DEDEDE;
    background: #fff; color: #000; cursor: pointer; font-size: 15px;
    display: flex; align-items: center; justify-content: center;
    font-family: inherit; font-weight: 500;
  }
  .icon-btn:hover { background: #DEDEDE; }
  .tab-btn {
    flex: 1; padding: 10px 8px;
    background: transparent; border: none;
    border-bottom: 2px solid transparent;
    font-size: 13px; font-weight: 500; color: #605D5C;
    cursor: pointer; font-family: inherit;
  }
  .tab-btn.active { color: #000; border-bottom-color: #CC0000; }
  .tab-btn:hover { color: #000; }
  .tab-panel { display: none; }
  .tab-panel.active { display: block; }
  .reward-card {
    background: #fff; border: 1px solid #DEDEDE; border-radius: 8px;
    padding: 14px; display: flex; gap: 12px; align-items: center;
  }
  .reward-icon {
    width: 48px; height: 48px; background: #CC0000; color: #fff;
    border-radius: 8px; display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; font-weight: 700; font-size: 14px;
  }
  .example-tile {
    display: inline-flex; align-items: center; justify-content: center;
    width: 30px; height: 30px; border-radius: 3px;
    font-weight: 700; font-size: 16px; text-transform: uppercase;
    margin-right: 3px;
  }
  .overlay-dim {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.45);
    z-index: 90; display: none;
  }
  .overlay-dim.show { display: block; }
  .overlay-panel {
    position: fixed; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 92%; max-width: 420px; max-height: 88vh;
    background: #fff; border-radius: 8px;
    z-index: 95; display: none; overflow: hidden;
    box-shadow: 0 4px 24px rgba(0,0,0,0.2);
    flex-direction: column;
  }
  .overlay-panel.show { display: flex; }
  .overlay-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 14px 18px; border-bottom: 1px solid #DEDEDE; flex-shrink: 0;
  }
  .overlay-body { padding: 16px 18px 20px; overflow-y: auto; }
  .overlay-close {
    background: none; border: none; cursor: pointer;
    font-size: 24px; color: #605D5C; line-height: 1;
    width: 28px; height: 28px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 50%;
  }
  .overlay-close:hover { background: #DEDEDE; }

  /* Login screen */
  .login-screen {
    display: none; flex-direction: column; align-items: center;
    padding: 50px 24px;
  }
  .login-screen.show { display: flex; }
  .login-logo {
    width: 64px; height: 64px; background: #CC0000; color: #fff;
    border-radius: 12px; display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 26px; margin-bottom: 18px;
  }
  .login-title { font-size: 22px; font-weight: 700; margin-bottom: 6px; text-align: center; }
  .login-sub { font-size: 13px; color: #605D5C; margin-bottom: 22px; text-align: center; line-height: 1.5; max-width: 320px; }
  .login-form { display: flex; flex-direction: column; gap: 10px; width: 100%; max-width: 320px; }
  .login-form input {
    padding: 12px 14px; border: 1px solid #DEDEDE; border-radius: 6px;
    font-size: 14px; font-family: inherit; outline: none;
  }
  .login-form input:focus { border-color: #CC0000; }
  .login-form button {
    padding: 12px; background: #CC0000; color: #fff; border: none; border-radius: 6px;
    font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit;
    text-transform: uppercase; letter-spacing: 0.5px;
  }
  .login-form button:hover { background: #a30000; }
  .login-form button:disabled { background: #DEDEDE; color: #959595; cursor: not-allowed; }
  .login-error { color: #CC0000; font-size: 12px; margin-top: 4px; min-height: 16px; }

  .app-shell { display: none; }
  .app-shell.show { display: block; }
  .logout-link {
    background: none; border: none; color: #605D5C; cursor: pointer;
    font-size: 11px; text-decoration: underline; font-family: inherit;
  }
</style>
</head>
<body>

<div class="wurthle-wrap">

  <!-- Login screen -->
  <div id="login-screen" class="login-screen">
    <div class="login-logo">W</div>
    <div class="login-title">Würthle</div>
    <div class="login-sub">Sign in with your Würth account email to play today's puzzle and start collecting loyalty points.</div>
    <form class="login-form" id="login-form" onsubmit="return false;">
      <input type="text" id="login-name" placeholder="Your name (optional)" autocomplete="name" />
      <input type="email" id="login-email" placeholder="email@example.com" required autocomplete="email" />
      <button type="submit" id="login-btn">Sign in &amp; play</button>
      <div class="login-error" id="login-error"></div>
    </form>
  </div>

  <!-- Main app shell -->
  <div class="app-shell" id="app-shell">

    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #DEDEDE; border-radius: 8px; margin-bottom: 14px;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <div id="user-avatar" style="width: 36px; height: 36px; border-radius: 50%; background: #CC0000; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px;">?</div>
        <div>
          <div style="font-size: 13px; font-weight: 500;" id="user-name">—</div>
          <div style="font-size: 11px; color: #605D5C;" id="user-email">—</div>
          <button class="logout-link" id="logout-btn">Sign out</button>
        </div>
      </div>
      <div style="background: #fff; border-radius: 6px; padding: 6px 12px; text-align: right;">
        <div style="font-size: 10px; color: #605D5C; text-transform: uppercase; letter-spacing: 0.5px;">Balance</div>
        <div style="font-size: 16px; font-weight: 700; color: #CC0000;" id="balance-val">0 pts</div>
      </div>
    </div>

    <div style="display: flex; border-bottom: 1px solid #DEDEDE; margin-bottom: 16px;">
      <button class="tab-btn active" data-tab="game">Today's puzzle</button>
      <button class="tab-btn" data-tab="account">My account</button>
      <button class="tab-btn" data-tab="rewards">Loyalty store</button>
    </div>

    <div id="toast" class="wurthle-toast"></div>

    <div class="tab-panel active" id="tab-game">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; padding: 0 4px 12px; border-bottom: 2px solid #CC0000; margin-bottom: 14px;">
        <button id="helpbtn" class="icon-btn" title="How to play" aria-label="How to play">?</button>
        <div style="text-align: center; flex: 1;">
          <svg width="48" height="48" viewBox="0 0 100 100" style="display: block; margin: 0 auto 6px;" role="img" aria-label="Würth"><rect x="0" y="0" width="100" height="50" fill="#CC0000"/><rect x="0" y="50" width="100" height="50" fill="#000"/><path d="M 50 18 L 38 50 L 50 50 L 62 50 Z" fill="#FFF"/><text x="50" y="82" font-family="Arial" font-size="22" font-weight="700" fill="#FFF" text-anchor="middle" letter-spacing="2">WÜRTH</text></svg>
          <div style="font-size: 24px; font-weight: 700; line-height: 1;">W&uuml;rthle</div>
          <div style="font-size: 11px; color: #605D5C; margin-top: 4px;" id="datelabel">Daily word</div>
        </div>
        <button id="statsbtn" class="icon-btn" title="Statistics" aria-label="Statistics">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="20" x2="6" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="18" y1="20" x2="18" y2="14"/></svg>
        </button>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; padding: 0 4px 12px;">
        <div style="display: flex; gap: 8px;">
          <div style="background: #DEDEDE; border-radius: 4px; padding: 5px 9px; text-align: center; min-width: 48px;">
            <div style="font-size: 9px; color: #605D5C; text-transform: uppercase;">Streak</div>
            <div style="font-size: 15px; font-weight: 700;" id="streak-val">0</div>
          </div>
          <div style="background: #605D5C; border-radius: 4px; padding: 5px 9px; text-align: center; min-width: 48px;">
            <div style="font-size: 9px; color: #fff; text-transform: uppercase;">Today</div>
            <div style="font-size: 15px; font-weight: 700; color: #fff;" id="points-val">3 pts</div>
          </div>
        </div>
        <div style="font-size: 11px; color: #959595;" id="puzzle-no"></div>
      </div>

      <div id="board" class="wurthle-board"></div>
      <div id="keyboard" style="display: flex; flex-direction: column; gap: 5px;"></div>

      <div id="endpanel" style="display: none; margin-top: 16px; padding: 14px; background: #DEDEDE; border-left: 4px solid #CC0000; border-radius: 4px;">
        <div id="endstatus" style="font-size: 15px; font-weight: 700; margin-bottom: 4px;"></div>
        <div id="endpoints" style="font-size: 12px; color: #605D5C; margin-bottom: 12px;"></div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button id="sharebtn" class="wurthle-key" style="height: 36px; padding: 0 16px; background: #CC0000; color: #fff; font-size: 12px;">Share result</button>
          <button id="gotorewardsbtn" class="wurthle-key" style="height: 36px; padding: 0 16px; background: #fff; border: 1px solid #605D5C; font-size: 12px;">View rewards →</button>
        </div>
      </div>
    </div>

    <div class="tab-panel" id="tab-account">
      <div style="background: #fff; border: 1px solid #DEDEDE; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
        <div style="font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; color: #605D5C; margin-bottom: 8px;">Loyalty balance</div>
        <div style="font-size: 32px; font-weight: 700; color: #CC0000; line-height: 1;" id="acc-balance">0 points</div>
        <div style="font-size: 12px; color: #605D5C; margin-top: 6px;" id="acc-progress">100 pts away from your next £10 voucher</div>
        <div style="background: #DEDEDE; height: 6px; border-radius: 3px; margin-top: 10px; overflow: hidden;">
          <div id="progress-bar" style="background: #CC0000; height: 100%; width: 0%; transition: width 0.4s;"></div>
        </div>
      </div>
      <div style="background: #fff; border: 1px solid #DEDEDE; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
        <div style="font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; color: #605D5C; margin-bottom: 12px;">W&uuml;rthle stats</div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
          <div><div style="font-size: 20px; font-weight: 700;" id="acc-played">0</div><div style="font-size: 10px; color: #605D5C;">Played</div></div>
          <div><div style="font-size: 20px; font-weight: 700;" id="acc-won">0</div><div style="font-size: 10px; color: #605D5C;">Won</div></div>
          <div><div style="font-size: 20px; font-weight: 700;" id="acc-streak">0</div><div style="font-size: 10px; color: #605D5C;">Streak</div></div>
          <div><div style="font-size: 20px; font-weight: 700;" id="acc-max">0</div><div style="font-size: 10px; color: #605D5C;">Best</div></div>
        </div>
      </div>
      <div style="background: #fff; border: 1px solid #DEDEDE; border-radius: 8px; padding: 16px;">
        <div style="font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; color: #605D5C; margin-bottom: 10px;">Recent activity</div>
        <div id="activity-list" style="font-size: 13px;">
          <div style="color: #605D5C; font-style: italic; padding: 8px 0;">No activity yet — play today's puzzle to start earning.</div>
        </div>
      </div>
    </div>

    <div class="tab-panel" id="tab-rewards">
      <div style="font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; color: #605D5C; margin-bottom: 10px;">Available rewards</div>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <div class="reward-card">
          <div class="reward-icon">£10</div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 14px; font-weight: 500; margin-bottom: 2px;">£10 discount voucher</div>
            <div style="font-size: 12px; color: #605D5C; margin-bottom: 6px;">Valid on orders over £50 · expires 90 days</div>
            <div style="font-size: 12px; font-weight: 700; color: #CC0000;">100 points</div>
          </div>
          <button class="wurthle-key redeem-btn" data-reward="10" data-cost="100" style="height: 38px; padding: 0 14px; background: #CC0000; color: #fff; font-size: 12px; min-width: 90px;">Redeem</button>
        </div>
        <div class="reward-card">
          <div class="reward-icon">£25</div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 14px; font-weight: 500; margin-bottom: 2px;">£25 discount voucher</div>
            <div style="font-size: 12px; color: #605D5C; margin-bottom: 6px;">Valid on orders over £100 · expires 90 days</div>
            <div style="font-size: 12px; font-weight: 700; color: #CC0000;">240 points</div>
          </div>
          <button class="wurthle-key redeem-btn" data-reward="25" data-cost="240" style="height: 38px; padding: 0 14px; background: #CC0000; color: #fff; font-size: 12px; min-width: 90px;">Redeem</button>
        </div>
        <div class="reward-card">
          <div class="reward-icon">£50</div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 14px; font-weight: 500; margin-bottom: 2px;">£50 discount voucher</div>
            <div style="font-size: 12px; color: #605D5C; margin-bottom: 6px;">Valid on orders over £200 · expires 90 days</div>
            <div style="font-size: 12px; font-weight: 700; color: #CC0000;">450 points</div>
          </div>
          <button class="wurthle-key redeem-btn" data-reward="50" data-cost="450" style="height: 38px; padding: 0 14px; background: #CC0000; color: #fff; font-size: 12px; min-width: 90px;">Redeem</button>
        </div>
      </div>
      <div style="margin-top: 20px;">
        <div style="font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; color: #605D5C; margin-bottom: 10px;">Your vouchers</div>
        <div id="voucher-list" style="font-size: 13px;">
          <div style="color: #605D5C; font-style: italic; padding: 8px 0;">No vouchers yet — redeem points to claim one.</div>
        </div>
      </div>
    </div>

    <div style="text-align: center; margin-top: 30px; padding-top: 16px; border-top: 1px solid #DEDEDE; font-size: 11px; color: #959595;">
      Würthle prototype · server-backed loyalty
    </div>

  </div>

</div>

<div id="dimmer" class="overlay-dim"></div>

<div id="helpmodal" class="overlay-panel">
  <div class="overlay-header"><div style="font-size: 16px; font-weight: 700;">How to play</div><button class="overlay-close" id="closehelpbtn" aria-label="Close">×</button></div>
  <div class="overlay-body">
    <div style="font-size: 13px; margin-bottom: 10px;">Guess the W&uuml;rthle in 6 tries.</div>
    <div style="font-size: 11px; font-weight: 500; text-transform: uppercase; margin-bottom: 8px;">Examples</div>
    <div style="margin-bottom: 10px;"><div style="margin-bottom: 4px;"><span class="example-tile" style="background: #B9C900;">D</span><span class="example-tile" style="border: 2px solid #605D5C;">R</span><span class="example-tile" style="border: 2px solid #605D5C;">I</span><span class="example-tile" style="border: 2px solid #605D5C;">L</span><span class="example-tile" style="border: 2px solid #605D5C;">L</span></div><div style="font-size: 12px;"><strong>D</strong> is in the correct spot.</div></div>
    <div style="margin-bottom: 10px;"><div style="margin-bottom: 4px;"><span class="example-tile" style="border: 2px solid #605D5C;">B</span><span class="example-tile" style="background: #009EE0; color: #fff;">R</span><span class="example-tile" style="border: 2px solid #605D5C;">A</span><span class="example-tile" style="border: 2px solid #605D5C;">C</span><span class="example-tile" style="border: 2px solid #605D5C;">E</span></div><div style="font-size: 12px;"><strong>R</strong> is in the word, wrong spot.</div></div>
    <div style="margin-bottom: 14px;"><div style="margin-bottom: 4px;"><span class="example-tile" style="border: 2px solid #605D5C;">G</span><span class="example-tile" style="border: 2px solid #605D5C;">A</span><span class="example-tile" style="background: #CC0000; color: #fff;">U</span><span class="example-tile" style="border: 2px solid #605D5C;">G</span><span class="example-tile" style="border: 2px solid #605D5C;">E</span></div><div style="font-size: 12px;"><strong>U</strong> is not in the word.</div></div>
    <div style="border-top: 1px solid #DEDEDE; padding-top: 12px;">
      <div style="font-size: 11px; font-weight: 500; text-transform: uppercase; margin-bottom: 8px;">Earn loyalty points</div>
      <table style="width: 100%; font-size: 12px;"><tr><td style="padding: 3px 0; color: #605D5C;">Daily solve</td><td style="text-align: right; font-weight: 700;">3 pts</td></tr><tr><td style="padding: 3px 0; color: #605D5C;">7-day streak</td><td style="text-align: right; font-weight: 700;">4 pts</td></tr><tr><td style="padding: 3px 0; color: #605D5C;">14-day streak</td><td style="text-align: right; font-weight: 700;">5 pts</td></tr><tr><td style="padding: 3px 0; color: #605D5C;">21-day streak</td><td style="text-align: right; font-weight: 700;">6 pts</td></tr></table>
    </div>
  </div>
</div>

<div id="statsmodal" class="overlay-panel">
  <div class="overlay-header"><div style="font-size: 16px; font-weight: 700;">Statistics</div><button class="overlay-close" id="closestatsbtn" aria-label="Close">×</button></div>
  <div class="overlay-body">
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px;">
      <div style="text-align: center;"><div style="font-size: 22px; font-weight: 700;" id="s-played">0</div><div style="font-size: 10px; color: #605D5C;">Played</div></div>
      <div style="text-align: center;"><div style="font-size: 22px; font-weight: 700;" id="s-winpct">0</div><div style="font-size: 10px; color: #605D5C;">Win %</div></div>
      <div style="text-align: center;"><div style="font-size: 22px; font-weight: 700;" id="s-streak">0</div><div style="font-size: 10px; color: #605D5C;">Current</div></div>
      <div style="text-align: center;"><div style="font-size: 22px; font-weight: 700;" id="s-max">0</div><div style="font-size: 10px; color: #605D5C;">Max</div></div>
    </div>
    <div style="font-size: 11px; font-weight: 500; text-transform: uppercase; margin-bottom: 8px;">Guess distribution</div>
    <div id="distribution" style="display: flex; flex-direction: column; gap: 3px;"></div>
  </div>
</div>

<script>
(function() {
  const API = window.location.origin + "/api/wurthle";
  const COLOURS = {
    correct: { bg: '#B9C900', fg: '#000' },
    present: { bg: '#009EE0', fg: '#fff' },
    absent:  { bg: '#CC0000', fg: '#fff' }
  };
  const TOKEN_KEY = 'wurthle_jwt';

  let token = localStorage.getItem(TOKEN_KEY);
  let state = null;             // server state snapshot
  let tiles = [], rows = [];
  let currentRow = 0, currentCol = 0;
  let gameOver = false;
  let submitting = false;
  let answer = null;            // only set after game ends

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

  document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const name = document.getElementById('login-name').value.trim();
    const btn = document.getElementById('login-btn');
    const errEl = document.getElementById('login-error');
    errEl.textContent = '';
    if (!email) { errEl.textContent = 'Email required'; return; }
    btn.disabled = true; btn.textContent = 'Signing in...';
    try {
      const data = await api('/login', 'POST', { email: email, name: name });
      token = data.token;
      localStorage.setItem(TOKEN_KEY, token);
      await boot();
    } catch (err) {
      errEl.textContent = err.message;
      btn.disabled = false; btn.textContent = 'Sign in & play';
    }
  });

  document.getElementById('logout-btn').addEventListener('click', function() {
    localStorage.removeItem(TOKEN_KEY);
    token = null;
    showLogin();
  });

  // ─── Board / keyboard ────────────────────────────────────────────
  function buildBoard() {
    const board = document.getElementById('board');
    board.innerHTML = '';
    tiles = []; rows = [];
    for (let r = 0; r < 6; r++) {
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
      const rowEl = document.createElement('div'); rowEl.style.cssText = 'display: flex; gap: 5px; justify-content: center;';
      row.forEach(function(k) {
        const btn = document.createElement('button'); btn.className = 'wurthle-key';
        if (k === 'ENTER' || k === 'BACK') { btn.classList.add('wide'); btn.style.flex = '1.5'; btn.textContent = k === 'ENTER' ? 'Enter' : '⌫'; }
        else { btn.style.flex = '1'; btn.textContent = k; keyEls[k] = btn; }
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
    dur = dur || 1500;
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
        // refresh full state so stats/balance/activity reflect server
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
      const labels = ['Genius!','Magnificent!','Impressive!','Splendid!','Great!','Phew!'];
      document.getElementById('endstatus').textContent = labels[attempts - 1] || 'Solved!';
      document.getElementById('endpoints').innerHTML = 'Solved in ' + attempts + '/6 · <strong style="color:#CC0000">+' + pointsEarned + ' pts</strong> · Balance: ' + balance + ' pts';
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

    // header
    const initials = (s.user.name || s.user.email).split(/\\s+/).map(function(p) { return p[0]; }).join('').slice(0,2).toUpperCase();
    document.getElementById('user-avatar').textContent = initials || '?';
    document.getElementById('user-name').textContent = s.user.name || s.user.email;
    document.getElementById('user-email').textContent = 'Account · ' + s.user.email;

    // header balance + game tab badges
    document.getElementById('balance-val').textContent = s.balance + ' pts';
    document.getElementById('streak-val').textContent = s.stats.streak;
    document.getElementById('points-val').textContent = s.pointsForToday + ' pts';
    document.getElementById('puzzle-no').textContent = 'Puzzle #' + s.today.puzzleNo;
    document.getElementById('datelabel').textContent = new Date(s.today.date + 'T00:00:00').toLocaleDateString('en-GB', {weekday:'long', day:'numeric', month:'long'});

    // account tab
    document.getElementById('acc-balance').textContent = s.balance + ' points';
    const toNext = Math.max(0, 100 - s.balance);
    document.getElementById('acc-progress').textContent = toNext > 0
      ? toNext + ' pts away from your next £10 voucher'
      : 'You can redeem a £10 voucher now';
    document.getElementById('progress-bar').style.width = Math.min(100, s.balance) + '%';
    document.getElementById('acc-played').textContent = s.stats.played;
    document.getElementById('acc-won').textContent = s.stats.wins;
    document.getElementById('acc-streak').textContent = s.stats.streak;
    document.getElementById('acc-max').textContent = s.stats.maxStreak;

    renderActivity(s.activity);
    renderVouchers(s.vouchers);
    updateRedeemButtons();

    // Replay today's attempts onto the board
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
        showEndPanel(true, attempts, /* pointsEarned shown only via fresh guess */ findLastPointsEarned(s.activity), s.balance);
      } else {
        showEndPanel(false, 6, 0, s.balance);
      }
    } else {
      document.getElementById('endpanel').style.display = 'none';
    }
  }

  function findLastPointsEarned(activity) {
    // best-effort: when reloading after a finished game, show points from latest "solved" entry
    if (!activity || !activity.length) return 0;
    const recent = activity.find(function(a) { return a.amount > 0 && /solved/.test(a.label); });
    return recent ? recent.amount : 0;
  }

  function renderActivity(activity) {
    const el = document.getElementById('activity-list');
    if (!activity || !activity.length) {
      el.innerHTML = '<div style="color: #605D5C; font-style: italic; padding: 8px 0;">No activity yet — play today\\'s puzzle to start earning.</div>';
      return;
    }
    el.innerHTML = activity.slice(0, 6).map(function(a) {
      const dateStr = new Date(a.created_at + (a.created_at.endsWith('Z') ? '' : 'Z')).toLocaleDateString('en-GB', {day:'numeric', month:'short'});
      return '<div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #F0F0F0;">' +
        '<div><div>' + escapeHtml(a.label) + '</div><div style="font-size: 11px; color: #605D5C;">' + dateStr + '</div></div>' +
        '<div style="font-weight: 700; color: ' + (a.amount > 0 ? '#000' : '#CC0000') + ';">' + (a.amount > 0 ? '+' : '') + a.amount + ' pts</div>' +
      '</div>';
    }).join('');
  }

  function renderVouchers(vouchers) {
    const el = document.getElementById('voucher-list');
    if (!vouchers || !vouchers.length) {
      el.innerHTML = '<div style="color: #605D5C; font-style: italic; padding: 8px 0;">No vouchers yet — redeem points to claim one.</div>';
      return;
    }
    el.innerHTML = vouchers.map(function(v) {
      const exp = new Date(v.expires_at).toLocaleDateString('en-GB', {day:'numeric', month:'short', year:'numeric'});
      return '<div style="background: #fff; border: 1px solid #DEDEDE; border-radius: 6px; padding: 10px 12px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">' +
        '<div><div style="font-weight: 700;">£' + v.value + ' voucher</div><div style="font-size: 11px; color: #605D5C;">Code: ' + escapeHtml(v.code) + ' · expires ' + exp + '</div></div>' +
        '<div style="font-size: 11px; color: #1D9E75; font-weight: 700;">ACTIVE</div>' +
      '</div>';
    }).join('');
  }

  function updateRedeemButtons() {
    const bal = state ? state.balance : 0;
    document.querySelectorAll('.redeem-btn').forEach(function(btn) {
      const cost = parseInt(btn.dataset.cost);
      if (bal < cost) { btn.disabled = true; btn.style.background = '#DEDEDE'; btn.style.color = '#605D5C'; btn.style.cursor = 'not-allowed'; btn.textContent = 'Need ' + (cost - bal) + ' more'; }
      else { btn.disabled = false; btn.style.background = '#CC0000'; btn.style.color = '#fff'; btn.style.cursor = 'pointer'; btn.textContent = 'Redeem'; }
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function(c) {
      return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
    });
  }

  // ─── Redeem ───────────────────────────────────────────────────────
  document.querySelectorAll('.redeem-btn').forEach(function(btn) {
    btn.addEventListener('click', async function() {
      if (btn.disabled) return;
      const value = parseInt(btn.dataset.reward);
      try {
        const data = await api('/redeem', 'POST', { value: value });
        toast('£' + value + ' voucher claimed — ' + data.voucher.code, 3000);
        await loadState();
      } catch (err) {
        toast(err.message || 'Could not redeem');
      }
    });
  });

  // ─── Tabs ─────────────────────────────────────────────────────────
  document.querySelectorAll('.tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
      document.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
  });
  document.getElementById('gotorewardsbtn').addEventListener('click', function() {
    document.querySelector('[data-tab="rewards"]').click();
  });

  // ─── Overlays ─────────────────────────────────────────────────────
  const dimmer = document.getElementById('dimmer');
  const helpModal = document.getElementById('helpmodal');
  const statsModal = document.getElementById('statsmodal');
  function openOverlay(panel) { helpModal.classList.remove('show'); statsModal.classList.remove('show'); panel.classList.add('show'); dimmer.classList.add('show'); }
  function closeOverlay() { helpModal.classList.remove('show'); statsModal.classList.remove('show'); dimmer.classList.remove('show'); }
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
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display: flex; align-items: center; gap: 8px; font-size: 12px;';
      const isLatest = latestAttempts === i + 1;
      wrap.innerHTML = '<div style="width: 12px;">' + (i+1) + '</div><div style="flex: 1; background: ' + (isLatest ? '#B9C900' : '#959595') + '; color: ' + (isLatest ? '#000' : '#fff') + '; padding: 2px 8px; border-radius: 2px; min-width: 24px; text-align: right; font-weight: 700; width: ' + Math.max(8, n / max * 100) + '%;">' + n + '</div>';
      dist.appendChild(wrap);
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
    const text = 'Würthle #' + state.today.puzzleNo + ' ' + (won ? state.today.attempts.length + '/6' : 'X/6') + '\\n\\n' + lines + '\\n\\nPlay daily at wurth.co.uk/wurthle';
    try {
      if (navigator.share) { await navigator.share({ text: text }); }
      else { await navigator.clipboard.writeText(text); toast('Copied to clipboard'); }
    } catch (e) { toast('Could not share'); }
  });

  // ─── Keyboard input ───────────────────────────────────────────────
  document.addEventListener('keydown', function(e) {
    if (!document.getElementById('tab-game').classList.contains('active')) return;
    if (!document.getElementById('app-shell').classList.contains('show')) return;
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
