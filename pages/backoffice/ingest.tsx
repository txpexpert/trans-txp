// pages/backoffice/ingest.tsx
import { useState, useCallback } from 'react'
import type { GetServerSideProps } from 'next'
import { requireAdminSSR } from '../../lib/adminAuth'
import Head                 from 'next/head'
import BackofficeLayout     from '../../components/BackofficeLayout'

interface IngestResult {
  fichier:          string
  type:            'pdf' | 'circulaires' | 'notes' | 'faq' | 'tarifs' | 'procedures' | 'glossaire'
  status:          'success' | 'error' | 'skipped'
  numero?:          string
  chunksInserted?:  number   // PDF : nb chunks / JSON : nb doublons ignorés
  entriesInserted?: number   // JSON : nb entrées insérées
  error?:           string
}

interface IngestResponse {
  summary: { total: number; success: number; skipped: number; errors: number }
  results: IngestResult[]
}

const MAX_FILES = 20

// ── Labels et couleurs des types JSON ─────────────────────────────────────────
const TYPE_META: Record<string, { label: string; color: string; bg: string }> = {
  pdf:          { label: 'PDF',          color: '#C9A84C', bg: '#FBF5E6' },
  circulaires:  { label: 'Circulaires',  color: '#2563eb', bg: '#eff6ff' },
  notes:        { label: 'Notes',        color: '#4f46e5', bg: '#eef2ff' },
  faq:          { label: 'FAQ',          color: '#7c3aed', bg: '#f5f3ff' },
  tarifs:       { label: 'Tarifs',       color: '#059669', bg: '#ecfdf5' },
  procedures:   { label: 'Procédures',   color: '#d97706', bg: '#fffbeb' },
  glossaire:    { label: 'Glossaire',    color: '#db2777', bg: '#fdf2f8' },
  decisions:    { label: 'Décisions',    color: '#0891b2', bg: '#ecfeff' },
}

function getFileType(filename: string): 'pdf' | 'json' {
  return filename.toLowerCase().endsWith('.json') ? 'json' : 'pdf'
}

export const getServerSideProps: GetServerSideProps = requireAdminSSR

