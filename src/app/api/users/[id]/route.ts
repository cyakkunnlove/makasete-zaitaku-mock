import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { ensureRecentReverification } from '@/lib/api-reauth'
import { updateManagedUser } from '@/lib/account-invitation-service'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const reauthResponse = await ensureRecentReverification(user, {
    reason: 'managed_user_update',
    nextPath: '/dashboard/staff',
  })
  if (reauthResponse) return reauthResponse

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ ok: false, error: 'invalid_payload' }, { status: 400 })
  }

  const result = await updateManagedUser({
    actor: user,
    userId: params.id,
    fullName: typeof (body as Record<string, unknown>).fullName === 'string' ? (body as Record<string, string>).fullName : '',
    phone: typeof (body as Record<string, unknown>).phone === 'string' ? (body as Record<string, string>).phone : null,
    regionId: typeof (body as Record<string, unknown>).regionId === 'string' ? (body as Record<string, string>).regionId : null,
    pharmacyId: typeof (body as Record<string, unknown>).pharmacyId === 'string' ? (body as Record<string, string>).pharmacyId : null,
  })

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error, details: 'details' in result ? result.details : null }, { status: result.status })
  }

  return NextResponse.json({ ok: true, ...result.data })
}
