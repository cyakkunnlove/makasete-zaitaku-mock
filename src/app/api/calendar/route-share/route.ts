import { NextResponse } from 'next/server'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

import { getCurrentUser } from '@/lib/auth'
import { canManagePatients } from '@/lib/patient-permissions'

type RouteStop = {
  id: string
  name: string
  address: string
}

function buildMapsLink(origin: string, destination: string) {
  const url = new URL('https://www.google.com/maps/dir/')
  url.searchParams.set('api', '1')
  url.searchParams.set('origin', origin)
  url.searchParams.set('destination', destination)
  url.searchParams.set('travelmode', 'driving')
  return url.toString()
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  if (!canManagePatients(user.role) || !user.pharmacy_id) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }
  if (!user.email) {
    return NextResponse.json({ ok: false, error: 'email_missing' }, { status: 400 })
  }

  const region = process.env.AWS_REGION
  const fromEmail = process.env.SES_FROM_EMAIL
  if (!region || !fromEmail) {
    return NextResponse.json({ ok: false, error: 'mail_env_missing', details: 'AWS_REGION or SES_FROM_EMAIL is missing' }, { status: 500 })
  }

  const body = await request.json().catch(() => null)
  const payload = body && typeof body === 'object' ? (body as Record<string, unknown>) : null
  const flowDate = typeof payload?.flowDate === 'string' ? payload.flowDate : null
  const totalDuration = typeof payload?.totalDuration === 'string' ? payload.totalDuration : null
  const totalDistanceKm = typeof payload?.totalDistanceKm === 'number' ? payload.totalDistanceKm : null
  const originName = typeof payload?.originName === 'string' ? payload.originName : '薬局'
  const originAddress = typeof payload?.originAddress === 'string' ? payload.originAddress : null
  const stops = Array.isArray(payload?.stops)
    ? payload?.stops.filter((item): item is RouteStop => {
        if (!item || typeof item !== 'object') return false
        const row = item as Record<string, unknown>
        return typeof row.id === 'string' && typeof row.name === 'string' && typeof row.address === 'string'
      })
    : []

  if (!flowDate || stops.length === 0) {
    return NextResponse.json({ ok: false, error: 'invalid_payload' }, { status: 400 })
  }

  const legLines = stops.map((stop, index) => {
    const from = index === 0 ? originAddress : stops[index - 1]?.address
    const to = stop.address
    const link = from ? buildMapsLink(from, to) : null
    return {
      label: `${index + 1}. ${stop.name} / ${stop.address}`,
      legLabel: from ? `${index === 0 ? originName : stops[index - 1]?.name} → ${stop.name}` : null,
      link,
    }
  })

  const textLines = [
    `${flowDate} の巡回ルートです。`,
    '',
    totalDuration ? `総移動時間目安: ${totalDuration}` : null,
    typeof totalDistanceKm === 'number' ? `総距離: ${totalDistanceKm.toFixed(1)}km` : null,
    '',
    '巡回順',
    ...legLines.flatMap((item) => [
      item.label,
      item.legLabel ? `  区間: ${item.legLabel}` : null,
      item.link ? `  Google Maps: ${item.link}` : null,
    ].filter(Boolean)),
  ].filter(Boolean).join('\n')

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; line-height: 1.6;">
      <h2 style="margin-bottom: 8px;">${escapeHtml(flowDate)} の巡回ルート</h2>
      <p style="margin: 0 0 12px;">${totalDuration ? `総移動時間目安: ${escapeHtml(totalDuration)}` : ''}${totalDuration && typeof totalDistanceKm === 'number' ? ' / ' : ''}${typeof totalDistanceKm === 'number' ? `総距離: ${totalDistanceKm.toFixed(1)}km` : ''}</p>
      <ol style="padding-left: 20px;">
        ${legLines.map((item) => `
          <li style="margin-bottom: 12px;">
            <div><strong>${escapeHtml(item.label)}</strong></div>
            ${item.legLabel ? `<div style="font-size: 12px; color: #4b5563;">区間: ${escapeHtml(item.legLabel)}</div>` : ''}
            ${item.link ? `<div style="margin-top: 4px;"><a href="${item.link}">Google Maps でこの区間を開く</a></div>` : ''}
          </li>
        `).join('')}
      </ol>
    </div>
  `

  try {
    const ses = new SESClient({ region })
    await ses.send(new SendEmailCommand({
      Source: fromEmail,
      Destination: { ToAddresses: [user.email] },
      Message: {
        Subject: { Data: `【マカセテ在宅】${flowDate} の巡回ルート`, Charset: 'UTF-8' },
        Body: {
          Text: { Data: textLines, Charset: 'UTF-8' },
          Html: { Data: html, Charset: 'UTF-8' },
        },
      },
    }))

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ ok: false, error: 'route_share_failed', details: error instanceof Error ? error.message : 'unknown_error' }, { status: 500 })
  }
}
