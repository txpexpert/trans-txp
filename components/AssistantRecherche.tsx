// components/AssistantRecherche.tsx — « Assistant de recherche » de la Consultation express
// (même principe que LeRef) : réponse rapide sourcée, ou recherche et dissertation
// préparée par les consultants et affichée dans « Mon espace ».
import { useState, type CSSProperties } from 'react'
import TexteLiens from './TexteLiens'

type Source = { titre: string; lien?: string; extrait: string }
type Mode = 'rapide' | 'dissertation'

const S = {
  carte: { background: '#fff', border: '1px solid var(--border)', borderRadius: 18, padding: '1.6rem 1.75rem' } as CSSProperties,
  titre: { fontFamily: "'DM Serif Display', serif", fontSize: 24, color: 'var(--ink)', marginBottom: '.25rem' } as CSSProperties,
  sous: { fontSize: 15.5, color: 'var(--inkm)', lineHeight: 1.6, marginBottom: '1.25rem' } as CSSProperties,
  label: { fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: '.5rem' } as CSSProperties,
}

function Choix({ actif, onClick, titre, texte, note }: { actif: boolean; onClick: () => void; titre: string; texte: string; note?: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={actif} style={{
      textAlign: 'left', padding: '1rem 1.1rem', cursor: 'pointer', borderRadius: 14, fontFamily: "'DM Sans', sans-serif",
      background: actif ? 'var(--gold-pale)' : '#fff', border: `1px solid ${actif ? 'var(--gold)' : 'var(--border)'}`,
      boxShadow: actif ? '0 0 0 2px rgba(184,146,42,.15)' : 'none', display: 'flex', gap: '.75rem', alignItems: 'flex-start',
    }}>
      <span aria-hidden="true" style={{ width: 15, height: 15, borderRadius: '50%', flexShrink: 0, marginTop: 2, border: `1.5px solid ${actif ? 'var(--gold)' : 'var(--border-mid)'}`, background: actif ? 'radial-gradient(var(--gold) 45%, transparent 50%)' : '#fff' }} />
      <span>
        <b style={{ display: 'block', fontSize: 16, color: 'var(--ink)', marginBottom: 4 }}>{titre}</b>
        <span style={{ display: 'block', fontSize: 14.5, color: 'var(--mid)', lineHeight: 1.55 }}>{texte}</span>
        {note && <span style={{ display: 'block', fontSize: 13, color: 'var(--muted)', marginTop: 6, lineHeight: 1.5 }}>{note}</span>}
      </span>
    </button>
  )
}

