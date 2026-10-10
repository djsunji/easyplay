-- easyplay: Tabelle für die Fragen
-- Im Supabase-Dashboard unter "SQL Editor" einfügen und ausführen.

create table if not exists public.fragen (
  id          bigint generated always as identity primary key,
  thema       text not null,                         -- z. B. "steuern", "kt_ZH", "pol_welt"
  stufe       smallint not null check (stufe between 1 and 3),  -- 1 Entdecker, 2 Könner, 3 Profis
  frage       text not null,
  antworten   jsonb not null,                        -- ["richtig", "falsch", "falsch", "falsch"] – die erste ist richtig
  erklaerung  text,
  merksatz    text,
  quelle      text,                                  -- Wikipedia-Stichwort
  bild        text,                                  -- z. B. "e:🚒", "w:ZH", "f:DE", "a:fuchs"
  status      text not null default 'ok' check (status in ('ok','neu','gesperrt')),
  erstellt    timestamptz not null default now()
);

create index if not exists fragen_thema_stufe on public.fragen (thema, stufe) where status = 'ok';

-- Sicherheit: Alle dürfen freigegebene Fragen LESEN, niemand darf über die Website schreiben.
-- Neue Fragen fügst du im Dashboard (Table Editor) oder später über eine geschützte Admin-Funktion ein.
alter table public.fragen enable row level security;

drop policy if exists "Freigegebene Fragen sind lesbar" on public.fragen;
create policy "Freigegebene Fragen sind lesbar"
  on public.fragen for select
  to anon, authenticated
  using (status = 'ok');

-- easyplay: Likes für die Qeels (Anzahl «Gefällt mir» pro Qeel)
create table if not exists public.likes (
  id  text primary key,              -- z. B. "q8894" für Frage Nr. 8894
  n   integer not null default 0 check (n >= 0)
);
alter table public.likes enable row level security;
drop policy if exists "Likes sind lesbar" on public.likes;
create policy "Likes sind lesbar" on public.likes for select to anon, authenticated using (true);

-- Zählen nur über diese Funktion (+1 oder -1), direktes Schreiben ist gesperrt
create or replace function public.like_aendern(p_id text, p_delta integer)
returns integer language plpgsql security definer set search_path = public as $$
declare neu integer;
begin
  if p_delta not in (-1, 1) or length(p_id) > 80 then raise exception 'ungueltig'; end if;
  insert into public.likes (id, n) values (p_id, greatest(p_delta, 0))
  on conflict (id) do update set n = greatest(public.likes.n + p_delta, 0)
  returning n into neu;
  return neu;
end $$;
grant execute on function public.like_aendern(text, integer) to anon, authenticated;
