-- supabase/migrations/0011_whatsapp.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- WhatsApp Business (API Cloud de Meta) — 2026-11-11
--
--   • whatsapp_contacts   : un numéro WhatsApp (wa_id), relié ou non à un compte.
--                           Le consentement (loi 09-08) est daté : opt_in_at est
--                           posé quand l'abonné envoie lui-même son code de
--                           liaison ; opt_out_at quand il écrit STOP.
--   • whatsapp_link_codes : codes à usage unique (15 min) générés depuis
--                           Mon espace pour relier le numéro au compte.
--   • whatsapp_messages   : journal entrant/sortant (dédoublonnage des
--                           notifications Meta par wa_message_id). À purger
--                           au-delà de 12 mois (durée à déclarer à la CNDP).
--
-- Accès réservé au serveur (clé service) : RLS activé, aucune politique.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.whatsapp_contacts (
  wa_id            text primary key check (wa_id ~ '^[0-9]{8,15}$'),
  user_id          uuid references public.users(id) on delete set null,
  profile_name     text,
  opt_in_at        timestamptz,
  opt_out_at       timestamptz,
  linked_at        timestamptz,
  human_until      timestamptz,          -- conversation reprise par un conseiller : l'assistant se tait jusqu'à cette date
  last_inbound_at  timestamptz,          -- ouvre la fenêtre de 24 h des messages de service
  created_at       timestamptz not null default now()
);
create unique index if not exists whatsapp_contacts_user_uidx on public.whatsapp_contacts(user_id) where user_id is not null;
alter table public.whatsapp_contacts enable row level security;

create table if not exists public.whatsapp_link_codes (
  code        text primary key check (code ~ '^[0-9]{6}$'),
  user_id     uuid not null references public.users(id) on delete cascade,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists whatsapp_link_codes_user_idx on public.whatsapp_link_codes(user_id);
alter table public.whatsapp_link_codes enable row level security;

create table if not exists public.whatsapp_messages (
  id             bigint generated always as identity primary key,
  wa_message_id  text unique,
  wa_id          text not null,
  direction      text not null check (direction in ('in', 'out')),
  kind           text not null default 'text',   -- text, template, interactive, status…
  body           text,
  statut         text,                           -- sent, delivered, read, failed (messages sortants)
  erreur         text,
  created_at     timestamptz not null default now()
);
create index if not exists whatsapp_messages_wa_idx on public.whatsapp_messages(wa_id, created_at desc);
alter table public.whatsapp_messages enable row level security;
