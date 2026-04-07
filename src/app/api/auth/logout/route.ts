import { NextResponse } from 'next/server'

import { getAuthCookieNames } from '@/lib/auth'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const domain = process.env.COGNITO_DOMAIN
  const clientId = process.env.COGNITO_CLIENT_ID
  const localLogoutRedirectUri = new URL('/login?logged_out=1', request.url).toString()
  const logoutRedirectUri = process.env.COGNITO_LOGOUT_REDIRECT_URI ?? localLogoutRedirectUri

  const response = NextResponse.redirect(
    domain && clientId
      ? (() => {
          const cognitoLogout = new URL(`${domain}/logout`)
          cognitoLogout.searchParams.set('client_id', clientId)
          cognitoLogout.searchParams.set('logout_uri', logoutRedirectUri)
          return cognitoLogout
        })()
      : new URL('/login?logged_out=1', request.url)
  )

  const {
    AUTH_MODE_COOKIE,
    ID_TOKEN_COOKIE,
    ACCESS_TOKEN_COOKIE,
    REFRESH_TOKEN_COOKIE,
    DEMO_SESSION_COOKIE,
  } = getAuthCookieNames()

  for (const cookieName of [AUTH_MODE_COOKIE, ID_TOKEN_COOKIE, ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, DEMO_SESSION_COOKIE]) {
    response.cookies.set(cookieName, '', {
      httpOnly: true,
      secure: requestUrl.protocol === 'https:',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    })
  }

  return response
}
