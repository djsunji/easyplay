-- easyplay: Adminbereich (Benutzerverwaltung, Statistik, Kommentare)
-- Im Supabase SQL Editor ausführen, NACH schema.sql (und lehrer.sql, falls genutzt).
-- Danach dich selbst als Admin eintragen (ganz unten).

-- ---------- Admins ----------
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  seit timestamptz not null default now()
);
alter table public.admins enable row level security;  -- keine Policy: nur über Funktionen

create or replace function public.ist_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
revoke all on function public.ist_admin() from public;
grant execute on function public.ist_admin() to authenticated;

-- ---------- Anonyme Besucherstatistik ----------
-- Gespeichert werden nur Tageszähler: Bereich der Seite, Gerätetyp, Herkunftsseite.
-- Besucher werden über einen täglich wechselnden Hash gezählt, die IP-Adresse wird nie gespeichert.
create table if not exists public.statistik_aufrufe (
  tag      date not null,
  bereich  text not null,
  geraet   text not null,
  herkunft text not null default '',
  n        integer not null default 0,
  primary key (tag, bereich, geraet, herkunft)
);
create table if not exists public.statistik_besucher (
  tag  date not null,
  wer  text not null,
  n    integer not null default 0,
  primary key (tag, wer)
);
alter table public.statistik_aufrufe enable row level security;
alter table public.statistik_besucher enable row level security;

create or replace function public.aufruf_zaehlen(p_bereich text, p_geraet text, p_herkunft text default '')
returns void language plpgsql security definer set search_path = public as $$
declare v_wer text := md5('easyplay-tag|' || current_date::text || '|' || public.aufrufer());
        v_n integer;
begin
  p_bereich := left(regexp_replace(lower(coalesce(p_bereich, '')), '[^a-z0-9_-]', '', 'g'), 30);
  if p_bereich = '' then p_bereich := 'start'; end if;
  if coalesce(p_geraet, '') not in ('handy', 'tablet', 'computer') then p_geraet := 'computer'; end if;
  p_herkunft := left(regexp_replace(lower(coalesce(p_herkunft, '')), '[^a-z0-9.-]', '', 'g'), 60);
  insert into public.statistik_besucher (tag, wer, n) values (current_date, v_wer, 1)
  on conflict (tag, wer) do update set n = public.statistik_besucher.n + 1
  returning n into v_n;
  if v_n > 500 then return; end if;  -- Bremse gegen künstliches Hochzählen
  insert into public.statistik_aufrufe (tag, bereich, geraet, herkunft, n) values (current_date, p_bereich, p_geraet, p_herkunft, 1)
  on conflict (tag, bereich, geraet, herkunft) do update set n = public.statistik_aufrufe.n + 1;
end $$;
revoke all on function public.aufruf_zaehlen(text, text, text) from public;
grant execute on function public.aufruf_zaehlen(text, text, text) to anon, authenticated;

