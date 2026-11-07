// pages/mon-abonnement.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Espace client « Mon abonnement / Mes factures ».
//   • abonnement en cours, période couverte, jours restants ;
//   • profil de facturation (entreprise avec ICE, ou particulier) ;
//   • choix du plan + demande de pro-forma (à tout moment, y compris pendant
//     l'essai ; sinon la pro-forma est envoyée automatiquement en fin d'essai) ;
//   • pro-forma en attente : coordonnées bancaires, référence de virement,
//     dépôt du justificatif ;
//   • historique : factures, avoirs, paiements.
// Exclue du middleware (voir middleware.ts) : reste accessible quand
// l'abonnement est expiré — c'est précisément là que le client en a besoin.
// ─────────────────────────────────────────────────────────────────────────────
import { useCallback, useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { PLAN_LABEL, STATUT_STYLE } from '../lib/subscriptions'
import {
  fmtAbonne, fmtDocNumber, fmtMAD, fmtDateLong, docTTC, profileComplete,
  DOC_STATUS_LABEL, PAIEMENT_STATUT_LABEL,
  type BillingDoc, type Avoir, type Paiement,
} from '../lib/billing'

interface Me {
  user: {
    id: string; numero_abonne: string; email: string; nom: string | null; prenom: string | null
    plan: string; statut: string; role: string | null; trial_ends_at: string | null; plan_ends_at: string | null
    plan_souhaite: string | null; type_client: 'entreprise' | 'particulier' | null
    raison_sociale: string | null; ice: string | null; if_fiscal: string | null; rc: string | null
    adresse_facturation: string | null; code_postal: string | null; ville: string | null; pays: string | null
  }
  documents: BillingDoc[]
  avoirs: Avoir[]
  paiements: Paiement[]
  plans: { code: string; label: string; price_per_year: number | null; monthly_ref: number | null; vat_rate: number; note: string | null }[]
  bank: { raison_sociale: string; titulaire_compte: string | null; banque: string | null; rib: string | null; swift: string | null
          email_facturation: string | null; tva_rate: number; delai_paiement_jours: number } | null
}

const S = {
  card: { background: 'var(--white)', border: '.5px solid var(--rule)', padding: '1.25rem 1.5rem', marginBottom: '1.25rem' } as CSSProperties,
  h2: { fontFamily: "'DM Serif Display',serif", fontSize: 18, color: 'var(--bd)', margin: '0 0 .9rem' } as CSSProperties,
  label: { fontSize: 10, letterSpacing: '.06em', color: 'var(--inkm)', display: 'block', marginBottom: 4 } as CSSProperties,
  input: { width: '100%', padding: '8px 10px', border: '.5px solid var(--rule)', fontSize: 13, fontFamily: 'inherit', background: 'var(--white)' } as CSSProperties,
  btn: (primary = true): CSSProperties => ({
    padding: '9px 18px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
    background: primary ? 'var(--bd)' : 'transparent', color: primary ? '#fff' : 'var(--bd)', border: '.5px solid var(--bd)',
  }),
  row: { display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '.5px solid var(--rule)', fontSize: 13 } as CSSProperties,
  mono: { fontFamily: 'monospace', fontWeight: 600, color: 'var(--bd)' } as CSSProperties,
}

const daysUntil = (iso: string | null) => iso ? Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000) : null

