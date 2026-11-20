// pages/backoffice/partenaires.tsx — programme partenaires : liens « diagnostic offert par … »,
// comptes rattachés et conversions, base du calcul des commissions (taux à fixer).
import type { GetServerSideProps } from 'next'
import { useState } from 'react'
import { requireAdminSSR } from '../../lib/adminAuth'
import { supabaseAdmin } from '../../lib/supabaseAdmin'
import BackofficeLayout from '../../components/BackofficeLayout'

type P = { id: string; code: string; nom: string; type: string; actif: boolean; created_at: string; inscrits: number; essais: number; payants: number }
const TYPES: Record<string, string> = { transitaire: 'Transitaire', expert_comptable: 'Expert-comptable', banque: 'Banque', cci: 'CCI', federation: 'Fédération', autre: 'Autre' }

export const getServerSideProps: GetServerSideProps = async ctx => {
  const auth = await requireAdminSSR(ctx)
  if ('redirect' in auth) return auth
  const db = supabaseAdmin()
  const [{ data: parts }, { data: users }] = await Promise.all([
    db.from('partenaires').select('id, code, nom, type, actif, created_at').order('created_at', { ascending: false }),
    db.from('users').select('parrain_code, plan, statut').not('parrain_code', 'is', null),
  ])
  const p: P[] = (parts ?? []).map(x => {
    const l = (users ?? []).filter(u => u.parrain_code === x.code)
    return { ...x, inscrits: l.length, essais: l.filter(u => u.plan === 'trial' && u.statut === 'trial').length,
      payants: l.filter(u => ['pro', 'premium', 'enterprise'].includes(u.plan) && u.statut === 'active').length }
  })
  const host = ctx.req.headers.host || ''
  return { props: { partenaires: p, base: `https://${host}` } }
}

export default function Partenaires({ partenaires, base }: { partenaires: P[]; base: string }) {
  const [liste, setListe] = useState(partenaires)
  const [f, setF] = useState<any>({ type: 'transitaire' })
  const [msg, setMsg] = useState('')
  async function creer() {
    setMsg('')
    const r = await fetch('/api/admin/partenaires', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) })
    const j = await r.json()
    if (!r.ok) return setMsg(j.error)
    setListe([{ ...j.partenaire, inscrits: 0, essais: 0, payants: 0 }, ...liste]); setF({ type: 'transitaire' }); setMsg(`Lien créé : ${base}/p/${j.partenaire.code}`)
  }
  async function basculer(p: P) {
    const r = await fetch('/api/admin/partenaires', { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: p.id, actif: !p.actif }) })
    if (r.ok) setListe(liste.map(x => (x.id === p.id ? { ...x, actif: !x.actif } : x)))
  }
  const input = { padding: '8px 10px', border: '1px solid #CBD5E1', fontSize: 13.5 }
  return (
    <BackofficeLayout title="Partenaires">
      <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: 'var(--bd)', marginBottom: 4 }}>Programme partenaires</h1>
      <p style={{ fontSize: 13, color: 'var(--inkm)', marginBottom: 16 }}>Chaque partenaire reçoit un lien « diagnostic offert par … ». Les comptes créés depuis ce lien lui sont rattachés pendant 90 jours. Taux et conditions de commission : à fixer.</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <input style={input} placeholder="Nom affiché (ex. Atlas Transit)" value={f.nom || ''} onChange={e => setF({ ...f, nom: e.target.value })} />
        <input style={input} placeholder="Code du lien (facultatif)" value={f.code || ''} onChange={e => setF({ ...f, code: e.target.value })} />
        <select style={input} value={f.type} onChange={e => setF({ ...f, type: e.target.value })}>{Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <input style={input} placeholder="Email de son compte (facultatif)" value={f.email || ''} onChange={e => setF({ ...f, email: e.target.value })} />
        <button className="btn-primary" onClick={creer} style={{ padding: '8px 14px' }}>Créer le partenaire</button>
      </div>
      {msg && <p style={{ fontSize: 13, marginBottom: 12 }}>{msg}</p>}
      <table className="data-table"><thead><tr><th>Partenaire</th><th>Type</th><th>Lien</th><th>Comptes</th><th>Essais en cours</th><th>Payants</th><th>Statut</th></tr></thead><tbody>
        {liste.map(p => (
          <tr key={p.id}><td><b>{p.nom}</b></td><td>{TYPES[p.type]}</td><td><code>{base}/p/{p.code}</code></td><td>{p.inscrits}</td><td>{p.essais}</td><td>{p.payants}</td>
            <td><button onClick={() => basculer(p)} style={{ fontSize: 12 }}>{p.actif ? 'Actif · désactiver' : 'Inactif · activer'}</button></td></tr>))}
        {!liste.length && <tr><td colSpan={7} style={{ color: '#64748B' }}>Aucun partenaire pour l’instant.</td></tr>}
      </tbody></table>
    </BackofficeLayout>
  )
}
