// components/BillingSettingsPanel.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Paramètres de facturation (émetteur RIGORIS LEX, identifiants fiscaux, RIB,
// code site) — /api/admin/billing-settings. Lecture pour tout administrateur,
// modification réservée au super-administrateur. Les champs vides apparaissent
// en blanc sur les documents ; les documents déjà émis ne changent pas.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { SETTINGS_FIELDS, type BillingSettings } from '../lib/billing'

export default function BillingSettingsPanel() {
  const [open, setOpen] = useState(false)
  const [settings, setSettings] = useState<Partial<BillingSettings> | null>(null)
  const [canEdit, setCanEdit] = useState(false)
  const [msg, setMsg] = useState<{ t: string; err?: boolean } | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open || settings) return
    fetch('/api/admin/billing-settings', { credentials: 'include' })
      .then(r => r.json().then(d => ({ ok: r.ok, d })))
      .then(({ ok, d }) => { if (ok) { setSettings(d.settings); setCanEdit(!!d.canEdit) } else setMsg({ t: d.error, err: true }) })
      .catch(() => setMsg({ t: 'Chargement impossible', err: true }))
  }, [open, settings])

  const save = async () => {
    setBusy(true); setMsg(null)
    const r = await fetch('/api/admin/billing-settings', {
      method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ settings }),
    })
    const d = await r.json().catch(() => ({}))
    setBusy(false)
    if (r.ok) { setSettings(d.settings); setMsg({ t: 'Paramètres enregistrés' }) } else setMsg({ t: d.error || 'Erreur', err: true })
  }

  const missing = settings ? (['ice', 'if_fiscal', 'rc', 'rib'] as const).filter(k => !settings[k]) : []
  const groups = Array.from(new Set(SETTINGS_FIELDS.map(f => f.group)))

  return (
    <div style={{ background: 'var(--white)', border: '.5px solid var(--rule)', padding: '1.25rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
        <div style={{ fontSize: 11, letterSpacing: '.08em', color: 'var(--inkm)' }}>PARAMÈTRES DE FACTURATION — ÉMETTEUR, IDENTIFIANTS FISCAUX, RIB</div>
        <span style={{ fontSize: 12, color: 'var(--bd)' }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && settings && (
        <div style={{ marginTop: '1rem' }}>
          {missing.length > 0 && (
            <div style={{ background: '#FEF5E4', color: '#8A5A10', fontSize: 12, padding: '8px 10px', marginBottom: 12 }}>
              À compléter avant le lancement : {missing.map(k => SETTINGS_FIELDS.find(f => f.key === k)?.label).join(', ')}.
              Ces champs apparaissent en blanc sur les documents en attendant.
            </div>
          )}
          {groups.map(g => (
            <div key={g} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--bd)', marginBottom: 6 }}>{g}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 10 }}>
                {SETTINGS_FIELDS.filter(f => f.group === g).map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: 10, letterSpacing: '.04em', color: 'var(--inkm)', display: 'block', marginBottom: 3 }}>{f.label.toUpperCase()}</label>
                    <input
                      disabled={!canEdit}
                      value={settings[f.key] == null ? '' : String(settings[f.key])}
                      onChange={e => setSettings(s => ({ ...s, [f.key]: e.target.value }))}
                      style={{ width: '100%', padding: '7px 9px', border: '.5px solid var(--rule)', fontSize: 12, fontFamily: f.key === 'rib' || f.key === 'ice' ? 'monospace' : 'inherit', background: canEdit ? '#fff' : '#F6F5F1' }}
                    />
                    {f.help && <div style={{ fontSize: 10, color: 'var(--inkm)', marginTop: 2 }}>{f.help}</div>}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div style={{ fontSize: 11, color: 'var(--inkm)', marginBottom: 10 }}>TVA appliquée : {settings.tva_rate} %.</div>
          {canEdit
            ? <button onClick={save} disabled={busy} style={{ padding: '8px 16px', background: 'var(--bd)', color: '#fff', border: 'none', fontSize: 12, cursor: 'pointer' }}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
            : <div style={{ fontSize: 11, color: 'var(--inkm)' }}>Modification réservée au super-administrateur.</div>}
        </div>
      )}
      {msg && <div style={{ marginTop: 8, fontSize: 12, color: msg.err ? '#C0392B' : '#1A7A40' }}>{msg.t}</div>}
    </div>
  )
}
