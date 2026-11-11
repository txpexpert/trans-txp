// lib/quotas.ts — limites par palier (fonctions du compte).
// Découverte : 3 fiches produits, pour une première victoire sans engagement.
// Pro : 50 références suivies ; Premium : 120 (décision du 11/11/2026).
// Essai : sans limite, pour ne pas freiner l'activation. Entreprise : sur contrat, illimité. null = illimité.
export const QUOTA_FICHES: Record<'decouverte' | 'decouverte_cabinet' | 'trial' | 'pro' | 'premium' | 'enterprise', number | null> = {
  decouverte: 3,
  decouverte_cabinet: 10,   // client invité par un transitaire Premium (licence Cabinet)
  trial: null,
  pro: 50,
  premium: 120,
  enterprise: null,
}
export function quotaFiches(c: { abonne: boolean; plan: string }): number | null {
  if (!c.abonne) return (c as any).cabinet ? QUOTA_FICHES.decouverte_cabinet : QUOTA_FICHES.decouverte
  if ((c as any).role === 'admin' || (c as any).role === 'generaladmin') return null
  return (QUOTA_FICHES as any)[c.plan] ?? null
}
