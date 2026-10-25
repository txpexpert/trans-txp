// components/IxpTicker.tsx — bandeau d'information déroulant (repris de l'accueil actuel).
// Valeurs indicatives de démonstration ; le défilement s'arrête au survol.
const ITEMS: { l: string; v: string; c: string; up: boolean }[] = [
  { l: 'DH/EUR', v: '10.82', c: '▲ +0.12%', up: true },
  { l: 'DH/USD', v: '9.97', c: '▼ -0.08%', up: false },
  { l: 'FRET TANGER MED', v: '$2 140', c: '▲ +2.1%', up: true },
  { l: 'CIRCULAIRE ADII', v: 'N° 6705/222', c: 'NOUVELLE', up: true },
]

export default function IxpTicker() {
  const row = [...ITEMS, ...ITEMS]
  return (
    <div className="x-ticker" role="marquee" aria-label="Informations de marché et réglementaires">
      <div className="x-ticker-track">
        {[...row, ...row].map((t, i) => (
          <div className="x-t-item" key={i} aria-hidden={i >= ITEMS.length ? true : undefined}>
            <span className="x-t-label">{t.l}</span>
            <span className="x-t-val">{t.v}</span>
            <span className={`x-t-chg ${t.up ? 'up' : 'dn'}`}>{t.c}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
