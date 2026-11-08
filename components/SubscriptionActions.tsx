// components/SubscriptionActions.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Boutons d'action d'abonnement pour le backoffice (pages Abonnements et
// Utilisateurs). Chaque bouton ouvre une confirmation, puis appelle
// POST /api/admin/subscriptions — aucune intervention directe dans Supabase.
//
// Les boutons proposés dépendent de l'abonnement de l'utilisateur :
//   • plan payé en cours  → « Renouveler <plan> » + passage aux autres plans
//   • essai / expiré      → « Activer Pro / Premium / Entreprise »
//   • pro-forma en attente → « Valider le paiement » / « Annuler la pro-forma »
//   • suspendu            → « Réactiver », sinon « Suspendre »
//   • toujours            → « Prolonger » (geste commercial, en jours)
//   • generaladmin        → aucun bouton de facturation ; « Retirer generaladmin »
//
// Facturation (2026-11-07) : montants saisis HT ; la validation du paiement
// exige le montant reçu sur le compte (= TTC attendu), la date de valeur et la
// référence lue sur le relevé. Un justificatif déposé par le client est
// rattaché automatiquement (lien de consultation, rejet motivé possible).
//
// Habilitations (2026-11-01) : la prop `caps` décrit l'administrateur connecté.
// Un administrateur de type 2 ne voit que les boutons de ses habilitations ;
// « Suspendre », « Réactiver » et « Supprimer » sont réservés au super. Sans
// `caps`, tout est affiché (backoffice du super-administrateur). L'API
// revérifie chaque action côté serveur.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import {
  PLAN_LABEL, PAID_PLANS, GENERALADMIN, fmtAmount, fmtDate, displayName, endDate, invTTC,
  type Subscriber, type Invoice, type PlanRow, type AdminAction,
} from '../lib/subscriptions'
import { fmtAbonne, fmtDocNumber, normRef, VAT_DEFAULT, type Paiement } from '../lib/billing'
import { can, type AdminCapabilities } from '../lib/adminPermissions'

