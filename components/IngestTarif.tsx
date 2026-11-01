// components/IngestTarif.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Ingestion du tarif SH — format unifié 4 colonnes (code · désignation · droit
// · unité), par copier-coller depuis Excel ou dépôt d'un fichier (.xlsx, .xls,
// .csv, .txt). Parcours : lignes → aperçu des écarts (calculé par la base, sans
// écriture) → application. Toutes les écritures passent par
// /api/admin/ingest-tarif → fonction SQL admin_ingest_tarif (migration 0007).
//
// Règles validées (2026-11-01) :
//   • une ligne est reconnue par code SH + désignation ;
//   • nouvelle → ajoutée ; droit ou unité changés → modifiée (ancienne archivée) ;
//   • pour un code importé, ses anciennes lignes absentes de l'import
//     (fragments) sont remplacées et archivées ; un code non importé n'est
//     jamais touché ;
//   • un code à 9 chiffres (0 initial perdu par Excel) est complété.
// ─────────────────────────────────────────────────────────────────────────────
import { useMemo, useState } from 'react'
import { parseTarif, rowsFromText, readSpreadsheet, batchByCode, type TarifRow } from '../lib/ingestParse'
import { S, Tag, Note, Steps, SummaryBoxes, DropZone, Banner, type RowStatus } from './IngestUI'

interface ServerRow { i: number; st: RowStatus; code_sh: string; err: string | null; old_taux: string | null; old_unite: string | null; remplace: number }
interface Removed { code_sh: string; designation: string; taux: string | null; unite: string | null }
interface Counts { total: number; new: number; upd: number; same: number; err: number; removed: number }
interface Result { counts: Counts; rows: ServerRow[]; removed: Removed[] }

type Line = TarifRow & { st: RowStatus; srv?: ServerRow }

const ZERO: Counts = { total: 0, new: 0, upd: 0, same: 0, err: 0, removed: 0 }
const sum = (a: Counts, b: Counts): Counts => ({ total: a.total + b.total, new: a.new + b.new, upd: a.upd + b.upd, same: a.same + b.same, err: a.err + b.err, removed: a.removed + b.removed })
const LABEL: Record<RowStatus, string> = { new: 'Nouvelle', upd: 'Modifiée', same: 'Inchangée', err: 'Erreur', repl: 'Remplacée' }
const PREVIEW_LIMIT = 500

async function callApi(mode: 'preview' | 'apply', rows: TarifRow[], file: string): Promise<Result> {
  const r = await fetch('/api/admin/ingest-tarif', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
    body: JSON.stringify({ mode, file, rows: rows.map(x => ({ code_sh: x.code_sh, designation: x.designation, taux: x.taux, unite: x.unite })) }),
  })
  const d = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(d.error || `Erreur ${r.status}`)
  return d as Result
}

