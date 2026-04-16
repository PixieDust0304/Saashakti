import { createHash } from 'node:crypto';
import { sql } from '../../db/client.js';
import { HttpError } from '../../plugins/error-handler.js';
import type { AadhaarProvider, AadhaarStatus, KycRecord } from './types.js';

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

const pick = <T>(arr: T[], seed: number): T => arr[seed % arr.length]!;

const yearsAgo = (years: number): string => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().slice(0, 10);
};

export class MockAadhaarProvider implements AadhaarProvider {
  readonly name = 'mock';

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
    const digits = normalizeAadhaar(aadhaarNumber);
    const seed = parseInt(createHash('sha256').update(digits).digest('hex').slice(0, 8), 16);
    const isFemale = seed % 10 < 7;
    const age = 18 + (seed % 50);

    return {
      aadhaarLast4: digits.slice(-4),
      name: pick(isFemale ? FEMALE_NAMES : MALE_NAMES, seed),
      gender: isFemale ? 'F' : 'M',
      dob: yearsAgo(age),
      age,
      address: {
        house: `H. No. ${(seed % 999) + 1}`,
        street: pick(STREET_NAMES, Math.floor(seed / 300)),
        locality: `Ward ${(seed % 30) + 1}`,
        vtc: pick(VTC_NAMES, Math.floor(seed / 200)),
        district: pick(CG_DISTRICTS, Math.floor(seed / 100)),
        state: 'Chhattisgarh',
        pincode: String(491000 + (seed % 999)),
        country: 'India',
      },
      mobileNumber: `91${7000000000 + (seed % 999_999_999)}`,
      source: 'mock',
      fetchedAt: new Date().toISOString(),
    };
  }
}
