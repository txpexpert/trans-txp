// pages/api/scanner-lead.ts
// ============================================================
// Reçoit les soumissions du "Scanner de vulnérabilité douanière"
// (hero de pages/index.tsx). Le client envoie uniquement les clés
// de réponse (ex. 'habitude', 'sans_tracabilite') — jamais les valeurs
// numériques brutes — donc le score est recalculé ici, côté serveur,
// pour éviter qu'un score falsifié soit injecté depuis le navigateur.
//
// ⚠️ Nécessite la table Supabase 'scanner_leads' — migration à
// exécuter avant mise en service (voir commentaire SQL en bas de fichier).
// ============================================================

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { generateScannerReport } from '../../lib/scannerReport'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// Barème identique à celui utilisé côté client pour l'aperçu visuel de la jauge
// (voir data-val des boutons .scan-opt dans pages/index.tsx).
const BAREME: Record<string, Record<string, number>> = {
  reponseSH: { habitude: 5, cas_par_cas: 3, registre_audite: 1 },
  reponseALE: { sans_tracabilite: 5, documente: 1, non_concerne: 0 },
  reponseCtrl: { plusieurs_fois: 5, une_fois: 3, jamais: 1 },
}

function calculerScore(reponseSH?: string, reponseALE?: string, reponseCtrl?: string) {
  const reponses: Array<[keyof typeof BAREME, string | undefined]> = [
    ['reponseSH', reponseSH],
    ['reponseALE', reponseALE],
    ['reponseCtrl', reponseCtrl],
  ]
  const valeurs = reponses
    .filter(([, val]) => val !== undefined && val !== null)
    .map(([champ, val]) => BAREME[champ][val as string])
    .filter((v) => v !== undefined)

  if (valeurs.length === 0) return null

  const somme = valeurs.reduce((a, b) => a + b, 0)
  const maxPossible = valeurs.length * 5
  return Math.round((somme / maxPossible) * 100)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' })

  const { prenom, nom, email, fonction, entreprise, reponseSH, reponseALE, reponseCtrl } = req.body

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'E-mail professionnel valide requis' })
  }
  if (!reponseSH || !reponseALE || !reponseCtrl) {
    return res.status(400).json({ error: 'Merci de répondre aux 3 questions du scanner' })
  }

  const score = calculerScore(reponseSH, reponseALE, reponseCtrl)
  if (score === null) {
    return res.status(400).json({ error: 'Réponses invalides' })
  }

  const { error } = await supabase.from('scanner_leads').insert({
    prenom: prenom || null,
    nom: nom || null,
    email: email.toLowerCase(),
    fonction: fonction || null,
    entreprise: entreprise || null,
    reponse_sh: reponseSH,
    reponse_ale: reponseALE,
    reponse_ctrl: reponseCtrl,
    score,
    statut: 'nouveau',
  })

  if (error) {
    return res.status(500).json({ error: "Erreur lors de l'enregistrement du diagnostic" })
  }

  const report = generateScannerReport(reponseSH, reponseALE, reponseCtrl, score)

  return res.status(200).json({ success: true, score, report })
}

/* Migration Supabase requise avant mise en service :

create table scanner_leads (
  id uuid primary key default gen_random_uuid(),
  prenom text,
  nom text,
  email text not null,
  fonction text,
  entreprise text,
  reponse_sh text not null,
  reponse_ale text not null,
  reponse_ctrl text not null,
  score int not null,
  statut text default 'nouveau',
  created_at timestamptz default now()
);

*/