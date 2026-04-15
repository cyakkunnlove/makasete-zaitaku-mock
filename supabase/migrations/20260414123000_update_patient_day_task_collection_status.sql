alter table public.patient_day_tasks
  drop constraint if exists patient_day_tasks_collection_status_check;

update public.patient_day_tasks
set collection_status = case collection_status
  when '未着手' then 'needs_billing'
  when '請求準備OK' then 'needs_billing'
  when '回収中' then 'billed'
  when '入金済' then 'paid'
  else collection_status
end;

alter table public.patient_day_tasks
  alter column collection_status set default 'needs_billing';

alter table public.patient_day_tasks
  add constraint patient_day_tasks_collection_status_check
  check (collection_status in ('needs_billing', 'billed', 'paid', 'needs_attention'));
