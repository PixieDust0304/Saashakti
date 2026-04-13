# Saashakti

Saashakti is a launch-oriented Women Welfare Registration and Scheme Discovery monorepo designed for 2,000+ registrations on launch day.

## Current implementation status
- ✅ Monorepo scaffold for mobile, admin web, API, and shared packages
- ✅ Shared type/runtime contracts in `packages/types`
- ✅ Scheme registry with runtime validation in `packages/scheme-registry`
- ✅ Rule-based matching engine with tests in `packages/scheme-engine`
- ✅ Fastify + TypeScript API covering OTP, auth, Aadhaar (mock), beneficiary, matching, and dashboard
- ✅ PostgreSQL + Redis adapters with migration-on-boot and graceful shutdown
- ✅ Integration test suite (fastify.inject) covering OTP round-trip, onboarding, and matching flows
- ✅ OpenAPI 3.0 spec + API contract doc for the frontend team
- ✅ Repo debug + QA command for fast developer sanity checks before pushes
- ⏳ Aadhaar production provider integration and mobile/admin UI wiring in next increments

## Implemented API endpoints
- `GET /health`, `GET /ready`
- `POST /v1/otp/request`, `POST /v1/otp/verify`
- `POST /v1/aadhaar/start`, `GET /v1/aadhaar/status`
- `POST /v1/beneficiary`, `GET /v1/beneficiary/me`, `PUT /v1/beneficiary/profile`
- `POST /v1/matching/run`, `GET /v1/matching/me`
- `GET /v1/dashboard/summary`, `GET /v1/dashboard/recent`

See [`docs/api-contract.md`](docs/api-contract.md) and [`docs/openapi.json`](docs/openapi.json) for the full contract.

## OTP reliability behaviors
- 10-15 digit mobile normalization and validation
- OTP TTL expiry checks and verify-attempt cap
- Per-mobile cooldown between OTP requests
- Per-mobile and per-IP hourly rate limits
- Hashed OTP codes in Postgres, hashed session tokens in `user_sessions`
- Mock SMS provider abstraction for development-safe mode
- Request-id correlation header and structured error envelopes

## Architecture
- `apps/mobile`: Expo mobile app for beneficiary and assisted worker onboarding.
- `apps/admin-web`: dashboard for event/admin operations.
- `apps/api`: Fastify + TypeScript service for OTP, onboarding, matching, and dashboard.
- `packages/scheme-engine`: shared rule evaluation engine.
- `packages/scheme-registry`: validated policy/scheme definitions.
- `packages/types`: shared data contracts.
- `infra/sql`: SQL schema and migrations (applied via `apps/api` migration runner).
- `infra/scripts`: repository-level debug and QA helpers.

## Local development
```bash
pnpm install
pnpm --filter api typecheck
pnpm --filter api build
pnpm --filter api test
npm run qa
```

Run the API locally (requires Docker):
```bash
docker compose up -d postgres redis
cp apps/api/.env.example apps/api/.env
pnpm --filter api dev
```

## Infrastructure quick start
```bash
docker compose up -d                              # Postgres 16 + Redis 7 with healthchecks
```

## API Docker image
Multi-stage image built from the monorepo root:
```bash
docker build -f apps/api/Dockerfile -t saashakti/api:local .
docker run --rm -p 3001:3001 \
  -e DATABASE_URL=postgres://saashakti:saashakti@host.docker.internal:5432/saashakti \
  -e REDIS_URL=redis://host.docker.internal:6379 \
  -e OTP_MODE=mock \
  saashakti/api:local
```
The image runs as a non-root user, exposes port 3001, includes a
`HEALTHCHECK` hitting `/health`, and applies pending SQL migrations
from `/app/infra/sql` on startup.

Environment variables (see `apps/api/.env.example`):
```bash
DATABASE_URL=postgres://saashakti:saashakti@localhost:5432/saashakti
REDIS_URL=redis://localhost:6379
OTP_MODE=mock
```

## Team push checklist
1. Pull latest branch changes.
2. Run `npm run qa` before pushing.
3. If `pnpm --filter api typecheck` or `pnpm --filter api build` fails, fix it first.
4. Keep commit messages grouped by concern (engine, api, mobile, docs).

## Launch-day architecture
- Stateless API + PostgreSQL + Redis
- Rate-limited OTP endpoints
- Idempotent registration writes
- Indexed dashboard queries with Redis cache

## Known limitations
- Aadhaar integration is mocked for launch; the provider interface is production-oriented.
- Mobile and admin UIs are scaffolded; full data wiring lands in the next increment.

## Next-phase roadmap
- Aadhaar production provider adapter
- Mobile onboarding screens wired to `/v1/*` endpoints
- Admin dashboard polling against `/v1/dashboard/summary`
- Assisted-mode onboarding flow for field workers
