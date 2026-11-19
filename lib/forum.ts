// lib/forum.ts — Forum des clients : réglages, contrôle d'accès, pièces jointes.
// Accès : tout compte connecté non suspendu (essai, offres payantes, Découverte, administrateur).
// Pièces jointes : bucket Supabase PRIVÉ « forum » ; liens signés (1 h) délivrés aux seuls membres connectés.
// Modération a posteriori : signalement par les membres, masquage depuis /backoffice/forum.
import type { NextApiRequest } from 'next'
import { promises as fs } from 'fs'
import crypto from 'crypto'
import formidable, { File as FormFile } from 'formidable'
import { compteAbonne, type CompteAbonne } from './compteAbonne'
import { supabaseAdmin } from './supabaseAdmin'

export { CATEGORIES, CATEGORIES_IDS } from './forumCategories'

export const MAX_FICHIERS_POST = 6
export const MAX_FICHIERS_COMMENTAIRE = 3
export const TAILLE_MAX = 10 * 1024 * 1024

export const TYPES: Record<string, { ext: string; image: boolean }> = {
  'image/jpeg': { ext: 'jpg', image: true },
  'image/png': { ext: 'png', image: true },
  'image/webp': { ext: 'webp', image: true },
  'image/gif': { ext: 'gif', image: true },
  'application/pdf': { ext: 'pdf', image: false },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: 'docx', image: false },
  'application/msword': { ext: 'doc', image: false },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { ext: 'xlsx', image: false },
  'application/vnd.ms-excel': { ext: 'xls', image: false },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { ext: 'pptx', image: false },
  'text/plain': { ext: 'txt', image: false },
  'text/csv': { ext: 'csv', image: false },
}

export type Piece = { path: string; nom: string; type: string; taille: number; image: boolean; url?: string }

export type Membre = CompteAbonne & { admin: boolean }

export async function membreForum(req: NextApiRequest): Promise<Membre | null> {
  const c = await compteAbonne(req)
  if (!c || (!c.abonne && !c.decouverte)) return null
  return { ...c, admin: c.role === 'admin' || c.role === 'generaladmin' }
}

/** Nom affiché : prénom, initiale du nom, société (jamais l'e-mail). */
export function auteur(u: any): { nom: string; societe: string | null; initiales: string; equipe: boolean } {
  const prenom = String(u?.prenom || '').trim()
  const nom = String(u?.nom || '').trim()
  const affiche = prenom ? `${prenom}${nom ? ' ' + nom[0].toUpperCase() + '.' : ''}` : nom ? nom : 'Membre'
  const ini = ((prenom[0] || '') + (nom[0] || '')).toUpperCase() || 'M'
  const equipe = u?.role === 'admin' || u?.role === 'generaladmin'
  return { nom: equipe ? `${affiche} · Équipe Import-eXPert` : affiche, societe: u?.raison_sociale || u?.societe || null, initiales: ini, equipe }
}

/** Lecture d'un formulaire multipart (texte + fichiers « fichiers »). */
export async function lireFormulaire(req: NextApiRequest, maxFichiers: number) {
  const form = formidable({ maxFiles: maxFichiers, maxFileSize: TAILLE_MAX, maxTotalFileSize: maxFichiers * TAILLE_MAX, allowEmptyFiles: false, minFileSize: 1 })
  const [fields, files] = (await form.parse(req)) as [any, any]
  const champ = (k: string) => { const v = fields[k]; return String((Array.isArray(v) ? v[0] : v) ?? '') }
  const brut = files.fichiers
  const liste: FormFile[] = Array.isArray(brut) ? brut : brut ? [brut] : []
  return { champ, fichiers: liste }
}

/** Contrôle et envoi des fichiers dans le bucket « forum ». Renvoie les pièces ou une erreur. */
export async function deposer(userId: string, fichiers: FormFile[]): Promise<{ pieces: Piece[]; erreur?: string }> {
  const pieces: Piece[] = []
  for (const f of fichiers) {
    const t = TYPES[f.mimetype || '']
    if (!t) return { pieces, erreur: `Format non accepté : ${f.originalFilename || 'fichier'} (images, PDF, Word, Excel, PowerPoint, texte)` }
  }
  const sb = supabaseAdmin()
  for (const f of fichiers) {
    const t = TYPES[f.mimetype || '']
    const path = `${userId}/${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.${t.ext}`
    const up = await sb.storage.from('forum').upload(path, await fs.readFile(f.filepath), { contentType: f.mimetype || undefined, upsert: false })
    if (up.error) {
      if (pieces.length) await sb.storage.from('forum').remove(pieces.map(p => p.path))
      console.error('[forum] upload', up.error)
      return { pieces: [], erreur: 'Envoi du fichier impossible, réessayez.' }
    }
    const nom = (f.originalFilename || `fichier.${t.ext}`).replace(/[\\/<>"]/g, '_').slice(0, 140)
    pieces.push({ path, nom, type: f.mimetype || '', taille: f.size, image: t.image })
  }
  return { pieces }
}

/** Ajoute des liens signés (1 h) aux pièces jointes de plusieurs éléments. */
export async function signer<T extends { pieces: Piece[] }>(elements: T[]): Promise<T[]> {
  const paths = elements.flatMap(e => (e.pieces || []).map(p => p.path))
  if (!paths.length) return elements
  const { data } = await supabaseAdmin().storage.from('forum').createSignedUrls(paths, 3600)
  const urls = new Map((data ?? []).map((d: any) => [d.path, d.signedUrl]))
  return elements.map(e => ({ ...e, pieces: (e.pieces || []).map(p => ({ ...p, url: urls.get(p.path) || undefined })) }))
}

export async function supprimerFichiers(pieces: Piece[] | null | undefined) {
  const paths = (pieces || []).map(p => p.path).filter(Boolean)
  if (paths.length) await supabaseAdmin().storage.from('forum').remove(paths)
}

export const nettoyer = (s: string, max: number) => String(s || '').replace(/\r\n/g, '\n').replace(/\n{4,}/g, '\n\n\n').trim().slice(0, max)
