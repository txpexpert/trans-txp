/**
 * logger.ts — Transit-IA
 * Service de logging asynchrone vers Supabase (table chat_logs).
 */

import { createClient } from '@supabase/supabase-js';

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      console.warn('[logger] Supabase non configuré — logging désactivé.');
      return null;
    }
    supabase = createClient(url, key);
  }
  return supabase;
}

// ── Alias typé pour éviter les erreurs sur tables non générées ────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fromAny = (sb: ReturnType<typeof createClient>, table: string) =>
  (sb as any).from(table);

export interface ChatLogEntry {
  sessionId: string;
  module: string;
  persona: string;
  query: string;
  reply: string;
  ragScore: number;
  chunksUsed: number;
  tokensUsed?: number;
  level: 1 | 2;
  userId?: string;
  searchDecision?: string;
  latencyMs?: number;
  error?: string;
}

export async function logChat(entry: ChatLogEntry): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  try {
    const { error } = await fromAny(sb, 'chat_logs').insert({
      session_id:      entry.sessionId,
      module:          entry.module,
      persona:         entry.persona,
      query:           entry.query.slice(0, 2000),
      reply_preview:   entry.reply.slice(0, 500),
      rag_score:       entry.ragScore,
      chunks_used:     entry.chunksUsed,
      tokens_used:     entry.tokensUsed     ?? null,
      api_level:       entry.level,
      user_id:         entry.userId         ?? null,
      search_decision: entry.searchDecision ?? null,
      latency_ms:      entry.latencyMs      ?? null,
      error_message:   entry.error          ?? null,
      created_at:      new Date().toISOString(),
    });
    if (error) console.error('[logger] insert error:', error.message);
  } catch (err) {
    console.error('[logger] logChat exception:', err);
  }
}

export async function getDailyCost(date?: string): Promise<{
  totalTokens: number;
  estimatedCostUSD: number;
  requestCount: number;
} | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const targetDate = date ?? new Date().toISOString().split('T')[0];
  try {
    const { data, error } = await fromAny(sb, 'chat_logs')
      .select('tokens_used')
      .gte('created_at', `${targetDate}T00:00:00.000Z`)
      .lt('created_at',  `${targetDate}T23:59:59.999Z`);
    if (error) throw error;

    const rows         = (data ?? []) as { tokens_used: number | null }[];
    const totalTokens  = rows.reduce((s, r) => s + (r.tokens_used ?? 0), 0);
    const requestCount = rows.length;
    const costUSD      = ((totalTokens * 0.6) / 1e6) * 3 + ((totalTokens * 0.4) / 1e6) * 15;
    return { totalTokens, estimatedCostUSD: Math.round(costUSD * 100) / 100, requestCount };
  } catch (err) {
    console.error('[logger] getDailyCost error:', err);
    return null;
  }
}

export async function checkCostAlert(thresholdUSD = 5): Promise<boolean> {
  const cost = await getDailyCost();
  if (!cost) return false;
  if (cost.estimatedCostUSD >= thresholdUSD) {
    console.warn(`[ALERTE COÛT] $${cost.estimatedCostUSD} — ${cost.requestCount} requêtes — seuil $${thresholdUSD}`);
    return true;
  }
  return false;
}

export interface DashboardStats {
  today: { requests: number; costUSD: number; avgRagScore: number };
  topModules:  { module:  string; count: number }[];
  topPersonas: { persona: string; count: number }[];
}

export async function getDashboardStats(): Promise<DashboardStats | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const today = new Date().toISOString().split('T')[0];
  try {
    const { data } = await fromAny(sb, 'chat_logs')
      .select('tokens_used, rag_score, module, persona')
      .gte('created_at', `${today}T00:00:00.000Z`);

    const rows = (data ?? []) as { tokens_used: number | null; rag_score: number | null; module: string; persona: string }[];
    const requests    = rows.length;
    const totalTokens = rows.reduce((s, r) => s + (r.tokens_used ?? 0), 0);
    const avgRagScore = requests > 0 ? rows.reduce((s, r) => s + (r.rag_score ?? 0), 0) / requests : 0;
    const costUSD     = Math.round((((totalTokens * 0.6) / 1e6) * 3 + ((totalTokens * 0.4) / 1e6) * 15) * 100) / 100;

    const moduleCounts:  Record<string, number> = {};
    const personaCounts: Record<string, number> = {};
    for (const row of rows) {
      moduleCounts[row.module]   = (moduleCounts[row.module]   ?? 0) + 1;
      personaCounts[row.persona] = (personaCounts[row.persona] ?? 0) + 1;
    }

    return {
      today: { requests, costUSD, avgRagScore: Math.round(avgRagScore * 100) / 100 },
      topModules:  Object.entries(moduleCounts).map(([module, count])   => ({ module,  count })).sort((a,b) => b.count - a.count).slice(0, 5),
      topPersonas: Object.entries(personaCounts).map(([persona, count]) => ({ persona, count })).sort((a,b) => b.count - a.count).slice(0, 5),
    };
  } catch (err) {
    console.error('[logger] getDashboardStats error:', err);
    return null;
  }
}
