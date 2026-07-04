-- Mudgal Gastromedics HMS production database baseline.
-- Target: PostgreSQL 15+.
-- This schema is a production migration starting point for replacing local .data JSON stores.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id text UNIQUE,
  actor_id text,
  actor_role text NOT NULL DEFAULT 'system',
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS legacy_id text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_audit_events_legacy_id ON audit_events (legacy_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON audit_events (created_at DESC);

CREATE TABLE IF NOT EXISTS cms_content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id text UNIQUE,
  content_type text NOT NULL,
  status text NOT NULL DEFAULT 'Draft',
  title text NOT NULL,
  slug text NOT NULL,
  summary text,
  seo_title text,
  seo_description text,
  media_url text,
  owner text,
  notes text,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cms_content_status ON cms_content_items (status);
CREATE INDEX IF NOT EXISTS idx_cms_content_type ON cms_content_items (content_type);

CREATE TABLE IF NOT EXISTS cms_content_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id text UNIQUE,
  content_item_id uuid REFERENCES cms_content_items(id) ON DELETE CASCADE,
  content_item_legacy_id text,
  version integer NOT NULL,
  action text NOT NULL,
  status text NOT NULL,
  title text NOT NULL,
  slug text NOT NULL,
  summary text,
  seo_title text,
  seo_description text,
  media_url text,
  owner text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cms_revisions_item ON cms_content_revisions (content_item_id);

CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id text UNIQUE,
  uhid text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'Active',
  name text NOT NULL,
  phone text NOT NULL,
  alternate_phone text,
  email text,
  age text,
  gender text,
  blood_group text,
  address text,
  city text,
  emergency_contact text,
  allergies text,
  chronic_conditions text,
  current_medicines text,
  notes text,
  last_visit_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients (phone);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients (status);

CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id text UNIQUE,
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  uhid text,
  status text NOT NULL DEFAULT 'New',
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  age text,
  gender text,
  patient_type text,
  contact_method text,
  service text NOT NULL,
  preferred_date date,
  time_slot text,
  priority text,
  symptoms text[] NOT NULL DEFAULT '{}',
  duration text,
  medicines text,
  assistance text,
  report text,
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments (status);
CREATE INDEX IF NOT EXISTS idx_appointments_phone ON appointments (phone);
CREATE INDEX IF NOT EXISTS idx_appointments_created_at ON appointments (created_at);

CREATE TABLE IF NOT EXISTS opd_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id text UNIQUE,
  token text NOT NULL,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  uhid text,
  status text NOT NULL DEFAULT 'Waiting',
  patient_name text NOT NULL,
  phone text NOT NULL,
  service text NOT NULL,
  priority text,
  symptoms text[] NOT NULL DEFAULT '{}',
  billing_status text NOT NULL DEFAULT 'Not Started',
  estimated_amount numeric(12,2) DEFAULT 0,
  payment_method text,
  receipt_id text,
  paid_at timestamptz,
  notes text,
  clinical_note text,
  prescription text,
  advice text,
  follow_up_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_opd_visits_status ON opd_visits (status);
CREATE INDEX IF NOT EXISTS idx_opd_visits_phone ON opd_visits (phone);
CREATE INDEX IF NOT EXISTS idx_opd_visits_follow_up_date ON opd_visits (follow_up_date);

CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id text UNIQUE,
  name text NOT NULL,
  category text NOT NULL,
  quantity numeric(12,2) NOT NULL DEFAULT 0,
  reorder_level numeric(12,2) NOT NULL DEFAULT 0,
  unit text NOT NULL,
  vendor text,
  last_updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory_items (category);

CREATE TABLE IF NOT EXISTS pharmacy_dispenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id text UNIQUE,
  status text NOT NULL DEFAULT 'Draft',
  visit_id uuid REFERENCES opd_visits(id) ON DELETE SET NULL,
  token text,
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  uhid text,
  patient_name text NOT NULL,
  phone text NOT NULL,
  service text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  discount numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'Unpaid',
  payment_method text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lab_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id text UNIQUE,
  visit_id uuid REFERENCES opd_visits(id) ON DELETE SET NULL,
  token text,
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  uhid text,
  patient_name text NOT NULL,
  phone text NOT NULL,
  service text,
  tests text[] NOT NULL DEFAULT '{}',
  priority text NOT NULL DEFAULT 'Routine',
  status text NOT NULL DEFAULT 'Ordered',
  sample_type text,
  result_summary text,
  report_reference text,
  amount numeric(12,2) DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'Unpaid',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS procedure_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id text UNIQUE,
  visit_id uuid REFERENCES opd_visits(id) ON DELETE SET NULL,
  token text,
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  uhid text,
  patient_name text NOT NULL,
  phone text NOT NULL,
  procedure_slug text NOT NULL,
  procedure_title text NOT NULL,
  scheduled_date date NOT NULL,
  scheduled_time text NOT NULL,
  room text NOT NULL,
  doctor text NOT NULL,
  anesthesia_plan text,
  priority text NOT NULL DEFAULT 'Routine',
  status text NOT NULL DEFAULT 'Planned',
  checklist jsonb NOT NULL DEFAULT '{}'::jsonb,
  findings text,
  complications text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hospital_beds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id text UNIQUE,
  ward text NOT NULL,
  label text NOT NULL,
  status text NOT NULL DEFAULT 'Vacant',
  daily_rate numeric(12,2) NOT NULL DEFAULT 0,
  notes text
);

