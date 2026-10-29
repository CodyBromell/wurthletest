// Shared look for the Würthle pages (game, terms, admin).

const FONT_PRELOADS = `<link rel="preload" href="/fonts/wuerth-book.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/wuerth-extrabold-cond.woff2" as="font" type="font/woff2" crossorigin>`;

const BASE_CSS = `
  @font-face {
    font-family: 'Wuerth Book';
    src: url('/fonts/wuerth-book.woff2') format('woff2');
    font-weight: 400; font-style: normal; font-display: swap;
  }
  @font-face {
    font-family: 'Wuerth Extra Bold Cond';
    src: url('/fonts/wuerth-extrabold-cond.woff2') format('woff2');
    font-weight: 800; font-style: normal; font-display: swap;
  }

  :root {
    --font-body: 'Wuerth Book', Arial, Helvetica, sans-serif;
    --font-head: 'Wuerth Extra Bold Cond', 'Arial Narrow', Arial, sans-serif;
    --wurth-red:    #CC0000;
    --wurth-red-dk: #A30000;
    --ink:          #121212;
    --ink-2:        #2C2C2A;
    --muted:        #6B6B67;
    --muted-2:      #9A9994;
    --line:         #ECEAE4;
    --line-2:       #E0DDD6;
    --surface:      #FFFFFF;
    --bg:           #F7F6F2;
    --bg-chip:      #F0EEE8;
    --tile-correct: #B9C900;
    --tile-correct-ink: #121212;
    --tile-present: #009EE0;
    --tile-present-ink: #FFFFFF;
    --tile-absent:  #CC0000;
    --tile-absent-ink: #FFFFFF;
    --success:      #1D7A4B;
    --shadow-sm:    0 1px 2px rgba(16, 16, 14, 0.04), 0 1px 3px rgba(16, 16, 14, 0.03);
    --shadow-md:    0 4px 14px rgba(16, 16, 14, 0.06), 0 1px 3px rgba(16, 16, 14, 0.04);
    --shadow-lg:    0 10px 40px rgba(16, 16, 14, 0.14);
    --radius-sm:    6px;
    --radius:       10px;
    --radius-lg:    14px;
    --ease:         cubic-bezier(0.22, 0.61, 0.36, 1);
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  html, body {
    font-family: var(--font-body);
    background: var(--bg);
    color: var(--ink);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    font-synthesis: none;
  }

  button, input, textarea { font-family: inherit; }
`;

module.exports = { FONT_PRELOADS, BASE_CSS };
