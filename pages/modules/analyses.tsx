// pages/modules/analyses.tsx
// Module 11 — Analyses Stratégiques + Transit-IA IA
// Version fusionnée : cartes éditoriales + module d'analyse IA

import ModuleLayout from '../../components/ModuleLayout';
import { useState, useRef, useEffect } from 'react';

// ─── Données statiques (page originale, inchangées) ───────────────────────────
const CARDS = [
  ['RAPPORT',   'Baromètre import-export Maroc Q1 2025',              "Évolution des échanges, top produits importés/exportés, droits moyens.",                                                              '→ Télécharger (PDF)'],
  ['VEILLE',    'ZLECAf — état des négociations tarifaires',           "Concessions tarifaires et protocoles d'accès au marché africain pour les exportateurs marocains.",                                   "→ Lire l'analyse"],
  ['BENCHMARK', 'Comparatif droits de douane régionaux',               'Maroc vs Tunisie vs Égypte vs Côte d\'Ivoire — positionnement compétitif pour 12 filières.',                                        '→ Voir le benchmark'],
  ['STRATÉGIE', 'Optimisation tarifaire — agroalimentaire',            "Étude de cas : réduction de 18% des coûts douaniers par restructuration du sourcing.",                                             "→ Lire l'étude"],
];

// ─── Configuration IA ─────────────────────────────────────────────────────────
const SECTORS = [
  { value: 'douane',     label: 'Douane & Commerce international' },
  { value: 'textile',    label: 'Textile & Habillement (ch.50–63)' },
  { value: 'automobile', label: 'Automobile & Équipements (ch.87)' },
  { value: 'agro',       label: 'Agroalimentaire & Agriculture' },
  { value: 'industrie',  label: 'Industrie générale' },
  { value: 'logistique', label: 'Services & Logistique' },
];

const PERIMETRES = [
  { value: 'maroc_ue',      label: 'Maroc — Union Européenne' },
  { value: 'maroc_global',  label: 'Maroc — Marché mondial' },
  { value: 'maroc_afrique', label: 'Maroc — Afrique & AfCFTA' },
  { value: 'maroc_usa',     label: 'Maroc — États-Unis' },
  { value: 'maroc_turquie', label: 'Maroc — Turquie' },
];

const EXAMPLES = [
  "Quels sont les droits de douane actuels sur les véhicules importés de l'UE ?",
  "Impact de la réforme PEM 2025 sur l'origine préférentielle textile",
  "Conditions d'admission dans une Zone d'Accélération Industrielle",
  "Procédure de dédouanement par anticipation sur BADR",
  "Taux de TVA à l'importation sur les équipements industriels",
  "Accords AfCFTA : état des ratifications et impact Maroc",
];

interface Message { role: 'user' | 'ai'; text: string; sources?: {title:string; url:string}[]; ts?: string; }