-- Statistik älter als 2 Jahre löschen (beim Abruf durch den Admin)
create or replace function public.admin_statistik(p_tage integer default 30) returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare r jsonb := '{}'::jsonb; ab date := current_date - greatest(1, least(coalesce(p_tage, 30), 730)) + 1;
begin
  if not public.ist_admin() then raise exception 'nur fuer Admins'; end if;
  delete from public.statistik_aufrufe where tag < current_date - 730;
  delete from public.statistik_besucher where tag < current_date - 730;
  r := r || jsonb_build_object(
    'aufrufe_tage', coalesce((select jsonb_agg(jsonb_build_object('tag', tag, 'n', n) order by tag) from (select tag, sum(n) n from statistik_aufrufe where tag >= ab group by tag) t), '[]'),
    'besucher_tage', coalesce((select jsonb_agg(jsonb_build_object('tag', tag, 'n', n) order by tag) from (select tag, count(*) n from statistik_besucher where tag >= ab group by tag) t), '[]'),
    'bereiche', coalesce((select jsonb_agg(jsonb_build_object('k', bereich, 'n', n) order by n desc) from (select bereich, sum(n) n from statistik_aufrufe where tag >= ab group by bereich) t), '[]'),
    'geraete', coalesce((select jsonb_agg(jsonb_build_object('k', geraet, 'n', n) order by n desc) from (select geraet, sum(n) n from statistik_aufrufe where tag >= ab group by geraet) t), '[]'),
    'herkunft', coalesce((select jsonb_agg(jsonb_build_object('k', herkunft, 'n', n) order by n desc) from (select herkunft, sum(n) n from statistik_aufrufe where tag >= ab and herkunft <> '' group by herkunft order by 2 desc limit 20) t), '[]'),
    'benutzer', jsonb_build_object(
      'total', (select count(*) from auth.users),
      'neu_7', (select count(*) from auth.users where created_at > now() - interval '7 days'),
      'neu_30', (select count(*) from auth.users where created_at > now() - interval '30 days'),
      'aktiv_7', (select count(*) from auth.users where last_sign_in_at > now() - interval '7 days'),
      'aktiv_30', (select count(*) from auth.users where last_sign_in_at > now() - interval '30 days'),
      'unbestaetigt', (select count(*) from auth.users where email_confirmed_at is null),
      'gesperrt', (select count(*) from auth.users where banned_until > now()),
      'admins', (select count(*) from public.admins),
      'lehrpersonen', (select count(*) from auth.users where raw_user_meta_data->>'rolle' = 'lehrperson'),
      'neu_tage', coalesce((select jsonb_agg(jsonb_build_object('tag', tag, 'n', n) order by tag) from (select created_at::date tag, count(*) n from auth.users where created_at::date >= ab group by 1) t), '[]')
    )
  );
  if to_regclass('public.kommentare') is not null then
    r := r || jsonb_build_object('kommentare', (select jsonb_build_object('total', count(*), 'gemeldet', count(*) filter (where gemeldet > 0), 'ausgeblendet', count(*) filter (where gemeldet >= 3), 'neu_7', count(*) filter (where erstellt > now() - interval '7 days')) from public.kommentare));
  end if;
  if to_regclass('public.likes') is not null then
    r := r || jsonb_build_object('likes', (select coalesce(sum(n), 0) from public.likes));
  end if;
  if to_regclass('public.lehrer_tests') is not null then
    r := r || jsonb_build_object('lehrer', jsonb_build_object(
      'klassen', (select count(*) from public.lehrer_klassen),
      'kinder', (select count(*) from public.lehrer_schueler),
      'tests', (select count(*) from public.lehrer_tests),
      'abgaben', (select count(*) from public.lehrer_abgaben),
      'abgaben_7', (select count(*) from public.lehrer_abgaben where abgegeben > now() - interval '7 days')));
  end if;
  return r;
end $$;
revoke all on function public.admin_statistik(integer) from public;
grant execute on function public.admin_statistik(integer) to authenticated;

-- ---------- Benutzerverwaltung ----------
create or replace function public.admin_benutzer()
returns table (id uuid, email text, erstellt timestamptz, zuletzt timestamptz, bestaetigt boolean,
               gesperrt_bis timestamptz, rolle text, meta jsonb, anbieter text)
language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.ist_admin() then raise exception 'nur fuer Admins'; end if;
  return query
    select u.id, u.email::text, u.created_at, u.last_sign_in_at, u.email_confirmed_at is not null,
           u.banned_until,
           case when a.user_id is not null then 'admin' when u.raw_user_meta_data->>'rolle' = 'lehrperson' then 'lehrperson' else 'kind' end,
           coalesce(u.raw_user_meta_data, '{}'::jsonb) - 'pw' - 'password',
           coalesce(u.raw_app_meta_data->>'provider', 'email')
    from auth.users u left join public.admins a on a.user_id = u.id
    order by u.created_at desc;
end $$;
revoke all on function public.admin_benutzer() from public;
grant execute on function public.admin_benutzer() to authenticated;

create or replace function public.admin_benutzer_sperren(p_id uuid, p_tage integer) returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.ist_admin() then raise exception 'nur fuer Admins'; end if;
  if p_id = auth.uid() then raise exception 'du kannst dich nicht selbst sperren'; end if;
  update auth.users set banned_until = case when coalesce(p_tage, 0) > 0 then now() + make_interval(days => least(p_tage, 36500)) else null end
  where id = p_id;
end $$;
revoke all on function public.admin_benutzer_sperren(uuid, integer) from public;
grant execute on function public.admin_benutzer_sperren(uuid, integer) to authenticated;

