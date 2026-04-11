import { Buffer } from 'node:buffer'
import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { canEditPatientRecord } from '@/lib/patient-permissions'
import { getPatientById } from '@/lib/repositories/patients'
import { writeAuditLog } from '@/lib/audit-log'
import { createAdminClient } from '@/lib/supabase/admin'
import type { PatientHomePhoto, PatientHomePhotoType } from '@/types/database'

const BUCKET = 'patient-home-photos'
const MAX_PHOTOS = 3
const MAX_FILE_SIZE = 8 * 1024 * 1024

async function ensureCanAccessPatient(patientId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 }) }

  const patient = await getPatientById(patientId)
  if (!patient) return { error: NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 }) }

  if (!patient.pharmacy_id) {
    return { error: NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 }) }
  }

  const canEdit = canEditPatientRecord({ role: user.role, user, patient: { pharmacyId: patient.pharmacy_id } })
  if (!canEdit) return { error: NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 }) }

  return { user, patient }
}

async function buildPhotoResponse(admin: ReturnType<typeof createAdminClient>, photo: PatientHomePhoto) {
  const [thumbnailResult, fullResult] = await Promise.all([
    admin.storage.from(BUCKET).createSignedUrl(photo.storage_path, 60 * 60, {
      transform: { width: 320, height: 240, resize: 'cover', quality: 60 },
    }),
    admin.storage.from(BUCKET).createSignedUrl(photo.storage_path, 60 * 60),
  ])

  return {
    ...photo,
    thumbnail_url: thumbnailResult.data?.signedUrl ?? null,
    image_url: fullResult.data?.signedUrl ?? null,
  }
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const access = await ensureCanAccessPatient(params.id)
  if ('error' in access) return access.error

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('patient_home_photos')
    .select('*')
    .eq('patient_id', params.id)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ ok: false, error: 'photo_list_failed', details: error.message }, { status: 500 })
  }

  const photos = await Promise.all((data ?? []).map((photo) => buildPhotoResponse(admin, photo as PatientHomePhoto)))
  return NextResponse.json({ ok: true, photos })
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const access = await ensureCanAccessPatient(params.id)
  if ('error' in access) return access.error
  const { user, patient } = access

  const formData = await request.formData().catch(() => null)
  const file = formData?.get('file')
  const caption = typeof formData?.get('caption') === 'string' ? String(formData.get('caption')).trim() : null
  const photoType = typeof formData?.get('photoType') === 'string' ? (String(formData.get('photoType')).trim() as PatientHomePhotoType) : null

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: 'file_required' }, { status: 400 })
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ ok: false, error: 'file_too_large' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: activePhotos, error: countError } = await admin
    .from('patient_home_photos')
    .select('id, sort_order')
    .eq('patient_id', params.id)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })

  if (countError) {
    return NextResponse.json({ ok: false, error: 'photo_count_failed', details: countError.message }, { status: 500 })
  }
  const existingPhotos = (activePhotos ?? []) as Array<{ id: string; sort_order: number | null }>
  if (existingPhotos.length >= MAX_PHOTOS) {
    return NextResponse.json({ ok: false, error: 'photo_limit_reached', details: '写真は3枚までです。' }, { status: 400 })
  }

  const usedSlots = new Set(existingPhotos.map((item) => Number(item.sort_order ?? 0)).filter(Boolean))
  const sortOrder = [1, 2, 3].find((slot) => !usedSlots.has(slot)) ?? existingPhotos.length + 1
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const filePath = `${patient.pharmacy_id ?? 'unknown'}/${patient.id}/${crypto.randomUUID()}.${extension}`
  const contentType = file.type || 'image/jpeg'
  const fileBuffer = Buffer.from(await file.arrayBuffer())

  const uploadResult = await admin.storage.from(BUCKET).upload(filePath, fileBuffer, {
    upsert: false,
    contentType,
  })

  if (uploadResult.error) {
    return NextResponse.json({ ok: false, error: 'photo_upload_failed', details: uploadResult.error.message }, { status: 500 })
  }

  const insertPayload = {
    patient_id: patient.id,
    storage_path: filePath,
    photo_type: photoType,
    caption,
    sort_order: sortOrder,
    uploaded_by: user.id,
  }

  const { data, error } = await admin
    .from('patient_home_photos')
    .insert(insertPayload as never)
    .select('*')
    .single()

  if (error) {
    await admin.storage.from(BUCKET).remove([filePath])
    return NextResponse.json({ ok: false, error: 'photo_insert_failed', details: error.message }, { status: 500 })
  }

  const savedPhoto = data as PatientHomePhoto

  await writeAuditLog({
    user,
    action: 'patient_photo_added',
    targetType: 'patient',
    targetId: patient.id,
    details: {
      patient_id: patient.id,
      photo_id: savedPhoto.id,
      photo_type: savedPhoto.photo_type,
      storage_path: savedPhoto.storage_path,
    },
  })

  return NextResponse.json({ ok: true, photo: await buildPhotoResponse(admin, savedPhoto) })
}
