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

-- Wer hat schon geliked? Pro Person (Konto oder anonymisierte IP) und Qeel nur eine Stimme
create table if not exists public.like_stimmen (
  id   text not null,
  wer  text not null,
  zeit timestamptz not null default now(),
  primary key (id, wer)
);
alter table public.like_stimmen enable row level security;  -- keine Policy: nur über Funktionen

-- Kennung des Aufrufers: Konto-ID oder gehashte IP-Adresse (die IP selbst wird nicht gespeichert)
create or replace function public.aufrufer() returns text
language sql stable set search_path = public as $$
  select coalesce(auth.uid()::text,
    'ip:' || md5('easyplay|' || coalesce(split_part(current_setting('request.headers', true)::json->>'x-forwarded-for', ',', 1), 'unbekannt')));
$$;
revoke all on function public.aufrufer() from public, anon, authenticated;

-- Zählen nur über diese Funktion (+1 oder -1), direktes Schreiben ist gesperrt
create or replace function public.like_aendern(p_id text, p_delta integer)
returns integer language plpgsql security definer set search_path = public as $$
declare neu integer; v_wer text := public.aufrufer(); geaendert integer;
begin
  if p_delta not in (-1, 1) or p_id is null or length(p_id) > 80 then raise exception 'ungueltig'; end if;
  if p_delta = 1 then
    if (select count(*) from public.like_stimmen where wer = v_wer and zeit > now() - interval '1 minute') >= 30 then
      raise exception 'zu viele';
    end if;
    insert into public.like_stimmen (id, wer) values (p_id, v_wer) on conflict do nothing;
  else
    delete from public.like_stimmen where id = p_id and wer = v_wer;
  end if;
  get diagnostics geaendert = row_count;
  if geaendert > 0 then
    insert into public.likes (id, n) values (p_id, greatest(p_delta, 0))
    on conflict (id) do update set n = greatest(public.likes.n + p_delta, 0);
  end if;
  select n into neu from public.likes where id = p_id;
  return coalesce(neu, 0);
end $$;
revoke all on function public.like_aendern(text, integer) from public;
grant execute on function public.like_aendern(text, integer) to anon, authenticated;

-- Qeels: Kommentare (schreiben nur mit Konto, höchstens 5 pro 10 Minuten)
create table if not exists public.kommentare (
  id bigserial primary key,
  qeel text not null,
  name text not null check (char_length(name) between 1 and 30),
  avatar text,
  text text not null check (char_length(text) between 2 and 200),
  gemeldet int not null default 0,
  erstellt timestamptz not null default now()
);
alter table public.kommentare add column if not exists wer uuid default auth.uid();
do $$ begin
  alter table public.kommentare add constraint kommentare_qeel_laenge check (char_length(qeel) <= 80) not valid;
  alter table public.kommentare add constraint kommentare_avatar_laenge check (avatar is null or char_length(avatar) <= 40) not valid;
exception when duplicate_object then null; end $$;
create index if not exists kommentare_qeel on public.kommentare(qeel, erstellt desc);
alter table public.kommentare enable row level security;
drop policy if exists "kommentare lesen" on public.kommentare;
drop policy if exists "kommentare schreiben" on public.kommentare;
drop policy if exists "kommentare eigene loeschen" on public.kommentare;
create policy "kommentare lesen" on public.kommentare for select to anon, authenticated using (gemeldet < 3);
create policy "kommentare schreiben" on public.kommentare for insert to authenticated
  with check (gemeldet = 0 and wer = auth.uid());
create policy "kommentare eigene loeschen" on public.kommentare for delete to authenticated using (wer = auth.uid());
revoke update on public.kommentare from anon, authenticated;

create or replace function public.kommentar_vorher() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.wer := auth.uid(); new.gemeldet := 0; new.erstellt := now();
  if new.wer is null then raise exception 'anmelden'; end if;
  if (select count(*) from public.kommentare k where k.wer = new.wer and k.erstellt > now() - interval '10 minutes') >= 5 then
    raise exception 'zu viele';
  end if;
  return new;
end $$;
drop trigger if exists kommentar_vorher on public.kommentare;
create trigger kommentar_vorher before insert on public.kommentare for each row execute function public.kommentar_vorher();

-- Melden: jede Person zählt pro Kommentar nur einmal
create table if not exists public.kommentar_meldungen (
  kommentar bigint not null references public.kommentare(id) on delete cascade,
  wer text not null,
  zeit timestamptz not null default now(),
  primary key (kommentar, wer)
);
alter table public.kommentar_meldungen enable row level security;  -- keine Policy: nur über die Funktion

create or replace function public.kommentar_melden(p_id bigint) returns void
language plpgsql security definer set search_path = public as $$
declare geaendert integer;
begin
  insert into public.kommentar_meldungen (kommentar, wer) values (p_id, public.aufrufer()) on conflict do nothing;
  get diagnostics geaendert = row_count;
  if geaendert > 0 then update public.kommentare set gemeldet = gemeldet + 1 where id = p_id; end if;
end $$;
revoke all on function public.kommentar_melden(bigint) from public;
grant execute on function public.kommentar_melden(bigint) to anon, authenticated;
