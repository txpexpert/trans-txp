import Head from 'next/head';

// pages/index.tsx — Transit-IA / TXP, hero page

const css = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --ink:#0A0A0A;--ink2:#3A3530;--ink3:#8A8078;
  --gold:#C9A84C;--gold2:#E8C97A;--gold3:#F5E4B0;--gold4:#FBF5E6;
  --white:#FDFCF8;--border:#E8DFC8;--border2:#D4C8A8;
  --up:#4CAF7C;--dn:#E85D5D;
  --pain:#B5482E;--pain-bg:#FBEDE8;--pain-brd:#E7C4B6;
  --gain:#1A5C2A;--gain-bg:#EEF5EA;--gain-brd:#C7DCC0;
}
body{font-family:'DM Sans',sans-serif;background:var(--white);color:var(--ink);min-height:100vh;overflow-x:hidden}
a{text-decoration:none;color:inherit}
button{cursor:pointer;font-family:'DM Sans',sans-serif;border:none;background:none}
.ticker-wrap{background:var(--ink);overflow:hidden;height:34px;display:flex;align-items:center}
.ticker-track{display:flex;animation:ticker 50s linear infinite;white-space:nowrap}
.ticker-track:hover{animation-play-state:paused}
.t-item{display:flex;align-items:center;gap:10px;padding:0 28px;border-right:1px solid rgba(201,168,76,.15)}
.t-label{font-size:10px;letter-spacing:.14em;color:var(--ink3)}
.t-val{font-size:11px;font-weight:500;color:var(--gold2)}
.t-chg{font-size:10px}.up{color:var(--up)}.dn{color:var(--dn)}
@keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
header{background:var(--white);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:200}
.hdr{max-width:1280px;margin:0 auto;padding:0 2rem;display:flex;align-items:center;height:60px;gap:1.5rem}
.logo{font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:600;letter-spacing:-.02em}
.logo em{color:var(--gold);font-style:normal}
.logo sup{font-size:10px;font-weight:300;color:var(--ink3);letter-spacing:.06em;vertical-align:super}
.mode-toggle{display:flex;align-items:stretch;border:1px solid var(--border2);overflow:hidden;margin-left:1rem}
.mode-btn{padding:0 16px;font-size:11px;letter-spacing:.09em;color:var(--ink3);transition:all .18s;height:34px;display:flex;align-items:center;gap:6px}
.mode-btn.active{background:var(--ink);color:var(--gold2)}
.mode-btn:not(.active):hover{background:var(--gold4);color:var(--gold)}
.mode-divider{width:1px;background:var(--border2)}
.lang-sw{display:flex;gap:2px;margin-left:auto}
.chat-inline{display:flex;gap:.75rem;max-width:640px;margin:0 auto}
.chat-inline-input{flex:1;padding:12px 16px;border:1px solid var(--border2);background:var(--white);font-family:'DM Sans',sans-serif;font-size:14px;color:var(--ink);outline:none;transition:border-color .15s}
.chat-inline-input:focus{border-color:var(--gold)}
.chat-inline-submit{white-space:nowrap;padding:12px 20px}
.chat-inline-response{max-width:640px;margin:1rem auto 0;padding:1rem 1.25rem;background:var(--gold4);border:1px solid var(--gold3);font-size:13px;color:var(--ink2);line-height:1.6;text-align:left;white-space:pre-wrap}
.chat-inline-response.loading{color:var(--ink3);font-style:italic}
.lang-b{padding:4px 10px;font-size:10px;letter-spacing:.1em;color:var(--ink3);border:1px solid transparent;transition:all .12s}
.lang-b.on,.lang-b:hover{color:var(--gold);border-color:var(--gold3);background:var(--gold4)}
.hdr-actions{display:flex;gap:8px;margin-left:auto}
.btn-in{padding:7px 16px;font-size:11px;letter-spacing:.07em;color:var(--ink2);border:1px solid var(--border2);transition:all .15s}
.btn-in:hover{border-color:var(--gold);color:var(--gold)}
.btn-sub{padding:7px 18px;font-size:11px;letter-spacing:.07em;background:var(--ink);color:var(--gold2);transition:all .15s}
.btn-sub:hover{background:var(--gold);color:var(--ink)}
.main{max-width:1280px;margin:0 auto;padding:3rem 2rem;display:grid;grid-template-columns:1fr 340px;gap:3rem;align-items:start}
.chat-zone{display:flex;flex-direction:column;gap:1.5rem}
.chat-heading h1{font-family:'Cormorant Garamond',serif;font-size:44px;font-weight:300;line-height:1.12;letter-spacing:-.02em}
.chat-heading h1 strong{font-weight:600;color:var(--gold)}
.chat-heading p{margin-top:.75rem;font-size:14px;color:var(--ink3);line-height:1.65;max-width:520px}
.reg-banner{background:var(--ink);padding:1.25rem 1.5rem;display:flex;align-items:center;justify-content:space-between;gap:1rem}
.reg-t strong{color:var(--gold2);font-size:14px;display:block;margin-bottom:.2rem}
.reg-t span{font-size:12px;color:var(--ink3)}
.reg-btns{display:flex;gap:.5rem;flex-shrink:0}
.reg-b{padding:8px 18px;font-size:11px;letter-spacing:.07em}
.reg-b.p{background:var(--gold);color:var(--ink)}
.reg-b.o{border:1px solid rgba(201,168,76,.4);color:var(--gold3)}
.reg-b:hover{opacity:.85}
.sidebar{display:flex;flex-direction:column;gap:1.5rem}
.widget{border:1px solid var(--border);background:var(--white)}
.wgt-hdr{padding:.7rem 1rem;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
.wgt-title{font-size:10px;letter-spacing:.14em;color:var(--ink3)}
.live-badge{font-size:9px;letter-spacing:.1em;color:var(--up);display:flex;align-items:center;gap:4px}
.live-dot{width:5px;height:5px;border-radius:50%;background:var(--up);animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
.rates{padding:.75rem 1rem;display:grid;grid-template-columns:1fr 1fr;gap:.5rem}
.rate{padding:.5rem .75rem;background:var(--gold4);display:flex;flex-direction:column;gap:2px}
.r-pair{font-size:10px;letter-spacing:.08em;color:var(--ink3)}
.r-val{font-size:16px;font-weight:500;color:var(--ink);font-variant-numeric:tabular-nums}
.r-chg{font-size:10px}
.elist{padding:.5rem 1rem}
.eitem{display:flex;justify-content:space-between;align-items:center;padding:.5rem 0;border-bottom:1px solid var(--gold4)}
.eitem:last-child{border:none}
.e-name{font-size:12px;color:var(--ink2)}
.e-price{font-size:13px;font-weight:500;color:var(--ink)}
.e-unit{font-size:10px;color:var(--ink3)}
.nlist,.clist{padding:.5rem 1rem}
.nitem,.citem{padding:.6rem 0;border-bottom:1px solid var(--gold4);cursor:pointer}
.nitem:last-child,.citem:last-child{border:none}
.nitem:hover .n-title,.citem:hover .c-obj{color:var(--gold)}
.n-src{font-size:9px;letter-spacing:.12em;color:var(--gold);margin-bottom:3px;font-weight:500}
.c-num{font-size:10px;color:var(--gold);letter-spacing:.1em;margin-bottom:3px}
.n-title,.c-obj{font-size:12px;line-height:1.45;color:var(--ink2);transition:color .15s}
.c-obj{font-size:11px}
.n-date,.c-date{font-size:10px;color:var(--ink3);margin-top:2px}
#classic-view{display:none;max-width:1280px;margin:2rem auto;padding:0 2rem}
.classic-notice{background:var(--gold4);border:1px solid var(--gold3);padding:1rem 1.5rem;display:flex;align-items:center;justify-content:space-between;margin-bottom:2rem;gap:1rem}
.classic-notice span{font-size:13px;color:var(--ink2)}

/* ---- Éléments portés depuis Index v2 (hubs / parcours / ressources) ---- */
.cv-section{margin-bottom:2.5rem}
.cv-section-hdr{margin-bottom:1.25rem}
.cv-eyebrow{font-size:10px;letter-spacing:.16em;color:var(--gold);margin-bottom:.4rem}
.cv-title{font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:400}
.cv-sub{font-size:13px;color:var(--ink3);margin-top:.4rem;max-width:640px;line-height:1.6}

.hub-list{border:1px solid var(--border);background:var(--white)}
.hub-card{border-bottom:1px solid var(--border);background:var(--white);padding:1.25rem 1.5rem;display:flex;gap:1.25rem;align-items:center;transition:all .15s;text-decoration:none}
.hub-list .hub-card:last-child{border-bottom:none}
.hub-card:hover{border-color:var(--gold);background:var(--gold4)}
.hub-num{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;color:var(--ink);min-width:44px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:var(--gold4);border:1px solid var(--border2);flex-shrink:0}
.hub-num.n-pain{color:var(--pain);background:var(--pain-bg);border-color:var(--pain-brd)}
.hub-num.n-gain{color:var(--gain);background:var(--gain-bg);border-color:var(--gain-brd)}
.hub-num.n-neutral{color:var(--gold);background:var(--gold4);border-color:var(--border2)}
.hub-name{font-size:15px;color:var(--ink);font-weight:500;margin-bottom:.25rem}
.hub-desc{font-size:12.5px;color:var(--ink3);line-height:1.55}

.journey{border:1px solid var(--border);background:var(--white)}
.stage{border-bottom:1px solid var(--border)}
.stage:last-child{border-bottom:none}
.stage-hdr{display:flex;align-items:center;gap:1rem;padding:1rem 1.25rem;background:var(--white)}
.stage-num{font-family:'Cormorant Garamond',serif;font-size:20px;color:var(--gold);font-weight:600;min-width:28px}
.stage-title{font-size:14px;color:var(--ink);font-weight:500}
.stage-sub{font-size:11px;color:var(--ink3);margin-top:2px}
.stage-body-inner{padding:0 1.25rem 1.25rem 3.75rem;display:flex;flex-wrap:wrap;gap:.5rem}
.mod-chip{border:1px solid var(--border2);padding:6px 12px;font-size:11px;color:var(--ink2);background:var(--gold4);cursor:pointer;transition:all .15s;display:inline-block;text-decoration:none}
.mod-chip:hover{background:var(--gold);border-color:var(--gold);color:var(--ink)}
.mod-chip.hub-chip{border-color:var(--gold);color:var(--gold);background:var(--white);font-weight:500}
.mod-chip.hub-chip:hover{background:var(--gold);color:var(--white);border-color:var(--gold)}
.stage-note{width:100%;font-size:11px;color:var(--ink3);font-style:italic;margin-top:.4rem;line-height:1.5}

.cv-res-grid{display:grid;grid-template-columns:1fr;gap:0;border:1px solid var(--border)}
@media(min-width:701px){
  .cv-res-grid{grid-template-columns:1fr 1fr}
  .cv-res-grid a.hub-card:nth-child(odd){border-right:1px solid var(--border)}
}
.c-nav{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1rem}
.c-nav-item{border:1px solid var(--border);padding:1.25rem 1.5rem;cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:.75rem;text-decoration:none}
.c-nav-item:hover{border-color:var(--gold);background:var(--gold4)}
.cn-num{font-size:22px;font-family:'Cormorant Garamond',serif;color:var(--gold);font-weight:600;min-width:36px}
.cn-label{font-size:13px;color:var(--ink2)}
.cn-sub{font-size:11px;color:var(--ink3);margin-top:2px}
.cn-badge{display:inline-block;font-size:8px;letter-spacing:.1em;background:var(--gold);color:var(--ink);padding:1px 5px;margin-left:6px;vertical-align:middle}
.modules-section{border:1px solid var(--border);background:var(--white)}
.modules-section-hdr{padding:.7rem 1rem;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;background:var(--ink)}
.modules-section-title{font-size:10px;letter-spacing:.14em;color:var(--gold2)}
.modules-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:0}
.mod-item{display:flex;align-items:center;gap:10px;padding:.75rem 1rem;border-bottom:1px dashed var(--border2);border-right:1px dashed var(--border2);text-decoration:none;transition:background .15s}
.mod-item:hover{background:var(--gold4)}
.mod-num{font-size:13px;font-weight:600;color:var(--gold);min-width:32px;font-family:'Cormorant Garamond',serif}
.mod-label{font-size:11px;color:var(--ink2);line-height:1.35}
.mod-badge{font-size:8px;letter-spacing:.08em;background:var(--gold);color:var(--ink);padding:1px 4px;margin-left:4px}
.db-faq-row{padding:.875rem 1.25rem;background:var(--gold4);border-top:1px solid var(--gold3);display:flex;align-items:center;gap:1rem;flex-wrap:wrap}
.db-faq-label{font-size:11px;color:var(--ink3);flex-shrink:0;letter-spacing:.04em;font-weight:500}
.db-info-selects{display:flex;flex-wrap:wrap;gap:.5rem;flex:1}
.db-info-sel{padding:5px 10px;font-size:11px;border:1px solid var(--border2);color:var(--ink2);background:var(--white);font-family:'DM Sans',sans-serif;cursor:pointer;max-width:200px;transition:border-color .15s}
.db-info-sel:hover,.db-info-sel:focus{border-color:var(--gold);outline:none}
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
.dashboard-panel{border:1px solid var(--border);background:var(--white)}
.db-date-row{display:flex;align-items:center;justify-content:space-between;padding:.9rem 1.25rem;background:var(--ink);border-bottom:2px solid var(--gold)}
.db-date-left{display:flex;align-items:baseline;gap:.75rem}
.db-day{font-family:'Cormorant Garamond',serif;font-size:32px;font-weight:300;color:var(--gold2);line-height:1}
.db-date-full{font-size:12px;letter-spacing:.08em;color:var(--ink3)}
.db-date-right{display:flex;flex-direction:column;align-items:flex-end;gap:3px}
.db-hijri{font-size:11px;color:var(--ink3);letter-spacing:.04em}
.db-label-free{font-size:9px;letter-spacing:.16em;color:var(--gold);background:rgba(201,168,76,.15);padding:2px 8px}
.db-grid{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:0;border-bottom:1px solid var(--border)}
.db-card{padding:.875rem 1rem;border-right:1px solid var(--border)}
.db-card:last-child{border-right:none}
.db-card-title{font-size:9px;letter-spacing:.14em;color:var(--ink3);margin-bottom:.625rem;padding-bottom:.4rem;border-bottom:1px solid var(--gold4)}
.db-rates{display:flex;flex-direction:column;gap:4px}
.db-rate{display:flex;align-items:center;gap:6px;padding:3px 0}
.db-pair{font-size:10px;letter-spacing:.08em;color:var(--ink3);min-width:28px}
.db-val{font-size:13px;font-weight:500;color:var(--ink);font-variant-numeric:tabular-nums;flex:1}
.db-chg{font-size:10px}
.db-energy{display:flex;flex-direction:column;gap:4px}
.db-erow{display:flex;align-items:center;padding:3px 0;gap:4px}
.db-ename{font-size:11px;color:var(--ink2);flex:1}
.db-eprice{font-size:12px;font-weight:500;color:var(--ink)}
.db-eunit{font-size:10px;color:var(--ink3);min-width:56px;text-align:right}
.db-news{display:flex;flex-direction:column;gap:6px}
.db-nitem{display:flex;align-items:flex-start;gap:8px;padding:4px 0;border-bottom:1px solid var(--gold4)}
.db-nitem:last-child{border:none}
.db-ntag{font-size:9px;letter-spacing:.1em;color:var(--gold);flex-shrink:0;padding-top:1px}
.db-ntitle{font-size:11px;color:var(--ink2);line-height:1.4}
.faq-panel{display:none;border:1px solid var(--border);border-top:none;background:var(--white)}
.faq-panel.open{display:block}
.faq-panel-hdr{padding:.75rem 1.25rem;background:var(--ink);display:flex;align-items:center;justify-content:space-between}
.faq-panel-title{font-size:11px;letter-spacing:.1em;color:var(--gold2)}
.faq-close{font-size:14px;color:var(--ink3);cursor:pointer}.faq-close:hover{color:var(--gold)}
.faq-grid{display:grid;grid-template-columns:1fr 1fr;gap:0}
.faq-item{padding:.75rem 1.25rem;border-bottom:1px solid var(--gold4);border-right:1px solid var(--gold4);cursor:pointer;transition:background .15s}
.faq-item:hover{background:var(--gold4)}
.faq-item:nth-child(even){border-right:none}
.faq-q{font-size:12px;color:var(--ink2);line-height:1.4}
.faq-cat{font-size:9px;letter-spacing:.1em;color:var(--gold);margin-bottom:3px}
footer{border-top:1px solid var(--border);padding:1.5rem 2rem;margin-top:3rem}
.footer-inner{max-width:1280px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:1rem}
.footer-logo{font-family:'Cormorant Garamond',serif;font-size:16px;color:var(--ink3)}
.footer-logo em{color:var(--gold);font-style:normal}
.footer-links{display:flex;gap:1.5rem}
.footer-links a{font-size:11px;letter-spacing:.06em;color:var(--ink3);transition:color .12s}
.footer-links a:hover{color:var(--gold)}
.footer-copy{font-size:10px;color:var(--ink3);letter-spacing:.06em}
@media(max-width:900px){
  .main{grid-template-columns:1fr}
  .sidebar{display:none}
  .chat-heading h1{font-size:30px}
  .hdr{flex-wrap:wrap;height:auto;padding:.75rem 1rem;gap:.5rem}
}
.preview-bar{position:fixed;bottom:0;left:0;right:0;background:#0A0A0A;color:#C9A84C;font-size:11px;letter-spacing:.1em;padding:6px 1rem;text-align:center;z-index:9999;border-top:1px solid rgba(201,168,76,.3)}
`;

const bodyHTML = `
<div class="ticker-wrap"><div class="ticker-track">
  <div class="t-item"><span class="t-label">DH/EUR</span><span class="t-val">10.82</span><span class="t-chg up">▲ +0.12%</span></div>
  <div class="t-item"><span class="t-label">DH/USD</span><span class="t-val">9.97</span><span class="t-chg dn">▼ -0.08%</span></div>
  <div class="t-item"><span class="t-label">DH/GBP</span><span class="t-val">12.64</span><span class="t-chg up">▲ +0.05%</span></div>
  <div class="t-item"><span class="t-label">DH/CNY</span><span class="t-val">1.38</span><span class="t-chg up">▲ +0.03%</span></div>
  <div class="t-item"><span class="t-label">BRENT</span><span class="t-val">$83.40</span><span class="t-chg dn">▼ -0.42%</span></div>
  <div class="t-item"><span class="t-label">FRET TANGER</span><span class="t-val">$2 140</span><span class="t-chg up">▲ +2.1%</span></div>
  <div class="t-item"><span class="t-label">PHOSPHATE</span><span class="t-val">$332/t</span><span class="t-chg up">▲ +0.8%</span></div>
  <div class="t-item"><span class="t-label">BLÉ</span><span class="t-val">$198/t</span><span class="t-chg dn">▼ -1.2%</span></div>
  <div class="t-item"><span class="t-label">DH/EUR</span><span class="t-val">10.82</span><span class="t-chg up">▲ +0.12%</span></div>
  <div class="t-item"><span class="t-label">DH/USD</span><span class="t-val">9.97</span><span class="t-chg dn">▼ -0.08%</span></div>
  <div class="t-item"><span class="t-label">DH/GBP</span><span class="t-val">12.64</span><span class="t-chg up">▲ +0.05%</span></div>
  <div class="t-item"><span class="t-label">DH/CNY</span><span class="t-val">1.38</span><span class="t-chg up">▲ +0.03%</span></div>
  <div class="t-item"><span class="t-label">BRENT</span><span class="t-val">$83.40</span><span class="t-chg dn">▼ -0.42%</span></div>
  <div class="t-item"><span class="t-label">FRET TANGER</span><span class="t-val">$2 140</span><span class="t-chg up">▲ +2.1%</span></div>
  <div class="t-item"><span class="t-label">PHOSPHATE</span><span class="t-val">$332/t</span><span class="t-chg up">▲ +0.8%</span></div>
  <div class="t-item"><span class="t-label">BLÉ</span><span class="t-val">$198/t</span><span class="t-chg dn">▼ -1.2%</span></div>
</div></div>

<header><div class="hdr">
  <div class="logo">Transit<em>-</em>IA<sup>MAROC</sup></div>
  <button class="btn-sub" style="margin-left:1rem" onclick="setMode('classic')">INITIER VOS DOSSIERS</button>
  <div class="hdr-actions">
    <button class="btn-in" onclick="openModal('login')">CONNEXION</button>
    <button class="btn-sub" onclick="openModal('register')">ESSAI GRATUIT</button>
  </div>
</div></header>

<!-- ═══════════════════════════════════════════════════════ MODE CHAT IA -->
<div id="chat-view">
<div class="main">
  <div class="chat-zone">
    <div class="chat-heading">
      <h1 id="h1-txt">L'intelligence douanière<br><strong>à portée de question</strong></h1>
      <p id="sub-txt">Posez vos questions sur la réglementation douanière marocaine — circulaires ADII, tarifs, procédures, régimes économiques. Réponses précises et sourcées.</p>
    </div>
    <div id="TXP-chat-root">
      <div class="chat-inline">
        <input type="text" id="chat-input" class="chat-inline-input" placeholder="Ex : Quels documents pour une admission temporaire ?" onkeydown="if(event.key==='Enter')submitChatQuestion()" />
        <button class="btn-sub chat-inline-submit" onclick="submitChatQuestion()">Soumettre</button>
      </div>
      <div id="chat-inline-response" class="chat-inline-response" style="display:none"></div>
    </div>
    <div class="dashboard-panel">
      <div class="db-date-row">
        <div class="db-date-left"><span class="db-day" id="db-day"></span><span class="db-date-full" id="db-date-full"></span></div>
        <div class="db-date-right"><span class="db-hijri" id="db-hijri"></span><span class="db-label-free">DONNÉES GRATUITES</span></div>
      </div>
      <div class="db-grid">
        <div class="db-card">
          <div class="db-card-title">COURS DH — BAM</div>
          <div class="db-rates">
            <div class="db-rate"><span class="db-pair">EUR</span><span class="db-val">10.82</span><span class="db-chg up">▲0.12%</span></div>
            <div class="db-rate"><span class="db-pair">USD</span><span class="db-val">9.97</span><span class="db-chg dn">▼0.08%</span></div>
            <div class="db-rate"><span class="db-pair">GBP</span><span class="db-val">12.64</span><span class="db-chg up">▲0.05%</span></div>
            <div class="db-rate"><span class="db-pair">CNY</span><span class="db-val">1.38</span><span class="db-chg up">▲0.03%</span></div>
            <div class="db-rate"><span class="db-pair">SAR</span><span class="db-val">2.66</span><span class="db-chg up">▲0.01%</span></div>
            <div class="db-rate"><span class="db-pair">AED</span><span class="db-val">2.71</span><span class="db-chg dn">▼0.02%</span></div>
          </div>
        </div>
        <div class="db-card">
          <div class="db-card-title">ÉNERGIE & FRET</div>
          <div class="db-energy">
            <div class="db-erow"><span class="db-ename">Pétrole Brent</span><span class="db-eprice">$83.40<span class="dn"> ▼</span></span><span class="db-eunit">$/baril</span></div>
            <div class="db-erow"><span class="db-ename">WTI</span><span class="db-eprice">$79.20<span class="dn"> ▼</span></span><span class="db-eunit">$/baril</span></div>
            <div class="db-erow"><span class="db-ename">Fret Tanger Med</span><span class="db-eprice">$2 140<span class="up"> ▲</span></span><span class="db-eunit">$/conteneur</span></div>
            <div class="db-erow"><span class="db-ename">Indice Baltic</span><span class="db-eprice">1 842<span class="up"> ▲</span></span><span class="db-eunit">points</span></div>
          </div>
        </div>
        <div class="db-card">
          <div class="db-card-title">MATIÈRES PREMIÈRES</div>
          <div class="db-energy">
            <div class="db-erow"><span class="db-ename">Phosphate OCP</span><span class="db-eprice">$332<span class="up"> ▲</span></span><span class="db-eunit">$/tonne</span></div>
            <div class="db-erow"><span class="db-ename">Blé tendre</span><span class="db-eprice">$198<span class="dn"> ▼</span></span><span class="db-eunit">$/tonne</span></div>
            <div class="db-erow"><span class="db-ename">Sucre brut</span><span class="db-eprice">$412<span class="dn"> ▼</span></span><span class="db-eunit">$/tonne</span></div>
            <div class="db-erow"><span class="db-ename">Acier HRC</span><span class="db-eprice">$580<span class="up"> ▲</span></span><span class="db-eunit">$/tonne</span></div>
          </div>
        </div>
        <div class="db-card">
          <div class="db-card-title">ACTUALITÉ DOUANE DU JOUR</div>
          <div class="db-news">
            <div class="db-nitem"><span class="db-ntag">ADII</span><span class="db-ntitle">Dédouanement express Tanger Med — délai réduit à 2h pour les opérateurs OEA</span></div>
            <div class="db-nitem"><span class="db-ntag">TARIFS</span><span class="db-ntitle">Accord Maroc-UK : nouveaux contingents tarifaires produits agricoles effectifs Q2 2026</span></div>
            <div class="db-nitem"><span class="db-ntag">BADR</span><span class="db-ntitle">Mise à jour BADR v4.2 — nouvelle interface déclaration en détail déployée</span></div>
          </div>
        </div>
      </div>
      <div class="db-faq-row">
        <div class="db-faq-label">Vos Informations utiles</div>
        <div class="db-info-selects">
          <select class="db-info-sel" onchange="if(this.value){alert('Régime '+this.value+' : '+this.options[this.selectedIndex].text.split(' — ')[1]);this.selectedIndex=0}">
            <option value="">📋 Codes Régimes DUM</option>
            <option value="000">000 — REGIME ANCIEN PRIMAIRE</option>
            <option value="002">002 — TRANSBORDEMENT SUR L'ETRANGER</option>
            <option value="003">003 — TRANSPORT MARITIME INTERIEUR</option>
            <option value="004">004 — DECLARATION OCCASIONNELLE IMPORT</option>
            <option value="005">005 — DECLARATION OCCASIONNELLE EXPORT</option>
            <option value="006">006 — DECLARATION PROVISOIRE IMPORT SIMPLE</option>
            <option value="007">007 — DECLARATION PROVISOIRE IMPORT SOUS REGIMES ECONOMIQUES</option>
            <option value="008">008 — DECLARATION D'ADMISSION TEMPORAIRE DE CONTENEURS</option>
            <option value="009">009 — DECLARATION D'ADMISSION TEMPORAIRE DE VEHICULES A USAGE COMMERCIAL</option>
            <option value="010">010 — MISE A LA CONSOMMATION DIRECTE</option>
            <option value="011">011 — EQUIPEMENT DEFENSE NATIONALE</option>
            <option value="012">012 — INVESTISSEMENT</option>
            <option value="013">013 — IMPORT. ACCORDS/CONVENTIONS</option>
            <option value="014">014 — FRANCHISES DIPLOMATIQUES</option>
            <option value="015">015 — PAPIER D'EDITION</option>
            <option value="016">016 — MAT/PROD. AGRICOL. FRANCHISE</option>
            <option value="017">017 — MAT/PROD. PECHE EN FRANCHISE</option>
            <option value="018">018 — DONS</option>
            <option value="019">019 — AUTRES FRANCHISES</option>
            <option value="020">020 — IMPORTATION EN COMPENSATION D'EXPORTATION PREALABLE AVEC PAIEMENT</option>
            <option value="021">021 — IMPORTATION EN COMPENSATION D'EXPORTATION PREALABLE SANS PAIEMENT</option>
            <option value="022">022 — ADMISSION TEMPORAIRE POUR PERFECTIONNEMENT ACTIF (ATPA) AVEC PAIEMENT</option>
            <option value="023">023 — ATPA SANS PAIEMENT</option>
            <option value="024">024 — TRANS. SS DOUANE IMP. DIRECTE</option>
            <option value="030">030 — IT MAT. RECHERCHE HYDROCARBURE</option>
            <option value="031">031 — IT MAT. SOUMIS A REDEVANCES</option>
            <option value="032">032 — IT MAT. NON SOUMIS A REDEVANCE</option>
            <option value="033">033 — IT DES VEHICULES AUTOMOBILES</option>
            <option value="034">034 — AUTRES IT</option>
            <option value="035">035 — ENTREPOT PUBLIC</option>
            <option value="036">036 — ENTREPOT PRIVE BANAL</option>
            <option value="037">037 — ENTREPOT PRIVE PARTICULIER (EPP)</option>
            <option value="038">038 — ENTREPOT INDUSTRIEL (IMPORT)</option>
            <option value="040">040 — MAC EN SUITE D'ATPA</option>
            <option value="041">041 — MAC EN SUITE D'AT/AGRICUL.</option>
            <option value="042">042 — MAC EN SUITE D'AT/AUTRES SECT.</option>
            <option value="043">043 — MAC EN SUITE D'AUTRES AT</option>
            <option value="044">044 — MAC EN SUITE D'AT</option>
            <option value="045">045 — MAC EN SUITE D'AUTRES IT</option>
            <option value="046">046 — MAC EN SUITE D'ENTREPOT PUBLIC</option>
            <option value="047">047 — MAC EN SUITE D'ENTREPOT PRIVE PARTICULIER</option>
            <option value="048">048 — MAC EN SUITE D'ENTREPOT INDUSTRIEL FRANC</option>
            <option value="049">049 — MAC SUITE D'ENTR/PROD. FRANC</option>
            <option value="050">050 — MAC DE MARCHANDISES EN PROVENANCE DES ZONES FRANCHES</option>
            <option value="051">051 — REIMPORTATION EN SUITE DE TPP</option>
            <option value="052">052 — REIMPORTATION EN SUITE D'ET</option>
            <option value="053">053 — REIMPORTATION EN SUITE DU DRAWBACK</option>
            <option value="054">054 — REIMPORTATION EN SUITE D'AUTRES EXPORTATIONS</option>
            <option value="055">055 — ATPA DE MARCHANDISES REIMPORTEES POUR RETOUCHES</option>
            <option value="056">056 — AT DE MARCHANDISES REIMPORTEES</option>
            <option value="060">060 — EXPORTATION EN SIMPLE SORTIE</option>
            <option value="061">061 — EXP. DANS LE CADRE DU SGP</option>
            <option value="062">062 — EXP. DANS LE CADRE DU SGPC</option>
            <option value="063">063 — EQUIPEMENT DE LA DEFENSE NAT.</option>
            <option value="068">068 — AUTRES EXPORTATIONS SIMPLES</option>
            <option value="069">069 — EXPORTATION DANS LE CADRE DU DRAWBACK</option>
            <option value="070">070 — EXPORTATION EN SUITE D'ATPA AVEC PAIEMENT</option>
            <option value="071">071 — EXP. STE AT AVEC PAIE./AUTRES</option>
            <option value="072">072 — EXPORTATION EN SUITE D'ATPA SANS PAIEMENT</option>
            <option value="073">073 — EXP. STE AT SANS PAIE./AUTRES</option>
            <option value="074">074 — EXPORTATION EN SUITE D'AT</option>
            <option value="075">075 — EXPORTATION EN SUITE D'EPP</option>
            <option value="076">076 — EXP. VERS ZONE FRANCHE</option>
            <option value="077">077 — ETPP DE MARCHANDISES MAROCAINES OU NATIONALISEES</option>
            <option value="078">078 — EXPORTATION TEMPORAIRE</option>
            <option value="079">079 — EXPORTATION PREALABLE</option>
            <option value="080">080 — MUTATION ET ENTREE EN ENTREPOT</option>
            <option value="081">081 — ENTREPOT EN SUITE DE REGIMES ECONOMIQUES</option>
            <option value="082">082 — ATPA EN SUITE DE REGIMES ECONOMIQUES</option>
            <option value="083">083 — AT EN SUITE DE REGIMES ECONOMIQUES</option>
            <option value="084">084 — CESSION/EXPORT PREALABLE</option>
            <option value="085">085 — TRANSIT A L'IMPORT</option>
            <option value="086">086 — TRANSIT A L'EXPORT</option>
            <option value="087">087 — TRANSIT DE MARCHANDISES LOCALES</option>
            <option value="088">088 — ENTREPOT INDUSTRIEL (CESSION)</option>
            <option value="090">090 — ENTREPOT DE PRODUITS PETROLIERS</option>
            <option value="091">091 — ENTREPOT SUCRE</option>
          </select>
          <select class="db-info-sel" onchange="if(this.value){alert('Bureau '+this.value+' : '+this.options[this.selectedIndex].text.split(' — ')[1]);this.selectedIndex=0}">
            <option value="">🏛️ Codes Bureaux DUM</option>
            <option value="000">000 — Administration Centrale</option>
            <option value="100">100 — AGADIR</option>
            <option value="101">101 — LAAYOUNE</option>
            <option value="102">102 — LAAYOUNE/AEROPORT</option>
            <option value="103">103 — LAAYOUNE/COLIS POSTAUX</option>
            <option value="104">104 — ED-DAKHLA</option>
            <option value="105">105 — TAN-TAN</option>
            <option value="106">106 — AGADIR/AEROPORT AL MASSIRA</option>
            <option value="200">200 — SAFI</option>
            <option value="201">201 — MARRAKECH</option>
            <option value="202">202 — ESSAOUIRA</option>
            <option value="203">203 — OUARZAZATE</option>
            <option value="204">204 — MARRAKECH/MENARA</option>
            <option value="300">300 — CASABLANCA-MEAD</option>
            <option value="301">301 — CASA/NOUACEUR-FRET</option>
            <option value="302">302 — MOHAMMEDIA</option>
            <option value="303">303 — EL-JADIDA</option>
            <option value="304">304 — CASA/COLIS-POSTAUX</option>
            <option value="305">305 — JORF LASFAR</option>
            <option value="306">306 — CASABLANCA-EXTERIEUR</option>
            <option value="307">307 — CASA/GARANTIE</option>
            <option value="308">308 — NOUASSER/AEROGARE</option>
            <option value="309">309 — CASA/PORT</option>
            <option value="310">310 — SETTAT</option>
            <option value="311">311 — BERRECHID</option>
            <option value="400">400 — TANGER/PORT</option>
            <option value="401">401 — TANGER-VILLE</option>
            <option value="402">402 — TANGER/GARANTIE ET I.I.</option>
            <option value="403">403 — KENITRA</option>
            <option value="404">404 — RABAT-SALE/AEROPORT</option>
            <option value="405">405 — RABAT</option>
            <option value="406">406 — LARACHE</option>
            <option value="407">407 — TETOUAN</option>
            <option value="408">408 — BAB-SEBTA</option>
            <option value="409">409 — RABAT-VILLE/COLIS-POSTAUX/ONCF</option>
            <option value="410">410 — TANGER/POSTES &amp; VEHICULES</option>
            <option value="411">411 — TANGER-MÉDITERRANÉE</option>
            <option value="412">412 — TANGER IBN BATOUTA</option>
            <option value="500">500 — FES VILLE</option>
            <option value="501">501 — AL-HOCEIMA</option>
            <option value="502">502 — FES-SAIS/AEROPORT</option>
            <option value="503">503 — FES/GARANTIE ET I.I.</option>
            <option value="504">504 — TAZA</option>
            <option value="600">600 — OUJDA</option>
            <option value="601">601 — OUJDA/ZOUJ BEGHAL</option>
            <option value="602">602 — NADOR</option>
            <option value="603">603 — AHFIR</option>
            <option value="607">607 — NADOR PORT</option>
            <option value="609">609 — BAB MELLILIA</option>
            <option value="700">700 — MEKNES</option>
          </select>
          <select class="db-info-sel" onchange="if(this.value){alert('Centre RC '+this.value+' : '+this.options[this.selectedIndex].text.split(' — ')[1]);this.selectedIndex=0}">
            <option value="">📂 Centres RC (Registre Commerce)</option>
            <option value="01">01 — AGADIR</option>
            <option value="03">03 — ALHOCEIMA</option>
            <option value="611">611 — ASILAH</option>
            <option value="05">05 — AZILAL</option>
            <option value="471">471 — AZROU</option>
            <option value="591">591 — BEN AHMED</option>
            <option value="09">09 — BEN SLIMANE</option>
            <option value="197">197 — BENGUERIR</option>
            <option value="07">07 — BENI MELLAL</option>
            <option value="551">551 — BERKANE</option>
            <option value="593">593 — BERRECHID</option>
            <option value="293">293 — BOUARFA</option>
            <option value="411">411 — BOUJAAD</option>
            <option value="13">13 — BOULMANE</option>
            <option value="81">81 — CASABLANCA</option>
            <option value="15">15 — CHEFCHAOUEN</option>
            <option value="53">53 — DAKHLA</option>
            <option value="17">17 — EL JADIDA</option>
            <option value="21">21 — ERRACHIDIA</option>
            <option value="23">23 — ESSAOUIRA</option>
            <option value="25">25 — ES-SMARA</option>
            <option value="27">27 — FES</option>
            <option value="077">077 — FKIH BEN SALEH</option>
            <option value="31">31 — GUELMIM</option>
            <option value="693">693 — GUERCIF</option>
            <option value="455">455 — IMINTANOUTE</option>
            <option value="013">013 — INZEGANE</option>
            <option value="19">19 — KALAA-SRAGHNA</option>
            <option value="079">079 — KASBA TADLA</option>
            <option value="35">35 — KENITRA</option>
            <option value="37">37 — KHEMISSET</option>
            <option value="39">39 — KHENIFRA</option>
            <option value="41">41 — KHOURIBGA</option>
            <option value="443">443 — KSAR KEBIR</option>
            <option value="43">43 — LAAYOUNE</option>
            <option value="44">44 — LARACHE</option>
            <option value="45">45 — MARRAKECH</option>
            <option value="47">47 — MEKNES</option>
            <option value="395">395 — MIDELT</option>
            <option value="83">83 — MOHAMMEDIA</option>
            <option value="49">49 — NADOR</option>
            <option value="51">51 — OUARZAZATE</option>
            <option value="605">605 — OUAZZANE</option>
            <option value="415">415 — OUED ZEM</option>
            <option value="55">55 — OUJDA</option>
            <option value="85">85 — RABAT</option>
            <option value="375">375 — ROMANI</option>
            <option value="57">57 — SAFI</option>
            <option value="87">87 — SALE</option>
            <option value="273">273 — SEFROU</option>
            <option value="59">59 — SETTAT</option>
            <option value="175">175 — SIDI BENNOUR</option>
            <option value="60">60 — SIDI KACEM</option>
            <option value="358">358 — SIDI SLIMANE</option>
            <option value="359">359 — SOUK LARBAA</option>
            <option value="61">61 — TANGER</option>
            <option value="63">63 — TANTAN</option>
            <option value="65">65 — TAOUNATE</option>
            <option value="552">552 — TAOURIRT</option>
            <option value="66">66 — TAROUDANTE</option>
            <option value="67">67 — TATA</option>
            <option value="69">69 — TAZA</option>
            <option value="89">89 — TEMARA</option>
            <option value="71">71 — TETOUAN</option>
            <option value="73">73 — TIZNIT</option>
            <option value="573">573 — YOUSSOUFIA</option>
            <option value="517">517 — ZAGORA</option>
          </select>
          <select class="db-info-sel" onchange="if(this.value){alert('Franchise code '+this.value+' : '+this.options[this.selectedIndex].text.split(' — ')[1]);this.selectedIndex=0}">
            <option value="">🎫 Codes Franchises</option>
            <option value="1">1 — Articles d'édition (cf. V.02.01 RDII)</option>
            <option value="2">2 — Films cinématographiques documentaires ou éducatifs</option>
            <option value="3">3 — Franchise UNESCO (cf.V.02.06)</option>
            <option value="6">6 — Associations de Micro crédit</option>
            <option value="7">7 — Agence pour la promotion et le Développement Économique Nord et SUD</option>
            <option value="8">8 — Ligue Nationale de lutte contre les maladies cardio-vasculaires</option>
            <option value="9">9 — Fondation Hassan II pour la lutte contre le cancer</option>
            <option value="10">10 — Matériel militaires importés par les FAR</option>
            <option value="11">11 — Matériel spécial importé par les administrations de sécurité</option>
            <option value="12">12 — Marchandises en retour sur le territoire assujetti</option>
            <option value="13">13 — Franchises diplomatiques (cf. V.02.26)</option>
            <option value="14">14 — Envois destinés aux organismes internationaux siégeant au Maroc</option>
            <option value="15">15 — Dons reçus par les oeuvres de bienfaisance</option>
            <option value="16">16 — Changement de résidence</option>
            <option value="17">17 — Héritage</option>
            <option value="18">18 — Trousseaux élèves (cf. V.02.30)</option>
            <option value="19">19 — Trousseaux mariage (cf. V.02.30)</option>
            <option value="20">20 — Dons</option>
            <option value="21">21 — Aides financières non remboursables</option>
            <option value="22">22 — Echantillons sans valeur marchande</option>
            <option value="23">23 — Objets d'art, trophées, médailles obtenus par des résidents</option>
            <option value="24">24 — Cercueil et urnes (cf. V.02.31)</option>
            <option value="25">25 — Médicaments importés par des non résidents</option>
            <option value="26">26 — Effets et objets mobiliers importés en suite d'un divorce</option>
            <option value="27">27 — Franchise royales (cf art 164 a code)</option>
            <option value="28">28 — Fondation Chekh Zaid Ibn Soltan</option>
            <option value="29">29 — Université Al Akhawayn d'Ifrane</option>
            <option value="30">30 — Fondation Mohamed VI</option>
            <option value="31">31 — Entraide nationale</option>
            <option value="32">32 — Croissant rouge, hors biens d'équipement</option>
            <option value="33">33 — Croissant rouge: biens d'équipement</option>
            <option value="34">34 — Bank Al Maghreb, hors monnaies et métaux précieux</option>
            <option value="35">35 — Bank Al Maghreb: monnaies et métaux précieux</option>
            <option value="36">36 — Agence pour la promotion et le Développement ORIENTAL</option>
            <option value="37">37 — Fondation Cheikh Khalifa Ibn Zaïd</option>
            <option value="1001">1001 — Pétrole brut</option>
            <option value="1002">1002 — Graines de betteraves à sucre</option>
            <option value="1003">1003 — Semences fourragères</option>
            <option value="1004">1004 — Aéronefs destinés aux travaux agricoles aériens</option>
            <option value="1005">1005 — Billets de banque étrangers</option>
            <option value="1006">1006 — Monnaies</option>
            <option value="1007">1007 — Titres d'actions ou d'obligations</option>
            <option value="1008">1008 — Maïs hybrides de semence</option>
            <option value="1009">1009 — Graines de semences de soja et de tournesol</option>
            <option value="1010">1010 — Remoulage et résidus de mouture de céréales</option>
            <option value="1011">1011 — Produits d'origine végétale pour nourriture des animaux</option>
            <option value="1012">1012 — Rutabagas, betteraves fourragères, foin, luzerne et produits similaires</option>
            <option value="1013">1013 — Bourdons pollinisateurs</option>
            <option value="1014">1014 — Peaux brutes</option>
            <option value="1015">1015 — Papiers timbrés</option>
            <option value="1016">1016 — Pulpe sèche de betteraves</option>
            <option value="1017">1017 — Luzerne déshydratée</option>
            <option value="1018">1018 — Son pellétisé</option>
            <option value="1019">1019 — Paille mélassée pellétisée</option>
            <option value="1020">1020 — Paille</option>
            <option value="1021">1021 — Timbres fiscaux</option>
            <option value="1022">1022 — Semences animales (spermes congelés)</option>
            <option value="1023">1023 — Préparations pour alimentation des veaux</option>
            <option value="1024">1024 — Produits et appareils destinés à l'hémodialyse</option>
            <option value="1025">1025 — Passeports vierges</option>
            <option value="1026">1026 — Bandes de plastiques pour cartes d'identité nationale</option>
            <option value="1027">1027 — Plants de noyers</option>
            <option value="1028">1028 — Plants d'oliviers</option>
            <option value="1029">1029 — Matériels énergies renouvelables hors secteur agricole</option>
            <option value="1030">1030 — Matériels énergies renouvelables secteur agricole</option>
            <option value="1031">1031 — Graines de semences</option>
            <option value="1032">1032 — Appareils de protection contre les périls aérotoxiques</option>
            <option value="1033">1033 — Engrais du chapitre 31</option>
            <option value="1035">1035 — Cristallins artificiels</option>
            <option value="1036">1036 — Albums à colorier pour enfants en enseignements</option>
            <option value="1037">1037 — Véhicules affectés à des transports touristiques</option>
            <option value="1038">1038 — Bateaux et matériels NON soumis à l'article 126-15-a</option>
            <option value="1039">1039 — Bateaux et matériels soumis à l'article 126-15-a</option>
            <option value="1040">1040 — Viandes de volailles, bovins et ovins importées pour les FAR</option>
            <option value="1041">1041 — Matériels pour exploration et exploitation des hydrocarbures</option>
            <option value="1042">1042 — Matériels au sol importés par les entreprises de transport aérien</option>
            <option value="1043">1043 — Carburants pour navigations maritimes — vedettes de sauvetage</option>
          </select>
        </div>
      </div>
    </div>
    <div class="reg-banner">
      <div class="reg-t">
        <strong>Accès complet — période d'essai offerte</strong>
        <span>Transitaires · PME importatrices · Cabinets conseil · Directions logistique</span>
      </div>
      <div class="reg-btns">
        <button class="reg-b p" onclick="openModal('register')">CRÉER UN COMPTE</button>
        <button class="reg-b o" onclick="openModal('login')">SE CONNECTER</button>
      </div>
    </div>
  </div>
  <aside class="sidebar" id="sidebar-panel">
    <div class="widget">
      <div class="wgt-hdr"><span class="wgt-title">COURS DH — DEVISES</span><span class="live-badge"><div class="live-dot"></div>LIVE</span></div>
      <div class="rates">
        <div class="rate"><span class="r-pair">DH / EUR</span><span class="r-val">10.82</span><span class="r-chg up">▲ +0.12%</span></div>
        <div class="rate"><span class="r-pair">DH / USD</span><span class="r-val">9.97</span><span class="r-chg dn">▼ -0.08%</span></div>
        <div class="rate"><span class="r-pair">DH / GBP</span><span class="r-val">12.64</span><span class="r-chg up">▲ +0.05%</span></div>
        <div class="rate"><span class="r-pair">DH / CNY</span><span class="r-val">1.38</span><span class="r-chg up">▲ +0.03%</span></div>
      </div>
    </div>
    <div class="widget">
      <div class="wgt-hdr"><span class="wgt-title">ÉNERGIE & MATIÈRES</span><span class="live-badge"><div class="live-dot"></div>LIVE</span></div>
      <div class="elist">
        <div class="eitem"><span class="e-name">Pétrole Brent</span><div><div class="e-price">$83.40 <span class="dn" style="font-size:10px">▼</span></div><div class="e-unit">USD / baril</div></div></div>
        <div class="eitem"><span class="e-name">Fret Tanger Med</span><div><div class="e-price">$2 140 <span class="up" style="font-size:10px">▲</span></div><div class="e-unit">USD / conteneur</div></div></div>
        <div class="eitem"><span class="e-name">Phosphate OCP</span><div><div class="e-price">$332 <span class="up" style="font-size:10px">▲</span></div><div class="e-unit">USD / tonne</div></div></div>
        <div class="eitem"><span class="e-name">Blé tendre</span><div><div class="e-price">$198 <span class="dn" style="font-size:10px">▼</span></div><div class="e-unit">USD / tonne</div></div></div>
      </div>
    </div>
    <div class="widget">
      <div class="wgt-hdr"><span class="wgt-title">ACTUALITÉS DOUANE MAROC</span></div>
      <div class="nlist">
        <div class="nitem" onclick="window.open('https://www.douane.gov.ma','_blank')"><div class="n-src">douane.gov.ma</div><div class="n-title">Site officiel ADII — Circulaires, procédures, actualités réglementaires</div><div class="n-date">Official ↗</div></div>
        <div class="nitem" onclick="window.open('https://medias24.com/categorie/economie/','_blank')"><div class="n-src">medias24.com</div><div class="n-title">Économie marocaine — Commerce extérieur, douane, fiscalité</div><div class="n-date">Quotidien ↗</div></div>
        <div class="nitem" onclick="window.open('https://www.leconomiste.com','_blank')"><div class="n-src">leconomiste.com</div><div class="n-title">L'Économiste — Premier quotidien économique du Maroc</div><div class="n-date">Quotidien ↗</div></div>
        <div class="nitem" onclick="window.open('https://www.portnet.ma/','_blank')"><div class="n-src">portnet.ma</div><div class="n-title">PortNet — Guichet unique commerce extérieur Maroc</div><div class="n-date">Officiel ↗</div></div>
      </div>
    </div>
    <div class="widget">
      <div class="wgt-hdr"><span class="wgt-title">NOUVELLES CIRCULAIRES ADII</span><span class="live-badge"><div class="live-dot"></div>BASE LIVE</span></div>
      <div class="clist" id="circulaires-list"><div style="padding:.75rem 1rem;font-size:11px;color:var(--ink3)">Chargement...</div></div>
    </div>
  </aside>
</div>
</div>

<!-- ═══════════════════════════════════════════════ MODE CLASSIQUE -->
<div id="classic-view" style="display:none">
  <div class="classic-notice">
    <span><strong>TXP . Transit-IA Expert</strong> - votre suite logicielle de facilitation du Transit</span>
    <button class="btn-sub" onclick="setMode('chat')" style="flex-shrink:0">← RETOUR CHAT IA</button>
  </div>
  <div class="cv-section" id="cv-hubs">
    <div class="cv-title" style="margin-bottom:.4rem">Votre dossier commence ici</div>
    <div class="cv-sub" style="margin-bottom:1.25rem">Huit outils prioritaires</div>
    <div class="hub-list">
      <a class="hub-card" id="hub-clf" href="/modules/classificateur"><span class="hub-num n-pain">CLF</span><div><div class="hub-name">Classificateur HS · DUM · Screening</div><div class="hub-desc">Le point de départ de presque tout dossier — le code SH classé ici alimente ensuite documents, taxes, autorisations et marquage.</div></div></a>
      <a class="hub-card" id="hub-dum" href="/modules/verificateur-dum"><span class="hub-num n-pain">DUM</span><div><div class="hub-name">Vérificateur DUM</div><div class="hub-desc">Détecte une erreur de déclaration avant rejet ou pénalité. Renvoie vers Contrôle des Risques si un écart est identifié.</div></div></a>
      <a class="hub-card" id="hub-sur" href="/modules/surestaries"><span class="hub-num n-pain">SUR</span><div><div class="hub-name">Surestaries &amp; Pénalités</div><div class="hub-desc">Calcule et anticipe les frais de détention de conteneurs et de magasinage à Tanger Med et Casa Port avant que la facture ne s'alourdisse chaque jour.</div></div></a>
      <a class="hub-card" id="hub-aud" href="/modules/audit"><span class="hub-num n-pain">AUD</span><div><div class="hub-name">Audit Douanier &amp; OEA</div><div class="hub-desc">Diagnostic de conformité, utilisé en préparation d'un contrôle ou d'une certification OEA (13 critères).</div></div></a>
      <a class="hub-card" id="hub-ctx" href="/modules/contentieux"><span class="hub-num n-pain">CTX</span><div><div class="hub-name">Contentieux &amp; Litiges</div><div class="hub-desc">Accompagne la contestation d'un redressement ou d'une notification de PV — la suite logique quand l'audit préventif n'a pas suffi.</div></div></a>
      <a class="hub-card" id="hub-cal" href="/modules/simulateur"><span class="hub-num n-gain">CAL</span><div><div class="hub-name">Simulateur Droits &amp; Taxes</div><div class="hub-desc">Cascade DI · TVA · TIC · PFI — chiffre le coût réel d'une importation avant décision d'achat.</div></div></a>
      <a class="hub-card" id="hub-cmp" href="/modules/comparateur"><span class="hub-num n-gain">CMP</span><div><div class="hub-name">Comparateur Régimes</div><div class="hub-desc">9 régimes CDII comparés en coûts réels — pour choisir le régime le plus avantageux avant de monter le dossier.</div></div></a>
      <a class="hub-card" id="hub-vrg" href="/modules/veille-reglementaire"><span class="hub-num n-neutral">VRG</span><div><div class="hub-name">Veille Réglementaire &amp; LF 2026</div><div class="hub-desc">Suivi continu des circulaires et changements légaux — le module qui fait revenir régulièrement.</div></div></a>
    </div>
  </div>

  <div class="cv-section" id="journey">
    <div class="cv-section-hdr">
      <div class="cv-eyebrow">LE PARCOURS D'UN DOSSIER</div>
      <div class="cv-title">Outils de classification et suivi efficient de vos opérations</div>
      <div class="cv-sub">Vos étapes et vos points d'entrée en enchaînements logiques.</div>
    </div>
    <div class="journey">
      <div class="stage">
        <div class="stage-hdr"><span class="stage-num">01</span><div><div class="stage-title">Qualification technique</div><div class="stage-sub">Classification, origine, contexte contractuel</div></div></div>
        <div class="stage-body-inner">
          <a class="mod-chip hub-chip" href="#hub-clf">Classificateur HS · DUM · Screening</a>
          <a class="mod-chip" href="/modules/classement">Classement tarifaire et SH — 17 224 codes</a>
          <a class="mod-chip" href="/modules/decisions-classement">Décisions de Classement — 247 décisions ADII</a>
          <a class="mod-chip" href="/modules/origine-aleca">Origine ALECA / UE</a>
          <a class="mod-chip" href="/modules/incoterms-shipping">Incoterms × Shipping Terms</a>
          <div class="stage-note">Le code SH déterminé ici est réutilisé automatiquement dans les étapes 2 et 3 — l'utilisateur ne le ressaisit pas.</div>
        </div>
      </div>
      <div class="stage">
        <div class="stage-hdr"><span class="stage-num">02</span><div><div class="stage-title">Chiffrage et décision</div><div class="stage-sub">Droits, taxes, choix du régime économique</div></div></div>
        <div class="stage-body-inner">
          <a class="mod-chip hub-chip" href="#hub-cal">Simulateur Droits &amp; Taxes</a>
          <a class="mod-chip hub-chip" href="#hub-cmp">Comparateur Régimes</a>
          <a class="mod-chip" href="/modules/simulateur-fiscal">Simulateur Fiscal Import</a>
          <a class="mod-chip" href="/modules/valeur-douane">Valeur en Douane (WCO)</a>
          <a class="mod-chip" href="/modules/cgi-fiscal">Index du Code des Impôts — 296 art. CGI 2026</a>
          <a class="mod-chip" href="/modules/cgi-search">Recherche Fiscale CGI (IA)</a>
          <a class="mod-chip" href="/modules/tic-reference">Référence TIC</a>
          <a class="mod-chip" href="/modules/regime-change">Régime de Change</a>
          <a class="mod-chip" href="/modules/calc-conteneurs">Calculateur Conteneurs</a>
          <a class="mod-chip" href="/modules/regimes-economiques">Régimes Économiques</a>
          <a class="mod-chip" href="/modules/facilitation">Facilitation Douanière</a>
          <div class="stage-note">Simulateur et Comparateur partagent les mêmes données d'entrée (produit, valeur, origine) — pas de ressaisie entre les deux.</div>
        </div>
      </div>
      <div class="stage">
        <div class="stage-hdr"><span class="stage-num">03</span><div><div class="stage-title">Constitution du dossier</div><div class="stage-sub">Documents, autorisations, conformité produit</div></div></div>
        <div class="stage-body-inner">
          <a class="mod-chip" href="/modules/documents-sh">Documents par Code SH</a>
          <a class="mod-chip" href="/modules/autorisations-licences">Autorisations &amp; Licences</a>
          <a class="mod-chip" href="/modules/substances-dangereuses">Substances Dangereuses</a>
          <a class="mod-chip" href="/modules/marquage-warnings">Marquage &amp; Warnings</a>
          <a class="mod-chip" href="/modules/generateur-docs">Générateur Documents</a>
          <a class="mod-chip" href="/modules/transit-doc-generator">Générateur Doc Transit</a>
          <a class="mod-chip" href="/modules/procedures">Procédures Douanières</a>
          <a class="mod-chip" href="/modules/procedures-process">Procédures &amp; Régimes</a>
          <a class="mod-chip" href="/modules/calc-colis-sre">Calculateur Colis &amp; SRE</a>
          <div class="stage-note">Cluster le plus dense — Documents par Code SH devrait être auto-alimenté par la classification de l'étape 1. C'est le nœud à automatiser en priorité.</div>
        </div>
      </div>
      <div class="stage">
        <div class="stage-hdr"><span class="stage-num">04</span><div><div class="stage-title">Sécurisation et suivi</div><div class="stage-sub">Vérification, pénalités, contentieux, tracking</div></div></div>
        <div class="stage-body-inner">
          <a class="mod-chip hub-chip" href="#hub-dum">Vérificateur DUM</a>
          <a class="mod-chip hub-chip" href="#hub-sur">Surestaries &amp; Pénalités</a>
          <a class="mod-chip hub-chip" href="#hub-aud">Audit Douanier &amp; OEA</a>
          <a class="mod-chip hub-chip" href="#hub-ctx">Contentieux &amp; Litiges</a>
          <a class="mod-chip" href="/modules/risques">Contrôle des Risques — 38 situations</a>
          <a class="mod-chip" href="/modules/tracking">Tracking &amp; Intelligence</a>
          <a class="mod-chip" href="/modules/decisions-classement">Décisions de Classement (re-consultée en cas d'écart)</a>
          <a class="mod-chip" href="/modules/conseil">Conseil Personnalisé</a>
          <div class="stage-note">DUM et Audit convergent tous deux vers Contrôle des Risques. Surestaries traite l'urgence financière du retard portuaire, pendant que Contentieux prend le relais de l'Audit quand un contrôle a posteriori débouche sur un redressement — quatre entrées, un même nœud de sécurisation.</div>
        </div>
      </div>
      <div class="stage">
        <div class="stage-hdr"><span class="stage-num">05</span><div><div class="stage-title">Intelligence continue</div><div class="stage-sub">Veille, stratégie, marché — accessible à tout moment</div></div></div>
        <div class="stage-body-inner">
          <a class="mod-chip hub-chip" href="#hub-vrg">Veille Réglementaire &amp; LF 2026</a>
          <a class="mod-chip" href="/modules/alertes-fiscales">Alertes Fiscales</a>
          <a class="mod-chip" href="/modules/oea">Opérateur Économique Agréé (fiche détaillée)</a>
          <a class="mod-chip" href="/modules/simulateur#majoration-tbi">Veille Légale &amp; LF 2026</a>
          <a class="mod-chip" href="/modules/intelligence-fiscale">Intelligence Fiscale</a>
          <a class="mod-chip" href="/modules/intelligence-strategique">Intelligence Stratégique</a>
          <a class="mod-chip" href="/modules/intelligence-import">Intelligence Import</a>
          <a class="mod-chip" href="/modules/mondoscope">Global MondoScope</a>
          <a class="mod-chip" href="/modules/index-commerce">Index Commerce International</a>
          <a class="mod-chip" href="/modules/analyses">Analyses Stratégiques</a>
          <a class="mod-chip" href="/modules/douane-engineering">Douane Engineering</a>
          <a class="mod-chip" href="/modules/export">Export</a>
          <div class="stage-note">Couche transversale, pas séquentielle — consultée depuis n'importe quelle étape, sans logique d'enchaînement forcée.</div>
        </div>
      </div>
    </div>
  </div>

  <div class="cv-section" id="cv-ressources">
    <div class="cv-section-hdr">
      <div class="cv-eyebrow">MENU SECONDAIRE</div>
      <div class="cv-title">Vos outils de stratégie et d'aide à la décision</div>
      <div class="cv-sub">Modules de référence et données professionnelles adaptés au service de votre entreprise.</div>
    </div>
    <div class="cv-res-grid">
      <a class="hub-card" href="/modules/faq"><span class="hub-num n-neutral">FAQ</span><div><div class="hub-name">FAQ Douanière</div><div class="hub-desc">173 questions couvrant les Titres 1 à 11 — la réponse la plus rapide à une incertitude ponctuelle sur la réglementation.</div></div></a>
      <a class="hub-card" href="/modules/glossaire-douanier"><span class="hub-num n-neutral">GLO</span><div><div class="hub-name">Glossaire Douanier FR/AR</div><div class="hub-desc">1 081 termes douaniers en français et en arabe, présentés en double panneau pour une consultation rapide.</div></div></a>
      <a class="hub-card" href="/modules/carte-bureauxdouaniers"><span class="hub-num n-neutral">PRT</span><div><div class="hub-name">Carte des Bureaux Douaniers</div><div class="hub-desc">Localisation et codes de tous les bureaux ADII — utile pour orienter un dossier vers le bon point d'entrée physique.</div></div></a>
      <a class="hub-card" href="/modules/logistique2"><span class="hub-num n-neutral">REF</span><div><div class="hub-name">Référence Logistique</div><div class="hub-desc">Données de fret, transit et transport consolidées pour appuyer une décision logistique.</div></div></a>
      <a class="hub-card" href="/community"><span class="hub-num n-neutral">COM</span><div><div class="hub-name">Communauté</div><div class="hub-desc">Forum, questions-réponses et partage de circulaires en direct entre professionnels du secteur.</div></div></a>
      <a class="hub-card" href="/modules/douane-engineering"><span class="hub-num n-neutral">ENG</span><div><div class="hub-name">Douane Engineering</div><div class="hub-desc">Méthodologie experte et références structurantes pour l'ingénierie des processus douaniers.</div></div></a>
    </div>
  </div>
</div>

<footer><div class="footer-inner">
  <div class="footer-logo">Transit<em>-</em>IA<sup style="font-size:9px;color:#8A8078;letter-spacing:.06em;vertical-align:super"> MAROC</sup></div>
  <div class="footer-links"><a href="#">Mentions légales</a><a href="#">Confidentialité</a><a href="#">Tarifs</a><a href="#">Contact</a><a href="#">API</a></div>
  <div class="footer-copy">© 2026 Transit-IA — TOUS DROITS RÉSERVÉS</div>
</div></footer>

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
<div class="preview-bar">⚡ PRÉVISUALISATION STATIQUE — Transit-IA · sitedemo1 · 39 modules référencés</div>
`;

const scriptContent = `
window.__SB_URL__ = '';
window.__SB_KEY__ = '';
var LANGS={
  fr:{h1:"L'intelligence douanière<br><strong>à portée de question</strong>",sub:"Posez vos questions sur la réglementation douanière marocaine — circulaires ADII, tarifs, procédures, régimes économiques."},
  ar:{h1:"الذكاء الجمركي<br><strong>في متناول سؤالك</strong>",sub:"اطرح أسئلتك حول التنظيم الجمركي المغربي — المناشير، التعريفات، الإجراءات."},
  en:{h1:"Moroccan customs intelligence<br><strong>at your fingertips</strong>",sub:"Ask questions about Moroccan customs regulations — ADII circulars, tariffs, procedures, economic regimes."}
};

function setMode(m){
  document.getElementById('chat-view').style.display=m==='chat'?'block':'none';
  document.getElementById('classic-view').style.display=m==='classic'?'block':'none';
  var sb=document.getElementById('sidebar-panel');
  if(sb)sb.style.display=m==='chat'?'flex':'none';
  var bc=document.getElementById('btn-chat'); if(bc)bc.classList.toggle('active',m==='chat');
  var bx=document.getElementById('btn-classic'); if(bx)bx.classList.toggle('active',m==='classic');
  if(m==='classic')window.scrollTo({top:0,behavior:'smooth'});
}

function setLang(l,btn){
  document.querySelectorAll('.lang-b').forEach(function(b){b.classList.remove('on');});
  if(btn)btn.classList.add('on');
  var d=LANGS[l];
  if(d){
    document.getElementById('h1-txt').innerHTML=d.h1;
    document.getElementById('sub-txt').textContent=d.sub;
  }
  document.documentElement.lang=l;
  document.documentElement.dir=l==='ar'?'rtl':'ltr';
}

async function submitChatQuestion(){
  var input = document.getElementById('chat-input');
  var box = document.getElementById('chat-inline-response');
  var question = input.value.trim();
  if(!question) return;

  box.style.display = 'block';
  box.className = 'chat-inline-response loading';
  box.textContent = 'Recherche en cours...';

  try {
    var res = await fetch('/api/chat-homepage', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ message: question, history: [] })
    });
    var data = await res.json();
    box.className = 'chat-inline-response';
    box.textContent = data.answer || "Aucune réponse disponible pour l'instant.";
  } catch(e) {
    box.className = 'chat-inline-response';
    box.textContent = "Erreur de connexion — réessayez.";
  }
}

