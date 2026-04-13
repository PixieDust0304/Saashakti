import { createHash } from 'node:crypto';
import { sql } from '../db/client.js';
import { HttpError } from '../plugins/error-handler.js';
import { writeAuditLog } from '../audit/helper.js';

export type AadhaarStatus = 'not_started' | 'pending' | 'verified' | 'failed' | 'mock_verified';

const VALID_TRANSITIONS: Record<AadhaarStatus, AadhaarStatus[]> = {
  not_started: ['pending', 'mock_verified'],
  pending: ['verified', 'failed', 'mock_verified'],
  verified: [],
  mock_verified: ['verified'],
  failed: ['pending'],
};

/**
 * Subset of the UIDAI e-KYC payload we surface to the admin-web for
 * pre-filling the intake form. UIDAI returns more (photo, email,
 * postoffice etc.) but these are the fields the admin-web actually
 * uses today. Marital status, BPL, occupation, etc. are NOT in
 * Aadhaar — the field worker still has to collect those.
 */
export interface KycRecord {
  aadhaarLast4: string;
  name: string;
  gender: 'F' | 'M' | 'T';
  dob: string;          // YYYY-MM-DD
  age: number;
  address: {
    house?: string;
    street?: string;
    landmark?: string;
    locality?: string;
    vtc: string;        // village / town / city
    district: string;
    state: string;
    pincode: string;
    country: string;
  };
  mobileNumber?: string;
  source: 'mock' | 'uidai';
  fetchedAt: string;
}

export interface AadhaarProvider {
  startVerification(mobileNumber: string): Promise<{ status: AadhaarStatus }>;
  getStatus(mobileNumber: string): Promise<{ status: AadhaarStatus }>;
  fetchKyc(aadhaarNumber: string): Promise<KycRecord>;
}

const CG_DISTRICTS = [
  'Raipur', 'Bilaspur', 'Durg', 'Bastar', 'Korba', 'Rajnandgaon',
  'Janjgir-Champa', 'Surguja', 'Mahasamund', 'Kanker', 'Kabirdham',
  'Dhamtari', 'Jashpur', 'Raigarh', 'Balod', 'Bemetara', 'Mungeli',
  'Surajpur', 'Balrampur', 'Sukma', 'Gariaband', 'Baloda Bazar',
];

const FEMALE_NAMES = [
  'Sunita Devi', 'Kavita Sahu', 'Rekha Yadav', 'Priya Sharma', 'Anita Verma',
  'Geeta Mishra', 'Lakshmi Patel', 'Pushpa Kumari', 'Manju Devi', 'Savitri Bai',
  'Radha Sahu', 'Bharti Yadav', 'Sushila Devi', 'Mamta Sharma', 'Saraswati Bai',
];

const MALE_NAMES = [
  'Ramesh Kumar', 'Ashok Yadav', 'Suresh Sahu', 'Mohan Lal', 'Vikash Patel',
];

const VTC_NAMES = [
  'Mana', 'Tilda', 'Arang', 'Abhanpur', 'Bhilai', 'Charoda', 'Risali',
  'Kumhari', 'Patan', 'Gunderdehi', 'Gandai', 'Maro', 'Pithora',
];

const STREET_NAMES = ['MG Road', 'Station Road', 'Gandhi Chowk', 'Anganwadi Lane', 'Panchayat Bhavan Road'];

const normalizeAadhaar = (input: string): string => {
  const digits = (input ?? '').replace(/\D/g, '');
  if (digits.length !== 12) {
    throw new HttpError(400, 'invalid_aadhaar', 'Aadhaar number must be 12 digits');
  }
  return digits;
};

/** Deterministic pick from an array based on a seed digit. */
const pick = <T>(arr: T[], seed: number): T => {
  const item = arr[seed % arr.length];
  if (item === undefined) {
    throw new Error('pick: empty array');
  }
  return item;
};

const yearsAgo = (years: number): string => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().slice(0, 10);
};

const mockKyc = (aadhaarNumber: string): KycRecord => {
  const digits = normalizeAadhaar(aadhaarNumber);
  const seed = parseInt(createHash('sha256').update(digits).digest('hex').slice(0, 8), 16);

  // 70% female to reflect the women-welfare focus
  const isFemale = seed % 10 < 7;
  const gender: KycRecord['gender'] = isFemale ? 'F' : 'M';
  const namePool = isFemale ? FEMALE_NAMES : MALE_NAMES;

  const age = 18 + (seed % 50);   // 18-67
  const district = pick(CG_DISTRICTS, Math.floor(seed / 100));
  const vtc = pick(VTC_NAMES, Math.floor(seed / 200));
  const street = pick(STREET_NAMES, Math.floor(seed / 300));
  const houseNumber = (seed % 999) + 1;
  const pincodeBase = 491000 + (seed % 999); // CG range starts ~491

  return {
    aadhaarLast4: digits.slice(-4),
    name: pick(namePool, seed),
    gender,
    dob: yearsAgo(age),
    age,
    address: {
      house: `H. No. ${houseNumber}`,
      street,
      locality: `Ward ${(seed % 30) + 1}`,
      vtc,
      district,
      state: 'Chhattisgarh',
      pincode: String(pincodeBase),
      country: 'India',
    },
    mobileNumber: `91${(7000000000 + (seed % 999_999_999))}`,
    source: 'mock',
    fetchedAt: new Date().toISOString(),
  };
};

class MockAadhaarProvider implements AadhaarProvider {
  async startVerification(_mobileNumber: string) {
    return { status: 'mock_verified' as AadhaarStatus };
  }
  async getStatus(mobileNumber: string) {
    const [row] = await sql<{ aadhaar_status: AadhaarStatus }[]>`
      SELECT aadhaar_status FROM beneficiaries WHERE mobile_number = ${mobileNumber}
    `;
    return { status: row?.aadhaar_status ?? 'not_started' };
  }
  async fetchKyc(aadhaarNumber: string): Promise<KycRecord> {
    return mockKyc(aadhaarNumber);
  }
}

export const aadhaarProvider: AadhaarProvider = new MockAadhaarProvider();

export const updateAadhaarStatus = async (
  mobileNumber: string,
  next: AadhaarStatus,
): Promise<{ status: AadhaarStatus }> => {
  const [existing] = await sql<{ id: number; aadhaar_status: AadhaarStatus }[]>`
    SELECT id, aadhaar_status FROM beneficiaries WHERE mobile_number = ${mobileNumber}
  `;

  const current: AadhaarStatus = existing?.aadhaar_status ?? 'not_started';

  if (current === next) return { status: current };

  const allowed = VALID_TRANSITIONS[current];
  if (!allowed.includes(next)) {
    throw new HttpError(
      409,
      'invalid_aadhaar_transition',
      `Cannot transition Aadhaar status from ${current} to ${next}`,
    );
  }

  if (!existing) {
    throw new HttpError(404, 'beneficiary_not_found', 'Create a beneficiary record before updating Aadhaar status');
  }

  await sql`
    UPDATE beneficiaries
    SET aadhaar_status = ${next}, updated_at = NOW()
    WHERE id = ${existing.id}
  `;

  await writeAuditLog({
    actorType: 'beneficiary',
    actorId: mobileNumber,
    eventType: 'aadhaar_status_changed',
    entityType: 'beneficiary',
    entityId: String(existing.id),
    payload: { from: current, to: next },
  });

  return { status: next };
};
