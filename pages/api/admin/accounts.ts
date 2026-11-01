/**
 * pages/api/admin/accounts.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Gestion des comptes administrateurs — RÉSERVÉ AU SUPER-ADMINISTRATEUR
 * (session backoffice das_admin du compte maître).
 *
 * GET  → liste des comptes (sans hash ni jeton)
 * POST { action, ... }
 *   create       { email, nom?, permissions[] } → type 2, invitation envoyée par email
 *   permissions  { id, permissions[] }          → habilitations d'un type 2
 *   activate     { id }                         → réactive un compte suspendu
 *   suspend      { id }                         → coupe l'accès immédiatement
 *   delete       { id, confirm }                → confirm = email du compte
 *   resend       { id }                         → nouveau lien d'invitation / de mot de passe
 *
 * Le compte maître (super) n'est jamais modifiable ici ; la base le protège
 * aussi (trigger protect_super_admin). Il n'existe qu'un seul super ; cette
 * route ne crée que des administrateurs de type 2.
 * Chaque création / suppression renvoie, en plus de l'email, le lien
 * d'invitation : le super-administrateur peut le transmettre lui-même si
 * l'email n'arrive pas.
 */
import type { NextApiRequest, NextApiResponse } from 'next'
import { getAdminSessionFromReq, newOneTimeToken, newSessionVersion, siteUrl } from '../../../lib/adminAuth'
import { ALL_PERMISSIONS, type PermissionCode } from '../../../lib/adminPermissions'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { sendAdminInviteEmail } from '../../../lib/email'

const COLUMNS = 'id, email, nom, niveau, statut, permissions, created_by, created_at, last_login_at, token_expires'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function cleanPermissions(input: unknown): PermissionCode[] {
  const arr = Array.isArray(input) ? input : []
  return ALL_PERMISSIONS.filter(p => arr.includes(p))
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const me = await getAdminSessionFromReq(req, 'backoffice')
  if (!me || me.niveau !== 'super') return res.status(403).json({ error: 'Réservé au super-administrateur.' })
  const sb = supabaseAdmin()

  if (req.method === 'GET') {
    const { data, error } = await sb.from('admin_accounts').select(COLUMNS)
      .order('niveau', { ascending: false }).order('created_at')
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ accounts: data })
  }

  if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return res.status(405).json({ error: 'Method not allowed' }) }

  const b = req.body || {}
  const inviteLink = async (id: string, email: string, nom: string | null, purpose: 'invitation' | 'reinitialisation') => {
    const { token, hash } = newOneTimeToken()
    await sb.from('admin_accounts').update({
      token_hash: hash, token_purpose: purpose,
      token_expires: new Date(Date.now() + 48 * 3600_000).toISOString(),
    }).eq('id', id)
    const url = `${siteUrl(req)}/gestion-abonnements/mot-de-passe?token=${token}`
    const sent = await sendAdminInviteEmail(email, nom || '', url)
    return { url, emailSent: sent.ok }
  }

  if (b.action === 'create') {
    const email = String(b.email || '').trim().toLowerCase()
    const nom = String(b.nom || '').trim().slice(0, 120) || null
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Adresse email invalide.' })
    const permissions = cleanPermissions(b.permissions)
    if (permissions.length === 0) return res.status(400).json({ error: 'Cochez au moins une habilitation.' })

    const { data: exists } = await sb.from('admin_accounts').select('id').eq('email', email).maybeSingle()
    if (exists) return res.status(409).json({ error: 'Cette adresse a déjà un accès administrateur.' })

    const { data: acc, error } = await sb.from('admin_accounts').insert({
      email, nom, niveau: 'gestionnaire', statut: 'invite', permissions, created_by: me.email,
    }).select(COLUMNS).single()
    if (error) return res.status(500).json({ error: error.message })

    const link = await inviteLink(acc.id, email, nom, 'invitation')
    return res.status(201).json({ ok: true, account: acc, inviteUrl: link.url, emailSent: link.emailSent })
  }

  const id = String(b.id || '')
  if (!id) return res.status(400).json({ error: 'Compte non précisé.' })
  const { data: target } = await sb.from('admin_accounts').select('id, email, nom, niveau, statut, password_hash').eq('id', id).maybeSingle()
  if (!target) return res.status(404).json({ error: 'Compte introuvable.' })
  if (target.niveau === 'super') return res.status(403).json({ error: 'Le compte maître ne peut pas être modifié ici.' })

  switch (b.action) {
    case 'permissions': {
      const permissions = cleanPermissions(b.permissions)
      if (permissions.length === 0) return res.status(400).json({ error: 'Cochez au moins une habilitation (ou suspendez le compte).' })
      const { error } = await sb.from('admin_accounts').update({ permissions }).eq('id', id)
      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ ok: true })
    }
    case 'suspend': {
      // Nouvelle version de session : toutes les sessions ouvertes tombent.
      const { error } = await sb.from('admin_accounts').update({ statut: 'suspendu', session_id: newSessionVersion() }).eq('id', id)
      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ ok: true })
    }
    case 'activate': {
      if (target.statut !== 'suspendu') return res.status(400).json({ error: 'Ce compte n’est pas suspendu.' })
      // Sans mot de passe, le compte redevient « invité » et doit utiliser un lien.
      const statut = target.password_hash ? 'actif' : 'invite'
      const { error } = await sb.from('admin_accounts').update({ statut, login_attempts: 0, locked_until: null }).eq('id', id)
      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ ok: true, statut })
    }
    case 'resend': {
      if (target.statut === 'suspendu') return res.status(400).json({ error: 'Réactivez d’abord le compte.' })
      const link = await inviteLink(id, target.email, target.nom, target.password_hash ? 'reinitialisation' : 'invitation')
      return res.status(200).json({ ok: true, inviteUrl: link.url, emailSent: link.emailSent })
    }
    case 'delete': {
      if (String(b.confirm || '').trim().toLowerCase() !== target.email) {
        return res.status(400).json({ error: `Confirmation incorrecte : saisir ${target.email}` })
      }
      const { error } = await sb.from('admin_accounts').delete().eq('id', id)
      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ ok: true })
    }
    default:
      return res.status(400).json({ error: 'Action inconnue.' })
  }
}
