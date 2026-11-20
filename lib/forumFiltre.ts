// lib/forumFiltre.ts — Filtre appliqué à l'envoi des messages du forum (nov. 2026).
// Le forum n'a pas de modérateur permanent : les contenus à risque sont refusés avant publication.
// Refusés : numéros de téléphone, adresses e-mail, numéros de DUM ou de facture, démarchage.
// Les codes SH (ex. 0702.00.00.10) ne sont pas pris pour des numéros de téléphone.

type Regle = { motif: RegExp; message: string }

const REGLES: Regle[] = [
  {
    motif: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
    message: 'les adresses e-mail',
  },
  {
    // +212 / 00212 suivi de 9 chiffres, ou 05/06/07 + 8 chiffres écrits avec espaces ou tirets ;
    // un numéro collé (0612345678) n'est refusé qu'avec un mot-clé (règle suivante), pour épargner les codes SH
    motif: /(?:\+|00)\s?212[\s.-]?(?:\(0\))?[\s.-]?[5-7](?:[\s.-]?\d){8}(?!\d)|(?<![\d.])0[5-7](?:[ -]\d{2}){4}(?![\d.])/i,
    message: 'les numéros de téléphone',
  },
  {
    motif: /\b(?:t[ée]l[ée]?(?:phone)?|gsm|whats?app|portable)\s*[:.]?\s*\+?\d[\d\s.-]{7,}\d/i,
    message: 'les numéros de téléphone',
  },
  {
    motif: /\bD\.?U\.?M\.?\s*(?:n[°ºo]\.?|num(?:[ée]ro)?\.?|r[ée]f(?:[ée]rence)?\.?)?\s*[:#]?\s*\d(?:[\s/.-]?\d){5,}/i,
    message: 'les numéros de DUM',
  },
  {
    motif: /\bfactures?\s*(?:n[°ºo]\.?|num(?:[ée]ro)?\.?|r[ée]f(?:[ée]rence)?\.?)\s*[:#]?\s*[A-Z]{0,4}[-/]?\d{3,}/i,
    message: 'les numéros de facture',
  },
  {
    motif: /\b(?:wa\.me|chat\.whatsapp\.com|t\.me)\/|\b(?:contactez[- ]moi|contactez[- ]nous|en\s+mp|en\s+priv[ée]|d[ée]marchage|promo(?:tion)?\s+exceptionnelle|prix\s+imbattables?|offre\s+sp[ée]ciale|nos\s+services\s+de|je\s+(?:vous\s+)?propose\s+mes\s+services)\b/i,
    message: 'le démarchage et la publicité',
  },
]

/** Renvoie un message d'erreur si le texte enfreint la charte, sinon null. */
export function controleForum(texte: string): string | null {
  const t = String(texte || '')
  if (!t.trim()) return null
  for (const r of REGLES) {
    if (r.motif.test(t)) return `Message refusé : la charte du forum interdit ${r.message}. Retirez-les (ou anonymisez-les) puis renvoyez votre message.`
  }
  return null
}
