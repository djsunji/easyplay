# easyplay als App (iPhone, iPad, Android)

Die App ist eine echte App mit allem eingebaut: alle Fragen, die ganze Bibliothek, alle Spiele und Welten. Sie läuft ohne Internet. Nur die Bilder der Bibliothek (672 MB) sind nicht dabei: sie kommen beim Anschauen aus dem Internet und bleiben danach im Gerät gespeichert.

Dazu echte App-Funktionen: Vibration bei richtig und falsch, das Teilen-Fenster des Geräts und Erinnerungen (Tagesquiz um 17:30, Serie um 19:00, wenn heute noch nicht gelernt). Die Erlaubnis für Mitteilungen fragt die App erst, wenn schon einmal gespielt wurde.

So entsteht die App:
- `app/www-bauen.py` kopiert die Website nach `app/www` (ohne `bilder/`, Verwaltung, Werkzeuge, Qeels-Einzelseite), setzt `app/native.js` als erstes Skript ein und holt die Schriften von Google in die App.
- `app/native.js` gibt es nur in der App: `window.EP_NATIV`, Bilder bei Bedarf, frische Korrekturen und Werbung von der Website, Vibration, Teilen, Erinnerungen.
- Im Website-Code heisst «läuft in der App» immer `window.EP_NATIV` (nicht `EP_APP`, das ist etwas anderes).

**Neue Inhalte kommen mit einem neuen App-Paket.** Änderungen an der Website (neue Fragen, Texte, Funktionen) sind erst nach einem neuen Bau in der App: Actions, **App iOS** oder **App Android**, **Run workflow**. Ausnahme: Korrekturen aus der Verwaltung (`korrektur/`) und die Werbung holt die App frisch von der Website, sobald Internet da ist.

Gebaut wird auf den Rechnern von GitHub (GitHub Actions), auch die iPhone-App auf einem Mac von GitHub. Ein eigener Mac ist nicht nötig.

- `.github/workflows/app-ios.yml`: baut die iPhone/iPad-App und lädt sie zu App Store Connect (TestFlight) hoch.
- `.github/workflows/app-android.yml`: baut die Android-App (AAB-Datei für Google Play).
- Beide laufen bei jeder Änderung in `app/` oder von Hand: GitHub, Repo easyplay, Reiter **Actions**, Ablauf wählen, **Run workflow**.
- App-Kennung (Bundle ID, Package Name): **ch.easyplay.app**. Sie lässt sich nach der ersten Veröffentlichung nicht mehr ändern.

## Schlüssel bei GitHub hinterlegen

GitHub, Repo easyplay, **Settings**, **Secrets and variables**, **Actions**, **New repository secret**. Name genau so schreiben, Wert einfügen.

### Android (Google Play)
| Name | Wert |
|---|---|
| `ANDROID_KEYSTORE_B64` | Inhalt der Datei `upload.jks.base64.txt` (von Claude erhalten) |
| `ANDROID_KEYSTORE_PASSWORD` | Inhalt der Datei `passwort.txt` (von Claude erhalten) |

Die Datei `upload.jks` und das Passwort zusätzlich sicher aufbewahren (Passwort-Manager). Geht der Schlüssel verloren, kann Google ihn zurücksetzen, das dauert aber einige Tage.

### iPhone/iPad (App Store)
1. **Bundle ID anlegen:** developer.apple.com, Account, **Certificates, Identifiers & Profiles**, **Identifiers**, **+**, **App IDs**, **App**. Beschreibung «easyplay», Bundle ID **Explicit**: `ch.easyplay.app`. Speichern.
2. **App anlegen:** appstoreconnect.apple.com, **Apps**, **+**, **Neue App**. Plattform iOS, Name «easyplay» (falls vergeben: «easyplay Lernen»), Sprache Deutsch, Bundle ID `ch.easyplay.app`, SKU `easyplay-1`.
3. **API-Schlüssel erstellen:** App Store Connect, **Benutzer und Zugriff**, **Integrationen**, **App Store Connect API**, **Team-Schlüssel**, **+**. Name «GitHub», Zugriff **Admin**. Die Datei `AuthKey_….p8` herunterladen (geht nur einmal!), dazu **Key ID** und oben die **Issuer ID** notieren.
4. **Team ID:** developer.apple.com, Account, **Membership details**, **Team ID** (10 Zeichen).
5. Bei GitHub als Secrets eintragen:

| Name | Wert |
|---|---|
| `APPLE_TEAM_ID` | Team ID |
| `ASC_KEY_ID` | Key ID |
| `ASC_ISSUER_ID` | Issuer ID |
| `ASC_KEY_P8` | ganzer Inhalt der .p8-Datei (mit den Zeilen BEGIN und END) |

## Veröffentlichen

### Android
1. Actions, **App Android**, **Run workflow**. Nach etwa 5 Minuten unten bei **Artifacts** die Datei `easyplay-android-…` herunterladen und entpacken (`app-release.aab`).
2. play.google.com/console, **App erstellen**: Name easyplay, Sprache Deutsch (Schweiz), App, kostenlos.
3. **Testen**, **Interner Test**, neuen Release erstellen, die AAB-Datei hochladen. Google Play App Signing annehmen.
4. Store-Eintrag, Inhaltseinstufung, Datenschutzerklärung (https://djsunji.github.io/easyplay/datenschutz.html), Zielgruppe ausfüllen. Danach Produktion beantragen.

### iPhone/iPad
1. Actions, **App iOS**, **Run workflow**. Nach etwa 10 bis 15 Minuten ist der Build in App Store Connect unter **TestFlight**.
2. In TestFlight auf dem eigenen iPhone testen (App «TestFlight» aus dem App Store).
3. App-Eintrag ausfüllen (Beschreibung, Bildschirmfotos, Datenschutz-Angaben, Altersfreigabe), Build auswählen, zur Prüfung einreichen.

## Wichtige Hinweise für die Prüfung
- **Kategorie:** «Bildung» wählen, nicht «Kinder». In der Kinder-Kategorie sind Werbung (Qeels-Sponsoren) und Links nach aussen kaum erlaubt.
- **Apple Regel 4.2 (Mindestfunktion):** Die App ist keine Website-Hülle: alles ist eingebaut und läuft ohne Internet, dazu Mitteilungen, Vibration und Teilen. Das im Prüfungsformular kurz erwähnen.
- **Google «Familien»-Richtlinie:** Wenn die Zielgruppe Kinder einschliesst, verlangt Google eine Datenschutzerklärung, die auf Kinder eingeht, und Werbung nur von zertifizierten Anbietern. Die eigenen Sponsoren-Qeels sind ohne Tracking, das kurz im Formular erklären.
