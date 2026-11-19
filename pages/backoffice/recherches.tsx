// pages/backoffice/recherches.tsx — « Recherche et dissertation » : relecture des brouillons,
// correction, publication au client (Mon espace + e-mail) ou refus motivé.
import type { GetServerSideProps } from 'next'
import { useEffect, useState } from 'react'
import { requireAdminSSR } from '../../lib/adminAuth'
import BackofficeLayout from '../../components/BackofficeLayout'

export const getServerSideProps: GetServerSideProps = async ctx => {
  const auth = await requireAdminSSR(ctx)
  if ('redirect' in auth) return auth
  return { props: {} }
}

const STATUTS: Record<string, string> = { generation: 'Rédaction en cours', a_valider: 'À valider', publiee: 'Publiée', rejetee: 'Refusée', erreur: 'Erreur' }
const COUL: Record<string, string> = { generation: '#6B7280', a_valider: '#B45309', publiee: '#166534', rejetee: '#1E3A8A', erreur: '#B91C1C' }
const qui = (u: any) => (u ? [u.prenom, u.nom].filter(Boolean).join(' ') || u.email : '—') + (u?.societe ? ` · ${u.societe}` : '')
const dt = (s: string | null) => (s ? new Date(s).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '')

export default function Recherches() {
  const [filtre, setFiltre] = useState('')
  const [liste, setListe] = useState<any[]>([])
  const [fiche, setFiche] = useState<any>(null)
  const [texte, setTexte] = useState('')
  const [note, setNote] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const charger = () => fetch(`/api/admin/recherches${filtre ? `?statut=${filtre}` : ''}`, { credentials: 'include' }).then(r => r.json()).then(j => setListe(j.demandes || []))
  useEffect(() => { charger() }, [filtre])
  useEffect(() => { const id = new URLSearchParams(location.search).get('id'); if (id) ouvrir(id) }, [])

  async function ouvrir(id: string) {
    setMsg('')
    const r = await fetch(`/api/admin/recherches?id=${id}`, { credentials: 'include' })
    if (!r.ok) return setMsg('Demande introuvable')
    const d = await r.json(); setFiche(d); setTexte(d.brouillon || ''); setNote(d.note_client || '')
  }
  async function agir(action: string) {
    if (action === 'rejeter' && !note.trim()) return setMsg('Indiquez au client, dans le message, pourquoi la demande n’est pas traitée.')
    setBusy(true); setMsg('')
    const r = await fetch('/api/admin/recherches', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, id: fiche.id, texte, note }) })
    const j = await r.json().catch(() => ({})); setBusy(false)
    if (!r.ok) return setMsg(`⚠ ${j.error || 'Erreur'}`)
    setMsg(action === 'enregistrer' ? 'Brouillon enregistré.'
      : action === 'regenerer' ? 'Nouveau brouillon en cours de rédaction (quelques minutes).'
      : `Enregistré. Visible par le client à partir du ${dt(j.visible_apres)} ; il sera avisé par e-mail.`)
    charger(); if (action !== 'regenerer') ouvrir(fiche.id)
  }

  return (
    <BackofficeLayout title="Recherche et dissertation">
      <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: 'var(--bd)', marginBottom: 4 }}>Recherche et dissertation</h1>
      <p style={{ fontSize: 13, color: 'var(--inkm)', marginBottom: 16 }}>Demandes posées dans l’assistant de recherche (Conseil personnalisé › Consultation express). Un brouillon est rédigé à partir des textes de la base ; relisez-le, corrigez-le, puis publiez-le. Le client le voit dans « Mon espace » 1 h à 2 h après sa demande, avec un e-mail d’avis.</p>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {[['', 'Toutes'], ...Object.entries(STATUTS)].map(([k, l]) => (
          <button key={k} onClick={() => setFiltre(k)} style={{ padding: '5px 12px', fontSize: 12, border: '1px solid #ddd', borderRadius: 999, cursor: 'pointer', background: filtre === k ? '#0A0A0A' : '#fff', color: filtre === k ? '#E8C97A' : '#333' }}>{l}</button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: fiche ? 'minmax(280px, 38%) 1fr' : '1fr', gap: 16, alignItems: 'start' }}>
        <table className="data-table"><thead><tr><th>Demande</th><th>Client</th><th>Statut</th></tr></thead><tbody>
          {liste.map(d => (
            <tr key={d.id} onClick={() => ouvrir(d.id)} style={{ cursor: 'pointer', background: fiche?.id === d.id ? '#FBF5E6' : undefined }}>
              <td style={{ fontSize: 12.5 }}>{d.question.slice(0, 140)}{d.question.length > 140 ? '…' : ''}<br /><small style={{ color: '#888' }}>{dt(d.created_at)}</small></td>
              <td style={{ fontSize: 12 }}>{qui(d.users)}</td>
              <td style={{ fontSize: 12, fontWeight: 600, color: COUL[d.statut] }}>{STATUTS[d.statut]}</td>
            </tr>
          ))}
          {!liste.length && <tr><td colSpan={3} style={{ color: '#888', fontSize: 13 }}>Aucune demande.</td></tr>}
        </tbody></table>

        {fiche && (
          <div style={{ background: '#fff', border: '1px solid #e5e5e5', padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <b style={{ color: COUL[fiche.statut] }}>{STATUTS[fiche.statut]}</b>
              <button onClick={() => setFiche(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            <p style={{ fontSize: 12, color: '#666', margin: '4px 0 10px' }}>{qui(fiche.users)} · demandée le {dt(fiche.created_at)} · visible à partir du {dt(fiche.visible_apres)}{fiche.publie_par ? ` · traitée par ${fiche.publie_par}` : ''}</p>
            <div style={{ background: '#F9F8F4', padding: 12, fontSize: 13.5, marginBottom: 12 }}><b>Question :</b> {fiche.question}</div>
            {fiche.erreur && <p style={{ color: '#B91C1C', fontSize: 12.5 }}>Erreur : {fiche.erreur}</p>}
            {fiche.statut === 'generation' ? <p style={{ fontSize: 13 }}>Brouillon en cours de rédaction… <button onClick={() => ouvrir(fiche.id)}>Actualiser</button></p> : (
              <>
                <label style={{ fontSize: 11, letterSpacing: '.08em', color: '#888' }}>TEXTE DE L’ÉTUDE (modifiable)</label>
                <textarea value={texte} onChange={e => setTexte(e.target.value)} style={{ width: '100%', minHeight: 420, fontFamily: 'Georgia, serif', fontSize: 13.5, lineHeight: 1.6, padding: 10, border: '1px solid #ddd', marginTop: 4 }} />
                <label style={{ fontSize: 11, letterSpacing: '.08em', color: '#888', display: 'block', marginTop: 10 }}>MESSAGE AU CLIENT (facultatif ; obligatoire pour un refus)</label>
                <textarea value={note} onChange={e => setNote(e.target.value)} style={{ width: '100%', minHeight: 60, fontSize: 13, padding: 8, border: '1px solid #ddd', marginTop: 4 }} />
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                  {['a_valider', 'publiee'].includes(fiche.statut) && <button disabled={busy} onClick={() => agir('publier')} style={{ padding: '8px 16px', background: '#0A0A0A', color: '#E8C97A', border: 'none', cursor: 'pointer' }}>{fiche.statut === 'publiee' ? 'Republier la version corrigée' : 'Valider et publier'}</button>}
                  {['a_valider', 'publiee'].includes(fiche.statut) && <button disabled={busy} onClick={() => agir('enregistrer')} style={{ padding: '8px 16px', cursor: 'pointer' }}>Enregistrer le brouillon</button>}
                  {['a_valider', 'erreur'].includes(fiche.statut) && <button disabled={busy} onClick={() => agir('regenerer')} style={{ padding: '8px 16px', cursor: 'pointer' }}>Rédiger un nouveau brouillon</button>}
                  {['a_valider', 'erreur'].includes(fiche.statut) && <button disabled={busy} onClick={() => agir('rejeter')} style={{ padding: '8px 16px', cursor: 'pointer', color: '#B91C1C' }}>Refuser (avec message)</button>}
                </div>
              </>
            )}
            {msg && <p style={{ fontSize: 12.5, marginTop: 10 }}>{msg}</p>}
            {Array.isArray(fiche.sources) && fiche.sources.length > 0 && (
              <details style={{ marginTop: 14 }}><summary style={{ fontSize: 12.5, cursor: 'pointer' }}>Textes retenus ({fiche.sources.length})</summary>
                <ol style={{ fontSize: 12, paddingLeft: 18 }}>{fiche.sources.map((s: any, i: number) => <li key={i} style={{ marginBottom: 6 }}><b>{s.titre}</b><br /><span style={{ color: '#777' }}>{s.extrait}</span></li>)}</ol>
              </details>
            )}
          </div>
        )}
      </div>
    </BackofficeLayout>
  )
}
