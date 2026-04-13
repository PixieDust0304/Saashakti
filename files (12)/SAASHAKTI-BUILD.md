# SAASHAKTI — Multi-Agent Parallel Build Specification

## Launch: April 18, 2026 | Minister: Laxmi Rajwade (CG WCD)
## Builder: Anuj + AI Agent Swarm
## Constraint: 500 real women will be registered at launch event

---

## 1. WHAT WE ARE BUILDING

A PWA that allows field workers and women to:
1. Enter a woman's basic profile (age, district, marital status, income bracket, etc.)
2. Instantly see every government scheme she qualifies for (central + CG state)
3. View scheme details, benefit amounts, and required documents
4. Save the registration to a database
5. Show a real-time dashboard of registrations at the launch event

### NOT building for April 18th:
- No Aadhaar integration
- No DigiLocker integration
- No chatbot / WhatsApp bot / IVR
- No offline mode (PWA cache only)
- No ML inference
- No payment/DBT tracking
- No user authentication (field worker flow only uses a simple access code)

---

## 2. ARCHITECTURE

```
┌─────────────────────────────────────────────┐
│                   FRONTEND                   │
│         React + Vite + Tailwind PWA          │
│                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  │ Profile   │ │ Scheme   │ │ Real-time    │ │
│  │ Intake    │ │ Results  │ │ Dashboard    │ │
│  │ Form      │ │ Cards    │ │ (event mode) │ │
│  └──────────┘ └──────────┘ └──────────────┘ │
│                                              │
│  ┌──────────────────────────────────────────┐│
│  │  CLIENT-SIDE ELIGIBILITY ENGINE          ││
│  │  scheme-data.json + matchSchemes()       ││
│  └──────────────────────────────────────────┘│
└──────────────────┬──────────────────────────┘
                   │ save profile + matches
                   ▼
┌──────────────────────────────────────────────┐
│              SUPABASE (BaaS)                 │
│                                              │
│  Tables:                                     │
│  - beneficiaries (profile data)              │
│  - matched_schemes (per beneficiary)         │
│  - field_workers (access codes)              │
│                                              │
│  Real-time subscriptions for dashboard       │
└──────────────────────────────────────────────┘
```

### Key Design Decisions:
- **No custom backend.** Supabase provides Postgres + REST API + real-time subscriptions.
- **Eligibility matching runs client-side.** Scheme data is bundled as JSON (~50KB). Rules engine is a pure JS function. Zero server dependency for matching = instant results, works even with slow network.
- **Supabase is used only for persistence and real-time dashboard.** Write profile → write matches → dashboard reads via real-time subscription.
- **Deploy as static site on Vercel.** Zero server infra. Free tier. Instant deploys. Custom domain + SSL.

---

## 3. TECH STACK (FINAL — NO DEBATE)

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React 18 + Vite | Fast build, you know it |
| Styling | Tailwind CSS | Rapid UI, mobile-first utilities |
| Language | TypeScript | Type safety for scheme data models |
| Icons | Lucide React | Clean, lightweight |
| Database | Supabase (free tier) | Postgres + REST + Realtime |
| Hosting | Vercel | Free, instant deploy, SSL |
| PWA | vite-plugin-pwa | Service worker, installable |
| State | React Context + useReducer | Simple, no Redux overhead |
| i18n | Custom (JSON lang files) | Hindi-first, English toggle |

### NOT using:
- No Next.js (overkill for this, plain Vite is faster to build)
- No GraphQL (REST via Supabase client is sufficient)
- No MongoDB (Postgres via Supabase handles everything)
- No Docker (static site, no containers needed)
- No Flutter (PWA reaches more devices with zero install)

---

## 4. FILE STRUCTURE

