create table if not exists patient_day_tasks (
  id text primary key,
  organization_id uuid references organizations(id) on delete cascade,
  pharmacy_id uuid references pharmacies(id) on delete cascade,
  patient_id uuid references patients(id) on delete cascade,
  flow_date date not null,
  sort_order int not null default 1,
  scheduled_time text not null,
  visit_type text not null check (visit_type in ('定期', '臨時', '要確認')),
  source text not null check (source in ('自動生成', '手動追加')),
  status text not null default 'scheduled' check (status in ('scheduled', 'in_progress', 'completed')),
  planning_status text not null default 'unplanned' check (planning_status in ('unplanned', 'planned')),
  planned_by text,
  planned_by_id uuid references users(id) on delete set null,
  planned_at timestamptz,
  handled_by text,
  handled_by_id uuid references users(id) on delete set null,
  handled_at timestamptz,
  completed_at timestamptz,
  billable boolean not null default false,
  collection_status text not null default '未着手' check (collection_status in ('未着手', '請求準備OK', '回収中', '入金済')),
  amount numeric not null default 0,
  note text not null default '',
  updated_by_id uuid references users(id) on delete set null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_patient_day_tasks_pharmacy_flow_date on patient_day_tasks (pharmacy_id, flow_date);
create index if not exists idx_patient_day_tasks_patient_flow_date on patient_day_tasks (patient_id, flow_date);
