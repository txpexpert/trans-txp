-- 0008_piloter_mise_a_jour_auto.sql
-- ============================================================
-- Mise à jour automatique des pages Piloter à chaque ingestion.
--
-- 1) knowledge_chunks.date_doc : date normalisée, calculée à chaque
--    insertion ou modification à partir de date_document (texte libre :
--    « 2025-12-31 », « 31/12/2025 », « 31 décembre 2025 »…).
-- 2) v_textes_recents : un texte par ligne (premier extrait), trié par date.
-- 3) v_mesures_defense : mesures de défense commerciale, avec type et
--    statut calculé (en vigueur, expirée, abrogée, modifiée).
-- 4) v_tarif_changements : changements de droit enregistrés dans
--    tarifs_historique par l'ingestion du tarif.
-- Aucune donnée existante n'est modifiée ou supprimée.
-- ============================================================

create or replace function public.parse_date_fr(t text)
returns date language plpgsql immutable as $$
declare s text; m text[]; mois int;
begin
  if t is null then return null; end if;
  s := lower(btrim(t));
  -- AAAA-MM-JJ
  m := regexp_match(s, '(\d{4})-(\d{1,2})-(\d{1,2})');
  if m is not null then
    begin return make_date(m[1]::int, m[2]::int, m[3]::int); exception when others then return null; end;
  end if;
  -- JJ/MM/AAAA ou JJ-MM-AAAA ou JJ.MM.AAAA
  m := regexp_match(s, '(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})');
  if m is not null then
    begin return make_date(m[3]::int, m[2]::int, m[1]::int); exception when others then return null; end;
  end if;
  -- JJ mois AAAA (mois en toutes lettres)
  m := regexp_match(s, '(\d{1,2})(?:er)?\s+(janvier|f[ée]vrier|mars|avril|mai|juin|juillet|ao[uû]t|septembre|octobre|novembre|d[ée]cembre)\s+(\d{4})');
  if m is not null then
    mois := case
      when m[2] = 'janvier' then 1 when m[2] ~ '^f' then 2 when m[2] = 'mars' then 3 when m[2] = 'avril' then 4
      when m[2] = 'mai' then 5 when m[2] = 'juin' then 6 when m[2] = 'juillet' then 7 when m[2] ~ '^ao' then 8
      when m[2] = 'septembre' then 9 when m[2] = 'octobre' then 10 when m[2] = 'novembre' then 11 else 12 end;
    begin return make_date(m[3]::int, mois, m[1]::int); exception when others then return null; end;
  end if;
  return null;
end $$;

alter table public.knowledge_chunks add column if not exists date_doc date;

create or replace function public.trg_kc_date_doc()
returns trigger language plpgsql as $$
begin
  new.date_doc := public.parse_date_fr(new.date_document);
  return new;
end $$;

drop trigger if exists kc_date_doc on public.knowledge_chunks;
create trigger kc_date_doc before insert or update of date_document on public.knowledge_chunks
for each row execute function public.trg_kc_date_doc();

update public.knowledge_chunks set date_doc = public.parse_date_fr(date_document) where date_doc is null;
create index if not exists kc_date_doc_idx on public.knowledge_chunks (date_doc desc nulls last);
create index if not exists kc_domaine_idx on public.knowledge_chunks (domaine);

-- Un texte par ligne : le premier extrait de chaque document
create or replace view public.v_textes_recents as
select distinct on (coalesce(numero, titre))
  coalesce(numero, '') as numero, titre, type_document, domaine, sous_domaine,
  date_doc, date_document, statut, date_fin_validite, abroge_ou_modifie, modifie_par,
  created_at, left(contenu, 420) as extrait
from public.knowledge_chunks
order by coalesce(numero, titre), chunk_index, created_at desc;

-- Mesures de défense commerciale : type, échéance (champ date_fin_validite
-- ou « jusqu'au … » dans le titre) et statut calculé à la date du jour
drop view if exists public.v_mesures_defense;
create view public.v_mesures_defense as
with t as (
  select numero, titre, date_doc, date_fin_validite, modifie_par, statut, created_at,
    coalesce(public.parse_date_fr(date_fin_validite::text),
             public.parse_date_fr(substring(titre from '(?:jusqu.au|au)\s+(\d{1,2}(?:er)?\s+\S+\s+\d{4}|\d{1,2}/\d{1,2}/\d{4})'))) as echeance
  from public.v_textes_recents
  where domaine = 'Mesures de défense commerciale' and numero <> ''
)
select numero, titre, date_doc, date_fin_validite, modifie_par,
  case when titre ilike '%antidumping%' then 'Antidumping'
       when titre ilike '%préférentielle%' then 'Sauvegarde préférentielle'
       else 'Sauvegarde' end as type_mesure,
  case when statut = 'abroge' then 'Abrogée'
       when echeance is not null and echeance < current_date then 'Échue'
       when statut = 'modifie_partiellement' then 'Modifiée'
       else 'À vérifier' end as statut_calcule,
  echeance, created_at
from t;

-- Changements de droit enregistrés par l'ingestion du tarif
create or replace view public.v_tarif_changements as
select h.created_at, h.code_sh, h.action,
  coalesce(h.nouvelle_ligne->>'designation_clean', h.ancienne_ligne->>'designation_clean') as designation,
  (h.ancienne_ligne->>'taux_droit')::numeric as taux_avant,
  (h.nouvelle_ligne->>'taux_droit')::numeric as taux_apres,
  h.actor
from public.tarifs_historique h
where (h.ancienne_ligne->>'taux_droit') is distinct from (h.nouvelle_ligne->>'taux_droit');

-- Les vues ne sont lues que par le serveur (clé service)
revoke all on public.v_textes_recents, public.v_mesures_defense, public.v_tarif_changements from anon, authenticated;
