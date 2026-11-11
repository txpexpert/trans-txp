// pages/tarifs.tsx — abonnement annuel + prestations expertes à l'acte.
// Montants : lib/pricing.ts (source unique), via lib/suite.ts.
import Link from 'next/link'
import { useState } from 'react'
import SiteShell from '../components/SiteShell'
import { PLANS, PRESTATIONS, PACKS } from '../lib/suite'
import { PRICING, fmtDH } from '../lib/pricing'

const FAQ = [
  ['Comment est calculé l’abonnement ?', 'L’abonnement est souscrit pour un an, par utilisateur. Le plan Entreprise est une option contractuelle couvrant toute une équipe.'],
  ['Que vaut un abonnement face au risque couvert ?', 'Le plan Pro représente environ 14 DH HT par jour. À comparer avec un seul redressement, une amende ou quelques jours de surestaries.'],
  ['Les packs experts sont-ils déductibles ?', 'Oui : le montant d’un pack réglé est déduit de votre premier abonnement annuel s’il est souscrit dans les 30 jours qui suivent. Un pack d’au moins 5 000 DH HT couvre une année Pro, d’au moins 9 000 DH HT une année Premium : votre première année est alors offerte.'],
  ['Que coûte l’avis d’un expert ?', 'Un renseignement express coûte 1 500 DH HT, un avis motivé 4 000 DH HT. L’offre Premium inclut 24 renseignements par an : 36 000 DH HT de valeur au tarif à l’acte, pour un abonnement de 9 000 DH HT.'],
  ['Ai-je droit à une réduction ?', 'Chaque nouveau client reçoit un code de bienvenue de 15 % sur son premier abonnement, et un code à offrir à un ami ou un partenaire, qui lui donne la même réduction. Les codes se trouvent dans « Mon espace ».'],
  ['L’essai gratuit donne-t-il accès à tout ?', 'Oui : 14 jours d’accès complet, sans engagement et sans moyen de paiement. À la fin de l’essai, le compte passe à l’offre Découverte : vous gardez le diagnostic, 3 fiches produits et l’alerte mensuelle sur vos produits.'],
  ['Comment se règle l’abonnement ?', 'Par virement bancaire, en dirhams, en une fois pour l’année, avec la référence indiquée sur votre facture pro-forma. Votre plan est activé pour 12 mois à la validation du paiement, et la facture vous est envoyée par email.'],
]

