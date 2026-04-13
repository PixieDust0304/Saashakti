import { sql } from '../db/client.js';
import { toJsonb } from '../db/jsonb.js';
import { HttpError } from '../plugins/error-handler.js';
import { writeAuditLog, writeDashboardEvent } from '../audit/helper.js';

export type RegistrationMode = 'self' | 'assisted';

export interface BeneficiaryRow {
  id: number;
  mobileNumber: string;
  aadhaarStatus: string;
  registrationMode: RegistrationMode;
  createdAt: Date;
  updatedAt: Date;
}

export interface BeneficiaryProfileInput {
  name: string;
  age?: number;
  district?: string;
  maritalStatus?: string;
  casteCategory?: string;
  incomeBracket?: string;
  isBpl?: boolean;
  hasBankAccount?: boolean;
  hasRationCard?: boolean;
  isPregnant?: boolean;
  isLactating?: boolean;
  hasGirlChild?: boolean;
  isShgMember?: boolean;
  exclusionFlags?: string[];
  disability?: Record<string, unknown>;
}

export interface BeneficiaryProfileRow extends BeneficiaryProfileInput {
  beneficiaryId: number;
}

const mapBeneficiary = (row: {
  id: number;
  mobile_number: string;
  aadhaar_status: string;
  registration_mode: string;
  created_at: Date;
  updated_at: Date;
}): BeneficiaryRow => ({
  id: row.id,
  mobileNumber: row.mobile_number,
  aadhaarStatus: row.aadhaar_status,
  registrationMode: row.registration_mode as RegistrationMode,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const upsertBeneficiary = async (args: {
  mobileNumber: string;
  registrationMode: RegistrationMode;
}): Promise<{ beneficiary: BeneficiaryRow; created: boolean }> => {
  const [existing] = await sql`
    SELECT id, mobile_number, aadhaar_status, registration_mode, created_at, updated_at
    FROM beneficiaries
    WHERE mobile_number = ${args.mobileNumber}
  `;

  if (existing) {
    return { beneficiary: mapBeneficiary(existing as Parameters<typeof mapBeneficiary>[0]), created: false };
  }

  const [row] = await sql`
    INSERT INTO beneficiaries (mobile_number, aadhaar_status, registration_mode)
    VALUES (${args.mobileNumber}, 'not_started', ${args.registrationMode})
    RETURNING id, mobile_number, aadhaar_status, registration_mode, created_at, updated_at
  `;

  if (!row) throw new HttpError(500, 'insert_failed', 'Could not create beneficiary');

  const beneficiary = mapBeneficiary(row as Parameters<typeof mapBeneficiary>[0]);
  await writeAuditLog({
    actorType: 'beneficiary',
    actorId: args.mobileNumber,
    eventType: 'beneficiary_created',
    entityType: 'beneficiary',
    entityId: String(beneficiary.id),
    payload: { registrationMode: args.registrationMode },
  });
  await writeDashboardEvent({ eventType: 'beneficiary_created', beneficiaryId: beneficiary.id });

  return { beneficiary, created: true };
};

export const getBeneficiaryByMobile = async (mobileNumber: string): Promise<BeneficiaryRow | null> => {
  const [row] = await sql`
    SELECT id, mobile_number, aadhaar_status, registration_mode, created_at, updated_at
    FROM beneficiaries
    WHERE mobile_number = ${mobileNumber}
  `;
  return row ? mapBeneficiary(row as Parameters<typeof mapBeneficiary>[0]) : null;
};

export const upsertProfile = async (args: {
  beneficiaryId: number;
  profile: BeneficiaryProfileInput;
}): Promise<BeneficiaryProfileRow> => {
  const { beneficiaryId, profile } = args;

  const [row] = await sql`
    INSERT INTO beneficiary_profiles (
      beneficiary_id, name, age, district, marital_status, caste_category,
      income_bracket, is_bpl, has_bank_account, has_ration_card,
      is_pregnant, is_lactating, has_girl_child, is_shg_member,
      exclusion_flags, disability
    )
    VALUES (
      ${beneficiaryId},
      ${profile.name},
      ${profile.age ?? null},
      ${profile.district ?? null},
      ${profile.maritalStatus ?? null},
      ${profile.casteCategory ?? null},
      ${profile.incomeBracket ?? null},
      ${profile.isBpl ?? null},
      ${profile.hasBankAccount ?? null},
      ${profile.hasRationCard ?? null},
      ${profile.isPregnant ?? null},
      ${profile.isLactating ?? null},
      ${profile.hasGirlChild ?? null},
      ${profile.isShgMember ?? null},
      ${toJsonb(profile.exclusionFlags ?? [])},
      ${toJsonb(profile.disability ?? {})}
    )
    ON CONFLICT (beneficiary_id) DO UPDATE SET
      name = EXCLUDED.name,
      age = EXCLUDED.age,
      district = EXCLUDED.district,
      marital_status = EXCLUDED.marital_status,
      caste_category = EXCLUDED.caste_category,
      income_bracket = EXCLUDED.income_bracket,
      is_bpl = EXCLUDED.is_bpl,
      has_bank_account = EXCLUDED.has_bank_account,
      has_ration_card = EXCLUDED.has_ration_card,
      is_pregnant = EXCLUDED.is_pregnant,
      is_lactating = EXCLUDED.is_lactating,
      has_girl_child = EXCLUDED.has_girl_child,
      is_shg_member = EXCLUDED.is_shg_member,
      exclusion_flags = EXCLUDED.exclusion_flags,
      disability = EXCLUDED.disability
    RETURNING *
  `;

  if (!row) throw new HttpError(500, 'profile_upsert_failed', 'Could not save profile');

  await sql`UPDATE beneficiaries SET updated_at = NOW() WHERE id = ${beneficiaryId}`;

  await writeAuditLog({
    actorType: 'beneficiary',
    actorId: String(beneficiaryId),
    eventType: 'profile_upserted',
    entityType: 'beneficiary_profile',
    entityId: String(beneficiaryId),
  });

  if (profile.district) {
    await writeDashboardEvent({
      eventType: 'profile_upserted',
      district: profile.district,
      beneficiaryId,
    });
  }

  return {
    beneficiaryId,
    name: (row as { name: string }).name,
    age: (row as { age: number | null }).age ?? undefined,
    district: (row as { district: string | null }).district ?? undefined,
    maritalStatus: (row as { marital_status: string | null }).marital_status ?? undefined,
    casteCategory: (row as { caste_category: string | null }).caste_category ?? undefined,
    incomeBracket: (row as { income_bracket: string | null }).income_bracket ?? undefined,
    isBpl: (row as { is_bpl: boolean | null }).is_bpl ?? undefined,
    hasBankAccount: (row as { has_bank_account: boolean | null }).has_bank_account ?? undefined,
    hasRationCard: (row as { has_ration_card: boolean | null }).has_ration_card ?? undefined,
    isPregnant: (row as { is_pregnant: boolean | null }).is_pregnant ?? undefined,
    isLactating: (row as { is_lactating: boolean | null }).is_lactating ?? undefined,
    hasGirlChild: (row as { has_girl_child: boolean | null }).has_girl_child ?? undefined,
    isShgMember: (row as { is_shg_member: boolean | null }).is_shg_member ?? undefined,
    exclusionFlags: (row as { exclusion_flags: string[] }).exclusion_flags,
    disability: (row as { disability: Record<string, unknown> }).disability,
  };
};

export const getProfile = async (beneficiaryId: number): Promise<BeneficiaryProfileRow | null> => {
  const [row] = await sql`
    SELECT * FROM beneficiary_profiles WHERE beneficiary_id = ${beneficiaryId}
  `;
  if (!row) return null;
  const r = row as Record<string, unknown>;
  return {
    beneficiaryId,
    name: r.name as string,
    age: (r.age as number | null) ?? undefined,
    district: (r.district as string | null) ?? undefined,
    maritalStatus: (r.marital_status as string | null) ?? undefined,
    casteCategory: (r.caste_category as string | null) ?? undefined,
    incomeBracket: (r.income_bracket as string | null) ?? undefined,
    isBpl: (r.is_bpl as boolean | null) ?? undefined,
    hasBankAccount: (r.has_bank_account as boolean | null) ?? undefined,
    hasRationCard: (r.has_ration_card as boolean | null) ?? undefined,
    isPregnant: (r.is_pregnant as boolean | null) ?? undefined,
    isLactating: (r.is_lactating as boolean | null) ?? undefined,
    hasGirlChild: (r.has_girl_child as boolean | null) ?? undefined,
    isShgMember: (r.is_shg_member as boolean | null) ?? undefined,
    exclusionFlags: (r.exclusion_flags as string[]) ?? [],
    disability: (r.disability as Record<string, unknown>) ?? {},
  };
};
