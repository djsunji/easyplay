-- easyplay: Ausbau der Verwaltung (Oktober 2026)
-- Läuft auf dem eigenen Server automatisch (server/db.js), bei Supabase im SQL Editor NACH allen anderen Dateien
-- (schema, lehrer, admin, lehrer2, klassenliga, live, regionen, duell). Darf mehrmals laufen.
--
-- Inhalt:
--   1. Protokoll der Admin-Aktionen (admin_protokoll)
--   2. Einstellungen: Hinweis an alle, Themenplan (Thema der Woche, Live-Quiz), Sperrwörter für Namen
--   3. Öffentliche Namen prüfen und ändern (Konten, Kommentare, Duell, Klassen-Liga)
--   4. Live-Quiz, Online-Duell und Regionen-Cup überwachen
--   5. Sicherheitsmeldungen (Mengenbremse, Fehlversuche Lehrerzugang, Sperren)
-- Alle Funktionen prüfen selbst, ob die aufrufende Person Admin ist (ausser oeffentlich_lesen).

-- ---------- 1. Protokoll ----------
create table if not exists public.admin_protokoll (
  id      bigint generated always as identity primary key,
  zeit    timestamptz not null default now(),
  wer     uuid,
  email   text,
  aktion  text not null,
  ziel    text not null default '',
  details jsonb not null default '{}'::jsonb
);
create index if not exists admin_protokoll_zeit on public.admin_protokoll (zeit desc);
alter table public.admin_protokoll enable row level security;   -- keine Policy: nur über die Funktionen
revoke all on public.admin_protokoll from anon, authenticated;

