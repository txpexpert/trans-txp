// ============================================================
// ROUTE PROTÉGÉE — pages/api/calculs/vlw.ts
// Simulateur pénalités douanières — Art. 76 ter LF 2026
// Calcul exposition aux majorations paiement non électronique
// Jamais envoyé au navigateur — invisible en F12
// ============================================================

import type { NextApiRequest, NextApiResponse } from 'next';

// ── Barèmes et seuils (jamais exposés) ───────────────────────

const BAREME_VLW = {
  // Art. 76 ter — Majoration paiement non électronique
  majoration_pct: 0.01,          // 1% des droits dus
  majoration_min: 1000,          // Minimum 1 000 MAD par infraction
  non_deductible: true,          // Non déductible fiscalement
  reference: 'Art. 76 ter — Loi de Finances 2026',

  // Taux LF 2026 — données réglementaires
  tbi_bois_2026: 0.06,           // TBI bois taux unique 6% (Ch. 44 + 94)
  tbi_bois_2025: 0.12,           // TBI bois 2025 (avant réforme)
  taux_di_medicaments: { min: 0.025, max: 0.30 }, // Ch. 30 — 2,5% à 30%

  // Seuils droit supplétif enregistrement immobilier (Art. 133-III CGI)
  seuil_immo: 300000,
  taux_immo: 0.02,
};

// ── Formules de calcul (jamais exposées) ─────────────────────

function calculerPenalitesVLW(params: {
  droitsParOperation: number;
  nombreOperations: number;
  periode: string;
}): object {
  const { droitsParOperation, nombreOperations } = params;

  const droitsTotaux = droitsParOperation * nombreOperations;

  // Art. 76 ter — Majoration 1% avec minimum 1000 MAD/infraction
  const majorationBrute = droitsTotaux * BAREME_VLW.majoration_pct;
  const majorationMinimum = BAREME_VLW.majoration_min * nombreOperations;
  const majorationAppliquee = Math.max(majorationBrute, majorationMinimum);

  // Scénarios de risque
  const risqueFaible   = droitsParOperation < 50000;
  const risqueMoyen    = droitsParOperation >= 50000 && droitsParOperation < 200000;
  const risqueEleve    = droitsParOperation >= 200000;

  const niveauRisque = risqueEleve ? 'ÉLEVÉ' : risqueMoyen ? 'MOYEN' : 'FAIBLE';
  const couleurRisque = risqueEleve ? 'red' : risqueMoyen ? 'orange' : 'green';

  return {
    droitsTotaux:        Math.round(droitsTotaux),
    majorationAppliquee: Math.round(majorationAppliquee),
    majorationBrute:     Math.round(majorationBrute),
    majorationMinimum:   Math.round(majorationMinimum),
    coutParOperation:    Math.round(majorationAppliquee / Math.max(nombreOperations, 1)),
    niveauRisque,
    couleurRisque,
    nonDeductible: BAREME_VLW.non_deductible,
    economieEnConformite: Math.round(majorationAppliquee),
    reference: BAREME_VLW.reference,
  };
}

function calculerTBIBois(params: {
  valeurCAF: number;
  annee: '2025' | '2026';
  chapitreNC: '44' | '94';
}): object {
  const { valeurCAF, annee } = params;
  const taux = annee === '2026' ? BAREME_VLW.tbi_bois_2026 : BAREME_VLW.tbi_bois_2025;
  const tbi  = valeurCAF * taux;

  return {
    valeurCAF:   Math.round(valeurCAF),
    taux:        taux * 100,
    tbi:         Math.round(tbi),
    annee,
    note: annee === '2026'
      ? 'Taux unique 6% — réforme LF 2026 (remplace les taux multiples)'
      : 'Taux 12% — LF 2025 (avant réforme)',
    reference: annee === '2026' ? 'Art. 5 LF 2026' : 'LF 2025',
  };
}

// ── Handler ──────────────────────────────────────────────────

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET — retourne les barèmes LF 2026 (sans les formules)
  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      lf2026: {
        art76ter: {
          majoration_pct: '1%',
          minimum_par_infraction: '1 000 MAD',
          non_deductible: true,
        },
        tbi_bois: { taux_2026: '6% (taux unique)', taux_2025: '12%', chapitres: 'Ch. 44 + Ch. 94' },
        bovins_vivants: { chapitre: '01.02', mesure: 'Exo. DI + TVA', limite: '300 000 têtes', periode: '2026' },
        camelides: { chapitre: '01.06', mesure: 'Exo. DI + TVA', limite: '10 000 têtes', periode: '2026' },
        pates_alimentaires: { chapitre: '19.02', mesure: 'Exo. TVA import', taux: '0% TVA', periode: '2026' },
        sang_derives: { chapitre: '30.02', mesure: 'Exo. TVA import', taux: '0% TVA', periode: '2026' },
      },
      version: 'LF 2026 — Circulaire ADII',
    });
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
      case 'penalites':
        resultat = calculerPenalitesVLW(params);
        break;
      case 'tbi_bois':
        resultat = calculerTBIBois(params);
        break;
      default:
        return res.status(400).json({ ok: false, error: `Action inconnue: ${action}` });
    }

    return res.status(200).json({ ok: true, ...resultat });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Erreur serveur' });
  }
}