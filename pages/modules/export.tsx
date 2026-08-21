import { useState, useCallback } from 'react'
import Head from 'next/head'

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'ddp' | 'guide' | 'checklist' | 'incoterms'

interface PaysDDP {
  code: string
  nom: string
  flag: string
  devise: string
  tauxChange: number // vs MAD
  tauxDroit: number  // % moyen sur biens industriels
  tva: number
  taxeSup: number    // droits excise / autres en %
  labelTaxeSup: string
  transitDelay: string
  noteDouane: string
  accord: string     // accord commercial avec Maroc
}

interface SimDDP {
  paysCode: string
  fob: number
  fret: number
  assurance: number
  codeHS: string
  tauxDouane: number | null // override manuel
}

interface GuideItem {
  categorie: string
  items: string[]
}

// ─── Données pays ─────────────────────────────────────────────────────────────
const PAYS_LIST: PaysDDP[] = [
  {
    code: 'FR', nom: 'France', flag: '🇫🇷', devise: 'EUR', tauxChange: 10.85,
    tauxDroit: 3.5, tva: 20, taxeSup: 0, labelTaxeSup: '—',
    transitDelay: '2–4 jours', noteDouane: "Dédouanement UE, déclaration EN57 pour biens industriels. Certificat EUR.1 requis (accord Maroc-UE).",
    accord: 'Accord Maroc-UE (ALECA en cours)'
  },
  {
    code: 'ES', nom: 'Espagne', flag: '🇪🇸', devise: 'EUR', tauxChange: 10.85,
    tauxDroit: 3.5, tva: 21, taxeSup: 0, labelTaxeSup: '—',
    transitDelay: '1–2 jours', noteDouane: "Port Algésiras (principal). UE — même régime FR. Forte présence transitaires marocains.",
    accord: 'Accord Maroc-UE'
  },
  {
    code: 'IT', nom: 'Italie', flag: '🇮🇹', devise: 'EUR', tauxChange: 10.85,
    tauxDroit: 3.5, tva: 22, taxeSup: 0, labelTaxeSup: '—',
    transitDelay: '3–5 jours', noteDouane: "Ports Gênes / La Spezia. Contrôles phytosanitaires renforcés pour agro-alimentaire.",
    accord: 'Accord Maroc-UE'
  },
  {
    code: 'DE', nom: 'Allemagne', flag: '🇩🇪', devise: 'EUR', tauxChange: 10.85,
    tauxDroit: 3.5, tva: 19, taxeSup: 0, labelTaxeSup: '—',
    transitDelay: '4–6 jours', noteDouane: "Hambourg / Brême. Exigences qualité strictes (DIN/ISO). Déclaration EORI obligatoire.",
    accord: 'Accord Maroc-UE'
  },
  {
    code: 'NL', nom: 'Pays-Bas', flag: '🇳🇱', devise: 'EUR', tauxChange: 10.85,
    tauxDroit: 3.5, tva: 21, taxeSup: 0, labelTaxeSup: '—',
    transitDelay: '3–4 jours', noteDouane: "Rotterdam — hub mondial. Transit UE facilité. Port de transit vers Allemagne/Belgique.",
    accord: 'Accord Maroc-UE'
  },
  {
    code: 'GB', nom: 'Royaume-Uni', flag: '🇬🇧', devise: 'GBP', tauxChange: 13.40,
    tauxDroit: 4.0, tva: 20, taxeSup: 0, labelTaxeSup: '—',
    transitDelay: '3–5 jours', noteDouane: "Post-Brexit : déclaration GB douanes. Certificat origine Maroc-UK requis (accord AECG-UK). UKCA pour certains produits.",
    accord: 'Accord Maroc-UK (post-Brexit)'
  },
  {
    code: 'US', nom: 'États-Unis', flag: '🇺🇸', devise: 'USD', tauxChange: 9.95,
    tauxDroit: 3.5, tva: 0, taxeSup: 0.5, labelTaxeSup: 'Harbor Maintenance Fee',
    transitDelay: '7–14 jours', noteDouane: "CBP filing obligatoire. ISF 10+2 (maritime). Pas d'accord préférentiel — tarif MFN OMC. Possible droits anti-dumping selon secteur.",
    accord: 'GATT / MFN — pas d\'accord préférentiel'
  },
  {
    code: 'CA', nom: 'Canada', flag: '🇨🇦', devise: 'CAD', tauxChange: 7.20,
    tauxDroit: 3.0, tva: 5, taxeSup: 0, labelTaxeSup: '—',
    transitDelay: '10–16 jours', noteDouane: "CARM portal depuis 2024. Certificat origine requis. Droits anti-dumping sur textiles et acier. GST (5%) + PST provincial variable.",
    accord: 'GATT / MFN'
  },
  {
    code: 'SN', nom: 'Sénégal', flag: '🇸🇳', devise: 'XOF', tauxChange: 0.0165,
    tauxDroit: 20, tva: 18, taxeSup: 1.0, labelTaxeSup: 'Prélèvement communautaire CEDEAO',
    transitDelay: '10–18 jours', noteDouane: "TEC CEDEAO (4 bandes : 0/5/10/20%). Catégorie 4 pour biens finis = 20%. Accord ZLECAf applicable progressivement. Port Dakar.",
    accord: 'ZLECAf (en cours de mise en œuvre)'
  },
  {
    code: 'CI', nom: "Côte d'Ivoire", flag: '🇨🇮', devise: 'XOF', tauxChange: 0.0165,
    tauxDroit: 20, tva: 18, taxeSup: 2.5, labelTaxeSup: 'Taxe spéciale importation (TSI)',
    transitDelay: '12–20 jours', noteDouane: "TEC CEDEAO identique SN. Port d'Abidjan — hub Afrique de l'Ouest. Guichet unique SYDAM WORLD. ZLECAf en cours.",
    accord: 'ZLECAf (en cours)'
  },
  {
    code: 'AE', nom: 'Émirats Arabes Unis', flag: '🇦🇪', devise: 'AED', tauxChange: 2.71,
    tauxDroit: 5.0, tva: 5, taxeSup: 0, labelTaxeSup: '—',
    transitDelay: '4–7 jours', noteDouane: "TEC CCG 5% standard. VAT 5% depuis 2018. Hub réexport Dubaï (Jebel Ali). Accord de libre-échange Maroc-CCG signé.",
    accord: 'Accord Maroc-CCG'
  },
  {
    code: 'SA', nom: 'Arabie Saoudite', flag: '🇸🇦', devise: 'SAR', tauxChange: 2.65,
    tauxDroit: 5.0, tva: 15, taxeSup: 0, labelTaxeSup: '—',
    transitDelay: '5–9 jours', noteDouane: "VAT passée à 15% en 2020. Zakat & Tax Authority (ZATCA). Certificat Halal pour alimentaire. Accord Maroc-CCG applicable.",
    accord: 'Accord Maroc-CCG'
  },
]

