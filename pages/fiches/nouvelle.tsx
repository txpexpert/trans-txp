// pages/fiches/nouvelle.tsx — création guidée d'une fiche produit.
import Link from 'next/link'
import SiteShell from '../../components/SiteShell'
import FicheForm from '../../components/FicheForm'
import ProgressBar from '../../components/ProgressBar'

export default function NouvelleFiche() {
  return (
    <SiteShell title="Nouvelle fiche produit | IXP-Import-eXPert">
      <section className="x-hero" style={{ paddingBottom: 18 }}>
        <div className="x-wrap">
          <div className="x-crumb"><Link href="/fiches">Mes fiches produits</Link> / Nouvelle fiche</div>
          <h1 className="x-h1 x-h1-sm">Votre fiche produit <em>en trois écrans</em>.</h1>
          <p className="x-lead">Chaque écran est enregistré. Vous pouvez vous arrêter et reprendre plus tard.</p>
        </div>
      </section>
      <section className="x-sec-tight" style={{ paddingTop: 0 }}>
        <div className="x-wrap" style={{ display: 'grid', gap: 18 }}>
          <ProgressBar etape="qualifier" livrable="Fiche produit" />
          <FicheForm />
        </div>
      </section>
    </SiteShell>
  )
}
