-- マカセテ在宅 - Database Schema (draft before real Supabase project creation)
-- 001: Create core tables aligned with current role / scope model

create extension if not exists pgcrypto;

-- ===== organizations =====
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  phone text,
  address text,
  night_start time default '22:00',
  night_end time default '06:00',
  sla_target_minutes int default 45,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ===== regions =====
create table if not exists regions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  name text not null,
  hotline_phone text,
  fax_routing_policy text,
  delegation_rule text,
  sla_target_minutes int default 45,
  pending_escalation_minutes int default 15,
  handover_reminder_minutes int default 30,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ===== operation_units =====
create table if not exists operation_units (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  region_id uuid references regions(id) on delete cascade,
  name text not null,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ===== pharmacies =====
create table if not exists pharmacies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  region_id uuid references regions(id) on delete set null,
  operation_unit_id uuid references operation_units(id) on delete set null,
  name text not null,
  area text,
  address text not null,
  phone text not null,
  fax text,
  forwarding_phone text,
  forwarding_status text default 'off' check (forwarding_status in ('on', 'off')),
  contract_date date,
  saas_monthly_fee numeric default 0,
  night_monthly_fee numeric default 0,
  night_delegation_enabled boolean default false,
  default_morning_note text,
  status text default 'pending' check (status in ('pending', 'active', 'suspended', 'terminated')),
  patient_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ===== users =====
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references organizations(id) on delete cascade,
  pharmacy_id uuid references pharmacies(id) on delete set null,
  region_id uuid references regions(id) on delete set null,
  operation_unit_id uuid references operation_units(id) on delete set null,
  role text not null check (role in ('system_admin', 'regional_admin', 'pharmacy_admin', 'pharmacy_staff', 'night_pharmacist')),
  full_name text not null,
  phone text,
  email text unique,
  line_user_id text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ===== patients =====
create table if not exists patients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  pharmacy_id uuid references pharmacies(id) on delete set null,
  full_name text not null,
  date_of_birth date,
  address text not null,
  phone text,
  emergency_contact_name text not null,
  emergency_contact_phone text not null,
  emergency_contact_relation text,
  doctor_name text,
  doctor_clinic text,
  doctor_night_phone text,
  medical_history text,
  allergies text,
  current_medications text,
  visit_notes text,
  insurance_info text,
  disease_name text,
  risk_score int default 0 check (risk_score between 0 and 10),
  requires_multi_visit boolean default false,
  status text default 'active' check (status in ('active', 'inactive', 'incomplete')),
  created_by uuid references users(id),
  updated_by uuid references users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ===== patient_visit_rules =====
create table if not exists patient_visit_rules (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade,
  pattern text not null check (pattern in ('weekly', 'biweekly', 'custom')),
  weekday int,
  interval_weeks int default 1,
  anchor_week int,
  preferred_time text,
  monthly_visit_limit int default 4,
  active boolean default true,
  custom_dates jsonb default '[]'::jsonb,
  excluded_dates jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ===== requests =====
create table if not exists requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  pharmacy_id uuid references pharmacies(id) on delete set null,
  region_id uuid references regions(id) on delete set null,
  operation_unit_id uuid references operation_units(id) on delete set null,
  patient_id uuid references patients(id) on delete set null,
  received_at timestamptz not null default now(),
  priority text default 'normal' check (priority in ('high', 'normal', 'low')),
  status text default 'received' check (status in ('received', 'fax_pending', 'fax_received', 'assigning', 'assigned', 'checklist', 'dispatched', 'arrived', 'in_progress', 'completed', 'cancelled')),
  triage_symptom text,
  triage_vitals_change text,
  triage_consciousness text,
  triage_urgency text,
  fax_received_at timestamptz,
  fax_image_url text,
  first_callback_at timestamptz,
  sla_met boolean,
  notes text,
  completed_at timestamptz,
  created_by uuid references users(id),
  updated_by uuid references users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ===== request_events =====
create table if not exists request_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references requests(id) on delete cascade,
  actor_user_id uuid references users(id) on delete set null,
  actor_role text,
  event_type text not null,
  old_status text,
  new_status text,
  note text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- ===== assignments =====
create table if not exists assignments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references requests(id) on delete cascade,
  pharmacist_id uuid references users(id) on delete set null,
  assigned_by uuid references users(id) on delete set null,
  assigned_at timestamptz default now(),
  responded_at timestamptz,
  response text check (response in ('accepted', 'declined', 'timeout')),
  timeout_minutes int default 10,
  dispatched_at timestamptz,
  arrived_at timestamptz,
  completed_at timestamptz,
  travel_distance_km numeric,
  travel_mode text,
  is_multi_visit boolean default false,
  created_at timestamptz default now()
);

-- ===== checklists =====
create table if not exists checklists (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references requests(id) on delete cascade,
  assignment_id uuid references assignments(id) on delete cascade,
  checklist_type text not null check (checklist_type in ('initial', 'routine', 'emergency')),
  items jsonb not null default '[]'::jsonb,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- ===== handovers =====
create table if not exists handovers (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references requests(id) on delete set null,
  assignment_id uuid references assignments(id) on delete set null,
  pharmacist_id uuid references users(id) on delete set null,
  pharmacy_id uuid references pharmacies(id) on delete set null,
  patient_id uuid references patients(id) on delete set null,
  situation text,
  background text,
  assessment text,
  recommendation text,
  vitals jsonb,
  medication_administered text,
  patient_condition text,
  free_text text,
  confirmed_by uuid references users(id) on delete set null,
  confirmed_at timestamptz,
  reminder_sent_at timestamptz,
  report_file_url text,
  reminder_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ===== handover_confirmations =====
create table if not exists handover_confirmations (
  id uuid primary key default gen_random_uuid(),
  handover_id uuid references handovers(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  role text not null,
  confirmation_type text not null check (confirmation_type in ('staff_confirm', 'admin_final_confirm')),
  pharmacy_id uuid references pharmacies(id) on delete set null,
  note text,
  confirmed_at timestamptz default now()
);

-- ===== shift_schedules =====
create table if not exists shift_schedules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  pharmacist_id uuid references users(id) on delete set null,
  shift_date date not null,
  shift_type text default 'primary' check (shift_type in ('primary', 'backup')),
  created_at timestamptz default now(),
  unique (pharmacist_id, shift_date, shift_type)
);

-- ===== billings =====
create table if not exists billings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  pharmacy_id uuid references pharmacies(id) on delete set null,
  billing_month date not null,
  saas_fee numeric not null default 0,
  night_fee numeric not null default 0,
  total_fee numeric generated always as (coalesce(saas_fee, 0) + coalesce(night_fee, 0)) stored,
  tax_amount numeric generated always as (round((coalesce(saas_fee, 0) + coalesce(night_fee, 0)) * 0.1, 0)) stored,
  status text default 'unpaid' check (status in ('unpaid', 'paid', 'overdue')),
  invoiced_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz default now(),
  unique (pharmacy_id, billing_month)
);

-- ===== notification_logs =====
create table if not exists notification_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  region_id uuid references regions(id) on delete set null,
  pharmacy_id uuid references pharmacies(id) on delete set null,
  notification_type text not null,
  channel text not null check (channel in ('line', 'phone', 'sms', 'email', 'push', 'app')),
  recipient_id uuid references users(id) on delete set null,
  recipient_contact text,
  trigger_entity text,
  trigger_id text,
  status text default 'pending' check (status in ('pending', 'sent', 'delivered', 'read', 'responded', 'failed', 'expired')),
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  responded_at timestamptz,
  response_data jsonb,
  error_message text,
  retry_count int default 0,
  next_retry_at timestamptz,
  created_at timestamptz default now()
);

-- ===== audit_logs =====
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete set null,
  pharmacy_id uuid references pharmacies(id) on delete set null,
  region_id uuid references regions(id) on delete set null,
  operation_unit_id uuid references operation_units(id) on delete set null,
  user_id uuid references users(id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  result text not null default 'success' check (result in ('success', 'warning', 'denied')),
  details jsonb,
  ip_address inet,
  created_at timestamptz default now()
);
