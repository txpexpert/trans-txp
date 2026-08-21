// ============================================================
// ROUTE PROTÉGÉE — pages/api/calculs/regimes.ts
// Régimes douaniers économiques — Maroc Code des Douanes
// Calculs pénalités non-apurement, suspension droits, conditions
// Jamais envoyé au navigateur — invisible en F12
// ============================================================

import type { NextApiRequest, NextApiResponse } from 'next';

// ── Données régimes (jamais exposées) ────────────────────────

const REGIMES_ECONOMIQUES = {
  MAC: {
    code: '010',
    libelle: 'Mise à la Consommation',
    type: 'Import · Standard',
    suspensionDroits: false,
    taxes: ['DI', 'TVA', 'TIC (si applicable)', 'PFI'],
    description: 'Importation définitive permettant la mise en libre pratique de marchandises sur le territoire marocain après acquittement de l\'intégralité des droits et taxes applicables.',
    kpis: { droitsALentree: 'DI + TVA', tauxApurement: null, delaiMois: null },
    baseJuridique: 'Art. 83 à 100 Code des Douanes',
    etapes: [
      'Dépôt de la DUM dans BADR',
      'Vérification documentaire (facture, B/L, certificats)',
      'Contrôle physique si canal rouge',
      'Liquidation & paiement des droits et taxes',
      'Bon à enlever — mainlevée des marchandises',
    ],
    penalites: null,
    avantages: ['Mise en libre pratique immédiate', 'Revente possible sur le marché marocain'],
  },

  MAC_RISTOURNE: {
    code: '011',
    libelle: 'MàC + Ristourne de droits',
    type: 'Import · Avancé',
    suspensionDroits: false,
    taxes: ['DI', 'TVA'],
    description: 'Régime d\'importation définitif permettant la mise en libre pratique avec possibilité de remboursement partiel des droits. Délai 12 mois pour demande de ristourne.',
    kpis: { droitsALentree: 'DI + TVA (remboursable)', tauxApurement: null, delaiMois: 12 },
    baseJuridique: 'Art. 100 à 108 Code des Douanes',
    etapes: [
      'Importation avec paiement droits (régime 010)',
      'Transformation ou utilisation spécifique de la marchandise',
      'Dépôt demande de ristourne dans les 12 mois',
      'Contrôle ADII et calcul du remboursement',
    ],
    penalites: null,
    avantages: ['Récupération partielle des droits payés', 'Flexibilité par rapport à l\'AT'],
  },

  AT: {
    code: '051',
    libelle: 'Admission Temporaire',
    type: 'Import · Suspension',
    suspensionDroits: true,
    taxes: [],
    description: 'Suspension de droits et taxes permettant l\'importation temporaire de marchandises destinées à être transformées puis réexportées à 100% dans les délais impartis.',
    kpis: { droitsALentree: '0% pendant AT', tauxApurement: 100, delaiMois: 6 },
    baseJuridique: 'Art. 146 à 163 Code des Douanes · Circulaire n°5700 · Note ADII n°6100',
    conditions: [
      'Caution bancaire couvrant 100% des droits et taxes suspendus',
      'Taux de rendement déclaré respecté ± 5%',
      'Réexportation 100% dans le délai (6 mois, prorogeable)',
      'Tenue du registre AT obligatoire',
    ],
    penalites: {
      depassementDelai:       { sanction: 'Droits exigibles + 10% pénalités', reference: 'Art. 155' },
      nonApurementPartiel:    { sanction: 'Droits sur solde + 25% pénalités', reference: 'Art. 155' },
      nonApurementTotal:      { sanction: 'Droits + 50% amende', reference: 'Art. 155' },
      fraudeTauxRendement:    { sanction: 'Droits + poursuites pénales', reference: 'Art. 281' },
    },
    avantages: ['Suspension totale DI + TVA', 'Compétitivité à l\'export', 'Trésorerie préservée'],
    docsRequis: ['Caution bancaire AT', 'Descriptif processus transformation', 'Fiche technique produits compensateurs', 'Programme prévisionnel AT'],
  },

  ENTREPOT: {
    code: '071',
    libelle: 'Entrepôt de Douane',
    type: 'Stockage · Suspension',
    suspensionDroits: true,
    taxes: [],
    description: 'Régime permettant le stockage de marchandises dans un local agréé sous contrôle douanier, sans paiement des droits et taxes pendant la durée du séjour (max 3 ans).',
    kpis: { droitsALentree: '0% pendant stockage', tauxApurement: null, delaiMois: 36 },
    baseJuridique: 'Art. 117 à 145 Code des Douanes',
    conditions: [
      'Agrément entrepôt obligatoire (public ou privé)',
      'Registre de stock tenu à jour',
      'Accès et contrôle ADII à tout moment',
      'Durée maximale : 3 ans (prorogeable sur demande)',
    ],
    penalites: {
      depassementDelai: { sanction: 'Droits exigibles + 10%', reference: 'Art. 130' },
      manquant:         { sanction: 'Droits sur manquant + 25% à 100%', reference: 'Art. 130' },
    },
    avantages: ['Pas de limite de quantité stockée', 'Report du paiement des droits', 'Possible mise en libre pratique ultérieure ou réexportation'],
    docsRequis: ['Agrément entrepôt douane', 'Registre de stock', 'Plan de l\'entrepôt'],
  },

  TRANSIT: {
    code: '080',
    libelle: 'Transit Douanier',
    type: 'Transport · Suspension',
    suspensionDroits: true,
    taxes: [],
    description: 'Régime permettant le transport de marchandises d\'un bureau de douane à un autre, ou vers un pays tiers, sous couvert d\'une déclaration de transit avec suspension des droits.',
    kpis: { droitsALentree: '0% pendant transit', tauxApurement: null, delaiMois: null },
    baseJuridique: 'Art. 164 à 185 Code des Douanes',
    conditions: [
      'Déclaration de transit obligatoire',
      'Caution ou acquit-à-caution selon le montant des droits',
      'Délai de route fixé par l\'ADII',
      'Présentation obligatoire au bureau de destination',
    ],
    penalites: {
      nonPresentation: { sanction: 'Droits exigibles + 25%', reference: 'Art. 175' },
    },
    avantages: ['Transport national et international', 'Pas de droits pendant le transit', 'Régime TIR disponible'],
    docsRequis: ['Déclaration de transit (T1)', 'Carnet TIR (si applicable)', 'Manifeste de chargement'],
  },

  EXPORT: {
    code: '100',
    libelle: 'Exportation Définitive',
    type: 'Export · Standard',
    suspensionDroits: true,
    taxes: [],
    description: 'Régime permettant la sortie définitive de marchandises du territoire douanier marocain. Donne droit aux avantages fiscaux à l\'export.',
    kpis: { droitsALentree: '0% droits à l\'export', tauxApurement: null, delaiMois: null },
    baseJuridique: 'Art. 186 à 210 Code des Douanes · Art. 19 CGI',
    avantagesFiscaux: [
      'Exonération IS/IR sur CA export (5 premières années)',
      'Taux IS réduit 17,5% après les 5 ans (Art. 19 CGI)',
      'Remboursement TVA sur achats liés à l\'export',
      'Exonération TVA sur ventes à l\'export',
    ],
    docsRequis: ['DUM export', 'Facture commerciale', 'Certificat d\'origine (si requis)', 'Document de transport'],
    penalites: null,
  },

  ZFE: {
    code: '061',
    libelle: 'Zone Franche d\'Exportation',
    type: 'Zone Spéciale · Exonération',
    suspensionDroits: true,
    taxes: [],
    description: 'Régime applicable uniquement aux entreprises agréées ZFE. Exonération totale de droits et taxes. Vente sur marché marocain soumise aux droits d\'importation normaux.',
    kpis: { droitsALentree: '0% (zone franche)', tauxApurement: null, delaiMois: null },
    baseJuridique: 'Loi 19-94 relative aux ZFE · Art. 6 Charte de l\'Investissement',
    conditions: [
      'Agrément ZFE obligatoire',
      'Activités industrielles ou de services agréées',
      'CA réalisé principalement à l\'export (≥ 70%)',
      'Vente sur marché local soumise à droits d\'importation',
    ],
    avantagesFiscaux: [
      'Exonération IS total (5 ans) puis 8,75% (20 ans)',
      'Exonération TVA sur fournitures et équipements',
      'Exonération droits d\'enregistrement',
      'Libre transfert des capitaux et bénéfices',
    ],
    docsRequis: ['Agrément ZFE', 'Attestation statut ZFE', 'Contrat d\'établissement'],
    penalites: null,
  },
};

