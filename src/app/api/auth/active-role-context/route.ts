import { NextResponse } from 'next/server'

import { getAuthCookieNames, getCurrentUser } from '@/lib/auth'
import { getMockRoleAssignmentsByRole } from '@/lib/mock-role-contexts'
import { getRoleContextForUser } from '@/lib/repositories/role-contexts'
import { writeAuditLog } from '@/lib/audit-log'

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

  const dbAssignment = user.id
    ? await getRoleContextForUser(user.id, assignmentId)
    : null

  const assignments = user.authMode === 'mock' ? getMockRoleAssignmentsByRole(user.role) : []
  const assignment = dbAssignment ?? assignments.find((item) => item.id === assignmentId && item.is_active)

  if (!assignment) {
    return NextResponse.json({ ok: false, error: 'assignment_not_found' }, { status: 404 })
  }

  await writeAuditLog({
    user,
    action: 'role_context_selected',
    targetType: 'user_role_assignment',
    targetId: assignmentId,
    details: {
      selected_role: 'role' in assignment ? assignment.role : null,
      selected_pharmacy_id: 'pharmacyId' in assignment ? assignment.pharmacyId : ('pharmacy_id' in assignment ? assignment.pharmacy_id : null),
      selected_region_id: 'regionId' in assignment ? assignment.regionId : ('region_id' in assignment ? assignment.region_id : null),
      selected_operation_unit_id: 'operationUnitId' in assignment ? assignment.operationUnitId : ('operation_unit_id' in assignment ? assignment.operation_unit_id : null),
    },
  })

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
