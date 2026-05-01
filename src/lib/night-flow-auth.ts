import { NextResponse } from 'next/server'

import { getCurrentActorRole } from '@/lib/active-role'
import { getCurrentUser } from '@/lib/auth'

export async function requireNightFlowActorRole() {
  const user = await getCurrentUser()
  if (!user) {
    return {
      user: null,
      actorRole: null,
      errorResponse: NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 }),
    }
  }

  const actorRole = getCurrentActorRole(user)
  if (!actorRole) {
    return {
      user: null,
      actorRole: null,
      errorResponse: NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 }),
    }
  }

  return { user, actorRole, errorResponse: null }
}
