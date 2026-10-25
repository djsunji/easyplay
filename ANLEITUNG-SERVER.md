# easyplay-Server bei Nine (Deploio)

Der eigene Server ersetzt Supabase. Er ist ein einziges Programm (Ordner `server/`) und macht drei Dinge:

- **Website ausliefern:** alle Dateien aus dem Repo, mit Komprimierung.
- **Anmeldung** (`/auth/v1/…`): E-Mail und Passwort, Bestätigungsmail, «Passwort vergessen», Google und Apple.
- **Daten** (`/rest/v1/…`): Lehrerbereich, Klassen-Liga, Duell, Live-Quiz, Kommentare, Likes, Regionen, Fehlermeldungen, Statistik und Verwaltung, mit einer PostgreSQL-Datenbank.

Die Website spricht mit dem Server über `datenbank.js`. Der Server versteht dieselben Aufrufe wie früher Supabase, darum blieb der übrige Code fast gleich. Die Datenbank richtet er beim Start selbst ein: zuerst `server/sql/00-auth.sql`, danach die Dateien in `supabase/` (Reihenfolge in `server/db.js`). Eine geänderte Datei läuft beim nächsten Start nochmals.

**Wo was gilt**
- Läuft die Website auf dem eigenen Server, ist alles Online automatisch an (`config.js`).
- Auf GitHub Pages bleibt alles nur auf dem Gerät, wie bisher.
- Die App nutzt den Server, sobald in `config.js` bei `EP_SERVER_APP` die Adresse steht.
- Die Fragen kommen weiter aus den Dateien `fragen-*.json`, nicht aus der Datenbank.

## 1. Datenbank anlegen

Im Deploio-Cockpit eine **PostgreSQL**-Datenbank anlegen. «Economy» reicht für den Anfang, mit täglicher Sicherung. Die Verbindungsadresse (beginnt mit `postgres://`) brauchst du in Schritt 3 als `DATABASE_URL`.

Der Datenbank-Benutzer braucht keine besonderen Rechte. Rollen wie bei Supabase sind nicht nötig: Der Server prüft die Rechte selbst.

## 2. App anlegen

Im Cockpit eine neue **App** anlegen:
- Git-Repository `https://github.com/djsunji/easyplay`, Zweig `main`.
- Deploio findet das `Dockerfile` im Repo und baut daraus. Bei jedem Push auf `main` baut es neu (etwa 10 Minuten).
- Grösse: «micro» genügt für den Anfang.
- Gesundheitsprüfung: `/api/health`, Port 8080.

Domain: im Reiter **Hosts** `easyplay.ch` und `www.easyplay.ch` eintragen (www leitet der Server auf easyplay.ch um). Beim Domain-Anbieter einen TXT-Eintrag (Wert aus dem Cockpit) und einen CNAME auf die Adresse mit `deploio.app` setzen (für die Domain ohne «www» ein ALIAS-Eintrag). AAAA-Einträge löschen. Das Zertifikat holt Deploio selbst.

## 3. Einstellungen (Umgebungsvariablen der App)

| Name | Wert | Pflicht |
|---|---|---|
| `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` | aus dem Reiter **Zugang** der Datenbank: FQDN, Port, Datenbankname, Benutzername, Passwort (unter «Zugangsdaten»). Alternativ eine einzige `DATABASE_URL` (`postgres://…`). | ja |
| `JWT_SECRET` | langer Zufallstext, mindestens 32 Zeichen (z. B. `openssl rand -base64 48`). Nie ändern, sonst sind alle abgemeldet. | ja |
| `PUBLIC_URL` | die eigene Adresse, `https://easyplay.ch` | ja |
| `SITE_URLS` | weitere Adressen, die zum Server dürfen, mit Komma, `https://www.easyplay.ch` | nein |
| `ADMIN_EMAIL` | E-Mail-Adresse(n) der Verwaltung, mit Komma. Sobald das Konto existiert, bekommt es beim nächsten Start Admin-Rechte. | ja |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Postausgang deines Mail-Anbieters (meist Port 587 oder 465) | für Mails |
| `MAIL_FROM` | Absender, z. B. `easyplay <noreply@easyplay.ch>` | für Mails |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | aus Schritt 4 | für Google |
| `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` | aus Schritt 5 | für Apple |

Ohne `SMTP_HOST` verschickt der Server keine Mails: Neue Konten gelten dann sofort als bestätigt, und «Passwort vergessen» geht nicht. `JWT_SECRET`, `SMTP_PASS`, `GOOGLE_CLIENT_SECRET` und `APPLE_PRIVATE_KEY` im Cockpit als **geheim** markieren.

## 4. Anmeldung mit Google

1. console.cloud.google.com, neues Projekt «easyplay».
2. **APIs und Dienste**, **OAuth-Zustimmungsbildschirm**: extern, App-Name easyplay, Support-Mail, Logo, Datenschutz-Link `https://easyplay.ch/datenschutz.html`.
3. **Anmeldedaten**, **OAuth-Client-ID**, Typ **Webanwendung**.
   - Autorisierte JavaScript-Quelle: `https://easyplay.ch`
   - Autorisierte Weiterleitungs-URI: `https://easyplay.ch/auth/v1/callback`