-- Eintrag schreiben (intern und für Aktionen, die nicht in der Datenbank laufen, z. B. Speichern auf GitHub)
create or replace function public.admin_notiz(p_aktion text, p_ziel text default '', p_details jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.ist_admin() then raise exception 'nur fuer Admins'; end if;
  insert into public.admin_protokoll (wer, email, aktion, ziel, details)
  values (auth.uid(), (select u.email from auth.users u where u.id = auth.uid()),
          left(coalesce(p_aktion, ''), 80), left(coalesce(p_ziel, ''), 200),
          case when jsonb_typeof(p_details) = 'object' and length(p_details::text) <= 4000 then p_details else '{}'::jsonb end);
  delete from public.admin_protokoll where zeit < now() - interval '2 years';
end $$;
revoke all on function public.admin_notiz(text, text, jsonb) from public;
grant execute on function public.admin_notiz(text, text, jsonb) to authenticated;

create or replace function public.admin_protokoll_lesen(p_anzahl integer default 300)
returns table (id bigint, zeit timestamptz, email text, aktion text, ziel text, details jsonb)
language plpgsql security definer set search_path = public as $$
begin
  if not public.ist_admin() then raise exception 'nur fuer Admins'; end if;
  return query select p.id, p.zeit, p.email, p.aktion, p.ziel, p.details from public.admin_protokoll p
               order by p.zeit desc limit least(greatest(coalesce(p_anzahl, 300), 1), 2000);
end $$;
revoke all on function public.admin_protokoll_lesen(integer) from public;
grant execute on function public.admin_protokoll_lesen(integer) to authenticated;

-- ---------- 2. Einstellungen ----------
-- Tabelle public.einstellungen und name_gesperrt() stehen in schema.sql.

-- Für alle (auch ohne Konto): aktiver Hinweis und Themenplan. Die Website liest das beim Start einmal.
create or replace function public.oeffentlich_lesen() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare h jsonb; p jsonb; heute date := (now() at time zone 'Europe/Zurich')::date;
begin
  select wert into h from public.einstellungen where schluessel = 'hinweis';
  if h is null or coalesce((h->>'aktiv')::boolean, false) is not true
     or (coalesce(h->>'von', '') <> '' and (h->>'von')::date > heute)
     or (coalesce(h->>'bis', '') <> '' and (h->>'bis')::date < heute) then
    h := null;
  else
    h := jsonb_build_object('id', h->'id', 'text', h->'text', 'art', h->'art', 'link', h->'link');
  end if;
  select wert into p from public.einstellungen where schluessel = 'themenplan';
  return jsonb_build_object('hinweis', h, 'themenplan', coalesce(p, '{}'::jsonb));
end $$;
revoke all on function public.oeffentlich_lesen() from public;
grant execute on function public.oeffentlich_lesen() to anon, authenticated;

create or replace function public.admin_einstellungen() returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if not public.ist_admin() then raise exception 'nur fuer Admins'; end if;
  return coalesce((select jsonb_object_agg(schluessel, jsonb_build_object('wert', wert, 'geaendert', geaendert, 'von', von))
                   from public.einstellungen), '{}'::jsonb);
end $$;
revoke all on function public.admin_einstellungen() from public;
grant execute on function public.admin_einstellungen() to authenticated;

-- Setzen mit Prüfung des Aufbaus. Erlaubt: hinweis, themenplan, sperrwoerter, letzte_sicherung.
create or replace function public.admin_einstellung_setzen(p_schluessel text, p_wert jsonb) returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare v jsonb := p_wert; k text; x text; v_mail text;
begin
  if not public.ist_admin() then raise exception 'nur fuer Admins'; end if;
  select u.email into v_mail from auth.users u where u.id = auth.uid();
  if p_schluessel = 'hinweis' then
    if jsonb_typeof(v) <> 'object' then raise exception 'Hinweis: Objekt erwartet'; end if;
    if char_length(coalesce(v->>'text', '')) > 240 then raise exception 'Hinweis: höchstens 240 Zeichen'; end if;
    if coalesce(v->>'art', 'info') not in ('info', 'wartung', 'warnung', 'freude') then raise exception 'Hinweis: unbekannte Art'; end if;
    if coalesce(v->>'link', '') <> '' and (v->>'link') !~ '^(https://|#|/)[^\s<>"]{0,300}$' then raise exception 'Hinweis: Link muss mit https:// oder # beginnen'; end if;
    if coalesce(v->>'von', '') <> '' and (v->>'von') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Hinweis: Datum von als JJJJ-MM-TT'; end if;
    if coalesce(v->>'bis', '') <> '' and (v->>'bis') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Hinweis: Datum bis als JJJJ-MM-TT'; end if;
    if public.kontakt_verdacht(regexp_replace(coalesce(v->>'text', ''), 'https://easyplay\.ch\S*', '', 'g')) and coalesce(v->>'art', '') <> 'wartung' then
      null;  -- Admins dürfen Kontaktangaben schreiben (z. B. Mailadresse für Rückmeldungen)
    end if;
    v := jsonb_build_object('aktiv', coalesce((v->>'aktiv')::boolean, false), 'text', btrim(coalesce(v->>'text', '')),
                            'art', coalesce(v->>'art', 'info'), 'link', coalesce(v->>'link', ''),
                            'von', coalesce(v->>'von', ''), 'bis', coalesce(v->>'bis', ''),
                            'id', md5(coalesce(v->>'text', '') || now()::text));
  elsif p_schluessel = 'themenplan' then
    if jsonb_typeof(v) <> 'object' then raise exception 'Themenplan: Objekt erwartet'; end if;
    v := jsonb_build_object('woche', coalesce(v->'woche', '{}'::jsonb), 'live', coalesce(v->'live', '{}'::jsonb));
    if jsonb_typeof(v->'woche') <> 'object' or jsonb_typeof(v->'live') <> 'object' then raise exception 'Themenplan: woche und live als Objekt'; end if;
    for k, x in select key, value from jsonb_each_text(v->'woche') loop
      if k !~ '^\d{4}-W\d{2}$' or x !~ '^[a-z0-9_]{1,40}$' then raise exception 'Themenplan: ungültige Woche %', k; end if;
    end loop;
    for k, x in select key, value from jsonb_each_text(v->'live') loop
      if k !~ '^\d{4}-\d{2}-\d{2}-(8|12|16|20)$' or x !~ '^[a-z0-9_]{1,40}$' then raise exception 'Themenplan: ungültige Live-Runde %', k; end if;
    end loop;
    if (select count(*) from jsonb_object_keys(v->'woche')) + (select count(*) from jsonb_object_keys(v->'live')) > 600 then
      raise exception 'Themenplan: zu viele Einträge';
    end if;
  elsif p_schluessel = 'sperrwoerter' then
    if jsonb_typeof(v) <> 'array' or jsonb_array_length(v) > 1000 then raise exception 'Sperrwörter: Liste mit höchstens 1000 Wörtern'; end if;
    if exists (select 1 from jsonb_array_elements(v) e where jsonb_typeof(e) <> 'string' or char_length(e #>> '{}') not between 3 and 40) then
      raise exception 'Sperrwörter: jedes Wort 3 bis 40 Zeichen';
    end if;
    v := coalesce((select jsonb_agg(distinct lower(btrim(e #>> '{}'))) from jsonb_array_elements(v) e), '[]'::jsonb);
  elsif p_schluessel = 'letzte_sicherung' then
    v := jsonb_build_object('zeit', now());
  else
    raise exception 'unbekannte Einstellung';
  end if;
  insert into public.einstellungen (schluessel, wert, geaendert, von) values (p_schluessel, v, now(), v_mail)
  on conflict (schluessel) do update set wert = excluded.wert, geaendert = excluded.geaendert, von = excluded.von;
  return v;
end $$;
revoke all on function public.admin_einstellung_setzen(text, jsonb) from public;
grant execute on function public.admin_einstellung_setzen(text, jsonb) to authenticated;

-- ---------- 3. Öffentliche Namen ----------
-- Anzeigename eines Kontos, so wie er bei Kommentaren erscheint (Vorname und Initiale des Nachnamens)
create or replace function public.konto_anzeigename(p_meta jsonb) returns text
language plpgsql immutable as $$
declare v_vor text; v_nach text;
begin
  v_vor := btrim(coalesce(nullif(btrim(p_meta->>'vorname'), ''),
                          split_part(btrim(coalesce(p_meta->>'name', p_meta->>'full_name', '')), ' ', 1)));
  v_nach := btrim(coalesce(p_meta->>'nachname', ''));
  if v_vor = '' then return ''; end if;
  return left(v_vor, 26) || case when v_nach <> '' then ' ' || upper(left(v_nach, 1)) || '.' else '' end;
end $$;
revoke all on function public.konto_anzeigename(jsonb) from public, anon, authenticated;

-- Alle Namen, die andere Kinder sehen können. quelle: konto, kommentar, duell, liga.
create or replace function public.admin_namen()
returns table (quelle text, id text, name text, roh text, email text, zeit timestamptz, anzahl integer, gesperrt boolean, grund text)
language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.ist_admin() then raise exception 'nur fuer Admins'; end if;
  return query
    select 'konto'::text, u.id::text, public.konto_anzeigename(u.raw_user_meta_data),
           btrim(concat_ws(' ', u.raw_user_meta_data->>'vorname', u.raw_user_meta_data->>'nachname', nullif(u.raw_user_meta_data->>'name', ''))),
           u.email::text, u.created_at, null::integer, coalesce(u.banned_until > now(), false),
           case when public.name_gesperrt(concat_ws(' ', u.raw_user_meta_data->>'vorname', u.raw_user_meta_data->>'nachname', u.raw_user_meta_data->>'name'))
                then 'Sperrwort oder Kontaktangabe' else '' end
    from auth.users u
    order by u.created_at desc limit 3000;
  if to_regclass('public.kommentare') is not null then
    return query
      select 'kommentar'::text, coalesce(k.wer::text, ''), k.name, k.name, (select u.email::text from auth.users u where u.id = k.wer),
             max(k.erstellt), count(*)::integer, false,
             case when public.name_gesperrt(k.name) then 'Sperrwort oder Kontaktangabe' else '' end
      from public.kommentare k group by k.wer, k.name order by max(k.erstellt) desc limit 2000;
  end if;
  if to_regclass('public.duell_lobby') is not null then
    return query
      select 'duell'::text, d.id::text, n.name, n.name, ''::text, d.erstellt, null::integer, d.status = 'weg',
             case when public.name_gesperrt(n.name) then 'Sperrwort oder Kontaktangabe' else '' end
      from public.duell_lobby d cross join lateral (values (d.host_name), (d.gast_name)) n(name)
      where n.name is not null order by d.erstellt desc limit 500;
  end if;
  if to_regclass('public.liga_klassen') is not null then
    return query
      select 'liga'::text, l.liga_id::text, l.anzeige, l.anzeige, (select u.email::text from auth.users u where u.id = l.lehrer),
             l.angemeldet, null::integer, l.gesperrt,
             case when public.name_gesperrt(l.anzeige) then 'Sperrwort oder Kontaktangabe' else '' end
      from public.liga_klassen l order by l.angemeldet desc;
  end if;
end $$;
revoke all on function public.admin_namen() from public;
grant execute on function public.admin_namen() to authenticated;

-- Namen eines Kontos ändern: Vorname, Nachname (nur die Initiale wird gezeigt). Ändert auch alte Kommentare.
create or replace function public.admin_name_aendern(p_id uuid, p_vorname text, p_nachname text default '') returns text
language plpgsql security definer set search_path = public, auth as $$
declare v_vor text := left(btrim(coalesce(p_vorname, '')), 26); v_nach text := left(btrim(coalesce(p_nachname, '')), 40); v_neu text;
begin
  if not public.ist_admin() then raise exception 'nur fuer Admins'; end if;
  if v_vor = '' then v_vor := 'Kind'; end if;
  if v_vor ~ '[<>{}]' or v_nach ~ '[<>{}]' then raise exception 'ungültige Zeichen'; end if;
  update auth.users set raw_user_meta_data = (coalesce(raw_user_meta_data, '{}'::jsonb) - 'name' - 'full_name')
                        || jsonb_build_object('vorname', v_vor, 'nachname', v_nach), updated_at = now()
  where id = p_id;
  if not found then raise exception 'Konto nicht gefunden'; end if;
  v_neu := public.konto_anzeigename(jsonb_build_object('vorname', v_vor, 'nachname', v_nach));
  if to_regclass('public.kommentare') is not null then
    update public.kommentare set name = v_neu where wer = p_id;
  end if;
  return v_neu;
end $$;
revoke all on function public.admin_name_aendern(uuid, text, text) from public;
grant execute on function public.admin_name_aendern(uuid, text, text) to authenticated;

-- ---------- 4. Live-Quiz, Online-Duell, Regionen-Cup ----------
create or replace function public.admin_spiele() returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare r jsonb := '{}'::jsonb;
begin
  if not public.ist_admin() then raise exception 'nur fuer Admins'; end if;
  if to_regclass('public.live_runden') is not null then
    r := r || jsonb_build_object('live', jsonb_build_object(
      'runden', coalesce((select jsonb_agg(x order by x->>'key' desc) from (
          select jsonb_build_object('key', key,
            'lumi', count(*) filter (where team = 'lumi'), 'milo', count(*) filter (where team = 'milo'),
            'lumi_punkte', coalesce(sum(punkte) filter (where team = 'lumi'), 0), 'milo_punkte', coalesce(sum(punkte) filter (where team = 'milo'), 0),
            'mit_konto', count(user_id), 'max', max(punkte), 'start', min(erstellt)) x
          from public.live_runden where erstellt > now() - interval '21 days' group by key order by key desc limit 120) t), '[]'::jsonb),
      'top', coalesce((select jsonb_agg(jsonb_build_object('id', l.id, 'key', l.key, 'team', l.team, 'punkte', l.punkte, 'richtig', l.richtig,
                                          'zeit', l.erstellt, 'email', u.email) order by l.punkte desc)
                       from (select * from public.live_runden where erstellt > now() - interval '7 days' order by punkte desc limit 25) l
                       left join auth.users u on u.id = l.user_id), '[]'::jsonb),
      'total_7', (select count(*) from public.live_runden where erstellt > now() - interval '7 days'),
      'total', (select count(*) from public.live_runden)));
  end if;
  if to_regclass('public.duell_lobby') is not null then
    r := r || jsonb_build_object('duell', jsonb_build_object(
      'wartet', (select count(*) from public.duell_lobby where status = 'wartet' and aktiv > now() - interval '3 minutes'),
      'laeuft', (select count(*) from public.duell_lobby where status = 'laeuft' and aktiv > now() - interval '3 minutes'),
      'heute', (select count(*) from public.duell_lobby where erstellt::date = current_date),
      'offen', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'host', host_name, 'gast', gast_name, 'status', status,
                                            'host_score', host_score, 'gast_score', gast_score, 'n', n, 'cat', cat, 'stufe', stufe,
                                            'erstellt', erstellt, 'aktiv', aktiv) order by erstellt desc)
                         from (select * from public.duell_lobby order by erstellt desc limit 60) d), '[]'::jsonb)));
  end if;
  if to_regclass('public.region_punkte') is not null then
    r := r || jsonb_build_object('regionen', jsonb_build_object(
      'woche', public.region_woche(),
      'verlauf', coalesce((select jsonb_agg(jsonb_build_object('woche', woche, 'region', region, 'punkte', punkte, 'spiele', spiele) order by woche desc, region)
                           from public.region_punkte where woche >= public.region_woche(now() - interval '26 weeks')), '[]'::jsonb)));
  end if;
  return r;
end $$;
revoke all on function public.admin_spiele() from public;
grant execute on function public.admin_spiele() to authenticated;

-- Verdächtigen Live-Eintrag entfernen (zählt dann nicht mehr für das Team)
create or replace function public.admin_live_loeschen(p_id bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.ist_admin() then raise exception 'nur fuer Admins'; end if;
  delete from public.live_runden where id = p_id;
end $$;
revoke all on function public.admin_live_loeschen(bigint) from public;
grant execute on function public.admin_live_loeschen(bigint) to authenticated;

-- Duell beenden (z. B. bei unpassendem Namen): beide Seiten sehen, dass der Gegner weg ist
create or replace function public.admin_duell_beenden(p_id bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.ist_admin() then raise exception 'nur fuer Admins'; end if;
  update public.duell_lobby set status = 'weg', host_name = 'Gast', gast_name = case when gast_name is null then null else 'Gast' end where id = p_id;
end $$;
revoke all on function public.admin_duell_beenden(bigint) from public;
grant execute on function public.admin_duell_beenden(bigint) to authenticated;

-- Regionen-Cup korrigieren (z. B. nach Missbrauch): Punkte und Spiele einer Woche setzen
create or replace function public.admin_region_setzen(p_woche text, p_region text, p_punkte bigint, p_spiele integer) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.ist_admin() then raise exception 'nur fuer Admins'; end if;
  if p_woche !~ '^\d{4}-W\d{2}$' or p_region not in ('ds', 'ro', 'ti') then raise exception 'ungültig'; end if;
  insert into public.region_punkte (woche, region, punkte, spiele) values (p_woche, p_region, greatest(0, coalesce(p_punkte, 0)), greatest(0, coalesce(p_spiele, 0)))
  on conflict (woche, region) do update set punkte = excluded.punkte, spiele = excluded.spiele;
end $$;
revoke all on function public.admin_region_setzen(text, text, bigint, integer) from public;
grant execute on function public.admin_region_setzen(text, text, bigint, integer) to authenticated;

-- ---------- 5. Sicherheit ----------
create or replace function public.admin_sicherheit() returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare r jsonb := '{}'::jsonb;
begin
  if not public.ist_admin() then raise exception 'nur fuer Admins'; end if;
  r := jsonb_build_object(
    'bremse_arten', coalesce((select jsonb_agg(jsonb_build_object('art', art, 'n_24', n24, 'n_2', n2, 'wer', wer) order by n24 desc) from (
        select split_part(art, ':', 1) art, count(*) filter (where zeit > now() - interval '24 hours') n24, count(*) filter (where zeit > now() - interval '2 hours') n2,
               count(distinct wer) wer
        from public.bremse_log where zeit > now() - interval '48 hours' group by 1) t), '[]'::jsonb),
    'vielnutzer', coalesce((select jsonb_agg(jsonb_build_object('wer', case when wer like 'ip:%' then 'IP ' || substr(wer, 4, 8) else wer end,
                                                                'email', (select u.email from auth.users u where u.id::text = t.wer),
                                                                'n', n, 'arten', arten, 'zuletzt', zuletzt) order by n desc) from (
        select wer, count(*) n, string_agg(distinct split_part(art, ':', 1), ', ') arten, max(zeit) zuletzt
        from public.bremse_log where zeit > now() - interval '24 hours' group by wer order by count(*) desc limit 20) t), '[]'::jsonb),
    'gesperrt', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'email', email, 'bis', banned_until) order by banned_until desc)
                          from auth.users where banned_until > now()), '[]'::jsonb),
    'ausgeblendete_kommentare', case when to_regclass('public.kommentare') is null then 0 else (select count(*) from public.kommentare where gemeldet >= 3) end,
    'gesperrte_namen', (select count(*) from auth.users u where public.name_gesperrt(concat_ws(' ', u.raw_user_meta_data->>'vorname', u.raw_user_meta_data->>'nachname', u.raw_user_meta_data->>'name'))));
  if to_regclass('public.lehrer_fehlversuche') is not null then
    r := r || jsonb_build_object('lehrer_fehlversuche', jsonb_build_object(
      'n_24', (select count(*) from public.lehrer_fehlversuche where zeit > now() - interval '24 hours'),
      'n_7', (select count(*) from public.lehrer_fehlversuche where zeit > now() - interval '7 days'),
      'codes', coalesce((select jsonb_agg(jsonb_build_object('code', left(code, 3) || '…', 'n', n, 'zuletzt', z) order by n desc) from (
          select code, count(*) n, max(zeit) z from public.lehrer_fehlversuche where zeit > now() - interval '7 days' group by code order by count(*) desc limit 15) t), '[]'::jsonb)));
  end if;
  return r;
end $$;
revoke all on function public.admin_sicherheit() from public;
grant execute on function public.admin_sicherheit() to authenticated;
