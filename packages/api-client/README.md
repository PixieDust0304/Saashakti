# @saashakti/api-client

Typed TypeScript client for the Saashakti API. Drop-in for the admin web,
mobile app, or any other workspace consumer — no manual fetch wrangling.

## Install

It's a workspace package — add it to the consumer's `package.json`:

```json
{
  "dependencies": {
    "@saashakti/api-client": "workspace:*"
  }
}
```

Then `pnpm install` at the repo root.

## Quick start

```ts
import { createClient, ApiError } from '@saashakti/api-client';

const api = createClient({
  baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3001',
});

// 1. OTP round-trip
const req = await api.requestOtp('919000000001');
// req.mockCode is populated when the backend runs in OTP_MODE=mock
await api.verifyOtp('919000000001', req.mockCode!);
// The client stores the bearer token internally; no manual header juggling.

// 2. Onboarding
await api.createBeneficiary('self');
await api.saveProfile({
  name: 'Priya',
  district: 'Raipur',
  isPregnant: true,
  hasBankAccount: true,
  incomeBracket: 'below_50000',
});

// 3. Run scheme matching
const { results } = await api.runMatching();
for (const r of results) {
  console.log(r.schemeNameEn, r.status, r.annualValueInr);
}

// 4. Dashboard (public)
const summary = await api.getDashboardSummary();
const recent = await api.getDashboardRecent(10);
```

## Error handling

Every non-2xx response throws an `ApiError` with the parsed error envelope
and the correlation id from the `x-request-id` header (when present).

```ts
try {
  await api.requestOtp('1234');
} catch (err) {
  if (err instanceof ApiError) {
    console.warn(err.code, err.message, err.status, err.requestId);
  }
}
```

Common `code` values: `validation_error`, `invalid_mobile`, `otp_cooldown`,
`otp_mobile_limit`, `otp_ip_limit`, `otp_mismatch`, `otp_expired`,
`otp_locked`, `unauthenticated`, `invalid_session`, `session_expired`,
`beneficiary_required`, `beneficiary_not_found`, `profile_missing`,
`invalid_aadhaar_transition`.

## Session persistence

The client keeps the bearer token in memory only. Persist it yourself if
you need cross-reload sessions:

```ts
const api = createClient({
  baseUrl: API_URL,
  token: localStorage.getItem('saashakti.token'),
});

api.verifyOtp(mobile, code).then((res) => {
  localStorage.setItem('saashakti.token', res.session.token);
});
```

Or use `setToken(null)` on logout.

## Custom fetch

For tests, SSR, or non-browser runtimes, pass a custom `fetch`:

```ts
import { createClient } from '@saashakti/api-client';
import fetch from 'node-fetch';

const api = createClient({ baseUrl: 'http://localhost:3001', fetch });
```

## Contract source

Types mirror [`docs/api-contract.md`](../../docs/api-contract.md) and
[`docs/openapi.json`](../../docs/openapi.json). If you change a route
or a response shape in `apps/api`, update the types in `src/types.ts`
and run `pnpm --filter api openapi` to regenerate the spec.
