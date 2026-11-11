// pages/api/verifier/[numero].ts — vérification publique d'un dossier défendable.
// Ne révèle que ce qui figure déjà sur le document (numéro, date, titulaire,
// produits, codes SH) et recalcule l'empreinte à partir de la copie conservée.
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { empreinte } from '../../../lib/dossiers'

// Limite simple en mémoire (par instance) : 30 vérifications par IP et par 10 minutes.
const vus = new Map<string, number[]>()
function tropDeDemandes(ip: string) {
  const t = Date.now(), l = (vus.get(ip) || []).filter(x => t - x < 600_000)
  l.push(t); vus.set(ip, l)
  return l.length > 30
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Méthode non autorisée' })
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'inconnu'
  if (tropDeDemandes(ip)) return res.status(429).json({ error: 'Trop de vérifications, réessayez plus tard.' })
  const numero = String(req.query.numero || '').toUpperCase().trim()
  if (!/^IXP-\d{8}-[A-Z0-9]{6}$/.test(numero)) return res.status(400).json({ error: 'Numéro de dossier invalide' })
  const { data: d } = await supabaseAdmin().from('dossiers')
    .select('numero, created_at, type, titre, operation, titulaire, fiches, empreinte, statut').eq('numero', numero).maybeSingle()
  if (!d) return res.status(404).json({ trouve: false })
  const recalcul = empreinte({ numero: d.numero, created_at: d.created_at, type: d.type, titre: d.titre, operation: d.operation, titulaire: d.titulaire, fiches: d.fiches })
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).json({
    trouve: true,
    numero: d.numero, emis_le: d.created_at, type: d.type, titre: d.titre, statut: d.statut,
    titulaire: d.titulaire?.raison_sociale || null,
    produits: (d.fiches || []).map((f: any) => ({ designation: f.designation, code_sh: f.code_sh })),
    empreinte: d.empreinte, integre: recalcul === d.empreinte,
  })
}
