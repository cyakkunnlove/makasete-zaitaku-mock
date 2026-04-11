import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { canManagePatients } from '@/lib/patient-permissions'
import { buildGeocodeWarnings, geocodeAddress } from '@/lib/google-maps'

export async function POST(request: Request) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  if (!canManagePatients(user.role)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const address = body && typeof body === 'object' && typeof (body as Record<string, unknown>).address === 'string'
    ? String((body as Record<string, unknown>).address).trim()
    : ''

  if (!address) {
    return NextResponse.json({ ok: false, error: 'address_required' }, { status: 400 })
  }

  try {
    const geocoded = await geocodeAddress(address)
    const warnings = buildGeocodeWarnings(address, geocoded.normalizedAddress)
    return NextResponse.json({
      ok: true,
      preview: {
        inputAddress: address,
        normalizedAddress: geocoded.normalizedAddress,
        latitude: geocoded.latitude,
        longitude: geocoded.longitude,
        warnings,
      },
    })
  } catch (error) {
    return NextResponse.json({
      ok: true,
      preview: {
        inputAddress: address,
        normalizedAddress: null,
        latitude: null,
        longitude: null,
        warnings: [
          { code: 'geocode_failed', message: error instanceof Error ? error.message : '住所の確認に失敗しました。' },
        ],
      },
    })
  }
}
