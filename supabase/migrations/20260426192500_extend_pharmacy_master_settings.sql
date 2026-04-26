alter table public.pharmacies
  add column if not exists admin_owner_name text,
  add column if not exists contract_plan text,
  add column if not exists emergency_route text,
  add column if not exists workload_light_max numeric not null default 4,
  add column if not exists workload_medium_max numeric not null default 8,
  add column if not exists workload_first_visit_weight numeric not null default 1.5,
  add column if not exists workload_in_progress_weight numeric not null default 1.2,
  add column if not exists workload_distance_weight numeric not null default 0.3;

update public.pharmacies
set
  admin_owner_name = coalesce(admin_owner_name, '未設定'),
  contract_plan = coalesce(contract_plan, '加盟店 / 夜間受託あり'),
  emergency_route = coalesce(emergency_route, 'Regional Admin 受付'),
  default_morning_note = coalesce(default_morning_note, '夜間申し送りは pharmacy_admin が朝一確認し、必要に応じて pharmacy_staff へ共有する。')
where admin_owner_name is null
   or contract_plan is null
   or emergency_route is null
   or default_morning_note is null;
