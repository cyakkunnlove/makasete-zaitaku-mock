-- Production night-flow persistence and workflow event foundation.
-- Replaces the current in-memory night-flow mock store with DB-backed tables.

begin;

create table if not exists fax_attachments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  region_id uuid not null references regions(id) on delete cascade,
  source_pharmacy_id uuid references pharmacies(id) on delete set null,
  received_at timestamptz not null default now(),
  received_to_fax_number text,
  source_provider text,
  source_email text,
  external_event_id text,
  title text,
  storage_bucket text not null default 'fax-attachments',
  storage_path text not null,
  mime_type text,
  file_size_bytes bigint,
  linked_night_case_id uuid,
  linked_by_user_id uuid references users(id) on delete set null,
  linked_at timestamptz,
  status text not null default 'unlinked' check (status in ('unlinked', 'linked', 'ignored')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, source_provider, external_event_id)
);

create table if not exists night_request_cases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  region_id uuid not null references regions(id) on delete cascade,
  source_pharmacy_id uuid references pharmacies(id) on delete set null,
  patient_id uuid references patients(id) on delete set null,
  accepted_by_user_id uuid references users(id) on delete set null,
  handled_by_user_id uuid references users(id) on delete set null,
  accepted_channel text not null default 'phone' check (accepted_channel in ('phone', 'fax')),
  accepted_at timestamptz not null default now(),
  patient_match_status text not null default 'matched' check (patient_match_status in ('matched', 'multiple_candidates', 'not_found', 'pending')),
  status text not null default 'accepted' check (status in ('accepted', 'in_progress', 'completed', 'pharmacy_confirmed', 'cancelled')),
  started_at timestamptz,
  completed_at timestamptz,
  summary text not null default '',
  handoff_result text not null default '薬局スタッフ確認が必要' check (handoff_result in ('対応済み', '薬局スタッフ確認が必要')),
  morning_request text not null default '',
  attention_level text not null default '通常' check (attention_level in ('通常', '要確認')),
  handoff_note text not null default '',
  pharmacy_confirmed_at timestamptz,
  pharmacy_confirmed_by_user_id uuid references users(id) on delete set null,
  billing_linkage_status text not null default 'pending' check (billing_linkage_status in ('pending', 'linked', 'not_needed')),
  billing_linked_at timestamptz,
  billing_linked_by_user_id uuid references users(id) on delete set null,
  display_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table fax_attachments
  drop constraint if exists fax_attachments_linked_night_case_id_fkey;

alter table fax_attachments
  add constraint fax_attachments_linked_night_case_id_fkey
  foreign key (linked_night_case_id) references night_request_cases(id) on delete set null;

create table if not exists night_handoff_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  night_case_id uuid not null references night_request_cases(id) on delete cascade,
  patient_id uuid references patients(id) on delete set null,
  pharmacy_id uuid references pharmacies(id) on delete set null,
  created_by_user_id uuid references users(id) on delete set null,
  handoff_result text not null check (handoff_result in ('対応済み', '薬局スタッフ確認が必要')),
  morning_request text not null default '',
  attention_level text not null default '通常' check (attention_level in ('通常', '要確認')),
  content text not null default '',
  selected_items_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pharmacy_confirmations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  night_case_id uuid not null references night_request_cases(id) on delete cascade,
  pharmacy_id uuid not null references pharmacies(id) on delete cascade,
  confirmed_by_user_id uuid references users(id) on delete set null,
  confirmed_at timestamptz not null default now(),
  billing_linkage_status text not null default 'pending' check (billing_linkage_status in ('pending', 'linked', 'not_needed')),
  note text,
  created_at timestamptz not null default now(),
  unique (night_case_id, pharmacy_id)
);

create table if not exists workflow_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  region_id uuid references regions(id) on delete set null,
  pharmacy_id uuid references pharmacies(id) on delete set null,
  actor_user_id uuid references users(id) on delete set null,
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  idempotency_key text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (organization_id, idempotency_key)
);

create index if not exists idx_fax_attachments_region_status_received
  on fax_attachments(region_id, status, received_at desc);

create index if not exists idx_fax_attachments_linked_case
  on fax_attachments(linked_night_case_id);

create index if not exists idx_night_request_cases_region_status_date
  on night_request_cases(region_id, status, display_date desc);

create index if not exists idx_night_request_cases_pharmacy_status_date
  on night_request_cases(source_pharmacy_id, status, display_date desc);

create index if not exists idx_night_request_cases_patient
  on night_request_cases(patient_id);

create index if not exists idx_night_handoff_notes_case
  on night_handoff_notes(night_case_id, created_at desc);

create index if not exists idx_pharmacy_confirmations_pharmacy_confirmed
  on pharmacy_confirmations(pharmacy_id, confirmed_at desc);

create index if not exists idx_workflow_events_scope_created
  on workflow_events(organization_id, region_id, pharmacy_id, created_at desc);

create index if not exists idx_workflow_events_type_created
  on workflow_events(event_type, created_at desc);

alter table fax_attachments enable row level security;
alter table night_request_cases enable row level security;
alter table night_handoff_notes enable row level security;
alter table pharmacy_confirmations enable row level security;
alter table workflow_events enable row level security;

revoke all on table fax_attachments from anon, authenticated;
revoke all on table night_request_cases from anon, authenticated;
revoke all on table night_handoff_notes from anon, authenticated;
revoke all on table pharmacy_confirmations from anon, authenticated;
revoke all on table workflow_events from anon, authenticated;

-- Private Storage bucket for received FAX files. Application APIs should create
-- signed URLs after authorization instead of exposing raw storage paths.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fax-attachments',
  'fax-attachments',
  false,
  52428800,
  array['application/pdf', 'image/png', 'image/jpeg', 'image/tiff']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

commit;
