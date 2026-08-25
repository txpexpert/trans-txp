// middleware.ts
// DÉSACTIVÉ TEMPORAIREMENT — l'ancienne version bloquait l'intégralité du site
// (boucle de redirection vers /abonnement-requis, profile toujours null).
// Le contrôle d'accès sera reconstruit sur dia_session / lib/userAuth.ts
// une fois FREE_PATHS et le mapping module confirmés.
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(_req: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [],
}
