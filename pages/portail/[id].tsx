// pages/portail/[id].tsx — gestion d'un dossier client : statut, pièces (valider, ajouter), lien, notification.
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import SiteShell from '../../components/SiteShell'

const STATUTS = [['pieces_attendues', 'Pièces attendues'], ['en_preparation', 'Déclaration en préparation'], ['depose', 'Déclaration déposée'], ['dedouane', 'Marchandise dédouanée'], ['clos', 'Dossier clos']]
const ETAT: Record<string, string> = { demandee: 'Demandée', fournie: 'Transmise par le client', validee: 'Validée' }

export default function PartageAdmin() {
  const { query, push } = useRouter()
  const [p, setP] = useState<any>(null)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [nouvelle, setNouvelle] = useState('')
  const [origine, setOrigine] = useState('')
  useEffect(() => { setOrigine(window.location.origin) }, [])
  useEffect(() => {
    if (!query.id) return
    if (query.cree) setMsg(query.envoye ? 'Dossier ouvert : le lien a été envoyé au client.' : 'Dossier ouvert : copiez le lien ci-dessous pour le transmettre au client.')
    fetch(`/api/partages/${query.id}`, { credentials: 'same-origin' }).then(async r => { const j = await r.json(); if (!r.ok) setErr(j.error); else setP(j.partage) })
  }, [query.id])

  async function maj(changes: any, notifier = false) {
    const r = await fetch(`/api/partages/${p.id}`, { method: 'PATCH', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...changes, notifier }) })
    const j = await r.json()
    if (!r.ok) return setMsg(j.error || 'Mise à jour impossible')
    setP(j.partage); setMsg(notifier ? (j.envoye ? 'Enregistré, client prévenu par email.' : 'Enregistré (pas d’email client renseigné).') : 'Enregistré.')
  }
  const lien = p ? `${origine}/partage/${p.token}` : ''
  const pieces: any[] = p?.pieces || []
  return (
    <SiteShell title={`${p?.client_nom || 'Dossier client'} | Portail clients`}>
      <section className="x-sec-tight">
        <div className="x-wrap" style={{ display: 'grid', gap: 18 }}>
          <div className="x-crumb"><Link href="/portail">Portail clients</Link> / {p?.client_nom || '…'}</div>
          {err && <p className="x-ff-err">{err}</p>}
          {msg && <p className="x-ff-ok">{msg}</p>}
          {p && (
            <>
              <div className="x-ff">
                <h2 style={{ margin: '0 0 4px', fontFamily: 'var(--x-serif)', fontWeight: 400 }}>{p.client_nom}{p.reference ? ` · ${p.reference}` : ''}</h2>
                <p className="x-ff-note" style={{ marginTop: 0 }}>Produit : <Link href={`/fiches/${p.fiche_id}`}>{p.fiches_produits?.designation}</Link> · {p.vu_client_le ? `consulté par le client le ${new Date(p.vu_client_le).toLocaleString('fr-FR')}` : 'pas encore consulté par le client'}</p>
                <label style={{ marginTop: 12 }}>Lien personnel du client
                  <div className="x-ff-row"><input readOnly value={lien} onFocus={e => e.currentTarget.select()} style={{ flex: 1, minWidth: 260 }} />
                    <button type="button" className="x-btn x-btn-line x-btn-sm" onClick={() => { navigator.clipboard?.writeText(lien); setMsg('Lien copié.') }}>Copier</button>
                    <a className="x-btn x-btn-line x-btn-sm" href={lien} target="_blank" rel="noreferrer">Voir comme le client ↗</a></div></label>
                <h4 style={{ margin: '20px 0 8px' }}>Avancement</h4>
                <div className="x-pt-steps">{STATUTS.map(([k, l]) => (
                  <button key={k} type="button" className={p.statut === k ? 'on' : ''} onClick={() => maj({ statut: k }, true)}>{l}</button>))}</div>
                <p className="x-ff-note">Un clic change l’étape et prévient le client par email.</p>
              </div>
              <div className="x-ff">
                <h4 style={{ margin: '0 0 10px' }}>Pièces</h4>
                <ul className="x-pt-pieces">{pieces.map((x, i) => (
                  <li key={i} className={`e-${x.etat}`}>
                    <div><b>{x.nom}</b> <span className="x-pt-etat">{ETAT[x.etat]}</span>{x.note && <p>« {x.note} »</p>}</div>
                    <div className="x-ff-row">
                      {x.etat !== 'validee' && <button type="button" className="x-btn x-btn-dark x-btn-sm" onClick={() => maj({ pieces: pieces.map((y, j) => j === i ? { ...y, etat: 'validee', maj: new Date().toISOString() } : y) })}>Valider</button>}
                      {x.etat !== 'demandee' && <button type="button" className="x-btn x-btn-line x-btn-sm" onClick={() => maj({ pieces: pieces.map((y, j) => j === i ? { ...y, etat: 'demandee', note: null } : y) }, true)}>Redemander</button>}
                      <button type="button" className="x-btn x-btn-line x-btn-sm" aria-label="Retirer" onClick={() => maj({ pieces: pieces.filter((_, j) => j !== i) })}>✕</button>
                    </div>
                  </li>))}</ul>
                <div className="x-ff-doc"><input value={nouvelle} onChange={e => setNouvelle(e.target.value)} placeholder="Demander une pièce supplémentaire" />
                  <button type="button" className="x-btn x-btn-line x-btn-sm" onClick={() => { if (nouvelle.trim()) { maj({ pieces: [...pieces, { nom: nouvelle.trim(), etat: 'demandee' }] }, true); setNouvelle('') } }}>Demander</button></div>
              </div>
              <details className="x-fl-del"><summary className="x-btn x-btn-line">Supprimer le dossier</summary>
                <p>Le lien du client cessera de fonctionner. <button type="button" className="x-btn x-btn-dark x-btn-sm" onClick={async () => { const r = await fetch(`/api/partages/${p.id}`, { method: 'DELETE', credentials: 'same-origin' }); if (r.ok) push('/portail') }}>Confirmer</button></p></details>
            </>
          )}
        </div>
      </section>
    </SiteShell>
  )
}
