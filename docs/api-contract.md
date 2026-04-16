# Saashakti API Contract

Base URL (dev): `http://localhost:3001`

Auth: Bearer token on protected routes. Tokens are obtained from `/v1/otp/verify`
after an OTP round-trip, stored hashed in `user_sessions`, and expire after
`SESSION_TTL_SECONDS` (default 24h).

All error responses follow:

```json
{ "error": { "code": "string", "message": "human readable", "details": null } }
```

## Health

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/health` | — | Liveness — always 200 if the process is up |
| GET | `/ready` | — | Readiness — probes Postgres + Redis, returns 503 if degraded |

## OTP + session

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/v1/otp/request` | — | Rate-limited. Body: `{ mobileNumber }`. Response includes `mockCode` when `OTP_MODE=mock`. |
| POST | `/v1/otp/verify` | — | Body: `{ mobileNumber, code }`. Returns `{ session: { token, expiresAt } }`. |

### OTP rate limits

- Per mobile: 1 request per `OTP_COOLDOWN_SECONDS` (default 30s)
- Per mobile: `OTP_HOURLY_LIMIT_PER_MOBILE` per hour (default 5)
- Per IP: `OTP_HOURLY_LIMIT_PER_IP` per hour (default 20)
- Max `OTP_MAX_ATTEMPTS` verify attempts per request (default 5)

## Aadhaar (mock)

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/v1/aadhaar/start` | Bearer | Kicks off mock verification. In mock mode returns `{ status: "mock_verified" }`. |
| GET | `/v1/aadhaar/status` | Bearer | Returns the current status for the session's mobile. |

Status values: `not_started | pending | verified | failed | mock_verified`.

## Beneficiary

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/v1/beneficiary` | Bearer | Body: `{ registrationMode: "self" \| "assisted" }`. Idempotent by mobile. 201 on create, 200 if already exists. |
| GET | `/v1/beneficiary/me` | Bearer | Returns `{ beneficiary, profile }` for the session mobile. |
| PUT | `/v1/beneficiary/profile` | Bearer | Upserts the profile. All fields optional except `name`. |

### Profile body

```ts
{
  name: string,
  age?: number,
  district?: string,
  maritalStatus?: "single" | "married" | "widowed" | "divorced" | "separated",
  casteCategory?: "general" | "obc" | "sc" | "st",
  incomeBracket?: "below_50000" | "50000_100000" | "100000_200000" | "200000_400000" | "above_400000",
  isBpl?: boolean,
  hasBankAccount?: boolean,
  hasRationCard?: boolean,
  isPregnant?: boolean,
  isLactating?: boolean,
  hasGirlChild?: boolean,
  isShgMember?: boolean,
  exclusionFlags?: string[],
  disability?: Record<string, unknown>
}
```

## Matching

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/v1/matching/run` | Bearer | Runs `@saashakti/scheme-engine` against the saved profile and persists `matched_schemes`. |
| GET | `/v1/matching/me` | Bearer | Returns last-persisted match results for the session mobile. |

Response shape:

```ts
{
  results: Array<{
    schemeId: string,
    schemeNameHi: string,
    schemeNameEn: string,
    status: "eligible" | "partial" | "ineligible",
    annualValueInr: number,
    matchedRules: string[],
    missingRules: string[],
    nextActionHi: string,
    nextActionEn: string,
    explanationHi: string,
    explanationEn: string,
  }>
}
```

## Dashboard (public)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/v1/dashboard/summary` | — | Aggregates cached `DASHBOARD_CACHE_TTL_SECONDS` in Redis. |
| GET | `/v1/dashboard/recent?limit=20` | — | Recent registrations (most recent first). `limit` capped at 100. |

## Aadhaar e-KYC (mock / vendor)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/v1/aadhaar/kyc?aadhaarNumber=...` | — | Public, rate-limited 30/min. Returns a deterministic mock KYC record (name, DOB/age, gender, address with pincode, mobile). Switch providers via `AADHAAR_PROVIDER` env: `mock` (default), `karza` (REST vendor), `uidai` (direct SOAP — scaffold only). |

Response shape:

```ts
{
  kyc: {
    aadhaarLast4: string,
    name: string,
    gender: "F" | "M" | "T",
    dob: string, // YYYY-MM-DD
    age: number,
    address: {
      house?: string, street?: string, landmark?: string,
      locality?: string, vtc: string, district: string,
      state: string, pincode: string, country: string,
    },
    mobileNumber?: string,
    source: "mock" | "uidai" | "karza",
    fetchedAt: string,
  }
}
```

## Rich intake (admin-web path)

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/v1/intake` | — | Public, rate-limited 60/min. Accepts an opaque admin-web profile JSON + pre-computed matches + optional field-worker access code. Stores full profile in `beneficiaries.profile_json`, writes a best-effort row to `beneficiary_profiles`, and persists matches. |

## Ingestion pipeline

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/v1/ingestion/discover` | — | Crawl seed URLs + sitemaps for scheme page URLs |
| POST | `/v1/ingestion/fetch` | — | Fetch up to 20 URLs and store raw source documents |
| POST | `/v1/ingestion/extract` | — | Extract scheme candidates from source documents |
| POST | `/v1/ingestion/normalize` | — | Normalize candidates into registry shape with auto-suggested rules |
| POST | `/v1/ingestion/publish` | — | Publish normalized schemes to canonical store (gated by `is_published`) |
| POST | `/v1/ingestion/run-full` | — | End-to-end pipeline: discover → fetch → extract → normalize → publish |
| GET | `/v1/ingestion/stats` | — | Returns counts of source docs, candidates, canonical schemes, published |

## Headers

- `x-request-id` — echoes the incoming header or a generated UUID. Use it in client-side error reporting and log correlation.

## Curl quickstart

```bash
# 1. request OTP (mock mode returns mockCode in the body)
curl -sX POST http://localhost:3001/v1/otp/request \
  -H 'content-type: application/json' \
  -d '{"mobileNumber":"919000000001"}'

# 2. verify
curl -sX POST http://localhost:3001/v1/otp/verify \
  -H 'content-type: application/json' \
  -d '{"mobileNumber":"919000000001","code":"<mockCode>"}'

# 3. create beneficiary
TOKEN=<token-from-verify>
curl -sX POST http://localhost:3001/v1/beneficiary \
  -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d '{"registrationMode":"self"}'

# 4. save profile
curl -sX PUT http://localhost:3001/v1/beneficiary/profile \
  -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d '{"name":"Test","district":"Raipur","isPregnant":true,"hasBankAccount":true}'

# 5. run matching
curl -sX POST http://localhost:3001/v1/matching/run \
  -H "authorization: Bearer $TOKEN"

# 6. dashboard
curl -s http://localhost:3001/v1/dashboard/summary
```

## OpenAPI spec

A static OpenAPI 3.0 spec is emitted to [`docs/openapi.json`](./openapi.json)
via `pnpm --filter api openapi`. Regenerate it after changing any route.
