import { useState } from 'react'
import type { GetServerSideProps } from 'next'
import { requireAdminSSR } from '../../lib/adminAuth'
import BackofficeLayout from '../../components/BackofficeLayout'

export const getServerSideProps: GetServerSideProps = requireAdminSSR

export default function BackofficeDecisions() {
  const [designation, setDesignation] = useState('')
  const [codeSh, setCodeSh] = useState('')
  const [circulaire, setCirculaire] = useState('')
  const [resume, setResume] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'error' | 'doublon'; text: string } | null>(null)

  const submit = async () => {
    if (!designation.trim() || !codeSh.trim()) {
      setMessage({ type: 'error', text: 'Désignation et code SH sont obligatoires.' })
      return
    }
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/quick-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'decisions',
          entry: {
            designation: designation.trim(),
            code_sh: codeSh.trim(),
            circulaire: circulaire.trim(),
            resume: resume.trim() || null,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) { setMessage({ type: 'error', text: data.error || 'Erreur inconnue' }); return }
      if (data.doublon) { setMessage({ type: 'doublon', text: 'Cette décision existe déjà — ignorée.' }); return }
      setMessage({ type: 'ok', text: 'Décision ajoutée avec succès.' })
      setDesignation(''); setCodeSh(''); setCirculaire(''); setResume('')
    } catch {
      setMessage({ type: 'error', text: 'Erreur réseau — réessayez.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <BackofficeLayout title="Décisions de Classement">
      <div style={{ maxWidth: 560 }}>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: '1.5rem' }}>
          Ajoutez une décision de classement à la volée. Pour un import groupé (plusieurs
          décisions à la fois), utilisez la page <a href="/backoffice/ingest" style={{ color: '#0891b2' }}>Ingestion</a> avec
          un fichier JSON de type <code>decisions</code>.
        </p>

        <div style={{ display: 'grid', gap: '1rem', border: '1px solid #e5e7eb', borderRadius: 8, padding: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.05em' }}>
              Désignation du produit *
            </label>
            <input
              value={designation}
              onChange={e => setDesignation(e.target.value)}
              placeholder="ex : Absorbent Paper Points"
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.05em' }}>
              Code SH * <span style={{ textTransform: 'none', fontWeight: 400 }}>(10 chiffres, sans points)</span>
            </label>
            <input
              value={codeSh}
              onChange={e => setCodeSh(e.target.value)}
              placeholder="ex : 3005909019"
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, fontFamily: 'monospace' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.05em' }}>
              Circulaire de référence
            </label>
            <input
              value={circulaire}
              onChange={e => setCirculaire(e.target.value)}
              placeholder="ex : 6296/232"
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.05em' }}>
              Résumé
            </label>
            <textarea
              value={resume}
              onChange={e => setResume(e.target.value)}
              placeholder="2-3 phrases : nature du produit, usage, motif de classement (RGI, note de chapitre...)"
              rows={4}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>

          {message && (
            <div style={{
              padding: '10px 14px', borderRadius: 6, fontSize: 13,
              background: message.type === 'ok' ? '#ecfdf5' : message.type === 'doublon' ? '#fffbeb' : '#fef2f2',
              color: message.type === 'ok' ? '#059669' : message.type === 'doublon' ? '#d97706' : '#dc2626',
              border: `1px solid ${message.type === 'ok' ? '#a7f3d0' : message.type === 'doublon' ? '#fde68a' : '#fecaca'}`,
            }}>
              {message.text}
            </div>
          )}

          <button
            onClick={submit}
            disabled={loading}
            style={{
              padding: '10px 20px', background: loading ? '#9ca3af' : '#0891b2', color: '#fff',
              border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Ajout en cours…' : 'Ajouter la décision'}
          </button>
        </div>
      </div>
    </BackofficeLayout>
  )
}
