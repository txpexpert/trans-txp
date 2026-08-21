// lib/rate-limit.ts
// Configuration du rate limiting via Upstash Redis (projet : credible-mantis-85606)
// Niveau 1 (homepage)   : 20 requêtes / minute par IP
// Niveau 2 (stratégique): 5 requêtes / minute par IP

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Le client Redis est configuré automatiquement via les variables d'environnement :
// UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN
const redis = Redis.fromEnv();

/**
 * Rate limiter pour le chat homepage (Niveau 1)
 * Fenêtre glissante de 1 minute — 20 requêtes max
 */
export const rateLimitHomepage = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  prefix: "rl:homepage",
 // Optionnel : active les métriques Upstash Dashboard
});

/**
 * Rate limiter pour le chat stratégique (Niveau 2)
 * Fenêtre glissante de 1 minute — 5 requêtes max
 * (appels plus coûteux : web search + 2000 tokens)
 */
export const rateLimitStrategic = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  prefix: "rl:strategic",
   // ← SUPPRIMER cette ligne
});

/**
 * Extrait l'IP réelle du client depuis les headers Next.js.
 * Gère les proxies Vercel (x-forwarded-for).
 */
export function getClientIP(req: { headers: Record<string, string | string[] | undefined> }): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0].trim();
  }
  return "anonymous";
}
