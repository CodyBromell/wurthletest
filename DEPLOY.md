# Deploying Würthle to Vercel

Vercel + Neon Postgres. Both free tiers. Total time ~10 minutes.

## 1. Create the database (Neon)

1. Go to **https://neon.tech** → **Sign up** (GitHub login is fastest).
2. Create a project — any name, pick the EU (eu-central-1 Frankfurt or eu-west-2 London) region to minimise latency from UK users.
3. On the project dashboard, click **Connection string** → **Pooled connection** (important: pooled). Copy the full `postgresql://…` string. Looks like:

   ```
   postgresql://neondb_owner:xxxxxx@ep-cool-name-12345-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```

Keep this tab open.

## 2. Deploy to Vercel

1. Go to **https://vercel.com** → **Sign up** / **Log in** with the GitHub account that owns `CodyBromell/wurthletest`.
2. Dashboard → **Add New…** → **Project**.
3. Import `CodyBromell/wurthletest`.
4. On the configuration screen:
   - **Framework Preset**: Other (Vercel will auto-detect — leave as is)
   - **Root Directory**: `./`
   - **Build Command**: leave empty (nothing to build)
   - **Output Directory**: leave empty
   - **Install Command**: `npm install` (default is fine)
5. Expand **Environment Variables** and add:
   - `DATABASE_URL` — paste the Neon connection string from step 1.
   - `JWT_SECRET` — any random string. Generate one at https://randomkeygen.com/ or just type a long password.
   - `NODE_ENV` — `production`
6. Click **Deploy**. Wait ~90 seconds.

You'll get a URL like `wurthletest.vercel.app`. The game is at `/wurthle`.

## 3. Share with the team

Send them `https://<your-vercel-url>/wurthle`. They sign in with any email and start playing. The November leaderboard will populate as users play — November 1-30 2026.

## Updating after a code change

```bash
git add -A
git commit -m "..."
git push
```

Vercel auto-deploys every push to `main`. First visit after a deploy is fast — no cold-start penalty like Render had.

## Local development

You need a Postgres connection string to run locally too. Options:

1. **Use the same Neon DB** — easiest. Set `DATABASE_URL` in a `.env` file (ignored by git) and run `npm start`. You'll share data with production though.
2. **Create a Neon dev branch** — in Neon dashboard, click **Branches** → create one called `dev`. Use its connection string locally. Changes stay isolated.

```bash
# .env
DATABASE_URL=postgresql://...
JWT_SECRET=whatever-you-want
```

```bash
npm install
npm start   # http://localhost:3000/wurthle
npm run seed # optional: seed sample review data
```

## Hardening before real customer use

1. **Real auth.** `POST /api/wurthle/login` accepts any email. Swap for magic-link verification or SSO from the Würth eshop session.
2. **Rate limiting.** Nothing stops a bot spamming `/api/wurthle/guess` to brute-force the answer. Add `express-rate-limit` capped at ~30 req/min per IP.
3. **CORS whitelist.** Currently open. Restrict to the eshop domain + the Vercel URL.
4. **Voucher codes → SalesManago.** When someone redeems, push a tag to SalesManago so eshop checkout honours the discount (see Phase 2 in CLAUDE.md).

## Troubleshooting

- **"Database unavailable" on first load** — `DATABASE_URL` not set or wrong. Check Vercel → Project → Settings → Environment Variables. Make sure you used the **pooled** connection string.
- **Function timeouts (10 s on Hobby plan)** — the first request after a long idle period waits for Neon to wake its DB. If it exceeds 10 s, Vercel kills it. Refresh and it works. Pro plan has 60 s timeout.
- **November leaderboard still empty on 1 Nov** — the campaign window is set via `CAMPAIGN_START` / `CAMPAIGN_END` env vars. Defaults are 2026-11-01 to 2026-11-30. If you want a different window, override those in Vercel's env vars.
