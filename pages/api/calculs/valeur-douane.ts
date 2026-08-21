// ============================================================
// ROUTE PROTÉGÉE — pages/api/calculs/valeur-douane.ts
// 5 méthodes de détermination de la valeur en douane (GATT/OMC)
// Jamais envoyé au navigateur — invisible en F12
// ============================================================

import type { NextApiRequest, NextApiResponse } from 'next';

// ── Méthodes de calcul (jamais exposées) ─────────────────────

/**
 * Méthode 1 — Valeur transactionnelle (art. 23 Code Douanes)
 * Base : prix effectivement payé + ajustements
 */
function methode1(params: {
  prixFacture: number;
  fraisTransport: number;
  fraisAssurance: number;
  commissions: number;
  redevances: number;
  fraisEmballage: number;
  autresAjustements: number;
  tauxChange: number;
  devise: string;
}): object {
  const {
    prixFacture, fraisTransport, fraisAssurance, commissions,
    redevances, fraisEmballage, autresAjustements, tauxChange
  } = params;

  const prixMAD    = prixFacture * tauxChange;
  const ajoutsMAD  = (fraisTransport + fraisAssurance + commissions +
                      redevances + fraisEmballage + autresAjustements) * tauxChange;
  const valeurCAF  = prixMAD + ajoutsMAD;

  return {
    methode: 1,
    libelle: 'Valeur transactionnelle',
    reference: 'Art. 23 Code des Douanes — Accord OMC/GATT 1994',
    detail: {
      prixFactureMAD:   Math.round(prixMAD),
      ajoutsMAD:        Math.round(ajoutsMAD),
      composantes: {
        transport:     Math.round(fraisTransport * tauxChange),
        assurance:     Math.round(fraisAssurance * tauxChange),
        commissions:   Math.round(commissions * tauxChange),
        redevances:    Math.round(redevances * tauxChange),
        emballage:     Math.round(fraisEmballage * tauxChange),
        autres:        Math.round(autresAjustements * tauxChange),
      },
    },
    valeurCAF: Math.round(valeurCAF),
  };
}

/**
 * Méthode 2 — Valeur transactionnelle marchandises identiques
 */
function methode2(params: {
  valeurMarchandisesIdentiques: number;
  ajustementQuantite: number;
  ajustementNiveau: number;
}): object {
  const { valeurMarchandisesIdentiques, ajustementQuantite, ajustementNiveau } = params;
  const valeurCAF = valeurMarchandisesIdentiques + ajustementQuantite + ajustementNiveau;
  return {
    methode: 2,
    libelle: 'Marchandises identiques',
    reference: 'Art. 24 Code des Douanes',
    valeurCAF: Math.round(valeurCAF),
    detail: {
      baseIdentique: Math.round(valeurMarchandisesIdentiques),
      ajustQuantite: Math.round(ajustementQuantite),
      ajustNiveau:   Math.round(ajustementNiveau),
    },
  };
}

/**
 * Méthode 3 — Valeur transactionnelle marchandises similaires
 */
function methode3(params: {
  valeurMarchandisesSimilaires: number;
  ajustementQuantite: number;
  ajustementNiveau: number;
}): object {
  const { valeurMarchandisesSimilaires, ajustementQuantite, ajustementNiveau } = params;
  const valeurCAF = valeurMarchandisesSimilaires + ajustementQuantite + ajustementNiveau;
  return {
    methode: 3,
    libelle: 'Marchandises similaires',
    reference: 'Art. 25 Code des Douanes',
    valeurCAF: Math.round(valeurCAF),
    detail: {
      baseSimilaire: Math.round(valeurMarchandisesSimilaires),
      ajustQuantite: Math.round(ajustementQuantite),
      ajustNiveau:   Math.round(ajustementNiveau),
    },
  };
}

/**
 * Méthode 4 — Valeur déductive (prix de vente sur marché intérieur)
 */
function methode4(params: {
  prixVenteInterieur: number;
  commission: number;
  margeBenefice: number;
  fraisGeneraux: number;
  droitsTaxes: number;
  fraisApresImportation: number;
}): object {
  const {
    prixVenteInterieur, commission, margeBenefice,
    fraisGeneraux, droitsTaxes, fraisApresImportation
  } = params;

  const deductions = commission + margeBenefice + fraisGeneraux +
                     droitsTaxes + fraisApresImportation;
  const valeurCAF  = Math.max(0, prixVenteInterieur - deductions);

  return {
    methode: 4,
    libelle: 'Valeur déductive',
    reference: 'Art. 26 Code des Douanes',
    valeurCAF: Math.round(valeurCAF),
    detail: {
      prixVente:    Math.round(prixVenteInterieur),
      deductions:   Math.round(deductions),
      composantes: {
        commission:          Math.round(commission),
        margeBenefice:       Math.round(margeBenefice),
        fraisGeneraux:       Math.round(fraisGeneraux),
        droitsTaxes:         Math.round(droitsTaxes),
        fraisApresImport:    Math.round(fraisApresImportation),
      },
    },
  };
}

/**
 * Méthode 5 — Valeur calculée (coût de production + marge)
 */
function methode5(params: {
  coutMatieresPremières: number;
  coutFabrication: number;
  coutMOeuvre: number;
  fraisGeneraux: number;
  beneficeMarge: number;
  fraisTransport: number;
  fraisAssurance: number;
}): object {
  const {
    coutMatieresPremières, coutFabrication, coutMOeuvre,
    fraisGeneraux, beneficeMarge, fraisTransport, fraisAssurance
  } = params;

  const coutProduction = coutMatieresPremières + coutFabrication + coutMOeuvre;
  const valeurCAF = coutProduction + fraisGeneraux + beneficeMarge +
                    fraisTransport + fraisAssurance;

  return {
    methode: 5,
    libelle: 'Valeur calculée',
    reference: 'Art. 27 Code des Douanes',
    valeurCAF: Math.round(valeurCAF),
    detail: {
      coutProduction: Math.round(coutProduction),
      composantes: {
        matieres:    Math.round(coutMatieresPremières),
        fabrication: Math.round(coutFabrication),
        mainOeuvre:  Math.round(coutMOeuvre),
        fraisGen:    Math.round(fraisGeneraux),
        marge:       Math.round(beneficeMarge),
        transport:   Math.round(fraisTransport),
        assurance:   Math.round(fraisAssurance),
      },
    },
  };
}

// ── Handler ──────────────────────────────────────────────────

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Méthode non autorisée' });
  }

  try {
    const { methode, params } = req.body;

    if (!methode || !params) {
      return res.status(400).json({ ok: false, error: 'Paramètres manquants: methode et params requis' });
    }

    let resultat: object;

    switch (methode) {
      case 1: resultat = methode1(params); break;
      case 2: resultat = methode2(params); break;
      case 3: resultat = methode3(params); break;
      case 4: resultat = methode4(params); break;
      case 5: resultat = methode5(params); break;
      default:
        return res.status(400).json({ ok: false, error: `Méthode ${methode} invalide (1-5)` });
    }

    return res.status(200).json({ ok: true, ...resultat });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Erreur serveur' });
  }
}