// pages/produits/[sh4].tsx — page publique par position SH (4 chiffres) : droits du tarif 2026,
// décisions de classement, textes récents, préférences possibles et points de vigilance.
// Générée à l'avance pour les 100 premières positions, à la première visite pour les autres ; rafraîchie chaque jour.
import type { GetStaticPaths, GetStaticProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import SiteShell from '../../components/SiteShell'
import { chargerPosition, type Position } from '../../lib/produits'
import { POSITIONS_TOP } from '../../lib/produitsTop'

const fmt = (c: string) => (c.length === 10 ? `${c.slice(0, 4)}.${c.slice(4, 6)}.${c.slice(6, 8)}.${c.slice(8)}` : c)
const pct = (x: number | null) => (x == null ? '—' : `${String(x).replace('.', ',')} %`)
const dfr = (d: string | null) => (d ? new Date(d).toLocaleDateString('fr-FR') : '')
const court = (s: string, n = 70) => (s.length > n ? s.slice(0, n - 1).replace(/[\s,;:]+\S*$/, '') + '…' : s)
const LIB: Record<string, string> = { circulaire: 'Circulaire', note: 'Note', instruction_commune: 'Instruction commune' }

export const getStaticPaths: GetStaticPaths = async () => ({ paths: POSITIONS_TOP.map(sh4 => ({ params: { sh4 } })), fallback: 'blocking' })
export const getStaticProps: GetStaticProps<{ p: Position }> = async ({ params }) => {
  const p = await chargerPosition(String(params?.sh4 || ''))
  if (!p) return { notFound: true, revalidate: 3600 }
  return { props: { p }, revalidate: 86400 }
}

export default function PagePosition({ p }: { p: Position }) {
  const titre = court(p.libelle)
  const ecart = p.min != null && p.max != null ? p.max - p.min : 0
  const industriel = p.chapitre >= 25
  const recents = p.textes.filter(t => t.date && Date.now() - +new Date(t.date) < 365 * 864e5)
  const fourchette = p.min === p.max ? pct(p.min) : `de ${pct(p.min)} à ${pct(p.max)}`
  const faq = [
    { q: `Quel est le droit d’importation pour « ${titre} » (SH ${p.sh4}) au Maroc ?`,
      a: `Selon le tarif des droits d’importation 2026, le droit applicable à la position ${p.sh4} va ${fourchette} selon la sous-position (${p.lignes.length} ligne${p.lignes.length > 1 ? 's' : ''} tarifaire${p.lignes.length > 1 ? 's' : ''}). S’y ajoutent la TVA à l’importation et, sauf exonération, la taxe parafiscale à l’importation de 0,25 %.` },
    { q: `Existe-t-il des décisions de classement sur la position ${p.sh4} ?`,
      a: p.decisions.length ? `Oui : ${p.decisions.length} décision${p.decisions.length > 1 ? 's' : ''} de classement publiée${p.decisions.length > 1 ? 's' : ''}, la plus récente par la circulaire n° ${p.decisions[0].circulaire}${p.decisions[0].date ? ` du ${dfr(p.decisions[0].date)}` : ''}.` : `Aucune décision de classement publiée ne vise cette position dans les textes consultés.` },
    { q: `Peut-on payer moins de droits sur la position ${p.sh4} ?`,
      a: industriel ? `Pour un produit originaire d’un pays lié au Maroc par un accord (Union européenne, AELE, Royaume-Uni, Türkiye, États-Unis, accord d’Agadir, zone arabe de libre-échange, Émirats arabes unis), le droit d’importation peut être réduit, souvent à zéro pour les produits industriels, sur présentation d’une preuve d’origine conforme.` : `Pour les produits agricoles et agroalimentaires, les accords prévoient des préférences partielles, des contingents ou des listes de produits : le droit réduit dépend de l’accord et du produit.` },
  ]
  const jsonLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }

  return (
    <SiteShell title={`SH ${p.sh4} ${titre} : droits d’importation au Maroc 2026 | Import-eXPert`}
      description={`Position ${p.sh4} (${titre}) : droit d’importation ${fourchette}, ${p.decisions.length} décision(s) de classement, textes récents et préférences tarifaires. Tarif 2026.`}>
      <Head><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /></Head>
      <section className="x-hero" style={{ paddingBottom: 18 }}>
        <div className="x-wrap">
          <div className="x-crumb"><Link href="/produits">Produits</Link> / Chapitre {String(p.chapitre).padStart(2, '0')} / {p.sh4}</div>
          <div className="x-eyebrow">Position SH {p.sh4} · Tarif 2026</div>
          <h1 className="x-h1 x-h1-sm">{titre} : <em>droits et classement à l’importation</em></h1>
          {titre !== p.libelle && <p className="x-lead" style={{ fontSize: 16 }}>{p.libelle}</p>}
          <div className="x-pr-kpi">
            <div><span>Droit d’importation</span><b>{fourchette}</b></div>
            <div><span>Lignes tarifaires</span><b>{p.lignes.length}</b></div>
            <div className={p.decisions.length ? 'warn' : ''}><span>Décisions de classement</span><b>{p.decisions.length}</b></div>
            <div><span>Textes des 12 derniers mois</span><b>{recents.length}</b></div>
          </div>
        </div>
      </section>

      <section className="x-sec-tight" style={{ paddingTop: 0 }}>
        <div className="x-wrap" style={{ display: 'grid', gap: 20 }}>
          {(ecart >= 10 || p.decisions.length > 0) && (
            <div className="x-pr-vig">
              <b>Points de vigilance</b>
              <ul>
                {ecart >= 10 && <li>Jusqu’à <b>{String(ecart).replace('.', ',')} points</b> d’écart de droit entre les sous-positions ({pct(p.min)} à {pct(p.max)}) : le choix de la sous-position fixe directement le montant payé, et c’est le premier point vérifié lors d’un contrôle a posteriori.</li>}
                {p.decisions.length > 0 && <li><b>{p.decisions.length} décision{p.decisions.length > 1 ? 's' : ''} de classement</b> publiée{p.decisions.length > 1 ? 's' : ''} : l’administration a déjà dû trancher des cas sur cette position. Vérifiez que votre produit n’en relève pas.</li>}
              </ul>
            </div>)}

          <div className="x-ff">
            <h2 className="x-pr-h2">Droits d’importation par sous-position (tarif 2026)</h2>
            <div style={{ overflowX: 'auto' }}><table className="x-fl"><thead><tr><th>Code</th><th>Désignation</th><th>Droit</th><th>Unité</th></tr></thead><tbody>
              {p.lignes.map(l => <tr key={l.code}><td className="mono" style={{ whiteSpace: 'nowrap' }}>{fmt(l.code)}</td><td>{l.libelle}</td><td style={{ whiteSpace: 'nowrap' }}><b>{pct(l.taux)}</b></td><td>{l.unite || '—'}</td></tr>)}
            </tbody></table></div>
            <p className="x-ff-note">À ces droits s’ajoutent la TVA à l’importation (20 % au taux normal ; certains produits relèvent d’un taux réduit ou d’une exonération) et, sauf exonération, la taxe parafiscale à l’importation de 0,25 % (note n° D7106/16/ADII/100).</p>
          </div>

          {p.decisions.length > 0 && (
            <div className="x-ff">
              <h2 className="x-pr-h2">Décisions de classement publiées</h2>
              <ul className="x-vl-list">{p.decisions.map((d, i) => (
                <li key={i}><div><b>Circulaire n° {d.circulaire}</b>{d.date ? ` du ${dfr(d.date)}` : ''} · <span className="mono">{d.code}</span></div><p><b>{d.designation}</b>{d.resume ? ` · ${court(d.resume, 260)}` : ''}</p></li>))}</ul>
            </div>)}

          {p.textes.length > 0 && (
            <div className="x-ff">
              <h2 className="x-pr-h2">Textes qui citent la position {p.sh4}</h2>
              <ul className="x-vl-list">{p.textes.map((t, i) => (
                <li key={i}><div><b>{LIB[t.type] || t.type} n° {t.numero}</b>{t.date ? ` du ${dfr(t.date)}` : ''}{t.cite ? <span className="mono"> · {t.cite}</span> : null}</div>{t.titre && <p>{t.titre}</p>}</li>))}</ul>
            </div>)}

          <div className="x-ff">
            <h2 className="x-pr-h2">Questions fréquentes</h2>
            {faq.map(f => <div key={f.q} className="x-pr-faq"><h3>{f.q}</h3><p>{f.a}</p></div>)}
          </div>

          <div className="x-pc-cta">
            <p><b>Votre produit relève de la position {p.sh4} ?</b> Établissez sa fiche produit (code exact, décision applicable, origine, documents) et suivez chaque nouveau texte qui la touche.</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link href="/fiches/nouvelle" className="x-btn x-btn-gold">Créer la fiche produit</Link>
              <Link href="/calculateur-dum" className="x-btn x-btn-line" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.4)' }}>Argent laissé sur la table</Link>
            </div>
          </div>
          <p className="x-note">Informations établies à partir du tarif des droits d’importation 2026 et des textes publiés par l’administration, mises à jour chaque jour. Document d’aide à la décision : les données finales sont celles édictées par les autorités compétentes.</p>
        </div>
      </section>
    </SiteShell>
  )
}
