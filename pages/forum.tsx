// pages/forum.tsx — Forum des clients : publications avec texte, images et fichiers,
// commentaires, « J'aime », signalement. Accès : comptes connectés (middleware + API).
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import SiteShell from '../components/SiteShell'
import { CATEGORIES } from '../lib/forumCategories'

type Piece = { path: string; nom: string; type: string; taille: number; image: boolean; url?: string }
type Auteur = { nom: string; societe: string | null; initiales: string; equipe: boolean }
type Post = { id: string; categorie: string; titre: string; contenu: string; pieces: Piece[]; epingle: boolean; nb_commentaires: number; nb_jaime: number; cree: string; modifie: string | null; dernier: string; auteur: Auteur; moi: boolean; aime: boolean }
type Commentaire = { id: string; contenu: string; pieces: Piece[]; cree: string; auteur: Auteur; moi: boolean }

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,application/pdf,.doc,.docx,.xls,.xlsx,.pptx,.txt,.csv'
const catLabel = (id: string) => CATEGORIES.find(c => c.id === id)?.label || 'Discussions générales'
const taille = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} Mo` : `${Math.max(1, Math.round(n / 1024))} Ko`)
function ilya(s: string) {
  const m = Math.round((Date.now() - Date.parse(s)) / 60000)
  if (m < 1) return 'à l’instant'
  if (m < 60) return `il y a ${m} min`
  if (m < 1440) return `il y a ${Math.round(m / 60)} h`
  if (m < 10080) return `il y a ${Math.round(m / 1440)} j`
  return new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}
// Liens cliquables dans le texte (http/https uniquement)
function Texte({ t }: { t: string }) {
  return <div className="fx-texte">{t.split(/(https?:\/\/[^\s<]+)/g).map((p, i) => (/^https?:\/\//.test(p) ? <a key={i} href={p} target="_blank" rel="noopener noreferrer nofollow">{p}</a> : p))}</div>
}

function Avatar({ a }: { a: Auteur }) { return <span className={`fx-av ${a.equipe ? 'eq' : ''}`} aria-hidden="true">{a.initiales}</span> }

function Pieces({ pieces }: { pieces: Piece[] }) {
  const [zoom, setZoom] = useState<string | null>(null)
  const images = pieces.filter(p => p.image && p.url), fichiers = pieces.filter(p => !p.image || !p.url)
  if (!pieces.length) return null
  return (
    <>
      {images.length > 0 && (
        <div className={`fx-imgs n${Math.min(images.length, 4)}`}>
          {images.slice(0, 4).map((p, i) => (
            <button type="button" key={p.path} onClick={() => setZoom(p.url!)} aria-label={`Agrandir ${p.nom}`}>
              <img src={p.url} alt={p.nom} loading="lazy" />
              {i === 3 && images.length > 4 && <span className="fx-plus">+{images.length - 4}</span>}
            </button>
          ))}
        </div>
      )}
      {fichiers.length > 0 && (
        <div className="fx-files">
          {fichiers.map(p => (
            <a key={p.path} href={p.url} target="_blank" rel="noopener noreferrer" className="fx-file">
              <span className="fx-ext">{p.nom.split('.').pop()?.toUpperCase().slice(0, 4)}</span>
              <span><b>{p.nom}</b><small>{taille(p.taille)}</small></span>
            </a>
          ))}
        </div>
      )}
      {zoom && <div className="fx-zoom" onClick={() => setZoom(null)} role="dialog" aria-label="Image agrandie"><img src={zoom} alt="" /><span>✕</span></div>}
    </>
  )
}

function ChoixFichiers({ fichiers, setFichiers, max }: { fichiers: File[]; setFichiers: (f: File[]) => void; max: number }) {
  const ref = useRef<HTMLInputElement>(null)
  const [apercus, setApercus] = useState<string[]>([])
  useEffect(() => {
    const u = fichiers.map(f => (f.type.startsWith('image/') ? URL.createObjectURL(f) : ''))
    setApercus(u)
    return () => u.forEach(x => x && URL.revokeObjectURL(x))
  }, [fichiers])
  return (
    <>
      <input ref={ref} type="file" multiple accept={ACCEPT} hidden onChange={e => {
        const n = Array.from(e.target.files || []).filter(f => f.size <= 10 * 1048576)
        setFichiers([...fichiers, ...n].slice(0, max)); e.target.value = ''
      }} />
      <button type="button" className="fx-joindre" onClick={() => ref.current?.click()} disabled={fichiers.length >= max}>
        <span aria-hidden="true">📎</span> Image ou fichier
      </button>
      {fichiers.length > 0 && (
        <div className="fx-sel">
          {fichiers.map((f, i) => (
            <span key={i} className="fx-chip">
              {apercus[i] ? <img src={apercus[i]} alt="" /> : <span className="fx-ext sm">{f.name.split('.').pop()?.toUpperCase().slice(0, 4)}</span>}
              <span className="nm">{f.name}</span>
              <button type="button" onClick={() => setFichiers(fichiers.filter((_, j) => j !== i))} aria-label={`Retirer ${f.name}`}>✕</button>
            </span>
          ))}
        </div>
      )}
    </>
  )
}

function Commentaires({ post, onCompte }: { post: Post; onCompte: (n: number) => void }) {
  const [liste, setListe] = useState<Commentaire[] | null>(null)
  const [texte, setTexte] = useState('')
  const [fichiers, setFichiers] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const charger = () => fetch(`/api/forum/posts/${post.id}`, { credentials: 'same-origin' }).then(r => r.json()).then(j => { setListe(j.commentaires || []); onCompte((j.commentaires || []).length) })
  useEffect(() => { charger() }, [])
  async function envoyer() {
    if (!texte.trim() || busy) return
    setBusy(true); setErr('')
    const fd = new FormData(); fd.append('post_id', post.id); fd.append('contenu', texte); fichiers.forEach(f => fd.append('fichiers', f))
    const r = await fetch('/api/forum/commentaires', { method: 'POST', credentials: 'same-origin', body: fd })
    const j = await r.json().catch(() => ({})); setBusy(false)
    if (!r.ok) return setErr(j.error || 'Envoi impossible')
    setTexte(''); setFichiers([]); charger()
  }
  async function supprimer(id: string) {
    if (!confirm('Supprimer ce commentaire ?')) return
    await fetch(`/api/forum/commentaires?id=${id}`, { method: 'DELETE', credentials: 'same-origin' }); charger()
  }
  return (
    <div className="fx-coms">
      {!liste && <p className="fx-muted">Chargement…</p>}
      {liste?.map(c => (
        <div key={c.id} className="fx-com">
          <Avatar a={c.auteur} />
          <div className="fx-com-b">
            <div className="fx-com-h"><b>{c.auteur.nom}</b>{c.auteur.societe && <span> · {c.auteur.societe}</span>}<small> · {ilya(c.cree)}</small>
              {c.moi && <button type="button" className="fx-lien" onClick={() => supprimer(c.id)}>Supprimer</button>}
              {!c.moi && <BoutonSignaler commentaireId={c.id} />}</div>
            <Texte t={c.contenu} />
            <Pieces pieces={c.pieces} />
          </div>
        </div>
      ))}
      <div className="fx-com-form">
        <textarea value={texte} onChange={e => setTexte(e.target.value)} placeholder="Écrire un commentaire…" maxLength={4000} rows={2} />
        <div className="fx-row">
          <ChoixFichiers fichiers={fichiers} setFichiers={setFichiers} max={3} />
          <button type="button" className="x-btn x-btn-dark x-btn-sm" onClick={envoyer} disabled={!texte.trim() || busy}>{busy ? 'Envoi…' : 'Commenter'}</button>
        </div>
        {err && <p className="fx-err">{err}</p>}
      </div>
    </div>
  )
}

function BoutonSignaler({ postId, commentaireId }: { postId?: string; commentaireId?: string }) {
  const [fait, setFait] = useState(false)
  async function signaler() {
    const motif = prompt('Pourquoi signalez-vous ce contenu ? (propos déplacés, publicité, données personnelles, hors sujet…)')
    if (motif === null) return
    const r = await fetch('/api/forum/interactions', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'signaler', post_id: postId, commentaire_id: commentaireId, motif }) })
    if (r.ok) setFait(true)
  }
  return fait ? <span className="fx-muted sm">Signalé, merci</span> : <button type="button" className="fx-lien" onClick={signaler}>Signaler</button>
}

function Carte({ p, onRetire }: { p: Post; onRetire: () => void }) {
  const [post, setPost] = useState(p)
  const [ouvert, setOuvert] = useState(false)
  const [long, setLong] = useState(p.contenu.length > 600)
  const [edition, setEdition] = useState(false)
  const [titre, setTitre] = useState(p.titre)
  const [contenu, setContenu] = useState(p.contenu)
  async function aimer() {
    const r = await fetch('/api/forum/interactions', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'jaime', post_id: post.id }) })
    if (r.ok) { const j = await r.json(); setPost({ ...post, aime: j.aime, nb_jaime: j.nb_jaime }) }
  }
  async function enregistrer() {
    const r = await fetch(`/api/forum/posts/${post.id}`, { method: 'PATCH', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ titre, contenu }) })
    if (r.ok) { setPost({ ...post, titre, contenu, modifie: new Date().toISOString() }); setEdition(false) }
  }
  async function supprimer() {
    if (!confirm('Supprimer définitivement cette publication, ses commentaires et ses fichiers ?')) return
    const r = await fetch(`/api/forum/posts/${post.id}`, { method: 'DELETE', credentials: 'same-origin' })
    if (r.ok) onRetire()
  }
  return (
    <article className={`fx-card ${post.epingle ? 'pin' : ''}`}>
      <header className="fx-head">
        <Avatar a={post.auteur} />
        <div className="fx-who">
          <b>{post.auteur.nom}</b>
          <small>{post.auteur.societe ? `${post.auteur.societe} · ` : ''}{ilya(post.cree)}{post.modifie ? ' · modifié' : ''}</small>
        </div>
        <span className="fx-cat">{post.epingle ? '📌 ' : ''}{catLabel(post.categorie)}</span>
      </header>
      {edition ? (
        <div className="fx-edit">
          <input value={titre} onChange={e => setTitre(e.target.value)} maxLength={160} />
          <textarea value={contenu} onChange={e => setContenu(e.target.value)} maxLength={8000} rows={6} />
          <div className="fx-row"><span /><span><button type="button" className="x-btn x-btn-line x-btn-sm" onClick={() => setEdition(false)}>Annuler</button> <button type="button" className="x-btn x-btn-dark x-btn-sm" onClick={enregistrer}>Enregistrer</button></span></div>
        </div>
      ) : (
        <>
          <h3 className="fx-titre">{post.titre}</h3>
          {post.contenu && <div className={long ? 'fx-court' : ''}><Texte t={post.contenu} /></div>}
          {long && <button type="button" className="fx-lien" onClick={() => setLong(false)}>Lire la suite</button>}
        </>
      )}
      <Pieces pieces={post.pieces} />
      <footer className="fx-actions">
        <button type="button" className={post.aime ? 'on' : ''} onClick={aimer} aria-pressed={post.aime}>{post.aime ? '♥' : '♡'} J’aime{post.nb_jaime ? ` · ${post.nb_jaime}` : ''}</button>
        <button type="button" onClick={() => setOuvert(o => !o)} aria-expanded={ouvert}>💬 Commenter{post.nb_commentaires ? ` · ${post.nb_commentaires}` : ''}</button>
        <span className="fx-sp" />
        {post.moi ? <>
          <button type="button" className="fx-lien" onClick={() => setEdition(true)}>Modifier</button>
          <button type="button" className="fx-lien" onClick={supprimer}>Supprimer</button>
        </> : <BoutonSignaler postId={post.id} />}
      </footer>
      {ouvert && <Commentaires post={post} onCompte={n => setPost(x => ({ ...x, nb_commentaires: n }))} />}
    </article>
  )
}

export default function Forum() {
  const [etat, setEtat] = useState<'charge' | 'ok' | 'connexion' | 'erreur'>('charge')
  const [posts, setPosts] = useState<Post[]>([])
  const [suite, setSuite] = useState(false)
  const [admin, setAdmin] = useState(false)
  const [cat, setCat] = useState('')
  const [q, setQ] = useState('')
  const [recherche, setRecherche] = useState('')
  // composer
  const [ouvert, setOuvert] = useState(false)
  const [titre, setTitre] = useState('')
  const [contenu, setContenu] = useState('')
  const [categorie, setCategorie] = useState('general')
  const [fichiers, setFichiers] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function charger(plus = false) {
    const p = new URLSearchParams()
    if (cat) p.set('categorie', cat)
    if (recherche) p.set('q', recherche)
    if (plus && posts.length) p.set('avant', posts[posts.length - 1].dernier)
    const r = await fetch(`/api/forum/posts?${p}`, { credentials: 'same-origin' })
    if (r.status === 401) return setEtat('connexion')
    if (!r.ok) return setEtat('erreur')
    const j = await r.json()
    setPosts(plus ? [...posts, ...j.posts] : j.posts); setSuite(j.suite); setAdmin(!!j.moi?.admin); setEtat('ok')
  }
  useEffect(() => { charger() }, [cat, recherche])

  async function publier() {
    if (busy) return
    setBusy(true); setErr('')
    const fd = new FormData()
    fd.append('titre', titre); fd.append('contenu', contenu); fd.append('categorie', categorie)
    fichiers.forEach(f => fd.append('fichiers', f))
    const r = await fetch('/api/forum/posts', { method: 'POST', credentials: 'same-origin', body: fd })
    const j = await r.json().catch(() => ({})); setBusy(false)
    if (!r.ok) return setErr(j.error || 'Publication impossible')
    setTitre(''); setContenu(''); setFichiers([]); setOuvert(false); setCat(''); setRecherche(''); setQ('')
    charger()
  }

  return (
    <SiteShell title="Forum des clients | IXP-Import-eXPert" description="Le forum des importateurs, transitaires et industriels clients d’Import-eXPert.">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <section className="x-hero" style={{ paddingBottom: 14 }}>
        <div className="x-wrap">
          <div className="x-eyebrow">Communauté</div>
          <h1 className="x-h1 x-h1-sm">Le forum <em>des importateurs</em></h1>
          <p className="x-lead" style={{ maxWidth: 720 }}>Partagez une question, un retour d’expérience, une photo de marquage ou un document utile avec les autres clients d’Import-eXPert. L’équipe y publie aussi ses annonces.</p>
        </div>
      </section>
      <section className="x-sec-tight" style={{ paddingTop: 0 }}>
        <div className="x-wrap fx-grid">
          <aside className="fx-side">
            <div className="fx-box">
              <b className="fx-st">Rubriques</b>
              <button type="button" className={!cat ? 'on' : ''} onClick={() => setCat('')}>Toutes les publications</button>
              {CATEGORIES.map(c => <button type="button" key={c.id} className={cat === c.id ? 'on' : ''} onClick={() => setCat(c.id)}>{c.label}</button>)}
            </div>
            <div className="fx-box fx-charte">
              <b className="fx-st">Charte du forum</b>
              <ul>
                <li>Votre prénom, l’initiale de votre nom et votre société sont visibles des autres membres.</li>
                <li>Ne publiez aucune donnée personnelle de tiers ni document confidentiel (DUM, factures nominatives) sans les anonymiser.</li>
                <li>Pas de publicité ni de démarchage.</li>
                <li>Les échanges entre membres ne valent pas avis d’expert : pour un cas précis, utilisez le <Link href="/modules/conseil">conseil personnalisé</Link>.</li>
                <li>Tout contenu peut être signalé et retiré par la modération.</li>
              </ul>
            </div>
          </aside>

          <div className="fx-main">
            {etat === 'connexion' && <div className="x-pc-cta"><p>Le forum est réservé aux membres. Connectez-vous ou créez votre compte gratuit.</p><Link href="/auth/login?redirect=/forum" className="x-btn x-btn-gold">Connexion</Link></div>}
            {etat === 'erreur' && <p className="fx-err">Forum momentanément indisponible. Réessayez dans un instant.</p>}
            {etat !== 'connexion' && (
              <>
                <div className="fx-card fx-composer">
                  {!ouvert ? (
                    <button type="button" className="fx-start" onClick={() => setOuvert(true)}>Partager une question, une expérience, une image ou un document…</button>
                  ) : (
                    <>
                      <input className="fx-in" value={titre} onChange={e => setTitre(e.target.value)} placeholder="Titre de votre publication" maxLength={160} autoFocus />
                      <textarea className="fx-in" value={contenu} onChange={e => setContenu(e.target.value)} placeholder="Votre message…" maxLength={8000} rows={5} />
                      <div className="fx-row">
                        <span className="fx-row-l">
                          <ChoixFichiers fichiers={fichiers} setFichiers={setFichiers} max={6} />
                          <select value={categorie} onChange={e => setCategorie(e.target.value)} aria-label="Rubrique">
                            {CATEGORIES.filter(c => c.id !== 'annonces' || admin).map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                          </select>
                        </span>
                        <span>
                          <button type="button" className="x-btn x-btn-line x-btn-sm" onClick={() => { setOuvert(false); setErr('') }}>Annuler</button>{' '}
                          <button type="button" className="x-btn x-btn-dark x-btn-sm" onClick={publier} disabled={busy || titre.trim().length < 3 || (!contenu.trim() && !fichiers.length)}>{busy ? 'Publication…' : 'Publier'}</button>
                        </span>
                      </div>
                      <small className="fx-muted">Images (JPG, PNG, WebP, GIF), PDF, Word, Excel, PowerPoint, texte : 6 fichiers de 10 Mo au maximum.</small>
                      {err && <p className="fx-err">{err}</p>}
                    </>
                  )}
                </div>

                <form className="fx-search" onSubmit={e => { e.preventDefault(); setRecherche(q.trim()) }}>
                  <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher dans le forum" aria-label="Rechercher dans le forum" />
                  {recherche && <button type="button" className="fx-lien" onClick={() => { setQ(''); setRecherche('') }}>Effacer</button>}
                </form>

                {etat === 'charge' && <p className="fx-muted">Chargement…</p>}
                {etat === 'ok' && !posts.length && <p className="fx-muted">{recherche || cat ? 'Aucune publication ne correspond.' : 'Aucune publication pour l’instant : lancez la première discussion.'}</p>}
                {posts.map(p => <Carte key={p.id} p={p} onRetire={() => setPosts(posts.filter(x => x.id !== p.id))} />)}
                {suite && <button type="button" className="x-btn x-btn-line" style={{ justifySelf: 'center' }} onClick={() => charger(true)}>Publications plus anciennes</button>}
              </>
            )}
          </div>
        </div>
      </section>
    </SiteShell>
  )
}

const CSS = `
.fx-grid{display:grid;grid-template-columns:250px 1fr;gap:24px;align-items:start}
.fx-side{position:sticky;top:90px;display:grid;gap:14px}
.fx-box{background:#fff;border:1px solid var(--x-line);border-radius:16px;padding:14px;display:grid;gap:2px}
.fx-st{font-family:var(--x-mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--x-ink3);margin:0 0 6px 4px}
.fx-box button{text-align:left;border:none;background:none;font:inherit;font-size:14px;padding:7px 10px;border-radius:9px;cursor:pointer;color:var(--x-ink2)}
.fx-box button:hover{background:var(--x-paper)}.fx-box button.on{background:var(--x-ink);color:#fff}
.fx-charte ul{margin:0;padding-left:18px;font-size:12.5px;color:var(--x-ink2);display:grid;gap:6px;line-height:1.45}
.fx-main{display:grid;gap:14px;min-width:0}
.fx-card{background:#fff;border:1px solid var(--x-line);border-radius:18px;padding:18px 20px}
.fx-card.pin{border-color:var(--x-gold2);box-shadow:0 0 0 3px rgba(201,168,76,.12)}
.fx-composer{display:grid;gap:10px}
.fx-start{text-align:left;width:100%;border:1px solid var(--x-line);background:var(--x-paper);border-radius:999px;padding:12px 18px;font:inherit;color:var(--x-ink3);cursor:text}
.fx-in{width:100%;border:1px solid var(--x-line2);border-radius:10px;padding:10px 12px;font:inherit;font-size:15px;resize:vertical}
.fx-row{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
.fx-row-l{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.fx-row select{border:1px solid var(--x-line2);border-radius:999px;padding:6px 10px;font:inherit;font-size:13px;background:#fff}
.fx-joindre{border:1px solid var(--x-line2);background:#fff;border-radius:999px;padding:6px 12px;font:inherit;font-size:13px;cursor:pointer}
.fx-joindre:disabled{opacity:.5}
.fx-sel{display:flex;gap:8px;flex-wrap:wrap;width:100%}
.fx-chip{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--x-line);border-radius:10px;padding:4px 6px;font-size:12px;max-width:240px}
.fx-chip img{width:34px;height:34px;object-fit:cover;border-radius:6px}.fx-chip .nm{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.fx-chip button{border:none;background:none;cursor:pointer;color:var(--x-ink3)}
.fx-search{display:flex;gap:8px;align-items:center}
.fx-search input{flex:1;border:1px solid var(--x-line);border-radius:999px;padding:9px 16px;font:inherit;background:#fff}
.fx-head{display:flex;gap:10px;align-items:center;margin-bottom:10px}
.fx-av{width:40px;height:40px;border-radius:50%;background:var(--x-navy);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:600;font-size:14px;flex-shrink:0}
.fx-av.eq{background:var(--x-ink);color:var(--x-gold2)}
.fx-who{flex:1;min-width:0;display:grid}.fx-who b{font-size:14.5px}.fx-who small{color:var(--x-ink3);font-size:12.5px}
.fx-cat{font-size:11.5px;border:1px solid var(--x-line);border-radius:999px;padding:3px 10px;color:var(--x-ink2);white-space:nowrap}
.fx-titre{font-family:var(--x-serif);font-size:20px;margin:2px 0 6px;font-weight:400}
.fx-texte{white-space:pre-wrap;word-wrap:break-word;font-size:15px;line-height:1.6;color:var(--x-ink2)}
.fx-texte a{color:var(--x-navy);word-break:break-all}
.fx-court{max-height:9.6em;overflow:hidden;-webkit-mask-image:linear-gradient(#000 70%,transparent)}
.fx-imgs{display:grid;gap:4px;margin-top:12px;border-radius:14px;overflow:hidden}
.fx-imgs.n1{grid-template-columns:1fr}.fx-imgs.n2{grid-template-columns:1fr 1fr}.fx-imgs.n3,.fx-imgs.n4{grid-template-columns:1fr 1fr}
.fx-imgs.n3 button:first-child{grid-row:span 2}
.fx-imgs button{position:relative;border:none;padding:0;cursor:zoom-in;background:var(--x-paper);aspect-ratio:4/3}
.fx-imgs.n1 button{aspect-ratio:auto;max-height:520px}
.fx-imgs img{width:100%;height:100%;object-fit:cover;display:block}.fx-imgs.n1 img{object-fit:contain;max-height:520px}
.fx-plus{position:absolute;inset:0;background:rgba(0,0,0,.45);color:#fff;font-size:26px;display:flex;align-items:center;justify-content:center}
.fx-files{display:grid;gap:6px;margin-top:10px}
.fx-file{display:flex;gap:10px;align-items:center;border:1px solid var(--x-line);border-radius:12px;padding:8px 12px;text-decoration:none;color:inherit}
.fx-file:hover{background:var(--x-paper)}.fx-file b{display:block;font-size:13.5px;font-weight:600}.fx-file small{color:var(--x-ink3);font-size:12px}
.fx-ext{background:var(--x-red);color:#fff;font-size:10px;font-weight:700;border-radius:6px;padding:8px 6px;min-width:42px;text-align:center;font-family:var(--x-mono)}
.fx-ext.sm{padding:4px;min-width:34px;font-size:9px}
.fx-zoom{position:fixed;inset:0;background:rgba(10,10,10,.88);z-index:1000;display:flex;align-items:center;justify-content:center;cursor:zoom-out;padding:24px}
.fx-zoom img{max-width:100%;max-height:100%;object-fit:contain}.fx-zoom span{position:absolute;top:16px;right:22px;color:#fff;font-size:22px}
.fx-actions{display:flex;gap:6px;align-items:center;margin-top:12px;padding-top:10px;border-top:1px solid var(--x-line)}
.fx-actions>button:not(.fx-lien){border:none;background:none;font:inherit;font-size:14px;padding:6px 10px;border-radius:9px;cursor:pointer;color:var(--x-ink2)}
.fx-actions>button:not(.fx-lien):hover{background:var(--x-paper)}.fx-actions>button.on{color:var(--x-red);font-weight:600}
.fx-sp{flex:1}
.fx-lien{border:none;background:none;font:inherit;font-size:12.5px;color:var(--x-ink3);cursor:pointer;padding:2px 6px;text-decoration:underline}
.fx-coms{margin-top:12px;display:grid;gap:12px}
.fx-com{display:flex;gap:10px}.fx-com .fx-av{width:32px;height:32px;font-size:12px}
.fx-com-b{flex:1;background:var(--x-paper);border-radius:14px;padding:9px 12px;min-width:0}
.fx-com-h{font-size:13px;margin-bottom:2px}.fx-com-h span,.fx-com-h small{color:var(--x-ink3)}
.fx-com-b .fx-texte{font-size:14.5px}
.fx-com-form{display:grid;gap:8px}
.fx-com-form textarea{width:100%;border:1px solid var(--x-line2);border-radius:12px;padding:9px 12px;font:inherit;font-size:14.5px;resize:vertical}
.fx-edit{display:grid;gap:8px}.fx-edit input,.fx-edit textarea{border:1px solid var(--x-line2);border-radius:10px;padding:9px 12px;font:inherit}
.fx-muted{color:var(--x-ink3);font-size:13.5px}.fx-muted.sm{font-size:12px}
.fx-err{color:var(--x-red);font-size:13.5px;margin:0}
@media (max-width:860px){.fx-grid{grid-template-columns:1fr}.fx-side{position:static}.fx-charte{order:2}.fx-box:not(.fx-charte){display:flex;flex-wrap:wrap;gap:4px}.fx-box:not(.fx-charte) .fx-st{width:100%}}
`
