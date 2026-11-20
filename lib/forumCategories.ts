// lib/forumCategories.ts — rubriques du forum (importable côté client ; doit rester identique
// à la contrainte forum_posts.categorie de la migration 0013).
export const CATEGORIES: { id: string; label: string }[] = [
  { id: 'general', label: 'Discussions générales' },
  { id: 'classement', label: 'Classement tarifaire' },
  { id: 'origine', label: 'Origine et accords' },
  { id: 'regimes', label: 'Régimes économiques' },
  { id: 'procedures', label: 'Procédures et dédouanement' },
  { id: 'logistique', label: 'Transport et logistique' },
  { id: 'fiscalite', label: 'Fiscalité et change' },
  { id: 'annonces', label: 'Annonces de l’équipe' },
]
export const CATEGORIES_IDS = CATEGORIES.map(c => c.id)
