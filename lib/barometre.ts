// lib/barometre.ts — questions du Baromètre 2026 (mêmes questions, dans le même ordre, que public/tools/enquete-barometre.html).
export type QuestionBarometre = { id: string; type: 'one' | 'many'; max?: number; t: string; o: string[] }
export const SEUIL_PUBLICATION = 30   // résultats publiés à partir de ce nombre de répondants
export const SEUIL_AGREGATS = 10      // en dessous, aucun pourcentage n'est diffusé (anonymat)
export const QUESTIONS: QuestionBarometre[] = [
 {
  "id": "profil",
  "type": "one",
  "t": "Quel est votre profil ?",
  "o": [
   "Importateur industriel",
   "PME importatrice",
   "Transitaire ou commissionnaire",
   "Exportateur sous régimes économiques",
   "Direction financière ou contrôle de gestion",
   "Autre"
  ]
 },
 {
  "id": "volume",
  "type": "one",
  "t": "Combien de déclarations (DUM) traitez-vous par an ?",
  "o": [
   "Moins de 50",
   "De 50 à 200",
   "De 200 à 1 000",
   "Plus de 1 000"
  ]
 },
 {
  "id": "bureaux",
  "type": "many",
  "t": "Par quels points d’entrée passent vos opérations ?",
  "o": [
   "Port de Tanger Med",
   "Port de Casablanca",
   "Port d’Agadir",
   "Port de Jorf Lasfar",
   "Aéroport Mohammed V",
   "Bureaux intérieurs et MEAD",
   "Frontières terrestres",
   "Autre"
  ]
 },
 {
  "id": "delai",
  "type": "one",
  "t": "Quel est votre délai moyen de dédouanement, de l’arrivée à l’enlèvement ?",
  "o": [
   "Moins de 24 heures",
   "De 1 à 3 jours",
   "De 3 à 7 jours",
   "Plus de 7 jours",
   "Je ne sais pas"
  ]
 },
 {
  "id": "retards",
  "type": "many",
  "max": 3,
  "t": "Quelles sont les principales causes de retard ?",
  "o": [
   "Documents manquants ou incomplets",
   "Contrôles techniques (normes, ONSSA…)",
   "Classement tarifaire contesté",
   "Valeur contestée",
   "Preuve d’origine refusée ou incomplète",
   "Titre d’importation ou domiciliation",
   "Paiement des droits et garanties",
   "Visite physique et disponibilité du service",
   "Systèmes informatiques (BADR, PortNet)"
  ]
 },
 {
  "id": "erreurs",
  "type": "many",
  "t": "Quelles difficultés de conformité avez-vous rencontrées ces trois dernières années ?",
  "o": [
   "Classement SH",
   "Valeur en douane (fret, redevances, commissions)",
   "Origine ou préférence refusée",
   "Comptes de régimes économiques échus",
   "Licences et autorisations",
   "Étiquetage et normes",
   "Aucune difficulté notable"
  ]
 },
 {
  "id": "controle",
  "type": "one",
  "t": "Avez-vous fait l’objet d’un contrôle a posteriori ou d’un redressement ces trois dernières années ?",
  "o": [
   "Jamais",
   "Une fois",
   "Plusieurs fois",
   "Je ne sais pas"
  ]
 },
 {
  "id": "ale",
  "type": "many",
  "t": "Quels accords de libre-échange utilisez-vous ?",
  "o": [
   "Union européenne",
   "Turquie",
   "États-Unis",
   "AELE (Suisse, Norvège…)",
   "Accord d’Agadir",
   "Royaume-Uni",
   "Zone arabe de libre-échange",
   "ZLECAf",
   "Aucun"
  ]
 },
 {
  "id": "freins",
  "type": "many",
  "t": "Qu’est-ce qui vous empêche d’utiliser davantage les préférences tarifaires ?",
  "o": [
   "Méconnaissance des accords",
   "Règles d’origine trop complexes",
   "Le fournisseur ne fournit pas les preuves",
   "Coût administratif trop élevé",
   "Crainte d’un contrôle a posteriori",
   "Rien : nous les exploitons pleinement"
  ]
 },
 {
  "id": "regimes",
  "type": "many",
  "t": "Quels régimes économiques utilisez-vous ?",
  "o": [
   "Admission temporaire pour perfectionnement actif",
   "Admission temporaire en l’état",
   "Entrepôt de douane",
   "Transformation sous douane",
   "Zone d’accélération industrielle",
   "Drawback",
   "Aucun"
  ]
 },
 {
  "id": "outils",
  "type": "many",
  "t": "Avec quels outils pilotez-vous la conformité douanière ?",
  "o": [
   "Tableurs",
   "ERP",
   "Logiciel douane dédié",
   "Uniquement via le transitaire",
   "Assistant ou outil d’IA",
   "Aucun outil formalisé"
  ]
 },
 {
  "id": "priorites",
  "type": "many",
  "max": 3,
  "t": "Quelles sont vos priorités pour les douze prochains mois ?",
  "o": [
   "Réduire les délais de dédouanement",
   "Sécuriser le classement tarifaire",
   "Mieux exploiter les accords de libre-échange",
   "Maîtriser le coût rendu",
   "Mieux apurer les régimes économiques",
   "Obtenir ou renouveler le statut OEA",
   "Former les équipes",
   "Digitaliser la fonction douane"
  ]
 }
]
