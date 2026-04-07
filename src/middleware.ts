import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const hasCognitoSession = Boolean(request.cookies.get('id_token')?.value)
  const hasDemoSession = Boolean(request.cookies.get('demo_session')?.value)
  const isAuthenticated = hasCognitoSession || hasDemoSession

  if (!isAuthenticated && (pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding/:path*'],
}
