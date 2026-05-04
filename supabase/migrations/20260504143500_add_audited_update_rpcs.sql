create or replace function public.update_patient_with_audit(
  p_organization_id uuid,
  p_pharmacy_id uuid,
  p_patient_id uuid,
  p_patch jsonb,
  p_audit_user_id uuid,
  p_audit_region_id uuid,
  p_audit_operation_unit_id uuid,
  p_audit_details jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_patient patients;
begin
  update patients
  set
    updated_at = coalesce(nullif(p_patch->>'updated_at', '')::timestamptz, now()),
    updated_by = coalesce(nullif(p_patch->>'updated_by', '')::uuid, updated_by),
    phone = case when p_patch ? 'phone' then p_patch->>'phone' else phone end,
    visit_notes = case when p_patch ? 'visit_notes' then p_patch->>'visit_notes' else visit_notes end,
    current_medications = case when p_patch ? 'current_medications' then p_patch->>'current_medications' else current_medications end,
    medical_history = case when p_patch ? 'medical_history' then p_patch->>'medical_history' else medical_history end,
    allergies = case when p_patch ? 'allergies' then p_patch->>'allergies' else allergies end,
    insurance_info = case when p_patch ? 'insurance_info' then p_patch->>'insurance_info' else insurance_info end,
    is_billable = case when p_patch ? 'is_billable' then (p_patch->>'is_billable')::boolean else is_billable end,
    billing_exclusion_reason = case when p_patch ? 'billing_exclusion_reason' then p_patch->>'billing_exclusion_reason' else billing_exclusion_reason end,
    medical_institution_id = case when p_patch ? 'medical_institution_id' then nullif(p_patch->>'medical_institution_id', '')::uuid else medical_institution_id end,
    doctor_clinic = case when p_patch ? 'doctor_clinic' then p_patch->>'doctor_clinic' else doctor_clinic end,
    doctor_master_id = case when p_patch ? 'doctor_master_id' then nullif(p_patch->>'doctor_master_id', '')::uuid else doctor_master_id end,
    doctor_name = case when p_patch ? 'doctor_name' then p_patch->>'doctor_name' else doctor_name end,
    doctor_night_phone = case when p_patch ? 'doctor_night_phone' then p_patch->>'doctor_night_phone' else doctor_night_phone end,
    address = case when p_patch ? 'address' then coalesce(p_patch->>'address', address) else address end,
    latitude = case when p_patch ? 'latitude' then nullif(p_patch->>'latitude', '')::double precision else latitude end,
    longitude = case when p_patch ? 'longitude' then nullif(p_patch->>'longitude', '')::double precision else longitude end,
    geocode_status = case when p_patch ? 'geocode_status' then p_patch->>'geocode_status' else geocode_status end,
    geocoded_at = case when p_patch ? 'geocoded_at' then nullif(p_patch->>'geocoded_at', '')::timestamptz else geocoded_at end,
    geocode_source = case when p_patch ? 'geocode_source' then p_patch->>'geocode_source' else geocode_source end,
    geocode_error = case when p_patch ? 'geocode_error' then p_patch->>'geocode_error' else geocode_error end,
    geocode_input_address = case when p_patch ? 'geocode_input_address' then p_patch->>'geocode_input_address' else geocode_input_address end
  where organization_id = p_organization_id
    and pharmacy_id = p_pharmacy_id
    and id = p_patient_id
  returning * into updated_patient;

  if not found then
    raise exception 'patient_not_found_or_forbidden' using errcode = 'P0002';
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
    details,
    ip_address
  ) values (
    p_organization_id,
    p_pharmacy_id,
    p_audit_region_id,
    p_audit_operation_unit_id,
    p_audit_user_id,
    'patient_updated',
    'patient',
    p_patient_id::text,
    p_audit_details,
    null
  );

  return jsonb_build_object('patient', to_jsonb(updated_patient));
end;
$$;

create or replace function public.update_billing_collection_with_audit(
  p_organization_id uuid,
  p_pharmacy_id uuid,
  p_task_id text,
  p_collection_status text,
  p_note text,
  p_handled_by text,
  p_handled_by_id uuid,
  p_handled_at timestamptz,
  p_updated_by_id uuid,
  p_audit_region_id uuid,
  p_audit_operation_unit_id uuid,
  p_audit_action text,
  p_audit_details jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_task patient_day_tasks;
begin
  update patient_day_tasks
  set
    collection_status = p_collection_status,
    note = p_note,
    handled_by = p_handled_by,
    handled_by_id = p_handled_by_id,
    handled_at = p_handled_at,
    updated_by_id = p_updated_by_id,
    updated_at = now()
  where organization_id = p_organization_id
    and pharmacy_id = p_pharmacy_id
    and id = p_task_id
  returning * into updated_task;

  if not found then
    raise exception 'billing_collection_not_found_or_forbidden' using errcode = 'P0002';
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
    details,
    ip_address
  ) values (
    p_organization_id,
    p_pharmacy_id,
    p_audit_region_id,
    p_audit_operation_unit_id,
    p_updated_by_id,
    p_audit_action,
    'patient_day_task',
    p_task_id,
    p_audit_details,
    null
  );

  return jsonb_build_object('task', to_jsonb(updated_task));
end;
$$;
