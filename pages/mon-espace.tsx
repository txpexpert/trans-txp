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
  const [codes, setCodes] = useState<any>(null)
  const [saisie, setSaisie] = useState('')
  const [msgCode, setMsgCode] = useState('')
  const [baroFait, setBaroFait] = useState(true)
  const [wa, setWa] = useState<any>(null)
  const [waCode, setWaCode] = useState<any>(null)
  const chargerWa = () => fetch('/api/whatsapp/lien', { credentials: 'same-origin' }).then(r => (r.ok ? r.json() : null)).then(setWa).catch(() => {})
  useEffect(() => { chargerWa() }, [])
  async function relierWa() {
    const r = await fetch('/api/whatsapp/lien', { method: 'POST', credentials: 'same-origin' })
    const j = await r.json(); if (r.ok) setWaCode(j)
  }
  async function delierWa() {
    await fetch('/api/whatsapp/lien', { method: 'DELETE', credentials: 'same-origin' }); setWaCode(null); chargerWa()
  }
  useEffect(() => {
    try { setBaroFait(!!localStorage.getItem('ixp-enquete-2026-moi')) } catch { setBaroFait(false) }
    fetch('/api/codes', { credentials: 'same-origin' }).then(r => (r.ok ? r.json() : null)).then(j => j && setCodes(j)).catch(() => {})
  }, [])
  async function appliquer(code: string) {
    setMsgCode('')
    const r = await fetch('/api/codes', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) })
    const j = await r.json()
    if (!r.ok) return setMsgCode(j.error)
    setMsgCode(`Code appliqué : −${j.pourcentage} % sur votre premier abonnement${j.reemise ? ' (pro-forma réémise au nouveau montant)' : ''}.`)
    fetch('/api/codes', { credentials: 'same-origin' }).then(x => x.json()).then(setCodes)
  }

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
          {etat === 'ok' && !s.abonne && !s.decouverte && <div className="x-pc-cta"><p>Votre compte est suspendu. Contactez-nous pour le réactiver.</p><Link href="/contact" className="x-btn x-btn-gold">Nous contacter</Link></div>}
          {etat === 'ok' && s.decouverte && s.cabinet && <div className="x-pc-cta"><p><b>Accès offert par {s.cabinet.nom}.</b> Vous disposez du diagnostic, de 10 fiches produits et de la veille sur ces produits. L’offre Pro ajoute 50 références, les dossiers défendables, la veille hebdomadaire et le rapport mensuel.</p><Link href="/tarifs" className="x-btn x-btn-gold">Voir l’offre Pro</Link></div>}
          {etat === 'ok' && s.decouverte && !s.cabinet && <div className="x-pc-cta"><p><b>Offre Découverte.</b> Vous gardez le diagnostic, 3 fiches produits et la veille sur ces produits. L’offre Pro ajoute les fiches sans limite, les dossiers défendables, la veille hebdomadaire et le rapport mensuel au dirigeant.</p><Link href="/tarifs" className="x-btn x-btn-gold">Passer à l’offre Pro</Link></div>}
          {etat === 'ok' && (s.abonne || s.decouverte) && (
            <>
              <div className="x-me-score">
                <div>
                  <span className="x-mono">EXPOSITION SUR 4 ANS</span>
                  <b>{sc ? fourchette(sc.exposition_basse, sc.exposition_haute) : 'Non mesurée'}</b>
                  <small>{!sc ? 'Le diagnostic chiffre en dirhams les droits exposés sur la période de reprise.'
                    : delta == null ? `Diagnostic du ${new Date(sc.created_at).toLocaleDateString('fr-FR')}`
                    : delta < 0 ? `En baisse de ${dh(-delta)} depuis le diagnostic précédent` : delta > 0 ? `En hausse de ${dh(delta)} depuis le diagnostic précédent` : 'Stable'}</small>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Link href="/diagnostic" className="x-btn x-btn-gold">{sc ? 'Recalculer mon score' : 'Mesurer mon exposition'}</Link>
                  {sc && <Link href="/echange-expert" className="x-btn x-btn-line" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.4)' }}>Échange de 20 minutes avec un expert</Link>}
                </div>
              </div>
              {!baroFait && (
                <div className="x-pc-cta" style={{ marginTop: 0 }}>
                  <p><b>Baromètre 2026 : 4 minutes, réponses anonymes.</b> Délais, difficultés de conformité, accords utilisés : vos réponses alimentent le premier baromètre de la friction douanière au Maroc.</p>
                  <a href="/enquete" className="x-btn x-btn-gold">Répondre</a>
                </div>)}
              <div className="x-me-grid">
                <Tuile href="/fiches" t="Fiches produits" v={String(s.fiches.total)} d={`${s.fiches.completes} complète${s.fiches.completes > 1 ? 's' : ''}`} />
                <Tuile href={s.abonne ? '/dossiers' : '/tarifs'} t="Dossiers défendables" v={s.abonne ? String(s.dossiers) : 'Pro'} d={s.abonne ? 'émis et vérifiables' : 'inclus à partir de l’offre Pro'} />
                <Tuile href="/veille" t="Veille sur mes produits" v={String(s.veille.total)} d={s.veille.aExaminer ? `${s.veille.aExaminer} à examiner` : 'textes sur 12 mois'} alerte={s.veille.aExaminer > 0} />
                <Tuile href={s.abonne ? '/portail' : '/tarifs'} t="Portail clients" v={s.abonne ? String(s.partages.ouverts) : 'Pro'} d={s.partages.piecesFournies ? `${s.partages.piecesFournies} pièce(s) reçue(s) à valider` : 'dossiers partagés en cours'} alerte={s.partages.piecesFournies > 0} />
                <Tuile href="/calculateur-dum" t="Argent laissé sur la table" v="DUM" d="analyser un export de déclarations" />
                <Tuile href="/espaces/qualifier" t="Parcours" v="5 étapes" d="Qualifier, Optimiser, Chiffrer, Exécuter, Sécuriser" />
              </div>

              {codes && (
                <div className="x-ff">
                  <h3 style={{ margin: '0 0 6px' }}>Vos codes de réduction</h3>
                  <div className="x-me-codes">
                    <div><span>Votre code de bienvenue</span><b className="mono">{codes.codes.bienvenue?.code}</b>
                      <small>−{codes.codes.bienvenue?.pourcentage} % sur votre premier abonnement annuel</small>
                      {!codes.applique && <button type="button" className="x-btn x-btn-dark x-btn-sm" onClick={() => appliquer(codes.codes.bienvenue.code)}>Appliquer à mon abonnement</button>}</div>
                    <div><span>Code à offrir</span><b className="mono">{codes.codes.parrainage?.code}</b>
                      <small>−{codes.codes.parrainage?.pourcentage} % pour un ami ou un partenaire sur son premier abonnement</small>
                      <button type="button" className="x-btn x-btn-line x-btn-sm" onClick={() => { navigator.clipboard?.writeText(`Je vous recommande Import-eXPert pour sécuriser vos importations. Avec le code ${codes.codes.parrainage.code}, vous bénéficiez de ${codes.codes.parrainage.pourcentage} % de réduction sur votre premier abonnement : ${window.location.origin}`); setMsgCode('Message de recommandation copié.') }}>Copier le message à envoyer</button></div>
                  </div>
                  {codes.applique ? <p className="x-ff-ok" style={{ marginTop: 12 }}>Code {codes.applique.code} {codes.applique.utilise_le ? 'utilisé sur votre abonnement.' : `appliqué : Pro ${codes.simulation.pro.net.toLocaleString('fr-FR')} DH HT au lieu de ${codes.simulation.pro.base.toLocaleString('fr-FR')}, Premium ${codes.simulation.premium.net.toLocaleString('fr-FR')} DH HT au lieu de ${codes.simulation.premium.base.toLocaleString('fr-FR')}.`}</p>
                    : <div className="x-ff-row" style={{ marginTop: 12 }}><input value={saisie} onChange={e => setSaisie(e.target.value)} placeholder="Vous avez reçu un code ? AMI-…" style={{ padding: '9px 12px', border: '1px solid var(--x-line2)', borderRadius: 10 }} />
                      <button type="button" className="x-btn x-btn-line x-btn-sm" onClick={() => appliquer(saisie)}>Appliquer</button></div>}
                  {msgCode && <p className="x-ff-note">{msgCode}</p>}
                </div>)}

              {wa?.actif && <div className="x-ff">
                <h3 style={{ margin: '0 0 6px' }}>IXP-Assistant sur WhatsApp</h3>
                <p className="x-ff-note" style={{ marginTop: 0 }}>Posez vos questions de réglementation depuis WhatsApp, au {wa.numero}. Les réponses s’appuient sur les mêmes textes officiels que l’assistant du site et se terminent par le lien vers la bonne page. Seul le texte de la question est analysé : ni votre numéro ni votre nom. Envoyez STOP pour vous désinscrire, CONSEILLER pour parler à un expert.{!wa.inclus ? ' Inclus pendant l’essai et dans les offres payantes.' : ''}</p>
                {wa.relie
                  ? <div className="x-ff-nav"><span className="x-ff-ok" style={{ alignSelf: 'center' }}>Numéro relié : {wa.relie.telephone}{wa.relie.desinscrit ? ' (désinscrit : envoyez START pour réactiver)' : wa.relie.depuis ? `, depuis le ${new Date(wa.relie.depuis).toLocaleDateString('fr-FR')}` : ''}</span>
                      <button type="button" className="x-btn x-btn-line x-btn-sm" onClick={delierWa}>Délier ce numéro</button></div>
                  : waCode
                    ? <div><p style={{ margin: '8px 0' }}>Depuis le téléphone à relier, envoyez le message <b style={{ fontFamily: 'var(--x-mono)' }}>IXP {waCode.code}</b> au {wa.numero}. Le code est valable {waCode.expire_dans} minutes ; c’est votre envoi qui relie le numéro et date votre accord.</p>
                        <div className="x-ff-nav"><a href={waCode.lien} target="_blank" rel="noopener noreferrer" className="x-btn x-btn-dark">Ouvrir WhatsApp avec le message</a>
                          <button type="button" className="x-btn x-btn-line" onClick={chargerWa}>J’ai envoyé le message</button></div></div>
                    : <div className="x-ff-nav"><button type="button" className="x-btn x-btn-dark" onClick={relierWa} disabled={!wa.inclus}>Relier mon numéro</button></div>}
                {!wa.assistant && <p className="x-ff-note">En cours d’ouverture : le bouton WhatsApp fonctionne déjà ; les réponses automatiques arrivent dès la validation du compte WhatsApp Business.</p>}
              </div>}

              {s.abonne && <div className="x-ff">
                <h3 style={{ margin: '0 0 6px' }}>Rapport mensuel au dirigeant</h3>
                <p className="x-ff-note" style={{ marginTop: 0 }}>Chaque début de mois, un email résume l’exposition et son évolution, l’activité de conformité et les textes qui touchent vos produits. Le dirigeant voit la valeur sans avoir à se connecter. Offres Premium et Entreprise : un rapport trimestriel au comité de direction s’y ajoute en janvier, avril, juillet et octobre, avec la tendance du trimestre et les priorités du suivant.{rap && !rap.inclus ? ' Inclus à partir de l’offre Pro : pendant l’essai, vous pouvez en voir l’aperçu.' : ''}</p>
                <div className="x-ff-grid" style={{ marginTop: 12 }}>
                  <label>Email du dirigeant (en plus du vôtre)<input value={dir} onChange={e => setDir(e.target.value)} placeholder="direction@votre-societe.ma" /></label>
                  <label className="x-ff-chk" style={{ alignSelf: 'end' }}><input type="checkbox" checked={actif} onChange={e => setActif(e.target.checked)} /> Recevoir le rapport chaque mois</label>
                </div>
                <div className="x-ff-nav">
                  <button type="button" className="x-btn x-btn-dark" onClick={enregistrer}>Enregistrer</button>
                  <button type="button" className="x-btn x-btn-line" onClick={() => setVoir(v => !v)} disabled={!rap}>{voir ? 'Masquer l’aperçu' : 'Voir l’aperçu'}</button>
                  <button type="button" className="x-btn x-btn-line" onClick={essai} disabled={!rap}>M’envoyer un essai</button>
                  {['premium', 'enterprise'].includes(s.compte?.plan) && <button type="button" className="x-btn x-btn-line" onClick={() => fetch('/api/rapport?trimestre=1', { credentials: 'same-origin' }).then(r => r.json()).then(k => { setRap(k); setVoir(true) })}>Aperçu trimestriel</button>}
                  {msg && <span className="x-ff-note" style={{ alignSelf: 'center' }}>{msg}</span>}
                </div>
                {voir && rap && <iframe title="Aperçu du rapport mensuel" className="x-me-apercu" srcDoc={rap.apercu.html} />}
              </div>}
              <p className="x-note">Sur mobile : <Link href="/app">version mobile de l’espace</Link>.</p>
            </>
          )}
        </div>
      </section>
    </SiteShell>
  )
}
