import { NextResponse } from 'next/server'

import type { CurrentUser } from '@/lib/auth'
import { requireRecentReverification } from '@/lib/auth'

export async function ensureRecentReverification(
  user: CurrentUser,
  options?: { reason?: string; nextPath?: string },
) {
  const ok = await requireRecentReverification(user)
  if (ok) return null

  return NextResponse.json(
    {
      ok: false,
      error: 'reauth_required',
      reason: options?.reason ?? 'high_risk_action',
      next: options?.nextPath ?? '/dashboard/account-security',
    },
    { status: 428 },
  )
}
