-- supabase/migrations/0002_decisions_classement.sql
-- Table pour les décisions de classement — migre les 247 décisions
-- actuellement en JSON statique (public/data/decisions.json) vers Supabase,
-- pour permettre l'ajout de nouvelles décisions sans redéploiement.

create table public.decisions_classement (
  id          uuid primary key default gen_random_uuid(),
  designation text not null,
  circulaire  varchar(50) not null,
  code_sh     varchar(14) not null, -- pas de FK stricte vers tarifs : une décision
                                      -- peut être ajoutée avant l'import du code SH
  created_at  timestamptz default now()
);

create index idx_decisions_code_sh on public.decisions_classement(code_sh);
create index idx_decisions_designation on public.decisions_classement using gin(to_tsvector('french', designation));

-- Évite les doublons exacts (même désignation + même code SH)
create unique index idx_decisions_dedup on public.decisions_classement(designation, code_sh);

alter table public.decisions_classement enable row level security;
create policy "decisions_lecture_authentifiee" on public.decisions_classement
  for select using (auth.role() = 'authenticated');

-- Migration des 247 décisions existantes :
-- 1. Exporter public/data/decisions.json en CSV (designation, circulaire, code_sh)
-- 2. Table Editor Supabase > decisions_classement > Import data from CSV