export async function postAdminAction(payload: AdminAction): Promise<{ ok: boolean; error?: string; emailed?: boolean }> {
  try {
    const r = await fetch('/api/admin/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    })
    const d = await r.json().catch(() => ({}))
    return r.ok ? { ok: true, emailed: d.emailed } : { ok: false, error: d.error || `Erreur ${r.status}` }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Erreur réseau' }
  }
}

const S = {
  btn: (tone: 'primary' | 'outline' | 'danger' | 'success' = 'outline'): CSSProperties => ({
    fontSize: 11, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
    border: '.5px solid ' + (tone === 'primary' ? 'var(--bd)' : tone === 'danger' ? '#C0392B' : tone === 'success' ? '#1A7A40' : 'var(--rule)'),
    background: tone === 'primary' ? 'var(--bd)' : 'transparent',
    color: tone === 'primary' ? '#fff' : tone === 'danger' ? '#C0392B' : tone === 'success' ? '#1A7A40' : 'var(--inks)',
  }),
  label: { fontSize: 10, letterSpacing: '.06em', color: 'var(--inkm)', display: 'block', marginBottom: 4 } as CSSProperties,
  input: { width: '100%', padding: '8px 10px', border: '.5px solid var(--rule)', fontSize: 13, fontFamily: 'inherit', background: 'var(--white)' } as CSSProperties,
}

type ModalState =
  | { kind: 'plan'; plan: string; renew: boolean }
  | { kind: 'extend' }
  | { kind: 'status'; action: 'suspend' | 'reactivate' }
  | { kind: 'invoice'; action: 'confirm_payment' | 'cancel_proforma'; invoice: Invoice }
  | { kind: 'delete' }
  | { kind: 'generaladmin'; on: boolean }
  | { kind: 'reject'; paiement: Paiement }
  | { kind: 'profile' }
  | { kind: 'attach'; invoice: Invoice }

interface Props {
  user:      Subscriber
  plans:     PlanRow[]
  pending:   Invoice[]            // pro-formas en attente pour cet utilisateur
  paiements?: Paiement[]          // paiements déclarés (justificatifs) de cet utilisateur
  onDone:    (message: string) => void
  onError:   (message: string) => void
  compact?:  boolean
  caps?:     AdminCapabilities | null   // absent = tous les droits (super)
}

export default function SubscriptionActions({ user, plans, pending, paiements = [], onDone, onError, compact, caps }: Props) {
  const [modal, setModal] = useState<ModalState | null>(null)
  const allowed = (action: string) => !caps || can(caps, action)
  const canPlan = allowed('activate_plan') || allowed('create_proforma')
  const isPaidActive = user.statut === 'active' && (PAID_PLANS as readonly string[]).includes(user.plan)
  const isGA = user.role === GENERALADMIN

  if (isGA) {
    return (
      <>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
          <span style={{ fontSize: 10, padding: '2px 8px', background: '#EDE7FB', color: '#5B21B6', fontWeight: 700 }}>GENERALADMIN</span>
          {!compact && allowed('set_generaladmin') && (
            <button style={S.btn('outline')} onClick={() => setModal({ kind: 'generaladmin', on: false })}>Retirer generaladmin</button>
          )}
        </div>
        {modal && <ActionModal modal={modal} user={user} plans={plans} paiements={paiements} onClose={() => setModal(null)}
          onSubmit={async (payload, okMsg) => { const r = await postAdminAction(payload); if (r.ok) { setModal(null); onDone(okMsg) } else onError(r.error || 'Erreur'); return r.ok }} />}
      </>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }} onClick={e => e.stopPropagation()}>
        {allowed('confirm_payment') && pending.map(inv => {
          const decl = paiements.filter(p => p.invoice_id === inv.id && p.statut === 'declare')
          return (
            <span key={inv.id} style={{ display: 'contents' }}>
              <button style={S.btn('success')} onClick={() => setModal({ kind: 'invoice', action: 'confirm_payment', invoice: inv })}>
                ✓ Valider le paiement {PLAN_LABEL[inv.plan_code]}{decl.length ? ' 📎' : ''}
              </button>
              {!compact && (
                <button style={S.btn('outline')} onClick={() => setModal({ kind: 'invoice', action: 'cancel_proforma', invoice: inv })}>
                  Annuler pro-forma
                </button>
              )}
            </span>
          )
        })}
        {pending.map(inv => (
          <a key={'v' + inv.id} href={`/facturation/document/${inv.id}`} target="_blank" rel="noreferrer" style={{ ...S.btn('outline'), textDecoration: 'none' }}>
            Voir {fmtDocNumber(inv.payment_reference || inv.proforma_number)}
          </a>
        ))}
        {!compact && allowed('confirm_payment') && pending.map(inv => (
          <button key={'j' + inv.id} style={S.btn('outline')} onClick={() => setModal({ kind: 'attach', invoice: inv })}>Joindre un justificatif</button>
        ))}
        {!compact && allowed('update_profile') && (
          <button style={S.btn('outline')} onClick={() => setModal({ kind: 'profile' })}>
            Profil{user.type_client ? '' : ' ⚠'}
          </button>
        )}
        {!compact && allowed('resend_proforma') && pending.map(inv => (
          <button key={'r' + inv.id} style={S.btn('outline')} onClick={async () => {
            const r = await postAdminAction({ action: 'resend_proforma', invoiceId: inv.id })
            r.ok ? onDone(`Pro-forma ${fmtDocNumber(inv.payment_reference)} renvoyée par email`) : onError(r.error || 'Erreur')
          }}>Renvoyer par email</button>
        ))}

        {canPlan && PAID_PLANS.map(code => {
          const current = isPaidActive && user.plan === code
          return (
            <button key={code} style={S.btn(current ? 'primary' : 'outline')}
              onClick={() => setModal({ kind: 'plan', plan: code, renew: current })}>
              {current ? `↻ Renouveler ${PLAN_LABEL[code]}` : `Activer ${PLAN_LABEL[code]}`}
            </button>
          )
        })}

        {allowed('suspend') && (user.statut === 'suspended'
          ? <button style={S.btn('success')} onClick={() => setModal({ kind: 'status', action: 'reactivate' })}>Réactiver</button>
          : <button style={S.btn('danger')}  onClick={() => setModal({ kind: 'status', action: 'suspend' })}>Suspendre</button>)}

        {allowed('extend') && (user.plan === 'trial' || (PAID_PLANS as readonly string[]).includes(user.plan)) && (
          <button style={S.btn('outline')} onClick={() => setModal({ kind: 'extend' })}>Prolonger</button>
        )}

        {!compact && allowed('set_generaladmin') && (
          <button style={S.btn('outline')} onClick={() => setModal({ kind: 'generaladmin', on: true })}>Generaladmin</button>
        )}

        {!compact && allowed('delete') && user.role !== 'admin' && (
          <button style={{ ...S.btn('danger'), background: '#FEE8E8' }} onClick={() => setModal({ kind: 'delete' })}>
            Supprimer
          </button>
        )}
      </div>

      {modal && (
        <ActionModal
          modal={modal} user={user} plans={plans} paiements={paiements}
          canActivate={allowed('activate_plan')} canProforma={allowed('create_proforma')}
          onClose={() => setModal(null)}
          onSubmit={async (payload, okMsg) => {
            const r = await postAdminAction(payload)
            if (r.ok) { setModal(null); onDone(r.emailed === false ? `${okMsg} — ⚠ email au client NON envoyé (vérifier Resend), utiliser « Renvoyer par email »` : okMsg) }
            else onError(r.error || 'Erreur')
            return r.ok
          }}
          onRawDone={(m: string) => { setModal(null); onDone(m) }}
        />
      )}
    </>
  )
}

