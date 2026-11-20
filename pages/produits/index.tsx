// pages/produits/index.tsx — index public des positions SH : les 100 premières pages produits, et accès direct par code.
import type { GetStaticProps } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import SiteShell from '../../components/SiteShell'
import { resumePositions } from '../../lib/produits'
import { POSITIONS_TOP } from '../../lib/produitsTop'

type R = { sh4: string; libelle: string; min: number | null; max: number | null; lignes: number }
const pct = (x: number | null) => (x == null ? '—' : `${String(x).replace('.', ',')} %`)
const court = (s: string, n = 90) => (s.length > n ? s.slice(0, n - 1).replace(/[\s,;:]+\S*$/, '') + '…' : s)

export const getStaticProps: GetStaticProps<{ positions: R[] }> = async () => ({ props: { positions: await resumePositions(POSITIONS_TOP) }, revalidate: 86400 })

export default function Produits({ positions }: { positions: R[] }) {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [filtre, setFiltre] = useState('')
  const f = filtre.trim().toLowerCase()
  const liste = positions.filter(p => !f || p.sh4.startsWith(f) || p.libelle.toLowerCase().includes(f)).sort((a, z) => a.sh4.localeCompare(z.sh4))
  const parChap = new Map<string, R[]>()
  for (const p of liste) parChap.set(p.sh4.slice(0, 2), [...(parChap.get(p.sh4.slice(0, 2)) || []), p])
  return (
    <SiteShell title="Droits d’importation au Maroc par produit (SH) | Import-eXPert" description="Droits d’importation du tarif 2026, décisions de classement et textes récents, position par position (SH à 4 chiffres).">
      <section className="x-hero" style={{ paddingBottom: 18 }}>
        <div className="x-wrap">
          <div className="x-eyebrow">Produits · Tarif 2026</div>
          <h1 className="x-h1 x-h1-sm">Droits et classement, <em>produit par produit</em></h1>
          <p className="x-lead">Pour chaque position du système harmonisé : le droit d’importation de chaque sous-position, les décisions de classement publiées, les textes récents et les préférences possibles. Mis à jour chaque jour.</p>
          <form className="x-ff-row" style={{ marginTop: 16 }} onSubmit={e => { e.preventDefault(); const c = code.replace(/\D/g, '').slice(0, 4); if (c.length === 4) router.push(`/produits/${c}`) }}>
            <input className="x-vf-in" style={{ minWidth: 200 }} value={code} onChange={e => setCode(e.target.value)} placeholder="Code SH, ex. 8544" inputMode="numeric" />
            <button className="x-btn x-btn-dark" type="submit">Ouvrir la position</button>
          </form>
        </div>
      </section>
      <section className="x-sec-tight" style={{ paddingTop: 0 }}>
        <div className="x-wrap" style={{ display: 'grid', gap: 18 }}>
          <input className="x-vf-in" style={{ fontFamily: 'inherit' }} value={filtre} onChange={e => setFiltre(e.target.value)} placeholder="Filtrer les 100 positions les plus sensibles (code ou mot)" />
          {Array.from(parChap.entries()).map(([ch, l]) => (
            <div key={ch} className="x-ff">
              <h2 className="x-pr-h2">Chapitre {ch}</h2>
              <ul className="x-pr-idx">{l.map(p => (
                <li key={p.sh4}><Link href={`/produits/${p.sh4}`}><span className="mono">{p.sh4}</span><span>{court(p.libelle)}</span><b>{p.min === p.max ? pct(p.min) : `${pct(p.min)} à ${pct(p.max)}`}</b></Link></li>))}</ul>
            </div>))}
          <p className="x-note">Sélection : positions ayant fait l’objet de décisions de classement, puis celles où l’écart de droit entre sous-positions est le plus fort. Toutes les autres positions sont accessibles par leur code.</p>
        </div>
      </section>
    </SiteShell>
  )
}
