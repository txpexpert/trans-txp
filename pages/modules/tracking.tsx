import { useState, useEffect } from 'react'
import ModuleLayout from '../../components/ModuleLayout'

type InputType = 'awb' | 'bl' | 'company' | 'hs' | 'unknown'
type ActiveTab = 'tracking' | 'fret' | 'assurance' | 'intelligence' | 'matieres'

function detectInputType(val: string): InputType {
  const v = val.trim().replace(/[-\s]/g, '')
  if (/^\d{11}$/.test(v))               return 'awb'
  if (/^[A-Z]{3,4}\d{7,12}$/i.test(v)) return 'bl'
  if (/^\d{4,10}$/.test(v))            return 'hs'
  if (val.trim().length > 3)            return 'company'
  return 'unknown'
}

const TYPE_META: Record<InputType, { label: string; icon: string; hint: string }> = {
  awb:     { label: 'LTA / AWB — Fret Aérien',       icon: '✈️', hint: 'Numéro lettre de transport aérien (11 chiffres)' },
  bl:      { label: 'Bill of Lading — Fret Maritime', icon: '🚢', hint: 'Référence connaissement maritime ou numéro conteneur' },
  company: { label: 'Intelligence Commerce',          icon: '🔍', hint: "Analyse des flux d'import/export par entreprise" },
  hs:      { label: 'Code SH / Nomenclature',         icon: '📋', hint: 'Recherche par position tarifaire du Système Harmonisé' },
  unknown: { label: '',                               icon: '🔎', hint: '' },
}

const COMMODITIES = [
  { label: 'Phosphate OCP', val: '$332',   unit: '/t',  chg: '+0.8%', up: true  },
  { label: 'Blé tendre',    val: '$198',   unit: '/t',  chg: '-1.2%', up: false },
  { label: 'Pétrole Brent', val: '$83.4',  unit: '/bl', chg: '-0.4%', up: false },
  { label: 'Acier HRC',     val: '$580',   unit: '/t',  chg: '+1.1%', up: true  },
  { label: 'Sucre brut',    val: '$412',   unit: '/t',  chg: '-0.9%', up: false },
  { label: 'Cuivre',        val: '$9 540', unit: '/t',  chg: '+0.6%', up: true  },
  { label: 'Aluminium',     val: '$2 280', unit: '/t',  chg: '+0.3%', up: true  },
  { label: 'Huile de palme',val: '$990',   unit: '/t',  chg: '-0.5%', up: false },
]

// ─── Résultats ────────────────────────────────────────────────────────────────
function ResultAWB({ q }: { q: string }) {
  return (
    <div className="t-res-content">
      <div className="t-res-section-lbl">STATUT DE L'ENVOI</div>
      <div className="t-status-bar">
        {['Prise en charge','En transit','Arrivée aéroport','Dédouanement','Livré'].map((s, i) => (
          <div key={s} className={`t-status-step ${i <= 3 ? 'done' : ''} ${i === 3 ? 'current' : ''}`}>
            <div className="t-status-dot" />
            <div className="t-status-lbl">{s}</div>
          </div>
        ))}
      </div>
      <div className="t-data-grid">
        {[['Référence AWB', q],['Compagnie','Royal Air Maroc Cargo (AT)'],['Origine','🇲🇦 CMN — Casablanca Mohammed V'],['Destination','🇫🇷 CDG — Paris Charles de Gaulle'],['Vol','AT 756 · Boeing 787-9'],['Départ réel','02 avril 2026 · 23:45'],['Arrivée prévue','03 avril 2026 · 05:20'],['Poids','1 240 kg · 8.2 m³'],['Statut douane','✅ Dédouané · Mainlevée accordée'],['Dernier update','03 avril 2026 · 07:14 — Livré au destinataire']].map(([k,v]) => (
          <div key={k} className="t-data-row"><span className="t-data-key">{k}</span><strong className="t-data-val">{v}</strong></div>
        ))}
      </div>
    </div>
  )
}

function ResultBL({ q }: { q: string }) {
  return (
    <div className="t-res-content">
      <div className="t-res-section-lbl">POSITION DU NAVIRE</div>
      <div className="t-status-bar">
        {['Chargement','Départ port','En mer','Approche','Arrivée'].map((s, i) => (
          <div key={s} className={`t-status-step ${i <= 2 ? 'done' : ''} ${i === 2 ? 'current' : ''}`}>
            <div className="t-status-dot" />
            <div className="t-status-lbl">{s}</div>
          </div>
        ))}
      </div>
      <div className="t-data-grid">
        {[['Référence BL',q],['Armateur','Maersk Line'],['Navire','MAERSK ESSEX · IMO 9234521'],['Port d\'origine','🇲🇦 MACAS — Casablanca'],['Port destination','🇫🇷 FRLEH — Le Havre'],['Conteneur','MSKU1234567 · 40\' HC'],['Départ','29 mars 2026'],['ETA','15 avril 2026'],['Position actuelle','Mer Méditerranée · 36°N 5°E'],['Vitesse','18.4 nœuds · Cap 315°']].map(([k,v]) => (
          <div key={k} className="t-data-row"><span className="t-data-key">{k}</span><strong className="t-data-val">{v}</strong></div>
        ))}
      </div>
    </div>
  )
}

function ResultCompany({ q }: { q: string }) {
  return (
    <div className="t-res-content">
      <div className="t-res-section-lbl">PROFIL COMMERCIAL — {q.toUpperCase()}</div>
      <div className="t-data-grid">
        {[['Entreprise',q],['Total envois analysés','1 247 manifestes (2020–2026)'],['Volume annuel moyen','312 envois / an'],['Principal fournisseur','Groupe chimique — Chine (38%)'],['2ème fournisseur','Producteur engrais — Allemagne (22%)'],['Ports principaux','Houston TX · Long Beach CA · Rotterdam'],['Codes SH fréquents','2809, 3102, 3105 — Phosphates, Engrais'],['Mode transport','Maritime 94% · Aérien 6%'],['Tendance','▲ +12% volume 2025 vs 2024'],['Données','Manifestes US Customs 2015–2026']].map(([k,v]) => (
          <div key={k} className="t-data-row"><span className="t-data-key">{k}</span><strong className="t-data-val">{v}</strong></div>
        ))}
      </div>
    </div>
  )
}

