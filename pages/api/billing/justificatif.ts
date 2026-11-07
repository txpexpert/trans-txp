// pages/api/billing/justificatif.ts
// ─────────────────────────────────────────────────────────────────────────────
// Dépôt d'un justificatif de virement par le client (multipart/form-data) :
//   champs invoiceId, montant, dateValeur (AAAA-MM-JJ), reference ; fichier « file »
//   (PDF, JPG ou PNG, 5 Mo max).
// Le fichier va dans le bucket PRIVÉ Supabase « justificatifs » ; le paiement
// est enregistré « déclaré » (billing_declare_payment) et l'administrateur est
// prévenu par email. La validation reste manuelle, dans le backoffice, après
// vérification de la réception des fonds sur le compte.
// ─────────────────────────────────────────────────────────────────────────────
import type { NextApiRequest, NextApiResponse } from 'next'
import { promises as fs } from 'fs'
import formidable, { File as FormFile } from 'formidable'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { getBillingUser, loadSettings, emailAdminJustificatif } from '../../../lib/billingServer'
import { siteUrl } from '../../../lib/adminAuth'
import type { BillingDoc } from '../../../lib/billing'

export const config = { api: { bodyParser: false } }

const MIME: Record<string, string> = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }) }
  const user = await getBillingUser(req)
  if (!user) return res.status(401).json({ error: 'Session expirée : reconnectez-vous.' })

  let parsed: [any, any]
  try {
    const form = formidable({ maxFiles: 1, maxFileSize: 5 * 1024 * 1024 })
    parsed = (await form.parse(req)) as [any, any]
  } catch {
    return res.status(400).json({ error: 'Fichier refusé (5 Mo maximum).' })
  }
  const [fields, files] = parsed
  const one = (k: string): string => { const v: any = (fields as any)[k]; return String((Array.isArray(v) ? v[0] : v) ?? '') }
  const invoiceId  = one('invoiceId')
  const montant    = Number(String(one('montant')).replace(',', '.').replace(/\s/g, ''))
  const dateValeur = one('dateValeur')
  const reference  = one('reference').slice(0, 140)
  const rawFile: any = (files as any).file
  const file = (Array.isArray(rawFile) ? rawFile[0] : rawFile) as FormFile | undefined

  if (!invoiceId) return res.status(400).json({ error: 'Pro-forma manquante' })
  if (!Number.isFinite(montant) || montant <= 0) return res.status(400).json({ error: 'Montant viré invalide' })
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValeur)) return res.status(400).json({ error: 'Date du virement invalide' })
  if (!file) return res.status(400).json({ error: 'Joindre le justificatif (PDF, JPG ou PNG)' })
  const ext = MIME[file.mimetype || '']
  if (!ext) return res.status(400).json({ error: 'Format accepté : PDF, JPG ou PNG' })

  const sb = supabaseAdmin()
  const { data: inv } = await sb.from('invoices').select('*').eq('id', invoiceId).eq('user_id', user.id).maybeSingle()
  if (!inv) return res.status(404).json({ error: 'Pro-forma introuvable' })
  if (inv.status !== 'proforma_envoyee') return res.status(400).json({ error: 'Cette pro-forma n’est plus en attente de paiement' })

  const path = `${user.numero_abonne}/${inv.payment_reference || inv.id}-${Date.now()}.${ext}`
  const bytes = await fs.readFile(file.filepath)
  const up = await sb.storage.from('justificatifs').upload(path, bytes, { contentType: file.mimetype || undefined, upsert: false })
  if (up.error) {
    console.error('[billing/justificatif] upload', up.error)
    return res.status(500).json({ error: 'Envoi du fichier impossible, réessayez ou envoyez-le par email.' })
  }

  const { data: p, error } = await sb.rpc('billing_declare_payment', {
    p_user_id: user.id, p_invoice_id: inv.id, p_montant: montant, p_date_valeur: dateValeur,
    p_reference: reference, p_path: path, p_nom: (file.originalFilename || `justificatif.${ext}`).slice(0, 140),
  })
  if (error) return res.status(400).json({ error: error.message })

  try {
    const s = await loadSettings()
    await emailAdminJustificatif(inv as BillingDoc, user, montant, s, siteUrl(req))
  } catch (e) {
    console.error('[billing/justificatif] email admin', e)
  }

  const expected = Number(inv.amount_ttc ?? inv.amount)
  return res.status(200).json({
    ok: true, paiement: p,
    warning: Math.abs(expected - montant) > 0.001
      ? `Le montant déclaré (${montant} DH) ne correspond pas au montant attendu (${expected} DH TTC) : le paiement ne pourra pas être validé.`
      : undefined,
  })
}
