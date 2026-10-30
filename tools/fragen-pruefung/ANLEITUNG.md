# Fragen prüfen (easyplay, Lernquiz für Kinder und Jugendliche in der Schweiz)

Jede Frage ist ein JSON-Objekt:
- `nr` Nummer, `t` Thema, `s` Unterthema
- `l` Stufe:
  - 1 = Entdecker, bis 9 Jahre, Primarschule 1. bis 3. Klasse
  - 2 = Könner, 10 bis 14 Jahre, 4. bis 8. Klasse
  - 3 = Profis, ab 15 Jahre, Oberstufe bis Lehre und Gymnasium
- `q` Frage
- `a` vier Antworten. **Die erste Antwort ist immer die richtige**, im Spiel werden sie gemischt.
- `e` Erklärung, die nach der Antwort erscheint

## Was du prüfst

1. **Sinn und Verständlichkeit.** Versteht ein Kind dieser Stufe auf Anhieb, was gefragt ist? Eine Frage wie «Was soll man bei einem fairen Versuch mit zwei Pflanzen nur ändern?» ist zu unklar: Der Fachbegriff fehlt, der Zusammenhang fehlt.
2. **Genau eine richtige Antwort.** Die erste Antwort stimmt sachlich. Keine der anderen Antworten ist auch richtig oder fast richtig. Die Antwort steht nicht schon in der Frage.
3. **Schwierigkeit passt zur Stufe.**
   - Profis (3): Eine interessierte Person mit guter Allgemeinbildung oder Gymnasialwissen soll die Frage lösen können. Zu schwer sind Fragen, die nur Fachleute beantworten können: Physiker, Chemikerinnen, Ärzte, Juristen, Spezialisten. Beispiele:
     - exakte Konstanten oder Werte, Formeln aus dem Studium
     - Fachbegriffe aus dem Hochschulstudium
     - obskure Jahreszahlen, Nebenfiguren
   - Könner (2): Wissen aus der 4. bis 8. Klasse.
   - Entdecker (1): einfache Wörter, Alltag eines Kindes bis 9 Jahre.
4. **Falsche Antworten sinnvoll.** Sie sind plausibel, aber klar falsch. Keine Witzantworten, die alles verraten. Keine zwei gleichen Antworten.
5. **Regeln.**
   - Schweizer Rechtschreibung: ss statt ß.
   - Keine Gedankenstriche (– oder —).
   - Keine Sexualkunde: keine Fortpflanzung beim Menschen, Verhütung, Geschlechtsorgane, Missbrauch. Fortpflanzung bei Tieren und Pflanzen ist erlaubt.
   - Nichts Unpassendes für Kinder.
6. **Erklärung** stimmt mit der richtigen Antwort überein.

Sei streng, aber fair. Die meisten Fragen sind in Ordnung, die meldest du **nicht**.

## Was du lieferst

Schreibe eine JSON-Datei, die nur ein Array mit den Fragen enthält, die ein Problem haben. Jedes Objekt hat diese Felder:

```json
{"nr": 123, "problem": "unklar|mehrdeutig|falsch|zu_schwer|zu_leicht|antworten|regel|erklaerung",
 "grund": "kurz, auf Deutsch",
 "aktion": "umschreiben|stufe|loeschen",
 "neu": {"q": "...", "a": ["richtig", "falsch", "falsch", "falsch"], "e": "..."},
 "stufe": 2}
```

### Aktionen

- **`umschreiben`**: Die Frage ist rettbar. `neu` enthält die verbesserte Frage für **dieselbe** Stufe.
  - Die erste Antwort bleibt die richtige.
  - Die Antworten sind kurz.
  - Stil kindgerecht, Schweizer Schreibweise, keine Gedankenstriche.
- **`stufe`**: Die Frage ist gut, passt aber besser auf eine andere Stufe. In `stufe` steht die neue Stufe, `neu` lässt du weg. Bei «nur für Fachleute» verwendest du nicht `stufe`, sondern `umschreiben` (einfacher machen) oder `loeschen`.
- **`loeschen`**: Die Frage ist nicht zu retten oder doppelt.

Antworte am Schluss nur mit einer kurzen Zusammenfassung: wie viele Fragen gemeldet und wie viele je Problem.
