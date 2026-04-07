import { NextResponse } from 'next/server'

import { getAuthCookieNames } from '@/lib/auth'
import { attachCognitoSubToUser, findAppUserByIdentity, touchLastLogin } from '@/lib/auth/user-bridge'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const state = requestUrl.searchParams.get('state')
  const isPasskeySetupFlow = state === 'passkey_setup'

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

  if (payload?.sub || payload?.email) {
    try {
      const matched = await findAppUserByIdentity({
        cognitoSub: payload?.sub ?? null,
        email: payload?.email ?? null,
      })

      if (!matched.user) {
        return NextResponse.redirect(new URL('/login?error=user_not_provisioned', request.url))
      }

      if (!matched.user.is_active || matched.user.status !== 'active') {
        return NextResponse.redirect(new URL('/login?error=user_inactive', request.url))
      }

      if (matched.matchedBy === 'email' && payload?.sub && !matched.user.cognito_sub) {
        await attachCognitoSubToUser(matched.user.id, payload.sub)
      }

      await touchLastLogin(matched.user.id)
    } catch {
      return NextResponse.redirect(new URL('/login?error=user_lookup_failed', request.url))
    }
  }

  const redirectTarget = isPasskeySetupFlow
    ? new URL('/dashboard/account-security?passkey=added', request.url)
    : new URL('/dashboard', request.url)

  const response = NextResponse.redirect(redirectTarget)
  const {
    AUTH_MODE_COOKIE,
    ID_TOKEN_COOKIE,
    ACCESS_TOKEN_COOKIE,
    REFRESH_TOKEN_COOKIE,
    DEMO_SESSION_COOKIE,
  } = getAuthCookieNames()

  response.cookies.delete(DEMO_SESSION_COOKIE)
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
