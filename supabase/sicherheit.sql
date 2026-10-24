-- easyplay: Sicherheits-Update (Oktober 2026) für eine BEREITS EINGERICHTETE Supabase-Datenbank
--
-- WANN AUSFÜHREN
--   Einmal im Supabase SQL Editor, wenn die Datenbank schon mit den älteren Dateien eingerichtet wurde,
--   und zwar BEVOR die neue Website-Version (duell2.js, regionen.js und die angepassten index.html,
--   lehrer.js, lehrer/lehrer-app.js, admin/index.html) online geht. Ältere Seiten im Browser-Speicher laufen
--   weiter: Duelle alter Seiten werden abgelehnt (die Kinder spielen dann gegen Leni oder Ben),
--   alle anderen Funktionen behalten ihre Namen.
--   Bei einer NEUEN Datenbank braucht es diese Datei nicht: dort die Einzeldateien in derselben Reihenfolge
--   ausführen (schema, lehrer, admin, lehrer2, klassenliga, live, regionen, duell).
--   Die Datei darf mehrmals laufen. Alles läuft in einer Transaktion: Bei einem Fehler wird nichts geändert.
--
-- WAS SICH ÄNDERT (Kurzfassung)
--   1. schema.sql: aufrufer() nimmt die IP aus dem LETZTEN Eintrag von x-forwarded-for. Neue gemeinsame
--      Mengenbremse bremse(art, max, intervall) mit Tabelle bremse_log. Kontaktsperre kontakt_verdacht().
--      Kommentare: Name kommt aus dem Konto, Konto-ID (wer) ist nicht mehr lesbar, Kontaktangaben und
--      gesperrte Konten werden abgelehnt, Melden nur mit Konto.
--   2. lehrer.sql: Rolle Lehrperson nur noch durch Admin (raw_app_meta_data), ist_lehrer() in allen Regeln.
--      PIN-Sperre pro Aufrufer statt für alle. Neue Spalte punkte_auto (nur vom Server).
--   3. admin.sql: admin_lehrer_setzen(p_id, p_an), admin_benutzer mit Spalte antrag, Sperren meldet ab,
--      admin_ip_pruefen() zum Kontrollieren der IP-Erkennung.
--   4. lehrer2.sql, klassenliga.sql: ist_lehrer() verlangt, Liga zählt nur punkte_auto.
--   5. live.sql: kein direktes Schreiben und Lesen mehr, ein Ergebnis pro Konto und Runde, Punkte begrenzt.
--   6. regionen.sql: Bremse beim Buchen, höchstens 150 Punkte pro Frage, Verlauf nur für Admins.
--   7. duell.sql: nur Fragen-Kennungen statt Texten, Namen ohne Kontaktangaben, Punkte begrenzt.
--
-- NACH DEM AUSFÜHREN
--   a) Bisherige Lehrpersonen sind jetzt nur noch «Antrag». In der Verwaltung prüfen und freigeben
--      (admin_lehrer_setzen), oder die SQL-Zeilen ganz unten in admin.sql von Hand anpassen und ausführen.
--   b) Als Admin angemeldet einmal admin_ip_pruefen() aufrufen und kontrollieren, dass «genutzt» die eigene
--      öffentliche IP ist (siehe Kommentar in admin.sql).
--
-- Diese Datei ist aus den Einzeldateien zusammengesetzt (gleicher Inhalt, gleiche Reihenfolge).
-- Wer eine Einzeldatei ändert, setzt diese Datei neu zusammen, damit beide gleich bleiben.

begin;

-- ================================================================
-- supabase/schema.sql
-- ================================================================
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

-- ================================================================
-- supabase/lehrer.sql
-- ================================================================
-- easyplay Lehrerbereich: Klassen, Kinder (nur Vorname oder Kürzel und PIN), Tests und Abgaben
-- Im Supabase-Dashboard unter «SQL Editor» einfügen und auf «Run» klicken.
-- Das Skript kann mehrfach ausgeführt werden (es überschreibt nur Funktionen und Regeln).
--
-- Sicherheit in Kürze:
--   * Lehrpersonen melden sich mit ihrem easyplay-Konto an (Supabase Auth) und sehen nur ihre eigenen Daten (RLS).
--   * Kinder haben KEIN Konto. Sie laden einen Test und geben ihn ab über die Funktionen
--     test_laden(test_code, pin) und abgabe_einreichen(test_code, pin, antworten, dauer_ms).
--     Beide prüfen Test-Code und PIN auf dem Server (security definer). Die richtigen Antworten
--     verlassen den Server erst nach der Abgabe.
--   * Falsche PINs bremsen nur den, der sie eingibt (Kennung aus aufrufer(): Konto oder gehashte IP):
--     20 falsche PINs pro Test-Code oder 40 Fehlversuche insgesamt in 10 Minuten, dann kurz gesperrt.
--     Erst bei 200 falschen PINs aus allen Netzen zusammen wird ein Test-Code für alle kurz gesperrt.
--     So kann ein einzelnes Kind nicht den Test der ganzen Klasse sperren.
--   * Lehrperson ist nur, wer von einem Admin freigegeben wurde (raw_app_meta_data.rolle = 'lehrperson',
--     gesetzt mit admin_lehrer_setzen in admin.sql). Die Rolle in den Benutzerdaten (user_metadata) kann jede
--     Person selbst setzen und gilt nur noch als Antrag. Alle Regeln unten verlangen zusätzlich ist_lehrer().
--
-- Reihenfolge: NACH schema.sql (braucht aufrufer und bremse), vor admin.sql, lehrer2.sql und klassenliga.sql.

-- ---------- Tabellen ----------
create table if not exists public.lehrer_klassen (
  id         uuid primary key default gen_random_uuid(),
  lehrer     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 60),
  schuljahr  text not null default '',
  zyklus     smallint check (zyklus between 1 and 3),
  erstellt   timestamptz not null default now()
);

create table if not exists public.lehrer_schueler (
  id         uuid primary key default gen_random_uuid(),
  klasse_id  uuid not null references public.lehrer_klassen(id) on delete cascade,
  lehrer     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 30),   -- nur Vorname oder Kürzel
  pin        text not null check (pin ~ '^[0-9]{4,6}$'),
  erstellt   timestamptz not null default now(),
  unique (klasse_id, pin)
);

create table if not exists public.lehrer_tests (
  code       text primary key check (code ~ '^[A-Z0-9]{6}$'),
  lehrer     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  klasse_id  uuid not null references public.lehrer_klassen(id) on delete cascade,
  titel      text not null check (char_length(titel) between 1 and 80),
  schuljahr  text not null default '',
  lp21       jsonb not null default '[]'::jsonb,
  fragen     jsonb not null check (jsonb_typeof(fragen) = 'array' and jsonb_array_length(fragen) between 1 and 60),
  -- jede Frage: {"q": Frage, "o": [4 Antworten], "r": Index der richtigen, "e": Erklärung, "nr", "t", "l", "s"}
  info       jsonb not null default '{}'::jsonb,
  aktiv      boolean not null default true,
  erstellt   timestamptz not null default now()
);

create table if not exists public.lehrer_abgaben (
  id          uuid primary key default gen_random_uuid(),
  test_code   text not null references public.lehrer_tests(code) on delete cascade,
  schueler_id uuid not null references public.lehrer_schueler(id) on delete cascade,
  lehrer      uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  antworten   jsonb not null,           -- [Index der gewählten Antwort oder null, ...]
  punkte      integer not null,
  max         integer not null,
  note        numeric(2,1) not null,    -- Schweizer Note 1 bis 6, auf halbe Noten gerundet
  dauer_ms    integer not null default 0,
  abgegeben   timestamptz not null default now(),
  unique (test_code, schueler_id)
);

-- Früher für die PIN-Sperre benutzt, heute zählt bremse_log (schema.sql). Bleibt nur für alte Datenbanken bestehen.
create table if not exists public.lehrer_fehlversuche (
  id    bigint generated always as identity primary key,
  code  text not null,
  zeit  timestamptz not null default now()
);

create index if not exists lehrer_klassen_lehrer on public.lehrer_klassen (lehrer);
create index if not exists lehrer_schueler_klasse on public.lehrer_schueler (klasse_id);
create index if not exists lehrer_tests_lehrer on public.lehrer_tests (lehrer);
create index if not exists lehrer_abgaben_lehrer on public.lehrer_abgaben (lehrer);
create index if not exists lehrer_abgaben_test on public.lehrer_abgaben (test_code);
create index if not exists lehrer_fehlversuche_code on public.lehrer_fehlversuche (code, zeit);

-- ---------- Punkte für die Klassen-Liga ----------
-- punkte_auto: die Punkte, die abgabe_einreichen auf dem Server ausgerechnet hat (Auswahlfragen).
-- Die Lehrperson kann punkte (Korrektur offener Fragen) ändern, punkte_auto aber nicht. Die Liga zählt nur punkte_auto.
alter table public.lehrer_abgaben add column if not exists punkte_auto numeric(6,1);

create or replace function public.lehrer_abgabe_schutz() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.punkte_auto := new.punkte;
  elsif old.punkte_auto is not null then
    new.punkte_auto := old.punkte_auto;
  end if;
  return new;
