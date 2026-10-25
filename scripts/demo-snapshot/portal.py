"""Génère le portail index.html à la racine du zip de démo.
Lit lib/suite.ts (espaces et outils) et _pages.tsv (route -> fichier statique)."""
import re, sys, html, datetime

SUITE, PAGES_TSV, OUT, SITE = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]  # SITE = dossier relatif, ex. site-demo

pages = dict(l.rstrip('\n').split('\t') for l in open(PAGES_TSV, encoding='utf-8') if '\t' in l)
src = open(SUITE, encoding='utf-8').read()


def link(route):
    f = pages.get(route)
    return f'{SITE}/{f}' if f else None


espaces = []
for block in re.split(r"\n  \{\n    slug: ", src)[1:]:
    slug = block.split("'")[1]
    num = re.search(r"num: '([^']+)'", block).group(1)
    verb = re.search(r"verb: '([^']+)'", block).group(1)
    title = re.search(r"title: (['\"])(.+?)\1", block).group(2)
    question = re.search(r"question: (['\"])(.+?)\1,", block).group(2)
    tools = re.findall(r"\{ label: '((?:[^'\\]|\\.)+)', path: '([^']+)', desc: '((?:[^'\\]|\\.)+)'", block)
    espaces.append(dict(slug=slug, num=num, verb=verb, title=title, question=question,
                        tools=[(l.replace("\\'", "'"), p, d.replace("\\'", "'")) for l, p, d in tools]))

E = html.escape


def a(route, label, cls=''):
    href = link(route)
    if not href:
        return f'<span class="off">{E(label)}</span>'
    return f'<a class="{cls}" href="{E(href)}">{E(label)}</a>'


cards = []
for e in espaces:
    tools = ''.join(f'<li>{a(p, l)}<span>{E(d)}</span></li>' for l, p, d in e['tools'])
    tag = f'Étape {e["num"]}' if e['num'] != '—' else 'Couche transversale'
    cards.append(f'''
    <article class="card c-{e["slug"]}">
      <div class="tag">{E(tag)}</div>
      <h3>{a("/espaces/" + e["slug"], e["verb"], "big")}</h3>
      <p class="t">{E(e["title"])} · {E(e["question"])}</p>
      <ul>{tools}</ul>
    </article>''')

vitrine = [('/', 'Nouvel accueil', 'IXP-Assistant, chaîne en 5 étapes, profils'),
           ('/diagnostic', 'Diagnostic de conformité', '8 domaines, exposition chiffrée, plan d’action et suivi'),
           ('/plateforme', 'Présentation de la plateforme', 'Les 5 espaces, le socle, les profils : espace de découverte'),
           ('/expertise', 'Expertise et services', 'Douane Engineering, prestations à l’acte, kits'),
           ('/tarifs', 'Tarifs', 'Abonnement par utilisateur et conseil à l’opération')]
autres = [('/kits/Kit01_Origine_preferentielle_ALE.html', 'Kit 01 · Origine et ALE'), ('/kits/Kit02_Regimes_suspensifs_economiques.html', 'Kit 02 · Régimes économiques'), ('/kits/Kit03_Classement_SH_controle_a_posteriori.html', 'Kit 03 · Classement et contrôle'), ('/kits/Kit04_Pack_conformite_integral.html', 'Kit 04 · Pack intégral'), ('/enquete', 'Enquête Baromètre 2026'), ('/contact', 'Contact'),
          ('/auth/login', 'Connexion'), ('/auth/register', 'Inscription'), ('/app/copilote', 'IXP-Assistant (application)'),
          ('/dashboard', 'Tableau de bord'), ('/a-propos', 'À propos (ancienne page)'),
          ('/cgu', 'Conditions d’utilisation'), ('/confidentialite', 'Confidentialité')]

