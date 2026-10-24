-- easyplay: Tabelle für die Fragen, Likes, Kommentare und gemeinsame Hilfsfunktionen (aufrufer, bremse, kontakt_verdacht)
-- Im Supabase-Dashboard unter "SQL Editor" einfügen und ausführen. Immer ZUERST ausführen, die anderen
-- Dateien brauchen die Hilfsfunktionen von hier. Darf mehrmals laufen.

create table if not exists public.fragen (
  id          bigint generated always as identity primary key,
  thema       text not null,                         -- z. B. "steuern", "kt_ZH", "pol_welt"
  stufe       smallint not null check (stufe between 1 and 3),  -- 1 Entdecker, 2 Könner, 3 Profis
  frage       text not null,
  antworten   jsonb not null,                        -- ["richtig", "falsch", "falsch", "falsch"], die erste ist richtig
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


-- Kennung des Aufrufers: Konto-ID oder gehashte IP-Adresse (die IP selbst wird nicht gespeichert).
-- Die IP kommt aus dem LETZTEN Eintrag von x-forwarded-for: Den ersten Eintrag kann der Browser selbst
-- mitschicken (fälschbar), den letzten hängt der Proxy von Supabase an.
-- Nach dem Einschalten einmal mit admin_ip_pruefen() (admin.sql) kontrollieren, dass hier wirklich die
-- eigene IP steht und nicht die Adresse eines Proxys (sonst teilen sich alle Besucher eine Kennung).
create or replace function public.aufrufer() returns text
language sql stable set search_path = public as $$
  select coalesce(auth.uid()::text,
    'ip:' || md5('easyplay|' || coalesce(
      nullif(btrim(reverse(split_part(reverse(coalesce(nullif(current_setting('request.headers', true), '')::json->>'x-forwarded-for', '')), ',', 1))), ''),
      'unbekannt')));
$$;
revoke all on function public.aufrufer() from public, anon, authenticated;

-- ---------- Gemeinsame Mengenbremse ----------
-- bremse('art', max, intervall) gibt TRUE zurück, wenn der Aufrufer in diesem Zeitraum schon max-mal
-- «art» gemacht hat (dann abbrechen). Sonst wird der Aufruf gezählt und FALSE zurückgegeben.
-- Einträge älter als 2 Tage werden nebenbei gelöscht, Intervalle darum höchstens 1 Tag.
-- Achtung Schulen: ohne Konto teilen sich alle Kinder hinter einem Schulnetz eine IP und damit eine Kennung.
-- Darum haben Aufrufe ohne Konto meist eine höhere Grenze als Aufrufe mit Konto.
create table if not exists public.bremse_log (
  id   bigint generated always as identity primary key,
  wer  text not null,
  art  text not null,
  zeit timestamptz not null default now()
);
create index if not exists bremse_log_art_wer on public.bremse_log (art, wer, zeit);
create index if not exists bremse_log_art_zeit on public.bremse_log (art, zeit);
create index if not exists bremse_log_zeit on public.bremse_log (zeit);
alter table public.bremse_log enable row level security;  -- keine Policy: nur über die Funktionen
revoke all on public.bremse_log from anon, authenticated;

-- Wie oft hat der Aufrufer (oder mit p_alle: alle zusammen) «art» im Intervall gemacht?
create or replace function public.bremse_anzahl(p_art text, p_intervall interval, p_alle boolean default false)
returns integer language sql stable security definer set search_path = public as $$
  select count(*)::int from public.bremse_log b
  where b.art = p_art and b.zeit > now() - p_intervall
    and (p_alle or b.wer = public.aufrufer());
$$;
revoke all on function public.bremse_anzahl(text, interval, boolean) from public, anon, authenticated;

-- Einen Vorgang zählen (ohne Prüfung), nebenbei Altes aufräumen
create or replace function public.bremse_merken(p_art text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.bremse_log (wer, art) values (public.aufrufer(), left(coalesce(p_art, ''), 80));
  if random() < 0.02 then
    delete from public.bremse_log where zeit < now() - interval '2 days';
  end if;
end $$;
revoke all on function public.bremse_merken(text) from public, anon, authenticated;

create or replace function public.bremse(p_art text, p_max integer, p_intervall interval)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_wer text := public.aufrufer();
begin
  -- gleichzeitige Aufrufe derselben Person nacheinander zählen
  perform pg_advisory_xact_lock(hashtext('bremse|' || coalesce(p_art, '') || '|' || v_wer));
  if public.bremse_anzahl(p_art, p_intervall) >= greatest(coalesce(p_max, 0), 0) then
    return true;
  end if;
  perform public.bremse_merken(p_art);
  return false;
end $$;
revoke all on function public.bremse(text, integer, interval) from public, anon, authenticated;

-- ---------- Einfache Kontaktsperre für Namen und Texte ----------
-- Erkennt @, Links, Hinweise auf Insta, Snap, WhatsApp, TikTok, Discord, Telegram und lange Zahlenfolgen (Telefonnummern).
create or replace function public.kontakt_verdacht(p text)
returns boolean language sql immutable as $$
  select coalesce(p, '') ~* '(@|https?:|www\.|\minsta(?!bil)|\msnap|whats\s*app|\mwa\.me|tik\s*tok|\mdiscord|\mtelegram)'
      or regexp_replace(coalesce(p, ''), '[\s.\-/()+_]', '', 'g') ~ '[0-9]{7,}';
$$;
revoke all on function public.kontakt_verdacht(text) from public, anon, authenticated;

-- Zählen nur über diese Funktion (+1 oder -1), direktes Schreiben ist gesperrt
create or replace function public.like_aendern(p_id text, p_delta integer)
returns integer language plpgsql security definer set search_path = public as $$
declare neu integer; v_wer text := public.aufrufer(); geaendert integer;
begin
  if p_delta not in (-1, 1) or p_id is null or length(p_id) > 80 then raise exception 'ungueltig'; end if;
  if p_delta = 1 then
    -- mit Konto 30, ohne Konto (ganze Schule hinter einer IP) 120 Likes pro Minute
    if public.bremse('like', case when auth.uid() is null then 120 else 30 end, interval '1 minute') then
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
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.kommentare add constraint kommentare_avatar_laenge check (avatar is null or char_length(avatar) <= 40) not valid;
exception when duplicate_object then null; end $$;
create index if not exists kommentare_qeel on public.kommentare(qeel, erstellt desc);
create index if not exists kommentare_wer on public.kommentare(wer);
alter table public.kommentare enable row level security;
drop policy if exists "kommentare lesen" on public.kommentare;
drop policy if exists "kommentare schreiben" on public.kommentare;
drop policy if exists "kommentare eigene loeschen" on public.kommentare;
create policy "kommentare lesen" on public.kommentare for select to anon, authenticated using (gemeldet < 3);
create policy "kommentare schreiben" on public.kommentare for insert to authenticated
  with check (gemeldet = 0 and wer = auth.uid());
create policy "kommentare eigene loeschen" on public.kommentare for delete to authenticated using (wer = auth.uid());
-- Spaltenrechte: die Konto-ID (wer) ist für niemanden lesbar, schreiben nur mit Konto.
revoke all on public.kommentare from anon, authenticated;
grant select (id, qeel, name, avatar, text, gemeldet, erstellt) on public.kommentare to anon, authenticated;
grant insert (qeel, name, avatar, text) on public.kommentare to authenticated;
grant delete on public.kommentare to authenticated;
do $$ begin
  grant usage on sequence public.kommentare_id_seq to authenticated;
exception when undefined_table then null; end $$;

-- Vor dem Speichern: Konto, Sperre, Name aus dem Konto, Kontaktsperre und Mengenbremse.
-- Der Name kommt NIE vom Browser, sondern aus dem Konto: Vorname und Initiale des Nachnamens, sonst «Kind».
create or replace function public.kommentar_vorher() returns trigger
language plpgsql security definer set search_path = public, auth as $$
declare v_meta jsonb; v_bis timestamptz; v_vor text; v_nach text;
begin
  new.wer := auth.uid(); new.gemeldet := 0; new.erstellt := now();
  if new.wer is null then raise exception 'anmelden'; end if;
  select coalesce(u.raw_user_meta_data, '{}'::jsonb), u.banned_until into v_meta, v_bis
  from auth.users u where u.id = new.wer;
  if not found then raise exception 'anmelden'; end if;
  if v_bis is not null and v_bis > now() then raise exception 'gesperrt'; end if;

  v_vor := btrim(coalesce(nullif(btrim(v_meta->>'vorname'), ''),
                          split_part(btrim(coalesce(v_meta->>'name', v_meta->>'full_name', '')), ' ', 1)));
  v_nach := btrim(coalesce(v_meta->>'nachname', ''));
  new.name := case when v_vor = '' then 'Kind'
                   else left(v_vor, 26) || case when v_nach <> '' then ' ' || upper(left(v_nach, 1)) || '.' else '' end end;
  if public.kontakt_verdacht(new.name) or new.name ~ '[<>{}]' then new.name := 'Kind'; end if;

  if new.avatar is not null and (new.avatar !~ '^[A-Za-z0-9_:.-]{1,40}$' or public.kontakt_verdacht(new.avatar)) then
    new.avatar := null;
  end if;
  new.qeel := left(coalesce(new.qeel, ''), 80);
  new.text := btrim(coalesce(new.text, ''));
  if public.kontakt_verdacht(new.text) then raise exception 'kontakt'; end if;

  if public.bremse('kommentar', 5, interval '10 minutes') or public.bremse('kommentar-tag', 50, interval '1 day') then
    raise exception 'zu viele';
  end if;
  return new;
end $$;
revoke all on function public.kommentar_vorher() from public, anon, authenticated;
drop trigger if exists kommentar_vorher on public.kommentare;
create trigger kommentar_vorher before insert on public.kommentare for each row execute function public.kommentar_vorher();

-- Melden: nur mit Konto, jede Person zählt pro Kommentar nur einmal
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
  if auth.uid() is null then raise exception 'anmelden'; end if;
  if public.bremse('melden', 30, interval '1 hour') then raise exception 'zu viele'; end if;
  insert into public.kommentar_meldungen (kommentar, wer) values (p_id, public.aufrufer()) on conflict do nothing;
  get diagnostics geaendert = row_count;
  if geaendert > 0 then update public.kommentare set gemeldet = gemeldet + 1 where id = p_id; end if;
end $$;
revoke all on function public.kommentar_melden(bigint) from public, anon;
grant execute on function public.kommentar_melden(bigint) to authenticated;
