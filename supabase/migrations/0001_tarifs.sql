-- supabase/migrations/0001_tarifs.sql
-- Table pour la réimportation des codes SH depuis le fichier Excel consolidé.
-- Colonnes alignées sur ce que pages/api/tariff.ts et pages/api/tarifs/*.ts
-- attendent réellement (vérifié dans le code, pas deviné).

create table public.tarifs (
  code_sh            varchar(14) primary key,
  chapitre           varchar(2) not null,
  designation_clean  text not null,
  taux_droit         numeric(5,2),          -- null si non applicable/non chiffré
  taux_raw           text,                  -- texte original du tarif si non numérique
  unite_norm         varchar(20),
  est_feuille        boolean default false, -- ligne tarifaire finale (pas une catégorie)
  est_hierarchique   boolean default false, -- ligne de regroupement (chapitre/section)
  niveau             smallint default 0,    -- profondeur dans la hiérarchie SH
  annee_tarif        integer,               -- année du tarif en vigueur (ex: 2026)
  created_at         timestamptz default now()
);

create index idx_tarifs_chapitre on public.tarifs(chapitre);
create index idx_tarifs_designation on public.tarifs using gin(to_tsvector('french', designation_clean));

alter table public.tarifs enable row level security;
create policy "tarifs_lecture_authentifiee" on public.tarifs
  for select using (auth.role() = 'authenticated');

-- Import : utiliser l'interface Supabase (Table Editor > Import data from CSV)
-- après avoir exporté le fichier Excel consolidé en CSV avec ces mêmes
-- en-têtes de colonnes exactement.
