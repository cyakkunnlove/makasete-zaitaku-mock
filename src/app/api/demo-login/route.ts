import { NextResponse } from 'next/server'

import { getAuthCookieNames } from '@/lib/auth'
import type { UserRole } from '@/types/database'

const ROLES: UserRole[] = [
  'system_admin',
  'regional_admin',
  'pharmacy_admin',
  'pharmacy_staff',
  'night_pharmacist',
]

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const role = requestUrl.searchParams.get('role') as UserRole | null

  if (!role || !ROLES.includes(role)) {
    return NextResponse.redirect(new URL('/login?error=invalid_demo_role', request.url))
  }

  const response = NextResponse.redirect(new URL('/dashboard', request.url))
  const { AUTH_MODE_COOKIE, DEMO_SESSION_COOKIE, ID_TOKEN_COOKIE, ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, ACTIVE_ROLE_ASSIGNMENT_COOKIE } = getAuthCookieNames()

  response.cookies.set(AUTH_MODE_COOKIE, 'mock', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  })
  response.cookies.set(DEMO_SESSION_COOKIE, role, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  })
  response.cookies.delete(ID_TOKEN_COOKIE)
  response.cookies.delete(ACCESS_TOKEN_COOKIE)
  response.cookies.delete(REFRESH_TOKEN_COOKIE)
  response.cookies.delete(ACTIVE_ROLE_ASSIGNMENT_COOKIE)

  return response
}