export default function MonAbonnement() {
  const router = useRouter()
  const { user: session, loading } = useAuth()
  const [me, setMe] = useState<Me | null>(null)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null)
  const notify = (msg: string, err = false) => { setToast({ msg, err }); setTimeout(() => setToast(null), 5000) }

  const load = useCallback(async () => {
    const r = await fetch('/api/billing/me', { credentials: 'include' })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) { setError(d.error || `Erreur ${r.status}`); return }
    setMe(d); setError('')
  }, [])

  useEffect(() => {
    if (loading) return
    if (!session) { router.push('/auth/login?redirect=/mon-abonnement'); return }
    load()
  }, [loading, session, router, load])

  if (loading || (!me && !error)) {
    return <Layout><div style={{ padding: '3rem', textAlign: 'center', color: 'var(--inkm)' }}>Chargement…</div></Layout>
  }
  if (!me) return <Layout><div style={{ padding: '3rem', textAlign: 'center', color: '#C0392B' }}>{error}</div></Layout>

  const u = me.user
  const isGA = u.role === 'generaladmin'
  const pending = me.documents.find(d => d.status === 'proforma_envoyee') || null
  const paid = me.documents.filter(d => d.status === 'payee')
  const current = paid.find(d => d.period_end && new Date(d.period_end).getTime() > Date.now()) || paid[0] || null
  const st = STATUT_STYLE[u.statut] || { bg: '#eee', color: '#555', label: u.statut }
  const end = u.plan === 'trial' ? u.trial_ends_at : u.plan_ends_at
  const left = daysUntil(end)

  return (
    <Layout>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: toast.err ? '#C0392B' : '#059669', color: '#fff', padding: '10px 18px', fontSize: 12, zIndex: 1000, maxWidth: 420 }}>
          {toast.msg}
        </div>
      )}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '2rem 1rem' }}>
        <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 28, fontWeight: 700, color: 'var(--bd)', marginBottom: 4 }}>Mon abonnement</h1>
        <p style={{ fontSize: 13, color: 'var(--inkm)', marginBottom: '1.5rem' }}>
          Abonnement, factures et paiements. <Link href="/dashboard">Retour à mon compte</Link>
        </p>

        {/* ── Abonnement en cours ── */}
        <div style={S.card}>
          <div style={S.row}><span style={{ color: 'var(--inkm)' }}>N° d'abonné</span><span style={S.mono}>{fmtAbonne(u.numero_abonne)}</span></div>
          <div style={S.row}><span style={{ color: 'var(--inkm)' }}>Plan</span><span style={{ fontWeight: 600 }}>{isGA ? 'Generaladmin (accès complet)' : PLAN_LABEL[u.plan] || u.plan}</span></div>
          <div style={S.row}>
            <span style={{ color: 'var(--inkm)' }}>Statut</span>
            <span style={{ fontSize: 11, padding: '2px 10px', background: st.bg, color: st.color, fontWeight: 600 }}>{st.label}</span>
          </div>
          {!isGA && current?.period_end && u.plan !== 'trial' && (
            <div style={S.row}><span style={{ color: 'var(--inkm)' }}>Période couverte</span>
              <span>du {fmtDateLong(current.period_start)} au {fmtDateLong(current.period_end)}</span></div>
          )}
          {!isGA && end && (
            <div style={{ ...S.row, borderBottom: 'none' }}>
              <span style={{ color: 'var(--inkm)' }}>{u.plan === 'trial' ? 'Fin de l’essai gratuit' : 'Échéance'}</span>
              <span style={{ fontWeight: 600 }}>{fmtDateLong(end)}{left !== null && left >= 0 ? ` · ${left} jour${left > 1 ? 's' : ''} restant${left > 1 ? 's' : ''}` : ''}</span>
            </div>
          )}
          {isGA && <p style={{ fontSize: 12, color: 'var(--inkm)', margin: '10px 0 0' }}>Compte generaladmin : tous les privilèges, sans paiement ni échéance.</p>}
        </div>

        {!isGA && (
          <>
            {u.statut === 'trial' && !pending && (
              <div style={{ ...S.card, background: '#EEF4FE', borderColor: '#B8CCF5' }}>
                Votre essai gratuit court jusqu'au <b>{fmtDateLong(u.trial_ends_at)}</b>. Choisissez votre plan ci-dessous :
                la pro-forma vous sera envoyée à la fin de l'essai, ou dès maintenant si vous souhaitez régler plus tôt
                (les 12 mois démarrent à la validation du paiement).
              </div>
            )}
            {u.statut === 'expired' && !pending && (
              <div style={{ ...S.card, background: '#FEF5E4', borderColor: '#E8C97A' }}>
                Votre accès est suspendu. Choisissez votre abonnement pour recevoir votre facture pro-forma ;
                l'accès est rétabli pour 12 mois à la validation du virement.
              </div>
            )}

            <ProfileForm me={me} onSaved={() => { notify('Profil de facturation enregistré'); load() }} onError={m => notify(m, true)} />

            {pending
              ? <PendingProforma doc={pending} me={me} onDone={(m) => { notify(m); load() }} onError={m => notify(m, true)} />
              : <PlanChooser me={me} onDone={(m) => { notify(m); load() }} onError={m => notify(m, true)} />}

            <History me={me} />
          </>
        )}
      </div>
    </Layout>
  )
}

