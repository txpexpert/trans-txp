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
import { PERMISSIONS, hasPermission, type AdminCapabilities, type PermissionCode } from '../../lib/adminPermissions'
import SubscriptionsBoard from '../../components/SubscriptionsBoard'
import IngestDecisions from '../../components/IngestDecisions'
import IngestTarif from '../../components/IngestTarif'

// Onglets affichés selon les habilitations (2026-11-01). Les habilitations
// d'abonnement ouvrent l'onglet « Abonnés » ; « ingerer_decisions » et
// « maj_tarif » ouvrent les deux onglets d'ingestion.
const SUB_PERMS: PermissionCode[] = ['activer_plans', 'emettre_proformas', 'valider_paiements', 'prolonger', 'voir_montants']
type Onglet = 'abonnes' | 'decisions' | 'tarif'

export const getServerSideProps: GetServerSideProps = requireGestionSSR

export default function GestionAbonnements({ caps }: { caps: AdminCapabilities }) {
  const router = useRouter()
  const isSuper = caps.niveau === 'super'
  const tabs: { id: Onglet; label: string }[] = [
    ...(SUB_PERMS.some(p => hasPermission(caps, p)) ? [{ id: 'abonnes' as Onglet, label: 'Abonnés' }] : []),
    ...(hasPermission(caps, 'ingerer_decisions') ? [{ id: 'decisions' as Onglet, label: 'Ingestion Décisions' }] : []),
    ...(hasPermission(caps, 'maj_tarif') ? [{ id: 'tarif' as Onglet, label: 'Ingestion Tarif SH' }] : []),
  ]
  const asked = typeof router.query.onglet === 'string' ? router.query.onglet : ''
  const onglet: Onglet | undefined = tabs.find(t => t.id === asked)?.id ?? tabs[0]?.id

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
          {tabs.length > 1 && (
            <nav style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--rule)', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              {tabs.map(t => (
                <Link key={t.id} href={{ pathname: '/gestion-abonnements', query: { onglet: t.id } }} shallow style={{
                  padding: '10px 16px', fontSize: 13, textDecoration: 'none', marginBottom: -1,
                  color: onglet === t.id ? 'var(--bd)' : 'var(--inkm)', fontWeight: onglet === t.id ? 600 : 400,
                  borderBottom: '2px solid ' + (onglet === t.id ? '#C9A84C' : 'transparent'),
                }}>{t.label}</Link>
              ))}
            </nav>
          )}
          {!onglet && <p style={{ fontSize: 13, color: 'var(--inkm)' }}>Aucune habilitation ne vous est attribuée. Contactez le super-administrateur.</p>}
          {onglet === 'abonnes' && <SubscriptionsBoard caps={isSuper ? null : caps} title="Gestion des abonnements" />}
          {onglet === 'decisions' && <IngestDecisions />}
          {onglet === 'tarif' && <IngestTarif />}
        </main>
      </div>
    </>
  )
}
