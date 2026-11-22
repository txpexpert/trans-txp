// pages/index.tsx — Accueil IXP-Import-eXPert (refonte 2026)
import { useEffect, useState } from 'react'
import type { GetServerSideProps } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import SiteShell from '../components/SiteShell'
import ChainRows from '../components/ChainRows'
import IxpAssistant from '../components/IxpAssistant'
import IxpIntro from '../components/IxpIntro'
import IxpTicker from '../components/IxpTicker'
import IxpLogo from '../components/IxpLogo'
import { PROFILS, espaceBySlug } from '../lib/suite'
import { CAS_TYPES } from '../lib/casTypes'
import { VARIANTES, lireVariante, type Variante } from '../lib/ab'

// Test A/B de l'accroche : variante attribuée au premier passage (cookie technique, sans donnée personnelle)
export const getServerSideProps: GetServerSideProps<{ variante: Variante }> = async ({ req, res }) => {
  let variante = lireVariante(req.headers.cookie)
  if (!variante) {
    variante = (['A', 'B', 'C'] as Variante[])[Math.floor(Math.random() * 3)]
    res.setHeader('Set-Cookie', `ixp_ab=${variante}; Path=/; Max-Age=${90 * 86400}; SameSite=Lax; Secure`)
  }
  return { props: { variante } }
}

// Rubrique « Le risque que vous ne voyez pas » : l'importation comme un tout (produit, achat, coût,
// logistique, change et paiement, veille) ; la douane n'est qu'une de ses fonctions (règle du site, nov. 2026).
const DOULEURS = [
  { q: '« Votre produit est conforme chez votre fournisseur. Pas forcément au Maroc. »', d: "Vérifiez vos normes, contrôles techniques, licences et étiquetages.", e: 'Qualifier · fiche produit' },
  { q: '« Le fournisseur le moins cher n’est pas toujours l’achat le moins cher. »', d: "Pays d'origine, accord de libre-échange, délais, conditions de paiement : à prix égal, le choix du fournisseur change le coût final et le risque.", e: 'Optimiser · achat, origine et accords' },
  { q: '« Votre importation coûte plus cher que votre facture. »', d: "Fret, assurance, change, droits et taxes, magasinage, financement : un coût rendu sous-estimé fausse la marge de toute une gamme.", e: 'Chiffrer · coût de revient' },
  { q: '« L’Incoterm signé décide de qui paie quand le transport se passe mal. »', d: "Avarie, retard au port, surestaries, assurance insuffisante : un Incoterm mal choisi vous fait porter des frais et des risques que vous ne maîtrisez pas.", e: 'Exécuter · logistique et transport' },
  { q: '« Payer un fournisseur étranger, c’est aussi une opération de change. »', d: "Domiciliation bancaire, documents exigés, délais de règlement, variation du cours : un paiement mal préparé retarde la commande et entame la marge.", e: 'Sécuriser · change et règlement' },
  { q: '« Vous découvrez le changement quand la marchandise est déjà en route. »', d: "Loi de finances, cours du dirham, mesures commerciales, prix du fret : sans veille, la direction décide avec un temps de retard.", e: 'Pilotage · intelligence et stratégie' },
]

const PILIERS = [
  { v: 'Savoir', p: "Le texte exact, à jour, pour chaque question : tarif, circulaires, code des douanes, CGI, change. IXP-Assistant cite sa source.", m: 'Bibliothèque · IXP-Assistant · glossaire FR/AR' },
  { v: 'Chiffrer', p: "Le coût rendu réel de chaque importation, et l'argent récupérable grâce aux accords et aux régimes économiques.", m: 'Coût de revient · coût de change · valeur des marchandises · comparateur de régimes' },
  { v: 'Prouver', p: "Un dossier défendable, daté et sourcé, par produit et par opération. Un expert tranche quand l'enjeu le justifie.", m: 'Fiche produit · dossier d’importation · avis d’expert' },
]