// ── Profil de facturation ────────────────────────────────────────────────────
function ProfileForm({ me, onSaved, onError }: { me: Me; onSaved: () => void; onError: (m: string) => void }) {
  const u = me.user
  const [open, setOpen] = useState(!profileComplete({ ...u, adresse: u.adresse_facturation }))
  const [f, setF] = useState({
    type_client: u.type_client || 'entreprise', raison_sociale: u.raison_sociale || '', ice: u.ice || '',
    if_fiscal: u.if_fiscal || '', rc: u.rc || '', adresse: u.adresse_facturation || '', code_postal: u.code_postal || '',
    ville: u.ville || '', pays: u.pays || 'Maroc', nom: u.nom || '', prenom: u.prenom || '',
  })
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF(x => ({ ...x, [k]: e.target.value }))
  const ent = f.type_client === 'entreprise'

  const save = async () => {
    setBusy(true)
    const r = await fetch('/api/billing/me', {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'profile', profile: f }),
    })
    const d = await r.json().catch(() => ({}))
    setBusy(false)
    if (r.ok) { setOpen(false); onSaved() } else onError(d.error || 'Erreur')
  }

  const field = (k: keyof typeof f, label: string, props: Record<string, unknown> = {}) => (
    <div><label style={S.label}>{label}</label><input style={S.input} value={f[k]} onChange={set(k)} {...props} /></div>
  )

  return (
    <div style={S.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h2 style={S.h2}>Profil de facturation</h2>
        {!open && <button style={S.btn(false)} onClick={() => setOpen(true)}>Modifier</button>}
      </div>
      {!open ? (
        <div style={{ fontSize: 13, lineHeight: 1.7 }}>
          {u.type_client === 'entreprise'
            ? <><b>{u.raison_sociale}</b> · ICE {u.ice}{u.if_fiscal ? ` · IF ${u.if_fiscal}` : ''}{u.rc ? ` · RC ${u.rc}` : ''}</>
            : <><b>{[u.prenom, u.nom].filter(Boolean).join(' ')}</b> · particulier</>}
          <br />{[u.adresse_facturation, u.code_postal, u.ville, u.pays].filter(Boolean).join(', ') || <i>Adresse non renseignée</i>}
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 18, marginBottom: 12, fontSize: 13 }}>
            {(['entreprise', 'particulier'] as const).map(t => (
              <label key={t} style={{ display: 'flex', gap: 6, cursor: 'pointer' }}>
                <input type="radio" checked={f.type_client === t} onChange={() => setF(x => ({ ...x, type_client: t }))} />
                {t === 'entreprise' ? 'Entreprise (avec ICE)' : 'Particulier / personne physique'}
              </label>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {ent ? <>
              {field('raison_sociale', 'RAISON SOCIALE *')}
              {field('ice', 'ICE (15 CHIFFRES) *', { inputMode: 'numeric', maxLength: 15 })}
              {field('if_fiscal', 'IDENTIFIANT FISCAL')}
              {field('rc', 'REGISTRE DU COMMERCE')}
            </> : <>
              {field('prenom', 'PRÉNOM *')}
              {field('nom', 'NOM *')}
            </>}
            <div style={{ gridColumn: '1 / -1' }}>{field('adresse', 'ADRESSE')}</div>
            {field('code_postal', 'CODE POSTAL')}
            {field('ville', 'VILLE')}
            {field('pays', 'PAYS')}
          </div>
          <p style={{ fontSize: 11, color: 'var(--inkm)', margin: '10px 0' }}>
            Ces informations figurent sur vos factures. Pour une entreprise, l'ICE est obligatoire (déductibilité de la TVA).
          </p>
          <button style={S.btn()} onClick={save} disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
        </>
      )}
    </div>
  )
}

// ── Choix du plan / demande de pro-forma ─────────────────────────────────────
function PlanChooser({ me, onDone, onError }: { me: Me; onDone: (m: string) => void; onError: (m: string) => void }) {
  const [busy, setBusy] = useState('')
  const vat = me.bank?.tva_rate ?? 20
  const ready = profileComplete({ ...me.user, adresse: me.user.adresse_facturation })

  const post = async (action: string, plan: string) => {
    setBusy(action + plan)
    const r = await fetch('/api/billing/me', {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, plan }),
    })
    const d = await r.json().catch(() => ({}))
    setBusy('')
    if (!r.ok) return onError(d.error || 'Erreur')
    onDone(action === 'request_proforma'
      ? (d.emailed ? 'Pro-forma émise et envoyée par email' : 'Pro-forma émise (email non envoyé : consultez-la ci-dessous)')
      : `Plan ${PLAN_LABEL[plan]} retenu`)
  }

  return (
    <div style={S.card}>
      <h2 style={S.h2}>Choisir mon abonnement annuel</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
        {me.plans.map(p => {
          const chosen = me.user.plan_souhaite === p.code
          const ht = p.price_per_year != null ? Number(p.price_per_year) : null
          return (
            <div key={p.code} style={{ border: `1px solid ${chosen ? 'var(--bd)' : 'var(--rule)'}`, padding: '1rem' }}>
              <div style={{ fontWeight: 700, color: 'var(--bd)' }}>{p.label}{chosen && <span style={{ fontSize: 10, marginLeft: 8, color: '#1A7A40' }}>✓ CHOISI</span>}</div>
              {ht != null ? <>
                <div style={{ fontSize: 20, fontFamily: "'DM Serif Display',serif", margin: '6px 0 2px' }}>{fmtMAD(ht)} <small style={{ fontSize: 11 }}>HT / an</small></div>
                <div style={{ fontSize: 12, color: 'var(--inkm)' }}>soit {fmtMAD(ht * (1 + vat / 100))} TTC · ≈ {Math.round(ht * (1 + vat / 100) / 12)} DH TTC / mois</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                  {!chosen && <button style={S.btn(false)} disabled={!!busy} onClick={() => post('choose_plan', p.code)}>Choisir</button>}
                  <button style={{ ...S.btn(), opacity: ready ? 1 : .5 }} disabled={!!busy || !ready} onClick={() => post('request_proforma', p.code)}
                    title={ready ? '' : 'Complétez d’abord votre profil de facturation'}>
                    {busy === 'request_proforma' + p.code ? 'Émission…' : 'Recevoir ma pro-forma'}
                  </button>
                </div>
              </> : <>
                <div style={{ fontSize: 13, color: 'var(--inkm)', margin: '8px 0' }}>Sur contrat, conditions personnalisées.</div>
                <Link href="/contact?sujet=entreprise"><button style={S.btn(false)}>Nous contacter</button></Link>
              </>}
            </div>
          )
        })}
      </div>
      {!ready && <p style={{ fontSize: 12, color: '#8A5A10', marginTop: 10 }}>Complétez votre profil de facturation pour recevoir une pro-forma.</p>}
    </div>
  )
}

