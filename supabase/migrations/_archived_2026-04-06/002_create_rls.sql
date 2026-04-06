-- マカセテ在宅 - Row Level Security (draft)
-- 002: RLS aligned with role + pharmacy_id + region_id + operation_unit_id

alter table organizations enable row level security;
alter table regions enable row level security;
alter table operation_units enable row level security;
alter table pharmacies enable row level security;
alter table users enable row level security;
alter table patients enable row level security;
alter table patient_visit_rules enable row level security;
alter table requests enable row level security;
alter table request_events enable row level security;
alter table assignments enable row level security;
alter table checklists enable row level security;
alter table handovers enable row level security;
alter table handover_confirmations enable row level security;
alter table shift_schedules enable row level security;
alter table billings enable row level security;
alter table notification_logs enable row level security;
alter table audit_logs enable row level security;

create or replace function get_user_role() returns text as $$
  select role from users where id = auth.uid();
$$ language sql security definer stable;

create or replace function get_user_org_id() returns uuid as $$
  select organization_id from users where id = auth.uid();
$$ language sql security definer stable;

create or replace function get_user_pharmacy_id() returns uuid as $$
  select pharmacy_id from users where id = auth.uid();
$$ language sql security definer stable;

create or replace function get_user_region_id() returns uuid as $$
  select region_id from users where id = auth.uid();
$$ language sql security definer stable;

create or replace function get_user_operation_unit_id() returns uuid as $$
  select operation_unit_id from users where id = auth.uid();
$$ language sql security definer stable;

-- organizations / regions / operation_units
create policy org_read on organizations for select using (id = get_user_org_id());
create policy regions_read on regions for select using (organization_id = get_user_org_id());
create policy operation_units_read on operation_units for select using (organization_id = get_user_org_id());

-- regional admin manages region-scoped master data
create policy regions_regional_admin_update on regions for update using (
  get_user_role() = 'regional_admin' and id = get_user_region_id()
);
create policy operation_units_regional_admin_update on operation_units for update using (
  get_user_role() = 'regional_admin' and region_id = get_user_region_id()
);

-- users
create policy users_read_same_org on users for select using (organization_id = get_user_org_id());
create policy users_update_self on users for update using (id = auth.uid());

-- pharmacies
create policy pharmacies_regional_admin_manage on pharmacies for all using (
  get_user_role() = 'regional_admin'
  and region_id = get_user_region_id()
);
create policy pharmacies_pharmacy_read_own on pharmacies for select using (
  id = get_user_pharmacy_id()
);
create policy pharmacies_system_admin_read on pharmacies for select using (
  get_user_role() = 'system_admin' and organization_id = get_user_org_id()
);

-- patients
create policy patients_pharmacy_scope on patients for select using (
  get_user_role() in ('pharmacy_admin', 'pharmacy_staff')
  and pharmacy_id = get_user_pharmacy_id()
);
create policy patients_pharmacy_admin_update on patients for update using (
  get_user_role() = 'pharmacy_admin'
  and pharmacy_id = get_user_pharmacy_id()
);
create policy patients_pharmacy_staff_update on patients for update using (
  get_user_role() = 'pharmacy_staff'
  and pharmacy_id = get_user_pharmacy_id()
);
create policy patients_regional_admin_minimum_read on patients for select using (
  get_user_role() = 'regional_admin'
  and pharmacy_id in (select id from pharmacies where region_id = get_user_region_id())
);
create policy patients_night_pharmacist_request_scoped on patients for select using (
  get_user_role() = 'night_pharmacist'
  and id in (
    select r.patient_id
    from requests r
    join assignments a on a.request_id = r.id
    where a.pharmacist_id = auth.uid()
      and r.patient_id is not null
  )
);

-- patient_visit_rules
create policy visit_rules_same_patient_scope on patient_visit_rules for select using (
  patient_id in (select id from patients where pharmacy_id = get_user_pharmacy_id())
);
create policy visit_rules_admin_update on patient_visit_rules for all using (
  get_user_role() = 'pharmacy_admin'
  and patient_id in (select id from patients where pharmacy_id = get_user_pharmacy_id())
);

