// components/AuthCarte.tsx — cadre visuel commun aux pages « mot de passe oublié » et « réinitialiser » (même style que /auth/login)
import Head from 'next/head'
import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/router'

/** Langue de la page : ?langue=ar ou cookie de langue du site (ixp_lang). */
export function useLangueAuth(): 'fr' | 'ar' {
  const { query, isReady } = useRouter()
  const [langue, setLangue] = useState<'fr' | 'ar'>('fr')
  useEffect(() => {
    if (!isReady) return
    let ar = query.langue === 'ar'
    if (!ar && query.langue !== 'fr') { try { ar = document.cookie.split('; ').includes('ixp_lang=ar') } catch {} }
    setLangue(ar ? 'ar' : 'fr')
  }, [isReady, query.langue])
  return langue
}

export default function AuthCarte({ titre, sousTitre, children, langue = 'fr' }: { titre: string; sousTitre?: string; children: ReactNode; langue?: 'fr' | 'ar' }) {
  const ar = langue === 'ar'
  return (
    <>
      <Head>
        <title>{titre} — IXP-Import-eXPert</title>
        <meta name="robots" content="noindex" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=Noto+Sans+Arabic:wght@400;600&display=swap" rel="stylesheet" />
      </Head>
      <style dangerouslySetInnerHTML={{ __html: `
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{--gold:#C9A84C;--gold2:#E8C97A;--ink:#0A0A0A;--ink2:#3A3530;--ink3:#8A8078;--white:#FDFCF8;--border:#E8DFC8;--border2:#D4C8A8;--red:#C0392B}
        body{font-family:'DM Sans',sans-serif;background:var(--white);color:var(--ink);min-height:100vh}
        a{text-decoration:none;color:inherit}
        input{font-family:'DM Sans',sans-serif}
        .field{margin-bottom:.875rem}
        .label{display:block;font-size:11px;letter-spacing:.08em;color:var(--ink3);margin-bottom:.35rem}
        .inp{width:100%;padding:.7rem 1rem;border:1px solid var(--border2);background:var(--white);font-size:13px;color:var(--ink);outline:none}
        .inp:focus{border-color:var(--gold)}
        .btn{width:100%;padding:13px;background:var(--ink);color:var(--gold2);border:none;font-size:12px;letter-spacing:.1em;cursor:pointer}
        .btn:disabled{background:var(--ink3);cursor:not-allowed}
        .err{padding:.75rem 1rem;background:#FEE2E2;border:1px solid #FECACA;color:var(--red);font-size:13px;margin-bottom:1rem}
        .ok{padding:.75rem 1rem;background:#E8F5EC;border:1px solid #BFE3CB;color:#1A7A40;font-size:13px;margin-bottom:1rem;line-height:1.5}
        .aide{font-size:12px;color:var(--ink3);line-height:1.5;margin:-.4rem 0 .9rem}
        .lien{margin-top:.875rem;text-align:center;font-size:12px;color:var(--ink3)}
        .lien a{color:var(--gold);font-weight:500}
        .ar,.ar input,.ar button{font-family:'Noto Sans Arabic',Tahoma,sans-serif}
        .ar .label{letter-spacing:0;font-size:13px}
        .ar .btn{letter-spacing:0;font-size:14px}
      ` }} />
      <main className={ar ? 'ar' : undefined} dir={ar ? 'rtl' : undefined} lang={ar ? 'ar' : undefined} style={{ display: 'flex', justifyContent: 'center', padding: '3rem 1rem' }}>
        <div style={{ width: '100%', maxWidth: 420, border: '1px solid var(--border)', background: 'var(--white)' }}>
          <div style={{ padding: '1.5rem 2rem 1rem', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontFamily: ar ? "'Noto Sans Arabic',Tahoma,sans-serif" : "'DM Serif Display',serif", fontSize: ar ? 24 : 26, fontWeight: ar ? 600 : 400, marginBottom: '.2rem' }}>{titre}</div>
            {sousTitre && <div style={{ fontSize: 13, color: 'var(--ink3)' }}>{sousTitre}</div>}
          </div>
          <div style={{ padding: '1.5rem 2rem' }}>{children}</div>
        </div>
      </main>
    </>
  )
}
