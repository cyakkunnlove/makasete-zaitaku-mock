-- マカセテ在宅 - Database Schema
-- 001: Create all tables

-- ===== organizations =====
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  legal_name TEXT,
  phone TEXT,
  address TEXT,
  night_start TIME DEFAULT '22:00',
  night_end TIME DEFAULT '06:00',
  sla_target_minutes INT DEFAULT 15,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===== pharmacies =====
CREATE TABLE pharmacies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  area TEXT,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  fax TEXT,
  forwarding_phone TEXT,
  forwarding_status TEXT DEFAULT 'off' CHECK (forwarding_status IN ('on', 'off')),
  contract_date DATE,
  monthly_fee INT DEFAULT 100000,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'terminated')),
  patient_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===== users (linked to Supabase Auth) =====
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  pharmacy_id UUID REFERENCES pharmacies(id),
  role TEXT NOT NULL CHECK (role IN ('admin', 'pharmacy_admin', 'pharmacy_staff', 'pharmacist')),
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  line_user_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===== patients =====
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  pharmacy_id UUID REFERENCES pharmacies(id),
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  address TEXT NOT NULL,
  phone TEXT,
  emergency_contact_name TEXT NOT NULL,
  emergency_contact_phone TEXT NOT NULL,
  emergency_contact_relation TEXT,
  doctor_name TEXT,
  doctor_clinic TEXT,
  doctor_night_phone TEXT,
  medical_history TEXT,
  allergies TEXT,
  current_medications TEXT,
  visit_notes TEXT,
  risk_score INT DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 10),
  requires_multi_visit BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'incomplete')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===== requests =====
CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  pharmacy_id UUID REFERENCES pharmacies(id),
  patient_id UUID REFERENCES patients(id),
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('high', 'normal', 'low')),
  status TEXT DEFAULT 'received' CHECK (status IN (
    'received', 'fax_pending', 'fax_received', 'assigning',
    'assigned', 'checklist', 'dispatched', 'arrived',
    'in_progress', 'completed', 'cancelled'
  )),
  -- Triage
  triage_symptom TEXT,
  triage_vitals_change TEXT,
  triage_consciousness TEXT,
  triage_urgency TEXT,
  -- FAX
  fax_received_at TIMESTAMPTZ,
  fax_image_url TEXT,
  -- SLA
  first_callback_at TIMESTAMPTZ,
  sla_met BOOLEAN,
  -- Notes
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===== assignments =====
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
  pharmacist_id UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,
  response TEXT CHECK (response IN ('accepted', 'declined', 'timeout')),
  timeout_minutes INT DEFAULT 10,
  dispatched_at TIMESTAMPTZ,
  arrived_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  travel_distance_km DECIMAL(5,1),
  travel_mode TEXT,
  is_multi_visit BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== checklists =====
CREATE TABLE checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  checklist_type TEXT NOT NULL CHECK (checklist_type IN ('initial', 'routine', 'emergency')),
  items JSONB NOT NULL DEFAULT '[]',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== handovers (SBAR format) =====
CREATE TABLE handovers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES requests(id),
  assignment_id UUID REFERENCES assignments(id),
  pharmacist_id UUID REFERENCES users(id),
  pharmacy_id UUID REFERENCES pharmacies(id),
  patient_id UUID REFERENCES patients(id),
  -- SBAR
  situation TEXT,
  background TEXT,
  assessment TEXT,
  recommendation TEXT,
  -- Vitals
  vitals JSONB,
  medication_administered TEXT,
  patient_condition TEXT,
  free_text TEXT,
  -- Confirmation
  confirmed_by UUID REFERENCES users(id),
  confirmed_at TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ,
  reminder_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===== shift_schedules =====
CREATE TABLE shift_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  pharmacist_id UUID REFERENCES users(id),
  shift_date DATE NOT NULL,
  shift_type TEXT DEFAULT 'primary' CHECK (shift_type IN ('primary', 'backup')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(pharmacist_id, shift_date, shift_type)
);

-- ===== billings =====
CREATE TABLE billings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  pharmacy_id UUID REFERENCES pharmacies(id),
  billing_month DATE NOT NULL,
  monthly_fee INT NOT NULL,
  tax_amount INT GENERATED ALWAYS AS (monthly_fee / 10) STORED,
  total_amount INT GENERATED ALWAYS AS (monthly_fee + monthly_fee / 10) STORED,
  status TEXT DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid', 'overdue')),
  invoiced_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(pharmacy_id, billing_month)
);

-- ===== audit_logs =====
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== notification_logs =====
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  notification_type TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('line', 'phone', 'sms', 'email', 'push', 'app')),
  recipient_id UUID REFERENCES users(id),
  recipient_contact TEXT,
  trigger_entity TEXT,
  trigger_id UUID,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'sent', 'delivered', 'read', 'responded', 'failed', 'expired'
  )),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  response_data JSONB,
  error_message TEXT,
  retry_count INT DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
