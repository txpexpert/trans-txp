// pages/api/admin/export-ventes.ts
// ─────────────────────────────────────────────────────────────────────────────
// Journal des ventes pour la comptabilité — CSV (séparateur « ; », UTF-8 avec
// BOM, lisible directement dans Excel). GET ?annee=2027
// Une ligne par facture émise et par avoir (montants négatifs), dans l'ordre
// des numéros. Habilitation « voir_montants » (super : toujours).
// ─────────────────────────────────────────────────────────────────────────────
import type { NextApiRequest, NextApiResponse } from 'next'
import { getAdminSessionFromReq } from '../../../lib/adminAuth'
import { hasPermission } from '../../../lib/adminPermissions'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { fmtAbonne, fmtDocNumber } from '../../../lib/billing'
import { PLAN_LABEL } from '../../../lib/subscriptions'

const cell = (v: unknown) => {
  const s = v === null || v === undefined ? '' : String(v)
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
const num = (v: unknown) => (v === null || v === undefined ? '' : Number(v).toFixed(2).replace('.', ','))
const d = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('fr-FR', { timeZone: 'Africa/Casablanca' }) : '')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await getAdminSessionFromReq(req, 'gestion')
  if (!admin) return res.status(401).json({ error: 'Session administrateur expirée' })
  if (!hasPermission(admin, 'voir_montants')) return res.status(403).json({ error: 'Habilitation « voir les montants » requise' })

  const year = Number(req.query.annee) || new Date().getFullYear()
  const from = `${year}-01-01T00:00:00+01:00`, to = `${year + 1}-01-01T00:00:00+01:00`
  const sb = supabaseAdmin()
  const [inv, av] = await Promise.all([
    sb.from('invoices').select('*').eq('status', 'payee').gte('paid_at', from).lt('paid_at', to),
    sb.from('avoirs').select('*').gte('issued_at', from).lt('issued_at', to),
  ])
  if (inv.error || av.error) return res.status(500).json({ error: (inv.error || av.error)!.message })

  const rows: (string | number | null)[][] = []
  for (const i of inv.data || []) {
    const c = i.client_snapshot || {}
    rows.push(['Facture', i.invoice_number, d(i.issued_at || i.paid_at), fmtAbonne(i.numero_abonne), c.type_client || '',
      c.raison_sociale || c.nom || i.client_email, c.ice || '', `Abonnement ${PLAN_LABEL[i.plan_code] || i.plan_code} ${i.years} an(s)`,
      num(i.amount_ht), num(i.vat_rate), num(i.vat_amount), num(i.amount_ttc ?? i.amount),
      fmtDocNumber(i.payment_reference || i.proforma_number), d(i.period_start), d(i.period_end), d(i.paid_at), ''])
  }
  for (const a of av.data || []) {
    const c = a.client_snapshot || {}
    rows.push(['Avoir', a.avoir_number, d(a.issued_at), fmtAbonne(a.numero_abonne), c.type_client || '',
      c.raison_sociale || c.nom || '', c.ice || '', `Avoir sur ${a.invoice_number} — ${a.motif}`,
      num(-a.amount_ht), num(a.vat_rate), num(-a.vat_amount), num(-a.amount_ttc), a.invoice_number, '', '', '', a.resiliation ? 'résiliation' : ''])
  }
  rows.sort((x, y) => String(x[1]).localeCompare(String(y[1])))

  const head = ['Type', 'Numéro', 'Date', 'N° abonné', 'Type client', 'Client', 'ICE client', 'Désignation',
    'HT', 'Taux TVA', 'TVA', 'TTC', 'Pro-forma / facture d’origine', 'Début période', 'Fin période', 'Date paiement', 'Remarque']
  const csv = '﻿' + [head, ...rows].map(r => r.map(cell).join(';')).join('\r\n')
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="journal-ventes-${year}.csv"`)
  return res.status(200).send(csv)
}
