import { NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip all API routes completely - no validation whatsoever
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }
  
  // Protected routes authentication (simple check)
  const protectedPaths = ['/dashboard', '/agreements', '/profile', '/statistics']
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))
  
  if (isProtectedPath) {
    // Accept both custom session cookie and NextAuth fallback tokens
    const sessionCookieNames = [
      'bindme_session',
      '__Secure-bindme_session',
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
    ]
    const hasSessionCookie = sessionCookieNames.some((name) => request.cookies.get(name)?.value)
    
    if (!hasSessionCookie) {
      console.log('[MIDDLEWARE] No session cookie found, redirecting to login')
      console.log('[MIDDLEWARE] Available cookies:', Array.from(request.cookies.getAll().map(c => c.name)))
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    console.log('[MIDDLEWARE] Session cookie found, allowing access')
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
