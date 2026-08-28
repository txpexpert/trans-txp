// middleware.ts
// ─────────────────────────────────────────────────────────────────────────────
// Contrôle d'accès par plan/abonnement pour les pages du site.
// - FREE_PATHS (lib/routeAccess.ts) : toujours ouvertes, aucun compte requis.
// - /modules/* et /tools/*.html : accès vérifié via la matrice MODULE_ACCESS
//   (lib/moduleAccess.ts) selon le plan et le statut de l'utilisateur connecté.
// - /backoffice/* : exclu — déjà protégé indépendamment par requireAdminSSR
//   (lib/adminAuth.ts) au niveau de chaque page.
// - /api/* : exclu — chaque route API vérifie sa propre session en Node
//   runtime (verifyUserToken de lib/userAuth.ts) et répond en JSON plutôt
//   que par une redirection, qui n'a pas de sens pour un appel API.
// - /app/* : exclu — espace mobile indépendant (voir lib/appAccess.ts),
//   avec son propre contrôle d'accès en Node runtime, distinct de ce
//   middleware et de moduleAccess.ts (décision du 2026-08-28, suite à un
//   bug de redirection post-connexion resté non résolu sur mobile malgré
//   plusieurs correctifs sur ce système historique).
// - Tourne sur l'Edge Runtime : utilise lib/edgeAuth.ts (Web Crypto), jamais
//   lib/userAuth.ts (module Node 'crypto', indisponible en Edge).
// ─────────────────────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyUserTokenEdge } from './lib/edgeAuth'
import { FREE_PATHS, pathToModuleCode } from './lib/routeAccess'
import { canAccessModule } from './lib/moduleAccess'

const USER_COOKIE = 'dia_session' // dupliqué volontairement : évite d'importer moduleAccess pour une seule string

function redirectToAbonnementRequis(req: NextRequest, pathname: string) {
  const url = req.nextUrl.clone()
  url.pathname = '/abonnement-requis'
  url.search = ''
  url.searchParams.set('from', pathname)
  return NextResponse.redirect(url)
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname


  if (FREE_PATHS.includes(pathname)) return NextResponse.next()

  const token = req.cookies.get(USER_COOKIE)?.value
  const payload = await verifyUserTokenEdge(token)

  if (!payload) return redirectToAbonnementRequis(req, pathname)

  const moduleCode = pathToModuleCode(pathname)

  const allowed = moduleCode
    ? canAccessModule(payload.plan, payload.statut, moduleCode, payload.trialEnds)
    : payload.statut !== 'suspended' && payload.statut !== 'expired' // page hors matrice : compte actif suffit

  if (!allowed) return redirectToAbonnementRequis(req, pathname)

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api/|backoffice$|backoffice/|_next/static|_next/image|favicon.ico|manifest.json|icons/|sw.js|workbox-|app/).*)',
  ],
}
