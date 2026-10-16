-- easyplay Lehrerbereich, Erweiterung 2 (Oktober 2026)
-- Offene Fragen (Textantworten, von der Lehrperson korrigiert) und Fehlermeldungen
-- aus Fragendatenbank und Bibliothek.
-- Ausführen im Supabase SQL Editor NACH schema.sql, lehrer.sql und admin.sql.

-- ---------- Abgaben: Korrektur offener Fragen, halbe Punkte ----------
alter table public.lehrer_abgaben add column if not exists korrektur jsonb not null default '{}'::jsonb;
alter table public.lehrer_abgaben alter column punkte type numeric(6,1);

-- Die Lehrperson darf bei Abgaben ihrer Tests nur Korrektur, Punkte und Note ändern
drop policy if exists "Abgaben eigener Tests korrigieren" on public.lehrer_abgaben;
create policy "Abgaben eigener Tests korrigieren" on public.lehrer_abgaben for update to authenticated
  using (lehrer = auth.uid()) with check (lehrer = auth.uid());
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
  if (select count(*) from public.fehlermeldungen where von = auth.uid() and erstellt > now() - interval '1 hour') >= 60 then return false; end if;
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
