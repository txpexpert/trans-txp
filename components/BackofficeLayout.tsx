import Link from 'next/link'
import { useRouter } from 'next/router'

const NAV = [
  { section: 'TABLEAU DE BORD', items: [
    { href:'/backoffice/dashboard',  label:'Vue d\'ensemble',         icon:'◈' },
  ]},
  { section: 'INGESTION RAG', items: [
    { href:'/backoffice/ingest',     label:'Ingestion Circulaires',   icon:'⬆', highlight: true },
    { href:'/backoffice/logs',       label:'Journaux d\'activité',    icon:'⋮' },
  ]},
  { section: 'DONNÉES', items: [
    { href:'/backoffice/tarifs',     label:'Codes SH & Tarifs',       icon:'⊞' },
    { href:'/backoffice/circulaires',label:'Circulaires ADII',        icon:'≡' },
    { href:'/backoffice/decisions',  label:'Décisions de Classement', icon:'⚑' },
    { href:'/backoffice/contenus',   label:'Contenus modules',        icon:'✦' },
  ]},
  { section: 'UTILISATEURS', items: [
    { href:'/backoffice/utilisateurs',label:'Comptes utilisateurs',   icon:'◉' },
    { href:'/backoffice/abonnements', label:'Abonnements & MRR',      icon:'◇' },
    { href:'/backoffice/equipes',     label:'Équipes entreprises',    icon:'⬡' },
  ]},
  { section: 'COMMUNICATION', items: [
    { href:'/backoffice/alertes',    label:'Alertes & Notifications', icon:'△' },
    { href:'/backoffice/support',    label:'Support & Tickets',       icon:'◎' },
  ]},
  { section: 'SYSTÈME', items: [
    { href:'/backoffice/admins',     label:'Administrateurs',         icon:'⊕' },
    { href:'/backoffice/parametres', label:'Paramètres',              icon:'⚙' },
  ]},
  { section: 'ACQUISITION', items: [
    { href:'/backoffice/scanner-leads', label:'Leads Scanner', icon:'⚡', highlight: true },
  ]},
]

export default function BackofficeLayout({ children, title = '' }: { children: React.ReactNode; title?: string }) {
  const router = useRouter()

  const logout = () => {
    if (typeof window !== 'undefined') sessionStorage.removeItem('bo_auth')
    router.push('/backoffice')
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh', fontFamily:"'DM Sans',sans-serif", background:'#0F1923' }}>

      {/* ── SIDEBAR ── */}
      <aside style={{ width:240, background:'#0C2D5C', display:'flex', flexDirection:'column', flexShrink:0, borderRight:'1px solid rgba(255,255,255,.08)' }}>

        {/* Logo */}
        <div style={{ padding:'1.25rem 1rem 1rem', borderBottom:'1px solid rgba(255,255,255,.08)' }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:'white', letterSpacing:'-.01em' }}>
            Douane<span style={{ color:'#C9A84C' }}>.</span>ia
          </div>
          <div style={{ fontSize:9, color:'rgba(255,255,255,.3)', letterSpacing:'.18em', marginTop:2 }}>BACK-OFFICE</div>
          <div style={{ marginTop:'1rem', padding:'.5rem .75rem', background:'rgba(255,255,255,.07)', borderRadius:4, display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:28, height:28, borderRadius:'50%', background:'#C9A84C', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#0A0A0A', flexShrink:0 }}>
              OW
            </div>
            <div>
              <div style={{ fontSize:12, color:'white', fontWeight:500 }}>Owner</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,.35)' }}>Accès total</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'1rem 0', overflowY:'auto' }}>
          {NAV.map(section => (
            <div key={section.section} style={{ marginBottom:'1rem' }}>
              <div style={{ fontSize:9, letterSpacing:'.18em', color:'rgba(255,255,255,.22)', padding:'0 1rem .4rem' }}>
                {section.section}
              </div>
              {section.items.map((item: any) => {
                const active = router.pathname === item.href
                return (
                  <Link key={item.href} href={item.href} style={{
                    display:'flex', alignItems:'center', gap:10,
                    padding:'8px 1rem', fontSize:12.5,
                    color: active ? 'white' : item.highlight ? '#E8C97A' : 'rgba(255,255,255,.52)',
                    background: active ? 'rgba(201,168,76,.15)' : item.highlight ? 'rgba(201,168,76,.07)' : 'transparent',
                    borderLeft: active ? '2px solid #C9A84C' : item.highlight ? '2px solid rgba(201,168,76,.4)' : '2px solid transparent',
                    textDecoration:'none', transition:'all .12s'
                  }}>
                    <span style={{ fontSize:13, opacity: item.highlight ? 1 : .65 }}>{item.icon}</span>
                    {item.label}
                    {item.highlight && !active && (
                      <span style={{ marginLeft:'auto', fontSize:9, padding:'1px 5px', background:'rgba(201,168,76,.2)', color:'#E8C97A', borderRadius:2 }}>
                        RAG
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Footer sidebar */}
        <div style={{ padding:'.875rem 1rem', borderTop:'1px solid rgba(255,255,255,.08)', display:'flex', flexDirection:'column', gap:6 }}>
          <Link href="/" style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'rgba(255,255,255,.32)', textDecoration:'none', letterSpacing:'.04em' }}>
            ← Site public
          </Link>
          <button onClick={logout} style={{ fontSize:11, color:'rgba(232,93,93,.5)', background:'none', border:'none', cursor:'pointer', textAlign:'left', letterSpacing:'.04em', fontFamily:'inherit' }}>
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>

        {/* Topbar */}
        <div style={{ height:52, background:'#0F1923', borderBottom:'1px solid rgba(255,255,255,.08)', display:'flex', alignItems:'center', padding:'0 1.5rem', justifyContent:'space-between', flexShrink:0 }}>
          <div style={{ fontSize:14, fontWeight:500, color:'white' }}>
            {title || NAV.flatMap(s => s.items).find((i: any) => i.href === router.pathname)?.label || 'Backoffice'}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
            <div style={{ background:'rgba(201,168,76,.15)', color:'#E8C97A', fontSize:10, padding:'2px 8px', letterSpacing:'.08em', borderRadius:2 }}>
              Transit-IA · 2026
            </div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,.3)' }}>
              {new Date().toLocaleDateString('fr-MA', { day:'2-digit', month:'long', year:'numeric' })}
            </div>
          </div>
        </div>

        {/* Content */}
        <main style={{ flex:1, overflow:'auto', background:'#0F1923' }}>
          <div style={{ padding:'2rem' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

