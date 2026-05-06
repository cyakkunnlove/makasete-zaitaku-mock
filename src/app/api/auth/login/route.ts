import { NextResponse } from 'next/server'

import { createOAuthState, OAUTH_STATE_COOKIE, sanitizeInternalPath } from '@/lib/auth/oauth-state'

export async function GET(request: Request) {
  const domain = process.env.COGNITO_DOMAIN
  const clientId = process.env.COGNITO_CLIENT_ID
  const redirectUri = process.env.COGNITO_REDIRECT_URI

  if (!domain || !clientId || !redirectUri) {
    return NextResponse.json({ error: 'missing_cognito_env' }, { status: 500 })
  }

  const requestUrl = new URL(request.url)
  const nextPath = sanitizeInternalPath(requestUrl.searchParams.get('next'), '/dashboard')
  const invitationToken = requestUrl.searchParams.get('invitationToken')
  const nonce = crypto.randomUUID()

  const url = new URL(`${domain}/login`)
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'openid email')
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('lang', 'ja')
  url.searchParams.set('state', createOAuthState({ kind: 'login', nextPath, invitationToken, nonce }))

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
