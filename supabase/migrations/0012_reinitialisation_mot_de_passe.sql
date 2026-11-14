-- 0012 — Réinitialisation du mot de passe des comptes clients (2026-11-14)
-- Lien à usage unique envoyé par email : seule l'empreinte SHA-256 du jeton
-- est conservée, jamais le jeton lui-même. Colonnes facultatives, sans effet
-- sur les comptes existants.
alter table public.users
  add column if not exists reset_token_hash    text,
  add column if not exists reset_token_expires timestamptz,
  add column if not exists password_changed_at timestamptz;

create index if not exists users_reset_token_hash_idx
  on public.users (reset_token_hash) where reset_token_hash is not null;
