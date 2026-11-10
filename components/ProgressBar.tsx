// components/ProgressBar.tsx
// Barre de progression d'une étape, pour les comptes abonnés (essai compris).
// Segments = modules de l'étape ; un segment se remplit quand le module a produit
// quelque chose. Rien ne s'affiche pour un visiteur ou un compte sans abonnement.
import Link from 'next/link'
import { useEffect, useState } from 'react'

type Mod = { path: string; label: string; fait: boolean; action: string | null }
type Etape = { etape: string; verb: string; total: number; faits: number; modules: Mod[] }

export default function ProgressBar({ etape, livrable }: { etape: string; livrable: string }) {
  const [etapes, setEtapes] = useState<Etape[] | null>(null)
  useEffect(() => {
    fetch('/api/progression', { credentials: 'same-origin' })
      .then(r => (r.ok ? r.json() : null))
      .then(j => { if (j?.abonne) setEtapes(j.etapes) })
      .catch(() => {})
  }, [])
  if (!etapes) return null
  const e = etapes.find(x => x.etape === etape)
  if (!e) return null
  const prochain = e.modules.find(m => !m.fait)
  const fini = e.faits === e.total
  // Qualifier se valide en complétant une fiche produit
  const lienAction = etape === 'qualifier' ? '/fiches/nouvelle' : prochain?.path || `/espaces/${etape}`
  return (
    <div className={`x-prog x-c-${etape}`}>
      <div className="x-prog-top">
        <div className="x-prog-steps">
          {etapes.map(x => x.etape === etape
            ? <b key={x.etape}>{x.verb} {x.faits}/{x.total}</b>
            : <Link key={x.etape} href={`/espaces/${x.etape}`}>{x.faits === x.total ? '✓ ' : ''}{x.verb}{x.faits > 0 && x.faits < x.total ? ` ${x.faits}/${x.total}` : ''}</Link>)}
        </div>
        <span className="x-mono">Votre progression</span>
      </div>
      <div className="x-prog-bar">
        {e.modules.map(m => <span key={m.path} className={m.fait ? 'ok' : ''} title={`${m.label}${m.action ? ' : ' + m.action : ''}${m.fait ? ' (fait)' : ''}`} />)}
      </div>
      <div className="x-prog-foot">
        <span><b>{e.faits} module{e.faits > 1 ? 's' : ''} sur {e.total}</b> réalisé{e.faits > 1 ? 's' : ''} · Livrable : {livrable.toLowerCase()} <b>{fini ? 'prêt' : 'à compléter'}</b></span>
        {fini
          ? <Link href={etape === 'qualifier' ? '/fiches' : `/espaces/${etape}`} className="x-prog-next">Étape terminée : voir le livrable →</Link>
          : <Link href={lienAction} className="x-prog-next">Prochaine action : {etape === 'qualifier' ? (prochain?.action || 'compléter une fiche produit') : prochain?.label} →</Link>}
      </div>
    </div>
  )
}
