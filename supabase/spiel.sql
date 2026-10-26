-- easyplay: Rangliste, Fragen-Vorschläge, Antwortstatistik und weitere Ansichten der Verwaltung (Oktober 2026)
-- Läuft auf dem eigenen Server automatisch (server/db.js), bei Supabase im SQL Editor NACH verwaltung.sql.
-- Darf mehrmals laufen.
--
--   1. Rangliste: öffentliche Profile aus dem Konto (raw_user_meta_data), ohne E-Mail und ohne Nachnamen
--   2. Fragen-Vorschläge von Kindern (mit Konto), Prüfung in der Verwaltung
--   3. Anonyme Antwortstatistik je Frage (nur Zähler richtig/falsch, keine Person)
--   4. Verwaltung: Rangliste, Auskunft über ein Konto, Lehrpersonen im Detail, beliebte Qeels, schwierige Fragen

-- ---------- 1. Rangliste ----------
-- Zahlen aus dem Profil säubern: höchstens 400 Einträge, jeder Wert 0 bis 100'000
create or replace function public.zahlen_sauber(p jsonb) returns jsonb
language sql immutable as $$
  select coalesce(jsonb_object_agg(left(k, 60), least(greatest(v::numeric, 0), 100000)), '{}'::jsonb)
  from (select key k, value #>> '{}' v from jsonb_each(case when jsonb_typeof(p) = 'object' then p else '{}'::jsonb end)
        where jsonb_typeof(value) = 'number' limit 400) t;
$$;
revoke all on function public.zahlen_sauber(jsonb) from public, anon, authenticated;

