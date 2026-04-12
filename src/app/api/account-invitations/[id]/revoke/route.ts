import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { ensureRecentReverification } from '@/lib/api-reauth'
import { revokeAccountInvitation } from '@/lib/account-invitation-service'

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const reauthResponse = await ensureRecentReverification(user, {
    reason: 'account_invitation_revoke',
    nextPath: '/dashboard/staff',
  })
  if (reauthResponse) return reauthResponse

  const result = await revokeAccountInvitation({ actor: user, invitationId: params.id })
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error, details: 'details' in result ? result.details : null }, { status: result.status })
  }

  return NextResponse.json({ ok: true, ...result.data })
}
