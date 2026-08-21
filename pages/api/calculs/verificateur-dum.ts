// ============================================================
// ROUTE PROTÉGÉE — pages/api/calculs/verificateur-dum.ts
// Calcul valeur CAF + analyse conformité DUM (Déclaration Unique)
// Scoring qualité déclaration douanière
// Jamais envoyé au navigateur — invisible en F12
// ============================================================

import type { NextApiRequest, NextApiResponse } from 'next';

// ── Données régimes douaniers (jamais exposées) ──────────────

const REGIMES: Record<string, {
  label: string;
  desc: string;
  suspensionDroits: boolean;
  delaiMois?: number;
  tauxApurement?: number;
  penaliteNonApurement?: string;
  docsExtra: string[];
}> = {
  '010': {
    label: 'Mise à la consommation',
    desc: 'Importation définitive — acquittement intégral des droits et taxes.',
    suspensionDroits: false,
    docsExtra: [],
  },
  '011': {
    label: 'MàC + ristourne',
    desc: 'Importation définitive avec possibilité de remboursement partiel. Délai 12 mois pour demande de ristourne.',
    suspensionDroits: false,
    delaiMois: 12,
    docsExtra: [],
  },
  '051': {
    label: 'Admission temporaire',
    desc: 'Suspension de droits. Transformation obligatoire + réexport 100% dans délai 6 mois. Caution bancaire obligatoire.',
    suspensionDroits: true,
    delaiMois: 6,
    tauxApurement: 1.0,
    penaliteNonApurement: 'Droits + 10% à 50% pénalités',
    docsExtra: ['Caution bancaire AT', 'Descriptif processus transformation', 'Fiche technique produits compensateurs'],
  },
  '071': {
    label: 'Entrepôt de douane',
    desc: 'Stockage sous contrôle douanier sans paiement droits. Durée max 3 ans.',
    suspensionDroits: true,
    delaiMois: 36,
    docsExtra: ['Agrément entrepôt douane', 'Registre de stock'],
  },
  '061': {
    label: 'Zone franche',
    desc: 'Applicable uniquement aux entreprises agréées ZFE. Exonération totale de droits.',
    suspensionDroits: true,
    docsExtra: ['Agrément ZFE', 'Attestation statut ZFE'],
  },
};

// ── Formule CAF (jamais exposée) ─────────────────────────────

function calculerCAF(params: {
  fob: number;
  fret: number;
  assurance: number;
  tauxChange: number;
  devise: string;
}): object {
  const { fob, fret, assurance, tauxChange } = params;
  // Art. 1 Accord OMC — Valeur CAF = (FOB + Fret + Assurance) × Taux de change
  const cafDevise = fob + fret + assurance;
  const cafMAD    = cafDevise * tauxChange;

  return {
    fob:        Math.round(fob * tauxChange),
    fret:       Math.round(fret * tauxChange),
    assurance:  Math.round(assurance * tauxChange),
    cafDevise:  Math.round(cafDevise * 100) / 100,
    cafMAD:     Math.round(cafMAD),
    tauxChange,
    reference: 'Art. 1 Accord OMC/GATT — Valeur transactionnelle CAF',
  };
}

// ── Algorithme de scoring DUM (jamais exposé) ────────────────

