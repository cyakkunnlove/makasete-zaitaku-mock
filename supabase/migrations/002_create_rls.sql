-- マカセテ在宅 - Row Level Security Policies
-- 002: RLS for all tables

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE handovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE billings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION get_user_role() RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: get current user's pharmacy_id
CREATE OR REPLACE FUNCTION get_user_pharmacy_id() RETURNS UUID AS $$
  SELECT pharmacy_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: get current user's organization_id
CREATE OR REPLACE FUNCTION get_user_org_id() RETURNS UUID AS $$
  SELECT organization_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ===== organizations =====
CREATE POLICY "org_read" ON organizations FOR SELECT
  USING (id = get_user_org_id());

-- ===== users =====
CREATE POLICY "users_read_own_org" ON users FOR SELECT
  USING (organization_id = get_user_org_id());
CREATE POLICY "users_update_self" ON users FOR UPDATE
  USING (id = auth.uid());

-- ===== pharmacies =====
-- Admin: all pharmacies in org
CREATE POLICY "pharmacies_admin_all" ON pharmacies FOR ALL
  USING (organization_id = get_user_org_id() AND get_user_role() = 'admin');
-- Pharmacy roles: own pharmacy only
CREATE POLICY "pharmacies_own" ON pharmacies FOR SELECT
  USING (id = get_user_pharmacy_id());
-- Pharmacist: all pharmacies (need to see where to go)
CREATE POLICY "pharmacies_pharmacist_read" ON pharmacies FOR SELECT
  USING (organization_id = get_user_org_id() AND get_user_role() = 'pharmacist');

-- ===== patients =====
-- Admin: all
CREATE POLICY "patients_admin" ON patients FOR ALL
  USING (organization_id = get_user_org_id() AND get_user_role() = 'admin');
-- Pharmacy: own patients
CREATE POLICY "patients_pharmacy" ON patients FOR ALL
  USING (pharmacy_id = get_user_pharmacy_id() AND get_user_role() IN ('pharmacy_admin', 'pharmacy_staff'));
-- Pharmacist: read all (need patient info for visits)
CREATE POLICY "patients_pharmacist_read" ON patients FOR SELECT
  USING (organization_id = get_user_org_id() AND get_user_role() = 'pharmacist');

-- ===== requests =====
-- Admin: all
CREATE POLICY "requests_admin" ON requests FOR ALL
  USING (organization_id = get_user_org_id() AND get_user_role() = 'admin');
-- Pharmacy: own pharmacy requests (read only)
CREATE POLICY "requests_pharmacy_read" ON requests FOR SELECT
  USING (pharmacy_id = get_user_pharmacy_id());
-- Pharmacist: assigned requests + unassigned (for potential assignment)
CREATE POLICY "requests_pharmacist_read" ON requests FOR SELECT
  USING (
    organization_id = get_user_org_id()
    AND get_user_role() = 'pharmacist'
    AND (
      id IN (SELECT request_id FROM assignments WHERE pharmacist_id = auth.uid())
      OR status IN ('received', 'fax_pending', 'fax_received', 'assigning')
    )
  );
-- Pharmacist: update status on assigned requests
CREATE POLICY "requests_pharmacist_update" ON requests FOR UPDATE
  USING (
    get_user_role() = 'pharmacist'
    AND id IN (SELECT request_id FROM assignments WHERE pharmacist_id = auth.uid())
  );

-- ===== assignments =====
-- Admin: all
CREATE POLICY "assignments_admin" ON assignments FOR ALL
  USING (get_user_role() = 'admin');
-- Pharmacist: own assignments
CREATE POLICY "assignments_pharmacist" ON assignments FOR ALL
  USING (pharmacist_id = auth.uid());
-- Pharmacy: read assignments for their requests
CREATE POLICY "assignments_pharmacy_read" ON assignments FOR SELECT
  USING (request_id IN (SELECT id FROM requests WHERE pharmacy_id = get_user_pharmacy_id()));

-- ===== checklists =====
CREATE POLICY "checklists_admin" ON checklists FOR ALL
  USING (get_user_role() = 'admin');
CREATE POLICY "checklists_pharmacist" ON checklists FOR ALL
  USING (assignment_id IN (SELECT id FROM assignments WHERE pharmacist_id = auth.uid()));

-- ===== handovers =====
-- Admin: all
CREATE POLICY "handovers_admin" ON handovers FOR ALL
  USING (get_user_role() = 'admin');
-- Pharmacist: create own, read own
CREATE POLICY "handovers_pharmacist" ON handovers FOR ALL
  USING (pharmacist_id = auth.uid());
-- Pharmacy: read + confirm own pharmacy handovers
CREATE POLICY "handovers_pharmacy" ON handovers FOR SELECT
  USING (pharmacy_id = get_user_pharmacy_id());
CREATE POLICY "handovers_pharmacy_confirm" ON handovers FOR UPDATE
  USING (pharmacy_id = get_user_pharmacy_id() AND get_user_role() = 'pharmacy_admin')
  WITH CHECK (pharmacy_id = get_user_pharmacy_id());

-- ===== shift_schedules =====
-- Admin: full access
CREATE POLICY "shifts_admin" ON shift_schedules FOR ALL
  USING (organization_id = get_user_org_id() AND get_user_role() = 'admin');
-- Pharmacist: read own shifts
CREATE POLICY "shifts_pharmacist_read" ON shift_schedules FOR SELECT
  USING (pharmacist_id = auth.uid());

-- ===== billings =====
-- Admin: full access
CREATE POLICY "billings_admin" ON billings FOR ALL
  USING (organization_id = get_user_org_id() AND get_user_role() = 'admin');
-- Pharmacy: read own billings
CREATE POLICY "billings_pharmacy_read" ON billings FOR SELECT
  USING (pharmacy_id = get_user_pharmacy_id());

-- ===== audit_logs =====
-- Admin: read only (append-only, no delete)
CREATE POLICY "audit_admin_read" ON audit_logs FOR SELECT
  USING (organization_id = get_user_org_id() AND get_user_role() = 'admin');
-- Insert allowed for all authenticated users (via trigger)
CREATE POLICY "audit_insert" ON audit_logs FOR INSERT
  WITH CHECK (true);

-- ===== notification_logs =====
-- Admin: read all
CREATE POLICY "notif_admin_read" ON notification_logs FOR SELECT
  USING (organization_id = get_user_org_id() AND get_user_role() = 'admin');
-- Users: read own notifications
CREATE POLICY "notif_own_read" ON notification_logs FOR SELECT
  USING (recipient_id = auth.uid());