today = datetime.date.today().strftime('%d/%m/%Y')
page = f'''<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Import-eXPert · Démo de la refonte</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;500&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet">
<style>
:root{{--ink:#14120F;--ink2:#3B3631;--ink3:#7A7168;--paper:#FAF7F0;--line:#E6DCC7;--gold:#A8822F;--gold2:#C9A84C;--navy:#153E82;--red:#A82D3C}}
*{{box-sizing:border-box}}body{{margin:0;font-family:'DM Sans',system-ui,sans-serif;background:var(--paper);color:var(--ink);line-height:1.55}}
a{{color:inherit}}.w{{max-width:1180px;margin:0 auto;padding:0 24px}}
.top{{background:var(--red);color:#fff;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.1em;text-align:center;padding:8px}}
header{{padding:64px 0 40px;border-bottom:1px solid var(--line)}}
.logo{{font-family:'DM Serif Display',serif;font-size:24px}}.logo b{{font-weight:400;color:var(--red)}}
.eb{{font-family:'JetBrains Mono',monospace;font-size:11.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--gold);margin-top:40px}}
h1{{font-family:'DM Serif Display',serif;font-weight:400;font-size:clamp(36px,5vw,58px);line-height:1.05;margin:14px 0 18px}}h1 em{{color:var(--navy)}}
.lead{{font-size:18px;color:var(--ink2);max-width:720px}}
.cta{{display:flex;gap:12px;flex-wrap:wrap;margin-top:28px}}
.btn{{display:inline-block;padding:13px 22px;border-radius:999px;text-decoration:none;font-weight:500;border:1px solid var(--line)}}
.btn.dark{{background:var(--ink);color:#fff;border-color:var(--ink)}}.btn.gold{{background:var(--gold2);border-color:var(--gold2)}}
section{{padding:48px 0;border-bottom:1px solid var(--line)}}
h2{{font-family:'DM Serif Display',serif;font-weight:400;font-size:32px;margin:0 0 6px}}
.sub{{color:var(--ink3);margin:0 0 24px}}
.row{{display:grid;grid-template-columns:repeat(5,1fr);gap:14px}}
.mini{{background:#fff;border:1px solid var(--line);border-radius:14px;padding:18px;text-decoration:none;display:block}}
.mini:hover,.card:hover{{border-color:var(--ink)}}.mini b{{font-family:'DM Serif Display',serif;font-weight:400;font-size:22px;display:block}}.mini span{{font-size:13.5px;color:var(--ink3)}}
.grid{{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}}
.card{{background:var(--cb,#fff);border:1px solid var(--cl,var(--line));border-radius:16px;padding:22px}}
.c-qualifier{{--c:#1F4E9A;--cb:#EDF3FC;--cl:#C9DAF3}}.c-optimiser{{--c:#1E7346;--cb:#EBF6EF;--cl:#C3E3CF}}.c-chiffrer{{--c:#9A620C;--cb:#FCF4E3;--cl:#EFD9A8}}
.c-executer{{--c:#5B3FA0;--cb:#F2EEFB;--cl:#D8CDF1}}.c-securiser{{--c:#A82D3C;--cb:#FCEEF0;--cl:#F0C9CF}}.c-bibliotheque{{--c:#16706B;--cb:#E8F6F5;--cl:#BFE2DF}}.c-piloter{{--c:#3D4A63;--cb:#EEF1F6;--cl:#CDD4E2}}
.card .tag,.card .big{{color:var(--c)}}.card li a{{color:var(--c)}}.card ul,.card li{{border-color:var(--cl)}}
.tag{{font-family:'JetBrains Mono',monospace;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold)}}
.card h3{{margin:6px 0 4px}}.big{{font-family:'DM Serif Display',serif;font-weight:400;font-size:28px;text-decoration:none}}
.card .t{{font-size:13.5px;color:var(--ink3);margin:0 0 12px}}
.card ul{{list-style:none;margin:0;padding:0;border-top:1px solid var(--line)}}
.card li{{padding:8px 0;border-bottom:1px solid var(--line);font-size:14.5px;display:flex;flex-direction:column}}
.card li a{{font-weight:600;text-decoration:none}}.card li a:hover{{text-decoration:underline}}.card li span{{font-size:12.5px;color:var(--ink3)}}
.list{{columns:3;column-gap:24px;padding:0;list-style:none;margin:0}}.list li{{padding:6px 0;break-inside:avoid}}
.off{{color:var(--ink3)}}
.notes{{display:grid;grid-template-columns:1fr 1fr;gap:14px}}.note{{background:#fff;border:1px solid var(--line);border-radius:14px;padding:20px;font-size:14.5px}}
.note h3{{margin:0 0 8px;font-size:16px}}code{{font-family:'JetBrains Mono',monospace;font-size:12.5px;background:#F1EADB;padding:1px 6px;border-radius:5px}}
footer{{padding:32px 0 48px;color:var(--ink3);font-size:13px}}
@media(max-width:900px){{.row,.grid{{grid-template-columns:1fr 1fr}}.list{{columns:2}}.notes{{grid-template-columns:1fr}}}}
@media(max-width:600px){{.row,.grid{{grid-template-columns:1fr}}.list{{columns:1}}}}
</style></head><body>
<div class="top">VERSION DÉMO · NON PUBLIÉE · BRANCHE demo-refonte</div>
<header><div class="w">
  <div class="logo">Import<b>-</b>eXPert</div>
  <div class="eb">Démo de la refonte · {today}</div>
  <h1>Parcourir le site <em>refondu</em>, page par page.</h1>
  <p class="lead">Ce portail ouvre la copie statique du site de démonstration. Toutes les pages se consultent directement depuis ce dossier, sans installation. Les liens du site renvoient les uns vers les autres comme en ligne.</p>
  <div class="cta">
    <a class="btn dark" href="{link('/')}">Entrer dans le site (nouvel accueil)</a>
    <a class="btn gold" href="{link('/plateforme')}">Présentation de notre plateforme en 5 espaces</a>
  </div>
</div></header>

<section><div class="w">
  <h2>La vitrine</h2><p class="sub">Les pages publiques de la nouvelle architecture.</p>
  <div class="row">{''.join(f'<a class="mini" href="{link(r)}"><b>{E(t)}</b><span>{E(d)}</span></a>' for r, t, d in vitrine)}</div>
</div></section>

<section><div class="w">
  <h2>Les espaces et leurs modules</h2><p class="sub">Les 44 modules existants, regroupés selon la chaîne Qualifier → Optimiser → Chiffrer → Exécuter → Sécuriser, plus la Bibliothèque et l’espace Piloter.</p>
  <div class="grid">{''.join(cards)}</div>
</div></section>

<section><div class="w">
  <h2>Autres pages</h2><p class="sub">Pages institutionnelles et applicatives conservées.</p>
  <ul class="list">{''.join(f'<li>{a(r, t)}</li>' for r, t in autres)}</ul>
</div></section>

<section><div class="w">
  <h2>À savoir</h2>
  <div class="notes">
    <div class="note"><h3>Ce qui fonctionne dans cette copie</h3>
      Toute la navigation, la mise en page (ordinateur et mobile), le menu mobile, les onglets de profils, le diagnostic en trois questions, la barre « dossier en cours » des espaces, et les outils autonomes (glossaire, calculateurs, référentiels).</div>
    <div class="note"><h3>Ce qui demande le serveur</h3>
      Tout ce qui interroge la base : IXP-Assistant (requêtes et voix), classement et recherche dans le tarif, connexion, inscription, tableau de bord. Ces pages s’affichent ici sans leurs données.</div>
    <div class="note"><h3>Lancer la version complète</h3>
      Dans <code>trans-txp/</code> : copier votre <code>.env.local</code>, puis <code>npm install</code> et <code>npm run dev</code>, et ouvrir <code>http://localhost:3000</code>. Ajouter <code>NEXT_PUBLIC_DEMO_MODE=1</code> pour afficher le bandeau démo.</div>
    <div class="note"><h3>Production non touchée</h3>
      Le code est sur la branche <code>demo-refonte</code>, jamais poussée. Le site en ligne reste celui de la branche <code>main</code> tant que la refonte n’est pas validée et fusionnée.</div>
  </div>
</div></section>
<footer><div class="w">Import-eXPert · import-expert.ma · Document de travail confidentiel</div></footer>
</body></html>'''
open(OUT, 'w', encoding='utf-8').write(page)
print('portail ->', OUT, '|', sum(len(e["tools"]) for e in espaces), 'liens modules |', len(espaces), 'espaces')