CREATE TABLE IF NOT EXISTS ipd_admissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id text UNIQUE,
  visit_id uuid REFERENCES opd_visits(id) ON DELETE SET NULL,
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  uhid text,
  token text,
  patient_name text NOT NULL,
  phone text NOT NULL,
  bed_id uuid REFERENCES hospital_beds(id) ON DELETE SET NULL,
  bed_label text,
  ward text,
  admission_type text NOT NULL DEFAULT 'Planned',
  admitting_doctor text NOT NULL,
  diagnosis text NOT NULL,
  status text NOT NULL DEFAULT 'Admitted',
  care_plan text,
  nursing_notes text,
  diet_advice text,
  deposit_amount numeric(12,2) DEFAULT 0,
  discharge_summary text,
  discharged_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS insurance_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id text UNIQUE,
  admission_id uuid REFERENCES ipd_admissions(id) ON DELETE SET NULL,
  visit_id uuid REFERENCES opd_visits(id) ON DELETE SET NULL,
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  uhid text,
  patient_name text NOT NULL,
  phone text NOT NULL,
  insurer text NOT NULL,
  tpa text,
  policy_number text,
  claim_number text,
  requested_amount numeric(12,2) NOT NULL DEFAULT 0,
  approved_amount numeric(12,2) NOT NULL DEFAULT 0,
  settled_amount numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Draft',
  documents text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS account_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id text UNIQUE,
  entry_date date NOT NULL DEFAULT current_date,
  type text NOT NULL,
  category text NOT NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  method text NOT NULL DEFAULT 'Cash',
  reference text,
  party text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staff_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id text UNIQUE,
  status text NOT NULL DEFAULT 'Active',
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  role text NOT NULL,
  department text NOT NULL,
  shift text NOT NULL DEFAULT 'General',
  joining_date date,
  salary numeric(12,2),
  permissions text[] NOT NULL DEFAULT '{}',
  emergency_contact text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id text UNIQUE,
  staff_id uuid REFERENCES staff_members(id) ON DELETE SET NULL,
  staff_name text NOT NULL,
  attendance_date date NOT NULL,
  status text NOT NULL DEFAULT 'Present',
  check_in time,
  check_out time,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (staff_id, attendance_date)
);

