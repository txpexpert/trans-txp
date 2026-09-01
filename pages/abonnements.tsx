import { useRouter } from 'next/router'
import Layout from '../components/Layout'

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

// ── Plans — alignés sur lib/userAuth.ts ──────────────────────────────────────
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
    price:    '799',
    period:   'par mois · TVA incluse',
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
    price:    '1 990',
    period:   'par mois · TVA incluse',
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
    price:    '4 990',
    period:   'par mois · TVA incluse',
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
      router.push('/community#contact')
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
            TVA 20 % incluse. Paiement par virement Banque Populaire.
          </p>
        </div>

        {/* Essai gratuit */}
        <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
          14 jours d'essai gratuit sur tous les plans payants — accès complet, aucune carte bancaire requise.
        </div>

        {/* Grille des plans */}
        <div className="plans-row" style={{ margin: '0 0 2rem' }}>
          {PLANS.map(p => (
            <div key={p.id} className={`plan ${p.featured ? 'feat' : ''}`}>
              {p.tag && <div className="plan-tag">{p.tag}</div>}

              <div className="plan-nm">{p.name}</div>

              <div className="plan-pr">
                <span style={{ fontSize: '13px', verticalAlign: 'super' }}>DH </span>
                {p.price}
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
          Paiement mensuel par virement bancaire · Facturation en DH MAD · Résiliation à tout moment
        </p>

        {/* FAQ rapide */}
        <div style={{ maxWidth: 640, margin: '0 auto 2rem' }}>
          <div className="page-kicker" style={{ marginBottom: '.75rem' }}>QUESTIONS FRÉQUENTES</div>
          {[
  [`L'essai gratuit inclut-il tous les modules ?`, `Oui — pendant 14 jours vous avez accès à l'intégralité de la plateforme, sans restriction.`],
  [`Comment s'effectue le paiement ?`, `Par virement bancaire Banque Populaire. Une facture TVA est émise à chaque renouvellement mensuel.`],
  [`Puis-je changer de plan en cours de mois ?`, `Oui — le changement prend effet immédiatement. La différence est ajustée sur la prochaine facture.`],
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