```
saashakti/
├── public/
│   ├── manifest.json
│   ├── icons/               # PWA icons (192x192, 512x512)
│   └── sounds/              # Future: audio guidance
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── vite-env.d.ts
│   │
│   ├── data/
│   │   ├── schemes.json          # MASTER SCHEME REGISTRY (Stream A output)
│   │   ├── districts-cg.json     # CG district list (id, name_hi, name_en)
│   │   └── lang/
│   │       ├── hi.json           # Hindi UI strings
│   │       └── en.json           # English UI strings
│   │
│   ├── engine/
│   │   ├── matchSchemes.ts       # Core eligibility matching function
│   │   ├── types.ts              # Shared TypeScript types/interfaces
│   │   └── scoring.ts            # Match confidence scoring
│   │
│   ├── lib/
│   │   ├── supabase.ts           # Supabase client init
│   │   └── analytics.ts          # Registration counter helpers
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── BottomNav.tsx
│   │   │   └── LanguageToggle.tsx
│   │   │
│   │   ├── intake/
│   │   │   ├── ProfileForm.tsx        # Main profile intake form
│   │   │   ├── AgeInput.tsx           # Age selector (big buttons)
│   │   │   ├── DistrictSelect.tsx     # CG district dropdown
│   │   │   ├── MaritalStatus.tsx      # Icon-based marital status
│   │   │   ├── CategorySelect.tsx     # SC/ST/OBC/General
│   │   │   ├── IncomeRange.tsx        # Income bracket selector
│   │   │   ├── PregnancyStatus.tsx    # Pregnant/lactating toggle
│   │   │   ├── FamilyDetails.tsx      # Children count, spouse status
│   │   │   └── ExclusionChecks.tsx    # Taxpayer, govt employee etc.
│   │   │
│   │   ├── results/
│   │   │   ├── SchemeList.tsx         # Matched schemes cards
│   │   │   ├── SchemeCard.tsx         # Individual scheme card
│   │   │   ├── SchemeDetail.tsx       # Full scheme detail view
│   │   │   ├── DocumentChecklist.tsx  # Required docs with status
│   │   │   └── BenefitSummary.tsx     # Total potential benefit ₹
│   │   │
│   │   ├── dashboard/
│   │   │   ├── LiveDashboard.tsx      # Real-time event dashboard
│   │   │   ├── RegistrationCounter.tsx
│   │   │   ├── DistrictBreakdown.tsx
│   │   │   └── TopSchemes.tsx
│   │   │
│   │   └── field-worker/
│   │       ├── WorkerLogin.tsx        # Simple access code entry
│   │       ├── RegistrationList.tsx   # List of women registered by this worker
│   │       └── QuickRegister.tsx      # Save + clear + next flow
│   │
│   ├── pages/
│   │   ├── HomePage.tsx           # Landing / role selection
│   │   ├── IntakePage.tsx         # Profile form flow
│   │   ├── ResultsPage.tsx        # Scheme matches
│   │   ├── SchemeDetailPage.tsx   # Individual scheme
│   │   ├── DashboardPage.tsx      # Event dashboard (separate URL)
│   │   └── FieldWorkerPage.tsx    # Field worker hub
│   │
│   ├── hooks/
│   │   ├── useSchemeMatch.ts      # Hook wrapping matchSchemes()
│   │   ├── useSupabase.ts         # DB operations
│   │   ├── useLang.ts            # Language context
│   │   └── useRealtimeCount.ts    # Real-time registration counter
│   │
│   └── styles/
│       └── globals.css            # Tailwind base + custom styles
│
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Database schema
│
├── index.html
├── tailwind.config.js
├── vite.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 5. SHARED DATA CONTRACTS

### These interfaces MUST be respected by ALL agents. They are the source of truth.

```typescript
// src/engine/types.ts

// ========== BENEFICIARY PROFILE ==========
interface BeneficiaryProfile {
  id?: string;                          // UUID, generated on save
  created_at?: string;                  // ISO timestamp
  field_worker_id?: string;             // null if self-registered

  // Demographics
  name: string;
  age: number;
  gender: 'female';                     // locked to female for this platform
  phone?: string;

  // Location
  state: 'Chhattisgarh';               // locked for launch
  district: string;                     // district code from districts-cg.json
  block?: string;
  residence_type: 'rural' | 'urban';

  // Social
  caste_category: 'general' | 'obc' | 'sc' | 'st';
  religion?: string;
  marital_status: 'unmarried' | 'married' | 'widow' | 'divorced' | 'deserted';

