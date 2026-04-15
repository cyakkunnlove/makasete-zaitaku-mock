alter table public.patients
  add column if not exists is_billable boolean not null default true,
  add column if not exists billing_exclusion_reason text null;

comment on column public.patients.is_billable is '患者請求の対象かどうか';
comment on column public.patients.billing_exclusion_reason is '請求対象外とする理由';
