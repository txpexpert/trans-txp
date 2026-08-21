// pages/modules/incoterms-shipping.tsx
// Transit-IA — Module 15 : Qui Paie Quoi ? Matrice Incoterms × Termes Armateurs
// Stack : Next.js 14 Pages Router — TypeScript — CSS Modules

import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import styles from '../../styles/incoterms-shipping.module.css'

// ─── Types ────────────────────────────────────────────────────────────────────

type Coverage = 'Y' | 'P' | 'N'

interface TermRow {
  t: string
  type: 'inc' | 'ship'
  o: Coverage; ot: Coverage; f: Coverage; s: Coverage
  d: Coverage; tr: Coverage; de: Coverage
}

interface Parallel {
  title: string
  inc: string
  ship: string
  matchClass: 'match' | 'approx' | 'warn'
  matchLabel: string
  desc: string
}

interface FinderEntry {
  compatible: string[]
  risky: string[]
  advice: string
  alert: string
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const TERM_ROWS: TermRow[] = [
  { t:'EXW', type:'inc', o:'N',ot:'N',f:'N',s:'N',d:'N',tr:'N',de:'N' },
  { t:'FCA', type:'inc', o:'Y',ot:'P',f:'N',s:'N',d:'N',tr:'N',de:'N' },
  { t:'FAS', type:'inc', o:'Y',ot:'N',f:'N',s:'N',d:'N',tr:'N',de:'N' },
  { t:'FOB', type:'inc', o:'Y',ot:'Y',f:'N',s:'N',d:'N',tr:'N',de:'N' },
  { t:'CFR', type:'inc', o:'Y',ot:'Y',f:'Y',s:'Y',d:'N',tr:'N',de:'N' },
  { t:'CIF', type:'inc', o:'Y',ot:'Y',f:'Y',s:'Y',d:'N',tr:'N',de:'N' },
  { t:'CPT', type:'inc', o:'Y',ot:'Y',f:'Y',s:'Y',d:'P',tr:'P',de:'N' },
  { t:'CIP', type:'inc', o:'Y',ot:'Y',f:'Y',s:'Y',d:'P',tr:'P',de:'N' },
  { t:'DAP', type:'inc', o:'Y',ot:'Y',f:'Y',s:'Y',d:'Y',tr:'Y',de:'Y' },
  { t:'DPU', type:'inc', o:'Y',ot:'Y',f:'Y',s:'Y',d:'Y',tr:'Y',de:'Y' },
  { t:'DDP', type:'inc', o:'Y',ot:'Y',f:'Y',s:'Y',d:'Y',tr:'Y',de:'Y' },
  { t:'Door-to-Door', type:'ship', o:'Y',ot:'Y',f:'Y',s:'Y',d:'Y',tr:'Y',de:'Y' },
  { t:'Door-CY',      type:'ship', o:'Y',ot:'Y',f:'Y',s:'Y',d:'Y',tr:'Y',de:'N' },
  { t:'Door-LO',      type:'ship', o:'Y',ot:'Y',f:'Y',s:'Y',d:'Y',tr:'N',de:'N' },
  { t:'Door-FO',      type:'ship', o:'Y',ot:'Y',f:'Y',s:'Y',d:'N',tr:'N',de:'N' },
  { t:'LILO',  type:'ship', o:'N',ot:'Y',f:'Y',s:'Y',d:'Y',tr:'N',de:'N' },
  { t:'LIFO',  type:'ship', o:'N',ot:'Y',f:'Y',s:'Y',d:'N',tr:'N',de:'N' },
  { t:'FILO',  type:'ship', o:'N',ot:'N',f:'Y',s:'Y',d:'Y',tr:'N',de:'N' },
  { t:'FIFO',  type:'ship', o:'N',ot:'N',f:'Y',s:'Y',d:'N',tr:'N',de:'N' },
  { t:'FIOS',  type:'ship', o:'N',ot:'N',f:'Y',s:'Y',d:'N',tr:'N',de:'N' },
  { t:'CYCY',  type:'ship', o:'N',ot:'Y',f:'Y',s:'Y',d:'Y',tr:'Y',de:'N' },
  { t:'CYLO',  type:'ship', o:'N',ot:'Y',f:'Y',s:'Y',d:'Y',tr:'Y',de:'N' },
  { t:'CYFO',  type:'ship', o:'N',ot:'Y',f:'Y',s:'Y',d:'N',tr:'Y',de:'N' },
  { t:'LICY',  type:'ship', o:'N',ot:'Y',f:'Y',s:'Y',d:'Y',tr:'Y',de:'N' },
  { t:'FICY',  type:'ship', o:'N',ot:'N',f:'Y',s:'Y',d:'Y',tr:'Y',de:'N' },
  { t:'CY-Door', type:'ship', o:'N',ot:'Y',f:'Y',s:'Y',d:'Y',tr:'Y',de:'Y' },
  { t:'LI-Door', type:'ship', o:'N',ot:'Y',f:'Y',s:'Y',d:'Y',tr:'N',de:'Y' },
  { t:'FI-Door', type:'ship', o:'N',ot:'N',f:'Y',s:'Y',d:'Y',tr:'N',de:'Y' },
]

const PARALLELS: Parallel[] = [
  { title:'DDP ↔ Door-to-Door', inc:'DDP', ship:'Door-to-Door', matchClass:'match', matchLabel:'Correspondance exacte',
    desc:'Le seul couple à alignement total sur le transport. Mais DDP va plus loin : le vendeur doit dédouaner et payer les droits — Door-to-Door ne couvre que le transport. Deux contrats distincts en pratique ADII.' },
  { title:'FOB ↔ FIOS / FIFO', inc:'FOB', ship:'FIOS / FIFO', matchClass:'match', matchLabel:'Correspondance fonctionnelle',
    desc:'Le vendeur livre à bord, l\'acheteur paie le fret et les THC destination. FIOS/FIFO excluent les deux THC — combinaison naturelle pour des importateurs gérant leurs opérations portuaires directement.' },
  { title:'CFR / CIF ↔ LIFO', inc:'CFR / CIF', ship:'LIFO', matchClass:'match', matchLabel:'Correspondance proche',
    desc:'OTHC + fret inclus des deux côtés. La DTHC reste à charge acheteur. Le point de transfert de risque (à bord, à l\'origine) est propre à l\'Incoterm — le shipping term ne le définit pas.' },
  { title:'CIF ↔ LILO', inc:'CIF', ship:'LILO', matchClass:'approx', matchLabel:'Coverage supérieur',
    desc:'LILO inclut OTHC + fret + DTHC. CIF inclut OTHC + fret + assurance sans la DTHC. LILO offre donc un meilleur coverage que CIF — avantage à valoriser en négociation avec l\'armateur.' },
  { title:'DAP / DPU ↔ Door-LO / Door-CY', inc:'DAP / DPU', ship:'Door-LO / Door-CY', matchClass:'approx', matchLabel:'Correspondance approchée',
    desc:'DAP = livré non déchargé. DPU = livré déchargé. Door-LO couvre jusqu\'au terminal destination (DTHC incluse). Door-CY jusqu\'au container yard. Grain différent : Incoterms visent un lieu nommé, shipping terms des jalons portuaires.' },
  { title:'EXW — Aucun shipping term direct', inc:'EXW', ship:'—', matchClass:'warn', matchLabel:'Zone de risque',
    desc:'EXW est le terme le plus restrictif. Aucun shipping term ne modélise ce point de départ. En pratique, EXW + FIOS est la combinaison la plus exposée pour un importateur marocain : il paie tout sauf le fret nominal.' },
  { title:'FCA ↔ CY-Door / FI-Door', inc:'FCA', ship:'CY-Door', matchClass:'approx', matchLabel:'Image miroir',
    desc:'FCA livre au CY ou terminal origine. CY-Door couvre tout du CY origine à la porte destination. Combinaison idéale pour une couverture bout-en-bout sur un Incoterm FCA.' },
  { title:'CPT / CIP ↔ CYCY / LICY', inc:'CPT / CIP', ship:'CYCY / LICY', matchClass:'approx', matchLabel:'Correspondance opérationnelle',
    desc:'CPT/CIP = fret payé jusqu\'au lieu convenu (DTHC incluse selon le lieu). CYCY et LICY couvrent les deux CY et frais de terminal — bonne cohérence pour livraisons entrepôt-à-entrepôt.' },
  { title:'CAF / BAF / CUC — Hors Incoterms', inc:'Tous', ship:'Tous', matchClass:'warn', matchLabel:'Friction structurelle',
    desc:'Ces surcharges représentent 10–20% du fret de base sur les routes Asie–Maroc. Présentes explicitement dans les shipping terms, totalement absentes des Incoterms. Un DDP mal négocié peut exploser si elles sont ignorées.' },
]

const FINDER_DATA: Record<string, FinderEntry> = {
  EXW: { compatible:[], risky:['FIOS','FIFO','LIFO','LILO'],
    advice:'En EXW, vous gérez tout depuis l\'entrepôt vendeur. Contractez séparément le pre-carriage, puis choisissez un shipping term. Préférez Door-to-Door ou LILO pour maximiser la couverture armateur.',
    alert:'FIOS/FIFO = zéro THC couverts. Exposition maximale aux surcharges portuaires.' },
  FCA: { compatible:['CY-Door','LI-Door'], risky:['FIFO','FIOS'],
    advice:'FCA livre au CY ou terminal origine. Pour couverture complète destination, combinez avec CY-Door ou LI-Door — couverture bout-en-bout depuis le CY origine jusqu\'à la porte.',
    alert:'FIFO/FIOS excluent les THC — trou sur la DTHC côté destination.' },
  FAS: { compatible:['FIFO','FIOS'], risky:['LILO','LIFO'],
    advice:'FAS livre franco le long du navire. L\'OTHC reste acheteur. FIFO/FIOS sont les plus cohérents : fret net sans THC, vous négociez directement avec l\'agent portuaire.',
    alert:'LIFO inclut l\'OTHC vendeur — doublon potentiel avec ce que FAS a déjà couvert.' },
  FOB: { compatible:['FIFO','FIOS'], risky:['LIFO'],
    advice:'FOB : vendeur à bord. FIFO/FIOS sont les plus propres — fret net, vous négociez les THC séparément.',
    alert:'Évitez LIFO : inclut une OTHC que le vendeur FOB a déjà payée — doublon de facturation.' },
  CFR: { compatible:['LIFO'], risky:['LILO','FILO'],
    advice:'CFR = fret + OTHC inclus. LIFO est le miroir exact : OTHC + fret, sans DTHC. Cohérence parfaite. Si l\'armateur propose LILO, vérifiez que la DTHC n\'est pas facturée deux fois.',
    alert:'FILO (sans OTHC, avec DTHC) crée un trou sur l\'OTHC — incompatible CFR.' },
  CIF: { compatible:['LIFO','LILO'], risky:['FILO','FIOS'],
    advice:'CIF = CFR + assurance. LIFO est compatible. LILO couvre en plus la DTHC — couverture supérieure à votre Incoterm, à valoriser en négociation avec l\'armateur.',
    alert:'FIOS exclut toutes les THC — écart significatif avec le coverage CIF.' },
  CPT: { compatible:['CYCY','LICY'], risky:['LIFO'],
    advice:'CPT = fret payé jusqu\'au lieu convenu (incluant DTHC si le lieu est après le port). CYCY et LICY couvrent les deux CY et frais de terminal — bonne cohérence opérationnelle.',
    alert:'LIFO s\'arrête à OTHC + fret — insuffisant pour un CPT destination CY.' },
  CIP: { compatible:['CYCY','LICY'], risky:['LIFO','FIFO'],
    advice:'CIP = CPT + assurance tous risques. Même logique que CPT. Vérifiez que l\'armateur ne double-facture pas une assurance dans ses surcharges.',
    alert:'LIFO/FIFO créent des gaps sur la DTHC — incompatibles avec l\'obligation CIP.' },
  DAP: { compatible:['Door-LO','Door-CY','CYCY'], risky:['FIFO','FIOS','LIFO'],
    advice:'DAP = livré non déchargé au lieu destination. Door-LO et Door-CY sont les shipping terms les plus proches. Précisez si le lieu = terminal ou entrepôt pour éviter les litiges sur la DTHC.',
    alert:'LIFO/FIFO/FIOS laissent DTHC et livraison à votre charge — incompatibles DAP.' },
  DPU: { compatible:['Door-LO','Door-to-Door'], risky:['Door-FO','CYCY'],
    advice:'DPU = livré et déchargé. Door-to-Door est le plus complet. Door-LO couvre jusqu\'au terminal destination déchargé. Le vendeur assume le risque pendant le déchargement — à préciser contractuellement.',
    alert:'Door-FO exclut la DTHC — gap direct avec l\'obligation DPU.' },
  DDP: { compatible:['Door-to-Door'], risky:['Door-FO','CYFO','Door-LO'],
    advice:'DDP = obligation maximale vendeur, droits inclus. Door-to-Door est le seul shipping term aligné sur le transport. Mais le dédouanement et les droits de douane restent à gérer séparément avec le transitaire.',
    alert:'Door-FO et CYFO excluent la DTHC — expositions non négligeables en DDP.' },
}

const TICKER_ITEMS = [
  { label:'DTHC', desc:'non couverte par CFR / CIF' },
  { label:'BAF + CAF', desc:'invisibles dans les Incoterms' },
  { label:'DDP ≠ Door-to-Door', desc:'droits de douane exclus du shipping term' },
  { label:'EXW + FIOS', desc:'combinaison la plus exposée' },
  { label:'FOB ↔ FIFO', desc:'le couple le plus cohérent' },
  { label:'LILO', desc:'coverage supérieur à CIF' },
]

const COL_KEYS: (keyof Omit<TermRow, 't' | 'type'>)[] = ['o','ot','f','s','d','tr','de']
const COL_HEADERS = ['Livraison origine','OTHC','Fret','Surcharges','DTHC','Transit dest.','Livraison dest.']
const INCOTERMS = ['EXW','FCA','FAS','FOB','CFR','CIF','CPT','CIP','DAP','DPU','DDP']

// ─── Cell Component ───────────────────────────────────────────────────────────

function Cell({ v }: { v: Coverage }) {
  const cls = v === 'Y' ? styles.cellY : v === 'P' ? styles.cellP : styles.cellN
  const label = v === 'Y' ? '✓' : v === 'P' ? '~' : '–'
  return <span className={`${styles.cell} ${cls}`}>{label}</span>
}

// ─── Badge Component ──────────────────────────────────────────────────────────

function Badge({ term, type }: { term: string; type: 'inc' | 'ship' }) {
  return <span className={type === 'inc' ? styles.badgeInc : styles.badgeShip}>{term}</span>
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function IncotermsShippingPage() {
  const [activeTab, setActiveTab] = useState<'matrix' | 'parallels' | 'finder'>('matrix')
  const [selectedIncoterm, setSelectedIncoterm] = useState('')
  const tickerRef = useRef<HTMLDivElement>(null)

  const finderData = selectedIncoterm ? FINDER_DATA[selectedIncoterm] : null

  return (
    <>
      <Head>
        <title>Qui Paie Quoi ? — Matrice Incoterms × Termes Armateurs | Transit-IA</title>
        <meta name="description" content="Matrice interactive Incoterms 2020 × Shipping Terms. Comparez la couverture, identifiez les gaps de coût, vérifiez la cohérence de vos contrats de transport. Outil Transit-IA." />
        <meta property="og:title" content="Qui Paie Quoi ? — Matrice Incoterms × Termes Armateurs" />
        <meta property="og:description" content="Les Incoterms et les shipping terms parlent du même voyage mais pas avec le même langage. Voici le pont." />
      </Head>

      {/* NAV — use your existing <Layout> or <Navbar> component here */}
      {/* <Layout> wraps this page in your existing project */}

      <main className={styles.page}>

        {/* ── HERO ── */}
        <section className={styles.hero}>
          <div className={styles.heroEyebrow}>
            <span className={styles.eyebrowDot} />
            Commerce International · Module 15
          </div>
          <h1 className={styles.heroTitle}>
            Qui Paie <em>Quoi</em> ?<br />
            La Matrice Incoterms × Termes Armateurs
          </h1>
          <p className={styles.heroSub}>
            Les Incoterms définissent le transfert de risque. Les shipping terms définissent ce que l'armateur inclut dans son fret. Deux langages, un même voyage — voici le pont que personne n'a fait avant.
          </p>
          <div className={styles.heroStats}>
            {[
              { n: '11', l: 'Incoterms 2020' },
              { n: '17', l: 'Shipping Terms' },
              { n: '9',  l: 'Parallèles & frictions' },
              { n: '∞',  l: 'Erreurs évitées' },
            ].map(s => (
              <div key={s.l} className={styles.heroStat}>
                <span className={styles.statNum}>{s.n}</span>
                {s.l}
              </div>
            ))}
          </div>
        </section>

        {/* ── TICKER ── */}
        <div className={styles.tickerWrap}>
          <div className={styles.tickerTrack} ref={tickerRef}>
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span key={i} className={styles.tickerItem}>
                <strong>{item.label}</strong> — {item.desc}
              </span>
            ))}
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div className={styles.container}>

