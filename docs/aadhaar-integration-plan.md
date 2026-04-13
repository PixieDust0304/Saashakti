# Aadhaar Integration Plan

## Current placeholder design
- Aadhaar remains a dedicated service boundary.
- Supported states: `not_started`, `pending`, `verified`, `failed`, `mock_verified`.
- Launch mode can proceed with consent + `pending` / `mock_verified`.

## Integration boundary
- `AadhaarService` interface: start verification, fetch status, persist outcome.
- No Aadhaar provider logic in UI screens.
- API owns status transitions and audit logging.

## Compliance-sensitive handling notes
- Do not store sensitive identifiers in plaintext.
- Use tokenized references and audit trails.
- Enforce least privilege access for Aadhaar-related endpoints.

## Future productionization steps
1. Integrate approved provider through adapter implementation.
2. Add webhook/callback handling.
3. Add retry, timeout, and reconciliation jobs.
4. Add compliance review and data retention controls.
