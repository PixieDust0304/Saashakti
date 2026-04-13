CREATE TABLE IF NOT EXISTS otp_requests (
  id BIGSERIAL PRIMARY KEY,
  mobile_number VARCHAR(20) NOT NULL,
  otp_hash TEXT NOT NULL,
  status VARCHAR(20) NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id BIGSERIAL PRIMARY KEY,
  mobile_number VARCHAR(20) NOT NULL,
  auth_status VARCHAR(20) NOT NULL,
  token_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS beneficiaries (
  id BIGSERIAL PRIMARY KEY,
  mobile_number VARCHAR(20) NOT NULL UNIQUE,
  aadhaar_status VARCHAR(20) NOT NULL,
  registration_mode VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS beneficiary_profiles (
  beneficiary_id BIGINT PRIMARY KEY REFERENCES beneficiaries(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER,
  district TEXT,
  marital_status TEXT,
  caste_category TEXT,
  income_bracket TEXT,
  is_bpl BOOLEAN,
  has_bank_account BOOLEAN,
  has_ration_card BOOLEAN,
  is_pregnant BOOLEAN,
  is_lactating BOOLEAN,
  has_girl_child BOOLEAN,
  is_shg_member BOOLEAN,
  exclusion_flags JSONB NOT NULL DEFAULT '[]'::JSONB,
  disability JSONB NOT NULL DEFAULT '{}'::JSONB
);

CREATE TABLE IF NOT EXISTS matched_schemes (
  id BIGSERIAL PRIMARY KEY,
  beneficiary_id BIGINT NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
  scheme_id TEXT NOT NULL,
  eligibility_status VARCHAR(20) NOT NULL,
  confidence NUMERIC(5,2),
  annual_value NUMERIC(12,2),
  explanation_hi TEXT,
  explanation_en TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS field_workers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone VARCHAR(20) NOT NULL,
  district TEXT,
  organization TEXT,
  access_code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS scheme_versions (
  id BIGSERIAL PRIMARY KEY,
  version TEXT NOT NULL,
  source TEXT,
  effective_date DATE,
  registry_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_type TEXT,
  actor_id TEXT,
  event_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dashboard_events (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  district TEXT,
  beneficiary_id BIGINT REFERENCES beneficiaries(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_requests_mobile_requested_at ON otp_requests(mobile_number, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_dashboard_events_created_at ON dashboard_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dashboard_events_district ON dashboard_events(district);
CREATE INDEX IF NOT EXISTS idx_matched_schemes_beneficiary_id ON matched_schemes(beneficiary_id);
