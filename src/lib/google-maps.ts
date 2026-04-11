export function assertGoogleMapsEnv() {
  const serverApiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY
  const publicApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!serverApiKey) {
    throw new Error('GOOGLE_MAPS_SERVER_API_KEY is missing.')
  }

  return { serverApiKey, publicApiKey: publicApiKey ?? null }
}

export async function geocodeAddress(address: string) {
  const { serverApiKey } = assertGoogleMapsEnv()
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
  url.searchParams.set('address', address)
  url.searchParams.set('language', 'ja')
  url.searchParams.set('region', 'jp')
  url.searchParams.set('key', serverApiKey)

  const response = await fetch(url.toString(), { cache: 'no-store' })
  const result = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(`geocoding_http_${response.status}`)
  }

  if (!result || result.status !== 'OK' || !Array.isArray(result.results) || !result.results[0]?.geometry?.location) {
    throw new Error(result?.status ?? 'GEOCODE_FAILED')
  }

  const location = result.results[0].geometry.location as { lat: number; lng: number }
  return {
    latitude: location.lat,
    longitude: location.lng,
    rawStatus: result.status as string,
    normalizedAddress: String(result.results[0].formatted_address ?? address),
  }
}
