import { cookies } from 'next/headers'

import type { User, UserRole } from '@/types/database'
import { MOCK_USERS } from '@/lib/mock-data'
import { findAppUserByIdentity, findDemoUserByRole } from '@/lib/auth/user-bridge'

export type AuthMode = 'cognito' | 'mock'

const AUTH_MODE_COOKIE = 'auth_mode'
const ID_TOKEN_COOKIE = 'id_token'
const ACCESS_TOKEN_COOKIE = 'access_token'
const REFRESH_TOKEN_COOKIE = 'refresh_token'
const DEMO_SESSION_COOKIE = 'demo_session'

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
    const bridgedUser = await findDemoUserByRole(demoRole as UserRole).catch(() => null)
    if (bridgedUser) {
      return {
        ...bridgedUser,
        authMode: 'mock',
      }
    }

    const user = buildMockUser(demoRole as UserRole)
    if (user) return user
  }

  const idToken = cookieStore.get(ID_TOKEN_COOKIE)?.value
  if (!idToken) return null

  const payload = decodeJwtPayload(idToken)
  if (!payload) return null

  const cognitoSub = typeof payload.sub === 'string' ? payload.sub : null
  const email = typeof payload.email === 'string' ? payload.email : null

  const appUser = await findAppUserByIdentity({
    cognitoSub,
    email,
  })

  if (!appUser.user) return null

  return {
    ...appUser.user,
    authMode: 'cognito',
  }
}
