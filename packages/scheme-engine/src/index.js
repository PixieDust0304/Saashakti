export const evaluateRule = (rule, profile) => {
  const profileValue = profile[rule.field];
  switch (rule.operator) {
    case 'eq': return profileValue === rule.value;
    case 'neq': return profileValue !== rule.value;
    case 'gte': return typeof profileValue === 'number' && typeof rule.value === 'number' && profileValue >= rule.value;
    case 'lte': return typeof profileValue === 'number' && typeof rule.value === 'number' && profileValue <= rule.value;
    case 'in': return Array.isArray(rule.value) && typeof profileValue === 'string' && rule.value.includes(profileValue);
    case 'includes': return typeof profileValue === 'string' && typeof rule.value === 'string' && profileValue.includes(rule.value);
    case 'truthy': return Boolean(profileValue);
    case 'falsy': return !profileValue;
    default: return false;
  }
};

export const checkExclusions = (profile, exclusions) => {
  for (const excl of exclusions) {
    const val = profile[excl.field];
    if (val === excl.value) return excl;
  }
  return null;
};

export const evaluateScheme = (profile, scheme) => {
  const matchedRules = [];
  const missingRules = [];
  const blockingRules = [];

  for (const rule of scheme.rules) {
    if (evaluateRule(rule, profile)) matchedRules.push(rule.labelHi);
    else missingRules.push(rule.labelHi);
  }

  const excludedBy = checkExclusions(profile, scheme.exclusions || []);
  if (excludedBy) blockingRules.push(excludedBy.ruleHi);

  const totalRules = scheme.rules.length;
  const score = totalRules > 0 ? matchedRules.length / totalRules : 0;
  const matchScore = Math.round(score * 100);

  let status;
  if (excludedBy) status = 'ineligible';
  else if (missingRules.length === 0) status = 'eligible';
  else if (score >= 0.5 && missingRules.length <= 2) status = 'partial';
  else status = 'ineligible';

  let explanationHi, explanationEn;
  if (excludedBy) {
    explanationHi = `अपात्र: ${excludedBy.ruleHi}`;
    explanationEn = `Not eligible: ${excludedBy.ruleEn}`;
  } else if (status === 'eligible') {
    explanationHi = `आप ${scheme.nameHi} के लिए पात्र हैं।`;
    explanationEn = `You are eligible for ${scheme.nameEn}.`;
  } else if (status === 'partial') {
    explanationHi = `${scheme.nameHi} — आंशिक पात्रता। बाकी: ${missingRules.join(', ')}`;
    explanationEn = `${scheme.nameEn} — partial. Pending: ${missingRules.join(', ')}`;
  } else {
    explanationHi = `${scheme.nameHi} — पात्रता शर्तें पूरी नहीं हुईं।`;
    explanationEn = `${scheme.nameEn} — criteria not met.`;
  }

  return {
    schemeId: scheme.id, schemeNameHi: scheme.nameHi, schemeNameEn: scheme.nameEn,
    status, matchScore, annualValueInr: scheme.annualValueInr,
    matchedRules, missingRules, blockingRules,
    nextActionHi: scheme.nextActionHi, nextActionEn: scheme.nextActionEn,
    explanationHi, explanationEn,
    policyConfidence: 0.9,
    dataConfidence: missingRules.length === 0 ? 0.95 : Math.max(0.5, 1 - missingRules.length * 0.15),
  };
};

export const matchSchemes = (profile, schemes) =>
  schemes
    .map((scheme) => evaluateScheme(profile, scheme))
    .filter((r) => r.status !== 'ineligible')
    .sort((a, b) => {
      const rank = { eligible: 0, partial: 1, ineligible: 2 };
      return rank[a.status] - rank[b.status] || b.annualValueInr - a.annualValueInr;
    });
