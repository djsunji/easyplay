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
