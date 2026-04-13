# Saashakti

Saashakti is a launch-oriented Women Welfare Registration and Scheme Discovery monorepo designed for 2,000+ registrations on launch day.

## Current implementation status
- ✅ Monorepo scaffold for mobile, admin web, API, and shared packages
- ✅ Shared type/runtime contracts in `packages/types`
- ✅ Scheme registry with runtime validation in `packages/scheme-registry`
- ✅ Rule-based matching engine with tests in `packages/scheme-engine`
- ✅ Repo debug + QA command for fast developer sanity checks before pushes
- ⏳ API/mobile/admin feature modules (OTP onboarding, dashboards, persistence) in next increments

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
- App/API endpoints are not yet fully implemented in this commit.

## Next-phase roadmap
- OTP request/verify API + rate limiting
- Beneficiary onboarding persistence APIs
- Mobile onboarding screens and assisted mode
- Admin dashboard summary/recent feeds
