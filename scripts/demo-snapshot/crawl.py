"""Copie statique de la démo Import-eXPert, consultable sans serveur.

Parcourt le serveur local (next start), enregistre chaque page HTML,
réécrit les liens internes en chemins relatifs, retire les scripts Next.js
(inutilisables en file://) et injecte static-helpers.js sur les pages de la vitrine.

Usage : python3 crawl.py <url_base> <cookie_token> <dossier_sortie> <public_dir>
"""
import os, re, sys, shutil, posixpath
import urllib.request, urllib.error
from urllib.parse import urlsplit, unquote
from collections import deque

BASE, TOKEN, OUT, PUBLIC = sys.argv[1].rstrip('/'), sys.argv[2], sys.argv[3], sys.argv[4]
HERE = os.path.dirname(os.path.abspath(__file__))

SEEDS = ['/', '/plateforme', '/expertise', '/tarifs',
         '/espaces/qualifier', '/espaces/optimiser', '/espaces/chiffrer', '/espaces/executer',
         '/espaces/securiser', '/espaces/bibliotheque', '/espaces/piloter',
         '/contact', '/cgu', '/confidentialite', '/auth/login', '/auth/register', '/a-propos',
         '/dashboard', '/app/copilote']
SKIP = ('/api/', '/backoffice', '/_next/', '/mobile')


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k):
        return None


opener = urllib.request.build_opener(NoRedirect)


def fetch(path):
    """Renvoie (chemin_final, corps, type) en suivant au plus 5 redirections internes."""
    for _ in range(6):
        req = urllib.request.Request(BASE + path, headers={'Cookie': f'dia_session={TOKEN}', 'User-Agent': 'snapshot'})
        try:
            r = opener.open(req, timeout=60)
            return path, r.read(), r.headers.get('Content-Type', '')
        except urllib.error.HTTPError as e:
            if e.code in (301, 302, 303, 307, 308):
                loc = e.headers.get('Location', '')
                p = urlsplit(loc)
                if p.netloc and p.netloc not in urlsplit(BASE).netloc:
                    return None, None, None
                path = p.path or '/'
                continue
            return None, None, None
    return None, None, None


def route_to_file(route):
    route = unquote(route)
    if route in ('', '/'):
        return 'index.html'
    r = route.strip('/')
    return r if r.endswith('.html') else r + '.html'


pages = {}      # route demandée -> fichier
redirect = {}   # route -> route finale
saved = {}      # fichier -> (html, route finale)
queue = deque(SEEDS)
seen = set()
HREF = re.compile(r'''(href|src|action)=(["'])(/(?!/)[^"'#?]*)([?][^"'#]*)?(#[^"']*)?\2''')

while queue:
    route = queue.popleft()
    if route in seen or route.startswith(SKIP):
        continue
    seen.add(route)
    final, body, ctype = fetch(route)
    if not final or 'text/html' not in (ctype or ''):
        continue
    redirect[route] = final
    f = route_to_file(final)
    pages[route] = pages[final] = f
    if f in saved:
        continue
    html = body.decode('utf-8', 'replace')
    saved[f] = (html, final)
    for m in HREF.finditer(html):
        p = m.group(3)
        if m.group(1) == 'href' and not p.startswith(SKIP) and not re.search(r'\.(css|js|png|jpe?g|svg|ico|json|webp|woff2?|pdf)$', p):
            queue.append(p)

# Pages Next.js qui redirigent côté client (router.replace) : la cible statique tient lieu de page.
for route, f in list(pages.items()):
    html = saved.get(f, ('', ''))[0]
    if re.search(r'<div id="__next">\s*</div>', html):
        m = re.search(r"router\.replace\('(/tools/[^']+)'\)", open(os.path.join(PUBLIC, '..', 'pages', route.strip('/') + '.tsx'), encoding='utf-8', errors='ignore').read()) if os.path.exists(os.path.join(PUBLIC, '..', 'pages', route.strip('/') + '.tsx')) else None
        if m:
            tgt = m.group(1)
            if tgt not in pages:
                fin, body, ct = fetch(tgt)
                if fin:
                    tf = route_to_file(fin)
                    saved[tf] = (body.decode('utf-8', 'replace'), fin)
                    pages[tgt] = tf
            if tgt in pages:
                pages[route] = pages[tgt]

