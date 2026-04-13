# Saashakti — Deployment Guide

## Two Tracks

### Track A: admin-web PWA (LAUNCH DAY PRIORITY)
Static React PWA deployed on Vercel with Supabase backend.
This is the primary launch vehicle for April 18.

### Track B: Monorepo API (Phase 2 backbone)
Fastify API + Postgres + Redis deployed via Docker.
Wires to mobile app and admin dashboard post-launch.

---

## Track A: Deploy admin-web PWA

### Prerequisites
- GitHub account with repo access
- Vercel account (free tier is sufficient)
- Supabase account (free tier handles 2000+ users)

### Step 1: Create Supabase Project

1. Go to https://supabase.com → New Project
2. Name: `saashakti`
3. Region: Mumbai (ap-south-1) — closest to CG
4. Generate a strong database password — save it
5. Wait for project to provision (~2 min)

### Step 2: Run Database Migration

1. In Supabase dashboard → SQL Editor
2. Open file: `apps/admin-web/supabase/migrations/001_initial_schema.sql`
3. Paste entire contents into SQL Editor
4. Click "Run"
5. Verify: go to Table Editor — you should see `beneficiaries`, `matched_schemes`, `field_workers` tables
6. Verify: `field_workers` table should have 11 seeded workers including "Demo Worker" with code 999999

### Step 3: Get Supabase Credentials

1. Go to Project Settings → API
2. Copy:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOi...` (the long one under "anon key")
3. Save these — you need them for Vercel

### Step 4: Deploy to Vercel

1. Go to https://vercel.com → Add New → Project
2. Import GitHub repo: `PixieDust0304/Saashakti`
3. **CRITICAL**: Set Root Directory to `apps/admin-web`
4. Framework Preset: Vite
5. Build Command: `npm run build` (or leave default)
6. Output Directory: `dist`
7. Add Environment Variables:
   ```
   VITE_SUPABASE_URL = https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGciOi...
   ```
8. Click Deploy
9. Wait ~1 minute for build

### Step 5: Custom Domain (Optional but recommended)

1. In Vercel project → Settings → Domains
2. Add your domain (e.g., `saashakti.in` or `app.saashakti.in`)
3. Add the DNS records Vercel shows you at your domain registrar
4. SSL is automatic

### Step 6: Verify Deployment

1. Open the Vercel URL
2. You should see the Saashakti home page with "मैं फील्ड कार्यकर्ता हूँ" / "मैं लाभार्थी हूँ"
3. Click Field Worker → Enter code `999999` → Should log in as Demo Worker
4. Fill a test registration → Submit
5. Go to `/dashboard` — should show 1 registration
6. Check Supabase Table Editor → `beneficiaries` table should have 1 row

### Step 7: Update Field Worker Codes

Before launch, update `field_workers` table in Supabase:
1. Go to Table Editor → `field_workers`
2. Replace seed data with real field worker names and codes
3. Distribute codes to workers

---

## Track B: Deploy Monorepo API

### Prerequisites
- VPS or cloud instance (AWS Lightsail, DigitalOcean, Railway)
- Docker + Docker Compose installed
- Node 18+ and pnpm

### Step 1: Server Setup

```bash
# SSH into your server
ssh user@your-server

# Clone repo
git clone https://github.com/PixieDust0304/Saashakti.git
cd Saashakti

# Start infrastructure
docker compose up -d

# Verify
docker compose ps
# postgres and redis should be "healthy"
```

### Step 2: Configure API

```bash
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env`:
```
DATABASE_URL=postgres://saashakti:saashakti@localhost:5432/saashakti
REDIS_URL=redis://localhost:6379
OTP_MODE=mock
PORT=3001
SESSION_TTL_SECONDS=86400
OTP_TTL_SECONDS=300
OTP_COOLDOWN_SECONDS=60
OTP_MAX_ATTEMPTS=5
OTP_HOURLY_LIMIT_PER_MOBILE=10
OTP_HOURLY_LIMIT_PER_IP=50
```

### Step 3: Build and Run API

```bash
pnpm install
pnpm --filter api build
pnpm --filter api start
```

Or via Docker:
```bash
docker build -f apps/api/Dockerfile -t saashakti/api:local .
docker run --rm -p 3001:3001 \
  --env-file apps/api/.env \
  --network host \
  saashakti/api:local
