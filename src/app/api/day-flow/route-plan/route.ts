import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { canManagePatients } from '@/lib/patient-permissions'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  if (!canManagePatients(user.role) || !user.pharmacy_id) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const payload = body && typeof body === 'object' ? (body as Record<string, unknown>) : null
  const rawPatientIds = Array.isArray(payload?.patientIds) ? payload.patientIds : []
  const patientIds = rawPatientIds.filter((item): item is string => typeof item === 'string')

  if (patientIds.length === 0) {
    return NextResponse.json({ ok: false, error: 'patient_ids_required' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('patients')
    .select('id, full_name, address, latitude, longitude')
    .eq('pharmacy_id', user.pharmacy_id)
    .in('id', patientIds)

  if (error) {
    return NextResponse.json({ ok: false, error: 'patient_fetch_failed', details: error.message }, { status: 500 })
  }

  const rows = (data ?? []) as Array<{
    id: string
    full_name: string
    address: string
    latitude: number | null
    longitude: number | null
  }>

  const patients = rows.map((patient) => ({
    id: String(patient.id),
    name: String(patient.full_name),
    address: String(patient.address),
    latitude: typeof patient.latitude === 'number' ? patient.latitude : null,
    longitude: typeof patient.longitude === 'number' ? patient.longitude : null,
  }))

  const withCoordinates = patients.filter((patient) => patient.latitude !== null && patient.longitude !== null)
  const missingCoordinates = patients.filter((patient) => patient.latitude === null || patient.longitude === null)

  return NextResponse.json({
    ok: true,
    routePlan: {
      ready: missingCoordinates.length === 0,
      suggestedOrder: withCoordinates,
      missingCoordinates,
      message: missingCoordinates.length === 0
        ? '座標が揃っている患者でルート提案できます。'
        : '一部の患者で座標が未取得です。住所確認または座標取得が必要です。',
    },
  })
}
