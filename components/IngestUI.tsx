// components/IngestUI.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Éléments d'interface communs aux pages d'ingestion (tarif SH, décisions) :
// étapes, cases de synthèse filtrantes, étiquettes de statut, zone de dépôt.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'

export type RowStatus = 'new' | 'upd' | 'same' | 'err' | 'repl'

export const S = {
  panel: { background: 'var(--white)', border: '.5px solid var(--rule)', padding: '1.25rem 1.5rem', minWidth: 0 } as CSSProperties,
  h2: { fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 700, color: 'var(--bd)', margin: '0 0 .75rem' } as CSSProperties,
  label: { fontSize: 10, letterSpacing: '.06em', color: 'var(--inkm)', display: 'block', marginBottom: 4, fontWeight: 600 } as CSSProperties,
  th: { padding: '.5rem .75rem', textAlign: 'left', fontSize: 10, letterSpacing: '.06em', color: 'var(--inkm)', fontWeight: 600, borderBottom: '.5px solid var(--rule)', whiteSpace: 'nowrap' } as CSSProperties,
  td: { padding: '.5rem .75rem', borderBottom: '.5px solid var(--rule)', fontSize: 12, verticalAlign: 'top' } as CSSProperties,
  mono: { fontFamily: 'monospace', fontWeight: 600, color: 'var(--bd)', whiteSpace: 'nowrap' } as CSSProperties,
  btn: (tone: 'primary' | 'outline' = 'outline', disabled = false): CSSProperties => ({
    fontSize: 12, padding: '8px 16px', fontFamily: 'inherit', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .5 : 1,
    border: '.5px solid ' + (tone === 'primary' ? 'var(--bd)' : 'var(--rule)'),
    background: tone === 'primary' ? 'var(--bd)' : 'var(--white)', color: tone === 'primary' ? '#fff' : 'var(--inks)',
  }),
}

const TAG: Record<RowStatus, { bg: string; color: string }> = {
  new:  { bg: '#E6F7EE', color: '#1A7A40' },
  upd:  { bg: '#EEF4FE', color: '#1A3A9A' },
  same: { bg: '#EEF0F3', color: '#5B6672' },
  err:  { bg: '#FEE8E8', color: '#C0392B' },
  repl: { bg: '#FEF5E4', color: '#8A5A10' },
}

export function Tag({ st, label }: { st: RowStatus; label: string }) {
  return <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 600, padding: '2px 7px', whiteSpace: 'nowrap', background: TAG[st].bg, color: TAG[st].color }}>{label}</span>
}

export function Note({ tone, children }: { tone: 'err' | 'warn'; children: ReactNode }) {
  return <div style={{ display: 'inline-block', fontSize: 10, fontWeight: 600, padding: '1px 6px', margin: '1px 0', background: tone === 'err' ? '#FEE8E8' : '#FEF5E4', color: tone === 'err' ? '#C0392B' : '#8A5A10' }}>{children}</div>
}

export function Steps({ labels, current }: { labels: string[]; current: number }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
      {labels.map((l, i) => {
        const state = current === i + 1 ? 'on' : current > i + 1 ? 'done' : ''
        return (
          <div key={l} style={{ flex: '1 1 150px', padding: '9px 12px', border: '.5px solid ' + (state === 'on' ? 'var(--bd)' : 'var(--rule)'), background: 'var(--white)', fontSize: 12, color: state === 'on' ? 'var(--bd)' : 'var(--inkm)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ width: 20, height: 20, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0, background: state === 'on' ? 'var(--bd)' : state === 'done' ? '#1A7A40' : '#EEF0F3', color: state ? '#fff' : 'var(--inkm)' }}>
              {state === 'done' ? '✓' : i + 1}
            </span>
            {l}
          </div>
        )
      })}
    </div>
  )
}

export function SummaryBoxes({ boxes, active, onPick }: {
  boxes: { id: string; label: string; n: number; color: string }[]; active: string; onPick: (id: string) => void
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 8, margin: '0 0 1rem' }}>
      {boxes.map(b => (
        <button key={b.id} type="button" onClick={() => onPick(b.id)} style={{
          border: '.5px solid var(--rule)', borderTop: `3px solid ${b.color}`, padding: '10px 12px', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
          background: active === b.id ? 'var(--bl)' : 'var(--white)',
        }}>
          <b style={{ display: 'block', fontFamily: "'Playfair Display',serif", fontSize: 22, color: 'var(--bd)', fontVariantNumeric: 'tabular-nums' }}>{b.n.toLocaleString('fr-FR')}</b>
          <span style={{ fontSize: 11, color: 'var(--inkm)' }}>{b.label}</span>
        </button>
      ))}
    </div>
  )
}

export function DropZone({ id, accept, title, hint, onFile, children }: {
  id: string; accept: string; title: string; hint: string; onFile: (f: File) => void; children?: ReactNode
}) {
  const [over, setOver] = useState(false)
  return (
    <label htmlFor={id}
      onDragOver={e => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files[0]; if (f) onFile(f) }}
      style={{ border: '1.5px dashed ' + (over ? 'var(--bd)' : 'var(--rule)'), background: over ? 'var(--bl)' : 'var(--white)', padding: 22, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
      <b style={{ fontSize: 14, color: 'var(--bd)' }}>{title}</b>
      <span style={{ fontSize: 11, color: 'var(--inkm)' }}>{hint}</span>
      <input id={id} type="file" accept={accept} style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = '' }} />
      <span style={{ ...S.btn('outline'), pointerEvents: 'none' }}>Choisir un fichier</span>
      {children}
    </label>
  )
}

export function Banner({ tone, children }: { tone: 'err' | 'ok' | 'info'; children: ReactNode }) {
  const c = tone === 'err' ? ['#FEE8E8', '#C0392B'] : tone === 'ok' ? ['#E6F7EE', '#1A7A40'] : ['#FFFBF0', '#8A5A10']
  return <div style={{ background: c[0], color: c[1], padding: '10px 14px', fontSize: 12, marginBottom: '1rem', lineHeight: 1.55 }}>{children}</div>
}
