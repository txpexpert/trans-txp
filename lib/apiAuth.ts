// lib/apiAuth.ts
// ─────────────────────────────────────────────────────────────────────────────
// Vérification de session pour les routes API qui, jusqu'ici, ne
// vérifiaient AUCUNE session — malgré le commentaire de middleware.ts
// ("/api/* : exclu — chaque route API vérifie sa propre session en Node
// runtime"). Dans les faits, seules pages/api/auth/me.ts, chat-homepage.ts,
// conversations/*.ts et les 5 routes pages/api/app-content/*.ts (via
// lib/appAccess.ts) faisaient réellement cette vérification. Les 11 autres
// routes "protégées" (pages/api/calculs/*.ts, tarifs/*.ts, decisions/
// search.ts, ia/*.ts) répondaient à quiconque les appelait directement,
// sans compte ni abonnement — corrigé le 2026-09-21.
//
// Deux univers de session coexistent dans ce projet :
//  - Desktop (/modules/*, /tools/*.html) : cookie dia_session + userAuth.ts
//    + moduleAccess.ts — même logique que middleware.ts.
//  - Mobile /app/* : résolu via lib/appAccess.ts (fetch interne sur
//    /api/auth/me), matrice APP_MODULE_ACCESS indépendante.
// Ce fichier expose un point d'entrée pour chaque cas, plus un combiné
// pour les routes appelées à la fois par le desktop et par /app.
// ─────────────────────────────────────────────────────────────────────────────
import type { NextApiRequest } from 'next'
import { verifyUserToken, canAccessModule, USER_COOKIE } from './userAuth'
import { getAppSessionFromReq, canAccessAppModule } from './appAccess'

export type ModuleCheck =
  | { ok: true }
  | { ok: false; status: 401 | 403; error: string }

/** Session desktop (pages /modules/*, /tools/*.html) — même logique que middleware.ts. */
export function checkDesktopModuleAccess(req: NextApiRequest, moduleCode: string): ModuleCheck {
  const token = req.cookies?.[USER_COOKIE]
  const session = verifyUserToken(token)
  if (!session) return { ok: false, status: 401, error: 'Authentification requise' }
  if (!canAccessModule(session.plan, session.statut, moduleCode, session.trialEnds)) {
    return { ok: false, status: 403, error: 'Module non inclus dans votre abonnement' }
  }
  return { ok: true }
}

/** Session mobile /app/* — même logique qu'appAccess.ts (requireAppAccess). */
export async function checkAppModuleAccess(req: NextApiRequest, moduleCode: string): Promise<ModuleCheck> {
  const session = await getAppSessionFromReq(req)
  if (!session) return { ok: false, status: 401, error: 'Authentification requise' }
  if (!canAccessAppModule(session.plan, session.statut, moduleCode, session.trialEnds)) {
    return { ok: false, status: 403, error: 'Module non inclus dans votre abonnement' }
  }
  return { ok: true }
}

/**
 * Pour les routes partagées par le desktop ET /app (tarifs/search,
 * tarifs/stats, decisions/search) : autorise si l'une OU l'autre session
 * est valide et donne accès au module. Si les deux échouent, renvoie
 * l'erreur la plus informative (un 403 — session valide mais module non
 * inclus — prime sur un simple 401 "pas de session du tout").
 */
export async function checkAnyModuleAccess(req: NextApiRequest, moduleCode: string): Promise<ModuleCheck> {
  const desktop = checkDesktopModuleAccess(req, moduleCode)
  if (desktop.ok) return desktop
  const app = await checkAppModuleAccess(req, moduleCode)
  if (app.ok) return app
  return desktop.status === 403 ? desktop : app
}
