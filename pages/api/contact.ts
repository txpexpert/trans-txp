// pages/api/contact.ts
// ============================================================
// Reçoit les demandes du formulaire "Contacter un expert" (conseil.tsx).
// Avant cette route, le bouton "Envoyer la demande" ne faisait que
// setSent(true) côté client — aucune donnée n'était jamais transmise.
//
// Persiste en base plutôt que d'envoyer un email directement : pas de
// service SMTP configuré dans ce projet à ce stade. Ysf consulte les
// demandes via une requête Supabase (ou une future page backoffice)
// plutôt que par email — à faire évoluer si un envoi email est voulu.
//
// ⚠️ Nécessite la table Supabase 'demandes_contact' — migration à
// exécuter avant mise en service (voir commentaire SQL en bas de fichier).
// ============================================================

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '../../lib/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' })

  const { nom, email, societe, service, urgence, msg, source } = req.body

  if (!nom || !email || !msg) {
    return res.status(400).json({ error: 'Nom, email et message requis' })
  }

  const { error } = await supabase.from('demandes_contact').insert({
    nom,
    email: email.toLowerCase(),
    societe: societe || null,
    service: service || null,
    urgence: urgence || 'normal',
    message: msg,
    source: source || 'conseil', // permet de distinguer conseil.tsx / contentieux.tsx / autres points d'entrée
    statut: 'nouvelle',
  })

  if (error) {
    return res.status(500).json({ error: "Erreur lors de l'enregistrement de la demande" })
  }

  // Prévenir l'équipe (si l'adresse d'alerte est configurée)
  if (process.env.BILLING_ADMIN_EMAIL) {
    const esc = (v: unknown) => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))
    await sendEmail({ to: process.env.BILLING_ADMIN_EMAIL, replyTo: String(email).toLowerCase(),
      subject: `Demande : ${service || source || 'contact'} (${nom})`,
      html: `<p><b>${esc(nom)}</b> · ${esc(email)}${societe ? ' · ' + esc(societe) : ''}</p><p>${esc(service || source)}</p><p style="white-space:pre-wrap">${esc(msg)}</p>` }).catch(() => {})
  }
  return res.status(200).json({ success: true })
}

/* Migration Supabase requise avant mise en service :

create table demandes_contact (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  email text not null,
  societe text,
  service text,
  urgence text default 'normal',
  message text not null,
  source text,
  statut text default 'nouvelle',
  created_at timestamptz default now()
);

*/
