// pages/backoffice/audit-leads.tsx
// ============================================================
// Consultation des leads capturés par l'"Audit Express" public
// (pages/modules/audit-express.tsx → pages/api/audit-lead.ts).
// Même patron que pages/backoffice/scanner-leads.tsx : lecture
// directe de la table Supabase 'audit_leads' côté serveur
// (getServerSideProps) avec la clé de service.
//
// ⚠️ Nécessite que la migration de pages/api/audit-lead.ts ait été
// exécutée (table 'audit_leads') avant que cette page affiche quoi
// que ce soit d'autre qu'une liste vide.
// ============================================================

import { useState } from 'react'
import type { GetServerSideProps } from 'next'
import { createClient } from '@supabase/supabase-js'
import { requireAdminSSR } from '../../lib/adminAuth'
import BackofficeLayout from '../../components/BackofficeLayout'
import { AUDIT_DOMAINS, type Answer } from '../../lib/auditData'

type AuditLead = {
  id: string
  prenom: string | null
  nom: string | null
  email: string
  fonction: string | null
  entreprise: string | null
  reponses: Record<string, Answer>
  score: number
  statut: string
  created_at: string
}

// Libellés lisibles pour les 6 questions de l'Audit Express, dérivés
// directement de lib/auditData.ts — jamais dupliqués en dur ici.
const MINI_AUDIT_IDS = ['1.2', '3.1', '4.1', '5.2', '7.1', '9.1']
const MINI_QUESTIONS: Record<string, { label: string; domaine: string }> = (() => {
  const map: Record<string, { label: string; domaine: string }> = {}
  for (const domain of AUDIT_DOMAINS) {
    for (const item of domain.items) {
      if (MINI_AUDIT_IDS.includes(item.id)) {
        map[item.id] = { label: item.question, domaine: domain.label }
      }
    }
  }
  return map
})()

function scoreBadge(score: number): string {
  if (score >= 66) return 'br' // rouge — critique (échelle inversée volontaire : score haut = questions "non/partiel" fréquentes selon le barème utilisé côté client)
  if (score >= 34) return 'ba'
  return 'bg'
}
function scoreLabel(score: number): string {
  if (score >= 80) return 'Conforme'
  if (score >= 50) return 'À améliorer'
  return 'Critique'
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const authResult = await requireAdminSSR(context)
  if ('redirect' in authResult) return authResult

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  const { data, error } = await supabase
    .from('audit_leads')
    .select('*')
    .order('created_at', { ascending: false })

  return {
    props: {
      leads: error ? [] : (data as AuditLead[]),
      loadError: error ? error.message : null,
    },
  }
}

export default function BackofficeAuditLeads({
  leads,
  loadError,
}: {
  leads: AuditLead[]
  loadError: string | null
}) {
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<AuditLead | null>(null)

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
  const critiques = leads.filter((l) => l.score < 50).length

  return (
    <BackofficeLayout title="Leads Audit Express">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: 'var(--bd)', marginBottom: 4 }}>
            Leads — Audit Express
          </h1>
          <p style={{ fontSize: 13, color: 'var(--inkm)' }}>
            {leads.length} audit{leads.length > 1 ? 's' : ''} express soumis · score moyen {moyenne}% · {critiques} en zone critique
          </p>
        </div>
      </div>

      {loadError && (
        <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '.75rem 1rem', fontSize: 12.5, marginBottom: '1rem' }}>
          Erreur de chargement — la table <code>audit_leads</code> existe-t-elle dans Supabase ? ({loadError})
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
                    <span className={`badge ${scoreBadge(100 - l.score)}`}>{l.score}% · {scoreLabel(l.score)}</span>
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
          <div style={{ width: 320, flexShrink: 0, background: 'var(--white)', border: '.5px solid var(--rule)', padding: '1.5rem', height: 'fit-content' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, color: 'var(--bd)' }}>Détail de l'audit express</div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--inkm)' }} onClick={() => setSelected(null)}>✕</button>
            </div>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <span className={`badge ${scoreBadge(100 - selected.score)}`} style={{ fontSize: 14, padding: '.4rem 1rem' }}>
                {selected.score}% · {scoreLabel(selected.score)}
              </span>
            </div>
            {[
              ['Nom', [selected.prenom, selected.nom].filter(Boolean).join(' ') || '—'],
              ['Email', selected.email],
              ['Fonction', selected.fonction || '—'],
              ['Entreprise', selected.entreprise || '—'],
              ['Soumis le', new Date(selected.created_at).toLocaleString('fr-FR')],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '.5px solid var(--rule)', fontSize: 12, gap: '.75rem' }}>
                <span style={{ color: 'var(--inkm)', flexShrink: 0 }}>{k}</span>
                <span style={{ color: 'var(--bd)', fontWeight: 500, textAlign: 'right' }}>{v}</span>
              </div>
            ))}

            <div style={{ marginTop: '1rem' }}>
              <div style={{ fontSize: 10, letterSpacing: '.08em', color: 'var(--inkm)', marginBottom: 8 }}>RÉPONSES</div>
              {MINI_AUDIT_IDS.map((id) => {
                const ans = selected.reponses?.[id]
                const q = MINI_QUESTIONS[id]
                if (!q) return null
                return (
                  <div key={id} style={{ padding: '5px 0', borderBottom: '.5px solid var(--rule)', fontSize: 11.5 }}>
                    <div style={{ color: 'var(--inkm)', marginBottom: 2 }}>{q.domaine}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ color: 'var(--bd)' }}>{q.label}</span>
                      <span style={{ fontWeight: 700, flexShrink: 0 }}>
                        {ans === 'oui' ? '✓' : ans === 'non' ? '✗' : ans === 'partiel' ? '~' : '—'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

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
