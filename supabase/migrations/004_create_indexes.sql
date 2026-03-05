-- マカセテ在宅 - Indexes
-- 004: Performance indexes for high-frequency queries

-- Requests
CREATE INDEX idx_requests_status ON requests(organization_id, status);
CREATE INDEX idx_requests_pharmacy ON requests(pharmacy_id, received_at DESC);
CREATE INDEX idx_requests_received ON requests(received_at DESC);
CREATE INDEX idx_requests_sla ON requests(organization_id, sla_met) WHERE sla_met IS NOT NULL;

-- Assignments
CREATE INDEX idx_assignments_pharmacist ON assignments(pharmacist_id, assigned_at DESC);
CREATE INDEX idx_assignments_request ON assignments(request_id);
CREATE INDEX idx_assignments_pending ON assignments(assigned_at) WHERE response IS NULL;

-- Handovers
CREATE INDEX idx_handovers_pharmacy ON handovers(pharmacy_id, created_at DESC);
CREATE INDEX idx_handovers_unconfirmed ON handovers(created_at DESC) WHERE confirmed_at IS NULL;
CREATE INDEX idx_handovers_pharmacist ON handovers(pharmacist_id, created_at DESC);

-- Patients
CREATE INDEX idx_patients_pharmacy ON patients(pharmacy_id);
CREATE INDEX idx_patients_org ON patients(organization_id);

-- Shift schedules
CREATE INDEX idx_shifts_date ON shift_schedules(shift_date, shift_type);
CREATE INDEX idx_shifts_pharmacist ON shift_schedules(pharmacist_id, shift_date);

-- Billings
CREATE INDEX idx_billings_month ON billings(billing_month, status);
CREATE INDEX idx_billings_pharmacy ON billings(pharmacy_id, billing_month DESC);

-- Audit logs
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_target ON audit_logs(target_type, target_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at DESC);

-- Notification logs
CREATE INDEX idx_notif_status ON notification_logs(status, next_retry_at);
CREATE INDEX idx_notif_recipient ON notification_logs(recipient_id, created_at DESC);
CREATE INDEX idx_notif_trigger ON notification_logs(trigger_entity, trigger_id);

-- Users
CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_users_pharmacy ON users(pharmacy_id);
CREATE INDEX idx_users_role ON users(organization_id, role);

-- Pharmacies
CREATE INDEX idx_pharmacies_org ON pharmacies(organization_id);
CREATE INDEX idx_pharmacies_status ON pharmacies(organization_id, status);