// ── Pro-forma en attente + dépôt du justificatif ─────────────────────────────
function PendingProforma({ doc, me, onDone, onError }: { doc: BillingDoc; me: Me; onDone: (m: string) => void; onError: (m: string) => void }) {
  const ttc = docTTC(doc)
  const [montant, setMontant] = useState(String(ttc))
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [ref, setRef] = useState(fmtDocNumber(doc.payment_reference))
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const declared = me.paiements.filter(p => p.invoice_id === doc.id)
  const b = me.bank

  const send = async () => {
    if (!file) return onError('Joindre le justificatif (PDF, JPG ou PNG)')
    setBusy(true)
    const fd = new FormData()
    fd.append('invoiceId', doc.id); fd.append('montant', montant); fd.append('dateValeur', date); fd.append('reference', ref); fd.append('file', file)
    const r = await fetch('/api/billing/justificatif', { method: 'POST', credentials: 'include', body: fd })
    const d = await r.json().catch(() => ({}))
    setBusy(false)
    if (!r.ok) return onError(d.error || 'Erreur')
    onDone(d.warning || 'Justificatif reçu : nous vérifions la réception du virement')
    setFile(null)
  }

  const line = (k: string, v: ReactNode, mono = false) => (
    <div style={S.row}><span style={{ color: 'var(--inkm)' }}>{k}</span><span style={mono ? S.mono : { fontWeight: 600 }}>{v}</span></div>
  )

  return (
    <div style={{ ...S.card, borderLeft: '3px solid #D97706' }}>
      <h2 style={S.h2}>Pro-forma en attente de paiement</h2>
      {line('Pro-forma', <a href={`/facturation/document/${doc.id}`} target="_blank" rel="noreferrer">{fmtDocNumber(doc.payment_reference)} — voir / imprimer</a>)}
      {line('Abonnement', `${PLAN_LABEL[doc.plan_code] || doc.plan_code} · ${doc.years} an${doc.years > 1 ? 's' : ''}`)}
      {line('Montant', `${fmtMAD(doc.amount_ht)} HT + TVA ${doc.vat_rate ?? 20} % = ${fmtMAD(ttc)} TTC`)}
      {doc.due_date && line('À régler avant le', fmtDateLong(doc.due_date))}
      <div style={{ background: '#FFFBF0', border: '.5px solid #E8C97A', padding: '12px 14px', margin: '14px 0', fontSize: 13, lineHeight: 1.7 }}>
        <b>Virement bancaire</b><br />
        Bénéficiaire : {b?.titulaire_compte || b?.raison_sociale || 'RIGORIS LEX'}<br />
        Banque : {b?.banque || '— (communiquée prochainement)'}<br />
        RIB : <span style={S.mono}>{b?.rib || '— (communiqué prochainement)'}</span>{b?.swift ? <> · SWIFT {b.swift}</> : null}<br />
        Montant exact : <b>{fmtMAD(ttc)}</b> · Référence à indiquer : <span style={S.mono}>{fmtDocNumber(doc.payment_reference)}</span>
      </div>

      {declared.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {declared.map(p => (
            <div key={p.id} style={{ fontSize: 12, padding: '6px 0', borderBottom: '.5px solid var(--rule)' }}>
              {fmtDateLong(p.created_at)} · {fmtMAD(p.montant)} · {p.justificatif_nom || 'justificatif'} — <b>{PAIEMENT_STATUT_LABEL[p.statut]}</b>
              {p.motif_rejet ? ` (${p.motif_rejet})` : ''}
            </div>
          ))}
        </div>
      )}

      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--bd)', margin: '6px 0 8px' }}>Déposer mon justificatif de virement</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <div><label style={S.label}>MONTANT VIRÉ (DH)</label><input style={S.input} value={montant} onChange={e => setMontant(e.target.value)} inputMode="decimal" /></div>
        <div><label style={S.label}>DATE DU VIREMENT</label><input style={S.input} type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
        <div><label style={S.label}>RÉFÉRENCE INDIQUÉE</label><input style={S.input} value={ref} onChange={e => setRef(e.target.value)} /></div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={S.label}>JUSTIFICATIF (PDF, JPG OU PNG — 5 MO MAX)</label>
          <input type="file" accept="application/pdf,image/jpeg,image/png" onChange={e => setFile(e.target.files?.[0] || null)} />
        </div>
      </div>
      <p style={{ fontSize: 11, color: 'var(--inkm)', margin: '10px 0' }}>
        Vous pouvez aussi l'envoyer par email{b?.email_facturation ? ` à ${b.email_facturation}` : ''} en rappelant la référence.
        Un virement d'un montant différent ne peut pas être accepté.
      </p>
      <button style={S.btn()} onClick={send} disabled={busy}>{busy ? 'Envoi…' : 'Envoyer le justificatif'}</button>
    </div>
  )
}

