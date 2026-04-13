// ========== BENEFICIARY PROFILE ==========
export interface BeneficiaryProfile {
  id?: string
  created_at?: string
  field_worker_id?: string

  name: string
  age: number
  gender: 'female'
  phone?: string

  state: 'Chhattisgarh'
  district: string
  block?: string
  residence_type: 'rural' | 'urban'

  caste_category: 'general' | 'obc' | 'sc' | 'st'
  marital_status: 'unmarried' | 'married' | 'widow' | 'divorced' | 'deserted'

  income_bracket: 'below_1l' | '1l_to_2l' | '2l_to_5l' | 'above_5l'
  is_bpl: boolean
  has_ration_card: boolean
  ration_card_type?: 'antyodaya' | 'priority' | 'non_priority'
  has_bank_account: boolean
  has_jan_dhan_account: boolean
  owns_land: boolean
  owns_pucca_house: boolean
  has_lpg_connection: boolean

  num_children: number
  youngest_child_age?: number
  is_pregnant: boolean
  is_lactating: boolean
  pregnancy_child_number?: number
  has_girl_child: boolean
  girl_child_age?: number

  occupation?: string
  is_shg_member: boolean
  has_paid_maternity_leave: boolean
  is_govt_psu_employee: boolean

  family_is_taxpayer: boolean
  family_govt_employee: boolean
  family_is_elected_rep: boolean
  family_is_board_chair: boolean

  has_disability: boolean
  disability_percentage?: number

  // computed after matching
  total_schemes_matched?: number
  total_annual_benefit?: number
}

// ========== SCHEME ==========
export interface Scheme {
  id: string
  name_en: string
  name_hi: string
  level: 'central' | 'state' | 'district'
  state: string
  department_hi: string
  benefit: SchemeBenefit
  eligibility: SchemeEligibility
  exclusions: SchemeExclusion[]
  documents_required: string[]
  portal: string
  tags: string[]
  priority_score: number
  application?: SchemeApplication
  tracking?: SchemeTracking
  explainability?: SchemeExplainability
  policy_meta?: SchemePolicyMeta
  priority_reason?: string
}

export interface SchemeBenefit {
  type: 'cash_transfer' | 'subsidy' | 'in_kind' | 'service' | 'insurance' | 'savings'
  amount: number | null
  frequency: string
  annual_value: number | null
  disbursement: string
  description_en: string
  description_hi: string
}

export interface SchemeEligibility {
  gender: 'female' | 'any'
  min_age: number | null
  max_age: number | null
  marital_status: string[] | null
  state_domicile: string | null
  residence_type?: string | null
  is_bpl?: boolean
  is_pregnant?: boolean
  is_lactating?: boolean
  is_shg_member?: boolean
  requires_bank_account?: boolean
  has_disability?: boolean
  min_disability_percentage?: number
  caste_category?: string[]
  income_ceiling_annual?: number | null
  no_existing_lpg?: boolean
  is_houseless?: boolean
  has_girl_child?: boolean
  girl_child_max_age?: number
  owns_land?: boolean
  additional_rules: string[]
}

export interface SchemeExclusion {
  rule_en: string
  rule_hi: string
  field: string
  value: boolean | string | number
}

export interface SchemeApplication {
  mode: string[]
  steps: string[]
  timeline_days: number
  department_contact: string
  requires_physical_visit: boolean
}

export interface SchemeTracking {
  trackable: boolean
  status_stages: string[]
}

export interface SchemeExplainability {
  why_eligible_hi: string
  why_eligible_en: string
  why_not_eligible_hi: string
  why_not_eligible_en: string
}

export interface SchemePolicyMeta {
  source: string
  version: string
  last_verified: string
  verified_by: string
}

// ========== MATCH RESULT ==========
export interface SchemeMatch {
  scheme_id: string
  scheme: Scheme
  eligibility_status: 'eligible' | 'partial' | 'not_eligible'
  match_score: number
  matched_criteria: string[]
  missing_criteria: string[]
  blocking_criteria: string[]
  explanation_hi: string
  explanation_en: string
  policy_confidence: number
  data_confidence: number
  next_best_action: string
}

// ========== FIELD WORKER ==========
export interface FieldWorker {
  id: string
  name: string
  access_code: string
  phone?: string
  district: string
  block?: string
  organization?: string
  registrations_count?: number
}

// ========== APP STATE ==========
export type Lang = 'hi' | 'en'

export interface AppState {
  lang: Lang
  fieldWorker: FieldWorker | null
  currentProfile: Partial<BeneficiaryProfile>
  matches: SchemeMatch[]
  step: number
}

// ========== FORM STEP ==========
export type FormStep = 1 | 2 | 3 | 4 | 5
