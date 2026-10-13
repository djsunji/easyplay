-- easyplay: Live-Quiz um 13 und 19 Uhr, Punkte aller Kinder je Team zusammenzählen.
-- Im SQL Editor von Supabase ausführen (darf mehrmals laufen).

create table if not exists public.live_runden (
  id bigserial primary key,
  key text not null,                 -- z. B. 2026-10-13-13
  team text not null check (team in ('lumi','milo')),
  punkte int not null default 0 check (punkte between 0 and 5000),
  richtig int not null default 0 check (richtig between 0 and 50),
  user_id uuid default auth.uid(),
  erstellt timestamptz not null default now()
);
create index if not exists live_runden_key on public.live_runden(key);
alter table public.live_runden enable row level security;
drop policy if exists live_runden_einfuegen on public.live_runden;
create policy live_runden_einfuegen on public.live_runden for insert to anon, authenticated with check (true);
drop policy if exists live_runden_lesen on public.live_runden;
create policy live_runden_lesen on public.live_runden for select to anon, authenticated using (true);

-- Ein Ergebnis melden. Pro Konto und Runde zählt nur das erste Ergebnis.
create or replace function public.live_punkte(p_key text, p_team text, p_punkte int, p_richtig int)
returns json language plpgsql security definer set search_path = public as $$
begin
  if p_key !~ '^\d{4}-\d{2}-\d{2}-\d{2}$' then raise exception 'ungültiger Schlüssel'; end if;
  if auth.uid() is null or not exists (select 1 from live_runden where key = p_key and user_id = auth.uid()) then
    insert into live_runden(key, team, punkte, richtig) values (p_key, p_team, least(5000, greatest(0, p_punkte)), least(50, greatest(0, p_richtig)));
  end if;
  return live_stand(p_key);
end $$;

-- Stand einer Runde: Punkte je Team und Anzahl Kinder.
create or replace function public.live_stand(p_key text)
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'lumi', coalesce(sum(punkte) filter (where team = 'lumi'), 0),
    'milo', coalesce(sum(punkte) filter (where team = 'milo'), 0),
    'spieler', count(*))
  from live_runden where key = p_key;
$$;
grant execute on function public.live_punkte(text, text, int, int) to anon, authenticated;
grant execute on function public.live_stand(text) to anon, authenticated;
