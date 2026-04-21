# Aadhaar Integration — PAUSED

## Decision (April 2026)

After meeting with Ministry directors, Aadhaar autofill has been **scratched entirely** for the current phase.

### Reason
Rural Chhattisgarh has widespread stale Aadhaar data:
- Addresses not updated since enrollment (2012-2015)
- Names transliterated inconsistently
- Phone numbers changed multiple times
- Women who moved post-marriage never updated domicile

Autofilling stale data would be worse than empty fields — field workers would trust it and skip corrections.

### Current Identity Model
- **Mobile number** is the primary identifier
- **Field worker** enters all profile data manually
- **No Aadhaar dependency** at any point in the user journey

### Future Consideration
If Aadhaar data quality improves or the platform expands to urban areas, the following modules exist in the codebase (dormant):
- `apps/api/src/aadhaar/` — provider abstraction (mock, Karza, UIDAI stubs)
- `apps/admin-web/src/lib/aadhaar-qr.ts` — offline QR parser
- `apps/admin-web/src/components/AadhaarScanModal.tsx` — UI modal

These can be re-enabled without rebuilding. The decision to re-enable should come from field-level validation that Aadhaar data quality is sufficient for the target population.
