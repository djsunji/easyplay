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
