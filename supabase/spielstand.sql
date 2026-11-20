-- easyplay: Spielstand mit Konto über mehrere Geräte (sync.js auf der Website).
-- Gespeichert wird ein JSON mit den Fortschritts-Einträgen aus dem Browser (ep-…), höchstens 1,5 MB.
-- Lesen und Schreiben nur das eigene Konto über spielstand_holen/spielstand_speichern. Wird das Konto
-- gelöscht, ist der Spielstand auch weg (on delete cascade).
create table if not exists public.spielstand (
  user_id   uuid primary key references auth.users(id) on delete cascade,
  daten     jsonb not null default '{}'::jsonb,
  geaendert timestamptz not null default now()
);
alter table public.spielstand enable row level security;   -- keine Policy: nur über die Funktionen
revoke all on public.spielstand from anon, authenticated;

create or replace function public.spielstand_holen()
returns json language sql stable security definer set search_path = public as $$
  select json_build_object('daten', coalesce((select daten from public.spielstand where user_id = auth.uid()), '{}'::jsonb),
                           'geaendert', (select geaendert from public.spielstand where user_id = auth.uid()));
$$;

create or replace function public.spielstand_speichern(p_daten jsonb)
returns json language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'nur mit Konto'; end if;
  if p_daten is null or jsonb_typeof(p_daten) <> 'object' then raise exception 'ungültig'; end if;
  if length(p_daten::text) > 1500000 then raise exception 'Spielstand zu gross'; end if;
  if public.bremse('spielstand', 240, interval '1 hour') then return json_build_object('ok', false); end if;
  insert into public.spielstand(user_id, daten, geaendert) values (auth.uid(), p_daten, now())
  on conflict (user_id) do update set daten = excluded.daten, geaendert = now();
  return json_build_object('ok', true, 'geaendert', now());
end $$;

revoke all on function public.spielstand_holen() from public, anon;
revoke all on function public.spielstand_speichern(jsonb) from public, anon;
grant execute on function public.spielstand_holen() to authenticated;
grant execute on function public.spielstand_speichern(jsonb) to authenticated;
