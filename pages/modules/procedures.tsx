// pages/modules/procedures.tsx
// Module PRO — Procédures Douanières — Transit-IA

import Head from 'next/head'
import { useState } from 'react'

const css = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --gold:#B8922A;--gold-h:#D4A940;--gold-pale:#FBF5E6;
  --gold-bd:rgba(184,146,42,.25);--gold-dim:rgba(184,146,42,.1);
  --ink:#1A1A18;--mid:#5A5A54;--muted:#8A8A82;
  --bg:#F9F8F4;--bg2:#F2F0EA;--surface:#FFFFFF;
  --border:#E4E2DA;--border-mid:#D0CEC4;
  --green:#1E7A4A;--green-bg:#EBF7EE;--green-bd:#B0DDB8;
  --blue:#1A3A9A;--blue-bg:#EEF4FE;--blue-bd:#B0C8F8;
  --amber:#8A5A10;--amber-bg:#FEF5E4;--amber-bd:#F0D080;
  --sh:0 1px 4px rgba(26,26,24,.06);
}
body{background:var(--bg);color:var(--ink);font-family:"DM Sans",sans-serif;font-size:14px;line-height:1.6;min-height:100vh;-webkit-font-smoothing:antialiased}

/* ── Barre minimale ── */
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
.mod-bar-title{font-size:12px;color:var(--mid);font-weight:500;letter-spacing:.02em}
.mod-bar-badge{
  font-family:"JetBrains Mono",monospace;font-size:9.5px;letter-spacing:.1em;
  color:var(--gold);padding:2px 8px;
  background:var(--gold-dim);border:1px solid var(--gold-bd);margin-left:auto;
}
.mod-wrap{max-width:1200px;margin:0 auto;padding:2rem 2rem 4rem}

/* ── Hero ── */
.mod-hero{padding-bottom:1.5rem;border-bottom:1px solid var(--border);margin-bottom:1.5rem}
.mod-kicker{font-family:"JetBrains Mono",monospace;font-size:10px;letter-spacing:.14em;color:var(--gold);text-transform:uppercase;margin-bottom:.5rem}
.mod-hero h1{font-family:"DM Serif Display",Georgia,serif;font-size:clamp(24px,3.5vw,36px);font-weight:400;letter-spacing:-.01em;line-height:1.1}
.mod-hero h1 em{font-style:italic;color:var(--gold)}
.mod-hero p{margin-top:.5rem;font-size:13px;color:var(--mid);line-height:1.65;max-width:640px}

/* ── Stats ── */
.info-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.5rem}
.istat{background:var(--surface);border:1px solid var(--border);padding:1rem 1.25rem;box-shadow:var(--sh)}
.istat-n{font-family:"DM Serif Display",serif;font-size:32px;font-weight:400;color:var(--gold);line-height:1;margin-bottom:.25rem}
.istat-l{font-size:11px;color:var(--muted);line-height:1.4;font-family:"JetBrains Mono",monospace;letter-spacing:.04em}

/* ── Lien guide ── */
.guide-banner{
  margin-bottom:1.5rem;padding:.875rem 1.25rem;
  background:var(--gold-pale);border:1px solid var(--gold-bd);
  display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.5rem;
}
.guide-banner-label{font-size:9.5px;letter-spacing:.12em;color:var(--muted);margin-bottom:.2rem;font-family:"JetBrains Mono",monospace;text-transform:uppercase}
.guide-banner-text{font-size:13px;color:var(--mid)}
.guide-banner-link{
  font-size:12px;color:var(--gold);font-weight:500;
  border:1px solid var(--gold-bd);padding:6px 16px;
  text-decoration:none;white-space:nowrap;transition:all .15s;background:var(--surface);
}
.guide-banner-link:hover{background:var(--gold);color:#fff;border-color:var(--gold)}

/* ── Recherche ── */
.search-bar{margin-bottom:1.25rem}
.search-input{
  width:100%;max-width:420px;padding:9px 14px;
  border:1px solid var(--border-mid);background:var(--surface);
  font-family:"DM Sans",sans-serif;font-size:13px;color:var(--ink);
  outline:none;transition:border-color .18s;
}
.search-input:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(184,146,42,.1)}
.search-input::placeholder{color:var(--muted)}

