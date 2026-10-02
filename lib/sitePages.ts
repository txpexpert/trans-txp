// lib/sitePages.ts
// ============================================================
// Catalogue des pages du site vers lesquelles le copilote peut
// rediriger l'utilisateur.
//
// Principe de sécurité : le modèle ne génère JAMAIS d'URL. Il choisit
// un `slug` dans ce catalogue (contrainte `enum` du schéma de sortie),
// et c'est le serveur qui construit le lien. Une URL inventée est donc
// impossible par construction.
//
// Le catalogue est filtré selon le palier de l'utilisateur
// (canAccessModule) : on ne propose jamais une page que l'abonné ne
// peut pas ouvrir.
//
// Pour ajouter une page : une ligne ici suffit. `description` est lue
// par le modèle pour choisir la bonne page — y mettre les mots que
// l'utilisateur emploierait dans sa question.
// ============================================================

import { canAccessModule, type Plan, type Statut } from './moduleAccess'

export type SitePage = {
  slug: string        // = code module dans MODULE_ACCESS (sert aussi au contrôle d'accès)
  path: string        // chemin relatif sur le site
  title: string       // libellé affiché sur le bouton
  description: string // aide au choix pour le modèle
}

export const SITE_PAGES: SitePage[] = [
  { slug: 'classement', path: '/modules/classement', title: 'Classement tarifaire SH', description: 'Recherche de code SH / position tarifaire parmi 17 224 codes, nomenclature, taux de droit d\'un produit' },
  { slug: 'decisions-classement', path: '/modules/decisions-classement', title: 'Décisions de classement ADII', description: 'Décisions officielles de classement tarifaire par produit, circulaire ou code SH' },
  { slug: 'documents-sh', path: '/modules/documents-sh', title: 'Documents requis par code SH', description: 'Documents, autorisations et formalités exigés selon le code SH du produit' },
  { slug: 'simulateur', path: '/modules/simulateur', title: 'Simulateur droits & taxes', description: 'Calcul des droits de douane, TVA import, taxes à l\'importation d\'une marchandise' },
  { slug: 'simulateur-fiscal', path: '/modules/simulateur-fiscal', title: 'Simulateur fiscal douanier', description: 'Simulation fiscale douanière détaillée, coût de revient import' },
  { slug: 'valeur-douane', path: '/modules/valeur-douane', title: 'Valeur en douane (OMC)', description: 'Détermination de la valeur en douane, méthodes OMC, frais à inclure, ajustements' },
  { slug: 'tic-reference', path: '/modules/tic-reference', title: 'TIC — Taxes intérieures de consommation', description: 'Taxes intérieures de consommation : produits soumis, taux' },
  { slug: 'origine-aleca', path: '/modules/origine-aleca', title: 'Origine ALECA / UE', description: 'Règles d\'origine, accords de libre-échange, EUR.1, préférences tarifaires UE' },
  { slug: 'comparateur', path: '/modules/comparateur', title: 'Comparateur de régimes douaniers', description: 'Comparer les régimes douaniers (admission temporaire, entrepôt, transit…)' },
  { slug: 'regimes-economiques', path: '/modules/regimes-economiques', title: 'Régimes économiques douaniers', description: 'Admission temporaire, perfectionnement actif, entrepôt sous douane, régimes suspensifs' },
  { slug: 'procedures-process', path: '/modules/procedures-process', title: 'Régimes & procédures', description: '22 procédures douanières pas à pas, codes régimes DUM' },
  { slug: 'procedures', path: '/modules/procedures', title: 'Procédures douanières', description: 'Procédures de dédouanement import/export' },
  { slug: 'verificateur-dum', path: '/modules/verificateur-dum', title: 'Vérificateur DUM', description: 'Contrôle et vérification d\'une déclaration DUM avant dépôt' },
  { slug: 'export', path: '/modules/export', title: 'Module Export', description: 'Exporter depuis le Maroc : guide, checklist, DDP, formalités export' },
  { slug: 'incoterms-shipping', path: '/modules/incoterms-shipping', title: 'Qui paie quoi ? Incoterms', description: 'Incoterms, répartition des frais vendeur/acheteur, termes armateurs, THC' },
  { slug: 'surestaries', path: '/modules/surestaries', title: 'Surestaries & pénalités', description: 'Surestaries, détention de conteneurs, magasinage, pénalités de retard' },
  { slug: 'calc-conteneurs', path: '/modules/calc-conteneurs', title: 'Calculateur de chargement conteneurs', description: 'Calcul du chargement d\'un conteneur 20/40 pieds, volume, nombre de colis' },
  { slug: 'calc-colis-sre', path: '/modules/calc-colis-sre', title: 'Calculateur colis & cartons', description: 'Dimensions, poids volumétrique, colisage' },
  { slug: 'tracking', path: '/modules/tracking', title: 'Tracking & intelligence logistique', description: 'Suivi d\'envois aériens et maritimes, fret, assurance' },
  { slug: 'carte-bureauxdouaniers', path: '/modules/carte-bureauxdouaniers', title: 'Carte des bureaux douaniers', description: 'Localisation et coordonnées des bureaux de douane au Maroc' },
  { slug: 'oea', path: '/modules/oea', title: 'OEA — Opérateur économique agréé', description: 'Statut OEA, conditions, avantages, procédure d\'obtention' },
  { slug: 'audit', path: '/modules/audit', title: 'Audit douanier', description: 'Évaluer sa conformité douanière, checklists, auto-évaluation' },
  { slug: 'risques', path: '/modules/risques', title: 'Contrôle des risques', description: 'Situations à risque, contrôles douaniers, actions correctives' },
  { slug: 'contentieux', path: '/modules/contentieux', title: 'Contentieux & litiges', description: 'Infractions douanières, sanctions, recours, transaction, procédure contentieuse' },
  { slug: 'autorisations-licences', path: '/modules/autorisations-licences', title: 'Autorisations et licences', description: 'Licences d\'importation, autorisations préalables, contrôles techniques' },
  { slug: 'marquage-warnings', path: '/modules/marquage-warnings', title: 'Marquage & signalisation', description: 'Étiquetage, marquage obligatoire des produits importés' },
  { slug: 'substances-dangereuses', path: '/modules/substances-dangereuses', title: 'Substances dangereuses', description: 'Marchandises dangereuses, classification, ONU, IMDG' },
  { slug: 'regime-change', path: '/modules/regime-change', title: 'Régime de change (IGOC 2026)', description: 'Office des changes, règlement des importations, domiciliation, devises' },
  { slug: 'veille-reglementaire', path: '/modules/veille-reglementaire', title: 'Veille réglementaire & LF 2026', description: 'Nouveautés réglementaires, loi de finances 2026, alertes ADII' },
  { slug: 'alertes-fiscales', path: '/modules/alertes-fiscales', title: 'Alertes fiscales', description: 'Alertes et changements fiscaux' },
  { slug: 'cgi-search', path: '/modules/cgi-search', title: 'Recherche fiscale CGI', description: 'Questions de fiscalité, Code général des impôts, TVA, IS, IR' },
  { slug: 'glossaire-douanier', path: '/modules/glossaire-douanier', title: 'Glossaire douanier FR/AR', description: 'Définition d\'un terme douanier, traduction français/arabe' },
  { slug: 'faq', path: '/modules/faq', title: 'FAQ douanière', description: 'Questions fréquentes des opérateurs sur le droit douanier' },
  { slug: 'transit-doc-generator', path: '/modules/transit-doc-generator', title: 'Suite documentaire transit', description: 'Génération de documents de transit et de dédouanement' },
  { slug: 'generateur-docs', path: '/modules/generateur-docs', title: 'Générateur de documents', description: 'Modèles de documents commerciaux et douaniers' },
  { slug: 'facilitation', path: '/modules/facilitation', title: 'Customs Facilitation Hub', description: 'Facilitation des échanges, AFE/OMC, guichet unique' },
  { slug: 'index-commerce', path: '/modules/index-commerce', title: 'Index du commerce international', description: 'Statistiques et indicateurs du commerce international' },
  { slug: 'intelligence-import', path: '/modules/intelligence-import', title: 'Intelligence import', description: 'Analyse des importations, sourcing, marchés fournisseurs' },
  { slug: 'analyses', path: '/modules/analyses', title: 'Analyses stratégiques', description: 'Rapports de marché, ZLECAf, accords commerciaux régionaux' },
  { slug: 'abonnements', path: '/abonnements', title: 'Abonnements & tarifs', description: 'Prix des abonnements, paliers, quotas, essai gratuit, facturation' },
]