/** Texte brut avec renvois [n] mis en valeur ; numéros de circulaires liés au texte officiel quand `liens` est fourni. */
export function TexteSource({ texte, liens }: { texte: string; liens?: Record<string, string> | null }) {
  return (
    <div style={{ fontSize: 13.5, lineHeight: 1.75, color: 'var(--inks)' }}>
      {texte.split(/\n+/).filter(l => l.trim()).map((l, i) => {
        const h = l.match(/^(#{1,3})\s+(.*)$/)
        const parts = (h ? h[2] : l).split(/(\[\d+\])/g).map((p, j) =>
          /^\[\d+\]$/.test(p) ? <sup key={j} style={{ color: 'var(--gold)', fontWeight: 600, fontSize: 10.5 }}>{p}</sup> : <TexteLiens key={j} texte={p} liens={liens} />)
        if (h) return <div key={i} style={{ fontFamily: "'DM Serif Display', serif", color: 'var(--ink)', fontSize: h[1].length === 1 ? 19 : h[1].length === 2 ? 16 : 14.5, margin: '1rem 0 .35rem' }}>{parts}</div>
        return <p key={i} style={{ margin: '0 0 .6rem' }}>{parts}</p>
      })}
    </div>
  )
}

export function ListeSources({ sources }: { sources: Source[] }) {
  if (!sources?.length) return null
  return (
    <div style={{ marginTop: '1rem', paddingTop: '.9rem', borderTop: '.5px solid var(--border)' }}>
      <span style={S.label}>Sources vérifiées</span>
      <ol style={{ margin: 0, paddingLeft: '1.2rem', display: 'grid', gap: '.45rem' }}>
        {sources.map((s, i) => (
          <li key={i} style={{ fontSize: 12.5, color: 'var(--inks)' }}>
            <b style={{ fontWeight: 600 }}>{s.lien ? <a href={s.lien} style={{ color: 'var(--bd)' }}>{s.titre}</a> : s.titre}</b>
            <span style={{ display: 'block', color: 'var(--muted)', fontSize: 11.5, marginTop: 2 }}>{s.extrait}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default function AssistantRecherche() {
  const [mode, setMode] = useState<Mode>('rapide')
  const [question, setQuestion] = useState('')
  const [encours, setEncours] = useState(false)
  const [erreur, setErreur] = useState<{ texte: string; acces?: string } | null>(null)
  const [reponse, setReponse] = useState<{ reponse: string; sources: Source[]; liens?: Record<string, string> } | null>(null)
  const [message, setMessage] = useState('')

  async function soumettre() {
    if (question.trim().length < 10 || encours) return
    setEncours(true); setErreur(null); setReponse(null); setMessage('')
    try {
      const r = await fetch('/api/recherche', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, mode }) })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) setErreur({ texte: j.error || 'Service momentanément indisponible.', acces: j.acces })
      else if (j.mode === 'dissertation') { setMessage(j.message); setQuestion('') }
      else setReponse({ reponse: j.reponse, sources: j.sources || [], liens: j.liens || {} })
    } catch { setErreur({ texte: 'Connexion impossible, réessayez.' }) }
    setEncours(false)
  }

  return (
    <div style={{ maxWidth: 820, display: 'grid', gap: '1rem' }}>
      <div style={S.carte}>
        <span style={S.label}>Assistant de recherche</span>
        <div style={S.titre}>Recherche dans les guides et textes</div>
        <p style={S.sous}>Posez vos questions et trouvez vos réponses sur la base des textes de base (lois, règlements et procédures), avec sources vérifiées.</p>

        <span style={S.label}>Type de réponse</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '.75rem', marginBottom: '1.25rem' }}>
          <Choix actif={mode === 'rapide'} onClick={() => setMode('rapide')} titre="Réponse rapide"
            texte="Une réponse de synthèse avec sources vérifiées." note="Générée par notre bibliothèque automatique." />
          <Choix actif={mode === 'dissertation'} onClick={() => setMode('dissertation')} titre="Recherche et dissertation"
            texte="Recherche élargie dans les textes de lois et règlements, avec une synthèse rédigée par nos experts incluant les éléments de référence, les sources confirmées et vérifiées, un avis et des solutions proposées."
            note="La réponse, qui sera élaborée par nos consultants, vous sera affichée dans le tableau de bord de votre session ; un message s’affichera pour vous en aviser." />
        </div>

        <label htmlFor="ar-question" style={S.label}>Votre question</label>
        <textarea id="ar-question" className="form-textarea" value={question} onChange={e => setQuestion(e.target.value)} maxLength={2000}
          style={{ minHeight: 110, lineHeight: 1.6, width: '100%' }}
          placeholder="Ex. : Quelles sont les conditions pour placer des matières premières sous le régime de l’admission temporaire pour perfectionnement actif ?" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '.75rem', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>N’indiquez ni nom ni donnée personnelle : seule la question est analysée.</span>
          <button className="btn btn-primary" onClick={soumettre} disabled={question.trim().length < 10 || encours}
            style={{ opacity: question.trim().length < 10 || encours ? .5 : 1 }}>
            {encours ? (mode === 'rapide' ? 'Recherche en cours…' : 'Envoi…') : 'Soumettre'}
          </button>
        </div>
        {erreur && <p style={{ color: '#B91C1C', fontSize: 12.5, marginTop: '.75rem' }}>{erreur.texte}{erreur.acces && <> <a href={erreur.acces} style={{ color: 'var(--bd)', fontWeight: 600 }}>{erreur.acces.startsWith('/auth') ? 'Se connecter →' : 'Voir les offres →'}</a></>}</p>}
        {message && <div style={{ marginTop: '1rem', background: '#F0FDF4', border: '.5px solid #86EFAC', padding: '1rem 1.1rem', fontSize: 13, color: '#166534', lineHeight: 1.6 }}>
          ✓ {message} <a href="/mon-espace#recherches" style={{ color: '#166534', fontWeight: 600 }}>Ouvrir Mon espace →</a></div>}
      </div>

      {reponse && (
        <div style={S.carte}>
          <span style={S.label}>Réponse rapide</span>
          <TexteSource texte={reponse.reponse} liens={reponse.liens} />
          <ListeSources sources={reponse.sources} />
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: '1rem' }}>
            Besoin d’une analyse complète ? Choisissez « Recherche et dissertation » ou <a href="#" onClick={e => { e.preventDefault(); setMode('dissertation'); window.scrollTo({ top: 0, behavior: 'smooth' }) }} style={{ color: 'var(--bd)' }}>soumettez la même question à nos experts</a>.
          </p>
        </div>
      )}
    </div>
  )
}