end $$;
revoke all on function public.lehrer_abgabe_schutz() from public, anon, authenticated;
drop trigger if exists lehrer_abgabe_schutz on public.lehrer_abgaben;
create trigger lehrer_abgabe_schutz before insert or update on public.lehrer_abgaben
  for each row execute function public.lehrer_abgabe_schutz();
-- Bestehende Abgaben einmalig übernehmen
update public.lehrer_abgaben set punkte_auto = punkte where punkte_auto is null;

-- ---------- Rolle Lehrperson ----------
-- Nur von einem Admin vergeben (raw_app_meta_data kann die Person nicht selbst ändern). Gesperrte Konten zählen nicht.
create or replace function public.ist_lehrer() returns boolean
language sql stable security definer set search_path = public, auth as $$
  select exists (select 1 from auth.users u
                 where u.id = auth.uid()
                   and u.raw_app_meta_data->>'rolle' = 'lehrperson'
                   and (u.banned_until is null or u.banned_until <= now()));
$$;
revoke all on function public.ist_lehrer() from public, anon;
grant execute on function public.ist_lehrer() to authenticated;

-- ---------- Zeilenschutz (RLS): jede freigegebene Lehrperson sieht nur ihre eigenen Daten ----------
alter table public.lehrer_klassen      enable row level security;
alter table public.lehrer_schueler     enable row level security;
alter table public.lehrer_tests        enable row level security;
alter table public.lehrer_abgaben      enable row level security;
alter table public.lehrer_fehlversuche enable row level security;   -- ohne Regel: niemand liest oder schreibt direkt

revoke all on public.lehrer_klassen, public.lehrer_schueler, public.lehrer_tests, public.lehrer_abgaben, public.lehrer_fehlversuche from anon;
grant select, insert, update, delete on public.lehrer_klassen, public.lehrer_schueler, public.lehrer_tests to authenticated;
grant select, delete on public.lehrer_abgaben to authenticated;

drop policy if exists "Eigene Klassen" on public.lehrer_klassen;
create policy "Eigene Klassen" on public.lehrer_klassen for all to authenticated
  using (lehrer = auth.uid() and (select public.ist_lehrer())) with check (lehrer = auth.uid() and (select public.ist_lehrer()));

drop policy if exists "Eigene Kinder" on public.lehrer_schueler;
create policy "Eigene Kinder" on public.lehrer_schueler for all to authenticated
  using (lehrer = auth.uid() and (select public.ist_lehrer()))
  with check (lehrer = auth.uid() and (select public.ist_lehrer()) and exists (select 1 from public.lehrer_klassen k where k.id = klasse_id and k.lehrer = auth.uid()));

drop policy if exists "Eigene Tests" on public.lehrer_tests;
create policy "Eigene Tests" on public.lehrer_tests for all to authenticated
  using (lehrer = auth.uid() and (select public.ist_lehrer()))
  with check (lehrer = auth.uid() and (select public.ist_lehrer()) and exists (select 1 from public.lehrer_klassen k where k.id = klasse_id and k.lehrer = auth.uid()));

drop policy if exists "Abgaben eigener Tests lesen" on public.lehrer_abgaben;
create policy "Abgaben eigener Tests lesen" on public.lehrer_abgaben for select to authenticated
  using (lehrer = auth.uid() and (select public.ist_lehrer()));

drop policy if exists "Abgaben eigener Tests loeschen" on public.lehrer_abgaben;
create policy "Abgaben eigener Tests loeschen" on public.lehrer_abgaben for delete to authenticated
  using (lehrer = auth.uid() and (select public.ist_lehrer()));

-- ---------- Hilfsfunktion: Code und PIN prüfen (nur intern) ----------
create or replace function public.lehrer_pruefen(p_code text, p_pin text, out t public.lehrer_tests, out s public.lehrer_schueler, out fehler text)
language plpgsql security definer set search_path = public as $$
declare v_code text := upper(trim(coalesce(p_code, '')));
        v_pin  text := trim(coalesce(p_pin, ''));
begin
  fehler := null;
  if v_code !~ '^[A-Z0-9]{6}$' then fehler := 'code'; return; end if;
  -- Sperren zählen pro Aufrufer (Konto oder gehashte IP), siehe bremse in schema.sql:
  --   20 falsche PINs für diesen Code oder 40 Fehlversuche insgesamt (auch falsche Codes) in 10 Minuten.
  --   Für alle zusammen erst ab 200 falschen PINs für diesen Code (verteiltes Durchprobieren).
  if public.bremse_anzahl('pin:' || v_code, interval '10 minutes') >= 20
     or public.bremse_anzahl('pin', interval '10 minutes') >= 40
     or public.bremse_anzahl('pin:' || v_code, interval '10 minutes', true) >= 200 then
    fehler := 'gesperrt'; return;
  end if;
  select * into t from public.lehrer_tests x where x.code = v_code;
  if not found then perform public.bremse_merken('pin'); fehler := 'code'; return; end if;
  select * into s from public.lehrer_schueler y where y.klasse_id = t.klasse_id and y.pin = v_pin;
  if not found then
    perform public.bremse_merken('pin');
    perform public.bremse_merken('pin:' || v_code);
    fehler := 'pin'; return;
  end if;
  if not t.aktiv then fehler := 'geschlossen'; return; end if;
end $$;
revoke all on function public.lehrer_pruefen(text, text) from public, anon, authenticated;

-- ---------- Für Kinder: Test laden (ohne Lösungen) ----------
create or replace function public.test_laden(test_code text, pin text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r record;
begin
  select * into r from public.lehrer_pruefen(test_code, pin);
  if r.fehler is not null then return jsonb_build_object('fehler', r.fehler); end if;
  return jsonb_build_object(
    'test', jsonb_build_object(
      'code', (r.t).code, 'titel', (r.t).titel, 'schuljahr', (r.t).schuljahr,
      'fragen', (select coalesce(jsonb_agg(jsonb_build_object('q', f->'q', 'o', f->'o', 'nr', f->'nr', 't', f->'t', 'l', f->'l') order by i), '[]'::jsonb)
                 from jsonb_array_elements((r.t).fragen) with ordinality as x(f, i))),
    'kind', jsonb_build_object('id', (r.s).id, 'name', (r.s).name),
    'schon', exists (select 1 from public.lehrer_abgaben a where a.test_code = (r.t).code and a.schueler_id = (r.s).id));
end $$;
grant execute on function public.test_laden(text, text) to anon, authenticated;

-- ---------- Für Kinder: Abgabe einreichen, auf dem Server auswerten ----------
create or replace function public.abgabe_einreichen(test_code text, pin text, antworten jsonb, dauer_ms integer default 0)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r record; n int; i int; wahl jsonb; richtig int; punkte int := 0; note numeric; saubere jsonb := '[]'::jsonb;
begin
  select * into r from public.lehrer_pruefen(test_code, pin);
  if r.fehler is not null then return jsonb_build_object('fehler', r.fehler); end if;
  if exists (select 1 from public.lehrer_abgaben a where a.test_code = (r.t).code and a.schueler_id = (r.s).id) then
    return jsonb_build_object('fehler', 'schon');
  end if;
  if antworten is null or jsonb_typeof(antworten) <> 'array' then return jsonb_build_object('fehler', 'daten'); end if;
  n := jsonb_array_length((r.t).fragen);
  for i in 0 .. n - 1 loop
    wahl := antworten -> i;
    richtig := ((r.t).fragen -> i ->> 'r')::int;
    if wahl is not null and jsonb_typeof(wahl) = 'number' and (wahl::text)::int between 0 and 3 then
      saubere := saubere || jsonb_build_array((wahl::text)::int);
      if (wahl::text)::int = richtig then punkte := punkte + 1; end if;
    else
      saubere := saubere || jsonb_build_array(null::int);
    end if;
  end loop;
  note := round((5.0 * punkte / greatest(n, 1) + 1) * 2) / 2;
  insert into public.lehrer_abgaben (test_code, schueler_id, lehrer, name, antworten, punkte, max, note, dauer_ms)
  values ((r.t).code, (r.s).id, (r.t).lehrer, (r.s).name, saubere, punkte, n, note, least(greatest(coalesce(dauer_ms, 0), 0), 86400000));
  return jsonb_build_object('punkte', punkte, 'max', n, 'note', note::numeric(2,1),
    'loesung', (select jsonb_agg(jsonb_build_object('r', (f->>'r')::int, 'e', coalesce(f->>'e', '')) order by i2)
                from jsonb_array_elements((r.t).fragen) with ordinality as x(f, i2)));
end $$;
grant execute on function public.abgabe_einreichen(text, text, jsonb, integer) to anon, authenticated;

-- ================================================================
-- supabase/admin.sql
-- ================================================================
-- easyplay: Adminbereich (Benutzerverwaltung, Statistik, Kommentare)
-- Im Supabase SQL Editor ausführen, NACH schema.sql (und lehrer.sql, falls genutzt). Darf mehrmals laufen.
-- Danach dich selbst als Admin eintragen (ganz unten).
--
-- Rolle Lehrperson (Oktober 2026): Sie steht in auth.users.raw_app_meta_data (Feld rolle), das kann die Person
-- nicht selbst ändern. Gesetzt wird sie nur über admin_lehrer_setzen oder admin_benutzer_rolle.
-- rolle = 'lehrperson' in raw_user_meta_data (setzt die Lehrer-Registrierung selbst) gilt nur noch als Antrag.

-- ---------- Admins ----------
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  seit timestamptz not null default now()
);
alter table public.admins enable row level security;  -- keine Policy: nur über Funktionen

