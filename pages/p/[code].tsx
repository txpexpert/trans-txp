// pages/p/[code].tsx — page d'accueil d'un partenaire (transitaire, expert-comptable, banque, CCI) :
// « diagnostic offert par … ». Le code est conservé 90 jours dans un cookie technique, sans donnée
// personnelle, pour rattacher au partenaire le compte créé ensuite.
import type { GetServerSideProps } from 'next'
import Link from 'next/link'
import SiteShell from '../../components/SiteShell'
import { supabaseAdmin } from '../../lib/supabaseAdmin'

export const getServerSideProps: GetServerSideProps = async ({ params, res }) => {
  const code = String(params?.code || '').toLowerCase()
  if (!/^[a-z0-9-]{3,30}$/.test(code)) return { notFound: true }
  const { data } = await supabaseAdmin().from('partenaires').select('nom, type, actif').eq('code', code).maybeSingle()
  if (!data || !data.actif) return { redirect: { destination: '/diagnostic', permanent: false } }
  res.setHeader('Set-Cookie', `ixp_parrain=${code}; Path=/; Max-Age=${90 * 86400}; SameSite=Lax; Secure`)
  return { props: { nom: data.nom, type: data.type } }
}

export default function PagePartenaire({ nom, type }: { nom: string; type: string }) {
  const qui = type === 'transitaire' ? 'votre transitaire' : type === 'expert_comptable' ? 'votre expert-comptable' : type === 'banque' ? 'votre banque' : 'votre partenaire'
  return (
    <SiteShell title={`Diagnostic offert par ${nom} | Import-eXPert`} description={`${nom} vous offre le diagnostic de conformité de vos importations.`}>
      <section className="x-hero">
        <div className="x-wrap">
          <div className="x-eyebrow">Offert par {nom}</div>
          <h1 className="x-h1 x-h1-sm">Ce que la douane contrôlera demain, <em>mesurez-le aujourd’hui</em>.</h1>
          <p className="x-lead">{nom}, {qui}, vous offre le diagnostic de conformité Import-eXPert : en une quinzaine de minutes, il chiffre en dirhams les droits exposés sur la période de reprise de quatre ans et vous remet un plan d’action.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
            <Link href="/diagnostic" className="x-btn x-btn-dark">Mesurer mon exposition</Link>
            <Link href="/auth/register?plan=pro" className="x-btn x-btn-line">Essai complet de 14 jours</Link>
          </div>
          <ul className="x-list" style={{ marginTop: 26, maxWidth: 680 }}>
            <li>Classement, origine, valeur, documents : chaque point rattaché au texte officiel</li>
            <li>Des fiches produits que {nom} peut partager avec vous, pour des dossiers prêts avant le dépôt</li>
            <li>Sans engagement et sans moyen de paiement</li>
          </ul>
        </div>
      </section>
    </SiteShell>
  )
}
