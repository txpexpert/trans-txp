"""Génère la charte IXP pour les pages autonomes et la recopie dans styles/site.css.

  python3 scripts/brand/build_chrome.py

- public/brand/ixp-chrome.css : styles de la vitrine (styles/site.css) + charte (theme.py),
  utilisés par l'en-tête et le pied de page que /brand/ixp-chrome.js ajoute aux outils HTML ;
- styles/site.css : bloc « Charte IXP » entre deux balises, pour les pages Next.js.
"""
import os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from theme import block

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SITE = os.path.join(ROOT, 'styles', 'site.css')
BEGIN, END = '/* >>> Charte IXP (générée par scripts/brand/build_chrome.py) */', '/* <<< Charte IXP */'

site = open(SITE, encoding='utf-8').read()
site = re.sub(re.escape(BEGIN) + r'.*?' + re.escape(END) + r'\n?', '', site, flags=re.S).rstrip() + '\n'
next_block = block('.xs-wrapped main', '.xs-wrapped main')
open(SITE, 'w', encoding='utf-8').write(site + '\n' + BEGIN + '\n' + next_block + END + '\n')

fonts = "@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;500&display=swap');\n"
chrome = (
    fonts
    + '/* Charte IXP pour les pages HTML autonomes — fichier généré, ne pas modifier à la main. */\n'
    + site
    + '\n/* En-tête et pied de page ajoutés par ixp-chrome.js */\n'
    + '.xs.ixp-chrome{min-height:0;padding-bottom:0;background:transparent;line-height:1.55;font-size:16px}\n'
    + '.xs.ixp-chrome .x-hdr{position:relative;background:rgba(250,247,240,.96)}\n'
    + 'body.ixp-chromed [data-ixp-own-header]{display:none !important}\n'
    + '.xs.ixp-chrome .x-ftr{margin-top:64px}\n'
    + '.xs.ixp-chrome .x-ftr-grid{grid-template-columns:1.4fr repeat(3,1fr)}\n'
    + '@media(max-width:900px){.xs.ixp-chrome .x-ftr-grid{grid-template-columns:1fr 1fr}}\n'
    + '@media print{.xs.ixp-chrome{display:none !important}}\n'
    + block('html.ixp-theme', 'html.ixp-theme body')
)
open(os.path.join(ROOT, 'public', 'brand', 'ixp-chrome.css'), 'w', encoding='utf-8').write(chrome)
print('ok', len(chrome))
