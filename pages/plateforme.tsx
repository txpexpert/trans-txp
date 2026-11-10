// pages/plateforme.tsx — la suite expliquée : chaîne, couches, profils.
import Link from 'next/link'
import SiteShell from '../components/SiteShell'
import ChainCompact from '../components/ChainCompact'
import { ESPACES, PROFILS, espaceBySlug } from '../lib/suite'
import { KITS_PRATIQUES, kitHref, nbKitsEnLettres } from '../lib/kitsPratiques'

export default function Plateforme() {
  const couches = ESPACES.filter(e => !e.chain)
  return (
    <SiteShell title="Présentation de notre plateforme en 5 espaces | IXP-Import-eXPert" description="Cinq espaces de travail reliés par un même dossier : qualifier, optimiser, chiffrer, exécuter, sécuriser.">
      <section className="x-hero">
        <div className="x-wrap x-pres-grid">
          <div>
            <div className="x-eyebrow">Présentation de notre plateforme en 5 espaces</div>
            <h1 className="x-h1" style={{ maxWidth: 900 }}>Cinq espaces, <em>un même dossier</em>, de la fiche produit à la conformité.</h1>
            <p className="x-lead">Un espace de présentation pour découvrir la plateforme avant de l’utiliser. Chaque opération suit la même séquence. La plateforme l’épouse : ce qui est établi à une étape est repris à la suivante, et l’audit final renvoie ses corrections vers les fiches produit.</p>
          </div>

          <aside className="x-kits" id="kits" aria-labelledby="kits-titre">
            <div className="x-eyebrow">Kits pratiques · 2026</div>
            <h2 className="x-kits-title" id="kits-titre">Télécharger nos kits pratiques</h2>
            <p className="x-kits-sub">{nbKitsEnLettres()} kits d’expertise, à consulter en ligne ou à télécharger.</p>
            <ol className="x-kits-list">
              {KITS_PRATIQUES.map(k => (
                <li key={k.num} className="x-kit">
                  <span className="x-kit-n">{k.num}</span>
                  <div className="x-kit-txt">
                    <a href={kitHref(k)} target="_blank" rel="noopener" className="x-kit-t">{k.titre}</a>
                    <span className="x-kit-r">{k.resume}</span>
                  </div>
                  <div className="x-kit-btns">
                    <a href={kitHref(k)} target="_blank" rel="noopener" className="x-btn x-btn-line x-btn-sm">Consulter</a>
                    <a href={kitHref(k)} download={k.fichier} className="x-btn x-btn-dark x-btn-sm">Télécharger</a>
                  </div>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </section>


      <ChainCompact eyebrow="Initier vos opérations" id="initier" big />

      <section className="x-sec x-sec-dark">
        <div className="x-wrap">
          <div className="x-eyebrow">Autour de la chaîne</div>
          <h2 className="x-h2">Un socle, <em>un assistant</em>, une vue de direction.</h2>
          <div className="x-base" style={{ marginTop: 32 }}>
            {couches.map(e => (
              <Link key={e.slug} href={`/espaces/${e.slug}`} className={`x-link-card x-c-${e.slug}`} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <div className="x-verb">{e.verb}</div><p>{e.promise}</p>
              </Link>
            ))}
            <Link href="/#assistant" className="x-link-card x-c-assistant" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <div className="x-verb">IXP-Assistant</div><p>Disponible dans chaque espace, il répond en citant la circulaire, l’article ou l’accord exact.</p>
            </Link>
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
