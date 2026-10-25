// components/SiteShell.tsx — en-tête, pied de page et bandeau démo de la vitrine Import-eXPert.
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, type ReactNode } from 'react'
import { CHAIN } from '../lib/suite'
import IxpLogo from './IxpLogo'

const DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === '1'

const NAV = [
  { href: '/plateforme', label: 'Présentation', tone: 't-blue' },
  { href: '/plateforme#profils', label: 'Solutions', tone: 't-green' },
  { href: '/espaces/bibliotheque', label: 'Bibliothèque', tone: 't-teal' },
  { href: '/expertise', label: 'Expertise', tone: 't-violet' },
  { href: '/tarifs', label: 'Tarifs', tone: 't-amber' },
]

export default function SiteShell({ title, description, children, plain = false }: { title: string; description?: string; children: ReactNode; plain?: boolean }) {
  const { pathname } = useRouter()
  const [menu, setMenu] = useState(false)
  return (
    <div className={plain ? 'xs xs-wrapped' : 'xs'}>
      <Head>
        <title>{title}</title>
        {description && <meta name="description" content={description} />}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {DEMO && <meta name="robots" content="noindex, nofollow" />}
      </Head>

      <header className="x-hdr">
        <div className="x-wrap">
          <Link href="/" className="x-logo" aria-label="Import-eXPert, accueil"><IxpLogo size={38} /><span>Import<b>-</b>eXPert<sup>MAROC</sup></span></Link>
          <nav className="x-nav" aria-label="Navigation principale">
            {NAV.map(n => (
              <Link key={n.href} href={n.href} className={`x-tile ${n.tone} ${pathname === n.href.split('#')[0] && !n.href.includes('#') ? 'on' : ''}`}>{n.label}</Link>
            ))}
          </nav>
          <div className="x-act">
            <Link href="/auth/login" className="x-tile t-rose x-login">Connexion</Link>
            <Link href="/plateforme#video" className="x-btn x-btn-dark"><span className="x-long">▶ Voir la présentation</span><span className="x-short">▶ Présentation</span></Link>
            <button type="button" className="x-burger" aria-expanded={menu} aria-label="Menu" onClick={() => setMenu(m => !m)}>{menu ? '✕' : '☰'}</button>
          </div>
        </div>
        {(
          <nav className="x-mnav" aria-label="Navigation mobile" hidden={!menu}>
            {NAV.map(n => <Link key={n.href} href={n.href} className={n.tone} onClick={() => setMenu(false)}>{n.label}</Link>)}
            <Link href="/diagnostic" className="t-red" onClick={() => setMenu(false)}>Diagnostic de conformité</Link>
            <Link href="/auth/login" className="t-rose" onClick={() => setMenu(false)}>Connexion</Link>
          </nav>
        )}
      </header>

      <main>{children}</main>

      <footer className="x-ftr">
        <div className="x-wrap">
          <div className="x-ftr-grid">
            <div>
              <div className="x-logo"><IxpLogo size={34} /><span>Import<b>-</b>eXPert<sup>MAROC</sup></span></div>
              <p>La plateforme qui qualifie, chiffre et sécurise vos opérations d’import avant d’initier vos opérations. Conçue et animée par des experts douaniers.</p>
            </div>
            <div>
              <h5>La chaîne</h5>
              <ul>{CHAIN.map(e => <li key={e.slug}><Link href={`/espaces/${e.slug}`}>{e.verb}</Link></li>)}</ul>
            </div>
            <div>
              <h5>Plateforme</h5>
              <ul>
                <li><Link href="/espaces/bibliotheque">Bibliothèque</Link></li>
                <li><Link href="/espaces/piloter">Piloter</Link></li>
                <li><Link href="/#assistant">IXP-Assistant</Link></li>
                <li><Link href="/diagnostic">Diagnostic de conformité</Link></li>
              </ul>
            </div>
            <div>
              <h5>Société</h5>
              <ul>
                <li><Link href="/expertise">Expertise et services</Link></li>
                <li><Link href="/tarifs">Tarifs</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h5>Légal</h5>
              <ul>
                <li><Link href="/cgu">Conditions d’utilisation</Link></li>
                <li><Link href="/confidentialite">Confidentialité</Link></li>
                <li><a href="https://www.douane.gov.ma" target="_blank" rel="noreferrer">douane.gov.ma ↗</a></li>
                <li><a href="https://www.portnet.ma" target="_blank" rel="noreferrer">portnet.ma ↗</a></li>
              </ul>
            </div>
          </div>
          <div className="x-ftr-bot">
            <span>© 2026 IXP-Import-eXPert · import-expert.ma</span>
            <span>Sources : circulaires ADII, Code des douanes, CGI 2026, IGOC 2026</span>
          </div>
        </div>
      </footer>

      {DEMO && (
        <div className="x-demo">
          VERSION DÉMO · NON PUBLIÉE · DONNÉES FACTICES
        </div>
      )}
    </div>
  )
}
