// lib/produits.ts — données d'une page publique par position SH (4 chiffres) : lignes du tarif 2026,
// décisions de classement et textes qui la citent. Utilisé côté serveur (pages /produits).
import { supabaseAdmin } from './supabaseAdmin'
import { ajouterLibellesComplets } from './tarifLibelle'

// Intitulés des positions absentes du tarif chargé (seules leurs sous-positions y figurent) : libellés du système harmonisé.
const INTITULES: Record<string, string> = {
  '1211': 'Plantes, parties de plantes, graines et fruits utilisés principalement en parfumerie, en médecine ou à usages insecticides, parasiticides ou similaires',
  '2907': 'Phénols ; phénols-alcools',
  '8421': 'Centrifugeuses, y compris les essoreuses centrifuges ; appareils pour la filtration ou l’épuration des liquides ou des gaz',
  '8544': 'Fils, câbles et autres conducteurs isolés pour l’électricité ; câbles de fibres optiques',
}
const net = (s: string | null) => (s || '').replace(/\s+/g, ' ').replace(/[\s:;,.]+$/, '').trim()

export type LigneTarif = { code: string; libelle: string; taux: number | null; unite: string | null }
export type Position = {
  sh4: string; chapitre: number; libelle: string
  lignes: LigneTarif[]; min: number | null; max: number | null
  decisions: { circulaire: string; date: string | null; designation: string; code: string; resume: string | null }[]
  textes: { type: string; numero: string; date: string | null; titre: string | null; cite: string | null }[]
  maj: string
}

export async function chargerPosition(sh4: string): Promise<Position | null> {
  if (!/^\d{4}$/.test(sh4)) return null
  const db = supabaseAdmin()
  const [{ data: tete }, { data: feuilles }, { data: dec }, { data: txt }] = await Promise.all([
    db.from('tarifs').select('designation_clean').eq('code_sh', sh4 + '000000').order('est_feuille', { ascending: true }).limit(1),
    db.from('tarifs').select('code_sh, designation_clean, taux_droit, unite_norm, est_feuille').like('code_sh', sh4 + '%').eq('est_feuille', true).order('code_sh').limit(250),
    db.from('decisions_classement').select('circulaire, date_circulaire, designation, code_sh, resume').like('code_sh', `${sh4.slice(0, 4)}%`).order('date_circulaire', { ascending: false }).limit(12),
    db.rpc('textes_position', { p_sh4: sh4, p_limite: 10 }),
  ])
  // les décisions peuvent être saisies avec des points (9028.30…) : second passage
  let decisions = dec ?? []
  if (!decisions.length) {
    const { data: d2 } = await db.from('decisions_classement').select('circulaire, date_circulaire, designation, code_sh, resume').like('code_sh', `${sh4}.%`).order('date_circulaire', { ascending: false }).limit(12)
    decisions = d2 ?? []
  }
  if (!feuilles?.length) return null
  let libelle = net(tete?.[0]?.designation_clean ?? null) || INTITULES[sh4] || ''
  if (!libelle) {
    const { data: n3 } = await db.from('tarifs').select('designation_clean').like('code_sh', sh4 + '%').order('niveau').order('code_sh').limit(1)
    libelle = `Position ${sh4}` + (n3?.[0]?.designation_clean ? ` : ${net(n3[0].designation_clean)}, …` : '')
  }
  const complets = await ajouterLibellesComplets(db, feuilles.map(f => ({ code_sh: f.code_sh, designation_clean: f.designation_clean })))
  const lignes: LigneTarif[] = feuilles.map((f, i) => {
    const parts = complets[i].libelle_complet.split(' › ')
    if (parts.length > 1 && parts[0].toLowerCase() === libelle.toLowerCase()) parts.shift()
    return { code: f.code_sh, libelle: parts.join(' › ') || net(f.designation_clean), taux: f.taux_droit != null ? Number(f.taux_droit) : null, unite: f.unite_norm || null }
  })
  const taux = lignes.map(l => l.taux).filter((x): x is number => x != null)
  return {
    sh4, chapitre: parseInt(sh4.slice(0, 2), 10), libelle, lignes,
    min: taux.length ? Math.min(...taux) : null, max: taux.length ? Math.max(...taux) : null,
    decisions: decisions.map(d => ({ circulaire: d.circulaire, date: d.date_circulaire, designation: d.designation, code: d.code_sh, resume: d.resume ? String(d.resume).slice(0, 320) : null })),
    textes: ((txt ?? []) as any[]).map(t => ({ type: t.type_document, numero: t.numero, date: t.date_doc, titre: t.titre, cite: t.cite })),
    maj: new Date().toISOString(),
  }
}

export async function resumePositions(codes: string[]) {
  const { data } = await supabaseAdmin().rpc('resume_positions', { p_codes: codes })
  const m = new Map(((data ?? []) as any[]).map(r => [r.sh4, r]))
  return codes.map(c => {
    const r: any = m.get(c) || {}
    return { sh4: c, libelle: net(r.libelle ?? null) || INTITULES[c] || `Position ${c}`,
      min: r.min_taux != null ? Number(r.min_taux) : null, max: r.max_taux != null ? Number(r.max_taux) : null, lignes: Number(r.lignes || 0) }
  })
}
