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
