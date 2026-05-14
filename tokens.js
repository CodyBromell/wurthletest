const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "würth-review-secret-change-in-production";
const TOKEN_EXPIRY = "30d";

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === "production") {
    console.error("FATAL: JWT_SECRET env var must be set in production");
    process.exit(1);
  }
  console.warn("⚠ JWT_SECRET not set — using insecure default (dev only)");
}

function generateToken(orderData) {
  const payload = {
    orderId: orderData.orderId,
    customerEmail: orderData.customerEmail,
    customerName: orderData.customerName || "",
    products: orderData.products,
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, SECRET, { expiresIn: TOKEN_EXPIRY });
}

function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, SECRET);
    return { valid: true, data: decoded };
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return { valid: false, error: "Token has expired. Please request a new review link." };
    }
    return { valid: false, error: "Invalid token." };
  }
}

module.exports = { generateToken, verifyToken, SECRET };
