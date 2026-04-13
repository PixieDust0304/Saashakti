import type { BeneficiaryProfile, Scheme, SchemeMatch, SchemeExclusion } from './types'

const INCOME_MAP: Record<string, number> = {
  'below_1l': 80000,
  '1l_to_2l': 150000,
  '2l_to_5l': 350000,
  'above_5l': 800000,
}

export function matchSchemes(profile: BeneficiaryProfile, schemes: Scheme[]): SchemeMatch[] {
  return schemes
    .map(scheme => evaluateScheme(profile, scheme))
    .filter(m => m.eligibility_status !== 'not_eligible')
    .sort((a, b) => {
      const statusOrder = { eligible: 3, partial: 2, not_eligible: 1 }
      const diff = statusOrder[b.eligibility_status] - statusOrder[a.eligibility_status]
      if (diff !== 0) return diff
      return b.match_score - a.match_score
    })
}

function evaluateScheme(profile: BeneficiaryProfile, scheme: Scheme): SchemeMatch {
  const matched: string[] = []
  const missing: string[] = []
  const blocking: string[] = []
  const elig = scheme.eligibility
  let totalChecks = 0

  // --- POSITIVE CRITERIA ---

  // Gender
  if (elig.gender === 'female') {
    totalChecks++
    if (profile.gender === 'female') matched.push('gender')
    else blocking.push('gender')
  }

  // Age range
  if (elig.min_age !== null) {
    totalChecks++
    if (profile.age >= elig.min_age) matched.push('min_age')
    else blocking.push('min_age')
  }
  if (elig.max_age !== null) {
    totalChecks++
    if (profile.age <= elig.max_age) matched.push('max_age')
    else blocking.push('max_age')
  }

  // Marital status
  if (elig.marital_status !== null && elig.marital_status.length > 0) {
    totalChecks++
    if (elig.marital_status.includes(profile.marital_status)) matched.push('marital_status')
    else blocking.push('marital_status')
  }

  // State domicile
  if (elig.state_domicile) {
    totalChecks++
    if (profile.state === elig.state_domicile) matched.push('state_domicile')
    else blocking.push('state_domicile')
  }

  // Residence type
  if (elig.residence_type) {
    totalChecks++
    if (profile.residence_type === elig.residence_type) matched.push('residence_type')
    else blocking.push('residence_type')
  }

  // BPL
  if (elig.is_bpl === true) {
    totalChecks++
    if (profile.is_bpl) matched.push('is_bpl')
    else blocking.push('is_bpl')
  }

  // Pregnancy
  if (elig.is_pregnant === true) {
    totalChecks++
    if (profile.is_pregnant) matched.push('is_pregnant')
    else blocking.push('is_pregnant')
  }

  // Lactating
  if (elig.is_lactating === true) {
    totalChecks++
    if (profile.is_lactating) matched.push('is_lactating')
    else blocking.push('is_lactating')
  }

  // Bank account
  if (elig.requires_bank_account === true) {
    totalChecks++
    if (profile.has_bank_account) matched.push('has_bank_account')
    else missing.push('has_bank_account')
  }

  // LPG (Ujjwala)
  if (elig.no_existing_lpg === true) {
    totalChecks++
    if (!profile.has_lpg_connection) matched.push('no_lpg')
    else blocking.push('has_lpg')
  }

  // Housing (PMAY)
  if (elig.is_houseless === true) {
    totalChecks++
    if (!profile.owns_pucca_house) matched.push('no_pucca_house')
    else blocking.push('owns_pucca_house')
  }

  // Girl child
  if (elig.has_girl_child === true) {
    totalChecks++
    if (profile.has_girl_child) matched.push('has_girl_child')
    else blocking.push('no_girl_child')
  }

  // Girl child age limit
  if (elig.girl_child_max_age !== undefined && profile.has_girl_child && profile.girl_child_age !== undefined) {
    totalChecks++
    if (profile.girl_child_age <= elig.girl_child_max_age) matched.push('girl_child_age')
    else blocking.push('girl_child_too_old')
  }

  // SHG membership
  if (elig.is_shg_member === true) {
    totalChecks++
    if (profile.is_shg_member) matched.push('is_shg_member')
    else blocking.push('not_shg_member')
  }

  // Land ownership (PM Kisan)
  if (elig.owns_land === true) {
    totalChecks++
    if (profile.owns_land) matched.push('owns_land')
    else blocking.push('no_land')
  }

  // Disability
  if (elig.has_disability === true) {
    totalChecks++
    if (profile.has_disability) matched.push('has_disability')
    else blocking.push('no_disability')
  }

  if (elig.min_disability_percentage && profile.has_disability) {
    totalChecks++
    if ((profile.disability_percentage || 0) >= elig.min_disability_percentage) matched.push('disability_pct')
    else missing.push('disability_pct_low')
  }

  // Caste category
  if (elig.caste_category && elig.caste_category.length > 0) {
    totalChecks++
    if (elig.caste_category.includes(profile.caste_category)) matched.push('caste_category')
    else blocking.push('caste_category')
  }

  // Income ceiling
  if (elig.income_ceiling_annual !== undefined && elig.income_ceiling_annual !== null) {
    totalChecks++
    const estimated = INCOME_MAP[profile.income_bracket] || 0
    if (estimated <= elig.income_ceiling_annual) matched.push('income')
    else blocking.push('income_too_high')
  }

  // --- EXCLUSION CHECKS ---
  const excludedBy = checkExclusions(profile, scheme.exclusions)

  if (excludedBy) {
    blocking.push(`excluded: ${excludedBy.rule_en}`)
  }

  // --- SCORING ---
  const matchedCount = matched.length
  const blockingCount = blocking.length
  const missingCount = missing.length

  const match_score = totalChecks > 0
    ? Math.round((matchedCount / totalChecks) * 100)
    : 0

  // Determine status
  let eligibility_status: 'eligible' | 'partial' | 'not_eligible'
  if (excludedBy) {
    eligibility_status = 'not_eligible'
  } else if (blockingCount === 0 && missingCount === 0) {
    eligibility_status = 'eligible'
  } else if (blockingCount === 0 && missingCount > 0) {
    eligibility_status = 'partial' // eligible if missing data is provided
  } else if (blockingCount <= 1 && matchedCount >= 3) {
    eligibility_status = 'partial'
  } else {
    eligibility_status = 'not_eligible'
  }

  // --- EXPLAINABILITY ---
  const explanation_hi = buildExplanationHi(scheme, matched, blocking, missing, excludedBy)
  const explanation_en = buildExplanationEn(scheme, matched, blocking, missing, excludedBy)

  // --- CONFIDENCE ---
  const policy_confidence = scheme.policy_meta ? 0.9 : 0.7
  const data_confidence = missingCount === 0 ? 0.95 : Math.max(0.5, 1 - (missingCount * 0.15))

  // --- NEXT BEST ACTION ---
  const next_best_action = getNextAction(eligibility_status, missing, blocking, scheme)

  return {
    scheme_id: scheme.id,
    scheme,
    eligibility_status,
    match_score,
    matched_criteria: matched,
    missing_criteria: missing,
    blocking_criteria: blocking,
    explanation_hi,
    explanation_en,
    policy_confidence,
    data_confidence,
    next_best_action,
  }
}

