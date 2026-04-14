// Aadhaar Secure QR + legacy XML QR parser. Runs fully in the browser; the
// image and decoded payload never leave the device. Never console.log PII
// from this module — it handles full e-KYC records.

export interface AadhaarParsed {
  name: string
  age: number | null
  gender: 'M' | 'F' | 'T'
  district: string
  state: string
}

export async function parseAadhaarQr(rawString: string): Promise<AadhaarParsed> {
  const trimmed = rawString.trim()
  if (isXmlQr(trimmed)) return parseXmlQr(trimmed)
  if (isSecureQr(trimmed)) return parseSecureQr(trimmed)
  throw new Error('Unrecognized Aadhaar QR format')
}

function isSecureQr(s: string): boolean {
  // Secure QR is a large pure-decimal string (typically 1000+ digits).
  return /^\d{100,}$/.test(s)
}

function isXmlQr(s: string): boolean {
  return s.startsWith('<')
}

// Convert a big-endian BigInt into a Uint8Array of raw bytes.
function bigIntToBytes(n: bigint): Uint8Array {
  if (n === 0n) return new Uint8Array([0])
  const bytes: number[] = []
  let x = n
  while (x > 0n) {
    bytes.push(Number(x & 0xffn))
    x >>= 8n
  }
  bytes.reverse()
  return new Uint8Array(bytes)
}

// UIDAI Secure QR uses standard zlib deflate (RFC 1950, with 2-byte header +
// Adler-32 checksum). Older tooling sometimes uses raw deflate — fall back to
// `deflate-raw` if the primary attempt fails.
async function zlibInflate(data: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('DecompressionStream not supported — please update your browser')
  }
  try {
    return await inflateWith(data, 'deflate')
  } catch {
    return await inflateWith(data, 'deflate-raw')
  }
}

async function inflateWith(
  data: Uint8Array,
  format: 'deflate' | 'deflate-raw',
): Promise<Uint8Array> {
  const ds = new DecompressionStream(format)
  const writer = ds.writable.getWriter()
  // Copy to a fresh ArrayBuffer-backed view so TS 5.9's stricter
  // ArrayBufferView<ArrayBuffer> constraint on writer.write() is met.
  void writer.write(new Uint8Array(data))
  void writer.close()
  const chunks: Uint8Array[] = []
  const reader = ds.readable.getReader()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (value) chunks.push(value)
  }
  const total = chunks.reduce((n, c) => n + c.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const c of chunks) {
    out.set(c, offset)
    offset += c.length
  }
  return out
}

// JPEG files always start with 0xFF 0xD8 0xFF. Use this to find where the
// photo begins in the inflated payload — we can't split the whole buffer on
// 0xFF because JPEG internals contain 0xFF marker bytes.
function findJpegStart(buf: Uint8Array): number {
  for (let i = 0; i < buf.length - 2; i++) {
    if (buf[i] === 0xff && buf[i + 1] === 0xd8 && buf[i + 2] === 0xff) return i
  }
  return -1
}

async function parseSecureQr(digits: string): Promise<AadhaarParsed> {
  const bytes = bigIntToBytes(BigInt(digits))
  const inflated = await zlibInflate(bytes)

  const jpegStart = findJpegStart(inflated)
  const textEnd = jpegStart >= 0 ? jpegStart : inflated.length
  const textSection = inflated.subarray(0, textEnd)

  const fields = splitOnFf(textSection)

  // Field layout inside Secure QR V2 (0xFF-delimited, fixed order):
  //   [0] email/mobile bitmask   [1] ref_id          [2] name
  //   [3] dob (DD-MM-YYYY|YYYY)  [4] gender (M/F/T)  [5] care_of
  //   [6] district               [7] landmark        [8] house
  //   [9] locality               [10] pincode        [11] post_office
  //   [12] state                 [13] street         [14] sub_district
  //   [15] vtc                   (+ optional email/mobile hashes after)
  const name = fields[2] ?? ''
  const dob = fields[3] ?? ''
  const genderRaw = (fields[4] ?? '').toUpperCase()
  const district = fields[6] ?? ''
  const state = fields[12] ?? ''

  if (!name) throw new Error('Aadhaar QR missing name field')

  return {
    name,
    age: dobToAge(dob),
    gender: normalizeGender(genderRaw),
    district,
    state,
  }
}

function splitOnFf(buf: Uint8Array): string[] {
  const decoder = new TextDecoder('utf-8')
  const fields: string[] = []
  let start = 0
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] === 0xff) {
      fields.push(decoder.decode(buf.subarray(start, i)))
      start = i + 1
    }
  }
  if (start < buf.length) {
    fields.push(decoder.decode(buf.subarray(start, buf.length)))
  }
  return fields
}

// The legacy Aadhaar XML QR is a single self-closing element like
// `<PrintLetterBarcodeData name="..." dob="..." dist="..." ... />`. Attribute
// extraction via regex is simpler than DOMParser and, critically, works in
// Node.js (where DOMParser isn't a global) so the parser round-trips under
// `node --test`. Browser consumers get identical behavior.
function parseXmlQr(xml: string): AadhaarParsed {
  const attr = (key: string): string => {
    const re = new RegExp(`\\s${key}=(?:"([^"]*)"|'([^']*)')`)
    const m = re.exec(xml)
    return m ? (m[1] ?? m[2] ?? '') : ''
  }

  const name = attr('name')
  const dob = attr('dob') || attr('yob')
  const genderRaw = attr('gender').toUpperCase()
  const district = attr('dist')
  const state = attr('state')

  if (!name) throw new Error('Aadhaar XML QR missing name')

  return {
    name,
    age: dobToAge(dob),
    gender: normalizeGender(genderRaw),
    district,
    state,
  }
}

function normalizeGender(raw: string): 'M' | 'F' | 'T' {
  if (raw === 'M' || raw === 'F' || raw === 'T') return raw
  return 'F'
}

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000

export function dobToAge(dob: string): number | null {
  if (!dob) return null
  const trimmed = dob.trim()

  const ddmmyyyy = /^(\d{2})-(\d{2})-(\d{4})$/.exec(trimmed)
  const yyyyOnly = /^(\d{4})$/.exec(trimmed)
  let birthMs: number | null = null

  if (ddmmyyyy) {
    const day = parseInt(ddmmyyyy[1]!, 10)
    const month = parseInt(ddmmyyyy[2]!, 10)
    const year = parseInt(ddmmyyyy[3]!, 10)
    if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
      return null
    }
    birthMs = Date.UTC(year, month - 1, day)
  } else if (yyyyOnly) {
    const year = parseInt(yyyyOnly[1]!, 10)
    if (year < 1900 || year > 2100) return null
    birthMs = Date.UTC(year, 0, 1)
  } else {
    return null
  }

  const age = Math.floor((Date.now() - birthMs) / MS_PER_YEAR)
  if (!Number.isFinite(age) || age < 0 || age > 150) return null
  return age
}