function ResultHS({ q }: { q: string }) {
  return (
    <div className="t-res-content">
      <div className="t-res-section-lbl">FICHE TARIFAIRE — CODE SH {q}</div>
      <div className="t-data-grid">
        {[['Code SH',`${q}00 (position complète 6 chiffres)`],['Désignation','Acides phosphoreux et leurs sels'],['Chapitre','28 — Produits chimiques inorganiques'],['Droit NPF (OMC)','2.5%'],['Droit UE — Accord Assoc.','0% · Franchise totale depuis 2012'],['TVA import Maroc','20%'],['TIC','Non applicable'],['Documents requis','Facture · Certificat d\'origine · B/L'],['Origine préférentielle','EUR.1 ou déclaration sur facture'],['Licence import','Non requise — importation libre']].map(([k,v]) => (
          <div key={k} className="t-data-row"><span className="t-data-key">{k}</span><strong className="t-data-val">{v}</strong></div>
        ))}
      </div>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

// ─── Composant résultat Shipsgo réel ─────────────────────────────────────────
function ShipsgoResult({ data, query, inputType, det }: { data: any; query: string; inputType: string; det: any }) {
  const d = data?.result?.data
  const type = data?.type

  // Formater les données maritimes Shipsgo
  if (type === 'maritime' && d) {
    const info = Array.isArray(d) ? d[0] : d
    const events = info?.ShipmentMovements || info?.Movements || []
    const lastEvt = events[0]
    const pol = info?.PortOfLoading || info?.LoadingPort || '-'
    const pod = info?.PortOfDischarge || info?.DischargePort || '-'
    const vessel = info?.VesselName || '-'
    const eta = info?.EstimatedTimeOfArrival || info?.ETA || '-'
    const status = info?.ContainerStatus || info?.Status || '-'
    const carrier = info?.ShippingLine || info?.Carrier || '-'

    return (
      <div className="t-result">
        <div className="t-res-head">
          <span className="t-res-ico">🚢</span>
          <div>
            <div className="t-res-title">Fret Maritime — <em>{query}</em></div>
            <div className="t-res-ref">Source : Shipsgo · Données temps réel</div>
          </div>
          <div className="t-res-live"><span className="t-live-dot" />EN LIGNE</div>
        </div>
        <div className="t-res-content">
          {events.length > 0 && (
            <>
              <div className="t-res-section-lbl">STATUT ACTUEL</div>
              <div className="t-status-bar">
                {['Chargement','Départ port','En mer','Approche','Arrivée'].map((s, i) => (
                  <div key={s} className={'t-status-step ' + (i <= 2 ? 'done' : '') + ' ' + (i === 2 ? 'current' : '')}>
                    <div className="t-status-dot" />
                    <div className="t-status-lbl">{s}</div>
                  </div>
                ))}
              </div>
            </>
          )}
          <div className="t-data-grid">
            {[
              ['Référence', query],
              ['Armateur / Carrier', carrier],
              ['Navire', vessel],
              ['Port origine (POL)', pol],
              ['Port destination (POD)', pod],
              ['ETA estimée', eta],
              ['Statut', status],
              lastEvt ? ['Dernier événement', lastEvt?.Activity || lastEvt?.Description || '-'] : null,
              lastEvt ? ['Lieu', lastEvt?.Location || '-'] : null,
              lastEvt ? ['Date', lastEvt?.Date || lastEvt?.EventDate || '-'] : null,
            ].filter(Boolean).map(([k, v]: any) => (
              <div key={k} className="t-data-row">
                <span className="t-data-key">{k}</span>
                <strong className="t-data-val">{v || '-'}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Données aériennes Shipsgo
  if (type === 'air' && d) {
    const events = d?.FlightMovements || d?.Movements || []
    const lastEvt = events[0]
    const airline = d?.AirlineName || d?.Airline || '-'
    const origin = d?.OriginAirport || d?.Origin || '-'
    const dest = d?.DestinationAirport || d?.Destination || '-'
    const status = d?.ShipmentStatus || d?.Status || '-'
    const eta = d?.EstimatedArrival || d?.ETA || '-'

    return (
      <div className="t-result">
        <div className="t-res-head">
          <span className="t-res-ico">✈️</span>
          <div>
            <div className="t-res-title">Fret Aérien AWB — <em>{query}</em></div>
            <div className="t-res-ref">Source : Shipsgo Air · Données temps réel</div>
          </div>
          <div className="t-res-live"><span className="t-live-dot" />EN LIGNE</div>
        </div>
        <div className="t-res-content">
          <div className="t-data-grid">
            {[
              ['Numéro AWB', query],
              ['Compagnie', airline],
              ['Origine', origin],
              ['Destination', dest],
              ['Statut', status],
              ['ETA', eta],
              lastEvt ? ['Dernier événement', lastEvt?.Activity || lastEvt?.Description || '-'] : null,
              lastEvt ? ['Lieu', lastEvt?.Location || '-'] : null,
              lastEvt ? ['Date', lastEvt?.Date || '-'] : null,
            ].filter(Boolean).map(([k, v]: any) => (
              <div key={k} className="t-data-row">
                <span className="t-data-key">{k}</span>
                <strong className="t-data-val">{v || '-'}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Réponse brute si format inconnu
  return (
    <div className="t-result">
      <div className="t-res-head">
        <span className="t-res-ico">{det.icon}</span>
        <div>
          <div className="t-res-title">{det.label} — <em>{query}</em></div>
          <div className="t-res-ref">Source : Shipsgo</div>
        </div>
        <div className="t-res-live"><span className="t-live-dot" />EN LIGNE</div>
      </div>
      <div className="t-res-content">
        <div className="t-fiche-lbl">RÉPONSE API</div>
        <pre style={{fontSize:11,background:'var(--g4)',padding:'.875rem',border:'1px solid var(--bd)',overflow:'auto',maxHeight:300,color:'var(--ink2)',lineHeight:1.5}}>
          {JSON.stringify(data?.result, null, 2)}
        </pre>
      </div>
    </div>
  )
}

export default function TrackingIntelligence() {
  const [query,      setQuery]      = useState('')
  const [inputType,  setInputType]  = useState<InputType>('unknown')
  const [activeTab,  setActiveTab]  = useState<ActiveTab>('tracking')
  const [searching,  setSearching]  = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [apiData,    setApiData]    = useState<any>(null)
  const [apiError,   setApiError]   = useState('')

  // Fret
  const [fretFrom,   setFretFrom]   = useState('')
  const [fretTo,     setFretTo]     = useState('')
  const [fretWeight, setFretWeight] = useState('')
  const [fretMode,   setFretMode]   = useState('maritime')
  const [fretResult, setFretResult] = useState(false)
  const [fretCalc,   setFretCalc]   = useState(false)

  // Assurance
  const [assMode,    setAssMode]    = useState('maritime')
  const [assValue,   setAssValue]   = useState('')
  const [assFret,    setAssFret]    = useState('')
  const [assMerch,   setAssMerch]   = useState('general')
  const [assResult,  setAssResult]  = useState(false)
  const [assCalc,    setAssCalc]    = useState(false)

  useEffect(() => {
    setInputType(detectInputType(query))
    setShowResult(false)
  }, [query])

  const handleSearch = async () => {
    if (!query.trim() || inputType === 'unknown') return
    setSearching(true)
    setShowResult(false)
    setApiError('')
    try {
      const res = await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: query.trim() }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setApiError(data.error || 'Erreur lors de la recherche.')
      } else {
        setApiData(data)
        setShowResult(true)
      }
    } catch {
      setApiError('Erreur réseau. Vérifiez votre connexion.')
    }
    setSearching(false)
  }

  const handleFret = () => {
    if (!fretFrom || !fretTo || !fretWeight) return
    setFretCalc(true)
    setTimeout(() => { setFretCalc(false); setFretResult(true) }, 1200)
  }

  const handleAssurance = () => {
    if (!assValue) return
    setAssCalc(true)
    setTimeout(() => { setAssCalc(false); setAssResult(true) }, 1000)
  }

  const det = TYPE_META[inputType]

  // Calculs fret
  const weight   = parseFloat(fretWeight) || 0
  const fretAir  = (weight * 4.2 + 75).toFixed(0)
  const fretSea  = (weight * 0.18 + 850).toFixed(0)
  const fretRoad = (weight * 0.35 + 200).toFixed(0)
  const fretEst  = fretMode === 'aerien' ? fretAir : fretMode === 'routier' ? fretRoad : fretSea

  // Calculs assurance
  const valeur    = parseFloat(assValue)  || 0
  const fretVal   = parseFloat(assFret)   || 0
  const CAF       = (valeur + fretVal) * 1.10
  const RATES: Record<string, Record<string, number>> = {
    maritime: { general: 0.0050, alimentaire: 0.0055, chimique: 0.0075, electronique: 0.0085, vehicule: 0.0065 },
    aerien:   { general: 0.0030, alimentaire: 0.0035, chimique: 0.0050, electronique: 0.0060, vehicule: 0.0045 },
    terrestre:{ general: 0.0025, alimentaire: 0.0030, chimique: 0.0045, electronique: 0.0055, vehicule: 0.0040 },
  }
  const rate  = RATES[assMode]?.[assMerch] ?? 0.005
  const prime = (CAF * rate).toFixed(2)
  const pct   = (rate * 100).toFixed(3)

  const MERCH_LABELS: Record<string, string> = {
    general: 'Marchandise générale', alimentaire: 'Produits alimentaires',
    chimique: 'Produits chimiques',  electronique: 'Électronique / technologie',
    vehicule: 'Véhicules / machines',
  }

  const TABS: [ActiveTab, string][] = [
    ['tracking',     '✈️🚢 Suivi Envoi'],
    ['fret',         '💰 Calculateur de Fret'],
    ['assurance',    '🛡️ Calculateur d\'Assurance'],
    ['intelligence', '🔍 Intelligence Commerciale'],
    ['matieres',     '📊 Matières Premières'],
  ]

  return (
    <ModuleLayout
      kicker="MODULE TRK"
      title="Tracking & Intelligence Logistique"
      sub="Suivi des envois aériens et maritimes, calculateurs de fret et d'assurance, intelligence commerciale et cours des matières premières."
    >
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* KPIs */}
      <div className="t-kpis">
        {[['160+','Compagnies aériennes'],['130+','Armateurs maritimes'],['70M+','Manifestes douaniers'],['Temps réel','Mise à jour données']].map(([n,l]) => (
          <div key={l} className="t-kpi">
            <div className="t-kpi-n">{n}</div>
            <div className="t-kpi-l">{l}</div>
          </div>
        ))}
      </div>

      {/* Recherche */}
      <div className="t-search-box">
        <div className="t-search-lbl">SUIVI D'ENVOI — AWB AÉRIEN · BL MARITIME · ENTREPRISE · CODE SH</div>
        <div className="t-search-row">
          <div className="t-search-field">
            <span className="t-search-ico">{det.icon}</span>
            <input
              className="t-search-inp"
              placeholder="Numéro AWB, Bill of Lading, nom d'entreprise ou code SH..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            {query && <button className="t-clear" onClick={() => { setQuery(''); setShowResult(false); setApiData(null); setApiError('') }}>✕</button>}
          </div>
          <button className="t-search-btn" onClick={handleSearch} disabled={searching || !query.trim() || inputType === 'unknown'}>
            {searching ? <span className="t-spin">⟳</span> : 'SUIVRE →'}
          </button>
        </div>
        {inputType !== 'unknown' && (
          <div className="t-detect active">
            <span className="t-det-tag">Type :</span>
            <strong>{det.label}</strong>
            <span className="t-det-sep">—</span>
            <span>{det.hint}</span>
          </div>
        )}
        {inputType === 'unknown' && query.length > 0 && (
          <div className="t-detect"><span>Format non reconnu — vérifiez la référence saisie</span></div>
        )}
        {!query && (
          <div className="t-examples">
            <span className="t-ex-lbl">Exemples :</span>
            {[['AWB 057-12345678','05712345678'],['BL MAEU123456789','MAEU123456789'],['OCP Group','OCP Group'],['Code SH 2809','2809']].map(([lbl,val]) => (
              <button key={lbl} className="t-ex" onClick={() => setQuery(val)}>{lbl}</button>
            ))}
          </div>
        )}
      </div>

      {/* Erreur API */}
      {apiError && (
        <div className="t-api-error">
          <span style={{fontSize:18}}>⚠️</span>
          <div>
            <div style={{fontWeight:500,marginBottom:4}}>Résultat non disponible</div>
            <div style={{fontSize:12,color:'var(--ink3)'}}>{apiError}</div>
          </div>
        </div>
      )}

      {/* Données réelles Shipsgo */}
      {apiData && showResult && (
        <ShipsgoResult data={apiData} query={query} inputType={inputType} det={det} />
      )}

      {/* Résultat simulé (fallback si pas de données API) */}
      {showResult && !apiData && (
        <div className="t-result">
          <div className="t-res-head">
            <span className="t-res-ico">{det.icon}</span>
            <div>
              <div className="t-res-title">{det.label}</div>
              <div className="t-res-ref">{query}</div>
            </div>
            <div className="t-res-live"><span className="t-live-dot" />EN LIGNE</div>
          </div>
          {inputType === 'awb'     && <ResultAWB     q={query} />}
          {inputType === 'bl'      && <ResultBL      q={query} />}
          {inputType === 'company' && <ResultCompany q={query} />}
          {inputType === 'hs'      && <ResultHS      q={query} />}
        </div>
      )}

      {/* Tabs */}
      <div className="t-tabs">
        {TABS.map(([tab, lbl]) => (
          <button key={tab} className={`t-tab ${activeTab === tab ? 'act' : ''}`} onClick={() => setActiveTab(tab)}>{lbl}</button>
        ))}
      </div>

      {/* ══ Suivi Envoi ══ */}
      {activeTab === 'tracking' && (
        <div className="t-tab-body">
          <div className="t-info-block">
            <div className="t-info-title">✈️ Fret Aérien — AWB / LTA</div>
            <div className="t-info-text">Saisissez le numéro AWB à 11 chiffres (ex : 057-12345678) pour obtenir le statut en temps réel : compagnie, origine, destination, position, statut douanier et historique des checkpoints.</div>
            <div className="t-carriers">{['Air France Cargo','Lufthansa Cargo','Turkish Cargo','RAM Cargo','Emirates SkyCargo','Qatar Cargo','Cargolux','FedEx','DHL Aviation','UPS','Etihad Cargo','Singapore Cargo'].map(c => <span key={c} className="t-carrier">{c}</span>)}</div>
          </div>
          <div className="t-info-block">
            <div className="t-info-title">🚢 Fret Maritime — BL / Conteneur</div>
            <div className="t-info-text">Saisissez le numéro de Bill of Lading (ex : MAEU123456789) ou le numéro de conteneur pour localiser le navire, connaître l'ETA et les transbordements.</div>
            <div className="t-carriers">{['Maersk','MSC','CMA CGM','Evergreen','ONE','Hapag-Lloyd','Cosco','Yang Ming','HMM','Arkas','Marfret','CNAN'].map(c => <span key={c} className="t-carrier">{c}</span>)}</div>
          </div>
        </div>
      )}

      {/* ══ Calculateur Fret ══ */}
      {activeTab === 'fret' && (
        <div className="t-tab-body">
          <div className="t-calc-box">
            <div className="t-calc-title">💰 Estimation du coût de transport</div>
            <div className="t-calc-sub">Obtenez une estimation du coût de fret international point à point</div>
            <div className="t-fret-grid">
              <div className="t-field"><label className="t-lbl">ORIGINE</label>
                <input className="t-inp" placeholder="Ex : Casablanca, Tanger Med..." value={fretFrom} onChange={e => { setFretFrom(e.target.value); setFretResult(false) }} /></div>
              <div className="t-field"><label className="t-lbl">DESTINATION</label>
                <input className="t-inp" placeholder="Ex : Paris, Rotterdam, Dubaï..." value={fretTo} onChange={e => { setFretTo(e.target.value); setFretResult(false) }} /></div>
              <div className="t-field"><label className="t-lbl">POIDS (kg)</label>
                <input className="t-inp" type="number" placeholder="Ex : 500" value={fretWeight} onChange={e => { setFretWeight(e.target.value); setFretResult(false) }} /></div>
              <div className="t-field"><label className="t-lbl">MODE DE TRANSPORT</label>
                <select className="t-inp" value={fretMode} onChange={e => { setFretMode(e.target.value); setFretResult(false) }}>
                  <option value="maritime">🚢 Maritime (FCL / LCL)</option>
                  <option value="aerien">✈️ Aérien</option>
                  <option value="routier">🚛 Routier / Terrestre</option>
                </select></div>
            </div>
            <button className="t-calc-btn" onClick={handleFret} disabled={fretCalc || !fretFrom || !fretTo || !fretWeight}>
              {fretCalc ? <span className="t-spin">⟳</span> : 'CALCULER LE COÛT →'}
            </button>
            {fretResult && (
              <div className="t-calc-result">
                <div className="t-calc-res-head">
                  <div className="t-calc-route">{fretFrom} <span>→</span> {fretTo}</div>
                  <div className="t-calc-mode">{fretMode === 'aerien' ? '✈️ Aérien' : fretMode === 'routier' ? '🚛 Routier' : '🚢 Maritime'}</div>
                </div>
                <div className="t-calc-amounts">
                  <div className="t-calc-main">
                    <div className="t-calc-lbl">Estimation fret</div>
                    <div className="t-calc-amount">${fretEst}</div>
                    <div className="t-calc-sub2">pour {fretWeight} kg</div>
                  </div>
                  <div className="t-calc-details">
                    {(fretMode === 'maritime' ? (
                      [['Base Rate',`$${(weight*0.08+450).toFixed(0)}`],['BAF (carburant)',`$${(weight*0.04+180).toFixed(0)}`],['CAF (change)',`$${(weight*0.03+120).toFixed(0)}`],['THC (port)','$100'],['TOTAL estimé',`$${fretSea}`]]
                    ) : fretMode === 'aerien' ? (
                      [['Tarif/kg','$4.20'],['Poids taxable',`${fretWeight} kg`],['Surcharge carburant','$0.45/kg'],['Manutention','$75'],['TOTAL estimé',`$${fretAir}`]]
                    ) : (
                      [['Tarif/km','$0.35/kg (base)'],['Poids','$'+fretWeight+'×0.35'],['Surcharge gazole','$40'],['Péages estimés','$50'],['TOTAL estimé',`$${fretRoad}`]]
                    )).map(([k,v]) => (
                      <div key={k} className="t-detail-row"><span>{k}</span><strong>{v}</strong></div>
                    ))}
                  </div>
                </div>
                <div className="t-calc-note">
                  Estimation indicative. Valeur CAF (base droits de douane) = (Valeur facture + ${fretEst} fret + assurance) × 110%
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ══ Calculateur Assurance ══ */}
      {activeTab === 'assurance' && (
        <div className="t-tab-body">
          <div className="t-calc-box">
            <div className="t-calc-title">🛡️ Estimation de la prime d'assurance cargo</div>
            <div className="t-calc-sub">Calculez la prime d'assurance transport selon la nature de la marchandise et le mode d'expédition</div>
            <div className="t-fret-grid">
              <div className="t-field"><label className="t-lbl">MODE DE TRANSPORT</label>
                <select className="t-inp" value={assMode} onChange={e => { setAssMode(e.target.value); setAssResult(false) }}>
                  <option value="maritime">🚢 Maritime</option>
                  <option value="aerien">✈️ Aérien</option>
                  <option value="terrestre">🚛 Terrestre</option>
                </select></div>
              <div className="t-field"><label className="t-lbl">NATURE DE LA MARCHANDISE</label>
                <select className="t-inp" value={assMerch} onChange={e => { setAssMerch(e.target.value); setAssResult(false) }}>
                  <option value="general">Marchandise générale</option>
                  <option value="alimentaire">Produits alimentaires</option>
                  <option value="chimique">Produits chimiques</option>
                  <option value="electronique">Électronique / technologie</option>
                  <option value="vehicule">Véhicules / machines</option>
                </select></div>
              <div className="t-field"><label className="t-lbl">VALEUR DE LA MARCHANDISE (USD)</label>
                <input className="t-inp" type="number" placeholder="Ex : 50000" value={assValue} onChange={e => { setAssValue(e.target.value); setAssResult(false) }} /></div>
              <div className="t-field"><label className="t-lbl">COÛT DE FRET ESTIMÉ (USD)</label>
                <input className="t-inp" type="number" placeholder="Ex : 1500" value={assFret} onChange={e => { setAssFret(e.target.value); setAssResult(false) }} /></div>
            </div>
            <button className="t-calc-btn" onClick={handleAssurance} disabled={assCalc || !assValue}>
              {assCalc ? <span className="t-spin">⟳</span> : 'CALCULER LA PRIME →'}
            </button>
            {assResult && (
              <div className="t-calc-result">
                <div className="t-calc-res-head">
                  <div className="t-calc-route">
                    {assMode === 'maritime' ? '🚢 Maritime' : assMode === 'aerien' ? '✈️ Aérien' : '🚛 Terrestre'}
                    <span style={{margin:'0 .5rem'}}>·</span>
                    {MERCH_LABELS[assMerch]}
                  </div>
                  <div className="t-calc-mode">Taux : {pct}‰</div>
                </div>
                <div className="t-calc-amounts">
                  <div className="t-calc-main">
                    <div className="t-calc-lbl">Prime d'assurance</div>
                    <div className="t-calc-amount">${prime}</div>
                    <div className="t-calc-sub2">taux {pct}‰</div>
                  </div>
                  <div className="t-calc-details">
                    {[
                      ['Valeur marchandise',     `$${Number(assValue).toLocaleString()}`],
                      ['Coût de fret',           assFret ? `$${Number(assFret).toLocaleString()}` : 'Non renseigné'],
                      ['Valeur assurée (CAF×110%)', `$${CAF.toLocaleString('fr-FR', {maximumFractionDigits:0})}`],
                      ['Taux appliqué',           `${pct}‰`],
                      ['Prime calculée',          `$${prime}`],
                    ].map(([k,v]) => (
                      <div key={k} className="t-detail-row"><span>{k}</span><strong>{v}</strong></div>
                    ))}
                  </div>
                </div>
                <div className="t-calc-note">
                  Prime estimative. La valeur assurée est calculée sur la base CAF majorée de 10% conformément aux usages douaniers internationaux (INCOTERMS / Règles de Hambourg).
                </div>
              </div>
            )}
          </div>
          <div className="t-formula-box">
            <div className="t-formula-title">📐 Taux de référence par mode et nature de marchandise</div>
            <div className="t-rates-grid">
              <div className="t-rates-head"><span>Catégorie</span><span>Maritime</span><span>Aérien</span><span>Terrestre</span></div>
              {[['Marchandise générale','0.50‰','0.30‰','0.25‰'],['Alimentaire','0.55‰','0.35‰','0.30‰'],['Chimique','0.75‰','0.50‰','0.45‰'],['Électronique / tech','0.85‰','0.60‰','0.55‰'],['Véhicules / machines','0.65‰','0.45‰','0.40‰']].map(([cat,...vals]) => (
                <div key={cat} className="t-rates-row">
                  <span>{cat}</span>
                  {vals.map(v => <span key={v}>{v}</span>)}
                </div>
              ))}
            </div>
            <div className="t-formula-grid" style={{marginTop:'1rem'}}>
              {[['Formule prime','Prime = Valeur assurée × Taux (‰)'],['Valeur assurée','(Valeur facture + Fret + Assurance) × 110%'],['Risques majeurs tech','Taux jusqu\'à 30% plus élevés (vol)'],['Vrac / matières premières','Taux les plus bas du marché']].map(([k,v]) => (
                <div key={k} className="t-formula-item">
                  <div className="t-formula-lbl">{k}</div>
                  <div className="t-formula-val">{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ Intelligence Commerciale ══ */}
      {activeTab === 'intelligence' && (
        <div className="t-tab-body">
          <div className="t-info-block">
            <div className="t-info-title">🔍 Intelligence Commerciale par Entreprise</div>
            <div className="t-info-text">Saisissez le nom d'une entreprise importatrice ou exportatrice pour analyser ses flux commerciaux : volume d'envois, fournisseurs, pays d'origine, ports utilisés, codes SH fréquents et tendances d'activité.</div>
          </div>
          <div className="t-info-block">
            <div className="t-info-title">⚡ Détection de sous-valorisation</div>
            <div className="t-info-text">Comparez le cours mondial d'une matière première avec la valeur déclarée sur la DUM pour détecter les anomalies. Une valeur déclarée inférieure de plus de 15% au cours du marché constitue un signal d'alerte.</div>
            <div className="t-pipeline">
              <div className="t-pipe-step">Valeur marché (cours)</div>
              <div className="t-pipe-arrow">→</div>
              <div className="t-pipe-step">Valeur BL déclarée</div>
              <div className="t-pipe-arrow">→</div>
              <div className="t-pipe-step">Calcul écart</div>
              <div className="t-pipe-arrow">→</div>
              <div className="t-pipe-step t-pipe-alert">Alerte si &gt; 15%</div>
            </div>
          </div>
          <div className="t-info-block">
            <div className="t-info-title">📋 Recherche par Code SH</div>
            <div className="t-info-text">Saisissez un code SH (4 à 10 chiffres) pour obtenir la fiche tarifaire complète : désignation, droits applicables, TVA, TIC, documents requis et régime préférentiel dans le cadre de l'Accord d'Association Maroc-UE.</div>
          </div>
          <div className="t-info-block">
            <div className="t-info-title">Exemple — Détection anomalie valorisation</div>
            <div className="t-alert-example">
              {[['Cours phosphate mondial','$332 / tonne'],['Valeur déclarée sur DUM','$210 / tonne (−37%)'],['Décision recommandée','⚠ Redressement de valeur — Circuit rouge']].map(([k,v], i) => (
                <div key={k} className="t-data-row">
                  <span className="t-data-key">{k}</span>
                  <strong className="t-data-val" style={i===1?{color:'var(--dn)'}:i===2?{color:'var(--dn)'}:{}}>{v}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ Matières Premières ══ */}
      {activeTab === 'matieres' && (
        <div className="t-tab-body">
          <div className="t-commos-header">
            <div className="t-commos-title">Cours des matières premières — 2026</div>
            <div className="t-commos-sub">Sources : marchés internationaux · Mise à jour quotidienne</div>
          </div>
          <div className="t-commos">
            {COMMODITIES.map(c => (
              <div key={c.label} className="t-commo">
                <div className="t-commo-lbl">{c.label}</div>
                <div className="t-commo-val">{c.val}<span className="t-commo-unit">{c.unit}</span></div>
                <div className={`t-commo-chg ${c.up ? 'up' : 'dn'}`}>{c.up ? '▲' : '▼'} {c.chg}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </ModuleLayout>
  )
}

// ─── CSS — ZÉRO FOND NOIR ─────────────────────────────────────────────────────
const CSS = `
.t-kpis{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid var(--bd);margin-bottom:1.25rem}
.t-kpi{padding:.875rem 1rem;border-right:1px solid var(--bd);text-align:center;background:var(--white)}
.t-kpi:last-child{border-right:none}
.t-kpi-n{font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:600;color:var(--gold)}
.t-kpi-l{font-size:10px;color:var(--ink2);margin-top:2px}
@media(max-width:600px){.t-kpis{grid-template-columns:1fr 1fr}}

/* ── Recherche ── */
.t-search-box{background:var(--white);border:1px solid var(--bd);padding:1.25rem 1.5rem;margin-bottom:1rem}
.t-search-lbl{font-size:9px;letter-spacing:.14em;color:var(--gold);margin-bottom:.875rem;font-weight:500}
.t-search-row{display:flex;gap:.75rem}
.t-search-field{flex:1;display:flex;align-items:center;border:1px solid var(--bd2);background:var(--g4)}
.t-search-field:focus-within{border-color:var(--gold)}
.t-search-ico{padding:0 .875rem;font-size:16px;flex-shrink:0}
.t-search-inp{flex:1;border:none;background:transparent;font-family:'DM Sans',sans-serif;font-size:14px;color:var(--ink);outline:none;padding:.875rem 0;min-width:0}
.t-search-inp::placeholder{color:var(--ink3)}
.t-clear{padding:0 .875rem;background:none;border:none;cursor:pointer;color:var(--ink3);font-size:14px}
.t-search-btn{padding:.875rem 1.5rem;background:var(--white);color:var(--ink);font-size:11px;letter-spacing:.1em;cursor:pointer;border:2px solid var(--gold);font-family:inherit;flex-shrink:0;transition:all .15s;white-space:nowrap;font-weight:600}
.t-search-btn:hover:not(:disabled){background:var(--gold4);color:var(--ink)}
.t-search-btn:disabled{background:var(--g4);color:var(--ink3);border-color:var(--bd);cursor:not-allowed;font-weight:400}
.t-spin{display:inline-block;animation:tspin .6s linear infinite}
@keyframes tspin{to{transform:rotate(360deg)}}
.t-detect{margin-top:.75rem;font-size:12px;color:var(--ink2);display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:.5rem .75rem;border:1px solid var(--bd);background:var(--g4)}
.t-detect.active{border-color:var(--gold);background:var(--gold4)}
.t-det-tag{font-size:9px;letter-spacing:.1em;color:var(--ink2);font-weight:600}
.t-detect strong{color:var(--ink);font-weight:600}
.t-det-sep{color:var(--bd2)}
.t-examples{margin-top:.75rem;display:flex;align-items:center;gap:.5rem;flex-wrap:wrap}
.t-ex-lbl{font-size:10px;color:var(--ink2);letter-spacing:.06em;font-weight:500}
.t-ex{font-size:11px;padding:5px 14px;border:1px solid var(--bd2);background:var(--white);color:var(--ink);cursor:pointer;font-family:inherit;transition:all .12s}
.t-ex:hover{border-color:var(--gold);color:var(--gold);background:var(--gold4)}

/* ── Résultat ── */
.t-result{border:2px solid var(--gold3);margin-bottom:1rem;animation:fadeIn .3s ease;background:var(--white)}
@keyframes fadeIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
.t-res-head{background:var(--gold4);border-bottom:2px solid var(--gold3);padding:.875rem 1.5rem;display:flex;align-items:center;gap:1rem}
.t-res-ico{font-size:26px}
.t-res-title{font-family:'Cormorant Garamond',serif;font-size:17px;font-weight:600;color:var(--ink)}
.t-res-ref{font-size:11px;color:var(--gold);margin-top:2px;letter-spacing:.06em;font-weight:600}
.t-api-error{display:flex;align-items:flex-start;gap:.875rem;padding:1rem 1.25rem;background:rgba(232,93,93,.07);border:1px solid rgba(232,93,93,.3);color:var(--ink2);font-size:13px;margin-bottom:.5rem}
.t-api-error:before{flex-shrink:0}
.t-res-live{margin-left:auto;display:flex;align-items:center;gap:6px;font-size:9px;letter-spacing:.12em;color:var(--up);font-weight:600}
.t-live-dot{width:6px;height:6px;border-radius:50%;background:var(--up);animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
.t-res-content{padding:1.25rem 1.5rem}
.t-res-section-lbl{font-size:9px;letter-spacing:.16em;color:var(--gold);margin-bottom:1rem;font-weight:600}

/* ── Barre de statut ── */
.t-status-bar{display:flex;align-items:flex-start;margin-bottom:1.5rem;overflow-x:auto}
.t-status-step{flex:1;display:flex;flex-direction:column;align-items:center;position:relative;min-width:80px}
.t-status-step:not(:last-child)::after{content:'';position:absolute;top:7px;left:calc(50% + 7px);right:calc(-50% + 7px);height:2px;background:var(--bd)}
.t-status-step.done:not(:last-child)::after{background:var(--gold)}
.t-status-dot{width:14px;height:14px;border-radius:50%;border:2px solid var(--bd);background:var(--white);position:relative;z-index:1}
.t-status-step.done .t-status-dot{background:var(--gold);border-color:var(--gold)}
.t-status-step.current .t-status-dot{background:var(--gold);border-color:var(--gold);box-shadow:0 0 0 4px rgba(201,168,76,.2)}
.t-status-lbl{font-size:9px;color:var(--ink2);margin-top:6px;text-align:center}
.t-status-step.done .t-status-lbl{color:var(--ink);font-weight:500}
.t-status-step.current .t-status-lbl{color:var(--gold);font-weight:700}

/* ── Données ── */
.t-data-grid{display:flex;flex-direction:column;gap:.35rem}
.t-data-row{display:flex;align-items:center;justify-content:space-between;padding:.5rem .875rem;background:var(--white);border:1px solid var(--bd);font-size:12px}
.t-data-row:nth-child(even){background:var(--g4)}
.t-data-key{color:var(--ink2);min-width:180px;font-weight:400}
.t-data-val{color:var(--ink);font-weight:500;text-align:right}

/* ── Tabs ── */
.t-tabs{display:flex;border:1px solid var(--bd);margin-bottom:1rem;background:var(--white);overflow-x:auto}
.t-tab{padding:.75rem 1.25rem;font-size:11px;letter-spacing:.06em;color:var(--ink2);background:var(--white);border:none;border-right:1px solid var(--bd);cursor:pointer;font-family:inherit;white-space:nowrap;transition:all .12s}
.t-tab:last-child{border-right:none}
.t-tab:hover{background:var(--gold4);color:var(--gold)}
.t-tab.act{background:var(--gold4);color:var(--ink);border-bottom:2px solid var(--gold);font-weight:600}
.t-tab-body{display:flex;flex-direction:column;gap:1rem}

/* ── Blocs info ── */
.t-info-block{border:1px solid var(--bd);background:var(--white);padding:1.25rem 1.5rem}
.t-info-title{font-family:'Cormorant Garamond',serif;font-size:17px;font-weight:600;color:var(--ink);margin-bottom:.75rem}
.t-info-text{font-size:13px;color:var(--ink2);line-height:1.75;margin-bottom:.875rem}
.t-carriers{display:flex;flex-wrap:wrap;gap:4px;margin-top:.5rem}
.t-carrier{font-size:10px;padding:4px 10px;border:1px solid var(--bd2);color:var(--ink2);background:var(--white)}

/* ── Pipeline ── */
.t-pipeline{display:flex;align-items:center;flex-wrap:wrap;gap:.5rem;margin-top:.75rem}
.t-pipe-step{padding:5px 12px;background:var(--g4);border:1px solid var(--bd);color:var(--ink2);font-size:11px}
.t-pipe-alert{background:rgba(232,93,93,.08);border-color:rgba(232,93,93,.4);color:var(--dn);font-weight:600}
.t-pipe-arrow{color:var(--gold);font-weight:700;font-size:14px}

/* ── Calculateurs ── */
.t-calc-box{border:1px solid var(--bd);background:var(--white);padding:1.5rem}
.t-calc-title{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;color:var(--ink);margin-bottom:.25rem}
.t-calc-sub{font-size:12px;color:var(--ink2);margin-bottom:1.25rem}
.t-fret-grid{display:grid;grid-template-columns:1fr 1fr;gap:.875rem;margin-bottom:1rem}
@media(max-width:600px){.t-fret-grid{grid-template-columns:1fr}}
.t-field{display:flex;flex-direction:column;gap:.35rem}
.t-lbl{font-size:9px;letter-spacing:.1em;color:var(--ink2);font-weight:600}
.t-inp{border:1px solid var(--bd2);padding:.75rem 1rem;font-family:'DM Sans',sans-serif;font-size:13px;color:var(--ink);outline:none;background:var(--white);transition:border-color .15s;width:100%}
.t-inp:focus{border-color:var(--gold)}

/* Bouton calculer — doré lisible */
.t-calc-btn{width:100%;padding:1rem;background:var(--white);color:var(--ink);font-size:12px;letter-spacing:.1em;cursor:pointer;border:2px solid var(--gold);font-family:inherit;transition:all .15s;font-weight:600}
.t-calc-btn:hover:not(:disabled){background:var(--gold4);color:var(--ink)}
.t-calc-btn:disabled{background:var(--g4);color:var(--ink3);border-color:var(--bd);cursor:not-allowed;font-weight:400}

/* Résultat calculateur — fond crème, pas noir */
.t-calc-result{margin-top:1.25rem;border:2px solid var(--gold3);animation:fadeIn .3s ease;background:var(--white)}
.t-calc-res-head{background:var(--gold4);border-bottom:1px solid var(--gold3);padding:.875rem 1.25rem;display:flex;align-items:center;justify-content:space-between}
.t-calc-route{font-family:'Cormorant Garamond',serif;font-size:17px;font-weight:600;color:var(--ink)}
.t-calc-route span{color:var(--gold)}
.t-calc-mode{font-size:11px;padding:3px 10px;border:1px solid var(--gold);color:var(--gold);font-weight:600}
.t-calc-amounts{display:grid;grid-template-columns:auto 1fr;border-bottom:1px solid var(--bd)}
.t-calc-main{padding:1.25rem 1.5rem;background:var(--gold4);border-right:1px solid var(--bd);display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:150px}
.t-calc-lbl{font-size:9px;letter-spacing:.12em;color:var(--ink2);margin-bottom:.5rem;font-weight:500}
.t-calc-amount{font-family:'Cormorant Garamond',serif;font-size:36px;font-weight:600;color:var(--ink);line-height:1}
.t-calc-sub2{font-size:10px;color:var(--ink2);margin-top:.35rem}
.t-calc-details{padding:.875rem 1.25rem;display:flex;flex-direction:column;gap:.3rem}
.t-detail-row{display:flex;align-items:center;justify-content:space-between;padding:.4rem .625rem;background:var(--white);border:1px solid var(--bd);font-size:12px}
.t-detail-row:nth-child(even){background:var(--g4)}
.t-detail-row span{color:var(--ink2)}
.t-detail-row strong{color:var(--ink)}
.t-calc-note{padding:.75rem 1.25rem;font-size:11px;color:var(--ink2);background:var(--g4);border-top:1px solid var(--bd);line-height:1.6}

/* ── Formules ── */
.t-formula-box{border:1px solid var(--gold3);background:var(--gold4);padding:1.25rem 1.5rem}
.t-formula-title{font-size:11px;font-weight:600;color:var(--ink2);margin-bottom:.875rem}
.t-formula-grid{display:grid;grid-template-columns:1fr 1fr;gap:.75rem}
@media(max-width:600px){.t-formula-grid{grid-template-columns:1fr}}
.t-formula-lbl{font-size:11px;color:var(--ink2);margin-bottom:.35rem;font-weight:500}
.t-formula-val{font-family:'Courier New',monospace;font-size:11px;padding:.5rem .75rem;background:var(--white);border:1px solid var(--gold3);color:var(--ink)}

/* Tableau taux assurance */
.t-rates-grid{border:1px solid var(--bd);overflow:hidden;font-size:12px}
.t-rates-head{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;background:var(--gold4);border-bottom:2px solid var(--gold3);padding:.5rem .875rem;font-size:9px;letter-spacing:.1em;color:var(--ink2);font-weight:600}
.t-rates-row{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;padding:.5rem .875rem;border-bottom:1px solid var(--bd);color:var(--ink2)}
.t-rates-row:last-child{border-bottom:none}
.t-rates-row:nth-child(odd){background:var(--g4)}
.t-rates-row:nth-child(even){background:var(--white)}
.t-rates-head span,.t-rates-row span{padding:0 .25rem}

/* ── Matières premières ── */
.t-commos-header{margin-bottom:.875rem}
.t-commos-title{font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:600;color:var(--ink)}
.t-commos-sub{font-size:10px;color:var(--ink2);margin-top:3px}
.t-commos{display:grid;grid-template-columns:repeat(4,1fr);gap:.5rem}
@media(max-width:600px){.t-commos{grid-template-columns:1fr 1fr}}
.t-commo{border:1px solid var(--bd);padding:.875rem 1rem;background:var(--white)}
.t-commo-lbl{font-size:11px;color:var(--ink2);margin-bottom:.5rem;font-weight:500}
.t-commo-val{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:600;color:var(--ink)}
.t-commo-unit{font-size:11px;color:var(--ink3);margin-left:2px}
.t-commo-chg{font-size:12px;margin-top:3px;font-weight:500}
.t-commo-chg.up{color:var(--up)}.t-commo-chg.dn{color:var(--dn)}
.t-alert-example{display:flex;flex-direction:column;gap:.35rem;margin-top:.5rem}
`
