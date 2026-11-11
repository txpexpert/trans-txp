// lib/portail.ts — portail transitaire : constantes et emails de notification.
import { randomBytes } from 'crypto'
import { sendEmail } from './email'

export const STATUTS: { k: string; l: string }[] = [
  { k: 'pieces_attendues', l: 'Pièces attendues' },
  { k: 'en_preparation', l: 'Déclaration en préparation' },
  { k: 'depose', l: 'Déclaration déposée' },
  { k: 'dedouane', l: 'Marchandise dédouanée' },
  { k: 'clos', l: 'Dossier clos' },
]
export const LIB_STATUT = Object.fromEntries(STATUTS.map(s => [s.k, s.l])) as Record<string, string>
export const ETATS_PIECE = ['demandee', 'fournie', 'validee'] as const

export const nouveauJeton = () => randomBytes(18).toString('base64url')
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))

export function nettoyerPieces(v: any) {
  if (!Array.isArray(v)) return []
  return v.slice(0, 40).filter(p => p && String(p.nom || '').trim()).map(p => ({
    nom: String(p.nom).trim().slice(0, 200),
    etat: ETATS_PIECE.includes(p.etat) ? p.etat : 'demandee',
    note: p.note ? String(p.note).slice(0, 500) : null,
    maj: p.maj || null,
  }))
}

const cadre = (titre: string, corps: string) => `<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#14120F">
  <div style="padding:18px 0;border-bottom:2px solid #A8822F"><b style="font-size:17px">${titre}</b></div>${corps}
  <p style="font-size:12px;color:#7A7168;margin-top:26px;border-top:1px solid #E6DCC7;padding-top:12px">Message envoyé via le portail Import-eXPert.</p></div>`

export async function notifierClient(p: { client_email: string | null; client_nom: string; reference: string | null }, emetteur: string, lien: string, quoi: string) {
  if (!p.client_email) return { ok: false }
  return sendEmail({
    to: p.client_email,
    subject: `${emetteur} : ${quoi}${p.reference ? ` (${p.reference})` : ''}`,
    html: cadre(esc(emetteur), `<p>Bonjour ${esc(p.client_nom)},</p><p>${esc(quoi)}${p.reference ? ` pour le dossier <b>${esc(p.reference)}</b>` : ''}.</p>
      <p><a href="${lien}" style="display:inline-block;background:#14120F;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none">Ouvrir mon dossier</a></p>
      <p style="font-size:13px;color:#3B3631">Ce lien est personnel : il donne accès à votre dossier sans mot de passe.</p>`),
  })
}

export async function notifierTransitaire(to: string, p: { client_nom: string; reference: string | null }, piece: string, note: string | null, lien: string) {
  return sendEmail({
    to,
    subject: `Pièce reçue de ${p.client_nom}${p.reference ? ` (${p.reference})` : ''} : ${piece}`,
    html: cadre('Portail clients · Import-eXPert', `<p><b>${esc(p.client_nom)}</b> indique avoir transmis la pièce <b>${esc(piece)}</b>${p.reference ? ` pour le dossier ${esc(p.reference)}` : ''}.</p>
      ${note ? `<p style="padding:10px 12px;background:#F7F2E8;border-radius:8px">« ${esc(note)} »</p>` : ''}
      <p><a href="${lien}" style="display:inline-block;background:#14120F;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none">Valider la pièce</a></p>`),
  })
}
