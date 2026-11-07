#!/usr/bin/env bash
# Régénère supabase/setup/installation_complete.sql : schéma de base, puis
# migrations 0004 → 0010, puis index. Les migrations 0001 à 0003 sont déjà
# intégrées (dans leur état de production) au schéma de base.
set -euo pipefail
cd "$(dirname "$0")/../.."
OUT=supabase/setup/installation_complete.sql
{
  echo "-- installation_complete.sql — GÉNÉRÉ par scripts/setup/build-install-sql.sh, ne pas modifier à la main."
  echo "-- À exécuter UNE FOIS sur une base Supabase NEUVE (SQL Editor → coller → Run)."
  echo
  for f in supabase/setup/00_schema_base.sql \
           supabase/migrations/0004_subscriptions.sql \
           supabase/migrations/0005_numero_abonne_sessions_suppression.sql \
           supabase/migrations/0006_admin_accounts.sql \
           supabase/migrations/0007_ingestion_tarif_decisions.sql \
           supabase/migrations/0008_piloter_mise_a_jour_auto.sql \
           supabase/migrations/0009_veille_mondoscope.sql \
           supabase/migrations/0010_facturation.sql \
           supabase/setup/99_index.sql; do
    echo; echo "-- ═════════ $f ═════════"; cat "$f"; echo
  done
} > "$OUT"
echo "écrit : $OUT ($(wc -l < "$OUT") lignes)"
