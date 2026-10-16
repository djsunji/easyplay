# Supabase einrichten (rund 15 Minuten)

Mit Supabase bekommt easyplay eine Online-Datenbank. Danach funktionieren:

- Konten auf allen Geräten (Anmeldung mit E-Mail, «Passwort vergessen»)
- Kommentare bei Qeels und Likes
- Lehrerbereich mit Klassen, Tests und Abgaben über mehrere Geräte
- Besucherstatistik, Benutzerverwaltung und Kommentar-Moderation in der Verwaltung (`/admin/`)

Supabase ist für ein Projekt dieser Grösse kostenlos (Free Plan).

## 1. Projekt anlegen
1. Auf <https://supabase.com> mit GitHub oder E-Mail anmelden.
2. **New project** wählen.
   - Name: `easyplay`
   - Database Password: ein sicheres Passwort erzeugen und im Passwortmanager speichern
   - Region: **Central EU (Frankfurt)** oder **West EU (Zurich)**, falls angeboten
3. Warten, bis das Projekt bereit ist (1 bis 2 Minuten).

## 2. Schlüssel in `config.js` eintragen
1. In Supabase: **Project Settings → API** (oder **Data API**).
2. Kopieren:
   - **Project URL**, z. B. `https://abcdefgh.supabase.co`
   - **anon public** Schlüssel (bei neuen Projekten heisst er **publishable key**)
3. In GitHub die Datei `config.js` öffnen, auf den Stift klicken und eintragen:
   ```js
   supabaseUrl: "https://abcdefgh.supabase.co",
   supabaseKey: "eyJ...",
   ```
4. **Niemals** den `service_role`- oder `secret`-Schlüssel eintragen. Er würde allen alles erlauben.

## 3. Datenbank vorbereiten
In Supabase **SQL Editor → New query**. Nacheinander den Inhalt dieser Dateien hineinkopieren und jeweils **Run** drücken:

1. `supabase/schema.sql` (Fragen, Likes, Kommentare)
2. `supabase/lehrer.sql` (Lehrerbereich)
3. `supabase/admin.sql` (Verwaltung und Statistik)
4. `supabase/live.sql` (Live-Quiz)
5. `supabase/duell.sql` (Online-Duell mit zufälligem Gegner)
6. `supabase/lehrer2.sql` (Lehrerbereich: offene Fragen korrigieren, Fehlermeldungen an die Verwaltung)

Jede Datei darf mehrmals ausgeführt werden, es geht nichts verloren.

## 4. Anmeldung einstellen
1. **Authentication → URL Configuration**
   - Site URL: `https://djsunji.github.io/easyplay/`
   - Redirect URLs: dieselbe Adresse hinzufügen
2. **Authentication → Providers → Email**: «Confirm email» eingeschaltet lassen.
3. Optional: E-Mail-Texte unter **Authentication → Email Templates** auf Deutsch anpassen.
4. Optional: Google, Facebook oder Apple, siehe `ANLEITUNG-LOGIN.md`.

## 5. Dich als Admin eintragen
1. Auf <https://djsunji.github.io/easyplay/> mit deiner E-Mail registrieren und die Bestätigungs-E-Mail anklicken.
2. Im **SQL Editor** ausführen (E-Mail anpassen):
   ```sql
   insert into public.admins (user_id) select id from auth.users where email = 'dejan.ehrbar@bluewin.ch';
   ```
3. Die Verwaltung öffnen (`/admin/`), unter **Zugang** bei Supabase mit derselben E-Mail anmelden.
   Dort muss «Admin» erscheinen.

## 6. Prüfen
- Verwaltung → Übersicht: Die Kennzahlen «Nutzung» erscheinen. Besucher werden ab jetzt gezählt.
- Verwaltung → Benutzer: dein Konto ist sichtbar.
- Auf der Website einen Kommentar bei einem Qeel schreiben und unter **Kommentare** ansehen.

## Gut zu wissen
- Die Besucherstatistik ist anonym: keine Cookies, keine IP-Adressen. Das steht auch in der Datenschutzerklärung.
- Supabase pausiert Gratis-Projekte nach einer Woche ohne Zugriffe. Mit Besuchern auf der Website passiert das nicht.
- Bei Fragen: in der Verwaltung unter **Zugang** steht die Kurzfassung dieser Anleitung.
