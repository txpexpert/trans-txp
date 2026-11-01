// components/IngestDecisions.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Ingestion des décisions de classement — fichier JSON. Parcours : fichier →
// aperçu (calculé par la base, sans écriture) → écriture. Toutes les écritures
// passent par /api/admin/ingest-decisions → fonction SQL admin_ingest_decisions
// (migration 0007). Remplace l'ancien formulaire, qui visait une table
// « decisions » inexistante.
//
// Règles validées (2026-11-01) :
//   • une décision est reconnue par désignation + code SH ;
//   • nouvelle → ajoutée ;
//   • déjà en base → ses champs VIDES (résumé, date, objet) sont complétés par
//     le JSON ; les champs déjà remplis ne sont jamais écrasés.
// ─────────────────────────────────────────────────────────────────────────────
import { useMemo, useState } from 'react'
import { parseDecisions, extractDecisionList, type DecisionRow } from '../lib/ingestParse'
import { S, Tag, Note, Steps, SummaryBoxes, DropZone, Banner, type RowStatus } from './IngestUI'

interface ServerRow { i: number; st: RowStatus; err: string | null; fill: string[] | null; code_absent: boolean | null }
interface Counts { total: number; new: number; upd: number; same: number; err: number }
type Line = DecisionRow & { st: RowStatus; fill: string[]; codeAbsent: boolean }

const FIELD: Record<string, string> = { resume: 'résumé', date_circulaire: 'date', objet: 'objet' }
const LABEL: Record<RowStatus, string> = { new: 'Nouvelle', upd: 'À compléter', same: 'Déjà en base', err: 'Erreur', repl: '' }
const MAX = 5000

async function callApi(mode: 'preview' | 'apply', rows: DecisionRow[], file: string) {
  const r = await fetch('/api/admin/ingest-decisions', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
    body: JSON.stringify({ mode, file, rows: rows.map(x => ({
      designation: x.designation, code_sh: x.code_sh, circulaire: x.circulaire,
      date_circulaire: x.date_circulaire, objet: x.objet, resume: x.resume,
    })) }),
  })
  const d = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(d.error || `Erreur ${r.status}`)
  return d as { counts: Counts; rows: ServerRow[] }
}

