alter table pharmacies
  add column if not exists forwarding_mode text not null default 'manual_off'
    check (forwarding_mode in ('manual_on', 'manual_off', 'auto')),
  add column if not exists forwarding_auto_start time default '22:00',
  add column if not exists forwarding_auto_end time default '06:00',
  add column if not exists forwarding_updated_by_name text,
  add column if not exists forwarding_updated_at timestamptz;

update pharmacies
set
  forwarding_mode = case when forwarding_status = 'on' then 'auto' else 'manual_off' end,
  forwarding_auto_start = coalesce(forwarding_auto_start, '22:00'::time),
  forwarding_auto_end = coalesce(forwarding_auto_end, '06:00'::time),
  forwarding_updated_at = coalesce(forwarding_updated_at, updated_at)
where forwarding_mode is null
   or forwarding_auto_start is null
   or forwarding_auto_end is null
   or forwarding_updated_at is null;
