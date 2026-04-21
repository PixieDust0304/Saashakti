
export interface BeneficiaryProfile {
  age: number;
  district: string;
  residenceType: 'rural' | 'urban';
  maritalStatus: 'single' | 'married' | 'widowed' | 'divorced' | 'separated' | 'deserted';
  casteCategory: 'general' | 'obc' | 'sc' | 'st';
  annualIncome: number;
  isBpl: boolean;
  hasBankAccount: boolean;
  hasRationCard: boolean;
  ownsLand: boolean;
  ownsPuccaHouse: boolean;
  hasLpgConnection: boolean;
  isPregnant: boolean;
  isLactating: boolean;
  hasGirlChild: boolean;
  girlChildAge?: number;
  numChildren: number;
  isShgMember: boolean;
  hasPaidMaternityLeave: boolean;
  isGovtPsuEmployee: boolean;
  familyIsTaxpayer: boolean;
  familyGovtEmployee: boolean;
  familyIsElectedRep: boolean;
  familyIsBoardChair: boolean;
  hasDisability: boolean;
  disabilityPercentage?: number;
  stateDomicile?: string;
}

export type Operator = 'eq' | 'neq' | 'gte' | 'lte' | 'in' | 'includes' | 'truthy' | 'falsy';

export interface Rule {
  field: string;
  operator: Operator;
  value?: string | number | boolean | string[];
  labelHi: string;
  labelEn: string;
}

export interface Exclusion {
  field: string;
  value: boolean | string | number;
  ruleHi: string;
  ruleEn: string;
}

export interface Scheme {
  id: string;
  nameHi: string;
  nameEn: string;
  level: 'central' | 'state' | 'district';
  departmentHi: string;
  annualValueInr: number;
  benefitDescriptionHi: string;
  benefitDescriptionEn: string;
  benefitFrequency: string;
  benefitAmount: number | null;
  rules: Rule[];
  exclusions: Exclusion[];
  documentsRequired: string[];
  nextActionHi: string;
  nextActionEn: string;
  portal: string;
  tags: string[];
  priorityScore: number;
}

export type MatchStatus = 'eligible' | 'partial' | 'ineligible';

export interface MatchResult {
  schemeId: string;
  schemeNameHi: string;
  schemeNameEn: string;
  status: MatchStatus;
  matchScore: number;
  annualValueInr: number;
  matchedRules: string[];
  missingRules: string[];
  blockingRules: string[];
  nextActionHi: string;
  nextActionEn: string;
  explanationHi: string;
  explanationEn: string;
  policyConfidence: number;
  dataConfidence: number;
}
