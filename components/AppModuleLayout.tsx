// components/AppModuleLayout.tsx
// Copie indépendante de components/ModuleLayout.tsx, réservée à l'espace
// mobile /app. Seule différence : le bouton de navigation renvoie vers
// /app (le menu de l'app) au lieu de / (la page d'accueil du site
// desktop) — l'utilisateur mobile ne doit jamais atterrir sur le site
// marketing complet.
// ⚠️ Toute évolution visuelle de ModuleLayout.tsx doit être répercutée ici
// manuellement si on veut que /app garde le même style que le desktop.

import Head from 'next/head'
import Link from 'next/link'

interface AppModuleLayoutProps {
  children:  React.ReactNode
  kicker?:   string
  title?:    string
  sub?:      string
}

const css = `
*,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --gold: #B8922A; --gold-h: #D4A940; --gold-pale: #FBF5E6;
  --gold-bd: rgba(184,146,42,.25); --gold-dim: rgba(184,146,42,.1);
  --ink: #1A1A18; --mid: #5A5A54; --muted: #8A8A82;
  --bg: #F9F8F4; --bg2: #F2F0EA; --surface: #FFFFFF;
  --border: #E4E2DA; --border-mid: #D0CEC4;
  --sh: 0 1px 4px rgba(26,26,24,.06);
  --inks: #3A3530; --inkm: #8A8078;
  --bl: #FBF5E6; --ba: #F5E4B0; --bm: #5A5A54; --bd: #B8922A;
  --rule: #E8DFC8;
}
body {
  background: var(--bg); color: var(--ink);
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 14px; line-height: 1.6;
  min-height: 100vh; -webkit-font-smoothing: antialiased;
}

/* ── Barre unique ── */
.mod-bar {
  position: sticky; top: 0; z-index: 100;
  background: rgba(249,248,244,.97); backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  padding: 0 2rem; height: 52px;
  display: flex; align-items: center; gap: 1.25rem;
  box-shadow: var(--sh);
}
.mod-back {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 11px; letter-spacing: .08em; text-transform: uppercase;
  color: var(--muted); border: 1px solid var(--border-mid);
  padding: 5px 14px; text-decoration: none;
  background: var(--surface); transition: all .18s;
  font-family: "JetBrains Mono", monospace; white-space: nowrap;
}
.mod-back:hover { border-color: var(--gold); color: var(--gold); background: var(--gold-pale); }
.mod-bar-kicker {
  font-family: "JetBrains Mono", monospace; font-size: 9.5px;
  letter-spacing: .12em; color: var(--gold); text-transform: uppercase;
}
.mod-bar-title {
  font-size: 13px; color: var(--mid); font-weight: 500;
  letter-spacing: .01em; white-space: nowrap; overflow: hidden;
  text-overflow: ellipsis; max-width: 480px;
}
.mod-bar-right {
  margin-left: auto; display: flex; align-items: center; gap: .75rem;
}
.mod-bar-badge {
  font-family: "JetBrains Mono", monospace; font-size: 9.5px;
  letter-spacing: .1em; color: var(--gold);
  padding: 2px 8px; background: var(--gold-dim);
  border: 1px solid var(--gold-bd);
}

/* ── Contenu ── */
.mod-wrap {
  max-width: 1100px; margin: 0 auto; padding: 2rem 2rem 4rem;
}
.mod-hero {
  padding-bottom: 1.5rem; border-bottom: 1px solid var(--border);
  margin-bottom: 1.75rem;
}
.mod-kicker {
  font-family: "JetBrains Mono", monospace; font-size: 11px;
  letter-spacing: .14em; color: var(--gold); text-transform: uppercase;
  margin-bottom: .4rem;
}
.mod-hero h1 {
  font-family: "DM Serif Display", Georgia, serif;
  font-size: clamp(24px, 4vw, 32px); font-weight: 400;
  letter-spacing: -.01em; line-height: 1.15; color: var(--ink);
}
.mod-hero h1 em { font-style: italic; color: var(--gold); }
.mod-hero p {
  margin-top: .5rem; font-size: 15px; color: var(--mid);
  line-height: 1.65; max-width: 720px;
}

/* ── Widgets réutilisables ── */
.info-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1rem; }
.istat {
  background: var(--surface); border: 1px solid var(--border);
  padding: 1rem 1.25rem; box-shadow: var(--sh);
}
.istat-n {
  font-family: "DM Serif Display", serif; font-size: 44px;
  font-weight: 400; color: var(--gold); line-height: 1; margin-bottom: .25rem;
}
.istat-l {
  font-size: 13px; color: var(--muted); line-height: 1.4;
  font-family: "JetBrains Mono", monospace; letter-spacing: .04em;
}
.tabs { display: flex; border-bottom: 1px solid var(--border); margin-bottom: 1.5rem; background: var(--bg2); }
.tab {
  padding: 10px 20px; cursor: pointer; font-size: 12.5px; color: var(--muted);
  border: none; border-bottom: 2px solid transparent; background: transparent;
  margin-bottom: -1px; transition: all .18s; white-space: nowrap;
  letter-spacing: .04em; font-family: "DM Sans", sans-serif;
}
.tab.active { color: var(--ink); border-bottom-color: var(--gold); font-weight: 500; background: var(--surface); }
.tab:hover:not(.active) { background: var(--gold-pale); color: var(--ink); }
.alert { padding: .875rem 1.25rem; font-size: 13px; margin-bottom: 1.25rem; border-left: 3px solid; line-height: 1.6; }
.alert-info  { background: var(--gold-pale); border-color: var(--gold); color: var(--inks); }
.alert-warn  { background: #FFFBEB; border-color: #F59E0B; color: #92400E; }
.alert-error { background: #FEF2F2; border-color: #EF4444; color: #991B1B; }
.form-group { margin-bottom: 1rem; }
.form-label {
  display: block; font-family: "JetBrains Mono", monospace; font-size: 10px;
  letter-spacing: .1em; text-transform: uppercase; color: var(--muted); margin-bottom: .4rem;
}
.form-select, .form-input, .search-input {
  width: 100%; padding: 13px 14px; border: 1px solid var(--border-mid);
  background: var(--surface); color: var(--ink);
  font-family: "DM Sans", sans-serif; font-size: 17px;
  min-height: 48px; border-radius: 6px;
  outline: none; transition: border-color .18s;
}
.form-select:focus, .form-input:focus, .search-input:focus {
  border-color: var(--gold); box-shadow: 0 0 0 3px rgba(184,146,42,.1);
}
.btn { padding: 13px 20px; font-size: 16px; letter-spacing: .04em; cursor: pointer; font-family: "DM Sans", sans-serif; transition: all .15s; border: 1px solid; min-height: 48px; border-radius: 6px; }
.btn-primary   { background: var(--gold); color: #fff; border-color: var(--gold); }
.btn-primary:hover { background: var(--gold-h); border-color: var(--gold-h); }
.btn-outline   { background: transparent; color: var(--ink); border-color: var(--border-mid); }
.btn-outline:hover { border-color: var(--gold); color: var(--gold); }

/* Tableau — défini ici (pas dans le globals.css desktop) pour rester
   totalement indépendant et adapté à la lecture mobile. */
table.data-table { width: 100%; border-collapse: collapse; margin-top: .75rem; }
table.data-table th {
  text-align: left; font-size: 11px; letter-spacing: .06em; text-transform: uppercase;
  color: var(--muted); padding: 10px 8px; border-bottom: 1px solid var(--border);
  font-family: "JetBrains Mono", monospace;
}
table.data-table td { padding: 14px 8px; font-size: 15px; border-bottom: 1px solid var(--border); color: var(--inks); }

/* ── Footer ── */
footer {
  border-top: 1px solid var(--border); padding: 1.25rem 2rem;
  text-align: center; font-family: "JetBrains Mono", monospace;
  font-size: 10px; color: var(--muted); letter-spacing: .07em;
  background: var(--surface); margin-top: 2rem;
}

@media (max-width: 700px) {
  .info-grid { grid-template-columns: 1fr 1fr; }
  .mod-bar   { padding: 0 1rem; }
  .mod-wrap  { padding: 1.25rem 1rem 3rem; }
  .tabs      { overflow-x: auto; }
  .mod-bar-title { display: none; }
}
`

export default function AppModuleLayout({ children, kicker, title, sub }: AppModuleLayoutProps) {
  return (
    <>
      <Head>
        <title>{title ? `${title} — Transit-eXPert` : 'Transit-eXPert'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=JetBrains+Mono:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>

      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* ── Barre minimale — renvoie vers /app, jamais vers le site desktop ── */}
      <nav className="mod-bar">
        <Link href="/app" className="mod-back">
          ← Menu
        </Link>
        {kicker && <span className="mod-bar-kicker">{kicker}</span>}
        {title  && <span className="mod-bar-title">{title}</span>}
      </nav>

      {/* ── Contenu pleine largeur — pas de sidebar ── */}
      <div className="mod-wrap">

        {/* Hero optionnel */}
        {(kicker || title || sub) && (
          <div className="mod-hero">
            {kicker && <div className="mod-kicker">{kicker}</div>}
            {title  && <h1>{title}</h1>}
            {sub    && <p>{sub}</p>}
          </div>
        )}

        {children}

      </div>
    </>
  )
}
