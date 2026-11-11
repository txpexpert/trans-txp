// pages/backoffice/packs.tsx — commandes de packs experts : suivi, forfait HT, statut.
// La pro-forma du pack est établie à partir de ce forfait (paiement par virement).
import type { GetServerSideProps } from 'next'
import { useState } from 'react'
import { requireAdminSSR } from '../../lib/adminAuth'
import { supabaseAdmin } from '../../lib/supabaseAdmin'
import BackofficeLayout from '../../components/BackofficeLayout'

const STATUTS: Record<string, string> = { recue: 'Reçue', devis_envoye: 'Forfait envoyé', en_cours: 'En cours', livree: 'Livrée', annulee: 'Annulée' }

export const getServerSideProps: GetServerSideProps = async ctx => {
  const auth = await requireAdminSSR(ctx)
  if ('redirect' in auth) return auth
  const { data } = await supabaseAdmin().from('commandes_packs').select('id, pack, precisions, statut, montant_ht, created_at, users(email, societe, raison_sociale, numero_abonne, plan)').order('created_at', { ascending: false }).limit(300)
  return { props: { commandes: data ?? [] } }
}

export default function Packs({ commandes }: { commandes: any[] }) {
  const [liste, setListe] = useState(commandes)
  async function maj(id: string, champs: any) {
    const r = await fetch('/api/admin/packs', { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...champs }) })
    if (r.ok) setListe(liste.map(c => (c.id === id ? { ...c, ...champs } : c)))
  }
  return (
    <BackofficeLayout title="Commandes de packs">
      <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: 'var(--bd)', marginBottom: 4 }}>Commandes de packs experts</h1>
      <p style={{ fontSize: 13, color: 'var(--inkm)', marginBottom: 16 }}>Le client a reçu un accusé de réception. Fixez le forfait HT, envoyez la pro-forma (virement), puis suivez la livraison. Le pack est déduit du premier abonnement souscrit dans les 30 jours.</p>
      <table className="data-table"><thead><tr><th>Date</th><th>Client</th><th>Pack</th><th>Précisions</th><th>Forfait HT</th><th>Statut</th></tr></thead><tbody>
        {liste.map(c => (
          <tr key={c.id}>
            <td>{new Date(c.created_at).toLocaleDateString('fr-FR')}</td>
            <td><b>{c.users?.raison_sociale || c.users?.societe || '—'}</b><br /><small>{c.users?.email} · {c.users?.numero_abonne || ''} · {c.users?.plan}</small></td>
            <td>{c.pack}</td><td style={{ maxWidth: 280, fontSize: 12.5 }}>{c.precisions || '—'}</td>
            <td><input defaultValue={c.montant_ht ?? ''} style={{ width: 90, padding: 4 }} onBlur={e => maj(c.id, { montant_ht: e.target.value })} /></td>
            <td><select value={c.statut} onChange={e => maj(c.id, { statut: e.target.value })}>{Object.entries(STATUTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></td>
          </tr>))}
        {!liste.length && <tr><td colSpan={6} style={{ color: '#64748B' }}>Aucune commande pour l’instant.</td></tr>}
      </tbody></table>
    </BackofficeLayout>
  )
}
