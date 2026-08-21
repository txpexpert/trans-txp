// components/ForexWidget.tsx
// Utilisation :
//   <ForexWidget />           → version complète sidebar (8 devises, refresh auto)
//   <ForexWidget compact />   → version inline simulateurs (4 devises, mini)

import { useState, useEffect, useCallback } from 'react'
import type { ForexRate, ForexResponse } from '../pages/api/forex'

interface Props {
  compact?: boolean
  pairs?: string[]  // devises à afficher (défaut selon mode)
}

const DEFAULT_PAIRS_FULL    = ['EUR', 'USD', 'GBP', 'CNY', 'SAR', 'AED', 'CAD', 'CHF']
const DEFAULT_PAIRS_COMPACT = ['EUR', 'USD', 'GBP', 'CNY']

// ── Fallback affiché pendant le chargement ────────────────────────────────────
const STATIC_FALLBACK: ForexRate[] = [
  { pair: 'EUR', rate: 10.85, change: 0, source: 'fallback' },
  { pair: 'USD', rate: 9.97,  change: 0, source: 'fallback' },
  { pair: 'GBP', rate: 13.40, change: 0, source: 'fallback' },
  { pair: 'CNY', rate: 1.38,  change: 0, source: 'fallback' },
  { pair: 'SAR', rate: 2.65,  change: 0, source: 'fallback' },
  { pair: 'AED', rate: 2.71,  change: 0, source: 'fallback' },
  { pair: 'CAD', rate: 7.20,  change: 0, source: 'fallback' },
  { pair: 'CHF', rate: 11.20, change: 0, source: 'fallback' },
]

const FLAG: Record<string, string> = {
  EUR: '🇪🇺', USD: '🇺🇸', GBP: '🇬🇧', CNY: '🇨🇳',
  SAR: '🇸🇦', AED: '🇦🇪', CAD: '🇨🇦', CHF: '🇨🇭',
  XOF: '🌍', JPY: '🇯🇵',
}