export default function BackofficeIngest() {
  const [files,    setFiles]    = useState<File[]>([])
  const [loading,  setLoading]  = useState(false)
  const [response, setResponse] = useState<IngestResponse | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = Array.from(e.dataTransfer.files).filter(f => {
      const n = f.name.toLowerCase()
      return n.endsWith('.pdf') || n.endsWith('.json')
    })
    setFiles(p => [...p, ...dropped].slice(0, MAX_FILES))
  }, [])

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? [])
    setFiles(p => [...p, ...selected].slice(0, MAX_FILES))
  }

  const removeFile = (idx: number) => setFiles(p => p.filter((_, i) => i !== idx))

  const handleUpload = async () => {
    if (!files.length) return
    setLoading(true)
    setResponse(null)
    const form = new FormData()
    files.forEach(f => form.append('files', f))
    try {
      const res  = await fetch('/api/ingest', { method: 'POST', body: form })
      const data: IngestResponse = await res.json()
      setResponse(data)
      if (data.summary.errors === 0) setFiles([])
    } catch {
      alert('Erreur réseau — vérifiez le terminal.')
    } finally {
      setLoading(false)
    }
  }

  const pdfCount  = files.filter(f => getFileType(f.name) === 'pdf').length
  const jsonCount = files.filter(f => getFileType(f.name) === 'json').length
  const totalSize = (files.reduce((s, f) => s + f.size, 0) / 1024 / 1024).toFixed(1)

  const statusIcon = (r: IngestResult) =>
    r.status === 'success' ? '✅' : r.status === 'skipped' ? '⏭' : '❌'

  const summaryBg = () =>
    !response ? '#f0fdf4'
    : response.summary.errors > 0 ? '#fff1f2'
    : response.summary.skipped === response.summary.total ? '#fffbeb'
    : '#f0fdf4'

  return (
    <>
      <Head><title>Ingestion — Backoffice Transit-IA</title></Head>
      <BackofficeLayout title="Ingestion de données">
        <div style={{ maxWidth: 720 }}>

          {/* ── Formats supportés ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: '1.5rem' }}>
            {[
              { icon: '📄', label: 'PDF Circulaires', sub: 'Extraction Anthropic + chunking', color: '#C9A84C' },
              { icon: '🗂️', label: 'JSON Structuré',  sub: 'Insertion directe + embedding',  color: '#2563eb' },
              { icon: '🔄', label: 'Mix PDF + JSON',  sub: 'Traitement automatique par type', color: '#059669' },
            ].map((f, i) => (
              <div key={i} style={{ padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fafafa' }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{f.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: f.color }}>{f.label}</div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{f.sub}</div>
              </div>
            ))}
          </div>

          {/* ── Schémas JSON ── */}
          <details style={{ marginBottom: '1.5rem', border: '1px solid #e5e7eb', borderRadius: 6 }}>
            <summary style={{ padding: '10px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151', listStyle: 'none' }}>
              📋 Schémas JSON acceptés — cliquer pour voir
            </summary>
            <div style={{ padding: '0 14px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
              {[
                { type: 'circulaires', fields: 'numero*, titre*, objet, date, texte*' },
                { type: 'faq',         fields: 'question*, reponse*, categorie, tags[]' },
                { type: 'tarifs',      fields: 'code_sh*, designation*, taux_di, tva, tic' },
                { type: 'procedures',  fields: 'code*, titre*, texte*, etapes[]' },
                { type: 'glossaire',   fields: 'terme*, definition*, domaine, synonymes[]' },
                { type: 'decisions',   fields: 'designation*, code_sh*, circulaire' },
              ].map(s => {
                const m = TYPE_META[s.type]
                return (
                  <div key={s.type} style={{ padding: '8px 10px', background: m.bg, border: `1px solid ${m.color}30`, borderRadius: 4 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: m.color, marginBottom: 3 }}>
                      {`{ "type": "${s.type}" }`}
                    </div>
                    <div style={{ fontSize: 10, color: '#6b7280', fontFamily: 'monospace' }}>
                      entries[]: {s.fields}
                    </div>
                    <div style={{ fontSize: 9, color: '#9ca3af', marginTop: 2 }}>* = obligatoire</div>
                  </div>
                )
              })}
            </div>
          </details>

          {/* ── Zone dépôt ── */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => document.getElementById('file-input')?.click()}
            style={{
              border: `2px dashed ${dragOver ? '#C9A84C' : '#d1d5db'}`,
              borderRadius: 8, padding: '2.5rem', textAlign: 'center', cursor: 'pointer',
              background: dragOver ? '#fffbeb' : '#fafafa', transition: 'all .15s', marginBottom: '1rem',
            }}
          >
            <input id="file-input" type="file" accept=".pdf,.json" multiple onChange={onFileInput} style={{ display: 'none' }} />
            <div style={{ fontSize: 36, marginBottom: 12 }}>📂</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: dragOver ? '#92400e' : '#6b7280', marginBottom: 6 }}>
              Déposez vos fichiers ici
            </div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>
              PDF (circulaires) · JSON (circulaires, faq, tarifs, procédures, glossaire) · max {MAX_FILES} fichiers
            </div>
          </div>

          {/* ── Liste fichiers ── */}
          {files.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#6b7280' }}>
                  <span>{files.length} fichier{files.length > 1 ? 's' : ''} · {totalSize} MB</span>
                  {pdfCount  > 0 && <span style={{ color: '#C9A84C' }}>📄 {pdfCount} PDF</span>}
                  {jsonCount > 0 && <span style={{ color: '#2563eb' }}>🗂️ {jsonCount} JSON</span>}
                </div>
                <button onClick={() => setFiles([])} style={{ fontSize: 11, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Tout supprimer
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {files.map((f, i) => {
                  const isJson = getFileType(f.name) === 'json'
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'white', border: `1px solid ${isJson ? '#dbeafe' : '#e5e7eb'}`, borderRadius: 4 }}>
                      <span>{isJson ? '🗂️' : '📄'}</span>
                      <span style={{ flex: 1, fontSize: 12, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                      <span style={{ fontSize: 9, letterSpacing: '.08em', padding: '2px 6px', borderRadius: 10, background: isJson ? '#dbeafe' : '#FBF5E6', color: isJson ? '#2563eb' : '#C9A84C', flexShrink: 0 }}>
                        {isJson ? 'JSON' : 'PDF'}
                      </span>
                      <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0 }}>{(f.size / 1024).toFixed(0)} KB</span>
                      <button onClick={() => removeFile(i)} style={{ color: '#9ca3af', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}>✕</button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Bouton ── */}
          <button
            onClick={handleUpload}
            disabled={loading || files.length === 0}
            style={{
              width: '100%', padding: '14px', marginBottom: '2rem', borderRadius: 6,
              background: loading || files.length === 0 ? '#d1d5db' : 'var(--bd)',
              color: loading || files.length === 0 ? '#9ca3af' : 'white',
              fontSize: 13, letterSpacing: '.04em', border: 'none',
              cursor: loading || files.length === 0 ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', fontWeight: 500, transition: 'all .15s',
            }}
          >
            {loading
              ? '⏳ Traitement en cours…'
              : `🚀 Lancer l'ingestion — ${files.length} fichier${files.length > 1 ? 's' : ''} (${pdfCount} PDF · ${jsonCount} JSON)`}
          </button>

          {/* ── Résultats ── */}
          {response && (
            <div>
              <div style={{
                background: summaryBg(), border: '1px solid #e5e7eb', borderRadius: 6,
                padding: '1rem 1.25rem', marginBottom: '1rem',
                display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12,
              }}>
                {[
                  { label: 'Total',    val: response.summary.total,   color: '#374151' },
                  { label: 'Succès',   val: response.summary.success,  color: '#059669' },
                  { label: 'Doublons', val: response.summary.skipped,  color: '#d97706' },
                  { label: 'Erreurs',  val: response.summary.errors,   color: '#dc2626' },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.val}</div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {response.results.map((r, i) => {
                  const m = TYPE_META[r.type] ?? TYPE_META['pdf']
                  const bg     = r.status === 'success' ? '#f9fafb' : r.status === 'skipped' ? '#fffbeb' : '#fff1f2'
                  const border = r.status === 'success' ? '#e5e7eb' : r.status === 'skipped' ? '#fcd34d' : '#fecaca'
                  return (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '28px 1fr auto', gap: 10, alignItems: 'center', padding: '10px 12px', background: bg, border: `1px solid ${border}`, borderRadius: 4 }}>
                      <span style={{ fontSize: 16, textAlign: 'center' }}>{statusIcon(r)}</span>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: 9, padding: '1px 6px', background: m.bg, color: m.color, borderRadius: 10, fontWeight: 700 }}>{m.label}</span>
                          <span style={{ fontSize: 12, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.fichier}</span>
                        </div>
                        {r.numero && <div style={{ fontSize: 11, color: '#6b7280' }}>N° {r.numero}</div>}
                        {r.error  && <div style={{ fontSize: 11, color: '#dc2626' }}>{r.error}</div>}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 60 }}>
                        {r.entriesInserted != null && (
                          <>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#059669' }}>{r.entriesInserted}</div>
                            <div style={{ fontSize: 10, color: '#9ca3af' }}>insérées</div>
                          </>
                        )}
                        {r.chunksInserted != null && r.type === 'pdf' && (
                          <>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#059669' }}>{r.chunksInserted}</div>
                            <div style={{ fontSize: 10, color: '#9ca3af' }}>chunks</div>
                          </>
                        )}
                        {r.status === 'skipped' && (
                          <div style={{ fontSize: 11, color: '#d97706' }}>DOUBLON</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </BackofficeLayout>
    </>
  )
}
