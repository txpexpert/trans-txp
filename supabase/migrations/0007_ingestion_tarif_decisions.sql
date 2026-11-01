-- supabase/migrations/0007_ingestion_tarif_decisions.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Ingestion du tarif SH et des décisions de classement depuis le backoffice
-- (2026-11-01). Remplace les anciennes voies d'import, qui visaient une table
-- « decisions » inexistante et des colonnes de « tarifs » inexistantes.
--
-- TARIF — format unifié (4 colonnes : code SH · désignation · droit · unité).
--   Une ligne est reconnue par code SH + désignation normalisée (le code seul
--   ne suffit pas : titre et ligne tarifaire partagent parfois le même code).
--   • nouvelle   → insérée
--   • modifiée   → droit ou unité mis à jour (ancienne ligne archivée)
--   • inchangée  → rien
--   • pour chaque code présent dans l'import : les lignes de la base portant ce
--     code mais absentes de l'import (fragments de l'import d'août, doublons
--     exacts) sont REMPLACÉES : archivées dans tarifs_historique puis retirées.
--     Un code absent de l'import n'est jamais touché.
--
-- DÉCISIONS — JSON (designation, code_sh, circulaire, date, objet, résumé).
--   Reconnues par désignation + code SH.
--   • nouvelle   → insérée
--   • existante  → seuls ses champs VIDES (résumé, date, objet) sont complétés,
--                  jamais écrasés ; l'état antérieur est archivé.
--
-- Chaque fonction a un mode aperçu (p_apply = false, aucune écriture) et un
-- mode application (p_apply = true, transactionnel). Chaque application est
-- enregistrée dans ingestion_lots avec l'email de l'administrateur.
-- Fonctions réservées à la clé service.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Habilitations des administrateurs de type 2 ──────────────────────────
alter table public.admin_accounts drop constraint if exists admin_accounts_permissions_known;
alter table public.admin_accounts add constraint admin_accounts_permissions_known check (
  permissions <@ array['activer_plans','emettre_proformas','valider_paiements','prolonger','voir_montants',
                       'ingerer_decisions','maj_tarif']::text[]
);

-- ── 2. Journal et historiques ───────────────────────────────────────────────
create table if not exists public.ingestion_lots (
  id          uuid primary key default gen_random_uuid(),
  type        text not null check (type in ('tarif', 'decisions')),
  fichier     text,
  actor       text not null,
  compte      jsonb not null,
  created_at  timestamptz not null default now()
);
create index if not exists ingestion_lots_created_idx on public.ingestion_lots (created_at desc);
alter table public.ingestion_lots enable row level security;

create table if not exists public.tarifs_historique (
  id              uuid primary key default gen_random_uuid(),
  lot_id          uuid references public.ingestion_lots(id) on delete set null,
  action          text not null check (action in ('modification', 'remplacement')),
  tarif_id        uuid,
  code_sh         text not null,
  ancienne_ligne  jsonb not null,
  nouvelle_ligne  jsonb,
  actor           text not null,
  created_at      timestamptz not null default now()
);
create index if not exists tarifs_historique_code_idx on public.tarifs_historique (code_sh);
alter table public.tarifs_historique enable row level security;

create table if not exists public.decisions_historique (
  id            uuid primary key default gen_random_uuid(),
  lot_id        uuid references public.ingestion_lots(id) on delete set null,
  decision_id   uuid,
  champs        text[] not null,
  avant         jsonb not null,
  actor         text not null,
  created_at    timestamptz not null default now()
);
alter table public.decisions_historique enable row level security;

-- Clé de rapprochement des lignes du tarif : code + désignation normalisée.
create or replace function public.tarif_dkey(p text) returns text
language sql immutable parallel safe
as $$ select lower(regexp_replace(btrim(coalesce(p, '')), '\s+', ' ', 'g')) $$;
alter function public.tarif_dkey(text) set search_path = pg_catalog;

create index if not exists idx_tarifs_code_dkey on public.tarifs (code_sh, public.tarif_dkey(designation_clean));
create index if not exists idx_decisions_code_dkey on public.decisions_classement (code_sh, public.tarif_dkey(designation));

