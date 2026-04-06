import { cookies } from 'next/headers'

import type { User, UserRole } from '@/types/database'
import { MOCK_USERS } from '@/lib/mock-data'
import { findAppUserByIdentity } from '@/lib/auth/user-bridge'

export type AuthMode = 'cognito' | 'mock'

const AUTH_MODE_COOKIE = 'auth_mode'
const ID_TOKEN_COOKIE = 'id_token'
const ACCESS_TOKEN_COOKIE = 'access_token'
const REFRESH_TOKEN_COOKIE = 'refresh_token'
const DEMO_SESSION_COOKIE = 'demo_session'

const EMAIL_ROLE_MAP: Record<string, UserRole> = {
  'admin@makasete.local': 'system_admin',
  'regional@makasete.local': 'regional_admin',
  'pharmacy-admin@makasete.local': 'pharmacy_admin',
  'staff@makasete.local': 'pharmacy_staff',
  'night@makasete.local': 'night_pharmacist',
}

type JwtPayload = {
  sub?: string
  email?: string
  name?: string
  'custom:role'?: string
  role?: string
  [key: string]: unknown
}

export type CurrentUser = User & {
  authMode: AuthMode
}

export function getAuthCookieNames() {
  return {
    AUTH_MODE_COOKIE,
    ID_TOKEN_COOKIE,
    ACCESS_TOKEN_COOKIE,
    REFRESH_TOKEN_COOKIE,
    DEMO_SESSION_COOKIE,
  }
}

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split('.')
    if (!payload) return null
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as JwtPayload
  } catch {
    return null
  }
}

function normalizeRole(value: unknown): UserRole | null {
  if (typeof value !== 'string') return null
  const roles: UserRole[] = [
    'system_admin',
    'regional_admin',
    'pharmacy_admin',
    'night_pharmacist',
    'pharmacy_staff',
  ]
  return roles.includes(value as UserRole) ? (value as UserRole) : null
}

function roleFromEmail(email?: string | null): UserRole {
  if (!email) return 'pharmacy_staff'
  return EMAIL_ROLE_MAP[email.toLowerCase()] ?? 'pharmacy_staff'
}

function buildCognitoUserFromPayload(payload: JwtPayload): CurrentUser {
  const email = typeof payload.email === 'string' ? payload.email : null
  const role =
    normalizeRole(payload['custom:role']) ??
    normalizeRole(payload.role) ??
    roleFromEmail(email)

  return {
    id: typeof payload.sub === 'string' ? payload.sub : 'cognito-user',
    organization_id: null,
    pharmacy_id: null,
    region_id: null,
    operation_unit_id: null,
    role,
    full_name:
      typeof payload.name === 'string'
        ? payload.name
        : email?.split('@')[0] ?? 'Cognito User',
    phone: null,
    email,
    line_user_id: null,
    is_active: true,
    created_at: '',
    updated_at: '',
    authMode: 'cognito',
  }
}

function buildMockUser(role: UserRole): CurrentUser | null {
  const mockUser = MOCK_USERS[role]
  if (!mockUser) return null
  return {
    ...mockUser,
    authMode: 'mock',
  }
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies()

  const demoRole = cookieStore.get(DEMO_SESSION_COOKIE)?.value
  if (demoRole) {
    const user = buildMockUser(demoRole as UserRole)
    if (user) return user
  }

  const idToken = cookieStore.get(ID_TOKEN_COOKIE)?.value
  if (!idToken) return null

  const payload = decodeJwtPayload(idToken)
  if (!payload) return null

  const cognitoUser = buildCognitoUserFromPayload(payload)
  const appUser = await findAppUserByIdentity({
    cognitoSub: cognitoUser.id,
    email: cognitoUser.email,
  })

  if (appUser.user) {
    return {
      ...appUser.user,
      authMode: 'cognito',
    }
  }

  return cognitoUser
}
