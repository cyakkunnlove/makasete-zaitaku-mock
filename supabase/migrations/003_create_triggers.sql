-- マカセテ在宅 - Triggers (draft)
-- 003: updated_at, SLA, audit, request_events helpers

create or replace function update_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_organizations_updated_at before update on organizations for each row execute function update_updated_at();
create trigger trg_regions_updated_at before update on regions for each row execute function update_updated_at();
create trigger trg_operation_units_updated_at before update on operation_units for each row execute function update_updated_at();
create trigger trg_pharmacies_updated_at before update on pharmacies for each row execute function update_updated_at();
create trigger trg_users_updated_at before update on users for each row execute function update_updated_at();
create trigger trg_patients_updated_at before update on patients for each row execute function update_updated_at();
create trigger trg_patient_visit_rules_updated_at before update on patient_visit_rules for each row execute function update_updated_at();
create trigger trg_requests_updated_at before update on requests for each row execute function update_updated_at();
create trigger trg_handovers_updated_at before update on handovers for each row execute function update_updated_at();

create or replace function calc_sla() returns trigger as $$
declare
  v_target int;
begin
  if new.first_callback_at is not null and new.received_at is not null then
    select coalesce(r.sla_target_minutes, o.sla_target_minutes, 45)
      into v_target
      from organizations o
      left join regions r on r.id = new.region_id
     where o.id = new.organization_id;

    new.sla_met := (extract(epoch from (new.first_callback_at - new.received_at)) / 60) <= coalesce(v_target, 45);
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_requests_sla before insert or update on requests for each row execute function calc_sla();

create or replace function audit_trigger_fn() returns trigger as $$
declare
  v_org_id uuid;
  v_pharmacy_id uuid;
  v_region_id uuid;
  v_operation_unit_id uuid;
  v_result text := 'success';
  v_target_id text;
begin
  if tg_op = 'DELETE' then
    v_org_id := old.organization_id;
    v_target_id := old.id::text;
  else
    v_org_id := new.organization_id;
    v_target_id := new.id::text;
  end if;

  if tg_table_name = 'patients' then
    v_pharmacy_id := coalesce(new.pharmacy_id, old.pharmacy_id);
  elsif tg_table_name = 'requests' then
    v_pharmacy_id := coalesce(new.pharmacy_id, old.pharmacy_id);
    v_region_id := coalesce(new.region_id, old.region_id);
    v_operation_unit_id := coalesce(new.operation_unit_id, old.operation_unit_id);
  elsif tg_table_name = 'handovers' then
    v_pharmacy_id := coalesce(new.pharmacy_id, old.pharmacy_id);
  elsif tg_table_name = 'pharmacies' then
    v_pharmacy_id := coalesce(new.id, old.id);
    v_region_id := coalesce(new.region_id, old.region_id);
    v_operation_unit_id := coalesce(new.operation_unit_id, old.operation_unit_id);
  end if;

  insert into audit_logs (
    organization_id,
    pharmacy_id,
    region_id,
    operation_unit_id,
    user_id,
    action,
    target_type,
    target_id,
    result,
    details
  ) values (
    v_org_id,
    v_pharmacy_id,
    v_region_id,
    v_operation_unit_id,
    auth.uid(),
    tg_table_name || '.' || lower(tg_op),
    tg_table_name,
    v_target_id,
    v_result,
    case
      when tg_op = 'INSERT' then jsonb_build_object('new', to_jsonb(new))
      when tg_op = 'UPDATE' then jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new))
      when tg_op = 'DELETE' then jsonb_build_object('old', to_jsonb(old))
    end
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_requests_audit after insert or update or delete on requests for each row execute function audit_trigger_fn();
create trigger trg_assignments_audit after insert or update on assignments for each row execute function audit_trigger_fn();
create trigger trg_handovers_audit after insert or update on handovers for each row execute function audit_trigger_fn();
create trigger trg_patients_audit after insert or update on patients for each row execute function audit_trigger_fn();
create trigger trg_pharmacies_audit after insert or update on pharmacies for each row execute function audit_trigger_fn();

create or replace function request_events_status_trigger() returns trigger as $$
begin
  if tg_op = 'INSERT' then
    insert into request_events (request_id, actor_user_id, actor_role, event_type, new_status, note, metadata)
    values (new.id, auth.uid(), (select role from users where id = auth.uid()), 'request_created', new.status, new.notes, '{}'::jsonb);
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into request_events (request_id, actor_user_id, actor_role, event_type, old_status, new_status, note, metadata)
    values (new.id, auth.uid(), (select role from users where id = auth.uid()), 'status_changed', old.status, new.status, new.notes, '{}'::jsonb);
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger trg_request_events after insert or update on requests for each row execute function request_events_status_trigger();
