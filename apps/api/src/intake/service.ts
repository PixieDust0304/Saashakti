import { sql } from '../db/client.js';
import { toJsonb } from '../db/jsonb.js';
import { HttpError } from '../plugins/error-handler.js';
import { writeAuditLog, writeDashboardEvent } from '../audit/helper.js';

export interface IntakeMatch {
  schemeId: string;
  schemeNameHi?: string;
  schemeNameEn?: string;
  eligibilityStatus: 'eligible' | 'partial' | 'not_eligible' | 'ineligible';
  annualValueInr?: number | null;
  explanationHi?: string;
  explanationEn?: string;
}

export interface IntakeInput {
  /** Raw admin-web profile JSON — stored as-is in beneficiaries.profile_json. */
  profile: Record<string, unknown>;
  /** Scheme matches already computed client-side. Persisted to matched_schemes. */
  matches?: IntakeMatch[];
  /** Optional field-worker access code; stored in audit log. */
  fieldWorkerCode?: string;
}

export interface IntakeResult {
  beneficiaryId: number;
  created: boolean;
  matchesPersisted: number;
}

const str = (v: unknown): string | null =>
  typeof v === 'string' && v.length > 0 ? v : null;

const bool = (v: unknown): boolean | null => (typeof v === 'boolean' ? v : null);

const num = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null;

const deriveMobileNumber = (profile: Record<string, unknown>): string => {
  const raw = str(profile.phone) ?? str(profile.mobileNumber) ?? str(profile.mobile_number);
  if (raw) {
    const digits = raw.replace(/\D/g, '');
    if (digits.length >= 6) return digits;
  }
  // Admin-web path doesn't always collect a phone. Synthesize a stable-ish
  // pseudo-id so the uniqueness constraint on beneficiaries.mobile_number
  // doesn't trip on repeat submits.
  return `anon-${Date.now()}-${Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, '0')}`;
};

const maritalFromRich = (raw: unknown): string | null => {
  const v = str(raw);
  if (!v) return null;
  // Admin-web uses 'unmarried' | 'married' | 'widow' | 'divorced' | 'deserted'
  // Backend expects 'single' | 'married' | 'widowed' | 'divorced' | 'separated'
  const map: Record<string, string> = {
    unmarried: 'single',
    married: 'married',
    widow: 'widowed',
    divorced: 'divorced',
    deserted: 'separated',
  };
  return map[v] ?? v;
};

const incomeBracketFromRich = (raw: unknown): string | null => {
  const v = str(raw);
  if (!v) return null;
  // Admin-web uses 'below_1l' | '1l_to_2l' | '2l_to_5l' | 'above_5l'
  // Backend schema expects 'below_50000' | '50000_100000' | ...
  const map: Record<string, string> = {
    below_1l: '50000_100000',
    '1l_to_2l': '100000_200000',
    '2l_to_5l': '200000_400000',
    above_5l: 'above_400000',
  };
  return map[v] ?? v;
};

export const submitIntake = async (input: IntakeInput): Promise<IntakeResult> => {
  const { profile, matches = [], fieldWorkerCode } = input;

  if (!profile || typeof profile !== 'object') {
    throw new HttpError(400, 'invalid_profile', 'profile must be an object');
  }

  const mobileNumber = deriveMobileNumber(profile);
  const registrationMode = fieldWorkerCode ? 'assisted' : 'self';

  return await sql.begin(async (tx) => {
    const [existing] = await tx<{ id: number }[]>`
      SELECT id FROM beneficiaries WHERE mobile_number = ${mobileNumber}
    `;

    let beneficiaryId: number;
    let created = false;

    if (existing) {
      beneficiaryId = existing.id;
      await tx`
        UPDATE beneficiaries
        SET profile_json = ${toJsonb(profile)},
            registration_mode = ${registrationMode},
            updated_at = NOW()
        WHERE id = ${beneficiaryId}
      `;
    } else {
      const [row] = await tx<{ id: number }[]>`
        INSERT INTO beneficiaries (
          mobile_number, aadhaar_status, registration_mode, profile_json
        )
        VALUES (
          ${mobileNumber}, 'not_started', ${registrationMode}, ${toJsonb(profile)}
        )
        RETURNING id
      `;
      if (!row) throw new HttpError(500, 'insert_failed', 'Could not create beneficiary');
      beneficiaryId = row.id;
      created = true;
    }

    // Write the minimal structured profile (best-effort) so dashboard aggregates
    // by district/aadhaar/etc. still work even for rich intakes.
    const name = str(profile.name) ?? 'Unknown';
    const district = str(profile.district);
    const age = num(profile.age);
    const marital = maritalFromRich(profile.marital_status ?? profile.maritalStatus);
    const caste = str(profile.caste_category ?? profile.casteCategory);
    const income = incomeBracketFromRich(profile.income_bracket ?? profile.incomeBracket);

    await tx`
      INSERT INTO beneficiary_profiles (
        beneficiary_id, name, age, district, marital_status, caste_category,
        income_bracket, is_bpl, has_bank_account, has_ration_card,
        is_pregnant, is_lactating, has_girl_child, is_shg_member,
        exclusion_flags, disability
      )
      VALUES (
        ${beneficiaryId},
        ${name},
        ${age},
        ${district},
        ${marital},
        ${caste},
        ${income},
        ${bool(profile.is_bpl ?? profile.isBpl)},
        ${bool(profile.has_bank_account ?? profile.hasBankAccount)},
        ${bool(profile.has_ration_card ?? profile.hasRationCard)},
        ${bool(profile.is_pregnant ?? profile.isPregnant)},
        ${bool(profile.is_lactating ?? profile.isLactating)},
        ${bool(profile.has_girl_child ?? profile.hasGirlChild)},
        ${bool(profile.is_shg_member ?? profile.isShgMember)},
        ${toJsonb([])},
        ${toJsonb({ hasDisability: bool(profile.has_disability ?? profile.hasDisability) ?? false })}
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
        disability = EXCLUDED.disability
    `;

    // Replace matches for this beneficiary
    await tx`DELETE FROM matched_schemes WHERE beneficiary_id = ${beneficiaryId}`;

    let matchesPersisted = 0;
    for (const m of matches) {
      const normalizedStatus =
        m.eligibilityStatus === 'not_eligible' ? 'ineligible' : m.eligibilityStatus;
      await tx`
        INSERT INTO matched_schemes (
          beneficiary_id, scheme_id, eligibility_status, confidence,
          annual_value, explanation_hi, explanation_en
        )
        VALUES (
          ${beneficiaryId},
          ${m.schemeId},
          ${normalizedStatus},
          ${null},
          ${num(m.annualValueInr) ?? 0},
          ${str(m.explanationHi)},
          ${str(m.explanationEn)}
        )
      `;
      matchesPersisted += 1;
    }

    await writeAuditLog({
      actorType: fieldWorkerCode ? 'field_worker' : 'beneficiary',
      actorId: fieldWorkerCode ?? mobileNumber,
      eventType: created ? 'intake_created' : 'intake_updated',
      entityType: 'beneficiary',
      entityId: String(beneficiaryId),
      payload: { matches: matchesPersisted, source: 'admin-web' },
    });

    await writeDashboardEvent({
      eventType: created ? 'intake_created' : 'intake_updated',
      district: district ?? undefined,
      beneficiaryId,
    });

    return { beneficiaryId, created, matchesPersisted };
  });
};
