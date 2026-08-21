import { useState } from 'react'
import ModuleLayout from '../../components/ModuleLayout'

// ── Types ─────────────────────────────────────────────────────────────────────
type Onglet = 'services' | 'experts' | 'contact' | 'faq'

interface Service {
  id: string
  badge: string
  titre: string
  description: string
  delai: string
  plan: string
  tarif: string
  inclus: string[]
}

interface Expert {
  initiales: string
  nom: string
  specialite: string
  experience: string
  certifications: string[]
  disponible: boolean
}

interface FAQ {
  q: string
  r: string
}

// ── Données ───────────────────────────────────────────────────────────────────
const SERVICES: Service[] = [
  {
    id: 'express',
    badge: 'EXPRESS',
    titre: 'Consultation express',
    description: 'Réponse sous 4h ouvrées par un expert douanier certifié. Idéal pour les questions urgentes avant dédouanement ou en cas de blocage au port.',
    delai: '4h ouvrées',
    plan: 'Professionnel+',
    tarif: 'Inclus — illimité',
    inclus: [
      'Réponse écrite détaillée par email',
      'Références réglementaires citées (CDDE, circulaires)',
      'Rappel du délai et des démarches à suivre',
      'Archive accessible dans votre espace',
    ],
  },
  {
    id: 'classement',
    badge: 'TARIF',
    titre: 'Étude de classement tarifaire',
    description: 'Analyse complète de la position SH applicable à votre marchandise, calcul de l\'incidence droits + taxes, scénarios d\'optimisation légale.',
    delai: '24–48h',
    plan: 'Professionnel',
    tarif: '3 credits/étude',
    inclus: [
      'Note de classement motivée (position SH retenue)',
      'Calcul cascade DI + TVA + TIC + PFI',
      'Comparaison avec positions alternatives',
      'Recommandation sur le régime douanier optimal',
      'Document exportable en PDF',
    ],
  },
  {
    id: 'oea',
    badge: 'OEA',
    titre: 'Accompagnement OEA',
    description: 'Préparation et suivi complet du dossier de certification Opérateur Économique Agréé auprès de l\'ADII. Audit préalable inclus.',
    delai: '3–6 mois',
    plan: 'Entreprise',
    tarif: 'Sur devis',
    inclus: [
      'Audit de conformité préalable (scoring)',
      'Cartographie des risques et plan d\'action',
      'Rédaction du dossier de demande',
      'Suivi des échanges avec l\'ADII',
      'Formation équipes douane & logistique',
      'Accompagnement post-certification',
    ],
  },
  {
    id: 'formation',
    badge: 'FORM',
    titre: 'Formation sur mesure',
    description: 'Sessions de formation en douane marocaine pour vos équipes logistique, achats et finance. Intra-entreprise ou en présentiel à Casablanca.',
    delai: 'Sur calendrier',
    plan: 'Entreprise',
    tarif: 'Sur devis',
    inclus: [
      'Programme adapté à votre secteur d\'activité',
      'Support de formation personnalisé',
      'Exercices pratiques sur cas réels',
      'Évaluation des acquis',
      'Attestation de formation délivrée',
    ],
  },
  {
    id: 'audit',
    badge: 'AUDIT',
    titre: 'Audit douanier indépendant',
    description: 'Revue complète de vos opérations douanières : classement, valeur, origine, régimes économiques. Identification des risques et opportunités.',
    delai: '5–15 jours',
    plan: 'Entreprise',
    tarif: 'Sur devis',
    inclus: [
      'Analyse de 12 mois d\'opérations (DUM)',
      'Rapport de conformité avec scoring',
      'Identification des trop-perçus récupérables',
      'Plan d\'action priorisé',
      'Présentation à votre direction',
    ],
  },
  {
    id: 'litige',
    badge: 'LITIGE',
    titre: 'Assistance contentieux',
    description: 'Accompagnement dans la gestion des litiges douaniers : rédaction de recours gracieux, négociation de transactions, préparation des dossiers juridictionnels.',
    delai: 'Selon urgence',
    plan: 'Professionnel+',
    tarif: '5 crédits/dossier',
    inclus: [
      'Analyse de la décision contestée',
      'Stratégie de recours recommandée',
      'Rédaction de la réclamation',
      'Suivi du dossier auprès de l\'ADII',
      'Préparation dossier tribunal si nécessaire',
    ],
  },
]

