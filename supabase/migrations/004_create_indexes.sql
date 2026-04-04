-- マカセテ在宅 - Indexes (draft)
-- 004: indexes for region/pharmacy scoped operations

-- organizations / regions / units
create index if not exists idx_regions_org on regions(organization_id);
create index if not exists idx_operation_units_region on operation_units(region_id);

-- pharmacies
create index if not exists idx_pharmacies_org on pharmacies(organization_id);
create index if not exists idx_pharmacies_region on pharmacies(region_id, status);
create index if not exists idx_pharmacies_operation_unit on pharmacies(operation_unit_id);
create index if not exists idx_pharmacies_status on pharmacies(status);

-- users
create index if not exists idx_users_org on users(organization_id, role);
create index if not exists idx_users_pharmacy on users(pharmacy_id, role);
create index if not exists idx_users_region on users(region_id, role);
create index if not exists idx_users_operation_unit on users(operation_unit_id, role);

-- patients
create index if not exists idx_patients_pharmacy on patients(pharmacy_id);
create index if not exists idx_patients_org on patients(organization_id);
create index if not exists idx_patients_name on patients(full_name);

-- patient visit rules
create index if not exists idx_patient_visit_rules_patient on patient_visit_rules(patient_id, active);

-- requests
create index if not exists idx_requests_status on requests(organization_id, status);
create index if not exists idx_requests_region_status on requests(region_id, status, received_at desc);
create index if not exists idx_requests_pharmacy_received on requests(pharmacy_id, received_at desc);
create index if not exists idx_requests_operation_unit on requests(operation_unit_id, received_at desc);
create index if not exists idx_requests_patient on requests(patient_id);
create index if not exists idx_requests_sla on requests(organization_id, sla_met) where sla_met is not null;

-- request events
create index if not exists idx_request_events_request on request_events(request_id, created_at desc);
create index if not exists idx_request_events_actor on request_events(actor_user_id, created_at desc);

-- assignments
create index if not exists idx_assignments_request on assignments(request_id);
create index if not exists idx_assignments_pharmacist on assignments(pharmacist_id, assigned_at desc);
create index if not exists idx_assignments_pending on assignments(assigned_at) where response is null;

-- checklists
create index if not exists idx_checklists_request on checklists(request_id);
create index if not exists idx_checklists_assignment on checklists(assignment_id);

-- handovers
create index if not exists idx_handovers_pharmacy on handovers(pharmacy_id, created_at desc);
create index if not exists idx_handovers_pharmacist on handovers(pharmacist_id, created_at desc);
create index if not exists idx_handovers_patient on handovers(patient_id, created_at desc);
create index if not exists idx_handovers_unconfirmed on handovers(created_at desc) where confirmed_at is null;

-- handover confirmations
create index if not exists idx_handover_confirmations_handover on handover_confirmations(handover_id, confirmed_at desc);
create index if not exists idx_handover_confirmations_user on handover_confirmations(user_id, confirmed_at desc);
create index if not exists idx_handover_confirmations_type on handover_confirmations(confirmation_type, confirmed_at desc);

-- shifts
create index if not exists idx_shifts_date on shift_schedules(shift_date, shift_type);
create index if not exists idx_shifts_pharmacist on shift_schedules(pharmacist_id, shift_date);

-- billings
create index if not exists idx_billings_pharmacy on billings(pharmacy_id, billing_month desc);
create index if not exists idx_billings_month on billings(billing_month, status);

-- notifications
create index if not exists idx_notif_region on notification_logs(region_id, created_at desc);
create index if not exists idx_notif_pharmacy on notification_logs(pharmacy_id, created_at desc);
create index if not exists idx_notif_status on notification_logs(status, next_retry_at);
create index if not exists idx_notif_recipient on notification_logs(recipient_id, created_at desc);

-- audit logs
create index if not exists idx_audit_created on audit_logs(created_at desc);
create index if not exists idx_audit_user on audit_logs(user_id, created_at desc);
create index if not exists idx_audit_region on audit_logs(region_id, created_at desc);
create index if not exists idx_audit_pharmacy on audit_logs(pharmacy_id, created_at desc);
create index if not exists idx_audit_target on audit_logs(target_type, target_id);
create index if not exists idx_audit_result on audit_logs(result, created_at desc);
