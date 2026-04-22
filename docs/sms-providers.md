# SMS Provider Setup

The API's OTP flow dispatches SMS through a pluggable provider chosen
by the `SMS_PROVIDER` env var. Three production providers + one
development mock are wired in.

| Provider | Env value | When to pick it |
|---|---|---|
| Mock | `mock` | Local dev, CI. Logs OTP to stdout. **Blocked in production** — the factory throws at first use if `NODE_ENV=production` and `SMS_PROVIDER=mock`. |
| MSG91 | `msg91` | **Recommended for the CG launch.** India-native, DLT-compliant (TRAI mandate since March 2021), Hindi/Devanagari support, ~₹0.15/SMS. |
| Twilio | `twilio` | Global fallback. Works anywhere but ~₹0.50/SMS in India and rate-limits harder on international routes. |
| Textlocal | `textlocal` | Alternative India vendor, listed on GeM so some CG departments already have active contracts. |

Only one provider runs at a time. Switching providers requires no code
change — just update the env and restart the API.

---

## MSG91 (recommended)

### 1. Account setup

1. Sign up at [msg91.com](https://msg91.com) using the CG WCD department GSTIN.
2. Complete KYC (Aadhaar + GST + authorization letter on department letterhead).
3. Load wallet (min ₹5,000 for meaningful load testing).

### 2. DLT registration (mandatory)

Per TRAI regulations, **every** transactional SMS template must be
registered on a DLT portal before it can be sent. MSG91 integrates
with Jio DLT, Airtel DLT, Vi DLT, and BSNL DLT.

1. Register as a "Principal Entity" on any DLT portal (Jio recommended).
2. Register the Header/Sender ID: e.g. `CGWCD` — 6 chars, uppercase.
3. Register the OTP template:
   ```
   {#var#} aapka Saashakti OTP hai. 5 minute me samapt hoga. - CG WCD
   ```
   The `{#var#}` placeholder is mandatory for OTP templates.
4. Link the DLT template ID to MSG91 via their dashboard → Templates.

### 3. Env configuration

```bash
SMS_PROVIDER=msg91
SMS_MSG91_AUTH_KEY=<from msg91.com → API dashboard → Auth Key>
SMS_MSG91_TEMPLATE_ID=<the template id MSG91 assigns after DLT link>
SMS_MSG91_SENDER_ID=CGWCD
```

### 4. Smoke test

```bash
curl -X POST http://localhost:3001/v1/otp/request \
  -H 'content-type: application/json' \
  -d '{"mobileNumber":"9198765XXXXX"}'
# → 200 with expiresInSeconds. No mockCode field.
# → MSG91 dashboard shows the dispatched SMS within 5 seconds.
```

---

## Twilio

### 1. Account setup

1. Sign up at [twilio.com](https://twilio.com) and buy an Indian
   long-code or alphanumeric Sender ID (requires DLT registration too
   if routing through India).
2. For international routing (outside India), any Twilio-bought number
   works.

### 2. Env configuration

```bash
SMS_PROVIDER=twilio
SMS_TWILIO_ACCOUNT_SID=AC........................
SMS_TWILIO_AUTH_TOKEN=........................
SMS_TWILIO_FROM=+14155551234
```

### 3. Notes

- The adapter bilingual OTP template is: `{code} आपका सशक्ति OTP है। …
  / Your Saashakti OTP is {code}. …`
- Twilio accepts E.164 (`+91...`). The adapter auto-prefixes `+91`
  when callers pass 10-digit or `91`-prefixed mobiles.
- 10-second timeout on the HTTP POST; failures surface as HTTP 502
  `sms_dispatch_failed` to the client.

---

## Textlocal India

### 1. Account setup

1. Sign up at [textlocal.in](https://textlocal.in).
2. Register the sender ID with your DLT template (same process as
   MSG91 above).
3. Top up the wallet.

### 2. Env configuration

```bash
SMS_PROVIDER=textlocal
SMS_TEXTLOCAL_API_KEY=<from textlocal.in → Apps → API Keys>
SMS_TEXTLOCAL_SENDER=CGWCD
```

---

## Switching providers in production

Providers are memoized per-process. To swap without downtime:

1. Update the env on the new container/pod.
2. Roll out one instance at a time — the OTP flow is idempotent so
   mid-request concurrency is safe.
3. Existing pending OTPs in the DB remain verifiable (we store hashes,
   not providers).

---

## Rate limits & cost controls

The OTP flow caps requests per mobile (default 5/hour) and per IP
(default 20/hour) before any SMS is sent. Cooldown is 30s between
sends to the same mobile. See `apps/api/src/otp/service.ts` and the
rate-limit env vars in `.env.example`.

For MSG91: set up a spending alert on the wallet so a broken caller
can't drain the balance.

---

## Error handling contract

| Scenario | HTTP | Error code |
|---|---|---|
| Provider env missing | 502 | `sms_dispatch_failed` |
| Provider 4xx/5xx | 502 | `sms_dispatch_failed` |
| Network timeout (10s) | 502 | `sms_dispatch_failed` |
| Rate limit exceeded | 429 | `otp_mobile_limit` or `otp_ip_limit` |
| Cooldown active | 429 | `otp_cooldown` |
| Bad mobile format | 400 | `invalid_mobile` |

Provider errors do NOT leak vendor names or raw response bodies to the
client. Full error detail is available in the API log stream.
