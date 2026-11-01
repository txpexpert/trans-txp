// lib/adminAuth.ts
// ─────────────────────────────────────────────────────────────────────────────
// Authentification des administrateurs — comptes nominatifs (2026-11-01).
//
// Deux sessions séparées, deux cookies :
//   • das_admin   — backoffice complet (/backoffice/*). Réservé au
//                   super-administrateur (type 1, compte maître unique).
//   • das_gestion — tableau de bord « Gestion des abonnements »
//                   (/gestion-abonnements). Administrateurs de type 2 ; le
//                   super-administrateur y accède aussi avec das_admin.
//
// Jeton signé HMAC : { aid, email, niveau, scope, sv, exp }. « sv » est la
// version de session du compte (colonne admin_accounts.session_id) : la
// suspension, la suppression ou le changement de mot de passe la renouvellent,
// ce qui invalide immédiatement toutes les sessions ouvertes de ce compte.
//
// Compatibilité : verifyToken(token) reste SYNCHRONE et renvoie un booléen,
// comme avant — il est utilisé tel quel par les routes existantes (ingestion,
// quick-add, import de circulaires, stats), qui ne sont pas modifiées. Il
// n'accepte que des jetons backoffice du super-administrateur ; comme ce
// compte ne peut être ni suspendu ni supprimé, la vérification de signature
// suffit pour ces routes.
// ─────────────────────────────────────────────────────────────────────────────
import crypto from 'crypto'
import type { GetServerSidePropsContext, NextApiRequest } from 'next'
import { supabaseAdmin } from './supabaseAdmin'
import { ALL_PERMISSIONS, type AdminCapabilities, type AdminNiveau, type PermissionCode } from './adminPermissions'

const SECRET = process.env.ADMIN_SECRET || 'fallback-dev-secret'
const TTL = parseInt(process.env.ADMIN_SESSION_TTL || '86400', 10)

export const COOKIE_NAME    = 'das_admin'
export const GESTION_COOKIE = 'das_gestion'

export type AdminScope = 'backoffice' | 'gestion'

interface AdminTokenPayload {
  aid:    string
  email:  string
  niveau: AdminNiveau
  scope:  AdminScope
  sv:     string
  exp:    number
}

// ── Jetons ───────────────────────────────────────────────────────────────────
export function createToken(p: Omit<AdminTokenPayload, 'exp'>): string {
  const payload = Buffer.from(JSON.stringify({ ...p, exp: Date.now() + TTL * 1000 })).toString('base64url')
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url')
  return payload + '.' + sig
}

export function readToken(token: string | undefined): AdminTokenPayload | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [payload, sig] = parts
  const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url')
  try {
    if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (!decoded?.aid || !decoded?.niveau || !decoded?.scope || Date.now() >= decoded.exp) return null
    return decoded as AdminTokenPayload
  } catch {
    return null
  }
}

/** Compatibilité routes existantes : jeton backoffice valide du super-administrateur. */
export function verifyToken(token: string | undefined): boolean {
  const p = readToken(token)
  return !!p && p.scope === 'backoffice' && p.niveau === 'super'
}

export function sessionCookie(name: string, token: string): string {
  return [
    `${name}=${token}`, `Max-Age=${TTL}`, 'Path=/', 'HttpOnly', 'SameSite=Lax',
    process.env.NODE_ENV === 'production' ? 'Secure' : '',
  ].filter(Boolean).join('; ')
}

export function clearCookie(name: string): string {
  return `${name}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`
}

export function parseCookie(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {}
  return Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const parts = c.trim().split('=')
      return [parts[0].trim(), parts.slice(1).join('=')]
    })
  )
}

// ── Mots de passe et liens à usage unique ────────────────────────────────────
export const MIN_PASSWORD_LENGTH = 10

export function newOneTimeToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(32).toString('base64url')
  return { token, hash: hashOneTimeToken(token) }
}

export function hashOneTimeToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function newSessionVersion(): string {
  return crypto.randomUUID()
}

export function siteUrl(req?: { headers: Record<string, any> }): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  const host = req?.headers?.host
  const proto = req?.headers?.['x-forwarded-proto'] || 'https'
  return host ? `${proto}://${host}` : ''
}

// ── Session vérifiée en base ─────────────────────────────────────────────────
export interface AdminSession extends AdminCapabilities {
  id:    string
  scope: AdminScope
}

async function sessionFromPayload(p: AdminTokenPayload | null): Promise<AdminSession | null> {
  if (!p) return null
  const { data } = await supabaseAdmin()
    .from('admin_accounts')
    .select('id, email, niveau, statut, permissions, session_id')
    .eq('id', p.aid)
    .maybeSingle()
  if (!data || data.statut !== 'actif' || data.session_id !== p.sv || data.niveau !== p.niveau) return null
  return {
    id: data.id,
    email: data.email,
    niveau: data.niveau,
    scope: p.scope,
    permissions: data.niveau === 'super' ? ALL_PERMISSIONS : (data.permissions || []) as PermissionCode[],
  }
}

/**
 * Session admin d'une requête.
 *   'backoffice' → uniquement le cookie das_admin du super-administrateur.
 *   'gestion'    → das_gestion (type 2), ou das_admin du super-administrateur.
 */
export async function getAdminSession(
  cookies: Record<string, string | undefined>,
  scope: AdminScope,
): Promise<AdminSession | null> {
  const bo = readToken(cookies[COOKIE_NAME])
  if (bo && bo.scope === 'backoffice' && bo.niveau === 'super') {
    const s = await sessionFromPayload(bo)
    if (s) return s
  }
  if (scope === 'gestion') {
    const g = readToken(cookies[GESTION_COOKIE])
    if (g && g.scope === 'gestion') return sessionFromPayload(g)
  }
  return null
}

export function getAdminSessionFromReq(req: NextApiRequest, scope: AdminScope) {
  return getAdminSession(req.cookies, scope)
}

// ── Gardes pour getServerSideProps ───────────────────────────────────────────
// Pages /backoffice/* : super-administrateur uniquement.
// Usage : export const getServerSideProps: GetServerSideProps = requireAdminSSR
export async function requireAdminSSR(context: GetServerSidePropsContext) {
  const session = await getAdminSession(parseCookie(context.req.headers.cookie), 'backoffice')
  if (!session) {
    return {
      redirect: {
        destination: `/backoffice?redirect=${encodeURIComponent(context.resolvedUrl)}`,
        permanent: false,
      },
    }
  }
  return { props: {} }
}

// Page « Gestion des abonnements » : type 2 ou super-administrateur.
export async function requireGestionSSR(context: GetServerSidePropsContext) {
  const session = await getAdminSession(parseCookie(context.req.headers.cookie), 'gestion')
  if (!session) {
    return { redirect: { destination: '/gestion-abonnements/connexion', permanent: false } }
  }
  const caps: AdminCapabilities = { email: session.email, niveau: session.niveau, permissions: session.permissions }
  return { props: { caps } }
}

// ── Variante : page backoffice qui charge ses données côté serveur ──────────
// Usage : export const getServerSideProps = withAdminData(async () => ({ rows: [...] }))
export function withAdminData<P extends object>(load: () => Promise<P>) {
  return async (context: GetServerSidePropsContext) => {
    const guard = await requireAdminSSR(context)
    if ('redirect' in guard) return guard
    try {
      return { props: await load() }
    } catch (e: any) {
      console.error('[backoffice] chargement :', e?.message || e)
      return { props: { loadError: e?.message || 'Chargement impossible' } as unknown as P }
    }
  }
}
