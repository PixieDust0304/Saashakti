import { describe, it, expect } from 'vitest';
import { evaluateRule, evaluateScheme, matchSchemes, checkExclusions } from './index.js';
import type { BeneficiaryProfile, Scheme, Rule, Exclusion } from '../../types/src/index.js';

const baseProfile: BeneficiaryProfile = {
  age: 30,
  district: 'raipur',
  residenceType: 'rural',
  maritalStatus: 'married',
  casteCategory: 'obc',
  annualIncome: 80000,
  isBpl: true,
  hasBankAccount: true,
  hasRationCard: true,
  ownsLand: false,
  ownsPuccaHouse: false,
  hasLpgConnection: false,
  isPregnant: false,
  isLactating: false,
  hasGirlChild: false,
  numChildren: 2,
  isShgMember: false,
  hasPaidMaternityLeave: false,
  isGovtPsuEmployee: false,
  familyIsTaxpayer: false,
  familyGovtEmployee: false,
  familyIsElectedRep: false,
  familyIsBoardChair: false,
  hasDisability: false,
  stateDomicile: 'Chhattisgarh',
};

describe('evaluateRule', () => {
  it('handles truthy operator', () => {
    const rule: Rule = { field: 'isBpl', operator: 'truthy', labelHi: 'बीपीएल', labelEn: 'BPL' };
    expect(evaluateRule(rule, baseProfile)).toBe(true);
    expect(evaluateRule(rule, { ...baseProfile, isBpl: false })).toBe(false);
  });

  it('handles falsy operator', () => {
    const rule: Rule = { field: 'hasLpgConnection', operator: 'falsy', labelHi: 'No LPG', labelEn: 'No LPG' };
    expect(evaluateRule(rule, baseProfile)).toBe(true);
    expect(evaluateRule(rule, { ...baseProfile, hasLpgConnection: true })).toBe(false);
  });

  it('handles gte operator', () => {
    const rule: Rule = { field: 'age', operator: 'gte', value: 21, labelHi: '21+', labelEn: '21+' };
    expect(evaluateRule(rule, baseProfile)).toBe(true);
    expect(evaluateRule(rule, { ...baseProfile, age: 18 })).toBe(false);
  });

  it('handles in operator', () => {
    const rule: Rule = { field: 'maritalStatus', operator: 'in', value: ['married', 'widowed'], labelHi: 'test', labelEn: 'test' };
    expect(evaluateRule(rule, baseProfile)).toBe(true);
    expect(evaluateRule(rule, { ...baseProfile, maritalStatus: 'single' })).toBe(false);
  });
});

describe('checkExclusions', () => {
  it('returns null when no exclusion matches', () => {
    const exclusions: Exclusion[] = [
      { field: 'familyIsTaxpayer', value: true, ruleHi: 'आयकर दाता', ruleEn: 'Taxpayer' },
    ];
    expect(checkExclusions(baseProfile, exclusions)).toBeNull();
  });

  it('returns matching exclusion', () => {
    const exclusions: Exclusion[] = [
      { field: 'familyIsTaxpayer', value: true, ruleHi: 'आयकर दाता', ruleEn: 'Taxpayer' },
    ];
    const profile = { ...baseProfile, familyIsTaxpayer: true };
    const result = checkExclusions(profile, exclusions);
    expect(result).not.toBeNull();
    expect(result!.ruleEn).toBe('Taxpayer');
  });
});

describe('evaluateScheme', () => {
  const mahtariVandan: Scheme = {
    id: 'cg-mahtari-vandan',
    nameHi: 'महतारी वंदन योजना',
    nameEn: 'Mahtari Vandan Yojana',
    level: 'state',
    departmentHi: 'WCD CG',
    annualValueInr: 12000,
    benefitDescriptionHi: '₹1,000/माह',
    benefitDescriptionEn: '₹1,000/month',
    benefitFrequency: 'monthly',
    benefitAmount: 1000,
    rules: [
      { field: 'age', operator: 'gte', value: 21, labelHi: '21+', labelEn: '21+' },
      { field: 'age', operator: 'lte', value: 60, labelHi: '60-', labelEn: '60-' },
      { field: 'maritalStatus', operator: 'in', value: ['married','widowed','divorced','deserted'], labelHi: 'विवाहित', labelEn: 'Married' },
      { field: 'stateDomicile', operator: 'eq', value: 'Chhattisgarh', labelHi: 'CG निवासी', labelEn: 'CG resident' },
      { field: 'hasBankAccount', operator: 'truthy', labelHi: 'बैंक खाता', labelEn: 'Bank account' },
    ],
    exclusions: [
      { field: 'familyIsTaxpayer', value: true, ruleHi: 'आयकर दाता', ruleEn: 'Taxpayer' },
      { field: 'familyGovtEmployee', value: true, ruleHi: 'सरकारी कर्मचारी', ruleEn: 'Govt employee' },
    ],
    documentsRequired: ['Aadhaar', 'Bank Passbook'],
    nextActionHi: 'आवेदन करें',
    nextActionEn: 'Apply',
    portal: 'https://mahtarivandan.cgstate.gov.in/',
    tags: ['flagship'],
    priorityScore: 100,
  };

  it('marks eligible when all rules pass and no exclusions', () => {
    const result = evaluateScheme(baseProfile, mahtariVandan);
    expect(result.status).toBe('eligible');
    expect(result.matchScore).toBe(100);
    expect(result.blockingRules).toHaveLength(0);
  });

  it('marks ineligible when excluded', () => {
    const excluded = { ...baseProfile, familyIsTaxpayer: true };
    const result = evaluateScheme(excluded, mahtariVandan);
    expect(result.status).toBe('ineligible');
    expect(result.blockingRules.length).toBeGreaterThan(0);
  });

  it('marks ineligible when age too low', () => {
    const young = { ...baseProfile, age: 18 };
    const result = evaluateScheme(young, mahtariVandan);
    expect(result.status).not.toBe('eligible');
  });
});

describe('matchSchemes', () => {
  it('filters out ineligible schemes', () => {
    const schemes: Scheme[] = [
      {
        id: 'test-eligible', nameHi: 'T1', nameEn: 'T1', level: 'central', departmentHi: '',
        annualValueInr: 5000, benefitDescriptionHi: '', benefitDescriptionEn: '',
        benefitFrequency: 'annual', benefitAmount: 5000,
        rules: [{ field: 'isBpl', operator: 'truthy', labelHi: 'BPL', labelEn: 'BPL' }],
        exclusions: [], documentsRequired: [], nextActionHi: '', nextActionEn: '',
        portal: '', tags: [], priorityScore: 50,
      },
      {
        id: 'test-ineligible', nameHi: 'T2', nameEn: 'T2', level: 'central', departmentHi: '',
        annualValueInr: 1000, benefitDescriptionHi: '', benefitDescriptionEn: '',
        benefitFrequency: 'annual', benefitAmount: 1000,
        rules: [
          { field: 'hasDisability', operator: 'truthy', labelHi: 'विकलांग', labelEn: 'Disabled' },
          { field: 'ownsLand', operator: 'truthy', labelHi: 'भूमि', labelEn: 'Land' },
          { field: 'isPregnant', operator: 'truthy', labelHi: 'गर्भवती', labelEn: 'Pregnant' },
        ],
        exclusions: [], documentsRequired: [], nextActionHi: '', nextActionEn: '',
        portal: '', tags: [], priorityScore: 30,
      },
    ];
    const results = matchSchemes(baseProfile, schemes);
    expect(results.length).toBe(1);
    expect(results[0].schemeId).toBe('test-eligible');
  });
});