/* ── Section ── */
.section{background:var(--surface);border:1px solid var(--border);margin-bottom:1.5rem;box-shadow:var(--sh);overflow:hidden}
.section-title{
  font-family:"JetBrains Mono",monospace;font-size:10px;font-weight:700;
  letter-spacing:.14em;text-transform:uppercase;color:var(--muted);
  padding:.7rem 1.25rem;border-bottom:1px solid var(--border);background:var(--bg2);
}

/* ── Table ── */
.data-table{width:100%;border-collapse:collapse;font-size:13px}
.data-table th{
  font-family:"JetBrains Mono",monospace;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;
  color:var(--muted);text-align:left;padding:9px 1.25rem;
  border-bottom:1px solid var(--border);background:var(--bg2);
}
.data-table td{padding:10px 1.25rem;border-bottom:1px solid var(--bg2);color:var(--mid)}
.data-table tr:last-child td{border-bottom:none}
.data-table tbody tr:hover td{background:var(--gold-pale)}

/* ── Badges ── */
.badge{font-family:"JetBrains Mono",monospace;font-size:9px;padding:2px 8px;letter-spacing:.07em;border:1px solid;border-radius:100px;font-weight:500;white-space:nowrap}
.badge.bg{background:var(--green-bg);color:var(--green);border-color:var(--green-bd)}
.badge.ba{background:var(--amber-bg);color:var(--amber);border-color:var(--amber-bd)}
.badge.bb{background:var(--blue-bg);color:var(--blue);border-color:var(--blue-bd)}

/* ── Steps ── */
.steps{list-style:none;padding:1.25rem}
.step{display:flex;gap:.875rem;padding:.875rem 0;border-bottom:1px solid var(--bg2)}
.step:last-child{border:none}
.step-num{
  width:28px;height:28px;min-width:28px;
  background:var(--gold);color:#fff;
  display:flex;align-items:center;justify-content:center;
  font-size:12px;font-weight:700;border-radius:50%;flex-shrink:0;margin-top:2px;
}
.step-content{flex:1;font-size:13px;color:var(--mid);line-height:1.6}
.step-title{font-weight:600;color:var(--ink);margin-bottom:.2rem;font-size:13.5px}

/* ── Footer ── */
.mod-footer-link{margin-top:1.5rem;padding-top:1rem;border-top:1px solid var(--border);text-align:center}
footer{border-top:1px solid var(--border);padding:1.25rem 2rem;text-align:center;font-family:"JetBrains Mono",monospace;font-size:10px;color:var(--muted);letter-spacing:.07em;background:var(--surface);margin-top:2rem}

