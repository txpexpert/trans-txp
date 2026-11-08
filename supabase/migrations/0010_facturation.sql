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
