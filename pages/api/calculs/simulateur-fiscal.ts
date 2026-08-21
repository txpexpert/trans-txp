// ============================================================
// ROUTE PROTÉGÉE — pages/api/calculs/simulateur-fiscal.ts
// Formules côté serveur : DI, TVA Art.96 CGI, TIC, PFI, Antidumping
// Jamais envoyé au navigateur — invisible en F12
// ============================================================

import type { NextApiRequest, NextApiResponse } from 'next';

// ── Formules internes (jamais exposées) ──────────────────────

function calculerDI(cafMAD: number, tauxDI: number): number {
  return cafMAD * (tauxDI / 100);
}

function calculerTIC(cafMAD: number, mode: 'ad_valorem' | 'specifique', taux: number): number {
  if (mode === 'ad_valorem') return cafMAD * (taux / 100);
  return taux; // montant fixe spécifique
}

function calculerPFI(cafMAD: number): number {
  // PFI = 0.25% de la valeur CAF — Art. LF 2023
  return cafMAD * 0.0025;
}

function calculerAntidumping(cafMAD: number, tauxAnti: number): number {
  return cafMAD * (tauxAnti / 100);
}

function calculerTVA(
  cafMAD: number,
  DI: number,
  TIC: number,
  PFI: number,
  ANTI: number,
  tauxTVA: number
): { baseTVA: number; TVA: number } {
  // Art. 96 CGI — TVA cascadante sur (CAF + DI + TIC + PFI + ANTI)
  const baseTVA = cafMAD + DI + TIC + PFI + ANTI;
  const TVA = baseTVA * (tauxTVA / 100);
  return { baseTVA, TVA };
}

function arrond(n: number, dec = 2): number {
  return Math.round(n * 10 ** dec) / 10 ** dec;
}

// ── Handler ──────────────────────────────────────────────────

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS pour pages HTML dans /public
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Méthode non autorisée' });
  }

  try {
    const {
      cafMAD,
      tauxDI = 0,
      tauxTVA = 20,
      ticActif = false,
      ticMode = 'ad_valorem',
      ticTaux = 0,
      pfiActif = false,
      antiActif = false,
      tauxAnti = 0,
      accord = 'aucun',
    } = req.body;

    if (!cafMAD || cafMAD <= 0) {
      return res.status(400).json({ ok: false, error: 'Valeur CAF invalide' });
    }

    // Application des accords commerciaux sur le taux DI
    let tauxDIEffectif = tauxDI;
    if (accord === 'aleca') tauxDIEffectif = 0;
    else if (accord === 'agadir') tauxDIEffectif = tauxDI * 0.5;
    // autres accords à compléter selon votre liste

    const DI   = calculerDI(cafMAD, tauxDIEffectif);
    const TIC  = ticActif  ? calculerTIC(cafMAD, ticMode, ticTaux)  : 0;
    const PFI  = pfiActif  ? calculerPFI(cafMAD)                    : 0;
    const ANTI = antiActif ? calculerAntidumping(cafMAD, tauxAnti)  : 0;

    const { baseTVA, TVA } = calculerTVA(cafMAD, DI, TIC, PFI, ANTI, tauxTVA);

    const TOTAL = DI + TIC + PFI + ANTI + TVA;
    const tauxEffectif = cafMAD > 0 ? (TOTAL / cafMAD) * 100 : 0;

    return res.status(200).json({
      ok: true,
      resultats: {
        cafMAD:        arrond(cafMAD),
        DI:            arrond(DI),
        TIC:           arrond(TIC),
        PFI:           arrond(PFI),
        ANTI:          arrond(ANTI),
        baseTVA:       arrond(baseTVA),
        TVA:           arrond(TVA),
        TOTAL:         arrond(TOTAL),
        tauxEffectif:  arrond(tauxEffectif),
        accordApplique: accord,
        tauxDIEffectif: arrond(tauxDIEffectif),
      },
      reference: 'Art. 96 CGI — Dahir 1977 Code des Douanes — LF 2025',
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Erreur serveur' });
  }
}