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
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import {
  PLAN_LABEL, PAID_PLANS, fmtAmount, fmtDate, displayName, endDate,
  type Subscriber, type Invoice, type PlanRow, type AdminAction,
} from '../lib/subscriptions'

export async function postAdminAction(payload: AdminAction): Promise<{ ok: boolean; error?: string }> {
  try {
    const r = await fetch('/api/admin/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    })
    const d = await r.json().catch(() => ({}))
    return r.ok ? { ok: true } : { ok: false, error: d.error || `Erreur ${r.status}` }
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

interface Props {
  user:      Subscriber
  plans:     PlanRow[]
  pending:   Invoice[]            // pro-formas en attente pour cet utilisateur
  onDone:    (message: string) => void
  onError:   (message: string) => void
  compact?:  boolean
}

export default function SubscriptionActions({ user, plans, pending, onDone, onError, compact }: Props) {
  const [modal, setModal] = useState<ModalState | null>(null)
  const isPaidActive = user.statut === 'active' && (PAID_PLANS as readonly string[]).includes(user.plan)

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }} onClick={e => e.stopPropagation()}>
        {pending.map(inv => (
          <span key={inv.id} style={{ display: 'contents' }}>
            <button style={S.btn('success')} onClick={() => setModal({ kind: 'invoice', action: 'confirm_payment', invoice: inv })}>
              ✓ Valider le paiement {PLAN_LABEL[inv.plan_code]}
            </button>
            {!compact && (
              <button style={S.btn('outline')} onClick={() => setModal({ kind: 'invoice', action: 'cancel_proforma', invoice: inv })}>
                Annuler pro-forma
              </button>
            )}
          </span>
        ))}

        {PAID_PLANS.map(code => {
          const current = isPaidActive && user.plan === code
          return (
            <button key={code} style={S.btn(current ? 'primary' : 'outline')}
              onClick={() => setModal({ kind: 'plan', plan: code, renew: current })}>
              {current ? `↻ Renouveler ${PLAN_LABEL[code]}` : `Activer ${PLAN_LABEL[code]}`}
            </button>
          )
        })}

        {user.statut === 'suspended'
          ? <button style={S.btn('success')} onClick={() => setModal({ kind: 'status', action: 'reactivate' })}>Réactiver</button>
          : <button style={S.btn('danger')}  onClick={() => setModal({ kind: 'status', action: 'suspend' })}>Suspendre</button>}

        {(user.plan === 'trial' || (PAID_PLANS as readonly string[]).includes(user.plan)) && (
          <button style={S.btn('outline')} onClick={() => setModal({ kind: 'extend' })}>Prolonger</button>
        )}

        {!compact && user.role !== 'admin' && (
          <button style={{ ...S.btn('danger'), background: '#FEE8E8' }} onClick={() => setModal({ kind: 'delete' })}>
            Supprimer
          </button>
        )}
      </div>

      {modal && (
        <ActionModal
          modal={modal} user={user} plans={plans}
          onClose={() => setModal(null)}
          onSubmit={async (payload, okMsg) => {
            const r = await postAdminAction(payload)
            if (r.ok) { setModal(null); onDone(okMsg) } else onError(r.error || 'Erreur')
            return r.ok
          }}
        />
      )}
    </>
  )
}

// ── Fenêtre de confirmation ──────────────────────────────────────────────────
function ActionModal({ modal, user, plans, onClose, onSubmit }: {
  modal: ModalState
  user: Subscriber
  plans: PlanRow[]
  onClose: () => void
  onSubmit: (payload: AdminAction, okMsg: string) => Promise<boolean>
}) {
  // Valeurs extraites avant usage dans des callbacks (TS 5.3 perd le narrowing dans les closures)
  const planCode = modal.kind === 'plan' ? modal.plan : null
  const planRow = planCode ? plans.find(p => p.code === planCode) : undefined
  const [years, setYears]   = useState(1)
  const [amount, setAmount] = useState<string>(planRow?.price_per_year != null ? String(planRow.price_per_year) : '')
  const [mode, setMode]     = useState<'activate_plan' | 'create_proforma'>('activate_plan')
  const [days, setDays]     = useState('30')
  const [note, setNote]     = useState('')
  const [busy, setBusy]     = useState(false)
  const [err, setErr]       = useState('')
  const [confirmNum, setConfirmNum] = useState('')
  // Le numéro d'abonné identifie le compte dans chaque fenêtre d'action.
  const name = `${user.numero_abonne} · ${displayName(user)}`

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
              <label style={S.label}>MONTANT (DH){contractual ? ' — CONTRAT' : ''}</label>
              <input style={S.input} type="number" min={0} value={amount} placeholder={contractual ? 'Montant du contrat' : ''}
                onChange={e => setAmount(e.target.value)} />
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={S.label}>MODE</label>
            <label style={{ display: 'flex', gap: 8, fontSize: 13, marginBottom: 6, cursor: 'pointer' }}>
              <input type="radio" checked={mode === 'activate_plan'} onChange={() => setMode('activate_plan')} />
              <span><b>Paiement reçu</b> — activer maintenant et émettre la facture</span>
            </label>
            <label style={{ display: 'flex', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input type="radio" checked={mode === 'create_proforma'} onChange={() => setMode('create_proforma')} />
              <span><b>En attente de virement</b> — émettre une pro-forma ; le plan sera activé à la validation du paiement</span>
            </label>
          </div>
          <p style={{ fontSize: 12, color: 'var(--inkm)', marginTop: 12, lineHeight: 1.5 }}>
            {modal.renew
              ? `La nouvelle période s'ajoutera à l'échéance actuelle (${fmtDate(endDate(user))}).`
              : 'La période démarre le jour de la validation du paiement.'}
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
      title = confirm ? `Valider le paiement — ${name}` : `Annuler la pro-forma — ${name}`
      cta = confirm ? `Paiement reçu : activer ${PLAN_LABEL[inv.plan_code]}` : 'Annuler la pro-forma'
      body = (
        <p style={{ fontSize: 13, lineHeight: 1.6 }}>
          Pro-forma <b>{inv.proforma_number}</b> · {PLAN_LABEL[inv.plan_code]} · {inv.years} an{inv.years > 1 ? 's' : ''} · <b>{fmtAmount(inv.amount)}</b>
          <br />
          {confirm
            ? 'Une facture définitive sera numérotée et le plan sera activé immédiatement.'
            : 'La pro-forma sera marquée comme annulée. Le compte n\'est pas modifié.'}
        </p>
      )
      submit = () => onSubmit(
        { action: invAction, invoiceId: inv.id, note: note || undefined },
        confirm ? `${name} : paiement validé, ${PLAN_LABEL[inv.plan_code]} activé` : `Pro-forma ${inv.proforma_number} annulée`,
      )
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
      const ok = confirmNum.trim().toUpperCase() === user.numero_abonne
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
        if (!ok) { setErr(`Saisir exactement ${user.numero_abonne} pour confirmer.`); return Promise.resolve(false) }
        return onSubmit({ action: 'delete', userId: user.id, confirm: confirmNum.trim(), note: note || undefined },
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