          {/* Concepts */}
          <p className={styles.secLabel}>Comprendre les deux systèmes</p>
          <h2 className={styles.secTitle}>Deux langages, un même voyage</h2>
          <p className={styles.secSub}>
            Les Incoterms parlent de risque et de propriété. Les shipping terms parlent de factures et de manutention. Ils se croisent — mais pas toujours là où on l'attend.
          </p>

          <div className={styles.conceptsGrid}>
            {[
              { ico:'⚖️', title:'Incoterms 2020', desc:'Règles CCI définissant le transfert de risque entre vendeur et acheteur. 11 termes de EXW à DDP. Ne mentionnent jamais CAF, BAF, CUC ou DTHC.', pill:'INCOTERM 2020', pillType:'inc' },
              { ico:'🚢', title:'Shipping Terms', desc:'Convention armateur–chargeur sur ce qui est inclus dans le fret. Précisent OTHC, DTHC, surcharges et livraison terrestre. 17+ termes standardisés.', pill:'SHIPPING TERM', pillType:'ship' },
              { ico:'⚡', title:'THC — Zone de friction', desc:'Les THC (manutention portuaire) sont ignorées par les Incoterms mais spécifiées par les shipping terms à l\'origine (OTHC) et destination (DTHC).', pill:'POINT CRITIQUE', pillType:'warn' },
              { ico:'💸', title:'Surcharges — L\'angle mort', desc:'CAF, BAF, CUC peuvent représenter 10–20% du fret sur les routes Asie–Maroc. Présentes dans les shipping terms, absentes des Incoterms.', pill:'SURCHARGES', pillType:'warn' },
            ].map(c => (
              <div key={c.title} className={styles.conceptCard}>
                <div className={styles.conceptIco}>{c.ico}</div>
                <h3>{c.title}</h3>
                <p>{c.desc}</p>
                <span className={c.pillType === 'inc' ? styles.pillInc : c.pillType === 'ship' ? styles.pillShip : styles.pillWarn}>
                  {c.pill}
                </span>
              </div>
            ))}
          </div>

