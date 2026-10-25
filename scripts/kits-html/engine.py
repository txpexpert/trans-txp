"""Moteur commun des kits HTML Import-eXPert : gabarit, styles et scripts partagés.
Chaque kit fournit : métadonnées, menu (groupes et sections), contenu HTML des sections et script propre."""

CSS = r"""
:root{--ink:#14120F;--ink2:#3B3631;--ink3:#7A7168;--paper:#FAF7F0;--card:#fff;--line:#E6DCC7;--line2:#D6C9AC;
--gold:#A8822F;--gold2:#C9A84C;--navy:#153E82;--navy2:#0E2C5E;--red:#A82D3C;--green:#1E7346;--amber:#9A620C;--violet:#5B3FA0;--teal:#16706B;
--serif:'DM Serif Display',Georgia,serif;--sans:'DM Sans',system-ui,sans-serif;--mono:'JetBrains Mono',ui-monospace,monospace;--side:300px}
*{box-sizing:border-box}
html,body{margin:0}
body{font-family:var(--sans);background:var(--paper);color:var(--ink);line-height:1.6;font-size:15.5px}
a{color:var(--navy)}
/* En-tête */
.top{position:sticky;top:0;z-index:30;height:60px;display:flex;align-items:center;gap:14px;padding:0 18px;background:rgba(250,247,240,.96);backdrop-filter:blur(8px);border-bottom:1px solid var(--line)}
.top .brand{font-family:var(--serif);font-size:21px;text-decoration:none;color:var(--ink);white-space:nowrap}
.top .brand b{font-weight:400;color:var(--red)}
.top .kitname{font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;padding:5px 10px;border-radius:999px;background:var(--kb);color:var(--kc);border:1px solid var(--kl);white-space:nowrap}
.top .search{margin-left:auto;position:relative}
.top .search input{width:260px;font:inherit;font-size:14px;padding:8px 12px 8px 32px;border:1px solid var(--line2);border-radius:999px;background:#fff}
.top .search::before{content:'⌕';position:absolute;left:12px;top:6px;color:var(--ink3);font-size:16px}
.top .tbtn{font:inherit;font-size:13.5px;padding:8px 13px;border-radius:999px;border:1px solid var(--line2);background:#fff;cursor:pointer;white-space:nowrap;text-decoration:none;color:var(--ink)}
.top .tbtn:hover{border-color:var(--ink)}
.menubtn{display:none}
/* Mise en page */
.layout{display:grid;grid-template-columns:var(--side) minmax(0,1fr);min-height:calc(100vh - 60px)}
aside.side{position:sticky;top:60px;height:calc(100vh - 60px);overflow-y:auto;border-right:1px solid var(--line);background:#fff;padding:18px 14px 40px}
.side .kithead{padding:4px 8px 14px;border-bottom:1px solid var(--line);margin-bottom:10px}
.side .kithead .n{font-family:var(--mono);font-size:11px;letter-spacing:.14em;color:var(--kc)}
.side .kithead h2{font-family:var(--serif);font-weight:400;font-size:22px;line-height:1.15;margin:4px 0 6px}
.side .kithead p{margin:0;font-size:12.5px;color:var(--ink3)}
.side .grp{font-family:var(--mono);font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink3);margin:16px 8px 6px}
.side a.it{display:flex;gap:9px;align-items:flex-start;padding:7px 10px;border-radius:10px;text-decoration:none;color:var(--ink2);font-size:14px;line-height:1.3}
.side a.it .ic{flex:0 0 20px;text-align:center;font-size:14px}
.side a.it:hover{background:var(--paper)}
.side a.it.on{background:var(--kb);color:var(--kc);font-weight:600}
.side a.it .tag{margin-left:auto;font-family:var(--mono);font-size:9.5px;padding:2px 6px;border-radius:99px;background:var(--paper);color:var(--ink3);white-space:nowrap}
.side a.it.hide{display:none}
.side .nores{font-size:13px;color:var(--ink3);padding:8px 10px;display:none}
main.view{padding:34px 46px 80px;max-width:1040px;width:100%}
section.sec{display:none;animation:fade .2s ease}
section.sec.on{display:block}
@keyframes fade{from{opacity:.3;transform:translateY(4px)}to{opacity:1;transform:none}}
/* Typo */
.eb{font-family:var(--mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--kc)}
h1{font-family:var(--serif);font-weight:400;font-size:clamp(30px,3.6vw,42px);line-height:1.1;margin:8px 0 14px}
h1 em{color:var(--kc)}
h3{font-family:var(--serif);font-weight:400;font-size:23px;margin:26px 0 8px}
h4{font-size:15.5px;margin:18px 0 6px}
.lead{font-size:17px;color:var(--ink2);max-width:780px}
p{margin:0 0 12px}
.muted{color:var(--ink3);font-size:13.5px}
ul.l{padding-left:20px;margin:0 0 12px}ul.l li{margin-bottom:5px}
ol.l{padding-left:22px;margin:0 0 12px}ol.l li{margin-bottom:6px}
.ref{font-family:var(--mono);font-size:11.5px;color:var(--ink3)}
/* Encadrés */
.box{border-radius:14px;padding:16px 18px;margin:14px 0;border:1px solid var(--line);background:#fff}
.box.key{border-left:5px solid var(--kc);background:var(--kb);border-color:var(--kl)}
.box.warn{border-left:5px solid var(--red);background:#FCEEF0;border-color:#F0C9CF}
.box.ok{border-left:5px solid var(--green);background:#EBF6EF;border-color:#C3E3CF}
.box.tip{border-left:5px solid var(--gold);background:#FBF5E6;border-color:#E8D7A6}
.box b.t{display:block;margin-bottom:4px}
.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:16px 0}
.card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:16px;text-decoration:none;color:var(--ink);display:block;transition:all .15s}
.card:hover{border-color:var(--kc);transform:translateY(-2px)}
.card .ic{font-size:20px}
.card b{display:block;margin:6px 0 4px;font-size:15px}
.card span{font-size:13px;color:var(--ink3)}
.steps{counter-reset:s;display:grid;gap:10px;margin:14px 0}
.step{display:grid;grid-template-columns:38px 1fr;gap:12px;align-items:start;background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px 14px}
.step::before{counter-increment:s;content:counter(s);width:30px;height:30px;border-radius:50%;background:var(--kc);color:#fff;display:grid;place-items:center;font-family:var(--mono);font-size:12px}
/* Tableaux */
.tw{overflow-x:auto;margin:12px 0;border:1px solid var(--line);border-radius:12px;background:#fff}
table.t{width:100%;border-collapse:collapse;font-size:14px}
table.t th{text-align:left;font-weight:600;font-size:12px;letter-spacing:.03em;background:var(--kb);color:var(--kc);padding:9px 10px;border-bottom:1px solid var(--kl);white-space:nowrap}
table.t td{padding:9px 10px;border-bottom:1px solid var(--line);vertical-align:top}
table.t tr:last-child td{border-bottom:none}
table.t td.ref{white-space:nowrap}
/* Formulaires */
.form{display:grid;grid-template-columns:repeat(2,1fr);gap:12px 16px;background:#fff;border:1px solid var(--line);border-radius:14px;padding:18px;margin:12px 0}
.form.three{grid-template-columns:repeat(3,1fr)}
.form .full{grid-column:1/-1}
label.f{display:block;font-size:13px;font-weight:600;margin-bottom:5px}
label.f small{font-weight:400;color:var(--ink3);display:block}
input.i,select.i,textarea.i{width:100%;font:inherit;font-size:14.5px;padding:9px 11px;border:1px solid var(--line2);border-radius:9px;background:var(--paper)}
textarea.i{min-height:76px;resize:vertical}
input.i:focus,select.i:focus,textarea.i:focus{outline:none;border-color:var(--kc);background:#fff}
.btn{display:inline-flex;align-items:center;gap:7px;font:inherit;font-size:14px;font-weight:500;padding:9px 16px;border-radius:999px;border:1px solid var(--line2);background:#fff;color:var(--ink);cursor:pointer;text-decoration:none}
.btn:hover{border-color:var(--ink)}
.btn.p{background:var(--kc);border-color:var(--kc);color:#fff}
.btn.p:hover{filter:brightness(.92)}
.btn.s{padding:5px 11px;font-size:13px}
.btns{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}
/* Résultats */
.res{background:#fff;border:1px solid var(--line);border-radius:14px;padding:16px 18px;margin:12px 0}
.kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:10px 0}
.kpi{background:var(--paper);border-radius:12px;padding:12px 14px}
.kpi b{display:block;font-family:var(--serif);font-weight:400;font-size:28px;line-height:1.1;color:var(--kc)}
.kpi span{font-size:12.5px;color:var(--ink3)}
.pill{display:inline-block;font-family:var(--mono);font-size:11px;padding:3px 9px;border-radius:99px;white-space:nowrap}
.pill.g{background:#E6F1E8;color:var(--green)}.pill.r{background:#FCEEF0;color:var(--red)}.pill.a{background:#FCF4E3;color:var(--amber)}.pill.n{background:#EEF1F6;color:#3D4A63}
pre.out{white-space:pre-wrap;font-family:var(--sans);font-size:14.5px;line-height:1.6;background:#fff;border:1px dashed var(--line2);border-radius:12px;padding:16px 18px;margin:10px 0}
/* Check-lists */
.cl{list-style:none;padding:0;margin:10px 0}
.cl li{display:flex;gap:11px;align-items:flex-start;background:#fff;border:1px solid var(--line);border-radius:11px;padding:10px 12px;margin-bottom:7px}
.cl li input{margin-top:3px;width:18px;height:18px;accent-color:var(--kc);flex:0 0 18px}
.cl li.done{background:var(--kb);border-color:var(--kl)}
.cl li.done .tx{text-decoration:line-through;text-decoration-color:var(--ink3);color:var(--ink2)}
.cl li .rf{display:block;font-family:var(--mono);font-size:11px;color:var(--ink3);margin-top:2px}
.progress{height:8px;background:#EEE6D4;border-radius:99px;overflow:hidden;margin:8px 0 4px}
.progress i{display:block;height:100%;background:var(--kc);width:0;transition:width .2s}
/* Assistant (choix successifs) */
.wiz{background:#fff;border:1px solid var(--line);border-radius:14px;padding:18px;margin:12px 0}
.wiz .q{font-weight:600;margin-bottom:10px}
.wiz .opts{display:flex;flex-wrap:wrap;gap:8px}
.wiz .opt{font:inherit;font-size:14px;padding:9px 14px;border-radius:10px;border:1px solid var(--line2);background:#fff;cursor:pointer;text-align:left}
.wiz .opt:hover{border-color:var(--kc);background:var(--kb)}
.wiz .trail{font-size:12.5px;color:var(--ink3);margin-bottom:8px}
/* FAQ */
details.fq{background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px 16px;margin-bottom:8px}
details.fq summary{cursor:pointer;font-weight:600}
details.fq p{margin:8px 0 0;color:var(--ink2)}
/* Navigation bas de section */
.secnav{display:flex;justify-content:space-between;gap:10px;margin-top:36px;padding-top:18px;border-top:1px solid var(--line)}
.secnav a{display:flex;flex-direction:column;padding:10px 14px;border:1px solid var(--line);border-radius:12px;background:#fff;text-decoration:none;color:var(--ink);max-width:48%}
.secnav a:hover{border-color:var(--kc)}
.secnav a span{font-family:var(--mono);font-size:10.5px;letter-spacing:.1em;color:var(--ink3)}
.secnav a.nx{margin-left:auto;text-align:right}
.disclaimer{font-size:12px;color:var(--ink3);margin-top:26px}
.toast{position:fixed;bottom:22px;left:50%;transform:translateX(-50%);background:var(--ink);color:#fff;padding:10px 16px;border-radius:999px;font-size:14px;opacity:0;transition:opacity .2s;z-index:50;pointer-events:none}
.toast.on{opacity:1}
/* Responsive */
@media (max-width:980px){
  .layout{grid-template-columns:1fr}
  aside.side{position:fixed;left:0;top:60px;bottom:0;width:86%;max-width:340px;z-index:40;transform:translateX(-102%);transition:transform .2s;box-shadow:0 10px 40px rgba(0,0,0,.15)}
  body.menu aside.side{transform:none}
  .menubtn{display:inline-flex}
  main.view{padding:24px 18px 70px}
  .top .search input{width:160px}
  .cards{grid-template-columns:1fr 1fr}
}
@media (max-width:640px){
  .top .kitname,.top .hide-s{display:none}
  .top .search input{width:120px}
  .form,.form.three,.kpis,.cards{grid-template-columns:1fr}
}
@media print{
  .top,aside.side,.secnav,.btns,.noprint{display:none!important}
  .layout{display:block}
  main.view{padding:0;max-width:none}
  body.printall section.sec{display:block!important;break-after:page}
  body{background:#fff}
}
"""

