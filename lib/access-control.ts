export type Tier = 'anonymous' | 'trial' | 'subscriber' | 'expired'

export interface Profile {
  id: string
  trial_ends_at: string
  subscription_status: string
}

export function resolveTier(profile: Profile | null): Tier {
  if (!profile) return 'anonymous'
  if (profile.subscription_status === 'active') return 'subscriber'
  if (new Date() < new Date(profile.trial_ends_at)) return 'trial'
  return 'expired'
}

export const FREE_PATHS = [
  '/',
  '/tarifs-abonnement',
  '/a-propos',
  '/contact',
]
