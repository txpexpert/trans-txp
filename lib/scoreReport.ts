// lib/scoreReport.ts
// ─────────────────────────────────────────────────────────────────────────────
// Rapport de score d'exposition envoyé par email (refonte SaaS, étape 1).
// Fin d'essai : chaque compte en essai reçoit son dernier score à l'échéance de
// l'essai, qu'il s'abonne ou non. Sans diagnostic, il reçoit une invitation à le
// faire. Le journal public.score_envois empêche tout second envoi.
// Appelé par la tâche quotidienne /api/cron/expire-subscriptions.
// ─────────────────────────────────────────────────────────────────────────────
import { supabaseAdmin } from './supabaseAdmin'
import { sendEmail } from './email'

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))
const dh = (n: number) => Math.round(n).toLocaleString('fr-FR') + ' DH'
const mdh = (n: number) => n >= 1e6 ? (Math.round(n / 1e5) / 10).toLocaleString('fr-FR') + ' MDH' : dh(n)
const pct = (x: number | null) => x == null ? '—' : Math.round(x * 100) + ' %'

export function fourchette(lo: number | null, hi: number | null): string {
  if (lo == null || hi == null) return '—'
  return Math.round(lo) === Math.round(hi) ? dh(lo) : `entre ${mdh(lo)} et ${mdh(hi)}`
}

type Diag = { created_at: string; indice: number | null; ecarts: number | null; critiques: number | null
  exposition_basse: number | null; exposition_haute: number | null; estimee: boolean; hypotheses: string | null }

function layout(titre: string, corps: string, site: string) {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#14120F">
  <div style="padding:20px 0;border-bottom:2px solid #A8822F"><b style="font-size:18px">Import-eXPert</b></div>
  <h1 style="font-size:22px;margin:22px 0 12px">${titre}</h1>${corps}
  <p style="font-size:12px;color:#7A7168;margin-top:28px;border-top:1px solid #E6DCC7;padding-top:12px">
  Indicateur d'aide à la conformité, calculé à partir de vos réponses au diagnostic. Il ne constitue ni un audit ni une évaluation par l'administration.
  <br><a href="${site}" style="color:#7A7168">${site.replace(/^https?:\/\//, '')}</a></p></div>`
}

export function scoreEmail(prenom: string | null, d: Diag | null, site: string) {
  const bonjour = `<p>Bonjour${prenom ? ' ' + esc(prenom) : ''},</p>`
  if (!d) {
    return {
      subject: 'Votre essai Import-eXPert se termine : mesurez votre exposition',
      html: layout('Votre essai se termine', `${bonjour}
        <p>Votre période d'essai arrive à son terme, et vous n'avez pas encore mesuré l'exposition de vos importations.</p>
        <p>Le diagnostic prend une quinzaine de minutes. Il chiffre en dirhams les droits exposés sur la période de reprise de quatre ans (Code des douanes, art. 99 bis) et produit un plan d'action.</p>
        <p><a href="${site}/diagnostic" style="display:inline-block;background:#14120F;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none">Mesurer mon exposition</a></p>`, site),
    }
  }
  const date = new Date(d.created_at).toLocaleDateString('fr-FR')
  return {
    subject: `Votre exposition : ${fourchette(d.exposition_basse, d.exposition_haute)} sur 4 ans`,
    html: layout('Votre score d\'exposition', `${bonjour}
      <p>Votre période d'essai arrive à son terme. Voici le résultat de votre dernier diagnostic, du ${date}.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:14px;background:#14120F;color:#fff;border-radius:10px">
          <div style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;opacity:.75">${d.estimee ? 'Exposition estimée sur 4 ans' : 'Exposition sur 4 ans'}</div>
          <div style="font-size:26px;margin-top:6px">${fourchette(d.exposition_basse, d.exposition_haute)}</div></td></tr>
      </table>
      <p>Indice de maîtrise : <b>${pct(d.indice)}</b> · Écarts identifiés : <b>${d.ecarts ?? '—'}</b>, dont <b>${d.critiques ?? '—'}</b> critiques.</p>
      ${d.hypotheses ? `<p style="font-size:13px;color:#3B3631">${esc(d.hypotheses)}</p>` : ''}
      <p>Avec l'offre Pro, ce score est conservé dans votre compte et vous recevez chaque mois son évolution : c'est la mesure de ce que vos actions correctives ont réellement réduit.</p>
      <p><a href="${site}/tarifs" style="display:inline-block;background:#14120F;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none">Continuer avec Pro</a>
      &nbsp; <a href="${site}/diagnostic" style="color:#153E82">Refaire le diagnostic</a></p>`, site),
  }
}

/** Envoie le rapport de fin d'essai aux comptes dont l'essai se termine (veille, jour même ou 3 derniers jours). */
export async function runTrialEndReports(site: string) {
  const db = supabaseAdmin()
  const now = Date.now()
  const from = new Date(now - 3 * 864e5).toISOString()
  const to = new Date(now + 1 * 864e5).toISOString()
  const { data: users, error } = await db.from('users')
    .select('id, email, prenom, plan, trial_ends_at')
    .eq('plan', 'trial').gte('trial_ends_at', from).lte('trial_ends_at', to)
  if (error) return { envoyes: 0, erreurs: [error.message] }

  let envoyes = 0
  const erreurs: string[] = []
  for (const u of users ?? []) {
    const { data: deja } = await db.from('score_envois').select('id').eq('user_id', u.id).eq('type', 'fin_essai').maybeSingle()
    if (deja) continue
    const { data: d } = await db.from('diagnostics')
      .select('created_at, indice, ecarts, critiques, exposition_basse, exposition_haute, estimee, hypotheses')
      .eq('user_id', u.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
    const mail = scoreEmail(u.prenom, d as Diag | null, site)
    const r = await sendEmail({ to: u.email, subject: mail.subject, html: mail.html })
    if (!r.ok) { erreurs.push(`${u.email}: ${(r as any).error ?? 'envoi impossible'}`); continue }
    await db.from('score_envois').insert({ user_id: u.id, type: 'fin_essai', periode: 'essai' })
    envoyes++
  }
  return { envoyes, erreurs }
}
