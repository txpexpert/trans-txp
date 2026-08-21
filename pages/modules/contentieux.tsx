import { useState } from 'react'
import Link from 'next/link'
import ModuleLayout from '../../components/ModuleLayout'

// ── Types ─────────────────────────────────────────────────────────────────────
type Onglet = 'infractions' | 'recours' | 'transaction' | 'juridiction' | 'simulateur'

interface Infraction {
  code: string
  libelle: string
  categorie: 'contrebande' | 'fausse-declaration' | 'irregularite' | 'fraude'
  sanction: string
  penalite: string
  prescription: string
}

interface EtapeRecours {
  etape: number
  titre: string
  delai: string
  autorite: string
  pieces: string[]
  conseil: string
}

// ── Données ───────────────────────────────────────────────────────────────────
const INFRACTIONS: Infraction[] = [
  {
    code: 'ART-281',
    libelle: 'Contrebande simple',
    categorie: 'contrebande',
    sanction: 'Confiscation + amende',
    penalite: '2× à 5× la valeur des marchandises',
    prescription: '5 ans',
  },
  {
    code: 'ART-282',
    libelle: 'Contrebande qualifiée (bande organisée)',
    categorie: 'contrebande',
    sanction: 'Confiscation + amende + emprisonnement',
    penalite: '5× à 10× la valeur + 1 à 5 ans prison',
    prescription: '10 ans',
  },
  {
    code: 'ART-285',
    libelle: 'Fausse déclaration en valeur',
    categorie: 'fausse-declaration',
    sanction: 'Amende + rappel de droits',
    penalite: '100% à 300% des droits éludés',
    prescription: '4 ans',
  },
  {
    code: 'ART-286',
    libelle: 'Fausse déclaration d\'espèce (classement)',
    categorie: 'fausse-declaration',
    sanction: 'Amende + rappel de droits',
    penalite: '50% à 200% des droits éludés',
    prescription: '4 ans',
  },
  {
    code: 'ART-287',
    libelle: 'Fausse déclaration d\'origine',
    categorie: 'fausse-declaration',
    sanction: 'Amende + confiscation possible',
    penalite: '100% des droits éludés + pénalités ALE',
    prescription: '4 ans',
  },
  {
    code: 'ART-289',
    libelle: 'Irrégularité de transit (T1)',
    categorie: 'irregularite',
    sanction: 'Mise en demeure + amende',
    penalite: '10% à 50% des droits en jeu',
    prescription: '3 ans',
  },
  {
    code: 'ART-291',
    libelle: 'Non-apurement régime économique',
    categorie: 'irregularite',
    sanction: 'Rappel droits suspendus + pénalités',
    penalite: '25% à 100% des droits + intérêts de retard',
    prescription: '3 ans',
  },
  {
    code: 'ART-295',
    libelle: 'Fraude documentaire (faux documents)',
    categorie: 'fraude',
    sanction: 'Amende + poursuites pénales',
    penalite: '300% des droits + 2 à 5 ans prison',
    prescription: '10 ans',
  },
]

