// lib/rapportMensuel.ts
// Rapport mensuel au dirigeant (offres Pro, Premium, Entreprise) : score
// d'exposition et son évolution, activité de conformité du mois (fiches,
// dossiers défendables, progression), veille sur les produits. Envoyé au
// titulaire du compte et, s'il est renseigné, au dirigeant (users.email_dirigeant).
// Appelé chaque jour par la tâche planifiée : n'envoie qu'une fois par mois
// (journal public.score_envois, type « mensuel »), entre le 1er et le 5 du mois.
import { supabaseAdmin } from './supabaseAdmin'
import { sendEmail } from './email'
import { etatProgression } from './progression'
import { veilleCompte, blocAlertes } from './veille'
import { fourchette } from './scoreReport'

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))
const dh = (n: number) => Math.round(n).toLocaleString('fr-FR') + ' DH'
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
export const PLANS_RAPPORT = ['pro', 'premium', 'enterprise']
/** Rapport trimestriel au comité de direction : offres Premium et Entreprise. */
export const PLANS_TRIMESTRIEL = ['premium', 'enterprise']

/** Période couverte : le mois civil précédant la date d'envoi. */
export function periodeRapport(maintenant = new Date(), mois = 1) {
  const debut = new Date(Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth() - mois, 1))
  const fin = new Date(Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth(), 1))
  if (mois === 3) {
    const t = Math.floor(debut.getUTCMonth() / 3) + 1
    return { debut, fin, cle: `${debut.getUTCFullYear()}-T${t}`, libelle: `${['premier', 'deuxième', 'troisième', 'quatrième'][t - 1]} trimestre ${debut.getUTCFullYear()}` }
  }
  return { debut, fin, cle: `${debut.getUTCFullYear()}-${String(debut.getUTCMonth() + 1).padStart(2, '0')}`, libelle: `${MOIS[debut.getUTCMonth()]} ${debut.getUTCFullYear()}` }
}

