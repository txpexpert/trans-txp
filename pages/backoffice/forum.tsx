// pages/backoffice/forum.tsx — modération a posteriori du forum des clients :
// signalements à traiter, publications récentes (masquer, réafficher, épingler).
import type { GetServerSideProps } from 'next'
import { useEffect, useState, type CSSProperties } from 'react'
import { requireAdminSSR } from '../../lib/adminAuth'
import BackofficeLayout from '../../components/BackofficeLayout'

export const getServerSideProps: GetServerSideProps = async ctx => {
  const auth = await requireAdminSSR(ctx)
  if ('redirect' in auth) return auth
  return { props: {} }
}

const qui = (u: any) => (u ? [u.prenom, u.nom].filter(Boolean).join(' ') || u.email : '—') + (u?.societe ? ` · ${u.societe}` : '')
const dt = (s: string) => new Date(s).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
const btn: CSSProperties = { padding: '4px 10px', fontSize: 11.5, cursor: 'pointer', border: '1px solid #ccc', background: '#fff', marginRight: 4, marginBottom: 4 }

export default function ForumModeration() {
  const [d, setD] = useState<{ signalements: any[]; posts: any[] }>({ signalements: [], posts: [] })
  const [msg, setMsg] = useState('')
  const charger = () => fetch('/api/admin/forum', { credentials: 'include' }).then(r => r.json()).then(setD)
  useEffect(() => { charger() }, [])
  async function agir(action: string, id: string) {
    const r = await fetch('/api/admin/forum', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, id }) })
    const j = await r.json(); setMsg(r.ok ? 'Fait.' : `⚠ ${j.error}`); charger()
  }

  return (
    <BackofficeLayout title="Modération du forum">
      <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: 'var(--bd)', marginBottom: 4 }}>Modération du forum</h1>
      <p style={{ fontSize: 13, color: 'var(--inkm)', marginBottom: 16 }}>Les membres publient librement ; un contenu masqué disparaît immédiatement du forum. <a href="/forum" target="_blank" rel="noopener">Ouvrir le forum ↗</a> {msg && <b style={{ marginLeft: 8 }}>{msg}</b>}</p>

      <h2 style={{ fontSize: 16, margin: '10px 0' }}>Signalements à traiter ({d.signalements.length})</h2>
      <table className="data-table"><thead><tr><th>Contenu signalé</th><th>Motif</th><th>Signalé par</th><th>Actions</th></tr></thead><tbody>
        {d.signalements.map(s => {
          const c = s.forum_commentaires, p = s.forum_posts
          return (
            <tr key={s.id}>
              <td style={{ fontSize: 12.5, maxWidth: 380 }}>{p ? <><b>{p.titre}</b><br />{String(p.contenu).slice(0, 220)}</> : c ? <><i>Commentaire :</i> {String(c.contenu).slice(0, 220)}</> : '(supprimé)'}
                <br /><small style={{ color: '#888' }}>{(p || c)?.statut === 'masque' ? 'Déjà masqué' : 'En ligne'}</small></td>
              <td style={{ fontSize: 12 }}>{s.motif}</td>
              <td style={{ fontSize: 12 }}>{qui(s.users)}<br /><small>{dt(s.created_at)}</small></td>
              <td>
                {p && p.statut === 'publie' && <button style={btn} onClick={() => agir('masquer', p.id)}>Masquer le message</button>}
                {c && c.statut === 'publie' && <button style={btn} onClick={() => agir('masquer_commentaire', c.id)}>Masquer le commentaire</button>}
                <button style={btn} onClick={() => agir('traiter', s.id)}>Classer</button>
              </td>
            </tr>
          )
        })}
        {!d.signalements.length && <tr><td colSpan={4} style={{ color: '#888', fontSize: 13 }}>Aucun signalement en attente.</td></tr>}
      </tbody></table>

      <h2 style={{ fontSize: 16, margin: '24px 0 10px' }}>Publications récentes</h2>
      <table className="data-table"><thead><tr><th>Publication</th><th>Auteur</th><th>Activité</th><th>Actions</th></tr></thead><tbody>
        {d.posts.map(p => (
          <tr key={p.id} style={{ opacity: p.statut === 'masque' ? .55 : 1 }}>
            <td style={{ fontSize: 12.5 }}>{p.epingle && '📌 '}<b>{p.titre}</b><br /><small style={{ color: '#888' }}>{p.categorie} · {dt(p.created_at)}{p.statut === 'masque' ? ' · MASQUÉE' : ''}</small></td>
            <td style={{ fontSize: 12 }}>{qui(p.users)}</td>
            <td style={{ fontSize: 12 }}>{p.nb_commentaires} comm. · {p.nb_jaime} j’aime</td>
            <td>
              {p.statut === 'publie' ? <button style={btn} onClick={() => agir('masquer', p.id)}>Masquer</button> : <button style={btn} onClick={() => agir('afficher', p.id)}>Réafficher</button>}
              {p.epingle ? <button style={btn} onClick={() => agir('desepingler', p.id)}>Désépingler</button> : <button style={btn} onClick={() => agir('epingler', p.id)}>Épingler</button>}
            </td>
          </tr>
        ))}
      </tbody></table>
    </BackofficeLayout>
  )
}
