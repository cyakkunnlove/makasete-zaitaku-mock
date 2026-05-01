-- Grant the primary demo login account access to every demo role context.
-- This keeps one Cognito identity while allowing role chooser switching across
-- system_admin, regional_admin, pharmacy_admin, pharmacy_staff, and night_pharmacist.

begin;

insert into users (
  cognito_sub,
  organization_id,
  pharmacy_id,
  region_id,
  operation_unit_id,
  role,
  full_name,
  phone,
  email,
  line_user_id,
  is_active,
  status,
  last_login_at,
  last_reverified_at,
  created_at,
  updated_at
)
select
  null,
  o.id,
  null,
  null,
  null,
  'system_admin',
  '加藤 琢也',
  null,
  'cyakkunnlove@yahoo.co.jp',
  null,
  true,
  'active',
  null,
  null,
  now(),
  now()
from organizations o
where o.code = 'makasete'
on conflict (email) do update set
  organization_id = excluded.organization_id,
  pharmacy_id = null,
  region_id = null,
  operation_unit_id = null,
  role = 'system_admin',
  full_name = excluded.full_name,
  is_active = true,
  status = 'active',
  updated_at = now();

-- The unique default-assignment index allows only one active default per user.
-- Clear existing defaults first so this migration is safe even if the account
-- already had a different default role.
update user_role_assignments
set is_default = false,
    updated_at = now()
where user_id = (select id from users where email = 'cyakkunnlove@yahoo.co.jp');

with base as (
  select
    u.id as user_id,
    o.id as organization_id,
    r.id as region_id,
    p.id as pharmacy_id,
    ou.id as operation_unit_id
  from users u
  join organizations o on o.id = u.organization_id and o.code = 'makasete'
  join regions r on r.organization_id = o.id and r.code = 'setagaya-johnan'
  join pharmacies p on p.organization_id = o.id and p.region_id = r.id and p.code = 'ph-01'
  left join operation_units ou on ou.organization_id = o.id and ou.region_id = r.id and ou.code = 'night-ops-01'
  where u.email = 'cyakkunnlove@yahoo.co.jp'
), assignments as (
  select
    base.user_id,
    base.organization_id,
    v.role,
    case when v.role in ('regional_admin', 'pharmacy_admin', 'pharmacy_staff', 'night_pharmacist') then base.region_id else null end as region_id,
    case when v.role in ('pharmacy_admin', 'pharmacy_staff', 'night_pharmacist') then base.pharmacy_id else null end as pharmacy_id,
    case when v.role = 'night_pharmacist' then base.operation_unit_id else null end as operation_unit_id,
    (v.role = 'system_admin') as is_default
  from base
  cross join (values
    ('system_admin'::text),
    ('regional_admin'::text),
    ('pharmacy_admin'::text),
    ('pharmacy_staff'::text),
    ('night_pharmacist'::text)
  ) as v(role)
)
insert into user_role_assignments (
  user_id,
  organization_id,
  role,
  region_id,
  pharmacy_id,
  operation_unit_id,
  is_default,
  is_active,
  granted_by,
  granted_at,
  revoked_at,
  created_at,
  updated_at
)
select
  user_id,
  organization_id,
  role,
  region_id,
  pharmacy_id,
  operation_unit_id,
  is_default,
  true,
  null,
  now(),
  null,
  now(),
  now()
from assignments
on conflict (
  user_id,
  role,
  coalesce(region_id, '00000000-0000-0000-0000-000000000000'::uuid),
  coalesce(pharmacy_id, '00000000-0000-0000-0000-000000000000'::uuid),
  coalesce(operation_unit_id, '00000000-0000-0000-0000-000000000000'::uuid)
)
where revoked_at is null
do update set
  is_active = true,
  is_default = excluded.is_default,
  revoked_at = null,
  updated_at = now();

commit;
