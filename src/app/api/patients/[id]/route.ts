import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { getRepositoryMode } from '@/lib/repositories'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { canManagePatients } from '@/lib/patient-permissions'
import { writeAuditLog } from '@/lib/audit-log'
import { buildGeocodeWarnings, geocodeAddress } from '@/lib/google-maps'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  if (!canManagePatients(user.role)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ ok: false, error: 'invalid_payload' }, { status: 400 })
  }

  const mode = getRepositoryMode()
  if (mode.provider !== 'supabase') {
    return NextResponse.json({ ok: true, mode: 'mock' })
  }

  const supabase = createServerSupabaseClient()
  const { data: existingPatient, error: fetchError } = await supabase
    .from('patients')
    .select('id, pharmacy_id, address')
    .eq('id', params.id)
    .maybeSingle() as unknown as { data: { id: string; pharmacy_id: string | null; address: string } | null; error: { message: string } | null }

  if (fetchError) {
    return NextResponse.json({ ok: false, error: 'patient_lookup_failed', details: fetchError.message }, { status: 500 })
  }

  if (!existingPatient) {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
  }

  if (!user.pharmacy_id || existingPatient.pharmacy_id !== user.pharmacy_id) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const patch = body as Record<string, unknown>
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
        role: user.role,
        geocode_status: payload.geocode_status ?? null,
      },
    })
  }

  return NextResponse.json({ ok: true, mode: 'supabase', patient: data, warnings })
}
