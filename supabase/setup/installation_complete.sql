-- installation_complete.sql — GÉNÉRÉ par scripts/setup/build-install-sql.sh, ne pas modifier à la main.
-- À exécuter UNE FOIS sur une base Supabase NEUVE (SQL Editor → coller → Run).


-- ═════════ supabase/setup/00_schema_base.sql ═════════
-- supabase/setup/00_schema_base.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Schéma de base pour une NOUVELLE base Supabase (installation de zéro).
-- Plusieurs tables (users, invoices, subscription_plans…) avaient été créées
-- à la main dans le projet d'origine, hors migrations : ce fichier les recrée
-- (structure relevée sur la base de production le 2026-11-07), puis les
-- migrations 0001 → 0010 s'appliquent par-dessus.
-- Ne pas exécuter sur la base de production existante (inutile).
-- Utiliser de préférence supabase/setup/installation_complete.sql, qui
-- enchaîne ce fichier, les migrations et les index dans le bon ordre.
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists pgcrypto with schema extensions;
create extension if not exists vector with schema public;

-- ── Tables ──────────────────────────────────────────────────────────────────
create table if not exists public.admin_accounts (
  id uuid default gen_random_uuid() not null,
  email text not null,
  nom text,
  niveau text not null,
  statut text default 'invite'::text not null,
  permissions text[] default '{}'::text[] not null,
  password_hash text,
  token_hash text,
  token_purpose text,
  token_expires timestamp with time zone,
  session_id text,
  login_attempts integer default 0 not null,
  locked_until timestamp with time zone,
  created_by text,
  created_at timestamp with time zone default now() not null,
  last_login_at timestamp with time zone
);

create table if not exists public.audit_leads (
  id uuid default gen_random_uuid() not null,
  prenom text,
  nom text,
  email text not null,
  fonction text,
  entreprise text,
  reponses jsonb not null,
  score integer not null,
  statut text default 'nouveau'::text,
  created_at timestamp with time zone default now()
);

create table if not exists public.audit_reports (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  dossier_id uuid,
  score integer,
  recommendations jsonb not null,
  created_at timestamp with time zone default now()
);

create table if not exists public.conseil_operateurs (
  id text not null,
  titre integer not null,
  titre_label text not null,
  categorie text,
  question text not null,
  answer text not null,
  tags text[] default '{}'::text[],
  difficulte text,
  profils text[] default '{}'::text[],
  answer_words integer,
  sort_order integer,
  liens_utiles jsonb,
  views integer default 0,
  updated_at timestamp with time zone
);

