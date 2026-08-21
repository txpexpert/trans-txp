// pages/modules/origine-aleca.tsx
// Simulateur d'origine / UE — Transit-IA
// Route : /modules/origine-aleca

import Head from 'next/head';
import Script from 'next/script';
import { useState, useEffect } from 'react';

interface TariffEntry { c: string; l: string; }

const css = `
/* ── Reset & tokens ── */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --gold:#B8922A;--gold-h:#D4A940;--gold-pale:#FBF5E6;
  --gold-bd:rgba(184,146,42,.25);--gold-dim:rgba(184,146,42,.1);
  --ink:#1A1A18;--ink2:#2E2E2A;--mid:#5A5A54;--muted:#8A8A82;
  --bg:#F9F8F4;--bg2:#F2F0EA;--surface:#FFFFFF;
  --border:#E4E2DA;--border-mid:#D0CEC4;
  --sh:0 1px 4px rgba(26,26,24,.06);--sh-md:0 4px 16px rgba(26,26,24,.1);
  /* compat ancien design */
  --gold4:#FBF5E6;--gold3:#F5E4B0;--white:#FDFCF8;
  --border2:#D4C8A8;
}
body{background:var(--bg);color:var(--ink);font-family:"DM Sans",sans-serif;font-size:14px;line-height:1.6;min-height:100vh;-webkit-font-smoothing:antialiased}

/* ── Barre de navigation minimale ── */
.mod-bar{
  position:sticky;top:0;z-index:100;
  background:rgba(249,248,244,.96);backdrop-filter:blur(12px);
  border-bottom:1px solid var(--border);
  padding:0 2rem;height:52px;
  display:flex;align-items:center;gap:1rem;
  box-shadow:var(--sh);
}
.mod-back{
  display:inline-flex;align-items:center;gap:6px;
  font-size:11px;letter-spacing:.08em;text-transform:uppercase;
  color:var(--muted);border:1px solid var(--border-mid);
  padding:5px 14px;text-decoration:none;
  background:var(--surface);transition:all .18s;
  font-family:"JetBrains Mono",monospace;white-space:nowrap;
}
.mod-back:hover{border-color:var(--gold);color:var(--gold);background:var(--gold-pale)}
.mod-bar-title{font-size:12px;color:var(--mid);letter-spacing:.02em;font-weight:500}
.mod-bar-badge{
  font-family:"JetBrains Mono",monospace;font-size:9.5px;letter-spacing:.1em;
  color:var(--gold);padding:2px 8px;
  background:var(--gold-dim);border:1px solid var(--gold-bd);margin-left:auto;
}
.mod-wrap{max-width:1400px;margin:0 auto;padding:2rem 2rem 4rem}

/* ── Hero ── */
.mod-hero{padding-bottom:1.5rem;border-bottom:1px solid var(--border);margin-bottom:1.5rem}
.mod-hero h1{font-family:"DM Serif Display",Georgia,serif;font-size:clamp(24px,3.5vw,38px);font-weight:400;letter-spacing:-.01em;line-height:1.1}
.mod-hero h1 em{font-style:italic;color:var(--gold)}
.mod-hero p{margin-top:.5rem;font-size:13px;color:var(--mid);line-height:1.65;max-width:640px}

/* ── Layout 2 colonnes ── */
.ori-layout{display:grid;grid-template-columns:1fr 1fr;gap:1rem;align-items:start}
.ori-col{display:flex;flex-direction:column;gap:.875rem}

/* ── Panels / cartes ── */
.ori-panel{background:var(--surface);border:1px solid var(--border);border-radius:4px;overflow:hidden;box-shadow:var(--sh)}
.ori-ph{padding:.5rem 1rem;background:var(--bg2);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
.ori-pt{font-size:11px;font-weight:600;letter-spacing:.08em;color:var(--ink2);text-transform:uppercase}
.ori-badge{font-size:10px;padding:2px 8px;border:1px solid var(--gold-bd);color:var(--gold);background:var(--gold-pale);letter-spacing:.06em;white-space:nowrap;font-weight:500;font-family:"JetBrains Mono",monospace}
.ori-body{padding:.875rem 1rem}

/* ── Labels ── */
.ori-label{display:block;font-size:10px;color:var(--muted);margin-bottom:4px;margin-top:9px;letter-spacing:.08em;font-weight:500;text-transform:uppercase;font-family:"JetBrains Mono",monospace}

/* ── Inputs & selects ── */
.ori-input{
  width:100%;padding:8px 11px;
  border:1px solid var(--border-mid);background:var(--surface);
  font-family:"DM Sans",sans-serif;font-size:12.5px;color:var(--ink);
  outline:none;transition:border-color .18s,box-shadow .18s;border-radius:3px;
}
.ori-input:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(184,146,42,.12)}
.ori-input:hover:not(:focus){border-color:#A89060}
.ori-select{
  width:100%;padding:8px 11px;
  border:1px solid var(--border-mid);background:var(--surface);
  font-family:"DM Sans",sans-serif;font-size:12.5px;color:var(--ink);
  outline:none;cursor:pointer;border-radius:3px;transition:border-color .18s,box-shadow .18s;
}
.ori-select:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(184,146,42,.12)}
.ori-select:hover:not(:focus){border-color:#A89060}

/* ── Grilles ── */
.ori-r2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.ori-r3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}

/* ── Boutons ── */
.ori-btn{cursor:pointer;border:1px solid var(--border-mid);background:var(--surface);color:var(--ink2);padding:6px 12px;font-size:12px;transition:all .15s;font-family:"DM Sans",sans-serif;border-radius:3px}
.ori-btn:hover{border-color:var(--gold);color:var(--gold);background:var(--gold-pale)}
.ori-btn-p{background:var(--gold);color:#fff;border-color:var(--gold);font-weight:500}
.ori-btn-p:hover{background:var(--gold-h);border-color:var(--gold-h);color:#fff}
.ori-btn-sm{padding:3px 8px;font-size:11px}
.ori-btn-clr{padding:4px 11px;font-size:11px;border:1px solid var(--border-mid);background:var(--surface);color:var(--muted);cursor:pointer;font-family:"DM Sans",sans-serif;letter-spacing:.04em;transition:all .15s;white-space:nowrap;border-radius:3px}
.ori-btn-clr:hover{border-color:#E85D5D;color:#c03030;background:#fff5f5}

/* ── Note / alerte ── */
.ori-note{background:#FFF9EE;border:1px solid var(--gold-bd);border-left:3px solid var(--gold);padding:.45rem .875rem;font-size:11.5px;color:var(--ink2);margin:.5rem 0;border-radius:0 3px 3px 0}

/* ── Verdicts ── */
.ori-vok  {background:#f4fbf6;border:1px solid #4CAF7C;border-radius:3px;padding:.625rem .875rem;margin:.5rem 0;font-size:13px}
.ori-vwarn{background:#fffbf0;border:1px solid #E8B84B;border-radius:3px;padding:.625rem .875rem;margin:.5rem 0;font-size:13px}
.ori-verr {background:#fff5f5;border:1px solid #E85D5D;border-radius:3px;padding:.625rem .875rem;margin:.5rem 0;font-size:13px}
.ori-vinf {background:#f0f6ff;border:1px solid #5B8FD4;border-radius:3px;padding:.625rem .875rem;margin:.5rem 0;font-size:13px}

/* ── Jauge ── */
.ori-gauge{height:8px;background:var(--bg2);border:1px solid var(--border);position:relative;overflow:hidden;margin:.35rem 0;border-radius:4px}
.ori-gfill{height:100%;transition:width .4s,background .4s;border-radius:4px}
.ori-gseuil{position:absolute;top:-2px;width:2px;height:12px;background:var(--ink2);opacity:.5;transform:translateX(-50%)}

/* ── Zone matières ── */
.ori-mats-box{border:1px solid var(--border-mid);background:var(--surface);border-radius:3px;margin-top:4px}
.ori-mrow{display:flex;align-items:center;gap:5px;padding:5px 6px;border-bottom:1px solid var(--bg2)}
.ori-mrow:last-child{border:none}
.ori-mrow .ori-input,.ori-mrow .ori-select{border-color:var(--border);border-radius:2px}
.ori-mrow .ori-input:focus,.ori-mrow .ori-select:focus{border-color:var(--gold);box-shadow:none}

/* ── Zone cumul diagonal ── */
.ori-cumul-box{border:1px solid var(--border-mid);background:var(--bg2);padding:.5rem .75rem;margin-top:4px;border-radius:3px}
.ori-cumul-title{font-size:10px;color:var(--muted);letter-spacing:.08em;font-weight:500;text-transform:uppercase;margin-bottom:.375rem;font-family:"JetBrains Mono",monospace}
.ori-cw{display:flex;flex-wrap:wrap;gap:4px}
.ori-cbtn{padding:3px 9px;font-size:11px;border:1px solid var(--border-mid);cursor:pointer;background:var(--surface);color:var(--mid);font-family:"DM Sans",sans-serif;transition:all .15s;border-radius:3px}
.ori-cbtn:hover{border-color:var(--gold);color:var(--gold)}
.ori-cbtn.on{background:var(--gold);color:#fff;border-color:var(--gold);font-weight:500}

/* ── Badges statut ── */
.ori-bok  {display:inline-flex;align-items:center;font-size:10px;padding:2px 7px;background:#f4fbf6;color:#1a6a38;border:1px solid #4CAF7C;border-radius:3px;font-weight:500}
.ori-berr {display:inline-flex;align-items:center;font-size:10px;padding:2px 7px;background:#fff5f5;color:#a03030;border:1px solid #E85D5D;border-radius:3px;font-weight:500}
.ori-bwarn{display:inline-flex;align-items:center;font-size:10px;padding:2px 7px;background:#fffbf0;color:#7a5000;border:1px solid #E8B84B;border-radius:3px;font-weight:500}
.ori-bgold{display:inline-flex;align-items:center;font-size:10px;padding:2px 7px;background:var(--gold-pale);color:var(--gold);border:1px solid var(--gold-bd);border-radius:3px;font-weight:500}
.ori-bgr  {display:inline-flex;align-items:center;font-size:10px;padding:2px 7px;background:var(--bg2);color:var(--muted);border:1px solid var(--border);border-radius:3px}

/* ── Portefeuille ── */
.ori-prow{display:flex;align-items:center;gap:7px;padding:.4rem .875rem;border-bottom:1px solid var(--bg2);cursor:pointer;background:var(--surface);font-size:12px}
.ori-prow:hover,.ori-prow.sel{background:var(--gold-pale)}

/* ── Onglets ── */
.ori-tabs{display:flex;border-bottom:1px solid var(--border);background:var(--bg2)}
.ori-tab{padding:8px 15px;cursor:pointer;font-size:12px;color:var(--muted);border-bottom:2px solid transparent;margin-bottom:-1px;transition:all .15s;white-space:nowrap;letter-spacing:.04em}
.ori-tab.active{color:var(--ink);border-bottom-color:var(--gold);font-weight:500;background:var(--surface)}
.ori-tab:hover:not(.active){background:var(--gold-pale);color:var(--ink2)}
.ori-pane{display:none;padding:.875rem 1rem}.ori-pane.active{display:block}

/* ── Référentiel — filtres groupes ── */
.ori-gtags{display:flex;gap:6px;padding:.5rem 1rem .375rem;border-bottom:1px solid var(--border);flex-wrap:wrap;background:var(--bg2)}
.ori-gtag{font-size:11px;padding:3px 11px;cursor:pointer;border:1px solid var(--border-mid);background:var(--surface);color:var(--mid);font-family:"DM Sans",sans-serif;transition:all .15s;letter-spacing:.04em;border-radius:3px}
.ori-gtag:hover{border-color:var(--gold);color:var(--gold)}
.ori-gtag.on{background:var(--gold);color:#fff;border-color:var(--gold);font-weight:500}

/* ── Texte référentiel ── */
.ori-dtxt{height:380px;overflow-y:auto;padding:.875rem 1rem;font-size:13px;line-height:1.85;color:var(--mid);white-space:pre-wrap;border-top:1px solid var(--border);background:var(--surface)}

/* ── Guide étapes ── */
.ori-gstep{display:flex;gap:.625rem;padding:.5rem 0;border-bottom:1px solid var(--bg2)}
.ori-gstep:last-child{border:none}
.ori-gnum{
  width:22px;height:22px;min-width:22px;
  background:var(--gold-pale);color:var(--gold);
  border:1px solid var(--gold-bd);
  display:flex;align-items:center;justify-content:center;
  font-size:11px;font-weight:700;border-radius:50%;
}
.ori-gbody{font-size:12px;color:var(--muted);line-height:1.6}
.ori-stat{font-size:11px;color:var(--muted);font-style:italic}

/* ── Détail code NC8 ── */
.ori-detail-box{margin-top:.625rem;padding:.75rem 1rem;background:var(--gold-pale);border:1px solid var(--gold-bd);border-radius:4px}
.ori-detail-code{font-size:22px;font-weight:400;letter-spacing:.06em;color:var(--ink);margin-bottom:.25rem;font-family:"DM Serif Display",serif}
.ori-detail-lib{font-size:13px;line-height:1.65;color:var(--mid)}
.ori-detail-meta{display:flex;gap:6px;margin-top:.5rem;flex-wrap:wrap}
.ori-meta-tag{font-size:10px;padding:3px 9px;background:var(--surface);border:1px solid var(--border-mid);color:var(--muted);border-radius:3px;font-family:"JetBrains Mono",monospace}

/* ── Divers ── */
.ori-cnt{font-size:11px;color:var(--muted);white-space:nowrap;min-width:62px;text-align:right;font-family:"JetBrains Mono",monospace}
.ori-zone-label{font-size:10px;letter-spacing:.09em;font-weight:500;color:var(--muted);text-transform:uppercase;font-family:"JetBrains Mono",monospace}
.ori-loading{text-align:center;padding:1.5rem;font-size:12px;color:var(--muted);font-family:"JetBrains Mono",monospace}

/* ── Footer ── */
footer{border-top:1px solid var(--border);padding:1.25rem 2rem;text-align:center;font-family:"JetBrains Mono",monospace;font-size:10px;color:var(--muted);letter-spacing:.07em;background:var(--surface)}

@media(max-width:900px){.ori-layout{grid-template-columns:1fr}}
@media(max-width:600px){.mod-bar{padding:0 1rem}.mod-wrap{padding:1.25rem 1rem 3rem}}
`;

