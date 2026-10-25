/* static-helpers.js — interactivité de la copie statique de la démo Import-eXPert.
   Remplace React lorsque les pages sont ouvertes directement depuis le disque
   (menu mobile, onglets de profils, diagnostic, barre « dossier en cours »). */
(function () {
  'use strict';
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  // Menu mobile
  var burger = document.querySelector('.x-burger');
  var mnav = document.querySelector('.x-mnav');
  if (burger && mnav) {
    burger.addEventListener('click', function () {
      var open = mnav.hasAttribute('hidden');
      if (open) mnav.removeAttribute('hidden'); else mnav.setAttribute('hidden', '');
      burger.setAttribute('aria-expanded', String(open));
      burger.textContent = open ? '✕' : '☰';
    });
  }

  // Onglets de profils
  $$('[data-tab]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = btn.getAttribute('data-tab');
      $$('[data-tab]').forEach(function (b) {
        var on = b === btn; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on));
      });
      $$('[data-panel]').forEach(function (p) {
        if (p.getAttribute('data-panel') === id) p.removeAttribute('hidden'); else p.setAttribute('hidden', '');
      });
    });
  });

  // Diagnostic en trois questions
  var answers = {};
  var scoreEl = document.getElementById('x-score');
  var niveauEl = document.getElementById('x-niveau');
  $$('[data-q]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var q = btn.getAttribute('data-q');
      $$('[data-q="' + q + '"]').forEach(function (b) { b.classList.toggle('on', b === btn); });
      answers[q] = Number(btn.getAttribute('data-v'));
      var keys = Object.keys(answers);
      var total = $$('.x-q').length;
      if (keys.length === total && scoreEl && niveauEl) {
        var s = keys.reduce(function (a, k) { return a + answers[k]; }, 0);
        var n = s >= 70 ? 'Exposition élevée' : s >= 35 ? 'Exposition modérée' : 'Exposition maîtrisée';
        scoreEl.textContent = String(s);
        niveauEl.textContent = n + '. Indication sommaire, à confirmer par l’Audit Express.';
      }
    });
  });

  // Recherche de code SH depuis l'accueil
  var form = document.querySelector('form.x-try');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = form.querySelector('input');
      var q = input && input.value.trim();
      var target = form.getAttribute('data-target') || 'modules/classement.html';
      window.location.href = q ? target + '?q=' + encodeURIComponent(q) : target;
    });
  }

  // IXP-Assistant : sans serveur, la question ne peut pas être envoyée ; dictée possible
  var box = document.querySelector('[data-assistant]');
  if (box) {
    var ain = box.querySelector('[data-assist-input]');
    var ast = box.querySelector('[data-assist-status]');
    var send = function () {
      if (!ain.value.trim()) { ain.focus(); return; }
      ast.textContent = 'Copie hors ligne : connectez-vous sur le site pour interroger IXP-Assistant.';
    };
    var go = box.querySelector('[data-assist-submit]');
    if (go) go.addEventListener('click', send);
    ain.addEventListener('keydown', function (e) { if (e.key === 'Enter') send(); });
    var mic = box.querySelector('[data-assist-mic]');
    var Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (mic && Ctor) {
      var rec = new Ctor(); rec.lang = 'fr-FR'; var on = false;
      rec.onresult = function (e) { ain.value = e.results[0][0].transcript; ast.textContent = 'Question captée.'; };
      rec.onend = function () { on = false; mic.classList.remove('on'); };
      rec.onerror = function () { on = false; mic.classList.remove('on'); ast.textContent = 'Micro non disponible.'; };
      mic.addEventListener('click', function () { if (on) { rec.stop(); return; } on = true; mic.classList.add('on'); ast.textContent = 'Je vous écoute…'; rec.start(); });
    } else if (mic) { mic.style.display = 'none'; }
  }

  // Barre « dossier en cours » : conservée d'un espace à l'autre
  var KEY = 'ixp-dossier';
  var fields = $$('[data-k]');
  if (fields.length) {
    var ctx = {};
    try { ctx = JSON.parse(sessionStorage.getItem(KEY) || '{}'); } catch (e) { ctx = {}; }
    var tools = $$('a[data-base]');
    tools.forEach(function (a) { a.setAttribute('data-file', a.getAttribute('href').split('?')[0]); });
    var refresh = function () {
      var qs = Object.keys(ctx).filter(function (k) { return ctx[k]; })
        .map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(ctx[k]); }).join('&');
      tools.forEach(function (a) { var f = a.getAttribute('data-file'); a.setAttribute('href', qs ? f + '?' + qs : f); });
    };
    fields.forEach(function (input) {
      var k = input.getAttribute('data-k');
      if (ctx[k]) input.value = ctx[k];
      input.addEventListener('input', function () {
        ctx[k] = input.value;
        try { sessionStorage.setItem(KEY, JSON.stringify(ctx)); } catch (e) { /* stockage indisponible */ }
        refresh();
      });
    });
    refresh();
  }
})();
