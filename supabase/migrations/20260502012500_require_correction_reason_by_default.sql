alter table if exists public.pharmacy_operation_settings
  alter column correction_reason_required set default true;

update public.pharmacy_operation_settings
set correction_reason_required = true,
    updated_at = now()
where correction_reason_required is false;