// ─── CSS spécifique au module ─────────────────────────────────────────────────
const css = `
/* ── Séparateur section IA ── */
.ia-separator{display:flex;align-items:center;gap:1rem;margin:2.5rem 0 1.5rem}
.ia-sep-line{flex:1;height:1px;background:var(--border)}
.ia-sep-badge{display:flex;align-items:center;gap:.5rem;padding:.375rem 1rem;background:#EDF2FA;border:1px solid #C8D8EC;border-radius:20px;font-size:11px;font-weight:600;color:#2D5FA6;white-space:nowrap;letter-spacing:.05em}
.ia-sep-dot{width:7px;height:7px;background:#4CAF7C;border-radius:50%;animation:iapulse 2s infinite}
@keyframes iapulse{0%,100%{opacity:1}50%{opacity:.35}}

/* ── Section IA header ── */
.ia-hdr{background:linear-gradient(135deg,#1B3A6B 0%,#2D5FA6 100%);border-radius:8px;padding:1.125rem 1.25rem;display:flex;align-items:center;gap:.875rem;margin-bottom:1rem}
.ia-av{width:38px;height:38px;background:rgba(255,255,255,.15);border:1.5px solid rgba(255,255,255,.3);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#fff;flex-shrink:0}
.ia-hdr-text h3{font-size:15px;font-weight:600;color:#fff;letter-spacing:.01em}
.ia-hdr-text p{font-size:11px;color:rgba(255,255,255,.7);margin-top:2px}
.ia-status{margin-left:auto;display:flex;align-items:center;gap:4px;font-size:11px;color:rgba(255,255,255,.8)}

/* ── Config row ── */
.ia-config{display:grid;grid-template-columns:1fr 1fr;gap:.875rem;margin-bottom:.875rem}
.ia-cfg-card{background:var(--white);border:1px solid var(--border);border-radius:6px;padding:.75rem 1rem}
.ia-cfg-label{font-size:10px;font-weight:600;color:#2D5FA6;letter-spacing:.1em;text-transform:uppercase;margin-bottom:.375rem}
.ia-select{width:100%;padding:8px 10px;border:1.5px solid #C8D8EC;border-radius:5px;font-size:12px;color:var(--ink);background:var(--white);outline:none;cursor:pointer;font-family:'DM Sans',sans-serif;transition:border-color .15s}
.ia-select:focus{border-color:#2D5FA6}

/* ── Exemples ── */
.ia-ex-label{font-size:10px;font-weight:600;color:var(--ink3);letter-spacing:.08em;text-transform:uppercase;margin-bottom:.4rem}
.ia-ex-row{display:flex;flex-wrap:wrap;gap:.375rem;margin-bottom:.875rem}
.ia-ex-btn{padding:5px 11px;background:#EDF2FA;border:1px solid #C8D8EC;color:#2D5FA6;font-size:12px;border-radius:20px;cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif}
.ia-ex-btn:hover{background:#2D5FA6;color:#fff;border-color:#2D5FA6}

/* ── Chat ── */
.ia-chat{background:var(--white);border:1.5px solid #D4E0EE;border-radius:8px;overflow:hidden;box-shadow:0 2px 10px rgba(27,58,107,.07)}
.ia-msgs{height:380px;overflow-y:auto;padding:1rem 1.125rem;display:flex;flex-direction:column;gap:.875rem;background:#FAFCFF}
.ia-msg{display:flex;gap:.625rem;align-items:flex-start;animation:iafade .3s ease}
@keyframes iafade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.ia-av2{width:28px;height:28px;min-width:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0}
.ia-av2.ai{background:linear-gradient(135deg,#1B3A6B,#2D5FA6);color:#fff}
.ia-av2.user{background:#E8F0FB;color:#2D5FA6;border:1px solid #C8D8EC}
.ia-bub{padding:.75rem .875rem;border-radius:8px;font-size:13px;line-height:1.75;max-width:660px}
.ia-bub.ai{background:#fff;border:1.5px solid #D4E0EE;color:var(--ink)}
.ia-bub.user{background:linear-gradient(135deg,#1B3A6B,#2D5FA6);color:#fff}
.ia-bub.ai strong{color:#1B3A6B}
.ia-sources{display:flex;flex-wrap:wrap;gap:.3rem;margin-top:.5rem}
.ia-src{display:inline-flex;align-items:center;gap:3px;background:#EDF2FA;color:#2D5FA6;font-size:10px;padding:2px 7px;border-radius:4px;border:1px solid #C8D8EC;text-decoration:none;transition:all .15s}
.ia-src:hover{background:#2D5FA6;color:#fff}
.ia-sig{margin-top:.625rem;padding-top:.5rem;border-top:1px solid #D4E0EE;font-size:11px;color:#2D5FA6;font-weight:600;font-style:italic}
.ia-typing{padding:.625rem .875rem;background:#fff;border:1.5px solid #D4E0EE;border-radius:8px;display:flex;gap:4px;align-items:center;width:70px}
.ia-td{width:5px;height:5px;background:#2D5FA6;border-radius:50%;animation:iabounce .8s infinite}
.ia-td:nth-child(2){animation-delay:.15s}.ia-td:nth-child(3){animation-delay:.3s}
@keyframes iabounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}
.ia-input-row{border-top:1.5px solid #D4E0EE;padding:.875rem 1.125rem;background:#fff;display:flex;gap:.625rem;align-items:flex-end}
.ia-textarea{flex:1;border:1.5px solid #C8D8EC;border-radius:6px;padding:.625rem .875rem;font-size:13px;font-family:'DM Sans',sans-serif;color:var(--ink);resize:none;outline:none;background:#F8FAFD;transition:border-color .15s;min-height:48px;max-height:120px}
.ia-textarea:focus{border-color:#2D5FA6;background:#fff}
.ia-send{padding:9px 20px;background:linear-gradient(135deg,#1B3A6B,#2D5FA6);color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;transition:opacity .15s;font-family:'DM Sans',sans-serif;white-space:nowrap}
.ia-send:hover{opacity:.88}
.ia-send:disabled{opacity:.45;cursor:not-allowed}
.ia-disclaimer{margin-top:.75rem;padding:.625rem .875rem;background:var(--white);border:1px solid var(--border);border-left:3px solid #2D5FA6;font-size:11px;color:var(--ink3);line-height:1.6}
@media(max-width:700px){.ia-config{grid-template-columns:1fr}}
`;

