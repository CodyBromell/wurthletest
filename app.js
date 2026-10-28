// Shared Express app. Used by:
//   - api/index.js (Vercel serverless function)
//   - server.js    (local .listen() entry point)

const express = require("express");
const cors = require("cors");
const { initDb } = require("./db");
const routes = require("./routes");
const wurthle = require("./wurthle");
const { getWurthleHTML } = require("./wurthle-page");
const { getReviewFormHTML, getWidgetDemoHTML } = require("./review-pages");

const app = express();
app.use(cors());
app.use(express.json());

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
app.use("/api/wurthle", wurthle);

// ─── Pages ──────────────────────────────────────────────────────────
app.get("/review", (req, res) => res.send(getReviewFormHTML()));
app.get("/widget-demo", (req, res) => res.send(getWidgetDemoHTML()));
app.get("/wurthle", (req, res) => res.send(getWurthleHTML()));
app.get("/healthz", (req, res) => res.json({ ok: true }));
app.get("/", (req, res) => res.redirect("/wurthle"));

module.exports = app;
