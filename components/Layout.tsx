// components/Layout.tsx
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'

interface LayoutProps {
  children: React.ReactNode
  variant?: 'landing' | 'inner'
}

// --- MODULES -----------------------------------------------------------------
const MODULES_MAIN = [
  { num: '00',  label: 'FAQ Douanière',           href: '/modules/faq' },
  { num: '05',  label: 'Audit Douanier',          href: '/modules/audit' },
  { num: '12',  label: 'Contrôle des Risques',    href: '/modules/risques' },
  { num: 'CLT', label: 'Classement tarifaire et SH', href: '/modules/classement' },
  { num: 'DCL', label: 'Décisions de Classement', href: '/modules/decisions-classement' },
  { num: 'ANA', label: 'Analyses Stratégiques',   href: '/modules/analyses' },
]

const MODULES_TOOLS = [
  { num: 'TRK', label: 'Tracking & Intelligence',      href: '/modules/tracking',             badge: 'NEW' },
  { num: 'CAL', label: 'Simulateur Droits & Taxes',    href: '/modules/simulateur',           badge: '↗'   },
  { num: 'CMP', label: 'Comparateur Régimes',          href: '/modules/comparateur',          badge: '↗'   },
  { num: 'ORI', label: 'Origine ALECA / UE',           href: '/modules/origine-aleca',        badge: 'NEW' },
  { num: '15',  label: 'Incoterms × Shipping Terms',   href: '/modules/incoterms-shipping',   badge: 'NEW' },
  { num: 'REC', label: 'Régimes Économiques',          href: '/modules/regimes-economiques',  badge: 'NEW' },
  { num: 'DOC', label: 'Documents par Code SH',        href: '/modules/documents-sh',         badge: 'NEW' },
  { num: 'DUM', label: 'Vérificateur DUM',             href: '/modules/verificateur-dum',     badge: 'NEW' },
  { num: 'SIM', label: 'Simulateur Fiscal Import',     href: '/modules/simulateur-fiscal',    badge: 'NEW' },
  { num: 'GEN', label: 'Générateur Documents',         href: '/modules/generateur-docs',      badge: 'NEW' },
  { num: 'GLO', label: 'Glossaire Douanier FR/AR',     href: '/modules/glossaire-douanier',   badge: 'NEW' },
  { num: 'PRT', label: 'Carte des Bureaux Douaniers',         href: '/modules/carte-bureauxdouaniers',       badge: 'NEW' },
  { num: 'PRO', label: 'Procédures Douanières',        href: '/modules/procedures',           badge: 'NEW' },
  { num: 'RGM', label: 'Procédures & Régimes',         href: '/modules/procedures-process',   badge: 'NEW' },
  { num: 'ICI', label: 'Index Commerce Intl.',         href: '/modules/index-commerce',       badge: 'NEW' },
  { num: 'CFH', label: 'Facilitation Douanière', href: '/modules/facilitation', badge: 'NEW' },
  { num: 'ENG', label: 'Douane Engineering',             href: '/modules/douane-engineering' },
  { num: 'IFV', label: 'Intelligence Fiscale',        href: '/modules/intelligence-fiscale' },
  { num: 'IST', label: 'Intelligence Stratégique',     href: '/modules/intelligence-strategique' },
  { num: 'OEA', label: 'Opérateur Économique Agréé',   href: '/modules/oea' },
  { num: 'VRG', label: 'Veille Réglementaire & LF 2026', href: '/modules/veille-reglementaire', badge: 'NEW' },
  { num: 'M35', label: 'Valeur en Douane (WCO)',     href: '/modules/valeur-douane',           badge: 'NEW' },
  { num: 'M36', label: 'Intelligence Import',        href: '/modules/intelligence-import',      badge: 'NEW' },
  { num: 'VLW', label: 'Veille Légale & LF 2026',   href: '/modules/simulateur#majoration-tbi', badge: 'NEW' },
  { num: 'CNT', label: 'Calculateur Conteneurs',     href: '/modules/calc-conteneurs',          badge: 'NEW' },
  { num: 'AUT', label: 'Autorisations & Licences',   href: '/modules/autorisations-licences',   badge: 'NEW' },
  { num: 'MRQ', label: 'Marquage & Warnings',        href: '/modules/marquage-warnings',        badge: 'NEW' },
  { num: 'SDG', label: 'Substances Dangereuses',     href: '/modules/substances-dangereuses',   badge: 'NEW' },
  { num: 'TDG', label: 'Générateur Doc Transit',     href: '/modules/transit-doc-generator',    badge: 'NEW' },
  { num: 'EXP', label: 'Export', href: '/modules/export', badge: 'EXP' },
  { num: 'GMS', label: 'Global MondoScope', href: '/modules/mondoscope', badge: 'NEW' },
  { num: 'AF',  label: 'Alertes Fiscales',              href: '/modules/alertes-fiscales', badge: 'NEW' },
  { num: 'CGI', label: 'CGI — Recherche Fiscale',       href: '/modules/cgi-search',       badge: 'NEW' },
  { num: 'SRE', label: 'Calculateur Colis & SRE',       href: '/modules/calc-colis-sre',   badge: 'NEW' },
  { num: 'RDC', label: 'Régime de Change',              href: '/modules/regime-change',    badge: 'NEW' },
  { num: 'SUR', label: 'Surestaries & Pénalités',       href: '/modules/surestaries',      badge: 'NEW' },
  { num: 'TIC', label: 'Référence TIC',                 href: '/modules/tic-reference',    badge: 'NEW' },
]