export default function IngestTarif() {
  const [step, setStep] = useState(1)
  const [paste, setPaste] = useState('')
  const [source, setSource] = useState('')
  const [lines, setLines] = useState<Line[]>([])
  const [removed, setRemoved] = useState<Removed[]>([])
  const [counts, setCounts] = useState<Counts>(ZERO)
  const [filter, setFilter] = useState('all')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState<Counts | null>(null)

  const analyse = async (raw: unknown[][], label: string) => {
    setError(''); setDone(null); setFilter('all')
    const parsed = parseTarif(raw)
    if (!parsed.length) { setError('Aucune ligne lue. Vérifiez le format : code · désignation · droit · unité.'); return }
    const valid = parsed.filter(p => !p.errs.length)
    setBusy(`Comparaison de ${valid.length.toLocaleString('fr-FR')} ligne(s) avec la base…`)
    try {
      let c: Counts = { ...ZERO }, rem: Removed[] = [], srv = new Map<TarifRow, ServerRow>()
      for (const batch of batchByCode(valid)) {
        const res = await callApi('preview', batch, label)
        c = sum(c, res.counts); rem = rem.concat(res.removed)
        res.rows.forEach(s => srv.set(batch[s.i - 1], s))
      }
      const clientErr = parsed.length - valid.length
      c = { ...c, total: c.total + clientErr, err: c.err + clientErr }
      setLines(parsed.map(p => {
        if (p.errs.length) return { ...p, st: 'err' }
        const s = srv.get(p)
        return { ...p, st: s ? s.st : 'same', srv: s, errs: s?.err ? [s.err] : [] }
      }))
      setRemoved(rem); setCounts(c); setSource(label); setStep(2)
    } catch (e: any) {
      setError(e.message)
    } finally { setBusy('') }
  }

  const apply = async () => {
    setError('')
    const valid = lines.filter(l => l.st !== 'err')
    const batches = batchByCode(valid)
    let c: Counts = { ...ZERO }
    try {
      for (let k = 0; k < batches.length; k++) {
        setBusy(`Écriture en base… lot ${k + 1} / ${batches.length}`)
        c = sum(c, (await callApi('apply', batches[k], source)).counts)
      }
      setDone({ ...c, err: counts.err, total: counts.total }); setStep(3)
    } catch (e: any) {
      setError(`${e.message}${c.total ? ` — ${c.total} ligne(s) déjà écrites avant l’erreur ; relancez l’import, les lignes déjà à jour seront reconnues comme inchangées.` : ''}`)
    } finally { setBusy('') }
  }

  const onFile = async (f: File) => {
    setError('')
    try { await analyse(await readSpreadsheet(f), f.name) } catch (e: any) { setError(`Fichier illisible : ${e.message}`) }
  }

  const reset = () => { setStep(1); setLines([]); setRemoved([]); setCounts(ZERO); setDone(null); setError('') }

  const shown = useMemo(() => filter === 'all' ? lines : lines.filter(l => l.st === filter), [lines, filter])
  const nWrite = counts.new + counts.upd + counts.removed

  return (
    <div>
      <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: 'var(--bd)', marginBottom: 4 }}>Ingestion du tarif SH</h1>
      <p style={{ fontSize: 13, color: 'var(--inkm)', margin: '0 0 1.25rem' }}>
        Lignes au format unifié → contrôle des écarts → mise à jour de la table tarifs. Ajoute et modifie ; pour un code importé, ses anciens fragments sont remplacés et archivés.
      </p>
      <Steps labels={['Déposer ou coller les lignes', 'Contrôler les écarts', 'Écrire en base']} current={step} />
      {error && <Banner tone="err">{error}</Banner>}
      {busy && <Banner tone="info">{busy}</Banner>}

      {step === 1 && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16 }}>
            <section style={{ ...S.panel, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h2 style={{ ...S.h2, margin: 0 }}>Coller les lignes</h2>
              <label style={S.label} htmlFor="tar-paste">COPIER-COLLER DEPUIS EXCEL (4 COLONNES)</label>
              <textarea id="tar-paste" rows={10} value={paste} onChange={e => setPaste(e.target.value)} placeholder={'2939110020\t   thébaïne et ses sels\t2,5\tKG'}
                style={{ width: '100%', padding: '9px 12px', border: '.5px solid var(--rule)', fontFamily: 'monospace', fontSize: 11, whiteSpace: 'pre', resize: 'vertical', background: 'var(--white)' }} />
              <div>
                <button type="button" style={S.btn('primary', !paste.trim() || !!busy)} disabled={!paste.trim() || !!busy}
                  onClick={() => analyse(rowsFromText(paste), 'lignes collées')}>Contrôler les lignes collées</button>
              </div>
            </section>
            <DropZone id="tar-file" accept=".xlsx,.xls,.csv,.txt,.tsv" title="ou déposer un fichier" hint=".xlsx, .xls, .csv ou .txt · mêmes 4 colonnes · première feuille" onFile={onFile} />
          </div>
          <section style={{ ...S.panel, marginTop: 16 }}>
            <h2 style={S.h2}>Format unifié</h2>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>
              Quatre colonnes, sans ligne d’en-tête : <b>code SH</b> (10 chiffres) · <b>désignation</b> (les espaces en tête marquent le retrait) ·
              <b> droit d’importation</b> (« 2,5 », vide pour une ligne de titre) · <b>unité</b> (« KG », « U »…).
              Le niveau et le chapitre sont calculés depuis le code ; l’unité est enregistrée en minuscules ; un code dont Excel a retiré le 0 initial est complété.
            </p>
            <pre style={{ background: 'var(--paper)', border: '.5px solid var(--rule)', padding: '10px 12px', fontSize: 11, overflowX: 'auto', margin: '8px 0 0' }}>
{`2939110020	   thébaïne et ses sels	2,5	KG
2939110051	    buprénorphine (DCI) et ses sels	2,5	KG`}
            </pre>
          </section>
        </>
      )}

      {step === 2 && (
        <section style={S.panel}>
          <h2 style={S.h2}>Écarts avec la base — {source}</h2>
          <SummaryBoxes active={filter} onPick={setFilter} boxes={[
            { id: 'all', label: 'Lignes lues', n: counts.total, color: '#64748B' },
            { id: 'new', label: 'Nouvelles', n: counts.new, color: '#059669' },
            { id: 'upd', label: 'Modifiées', n: counts.upd, color: '#2563EB' },
            { id: 'repl', label: 'Remplacées (archivées)', n: counts.removed, color: '#B45309' },
            { id: 'same', label: 'Inchangées', n: counts.same, color: '#94A3B8' },
            { id: 'err', label: 'Erreurs', n: counts.err, color: '#DC2626' },
          ]} />
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['#', 'STATUT', 'CODE SH', 'DÉSIGNATION', 'DROIT', 'UNITÉ', 'DÉTAIL'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>
                {filter === 'repl'
                  ? removed.slice(0, PREVIEW_LIMIT).map((r, k) => (
                    <tr key={k} style={{ background: '#FFFBF0' }}>
                      <td style={{ ...S.td, color: 'var(--inkm)' }}>base</td><td style={S.td}><Tag st="repl" label="Remplacée" /></td>
                      <td style={{ ...S.td, ...S.mono }}>{r.code_sh}</td><td style={S.td}>{r.designation}</td>
                      <td style={S.td}>{r.taux ? `${r.taux} %` : '—'}</td><td style={S.td}>{r.unite || '—'}</td>
                      <td style={{ ...S.td, color: 'var(--inkm)' }}>fragment archivé, remplacé par la ligne importée</td>
                    </tr>))
                  : shown.slice(0, PREVIEW_LIMIT).map(l => (
                    <tr key={l.n}>
                      <td style={{ ...S.td, color: 'var(--inkm)' }}>{l.n}</td>
                      <td style={S.td}><Tag st={l.st} label={LABEL[l.st]} /></td>
                      <td style={{ ...S.td, ...S.mono }}>{l.code_sh || '—'}</td>
                      <td style={{ ...S.td, paddingLeft: 12 + Math.min(l.indent, 8) * 5 }}>{l.designation || '—'}</td>
                      <td style={{ ...S.td, whiteSpace: 'nowrap' }}>{l.taux ? `${l.taux} %` : <span style={{ color: 'var(--inkm)' }}>titre</span>}</td>
                      <td style={S.td}>{l.unite || '—'}</td>
                      <td style={S.td}>
                        {l.errs.map(e => <div key={e}><Note tone="err">{e}</Note></div>)}
                        {l.st === 'upd' && l.srv && (l.srv.old_taux ?? '') !== l.taux && (
                          <div>droit : <del style={{ color: '#C0392B' }}>{l.srv.old_taux ? `${l.srv.old_taux} %` : 'titre'}</del> → <ins style={{ color: '#1A7A40', textDecoration: 'none', fontWeight: 600 }}>{l.taux ? `${l.taux} %` : 'titre'}</ins></div>
                        )}
                        {l.st === 'upd' && l.srv && (l.srv.old_unite ?? '') !== l.unite && (
                          <div>unité : <del style={{ color: '#C0392B' }}>{l.srv.old_unite || '—'}</del> → <ins style={{ color: '#1A7A40', textDecoration: 'none', fontWeight: 600 }}>{l.unite || '—'}</ins></div>
                        )}
                        {!!l.srv?.remplace && <div><Note tone="warn">remplace {l.srv.remplace} ligne{l.srv.remplace > 1 ? 's' : ''} de ce code en base</Note></div>}
                        {l.warns.map(w => <div key={w}><Note tone="warn">{w}</Note></div>)}
                      </td>
                    </tr>))}
              </tbody>
            </table>
          </div>
          {(filter === 'repl' ? removed.length : shown.length) > PREVIEW_LIMIT && (
            <p style={{ fontSize: 11, color: 'var(--inkm)' }}>Affichage limité aux {PREVIEW_LIMIT} premières lignes de ce filtre ; toutes seront traitées.</p>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 14 }}>
            <button type="button" style={S.btn('primary', !nWrite || !!busy)} disabled={!nWrite || !!busy} onClick={apply}>
              Appliquer : {counts.new} ajout{counts.new > 1 ? 's' : ''}, {counts.upd} modification{counts.upd > 1 ? 's' : ''}{counts.removed ? `, ${counts.removed} fragment${counts.removed > 1 ? 's' : ''} remplacé${counts.removed > 1 ? 's' : ''}` : ''}
            </button>
            <button type="button" style={S.btn()} onClick={reset} disabled={!!busy}>← Modifier les lignes</button>
            <span style={{ fontSize: 11, color: 'var(--inkm)' }}>Les lignes en erreur ne sont pas écrites.</span>
          </div>
        </section>
      )}

      {step === 3 && done && (
        <section style={S.panel}>
          <h2 style={S.h2}>Mise à jour terminée</h2>
          <p style={{ margin: '0 0 10px', fontSize: 13 }}>
            <b>{done.new}</b> position{done.new > 1 ? 's' : ''} ajoutée{done.new > 1 ? 's' : ''} · <b>{done.upd}</b> modifiée{done.upd > 1 ? 's' : ''} ·
            {' '}{done.removed} fragment{done.removed > 1 ? 's' : ''} remplacé{done.removed > 1 ? 's' : ''} et archivé{done.removed > 1 ? 's' : ''} · {done.same} inchangée{done.same > 1 ? 's' : ''} ·
            {' '}{done.err} en erreur non écrite{done.err > 1 ? 's' : ''}.
          </p>
          <p style={{ fontSize: 11, color: 'var(--inkm)', margin: '0 0 12px' }}>Les anciennes valeurs sont conservées dans l’historique du tarif ; l’opération figure dans Journaux d’activité.</p>
          <button type="button" style={S.btn('primary')} onClick={() => { reset(); setPaste('') }}>Importer d’autres lignes</button>
        </section>
      )}
    </div>
  )
}
