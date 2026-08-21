// pages/modules/audit.tsx
// Module Audit Douanier
// Tableau de bord + radar + 10 domaines + checklists interactives

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import ModuleLayout from '../../components/ModuleLayout'
import {
  AUDIT_DOMAINS, computeDomainScore, computeGlobalScore,
  getScoreLevel, type Answer, type AuditDomain
} from '../../lib/auditData'

// ── Radar SVG ─────────────────────────────────────────────────────────────────

function RadarChart({ scores }: { scores: Record<number, number> }) {
  const cx = 160, cy = 160, r = 120
  const n = AUDIT_DOMAINS.length
  const labels = AUDIT_DOMAINS.map(d => ({ short: d.label.split(' ').slice(0,2).join(' '), full: d.label }))

  function polarToXY(angle: number, radius: number) {
    const a = (angle - 90) * Math.PI / 180
    return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) }
  }

  // Grid circles
  const grids = [25, 50, 75, 100]

  // Score polygon
  const scorePoints = AUDIT_DOMAINS.map((d, i) => {
    const angle = (i / n) * 360
    const pct = (scores[d.id] ?? 0) / 100
    return polarToXY(angle, r * pct)
  })
  const scoreD = scorePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'

  return (
    <svg viewBox="0 0 320 320" width="100%" style={{ maxWidth: 280, display: 'block', margin: '0 auto' }}>
      {/* Grid */}
      {grids.map(g => {
        const pts = AUDIT_DOMAINS.map((_, i) => {
          const p = polarToXY((i / n) * 360, r * g / 100)
          return `${p.x},${p.y}`
        }).join(' ')
        return <polygon key={g} points={pts} fill="none" stroke="var(--color-border-tertiary)" strokeWidth="0.5" />
      })}

      {/* Axes */}
      {AUDIT_DOMAINS.map((_, i) => {
        const end = polarToXY((i / n) * 360, r)
        return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="var(--color-border-tertiary)" strokeWidth="0.5" />
      })}

      {/* Score polygon */}
      <path d={scoreD} fill="#2563EB" fillOpacity="0.15" stroke="#2563EB" strokeWidth="1.5" />

      {/* Score dots */}
      {scorePoints.map((p, i) => {
        const s = scores[AUDIT_DOMAINS[i].id] ?? 0
        const col = s >= 80 ? '#059669' : s >= 50 ? '#D97706' : '#DC2626'
        return <circle key={i} cx={p.x} cy={p.y} r="4" fill={col} stroke="white" strokeWidth="1" />
      })}

      {/* Labels */}
      {AUDIT_DOMAINS.map((d, i) => {
        const angle = (i / n) * 360
        const pos = polarToXY(angle, r + 22)
        const anchor = pos.x < cx - 5 ? 'end' : pos.x > cx + 5 ? 'start' : 'middle'
        const short = d.label.split(' ').slice(0, 2).join(' ')
        return (
          <text key={i} x={pos.x} y={pos.y} textAnchor={anchor} dominantBaseline="central"
            style={{ fontSize: 9, fill: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)' }}>
            {short}
          </text>
        )
      })}

      {/* Grid labels */}
      {[50, 100].map(g => (
        <text key={g} x={cx + 3} y={cy - r * g / 100}
          style={{ fontSize: 8, fill: 'var(--color-text-tertiary)', fontFamily: 'var(--font-sans)' }}>
          {g}%
        </text>
      ))}
    </svg>
  )
}

// ── Composant domaine card ────────────────────────────────────────────────────

function DomainCard({ domain, score, onSelect, active }: {
  domain: AuditDomain
  score: number
  onSelect: () => void
  active: boolean
}) {
  const level = getScoreLevel(score)
  const answered = Object.values({}).length

  return (
    <button onClick={onSelect} style={{
      width: '100%', textAlign: 'left', cursor: 'pointer',
      padding: '1rem', background: active ? domain.light : 'var(--color-background-primary)',
      border: active ? `1.5px solid ${domain.color}` : `.5px solid var(--color-border-tertiary)`,
      borderLeft: `4px solid ${domain.color}`,
      transition: 'all .15s', display: 'flex', gap: '1rem', alignItems: 'center',
    }}>
      <span style={{ fontSize: 20, flexShrink: 0, opacity: .8 }}>{domain.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 4 }}>
          {domain.label}
        </div>
        {/* Progress bar */}
        <div style={{ height: 4, background: 'var(--color-border-tertiary)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${score}%`, height: '100%', background: domain.color, transition: 'width .4s' }} />
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: domain.color }}>{score}%</div>
        <div style={{ fontSize: 10, padding: '1px 6px', ...{ background: level.bg, color: level.color } }}>
          {level.label}
        </div>
      </div>
    </button>
  )
}

