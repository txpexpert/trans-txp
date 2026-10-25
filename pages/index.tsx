// pages/index.tsx — Accueil IXP-Import-eXPert (refonte 2026)
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import SiteShell from '../components/SiteShell'
import IxpAssistant from '../components/IxpAssistant'
import IxpIntro from '../components/IxpIntro'
import IxpTicker from '../components/IxpTicker'
import IxpLogo from '../components/IxpLogo'
import { CHAIN, PROFILS, espaceBySlug } from '../lib/suite'

const RISQUES = [
  { t: 'Un code SH mal choisi', d: "Le droit payé est faux, les documents exigés aussi. L'écart peut être redressé lors d'un contrôle a posteriori, des années plus tard." },
  { t: 'Une origine non prouvée', d: "La préférence tarifaire d'un accord de libre-échange tombe si la preuve d'origine ne tient pas. Les droits deviennent exigibles." },
  { t: 'Un régime mal apuré', d: "Une admission temporaire ou un perfectionnement actif mal suivi transforme une suspension de droits en dette douanière." },
  { t: 'Une valeur contestable', d: "Frais oubliés, redevances, Incoterm mal lu : la valeur déclarée devient le point faible du dossier." },
]

type ScanQ = { q: string; o: [string, number][] }
const SCAN: ScanQ[] = [
  { q: 'Comment validez-vous vos codes SH ?', o: [['Habitude ou transitaire', 34], ['Au cas par cas', 18], ['Registre audité', 4]] },
  { q: 'Utilisez-vous des accords de libre-échange ?', o: [['Oui, sans traçabilité', 33], ['Oui, documenté', 10], ['Non', 14]] },
  { q: 'Contrôle ou blocage sur les 3 dernières années ?', o: [['Plusieurs fois', 33], ['Une fois', 18], ['Jamais', 5]] },
]

export default function Accueil() {
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
    <SiteShell title="IXP-Import-eXPert : conformité et optimisation douanière au Maroc"
      description="Qualifiez, chiffrez et sécurisez chaque importation avant d’initier vos opérations : classement SH, origine, coût rendu, documents et conformité, avec des experts douaniers.">

      <IxpIntro />
      <IxpTicker />

      {/* ── HERO ── */}
      <section className="x-hero">
        <div className="x-wrap"><IxpAssistant /></div>
        <div className="x-wrap x-hero-grid">
          <div>
            <div className="x-eyebrow">Plateforme de conformité et d’optimisation douanière · Maroc</div>
            <div className="x-h1-row">
              <IxpLogo size={84} className="x-hero-logo" />
              <h1 className="x-h1 x-h1-sm">Chaque importation <em>qualifiée, chiffrée et sécurisée</em>, avant d’initier vos opérations.</h1>
            </div>
            <p className="x-lead">Import-eXPert relie le classement SH des produits, l’origine, le coût rendu, les documents et la conformité dans un seul dossier traçable. Naviguez et consultez toutes les dispositions actualisées de la réglementation en matière d’impôts, d’opérations de change, de fiscalité territoriale, de commerce extérieur et de douane, en un seul endroit.<br />Nos experts prennent le relais quand un dossier l’exige ou quand vous sollicitez une assistance personnalisée.</p>
            <div className="x-hero-cta">
              <Link href="/diagnostic" className="x-btn x-btn-dark">Lancer le diagnostic de conformité</Link>
              <Link href="/plateforme#video" className="x-btn x-btn-line">▶ Voir la présentation</Link>
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
                ['Exécuter', 'Documents générés, DUM à vérifier', 'En cours', false],
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

      {/* ── PROBLÈME ── */}
      <section className="x-sec">
        <div className="x-wrap x-split">
          <div>
            <div className="x-eyebrow">Le risque</div>
            <h2 className="x-h2">Une erreur d’importation ne se voit pas <em>le jour où la marchandise arrive</em>.</h2>
            <p className="x-sub">Elle se révèle plus tard : lors d’un contrôle, d’un litige fournisseur, d’un écart de stock ou d’une revue comptable, quand la marchandise est vendue depuis longtemps et que l’erreur est irréversible. Les quatre fragilités concentrent toutes ces mauvaises surprises ; chacune correspond à une étape sur la plateforme.</p>
          </div>
          <div className="x-risks">
            {RISQUES.map((r, i) => (
              <div className="x-risk" key={r.t}><i>{i + 1}</i><div><b>{r.t}</b><p>{r.d}</p></div></div>
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
          <div className="x-chain">
            {CHAIN.map((e, i) => (
              <Link href={`/espaces/${e.slug}`} className={`x-link-card x-c-${e.slug}`} key={e.slug}>
                <span className="x-num">{e.num}</span>
                <div className="x-verb">{e.verb}</div>
                <div className="x-card-t">{e.title}</div>
                <p className="x-card-q">{e.question}</p>
                <div className="x-card-out"><b>Livrable</b>{e.livrable}</div>
                {i < CHAIN.length - 1 && <span className="x-arrow" aria-hidden="true" />}
              </Link>
            ))}
          </div>
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
            <p className="x-sub">Aucune IA ne signe un avis opposable. Import-eXPert combine une plateforme qui industrialise vos opérations et une équipe d’experts douaniers qui intervient, à l’acte, quand l’enjeu le justifie.</p>
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
              <div className="x-eyebrow">Douane Engineering</div>
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
                <div style={{ marginTop: 26 }}><Link href="/diagnostic" className="x-btn x-btn-dark">Évaluer votre conformité</Link></div>
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
            <h2 className="x-h2">Mesurez votre <em>exposition douanière</em>.</h2>
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
            <div className="x-eyebrow">Baromètre 2026 · en préparation</div>
            <h3 className="x-h3">La friction douanière au Maroc, mesurée par ceux qui la vivent</h3>
            <p className="x-sub">Délais, erreurs de conformité, accords sous-exploités : une enquête menée auprès d’importateurs, de transitaires et de directions financières. Participez et recevez le rapport en avant-première.</p>
            <div style={{ marginTop: 20 }}><Link href="/enquete" className="x-btn x-btn-line">Participer à l’enquête</Link></div>
          </div>
          <div className="x-panel">
            <div className="x-eyebrow">Kits opérationnels</div>
            <h3 className="x-h3">Vos dossiers sensibles, déjà structurés</h3>
            <p className="x-sub">Origine préférentielle, régimes suspensifs, classement et contrôle a posteriori : des kits interactifs avec assistants, calculateurs, modèles générés et tableaux de suivi, chaque règle rattachée à son texte.</p>
            <div style={{ marginTop: 20 }}><Link href="/expertise#kits" className="x-btn x-btn-line">Ouvrir les kits</Link></div>
          </div>
        </div>
      </section>

    </SiteShell>
  )
}