create or replace function public.ist_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
revoke all on function public.ist_admin() from public;
grant execute on function public.ist_admin() to authenticated;

-- ---------- Anonyme Besucherstatistik ----------
-- Gespeichert werden nur Tageszähler: Bereich der Seite, Gerätetyp, Herkunftsseite.
-- Besucher werden über einen täglich wechselnden Hash gezählt, die IP-Adresse wird nie gespeichert.
create table if not exists public.statistik_aufrufe (
  tag      date not null,
  bereich  text not null,
  geraet   text not null,
  herkunft text not null default '',
  n        integer not null default 0,
  primary key (tag, bereich, geraet, herkunft)
);
create table if not exists public.statistik_besucher (
  tag  date not null,
  wer  text not null,
  n    integer not null default 0,
  primary key (tag, wer)
);
alter table public.statistik_aufrufe enable row level security;
alter table public.statistik_besucher enable row level security;

create or replace function public.aufruf_zaehlen(p_bereich text, p_geraet text, p_herkunft text default '')
returns void language plpgsql security definer set search_path = public as $$
declare v_wer text := md5('easyplay-tag|' || current_date::text || '|' || public.aufrufer());
        v_n integer;
begin
  p_bereich := left(regexp_replace(lower(coalesce(p_bereich, '')), '[^a-z0-9_-]', '', 'g'), 30);
  if p_bereich = '' then p_bereich := 'start'; end if;
  if coalesce(p_geraet, '') not in ('handy', 'tablet', 'computer') then p_geraet := 'computer'; end if;
  p_herkunft := left(regexp_replace(lower(coalesce(p_herkunft, '')), '[^a-z0-9.-]', '', 'g'), 60);
  insert into public.statistik_besucher (tag, wer, n) values (current_date, v_wer, 1)
  on conflict (tag, wer) do update set n = public.statistik_besucher.n + 1
  returning n into v_n;
  if v_n > 500 then return; end if;  -- Bremse gegen künstliches Hochzählen
  insert into public.statistik_aufrufe (tag, bereich, geraet, herkunft, n) values (current_date, p_bereich, p_geraet, p_herkunft, 1)
  on conflict (tag, bereich, geraet, herkunft) do update set n = public.statistik_aufrufe.n + 1;
end $$;
revoke all on function public.aufruf_zaehlen(text, text, text) from public;
grant execute on function public.aufruf_zaehlen(text, text, text) to anon, authenticated;

-- Statistik älter als 2 Jahre löschen (beim Abruf durch den Admin)
create or replace function public.admin_statistik(p_tage integer default 30) returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare r jsonb := '{}'::jsonb; ab date := current_date - greatest(1, least(coalesce(p_tage, 30), 730)) + 1;
begin
  if not public.ist_admin() then raise exception 'nur fuer Admins'; end if;
  delete from public.statistik_aufrufe where tag < current_date - 730;
  delete from public.statistik_besucher where tag < current_date - 730;
  r := r || jsonb_build_object(
    'aufrufe_tage', coalesce((select jsonb_agg(jsonb_build_object('tag', tag, 'n', n) order by tag) from (select tag, sum(n) n from statistik_aufrufe where tag >= ab group by tag) t), '[]'),
    'besucher_tage', coalesce((select jsonb_agg(jsonb_build_object('tag', tag, 'n', n) order by tag) from (select tag, count(*) n from statistik_besucher where tag >= ab group by tag) t), '[]'),
    'bereiche', coalesce((select jsonb_agg(jsonb_build_object('k', bereich, 'n', n) order by n desc) from (select bereich, sum(n) n from statistik_aufrufe where tag >= ab group by bereich) t), '[]'),
    'geraete', coalesce((select jsonb_agg(jsonb_build_object('k', geraet, 'n', n) order by n desc) from (select geraet, sum(n) n from statistik_aufrufe where tag >= ab group by geraet) t), '[]'),
    'herkunft', coalesce((select jsonb_agg(jsonb_build_object('k', herkunft, 'n', n) order by n desc) from (select herkunft, sum(n) n from statistik_aufrufe where tag >= ab and herkunft <> '' group by herkunft order by 2 desc limit 20) t), '[]'),
    'benutzer', jsonb_build_object(
      'total', (select count(*) from auth.users),
      'neu_7', (select count(*) from auth.users where created_at > now() - interval '7 days'),
      'neu_30', (select count(*) from auth.users where created_at > now() - interval '30 days'),
      'aktiv_7', (select count(*) from auth.users where last_sign_in_at > now() - interval '7 days'),
      'aktiv_30', (select count(*) from auth.users where last_sign_in_at > now() - interval '30 days'),
      'unbestaetigt', (select count(*) from auth.users where email_confirmed_at is null),
      'gesperrt', (select count(*) from auth.users where banned_until > now()),
      'admins', (select count(*) from public.admins),
      'lehrpersonen', (select count(*) from auth.users where raw_app_meta_data->>'rolle' = 'lehrperson'),
      'lehrer_antraege', (select count(*) from auth.users where raw_user_meta_data->>'rolle' = 'lehrperson'
                                                          and coalesce(raw_app_meta_data->>'rolle', '') <> 'lehrperson'),
      'neu_tage', coalesce((select jsonb_agg(jsonb_build_object('tag', tag, 'n', n) order by tag) from (select created_at::date tag, count(*) n from auth.users where created_at::date >= ab group by 1) t), '[]')
    )
  );
  if to_regclass('public.kommentare') is not null then
    r := r || jsonb_build_object('kommentare', (select jsonb_build_object('total', count(*), 'gemeldet', count(*) filter (where gemeldet > 0), 'ausgeblendet', count(*) filter (where gemeldet >= 3), 'neu_7', count(*) filter (where erstellt > now() - interval '7 days')) from public.kommentare));
  end if;
  if to_regclass('public.likes') is not null then
    r := r || jsonb_build_object('likes', (select coalesce(sum(n), 0) from public.likes));
  end if;
  if to_regclass('public.lehrer_tests') is not null then
    r := r || jsonb_build_object('lehrer', jsonb_build_object(
      'klassen', (select count(*) from public.lehrer_klassen),
      'kinder', (select count(*) from public.lehrer_schueler),
      'tests', (select count(*) from public.lehrer_tests),
      'abgaben', (select count(*) from public.lehrer_abgaben),
      'abgaben_7', (select count(*) from public.lehrer_abgaben where abgegeben > now() - interval '7 days')));
  end if;
  return r;
end $$;
revoke all on function public.admin_statistik(integer) from public;
grant execute on function public.admin_statistik(integer) to authenticated;

-- ---------- Benutzerverwaltung ----------
-- rolle: admin, lehrperson (freigegeben) oder kind. antrag: hat sich als Lehrperson registriert, ist aber noch nicht freigegeben.
-- Neue Spalte antrag: die alte Form muss zuerst weg, weil sich die Rückgabe ändert.
drop function if exists public.admin_benutzer();
create or replace function public.admin_benutzer()
returns table (id uuid, email text, erstellt timestamptz, zuletzt timestamptz, bestaetigt boolean,
               gesperrt_bis timestamptz, rolle text, meta jsonb, anbieter text, antrag boolean)
language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.ist_admin() then raise exception 'nur fuer Admins'; end if;
  return query
    select u.id, u.email::text, u.created_at, u.last_sign_in_at, u.email_confirmed_at is not null,
           u.banned_until,
           case when a.user_id is not null then 'admin' when u.raw_app_meta_data->>'rolle' = 'lehrperson' then 'lehrperson' else 'kind' end,
           coalesce(u.raw_user_meta_data, '{}'::jsonb) - 'pw' - 'password',
           coalesce(u.raw_app_meta_data->>'provider', 'email'),
           coalesce(u.raw_user_meta_data->>'rolle' = 'lehrperson' and coalesce(u.raw_app_meta_data->>'rolle', '') <> 'lehrperson', false)
    from auth.users u left join public.admins a on a.user_id = u.id
    order by u.created_at desc;
end $$;
revoke all on function public.admin_benutzer() from public;
grant execute on function public.admin_benutzer() to authenticated;

create or replace function public.admin_benutzer_sperren(p_id uuid, p_tage integer) returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.ist_admin() then raise exception 'nur fuer Admins'; end if;
  if p_id = auth.uid() then raise exception 'du kannst dich nicht selbst sperren'; end if;
  update auth.users set banned_until = case when coalesce(p_tage, 0) > 0 then now() + make_interval(days => least(p_tage, 36500)) else null end
  where id = p_id;
  if coalesce(p_tage, 0) > 0 then
    -- sofort abmelden: Sitzungen und Erneuerungs-Token löschen. Ein schon ausgegebenes Zugangs-Token gilt
    -- noch bis zu seinem Ablauf (Standard 1 Stunde), darum prüfen Kommentare und ist_lehrer() die Sperre zusätzlich.
    delete from auth.sessions where user_id = p_id;
    delete from auth.refresh_tokens where user_id = p_id::text;
  end if;
