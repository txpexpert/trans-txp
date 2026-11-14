/**
 * pages/api/admin/acces-direct.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Tuile « Admin » de l'en-tête (2026-11-14).
 *
 * GET — ouvre le backoffice sans seconde saisie du mot de passe, à condition
 * que la session client en cours (cookie dia_session) appartienne à un compte
 * administrateur ET que le même email soit un super-administrateur actif dans
 * admin_accounts. Toute autre situation renvoie simplement vers l'écran de
 * connexion du backoffice, qui reste la voie normale.
 *
 * Contrôles :
 *   1. jeton client valide (signature + expiration) ;
 *   2. users.role ∈ {admin, generaladmin} et session non remplacée
 *      (current_session_id = sessionId du jeton) ;
 *   3. admin_accounts : même email, niveau 'super', statut 'actif', mot de
 *      passe déjà créé (session_id présent).
 * La version de session (sv) existante est réutilisée : les autres sessions
 * backoffice ouvertes ne sont pas invalidées.
 */
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { verifyUserToken, USER_COOKIE } from '../../../lib/userAuth'
import { COOKIE_NAME, createToken, sessionCookie } from '../../../lib/adminAuth'

const ROLES_ADMIN = ['admin', 'generaladmin']

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  res.setHeader('Cache-Control', 'no-store')

  const versConnexion = () => res.redirect(302, '/backoffice?redirect=%2Fbackoffice%2Fdashboard')

  const payload = verifyUserToken(req.cookies[USER_COOKIE])
  if (!payload) return versConnexion()

  const email = payload.email.toLowerCase()
  const sb = supabaseAdmin()

  const { data: u } = await sb.from('users')
    .select('role, current_session_id')
    .eq('email', email).maybeSingle()
  if (!u || !ROLES_ADMIN.includes(u.role || '')) return versConnexion()
  if (u.current_session_id && u.current_session_id !== payload.sessionId) return versConnexion()

  const { data: acc } = await sb.from('admin_accounts')
    .select('id, email, niveau, statut, session_id')
    .eq('email', email).maybeSingle()
  if (!acc || acc.niveau !== 'super' || acc.statut !== 'actif' || !acc.session_id) return versConnexion()

  const token = createToken({ aid: acc.id, email: acc.email, niveau: acc.niveau, scope: 'backoffice', sv: acc.session_id })
  res.setHeader('Set-Cookie', sessionCookie(COOKIE_NAME, token))
  return res.redirect(302, '/backoffice/dashboard')
}
