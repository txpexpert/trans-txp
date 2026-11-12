// components/SiteShell.tsx — en-tête, pied de page et bandeau démo de la vitrine Import-eXPert.
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, type ReactNode, useEffect } from 'react'
import { CHAIN } from '../lib/suite'
import IxpLogo from './IxpLogo'
import { COOKIE_LANGUE, equivalent, lienLangue } from '../lib/langues'
import WhatsAppBouton from './WhatsAppBouton'

const DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === '1'
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://import-expert.ma').replace(/\/$/, '')

// Interface en arabe (parcours clés) : navigation et pied de page dédiés, sens de lecture de droite à gauche
const NAV_AR = [
  { href: '/ar', label: 'الرئيسية', tone: 't-blue' },
  { href: '/ar/diagnostic', label: 'التشخيص', tone: 't-green' },
  { href: '/ar/tarifs', label: 'العروض والأسعار', tone: 't-amber' },
  { href: '/tools/enquete-barometre-ar.html', label: 'بارومتر 2026', tone: 't-teal' },
]

const NAV = [
  { href: '/', label: 'Accueil', tone: 't-blue' },
  { href: '/plateforme', label: 'Solutions', tone: 't-green' },
  { href: '/espaces/piloter', label: 'Piloter', tone: 't-slate' },
  { href: '/espaces/bibliotheque', label: 'Bibliothèque', tone: 't-teal' },
  { href: '/expertise', label: 'Expertise', tone: 't-violet' },
  { href: '/tarifs', label: 'Tarifs', tone: 't-amber' },
]