CREATE TABLE IF NOT EXISTS communication_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id text UNIQUE,
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  uhid text,
  patient_name text NOT NULL,
  phone text NOT NULL,
  channel text NOT NULL,
  template text NOT NULL,
  status text NOT NULL DEFAULT 'Draft',
  subject text NOT NULL,
  message text NOT NULL,
  scheduled_for timestamptz,
  sent_at timestamptz,
  owner text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_case_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id text UNIQUE,
  source text NOT NULL,
  source_id text NOT NULL,
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  uhid text,
  patient_name text NOT NULL,
  phone text NOT NULL,
  service text NOT NULL,
  urgency text NOT NULL,
  route text NOT NULL,
  summary text NOT NULL,
  flags text[] NOT NULL DEFAULT '{}',
  preparation text[] NOT NULL DEFAULT '{}',
  reception_script text NOT NULL,
  safety_note text NOT NULL,
  doctor_review_note text,
  reviewed_by text,
  reviewed_at timestamptz,
  status text NOT NULL DEFAULT 'Needs Review',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, source_id)
);

CREATE TABLE IF NOT EXISTS automation_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id text UNIQUE,
  task_key text NOT NULL UNIQUE,
  due_at date NOT NULL,
  type text NOT NULL,
  status text NOT NULL DEFAULT 'Open',
  priority text NOT NULL DEFAULT 'Normal',
  title text NOT NULL,
  description text NOT NULL,
  source_id text,
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  uhid text,
  patient_name text,
  phone text,
  owner text,
  action_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_status_due ON automation_tasks (status, due_at);
CREATE INDEX IF NOT EXISTS idx_communication_status ON communication_logs (status);
CREATE INDEX IF NOT EXISTS idx_ai_status ON ai_case_reviews (status);

-- ---------------------------------------------------------------------------
-- RBAC / access control (users, multi-role assignment, revocable sessions,
-- two-person approvals, break-glass grants). The JSON stores in lib/access/*
-- mirror these shapes; activate with DATA_SOURCE=database once migrated.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS access_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id text UNIQUE,
  status text NOT NULL DEFAULT 'active',
  name text NOT NULL,
  username text NOT NULL UNIQUE,
  email text,
  roles text[] NOT NULL,
  default_role text NOT NULL,
  password_hash text NOT NULL,
  must_change_password boolean NOT NULL DEFAULT true,
  totp_secret text,
  totp_enabled boolean NOT NULL DEFAULT false,
  failed_login_count integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS access_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id text UNIQUE,
  token_hash text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES access_users(id) ON DELETE CASCADE,
  active_role text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  elevated_until timestamptz,
  pre_elevation_role text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  ip text,
  user_agent text,
  revoked_at timestamptz
);

CREATE TABLE IF NOT EXISTS access_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id text UNIQUE,
  type text NOT NULL DEFAULT 'role-change',
  target_user_id uuid NOT NULL REFERENCES access_users(id) ON DELETE CASCADE,
  payload jsonb NOT NULL,
  requested_by uuid NOT NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending',
  decided_by uuid,
  decided_at timestamptz
);

CREATE TABLE IF NOT EXISTS access_break_glass_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id text UNIQUE,
  user_id uuid NOT NULL REFERENCES access_users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_count integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_access_sessions_user ON access_sessions (user_id, revoked_at);
CREATE INDEX IF NOT EXISTS idx_access_approvals_status ON access_approvals (status);

-- Patient portal auth (separate user base from staff access_users).
CREATE TABLE IF NOT EXISTS patient_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id text UNIQUE,
  phone text NOT NULL UNIQUE,
  email text UNIQUE,
  password_hash text,
  failed_login_count integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS patient_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id text UNIQUE,
  token_hash text NOT NULL UNIQUE,
  identity_id uuid NOT NULL REFERENCES patient_identities(id) ON DELETE CASCADE,
  phone text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  ip text,
  user_agent text,
  revoked_at timestamptz
);

CREATE TABLE IF NOT EXISTS patient_login_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id text UNIQUE,
  kind text NOT NULL,
  phone text NOT NULL,
  secret_hash text NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_patient_sessions_identity ON patient_sessions (identity_id, revoked_at);
CREATE INDEX IF NOT EXISTS idx_patient_challenges_phone ON patient_login_challenges (phone, kind, consumed_at);

-- Generic JSONB document backend (confirmed decision): each store persists its
-- whole document under one key. Relational tables above remain the upgrade
-- path; the audit_events table stays fully relational.
CREATE TABLE IF NOT EXISTS store_documents (
  key text PRIMARY KEY,
  doc jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