// ── Fenêtre de confirmation ──────────────────────────────────────────────────
function ActionModal({ modal, user, plans, paiements = [], onClose, onSubmit, onRawDone, canActivate = true, canProforma = true }: {
  onRawDone?: (message: string) => void
  canActivate?: boolean
  canProforma?: boolean
  modal: ModalState
  user: Subscriber
  plans: PlanRow[]
  paiements?: Paiement[]
  onClose: () => void
  onSubmit: (payload: AdminAction, okMsg: string) => Promise<boolean>
}) {
  // Valeurs extraites avant usage dans des callbacks (TS 5.3 perd le narrowing dans les closures)
  const planCode = modal.kind === 'plan' ? modal.plan : null
  const planRow = planCode ? plans.find(p => p.code === planCode) : undefined
  const [years, setYears]   = useState(1)
  const [amount, setAmount] = useState<string>(planRow?.price_per_year != null ? String(planRow.price_per_year) : '')
  const [mode, setMode]     = useState<'activate_plan' | 'create_proforma'>(canActivate ? 'activate_plan' : 'create_proforma')
  const [days, setDays]     = useState('30')
  const [note, setNote]     = useState('')
  const [busy, setBusy]     = useState(false)
  const [err, setErr]       = useState('')
  const [confirmNum, setConfirmNum] = useState('')
  // Validation du paiement (rapprochement avec le relevé bancaire)
  const invForPay = modal.kind === 'invoice' || modal.kind === 'attach' ? modal.invoice : null
  const declared = invForPay ? paiements.find(p => p.invoice_id === invForPay.id && p.statut === 'declare') : undefined
  const [recu, setRecu]       = useState<string>(declared?.montant != null ? String(declared.montant) : invForPay ? String(invTTC(invForPay)) : '')
  const [dateVal, setDateVal] = useState<string>(declared?.date_valeur || new Date().toISOString().slice(0, 10))
  const [refLue, setRefLue]   = useState<string>(declared?.reference_libelle || '')
  const [motif, setMotif]     = useState('')
  // Profil de facturation (édition par l'administrateur)
  const [pf, setPf] = useState({
    type_client: user.type_client || 'entreprise', raison_sociale: user.raison_sociale || user.societe || '', ice: user.ice || '',
    if_fiscal: user.if_fiscal || '', rc: user.rc || '', adresse: user.adresse_facturation || '', code_postal: user.code_postal || '',
    ville: user.ville || '', pays: user.pays || 'Maroc',
  })
  const [file, setFile] = useState<File | null>(null)
  // Le numéro d'abonné identifie le compte dans chaque fenêtre d'action.
  const name = `${fmtAbonne(user.numero_abonne)} · ${displayName(user)}`

  const setYearsAndAmount = (y: number) => {
    setYears(y)
    if (planRow?.price_per_year != null) setAmount(String(planRow.price_per_year * y))
  }

  let title = '', body: ReactNode = null, cta = '', submit: () => Promise<boolean> = async () => false
  switch (modal.kind) {
    case 'plan': {
      const code = modal.plan
      const label = PLAN_LABEL[code]
      const contractual = planRow?.price_per_year == null
      title = `${modal.renew ? 'Renouveler' : 'Activer'} ${label} — ${name}`
      cta = mode === 'activate_plan' ? `Confirmer : paiement reçu, activer ${label}` : 'Émettre la pro-forma'
      body = (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={S.label}>DURÉE</label>
              <select style={S.input} value={years} onChange={e => setYearsAndAmount(Number(e.target.value))}>
                {[1, 2, 3].map(y => <option key={y} value={y}>{y} an{y > 1 ? 's' : ''}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>MONTANT HT (DH){contractual ? ' — CONTRAT' : ''}</label>
              <input style={S.input} type="number" min={0} value={amount} placeholder={contractual ? 'Montant du contrat' : ''}
                onChange={e => setAmount(e.target.value)} />
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={S.label}>MODE</label>
            {canActivate && (
              <label style={{ display: 'flex', gap: 8, fontSize: 13, marginBottom: 6, cursor: 'pointer' }}>
                <input type="radio" checked={mode === 'activate_plan'} onChange={() => setMode('activate_plan')} />
                <span><b>Paiement reçu</b> — activer maintenant et émettre la facture</span>
              </label>
            )}
            {canProforma && (
              <label style={{ display: 'flex', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input type="radio" checked={mode === 'create_proforma'} onChange={() => setMode('create_proforma')} />
                <span><b>En attente de virement</b> — émettre une pro-forma ; le plan sera activé à la validation du paiement</span>
              </label>
            )}
          </div>
          {amount !== '' && Number(amount) > 0 && (
            <p style={{ fontSize: 12, marginTop: 8 }}>
              Soit <b>{fmtAmount(Math.round(Number(amount) * (100 + VAT_DEFAULT)) / 100)} TTC</b> (TVA {VAT_DEFAULT} %).
              {mode === 'create_proforma' ? ' La pro-forma est envoyée au client par email.' : ' La facture est envoyée au client par email.'}
            </p>
          )}
          <p style={{ fontSize: 12, color: 'var(--inkm)', marginTop: 12, lineHeight: 1.5 }}>
            {modal.renew
              ? `Les jours restants (échéance ${fmtDate(endDate(user))}) s'ajouteront à la nouvelle période de 12 mois.`
              : 'La période de 12 mois démarre le jour de la validation du paiement.'}
          </p>
        </>
      )
      submit = () => {
        if (contractual && amount === '') { setErr('Saisir le montant du contrat.'); return Promise.resolve(false) }
        return onSubmit(
          { action: mode, userId: user.id, plan: code, years, amount: amount === '' ? null : Number(amount), note: note || undefined },
          mode === 'activate_plan' ? `${name} : plan ${label} activé` : `${name} : pro-forma ${label} émise`,
        )
      }
      break
    }
    case 'invoice': {
      const inv = modal.invoice
      const invAction = modal.action
      const confirm = invAction === 'confirm_payment'
      const expected = invTTC(inv)
      const recuN = Number(String(recu).replace(',', '.').replace(/\s/g, ''))
      const amountOk = Number.isFinite(recuN) && Math.abs(recuN - expected) < 0.005
      const refOk = !refLue || normRef(refLue).includes(normRef(inv.payment_reference || inv.proforma_number || ''))
      title = confirm ? `Valider le paiement — ${name}` : `Annuler la pro-forma — ${name}`
      cta = confirm ? `Paiement reçu : émettre la facture et activer ${PLAN_LABEL[inv.plan_code]}` : 'Annuler la pro-forma'
      body = confirm ? (
        <>
          <p style={{ fontSize: 13, lineHeight: 1.6, margin: '0 0 10px' }}>
            Pro-forma <b style={{ fontFamily: 'monospace' }}>{fmtDocNumber(inv.payment_reference || inv.proforma_number)}</b> · {PLAN_LABEL[inv.plan_code]} · {inv.years} an{inv.years > 1 ? 's' : ''}<br />
            Attendu : <b>{fmtAmount(expected)} TTC</b>{inv.amount_ht != null ? ` (${fmtAmount(inv.amount_ht)} HT)` : ''}
          </p>
          {declared && (
            <div style={{ background: '#F2F8F4', border: '.5px solid #A8D5B8', padding: '8px 10px', fontSize: 12, marginBottom: 10 }}>
              Justificatif déposé par le client le {fmtDate(declared.created_at)} : {fmtAmount(declared.montant)} · virement du {fmtDate(declared.date_valeur)}
              {declared.justificatif_path && <> · <a href={`/api/admin/justificatif?id=${declared.id}`} target="_blank" rel="noreferrer">ouvrir le justificatif</a></>}
            </div>
          )}
          <p style={{ fontSize: 12, color: '#8A5A10', margin: '0 0 10px' }}>Vérifier sur le relevé bancaire que les fonds sont bien arrivés avant de valider.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={S.label}>MONTANT REÇU SUR LE COMPTE (DH)</label>
              <input style={{ ...S.input, borderColor: amountOk ? '#1A7A40' : '#C0392B' }} value={recu} onChange={e => setRecu(e.target.value)} inputMode="decimal" />
            </div>
            <div>
              <label style={S.label}>DATE DE VALEUR</label>
              <input style={S.input} type="date" value={dateVal} onChange={e => setDateVal(e.target.value)} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={S.label}>LIBELLÉ / RÉFÉRENCE LU SUR LE RELEVÉ</label>
              <input style={{ ...S.input, borderColor: refOk ? 'var(--rule)' : '#D97706' }} value={refLue} onChange={e => setRefLue(e.target.value)} placeholder={fmtDocNumber(inv.payment_reference)} />
            </div>
          </div>
          {!amountOk && <p style={{ fontSize: 12, color: '#C0392B', marginTop: 8 }}>Montant différent du TTC attendu : le paiement ne peut pas être accepté (fonds à retourner).</p>}
          {amountOk && !refOk && <p style={{ fontSize: 12, color: '#D97706', marginTop: 8 }}>La référence lue ne contient pas {fmtDocNumber(inv.payment_reference)} : vérifier qu'il s'agit bien de ce client.</p>}
          {declared && (
            <button style={{ ...S.btn('danger'), marginTop: 10 }} onClick={() => onSubmit({ action: 'reject_payment', paiementId: declared.id, motif: motif || 'Fonds non reçus ou montant non conforme' },
              'Justificatif rejeté')}>Rejeter ce justificatif</button>
          )}
          {declared && <input style={{ ...S.input, marginTop: 6 }} value={motif} onChange={e => setMotif(e.target.value)} placeholder="Motif du rejet (communiqué au client)" />}
        </>
      ) : (
        <p style={{ fontSize: 13, lineHeight: 1.6 }}>
          Pro-forma <b>{fmtDocNumber(inv.payment_reference || inv.proforma_number)}</b> · {PLAN_LABEL[inv.plan_code]} · <b>{fmtAmount(expected)} TTC</b>
          <br />La pro-forma sera marquée comme annulée. Le compte n'est pas modifié.
        </p>
      )
      submit = () => {
        if (!confirm) return onSubmit({ action: 'cancel_proforma', invoiceId: inv.id, note: note || undefined }, `Pro-forma ${fmtDocNumber(inv.payment_reference)} annulée`)
        if (!amountOk) { setErr('Le montant reçu doit être exactement le TTC attendu.'); return Promise.resolve(false) }
        return onSubmit(
          { action: 'confirm_payment', invoiceId: inv.id, amount: recuN, dateValeur: dateVal, reference: refLue || undefined, paiementId: declared?.id || null, note: note || undefined },
          `${name} : paiement validé, facture émise, ${PLAN_LABEL[inv.plan_code]} activé`,
        )
      }
      break
    }
    case 'profile': {
      title = `Profil de facturation — ${name}`
      cta = 'Enregistrer le profil'
      const ent = pf.type_client === 'entreprise'
      const fld = (k: keyof typeof pf, label: string) => (
        <div><label style={S.label}>{label}</label><input style={S.input} value={pf[k]} onChange={e => setPf(x => ({ ...x, [k]: e.target.value }))} /></div>
      )
      body = (
        <>
          <div style={{ display: 'flex', gap: 16, fontSize: 13, marginBottom: 10 }}>
            {(['entreprise', 'particulier'] as const).map(t => (
              <label key={t} style={{ display: 'flex', gap: 6 }}><input type="radio" checked={pf.type_client === t} onChange={() => setPf(x => ({ ...x, type_client: t }))} />{t === 'entreprise' ? 'Entreprise (ICE)' : 'Particulier'}</label>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {ent && <>{fld('raison_sociale', 'RAISON SOCIALE *')}{fld('ice', 'ICE (15 CHIFFRES) *')}{fld('if_fiscal', 'IF')}{fld('rc', 'RC')}</>}
            <div style={{ gridColumn: '1 / -1' }}>{fld('adresse', 'ADRESSE')}</div>
            {fld('code_postal', 'CODE POSTAL')}{fld('ville', 'VILLE')}{fld('pays', 'PAYS')}
          </div>
          {!ent && <p style={{ fontSize: 11, color: 'var(--inkm)' }}>Particulier : la facture porte le nom et prénom du compte ({displayName(user)}).</p>}
          <p style={{ fontSize: 11, color: 'var(--inkm)' }}>Les factures déjà émises ne changent pas ; le profil s'applique aux prochaines.</p>
        </>
      )
      submit = () => onSubmit({ action: 'update_profile', userId: user.id, profile: pf as any }, `${name} : profil de facturation enregistré`)
      break
    }
    case 'attach': {
      const inv = modal.invoice
      title = `Joindre un justificatif reçu par email — ${name}`
      cta = 'Enregistrer le justificatif'
      body = (
        <>
          <p style={{ fontSize: 12, margin: '0 0 10px' }}>Pro-forma <b>{fmtDocNumber(inv.payment_reference)}</b> · attendu {fmtAmount(invTTC(inv))} TTC. Le justificatif est rattaché à la pro-forma ; la validation se fait ensuite avec « Valider le paiement ».</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={S.label}>MONTANT DU VIREMENT</label><input style={S.input} value={recu} onChange={e => setRecu(e.target.value)} /></div>
            <div><label style={S.label}>DATE DU VIREMENT</label><input style={S.input} type="date" value={dateVal} onChange={e => setDateVal(e.target.value)} /></div>
            <div style={{ gridColumn: '1 / -1' }}><label style={S.label}>FICHIER (PDF, JPG, PNG — 5 MO)</label>
              <input type="file" accept="application/pdf,image/jpeg,image/png" onChange={e => setFile(e.target.files?.[0] || null)} /></div>
          </div>
        </>
      )
      submit = async () => {
        if (!file) { setErr('Choisir le fichier'); return false }
        const fd = new FormData()
        fd.append('invoiceId', inv.id); fd.append('montant', recu || String(invTTC(inv))); fd.append('dateValeur', dateVal); fd.append('reference', refLue || ''); fd.append('file', file)
        const r = await fetch('/api/admin/justificatif', { method: 'POST', credentials: 'include', body: fd })
        const d = await r.json().catch(() => ({}))
        if (!r.ok) { setErr(d.error || 'Erreur'); return false }
        onRawDone?.(`Justificatif joint à ${fmtDocNumber(inv.payment_reference)}`)
        return true
      }
      break
    }
    case 'generaladmin': {
      const on = modal.on
      title = `${on ? 'Accorder' : 'Retirer'} le rôle generaladmin — ${name}`
      cta = on ? 'Accorder generaladmin' : 'Retirer generaladmin'
      body = (
        <p style={{ fontSize: 13, lineHeight: 1.6 }}>
          {on
            ? 'Le compte obtient tous les privilèges (accès Entreprise), sans paiement ni échéance. Il est exclu de la facturation, des relances et des statistiques. Ses pro-formas en attente sont annulées.'
            : 'Le compte perd l’accès complet : il repasse sans abonnement (statut expiré) et devra souscrire normalement.'}
        </p>
      )
      submit = () => onSubmit({ action: 'set_generaladmin', userId: user.id, on, note: note || undefined },
        `${name} : rôle generaladmin ${on ? 'accordé' : 'retiré'}`)
      break
    }
    case 'reject': {
      const p = modal.paiement
      title = `Rejeter le justificatif — ${name}`
      cta = 'Rejeter'
      body = <input style={S.input} value={motif} onChange={e => setMotif(e.target.value)} placeholder="Motif (communiqué au client)" />
      submit = () => onSubmit({ action: 'reject_payment', paiementId: p.id, motif: motif || 'Fonds non reçus' }, 'Justificatif rejeté')
      break
    }
    case 'status': {
      const stAction = modal.action
      const suspend = stAction === 'suspend'
      title = `${suspend ? 'Suspendre' : 'Réactiver'} — ${name}`
      cta = suspend ? 'Suspendre le compte' : 'Réactiver le compte'
      body = (
        <p style={{ fontSize: 13, lineHeight: 1.6 }}>
          {suspend
            ? 'Le client perd immédiatement l\'accès aux modules. Son échéance n\'est pas modifiée.'
            : 'Le statut est recalculé : actif si la période payée est en cours, essai si l\'essai court encore, sinon expiré.'}
        </p>
      )
      submit = () => onSubmit({ action: stAction, userId: user.id, note: note || undefined },
        `${name} ${suspend ? 'suspendu' : 'réactivé'}`)
      break
    }
    case 'extend': {
      title = `Prolonger l'échéance — ${name}`
      cta = 'Prolonger'
      body = (
        <>
          <p style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 10 }}>
            Échéance actuelle : <b>{fmtDate(endDate(user))}</b> ({PLAN_LABEL[user.plan] || user.plan}). Aucune facture n'est émise.
          </p>
          <label style={S.label}>NOMBRE DE JOURS</label>
          <input style={S.input} type="number" min={1} max={366} value={days} onChange={e => setDays(e.target.value)} />
        </>
      )
      submit = () => onSubmit({ action: 'extend', userId: user.id, days: Number(days), note: note || undefined },
        `${name} : échéance prolongée de ${days} jours`)
      break
    }
    case 'delete': {
      title = `Supprimer le compte — ${name}`
      cta = 'Supprimer définitivement'
      const ok = confirmNum.trim().toUpperCase().replace(/\./g, '') === user.numero_abonne
      body = (
        <>
          <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>
            Le compte <b>{user.email}</b> sera supprimé : le client ne pourra plus se connecter et devra se réinscrire
            (il recevra alors un nouveau numéro). Les pro-formas non payées sont annulées. Les factures payées et le
            journal sont conservés sous le numéro <b>{user.numero_abonne}</b>, qui ne sera jamais réattribué.
          </p>
          <p style={{ fontSize: 12, color: '#C0392B', margin: '10px 0' }}>Cette action est irréversible.</p>
          <label style={S.label}>POUR CONFIRMER, SAISIR LE NUMÉRO D'ABONNÉ {user.numero_abonne}</label>
          <input style={{ ...S.input, fontFamily: 'monospace', borderColor: ok ? '#1A7A40' : 'var(--rule)' }}
            value={confirmNum} onChange={e => setConfirmNum(e.target.value)} placeholder={user.numero_abonne} autoComplete="off" />
        </>
      )
      submit = () => {
        if (!ok) { setErr(`Saisir exactement ${fmtAbonne(user.numero_abonne)} pour confirmer.`); return Promise.resolve(false) }
        return onSubmit({ action: 'delete', userId: user.id, confirm: confirmNum.trim().replace(/\./g, ''), note: note || undefined },
          `Compte ${user.numero_abonne} supprimé`)
      }
      break
    }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(12,45,92,.35)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', width: '100%', maxWidth: 480, padding: '1.5rem', borderTop: '3px solid var(--bd)', boxShadow: '0 10px 40px rgba(0,0,0,.15)' }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: 'var(--bd)', marginBottom: '1rem' }}>{title}</div>
        {body}
        <div style={{ marginTop: 14 }}>
          <label style={S.label}>NOTE INTERNE (FACULTATIF)</label>
          <input style={S.input} value={note} onChange={e => setNote(e.target.value)} placeholder="ex. virement BP reçu le 03/11, réf. 12345" />
        </div>
        {err && <div style={{ marginTop: 10, fontSize: 12, color: '#C0392B' }}>{err}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: '1.25rem' }}>
          <button style={S.btn('outline')} onClick={onClose} disabled={busy}>Fermer</button>
          <button style={{ ...S.btn((modal.kind === 'status' && modal.action === 'suspend') || modal.kind === 'delete' ? 'danger' : 'primary'), padding: '7px 14px', fontSize: 12 }}
            disabled={busy}
            onClick={async () => { setErr(''); setBusy(true); await submit(); setBusy(false) }}>
            {busy ? 'En cours…' : cta}
          </button>
        </div>
      </div>
    </div>
  )
}
