// pages/portail/index.tsx — portail transitaire : dossiers partagés avec les clients, et ouverture d'un nouveau dossier.
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import SiteShell from '../../components/SiteShell'

const LIB: Record<string, string> = { pieces_attendues: 'Pièces attendues', en_preparation: 'En préparation', depose: 'Déposée', dedouane: 'Dédouanée', clos: 'Clos' }

export default function Portail() {
  const router = useRouter()
  const [etat, setEtat] = useState<'charge' | 'ok' | 'abonnement' | 'connexion'>('charge')
  const [partages, setPartages] = useState<any[]>([])
  const [fiches, setFiches] = useState<any[]>([])
  const [f, setF] = useState<any>({ envoyer: true })
  const [pieces, setPieces] = useState<string[]>([])
  const [nouvelle, setNouvelle] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    Promise.all([fetch('/api/partages', { credentials: 'same-origin' }), fetch('/api/fiches', { credentials: 'same-origin' })]).then(async ([a, b]) => {
      if (a.status === 401) return setEtat('connexion')
      if (a.status === 403) return setEtat('abonnement')
      setPartages((await a.json()).partages || []); setFiches((await b.json()).fiches || []); setEtat('ok')
    }).catch(() => setEtat('connexion'))
  }, [])

  async function choisirFiche(id: string) {
    setF((x: any) => ({ ...x, fiche_id: id }))
    if (!id) return setPieces([])
    const r = await fetch(`/api/fiches/${id}`, { credentials: 'same-origin' })
    const j = await r.json()
    const docs = (j.fiche?.documents || []).filter((d: any) => d.statut !== 'recommande').map((d: any) => d.nom)
    setPieces(docs.filter((d: string) => !/DUM/i.test(d)))
  }

  async function ouvrir() {
    setErr('')
    if (!f.fiche_id) return setErr('Choisissez la fiche produit du dossier.')
    if (!f.client_nom) return setErr('Indiquez le nom du client.')
    setBusy(true)
    try {
      const r = await fetch('/api/partages', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, pieces: pieces.map(nom => ({ nom, etat: 'demandee' })) }) })
      const j = await r.json()
      if (!r.ok) return setErr(j.error || 'Création impossible')
      router.push(`/portail/${j.partage.id}?cree=1${j.envoye ? '&envoye=1' : ''}`)
    } catch { setErr('Erreur réseau') } finally { setBusy(false) }
  }

  const aValider = (p: any) => (p.pieces || []).filter((x: any) => x.etat === 'fournie').length
  return (
    <SiteShell title="Portail clients | IXP-Import-eXPert">
      <section className="x-hero" style={{ paddingBottom: 18 }}>
        <div className="x-wrap">
          <div className="x-eyebrow">Transitaires · Portail clients</div>
          <h1 className="x-h1 x-h1-sm">Vos clients suivent leur dossier, <em>à votre nom</em></h1>
          <p className="x-lead">Partagez la fiche produit avec votre client, demandez les pièces manquantes et tenez-le informé de l’avancement. Il accède à son dossier par un lien personnel, sans créer de compte.</p>
        </div>
      </section>
      <section className="x-sec-tight" style={{ paddingTop: 0 }}>
        <div className="x-wrap" style={{ display: 'grid', gap: 22 }}>
          {etat === 'charge' && <p className="x-note">Chargement…</p>}
          {etat === 'connexion' && <div className="x-pc-cta"><p>Connectez-vous pour accéder au portail.</p><Link href="/auth/login?redirect=/portail" className="x-btn x-btn-gold">Connexion</Link></div>}
          {etat === 'abonnement' && <div className="x-pc-cta"><p>Le portail clients est inclus dans l’essai et les offres payantes.</p><Link href="/auth/register?plan=pro" className="x-btn x-btn-gold">Essai 14 jours</Link></div>}
          {etat === 'ok' && (
            <>
              <div className="x-ff">
                <h3 style={{ margin: '0 0 14px' }}>Ouvrir un dossier client</h3>
                {fiches.length === 0 ? <p>Le dossier client part d’une fiche produit. <Link href="/fiches/nouvelle">Créer une fiche</Link></p> : (
                  <>
                    <div className="x-ff-grid">
                      <label>Fiche produit *<select value={f.fiche_id || ''} onChange={e => choisirFiche(e.target.value)}>
                        <option value="">Choisir…</option>{fiches.map(x => <option key={x.id} value={x.id}>{x.designation}{x.code_sh ? ` · ${x.code_sh}` : ''}</option>)}</select></label>
                      <label>Référence du dossier<input value={f.reference || ''} onChange={e => setF({ ...f, reference: e.target.value })} placeholder="Ex. : TR-2026-0412" /></label>
                      <label>Client *<input value={f.client_nom || ''} onChange={e => setF({ ...f, client_nom: e.target.value })} placeholder="Raison sociale du client" /></label>
                      <label>Email du client<input value={f.client_email || ''} onChange={e => setF({ ...f, client_email: e.target.value })} placeholder="pour lui envoyer le lien" /></label>
                      <label className="wide">Message au client<textarea rows={2} value={f.message || ''} onChange={e => setF({ ...f, message: e.target.value })} placeholder="Ex. : merci de nous transmettre les pièces ci-dessous avant l’arrivée du navire." /></label>
                      <div className="wide">
                        <h4>Pièces demandées</h4>
                        {pieces.map((p, i) => <div className="x-ff-doc" key={i}><input value={p} onChange={e => setPieces(pieces.map((x, j) => j === i ? e.target.value : x))} /><button type="button" aria-label="Retirer" onClick={() => setPieces(pieces.filter((_, j) => j !== i))}>✕</button></div>)}
                        <div className="x-ff-doc"><input value={nouvelle} onChange={e => setNouvelle(e.target.value)} placeholder="Ajouter une pièce (certificat d’origine, fiche technique…)" />
                          <button type="button" className="x-btn x-btn-line x-btn-sm" onClick={() => { if (nouvelle.trim()) { setPieces([...pieces, nouvelle.trim()]); setNouvelle('') } }}>Ajouter</button></div>
                        <p className="x-ff-note">La liste reprend les documents de la fiche ; complétez-la selon l’opération.</p>
                      </div>
                      <label className="x-ff-chk wide"><input type="checkbox" checked={!!f.envoyer} onChange={e => setF({ ...f, envoyer: e.target.checked })} /> Envoyer le lien au client par email (si l’adresse est renseignée)</label>
                    </div>
                    {err && <p className="x-ff-err" style={{ marginTop: 12 }}>{err}</p>}
                    <div className="x-ff-nav"><button type="button" className="x-btn x-btn-dark" disabled={busy} onClick={ouvrir}>{busy ? 'Ouverture…' : 'Ouvrir le dossier'}</button></div>
                  </>
                )}
              </div>
              {partages.length > 0 && (
                <table className="x-fl"><thead><tr><th>Client</th><th>Référence</th><th>Produit</th><th>Statut</th><th>Pièces</th><th>Vu par le client</th></tr></thead><tbody>
                  {partages.map(p => {
                    const tot = (p.pieces || []).length, ok = (p.pieces || []).filter((x: any) => x.etat === 'validee').length, av = aValider(p)
                    return <tr key={p.id}>
                      <td><Link href={`/portail/${p.id}`}><b>{p.client_nom}</b></Link></td><td>{p.reference || '—'}</td>
                      <td>{p.fiches_produits?.designation || '—'}</td><td>{LIB[p.statut]}</td>
                      <td>{ok}/{tot} validée{ok > 1 ? 's' : ''}{av ? <span className="x-fl-st" style={{ marginLeft: 6 }}>{av} à valider</span> : null}</td>
                      <td>{p.vu_client_le ? new Date(p.vu_client_le).toLocaleDateString('fr-FR') : 'pas encore'}</td>
                    </tr>
                  })}
                </tbody></table>)}
            </>
          )}
        </div>
      </section>
    </SiteShell>
  )
}
