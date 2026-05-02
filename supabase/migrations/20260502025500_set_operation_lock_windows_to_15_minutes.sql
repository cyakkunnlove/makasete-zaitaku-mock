alter table if exists public.pharmacy_operation_settings
  alter column patient_edit_window_minutes set default 15,
  alter column billing_paid_cancel_window_minutes set default 15;

update public.pharmacy_operation_settings
set patient_edit_window_minutes = 15,
    billing_paid_cancel_window_minutes = 15,
    updated_at = now()
where patient_edit_window_minutes = 30
  and billing_paid_cancel_window_minutes = 30;