// ─── Composant ────────────────────────────────────────────────────────────────
export default function Analyses() {
  const [secteur,   setSecteur]   = useState('douane');
  const [perimetre, setPerimetre] = useState('maroc_ue');
  const [question,  setQuestion]  = useState('');
  const [messages,  setMessages]  = useState<Message[]>([]);
  const [loading,   setLoading]   = useState(false);
  const msgsRef = useRef<HTMLDivElement>(null);
  const taRef   = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMessages([{
      role: 'ai',
      text: "Bonjour. Je suis **Transit-IA**, votre assistant personnalisé en douanes et commerce international.\n\nSélectionnez votre secteur et périmètre ci-dessus, puis posez votre question. J'effectue des recherches sur des sources officielles vérifiables et vous délivre une analyse structurée avec citations.",
    }]);
  }, []);

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [messages, loading]);

  const handleSend = async () => {
    const q = question.trim();
    if (!q || loading) return;
    const ts = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { role: 'user', text: q, ts }]);
    setQuestion('');
    setLoading(true);
    try {
      const res = await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, secteur, perimetre }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur serveur');
      setMessages(prev => [...prev, { role: 'ai', text: data.text || '', sources: data.sources || [], ts: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'ai', text: err.message || 'Erreur de connexion. Réessayez.\n\n---\n*Transit-IA, votre assistant personnalisé*' }]);
    } finally {
      setLoading(false);
      taRef.current?.focus();
    }
  };

  const mdToHtml = (t: string) =>
    t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
     .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
     .replace(/\*(.*?)\*/g,'<em>$1</em>')
     .replace(/^#{1,3} (.+)$/gm,'<strong style="font-size:14px;color:#1B3A6B;display:block;margin-top:.625rem">$1</strong>')
     .replace(/^---$/gm,'<hr style="border:none;border-top:1px solid #D4E0EE;margin:.5rem 0">')
     .replace(/\n\n/g,'<br><br>').replace(/\n/g,'<br>');

  const splitSig = (text: string) => {
    const m = text.match(/^([\s\S]+?)(?:\n?---\n?\*Douane\.ia.*?\*)?$/);
    const hasSig = /---\n?\*Douane\.ia/.test(text);
    return { body: m ? m[1].trim() : text, hasSig };
  };

  return (
    <ModuleLayout
      kicker="MODULE 11"
      title="Analyses Stratégiques"
      sub="Rapports de marché, benchmarks tarifaires, veille ZLECAf, APE et dynamiques du commerce régional afro-méditerranéen."
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* ── Statistiques (inchangées) ── */}
      <div className="info-grid">
        <div className="istat"><div className="istat-n">54</div><div className="istat-l">Pays ZLECAf membres actifs</div></div>
        <div className="istat"><div className="istat-n">APE</div><div className="istat-l">Accord Partenariat Économique UE–Maroc</div></div>
        <div className="istat"><div className="istat-n">Q1 2025</div><div className="istat-l">Dernier rapport semestriel</div></div>
      </div>

      {/* ── Cartes éditoriales (inchangées) ── */}
      <div className="card-grid">
        {CARDS.map(([num, t, d, arrow]) => (
          <div key={t} className="card">
            <div className="card-num">{num}</div>
            <div className="card-title">{t}</div>
            <div className="card-desc">{d}</div>
            <div className="card-arrow">{arrow}</div>
          </div>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION IA — Transit-IA Analyses en temps réel
      ───────────────────────────────────────────────────────────── */}

      {/* Séparateur */}
      <div className="ia-separator">
        <div className="ia-sep-line" />
        <div className="ia-sep-badge">
          <div className="ia-sep-dot" />
          Transit-IA — ANALYSE EN TEMPS RÉEL
        </div>
        <div className="ia-sep-line" />
      </div>

      {/* Header Transit-IA */}
      <div className="ia-hdr">
        <div className="ia-av">DI</div>
        <div className="ia-hdr-text">
          <h3>Faites vos Analyses Stratégiques</h3>
          <p>RECHERCHE SUR SOURCES OFFICIELLES VÉRIFIABLES · DOUANE.GOV.MA · EUR-LEX · OMC · OFFICE DES CHANGES</p>
        </div>
        <div className="ia-status"><div className="ia-sep-dot" style={{ background:'#4CAF7C', width:'7px', height:'7px', borderRadius:'50%' }} />En ligne</div>
      </div>

      {/* Config secteur + périmètre */}
      <div className="ia-config">
        <div className="ia-cfg-card">
          <div className="ia-cfg-label">Votre secteur d'activité</div>
          <select className="ia-select" value={secteur} onChange={e => setSecteur(e.target.value)}>
            {SECTORS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div className="ia-cfg-card">
          <div className="ia-cfg-label">Périmètre géographique</div>
          <select className="ia-select" value={perimetre} onChange={e => setPerimetre(e.target.value)}>
            {PERIMETRES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
      </div>

      {/* Exemples */}
      <div className="ia-ex-label">Questions fréquentes</div>
      <div className="ia-ex-row">
        {EXAMPLES.map((ex, i) => (
          <button key={i} className="ia-ex-btn" onClick={() => setQuestion(ex)}>{ex}</button>
        ))}
      </div>

      {/* Interface chat */}
      <div className="ia-chat">
        <div className="ia-msgs" ref={msgsRef}>
          {messages.map((msg, i) => {
            const { body, hasSig } = msg.role === 'ai' ? splitSig(msg.text) : { body: msg.text, hasSig: false };
            return (
              <div key={i} className="ia-msg">
                <div className={`ia-av2 ${msg.role}`}>{msg.role === 'ai' ? 'DI' : 'Vous'}</div>
                <div>
                  <div className={`ia-bub ${msg.role}`}>
                    {msg.role === 'ai' ? (
                      <>
                        <div dangerouslySetInnerHTML={{ __html: mdToHtml(body) }} />
                        {hasSig && <div className="ia-sig">— Transit-IA, votre assistant personnalisé</div>}
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="ia-sources">
                            {msg.sources.slice(0, 5).map((s, j) => (
                              <a key={j} className="ia-src" href={s.url} target="_blank" rel="noopener noreferrer">
                                🔗 {s.title.slice(0, 50)}{s.title.length > 50 ? '…' : ''}
                              </a>
                            ))}
                          </div>
                        )}
                      </>
                    ) : <span>{body}</span>}
                  </div>
                  {msg.ts && <div style={{ fontSize:'10px', color:'var(--ink3)', marginTop:'3px' }}>{msg.ts}</div>}
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="ia-msg">
              <div className="ia-av2 ai">DI</div>
              <div className="ia-typing"><div className="ia-td"/><div className="ia-td"/><div className="ia-td"/></div>
            </div>
          )}
        </div>
        <div className="ia-input-row">
          <textarea
            ref={taRef}
            className="ia-textarea"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Posez votre question stratégique ou douanière… (Entrée pour envoyer)"
            rows={2}
          />
          <button className="ia-send" onClick={handleSend} disabled={loading || !question.trim()}>
            {loading ? 'Analyse…' : 'Analyser →'}
          </button>
        </div>
      </div>

      <div className="ia-disclaimer">
        Les analyses sont produites à partir de sources officielles publiques (douane.gov.ma, eur-lex.europa.eu, wto.org, oc.gov.ma). Elles constituent une aide à la décision et non un avis juridique. Pour toute question impliquant des enjeux significatifs, une vérification auprès de l'ADII ou d'un expert agréé est recommandée.
      </div>
    </ModuleLayout>
  );
}

