// pages/modules/veille-reglementaire.tsx
// Module VRG — Veille Réglementaire ADII + Guide LF 2026
// M-29 : Alertes temps réel · M-31 : Loi de Finances 2026

import { useState } from 'react'
import ModuleLayout from '../../components/ModuleLayout'

// ── Données LF 2026 confirmées (Circulaire ADII N°6702/210 du 26/12/2025) ────

const LF2026_MESURES = [
  {
    id: 'art19bis',
    titre: 'Article 19 bis — Destination des marchandises',
    badge: 'CRITIQUE',
    badgeColor: '#991B1B',
    badgeBg: '#FEE2E2',
    ref: 'Art. 19 bis CDII — LF n°50-25 — Dahir 10/12/2025 — BO n°7465 bis',
    resume: "Toute déclaration en détail doit désormais mentionner explicitement l'adresse complète du lieu de stockage ou de transformation des marchandises importées.",
    avant: `Adresse de destination non obligatoire dans la DUM — pratique variable selon le bureau`,
    apres: `Champ obligatoire : numéro, rue, zone industrielle, ville — adresse exhaustive et vérifiable`,
    amende: `30 000 à 60 000 DH par déclaration litigieuse`,
    infraction: '3ème degré',
    alertatm: "L'ATADM a alerté ses membres : entrée en vigueur sans période transitoire au 1er janvier 2026.",
    actions: [
      "Vérifier que chaque DUM inclut l'adresse complète du dépôt ou entrepôt de destination",
      "Mettre à jour les modèles de déclaration dans votre logiciel de transit",
      "Former les déclarants sur la nouvelle rubrique et ses exigences",
      "Établir un registre des adresses de stockage pour chaque importateur client",
    ],
  },
  {
    id: 'paiement',
    titre: 'Paiement électronique obligatoire des droits et taxes',
    badge: 'EN VIGUEUR',
    badgeColor: '#92400E',
    badgeBg: '#FEF3C7',
    ref: 'Art. 13-1°, 35-1°, 282 CDII modifiés — LF 2026',
    resume: `Le règlement des droits de douane, TVA et taxes annexes doit obligatoirement s\'effectuer par voie électronique via BADR. Les règlements manuels au guichet ne sont plus admis pour les opérateurs réguliers.`,
    avant: `Paiement possible au guichet (chèque, virement manuel, espèces selon montant)`,
    apres: `Paiement électronique exclusif via BADR — virement bancaire ou débit direct compte domicilié`,
    amende: `Blocage de la mainlevée + pénalités de retard`,
    infraction: 'Retard de dédouanement',
    alertatm: `Les opérateurs sans compte bancaire domicilié auprès d\'une banque partenaire BADR doivent régulariser leur situation.`,
    actions: [
      'Vérifier que votre compte bancaire est bien activé pour les paiements BADR',
      'Négocier avec votre banque une ligne de crédit documentaire dédiée aux droits douaniers',
      'Prévoir une procuration bancaire pour les paiements urgents hors heures ouvrables',
    ],
  },
  {
    id: 'blockchain',
    titre: 'Authentification blockchain des factures d\'importation',
    badge: 'NOUVEAU',
    badgeColor: '#1E40AF',
    badgeBg: '#DBEAFE',
    ref: 'LF 2026 — Dispositions de modernisation numérique douanière',
    resume: `Les factures commerciales présentées à l\'appui des déclarations en détail doivent être authentifiées par un mécanisme de blockchain ou signature électronique certifiée reconnu par l\'ADII.`,
    avant: `Facture papier ou scan PDF acceptés sans authentification cryptographique`,
    apres: `Facture avec empreinte blockchain ou signature électronique certifiée — traçabilité end-to-end`,
    amende: `Document non conforme = rejet automatique de la DUM`,
    infraction: 'Document non authentifié',
    alertatm: `Les fournisseurs étrangers doivent être informés de cette nouvelle exigence documentaire marocaine.`,
    actions: [
      'Informer vos fournisseurs internationaux des nouvelles exigences documentaires',
      'Vérifier si votre transitaire dispose d\'un outil de signature électronique certifié',
      'Consulter l\'ADII pour la liste des mécanismes d\'authentification acceptés',
    ],
  },
  {
    id: 'tarif',
    titre: 'Restructuration tarifaire — Chapitres pharmaceutiques & stratégiques',
    badge: 'TARIFAIRE',
    badgeColor: '#166534',
    badgeBg: '#DCFCE7',
    ref: 'Art. 4 LF 2026 — Circulaire ADII N°6702/210 du 26/12/2025',
    resume: "Poursuite de la restructuration du chapitre 30 (produits pharmaceutiques) avec des taux DI allant de 2,5% à 30% selon le niveau de production locale. Ajustements sur les chapitres bois, matières premières industrielles.",
    avant: `Taux uniformes par position — produits pharmaceutiques : taux unique`,
    apres: `Taux différenciés selon production locale : 2,5% (totalement importé), 30% (production locale exclusive)`,
    amende: `Erreur de taux = redressement + pénalités de droit commun`,
    infraction: 'Fausse déclaration de taux',
    alertatm: `Vérifier impérativement les taux applicables en 2026 avant toute importation des chapitres concernés.`,
    actions: [
      'Mettre à jour la base tarifaire dans vos logiciels de calcul de droits',
      'Vérifier les codes SH impactés dans vos opérations récurrentes',
      'Consulter la Circulaire ADII N°6702/210 pour la liste complète des positions modifiées',
    ],
  },
]

