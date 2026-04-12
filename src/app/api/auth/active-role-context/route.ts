import { NextResponse } from 'next/server'

import { getAuthCookieNames, getCurrentUser } from '@/lib/auth'
import { getMockRoleAssignmentsByRole } from '@/lib/mock-role-contexts'

export async function POST(request: Request) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const assignmentId = body && typeof body === 'object' && typeof (body as Record<string, unknown>).assignmentId === 'string'
    ? (body as Record<string, string>).assignmentId
    : null

  if (!assignmentId) {
    return NextResponse.json({ ok: false, error: 'assignment_id_required' }, { status: 400 })
  }

  const assignments = getMockRoleAssignmentsByRole(user.role)
  const assignment = assignments.find((item) => item.id === assignmentId && item.is_active)

  if (!assignment) {
    return NextResponse.json({ ok: false, error: 'assignment_not_found' }, { status: 404 })
  }

  const { ACTIVE_ROLE_ASSIGNMENT_COOKIE } = getAuthCookieNames()
  const response = NextResponse.json({ ok: true, assignmentId })
  response.cookies.set(ACTIVE_ROLE_ASSIGNMENT_COOKIE, assignmentId, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12,
  })

  return response
}

export async function DELETE() {
  const { ACTIVE_ROLE_ASSIGNMENT_COOKIE } = getAuthCookieNames()
  const response = NextResponse.json({ ok: true })
  response.cookies.set(ACTIVE_ROLE_ASSIGNMENT_COOKIE, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  })

  return response
}
