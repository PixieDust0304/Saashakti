import type {
  BeneficiaryProfile,
  MatchResult,
  MatchStatus,
  Rule,
  Scheme,
} from '../../types/src/index.js';

export const evaluateRule = (rule: Rule, profile: BeneficiaryProfile): boolean => {
  const profileValue = profile[rule.field];

  switch (rule.operator) {
    case 'eq':
      return profileValue === rule.value;
    case 'neq':
      return profileValue !== rule.value;
    case 'gte':
      return typeof profileValue === 'number' && typeof rule.value === 'number' && profileValue >= rule.value;
    case 'lte':
      return typeof profileValue === 'number' && typeof rule.value === 'number' && profileValue <= rule.value;
    case 'in':
      return Array.isArray(rule.value) && typeof profileValue === 'string' && rule.value.includes(profileValue);
    case 'includes':
      return typeof profileValue === 'string' && typeof rule.value === 'string' && profileValue.includes(rule.value);
    case 'truthy':
      return Boolean(profileValue);
    default:
      return false;
  }
};

export const evaluateScheme = (profile: BeneficiaryProfile, scheme: Scheme): MatchResult => {
  const matchedRules: string[] = [];
  const missingRules: string[] = [];

  for (const rule of scheme.rules) {
    if (evaluateRule(rule, profile)) {
      matchedRules.push(rule.labelHi);
    } else {
      missingRules.push(rule.labelHi);
    }
  }

  const score = matchedRules.length / scheme.rules.length;
  const status = score === 1 ? 'eligible' : score >= 0.5 ? 'partial' : 'ineligible';

  return {
    schemeId: scheme.id,
    schemeNameHi: scheme.nameHi,
    schemeNameEn: scheme.nameEn,
    status,
    annualValueInr: scheme.annualValueInr,
    matchedRules,
    missingRules,
    nextActionHi: scheme.nextActionHi,
    nextActionEn: scheme.nextActionEn,
    explanationHi:
      status === 'eligible'
        ? 'आप इस योजना के लिए पात्र हैं।'
        : `कुछ शर्तें बाकी हैं: ${missingRules.join(', ')}`,
    explanationEn:
      status === 'eligible'
        ? 'You are eligible for this scheme.'
        : `Some criteria are pending: ${missingRules.join(', ')}`,
  };
};

export const matchSchemes = (profile: BeneficiaryProfile, schemes: Scheme[]): MatchResult[] =>
  schemes
    .map((scheme) => evaluateScheme(profile, scheme))
    .sort((a, b) => {
      const rank: Record<MatchStatus, number> = { eligible: 0, partial: 1, ineligible: 2 };
      return rank[a.status] - rank[b.status] || b.annualValueInr - a.annualValueInr;
    });