end $$;
revoke all on function public.admin_benutzer_sperren(uuid, integer) from public;
grant execute on function public.admin_benutzer_sperren(uuid, integer) to authenticated;

-- Lehrperson freigeben (p_an = true) oder Freigabe entziehen (p_an = false, löscht auch den Antrag).
-- Die Rolle steht in raw_app_meta_data, die Person sieht sie nach der nächsten Token-Erneuerung auch in
-- session.user.app_metadata.rolle. Auf dem Server gilt sie sofort (ist_lehrer() liest auth.users).
create or replace function public.admin_lehrer_setzen(p_id uuid, p_an boolean) returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.ist_admin() then raise exception 'nur fuer Admins'; end if;
  if p_id is null then raise exception 'ungueltig'; end if;
  if coalesce(p_an, false) then
    update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"rolle":"lehrperson"}'::jsonb
    where id = p_id;
  else
    update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) - 'rolle',
                          raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) - 'rolle'
    where id = p_id;
  end if;
  if not found then raise exception 'Konto nicht gefunden'; end if;
end $$;
revoke all on function public.admin_lehrer_setzen(uuid, boolean) from public, anon;
grant execute on function public.admin_lehrer_setzen(uuid, boolean) to authenticated;

create or replace function public.admin_benutzer_rolle(p_id uuid, p_rolle text) returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.ist_admin() then raise exception 'nur fuer Admins'; end if;
  if p_rolle not in ('kind', 'lehrperson', 'admin') then raise exception 'ungueltige Rolle'; end if;
  if p_id = auth.uid() and p_rolle <> 'admin' then raise exception 'du kannst dir die Admin-Rolle nicht selbst wegnehmen'; end if;
  if p_rolle = 'admin' then
    insert into public.admins (user_id) values (p_id) on conflict do nothing;
  else
    delete from public.admins where user_id = p_id;
    perform public.admin_lehrer_setzen(p_id, p_rolle = 'lehrperson');
  end if;
end $$;
revoke all on function public.admin_benutzer_rolle(uuid, text) from public;
grant execute on function public.admin_benutzer_rolle(uuid, text) to authenticated;

create or replace function public.admin_benutzer_profil(p_id uuid, p_vorname text, p_nachname text, p_stufe integer) returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.ist_admin() then raise exception 'nur fuer Admins'; end if;
  update auth.users set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
    || jsonb_build_object('vorname', left(coalesce(p_vorname, ''), 40), 'nachname', left(coalesce(p_nachname, ''), 40),
                          'stufe', greatest(1, least(coalesce(p_stufe, 1), 3)))
  where id = p_id;
end $$;
revoke all on function public.admin_benutzer_profil(uuid, text, text, integer) from public;
grant execute on function public.admin_benutzer_profil(uuid, text, text, integer) to authenticated;

create or replace function public.admin_benutzer_loeschen(p_id uuid) returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.ist_admin() then raise exception 'nur fuer Admins'; end if;
  if p_id = auth.uid() then raise exception 'du kannst dich nicht selbst loeschen'; end if;
  if to_regclass('public.kommentare') is not null then
    execute 'delete from public.kommentare where wer = $1' using p_id;
  end if;
  delete from auth.users where id = p_id;
end $$;
revoke all on function public.admin_benutzer_loeschen(uuid) from public;
grant execute on function public.admin_benutzer_loeschen(uuid) to authenticated;

-- ---------- Kommentare moderieren ----------
create or replace function public.admin_kommentare(p_nur_gemeldet boolean default true, p_anzahl integer default 200)
returns table (id bigint, qeel text, name text, text text, gemeldet integer, erstellt timestamptz, wer uuid)
language plpgsql security definer set search_path = public as $$
begin
  if not public.ist_admin() then raise exception 'nur fuer Admins'; end if;
  return query select k.id, k.qeel, k.name, k.text, k.gemeldet, k.erstellt, k.wer from public.kommentare k
    where (not p_nur_gemeldet or k.gemeldet > 0) order by k.gemeldet desc, k.erstellt desc limit least(coalesce(p_anzahl, 200), 1000);
end $$;
revoke all on function public.admin_kommentare(boolean, integer) from public;
grant execute on function public.admin_kommentare(boolean, integer) to authenticated;

create or replace function public.admin_kommentar(p_id bigint, p_aktion text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.ist_admin() then raise exception 'nur fuer Admins'; end if;
  if p_aktion = 'loeschen' then
    delete from public.kommentare where id = p_id;
  elsif p_aktion = 'freigeben' then
    update public.kommentare set gemeldet = 0 where id = p_id;
    delete from public.kommentar_meldungen where kommentar = p_id;
  else
    raise exception 'unbekannte Aktion';
  end if;
end $$;
revoke all on function public.admin_kommentar(bigint, text) from public;
grant execute on function public.admin_kommentar(bigint, text) to authenticated;

-- ---------- Prüfen, ob aufrufer() die richtige IP erwischt ----------
-- Gibt die Kopfzeilen zurück, aus denen aufrufer() (schema.sql) die IP liest. Einmal nach dem Einschalten
-- in der Verwaltung oder im Browser (als Admin angemeldet) aufrufen: Der letzte Eintrag von x-forwarded-for
-- muss die eigene öffentliche IP sein (vergleichen mit einer Seite wie «Wie ist meine IP»). Steht dort die
-- Adresse eines Proxys, teilen sich alle Besucher ohne Konto eine Kennung, dann aufrufer() anpassen.
create or replace function public.admin_ip_pruefen() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare h json := nullif(current_setting('request.headers', true), '')::json;
begin
  if not public.ist_admin() then raise exception 'nur fuer Admins'; end if;
  return jsonb_build_object(
    'x_forwarded_for', h->>'x-forwarded-for',
    'x_real_ip', h->>'x-real-ip',
    'cf_connecting_ip', h->>'cf-connecting-ip',
    'genutzt', btrim(reverse(split_part(reverse(coalesce(h->>'x-forwarded-for', '')), ',', 1))));
end $$;
revoke all on function public.admin_ip_pruefen() from public, anon;
grant execute on function public.admin_ip_pruefen() to authenticated;

-- ---------- Dich selbst als Admin eintragen ----------
-- Lehrpersonen aus der Zeit vor der Freigabe übernehmen: NUR nach Kontrolle der Liste, z. B.
-- select id, email from auth.users where raw_user_meta_data->>'rolle' = 'lehrperson';
-- update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"rolle":"lehrperson"}'::jsonb
--   where email in ('lehrerin@schule.ch');
-- 1. Auf der Website mit deiner E-Mail registrieren und bestätigen.
-- 2. Diese Zeile mit deiner E-Mail-Adresse ausführen:
-- insert into public.admins (user_id) select id from auth.users where email = 'deine@email.ch';

-- ================================================================
-- supabase/lehrer2.sql
-- ================================================================
-- easyplay Lehrerbereich, Erweiterung 2 (Oktober 2026)
-- Offene Fragen (Textantworten, von der Lehrperson korrigiert) und Fehlermeldungen
-- aus Fragendatenbank und Bibliothek.
-- Ausführen im Supabase SQL Editor NACH schema.sql, lehrer.sql und admin.sql.
-- Die Liga zählt nur punkte_auto (lehrer.sql), Korrekturen der Lehrperson an punkte zählen nur für die Note.

-- ---------- Abgaben: Korrektur offener Fragen, halbe Punkte ----------
alter table public.lehrer_abgaben add column if not exists korrektur jsonb not null default '{}'::jsonb;
alter table public.lehrer_abgaben alter column punkte type numeric(6,1);

-- Die Lehrperson darf bei Abgaben ihrer Tests nur Korrektur, Punkte und Note ändern
drop policy if exists "Abgaben eigener Tests korrigieren" on public.lehrer_abgaben;
create policy "Abgaben eigener Tests korrigieren" on public.lehrer_abgaben for update to authenticated
  using (lehrer = auth.uid() and (select public.ist_lehrer())) with check (lehrer = auth.uid() and (select public.ist_lehrer()));
revoke update on public.lehrer_abgaben from authenticated;
grant update (korrektur, punkte, max, note) on public.lehrer_abgaben to authenticated;

