# Saashakti

Saashakti is a launch-oriented Women Welfare Registration and Scheme Discovery monorepo designed for 2,000+ registrations on launch day.

## Current implementation status
- ✅ Monorepo scaffold for mobile, admin web, API, and shared packages
- ✅ Shared type/runtime contracts in `packages/types`
- ✅ Scheme registry with runtime validation in `packages/scheme-registry`
- ✅ Rule-based matching engine with tests in `packages/scheme-engine`
- ✅ OTP API foundation with cooldown, rate limits, verify attempts, and error envelopes
- ✅ Production adapters added: PostgreSQL store, Redis OTP store, auth middleware, structured logger
- ✅ Repo debug + QA command for fast developer sanity checks before pushes
- ⏳ Aadhaar onboarding module and full mobile/admin data integration in next increments

## Implemented API endpoints
- `GET /health`
- `POST /auth/request-otp`
- `POST /auth/verify-otp`
- `POST /beneficiaries`
- `POST /beneficiaries/:id/match`
- `GET /dashboard/summary`
- `GET /dashboard/recent?limit=&offset=`
- `GET /schemes`

## OTP reliability behaviors implemented
- 10-digit mobile validation
- OTP TTL expiry checks
- cooldown between OTP requests
- request window rate limit
- verify-attempt cap
- request ID + structured error envelope
- mock SMS provider abstraction (development-safe)

## Architecture
- `apps/mobile`: Expo mobile app for beneficiary and assisted worker onboarding.
- `apps/admin-web`: dashboard for event/admin operations.
- `apps/api`: OTP, onboarding, matching, and dashboard APIs.
- `packages/scheme-engine`: shared rule evaluation engine.
- `packages/scheme-registry`: validated policy/scheme definitions.
- `packages/types`: shared data contracts.
- `infra/sql`: SQL schema and indexes.
- `infra/scripts`: repository-level debug and QA helpers.

## Local development
```bash
npm install
npm run lint
npm run typecheck
npm run test
npm run debug
npm run qa
npm run build
```

Run API locally:
```bash
npm --prefix apps/api run start
```


## Infrastructure quick start
```bash
docker compose -f infra/docker/docker-compose.yml up -d
```

Set env vars before running API in persistent mode:
```bash
export DATABASE_URL=postgresql://saashakti:saashakti@localhost:5432/saashakti
export REDIS_URL=redis://localhost:6379
export STORE_MODE=persistent
```

## Team push checklist (VS Code)
1. Pull latest branch changes.
2. Run `npm run qa` before pushing.
3. If `npm run debug` fails, fix missing paths/contracts first.
4. Keep commit messages grouped by concern (engine, api, mobile, docs).

## Environment variables
Create service-specific `.env` files for API base URLs, database, Redis, OTP mode, and dashboard polling settings.

## Launch-day architecture
- Stateless API + PostgreSQL + Redis
- Rate-limited OTP endpoints
- Idempotent registration writes
- Indexed dashboard queries with cache support

## Known limitations
- Aadhaar integration is intentionally abstracted for phased rollout.
- Persistent mode now available through Redis + PostgreSQL adapters; in-memory mode remains as fallback for local/test.

## Next-phase roadmap
- Redis-backed OTP/session storage
- Beneficiary onboarding persistence APIs
- Mobile onboarding screens and assisted mode
- Admin dashboard summary/recent feeds
