// lib/forumJour.ts — Forum : une conversation par jour.
// Le fil repart à zéro chaque nuit à 2 h (heure du Maroc) : seuls les messages
// publiés depuis le dernier 2 h sont affichés et peuvent recevoir des réponses.
// Les messages des jours précédents restent en base (modération, /backoffice/forum),
// les annonces épinglées par l'équipe restent visibles.
// Compatible navigateur et serveur (aucun import).

export const FUSEAU_FORUM = 'Africa/Casablanca'
export const HEURE_REMISE_A_ZERO = 2

/** Décalage (ms) entre l'heure locale du fuseau et l'heure UTC à l'instant donné. */
function decalage(instant: Date, fuseau: string): number {
  const f = new Intl.DateTimeFormat('en-GB', {
    timeZone: fuseau, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
  const v: Record<string, number> = {}
  for (const p of f.formatToParts(instant)) if (p.type !== 'literal') v[p.type] = Number(p.value)
  const local = Date.UTC(v.year, v.month - 1, v.day, v.hour, v.minute, v.second)
  return local - Math.floor(instant.getTime() / 1000) * 1000
}

/** Début de la journée de forum en cours : le dernier 2 h (heure du Maroc) passé. */
export function debutJourneeForum(maintenant: Date = new Date()): Date {
  const d = decalage(maintenant, FUSEAU_FORUM)
  const local = new Date(maintenant.getTime() + d) // heure du Maroc lue en UTC
  const debut = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), HEURE_REMISE_A_ZERO))
  if (local.getUTCHours() < HEURE_REMISE_A_ZERO) debut.setUTCDate(debut.getUTCDate() - 1)
  return new Date(debut.getTime() - d)
}

/** Titre technique tiré du message (la colonne titre reste obligatoire en base). */
export function titreAuto(contenu: string, aDesFichiers: boolean): string {
  const t = String(contenu || '').replace(/\s+/g, ' ').trim()
  if (t.length >= 3) return t.length > 80 ? t.slice(0, 79) + '…' : t
  return aDesFichiers ? 'Pièce jointe' : 'Message'
}
