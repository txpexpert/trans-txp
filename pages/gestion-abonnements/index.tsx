// pages/gestion-abonnements/index.tsx
// ─────────────────────────────────────────────────────────────────────────────
// « Gestion des abonnements » — tableau de bord des administrateurs de type 2
// (2026-11-01). N'affiche QUE la gestion des abonnements, sur les données
// réelles Supabase : chaque bouton agit directement en base via
// /api/admin/subscriptions, qui revérifie les habilitations.
//
// Séparé du backoffice (connexion propre, cookie das_gestion) mais lié : le
// super-administrateur y accède depuis le backoffice avec toutes les actions.
// ─────────────────────────────────────────────────────────────────────────────
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import type { GetServerSideProps } from 'next'
import { requireGestionSSR } from '../../lib/adminAuth'
import { PERMISSIONS, type AdminCapabilities } from '../../lib/adminPermissions'
import SubscriptionsBoard from '../../components/SubscriptionsBoard'

export const getServerSideProps: GetServerSideProps = requireGestionSSR

export default function GestionAbonnements({ caps }: { caps: AdminCapabilities }) {
  const router = useRouter()
  const isSuper = caps.niveau === 'super'

  const logout = async () => {
    try { await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' }) } catch {}
    router.push(isSuper ? '/backoffice' : '/gestion-abonnements/connexion')
  }

  return (
    <>
      <Head><title>Gestion des abonnements — Import-eXPert</title><meta name="robots" content="noindex" /></Head>
      <div style={{ minHeight: '100vh', background: 'var(--paper)', fontFamily: "'DM Sans',sans-serif" }}>
        <header style={{ background: '#0C2D5C', color: '#fff' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '12px max(16px, env(safe-area-inset-right, 0px)) 12px max(16px, env(safe-area-inset-left, 0px))', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 19, fontWeight: 700 }}>
                Import-e<span style={{ color: '#C9A84C' }}>X</span>Pert
              </div>
              <div style={{ fontSize: 9, letterSpacing: '.18em', color: 'rgba(255,255,255,.45)' }}>GESTION DES ABONNEMENTS</div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12 }}>{caps.email}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)' }}>{isSuper ? 'Super-administrateur · toutes les actions' : 'Administrateur des abonnements'}</div>
              </div>
              {isSuper && (
                <Link href="/backoffice/dashboard" style={{ fontSize: 11, color: '#E8C97A', textDecoration: 'none', border: '1px solid rgba(201,168,76,.5)', padding: '5px 10px' }}>
                  ← Backoffice
                </Link>
              )}
              <button onClick={logout} style={{ fontSize: 11, color: '#fff', background: 'transparent', border: '1px solid rgba(255,255,255,.3)', padding: '5px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
                Se déconnecter
              </button>
            </div>
          </div>
        </header>

        <main style={{ maxWidth: 1280, margin: '0 auto', paddingBlock: '24px 48px', paddingLeft: 'max(16px, env(safe-area-inset-left, 0px))', paddingRight: 'max(16px, env(safe-area-inset-right, 0px))' }}>
          {!isSuper && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem', fontSize: 11, color: 'var(--inkm)' }}>
              Vos habilitations :
              {PERMISSIONS.filter(p => caps.permissions.includes(p.code)).map(p => (
                <span key={p.code} style={{ padding: '2px 8px', background: 'var(--bl)', color: 'var(--bd)' }}>{p.label}</span>
              ))}
            </div>
          )}
          <SubscriptionsBoard caps={isSuper ? null : caps} title="Gestion des abonnements" />
        </main>
      </div>
    </>
  )
}
