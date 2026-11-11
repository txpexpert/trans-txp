// pages/backoffice/texte-semaine.tsx — textes publiés ou ajoutés à la base ces 14 derniers jours,
// avec rédaction d'un brouillon « Le texte de la semaine » à relire avant diffusion.
import type { GetServerSideProps } from 'next'
import { useState } from 'react'
import { requireAdminSSR } from '../../lib/adminAuth'
import { supabaseAdmin } from '../../lib/supabaseAdmin'
import BackofficeLayout from '../../components/BackofficeLayout'

type T = { numero: string; type_document: string; date_doc: string | null; titre: string | null; ajoute: string }

export const getServerSideProps: GetServerSideProps = async ctx => {
  const auth = await requireAdminSSR(ctx)
  if ('redirect' in auth) return auth
  const depuis = new Date(Date.now() - 14 * 864e5).toISOString()
  const { data } = await supabaseAdmin().from('knowledge_chunks')
    .select('numero, type_document, date_doc, titre, created_at')
    .in('type_document', ['circulaire', 'note', 'instruction_commune'])
    .or(`created_at.gte.${depuis},date_doc.gte.${depuis.slice(0, 10)}`)
    .not('numero', 'is', null).order('date_doc', { ascending: false }).limit(400)
  const vus = new Map<string, T>()
  for (const d of data ?? []) if (!vus.has(d.numero)) vus.set(d.numero, { numero: d.numero, type_document: d.type_document, date_doc: d.date_doc, titre: d.titre, ajoute: d.created_at })
  return { props: { textes: Array.from(vus.values()) } }
}

export default function TexteSemaine({ textes }: { textes: T[] }) {
  const [brouillons, setBrouillons] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)
  async function rediger(numero: string) {
    setBusy(numero)
    const r = await fetch('/api/admin/texte-semaine', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ numero }) })
    const j = await r.json(); setBusy(null)
    setBrouillons(b => ({ ...b, [numero]: r.ok ? j.texte : `⚠ ${j.error}` }))
  }
  return (
    <BackofficeLayout title="Texte de la semaine">
      <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: 'var(--bd)', marginBottom: 4 }}>Le texte de la semaine</h1>
      <p style={{ fontSize: 13, color: 'var(--inkm)', marginBottom: 16 }}>Textes publiés ou ajoutés à la base ces 14 derniers jours. Choisissez-en un, faites rédiger le brouillon, relisez-le, puis diffusez-le (WhatsApp, LinkedIn). Le brouillon ne s’appuie que sur le texte officiel.</p>
      <table className="data-table"><thead><tr><th>Texte</th><th>Date</th><th>Objet</th><th style={{ width: '42%' }}>Brouillon</th></tr></thead><tbody>
        {textes.map(t => (
          <tr key={t.numero}>
            <td><b>{t.type_document} n° {t.numero}</b></td><td>{t.date_doc ? new Date(t.date_doc).toLocaleDateString('fr-FR') : '—'}</td><td style={{ fontSize: 12.5 }}>{t.titre || '—'}</td>
            <td>{brouillons[t.numero]
              ? <><textarea defaultValue={brouillons[t.numero]} rows={7} style={{ width: '100%', fontSize: 12.5 }} />
                  <button onClick={() => navigator.clipboard?.writeText(brouillons[t.numero])} style={{ fontSize: 12 }}>Copier</button></>
              : <button className="btn-primary" disabled={busy === t.numero} onClick={() => rediger(t.numero)} style={{ padding: '6px 12px' }}>{busy === t.numero ? 'Rédaction…' : 'Rédiger le brouillon'}</button>}</td>
          </tr>))}
        {!textes.length && <tr><td colSpan={4} style={{ color: '#64748B' }}>Aucun texte publié ou ajouté ces 14 derniers jours.</td></tr>}
      </tbody></table>
    </BackofficeLayout>
  )
}
