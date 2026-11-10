// components/ChainRows.tsx — la chaîne en tuiles transversales détaillées (question, promesse, outils, livrable, transmission).
import Link from 'next/link'
import { CHAIN } from '../lib/suite'

export default function ChainRows() {
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {CHAIN.map(e => (
        <Link href={`/espaces/${e.slug}`} key={e.slug} className={`x-link-card x-row3 x-c-${e.slug}`}>
          <div>
            <span className="x-num">ÉTAPE {e.num}</span>
            <div className="x-verb">{e.verb}</div>
            <div className="x-card-t" style={{ marginBottom: 0 }}>{e.title}</div>
          </div>
          <div>
            <p style={{ margin: '0 0 8px', fontWeight: 500 }}>{e.question}</p>
            <p style={{ margin: 0, color: 'var(--x-ink2)', fontSize: 15 }}>{e.promise}</p>
            <p className="x-mono" style={{ marginTop: 12 }}>{e.tools.map(t => t.label).join(' · ')}</p>
          </div>
          <div className="x-card-out" style={{ borderTop: 'none', paddingTop: 0 }}>
            <b>Livrable</b>{e.livrable}
            <b style={{ marginTop: 12 }}>Transmet</b>{e.transmet}
          </div>
        </Link>
      ))}
    </div>
  )
}