export async function construireRapport(userId: string, site: string, maintenant = new Date(), mois = 1) {
  const tri = mois === 3
  const sur = tri ? 'du trimestre' : 'du mois', ce = tri ? 'ce trimestre' : 'ce mois-ci'
  const db = supabaseAdmin()
  const p = periodeRapport(maintenant, mois)
  const [{ data: u }, { data: diags }, { data: fiches }, { data: dossiers }] = await Promise.all([
    db.from('users').select('prenom, nom, societe, raison_sociale').eq('id', userId).single(),
    db.from('diagnostics').select('created_at, indice, ecarts, critiques, exposition_basse, exposition_haute, estimee').eq('user_id', userId).order('created_at', { ascending: false }).limit(12),
    db.from('fiches_produits').select('id, created_at, updated_at, statut').eq('user_id', userId),
    db.from('dossiers_defendables').select('numero, created_at, titre, statut').eq('user_id', userId).gte('created_at', p.debut.toISOString()).lt('created_at', p.fin.toISOString()),
  ])
  const { data: tousDossiers } = tri ? await db.from('dossiers_defendables').select('fiches, statut').eq('user_id', userId).eq('statut', 'emis') : { data: [] as any[] }
  const prog = await etatProgression(userId)
  let alertes: Awaited<ReturnType<typeof veilleCompte>> = []
  try { alertes = (await veilleCompte(userId, { depuisDoc: p.debut.toISOString().slice(0, 10) })).filter(a => !a.date_texte || a.date_texte < p.fin.toISOString().slice(0, 10)) } catch {}

  const societe = u?.raison_sociale || u?.societe || ''
  const dernier = diags?.[0]
  const precedent = diags?.find(d => dernier && new Date(d.created_at) < new Date(dernier.created_at) && d.exposition_haute != null)
  const ageJours = dernier ? Math.round((+maintenant - +new Date(dernier.created_at)) / 864e5) : null
  const mil = (d: any) => d && d.exposition_basse != null && d.exposition_haute != null ? (Number(d.exposition_basse) + Number(d.exposition_haute)) / 2 : null
  const delta = mil(dernier) != null && mil(precedent) != null ? mil(dernier)! - mil(precedent)! : null

  const fl = fiches ?? []
  const nouvelles = fl.filter(f => new Date(f.created_at) >= p.debut && new Date(f.created_at) < p.fin).length
  const misesAJour = fl.filter(f => new Date(f.updated_at) >= p.debut && new Date(f.updated_at) < p.fin && new Date(f.created_at) < p.debut).length
  const completes = fl.filter(f => f.statut === 'complete').length
  const nbDossiers = (dossiers ?? []).filter(d => d.statut === 'emis').length

  const carte = (t: string, v: string, s = '') => `<td style="width:33%;padding:12px;border:1px solid #E6DCC7;border-radius:10px;vertical-align:top"><div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#7A7168">${t}</div><div style="font-size:22px;margin-top:4px">${v}</div>${s ? `<div style="font-size:12px;color:#3B3631;margin-top:2px">${s}</div>` : ''}</td>`

  const scoreHtml = dernier ? `
    <table style="width:100%;border-collapse:collapse;margin:10px 0"><tr><td style="padding:16px;background:#14120F;color:#fff;border-radius:10px">
      <div style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;opacity:.75">${dernier.estimee ? 'Exposition estimée sur 4 ans' : 'Exposition sur 4 ans'}</div>
      <div style="font-size:26px;margin-top:6px">${fourchette(dernier.exposition_basse, dernier.exposition_haute)}</div>
      <div style="font-size:13px;margin-top:6px;opacity:.85">${delta == null ? 'Premier score enregistré : l’évolution apparaîtra au prochain diagnostic.'
        : delta < 0 ? `En baisse de ${dh(-delta)} depuis le diagnostic précédent : vos actions correctives réduisent le risque.`
        : delta > 0 ? `En hausse de ${dh(delta)} depuis le diagnostic précédent : des écarts nouveaux sont apparus.` : 'Stable depuis le diagnostic précédent.'}</div>
    </td></tr></table>
    <p style="font-size:14px">Indice de maîtrise : <b>${dernier.indice != null ? Math.round(Number(dernier.indice) * 100) + ' %' : '—'}</b> · Écarts : <b>${dernier.ecarts ?? '—'}</b>, dont <b>${dernier.critiques ?? '—'}</b> critiques · Diagnostic du ${new Date(dernier.created_at).toLocaleDateString('fr-FR')}.</p>
    ${ageJours != null && ageJours > 31 ? `<p style="font-size:14px">Votre dernier diagnostic date de ${ageJours} jours. <a href="${site}/diagnostic" style="color:#153E82">Recalculer le score</a> (une quinzaine de minutes) pour mesurer l’effet de vos actions ${sur}.</p>` : ''}`
    : `<p>Aucun score d’exposition n’est encore enregistré. <a href="${site}/diagnostic" style="color:#153E82">Mesurer l’exposition</a> : le diagnostic chiffre en dirhams les droits exposés sur la période de reprise de quatre ans.</p>`

  // ── Synthèse trimestrielle : tendance, couverture, priorités du trimestre suivant ──
  let triHtml = ''
  if (tri) {
    const dansP = (d: any) => new Date(d.created_at) >= p.debut && new Date(d.created_at) < p.fin
    const avant = (diags ?? []).find(d => new Date(d.created_at) < p.debut && mil(d) != null)
    const finT = (diags ?? []).find(d => dansP(d) && mil(d) != null)
    const duT = (diags ?? []).filter(dansP).reverse()
    const varT = mil(finT) != null && mil(avant) != null ? mil(finT)! - mil(avant)! : null
    const couvertes = new Set<string>()
    for (const d of tousDossiers ?? []) for (const f of (Array.isArray(d.fiches) ? d.fiches : [])) if (f?.id) couvertes.add(String(f.id))
    const incompletes = fl.filter(f => f.statut !== 'complete').length
    const sansDossier = fl.filter(f => f.statut === 'complete' && !couvertes.has(String(f.id))).length
    const couverture = fl.length ? Math.round(couvertes.size / fl.length * 100) : 0
    const messages = [
      varT == null ? (finT ? `Exposition mesurée ce trimestre : ${fourchette(finT.exposition_basse, finT.exposition_haute)}. Pas de mesure au trimestre précédent pour comparer.` : 'Aucun diagnostic ce trimestre : l’exposition n’a pas été remesurée.')
        : varT < 0 ? `L’exposition a baissé de ${dh(-varT)} sur le trimestre : les actions engagées réduisent le risque.`
        : varT > 0 ? `L’exposition a augmenté de ${dh(varT)} sur le trimestre : des écarts nouveaux sont à traiter.` : 'L’exposition est stable sur le trimestre.',
      fl.length ? `${couvertes.size} produit${couvertes.size > 1 ? 's' : ''} sur ${fl.length} couvert${couvertes.size > 1 ? 's' : ''} par un dossier défendable (${couverture} %).` : 'Aucun produit n’est encore suivi par une fiche.',
      alertes.length ? `${alertes.length} texte${alertes.length > 1 ? 's' : ''} publié${alertes.length > 1 ? 's' : ''} ce trimestre touche${alertes.length > 1 ? 'nt' : ''} vos produits.` : 'Aucun texte publié ce trimestre ne touche vos produits.',
    ]
    const prio: string[] = []
    if (!dernier || (ageJours ?? 0) > 90) prio.push(`Remesurer l’exposition : <a href="${site}/diagnostic" style="color:#153E82">refaire le diagnostic</a>${dernier ? ` (le dernier date de ${ageJours} jours)` : ''}.`)
    if (dernier?.critiques) prio.push(`Traiter les ${dernier.critiques} écart${dernier.critiques > 1 ? 's' : ''} critique${dernier.critiques > 1 ? 's' : ''} du dernier diagnostic.`)
    if (incompletes) prio.push(`Compléter ${incompletes} fiche${incompletes > 1 ? 's' : ''} produit${incompletes > 1 ? 's' : ''} : classement, documents, contrôle MIC, origine.`)
    if (sansDossier) prio.push(`Figer ${sansDossier} fiche${sansDossier > 1 ? 's' : ''} complète${sansDossier > 1 ? 's' : ''} en dossier défendable, vérifiable en ligne.`)
    const etape = prog.find(e => e.total > 0 && e.faits < e.total)
    if (etape) prio.push(`Avancer l’étape « ${esc(etape.verb)} » : ${etape.faits}/${etape.total} modules réalisés.`)
    if (alertes.length) prio.push(`Faire examiner les ${alertes.length} texte${alertes.length > 1 ? 's' : ''} du trimestre par la personne en charge de la conformité.`)
    triHtml = `
    <h2 style="font-size:14px;letter-spacing:.06em;text-transform:uppercase;color:#153E82">Synthèse pour la direction</h2>
    <ul style="font-size:15px;line-height:1.55;padding-left:18px;margin:8px 0 18px">${messages.map(m => `<li>${m}</li>`).join('')}</ul>
    ${duT.length ? `<table style="width:100%;font-size:13px;border-collapse:collapse;margin:0 0 18px"><tr style="color:#7A7168;text-align:left"><th style="padding:4px 0">Diagnostic</th><th>Exposition</th><th>Écarts critiques</th></tr>${duT.map(d => `<tr style="border-top:1px solid #E6DCC7"><td style="padding:5px 0">${new Date(d.created_at).toLocaleDateString('fr-FR')}</td><td>${fourchette(d.exposition_basse, d.exposition_haute)}</td><td>${d.critiques ?? '—'}</td></tr>`).join('')}</table>` : ''}
    <h2 style="font-size:14px;letter-spacing:.06em;text-transform:uppercase;color:#153E82">Priorités du trimestre suivant</h2>
    ${prio.length ? `<ol style="font-size:14px;line-height:1.55;padding-left:18px;margin:8px 0 6px">${prio.slice(0, 5).map(x => `<li>${x}</li>`).join('')}</ol>` : '<p style="font-size:14px">Aucune action prioritaire : maintenir la veille et remesurer l’exposition au prochain trimestre.</p>'}
    <p style="font-size:12px;color:#7A7168;margin:0 0 6px">Le détail du trimestre suit : exposition, activité, textes.</p>`
  }

  const progHtml = prog.filter(e => e.total > 0).map(e => `<tr><td style="padding:4px 0">${esc(e.verb)}</td><td style="padding:4px 0;text-align:right">${e.faits}/${e.total} modules</td></tr>`).join('')

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:620px;margin:0 auto;color:#14120F">
    <div style="padding:20px 0;border-bottom:2px solid #A8822F"><b style="font-size:18px">Import-eXPert</b> · ${tri ? 'Rapport trimestriel au comité de direction' : 'Rapport mensuel'}${societe ? ' · ' + esc(societe) : ''}</div>
    <h1 style="font-size:22px;margin:22px 0 6px">Conformité import : ${p.libelle}</h1>
    <p style="color:#3B3631;margin:0 0 18px">Ce que l’entreprise a sécurisé ${ce}, et ce qui reste à traiter.</p>${triHtml}
    <h2 style="font-size:14px;letter-spacing:.06em;text-transform:uppercase;color:#153E82">1. Exposition</h2>${scoreHtml}
    <h2 style="font-size:14px;letter-spacing:.06em;text-transform:uppercase;color:#153E82;margin-top:24px">2. Activité ${sur}</h2>
    <table style="width:100%;border-collapse:separate;border-spacing:8px 0"><tr>
      ${carte('Fiches produits', String(fl.length), `${nouvelles} nouvelle${nouvelles > 1 ? 's' : ''}, ${misesAJour} mise${misesAJour > 1 ? 's' : ''} à jour · ${completes} complète${completes > 1 ? 's' : ''}`)}
      ${carte('Dossiers défendables', String(nbDossiers), `émis ${ce}`)}
      ${carte('Veille', String(alertes.length), `texte${alertes.length > 1 ? 's' : ''} touchant vos produits`)}
    </tr></table>
    ${progHtml ? `<table style="width:100%;font-size:14px;margin-top:12px;border-top:1px solid #E6DCC7">${progHtml}</table>` : ''}
    <h2 style="font-size:14px;letter-spacing:.06em;text-transform:uppercase;color:#153E82;margin-top:24px">3. Textes ${sur} sur vos produits</h2>
    ${alertes.length ? blocAlertes(alertes, site, 8) : `<p style="font-size:14px">Aucun texte publié ${ce} ne cite les codes SH de vos fiches.</p>`}
    <p style="margin-top:22px"><a href="${site}/mon-espace" style="display:inline-block;background:#14120F;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none">Ouvrir l’espace</a></p>
    <p style="font-size:12px;color:#7A7168;margin-top:28px;border-top:1px solid #E6DCC7;padding-top:12px">Rapport d’aide à la décision établi à partir des données du compte et des textes publiés. Il ne constitue ni un audit ni une évaluation par l’administration. Pour ne plus le recevoir ou changer de destinataire : <a href="${site}/mon-espace" style="color:#7A7168">Mon espace</a>.</p></div>`
  return { subject: `${tri ? 'Rapport trimestriel' : 'Rapport mensuel'} de conformité import : ${p.libelle}`, html, periode: p.cle }
}

/** Envoi automatique, du 1er au 5 du mois (rattrapage si la tâche a manqué un jour). */
export async function runRapportsMensuels(site: string, maintenant = new Date()) {
  const res = { envoyes: 0, erreurs: [] as string[] }
  if (maintenant.getUTCDate() > 5) return res
  const db = supabaseAdmin()
  const { cle } = periodeRapport(maintenant)
  const { data: users, error } = await db.from('users').select('id, email, email_dirigeant, plan, statut, rapport_mensuel')
    .in('plan', PLANS_RAPPORT).eq('statut', 'active').eq('rapport_mensuel', true)
  if (error) return { ...res, erreurs: [error.message] }
  for (const u of users ?? []) {
    const { data: deja } = await db.from('score_envois').select('id').eq('user_id', u.id).eq('type', 'mensuel').eq('periode', cle).maybeSingle()
    if (deja) continue
    try {
      const r = await construireRapport(u.id, site, maintenant)
      const dest = Array.from(new Set([u.email, u.email_dirigeant].filter(Boolean))) as string[]
      const e = await sendEmail({ to: dest, subject: r.subject, html: r.html })
      if (!e.ok) { res.erreurs.push(`${u.email}: envoi impossible`); continue }
      await db.from('score_envois').insert({ user_id: u.id, type: 'mensuel', periode: cle })
      res.envoyes++
    } catch (e: any) { res.erreurs.push(`${u.email}: ${e?.message}`) }
  }
  return res
}

/** Offre Découverte : alerte mensuelle sur les produits suivis (comptes gratuits, essais terminés,
 *  abonnements échus), envoyée seulement si des textes du mois touchent leurs produits. */
export async function runAlertesDecouverte(site: string, maintenant = new Date()) {
  const res = { envoyes: 0, erreurs: [] as string[] }
  if (maintenant.getUTCDate() > 5) return res
  const db = supabaseAdmin()
  const p = periodeRapport(maintenant)
  const { data: proprios } = await db.from('fiches_produits').select('user_id')
  const ids = Array.from(new Set((proprios ?? []).map(x => x.user_id)))
  if (!ids.length) return res
  const { data: users } = await db.from('users').select('id, email, prenom, plan, statut, role, trial_ends_at').in('id', ids)
  for (const u of users ?? []) {
    const admin = u.role === 'admin' || u.role === 'generaladmin'
    const essai = u.plan === 'trial' && u.statut === 'trial' && (!u.trial_ends_at || new Date(u.trial_ends_at) > maintenant)
    const payant = ['pro', 'premium', 'enterprise'].includes(u.plan) && u.statut === 'active'
    if (admin || essai || payant || u.statut === 'suspended') continue
    const { data: deja } = await db.from('score_envois').select('id').eq('user_id', u.id).eq('type', 'alerte_decouverte').eq('periode', p.cle).maybeSingle()
    if (deja) continue
    try {
      const fin = p.fin.toISOString().slice(0, 10)
      const alertes = (await veilleCompte(u.id, { depuisDoc: p.debut.toISOString().slice(0, 10) })).filter(a => !a.date_texte || a.date_texte < fin)
      if (!alertes.length) continue
      const nb = new Set(alertes.map(a => a.fiche_id)).size
      const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#14120F">
        <div style="padding:20px 0;border-bottom:2px solid #A8822F"><b style="font-size:18px">Import-eXPert</b> · Vos produits en ${p.libelle}</div>
        <p>Bonjour${u.prenom ? ' ' + esc(u.prenom) : ''},</p>
        <p><b>${alertes.length} texte${alertes.length > 1 ? 's' : ''}</b> publié${alertes.length > 1 ? 's' : ''} en ${p.libelle} touche${alertes.length > 1 ? 'nt' : ''} <b>${nb} de vos produits</b>.</p>
        ${blocAlertes(alertes, site, 5)}
        <p style="font-size:14px">Avec l’offre Pro, ces alertes vous arrivent chaque semaine, pour tous vos produits, et chaque fiche peut être figée en dossier défendable, vérifiable en ligne.</p>
        <p><a href="${site}/tarifs" style="display:inline-block;background:#14120F;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none">Découvrir l’offre Pro</a> &nbsp; <a href="${site}/veille" style="color:#153E82">Voir ma veille</a></p>
        <p style="font-size:12px;color:#7A7168;margin-top:28px;border-top:1px solid #E6DCC7;padding-top:12px">Alerte de l’offre Découverte, établie en rapprochant les codes SH de vos fiches des textes publiés. Elle signale un texte à examiner ; elle ne préjuge pas de son effet sur vos opérations.</p></div>`
      const e = await sendEmail({ to: u.email, subject: `${alertes.length} texte${alertes.length > 1 ? 's' : ''} du mois touche${alertes.length > 1 ? 'nt' : ''} ${nb} de vos produits`, html })
      if (!e.ok) { res.erreurs.push(`${u.email}: envoi impossible`); continue }
      await db.from('score_envois').insert({ user_id: u.id, type: 'alerte_decouverte', periode: p.cle })
      res.envoyes++
    } catch (e: any) { res.erreurs.push(`${u.email}: ${e?.message}`) }
  }
  return res
}

