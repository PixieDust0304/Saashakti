import { suggestRules } from './rule-suggester.js';

export function normalizeCandidateToRegistryScheme(candidate) {
  return {
    id: slugify(candidate.schemeName),
    nameHi: candidate.schemeName,
    nameEn: candidate.schemeName,
    level: candidate.sourceAuthority === 'central' ? 'central' : candidate.stateCode ? 'state' : 'district',
    departmentHi: '',
    annualValueInr: estimateAnnualValue(candidate.benefitSummary),
    benefitDescriptionHi: candidate.benefitSummary || '',
    benefitDescriptionEn: candidate.benefitSummary || '',
    benefitFrequency: 'one_time',
    benefitAmount: null,
    rules: suggestRules(candidate),
    exclusions: [],
    documentsRequired: [],
    nextActionHi: candidate.applicationProcessText || 'आधिकारिक पोर्टल पर आवेदन प्रक्रिया देखें',
    nextActionEn: candidate.applicationProcessText || 'See the official application process',
    portal: candidate.officialApplyUrl || candidate.sourceUrl,
    tags: [candidate.womenFocused ? 'women_welfare' : 'general', candidate.sourceAuthority],
    priorityScore: Math.round((candidate.confidenceScore || 0.5) * 100),
    sourceMeta: {
      sourceUrl: candidate.sourceUrl,
      authority: candidate.sourceAuthority,
      stateCode: candidate.stateCode || null,
      confidenceScore: candidate.confidenceScore,
      womenFocused: candidate.womenFocused,
    },
  };
}

function slugify(value) {
  return String(value || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

function estimateAnnualValue(text) {
  if (!text) return 0;
  const match = String(text).match(/(?:₹|rs\.?|rupees?)\s?(\d[\d,]*)/i);
  if (!match) return 0;
  return Number(match[1].replace(/,/g, '')) || 0;
}
