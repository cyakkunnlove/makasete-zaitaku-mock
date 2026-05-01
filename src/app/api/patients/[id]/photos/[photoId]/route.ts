import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { getCurrentActorRole } from '@/lib/active-role'
import { canEditPatientRecord, getScopedPharmacyId } from '@/lib/patient-permissions'
import { getPatientByIdForPharmacy } from '@/lib/repositories/patients'
import { writeAuditLog } from '@/lib/audit-log'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE(request: Request, { params }: { params: { id: string; photoId: string } }) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const scopedPharmacyId = getScopedPharmacyId(user)
  if (!scopedPharmacyId) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const patient = await getPatientByIdForPharmacy({
    organizationId: user.organization_id,
    pharmacyId: scopedPharmacyId,
    patientId: params.id,
  })
  if (!patient) {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
  }

  if (!patient.pharmacy_id) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const canEdit = canEditPatientRecord({
    role: getCurrentActorRole(user),
    user: { pharmacy_id: scopedPharmacyId },
    patient: { pharmacyId: patient.pharmacy_id },
  })
  if (!canEdit) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const deleteReason = body && typeof body === 'object' && typeof (body as Record<string, unknown>).deleteReason === 'string'
    ? String((body as Record<string, unknown>).deleteReason).trim() || 'user_deleted'
    : 'user_deleted'

  const admin = createAdminClient()
  const { data: photo, error: fetchError } = await admin
    .from('patient_home_photos')
    .select('*')
    .eq('id', params.photoId)
    .eq('patient_id', patient.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (fetchError) {
    return NextResponse.json({ ok: false, error: 'photo_fetch_failed', details: fetchError.message }, { status: 500 })
  }
  const existingPhoto = photo as { id: string; storage_path: string } | null
  if (!existingPhoto) {
    return NextResponse.json({ ok: false, error: 'photo_not_found' }, { status: 404 })
  }

  const now = new Date().toISOString()
  const { error } = await admin
    .from('patient_home_photos')
    .update({
      deleted_by: user.id,
      deleted_at: now,
      delete_reason: deleteReason,
      updated_at: now,
    } as never)
    .eq('id', params.photoId)
    .eq('patient_id', patient.id)

  if (error) {
    return NextResponse.json({ ok: false, error: 'photo_delete_failed', details: error.message }, { status: 500 })
  }

  await writeAuditLog({
    user,
    action: 'patient_photo_deleted',
    targetType: 'patient',
    targetId: patient.id,
    details: {
      patient_id: patient.id,
      photo_id: existingPhoto.id,
      delete_reason: deleteReason,
    },
  })

  return NextResponse.json({ ok: true })
}
