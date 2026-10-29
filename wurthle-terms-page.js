// PLAY. SPEND. WIN. terms — served at /wurthle/terms

const { WURTH_LOGO_SRC } = require("./wurth-logo");
const { FONT_PRELOADS, BASE_CSS } = require("./wurthle-theme");

const CLAUSES = [
  ["Promoter", ["The promoter is Würth UK Ltd."]],
  ["Promotional period", [
    "The promotion runs from 00:00 on 1 November 2026 to 23:59 on 30 November 2026, UK time. Only points earned and qualifying purchases made during this period count.",
  ]],
  ["Eligibility and exclusions", [
    "The promotion is open to eligible Würth UK customers. Key Account Management (KAM) customers and customers whose contracts, agreements or company policies prohibit them from receiving free gifts or promotional prizes are excluded.",
  ]],
  ["How to qualify", [
    "Customers must play Würthle during November, opt in to the campaign leaderboard and spend at least £500 including VAT through the Würth UK eShop and/or app during the promotional period.",
    "The 50 highest point earners who meet the £500 spend requirement will qualify for the prize draw. Each qualifying customer receives one entry, regardless of additional spend or points.",
  ]],
  ["Qualifying spend", [
    "Purchases through the eShop and app may be combined to reach the £500 threshold, provided they are recorded against the same customer account. Cancelled orders and returned goods do not count towards qualifying spend. Delivery is free on the eShop and app.",
  ]],
  ["Leaderboard and consent", [
    "Customers must opt in and give consent for their name to appear on the campaign leaderboard. Final rankings will use Würthle points earned during November 2026 only.",
  ]],
  ["Prize", [
    "One winner will receive one 50-inch Xiaomi TV F 50 (2026), as pictured in the campaign materials. No cash alternative is available.",
  ]],
  ["Random prize draw", [
    "The draw will take place on Tuesday 1 December 2026, the first working day in December. Würth UK will select one winner at random from the qualifying entries using a verifiably random selection process. Entry into the draw does not guarantee a prize.",
  ]],
  ["Winner notification and delivery", [
    "Würth UK will notify the winner’s sales representative so they can share the news with the customer. Delivery will be arranged using the details associated with the winner’s customer account, and an electronic signature will be required to confirm receipt.",
  ]],
  ["Verification and fair participation", [
    "Würth UK will verify the winner’s eligibility, points and qualifying spend before awarding the prize. Fraudulent entries, manipulation of the game or false information may result in disqualification.",
  ]],
  ["Personal data", [
    "Würth UK will use personal data to administer the promotion, manage the leaderboard, verify eligibility, contact the winner and arrange prize delivery in accordance with its privacy notice. Customers’ names will appear on the leaderboard only with their consent.",
  ]],
  ["Acceptance", ["By opting in, customers agree to these terms and conditions."]],
];

function getTermsHTML() {
  const sections = CLAUSES.map(([title, paras], i) => `
    <section class="clause">
      <h2><span class="num">${i + 1}.</span> ${title}</h2>
      ${paras.map((p) => `<p>${p}</p>`).join("\n      ")}
    </section>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>PLAY. SPEND. WIN. — Terms &amp; Conditions | Würthle</title>
${FONT_PRELOADS}
<style>
${BASE_CSS}
  .wrap { max-width: 720px; margin: 0 auto; padding: 28px 20px 64px; }
  .top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; gap: 12px; }
  .top img { width: 150px; height: auto; display: block; }
  .back {
    font-size: 14px; color: var(--ink); text-decoration: none;
    padding: 9px 16px; border-radius: 100px; background: var(--surface); box-shadow: var(--shadow-sm);
  }
  .back:hover { background: var(--ink); color: #fff; }
  .hero {
    background: linear-gradient(135deg, #1a1a1a 0%, #2a1414 100%); color: #fff;
    border-radius: var(--radius-lg); padding: 28px 24px; margin-bottom: 22px; box-shadow: var(--shadow-md);
  }
  .eyebrow { font-family: var(--font-head); font-weight: 800; font-size: 13px; letter-spacing: 0.14em; color: #FF6060; text-transform: uppercase; }
  h1 { font-family: var(--font-head); font-weight: 800; font-size: 40px; line-height: 1.05; letter-spacing: 0.01em; margin-top: 6px; }
  .hero p { color: rgba(255,255,255,0.75); font-size: 15px; margin-top: 10px; line-height: 1.5; }
  .card { background: var(--surface); border-radius: var(--radius); box-shadow: var(--shadow-sm); padding: 8px 24px; }
  .clause { padding: 18px 0; border-bottom: 1px solid var(--line); }
  .clause:last-child { border-bottom: none; }
  h2 { font-family: var(--font-head); font-weight: 800; font-size: 21px; letter-spacing: 0.01em; margin-bottom: 8px; }
  h2 .num { color: var(--wurth-red); }
  .clause p { font-size: 15.5px; line-height: 1.6; color: var(--ink-2); }
  .clause p + p { margin-top: 10px; }
  .foot { text-align: center; font-size: 13px; color: var(--muted); margin-top: 24px; }
  @media (max-width: 520px) { h1 { font-size: 32px; } .card { padding: 4px 18px; } }
</style>
</head>
<body>
<div class="wrap">
  <div class="top">
    <img src="${WURTH_LOGO_SRC}" alt="Würth" />
    <a class="back" href="/wurthle">← Back to Würthle</a>
  </div>
  <div class="hero">
    <div class="eyebrow">Würthle · November 2026</div>
    <h1>PLAY. SPEND. WIN.</h1>
    <p>Terms &amp; Conditions for the Würthle November leaderboard and prize draw.</p>
  </div>
  <div class="card">${sections}
  </div>
  <div class="foot">Promoted by Würth UK Ltd.</div>
</div>
</body>
</html>`;
}

module.exports = { getTermsHTML };