// ─── Checklists par type de produit ───────────────────────────────────────────
const CHECKLISTS: Record<string, GuideItem[]> = {
  'Produits industriels': [
    { categorie: 'Documents de base', items: ['Facture commerciale (3 ex.)', 'Liste de colisage / Packing list', 'Certificat d\'origine Form A ou EUR.1', 'Déclaration export ADII (DAU)', 'Bill of Lading ou LTA', 'Assurance transport (police)'] },
    { categorie: 'Réglementation', items: ['Licences d\'exportation (si secteur contrôlé)', 'Certificat de conformité (si requis destination)', 'Rapport test laboratoire accrédité', 'Déclaration matières dangereuses (si applicable)'] },
    { categorie: 'Douane Maroc (ADII)', items: ['Domiciliation bancaire (si > 50 000 MAD)', 'Engagement de rapatriement des devises', 'Attestation TVA export (remboursement)', 'Numéro EORI si destination UE'] },
  ],
  'Agro-alimentaire': [
    { categorie: 'Documents de base', items: ['Facture commerciale', 'Certificat phytosanitaire (ONSSA)', 'Certificat sanitaire et vétérinaire', 'Certificat d\'origine EUR.1 / Form A', 'Déclaration DAU ADII'] },
    { categorie: 'Certifications', items: ['Certificat Halal (marchés arabes/islamiques)', 'Certificat BIO (si agriculture biologique)', 'Fiche technique produit', 'Étiquetage conforme marché destination', 'Analyse microbiologique lab agréé'] },
    { categorie: 'Contrôles ADII', items: ['Inspection ADII + ONSSA au départ', 'Engagement rapatriement devises', 'Domiciliation bancaire obligatoire', 'Visa contrôle qualité (secteurs prioritaires)'] },
  ],
  'Textile & Habillement': [
    { categorie: 'Documents de base', items: ['Facture commerciale détaillée', 'Packing list avec composition fibre', 'Certificat d\'origine EUR.1 (préférentiel UE)', 'Déclaration cumul diagonal (si applicable)', 'LTA / BL'] },
    { categorie: 'Conformité', items: ['Déclaration de conformité REACH (UE)', 'Test composition fibres (accrédité)', 'Étiquetage composition + entretien', 'Certificat anti-dumping (si requis)'] },
    { categorie: 'Divers', items: ['Carnet ATA (pour échantillons / foires)', 'Facture pro forma initiale', 'Contrat de vente signé', 'Incoterm clairement spécifié'] },
  ],
  'Phosphates & Chimie': [
    { categorie: 'Documents réglementaires', items: ['Autorisation export OCP / Ministère', 'Fiche de données sécurité (FDS/SDS)', 'Certificat d\'analyse chimique', 'Déclaration matières dangereuses IMO'] },
    { categorie: 'Transport', items: ['Manifeste de chargement', 'Plan d\'arrimage', 'Notice d\'urgence transport', 'Assurance RC transport spéciale'] },
    { categorie: 'ADII spécifique', items: ['Régime économique (si tranformation)', 'Autorisation OCP Group (exportateur agréé)', 'Licence quotas (si contingent)', 'Engagement export quantité'] },
  ],
}

// ─── Données Incoterms ─────────────────────────────────────────────────────────
const INCOTERMS = [
  { code: 'EXW', nom: 'Ex Works', risque: 'Acheteur max', frais: 'Acheteur max', usage: 'Départ usine Maroc', vendeurfr: '5%', acheteurFr: '95%', conseil: 'Déconseillé export — acheteur gère tout', color: '#e74c3c' },
  { code: 'FCA', nom: 'Free Carrier', risque: 'Transfert au transporteur', frais: 'Mixte', usage: 'Aérien, multimodal', vendeurfr: '20%', acheteurFr: '80%', conseil: 'Recommandé multimodal', color: '#e67e22' },
  { code: 'FOB', nom: 'Free On Board', risque: 'Transfert à bord navire', frais: 'Mixte', usage: 'Maritime vrac / conteneur', vendeurfr: '35%', acheteurFr: '65%', conseil: 'Standard Maroc export maritime', color: '#f39c12' },
  { code: 'CFR', nom: 'Cost & Freight', risque: 'Transfert à bord navire', frais: 'Vendeur paie fret', usage: 'Maritime', vendeurfr: '55%', acheteurFr: '45%', conseil: 'Bon pour acheteurs sans logistique', color: '#27ae60' },
  { code: 'CIF', nom: 'Cost Insurance Freight', risque: 'Identique CFR', frais: 'Vendeur paie fret + assurance', usage: 'Maritime — base calcul droits', vendeurfr: '60%', acheteurFr: '40%', conseil: 'Base de calcul droits douane destination', color: '#16a085' },
  { code: 'DAP', nom: 'Delivered At Place', risque: 'Livraison destination', frais: 'Vendeur paie tout sauf droits', usage: 'Tous modes', vendeurfr: '80%', acheteurFr: '20%', conseil: 'Bon compromis DDP sans risque fiscal', color: '#2980b9' },
  { code: 'DDP', nom: 'Delivered Duty Paid', risque: 'Vendeur supporte tout', frais: 'Vendeur paie TOUT', usage: 'E-commerce, B2C, gdes enseignes', vendeurfr: '100%', acheteurFr: '0%', conseil: 'Prix tout inclus — forte valeur perçue', color: '#8e44ad' },
]

