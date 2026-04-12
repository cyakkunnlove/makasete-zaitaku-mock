import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { ensureRecentReverification } from '@/lib/api-reauth'
import { addRoleAssignmentsToExistingUser } from '@/lib/account-invitation-service'
import type { UserRole } from '@/types/database'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const reauthResponse = await ensureRecentReverification(user, {
    reason: 'managed_user_assignment_add',
    nextPath: '/dashboard/staff',
  })
  if (reauthResponse) return reauthResponse

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ ok: false, error: 'invalid_payload' }, { status: 400 })
  }

  const targetRole = ((body as Record<string, unknown>).targetRole ?? '') as UserRole
  const regionIds = Array.isArray((body as Record<string, unknown>).regionIds)
    ? ((body as Record<string, unknown>).regionIds as unknown[]).filter((value): value is string => typeof value === 'string')
    : []

  const result = await addRoleAssignmentsToExistingUser({
    actor: user,
    userId: params.id,
    targetRole,
    regionIds,
  })

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error, details: 'details' in result ? result.details : null }, { status: result.status })
  }

  return NextResponse.json({ ok: true, ...result.data })
}