-- ── 3. Ingestion du tarif ───────────────────────────────────────────────────
-- p_rows : [{ "code_sh": "2939110020", "designation": "thébaïne et ses sels",
--             "taux": "2,5", "unite": "kg" }, …]  (déjà normalisées par l'interface ;
--             revalidées ici). Niveau, chapitre et nature (titre / ligne
--             tarifaire) sont calculés depuis le code et le droit.
create or replace function public.admin_ingest_tarif(
  p_rows  jsonb,
  p_apply boolean default false,
  p_actor text default 'admin',
  p_file  text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lot uuid;
  v_counts jsonb;
  v_rows jsonb;
  v_removed jsonb;
begin
  drop table if exists _in, _m, _rm;
  create temp table _in on commit drop as
  select i::int as i,
         regexp_replace(coalesce(r->>'code_sh', ''), '\D', '', 'g') as code_sh,
         regexp_replace(btrim(coalesce(r->>'designation', '')), '\s+', ' ', 'g') as designation,
         -- Droit normalisé : « 2.5 », « 2,5 % », « 10% » → « 2,5 » / « 10 » ; « - » ou « — » = pas de droit (titre).
         nullif(regexp_replace(replace(regexp_replace(btrim(coalesce(r->>'taux', '')), '\s*%$', ''), '.', ','), '^[-–—]+$', ''), '') as taux_raw,
         nullif(btrim(coalesce(r->>'unite', '')), '') as unite_norm
  from jsonb_array_elements(p_rows) with ordinality as t(r, i);

  -- Contrôles serveur (l'interface les fait aussi) : lignes invalides écartées.
  alter table _in add column err text;
  update _in set err = case
    when code_sh !~ '^\d{10}$' then 'code SH à 10 chiffres requis'
    when designation = '' then 'désignation manquante'
    when taux_raw is not null and taux_raw !~ '^\d+(,\d+)?$' then 'droit non numérique'
  end;
  -- Un droit sans unité est accepté (cas présent dans le tarif officiel) : simple avertissement à l'interface.
  -- Doublon à l'intérieur de l'import : seule la première occurrence est gardée.
  update _in a set err = 'ligne en double dans l''import'
  where err is null and exists (
    select 1 from _in b where b.err is null and b.code_sh = a.code_sh
      and tarif_dkey(b.designation) = tarif_dkey(a.designation) and b.i < a.i);

  alter table _in add column dkey text, add column niveau smallint, add column taux_droit numeric;
  update _in set dkey = tarif_dkey(designation),
    taux_droit = replace(taux_raw, ',', '.')::numeric,
    niveau = case
      when length(rtrim(code_sh, '0')) <= 2 then 1
      when length(rtrim(code_sh, '0')) <= 4 then 2
      when length(rtrim(code_sh, '0')) <= 6 then 3
      when length(rtrim(code_sh, '0')) <= 8 then 4
      else 5 end
  where err is null;

  -- Rapprochement avec la base (première ligne correspondante si doublons exacts).
  create temp table _m on commit drop as
  select distinct on (n.i) n.i, t.id as tarif_id, t.taux_raw as old_taux, t.unite_norm as old_unite, to_jsonb(t) as old_row
  from _in n join tarifs t on t.code_sh = n.code_sh and tarif_dkey(t.designation_clean) = n.dkey
  where n.err is null
  order by n.i, t.created_at, t.id;

  -- Lignes de la base à remplacer : même code qu'une ligne importée, mais
  -- non conservées (fragments, ou doublons exacts d'une ligne gardée).
  create temp table _rm on commit drop as
  select t.id, t.code_sh, to_jsonb(t) as old_row
  from tarifs t
  where t.code_sh in (select code_sh from _in where err is null)
    and t.id not in (select tarif_id from _m);

  alter table _in add column st text;
  update _in n set st = case
    when n.err is not null then 'err'
    when m.i is null then 'new'
    when coalesce(m.old_taux, '') <> coalesce(n.taux_raw, '') or coalesce(m.old_unite, '') <> coalesce(n.unite_norm, '') then 'upd'
    else 'same' end
  from _in x left join _m m on m.i = x.i
  where x.i = n.i;

  select jsonb_build_object(
    'total', count(*), 'new', count(*) filter (where st = 'new'), 'upd', count(*) filter (where st = 'upd'),
    'same', count(*) filter (where st = 'same'), 'err', count(*) filter (where st = 'err'),
    'removed', (select count(*) from _rm))
  into v_counts from _in;

  -- Détail renvoyé à l'interface : uniquement ce qui n'est pas inchangé.
  select coalesce(jsonb_agg(jsonb_build_object(
      'i', n.i, 'st', n.st, 'code_sh', n.code_sh, 'designation', n.designation, 'err', n.err,
      'old_taux', m.old_taux, 'old_unite', m.old_unite,
      'remplace', (select count(*) from _rm where _rm.code_sh = n.code_sh)
    ) order by n.i), '[]'::jsonb)
  into v_rows
  from _in n left join _m m using (i)
  where n.st <> 'same' or exists (select 1 from _rm where _rm.code_sh = n.code_sh);

  select coalesce(jsonb_agg(jsonb_build_object(
      'code_sh', code_sh, 'designation', old_row->>'designation_clean', 'taux', old_row->>'taux_raw', 'unite', old_row->>'unite_norm')
    order by code_sh), '[]'::jsonb)
  into v_removed from _rm;

  if p_apply then
    insert into ingestion_lots (type, fichier, actor, compte) values ('tarif', p_file, p_actor, v_counts) returning id into v_lot;

    -- Modifications : ancienne ligne archivée, puis mise à jour.
    insert into tarifs_historique (lot_id, action, tarif_id, code_sh, ancienne_ligne, nouvelle_ligne, actor)
    select v_lot, 'modification', m.tarif_id, n.code_sh, m.old_row,
           jsonb_build_object('taux_raw', n.taux_raw, 'unite_norm', n.unite_norm), p_actor
    from _in n join _m m using (i) where n.st = 'upd';
    update tarifs t set taux_raw = n.taux_raw, taux_droit = n.taux_droit, unite_norm = n.unite_norm,
      est_feuille = n.taux_raw is not null, est_hierarchique = n.taux_raw is null
    from _in n join _m m using (i) where n.st = 'upd' and t.id = m.tarif_id;

    -- Remplacements : fragments archivés, puis retirés.
    insert into tarifs_historique (lot_id, action, tarif_id, code_sh, ancienne_ligne, actor)
    select v_lot, 'remplacement', id, code_sh, old_row, p_actor from _rm;
    delete from tarifs where id in (select id from _rm);

    -- Nouvelles lignes.
    insert into tarifs (code_sh, chapitre, designation_clean, taux_droit, taux_raw, unite_norm, est_feuille, est_hierarchique, niveau)
    select code_sh, left(code_sh, 2), designation, taux_droit, taux_raw, unite_norm, taux_raw is not null, taux_raw is null, niveau
    from _in where st = 'new' order by i;
  end if;

  return jsonb_build_object('applied', p_apply, 'lot_id', v_lot, 'counts', v_counts, 'rows', v_rows, 'removed', v_removed);
end $$;

-- ── 4. Ingestion des décisions de classement ────────────────────────────────
-- p_rows : [{ "designation", "code_sh", "circulaire", "date_circulaire" (AAAA-MM-JJ),
--             "objet", "resume" }, …]
create or replace function public.admin_ingest_decisions(
  p_rows  jsonb,
  p_apply boolean default false,
  p_actor text default 'admin',
  p_file  text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lot uuid;
  v_counts jsonb;
  v_rows jsonb;
begin
  drop table if exists _d;
  create temp table _d on commit drop as
  select i::int as i,
         regexp_replace(btrim(coalesce(r->>'designation', '')), '\s+', ' ', 'g') as designation,
         regexp_replace(coalesce(r->>'code_sh', ''), '\D', '', 'g') as code_sh,
         btrim(coalesce(r->>'circulaire', '')) as circulaire,
         nullif(btrim(coalesce(r->>'date_circulaire', '')), '') as date_txt,
         nullif(btrim(coalesce(r->>'objet', '')), '') as objet,
         nullif(btrim(coalesce(r->>'resume', '')), '') as resume
  from jsonb_array_elements(p_rows) with ordinality as t(r, i);

  alter table _d add column err text, add column date_circulaire date, add column dkey text,
    add column st text, add column decision_id uuid, add column fill text[], add column code_absent boolean;

  update _d set err = case
    when designation = '' then 'désignation manquante'
    when code_sh !~ '^\d{10}$' then 'code SH à 10 chiffres requis'
    when circulaire = '' then 'n° de circulaire manquant'
    when length(circulaire) > 50 then 'n° de circulaire trop long'
    when date_txt is not null and date_txt !~ '^\d{4}-\d{2}-\d{2}$' then 'date au format AAAA-MM-JJ requise'
  end;
  -- Date au bon format mais impossible (ex. 2026-02-31) : erreur sur la ligne, pas sur le lot.
  update _d set err = 'date inexistante'
  where err is null and date_txt is not null and not pg_input_is_valid(date_txt, 'date');
  update _d set date_circulaire = date_txt::date, dkey = tarif_dkey(designation) where err is null;
  update _d a set err = 'décision en double dans le fichier'
  where err is null and exists (select 1 from _d b where b.err is null and b.code_sh = a.code_sh and b.dkey = a.dkey and b.i < a.i);

  update _d n set decision_id = d.id,
    fill = array_remove(array[
      case when n.resume is not null and coalesce(btrim(d.resume), '') = '' then 'resume' end,
      case when n.date_circulaire is not null and d.date_circulaire is null then 'date_circulaire' end,
      case when n.objet is not null and coalesce(btrim(d.objet), '') = '' then 'objet' end], null)
  from (select distinct on (code_sh, tarif_dkey(designation)) * from decisions_classement order by code_sh, tarif_dkey(designation), created_at) d
  where n.err is null and d.code_sh = n.code_sh and tarif_dkey(d.designation) = n.dkey;

  update _d set st = case
    when err is not null then 'err'
    when decision_id is null then 'new'
    when cardinality(fill) > 0 then 'upd'
    else 'same' end,
    code_absent = err is null and not exists (select 1 from tarifs t where t.code_sh = _d.code_sh);

  select jsonb_build_object('total', count(*), 'new', count(*) filter (where st = 'new'),
      'upd', count(*) filter (where st = 'upd'), 'same', count(*) filter (where st = 'same'),
      'err', count(*) filter (where st = 'err'))
  into v_counts from _d;

  select coalesce(jsonb_agg(jsonb_build_object('i', i, 'st', st, 'err', err, 'fill', fill, 'code_absent', code_absent) order by i), '[]'::jsonb)
  into v_rows from _d;

  if p_apply then
    insert into ingestion_lots (type, fichier, actor, compte) values ('decisions', p_file, p_actor, v_counts) returning id into v_lot;

    insert into decisions_historique (lot_id, decision_id, champs, avant, actor)
    select v_lot, n.decision_id, n.fill, to_jsonb(d), p_actor
    from _d n join decisions_classement d on d.id = n.decision_id where n.st = 'upd';

    update decisions_classement d set
      resume          = case when 'resume' = any(n.fill) then n.resume else d.resume end,
      date_circulaire = case when 'date_circulaire' = any(n.fill) then n.date_circulaire else d.date_circulaire end,
      objet           = case when 'objet' = any(n.fill) then n.objet else d.objet end
    from _d n where n.st = 'upd' and d.id = n.decision_id;

    insert into decisions_classement (designation, code_sh, circulaire, date_circulaire, objet, resume)
    select designation, code_sh, circulaire, date_circulaire, objet, resume from _d where st = 'new' order by i
    on conflict (designation, code_sh) do nothing;
  end if;

  return jsonb_build_object('applied', p_apply, 'lot_id', v_lot, 'counts', v_counts, 'rows', v_rows);
end $$;

-- ── 5. Droits : clé service uniquement ──────────────────────────────────────
revoke all on function public.admin_ingest_tarif(jsonb, boolean, text, text) from public, anon, authenticated;
revoke all on function public.admin_ingest_decisions(jsonb, boolean, text, text) from public, anon, authenticated;
grant execute on function public.admin_ingest_tarif(jsonb, boolean, text, text) to service_role;
grant execute on function public.admin_ingest_decisions(jsonb, boolean, text, text) to service_role;
