export function assertGoogleMapsEnv() {
  const serverApiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY
  const publicApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!serverApiKey) {
    throw new Error('GOOGLE_MAPS_SERVER_API_KEY is missing.')
  }

  return { serverApiKey, publicApiKey: publicApiKey ?? null }
}

function toLatLng(latitude: number, longitude: number) {
  return {
    location: {
      latLng: {
        latitude,
        longitude,
      },
    },
  }
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

type RouteStop = {
  id: string
  name: string
  latitude: number
  longitude: number
  address?: string
  geocodeInputAddress?: string | null
  geocodeStatus?: string | null
}

export async function optimizeRoundTripRoute(options: {
  origin: { latitude: number; longitude: number }
  stops: RouteStop[]
}) {
  const { serverApiKey } = assertGoogleMapsEnv()
  if (options.stops.length === 0) {
    return {
      orderedStopIds: [] as string[],
      orderedStops: [] as typeof options.stops,
      totalDuration: null as string | null,
      totalDistanceMeters: null as number | null,
      polyline: null as string | null,
    }
  }

  const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': serverApiKey,
      'X-Goog-FieldMask': 'routes.optimizedIntermediateWaypointIndex,routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
    },
    body: JSON.stringify({
      origin: toLatLng(options.origin.latitude, options.origin.longitude),
      destination: toLatLng(options.origin.latitude, options.origin.longitude),
      intermediates: options.stops.map((stop) => toLatLng(stop.latitude, stop.longitude)),
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
      optimizeWaypointOrder: true,
      languageCode: 'ja',
      units: 'METRIC',
    }),
  })

  const result = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(`routes_http_${response.status}`)
  }

  const route = result?.routes?.[0]
  if (!route) {
    throw new Error(result?.error?.message ?? 'ROUTE_PLAN_FAILED')
  }

  const optimizedIndexes = Array.isArray(route.optimizedIntermediateWaypointIndex)
    ? route.optimizedIntermediateWaypointIndex.map((item: unknown) => Number(item)).filter((item: number) => Number.isFinite(item))
    : options.stops.map((_, index) => index)

  const orderedStops: RouteStop[] = optimizedIndexes
    .map((index: number) => options.stops[index])
    .filter((stop: RouteStop | undefined): stop is RouteStop => Boolean(stop))

  return {
    orderedStopIds: orderedStops.map((stop) => stop.id),
    orderedStops,
    totalDuration: typeof route.duration === 'string' ? route.duration : null,
    totalDistanceMeters: typeof route.distanceMeters === 'number' ? route.distanceMeters : null,
    polyline: typeof route?.polyline?.encodedPolyline === 'string' ? route.polyline.encodedPolyline : null,
  }
}
