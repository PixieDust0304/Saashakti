# AGENTS.md

## Project
Saashakti — Women Welfare Registration and Scheme Discovery Platform

## Mission
Build a launch-ready, maintainable system for:
- mobile OTP onboarding
- Aadhaar-ready onboarding flow
- beneficiary profile capture
- scheme matching
- admin dashboard
- 2,000+ launch-day registrations

## Repo principles
1. Build for reliability first
2. Do not overbuild future phases
3. Keep extension points clean
4. Preserve shared types and data contracts
5. Avoid changing unrelated files
6. Keep Git history tidy and logical

## Monorepo layout
- `apps/mobile` — mobile app for beneficiaries and field workers
- `apps/admin-web` — dashboard/admin interface
- `apps/api` — API service
- `packages/scheme-engine` — core matching logic
- `packages/scheme-registry` — scheme JSON and validators
- `packages/types` — shared contracts
- `infra/sql` — schema and migrations
- `docs` — architecture, launch plans, integration notes

## Coding rules
- Prefer TypeScript
- Prefer small, focused modules
- Add clear types to inputs/outputs
- Keep UI copy simple and Hindi-first where user-facing
- Never leave dead imports or broken builds
- If modifying shared types, update affected consumers

## Launch constraints
- Support 2,000+ launch-day registrations
- OTP endpoints must be rate-limited
- Registration writes must be idempotent
- Dashboard queries must be indexed and efficient
- Aadhaar integration may be mocked or abstracted for launch, but the interface must be production-oriented

## OTP guidance
- Abstract SMS provider
- Support mock OTP mode in development
- Track request attempts and cooldowns
- Never expose implementation secrets in code

## Aadhaar guidance
- Keep Aadhaar as a separate service/interface boundary
- Support status values: `not_started`, `pending`, `verified`, `failed`, `mock_verified`
- Do not spread Aadhaar logic across unrelated files

## Scheme engine guidance
- Matching logic belongs in `packages/scheme-engine`
- Registry validation belongs in `packages/scheme-registry`
- UI must consume the shared engine output contract
- Keep explainability and next-best-action in results

## Testing commands
- `pnpm install`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Commit guidance
- Make grouped commits by concern
- Use clear Conventional Commit messages

## Do not
- introduce unnecessary frameworks
- rewrite stable modules without cause
- leave placeholders without marking them
- hardcode secrets
- add Aadhaar assumptions directly into UI components