const EXPERTS: Expert[] = [
  {
    initiales: 'MO',
    nom: 'Mohammed Ouhammou',
    specialite: 'Classement tarifaire & Valeur en douane',
    experience: '18 ans · Ex-ADII Casablanca Port',
    certifications: ['Expert douanier agréé ADII', 'Certifié OMA — Classification SH', 'Arbitre WCO'],
    disponible: true,
  },
  {
    initiales: 'FZ',
    nom: 'Fatima Zahra Benali',
    specialite: 'Régimes économiques & OEA',
    experience: '14 ans · Conseil entreprises export',
    certifications: ['Expert douanier agréé', 'Spécialiste ALE Maroc', 'Formatrice ADII agréée'],
    disponible: true,
  },
  {
    initiales: 'KT',
    nom: 'Karim Tazi',
    specialite: 'Contentieux douanier & Litiges',
    experience: '22 ans · Avocat douanier — Barreau Rabat',
    certifications: ['Avocat spécialisé droit douanier', 'Expert judiciaire', 'Médiateur agréé'],
    disponible: false,
  },
  {
    initiales: 'SA',
    nom: 'Sara Alaoui',
    specialite: 'Commerce international & Incoterms',
    experience: '11 ans · Direction logistique groupe industriel',
    certifications: ['Expert douanier agréé', 'Certified Global Business Professional', 'Formatrice ICC Paris'],
    disponible: true,
  },
]

const FAQ_DATA: FAQ[] = [
  {
    q: 'Quelle est la différence entre consultation express et étude de classement ?',
    r: 'La consultation express répond à une question douanière générale (délais, procédure, régime applicable) en moins de 4h. L\'étude de classement est une analyse approfondie qui aboutit à une note de classement SH formelle, avec calcul de droits et alternatives — elle requiert l\'examen des documents techniques de votre produit.',
  },
  {
    q: 'Les avis rendus sont-ils opposables à l\'ADII ?',
    r: 'Les avis de nos experts sont des consultations privées non opposables à l\'administration. Pour obtenir un avis officiel et opposable, vous pouvez demander un Renseignement Tarifaire Contraignant (RTC) directement auprès de l\'ADII — nos experts peuvent vous accompagner dans cette démarche.',
  },
  {
    q: 'Combien de temps pour obtenir la certification OEA ?',
    r: 'En moyenne 6 à 18 mois selon votre niveau de préparation initial. Avec notre accompagnement, les entreprises bien préparées obtiennent leur certification en 4 à 8 mois. Un audit préalable gratuit vous donnera une estimation précise pour votre situation.',
  },
  {
    q: 'Quels secteurs couvrez-vous ?',
    r: 'Nos experts couvrent tous les secteurs du commerce extérieur marocain : agroalimentaire, automobile, textile, chimie, BTP, électronique, produits de la mer. Chaque dossier est traité par l\'expert dont la spécialité sectorielle correspond à votre activité.',
  },
]

