-- Scheme ingestion pipeline tables
CREATE TABLE IF NOT EXISTS scheme_source_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL,
  source_url text NOT NULL,
  source_host text NOT NULL,
  discovered_at timestamptz NOT NULL DEFAULT now(),
  fetched_at timestamptz,
  http_status integer,
  content_type text,
  title text,
  raw_html text,
  raw_text text,
  checksum text,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS scheme_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_document_id uuid REFERENCES scheme_source_documents(id) ON DELETE CASCADE,
  source_url text NOT NULL,
  source_authority text NOT NULL,
  state_code text,
  ministry_or_department text,
  scheme_name text NOT NULL,
  scheme_slug text,
  benefit_summary text,
  eligibility_text text,
  application_process_text text,
  documents_required_text text,
  official_apply_url text,
  category text,
  women_focused boolean NOT NULL DEFAULT false,
  extracted_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  confidence_score numeric(5,2),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS canonical_schemes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_key text NOT NULL UNIQUE,
  scheme_name_hi text,
  scheme_name_en text NOT NULL,
  source_priority integer NOT NULL DEFAULT 1,
  authority_type text NOT NULL,
  state_code text,
  department_name text,
  benefit_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  eligibility_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  application_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  version text NOT NULL,
  last_verified_at timestamptz,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_candidates_authority ON scheme_candidates(source_authority);
CREATE INDEX IF NOT EXISTS idx_candidates_women ON scheme_candidates(women_focused) WHERE women_focused = true;
CREATE INDEX IF NOT EXISTS idx_canonical_published ON canonical_schemes(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_canonical_state ON canonical_schemes(state_code);