export default function ForexWidget({ compact = false, pairs }: Props) {
  const targetPairs = pairs ?? (compact ? DEFAULT_PAIRS_COMPACT : DEFAULT_PAIRS_FULL)

  const [rates, setRates]       = useState<ForexRate[]>(STATIC_FALLBACK)
  const [loading, setLoading]   = useState(true)
  const [isLive, setIsLive]     = useState(false)
  const [updatedAt, setUpdated] = useState('')
  const [lastRefresh, setLast]  = useState(0)

  const fetchRates = useCallback(async () => {
    // Anti-spam : pas plus d'une requête toutes les 5 min côté client
    if (Date.now() - lastRefresh < 5 * 60 * 1000 && lastRefresh > 0) return
    try {
      const res  = await fetch('/api/forex')
      const data: ForexResponse = await res.json()
      setRates(data.rates)
      setIsLive(data.source === 'live')
      setUpdated(data.updatedAt)
      setLast(Date.now())
    } catch {
      // garde les valeurs statiques
    } finally {
      setLoading(false)
    }
  }, [lastRefresh])

  useEffect(() => {
    fetchRates()
    // Refresh auto toutes les 15 min
    const id = setInterval(fetchRates, 15 * 60 * 1000)
    return () => clearInterval(id)
  }, [fetchRates])

  const displayed = rates.filter(r => targetPairs.includes(r.pair))

  const fmtTime = (iso: string) => {
    if (!iso) return ''
    try {
      return new Date(iso).toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' })
    } catch { return '' }
  }

  // ── MODE COMPACT (dans simulateurs) ─────────────────────────────────────────
  if (compact) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '1rem',
        padding: '.5rem 1rem',
        background: 'var(--gold5, #fffdf7)',
        border: '1px solid var(--gold3, #e8d5a0)',
        borderRadius: 'var(--radius, 6px)',
        flexWrap: 'wrap',
        fontSize: 12,
      }}>
        <span style={{ fontSize: 10, letterSpacing: '.1em', color: 'var(--ink3, #888)', textTransform: 'uppercase', flexShrink: 0 }}>
          {isLive ? '🟢' : '⚪'} COURS BAM
        </span>
        {displayed.map(r => (
          <span key={r.pair} style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--ink, #1a1a1a)' }}>
            <span style={{ color: 'var(--ink3, #888)' }}>{FLAG[r.pair]}</span>
            <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              {loading ? '—' : r.rate.toFixed(2)}
            </span>
            <span style={{ color: 'var(--ink3, #888)', fontSize: 10 }}>DH/{r.pair}</span>
            {r.change !== 0 && (
              <span style={{ color: r.change > 0 ? 'var(--green, #1e7e4a)' : 'var(--red, #c0392b)', fontSize: 10 }}>
                {r.change > 0 ? '▲' : '▼'}{Math.abs(r.change).toFixed(2)}%
              </span>
            )}
          </span>
        ))}
        <span
          onClick={() => { setLast(0); fetchRates() }}
          style={{ marginLeft: 'auto', cursor: 'pointer', color: 'var(--gold, #C9A84C)', fontSize: 10, flexShrink: 0 }}
          title="Actualiser"
        >
          ↻ {updatedAt ? fmtTime(updatedAt) : 'BAM'}
        </span>
      </div>
    )
  }

  // ── MODE COMPLET (sidebar) ───────────────────────────────────────────────────
  return (
    <div style={{ border: '1px solid var(--border, #e8e4db)', background: 'var(--bg, #fff)' }}>
      {/* Header */}
      <div style={{
        padding: '.7rem 1rem',
        borderBottom: '1px solid var(--border, #e8e4db)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 10, letterSpacing: '.14em', color: 'var(--ink3, #888)', textTransform: 'uppercase' }}>
          COURS DH — BAM
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, letterSpacing: '.1em' }}>
          <span style={{
            width: 5, height: 5, borderRadius: '50%',
            background: isLive ? 'var(--green, #1e7e4a)' : 'var(--ink3, #888)',
            animation: isLive ? 'pulse 2s infinite' : 'none',
            display: 'inline-block',
          }} />
          <span style={{ color: isLive ? 'var(--green, #1e7e4a)' : 'var(--ink3, #888)' }}>
            {isLive ? 'LIVE' : 'INDICATIF'}
          </span>
          <span
            onClick={() => { setLast(0); fetchRates() }}
            style={{ cursor: 'pointer', color: 'var(--gold, #C9A84C)', marginLeft: 4 }}
            title="Actualiser"
          >↻</span>
        </span>
      </div>

      {/* Grille taux */}
      <div style={{
        padding: '.75rem 1rem',
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '.5rem',
      }}>
        {displayed.map(r => (
          <div key={r.pair} style={{
            padding: '.5rem .75rem',
            background: 'var(--gold4, #fdf8ee)',
            display: 'flex', flexDirection: 'column', gap: 2,
          }}>
            <span style={{ fontSize: 10, letterSpacing: '.08em', color: 'var(--ink3, #888)' }}>
              {FLAG[r.pair]} DH / {r.pair}
            </span>
            <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--ink, #1a1a1a)', fontVariantNumeric: 'tabular-nums' }}>
              {loading ? '—' : r.rate.toFixed(2)}
            </span>
            {r.change !== 0 && (
              <span style={{ fontSize: 10, color: r.change > 0 ? 'var(--green, #1e7e4a)' : 'var(--red, #c0392b)' }}>
                {r.change > 0 ? '▲' : '▼'} {Math.abs(r.change).toFixed(2)}%
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: '.5rem 1rem',
        borderTop: '1px solid var(--border, #e8e4db)',
        fontSize: 10, color: 'var(--ink3, #888)',
        display: 'flex', justifyContent: 'space-between',
      }}>
        <span>Source : BAM / open.er-api.com</span>
        {updatedAt && <span>màj {fmtTime(updatedAt)}</span>}
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  )
}
