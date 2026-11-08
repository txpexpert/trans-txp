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
