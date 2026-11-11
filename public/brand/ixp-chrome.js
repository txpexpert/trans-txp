/* public/brand/ixp-chrome.js — en-tête et pied de page communs pour les pages HTML autonomes
   (outils, kits). Mêmes logo, navigation, couleurs et polices que la page « Présentation de
   notre plateforme en 5 espaces ». Styles : /brand/ixp-chrome.css.
   - Rien n'est ajouté quand la page est affichée dans un cadre (onglets des espaces) :
     la page parente porte déjà l'en-tête.
   - Le contenu de l'outil n'est pas modifié ; seules ses couleurs et polices suivent la charte
     (classe ixp-theme sur <html>, posée dans le fichier pour les pages à fond clair). */
(function () {
  var me = document.currentScript && document.currentScript.src || '';
  var offline = /^file:/.test(me);
  var base = me.replace(/brand\/ixp-chrome\.js.*$/, '');
  function href(route) {
    if (!offline) return route;
    var p = route.split('#'), path = p[0], hash = p[1] ? '#' + p[1] : '';
    return base + (path === '/' ? 'index.html' : path.replace(/^\//, '') + '.html') + hash;
  }
  function inFrame() { try { return window.self !== window.top; } catch (e) { return true; } }

  var NAV = [
    ['/plateforme', 'Présentation', 't-blue'],
    ['/plateforme#profils', 'Solutions', 't-green'],
    ['/espaces/bibliotheque', 'Bibliothèque', 't-teal'],
    ['/expertise', 'Expertise', 't-violet'],
    ['/tarifs', 'Tarifs', 't-amber']
  ];
  var CHAIN = [['qualifier', 'Qualifier'], ['optimiser', 'Optimiser'], ['chiffrer', 'Chiffrer'], ['executer', 'Exécuter'], ['securiser', 'Sécuriser']];
  var LOGO = base + 'brand/ixp-logo-128.png';

  function a(h, t, c) { return '<a href="' + href(h) + '"' + (c ? ' class="' + c + '"' : '') + '>' + t + '</a>'; }

  var AR = (document.documentElement.getAttribute('lang') || '').slice(0, 2) === 'ar';
  var NAV_AR = [
    ['/ar', 'الرئيسية', 't-blue'],
    ['/ar/diagnostic', 'التشخيص', 't-green'],
    ['/ar/tarifs', 'العروض والأسعار', 't-amber'],
    ['/tools/enquete-barometre-ar.html', 'بارومتر 2026', 't-teal'],
    ['/', 'Français', 't-slate']
  ];
  function headerAr() {
    var nav = NAV_AR.map(function (n) { return a(n[0], n[1], 'x-tile ' + n[2]); }).join('');
    var mnav = NAV_AR.map(function (n) { return a(n[0], n[1], n[2]); }).join('') + a('/auth/login', 'تسجيل الدخول', 't-rose');
    return '<header class="x-hdr"><div class="x-wrap">' +
      '<a href="' + href('/ar') + '" class="x-logo" dir="ltr" aria-label="IXP-Import-eXPert"><img src="' + LOGO + '" width="38" height="38" alt="IXP Import-eXPert" class="ixp-logo-img" data-ixp-logo=""><span>Import<b>-</b>eXPert<sup>MAROC</sup></span></a>' +
      '<nav class="x-nav" aria-label="التنقل الرئيسي">' + nav + '</nav>' +
      '<div class="x-act">' + a('/auth/login', 'تسجيل الدخول', 'x-tile t-rose x-login') +
      '<button type="button" class="x-burger" aria-expanded="false" aria-label="القائمة">☰</button></div></div>' +
      '<nav class="x-mnav" aria-label="التنقل" hidden>' + mnav + '</nav></header>';
  }
  function footerAr() {
    return '<footer class="x-ftr"><div class="x-wrap"><div class="x-ftr-grid">' +
      '<div><div class="x-logo" dir="ltr"><img src="' + LOGO + '" width="34" height="34" alt="" class="ixp-logo-img" data-ixp-logo=""><span>Import<b>-</b>eXPert<sup>MAROC</sup></span></div>' +
      '<p>منصة تؤهّل عمليات الاستيراد وتحسب كلفتها وتؤمّنها قبل الاستخلاص الجمركي، يصممها ويؤطرها خبراء جمركيون.</p></div>' +
      '<div><h5>المنصة</h5><ul><li>' + a('/ar/diagnostic', 'تشخيص الامتثال') + '</li><li>' + a('/ar/tarifs', 'العروض والأسعار') + '</li><li>' + a('/tools/enquete-barometre-ar.html', 'بارومتر 2026') + '</li><li>' + a('/contact', 'اتصلوا بنا') + '</li></ul></div>' +
      '<div><h5>روابط</h5><ul><li>' + a('/', 'Version française') + '</li><li><a href="https://www.douane.gov.ma" target="_blank" rel="noreferrer">douane.gov.ma ↗</a></li><li><a href="https://www.portnet.ma" target="_blank" rel="noreferrer">portnet.ma ↗</a></li></ul></div>' +
      '</div><div class="x-ftr-bot"><span>© 2026 IXP-Import-eXPert · import-expert.ma</span></div></div></footer>';
  }

  function header() {
    var nav = NAV.map(function (n) { return a(n[0], n[1], 'x-tile ' + n[2]); }).join('');
    var mnav = NAV.map(function (n) { return a(n[0], n[1], n[2]); }).join('') + a('/diagnostic', 'Diagnostic de conformité', 't-red') + a('/auth/login', 'Connexion', 't-rose');
    return '<header class="x-hdr"><div class="x-wrap">' +
      '<a href="' + href('/') + '" class="x-logo" aria-label="IXP-Import-eXPert, accueil"><img src="' + LOGO + '" width="38" height="38" alt="IXP Import-eXPert" class="ixp-logo-img" data-ixp-logo=""><span>Import<b>-</b>eXPert<sup>MAROC</sup></span></a>' +
      '<nav class="x-nav" aria-label="Navigation principale">' + nav + '</nav>' +
      '<div class="x-act">' + a('/auth/login', 'Connexion', 'x-tile t-rose x-login') +
      '<a href="' + href('/plateforme#video') + '" class="x-btn x-btn-dark"><span class="x-long">▶ Voir la présentation</span><span class="x-short">▶ Présentation</span></a>' +
      '<button type="button" class="x-burger" aria-expanded="false" aria-label="Menu">☰</button></div></div>' +
      '<nav class="x-mnav" aria-label="Navigation mobile" hidden>' + mnav + '</nav></header>';
  }

  function footer() {
    return '<footer class="x-ftr"><div class="x-wrap"><div class="x-ftr-grid">' +
      '<div><div class="x-logo"><img src="' + LOGO + '" width="34" height="34" alt="" class="ixp-logo-img" data-ixp-logo=""><span>Import<b>-</b>eXPert<sup>MAROC</sup></span></div>' +
      '<p>La plateforme qui qualifie, chiffre et sécurise vos opérations d’import avant d’initier vos opérations. Conçue et animée par des experts douaniers.</p></div>' +
      '<div><h5>La chaîne</h5><ul>' + CHAIN.map(function (c) { return '<li>' + a('/espaces/' + c[0], c[1]) + '</li>'; }).join('') + '</ul></div>' +
      '<div><h5>Plateforme</h5><ul><li>' + a('/plateforme', 'Présentation') + '</li><li>' + a('/espaces/bibliotheque', 'Bibliothèque') + '</li><li>' + a('/diagnostic', 'Diagnostic de conformité') + '</li><li>' + a('/expertise', 'Expertise et services') + '</li></ul></div>' +
      '<div><h5>Société</h5><ul><li>' + a('/tarifs', 'Tarifs') + '</li><li>' + a('/contact', 'Contact') + '</li><li>' + a('/cgu', 'Conditions d’utilisation') + '</li><li>' + a('/confidentialite', 'Confidentialité') + '</li></ul></div>' +
      '</div><div class="x-ftr-bot"><span>© 2026 IXP-Import-eXPert · import-expert.ma</span><span>Sources : circulaires ADII, Code des douanes, CGI 2026, IGOC 2026</span></div></div></footer>';
  }

  function run() {
    if (inFrame() || !document.body || document.getElementById('ixp-chrome-top')) return;
    var top = document.createElement('div');
    top.id = 'ixp-chrome-top'; top.className = 'xs ixp-chrome' + (AR ? ' xs-ar' : '');
    if (AR) top.setAttribute('dir', 'rtl');
    top.innerHTML = AR ? headerAr() : header();
    document.body.insertBefore(top, document.body.firstChild);
    var bottom = document.createElement('div');
    bottom.id = 'ixp-chrome-bottom'; bottom.className = 'xs ixp-chrome' + (AR ? ' xs-ar' : '');
    if (AR) bottom.setAttribute('dir', 'rtl');
    bottom.innerHTML = AR ? footerAr() : footer();
    document.body.appendChild(bottom);
    document.body.classList.add('ixp-chromed');
    var btn = top.querySelector('.x-burger'), mnav = top.querySelector('.x-mnav');
    btn.addEventListener('click', function () {
      var open = mnav.hasAttribute('hidden');
      if (open) mnav.removeAttribute('hidden'); else mnav.setAttribute('hidden', '');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open ? '✕' : '☰';
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
