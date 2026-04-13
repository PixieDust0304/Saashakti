-- Saashakti Database Schema
-- Run this in Supabase SQL Editor

create extension if not exists "uuid-ossp";

-- Field workers
create table field_workers (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  access_code text not null unique,
  phone text,
  district text not null,
  block text,
  organization text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Beneficiaries
create table beneficiaries (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamptz default now(),
  field_worker_id uuid references field_workers(id),
  name text not null,
  age integer not null,
  gender text default 'female',
  phone text,
  state text default 'Chhattisgarh',
  district text not null,
  block text,
  residence_type text not null check (residence_type in ('rural', 'urban')),
  caste_category text not null check (caste_category in ('general', 'obc', 'sc', 'st')),
  marital_status text not null check (marital_status in ('unmarried', 'married', 'widow', 'divorced', 'deserted')),
  income_bracket text not null,
  is_bpl boolean default false,
  has_ration_card boolean default false,
  ration_card_type text,
  has_bank_account boolean default false,
  has_jan_dhan_account boolean default false,
  owns_land boolean default false,
  owns_pucca_house boolean default false,
  has_lpg_connection boolean default false,
  num_children integer default 0,
  youngest_child_age integer,
  is_pregnant boolean default false,
  is_lactating boolean default false,
  pregnancy_child_number integer,
  has_girl_child boolean default false,
  girl_child_age integer,
  occupation text,
  is_shg_member boolean default false,
  has_paid_maternity_leave boolean default false,
  is_govt_psu_employee boolean default false,
  family_is_taxpayer boolean default false,
  family_govt_employee boolean default false,
  family_is_elected_rep boolean default false,
  family_is_board_chair boolean default false,
  has_disability boolean default false,
  disability_percentage integer,
  total_schemes_matched integer default 0,
  total_annual_benefit integer default 0
);

-- Matched schemes
create table matched_schemes (
  id uuid default uuid_generate_v4() primary key,
  beneficiary_id uuid references beneficiaries(id) on delete cascade,
  scheme_id text not null,
  scheme_name_hi text not null,
  scheme_name_en text not null,
  benefit_amount integer,
  benefit_frequency text,
  confidence text check (confidence in ('eligible', 'partial', 'possible')),
  created_at timestamptz default now()
);

-- Indexes for dashboard performance
create index idx_ben_district on beneficiaries(district);
create index idx_ben_created on beneficiaries(created_at desc);
create index idx_ben_bpl on beneficiaries(is_bpl) where is_bpl = true;
create index idx_ben_pregnant on beneficiaries(is_pregnant) where is_pregnant = true;
create index idx_ben_widow on beneficiaries(marital_status) where marital_status = 'widow';
create index idx_ms_beneficiary on matched_schemes(beneficiary_id);
create index idx_ms_scheme on matched_schemes(scheme_id);

-- Enable real-time
alter publication supabase_realtime add table beneficiaries;
alter publication supabase_realtime add table matched_schemes;

-- RLS policies (open for launch — tighten in Phase 2)
alter table beneficiaries enable row level security;
alter table matched_schemes enable row level security;
alter table field_workers enable row level security;

create policy "open_beneficiaries" on beneficiaries for all using (true) with check (true);
create policy "open_matched_schemes" on matched_schemes for all using (true) with check (true);
create policy "open_field_workers" on field_workers for all using (true) with check (true);

-- Seed field workers for launch (UPDATE with real data before event)
insert into field_workers (name, access_code, district, organization) values
  ('आशा कार्यकर्ता 1', '100001', 'raipur', 'ASHA'),
  ('आशा कार्यकर्ता 2', '100002', 'raipur', 'ASHA'),
  ('आंगनबाड़ी 1', '200001', 'durg', 'Anganwadi'),
  ('आंगनबाड़ी 2', '200002', 'bilaspur', 'Anganwadi'),
  ('आंगनबाड़ी 3', '200003', 'rajnandgaon', 'Anganwadi'),
  ('NGO Partner 1', '300001', 'korba', 'NGO'),
  ('NGO Partner 2', '300002', 'bastar', 'NGO'),
  ('NGO Partner 3', '300003', 'surguja', 'NGO'),
  ('फील्ड कोर्डिनेटर 1', '400001', 'surajpur', 'WCD'),
  ('फील्ड कोर्डिनेटर 2', '400002', 'janjgir_champa', 'WCD'),
  ('Demo Worker', '999999', 'raipur', 'Demo');
