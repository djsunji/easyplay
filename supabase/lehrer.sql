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
--   * Nach 20 falschen PIN-Eingaben in 10 Minuten wird ein Test-Code kurz gesperrt.

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

-- ---------- Zeilenschutz (RLS): jede Lehrperson sieht nur ihre eigenen Daten ----------
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
  using (lehrer = auth.uid()) with check (lehrer = auth.uid());

drop policy if exists "Eigene Kinder" on public.lehrer_schueler;
create policy "Eigene Kinder" on public.lehrer_schueler for all to authenticated
  using (lehrer = auth.uid())
  with check (lehrer = auth.uid() and exists (select 1 from public.lehrer_klassen k where k.id = klasse_id and k.lehrer = auth.uid()));

drop policy if exists "Eigene Tests" on public.lehrer_tests;
create policy "Eigene Tests" on public.lehrer_tests for all to authenticated
  using (lehrer = auth.uid())
  with check (lehrer = auth.uid() and exists (select 1 from public.lehrer_klassen k where k.id = klasse_id and k.lehrer = auth.uid()));

drop policy if exists "Abgaben eigener Tests lesen" on public.lehrer_abgaben;
create policy "Abgaben eigener Tests lesen" on public.lehrer_abgaben for select to authenticated
  using (lehrer = auth.uid());

drop policy if exists "Abgaben eigener Tests loeschen" on public.lehrer_abgaben;
create policy "Abgaben eigener Tests loeschen" on public.lehrer_abgaben for delete to authenticated
  using (lehrer = auth.uid());

-- ---------- Hilfsfunktion: Code und PIN prüfen (nur intern) ----------
create or replace function public.lehrer_pruefen(p_code text, p_pin text, out t public.lehrer_tests, out s public.lehrer_schueler, out fehler text)
language plpgsql security definer set search_path = public as $$
declare v_code text := upper(trim(coalesce(p_code, '')));
        v_pin  text := trim(coalesce(p_pin, ''));
begin
  fehler := null;
  if v_code !~ '^[A-Z0-9]{6}$' then fehler := 'code'; return; end if;
  if (select count(*) from public.lehrer_fehlversuche f where f.code = v_code and f.zeit > now() - interval '10 minutes') >= 20 then
    fehler := 'gesperrt'; return;
  end if;
  select * into t from public.lehrer_tests x where x.code = v_code;
  if not found then fehler := 'code'; return; end if;
  select * into s from public.lehrer_schueler y where y.klasse_id = t.klasse_id and y.pin = v_pin;
  if not found then
    insert into public.lehrer_fehlversuche (code) values (v_code);
    delete from public.lehrer_fehlversuche f where f.zeit < now() - interval '1 day';
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
