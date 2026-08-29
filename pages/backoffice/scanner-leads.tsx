// pages/backoffice/scanner-leads.tsx
// ============================================================
// Consultation des leads capturés par le "Scanner de vulnérabilité
// douanière" (hero de pages/index.tsx → pages/api/scanner-lead.ts).
//
// À la différence de certaines pages backoffice de ce dossier qui
// affichent des données d'exemple statiques (USERS en dur, etc.), cette
// page lit réellement la table Supabase 'scanner_leads' côté serveur
// (getServerSideProps), avec la clé de service — jamais exposée au
// navigateur — pour ne pas dépendre des règles RLS de la table.
//
// ⚠️ Nécessite que la migration de pages/api/scanner-lead.ts ait été
// exécutée (table 'scanner_leads') avant que cette page affiche quoi
// que ce soit d'autre qu'une liste vide.
// ============================================================

import { useState } from 'react'
import type { GetServerSideProps } from 'next'
import { createClient } from '@supabase/supabase-js'
import { requireAdminSSR } from '../../lib/adminAuth'
import BackofficeLayout from '../../components/BackofficeLayout'

type ScannerLead = {
  id: string
  prenom: string | null
  nom: string | null
  email: string
  fonction: string | null
  entreprise: string | null
  reponse_sh: string
  reponse_ale: string
  reponse_ctrl: string
  score: number
  statut: string
  created_at: string
}

// Libellés lisibles pour les clés de réponse brutes stockées en base
// (voir BAREME dans pages/api/scanner-lead.ts pour la correspondance).
const LABELS_SH: Record<string, string> = {
  habitude: 'Habitude / transitaire',
  cas_par_cas: 'Au cas par cas',
  registre_audite: 'Registre audité',
}
const LABELS_ALE: Record<string, string> = {
  sans_tracabilite: 'ALE sans traçabilité',
  documente: 'ALE documenté',
  non_concerne: 'Non concerné',
}
const LABELS_CTRL: Record<string, string> = {
  plusieurs_fois: 'Contrôlé plusieurs fois',
  une_fois: 'Contrôlé une fois',
  jamais: 'Jamais contrôlé',
}

function scoreBadge(score: number): string {
  if (score >= 66) return 'br' // rouge — risque critique
  if (score >= 34) return 'ba' // ambre — risque modéré
  return 'bg' // vert — risque maîtrisé
}

function scoreLabel(score: number): string {
  if (score >= 66) return 'Critique'
  if (score >= 34) return 'Modéré'
  return 'Maîtrisé'
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const authResult = await requireAdminSSR(context)
  if ('redirect' in authResult) return authResult

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  const { data, error } = await supabase
    .from('scanner_leads')
    .select('*')
    .order('created_at', { ascending: false })

  return {
    props: {
      leads: error ? [] : (data as ScannerLead[]),
      loadError: error ? error.message : null,
    },
  }
}

export default function BackofficeScannerLeads({
  leads,
  loadError,
}: {
  leads: ScannerLead[]
  loadError: string | null
}) {
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<ScannerLead | null>(null)

  const filtered = leads.filter((l) =>
    [l.prenom, l.nom, l.email, l.entreprise, l.fonction]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(q.toLowerCase())
  )

  const moyenne = leads.length
    ? Math.round(leads.reduce((sum, l) => sum + l.score, 0) / leads.length)
    : 0
  const critiques = leads.filter((l) => l.score >= 66).length

  return (
    <BackofficeLayout title="Leads Scanner">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: 'var(--bd)', marginBottom: 4 }}>
            Leads — Scanner de vulnérabilité
          </h1>
          <p style={{ fontSize: 13, color: 'var(--inkm)' }}>
            {leads.length} diagnostic{leads.length > 1 ? 's' : ''} soumis · score moyen {moyenne}/100 · {critiques} en zone critique
          </p>
        </div>
      </div>

      {loadError && (
        <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '.75rem 1rem', fontSize: 12.5, marginBottom: '1rem' }}>
          Erreur de chargement — la table <code>scanner_leads</code> existe-t-elle dans Supabase ? ({loadError})
        </div>
      )}

      <input
        className="search-input"
        style={{ marginBottom: '1rem' }}
        placeholder="Rechercher par nom, email, entreprise…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div style={{ display: 'flex', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Contact</th>
                <th>Entreprise</th>
                <th>Score</th>
                <th>Date</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr
                  key={l.id}
                  style={{ cursor: 'pointer', background: selected?.id === l.id ? 'var(--bl)' : '' }}
                  onClick={() => setSelected(l)}
                >
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{[l.prenom, l.nom].filter(Boolean).join(' ') || '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--inkm)' }}>{l.email}</div>
                  </td>
                  <td style={{ fontSize: 12 }}>
                    <div>{l.entreprise || '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--inkm)' }}>{l.fonction || ''}</div>
                  </td>
                  <td>
                    <span className={`badge ${scoreBadge(l.score)}`}>{l.score}/100 · {scoreLabel(l.score)}</span>
                  </td>
                  <td style={{ fontSize: 11.5, color: 'var(--inkm)' }}>
                    {new Date(l.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    <span className="badge ba">{l.statut}</span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--inkm)', padding: '2rem' }}>
                    Aucun lead {q ? 'ne correspond à cette recherche' : "n'a encore été capturé"}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {selected && (
          <div style={{ width: 300, flexShrink: 0, background: 'var(--white)', border: '.5px solid var(--rule)', padding: '1.5rem', height: 'fit-content' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, color: 'var(--bd)' }}>Détail du diagnostic</div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--inkm)' }} onClick={() => setSelected(null)}>✕</button>
            </div>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <span className={`badge ${scoreBadge(selected.score)}`} style={{ fontSize: 14, padding: '.4rem 1rem' }}>
                {selected.score}/100 · {scoreLabel(selected.score)}
              </span>
            </div>
            {[
              ['Nom', [selected.prenom, selected.nom].filter(Boolean).join(' ') || '—'],
              ['Email', selected.email],
              ['Fonction', selected.fonction || '—'],
              ['Entreprise', selected.entreprise || '—'],
              ['Validation codes SH', LABELS_SH[selected.reponse_sh] || selected.reponse_sh],
              ['Accords ALE', LABELS_ALE[selected.reponse_ale] || selected.reponse_ale],
              ['Contrôle a posteriori', LABELS_CTRL[selected.reponse_ctrl] || selected.reponse_ctrl],
              ['Soumis le', new Date(selected.created_at).toLocaleString('fr-FR')],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '.5px solid var(--rule)', fontSize: 12, gap: '.75rem' }}>
                <span style={{ color: 'var(--inkm)', flexShrink: 0 }}>{k}</span>
                <span style={{ color: 'var(--bd)', fontWeight: 500, textAlign: 'right' }}>{v}</span>
              </div>
            ))}
            <div style={{ marginTop: '1.25rem' }}>
              <a className="btn btn-outline" style={{ width: '100%', fontSize: 11, textAlign: 'center', display: 'block' }} href={`mailto:${selected.email}`}>
                Contacter par e-mail
              </a>
            </div>
          </div>
        )}
      </div>
    </BackofficeLayout>
  )
}