assets = set()


def rel(from_file, to_file):
    return posixpath.relpath(to_file, posixpath.dirname(from_file) or '.')


def rewrite(html, f, final):
    is_vitrine = 'class="xs"' in html
    # Scripts Next.js : inutilisables hors serveur
    html = re.sub(r'<script[^>]*\bsrc="/_next/[^"]*"[^>]*></script>', '', html)
    html = re.sub(r'<script id="__NEXT_DATA__"[^>]*>.*?</script>', '', html, flags=re.S)
    html = re.sub(r'<link[^>]*rel="preload"[^>]*as="script"[^>]*/?>', '', html)
    html = re.sub(r'<noscript[^>]*data-n-css[^>]*></noscript>', '', html)

    def sub(m):
        attr, q, path, query, frag = m.group(1), m.group(2), m.group(3), m.group(4) or '', m.group(5) or ''
        if path.startswith('/_next/static/'):
            assets.add(path)
            return f'{attr}={q}{rel(f, path.lstrip("/"))}{query}{frag}{q}'
        target = pages.get(path) or pages.get(path.rstrip('/'))
        if target:
            return f'{attr}={q}{rel(f, target)}{query}{frag}{q}'
        local = os.path.join(PUBLIC, unquote(path).lstrip('/'))
        if os.path.isfile(local):
            assets.add(('public', path))
            return f'{attr}={q}{rel(f, unquote(path).lstrip("/"))}{query}{frag}{q}'
        if path.startswith('/api/'):
            return m.group(0)  # appels API laissés tels quels : inopérants hors serveur
        return f'{attr}={q}#{q}' if attr == 'href' else m.group(0)

    html = HREF.sub(sub, html)
    if is_vitrine:
        if f == 'index.html':
            html = html.replace('<form class="x-try"', f'<form class="x-try" data-target="{rel(f, pages.get("/modules/classement", "modules/classement.html"))}"', 1)
        html = html.replace('</body>', f'<script src="{rel(f, "static-helpers.js")}"></script></body>', 1)
    return html


os.makedirs(OUT, exist_ok=True)
for f, (html, final) in saved.items():
    dest = os.path.join(OUT, f)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with open(dest, 'w', encoding='utf-8') as fh:
        fh.write(rewrite(html, f, final))

# Ressources : CSS Next (+ polices et images qu'elles référencent) et fichiers de public/
CSSURL = re.compile(r'url\((["\']?)(/_next/static/[^)"\']+)\1\)')
done = set()
todo = list(assets)
while todo:
    a = todo.pop()
    if a in done:
        continue
    done.add(a)
    if isinstance(a, tuple):
        src = os.path.join(PUBLIC, unquote(a[1]).lstrip('/'))
        dst = os.path.join(OUT, unquote(a[1]).lstrip('/'))
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        if not os.path.exists(dst):
            shutil.copyfile(src, dst)
        continue
    _, body, _ = fetch(a)
    if body is None:
        continue
    dst = os.path.join(OUT, a.lstrip('/'))
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    if a.endswith('.css'):
        css = body.decode('utf-8', 'replace')
        def csub(m):
            todo.append(m.group(2))
            return f'url({rel(a.lstrip("/"), m.group(2).lstrip("/"))})'
        css = CSSURL.sub(csub, css)
        body = css.encode('utf-8')
    with open(dst, 'wb') as fh:
        fh.write(body)

shutil.copyfile(os.path.join(HERE, 'static-helpers.js'), os.path.join(OUT, 'static-helpers.js'))

with open(os.path.join(OUT, '_pages.tsv'), 'w', encoding='utf-8') as fh:
    for route in sorted(pages):
        fh.write(f'{route}\t{pages[route]}\n')
print(f'{len(saved)} pages, {len(done)} ressources -> {OUT}')
