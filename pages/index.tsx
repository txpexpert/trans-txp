import Head from 'next/head';

// pages/index.tsx — Transit-IA / TXP, hero page
// Version fusionnée : agencement visuel "Scanner-first" (demo-hero-v2)
//   + authentification, session utilisateur et logique essentielle du site en production.

const css = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --ink:#0A0A0A;--ink2:#3A3530;--ink3:#8A8078;
  --gold:#C9A84C;--gold2:#E8C97A;--gold3:#F5E4B0;--gold4:#FBF5E6;
  --white:#FDFCF8;--border:#E8DFC8;--border2:#D4C8A8;
  --up:#4CAF7C;--dn:#E85D5D;
  --pain:#B5482E;--pain-bg:#FBEDE8;--pain-brd:#E7C4B6;
  --gain:#1A5C2A;--gain-bg:#EEF5EA;--gain-brd:#C7DCC0;
  --neutral:#8A6D1E;--neutral-bg:#FBF5E6;--neutral-brd:#E3D3A0;
  /* Accent "vivant" — un seul ton froid, saturé, réservé aux éléments actifs/temps-réel
     (badges LIVE, jauge, curseurs). Base crème + or restent la fondation calme ;
     ce cyan-signal est l'unique éclat à haut contraste, pour éviter l'effet "tout est criard". */
  --live:#0FB9C4;--live-glow:rgba(15,185,196,.35);--live-bg:#E4F7F8;
}
body{font-family:'DM Sans',sans-serif;background:var(--white);color:var(--ink);min-height:100vh;overflow-x:hidden;line-height:1.5;position:relative}
/* Texture tactile discrète (grain) — casse la platitude d'un aplat crème pur, sans imagerie IA générique */
body::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:1;opacity:.035;mix-blend-mode:multiply;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
a{text-decoration:none;color:inherit}
button{cursor:pointer;font-family:'DM Sans',sans-serif;border:none;background:none}
.demo-flag{position:fixed;bottom:0;left:0;right:0;background:#0A0A0A;color:#C9A84C;font-size:11px;letter-spacing:.1em;padding:6px 1rem;text-align:center;z-index:9999;border-top:1px solid rgba(201,168,76,.3)}
.reveal{opacity:1;transform:none;transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1)}
.reveal.in{opacity:1;transform:translateY(0)}
@media(prefers-reduced-motion:reduce){.reveal{opacity:1!important;transform:none!important;transition:none!important}}

