import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { ensureRecentReverification } from '@/lib/api-reauth'
import { getRepositoryMode } from '@/lib/repositories'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { canManagePatientsForUser, getScopedPharmacyId } from '@/lib/patient-permissions'
import { writeAuditLog } from '@/lib/audit-log'
import { buildGeocodeWarnings, geocodeAddress } from '@/lib/google-maps'

function normalizeDateInput(value: unknown) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const digits = trimmed.replace(/[^0-9]/g, '')
  if (digits.length === 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(trimmed)) return trimmed.replace(/\//g, '-')
  return null
}

export async function POST(request: Request) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  if (!canManagePatientsForUser(user)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const reauthResponse = await ensureRecentReverification(user, {
    reason: 'patient_create',
    nextPath: '/dashboard/patients/new',
  })
  if (reauthResponse) return reauthResponse

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ ok: false, error: 'invalid_payload' }, { status: 400 })
  }

  const basic = (body as Record<string, unknown>).basic as Record<string, unknown> | undefined
  const medical = (body as Record<string, unknown>).medical as Record<string, unknown> | undefined
  const visitPlan = (body as Record<string, unknown>).visitPlan as Record<string, unknown> | undefined

  const fullName = typeof basic?.fullName === 'string' ? basic.fullName.trim() : ''
  const birthDate = normalizeDateInput(basic?.birthDate)
  const addressLine1 = typeof basic?.addressLine1 === 'string' ? basic.addressLine1.trim() : ''
  const phone = typeof basic?.phone === 'string' ? basic.phone.trim() : null
  const firstVisitDate = normalizeDateInput(visitPlan?.firstVisitDate)
  const visitWeekdays = Array.isArray(visitPlan?.visitWeekdays)
    ? visitPlan?.visitWeekdays.filter((item): item is number => typeof item === 'number')
    : []

  if (!fullName || !birthDate || !addressLine1) {
    return NextResponse.json({ ok: false, error: 'missing_required_fields' }, { status: 400 })
  }

  if (!firstVisitDate && visitWeekdays.length === 0) {
    return NextResponse.json({ ok: false, error: 'visit_plan_required' }, { status: 400 })
  }

  const warnings: Array<{ code: string; message: string }> = []
  if (!phone) {
    warnings.push({ code: 'phone_missing', message: '連絡先電話が未設定です。' })
  }

  const mode = getRepositoryMode()
  if (mode.provider !== 'supabase') {
    return NextResponse.json({
      ok: true,
      mode: 'mock',
      warnings,
    })
  }

  const supabase = createServerSupabaseClient()
  let geocodePayload: Record<string, unknown> = {
    geocode_status: 'pending',
    geocode_input_address: addressLine1,
    geocoded_at: null,
    geocode_source: null,
    geocode_error: null,
    latitude: null,
    longitude: null,
  }

  try {
    const geocoded = await geocodeAddress(addressLine1)
    geocodePayload = {
      geocode_status: 'success',
      geocode_input_address: geocoded.normalizedAddress,
      geocoded_at: new Date().toISOString(),
      geocode_source: 'google_maps',
      geocode_error: null,
      latitude: geocoded.latitude,
      longitude: geocoded.longitude,
    }
    warnings.push(...buildGeocodeWarnings(addressLine1, geocoded.normalizedAddress))
  } catch (error) {
    geocodePayload = {
      ...geocodePayload,
      geocode_status: 'failed',
      geocode_error: error instanceof Error ? error.message : 'geocode_failed',
    }
  }

  const medicalInstitutionId = typeof medical?.medicalInstitutionId === 'string' ? medical.medicalInstitutionId.trim() || null : null
  const doctorMasterId = typeof medical?.doctorMasterId === 'string' ? medical.doctorMasterId.trim() || null : null

  let doctorClinic = typeof medical?.doctorClinic === 'string' ? medical.doctorClinic.trim() || null : null
  let doctorName = typeof medical?.doctorName === 'string' ? medical.doctorName.trim() || null : null
  let doctorPhone = typeof medical?.doctorPhone === 'string' ? medical.doctorPhone.trim() || null : null

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
    doctorClinic = typeof institution.name === 'string' ? institution.name : doctorClinic
  }

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
    if (medicalInstitutionId && doctor.medical_institution_id !== medicalInstitutionId) {
      return NextResponse.json({ ok: false, error: 'doctor_master_scope_mismatch' }, { status: 400 })
    }
    doctorName = typeof doctor.full_name === 'string' ? doctor.full_name : doctorName
    doctorPhone = typeof doctor.phone === 'string' ? doctor.phone : doctorPhone
  }

  const payload = {
    organization_id: user.organization_id,
    pharmacy_id: getScopedPharmacyId(user),
    medical_institution_id: medicalInstitutionId,
    doctor_master_id: doctorMasterId,
    full_name: fullName,
    date_of_birth: birthDate,
    address: addressLine1,
    phone,
    emergency_contact_name: typeof basic?.emergencyContactName === 'string' ? basic.emergencyContactName.trim() : '未設定',
    emergency_contact_phone: typeof basic?.emergencyContactPhone === 'string' ? basic.emergencyContactPhone.trim() : '-',
    emergency_contact_relation: typeof basic?.emergencyContactRelation === 'string' ? basic.emergencyContactRelation.trim() || null : null,
    doctor_name: doctorName,
    doctor_clinic: doctorClinic,
    doctor_night_phone: doctorPhone,
    medical_history: typeof medical?.medicalHistory === 'string' ? medical.medicalHistory.trim() || null : null,
    allergies: typeof medical?.allergies === 'string' ? medical.allergies.trim() || null : null,
    current_medications: typeof medical?.currentMeds === 'string' ? medical.currentMeds.trim() || null : null,
    visit_notes: typeof basic?.visitNotes === 'string' ? basic.visitNotes.trim() || null : null,
    insurance_info: typeof medical?.insuranceInfo === 'string' ? medical.insuranceInfo.trim() || null : null,
    disease_name: typeof medical?.diseaseName === 'string' ? medical.diseaseName.trim() || null : null,
    risk_score: 1,
    requires_multi_visit: Number(visitPlan?.monthlyVisitCount ?? 4) > 1,
    status: 'active' as const,
    created_by: user.id,
    updated_by: user.id,
    ...geocodePayload,
  }

  const { data, error } = await supabase.from('patients').insert(payload as never).select('*').single() as unknown as {
    data: { id: string; full_name: string } | null
    error: { message: string } | null
  }
  if (error) {
    return NextResponse.json({ ok: false, error: 'supabase_insert_failed', details: error.message }, { status: 500 })
  }

  if (data) {
    await writeAuditLog({
      user,
      action: 'patient_created',
      targetType: 'patient',
      targetId: data.id,
      details: {
        patient_name: data.full_name,
        phone_missing: !phone,
        has_visit_weekdays: visitWeekdays.length > 0,
        has_first_visit_date: Boolean(firstVisitDate),
        geocode_status: geocodePayload.geocode_status,
      },
    })
  }

  return NextResponse.json({
    ok: true,
    mode: 'supabase',
    patient: data,
    warnings,
  })
}