type ScanQ = { q: string; o: [string, number][] }
const SCAN: ScanQ[] = [
  { q: 'Comment validez-vous vos codes SH ?', o: [['Habitude ou transitaire', 34], ['Au cas par cas', 18], ['Registre audité', 4]] },
  { q: 'Utilisez-vous des accords de libre-échange ?', o: [['Oui, sans traçabilité', 33], ['Oui, documenté', 10], ['Non', 14]] },
  { q: 'Contrôle ou blocage sur les 3 dernières années ?', o: [['Plusieurs fois', 33], ['Une fois', 18], ['Jamais', 5]] },
]

export default function Accueil({ variante = 'A' }: { variante?: Variante }) {
  const accroche = VARIANTES[variante] || VARIANTES.A
  useEffect(() => {
    try { if (sessionStorage.getItem('ixp-accueil_vue')) return; sessionStorage.setItem('ixp-accueil_vue', '1') } catch {}
    fetch('/api/evenement', { method: 'POST', credentials: 'same-origin', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ e: 'accueil_vue' }) }).catch(() => {})
  }, [])
  const router = useRouter()
  const [produit, setProduit] = useState('')
  const [profil, setProfil] = useState(PROFILS[0].id)
  const [rep, setRep] = useState<(number | null)[]>([null, null, null])

  const complet = rep.every(r => r !== null)
  const score = complet ? rep.reduce<number>((s, r, i) => s + SCAN[i].o[r as number][1], 0) : null
  const niveau = score === null ? '' : score >= 70 ? 'Exposition élevée' : score >= 35 ? 'Exposition modérée' : 'Exposition maîtrisée'

  const classer = (e: React.FormEvent) => {
    e.preventDefault()
    const q = produit.trim()
    router.push(q ? `/modules/classement?q=${encodeURIComponent(q)}` : '/modules/classement')
  }

  return (
    <SiteShell title="IXP-Import-eXPert : conformité et optimisation des opérations d’importation"
      description="Qualifiez, chiffrez et sécurisez chaque importation avant d’initier vos opérations : produit, achat, classement SH, origine, coût rendu, logistique, change et conformité.">

      <IxpIntro />
      <IxpTicker />

      {/* ── HERO ── */}
      <section className="x-hero">
        <div className="x-wrap"><IxpAssistant /></div>
        <div className="x-wrap x-hero-grid">
          <div>
            <div className="x-eyebrow">Conformité import · Maroc</div>
            <div className="x-h1-row">
              <IxpLogo size={84} className="x-hero-logo" />
              <h1 className="x-h1 x-h1-sm">{accroche.avant} <em>{accroche.apres}</em>.</h1>
            </div>
            <p className="x-lead">Produit, fournisseur, coût rendu, transport, paiement, conformité : Import-eXPert qualifie, chiffre et sécurise chaque importation avant de passer commande, et vous remet un dossier défendable, chaque point appuyé sur le texte officiel.<br />Nos experts en processus d’importation tranchent les cas difficiles.</p>
            <div className="x-hero-cta">
              <Link href="/diagnostic" className="x-btn x-btn-dark">Mesurer mon exposition</Link>
            </div>
            <Link href="/plateforme" className="x-pres-link">
              <span className="x-pres-link-k">Découvrir</span>
              <span className="x-pres-link-t">Présentation de notre plateforme en 5 espaces</span>
              <span className="x-pres-link-a" aria-hidden="true">→</span>
            </Link>
            <form className="x-try" onSubmit={classer}>
              <label htmlFor="produit">Essayez : décrivez un produit à importer</label>
              <div className="x-try-row">
                <input id="produit" value={produit} onChange={e => setProduit(e.target.value)} placeholder="Ex. : roulements à billes pour moteur électrique" autoComplete="off" />
                <button className="x-btn x-btn-gold" type="submit">Trouver le code SH</button>
              </div>
            </form>
          </div>

          <aside className="x-dossier" aria-label="Illustration d'un dossier d'opération">
            <div className="x-dossier-hd">
              <strong>Dossier d’opération</strong>
              <span className="x-mono">Illustration</span>
            </div>
            <div style={{ padding: '14px 22px 4px' }}>
              <div className="x-mono">PRODUIT</div>
              <div style={{ fontSize: 15.5, fontWeight: 500 }}>Roulements à billes · import UE</div>
            </div>
            <ol className="x-steps">
              {[
                ['Qualifier', 'Code SH 8482.10 justifié', 'Fait', true],
                ['Optimiser', 'Origine UE, preuve à joindre', 'Fait', true],
                ['Chiffrer', 'Coût rendu calculé', 'Fait', true],
                ['Exécuter', 'Documents d’import et de transport à vérifier', 'En cours', false],
                ['Sécuriser', 'Contrôle de conformité', 'À venir', false],
              ].map(([v, d, s, ok], i) => (
                <li className="x-step" key={v as string}>
                  <span className={`x-step-n ${ok ? 'done' : ''}`}>{ok ? '✓' : `0${i + 1}`}</span>
                  <div><b>{v}</b><span>{d}</span></div>
                  <span className={`x-pill ${ok ? 'ok' : ''}`}>{s}</span>
                </li>
              ))}
            </ol>
            <div className="x-dossier-ft">Chaque étape lit et enrichit le même dossier : rien n’est ressaisi.</div>
          </aside>
        </div>
      </section>

      {/* ── DOULEURS CACHÉES ── */}
      <section className="x-sec">
        <div className="x-wrap">
          <div className="x-eyebrow">Le risque que vous ne voyez pas</div>
          <h2 className="x-h2">Une erreur d’importation ne se voit pas <em>le jour où la marchandise arrive</em>.</h2>
          <p className="x-sub">Elle se révèle plus tard : dans la marge, lors d’un litige fournisseur, d’un retard de livraison, d’un paiement bloqué ou d’un contrôle, quand la marchandise est vendue depuis longtemps. Une importation réussie se joue sur toute la chaîne : le produit, l’achat, le coût rendu, la logistique, le change et le paiement, la conformité.</p>
          <p className="x-sub">Un exemple parmi d’autres : <b>23,5 milliards de dirhams</b> de redressements ont été opérés en 2025 au titre de la sous-facturation, en hausse de 33 % sur un an (ADII, rapport d’activité 2025).</p>
          <div className="x-pains">
            {DOULEURS.map(d => (
              <div className="x-pain" key={d.q}><q>{d.q}</q><p>{d.d}</p><span className="x-mono">{d.e}</span></div>
            ))}
          </div>
        </div>
      </section>


      {/* ── LA CHAÎNE ── */}
      <section className="x-sec x-sec-dark" id="chaine">
        <div className="x-wrap">
          <div className="x-eyebrow">La plateforme</div>
          <h2 className="x-h2">Une opération, <em>cinq étapes</em>, un seul dossier.</h2>
          <p className="x-sub">Chaque espace répond à une question que vous vous posez à chaque importation, produit un livrable, et transmet ses données à l’étape suivante.</p>
          <div style={{ marginTop: 22 }}><ChainRows /></div>
          <div className="x-base">
            <Link href="/espaces/bibliotheque" className="x-link-card x-c-bibliotheque"><div className="x-verb">Bibliothèque</div><p>Le socle : tarif, circulaires, CGI, IGOC, décisions, glossaire.</p></Link>
            <Link href="#assistant" className="x-link-card x-c-assistant"><div className="x-verb">IXP-Assistant</div><p>Dans chaque espace, il répond en citant le texte exact.</p></Link>
            <Link href="/espaces/piloter" className="x-link-card x-c-piloter"><div className="x-verb">Piloter</div><p>Intelligence et stratégie pour la direction générale.</p></Link>
          </div>
        </div>
      </section>

      {/* ── HYBRIDE : LOGICIEL + EXPERT ── */}
      <section className="x-sec">
        <div className="x-wrap">
          <div className="x-center" style={{ marginBottom: 40 }}>
            <div className="x-eyebrow">Notre différence</div>
            <h2 className="x-h2">IXP-Assistant répond à vos questions fréquentes. <em>Nos experts tranchent</em> les cas difficiles.</h2>
            <p className="x-sub">Aucune IA ne signe un avis opposable. Import-eXPert combine une plateforme qui industrialise vos opérations et une équipe d’experts en processus d’importation (douane, change, logistique, fiscalité) qui intervient, à l’acte, quand l’enjeu le justifie.</p>
          </div>
          <div className="x-two">
            <div className="x-panel">
              <div className="x-eyebrow">IXP-Assistant</div>
              <h3 className="x-h3">Une réponse immédiate, toujours sourcée</h3>
              <ul className="x-list">
                <li>Cite la circulaire, l’article ou l’accord sur lequel il s’appuie</li>
                <li>Interrogé à l’écrit ou à la voix, en réponses courtes et actionnables</li>
                <li>Renvoie vers l’outil ou la page qui règle la question</li>
              </ul>
              <Link href="#assistant" className="x-btn x-btn-line">Essayer IXP-Assistant</Link>
            </div>
            <div className="x-panel dark">
              <div className="x-eyebrow">Import Engineering</div>
              <h3 className="x-h3">Un expert, quand l’enjeu le justifie</h3>
              <ul className="x-list">
                <li>Renseignement express, réponse écrite sous 48 h ouvrées</li>
                <li>Avis motivé, prêt à être joint au dossier</li>
                <li>Accompagnement : contentieux, régimes économiques, OEA</li>
              </ul>
              <Link href="/expertise" className="x-btn x-btn-gold">Voir les services experts</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── PILIERS ── */}
      <section className="x-sec x-sec-white">
        <div className="x-wrap">
          <div className="x-eyebrow">La réponse</div>
          <h2 className="x-h2">Savoir, chiffrer, <em>prouver</em>.</h2>
          <p className="x-sub">Import-eXPert redonne à l’entreprise ce que l’administration a déjà : des règles à jour, des calculs fiables et une trace de chaque décision.</p>
          <div className="x-pillars">
            {PILIERS.map(p => (
              <div className="x-pillar" key={p.v}><div className="x-verb">{p.v}</div><p>{p.p}</p><span className="x-mono">{p.m}</span></div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CAS TYPES ── */}
      <section className="x-sec">
        <div className="x-wrap">
          <div className="x-eyebrow">Cas types</div>
          <h2 className="x-h2">Trois erreurs fréquentes, <em>expliquées par les textes</em>.</h2>
          <p className="x-sub">La situation, le point qui coince, ce que cela coûte, et ce qu’Import-eXPert signale avant l’opération.</p>
          <div className="x-cas-grid">
            {CAS_TYPES.map(c => (
              <Link href={`/cas-types#${c.slug}`} className="x-cas" key={c.slug}>
                <span className="x-eyebrow">{c.domaine}</span>
                <h3>{c.titre}</h3>
                <p>{c.accroche}</p>
                <span className="x-cas-go">Lire le cas →</span>
              </Link>
            ))}
          </div>
          <p className="x-disclaimer" style={{ marginTop: 14 }}>Cas illustratifs construits à partir des textes officiels ; les entreprises sont fictives.</p>
        </div>
      </section>

      {/* ── PROFILS ── */}
      <section className="x-sec x-sec-white" id="profils">
        <div className="x-wrap">
          <div className="x-eyebrow">Pour qui</div>
          <h2 className="x-h2">Conçue pour ceux qui <em>signent</em> les opérations.</h2>
          <div className="x-tabs" role="tablist">
            {PROFILS.map(x => (
              <button key={x.id} role="tab" data-tab={x.id} aria-selected={profil === x.id} className={`x-tab ${profil === x.id ? 'on' : ''}`} onClick={() => setProfil(x.id)}>{x.titre}</button>
            ))}
          </div>
          {PROFILS.map(p => (
            <div className="x-prof" key={p.id} data-panel={p.id} hidden={profil !== p.id}>
              <div>
                <h3 className="x-h3">{p.accroche}</h3>
                <ul className="x-list">{p.points.map(t => <li key={t}>{t}</li>)}</ul>
              </div>
              <div>
                <div className="x-mono" style={{ marginBottom: 12 }}>VOS ESPACES PRIORITAIRES</div>
                <div className="x-chips">
                  {p.espaces.map(s => { const e = espaceBySlug(s)!; return (
                    <Link key={s} href={`/espaces/${s}`} className={`x-chip x-c-${s}`}><span className="x-num">{e.num}</span>{e.verb}</Link>
                  ) })}
                </div>
                <div style={{ marginTop: 26, display: 'flex', gap: 8, flexWrap: 'wrap' }}><Link href="/diagnostic" className="x-btn x-btn-dark">Évaluer votre conformité</Link><Link href={`/profils/${p.id}`} className="x-btn x-btn-line">Votre page dédiée</Link></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DIAGNOSTIC ── */}
      <section className="x-sec x-sec-dark" id="diagnostic">
        <div className="x-wrap x-scan">
          <div>
            <div className="x-eyebrow">Aperçu en 1 minute · diagnostic complet en 15 minutes</div>
            <h2 className="x-h2">Mesurez votre <em>exposition aux risques à l’import</em>.</h2>
            <p className="x-sub" style={{ marginBottom: 28 }}>Trois questions pour une première indication. Le diagnostic complet couvre ensuite huit domaines, chiffre votre exposition et produit un plan d’action que vous suivez dans le temps.</p>
            {SCAN.map((s, i) => (
              <div className="x-q" key={s.q}>
                <p>{i + 1}. {s.q}</p>
                <div className="x-opts">
                  {s.o.map(([lbl], j) => (
                    <button key={lbl} type="button" data-q={i} data-a={j} data-v={SCAN[i].o[j][1]} className={`x-opt ${rep[i] === j ? 'on' : ''}`}
                      onClick={() => setRep(r => r.map((v, k) => (k === i ? j : v)))}>{lbl}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="x-gauge" aria-live="polite">
            <span>INDICE D’EXPOSITION</span>
            <b><span id="x-score">{score ?? '—'}</span><small className="x-gauge-max">/100</small></b>
            <p id="x-niveau">{complet ? `${niveau}. Indication sommaire, à confirmer par le diagnostic complet.` : 'Répondez aux trois questions pour obtenir votre indice.'}</p>
            <Link href="/diagnostic" className="x-btn x-btn-gold">Lancer le diagnostic complet →</Link>
          </div>
        </div>
      </section>

      {/* ── RESSOURCES ── */}
      <section className="x-sec-tight">
        <div className="x-wrap x-two">
          <div className="x-panel">
            <div className="x-eyebrow">Baromètre 2026 · enquête ouverte</div>
            <h3 className="x-h3">Mesurer les difficultés et frictions d’importation</h3>
            <p className="x-sub">Délais, erreurs de conformité, accords sous-exploités : une enquête menée auprès d’importateurs, de transitaires et de directions financières. Les réponses sont anonymes et les résultats publiés en ligne.</p>
            <div style={{ marginTop: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}><Link href="/enquete" className="x-btn x-btn-dark">Participer à l’enquête</Link><Link href="/barometre" className="x-btn x-btn-line">Voir les résultats</Link></div>
          </div>
          <div className="x-panel">
            <div className="x-eyebrow">Kits opérationnels</div>
            <h3 className="x-h3">Vos dossiers sensibles, déjà structurés</h3>
            <p className="x-sub">Origine préférentielle, régimes suspensifs, classement et contrôle a posteriori : des kits interactifs avec assistants, calculateurs, modèles générés et tableaux de suivi, chaque règle rattachée à son texte.</p>
            <div style={{ marginTop: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}><a href="/kits/pratiques/IXP_Kit02_Regimes_economiques.html" target="_blank" rel="noopener" className="x-btn x-btn-dark">Kit 02 · Régimes économiques</a><Link href="/expertise#kits" className="x-btn x-btn-line">Ouvrir les kits</Link></div>
          </div>
        </div>
      </section>

    </SiteShell>
  )
}
