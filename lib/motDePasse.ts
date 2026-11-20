// lib/motDePasse.ts — règles communes des mots de passe des comptes clients (2026-11-14)
import crypto from 'crypto'

export const MIN_MOT_DE_PASSE = 12
export const DUREE_LIEN_MS = 60 * 60 * 1000 // lien de réinitialisation : 1 heure

export type Langue = 'fr' | 'ar'

/** Renvoie un message d'erreur (dans la langue demandée), ou null si le mot de passe est acceptable. */
export function verifierMotDePasse(mdp: string, email?: string, langue: Langue = 'fr'): string | null {
  const ar = langue === 'ar'
  if (!mdp || mdp.length < MIN_MOT_DE_PASSE) return ar ? `كلمة المرور قصيرة جدًا (${MIN_MOT_DE_PASSE} حرفًا على الأقل).` : `Mot de passe trop court (${MIN_MOT_DE_PASSE} caractères minimum).`
  if (mdp.length > 200) return ar ? 'كلمة المرور طويلة جدًا (200 حرف كحد أقصى).' : 'Mot de passe trop long (200 caractères maximum).'
  if (!/[A-Za-zÀ-ÿ\u0600-\u06FF]/.test(mdp) || !/[0-9٠-٩]/.test(mdp)) return ar ? 'يجب أن تحتوي كلمة المرور على حرف واحد ورقم واحد على الأقل.' : 'Le mot de passe doit contenir au moins une lettre et un chiffre.'
  if (email && mdp.toLowerCase().includes(email.toLowerCase().split('@')[0])) return ar ? 'يجب ألا تتضمن كلمة المرور عنوان بريدكم الإلكتروني.' : 'Le mot de passe ne doit pas contenir votre adresse email.'
  return null
}

/** Langue d'une requête API : champ « langue » du corps ou de l'URL, sinon cookie de langue du site. */
export function langueRequete(req: { body?: any; query?: any; cookies?: Record<string, string | undefined> }): Langue {
  const v = req.body?.langue || req.query?.langue || req.cookies?.ixp_lang
  return v === 'ar' ? 'ar' : 'fr'
}

export function nouveauJeton(): { jeton: string; empreinte: string } {
  const jeton = crypto.randomBytes(32).toString('base64url')
  return { jeton, empreinte: empreinteJeton(jeton) }
}

export function empreinteJeton(jeton: string): string {
  return crypto.createHash('sha256').update(jeton).digest('hex')
}
