// pages/fiches/index.tsx — les fiches produits du compte, avec la progression de l'étape Qualifier.
import Link from 'next/link'
import { useEffect, useState } from 'react'
import SiteShell from '../../components/SiteShell'
import ProgressBar from '../../components/ProgressBar'

const fmtSh = (c?: string | null) => (c && c.length === 10 ? `${c.slice(0, 4)}.${c.slice(4, 6)}.${c.slice(6, 8)}.${c.slice(8)}` : c || '—')

export default function Fiches() {
  const [etat, setEtat] = useState<'charge' | 'ok' | 'abonnement' | 'connexion'>('charge')
  const [fiches, setFiches] = useState<any[]>([])
  const [quota, setQuota] = useState<number | null>(null)
  useEffect(() => {
    fetch('/api/fiches', { credentials: 'same-origin' }).then(async r => {
      if (r.status === 401) return setEtat('connexion')
      if (r.status === 403) return setEtat('abonnement')
      const j = await r.json(); setFiches(j.fiches || []); setQuota(j.quota ?? null); setEtat('ok')
    }).catch(() => setEtat('connexion'))
  }, [])
  return (
    <SiteShell title="Mes fiches produits | IXP-Import-eXPert">
      <section className="x-hero" style={{ paddingBottom: 18 }}>
        <div className="x-wrap">
          <div className="x-eyebrow">Étape 01 · Qualifier</div>
          <h1 className="x-h1 x-h1-sm">Mes fiches produits</h1>
          <p className="x-lead">Une fiche par produit : classement, origine, valeur, documents et taxes, chaque point rattaché à son texte. Compléter une fiche valide les modules de l’étape Qualifier.</p>
        </div>
      </section>
      <section className="x-sec-tight" style={{ paddingTop: 0 }}>
        <div className="x-wrap" style={{ display: 'grid', gap: 18 }}>
          <ProgressBar etape="qualifier" livrable="Fiche produit" />
          {etat === 'charge' && <p className="x-note">Chargement…</p>}
          {etat === 'connexion' && <div className="x-pc-cta"><p>Connectez-vous pour retrouver vos fiches produits.</p><Link href="/auth/login?redirect=/fiches" className="x-btn x-btn-gold">Connexion</Link></div>}
          {etat === 'abonnement' && <div className="x-pc-cta"><p>Les fiches produits sont incluses dans l’essai et les offres payantes.</p><Link href="/auth/register?plan=pro" className="x-btn x-btn-gold">Essai 14 jours</Link></div>}
          {etat === 'ok' && (
            <>
              {quota != null && (
                <div className="x-pc-cta" style={{ marginTop: 0 }}>
                  <p><b>Offre Découverte : {Math.min(fiches.length, quota)} fiche{fiches.length > 1 ? 's' : ''} sur {quota}.</b> Avec l’offre Pro : fiches sans limite, dossiers défendables, veille hebdomadaire et rapport mensuel au dirigeant.</p>
                  <Link href="/tarifs" className="x-btn x-btn-gold">Voir l’offre Pro</Link>
                </div>)}
              <div>{(quota == null || fiches.length < quota) && <Link href="/fiches/nouvelle" className="x-btn x-btn-dark">+ Nouvelle fiche produit</Link>} <Link href="/demo/fiche-produit" className="x-btn x-btn-line">Voir un exemple</Link> <Link href="/dossiers" className="x-btn x-btn-line">Mes dossiers défendables</Link></div>
              {fiches.length === 0
                ? <div className="x-fl-empty"><b>Votre première fiche en 5 minutes.</b> Désignation, code SH, origine : la fiche se construit en trois écrans et valide votre parcours Qualifier.</div>
                : <table className="x-fl"><thead><tr><th>Produit</th><th>Réf. interne</th><th>Code SH</th><th>Droit</th><th>Origine</th><th>Statut</th><th>Mise à jour</th></tr></thead><tbody>
                    {fiches.map(f => (
                      <tr key={f.id}>
                        <td><Link href={`/fiches/${f.id}`}><b>{f.designation}</b></Link></td>
                        <td>{f.ref_interne || '—'}</td><td className="mono">{fmtSh(f.code_sh)}</td>
                        <td>{f.taux_droit != null ? `${f.taux_droit} %` : '—'}</td><td>{f.pays_origine || '—'}</td>
                        <td><span className={`x-fl-st ${f.statut}`}>{f.statut === 'complete' ? 'Complète' : 'Brouillon'}</span></td>
                        <td>{new Date(f.updated_at).toLocaleDateString('fr-FR')}</td>
                      </tr>))}
                  </tbody></table>}
            </>
          )}
        </div>
      </section>
    </SiteShell>
  )
}
