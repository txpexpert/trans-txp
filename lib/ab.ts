// lib/ab.ts — test A/B de l'accroche de l'accueil (trois signatures du plan marketing).
// Attribution par un cookie technique (ixp_ab = A, B ou C), sans identifiant ni donnée personnelle ;
// mesure par compteurs agrégés (table compteurs_evenements) : vues de l'accueil et diagnostics commencés.
export const VARIANTES = {
  A: { avant: 'Ce que la douane contrôlera demain,', apres: 'vérifiez-le aujourd’hui' },
  B: { avant: 'Importez', apres: 'sans mauvaise surprise' },
  C: { avant: 'Votre importation coûte plus cher', apres: 'que votre facture' },
} as const
export type Variante = keyof typeof VARIANTES
export const EVENEMENTS = ['accueil_vue', 'diagnostic_commence', 'diagnostic_termine', 'echange_demande', 'echange_vue', 'whatsapp_clic'] as const

export function lireVariante(cookie: string | undefined | null): Variante | null {
  const m = /(?:^|;\s*)ixp_ab=([ABC])/.exec(cookie || '')
  return m ? (m[1] as Variante) : null
}