  // Economic
  income_bracket: 'below_1l' | '1l_to_2l' | '2l_to_5l' | 'above_5l';
  is_bpl: boolean;
  has_ration_card: boolean;
  ration_card_type?: 'antyodaya' | 'priority' | 'non_priority';
  has_bank_account: boolean;
  has_jan_dhan_account: boolean;
  owns_land: boolean;
  owns_pucca_house: boolean;
  has_lpg_connection: boolean;

  // Family
  num_children: number;
  youngest_child_age?: number;
  is_pregnant: boolean;
  is_lactating: boolean;
  pregnancy_child_number?: number;       // 1st child, 2nd child etc.
  has_girl_child: boolean;
  girl_child_age?: number;

  // Employment
  occupation?: string;
  is_shg_member: boolean;
  has_paid_maternity_leave: boolean;
  is_govt_psu_employee: boolean;

  // Exclusion fields (mostly for Mahtari Vandan)
  family_is_taxpayer: boolean;
  family_govt_employee: boolean;
  family_is_elected_rep: boolean;
  family_is_board_chair: boolean;

  // Disability
  has_disability: boolean;
  disability_percentage?: number;
}

// ========== SCHEME ==========
interface Scheme {
  id: string;
  name_en: string;
  name_hi: string;
  level: 'central' | 'state' | 'district';
  state: string | 'all';
  department_en: string;
  department_hi: string;
  benefit: SchemeBenefit;
  eligibility: SchemeEligibility;
  exclusions: SchemeExclusion[];
  documents_required: SchemeDocument[];
  application: SchemeApplication;
  tags: string[];
  priority_score: number;
}

interface SchemeBenefit {
  type: 'cash_transfer' | 'subsidy' | 'in_kind' | 'service' | 'insurance' | 'savings';
  amount: number | null;
  frequency: 'monthly' | 'annual' | 'one_time' | 'one_time_installments' | 'on_event';
  currency: 'INR';
  annual_value: number | null;
  disbursement: 'DBT' | 'physical' | 'service_delivery';
  description_en: string;
  description_hi: string;
}

interface SchemeEligibility {
  gender: 'female' | 'any';
  min_age: number | null;
  max_age: number | null;
  marital_status: string[] | null;       // null = any
  state_domicile: string | null;         // null = any state
  residence_type?: 'rural' | 'urban' | null;
  is_bpl?: boolean;
  is_pregnant?: boolean;
  is_lactating?: boolean;
  pregnancy_child_number?: number[];
  is_shg_member?: boolean;
  requires_bank_account?: boolean;
  has_disability?: boolean;
  min_disability_percentage?: number;
  caste_category?: string[];             // null = any
  income_ceiling_annual?: number | null;
  no_existing_lpg?: boolean;
  is_houseless?: boolean;
  has_girl_child?: boolean;
  girl_child_max_age?: number;
  num_children_max?: number;
  additional_rules: string[];
}

interface SchemeExclusion {
  rule_en: string;
  rule_hi: string;
  field: string;                         // maps to BeneficiaryProfile field
  value: boolean | string | number;
}

interface SchemeDocument {
  name_en: string;
  name_hi: string;
  mandatory: boolean;
  digilocker: boolean;                   // future: can be fetched from DigiLocker
}

interface SchemeApplication {
  mode: ('online' | 'offline')[];
  where_en: string;
  where_hi: string;
  portal: string;
}

// ========== MATCH RESULT ==========
interface SchemeMatch {
  scheme_id: string;
  scheme: Scheme;
  is_eligible: boolean;
  confidence: 'confirmed' | 'likely' | 'possible';
  matched_criteria: string[];            // which criteria were met
  unmatched_criteria: string[];          // which criteria were NOT met
  missing_data: string[];               // fields needed but not provided
  excluded_by?: string;                 // which exclusion rule triggered
}

// ========== FIELD WORKER ==========
interface FieldWorker {
  id: string;
  name: string;
  access_code: string;                  // simple 6-digit code
  district: string;
  block?: string;
  organization?: string;                // ASHA, Anganwadi, NGO name
  registrations_count: number;
}
```

---

## 6. SUPABASE DATABASE SCHEMA

```sql
-- supabase/migrations/001_initial_schema.sql

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Field workers table
create table field_workers (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  access_code text not null unique,
  phone text,
  district text not null,
  block text,
  organization text,
  created_at timestamptz default now()
);

