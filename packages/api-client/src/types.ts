import type { AadhaarStatus, MatchResult } from '@saashakti/types';

export type { AadhaarStatus, MatchResult };
export type {
  BeneficiaryProfile as EngineProfile,
  MatchStatus,
  Rule,
  Scheme,
} from '@saashakti/types';

export type MaritalStatus = 'single' | 'married' | 'widowed' | 'divorced' | 'separated';
export type CasteCategory = 'general' | 'obc' | 'sc' | 'st';
export type IncomeBracket =
  | 'below_50000'
  | '50000_100000'
  | '100000_200000'
  | '200000_400000'
  | 'above_400000';
export type RegistrationMode = 'self' | 'assisted';

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export interface Session {
  token: string;
  expiresAt: string;
}

export interface OtpRequestResponse {
  mobileNumber: string;
  expiresInSeconds: number;
  cooldownSeconds: number;
  /** Only present when the API is running in OTP_MODE=mock. */
  mockCode?: string;
}

export interface OtpVerifyResponse {
  mobileNumber: string;
  session: Session;
}

export interface Beneficiary {
  id: number;
  mobileNumber: string;
  aadhaarStatus: AadhaarStatus;
  registrationMode: RegistrationMode;
  createdAt: string;
  updatedAt: string;
}

export interface BeneficiaryProfilePayload {
  name: string;
  age?: number;
  district?: string;
  maritalStatus?: MaritalStatus;
  casteCategory?: CasteCategory;
  incomeBracket?: IncomeBracket;
  isBpl?: boolean;
  hasBankAccount?: boolean;
  hasRationCard?: boolean;
  isPregnant?: boolean;
  isLactating?: boolean;
  hasGirlChild?: boolean;
  isShgMember?: boolean;
  exclusionFlags?: string[];
  disability?: Record<string, unknown>;
}

export interface BeneficiaryProfileRecord extends BeneficiaryProfilePayload {
  beneficiaryId: number;
}

export interface CreateBeneficiaryResponse {
  beneficiary: Beneficiary;
  created: boolean;
}

export interface GetMeResponse {
  beneficiary: Beneficiary;
  profile: BeneficiaryProfileRecord | null;
}

export interface RunMatchingResponse {
  results: MatchResult[];
}

export interface DashboardTotals {
  beneficiaries: number;
  profiles: number;
  matches: number;
  last24hBeneficiaries: number;
}

export interface DashboardSummary {
  totals: DashboardTotals;
  byDistrict: Array<{ district: string; count: number }>;
  byAadhaarStatus: Array<{ status: string; count: number }>;
  generatedAt: string;
}

export interface DashboardRecentEntry {
  beneficiaryId: number;
  mobileNumber: string;
  district: string | null;
  aadhaarStatus: AadhaarStatus;
  createdAt: string;
}

export interface DashboardRecentResponse {
  entries: DashboardRecentEntry[];
}

export interface HealthResponse {
  status: 'ok';
  time: string;
}

export interface ReadyResponse {
  status: 'ready' | 'degraded';
  checks: Record<string, { ok: boolean; error?: string }>;
}
