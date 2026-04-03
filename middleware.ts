import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const role = request.cookies.get('role')?.value
  const { pathname } = request.nextUrl

  // 1. Redirect unauthenticated users to login
  if (!token && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 2. Redirect authenticated users away from login
  if (token && pathname === '/login') {
    if (role === 'CHEF') return NextResponse.redirect(new URL('/kitchen', request.url))
    if (role === 'ADMIN') return NextResponse.redirect(new URL('/', request.url))
    return NextResponse.redirect(new URL('/pos', request.url))
  }

  // 3. Role-based access control
  if (token && role) {
    // Admin only pages
    const adminOnlyPaths = ['/staff', '/inventory', '/admin']
    if (adminOnlyPaths.some(path => pathname.startsWith(path)) && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Chef only pages
    if (pathname.startsWith('/kitchen') && !['CHEF', 'ADMIN'].includes(role)) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    
    // POS access
    if (pathname.startsWith('/pos') && !['WAITER', 'CASHIER', 'ADMIN'].includes(role)) {
        return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (backend handles its own auth)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|uploads|notification.mp3).*)',
  ],
}
