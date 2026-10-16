-- easyplay: Online-Duell mit zufälligem Gegner (supabase/duell.sql). Im SQL Editor ausführen, darf mehrmals laufen.
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

-- Gegner suchen: passenden Wartenden nehmen oder selbst warten.
create or replace function public.duell_suchen(p_token text, p_name text, p_team text, p_stufe int, p_cat text, p_n int, p_list jsonb)
returns json language plpgsql security definer set search_path = public as $$
declare r duell_lobby%rowtype;
begin
  delete from duell_lobby where erstellt < now() - interval '2 hours';
  select * into r from duell_lobby where status = 'wartet' and host_token <> p_token and stufe = p_stufe and cat = p_cat and erstellt > now() - interval '60 seconds' order by erstellt limit 1 for update skip locked;
  if found then
    update duell_lobby set status = 'laeuft', gast_token = p_token, gast_name = left(p_name, 30), gast_team = left(p_team, 8), aktiv = now() where id = r.id;
    return json_build_object('id', r.id, 'rolle', 'gast', 'list', r.list, 'gegner', r.host_name, 'gegner_team', r.host_team);
  end if;
  insert into duell_lobby(host_token, host_name, host_team, stufe, cat, n, list) values (p_token, left(p_name, 30), left(p_team, 8), p_stufe, left(p_cat, 40), least(20, greatest(3, p_n)), p_list) returning * into r;
  return json_build_object('id', r.id, 'rolle', 'host');
end $$;

-- Gegner suchen mit Elo: zuerst ähnlich starke Wartende, je länger jemand wartet, desto grösser die Spanne.
create or replace function public.duell_suchen(p_token text, p_name text, p_team text, p_stufe int, p_cat text, p_n int, p_list jsonb, p_elo int)
returns json language plpgsql security definer set search_path = public as $$
declare r duell_lobby%rowtype; e int := least(3000, greatest(100, coalesce(p_elo, 1000)));
begin
  delete from duell_lobby where erstellt < now() - interval '2 hours';
  select * into r from duell_lobby
    where status = 'wartet' and host_token <> p_token and stufe = p_stufe and cat = p_cat and erstellt > now() - interval '60 seconds'
      and abs(host_elo - e) <= 150 + extract(epoch from now() - erstellt) * 15
    order by abs(host_elo - e), erstellt limit 1 for update skip locked;
  if found then
    update duell_lobby set status = 'laeuft', gast_token = p_token, gast_name = left(p_name, 30), gast_team = left(p_team, 8), gast_elo = e, aktiv = now() where id = r.id;
    return json_build_object('id', r.id, 'rolle', 'gast', 'list', r.list, 'gegner', r.host_name, 'gegner_team', r.host_team, 'gegner_elo', r.host_elo);
  end if;
  insert into duell_lobby(host_token, host_name, host_team, host_elo, stufe, cat, n, list) values (p_token, left(p_name, 30), left(p_team, 8), e, p_stufe, left(p_cat, 40), least(20, greatest(3, p_n)), p_list) returning * into r;
  return json_build_object('id', r.id, 'rolle', 'host');
end $$;

-- Eigenen Stand melden und den des Gegners holen.
create or replace function public.duell_stand(p_id bigint, p_token text, p_i int, p_score int, p_ant text, p_fertig boolean)
returns json language plpgsql security definer set search_path = public as $$
declare r duell_lobby%rowtype;
begin
  select * into r from duell_lobby where id = p_id; if not found then return null; end if;
  if r.host_token = p_token then
    update duell_lobby set host_i = p_i, host_score = p_score, host_ant = left(p_ant, 40), host_fertig = p_fertig, aktiv = now() where id = p_id;
    return json_build_object('status', r.status, 'gegner', r.gast_name, 'gegner_team', r.gast_team, 'gegner_elo', r.gast_elo, 'gegner_i', r.gast_i, 'gegner_score', r.gast_score, 'gegner_ant', r.gast_ant, 'gegner_fertig', r.gast_fertig);
  elsif r.gast_token = p_token then
    update duell_lobby set gast_i = p_i, gast_score = p_score, gast_ant = left(p_ant, 40), gast_fertig = p_fertig, aktiv = now() where id = p_id;
    return json_build_object('status', r.status, 'gegner', r.host_name, 'gegner_team', r.host_team, 'gegner_elo', r.host_elo, 'gegner_i', r.host_i, 'gegner_score', r.host_score, 'gegner_ant', r.host_ant, 'gegner_fertig', r.host_fertig);
  end if;
  return null;
end $$;

create or replace function public.duell_abbrechen(p_id bigint, p_token text) returns void language sql security definer set search_path = public as $$
  delete from duell_lobby where id = p_id and host_token = p_token and status = 'wartet';
$$;
grant execute on function public.duell_suchen(text, text, text, int, text, int, jsonb) to anon, authenticated;
grant execute on function public.duell_stand(bigint, text, int, int, text, boolean) to anon, authenticated;
grant execute on function public.duell_abbrechen(bigint, text) to anon, authenticated;
grant execute on function public.duell_suchen(text, text, text, int, text, int, jsonb, int) to anon, authenticated;