const guideSteps: [string, string][] = [
  ['Position SH (6 chiffres)', "Saisissez le code du Système Harmonisé. Le secteur se détecte automatiquement. Ex : 870321 → Automobile ch.87."],
  ['Prix départ usine', "Valeur totale du produit sorti d'usine, hors transport et assurance. C'est la base de calcul du pourcentage de matières non originaires."],
  ['Matières et composants', "Ajoutez chaque intrant avec son pays d'origine et sa valeur. Le statut (originaire / non originaire) est calculé automatiquement."],
  ['Cumul diagonal', "Activez les pays PEM dont vous utilisez les matières. Exception : l'Algérie n'est pas éligible au cumul diagonal avec le Maroc."],
  ['Verdict en temps réel', "La jauge affiche votre % non originaires vs le seuil. Vert = conforme, orange = zone limite (± 5 %), rouge = non conforme."],
  ['Simulateur what-if', "Après enregistrement, l'onglet What-if teste l'impact d'un changement de fournisseur sur votre verdict d'origine."],
];

export default function OrigineAlecaPage() {
  const [tariff,    setTariff]    = useState<TariffEntry[]>([]);
  const [tQuery,    setTQuery]    = useState('');
  const [tFiltered, setTFiltered] = useState<TariffEntry[]>([]);
  const [tSelected, setTSelected] = useState<TariffEntry | null>(null);
  const [tLoading,  setTLoading]  = useState(true);

  useEffect(() => {
    fetch('/tariff-ue.json')
      .then(r => r.json())
      .then((data: TariffEntry[]) => {
        setTariff(data);
        setTFiltered(data);
        setTLoading(false);
      })
      .catch(() => setTLoading(false));
  }, []);

  const handleSearch = (q: string) => {
    setTQuery(q);
    setTSelected(null);
    if (!q.trim()) { setTFiltered(tariff); return; }
    const lq = q.trim().toLowerCase();
    setTFiltered(tariff.filter(d => d.c.includes(lq) || d.l.toLowerCase().includes(lq)));
  };

  const handleClear = () => { setTQuery(''); setTFiltered(tariff); setTSelected(null); };

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    if (!code) { setTSelected(null); return; }
    setTSelected(tariff.find(d => d.c === code) || null);
  };

  const trunc = (l: string, max = 75) => l.length > max ? l.slice(0, max) + '…' : l;

  return (
    <>
      <Head>
        <title>Origine ALECA / UE — Transit-IA</title>
        <meta name="description" content="Simulateur d'origine préférentielle ALECA/PEM 2025 — Tarif UE NC8 — Accord Maroc-UE." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=JetBrains+Mono:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>

      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* ── Barre minimale ── */}
      <nav className="mod-bar">
        <a className="mod-back" href="/">← Accueil</a>
        <span className="mod-bar-title">Origine ALECA / UE</span>
        <span className="mod-bar-badge">ORI · PEM 2025</span>
      </nav>

      <div className="mod-wrap">

        {/* ── Hero ── */}
        <div className="mod-hero">
          <h1>Simulateur d'origine <em>/ UE</em></h1>
          <p>Accord Maroc–Union Européenne · Convention PEM modernisée (en vigueur depuis le 1er janvier 2025) · Tarif UE — 9 916 codes NC8</p>
        </div>

        <div className="ori-layout">

          {/* ── VOLET GAUCHE ── */}
          <div className="ori-col">

            {/* Calculateur */}
            <div className="ori-panel">
              <div className="ori-ph">
                <span className="ori-pt">Calculateur d'origine préférentielle ALECA</span>
                <span className="ori-badge">PEM 2025</span>
              </div>
              <div className="ori-tabs">
                <div className="ori-tab active" onClick={() => (window as any).sw?.(0)}>Calcul</div>
                <div className="ori-tab"         onClick={() => (window as any).sw?.(1)}>Portefeuille</div>
                <div className="ori-tab"         onClick={() => (window as any).sw?.(2)}>What-if</div>
              </div>

              {/* Pane 0 : Calcul */}
              <div className="ori-pane active" id="cp0">
                <div className="ori-r3">
                  <div>
                    <label className="ori-label">Position SH</label>
                    <input id="cSh" className="ori-input" maxLength={6} placeholder="870321"
                      onInput={(e) => (window as any).onSH?.((e.target as HTMLInputElement).value)} />
                  </div>
                  <div>
                    <label className="ori-label">Secteur</label>
                    <select id="cSec" className="ori-select" onChange={() => (window as any).onSC?.()}>
                      <option value="industrie">Industrie (25–96)</option>
                      <option value="textile">Textile (50–63)</option>
                      <option value="automobile">Automobile (87)</option>
                      <option value="aeronautique">Aéro (88)</option>
                      <option value="agro_brut">Agro brut (01–15)</option>
                      <option value="agro_transforme">Agro transf. (16–24)</option>
                    </select>
                  </div>
                  <div>
                    <label className="ori-label">Direction</label>
                    <select id="cDir" className="ori-select">
                      <option value="export_ma_ue">Export MA → UE</option>
                      <option value="import_ue_ma">Import UE → MA</option>
                      <option value="les_deux">Les deux</option>
                    </select>
                  </div>
                </div>
                <label className="ori-label">Description du produit</label>
                <input id="cDesc" className="ori-input" placeholder="Ex: câblage automobile assemblé au Maroc"
                  onInput={() => (window as any).calc?.()} />
                <div className="ori-r2">
                  <div>
                    <label className="ori-label">Prix départ usine</label>
                    <input type="number" id="cPrix" className="ori-input" placeholder="10000"
                      onInput={() => (window as any).calc?.()} />
                  </div>
                  <div>
                    <label className="ori-label">Devise</label>
                    <select id="cDev" className="ori-select">
                      <option>EUR</option><option>MAD</option><option>USD</option>
                    </select>
                  </div>
                </div>
                <div id="cNote" />
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'.75rem', marginBottom:'4px' }}>
                  <span className="ori-zone-label">Matières et composants</span>
                  <button className="ori-btn ori-btn-sm" onClick={() => (window as any).addM?.()}>+ Ajouter</button>
                </div>
                <div className="ori-mats-box"><div id="cMats" /></div>
                <div className="ori-cumul-box" style={{ marginTop:'.625rem' }}>
                  <div className="ori-cumul-title">Cumul diagonal — pays PEM activés</div>
                  <div className="ori-cw" id="cCumul" />
                </div>
                <div id="cRes" />
                <div style={{ display:'flex', gap:'6px', marginTop:'.625rem' }}>
                  <button className="ori-btn ori-btn-p ori-btn-sm" onClick={() => (window as any).csave?.()}>Enregistrer</button>
                  <button className="ori-btn ori-btn-sm"           onClick={() => (window as any).creset?.()}>Nouveau</button>
                </div>
              </div>

              {/* Pane 1 : Portefeuille */}
              <div className="ori-pane" id="cp1">
                <div id="pStats" style={{ display:'flex', gap:'5px', marginBottom:'.5rem' }} />
                <div id="pList" />
                <button className="ori-btn ori-btn-p ori-btn-sm" style={{ marginTop:'.5rem' }}
                  onClick={() => { (window as any).sw?.(0); (window as any).creset?.(); }}>
                  + Nouveau produit
                </button>
              </div>

              {/* Pane 2 : What-if */}
              <div className="ori-pane" id="cp2"><div id="wiCont" /></div>
            </div>

            {/* Guide */}
            <div className="ori-panel">
              <div className="ori-ph"><span className="ori-pt">Guide d'utilisation — étape par étape</span></div>
              <div className="ori-body">
                {guideSteps.map(([title, body], i) => (
                  <div className="ori-gstep" key={i}>
                    <div className="ori-gnum">{i + 1}</div>
                    <div className="ori-gbody">
                      <strong style={{ color:'var(--ink)', fontWeight:500 }}>{title}</strong> — {body}
                    </div>
                  </div>
                ))}
                <div className="ori-note" style={{ marginTop:'.375rem' }}>
                  Seuils : Automobile 40 % · Aéro 40 % · Agro transformé 45 % · Industrie 40 % · Textile : double transformation (pas de seuil %)
                </div>
              </div>
            </div>
          </div>

          {/* ── VOLET DROIT ── */}
          <div className="ori-col">

            {/* Module Tarif UE */}
            <div className="ori-panel">
              <div className="ori-ph">
                <span className="ori-pt">Tarif de l'Union Européenne</span>
                <span className="ori-badge">NC8 — {tariff.length > 0 ? tariff.length.toLocaleString('fr-FR') : '9 916'} codes</span>
              </div>
              <div className="ori-body">
                <label className="ori-label">Cherchez par code SH ou mot clé</label>
                <div style={{ display:'flex', gap:'7px', alignItems:'center', marginBottom:'.625rem' }}>
                  <input
                    className="ori-input" style={{ flex:1 }} type="text" value={tQuery}
                    placeholder="Ex: 870321 ou véhicule ou cuivre…"
                    onChange={e => handleSearch(e.target.value)}
                  />
                  {tQuery && (
                    <button className="ori-btn-clr" onClick={handleClear} title="Remettre à zéro">
                      ✕ Effacer
                    </button>
                  )}
                  <span className="ori-cnt">
                    {tLoading ? 'Chargement…' : `${tFiltered.length.toLocaleString('fr-FR')} code${tFiltered.length > 1 ? 's' : ''}`}
                  </span>
                </div>

                <label className="ori-label">Résultats — sélectionnez un code pour voir sa définition complète</label>
                {tLoading ? (
                  <div className="ori-loading">Chargement des 9 916 codes NC8…</div>
                ) : tFiltered.length === 0 ? (
                  <div className="ori-loading" style={{ color:'#E85D5D' }}>Aucun résultat pour « {tQuery} »</div>
                ) : (
                  <select className="ori-select" onChange={handleSelect} value={tSelected?.c || ''}>
                    <option value="">— sélectionner un code —</option>
                    {tFiltered.slice(0, 500).map(d => (
                      <option key={d.c} value={d.c}>{d.c} — {trunc(d.l)}</option>
                    ))}
                    {tFiltered.length > 500 && (
                      <option disabled>… et {(tFiltered.length - 500).toLocaleString('fr-FR')} résultats supplémentaires — affinez la recherche</option>
                    )}
                  </select>
                )}

                {tSelected && (
                  <div className="ori-detail-box">
                    <div className="ori-detail-code">{tSelected.c}</div>
                    <div className="ori-detail-lib">{tSelected.l}</div>
                    <div className="ori-detail-meta">
                      <span className="ori-meta-tag">Chapitre SH {tSelected.c.slice(0, 2)}</span>
                      <span className="ori-meta-tag">Position {tSelected.c.slice(0, 4)}</span>
                      <span className="ori-meta-tag">Code NC8 : {tSelected.c}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Référentiel ALECA */}
            <div className="ori-panel">
              <div className="ori-ph">
                <span className="ori-pt">Référentiel — Règles d'origine ALECA</span>
                <span className="ori-badge">17 sections</span>
              </div>
              <div className="ori-gtags">
                {['Intro','Analyse','Sectoriel'].map(g => (
                  <button key={g} id={`atag-${g}`} className="ori-gtag on"
                    onClick={e => (window as any).fgTag?.(g, e.currentTarget)}>
                    {g}
                  </button>
                ))}
              </div>
              <div style={{ padding:'.5rem 1rem .25rem' }}>
                <select id="aSel" className="ori-select"
                  onChange={e => (window as any).showAlecaS?.(parseInt(e.target.value) || 0)} />
              </div>
              <div className="ori-dtxt" id="aTxt">Sélectionnez une section dans la liste déroulante.</div>
            </div>

          </div>
        </div>

      </div>

      <footer>Transit-IA — Module ORI · Origine ALECA / UE · Convention PEM 2025 · Tarif NC8 UE</footer>

      <Script src="/aleca-calc.js" strategy="afterInteractive" />
    </>
  );
}

