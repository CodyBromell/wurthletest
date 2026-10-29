# Deploying Würthle to Vercel

Vercel + Supabase Postgres. Both free tiers. Total time ~10 minutes.

## 1. Create the database (Supabase)

1. Go to **https://supabase.com** → **Start your project** (sign up with GitHub is fastest).
2. **New project**:
   - Name: `wurthle` (or anything)
   - Region: **London** or **Frankfurt** (closest to UK users)
   - Database Password: generate a strong one, save it in a password manager (you won't see it again)
3. Wait ~1 minute for provisioning.
4. On the project dashboard, left sidebar → **Project Settings** (gear icon) → **Database**.
5. Scroll to **Connection string**. Switch the tab to **Transaction** (this is the pooled connection — the right one for serverless).
6. Copy the URI. It looks like:
   ```
   postgresql://postgres.xxxxxxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-eu-west-2.pooler.supabase.com:6543/postgres
   ```
7. Replace `[YOUR-PASSWORD]` in the string with the password you set in step 2.

Keep this ready.

## 2. Deploy to Vercel

1. Go to **https://vercel.com** → **Sign up** / **Log in** with the GitHub account that owns `CodyBromell/wurthletest`.
2. Dashboard → **Add New…** → **Project**.
3. Import `CodyBromell/wurthletest`.
4. On the configuration screen leave the defaults:
   - **Framework Preset**: Other (auto-detected)
   - **Root Directory**: `./`
   - **Build Command**: empty
   - **Output Directory**: empty
   - **Install Command**: default (`npm install`)
5. Expand **Environment Variables** and add three:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | Supabase pooler URI from step 1 (with password filled in) |
   | `JWT_SECRET` | any long random string — https://randomkeygen.com → "CodeIgniter Encryption Keys" |
   | `NODE_ENV` | `production` |
   | `ADMIN_PASSWORD` | long random string (12+ characters) — unlocks `/wurthle/admin` |

6. Click **Deploy**. ~90 seconds.

You'll get a URL like `wurthletest.vercel.app`. The game is at `/wurthle`.

## 3. Share with the team

Send `https://<your-vercel-url>/wurthle`. Customers click **Create account**, enter their Würth customer number (starts with 308), name and a password, then sign in with customer number + password from then on.

Campaign terms are at `/wurthle/terms` and linked from the sign-in screen, the leaderboard and the opt-in switch. Opting in counts as accepting them (clause 12), and the time of each opt-in is recorded.

## 4. Admin page

`https://<your-vercel-url>/wurthle/admin`, signed in with `ADMIN_PASSWORD`. Sessions last 8 hours.

- **Sign-ups** — totals (all time, today, last 7 days, played today, leaderboard opt-ins) and a searchable player list: customer number, name, sign-up and last sign-in times, games played/won, November points, balance, opt-in time and account status.
- **Download CSV** — every player, for the prize draw and spend checks.
- **Reset password** — gives the customer a one-time temporary password (e.g. `k7mq-x2rt-9vha`) and unlocks the account. Pass it on via their sales rep; when they sign in with it they must choose their own password. Staff never know a customer's real password.

To change the admin password, update `ADMIN_PASSWORD` in Vercel and redeploy.

## Updating after a code change

```bash
git add -A
git commit -m "..."
git push
```

Vercel auto-deploys every push to `main`.

## Local development

Set `DATABASE_URL` in a `.env` file (gitignored) and run `npm start`:

```bash
# .env
DATABASE_URL=postgresql://postgres.xxxx:password@aws-0-eu-west-2.pooler.supabase.com:6543/postgres
JWT_SECRET=anything-you-want
```

```bash
npm install
npm start   # http://localhost:3000/wurthle
```

To avoid colliding with production data, create a second Supabase project just for dev and use its connection string locally.

## Hardening for production

1. **Verify customer numbers** — accounts use customer number + password (scrypt-hashed, 15-minute lockout after 10 wrong passwords), but numbers aren't checked against Würth's customer records, so the first person to register a number owns it. Before prizes depend on it, validate numbers against the eshop/ERP or switch to eshop SSO.
2. **Rate limiting** — nothing stops a bot spamming `/api/wurthle/guess`. Add `express-rate-limit` capped at ~30 req/min per IP.
3. **CORS** — currently open. Lock to the eshop domain + Vercel URL.
4. **Supabase Row Level Security** — not required (we use JWT auth in the app), but worth enabling as defence in depth.
5. **Rewards store** — removed for now (tab, redeem endpoint and voucher display). The `wurthle_vouchers` table is kept. If it comes back, voucher codes need pushing to SalesManago so eshop checkout honours them (Phase 2 in CLAUDE.md).

## Troubleshooting

- **"Database unavailable" or ECONNREFUSED on first load** — `DATABASE_URL` wrong. Verify in Vercel → Project → Settings → Environment Variables. Must be the **Transaction** pooler URI (port 6543), not the Direct connection.
- **"password authentication failed"** — you forgot to substitute `[YOUR-PASSWORD]` in the connection string with your actual database password.
- **"prepared statement already exists"** — the `prepare: false` option in `db.js` prevents this; it's required for Supabase's transaction-mode pooler. If you see it anyway, double-check `db.js` wasn't reverted.
- **Admin page says "Admin access isn't set up yet"** — `ADMIN_PASSWORD` is missing or under 12 characters. Add it in Vercel → Settings → Environment Variables, then redeploy (env var changes only apply to new deployments).
- **November leaderboard still empty on 1 Nov** — override `CAMPAIGN_START` / `CAMPAIGN_END` env vars in Vercel if you want a different window. Defaults are 2026-11-01 to 2026-11-30.
- **Vercel function timeout (10 s on Hobby plan)** — rare for this app's query sizes. If it happens, Supabase pooler is overloaded; refresh works. Pro plan has 60 s.
