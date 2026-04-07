import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const domain = process.env.COGNITO_DOMAIN
  const clientId = process.env.COGNITO_CLIENT_ID
  const redirectUri = process.env.COGNITO_REDIRECT_URI

  if (!domain || !clientId || !redirectUri) {
    return NextResponse.redirect(new URL('/dashboard/account-security?passkey_error=missing_cognito_env', request.url))
  }

  const url = new URL(`${domain}/passkeys/add`)
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'openid email')
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('state', 'passkey_setup')

  return NextResponse.redirect(url)
}