create or replace function public.admin_benutzer_rolle(p_id uuid, p_rolle text) returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.ist_admin() then raise exception 'nur fuer Admins'; end if;
  if p_rolle not in ('kind', 'lehrperson', 'admin') then raise exception 'ungueltige Rolle'; end if;
  if p_id = auth.uid() and p_rolle <> 'admin' then raise exception 'du kannst dir die Admin-Rolle nicht selbst wegnehmen'; end if;
  if p_rolle = 'admin' then
    insert into public.admins (user_id) values (p_id) on conflict do nothing;
  else
    delete from public.admins where user_id = p_id;
    update auth.users set raw_user_meta_data = case when p_rolle = 'lehrperson'
      then coalesce(raw_user_meta_data, '{}'::jsonb) || '{"rolle":"lehrperson"}'::jsonb
      else coalesce(raw_user_meta_data, '{}'::jsonb) - 'rolle' end
    where id = p_id;
  end if;
end $$;
revoke all on function public.admin_benutzer_rolle(uuid, text) from public;
grant execute on function public.admin_benutzer_rolle(uuid, text) to authenticated;

create or replace function public.admin_benutzer_profil(p_id uuid, p_vorname text, p_nachname text, p_stufe integer) returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.ist_admin() then raise exception 'nur fuer Admins'; end if;
  update auth.users set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
    || jsonb_build_object('vorname', left(coalesce(p_vorname, ''), 40), 'nachname', left(coalesce(p_nachname, ''), 40),
                          'stufe', greatest(1, least(coalesce(p_stufe, 1), 3)))
  where id = p_id;
end $$;
revoke all on function public.admin_benutzer_profil(uuid, text, text, integer) from public;
grant execute on function public.admin_benutzer_profil(uuid, text, text, integer) to authenticated;

create or replace function public.admin_benutzer_loeschen(p_id uuid) returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.ist_admin() then raise exception 'nur fuer Admins'; end if;
  if p_id = auth.uid() then raise exception 'du kannst dich nicht selbst loeschen'; end if;
  if to_regclass('public.kommentare') is not null then
    execute 'delete from public.kommentare where wer = $1' using p_id;
  end if;
  delete from auth.users where id = p_id;
end $$;
revoke all on function public.admin_benutzer_loeschen(uuid) from public;
grant execute on function public.admin_benutzer_loeschen(uuid) to authenticated;

-- ---------- Kommentare moderieren ----------
create or replace function public.admin_kommentare(p_nur_gemeldet boolean default true, p_anzahl integer default 200)
returns table (id bigint, qeel text, name text, text text, gemeldet integer, erstellt timestamptz, wer uuid)
language plpgsql security definer set search_path = public as $$
begin
  if not public.ist_admin() then raise exception 'nur fuer Admins'; end if;
  return query select k.id, k.qeel, k.name, k.text, k.gemeldet, k.erstellt, k.wer from public.kommentare k
    where (not p_nur_gemeldet or k.gemeldet > 0) order by k.gemeldet desc, k.erstellt desc limit least(coalesce(p_anzahl, 200), 1000);
end $$;
revoke all on function public.admin_kommentare(boolean, integer) from public;
grant execute on function public.admin_kommentare(boolean, integer) to authenticated;

create or replace function public.admin_kommentar(p_id bigint, p_aktion text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.ist_admin() then raise exception 'nur fuer Admins'; end if;
  if p_aktion = 'loeschen' then
    delete from public.kommentare where id = p_id;
  elsif p_aktion = 'freigeben' then
    update public.kommentare set gemeldet = 0 where id = p_id;
    delete from public.kommentar_meldungen where kommentar = p_id;
  else
    raise exception 'unbekannte Aktion';
  end if;
end $$;
revoke all on function public.admin_kommentar(bigint, text) from public;
grant execute on function public.admin_kommentar(bigint, text) to authenticated;

-- ---------- Dich selbst als Admin eintragen ----------
-- 1. Auf der Website mit deiner E-Mail registrieren und bestätigen.
-- 2. Diese Zeile mit deiner E-Mail-Adresse ausführen:
-- insert into public.admins (user_id) select id from auth.users where email = 'deine@email.ch';
