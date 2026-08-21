// ============================================================
// ROUTE PROTÉGÉE — pages/api/calculs/conteneurs.ts
// Algorithme d'optimisation chargement conteneurs & palettes
// Jamais envoyé au navigateur — invisible en F12
// ============================================================

import type { NextApiRequest, NextApiResponse } from 'next';

// ── Données référentielles des conteneurs (jamais exposées) ──

const CONTENEURS: Record<string, { W: number; L: number; H: number; payload: number; label: string }> = {
  '20STD': { W: 2352, L: 5900, H: 2393, payload: 28180, label: "20' Standard" },
  '40STD': { W: 2352, L: 12032, H: 2393, payload: 26680, label: "40' Standard" },
  '40HC':  { W: 2352, L: 12032, H: 2698, payload: 26330, label: "40' High Cube" },
  '45HC':  { W: 2352, L: 13556, H: 2698, payload: 27700, label: "45' High Cube" },
};

// ── Algorithme d'optimisation (jamais exposé) ─────────────────

function calcMaxPalettes(
  cont: { W: number; L: number },
  pW: number,
  pL: number,
  orient: 'standard' | 'mixte'
): number {
  const o1 = Math.floor(cont.W / pW) * Math.floor(cont.L / pL);
  const o2 = Math.floor(cont.W / pL) * Math.floor(cont.L / pW);

  if (orient === 'standard') return Math.max(o1, o2);

  // Mode mixte : split horizontal du conteneur
  const h = Math.floor(cont.L / 2);
  const o3 = Math.floor(cont.W / pW) * Math.floor(h / pL) +
             Math.floor(cont.W / pL) * Math.floor((cont.L - h) / pW);
  const o4 = Math.floor(cont.W / pL) * Math.floor(h / pW) +
             Math.floor(cont.W / pW) * Math.floor((cont.L - h) / pL);

  return Math.max(o1, o2, o3, o4);
}

function calculerChargement(
  conteneurCode: string,
  palettes: Array<{
    id: string;
    nom: string;
    largeur: number;   // mm
    longueur: number;  // mm
    hauteur: number;   // mm
    hauteurConteneur: number; // mm (si empilage)
    chargeKg: number;
    poidsTotal: number; // kg
    quantite: number;
    orient: 'standard' | 'mixte';
  }>
): object {
  const cont = CONTENEURS[conteneurCode];
  if (!cont) throw new Error(`Conteneur inconnu: ${conteneurCode}`);

  const aireConteneur = cont.W * cont.L; // mm²
  let poidsTotal = 0;
  let aireUtilisee = 0;
  let totalCharge = 0;

  const lignes = palettes
    .filter(p => p.quantite > 0)
    .map(p => {
      const maxParCouche = calcMaxPalettes(
        cont,
        p.largeur,
        p.longueur,
        p.orient
      );
      // Calcul nombre de couches possibles
      const nbCouches = p.hauteurConteneur > 0
        ? Math.floor((cont.H - 50) / p.hauteurConteneur) // 50mm marge sécurité
        : 1;
      const capaciteMax = maxParCouche * nbCouches;
      const qteChargee  = Math.min(p.quantite, capaciteMax);
      const poidsPalette = p.chargeKg + p.poidsTotal; // charge + tare palette
      const poidsLigne   = qteChargee * poidsPalette;
      const aireLigne    = qteChargee * (p.largeur * p.longueur);

      poidsTotal   += poidsLigne;
      aireUtilisee += aireLigne;
      totalCharge  += qteChargee;

      return {
        id:           p.id,
        nom:          p.nom,
        quantiteDemandee: p.quantite,
        quantiteChargee:  qteChargee,
        maxParCouche,
        nbCouches,
        capaciteMax,
        poidsLigne:   Math.round(poidsLigne),
        aireMm2:      Math.round(aireLigne),
      };
    });

  const occupationPct = aireConteneur > 0
    ? (aireUtilisee / aireConteneur) * 100
    : 0;

  const payloadOk    = poidsTotal <= cont.payload;
  const surcharge    = Math.max(0, poidsTotal - cont.payload);

  return {
    conteneur:      { ...cont, code: conteneurCode },
    lignes,
    totaux: {
      poidsTotal:     Math.round(poidsTotal),
      payloadMax:     cont.payload,
      payloadRestant: Math.max(0, Math.round(cont.payload - poidsTotal)),
      payloadOk,
      surchargeKg:    Math.round(surcharge),
      occupationPct:  Math.round(occupationPct * 10) / 10,
      totalPalettes:  totalCharge,
    },
  };
}

// ── Handler ──────────────────────────────────────────────────

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET — retourne la liste des conteneurs disponibles (sans algorithme)
  if (req.method === 'GET') {
    const liste = Object.entries(CONTENEURS).map(([code, c]) => ({
      code,
      label: c.label,
      payload: c.payload,
    }));
    return res.status(200).json({ ok: true, conteneurs: liste });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Méthode non autorisée' });
  }

  try {
    const { conteneur = '20STD', palettes = [] } = req.body;

    if (!palettes || palettes.length === 0) {
      return res.status(400).json({ ok: false, error: 'Aucune palette fournie' });
    }

    const resultat = calculerChargement(conteneur, palettes);
    return res.status(200).json({ ok: true, ...resultat });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message || 'Erreur serveur' });
  }
}
