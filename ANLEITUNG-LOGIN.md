# Anmeldung einrichten: E-Mail, Google, Facebook und Apple

Ohne Einrichtung funktioniert die Registrierung mit E-Mail und Passwort nur **auf dem jeweiligen Gerät**
(das Passwort wird verschlüsselt im Browser gespeichert). Damit sich Kinder von überall anmelden können,
mit Bestätigungs-E-Mail, «Passwort vergessen» und Google/Facebook/Apple, braucht es **Supabase**.

## 1. Supabase verbinden
1. Auf supabase.com ein Projekt anlegen (falls noch nicht geschehen, siehe ANLEITUNG-DATENBANK.md).
2. In `config.js` die **Project URL** und den **öffentlichen Schlüssel (anon / publishable)** eintragen.
   Niemals den geheimen «service_role»-Schlüssel verwenden!
3. Supabase → **Authentication → URL Configuration**:
   - *Site URL*: die Adresse deiner Website, z. B. `https://deinname.github.io/easyplay/`
   - *Redirect URLs*: dieselbe Adresse hinzufügen.

Ab jetzt nutzt die Website automatisch die echte Anmeldung: Registrierung mit Bestätigungs-E-Mail,
Anmeldung von jedem Gerät und «Passwort vergessen».

## 2. E-Mail-Bestätigung
Supabase → **Authentication → Providers → Email**: «Confirm email» eingeschaltet lassen.
Unter **Authentication → Email Templates** kannst du die Texte auf Deutsch anpassen.
Für viele Anmeldungen empfiehlt Supabase einen eigenen E-Mail-Versand (SMTP), z. B. über Resend oder Brevo.

## 3. Google
1. console.cloud.google.com → neues Projekt → **APIs & Dienste → OAuth-Zustimmungsbildschirm** ausfüllen.
2. **Anmeldedaten → OAuth-Client-ID → Webanwendung**. Als «Autorisierte Weiterleitungs-URI» die
   Callback-Adresse aus Supabase eintragen (Supabase → Authentication → Providers → Google, dort steht sie).
3. Client-ID und Client-Secret in Supabase bei **Google** eintragen und aktivieren.

## 4. Facebook
1. developers.facebook.com → **App erstellen** → Produkt **Facebook Login** hinzufügen.
2. Bei «Gültige OAuth-Redirect-URIs» die Callback-Adresse aus Supabase eintragen.
3. App-ID und App-Geheimcode in Supabase bei **Facebook** eintragen und aktivieren. App auf «Live» stellen.

## 5. Apple
1. Braucht ein **Apple Developer Konto** (99 USD pro Jahr).
2. developer.apple.com → **Identifiers**: eine Services-ID mit «Sign in with Apple» anlegen,
   Domain und Callback-Adresse aus Supabase eintragen, einen Schlüssel (.p8) erstellen.
3. Services-ID, Team-ID, Key-ID und den Schlüssel in Supabase bei **Apple** eintragen.

## Wichtig bei Kindern
- Bei Kindern unter 16 Jahren sollten die Eltern zustimmen (Datenschutzgesetz der Schweiz, in der EU DSGVO).
  Die Registrierung fragt deshalb nach dem Einverständnis.
- Google, Facebook und Apple erlauben eigene Konten meist erst ab 13 Jahren. Jüngere Kinder registrieren sich
  am besten mit der E-Mail-Adresse der Eltern.
- Erstelle eine kurze Datenschutzerklärung (welche Daten, wofür, wie lange, Kontakt) und verlinke sie auf der Website.