-- Beneficiary profiles
create table beneficiaries (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamptz default now(),
  field_worker_id uuid references field_workers(id),

  -- Demographics
  name text not null,
  age integer not null,
  phone text,

  -- Location
  district text not null,
  block text,
  residence_type text not null check (residence_type in ('rural', 'urban')),

  -- Social
  caste_category text not null check (caste_category in ('general', 'obc', 'sc', 'st')),
  marital_status text not null check (marital_status in ('unmarried', 'married', 'widow', 'divorced', 'deserted')),

  -- Economic
  income_bracket text not null,
  is_bpl boolean default false,
  has_ration_card boolean default false,
  ration_card_type text,
  has_bank_account boolean default false,
  has_jan_dhan_account boolean default false,
  owns_land boolean default false,
  owns_pucca_house boolean default false,
  has_lpg_connection boolean default false,

  -- Family
  num_children integer default 0,
  youngest_child_age integer,
  is_pregnant boolean default false,
  is_lactating boolean default false,
  pregnancy_child_number integer,
  has_girl_child boolean default false,
  girl_child_age integer,

  -- Employment
  occupation text,
  is_shg_member boolean default false,
  has_paid_maternity_leave boolean default false,
  is_govt_psu_employee boolean default false,

  -- Exclusions
  family_is_taxpayer boolean default false,
  family_govt_employee boolean default false,
  family_is_elected_rep boolean default false,
  family_is_board_chair boolean default false,

  -- Disability
  has_disability boolean default false,
  disability_percentage integer,

  -- Results
  total_schemes_matched integer default 0,
  total_annual_benefit integer default 0
);

-- Matched schemes per beneficiary
create table matched_schemes (
  id uuid default uuid_generate_v4() primary key,
  beneficiary_id uuid references beneficiaries(id) on delete cascade,
  scheme_id text not null,
  scheme_name_hi text not null,
  scheme_name_en text not null,
  benefit_amount integer,
  benefit_frequency text,
  confidence text check (confidence in ('confirmed', 'likely', 'possible')),
  created_at timestamptz default now()
);

-- Indexes for dashboard queries
create index idx_beneficiaries_district on beneficiaries(district);
create index idx_beneficiaries_created on beneficiaries(created_at);
create index idx_matched_schemes_beneficiary on matched_schemes(beneficiary_id);
create index idx_matched_schemes_scheme on matched_schemes(scheme_id);

-- Real-time: enable for dashboard
alter publication supabase_realtime add table beneficiaries;
alter publication supabase_realtime add table matched_schemes;

-- Row Level Security (basic — open for now, tighten later)
alter table beneficiaries enable row level security;
alter table matched_schemes enable row level security;
alter table field_workers enable row level security;

-- Allow all operations for now (tighten post-launch)
create policy "Allow all beneficiary operations" on beneficiaries for all using (true);
create policy "Allow all matched_schemes operations" on matched_schemes for all using (true);
create policy "Allow all field_worker operations" on field_workers for all using (true);

-- Pre-seed field workers for launch event
-- UPDATE THESE with real names/codes before launch
insert into field_workers (name, access_code, district, organization) values
  ('Demo Worker 1', '111111', 'raipur', 'Anganwadi'),
  ('Demo Worker 2', '222222', 'durg', 'ASHA'),
  ('Demo Worker 3', '333333', 'bilaspur', 'NGO Partner'),
  ('Demo Worker 4', '444444', 'rajnandgaon', 'Anganwadi'),
  ('Demo Worker 5', '555555', 'korba', 'ASHA');

-- Dashboard view for real-time stats
create or replace view dashboard_stats as
select
  count(*)::integer as total_registrations,
  count(distinct district)::integer as districts_covered,
  sum(total_schemes_matched)::integer as total_scheme_matches,
  sum(total_annual_benefit)::integer as total_annual_benefit_value,
  count(case when is_pregnant then 1 end)::integer as pregnant_women,
  count(case when marital_status = 'widow' then 1 end)::integer as widows,
  count(case when is_bpl then 1 end)::integer as bpl_women
