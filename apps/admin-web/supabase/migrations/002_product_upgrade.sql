-- ============================================================
-- SAASHAKTI: DEMO → PRODUCT UPGRADE MIGRATION
-- ============================================================

-- 1. BENEFICIARY LIFECYCLE TRACKING
-- A woman's journey: registered → matched → applied → receiving → renewed

ALTER TABLE beneficiaries
  ADD COLUMN IF NOT EXISTS registration_status text NOT NULL DEFAULT 'active'
    CHECK (registration_status IN ('draft','active','verified','suspended','archived')),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_matched_at timestamptz,
  ADD COLUMN IF NOT EXISTS profile_completeness integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes text;

-- 2. CURRENT BENEFITS — what she's already receiving (self-declared + verified)
CREATE TABLE IF NOT EXISTS beneficiary_current_schemes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_id uuid NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
  scheme_id text NOT NULL,
  scheme_name_hi text NOT NULL,
  scheme_name_en text,
  receiving_since text,
  amount_received integer,
  frequency text,
  self_declared boolean NOT NULL DEFAULT true,
  verified boolean NOT NULL DEFAULT false,
  verified_by text,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(beneficiary_id, scheme_id)
);

CREATE INDEX IF NOT EXISTS idx_bcs_beneficiary ON beneficiary_current_schemes(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_bcs_scheme ON beneficiary_current_schemes(scheme_id);

-- 3. SCHEME APPLICATION TRACKING — after matching, track if she actually applied
ALTER TABLE matched_schemes
  ADD COLUMN IF NOT EXISTS application_status text DEFAULT 'identified'
    CHECK (application_status IN ('identified','informed','applied','under_review','approved','rejected','receiving','lapsed')),
  ADD COLUMN IF NOT EXISTS applied_at timestamptz,
  ADD COLUMN IF NOT EXISTS applied_via text,
  ADD COLUMN IF NOT EXISTS status_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS status_notes text,
  ADD COLUMN IF NOT EXISTS follow_up_date date,
  ADD COLUMN IF NOT EXISTS assisted_by uuid REFERENCES field_workers(id);

-- 4. FIELD WORKER PERFORMANCE TRACKING
ALTER TABLE field_workers
  ADD COLUMN IF NOT EXISTS total_registrations integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_schemes_unlocked integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS supervisor_name text,
  ADD COLUMN IF NOT EXISTS supervisor_phone text;

-- 5. GRIEVANCE / FEEDBACK SYSTEM
CREATE TABLE IF NOT EXISTS grievances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_id uuid REFERENCES beneficiaries(id) ON DELETE SET NULL,
  field_worker_id uuid REFERENCES field_workers(id) ON DELETE SET NULL,
  scheme_id text,
  scheme_name text,
  grievance_type text NOT NULL CHECK (grievance_type IN (
    'benefit_not_received', 'application_rejected', 'wrong_amount',
    'document_issue', 'portal_issue', 'field_worker_complaint',
    'scheme_info_wrong', 'other'
  )),
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','acknowledged','in_progress','resolved','closed','escalated')),
  priority text DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  district text,
  assigned_to text,
  resolution text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_grievance_status ON grievances(status) WHERE status != 'closed';
CREATE INDEX IF NOT EXISTS idx_grievance_district ON grievances(district);
CREATE INDEX IF NOT EXISTS idx_grievance_scheme ON grievances(scheme_id);

-- 6. COVERAGE GAP ANALYTICS VIEW
CREATE OR REPLACE VIEW coverage_gap_analysis AS
SELECT
  b.district,
  ms.scheme_id,
  ms.scheme_name_hi,
  ms.scheme_name_en,
  count(*) FILTER (WHERE ms.confidence IN ('eligible','partial')) as total_eligible,
  count(*) FILTER (WHERE bcs.id IS NOT NULL) as already_receiving,
  count(*) FILTER (WHERE ms.confidence IN ('eligible','partial') AND bcs.id IS NULL) as eligible_not_receiving,
  sum(ms.benefit_amount) FILTER (WHERE ms.confidence IN ('eligible','partial') AND bcs.id IS NULL) as unclaimed_annual_value
FROM matched_schemes ms
JOIN beneficiaries b ON b.id = ms.beneficiary_id
LEFT JOIN beneficiary_current_schemes bcs
  ON bcs.beneficiary_id = ms.beneficiary_id AND bcs.scheme_id = ms.scheme_id
GROUP BY b.district, ms.scheme_id, ms.scheme_name_hi, ms.scheme_name_en;

-- 7. DISTRICT PERFORMANCE VIEW
CREATE OR REPLACE VIEW district_performance AS
SELECT
  b.district,
  count(DISTINCT b.id) as total_women,
  count(DISTINCT b.id) FILTER (WHERE b.is_bpl) as bpl_women,
  count(DISTINCT b.id) FILTER (WHERE b.is_pregnant) as pregnant_women,
  count(DISTINCT b.id) FILTER (WHERE b.marital_status = 'widow') as widows,
  sum(b.total_schemes_matched) as total_schemes_matched,
  sum(b.total_annual_benefit) as total_potential_benefit,
  count(DISTINCT ms.scheme_id) as unique_schemes_matched,
  count(DISTINCT g.id) FILTER (WHERE g.status NOT IN ('closed','resolved')) as open_grievances,
  count(DISTINCT fw.id) FILTER (WHERE fw.is_active) as active_field_workers
FROM beneficiaries b
LEFT JOIN matched_schemes ms ON ms.beneficiary_id = b.id
LEFT JOIN grievances g ON g.district = b.district
LEFT JOIN field_workers fw ON fw.district = b.district
GROUP BY b.district;

-- 8. FIELD WORKER PERFORMANCE VIEW
CREATE OR REPLACE VIEW field_worker_performance AS
SELECT
  fw.id,
  fw.name,
  fw.district,
  fw.organization,
  count(DISTINCT b.id) as registrations,
  sum(b.total_schemes_matched) as schemes_unlocked,
  sum(b.total_annual_benefit) as benefit_value_unlocked,
  max(b.created_at) as last_registration_at,
  count(DISTINCT b.id) FILTER (WHERE b.created_at > now() - interval '7 days') as registrations_last_7_days
FROM field_workers fw
LEFT JOIN beneficiaries b ON b.field_worker_id = fw.id
GROUP BY fw.id, fw.name, fw.district, fw.organization;

-- 9. REGISTRATION ACTIVITY LOG (for audit)
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_type text NOT NULL CHECK (actor_type IN ('system','field_worker','beneficiary','admin')),
  actor_id text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  details jsonb DEFAULT '{}'::jsonb,
  district text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_entity ON activity_log(entity_type, entity_id);

-- 10. ENABLE REAL-TIME ON NEW TABLES
ALTER PUBLICATION supabase_realtime ADD TABLE beneficiary_current_schemes;
ALTER PUBLICATION supabase_realtime ADD TABLE grievances;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_log;

-- 11. UPDATE FIELD WORKER COUNTS TRIGGER
CREATE OR REPLACE FUNCTION update_field_worker_counts() RETURNS TRIGGER AS $$
BEGIN
  UPDATE field_workers SET
    total_registrations = (SELECT count(*) FROM beneficiaries WHERE field_worker_id = NEW.field_worker_id),
    last_active_at = now()
  WHERE id = NEW.field_worker_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_fw_counts ON beneficiaries;
CREATE TRIGGER trg_update_fw_counts
  AFTER INSERT ON beneficiaries
  FOR EACH ROW
  WHEN (NEW.field_worker_id IS NOT NULL)
  EXECUTE FUNCTION update_field_worker_counts();

-- 12. PROFILE COMPLETENESS CALCULATOR
CREATE OR REPLACE FUNCTION calculate_profile_completeness() RETURNS TRIGGER AS $$
DECLARE
  score integer := 0;
  total integer := 12;
BEGIN
  IF NEW.name IS NOT NULL AND NEW.name != '' THEN score := score + 1; END IF;
  IF NEW.age IS NOT NULL AND NEW.age > 0 THEN score := score + 1; END IF;
  IF NEW.district IS NOT NULL THEN score := score + 1; END IF;
  IF NEW.marital_status IS NOT NULL THEN score := score + 1; END IF;
  IF NEW.caste_category IS NOT NULL THEN score := score + 1; END IF;
  IF NEW.income_bracket IS NOT NULL THEN score := score + 1; END IF;
  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN score := score + 1; END IF;
  IF NEW.is_bpl IS NOT NULL THEN score := score + 1; END IF;
  IF NEW.has_bank_account IS NOT NULL THEN score := score + 1; END IF;
  IF NEW.has_ration_card IS NOT NULL THEN score := score + 1; END IF;
  IF NEW.num_children IS NOT NULL THEN score := score + 1; END IF;
  IF NEW.residence_type IS NOT NULL THEN score := score + 1; END IF;

  NEW.profile_completeness := ROUND((score::numeric / total) * 100);
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profile_completeness ON beneficiaries;
CREATE TRIGGER trg_profile_completeness
  BEFORE INSERT OR UPDATE ON beneficiaries
  FOR EACH ROW
  EXECUTE FUNCTION calculate_profile_completeness();
