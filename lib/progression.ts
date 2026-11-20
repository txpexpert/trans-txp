// lib/progression.ts
// Progression du parcours : un module est « fait » quand l'utilisateur a produit
// quelque chose avec (pas une simple visite). Pour l'étape Qualifier, c'est la
// fiche produit qui valide les modules, section par section.
import { supabaseAdmin } from './supabaseAdmin'
import { CHAIN } from './suite'

export type Fiche = Record<string, any>

// Règle de validation de chaque module de Qualifier par la fiche produit.
export const REGLES_QUALIFIER: Record<string, { action: string; fait: (f: Fiche) => boolean }> = {
  '/modules/classement':             { action: 'Code SH retenu', fait: f => !!f.code_sh },
  '/modules/decisions-classement':   { action: 'Décision rattachée (ou aucune)', fait: f => !!f.decision_ref },
  '/modules/documents-sh':           { action: 'Liste des documents établie', fait: f => Array.isArray(f.documents) && f.documents.length > 0 },
  '/modules/autorisations-licences': { action: 'Contrôle MIC vérifié', fait: f => ['oui', 'non'].includes(f.controle_mic) },
  '/modules/substances-dangereuses': { action: 'Statut de marchandise dangereuse renseigné', fait: f => ['oui', 'non'].includes(f.dangereuse) },
  '/modules/marquage-warnings':      { action: 'Étiquetage vérifié', fait: f => f.marquage === 'conforme' },
  '/accords':                        { action: 'Origine et accord renseignés', fait: f => !!f.pays_origine && !!f.accord },
}

/** Enregistre les modules de Qualifier validés par une fiche (sans jamais en retirer). */
export async function enregistrerDepuisFiche(userId: string, fiche: Fiche) {
  const rows = Object.entries(REGLES_QUALIFIER)
    .filter(([, r]) => r.fait(fiche))
    .map(([module]) => ({ user_id: userId, etape: 'qualifier', module, source: `fiche:${fiche.id}` }))
  if (!rows.length) return
  await supabaseAdmin().from('progression').upsert(rows, { onConflict: 'user_id,module', ignoreDuplicates: true })
}

/** Une fiche est complète quand elle valide les 7 modules de Qualifier. */
export function ficheComplete(f: Fiche) {
  return Object.values(REGLES_QUALIFIER).every(r => r.fait(f))
}

/** État de la progression d'un utilisateur, étape par étape. */
export async function etatProgression(userId: string) {
  const { data } = await supabaseAdmin().from('progression').select('module, etape, fait_le').eq('user_id', userId)
  const faits = new Set((data ?? []).map(r => r.module))
  return CHAIN.map(e => ({
    etape: e.slug,
    verb: e.verb,
    total: e.tools.length,
    faits: e.tools.filter(t => faits.has(t.path)).length,
    modules: e.tools.map(t => ({
      path: t.path, label: t.label, fait: faits.has(t.path),
      action: e.slug === 'qualifier' ? REGLES_QUALIFIER[t.path]?.action ?? null : null,
    })),
  }))
}
