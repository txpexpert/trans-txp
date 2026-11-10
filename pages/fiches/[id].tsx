// pages/fiches/[id].tsx — une fiche produit : affichage, impression, modification, suppression.
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import SiteShell from '../../components/SiteShell'
import FicheView from '../../components/FicheView'
import FicheForm from '../../components/FicheForm'

export default function FichePage() {
  const { query, push } = useRouter()
  const [f, setF] = useState<any>(null)
  const [err, setErr] = useState('')
  const [edit, setEdit] = useState(false)
  useEffect(() => {
    if (!query.id) return
    fetch(`/api/fiches/${query.id}`, { credentials: 'same-origin' })
      .then(async r => { const j = await r.json(); if (!r.ok) setErr(j.error || 'Fiche introuvable'); else setF(j.fiche) })
      .catch(() => setErr('Erreur réseau'))
  }, [query.id])
  async function supprimer() {
    if (!f) return
    const r = await fetch(`/api/fiches/${f.id}`, { method: 'DELETE', credentials: 'same-origin' })
    if (r.ok) push('/fiches')
  }
  return (
    <SiteShell title={`${f?.designation || 'Fiche produit'} | IXP-Import-eXPert`}>
      <section className="x-sec-tight">
        <div className="x-wrap">
          <div className="x-crumb noprint"><Link href="/fiches">Mes fiches produits</Link> / {f?.designation || '…'}</div>
          {err && <div className="x-pc-cta"><p>{err}</p><Link href="/fiches" className="x-btn x-btn-gold">Retour aux fiches</Link></div>}
          {f && !edit && (
            <>
              <div className="noprint" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '10px 0 18px' }}>
                <button type="button" className="x-btn x-btn-dark" onClick={() => setEdit(true)}>Modifier</button>
                <button type="button" className="x-btn x-btn-line" onClick={() => window.print()}>Imprimer ou enregistrer en PDF</button>
                <details className="x-fl-del"><summary className="x-btn x-btn-line">Supprimer</summary>
                  <p>La fiche sera supprimée définitivement. <button type="button" className="x-btn x-btn-dark x-btn-sm" onClick={supprimer}>Confirmer la suppression</button></p></details>
              </div>
              <FicheView f={f} />
              <p className="x-disclaimer" style={{ marginTop: 14 }}>Document d’aide à la conformité : il ne vaut pas décision de l’administration.</p>
            </>
          )}
          {f && edit && <div style={{ marginTop: 14 }}><FicheForm initiale={f} /></div>}
        </div>
      </section>
    </SiteShell>
  )
}
