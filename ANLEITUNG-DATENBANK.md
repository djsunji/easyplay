# Fragen-Datenbank für easyplay

Die Website lädt die Fragen beim Start aus einer eigenen Datenquelle:

1. **Supabase** – wenn in `config.js` URL und Schlüssel eingetragen sind (empfohlen für Tausende Fragen)
2. **fragen.json** – sonst die Datei im Repository
3. **eingebaute Fragen** – falls beides nicht erreichbar ist (z. B. wenn du `index.html` direkt vom Computer öffnest)

## Variante A: fragen.json (sofort einsatzbereit)
Lade `index.html`, `config.js` und `fragen.json` in dein Repository. Fertig.
Neue Fragen trägst du direkt in `fragen.json` ein und lädst die Datei neu hoch.

Aufbau einer Frage:
```json
{"t":"steuern","l":2,"q":"Frage?","a":["richtig","falsch","falsch","falsch"],"e":"Erklärung","m":"Merksatz","s":"Wikipedia-Stichwort"}
```
- `t` = Thema-Kürzel, `l` = Stufe (1 Entdecker, 2 Könner, 3 Profis)
- Die **erste Antwort ist immer die richtige** – die Reihenfolge wird im Spiel gemischt.
- Optional `img`: `"e:🚒"` (Emoji-Bild), `"w:ZH"` (Wappen), `"f:DE"` (Flagge), `"a:fuchs"` (Tier)

## Variante B: Supabase (echte Datenbank)
1. Kostenloses Konto auf **supabase.com** erstellen und ein neues Projekt anlegen (Region: Europa, z. B. Frankfurt oder Zürich, falls verfügbar).
2. Im Projekt links **SQL Editor** öffnen, den Inhalt von `supabase/schema.sql` einfügen und **Run** klicken.
3. Links **Table Editor** → Tabelle `fragen` → **Insert** → **Import data from CSV** → `fragen.csv` hochladen.
4. Unter **Project Settings → API** (bzw. „API Keys“) die **Project URL** und den **öffentlichen Schlüssel** (anon bzw. publishable) kopieren.
5. Beides in `config.js` eintragen und `config.js` auf GitHub hochladen.

Die Website lädt die Fragen jetzt aus Supabase. Neue Fragen fügst du im Table Editor hinzu – sie erscheinen sofort, ohne dass du die Website neu hochladen musst.

**Wichtig:** Nur den öffentlichen Schlüssel verwenden, nie den geheimen `service_role`- oder `secret`-Schlüssel. Die Sicherheitsregel in `schema.sql` sorgt dafür, dass über die Website nur gelesen, aber nichts verändert werden kann.

## Themen-Kürzel
Geschichte: g_urzeit, g_antike, g_mittelalter, g_neuzeit, ch_geschichte, kt_ZH … kt_JU
Politik: pol_welt, pol_demokratie, pol_kommunismus, pol_diktatur · Geografie: geo_schweiz, geo_europa, geo_welt
Religion: rel_christentum, rel_islam, rel_andere · Bilder: bilder
Natur & Wissen: natur, tiere, wissenschaft, koerper, physik
Schweiz, Geld & Leben: geld, banken, steuern, krankenkasse, medien, beruf · Alltag: alltag
