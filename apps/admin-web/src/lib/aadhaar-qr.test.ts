// @ts-nocheck
// Runs directly via `node --test src/lib/aadhaar-qr.test.ts` — not part of
// the Vite build or admin-web's tsc pipeline. The @ts-nocheck pragma keeps
// `tsc -b && vite build` from trying to resolve node:* types.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { deflateSync } from 'node:zlib'
import { parseAadhaarQr, dobToAge } from './aadhaar-qr.ts'

// Build a Secure QR payload the way a UIDAI encoder would: 0xFF-delimited
// UTF-8 fields, optional JPEG trailer, zlib-deflated, then encoded as a
// big-endian decimal BigInt string.
function buildSecureQr(fields: string[], withJpeg = false): string {
  const encoder = new TextEncoder()
  const parts: Uint8Array[] = []
  for (let i = 0; i < fields.length; i++) {
    if (i > 0) parts.push(new Uint8Array([0xff]))
    parts.push(encoder.encode(fields[i]))
  }
  if (withJpeg) {
    // Minimal JPEG magic + JFIF marker. parseSecureQr should slice
    // the text section at the 0xFF 0xD8 0xFF boundary and ignore this.
    parts.push(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]))
  }
  const totalLen = parts.reduce((n, a) => n + a.length, 0)
  const text = new Uint8Array(totalLen)
  let offset = 0
  for (const p of parts) {
    text.set(p, offset)
    offset += p.length
  }
  const compressed = deflateSync(text)
  let n = 0n
  for (const b of compressed) n = (n << 8n) | BigInt(b)
  return n.toString(10)
}

function makeFields(overrides: Record<number, string> = {}): string[] {
  const base: string[] = [
    '0',              // 0  bitmask (no email/mobile)
    '8229112233',     // 1  ref_id
    'Sunita Devi',    // 2  name
    '15-08-1990',     // 3  dob
    'F',              // 4  gender
    '',               // 5  care_of
    'Raipur',         // 6  district
    '',               // 7  landmark
    '',               // 8  house
    '',               // 9  locality
    '492001',         // 10 pincode
    '',               // 11 post_office
    'Chhattisgarh',   // 12 state
    '',               // 13 street
    '',               // 14 sub_district
    '',               // 15 vtc
  ]
  for (const [k, v] of Object.entries(overrides)) base[Number(k)] = v
  return base
}

// ─── dobToAge ────────────────────────────────────────────

test('dobToAge: DD-MM-YYYY returns plausible age', () => {
  const thisYear = new Date().getUTCFullYear()
  const dob = `15-08-${thisYear - 30}`
  const age = dobToAge(dob)
  // Tolerate ±1 for leap-year drift and year boundaries
  assert.ok(age !== null && age >= 29 && age <= 30, `got ${age}`)
})

test('dobToAge: YYYY-only returns plausible age', () => {
  const thisYear = new Date().getUTCFullYear()
  const age = dobToAge(String(thisYear - 50))
  assert.ok(age !== null && age >= 49 && age <= 50, `got ${age}`)
})

test('dobToAge: empty string returns null', () => {
  assert.equal(dobToAge(''), null)
})

test('dobToAge: malformed returns null', () => {
  assert.equal(dobToAge('invalid'), null)
  assert.equal(dobToAge('99-99-9999'), null)
  assert.equal(dobToAge('1800'), null)
  assert.equal(dobToAge('2200'), null)
})

// ─── Secure QR ───────────────────────────────────────────

test('parseAadhaarQr: Secure QR happy path', async () => {
  const qr = buildSecureQr(makeFields())
  const parsed = await parseAadhaarQr(qr)
  assert.equal(parsed.name, 'Sunita Devi')
  assert.equal(parsed.gender, 'F')
  assert.equal(parsed.district, 'Raipur')
  assert.equal(parsed.state, 'Chhattisgarh')
  assert.ok(parsed.age !== null && parsed.age >= 34 && parsed.age <= 36)
})

test('parseAadhaarQr: Secure QR handles UTF-8 Hindi name', async () => {
  const qr = buildSecureQr(makeFields({ 2: 'सुनीता देवी' }))
  const parsed = await parseAadhaarQr(qr)
  assert.equal(parsed.name, 'सुनीता देवी')
})

test('parseAadhaarQr: Secure QR with JPEG trailer slices cleanly', async () => {
  const qr = buildSecureQr(makeFields({ 2: 'Priya Sharma' }), true)
  const parsed = await parseAadhaarQr(qr)
  assert.equal(parsed.name, 'Priya Sharma')
  assert.equal(parsed.district, 'Raipur')
  assert.equal(parsed.state, 'Chhattisgarh')
})

test('parseAadhaarQr: Secure QR year-only DOB', async () => {
  const thisYear = new Date().getUTCFullYear()
  const qr = buildSecureQr(makeFields({ 3: String(thisYear - 40) }))
  const parsed = await parseAadhaarQr(qr)
  assert.ok(parsed.age !== null && parsed.age >= 39 && parsed.age <= 40)
})

test('parseAadhaarQr: Secure QR male gender', async () => {
  const qr = buildSecureQr(makeFields({ 4: 'M' }))
  const parsed = await parseAadhaarQr(qr)
  assert.equal(parsed.gender, 'M')
})

test('parseAadhaarQr: Secure QR missing name throws', async () => {
  const qr = buildSecureQr(makeFields({ 2: '' }))
  await assert.rejects(() => parseAadhaarQr(qr), /missing name/)
})

// ─── Legacy XML QR ───────────────────────────────────────

test('parseAadhaarQr: legacy XML PrintLetterBarcodeData', async () => {
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<PrintLetterBarcodeData uid="xxxx2345" name="Kavita Sahu" gender="F" ` +
    `dob="10-06-1988" co="" house="" street="" lm="" loc="" vtc="Raipur" ` +
    `po="Raipur" dist="Raipur" subdist="Raipur" state="Chhattisgarh" pc="492001" />`
  const parsed = await parseAadhaarQr(xml)
  assert.equal(parsed.name, 'Kavita Sahu')
  assert.equal(parsed.gender, 'F')
  assert.equal(parsed.district, 'Raipur')
  assert.equal(parsed.state, 'Chhattisgarh')
  assert.ok(parsed.age !== null && parsed.age >= 36 && parsed.age <= 38)
})

test('parseAadhaarQr: XML with yob fallback when dob missing', async () => {
  const thisYear = new Date().getUTCFullYear()
  const xml =
    `<?xml version="1.0"?>` +
    `<PrintLetterBarcodeData name="Rekha Yadav" gender="F" yob="${thisYear - 45}" ` +
    `dist="Durg" state="Chhattisgarh" />`
  const parsed = await parseAadhaarQr(xml)
  assert.equal(parsed.name, 'Rekha Yadav')
  assert.ok(parsed.age !== null && parsed.age >= 44 && parsed.age <= 45)
})

// ─── Format detection ────────────────────────────────────

test('parseAadhaarQr: unrecognized format throws', async () => {
  await assert.rejects(() => parseAadhaarQr('not a qr'), /Unrecognized/)
  await assert.rejects(() => parseAadhaarQr(''), /Unrecognized/)
  await assert.rejects(() => parseAadhaarQr('12345'), /Unrecognized/)
})
