#!/usr/bin/env bash
# deploy/vps/cron-expire-subscriptions.sh
# ─────────────────────────────────────────────────────────────────────────────
# Remplace la tâche planifiée de vercel.json (« 15 5 * * * », UTC) :
# expiration des abonnements + relances de facturation.
#
# ⚠ N'activer qu'AU MOMENT DE LA BASCULE, et retirer la tâche côté Vercel le
#   même jour : si les deux tournent, les relances de facturation partent en
#   double.
#
# Ligne crontab (utilisateur ixp, « crontab -e ») :
#   15 5 * * * /srv/ixp/bin/cron-expire-subscriptions.sh >> /var/log/ixp/cron.log 2>&1
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

ENV_FILE=/srv/ixp/prod/shared/.env.production
CRON_SECRET="$(grep -E '^CRON_SECRET=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d "\"'")"
if [ -z "$CRON_SECRET" ]; then echo "$(date -u +%FT%TZ) CRON_SECRET absent de $ENV_FILE"; exit 1; fi

# Appel en local (pas de détour par Internet). Le Host public est transmis
# pour que les liens des e-mails pointent vers le bon domaine.
echo "$(date -u +%FT%TZ) $(curl -sS --max-time 120 \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Host: www.import-expert.ma" \
  -H "X-Forwarded-Proto: https" \
  http://127.0.0.1:3000/api/cron/expire-subscriptions)"
