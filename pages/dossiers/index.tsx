// pages/dossiers/index.tsx — dossiers défendables du compte et émission d'un nouveau dossier.
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import SiteShell from '../../components/SiteShell'

const fmtSh = (c?: string | null) => (c && c.length === 10 ? `${c.slice(0, 4)}.${c.slice(4, 6)}.${c.slice(6, 8)}.${c.slice(8)}` : c || '—')
const dtl = (d: string) => new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })

export default function Dossiers() {
  const router = useRouter()
  const [etat, setEtat] = useState<'charge' | 'ok' | 'abonnement' | 'connexion'>('charge')
  const [dossiers, setDossiers] = useState<any[]>([])
  const [fiches, setFiches] = useState<any[]>([])
  const [choix, setChoix] = useState<string[]>([])
  const [type, setType] = useState<'produit' | 'operation'>('produit')
  const [op, setOp] = useState<Record<string, string>>({})
  const [titre, setTitre] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    Promise.all([fetch('/api/dossiers', { credentials: 'same-origin' }), fetch('/api/fiches', { credentials: 'same-origin' })])
      .then(async ([r1, r2]) => {
        if (r1.status === 401) return setEtat('connexion')
        if (r1.status === 403) return setEtat('abonnement')
        setDossiers((await r1.json()).dossiers || [])
        const fl = (await r2.json()).fiches || []
        setFiches(fl)
        const pre = typeof router.query.fiche === 'string' ? router.query.fiche : null
        if (pre && fl.some((f: any) => f.id === pre)) setChoix([pre])
        setEtat('ok')
      }).catch(() => setEtat('connexion'))
  }, [router.query.fiche])

  const basculer = (id: string) => setChoix(c => (c.includes(id) ? c.filter(x => x !== id) : [...c, id]))

  async function emettre() {
    setErr('')
    if (!choix.length) return setErr('Choisissez au moins une fiche produit.')
    if (type === 'operation' && !op.reference_dum && !op.facture) return setErr('Indiquez au moins la référence de la DUM ou de la facture.')
    setBusy(true)
    try {
      const r = await fetch('/api/dossiers', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fiche_ids: choix, type, operation: type === 'operation' ? op : null, titre }) })
      const j = await r.json()
      if (!r.ok) return setErr(j.error || 'Émission impossible')
      router.push(`/dossiers/${j.dossier.id}`)
    } catch { setErr('Erreur réseau, réessayez.') } finally { setBusy(false) }
  }

  const champ = (k: string, label: string, ph = '') => (
    <label>{label}<input value={op[k] || ''} placeholder={ph} onChange={e => setOp(o => ({ ...o, [k]: e.target.value }))} /></label>)

  return (
    <SiteShell title="Dossiers défendables | IXP-Import-eXPert">
      <section className="x-hero" style={{ paddingBottom: 18 }}>
        <div className="x-wrap">
          <div className="x-eyebrow">Étape 05 · Sécuriser</div>
          <h1 className="x-h1 x-h1-sm">Dossiers <em>défendables</em></h1>
          <p className="x-lead">Un dossier fige vos fiches produits à une date donnée, avec un numéro et une empreinte vérifiables en ligne. C’est la pièce à présenter en cas de contrôle : ce que vous saviez, quand, et sur quels textes.</p>
        </div>
      </section>
      <section className="x-sec-tight" style={{ paddingTop: 0 }}>
        <div className="x-wrap" style={{ display: 'grid', gap: 22 }}>
          {etat === 'charge' && <p className="x-note">Chargement…</p>}
          {etat === 'connexion' && <div className="x-pc-cta"><p>Connectez-vous pour retrouver vos dossiers.</p><Link href="/auth/login?redirect=/dossiers" className="x-btn x-btn-gold">Connexion</Link></div>}
          {etat === 'abonnement' && <div className="x-pc-cta"><p>Les dossiers défendables sont inclus dans l’essai et les offres payantes.</p><Link href="/auth/register?plan=pro" className="x-btn x-btn-gold">Essai 14 jours</Link></div>}
          {etat === 'ok' && (
            <>
              <div className="x-ff">
                <h3 style={{ margin: '0 0 14px' }}>Émettre un dossier</h3>
                {fiches.length === 0 ? (
                  <p>Vous n’avez pas encore de fiche produit. <Link href="/fiches/nouvelle">Créer ma première fiche</Link></p>
                ) : (
                  <>
                    <ol className="x-ff-steps" style={{ marginBottom: 14 }}>
                      <li className={type === 'produit' ? 'on' : ''}><button type="button" onClick={() => setType('produit')}>Par produit</button></li>
                      <li className={type === 'operation' ? 'on' : ''}><button type="button" onClick={() => setType('operation')}>Par opération</button></li>
                    </ol>
                    <p className="x-ff-note" style={{ marginTop: 0 }}>{type === 'produit'
                      ? 'Un dossier par produit : à conserver et à mettre à jour à chaque changement de tarif ou de texte.'
                      : 'Un dossier par opération : les produits d’une même importation, rattachés à sa DUM et à sa facture.'}</p>
                    <ul className="x-ff-pick" style={{ maxHeight: 320, margin: '12px 0' }}>
                      {fiches.map(f => (
                        <li key={f.id}><label className="x-ff-chk" style={{ padding: '8px 12px', border: '1px solid var(--x-line)', borderRadius: 10 }}>
                          <input type="checkbox" checked={choix.includes(f.id)} onChange={() => basculer(f.id)} />
                          <span><b>{f.designation}</b> · {fmtSh(f.code_sh)} · {f.pays_origine || 'origine ?'} · {f.statut === 'complete' ? 'complète' : 'brouillon'}</span>
                        </label></li>))}
                    </ul>
                    <div className="x-ff-grid">
                      <label className="wide">Titre du dossier (facultatif)<input value={titre} onChange={e => setTitre(e.target.value)} placeholder="Ex. : Compteurs intelligents, commande de mars" /></label>
                      {type === 'operation' && (<>
                        {champ('reference_dum', 'Référence de la DUM', 'Ex. : 301-2026-000123')}
                        {champ('date', 'Date de l’opération', 'JJ/MM/AAAA')}
                        {champ('facture', 'Facture commerciale', 'N° et date')}
                        {champ('bureau', 'Bureau de dédouanement', 'Ex. : Casablanca Port')}
                        {champ('regime', 'Régime', 'Ex. : mise à la consommation')}
                        {champ('transitaire', 'Transitaire', '')}
                      </>)}
                    </div>
                    {choix.some(id => fiches.find(f => f.id === id)?.statut !== 'complete') &&
                      <p className="x-ff-note">Une fiche en brouillon peut être incluse : ses points non tranchés seront listés dans le dossier, sans être masqués.</p>}
                    {err && <p className="x-ff-err" style={{ marginTop: 12 }}>{err}</p>}
                    <div className="x-ff-nav"><button type="button" className="x-btn x-btn-dark" disabled={busy} onClick={emettre}>{busy ? 'Émission…' : `Émettre le dossier (${choix.length} fiche${choix.length > 1 ? 's' : ''})`}</button></div>
                  </>
                )}
              </div>
              {dossiers.length > 0 && (
                <table className="x-fl"><thead><tr><th>Numéro</th><th>Dossier</th><th>Type</th><th>Fiches</th><th>Émis le</th><th>Statut</th></tr></thead><tbody>
                  {dossiers.map(d => (
                    <tr key={d.id}>
                      <td className="mono"><Link href={`/dossiers/${d.id}`}>{d.numero}</Link></td>
                      <td><b>{d.titre}</b></td><td>{d.type === 'operation' ? 'Opération' : 'Produit'}</td>
                      <td>{d.nb_fiches}</td><td>{dtl(d.created_at)}</td>
                      <td><span className={`x-fl-st ${d.statut === 'emis' ? 'complete' : ''}`}>{d.statut === 'emis' ? 'Émis' : 'Annulé'}</span></td>
                    </tr>))}
                </tbody></table>
              )}
            </>
          )}
        </div>
      </section>
    </SiteShell>
  )
}
