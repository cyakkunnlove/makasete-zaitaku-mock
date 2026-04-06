-- =========================================
-- Initial seed for Cognito + Supabase hybrid auth model
-- 2026-04-06
-- =========================================

begin;

-- -------------------------------------------------
-- organization
-- -------------------------------------------------
insert into organizations (
  code,
  name,
  legal_name,
  phone,
  address,
  status
)
values (
  'makasete',
  'マカセテ在宅',
  'マカセテ在宅株式会社',
  '03-0000-0000',
  '東京都世田谷区（仮）',
  'active'
)
on conflict (code) do update set
  name = excluded.name,
  legal_name = excluded.legal_name,
  phone = excluded.phone,
  address = excluded.address,
  status = excluded.status,
  updated_at = now();

-- -------------------------------------------------
-- region
-- -------------------------------------------------
insert into regions (
  organization_id,
  code,
  name,
  hotline_phone,
  fax_routing_policy,
  delegation_rule,
  sla_target_minutes,
  pending_escalation_minutes,
  handover_reminder_minutes,
  status
)
select
  o.id,
  'setagaya-johnan',
  '世田谷・城南リージョン',
  '03-0000-1111',
  'night_primary_then_backup',
  'regional_admin_review',
  45,
  15,
  30,
  'active'
from organizations o
where o.code = 'makasete'
on conflict (organization_id, code) do update set
  name = excluded.name,
  hotline_phone = excluded.hotline_phone,
  fax_routing_policy = excluded.fax_routing_policy,
  delegation_rule = excluded.delegation_rule,
  sla_target_minutes = excluded.sla_target_minutes,
  pending_escalation_minutes = excluded.pending_escalation_minutes,
  handover_reminder_minutes = excluded.handover_reminder_minutes,
  status = excluded.status,
  updated_at = now();

-- -------------------------------------------------
-- operation unit
-- -------------------------------------------------
insert into operation_units (
  organization_id,
  region_id,
  code,
  name,
  kind,
  status
)
select
  o.id,
  r.id,
  'night-ops-01',
  '世田谷夜間運用チーム',
  'night_ops',
  'active'
from organizations o
join regions r on r.organization_id = o.id
where o.code = 'makasete'
  and r.code = 'setagaya-johnan'
on conflict (organization_id, code) do update set
  region_id = excluded.region_id,
  name = excluded.name,
  kind = excluded.kind,
  status = excluded.status,
  updated_at = now();

-- -------------------------------------------------
-- pharmacy
-- -------------------------------------------------
insert into pharmacies (
  organization_id,
  region_id,
  operation_unit_id,
  code,
  name,
  area,
  address,
  phone,
  fax,
  forwarding_phone,
  forwarding_status,
  contract_date,
  saas_monthly_fee,
  night_monthly_fee,
  night_delegation_enabled,
  default_morning_note,
  status,
  patient_count
)
select
  o.id,
  r.id,
  ou.id,
  'ph-01',
  'マカセテ在宅テスト薬局',
  '世田谷・城南',
  '東京都世田谷区（仮）',
  '03-0000-2222',
  '03-0000-2223',
  '03-0000-2224',
  'on',
  current_date,
  0,
  0,
  true,
  '朝の引き継ぎテンプレート（仮）',
  'active',
  0
from organizations o
join regions r on r.organization_id = o.id
left join operation_units ou on ou.organization_id = o.id and ou.region_id = r.id and ou.code = 'night-ops-01'
where o.code = 'makasete'
  and r.code = 'setagaya-johnan'
on conflict (organization_id, code) do update set
  region_id = excluded.region_id,
  operation_unit_id = excluded.operation_unit_id,
  name = excluded.name,
  area = excluded.area,
  address = excluded.address,
  phone = excluded.phone,
  fax = excluded.fax,
  forwarding_phone = excluded.forwarding_phone,
  forwarding_status = excluded.forwarding_status,
  contract_date = excluded.contract_date,
  saas_monthly_fee = excluded.saas_monthly_fee,
  night_monthly_fee = excluded.night_monthly_fee,
  night_delegation_enabled = excluded.night_delegation_enabled,
  default_morning_note = excluded.default_morning_note,
  status = excluded.status,
  patient_count = excluded.patient_count,
  updated_at = now();

-- -------------------------------------------------
-- users
-- cognito_sub is null initially; attach on first successful login
-- -------------------------------------------------

