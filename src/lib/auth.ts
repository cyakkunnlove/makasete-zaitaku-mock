import { cookies } from 'next/headers'

import type { User, UserRole } from '@/types/database'
import { MOCK_USERS } from '@/lib/mock-data'
import { findAppUserByIdentity, findDemoUserByRole } from '@/lib/auth/user-bridge'
import { getMockActiveRoleContext, type MockRoleContextView } from '@/lib/mock-role-contexts'
import { getRoleContextForUser, listRoleContextsForUser } from '@/lib/repositories/role-contexts'

export type AuthMode = 'cognito' | 'mock'

const AUTH_MODE_COOKIE = 'auth_mode'
const ID_TOKEN_COOKIE = 'id_token'
const ACCESS_TOKEN_COOKIE = 'access_token'
const REFRESH_TOKEN_COOKIE = 'refresh_token'
const DEMO_SESSION_COOKIE = 'demo_session'
const ACTIVE_ROLE_ASSIGNMENT_COOKIE = 'active_role_assignment_id'

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
  requiresReverification: boolean
  activeRoleContext: MockRoleContextView | null
}

export function getAuthCookieNames() {
  return {
    AUTH_MODE_COOKIE,
    ID_TOKEN_COOKIE,
    ACCESS_TOKEN_COOKIE,
    REFRESH_TOKEN_COOKIE,
    DEMO_SESSION_COOKIE,
    ACTIVE_ROLE_ASSIGNMENT_COOKIE,
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

const REVERIFICATION_WINDOW_MS = 12 * 60 * 60 * 1000

export function isReverificationRequired(lastReverifiedAt: string | null | undefined) {
  if (!lastReverifiedAt) return true

  const timestamp = new Date(lastReverifiedAt).getTime()
  if (Number.isNaN(timestamp)) return true

  return Date.now() - timestamp > REVERIFICATION_WINDOW_MS
}

function buildMockUser(role: UserRole, assignmentId?: string | null): CurrentUser | null {
  const mockUser = MOCK_USERS[role]
  if (!mockUser) return null
  return {
    ...mockUser,
    last_reverified_at: mockUser.last_reverified_at ?? mockUser.last_login_at ?? null,
    authMode: 'mock',
    requiresReverification: false,
    activeRoleContext: getMockActiveRoleContext(role, assignmentId),
  }
}

export async function requireRecentReverification(user: Pick<CurrentUser, 'authMode' | 'last_reverified_at'>) {
  return user.authMode !== 'cognito' || !isReverificationRequired(user.last_reverified_at)
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies()

  const demoRole = cookieStore.get(DEMO_SESSION_COOKIE)?.value
  const activeRoleAssignmentId = cookieStore.get(ACTIVE_ROLE_ASSIGNMENT_COOKIE)?.value ?? null
  if (demoRole) {
    const bridgedUser = await findDemoUserByRole(demoRole as UserRole).catch(() => null)
    if (bridgedUser) {
      return {
        ...bridgedUser,
        authMode: 'mock',
        requiresReverification: false,
        activeRoleContext: getMockActiveRoleContext(bridgedUser.role, activeRoleAssignmentId),
      }
    }

    const user = buildMockUser(demoRole as UserRole, activeRoleAssignmentId)
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

  let activeRoleContext: MockRoleContextView | null = null
  if (appUser.user.id) {
    if (activeRoleAssignmentId) {
      activeRoleContext = await getRoleContextForUser(appUser.user.id, activeRoleAssignmentId)
    }
    if (!activeRoleContext) {
      const contexts = await listRoleContextsForUser(appUser.user.id)
      activeRoleContext = contexts.find((item) => item.isDefault) ?? contexts[0] ?? null
    }
  }

  return {
    ...appUser.user,
    authMode: 'cognito',
    requiresReverification: isReverificationRequired(appUser.user.last_reverified_at),
    activeRoleContext,
  }
}
