-- easyplay-Server: Grundlage für die Anmeldung (ersetzt das, was Supabase mitbringt).
-- Läuft beim Start des Servers vor den Dateien in supabase/. Darf mehrmals laufen.
-- Die Tabellen heissen wie bei Supabase (auth.users, auth.sessions, auth.refresh_tokens), damit die
-- bestehenden Funktionen in supabase/*.sql unverändert weiterlaufen.

create schema if not exists auth;

create table if not exists auth.users (
  id                  uuid primary key default gen_random_uuid(),
  email               text unique,
  encrypted_password  text,                                   -- scrypt$N$r$p$salt$hash
  email_confirmed_at  timestamptz,
  confirmation_token  text,                                   -- sha256 des Bestätigungscodes
  confirmation_sent_at timestamptz,
  confirmation_pw     text,                                   -- Passwort, das erst mit dem Bestätigungslink gilt
  confirmation_meta   jsonb,                                  -- Profil, das erst mit dem Bestätigungslink gilt
  recovery_token      text,                                   -- sha256 des Codes für «Passwort vergessen»
  recovery_sent_at    timestamptz,
  raw_user_meta_data  jsonb not null default '{}'::jsonb,     -- Profil (darf die Person selbst ändern)
  raw_app_meta_data   jsonb not null default '{"provider":"email","providers":["email"]}'::jsonb,  -- Rolle usw. (nur Server)
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  last_sign_in_at     timestamptz,
  banned_until        timestamptz
);
create index if not exists users_email_lower on auth.users (lower(email));
alter table auth.users add column if not exists confirmation_pw text;
alter table auth.users add column if not exists confirmation_meta jsonb;

create table if not exists auth.identities (
  provider     text not null,                                 -- google, apple
  provider_id  text not null,                                 -- «sub» des Anbieters
  user_id      uuid not null references auth.users(id) on delete cascade,
  email        text,
  created_at   timestamptz not null default now(),
  primary key (provider, provider_id)
);

create table if not exists auth.sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  user_agent  text,
  ip          text
);
create index if not exists sessions_user on auth.sessions (user_id);

create table if not exists auth.refresh_tokens (
  id          bigserial primary key,
  token       text not null unique,                           -- sha256 des Tokens
  user_id     text not null,                                  -- wie bei Supabase als Text
  session_id  uuid references auth.sessions(id) on delete cascade,
  revoked     boolean not null default false,
  parent      text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists refresh_tokens_session on auth.refresh_tokens (session_id);

-- Wer fragt gerade? Der Server setzt pro Anfrage request.jwt.claim.sub (siehe server/db.js).
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
create or replace function auth.role() returns text language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), 'anon')
$$;
create or replace function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
$$;
create or replace function auth.email() returns text language sql stable as $$
  select auth.jwt() ->> 'email'
$$;

-- Rollen (anon, authenticated) braucht es nicht: Der Server überspringt grant/revoke/policy-Befehle aus
-- supabase/*.sql und prüft die Rechte selbst (server/rest.js). Welche Funktionen die Website aufrufen
-- darf, liest er aus den grant-Befehlen dieser Dateien.

-- Welche Datei schon gelaufen ist (mit Prüfsumme). Geänderte Dateien laufen beim nächsten Start nochmals.
create table if not exists public.ep_migrationen (
  datei   text primary key,
  hash    text not null,
  zeit    timestamptz not null default now()
);
