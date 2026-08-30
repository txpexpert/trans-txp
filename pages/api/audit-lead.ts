// pages/api/audit-lead.ts
// ============================================================
// Reçoit les soumissions de l'"Audit Express" public
// (pages/modules/audit-express.tsx). Le client envoie uniquement
// les réponses (oui/non/partiel) aux 6 questions clés — jamais un
// score — recalculé ici, côté serveur, à partir de lib/auditData.ts
// pour éviter toute falsification depuis le navigateur.
//
// ⚠️ Nécessite la table Supabase 'audit_leads' — migration à
// exécuter avant mise en service (voir commentaire SQL en bas de fichier).
// ============================================================

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { AUDIT_DOMAINS, type Answer, type CheckItem } from '../../lib/auditData'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// Les 6 questions clés de l'Audit Express — identiques à celles affichées
// côté client (pages/modules/audit-express.tsx). Une seule source de vérité :
// les questions/conseils viennent toujours de lib/auditData.ts, jamais dupliqués ici.
export const MINI_AUDIT_IDS = ['1.2', '3.1', '4.1', '5.2', '7.1', '9.1']

function getMiniAuditItems(): Array<{ item: CheckItem; domainLabel: string }> {
  const found: Array<{ item: CheckItem; domainLabel: string }> = []
  for (const domain of AUDIT_DOMAINS) {
    for (const item of domain.items) {
      if (MINI_AUDIT_IDS.includes(item.id)) {
        found.push({ item, domainLabel: domain.label })
      }
    }
  }
  // Conserve l'ordre défini par MINI_AUDIT_IDS
  return MINI_AUDIT_IDS
    .map((id) => found.find((f) => f.item.id === id))
    .filter((f): f is { item: CheckItem; domainLabel: string } => !!f)
}

const RISQUE_ORDRE: Record<CheckItem['risque'], number> = { critique: 0, important: 1, normal: 2 }

function calculerScore(reponses: Record<string, Answer>): number | null {
  const items = getMiniAuditItems()
  let total = 0
  let earned = 0
  let count = 0

  for (const { item } of items) {
    const ans = reponses[item.id]
    if (ans !== 'oui' && ans !== 'non' && ans !== 'partiel') continue
    count++
    total += item.poids
    if (ans === 'oui') earned += item.poids
    if (ans === 'partiel') earned += item.poids * 0.5
  }

  if (count === 0 || total === 0) return null
  return Math.round((earned / total) * 100)
}

function getApercu(reponses: Record<string, Answer>) {
  const items = getMiniAuditItems()
  return items
    .filter(({ item }) => {
      const ans = reponses[item.id]
      return ans === 'non' || ans === 'partiel'
    })
    .sort((a, b) => RISQUE_ORDRE[a.item.risque] - RISQUE_ORDRE[b.item.risque])
    .slice(0, 2)
    .map(({ item, domainLabel }) => ({
      domaine: domainLabel,
      question: item.question,
      conseil: item.conseil,
    }))
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' })

  const { prenom, nom, email, fonction, entreprise, reponses } = req.body as {
    prenom?: string
    nom?: string
    email?: string
    fonction?: string
    entreprise?: string
    reponses?: Record<string, Answer>
  }

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'E-mail professionnel valide requis' })
  }
  if (!reponses || typeof reponses !== 'object') {
    return res.status(400).json({ error: 'Réponses manquantes' })
  }

  const score = calculerScore(reponses)
  if (score === null) {
    return res.status(400).json({ error: "Merci de répondre à au moins une question de l'audit express" })
  }

  const apercu = getApercu(reponses)

  const { error } = await supabase.from('audit_leads').insert({
    prenom: prenom || null,
    nom: nom || null,
    email: email.toLowerCase(),
    fonction: fonction || null,
    entreprise: entreprise || null,
    reponses,
    score,
    statut: 'nouveau',
  })

  if (error) {
    return res.status(500).json({ error: "Erreur lors de l'enregistrement de l'audit express" })
  }

  return res.status(200).json({ success: true, score, apercu })
}

/* Migration Supabase requise avant mise en service :

create table audit_leads (
  id uuid primary key default gen_random_uuid(),
  prenom text,
  nom text,
  email text not null,
  fonction text,
  entreprise text,
  reponses jsonb not null,
  score int not null,
  statut text default 'nouveau',
  created_at timestamptz default now()
);

*/
