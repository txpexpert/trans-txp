// lib/appAccess.ts
// ─────────────────────────────────────────────────────────────────────────────
// Contrôle d'accès INDÉPENDANT pour l'espace mobile /app/*.
// N'utilise ni middleware.ts, ni moduleAccess.ts, ni verifyUserTokenEdge —
// tout tourne en Node.js standard (getServerSideProps / API routes), jamais
// en Edge Runtime. Ce choix évite la classe de bugs rencontrée sur l'espace
// historique (/modules, /tools) où la vérification Edge pouvait diverger
// de l'état réel du compte, et où l'hydratation React côté client pouvait
// faire perdre le paramètre de redirection après connexion.
//
// Décision produit (2026-08-28) : l'accès mobile suit les plans existants
// du site desktop (Pro/Cabinet/Enterprise). Le plan Free n'a accès à aucun
// des modules de /app — il reste limité à Mondoscope ailleurs sur le site.
// ─────────────────────────────────────────────────────────────────────────────

import type { GetServerSidePropsContext } from 'next'
import type { NextApiRequest } from 'next'

export type AppPlan   = 'trial' | 'free' | 'pro' | 'cabinet' | 'enterprise'
export type AppStatut = 'trial' | 'active' | 'suspended' | 'expired' | 'pending'

export interface AppSession {
  email:     string
  role:      'admin' | 'user'
  plan:      AppPlan
  statut:    AppStatut
  trialEnds: number | null
}

// Matrice d'accès propre à /app — copie volontairement indépendante de
// lib/moduleAccess.ts pour ne jamais être affectée par un changement fait
// côté desktop, et vice versa.
const APP_MODULE_ACCESS: Record<AppPlan, string[]> = {
  trial: ['*'],
  free:  [], // Free → aucun module mobile, uniquement Mondoscope sur le site desktop
  pro: [
    'faq',
    'glossaire-douanier',
    'calc-conteneurs',
  ],
  cabinet: [
    'faq',
    'glossaire-douanier',
    'calc-conteneurs',
    'classement',
    'decisions-classement',
    'marquage-warnings',
    'substances-dangereuses',
    'calc-colis-sre',
  ],
  enterprise: ['*'],
}

export function canAccessAppModule(
  plan: AppPlan,
  statut: AppStatut,
  moduleCode: string,
  trialEnds?: number | null
): boolean {
  if (statut === 'suspended' || statut === 'expired') return false
  if (statut === 'trial' && trialEnds && Date.now() > trialEnds) return false
  const perms = APP_MODULE_ACCESS[plan] ?? []
  if (perms.includes('*')) return true
  return perms.includes(moduleCode)
}

// ── Résolution de session — variante getServerSideProps (pages React) ────────
export async function getAppSession(context: GetServerSidePropsContext): Promise<AppSession | null> {
  return fetchSession(context.req.headers.cookie, context.req.headers.host, context.req.headers['x-forwarded-proto'])
}

// ── Résolution de session — variante API route (contenu HTML brut) ──────────
export async function getAppSessionFromReq(req: NextApiRequest): Promise<AppSession | null> {
  return fetchSession(req.headers.cookie, req.headers.host, req.headers['x-forwarded-proto'])
}

async function fetchSession(
  cookie: string | undefined,
  host: string | undefined,
  protoHeader: string | string[] | undefined
): Promise<AppSession | null> {
  try {
    const proto = (Array.isArray(protoHeader) ? protoHeader[0] : protoHeader) || 'https'
    const res = await fetch(`${proto}://${host}/api/auth/me`, {
      headers: { cookie: cookie || '' },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

// ── Helper pour getServerSideProps des pages React de /app ──────────────────
// Usage :
//   export const getServerSideProps: GetServerSideProps = async (context) => {
//     const result = await requireAppAccess(context, 'classement')
//     if ('redirect' in result) return result
//     return { props: {} }
//   }
export async function requireAppAccess(
  context: GetServerSidePropsContext,
  moduleCode: string
) {
  const session = await getAppSession(context)
  const allowed = session
    ? canAccessAppModule(session.plan, session.statut, moduleCode, session.trialEnds)
    : false

  if (!allowed) {
    return {
      redirect: {
        destination: `/app/login?redirect=${encodeURIComponent(context.resolvedUrl)}`,
        permanent: false,
      },
    } as const
  }

  return { session }
}
