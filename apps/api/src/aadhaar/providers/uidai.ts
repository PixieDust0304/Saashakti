import { env } from '../../config/env.js';
import { HttpError } from '../../plugins/error-handler.js';
import type { AadhaarProvider, AadhaarStatus, KycRecord } from './types.js';

/**
 * Direct UIDAI e-KYC (OTP mode) adapter.
 *
 * UIDAI's Auth/e-KYC service is SOAP-based, not REST. The flow:
 *   1. OTP request via Auth API → UIDAI sends OTP to the resident's
 *      Aadhaar-linked mobile.
 *   2. e-KYC request with OTP → returns signed XML with name, DOB,
 *      gender, address, photo.
 *
 * The XML must be decrypted using the AUA's (Authentication User
 * Agency) private key. The PID block is encrypted with UIDAI's
 * public key.
 *
 * Required env vars:
 *   AADHAAR_AUA_CODE        – 10-char AUA code issued by UIDAI
 *   AADHAAR_AUA_LICENSE_KEY – UIDAI license key (base64)
 *   AADHAAR_ASA_API_URL     – ASA (Auth Service Agency) endpoint URL
 *
 * Obtaining these requires:
 *   1. Apply for AUA/KUA at https://authportal.uidai.gov.in
 *   2. Complete compliance audit
 *   3. Obtain digital certificates from CCA
 *   4. Register biometric/OTP device specs
 *
 * This adapter is a scaffold — it defines the correct interface
 * shape and throws helpful errors until the credentials are
 * provisioned.
 */
export class UidaiAadhaarProvider implements AadhaarProvider {
  readonly name = 'uidai';

  private assertConfigured(): void {
    const missing: string[] = [];
    if (!env.AADHAAR_AUA_CODE) missing.push('AADHAAR_AUA_CODE');
    if (!env.AADHAAR_AUA_LICENSE_KEY) missing.push('AADHAAR_AUA_LICENSE_KEY');
    if (!env.AADHAAR_ASA_API_URL) missing.push('AADHAAR_ASA_API_URL');
    if (missing.length > 0) {
      throw new HttpError(
        503,
        'provider_not_configured',
        `UIDAI provider requires: ${missing.join(', ')}. See docs/aadhaar-providers.md`,
      );
    }
  }

  async startVerification(_mobileNumber: string): Promise<{ status: AadhaarStatus }> {
    this.assertConfigured();

    // In production:
    // 1. Build Auth XML with <Uses otp="y"/>
    // 2. Encrypt PID block with UIDAI public key
    // 3. POST to ASA endpoint → UIDAI sends OTP to resident's mobile
    // 4. Return 'pending' — the intake form collects the OTP next.

    throw new HttpError(
      501,
      'uidai_not_implemented',
      'Direct UIDAI integration requires SOAP PID/Auth XML generation. ' +
      'Use AADHAAR_PROVIDER=karza for a REST-based vendor path.',
    );
  }

  async getStatus(_mobileNumber: string): Promise<{ status: AadhaarStatus }> {
    return { status: 'pending' };
  }

  async fetchKyc(_aadhaarNumber: string): Promise<KycRecord> {
    this.assertConfigured();

    // In production:
    // 1. Build e-KYC XML with the resident's OTP
    // 2. Encrypt, sign, POST to ASA
    // 3. Decrypt the KYC response XML with AUA private key
    // 4. Parse <Pht>, <Poi name="">, <Poa dist="" state="" pc=""/> etc.
    // 5. Map to KycRecord

    throw new HttpError(
      501,
      'uidai_not_implemented',
      'Direct UIDAI e-KYC requires XML signing and PID encryption. ' +
      'Implement the SOAP client or use AADHAAR_PROVIDER=karza.',
    );
  }
}
