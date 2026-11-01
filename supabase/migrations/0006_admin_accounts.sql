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
