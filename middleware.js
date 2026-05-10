import { NextResponse } from 'next/server'

export function middleware(req) {
  const auth = req.cookies.get('mart_admin_auth')?.value
  const { pathname } = req.nextUrl

  const isPublic = pathname === '/login' || pathname === '/'

  if (!auth && !isPublic) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (auth && isPublic) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|public|favicon.ico).*)'],
}