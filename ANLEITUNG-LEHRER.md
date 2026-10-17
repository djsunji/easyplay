# Lehrerbereich von easyplay

Mit dem Lehrerbereich legen Lehrpersonen Klassen an, verteilen Tests mit einem Code, sehen die Resultate mit Schweizer Noten, eine Fehleranalyse und den Lernfortschritt über mehrere Wochen und drucken Arbeits- und Lösungsblätter als PDF.

## 1. So nutzen Lehrpersonen den Bereich

### Öffnen und anmelden
1. Den Lehrerbereich unter **https://djsunji.github.io/easyplay/lehrer/** öffnen (oder in easyplay im Menü auf **🎓 Lehrerbereich** tippen).
2. Mit dem easyplay-Konto anmelden oder ein neues Konto registrieren. Die Rolle «Lehrperson» wird im Konto gespeichert.
3. **Ausprobieren ohne Konto:** auf der Anmeldeseite **«Test-Zugang ausprobieren»** wählen (Benutzer `test@easyplay.ch`, Passwort `Lehrer-Test-2026`). Der Test-Zugang hat Beispielklassen, Beispieltests und Resultate. Alles bleibt nur auf diesem Gerät und lässt sich mit «Testdaten zurücksetzen» neu laden. Die Beispieltests (Codes BERG5A, WALD5A, WAHL6B) lassen sich auf demselben Gerät in easyplay mit Code und PIN lösen.

In der claude.ai-Fassung gilt automatisch die angemeldete claude.ai-Person als Lehrperson.

### Klasse anlegen
1. Im Lehrerbereich unter **«Neue Klasse anlegen»** Namen (z. B. «4b Lindenhof»), Schuljahr und Zyklus wählen.
2. In der Klasse die Kinder eintragen: **nur Vorname oder Kürzel**, eines pro Zeile (z. B. «Lena», «Mia S.», «LM»).
3. easyplay erzeugt für jedes Kind einen **PIN**. Mit **«PIN-Kärtchen (PDF)»** druckst du Kärtchen zum Ausschneiden.
4. Mit 🔁 bekommt ein Kind einen neuen PIN, mit 🗑️ wird es entfernt.

### Test erstellen und verteilen
1. **«Neuer Test»** oder in der Klasse **«Test für diese Klasse»**.
2. Thema oder ganzen Bereich wählen, optional Unterthema (Stichwort) und Stufe (Entdecker, Könner, Profis).
3. **Zufällig**: Anzahl eingeben und «Fragen ziehen». **Selbst auswählen**: suchen und Fragen anhaken. Einzelne Fragen lassen sich wieder entfernen (höchstens 50 pro Test).
4. **Lehrplan 21**: easyplay schlägt passend zu Thema und Zyklus Kompetenzbereiche vor (z. B. «NMG.2 Tiere, Pflanzen und Lebensräume erkunden und erhalten» oder «RZG.7 Geschichtskultur analysieren und nutzen»). Du kannst Vorschläge entfernen und weitere Fachbereiche wählen.
5. **«Test erstellen»**: Der Test bekommt einen **Test-Code mit 6 Zeichen** und einen Link (`…#test=CODE`).
6. Den Link teilen oder den Code an die Wandtafel schreiben. Die Kinder tippen auf der Startseite auf **«🔢 Test mit Code starten»**, geben Test-Code und PIN ein und lösen den Test. Erklärungen sehen sie erst nach der Abgabe.
7. Mit dem Schalter **«Test ist offen»** schliesst du den Test, sobald alle fertig sind.

### Auswerten
- **Resultate**: Punkte, Note, Zeit und Datum pro Kind, dazu Durchschnitt. Die Note wird nach der Schweizer Skala berechnet: **Note = 5 × Punkte / Maximum + 1**, auf halbe Noten gerundet (4 ist genügend).
- **↩️ Abgabe löschen**: Das Kind kann den Test danach nochmals lösen.
- **Fehleranalyse**: Fragen sortiert nach Fehlerquote mit der häufigsten falschen Antwort, pro Test und für die ganze Klasse. Pro Kind siehst du die Themen mit den meisten Fehlern und alle falsch beantworteten Fragen.
- **Lernfortschritt**: Liniendiagramm mit der Durchschnittsnote pro Woche (Klasse und einzelnes Kind) und eine Tabelle Kinder × Tests.