-- requests
create policy requests_regional_admin_manage on requests for all using (
  get_user_role() = 'regional_admin'
  and region_id = get_user_region_id()
);
create policy requests_pharmacy_read on requests for select using (
  get_user_role() in ('pharmacy_admin', 'pharmacy_staff')
  and pharmacy_id = get_user_pharmacy_id()
);
create policy requests_night_pharmacist_read on requests for select using (
  get_user_role() = 'night_pharmacist'
  and id in (select request_id from assignments where pharmacist_id = auth.uid())
);
create policy requests_night_pharmacist_update on requests for update using (
  get_user_role() = 'night_pharmacist'
  and id in (select request_id from assignments where pharmacist_id = auth.uid())
);

-- request_events
create policy request_events_regional_admin on request_events for select using (
  request_id in (select id from requests where region_id = get_user_region_id())
);
create policy request_events_pharmacy on request_events for select using (
  request_id in (select id from requests where pharmacy_id = get_user_pharmacy_id())
);
create policy request_events_night_pharmacist on request_events for select using (
  request_id in (select request_id from assignments where pharmacist_id = auth.uid())
);

-- assignments
create policy assignments_regional_admin_manage on assignments for all using (
  get_user_role() = 'regional_admin'
  and request_id in (select id from requests where region_id = get_user_region_id())
);
create policy assignments_night_pharmacist_own on assignments for select using (
  pharmacist_id = auth.uid()
);
create policy assignments_pharmacy_read on assignments for select using (
  request_id in (select id from requests where pharmacy_id = get_user_pharmacy_id())
);

-- checklists
create policy checklists_regional_admin on checklists for select using (
  request_id in (select id from requests where region_id = get_user_region_id())
);
create policy checklists_night_pharmacist on checklists for all using (
  assignment_id in (select id from assignments where pharmacist_id = auth.uid())
);

-- handovers
create policy handovers_regional_admin_read on handovers for select using (
  pharmacy_id in (select id from pharmacies where region_id = get_user_region_id())
);
create policy handovers_night_pharmacist_manage on handovers for all using (
  pharmacist_id = auth.uid()
);
create policy handovers_pharmacy_read on handovers for select using (
  pharmacy_id = get_user_pharmacy_id()
  and get_user_role() in ('pharmacy_admin', 'pharmacy_staff')
);
create policy handovers_pharmacy_admin_update on handovers for update using (
  pharmacy_id = get_user_pharmacy_id()
  and get_user_role() = 'pharmacy_admin'
);

-- handover confirmations
create policy handover_conf_pharmacy_read on handover_confirmations for select using (
  pharmacy_id = get_user_pharmacy_id()
);
create policy handover_conf_pharmacy_insert on handover_confirmations for insert with check (
  pharmacy_id = get_user_pharmacy_id()
  and get_user_role() in ('pharmacy_admin', 'pharmacy_staff')
);

-- shifts
create policy shifts_regional_admin_manage on shift_schedules for all using (
  get_user_role() = 'regional_admin'
  and organization_id = get_user_org_id()
);
create policy shifts_night_pharmacist_read on shift_schedules for select using (
  pharmacist_id = auth.uid()
);

-- billings
create policy billings_pharmacy_read on billings for select using (
  pharmacy_id = get_user_pharmacy_id()
  and get_user_role() in ('pharmacy_admin', 'pharmacy_staff')
);
create policy billings_system_admin_read on billings for select using (
  get_user_role() = 'system_admin'
  and organization_id = get_user_org_id()
);

-- notifications
create policy notif_regional_admin_read on notification_logs for select using (
  region_id = get_user_region_id()
  and get_user_role() = 'regional_admin'
);
create policy notif_pharmacy_read on notification_logs for select using (
  pharmacy_id = get_user_pharmacy_id()
  and get_user_role() in ('pharmacy_admin', 'pharmacy_staff')
);
create policy notif_system_admin_read on notification_logs for select using (
  get_user_role() = 'system_admin'
  and organization_id = get_user_org_id()
);

-- audit logs
create policy audit_system_admin_read on audit_logs for select using (
  get_user_role() = 'system_admin'
  and organization_id = get_user_org_id()
);
create policy audit_regional_admin_read on audit_logs for select using (
  get_user_role() = 'regional_admin'
  and region_id = get_user_region_id()
);
create policy audit_insert on audit_logs for insert with check (true);
