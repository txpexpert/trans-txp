#!/usr/bin/env bash
# deploy/vps/deploy.sh
# ─────────────────────────────────────────────────────────────────────────────
# Met en ligne une version du site sur le VPS, sans toucher à la version en
# cours tant que la nouvelle n'est pas construite et vérifiée.
#
#   deploy.sh prod            → branche main
#   deploy.sh demo            → branche demo-refonte-marketing.IXP
#   deploy.sh prod <branche>  → autre branche (cas exceptionnel)
#
# À lancer en tant qu'utilisateur « ixp ». Déroulé :
#   1. récupère le code de la branche dans releases/<date>-<commit>
#   2. relie shared/.env.production (variables d'environnement)
#   3. npm ci + next build
#   4. bascule le lien « current » et recharge pm2
#   5. vérifie que le site répond ; sinon revient à la version précédente
# Conserve les 3 dernières versions.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

ENV="${1:?Usage : deploy.sh prod|demo [branche]}"
case "$ENV" in
  prod) BRANCH="${2:-main}";                        PORT=3000 ;;
  demo) BRANCH="${2:-demo-refonte-marketing.IXP}";  PORT=3001 ;;
  *) echo "Environnement inconnu : $ENV (prod ou demo)"; exit 1 ;;
esac

REPO_URL="git@github.com:txpexpert/trans-txp.git"
BASE="/srv/ixp/$ENV"
CACHE="$BASE/repo.git"
APP="ixp-$ENV"
ECOSYSTEM="/srv/ixp/bin/ecosystem.config.js"

if [ ! -f "$BASE/shared/.env.production" ]; then
  echo "✖ $BASE/shared/.env.production manquant (voir deploy/vps/env.example)."; exit 1
fi

echo "→ Récupération de $BRANCH"
[ -d "$CACHE" ] || git clone --bare --quiet "$REPO_URL" "$CACHE"
git --git-dir="$CACHE" fetch --quiet --prune origin "+refs/heads/$BRANCH:refs/heads/$BRANCH"
SHA="$(git --git-dir="$CACHE" rev-parse --short "refs/heads/$BRANCH")"
RELEASE="$BASE/releases/$(date -u +%Y%m%d-%H%M%S)-$SHA"
mkdir -p "$RELEASE"
git --git-dir="$CACHE" archive "refs/heads/$BRANCH" | tar -x -C "$RELEASE"
ln -sfn "$BASE/shared/.env.production" "$RELEASE/.env.production"

echo "→ Construction ($SHA)"
cd "$RELEASE"
npm ci --no-audit --no-fund
NODE_OPTIONS="--max-old-space-size=3072" npm run build

PREVIOUS="$(readlink -f "$BASE/current" 2>/dev/null || true)"

echo "→ Bascule"
ln -sfn "$RELEASE" "$BASE/current"
pm2 startOrReload "$ECOSYSTEM" --only "$APP" --update-env
pm2 save >/dev/null

echo "→ Vérification"
OK=0
for i in $(seq 1 20); do
  if curl -fsS -o /dev/null "http://127.0.0.1:$PORT/"; then OK=1; break; fi
  sleep 3
done

if [ "$OK" -ne 1 ]; then
  echo "✖ Le site ne répond pas après la mise en ligne."
  if [ -n "$PREVIOUS" ] && [ -d "$PREVIOUS" ]; then
    echo "→ Retour à la version précédente : $PREVIOUS"
    ln -sfn "$PREVIOUS" "$BASE/current"
    pm2 reload "$APP" --update-env
  fi
  exit 1
fi

if [ "$ENV" = "prod" ] && [ -d "$RELEASE/deploy/vps" ]; then
  echo "→ Mise à jour des outils du serveur (/srv/ixp/bin) depuis la version en ligne"
  cp "$RELEASE"/deploy/vps/{deploy.sh,ecosystem.config.js,cron-expire-subscriptions.sh} /srv/ixp/bin/
  chmod +x /srv/ixp/bin/*.sh
fi

echo "→ Nettoyage (3 dernières versions conservées)"
ls -1dt "$BASE"/releases/*/ | tail -n +4 | xargs -r rm -rf

echo "✔ $ENV en ligne : $BRANCH @ $SHA"
