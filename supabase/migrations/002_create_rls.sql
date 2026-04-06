-- 002_create_rls.sql
-- 2026-04-06: intentionally deferred.
-- Existing RLS draft depended on Supabase Auth (`auth.uid()`).
-- Current architecture uses Cognito for auth and DB-backed app users.
-- RLS will be redesigned after Cognito-backed session/user propagation is finalized.
select 1;