// ── Composant principal ───────────────────────────────────────────────────────
export default function Conseil() {
  const [onglet, setOnglet] = useState<Onglet>('services')
  const [serviceSelectionne, setServiceSelectionne] = useState<string | null>(null)
  const [faqOuverte, setFaqOuverte] = useState<number | null>(null)

  // Formulaire contact
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [societe, setSociete] = useState('')
  const [service, setService] = useState('express')
  const [msg, setMsg] = useState('')
  const [urgence, setUrgence] = useState('normal')
  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  const [erreurEnvoi, setErreurEnvoi] = useState('')
  const [sent, setSent] = useState(false)

  const ONGLETS: { id: Onglet; label: string }[] = [
    { id: 'services', label: 'Services & Offres' },
    { id: 'experts', label: 'Nos experts' },
    { id: 'contact', label: 'Contacter un expert' },
    { id: 'faq', label: 'Questions fréquentes' },
  ]

  const serviceSel = SERVICES.find(s => s.id === serviceSelectionne)

  const envoyerDemande = async () => {
    if (!nom || !email || !msg) return
    setErreurEnvoi('')
    setEnvoiEnCours(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom, email, societe, service, urgence, msg, source: 'conseil' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur inconnue')
      setSent(true)
    } catch (err) {
      setErreurEnvoi(err instanceof Error ? err.message : "Erreur lors de l'envoi — réessayez.")
    } finally {
      setEnvoiEnCours(false)
    }
  }

  return (
    <ModuleLayout
      kicker="MODULE 07"
      title="Conseil Personnalisé"
      sub="Assistance d'experts douaniers certifiés pour vos opérations complexes, litiges et optimisation tarifaire — Maroc."
    >

      {/* BANDEAU PLAN */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bd)', color: '#fff', padding: '.75rem 1.25rem',
        marginBottom: '1.5rem', flexWrap: 'wrap', gap: '.5rem',
      }}>
        <div style={{ fontSize: 12 }}>
          <span style={{ color: 'var(--gold)', fontWeight: 600 }}>Plan Professionnel requis</span>
          {' '}— Consultations illimitées · Experts certifiés · Réponse garantie sous 4h
        </div>
        <button style={{
          padding: '5px 14px', background: 'var(--gold)', color: '#fff',
          border: 'none', fontSize: 11, fontWeight: 600, letterSpacing: '.06em',
          cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
        }}>
          VOIR LES PLANS →
        </button>
      </div>

      {/* NAVIGATION ONGLETS */}
      <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1.75rem', borderBottom: '.5px solid var(--border)' }}>
        {ONGLETS.map(o => (
          <button
            key={o.id}
            onClick={() => setOnglet(o.id)}
            style={{
              padding: '.5rem 1rem', fontSize: 12, fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500, letterSpacing: '.04em', border: 'none',
              borderBottom: onglet === o.id ? '2px solid var(--gold)' : '2px solid transparent',
              background: 'transparent',
              color: onglet === o.id ? 'var(--bd)' : 'var(--inkm)',
              cursor: 'pointer', marginBottom: '-1px', transition: 'all .15s',
            }}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* ── SERVICES ── */}
      {onglet === 'services' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {SERVICES.map(s => (
              <div
                key={s.id}
                onClick={() => setServiceSelectionne(serviceSelectionne === s.id ? null : s.id)}
                style={{
                  background: '#fff', border: `.5px solid ${serviceSelectionne === s.id ? 'var(--gold)' : 'var(--border)'}`,
                  padding: '1.25rem', cursor: 'pointer', transition: 'all .15s',
                  boxShadow: serviceSelectionne === s.id ? '0 0 0 2px rgba(184,146,42,.15)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '.75rem' }}>
                  <span style={{
                    fontSize: 9, letterSpacing: '.12em', padding: '3px 8px',
                    background: 'var(--bd)', color: 'var(--gold)', fontWeight: 600,
                  }}>{s.badge}</span>
                  <span style={{ fontSize: 10, color: 'var(--inkm)' }}>⏱ {s.delai}</span>
                </div>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)', marginBottom: '.4rem' }}>{s.titre}</div>
                <div style={{ fontSize: 12, color: 'var(--inkm)', lineHeight: 1.6, marginBottom: '.75rem' }}>{s.description}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '.75rem', borderTop: '.5px solid var(--border)' }}>
                  <span style={{ fontSize: 10, color: 'var(--ba)', letterSpacing: '.05em' }}>{s.plan}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--bd)', fontFamily: "'JetBrains Mono', monospace" }}>{s.tarif}</span>
                </div>
              </div>
            ))}
          </div>

          {/* DÉTAIL SERVICE */}
          {serviceSel && (
            <div style={{ background: 'var(--bl)', border: '.5px solid var(--rule)', padding: '1.5rem' }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, color: 'var(--bd)', marginBottom: '1rem' }}>
                {serviceSel.titre} — Ce qui est inclus
              </div>
              <div style={{ display: 'grid', gap: '.4rem' }}>
                {serviceSel.inclus.map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '.6rem', fontSize: 13, color: 'var(--inks)' }}>
                    <span style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 2 }}>✓</span>
                    {item}
                  </div>
                ))}
              </div>
              <button
                onClick={() => { setService(serviceSel.id); setOnglet('contact') }}
                style={{
                  marginTop: '1.25rem', padding: '.55rem 1.25rem',
                  background: 'var(--bd)', color: '#fff', border: 'none',
                  fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Demander ce service →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── EXPERTS ── */}
      {onglet === 'experts' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
          {EXPERTS.map(e => (
            <div key={e.nom} style={{ background: '#fff', border: '.5px solid var(--border)', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{
                  width: 44, height: 44, background: 'var(--bd)', color: 'var(--gold)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, flexShrink: 0,
                }}>
                  {e.initiales}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>{e.nom}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', marginTop: 3 }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: e.disponible ? '#22C55E' : '#94A3B8',
                      display: 'inline-block',
                    }} />
                    <span style={{ fontSize: 10, color: e.disponible ? '#166534' : 'var(--inkm)' }}>
                      {e.disponible ? 'Disponible' : 'En mission'}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--bd)', marginBottom: '.35rem' }}>{e.specialite}</div>
              <div style={{ fontSize: 11, color: 'var(--inkm)', marginBottom: '.85rem' }}>{e.experience}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.25rem' }}>
                {e.certifications.map(c => (
                  <div key={c} style={{ fontSize: 11, color: 'var(--inks)', display: 'flex', gap: '.4rem', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--gold)', flexShrink: 0 }}>·</span>{c}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── CONTACT ── */}
      {onglet === 'contact' && (
        <div style={{ maxWidth: 620 }}>
          {sent ? (
            <div style={{ background: '#F0FDF4', border: '.5px solid #86EFAC', padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: '.5rem' }}>✓</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, color: '#166534', marginBottom: '.5rem' }}>
                Demande envoyée
              </div>
              <div style={{ fontSize: 13, color: '#15803D' }}>
                Un expert vous contactera sous 4h ouvrées à l'adresse <strong>{email}</strong>.
              </div>
              <button
                onClick={() => { setSent(false); setNom(''); setEmail(''); setSociete(''); setMsg('') }}
                style={{ marginTop: '1rem', padding: '.5rem 1rem', background: 'var(--bd)', color: '#fff', border: 'none', fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
              >
                Nouvelle demande
              </button>
            </div>
          ) : (
            <div style={{ background: '#fff', border: '.5px solid var(--border)', padding: '1.5rem' }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, color: 'var(--bd)', marginBottom: '1.25rem' }}>
                Contacter un expert
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">NOM COMPLET *</label>
                  <input className="form-input" value={nom} onChange={e => setNom(e.target.value)} placeholder="Votre nom" />
                </div>
                <div>
                  <label className="form-label">EMAIL *</label>
                  <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@societe.ma" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">SOCIÉTÉ</label>
                  <input className="form-input" value={societe} onChange={e => setSociete(e.target.value)} placeholder="Nom de votre entreprise" />
                </div>
                <div>
                  <label className="form-label">SERVICE SOUHAITÉ</label>
                  <select className="form-input" value={service} onChange={e => setService(e.target.value)}>
                    {SERVICES.map(s => <option key={s.id} value={s.id}>{s.titre}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">NIVEAU D'URGENCE</label>
                <div style={{ display: 'flex', gap: '.5rem', marginTop: 4 }}>
                  {[['normal', 'Normal (48h)'], ['urgent', 'Urgent (24h)'], ['critique', 'Critique (4h)']].map(([v, l]) => (
                    <button
                      key={v}
                      onClick={() => setUrgence(v)}
                      style={{
                        flex: 1, padding: '.4rem .5rem', fontSize: 11, cursor: 'pointer',
                        fontFamily: "'DM Sans', sans-serif", border: '.5px solid var(--border)',
                        background: urgence === v ? 'var(--bd)' : 'transparent',
                        color: urgence === v ? '#fff' : 'var(--inkm)',
                        transition: 'all .15s',
                      }}
                    >{l}</button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">VOTRE DEMANDE *</label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: 100, fontSize: 13, lineHeight: 1.6 }}
                  value={msg}
                  onChange={e => setMsg(e.target.value)}
                  placeholder="Décrivez votre problématique douanière avec le maximum de détails : type de marchandise, pays d'origine, valeur approximative, problème rencontré…"
                />
              </div>

              {erreurEnvoi && (
                <div style={{ color: '#DC2626', fontSize: 12, marginBottom: '.75rem' }}>{erreurEnvoi}</div>
              )}
              <button
                className="btn btn-primary"
                onClick={envoyerDemande}
                disabled={!nom || !email || !msg || envoiEnCours}
                style={{ opacity: (!nom || !email || !msg || envoiEnCours) ? .5 : 1 }}
              >
                {envoiEnCours ? 'Envoi en cours…' : 'Envoyer la demande'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── FAQ ── */}
      {onglet === 'faq' && (
        <div style={{ display: 'grid', gap: '.5rem', maxWidth: 720 }}>
          {FAQ_DATA.map((f, i) => (
            <div
              key={i}
              style={{ background: '#fff', border: '.5px solid var(--border)' }}
            >
              <div
                onClick={() => setFaqOuverte(faqOuverte === i ? null : i)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '1rem 1.25rem', cursor: 'pointer' }}
              >
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.5, flex: 1, paddingRight: '1rem' }}>{f.q}</div>
                <span style={{ color: 'var(--inkm)', flexShrink: 0, fontSize: 12 }}>{faqOuverte === i ? '▲' : '▼'}</span>
              </div>
              {faqOuverte === i && (
                <div style={{ padding: '0 1.25rem 1rem', fontSize: 13, color: 'var(--inks)', lineHeight: 1.7, borderTop: '.5px solid var(--border)' }}>
                  {f.r}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

    </ModuleLayout>
  )
}
