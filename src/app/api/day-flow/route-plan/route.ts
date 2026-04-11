import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { canManagePatients } from '@/lib/patient-permissions'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { buildGeocodeWarnings, geocodeAddress, optimizeRoundTripRoute } from '@/lib/google-maps'

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
  const [{ data, error }, { data: pharmacy, error: pharmacyError }] = await Promise.all([
    supabase
      .from('patients')
      .select('id, full_name, address, latitude, longitude, geocode_input_address, geocode_status')
      .eq('pharmacy_id', user.pharmacy_id)
      .in('id', patientIds),
    supabase
      .from('pharmacies')
      .select('id, name, address')
      .eq('id', user.pharmacy_id)
      .maybeSingle(),
  ])

  if (error) {
    return NextResponse.json({ ok: false, error: 'patient_fetch_failed', details: error.message }, { status: 500 })
  }
  if (pharmacyError) {
    return NextResponse.json({ ok: false, error: 'pharmacy_fetch_failed', details: pharmacyError.message }, { status: 500 })
  }

  const pharmacyRecord = pharmacy as { id: string; name: string; address: string | null } | null
  if (!pharmacyRecord?.address) {
    return NextResponse.json({ ok: false, error: 'pharmacy_address_missing' }, { status: 400 })
  }

  const rows = (data ?? []) as Array<{
    id: string
    full_name: string
    address: string
    latitude: number | null
    longitude: number | null
    geocode_input_address?: string | null
    geocode_status?: string | null
  }>

  const patients = rows.map((patient) => {
    const address = String(patient.address)
    const geocodeInputAddress = typeof patient.geocode_input_address === 'string' ? patient.geocode_input_address : null
    return {
      id: String(patient.id),
      name: String(patient.full_name),
      address,
      geocodeInputAddress,
      geocodeStatus: typeof patient.geocode_status === 'string' ? patient.geocode_status : null,
      geocodeWarnings: buildGeocodeWarnings(address, geocodeInputAddress),
      latitude: typeof patient.latitude === 'number' ? patient.latitude : null,
      longitude: typeof patient.longitude === 'number' ? patient.longitude : null,
    }
  })

  const withCoordinates = [...patients]
  const missingCoordinates = patients.filter((patient) => patient.latitude === null || patient.longitude === null)

  if (missingCoordinates.length > 0) {
    for (const patient of missingCoordinates) {
      try {
        const geocoded = await geocodeAddress(patient.address)
        patient.latitude = geocoded.latitude
        patient.longitude = geocoded.longitude
        patient.geocodeInputAddress = geocoded.normalizedAddress
        patient.geocodeStatus = 'success'
        patient.geocodeWarnings = buildGeocodeWarnings(patient.address, geocoded.normalizedAddress)

        await supabase
          .from('patients')
          .update({
            latitude: geocoded.latitude,
            longitude: geocoded.longitude,
            geocode_status: 'success',
            geocoded_at: new Date().toISOString(),
            geocode_source: 'google_maps',
            geocode_error: null,
            geocode_input_address: geocoded.normalizedAddress,
            updated_at: new Date().toISOString(),
          } as never)
          .eq('id', patient.id)
      } catch {
        // keep missing state for UI feedback
      }
    }
  }

  const readyPatients = withCoordinates.filter((patient) => patient.latitude !== null && patient.longitude !== null)
  const stillMissingCoordinates = withCoordinates.filter((patient) => patient.latitude === null || patient.longitude === null)

  if (readyPatients.length === 0 || stillMissingCoordinates.length > 0) {
    return NextResponse.json({
      ok: true,
      routePlan: {
        ready: false,
        suggestedOrder: readyPatients,
        missingCoordinates: stillMissingCoordinates,
        message: stillMissingCoordinates.length > 0
          ? '一部の患者で座標を自動取得できませんでした。住所確認が必要です。'
          : 'ルート提案対象の座標がありません。',
      },
    })
  }

  const origin = await geocodeAddress(pharmacyRecord.address)
  const optimized = await optimizeRoundTripRoute({
    origin: { latitude: origin.latitude, longitude: origin.longitude },
    stops: readyPatients.map((patient) => ({
      id: patient.id,
      name: patient.name,
      latitude: patient.latitude as number,
      longitude: patient.longitude as number,
      address: patient.address,
      geocodeInputAddress: patient.geocodeInputAddress,
      geocodeStatus: patient.geocodeStatus,
    })),
  })

  return NextResponse.json({
    ok: true,
    routePlan: {
      ready: true,
      suggestedOrder: optimized.orderedStops,
      missingCoordinates: [],
      totalDuration: optimized.totalDuration,
      totalDistanceMeters: optimized.totalDistanceMeters,
      polyline: optimized.polyline,
      origin: {
        name: pharmacyRecord.name,
        address: pharmacyRecord.address,
        geocodeInputAddress: origin.normalizedAddress,
        geocodeWarnings: buildGeocodeWarnings(pharmacyRecord.address, origin.normalizedAddress),
        latitude: origin.latitude,
        longitude: origin.longitude,
      },
      debug: {
        selectedPatients: readyPatients,
      },
      message: '薬局を起点にしたおすすめ巡回順を作成しました。',
    },
  })
}
