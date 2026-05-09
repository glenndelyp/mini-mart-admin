// middleware.js (project root)
import { NextResponse } from 'next/server'

export function middleware(req) {
  const auth = req.cookies.get('mart_admin_auth')?.value
  const { pathname } = req.nextUrl

  const isPublic = pathname === '/login' || pathname === '/'

  // not logged in → send to login
  if (!auth && !isPublic) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // already logged in → skip login page
  if (auth && isPublic) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|public|favicon.ico).*)'],
}