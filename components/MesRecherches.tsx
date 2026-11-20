// components/MesRecherches.tsx — « Mes demandes de recherche » dans Mon espace :
// avis des réponses disponibles, liste des demandes et lecture de l'étude validée.
import { useEffect, useState } from 'react'

type Demande = { id: string; question: string; cree: string; publiee: string | null; lue: string | null; etat: 'en_preparation' | 'disponible' | 'non_traitee'; note: string | null }
type Detail = Demande & { reponse: string | null; sources: { titre: string; extrait: string }[] }

const ETAT: Record<Demande['etat'], [string, string]> = {
  en_preparation: ['En préparation', '#92400E'],
  disponible: ['Réponse disponible', '#166534'],
  non_traitee: ['Message de nos consultants', '#1E3A8A'],
}
const date = (s: string | null) => (s ? new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '')

function Etude({ texte }: { texte: string }) {
  return (
    <div style={{ fontSize: 15, lineHeight: 1.75, color: '#1f2937' }}>
      {texte.split(/\n+/).filter(l => l.trim()).map((l, i) => {
        const h = l.match(/^(#{1,3})\s+(.*)$/)
        const parts = (h ? h[2] : l).split(/(\[\d+\])/g).map((p, j) => (/^\[\d+\]$/.test(p) ? <sup key={j} style={{ color: '#B8922A', fontWeight: 600 }}>{p}</sup> : p))
        if (h) return <h4 key={i} style={{ margin: '18px 0 6px', fontSize: h[1].length === 1 ? 21 : h[1].length === 2 ? 17.5 : 15.5 }}>{parts}</h4>
        return <p key={i} style={{ margin: '0 0 10px' }}>{parts}</p>
      })}
    </div>
  )
}

export default function MesRecherches() {
  const [liste, setListe] = useState<Demande[] | null>(null)
  const [ouverte, setOuverte] = useState<Detail | null>(null)
  const charger = () => fetch('/api/recherche?action=demandes', { credentials: 'same-origin' }).then(r => (r.ok ? r.json() : null)).then(j => setListe(j?.demandes ?? [])).catch(() => setListe([]))
  useEffect(() => { charger() }, [])
  useEffect(() => {
    if (liste?.length && typeof window !== 'undefined' && window.location.hash === '#recherches')
      document.getElementById('recherches')?.scrollIntoView({ behavior: 'smooth' })
  }, [liste])

  async function ouvrir(id: string) {
    if (ouverte?.id === id) return setOuverte(null)
    const r = await fetch(`/api/recherche?action=demande&id=${id}`, { credentials: 'same-origin' })
    if (r.ok) { setOuverte(await r.json()); charger() }
  }

  if (!liste) return null
  const nouvelles = liste.filter(d => d.etat !== 'en_preparation' && !d.lue)
  return (
    <div className="x-ff" id="recherches">
      <h3 style={{ margin: '0 0 6px' }}>Mes demandes de recherche</h3>
      {nouvelles.length > 0 && (
        <p className="x-ff-ok" style={{ marginTop: 0 }}>
          {nouvelles.length === 1 ? 'Une réponse de nos consultants vous attend.' : `${nouvelles.length} réponses de nos consultants vous attendent.`}
        </p>
      )}
      {!liste.length ? (
        <p className="x-ff-note" style={{ marginTop: 0 }}>
          Les études « Recherche et dissertation » que vous demandez dans l’assistant de recherche s’affichent ici, une fois préparées par nos consultants.{' '}
          <a href="/expertise#conseil">Poser une question</a>
        </p>
      ) : (
        <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
          {liste.map(d => {
            const [lib, coul] = ETAT[d.etat]
            const ouvrable = d.etat !== 'en_preparation'
            return (
              <div key={d.id} style={{ border: '1px solid var(--x-line, #e5e7eb)', borderRadius: 12, padding: '12px 14px', background: !d.lue && ouvrable ? '#FFFBEB' : '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <b style={{ display: 'block', fontSize: 14.5 }}>{d.question.length > 180 ? d.question.slice(0, 180) + '…' : d.question}</b>
                    <small style={{ color: '#6b7280' }}>Demandée le {date(d.cree)}{d.publiee ? ` · réponse du ${date(d.publiee)}` : ''}</small>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: coul }}>{lib}</span>
                    {ouvrable && <button type="button" className="x-btn x-btn-line x-btn-sm" onClick={() => ouvrir(d.id)}>{ouverte?.id === d.id ? 'Fermer' : 'Lire'}</button>}
                  </div>
                </div>
                {d.etat === 'en_preparation' && <small style={{ display: 'block', marginTop: 6, color: '#6b7280' }}>Nos consultants préparent votre réponse ; vous serez avisé par e-mail et ici même.</small>}
                {ouverte?.id === d.id && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #eee' }}>
                    {ouverte.note && <p style={{ background: '#EFF6FF', padding: '10px 12px', borderRadius: 8, fontSize: 14 }}><b>Message de nos consultants :</b> {ouverte.note}</p>}
                    {ouverte.reponse && <Etude texte={ouverte.reponse} />}
                    {ouverte.reponse && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                        <button type="button" className="x-btn x-btn-line x-btn-sm" onClick={() => navigator.clipboard?.writeText(ouverte.reponse || '')}>Copier le texte</button>
                        <button type="button" className="x-btn x-btn-line x-btn-sm" onClick={() => window.print()}>Imprimer</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
