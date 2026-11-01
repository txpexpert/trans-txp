// pages/backoffice/tarifs.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Codes SH & Tarifs — données réelles (2026-11-01) : table tarifs de Supabase,
// recherche côté serveur par code SH (début du code, points ignorés) ou par
// désignation. Remplace la liste de 8 codes d'exemple. Aucune année affichée :
// le tarif est mis à jour au fil des données (onglet Ingestion Tarif SH).
// ─────────────────────────────────────────────────────────────────────────────
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import type { GetServerSideProps } from 'next'
import { requireAdminSSR } from '../../lib/adminAuth'
import { supabaseAdmin } from '../../lib/supabaseAdmin'
import BackofficeLayout from '../../components/BackofficeLayout'

interface Tarif {
  id: string; code_sh: string; chapitre: string | null; designation_clean: string | null
  taux_droit: number | null; taux_raw: string | null; unite_norm: string | null
  est_feuille: boolean | null; niveau: number | null
}
interface Props { rows: Tarif[]; total: number; totalAll: number; page: number; q: string; loadError?: string }

const PAGE = 50

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const guard = await requireAdminSSR(context)
  if ('redirect' in guard) return guard as any
  const q = String(context.query.q || '').trim().slice(0, 100)
  const page = Math.max(1, parseInt(String(context.query.page || '1'), 10) || 1)
  try {
    const sb = supabaseAdmin()
    let query = sb.from('tarifs')
      .select('id, code_sh, chapitre, designation_clean, taux_droit, taux_raw, unite_norm, est_feuille, niveau', { count: 'exact' })
    const digits = q.replace(/[\s.]/g, '')
    if (q && /^\d+$/.test(digits)) query = query.like('code_sh', `${digits}%`)
    else if (q) query = query.ilike('designation_clean', `%${q.replace(/[%_]/g, '')}%`)
    const [res, all] = await Promise.all([
      query.order('code_sh').range((page - 1) * PAGE, page * PAGE - 1),
      sb.from('tarifs').select('id', { count: 'exact', head: true }),
    ])
    if (res.error) throw res.error
    return { props: {
      rows: (res.data ?? []) as Tarif[], total: res.count ?? 0, totalAll: all.count ?? 0, page, q,
    } }
  } catch (e: any) {
    return { props: { rows: [], total: 0, totalAll: 0, page, q, loadError: e?.message || 'Chargement impossible' } }
  }
}

function fmtCode(c: string) {
  const d = c.replace(/\D/g, '')
  return d.length > 4 ? [d.slice(0, 4), d.slice(4, 6), d.slice(6, 8), d.slice(8)].filter(Boolean).join('.') : d
}

export default function BackofficeTarifs({ rows, total, totalAll, page, q, loadError }: Props) {
  const router = useRouter()
  const [input, setInput] = useState(q)
  const pages = Math.max(1, Math.ceil(total / PAGE))
  const href = (p: number) => ({ pathname: '/backoffice/tarifs', query: { ...(q ? { q } : {}), ...(p > 1 ? { page: p } : {}) } })
  const th = { padding: '.5rem .75rem', textAlign: 'left' as const, fontSize: 10, letterSpacing: '.06em', color: 'var(--inkm)', fontWeight: 600, borderBottom: '.5px solid var(--rule)', whiteSpace: 'nowrap' as const }
  const td = { padding: '.5rem .75rem', borderBottom: '.5px solid var(--rule)', fontSize: 12, verticalAlign: 'top' as const }

  return (
    <BackofficeLayout title="Codes SH & Tarifs">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: 'var(--bd)', marginBottom: 4 }}>Codes SH & Tarifs</h1>
        <p style={{ fontSize: 13, color: 'var(--inkm)' }}>
          {totalAll.toLocaleString('fr-FR')} lignes en base
          {q ? ` · ${total.toLocaleString('fr-FR')} résultat${total > 1 ? 's' : ''} pour « ${q} »` : ''}
        </p>
        </div>
        <Link href="/backoffice/ingest-tarif" style={{ padding: '8px 16px', background: 'var(--bd)', color: '#fff', fontSize: 12, textDecoration: 'none' }}>
          Mettre à jour le tarif →
        </Link>
      </div>

      {loadError && <div style={{ background: '#FEE8E8', color: '#C0392B', padding: '10px 14px', fontSize: 12, marginBottom: '1rem' }}>{loadError}</div>}

      <form onSubmit={e => { e.preventDefault(); router.push({ pathname: '/backoffice/tarifs', query: input.trim() ? { q: input.trim() } : {} }) }}
        style={{ display: 'flex', gap: 8, marginBottom: '1rem' }}>
        <input id="tarif-q" value={input} onChange={e => setInput(e.target.value)} placeholder="Code SH (ex. 8703 ou 8703.21) ou mot de la désignation…"
          style={{ flex: 1, minWidth: 0, padding: '10px 14px', border: '.5px solid var(--rule)', background: 'var(--white)', fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
        <button type="submit" style={{ padding: '0 16px', background: 'var(--bd)', color: '#fff', border: 'none', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Rechercher</button>
        {q && <Link href="/backoffice/tarifs" style={{ alignSelf: 'center', fontSize: 12, color: 'var(--ba)' }}>Effacer</Link>}
      </form>

      <div style={{ background: 'var(--white)', border: '.5px solid var(--rule)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['CODE SH', 'DÉSIGNATION', 'DROIT', 'UNITÉ', 'CHAP.'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={5} style={{ ...td, textAlign: 'center', color: 'var(--inkm)', padding: '2rem' }}>{q ? 'Aucun code ne correspond.' : 'Aucun code en base.'}</td></tr>}
            {rows.map(t => (
              <tr key={t.id} style={{ background: t.est_feuille === false ? 'var(--paper)' : undefined }}>
                <td style={{ ...td, fontFamily: 'monospace', fontWeight: 600, color: 'var(--bd)', whiteSpace: 'nowrap' }}>{fmtCode(t.code_sh)}</td>
                <td style={{ ...td, color: t.est_feuille === false ? 'var(--inkm)' : 'var(--ink)', paddingLeft: `${0.75 + Math.max(0, (t.niveau || 0) - 1) * 0.6}rem` }}>{t.designation_clean || '—'}</td>
                <td style={{ ...td, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{t.taux_raw ? `${t.taux_raw} %` : t.taux_droit != null ? `${String(t.taux_droit).replace('.', ',')} %` : '—'}</td>
                <td style={td}>{t.unite_norm || '—'}</td>
                <td style={{ ...td, color: 'var(--inkm)' }}>{t.chapitre || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', marginTop: '1rem', fontSize: 12 }}>
          {page > 1 && <Link href={href(page - 1)} style={{ color: 'var(--ba)' }}>← Précédent</Link>}
          <span style={{ color: 'var(--inkm)' }}>Page {page} / {pages}</span>
          {page < pages && <Link href={href(page + 1)} style={{ color: 'var(--ba)' }}>Suivant →</Link>}
        </div>
      )}
    </BackofficeLayout>
  )
}
