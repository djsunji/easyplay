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