// ── Formule calcul pénalités AT (jamais exposée) ─────────────

function calculerPenalitesAT(params: {
  droitsSuspendusDI: number;
  droitsSuspendusTVA: number;
  typeInfraction: 'depassement' | 'nonApurementPartiel' | 'nonApurementTotal' | 'fraude';
  montantNonApure?: number;
}): object {
  const { droitsSuspendusDI, droitsSuspendusTVA, typeInfraction, montantNonApure } = params;
  const totalDroits = droitsSuspendusDI + droitsSuspendusTVA;
  const base = montantNonApure || totalDroits;

  const TAUX: Record<string, number> = {
    depassement:         0.10,
    nonApurementPartiel: 0.25,
    nonApurementTotal:   0.50,
    fraude:              1.00,
  };

  const tauxPenalite = TAUX[typeInfraction] || 0.10;
  const penalite     = base * tauxPenalite;
  const totalDu      = base + penalite;

  return {
    droitsSuspendusDI:  Math.round(droitsSuspendusDI),
    droitsSuspendusTVA: Math.round(droitsSuspendusTVA),
    totalDroitsSuspendus: Math.round(totalDroits),
    baseCalcul:         Math.round(base),
    typeInfraction,
    tauxPenalite:       tauxPenalite * 100 + '%',
    penalite:           Math.round(penalite),
    totalDu:            Math.round(totalDu),
    reference: REGIMES_ECONOMIQUES.AT.penalites?.[typeInfraction as keyof typeof REGIMES_ECONOMIQUES.AT.penalites]?.reference || 'Art. 155 Code des Douanes',
  };
}

