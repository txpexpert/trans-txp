// lib/sujetsContact.ts — sujets des liens « /contact?sujet=… » : libellé affiché et message prérempli.
export const SUJETS: Record<string, { titre: string; message: string }> = {
  'echange-expert': { titre: 'Échange de 20 minutes avec un expert', message: 'Je souhaite un échange de 20 minutes avec un expert pour relire mon diagnostic.' },
  entreprise: { titre: 'Offre Entreprise', message: 'Je souhaite échanger sur l’offre Entreprise pour notre équipe.' },
  partenaire: { titre: 'Programme partenaires', message: 'Je souhaite rejoindre le programme partenaires et recevoir un lien à notre nom.' },
  'pack-expert': { titre: 'Pack expert', message: 'Je souhaite commander un pack expert.' },
  presse: { titre: 'Contact presse', message: 'Demande presse concernant le Baromètre 2026.' },
  'calculateur-dum': { titre: 'Argent laissé sur la table', message: 'J’ai utilisé le calculateur sur mes DUM et souhaite faire vérifier les montants récupérables.' },
  'lf-2027': { titre: 'Loi de finances 2027', message: 'Je suis intéressé par une session sur la loi de finances 2027 pour mon profil.' },
}
