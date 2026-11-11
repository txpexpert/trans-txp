// lib/veille.ts
// Veille « mes produits » : décisions de classement et textes (circulaires, notes)
// qui citent les codes SH des fiches produits d'un compte. Le calcul est fait par
// la fonction SQL public.veille_produits (proximité : position, sous-position, position SH).
import { supabaseAdmin } from './supabaseAdmin'
import { sendEmail } from './email'

export type AlerteVeille = {
  fiche_id: string; designation: string; code_fiche: string; source: string; numero: string
  date_texte: string | null; titre: string | null; extrait: string | null; code_cite: string | null
  niveau: 'position' | 'sous-position' | 'position SH'; ajoute_le: string
}

export const LIB_SOURCE: Record<string, string> = {
  decision: 'Décision de classement', circulaire: 'Circulaire', note: 'Note', note_interne: 'Note', instruction_commune: 'Instruction commune',
}

export async function veilleCompte(userId: string, opts: { depuisDoc?: string; depuisAjout?: string } = {}) {
  const { data, error } = await supabaseAdmin().rpc('veille_produits', {
    p_user: userId,
    ...(opts.depuisDoc ? { p_depuis_doc: opts.depuisDoc } : {}),
    ...(opts.depuisAjout ? { p_depuis_ajout: opts.depuisAjout } : {}),
  })
  if (error) throw new Error(error.message)
  return (data ?? []) as AlerteVeille[]
}

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))
const fmtSh = (c?: string | null) => (c && c.length === 10 ? `${c.slice(0, 4)}.${c.slice(4, 6)}.${c.slice(6, 8)}.${c.slice(8)}` : c || '')
const dfr = (d?: string | null) => (d ? new Date(d).toLocaleDateString('fr-FR') : '')

/** Bloc HTML (email) listant les alertes, regroupées par fiche. Réutilisé par le rapport mensuel. */
export function blocAlertes(alertes: AlerteVeille[], site: string, max = 12) {
  const parFiche = new Map<string, AlerteVeille[]>()
  for (const a of alertes) parFiche.set(a.fiche_id, [...(parFiche.get(a.fiche_id) || []), a])
  let n = 0
  return Array.from(parFiche.values()).map(l => {
    const lignes = l.filter(() => n++ < max).map(a =>
      `<li style="margin:6px 0"><b>${esc(LIB_SOURCE[a.source] || a.source)} n° ${esc(a.numero)}</b>${a.date_texte ? ` du ${dfr(a.date_texte)}` : ''} · ${esc(a.niveau)}${a.code_cite ? ` (${esc(a.code_cite)})` : ''}<br><span style="color:#3B3631">${esc((a.titre || a.extrait || '').slice(0, 160))}</span></li>`).join('')
    if (!lignes) return ''
    return `<div style="margin:14px 0;padding:12px 14px;border:1px solid #E6DCC7;border-radius:10px">
      <div style="font-size:15px"><b>${esc(l[0].designation)}</b> · <span style="font-family:monospace">${fmtSh(l[0].code_fiche)}</span>
      · <a href="${site}/fiches/${l[0].fiche_id}" style="color:#153E82">revoir la fiche</a></div><ul style="margin:6px 0 0;padding-left:18px;font-size:14px">${lignes}</ul></div>`
  }).join('')
}

function semaineIso(d = new Date()) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const j = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - j)
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
  return `${t.getUTCFullYear()}-S${String(Math.ceil(((+t - +y0) / 864e5 + 1) / 7)).padStart(2, '0')}`
}

const PLANS_ACTIFS = ['trial', 'pro', 'premium', 'enterprise']

/** Envoi hebdomadaire (le lundi) : textes ajoutés dans la base depuis 7 jours qui touchent les produits d'un compte. */
export async function runVeilleHebdo(site: string, maintenant = new Date()) {
  const res = { envoyes: 0, comptes: 0, erreurs: [] as string[] }
  if (maintenant.getUTCDay() !== 1) return res
  const db = supabaseAdmin()
  const periode = semaineIso(maintenant)
  const { data: proprios } = await db.from('fiches_produits').select('user_id')
  const ids = Array.from(new Set((proprios ?? []).map(p => p.user_id)))
  if (!ids.length) return res
  const { data: users } = await db.from('users').select('id, email, prenom, plan, statut').in('id', ids)
  const depuis = new Date(+maintenant - 7 * 864e5).toISOString()
  for (const u of users ?? []) {
    if (!PLANS_ACTIFS.includes(u.plan) || !['active', 'trial'].includes(u.statut)) continue
    res.comptes++
    const { data: deja } = await db.from('score_envois').select('id').eq('user_id', u.id).eq('type', 'veille').eq('periode', periode).maybeSingle()
    if (deja) continue
    try {
      const alertes = await veilleCompte(u.id, { depuisAjout: depuis })
      if (!alertes.length) continue
      const nbProduits = new Set(alertes.map(a => a.fiche_id)).size
      const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#14120F">
        <div style="padding:20px 0;border-bottom:2px solid #A8822F"><b style="font-size:18px">Import-eXPert</b> · Veille sur vos produits</div>
        <p>Bonjour${u.prenom ? ' ' + esc(u.prenom) : ''},</p>
        <p>Cette semaine, <b>${alertes.length} texte${alertes.length > 1 ? 's' : ''}</b> publié${alertes.length > 1 ? 's' : ''} touche${alertes.length > 1 ? 'nt' : ''} <b>${nbProduits} de vos produits</b>. Revoyez les fiches concernées : une fiche à jour est une fiche défendable.</p>
        ${blocAlertes(alertes, site)}
        <p><a href="${site}/veille" style="display:inline-block;background:#14120F;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none">Voir toute ma veille</a></p>
        <p style="font-size:12px;color:#7A7168;margin-top:28px;border-top:1px solid #E6DCC7;padding-top:12px">Alerte établie en rapprochant les codes SH de vos fiches des textes publiés. Elle signale un texte à examiner ; elle ne préjuge pas de son effet sur vos opérations.</p></div>`
      const r = await sendEmail({ to: u.email, subject: `Veille : ${alertes.length} texte${alertes.length > 1 ? 's' : ''} touche${alertes.length > 1 ? 'nt' : ''} ${nbProduits} de vos produits`, html })
      if (!r.ok) { res.erreurs.push(`${u.email}: envoi impossible`); continue }
      await db.from('score_envois').insert({ user_id: u.id, type: 'veille', periode })
      res.envoyes++
    } catch (e: any) { res.erreurs.push(`${u.email}: ${e?.message}`) }
  }
  return res
}