// ── Historique ───────────────────────────────────────────────────────────────
function History({ me }: { me: Me }) {
  const docs = me.documents.filter(d => d.status !== 'proforma_envoyee')
  if (!docs.length && !me.avoirs.length) return null
  return (
    <div style={S.card}>
      <h2 style={S.h2}>Mes factures</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr>{['DOCUMENT', 'DATE', 'PÉRIODE', 'MONTANT TTC', 'STATUT'].map(h =>
            <th key={h} style={{ textAlign: 'left', fontSize: 10, letterSpacing: '.06em', color: 'var(--inkm)', padding: '6px 4px', borderBottom: '.5px solid var(--rule)' }}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {docs.map(d => (
            <tr key={d.id} style={{ borderBottom: '.5px solid var(--rule)' }}>
              <td style={{ padding: '7px 4px' }}>
                <a href={`/facturation/document/${d.id}`} target="_blank" rel="noreferrer" style={S.mono}>
                  {d.status === 'payee' ? d.invoice_number : fmtDocNumber(d.proforma_number)}
                </a>
                <div style={{ fontSize: 10, color: 'var(--inkm)' }}>{d.status === 'payee' ? 'Facture' : 'Pro-forma'} · {PLAN_LABEL[d.plan_code] || d.plan_code}</div>
              </td>
              <td style={{ padding: '7px 4px' }}>{fmtDateLong(d.issued_at || d.paid_at || d.sent_at || d.created_at)}</td>
              <td style={{ padding: '7px 4px' }}>{d.period_end ? `${fmtDateLong(d.period_start)} → ${fmtDateLong(d.period_end)}` : '—'}</td>
              <td style={{ padding: '7px 4px' }}>{fmtMAD(docTTC(d))}</td>
              <td style={{ padding: '7px 4px' }}>{DOC_STATUS_LABEL[d.status]}</td>
            </tr>
          ))}
          {me.avoirs.map(a => (
            <tr key={a.id} style={{ borderBottom: '.5px solid var(--rule)' }}>
              <td style={{ padding: '7px 4px' }}>
                <a href={`/facturation/document/${a.id}?type=avoir`} target="_blank" rel="noreferrer" style={S.mono}>{fmtDocNumber(a.avoir_number)}</a>
                <div style={{ fontSize: 10, color: 'var(--inkm)' }}>Avoir sur {a.invoice_number}</div>
              </td>
              <td style={{ padding: '7px 4px' }}>{fmtDateLong(a.issued_at)}</td>
              <td style={{ padding: '7px 4px' }}>—</td>
              <td style={{ padding: '7px 4px' }}>− {fmtMAD(a.amount_ttc)}</td>
              <td style={{ padding: '7px 4px' }}>Avoir</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
