with ranked_duplicates as (
  select
    id,
    row_number() over (
      partition by pharmacy_id, patient_id, flow_date
      order by
        case status
          when 'completed' then 3
          when 'in_progress' then 2
          else 1
        end desc,
        updated_at desc,
        created_at desc,
        id desc
    ) as duplicate_rank
  from public.patient_day_tasks
),
deleted_duplicates as (
  delete from public.patient_day_tasks
  where id in (
    select id
    from ranked_duplicates
    where duplicate_rank > 1
  )
  returning id
),
normalized_sort_orders as (
  select
    id,
    row_number() over (
      partition by pharmacy_id, flow_date
      order by
        sort_order asc,
        case status
          when 'completed' then 3
          when 'in_progress' then 2
          else 1
        end desc,
        updated_at asc,
        created_at asc,
        id asc
    ) as next_sort_order
  from public.patient_day_tasks
)
update public.patient_day_tasks as tasks
set sort_order = normalized_sort_orders.next_sort_order
from normalized_sort_orders
where tasks.id = normalized_sort_orders.id
  and tasks.sort_order is distinct from normalized_sort_orders.next_sort_order;

create unique index if not exists idx_patient_day_tasks_unique_patient_day
  on public.patient_day_tasks (pharmacy_id, patient_id, flow_date);

create unique index if not exists idx_patient_day_tasks_unique_sort_order
  on public.patient_day_tasks (pharmacy_id, flow_date, sort_order);
