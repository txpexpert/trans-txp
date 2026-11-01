// components/AdminAccountsPanel.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Gestion des comptes administrateurs — affiché sous les tuiles du tableau de
// bord et sur la page Administrateurs du backoffice (super-administrateur).
//
//   1. Ajouter un administrateur de type 2 : email, nom, habilitations.
//      Un lien de création de mot de passe lui est envoyé par email (et
//      affiché ici, à transmettre soi-même si l'email n'arrive pas).
//   2. Liste des comptes créés : habilitations modifiables, boutons
//      Activer / Suspendre / Supprimer, renvoi du lien.
// Toutes les actions passent par /api/admin/accounts (réservé au super).
// ─────────────────────────────────────────────────────────────────────────────
import { useCallback, useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { PERMISSIONS, type PermissionCode } from '../lib/adminPermissions'

interface Account {
  id: string; email: string; nom: string | null; niveau: 'super' | 'gestionnaire'
  statut: 'invite' | 'actif' | 'suspendu'; permissions: PermissionCode[]
  created_by: string | null; created_at: string; last_login_at: string | null; token_expires: string | null
}

const STATUT: Record<Account['statut'], { label: string; bg: string; color: string }> = {
  actif:    { label: 'Actif',            bg: '#E6F7EE', color: '#1A7A40' },
  invite:   { label: 'Invitation envoyée', bg: '#FEF5E4', color: '#8A5A10' },
  suspendu: { label: 'Suspendu',         bg: '#FEE8E8', color: '#C0392B' },
}

const btn = (tone: 'primary' | 'outline' | 'danger' | 'success' = 'outline'): CSSProperties => ({
  fontSize: 11, padding: '5px 10px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
  border: '.5px solid ' + (tone === 'primary' ? 'var(--bd)' : tone === 'danger' ? '#C0392B' : tone === 'success' ? '#1A7A40' : 'var(--rule)'),
  background: tone === 'primary' ? 'var(--bd)' : tone === 'danger' ? '#FEE8E8' : 'transparent',
  color: tone === 'primary' ? '#fff' : tone === 'danger' ? '#C0392B' : tone === 'success' ? '#1A7A40' : 'var(--inks)',
})
const input: CSSProperties = { width: '100%', padding: '9px 12px', border: '.5px solid var(--rule)', fontSize: 13, fontFamily: 'inherit', background: 'var(--white)' }
const label: CSSProperties = { fontSize: 10, letterSpacing: '.06em', color: 'var(--inkm)', display: 'block', marginBottom: 4, fontWeight: 600 }
const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('fr-FR') : '—')

async function call(body: object) {
  const r = await fetch('/api/admin/accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) })
  const d = await r.json().catch(() => ({}))
  return { ok: r.ok, data: d }
}

function PermissionBoxes({ value, onChange, idPrefix }: { value: PermissionCode[]; onChange: (v: PermissionCode[]) => void; idPrefix: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 6 }}>
      {PERMISSIONS.map(p => (
        <label key={p.code} htmlFor={`${idPrefix}-${p.code}`} title={p.help}
          style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, cursor: 'pointer', padding: '6px 8px', border: '.5px solid var(--rule)', background: value.includes(p.code) ? 'var(--bl)' : 'var(--white)' }}>
          <input id={`${idPrefix}-${p.code}`} type="checkbox" checked={value.includes(p.code)} style={{ marginTop: 2 }}
            onChange={e => onChange(e.target.checked ? [...value, p.code] : value.filter(x => x !== p.code))} />
          <span>{p.label}</span>
        </label>
      ))}
    </div>
  )
}

