# easyplay: Absprache zwischen den Claude-Sitzungen

An diesem Repository arbeiten mehrere Claude-Sitzungen gleichzeitig, alle im Auftrag von Dejan.
Diese Datei ist der gemeinsame Kanal. Jede Sitzung liest sie vor der Arbeit und trägt ein, was sie tut.

## Regeln für alle Sitzungen

1. **Vor jeder Arbeit `git pull`.** Nie mit einem alten Stand weiterarbeiten, nie fremde Änderungen überschreiben.
2. **Unten bei «Gerade in Arbeit» eintragen**, welche Dateien oder Bereiche du anfasst, und den Eintrag nach dem Push wieder löschen. Ist ein Bereich belegt, erst nachfragen (Notiz unten oder SendMessage, wenn die andere Sitzung erreichbar ist).
3. **Version:** Bei jeder Änderung `VERSION` in `sw.js` hochzählen und `window.EP_BUILD` in `index.html` auf denselben Wert setzen. Format `ep-JJJJ-MM-TT-NN`. Immer vom aktuellen Stand auf GitHub aus um eins erhöhen.
4. **`qeels/index.html` nicht von Hand ändern.** Sie wird bei jedem Push aus `index.html` erzeugt (`tools/qeels_bauen.py`, Workflow `qeels.yml`).
5. **Kleine Commits** mit klarer deutscher Beschreibung, damit die andere Sitzung sieht, was passiert ist.
6. Nach dem Push kurz bei «Erledigt» eine Zeile eintragen (Datum, was, welche Dateien).

## Feste Wünsche von Dejan

- Antworten auf Deutsch, Schweizer Schreibweise: immer ss, nie ß.
- Keine Gedankenstriche.
- Keine Sexualkunde (auch keine Fortpflanzung, Verhütung, Missbrauch).
- Alles lesen und jede Seite besuchen ist erlaubt, nicht nachfragen. Direkt auf GitHub pushen.
- Handy und iPad: Startseite und Themen ohne Scrollen, Unterseiten dürfen scrollen.
- Ladebild bleibt, bis die neue Version sicher geladen ist. Die alte Seite darf nie erscheinen.

## Gerade in Arbeit

_(leer)_

## Notizen an die andere Sitzung

- 21.10., Sitzung «Hauptseite» (session_015F4ypguKCiePf7SvTB76p6): Hallo! Ich habe deine Qeels-Änderungen (#5 bis #10) übernommen und darauf aufgebaut. Auf der Hauptseite zeigen Kachel und Kopfzeile jetzt dein neues Qeels-Logo (verkleinert als `img/qeels-logo-klein.webp`). Bitte trag hier ein, woran du als Nächstes arbeitest, dann kommen wir uns nicht in die Quere.

## Erledigt (neueste oben)

- 21.10. Hauptseite: neues Qeels-Logo in Kachel und Kopfzeile; «pan» beim Thema der Woche entfernt (`index.html`, `startseite.js`, `stil.js`).
- 19.10. Schneller laden, Bibliothek Handy, Logos und lange Antworten im Quiz (`index.html`, `app.js`, `daten-08` bis `daten-10`, `img/eb`, `img/av`, `img/ch`, `img/wp`).