function checkExclusions(
  profile: BeneficiaryProfile,
  exclusions: SchemeExclusion[]
): SchemeExclusion | null {
  for (const excl of exclusions) {
    const val = (profile as Record<string, unknown>)[excl.field]
    if (val === excl.value) return excl
  }
  return null
}

function buildExplanationHi(
  scheme: Scheme,
  matched: string[],
  blocking: string[],
  missing: string[],
  excluded: SchemeExclusion | null
): string {
  if (scheme.explainability) {
    if (blocking.length === 0 && !excluded) return scheme.explainability.why_eligible_hi
    return scheme.explainability.why_not_eligible_hi
  }

  if (excluded) return `अपात्र: ${excluded.rule_hi}`
  if (blocking.length === 0) return `आप ${scheme.name_hi} के लिए पात्र हैं।`
  if (blocking.length <= 1) return `${scheme.name_hi} के लिए आंशिक पात्रता — कुछ शर्तें पूरी नहीं हुईं।`
  return `${scheme.name_hi} के लिए पात्रता शर्तें पूरी नहीं हुईं।`
}

function buildExplanationEn(
  scheme: Scheme,
  matched: string[],
  blocking: string[],
  missing: string[],
  excluded: SchemeExclusion | null
): string {
  if (scheme.explainability) {
    if (blocking.length === 0 && !excluded) return scheme.explainability.why_eligible_en
    return scheme.explainability.why_not_eligible_en
  }

  if (excluded) return `Not eligible: ${excluded.rule_en}`
  if (blocking.length === 0) return `You are eligible for ${scheme.name_en}.`
  if (blocking.length <= 1) return `Partial eligibility for ${scheme.name_en} — some criteria not met.`
  return `Eligibility criteria for ${scheme.name_en} not met.`
}

function getNextAction(
  status: string,
  missing: string[],
  blocking: string[],
  scheme: Scheme
): string {
  if (status === 'eligible') {
    if (scheme.portal) return `Apply at ${scheme.portal}`
    return 'Visit nearest application center'
  }
  if (missing.includes('has_bank_account')) return 'Open a bank account (Jan Dhan Yojana)'
  if (blocking.includes('is_bpl')) return 'Check BPL eligibility status'
  return 'Contact local Anganwadi or block office for guidance'
}

// Utility: calculate total annual benefit from matches
export function calculateTotalBenefit(matches: SchemeMatch[]): number {
  return matches
    .filter(m => m.eligibility_status === 'eligible')
    .reduce((sum, m) => sum + (m.scheme.benefit.annual_value || 0), 0)
}
