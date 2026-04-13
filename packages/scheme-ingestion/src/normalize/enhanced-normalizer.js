
import { suggestRulesFromText, extractBenefitAmount } from './enhanced-rule-suggester.js';
import { dedupeCandidates } from './dedupe.js';

export function normalizeCandidate(candidate) {
  const benefit = extractBenefitAmount(candidate.benefitSummary);
  const rules = suggestRulesFromText(
    candidate.eligibilityText,
    candidate.benefitSummary,
    candidate.rawText || ''
  );

  return {
    id: slugify(candidate.schemeName),
    nameHi: candidate.schemeName,
    nameEn: candidate.schemeName,
    level: candidate.sourceAuthority === 'central' ? 'central' : 'state',
    departmentHi: candidate.ministryOrDepartment || '',
    annualValueInr: benefit.annualValue,
    benefitDescriptionHi: (candidate.benefitSummary || '').slice(0, 300),
    benefitDescriptionEn: (candidate.benefitSummary || '').slice(0, 300),
    benefitFrequency: benefit.frequency,
    benefitAmount: benefit.amount,
    rules,
    exclusions: [],
    documentsRequired: extractDocuments(candidate.documentsRequiredText),
    nextActionHi: candidate.applicationProcessText?.slice(0, 200) || 'आधिकारिक पोर्टल पर आवेदन प्रक्रिया देखें',
    nextActionEn: candidate.applicationProcessText?.slice(0, 200) || 'See the official application process',
    portal: candidate.officialApplyUrl || candidate.sourceUrl || '',
    tags: buildTags(candidate),
    priorityScore: Math.round((candidate.confidenceScore || 0.5) * 100),
    sourceMeta: {
      sourceUrl: candidate.sourceUrl,
      authority: candidate.sourceAuthority,
      stateCode: candidate.stateCode || null,
      confidenceScore: candidate.confidenceScore,
      womenFocused: candidate.womenFocused,
      targetGroups: candidate.targetGroups || [],
      extractedAt: new Date().toISOString(),
    },
  };
}

export function normalizeAndDedupe(candidates) {
  const deduped = dedupeCandidates(candidates);
  return deduped.map(c => ({
    candidate: c,
    normalized: normalizeCandidate(c),
  }));
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function extractDocuments(text) {
  if (!text) return [];
  const docs = [];
  const patterns = [
    /aadhaar|आधार/i, /pan card|पैन कार्ड/i, /bank.*(?:pass|account)|बैंक/i,
    /ration card|राशन कार्ड/i, /income.*cert|आय प्रमाण/i, /caste.*cert|जाति प्रमाण/i,
    /domicile|निवास प्रमाण/i, /birth.*cert|जन्म प्रमाण/i, /death.*cert|मृत्यु प्रमाण/i,
    /photo|फोटो/i, /marriage.*cert|विवाह प्रमाण/i, /disability.*cert|विकलांगता प्रमाण/i,
    /mcp card|एमसीपी/i, /bpl.*cert|बीपीएल प्रमाण/i, /voter.*id|मतदाता/i,
  ];
  const names = [
    'Aadhaar Card', 'PAN Card', 'Bank Passbook', 'Ration Card', 'Income Certificate',
    'Caste Certificate', 'Domicile Certificate', 'Birth Certificate', 'Death Certificate',
    'Passport Photo', 'Marriage Certificate', 'Disability Certificate',
    'MCP Card', 'BPL Certificate', 'Voter ID',
  ];
  for (let i = 0; i < patterns.length; i++) {
    if (patterns[i].test(text)) docs.push(names[i]);
  }
  return docs.length > 0 ? docs : ['Aadhaar Card', 'Bank Account'];
}

function buildTags(candidate) {
  const tags = [];
  if (candidate.womenFocused) tags.push('women_welfare');
  if (candidate.sourceAuthority) tags.push(candidate.sourceAuthority);
  if (candidate.stateCode) tags.push(candidate.stateCode.toLowerCase());
  if (candidate.category) tags.push(candidate.category);
  const groups = candidate.targetGroups || [];
  tags.push(...groups);
  return [...new Set(tags)];
}