const ALERTES_SIMULEES = [
  {
    id: 1,
    date: '11 Avril 2026',
    source: 'ADII — adil.gov.ma',
    type: 'Circulaire',
    typeColor: '#1E40AF',
    typeBg: '#DBEAFE',
    titre: 'Circulaire N°6712/315 — Modalités d\'application Art. 19 bis : liste des codes rubrique BADR',
    resume: `Précisions sur la saisie du nouveau champ "adresse de stockage" dans le formulaire BADR — codes rubriques et format attendu.`,
    urgent: true,
  },
  {
    id: 2,
    date: '08 Avril 2026',
    source: 'Journal Officiel BO n°7501',
    type: 'Arrêté',
    typeColor: '#92400E',
    typeBg: '#FEF3C7',
    titre: 'Arrêté du Ministre des Finances — Actualisation des taux DI chapitre 84 (machines industrielles)',
    resume: `Modification des taux d\'importation applicables à certaines sous-positions du chapitre 84 dans le cadre des accords de libre-échange.`,
    urgent: false,
  },
  {
    id: 3,
    date: '05 Avril 2026',
    source: 'ADII — Note de service',
    type: 'Note interne',
    typeColor: '#166534',
    typeBg: '#DCFCE7',
    titre: 'Mise à jour de la liste des équipements ANRT dispensés d\'autorisation dans BADR',
    resume: `Extension de la liste des équipements télécoms pour lesquels l\'autorisation ANRT est intégrée directement dans BADR (suite circulaire conjointe oct. 2025).`,
    urgent: false,
  },
  {
    id: 4,
    date: '02 Avril 2026',
    source: 'PortNet — Communiqué',
    type: 'PortNet',
    typeColor: '#166534',
    typeBg: '#DCFCE7',
    titre: 'Maintenance programmée PortNet — Fenêtre 03/04 02h00-06h00',
    resume: `Indisponibilité partielle du guichet unique pour maintenance. Les formalités urgentes doivent être déposées avant 01h30.`,
    urgent: false,
  },
  {
    id: 5,
    date: '28 Mars 2026',
    source: 'ADII — Circulaire',
    type: 'Circulaire',
    typeColor: '#1E40AF',
    typeBg: '#DBEAFE',
    titre: 'Circulaire N°6709/210 — Suspension temporaire DI sur bovins et camélidés vivants (contingent 2026)',
    resume: `Suspension de la perception du droit d\'importation applicable aux bovins (300 000 têtes) et camélidés (10 000 têtes) du 1er janvier au 31 décembre 2026 — Art. bis LF 2026.`,
    urgent: false,
  },
]

const DOMAINES = [
  'Tous domaines', 'Tarification', 'Procédures déclaratives', 'Régimes économiques',
  'TVA & Fiscalité', 'ONSSA / Contrôles', 'ANRT / Télécoms', 'PortNet', 'Contentieux',
]

