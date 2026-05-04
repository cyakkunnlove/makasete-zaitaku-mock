import { NextResponse } from 'next/server'

import { getAuthCookieNames } from '@/lib/auth'
import { OAUTH_STATE_COOKIE, parseOAuthState, sanitizeInternalPath } from '@/lib/auth/oauth-state'
import { attachCognitoSubToUser, findAppUserByIdentity, touchLastReverified } from '@/lib/auth/user-bridge'
import { listRoleContextsForUser } from '@/lib/repositories/role-contexts'
import { acceptInvitationByToken } from '@/lib/account-invitation-accept'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const state = parseOAuthState(requestUrl.searchParams.get('state'))
  const stateNonce = request.headers.get('cookie')
    ?.split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${OAUTH_STATE_COOKIE}=`))
    ?.slice(OAUTH_STATE_COOKIE.length + 1)

  const nextPath = sanitizeInternalPath(state?.nextPath, '/dashboard')
  const invitationToken = state?.invitationToken ?? null
  const isPasskeySetupFlow = state?.kind === 'passkey_setup'

  if (!state?.kind || !state?.nonce || !stateNonce || state.nonce !== decodeURIComponent(stateNonce)) {
    const invalidStateResponse = NextResponse.redirect(new URL('/login?error=invalid_state', request.url))
    invalidStateResponse.cookies.set(OAUTH_STATE_COOKIE, '', {
      httpOnly: true,
      secure: requestUrl.protocol === 'https:',
      sameSite: 'lax',
      path: '/api/auth/callback',
      maxAge: 0,
      expires: new Date(0),
    })
    return invalidStateResponse
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', request.url))
  }

  const domain = process.env.COGNITO_DOMAIN
  const clientId = process.env.COGNITO_CLIENT_ID
  const clientSecret = process.env.COGNITO_CLIENT_SECRET
  const redirectUri = process.env.COGNITO_REDIRECT_URI

  if (!domain || !clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(new URL('/login?error=missing_env', request.url))
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    code,
    redirect_uri: redirectUri,
  })

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const tokenResponse = await fetch(`${domain}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body,
    cache: 'no-store',
  })

  const tokenJson = await tokenResponse.json()

  if (!tokenResponse.ok) {
    return NextResponse.redirect(new URL('/login?error=token_exchange_failed', request.url))
  }

  const payload = (() => {
    try {
      const [, rawPayload] = String(tokenJson.id_token || '').split('.')
      return rawPayload ? JSON.parse(Buffer.from(rawPayload, 'base64url').toString('utf8')) : null
    } catch {
      return null
    }
  })()

  let matchedUserId: string | null = null
  let roleContextsCount = 0
  let defaultAssignmentId: string | null = null

  if (payload?.sub || payload?.email) {
    try {
      const matched = await findAppUserByIdentity({
        cognitoSub: payload?.sub ?? null,
        email: payload?.email ?? null,
      })

      if (!matched.user) {
        return NextResponse.redirect(new URL('/login?error=user_not_provisioned', request.url))
      }

      if (invitationToken && payload?.sub) {
        const acceptance = await acceptInvitationByToken({ token: invitationToken, cognitoSub: payload.sub })
        if (!acceptance.ok) {
          const failureTarget = new URL(`/invitations/accept?token=${encodeURIComponent(invitationToken)}&result=${encodeURIComponent(acceptance.error)}`, request.url)
          return NextResponse.redirect(failureTarget)
        }
      } else {
        if (!matched.user.is_active || matched.user.status !== 'active') {
          return NextResponse.redirect(new URL('/login?error=user_inactive', request.url))
        }

        if (matched.matchedBy === 'email' && payload?.sub && !matched.user.cognito_sub) {
          await attachCognitoSubToUser(matched.user.id, payload.sub)
        } else {
          await touchLastReverified(matched.user.id)
        }
      }

      matchedUserId = matched.user.id

      const roleContexts = await listRoleContextsForUser(matched.user.id)
      roleContextsCount = roleContexts.length
      defaultAssignmentId = roleContexts.find((item) => item.isDefault)?.assignmentId ?? roleContexts[0]?.assignmentId ?? null
    } catch {
      return NextResponse.redirect(new URL('/login?error=user_lookup_failed', request.url))
    }
  }

  const shouldForceChooser = !isPasskeySetupFlow && matchedUserId && roleContextsCount > 1 && (!nextPath || nextPath === '/dashboard')

  const redirectTarget = (() => {
    if (isPasskeySetupFlow) {
      const target = new URL('/dashboard/account-security?passkey=added', request.url)
      if (nextPath) {
        target.searchParams.set('next', nextPath)
      }
      return target
    }

    if (shouldForceChooser) {
      return new URL('/dashboard/role-chooser', request.url)
    }

    if (invitationToken) {
      return new URL(`/invitations/accept?token=${encodeURIComponent(invitationToken)}&result=accepted`, request.url)
    }

    return new URL(nextPath, request.url)
  })()

  const response = NextResponse.redirect(redirectTarget)
  const {
    AUTH_MODE_COOKIE,
    ID_TOKEN_COOKIE,
    ACCESS_TOKEN_COOKIE,
    REFRESH_TOKEN_COOKIE,
    DEMO_SESSION_COOKIE,
    ACTIVE_ROLE_ASSIGNMENT_COOKIE,
  } = getAuthCookieNames()

  response.cookies.delete(DEMO_SESSION_COOKIE)
  response.cookies.set(OAUTH_STATE_COOKIE, '', {
    httpOnly: true,
    secure: requestUrl.protocol === 'https:',
    sameSite: 'lax',
    path: '/api/auth/callback',
    maxAge: 0,
    expires: new Date(0),
  })
  if (shouldForceChooser) {
    response.cookies.delete(ACTIVE_ROLE_ASSIGNMENT_COOKIE)
  } else if (defaultAssignmentId) {
    response.cookies.set(ACTIVE_ROLE_ASSIGNMENT_COOKIE, defaultAssignmentId, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: tokenJson.expires_in,
    })
  }
  response.cookies.set(AUTH_MODE_COOKIE, 'cognito', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: tokenJson.expires_in,
  })
  response.cookies.set(ID_TOKEN_COOKIE, tokenJson.id_token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: tokenJson.expires_in,
  })
  response.cookies.set(ACCESS_TOKEN_COOKIE, tokenJson.access_token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: tokenJson.expires_in,
  })

  if (tokenJson.refresh_token) {
    response.cookies.set(REFRESH_TOKEN_COOKIE, tokenJson.refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })
  }

  return response
}