// Pages publiques (hors matrice MODULE_ACCESS) : toujours proposables.
const PUBLIC_SLUGS = new Set(['abonnements'])

/** Pages accessibles au palier de l'utilisateur. */
export function pagesForUser(plan: Plan, statut: Statut, trialEnds?: number): SitePage[] {
  return SITE_PAGES.filter(
    (p) => PUBLIC_SLUGS.has(p.slug) || canAccessModule(plan, statut, p.slug, trialEnds)
  )
}

export function findPage(slug: string | undefined, allowed: SitePage[]): SitePage | null {
  if (!slug) return null
  return allowed.find((p) => p.slug === slug) ?? null
}

// ---- Action "contact" -------------------------------------------------------
// Le module Conseil Personnalisé n'est ouvert qu'à certains paliers : les
// autres abonnés sont orientés vers la page Contact publique.

export type ChatAction = {
  type: 'lien' | 'contact'
  label: string
  url: string
}

export function contactAction(plan: Plan, statut: Statut, trialEnds?: number): ChatAction {
  if (canAccessModule(plan, statut, 'conseil', trialEnds)) {
    return { type: 'contact', label: 'Contacter nos experts — Conseil Personnalisé', url: '/modules/conseil' }
  }
  return { type: 'contact', label: 'Contacter notre équipe d\'experts', url: '/contact' }
}

export function linkAction(page: SitePage): ChatAction {
  return { type: 'lien', label: `Voir la page : ${page.title}`, url: page.path }
}
