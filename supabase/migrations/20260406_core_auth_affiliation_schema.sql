-- =========================================
-- makasete-zaitaku core auth/affiliation schema
-- Cognito = auth
-- Postgres = user/affiliation/audit source of truth
-- =========================================

create extension if not exists pgcrypto;

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  name text not null,
  legal_name text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_status_check
    check (status in ('active', 'suspended', 'archived'))
);

create trigger trg_organizations_updated_at
before update on public.organizations
for each row
execute function set_updated_at();

create table if not exists public.regions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null,
  name text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint regions_status_check
    check (status in ('active', 'suspended', 'archived')),
  constraint regions_org_code_unique
    unique (organization_id, code)
);

create index if not exists idx_regions_organization_id
  on public.regions (organization_id);

create trigger trg_regions_updated_at
before update on public.regions
for each row
execute function set_updated_at();

create table if not exists public.pharmacies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  region_id uuid not null references public.regions(id) on delete restrict,
  code text not null,
  name text not null,
  address text,
  phone text,
  fax text,
  status text not null default 'active',
  night_delegation_enabled boolean not null default false,
  contract_start_date date,
  contract_end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pharmacies_status_check
    check (status in ('active', 'pending', 'suspended', 'terminated')),
  constraint pharmacies_org_code_unique
    unique (organization_id, code)
);

create index if not exists idx_pharmacies_organization_id
  on public.pharmacies (organization_id);

create index if not exists idx_pharmacies_region_id
  on public.pharmacies (region_id);

create trigger trg_pharmacies_updated_at
before update on public.pharmacies
for each row
execute function set_updated_at();

create table if not exists public.operation_units (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  region_id uuid not null references public.regions(id) on delete restrict,
  code text not null,
  name text not null,
  kind text not null default 'night_ops',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint operation_units_kind_check
    check (kind in ('night_ops', 'regional_ops', 'pharmacy_ops')),
  constraint operation_units_status_check
    check (status in ('active', 'suspended', 'archived')),
  constraint operation_units_org_code_unique
    unique (organization_id, code)
);

create index if not exists idx_operation_units_organization_id
  on public.operation_units (organization_id);

create index if not exists idx_operation_units_region_id
  on public.operation_units (region_id);

create trigger trg_operation_units_updated_at
before update on public.operation_units
for each row
execute function set_updated_at();

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  cognito_sub text unique,
  email text not null unique,
  full_name text not null,
  phone text,
  role text not null,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  region_id uuid references public.regions(id) on delete restrict,
  pharmacy_id uuid references public.pharmacies(id) on delete restrict,
  operation_unit_id uuid references public.operation_units(id) on delete restrict,
  is_active boolean not null default true,
  status text not null default 'active',
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_role_check
    check (role in (
      'system_admin',
      'regional_admin',
      'pharmacy_admin',
      'pharmacy_staff',
      'night_pharmacist'
    )),
  constraint users_status_check
    check (status in ('invited', 'active', 'suspended', 'disabled'))
);

create index if not exists idx_users_cognito_sub on public.users (cognito_sub);
create index if not exists idx_users_organization_id on public.users (organization_id);
create index if not exists idx_users_region_id on public.users (region_id);
create index if not exists idx_users_pharmacy_id on public.users (pharmacy_id);
create index if not exists idx_users_operation_unit_id on public.users (operation_unit_id);
create index if not exists idx_users_role on public.users (role);

create trigger trg_users_updated_at
before update on public.users
for each row
execute function set_updated_at();

create or replace function validate_user_affiliation()
returns trigger as $$
begin
  if new.role in ('pharmacy_admin', 'pharmacy_staff') and new.pharmacy_id is null then
    raise exception 'pharmacy_admin/pharmacy_staff must have pharmacy_id';
  end if;

  if new.role = 'regional_admin' and new.region_id is null then
    raise exception 'regional_admin must have region_id';
  end if;

  if new.role = 'system_admin' and new.pharmacy_id is not null then
    raise exception 'system_admin cannot have pharmacy_id';
  end if;

  return new;
end;
$$ language plpgsql;

create trigger trg_users_validate_affiliation
before insert or update on public.users
for each row
execute function validate_user_affiliation();

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null,
  region_id uuid references public.regions(id) on delete set null,
  pharmacy_id uuid references public.pharmacies(id) on delete set null,
  operation_unit_id uuid references public.operation_units(id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  details jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_user_id on public.audit_logs (user_id);
create index if not exists idx_audit_logs_organization_id on public.audit_logs (organization_id);
create index if not exists idx_audit_logs_region_id on public.audit_logs (region_id);
create index if not exists idx_audit_logs_pharmacy_id on public.audit_logs (pharmacy_id);
create index if not exists idx_audit_logs_created_at on public.audit_logs (created_at desc);
