import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { ensureRecentReverification } from '@/lib/api-reauth'
import { createAccountInvitation, listAccountInvitations } from '@/lib/account-invitation-service'
import type { UserRole } from '@/types/database'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const result = await listAccountInvitations({ actor: user })
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error, details: 'details' in result ? result.details : null }, { status: result.status })
  }

  return NextResponse.json({ ok: true, ...result.data })
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const reauthResponse = await ensureRecentReverification(user, {
    reason: 'account_invitation_create',
    nextPath: '/dashboard/staff',
  })
  if (reauthResponse) return reauthResponse

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ ok: false, error: 'invalid_payload' }, { status: 400 })
  }

  const result = await createAccountInvitation({
    actor: user,
    request,
    input: {
      fullName: typeof (body as Record<string, unknown>).fullName === 'string' ? (body as Record<string, string>).fullName : '',
      email: typeof (body as Record<string, unknown>).email === 'string' ? (body as Record<string, string>).email : '',
      phone: typeof (body as Record<string, unknown>).phone === 'string' ? (body as Record<string, string>).phone : null,
      targetRole: ((body as Record<string, unknown>).targetRole ?? '') as UserRole,
      regionId: typeof (body as Record<string, unknown>).regionId === 'string' ? (body as Record<string, string>).regionId : null,
      pharmacyId: typeof (body as Record<string, unknown>).pharmacyId === 'string' ? (body as Record<string, string>).pharmacyId : null,
      operationUnitId: typeof (body as Record<string, unknown>).operationUnitId === 'string' ? (body as Record<string, string>).operationUnitId : null,
    },
  })

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error, details: 'details' in result ? result.details : null }, { status: result.status })
  }

  return NextResponse.json({ ok: true, ...result.data })
}
