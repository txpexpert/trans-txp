import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { resolveTier, FREE_PATHS } from './lib/access-control'

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  if (FREE_PATHS.includes(pathname)) return NextResponse.next()

  // TODO : remplacer par la vraie récupération du profil depuis la session Supabase
  const profile = null
  const tier = resolveTier(profile)

  if (tier === 'anonymous' || tier === 'expired') {
    const url = req.nextUrl.clone()
    url.pathname = '/abonnement-requis'
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}