JS = r"""
(function(){
'use strict';
var KIT=window.KIT||'kit';
window.$=function(s,r){return (r||document).querySelector(s);};
window.$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
window.store={get:function(k,d){try{var v=localStorage.getItem(KIT+':'+k);return v==null?d:JSON.parse(v);}catch(e){return d;}},
  set:function(k,v){try{localStorage.setItem(KIT+':'+k,JSON.stringify(v));}catch(e){}}};
window.toast=function(m){var t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(t._h);t._h=setTimeout(function(){t.classList.remove('on');},1800);};
window.fmtDate=function(d){return d?d.toLocaleDateString('fr-FR'):'—';};
window.parseDate=function(v){if(!v)return null;var d=new Date(v+'T00:00:00');return isNaN(d)?null:d;};
window.addMonths=function(d,m){var x=new Date(d);var day=x.getDate();x.setMonth(x.getMonth()+m);if(x.getDate()<day)x.setDate(0);return x;};
window.addDays=function(d,n){var x=new Date(d);x.setDate(x.getDate()+n);return x;};
window.daysBetween=function(a,b){return Math.round((b-a)/86400000);};
window.today=function(){var d=new Date();d.setHours(0,0,0,0);return d;};
window.num=function(v){if(v==null||v==='')return null;var n=parseFloat(String(v).replace(/\s/g,'').replace(',','.'));return isNaN(n)?null:n;};
window.money=function(n){return n==null||isNaN(n)?'—':Math.round(n).toLocaleString('fr-FR')+' DH';};
window.pct=function(x,d){return x==null||isNaN(x)?'—':(x*100).toFixed(d==null?1:d).replace('.',',')+' %';};
window.esc=function(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});};
window.download=function(content,name,type){var b=new Blob([content],{type:type||'text/plain;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},400);};
window.toCSV=function(rows){return '﻿'+rows.map(function(r){return r.map(function(v){return '"'+String(v==null?'':v).replace(/"/g,'""')+'"';}).join(';');}).join('\n');};
window.copyText=function(t){if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(t).then(function(){toast('Copié dans le presse-papiers');});}
  else{var ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');toast('Copié dans le presse-papiers');}catch(e){}ta.remove();}};

/* ── Navigation ── */
var secs=$$('section.sec'), links=$$('aside.side a.it');
function show(id){
  var s=document.getElementById(id)||secs[0]; if(!s)return;
  secs.forEach(function(x){x.classList.toggle('on',x===s);});
  links.forEach(function(a){a.classList.toggle('on',a.getAttribute('href')==='#'+s.id);});
  document.body.classList.remove('menu');
  window.scrollTo(0,0);setTimeout(function(){window.scrollTo(0,0);},0);
  document.title=(s.dataset.title||'')+' · '+document.body.dataset.kittitle;
  document.dispatchEvent(new CustomEvent('section:show',{detail:s.id}));
}
window.addEventListener('hashchange',function(){show(location.hash.slice(1));});
// Navigation précédent / suivant
secs.forEach(function(s,i){
  var nav=document.createElement('nav');nav.className='secnav';var h='';
  if(i>0)h+='<a href="#'+secs[i-1].id+'"><span>← PRÉCÉDENT</span>'+esc(secs[i-1].dataset.title)+'</a>';
  if(i<secs.length-1)h+='<a class="nx" href="#'+secs[i+1].id+'"><span>SUIVANT →</span>'+esc(secs[i+1].dataset.title)+'</a>';
  nav.innerHTML=h;s.appendChild(nav);
});
$('.menubtn').addEventListener('click',function(){document.body.classList.toggle('menu');});
$('#printsec').addEventListener('click',function(){document.body.classList.remove('printall');window.print();});
$('#printall').addEventListener('click',function(){document.body.classList.add('printall');window.print();setTimeout(function(){document.body.classList.remove('printall');},500);});
// Recherche : filtre le menu sur le contenu des sections
$('#q').addEventListener('input',function(){
  var q=this.value.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''),n=0;
  links.forEach(function(a){var s=document.getElementById(a.getAttribute('href').slice(1));
    var txt=(s?s.textContent:'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
    var hit=!q||txt.indexOf(q)>=0;a.classList.toggle('hide',!hit);if(hit)n++;});
  $$('aside.side .grp').forEach(function(g){var nx=g.nextElementSibling,any=false;while(nx&&!nx.classList.contains('grp')){if(nx.classList.contains('it')&&!nx.classList.contains('hide'))any=true;nx=nx.nextElementSibling;}g.style.display=any?'':'none';});
  $('.nores').style.display=n?'none':'block';
  if(q)document.body.classList.add('menu');
});

/* ── Check-lists sauvegardées : <ul class="cl" data-cl="cle"> ── */
$$('ul.cl[data-cl]').forEach(function(ul){
  var key='cl:'+ul.dataset.cl,st=store.get(key,{}),items=$$('li',ul);
  var bar=document.createElement('div');bar.innerHTML='<div class="progress"><i></i></div><div class="muted"></div>';ul.parentNode.insertBefore(bar,ul);
  function upd(){var n=items.filter(function(li){return li.querySelector('input').checked;}).length;
    bar.querySelector('i').style.width=(items.length?n/items.length*100:0)+'%';
    bar.querySelector('.muted').textContent=n+' point(s) vérifié(s) sur '+items.length+(n===items.length?' : check-list complète.':'');}
  items.forEach(function(li,i){var cb=document.createElement('input');cb.type='checkbox';cb.checked=!!st[i];li.insertBefore(cb,li.firstChild);li.classList.toggle('done',cb.checked);
    cb.addEventListener('change',function(){st[i]=cb.checked;store.set(key,st);li.classList.toggle('done',cb.checked);upd();});});
  var r=document.createElement('div');r.className='btns noprint';r.innerHTML='<button class="btn s" type="button">Tout décocher</button>';ul.parentNode.insertBefore(r,ul.nextSibling);
  r.querySelector('button').addEventListener('click',function(){st={};store.set(key,st);items.forEach(function(li){li.querySelector('input').checked=false;li.classList.remove('done');});upd();});
  upd();
});

/* ── Générateurs de modèles : <form data-gen="id"> + <template id="tpl-id"> + <pre id="out-id"> ── */
$$('form[data-gen]').forEach(function(f){
  var id=f.dataset.gen,tpl=document.getElementById('tpl-'+id),out=document.getElementById('out-'+id),key='gen:'+id,saved=store.get(key,{});
  $$('[name]',f).forEach(function(el){if(saved[el.name]!=null){if(el.type==='checkbox')el.checked=!!saved[el.name];else el.value=saved[el.name];}});
  function render(){var v={};$$('[name]',f).forEach(function(el){v[el.name]=el.type==='checkbox'?el.checked:el.value;});store.set(key,v);
    var t=tpl.innerHTML.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,function(_,k,body){return v[k]?body:'';})
      .replace(/\{\{(\w+)\}\}/g,function(_,k){var x=v[k];return x?esc(x):'…………………';});
    var tmp=document.createElement('div');tmp.innerHTML=t;out.textContent=tmp.textContent.replace(/\n{3,}/g,'\n\n').trim();
    document.dispatchEvent(new CustomEvent('gen:'+id,{detail:v}));}
  f.addEventListener('input',render);f.addEventListener('change',render);render();
  var b=document.createElement('div');b.className='btns noprint';
  b.innerHTML='<button class="btn p" type="button" data-a="copy">Copier le texte</button><button class="btn" type="button" data-a="dl">Télécharger (.txt)</button><button class="btn" type="button" data-a="reset">Effacer les champs</button>';
  out.parentNode.insertBefore(b,out.nextSibling);
  b.addEventListener('click',function(e){var a=e.target.dataset.a;if(a==='copy')copyText(out.textContent);if(a==='dl')download(out.textContent,id+'.txt');
    if(a==='reset'){f.reset();store.set(key,{});render();}});
});

/* ── Tableaux de suivi enregistrés : window.LocalTable(conteneur, config) ── */
window.LocalTable=function(root,cfg){
  var rows=store.get('tbl:'+cfg.key,null);if(rows==null){rows=cfg.example?[cfg.example]:[];}
  function save(){store.set('tbl:'+cfg.key,rows);}
  function draw(){
    var h='<div class="btns noprint"><button class="btn p" type="button" data-a="add">+ Ajouter une ligne</button><button class="btn" type="button" data-a="csv">Exporter (CSV)</button><button class="btn" type="button" data-a="json">Sauvegarder (fichier)</button><label class="btn" style="cursor:pointer">Restaurer<input type="file" accept="application/json" hidden data-a="imp"></label></div>';
    if(cfg.summary)h+='<div class="kpis">'+cfg.summary(rows)+'</div>';
    h+='<div class="tw"><table class="t"><tr>'+cfg.cols.map(function(c){return '<th>'+esc(c.label)+'</th>';}).join('')+'<th></th></tr>';
    if(!rows.length)h+='<tr><td colspan="'+(cfg.cols.length+1)+'" class="muted">Aucune ligne. Cliquez sur « Ajouter une ligne ».</td></tr>';
    rows.forEach(function(r,i){h+='<tr>'+cfg.cols.map(function(c){
      if(c.calc)return '<td>'+c.calc(r)+'</td>';
      var v=r[c.k]==null?'':r[c.k];
      if(c.type==='select')return '<td><select class="i" style="min-width:'+(c.w||150)+'px" data-r="'+i+'" data-k="'+c.k+'">'+c.opts.map(function(o){return '<option'+(o===v?' selected':'')+'>'+esc(o)+'</option>';}).join('')+'</select></td>';
      return '<td><input class="i" style="min-width:'+(c.w||110)+'px" type="'+(c.type||'text')+'" data-r="'+i+'" data-k="'+c.k+'" value="'+esc(v)+'"></td>';
    }).join('')+'<td><button class="btn s" type="button" data-del="'+i+'" title="Supprimer">✕</button></td></tr>';});
    h+='</table></div>';root.innerHTML=h;
  }
  root.addEventListener('change',function(e){var el=e.target;
    if(el.dataset.a==='imp'){var fr=new FileReader();fr.onload=function(){try{var d=JSON.parse(fr.result);if(Array.isArray(d)){rows=d;save();draw();toast('Données restaurées');}}catch(x){toast('Fichier non reconnu');}};fr.readAsText(el.files[0]);return;}
    if(el.dataset.r!=null){rows[+el.dataset.r][el.dataset.k]=el.value;save();draw();}});
  root.addEventListener('click',function(e){var el=e.target;
    if(el.dataset.del!=null){if(confirm('Supprimer cette ligne ?')){rows.splice(+el.dataset.del,1);save();draw();}}
    if(el.dataset.a==='add'){rows.push({});save();draw();}
    if(el.dataset.a==='csv'){download(toCSV([cfg.cols.map(function(c){return c.label;})].concat(rows.map(function(r){return cfg.cols.map(function(c){return c.calc?c.calc(r).replace(/<[^>]+>/g,''):r[c.k];});}))),cfg.key+'.csv','text/csv;charset=utf-8');}
    if(el.dataset.a==='json'){download(JSON.stringify(rows,null,2),cfg.key+'.json','application/json');}});
  draw();
};

/* ── Assistants à choix successifs : window.Wizard(conteneur, arbre, départ) ── */
window.Wizard=function(root,tree,start){
  var trail=[];
  function draw(id){var n=tree[id];
    var h='<div class="wiz">';
    if(trail.length)h+='<div class="trail">'+trail.map(function(t){return esc(t);}).join(' → ')+'</div>';
    if(n.q){h+='<div class="q">'+n.q+'</div>'+(n.h?'<p class="muted">'+n.h+'</p>':'')+'<div class="opts">'+n.o.map(function(o,i){return '<button class="opt" type="button" data-i="'+i+'">'+o[0]+'</button>';}).join('')+'</div>';}
    else{h+=n.r;}
    h+='<div class="btns noprint" style="margin-top:14px">'+(trail.length?'<button class="btn s" type="button" data-back>← Revenir</button>':'')+(trail.length?'<button class="btn s" type="button" data-restart>Recommencer</button>':'')+'</div></div>';
    root.innerHTML=h;root.dataset.node=id;
  }
  var hist=[];
  root.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;var n=tree[root.dataset.node];
    if(b.dataset.i!=null){var o=n.o[+b.dataset.i];hist.push(root.dataset.node);trail.push(o[0].replace(/<[^>]+>/g,''));draw(o[1]);}
    else if(b.hasAttribute('data-back')){trail.pop();draw(hist.pop());}
    else if(b.hasAttribute('data-restart')){trail=[];hist=[];draw(start);}});
  draw(start);
};

document.dispatchEvent(new CustomEvent('kit:ready'));
if('scrollRestoration' in history)history.scrollRestoration='manual';
show(location.hash.slice(1));
window.addEventListener('load',function(){setTimeout(function(){window.scrollTo(0,0);},30);});
})();
"""

FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet">'

DISCLAIMER = ("Outil d’aide à la conformité établi à partir du Guide des procédures douanières Maroc (éd. 2026, à jour au 04/10/2026) "
              "et du référentiel Import Process Management. Il ne se substitue ni aux textes officiels ni à une consultation : avant toute opération, "
              "vérifiez que le texte cité n’a pas été modifié. Les données saisies restent dans votre navigateur ; utilisez « Sauvegarder » pour les conserver.")


def build(kit):
    """kit : dict(id, num, title, short, color(c,b,l), intro, groups=[(groupe, [(id, icône, titre, tag, html)])], script)"""
    c, b, l = kit['color']
    nav, body = [], []
    for g, items in kit['groups']:
        nav.append(f'<div class="grp">{g}</div>')
        for sid, ic, title, tag, html in items:
            t = f'<span class="tag">{tag}</span>' if tag else ''
            nav.append(f'<a class="it" href="#{sid}"><span class="ic">{ic}</span><span>{title}</span>{t}</a>')
            body.append(f'<section class="sec" id="{sid}" data-title="{title}">{html}<p class="disclaimer">{DISCLAIMER}</p></section>')
    return f"""<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{kit['title']} | Import-eXPert</title><meta name="description" content="{kit['intro']}">
{FONTS}<style>{CSS}
:root{{--kc:{c};--kb:{b};--kl:{l}}}</style></head>
<body data-kittitle="{kit['title']}">
<header class="top">
  <button class="tbtn menubtn" type="button" aria-label="Ouvrir le menu">☰ Menu</button>
  <a class="brand" href="/">Import<b>-</b>eXPert</a>
  <span class="kitname">{kit['num']} · {kit['short']}</span>
  <div class="search"><input id="q" type="search" placeholder="Rechercher dans le kit" aria-label="Rechercher dans le kit"></div>
  <button class="tbtn hide-s" id="printsec" type="button">Imprimer la page</button>
  <button class="tbtn hide-s" id="printall" type="button">Imprimer le kit</button>
</header>
<div class="layout">
  <aside class="side" aria-label="Sommaire du kit">
    <div class="kithead"><div class="n">{kit['num']}</div><h2>{kit['title']}</h2><p>{kit['intro']}</p></div>
    {''.join(nav)}
    <div class="nores">Aucune rubrique ne contient ce terme.</div>
  </aside>
  <main class="view">{''.join(body)}</main>
</div>
<div class="toast" id="toast" role="status"></div>
<script>window.KIT='{kit['id']}';</script>
<script>{kit.get('script', '')}</script>
<script>{JS}</script>
</body></html>"""
