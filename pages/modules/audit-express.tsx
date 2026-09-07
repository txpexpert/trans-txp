// pages/modules/audit-express.tsx
// ============================================================
// Version publique et gratuite de l'Audit Douanier — 6 questions
// clés extraites des 45 points de contrôle de lib/auditData.ts.
// Objectif : lead magnet. Le score est un indicateur préliminaire ;
// l'audit complet (45 items, rapport narratif) reste réservé aux
// abonnés via pages/modules/audit.tsx.
//
// ⚠️ Cette route doit être ajoutée à FREE_PATHS dans lib/routeAccess.ts
// pour rester accessible sans compte (voir middleware.ts).
// ============================================================

import { useState } from 'react'
import ModuleLayout from '../../components/ModuleLayout'
import { AUDIT_DOMAINS, type Answer, type CheckItem } from '../../lib/auditData'

// Même liste que MINI_AUDIT_IDS dans pages/api/audit-lead.ts — à garder synchronisée.
const MINI_AUDIT_IDS = ['1.2', '3.1', '4.1', '5.2', '7.1', '9.1']

function getMiniAuditItems(): Array<{ item: CheckItem; domainLabel: string; domainColor: string }> {
  const found: Array<{ item: CheckItem; domainLabel: string; domainColor: string }> = []
  for (const domain of AUDIT_DOMAINS) {
    for (const item of domain.items) {
      if (MINI_AUDIT_IDS.includes(item.id)) {
        found.push({ item, domainLabel: domain.label, domainColor: domain.color })
      }
    }
  }
  return MINI_AUDIT_IDS
    .map((id) => found.find((f) => f.item.id === id))
    .filter((f): f is { item: CheckItem; domainLabel: string; domainColor: string } => !!f)
}

const MINI_ITEMS = getMiniAuditItems()

function computePreviewScore(reponses: Record<string, Answer>): number | null {
  let total = 0, earned = 0, count = 0
  for (const { item } of MINI_ITEMS) {
    const ans = reponses[item.id]
    if (ans !== 'oui' && ans !== 'non' && ans !== 'partiel') continue
    count++
    total += item.poids
    if (ans === 'oui') earned += item.poids
    if (ans === 'partiel') earned += item.poids * 0.5
  }
  if (count === 0) return null
  return Math.round((earned / total) * 100)
}

type ApercuItem = { domaine: string; question: string; conseil: string }

