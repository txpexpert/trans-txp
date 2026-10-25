// pages/plateforme.tsx — la suite expliquée : chaîne, couches, profils.
import Link from 'next/link'
import SiteShell from '../components/SiteShell'
import { CHAIN, ESPACES, PROFILS, espaceBySlug } from '../lib/suite'
import { KITS_PRATIQUES, kitHref } from '../lib/kitsPratiques'

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
            <p className="x-kits-sub">Sept kits d’expertise, à consulter en ligne ou à télécharger.</p>
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

      <section className="x-sec-tight" id="video" style={{ paddingTop: 0 }}>
        <div className="x-wrap">
          <div className="x-video" role="img" aria-label="Emplacement de la vidéo de présentation">
            <div className="x-video-play" aria-hidden="true">▶</div>
            <div>
              <div className="x-eyebrow">Vidéo de présentation · 60 secondes</div>
              <h2 className="x-h3" style={{ margin: '6px 0 4px' }}>La plateforme en six séquences</h2>
              <p style={{ margin: 0, color: 'var(--x-ink2)' }}>Le risque, IXP-Assistant, les cinq étapes de la chaîne, le diagnostic et les kits, l’expertise. Vidéo en préparation.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="x-sec-tight" style={{ paddingTop: 0 }}>
        <div className="x-wrap" style={{ display: 'grid', gap: 14 }}>
          {CHAIN.map(e => (
            <Link href={`/espaces/${e.slug}`} key={e.slug} className={`x-link-card x-row3 x-c-${e.slug}`}>
              <div>
                <span className="x-num">ÉTAPE {e.num}</span>
                <div className="x-verb">{e.verb}</div>
                <div className="x-card-t" style={{ marginBottom: 0 }}>{e.title}</div>
              </div>
              <div>
                <p style={{ margin: '0 0 8px', fontWeight: 500 }}>{e.question}</p>
                <p style={{ margin: 0, color: 'var(--x-ink2)', fontSize: 15 }}>{e.promise}</p>
                <p className="x-mono" style={{ marginTop: 12 }}>{e.tools.map(t => t.label).join(' · ')}</p>
              </div>
              <div className="x-card-out" style={{ borderTop: 'none', paddingTop: 0 }}>
                <b>Livrable</b>{e.livrable}
                <b style={{ marginTop: 12 }}>Transmet</b>{e.transmet}
              </div>
            </Link>
          ))}
        </div>
      </section>

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