          {/* ── TOOL ── */}
          <div className={styles.toolBox}>
            <div className={styles.toolBar}>
              <div>
                <h2 className={styles.toolTitle}>Outil Interactif — Matrice &amp; Correspondances</h2>
                <p className={styles.toolSub}>Comparez la couverture, identifiez les parallèles, vérifiez votre Incoterm</p>
              </div>
              <span className={styles.toolTag}>BETA</span>
            </div>

            <div className={styles.toolBody}>
              {/* Tabs */}
              <div className={styles.tabs}>
                {(['matrix','parallels','finder'] as const).map(tab => (
                  <button
                    key={tab}
                    className={`${styles.tabBtn} ${activeTab === tab ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {{ matrix:'Matrice de couverture', parallels:'Parallèles & frictions', finder:'Vérificateur Incoterm' }[tab]}
                  </button>
                ))}
              </div>

              {/* Matrix */}
              {activeTab === 'matrix' && (
                <div>
                  <div className={styles.legend}>
                    <span className={styles.legItem}><span className={styles.legY} />Inclus (vendeur / armateur)</span>
                    <span className={styles.legItem}><span className={styles.legP} />Partiel / conditionnel</span>
                    <span className={styles.legItem}><span className={styles.legN} />Exclu — à charge acheteur</span>
                  </div>
                  <div className={styles.tscroll}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th className={`${styles.th} ${styles.stickyCol}`}>Terme</th>
                          <th className={styles.th}>Type</th>
                          {COL_HEADERS.map(h => <th key={h} className={styles.th} dangerouslySetInnerHTML={{__html: h.replace(' ','<br/>')}} />)}
                        </tr>
                      </thead>
                      <tbody>
                        {TERM_ROWS.map(row => (
                          <tr key={row.t} className={styles.tr}>
                            <td className={`${styles.td} ${styles.stickyCol}`}><Badge term={row.t} type={row.type} /></td>
                            <td className={`${styles.td} ${styles.typeLabel}`}>{row.type === 'inc' ? 'Incoterm' : 'Shipping'}</td>
                            {COL_KEYS.map(k => <td key={k} className={styles.td}><Cell v={row[k] as Coverage} /></td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Parallels */}
              {activeTab === 'parallels' && (
                <div>
                  {PARALLELS.map(p => (
                    <div key={p.title} className={styles.pCard}>
                      <h4 className={styles.pCardTitle}>{p.title}</h4>
                      <div className={styles.badgesRow}>
                        {p.inc !== 'Tous' && p.inc !== '—' && <Badge term={p.inc} type="inc" />}
                        {p.ship !== '—' && p.ship !== 'Tous' && <Badge term={p.ship} type="ship" />}
                        <span className={
                          p.matchClass === 'match' ? styles.bMatch :
                          p.matchClass === 'approx' ? styles.bApprox : styles.bWarn
                        }>{p.matchLabel}</span>
                      </div>
                      <p className={styles.pCardDesc}>{p.desc}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Finder */}
              {activeTab === 'finder' && (
                <div>
                  <label className={styles.finderLabel}>Incoterm négocié avec votre fournisseur</label>
                  <select
                    className={styles.select}
                    value={selectedIncoterm}
                    onChange={e => setSelectedIncoterm(e.target.value)}
                  >
                    <option value="">— Sélectionner —</option>
                    {INCOTERMS.map(i => <option key={i}>{i}</option>)}
                  </select>

                  {finderData && (
                    <div className={styles.fCard}>
                      <div className={styles.fCardHead}>
                        <span className={styles.fCardHeadLabel}>Incoterm :</span>
                        <Badge term={selectedIncoterm} type="inc" />
                      </div>

                      <p className={`${styles.fSec} ${styles.fSecGreen}`}>Shipping terms compatibles</p>
                      <div className={styles.badgesRow}>
                        {finderData.compatible.length > 0
                          ? finderData.compatible.map(t => <Badge key={t} term={t} type="ship" />)
                          : <span className={styles.noMatch}>Aucun alignement direct</span>
                        }
                      </div>

                      <p className={`${styles.fSec} ${styles.fSecRed}`}>Shipping terms à risque (gaps / doublons)</p>
                      <div className={styles.badgesRow}>
                        {finderData.risky.map(t => (
                          <span key={t} className={styles.badgeRisky}>{t}</span>
                        ))}
                      </div>

                      <p className={styles.fAdvice}>{finderData.advice}</p>
                      <div className={styles.alertBox}>
                        <span className={styles.alertTitle}>⚠ Point d'attention : </span>
                        <span className={styles.alertBody}>{finderData.alert}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Insights */}
          <p className={styles.secLabel}>Points de vigilance</p>
          <h2 className={styles.secTitle}>4 enseignements stratégiques</h2>
          <p className={styles.secSub}>Ce que tout transitaire ou importateur devrait savoir avant de signer un contrat de transport.</p>

          <div className={styles.insightsGrid}>
            {[
              { n:'1', title:'Le trou structurel de la DTHC', desc:'CIF et CFR — les plus utilisés au Maroc — n\'incluent pas la DTHC. Un importateur en CIF qui reçoit une offre LIFO a un gap non prévu à l\'arrivée.' },
              { n:'2', title:'L\'angle mort des surcharges', desc:'CAF, BAF, CUC sont absentes des Incoterms mais présentes dans les shipping terms. Sur Asie–Maroc, elles peuvent représenter 15–20% du fret de base.' },
              { n:'3', title:'DDP ≠ Door-to-Door', desc:'DDP oblige le vendeur à dédouaner et payer les droits. Door-to-Door couvre uniquement le transport. Deux contrats distincts en pratique douanière ADII.' },
              { n:'4', title:'EXW + FIOS — exposition maximale', desc:'L\'acheteur paie tout : pre-carriage, OTHC, fret, DTHC, livraison. À éviter sans maîtrise complète de la chaîne logistique côté origine.' },
            ].map(ins => (
              <div key={ins.n} className={styles.insCard}>
                <span className={styles.insN}>{ins.n}</span>
                <h4 className={styles.insTitle}>{ins.title}</h4>
                <p className={styles.insDesc}>{ins.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </main>
    </>
  )
}