// ─── Composant principal ──────────────────────────────────────────────────────
export default function ModuleExport() {
  const [activeTab, setActiveTab] = useState<Tab>('ddp')

  // DDP Simulator state
  const [sim, setSim] = useState<SimDDP>({
    paysCode: 'FR', fob: 50000, fret: 3000, assurance: 500,
    codeHS: '', tauxDouane: null,
  })
  const [ddpResult, setDdpResult] = useState<null | {
    cif: number; droits: number; tva: number; taxeSup: number; ddp: number; ddpDevise: number
  }>(null)
  const [simError, setSimError] = useState('')

  // Guide state
  const [selectedPays, setSelectedPays] = useState<string>('FR')
  const [checklistType, setChecklistType] = useState<string>('Produits industriels')

  const pays = PAYS_LIST.find(p => p.code === sim.paysCode)!
  const guidePays = PAYS_LIST.find(p => p.code === selectedPays)!

  const calculerDDP = useCallback(() => {
    setSimError('')
    if (sim.fob <= 0) { setSimError('La valeur FOB doit être > 0'); return }
    const cif = sim.fob + sim.fret + sim.assurance
    const tauxD = sim.tauxDouane !== null ? sim.tauxDouane : pays.tauxDroit
    const droits = cif * tauxD / 100
    const baseTVA = cif + droits
    const tva = baseTVA * pays.tva / 100
    const taxeSup = cif * pays.taxeSup / 100
    const ddp = cif + droits + tva + taxeSup
    const ddpDevise = ddp / pays.tauxChange
    setDdpResult({ cif, droits, tva, taxeSup, ddp, ddpDevise })
  }, [sim, pays])

  const fmt = (n: number) => n.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const fmtDev = (n: number, dev: string) => `${n.toLocaleString('fr-MA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${dev}`

  const TABS: { id: Tab; label: string; badge?: string }[] = [
    { id: 'ddp', label: 'Simulateur DDP' },
    { id: 'guide', label: 'Guide 12 Pays', badge: '12' },
    { id: 'checklist', label: 'Checklist Export' },
    { id: 'incoterms', label: 'Incoterms Export' },
  ]

  return (
    <>
      <Head>
        <title>Module Export — Transit-IA</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --gold: #C9A84C; --gold2: #b8952f; --gold3: #e8d5a0;
          --gold4: #fdf8ee; --gold5: #fffdf7;
          --bg: #ffffff; --bg2: #fafafa;
          --ink: #1a1a1a; --ink2: #444; --ink3: #888;
          --border: #e8e4db; --border2: #f0ece4;
          --radius: 6px; --green: #1e7e4a; --red: #c0392b;
          --up: #1e7e4a;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--ink); }

        /* ── Header ── */
        .exp-header {
          border-bottom: 1px solid var(--border);
          padding: 1.5rem 2rem 0;
          background: var(--bg);
        }
        .exp-header-top {
          display: flex; align-items: flex-start; justify-content: space-between;
          margin-bottom: 1rem;
        }
        .exp-badge {
          font-size: 10px; letter-spacing: .12em; font-weight: 600;
          color: var(--gold); background: var(--gold4); border: 1px solid var(--gold3);
          padding: 3px 10px; border-radius: 3px; margin-bottom: .5rem; display: inline-block;
        }
        .exp-title {
          font-family: 'Playfair Display', serif; font-size: 1.5rem;
          color: var(--ink); margin-bottom: .25rem;
        }
        .exp-sub { font-size: 13px; color: var(--ink3); }
        .exp-kpis { display: flex; gap: 2rem; }
        .exp-kpi { text-align: right; }
        .exp-kpi-val { font-size: 1.3rem; font-weight: 600; color: var(--gold2); }
        .exp-kpi-lbl { font-size: 10px; color: var(--ink3); text-transform: uppercase; letter-spacing: .08em; }

        /* ── Tabs ── */
        .exp-tabs {
          display: flex; gap: 0; border-bottom: none; margin-top: 0;
        }
        .exp-tab {
          padding: .8rem 1.4rem; font-size: 13px; font-weight: 500;
          color: var(--ink3); cursor: pointer; border-bottom: 2px solid transparent;
          white-space: nowrap; transition: all .2s;
          display: flex; align-items: center; gap: 7px;
        }
        .exp-tab:hover { color: var(--ink); }
        .exp-tab.active { color: var(--gold); border-bottom-color: var(--gold); }
        .exp-tab .badge {
          background: var(--gold4); color: var(--gold); font-size: 10px;
          padding: 1px 6px; border-radius: 4px; font-weight: 600;
        }

        /* ── Content ── */
        .exp-content { max-width: 1200px; margin: 0 auto; padding: 2rem; }

        /* ── Section title ── */
        .sec-title {
          font-family: 'Playfair Display', serif; font-size: 1.05rem;
          color: var(--ink); margin-bottom: 1rem;
          display: flex; align-items: center; gap: .6rem;
        }
        .sec-title::before {
          content: ''; width: 3px; height: 18px;
          background: var(--gold); border-radius: 2px;
        }

        /* ── Grid ── */
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
        .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
        .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
        @media(max-width: 900px) {
          .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }
        }

        /* ── Card ── */
        .card {
          background: var(--bg); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 1.5rem;
        }
        .card-gold {
          border-color: rgba(201,168,76,.3); background: var(--gold4);
        }

        /* ── DDP Simulator ── */
        .ddp-layout {
          display: grid; grid-template-columns: 1fr 1.2fr; gap: 1.5rem;
          align-items: start;
        }
        @media(max-width: 900px) { .ddp-layout { grid-template-columns: 1fr; } }

        .form-group { margin-bottom: 1.1rem; }
        .form-label {
          display: block; font-size: 11px; font-weight: 600;
          color: var(--ink3); text-transform: uppercase; letter-spacing: .08em;
          margin-bottom: .4rem;
        }
        .form-input, .form-select {
          width: 100%; padding: .6rem .9rem;
          border: 1px solid var(--border); border-radius: var(--radius);
          font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--ink);
          background: var(--bg); transition: border-color .2s; outline: none;
        }
        .form-input:focus, .form-select:focus { border-color: var(--gold); }
        .form-hint { font-size: 11px; color: var(--ink3); margin-top: .3rem; }

        .pays-select-grid {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: .5rem;
          margin-bottom: 1.25rem;
        }
        @media(max-width: 700px) { .pays-select-grid { grid-template-columns: repeat(3, 1fr); } }
        .pays-btn {
          padding: .5rem .4rem; border: 1px solid var(--border); border-radius: var(--radius);
          background: var(--bg); cursor: pointer; text-align: center;
          font-size: 12px; color: var(--ink2); transition: all .15s;
          display: flex; flex-direction: column; align-items: center; gap: 2px;
        }
        .pays-btn:hover { border-color: var(--gold3); background: var(--gold4); }
        .pays-btn.active { border-color: var(--gold); background: var(--gold4); color: var(--gold2); font-weight: 600; }
        .pays-btn .flag { font-size: 18px; }
        .pays-btn .pays-name { font-size: 10px; }

        .btn-calc {
          width: 100%; padding: .85rem; background: var(--ink); color: var(--gold3);
          border: none; border-radius: var(--radius); font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 600; letter-spacing: .06em;
          cursor: pointer; transition: all .15s; margin-top: .5rem;
        }
        .btn-calc:hover { background: #2a2a2a; }

        .error-msg { color: var(--red); font-size: 12px; margin-top: .5rem; }

        /* DDP Result */
        .ddp-result {
          border: 1px solid var(--border); border-radius: var(--radius);
          overflow: hidden;
        }
        .ddp-result-header {
          background: var(--ink); padding: 1rem 1.25rem;
          display: flex; align-items: center; justify-content: space-between;
        }
        .ddp-result-header-title {
          font-size: 11px; letter-spacing: .1em; color: var(--gold3);
          font-weight: 600; text-transform: uppercase;
        }
        .ddp-result-pays {
          font-size: 12px; color: var(--gold); font-weight: 500;
        }
        .ddp-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: .75rem 1.25rem; border-bottom: 1px solid var(--border2);
          font-size: 13px;
        }
        .ddp-row:last-child { border-bottom: none; }
        .ddp-row-label { color: var(--ink2); display: flex; align-items: center; gap: .5rem; }
        .ddp-row-label .dot {
          width: 6px; height: 6px; border-radius: 50%; background: var(--gold3);
        }
        .ddp-row-val { font-weight: 500; color: var(--ink); }
        .ddp-row.total {
          background: var(--gold4); border-top: 2px solid var(--gold3);
        }
        .ddp-row.total .ddp-row-label {
          font-weight: 700; color: var(--ink); font-family: 'Playfair Display', serif;
        }
        .ddp-row.total .ddp-row-val { color: var(--gold2); font-size: 1.1rem; font-weight: 700; }
        .ddp-row-devise { font-size: 11px; color: var(--ink3); margin-top: 2px; text-align: right; }

        .ddp-note {
          margin-top: 1rem; padding: .875rem 1rem;
          background: var(--gold5); border: 1px solid var(--gold3);
          border-left: 3px solid var(--gold); border-radius: var(--radius);
          font-size: 12px; color: var(--ink2); line-height: 1.6;
        }
        .ddp-note strong { color: var(--ink); }

        .ddp-empty {
          text-align: center; padding: 3rem 2rem; color: var(--ink3);
          border: 1px dashed var(--border); border-radius: var(--radius);
        }
        .ddp-empty .icon { font-size: 2rem; margin-bottom: .75rem; }
        .ddp-empty p { font-size: 13px; line-height: 1.6; }

        /* ── Guide Pays ── */
        .guide-layout {
          display: grid; grid-template-columns: 220px 1fr; gap: 1.5rem;
          align-items: start;
        }
        @media(max-width: 800px) { .guide-layout { grid-template-columns: 1fr; } }

        .guide-list { border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
        .guide-list-item {
          display: flex; align-items: center; gap: .75rem;
          padding: .75rem 1rem; border-bottom: 1px solid var(--border2);
          cursor: pointer; transition: background .15s; font-size: 13px; color: var(--ink2);
        }
        .guide-list-item:last-child { border-bottom: none; }
        .guide-list-item:hover { background: var(--gold4); }
        .guide-list-item.active { background: var(--gold4); color: var(--gold2); font-weight: 600; border-left: 3px solid var(--gold); }
        .guide-list-item .gflag { font-size: 18px; }

        .guide-fiche { border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
        .guide-fiche-header {
          background: var(--ink); padding: 1.25rem 1.5rem;
          display: flex; align-items: center; gap: 1rem;
        }
        .guide-fiche-flag { font-size: 2.5rem; }
        .guide-fiche-name {
          font-family: 'Playfair Display', serif; font-size: 1.2rem; color: #fff;
        }
        .guide-fiche-accord {
          font-size: 11px; color: var(--gold3); margin-top: 2px;
        }
        .guide-fiche-body { padding: 1.5rem; }

        .guide-kpis {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;
          margin-bottom: 1.5rem;
        }
        @media(max-width: 700px) { .guide-kpis { grid-template-columns: repeat(2, 1fr); } }
        .guide-kpi {
          padding: .875rem; border: 1px solid var(--border); border-radius: var(--radius);
          text-align: center;
        }
        .guide-kpi-val { font-size: 1.4rem; font-weight: 700; color: var(--gold2); }
        .guide-kpi-lbl {
          font-size: 10px; color: var(--ink3); text-transform: uppercase;
          letter-spacing: .08em; margin-top: 2px;
        }

        .guide-note-box {
          padding: 1rem 1.25rem; background: var(--gold5);
          border: 1px solid var(--gold3); border-left: 3px solid var(--gold);
          border-radius: var(--radius); font-size: 13px; color: var(--ink2); line-height: 1.7;
          margin-bottom: 1rem;
        }

        .guide-cascade {
          border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden;
        }
        .guide-cascade-title {
          background: var(--bg2); padding: .6rem 1rem;
          font-size: 11px; letter-spacing: .08em; color: var(--ink3);
          text-transform: uppercase; border-bottom: 1px solid var(--border);
        }
        .guide-cascade-row {
          display: flex; justify-content: space-between;
          padding: .6rem 1rem; border-bottom: 1px solid var(--border2);
          font-size: 13px;
        }
        .guide-cascade-row:last-child { border-bottom: none; }
        .guide-cascade-row.sum {
          background: var(--gold4); font-weight: 700;
          border-top: 2px solid var(--gold3); color: var(--gold2);
        }

        /* ── Checklist ── */
        .checklist-layout {
          display: grid; grid-template-columns: 200px 1fr; gap: 1.5rem;
        }
        @media(max-width: 700px) { .checklist-layout { grid-template-columns: 1fr; } }

        .type-list { display: flex; flex-direction: column; gap: .4rem; }
        .type-btn {
          padding: .65rem 1rem; border: 1px solid var(--border);
          border-radius: var(--radius); background: var(--bg); cursor: pointer;
          font-size: 12px; color: var(--ink2); transition: all .15s; text-align: left;
          font-family: 'DM Sans', sans-serif;
        }
        .type-btn:hover { background: var(--gold4); }
        .type-btn.active { background: var(--gold4); border-color: var(--gold); color: var(--gold2); font-weight: 600; }

        .checklist-content { display: flex; flex-direction: column; gap: 1.25rem; }
        .check-section-title {
          font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: .1em; color: var(--gold2); margin-bottom: .75rem;
          padding-bottom: .4rem; border-bottom: 1px solid var(--gold3);
        }
        .check-item {
          display: flex; align-items: flex-start; gap: .75rem;
          padding: .6rem .875rem; background: var(--bg);
          border: 1px solid var(--border2); border-radius: 4px;
          font-size: 13px; color: var(--ink2); margin-bottom: .4rem;
          cursor: pointer; transition: all .15s;
        }
        .check-item:hover { background: var(--gold5); border-color: var(--gold3); }
        .check-item.checked { background: #f0fff4; border-color: #86efac; color: #166534; }
        .check-box {
          width: 16px; height: 16px; min-width: 16px;
          border: 1.5px solid var(--border); border-radius: 3px;
          background: var(--bg); margin-top: 1px;
          display: flex; align-items: center; justify-content: center;
          transition: all .15s;
        }
        .check-item.checked .check-box {
          background: #22c55e; border-color: #22c55e; color: white; font-size: 10px;
        }

        /* ── Incoterms ── */
        .inco-grid { display: flex; flex-direction: column; gap: .75rem; }
        .inco-card {
          border: 1px solid var(--border); border-radius: var(--radius);
          overflow: hidden; transition: all .2s;
        }
        .inco-card:hover { border-color: var(--gold3); box-shadow: 0 2px 8px rgba(201,168,76,.1); }
        .inco-header {
          display: flex; align-items: center; gap: 1rem; padding: 1rem 1.25rem;
          cursor: pointer;
        }
        .inco-code {
          font-size: 1rem; font-weight: 700; color: var(--bg);
          width: 52px; text-align: center; padding: .3rem .5rem;
          border-radius: 4px; flex-shrink: 0;
        }
        .inco-nom { font-weight: 600; font-size: 14px; color: var(--ink); }
        .inco-usage { font-size: 12px; color: var(--ink3); }
        .inco-conseil { font-size: 12px; color: var(--ink2); margin-left: auto; text-align: right; }
        @media(max-width: 700px) { .inco-conseil { display: none; } }

        .inco-bar-wrap {
          padding: .75rem 1.25rem 1rem;
          border-top: 1px solid var(--border2);
          background: var(--bg2);
        }
        .inco-bar-labels {
          display: flex; justify-content: space-between;
          font-size: 10px; color: var(--ink3); margin-bottom: .4rem;
          text-transform: uppercase; letter-spacing: .06em;
        }
        .inco-bar {
          height: 8px; border-radius: 4px; background: var(--border);
          overflow: hidden; display: flex;
        }
        .inco-bar-fill { height: 100%; transition: width .4s; }
        .inco-details {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: .75rem; margin-top: .875rem;
        }
        .inco-detail-item { font-size: 12px; color: var(--ink2); }
        .inco-detail-lbl { font-size: 10px; text-transform: uppercase; letter-spacing: .06em; color: var(--ink3); margin-bottom: 2px; }

        /* ── Banner ── */
        .info-banner {
          background: var(--gold5); border: 1px solid var(--gold3);
          border-left: 3px solid var(--gold); border-radius: var(--radius);
          padding: .875rem 1.25rem; margin-bottom: 1.5rem;
          display: flex; align-items: flex-start; gap: .875rem;
        }
        .info-banner-icon { font-size: 1.1rem; flex-shrink: 0; }
        .info-banner-text { font-size: 12px; color: var(--ink2); line-height: 1.6; }
        .info-banner-text strong { color: var(--ink); }

        /* ── Progress ── */
        .progress-row {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: .75rem;
        }
        .progress-lbl { font-size: 12px; color: var(--ink2); }
        .progress-pct { font-size: 12px; font-weight: 600; color: var(--ink); }
        .progress-bar { height: 6px; background: var(--border); border-radius: 3px; margin-bottom: 1.25rem; }
        .progress-bar-fill { height: 100%; border-radius: 3px; background: var(--gold); }
      ` }} />

      {/* Header */}
      <div className="exp-header">
        <div className="exp-header-top">
          <div>
            <div className="exp-badge">MODULE EXP — EXPORT</div>
            <h1 className="exp-title">Intelligence Export</h1>
            <p className="exp-sub">Simulateurs DDP · Guide 12 marchés destination · Checklist documentaire</p>
          </div>
          <div className="exp-kpis">
            <div className="exp-kpi">
              <div className="exp-kpi-val">12</div>
              <div className="exp-kpi-lbl">Pays couverts</div>
            </div>
            <div className="exp-kpi">
              <div className="exp-kpi-val">7</div>
              <div className="exp-kpi-lbl">Incoterms</div>
            </div>
            <div className="exp-kpi">
              <div className="exp-kpi-val">4</div>
              <div className="exp-kpi-lbl">Checklists</div>
            </div>
          </div>
        </div>
        <div className="exp-tabs">
          {TABS.map(t => (
            <button key={t.id} className={`exp-tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
              {t.label}
              {t.badge && <span className="badge">{t.badge}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="exp-content">

        {/* ─── TAB 1 : SIMULATEUR DDP ──────────────────────────────────────── */}
        {activeTab === 'ddp' && (
          <>
            <div className="info-banner">
              <span className="info-banner-icon">📦</span>
              <div className="info-banner-text">
                <strong>Simulateur Delivered Duty Paid (DDP)</strong> — Calculez le coût total rendu destination pour{' '}
                12 marchés export. Le DDP représente le prix maximum supporté par le vendeur : FOB + fret + assurance +
                droits douane destination + TVA locale. Base de valorisation pour vos offres commerciales export.
              </div>
            </div>

            <h2 className="sec-title" style={{ marginBottom: '1rem' }}>Pays destination</h2>
            <div className="pays-select-grid">
              {PAYS_LIST.map(p => (
                <button
                  key={p.code}
                  className={`pays-btn ${sim.paysCode === p.code ? 'active' : ''}`}
                  onClick={() => setSim(s => ({ ...s, paysCode: p.code })) }
                >
                  <span className="flag">{p.flag}</span>
                  <span className="pays-name">{p.nom}</span>
                </button>
              ))}
            </div>

            <div className="ddp-layout">
              {/* Formulaire */}
              <div>
                <h2 className="sec-title">Paramètres de la cargaison</h2>
                <div className="card">
                  <div className="form-group">
                    <label className="form-label">Valeur FOB (MAD) *</label>
                    <input
                      type="number" className="form-input" min={0}
                      value={sim.fob}
                      onChange={e => setSim(s => ({ ...s, fob: +e.target.value }))}
                    />
                    <div className="form-hint">Valeur marchandise franco bord, départ Maroc</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fret international (MAD)</label>
                    <input
                      type="number" className="form-input" min={0}
                      value={sim.fret}
                      onChange={e => setSim(s => ({ ...s, fret: +e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Assurance transport (MAD)</label>
                    <input
                      type="number" className="form-input" min={0}
                      value={sim.assurance}
                      onChange={e => setSim(s => ({ ...s, assurance: +e.target.value }))}
                    />
                    <div className="form-hint">Généralement 0.3–0.5% de la valeur CIF</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Taux de droit douane destination (%)</label>
                    <input
                      type="number" className="form-input" min={0} max={100} step={0.5}
                      placeholder={`Taux moyen ${pays.nom} : ${pays.tauxDroit}%`}
                      value={sim.tauxDouane ?? ''}
                      onChange={e => setSim(s => ({ ...s, tauxDouane: e.target.value ? +e.target.value : null }))}
                    />
                    <div className="form-hint">Laisser vide pour utiliser le taux moyen indicatif</div>
                  </div>
                  {simError && <div className="error-msg">⚠ {simError}</div>}
                  <button className="btn-calc" onClick={calculerDDP}>
                    CALCULER LE PRIX DDP →
                  </button>
                </div>
              </div>

              {/* Résultat */}
              <div>
                <h2 className="sec-title">Décomposition DDP vers {pays.flag} {pays.nom}</h2>
                {ddpResult ? (
                  <>
                    <div className="ddp-result">
                      <div className="ddp-result-header">
                        <span className="ddp-result-header-title">Cascade de coûts</span>
                        <span className="ddp-result-pays">{pays.flag} {pays.nom} — {pays.devise}</span>
                      </div>
                      <div className="ddp-row">
                        <span className="ddp-row-label"><span className="dot" /> Valeur FOB départ Maroc</span>
                        <span className="ddp-row-val">{fmt(sim.fob)} MAD</span>
                      </div>
                      <div className="ddp-row">
                        <span className="ddp-row-label"><span className="dot" /> + Fret international</span>
                        <span className="ddp-row-val">{fmt(sim.fret)} MAD</span>
                      </div>
                      <div className="ddp-row">
                        <span className="ddp-row-label"><span className="dot" /> + Assurance</span>
                        <span className="ddp-row-val">{fmt(sim.assurance)} MAD</span>
                      </div>
                      <div className="ddp-row" style={{ background: 'var(--bg2)', fontWeight: 600 }}>
                        <span className="ddp-row-label">= Valeur CIF (base droits)</span>
                        <span className="ddp-row-val">{fmt(ddpResult.cif)} MAD</span>
                      </div>
                      <div className="ddp-row">
                        <span className="ddp-row-label"><span className="dot" /> + Droits de douane ({(sim.tauxDouane ?? pays.tauxDroit)}%)</span>
                        <span className="ddp-row-val">{fmt(ddpResult.droits)} MAD</span>
                      </div>
                      <div className="ddp-row">
                        <span className="ddp-row-label"><span className="dot" /> + TVA locale ({pays.tva}%)</span>
                        <span className="ddp-row-val">{fmt(ddpResult.tva)} MAD</span>
                      </div>
                      {ddpResult.taxeSup > 0 && (
                        <div className="ddp-row">
                          <span className="ddp-row-label"><span className="dot" /> + {pays.labelTaxeSup} ({pays.taxeSup}%)</span>
                          <span className="ddp-row-val">{fmt(ddpResult.taxeSup)} MAD</span>
                        </div>
                      )}
                      <div className="ddp-row total">
                        <span className="ddp-row-label">= Prix DDP total</span>
                        <div>
                          <div className="ddp-row-val">{fmt(ddpResult.ddp)} MAD</div>
                          <div className="ddp-row-devise">≈ {fmtDev(ddpResult.ddpDevise, pays.devise)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="ddp-note" style={{ marginTop: '1rem' }}>
                      <strong>💡 Note douane {pays.nom} :</strong> {pays.noteDouane}
                      {' '}<strong>Accord commercial :</strong> {pays.accord}.
                      {' '}<strong>Délai transit estimé :</strong> {pays.transitDelay}.
                    </div>

                    <div className="card" style={{ marginTop: '1rem' }}>
                      <div style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: '.5rem', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>Répartition des coûts</div>
                      {[
                        { lbl: 'Valeur FOB', val: sim.fob, tot: ddpResult.ddp },
                        { lbl: 'Fret + Assurance', val: sim.fret + sim.assurance, tot: ddpResult.ddp },
                        { lbl: 'Droits douane', val: ddpResult.droits, tot: ddpResult.ddp },
                        { lbl: 'TVA + Taxes', val: ddpResult.tva + ddpResult.taxeSup, tot: ddpResult.ddp },
                      ].map(r => {
                        const pct = ((r.val / r.tot) * 100).toFixed(1)
                        return (
                          <div key={r.lbl}>
                            <div className="progress-row">
                              <span className="progress-lbl">{r.lbl}</span>
                              <span className="progress-pct">{pct}%</span>
                            </div>
                            <div className="progress-bar">
                              <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                ) : (
                  <div className="ddp-empty">
                    <div className="icon">🧮</div>
                    <p>Saisissez la valeur FOB et les paramètres de transport,<br/>puis cliquez sur <strong>Calculer le prix DDP</strong></p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ─── TAB 2 : GUIDE 12 PAYS ───────────────────────────────────────── */}
        {activeTab === 'guide' && (
          <>
            <div className="info-banner">
              <span className="info-banner-icon">🌍</span>
              <div className="info-banner-text">
                <strong>Guide opérationnel 12 marchés export</strong> — Taux de droits, TVA locale, accords commerciaux
                avec le Maroc, délais transit, notes douane opérationnelles pour les principaux marchés d'export marocain.
              </div>
            </div>

            <div className="guide-layout">
              {/* Liste pays */}
              <div className="guide-list">
                {PAYS_LIST.map(p => (
                  <div
                    key={p.code}
                    className={`guide-list-item ${selectedPays === p.code ? 'active' : ''}`}
                    onClick={() => setSelectedPays(p.code)}
                  >
                    <span className="gflag">{p.flag}</span>
                    <span>{p.nom}</span>
                  </div>
                ))}
              </div>

              {/* Fiche pays */}
              <div className="guide-fiche">
                <div className="guide-fiche-header">
                  <span className="guide-fiche-flag">{guidePays.flag}</span>
                  <div>
                    <div className="guide-fiche-name">{guidePays.nom}</div>
                    <div className="guide-fiche-accord">🤝 {guidePays.accord}</div>
                  </div>
                </div>
                <div className="guide-fiche-body">
                  {/* KPIs */}
                  <div className="guide-kpis">
                    <div className="guide-kpi">
                      <div className="guide-kpi-val">{guidePays.tauxDroit}%</div>
                      <div className="guide-kpi-lbl">Droits douane moy.</div>
                    </div>
                    <div className="guide-kpi">
                      <div className="guide-kpi-val">{guidePays.tva}%</div>
                      <div className="guide-kpi-lbl">TVA locale</div>
                    </div>
                    <div className="guide-kpi">
                      <div className="guide-kpi-val">{guidePays.transitDelay}</div>
                      <div className="guide-kpi-lbl">Transit Maroc</div>
                    </div>
                    <div className="guide-kpi">
                      <div className="guide-kpi-val">{guidePays.devise}</div>
                      <div className="guide-kpi-lbl">Devise / {guidePays.tauxChange.toLocaleString()} MAD</div>
                    </div>
                  </div>

                  {/* Note opérationnelle */}
                  <h3 className="sec-title" style={{ marginBottom: '.75rem' }}>Note opérationnelle</h3>
                  <div className="guide-note-box">{guidePays.noteDouane}</div>

                  {/* Cascade indicative sur base 100 000 MAD FOB */}
                  <h3 className="sec-title" style={{ marginBottom: '.75rem' }}>Simulation indicative — base 100 000 MAD FOB</h3>
                  <div className="guide-cascade">
                    <div className="guide-cascade-title">Cascade coûts DDP indicatif</div>
                    {(() => {
                      const fob = 100000, fret = 6000, ass = 600
                      const cif = fob + fret + ass
                      const dr = cif * guidePays.tauxDroit / 100
                      const tv = (cif + dr) * guidePays.tva / 100
                      const ts = cif * guidePays.taxeSup / 100
                      const ddp = cif + dr + tv + ts
                      return (
                        <>
                          <div className="guide-cascade-row"><span>FOB départ Maroc</span><span>100 000 MAD</span></div>
                          <div className="guide-cascade-row"><span>+ Fret + Assurance (estimé)</span><span>6 600 MAD</span></div>
                          <div className="guide-cascade-row" style={{ fontWeight: 600 }}><span>= CIF (base droits)</span><span>{fmt(cif)} MAD</span></div>
                          <div className="guide-cascade-row"><span>+ Droits douane ({guidePays.tauxDroit}%)</span><span>{fmt(dr)} MAD</span></div>
                          <div className="guide-cascade-row"><span>+ TVA locale ({guidePays.tva}%)</span><span>{fmt(tv)} MAD</span></div>
                          {ts > 0 && <div className="guide-cascade-row"><span>+ {guidePays.labelTaxeSup} ({guidePays.taxeSup}%)</span><span>{fmt(ts)} MAD</span></div>}
                          <div className="guide-cascade-row sum"><span>= DDP TOTAL</span><span>{fmt(ddp)} MAD</span></div>
                        </>
                      )
                    })()}
                  </div>

                  <div style={{ marginTop: '1rem', fontSize: 12, color: 'var(--ink3)' }}>
                    * Simulation indicative. Les droits réels dépendent du code SH, de l'origine préférentielle et des accords bilatéraux en vigueur.
                    Utilisez le <span style={{ color: 'var(--gold)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setActiveTab('ddp')}>Simulateur DDP</span> pour un calcul personnalisé.
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ─── TAB 3 : CHECKLIST ───────────────────────────────────────────── */}
        {activeTab === 'checklist' && (
          <ChecklistTab checklists={CHECKLISTS} checklistType={checklistType} setChecklistType={setChecklistType} />
        )}

        {/* ─── TAB 4 : INCOTERMS ───────────────────────────────────────────── */}
        {activeTab === 'incoterms' && (
          <>
            <div className="info-banner">
              <span className="info-banner-icon">⚖️</span>
              <div className="info-banner-text">
                <strong>Incoterms 2020 — Guide opérationnel export</strong> — Répartition des frais, risques et
                responsabilités entre vendeur et acheteur. Le choix de l'Incoterm impacte directement votre prix
                de revient et la base de calcul des droits douane à destination.
              </div>
            </div>

            <div className="inco-grid">
              {INCOTERMS.map(inc => (
                <IncoCard key={inc.code} inc={inc} />
              ))}
            </div>

            <div className="card-gold card" style={{ marginTop: '1.5rem' }}>
              <div className="sec-title" style={{ marginBottom: '.75rem' }}>Recommandations Transit-IA pour l'export marocain</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: 13, color: 'var(--ink2)' }}>
                <div style={{ padding: '.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg)' }}>
                  <strong style={{ color: 'var(--ink)', display: 'block', marginBottom: '.4rem' }}>🚢 Maritime Maroc → Europe</strong>
                  FOB Casablanca / Tanger recommandé. CFR/CIF si l'acheteur ne maîtrise pas la logistique internationale. Éviter EXW — risque de refus en douane.
                </div>
                <div style={{ padding: '.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg)' }}>
                  <strong style={{ color: 'var(--ink)', display: 'block', marginBottom: '.4rem' }}>✈️ Aérien — Express / E-commerce</strong>
                  FCA recommandé (transfert au transitaire aérien). DDP si marketplace internationale (Amazon, etc.) — prix affiché TTC.
                </div>
                <div style={{ padding: '.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg)' }}>
                  <strong style={{ color: 'var(--ink)', display: 'block', marginBottom: '.4rem' }}>🌍 Export Afrique subsaharienne</strong>
                  DAP généralement conseillé. DDP complexe (fiscalité locale variable). CFR pour corridors maritimes Dakar / Abidjan.
                </div>
                <div style={{ padding: '.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg)' }}>
                  <strong style={{ color: 'var(--ink)', display: 'block', marginBottom: '.4rem' }}>💼 Grands comptes / GMS</strong>
                  DDP souvent exigé par les centrales d'achat européennes. Intégrez tous les coûts douane destination dans votre prix. Simulation DDP indispensable.
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </>
  )
}

// ─── Sous-composant Checklist (avec state local checks) ───────────────────────
function ChecklistTab({ checklists, checklistType, setChecklistType }: {
  checklists: Record<string, GuideItem[]>
  checklistType: string
  setChecklistType: (s: string) => void
}) {
  const [checks, setChecks] = useState<Record<string, boolean>>({})

  const toggleCheck = (key: string) => setChecks(c => ({ ...c, [key]: !c[key] }))

  const allItems = checklists[checklistType]?.flatMap(s => s.items) ?? []
  const doneCount = allItems.filter(i => checks[`${checklistType}:${i}`]).length

  return (
    <>
      <div className="info-banner">
        <span className="info-banner-icon">✅</span>
        <div className="info-banner-text">
          <strong>Checklist documentaire export</strong> — Documents requis par type de produit.
          Cochez au fur et à mesure pour suivre votre avancement dossier.{' '}
          <strong>{doneCount}/{allItems.length} documents</strong> validés.
        </div>
      </div>

      <div className="checklist-layout">
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--ink3)', marginBottom: '.75rem' }}>Type de produit</div>
          <div className="type-list">
            {Object.keys(checklists).map(t => (
              <button
                key={t}
                className={`type-btn ${checklistType === t ? 'active' : ''}`}
                onClick={() => setChecklistType(t)}
              >{t}</button>
            ))}
          </div>
        </div>

        <div className="checklist-content">
          {checklists[checklistType]?.map(section => (
            <div key={section.categorie} className="card">
              <div className="check-section-title">{section.categorie}</div>
              {section.items.map(item => {
                const key = `${checklistType}:${item}`
                const done = !!checks[key]
                return (
                  <div key={item} className={`check-item ${done ? 'checked' : ''}`} onClick={() => toggleCheck(key)}>
                    <div className="check-box">{done ? '✓' : ''}</div>
                    <span>{item}</span>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

// ─── Sous-composant IncoCard ──────────────────────────────────────────────────
function IncoCard({ inc }: { inc: typeof INCOTERMS[number] }) {
  const [open, setOpen] = useState(false)
  const vPct = parseInt(inc.vendeurfr)
  return (
    <div className="inco-card">
      <div className="inco-header" onClick={() => setOpen(o => !o)}>
        <div className="inco-code" style={{ background: inc.color }}>{inc.code}</div>
        <div>
          <div className="inco-nom">{inc.nom}</div>
          <div className="inco-usage">{inc.usage}</div>
        </div>
        <div className="inco-conseil">{inc.conseil}</div>
        <div style={{ marginLeft: 'auto', color: 'var(--ink3)', fontSize: 12 }}>{open ? '▲' : '▼'}</div>
      </div>
      {open && (
        <div className="inco-bar-wrap">
          <div className="inco-bar-labels">
            <span>Vendeur {inc.vendeurfr}</span>
            <span>Acheteur {inc.acheteurFr}</span>
          </div>
          <div className="inco-bar">
            <div className="inco-bar-fill" style={{ width: `${vPct}%`, background: inc.color }} />
            <div className="inco-bar-fill" style={{ width: `${100 - vPct}%`, background: 'var(--border)' }} />
          </div>
          <div className="inco-details">
            <div className="inco-detail-item">
              <div className="inco-detail-lbl">Transfert risque</div>
              {inc.risque}
            </div>
            <div className="inco-detail-item">
              <div className="inco-detail-lbl">Frais</div>
              {inc.frais}
            </div>
            <div className="inco-detail-item">
              <div className="inco-detail-lbl">Recommandation</div>
              <strong>{inc.conseil}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