function analyserDUM(params: {
  fob: number;
  fret: number;
  assurance: number;
  tauxChange: number;
  incoterm: string;
  origine: string;
  ncCode: string;
  regime: string;
  transportMode: string;
  nbDocuments: number;
  expediteur: string;
  destinataire: string;
}): object {
  const {
    fob, fret, assurance, tauxChange,
    incoterm, origine, ncCode, regime,
    transportMode, nbDocuments, expediteur, destinataire,
  } = params;

  const alertes: Array<{ text: string; badge: 'ALERTE' | 'ATTENTION' | 'INFO'; score: number }> = [];
  let score = 100;

  // ── Vérifications critiques ──
  if (!fob || fob <= 0) {
    alertes.push({ text: 'Valeur FOB non renseignée — nécessaire pour calcul des droits', badge: 'ALERTE', score: -8 });
    score -= 8;
  }
  if (!incoterm) {
    alertes.push({ text: 'Incoterm non renseigné — important pour calcul valeur CAF', badge: 'ALERTE', score: -5 });
    score -= 5;
  }
  if (!origine) {
    alertes.push({ text: 'Pays d\'origine non renseigné — impacte le taux DI et les accords préférentiels', badge: 'ALERTE', score: -5 });
    score -= 5;
  }
  if (!ncCode || ncCode.length < 6) {
    alertes.push({ text: 'Code NC incomplet — minimum 6 chiffres requis (NC10 recommandé)', badge: 'ALERTE', score: -10 });
    score -= 10;
  }

  // ── Vérifications importantes ──
  if (!assurance || assurance <= 0) {
    alertes.push({ text: 'Assurance à 0 — vérifier si incluse dans le fret ou à déclarer séparément', badge: 'ATTENTION', score: -3 });
    score -= 3;
  }
  if (!fret || fret <= 0) {
    alertes.push({ text: 'Fret à 0 — à vérifier selon Incoterm (EXW, FOB : fret à ajouter)', badge: 'ATTENTION', score: -3 });
    score -= 3;
  }
  if (!expediteur) {
    alertes.push({ text: 'Expéditeur non renseigné', badge: 'ATTENTION', score: -2 });
    score -= 2;
  }
  if (!destinataire) {
    alertes.push({ text: 'Destinataire non renseigné', badge: 'ATTENTION', score: -2 });
    score -= 2;
  }
  if (nbDocuments < 3) {
    alertes.push({ text: `Seulement ${nbDocuments} document(s) — vérifier la liste complète selon le régime`, badge: 'ATTENTION', score: -3 });
    score -= 3;
  }

  // ── Vérifications régime ──
  const regimeData = REGIMES[regime];
  if (regimeData?.suspensionDroits) {
    alertes.push({ text: `Régime ${regimeData.label} — caution bancaire et documents spécifiques requis`, badge: 'INFO', score: 0 });
  }

  // ── Calcul CAF si données disponibles ──
  let caf = null;
  if (fob > 0 && tauxChange > 0) {
    caf = calculerCAF({ fob, fret: fret || 0, assurance: assurance || 0, tauxChange, devise: 'devise' });
  }

  score = Math.max(0, Math.min(100, score));
  const qualite = score >= 90 ? 'EXCELLENTE' : score >= 75 ? 'BONNE' : score >= 60 ? 'ACCEPTABLE' : 'INSUFFISANTE';
  const couleur = score >= 90 ? 'green' : score >= 75 ? 'blue' : score >= 60 ? 'orange' : 'red';

  return {
    score,
    qualite,
    couleur,
    alertes,
    totalAlertes: alertes.length,
    caf,
    regimeInfo: regimeData || null,
    docsRequis: regimeData?.docsExtra || [],
    reference: 'BADR — Code des Douanes Maroc — Circulaire ADII n°6241',
  };
}

// ── Handler ──────────────────────────────────────────────────

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET — retourne les régimes disponibles (sans logique d'analyse)
  if (req.method === 'GET') {
    const regimes = Object.entries(REGIMES).map(([code, r]) => ({
      code,
      label: r.label,
      suspensionDroits: r.suspensionDroits,
      delaiMois: r.delaiMois,
    }));
    return res.status(200).json({ ok: true, regimes });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Méthode non autorisée' });
  }

  try {
    const { action, params } = req.body;

    if (!action || !params) {
      return res.status(400).json({ ok: false, error: 'action et params requis' });
    }

    let resultat: object;

    switch (action) {
      case 'calc_caf':
        resultat = calculerCAF(params);
        break;
      case 'analyser':
        resultat = analyserDUM(params);
        break;
      default:
        return res.status(400).json({ ok: false, error: `Action inconnue: ${action}` });
    }

    return res.status(200).json({ ok: true, ...resultat });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Erreur serveur' });
  }
}