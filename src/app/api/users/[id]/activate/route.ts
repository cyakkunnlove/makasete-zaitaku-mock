import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { ensureRecentReverification } from '@/lib/api-reauth'
import { setManagedUserStatus } from '@/lib/account-invitation-service'

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const reauthResponse = await ensureRecentReverification(user, {
    reason: 'managed_user_activate',
    nextPath: '/dashboard/staff',
  })
  if (reauthResponse) return reauthResponse

  const result = await setManagedUserStatus({ actor: user, userId: params.id, nextStatus: 'active' })
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error, details: 'details' in result ? result.details : null }, { status: result.status })
  }

  return NextResponse.json({ ok: true, ...result.data })
}