const ETAPES_RECOURS: EtapeRecours[] = [
  {
    etape: 1,
    titre: 'Recours gracieux — Directeur régional',
    delai: '30 jours à compter de la notification',
    autorite: 'Directeur régional ADII compétent',
    pieces: [
      'Lettre de recours motivée (en arabe ou français)',
      'Copie de la DUM ou décision contestée',
      'Justificatifs de valeur / classement / origine',
      'Procuration si représenté par un transitaire',
    ],
    conseil: 'Délai court — agir dès réception de la notification. Joindre tous les justificatifs dès le premier envoi.',
  },
  {
    etape: 2,
    titre: 'Recours hiérarchique — Direction des douanes',
    delai: '60 jours après réponse défavorable ou silence (45 j)',
    autorite: 'Direction Générale ADII — Division juridique',
    pieces: [
      'Décision de rejet du recours gracieux',
      'Mémoire de contestation détaillé',
      'Ensemble des pièces du dossier initial',
      'Éventuels expertises ou avis techniques',
    ],
    conseil: 'Rédiger un mémoire structuré : faits, moyens de droit, demande. Citer les textes (CDDE, circulaires).',
  },
  {
    etape: 3,
    titre: 'Transaction douanière',
    delai: 'À tout moment avant jugement définitif',
    autorite: 'Service contentieux ADII — directeur régional',
    pieces: [
      'Demande de transaction écrite',
      'Proposition de règlement amiable',
      'Garanties de paiement si nécessaire',
    ],
    conseil: 'Option souvent sous-utilisée. Permet d\'éviter les poursuites pénales contre paiement d\'une fraction des pénalités.',
  },
  {
    etape: 4,
    titre: 'Tribunal administratif',
    delai: '90 jours après épuisement des recours administratifs',
    autorite: 'Tribunal administratif territorialement compétent',
    pieces: [
      'Requête introductive d\'instance',
      'Dossier complet de réclamation administrative',
      'Décisions de rejet ADII',
      'Représentation par avocat (recommandée)',
    ],
    conseil: 'Recours contentieux coûteux et long (18–36 mois). À envisager pour des enjeux significatifs uniquement.',
  },
  {
    etape: 5,
    titre: 'Cour d\'appel administrative',
    delai: '30 jours après jugement de première instance',
    autorite: 'Cour d\'appel administrative',
    pieces: [
      'Mémoire d\'appel motivé',
      'Jugement de première instance',
      'Représentation obligatoire par avocat',
    ],
    conseil: 'Dernier recours judiciaire avant cassation. Taux d\'infirmation faible — bien peser l\'opportunité.',
  },
]

const BAREMES_TRANSACTION = [
  { profil: 'Première infraction, bonne foi établie', reduction: '50%–70%', condition: 'Paiement immédiat + engagement' },
  { profil: 'Récidive, bonne foi partielle', reduction: '20%–40%', condition: 'Garanties bancaires + calendrier' },
  { profil: 'Infraction grave / fraude documentaire', reduction: '0%–15%', condition: 'Cas par cas — décision DG' },
  { profil: 'Régularisation spontanée avant contrôle', reduction: '60%–80%', condition: 'Déclaration volontaire + paiement' },
]

