import { NextResponse } from 'next/server'

import { createOAuthState, OAUTH_STATE_COOKIE, sanitizeInternalPath } from '@/lib/auth/oauth-state'

export async function GET(request: Request) {
  const domain = process.env.COGNITO_DOMAIN
  const clientId = process.env.COGNITO_CLIENT_ID
  const redirectUri = process.env.COGNITO_REDIRECT_URI
  const requestUrl = new URL(request.url)
  const nextPath = sanitizeInternalPath(requestUrl.searchParams.get('next'), '/dashboard/account-security')
  const nonce = crypto.randomUUID()

  if (!domain || !clientId || !redirectUri) {
    return NextResponse.redirect(new URL('/dashboard/account-security?passkey_error=missing_cognito_env', request.url))
  }

  const url = new URL(`${domain}/passkeys/add`)
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'openid email')
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('state', createOAuthState({ kind: 'passkey_setup', nextPath, nonce }))

  const response = NextResponse.redirect(url)
  response.cookies.set(OAUTH_STATE_COOKIE, nonce, {
    httpOnly: true,
    secure: requestUrl.protocol === 'https:',
    sameSite: 'lax',
    path: '/api/auth/callback',
    maxAge: 10 * 60,
  })

  return response
}