export default function IngestDecisions() {
  const [step, setStep] = useState(1)
  const [file, setFile] = useState('')
  const [lines, setLines] = useState<Line[]>([])
  const [filter, setFilter] = useState('all')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState<Counts | null>(null)

  const onFile = async (f: File) => {
    setError(''); setDone(null); setFilter('all')
    let list: Record<string, unknown>[]
    try { list = extractDecisionList(JSON.parse(await f.text())) } catch (e: any) { setError(`JSON illisible : ${e.message}`); return }
    if (!list.length) { setError('Aucune décision trouvée. Attendu : un tableau, ou { "entries": [ … ] }.'); return }
    if (list.length > MAX) { setError(`Fichier trop volumineux (${list.length} décisions) : maximum ${MAX} par import.`); return }
    const parsed = parseDecisions(list)
    const valid = parsed.filter(p => !p.errs.length)
    setBusy('Comparaison avec la base…')
    try {
      const res = valid.length ? await callApi('preview', valid, f.name) : { counts: { total: 0, new: 0, upd: 0, same: 0, err: 0 }, rows: [] as ServerRow[] }
      const byRow = new Map(res.rows.map(s => [valid[s.i - 1], s]))
      setLines(parsed.map(p => {
        if (p.errs.length) return { ...p, st: 'err' as RowStatus, fill: [], codeAbsent: false }
        const s = byRow.get(p)
        return { ...p, st: s?.st ?? 'same', fill: s?.fill ?? [], codeAbsent: !!s?.code_absent, errs: s?.err ? [s.err] : [] }
      }))
      setFile(f.name); setStep(2)
    } catch (e: any) { setError(e.message) } finally { setBusy('') }
  }

  const counts = useMemo(() => {
    const c = (st: RowStatus) => lines.filter(l => l.st === st).length
    return { total: lines.length, new: c('new'), upd: c('upd'), same: c('same'), err: c('err') }
  }, [lines])

  const apply = async () => {
    setError(''); setBusy('Écriture en base…')
    try {
      const res = await callApi('apply', lines.filter(l => l.st !== 'err'), file)
      setDone({ ...res.counts, err: counts.err, total: counts.total }); setStep(3)
    } catch (e: any) { setError(e.message) } finally { setBusy('') }
  }

  const reset = () => { setStep(1); setLines([]); setDone(null); setError('') }
  const shown = filter === 'all' ? lines : lines.filter(l => l.st === filter)

  return (
    <div>
      <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: 'var(--bd)', marginBottom: 4 }}>Ingestion des décisions de classement</h1>
      <p style={{ fontSize: 13, color: 'var(--inkm)', margin: '0 0 1.25rem' }}>Fichier JSON → contrôle → aperçu → écriture dans la table des décisions de classement.</p>
      <Steps labels={['Déposer le JSON', 'Contrôler l’aperçu', 'Écrire en base']} current={step} />
      {error && <Banner tone="err">{error}</Banner>}
      {busy && <Banner tone="info">{busy}</Banner>}

      {step === 1 && (
        <>
          <DropZone id="dec-file" accept=".json,application/json" title="Déposez le fichier JSON des décisions" hint={'Un tableau de décisions, ou { "type": "decisions", "entries": [ … ] }'} onFile={onFile} />
          <section style={{ ...S.panel, marginTop: 16 }}>
            <h2 style={S.h2}>Format attendu</h2>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>
              Champs obligatoires : <b>designation</b>, <b>code_sh</b> (10 chiffres, points acceptés), <b>circulaire</b>.
              Facultatifs : <b>date_circulaire</b> (AAAA-MM-JJ ou JJ/MM/AAAA), <b>objet</b>, <b>resume</b>.
              Une décision déjà présente (même désignation et même code SH) voit ses champs vides complétés ; ses champs déjà remplis ne sont jamais écrasés.
            </p>
            <pre style={{ background: 'var(--paper)', border: '.5px solid var(--rule)', padding: '10px 12px', fontSize: 11, overflowX: 'auto', margin: '8px 0 0' }}>
{`{ "type": "decisions", "entries": [
  { "designation": "EYE WASH", "code_sh": "3307909090", "circulaire": "6770/232",
    "date_circulaire": "2026-08-18", "objet": "Classement dans le tarif…",
    "resume": "Solution stérile de chlorure de sodium à 0,9 %…" }
] }`}
            </pre>
          </section>
        </>
      )}

      {step === 2 && (
        <section style={S.panel}>
          <h2 style={S.h2}>Aperçu — {file}</h2>
          <SummaryBoxes active={filter} onPick={setFilter} boxes={[
            { id: 'all', label: 'Lignes lues', n: counts.total, color: '#64748B' },
            { id: 'new', label: 'Nouvelles', n: counts.new, color: '#059669' },
            { id: 'upd', label: 'À compléter', n: counts.upd, color: '#2563EB' },
            { id: 'same', label: 'Déjà en base', n: counts.same, color: '#94A3B8' },
            { id: 'err', label: 'Erreurs', n: counts.err, color: '#DC2626' },
          ]} />
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['#', 'STATUT', 'DÉSIGNATION', 'CODE SH', 'CIRCULAIRE', 'DATE', 'CONTRÔLES'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>
                {shown.map(l => (
                  <tr key={l.n}>
                    <td style={{ ...S.td, color: 'var(--inkm)' }}>{l.n}</td>
                    <td style={S.td}><Tag st={l.st} label={LABEL[l.st]} /></td>
                    <td style={S.td}>
                      <b style={{ color: 'var(--bd)' }}>{l.designation || '—'}</b>
                      {l.resume && <div style={{ fontSize: 11, color: 'var(--inkm)', maxWidth: 340 }}>{l.resume.slice(0, 110)}{l.resume.length > 110 ? '…' : ''}</div>}
                    </td>
                    <td style={{ ...S.td, ...S.mono }}>{l.code_sh || '—'}</td>
                    <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 11 }}>{l.circulaire || '—'}</td>
                    <td style={{ ...S.td, color: 'var(--inkm)', whiteSpace: 'nowrap' }}>{l.date_circulaire ? new Date(l.date_circulaire + 'T00:00:00').toLocaleDateString('fr-FR') : '—'}</td>
                    <td style={S.td}>
                      {l.fill.map(f => (
                        <div key={f}>{FIELD[f] || f} : <del style={{ color: '#C0392B' }}>vide</del> → <ins style={{ color: '#1A7A40', textDecoration: 'none', fontWeight: 600 }}>
                          {(f === 'resume' ? l.resume : f === 'objet' ? l.objet : l.date_circulaire || '').slice(0, 60)}</ins></div>
                      ))}
                      {l.errs.map(e => <div key={e}><Note tone="err">{e}</Note></div>)}
                      {l.warns.map(w => <div key={w}><Note tone="warn">{w}</Note></div>)}
                      {l.codeAbsent && <div><Note tone="warn">code absent du tarif en base</Note></div>}
                      {!l.fill.length && !l.errs.length && !l.warns.length && !l.codeAbsent && <span style={{ color: 'var(--inkm)' }}>OK</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 14 }}>
            <button type="button" style={S.btn('primary', !(counts.new + counts.upd) || !!busy)} disabled={!(counts.new + counts.upd) || !!busy} onClick={apply}>
              Écrire : {counts.new} nouvelle{counts.new > 1 ? 's' : ''}, {counts.upd} complétée{counts.upd > 1 ? 's' : ''}
            </button>
            <button type="button" style={S.btn()} onClick={reset} disabled={!!busy}>Changer de fichier</button>
            <span style={{ fontSize: 11, color: 'var(--inkm)' }}>Les lignes en erreur ne sont pas écrites. Les avertissements n’empêchent pas l’écriture.</span>
          </div>
        </section>
      )}

      {step === 3 && done && (
        <section style={S.panel}>
          <h2 style={S.h2}>Ingestion terminée</h2>
          <p style={{ margin: '0 0 10px', fontSize: 13 }}>
            <b>{done.new}</b> décision{done.new > 1 ? 's' : ''} ajoutée{done.new > 1 ? 's' : ''} · <b>{done.upd}</b> complétée{done.upd > 1 ? 's' : ''} ·
            {' '}{done.same} déjà complète{done.same > 1 ? 's' : ''} · {done.err} ligne{done.err > 1 ? 's' : ''} en erreur non écrite{done.err > 1 ? 's' : ''}.
          </p>
          <p style={{ fontSize: 11, color: 'var(--inkm)', margin: '0 0 12px' }}>Fichier « {file} » · l’opération figure dans Journaux d’activité.</p>
          <button type="button" style={S.btn('primary')} onClick={reset}>Ingérer un autre fichier</button>
        </section>
      )}
    </div>
  )
}
