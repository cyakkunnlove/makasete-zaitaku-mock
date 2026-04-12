alter table if exists users
  add column if not exists last_reverified_at timestamptz;

update users
set last_reverified_at = coalesce(last_reverified_at, last_login_at)
where last_reverified_at is null;
