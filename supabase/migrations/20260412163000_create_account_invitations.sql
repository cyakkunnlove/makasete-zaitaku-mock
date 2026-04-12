create table if not exists account_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  invited_user_id uuid not null references users(id) on delete cascade,
  role text not null check (role in ('system_admin', 'regional_admin', 'pharmacy_admin', 'pharmacy_staff', 'night_pharmacist')),
  email text not null,
  region_id uuid references regions(id) on delete set null,
  pharmacy_id uuid references pharmacies(id) on delete set null,
  operation_unit_id uuid references operation_units(id) on delete set null,
  token_hash text not null unique,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  expires_at timestamptz not null,
  sent_at timestamptz,
  last_sent_at timestamptz,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_by uuid references users(id) on delete set null,
  message_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists account_invitations_user_idx on account_invitations (invited_user_id);
create index if not exists account_invitations_email_idx on account_invitations (email);
create index if not exists account_invitations_status_idx on account_invitations (status);
