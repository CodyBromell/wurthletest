// ─── Review Form HTML ───────────────────────────────────────────────
function getReviewFormHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Review Your Order | Würth</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap" rel="stylesheet">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }

:root {
  --wurth-red: #CC0000;
  --wurth-dark: #1a1a1a;
  --wurth-gray: #f4f4f2;
  --wurth-border: #e0dfdb;
  --wurth-text: #2c2c2a;
  --wurth-muted: #6b6b67;
  --star-filled: #d4890a;
  --star-empty: #d1d0cc;
  --success: #1d7a4b;
  --radius: 10px;
}

body {
  font-family: 'DM Sans', system-ui, sans-serif;
  background: var(--wurth-gray);
  color: var(--wurth-text);
  min-height: 100vh;
}

/* ── Header ── */
.header {
  background: var(--wurth-dark);
  padding: 16px 24px;
  display: flex;
  align-items: center;
  gap: 14px;
}
.header-logo {
  font-size: 22px;
  font-weight: 600;
  color: #fff;
  letter-spacing: -0.5px;
}
.header-logo span { color: var(--wurth-red); }
.header-sub {
  font-size: 13px;
  color: #999;
  border-left: 1px solid #444;
  padding-left: 14px;
}

/* ── Container ── */
.container {
  max-width: 680px;
  margin: 0 auto;
  padding: 32px 20px 60px;
}

/* ── States ── */
.state { display: none; }
.state.active { display: block; }

/* ── Loading ── */
.loading-state {
  text-align: center;
  padding: 80px 20px;
}
.spinner {
  width: 36px; height: 36px;
  border: 3px solid var(--wurth-border);
  border-top-color: var(--wurth-red);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  margin: 0 auto 16px;
}
@keyframes spin { to { transform: rotate(360deg); } }
.loading-text { color: var(--wurth-muted); font-size: 15px; }

/* ── Error ── */
.error-state {
  text-align: center;
  padding: 80px 20px;
}
.error-icon {
  width: 56px; height: 56px;
  background: #fce8e8;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  font-size: 24px;
  color: var(--wurth-red);
}
.error-title { font-size: 18px; font-weight: 500; margin-bottom: 8px; }
.error-msg { color: var(--wurth-muted); font-size: 14px; line-height: 1.5; }

/* ── Intro ── */
.intro {
  margin-bottom: 28px;
}
.intro h1 {
  font-size: 24px;
  font-weight: 600;
  letter-spacing: -0.5px;
  margin-bottom: 6px;
}
.intro p {
  font-size: 15px;
  color: var(--wurth-muted);
  line-height: 1.5;
}
.order-badge {
  display: inline-block;
  background: #fff;
  border: 1px solid var(--wurth-border);
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 500;
  color: var(--wurth-muted);
  margin-top: 10px;
}

/* ── Product review card ── */
.review-card {
  background: #fff;
  border: 1px solid var(--wurth-border);
  border-radius: var(--radius);
  margin-bottom: 16px;
  overflow: hidden;
  transition: border-color 0.2s;
}
.review-card.completed {
  border-color: var(--success);
}
.card-product {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border-bottom: 1px solid var(--wurth-border);
}
.card-product img {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  object-fit: cover;
  background: var(--wurth-gray);
}
.product-info h3 {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.3;
}
.product-info .sku {
  font-size: 12px;
  color: var(--wurth-muted);
  margin-top: 2px;
}
.already-reviewed {
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--success);
  font-weight: 500;
}

