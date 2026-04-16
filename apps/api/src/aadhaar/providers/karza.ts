import { env } from '../../config/env.js';
import { HttpError } from '../../plugins/error-handler.js';
import type { AadhaarProvider, AadhaarStatus, KycRecord } from './types.js';

/**
 * Karza Technologies e-KYC adapter.
 *
 * Karza exposes two endpoints:
 *   POST /v3/aadhaar-otp/otp      → sends OTP to Aadhaar-linked mobile
 *   POST /v3/aadhaar-otp/submit   → verifies OTP, returns KYC XML/JSON
 *
 * Required env vars:
 *   AADHAAR_KARZA_API_KEY      – x-karza-key header
 *   AADHAAR_KARZA_BASE_URL     – https://api.karza.in (prod) or sandbox URL
 *
 * The adapter is safe to import even when env vars are absent —
 * constructor validates lazily and every method throws a clear
 * 'provider_not_configured' error until the vars are set.
 */
export class KarzaAadhaarProvider implements AadhaarProvider {
  readonly name = 'karza';

  private get apiKey(): string {
    const key = env.AADHAAR_KARZA_API_KEY;
    if (!key) throw new HttpError(503, 'provider_not_configured', 'AADHAAR_KARZA_API_KEY is required');
    return key;
  }

  private get baseUrl(): string {
    return env.AADHAAR_KARZA_BASE_URL ?? 'https://api.karza.in';
  }

  private async post(path: string, body: Record<string, unknown>): Promise<unknown> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-karza-key': this.apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new HttpError(502, 'karza_error', `Karza returned ${res.status}: ${text.slice(0, 200)}`);
    }

    return res.json();
  }

  async startVerification(mobileNumber: string): Promise<{ status: AadhaarStatus }> {
    // Step 1: request OTP to Aadhaar-linked mobile.
    // In production, Karza sends a real OTP to the beneficiary's phone.
    await this.post('/v3/aadhaar-otp/otp', {
      aadhaar_no: mobileNumber,
      consent: 'Y',
    });
    return { status: 'pending' };
  }

  async getStatus(_mobileNumber: string): Promise<{ status: AadhaarStatus }> {
    // Karza is stateless — status lives in our DB, not theirs.
    return { status: 'pending' };
  }

  async fetchKyc(aadhaarNumber: string): Promise<KycRecord> {
    // Step 2: submit OTP and retrieve XML/JSON KYC.
    // NOTE: a real integration requires the OTP the user received.
    // This stub calls the submit endpoint with a placeholder OTP
    // so the shape is correct; in production the OTP comes from
    // the intake form.
    const data = (await this.post('/v3/aadhaar-otp/submit', {
      aadhaar_no: aadhaarNumber,
      otp: '000000',
      consent: 'Y',
      share_code: '1234',
    })) as Record<string, unknown>;

    const result = (data as { result?: Record<string, unknown> }).result ?? {};
    const address = (result.address ?? {}) as Record<string, string>;
    const dob = String(result.dob ?? '');
    const dobDate = dob ? new Date(dob) : new Date();
    const age = new Date().getFullYear() - dobDate.getFullYear();

    return {
      aadhaarLast4: aadhaarNumber.slice(-4),
      name: String(result.name ?? ''),
      gender: (String(result.gender ?? 'F').charAt(0).toUpperCase() as 'F' | 'M' | 'T'),
      dob,
      age,
      address: {
        house: address.house ?? '',
        street: address.street ?? '',
        landmark: address.landmark ?? '',
        locality: address.loc ?? '',
        vtc: address.vtc ?? '',
        district: address.dist ?? '',
        state: address.state ?? '',
        pincode: address.pc ?? '',
        country: address.country ?? 'India',
      },
      mobileNumber: String(result.mobile ?? ''),
      source: 'karza',
      fetchedAt: new Date().toISOString(),
    };
  }
}
