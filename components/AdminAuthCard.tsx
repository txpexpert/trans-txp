// components/AdminAuthCard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Cadre et champs communs aux écrans de connexion administrateur (backoffice,
// Gestion des abonnements, création de mot de passe). Reprend la charte de
// l'ancien écran de connexion du backoffice (fond noir, or).
// ─────────────────────────────────────────────────────────────────────────────
import Head from 'next/head'
import type { ReactNode, CSSProperties } from 'react'

export function AdminAuthCard({ title, kicker, children, footer }: {
  title: string; kicker: string; children: ReactNode; footer?: ReactNode
}) {
  return (
    <>
      <Head><title>{`${title} — Import-eXPert`}</title><meta name="robots" content="noindex" /></Head>
      <style suppressHydrationWarning>{`
        body{background:#0A0A0A;margin:0}
        .aac{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px 16px;font-family:'DM Sans',system-ui,sans-serif;box-sizing:border-box}
        .aac *{box-sizing:border-box}
        .aac input{width:100%;padding:10px 14px;border:1px solid #2A2A2A;background:#111;color:#E8C97A;font-family:inherit;font-size:13px;outline:none;transition:border-color .15s}
        .aac input:focus{border-color:#C9A84C}
        .aac input::placeholder{color:#4A4A4A}
        .aac a{color:#C9A84C}
        .aac button:focus-visible,.aac a:focus-visible{outline:2px solid #C9A84C;outline-offset:2px}
      `}</style>
      <div className="aac">
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 28, fontWeight: 700, color: '#E8C97A' }}>
              Import-e<span style={{ color: '#C9A84C' }}>X</span>Pert
            </div>
            <div style={{ fontSize: 9, letterSpacing: '.18em', color: '#6A675F', marginTop: 6 }}>{kicker}</div>
            <div style={{ fontSize: 15, color: '#E8E4D8', marginTop: 14 }}>{title}</div>
          </div>
          {children}
          {footer && <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: 12, color: '#6A675F', lineHeight: 1.7 }}>{footer}</div>}
        </div>
      </div>
    </>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 9, letterSpacing: '.12em', color: '#8A877C', marginBottom: 6 }}>{label}</div>
      {children}
    </label>
  )
}

export function Notice({ tone, children }: { tone: 'error' | 'info' | 'ok'; children: ReactNode }) {
  const c = tone === 'error' ? ['rgba(232,93,93,.1)', 'rgba(232,93,93,.35)', '#E85D5D']
          : tone === 'ok'    ? ['rgba(93,200,140,.1)', 'rgba(93,200,140,.35)', '#7FD3A4']
          :                    ['rgba(201,168,76,.08)', 'rgba(201,168,76,.35)', '#E8C97A']
  return <div style={{ padding: '9px 12px', background: c[0], border: `1px solid ${c[1]}`, fontSize: 12, color: c[2], lineHeight: 1.55 }}>{children}</div>
}

export function SubmitButton({ busy, disabled, children }: { busy: boolean; disabled?: boolean; children: ReactNode }) {
  const off = busy || disabled
  const style: CSSProperties = {
    marginTop: 6, padding: 12, width: '100%', border: 'none', fontFamily: 'inherit', fontWeight: 500,
    fontSize: 11, letterSpacing: '.1em', cursor: off ? 'not-allowed' : 'pointer',
    background: off ? '#1A1A1A' : '#C9A84C', color: off ? '#4A4A4A' : '#0A0A0A',
  }
  return <button type="submit" disabled={off} style={style}>{busy ? 'VÉRIFICATION…' : children}</button>
}

/** Accepte uniquement un chemin interne (pas de redirection ouverte). */
export function safeRedirect(raw: unknown, fallback: string): string {
  return typeof raw === 'string' && raw.startsWith('/') && !raw.startsWith('//') && !raw.startsWith('/\\') ? raw : fallback
}