export default function AuditExpressPage() {
  const [reponses, setReponses] = useState<Record<string, Answer>>({})
  const [showCapture, setShowCapture] = useState(false)
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [fonction, setFonction] = useState('')
  const [entreprise, setEntreprise] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ score: number; apercu: ApercuItem[] } | null>(null)
  const [errMsg, setErrMsg] = useState('')

  const totalAnswered = Object.values(reponses).filter((v) => v !== null && v !== undefined).length
  const previewScore = computePreviewScore(reponses)
  const allAnswered = totalAnswered === MINI_ITEMS.length

  function handleAnswer(id: string, val: Answer) {
    setReponses((prev) => ({ ...prev, [id]: prev[id] === val ? null : val }))
  }

  async function handleSubmit() {
    if (!email || !email.includes('@')) {
      setErrMsg('Merci de renseigner un e-mail professionnel valide.')
      return
    }
    setSending(true)
    setErrMsg('')
    try {
      const res = await fetch('/api/audit-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prenom, nom, email, fonction, entreprise, reponses }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrMsg(data.error || "L'envoi a échoué. Réessayez dans un instant.")
        setSending(false)
        return
      }
      setResult({ score: data.score, apercu: data.apercu || [] })
    } catch (e) {
      setErrMsg('Erreur réseau. Réessayez dans un instant.')
    } finally {
      setSending(false)
    }
  }

  const scoreColor = (s: number) => (s >= 80 ? '#166534' : s >= 50 ? '#92400E' : '#991B1B')
  const scoreLabel = (s: number) => (s >= 80 ? 'Conforme' : s >= 50 ? 'À améliorer' : 'Critique')

  return (
    <ModuleLayout
      kicker="AUDIT EXPRESS · GRATUIT"
      title="Auto-diagnostic douanier en 6 questions"
      sub="Un aperçu immédiat de votre conformité, extrait des 45 points de contrôle de l'Audit Douanier complet — réservé aux abonnés."
    >
      {!result ? (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: '1.5rem' }}>
            {MINI_ITEMS.map(({ item, domainLabel, domainColor }, i) => {
              const ans = reponses[item.id] ?? null
              return (
                <div
                  key={item.id}
                  style={{
                    border: '.5px solid var(--color-border-tertiary, #E4E2DA)',
                    borderLeft: `4px solid ${domainColor}`,
                    background: '#FFFFFF',
                    padding: '1rem 1.25rem',
                  }}
                >
                  <div style={{ fontSize: 9.5, letterSpacing: '.08em', color: domainColor, marginBottom: 6 }}>
                    {i + 1}/{MINI_ITEMS.length} · {domainLabel.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#1A1A18', marginBottom: 10, lineHeight: 1.5 }}>
                    {item.question}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {(['oui', 'partiel', 'non'] as Answer[]).map((v) => (
                      <button
                        key={v}
                        onClick={() => handleAnswer(item.id, v)}
                        style={{
                          padding: '6px 14px', fontSize: 11, cursor: 'pointer', letterSpacing: '.03em',
                          fontWeight: ans === v ? 700 : 400,
                          background: ans === v
                            ? v === 'oui' ? '#059669' : v === 'non' ? '#DC2626' : '#D97706'
                            : 'transparent',
                          color: ans === v ? 'white' : '#5A5A54',
                          border: `.5px solid ${v === 'oui' ? '#059669' : v === 'non' ? '#DC2626' : '#D97706'}`,
                          transition: 'all .12s',
                        }}
                      >
                        {v === 'oui' ? '✓ Oui' : v === 'non' ? '✗ Non' : '~ Partiel'}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {previewScore !== null && (
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: 11, color: '#8A8A82' }}>Score provisoire : </span>
              <span style={{ fontSize: 16, fontWeight: 700, color: scoreColor(previewScore) }}>
                {previewScore}% · {scoreLabel(previewScore)}
              </span>
            </div>
          )}

          {!showCapture ? (
            <button
              onClick={() => setShowCapture(true)}
              disabled={!allAnswered}
              style={{
                width: '100%', padding: '.9rem', fontSize: 13, fontWeight: 700, letterSpacing: '.03em',
                cursor: allAnswered ? 'pointer' : 'not-allowed',
                background: allAnswered ? '#1A1A18' : '#D0CEC4',
                color: 'white', border: 'none',
              }}
            >
              {allAnswered ? 'RECEVOIR MON SCORE ET MES RECOMMANDATIONS →' : `Répondez aux ${MINI_ITEMS.length - totalAnswered} question(s) restante(s)`}
            </button>
          ) : (
            <div style={{ border: '.5px solid var(--color-border-tertiary, #E4E2DA)', padding: '1.25rem', background: '#FFFFFF' }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <input placeholder="Prénom" value={prenom} onChange={(e) => setPrenom(e.target.value)}
                  style={{ flex: 1, padding: '.6rem .75rem', fontSize: 12.5, border: '.5px solid #D0CEC4' }} />
                <input placeholder="Nom" value={nom} onChange={(e) => setNom(e.target.value)}
                  style={{ flex: 1, padding: '.6rem .75rem', fontSize: 12.5, border: '.5px solid #D0CEC4' }} />
              </div>
              <input placeholder="E-mail professionnel" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '.6rem .75rem', fontSize: 12.5, border: '.5px solid #D0CEC4', marginBottom: 10 }} />
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <input placeholder="Fonction" value={fonction} onChange={(e) => setFonction(e.target.value)}
                  style={{ flex: 1, padding: '.6rem .75rem', fontSize: 12.5, border: '.5px solid #D0CEC4' }} />
                <input placeholder="Entreprise" value={entreprise} onChange={(e) => setEntreprise(e.target.value)}
                  style={{ flex: 1, padding: '.6rem .75rem', fontSize: 12.5, border: '.5px solid #D0CEC4' }} />
              </div>
              {errMsg && <div style={{ fontSize: 11.5, color: '#991B1B', marginBottom: 10 }}>{errMsg}</div>}
              <button
                onClick={handleSubmit}
                disabled={sending}
                style={{
                  width: '100%', padding: '.8rem', fontSize: 12.5, fontWeight: 700,
                  cursor: sending ? 'default' : 'pointer', background: '#1A1A18', color: 'white', border: 'none',
                  opacity: sending ? 0.6 : 1,
                }}
              >
                {sending ? 'ENVOI EN COURS...' : 'VOIR MON RÉSULTAT →'}
              </button>
            </div>
          )}
        </>
      ) : (
        <div>
          <div style={{ textAlign: 'center', padding: '1.5rem', background: '#F9F8F4', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: 10, letterSpacing: '.1em', color: '#8A8A82', marginBottom: 6 }}>
              VOTRE SCORE DE CONFORMITÉ PRÉLIMINAIRE
            </div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 48, fontWeight: 700, color: scoreColor(result.score) }}>
              {result.score}%
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: scoreColor(result.score) }}>
              {scoreLabel(result.score)}
            </div>
          </div>

          {result.apercu.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: 10, letterSpacing: '.08em', color: '#8A8A82', marginBottom: '.75rem' }}>
                APERÇU DE VOS POINTS DE VIGILANCE
              </div>
              {result.apercu.map((a, i) => (
                <div key={i} style={{ padding: '.9rem 1.1rem', marginBottom: 8, background: '#FFFBEB', borderLeft: '3px solid #D97706' }}>
                  <div style={{ fontSize: 9.5, color: '#92400E', letterSpacing: '.05em', marginBottom: 4 }}>{a.domaine.toUpperCase()}</div>
                  <div style={{ fontSize: 12.5, fontWeight: 500, color: '#1A1A18', marginBottom: 6 }}>{a.question}</div>
                  <div style={{ fontSize: 12, lineHeight: 1.6, color: '#5A5A54' }}>{a.conseil}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ padding: '1.5rem', background: '#1A1A18', color: 'white', textAlign: 'center' }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, marginBottom: 8 }}>
              Ce n'est qu'un aperçu sur 6 points de contrôle.
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', marginBottom: 14, lineHeight: 1.6 }}>
              L'Audit Douanier complet couvre 45 points sur 10 domaines, avec un rapport narratif détaillé et un plan d'action priorisé.
            </div>
            <a href="/abonnements" style={{
              display: 'inline-block', padding: '.75rem 1.5rem', background: '#B8922A', color: '#1A1A18',
              fontSize: 12, fontWeight: 700, letterSpacing: '.04em', textDecoration: 'none',
            }}>
              DÉCOUVRIR L'AUDIT COMPLET →
            </a>
          </div>
        </div>
      )}
    </ModuleLayout>
  )
}