-- system_admin
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
  last_login_at
)
select
  null,
  o.id,
  null,
  null,
  null,
  'system_admin',
  'システム管理者サンプル',
  null,
  'admin@makasete.local',
  null,
  true,
  'active',
  null
from organizations o
where o.code = 'makasete'
on conflict (email) do update set
  organization_id = excluded.organization_id,
  pharmacy_id = excluded.pharmacy_id,
  region_id = excluded.region_id,
  operation_unit_id = excluded.operation_unit_id,
  role = excluded.role,
  full_name = excluded.full_name,
  phone = excluded.phone,
  line_user_id = excluded.line_user_id,
  is_active = excluded.is_active,
  status = excluded.status,
  updated_at = now();

-- regional_admin
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
  last_login_at
)
select
  null,
  o.id,
  null,
  r.id,
  null,
  'regional_admin',
  '地域責任者サンプル',
  null,
  'regional@makasete.local',
  null,
  true,
  'active',
  null
from organizations o
join regions r on r.organization_id = o.id
where o.code = 'makasete'
  and r.code = 'setagaya-johnan'
on conflict (email) do update set
  organization_id = excluded.organization_id,
  pharmacy_id = excluded.pharmacy_id,
  region_id = excluded.region_id,
  operation_unit_id = excluded.operation_unit_id,
  role = excluded.role,
  full_name = excluded.full_name,
  phone = excluded.phone,
  line_user_id = excluded.line_user_id,
  is_active = excluded.is_active,
  status = excluded.status,
  updated_at = now();

-- pharmacy_admin
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
  last_login_at
)
select
  null,
  o.id,
  p.id,
  r.id,
  null,
  'pharmacy_admin',
  '薬局管理者サンプル',
  null,
  'pharmacy-admin@makasete.local',
  null,
  true,
  'active',
  null
from organizations o
join regions r on r.organization_id = o.id
join pharmacies p on p.organization_id = o.id and p.region_id = r.id
where o.code = 'makasete'
  and r.code = 'setagaya-johnan'
  and p.code = 'ph-01'
on conflict (email) do update set
  organization_id = excluded.organization_id,
  pharmacy_id = excluded.pharmacy_id,
  region_id = excluded.region_id,
  operation_unit_id = excluded.operation_unit_id,
  role = excluded.role,
  full_name = excluded.full_name,
  phone = excluded.phone,
  line_user_id = excluded.line_user_id,
  is_active = excluded.is_active,
  status = excluded.status,
  updated_at = now();

-- pharmacy_staff
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
  last_login_at
)
select
  null,
  o.id,
  p.id,
  r.id,
  null,
  'pharmacy_staff',
  '薬局スタッフサンプル',
  null,
  'staff@makasete.local',
  null,
  true,
  'active',
  null
from organizations o
join regions r on r.organization_id = o.id
join pharmacies p on p.organization_id = o.id and p.region_id = r.id
where o.code = 'makasete'
  and r.code = 'setagaya-johnan'
  and p.code = 'ph-01'
on conflict (email) do update set
  organization_id = excluded.organization_id,
  pharmacy_id = excluded.pharmacy_id,
  region_id = excluded.region_id,
  operation_unit_id = excluded.operation_unit_id,
  role = excluded.role,
  full_name = excluded.full_name,
  phone = excluded.phone,
  line_user_id = excluded.line_user_id,
  is_active = excluded.is_active,
  status = excluded.status,
  updated_at = now();

-- night_pharmacist
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
  last_login_at
)
select
  null,
  o.id,
  null,
  r.id,
  ou.id,
  'night_pharmacist',
  '夜間薬剤師サンプル',
  null,
  'night@makasete.local',
  null,
  true,
  'active',
  null
from organizations o
join regions r on r.organization_id = o.id
join operation_units ou on ou.organization_id = o.id and ou.region_id = r.id
where o.code = 'makasete'
  and r.code = 'setagaya-johnan'
  and ou.code = 'night-ops-01'
on conflict (email) do update set
  organization_id = excluded.organization_id,
  pharmacy_id = excluded.pharmacy_id,
  region_id = excluded.region_id,
  operation_unit_id = excluded.operation_unit_id,
  role = excluded.role,
  full_name = excluded.full_name,
  phone = excluded.phone,
  line_user_id = excluded.line_user_id,
  is_active = excluded.is_active,
  status = excluded.status,
  updated_at = now();

commit;
