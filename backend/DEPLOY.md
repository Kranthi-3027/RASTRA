# RASHTRA — Production Deploy Guide
## Stack: Railway (Flask + PostgreSQL) + Cloudflare R2

---

## STEP 1 — Cloudflare R2 Setup (10 min)

1. Go to **dash.cloudflare.com → R2 → Create bucket** → name it `rashtra-images`
2. Inside bucket → **Settings → Public Access → Allow Access** → copy the `pub-xxx.r2.dev` URL
3. Go to **R2 → Manage R2 API Tokens → Create API Token**
   - Permissions: `Object Read & Write`
   - Scope: `rashtra-images` bucket only
   - Copy: **Access Key ID**, **Secret Access Key**, **Account ID**
4. Your endpoint = `<account_id>.r2.cloudflarestorage.com`

---

## STEP 2 — Railway Deploy (15 min)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Inside your backend/ folder:
cd backend/
railway init          # creates new project
railway add           # add PostgreSQL plugin → Railway injects DATABASE_URL automatically
railway up            # deploys — first deploy takes ~3 min (YOLO models are large)
```

After deploy, Railway gives you a URL like `https://rashtra-backend-production.up.railway.app`

### Set Environment Variables in Railway Dashboard:
Go to your service → **Variables** tab → add:

```
R2_ENDPOINT          = <account_id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID     = <from step 1>
R2_SECRET_ACCESS_KEY = <from step 1>
R2_BUCKET            = rashtra-images
R2_PUBLIC_URL        = https://pub-<hash>.r2.dev
```
> DATABASE_URL is auto-injected by Railway — don't add it manually.

---

## STEP 3 — Wire Frontend

Update `.env.local`:
```
VITE_API_URL=https://rashtra-backend-production.up.railway.app/api
```

Rebuild + redeploy Firebase:
```bash
npm run build
firebase deploy
```

---

## STEP 4 — Verify

Hit these URLs in browser:
```
https://rashtra-backend-production.up.railway.app/api/health
→ {"status": "ok", "db": "postgresql"}

https://rashtra-backend-production.up.railway.app/api/complaints
→ [] or existing data
```

---

## Existing Data (DB migration)

Your local PostgreSQL has existing complaints. To migrate:

```bash
# Dump local DB
pg_dump -U postgres rashtra > rashtra_dump.sql

# Import into Railway PostgreSQL
# Get connection string from Railway Dashboard → PostgreSQL → Connect
psql <railway_postgres_connection_string> < rashtra_dump.sql
```

---

## Cost Estimate (4 days)

| Service | Cost |
|---------|------|
| Railway (Flask + Postgres) | ~$0.50 of free $5 credit |
| Cloudflare R2 | Free (10GB storage, zero egress) |
| Firebase Hosting (frontend) | Free |
| **Total** | **~$0.50** |
