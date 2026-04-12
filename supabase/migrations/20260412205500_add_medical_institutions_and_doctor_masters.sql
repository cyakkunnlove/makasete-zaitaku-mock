create table if not exists medical_institutions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  region_id uuid references regions(id) on delete set null,
  pharmacy_id uuid references pharmacies(id) on delete set null,
  name text not null,
  kana text,
  phone text,
  fax text,
  postal_code text,
  address text,
  notes text,
  is_active boolean not null default true,
  created_by uuid references users(id) on delete set null,
  updated_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists medical_institutions_org_active_name_idx
  on medical_institutions (organization_id, is_active, name);

create unique index if not exists medical_institutions_org_pharmacy_name_uniq
  on medical_institutions (organization_id, coalesce(pharmacy_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name));

create table if not exists doctor_masters (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  medical_institution_id uuid not null references medical_institutions(id) on delete cascade,
  full_name text not null,
  kana text,
  department text,
  phone text,
  notes text,
  is_active boolean not null default true,
  created_by uuid references users(id) on delete set null,
  updated_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists doctor_masters_institution_active_name_idx
  on doctor_masters (medical_institution_id, is_active, full_name);

create unique index if not exists doctor_masters_institution_name_uniq
  on doctor_masters (medical_institution_id, lower(full_name));

alter table patients
  add column if not exists medical_institution_id uuid references medical_institutions(id) on delete set null,
  add column if not exists doctor_master_id uuid references doctor_masters(id) on delete set null;

create index if not exists patients_medical_institution_id_idx
  on patients (medical_institution_id);

create index if not exists patients_doctor_master_id_idx
  on patients (doctor_master_id);
