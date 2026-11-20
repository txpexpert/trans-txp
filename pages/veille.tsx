// pages/veille.tsx — veille « mes produits » : textes et décisions qui touchent les codes SH des fiches.
import Link from 'next/link'
import { useEffect, useState } from 'react'
import SiteShell from '../components/SiteShell'

const fmtSh = (c?: string | null) => (c && c.length === 10 ? `${c.slice(0, 4)}.${c.slice(4, 6)}.${c.slice(6, 8)}.${c.slice(8)}` : c || '—')
const dfr = (d?: string | null) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—')
const LIB: Record<string, string> = { decision: 'Décision de classement', circulaire: 'Circulaire', note: 'Note', note_interne: 'Note', instruction_commune: 'Instruction commune' }
const NIV: Record<string, string> = { position: 'Même position', 'sous-position': 'Même sous-position', 'position SH': 'Même position SH (4 chiffres)' }

export default function Veille() {
  const [etat, setEtat] = useState<'charge' | 'ok' | 'abonnement' | 'connexion' | 'erreur'>('charge')
  const [alertes, setAlertes] = useState<any[]>([])
  const [fiches, setFiches] = useState<any[]>([])
  useEffect(() => {
    fetch('/api/veille', { credentials: 'same-origin' }).then(async r => {
      if (r.status === 401) return setEtat('connexion')
      if (r.status === 403) return setEtat('abonnement')
      if (!r.ok) return setEtat('erreur')
      const j = await r.json(); setAlertes(j.alertes || []); setFiches(j.fiches || []); setEtat('ok')
    }).catch(() => setEtat('erreur'))
  }, [])
  const verif = new Map(fiches.map(f => [f.id, f.verifie_le]))
  const groupes = fiches.map(f => ({ f, l: alertes.filter(a => a.fiche_id === f.id) })).sort((a, z) => z.l.length - a.l.length)
  const nouveaux = alertes.filter(a => a.date_texte && verif.get(a.fiche_id) && a.date_texte > verif.get(a.fiche_id)).length
  return (
    <SiteShell title="Veille sur mes produits | IXP-Import-eXPert">
      <section className="x-hero" style={{ paddingBottom: 18 }}>
        <div className="x-wrap">
          <div className="x-eyebrow">Veille · Mes produits</div>
          <h1 className="x-h1 x-h1-sm">Ce qui a changé <em>pour vos produits</em></h1>
          <p className="x-lead">Les décisions de classement, circulaires et notes des douze derniers mois qui citent les codes SH de vos fiches. Chaque lundi, les nouveaux textes vous sont envoyés par email.</p>
        </div>
      </section>
      <section className="x-sec-tight" style={{ paddingTop: 0 }}>
        <div className="x-wrap" style={{ display: 'grid', gap: 16 }}>
          {etat === 'charge' && <p className="x-note">Analyse de vos produits…</p>}
          {etat === 'erreur' && <p className="x-ff-err">La veille est momentanément indisponible.</p>}
          {etat === 'connexion' && <div className="x-pc-cta"><p>Connectez-vous pour voir la veille sur vos produits.</p><Link href="/auth/login?redirect=/veille" className="x-btn x-btn-gold">Connexion</Link></div>}
          {etat === 'abonnement' && <div className="x-pc-cta"><p>La veille sur vos produits est incluse dans l’essai et les offres payantes.</p><Link href="/auth/register?plan=pro" className="x-btn x-btn-gold">Essai 14 jours</Link></div>}
          {etat === 'ok' && fiches.length === 0 && <div className="x-fl-empty"><b>La veille part de vos fiches produits.</b> Créez une fiche avec son code SH : chaque texte qui le touche vous sera signalé. <Link href="/fiches/nouvelle">Créer ma première fiche</Link></div>}
          {etat === 'ok' && fiches.length > 0 && (
            <>
              <div className="x-vl-sum">
                <div><b>{fiches.length}</b><span>produit{fiches.length > 1 ? 's' : ''} suivi{fiches.length > 1 ? 's' : ''}</span></div>
                <div><b>{alertes.length}</b><span>texte{alertes.length > 1 ? 's' : ''} sur 12 mois</span></div>
                <div className={nouveaux ? 'warn' : ''}><b>{nouveaux}</b><span>postérieur{nouveaux > 1 ? 's' : ''} à la vérification de la fiche</span></div>
              </div>
              {groupes.map(({ f, l }) => (
                <div key={f.id} className="x-vl-card">
                  <div className="x-vl-hd"><div><b>{f.designation}</b> · <span className="mono">{fmtSh(f.code_sh)}</span></div>
                    <span className="x-ff-note" style={{ margin: 0 }}>Fiche vérifiée le {dfr(f.verifie_le)} · <Link href={`/fiches/${f.id}`}>ouvrir</Link></span></div>
                  {l.length === 0 ? <p className="x-ff-note">Aucun texte sur les 12 derniers mois.</p> : (
                    <ul className="x-vl-list">{l.map((a, i) => {
                      const neuf = a.date_texte && f.verifie_le && a.date_texte > f.verifie_le
                      return <li key={i} className={neuf ? 'neuf' : ''}>
                        <div><b>{LIB[a.source] || a.source} n° {a.numero}</b> · {dfr(a.date_texte)} <span className={`x-vl-niv n-${a.niveau.replace(/\s/g, '')}`}>{NIV[a.niveau] || a.niveau}</span>{neuf && <span className="x-vl-neuf">À examiner : postérieur à la fiche</span>}</div>
                        <p>{(a.titre || a.extrait || '').slice(0, 220)}{a.code_cite ? <span className="mono"> · {a.code_cite}</span> : null}</p>
                      </li>
                    })}</ul>)}
                </div>))}
              <p className="x-note">Rapprochement établi à partir des codes SH cités dans les textes publiés. Une alerte signale un texte à examiner ; elle ne préjuge pas de son effet sur vos opérations.</p>
            </>
          )}
        </div>
      </section>
    </SiteShell>
  )
}
