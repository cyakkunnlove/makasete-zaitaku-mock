-- Keep confirmed night cases visible for later pharmacy follow-up.

begin;

alter table night_request_cases
  add column if not exists kept_for_later boolean not null default false,
  add column if not exists kept_for_later_at timestamptz,
  add column if not exists kept_for_later_by_user_id uuid references users(id) on delete set null;

create index if not exists idx_night_request_cases_pharmacy_kept_for_later
  on night_request_cases(source_pharmacy_id, kept_for_later, pharmacy_confirmed_at desc);

commit;