### Arbeitsblatt und Lösungsblatt
Im Test auf **«Arbeitsblatt (PDF)»** oder **«Lösungsblatt (PDF)»** tippen. Das Arbeitsblatt hat einen Kopf mit Klasse, Datum, Test-Code und einer Linie für den Namen sowie nummerierte Fragen mit Ankreuzfeldern a bis d. Das Lösungsblatt markiert die richtige Antwort grün und zeigt die Erklärung. Für die PDF-Erzeugung braucht es eine Internetverbindung (jsPDF wird beim ersten Mal geladen).

### Datenschutz
- Nur Vornamen oder Kürzel erfassen, keine Nachnamen, Geburtsdaten, E-Mail-Adressen oder Fotos.
- Kinder haben kein Konto und brauchen keine E-Mail. Sie melden sich nur mit Test-Code und PIN an.
- Die PINs nicht öffentlich aushängen. Nach 20 falschen PIN-Eingaben in 10 Minuten wird ein Test-Code (mit Supabase) kurz gesperrt.
- Klassen am Ende des Schuljahres löschen (in der Klasse: «Klasse löschen»). Dabei werden auch Tests und Resultate gelöscht.

## 2. Wo werden die Daten gespeichert?

easyplay wählt den Speicher automatisch:

| Fassung | Speicher | Geeignet für |
|---|---|---|
| Website mit Supabase (`config.js` ausgefüllt) | Supabase-Datenbank | Lehrperson und Kinder auf **verschiedenen Geräten** (empfohlen) |
| claude.ai-Artifact | Datenbank des Artifacts | Lehrperson mit Editor-Rechten, Kinder mit eigenem claude.ai-Zugang |
| Website ohne Supabase | Browser des Geräts (localStorage) | Ein **gemeinsames Gerät**, z. B. ein Tablet im Schulzimmer |

Ohne Supabase zeigt der Lehrerbereich einen Hinweis: Alles bleibt im Browser dieses Geräts. Kinder müssen den Test dann am selben Gerät lösen, und beim Löschen der Browserdaten ist alles weg.

## 3. Supabase für den Lehrerbereich einrichten

Voraussetzung: Supabase ist für easyplay schon verbunden (siehe ANLEITUNG-DATENBANK.md und ANLEITUNG-LOGIN.md), d. h. in `config.js` stehen `supabaseUrl` und der öffentliche Schlüssel (`supabaseKey`).

1. Im Supabase-Dashboard links **SQL Editor** öffnen.
2. Den ganzen Inhalt von **`lehrer.sql`** einfügen und auf **Run** klicken. Das Skript darf mehrfach ausgeführt werden.
3. Fertig. Es legt an:
   - Tabellen `lehrer_klassen`, `lehrer_schueler`, `lehrer_tests`, `lehrer_abgaben` (und intern `lehrer_fehlversuche`),
   - Zeilenschutz (RLS): Jede Lehrperson sieht und ändert **nur ihre eigenen** Klassen, Kinder, Tests und Abgaben,
   - die Funktionen `test_laden(test_code, pin)` und `abgabe_einreichen(test_code, pin, antworten, dauer_ms)`. Damit laden Kinder **ohne Konto** einen Test und geben ihn ab. Der Server prüft Code und PIN, wertet die Antworten selbst aus und gibt die Lösungen erst nach der Abgabe heraus.
4. Neue Dateien hochladen: `index.html` (mit eingebautem `<script src="lehrer.js"></script>`), `lehrer.js` und `config.js`.

Testen: Als Lehrperson anmelden, eine Klasse mit einem Test-Kind anlegen, einen kurzen Test erstellen und ihn in einem privaten Fenster (ohne Anmeldung) mit Code und PIN lösen. Das Resultat erscheint danach im Lehrerbereich unter «Resultate aktualisieren».

**Wichtig:** Nur den öffentlichen Schlüssel (anon bzw. publishable) in `config.js` eintragen, nie den geheimen `service_role`-Schlüssel.

## 4. Einbau in die Website (für Entwickler)

`einbau_lehrer.py` fügt `<script src="lehrer.js"></script>` vor `</body>` in `index.html` und `lernspiel.html` ein (mehrfaches Ausführen ändert nichts):

```
python3 einbau_lehrer.py              # beide Fassungen
python3 einbau_lehrer.py --pruefen    # nur anzeigen
python3 einbau_lehrer.py --kopieren   # lehrer.js, lehrer.sql und diese Anleitung daneben kopieren
```

