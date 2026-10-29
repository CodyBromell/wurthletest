// Shared Express app. Used by:
//   - api/index.js (Vercel serverless function)
//   - server.js    (local .listen() entry point)

const path = require("path");
const express = require("express");
const cors = require("cors");
const { initDb } = require("./db");
const routes = require("./routes");
const wurthle = require("./wurthle");
const wurthleAdmin = require("./wurthle-admin");
const { getWurthleHTML } = require("./wurthle-page");
const { getTermsHTML } = require("./wurthle-terms-page");
const { getAdminHTML } = require("./wurthle-admin-page");
const { getReviewFormHTML, getWidgetDemoHTML } = require("./review-pages");

const app = express();
app.use(cors());
app.use(express.json());

// Vercel serves public/ from its CDN; this covers local runs.
app.use(express.static(path.join(__dirname, "public"), { maxAge: "30d" }));

// Lazy schema init on first request. On Vercel this runs once per cold start.
let readyPromise = null;
app.use(async (req, res, next) => {
  if (!readyPromise) {
    readyPromise = initDb().catch((err) => {
      readyPromise = null;
      throw err;
    });
  }
  try {
    await readyPromise;
    next();
  } catch (err) {
    console.error("DB init failed:", err);
    res.status(500).json({ error: "Database unavailable", detail: err.message });
  }
});

// ─── API routes ─────────────────────────────────────────────────────
app.use("/api", routes);
app.use("/api/wurthle/admin", wurthleAdmin);
app.use("/api/wurthle", wurthle);

// ─── Pages ──────────────────────────────────────────────────────────
app.get("/review", (req, res) => res.send(getReviewFormHTML()));
app.get("/widget-demo", (req, res) => res.send(getWidgetDemoHTML()));
app.get("/wurthle", (req, res) => res.send(getWurthleHTML()));
app.get("/wurthle/terms", (req, res) => res.send(getTermsHTML()));
app.get("/wurthle/admin", (req, res) => {
  res.set("X-Robots-Tag", "noindex, nofollow");
  res.send(getAdminHTML());
});
app.get("/healthz", (req, res) => res.json({ ok: true }));
app.get("/", (req, res) => res.redirect("/wurthle"));

module.exports = app;