create or replace function public.punkte_total(p jsonb) returns numeric
language sql immutable as $$
  select coalesce(sum(least(greatest((value #>> '{}')::numeric, 0), 100000)), 0)
  from jsonb_each(case when jsonb_typeof(p) = 'object' then p else '{}'::jsonb end) where jsonb_typeof(value) = 'number';
$$;
revoke all on function public.punkte_total(jsonb) from public, anon, authenticated;

-- Öffentliches Profil eines Kontos (gleiche Felder wie oeffentlichesProfil() in index.html)
create or replace function public.profil_oeffentlich(u auth.users) returns jsonb
language plpgsql stable security definer set search_path = public, auth as $$
declare m jsonb := coalesce(u.raw_user_meta_data, '{}'::jsonb); v_name text; v_saison jsonb := '{}'::jsonb; k text; x jsonb; hc jsonb := null; d jsonb := null;
begin
  v_name := public.konto_anzeigename(m);
  if v_name = '' or public.name_gesperrt(concat_ws(' ', m->>'vorname', m->>'nachname', m->>'name')) or v_name ~ '[<>{}]' then v_name := 'Kind'; end if;
  if jsonb_typeof(m->'saison') = 'object' then
    for k, x in select key, value from jsonb_each(m->'saison') limit 60 loop v_saison := v_saison || jsonb_build_object(left(k, 40), public.zahlen_sauber(x)); end loop;
  end if;
  if jsonb_typeof(m->'hc') = 'object' then
    hc := jsonb_build_object('best', least(greatest(coalesce((m->'hc'->>'best')::numeric, 0), 0), 100000),
                             'spiele', least(greatest(coalesce((m->'hc'->>'spiele')::numeric, 0), 0), 1000000),
                             'datum', left(coalesce(m->'hc'->>'datum', ''), 30));
  end if;
  if jsonb_typeof(m->'deko') = 'object' and length((m->'deko')::text) < 2000 then d := m->'deko'; end if;
  return jsonb_build_object('id', u.id, 'name', v_name,
    'avatar', case when coalesce(m->>'avatar', '') ~ '^[A-Za-z0-9_:./-]{1,40}$' then m->>'avatar' else null end,
    'stufe', case when m->>'stufe' in ('1', '2', '3') then (m->>'stufe')::int else 1 end,
    'kanton', case when coalesce(m->>'kanton', '') ~ '^[A-Z]{2}$' then m->>'kanton' else '' end,
    'best', public.zahlen_sauber(m->'best'), 'saison', v_saison,
    'tests', least(greatest(coalesce(case when jsonb_typeof(m->'tests') = 'number' then (m->>'tests')::numeric end, 0), 0), 1000000),
    'hc', hc, 'deko', d, 'zahlen', public.zahlen_sauber(m->'zahlen'), 'erstellt', u.created_at);
exception when others then
  return jsonb_build_object('id', u.id, 'name', 'Kind', 'best', '{}'::jsonb);
end $$;
revoke all on function public.profil_oeffentlich(auth.users) from public, anon, authenticated;

-- Für alle: die besten 2000 nach Punkten und die besten 300 im Hardcore-Modus.
-- Nicht dabei: gesperrte Konten und Konten, die die Verwaltung aus der Rangliste genommen hat.
create or replace function public.rangliste() returns jsonb
language plpgsql stable security definer set search_path = public, auth as $$
begin
  return coalesce((select jsonb_agg(public.profil_oeffentlich(u)) from auth.users u where u.id in (
      (select x.id from auth.users x
        where (x.banned_until is null or x.banned_until <= now()) and coalesce(x.raw_app_meta_data->>'rangliste_aus', '') <> 'ja'
          and public.punkte_total(x.raw_user_meta_data->'best') > 0
        order by public.punkte_total(x.raw_user_meta_data->'best') desc limit 2000)
      union
      (select x.id from auth.users x
        where (x.banned_until is null or x.banned_until <= now()) and coalesce(x.raw_app_meta_data->>'rangliste_aus', '') <> 'ja'
          and jsonb_typeof(x.raw_user_meta_data->'hc') = 'object' and coalesce((x.raw_user_meta_data->'hc'->>'best')::numeric, 0) > 0
        order by (x.raw_user_meta_data->'hc'->>'best')::numeric desc limit 300))), '[]'::jsonb);
end $$;
revoke all on function public.rangliste() from public;
grant execute on function public.rangliste() to anon, authenticated;

-- Verwaltung: Rangliste mit E-Mail, auffälligen Werten und dem Schalter «aus der Rangliste»
create or replace function public.admin_rangliste()
returns table (id uuid, email text, name text, roh text, punkte numeric, themen integer, max_wert numeric, tests numeric, hc numeric, aus boolean, gesperrt boolean, verdacht boolean, zuletzt timestamptz)
language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.ist_admin() then raise exception 'nur fuer Admins'; end if;
  return query
    select u.id, u.email::text, public.konto_anzeigename(u.raw_user_meta_data),
           btrim(concat_ws(' ', u.raw_user_meta_data->>'vorname', u.raw_user_meta_data->>'nachname')),
           public.punkte_total(u.raw_user_meta_data->'best'),
           (select count(*)::int from jsonb_object_keys(case when jsonb_typeof(u.raw_user_meta_data->'best') = 'object' then u.raw_user_meta_data->'best' else '{}'::jsonb end)),
           (select max(least(greatest((value #>> '{}')::numeric, 0), 100000)) from jsonb_each(case when jsonb_typeof(u.raw_user_meta_data->'best') = 'object' then u.raw_user_meta_data->'best' else '{}'::jsonb end) where jsonb_typeof(value) = 'number'),
           case when jsonb_typeof(u.raw_user_meta_data->'tests') = 'number' then (u.raw_user_meta_data->>'tests')::numeric else 0 end,
           case when jsonb_typeof(u.raw_user_meta_data->'hc') = 'object' then coalesce((u.raw_user_meta_data->'hc'->>'best')::numeric, 0) else 0 end,
           coalesce(u.raw_app_meta_data->>'rangliste_aus', '') = 'ja',
           coalesce(u.banned_until > now(), false),
           public.name_gesperrt(concat_ws(' ', u.raw_user_meta_data->>'vorname', u.raw_user_meta_data->>'nachname', u.raw_user_meta_data->>'name')),
           coalesce(u.last_sign_in_at, u.updated_at)
    from auth.users u
    where public.punkte_total(u.raw_user_meta_data->'best') > 0
       or (jsonb_typeof(u.raw_user_meta_data->'hc') = 'object' and coalesce((u.raw_user_meta_data->'hc'->>'best')::numeric, 0) > 0)
    order by 5 desc limit 5000;
end $$;
revoke all on function public.admin_rangliste() from public;
grant execute on function public.admin_rangliste() to authenticated;

-- Aus der Rangliste nehmen (p_aus = true) oder wieder zeigen. Die Person kann das nicht selbst ändern (app_metadata).
create or replace function public.admin_rangliste_aus(p_id uuid, p_aus boolean) returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.ist_admin() then raise exception 'nur fuer Admins'; end if;
  update auth.users set raw_app_meta_data = case when p_aus then coalesce(raw_app_meta_data, '{}'::jsonb) || '{"rangliste_aus":"ja"}'::jsonb
                                                 else coalesce(raw_app_meta_data, '{}'::jsonb) - 'rangliste_aus' end
  where id = p_id;
  if not found then raise exception 'Konto nicht gefunden'; end if;
end $$;
revoke all on function public.admin_rangliste_aus(uuid, boolean) from public;
grant execute on function public.admin_rangliste_aus(uuid, boolean) to authenticated;

-- Punkte eines Kontos löschen (bei unechten Punkten). Die Website übernimmt beim nächsten Anmelden den Stand vom Server.
create or replace function public.admin_punkte_loeschen(p_id uuid) returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.ist_admin() then raise exception 'nur fuer Admins'; end if;
  update auth.users set raw_user_meta_data = (coalesce(raw_user_meta_data, '{}'::jsonb) - 'hc') || jsonb_build_object('best', '{}'::jsonb, 'saison', '{}'::jsonb, 'tests', 0),
                        raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('punkte_geloescht', now())
  where id = p_id;
  if not found then raise exception 'Konto nicht gefunden'; end if;
end $$;
revoke all on function public.admin_punkte_loeschen(uuid) from public;
grant execute on function public.admin_punkte_loeschen(uuid) to authenticated;

-- ---------- 2. Fragen-Vorschläge ----------
create table if not exists public.fragen_vorschlaege (
  id          bigint generated always as identity primary key,
  wer         uuid references auth.users(id) on delete set null,
  name        text not null default '',
  thema       text not null,
  stufe       smallint not null check (stufe between 1 and 3),
  frage       text not null check (char_length(frage) between 10 and 300),
  antworten   jsonb not null,
  erklaerung  text not null default '' check (char_length(erklaerung) <= 600),
  status      text not null default 'neu' check (status in ('neu', 'ok', 'abgelehnt')),
  notiz       text not null default '',
  nr          integer,
  erstellt    timestamptz not null default now(),
  geprueft    timestamptz
);
create index if not exists fragen_vorschlaege_status on public.fragen_vorschlaege (status, erstellt desc);
alter table public.fragen_vorschlaege enable row level security;   -- keine Policy: nur über die Funktionen
revoke all on public.fragen_vorschlaege from anon, authenticated;

-- Kinder mit Konto: eine Frage vorschlagen. Erste Antwort ist die richtige. Höchstens 10 pro Tag.
create or replace function public.frage_vorschlagen(p_thema text, p_stufe integer, p_frage text, p_antworten jsonb, p_erklaerung text default '')
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare v_meta jsonb; v_bis timestamptz; v_name text; v_a jsonb; v_id bigint; alles text;
begin
  if auth.uid() is null then return jsonb_build_object('fehler', 'anmelden'); end if;
  select coalesce(u.raw_user_meta_data, '{}'::jsonb), u.banned_until into v_meta, v_bis from auth.users u where u.id = auth.uid();
  if v_bis is not null and v_bis > now() then return jsonb_build_object('fehler', 'gesperrt'); end if;
  if coalesce(p_thema, '') !~ '^[a-z0-9_]{1,40}$' then return jsonb_build_object('fehler', 'thema'); end if;
  if coalesce(p_stufe, 0) not between 1 and 3 then return jsonb_build_object('fehler', 'stufe'); end if;
  p_frage := btrim(regexp_replace(coalesce(p_frage, ''), '\s+', ' ', 'g'));
  p_erklaerung := btrim(regexp_replace(coalesce(p_erklaerung, ''), '\s+', ' ', 'g'));
  if char_length(p_frage) not between 10 and 300 then return jsonb_build_object('fehler', 'frage'); end if;
  if char_length(p_erklaerung) > 600 then return jsonb_build_object('fehler', 'erklaerung'); end if;
  if jsonb_typeof(p_antworten) <> 'array' or jsonb_array_length(p_antworten) <> 4 then return jsonb_build_object('fehler', 'antworten'); end if;
  select jsonb_agg(left(btrim(e #>> '{}'), 120)) into v_a from jsonb_array_elements(p_antworten) e;
  if exists (select 1 from jsonb_array_elements_text(v_a) x where x = '') or (select count(distinct lower(x)) from jsonb_array_elements_text(v_a) x) <> 4 then
    return jsonb_build_object('fehler', 'antworten');
  end if;
  alles := p_frage || ' ' || p_erklaerung || ' ' || (select string_agg(x, ' ') from jsonb_array_elements_text(v_a) x);
  if public.kontakt_verdacht(alles) or alles ~ '[<>{}]' then return jsonb_build_object('fehler', 'kontakt'); end if;
  if public.bremse('vorschlag', 10, interval '1 day') then return jsonb_build_object('fehler', 'viele'); end if;
  v_name := public.konto_anzeigename(v_meta); if v_name = '' or public.name_gesperrt(v_name) then v_name := 'Kind'; end if;
  insert into public.fragen_vorschlaege (wer, name, thema, stufe, frage, antworten, erklaerung)
  values (auth.uid(), v_name, p_thema, p_stufe, p_frage, v_a, p_erklaerung) returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id);
end $$;
revoke all on function public.frage_vorschlagen(text, integer, text, jsonb, text) from public, anon;
grant execute on function public.frage_vorschlagen(text, integer, text, jsonb, text) to authenticated;

-- Eigene Vorschläge mit Status (für «Meine Vorschläge»)
create or replace function public.meine_vorschlaege()
returns table (id bigint, thema text, frage text, status text, erstellt timestamptz)
language sql stable security definer set search_path = public as $$
  select v.id, v.thema, v.frage, v.status, v.erstellt from public.fragen_vorschlaege v where v.wer = auth.uid() order by v.erstellt desc limit 50;
$$;
revoke all on function public.meine_vorschlaege() from public, anon;
grant execute on function public.meine_vorschlaege() to authenticated;

create or replace function public.admin_vorschlaege(p_status text default 'neu')
returns table (id bigint, email text, name text, thema text, stufe smallint, frage text, antworten jsonb, erklaerung text, status text, notiz text, nr integer, erstellt timestamptz, geprueft timestamptz)
language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.ist_admin() then raise exception 'nur fuer Admins'; end if;
  return query select v.id, u.email::text, v.name, v.thema, v.stufe, v.frage, v.antworten, v.erklaerung, v.status, v.notiz, v.nr, v.erstellt, v.geprueft
    from public.fragen_vorschlaege v left join auth.users u on u.id = v.wer
    where p_status is null or p_status = '' or v.status = p_status order by v.erstellt desc limit 500;
end $$;
revoke all on function public.admin_vorschlaege(text) from public;
grant execute on function public.admin_vorschlaege(text) to authenticated;

-- Status setzen: ok (mit Nummer der übernommenen Frage), abgelehnt (mit Notiz), neu, oder loeschen
create or replace function public.admin_vorschlag_status(p_id bigint, p_status text, p_notiz text default '', p_nr integer default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.ist_admin() then raise exception 'nur fuer Admins'; end if;
  if p_status = 'loeschen' then delete from public.fragen_vorschlaege where id = p_id; return; end if;
  if p_status not in ('neu', 'ok', 'abgelehnt') then raise exception 'ungültiger Status'; end if;
  update public.fragen_vorschlaege set status = p_status, notiz = left(coalesce(p_notiz, ''), 300), nr = coalesce(p_nr, nr),
         geprueft = case when p_status = 'neu' then null else now() end where id = p_id;
end $$;
revoke all on function public.admin_vorschlag_status(bigint, text, text, integer) from public;
grant execute on function public.admin_vorschlag_status(bigint, text, text, integer) to authenticated;

-- ---------- 3. Antwortstatistik ----------
-- Nur Zähler je Frage-Nummer, ohne Person, ohne Zeitpunkt der einzelnen Antwort.
create table if not exists public.frage_antworten (
  nr       integer primary key,
  richtig  integer not null default 0,
  falsch   integer not null default 0,
  zuletzt  date not null default current_date
);
alter table public.frage_antworten enable row level security;   -- keine Policy: nur über die Funktionen
revoke all on public.frage_antworten from anon, authenticated;

-- p_liste: [[nr, 1|0], …], höchstens 50 Einträge pro Aufruf. Mengenbremse: 40 Aufrufe in 10 Minuten (ohne Konto 200, Schulnetz).
create or replace function public.antworten_zaehlen(p_liste jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if jsonb_typeof(p_liste) <> 'array' or jsonb_array_length(p_liste) = 0 or jsonb_array_length(p_liste) > 50 then return; end if;
  if public.bremse('antworten', case when auth.uid() is null then 200 else 40 end, interval '10 minutes') then return; end if;
  insert into public.frage_antworten as f (nr, richtig, falsch, zuletzt)
  select nr, sum(r), sum(1 - r), current_date from (
    select (e->>0)::int nr, case when (e->>1) in ('1', 'true') then 1 else 0 end r
    from jsonb_array_elements(p_liste) e
    where jsonb_typeof(e) = 'array' and (e->>0) ~ '^[0-9]{1,7}$' and (e->>0)::int between 1 and 9999999) t
  group by nr
  on conflict (nr) do update set richtig = f.richtig + excluded.richtig, falsch = f.falsch + excluded.falsch, zuletzt = current_date;
end $$;
revoke all on function public.antworten_zaehlen(jsonb) from public;
grant execute on function public.antworten_zaehlen(jsonb) to anon, authenticated;

create or replace function public.admin_antworten(p_min integer default 20)
returns table (nr integer, richtig integer, falsch integer, quote numeric, zuletzt date)
language plpgsql security definer set search_path = public as $$
begin
  if not public.ist_admin() then raise exception 'nur fuer Admins'; end if;
  return query select a.nr, a.richtig, a.falsch, round(a.falsch * 100.0 / nullif(a.richtig + a.falsch, 0), 1), a.zuletzt
    from public.frage_antworten a where a.richtig + a.falsch >= greatest(coalesce(p_min, 20), 1)
    order by a.falsch * 1.0 / nullif(a.richtig + a.falsch, 0) desc, a.falsch desc limit 3000;
end $$;
revoke all on function public.admin_antworten(integer) from public;
grant execute on function public.admin_antworten(integer) to authenticated;

create or replace function public.admin_antworten_summe() returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if not public.ist_admin() then raise exception 'nur fuer Admins'; end if;
  return (select jsonb_build_object('fragen', count(*), 'antworten', coalesce(sum(richtig + falsch), 0), 'richtig', coalesce(sum(richtig), 0)) from public.frage_antworten);
end $$;
revoke all on function public.admin_antworten_summe() from public;
grant execute on function public.admin_antworten_summe() to authenticated;

-- ---------- 4. Verwaltung ----------
-- Auskunft: alles, was über ein Konto gespeichert ist (für Anfragen von Eltern nach dem Datenschutzgesetz)
create or replace function public.admin_konto_auskunft(p_id uuid) returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare r jsonb; u auth.users;
begin
  if not public.ist_admin() then raise exception 'nur fuer Admins'; end if;
  select * into u from auth.users where id = p_id;
  if not found then raise exception 'Konto nicht gefunden'; end if;
  r := jsonb_build_object(
    'erstellt_fuer_auskunft', now(),
    'konto', jsonb_build_object('id', u.id, 'email', u.email, 'registriert', u.created_at, 'bestaetigt', u.email_confirmed_at,
                                'letzte_anmeldung', u.last_sign_in_at, 'geaendert', u.updated_at, 'gesperrt_bis', u.banned_until,
                                'profil', coalesce(u.raw_user_meta_data, '{}'::jsonb) - 'pw' - 'password',
                                'rolle_und_einstellungen', coalesce(u.raw_app_meta_data, '{}'::jsonb)),
    'anmeldung_mit', coalesce((select jsonb_agg(jsonb_build_object('anbieter', i.provider, 'email', i.email, 'seit', i.created_at)) from auth.identities i where i.user_id = p_id), '[]'::jsonb),
    'sitzungen', coalesce((select jsonb_agg(jsonb_build_object('seit', s.created_at, 'zuletzt', s.updated_at, 'geraet', s.user_agent)) from auth.sessions s where s.user_id = p_id), '[]'::jsonb),
    'admin', exists (select 1 from public.admins a where a.user_id = p_id),
    'oeffentlich_in_der_rangliste', public.profil_oeffentlich(u));
  if to_regclass('public.kommentare') is not null then
    r := r || jsonb_build_object('kommentare', coalesce((select jsonb_agg(jsonb_build_object('zeit', k.erstellt, 'qeel', k.qeel, 'name', k.name, 'text', k.text, 'meldungen', k.gemeldet) order by k.erstellt) from public.kommentare k where k.wer = p_id), '[]'::jsonb));
  end if;
  if to_regclass('public.like_stimmen') is not null then
    r := r || jsonb_build_object('likes', coalesce((select jsonb_agg(l.id) from public.like_stimmen l where l.wer = p_id::text), '[]'::jsonb));
  end if;
  if to_regclass('public.live_runden') is not null then
    r := r || jsonb_build_object('live_quiz', coalesce((select jsonb_agg(jsonb_build_object('runde', l.key, 'team', l.team, 'punkte', l.punkte, 'richtig', l.richtig, 'zeit', l.erstellt) order by l.erstellt) from public.live_runden l where l.user_id = p_id), '[]'::jsonb));
  end if;
  r := r || jsonb_build_object('fragen_vorschlaege', coalesce((select jsonb_agg(jsonb_build_object('zeit', v.erstellt, 'thema', v.thema, 'frage', v.frage, 'antworten', v.antworten, 'status', v.status) order by v.erstellt) from public.fragen_vorschlaege v where v.wer = p_id), '[]'::jsonb));
  if to_regclass('public.lehrer_klassen') is not null then
    r := r || jsonb_build_object('lehrerbereich', jsonb_build_object(
      'klassen', coalesce((select jsonb_agg(to_jsonb(k) order by k.name) from public.lehrer_klassen k where k.lehrer = p_id), '[]'::jsonb),
      'kinder', coalesce((select jsonb_agg(to_jsonb(s) - 'pin') from public.lehrer_schueler s where s.lehrer = p_id), '[]'::jsonb),
      'tests', coalesce((select jsonb_agg(to_jsonb(t)) from public.lehrer_tests t where t.lehrer = p_id), '[]'::jsonb),
      'abgaben', coalesce((select jsonb_agg(to_jsonb(a)) from public.lehrer_abgaben a where a.lehrer = p_id), '[]'::jsonb),
      'klassen_liga', case when to_regclass('public.liga_klassen') is null then '[]'::jsonb else coalesce((select jsonb_agg(to_jsonb(l)) from public.liga_klassen l where l.lehrer = p_id), '[]'::jsonb) end));
  end if;
  if to_regclass('public.fehlermeldungen') is not null then
    r := r || jsonb_build_object('fehlermeldungen', coalesce((select jsonb_agg(to_jsonb(f) - 'ip') from public.fehlermeldungen f where f.von = p_id), '[]'::jsonb));
  end if;
  return r;
end $$;
revoke all on function public.admin_konto_auskunft(uuid) from public;
grant execute on function public.admin_konto_auskunft(uuid) to authenticated;

-- Lehrpersonen im Detail: Klassen mit Anzahl Kinder, Tests mit Anzahl Abgaben (ohne PINs und ohne Antworten)
create or replace function public.admin_lehrer_detail(p_id uuid) returns jsonb
language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.ist_admin() then raise exception 'nur fuer Admins'; end if;
  if to_regclass('public.lehrer_klassen') is null then return '{}'::jsonb; end if;
  return jsonb_build_object(
    'klassen', coalesce((select jsonb_agg(jsonb_build_object('id', k.id, 'name', k.name, 'erstellt', k.erstellt,
        'kinder', (select count(*) from public.lehrer_schueler s where s.klasse_id = k.id),
        'tests', (select count(*) from public.lehrer_tests t where t.klasse_id = k.id),
        'liga', case when to_regclass('public.liga_klassen') is null then null else (select l.anzeige from public.liga_klassen l where l.klasse_id = k.id) end) order by k.name)
      from public.lehrer_klassen k where k.lehrer = p_id), '[]'::jsonb),
    'tests', coalesce((select jsonb_agg(jsonb_build_object('code', t.code, 'titel', t.titel, 'klasse', (select k.name from public.lehrer_klassen k where k.id = t.klasse_id),
        'erstellt', t.erstellt, 'abgaben', (select count(*) from public.lehrer_abgaben a where a.test_code = t.code),
        'letzte', (select max(a.abgegeben) from public.lehrer_abgaben a where a.test_code = t.code)) order by t.erstellt desc)
      from public.lehrer_tests t where t.lehrer = p_id), '[]'::jsonb));
end $$;
revoke all on function public.admin_lehrer_detail(uuid) from public;
grant execute on function public.admin_lehrer_detail(uuid) to authenticated;

-- Beliebte Qeels: Likes und Kommentare je Qeel
create or replace function public.admin_qeels_top(p_anzahl integer default 100)
returns table (id text, likes integer, kommentare integer, gemeldet integer, zuletzt timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not public.ist_admin() then raise exception 'nur fuer Admins'; end if;
  return query
    with l as (select x.id, x.n from public.likes x where x.n > 0),
         k as (select c.qeel id, count(*)::int n, count(*) filter (where c.gemeldet > 0)::int g, max(c.erstellt) z from public.kommentare c group by c.qeel)
    select coalesce(l.id, k.id), coalesce(l.n, 0)::int, coalesce(k.n, 0), coalesce(k.g, 0), k.z
    from l full join k on k.id = l.id
    order by coalesce(l.n, 0) + 3 * coalesce(k.n, 0) desc limit least(greatest(coalesce(p_anzahl, 100), 1), 1000);
end $$;
revoke all on function public.admin_qeels_top(integer) from public;
grant execute on function public.admin_qeels_top(integer) to authenticated;
