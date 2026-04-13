export type AadhaarStatus =
  | 'not_started'
  | 'pending'
  | 'verified'
  | 'failed'
  | 'mock_verified';

export interface BeneficiaryProfile {
  age: number;
  district: string;
  maritalStatus: 'single' | 'married' | 'widowed' | 'divorced' | 'separated';
  casteCategory: 'general' | 'obc' | 'sc' | 'st';
  annualIncome: number;
  isBpl: boolean;
  hasBankAccount: boolean;
  hasRationCard: boolean;
  isPregnant: boolean;
  isLactating: boolean;
  isShgMember: boolean;
  hasDisability: boolean;
}

export type Operator = 'eq' | 'neq' | 'gte' | 'lte' | 'in' | 'includes' | 'truthy';

export interface Rule {
  field: keyof BeneficiaryProfile;
  operator: Operator;
  value?: string | number | boolean | string[];
  labelHi: string;
  labelEn: string;
}

export interface Scheme {
  id: string;
  nameHi: string;
  nameEn: string;
  annualValueInr: number;
  rules: Rule[];
  nextActionHi: string;
  nextActionEn: string;
}

export type MatchStatus = 'eligible' | 'partial' | 'ineligible';

export interface MatchResult {
  schemeId: string;
  schemeNameHi: string;
  schemeNameEn: string;
  status: MatchStatus;
  annualValueInr: number;
  matchedRules: string[];
  missingRules: string[];
  nextActionHi: string;
  nextActionEn: string;
  explanationHi: string;
  explanationEn: string;
}