// ── Composant checklist ───────────────────────────────────────────────────────

function ChecklistPanel({ domain, answers, onAnswer, onClose }: {
  domain: AuditDomain
  answers: Record<string, Answer>
  onAnswer: (id: string, val: Answer) => void
  onClose: () => void
}) {
  const score = computeDomainScore(domain, answers)
  const level = getScoreLevel(score)
  const total = domain.items.length
  const done = domain.items.filter(item => answers[item.id] !== null && answers[item.id] !== undefined).length

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)',
      zIndex: 300, display: 'flex', alignItems: 'flex-start',
      justifyContent: 'flex-end', overflowY: 'auto', padding: '1rem',
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        width: 600, maxHeight: '95vh', overflowY: 'auto',
        background: '#FFFFFF',
        boxShadow: '0 8px 40px rgba(0,0,0,.35)', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ background: domain.color, padding: '1.25rem 1.5rem', position: 'sticky', top: 0, zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20, opacity: .9 }}>{domain.icon}</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>{domain.label}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.7)' }}>{domain.description}</div>
              </div>
            </div>
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,.2)', border: 'none', color: 'white',
              width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', fontSize: 14
            }}>✕</button>
          </div>
          {/* Progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,.3)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${(done / total) * 100}%`, height: '100%', background: 'white', transition: 'width .3s' }} />
            </div>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,.8)', flexShrink: 0 }}>
              {done}/{total} répondus · Score {score}%
            </span>
            <span style={{ fontSize: 10, padding: '1px 7px', background: level.bg, color: level.color, flexShrink: 0 }}>
              {level.label}
            </span>
          </div>
        </div>

        {/* Items */}
        <div style={{ padding: '1rem', flex: 1 }}>
          {domain.items.map((item, i) => {
            const ans = answers[item.id] ?? null
            const showConseils = ans === 'non' || ans === 'partiel'
            const risqueColors = {
              critique:  { dot: '#DC2626', bg: '#FEE2E2' },
              important: { dot: '#D97706', bg: '#FEF3C7' },
              normal:    { dot: '#059669', bg: '#DCFCE7' },
            }
            const rc = risqueColors[item.risque]

            return (
              <div key={item.id} style={{
                marginBottom: '.875rem', border: `.5px solid #E2E8F0`,
                borderLeft: ans === 'oui' ? '3px solid #059669' :
                            ans === 'non' ? '3px solid #DC2626' :
                            ans === 'partiel' ? '3px solid #D97706' : `3px solid #CBD5E1`,
                background: ans === 'oui' ? '#F0FDF4' :
                            ans === 'non' ? '#FFF5F5' :
                            ans === 'partiel' ? '#FFFBEB' : '#FFFFFF',
                transition: 'all .15s',
              }}>
                <div style={{ padding: '.875rem 1rem' }}>
                  {/* Question */}
                  <div style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start', marginBottom: '.75rem' }}>
                    <div style={{
                      width: 7, height: 7, borderRadius: '50%', background: rc.dot,
                      marginTop: 5, flexShrink: 0
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)', lineHeight: 1.6, marginBottom: 2 }}>
                        {item.question}
                      </div>
                      {item.reference && (
                        <span style={{ fontSize: 10, color: domain.color, opacity: .7 }}>
                          Réf. FAQ {item.reference}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                      {(['oui', 'partiel', 'non'] as Answer[]).map(v => (
                        <button key={v} onClick={() => onAnswer(item.id, ans === v ? null : v)} style={{
                          padding: '3px 10px', fontSize: 10, cursor: 'pointer', letterSpacing: '.04em',
                          fontWeight: ans === v ? 700 : 400,
                          background: ans === v
                            ? v === 'oui' ? '#059669' : v === 'non' ? '#DC2626' : '#D97706'
                            : 'transparent',
                          color: ans === v ? 'white' : 'var(--color-text-secondary)',
                          border: `.5px solid ${
                            v === 'oui' ? '#059669' : v === 'non' ? '#DC2626' : '#D97706'
                          }`,
                          transition: 'all .12s',
                        }}>
                          {v === 'oui' ? '✓ Oui' : v === 'non' ? '✗ Non' : '~ Partiel'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Conseil préventif */}
                  {showConseils && (
                    <div style={{
                      marginTop: '.5rem', padding: '.75rem', fontSize: 12, lineHeight: 1.65,
                      background: rc.bg, borderLeft: `3px solid ${rc.dot}`,
                      color: 'var(--color-text-secondary)',
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', marginBottom: 4, color: rc.dot }}>
                        CONSEIL PRÉVENTIF
                      </div>
                      {item.conseil}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: '.875rem 1.5rem', borderTop: '.5px solid var(--color-border-tertiary)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: '#F8FAFC', position: 'sticky', bottom: 0,
        }}>
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            {total - done} question{total - done > 1 ? 's' : ''} restante{total - done > 1 ? 's' : ''}
          </span>
          <button onClick={onClose} style={{
            padding: '.5rem 1.25rem', fontSize: 12, cursor: 'pointer',
            background: domain.color, color: 'white', border: 'none',
          }}>
            Enregistrer et fermer
          </button>
        </div>
      </div>
    </div>
  )
}

// ── PAGE PRINCIPALE ───────────────────────────────────────────────────────────

export default function AuditPage() {
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [activePanel, setActivePanel] = useState<AuditDomain | null>(null)
  const [showIntro, setShowIntro] = useState(true)

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('das_audit_answers')
      if (saved) {
        setAnswers(JSON.parse(saved))
        setShowIntro(false)
      }
    } catch {}
  }, [])

  // Save to localStorage
  const handleAnswer = useCallback((id: string, val: Answer) => {
    setAnswers(prev => {
      const next = { ...prev, [id]: val }
      try { localStorage.setItem('das_audit_answers', JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const globalScore = computeGlobalScore(answers)
  const globalLevel = getScoreLevel(globalScore)
  const domainScores = Object.fromEntries(
    AUDIT_DOMAINS.map(d => [d.id, computeDomainScore(d, answers)])
  )

  const totalAnswered = Object.values(answers).filter(v => v !== null).length
  const totalQuestions = AUDIT_DOMAINS.reduce((s, d) => s + d.items.length, 0)

  // Critical points
  const critiques = AUDIT_DOMAINS.filter(d => domainScores[d.id] < 50 && totalAnswered > 0)

  return (
    <ModuleLayout
      kicker="MODULE AUDIT"
      title="Audit Douanier"
      sub="Évaluez votre conformité douanière sur 10 domaines clés · Checklists interactives · Conseils préventifs">

      {/* ── INTRO ── */}
      {showIntro && (
        <div style={{
          padding: '1.5rem', marginBottom: '1.5rem',
          background: '#EFF6FF', border: '.5px solid #BFDBFE',
          borderLeft: '4px solid #2563EB',
          display: 'flex', gap: '1.25rem', alignItems: 'flex-start'
        }}>
          <span style={{ fontSize: 24, flexShrink: 0 }}>◈</span>
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, color: '#1E40AF', marginBottom: 6 }}>
              Comment fonctionne cet outil ?
            </div>
            <div style={{ fontSize: 12, color: '#1E3A8A', lineHeight: 1.7 }}>
              Cliquez sur chaque domaine pour répondre aux questions de conformité (Oui / Non / Partiel). 
              Pour chaque point non conforme, un conseil préventif s'affiche automatiquement. 
              Votre score est calculé en temps réel. Vos réponses sont sauvegardées pour reprendre ultérieurement.
            </div>
            <button
              onClick={() => setShowIntro(false)}
              style={{ marginTop: 10, padding: '.4rem 1rem', fontSize: 11, cursor: 'pointer', background: '#1E40AF', color: 'white', border: 'none' }}>
              Commencer l'audit →
            </button>
          </div>
        </div>
      )}

      {/* ── LAYOUT PRINCIPAL ── */}
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>

        {/* ── COLONNE GAUCHE — Radar + Score global ── */}
        <div style={{ width: 300, flexShrink: 0 }}>

          {/* Score global */}
          <div style={{
            background: globalLevel.bg, border: `.5px solid ${globalLevel.color}20`,
            padding: '1.25rem', marginBottom: '1rem', textAlign: 'center',
          }}>
            <div style={{ fontSize: 10, letterSpacing: '.1em', color: globalLevel.color, marginBottom: 4 }}>
              SCORE DE CONFORMITÉ GLOBAL
            </div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 52, fontWeight: 700, color: globalLevel.color, lineHeight: 1 }}>
              {globalScore}<span style={{ fontSize: 20 }}>%</span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 500, color: globalLevel.color, marginTop: 6 }}>
              {globalLevel.label}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 6 }}>
              {totalAnswered} / {totalQuestions} questions répondues
            </div>
          </div>

          {/* Radar */}
          <div style={{ background: 'var(--color-background-primary)', border: '.5px solid var(--color-border-tertiary)', padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ fontSize: 10, letterSpacing: '.08em', color: 'var(--color-text-secondary)', marginBottom: '.75rem' }}>
              RADAR DE CONFORMITÉ
            </div>
            <RadarChart scores={domainScores} />
          </div>

          {/* Alertes critiques */}
          {critiques.length > 0 && (
            <div style={{ background: '#FEF2F2', border: '.5px solid #FECACA', padding: '1rem' }}>
              <div style={{ fontSize: 10, letterSpacing: '.08em', color: '#DC2626', marginBottom: '.5rem', fontWeight: 700 }}>
                ⚠ DOMAINES CRITIQUES
              </div>
              {critiques.map(d => (
                <div key={d.id} style={{ fontSize: 12, color: '#991B1B', padding: '3px 0', display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span>{d.icon}</span> {d.label}
                  <span style={{ marginLeft: 'auto', fontWeight: 700 }}>{domainScores[d.id]}%</span>
                </div>
              ))}
            </div>
          )}

          {/* Reset */}
          {totalAnswered > 0 && (
            <button
              onClick={() => { setAnswers({}); localStorage.removeItem('das_audit_answers') }}
              style={{ width: '100%', marginTop: '.75rem', padding: '.5rem', fontSize: 11, cursor: 'pointer', background: 'transparent', border: '.5px solid var(--color-border-secondary)', color: 'var(--color-text-secondary)' }}>
              Réinitialiser l'audit
            </button>
          )}
        </div>

        {/* ── COLONNE DROITE — Domaines ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, letterSpacing: '.1em', color: 'var(--color-text-secondary)', marginBottom: '.75rem' }}>
            10 DOMAINES D'AUDIT — Cliquez pour accéder à la checklist
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {AUDIT_DOMAINS.map(domain => (
              <DomainCard
                key={domain.id}
                domain={domain}
                score={domainScores[domain.id]}
                active={activePanel?.id === domain.id}
                onSelect={() => setActivePanel(domain)}
              />
            ))}
          </div>

          {/* Légende */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
            {[
              { label: 'Conforme ≥ 80%', bg: '#DCFCE7', color: '#166534' },
              { label: 'À améliorer 50-79%', bg: '#FEF3C7', color: '#92400E' },
              { label: 'Critique < 50%', bg: '#FEE2E2', color: '#991B1B' },
            ].map(l => (
              <span key={l.label} style={{ fontSize: 10, padding: '2px 8px', background: l.bg, color: l.color }}>
                {l.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '.5px solid var(--color-border-tertiary)', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-secondary)' }}>
        <span>Audit Douanier · DAS — Usage interne abonnés</span>
        <span>Basé sur le Code des douanes 2022 · Loi de Finances 2025</span>
      </div>

      {/* ── PANEL CHECKLIST ── */}
      {activePanel && (
        <ChecklistPanel
          domain={activePanel}
          answers={answers}
          onAnswer={handleAnswer}
          onClose={() => setActivePanel(null)}
        />
      )}

    </ModuleLayout>
  )
}