```

### Step 4: Verify API

```bash
curl http://localhost:3001/health
# Should return: {"status":"ok"}

curl http://localhost:3001/ready
# Should return: {"status":"ready","postgres":true,"redis":true}
```

### Step 5: Test OTP Flow

```bash
# Request OTP (mock mode returns code in response)
curl -X POST http://localhost:3001/v1/otp/request \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber":"9876543210"}'

# Verify OTP (use mockCode from response above)
curl -X POST http://localhost:3001/v1/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber":"9876543210","code":"THE_CODE"}'
```

---

## Launch Day Checklist

### T-24 hours (April 17)
- [ ] admin-web deployed and accessible via URL
- [ ] Supabase tables created and seeded
- [ ] Field worker codes distributed
- [ ] Dashboard URL tested on large screen
- [ ] 5 test registrations done end-to-end
- [ ] Test data deleted from Supabase before launch
- [ ] Mobile hotspot ready as internet backup
- [ ] 2-3 backup phones with app loaded

### T-2 hours (April 18 morning)
- [ ] Verify app loads on all field worker phones
- [ ] Verify dashboard shows 0 registrations
- [ ] Run 2 demo registrations for minister walkthrough
- [ ] Verify dashboard updates in real-time
- [ ] Confirm projector/screen showing dashboard URL
- [ ] Brief field workers on the flow (max 5 min)

### During Event
- [ ] Monitor Supabase dashboard for errors (keep tab open on laptop)
- [ ] Watch live counter on projector
- [ ] If app fails: field workers use backup phones
- [ ] If Supabase fails: matching still works client-side (data just won't persist)
- [ ] Take screenshots of dashboard at 100, 250, 500 marks

### Post-Event
- [ ] Export beneficiary data from Supabase
- [ ] Screenshot final dashboard for press/report
- [ ] Do NOT delete any data — it's real registration data
- [ ] Document any issues for Phase 2

---

## Troubleshooting

### "Invalid code" when field worker logs in
→ Check `field_workers` table in Supabase. Ensure the code exists and matches.

### Dashboard shows 0 but registrations were made
→ Check Supabase real-time is enabled. Go to Database → Replication → Ensure `beneficiaries` table has publication enabled.

### App loads but forms are blank
→ Check browser console for errors. Likely missing env vars on Vercel.

### Slow on field worker phones
→ Clear browser cache. Use Chrome (not Samsung Internet). Ensure 4G signal.

### Supabase connection error
→ Check if Supabase project is paused (free tier pauses after 7 days inactivity). Unpause in dashboard.

---

## Environment Variables Reference

### admin-web (Vercel)
| Variable | Description | Example |
|----------|------------|---------|
| VITE_SUPABASE_URL | Supabase project URL | https://abc.supabase.co |
| VITE_SUPABASE_ANON_KEY | Supabase anonymous key | eyJhbGci... |

### API (Docker/server)
| Variable | Description | Default |
|----------|------------|---------|
| DATABASE_URL | PostgreSQL connection string | postgres://saashakti:saashakti@localhost:5432/saashakti |
| REDIS_URL | Redis connection string | redis://localhost:6379 |
| OTP_MODE | mock or live | mock |
| PORT | API port | 3001 |

---

## Architecture Decision Record

### Why two tracks?
The PWA (Track A) guarantees a working launch with zero infrastructure risk. The monorepo API (Track B) provides the scalable backbone for post-launch growth. Both share the same scheme data and matching logic.

### Why Supabase for Track A?
Free tier, zero ops, Postgres under the hood, real-time subscriptions for dashboard, instant REST API. For 500-2000 registrations, it's more than sufficient.

### When to merge tracks?
After launch, when the mobile app is built and wired to the API, the admin-web can switch from Supabase to the API's dashboard endpoints. The scheme engine is already shared.
