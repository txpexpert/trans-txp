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