/* ---------- ticker + header (repris à l'identique de l'ancienne hero) ---------- */
.ticker-wrap{background:var(--ink);overflow:hidden;height:34px;display:flex;align-items:center}
.ticker-track{display:flex;animation:ticker 50s linear infinite;white-space:nowrap}
.ticker-track:hover{animation-play-state:paused}
.t-item{display:flex;align-items:center;gap:10px;padding:0 28px;border-right:1px solid rgba(201,168,76,.15)}
.t-label{font-size:10px;letter-spacing:.14em;color:var(--ink3)}
.t-val{font-size:11px;font-weight:500;color:var(--gold2)}
.t-chg{font-size:10px}.up{color:var(--up)}.dn{color:var(--dn)}
@keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
header{background:var(--white);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:200}
#diagnostic,#modules,#barometre,#kits,#modules-plus,#strategies,#copilote{scroll-margin-top:95px}
html{scroll-behavior:smooth}
.hdr{max-width:1280px;margin:0 auto;padding:0 2rem;display:flex;align-items:center;height:72px;gap:1.5rem}
.logo{font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:600;letter-spacing:-.02em;flex-shrink:0}
.logo em{color:var(--gold);font-style:normal}
.logo sup{font-size:10px;font-weight:300;color:var(--ink3);letter-spacing:.06em;vertical-align:super}
.hdr-nav{display:flex;gap:.5rem;margin-left:1rem;font-size:12.5px;font-weight:700;letter-spacing:-.005em;color:var(--ink);white-space:nowrap;flex:1 1 auto;min-width:0;overflow:hidden}
.hdr-nav a{position:relative;padding:6px 12px;border-radius:20px;transition:all .16s ease}
.hdr-nav a:hover{transform:translateY(-1px)}
.hdr-nav a:nth-child(1){background:#EEF3FC;color:#3E5A9E}
.hdr-nav a:nth-child(1):hover{background:#E1EAFA}
.hdr-nav a:nth-child(2){background:#FBEFF6;color:#9C4373}
.hdr-nav a:nth-child(2):hover{background:#F7E1EF}
.hdr-nav a:nth-child(3){background:#EEFAF4;color:#227A54}
.hdr-nav a:nth-child(3):hover{background:#DFF5EA}
.hdr-nav a:nth-child(4){background:#FDF3E7;color:#A66A1E}
.hdr-nav a:nth-child(4):hover{background:#FBE8D0}
.hdr-nav a:nth-child(5){background:#FBEAE3;color:#A6512E}
.hdr-nav a:nth-child(5):hover{background:#F7DDD2}
.hdr-nav a:nth-child(6){background:#F0F0FB;color:#5B4CC4}
.hdr-nav a:nth-child(6):hover{background:#E4E3F7}
.hdr-nav a:nth-child(7){background:#E9F7F8;color:#0A8890}
.hdr-nav a:nth-child(7):hover{background:#D9F1F3}
.hdr-actions{display:flex;flex-direction:column;align-items:flex-end;justify-content:center;gap:4px;margin-left:auto;flex-shrink:0}
.btn-in{padding:5px 14px;font-size:10.5px;letter-spacing:.06em;color:var(--ink2);border:1px solid var(--border2);transition:all .15s}
.btn-in:hover{border-color:var(--gold);color:var(--gold)}
.btn-sub{padding:5px 16px;font-size:10.5px;letter-spacing:.06em;background:var(--ink);color:var(--gold2);transition:all .15s}
.btn-sub:hover{background:var(--gold);color:var(--ink)}

/* ---------- HERO : nouvelle philosophie diagnostic-first ---------- */
.hero{max-width:1280px;margin:0 auto;padding:3.5rem 2rem 3rem;display:grid;grid-template-columns:1.1fr 0.9fr;gap:3.5rem;align-items:center}
.hero-eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:10px;letter-spacing:.16em;color:var(--live);background:var(--live-bg);border:1px solid rgba(15,185,196,.3);padding:5px 12px;margin-bottom:1.25rem}
.hero-eyebrow .dot{width:6px;height:6px;border-radius:50%;background:var(--live);animation:pulse 2s infinite;box-shadow:0 0 0 3px var(--live-glow)}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
.hero h1{font-family:'Cormorant Garamond',serif;font-size:38px;font-weight:400;line-height:1.16;letter-spacing:-.02em;color:var(--ink)}
.hero h1 strong{font-weight:600;color:var(--pain)}
.cta-primary{transition:transform .18s ease,box-shadow .18s ease,background .18s ease}
.cta-primary:hover{transform:translateY(-1px);box-shadow:0 8px 20px -6px rgba(0,0,0,.35)}
.hero p.lead{margin-top:1.1rem;font-size:15.5px;color:var(--ink2);line-height:1.7;max-width:480px}
.hero-cta-row{display:flex;align-items:center;gap:1.25rem;margin-top:1.75rem;flex-wrap:wrap}
.cta-primary{padding:14px 26px;background:var(--ink);color:var(--gold2);font-size:12px;letter-spacing:.09em;font-weight:600;transition:all .18s;display:inline-flex;align-items:center;gap:8px}
.cta-primary:hover{background:var(--gold);color:var(--ink)}

/* ---------- Scanner interactif (élément signature) — dimensions réduites de moitié ---------- */
.scanner-card{background:var(--ink);position:relative;padding:1rem .95rem .9rem;overflow:hidden;border:1px solid var(--ink)}
.scanner-card::before{content:'';position:absolute;inset:0;background:
  radial-gradient(circle at 85% -10%, rgba(201,168,76,.16), transparent 55%),
  radial-gradient(circle at 8% 108%, rgba(15,185,196,.14), transparent 50%);
  pointer-events:none}
.scanner-seal{position:absolute;top:.65rem;right:.65rem;width:36px;height:36px;border:1.5px solid rgba(201,168,76,.4);border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:7px;letter-spacing:.05em;color:var(--gold2);text-align:center;line-height:1.15;transform:rotate(8deg)}
.scanner-title{font-size:9px;letter-spacing:.14em;color:var(--gold2);margin-bottom:.2rem}
.scanner-sub{font-size:10.5px;color:rgba(253,252,248,.55);margin-bottom:.75rem;max-width:210px;line-height:1.4}
.gauge-wrap{display:flex;flex-direction:column;align-items:center;margin-bottom:.75rem}
.gauge-score{font-family:'Cormorant Garamond',serif;font-size:34px;font-weight:600;color:var(--gold2);line-height:1;margin-top:-.5rem}
.gauge-score span{font-size:13px;color:rgba(253,252,248,.4);font-weight:400}
.gauge-verdict{font-size:10px;letter-spacing:.07em;margin-top:.25rem;padding:2px 10px;border-radius:2px}
.gauge-verdict.v-low{color:var(--gain);background:var(--gain-bg)}
.gauge-verdict.v-mid{color:#B8862A;background:#3a2f14}
.gauge-verdict.v-high{color:#f0a08c;background:rgba(181,72,46,.25)}
.scan-q{margin-bottom:.55rem}
.scan-q-label{font-size:10.5px;color:rgba(253,252,248,.7);margin-bottom:.3rem;line-height:1.35}
.scan-opts{display:flex;gap:4px;flex-wrap:wrap}
.scan-opt{padding:5px 9px;font-size:10px;color:rgba(253,252,248,.75);border:1px solid rgba(201,168,76,.25);transition:all .15s;background:rgba(255,255,255,.02)}
.scan-opt:hover{border-color:var(--gold);color:var(--gold2)}
.scan-opt.picked{background:var(--gold);color:var(--ink);border-color:var(--gold);font-weight:600}
.scanner-foot{margin-top:.75rem;padding-top:.6rem;border-top:1px solid rgba(201,168,76,.15)}
.scanner-cta{width:100%;padding:9px;background:var(--gold);color:var(--ink);font-size:10px;letter-spacing:.07em;font-weight:600;text-align:center;transition:all .15s;opacity:.4;pointer-events:none}
.scanner-cta.ready{opacity:1;pointer-events:auto;cursor:pointer}
.scanner-cta:hover.ready{background:var(--gold2)}

.capture-form{display:none;margin-top:.6rem;padding-top:.6rem;border-top:1px solid rgba(201,168,76,.15)}
.capture-form.open{display:block}
.capture-row{display:flex;gap:6px;margin-bottom:5px}
.capture-field{flex:1;display:flex;flex-direction:column;gap:3px}
.capture-field label{font-size:8.5px;letter-spacing:.06em;color:rgba(253,252,248,.45)}
.capture-field input{padding:6px 8px;font-size:11px;background:rgba(255,255,255,.04);border:1px solid rgba(201,168,76,.25);color:#FDFCF8;font-family:'DM Sans',sans-serif;outline:none;transition:border-color .15s}
.capture-field input::placeholder{color:rgba(253,252,248,.3)}
.capture-field input:focus{border-color:var(--gold)}
.capture-submit{width:100%;padding:8px;background:var(--gold);color:var(--ink);font-size:10.5px;letter-spacing:.07em;font-weight:600;margin-top:.25rem;transition:all .15s}
.capture-submit:hover{background:var(--gold2)}
.capture-submit:disabled{opacity:.5;pointer-events:none}
.capture-msg{margin-top:.5rem;font-size:10px;line-height:1.4;padding:8px 10px;display:none}
.capture-msg.show{display:block}
.capture-msg.ok{background:rgba(76,175,124,.12);color:#8FDDB4;border:1px solid rgba(76,175,124,.3)}
.capture-msg.err{background:rgba(232,93,93,.12);color:#f0a8a8;border:1px solid rgba(232,93,93,.3)}
.capture-msg.demo{background:rgba(15,185,196,.1);color:#7fe0e6;border:1px solid rgba(15,185,196,.3)}
.scanner-note{font-size:9px;color:rgba(253,252,248,.35);text-align:center;margin-top:.4rem;letter-spacing:.02em}

/* ---------- Section: Où en êtes-vous (tuiles réorganisées par valeur) ---------- */
.section{max-width:1280px;margin:0 auto;padding:3rem 2rem}
.section-hdr{margin-bottom:1.75rem;max-width:640px}
.section-eyebrow{font-size:10px;letter-spacing:.16em;color:var(--gold);margin-bottom:.5rem}
.section-title{font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:400;line-height:1.2}
.section-sub{font-size:13.5px;color:var(--ink3);margin-top:.6rem;line-height:1.65}

.clusters{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem}
.cluster{border:1px solid var(--border);display:flex;flex-direction:column}
.cluster-hdr{padding:1.1rem 1.25rem;display:flex;align-items:center;gap:.75rem;border-bottom:1px solid var(--border)}
.cluster-hdr.pain{background:var(--pain-bg)}
.cluster-hdr.gain{background:var(--gain-bg)}
.cluster-hdr.neutral{background:var(--gold4)}
.cluster-icon{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;background:var(--white);border:1px solid rgba(0,0,0,.08)}
.cluster-hdr.pain .cluster-icon{color:var(--pain)}
.cluster-hdr.gain .cluster-icon{color:var(--gain)}
.cluster-hdr.neutral .cluster-icon{color:var(--neutral)}
.cluster-name{font-size:16px;font-weight:700;color:var(--ink)}
.cluster-tag{font-size:11px;color:var(--ink3);margin-top:2px}
.cluster-list{flex:1;display:flex;flex-direction:column}
.cluster-link{padding:1.05rem 1.35rem;font-size:14px;font-weight:600;color:var(--ink2);border-bottom:3px solid var(--white);border-left:4px solid transparent;transition:all .15s ease;display:flex;justify-content:space-between;align-items:center;gap:.5rem;letter-spacing:-.005em}
.cluster-link:last-child{border-bottom:none}
.cluster-link:hover{padding-left:1.65rem;color:var(--ink)}
.cluster-link .arrow{opacity:.35;transition:all .15s;font-size:14px;font-weight:700}
.cluster-link:hover .arrow{opacity:1;transform:translateX(3px)}
.cluster-more{padding:.9rem 1.25rem;font-size:11.5px;font-weight:600;color:var(--ink3);background:var(--gold4);text-align:center;letter-spacing:.04em}

/* Teintes individuelles par tuile — intensité légère, une couleur distincte par ligne, non liée au cluster */
.cluster-link:nth-child(6n+1){background:#EEF3FC;border-left-color:#6E8FD4}
.cluster-link:nth-child(6n+1):hover{background:#E3EBFA}
.cluster-link:nth-child(6n+2){background:#FBEFF6;border-left-color:#C9679A}
.cluster-link:nth-child(6n+2):hover{background:#F7E3EF}
.cluster-link:nth-child(6n+3){background:#EEFAF4;border-left-color:#3FA57A}
.cluster-link:nth-child(6n+3):hover{background:#E1F5EB}
.cluster-link:nth-child(6n+4){background:#FDF3E7;border-left-color:#D6923E}
.cluster-link:nth-child(6n+4):hover{background:#FCEAD3}
.cluster-link:nth-child(6n+5){background:#F0F0FB;border-left-color:#8171C9}
.cluster-link:nth-child(6n+5):hover{background:#E5E4F7}
.cluster-link:nth-child(6n+6){background:#E9F7F8;border-left-color:#0FB9C4}
.cluster-link:nth-child(6n+6):hover{background:#DAF1F3}

/* ---------- Baromètre (autorité) — volet comprimé ---------- */
.barometre{background:var(--ink);color:var(--white);display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:1.25rem;padding:1.75rem;margin:1rem 2rem 0;max-width:1216px;margin-left:auto;margin-right:auto}
.barometre-eyebrow{font-size:9px;letter-spacing:.14em;color:var(--gold2);margin-bottom:.4rem}
.barometre h2{font-family:'Cormorant Garamond',serif;font-size:21px;font-weight:400;line-height:1.2;margin-bottom:.55rem}
.barometre h2 em{color:var(--gold2);font-style:normal;font-weight:600}
.barometre p{font-size:11.5px;color:rgba(253,252,248,.6);line-height:1.55;max-width:420px;margin-bottom:.85rem}
.barometre-cta{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border:1px solid var(--gold2);color:var(--gold2);font-size:10px;letter-spacing:.07em;transition:all .15s}
.barometre-cta:hover{background:var(--gold2);color:var(--ink)}
.barometre-stats{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:rgba(201,168,76,.2)}
.baro-stat{background:var(--ink);padding:.85rem;text-align:center}
.baro-stat-num{font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:600;color:var(--gold2);line-height:1}
.baro-stat-label{font-size:9px;color:rgba(253,252,248,.5);margin-top:.3rem;letter-spacing:.03em;line-height:1.3}

.cluster-hdr.strategic{background:#EFEDFB}
.cluster-hdr.strategic .cluster-icon{color:#5B4CC4}
.strategies-wrap .cluster{max-width:100%}
.strategies-wrap .cluster-list{display:grid;grid-template-columns:repeat(3,1fr)}
.strategies-wrap .cluster-link{border-left-width:4px;border-bottom:3px solid var(--white);border-right:1px solid var(--white)}
.strategies-wrap .cluster-link:nth-child(3n){border-right:none}

/* ---------- Kits Opérationnels (issus du document — packaging commercial) ---------- */
.kits{max-width:1280px;margin:0 auto;padding:1rem 2rem 3rem}
.kits-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1.25rem}
.kit-card{border:1px solid var(--border);background:var(--white);padding:1.5rem 1.35rem;transition:all .2s ease;position:relative}
.kit-card:hover{border-color:var(--live);box-shadow:0 10px 28px -12px rgba(15,185,196,.25);transform:translateY(-3px)}
.kit-num{font-family:'Cormorant Garamond',serif;font-size:13px;letter-spacing:.08em;color:var(--live);margin-bottom:.9rem;display:block}
.kit-name{font-size:14.5px;font-weight:600;color:var(--ink);margin-bottom:.5rem;line-height:1.3}
.kit-desc{font-size:12px;color:var(--ink3);line-height:1.6;margin-bottom:1rem}
.kit-includes{list-style:none;display:flex;flex-direction:column;gap:.4rem;margin-bottom:1rem}
.kit-includes li{font-size:11px;color:var(--ink2);padding-left:14px;position:relative}
.kit-includes li::before{content:'—';position:absolute;left:0;color:var(--gold)}
.kit-link{font-size:11px;letter-spacing:.05em;color:var(--ink);border-bottom:1px solid var(--gold);padding-bottom:2px}
.kit-card:hover .kit-link{color:var(--live);border-color:var(--live)}

/* ---------- Modules complémentaires (remplace l'ancien bandeau Sources & méthodologie) ---------- */
.mx-wrap{max-width:1280px;margin:0 auto;padding:2.5rem 2rem}
.mx-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:.6rem}
.mx-chip{border:1px solid var(--border);background:var(--white);padding:.95rem 1.1rem;font-size:12.5px;font-weight:600;color:var(--ink2);display:flex;justify-content:space-between;align-items:center;gap:.5rem;border-left:4px solid transparent;transition:all .15s}
.mx-chip:hover{color:var(--ink);padding-left:1.35rem}
.mx-chip .arrow{opacity:.35;font-size:13px;transition:all .15s}
.mx-chip:hover .arrow{opacity:1;transform:translateX(3px)}
/* même rotation de teintes que .cluster-link, pour rester cohérent avec le reste du site */
.mx-chip:nth-child(6n+1){background:#EEF3FC;border-left-color:#6E8FD4}
.mx-chip:nth-child(6n+1):hover{background:#E3EBFA}
.mx-chip:nth-child(6n+2){background:#FBEFF6;border-left-color:#C9679A}
.mx-chip:nth-child(6n+2):hover{background:#F7E3EF}
.mx-chip:nth-child(6n+3){background:#EEFAF4;border-left-color:#3FA57A}
.mx-chip:nth-child(6n+3):hover{background:#E1F5EB}
.mx-chip:nth-child(6n+4){background:#FDF3E7;border-left-color:#D6923E}
.mx-chip:nth-child(6n+4):hover{background:#FCEAD3}
.mx-chip:nth-child(6n+5){background:#F0F0FB;border-left-color:#8171C9}
.mx-chip:nth-child(6n+5):hover{background:#E5E4F7}
.mx-chip:nth-child(6n+6){background:#E9F7F8;border-left-color:#0FB9C4}
.mx-chip:nth-child(6n+6):hover{background:#DAF1F3}

/* ---------- Copilote IA (repositionné en 2e intention) ---------- */
.copilot{max-width:1280px;margin:0 auto;padding:3rem 2rem;display:grid;grid-template-columns:1fr 1.3fr;gap:2.5rem;align-items:center;border-top:1px solid var(--border)}
.copilot-title{font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:400;margin-bottom:.6rem;display:inline-block;background:#EFDFC8;color:#6B4A1E;padding:4px 14px}
.copilot-sub{font-size:12.5px;color:var(--ink3);line-height:1.6}
.copilot-input-row{display:flex;gap:.6rem}
.copilot-input{flex:1;padding:13px 16px;border:1px solid var(--border2);background:var(--white);font-family:'DM Sans',sans-serif;font-size:13.5px;color:var(--ink);outline:none}
.copilot-input:focus{border-color:var(--gold)}
.copilot-submit{padding:13px 20px;background:var(--ink);color:var(--gold2);font-size:11px;letter-spacing:.08em;white-space:nowrap}
.copilot-submit:hover{background:var(--gold);color:var(--ink)}

/* ---------- Footer : tous les liens/infos utiles conservés ---------- */
footer{border-top:1px solid var(--border);padding:1.5rem 2rem 1rem;margin-top:1rem;background:var(--gold4)}
.footer-inner{max-width:1280px;margin:0 auto}
.footer-grid{display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:1.5rem;margin-bottom:1.25rem}
.footer-brand .logo{margin-bottom:.5rem}
.footer-brand p{font-size:11px;color:var(--ink3);line-height:1.55;max-width:260px}
.footer-col-title{font-size:10px;letter-spacing:.12em;color:var(--ink3);margin-bottom:.5rem}
.footer-col a{display:inline;font-size:11px;color:var(--ink2);transition:color .13s}
.footer-col a:not(:last-child)::after{content:'·';color:var(--ink3);margin:0 .4em}
.footer-col a:hover{color:var(--gold)}
.footer-bottom{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding-top:1rem;border-top:1px solid var(--border2);flex-wrap:wrap}
.footer-legal{display:flex;gap:1.5rem}
.footer-legal a{font-size:11px;color:var(--ink3)}
.footer-legal a:hover{color:var(--gold)}
.footer-copy{font-size:10px;color:var(--ink3);letter-spacing:.06em}

@media(max-width:1100px){
  .hdr-nav{display:none}
}
@media(max-width:960px){
  .hero{grid-template-columns:1fr;padding-top:2.5rem}
  .hero h1{font-size:27px}
  .clusters{grid-template-columns:1fr}
  .barometre{grid-template-columns:1fr;margin:1rem}
  .copilot{grid-template-columns:1fr}
  .footer-grid{grid-template-columns:1fr 1fr}
  .hdr-nav{display:none}
  .strategies-wrap .cluster-list{grid-template-columns:1fr}
  .strategies-wrap .cluster-link{border-right:none}
  .kits-grid{grid-template-columns:1fr 1fr}
}
@media(max-width:600px){
  .kits-grid{grid-template-columns:1fr}
}

/* ---------- Authentification (connexion / inscription) — repris du site en production ---------- */
.hdr-user{font-size:10.5px;color:var(--ink2);white-space:nowrap;text-decoration:none;cursor:pointer}
.hdr-user:hover{text-decoration:underline;color:var(--gold)}
.overlay{display:none;position:fixed;inset:0;background:rgba(10,10,10,.6);z-index:500;align-items:center;justify-content:center}
.overlay.open{display:flex}
.modal{background:var(--white);border:1px solid var(--border2);padding:2.5rem;width:100%;max-width:420px;position:relative;animation:fadeUp .2s ease}
@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.modal h2{font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:400;margin-bottom:.75rem}
.modal h2 em{color:var(--gold);font-style:normal}
.modal p{font-size:13px;color:var(--ink3);margin-bottom:1.5rem;line-height:1.6}
.m-field{display:flex;flex-direction:column;gap:.35rem;margin-bottom:1rem}
.m-field label{font-size:11px;letter-spacing:.08em;color:var(--ink3)}
.m-field input,.m-field select{padding:.75rem 1rem;border:1px solid var(--border2);background:var(--white);font-family:'DM Sans',sans-serif;font-size:13px;color:var(--ink);outline:none;transition:border-color .15s}
.m-field input:focus,.m-field select:focus{border-color:var(--gold)}
.m-submit{width:100%;padding:12px;background:var(--ink);color:var(--gold2);font-size:12px;letter-spacing:.1em;margin-top:.5rem;transition:all .15s}
.m-submit:hover{background:var(--gold);color:var(--ink)}
.m-close{position:absolute;top:1rem;right:1rem;font-size:18px;color:var(--ink3);cursor:pointer}
.m-close:hover{color:var(--ink)}
.trial-badge{display:inline-flex;align-items:center;gap:6px;background:var(--gold4);border:1px solid var(--gold3);padding:6px 12px;font-size:11px;color:var(--ink2);margin-bottom:1.5rem}
.trial-badge strong{color:var(--gold)}
`;

const bodyHTML = `

<div class="ticker-wrap"><div class="ticker-track">
  <div class="t-item"><span class="t-label">DH/EUR</span><span class="t-val">10.82</span><span class="t-chg up">▲ +0.12%</span></div>
  <div class="t-item"><span class="t-label">DH/USD</span><span class="t-val">9.97</span><span class="t-chg dn">▼ -0.08%</span></div>
  <div class="t-item"><span class="t-label">FRET TANGER MED</span><span class="t-val">$2 140</span><span class="t-chg up">▲ +2.1%</span></div>
  <div class="t-item"><span class="t-label">CIRCULAIRE ADII</span><span class="t-val">N° 6705/222</span><span class="t-chg up">NOUVELLE</span></div>
  <div class="t-item"><span class="t-label">DH/EUR</span><span class="t-val">10.82</span><span class="t-chg up">▲ +0.12%</span></div>
  <div class="t-item"><span class="t-label">DH/USD</span><span class="t-val">9.97</span><span class="t-chg dn">▼ -0.08%</span></div>
  <div class="t-item"><span class="t-label">FRET TANGER MED</span><span class="t-val">$2 140</span><span class="t-chg up">▲ +2.1%</span></div>
  <div class="t-item"><span class="t-label">CIRCULAIRE ADII</span><span class="t-val">N° 6705/222</span><span class="t-chg up">NOUVELLE</span></div>
</div></div>

<header><div class="hdr">
  <div class="logo">Transit<em>-</em>IA<sup>MAROC</sup></div>
  <nav class="hdr-nav">
    <a href="#diagnostic">Audits et diagnostics</a>
    <a href="#modules">Modules d'efficience</a>
    <a href="#barometre">Baromètre</a>
    <a href="#kits">Vos Kits pratiques</a>
    <a href="#modules-plus">Votre Boîte à outils</a>
    <a href="#strategies">Stratégies et analyses</a>
    <a href="#copilote">Votre Copilote IA</a>
  </nav>
  <div class="hdr-actions" id="hdr-actions">
    <button class="btn-in" onclick="openModal('login')">CONNEXION</button>
    <button class="btn-sub" onclick="openModal('register')">ESSAI GRATUIT</button>
  </div>
</div></header>

<!-- ═══════════════════ COPILOTE IA (remonté en haut de page) ═══════════════════ -->
<section class="copilot reveal" id="copilote">
  <div>
    <div class="copilot-title">Une question précise ?</div>
    <div class="copilot-sub">Le copilote Transit-IA répond en citant la circulaire, l'article ou l'accord exact — pour ceux qui savent déjà ce qu'ils cherchent.</div>
  </div>
  <div>
    <div class="copilot-input-row">
      <input type="text" class="copilot-input" name="copilot-question" autocomplete="off" data-lpignore="true" data-form-type="other" placeholder="Ex : Quels documents pour une admission temporaire ?">
      <button class="copilot-submit">SOUMETTRE →</button>
    </div>
  </div>
</section>

<!-- ═══════════════════ HERO — diagnostic-first ═══════════════════ -->
<section class="hero" id="diagnostic">
  <div class="hero-copy">
    <div class="hero-eyebrow"><span class="dot"></span>DIAGNOSTIC GRATUIT · 3 MINUTES</div>
    <h1 id="hero-h1">Un code SH mal classé,<br>c'est <strong>5 ans de redressement</strong> possible.</h1>
    <p class="lead">Découvrez votre Indice de Vulnérabilité Douanière — classement tarifaire, origine préférentielle, régimes économiques — avant qu'un contrôle a posteriori ne le fasse à votre place.</p>
    <div class="hero-cta-row">
      <a href="#" class="cta-primary" onclick="return false" id="hero-cta-scroll">LANCER MON DIAGNOSTIC →</a>
    </div>
  </div>

  <div class="scanner-card">
    <div class="scanner-seal">TRANSIT<br>—<br>IA · MAROC</div>
    <div class="scanner-title">SCANNER DE VULNÉRABILITÉ</div>
    <div class="scanner-sub">Répondez à 3 questions rapides pour une première estimation de votre exposition.</div>

    <div class="gauge-wrap">
      <svg width="128" height="74" viewBox="0 0 180 104">
        <path d="M 10 100 A 80 80 0 0 1 170 100" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="14" stroke-linecap="round"/>
        <path id="gauge-arc" d="M 10 100 A 80 80 0 0 1 170 100" fill="none" stroke="#C9A84C" stroke-width="14" stroke-linecap="round" stroke-dasharray="251" stroke-dashoffset="251"/>
      </svg>
      <div class="gauge-score" id="gauge-score">—<span>/100</span></div>
      <div class="gauge-verdict" id="gauge-verdict" style="visibility:hidden">Score</div>
    </div>

    <div class="scan-q" data-q="1">
      <div class="scan-q-label">1. Comment validez-vous vos codes SH ?</div>
      <div class="scan-opts">
        <button class="scan-opt" data-val="5" data-key="habitude">Habitude / transitaire</button>
        <button class="scan-opt" data-val="3" data-key="cas_par_cas">Au cas par cas</button>
        <button class="scan-opt" data-val="1" data-key="registre_audite">Registre audité</button>
      </div>
    </div>
    <div class="scan-q" data-q="2">
      <div class="scan-q-label">2. Utilisez-vous des accords de libre-échange (ALE) ?</div>
      <div class="scan-opts">
        <button class="scan-opt" data-val="5" data-key="sans_tracabilite">Oui, sans traçabilité</button>
        <button class="scan-opt" data-val="1" data-key="documente">Oui, documenté</button>
        <button class="scan-opt" data-val="0" data-key="non_concerne">Non</button>
      </div>
    </div>
    <div class="scan-q" data-q="3">
      <div class="scan-q-label">3. Blocage ou contrôle a posteriori sur les 3 dernières années ?</div>
      <div class="scan-opts">
        <button class="scan-opt" data-val="5" data-key="plusieurs_fois">Plusieurs fois</button>
        <button class="scan-opt" data-val="3" data-key="une_fois">Une fois</button>
        <button class="scan-opt" data-val="1" data-key="jamais">Jamais</button>
      </div>
    </div>

    <div class="scanner-foot">
      <div class="scanner-cta" id="scanner-cta">VOIR MON SCORE COMPLET ET MON PLAN D'ACTION</div>
      <div class="capture-form" id="capture-form">
        <div class="capture-row">
          <div class="capture-field"><label>PRÉNOM</label><input type="text" id="cap-prenom" placeholder="Mohamed"></div>
          <div class="capture-field"><label>NOM</label><input type="text" id="cap-nom" placeholder="Alami"></div>
        </div>
        <div class="capture-field" style="margin-bottom:8px"><label>E-MAIL PROFESSIONNEL</label><input type="email" id="cap-email" placeholder="m.alami@entreprise.ma"></div>
        <div class="capture-row">
          <div class="capture-field"><label>FONCTION</label><input type="text" id="cap-fonction" placeholder="Directeur Supply Chain"></div>
          <div class="capture-field"><label>ENTREPRISE</label><input type="text" id="cap-entreprise" placeholder="Nom de l'entreprise"></div>
        </div>
        <button class="capture-submit" id="capture-submit">RECEVOIR MON RAPPORT COMPLET →</button>
        <div class="capture-msg" id="capture-msg"></div>
      </div>
      <div class="scanner-note" id="scanner-note">Aucune carte bancaire requise — résultat par e-mail</div>
    </div>
  </div>
</section>

<!-- ═══════════════════ TUILES RÉORGANISÉES PAR VALEUR ═══════════════════ -->
<section class="section reveal" id="modules">
  <div class="section-hdr">
    <div class="section-eyebrow">OÙ EN ÊTES-VOUS ?</div>
    <div class="section-title">Vos outils, classés selon vos besoins et selon ce qu'ils résolvent</div>
    <div class="section-sub">Les 39 modules Transit-IA regroupés selon la situation réelle qui vous amène ici : un problème à traiter maintenant, un risque à prévenir avant qu'il ne coûte, ou une veille à entretenir en continu.</div>
  </div>

  <div class="clusters">
    <div class="cluster">
      <div class="cluster-hdr pain">
        <div class="cluster-icon">⚠</div>
        <div><div class="cluster-name">Un dossier vous bloque</div><div class="cluster-tag">Urgence — action immédiate</div></div>
      </div>
      <div class="cluster-list">
        <a class="cluster-link" href="/modules/verificateur-dum">Vérificateur DUM <span class="arrow">→</span></a>
        <a class="cluster-link" href="/modules/surestaries">Surestaries &amp; Pénalités <span class="arrow">→</span></a>
        <a class="cluster-link" href="/modules/contentieux">Contentieux &amp; Litiges <span class="arrow">→</span></a>
        <a class="cluster-link" href="/modules/audit">Audit Douanier &amp; OEA <span class="arrow">→</span></a>
        <a class="cluster-link" href="/modules/risques">Contrôle des Risques — 38 situations <span class="arrow">→</span></a>
        <a class="cluster-link" href="/modules/tracking">Tracking &amp; Intelligence <span class="arrow">→</span></a>
      </div>
    </div>

    <div class="cluster">
      <div class="cluster-hdr gain">
        <div class="cluster-icon">✓</div>
        <div><div class="cluster-name">Vous voulez sécuriser avant</div><div class="cluster-tag">Prévention — avant décision</div></div>
      </div>
      <div class="cluster-list">
        <a class="cluster-link" href="/modules/classement">Classement tarifaire SH — 17 224 codes <span class="arrow">→</span></a>
        <a class="cluster-link" href="/modules/decisions-classement">Décisions de Classement ADII <span class="arrow">→</span></a>
        <a class="cluster-link" href="/modules/origine-aleca">Origine ALECA / UE <span class="arrow">→</span></a>
        <a class="cluster-link" href="/modules/simulateur">Simulateur Droits &amp; Taxes <span class="arrow">→</span></a>
        <a class="cluster-link" href="/modules/comparateur">Comparateur Régimes — 9 régimes CDII <span class="arrow">→</span></a>
        <a class="cluster-link" href="/modules/valeur-douane">Valeur en Douane (WCO) <span class="arrow">→</span></a>
        <a class="cluster-link" href="/modules/cgi-fiscal">Index du Code Général des Impôts (CGI) <span class="arrow">→</span></a>
        <a class="cluster-link" href="/modules/transit-doc-generator">Suite Documentaire Transit <span class="arrow">→</span></a>
        <div class="cluster-more">→ voir les autres modules de qualification et chiffrage</div>
      </div>
    </div>

    <div class="cluster">
      <div class="cluster-hdr neutral">
        <div class="cluster-icon">◎</div>
        <div><div class="cluster-name">Vous gardez une longueur d'avance</div><div class="cluster-tag">Veille — en continu</div></div>
      </div>
      <div class="cluster-list">
        <a class="cluster-link" href="/modules/veille-reglementaire">Veille Réglementaire &amp; LF 2026 <span class="arrow">→</span></a>
        <a class="cluster-link" href="/modules/alertes-fiscales">Alertes Fiscales <span class="arrow">→</span></a>
        <a class="cluster-link" href="/modules/faq">FAQ Douanière — 173 questions <span class="arrow">→</span></a>
        <a class="cluster-link" href="/modules/glossaire-douanier">Glossaire Douanier FR/AR — 1 081 termes <span class="arrow">→</span></a>
        <a class="cluster-link" href="/modules/carte-bureauxdouaniers">Carte des Bureaux Douaniers <span class="arrow">→</span></a>
        <a class="cluster-link" href="/community">Communauté <span class="arrow">→</span></a>
        <div class="cluster-more">+ 6 autres modules d'intelligence stratégique</div>
      </div>
    </div>
  </div>
</section>

<!-- ═══════════════════ BAROMÈTRE (autorité de marque) ═══════════════════ -->
<section class="barometre reveal" id="barometre">
  <div>
    <div class="barometre-eyebrow">ÉDITION 2026 — LIBRE TÉLÉCHARGEMENT</div>
    <h2>Le <em>Baromètre</em> annuel de la friction douanière et de la performance logistique au Maroc.</h2>
    <p>Délais de dédouanement, top 5 des erreurs de conformité, impact financier des accords de libre-échange non exploités — l'état des lieux du secteur, construit à partir de nos données de terrain et d'une enquête auprès de directeurs supply chain et CFO.</p>
    <a href="#" class="barometre-cta">TÉLÉCHARGER LE RAPPORT (30 PAGES) →</a>
  </div>
  <div class="barometre-stats">
    <div class="baro-stat"><div class="baro-stat-num">42%</div><div class="baro-stat-label">des entreprises redoutent un contrôle a posteriori</div></div>
    <div class="baro-stat"><div class="baro-stat-num">1/3</div><div class="baro-stat-label">des blocages liés à une erreur de classement SH</div></div>
    <div class="baro-stat"><div class="baro-stat-num">2h</div><div class="baro-stat-label">délai express OEA à Tanger Med</div></div>
    <div class="baro-stat"><div class="baro-stat-num">6</div><div class="baro-stat-label">accords ALE sous-exploités par méconnaissance</div></div>
  </div>
</section>

<!-- ═══════════════════ KITS OPÉRATIONNELS (issus du document stratégique) ═══════════════════ -->
<section class="kits reveal" id="kits">
  <div class="section-hdr">
    <div class="section-eyebrow">PRÊT-À-L'EMPLOI</div>
    <div class="section-title">Vos dossiers les plus sensibles, déjà structurés</div>
    <div class="section-sub">Quatre kits opérationnels Word/Excel, méthodologie incluse — pour les points de friction qui reviennent le plus souvent dans un audit ou un contrôle.</div>
  </div>
  <div class="kits-grid">
    <div class="kit-card">
      <span class="kit-num">KIT 01</span>
      <div class="kit-name">Origine Préférentielle &amp; ALE</div>
      <div class="kit-desc">Sécuriser l'exonération des droits sur les corridors Maroc–UE, USA, Golfe et ZLECAf.</div>
      <ul class="kit-includes">
        <li>Matrice d'éligibilité (Excel dynamique)</li>
        <li>Modèle de déclaration d'origine</li>
        <li>Check-list d'audit des justificatifs</li>
      </ul>
      <a class="kit-link" href="#">Voir le contenu du kit →</a>
    </div>
    <div class="kit-card">
      <span class="kit-num">KIT 02</span>
      <div class="kit-name">Régimes Suspensifs &amp; Économiques</div>
      <div class="kit-desc">Perfectionnement actif, admission temporaire — dossier d'agrément et suivi d'apurement.</div>
      <ul class="kit-includes">
        <li>Dossier de demande d'autorisation type</li>
        <li>Tableau d'apurement des comptes</li>
        <li>Guide des délais et contentieux</li>
      </ul>
      <a class="kit-link" href="#">Voir le contenu du kit →</a>
    </div>
    <div class="kit-card">
      <span class="kit-num">KIT 03</span>
      <div class="kit-name">Classement SH &amp; Contrôle A Posteriori</div>
      <div class="kit-desc">Blinder la nomenclature avant qu'un inspecteur ne la conteste — jusqu'à 5 ans en arrière.</div>
      <ul class="kit-includes">
        <li>Arbre de décision RGI 1 à 6</li>
        <li>Registre centralisé des codes SH</li>
        <li>Auto-diagnostic contrôle a posteriori</li>
      </ul>
      <a class="kit-link" href="#">Voir le contenu du kit →</a>
    </div>
    <div class="kit-card">
      <span class="kit-num">KIT 04</span>
      <div class="kit-name">Compliance Suite — Pack Intégral</div>
      <div class="kit-desc">Les trois kits ci-dessus, réunis pour équiper l'ensemble du département supply chain.</div>
      <ul class="kit-includes">
        <li>Origine · Régimes · Classement</li>
        <li>Notice méthodologique unifiée</li>
        <li>Mise à jour incluse (LF en cours)</li>
      </ul>
      <a class="kit-link" href="#">Voir le pack complet →</a>
    </div>
  </div>
</section>

<section class="mx-wrap reveal" id="modules-plus">
  <div class="section-hdr">
    <div class="section-eyebrow">COMPLÉTEZ VOTRE BOÎTE À OUTILS</div>
    <div class="section-title">19 autres modules Transit-IA, en un coup d'œil</div>
    <div class="section-sub">Calculateurs, référentiels et procédures utiles au quotidien — pas encore rattachés à l'un des volets ci-dessus, mais bien disponibles dès aujourd'hui.</div>
  </div>
  <div class="mx-grid">
    <a class="mx-chip" href="/modules/autorisations-licences">Contrôle des Autorisations et Licences <span class="arrow">→</span></a>
    <a class="mx-chip" href="/modules/calc-colis-sre">Calculateur Colis &amp; Cartons <span class="arrow">→</span></a>
    <a class="mx-chip" href="/modules/calc-conteneurs">Calculateur de Chargement Conteneurs <span class="arrow">→</span></a>
    <a class="mx-chip" href="/modules/cgi-search">Recherche Fiscale CGI (IA) <span class="arrow">→</span></a>
    <a class="mx-chip" href="/modules/documents-sh">Référentiel Documents par Code SH <span class="arrow">→</span></a>
    <a class="mx-chip" href="/modules/export">Module Export — DDP, guide, checklist <span class="arrow">→</span></a>
    <a class="mx-chip" href="/modules/facilitation">Customs Facilitation Global Hub <span class="arrow">→</span></a>
    <a class="mx-chip" href="/modules/incoterms-shipping">Qui Paie Quoi ? — Incoterms × Termes Armateurs <span class="arrow">→</span></a>
    <a class="mx-chip" href="/modules/index-commerce">Index du Commerce International <span class="arrow">→</span></a>
    <a class="mx-chip" href="/modules/marquage-warnings">Marquage &amp; Signalisation <span class="arrow">→</span></a>
    <a class="mx-chip" href="/modules/mondoscope">Global MondoScope — Intelligence Stratégique <span class="arrow">→</span></a>
    <a class="mx-chip" href="/modules/oea">OEA — Fiche détaillée <span class="arrow">→</span></a>
    <a class="mx-chip" href="/modules/procedures">Procédures Douanières <span class="arrow">→</span></a>
    <a class="mx-chip" href="/modules/procedures-process">Régimes &amp; Procédures — 22 procédures <span class="arrow">→</span></a>
    <a class="mx-chip" href="/modules/regime-change">IGOC 2026 — Régime de Change <span class="arrow">→</span></a>
    <a class="mx-chip" href="/modules/regimes-economiques">Régimes Économiques Douaniers <span class="arrow">→</span></a>
    <a class="mx-chip" href="/modules/simulateur-fiscal">Simulateur Fiscal Douanier <span class="arrow">→</span></a>
    <a class="mx-chip" href="/modules/substances-dangereuses">Substances Dangereuses &amp; Classification <span class="arrow">→</span></a>
    <a class="mx-chip" href="/modules/tic-reference">TIC — Taxes Intérieures de Consommation <span class="arrow">→</span></a>
  </div>
</section>

<!-- ═══════════════════ CONDUIRE VOS STRATÉGIES ═══════════════════ -->
<section class="section reveal strategies-wrap" id="strategies">
  <div class="section-hdr">
    <div class="section-eyebrow">PENSER PLUS LOIN</div>
    <div class="section-title">Conduire vos Stratégies</div>
    <div class="section-sub">Au-delà du dossier ponctuel — les modules d'intelligence et de conseil pour orienter vos décisions d'investissement, de sourcing et de développement à l'international.</div>
  </div>
  <div class="cluster">
    <div class="cluster-hdr strategic">
      <div class="cluster-icon">✦</div>
      <div><div class="cluster-name">Intelligence &amp; conseil stratégique</div><div class="cluster-tag">Décision — direction générale, stratégie, investissement</div></div>
    </div>
    <div class="cluster-list">
      <a class="cluster-link" href="https://trans-txp.vercel.app/modules/douane-engineering">Douane Engineering <span class="arrow">→</span></a>
      <a class="cluster-link" href="https://trans-txp.vercel.app/modules/analyses">Analyses Stratégiques <span class="arrow">→</span></a>
      <a class="cluster-link" href="https://trans-txp.vercel.app/modules/intelligence-fiscale">Intelligence Fiscale <span class="arrow">→</span></a>
      <a class="cluster-link" href="https://trans-txp.vercel.app/modules/intelligence-strategique">Intelligence Stratégique <span class="arrow">→</span></a>
      <a class="cluster-link" href="https://trans-txp.vercel.app/modules/intelligence-import">Intelligence Import <span class="arrow">→</span></a>
      <a class="cluster-link" href="https://trans-txp.vercel.app/modules/conseil">Conseil Personnalisé <span class="arrow">→</span></a>
    </div>
  </div>
</section>

<!-- ═══════════════════ FOOTER — tous les liens conservés ═══════════════════ -->
<footer>
  <div class="footer-inner">
    <div class="footer-grid">
      <div class="footer-brand">
        <div class="logo">Transit<em>-</em>IA<sup style="font-size:9px;color:#8A8078;letter-spacing:.06em;vertical-align:super"> MAROC</sup></div>
        <p>Intelligence douanière marocaine — circulaires ADII, tarifs, régimes économiques, fiscalité CGI 2026. 39 modules, une seule source de vérité.</p>
      </div>
      <div class="footer-col">
        <div class="footer-col-title">DIAGNOSTIC</div>
        <a href="#diagnostic">Scanner de vulnérabilité</a>
        <a href="#barometre">Baromètre 2026</a>
        <a href="/modules/audit">Audit OEA</a>
      </div>
      <div class="footer-col">
        <div class="footer-col-title">MODULES CLÉS</div>
        <a href="/modules/classement">Classement tarifaire SH</a>
        <a href="/modules/simulateur">Simulateur Droits &amp; Taxes</a>
        <a href="/modules/veille-reglementaire">Veille Réglementaire</a>
        <a href="/modules/faq">FAQ Douanière</a>
      </div>
      <div class="footer-col">
        <div class="footer-col-title">ENTREPRISE</div>
        <a href="#">Mentions légales</a>
        <a href="#">Confidentialité</a>
        <a href="#">Tarifs</a>
        <a href="#">Contact</a>
        <a href="#">API</a>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="footer-copy">© 2026 Transit-IA — TOUS DROITS RÉSERVÉS</div>
      <div class="footer-legal"><a href="https://www.douane.gov.ma" target="_blank">douane.gov.ma ↗</a><a href="https://www.portnet.ma" target="_blank">portnet.ma ↗</a></div>
    </div>
  </div>
</footer>
<div class="overlay" id="overlay-register" onclick="if(event.target===this)closeModal('register')">
  <div class="modal">
    <span class="m-close" onclick="closeModal('register')">✕</span>
    <h2>Rejoindre <em>Transit-IA</em></h2>
    <div class="trial-badge">✦ <strong>14 jours d'accès complet offerts</strong> — sans carte bancaire</div>
    <div class="m-field"><label>PRÉNOM & NOM</label><input id="reg-nom" type="text" placeholder="Mohamed Alami"/></div>
    <div class="m-field"><label>EMAIL PROFESSIONNEL</label><input id="reg-email" type="email" placeholder="m.alami@entreprise.ma"/></div>
    <div class="m-field"><label>PROFIL</label>
      <select id="reg-profil"><option value="transitaire">Transitaire / Agent en douane</option><option value="importateur">Importateur / Exportateur PME</option><option value="directeur_logistique">Directeur logistique</option><option value="consultant">Cabinet conseil douanier</option><option value="autre">Autre</option></select>
    </div>
    <div class="m-field"><label>TÉLÉPHONE</label><input id="reg-tel" type="tel" placeholder="06 12 34 56 78"/></div>
    <div class="m-field"><label>MOT DE PASSE</label><input id="reg-pwd" type="password" placeholder="••••••••"/></div>
    <button class="m-submit" onclick="submitRegister()">DÉMARRER MON ESSAI GRATUIT →</button>
    <p style="text-align:center;font-size:11px;color:var(--ink3);margin-top:1rem">Déjà inscrit ? <span style="color:var(--gold);cursor:pointer" onclick="closeModal('register');openModal('login')">Se connecter</span></p>
  </div>
</div>
<div class="overlay" id="overlay-login" onclick="if(event.target===this)closeModal('login')">
  <div class="modal">
    <span class="m-close" onclick="closeModal('login')">✕</span>
    <h2>Connexion à <em>Transit-IA</em></h2>
    <p>Accédez à votre espace et reprenez là où vous en étiez.</p>
    <div class="m-field"><label>EMAIL</label><input id="login-email" type="email" placeholder="votre@email.ma" onkeydown="if(event.key==='Enter')submitLogin()"/></div>
    <div class="m-field"><label>MOT DE PASSE</label><input id="login-pwd" type="password" placeholder="••••••••" onkeydown="if(event.key==='Enter')submitLogin()"/></div>
    <button class="m-submit" onclick="submitLogin()">SE CONNECTER →</button>
    <p style="text-align:center;font-size:11px;color:var(--ink3);margin-top:1rem">Pas encore de compte ? <span style="color:var(--gold);cursor:pointer" onclick="closeModal('login');openModal('register')">Essai gratuit 14 jours</span></p>
  </div>
</div>
`;

const scriptContent = `
/* ---------- Authentification (repris du site en production) ---------- */
function escHtml(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function openModal(n){document.getElementById('overlay-'+n).classList.add('open');}
function closeModal(n){document.getElementById('overlay-'+n).classList.remove('open');}
document.addEventListener('keydown',function(e){if(e.key==='Escape'){closeModal('register');closeModal('login');}});

async function submitLogin(){
  var email=document.getElementById('login-email').value.trim();
  var pwd=document.getElementById('login-pwd').value;
  if(!email||!pwd){alert('Email et mot de passe requis');return;}
  var btn=document.querySelector('#overlay-login .m-submit');
  if(btn)btn.textContent='CONNEXION...';
  try{
    var res=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email,password:pwd})});
    var data=await res.json();
    if(!res.ok){alert(data.error||'Identifiants incorrects');if(btn)btn.textContent='SE CONNECTER \u2192';return;}
    closeModal('login');
    window.location.href='/';
  }catch(e){alert('Erreur r\u00e9seau');if(btn)btn.textContent='SE CONNECTER \u2192';}
}

async function submitRegister(){
  var nom=document.getElementById('reg-nom').value.trim();
  var email=document.getElementById('reg-email').value.trim();
  var pwd=document.getElementById('reg-pwd').value;
  var profil=document.getElementById('reg-profil').value;
  var tel=document.getElementById('reg-tel').value.trim();
  if(!email||!pwd){alert('Email et mot de passe requis');return;}
  if(pwd.length<8){alert('Mot de passe trop court (8 caract\u00e8res minimum)');return;}
  var btn=document.querySelector('#overlay-register .m-submit');
  if(btn)btn.textContent='CR\u00c9ATION...';
  try{
    var res=await fetch('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email,password:pwd,nom:nom,telephone:tel,profil:profil})});
    var data=await res.json();
    if(!res.ok){alert(data.error||'Erreur inscription');if(btn)btn.textContent='D\u00c9MARRER MON ESSAI GRATUIT \u2192';return;}
    closeModal('register');
    window.location.href='/?welcome=1';
  }catch(e){alert('Erreur r\u00e9seau');if(btn)btn.textContent='D\u00c9MARRER MON ESSAI GRATUIT \u2192';}
}

async function checkSession(){
  try{
    var res = await fetch('/api/auth/me');
    if(!res.ok) return;
    var data = await res.json();
    if(!data || !data.email) return;
    var box = document.getElementById('hdr-actions');
    if(!box) return;
    var name = data.email.split('@')[0];
    box.innerHTML =
  '<a href="/dashboard" class="hdr-user" title="Plan : '+data.plan+' — Accéder à mon compte">'+escHtml(name)+' · '+escHtml(data.plan)+'</a>' +
  '<button class="btn-in" onclick="doLogout()">DÉCONNEXION</button>';
  }catch(e){}
}

async function doLogout(){
  try{
    await fetch('/api/auth/logout', { method:'POST' });
  }catch(e){}
  window.location.href='/';
}

checkSession();

/* ---------- Scanner de vulnérabilité et interactions visuelles (nouvelle hero) ---------- */
var answers = {1:null, 2:null, 3:null};
var answerKeys = {1:null, 2:null, 3:null};

document.querySelectorAll('.scan-q').forEach(function(qEl){
  var qNum = qEl.getAttribute('data-q');
  qEl.querySelectorAll('.scan-opt').forEach(function(btn){
    btn.addEventListener('click', function(){
      qEl.querySelectorAll('.scan-opt').forEach(function(b){ b.classList.remove('picked'); });
      btn.classList.add('picked');
      answers[qNum] = parseInt(btn.getAttribute('data-val'), 10);
      answerKeys[qNum] = btn.getAttribute('data-key');
      updateGauge();
    });
  });
});

function updateGauge(){
  var answered = Object.values(answers).filter(function(v){ return v !== null; });
  if(answered.length === 0) return;

  var sum = answered.reduce(function(a,b){ return a+b; }, 0);
  var maxPossible = answered.length * 5;
  var score = Math.round((sum / maxPossible) * 100);

  var arc = document.getElementById('gauge-arc');
  var offset = 251 - (251 * score / 100);
  arc.style.transition = 'stroke-dashoffset .5s ease, stroke .3s ease';
  arc.style.strokeDashoffset = offset;

  var scoreEl = document.getElementById('gauge-score');
  scoreEl.innerHTML = score + '<span>/100</span>';

  var verdict = document.getElementById('gauge-verdict');
  verdict.style.visibility = 'visible';
  verdict.className = 'gauge-verdict';
  if(score <= 35){
    verdict.classList.add('v-low');
    verdict.textContent = 'Risque maîtrisé';
    arc.setAttribute('stroke', '#4CAF7C');
  } else if(score <= 70){
    verdict.classList.add('v-mid');
    verdict.textContent = 'Risque modéré';
    arc.setAttribute('stroke', '#C9A84C');
  } else {
    verdict.classList.add('v-high');
    verdict.textContent = 'Risque critique';
    arc.setAttribute('stroke', '#E85D5D');
  }

  if(answered.length === 3){
    var cta = document.getElementById('scanner-cta');
    cta.classList.add('ready');
    cta.textContent = 'RECEVOIR MON RAPPORT COMPLET →';
  }
}

document.getElementById('scanner-cta').addEventListener('click', function(){
  if(!this.classList.contains('ready')) return;
  var form = document.getElementById('capture-form');
  var note = document.getElementById('scanner-note');
  form.classList.add('open');
  note.style.display = 'none';
  this.style.display = 'none';
  document.getElementById('cap-email').focus();
});

document.getElementById('capture-submit').addEventListener('click', async function(){
  var btn = this;
  var msg = document.getElementById('capture-msg');
  var prenom = document.getElementById('cap-prenom').value.trim();
  var nom = document.getElementById('cap-nom').value.trim();
  var email = document.getElementById('cap-email').value.trim();
  var fonction = document.getElementById('cap-fonction').value.trim();
  var entreprise = document.getElementById('cap-entreprise').value.trim();

  function showMsg(text, cls){
    msg.textContent = text;
    msg.className = 'capture-msg show ' + cls;
  }

  if(!email || email.indexOf('@') === -1){
    showMsg('Merci de renseigner un e-mail professionnel valide.', 'err');
    return;
  }
  if(!answerKeys[1] || !answerKeys[2] || !answerKeys[3]){
    showMsg('Merci de répondre aux 3 questions avant de recevoir le rapport.', 'err');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'ENVOI EN COURS...';

  var payload = {
    prenom: prenom, nom: nom, email: email, fonction: fonction, entreprise: entreprise,
    reponseSH: answerKeys[1], reponseALE: answerKeys[2], reponseCtrl: answerKeys[3]
  };

  try{
    var res = await fetch('/api/scanner-lead', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    if(res.ok){
      var data = await res.json();
      showMsg('Rapport envoyé à ' + email + ' — score ' + data.score + '/100. Vérifiez votre boîte de réception.', 'ok');
      btn.style.display = 'none';
    } else {
      var errData = await res.json().catch(function(){ return {}; });
      showMsg('Erreur : ' + (errData.error || 'l\u2019envoi a échoué') + '. Réessayez dans un instant.', 'err');
      btn.disabled = false;
      btn.textContent = 'RECEVOIR MON RAPPORT COMPLET →';
    }
  } catch(e){
    // Page de démo statique : /api/scanner-lead n'existe pas en dehors du projet Next.js.
    // On simule ici le résultat attendu une fois le endpoint branché, pour valider le flux visuellement.
    var score = Math.round(((answers[1]+answers[2]+answers[3]) / 15) * 100);
    showMsg('[MODE DÉMO — pas de backend ici] Une fois déployé sur trans-txp, ceci enverrait le rapport à ' + email + ' via /api/scanner-lead. Score simulé : ' + score + '/100.', 'demo');
    btn.disabled = false;
    btn.textContent = 'RECEVOIR MON RAPPORT COMPLET →';
  }
});

document.getElementById('hero-cta-scroll').addEventListener('click', function(e){
  e.preventDefault();
  document.querySelector('.scanner-card').scrollIntoView({behavior:'smooth', block:'center'});
});

/* Scroll-reveal discret — fade + léger déplacement, respecte prefers-reduced-motion via CSS */
(function(){
  var els = document.querySelectorAll('.reveal');
  if(!('IntersectionObserver' in window)){ els.forEach(function(el){ el.classList.add('in'); }); return; }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){ entry.target.classList.add('in'); io.unobserve(entry.target); }
    });
  }, {threshold:.12, rootMargin:'0px 0px -60px 0px'});
  els.forEach(function(el){ io.observe(el); });
})();
`;

export default function Home() {
  return (
    <>
      <Head>
        <title>Transit-IA — Diagnostic de Vulnérabilité Douanière</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div dangerouslySetInnerHTML={{ __html: bodyHTML }} />
      <script dangerouslySetInnerHTML={{ __html: scriptContent }} />
    </>
  );
}
