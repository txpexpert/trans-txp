-- 0013 — (2026-11-19) Assistant de recherche (Conseil › Consultation express) et Forum des clients.
-- Tables accessibles par le serveur uniquement (clé service) : RLS activée, aucune politique.

-- ── Assistant de recherche : « Recherche et dissertation » ─────────────────
-- Brouillon rédigé à partir des textes de la base, relu et publié par un expert,
-- puis affiché dans « Mon espace » du client 1 h à 2 h après sa demande, avec e-mail d'avis.
create table if not exists public.recherches_expertes (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users(id) on delete cascade,
  question        text not null,
  statut          text not null default 'generation'
                  check (statut in ('generation', 'a_valider', 'publiee', 'rejetee', 'erreur')),
  brouillon       text,
  reponse         text,
  sources         jsonb not null default '[]'::jsonb,
  recherches      jsonb not null default '[]'::jsonb,
  erreur          text,
  note_client     text,
  created_at      timestamptz not null default now(),
  genere_at       timestamptz,
  publie_at       timestamptz,
  publie_par      text,
  lue_at          timestamptz,
  visible_apres   timestamptz not null default (now() + (60 + floor(random() * 61))::int * interval '1 minute'),
  email_envoye_at timestamptz
);
create index if not exists recherches_expertes_user_idx   on public.recherches_expertes (user_id, created_at desc);
create index if not exists recherches_expertes_statut_idx on public.recherches_expertes (statut, created_at);
create index if not exists recherches_expertes_avis_idx   on public.recherches_expertes (visible_apres) where email_envoye_at is null;
alter table public.recherches_expertes enable row level security;

-- ── Forum des clients ──────────────────────────────────────────────────────
create table if not exists public.forum_posts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  categorie     text not null default 'general'
                check (categorie in ('general', 'classement', 'origine', 'regimes', 'procedures', 'logistique', 'fiscalite', 'annonces')),
  titre         text not null check (char_length(titre) between 3 and 160),
  contenu       text not null check (char_length(contenu) <= 8000),
  pieces        jsonb not null default '[]'::jsonb,   -- [{ path, nom, type, taille, image }]
  statut        text not null default 'publie' check (statut in ('publie', 'masque')),
  epingle       boolean not null default false,
  nb_commentaires int not null default 0,
  nb_jaime      int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  dernier_at    timestamptz not null default now()   -- dernière activité (tri)
);
create index if not exists forum_posts_liste_idx on public.forum_posts (statut, epingle desc, dernier_at desc);
create index if not exists forum_posts_user_idx  on public.forum_posts (user_id, created_at desc);
alter table public.forum_posts enable row level security;

create table if not exists public.forum_commentaires (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.forum_posts(id) on delete cascade,
  user_id     uuid not null references public.users(id) on delete cascade,
  contenu     text not null check (char_length(contenu) between 1 and 4000),
  pieces      jsonb not null default '[]'::jsonb,
  statut      text not null default 'publie' check (statut in ('publie', 'masque')),
  created_at  timestamptz not null default now()
);
create index if not exists forum_commentaires_post_idx on public.forum_commentaires (post_id, created_at);
alter table public.forum_commentaires enable row level security;

create table if not exists public.forum_jaime (
  post_id    uuid not null references public.forum_posts(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.forum_jaime enable row level security;

create table if not exists public.forum_signalements (
  id              uuid primary key default gen_random_uuid(),
  post_id         uuid references public.forum_posts(id) on delete cascade,
  commentaire_id  uuid references public.forum_commentaires(id) on delete cascade,
  user_id         uuid not null references public.users(id) on delete cascade,
  motif           text not null check (char_length(motif) <= 500),
  traite_at       timestamptz,
  created_at      timestamptz not null default now(),
  check (post_id is not null or commentaire_id is not null)
);
create index if not exists forum_signalements_ouverts_idx on public.forum_signalements (created_at desc) where traite_at is null;
alter table public.forum_signalements enable row level security;

-- Compteurs tenus à jour par la base
create or replace function public.forum_maj_compteurs() returns trigger language plpgsql security definer set search_path = public as $$
declare p uuid;
begin
  p := coalesce(new.post_id, old.post_id);
  if tg_table_name = 'forum_commentaires' then
    update forum_posts set nb_commentaires = (select count(*) from forum_commentaires c where c.post_id = p and c.statut = 'publie'),
      dernier_at = case when tg_op = 'INSERT' then now() else dernier_at end where id = p;
  else
    update forum_posts set nb_jaime = (select count(*) from forum_jaime j where j.post_id = p) where id = p;
  end if;
  return null;
end $$;
drop trigger if exists forum_commentaires_compteurs on public.forum_commentaires;
create trigger forum_commentaires_compteurs after insert or update of statut or delete on public.forum_commentaires
  for each row execute function public.forum_maj_compteurs();
drop trigger if exists forum_jaime_compteurs on public.forum_jaime;
create trigger forum_jaime_compteurs after insert or delete on public.forum_jaime
  for each row execute function public.forum_maj_compteurs();
revoke execute on function public.forum_maj_compteurs() from public, anon, authenticated;

-- Pièces jointes du forum : bucket privé, liens signés délivrés par le serveur aux membres connectés
insert into storage.buckets (id, name, public, file_size_limit)
values ('forum', 'forum', false, 10485760)
on conflict (id) do nothing;
