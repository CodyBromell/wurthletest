// Dev-only: seed sample review-system data. Needs DATABASE_URL set.
// `npm run seed`

const { query, initDb } = require("./db");
const { generateToken } = require("./tokens");

async function seed() {
  await initDb();

  // Clear existing data
  await query("DELETE FROM reviews");
  await query("DELETE FROM order_items");
  await query("DELETE FROM review_tokens");
  await query("DELETE FROM orders");
  await query("DELETE FROM products");

  const products = [
    { id: "WTH-001", name: "ASSY Plus VG Screw 4.0x40mm (200pc)", sku: "WTH-ASSY-4040", imageUrl: "https://placehold.co/300x300/1a1a2e/e0e0e0?text=ASSY+Screw", category: "Fasteners" },
    { id: "WTH-002", name: "ORSY System Case 8.4.1", sku: "WTH-ORSY-841", imageUrl: "https://placehold.co/300x300/1a1a2e/e0e0e0?text=ORSY+Case", category: "Storage" },
    { id: "WTH-003", name: "Sabrina Safety Glove Size 9", sku: "WTH-SAB-GL9", imageUrl: "https://placehold.co/300x300/1a1a2e/e0e0e0?text=Safety+Glove", category: "PPE" },
    { id: "WTH-004", name: "LED Rechargeable Work Light 1200lm", sku: "WTH-LED-1200", imageUrl: "https://placehold.co/300x300/1a1a2e/e0e0e0?text=Work+Light", category: "Lighting" },
    { id: "WTH-005", name: "Multi-Purpose Adhesive Sealant 310ml", sku: "WTH-MPA-310", imageUrl: "https://placehold.co/300x300/1a1a2e/e0e0e0?text=Sealant", category: "Chemicals" },
  ];

  for (const p of products) {
    await query(
      `INSERT INTO products (id, name, sku, image_url, category) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (id) DO NOTHING`,
      [p.id, p.name, p.sku, p.imageUrl, p.category]
    );
  }

  const orderId = "ORD-2026-00142";
  await query(
    `INSERT INTO orders (id, customer_email, customer_name, order_date, delivered_date, status)
     VALUES (?, ?, ?, NOW() - INTERVAL '10 days', NOW(), 'delivered')
     ON CONFLICT (id) DO UPDATE SET delivered_date = NOW()`,
    [orderId, "john.smith@example.com", "John Smith"]
  );

  const orderedProducts = [products[0], products[2], products[3]];
  for (const p of orderedProducts) {
    await query(`INSERT INTO order_items (order_id, product_id, quantity) VALUES (?, ?, 1)`, [orderId, p.id]);
  }

  const token = generateToken({
    orderId,
    customerEmail: "john.smith@example.com",
    customerName: "John Smith",
    products: orderedProducts.map((p) => ({ id: p.id, name: p.name, imageUrl: p.imageUrl })),
  });

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await query(
    `INSERT INTO review_tokens (token, order_id, customer_email, expires_at) VALUES (?, ?, ?, ?)`,
    [token, orderId, "john.smith@example.com", expiresAt]
  );

  const sampleReviews = [
    { productId: "WTH-001", email: "mike.t@example.com", name: "Mike Taylor", rating: 5, title: "Best screws I've used", comment: "Perfect for timber framing. Self-drilling tip saves so much time compared to standard screws. Will definitely reorder." },
    { productId: "WTH-001", email: "sarah.j@example.com", name: "Sarah Jenkins", rating: 4, title: "Great quality, slightly pricey", comment: "Excellent holding power and the ASSY thread design really works. Only downside is the cost vs standard screws, but you get what you pay for." },
    { productId: "WTH-001", email: "dave.w@example.com", name: "Dave Wilson", rating: 5, title: "Industry standard for a reason", comment: "Been using these on all our joinery projects. Consistent quality, never had one snap. The 200pc box is good value for trade use." },
    { productId: "WTH-003", email: "lisa.k@example.com", name: "Lisa King", rating: 4, title: "Comfortable and durable", comment: "Good dexterity for detailed work while still offering decent protection. Held up well after a week of continuous use on site." },
    { productId: "WTH-003", email: "tom.r@example.com", name: "Tom Roberts", rating: 3, title: "Decent but runs small", comment: "Quality is fine but definitely order a size up. The size 9 fits more like an 8. Grip is good though." },
    { productId: "WTH-004", email: "chris.m@example.com", name: "Chris Morgan", rating: 5, title: "Brilliant light", comment: "1200 lumens is no joke — lights up an entire loft space. Battery lasts a solid 4 hours on full brightness. The magnetic base is a game changer." },
  ];

  for (const r of sampleReviews) {
    await query(
      `INSERT INTO reviews (product_id, order_id, customer_email, customer_name, rating, title, comment, status)
       VALUES (?, 'SEED', ?, ?, ?, ?, ?, 'approved')`,
      [r.productId, r.email, r.name, r.rating, r.title, r.comment]
    );
  }

  console.log("--- Seed complete ---");
  console.log(`Products: ${products.length}`);
  console.log(`Order: ${orderId}`);
  console.log(`Sample reviews: ${sampleReviews.length} (approved)`);
  console.log("");
  console.log("Review form URL:");
  console.log(`http://localhost:3000/review?token=${token}`);
}

seed().catch(console.error);