from beneficiaries;
```

---

## 7. CORE ENGINE — matchSchemes() LOGIC

```typescript
// src/engine/matchSchemes.ts
// THIS IS THE HEART OF THE APP

function matchSchemes(profile: BeneficiaryProfile, schemes: Scheme[]): SchemeMatch[] {
  return schemes
    .map(scheme => evaluateScheme(profile, scheme))
    .filter(match => match.is_eligible || match.confidence === 'possible')
    .sort((a, b) => {
      // Sort: confirmed > likely > possible, then by priority_score
      const confOrder = { confirmed: 3, likely: 2, possible: 1 };
      const confDiff = confOrder[b.confidence] - confOrder[a.confidence];
      if (confDiff !== 0) return confDiff;
      return b.scheme.priority_score - a.scheme.priority_score;
    });
}

function evaluateScheme(profile: BeneficiaryProfile, scheme: Scheme): SchemeMatch {
  const matched: string[] = [];
  const unmatched: string[] = [];
  const missing: string[] = [];
  const elig = scheme.eligibility;

  // Gender check
  if (elig.gender === 'female' && profile.gender === 'female') {
    matched.push('gender');
  }

  // Age check
  if (elig.min_age !== null) {
    if (profile.age >= elig.min_age) matched.push('min_age');
    else unmatched.push('min_age');
  }
  if (elig.max_age !== null) {
    if (profile.age <= elig.max_age) matched.push('max_age');
    else unmatched.push('max_age');
  }

  // Marital status
  if (elig.marital_status !== null) {
    if (elig.marital_status.includes(profile.marital_status)) matched.push('marital_status');
    else unmatched.push('marital_status');
  }

  // State domicile
  if (elig.state_domicile !== null) {
    if (profile.state === elig.state_domicile || elig.state_domicile === null) matched.push('state');
    else unmatched.push('state');
  }

  // BPL check
  if (elig.is_bpl === true) {
    if (profile.is_bpl) matched.push('is_bpl');
    else unmatched.push('is_bpl');
  }

  // Pregnancy check
  if (elig.is_pregnant === true) {
    if (profile.is_pregnant) matched.push('is_pregnant');
    else unmatched.push('is_pregnant');
  }

  // Residence type
  if (elig.residence_type) {
    if (profile.residence_type === elig.residence_type) matched.push('residence_type');
    else unmatched.push('residence_type');
  }

  // Income ceiling
  if (elig.income_ceiling_annual !== null && elig.income_ceiling_annual !== undefined) {
    const incomeMap = { 'below_1l': 100000, '1l_to_2l': 200000, '2l_to_5l': 500000, 'above_5l': 1000000 };
    const estimatedIncome = incomeMap[profile.income_bracket] || 0;
    if (estimatedIncome <= elig.income_ceiling_annual) matched.push('income');
    else unmatched.push('income');
  }

  // SHG membership
  if (elig.is_shg_member === true) {
    if (profile.is_shg_member) matched.push('is_shg_member');
    else unmatched.push('is_shg_member');
  }

  // Bank account
  if (elig.requires_bank_account === true) {
    if (profile.has_bank_account) matched.push('has_bank_account');
    else unmatched.push('has_bank_account');
  }

  // LPG check (for Ujjwala)
  if (elig.no_existing_lpg === true) {
    if (!profile.has_lpg_connection) matched.push('no_lpg');
    else unmatched.push('no_lpg');
  }

  // Housing check (for PMAY)
  if (elig.is_houseless === true) {
    if (!profile.owns_pucca_house) matched.push('no_pucca_house');
    else unmatched.push('no_pucca_house');
  }

  // Girl child check (for Sukanya Samriddhi etc.)
  if (elig.has_girl_child === true) {
    if (profile.has_girl_child) matched.push('has_girl_child');
    else unmatched.push('has_girl_child');
  }

  // Disability check
  if (elig.has_disability === true) {
    if (profile.has_disability) matched.push('has_disability');
    else unmatched.push('has_disability');
  }

  // Caste category check
  if (elig.caste_category && elig.caste_category.length > 0) {
    if (elig.caste_category.includes(profile.caste_category)) matched.push('caste_category');
    else unmatched.push('caste_category');
  }

  // Check exclusions
  let excluded_by: string | undefined;
  for (const excl of scheme.exclusions) {
    const profileValue = (profile as any)[excl.field];
    if (profileValue === excl.value) {
      excluded_by = excl.rule_en;
      break;
    }
  }

  // Determine confidence
  const totalCriteria = matched.length + unmatched.length + missing.length;
  const is_eligible = unmatched.length === 0 && !excluded_by && totalCriteria > 0;
  let confidence: 'confirmed' | 'likely' | 'possible';

  if (excluded_by) {
    confidence = 'possible'; // excluded but might be wrong data
  } else if (is_eligible && missing.length === 0) {
    confidence = 'confirmed';
  } else if (is_eligible && missing.length > 0) {
    confidence = 'likely';
  } else if (unmatched.length <= 1) {
    confidence = 'possible';
  } else {
    confidence = 'possible';
  }

  return {
    scheme_id: scheme.id,
    scheme,
    is_eligible,
    confidence,
    matched_criteria: matched,
    unmatched_criteria: unmatched,
    missing_data: missing,
    excluded_by,
  };
}
```

---

## 8. MULTI-AGENT STREAM DEFINITIONS

### Overview: 4 parallel streams, each with clear ownership boundaries.

```
STREAM A ─── Scheme Data ────────────── Days 1-2
STREAM B ─── Frontend UI ───────────── Days 1-4
STREAM C ─── Engine + Integration ──── Days 2-3
STREAM D ─── Dashboard + Polish ────── Days 3-5
```

---

### STREAM A: SCHEME DATA AGENT

**Mission:** Build the complete scheme registry JSON with 22+ schemes.

**Owns:**
- `src/data/schemes.json`
- `src/data/districts-cg.json`
- `src/data/lang/hi.json`
- `src/data/lang/en.json`

**Does NOT touch:**
- Any component files
- Engine logic
- Supabase config

**Input:** Government scheme websites, MyScheme portal, CG state portal, scheme PDFs

**Output:** A single `schemes.json` file following the `Scheme` interface exactly.

**Scheme list (22 schemes minimum):**

CG State (8):
1. Mahtari Vandan Yojana — ₹1,000/month married women
2. Kaushalya Matritva Yojana — institutional delivery benefit
3. Mukhyamantri Kanya Vivah Yojana — marriage assistance
4. CG Widow Pension — monthly pension for widows
5. CG Disability Pension — monthly pension for disabled
6. Bijli Sakhi Yojana — meter reading employment for women
7. Mukhyamantri Khadyann Sahayata Yojana — food security
8. Noni Suraksha Yojana — girl child protection (FD at birth)

Central (14):
9. PMMVY — ₹5,000/₹6,000 maternity benefit
10. PMAY-G — ₹1,30,000 rural housing
11. PMUY (Ujjwala) — free LPG connection
12. NFSA — subsidized/free ration
13. PMJDY — Jan Dhan bank account + insurance
14. Sukanya Samriddhi Yojana — girl child savings
15. PMSBY — ₹2L accident insurance for ₹12/year
16. PMJJBY — ₹2L life insurance for ₹436/year
17. Lakhpati Didi — SHG women income enhancement
18. PM Kisan — ₹6,000/year for women landholders
19. MGNREGA — 100 days guaranteed employment
20. Atal Pension Yojana — pension for unorganized sector
21. PM Vishwakarma — artisan/craft support
22. Stand Up India — SC/ST/women entrepreneur loans

**Quality criteria:**
- Every scheme must have complete eligibility predicates
- Every scheme must have Hindi AND English for all user-facing strings
- Every exclusion must map to a BeneficiaryProfile field name
- All amounts must be verified from official sources (2024-2025 figures)

---

### STREAM B: FRONTEND UI AGENT

**Mission:** Build all React components and pages.

**Owns:**
- `src/components/**`
- `src/pages/**`
- `src/hooks/**`
- `src/styles/**`
- `src/App.tsx`
- `src/main.tsx`
- `tailwind.config.js`

**Does NOT touch:**
- `src/data/schemes.json` (read only)
- `src/engine/**` (import only)
- `supabase/**`

**Design principles:**
1. **Hindi-first.** All labels, buttons, headings in Hindi by default. English is a toggle.
2. **Big touch targets.** Minimum 48px tap targets. Field workers have calloused fingers.
3. **Icon-driven.** Every form option has an icon. Minimize text.
4. **Card-based results.** Each scheme match is a card with: name, benefit amount in large font, confidence badge (✅ पात्र / ⚠️ संभावित), expandable detail.
5. **Mobile-first.** Design for 360px width (₹6,000 phone). Test at 320px.
6. **Color palette:** Saffron (#FF6B00) primary, white background, green (#138808) for success/confirmed, muted navy for text. Avoid political party colors being too on-the-nose — this is a government platform, not a campaign tool.
7. **Field worker flow:** After saving, show "✅ Saved — Register Next" button prominently. The cycle time between registrations must be under 3 seconds.
8. **No skeleton screens.** Matching is client-side = instant. No loading states needed for results.

**Page flow:**

```
HomePage
  ├── "मैं फील्ड कार्यकर्ता हूँ" → WorkerLogin → IntakePage (loop mode)
  └── "मैं लाभार्थी हूँ" → IntakePage (single mode)

IntakePage (multi-step form)
  Step 1: Name, Age, District, Residence Type
  Step 2: Marital Status, Caste Category
  Step 3: Economic (income, BPL, bank account, ration card)
  Step 4: Family (children, pregnancy, girl child)
  Step 5: Exclusion checks (taxpayer, govt employee)
  → Submit → ResultsPage

ResultsPage
  - Total benefit summary at top: "आप XX योजनाओं के लिए पात्र हैं — कुल लाभ ₹X,XX,XXX/वर्ष"
  - Scheme cards sorted by confidence
  - Tap card → SchemeDetailPage

SchemeDetailPage
  - Full scheme info
  - Document checklist
  - Where to apply

DashboardPage (/dashboard — separate route, no nav)
  - Live counter
  - District breakdown bar chart
  - Top matched schemes
  - Total benefit value
```

---

### STREAM C: ENGINE + SUPABASE INTEGRATION AGENT

**Mission:** Wire up the matching engine, Supabase persistence, and data flow.

**Owns:**
- `src/engine/**`
- `src/lib/**`
- `supabase/**`

**Does NOT touch:**
- `src/components/**` (provides hooks only)
- `src/data/schemes.json` (read only)

**Tasks:**
1. Implement `matchSchemes()` following the logic spec in Section 7
2. Set up Supabase client (`src/lib/supabase.ts`)
3. Implement save flow: profile → beneficiaries table, matches → matched_schemes table
4. Implement real-time subscription for dashboard stats
5. Create `useSchemeMatch` hook that components consume
6. Create `useRealtimeCount` hook for dashboard

**Supabase setup checklist:**
- [ ] Create Supabase project
- [ ] Run migration SQL from Section 6
- [ ] Enable real-time on beneficiaries and matched_schemes tables
- [ ] Get anon key and URL → put in `.env`
- [ ] Test insert + real-time subscription

---

### STREAM D: DASHBOARD + DEPLOY + POLISH AGENT

**Mission:** Build the event dashboard, deploy to Vercel, finalize for launch.

**Owns:**
- `src/components/dashboard/**`
- `src/pages/DashboardPage.tsx`
- Vercel config
- Domain DNS
- PWA manifest + icons

**Tasks:**
1. Build LiveDashboard with real-time Supabase subscription
2. Design for display on a large screen/projector at the event
3. Large font counter: "🎉 XXX महिलाएं पंजीकृत"
4. Auto-refresh, auto-animate counter increments
5. District-wise breakdown (bar chart or cards)
6. Top 5 most-matched schemes
7. Total annual benefit value unlocked: "₹XX,XX,XXX कुल वार्षिक लाभ"
8. Set up Vercel project, connect GitHub repo
9. Configure custom domain
10. Generate PWA icons (Saashakti branding)
11. Create 3-5 demo personas for launch rehearsal
12. Test full flow: register → save → appears on dashboard

---

## 9. PARALLEL EXECUTION TIMELINE

```
           Day 1 (Apr 14)    Day 2 (Apr 15)    Day 3 (Apr 16)    Day 4 (Apr 17)    Day 5 (Apr 18)
           ─────────────     ─────────────     ─────────────     ─────────────     ─────────────
Stream A   [==SCHEMES===]    [=VALIDATE==]
           research+build    corrections
           schemes.json      final data

Stream B   [=SCAFFOLD===]    [===FORMS====]    [==RESULTS===]    [===POLISH===]
           vite setup        intake form       scheme cards       hindi review
           layout comps      multi-step        detail view        responsive fix
           routing                                                 field worker QoL

Stream C                     [==ENGINE====]    [==SUPABASE==]
                             matchSchemes()    wire DB writes
                             hooks             real-time sub

Stream D                                       [=DASHBOARD==]    [===DEPLOY===]    [=LAUNCH=]
                                               live counter      vercel deploy     smoke test
                                               charts            domain setup      demo prep
                                                                  PWA config        personas

INTEGRATION                                                      [=FULL TEST==]    [=REHEARSE]
                                                                  end-to-end        minister
                                                                  500 fake regs     walkthrough
```

---

## 10. LAUNCH DAY CHECKLIST (April 18)

### Morning (before event):
- [ ] Production URL live and accessible
- [ ] SSL working (https://)
- [ ] Supabase tables clean (delete test data)
- [ ] Field worker access codes distributed to workers
- [ ] Dashboard URL on projector/screen at venue
- [ ] 3 demo personas pre-loaded for minister walkthrough
- [ ] Hindi copy reviewed — no English errors in Hindi mode
- [ ] PWA installable on Android Chrome
- [ ] Phone battery + mobile data on backup devices

### During event:
- [ ] Minister does 1-2 demo registrations (pre-scripted personas)
- [ ] Field workers begin real registrations
- [ ] Dashboard shows live counter climbing
- [ ] Someone monitoring for errors (keep Supabase dashboard open)

### Failure modes to prepare for:
- **No internet at venue:** Have mobile hotspot ready. App still shows results (client-side matching) but can't save to DB. Add localStorage fallback for offline saves + sync later.
- **Supabase down:** Extremely unlikely on free tier for 500 users, but have a static screenshot of dashboard as backup.
- **Phone too old:** Test on Android 8+ Chrome. If PWA fails, have 2-3 preloaded phones available.

---

## 11. POST-LAUNCH ROADMAP (for Phase 2 proposal)

After April 18th, the real platform build begins:
1. Expand to 100+ schemes (all CG + major central)
2. User authentication (Aadhaar-based eKYC)
3. DigiLocker document fetch
4. WhatsApp bot for scheme queries
5. Offline mode with background sync
6. District-level admin dashboards
7. Application status tracking
8. Grievance system
9. Analytics: coverage gaps, drop-off analysis
10. Multi-state expansion

---

## 12. RUFLO AGENT CONFIGURATION (if using Ruflo CLI)

```bash
# Initialize project
npx ruflo@latest init

# Spawn agents for parallel streams
npx ruflo@latest agent spawn -t coder --name scheme-data-agent
npx ruflo@latest agent spawn -t coder --name frontend-agent
npx ruflo@latest agent spawn -t coder --name engine-agent
npx ruflo@latest agent spawn -t coder --name dashboard-agent

# Or use hive-mind for coordinated execution
npx ruflo@latest hive-mind spawn "Build Saashakti PWA for April 18 launch" \
  --agents 4 \
  --config ./saashakti-hive-config.json
```

Each agent gets a scoped instruction set (this file) + its stream-specific section.
Agents must respect file ownership boundaries defined in each stream.
No agent modifies files outside its owned directories.
Conflicts are resolved by the shared type contracts in Section 5.
