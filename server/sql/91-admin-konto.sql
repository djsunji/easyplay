-- easyplay-Server: Admin-Konto von Dejan einmalig anlegen (26. Oktober 2026).
-- Legt das Konto nur an, wenn es die Adresse noch nicht gibt. Es ist sofort bestätigt und bekommt Admin-Rechte.
-- Gespeichert ist nur der Prüfwert des Passworts (scrypt), nie das Passwort selbst. Das Passwort kann
-- im Profil jederzeit geändert werden; diese Datei setzt es danach nicht zurück.
-- Admin-Rechte gibt es nur für ein Konto, das von dieser Datei angelegt wurde (Kennzeichen «angelegt»),
-- damit niemand die Adresse vorher selbst registrieren und so Admin werden kann.
insert into auth.users (email, encrypted_password, email_confirmed_at, raw_user_meta_data, raw_app_meta_data)
select 'dejan.ehrbar@bluewin.ch', 'scrypt$16384$8$1$6oEWjPmZub4B+5D0SI9MvA==$o6bRf9ENrs60lLSbhrb+HFeKjmaUE658U8qowR4Nlq3o8rteD5bxJqFBHMJ38kfzhg8S8gXRcDhdrkVuYdjZwQ==', now(),
       '{"vorname":"Dejan"}'::jsonb,
       '{"provider":"email","providers":["email"],"angelegt":"server/sql/91-admin-konto.sql"}'::jsonb
where not exists (select 1 from auth.users where lower(email) = 'dejan.ehrbar@bluewin.ch');

insert into public.admins (user_id)
select id from auth.users
where lower(email) = 'dejan.ehrbar@bluewin.ch' and raw_app_meta_data->>'angelegt' = 'server/sql/91-admin-konto.sql'
on conflict do nothing;
