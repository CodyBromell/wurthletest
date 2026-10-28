const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { query } = require("./db");
const { generateToken, verifyToken } = require("./tokens");

const router = express.Router();

// ─── POST /api/orders/delivered ─────────────────────────────────────
// Called when an order is delivered. Creates a review token and returns it.
// In production, this triggers the SalesManago workflow.
router.post("/orders/delivered", async (req, res) => {
  try {
    const { orderId, customerEmail, customerName, products } = req.body;

    if (!orderId || !customerEmail || !products || !products.length) {
      return res.status(400).json({ error: "orderId, customerEmail, and products[] are required" });
    }

    // Upsert products
    for (const p of products) {
      await query(
        `INSERT INTO products (id, name, sku, image_url, category) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (id) DO NOTHING`,
        [p.id, p.name, p.sku || null, p.imageUrl || null, p.category || null]
      );
    }

    // Create (or replace) order record
    await query(
      `INSERT INTO orders (id, customer_email, customer_name, order_date, delivered_date, status)
       VALUES (?, ?, ?, NOW(), NOW(), 'delivered')
       ON CONFLICT (id) DO UPDATE SET
         customer_email = EXCLUDED.customer_email,
         customer_name  = EXCLUDED.customer_name,
         delivered_date = NOW(),
         status         = 'delivered'`,
      [orderId, customerEmail, customerName || null]
    );

    // Create order items
    for (const p of products) {
      await query(
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
    await query(
      `INSERT INTO review_tokens (token, order_id, customer_email, expires_at) VALUES (?, ?, ?, ?)`,
      [token, orderId, customerEmail, expiresAt]
    );

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
router.get("/review/validate", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: "Token is required" });

    const result = verifyToken(token);
    if (!result.valid) return res.status(401).json({ error: result.error });

    const { orderId, customerEmail, customerName, products } = result.data;

    const existingReviews = await query(
      `SELECT product_id FROM reviews WHERE order_id = ? AND customer_email = ?`,
      [orderId, customerEmail]
    );
    const reviewedProductIds = new Set(existingReviews.map((r) => r.product_id));

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
router.post("/reviews", async (req, res) => {
  try {
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

      const existing = await query(
        `SELECT id FROM reviews WHERE product_id = ? AND order_id = ? AND customer_email = ?`,
        [review.productId, orderId, customerEmail]
      );
      if (existing.length > 0) continue;

      await query(
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

    await query(`UPDATE review_tokens SET used = 1 WHERE token = ?`, [token]);

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
router.get("/reviews/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const offset = (page - 1) * limit;

    const [countRow] = await query(
      `SELECT COUNT(*)::int AS total FROM reviews WHERE product_id = ? AND status = 'approved'`,
      [productId]
    );
    const total = countRow ? countRow.total : 0;

    const [statsRow] = await query(
      `SELECT
        AVG(rating)::float AS avg_rating,
        COUNT(*)::int AS total_reviews,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END)::int AS five_star,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END)::int AS four_star,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END)::int AS three_star,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END)::int AS two_star,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END)::int AS one_star
       FROM reviews WHERE product_id = ? AND status = 'approved'`,
      [productId]
    );

    let stats = { avgRating: 0, totalReviews: 0, distribution: {} };
    if (statsRow && statsRow.total_reviews > 0) {
      stats = {
        avgRating: Math.round(statsRow.avg_rating * 10) / 10,
        totalReviews: statsRow.total_reviews,
        distribution: {
          5: statsRow.five_star,
          4: statsRow.four_star,
          3: statsRow.three_star,
          2: statsRow.two_star,
          1: statsRow.one_star,
        },
      };
    }

    const reviewRows = await query(
      `SELECT customer_name, rating, title, comment, created_at
       FROM reviews
       WHERE product_id = ? AND status = 'approved'
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [productId, limit, offset]
    );

    const reviewsList = reviewRows.map((r) => {
      let name = r.customer_name;
      if (name) {
        const parts = name.split(" ");
        name = parts[0] + (parts[1] ? ` ${parts[1][0]}.` : "");
      } else {
        name = "Verified Buyer";
      }
      return { ...r, customer_name: name };
    });

    res.json({ stats, reviews: reviewsList, page, limit, total });
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/admin/reviews ─────────────────────────────────────────
router.get("/admin/reviews", async (req, res) => {
  try {
    const status = req.query.status || "pending";
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    const reviews = await query(
      `SELECT r.*, p.name AS product_name, p.sku AS product_sku
       FROM reviews r
       LEFT JOIN products p ON r.product_id = p.id
       WHERE r.status = ?
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [status, limit, offset]
    );

    res.json({ reviews, status, limit, offset });
  } catch (err) {
    console.error("Error fetching admin reviews:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── PATCH /api/admin/reviews/:id ───────────────────────────────────
router.patch("/admin/reviews/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Status must be 'approved' or 'rejected'" });
    }
    await query(`UPDATE reviews SET status = ? WHERE id = ?`, [status, parseInt(id)]);
    res.json({ success: true, message: `Review ${id} ${status}` });
  } catch (err) {
    console.error("Error updating review:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