// ── Handler ──────────────────────────────────────────────────

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET — liste des régimes (sans pénalités détaillées ni formules)
  if (req.method === 'GET') {
    const { regime } = req.query;

    if (regime) {
      const r = REGIMES_ECONOMIQUES[regime.toString().toUpperCase() as keyof typeof REGIMES_ECONOMIQUES];
      if (!r) return res.status(404).json({ ok: false, error: `Régime ${regime} introuvable` });
      return res.status(200).json({ ok: true, ...r });
    }

    const liste = Object.entries(REGIMES_ECONOMIQUES).map(([key, r]) => ({
      key,
      code: r.code,
      libelle: r.libelle,
      type: r.type,
      suspensionDroits: r.suspensionDroits,
    }));
    return res.status(200).json({ ok: true, regimes: liste });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Méthode non autorisée' });
  }

  try {
    const { action, params } = req.body;

    if (!action || !params) {
      return res.status(400).json({ ok: false, error: 'action et params requis' });
    }

    switch (action) {
      case 'penalites_at':
        return res.status(200).json({ ok: true, ...calculerPenalitesAT(params) });

      case 'regime_detail': {
        const key = params.regime?.toUpperCase();
        const r = REGIMES_ECONOMIQUES[key as keyof typeof REGIMES_ECONOMIQUES];
        if (!r) return res.status(404).json({ ok: false, error: `Régime ${params.regime} introuvable` });
        return res.status(200).json({ ok: true, ...r });
      }

      default:
        return res.status(400).json({ ok: false, error: `Action inconnue: ${action}` });
    }
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message || 'Erreur serveur' });
  }
}