const CHECKLIST_ITEMS = [
  { id: 'c1', q: 'Mon logiciel de transit inclut-il le champ "adresse de stockage" dans la DUM ?', risk: 'Art. 19 bis — Amende 30-60K DH' },
  { id: 'c2', q: 'Mon compte bancaire est-il activé pour les paiements électroniques BADR ?', risk: 'Blocage mainlevée' },
  { id: 'c3', q: 'Mes fournisseurs sont-ils informés de l\'obligation d\'authentification des factures ?', risk: 'Rejet DUM' },
  { id: 'c4', q: 'Ai-je vérifié les taux DI 2026 pour les produits pharmaceutiques (chap. 30) ?', risk: 'Redressement fiscal' },
  { id: 'c5', q: 'Mes déclarants ont-ils été formés aux changements LF 2026 ?', risk: 'Erreurs récurrentes' },
  { id: 'c6', q: 'Le registre des adresses de stockage de mes clients est-il à jour ?', risk: 'Art. 19 bis' },
]

// ── Composant principal ───────────────────────────────────────────────────────

export default function VeilleReglementaire() {
  const [tab, setTab] = useState<'alertes'|'lf2026'|'checklist'>('alertes')
  const [domaine, setDomaine] = useState('Tous domaines')
  const [openMesure, setOpenMesure] = useState<string|null>('art19bis')
  const [checks, setChecks] = useState<Record<string,boolean>>({})
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const toggle = (id: string) => setChecks(p => ({ ...p, [id]: !p[id] }))
  const checkedCount = Object.values(checks).filter(Boolean).length
  const scoreConformite = Math.round((checkedCount / CHECKLIST_ITEMS.length) * 100)

  return (
    <ModuleLayout
      kicker="MODULE VRG — M-29 · M-31"
      title="Veille Réglementaire & LF 2026"
      sub="Alertes ADII en temps réel · Guide complet Loi de Finances 2026 · Checklist de conformité · Analyse d'impact pour transitaires et importateurs"
    >
      {/* ── STATS ─────────────────────────────────────────────────────────── */}
      <div className="info-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="istat" data-protected>
          <div className="istat-n">5</div>
          <div className="istat-l">Nouvelles circulaires<br/>ce mois</div>
        </div>
        <div className="istat" data-protected>
          <div className="istat-n" style={{ color: '#991B1B' }}>4</div>
          <div className="istat-l">Mesures LF 2026<br/>impactant l'import</div>
        </div>
        <div className="istat" data-protected>
          <div className="istat-n">60 000</div>
          <div className="istat-l">DH max d'amende<br/>Art. 19 bis par DUM</div>
        </div>
      </div>

      {/* ── TABS ──────────────────────────────────────────────────────────── */}
      <div className="tabs">
        <button className={`tab ${tab === 'alertes' ? 'active' : ''}`} onClick={() => setTab('alertes')}>
          Alertes réglementaires
        </button>
        <button className={`tab ${tab === 'lf2026' ? 'active' : ''}`} onClick={() => setTab('lf2026')}>
          Guide LF 2026
        </button>
        <button className={`tab ${tab === 'checklist' ? 'active' : ''}`} onClick={() => setTab('checklist')}>
          Checklist conformité
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 1 — ALERTES */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'alertes' && (
        <div data-protected>
          <div className="alert alert-info" style={{ marginBottom: '1.25rem' }}>
            Alertes issues des sources officielles ADII, Journal Officiel, PortNet et Office des Changes.
            Mise à jour quotidienne — Abonnez-vous pour recevoir les alertes par email.
          </div>

          {/* Filtre + Abonnement */}
          <div style={{ display: 'flex', gap: '.75rem', marginBottom: '1.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 180 }}>
              <label className="form-label">Filtrer par domaine</label>
              <select className="form-select" value={domaine} onChange={e => setDomaine(e.target.value)}>
                {DOMAINES.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0, flex: 2, minWidth: 220 }}>
              <label className="form-label">Recevoir les alertes par email</label>
              <div style={{ display: 'flex', gap: '.5rem' }}>
                <input
                  className="form-input"
                  type="email"
                  placeholder="votre@email.ma"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  className="btn btn-primary"
                  onClick={() => { if (email) setSubscribed(true) }}
                >
                  {subscribed ? '✓ Abonné' : "S'abonner"}
                </button>
              </div>
            </div>
          </div>

          {/* Liste des alertes */}
          {ALERTES_SIMULEES.map(a => (
            <div key={a.id} style={{
              border: `.5px solid ${a.urgent ? '#DC2626' : 'var(--rule)'}`,
              borderLeft: `4px solid ${a.urgent ? '#DC2626' : 'var(--ba)'}`,
              marginBottom: 8,
              padding: '1rem 1.25rem',
              background: '#FFFFFF',
              position: 'relative',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, padding: '2px 8px', background: a.typeBg, color: a.typeColor, letterSpacing: '.06em', fontWeight: 500 }}>
                  {a.type}
                </span>
                {a.urgent && (
                  <span style={{ fontSize: 10, padding: '2px 8px', background: '#FEE2E2', color: '#991B1B', fontWeight: 600, letterSpacing: '.06em' }}>
                    URGENT
                  </span>
                )}
                <span style={{ fontSize: 11, color: 'var(--inkm)', marginLeft: 'auto' }}>{a.date}</span>
                <span style={{ fontSize: 11, color: 'var(--inkm)' }}>· {a.source}</span>
              </div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 500, color: 'var(--bd)', marginBottom: 4 }}>
                {a.titre}
              </div>
              <div style={{ fontSize: 12, color: 'var(--inks)', lineHeight: 1.55 }}>{a.resume}</div>
            </div>
          ))}

          <div style={{ textAlign: 'center', padding: '1rem', fontSize: 12, color: 'var(--inkm)', borderTop: '.5px solid var(--rule)' }}>
            Données illustratives — Module connecté aux flux ADII en version production
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 2 — GUIDE LF 2026 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'lf2026' && (
        <div data-protected>
          <div className="alert alert-warn" style={{ marginBottom: '1.5rem' }}>
            <strong>Loi de Finances n°50-25 — Promulguée par Dahir du 10 décembre 2025 — BO n°7465 bis.</strong>
            {' '}Toutes les mesures ci-dessous sont en vigueur depuis le 1er janvier 2026 sans période transitoire.
          </div>

          {/* Source principale */}
          <div style={{
            background: 'var(--bl)',
            border: '1px solid var(--ba)',
            padding: '.75rem 1rem',
            marginBottom: '1.5rem',
            fontSize: 12,
            color: 'var(--bm)',
          }}>
            <strong>Source officielle :</strong> Circulaire ADII N°6702/210 du 26/12/2025 — Dispositions douanières LF 2026.
            Référence législative : Loi n°50-25, Dahir n°1-25-67, publié au BO n°7465 bis du 16 décembre 2025.
          </div>

          {/* Accordéon mesures */}
          {LF2026_MESURES.map(m => (
            <div key={m.id} style={{
              border: `.5px solid ${openMesure === m.id ? 'var(--ba)' : 'var(--rule)'}`,
              marginBottom: 8,
              background: '#FFFFFF',
            }}>
              <button
                onClick={() => setOpenMesure(openMesure === m.id ? null : m.id)}
                style={{
                  width: '100%', textAlign: 'left', border: 'none',
                  padding: '.875rem 1.25rem', cursor: 'pointer',
                  background: openMesure === m.id ? 'var(--bl)' : 'transparent',
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  transition: 'background .12s',
                }}
              >
                <span style={{ fontSize: 10, padding: '2px 8px', background: m.badgeBg, color: m.badgeColor, fontWeight: 600, letterSpacing: '.06em', flexShrink: 0 }}>
                  {m.badge}
                </span>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 500, color: 'var(--bd)', flex: 1, textAlign: 'left' }}>
                  {m.titre}
                </span>
                <span style={{ fontSize: 16, color: 'var(--ba)', flexShrink: 0 }}>
                  {openMesure === m.id ? '−' : '+'}
                </span>
              </button>

              {openMesure === m.id && (
                <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '.5px solid var(--rule)' }}>
                  <div style={{ fontSize: 11, color: 'var(--inkm)', margin: '.75rem 0 .5rem', fontStyle: 'italic' }}>
                    Réf. : {m.ref}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--inks)', lineHeight: 1.6, marginBottom: '1rem' }}>
                    {m.resume}
                  </p>

                  {/* Avant / Après */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem', marginBottom: '1rem' }}>
                    <div style={{ background: '#FEF2F2', padding: '.75rem', border: '.5px solid #FECACA' }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#991B1B', letterSpacing: '.08em', marginBottom: 4 }}>AVANT LF 2026</div>
                      <div style={{ fontSize: 12, color: 'var(--inks)', lineHeight: 1.5 }}>{m.avant}</div>
                    </div>
                    <div style={{ background: '#F0FDF4', padding: '.75rem', border: '.5px solid #BBF7D0' }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#166534', letterSpacing: '.08em', marginBottom: 4 }}>DEPUIS 2026</div>
                      <div style={{ fontSize: 12, color: 'var(--inks)', lineHeight: 1.5 }}>{m.apres}</div>
                    </div>
                  </div>

                  {/* Sanctions */}
                  <div style={{ background: '#FEF3C7', border: '.5px solid #FDE68A', padding: '.75rem', marginBottom: '1rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#92400E', letterSpacing: '.06em', marginBottom: 2 }}>SANCTION</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#92400E' }}>{m.amende}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#92400E', letterSpacing: '.06em', marginBottom: 2 }}>QUALIFICATION</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#92400E' }}>{m.infraction}</div>
                    </div>
                  </div>

                  {/* Alerte ATADM */}
                  <div style={{ background: 'var(--bl)', border: '.5px solid var(--ba)', padding: '.625rem 1rem', marginBottom: '1rem', fontSize: 12, color: 'var(--bm)' }}>
                    <strong>Note professionnelle :</strong> {m.alertatm}
                  </div>

                  {/* Actions */}
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--bd)', marginBottom: 6, letterSpacing: '.04em' }}>
                    ACTIONS REQUISES
                  </div>
                  {m.actions.map((a, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4, alignItems: 'flex-start' }}>
                      <div style={{ width: 20, height: 20, background: 'var(--bd)', color: 'white', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                        {i + 1}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--inks)', lineHeight: 1.5 }}>{a}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 3 — CHECKLIST */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'checklist' && (
        <div data-protected>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: scoreConformite >= 80 ? '#DCFCE7' : scoreConformite >= 50 ? '#FEF3C7' : '#FEE2E2', padding: '1.25rem', textAlign: 'center', border: '.5px solid var(--rule)' }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700, color: scoreConformite >= 80 ? '#166534' : scoreConformite >= 50 ? '#92400E' : '#991B1B' }}>
                {scoreConformite}%
              </div>
              <div style={{ fontSize: 12, color: 'var(--inks)', marginTop: 4 }}>
                Score de conformité LF 2026
              </div>
              <div style={{ fontSize: 11, color: 'var(--inkm)', marginTop: 2 }}>
                {checkedCount} / {CHECKLIST_ITEMS.length} critères validés
              </div>
            </div>
            <div style={{ background: 'var(--bl)', padding: '1.25rem', border: '.5px solid var(--rule)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--bd)', marginBottom: 8, letterSpacing: '.04em' }}>VOTRE SITUATION</div>
              {scoreConformite === 100 && <p style={{ fontSize: 13, color: '#166534' }}>✓ Toutes les exigences LF 2026 sont satisfaites. Continuez à surveiller les nouvelles circulaires.</p>}
              {scoreConformite >= 50 && scoreConformite < 100 && <p style={{ fontSize: 13, color: '#92400E' }}>⚠ Des points de conformité restent à traiter. Priorité aux éléments non cochés.</p>}
              {scoreConformite < 50 && <p style={{ fontSize: 13, color: '#991B1B' }}>✗ Risque élevé de non-conformité. Des actions immédiates sont nécessaires.</p>}
            </div>
          </div>

          {CHECKLIST_ITEMS.map(item => (
            <div key={item.id} style={{
              border: `.5px solid ${checks[item.id] ? '#BBF7D0' : 'var(--rule)'}`,
              marginBottom: 6,
              padding: '.875rem 1.25rem',
              background: checks[item.id] ? '#F0FDF4' : '#FFFFFF',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
              transition: 'all .15s',
              cursor: 'pointer',
            }} onClick={() => toggle(item.id)}>
              <div style={{
                width: 22, height: 22, border: `1.5px solid ${checks[item.id] ? '#059669' : 'var(--rule)'}`,
                background: checks[item.id] ? '#059669' : 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, marginTop: 1, fontSize: 12, color: 'white',
              }}>
                {checks[item.id] ? '✓' : ''}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.5 }}>{item.q}</div>
                <div style={{ fontSize: 11, color: 'var(--inkm)', marginTop: 3 }}>Risque si non conforme : {item.risk}</div>
              </div>
            </div>
          ))}

          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bl)', border: '.5px solid var(--rule)', fontSize: 12, color: 'var(--inks)' }}>
            Cette checklist est fournie à titre indicatif et ne constitue pas un avis juridique. Pour une conformité complète, consultez la Circulaire ADII N°6702/210 du 26/12/2025 et le texte de la LF n°50-25.
          </div>
        </div>
      )}
    </ModuleLayout>
  )
}