`lehrer.js` hängt sich zur Laufzeit an `go()`/`render()`, das Menü, die Startseite und das Profil. Neue Seiten: `lehrer`, `lklasse`, `lkind`, `ltestneu`, `ltest` (Lehrperson) sowie `lcode`, `lspiel`, `lfertig` (Kinder).

## Neu im Oktober 2026

- **Eigene Adresse:** Der Lehrerbereich öffnet sich unter `…/lehrer/` (oder `index.html#lehrer`) in schlichter Verwaltungs-Ansicht, ohne Figuren und Effekte. Links: Übersicht, Kinder, Neuer Test, Fragendatenbank, Bibliothek, Fehlermeldungen.
- **Eigene Fragen:** Beim Erstellen eines Tests kannst du Fragen selbst schreiben, mit vier Antworten oder als offene Frage. Jede Frage aus der Datenbank kannst du bearbeiten (Fragetext ändern) und als offene Frage stellen. Mit «Ohne Auswahlantworten» wird der ganze Test offen.
- **Offene Fragen korrigieren:** Nach der Abgabe erscheint in den Resultaten «korrigieren». Du siehst die Antwort des Kindes und die Musterlösung und vergibst Punkte (auch halbe). Die Note wird neu berechnet.
- **Prüfung als PDF:** Nach dem Erstellen wird automatisch eine schlichte Prüfung als PDF gespeichert (Kopf mit Name, Klasse, Datum, Punkten und Note, ohne Logo). Prüfung und Lösungsblatt lassen sich jederzeit nochmals herunterladen.
- **Kinder:** Übersicht aller Kinder mit Ø Note, letzter Note, Trend und dem Thema mit den meisten Fehlern; Kinder direkt erfassen.
- **Fragendatenbank und Bibliothek:** nur lesen. Bei jedem Eintrag gibt es «Fehler melden». Mit Supabase (`supabase/lehrer2.sql`) landen die Meldungen in der Verwaltung unter «Fehlermeldungen», sonst sendest du sie per E-Mail.
- **Klassen-Liga («Klasse gegen Klasse»):** Im Lehrerbereich links **Klassen-Liga**. Du meldest eine Klasse freiwillig mit einem Anzeigenamen an (z. B. «5b Solothurn», ohne Kindernamen) und wählst den Kanton. Jede Kalenderwoche (Montag bis Sonntag) zählen die Testpunkte aller Kinder der Klasse (pro Kind höchstens 150), geteilt durch die Anzahl eingetragener Kinder. So sind kleine und grosse Klassen vergleichbar. Es gibt eine Rangliste für diese Woche und die Vorwoche, einen Kantons-Filter, deine Klassen sind farbig umrandet, und die drei besten Klassen bekommen ein Gold-, Silber- oder Bronze-Abzeichen. Mitmachen können Klassen ab 5 Kindern. Die Kinder sehen nach einem Test und in ihrem Profil den Platz ihrer Klasse mit einem Fortschrittsbalken. Die Liga braucht Supabase (`supabase/klassenliga.sql`, siehe ANLEITUNG-SUPABASE.md, Schritt 7); ohne Online-Datenbank zeigt die Seite eine Vorschau mit Beispieldaten.


## Lehrplan 21

Unter **Tests › Lehrplan 21** siehst du alle Fachbereiche des Lehrplans 21 als Karte mit den Zyklen 1 bis 3.
Jede Zelle zeigt, wie viele Kompetenzbereiche easyplay mit Fragen abdeckt und wie viele Fragen es dazu gibt.

1. Zyklus oben wählen (Zyklus 1: KG bis 2. Klasse, Zyklus 2: 3. bis 6. Klasse, Zyklus 3: 7. bis 9. Klasse).
2. Einen Fachbereich antippen, zum Beispiel «Natur, Mensch, Gesellschaft».
3. Kompetenzbereiche ankreuzen (oder «Alle mit Fragen»).
4. «Test daraus erstellen»: Der neue Test ist mit Titel, Stufe, Thema und Lehrplan-Bezug vorbereitet. Fragen ziehen oder selbst auswählen, eigene Fragen ergänzen und speichern.

Die Zuordnung der easyplay-Themen zu den Kompetenzbereichen ist eine Annäherung. Prüfe die gezogenen Fragen vor dem Test kurz.
