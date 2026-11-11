// lib/ar.ts — interface en arabe : textes à faire valider par un locuteur natif avant mise en avant.
// Tant que AR_VALIDE est faux, les pages arabes ne sont pas indexées par les moteurs de recherche.
export const AR_VALIDE = false
export const chiffreAr = (n: number) => n.toLocaleString('fr-FR')   // chiffres occidentaux, usage courant au Maroc