-- ---------- Für Kinder: Test laden (ohne Lösungen), jetzt mit offenen Fragen ----------
create or replace function public.test_laden(test_code text, pin text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r record;
begin
  select * into r from public.lehrer_pruefen(test_code, pin);
  if r.fehler is not null then return jsonb_build_object('fehler', r.fehler); end if;
  return jsonb_build_object(
    'test', jsonb_build_object(
      'code', (r.t).code, 'titel', (r.t).titel, 'schuljahr', (r.t).schuljahr,
      'fragen', (select coalesce(jsonb_agg(
          case when f->>'art' = 'offen'
            then jsonb_build_object('q', f->'q', 'art', 'offen', 'p', coalesce(f->'p', '1'::jsonb), 'z', coalesce(f->'z', '3'::jsonb), 'nr', f->'nr', 't', f->'t', 'l', f->'l')
            else jsonb_build_object('q', f->'q', 'o', f->'o', 'nr', f->'nr', 't', f->'t', 'l', f->'l') end
          order by i), '[]'::jsonb)
        from jsonb_array_elements((r.t).fragen) with ordinality as x(f, i))),
    'kind', jsonb_build_object('id', (r.s).id, 'name', (r.s).name),
    'schon', exists (select 1 from public.lehrer_abgaben a where a.test_code = (r.t).code and a.schueler_id = (r.s).id));
end $$;
grant execute on function public.test_laden(text, text) to anon, authenticated;

-- ---------- Für Kinder: Abgabe einreichen, Auswahlfragen auf dem Server auswerten ----------
-- Offene Fragen: Text wird gespeichert (höchstens 2000 Zeichen), Punkte gibt die Lehrperson später.
create or replace function public.abgabe_einreichen(test_code text, pin text, antworten jsonb, dauer_ms integer default 0)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r record; n int; i int; f jsonb; wahl jsonb; richtig int; punkte numeric := 0; maxp numeric := 0; p numeric; note numeric; saubere jsonb := '[]'::jsonb;
begin
  select * into r from public.lehrer_pruefen(test_code, pin);
  if r.fehler is not null then return jsonb_build_object('fehler', r.fehler); end if;
  if exists (select 1 from public.lehrer_abgaben a where a.test_code = (r.t).code and a.schueler_id = (r.s).id) then
    return jsonb_build_object('fehler', 'schon');
  end if;
  if antworten is null or jsonb_typeof(antworten) <> 'array' then return jsonb_build_object('fehler', 'daten'); end if;
  n := jsonb_array_length((r.t).fragen);
  for i in 0 .. n - 1 loop
    f := (r.t).fragen -> i;
    wahl := antworten -> i;
    if f->>'art' = 'offen' then
      p := greatest(1, least(20, coalesce((f->>'p')::numeric, 1)));
      maxp := maxp + p;
      if wahl is not null and jsonb_typeof(wahl) = 'string' then
        saubere := saubere || jsonb_build_array(left(wahl #>> '{}', 2000));
      else
        saubere := saubere || jsonb_build_array(null::text);
      end if;
    else
      maxp := maxp + 1;
      richtig := (f->>'r')::int;
      if wahl is not null and jsonb_typeof(wahl) = 'number' and (wahl::text)::int between 0 and 3 then
        saubere := saubere || jsonb_build_array((wahl::text)::int);
        if (wahl::text)::int = richtig then punkte := punkte + 1; end if;
      else
        saubere := saubere || jsonb_build_array(null::int);
      end if;
    end if;
  end loop;
  note := least(6, greatest(1, round((5.0 * punkte / greatest(maxp, 1) + 1) * 2) / 2));
  insert into public.lehrer_abgaben (test_code, schueler_id, lehrer, name, antworten, korrektur, punkte, max, note, dauer_ms)
  values ((r.t).code, (r.s).id, (r.t).lehrer, (r.s).name, saubere, '{}'::jsonb, punkte, ceil(maxp)::int, note, least(greatest(coalesce(dauer_ms, 0), 0), 86400000));
  return jsonb_build_object('punkte', punkte, 'max', maxp, 'note', note::numeric(2,1),
    'loesung', (select jsonb_agg(
        case when x.f->>'art' = 'offen'
          then jsonb_build_object('offen', true, 'm', coalesce(x.f->>'m', ''), 'e', coalesce(x.f->>'e', ''), 'p', coalesce((x.f->>'p')::numeric, 1))
          else jsonb_build_object('r', (x.f->>'r')::int, 'e', coalesce(x.f->>'e', '')) end
        order by i2)
      from jsonb_array_elements((r.t).fragen) with ordinality as x(f, i2)));
end $$;
grant execute on function public.abgabe_einreichen(text, text, jsonb, integer) to anon, authenticated;

-- ---------- Fehlermeldungen aus Fragendatenbank und Bibliothek ----------
create table if not exists public.fehlermeldungen (
  id        bigint generated always as identity primary key,
  art       text not null check (art in ('frage', 'bib')),
  ref       text not null default '',
  titel     text not null default '',
  grund     text not null default '',
  text      text not null default '',
  von       uuid references auth.users(id) on delete set null,
  status    text not null default 'offen' check (status in ('offen', 'erledigt', 'abgelehnt')),
  erstellt  timestamptz not null default now()
);
alter table public.fehlermeldungen enable row level security;  -- keine Policy: nur über die Funktionen

create or replace function public.fehler_melden(p_art text, p_ref text, p_titel text, p_grund text, p_text text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return false; end if;   -- nur angemeldete Lehrpersonen
  if p_art not in ('frage', 'bib') then return false; end if;
  if public.bremse('fehler_melden', 60, interval '1 hour') then return false; end if;
  insert into public.fehlermeldungen (art, ref, titel, grund, text, von)
  values (p_art, left(coalesce(p_ref, ''), 100), left(coalesce(p_titel, ''), 300), left(coalesce(p_grund, ''), 100), left(coalesce(p_text, ''), 2000), auth.uid());
  return true;
end $$;
revoke all on function public.fehler_melden(text, text, text, text, text) from public, anon;
grant execute on function public.fehler_melden(text, text, text, text, text) to authenticated;

-- Für die Verwaltung (admin/index.html, Bereich «Fehlermeldungen»)
create or replace function public.admin_fehlermeldungen(p_status text default null)
returns setof public.fehlermeldungen language plpgsql security definer set search_path = public as $$
begin
  if not public.ist_admin() then raise exception 'kein Zugriff'; end if;
  return query select * from public.fehlermeldungen where p_status is null or status = p_status order by erstellt desc limit 1000;
end $$;
revoke all on function public.admin_fehlermeldungen(text) from public, anon;
grant execute on function public.admin_fehlermeldungen(text) to authenticated;

create or replace function public.admin_fehlermeldung_status(p_id bigint, p_status text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.ist_admin() then raise exception 'kein Zugriff'; end if;
  if p_status = 'loeschen' then delete from public.fehlermeldungen where id = p_id; return; end if;
  update public.fehlermeldungen set status = p_status where id = p_id;
end $$;
revoke all on function public.admin_fehlermeldung_status(bigint, text) from public, anon;
grant execute on function public.admin_fehlermeldung_status(bigint, text) to authenticated;

-- ================================================================
-- supabase/klassenliga.sql
-- ================================================================
-- easyplay Klassen-Liga («Klasse gegen Klasse»), Oktober 2026
-- Lehrpersonen melden ihre Klasse freiwillig mit einem Anzeigenamen (z. B. «5b Solothurn») für die Wochen-Liga an.
-- Ausführen im Supabase SQL Editor NACH schema.sql, lehrer.sql, admin.sql und lehrer2.sql.
-- Das Skript darf mehrfach ausgeführt werden (es überschreibt nur Funktionen und Regeln).
--
-- Punkte einer Klasse pro ISO-Woche (Montag 00:00 bis Sonntag 24:00, Zeitzone Europe/Zurich):
--   Summe der vom Server ausgerechneten Testpunkte (punkte_auto, aus abgabe_einreichen) aller Abgaben der Kinder
--   dieser Klasse in dieser Woche (Auswahlfragen: 1 Punkt pro richtige Antwort). Punkte, die die Lehrperson
--   nachträglich ändert (offene Fragen, Korrekturen), zählen für die Liga nicht, sonst könnte sie die Liga selbst füllen.
--   pro Kind höchstens 150 Punkte pro Woche,
--   geteilt durch die Anzahl der eingetragenen (aktiven) Kinder der Klasse, auf 1 Stelle gerundet.
--   Geteilt wird durch alle eingetragenen Kinder, nicht nur durch die, die mitgemacht haben.
--   So lohnt es sich nicht, schwächere Kinder auszulassen, und kleine und grosse Klassen sind vergleichbar.
--
-- Datenschutz in Kürze:
--   * Öffentlich ist nur ein Aggregat pro Klasse: Anzeigename, Kanton, Zyklus, Punkte pro Kind,
--     Anzahl Kinder und Anzahl aktiver Kinder. Keine Kindernamen, keine PINs, keine einzelnen Resultate.
--   * Eine Klasse braucht mindestens 5 eingetragene Kinder, damit kein Wert auf ein einzelnes Kind zurückgeht.
--   * Anmelden dürfen nur von einem Admin freigegebene Lehrpersonen (ist_lehrer() aus lehrer.sql).
--   * Die Tabelle liga_klassen ist mit Zeilenschutz (RLS) gesperrt. Lesen dürfen Lehrpersonen nur ihre eigenen
--     Anmeldungen; geschrieben wird ausschliesslich über die Funktionen liga_anmelden und liga_abmelden.
--   * Die Rangliste kommt nur über die Funktion liga_rangliste (security definer), die nichts anderes herausgibt.
--   * Kinder (ohne Konto) erfahren ihre Liga-Klasse nur mit gültigem Test-Code und PIN (liga_meine_klasse).

-- ---------- Tabelle ----------
create table if not exists public.liga_klassen (
  klasse_id   uuid primary key references public.lehrer_klassen(id) on delete cascade,
  liga_id     uuid not null unique default gen_random_uuid(),     -- öffentliche Kennung in der Rangliste
  lehrer      uuid not null references auth.users(id) on delete cascade,
  anzeige     text not null check (char_length(anzeige) between 2 and 40),
  kanton      text not null default '' check (kanton = '' or kanton ~ '^[A-Z]{2}$'),
  zyklus      smallint check (zyklus between 1 and 3),
  gesperrt    boolean not null default false,                       -- von der Verwaltung ausgeblendet
  angemeldet  timestamptz not null default now()
);
create index if not exists liga_klassen_lehrer on public.liga_klassen (lehrer);
create index if not exists lehrer_abgaben_abgegeben on public.lehrer_abgaben (abgegeben);

alter table public.liga_klassen enable row level security;
revoke all on public.liga_klassen from anon, authenticated;
grant select on public.liga_klassen to authenticated;

drop policy if exists "Eigene Liga-Anmeldungen lesen" on public.liga_klassen;
create policy "Eigene Liga-Anmeldungen lesen" on public.liga_klassen for select to authenticated
  using (lehrer = auth.uid() and (select public.ist_lehrer()));
-- Keine Policy für insert, update, delete: Schreiben nur über die Funktionen unten.

-- ---------- Lehrperson: Klasse anmelden oder Anzeigename/Kanton ändern ----------
create or replace function public.liga_anmelden(p_klasse uuid, p_anzeige text, p_kanton text default '')
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_k public.lehrer_klassen;
        v_l public.liga_klassen;
        v_name text := btrim(regexp_replace(coalesce(p_anzeige, ''), '\s+', ' ', 'g'));
        v_kt text := upper(btrim(coalesce(p_kanton, '')));
        v_n int;
begin
  if auth.uid() is null then return jsonb_build_object('fehler', 'konto'); end if;
  if not public.ist_lehrer() then return jsonb_build_object('fehler', 'lehrperson'); end if;
  if public.bremse('liga_anmelden', 60, interval '1 hour') then return jsonb_build_object('fehler', 'viele'); end if;
  select * into v_k from public.lehrer_klassen x where x.id = p_klasse and x.lehrer = auth.uid();
  if not found then return jsonb_build_object('fehler', 'klasse'); end if;
  if char_length(v_name) < 2 or char_length(v_name) > 40 or v_name ~ '[@<>{}]' or v_name ~* '(https?:|www\.)' then
    return jsonb_build_object('fehler', 'name');
  end if;
  if v_kt <> '' and v_kt <> all (array['ZH','BE','LU','UR','SZ','OW','NW','GL','ZG','FR','SO','BS','BL','SH','AR','AI','SG','GR','AG','TG','TI','VD','VS','NE','GE','JU']) then
    return jsonb_build_object('fehler', 'kanton');
  end if;
  select count(*) into v_n from public.lehrer_schueler s where s.klasse_id = v_k.id;
  if v_n < 5 then return jsonb_build_object('fehler', 'klein', 'kinder', v_n); end if;
  if (select count(*) from public.liga_klassen x where x.lehrer = auth.uid()) >= 30
     and not exists (select 1 from public.liga_klassen x where x.klasse_id = v_k.id) then
    return jsonb_build_object('fehler', 'viele');
  end if;
  insert into public.liga_klassen as l (klasse_id, lehrer, anzeige, kanton, zyklus)
  values (v_k.id, auth.uid(), v_name, v_kt, v_k.zyklus)
  on conflict (klasse_id) do update set anzeige = excluded.anzeige, kanton = excluded.kanton, zyklus = excluded.zyklus
    where l.lehrer = auth.uid()
  returning * into v_l;
  return jsonb_build_object('liga_id', v_l.liga_id, 'anzeige', v_l.anzeige, 'kanton', v_l.kanton, 'gesperrt', v_l.gesperrt);
end $$;
revoke all on function public.liga_anmelden(uuid, text, text) from public, anon;
grant execute on function public.liga_anmelden(uuid, text, text) to authenticated;

-- ---------- Lehrperson: Klasse abmelden ----------
-- Eine von der Verwaltung ausgeblendete Anmeldung bleibt bestehen (sonst wäre die Sperre mit Ab- und Anmelden umgangen).
create or replace function public.liga_abmelden(p_klasse uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return false; end if;
  delete from public.liga_klassen x where x.klasse_id = p_klasse and x.lehrer = auth.uid() and not x.gesperrt;
  return found;
end $$;
revoke all on function public.liga_abmelden(uuid) from public, anon;
grant execute on function public.liga_abmelden(uuid) to authenticated;

-- ---------- Für alle: Rangliste einer Woche (nur Aggregate) ----------
-- p_woche: ISO-Woche als 'JJJJ-WW' (z. B. '2026-42'), leer = aktuelle Woche. p_kanton: 'SO' usw., leer = alle.
create or replace function public.liga_rangliste(p_woche text default null, p_kanton text default null)
returns table (platz int, liga_id uuid, anzeige text, kanton text, zyklus smallint, punkte numeric, kinder int, aktiv int, woche text)
language sql stable security definer set search_path = public as $$
  with w as (
    select x.woche,
           (to_date(x.woche, 'IYYY-IW')::timestamp at time zone 'Europe/Zurich') as von,
           ((to_date(x.woche, 'IYYY-IW') + 7)::timestamp at time zone 'Europe/Zurich') as bis
    from (select case when coalesce(p_woche, '') ~ '^[0-9]{4}-(0[1-9]|[1-4][0-9]|5[0-3])$' then p_woche
                      else to_char(now() at time zone 'Europe/Zurich', 'IYYY-IW') end as woche) x
  ),
  kl as (
    select l.klasse_id, l.liga_id, l.anzeige, l.kanton, l.zyklus,
           (select count(*)::int from public.lehrer_schueler s where s.klasse_id = l.klasse_id) as kinder
    from public.liga_klassen l
    where not l.gesperrt
      and (coalesce(p_kanton, '') = '' or l.kanton = upper(p_kanton))
  ),
  pro_kind as (
    select s.klasse_id, a.schueler_id, least(sum(coalesce(a.punkte_auto, 0)), 150) as p
    from public.lehrer_abgaben a
    join public.lehrer_schueler s on s.id = a.schueler_id
    join public.lehrer_tests t on t.code = a.test_code and t.klasse_id = s.klasse_id
    cross join w
    where a.abgegeben >= w.von and a.abgegeben < w.bis
      and s.klasse_id in (select kl.klasse_id from kl)
    group by s.klasse_id, a.schueler_id
  ),
  summe as (
    select pk.klasse_id, sum(pk.p) as p, count(*)::int as aktiv from pro_kind pk group by pk.klasse_id
  ),
  wert as (
    select kl.*, su.aktiv, round(su.p / greatest(kl.kinder, 1), 1) as pkt
    from kl join summe su on su.klasse_id = kl.klasse_id
    where kl.kinder >= 5 and su.p > 0
  )
  select (rank() over (order by wert.pkt desc))::int, wert.liga_id, wert.anzeige, wert.kanton, wert.zyklus,
         wert.pkt, wert.kinder, wert.aktiv, (select w.woche from w)
  from wert
  order by wert.pkt desc, wert.anzeige
  limit 500;
$$;
revoke all on function public.liga_rangliste(text, text) from public;
grant execute on function public.liga_rangliste(text, text) to anon, authenticated;

-- ---------- Für Kinder (ohne Konto): Ist meine Klasse in der Liga? Nur mit Test-Code und PIN ----------
create or replace function public.liga_meine_klasse(test_code text, pin text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r record; v_l public.liga_klassen;
begin
  select * into r from public.lehrer_pruefen(test_code, pin);
  if r.fehler is not null and r.fehler <> 'geschlossen' then return jsonb_build_object('fehler', r.fehler); end if;
  select * into v_l from public.liga_klassen x where x.klasse_id = (r.t).klasse_id and not x.gesperrt;
  if not found then return jsonb_build_object('liga', false); end if;
  return jsonb_build_object('liga', true, 'liga_id', v_l.liga_id, 'anzeige', v_l.anzeige, 'kanton', v_l.kanton);
end $$;
revoke all on function public.liga_meine_klasse(text, text) from public;
grant execute on function public.liga_meine_klasse(text, text) to anon, authenticated;

-- ---------- Für die Verwaltung: unpassende Anzeigenamen ausblenden ----------
create or replace function public.admin_liga_klassen()
returns setof public.liga_klassen language plpgsql security definer set search_path = public as $$
begin
  if not public.ist_admin() then raise exception 'kein Zugriff'; end if;
  return query select * from public.liga_klassen order by angemeldet desc limit 2000;
end $$;
revoke all on function public.admin_liga_klassen() from public, anon;
grant execute on function public.admin_liga_klassen() to authenticated;

create or replace function public.admin_liga_sperren(p_liga uuid, p_gesperrt boolean default true)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.ist_admin() then raise exception 'kein Zugriff'; end if;
  update public.liga_klassen set gesperrt = coalesce(p_gesperrt, true) where liga_id = p_liga;
end $$;
revoke all on function public.admin_liga_sperren(uuid, boolean) from public, anon;
grant execute on function public.admin_liga_sperren(uuid, boolean) to authenticated;

-- ================================================================
-- supabase/live.sql
-- ================================================================
-- easyplay: Live-Quiz (Zeiten siehe LIVE.slots in startseite.js), Punkte aller Kinder je Team zusammenzählen.
-- Im SQL Editor von Supabase ausführen, NACH schema.sql (braucht aufrufer und bremse). Darf mehrmals laufen.
--
-- Sicherheit:
--   * Niemand schreibt oder liest die Tabelle direkt. Gemeldet wird nur über live_punkte, gelesen nur über live_stand
--     (Summen je Team). So ist keine Konto-ID öffentlich.
--   * Mit Konto zählt pro Runde nur ein Ergebnis (eindeutiger Index). Ohne Konto zählen pro IP und Runde höchstens
--     40 Ergebnisse (eine ganze Schulklasse hinter einem Schulnetz soll mitspielen können).
--   * Punkte werden auf dem Server begrenzt: höchstens 20 richtige, höchstens 150 Punkte pro richtige Antwort.

create table if not exists public.live_runden (
  id bigserial primary key,
  key text not null,                 -- z. B. 2026-10-13-12 (Datum und Stunde)
  team text not null check (team in ('lumi','milo')),
  punkte int not null default 0 check (punkte between 0 and 5000),
  richtig int not null default 0 check (richtig between 0 and 50),
  user_id uuid default auth.uid(),
  erstellt timestamptz not null default now()
);
create index if not exists live_runden_key on public.live_runden(key);
alter table public.live_runden enable row level security;

-- Keine direkten Rechte mehr (früher: Einfügen und Lesen für alle)
drop policy if exists live_runden_einfuegen on public.live_runden;
drop policy if exists live_runden_lesen on public.live_runden;
revoke all on public.live_runden from anon, authenticated;

-- Pro Konto und Runde nur ein Ergebnis (Doppelte aus der Zeit vor dieser Regel zuerst entfernen)
delete from public.live_runden a using public.live_runden b
  where a.key = b.key and a.user_id = b.user_id and a.user_id is not null and a.id > b.id;
create unique index if not exists live_runden_key_konto on public.live_runden(key, user_id) where user_id is not null;

-- Stand einer Runde: Punkte je Team und Anzahl Kinder.
create or replace function public.live_stand(p_key text)
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'lumi', coalesce(sum(punkte) filter (where team = 'lumi'), 0),
    'milo', coalesce(sum(punkte) filter (where team = 'milo'), 0),
    'spieler', count(*))
  from public.live_runden where key = p_key;
$$;

-- Ein Ergebnis melden. Gibt immer den aktuellen Stand zurück, auch wenn das Ergebnis nicht gezählt wurde.
create or replace function public.live_punkte(p_key text, p_team text, p_punkte int, p_richtig int)
returns json language plpgsql security definer set search_path = public as $$
declare v_tag date; v_heute date := (now() at time zone 'Europe/Zurich')::date; v_richtig int; v_punkte int;
begin
  if p_key is null or p_key !~ '^\d{4}-\d{2}-\d{2}-\d{2}$' then raise exception 'ungültiger Schlüssel'; end if;
  begin
    v_tag := to_date(left(p_key, 10), 'YYYY-MM-DD');
  exception when others then raise exception 'ungültiger Schlüssel';
  end;
  -- nur Runden von gestern, heute oder morgen (Zeitzonen der Geräte), Stunde 0 bis 23
  if v_tag not between v_heute - 1 and v_heute + 1 or right(p_key, 2)::int > 23 then
    return public.live_stand(p_key);
  end if;
  if coalesce(p_team, '') not in ('lumi', 'milo') then return public.live_stand(p_key); end if;

  v_richtig := least(20, greatest(0, coalesce(p_richtig, 0)));
  v_punkte := least(3000, greatest(0, coalesce(p_punkte, 0)), v_richtig * 150);

  if auth.uid() is not null then
    if public.bremse('live', 20, interval '1 hour') then return public.live_stand(p_key); end if;
    insert into public.live_runden(key, team, punkte, richtig, user_id)
    values (p_key, p_team, v_punkte, v_richtig, auth.uid())
    on conflict (key, user_id) where user_id is not null do nothing;
  else
    if public.bremse('live:' || p_key, 40, interval '1 day') then return public.live_stand(p_key); end if;
    insert into public.live_runden(key, team, punkte, richtig, user_id)
    values (p_key, p_team, v_punkte, v_richtig, null);
  end if;
  return public.live_stand(p_key);
end $$;

revoke all on function public.live_punkte(text, text, int, int) from public;
revoke all on function public.live_stand(text) from public;
grant execute on function public.live_punkte(text, text, int, int) to anon, authenticated;
grant execute on function public.live_stand(text) to anon, authenticated;

-- ================================================================
-- supabase/regionen.sql
-- ================================================================
-- easyplay · Regionen-Duell (Deutschschweiz, Westschweiz, Tessin)
-- Im Supabase SQL-Editor ausführen, NACH schema.sql (braucht bremse) und admin.sql (braucht ist_admin).
-- Darf mehrmals laufen. Gespeichert werden nur Wochen-Summen pro Region, keine Namen und keine Daten über einzelne Kinder.
--
-- Sicherheit: Buchen nur über region_buchen mit Mengenbremse (mit Konto 30, ohne Konto pro IP 200 Buchungen
-- pro Stunde) und höchstens 150 Punkten pro Frage (höchstens 20 Fragen, also 3000 Punkte pro Duell).
-- Der Verlauf (region_verlauf) ist nur für Admins.

create table if not exists public.region_punkte (
  woche   text   not null,
  region  text   not null check (region in ('ds','ro','ti')),
  punkte  bigint not null default 0,
  spiele  int    not null default 0,
  primary key (woche, region)
);
alter table public.region_punkte enable row level security;
revoke all on public.region_punkte from anon, authenticated;
-- Keine Policies: Zugriff nur über die Funktionen unten.

create or replace function public.region_woche(t timestamptz default now())
returns text language sql stable as $$
  select to_char(t at time zone 'Europe/Zurich', 'IYYY-"W"IW');
$$;

-- Punkte eines Duells buchen. p_fragen: Anzahl Fragen des Duells (3 bis 20), höchstens 150 Punkte pro Frage.
-- Gibt true zurück, wenn gebucht wurde, sonst false (ungültig oder Bremse).
create or replace function public.region_buchen(p_region text, p_punkte int, p_fragen int)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_fragen int := least(20, greatest(1, coalesce(p_fragen, 20)));
        v_punkte int := greatest(0, least(coalesce(p_punkte, 0), 150 * v_fragen, 3000));
begin
  if coalesce(p_region, '') not in ('ds','ro','ti') then return false; end if;
  if public.bremse('region', case when auth.uid() is null then 200 else 30 end, interval '1 hour') then return false; end if;
  insert into public.region_punkte (woche, region, punkte, spiele)
  values (public.region_woche(), p_region, v_punkte, 1)
  on conflict (woche, region) do update
    set punkte = public.region_punkte.punkte + excluded.punkte,
        spiele = public.region_punkte.spiele + 1;
  return true;
end $$;

-- Ältere Form ohne Fragenzahl (für zwischengespeicherte alte Seiten): rechnet mit 20 Fragen.
create or replace function public.region_buchen(p_region text, p_punkte int)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.region_buchen(p_region, p_punkte, 20);
end $$;

-- Stand dieser Woche plus Sieger der Vorwoche (nach Schnitt pro Duell)
create or replace function public.region_stand()
returns table (region text, punkte bigint, spiele int, vorwoche_sieger text)
language sql stable security definer set search_path = public as $$
  with r(region) as (values ('ds'),('ro'),('ti')),
  vor as (
    select v.region from public.region_punkte v
    where v.woche = public.region_woche(now() - interval '7 days') and v.spiele > 0
    order by v.punkte::numeric / v.spiele desc limit 1
  )
  select r.region, coalesce(p.punkte,0), coalesce(p.spiele,0), (select region from vor)
  from r left join public.region_punkte p on p.region = r.region and p.woche = public.region_woche();
$$;

-- Für das Admin-Panel: Verlauf der letzten Wochen (nur Admins)
create or replace function public.region_verlauf(p_wochen int default 8)
returns table (woche text, region text, punkte bigint, spiele int)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.ist_admin() then raise exception 'nur fuer Admins'; end if;
  return query
    select p.woche, p.region, p.punkte, p.spiele from public.region_punkte p
    order by p.woche desc, p.region limit greatest(1, least(coalesce(p_wochen, 8), 52)) * 3;
end $$;

revoke all on function public.region_buchen(text,int,int) from public;
revoke all on function public.region_buchen(text,int) from public;
revoke all on function public.region_stand() from public;
revoke all on function public.region_verlauf(int) from public, anon, authenticated;
grant execute on function public.region_buchen(text,int,int) to anon, authenticated;
grant execute on function public.region_buchen(text,int) to anon, authenticated;
grant execute on function public.region_stand() to anon, authenticated;
grant execute on function public.region_verlauf(int) to authenticated;

-- ================================================================
-- supabase/duell.sql
-- ================================================================
-- easyplay: Online-Duell mit zufälligem Gegner (supabase/duell.sql). Im SQL Editor ausführen, darf mehrmals laufen.
-- NACH schema.sql ausführen (braucht bremse und kontakt_verdacht).
--
-- Sicherheit (Oktober 2026):
--   * Übertragen werden nur Fragen-Kennungen (qid in index.html, kurze Zeichenfolgen aus a-z und 0-9), keine Texte.
--     Der Gast baut die Fragen aus seinen eigenen Fragendaten. So kann niemand einem Kind eigene «Fragen» schicken.
--   * Namen höchstens 30 Zeichen, ohne Kontaktangaben (sonst «Gast»). Team nur lumi, milo oder leer.
--   * Punkte: höchstens 150 pro richtige Antwort, Fortschritt höchstens so viele Fragen wie das Duell hat.
--   * Mengenbremse beim Suchen: mit Konto 40, ohne Konto pro IP 200 Suchen in 10 Minuten.
create table if not exists public.duell_lobby (
  id bigserial primary key,
  host_token text not null, gast_token text,
  host_name text not null, gast_name text,
  host_team text default '', gast_team text default '',
  stufe int not null default 0, cat text not null default 'alle', n int not null default 10,
  list jsonb not null,
  host_i int default 0, host_score int default 0, host_ant text default '', host_fertig boolean default false,
  gast_i int default 0, gast_score int default 0, gast_ant text default '', gast_fertig boolean default false,
  status text not null default 'wartet',       -- wartet | laeuft | weg
  erstellt timestamptz not null default now(), aktiv timestamptz not null default now()
);
create index if not exists duell_lobby_status on public.duell_lobby(status, erstellt);
alter table public.duell_lobby enable row level security;
-- Elo-Wertung (Oktober 2026): Gegner werden nach Stärke gesucht
alter table public.duell_lobby add column if not exists host_elo int not null default 1000;
alter table public.duell_lobby add column if not exists gast_elo int not null default 1000;
-- Kein direkter Zugriff: alles läuft über die Funktionen unten.
revoke all on public.duell_lobby from anon, authenticated;

-- ---------- Hilfsfunktionen (nur intern) ----------
-- Fragenliste: JSON-Array mit 3 bis 20 verschiedenen kurzen Kennungen (a-z, 0-9, höchstens 12 Zeichen)
create or replace function public.duell_liste_ok(p_list jsonb)
returns boolean language plpgsql immutable as $$
begin
  if p_list is null or jsonb_typeof(p_list) <> 'array' then return false; end if;
  if jsonb_array_length(p_list) not between 3 and 20 then return false; end if;
  if exists (select 1 from jsonb_array_elements(p_list) e(x)
             where jsonb_typeof(e.x) <> 'string' or (e.x #>> '{}') !~ '^[0-9a-z]{1,12}$') then
    return false;
  end if;
  return (select count(distinct e.x #>> '{}') from jsonb_array_elements(p_list) e(x)) = jsonb_array_length(p_list);
end $$;
revoke all on function public.duell_liste_ok(jsonb) from public, anon, authenticated;

-- Anzeigename: höchstens 30 Zeichen, ohne Kontaktangaben und ohne spitze Klammern, sonst «Gast»
create or replace function public.duell_name(p_name text)
returns text language plpgsql immutable as $$
declare v text := left(btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g')), 30);
begin
  if v = '' or v ~ '[<>{}]' or public.kontakt_verdacht(v) then return 'Gast'; end if;
  return v;
end $$;
revoke all on function public.duell_name(text) from public, anon, authenticated;

-- Alte Einträge mit Fragentexten (vor dieser Änderung) entfernen
delete from public.duell_lobby where not public.duell_liste_ok(list);

-- Gegner suchen mit Elo: zuerst ähnlich starke Wartende, je länger jemand wartet, desto grösser die Spanne.
create or replace function public.duell_suchen(p_token text, p_name text, p_team text, p_stufe int, p_cat text, p_n int, p_list jsonb, p_elo int)
returns json language plpgsql security definer set search_path = public as $$
declare r public.duell_lobby%rowtype;
        e int := least(3000, greatest(100, coalesce(p_elo, 1000)));
        v_name text := public.duell_name(p_name);
        v_team text := case when p_team in ('lumi', 'milo') then p_team else '' end;
        v_stufe int := least(3, greatest(0, coalesce(p_stufe, 0)));
        v_cat text := left(coalesce(p_cat, 'alle'), 40);
begin
  if p_token is null or p_token !~ '^[0-9a-z]{6,60}$' then raise exception 'ungueltig'; end if;
  if not public.duell_liste_ok(p_list) then raise exception 'ungueltige Fragenliste'; end if;
  if public.bremse('duell', case when auth.uid() is null then 200 else 40 end, interval '10 minutes') then
    raise exception 'zu viele';
  end if;
  delete from public.duell_lobby where erstellt < now() - interval '2 hours';
  select * into r from public.duell_lobby
    where status = 'wartet' and host_token <> p_token and stufe = v_stufe and cat = v_cat and erstellt > now() - interval '60 seconds'
      and abs(host_elo - e) <= 150 + extract(epoch from now() - erstellt) * 15
    order by abs(host_elo - e), erstellt limit 1 for update skip locked;
  if found then
    update public.duell_lobby set status = 'laeuft', gast_token = p_token, gast_name = v_name, gast_team = v_team, gast_elo = e, aktiv = now() where id = r.id;
    return json_build_object('id', r.id, 'rolle', 'gast', 'list', r.list, 'gegner', r.host_name, 'gegner_team', r.host_team, 'gegner_elo', r.host_elo);
  end if;
  insert into public.duell_lobby(host_token, host_name, host_team, host_elo, stufe, cat, n, list)
  values (p_token, v_name, v_team, e, v_stufe, v_cat, jsonb_array_length(p_list), p_list) returning * into r;
  return json_build_object('id', r.id, 'rolle', 'host');
end $$;

-- Ältere Form ohne Elo (für zwischengespeicherte alte Seiten): gleiche Prüfungen, Elo 1000.
create or replace function public.duell_suchen(p_token text, p_name text, p_team text, p_stufe int, p_cat text, p_n int, p_list jsonb)
returns json language plpgsql security definer set search_path = public as $$
begin
  return public.duell_suchen(p_token, p_name, p_team, p_stufe, p_cat, p_n, p_list, 1000);
end $$;

-- Eigenen Stand melden und den des Gegners holen. Werte werden auf das Mögliche begrenzt.
create or replace function public.duell_stand(p_id bigint, p_token text, p_i int, p_score int, p_ant text, p_fertig boolean)
returns json language plpgsql security definer set search_path = public as $$
declare r public.duell_lobby%rowtype; v_n int; v_i int; v_ant text; v_score int;
begin
  select * into r from public.duell_lobby where id = p_id; if not found then return null; end if;
  v_n := case when jsonb_typeof(r.list) = 'array' then least(20, jsonb_array_length(r.list)) else 20 end;
  v_ant := left(regexp_replace(coalesce(p_ant, ''), '[^01]', '', 'g'), v_n);
  v_i := least(greatest(coalesce(p_i, 0), 0), v_n);
  v_score := least(greatest(coalesce(p_score, 0), 0), 150 * (length(v_ant) - length(replace(v_ant, '1', ''))));
  if r.host_token = p_token then
    update public.duell_lobby set host_i = v_i, host_score = v_score, host_ant = v_ant, host_fertig = coalesce(p_fertig, false), aktiv = now() where id = p_id;
    return json_build_object('status', r.status, 'gegner', r.gast_name, 'gegner_team', r.gast_team, 'gegner_elo', r.gast_elo, 'gegner_i', r.gast_i, 'gegner_score', r.gast_score, 'gegner_ant', r.gast_ant, 'gegner_fertig', r.gast_fertig);
  elsif r.gast_token = p_token then
    update public.duell_lobby set gast_i = v_i, gast_score = v_score, gast_ant = v_ant, gast_fertig = coalesce(p_fertig, false), aktiv = now() where id = p_id;
    return json_build_object('status', r.status, 'gegner', r.host_name, 'gegner_team', r.host_team, 'gegner_elo', r.host_elo, 'gegner_i', r.host_i, 'gegner_score', r.host_score, 'gegner_ant', r.host_ant, 'gegner_fertig', r.host_fertig);
  end if;
  return null;
end $$;

create or replace function public.duell_abbrechen(p_id bigint, p_token text) returns void language sql security definer set search_path = public as $$
  delete from public.duell_lobby where id = p_id and host_token = p_token and status = 'wartet';
$$;

-- Laufendes Duell verlassen (z. B. wenn der Gast die Fragen nicht kennt). Der Gegner sieht status «weg».
create or replace function public.duell_verlassen(p_id bigint, p_token text) returns void language sql security definer set search_path = public as $$
  update public.duell_lobby set status = 'weg', aktiv = now()
  where id = p_id and status = 'laeuft' and (host_token = p_token or gast_token = p_token);
$$;

revoke all on function public.duell_suchen(text, text, text, int, text, int, jsonb) from public;
revoke all on function public.duell_suchen(text, text, text, int, text, int, jsonb, int) from public;
revoke all on function public.duell_stand(bigint, text, int, int, text, boolean) from public;
revoke all on function public.duell_abbrechen(bigint, text) from public;
revoke all on function public.duell_verlassen(bigint, text) from public;
grant execute on function public.duell_suchen(text, text, text, int, text, int, jsonb) to anon, authenticated;
grant execute on function public.duell_stand(bigint, text, int, int, text, boolean) to anon, authenticated;
grant execute on function public.duell_abbrechen(bigint, text) to anon, authenticated;
grant execute on function public.duell_suchen(text, text, text, int, text, int, jsonb, int) to anon, authenticated;
grant execute on function public.duell_verlassen(bigint, text) to anon, authenticated;

commit;