/* ── Star rating ── */
.rating-section {
  padding: 16px 18px;
}
.rating-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--wurth-muted);
  margin-bottom: 8px;
}
.stars {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
}
.star {
  cursor: pointer;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: transform 0.15s, background 0.15s;
  background: transparent;
}
.star:hover { transform: scale(1.15); background: #fdf6ec; }
.star svg { width: 28px; height: 28px; }
.star .star-path { fill: var(--star-empty); transition: fill 0.15s; }
.star.active .star-path { fill: var(--star-filled); }

/* ── Text inputs ── */
.input-group { margin-bottom: 12px; }
.input-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--wurth-muted);
  margin-bottom: 5px;
}
.input-group input,
.input-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--wurth-border);
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  color: var(--wurth-text);
  background: var(--wurth-gray);
  transition: border-color 0.2s;
  outline: none;
}
.input-group input:focus,
.input-group textarea:focus {
  border-color: var(--wurth-red);
  background: #fff;
}
.input-group textarea { resize: vertical; min-height: 80px; }
.optional { font-weight: 400; color: #aaa; }

/* ── Submit ── */
.submit-section {
  margin-top: 24px;
}
.btn-submit {
  width: 100%;
  padding: 14px;
  background: var(--wurth-red);
  color: #fff;
  border: none;
  border-radius: var(--radius);
  font-family: inherit;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}
.btn-submit:hover { background: #a30000; }
.btn-submit:active { transform: scale(0.98); }
.btn-submit:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}
.submit-note {
  text-align: center;
  font-size: 12px;
  color: var(--wurth-muted);
  margin-top: 10px;
}

/* ── Success state ── */
.success-state {
  text-align: center;
  padding: 60px 20px;
}
.success-icon {
  width: 64px;
  height: 64px;
  background: #e8f5ee;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}
.success-icon svg { width: 32px; height: 32px; color: var(--success); }
.success-title {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 8px;
}
.success-msg {
  font-size: 15px;
  color: var(--wurth-muted);
  line-height: 1.5;
  max-width: 400px;
  margin: 0 auto;
}
</style>
</head>
<body>

<div class="header">
  <div class="header-logo">W<span>ü</span>rth</div>
  <div class="header-sub">Product review</div>
</div>

<div class="container">
  <!-- Loading -->
  <div id="loading-state" class="state active">
    <div class="loading-state">
      <div class="spinner"></div>
      <div class="loading-text">Loading your order details...</div>
    </div>
  </div>

  <!-- Error -->
  <div id="error-state" class="state">
    <div class="error-state">
      <div class="error-icon">!</div>
      <div class="error-title">Something went wrong</div>
      <div class="error-msg" id="error-message"></div>
    </div>
  </div>

  <!-- Review form -->
  <div id="form-state" class="state">
    <div class="intro">
      <h1>How was your order?</h1>
      <p>Thanks for confirming delivery. We'd love to hear what you think about the products you received.</p>
      <div class="order-badge" id="order-id-badge"></div>
    </div>

    <div id="product-cards"></div>

    <div class="submit-section">
      <button class="btn-submit" id="submit-btn" disabled onclick="submitReviews()">
        Submit reviews
      </button>
      <div class="submit-note">Your review will be published after a quick check</div>
    </div>
  </div>

  <!-- Success -->
  <div id="success-state" class="state">
    <div class="success-state">
      <div class="success-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
      </div>
      <div class="success-title">Thank you!</div>
      <div class="success-msg" id="success-message">Your reviews have been submitted. They'll appear on the product pages once approved.</div>
    </div>
  </div>
</div>

<script>
const API = window.location.origin + "/api";
const params = new URLSearchParams(window.location.search);
const token = params.get("token");

let orderData = null;
let reviewsData = {};

const starSVG = '<svg viewBox="0 0 24 24"><path class="star-path" d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>';

function showState(id) {
  document.querySelectorAll(".state").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

async function init() {
  if (!token) {
    showError("No review token provided. Please use the link from your email.");
    return;
  }

  try {
    const res = await fetch(API + "/review/validate?token=" + encodeURIComponent(token));
    const data = await res.json();

    if (!res.ok || !data.valid) {
      showError(data.error || "This review link is no longer valid.");
      return;
    }

    orderData = data;
    renderForm(data);
  } catch (err) {
    showError("Could not connect to the review service. Please try again later.");
  }
}

function showError(msg) {
  document.getElementById("error-message").textContent = msg;
  showState("error-state");
}

function renderForm(data) {
  document.getElementById("order-id-badge").textContent = "Order " + data.orderId;

  const container = document.getElementById("product-cards");
  container.innerHTML = "";

  data.products.forEach((product, idx) => {
    if (product.alreadyReviewed) {
      container.innerHTML += renderAlreadyReviewed(product);
    } else {
      container.innerHTML += renderReviewCard(product, idx);
    }
  });

  showState("form-state");
  updateSubmitButton();
}

function renderAlreadyReviewed(product) {
  return '<div class="review-card completed">' +
    '<div class="card-product">' +
      '<img src="' + (product.imageUrl || 'https://placehold.co/56x56/f4f4f2/999?text=?') + '" alt="' + product.name + '">' +
      '<div class="product-info"><h3>' + product.name + '</h3></div>' +
    '</div>' +
    '<div class="already-reviewed">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>' +
      'Already reviewed' +
    '</div>' +
  '</div>';
}

function renderReviewCard(product, idx) {
  let starsHtml = '<div class="stars" id="stars-' + idx + '">';
  for (let i = 1; i <= 5; i++) {
    starsHtml += '<div class="star" data-idx="' + idx + '" data-rating="' + i + '" onclick="setRating(' + idx + ',' + i + ')">' + starSVG + '</div>';
  }
  starsHtml += '</div>';

  return '<div class="review-card" id="card-' + idx + '" data-product-id="' + product.id + '">' +
    '<div class="card-product">' +
      '<img src="' + (product.imageUrl || 'https://placehold.co/56x56/f4f4f2/999?text=?') + '" alt="' + product.name + '">' +
      '<div class="product-info"><h3>' + product.name + '</h3></div>' +
    '</div>' +
    '<div class="rating-section">' +
      '<div class="rating-label">Your rating</div>' +
      starsHtml +
      '<div class="input-group">' +
        '<label>Review title <span class="optional">(optional)</span></label>' +
        '<input type="text" placeholder="Summarise your experience" id="title-' + idx + '" maxlength="100">' +
      '</div>' +
      '<div class="input-group">' +
        '<label>Your review <span class="optional">(optional)</span></label>' +
        '<textarea placeholder="What did you think of this product?" id="comment-' + idx + '" maxlength="1000"></textarea>' +
      '</div>' +
    '</div>' +
  '</div>';
}

function setRating(idx, rating) {
  const productId = document.getElementById("card-" + idx).dataset.productId;
  reviewsData[idx] = { productId, rating };

  const stars = document.querySelectorAll('#stars-' + idx + ' .star');
  stars.forEach(star => {
    const r = parseInt(star.dataset.rating);
    star.classList.toggle("active", r <= rating);
  });

  updateSubmitButton();
}

function updateSubmitButton() {
  const hasAnyRating = Object.keys(reviewsData).length > 0;
  document.getElementById("submit-btn").disabled = !hasAnyRating;
  const count = Object.keys(reviewsData).length;
  document.getElementById("submit-btn").textContent = 
    count === 0 ? "Submit reviews" :
    count === 1 ? "Submit 1 review" :
    "Submit " + count + " reviews";
}

async function submitReviews() {
  const btn = document.getElementById("submit-btn");
  btn.disabled = true;
  btn.textContent = "Submitting...";

  const reviews = Object.entries(reviewsData).map(([idx, data]) => ({
    productId: data.productId,
    rating: data.rating,
    title: document.getElementById("title-" + idx)?.value?.trim() || null,
    comment: document.getElementById("comment-" + idx)?.value?.trim() || null,
  }));

  try {
    const res = await fetch(API + "/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, reviews }),
    });

    const data = await res.json();

    if (data.success) {
      document.getElementById("success-message").textContent = 
        data.submitted + " review" + (data.submitted !== 1 ? "s" : "") + 
        " submitted successfully. They'll appear on the product pages once approved.";
      showState("success-state");
    } else {
      btn.disabled = false;
      btn.textContent = "Submit reviews";
      alert(data.error || "Something went wrong. Please try again.");
    }
  } catch (err) {
    btn.disabled = false;
    btn.textContent = "Submit reviews";
    alert("Connection error. Please check your internet and try again.");
  }
}

init();
</script>
</body>
</html>`;
}

// ─── Widget Demo HTML ───────────────────────────────────────────────
function getWidgetDemoHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Product Page — Widget Demo | Würth</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'DM Sans', system-ui, sans-serif;
  background: #f4f4f2;
  color: #2c2c2a;
}
.page-header {
  background: #1a1a1a;
  padding: 16px 24px;
  display: flex; align-items: center; gap: 14px;
}
.page-header .logo { font-size: 22px; font-weight: 600; color: #fff; }
.page-header .logo span { color: #CC0000; }
.page-header .nav { font-size: 13px; color: #999; border-left: 1px solid #444; padding-left: 14px; }

.product-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 32px 20px 60px;
}
.product-hero {
  background: #fff;
  border: 1px solid #e0dfdb;
  border-radius: 10px;
  padding: 28px;
  margin-bottom: 24px;
  display: flex;
  gap: 24px;
  align-items: flex-start;
}
.product-hero img {
  width: 160px; height: 160px;
  border-radius: 8px;
  object-fit: cover;
  background: #f0f0ee;
}
.product-hero h1 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
}
.product-hero .price {
  font-size: 22px;
  font-weight: 600;
  color: #CC0000;
  margin-bottom: 12px;
}
.product-hero .desc {
  font-size: 14px;
  color: #6b6b67;
  line-height: 1.5;
}
.fake-section {
  background: #fff;
  border: 1px solid #e0dfdb;
  border-radius: 10px;
  padding: 24px 28px;
  margin-bottom: 24px;
}
.fake-section h2 {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 12px;
}
.fake-section p {
  font-size: 14px;
  color: #6b6b67;
  line-height: 1.6;
}

/* ── Review Widget Styles ── */
#review-widget { margin-bottom: 24px; }
.rw-container {
  background: #fff;
  border: 1px solid #e0dfdb;
  border-radius: 10px;
  overflow: hidden;
}
.rw-summary {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 24px 28px;
  border-bottom: 1px solid #e0dfdb;
}
.rw-big-number {
  font-size: 42px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: -1px;
}
.rw-stars-summary { display: flex; flex-direction: column; gap: 4px; }
.rw-stars-row { display: flex; gap: 2px; }
.rw-stars-row svg { width: 18px; height: 18px; }
.rw-review-count { font-size: 13px; color: #6b6b67; margin-top: 2px; }
.rw-distribution {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  max-width: 200px;
}
.rw-dist-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6b6b67;
}
.rw-dist-bar {
  flex: 1;
  height: 6px;
  background: #eeedea;
  border-radius: 3px;
  overflow: hidden;
}
.rw-dist-fill {
  height: 100%;
  background: #d4890a;
  border-radius: 3px;
  transition: width 0.4s ease;
}
.rw-review-list { padding: 0; }
.rw-review {
  padding: 18px 28px;
  border-bottom: 1px solid #f0efec;
}
.rw-review:last-child { border-bottom: none; }
.rw-review-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}
.rw-reviewer {
  font-size: 13px;
  font-weight: 500;
}
.rw-date {
  font-size: 12px;
  color: #aaa;
}
.rw-review-stars { display: flex; gap: 1px; margin-bottom: 6px; }
.rw-review-stars svg { width: 14px; height: 14px; }
.rw-review-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}
.rw-review-comment {
  font-size: 13px;
  color: #6b6b67;
  line-height: 1.5;
}
.rw-empty {
  padding: 40px 28px;
  text-align: center;
  font-size: 14px;
  color: #aaa;
}

@media (max-width: 600px) {
  .product-hero { flex-direction: column; }
  .product-hero img { width: 100%; height: 200px; }
  .rw-summary { flex-direction: column; align-items: flex-start; }
}
</style>
</head>
<body>

<div class="page-header">
  <div class="logo">W<span>ü</span>rth</div>
  <div class="nav">Product page (widget demo)</div>
</div>

<div class="product-page">
  <div class="product-hero">
    <img id="hero-img" src="https://placehold.co/160x160/f0f0ee/999?text=Product" alt="">
    <div>
      <h1 id="hero-name">Loading product...</h1>
      <div class="price">&pound;42.99</div>
      <div class="desc">This is a simulated product page showing how the review widget appears below the product details. The widget fetches live data from the Review API.</div>
    </div>
  </div>

  <div class="fake-section">
    <h2>Technical specifications</h2>
    <p>Material: High-grade steel / Certification: EN ISO 9001 / Weight: 1.2kg / Dimensions: Varies by variant</p>
  </div>

  <!-- THIS IS WHERE THE REVIEW WIDGET LOADS -->
  <div id="review-widget"></div>

  <div class="fake-section">
    <h2>Delivery information</h2>
    <p>Standard delivery 3-5 working days. Express delivery available for orders placed before 2pm. Free delivery on orders over &pound;50.</p>
  </div>
</div>

<script>
// ─── Review Widget (self-contained — this is what goes into GTM) ───
(function() {
  const PRODUCT_ID = new URLSearchParams(window.location.search).get("product") || "WTH-001";
  const API_BASE = window.location.origin + "/api";
  const container = document.getElementById("review-widget");

  // Update hero image
  const products = {
    "WTH-001": { name: "ASSY Plus VG Screw 4.0x40mm (200pc)", img: "https://placehold.co/160x160/1a1a2e/e0e0e0?text=ASSY+Screw" },
    "WTH-003": { name: "Sabrina Safety Glove Size 9", img: "https://placehold.co/160x160/1a1a2e/e0e0e0?text=Safety+Glove" },
    "WTH-004": { name: "LED Rechargeable Work Light 1200lm", img: "https://placehold.co/160x160/1a1a2e/e0e0e0?text=Work+Light" },
  };
  if (products[PRODUCT_ID]) {
    document.getElementById("hero-name").textContent = products[PRODUCT_ID].name;
    document.getElementById("hero-img").src = products[PRODUCT_ID].img;
  }

  function starSvg(filled) {
    return '<svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" fill="' + (filled ? '#d4890a' : '#e0dfdb') + '"/></svg>';
  }

  function starsHtml(rating, size) {
    let html = "";
    for (let i = 1; i <= 5; i++) html += starSvg(i <= rating);
    return html;
  }

  function relativeDate(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    const days = Math.floor((now - d) / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 30) return days + " days ago";
    if (days < 365) return Math.floor(days / 30) + " months ago";
    return Math.floor(days / 365) + " years ago";
  }

  async function loadReviews() {
    try {
      const res = await fetch(API_BASE + "/reviews/" + PRODUCT_ID);
      const data = await res.json();

      if (!data.stats.totalReviews) {
        container.innerHTML = '<div class="rw-container"><div class="rw-empty">No reviews yet for this product.</div></div>';
        return;
      }

      const s = data.stats;
      let distHtml = "";
      for (let i = 5; i >= 1; i--) {
        const pct = s.totalReviews > 0 ? Math.round((s.distribution[i] / s.totalReviews) * 100) : 0;
        distHtml += '<div class="rw-dist-row"><span>' + i + '</span><div class="rw-dist-bar"><div class="rw-dist-fill" style="width:' + pct + '%"></div></div></div>';
      }

      let reviewsHtml = "";
      data.reviews.forEach(function(r) {
        reviewsHtml += '<div class="rw-review">' +
          '<div class="rw-review-header"><span class="rw-reviewer">' + (r.customer_name || "Verified Buyer") + '</span><span class="rw-date">' + relativeDate(r.created_at) + '</span></div>' +
          '<div class="rw-review-stars">' + starsHtml(r.rating) + '</div>' +
          (r.title ? '<div class="rw-review-title">' + r.title + '</div>' : '') +
          (r.comment ? '<div class="rw-review-comment">' + r.comment + '</div>' : '') +
        '</div>';
      });

      container.innerHTML = '<div class="rw-container">' +
        '<div class="rw-summary">' +
          '<div class="rw-big-number">' + s.avgRating + '</div>' +
          '<div class="rw-stars-summary">' +
            '<div class="rw-stars-row">' + starsHtml(Math.round(s.avgRating)) + '</div>' +
            '<div class="rw-review-count">' + s.totalReviews + ' review' + (s.totalReviews !== 1 ? 's' : '') + '</div>' +
          '</div>' +
          '<div class="rw-distribution">' + distHtml + '</div>' +
        '</div>' +
        '<div class="rw-review-list">' + reviewsHtml + '</div>' +
      '</div>';
    } catch (err) {
      container.innerHTML = '<div class="rw-container"><div class="rw-empty">Could not load reviews.</div></div>';
    }
  }

  loadReviews();
})();
</script>
</body>
</html>`;
}

module.exports = { getReviewFormHTML, getWidgetDemoHTML };