function openFaq(question){
  if(window.DouaneChat){
    window.DouaneChat.send(question);
    var root=document.getElementById('douane-chat-root');
    if(root)root.scrollIntoView({behavior:'smooth',block:'center'});
  }
}

function escHtml(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function openModal(n){document.getElementById('overlay-'+n).classList.add('open');}
function closeModal(n){document.getElementById('overlay-'+n).classList.remove('open');}
document.addEventListener('keydown',function(e){if(e.key==='Escape'){closeModal('register');closeModal('login');}});

function initDate(){
  var now=new Date();
  var days=['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
  var months=['janvier','f\u00e9vrier','mars','avril','mai','juin','juillet','ao\u00fbt','septembre','octobre','novembre','d\u00e9cembre'];
  var el1=document.getElementById('db-day');
  var el2=document.getElementById('db-date-full');
  var el3=document.getElementById('db-hijri');
  if(el1)el1.textContent=days[now.getDay()];
  if(el2)el2.textContent=now.getDate()+' '+months[now.getMonth()]+' '+now.getFullYear();
  if(el3)el3.textContent=toHijri(now);
}

function toHijri(d){
  var jd=Math.floor((d.getTime()/86400000)+2440587.5);
  var l=jd-1948440+10632;var n=Math.floor((l-1)/10631);l=l-10631*n+354;
  var j=(Math.floor((10985-l)/5965))+(Math.floor((l-317)/5536))+(Math.floor(l/15)+1)%2+(Math.floor((3+11*Math.floor(((l+5)%30)/5))/11))%2;
  l=l-Math.floor((29.5001*j+29)/30)+1;
  var year=19*n+j-16;var month=Math.floor((l-1)/29)+1;var day=l%(month===1?30:29)||1;
  var hM=['Moharram','Safar','Rabi I','Rabi II','Joumada I','Joumada II','Rajab','Chaabane','Ramadan','Chawwal','Dhou al-Qi','Dhou al-Hi'];
  return day+' '+hM[month-1]+' '+year+' H';
}

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
  if(!email||!pwd){alert('Email et mot de passe requis');return;}
  if(pwd.length<8){alert('Mot de passe trop court (8 caract\u00e8res minimum)');return;}
  var btn=document.querySelector('#overlay-register .m-submit');
  if(btn)btn.textContent='CR\u00c9ATION...';
  try{
    var res=await fetch('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email,password:pwd,nom:nom,profil:profil})});
    var data=await res.json();
    if(!res.ok){alert(data.error||'Erreur inscription');if(btn)btn.textContent='D\u00c9MARRER MON ESSAI GRATUIT \u2192';return;}
    closeModal('register');
    window.location.href='/?welcome=1';
  }catch(e){alert('Erreur r\u00e9seau');if(btn)btn.textContent='D\u00c9MARRER MON ESSAI GRATUIT \u2192';}
}

async function loadLatestCirculaires(){
  var el=document.getElementById('circulaires-list');
  if(!el)return;
  try{
    // ✅ Lecture depuis window — variables injectées par Next.js (jamais en dur dans le code)
    var SB=window.__SB_URL__;
    var KEY=window.__SB_KEY__;
    if(!SB||!KEY){
      el.innerHTML='<div style="padding:.75rem 1rem;font-size:11px;color:var(--ink3)">Configuration manquante.</div>';
      return;
    }
    var res=await fetch(SB+'/rest/v1/circulaires?select=numero,date,objet&order=date.desc&limit=3',{headers:{apikey:KEY,Authorization:'Bearer '+KEY}});
    var data=await res.json();
    if(!Array.isArray(data)||!data.length){el.innerHTML='<div style="padding:.75rem 1rem;font-size:11px;color:var(--ink3)">Aucune circulaire.</div>';return;}
    el.innerHTML='';
    data.forEach(function(row){
      var d=row.date?new Date(row.date):null;
      var ds=d?d.toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'}):'';
      var obj=row.objet?row.objet.slice(0,60)+(row.objet.length>60?'...':''):'';
      var div=document.createElement('div');
      div.className='citem';
      div.innerHTML='<div class="c-num">N\u00b0 '+row.numero+'</div><div class="c-obj">'+escHtml(obj)+'</div><div class="c-date">'+ds+'</div>';
      div.addEventListener('click',function(){openFaq('Que dit la circulaire '+row.numero+' ?');});
      el.appendChild(div);
    });
  }catch(e){el.innerHTML='<div style="padding:.75rem 1rem;font-size:11px;color:var(--ink3)">Erreur de chargement.</div>';}
}

loadLatestCirculaires();
initDate();

// ---- Navigation portée depuis Index v2 : ancrage vers les hubs (mode classique) ----
document.querySelectorAll('#classic-view .hub-card, #classic-view .mod-chip').forEach(function(el){
  el.addEventListener('click', function(e){
    var href = el.getAttribute('href');
    if(!href || !href.startsWith('#')) return; // lien réel (/modules/...) : navigation normale
    e.preventDefault();
    var target = document.querySelector(href);
    if(target){
      target.scrollIntoView({behavior:'smooth', block:'start'});
      target.style.borderColor = 'var(--gold)';
      setTimeout(function(){ target.style.borderColor = ''; }, 900);
    }
  });
});
`;

export default function Home() {
  return (
    <>
      <Head>
        <title>Transit-IA — Intelligence Douanière Marocaine</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div dangerouslySetInnerHTML={{ __html: bodyHTML }} />
      <script dangerouslySetInnerHTML={{ __html: scriptContent }} />
    </>
  );
}
