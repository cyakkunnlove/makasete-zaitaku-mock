import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { getMockRoleAssignmentsByRole, toMockRoleContextViews } from '@/lib/mock-role-contexts'

export async function GET() {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const assignments = toMockRoleContextViews(getMockRoleAssignmentsByRole(user.role))

  return NextResponse.json({
    ok: true,
    assignments,
  })
}