/** Offres Premium et Entreprise : rapport trimestriel au comité de direction, du 1er au 5 de janvier, avril, juillet et octobre. */
export async function runRapportsTrimestriels(site: string, maintenant = new Date()) {
  const res = { envoyes: 0, erreurs: [] as string[] }
  if (maintenant.getUTCDate() > 5 || maintenant.getUTCMonth() % 3 !== 0) return res
  const db = supabaseAdmin()
  const { cle } = periodeRapport(maintenant, 3)
  const { data: users, error } = await db.from('users').select('id, email, email_dirigeant')
    .in('plan', PLANS_TRIMESTRIEL).eq('statut', 'active').eq('rapport_mensuel', true)
  if (error) return { ...res, erreurs: [error.message] }
  for (const u of users ?? []) {
    const { data: deja } = await db.from('score_envois').select('id').eq('user_id', u.id).eq('type', 'trimestriel').eq('periode', cle).maybeSingle()
    if (deja) continue
    try {
      const r = await construireRapport(u.id, site, maintenant, 3)
      const dest = Array.from(new Set([u.email, u.email_dirigeant].filter(Boolean))) as string[]
      const e = await sendEmail({ to: dest, subject: r.subject, html: r.html })
      if (!e.ok) { res.erreurs.push(`${u.email}: envoi impossible`); continue }
      await db.from('score_envois').insert({ user_id: u.id, type: 'trimestriel', periode: cle })
      res.envoyes++
    } catch (e: any) { res.erreurs.push(`${u.email}: ${e?.message}`) }
  }
  return res
}
