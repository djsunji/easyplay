-- easyplay · Regionen-Duell (Deutschschweiz, Westschweiz, Tessin)
-- Im Supabase SQL-Editor einmal ausführen. Gespeichert werden nur Wochen-Summen pro Region,
-- keine Namen und keine Daten über einzelne Kinder.

create table if not exists region_punkte (
  woche   text   not null,
  region  text   not null check (region in ('ds','ro','ti')),
  punkte  bigint not null default 0,
  spiele  int    not null default 0,
  primary key (woche, region)
);
alter table region_punkte enable row level security;
-- Keine Policies: Zugriff nur über die Funktionen unten.

create or replace function region_woche(t timestamptz default now())
returns text language sql stable as $$
  select to_char(t at time zone 'Europe/Zurich', 'IYYY-"W"IW');
$$;

-- Punkte eines Duells buchen (höchstens 3000 pro Duell)
create or replace function region_buchen(p_region text, p_punkte int)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_region not in ('ds','ro','ti') then return; end if;
  insert into region_punkte (woche, region, punkte, spiele)
  values (region_woche(), p_region, greatest(0, least(coalesce(p_punkte,0), 3000)), 1)
  on conflict (woche, region) do update
    set punkte = region_punkte.punkte + excluded.punkte,
        spiele = region_punkte.spiele + 1;
end $$;

-- Stand dieser Woche plus Sieger der Vorwoche (nach Schnitt pro Duell)
create or replace function region_stand()
returns table (region text, punkte bigint, spiele int, vorwoche_sieger text)
language sql stable security definer set search_path = public as $$
  with r(region) as (values ('ds'),('ro'),('ti')),
  vor as (
    select v.region from region_punkte v
    where v.woche = region_woche(now() - interval '7 days') and v.spiele > 0
    order by v.punkte::numeric / v.spiele desc limit 1
  )
  select r.region, coalesce(p.punkte,0), coalesce(p.spiele,0), (select region from vor)
  from r left join region_punkte p on p.region = r.region and p.woche = region_woche();
$$;

-- Für das Admin-Panel: Verlauf der letzten Wochen
create or replace function region_verlauf(p_wochen int default 8)
returns table (woche text, region text, punkte bigint, spiele int)
language sql stable security definer set search_path = public as $$
  select woche, region, punkte, spiele from region_punkte
  order by woche desc, region limit greatest(1, least(p_wochen, 52)) * 3;
$$;

grant execute on function region_buchen(text,int) to anon, authenticated;
grant execute on function region_stand() to anon, authenticated;
grant execute on function region_verlauf(int) to anon, authenticated;
