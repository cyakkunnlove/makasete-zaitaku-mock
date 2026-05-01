-- Enable RLS across app tables and deny direct anon/authenticated REST access.
-- The app uses Cognito plus server-side API authorization; server code must use
-- SUPABASE_SERVICE_ROLE_KEY before this migration is applied.

do $$
declare
  table_name text;
  tables text[] := array[
    'organizations',
    'regions',
    'operation_units',
    'pharmacies',
    'users',
    'patients',
    'patient_visit_rules',
    'requests',
    'request_events',
    'assignments',
    'checklists',
    'handovers',
    'handover_confirmations',
    'shift_schedules',
    'billings',
    'notification_logs',
    'audit_logs',
    'medical_institutions',
    'doctor_masters',
    'account_invitations',
    'user_role_assignments',
    'patient_day_tasks',
    'patient_home_photos',
    'correction_requests',
    'pharmacy_operation_settings'
  ];
begin
  foreach table_name in array tables loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format('alter table public.%I enable row level security', table_name);
      execute format('revoke all on table public.%I from anon, authenticated', table_name);
    end if;
  end loop;
end $$;
