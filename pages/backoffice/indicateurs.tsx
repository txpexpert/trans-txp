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
  const db = supabaseAdmin()
  const { data, error } = await db.rpc('admin_indicateurs', { p_jours: jours })
  const depuis = new Date(Date.now() - jours * 864e5).toISOString().slice(0, 10)
  const { data: cpt } = await db.from('compteurs_evenements').select('evenement, variante, n').gte('jour', depuis)
  const c: Record<string, Record<string, number>> = {}
  for (const r of cpt ?? []) { c[r.evenement] = c[r.evenement] || {}; c[r.evenement][r.variante || '—'] = (c[r.evenement][r.variante || '—'] || 0) + Number(r.n) }
  return { props: { i: data ?? {}, jours, erreur: error?.message ?? null, c } }
}

const pc = (a: number, b: number) => (b ? Math.round((a / b) * 100) + ' %' : '—')

const ACCROCHES: Record<string, string> = { A: 'Ce que la douane contrôlera demain, vérifiez-le aujourd’hui', B: 'Importez sans mauvaise surprise', C: 'Votre importation coûte plus cher que votre facture' }
const somme = (o?: Record<string, number>) => Object.values(o || {}).reduce((s, x) => s + x, 0)

export default function Indicateurs({ i, jours, erreur, c }: { i: I; jours: number; erreur: string | null; c: Record<string, Record<string, number>> }) {
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

      <h2 style={h2}>Haut du parcours ({jours} derniers jours, compteurs anonymes)</h2>
      <div style={grille}>
        <Carte t="Visites de l’accueil" v={somme(c.accueil_vue)} s="une par visite et par onglet" />
        <Carte t="Diagnostics commencés" v={somme(c.diagnostic_commence)} s={`soit ${pc(somme(c.diagnostic_commence), somme(c.accueil_vue))} des visites`} cible="8 % des visiteurs" />
        <Carte t="Diagnostics terminés" v={somme(c.diagnostic_termine)} s={`soit ${pc(somme(c.diagnostic_termine), somme(c.diagnostic_commence))} des diagnostics commencés`} cible="50 %" />
        <Carte t="Échanges expert demandés" v={somme(c.echange_demande)} s={`${somme(c.echange_vue)} vues de la page d’échange`} />
        <Carte t="Clics WhatsApp" v={somme(c.whatsapp_clic)} s="bouton flottant, toutes pages" />
      </div>
      <h2 style={h2}>Test A/B de l’accroche</h2>
      <table className="data-table" style={{ marginBottom: 22 }}><thead><tr><th>Variante</th><th>Accroche</th><th>Visites</th><th>Diagnostics commencés</th><th>Taux</th><th>Terminés</th></tr></thead><tbody>
        {['A', 'B', 'C'].map(v => <tr key={v}><td><b>{v}</b></td><td>{ACCROCHES[v]}</td><td>{c.accueil_vue?.[v] || 0}</td><td>{c.diagnostic_commence?.[v] || 0}</td><td><b>{pc(c.diagnostic_commence?.[v] || 0, c.accueil_vue?.[v] || 0)}</b></td><td>{c.diagnostic_termine?.[v] || 0}</td></tr>)}
      </tbody></table>
      <p style={{ fontSize: 12, color: 'var(--inkm)', marginTop: -14, marginBottom: 22 }}>Ne concluez qu’avec plusieurs centaines de visites par variante ; les diagnostics ouverts sans passer par l’accueil sont comptés sans variante.</p>

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