create table if not exists public.conversations (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  dossier_id uuid,
  title text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.decisions_classement (
  id uuid default gen_random_uuid() not null,
  designation text not null,
  circulaire character varying not null,
  code_sh character varying not null,
  resume text,
  created_at timestamp with time zone default now(),
  date_circulaire date,
  objet text
);

create table if not exists public.decisions_historique (
  id uuid default gen_random_uuid() not null,
  lot_id uuid,
  decision_id uuid,
  champs text[] not null,
  avant jsonb not null,
  actor text not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.demandes_contact (
  id uuid default gen_random_uuid() not null,
  nom text not null,
  email text not null,
  societe text,
  service text,
  urgence text default 'normal'::text,
  message text not null,
  source text,
  statut text default 'nouvelle'::text,
  created_at timestamp with time zone default now()
);

create table if not exists public.dossiers (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  title text not null,
  description text,
  status text default 'actif'::text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.faq (
  id uuid default gen_random_uuid() not null,
  question text not null,
  reponse text not null,
  categorie character varying default 'Général'::character varying,
  tags text[] default '{}'::text[],
  embedding vector(1536),
  created_at timestamp with time zone default now()
);

create table if not exists public.glossaire (
  id uuid default gen_random_uuid() not null,
  terme text not null,
  definition text not null,
  domaine character varying default 'Général'::character varying,
  synonymes text[] default '{}'::text[],
  embedding vector(1536),
  created_at timestamp with time zone default now()
);

create table if not exists public.ingestion_lots (
  id uuid default gen_random_uuid() not null,
  type text not null,
  fichier text,
  actor text not null,
  compte jsonb not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.invoice_counters (
  kind text not null,
  year integer not null,
  last_number integer default 0 not null
);

create table if not exists public.invoices (
  id uuid default gen_random_uuid() not null,
  user_id uuid,
  plan_code text not null,
  years integer not null,
  amount numeric(12,2) not null,
  currency text default 'MAD'::text not null,
  status text default 'proforma_envoyee'::text not null,
  proforma_number text,
  invoice_number text,
  sent_at timestamp with time zone,
  paid_at timestamp with time zone,
  reminder_sent_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  numero_abonne text,
  client_email text
);

create table if not exists public.knowledge_chunks (
  id uuid default gen_random_uuid() not null,
  source_type character varying not null,
  type_document character varying,
  numero character varying,
  titre text,
  date_document character varying,
  emetteur text,
  statut character varying default 'en_vigueur'::character varying,
  langue character varying default 'fr'::character varying,
  domaine text,
  sous_domaine text,
  article text,
  articles_couverts text[],
  regime_douanier text,
  nc8_concerne text,
  mots_cles text[] default '{}'::text[],
  chunk_index integer,
  total_chunks integer,
  contenu text not null,
  embedding vector(1536),
  abroge_ou_modifie jsonb,
  modifie_par jsonb,
  date_fin_validite character varying,
  metadata_extra jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now(),
  date_doc date
);

create table if not exists public.messages (
  id uuid default gen_random_uuid() not null,
  conversation_id uuid not null,
  user_id uuid not null,
  role text not null,
  content text not null,
  sources jsonb default '[]'::jsonb,
  created_at timestamp with time zone default now()
);

create table if not exists public.scanner_leads (
  id uuid default gen_random_uuid() not null,
  prenom text,
  nom text,
  email text not null,
  fonction text,
  entreprise text,
  reponse_sh text not null,
  reponse_ale text not null,
  reponse_ctrl text not null,
  score integer not null,
  statut text default 'nouveau'::text,
  created_at timestamp with time zone default now()
);

create table if not exists public.scanner_reports (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  dossier_id uuid,
  input_summary text,
  result jsonb not null,
  created_at timestamp with time zone default now()
);

create table if not exists public.subscription_events (
  id uuid default gen_random_uuid() not null,
  user_id uuid,
  user_email text,
  type text not null,
  from_plan text,
  to_plan text,
  from_statut text,
  to_statut text,
  plan_ends_at timestamp with time zone,
  invoice_id uuid,
  amount numeric,
  note text,
  actor text default 'admin'::text not null,
  created_at timestamp with time zone default now() not null,
  numero_abonne text
);

create table if not exists public.subscription_plans (
  code text not null,
  label text not null,
  price_per_year numeric(12,2),
  currency text default 'MAD'::text not null,
  active boolean default true not null,
  sort_order integer default 0 not null,
  monthly_ref numeric,
  note text
);

create table if not exists public.tariff_searches (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  dossier_id uuid,
  query text not null,
  hs_code text,
  result jsonb,
  created_at timestamp with time zone default now()
);

create table if not exists public.tarifs (
  id uuid default gen_random_uuid() not null,
  code_sh character varying not null,
  chapitre character varying not null,
  designation_clean text not null,
  taux_droit numeric,
  taux_raw text,
  unite_norm character varying,
  est_feuille boolean default false,
  est_hierarchique boolean default false,
  niveau smallint default 0,
  annee_tarif integer,
  created_at timestamp with time zone default now()
);

create table if not exists public.tarifs_historique (
  id uuid default gen_random_uuid() not null,
  lot_id uuid,
  action text not null,
  tarif_id uuid,
  code_sh text not null,
  ancienne_ligne jsonb not null,
  nouvelle_ligne jsonb,
  actor text not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.user_memories (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  dossier_id uuid,
  key text not null,
  content text not null,
  metadata jsonb default '{}'::jsonb,
  embedding vector(1536),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.user_sessions (
  id uuid default gen_random_uuid() not null,
  user_id uuid,
  numero_abonne text not null,
  email text,
  session_id text not null,
  ip text,
  user_agent text,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.users (
  id uuid default gen_random_uuid() not null,
  email text not null,
  password_hash text not null,
  nom text,
  prenom text,
  societe text,
  profil text default 'autre'::text,
  plan text default 'trial'::text,
  statut text default 'trial'::text,
  trial_ends_at timestamp with time zone,
  login_attempts integer default 0,
  locked_until timestamp with time zone,
  last_login_at timestamp with time zone,
  role text,
  created_at timestamp with time zone default now(),
  current_session_id text,
  telephone text,
  email_verified boolean default false not null,
  verify_token text,
  verify_token_expires timestamp with time zone,
  plan_ends_at timestamp with time zone,
  trial_invite_sent_at timestamp with time zone,
  numero_abonne text
);

-- ── Contraintes ─────────────────────────────────────────────────────────────
-- Chaque contrainte est ajoutée seulement si elle n'existe pas encore.
do $$
declare c record;
begin
  for c in select * from (values
    ('admin_accounts','admin_accounts_pkey','PRIMARY KEY (id)'),
    ('audit_leads','audit_leads_pkey','PRIMARY KEY (id)'),
    ('audit_reports','audit_reports_pkey','PRIMARY KEY (id)'),
    ('conseil_operateurs','conseil_operateurs_pkey','PRIMARY KEY (id)'),
    ('conversations','conversations_pkey','PRIMARY KEY (id)'),
    ('decisions_classement','decisions_classement_pkey','PRIMARY KEY (id)'),
    ('decisions_historique','decisions_historique_pkey','PRIMARY KEY (id)'),
    ('demandes_contact','demandes_contact_pkey','PRIMARY KEY (id)'),
    ('dossiers','dossiers_pkey','PRIMARY KEY (id)'),
    ('faq','faq_pkey','PRIMARY KEY (id)'),
    ('glossaire','glossaire_pkey','PRIMARY KEY (id)'),
    ('ingestion_lots','ingestion_lots_pkey','PRIMARY KEY (id)'),
    ('invoice_counters','invoice_counters_pkey','PRIMARY KEY (kind, year)'),
    ('invoices','invoices_pkey','PRIMARY KEY (id)'),
    ('knowledge_chunks','knowledge_chunks_pkey','PRIMARY KEY (id)'),
    ('messages','messages_pkey','PRIMARY KEY (id)'),
    ('scanner_leads','scanner_leads_pkey','PRIMARY KEY (id)'),
    ('scanner_reports','scanner_reports_pkey','PRIMARY KEY (id)'),
    ('subscription_events','subscription_events_pkey','PRIMARY KEY (id)'),
    ('subscription_plans','subscription_plans_pkey','PRIMARY KEY (code)'),
    ('tariff_searches','tariff_searches_pkey','PRIMARY KEY (id)'),
    ('tarifs','tarifs_pkey','PRIMARY KEY (id)'),
    ('tarifs_historique','tarifs_historique_pkey','PRIMARY KEY (id)'),
    ('user_memories','user_memories_pkey','PRIMARY KEY (id)'),
    ('user_sessions','user_sessions_pkey','PRIMARY KEY (id)'),
    ('users','users_pkey','PRIMARY KEY (id)'),
    ('glossaire','glossaire_terme_key','UNIQUE (terme)'),
    ('invoices','invoices_invoice_number_key','UNIQUE (invoice_number)'),
    ('invoices','invoices_proforma_number_key','UNIQUE (proforma_number)'),
    ('user_memories','user_memories_user_id_key_key','UNIQUE (user_id, key)'),
    ('users','users_email_key','UNIQUE (email)'),
    ('admin_accounts','admin_accounts_email_lower','CHECK ((email = lower(TRIM(BOTH FROM email))))'),
    ('admin_accounts','admin_accounts_niveau_check','CHECK ((niveau = ANY (ARRAY[''super''::text, ''gestionnaire''::text])))'),
    ('admin_accounts','admin_accounts_permissions_known','CHECK ((permissions <@ ARRAY[''activer_plans''::text, ''emettre_proformas''::text, ''valider_paiements''::text, ''prolonger''::text, ''voir_montants''::text, ''ingerer_decisions''::text, ''maj_tarif''::text]))'),
    ('admin_accounts','admin_accounts_statut_check','CHECK ((statut = ANY (ARRAY[''invite''::text, ''actif''::text, ''suspendu''::text])))'),
    ('admin_accounts','admin_accounts_token_purpose_check','CHECK ((token_purpose = ANY (ARRAY[''invitation''::text, ''reinitialisation''::text])))'),
    ('conseil_operateurs','conseil_operateurs_difficulte_check','CHECK ((difficulte = ANY (ARRAY[''débutant''::text, ''intermédiaire''::text, ''avancé''::text])))'),
    ('ingestion_lots','ingestion_lots_type_check','CHECK ((type = ANY (ARRAY[''tarif''::text, ''decisions''::text])))'),
    ('invoices','invoices_status_check','CHECK ((status = ANY (ARRAY[''proforma_envoyee''::text, ''payee''::text, ''annulee''::text])))'),
    ('invoices','invoices_years_check','CHECK (((years >= 1) AND (years <= 5)))'),
    ('messages','messages_role_check','CHECK ((role = ANY (ARRAY[''user''::text, ''assistant''::text])))'),
    ('tarifs_historique','tarifs_historique_action_check','CHECK ((action = ANY (ARRAY[''modification''::text, ''remplacement''::text])))'),
    ('audit_reports','audit_reports_dossier_id_fkey','FOREIGN KEY (dossier_id) REFERENCES public.dossiers(id) ON DELETE SET NULL'),
    ('audit_reports','audit_reports_user_id_fkey','FOREIGN KEY (user_id) REFERENCES auth.users(id)'),
    ('conversations','conversations_dossier_id_fkey','FOREIGN KEY (dossier_id) REFERENCES public.dossiers(id) ON DELETE SET NULL'),
    ('conversations','conversations_user_id_fkey','FOREIGN KEY (user_id) REFERENCES auth.users(id)'),
    ('decisions_historique','decisions_historique_lot_id_fkey','FOREIGN KEY (lot_id) REFERENCES public.ingestion_lots(id) ON DELETE SET NULL'),
    ('dossiers','dossiers_user_id_fkey','FOREIGN KEY (user_id) REFERENCES auth.users(id)'),
    ('invoices','invoices_plan_code_fkey','FOREIGN KEY (plan_code) REFERENCES public.subscription_plans(code)'),
    ('invoices','invoices_user_id_fkey','FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL'),
    ('messages','messages_conversation_id_fkey','FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE'),
    ('messages','messages_user_id_fkey','FOREIGN KEY (user_id) REFERENCES auth.users(id)'),
    ('scanner_reports','scanner_reports_dossier_id_fkey','FOREIGN KEY (dossier_id) REFERENCES public.dossiers(id) ON DELETE SET NULL'),
    ('scanner_reports','scanner_reports_user_id_fkey','FOREIGN KEY (user_id) REFERENCES auth.users(id)'),
    ('subscription_events','subscription_events_invoice_id_fkey','FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL'),
    ('subscription_events','subscription_events_user_id_fkey','FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL'),
    ('tariff_searches','tariff_searches_dossier_id_fkey','FOREIGN KEY (dossier_id) REFERENCES public.dossiers(id) ON DELETE SET NULL'),
    ('tariff_searches','tariff_searches_user_id_fkey','FOREIGN KEY (user_id) REFERENCES auth.users(id)'),
    ('tarifs_historique','tarifs_historique_lot_id_fkey','FOREIGN KEY (lot_id) REFERENCES public.ingestion_lots(id) ON DELETE SET NULL'),
    ('user_memories','user_memories_dossier_id_fkey','FOREIGN KEY (dossier_id) REFERENCES public.dossiers(id) ON DELETE SET NULL'),
    ('user_memories','user_memories_user_id_fkey','FOREIGN KEY (user_id) REFERENCES auth.users(id)'),
    ('user_sessions','user_sessions_user_id_fkey','FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL')
  ) v(tbl, name, def) loop
    if not exists (select 1 from pg_constraint where conname = c.name and conrelid = ('public.' || c.tbl)::regclass) then
      execute format('alter table public.%I add constraint %I %s', c.tbl, c.name, c.def);
    end if;
  end loop;
end $$;

-- ── Sécurité : RLS (accès par la clé service uniquement, sauf politiques) ──
alter table public.admin_accounts       enable row level security;
alter table public.audit_leads          enable row level security;
alter table public.audit_reports        enable row level security;
alter table public.conseil_operateurs   enable row level security;
alter table public.conversations        enable row level security;
alter table public.decisions_classement enable row level security;
alter table public.decisions_historique enable row level security;
alter table public.demandes_contact     enable row level security;
alter table public.dossiers             enable row level security;
alter table public.faq                  enable row level security;
alter table public.glossaire            enable row level security;
alter table public.ingestion_lots       enable row level security;
alter table public.invoice_counters     enable row level security;
alter table public.invoices             enable row level security;
alter table public.knowledge_chunks     enable row level security;
alter table public.messages             enable row level security;
alter table public.scanner_leads        enable row level security;
alter table public.scanner_reports      enable row level security;
alter table public.subscription_events  enable row level security;
alter table public.subscription_plans   enable row level security;
alter table public.tariff_searches      enable row level security;
alter table public.tarifs               enable row level security;
alter table public.tarifs_historique    enable row level security;
alter table public.user_memories        enable row level security;
alter table public.user_sessions        enable row level security;
alter table public.users                enable row level security;

drop policy if exists "lecture publique knowledge_chunks" on public.knowledge_chunks;
create policy "lecture publique knowledge_chunks" on public.knowledge_chunks as permissive for select to anon, authenticated using (true);
drop policy if exists "Lecture publique" on public.faq;
create policy "Lecture publique" on public.faq as permissive for select to public using (true);
drop policy if exists "Lecture publique" on public.conseil_operateurs;
create policy "Lecture publique" on public.conseil_operateurs as permissive for select to public using (true);
drop policy if exists "users manage their own dossiers" on public.dossiers;
create policy "users manage their own dossiers" on public.dossiers as permissive for all to public using ((auth.uid() = user_id)) with check ((auth.uid() = user_id));
drop policy if exists "users manage their own conversations" on public.conversations;
create policy "users manage their own conversations" on public.conversations as permissive for all to public using ((auth.uid() = user_id)) with check ((auth.uid() = user_id));
drop policy if exists "users manage their own messages" on public.messages;
create policy "users manage their own messages" on public.messages as permissive for all to public using ((auth.uid() = user_id)) with check ((auth.uid() = user_id));
drop policy if exists "users manage their own scanner reports" on public.scanner_reports;
create policy "users manage their own scanner reports" on public.scanner_reports as permissive for all to public using ((auth.uid() = user_id)) with check ((auth.uid() = user_id));
drop policy if exists "users manage their own audit reports" on public.audit_reports;
create policy "users manage their own audit reports" on public.audit_reports as permissive for all to public using ((auth.uid() = user_id)) with check ((auth.uid() = user_id));
drop policy if exists "users manage their own tariff searches" on public.tariff_searches;
create policy "users manage their own tariff searches" on public.tariff_searches as permissive for all to public using ((auth.uid() = user_id)) with check ((auth.uid() = user_id));
drop policy if exists "users manage their own memories" on public.user_memories;
create policy "users manage their own memories" on public.user_memories as permissive for all to public using ((auth.uid() = user_id)) with check ((auth.uid() = user_id));

-- ── Fonctions non couvertes par les migrations ──────────────────────────────
create or replace function public.next_document_number(p_kind text)
returns text
language plpgsql
as $function$
declare
  y int := extract(year from now())::int;
  n int;
  prefix text := case p_kind when 'proforma' then 'PF-IA' else 'IA' end;
begin
  insert into invoice_counters (kind, year, last_number) values (p_kind, y, 1)
  on conflict (kind, year)
  do update set last_number = invoice_counters.last_number + 1
  returning last_number into n;
  return prefix || '-' || y || '-' || lpad(n::text, 4, '0');
end $function$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

create or replace function public.get_recent_activity(p_limit integer default 20)
returns table(item_type text, item_id uuid, dossier_id uuid, summary text, created_at timestamp with time zone)
language sql
security definer
set search_path to 'public'
as $function$
  select 'conversation', id, dossier_id, coalesce(title, 'Conversation sans titre'), created_at
  from conversations where user_id = auth.uid()
  union all
  select 'scanner_report', id, dossier_id, coalesce(input_summary, 'Scan'), created_at
  from scanner_reports where user_id = auth.uid()
  union all
  select 'audit_report', id, dossier_id, 'Rapport audit — score ' || coalesce(score::text, 'N/A'), created_at
  from audit_reports where user_id = auth.uid()
  union all
  select 'tariff_search', id, dossier_id, query, created_at
  from tariff_searches where user_id = auth.uid()
  order by created_at desc
  limit p_limit;
$function$;

create or replace function public.get_recent_activity(p_user_id uuid, p_limit integer default 20)
returns table(item_type text, item_id uuid, dossier_id uuid, summary text, created_at timestamp with time zone)
language sql
security definer
set search_path to 'public'
as $function$
  select 'conversation', id, dossier_id, coalesce(title, 'Conversation sans titre'), created_at
  from conversations where user_id = p_user_id
  union all
  select 'scanner_report', id, dossier_id, coalesce(input_summary, 'Scan'), created_at
  from scanner_reports where user_id = p_user_id
  union all
  select 'audit_report', id, dossier_id, 'Rapport audit — score ' || coalesce(score::text, 'N/A'), created_at
  from audit_reports where user_id = p_user_id
  union all
  select 'tariff_search', id, dossier_id, query, created_at
  from tariff_searches where user_id = p_user_id
  order by created_at desc
  limit p_limit;
$function$;

create or replace function public.match_user_memories(query_embedding vector, match_threshold double precision default 0.75, match_count integer default 5, p_dossier_id uuid default null::uuid)
returns table(id uuid, key text, content text, metadata jsonb, similarity double precision)
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  return query
  select um.id, um.key, um.content, um.metadata,
         1 - (um.embedding <=> query_embedding) as similarity
  from user_memories um
  where um.user_id = auth.uid()
    and (p_dossier_id is null or um.dossier_id = p_dossier_id)
    and um.embedding is not null
    and 1 - (um.embedding <=> query_embedding) > match_threshold
  order by um.embedding <=> query_embedding
  limit match_count;
end;
$function$;

create or replace function public.match_user_memories(p_user_id uuid, query_embedding vector, match_threshold double precision default 0.75, match_count integer default 5, p_dossier_id uuid default null::uuid)
returns table(id uuid, key text, content text, metadata jsonb, similarity double precision)
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  return query
  select um.id, um.key, um.content, um.metadata,
         1 - (um.embedding <=> query_embedding) as similarity
  from user_memories um
  where um.user_id = p_user_id
    and (p_dossier_id is null or um.dossier_id = p_dossier_id)
    and um.embedding is not null
    and 1 - (um.embedding <=> query_embedding) > match_threshold
  order by um.embedding <=> query_embedding
  limit match_count;
end;
$function$;

revoke all on function public.next_document_number(text) from public, anon, authenticated;
grant execute on function public.next_document_number(text) to service_role;

drop trigger if exists trg_dossiers_updated_at on public.dossiers;
create trigger trg_dossiers_updated_at before update on public.dossiers for each row execute function public.set_updated_at();
drop trigger if exists trg_conversations_updated_at on public.conversations;
create trigger trg_conversations_updated_at before update on public.conversations for each row execute function public.set_updated_at();
drop trigger if exists trg_user_memories_updated_at on public.user_memories;
create trigger trg_user_memories_updated_at before update on public.user_memories for each row execute function public.set_updated_at();

-- Recherche sémantique (version en production ; la migration 0003 déclarait
-- date_document en date alors que la colonne est un texte).
create or replace function public.match_knowledge_chunks(query_embedding vector, match_threshold double precision default 0.72, match_count integer default 6)
returns table(id uuid, contenu text, titre text, numero text, type_document text, date_document text, source_type text, similarity double precision)
language sql
stable
as $function$
  select kc.id, kc.contenu, kc.titre, kc.numero, kc.type_document, kc.date_document, kc.source_type,
         1 - (kc.embedding <=> query_embedding) as similarity
  from knowledge_chunks kc
  where 1 - (kc.embedding <=> query_embedding) > match_threshold
  order by kc.embedding <=> query_embedding
  limit match_count;
$function$;


-- ═════════ supabase/migrations/0004_subscriptions.sql ═════════
-- supabase/migrations/0004_subscriptions.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Gestion des abonnements depuis le backoffice (2026-11-01)
--
-- Objectif : piloter les abonnements SANS intervenir directement dans
-- Supabase. Le backoffice appelle ces fonctions via /api/admin/subscriptions
-- (clé service uniquement — jamais exposées à la clé anon).
--
-- Flux standard (paiement par virement, facturation ANNUELLE) :
--   1. admin_create_proforma   → facture pro-forma PF-IA-AAAA-NNNN
--   2. admin_confirm_payment   → facture IA-AAAA-NNNN « payée » + plan activé
--   ou en un clic : admin_activate_plan (pro-forma + paiement simultanés)
-- Autres actions : admin_set_status (suspendre / réactiver),
--   admin_extend_subscription (prolongation commerciale),
--   admin_cancel_proforma, expire_subscriptions (tâche quotidienne).
-- Chaque action est journalisée dans subscription_events.
--
-- Additive : ne modifie ni ne supprime aucune donnée existante.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Grille tarifaire (miroir de lib/pricing.ts) ──────────────────────────
alter table public.subscription_plans alter column price_per_year drop not null;
alter table public.subscription_plans add column if not exists monthly_ref numeric;
alter table public.subscription_plans add column if not exists note text;

insert into public.subscription_plans (code, label, price_per_year, monthly_ref, currency, active, sort_order, note) values
  ('pro',        'Pro',        6000, 680, 'MAD', true, 1, 'Deux mois offerts'),
  ('premium',    'Premium',    9000, 970, 'MAD', true, 2, 'Deux mois offerts'),
  ('enterprise', 'Entreprise', null, null,'MAD', true, 3, 'Option contractuelle — montant fixé au contrat')
on conflict (code) do update set
  label          = excluded.label,
  price_per_year = excluded.price_per_year,
  monthly_ref    = excluded.monthly_ref,
  note           = excluded.note,
  active         = excluded.active,
  sort_order     = excluded.sort_order;

-- ── 2. Journal des événements d'abonnement ──────────────────────────────────
create table if not exists public.subscription_events (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.users(id) on delete set null,
  user_email    text,
  type          text not null check (type in (
                  'proforma', 'paiement_valide', 'activation', 'suspension',
                  'reactivation', 'prolongation', 'expiration', 'proforma_annulee')),
  from_plan     text,
  to_plan       text,
  from_statut   text,
  to_statut     text,
  plan_ends_at  timestamptz,
  invoice_id    uuid references public.invoices(id) on delete set null,
  amount        numeric,
  note          text,
  actor         text not null default 'admin',
  created_at    timestamptz not null default now()
);
create index if not exists subscription_events_created_idx on public.subscription_events (created_at desc);
create index if not exists subscription_events_user_idx    on public.subscription_events (user_id);
alter table public.subscription_events enable row level security;
-- Aucune policy : lecture/écriture réservées à la clé service.

create index if not exists invoices_user_idx   on public.invoices (user_id);
create index if not exists invoices_status_idx on public.invoices (status);

-- ── 3. Pro-forma ────────────────────────────────────────────────────────────
create or replace function public.admin_create_proforma(
  p_user_id uuid,
  p_plan    text,
  p_years   int     default 1,
  p_amount  numeric default null,   -- obligatoire pour 'enterprise'
  p_actor   text    default 'admin',
  p_note    text    default null
) returns public.invoices
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user  users%rowtype;
  v_price numeric;
  v_inv   invoices%rowtype;
begin
  select * into v_user from users where id = p_user_id;
  if not found then raise exception 'Utilisateur introuvable'; end if;

  select price_per_year into v_price from subscription_plans where code = p_plan and active;
  if not found then raise exception 'Plan inconnu ou inactif : %', p_plan; end if;

  if p_amount is null then
    if v_price is null then
      raise exception 'Le plan % est contractuel : saisir le montant du contrat', p_plan;
    end if;
    p_amount := v_price * p_years;
  end if;
  if p_amount < 0 then raise exception 'Montant invalide'; end if;

  insert into invoices (user_id, plan_code, years, amount, currency, status, proforma_number, sent_at)
  values (p_user_id, p_plan, p_years, p_amount, 'MAD', 'proforma_envoyee',
          next_document_number('proforma'), now())
  returning * into v_inv;

  insert into subscription_events (user_id, user_email, type, from_plan, to_plan, from_statut, to_statut, invoice_id, amount, note, actor)
  values (v_user.id, v_user.email, 'proforma', v_user.plan, p_plan, v_user.statut, v_user.statut, v_inv.id, p_amount, p_note, p_actor);

  return v_inv;
end $$;

-- ── 4. Validation du paiement → activation du plan ──────────────────────────
-- Renouvellement du MÊME plan encore en cours : la nouvelle période s'ajoute
-- à la fin de la période en cours. Changement de plan, ou plan échu : la
-- période démarre aujourd'hui.
create or replace function public.admin_confirm_payment(
  p_invoice_id uuid,
  p_actor      text default 'admin',
  p_note       text default null
) returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv   invoices%rowtype;
  v_user  users%rowtype;
  v_base  timestamptz;
  v_end   timestamptz;
  v_out   users%rowtype;
begin
  select * into v_inv from invoices where id = p_invoice_id for update;
  if not found then raise exception 'Facture introuvable'; end if;
  if v_inv.status <> 'proforma_envoyee' then
    raise exception 'Cette facture est déjà %', v_inv.status;
  end if;

  select * into v_user from users where id = v_inv.user_id for update;

  if v_user.plan = v_inv.plan_code and v_user.statut = 'active'
     and v_user.plan_ends_at is not null and v_user.plan_ends_at > now() then
    v_base := v_user.plan_ends_at;
  else
    v_base := now();
  end if;
  v_end := v_base + make_interval(years => v_inv.years);

  update invoices set
    status         = 'payee',
    paid_at        = now(),
    invoice_number = next_document_number('invoice')
  where id = v_inv.id;

  update users set
    plan         = v_inv.plan_code,
    statut       = 'active',
    plan_ends_at = v_end
  where id = v_user.id
  returning * into v_out;

  insert into subscription_events (user_id, user_email, type, from_plan, to_plan, from_statut, to_statut, plan_ends_at, invoice_id, amount, note, actor)
  values (v_user.id, v_user.email, 'paiement_valide', v_user.plan, v_inv.plan_code, v_user.statut, 'active', v_end, v_inv.id, v_inv.amount, p_note, p_actor);

  return v_out;
end $$;

-- ── 5. Activation en un clic (paiement déjà reçu, pas de pro-forma) ─────────
create or replace function public.admin_activate_plan(
  p_user_id uuid,
  p_plan    text,
  p_years   int     default 1,
  p_amount  numeric default null,
  p_actor   text    default 'admin',
  p_note    text    default null
) returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv invoices%rowtype;
begin
  v_inv := admin_create_proforma(p_user_id, p_plan, p_years, p_amount, p_actor, p_note);
  return admin_confirm_payment(v_inv.id, p_actor, p_note);
end $$;

-- ── 6. Suspendre / réactiver ────────────────────────────────────────────────
-- p_action : 'suspend' | 'reactivate'. La réactivation recalcule le statut
-- (actif si période payée en cours, essai si essai en cours, sinon expiré).
create or replace function public.admin_set_status(
  p_user_id uuid,
  p_action  text,
  p_actor   text default 'admin',
  p_note    text default null
) returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user users%rowtype;
  v_new  text;
  v_out  users%rowtype;
begin
  select * into v_user from users where id = p_user_id for update;
  if not found then raise exception 'Utilisateur introuvable'; end if;

  if p_action = 'suspend' then
    v_new := 'suspended';
  elsif p_action = 'reactivate' then
    if v_user.plan in ('pro','premium','enterprise') and v_user.plan_ends_at > now() then
      v_new := 'active';
    elsif v_user.plan = 'trial' and v_user.trial_ends_at > now() then
      v_new := 'trial';
    elsif v_user.plan = 'free' then
      v_new := 'active';
    else
      v_new := 'expired';
    end if;
  else
    raise exception 'Action inconnue : %', p_action;
  end if;

  update users set statut = v_new where id = v_user.id returning * into v_out;

  insert into subscription_events (user_id, user_email, type, from_plan, to_plan, from_statut, to_statut, plan_ends_at, note, actor)
  values (v_user.id, v_user.email,
          case when p_action = 'suspend' then 'suspension' else 'reactivation' end,
          v_user.plan, v_user.plan, v_user.statut, v_new, v_user.plan_ends_at, p_note, p_actor);

  return v_out;
end $$;

-- ── 7. Prolongation commerciale (geste, report d'échéance) ─────────────────
create or replace function public.admin_extend_subscription(
  p_user_id uuid,
  p_days    int,
  p_actor   text default 'admin',
  p_note    text default null
) returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user users%rowtype;
  v_out  users%rowtype;
begin
  if p_days is null or p_days < 1 or p_days > 366 then
    raise exception 'Durée invalide (1 à 366 jours)';
  end if;
  select * into v_user from users where id = p_user_id for update;
  if not found then raise exception 'Utilisateur introuvable'; end if;

  if v_user.plan = 'trial' then
    update users set
      trial_ends_at = greatest(coalesce(trial_ends_at, now()), now()) + make_interval(days => p_days),
      statut        = case when statut = 'suspended' then statut else 'trial' end
    where id = v_user.id returning * into v_out;
  elsif v_user.plan in ('pro','premium','enterprise') then
    update users set
      plan_ends_at = greatest(coalesce(plan_ends_at, now()), now()) + make_interval(days => p_days),
      statut       = case when statut = 'suspended' then statut else 'active' end
    where id = v_user.id returning * into v_out;
  else
    raise exception 'Aucune échéance à prolonger pour le plan %', v_user.plan;
  end if;

  insert into subscription_events (user_id, user_email, type, from_plan, to_plan, from_statut, to_statut, plan_ends_at, note, actor)
  values (v_user.id, v_user.email, 'prolongation', v_user.plan, v_out.plan, v_user.statut, v_out.statut,
          coalesce(v_out.plan_ends_at, v_out.trial_ends_at), coalesce(p_note, p_days || ' jours'), p_actor);

  return v_out;
end $$;

-- ── 8. Annulation d'une pro-forma non payée ─────────────────────────────────
create or replace function public.admin_cancel_proforma(
  p_invoice_id uuid,
  p_actor      text default 'admin',
  p_note       text default null
) returns public.invoices
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv invoices%rowtype;
  v_email text;
begin
  update invoices set status = 'annulee'
  where id = p_invoice_id and status = 'proforma_envoyee'
  returning * into v_inv;
  if not found then raise exception 'Pro-forma introuvable ou déjà traitée'; end if;

  select email into v_email from users where id = v_inv.user_id;
  insert into subscription_events (user_id, user_email, type, to_plan, invoice_id, amount, note, actor)
  values (v_inv.user_id, v_email, 'proforma_annulee', v_inv.plan_code, v_inv.id, v_inv.amount, p_note, p_actor);
  return v_inv;
end $$;

-- ── 9. Expiration automatique (appelée chaque jour par /api/cron/expire-subscriptions)
create or replace function public.expire_subscriptions()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  with expired as (
    update users set statut = 'expired'
    where (statut = 'active' and plan in ('pro','premium','enterprise')
             and plan_ends_at is not null and plan_ends_at < now())
       or (statut = 'trial' and trial_ends_at is not null and trial_ends_at < now())
    returning id, email, plan, plan_ends_at, trial_ends_at,
              case when plan = 'trial' then 'trial' else 'active' end as old_statut
  )
  insert into subscription_events (user_id, user_email, type, from_plan, to_plan, from_statut, to_statut, plan_ends_at, actor)
  select id, email, 'expiration', plan, plan, old_statut, 'expired', coalesce(plan_ends_at, trial_ends_at), 'systeme'
  from expired;
  get diagnostics n = row_count;
  return n;
end $$;

-- ── 10. Indicateurs du tableau de bord (données réelles uniquement) ─────────
create or replace function public.admin_dashboard_stats()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'users_total',        (select count(*) from users),
    'users_new_30d',      (select count(*) from users where created_at > now() - interval '30 days'),
    'users_unverified',   (select count(*) from users where not email_verified),
    'by_statut',          (select coalesce(jsonb_object_agg(statut, n), '{}'::jsonb)
                             from (select coalesce(statut,'?') statut, count(*) n from users group by 1) s),
    'active_paid_by_plan',(select coalesce(jsonb_object_agg(plan, n), '{}'::jsonb)
                             from (select plan, count(*) n from users
                                   where statut = 'active' and plan in ('pro','premium','enterprise')
                                   group by 1) s),
    'trials_running',     (select count(*) from users where statut = 'trial' and trial_ends_at > now()),
    'expiring_30d',       (select count(*) from users
                             where statut = 'active' and plan_ends_at between now() and now() + interval '30 days'),
    'revenue_12m',        (select coalesce(sum(amount),0) from invoices
                             where status = 'payee' and paid_at > now() - interval '12 months'),
    'revenue_ytd',        (select coalesce(sum(amount),0) from invoices
                             where status = 'payee' and paid_at >= date_trunc('year', now())),
    'proformas_pending',  (select count(*) from invoices where status = 'proforma_envoyee'),
    'proformas_pending_amount', (select coalesce(sum(amount),0) from invoices where status = 'proforma_envoyee'),
    'tarifs',             (select count(*) from tarifs),
    'circulaires',        (select count(distinct coalesce(numero, titre)) from knowledge_chunks),
    'knowledge_chunks',   (select count(*) from knowledge_chunks),
    'decisions',          (select count(*) from decisions_classement),
    'leads',              (select (select count(*) from audit_leads) + (select count(*) from scanner_leads)),
    'leads_30d',          (select (select count(*) from audit_leads   where created_at > now() - interval '30 days')
                                + (select count(*) from scanner_leads where created_at > now() - interval '30 days'))
  )
$$;

-- ── 11. Sécurité : fonctions réservées à la clé service ─────────────────────
-- Les fonctions du schéma public sont appelables par PostgREST (/rpc). La clé
-- anon étant publique (NEXT_PUBLIC_SUPABASE_ANON_KEY), on retire tout droit
-- d'exécution aux rôles anon / authenticated.
do $$
declare f text;
begin
  foreach f in array array[
    'admin_create_proforma(uuid,text,int,numeric,text,text)',
    'admin_confirm_payment(uuid,text,text)',
    'admin_activate_plan(uuid,text,int,numeric,text,text)',
    'admin_set_status(uuid,text,text,text)',
    'admin_extend_subscription(uuid,int,text,text)',
    'admin_cancel_proforma(uuid,text,text)',
    'expire_subscriptions()',
    'admin_dashboard_stats()'
  ] loop
    execute format('revoke all on function public.%s from public, anon, authenticated', f);
    execute format('grant execute on function public.%s to service_role', f);
  end loop;
end $$;

-- next_document_number est utilisée par les fonctions ci-dessus ; elle ne
-- doit pas non plus être appelable avec la clé anon.
revoke all on function public.next_document_number(text) from public, anon, authenticated;
grant execute on function public.next_document_number(text) to service_role;


-- ═════════ supabase/migrations/0005_numero_abonne_sessions_suppression.sql ═════════
-- supabase/migrations/0005_numero_abonne_sessions_suppression.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Mise en exploitation (2026-11-01)
--
-- 1. Numéro d'abonné unique, format AAIXPNNN : 26IXP001, 26IXP002…
--    • AA  = deux derniers chiffres de l'année d'inscription
--    • NNN = rang dans l'année, sur 3 chiffres (passe à 4 chiffres au-delà
--            de 999 : 26IXP1000 — jamais tronqué)
--    • attribué automatiquement à l'inscription (trigger), et aux comptes
--      existants par ordre de création ; jamais réutilisé, même après
--      suppression du compte.
-- 2. Le numéro et l'email sont recopiés sur chaque facture et chaque
--    événement d'abonnement : l'historique reste lisible après suppression.
-- 3. Journal des connexions (user_sessions) : chaque session de connexion
--    est rattachée au numéro d'abonné.
-- 4. Suppression d'un compte depuis le backoffice (admin_delete_user) :
--    confirmation par le numéro d'abonné, factures conservées.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Numéro d'abonné ──────────────────────────────────────────────────────
alter table public.users add column if not exists numero_abonne text;
create unique index if not exists users_numero_abonne_key on public.users (numero_abonne);

-- Compteur annuel : réutilise invoice_counters (clé kind + year), kind = 'abonne'.
create or replace function public.next_subscriber_number(p_at timestamptz default now())
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  y int := extract(year from coalesce(p_at, now()))::int;
  n int;
begin
  insert into invoice_counters (kind, year, last_number) values ('abonne', y, 1)
  on conflict (kind, year) do update set last_number = invoice_counters.last_number + 1
  returning last_number into n;
  return lpad((y % 100)::text, 2, '0') || 'IXP' ||
         case when n < 1000 then lpad(n::text, 3, '0') else n::text end;
end $$;

create or replace function public.users_assign_numero()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.numero_abonne is null then
    new.numero_abonne := next_subscriber_number(coalesce(new.created_at, now()));
  end if;
  return new;
end $$;

drop trigger if exists trg_users_numero_abonne on public.users;
create trigger trg_users_numero_abonne
  before insert on public.users
  for each row execute function public.users_assign_numero();

-- Comptes existants : numérotés dans l'ordre d'inscription.
do $$
declare r record;
begin
  for r in select id, created_at from public.users where numero_abonne is null order by created_at, id loop
    update public.users set numero_abonne = next_subscriber_number(r.created_at) where id = r.id;
  end loop;
end $$;

alter table public.users alter column numero_abonne set not null;

-- ── 2. Copie du numéro sur factures et événements ───────────────────────────
alter table public.invoices            add column if not exists numero_abonne text;
alter table public.invoices            add column if not exists client_email  text;
alter table public.subscription_events add column if not exists numero_abonne text;

create or replace function public.copy_subscriber_identity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_num text; v_email text;
begin
  if new.user_id is not null then
    select numero_abonne, email into v_num, v_email from users where id = new.user_id;
    new.numero_abonne := coalesce(new.numero_abonne, v_num);
    if tg_table_name = 'invoices' then
      new.client_email := coalesce(new.client_email, v_email);
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_invoices_identity on public.invoices;
create trigger trg_invoices_identity before insert on public.invoices
  for each row execute function public.copy_subscriber_identity();
drop trigger if exists trg_events_identity on public.subscription_events;
create trigger trg_events_identity before insert on public.subscription_events
  for each row execute function public.copy_subscriber_identity();

update public.invoices i set numero_abonne = u.numero_abonne, client_email = u.email
  from public.users u where u.id = i.user_id and i.numero_abonne is null;
update public.subscription_events e set numero_abonne = u.numero_abonne
  from public.users u where u.id = e.user_id and e.numero_abonne is null;

create index if not exists invoices_numero_idx on public.invoices (numero_abonne);
create index if not exists subscription_events_numero_idx on public.subscription_events (numero_abonne);

-- Les factures sont conservées quand un compte est supprimé (obligation
-- comptable) : le lien devient NULL, le numéro et l'email restent.
alter table public.invoices alter column user_id drop not null;
alter table public.invoices drop constraint if exists invoices_user_id_fkey;
alter table public.invoices add constraint invoices_user_id_fkey
  foreign key (user_id) references public.users(id) on delete set null;

-- ── 3. Journal des connexions ───────────────────────────────────────────────
create table if not exists public.user_sessions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references public.users(id) on delete set null,
  numero_abonne  text not null,
  email          text,
  session_id     text not null,
  ip             text,
  user_agent     text,
  created_at     timestamptz not null default now()
);
create index if not exists user_sessions_created_idx on public.user_sessions (created_at desc);
create index if not exists user_sessions_numero_idx  on public.user_sessions (numero_abonne);
alter table public.user_sessions enable row level security;
-- Aucune policy : lecture/écriture réservées à la clé service.

-- ── 4. Suppression d'un compte ──────────────────────────────────────────────
alter table public.subscription_events drop constraint if exists subscription_events_type_check;
alter table public.subscription_events add constraint subscription_events_type_check check (type in (
  'proforma', 'paiement_valide', 'activation', 'suspension', 'reactivation',
  'prolongation', 'expiration', 'proforma_annulee', 'suppression'));

create or replace function public.admin_delete_user(
  p_user_id uuid,
  p_confirm text,                 -- doit être égal au numéro d'abonné
  p_actor   text default 'admin',
  p_note    text default null
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user users%rowtype;
begin
  select * into v_user from users where id = p_user_id for update;
  if not found then raise exception 'Compte introuvable'; end if;
  if v_user.role = 'admin' then
    raise exception 'Un compte administrateur ne peut pas être supprimé depuis le backoffice';
  end if;
  if p_confirm is null or upper(trim(p_confirm)) <> v_user.numero_abonne then
    raise exception 'Confirmation incorrecte : saisir le numéro d''abonné %', v_user.numero_abonne;
  end if;

  -- Pro-formas jamais payées : annulées (les factures payées restent intactes).
  update invoices set status = 'annulee' where user_id = v_user.id and status = 'proforma_envoyee';

  delete from users where id = v_user.id;

  insert into subscription_events (user_id, user_email, numero_abonne, type, from_plan, from_statut, note, actor)
  values (null, v_user.email, v_user.numero_abonne, 'suppression', v_user.plan, v_user.statut, p_note, p_actor);

  return v_user.numero_abonne;
end $$;

-- ── 5. Droits : clé service uniquement ──────────────────────────────────────
do $$
declare f text;
begin
  foreach f in array array[
    'next_subscriber_number(timestamptz)',
    'users_assign_numero()',
    'copy_subscriber_identity()',
    'admin_delete_user(uuid,text,text,text)'
  ] loop
    execute format('revoke all on function public.%s from public, anon, authenticated', f);
    execute format('grant execute on function public.%s to service_role', f);
  end loop;
end $$;


-- ═════════ supabase/migrations/0006_admin_accounts.sql ═════════
-- supabase/migrations/0006_admin_accounts.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Comptes administrateurs nominatifs (2026-11-01)
--
-- Deux niveaux :
--   • super        — type 1. UN SEUL compte, txp.expert@gmail.com (compte
--                    maître, concepteur). Toutes les capacités ; seul à créer,
--                    suspendre, supprimer des administrateurs et à régler leurs
--                    habilitations. Ne peut être ni suspendu ni supprimé.
--   • gestionnaire — type 2. Accède uniquement au tableau de bord « Gestion
--                    des abonnements ». Ses actions sont limitées aux
--                    habilitations cochées par le super-administrateur :
--                      activer_plans      activer / renouveler un plan
--                      emettre_proformas  émettre une pro-forma
--                      valider_paiements  valider ou annuler une pro-forma
--                      prolonger          prolonger une échéance
--                      voir_montants      voir les montants encaissés
--                    Il ne peut jamais créer, suspendre ni supprimer un compte.
--
-- Connexion : email + mot de passe personnel (hash bcrypt, jamais en clair).
-- Le mot de passe est créé via un lien à usage unique (invitation ou
-- réinitialisation) dont seul le hash SHA-256 est stocké.
-- Table accessible uniquement avec la clé service (RLS sans policy).
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.admin_accounts (
  id               uuid primary key default gen_random_uuid(),
  email            text not null,
  nom              text,
  niveau           text not null check (niveau in ('super', 'gestionnaire')),
  statut           text not null default 'invite' check (statut in ('invite', 'actif', 'suspendu')),
  permissions      text[] not null default '{}',
  password_hash    text,
  token_hash       text,
  token_purpose    text check (token_purpose in ('invitation', 'reinitialisation')),
  token_expires    timestamptz,
  session_id       text,
  login_attempts   int not null default 0,
  locked_until     timestamptz,
  created_by       text,
  created_at       timestamptz not null default now(),
  last_login_at    timestamptz,
  constraint admin_accounts_email_lower check (email = lower(trim(email))),
  constraint admin_accounts_permissions_known check (
    permissions <@ array['activer_plans','emettre_proformas','valider_paiements','prolonger','voir_montants']::text[]
  )
);
create unique index if not exists admin_accounts_email_key on public.admin_accounts (email);
-- Un seul super-administrateur possible.
create unique index if not exists admin_accounts_single_super on public.admin_accounts ((niveau)) where niveau = 'super';
create index if not exists admin_accounts_token_idx on public.admin_accounts (token_hash) where token_hash is not null;
alter table public.admin_accounts enable row level security;

-- Garde-fous en base : le compte maître ne peut être ni suspendu, ni supprimé,
-- ni rétrogradé, ni changer d'email.
create or replace function public.protect_super_admin()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    if old.niveau = 'super' then raise exception 'Le compte super-administrateur ne peut pas être supprimé'; end if;
    return old;
  end if;
  if old.niveau = 'super' then
    if new.niveau <> 'super' then raise exception 'Le compte super-administrateur ne peut pas être rétrogradé'; end if;
    if new.email <> old.email then raise exception 'L''email du super-administrateur ne peut pas être modifié'; end if;
    if new.statut = 'suspendu' then raise exception 'Le compte super-administrateur ne peut pas être suspendu'; end if;
  end if;
  return new;
end $$;

create trigger trg_protect_super_admin
  before update or delete on public.admin_accounts
  for each row execute function public.protect_super_admin();

-- Compte maître. Sans mot de passe : il est créé à la première connexion
-- (page /backoffice, étape « Créer mon mot de passe »).
insert into public.admin_accounts (email, nom, niveau, statut, permissions, created_by)
values ('txp.expert@gmail.com', 'IXP Expert', 'super', 'invite', '{}', 'migration')
on conflict (email) do nothing;

revoke all on function public.protect_super_admin() from public, anon, authenticated;


-- ═════════ supabase/migrations/0007_ingestion_tarif_decisions.sql ═════════
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


-- ═════════ supabase/migrations/0008_piloter_mise_a_jour_auto.sql ═════════
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


-- ═════════ supabase/migrations/0009_veille_mondoscope.sql ═════════
-- 0009 — Global MondoScope : repères datés et sourcés, modifiables sans redéploiement.
-- Une ligne par élément affiché (section + clé). Lecture via /api/mondoscope (clé service).
-- Pour mettre à jour : modifier payload (et la ligne section='maj'), aucune publication de code nécessaire.
create table if not exists public.veille_mondoscope (
  id bigint generated always as identity primary key,
  section text not null check (section in ('maj','retenir','repere','route','origine','agenda')),
  cle text not null,
  ordre int not null default 0,
  payload jsonb not null,
  actif boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (section, cle)
);
alter table public.veille_mondoscope enable row level security;

create or replace function public.tg_veille_mondoscope_touch() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists veille_mondoscope_touch on public.veille_mondoscope;
create trigger veille_mondoscope_touch before update on public.veille_mondoscope
  for each row execute function public.tg_veille_mondoscope_touch();

insert into public.veille_mondoscope (section, cle, ordre, payload) values
('maj','maj',0,'{"date": "2026-11-07"}'::jsonb),
('retenir','r1',0,'{"t": "Ormuz : navigation toujours restreinte", "p": "Énergie, chimie", "ton": "up"}'::jsonb),
('retenir','r2',1,'{"t": "Brent au-dessus de 100 $ depuis octobre", "p": "Fret, plastiques", "ton": "up"}'::jsonb),
('retenir','r3',2,'{"t": "Fed et BCE en pause après leurs hausses", "p": "USD / EUR", "ton": "nav"}'::jsonb),
('retenir','r4',3,'{"t": "BAM maintient 2,25 %, inflation basse", "p": "Crédit stable", "ton": "ok"}'::jsonb),
('retenir','r5',4,'{"t": "LF 2027 : nouveaux droits au 1er janvier", "p": "À préparer", "ton": ""}'::jsonb),
('repere','Taux directeur Bank Al-Maghrib',0,'{"cat": "Taux directeurs", "label": "Taux directeur Bank Al-Maghrib", "valeur": "2,25 %", "detail": "Maintenu le 22 septembre 2026, sixième statu quo consécutif. Coût du financement des importations stable.", "date": "2026-09-22", "source": "Bank Al-Maghrib, communiqué du Conseil", "url": "https://www.bkam.ma", "proof": true}'::jsonb),
('repere','BCE, facilité de dépôt',1,'{"cat": "Taux directeurs", "label": "BCE, facilité de dépôt", "valeur": "2,50 %", "detail": "Inchangé le 29 octobre 2026, après deux hausses (juin et septembre). Soutient l’euro face au dollar.", "date": "2026-10-29", "source": "Banque centrale européenne", "url": "https://www.ecb.europa.eu", "proof": true}'::jsonb),
('repere','Réserve fédérale, fourchette cible',2,'{"cat": "Taux directeurs", "label": "Réserve fédérale, fourchette cible", "valeur": "3,75–4,00 %", "detail": "Inchangée le 28 octobre 2026 (vote 10-2, deux membres favorables à une hausse). Les marchés anticipent une hausse en décembre.", "date": "2026-10-28", "source": "Federal Reserve, déclaration du FOMC", "url": "https://www.federalreserve.gov", "proof": true}'::jsonb),
('repere','Pétrole Brent (ICE)',3,'{"cat": "Énergie", "label": "Pétrole Brent (ICE)", "valeur": "≈ 107 $/b", "detail": "Repli sous 107 $ début novembre après des pics au-delà de 115 $ en octobre, liés aux risques sur le transport maritime au Moyen-Orient.", "date": "2026-11-02", "source": "ICE Futures Europe, cotations Brent", "url": "https://www.ice.com", "proof": true}'::jsonb),
('repere','Facture énergétique du Maroc',4,'{"cat": "Énergie", "label": "Facture énergétique du Maroc", "valeur": "138,1 Mds DH", "detail": "Prévision 2026 de Bank Al-Maghrib, soit +28,4 % sur un an, avant un recul attendu à 116 Mds DH en 2027.", "date": "2026-09-22", "source": "Bank Al-Maghrib, communiqué du Conseil", "url": "https://www.bkam.ma"}'::jsonb),
('repere','Croissance du Maroc (FMI)',5,'{"cat": "Croissance et prix", "label": "Croissance du Maroc (FMI)", "valeur": "4,5 %", "detail": "Projection 2026 (4,2 % en 2027), légèrement révisée en baisse depuis avril.", "date": "2026-10-13", "source": "FMI, Perspectives de l’économie mondiale, octobre 2026", "url": "https://www.imf.org/fr/Publications/WEO", "proof": true}'::jsonb),
('repere','Croissance mondiale (FMI)',6,'{"cat": "Croissance et prix", "label": "Croissance mondiale (FMI)", "valeur": "3,1 %", "detail": "Projection 2026, contre 3,5 % en 2025 : demande plus faible chez les partenaires.", "date": "2026-10-13", "source": "FMI, Perspectives de l’économie mondiale, octobre 2026", "url": "https://www.imf.org/fr/Publications/WEO"}'::jsonb),
('repere','Inflation mondiale (FMI)',7,'{"cat": "Croissance et prix", "label": "Inflation mondiale (FMI)", "valeur": "4,7 %", "detail": "Projection 2026, en hausse après 4,1 % en 2025 : prix d’achat à l’étranger orientés à la hausse.", "date": "2026-10-13", "source": "FMI, Perspectives de l’économie mondiale, octobre 2026", "url": "https://www.imf.org/fr/Publications/WEO"}'::jsonb),
('repere','Inflation au Maroc (BAM)',8,'{"cat": "Croissance et prix", "label": "Inflation au Maroc (BAM)", "valeur": "0,7 %", "detail": "Prévision moyenne 2026, puis 1,5 % en 2027. Les subventions amortissent le choc pétrolier.", "date": "2026-09-22", "source": "Bank Al-Maghrib, communiqué du Conseil", "url": "https://www.bkam.ma"}'::jsonb),
('repere','Réserves de change du Maroc',9,'{"cat": "Croissance et prix", "label": "Réserves de change du Maroc", "valeur": "503 Mds DH", "detail": "Au 18 septembre 2026, environ cinq mois et demi d’importations de biens et services.", "date": "2026-09-18", "source": "Bank Al-Maghrib, indicateurs hebdomadaires", "url": "https://www.bkam.ma"}'::jsonb),
('route','ormuz',0,'{"cle": "ormuz", "nom": "Détroit d’Ormuz", "statut": "critique", "etat": "Navigation restreinte depuis mars 2026 : passages limités sous mesures de sécurité, réouverture conditionnée par l’Iran à un règlement politique.", "impact": "Hydrocarbures, GPL, engrais et produits pétrochimiques venant du Golfe : délais incertains, surprimes d’assurance, prix rendus plus élevés.", "date": "2026-11-02", "source": "Organisation maritime internationale ; dépêches AFP", "url": "https://www.imo.org"}'::jsonb),
('route','merrouge',1,'{"cle": "merrouge", "nom": "Mer Rouge et Bab el-Mandeb", "statut": "critique", "etat": "Menaces renouvelées des Houthis contre la navigation, notamment les navires saoudiens ; plusieurs armateurs évitent encore la zone.", "impact": "Marchandises d’Asie via Suez : contournement possible par le cap de Bonne-Espérance, plusieurs jours de transit en plus et surcharges de fret.", "date": "2026-10-30", "source": "Organisation maritime internationale ; dépêches AFP", "url": "https://www.imo.org"}'::jsonb),
('route','suez',2,'{"cle": "suez", "nom": "Canal de Suez", "statut": "vigilance", "etat": "Ouvert, mais trafic dépendant de la situation en mer Rouge.", "impact": "Plannings Asie–Méditerranée moins fiables : prévoir une marge sur les dates d’arrivée et vérifier les surcharges dans vos offres de fret.", "date": "2026-10-30", "source": "Autorité du canal de Suez", "url": "https://www.suezcanal.gov.eg"}'::jsonb),
('route','gibraltar',3,'{"cle": "gibraltar", "nom": "Détroit de Gibraltar et Tanger Med", "statut": "normal", "etat": "Aucune perturbation signalée à la date de mise à jour.", "impact": "Flux Europe–Maroc et transbordements via Tanger Med sans contrainte particulière.", "date": "2026-11-02", "source": "Tanger Med Port Authority", "url": "https://www.tangermed.ma"}'::jsonb),
('origine','chine',0,'{"cle": "chine", "nom": "Chine et Asie de l’Est", "route": "Shanghai, Ningbo ou Shenzhen → Suez ou cap de Bonne-Espérance → Tanger Med ou Casablanca.", "routes": ["merrouge", "suez", "gibraltar"], "devises": ["USD", "CNY"], "accord": "Pas d’accord préférentiel : droit commun du tarif 2026. Surveiller les mesures de défense commerciale.", "vigilance": ["Dollar : une hausse de la Fed en décembre renchérirait vos factures.", "Délais : prévoir une marge en cas de contournement par le Cap.", "Mesures antidumping en vigueur sur certains produits d’origine chinoise."]}'::jsonb),
('origine','ue',1,'{"cle": "ue", "nom": "Union européenne", "route": "Ports d’Espagne, de France, d’Italie ou d’Europe du Nord → Tanger Med ou Casablanca ; route terrestre via le détroit.", "routes": ["gibraltar"], "devises": ["EUR"], "accord": "Accord d’association Maroc–UE : exonération sur preuve d’origine (EUR.1 ou déclaration d’origine).", "vigilance": ["Euro : la BCE est en pause à 2,50 %, une nouvelle hausse soutiendrait l’euro.", "Vérifier la validité des preuves d’origine avant l’arrivée.", "Fret routier : carburant cher, surcharges en hausse."]}'::jsonb),
('origine','turquie',2,'{"cle": "turquie", "nom": "Turquie", "route": "Mersin, Istanbul ou Izmir → Méditerranée → Tanger Med ou Casablanca.", "routes": ["gibraltar"], "devises": ["EUR", "USD"], "accord": "Accord de libre-échange Maroc–Turquie, avec droits additionnels sur certains produits : vérifier le code avant de commander.", "vigilance": ["Facturation souvent en euro ou en dollar plutôt qu’en livre turque.", "Contrôler l’origine et les éventuels droits additionnels par code SH."]}'::jsonb),
('origine','golfe',3,'{"cle": "golfe", "nom": "Pays du Golfe", "route": "Jebel Ali, Dammam ou ports du Golfe → Ormuz → mer Rouge et Suez → Méditerranée.", "routes": ["ormuz", "merrouge", "suez", "gibraltar"], "devises": ["USD", "AED", "SAR"], "accord": "Accord bilatéral avec les Émirats arabes unis et Grande zone arabe de libre-échange : exonération sous conditions d’origine.", "vigilance": ["Route la plus exposée : Ormuz et la mer Rouge cumulent les risques.", "Envisager des origines ou des ports de chargement alternatifs pour les intrants critiques.", "Surprimes d’assurance maritime à intégrer au prix de revient."]}'::jsonb),
('origine','ameriques',4,'{"cle": "ameriques", "nom": "Amériques", "route": "Côte Est des États-Unis, Brésil ou Canada → Atlantique → Casablanca ou Tanger Med.", "routes": ["gibraltar"], "devises": ["USD", "CAD"], "accord": "Accord de libre-échange Maroc–États-Unis : exonération sous conditions d’origine. Pas d’accord avec le Brésil ou le Canada.", "vigilance": ["Dollar : décision de la Fed les 8 et 9 décembre.", "Route atlantique peu exposée aux tensions actuelles."]}'::jsonb),
('origine','inde',5,'{"cle": "inde", "nom": "Inde et Asie du Sud", "route": "Nhava Sheva ou Mundra → mer d’Arabie → Bab el-Mandeb et Suez → Méditerranée.", "routes": ["merrouge", "suez", "gibraltar"], "devises": ["USD"], "accord": "Pas d’accord préférentiel : droit commun du tarif 2026.", "vigilance": ["Passage par Bab el-Mandeb : risque de déroutement et de surcharges.", "Dollar : sensibilité à la décision de la Fed en décembre."]}'::jsonb),
('agenda','Réunion de la Réserve fédérale (FOMC)',0,'{"quand": "8–9 déc. 2026", "quoi": "Réunion de la Réserve fédérale (FOMC)", "pourquoi": "Une hausse renforcerait le dollar : vos factures en USD coûteraient plus cher en dirhams."}'::jsonb),
('agenda','Réunion de politique monétaire de la BCE',1,'{"quand": "17 déc. 2026", "quoi": "Réunion de politique monétaire de la BCE", "pourquoi": "Oriente l’euro, première devise de facturation des importations marocaines."}'::jsonb),
('agenda','Quatrième Conseil trimestriel de Bank Al-Maghrib',2,'{"quand": "Déc. 2026", "quoi": "Quatrième Conseil trimestriel de Bank Al-Maghrib", "pourquoi": "Coût du crédit de trésorerie et des crédits documentaires."}'::jsonb),
('agenda','Entrée en vigueur de la loi de finances 2027',3,'{"quand": "1er janv. 2027", "quoi": "Entrée en vigueur de la loi de finances 2027", "pourquoi": "Nouveaux droits d’importation : vérifiez vos codes avant de passer les commandes livrées après le 1er janvier."}'::jsonb)
on conflict (section, cle) do update set ordre = excluded.ordre, payload = excluded.payload, actif = true;


-- ═════════ supabase/migrations/0010_facturation.sql ═════════
-- supabase/migrations/0010_facturation.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Système de facturation des abonnements (2026-11-07)
--
-- Complète 0004 / 0005 sans rien supprimer. Décisions validées :
--   • Émetteur : RIGORIS LEX (identifiants fiscaux saisis plus tard depuis le
--     backoffice → table billing_settings, une seule ligne).
--   • Prix HT : Pro 5 000, Premium 9 000 DH / an, TVA 20 % → 6 000 / 10 800 TTC.
--     Entreprise : montant HT fixé au contrat.
--   • Numérotation (séries distinctes, année = année d'ÉMISSION, Africa/Casablanca) :
--       facture    IXP27AA01    série continue, attribuée à la validation du paiement
--       pro-forma  PFIXP27AA01  = référence de virement (trous sans conséquence)
--       avoir      AVIXP27AA01  série continue, super-administrateur uniquement
--       abonné     ABIXP2701AA  année d'inscription ; affiché ABIXP27.01AA
--     Ordre : AA01…AA99, AB01… (abonné : 01AA…99AA, 01AB…), 66 924 par an.
--     Le code site (IXP) est un paramètre : SIV, LRF, IML pour les autres sites.
--   • Paiement par virement, rapproché manuellement : le montant reçu doit être
--     exactement le TTC attendu, sinon refus (fonds retournés hors système).
--   • Les 12 mois démarrent à la validation ; un renouvellement anticipé du
--     même plan ajoute les jours restants à la nouvelle période.
--   • Rôle « generaladmin » : tous les privilèges, sans paiement ni échéance.
--   • Clients entreprise (ICE obligatoire) ou particulier (sans ICE).
--   • Les anciens numéros d'abonné (26IXP002…) sont convertis au nouveau format.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Paramètres de facturation (émetteur + site) ─────────────────────────
create table if not exists public.billing_settings (
  id                   boolean primary key default true check (id),
  site_code            text not null default 'IXP' check (site_code ~ '^[A-Z]{3}$'),
  site_nom             text not null default 'Import-eXPert',
  site_url             text,
  raison_sociale       text not null default 'RIGORIS LEX',
  forme_juridique      text,          -- ex. SARL
  capital_social       text,          -- ex. 100 000 DH
  adresse              text,
  ville                text,
  pays                 text not null default 'Maroc',
  ice                  text check (ice is null or ice ~ '^[0-9]{15}$'),
  if_fiscal            text,
  rc                   text,
  rc_ville             text,
  taxe_professionnelle text,
  cnss                 text,
  telephone            text,
  email_facturation    text default 'abonnement@rigorislex.ma',
  banque               text,
  titulaire_compte     text,
  rib                  text,          -- 24 chiffres
  swift                text,
  tva_rate             numeric(5,2) not null default 20 check (tva_rate >= 0 and tva_rate < 100),
  delai_paiement_jours int not null default 15 check (delai_paiement_jours between 1 and 90),
  mentions_pied        text,
  updated_at           timestamptz not null default now(),
  updated_by           text
);
insert into public.billing_settings (id) values (true) on conflict (id) do nothing;
alter table public.billing_settings enable row level security;

-- ── 2. Numérotation ─────────────────────────────────────────────────────────
create table if not exists public.billing_counters (
  site_code   text not null,
  kind        text not null check (kind in ('facture', 'proforma', 'avoir', 'abonne')),
  year        int  not null,
  last_number int  not null default 0,
  primary key (site_code, kind, year)
);
alter table public.billing_counters enable row level security;

-- n = 1 → AA01, 99 → AA99, 100 → AB01 … 66 924 → ZZ99.
-- p_digits_first : 01AA (abonnés) au lieu de AA01.
create or replace function public.billing_seq_code(n int, p_digits_first boolean default false)
returns text
language plpgsql
immutable
as $$
declare
  idx int; l int; letters text; digits text;
begin
  if n is null or n < 1 or n > 26 * 26 * 99 then
    raise exception 'Capacité annuelle de numérotation dépassée (%)', n;
  end if;
  idx     := n - 1;
  l       := idx / 99;
  letters := chr(65 + l / 26) || chr(65 + l % 26);
  digits  := lpad((idx % 99 + 1)::text, 2, '0');
  return case when p_digits_first then digits || letters else letters || digits end;
end $$;

-- Prochain numéro d'une série. L'incrément a lieu dans la transaction de
-- l'appelant : en cas d'échec, il est annulé avec elle → pas de trou.
create or replace function public.billing_next_number(p_kind text, p_at timestamptz default now())
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_site text;
  v_year int := extract(year from (coalesce(p_at, now()) at time zone 'Africa/Casablanca'))::int;
  v_yy   text;
  n      int;
begin
  select site_code into v_site from billing_settings where id;
  v_site := coalesce(v_site, 'IXP');
  v_yy   := lpad((v_year % 100)::text, 2, '0');

  insert into billing_counters (site_code, kind, year, last_number) values (v_site, p_kind, v_year, 1)
  on conflict (site_code, kind, year) do update set last_number = billing_counters.last_number + 1
  returning last_number into n;

  return case p_kind
    when 'facture'  then v_site || v_yy || billing_seq_code(n)
    when 'proforma' then 'PF' || v_site || v_yy || billing_seq_code(n)
    when 'avoir'    then 'AV' || v_site || v_yy || billing_seq_code(n)
    when 'abonne'   then 'AB' || v_site || v_yy || billing_seq_code(n, true)
    else null
  end;
end $$;

-- Numéro d'abonné : nouveau format (le trigger users_assign_numero l'appelle).
create or replace function public.next_subscriber_number(p_at timestamptz default now())
returns text
language sql
security definer
set search_path = public
as $$ select billing_next_number('abonne', p_at) $$;

-- ── 3. Grille tarifaire : montants HT ───────────────────────────────────────
alter table public.subscription_plans add column if not exists vat_rate numeric(5,2) not null default 20;
comment on column public.subscription_plans.price_per_year is 'Montant annuel HT (DH). NULL = sur contrat.';
comment on column public.subscription_plans.monthly_ref    is 'Équivalent mensuel TTC, affiché à titre indicatif (pas de facturation mensuelle).';
update public.subscription_plans set price_per_year = 5000, monthly_ref = 500, note = 'Abonnement annuel — équivalent 500 DH TTC / mois' where code = 'pro';
update public.subscription_plans set price_per_year = 9000, monthly_ref = 900, note = 'Abonnement annuel — équivalent 900 DH TTC / mois' where code = 'premium';
update public.subscription_plans set price_per_year = null, monthly_ref = null, note = 'Sur contrat — conditions personnalisées' where code = 'enterprise';

-- ── 4. Profil de facturation du client ──────────────────────────────────────
alter table public.users add column if not exists type_client          text;
alter table public.users add column if not exists raison_sociale       text;
alter table public.users add column if not exists ice                  text;
alter table public.users add column if not exists if_fiscal            text;
alter table public.users add column if not exists rc                   text;
alter table public.users add column if not exists adresse_facturation  text;
alter table public.users add column if not exists ville                text;
alter table public.users add column if not exists code_postal          text;
alter table public.users add column if not exists pays                 text default 'Maroc';
alter table public.users add column if not exists plan_souhaite        text;
alter table public.users add column if not exists numero_abonne_ancien text;

alter table public.users drop constraint if exists users_type_client_check;
alter table public.users add constraint users_type_client_check
  check (type_client is null or type_client in ('entreprise', 'particulier'));
alter table public.users drop constraint if exists users_ice_format;
alter table public.users add constraint users_ice_format check (ice is null or ice ~ '^[0-9]{15}$');
alter table public.users drop constraint if exists users_plan_souhaite_check;
alter table public.users add constraint users_plan_souhaite_check
  check (plan_souhaite is null or plan_souhaite in ('pro', 'premium', 'enterprise'));

-- ── 5. Rôle generaladmin : tous les privilèges, sans paiement ni échéance ──
-- Le trigger fige plan/statut : tout le contrôle d'accès existant (middleware,
-- /api/auth/me, /app) voit un compte Entreprise actif sans échéance.
create or replace function public.users_generaladmin_guard()
returns trigger
language plpgsql
as $$
begin
  if new.role = 'generaladmin' then
    new.plan          := 'enterprise';
    new.statut        := 'active';
    new.plan_ends_at  := null;
    new.trial_ends_at := null;
  end if;
  return new;
end $$;

drop trigger if exists trg_users_generaladmin on public.users;
create trigger trg_users_generaladmin
  before insert or update on public.users
  for each row execute function public.users_generaladmin_guard();

-- ── 6. Factures / pro-formas : montants et figement ─────────────────────────
-- Une ligne de invoices = une pro-forma, qui devient la facture à la
-- validation du paiement (invoice_number attribué à ce moment). La colonne
-- historique « amount » reste le montant TTC à payer.
alter table public.invoices add column if not exists site_code        text;
alter table public.invoices add column if not exists amount_ht        numeric(12,2);
alter table public.invoices add column if not exists vat_rate         numeric(5,2);
alter table public.invoices add column if not exists vat_amount       numeric(12,2);
alter table public.invoices add column if not exists amount_ttc       numeric(12,2);
alter table public.invoices add column if not exists payment_reference text;
alter table public.invoices add column if not exists due_date         date;
alter table public.invoices add column if not exists issued_at        timestamptz;
alter table public.invoices add column if not exists period_start     timestamptz;
alter table public.invoices add column if not exists period_end       timestamptz;
alter table public.invoices add column if not exists days_carried     int not null default 0;
alter table public.invoices add column if not exists lines            jsonb;
alter table public.invoices add column if not exists client_snapshot  jsonb;
alter table public.invoices add column if not exists issuer_snapshot  jsonb;
alter table public.invoices add column if not exists origin           text not null default 'admin';
alter table public.invoices add column if not exists cancelled_at     timestamptz;

create unique index if not exists invoices_payment_reference_key on public.invoices (payment_reference);
alter table public.invoices drop constraint if exists invoices_origin_check;
alter table public.invoices add constraint invoices_origin_check
  check (origin in ('admin', 'client', 'fin_essai', 'renouvellement'));

-- Une facture émise est figée : seuls les champs techniques peuvent évoluer.
create or replace function public.invoices_freeze_paid()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'payee' and (
       new.status          is distinct from old.status
    or new.invoice_number  is distinct from old.invoice_number
    or new.amount          is distinct from old.amount
    or new.amount_ht       is distinct from old.amount_ht
    or new.vat_amount      is distinct from old.vat_amount
    or new.amount_ttc      is distinct from old.amount_ttc
    or new.issued_at       is distinct from old.issued_at
    or new.lines           is distinct from old.lines
    or new.client_snapshot is distinct from old.client_snapshot
    or new.issuer_snapshot is distinct from old.issuer_snapshot) then
    raise exception 'Facture % émise : modification interdite (émettre un avoir)', old.invoice_number;
  end if;
  return new;
end $$;
drop trigger if exists trg_invoices_freeze on public.invoices;
create trigger trg_invoices_freeze before update on public.invoices
  for each row execute function public.invoices_freeze_paid();

create or replace function public.invoices_no_delete_paid()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'payee' then
    raise exception 'Facture % émise : suppression interdite (conservation 10 ans)', old.invoice_number;
  end if;
  return old;
end $$;
drop trigger if exists trg_invoices_no_delete on public.invoices;
create trigger trg_invoices_no_delete before delete on public.invoices
  for each row execute function public.invoices_no_delete_paid();

-- ── 7. Paiements reçus / déclarés ───────────────────────────────────────────
create table if not exists public.paiements (
  id                uuid primary key default gen_random_uuid(),
  invoice_id        uuid references public.invoices(id) on delete set null,
  user_id           uuid references public.users(id) on delete set null,
  numero_abonne     text,
  montant           numeric(12,2),
  date_valeur       date,
  reference_libelle text,
  source            text not null default 'manuel' check (source in ('manuel', 'client', 'releve', 'banque')),
  justificatif_path text,
  justificatif_nom  text,
  statut            text not null default 'declare' check (statut in ('declare', 'rapproche', 'rejete')),
  motif_rejet       text,
  declare_par       text,
  valide_par        text,
  valide_le         timestamptz,
  note              text,
  created_at        timestamptz not null default now()
);
create index if not exists paiements_invoice_idx on public.paiements (invoice_id);
create index if not exists paiements_statut_idx  on public.paiements (statut);
alter table public.paiements enable row level security;
drop trigger if exists trg_paiements_identity on public.paiements;
create trigger trg_paiements_identity before insert on public.paiements
  for each row execute function public.copy_subscriber_identity();

-- ── 8. Avoirs ───────────────────────────────────────────────────────────────
create table if not exists public.avoirs (
  id               uuid primary key default gen_random_uuid(),
  avoir_number     text not null unique,
  invoice_id       uuid not null references public.invoices(id),
  invoice_number   text not null,
  invoice_date     timestamptz,
  user_id          uuid references public.users(id) on delete set null,
  numero_abonne    text,
  site_code        text,
  motif            text not null,
  amount_ht        numeric(12,2) not null check (amount_ht > 0),
  vat_rate         numeric(5,2) not null,
  vat_amount       numeric(12,2) not null,
  amount_ttc       numeric(12,2) not null,
  resiliation      boolean not null default false,
  client_snapshot  jsonb,
  issuer_snapshot  jsonb,
  issued_at        timestamptz not null default now(),
  actor            text not null,
  created_at       timestamptz not null default now()
);
create index if not exists avoirs_invoice_idx on public.avoirs (invoice_id);
alter table public.avoirs enable row level security;
drop trigger if exists trg_avoirs_identity on public.avoirs;
create trigger trg_avoirs_identity before insert on public.avoirs
  for each row execute function public.copy_subscriber_identity();

create or replace function public.avoirs_immutable()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Avoir émis : modification ou suppression interdite';
end $$;
drop trigger if exists trg_avoirs_immutable on public.avoirs;
create trigger trg_avoirs_immutable before update or delete on public.avoirs
  for each row execute function public.avoirs_immutable();

-- ── 9. Journal des notifications (rend le cron idempotent) ─────────────────
create table if not exists public.billing_notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.users(id) on delete cascade,
  invoice_id uuid references public.invoices(id) on delete set null,
  kind       text not null,
  ref_date   date not null,
  email      text,
  ok         boolean,
  error      text,
  created_at timestamptz not null default now(),
  unique (user_id, kind, ref_date)
);
alter table public.billing_notifications enable row level security;

-- ── 10. Événements : nouveaux types ─────────────────────────────────────────
alter table public.subscription_events drop constraint if exists subscription_events_type_check;
alter table public.subscription_events add constraint subscription_events_type_check check (type in (
  'proforma', 'paiement_valide', 'activation', 'suspension', 'reactivation',
  'prolongation', 'expiration', 'proforma_annulee', 'suppression',
  'paiement_declare', 'paiement_rejete', 'avoir', 'generaladmin', 'profil_facturation'));

-- ── 11. Instantanés (figés sur les documents) ───────────────────────────────
create or replace function public.billing_issuer_snapshot()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select to_jsonb(s) - 'id' - 'updated_at' - 'updated_by' from billing_settings s where s.id
$$;

create or replace function public.billing_client_snapshot(p_user_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'numero_abonne',  u.numero_abonne,
    'type_client',    coalesce(u.type_client, 'particulier'),
    'raison_sociale', u.raison_sociale,
    'nom',            nullif(trim(concat_ws(' ', u.prenom, u.nom)), ''),
    'email',          u.email,
    'telephone',      u.telephone,
    'ice',            u.ice,
    'if_fiscal',      u.if_fiscal,
    'rc',             u.rc,
    'adresse',        u.adresse_facturation,
    'code_postal',    u.code_postal,
    'ville',          u.ville,
    'pays',           coalesce(u.pays, 'Maroc'))
  from users u where u.id = p_user_id
$$;

-- ── 12. Pro-forma ───────────────────────────────────────────────────────────
-- p_amount_ht : montant HT total (obligatoire pour 'enterprise', sinon tarif × années).
-- p_reuse     : si une pro-forma est déjà en attente pour ce client, la renvoyer
--               au lieu d'échouer (cron, demande du client).
create or replace function public.billing_create_proforma(
  p_user_id   uuid,
  p_plan      text,
  p_years     int     default 1,
  p_amount_ht numeric default null,
  p_actor     text    default 'admin',
  p_note      text    default null,
  p_origin    text    default 'admin',
  p_reuse     boolean default false
) returns public.invoices
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user  users%rowtype;
  v_price numeric;
  v_set   billing_settings%rowtype;
  v_ht    numeric(12,2);
  v_vat   numeric(12,2);
  v_num   text;
  v_inv   invoices%rowtype;
begin
  select * into v_user from users where id = p_user_id for update;
  if not found then raise exception 'Utilisateur introuvable'; end if;
  if v_user.role = 'generaladmin' then
    raise exception 'Compte generaladmin : aucune facturation';
  end if;

  select * into v_inv from invoices
   where user_id = p_user_id and status = 'proforma_envoyee'
   order by created_at desc limit 1;
  if found then
    if p_reuse then return v_inv; end if;
    raise exception 'Une pro-forma est déjà en attente pour ce client (%) : la valider ou l''annuler d''abord',
      coalesce(v_inv.payment_reference, v_inv.proforma_number);
  end if;

  if p_years is null or p_years < 1 or p_years > 5 then raise exception 'Durée invalide (1 à 5 ans)'; end if;

  select price_per_year into v_price from subscription_plans where code = p_plan and active;
  if not found then raise exception 'Plan inconnu ou inactif : %', p_plan; end if;

  if p_amount_ht is null then
    if v_price is null then
      raise exception 'Le plan % est contractuel : saisir le montant HT du contrat', p_plan;
    end if;
    p_amount_ht := v_price * p_years;
  end if;
  if p_amount_ht <= 0 then raise exception 'Montant invalide'; end if;

  select * into v_set from billing_settings where id;
  v_ht  := round(p_amount_ht, 2);
  v_vat := round(v_ht * v_set.tva_rate / 100, 2);
  v_num := billing_next_number('proforma');

  insert into invoices (
    user_id, plan_code, years, amount, currency, status, proforma_number, payment_reference, sent_at,
    site_code, amount_ht, vat_rate, vat_amount, amount_ttc, due_date, lines, client_snapshot, issuer_snapshot, origin)
  values (
    p_user_id, p_plan, p_years, v_ht + v_vat, 'MAD', 'proforma_envoyee', v_num, v_num, now(),
    v_set.site_code, v_ht, v_set.tva_rate, v_vat, v_ht + v_vat,
    (now() at time zone 'Africa/Casablanca')::date + v_set.delai_paiement_jours,
    jsonb_build_array(jsonb_build_object(
      'designation', 'Abonnement annuel ' || v_set.site_nom || ' — plan ' ||
                     (select label from subscription_plans where code = p_plan),
      'quantite', p_years, 'unite', 'an',
      'prix_unitaire_ht', round(v_ht / p_years, 2), 'total_ht', v_ht)),
    billing_client_snapshot(p_user_id), billing_issuer_snapshot(), coalesce(p_origin, 'admin'))
  returning * into v_inv;

  insert into subscription_events (user_id, user_email, type, from_plan, to_plan, from_statut, to_statut, invoice_id, amount, note, actor)
  values (v_user.id, v_user.email, 'proforma', v_user.plan, p_plan, v_user.statut, v_user.statut, v_inv.id, v_inv.amount_ttc, p_note, p_actor);

  return v_inv;
end $$;

-- Ancienne signature (API existante) : p_amount est désormais le montant HT.
create or replace function public.admin_create_proforma(
  p_user_id uuid,
  p_plan    text,
  p_years   int     default 1,
  p_amount  numeric default null,
  p_actor   text    default 'admin',
  p_note    text    default null
) returns public.invoices
language sql
security definer
set search_path = public
as $$ select * from billing_create_proforma(p_user_id, p_plan, p_years, p_amount, p_actor, p_note, 'admin', false) $$;

-- ── 13. Validation du paiement → facture + activation ───────────────────────
-- p_amount_recu doit être égal au TTC attendu (sinon refus : fonds retournés).
-- p_paiement_id : paiement déclaré par le client (justificatif) à rapprocher.
create or replace function public.billing_confirm_payment(
  p_invoice_id  uuid,
  p_amount_recu numeric,
  p_date_valeur date    default null,
  p_reference   text    default null,
  p_paiement_id uuid    default null,
  p_actor       text    default 'admin',
  p_note        text    default null
) returns public.invoices
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv     invoices%rowtype;
  v_user    users%rowtype;
  v_client  jsonb;
  v_base    timestamptz;
  v_end     timestamptz;
  v_carried int := 0;
  v_out     invoices%rowtype;
begin
  select * into v_inv from invoices where id = p_invoice_id for update;
  if not found then raise exception 'Pro-forma introuvable'; end if;
  if v_inv.status <> 'proforma_envoyee' then
    raise exception 'Cette pro-forma est déjà %', v_inv.status;
  end if;
  if v_inv.user_id is null then raise exception 'Le compte client a été supprimé'; end if;

  select * into v_user from users where id = v_inv.user_id for update;
  if v_user.role = 'generaladmin' then raise exception 'Compte generaladmin : aucune facturation'; end if;

  if p_amount_recu is null or round(p_amount_recu, 2) <> coalesce(v_inv.amount_ttc, v_inv.amount) then
    raise exception 'Montant reçu (% DH) différent du montant attendu (% DH TTC) : paiement non accepté, fonds à retourner',
      coalesce(p_amount_recu::text, '—'), coalesce(v_inv.amount_ttc, v_inv.amount);
  end if;

  -- Identité du client figée au moment de la facture.
  v_client := billing_client_snapshot(v_user.id);
  if v_client->>'type_client' = 'entreprise'
     and (coalesce(v_client->>'ice', '') = '' or coalesce(v_client->>'raison_sociale', '') = '') then
    raise exception 'Client entreprise : raison sociale et ICE obligatoires sur la facture (compléter le profil de facturation)';
  end if;
  if coalesce(v_client->>'raison_sociale', v_client->>'nom', '') = '' then
    raise exception 'Nom ou raison sociale du client manquant (compléter le profil de facturation)';
  end if;

  -- Renouvellement anticipé du même plan : les jours restants s'ajoutent.
  if v_user.plan = v_inv.plan_code and v_user.statut = 'active'
     and v_user.plan_ends_at is not null and v_user.plan_ends_at > now() then
    v_base    := v_user.plan_ends_at;
    v_carried := ceil(extract(epoch from (v_user.plan_ends_at - now())) / 86400)::int;
  else
    v_base := now();
  end if;
  v_end := v_base + make_interval(years => v_inv.years);

  update invoices set
    status          = 'payee',
    paid_at         = now(),
    issued_at       = now(),
    invoice_number  = billing_next_number('facture'),
    period_start    = now(),
    period_end      = v_end,
    days_carried    = v_carried,
    client_snapshot = v_client,
    issuer_snapshot = billing_issuer_snapshot()
  where id = v_inv.id
  returning * into v_out;

  -- Validation lancée sans désigner de justificatif : le dernier justificatif
  -- déclaré sur cette pro-forma est rattaché (et non rejeté).
  if p_paiement_id is null then
    select id into p_paiement_id from paiements
     where invoice_id = v_inv.id and statut = 'declare'
     order by created_at desc limit 1;
  end if;

  if p_paiement_id is not null then
    update paiements set
      invoice_id = v_inv.id, statut = 'rapproche', montant = p_amount_recu,
      date_valeur = coalesce(p_date_valeur, date_valeur),
      reference_libelle = coalesce(p_reference, reference_libelle),
      valide_par = p_actor, valide_le = now(), note = coalesce(p_note, note)
    where id = p_paiement_id and statut = 'declare' and user_id = v_user.id;
    if not found then raise exception 'Paiement déclaré introuvable ou déjà traité'; end if;
  else
    insert into paiements (invoice_id, user_id, montant, date_valeur, reference_libelle, source, statut, declare_par, valide_par, valide_le, note)
    values (v_inv.id, v_user.id, p_amount_recu, p_date_valeur, coalesce(p_reference, v_inv.payment_reference),
            'manuel', 'rapproche', p_actor, p_actor, now(), p_note);
  end if;
  -- Les autres déclarations en attente sur cette pro-forma deviennent sans objet.
  update paiements set statut = 'rejete', motif_rejet = 'Pro-forma déjà réglée', valide_par = p_actor, valide_le = now()
   where invoice_id = v_inv.id and statut = 'declare';

  update users set plan = v_inv.plan_code, statut = 'active', plan_ends_at = v_end, plan_souhaite = null
   where id = v_user.id;

  insert into subscription_events (user_id, user_email, type, from_plan, to_plan, from_statut, to_statut, plan_ends_at, invoice_id, amount, note, actor)
  values (v_user.id, v_user.email, 'paiement_valide', v_user.plan, v_inv.plan_code, v_user.statut, 'active', v_end,
          v_inv.id, v_out.amount_ttc,
          concat_ws(' — ', v_out.invoice_number,
                    case when v_carried > 0 then v_carried || ' jours reportés' end, p_note),
          p_actor);

  return v_out;
end $$;

-- Ancienne signature : validation par un administrateur sans saisie du
-- montant (le montant attendu est considéré comme reçu).
create or replace function public.admin_confirm_payment(
  p_invoice_id uuid,
  p_actor      text default 'admin',
  p_note       text default null
) returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv invoices%rowtype;
  v_out users%rowtype;
begin
  select * into v_inv from invoices where id = p_invoice_id;
  if not found then raise exception 'Pro-forma introuvable'; end if;
  perform billing_confirm_payment(p_invoice_id, coalesce(v_inv.amount_ttc, v_inv.amount), null, null, null, p_actor, p_note);
  select * into v_out from users where id = v_inv.user_id;
  return v_out;
end $$;

-- Activation en un clic (paiement déjà reçu) : pro-forma + facture.
create or replace function public.admin_activate_plan(
  p_user_id uuid,
  p_plan    text,
  p_years   int     default 1,
  p_amount  numeric default null,
  p_actor   text    default 'admin',
  p_note    text    default null
) returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv invoices%rowtype;
begin
  v_inv := billing_create_proforma(p_user_id, p_plan, p_years, p_amount, p_actor, p_note, 'admin', false);
  return admin_confirm_payment(v_inv.id, p_actor, p_note);
end $$;

-- ── 14. Paiement déclaré par le client / rejet ──────────────────────────────
create or replace function public.billing_declare_payment(
  p_user_id     uuid,
  p_invoice_id  uuid,
  p_montant     numeric,
  p_date_valeur date,
  p_reference   text,
  p_path        text,
  p_nom         text
) returns public.paiements
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv invoices%rowtype;
  v_p   paiements%rowtype;
  v_email text;
begin
  select * into v_inv from invoices where id = p_invoice_id and user_id = p_user_id;
  if not found then raise exception 'Pro-forma introuvable'; end if;
  if v_inv.status <> 'proforma_envoyee' then raise exception 'Cette pro-forma n''est plus en attente de paiement'; end if;

  insert into paiements (invoice_id, user_id, montant, date_valeur, reference_libelle, source, statut,
                         justificatif_path, justificatif_nom, declare_par)
  values (p_invoice_id, p_user_id, p_montant, p_date_valeur, coalesce(nullif(trim(p_reference), ''), v_inv.payment_reference),
          'client', 'declare', p_path, p_nom, 'client')
  returning * into v_p;

  select email into v_email from users where id = p_user_id;
  insert into subscription_events (user_id, user_email, type, to_plan, invoice_id, amount, note, actor)
  values (p_user_id, v_email, 'paiement_declare', v_inv.plan_code, v_inv.id, p_montant, v_inv.payment_reference, 'client');
  return v_p;
end $$;

create or replace function public.billing_reject_payment(
  p_paiement_id uuid,
  p_motif       text,
  p_actor       text default 'admin'
) returns public.paiements
language plpgsql
security definer
set search_path = public
as $$
declare
  v_p paiements%rowtype;
  v_email text;
begin
  if coalesce(trim(p_motif), '') = '' then raise exception 'Motif du rejet obligatoire'; end if;
  update paiements set statut = 'rejete', motif_rejet = p_motif, valide_par = p_actor, valide_le = now()
   where id = p_paiement_id and statut = 'declare'
   returning * into v_p;
  if not found then raise exception 'Paiement introuvable ou déjà traité'; end if;
  select email into v_email from users where id = v_p.user_id;
  insert into subscription_events (user_id, user_email, type, invoice_id, amount, note, actor)
  values (v_p.user_id, v_email, 'paiement_rejete', v_p.invoice_id, v_p.montant, p_motif, p_actor);
  return v_p;
end $$;

-- ── 15. Annulation de pro-forma (horodatée) ─────────────────────────────────
create or replace function public.admin_cancel_proforma(
  p_invoice_id uuid,
  p_actor      text default 'admin',
  p_note       text default null
) returns public.invoices
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv invoices%rowtype;
  v_email text;
begin
  update invoices set status = 'annulee', cancelled_at = now()
  where id = p_invoice_id and status = 'proforma_envoyee'
  returning * into v_inv;
  if not found then raise exception 'Pro-forma introuvable ou déjà traitée'; end if;

  update paiements set statut = 'rejete', motif_rejet = 'Pro-forma annulée', valide_par = p_actor, valide_le = now()
   where invoice_id = v_inv.id and statut = 'declare';

  select email into v_email from users where id = v_inv.user_id;
  insert into subscription_events (user_id, user_email, type, to_plan, invoice_id, amount, note, actor)
  values (v_inv.user_id, v_email, 'proforma_annulee', v_inv.plan_code, v_inv.id, coalesce(v_inv.amount_ttc, v_inv.amount), p_note, p_actor);
  return v_inv;
end $$;

-- ── 16. Avoir (super-administrateur) ────────────────────────────────────────
-- p_amount_ht NULL = avoir total du solde restant. p_resilier : met fin à
-- l'abonnement couvert par la facture (statut expiré immédiatement).
create or replace function public.admin_create_avoir(
  p_invoice_id uuid,
  p_motif      text,
  p_amount_ht  numeric default null,
  p_resilier   boolean default false,
  p_actor      text    default 'admin'
) returns public.avoirs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv    invoices%rowtype;
  v_deja   numeric;
  v_reste  numeric;
  v_ht     numeric(12,2);
  v_vat    numeric(12,2);
  v_av     avoirs%rowtype;
  v_email  text;
begin
  if coalesce(trim(p_motif), '') = '' then raise exception 'Motif de l''avoir obligatoire'; end if;
  select * into v_inv from invoices where id = p_invoice_id for update;
  if not found or v_inv.status <> 'payee' then raise exception 'Facture émise introuvable'; end if;

  select coalesce(sum(amount_ht), 0) into v_deja from avoirs where invoice_id = v_inv.id;
  v_reste := coalesce(v_inv.amount_ht, round(v_inv.amount / 1.2, 2)) - v_deja;
  if v_reste <= 0 then raise exception 'Cette facture est déjà entièrement couverte par des avoirs'; end if;

  v_ht := round(coalesce(p_amount_ht, v_reste), 2);
  if v_ht <= 0 or v_ht > v_reste then
    raise exception 'Montant HT invalide : maximum % DH', v_reste;
  end if;
  v_vat := round(v_ht * coalesce(v_inv.vat_rate, 20) / 100, 2);

  insert into avoirs (avoir_number, invoice_id, invoice_number, invoice_date, user_id, site_code, motif,
                      amount_ht, vat_rate, vat_amount, amount_ttc, resiliation, client_snapshot, issuer_snapshot, actor)
  values (billing_next_number('avoir'), v_inv.id, v_inv.invoice_number, coalesce(v_inv.issued_at, v_inv.paid_at),
          v_inv.user_id, v_inv.site_code, p_motif, v_ht, coalesce(v_inv.vat_rate, 20), v_vat, v_ht + v_vat,
          coalesce(p_resilier, false), v_inv.client_snapshot, billing_issuer_snapshot(), p_actor)
  returning * into v_av;

  if p_resilier and v_inv.user_id is not null then
    update users set statut = 'expired', plan_ends_at = least(coalesce(plan_ends_at, now()), now())
     where id = v_inv.user_id and plan = v_inv.plan_code and coalesce(role, '') <> 'generaladmin';
  end if;

  select email into v_email from users where id = v_inv.user_id;
  insert into subscription_events (user_id, user_email, type, to_plan, invoice_id, amount, note, actor)
  values (v_inv.user_id, v_email, 'avoir', v_inv.plan_code, v_inv.id, -(v_ht + v_vat),
          v_av.avoir_number || ' sur ' || v_inv.invoice_number || ' — ' || p_motif, p_actor);
  return v_av;
end $$;

-- ── 17. generaladmin : activation / retrait (super-administrateur) ─────────
create or replace function public.admin_set_generaladmin(
  p_user_id uuid,
  p_on      boolean,
  p_actor   text default 'admin',
  p_note    text default null
) returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user users%rowtype;
  v_out  users%rowtype;
begin
  select * into v_user from users where id = p_user_id for update;
  if not found then raise exception 'Utilisateur introuvable'; end if;

  if p_on then
    update users set role = 'generaladmin' where id = p_user_id returning * into v_out;
    update invoices set status = 'annulee', cancelled_at = now()
     where user_id = p_user_id and status = 'proforma_envoyee';
  else
    if coalesce(v_user.role, '') <> 'generaladmin' then raise exception 'Ce compte n''est pas generaladmin'; end if;
    -- Retrait : le compte repasse sans abonnement (à facturer normalement).
    update users set role = null, plan = 'trial', statut = 'expired', trial_ends_at = now()
     where id = p_user_id returning * into v_out;
  end if;

  insert into subscription_events (user_id, user_email, type, from_plan, to_plan, from_statut, to_statut, note, actor)
  values (v_user.id, v_user.email, 'generaladmin', v_user.plan, v_out.plan, v_user.statut, v_out.statut,
          coalesce(p_note, case when p_on then 'Rôle generaladmin accordé' else 'Rôle generaladmin retiré' end), p_actor);
  return v_out;
end $$;

-- Un compte generaladmin ne se suspend pas : retirer d'abord le rôle.
create or replace function public.admin_set_status(
  p_user_id uuid,
  p_action  text,
  p_actor   text default 'admin',
  p_note    text default null
) returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user users%rowtype;
  v_new  text;
  v_out  users%rowtype;
begin
  select * into v_user from users where id = p_user_id for update;
  if not found then raise exception 'Utilisateur introuvable'; end if;
  if v_user.role = 'generaladmin' then
    raise exception 'Compte generaladmin : retirer d''abord le rôle pour modifier son statut';
  end if;

  if p_action = 'suspend' then
    v_new := 'suspended';
  elsif p_action = 'reactivate' then
    if v_user.plan in ('pro','premium','enterprise') and v_user.plan_ends_at > now() then
      v_new := 'active';
    elsif v_user.plan = 'trial' and v_user.trial_ends_at > now() then
      v_new := 'trial';
    elsif v_user.plan = 'free' then
      v_new := 'active';
    else
      v_new := 'expired';
    end if;
  else
    raise exception 'Action inconnue : %', p_action;
  end if;

  update users set statut = v_new where id = v_user.id returning * into v_out;

  insert into subscription_events (user_id, user_email, type, from_plan, to_plan, from_statut, to_statut, plan_ends_at, note, actor)
  values (v_user.id, v_user.email,
          case when p_action = 'suspend' then 'suspension' else 'reactivation' end,
          v_user.plan, v_user.plan, v_user.statut, v_new, v_user.plan_ends_at, p_note, p_actor);

  return v_out;
end $$;

-- ── 18. Profil de facturation (client ou administrateur) ────────────────────
create or replace function public.billing_update_profile(
  p_user_id uuid,
  p_profile jsonb,
  p_actor   text default 'client'
) returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  v_type text := nullif(trim(p_profile->>'type_client'), '');
  v_ice  text := nullif(regexp_replace(coalesce(p_profile->>'ice', ''), '\s', '', 'g'), '');
  v_rs   text := nullif(trim(p_profile->>'raison_sociale'), '');
  v_out  users%rowtype;
begin
  if v_type is null or v_type not in ('entreprise', 'particulier') then
    raise exception 'Type de client requis : entreprise ou particulier';
  end if;
  if v_type = 'entreprise' then
    if v_rs is null then raise exception 'Raison sociale obligatoire pour une entreprise'; end if;
    if v_ice is null or v_ice !~ '^[0-9]{15}$' then raise exception 'ICE obligatoire pour une entreprise (15 chiffres)'; end if;
  else
    v_ice := null; v_rs := null;
  end if;

  update users set
    type_client         = v_type,
    raison_sociale      = v_rs,
    ice                 = v_ice,
    if_fiscal           = case when v_type = 'entreprise' then nullif(trim(p_profile->>'if_fiscal'), '') end,
    rc                  = case when v_type = 'entreprise' then nullif(trim(p_profile->>'rc'), '') end,
    adresse_facturation = nullif(trim(p_profile->>'adresse'), ''),
    code_postal         = nullif(trim(p_profile->>'code_postal'), ''),
    ville               = nullif(trim(p_profile->>'ville'), ''),
    pays                = coalesce(nullif(trim(p_profile->>'pays'), ''), 'Maroc'),
    societe             = coalesce(v_rs, societe)
  where id = p_user_id
  returning * into v_out;
  if not found then raise exception 'Utilisateur introuvable'; end if;

  insert into subscription_events (user_id, user_email, type, note, actor)
  values (v_out.id, v_out.email, 'profil_facturation', v_type, p_actor);
  return v_out;
end $$;

-- ── 19. Indicateurs : hors comptes generaladmin, net des avoirs ─────────────
create or replace function public.admin_dashboard_stats()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with u as (select * from users where coalesce(role, '') <> 'generaladmin')
  select jsonb_build_object(
    'users_total',        (select count(*) from u),
    'users_new_30d',      (select count(*) from u where created_at > now() - interval '30 days'),
    'users_unverified',   (select count(*) from u where not email_verified),
    'by_statut',          (select coalesce(jsonb_object_agg(statut, n), '{}'::jsonb)
                             from (select coalesce(statut,'?') statut, count(*) n from u group by 1) s),
    'active_paid_by_plan',(select coalesce(jsonb_object_agg(plan, n), '{}'::jsonb)
                             from (select plan, count(*) n from u
                                   where statut = 'active' and plan in ('pro','premium','enterprise') group by 1) s),
    'trials_running',     (select count(*) from u where statut = 'trial' and trial_ends_at > now()),
    'expiring_30d',       (select count(*) from u where statut = 'active' and plan_ends_at between now() and now() + interval '30 days'),
    'revenue_12m',        (select coalesce(sum(amount),0) from invoices where status = 'payee' and paid_at > now() - interval '12 months')
                          - (select coalesce(sum(amount_ttc),0) from avoirs where issued_at > now() - interval '12 months'),
    'revenue_ytd',        (select coalesce(sum(amount),0) from invoices where status = 'payee' and paid_at >= date_trunc('year', now()))
                          - (select coalesce(sum(amount_ttc),0) from avoirs where issued_at >= date_trunc('year', now())),
    'proformas_pending',  (select count(*) from invoices where status = 'proforma_envoyee'),
    'proformas_pending_amount', (select coalesce(sum(amount),0) from invoices where status = 'proforma_envoyee'),
    'paiements_declares', (select count(*) from paiements where statut = 'declare'),
    'tarifs',             (select count(*) from tarifs),
    'circulaires',        (select count(distinct coalesce(numero, titre)) from knowledge_chunks),
    'knowledge_chunks',   (select count(*) from knowledge_chunks),
    'decisions',          (select count(*) from decisions_classement),
    'leads',              (select (select count(*) from audit_leads) + (select count(*) from scanner_leads)),
    'leads_30d',          (select (select count(*) from audit_leads   where created_at > now() - interval '30 days')
                                + (select count(*) from scanner_leads where created_at > now() - interval '30 days'))
  )
$$;

-- ── 20. Conversion des numéros d'abonné existants (comptes de test) ─────────
-- 26IXP002 → ABIXP2601AA, etc., dans l'ordre d'inscription. L'ancien numéro
-- est conservé dans numero_abonne_ancien ; factures, événements et sessions
-- sont mis à jour.
do $$
declare r record; v_new text;
begin
  for r in select id, numero_abonne, created_at from public.users
           where numero_abonne !~ '^AB[A-Z]{3}[0-9]{4}[A-Z]{2}$'
           order by created_at, id loop
    v_new := public.billing_next_number('abonne', r.created_at);
    update public.users set numero_abonne_ancien = r.numero_abonne, numero_abonne = v_new where id = r.id;
    update public.invoices            set numero_abonne = v_new where numero_abonne = r.numero_abonne;
    update public.subscription_events set numero_abonne = v_new where numero_abonne = r.numero_abonne;
    update public.user_sessions       set numero_abonne = v_new where numero_abonne = r.numero_abonne;
  end loop;
end $$;

-- Compte du propriétaire (ancien 26IXP002) : generaladmin, la simulation
-- Entreprise disparaît (le trigger fige plan/statut).
update public.users set role = 'generaladmin' where numero_abonne_ancien = '26IXP002';

-- ── 21. Stockage des justificatifs de virement (bucket privé) ───────────────
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'buckets') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('justificatifs', 'justificatifs', false, 5242880, array['application/pdf', 'image/jpeg', 'image/png'])
    on conflict (id) do nothing;
  end if;
end $$;

-- ── 22. Droits : clé service uniquement ─────────────────────────────────────
do $$
declare f text;
begin
  foreach f in array array[
    'billing_seq_code(int,boolean)',
    'billing_next_number(text,timestamptz)',
    'next_subscriber_number(timestamptz)',
    'users_generaladmin_guard()',
    'invoices_freeze_paid()',
    'invoices_no_delete_paid()',
    'avoirs_immutable()',
    'billing_issuer_snapshot()',
    'billing_client_snapshot(uuid)',
    'billing_create_proforma(uuid,text,int,numeric,text,text,text,boolean)',
    'admin_create_proforma(uuid,text,int,numeric,text,text)',
    'billing_confirm_payment(uuid,numeric,date,text,uuid,text,text)',
    'admin_confirm_payment(uuid,text,text)',
    'admin_activate_plan(uuid,text,int,numeric,text,text)',
    'billing_declare_payment(uuid,uuid,numeric,date,text,text,text)',
    'billing_reject_payment(uuid,text,text)',
    'admin_cancel_proforma(uuid,text,text)',
    'admin_create_avoir(uuid,text,numeric,boolean,text)',
    'admin_set_generaladmin(uuid,boolean,text,text)',
    'admin_set_status(uuid,text,text,text)',
    'billing_update_profile(uuid,jsonb,text)',
    'admin_dashboard_stats()'
  ] loop
    execute format('revoke all on function public.%s from public, anon, authenticated', f);
    execute format('grant execute on function public.%s to service_role', f);
  end loop;
end $$;


-- ═════════ supabase/setup/99_index.sql ═════════
-- supabase/setup/99_index.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Index de la base d'origine (relevés le 2026-11-07), à créer APRÈS les
-- migrations (certains utilisent la fonction tarif_dkey de la migration 0007).
-- Tous en « if not exists » : sans effet s'ils existent déjà.
-- ─────────────────────────────────────────────────────────────────────────────
create unique index if not exists admin_accounts_email_key       on public.admin_accounts using btree (email);
create unique index if not exists admin_accounts_single_super    on public.admin_accounts using btree (niveau) where (niveau = 'super'::text);
create index if not exists admin_accounts_token_idx              on public.admin_accounts using btree (token_hash) where (token_hash is not null);
create index if not exists audit_reports_user_id_idx             on public.audit_reports using btree (user_id);
create index if not exists conversations_user_id_idx             on public.conversations using btree (user_id);
create index if not exists dossiers_user_id_idx                  on public.dossiers using btree (user_id);
create index if not exists idx_decisions_circulaire              on public.decisions_classement using btree (circulaire);
create index if not exists idx_decisions_code_sh                 on public.decisions_classement using btree (code_sh);
create index if not exists idx_decisions_code_dkey               on public.decisions_classement using btree (code_sh, tarif_dkey(designation));
create unique index if not exists idx_decisions_dedup            on public.decisions_classement using btree (designation, code_sh);
create index if not exists idx_tarifs_chapitre                   on public.tarifs using btree (chapitre);
create index if not exists idx_tarifs_code_sh                    on public.tarifs using btree (code_sh);
create index if not exists idx_tarifs_code_dkey                  on public.tarifs using btree (code_sh, tarif_dkey(designation_clean));
create index if not exists idx_tarifs_niveau                     on public.tarifs using btree (niveau);
create index if not exists idx_users_verify_token                on public.users using btree (verify_token);
create index if not exists ingestion_lots_created_idx            on public.ingestion_lots using btree (created_at desc);
create index if not exists invoices_numero_idx                   on public.invoices using btree (numero_abonne);
create index if not exists invoices_status_idx                   on public.invoices using btree (status);
create index if not exists invoices_user_idx                     on public.invoices using btree (user_id);
create index if not exists kc_date_doc_idx                       on public.knowledge_chunks using btree (date_doc desc nulls last);
create index if not exists kc_domaine_idx                        on public.knowledge_chunks using btree (domaine);
create index if not exists knowledge_chunks_domaine_idx          on public.knowledge_chunks using btree (domaine);
create index if not exists knowledge_chunks_numero_idx           on public.knowledge_chunks using btree (numero);
create index if not exists knowledge_chunks_source_type_idx      on public.knowledge_chunks using btree (source_type);
create index if not exists knowledge_chunks_statut_idx           on public.knowledge_chunks using btree (statut);
create index if not exists knowledge_chunks_type_document_idx    on public.knowledge_chunks using btree (type_document);
create index if not exists messages_conversation_id_idx          on public.messages using btree (conversation_id);
create index if not exists messages_user_id_idx                  on public.messages using btree (user_id);
create index if not exists scanner_reports_user_id_idx           on public.scanner_reports using btree (user_id);
create index if not exists subscription_events_created_idx       on public.subscription_events using btree (created_at desc);
create index if not exists subscription_events_numero_idx        on public.subscription_events using btree (numero_abonne);
create index if not exists subscription_events_user_idx          on public.subscription_events using btree (user_id);
create index if not exists tarifs_historique_code_idx            on public.tarifs_historique using btree (code_sh);
create index if not exists tariff_searches_user_id_idx           on public.tariff_searches using btree (user_id);
create index if not exists user_memories_user_id_idx             on public.user_memories using btree (user_id);
create index if not exists user_memories_embedding_idx           on public.user_memories using ivfflat (embedding vector_cosine_ops) with (lists = '100');
create unique index if not exists users_numero_abonne_key        on public.users using btree (numero_abonne);
create index if not exists user_sessions_created_idx             on public.user_sessions using btree (created_at desc);
create index if not exists user_sessions_numero_idx              on public.user_sessions using btree (numero_abonne);

