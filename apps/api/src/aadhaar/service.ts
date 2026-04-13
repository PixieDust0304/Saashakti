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

export interface AadhaarProvider {
  startVerification(mobileNumber: string): Promise<{ status: AadhaarStatus }>;
  getStatus(mobileNumber: string): Promise<{ status: AadhaarStatus }>;
}

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
