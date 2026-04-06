-- 003_create_triggers.sql
-- 2026-04-06: partially deferred.
-- Previous trigger draft depended on Supabase Auth (`auth.uid()`) for actor attribution.
-- Keep updated_at helper only after Cognito/app-user audit strategy is finalized.
select 1;