@media(max-width:700px){
  .info-grid{grid-template-columns:1fr 1fr}
  .data-table{font-size:12px}
  .mod-bar{padding:0 1rem}
  .mod-wrap{padding:1.25rem 1rem 3rem}
}
`

export default function Procedures() {
  const [q, setQ] = useState('')
  const data: [string, string, string, string, string, string][] = [
    ['ADII-001', "Dédouanement à l'importation", 'Mise à la consommation', '2–5 jours', 'Actif', 'bg'],
    ['ADII-002', 'Exportation définitive',        'Exportation',           '1–3 jours', 'Actif', 'bg'],
    ['ADII-003', 'Transit douanier national',      'Transit',               'Même jour', 'Actif', 'bg'],
    ['ADII-004', 'Admission temporaire',           'Régime économique',     '3–7 jours', 'Actif', 'bg'],
    ['ADII-005', 'Entrepôt de stockage',           'Régime suspensif',      '2–4 jours', 'Actif', 'bg'],
    ['ADII-006', 'Perfectionnement actif',         'Régime économique',     '5–10 jours','En révision','ba'],
    ['ADII-007', 'Zone franche (TFZ)',              'Zone franche',          '1–2 jours', 'Actif', 'bg'],
    ['ADII-008', 'Dédouanement simplifié OEA',    'Opérateur économique agréé','4h',   'OEA uniquement','bb'],
  ]
  const rows = data.filter(r => r.join(' ').toLowerCase().includes(q.toLowerCase()))

  return (
    <>
      <Head>
        <title>Procédures Douanières — Transit-IA</title>
        <meta name="description" content="Guide complet des procédures douanières marocaines — ADII — Transit-IA" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=JetBrains+Mono:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>

      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* ── Barre minimale ── */}
      <nav className="mod-bar">
        <a className="mod-back" href="/">← Accueil</a>
        <span className="mod-bar-title">Procédures Douanières</span>
        <span className="mod-bar-badge">PRO · MODULE 01</span>
      </nav>

      <div className="mod-wrap">

        {/* ── Hero ── */}
        <div className="mod-hero">
          <div className="mod-kicker">Module PRO — Procédures Douanières</div>
          <h1>Procédures <em>Expliquées</em></h1>
          <p>Guide complet des procédures douanières marocaines, en langage clair pour transitaires, importateurs et exportateurs.</p>
        </div>

        {/* ── Lien guide approfondi ── */}
        <div className="guide-banner">
          <div>
            <div className="guide-banner-label">Guide approfondi</div>
            <span className="guide-banner-text">22 procédures détaillées avec codes régimes DUM, checklists et conseils IA</span>
          </div>
          <a href="/modules/procedures-process" className="guide-banner-link">
            Accéder aux régimes détaillés →
          </a>
        </div>

        {/* ── Stats ── */}
        <div className="info-grid">
          <div className="istat">
            <div className="istat-n">124</div>
            <div className="istat-l">Procédures documentées</div>
          </div>
          <div className="istat">
            <div className="istat-n">38</div>
            <div className="istat-l">Formulaires disponibles</div>
          </div>
          <div className="istat">
            <div className="istat-n">2025</div>
            <div className="istat-l">Dernière mise à jour ADII</div>
          </div>
        </div>

        {/* ── Recherche ── */}
        <div className="search-bar">
          <input
            className="search-input"
            placeholder="Rechercher une procédure…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>

        {/* ── Tableau procédures ── */}
        <div className="section">
          <div className="section-title">Procédures principales</div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Procédure</th>
                <th>Régime</th>
                <th>Délai moyen</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([ref, proc, reg, del, stat, cls]) => (
                <tr key={ref}>
                  <td style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 12 }}>{ref}</td>
                  <td style={{ fontWeight: 500, color: 'var(--ink)' }}>{proc}</td>
                  <td>{reg}</td>
                  <td style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 12 }}>{del}</td>
                  <td><span className={`badge ${cls}`}>{stat}</span></td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign:'center', padding:'2rem', color:'var(--muted)', fontStyle:'italic' }}>Aucune procédure trouvée</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Étapes dédouanement import ── */}
        <div className="section">
          <div className="section-title">Étapes — dédouanement à l'importation</div>
          <ul className="steps">
            {([
              ['Dépôt de la déclaration DUM',      "Transmission électronique via BADR. Délai : J+0."],
              ['Vérification documentaire',          "Facture, LTA/connaissement, certificat d'origine, liste de colisage. Délai : J+1."],
              ['Liquidation des droits et taxes',    "Calcul droits de douane, TVA, TIC selon le code SH. Paiement en ligne ou chèque certifié."],
              ['Visite et vérification physique',    "Sur circuit rouge uniquement. Inspection des marchandises, contrôle de conformité."],
              ['Bon à enlever (BAE)',                "Délivrance après apurement. Enlèvement des marchandises du port ou de l'aéroport."],
            ] as [string,string][]).map(([t, d], i) => (
              <li key={i} className="step">
                <div className="step-num">{i + 1}</div>
                <div className="step-content">
                  <div className="step-title">{t}</div>
                  {d}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Footer lien ── */}
        <div className="mod-footer-link">
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
            Pour les régimes économiques avancés (ATPA, AT, TSD, EIF, EPP, ZAI…) →{' '}
          </span>
          <a href="/modules/procedures-process" style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 500 }}>
            Consulter le guide complet des régimes
          </a>
        </div>

      </div>

      <footer>Transit-IA — Module PRO · Procédures Douanières ADII · Mise à jour 2025</footer>
    </>
  )
}

