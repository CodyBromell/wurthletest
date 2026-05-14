# Deploying Würthle

This guide gets the team on a live `https://...` URL via Render. Total time: ~10 minutes.

## Why Render (and not Vercel/Netlify)

The app uses `sql.js` to write a `.db` file. Serverless hosts have read-only filesystems, so the DB would vanish on every request. Render (and Fly, Railway) give you a real disk.

## One-time setup

### 1. Sign up
- Go to https://render.com and sign in with the GitHub account that owns `CodyBromell/wurthletest`.
- Authorise Render to read that repo.

### 2. Deploy from the blueprint
- Dashboard → **New** → **Blueprint**.
- Pick the `wurthletest` repo.
- Render reads `render.yaml` in this repo and proposes:
  - Web service called `wurthle`, plan **Starter** ($7/mo)
  - 1 GB persistent disk at `/data`
  - Env vars: `NODE_ENV=production`, `JWT_SECRET` auto-generated, `DB_PATH=/data/reviews.db`
- Click **Apply**.

### 3. Wait ~3 minutes for the first build

Watch the build log. When it says `Review system running at http://localhost:10000`, you're live.

Your URL will be something like `https://wurthle.onrender.com`. The game is at `/wurthle`.

## Why Starter ($7/mo), not Free

Render's free tier:
- Doesn't allow persistent disks → SQLite file wipes on every restart, killing streaks.
- Sleeps after 15 min idle → first hit each day is a 30 s cold start.

For a daily-streak game shared with a team, neither of those works. Starter fixes both.

If you want truly free, swap `sql.js` for managed Postgres (Neon free tier) and re-deploy — but that's a code change, not a config change. Ask Claude to do it if needed.

## Sharing with the team

Just send the URL: `https://wurthle.onrender.com/wurthle`.

The login screen accepts any email — no verification. Anyone who knows the URL can sign in as anyone. **This is fine for an internal team prototype, NOT for production.** See "Hardening" below.

## Hardening for real use

In rough order of importance:

1. **Real auth.** Swap the "any email accepted" `POST /api/wurthle/login` for either:
   - A magic-link round-trip (email-verified one-time code) — reuse the JWT pattern from `tokens.js`.
   - SSO from the Würth eshop session.
2. **Rate-limit `/api/wurthle/guess`.** Right now anyone can spam-guess 50 000 times to brute-force the answer. Add `express-rate-limit` capped at maybe 30 requests/min per IP.
3. **Lock down CORS.** `server.js` currently has `cors()` wide open. In production, restrict to the eshop domain.
4. **Add a `/healthz` endpoint** so Render's health checks don't keep hitting `/`.

## Updating after a code change

```bash
git add -A
git commit -m "..."
git push
```

Render auto-deploys on every push to `main`. Build takes ~2 min.

## Troubleshooting

- **"FATAL: JWT_SECRET env var must be set in production"** in logs → the `render.yaml` env var didn't get applied; set it manually in the Render dashboard.
- **All users see 0 points after a restart** → the disk isn't mounted. Check `DB_PATH` resolves to `/data/reviews.db` and a disk is attached.
- **502 Bad Gateway** for ~30 s after the first request of the day → that's free-tier cold start. Confirm you're on Starter, not Free.
