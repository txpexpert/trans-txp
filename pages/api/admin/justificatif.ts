// pages/api/admin/justificatif.ts
// ─────────────────────────────────────────────────────────────────────────────
// Justificatifs de virement (bucket PRIVÉ « justificatifs »).
//   GET  ?id=<paiement_id> → redirection vers une URL signée (5 min)
//   POST multipart (invoiceId, montant, dateValeur, reference, file) →
//        l'administrateur joint un justificatif reçu par email ; le paiement
//        est enregistré « déclaré » (source manuel) puis validé comme les autres.
// Réservé aux administrateurs (backoffice ou « Gestion des abonnements ») ;
// le dépôt exige l'habilitation « valider_paiements ».
// ─────────────────────────────────────────────────────────────────────────────
import type { NextApiRequest, NextApiResponse } from 'next'
import { promises as fs } from 'fs'
import formidable, { File as FormFile } from 'formidable'
import { getAdminSessionFromReq } from '../../../lib/adminAuth'
import { can } from '../../../lib/adminPermissions'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export const config = { api: { bodyParser: false } }

const MIME: Record<string, string> = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await getAdminSessionFromReq(req, 'gestion')
  if (!admin) return res.status(401).json({ error: 'Session administrateur expirée' })
  const sb = supabaseAdmin()

  if (req.method === 'GET') {
    const id = String(req.query.id || '')
    const { data: p } = await sb.from('paiements').select('justificatif_path').eq('id', id).maybeSingle()
    if (!p?.justificatif_path) return res.status(404).json({ error: 'Aucun justificatif' })
    const { data, error } = await sb.storage.from('justificatifs').createSignedUrl(p.justificatif_path, 300)
    if (error || !data?.signedUrl) return res.status(500).json({ error: error?.message || 'Lien indisponible' })
    res.setHeader('Cache-Control', 'no-store')
    return res.redirect(302, data.signedUrl)
  }

  if (req.method === 'POST') {
    if (!can(admin, 'confirm_payment')) return res.status(403).json({ error: 'Cette action ne fait pas partie de vos habilitations.' })
    let parsed: [any, any]
    try {
      parsed = (await formidable({ maxFiles: 1, maxFileSize: 5 * 1024 * 1024 }).parse(req)) as [any, any]
    } catch {
      return res.status(400).json({ error: 'Fichier refusé (5 Mo maximum).' })
    }
    const [fields, files] = parsed
    const one = (k: string): string => { const v: any = fields[k]; return String((Array.isArray(v) ? v[0] : v) ?? '') }
    const raw: any = files.file
    const file = (Array.isArray(raw) ? raw[0] : raw) as FormFile | undefined
    const montant = Number(one('montant').replace(',', '.').replace(/\s/g, ''))
    const dateValeur = one('dateValeur')
    if (!file || !MIME[file.mimetype || '']) return res.status(400).json({ error: 'Joindre un PDF, JPG ou PNG' })
    if (!Number.isFinite(montant) || montant <= 0) return res.status(400).json({ error: 'Montant invalide' })
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValeur)) return res.status(400).json({ error: 'Date invalide' })

    const { data: inv } = await sb.from('invoices').select('id, user_id, numero_abonne, payment_reference, status').eq('id', one('invoiceId')).maybeSingle()
    if (!inv || !inv.user_id) return res.status(404).json({ error: 'Pro-forma introuvable' })
    if (inv.status !== 'proforma_envoyee') return res.status(400).json({ error: 'Cette pro-forma n’est plus en attente' })

    const path = `${inv.numero_abonne}/${inv.payment_reference}-${Date.now()}.${MIME[file.mimetype!]}`
    const up = await sb.storage.from('justificatifs').upload(path, await fs.readFile(file.filepath), { contentType: file.mimetype || undefined })
    if (up.error) return res.status(500).json({ error: 'Envoi du fichier impossible : ' + up.error.message })

    const { data: p, error } = await sb.rpc('billing_declare_payment', {
      p_user_id: inv.user_id, p_invoice_id: inv.id, p_montant: montant, p_date_valeur: dateValeur,
      p_reference: one('reference').slice(0, 140), p_path: path, p_nom: (file.originalFilename || 'justificatif').slice(0, 140),
    })
    if (error) return res.status(400).json({ error: error.message })
    await sb.from('paiements').update({ source: 'manuel', declare_par: admin.email }).eq('id', (p as any).id)
    return res.status(200).json({ ok: true, paiement: p })
  }

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'Method not allowed' })
}