export default function AdminAccountsPanel() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [email, setEmail] = useState('')
  const [nom, setNom] = useState('')
  const [perms, setPerms] = useState<PermissionCode[]>(['activer_plans', 'emettre_proformas', 'valider_paiements'])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ tone: 'ok' | 'error'; text: string; link?: string } | null>(null)
  const [editing, setEditing] = useState<{ id: string; perms: PermissionCode[] } | null>(null)
  const [confirm, setConfirm] = useState<{ id: string; action: 'suspend' | 'delete'; email: string; typed: string } | null>(null)

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/accounts', { credentials: 'include' })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || `Erreur ${r.status}`)
      setAccounts(d.accounts || []); setLoadError('')
    } catch (e: any) { setLoadError(e.message) } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const report = (ok: boolean, data: any, success: string) => {
    if (!ok) { setMsg({ tone: 'error', text: data.error || 'Action impossible.' }); return }
    setMsg({
      tone: 'ok',
      text: data.inviteUrl
        ? `${success} ${data.emailSent ? 'Le lien a été envoyé par email.' : 'L’email n’a pas pu partir : transmettez ce lien vous-même.'}`
        : success,
      link: data.inviteUrl,
    })
    load()
  }

  const create = async () => {
    setBusy(true); setMsg(null)
    const r = await call({ action: 'create', email, nom, permissions: perms })
    setBusy(false)
    report(r.ok, r.data, `Accès créé pour ${email.trim().toLowerCase()}.`)
    if (r.ok) { setEmail(''); setNom('') }
  }

  const act = async (body: object, success: string) => {
    setMsg(null)
    const r = await call(body)
    report(r.ok, r.data, success)
    return r.ok
  }

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setMsg(m => m && { ...m, text: m.text + ' (lien copié)' }) } catch {}
  }

  const gestionnaires = accounts.filter(a => a.niveau === 'gestionnaire')
  const master = accounts.find(a => a.niveau === 'super')

  return (
    <section style={{ background: 'var(--white)', border: '.5px solid var(--rule)', marginBottom: '2rem' }}>
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '.5px solid var(--rule)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 19, fontWeight: 700, color: 'var(--bd)' }}>Administrateurs</div>
          <div style={{ fontSize: 12, color: 'var(--inkm)', marginTop: 2 }}>
            Les administrateurs ajoutés ici accèdent uniquement à « Gestion des abonnements », avec les habilitations cochées.
          </div>
        </div>
        {master && (
          <div style={{ fontSize: 11, color: 'var(--inkm)' }}>
            Super-administrateur : <b style={{ color: 'var(--bd)' }}>{master.email}</b>
          </div>
        )}
      </div>

      {/* ── Ajouter un administrateur ── */}
      <form onSubmit={e => { e.preventDefault(); create() }} style={{ padding: '1.25rem 1.5rem', borderBottom: '.5px solid var(--rule)', background: 'var(--paper, #FAFBFD)' }}>
        <div style={{ fontSize: 11, letterSpacing: '.08em', color: 'var(--inkm)', marginBottom: '.75rem', fontWeight: 600 }}>AJOUTER UN ADMINISTRATEUR (TYPE 2)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12, marginBottom: 12 }}>
          <div><label style={label} htmlFor="adm-email">EMAIL</label><input id="adm-email" type="email" style={input} value={email} onChange={e => setEmail(e.target.value)} placeholder="prenom.nom@exemple.com" required /></div>
          <div><label style={label} htmlFor="adm-nom">NOM (FACULTATIF)</label><input id="adm-nom" style={input} value={nom} onChange={e => setNom(e.target.value)} placeholder="Prénom Nom" /></div>
        </div>
        <span style={label}>HABILITATIONS</span>
        <PermissionBoxes value={perms} onChange={setPerms} idPrefix="new" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
          <button type="submit" disabled={busy || !email || perms.length === 0} style={{ ...btn('primary'), padding: '8px 16px', fontSize: 12, opacity: busy || !email || perms.length === 0 ? .5 : 1 }}>
            {busy ? 'Création…' : 'Ajouter et envoyer l’invitation'}
          </button>
          <span style={{ fontSize: 11, color: 'var(--inkm)' }}>Créer, suspendre ou supprimer des comptes clients reste réservé au super-administrateur.</span>
        </div>
      </form>

      {msg && (
        <div style={{ margin: '1rem 1.5rem 0', padding: '10px 14px', fontSize: 12, lineHeight: 1.6, background: msg.tone === 'ok' ? '#E6F7EE' : '#FEE8E8', color: msg.tone === 'ok' ? '#1A7A40' : '#C0392B' }}>
          {msg.text}
          {msg.link && (
            <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <code style={{ fontSize: 11, background: 'var(--white)', padding: '3px 6px', wordBreak: 'break-all', userSelect: 'all', color: 'var(--bd)' }}>{msg.link}</code>
              <button type="button" style={btn()} onClick={() => copy(msg.link!)}>Copier le lien</button>
            </div>
          )}
        </div>
      )}

      {/* ── Comptes créés ── */}
      <div style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ fontSize: 11, letterSpacing: '.08em', color: 'var(--inkm)', marginBottom: '.75rem', fontWeight: 600 }}>
          COMPTES CRÉÉS ({gestionnaires.length})
        </div>
        {loadError && <div style={{ fontSize: 12, color: '#C0392B', marginBottom: 8 }}>{loadError}</div>}
        {!loading && gestionnaires.length === 0 && !loadError && (
          <p style={{ fontSize: 13, color: 'var(--inkm)', margin: 0 }}>Aucun administrateur de type 2 pour l’instant. Ajoutez-en un avec le formulaire ci-dessus.</p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {gestionnaires.map(a => {
            const st = STATUT[a.statut]
            const isEditing = editing?.id === a.id
            const isConfirming = confirm?.id === a.id
            return (
              <div key={a.id} style={{ border: '.5px solid var(--rule)', padding: '12px 14px' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 0, flex: '1 1 220px' }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--bd)', overflowWrap: 'anywhere' }}>{a.email}</div>
                    <div style={{ fontSize: 11, color: 'var(--inkm)' }}>
                      {a.nom ? `${a.nom} · ` : ''}créé le {fmt(a.created_at)} · dernière connexion {fmt(a.last_login_at)}
                    </div>
                  </div>
                  <span style={{ fontSize: 10, padding: '2px 8px', background: st.bg, color: st.color, fontWeight: 600 }}>{st.label}</span>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {a.statut === 'suspendu'
                      ? <button type="button" style={btn('success')} onClick={() => act({ action: 'activate', id: a.id }, `${a.email} réactivé.`)}>Activer</button>
                      : <button type="button" style={btn('danger')} onClick={() => setConfirm({ id: a.id, action: 'suspend', email: a.email, typed: '' })}>Suspendre</button>}
                    <button type="button" style={btn()} onClick={() => setEditing(isEditing ? null : { id: a.id, perms: a.permissions })}>
                      {isEditing ? 'Fermer' : 'Habilitations'}
                    </button>
                    {a.statut !== 'suspendu' && (
                      <button type="button" style={btn()} onClick={() => act({ action: 'resend', id: a.id }, `Nouveau lien créé pour ${a.email}.`)}>
                        {a.statut === 'invite' ? 'Renvoyer l’invitation' : 'Lien mot de passe'}
                      </button>
                    )}
                    <button type="button" style={btn('danger')} onClick={() => setConfirm({ id: a.id, action: 'delete', email: a.email, typed: '' })}>Supprimer</button>
                  </div>
                </div>

                {!isEditing && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
                    {a.permissions.length === 0 && <span style={{ fontSize: 11, color: 'var(--inkm)' }}>Aucune habilitation</span>}
                    {PERMISSIONS.filter(p => a.permissions.includes(p.code)).map(p => (
                      <span key={p.code} style={{ fontSize: 10, padding: '2px 8px', background: 'var(--bl)', color: 'var(--bd)' }}>{p.label}</span>
                    ))}
                  </div>
                )}

                {isEditing && editing && (
                  <div style={{ marginTop: 10 }}>
                    <PermissionBoxes value={editing.perms} onChange={v => setEditing({ id: a.id, perms: v })} idPrefix={`ed-${a.id}`} />
                    <button type="button" style={{ ...btn('primary'), marginTop: 8 }} disabled={editing.perms.length === 0}
                      onClick={async () => { if (await act({ action: 'permissions', id: a.id, permissions: editing.perms }, `Habilitations de ${a.email} enregistrées.`)) setEditing(null) }}>
                      Enregistrer les habilitations
                    </button>
                  </div>
                )}

                {isConfirming && confirm && (
                  <div style={{ marginTop: 10, padding: '10px 12px', background: '#FEF7F6', border: '.5px solid #F2C4BE' }}>
                    {confirm.action === 'suspend' ? (
                      <>
                        <div style={{ fontSize: 12, marginBottom: 8 }}>Suspendre <b>{a.email}</b> ? Ses sessions ouvertes sont coupées immédiatement ; vous pourrez le réactiver.</div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button type="button" style={btn('danger')} onClick={async () => { if (await act({ action: 'suspend', id: a.id }, `${a.email} suspendu.`)) setConfirm(null) }}>Confirmer la suspension</button>
                          <button type="button" style={btn()} onClick={() => setConfirm(null)}>Annuler</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: 12, marginBottom: 6 }}>Supprimer définitivement l’accès de <b>{a.email}</b> ? Pour confirmer, saisissez son email.</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <input id={`del-${a.id}`} style={{ ...input, maxWidth: 280, fontSize: 12, padding: '6px 10px' }} value={confirm.typed}
                            onChange={e => setConfirm({ ...confirm, typed: e.target.value })} placeholder={a.email} autoComplete="off" />
                          <button type="button" style={btn('danger')} disabled={confirm.typed.trim().toLowerCase() !== a.email}
                            onClick={async () => { if (await act({ action: 'delete', id: a.id, confirm: confirm.typed }, `Accès de ${a.email} supprimé.`)) setConfirm(null) }}>
                            Supprimer définitivement
                          </button>
                          <button type="button" style={btn()} onClick={() => setConfirm(null)}>Annuler</button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
