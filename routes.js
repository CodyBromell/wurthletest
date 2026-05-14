const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { getDb, saveDb } = require("./db");
const { generateToken, verifyToken } = require("./tokens");

const router = express.Router();

// ─── POST /api/orders/delivered ─────────────────────────────────────
// Called when an order is delivered. Creates a review token and returns it.
// In production, this triggers the SalesManago workflow.
router.post("/orders/delivered", async (req, res) => {
  try {
    const db = await getDb();
    const { orderId, customerEmail, customerName, products } = req.body;

    if (!orderId || !customerEmail || !products || !products.length) {
      return res.status(400).json({ error: "orderId, customerEmail, and products[] are required" });
    }

    // Upsert products
    for (const p of products) {
      db.run(
        `INSERT OR IGNORE INTO products (id, name, sku, image_url, category) VALUES (?, ?, ?, ?, ?)`,
        [p.id, p.name, p.sku || null, p.imageUrl || null, p.category || null]
      );
    }

    // Create order record
    db.run(
      `INSERT OR REPLACE INTO orders (id, customer_email, customer_name, order_date, delivered_date, status) 
       VALUES (?, ?, ?, datetime('now'), datetime('now'), 'delivered')`,
      [orderId, customerEmail, customerName || null]
    );

    // Create order items
    for (const p of products) {
      db.run(
        `INSERT INTO order_items (order_id, product_id, quantity) VALUES (?, ?, ?)`,
        [orderId, p.id, p.quantity || 1]
      );
    }

    // Generate review token
    const token = generateToken({
      orderId,
      customerEmail,
      customerName,
      products: products.map((p) => ({ id: p.id, name: p.name, imageUrl: p.imageUrl })),
    });

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    db.run(
      `INSERT INTO review_tokens (token, order_id, customer_email, expires_at) VALUES (?, ?, ?, ?)`,
      [token, orderId, customerEmail, expiresAt]
    );

    saveDb();

    const reviewUrl = `${req.protocol}://${req.get("host")}/review?token=${token}`;

    res.json({
      success: true,
      token,
      reviewUrl,
      message: "Review token generated. Send this URL to the customer.",
    });
  } catch (err) {
    console.error("Error in /orders/delivered:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/review/validate?token=xxx ─────────────────────────────
// Validates a token and returns order/product info for the review form
router.get("/review/validate", async (req, res) => {
  try {
    const db = await getDb();
    const { token } = req.query;

    if (!token) return res.status(400).json({ error: "Token is required" });

    const result = verifyToken(token);
    if (!result.valid) return res.status(401).json({ error: result.error });

    // Check if token was already fully used
    const tokenRow = db.exec(
      `SELECT used FROM review_tokens WHERE token = ?`,
      [token]
    );

    const { orderId, customerEmail, customerName, products } = result.data;

    // Check which products already have reviews from this order
    const existingReviews = db.exec(
      `SELECT product_id FROM reviews WHERE order_id = ? AND customer_email = ?`,
      [orderId, customerEmail]
    );

    const reviewedProductIds = new Set();
    if (existingReviews.length > 0) {
      existingReviews[0].values.forEach((row) => reviewedProductIds.add(row[0]));
    }

    const productsWithStatus = products.map((p) => ({
      ...p,
      alreadyReviewed: reviewedProductIds.has(p.id),
    }));

    res.json({
      valid: true,
      orderId,
      customerEmail,
      customerName,
      products: productsWithStatus,
    });
  } catch (err) {
    console.error("Error validating token:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /api/reviews ─────────────────────────────────────────────
// Submit one or more reviews
router.post("/reviews", async (req, res) => {
  try {
    const db = await getDb();
    const { token, reviews } = req.body;

    if (!token || !reviews || !reviews.length) {
      return res.status(400).json({ error: "token and reviews[] are required" });
    }

    const result = verifyToken(token);
    if (!result.valid) return res.status(401).json({ error: result.error });

    const { orderId, customerEmail, customerName } = result.data;

    const submitted = [];

    for (const review of reviews) {
      if (!review.productId || !review.rating) continue;
      if (review.rating < 1 || review.rating > 5) continue;

      // Check for duplicate
      const existing = db.exec(
        `SELECT id FROM reviews WHERE product_id = ? AND order_id = ? AND customer_email = ?`,
        [review.productId, orderId, customerEmail]
      );

      if (existing.length > 0 && existing[0].values.length > 0) continue;

      db.run(
        `INSERT INTO reviews (product_id, order_id, customer_email, customer_name, rating, title, comment, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
          review.productId,
          orderId,
          customerEmail,
          customerName || null,
          review.rating,
          review.title || null,
          review.comment || null,
        ]
      );

      submitted.push(review.productId);
    }

    // Mark token as used
    db.run(`UPDATE review_tokens SET used = 1 WHERE token = ?`, [token]);
    saveDb();

    res.json({
      success: true,
      submitted: submitted.length,
      message: `${submitted.length} review(s) submitted successfully.`,
    });
  } catch (err) {
    console.error("Error submitting reviews:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/reviews/:productId ────────────────────────────────────
// Get approved reviews for a product (public endpoint for the widget)
router.get("/reviews/:productId", async (req, res) => {
  try {
    const db = await getDb();
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const offset = (page - 1) * limit;

    const countResult = db.exec(
      `SELECT COUNT(*) as total FROM reviews WHERE product_id = ? AND status = 'approved'`,
      [productId]
    );
    const total = countResult.length > 0 ? countResult[0].values[0][0] : 0;

    const statsResult = db.exec(
      `SELECT 
        AVG(rating) as avg_rating,
        COUNT(*) as total_reviews,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
      FROM reviews WHERE product_id = ? AND status = 'approved'`,
      [productId]
    );

    let stats = { avgRating: 0, totalReviews: 0, distribution: {} };
    if (statsResult.length > 0 && statsResult[0].values[0][0] !== null) {
      const row = statsResult[0].values[0];
      stats = {
        avgRating: Math.round(row[0] * 10) / 10,
        totalReviews: row[1],
        distribution: { 5: row[2], 4: row[3], 3: row[4], 2: row[5], 1: row[6] },
      };
    }

    const reviewsResult = db.exec(
      `SELECT customer_name, rating, title, comment, created_at 
       FROM reviews 
       WHERE product_id = ? AND status = 'approved' 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [productId, limit, offset]
    );

    const reviewsList = [];
    if (reviewsResult.length > 0) {
      const cols = reviewsResult[0].columns;
      reviewsResult[0].values.forEach((row) => {
        const obj = {};
        cols.forEach((col, i) => (obj[col] = row[i]));
        // Anonymize: show first name + last initial
        if (obj.customer_name) {
          const parts = obj.customer_name.split(" ");
          obj.customer_name = parts[0] + (parts[1] ? ` ${parts[1][0]}.` : "");
        } else {
          obj.customer_name = "Verified Buyer";
        }
        reviewsList.push(obj);
      });
    }

    res.json({ stats, reviews: reviewsList, page, limit, total });
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/admin/reviews ─────────────────────────────────────────
// Admin: list reviews with filters
router.get("/admin/reviews", async (req, res) => {
  try {
    const db = await getDb();
    const status = req.query.status || "pending";
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    const result = db.exec(
      `SELECT r.*, p.name as product_name, p.sku as product_sku
       FROM reviews r 
       LEFT JOIN products p ON r.product_id = p.id
       WHERE r.status = ?
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [status, limit, offset]
    );

    const reviews = [];
    if (result.length > 0) {
      const cols = result[0].columns;
      result[0].values.forEach((row) => {
        const obj = {};
        cols.forEach((col, i) => (obj[col] = row[i]));
        reviews.push(obj);
      });
    }

    res.json({ reviews, status, limit, offset });
  } catch (err) {
    console.error("Error fetching admin reviews:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── PATCH /api/admin/reviews/:id ───────────────────────────────────
// Admin: approve or reject a review
router.patch("/admin/reviews/:id", async (req, res) => {
  try {
    const db = await getDb();
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Status must be 'approved' or 'rejected'" });
    }

    db.run(`UPDATE reviews SET status = ? WHERE id = ?`, [status, parseInt(id)]);
    saveDb();

    res.json({ success: true, message: `Review ${id} ${status}` });
  } catch (err) {
    console.error("Error updating review:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
