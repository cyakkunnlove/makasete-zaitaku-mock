create table if not exists public.pharmacy_operation_settings (
  pharmacy_id uuid primary key references public.pharmacies(id) on delete cascade,
  patient_edit_window_minutes integer not null default 30 check (patient_edit_window_minutes between 0 and 1440),
  billing_paid_cancel_window_minutes integer not null default 30 check (billing_paid_cancel_window_minutes between 0 and 1440),
  correction_reason_required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.correction_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  pharmacy_id uuid references public.pharmacies(id) on delete cascade,
  patient_id uuid references public.patients(id) on delete set null,
  patient_day_task_id text references public.patient_day_tasks(id) on delete set null,
  target_type text not null check (target_type in ('patient', 'patient_day_task', 'billing_collection', 'medical_institution', 'doctor_master')),
  target_id text not null,
  requested_by uuid references public.users(id) on delete set null,
  requested_by_role text,
  reason_category text,
  reason_text text,
  requested_changes jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'completed', 'cancelled')),
  handled_by uuid references public.users(id) on delete set null,
  handled_at timestamptz,
  resolution_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_correction_requests_pharmacy_status
  on public.correction_requests(pharmacy_id, status, created_at desc);

create index if not exists idx_correction_requests_patient
  on public.correction_requests(patient_id, created_at desc);

create index if not exists idx_correction_requests_day_task
  on public.correction_requests(patient_day_task_id, created_at desc);

create index if not exists idx_correction_requests_requested_by
  on public.correction_requests(requested_by, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_pharmacy_operation_settings_updated_at on public.pharmacy_operation_settings;
create trigger trg_pharmacy_operation_settings_updated_at
  before update on public.pharmacy_operation_settings
  for each row execute function public.set_updated_at();

drop trigger if exists trg_correction_requests_updated_at on public.correction_requests;
create trigger trg_correction_requests_updated_at
  before update on public.correction_requests
  for each row execute function public.set_updated_at();
