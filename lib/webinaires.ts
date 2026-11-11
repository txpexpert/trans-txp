// lib/webinaires.ts — campagne Loi de finances 2027 : session principale en direct public (sans
// inscription ni collecte de données) et, en option, des sessions par profil ouvertes selon la demande.
// À compléter fin décembre 2026, après la parution de la loi de finances : dates, liens, contenu.
export const LF2027 = {
  publie: false,            // passer à true quand le texte est intégré et la page complétée
  principale: { titre: 'Loi de finances 2027 : ce qui change au 1er janvier pour vos importations', duree: '45 minutes + questions', date: null as string | null, lien: null as string | null, replay: null as string | null },
  // Option : sessions courtes par profil, ouvertes si la demande le justifie (activer une à une)
  sessionsProfils: [
    { id: 'pme', titre: 'PME importatrices : vos coûts et vos documents en 2027', duree: '30 minutes', active: false, date: null as string | null, lien: null as string | null },
    { id: 'transitaire', titre: 'Transitaires : ce qui change dans vos déclarations', duree: '30 minutes', active: false, date: null as string | null, lien: null as string | null },
    { id: 'daf', titre: 'Directions financières : l’impact sur le coût rendu et l’exposition', duree: '30 minutes', active: false, date: null as string | null, lien: null as string | null },
  ],
}
