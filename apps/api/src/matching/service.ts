import { matchSchemes } from '@saashakti/scheme-engine';
import { schemeRegistry } from '@saashakti/scheme-registry';
import type { BeneficiaryProfile, MatchResult, Scheme } from '@saashakti/types';
import { sql } from '../db/client.js';
import { HttpError } from '../plugins/error-handler.js';
import { getProfile, type BeneficiaryProfileRow } from '../beneficiary/service.js';
import { writeAuditLog, writeDashboardEvent } from '../audit/helper.js';

const INCOME_BRACKET_TO_ANNUAL: Record<string, number> = {
  below_1l: 80000,
  '1l_to_2l': 150000,
  '2l_to_5l': 350000,
  above_5l: 800000,
  below_50000: 40000,
  '50000_100000': 75000,
  '100000_200000': 150000,
  '200000_400000': 300000,
  above_400000: 500000,
};

const incomeFromBracket = (bracket?: string): number => {
  if (!bracket) return 0;
  return INCOME_BRACKET_TO_ANNUAL[bracket] ?? 0;
};

const toMatchProfile = (row: BeneficiaryProfileRow): BeneficiaryProfile => ({
  age: row.age ?? 0,
  district: row.district ?? '',
  residenceType: 'rural',
  maritalStatus: (row.maritalStatus as BeneficiaryProfile['maritalStatus']) ?? 'single',
  casteCategory: (row.casteCategory as BeneficiaryProfile['casteCategory']) ?? 'general',
  annualIncome: incomeFromBracket(row.incomeBracket),
  isBpl: row.isBpl ?? false,
  hasBankAccount: row.hasBankAccount ?? false,
  hasRationCard: row.hasRationCard ?? false,
  ownsLand: false,
  ownsPuccaHouse: false,
  hasLpgConnection: false,
  isPregnant: row.isPregnant ?? false,
  isLactating: row.isLactating ?? false,
  hasGirlChild: row.hasGirlChild ?? false,
  numChildren: 0,
  isShgMember: row.isShgMember ?? false,
  hasPaidMaternityLeave: false,
  isGovtPsuEmployee: false,
  familyIsTaxpayer: (row.exclusionFlags ?? []).includes('family_taxpayer'),
  familyGovtEmployee: (row.exclusionFlags ?? []).includes('family_govt_employee'),
  familyIsElectedRep: (row.exclusionFlags ?? []).includes('family_elected_rep'),
  familyIsBoardChair: (row.exclusionFlags ?? []).includes('family_board_chair'),
  hasDisability: Object.keys(row.disability ?? {}).length > 0,
  stateDomicile: 'Chhattisgarh',
});

export const runMatching = async (beneficiaryId: number): Promise<MatchResult[]> => {
  const profileRow = await getProfile(beneficiaryId);
  if (!profileRow) {
    throw new HttpError(400, 'profile_missing', 'Profile must be saved before running matching');
  }

  const profile = toMatchProfile(profileRow);
  const schemes = schemeRegistry.schemes as unknown as Scheme[];
  const results = matchSchemes(profile, schemes);

  await sql.begin(async (tx) => {
    await tx`DELETE FROM matched_schemes WHERE beneficiary_id = ${beneficiaryId}`;
    for (const r of results) {
      const confidence = r.matchScore / 100;
      await tx`
        INSERT INTO matched_schemes (
          beneficiary_id, scheme_id, eligibility_status, confidence,
          annual_value, explanation_hi, explanation_en
        )
        VALUES (
          ${beneficiaryId},
          ${r.schemeId},
          ${r.status},
          ${confidence},
          ${r.annualValueInr},
          ${r.explanationHi},
          ${r.explanationEn}
        )
      `;
    }
  });

  await writeAuditLog({
    actorType: 'beneficiary',
    actorId: String(beneficiaryId),
    eventType: 'matching_run',
    entityType: 'beneficiary',
    entityId: String(beneficiaryId),
    payload: { count: results.length, eligible: results.filter(r => r.status === 'eligible').length },
  });

  await writeDashboardEvent({
    eventType: 'matching_run',
    district: profileRow.district,
    beneficiaryId,
  });

  return results;
};

export const getMatchesForBeneficiary = async (beneficiaryId: number): Promise<MatchResult[]> => {
  const rows = await sql<
    {
      scheme_id: string;
      eligibility_status: string;
      confidence: string;
      annual_value: string;
      explanation_hi: string;
      explanation_en: string;
    }[]
  >`
    SELECT scheme_id, eligibility_status, confidence, annual_value, explanation_hi, explanation_en
    FROM matched_schemes
    WHERE beneficiary_id = ${beneficiaryId}
    ORDER BY annual_value DESC
  `;

  const schemes = schemeRegistry.schemes as unknown as Scheme[];
  const registryById = new Map(schemes.map((s) => [s.id, s]));

  return rows.map((row) => {
    const scheme = registryById.get(row.scheme_id);
    return {
      schemeId: row.scheme_id,
      schemeNameHi: scheme?.nameHi ?? row.scheme_id,
      schemeNameEn: scheme?.nameEn ?? row.scheme_id,
      status: row.eligibility_status as MatchResult['status'],
      matchScore: Math.round(Number(row.confidence) * 100),
      annualValueInr: Number(row.annual_value),
      matchedRules: [],
      missingRules: [],
      blockingRules: [],
      nextActionHi: scheme?.nextActionHi ?? '',
      nextActionEn: scheme?.nextActionEn ?? '',
      explanationHi: row.explanation_hi,
      explanationEn: row.explanation_en,
      policyConfidence: 0.9,
      dataConfidence: Number(row.confidence),
    };
  });
};
