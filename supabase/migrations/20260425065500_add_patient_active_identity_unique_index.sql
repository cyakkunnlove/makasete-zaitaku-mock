create unique index if not exists idx_patients_unique_active_identity
  on public.patients (
    organization_id,
    pharmacy_id,
    lower(btrim(full_name)),
    date_of_birth
  )
  where status <> 'inactive';
