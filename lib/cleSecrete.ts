// lib/cleSecrete.ts — clés de signature des sessions (2026-11-14)
// Compatible Node et Edge (aucun import).
//
// Sur Vercel (production comme préversions), une clé absente n'est plus
// remplacée par une valeur de secours écrite dans le code : la signature
// échoue, ce qui empêche toute connexion plutôt que d'accepter des jetons
// fabriqués avec une clé connue. La valeur de secours ne sert qu'en local
// (npm run dev, où VERCEL_ENV n'est pas défini ou vaut « development »).

function surVercel(): boolean {
  const env = process.env.VERCEL_ENV
  return !!env && env !== 'development'
}

/** Clé des sessions clients : USER_SECRET, à défaut ADMIN_SECRET. */
export function cleSessionClient(): string {
  const s = process.env.USER_SECRET || process.env.ADMIN_SECRET
  if (s) return s
  if (surVercel()) throw new Error('USER_SECRET absent : sessions clients désactivées')
  return 'dev-secret'
}

/** Clé des sessions backoffice : ADMIN_SECRET. */
export function cleSessionAdmin(): string {
  const s = process.env.ADMIN_SECRET
  if (s) return s
  if (surVercel()) throw new Error('ADMIN_SECRET absent : sessions backoffice désactivées')
  return 'fallback-dev-secret'
}