// --- Composant Layout ---------------------------------------------------------
export default function Layout({ children, variant = 'inner' }: LayoutProps) {
  const router = useRouter()

  // ✅ FIX — état de session unique, plus de fetch('/api/auth/me') local ni de
  // doLogin/doLogout dupliqués. Tout vient d'AuthContext (voir context/AuthContext.tsx),
  // partagé avec la page dashboard et les autres formulaires de connexion.
  const { user, login, logout } = useAuth()

  const [loginOpen,    setLoginOpen]    = useState(false)
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [toast,        setToast]        = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [mastDate,     setMastDate]     = useState('')

  const isLanding = variant === 'landing'

  // Nom d'affichage dérivé de l'email (partie avant @), comme avant
  const displayName = user?.email ? user.email.split('@')[0] : ''

  useEffect(() => {
    const days   = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi']
    const months = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']
    const now = new Date()
    setMastDate(`${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`)
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 3200)
  }

  const doLogin = async () => {
    if (!email || !password) { showToast('Email et mot de passe requis'); return }
    const result = await login(email, password)
    if (!result.ok) { showToast(result.error || 'Identifiants incorrects'); return }
    setLoginOpen(false)
    setEmail(''); setPassword('')
    router.push('/')
  }

  const doLogout = async () => {
    await logout()
    router.push('/')
  }

  // -- Item sidebar générique -------------------------------------------------
  const SideItem = ({ href, num, label, badge }: {
    href: string; num: string; label: string; badge?: string
  }) => (
    <Link
      href={href}
      className={`sidebar-item ${router.pathname.startsWith(href) ? 'active' : ''}`}
    >
      <span className="sidebar-num">{num}</span>
      {label}
      {badge && (
        <span className="sidebar-badge" style={{
          background: badge === '↗' ? 'transparent' : 'var(--ba)',
          color:      badge === '↗' ? 'var(--ba)'   : 'white',
          fontSize: 9,
          padding: '1px 5px',
          border: badge === '↗' ? '1px solid var(--ba)' : 'none',
        }}>
          {badge}
        </span>
      )}
    </Link>
  )

  return (
    <>
      {/* -- MASTHEAD — landing uniquement -- */}
      {isLanding && (
        <header>
          <div className="masthead">
            <div className="mast-top">
              <span>PLATEFORME DOUANIÈRE — DÉMONSTRATION INTERNE</span>
              <span>{mastDate}</span>
            </div>
            <div className="mast-main">
              <Link href="/" className="mast-logo">Transit-IA</Link>
              <div className="mast-tagline">Démo interne — Phase de développement</div>
            </div>
            <div className="mast-nav">
              <Link href="/modules/simulateur"  className="mast-nav-item">SIMULATEUR</Link>
              <Link href="/modules/comparateur" className="mast-nav-item">COMPARATEUR</Link>
              <Link href="/modules/analyses"    className="mast-nav-item">ANALYSES</Link>
              <Link href="/abonnements"         className="mast-nav-item">ABONNEMENTS</Link>
              {user ? (
                <Link href="/dashboard" className="mast-nav-cta">MON COMPTE</Link>
              ) : (
                <button className="mast-nav-cta" onClick={() => setLoginOpen(true)}>ESSAYER GRATUITEMENT</button>
              )}
            </div>
          </div>
        </header>
      )}

      {/* -- TOPNAV — pages internes -- */}
      {!isLanding && (
        <nav className="topnav">
          <Link href="/" className="topnav-logo">Transit-IA</Link>
          <div className="topnav-links">
            <Link href="/"                    className={`topnav-link ${router.pathname === '/'                         ? 'active' : ''}`}>ACCUEIL</Link>
            <Link href="/modules/simulateur"  className={`topnav-link ${router.pathname.includes('simulateur')          ? 'active' : ''}`}>SIMULATEUR</Link>
            <Link href="/modules/comparateur" className={`topnav-link ${router.pathname.includes('comparateur')         ? 'active' : ''}`}>COMPARATEUR</Link>
            <Link href="/modules/analyses"    className={`topnav-link ${router.pathname.includes('analyses')            ? 'active' : ''}`}>ANALYSES</Link>
            <Link href="/abonnements"         className={`topnav-link ${router.pathname === '/abonnements'              ? 'active' : ''}`}>ABONNEMENTS</Link>
          </div>
          <div className="topnav-right">
            {user ? (
              // ✅ FIX — lien "Mon compte" ajouté à côté du nom + plan
              <Link
                href="/dashboard"
                className="topnav-user"
                title={`Plan : ${user.plan} — Accéder à mon compte`}
                style={{ textDecoration: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
              >
                {displayName} <span className="topnav-plan">· {user.plan}</span>
              </Link>
            ) : (
              <span className="topnav-user">Non connecté</span>
            )}

            {user ? (
              <button className="topnav-btn outline" onClick={doLogout}>Déconnexion</button>
            ) : (
              <>
                <button className="topnav-btn outline" onClick={() => setLoginOpen(true)}>Connexion</button>
                <Link href="/abonnements"><button className="topnav-btn">Essayer</button></Link>
              </>
            )}
          </div>
        </nav>
      )}

      {/* -- LAYOUT PRINCIPAL -- */}
      <div className="main-wrap">

        {/* -- SIDEBAR — pages internes -- */}
        {!isLanding && (
          <aside className="sidebar">

            <div className="sidebar-section">
              <div className="sidebar-label">MODULES PRINCIPAUX</div>
              {MODULES_MAIN.map(m => (
                <SideItem key={m.href} {...m} />
              ))}
            </div>

            <div className="sidebar-divider" />

            <div className="sidebar-section">
              <div className="sidebar-label">OUTILS INTERACTIFS</div>
              {MODULES_TOOLS.map(m => (
                <SideItem key={m.href} {...m} />
              ))}
            </div>

            <div className="sidebar-divider" />

            <div className="sidebar-section">
              <div className="sidebar-label">COMMUNAUTÉ & COMPTE</div>
              {/* ✅ FIX — lien Mon compte visible uniquement si connecté */}
              {user && (
                <Link href="/dashboard" className={`sidebar-item ${router.pathname === '/dashboard' ? 'active' : ''}`}>
                  <span className="sidebar-num">→</span>Mon compte
                </Link>
              )}
              <Link href="/abonnements" className={`sidebar-item ${router.pathname === '/abonnements'        ? 'active' : ''}`}><span className="sidebar-num">→</span>Abonnements</Link>
            </div>

          </aside>
        )}

        <main className="content-area">
          {children}
        </main>
      </div>

      {/* -- MODAL CONNEXION -- */}
      <div
        className={`modal-overlay ${loginOpen ? 'open' : ''}`}
        onClick={e => { if (e.target === e.currentTarget) setLoginOpen(false) }}
      >
        <div className="modal">
          <div className="modal-header">
            <div className="modal-title">Connexion à Transit-IA</div>
            <button className="modal-close" onClick={() => setLoginOpen(false)}>×</button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">EMAIL</label>
              <input
                className="form-input"
                type="email"
                placeholder="email@societe.ma"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">MOT DE PASSE</label>
              <input
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doLogin()}
              />
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', fontSize:'12px', marginTop:'.5rem' }}>
              <span style={{ color:'var(--inkm)' }}>
                Pas de compte ?{' '}
                <Link href="/auth/register" style={{ color:'var(--ba)' }}>S'inscrire</Link>
              </span>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline" onClick={() => setLoginOpen(false)}>Annuler</button>
            <button className="btn btn-primary" onClick={doLogin}>Se connecter</button>
          </div>
        </div>
      </div>

      {/* -- TOAST -- */}
      <div className={`toast ${toastVisible ? 'show' : ''}`}>{toast}</div>
    </>
  )
}

