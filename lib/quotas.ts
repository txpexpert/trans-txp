// lib/quotas.ts — limites par palier (fonctions du compte).
// Découverte : 3 fiches produits, pour une première victoire sans engagement.
// Pro et Premium : illimité tant que l'unité de valeur n'est pas arrêtée
// (hypothèse du plan marketing : 50 références suivies en Pro, 300 en Premium).
// null = illimité.
export const QUOTA_FICHES: Record<'decouverte' | 'trial' | 'pro' | 'premium' | 'enterprise', number | null> = {
  decouverte: 3,
  trial: null,
  pro: null,
  premium: null,
  enterprise: null,
}
export function quotaFiches(c: { abonne: boolean; plan: string }): number | null {
  if (!c.abonne) return QUOTA_FICHES.decouverte
  return (QUOTA_FICHES as any)[c.plan] ?? null
}
