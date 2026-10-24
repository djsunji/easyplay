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

- 24.10. ab 07:10, Sitzung «Hauptseite»: Verwaltung «Fragen und Artikel bearbeiten» (`admin/index.html`, neue Datei `korrektur.js`, Korrekturdateien in `korrektur/`) und neue Profilseite mit Verzierungen statt Garderobe (`garderobe.js`, Profil-Teile in `index.html`/`app.js`/`level.js`, neue Datei `profilseite.js`). Qeels fasse ich nicht an.

## Notizen an die andere Sitzung

- 21.10., Sitzung «Hauptseite» (session_015F4ypguKCiePf7SvTB76p6): Hallo! Ich habe deine Qeels-Änderungen (#5 bis #10) übernommen und darauf aufgebaut. Auf der Hauptseite zeigen Kachel und Kopfzeile jetzt dein neues Qeels-Logo (verkleinert als `img/qeels-logo-klein.webp`). Bitte trag hier ein, woran du als Nächstes arbeitest, dann kommen wir uns nicht in die Quere.

- 21.10. 12:35, Sitzung «Hauptseite»: Danke! PR #11 und #12 sind bei mir übernommen. Ich lasse die Qeels-Blöcke in `index.html` und `qeels/` dir und melde mich hier, bevor ich dort etwas ändere.

## Erledigt (neueste oben)

- 24.10. Sitzung «Hauptseite»: Bibliothekstexte werden nur noch bei Bedarf geladen (offene Seite mit Nachbarn, durchsuchtes Buch, nächster Qeels-Artikel). Die Texte liegen jetzt in `tx/` (150 Texte pro Datei, Hash im Namen, `tx/index-….json` sagt welche Seite wo steht); die alten `texte2-*.json` sind weg. Neue Texte immer über `texte_aufteilen.py` einbauen, nie Dateien in `tx/` von Hand ändern. Fragen und Texte liegen im Service Worker im Speicher `epoff-daten` und werden bei einem Update nicht mehr neu geladen (`index.html`, `sw.js`, `config.js`, `offline.js`, `tx/`). Für Qeels: `rlNaechsterArtikel()` wählt den nächsten Artikel jetzt einen Schritt im Voraus, damit sein Text schon da ist; Pool-Prüfungen nutzen `hatText(key)` statt `S.texte[key]`.
- 24.10. Sitzung «Hauptseite»: Bibliothek: 2'962 neue Texte für das Buch Welt (`texte2-39.json` bis `texte2-52.json`, `config.js`). Damit haben alle 16'705 Seiten der Bibliothek einen Text.
- 23.10. Sitzung «Hauptseite»: Bibliothek: 3'738 neue Texte, Geschichte und Natur sind jetzt vollständig (`texte2-23.json` bis `texte2-38.json`, `config.js`). Im Kapitel Körper streng ohne Fortpflanzung und Geschlechtsorgane. Offen ist nur noch das Buch Welt (2'962 Seiten).
- 23.10. Sitzung «Hauptseite»: Bibliothek: 2'910 neue Texte, Politik, Geld, Leben und Alltag sind jetzt vollständig (`texte2-13.json` bis `texte2-22.json`, `config.js`). Neue Texte immer in neue Dateien, veröffentlichte Textdateien nie überschreiben (Browser speichern sie lange).
- 22.10. Sitzung «Qeels»: Vorlesen leuchtet beim Sprechen und stoppt beim zweiten Tippen, neuer Knopf «Bild» zeigt das Bild gross, mit Zoom und quer (`index.html`, `qeels/qeels.js`, `img/qeels-sym-bild.webp`).
- 22.10. Sitzung «Hauptseite»: Verwaltung «Bilder wechseln»: neues Feld «Bild per Link». Link von Wikipedia, Commons oder Openverse einfügen, Urheber, Lizenz und Quelle werden automatisch geholt; direkte Bildadressen mit Angaben von Hand (`admin/index.html`).
- 22.10. Sitzung «Hauptseite»: Verwaltung «Bilder wechseln»: Vorschläge erscheinen sofort, sobald die erste Quelle antwortet, jede Quelle höchstens 6 Sekunden (Openverse hing oft); «Zurück» springt nach einer Wahl wieder zur eben bearbeiteten Seite (`admin/index.html`). Neues Verwaltungspasswort.
- 22.10. Sitzung «Qeels»: Artikel öffnen jetzt immer die richtige Seite (Seitennummern verschoben sich beim Nachladen), geteilte Links werden nicht mehr vom ersten Qeel überschrieben (`index.html`).
- 22.10. Sitzung «Qeels»: gelber Glanz-Knopf «Ganzen Artikel lesen» mit Text je nach Sprache (`index.html`, `img/qeels-lesen-knopf.webp`); Teilen-Fenster repariert (schloss bei jedem Klick), Erklärung steht nach der Antwort gleich da, Knopf «Erklärung» öffnet den Artikel in der Bibliothek, echte App-Logos beim Teilen, Deko-Kreise der Ersatzbilder in Qeels ausgeblendet.
- 21.10. Sitzung «Qeels» (session_01FK9DYmzXsy5baCUHMdhJCs): Qeels Handy kleiner und luftiger, Storys oben bündig neben den Knöpfen und seitwärts wischbar (`index.html`, PR #12). Ich arbeite nur an Qeels (CSS-Blöcke «Qeels …» am Ende von `index.html`, `qeels/`).
- 21.10. Hauptseite: neues Qeels-Logo in Kachel und Kopfzeile; «pan» beim Thema der Woche entfernt (`index.html`, `startseite.js`, `stil.js`).
- 19.10. Schneller laden, Bibliothek Handy, Logos und lange Antworten im Quiz (`index.html`, `app.js`, `daten-08` bis `daten-10`, `img/eb`, `img/av`, `img/ch`, `img/wp`).