const CAT_COLORS: Record<string, string> = {
  contrebande: '#FEF2F2',
  'fausse-declaration': '#FFF7ED',
  irregularite: '#FFFBEB',
  fraude: '#FDF4FF',
}
const CAT_TEXT: Record<string, string> = {
  contrebande: '#991B1B',
  'fausse-declaration': '#9A3412',
  irregularite: '#92400E',
  fraude: '#6B21A8',
}
const CAT_LABEL: Record<string, string> = {
  contrebande: 'Contrebande',
  'fausse-declaration': 'Fausse déclaration',
  irregularite: 'Irrégularité',
  fraude: 'Fraude',
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function Contentieux() {
  const [onglet, setOnglet] = useState<Onglet>('infractions')
  const [filtreCategorie, setFiltreCategorie] = useState<string>('tous')
  const [selectedInfraction, setSelectedInfraction] = useState<Infraction | null>(null)

  // Simulateur transaction
  const [montantDroits, setMontantDroits] = useState('')
  const [typeInfraction, setTypeInfraction] = useState('fausse-declaration')
  const [premiereFois, setPremiereFois] = useState(true)
  const [spontanee, setSpontanee] = useState(false)
  const [valeurMarchandises, setValeurMarchandises] = useState('')

  const calcTransaction = () => {
    const base = parseFloat(montantDroits) || 0
    const valMarch = parseFloat(valeurMarchandises) || 0

    let taux = 1.0
    if (spontanee) taux = 0.25
    // Fraude/contrebande grave : 0%-15% de réduction seulement (barème ci-dessus),
    // pas le plafond générique de 80% appliqué par erreur aux autres récidives.
    else if (typeInfraction === 'fraude' || typeInfraction === 'contrebande') taux = premiereFois ? 0.85 : 0.95
    else if (premiereFois) taux = 0.4
    else taux = 0.8

    // Contrebande : pénalité assise sur la VALEUR DES MARCHANDISES (Art.281/282),
    // pas sur les droits éludés — base différente de toutes les autres catégories.
    const estContrebande = typeInfraction === 'contrebande'
    const baseCalcul = estContrebande ? valMarch : base
    const multiplicateur = typeInfraction === 'fausse-declaration' ? 2
      : typeInfraction === 'contrebande' ? 5
      : typeInfraction === 'fraude' ? 3
      : 1

    return {
      penaliteBase: baseCalcul * multiplicateur,
      apresTransaction: baseCalcul * taux,
      economie: baseCalcul * multiplicateur - baseCalcul * taux,
    }
  }

  const infraFiltrees = filtreCategorie === 'tous'
    ? INFRACTIONS
    : INFRACTIONS.filter(i => i.categorie === filtreCategorie)

  const ONGLETS: { id: Onglet; label: string }[] = [
    { id: 'infractions', label: 'Infractions & Barèmes' },
    { id: 'recours', label: 'Procédure de recours' },
    { id: 'transaction', label: 'Transaction douanière' },
    { id: 'juridiction', label: 'Recours juridictionnel' },
    { id: 'simulateur', label: 'Simulateur pénalités' },
  ]

  return (
    <ModuleLayout
      kicker="MODULE 09"
      title="Contentieux & Litiges"
      sub="Infractions douanières, procédures de recours, transactions et voies juridictionnelles — droit marocain (CDDE 2024)."
    >

      {/* ALERTE DISCLAIMER */}
      <div className="alert alert-warn" style={{ marginBottom: '1.5rem' }}>
        ⚖️ Informations à titre indicatif fondées sur le Code des Douanes et Impôts Indirects (CDDE). Pour tout litige, consultez un expert douanier agréé ou un avocat spécialisé.
      </div>

      {/* NAVIGATION ONGLETS */}
      <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1.75rem', borderBottom: '.5px solid var(--border)', paddingBottom: '0' }}>
        {ONGLETS.map(o => (
          <button
            key={o.id}
            onClick={() => setOnglet(o.id)}
            style={{
              padding: '.5rem 1rem',
              fontSize: 12,
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500,
              letterSpacing: '.04em',
              border: 'none',
              borderBottom: onglet === o.id ? '2px solid var(--gold)' : '2px solid transparent',
              background: 'transparent',
              color: onglet === o.id ? 'var(--bd)' : 'var(--inkm)',
              cursor: 'pointer',
              marginBottom: '-1px',
              transition: 'all .15s',
            }}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* ── ONGLET : INFRACTIONS ── */}
      {onglet === 'infractions' && (
        <div>
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            {['tous', 'contrebande', 'fausse-declaration', 'irregularite', 'fraude'].map(cat => (
              <button
                key={cat}
                onClick={() => setFiltreCategorie(cat)}
                style={{
                  padding: '4px 12px', fontSize: 11, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                  background: filtreCategorie === cat ? 'var(--bd)' : 'transparent',
                  color: filtreCategorie === cat ? '#fff' : 'var(--inkm)',
                  border: '.5px solid var(--border)',
                  transition: 'all .15s',
                }}
              >
                {cat === 'tous' ? 'Toutes' : CAT_LABEL[cat]}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gap: '.75rem' }}>
            {infraFiltrees.map(inf => (
              <div
                key={inf.code}
                onClick={() => setSelectedInfraction(selectedInfraction?.code === inf.code ? null : inf)}
                style={{
                  background: '#fff',
                  border: '.5px solid var(--border)',
                  borderLeft: `3px solid ${CAT_TEXT[inf.categorie]}`,
                  cursor: 'pointer',
                  transition: 'box-shadow .15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.85rem 1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--inkm)', flexShrink: 0 }}>{inf.code}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{inf.libelle}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', flexShrink: 0 }}>
                    <span style={{
                      fontSize: 10, padding: '2px 8px', letterSpacing: '.06em',
                      background: CAT_COLORS[inf.categorie], color: CAT_TEXT[inf.categorie],
                    }}>{CAT_LABEL[inf.categorie]}</span>
                    <span style={{ fontSize: 11, color: 'var(--inkm)' }}>{selectedInfraction?.code === inf.code ? '▲' : '▼'}</span>
                  </div>
                </div>
                {selectedInfraction?.code === inf.code && (
                  <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '.5px solid var(--border)', marginTop: 0 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                      <div>
                        <div style={{ fontSize: 10, letterSpacing: '.1em', color: 'var(--inkm)', marginBottom: 4 }}>SANCTION</div>
                        <div style={{ fontSize: 12, color: 'var(--ink)' }}>{inf.sanction}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, letterSpacing: '.1em', color: 'var(--inkm)', marginBottom: 4 }}>PÉNALITÉ</div>
                        <div style={{ fontSize: 12, color: 'var(--ink)', fontWeight: 500 }}>{inf.penalite}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, letterSpacing: '.1em', color: 'var(--inkm)', marginBottom: 4 }}>PRESCRIPTION</div>
                        <div style={{ fontSize: 12, color: 'var(--ink)' }}>{inf.prescription}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ONGLET : RECOURS ── */}
      {onglet === 'recours' && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {ETAPES_RECOURS.slice(0, 2).map(e => (
            <div key={e.etape} style={{ background: '#fff', border: '.5px solid var(--border)', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{
                  width: 36, height: 36, background: 'var(--bd)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Playfair Display', serif", fontSize: 16, flexShrink: 0,
                }}>{e.etape}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)', marginBottom: 4 }}>{e.titre}</div>
                  <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '.75rem' }}>
                    <span style={{ fontSize: 11, color: 'var(--inkm)' }}>⏱ {e.delai}</span>
                    <span style={{ fontSize: 11, color: 'var(--inkm)' }}>🏛 {e.autorite}</span>
                  </div>
                  <div style={{ fontSize: 11, letterSpacing: '.07em', color: 'var(--ba)', marginBottom: '.5rem' }}>PIÈCES REQUISES</div>
                  <ul style={{ paddingLeft: '1rem', display: 'grid', gap: '.25rem' }}>
                    {e.pieces.map(p => (
                      <li key={p} style={{ fontSize: 12, color: 'var(--inks)' }}>{p}</li>
                    ))}
                  </ul>
                  <div style={{ marginTop: '.75rem', padding: '.65rem .85rem', background: 'var(--gold-pale, #FBF5E6)', borderLeft: '2px solid var(--gold)', fontSize: 12, color: 'var(--bm)' }}>
                    💡 {e.conseil}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ONGLET : TRANSACTION ── */}
      {onglet === 'transaction' && (
        <div>
          <div style={{ background: '#fff', border: '.5px solid var(--border)', padding: '1.25rem', marginBottom: '1.25rem' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: 'var(--bd)', marginBottom: '.75rem' }}>
              Qu'est-ce que la transaction douanière ?
            </div>
            <p style={{ fontSize: 13, color: 'var(--inks)', lineHeight: 1.7, marginBottom: '.75rem' }}>
              La transaction douanière (art. 254 CDDE) est un accord amiable entre l'ADII et le contrevenant, permettant d'éteindre l'action douanière contre paiement d'une somme inférieure aux pénalités théoriques. Elle est possible à tout moment avant jugement définitif.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '.75rem', marginTop: '1rem' }}>
              {[
                ['Avantage', 'Évite les poursuites pénales et la publicité judiciaire'],
                ['Limite', 'Ne peut être accordée qu\'une fois pour le même type d\'infraction'],
                ['Compétence', 'Directeur régional (jusqu\'à 500k DH) · DG ADII au-delà'],
              ].map(([t, d]) => (
                <div key={t} style={{ padding: '.75rem', background: 'var(--bl)', border: '.5px solid var(--rule)' }}>
                  <div style={{ fontSize: 10, letterSpacing: '.08em', color: 'var(--ba)', marginBottom: 4 }}>{t}</div>
                  <div style={{ fontSize: 12, color: 'var(--inks)' }}>{d}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ fontSize: 11, letterSpacing: '.1em', color: 'var(--ba)', marginBottom: '.75rem' }}>BARÈMES INDICATIFS DE RÉDUCTION</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--bl)' }}>
                <th style={{ padding: '.6rem 1rem', textAlign: 'left', fontSize: 10, letterSpacing: '.08em', color: 'var(--inkm)', borderBottom: '.5px solid var(--border)' }}>PROFIL</th>
                <th style={{ padding: '.6rem 1rem', textAlign: 'center', fontSize: 10, letterSpacing: '.08em', color: 'var(--inkm)', borderBottom: '.5px solid var(--border)' }}>RÉDUCTION</th>
                <th style={{ padding: '.6rem 1rem', textAlign: 'left', fontSize: 10, letterSpacing: '.08em', color: 'var(--inkm)', borderBottom: '.5px solid var(--border)' }}>CONDITION</th>
              </tr>
            </thead>
            <tbody>
              {BAREMES_TRANSACTION.map(b => (
                <tr key={b.profil} style={{ borderBottom: '.5px solid var(--border)' }}>
                  <td style={{ padding: '.65rem 1rem', color: 'var(--inks)' }}>{b.profil}</td>
                  <td style={{ padding: '.65rem 1rem', textAlign: 'center', fontWeight: 600, color: 'var(--bd)', fontFamily: "'JetBrains Mono', monospace" }}>{b.reduction}</td>
                  <td style={{ padding: '.65rem 1rem', color: 'var(--inkm)' }}>{b.condition}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── ONGLET : JURIDICTION ── */}
      {onglet === 'juridiction' && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {ETAPES_RECOURS.slice(3).map(e => (
            <div key={e.etape} style={{ background: '#fff', border: '.5px solid var(--border)', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{
                  width: 36, height: 36, background: '#1D4ED8', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Playfair Display', serif", fontSize: 16, flexShrink: 0,
                }}>{e.etape}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)', marginBottom: 4 }}>{e.titre}</div>
                  <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '.75rem' }}>
                    <span style={{ fontSize: 11, color: 'var(--inkm)' }}>⏱ {e.delai}</span>
                    <span style={{ fontSize: 11, color: 'var(--inkm)' }}>🏛 {e.autorite}</span>
                  </div>
                  <ul style={{ paddingLeft: '1rem', display: 'grid', gap: '.25rem' }}>
                    {e.pieces.map(p => (
                      <li key={p} style={{ fontSize: 12, color: 'var(--inks)' }}>{p}</li>
                    ))}
                  </ul>
                  <div style={{ marginTop: '.75rem', padding: '.65rem .85rem', background: '#EFF6FF', borderLeft: '2px solid #1D4ED8', fontSize: 12, color: '#1E3A5F' }}>
                    ⚖️ {e.conseil}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ONGLET : SIMULATEUR ── */}
      {onglet === 'simulateur' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div style={{ background: '#fff', border: '.5px solid var(--border)', padding: '1.5rem' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: 'var(--bd)', marginBottom: '1.25rem' }}>
              Paramètres du dossier
            </div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">DROITS & TAXES ÉLUDÉS (DH)</label>
              <input
                className="form-input"
                type="number"
                placeholder="ex: 85000"
                value={montantDroits}
                onChange={e => setMontantDroits(e.target.value)}
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">TYPE D'INFRACTION</label>
              <select
                className="form-input"
                value={typeInfraction}
                onChange={e => setTypeInfraction(e.target.value)}
              >
                <option value="fausse-declaration">Fausse déclaration (×2)</option>
                <option value="contrebande">Contrebande (×5 — sur valeur marchandise)</option>
                <option value="fraude">Fraude documentaire (×3)</option>
                <option value="irregularite">Irrégularité (×1)</option>
              </select>
            </div>
            {typeInfraction === 'contrebande' && (
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">VALEUR DES MARCHANDISES (DH)</label>
                <input
                  className="form-input"
                  type="number"
                  placeholder="ex: 300000"
                  value={valeurMarchandises}
                  onChange={e => setValeurMarchandises(e.target.value)}
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                />
                <div style={{ fontSize: 11, color: 'var(--inkm)', marginTop: 4 }}>
                  Art. 281/282 — la pénalité de contrebande porte sur la valeur des marchandises, pas sur les droits éludés.
                </div>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={premiereFois} onChange={e => setPremiereFois(e.target.checked)} />
                Première infraction
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={spontanee} onChange={e => setSpontanee(e.target.checked)} />
                Régularisation spontanée
              </label>
            </div>
          </div>

          <div style={{ background: 'var(--bd)', padding: '1.5rem', color: '#fff' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, marginBottom: '1.25rem', color: 'var(--gold)' }}>
              Estimation pénalités
            </div>
            {(typeInfraction === 'contrebande' ? valeurMarchandises : montantDroits) ? (() => {
              const r = calcTransaction()
              return (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: '.1em', color: 'rgba(255,255,255,.5)', marginBottom: 4 }}>
                      {typeInfraction === 'contrebande' ? 'VALEUR DES MARCHANDISES' : 'DROITS ÉLUDÉS'}
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 500 }}>
                      {parseFloat(typeInfraction === 'contrebande' ? valeurMarchandises : montantDroits).toLocaleString('fr')} DH
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: '.1em', color: 'rgba(255,255,255,.5)', marginBottom: 4 }}>PÉNALITÉ THÉORIQUE</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, color: '#FCA5A5' }}>
                      {r.penaliteBase.toLocaleString('fr')} DH
                    </div>
                  </div>
                  <div style={{ borderTop: '.5px solid rgba(255,255,255,.15)', paddingTop: '1rem' }}>
                    <div style={{ fontSize: 10, letterSpacing: '.1em', color: 'rgba(255,255,255,.5)', marginBottom: 4 }}>APRÈS TRANSACTION ESTIMÉE</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 700, color: '#86EFAC' }}>
                      {r.apresTransaction.toLocaleString('fr')} DH
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', lineHeight: 1.5 }}>
                    Estimation indicative. Les montants réels sont fixés par l'ADII au cas par cas selon le dossier.
                  </div>
                </div>
              )
            })() : (
              <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 13, marginTop: '2rem' }}>
                Renseignez les paramètres pour estimer les pénalités.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── INVITATION EXPERTISE — absente de la version d'origine ── */}
      <div style={{
        marginTop: '2rem', background: 'var(--bd)', color: '#fff',
        padding: '1.75rem', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem',
      }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, marginBottom: '.4rem' }}>
            Un cas de contentieux spécifique ?
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', maxWidth: 480 }}>
            Ces barèmes et procédures sont indicatifs. Chaque dossier a ses particularités —
            posez votre situation directement, une réponse personnalisée sous 24 à 48h.
          </div>
        </div>
        <Link href="/modules/conseil" style={{
          background: '#fff', color: 'var(--bd)', padding: '.75rem 1.5rem',
          fontSize: 13, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap',
        }}>
          Poser ma question →
        </Link>
      </div>

    </ModuleLayout>
  )
}
