# Copie statique de la démo

Régénère le dossier consultable hors ligne (portail `index.html` + `site-demo/`).

1. `npm run build` puis `npx next start -p 3100` (avec `NEXT_PUBLIC_DEMO_MODE=1`).
2. Jeton local : `node generate-qa-token.js` (utilise `USER_SECRET` de `.env.local`).
3. `python3 scripts/demo-snapshot/crawl.py http://localhost:3100 <jeton> ../site-demo public`
4. `python3 scripts/demo-snapshot/portal.py lib/suite.ts ../site-demo/_pages.tsv ../index.html site-demo`
