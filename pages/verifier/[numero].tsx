// pages/verifier/[numero].tsx — vérification publique d'un dossier défendable (sans compte).
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import SiteShell from '../../components/SiteShell'

const fmtSh = (c?: string | null) => (c && c.length === 10 ? `${c.slice(0, 4)}.${c.slice(4, 6)}.${c.slice(6, 8)}.${c.slice(8)}` : c || '—')

export default function Verifier() {
  const { query, push } = useRouter()
  const [r, setR] = useState<any>(null)
  const [err, setErr] = useState('')
  const [saisie, setSaisie] = useState('')
  const [hash, setHash] = useState('')
  useEffect(() => {
    const n = String(query.numero || '')
    if (!n || n === 'index') return
    setR(null); setErr('')
    fetch(`/api/verifier/${encodeURIComponent(n)}`).then(async x => {
      const j = await x.json()
      if (x.status === 404) setErr('Aucun dossier ne porte ce numéro.')
      else if (!x.ok) setErr(j.error || 'Vérification impossible')
      else setR(j)
    }).catch(() => setErr('Erreur réseau'))
  }, [query.numero])
  const compare = hash.trim().toLowerCase()
  return (
    <SiteShell title="Vérifier un dossier | IXP-Import-eXPert" description="Vérifiez l’authenticité et l’intégrité d’un dossier défendable Import-eXPert.">
      <section className="x-hero" style={{ paddingBottom: 18 }}>
        <div className="x-wrap">
          <div className="x-eyebrow">Vérification</div>
          <h1 className="x-h1 x-h1-sm">Vérifier un <em>dossier défendable</em></h1>
          <p className="x-lead">Saisissez le numéro inscrit sur le dossier. La page indique s’il a bien été émis, à quelle date, pour quel titulaire, et si son contenu est resté intact.</p>
          <form className="x-ff-row" style={{ marginTop: 16 }} onSubmit={e => { e.preventDefault(); if (saisie.trim()) push(`/verifier/${saisie.trim().toUpperCase()}`) }}>
            <input className="x-vf-in" value={saisie} onChange={e => setSaisie(e.target.value)} placeholder="IXP-AAAAMMJJ-XXXXXX" />
            <button className="x-btn x-btn-dark" type="submit">Vérifier</button>
          </form>
        </div>
      </section>
      <section className="x-sec-tight" style={{ paddingTop: 0 }}>
        <div className="x-wrap">
          {err && <p className="x-ff-err">{err}</p>}
          {r && (
            <div className={`x-vf ${r.statut === 'emis' && r.integre ? 'ok' : 'ko'}`}>
              <h2>{r.statut === 'annule' ? 'Dossier annulé par son titulaire' : r.integre ? 'Dossier authentique et intact' : 'Contenu altéré : ne pas se fier à ce dossier'}</h2>
              <dl>
                <dt>Numéro</dt><dd className="mono">{r.numero}</dd>
                <dt>Émis le</dt><dd>{new Date(r.emis_le).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'medium', timeZone: 'Africa/Casablanca' })} (heure de Casablanca)</dd>
                <dt>Titulaire</dt><dd>{r.titulaire || '—'}</dd>
                <dt>Dossier</dt><dd>{r.titre} · {r.type === 'operation' ? 'par opération' : 'par produit'}</dd>
                <dt>Produits</dt><dd>{r.produits.map((p: any) => `${p.designation} (${fmtSh(p.code_sh)})`).join(' ; ')}</dd>
                <dt>Empreinte</dt><dd className="mono" style={{ wordBreak: 'break-all' }}>{r.empreinte}</dd>
              </dl>
              <label className="x-vf-cmp">Comparer avec l’empreinte imprimée sur votre exemplaire
                <input value={hash} onChange={e => setHash(e.target.value)} placeholder="Collez l’empreinte du document" /></label>
              {compare && <p className={compare === r.empreinte ? 'x-ff-ok' : 'x-ff-err'}>{compare === r.empreinte ? 'Les empreintes correspondent : votre exemplaire est celui qui a été émis.' : 'Les empreintes diffèrent : votre exemplaire ne correspond pas au dossier émis.'}</p>}
            </div>
          )}
          <p className="x-note">La vérification confirme l’émission et l’intégrité du dossier. Elle ne vaut pas validation de son contenu par une administration. <Link href="/">Import-eXPert</Link></p>
        </div>
      </section>
    </SiteShell>
  )
}
