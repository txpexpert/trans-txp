-- 0011_whatsapp.sql — IXP-Assistant sur WhatsApp (création de tables uniquement, aucune table existante modifiée).
-- Accès réservé au service (RLS activé, aucune politique) : seules les routes serveur y lisent et écrivent.

-- Numéros reliés à un compte. Le lien et la date de consentement naissent de l'envoi, par le
-- titulaire lui-même, du message « IXP <code> » depuis son téléphone (loi 09-08).
create table if not exists public.whatsapp_contacts (
  telephone     text primary key,                       -- format international, chiffres seuls (212…)
  user_id       uuid references public.users(id) on delete cascade,
  consenti_le   timestamptz,
  desinscrit    boolean not null default false,          -- STOP / START
  humain_jusqua timestamptz,                             -- CONSEILLER : assistant coupé 24 h
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create unique index if not exists whatsapp_contacts_user_uidx on public.whatsapp_contacts(user_id) where user_id is not null;

-- Codes de liaison à usage unique, valables 15 minutes.
create table if not exists public.whatsapp_codes (
  code       text primary key,
  user_id    uuid not null references public.users(id) on delete cascade,
  expire_le  timestamptz not null,
  created_at timestamptz not null default now()
);

-- Journal technique : ni le texte des messages ni le nom du contact (seulement le type de traitement),
-- pour la limite de 30 questions par heure et pour ignorer les messages renvoyés deux fois par Meta.
create table if not exists public.whatsapp_journal (
  id         bigserial primary key,
  wa_id      text unique,                                -- identifiant du message chez Meta
  telephone  text not null,
  sens       text not null check (sens in ('entrant', 'sortant')),
  traitement text,
  created_at timestamptz not null default now()
);
create index if not exists whatsapp_journal_tel_idx on public.whatsapp_journal(telephone, created_at desc);

alter table public.whatsapp_contacts enable row level security;
alter table public.whatsapp_codes    enable row level security;
alter table public.whatsapp_journal  enable row level security;
