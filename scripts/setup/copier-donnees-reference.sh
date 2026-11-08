#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Copie les DONNÉES DE RÉFÉRENCE (tarif SH, décisions, base documentaire,
# FAQ, glossaire, conseils) de l'ancienne base Supabase vers la nouvelle.
# Les comptes clients, factures et journaux ne sont PAS copiés.
#
# Prérequis : outils PostgreSQL (pg_dump, psql) installés sur votre ordinateur
#   macOS : brew install libpq && brew link --force libpq
#   Ubuntu : sudo apt install postgresql-client
#
# Chaînes de connexion : Supabase → Project Settings → Database → Connection
# string → « URI » (mode Session, port 5432), mot de passe de la base inclus.
#
# Usage :
#   SOURCE_DB_URL='postgresql://postgres.xxx:MOTDEPASSE@aws-0-eu-west-2.pooler.supabase.com:5432/postgres' \
#   TARGET_DB_URL='postgresql://postgres.yyy:MOTDEPASSE@aws-0-eu-west-1.pooler.supabase.com:5432/postgres' \
#   ./scripts/setup/copier-donnees-reference.sh
#
# À lancer APRÈS supabase/setup/installation_complete.sql sur la nouvelle base.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
: "${SOURCE_DB_URL:?Définir SOURCE_DB_URL (ancienne base)}"
: "${TARGET_DB_URL:?Définir TARGET_DB_URL (nouvelle base)}"

TABLES=(tarifs decisions_classement knowledge_chunks faq glossaire conseil_operateurs)
ARGS=(); for t in "${TABLES[@]}"; do ARGS+=(--table="public.$t"); done

DUMP=$(mktemp -t ixp-ref-XXXX.sql)
echo "→ Export des tables de référence depuis l'ancienne base…"
pg_dump "$SOURCE_DB_URL" --data-only --no-owner --no-privileges "${ARGS[@]}" > "$DUMP"
echo "  $(du -h "$DUMP" | cut -f1) exportés."

echo "→ Import dans la nouvelle base…"
psql "$TARGET_DB_URL" -v ON_ERROR_STOP=1 -q -f "$DUMP"
psql "$TARGET_DB_URL" -q -c "select 'tarifs' t, count(*) from tarifs union all select 'decisions_classement', count(*) from decisions_classement union all select 'knowledge_chunks', count(*) from knowledge_chunks;"
rm -f "$DUMP"
echo "✓ Terminé."
