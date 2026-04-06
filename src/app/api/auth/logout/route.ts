import { NextResponse } from 'next/server'

import { getAuthCookieNames } from '@/lib/auth'

export async function GET(request: Request) {
  const domain = process.env.COGNITO_DOMAIN
  const clientId = process.env.COGNITO_CLIENT_ID
  const logoutRedirectUri = process.env.COGNITO_LOGOUT_REDIRECT_URI ?? new URL('/', request.url).toString()

  const response = NextResponse.redirect(
    domain && clientId
      ? (() => {
          const cognitoLogout = new URL(`${domain}/logout`)
          cognitoLogout.searchParams.set('client_id', clientId)
          cognitoLogout.searchParams.set('logout_uri', logoutRedirectUri)
          return cognitoLogout
        })()
      : new URL('/', request.url)
  )

  const {
    AUTH_MODE_COOKIE,
    ID_TOKEN_COOKIE,
    ACCESS_TOKEN_COOKIE,
    REFRESH_TOKEN_COOKIE,
    DEMO_SESSION_COOKIE,
  } = getAuthCookieNames()

  response.cookies.delete(AUTH_MODE_COOKIE)
  response.cookies.delete(ID_TOKEN_COOKIE)
  response.cookies.delete(ACCESS_TOKEN_COOKIE)
  response.cookies.delete(REFRESH_TOKEN_COOKIE)
  response.cookies.delete(DEMO_SESSION_COOKIE)

  return response
}
