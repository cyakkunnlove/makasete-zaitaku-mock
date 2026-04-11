begin;

alter table patients
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists geocode_status text,
  add column if not exists geocoded_at timestamptz,
  add column if not exists geocode_source text,
  add column if not exists geocode_error text,
  add column if not exists geocode_input_address text;

alter table patients
  drop constraint if exists patients_geocode_status_check;

alter table patients
  add constraint patients_geocode_status_check
  check (geocode_status in ('pending', 'success', 'failed', 'stale') or geocode_status is null);

alter table patients
  drop constraint if exists patients_geocode_source_check;

alter table patients
  add constraint patients_geocode_source_check
  check (geocode_source in ('google_maps', 'manual') or geocode_source is null);

create index if not exists idx_patients_geocode_status on patients (geocode_status);
create index if not exists idx_patients_pharmacy_status on patients (pharmacy_id, status);

create table if not exists patient_home_photos (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  storage_path text not null,
  photo_type text,
  caption text,
  sort_order int not null default 1,
  taken_at timestamptz,
  uploaded_by uuid references users(id) on delete set null,
  uploaded_at timestamptz not null default now(),
  deleted_by uuid references users(id) on delete set null,
  deleted_at timestamptz,
  delete_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint patient_home_photos_photo_type_check
    check (photo_type in ('outside', 'entrance', 'parking', 'landmark', 'other') or photo_type is null)
);

create index if not exists idx_patient_home_photos_patient_id on patient_home_photos (patient_id, sort_order, created_at desc);
create index if not exists idx_patient_home_photos_uploaded_by on patient_home_photos (uploaded_by);
create index if not exists idx_patient_home_photos_deleted_at on patient_home_photos (deleted_at);

create unique index if not exists idx_patient_home_photos_active_slot
  on patient_home_photos (patient_id, sort_order)
  where deleted_at is null;

comment on table patient_home_photos is 'Patient home / landmark photo metadata. Image binaries live in storage.';

commit;
