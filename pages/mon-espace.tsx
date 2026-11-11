// pages/mon-espace.tsx — tableau de bord du compte : score, fiches, dossiers, veille,
// portail clients, et réglages du rapport mensuel au dirigeant (avec aperçu).
import Link from 'next/link'
import { useEffect, useState } from 'react'
import SiteShell from '../components/SiteShell'

const dh = (n: number) => Math.round(n).toLocaleString('fr-FR') + ' DH'
const mdh = (n: number) => (n >= 1e6 ? (Math.round(n / 1e5) / 10).toLocaleString('fr-FR') + ' MDH' : dh(n))
const fourchette = (lo: any, hi: any) => (lo == null || hi == null ? '—' : Math.round(lo) === Math.round(hi) ? dh(lo) : `${mdh(Number(lo))} à ${mdh(Number(hi))}`)

export default function MonEspace() {
  const [s, setS] = useState<any>(null)
  const [etat, setEtat] = useState<'charge' | 'ok' | 'connexion'>('charge')
  const [rap, setRap] = useState<any>(null)
  const [dir, setDir] = useState('')
  const [actif, setActif] = useState(true)
  const [msg, setMsg] = useState('')
  const [voir, setVoir] = useState(false)

  useEffect(() => {
    fetch('/api/mon-espace', { credentials: 'same-origin' }).then(async r => {
      if (r.status === 401) return setEtat('connexion')
      const j = await r.json(); setS(j); setEtat('ok')
      if (j.abonne) fetch('/api/rapport', { credentials: 'same-origin' }).then(x => x.ok ? x.json() : null).then(k => {
        if (!k) return
        setRap(k); setDir(k.reglages?.email_dirigeant || ''); setActif(k.reglages?.rapport_mensuel !== false)
      })
    }).catch(() => setEtat('connexion'))
  }, [])

  async function enregistrer() {
    setMsg('')
    const r = await fetch('/api/rapport', { method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email_dirigeant: dir, rapport_mensuel: actif }) })
    const j = await r.json(); setMsg(r.ok ? 'Réglages enregistrés.' : j.error)
  }
  async function essai() {
    setMsg('Envoi…')
    const r = await fetch('/api/rapport', { method: 'POST', credentials: 'same-origin' })
    const j = await r.json(); setMsg(r.ok ? `Rapport envoyé à ${j.a}.` : j.error)
  }

  const sc = s?.score?.[0], prev = s?.score?.[1]
  const mil = (d: any) => (d && d.exposition_basse != null ? (Number(d.exposition_basse) + Number(d.exposition_haute)) / 2 : null)
  const delta = mil(sc) != null && mil(prev) != null ? mil(sc)! - mil(prev)! : null
  const nom = s?.compte?.raison_sociale || s?.compte?.societe || [s?.compte?.prenom, s?.compte?.nom].filter(Boolean).join(' ')

  const Tuile = ({ href, t, v, d, alerte }: { href: string; t: string; v: string; d: string; alerte?: boolean }) => (
    <Link href={href} className={`x-me-tile ${alerte ? 'warn' : ''}`}><span>{t}</span><b>{v}</b><small>{d}</small></Link>)

  return (
    <SiteShell title="Mon espace | IXP-Import-eXPert">
      <section className="x-hero" style={{ paddingBottom: 18 }}>
        <div className="x-wrap">
          <div className="x-eyebrow">Mon espace{nom ? ` · ${nom}` : ''}</div>
          <h1 className="x-h1 x-h1-sm">Votre conformité import, <em>en un coup d’œil</em></h1>
        </div>
      </section>
      <section className="x-sec-tight" style={{ paddingTop: 0 }}>
        <div className="x-wrap" style={{ display: 'grid', gap: 22 }}>
          {etat === 'charge' && <p className="x-note">Chargement…</p>}
          {etat === 'connexion' && <div className="x-pc-cta"><p>Connectez-vous pour accéder à votre espace.</p><Link href="/auth/login?redirect=/mon-espace" className="x-btn x-btn-gold">Connexion</Link></div>}
          {etat === 'ok' && !s.abonne && <div className="x-pc-cta"><p>Fiches produits, dossiers défendables, veille et rapport mensuel sont inclus dans l’essai et les offres payantes.</p><Link href="/auth/register?plan=pro" className="x-btn x-btn-gold">Essai 14 jours</Link></div>}
          {etat === 'ok' && s.abonne && (
            <>
              <div className="x-me-score">
                <div>
                  <span className="x-mono">EXPOSITION SUR 4 ANS</span>
                  <b>{sc ? fourchette(sc.exposition_basse, sc.exposition_haute) : 'Non mesurée'}</b>
                  <small>{!sc ? 'Le diagnostic chiffre en dirhams les droits exposés sur la période de reprise.'
                    : delta == null ? `Diagnostic du ${new Date(sc.created_at).toLocaleDateString('fr-FR')}`
                    : delta < 0 ? `En baisse de ${dh(-delta)} depuis le diagnostic précédent` : delta > 0 ? `En hausse de ${dh(delta)} depuis le diagnostic précédent` : 'Stable'}</small>
                </div>
                <Link href="/diagnostic" className="x-btn x-btn-gold">{sc ? 'Recalculer mon score' : 'Mesurer mon exposition'}</Link>
              </div>
              <div className="x-me-grid">
                <Tuile href="/fiches" t="Fiches produits" v={String(s.fiches.total)} d={`${s.fiches.completes} complète${s.fiches.completes > 1 ? 's' : ''}`} />
                <Tuile href="/dossiers" t="Dossiers défendables" v={String(s.dossiers)} d="émis et vérifiables" />
                <Tuile href="/veille" t="Veille sur mes produits" v={String(s.veille.total)} d={s.veille.aExaminer ? `${s.veille.aExaminer} à examiner` : 'textes sur 12 mois'} alerte={s.veille.aExaminer > 0} />
                <Tuile href="/portail" t="Portail clients" v={String(s.partages.ouverts)} d={s.partages.piecesFournies ? `${s.partages.piecesFournies} pièce(s) reçue(s) à valider` : 'dossiers partagés en cours'} alerte={s.partages.piecesFournies > 0} />
                <Tuile href="/calculateur-dum" t="Argent laissé sur la table" v="DUM" d="analyser un export de déclarations" />
                <Tuile href="/espaces/qualifier" t="Parcours" v="5 étapes" d="Qualifier, Optimiser, Chiffrer, Exécuter, Sécuriser" />
              </div>

              <div className="x-ff">
                <h3 style={{ margin: '0 0 6px' }}>Rapport mensuel au dirigeant</h3>
                <p className="x-ff-note" style={{ marginTop: 0 }}>Chaque début de mois, un email résume l’exposition et son évolution, l’activité de conformité et les textes qui touchent vos produits. Le dirigeant voit la valeur sans avoir à se connecter.{rap && !rap.inclus ? ' Inclus à partir de l’offre Pro : pendant l’essai, vous pouvez en voir l’aperçu.' : ''}</p>
                <div className="x-ff-grid" style={{ marginTop: 12 }}>
                  <label>Email du dirigeant (en plus du vôtre)<input value={dir} onChange={e => setDir(e.target.value)} placeholder="direction@votre-societe.ma" /></label>
                  <label className="x-ff-chk" style={{ alignSelf: 'end' }}><input type="checkbox" checked={actif} onChange={e => setActif(e.target.checked)} /> Recevoir le rapport chaque mois</label>
                </div>
                <div className="x-ff-nav">
                  <button type="button" className="x-btn x-btn-dark" onClick={enregistrer}>Enregistrer</button>
                  <button type="button" className="x-btn x-btn-line" onClick={() => setVoir(v => !v)} disabled={!rap}>{voir ? 'Masquer l’aperçu' : 'Voir l’aperçu'}</button>
                  <button type="button" className="x-btn x-btn-line" onClick={essai} disabled={!rap}>M’envoyer un essai</button>
                  {msg && <span className="x-ff-note" style={{ alignSelf: 'center' }}>{msg}</span>}
                </div>
                {voir && rap && <iframe title="Aperçu du rapport mensuel" className="x-me-apercu" srcDoc={rap.apercu.html} />}
              </div>
              <p className="x-note">Sur mobile : <Link href="/app">version mobile de l’espace</Link>.</p>
            </>
          )}
        </div>
      </section>
    </SiteShell>
  )
}