4. Client-ID und Clientschlüssel als `GOOGLE_CLIENT_ID` und `GOOGLE_CLIENT_SECRET` eintragen.

## 5. Anmeldung mit Apple

1. developer.apple.com, **Certificates, Identifiers & Profiles**, **Identifiers**, **+**, **Services IDs**. Beschreibung «easyplay Web», Kennung z. B. `ch.easyplay.web`. Das ist `APPLE_CLIENT_ID`.
2. Die Services ID öffnen, **Sign in with Apple** einschalten, **Configure**:
   - Primary App ID: `ch.easyplay.app`
   - Domain: `easyplay.ch`
   - Return URL: `https://easyplay.ch/auth/v1/callback`
3. **Keys**, **+**, Name «easyplay Anmeldung», **Sign in with Apple** anhaken (Primary App ID `ch.easyplay.app`). Die Datei `AuthKey_….p8` herunterladen (geht nur einmal).
4. Eintragen:
   - `APPLE_KEY_ID`: die Key ID.
   - `APPLE_TEAM_ID`: die Team ID (oben rechts im Konto).
   - `APPLE_PRIVATE_KEY`: der ganze Inhalt der .p8-Datei, mit den Zeilen BEGIN und END.

In der App gibt es nur die Anmeldung mit E-Mail. Apple verlangt «Mit Apple anmelden» nur, wenn eine App andere Anmeldungen wie Google anbietet.

## 6. Testsystem (empfohlen)

Wie bei ATPLReady:
- Eine zweite App `easyplay-test` mit eigener Datenbank, die jeden Push auf `main` baut, unter z. B. `test.easyplay.ch`.
- Die richtige App baut nur einen festen Stand, zum Beispiel einen Zweig `produktiv` oder eine Version `v…`.
- Freigeben heisst dann: den geprüften Stand auf diesen Zweig schieben.

## 7. Umzug von GitHub Pages

Sobald `https://easyplay.ch/api/health` antwortet, leitet die alte Adresse `djsunji.github.io/easyplay` jeden Besuch nach easyplay.ch weiter und nimmt den Spielstand einmal mit (`index.html`, Skript «Umzug nach easyplay.ch»).
- Übernommen wird er nur auf einem Gerät, das auf easyplay.ch noch keinen Spielstand hat.
- Lehrer-Passwort, Anmeldung und Zwischenspeicher gehen nicht mit.
- Die alte Seite bleibt mit `?bleiben` erreichbar.
- GitHub Pages darum eingeschaltet lassen, solange alte Links und Startbildschirm-Symbole im Umlauf sind.

## 8. Prüfen

- `https://easyplay.ch/api/health` zeigt `{"ok":true}`.
- `https://easyplay.ch/auth/v1/settings` zeigt, welche Anmeldungen an sind.
- Konto registrieren, Bestätigungsmail öffnen, anmelden. In der Verwaltung (`/admin/`) unter «Zugang» mit dem Konto aus `ADMIN_EMAIL` anmelden.

## Für Entwickler

- Lokal starten: `cd server && npm install && DATABASE_URL=… JWT_SECRET=… PUBLIC_URL=http://localhost:8090 PORT=8090 node index.js`
- Tests gegen einen laufenden Server: `TEST_URL=http://localhost:8090 MAIL_TEST_DATEI=/tmp/mails.jsonl DATABASE_URL=… node --test server/test/`
  - Der Server läuft dabei mit `MAIL_TEST_DATEI`, `SMTP_HOST=x`, `MAIL_FROM=x` und `BREMSE_FAKTOR=100`.
- Neue SQL-Funktion für die Website: in eine Datei in `supabase/` schreiben, mit `grant execute on function … to anon, authenticated` (oder nur `authenticated`). Nur so freigegebene Funktionen kann die Website aufrufen.
- Neue Tabelle, die die Website direkt liest oder schreibt: Regel in `server/rest.js` (`REGELN`) ergänzen. Ohne Regel ist die Tabelle von aussen nicht erreichbar.

## Verwaltung (easyplay.ch/admin)

- Anmelden unter «Zugang» mit einem Konto, das Admin ist (`ADMIN_EMAIL`, siehe oben, oder Eintrag in `public.admins`).
- Die Datenbank-Teile der Verwaltung stehen in `supabase/verwaltung.sql` (Protokoll, Hinweis an alle, Themenplan, Namen prüfen, Spiele, Sicherheit). Der Server spielt sie beim Start ein.
- Nur für Admins gibt es `/api/admin/status` (Zustand von Server, Datenbank, Mail, Anmelde-Anbietern), `/api/admin/testmail` und `/api/admin/sicherung` (alle Daten als JSON, ohne Passwörter).
- Jede Änderung über eine `admin_…`-Funktion hält der Server in `public.admin_protokoll` fest (Bereich «Protokoll»).
