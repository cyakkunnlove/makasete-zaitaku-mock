import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { ensureRecentReverification } from '@/lib/api-reauth'
import { getCurrentActorRole } from '@/lib/active-role'
import {
  DEFAULT_PATIENT_EDIT_WINDOW_MINUTES,
  getPatientEditCorrectionAction,
} from '@/lib/correction-policy'
import { getRepositoryMode } from '@/lib/repositories'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { canManagePatientsForUser, getScopedPharmacyId } from '@/lib/patient-permissions'
import { writeAuditLog } from '@/lib/audit-log'
import { buildGeocodeWarnings, geocodeAddress } from '@/lib/google-maps'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  if (!canManagePatientsForUser(user)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ ok: false, error: 'invalid_payload' }, { status: 400 })
  }
  const patch = body as Record<string, unknown>

  const mode = getRepositoryMode()
  if (mode.provider !== 'supabase') {
    return NextResponse.json({ ok: true, mode: 'mock' })
  }

  const supabase = createServerSupabaseClient()
  const { data: existingPatient, error: fetchError } = await supabase
    .from('patients')
    .select('id, pharmacy_id, address, updated_at, updated_by')
    .eq('id', params.id)
    .maybeSingle() as unknown as { data: { id: string; pharmacy_id: string | null; address: string; updated_at: string | null; updated_by: string | null } | null; error: { message: string } | null }

  if (fetchError) {
    return NextResponse.json({ ok: false, error: 'patient_lookup_failed', details: fetchError.message }, { status: 500 })
  }

  if (!existingPatient) {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
  }

  const scopedPharmacyId = getScopedPharmacyId(user)
  if (!scopedPharmacyId || existingPatient.pharmacy_id !== scopedPharmacyId) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const settingsResponse = await supabase
    .from('pharmacy_operation_settings')
    .select('patient_edit_window_minutes')
    .eq('pharmacy_id', scopedPharmacyId)
    .maybeSingle()

  const settings = settingsResponse.data as { patient_edit_window_minutes?: number | null } | null
  const patientEditWindowMinutes = settings?.patient_edit_window_minutes ?? DEFAULT_PATIENT_EDIT_WINDOW_MINUTES
  const actorRole = getCurrentActorRole(user)
  const correctionRequestId = typeof patch.correctionRequestId === 'string' ? patch.correctionRequestId.trim() : ''
  const adminOverrideConfirmed = patch.adminOverrideConfirmed === true
  const adminPasswordConfirmed = patch.adminPasswordConfirmed === true
  const adminPasskeyConfirmed = patch.adminPasskeyConfirmed === true
  const correctionAction = getPatientEditCorrectionAction({
    updatedAt: existingPatient.updated_at,
    windowMinutes: patientEditWindowMinutes,
    hasCorrectionRequest: Boolean(correctionRequestId),
    isPharmacyAdmin: actorRole === 'pharmacy_admin',
    adminOverrideConfirmed,
  })

  if (correctionAction === 'request') {
    return NextResponse.json({
      ok: false,
      error: 'correction_request_required',
      reason: 'patient_edit_locked',
      patientEditWindowMinutes,
    }, { status: 423 })
  }

  if (correctionAction === 'admin_override') {
    if (actorRole !== 'pharmacy_admin' || !adminPasswordConfirmed || !adminPasskeyConfirmed) {
      return NextResponse.json({ ok: false, error: 'admin_override_confirmation_required' }, { status: 403 })
    }
    const reauthResponse = await ensureRecentReverification(user, {
      reason: 'patient_admin_override',
      nextPath: `/dashboard/patients/${params.id}`,
    })
    if (reauthResponse) return reauthResponse
  }

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  }
  const warnings: Array<{ code: string; message: string }> = []

  if (typeof patch.phone === 'string' || patch.phone === null) {
    payload.phone = typeof patch.phone === 'string' ? patch.phone.trim() || null : null
  }

  if (typeof patch.visitNotes === 'string') {
    payload.visit_notes = patch.visitNotes.trim() || null
  }

  if (typeof patch.currentMeds === 'string') payload.current_medications = patch.currentMeds.trim() || null
  if (typeof patch.medicalHistory === 'string') payload.medical_history = patch.medicalHistory.trim() || null
  if (typeof patch.allergies === 'string') payload.allergies = patch.allergies.trim() || null
  if (typeof patch.insuranceInfo === 'string') payload.insurance_info = patch.insuranceInfo.trim() || null
  if (typeof patch.isBillable === 'boolean') {
    payload.is_billable = patch.isBillable
    payload.billing_exclusion_reason = patch.isBillable
      ? null
      : (typeof patch.billingExclusionReason === 'string' ? patch.billingExclusionReason.trim() || null : null)
  } else if (typeof patch.billingExclusionReason === 'string') {
    payload.billing_exclusion_reason = patch.billingExclusionReason.trim() || null
  }

  if (typeof patch.medicalInstitutionId === 'string' || patch.medicalInstitutionId === null) {
    const medicalInstitutionId = typeof patch.medicalInstitutionId === 'string' ? patch.medicalInstitutionId.trim() || null : null
    payload.medical_institution_id = medicalInstitutionId
    if (medicalInstitutionId) {
      const institutionResponse = await supabase
        .from('medical_institutions')
        .select('id, name, organization_id')
        .eq('id', medicalInstitutionId)
        .maybeSingle()

      const institution = institutionResponse.data as { id?: string; name?: string; organization_id?: string } | null
      if (institutionResponse.error || !institution || institution.organization_id !== user.organization_id) {
        return NextResponse.json({ ok: false, error: 'medical_institution_not_found' }, { status: 400 })
      }
      payload.doctor_clinic = typeof institution.name === 'string' ? institution.name : null
    } else {
      payload.doctor_clinic = null
    }
  }

  if (typeof patch.doctorMasterId === 'string' || patch.doctorMasterId === null) {
    const doctorMasterId = typeof patch.doctorMasterId === 'string' ? patch.doctorMasterId.trim() || null : null
    payload.doctor_master_id = doctorMasterId
    if (doctorMasterId) {
      const doctorResponse = await supabase
        .from('doctor_masters')
        .select('id, full_name, phone, organization_id, medical_institution_id')
        .eq('id', doctorMasterId)
        .maybeSingle()

      const doctor = doctorResponse.data as { id?: string; full_name?: string; phone?: string | null; organization_id?: string; medical_institution_id?: string } | null
      if (doctorResponse.error || !doctor || doctor.organization_id !== user.organization_id) {
        return NextResponse.json({ ok: false, error: 'doctor_master_not_found' }, { status: 400 })
      }
      if (typeof payload.medical_institution_id === 'string' && doctor.medical_institution_id !== payload.medical_institution_id) {
        return NextResponse.json({ ok: false, error: 'doctor_master_scope_mismatch' }, { status: 400 })
      }
      payload.doctor_name = typeof doctor.full_name === 'string' ? doctor.full_name : null
      payload.doctor_night_phone = typeof doctor.phone === 'string' ? doctor.phone : null
    } else {
      payload.doctor_name = null
      payload.doctor_night_phone = null
    }
  }

  if (typeof patch.doctorClinic === 'string' && typeof payload.medical_institution_id === 'undefined') payload.doctor_clinic = patch.doctorClinic.trim() || null
  if (typeof patch.doctorName === 'string' && typeof payload.doctor_master_id === 'undefined') payload.doctor_name = patch.doctorName.trim() || null
  if (typeof patch.doctorPhone === 'string' && typeof payload.doctor_master_id === 'undefined') payload.doctor_night_phone = patch.doctorPhone.trim() || null

  if (typeof patch.address === 'string') {
    const nextAddress = patch.address.trim()
    payload.address = nextAddress || existingPatient.address

    if (nextAddress && nextAddress !== existingPatient.address) {
      try {
        const geocoded = await geocodeAddress(nextAddress)
        payload.latitude = geocoded.latitude
        payload.longitude = geocoded.longitude
        payload.geocode_status = 'success'
        payload.geocoded_at = new Date().toISOString()
        payload.geocode_source = 'google_maps'
        payload.geocode_error = null
        payload.geocode_input_address = geocoded.normalizedAddress
        warnings.push(...buildGeocodeWarnings(nextAddress, geocoded.normalizedAddress))
      } catch (error) {
        payload.latitude = null
        payload.longitude = null
        payload.geocode_status = 'failed'
        payload.geocoded_at = null
        payload.geocode_source = null
        payload.geocode_error = error instanceof Error ? error.message : 'geocode_failed'
        payload.geocode_input_address = nextAddress
      }
    }
  }

  const { data, error } = await supabase
    .from('patients')
    .update(payload as never)
    .eq('id', params.id)
    .select('*')
    .single() as unknown as { data: { id: string } | null; error: { message: string } | null }

  if (error) {
    return NextResponse.json({ ok: false, error: 'patient_update_failed', details: error.message }, { status: 500 })
  }

  if (data) {
    await writeAuditLog({
      user,
      action: 'patient_updated',
      targetType: 'patient',
      targetId: params.id,
      details: {
        updated_fields: Object.keys(payload).filter((key) => !['updated_at', 'updated_by'].includes(key)),
        role: actorRole ?? user.role,
        correction_action: correctionAction,
        correction_request_id: correctionRequestId || null,
        geocode_status: payload.geocode_status ?? null,
      },
    })
  }

  return NextResponse.json({ ok: true, mode: 'supabase', patient: data, warnings })
}
