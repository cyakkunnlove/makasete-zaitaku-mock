# Supabase Schema Draft v0.1

このドラフトは、現在のモック実装を Supabase / Postgres に移行するためのたたき台。

## 設計原則
- role + 所属 + 個人 + 監査ログ
- 所属は pharmacy_id + region_id / operation_unit_id の二層
- 医療本文は必要最小限アクセス
- 監査ログは append-only 前提

---

## 1. organizations
- id uuid pk
- name text not null
- legal_name text
- phone text
- address text
- night_start time
- night_end time
- sla_target_minutes int
- created_at timestamptz
- updated_at timestamptz

## 2. regions
- id uuid pk
- organization_id uuid fk organizations(id)
- name text not null
- hotline_phone text
- fax_routing_policy text
- delegation_rule text
- sla_target_minutes int
- pending_escalation_minutes int
- handover_reminder_minutes int
- created_at timestamptz
- updated_at timestamptz

## 3. operation_units
- id uuid pk
- organization_id uuid fk organizations(id)
- region_id uuid fk regions(id)
- name text not null
- active boolean default true
- created_at timestamptz
- updated_at timestamptz

## 4. pharmacies
- id uuid pk
- organization_id uuid fk organizations(id)
- region_id uuid fk regions(id)
- operation_unit_id uuid fk operation_units(id)
- name text not null
- area text
- address text
- phone text
- fax text
- forwarding_phone text
- forwarding_status text
- contract_date date
- saas_monthly_fee numeric
- night_monthly_fee numeric
- night_delegation_enabled boolean default false
- default_morning_note text
- status text
- patient_count int default 0
- created_at timestamptz
- updated_at timestamptz

## 5. users
- id uuid pk
- organization_id uuid fk organizations(id)
- pharmacy_id uuid fk pharmacies(id) null
- region_id uuid fk regions(id) null
- operation_unit_id uuid fk operation_units(id) null
- role text not null
- full_name text not null
- phone text
- email text unique
- line_user_id text
- is_active boolean default true
- created_at timestamptz
- updated_at timestamptz

## 6. patients
- id uuid pk
- organization_id uuid fk organizations(id)
- pharmacy_id uuid fk pharmacies(id)
- full_name text not null
- date_of_birth date
- address text
- phone text
- emergency_contact_name text
- emergency_contact_phone text
- emergency_contact_relation text
- doctor_name text
- doctor_clinic text
- doctor_night_phone text
- medical_history text
- allergies text
- current_medications text
- visit_notes text
- insurance_info text
- disease_name text
- risk_score int
- requires_multi_visit boolean default false
- status text
- created_at timestamptz
- updated_at timestamptz
- created_by uuid fk users(id)
- updated_by uuid fk users(id)

## 7. patient_visit_rules
- id uuid pk
- patient_id uuid fk patients(id)
- pattern text
- weekday int null
- interval_weeks int
- anchor_week int null
- preferred_time text null
- monthly_visit_limit int
- active boolean
- custom_dates jsonb
- excluded_dates jsonb
- created_at timestamptz
- updated_at timestamptz

## 8. requests
- id uuid pk
- organization_id uuid fk organizations(id)
- pharmacy_id uuid fk pharmacies(id)
- region_id uuid fk regions(id)
- operation_unit_id uuid fk operation_units(id)
- patient_id uuid fk patients(id) null
- received_at timestamptz
- priority text
- status text
- triage_symptom text
- triage_vitals_change text
- triage_consciousness text
- triage_urgency text
- fax_received_at timestamptz null
- fax_image_url text null
- first_callback_at timestamptz null
- sla_met boolean null
- notes text null
- completed_at timestamptz null
- created_by uuid fk users(id)
- updated_by uuid fk users(id)
- created_at timestamptz
- updated_at timestamptz

## 9. request_events
- id uuid pk
- request_id uuid fk requests(id)
- actor_user_id uuid fk users(id)
- actor_role text
- event_type text
- old_status text null
- new_status text null
- note text null
- metadata jsonb
- created_at timestamptz

## 10. assignments
- id uuid pk
- request_id uuid fk requests(id)
- pharmacist_id uuid fk users(id)
- assigned_by uuid fk users(id)
- assigned_at timestamptz
- responded_at timestamptz null
- response text null
- timeout_minutes int
- dispatched_at timestamptz null
- arrived_at timestamptz null
- completed_at timestamptz null
- travel_distance_km numeric null
- travel_mode text null
- is_multi_visit boolean default false
- created_at timestamptz

## 11. checklists
- id uuid pk
- request_id uuid fk requests(id)
- assignment_id uuid fk assignments(id)
- checklist_type text
- items jsonb
- completed_at timestamptz null
- created_at timestamptz

## 12. handovers
- id uuid pk
- request_id uuid fk requests(id) null
- assignment_id uuid fk assignments(id) null
- pharmacist_id uuid fk users(id) null
- pharmacy_id uuid fk pharmacies(id) null
- patient_id uuid fk patients(id) null
- situation text
- background text
- assessment text
- recommendation text
- vitals jsonb null
- medication_administered text null
- patient_condition text null
- free_text text null
- confirmed_by uuid fk users(id) null
- confirmed_at timestamptz null
- reminder_sent_at timestamptz null
- report_file_url text null
- reminder_count int default 0
- created_at timestamptz
- updated_at timestamptz

## 13. handover_confirmations
- id uuid pk
- handover_id uuid fk handovers(id)
- user_id uuid fk users(id)
- role text
- pharmacy_id uuid fk pharmacies(id) null
- confirmed_at timestamptz
- note text null

## 14. notification_logs
- id uuid pk
- organization_id uuid fk organizations(id)
- region_id uuid fk regions(id) null
- pharmacy_id uuid fk pharmacies(id) null
- notification_type text
- channel text
- recipient_id uuid fk users(id) null
- recipient_contact text null
- trigger_entity text null
- trigger_id text null
- status text
- sent_at timestamptz null
- delivered_at timestamptz null
- read_at timestamptz null
- responded_at timestamptz null
- response_data jsonb null
- error_message text null
- retry_count int default 0
- next_retry_at timestamptz null
- created_at timestamptz

## 15. audit_logs
- id uuid pk
- organization_id uuid fk organizations(id) null
- pharmacy_id uuid fk pharmacies(id) null
- region_id uuid fk regions(id) null
- operation_unit_id uuid fk operation_units(id) null
- user_id uuid fk users(id) null
- action text not null
- target_type text null
- target_id text null
- result text not null
- details jsonb null
- ip_address inet null
- created_at timestamptz not null default now()

---

## RLS の基本方針

### pharmacy_staff / pharmacy_admin
- pharmacy_id 一致が基本
- 他局不可

### regional_admin
- region_id / operation_unit_id 一致が基本
- 他地域不可
- 患者本文は必要最小限の API / View で出し分け

### night_pharmacist
- assignment / request を起点にアクセス
- 全患者自由閲覧不可

### system_admin
- audit_logs / notification_logs / system運用テーブル中心
- 患者本文原則不可

---

## 補足
- 監査ログは append-only 前提
- 申し送り確認は handover_confirmations を別テーブル化
- 将来的に patient_access_logs / export_logs を audit_logs から分離してもよい
