> **Hinweis (Oktober 2026):** Supabase wird nicht mehr gebraucht. easyplay hat jetzt einen eigenen Server mit PostgreSQL bei Nine, siehe `ANLEITUNG-SERVER.md`. Die SQL-Dateien in `supabase/` bleiben die Grundlage: Der Server spielt sie beim Start selbst ein. Diese Anleitung gilt nur noch, falls jemand doch Supabase nutzen will.

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
7. `supabase/klassenliga.sql` (Klassen-Liga «Klasse gegen Klasse»: Wochen-Rangliste der Klassen)

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

## 7. Klassen-Liga einrichten (Datei `supabase/klassenliga.sql`)
Erst ausführen, wenn die Dateien 1 bis 6 aus Abschnitt 3 gelaufen sind (es braucht die Lehrer-Tabellen und `ist_admin()`).

1. In Supabase **SQL Editor → New query**.
2. Den ganzen Inhalt von `supabase/klassenliga.sql` einfügen und **Run** drücken. Mehrfaches Ausführen schadet nicht.
3. Das Skript legt an:
   - Tabelle `liga_klassen` (welche Klasse mit welchem Anzeigenamen und Kanton mitmacht), mit Zeilenschutz: Lehrpersonen lesen nur ihre eigenen Anmeldungen, niemand schreibt direkt.
   - `liga_anmelden(klasse, anzeigename, kanton)` und `liga_abmelden(klasse)`: nur für angemeldete Lehrpersonen und nur für eigene Klassen (mindestens 5 Kinder).
   - `liga_rangliste(woche, kanton)`: die öffentliche Rangliste. Sie gibt nur Werte pro Klasse heraus (Anzeigename, Kanton, Zyklus, Punkte pro Kind, Anzahl Kinder und aktive Kinder), keine Namen und keine einzelnen Resultate.
   - `liga_meine_klasse(test_code, pin)`: Kinder erfahren damit nach einem Test, in welcher Liga-Klasse sie sind.
   - `admin_liga_klassen()` und `admin_liga_sperren(liga_id, true/false)`: unpassende Anzeigenamen ausblenden (nur Admins, vorerst im SQL Editor, z. B. `select public.admin_liga_sperren('<liga_id>', true);` als angemeldeter Admin oder direkt `update public.liga_klassen set gesperrt = true where anzeige = '…';`).
4. Prüfen: Im Lehrerbereich links **Klassen-Liga** öffnen. Statt der Vorschau mit Beispieldaten erscheint «Meine Klassen in der Liga». Eine Klasse mit mindestens 5 Kindern anmelden; sobald ein Kind dieser Klasse einen Test abgibt, erscheint sie in der Rangliste.


## Sicherheit (Stand 24.10.2026)

- **Neu einrichten:** Die SQL-Dateien in dieser Reihenfolge ausführen: `schema.sql`, `lehrer.sql`, `admin.sql`, `lehrer2.sql`, `klassenliga.sql`, `live.sql`, `regionen.sql`, `duell.sql`.
- **Bestehende Datenbank nachrüsten:** einmal `supabase/sicherheit.sql` ausführen (alles in einer Transaktion, darf mehrfach laufen).
- **Lehrpersonen:** Wer sich als Lehrperson anmeldet, stellt nur einen Antrag. Freigeben in der Verwaltung unter «Benutzer» («Freigeben» beim Antrag). Bisherige Lehrpersonen nach dem Nachrüsten einmal freigeben.
- **Nach dem Einschalten prüfen:** In der Verwaltung unter «Zugang» auf «IP-Erkennung prüfen» klicken. Bei «genutzt» muss die eigene öffentliche IP stehen, sonst gelten die Mengenbremsen für alle Besucher gemeinsam.