export default function Tarifs() {
  const [pack, setPack] = useState<string | null>(null)
  const [prec, setPrec] = useState('')
  const [etat, setEtat] = useState('')
  async function commander() {
    setEtat('')
    const r = await fetch('/api/packs', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pack, precisions: prec }) })
    if (r.status === 401) { window.location.href = '/auth/login?redirect=/tarifs'; return }
    const j = await r.json(); setEtat(r.ok ? 'ok' : (j.error || 'Commande impossible'))
  }
  return (
    <SiteShell title="Tarifs | IXP-Import-eXPert" description="Abonnement par utilisateur, prestations expertes à l'acte, essai gratuit de 14 jours.">
      <section className="x-hero" style={{ paddingBottom: 24 }}>
        <div className="x-wrap x-center">
          <div className="x-eyebrow">Tarifs</div>
          <h1 className="x-h1">Importez juste, <em>prouvez-le</em>, et faites trancher par un expert quand l’enjeu le justifie.</h1>
          <p className="x-lead">Chaque palier correspond à un résultat : mesurer votre exposition, importer au juste coût, sécuriser et prouver vos dossiers, piloter l’exposition du groupe. Essai gratuit de 14 jours.</p>
        </div>
      </section>

      <section className="x-sec-tight" style={{ paddingTop: 0 }}>
        <div className="x-wrap">
          <div className="x-plans">
            {PLANS.map(p => (
              <div key={p.id} className={`x-plan ${p.vedette ? 'vedette' : ''}`}>
                <span className="x-eyebrow">{p.resultat}</span>
                <h3>{p.nom}</h3>
                <p className="pour">{p.pour}</p>
                <div className="x-price">{p.prix === '0' ? 'Gratuit' : p.id === 'enterprise' ? p.prix : `${p.prix} DH`}<small>{p.unite}</small></div>
                <ul className="x-list">{p.inclus.map(t => <li key={t}>{t}</li>)}</ul>
                <Link href={p.href} className={`x-btn ${p.vedette ? 'x-btn-dark' : 'x-btn-line'}`} style={{ justifyContent: 'center' }}>{p.cta}</Link>
              </div>
            ))}
          </div>
          <p className="x-note x-center">Prix hors taxes, TVA 20 % en sus. Abonnement annuel, payable par virement bancaire ; activation à la validation du paiement.</p>
        </div>
      </section>

      <section className="x-sec">
        <div className="x-wrap">
          <div className="x-eyebrow">Le prix comparé au risque</div>
          <h2 className="x-h2">{fmtDH(Math.round(PRICING.pro.annual! / 365))} DH HT par jour, <em>face à un seul redressement</em>.</h2>
          <p className="x-sub">L’abonnement ne se compare pas à des heures de travail, mais à ce qu’une seule erreur coûte quand elle est découverte, jusqu’à quatre ans plus tard.</p>
          <div className="x-tf-risque">
            <div className="moi"><span>Offre Pro, un an</span><b>{fmtDH(PRICING.pro.annual!)} DH HT</b><small>50 références suivies, dossiers défendables, veille</small></div>
            <div><span>Redevance de marque oubliée</span><b>164 000 DH</b><small>rappel sur quatre ans (cas illustratif)</small></div>
            <div><span>EUR.1 sans mention de cumul</span><b>525 000 DH</b><small>par année d’opérations concernée (cas illustratif)</small></div>
            <div><span>Pièce importée avant l’autorisation</span><b>92 000 DH</b><small>décaissés au lieu d’une garantie (cas illustratif)</small></div>
          </div>
          <p className="x-note">En 2025, l’administration a redressé 23,5 milliards de dirhams au titre de la sous-facturation, en hausse de 33 % (ADII, rapport d’activité 2025). Cas illustratifs : entreprises fictives, mécanismes et textes réels, détaillés sur la page <Link href="/cas-types">Cas types</Link>.</p>
          <div className="x-tf-val">
            <div><span className="x-eyebrow">Premium : la valeur incluse</span>
              <p><b>24 renseignements experts par an</b>, soit <b>36 000 DH HT</b> au tarif à l’acte (1 500 DH HT l’un), inclus dans un abonnement de <b>{fmtDH(PRICING.premium.annual!)} DH HT</b>. Pour un transitaire, deux dossiers délicats par mois suffisent à le rentabiliser.</p></div>
            <Link href="/auth/register?plan=premium" className="x-btn x-btn-dark">Essai Premium 14 jours</Link>
          </div>
        </div>
      </section>

      <section className="x-sec x-sec-white">
        <div className="x-wrap">
          <div className="x-eyebrow">Packs experts</div>
          <h2 className="x-h2">Un premier diagnostic par un expert, <em>déduit de votre abonnement</em>.</h2>
          <p className="x-sub">Forfait fixe, payable par virement. Le montant du pack est déduit de votre premier abonnement annuel s’il est souscrit dans les 30 jours : l’audit flash vaut une année Pro, qui vous est donc offerte.</p>
          <div className="x-presta">
            {PACKS.map(p => (
              <div key={p.nom}><span className="x-mono">{p.pour} · {p.delai}</span><h4>{p.nom}</h4><p className="x-tf-prix">{fmtDH(p.prix)} DH HT{p.prix >= PRICING.premium.annual! ? <small> · première année Premium offerte</small> : p.prix >= PRICING.pro.annual! ? <small> · première année Pro offerte</small> : null}</p><p>{p.desc}</p>
                <button type="button" className="x-btn x-btn-line x-btn-sm" style={{ marginTop: 10 }} onClick={() => setPack(p.nom)}>Commander</button></div>
            ))}
          </div>
          {pack && (
            <div className="x-ff" style={{ marginTop: 22 }}>
              <h4 style={{ margin: '0 0 8px' }}>Commander : {pack}</h4>
              {etat === 'ok' ? <p className="x-ff-ok">Commande enregistrée. Un expert revient vers vous sous 48 heures ouvrées avec le forfait et la pro-forma (virement).</p> : (
                <>
                  <label>Précisions (facultatif)<textarea rows={3} value={prec} onChange={e => setPrec(e.target.value)} placeholder="Nombre de références, période, contexte du contrôle…" /></label>
                  {etat && etat !== 'ok' && <p className="x-ff-err" style={{ marginTop: 10 }}>{etat}</p>}
                  <div className="x-ff-nav"><button type="button" className="x-btn x-btn-dark" onClick={commander}>Envoyer la commande</button>
                    <button type="button" className="x-btn x-btn-line" onClick={() => { setPack(null); setEtat('') }}>Annuler</button></div>
                  <p className="x-ff-note">Commande sans engagement de paiement : le forfait vous est annoncé avant toute intervention.</p>
                </>)}
            </div>)}
        </div>
      </section>

      <section className="x-sec">
        <div className="x-wrap x-two">
          <div>
            <div className="x-eyebrow">Programme partenaires</div>
            <h2 className="x-h2">Transitaires, experts-comptables, <em>prescripteurs</em>.</h2>
          </div>
          <div>
            <ul className="x-list">
              <li>Portail clients : vos importateurs suivent leur dossier, leurs pièces et son avancement, à votre nom</li>
              <li>Fiches produits partagées avec vos clients : moins d’allers-retours, des dossiers prêts avant le dépôt</li>
              <li>Un lien « diagnostic offert par … » à votre nom ; conditions du programme sur demande</li>
            </ul>
            <div style={{ marginTop: 22 }}><Link href="/profils/prescripteurs" className="x-btn x-btn-line">Devenir partenaire</Link></div>
          </div>
        </div>
      </section>

      <section className="x-sec x-sec-dark">
        <div className="x-wrap">
          <div className="x-eyebrow">À l’opération</div>
          <h2 className="x-h2">Renseignements et conseil, <em>facturés à l’acte</em>.</h2>
          <div className="x-presta">
            {PRESTATIONS.map(p => (
              <div key={p.nom}><span className="x-mono">{p.delai}</span><h4>{p.nom}</h4><p className="x-tf-prix">{p.prix}</p><p>{p.desc}</p></div>
            ))}
          </div>
          <div style={{ marginTop: 28 }}><Link href="/expertise" className="x-btn x-btn-gold">En savoir plus sur nos experts</Link></div>
        </div>
      </section>

      <section className="x-sec">
        <div className="x-wrap" style={{ maxWidth: 820 }}>
          <h2 className="x-h2">Questions fréquentes</h2>
          {FAQ.map(([q, a]) => (
            <details key={q} style={{ borderBottom: '1px solid var(--x-line)', padding: '18px 0' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 500, fontSize: 17 }}>{q}</summary>
              <p style={{ color: 'var(--x-ink2)', margin: '10px 0 0' }}>{a}</p>
            </details>
          ))}
        </div>
      </section>
    </SiteShell>
  )
}
