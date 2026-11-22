// pages/plateforme.tsx — la suite expliquée : chaîne, couches, profils.
import Link from 'next/link'
import SiteShell from '../components/SiteShell'
import ChainCompact from '../components/ChainCompact'
import { PROFILS, espaceBySlug } from '../lib/suite'

export default function Plateforme() {
  return (
    <SiteShell title="Présentation de notre plateforme en 5 espaces | IXP-Import-eXPert" description="Cinq espaces de travail reliés par un même dossier : qualifier, optimiser, chiffrer, exécuter, sécuriser.">
      <ChainCompact eyebrow="Initier vos opérations" id="initier" big />

      <section className="x-hero">
        <div className="x-wrap">
          <div>
            <div className="x-eyebrow">Présentation de notre plateforme en 5 espaces</div>
            <h1 className="x-h1" style={{ maxWidth: 900 }}>Cinq espaces, <em>un même dossier</em>, de la fiche produit à la conformité.</h1>
            <p className="x-lead">Un espace de présentation pour découvrir la plateforme avant de l’utiliser. Chaque opération suit la même séquence. La plateforme l’épouse : ce qui est établi à une étape est repris à la suivante, et l’audit final renvoie ses corrections vers les fiches produit.</p>
          </div>

        </div>
      </section>


      <section className="x-sec" id="profils">
        <div className="x-wrap">
          <div className="x-eyebrow">Solutions par profil</div>
          <h2 className="x-h2">Le même dossier, <em>trois façons</em> de s’en servir.</h2>
          <div className="x-plans x-plans3">
            {PROFILS.map(p => (
              <div className="x-plan" key={p.id}>
                <h3 style={{ fontSize: 23 }}>{p.titre}</h3>
                <p className="pour" style={{ minHeight: 0 }}>{p.accroche}</p>
                <ul className="x-list" style={{ margin: '8px 0 20px' }}>{p.points.map(t => <li key={t}>{t}</li>)}</ul>
                <div className="x-chips">{p.espaces.map(s => <Link key={s} href={`/espaces/${s}`} className={`x-chip x-c-${s}`}>{espaceBySlug(s)!.verb}</Link>)}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 40 }}><Link href="/diagnostic" className="x-btn x-btn-dark">Lancer le diagnostic de conformité</Link></div>
        </div>
      </section>
    </SiteShell>
  )
}
