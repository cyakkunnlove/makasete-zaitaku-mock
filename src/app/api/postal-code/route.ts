import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const postalCode = (url.searchParams.get('code') ?? '').replace(/[^0-9]/g, '')

  if (postalCode.length !== 7) {
    return NextResponse.json({ ok: false, error: 'invalid_postal_code' }, { status: 400 })
  }

  const lookupUrl = new URL('https://zipcloud.ibsnet.co.jp/api/search')
  lookupUrl.searchParams.set('zipcode', postalCode)

  try {
    const response = await fetch(lookupUrl.toString(), { cache: 'no-store' })
    const result = await response.json().catch(() => null)

    if (!response.ok) {
      return NextResponse.json({ ok: false, error: 'postal_lookup_failed' }, { status: 502 })
    }

    if (!result || result.status !== 200) {
      return NextResponse.json({ ok: false, error: 'postal_lookup_failed', details: result?.message ?? null }, { status: 502 })
    }

    const first = Array.isArray(result.results) ? result.results[0] : null
    if (!first) {
      return NextResponse.json({ ok: true, found: false, address: null })
    }

    const prefecture = String(first.address1 ?? '')
    const city = String(first.address2 ?? '')
    const town = String(first.address3 ?? '')

    return NextResponse.json({
      ok: true,
      found: true,
      address: {
        prefecture,
        city,
        town,
        full: `${prefecture}${city}${town}`,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: 'postal_lookup_failed',
        details: error instanceof Error ? error.message : 'unknown_error',
      },
      { status: 502 },
    )
  }
}
