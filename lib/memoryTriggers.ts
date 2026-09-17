// lib/memoryTriggers.ts
// ============================================================
// Détection simple, par expression régulière, d'une demande
// explicite de mémorisation dans le message de l'utilisateur.
// Volontairement conservateur : on ne mémorise QUE ce que
// l'utilisateur demande explicitement de retenir, jamais par
// extraction automatique du contenu de la conversation (ça
// éviterait de stocker n'importe quoi sans contrôle, et ça reste
// prévisible pour l'utilisateur : il sait ce qu'il a demandé
// de retenir).
// ============================================================

const TRIGGER_PATTERNS: RegExp[] = [
  /(?:retiens|m[ée]morise|note|n['’]oublie pas)\s+(?:bien\s+)?(?:que|:)\s*(.+)/i,
]

/**
 * Retourne le contenu à mémoriser si le message contient une formule
 * déclencheuse ("retiens que...", "mémorise que...", etc.), sinon null.
 */
export function extractMemoryFromMessage(message: string): string | null {
  for (const pattern of TRIGGER_PATTERNS) {
    const match = message.match(pattern)
    if (match?.[1] && match[1].trim().length > 3) {
      return match[1].trim().replace(/[.!]+$/, '')
    }
  }
  return null
}

/**
 * Génère une clé unique et lisible pour user_memories.key, à partir
 * du contenu (utile pour le débogage dans Supabase Studio) + un
 * suffixe temporel pour garantir l'unicité (contrainte unique(user_id, key)).
 */
export function generateMemoryKey(content: string): string {
  const slug = content
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // enlève les accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40)
  return `note-${slug}-${Date.now()}`
}
