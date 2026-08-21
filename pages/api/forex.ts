// pages/api/forex.ts
// Taux de change DH (MAD) — source ExchangeRate-API (plan gratuit 1 500 req/mois)
// Fallback statique si quota dépassé ou réseau indisponible

import type { NextApiRequest, NextApiResponse } from 'next'   // ✅ FIX 1 — import manquant ajouté

// ── Fallback statique (mis à jour manuellement) ───────────────────────────────
const FALLBACK: Record<string, number> = {
  EUR: 10.85,
  USD: 9.97,
  GBP: 13.40,
  CNY: 1.38,
  SAR: 2.65,
  AED: 2.71,
  CAD: 7.20,
  CHF: 11.20,
  JPY: 0.067,
  XOF: 0.0165,
}

export interface ForexRate {
  pair: string   // ex: "EUR"
  rate: number   // MAD par 1 unité devise
  change: number // variation % sur 24h (0 si fallback)
  source: 'live' | 'fallback'
}

export interface ForexResponse {
  rates: ForexRate[]
  updatedAt: string
  source: 'live' | 'fallback'
}

export type ForexRates = ForexRate  // ✅ FIX 2 — alias déplacé au niveau module (hors handler)

// Cache en mémoire (durée de vie : 15 min)
let cache: { data: ForexResponse; ts: number } | null = null
const CACHE_TTL = 15 * 60 * 1000

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ForexResponse>
) {
  // Cache valide ?
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return res.status(200).json(cache.data)
  }

  const PAIRS = ['EUR', 'USD', 'GBP', 'CNY', 'SAR', 'AED', 'CAD', 'CHF']

  try {
    // ExchangeRate-API — plan gratuit (1 500 req/mois, pas de clé requise pour base endpoint)
    // URL: https://open.er-api.com/v6/latest/MAD  → retourne combien de MAD pour 1 unité
    // On inverse : MAD/devise = 1 / (devise/MAD)
    const url = 'https://open.er-api.com/v6/latest/MAD'
    const r = await fetch(url)

    if (!r.ok) throw new Error(`HTTP ${r.status}`)

    const json = await r.json()

    // json.rates contient combien d'unités par 1 MAD
    // Donc 1 EUR = 1 / json.rates.EUR MAD
    const rates: ForexRate[] = PAIRS.map(pair => {
      const ratePerMAD = json.rates?.[pair]
      const madPerUnit = ratePerMAD ? 1 / ratePerMAD : FALLBACK[pair]
      return {
        pair,
        rate: Math.round(madPerUnit * 1000) / 1000,
        change: 0, // ExchangeRate-API gratuit ne donne pas la variation
        source: ratePerMAD ? 'live' : 'fallback',
      }
    })

    const data: ForexResponse = {
      rates,
      updatedAt: new Date().toISOString(),
      source: 'live',
    }

    cache = { data, ts: Date.now() }
    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=300')
    return res.status(200).json(data)

  } catch (err) {
    console.error('[forex] fetch failed, using fallback:', err)

    const rates: ForexRate[] = PAIRS.map(pair => ({
      pair,
      rate: FALLBACK[pair] ?? 0,
      change: 0,
      source: 'fallback',
    }))

    const data: ForexResponse = {
      rates,
      updatedAt: new Date().toISOString(),
      source: 'fallback',
    }

    cache = { data, ts: Date.now() - CACHE_TTL + 60_000 } // retry dans 1 min
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json(data)
  }
}                                                             // ✅ FIX 3 — accolade fermante handler au bon endroit

