CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE beneficiaries
  ADD COLUMN IF NOT EXISTS aadhaar_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS registration_mode TEXT DEFAULT 'self',
  ADD COLUMN IF NOT EXISTS profile_json JSONB DEFAULT '{}'::jsonb;

ALTER TABLE user_sessions
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

CREATE TABLE IF NOT EXISTS matched_schemes (
  id BIGSERIAL PRIMARY KEY,
  beneficiary_id TEXT NOT NULL,
  scheme_id TEXT NOT NULL,
  eligibility_status TEXT NOT NULL,
  annual_value NUMERIC(12,2),
  explanation_hi TEXT,
  explanation_en TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_beneficiaries_mobile_number ON beneficiaries(mobile_number);
CREATE INDEX IF NOT EXISTS idx_beneficiaries_created_at ON beneficiaries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_matched_schemes_beneficiary_id ON matched_schemes(beneficiary_id);
