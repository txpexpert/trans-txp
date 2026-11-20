// pages/forum.tsx — Forum des clients, présenté comme une discussion de messagerie :
// on écrit directement dans « Votre message », les réponses s'affichent à la suite.
// Une conversation par jour : le fil repart à zéro chaque nuit à 2 h (heure du Maroc).
// Texte, images et fichiers, « J'aime », signalement. Accès : comptes connectés (middleware + API).
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import SiteShell from '../components/SiteShell'

type Piece = { path: string; nom: string; type: string; taille: number; image: boolean; url?: string }
type Auteur = { nom: string; societe: string | null; initiales: string; equipe: boolean }
type Reponse = { id: string; post_id: string; contenu: string; pieces: Piece[]; cree: string; auteur: Auteur; moi: boolean }
type Post = { id: string; contenu: string; pieces: Piece[]; epingle: boolean; nb_jaime: number; cree: string; modifie: string | null; auteur: Auteur; moi: boolean; aime: boolean; reponses: Reponse[] }

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,application/pdf,.doc,.docx,.xls,.xlsx,.pptx,.txt,.csv'
const taille = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} Mo` : `${Math.max(1, Math.round(n / 1024))} Ko`)
const heure = (s: string) => new Date(s).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
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

function ChoixFichiers({ fichiers, setFichiers, max, seulementBouton, seulementListe }: { fichiers: File[]; setFichiers: (f: File[]) => void; max: number; seulementBouton?: boolean; seulementListe?: boolean }) {
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
      {!seulementListe && <button type="button" className="fx-joindre" onClick={() => ref.current?.click()} disabled={fichiers.length >= max} aria-label="Joindre une image ou un fichier" title="Joindre une image ou un fichier">
        <span aria-hidden="true">📎</span>
      </button>}
      {!seulementBouton && fichiers.length > 0 && (
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


// Zone de saisie façon messagerie : Entrée envoie, Maj+Entrée passe à la ligne.
function Saisie({ placeholder, max, maxFichiers, onEnvoyer, autoFocus, onAnnuler }: {
  placeholder: string; max: number; maxFichiers: number; autoFocus?: boolean; onAnnuler?: () => void
  onEnvoyer: (texte: string, fichiers: File[]) => Promise<string | null>
}) {
  const [texte, setTexte] = useState('')
  const [fichiers, setFichiers] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const vide = !texte.trim() && !fichiers.length
  async function envoyer() {
    if (vide || busy) return
    setBusy(true); setErr('')
    const e = await onEnvoyer(texte, fichiers)
    setBusy(false)
    if (e) return setErr(e)
    setTexte(''); setFichiers([])
  }
  return (
    <div className="fx-saisie">
      {fichiers.length > 0 && <ChoixFichiers fichiers={fichiers} setFichiers={setFichiers} max={maxFichiers} seulementListe />}
      <div className="fx-saisie-l">
        <ChoixFichiers fichiers={fichiers} setFichiers={setFichiers} max={maxFichiers} seulementBouton />
        <textarea value={texte} onChange={e => setTexte(e.target.value)} placeholder={placeholder} maxLength={max} rows={1} autoFocus={autoFocus}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); envoyer() } if (e.key === 'Escape' && onAnnuler) onAnnuler() }}
          onInput={e => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 180) + 'px' }} />
        <button type="button" className="fx-envoyer" onClick={envoyer} disabled={vide || busy} aria-label="Envoyer">{busy ? '…' : '➤'}</button>
      </div>
      {err && <p className="fx-err">{err}</p>}
    </div>
  )
}

function Bulle({ a, moi, cree, modifie, children }: { a: Auteur; moi: boolean; cree: string; modifie?: string | null; children: React.ReactNode }) {
  return (
    <div className={`fx-ligne ${moi ? 'moi' : ''}`}>
      {!moi && <Avatar a={a} />}
      <div className={`fx-bulle ${moi ? 'moi' : ''} ${a.equipe ? 'eq' : ''}`}>
        {!moi && <div className="fx-nom">{a.nom}{a.societe && <span> · {a.societe}</span>}</div>}
        {children}
        <div className="fx-h">{heure(cree)}{modifie ? ' · modifié' : ''}</div>
      </div>
    </div>
  )
}

function Message({ p, onMaj, onRetire }: { p: Post; onMaj: () => void; onRetire: () => void }) {
  const [post, setPost] = useState(p)
  useEffect(() => { setPost(p) }, [p])
  const [repondre, setRepondre] = useState(false)
  const [edition, setEdition] = useState(false)
  const [contenu, setContenu] = useState(p.contenu)
  async function aimer() {
    const r = await fetch('/api/forum/interactions', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'jaime', post_id: post.id }) })
    if (r.ok) { const j = await r.json(); setPost({ ...post, aime: j.aime, nb_jaime: j.nb_jaime }) }
  }
  async function enregistrer() {
    const r = await fetch(`/api/forum/posts/${post.id}`, { method: 'PATCH', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contenu }) })
    if (r.ok) { setPost({ ...post, contenu, modifie: new Date().toISOString() }); setEdition(false) }
  }
  async function supprimer() {
    if (!confirm('Supprimer définitivement ce message, ses réponses et ses fichiers ?')) return
    const r = await fetch(`/api/forum/posts/${post.id}`, { method: 'DELETE', credentials: 'same-origin' })
    if (r.ok) onRetire()
  }
  async function supprimerReponse(id: string) {
    if (!confirm('Supprimer cette réponse ?')) return
    await fetch(`/api/forum/commentaires?id=${id}`, { method: 'DELETE', credentials: 'same-origin' }); onMaj()
  }
  async function envoyerReponse(texte: string, fichiers: File[]) {
    if (!texte.trim()) return 'Écrivez votre réponse.'
    const fd = new FormData(); fd.append('post_id', post.id); fd.append('contenu', texte); fichiers.forEach(f => fd.append('fichiers', f))
    const r = await fetch('/api/forum/commentaires', { method: 'POST', credentials: 'same-origin', body: fd })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) return j.error || 'Envoi impossible'
    setRepondre(false); onMaj(); return null
  }
  return (
    <div className={`fx-fil ${post.epingle ? 'pin' : ''}`}>
      {post.epingle && <div className="fx-pin">📌 Annonce épinglée</div>}
      <Bulle a={post.auteur} moi={post.moi} cree={post.cree} modifie={post.modifie}>
        {edition ? (
          <div className="fx-edit">
            <textarea value={contenu} onChange={e => setContenu(e.target.value)} maxLength={8000} rows={4} autoFocus />
            <div className="fx-row"><span /><span><button type="button" className="x-btn x-btn-line x-btn-sm" onClick={() => { setEdition(false); setContenu(post.contenu) }}>Annuler</button> <button type="button" className="x-btn x-btn-dark x-btn-sm" onClick={enregistrer}>Enregistrer</button></span></div>
          </div>
        ) : post.contenu ? <Texte t={post.contenu} /> : null}
        <Pieces pieces={post.pieces} />
        <div className="fx-act">
          <button type="button" className={`fx-ic ${post.aime ? 'on' : ''}`} onClick={aimer} aria-pressed={post.aime} title={post.aime ? 'Je n’aime plus' : 'J’aime'} aria-label="J’aime">{post.aime ? '❤️' : '🤍'} <span>J’aime{post.nb_jaime ? ` · ${post.nb_jaime}` : ''}</span></button>
          <button type="button" onClick={() => setRepondre(o => !o)} aria-expanded={repondre}>↩ Répondre</button>
          {post.moi ? <>
            <button type="button" onClick={() => setEdition(true)}>Modifier</button>
            <button type="button" onClick={supprimer}>Supprimer</button>
          </> : <BoutonSignaler postId={post.id} />}
        </div>
      </Bulle>
      {(post.reponses.length > 0 || repondre) && (
        <div className="fx-reps">
          {post.reponses.map(r => (
            <Bulle key={r.id} a={r.auteur} moi={r.moi} cree={r.cree}>
              <Texte t={r.contenu} />
              <Pieces pieces={r.pieces} />
              <div className="fx-act">
                {r.moi ? <button type="button" onClick={() => supprimerReponse(r.id)}>Supprimer</button> : <BoutonSignaler commentaireId={r.id} />}
              </div>
            </Bulle>
          ))}
          {repondre && <Saisie placeholder={`Répondre à ${post.moi ? 'votre message' : post.auteur.nom}…`} max={4000} maxFichiers={3} autoFocus onAnnuler={() => setRepondre(false)} onEnvoyer={envoyerReponse} />}
        </div>
      )}
    </div>
  )
}

export default function Forum() {
  const [etat, setEtat] = useState<'charge' | 'ok' | 'connexion' | 'erreur'>('charge')
  const [posts, setPosts] = useState<Post[]>([])
  const [debut, setDebut] = useState<string | null>(null)
  const finRef = useRef<HTMLDivElement>(null)
  const premier = useRef(true)

  async function charger(defiler = false) {
    const r = await fetch('/api/forum/posts', { credentials: 'same-origin', cache: 'no-store' })
    if (r.status === 401) return setEtat('connexion')
    if (!r.ok) return setEtat(e => (e === 'ok' ? e : 'erreur'))
    const j = await r.json()
    setPosts(j.posts); setDebut(j.debut); setEtat('ok')
    if (defiler || premier.current) { premier.current = false; setTimeout(() => finRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 80) }
  }
  // Nouveaux messages : actualisation toutes les 20 secondes tant que la page est visible
  useEffect(() => {
    charger()
    const t = setInterval(() => { if (document.visibilityState === 'visible') charger() }, 20000)
    const maj = () => charger()
    window.addEventListener('forum:maj', maj)
    return () => { clearInterval(t); window.removeEventListener('forum:maj', maj) }
  }, [])

  async function publier(contenu: string, fichiers: File[]) {
    const fd = new FormData()
    fd.append('contenu', contenu)
    fichiers.forEach(f => fd.append('fichiers', f))
    const r = await fetch('/api/forum/posts', { method: 'POST', credentials: 'same-origin', body: fd })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) return j.error || 'Envoi impossible'
    charger(true); return null
  }

  const jour = debut ? new Date(Date.parse(debut) + 3 * 3600e3).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : ''

  return (
    <SiteShell title="Forum des clients | IXP-Import-eXPert" description="Le forum des importateurs, transitaires et industriels clients d’Import-eXPert.">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <section className="x-hero" style={{ paddingBottom: 14 }}>
        <div className="x-wrap">
          <div className="x-eyebrow">Communauté</div>
          <h1 className="x-h1 x-h1-sm">Le forum <em>des importateurs</em></h1>
          <p className="x-lead" style={{ maxWidth: 720 }}>Posez une question, partagez un retour d’expérience, une photo de marquage ou un document utile avec les autres clients d’Import-eXPert. Une nouvelle conversation commence chaque jour.</p>
        </div>
      </section>
      <section className="x-sec-tight" style={{ paddingTop: 0 }}>
        <div className="x-wrap fx-grid">
          <aside className="fx-side">
            <div className="fx-box fx-charte">
              <b className="fx-st">Charte du forum</b>
              <ul>
                <li>Votre prénom, l’initiale de votre nom et votre société sont visibles des autres membres.</li>
                <li>Ne publiez aucune donnée personnelle de tiers ni document confidentiel (DUM, factures nominatives) sans les anonymiser.</li>
                <li>Pas de publicité ni de démarchage.</li>
                <li>Les échanges entre membres ne valent pas avis d’expert : pour un cas précis, utilisez le <Link href="/modules/conseil">conseil personnalisé</Link>.</li>
                <li>Tout contenu peut être signalé et retiré par l’équipe Import-eXPert, notamment après signalement ; un message signalé par 3 membres est retiré automatiquement.</li>
                <li>Les numéros de téléphone, adresses e-mail, numéros de DUM ou de facture et le démarchage sont refusés à l’envoi.</li>
                <li>Le fil repart à zéro chaque nuit à 2 h (heure du Maroc).</li>
              </ul>
            </div>
          </aside>

          <div className="fx-main">
            {etat === 'connexion' && <div className="x-pc-cta"><p>Le forum est réservé aux membres. Connectez-vous ou créez votre compte gratuit.</p><Link href="/auth/login?redirect=/forum" className="x-btn x-btn-gold">Connexion</Link></div>}
            {etat === 'erreur' && <p className="fx-err">Forum momentanément indisponible. Réessayez dans un instant.</p>}
            {etat !== 'connexion' && etat !== 'erreur' && (
              <div className="fx-chat">
                <div className="fx-jour"><span>Conversation du jour{jour ? ` · ${jour}` : ''}</span></div>
                <div className="fx-flux">
                  {etat === 'charge' && <p className="fx-muted" style={{ textAlign: 'center' }}>Chargement…</p>}
                  {etat === 'ok' && !posts.length && <p className="fx-muted" style={{ textAlign: 'center' }}>Aucun message aujourd’hui : écrivez le premier.</p>}
                  {posts.map(p => <Message key={p.id} p={p} onMaj={() => charger()} onRetire={() => setPosts(x => x.filter(y => y.id !== p.id))} />)}
                  <div ref={finRef} />
                </div>
                <div className="fx-pied">
                  <Saisie placeholder="Votre message…" max={8000} maxFichiers={6} onEnvoyer={publier} />
                  <small className="fx-muted sm">Entrée pour envoyer, Maj + Entrée pour aller à la ligne · images, PDF, Word, Excel, PowerPoint, texte (10 Mo par fichier).</small>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </SiteShell>
  )
}

function BoutonSignaler({ postId, commentaireId }: { postId?: string; commentaireId?: string }) {
  const [fait, setFait] = useState(false)
  async function signaler() {
    const motif = prompt('Pourquoi signalez-vous ce contenu ? (propos déplacés, publicité, données personnelles, hors sujet…)')
    if (motif === null) return
    const r = await fetch('/api/forum/interactions', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'signaler', post_id: postId, commentaire_id: commentaireId, motif }) })
    if (r.ok) { setFait(true); const j = await r.json().catch(() => ({})); if (j.masque) window.dispatchEvent(new Event('forum:maj')) }
  }
  return fait ? <span className="fx-muted sm">🚩 Signalé, merci</span> : <button type="button" className="fx-ic" onClick={signaler} title="Signaler ce contenu" aria-label="Signaler ce contenu">🚩 <span>Signaler</span></button>
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
.fx-chat{background:#fff;border:1px solid var(--x-line);border-radius:18px;display:flex;flex-direction:column;min-height:60vh}
.fx-jour{text-align:center;padding:12px 12px 4px}.fx-jour span{display:inline-block;background:var(--x-paper);border:1px solid var(--x-line);border-radius:999px;padding:4px 12px;font-size:12.5px;color:var(--x-ink2);text-transform:none}
.fx-flux{flex:1;display:flex;flex-direction:column;gap:14px;padding:12px 16px;background:#F6F3EC;margin:8px 0 0}
.fx-fil{display:flex;flex-direction:column;gap:6px}
.fx-fil.pin{border-left:3px solid var(--x-gold2);padding-left:8px}.fx-pin{font-size:12px;color:var(--x-ink2)}
.fx-ligne{display:flex;gap:8px;align-items:flex-end;max-width:82%}.fx-ligne.moi{align-self:flex-end;flex-direction:row-reverse}
.fx-ligne .fx-av{width:32px;height:32px;font-size:12px}
.fx-bulle{background:#fff;border:1px solid var(--x-line);border-radius:14px 14px 14px 4px;padding:8px 12px 6px;min-width:120px;box-shadow:0 1px 1px rgba(0,0,0,.04)}
.fx-bulle.moi{background:#E7F6E1;border-color:#CDE8C2;border-radius:14px 14px 4px 14px}
.fx-bulle.eq{border-color:var(--x-gold2)}
.fx-nom{font-size:12.5px;font-weight:600;color:var(--x-navy);margin-bottom:2px}.fx-nom span{font-weight:400;color:var(--x-ink3)}
.fx-bulle .fx-texte{font-size:14.5px;color:var(--x-ink)}
.fx-h{font-size:11px;color:var(--x-ink3);text-align:right;margin-top:2px}
.fx-act{display:flex;gap:2px;flex-wrap:wrap;margin-top:4px}
.fx-act button,.fx-act .fx-lien{border:none;background:none;font:inherit;font-size:12px;color:var(--x-ink3);cursor:pointer;padding:2px 6px;border-radius:6px;text-decoration:none}
.fx-act button:hover{background:rgba(0,0,0,.05)}
.fx-act .fx-ic{display:inline-flex;align-items:center;gap:4px;font-size:12px}.fx-act .fx-ic.on span{color:var(--x-red);font-weight:600}.fx-act button.on{color:var(--x-red);font-weight:600}
.fx-reps{display:flex;flex-direction:column;gap:6px;margin-left:40px;padding-left:10px;border-left:2px solid var(--x-line)}
.fx-reps .fx-ligne{max-width:90%}
.fx-pied{border-top:1px solid var(--x-line);padding:10px 12px;display:grid;gap:6px;position:sticky;bottom:0;background:#fff;border-radius:0 0 18px 18px}
.fx-saisie{display:grid;gap:6px}
.fx-saisie-l{display:flex;gap:8px;align-items:flex-end}
.fx-saisie textarea{flex:1;border:1px solid var(--x-line2);border-radius:20px;padding:10px 14px;font:inherit;font-size:15px;resize:none;line-height:1.4;max-height:180px;background:#fff}
.fx-saisie .fx-joindre{border-radius:50%;width:40px;height:40px;padding:0;font-size:17px;flex-shrink:0}
.fx-envoyer{width:42px;height:42px;border-radius:50%;border:none;background:var(--x-ink);color:#fff;font-size:17px;cursor:pointer;flex-shrink:0}
.fx-envoyer:disabled{opacity:.35;cursor:default}
.fx-reps .fx-saisie textarea{font-size:14px;padding:8px 12px}.fx-reps .fx-envoyer{width:36px;height:36px;font-size:15px}.fx-reps .fx-joindre{width:36px;height:36px}
@media (max-width:860px){.fx-ligne{max-width:94%}.fx-reps{margin-left:16px}}
@media (max-width:860px){.fx-grid{grid-template-columns:1fr}.fx-side{position:static}.fx-charte{order:2}}
`
