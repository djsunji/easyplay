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
returns text language plpgsql stable as $$
declare v text := left(btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g')), 30);
begin
  if v = '' or v ~ '[<>{}]' or public.name_gesperrt(v) then return 'Gast'; end if;
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
