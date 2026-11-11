// pages/backoffice/indicateurs.tsx — indicateurs du parcours de conversion (plan marketing),
// calculés sur les comptes et usages existants (fonction SQL admin_indicateurs) : aucune donnée
// nouvelle n'est collectée sur les visiteurs. Les visites se lisent dans Vercel Web Analytics.
import type { GetServerSideProps } from 'next'
import Link from 'next/link'
import { requireAdminSSR } from '../../lib/adminAuth'
import { supabaseAdmin } from '../../lib/supabaseAdmin'
import BackofficeLayout from '../../components/BackofficeLayout'

type I = Record<string, any>
export const getServerSideProps: GetServerSideProps = async ctx => {
  const auth = await requireAdminSSR(ctx)
  if ('redirect' in auth) return auth
  const jours = [7, 30, 90, 365].includes(Number(ctx.query.j)) ? Number(ctx.query.j) : 30
  const { data, error } = await supabaseAdmin().rpc('admin_indicateurs', { p_jours: jours })
  return { props: { i: data ?? {}, jours, erreur: error?.message ?? null } }
}

const pc = (a: number, b: number) => (b ? Math.round((a / b) * 100) + ' %' : '—')

export default function Indicateurs({ i, jours, erreur }: { i: I; jours: number; erreur: string | null }) {
  const Carte = ({ t, v, s, cible }: { t: string; v: string | number; s?: string; cible?: string }) => (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', padding: '14px 16px', borderRadius: 6 }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', color: '#64748B' }}>{t}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#0C2D5C', margin: '4px 0' }}>{v}</div>
      {s && <div style={{ fontSize: 12.5, color: '#334155' }}>{s}</div>}
      {cible && <div style={{ fontSize: 11.5, color: '#9A620C', marginTop: 4 }}>Cible de départ : {cible}</div>}
    </div>)
  const grille = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 22 } as const
  const h2 = { fontSize: 13, textTransform: 'uppercase' as const, letterSpacing: '.06em', color: '#64748B', margin: '0 0 10px' }
  return (
    <BackofficeLayout title="Indicateurs du parcours">
      <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: 'var(--bd)', marginBottom: 4 }}>Indicateurs du parcours</h1>
      <p style={{ fontSize: 13, color: 'var(--inkm)', marginBottom: 14 }}>
        Indicateur principal : <b>références produits suivies et actives</b>. Période :{' '}
        {[7, 30, 90, 365].map(j => <Link key={j} href={`?j=${j}`} style={{ marginRight: 10, fontWeight: j === jours ? 700 : 400 }}>{j} jours</Link>)}
      </p>
      {erreur && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '.75rem 1rem', marginBottom: 12 }}>{erreur}</div>}

      <h2 style={h2}>Valeur livrée</h2>
      <div style={grille}>
        <Carte t="Références suivies" v={i.references_suivies ?? 0} s={`${i.references_completes ?? 0} complètes`} />
        <Carte t="Références actives (90 j)" v={i.references_actives ?? 0} s="fiches modifiées dans les 90 derniers jours" />
        <Carte t="Dossiers défendables émis" v={i.dossiers_emis ?? 0} s={`sur ${jours} jours`} />
        <Carte t="Dossiers clients partagés" v={i.dossiers_partages ?? 0} s={`portail transitaire, sur ${jours} jours`} />
      </div>

      <h2 style={h2}>Parcours de conversion ({jours} derniers jours)</h2>
      <div style={grille}>
        <Carte t="Inscriptions (essais)" v={i.inscriptions ?? 0} s={`${i.essais_en_cours ?? 0} essais en cours`} />
        <Carte t="Essais activés" v={pc(i.essais_actives ?? 0, i.inscriptions ?? 0)} s={`${i.essais_actives ?? 0} avec au moins une fiche produit`} cible="60 % des essais" />
        <Carte t="Conversions" v={i.conversions ?? 0} s={`soit ${pc(i.conversions ?? 0, i.inscriptions ?? 0)} des inscriptions`} cible="15 à 20 %" />
        <Carte t="Diagnostics enregistrés" v={i.diagnostics ?? 0} s={`${i.comptes_avec_diagnostic ?? 0} comptes ont un score`} />
      </div>

      <h2 style={h2}>Base clients</h2>
      <div style={grille}>
        <Carte t="Comptes payants" v={i.payants ?? 0} s={Object.entries(i.payants_par_plan || {}).map(([k, v]) => `${k} : ${v}`).join(' · ') || '—'} />
        <Carte t="Offre Découverte" v={i.decouverte ?? 0} s="comptes gratuits ou essais terminés : à convertir" />
        <Carte t="Renouvellements à 90 jours" v={i.renouvellements_a_90j ?? 0} s="abonnements arrivant à échéance" cible="80 % renouvelés" />
        <Carte t="Commandes de packs" v={i.commandes_packs ?? 0} s={`sur ${jours} jours`} />
      </div>

      <h2 style={h2}>Acquisition</h2>
      <div style={grille}>
        <Carte t="Comptes parrainés" v={i.parraines ?? 0} s={`${i.parraines_payants ?? 0} devenus payants`} />
        <Carte t="Baromètre 2026" v={i.barometre ?? 0} s="répondants (publication à 30)" />
        <Carte t="Visites des pages" v="Analytics" s="Pages produits, Baromètre, calculateur : voir Vercel Web Analytics" />
        <Carte t="Calculateur DUM" v="—" s="calcul fait dans le navigateur : non mesuré par conception" />
      </div>
      <p style={{ fontSize: 12, color: 'var(--inkm)' }}>Les comptes administrateurs sont exclus. Cibles de départ : plan marketing du 9 novembre 2026, à recaler après 30 jours de mesure.</p>
    </BackofficeLayout>
  )
}
