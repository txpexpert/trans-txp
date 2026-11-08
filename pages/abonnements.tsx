import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import { PRICING, fmtDH, priceLine } from '../lib/pricing'

// ── Types ─────────────────────────────────────────────────────────────────────
interface PlanDef {
  id:       'free' | 'pro' | 'premium' | 'enterprise'
  name:     string
  price:    string
  period:   string
  tag?:     string
  featured: boolean
  items:    { ok: boolean; text: string }[]
  cta:      string
  ctaStyle: 'primary' | 'outline' | 'contact'
  modules:  string
}

// ── Plans — montants issus de lib/pricing.ts (source unique) ──────────────────────────────────────
const PLANS: PlanDef[] = [
  {
    id:       'free',
    name:     'GRATUIT',
    price:    '0',
    period:   'pour toujours',
    featured: false,
    modules:  '3 modules',
    items: [
      { ok: true,  text: 'FAQ Douanière' },
      { ok: true,  text: 'Simulateur droits & taxes (basique)' },
      { ok: true,  text: 'Glossaire douanier FR/AR' },
      { ok: false, text: 'Modules opérationnels' },
      { ok: false, text: 'Tableau de bord & alertes' },
      { ok: false, text: 'Support prioritaire' },
    ],
    cta:      "S'inscrire gratuitement",
    ctaStyle: 'outline',
  },
  {
    id:       'pro',
    name:     'PRO',
    price:    fmtDH(PRICING.pro.annual!),
    period:   priceLine('pro').replace(/^DH /, ''),
    featured: false,
    modules:  '18 modules',
    items: [
      { ok: true, text: 'FAQ, Simulateur, Glossaire' },
      { ok: true, text: 'Comparateur régimes & Risques' },
      { ok: true, text: 'Tracking & Intelligence import' },
      { ok: true, text: 'Incoterms, Logistique, Export' },
      { ok: true, text: 'Veille réglementaire & LF 2026' },
      { ok: true, text: 'Calcul conteneurs & Valeur en douane' },
      { ok: true, text: 'Carte bureaux douaniers' },
      { ok: true, text: 'Générateur documents' },
      { ok: true, text: 'Support par email' },
      { ok: false, text: 'Analyses stratégiques & OEA' },
      { ok: false, text: 'Marchandises dangereuses' },
    ],
    cta:      'Commencer',
    ctaStyle: 'primary',
  },
  {
    id:       'premium',
    name:     'PREMIUM',
    price:    fmtDH(PRICING.premium.annual!),
    period:   priceLine('premium').replace(/^DH /, ''),
    tag:      'RECOMMANDÉ',
    featured: true,
    modules:  '34 modules',
    items: [
      { ok: true, text: 'Tout le plan Pro inclus' },
      { ok: true, text: 'Classement HS & Décisions' },
      { ok: true, text: 'Analyses stratégiques & OEA' },
      { ok: true, text: 'Origine ALECA / UE (PEM 2025)' },
      { ok: true, text: 'Régimes économiques & Facilitation' },
      { ok: true, text: 'Intelligence fiscale & stratégique' },
      { ok: true, text: 'Classificateur HS + DUM + Screening' },
      { ok: true, text: 'Marchandises dangereuses (AUT, MRQ, SDG, TDG)' },
      { ok: true, text: 'Douane Engineering & MondoScope' },
      { ok: true, text: 'Support prioritaire 24/7' },
      { ok: true, text: 'Conseil personnalisé (4h/mois)' },
    ],
    cta:      'Commencer',
    ctaStyle: 'primary',
  },
  {
    id:       'enterprise',
    name:     'ENTERPRISE',
    price:    'Sur contrat',
    period:   PRICING.enterprise.note,
    featured: false,
    modules:  'Accès illimité',
    items: [
      { ok: true, text: 'Tout le plan Premium inclus' },
      { ok: true, text: 'Accès wildcard — tous modules présents et futurs' },
      { ok: true, text: 'API & intégration ERP / TMS' },
      { ok: true, text: 'Analyses stratégiques ZLECAf' },
      { ok: true, text: 'Audit & contentieux avancés' },
      { ok: true, text: 'Conseil expert dédié illimité' },
      { ok: true, text: 'Onboarding dédié & formation équipe' },
      { ok: true, text: 'SLA garanti & support direct' },
    ],
    cta:      'Nous contacter',
    ctaStyle: 'contact',
  },
]

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Abonnements() {
  const router = useRouter()

  const handleCta = (plan: PlanDef) => {
    if (plan.ctaStyle === 'contact') {
      router.push('/contact?sujet=entreprise')
      return
    }
    router.push(`/auth/register?plan=${plan.id}`)
  }

  return (
    <Layout variant="inner">
      <div className="page-wrap">

        <div className="page-header">
          <div className="page-kicker">TARIFICATION</div>
          <h1 className="page-title">Abonnements</h1>
          <p className="page-sub">
            Choisissez le plan adapté à votre activité douanière.
            Prix hors taxes, TVA 20 % en sus. Abonnement annuel, payable par virement bancaire.
          </p>
        </div>

        {/* Essai gratuit */}
        <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
          14 jours d'essai gratuit avec accès complet. À la fin de l'essai, votre facture pro-forma vous est envoyée ; le plan choisi est activé pour 12 mois à la validation de votre virement.
        </div>

        {/* Grille des plans */}
        <div className="plans-row" style={{ margin: '0 0 2rem' }}>
          {PLANS.map(p => (
            <div key={p.id} className={`plan ${p.featured ? 'feat' : ''}`}>
              {p.tag && <div className="plan-tag">{p.tag}</div>}

              <div className="plan-nm">{p.name}</div>

              <div className="plan-pr">
                {p.id !== 'enterprise' && p.id !== 'free' && (
                  <span style={{ fontSize: '13px', verticalAlign: 'super' }}>DH </span>
                )}
                {p.id === 'free' ? '0 DH' : p.price}
              </div>
              <div className="plan-per">{p.period}</div>

              {/* Badge nombre de modules */}
              <div style={{
                display: 'inline-block',
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '.06em',
                background: p.featured ? 'rgba(255,255,255,.15)' : 'var(--bg2, #f3f0e8)',
                color: p.featured ? 'white' : 'var(--ba, #C9A84C)',
                borderRadius: '4px',
                padding: '2px 8px',
                margin: '.4rem 0 .8rem',
              }}>
                {p.modules}
              </div>

              <ul className="plan-ul">
                {p.items.map((item, i) => (
                  <li key={i} style={{ color: item.ok ? 'inherit' : 'var(--inkm)' }}>
                    {item.ok ? '✓' : '✗'} {item.text}
                  </li>
                ))}
              </ul>

              <button
                className={`plan-btn${p.ctaStyle === 'outline' ? ' plan-btn-outline' : ''}`}
                onClick={() => handleCta(p)}
              >
                {p.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Note paiement */}
        <p style={{ fontSize: '12px', color: 'var(--inkm)', textAlign: 'center', marginBottom: '2rem' }}>
          Prix HT · TVA 20 % · Abonnement annuel · Paiement par virement bancaire · Facturation en DH · Activation à la validation du paiement
        </p>

        {/* FAQ rapide */}
        <div style={{ maxWidth: 640, margin: '0 auto 2rem' }}>
          <div className="page-kicker" style={{ marginBottom: '.75rem' }}>QUESTIONS FRÉQUENTES</div>
          {[
  [`L'essai gratuit inclut-il tous les modules ?`, `Oui — pendant 14 jours vous avez accès à l'intégralité de la plateforme, sans restriction. Vous pouvez aussi régler avant la fin de l'essai : les 12 mois démarrent à la validation du paiement.`],
  [`Comment s'effectue le paiement ?`, `Par virement bancaire, en une fois pour l'année, en indiquant la référence de votre facture pro-forma (PF-IXP…). Déposez ensuite votre justificatif dans « Mon abonnement ». À la validation du paiement, votre plan est activé pour 12 mois et la facture vous est envoyée par email.`],
  [`Puis-je changer de plan en cours d'année ?`, `Oui — une pro-forma du nouveau plan vous est émise sur demande ; le nouveau plan démarre à la validation du paiement. Contactez-nous pour le traitement de la période restante.`],
  [`L'accès API est-il disponible sur le plan Premium ?`, `Non — l'API et l'intégration ERP sont réservées au plan Enterprise. Contactez-nous pour un devis.`],
].map(([q, a], i) => (
            <details key={i} style={{ borderBottom: '0.5px solid var(--brd, #ddd)', padding: '.75rem 0' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 500, fontSize: '14px', listStyle: 'none' }}>
                {q}
              </summary>
              <p style={{ fontSize: '13px', color: 'var(--inkm)', marginTop: '.4rem', lineHeight: 1.6 }}>{a}</p>
            </details>
          ))}
        </div>

      </div>
    </Layout>
  )
}
