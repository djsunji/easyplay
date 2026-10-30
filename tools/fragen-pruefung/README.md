# Fragen-Rework: alle Quizfragen prüfen und verbessern

Arbeitsauftrag für eine eigene Claude-Sitzung «Fragen-Rework». Zuerst `CLAUDE.md` im Repo lesen und die Regeln dort befolgen.

## Ziel

Alle 129'033 Fragen in `fragen-*.json` prüfen:
- Machen sie Sinn, und sind sie verständlich?
- Gibt es genau eine richtige Antwort?
- Passen sie zur Stufe?
- Halten sie Dejans Regeln ein? Das heisst: ss statt ß, keine Gedankenstriche, keine Sexualkunde.

Dejans Hauptanliegen: Auf der Stufe Profis gibt es Fragen, die nur Fachleute lösen können, zum Beispiel Physiker oder Wissenschaftler. Profis heisst ab 15 Jahre. Eine Frage soll mit guter Allgemeinbildung oder Gymnasialwissen lösbar sein.

## Stand (29.10.2026, Sitzung «Hauptseite»)

Probelauf mit 600 zufälligen Fragen:
- 200 Profi-Fragen aus Physik, Chemie, Wissenschaft, Weltall, Mathe, Technik, Informatik, Erde und Körper
- 100 übrige Profi-Fragen
- je 150 Könner- und Entdecker-Fragen

Ergebnis:
- **Gemeldet:** 138 von 600 (23 %).
  - Profis: 88 von 300 (29 %), fast alles «zu schwer».
  - Profis in Physik, Chemie, Wissenschaft und den anderen Fächern oben: 57 von 200.
  - Könner: 36 von 150, meist «falsche Stufe».
  - Entdecker: 14 von 150, meist «falsche Stufe».
- **Aktionen:** 123 umschreiben, 32 Stufe ändern, 3 löschen.
- **Hochrechnung:** etwa 30'000 Änderungen insgesamt, davon Profis rund 12'000, Könner 11'000 und Entdecker 3'500.
- **Ansicht für Dejan:** Artifact «Fragen-Probelauf» (https://claude.ai/artifact/9Pp9xGUBXVjrbGn1RrArGL).

Dateien hier:
- `ANLEITUNG.md`: Prüfregeln und Ausgabeformat für die Prüf-Helfer. So wurde der Probelauf gemacht.
- `probelauf-paket-1..3.json`: die 600 geprüften Fragen.
- `probelauf-ergebnis.json`: die 138 Meldungen mit Originalfrage (`alt`) und Vorschlag (`neu` bzw. `stufe`).

## Offen: Entscheide von Dejan, bevor der grosse Lauf startet

1. **Massstab:** Stimmt das Niveau der Profi-Vorschläge, oder sind die neuen Fragen schon zu leicht?
2. **Umschreiben oder löschen:** Beim Umschreiben entsteht oft eine ganz neue Frage zum gleichen Thema, zum Beispiel Gasturbine statt Joule-Prozess. Soll das so bleiben, oder sollen zu schwere Fragen eher gelöscht werden?

## Vorgehen für den grossen Lauf

1. **Bei Dejan klären:** Die Entscheide oben einholen. Danach `ANLEITUNG.md` anpassen.
2. **Pakete bilden:** Die Fragen in Pakete zu je 200 aufteilen, Stufe für Stufe. Zuerst Profis, dann Könner, dann Entdecker. Das sind etwa 650 Pakete. Die Prüf-Helfer laufen parallel und schreiben `ergebnis-N.json`.
3. **Doppelte prüfen:** Neue oder umgeschriebene Fragen dürfen keine bestehende Frage doppeln. Dafür die Frage normalisiert vergleichen und die richtige Antwort mit dem Thema abgleichen.
4. **Einbauen:**
   - Nur `q`, `a`, `e` und `l` ändern. `nr` bleibt gleich, damit Spielstände, Fehlerlisten und Statistiken stimmen.
   - Die erste Antwort ist immer die richtige.
   - Gelöschte Fragen ganz aus der Datei entfernen.
   - Das Format der Datei beibehalten.
   - Danach `welten/i18n/fr/q-*.json` für dieselben Nummern anpassen. Geänderte Fragen neu übersetzen, gelöschte entfernen.
   - In die App kommen die neuen Fragen erst mit einem neuen App-Bau.
5. **Pushen:** Stufe für Stufe in eigenen Pushes. Version hochzählen und in `CLAUDE.md` unter «Erledigt» eintragen.
6. **Für Dejan:** Eine Liste der unsicheren Fälle, also Fakten, die die Prüf-Helfer nicht sicher beurteilen konnten. Dazu die Bilder-Fragen, die sich ohne Bild nicht prüfen lassen.
