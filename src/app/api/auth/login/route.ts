import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const domain = process.env.COGNITO_DOMAIN
  const clientId = process.env.COGNITO_CLIENT_ID
  const redirectUri = process.env.COGNITO_REDIRECT_URI

  if (!domain || !clientId || !redirectUri) {
    return NextResponse.json({ error: 'missing_cognito_env' }, { status: 500 })
  }

  const requestUrl = new URL(request.url)
  const nextPath = requestUrl.searchParams.get('next') || '/dashboard'

  const url = new URL(`${domain}/login`)
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'openid email')
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('state', `login:${encodeURIComponent(nextPath)}`)

  return NextResponse.redirect(url)
}
