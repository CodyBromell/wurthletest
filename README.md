# Würth Review System — Phase 1

Post-purchase product review collection system. Customers receive a tokenised link after delivery, rate their products, and reviews display on product pages via a widget.

## What's included

| File | Purpose |
|------|---------|
| `server.js` | Express server with review form page + widget demo page |
| `routes.js` | REST API: token validation, review submission, retrieval, admin moderation |
| `db.js` | SQLite database initialisation and schema |
| `tokens.js` | JWT token generation and verification |
| `seed.js` | Populates test products, an order, and sample reviews |
| `.env.example` | Environment variable template |

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Seed test data and start the server
npm run dev

# 3. Open the review form (URL printed by seed script)
#    http://localhost:3000/review?token=<token>

# 4. Open the widget demo
#    http://localhost:3000/widget-demo?product=WTH-001
```

## API endpoints

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/review/validate?token=xxx` | Validate a review token, returns order + product info |
| POST | `/api/reviews` | Submit reviews (requires token) |
| GET | `/api/reviews/:productId` | Get approved reviews for a product (widget endpoint) |

### Internal (called by your order system)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders/delivered` | Register a delivered order, generates a review token |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/reviews?status=pending` | List reviews by status |
| PATCH | `/api/admin/reviews/:id` | Approve or reject a review |

## How the token flow works

1. Your order system calls `POST /api/orders/delivered` with the order details
2. The API creates a JWT token containing the order ID, customer email, and product list
3. The token is embedded in a URL: `/review?token=<jwt>`
4. This URL goes into the SalesManago email (Phase 2)
5. Customer clicks the link → form shows their specific products
6. They rate and submit → reviews go into the database as "pending"
7. Admin approves → reviews appear on product pages via the widget

## Example: triggering a review token

```bash
curl -X POST http://localhost:3000/api/orders/delivered \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORD-2026-00199",
    "customerEmail": "jane@example.com",
    "customerName": "Jane Doe",
    "products": [
      {
        "id": "WTH-001",
        "name": "ASSY Plus VG Screw 4.0x40mm (200pc)",
        "sku": "WTH-ASSY-4040",
        "imageUrl": "https://placehold.co/300x300/1a1a2e/e0e0e0?text=Screw",
        "category": "Fasteners"
      }
    ]
  }'
```

Response includes the `reviewUrl` to send to the customer.

## Example: submitting a review

```bash
curl -X POST http://localhost:3000/api/reviews \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<jwt-token-from-above>",
    "reviews": [
      {
        "productId": "WTH-001",
        "rating": 5,
        "title": "Excellent screws",
        "comment": "Best fasteners I have used on site."
      }
    ]
  }'
```

## Database

SQLite via sql.js (no native compilation needed). Database file: `reviews.db`.

**Tables:** products, orders, order_items, review_tokens, reviews.

Reviews have three statuses: `pending` (default), `approved` (visible on widget), `rejected`.

## What's next

- **Phase 2:** SalesManago API integration (PURCHASE event push, contact upsert, review callback)
- **Phase 3:** Email template + SalesManago workflow setup guide
- **Phase 4:** GTM review widget (extractable JS from the widget demo)
- **Phase 5:** Deployment, admin panel, edge case hardening

## Production checklist

- [ ] Change `JWT_SECRET` in environment variables
- [ ] Deploy to a hosting provider (Railway, Render, AWS, VPS)
- [ ] Set up a subdomain (e.g. reviews.yoursite.com)
- [ ] Add rate limiting to API endpoints
- [ ] Add HTTPS
- [ ] Connect order system webhook to `/api/orders/delivered`
- [ ] Set up SalesManago integration (Phase 2)
