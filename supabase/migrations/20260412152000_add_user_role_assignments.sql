create table if not exists user_role_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  role text not null check (role in ('system_admin', 'regional_admin', 'pharmacy_admin', 'pharmacy_staff', 'night_pharmacist')),
  region_id uuid references regions(id) on delete set null,
  pharmacy_id uuid references pharmacies(id) on delete set null,
  operation_unit_id uuid references operation_units(id) on delete set null,
  is_default boolean not null default false,
  is_active boolean not null default true,
  granted_by uuid references users(id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_role_assignments_scope_check check (
    (role = 'system_admin' and region_id is null and pharmacy_id is null)
    or (role = 'regional_admin' and region_id is not null and pharmacy_id is null)
    or (role in ('pharmacy_admin', 'pharmacy_staff', 'night_pharmacist') and region_id is not null and pharmacy_id is not null)
  )
);

create index if not exists idx_user_role_assignments_user_id
  on user_role_assignments(user_id);

create index if not exists idx_user_role_assignments_role
  on user_role_assignments(role);

create index if not exists idx_user_role_assignments_region_id
  on user_role_assignments(region_id);

create index if not exists idx_user_role_assignments_pharmacy_id
  on user_role_assignments(pharmacy_id);

create unique index if not exists uq_user_role_assignments_default_per_user
  on user_role_assignments(user_id)
  where is_default = true and is_active = true and revoked_at is null;

create unique index if not exists uq_user_role_assignments_unique_scope
  on user_role_assignments(
    user_id,
    role,
    coalesce(region_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(pharmacy_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(operation_unit_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
  where revoked_at is null;

insert into user_role_assignments (
  user_id,
  organization_id,
  role,
  region_id,
  pharmacy_id,
  operation_unit_id,
  is_default,
  is_active,
  granted_at,
  created_at,
  updated_at
)
select
  u.id,
  u.organization_id,
  u.role,
  u.region_id,
  u.pharmacy_id,
  u.operation_unit_id,
  true,
  (u.status = 'active' and coalesce(u.is_active, true) = true),
  coalesce(u.created_at, now()),
  coalesce(u.created_at, now()),
  coalesce(u.updated_at, now())
from users u
where not exists (
  select 1
  from user_role_assignments a
  where a.user_id = u.id
    and a.role = u.role
    and coalesce(a.region_id, '00000000-0000-0000-0000-000000000000'::uuid) = coalesce(u.region_id, '00000000-0000-0000-0000-000000000000'::uuid)
    and coalesce(a.pharmacy_id, '00000000-0000-0000-0000-000000000000'::uuid) = coalesce(u.pharmacy_id, '00000000-0000-0000-0000-000000000000'::uuid)
    and coalesce(a.operation_unit_id, '00000000-0000-0000-0000-000000000000'::uuid) = coalesce(u.operation_unit_id, '00000000-0000-0000-0000-000000000000'::uuid)
    and a.revoked_at is null
);
