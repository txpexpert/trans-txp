// lib/motDePasse.ts — règles communes des mots de passe des comptes clients (2026-11-14)
import crypto from 'crypto'

export const MIN_MOT_DE_PASSE = 12
export const DUREE_LIEN_MS = 60 * 60 * 1000 // lien de réinitialisation : 1 heure

/** Renvoie un message d'erreur, ou null si le mot de passe est acceptable. */
export function verifierMotDePasse(mdp: string, email?: string): string | null {
  if (!mdp || mdp.length < MIN_MOT_DE_PASSE) return `Mot de passe trop court (${MIN_MOT_DE_PASSE} caractères minimum).`
  if (mdp.length > 200) return 'Mot de passe trop long (200 caractères maximum).'
  if (!/[A-Za-zÀ-ÿ]/.test(mdp) || !/[0-9]/.test(mdp)) return 'Le mot de passe doit contenir au moins une lettre et un chiffre.'
  if (email && mdp.toLowerCase().includes(email.toLowerCase().split('@')[0])) return 'Le mot de passe ne doit pas contenir votre adresse email.'
  return null
}

export function nouveauJeton(): { jeton: string; empreinte: string } {
  const jeton = crypto.randomBytes(32).toString('base64url')
  return { jeton, empreinte: empreinteJeton(jeton) }
}

export function empreinteJeton(jeton: string): string {
  return crypto.createHash('sha256').update(jeton).digest('hex')
}
