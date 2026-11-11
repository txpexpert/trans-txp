// pages/partage/[token].tsx — vue client d'un dossier partagé par son transitaire (sans compte).
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Head from 'next/head'
import FicheView from '../../components/FicheView'

const STATUTS = [['pieces_attendues', 'Pièces attendues'], ['en_preparation', 'Déclaration en préparation'], ['depose', 'Déclaration déposée'], ['dedouane', 'Marchandise dédouanée'], ['clos', 'Dossier clos']]
const ETAT: Record<string, string> = { demandee: 'À transmettre', fournie: 'Transmise, en vérification', validee: 'Reçue et validée' }

export default function PartageClient() {
  const { query } = useRouter()
  const [d, setD] = useState<any>(null)
  const [err, setErr] = useState('')
  const [notes, setNotes] = useState<Record<number, string>>({})
  const [busy, setBusy] = useState<number | null>(null)
  useEffect(() => {
    if (!query.token) return
    fetch(`/api/partage/${query.token}`).then(async r => { const j = await r.json(); if (!r.ok) setErr(j.error || 'Lien invalide'); else setD(j) }).catch(() => setErr('Erreur réseau'))
  }, [query.token])
  async function transmise(i: number) {
    setBusy(i)
    const r = await fetch(`/api/partage/${query.token}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ index: i, note: notes[i] || null }) })
    const j = await r.json(); setBusy(null)
    if (r.ok) setD({ ...d, pieces: j.pieces }); else setErr(j.error)
  }
  const idx = d ? STATUTS.findIndex(s => s[0] === d.statut) : -1
  return (
    <div className="xs x-pt-page">
      <Head><title>{d ? `Dossier ${d.reference || ''} · ${d.transitaire}` : 'Votre dossier'}</title><meta name="robots" content="noindex,nofollow" /></Head>
      <header className="x-pt-hd"><div className="x-wrap"><b>{d?.transitaire || '…'}</b><span>Suivi de dossier</span></div></header>
      <main className="x-wrap" style={{ display: 'grid', gap: 18, padding: '26px 0 50px' }}>
        {err && <p className="x-ff-err">{err}</p>}
        {d && (
          <>
            <div>
              <h1 className="x-h1 x-h1-sm" style={{ margin: 0 }}>{d.client_nom}{d.reference ? <> · <em>{d.reference}</em></> : null}</h1>
              <p className="x-ff-note">Mis à jour le {new Date(d.maj).toLocaleString('fr-FR')}</p>
            </div>
            {d.message && <p className="x-pt-msg">{d.message}</p>}
            <ol className="x-pt-track">{STATUTS.map(([k, l], i) => <li key={k} className={i < idx ? 'ok' : i === idx ? 'on' : ''}>{l}</li>)}</ol>
            {(d.pieces || []).length > 0 && (
              <div className="x-ff">
                <h3 style={{ margin: '0 0 10px' }}>Pièces demandées</h3>
                <p className="x-ff-note" style={{ marginTop: 0 }}>Transmettez chaque pièce par votre canal habituel (email, PortNet…), puis signalez-la ici : votre transitaire est prévenu.</p>
                <ul className="x-pt-pieces">{d.pieces.map((x: any, i: number) => (
                  <li key={i} className={`e-${x.etat}`}>
                    <div><b>{x.nom}</b> <span className="x-pt-etat">{ETAT[x.etat]}</span>{x.note && <p>« {x.note} »</p>}</div>
                    {x.etat === 'demandee' && d.statut !== 'clos' && (
                      <div className="x-ff-row"><input placeholder="Précision (facultatif)" value={notes[i] || ''} onChange={e => setNotes({ ...notes, [i]: e.target.value })} />
                        <button type="button" className="x-btn x-btn-dark x-btn-sm" disabled={busy === i} onClick={() => transmise(i)}>{busy === i ? '…' : 'Je l’ai transmise'}</button></div>)}
                  </li>))}</ul>
              </div>)}
            {d.fiche && <><h3 style={{ margin: '8px 0 0' }}>Fiche produit</h3><FicheView f={d.fiche} /></>}
            <p className="x-note">Espace de suivi fourni par {d.transitaire} avec Import-eXPert.</p>
          </>
        )}
      </main>
    </div>
  )
}