export default function SiteShell({ title, description, children, plain = false, lang = 'fr' }: { title: string; description?: string; children: ReactNode; plain?: boolean; lang?: 'fr' | 'ar' }) {
  const ar = lang === 'ar'
  const { pathname } = useRouter()
  // Sélecteur de langue : enregistre le choix et ouvre la même page dans l'autre langue
  const autreLangue = ar ? lienLangue('fr', pathname) : lienLangue('ar', pathname)
  // Le bouton de langue n'est plus dans le menu : il reste affiché en permanence dans l'en-tête (bureau et mobile).
  // Il ne touche qu'au cookie de langue : la session de l'utilisateur est conservée.
  const nav = ar ? NAV_AR : NAV
  const versionFr = ar ? equivalent(pathname, 'fr') : pathname
  const versionAr = ar ? pathname : equivalent(pathname, 'ar')
  // Proposition discrète de l'interface arabe aux navigateurs réglés en arabe, tant qu'aucune langue n'est choisie
  const [proposerAr, setProposerAr] = useState(false)
  useEffect(() => {
    if (ar) return
    try {
      const choisie = document.cookie.split('; ').some(c => c.startsWith(COOKIE_LANGUE + '='))
      const nav0 = (navigator.languages && navigator.languages[0]) || navigator.language || ''
      if (!choisie && nav0.toLowerCase().startsWith('ar')) setProposerAr(true)
    } catch {}
  }, [ar])
  const [menu, setMenu] = useState(false)
  // Session en cours : nom du client affiché dans l'en-tête, avec la tuile Déconnexion
  const [user, setUser] = useState<{ label: string; detail: string; compte: string } | null>(null)
  const [replaced, setReplaced] = useState(false)
  useEffect(() => {
    let alive = true
    fetch('/api/auth/me', { credentials: 'same-origin' })
      .then(r => r.json().then(j => ({ ok: r.ok, j })).catch(() => ({ ok: false, j: null as any })))
      .then(({ ok, j: u }) => {
        if (!alive) return
        if (!ok) { if (u?.code === 'SESSION_REPLACED') setReplaced(true); return }
        if (!u) return
        const nom = [u.prenom, u.nom].filter(Boolean).join(' ').trim()
        const PLAN: Record<string, string> = { free: 'Découverte', trial: 'Essai', pro: 'Pro', premium: 'Premium', enterprise: 'Entreprise' }
        const compte = u.role === 'admin' || u.role === 'generaladmin' ? 'Administrateur' : `Compte ${PLAN[u.plan] || u.plan || ''}`.trim()
        setUser({ label: nom || u.societe || u.email, compte, detail: [u.societe, u.email, u.numero ? `n° ${u.numero}` : ''].filter(Boolean).join(' · ') })
      })
      .catch(() => {})
    return () => { alive = false }
  }, [])
  const logout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }) } catch {}
    setUser(null)
    window.location.href = '/'
  }
  return (
    <div className={`${plain ? 'xs xs-wrapped' : 'xs'}${ar ? ' xs-ar' : ''}`} dir={ar ? 'rtl' : undefined} lang={ar ? 'ar' : undefined}>
      <Head>
        <title>{title}</title>
        {description && <meta name="description" content={description} />}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {DEMO && <meta name="robots" content="noindex, nofollow" />}
        {versionFr && versionAr && <link rel="alternate" hrefLang="fr" href={SITE + versionFr} />}
        {versionFr && versionAr && <link rel="alternate" hrefLang="ar" href={SITE + versionAr} />}
        {versionFr && versionAr && <link rel="alternate" hrefLang="x-default" href={SITE + versionFr} />}
      </Head>
      {proposerAr && (
        <div className="x-langbar" dir="rtl" lang="ar">
          <span>الموقع متوفر باللغة العربية.</span>
          <a href={lienLangue('ar', pathname)}>التصفح بالعربية</a>
          <a href={lienLangue('fr', pathname)} lang="fr" dir="ltr">Continuer en français</a>
        </div>
      )}

      <header className="x-hdr">
        <div className="x-wrap">
          <Link href={ar ? '/ar' : '/'} className="x-logo" aria-label="Import-eXPert, accueil" dir="ltr"><IxpLogo size={38} /><span>Import<b>-</b>eXPert<sup>MAROC</sup></span></Link>
          <nav className="x-nav" aria-label="Navigation principale">
            {nav.map(n => (
              n.href.startsWith('/api/')
                ? <a key={n.href} href={n.href} className={`x-tile ${n.tone}`} lang={ar ? 'fr' : 'ar'}>{n.label}</a>
                : <Link key={n.href} href={n.href} className={`x-tile ${n.tone} ${pathname === n.href.split('#')[0] && !n.href.includes('#') ? 'on' : ''}`}>{n.label}</Link>
            ))}
          </nav>
          <div className="x-act">
            <a href={autreLangue} className="x-tile t-slate x-lang" lang={ar ? 'fr' : 'ar'} dir={ar ? 'ltr' : 'rtl'} title={ar ? 'Version française (principale)' : 'النسخة العربية'}>{ar ? 'Français' : 'العربية'}</a>
            {user ? (
              <div className="x-session" title={`Session en cours : ${user.detail}`}>
                <Link href="/mon-espace" className="x-sess-who"><span className="x-dot" aria-hidden="true" />{user.label}<small>{user.compte}</small></Link>
                <button type="button" className="x-tile t-rose x-logout" onClick={logout}>{ar ? 'خروج' : 'Déconnexion'}</button>
              </div>
            ) : (
              <div className="x-session">
                {replaced && <span className="x-sess-off">Session fermée : connexion ouverte ailleurs</span>}
                <Link href="/auth/login" className="x-tile t-rose x-login">{ar ? 'تسجيل الدخول' : 'Connexion'}</Link>
              </div>
            )}
            <button type="button" className="x-burger" aria-expanded={menu} aria-label="Menu" onClick={() => setMenu(m => !m)}>{menu ? '✕' : '☰'}</button>
          </div>
        </div>
        {(
          <nav className="x-mnav" aria-label="Navigation mobile" hidden={!menu}>
            {nav.map(n => n.href.startsWith('/api/')
              ? <a key={n.href} href={n.href} className={n.tone} lang={ar ? 'fr' : 'ar'}>{n.label}</a>
              : <Link key={n.href} href={n.href} className={n.tone} onClick={() => setMenu(false)}>{n.label}</Link>)}
            {!ar && <Link href="/diagnostic" className="t-red" onClick={() => setMenu(false)}>Diagnostic de conformité</Link>}
            {user ? (
              <>
                <Link href="/mon-espace" className="t-green" onClick={() => setMenu(false)}>{ar ? 'متصل: ' : 'Connecté : '}{user.label}</Link>
                <a href="/" className="t-rose" onClick={e => { e.preventDefault(); setMenu(false); logout() }}>{ar ? 'خروج' : 'Déconnexion'}</a>
              </>
            ) : (
              <Link href="/auth/login" className="t-rose" onClick={() => setMenu(false)}>{ar ? 'تسجيل الدخول' : 'Connexion'}</Link>
            )}
          </nav>
        )}
      </header>

      <main>{children}</main>
      <WhatsAppBouton chemin={pathname} ar={ar} />

      {ar ? (
      <footer className="x-ftr">
        <div className="x-wrap">
          <div className="x-ftr-grid">
            <div>
              <div className="x-logo" dir="ltr"><IxpLogo size={34} /><span>Import<b>-</b>eXPert<sup>MAROC</sup></span></div>
              <p>منصة تؤهّل عمليات الاستيراد وتحسب كلفتها وتؤمّنها قبل الاستخلاص الجمركي، يصممها ويؤطرها خبراء جمركيون.</p>
            </div>
            <div><h5>المنصة</h5><ul>
              <li><Link href="/ar/diagnostic">تشخيص الامتثال</Link></li>
              <li><Link href="/ar/tarifs">العروض والأسعار</Link></li>
              <li><a href="/tools/enquete-barometre-ar.html">بارومتر 2026</a></li>
              <li><Link href="/ar/contact">اتصلوا بنا</Link></li>
            </ul></div>
            <div><h5>روابط</h5><ul>
              <li><a href={autreLangue}>Version française</a></li>
              <li><a href="https://www.douane.gov.ma" target="_blank" rel="noreferrer">douane.gov.ma ↗</a></li>
              <li><a href="https://www.portnet.ma" target="_blank" rel="noreferrer">portnet.ma ↗</a></li>
            </ul></div>
          </div>
          <div className="x-ftr-bot"><span>© 2026 IXP-Import-eXPert · import-expert.ma</span></div>
        </div>
      </footer>
      ) : (
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
                <li><Link href="/calculateur-dum">Argent laissé sur la table</Link></li>
                <li><Link href="/produits">Droits par produit (SH)</Link></li>
                <li><Link href="/barometre">Baromètre 2026</Link></li>
                <li><Link href="/profils/pme">PME importatrices</Link></li>
                <li><Link href="/profils/transitaire">Transitaires</Link></li>
                <li><Link href="/profils/daf">Directions financières</Link></li>
                <li><Link href="/profils/prescripteurs">Programme partenaires</Link></li>
              </ul>
            </div>
            <div>
              <h5>Société</h5>
              <ul>
                <li><Link href="/expertise">Expertise et services</Link></li>
                <li><Link href="/tarifs">Tarifs</Link></li>
                <li><Link href="/contact">Contact</Link></li>
                <li><Link href="/a-propos">À propos</Link></li>
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
      )}

      {DEMO && (
        <div className="x-demo">
          VERSION DÉMO · NON PUBLIÉE · DONNÉES FACTICES
        </div>
      )}
    </div>
  )
}
