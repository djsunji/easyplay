# easyplay, Fragen. Wissen. Weiterkommen.

Spielerische Lern-Website für Kinder und Jugendliche (6 bis 20 Jahre) mit über 22 000 Multiple-Choice-Fragen, vielen Schweiz-Themen und drei Stufen (Entdecker, Könner, Profis).

## Funktionen
- Training mit frei wählbarer Anzahl Fragen (1 bis 100), Erklärungen, Merksätzen und Wikipedia-Quellen
- Gewertete Tests (20 Fragen, 30 Minuten) mit Punkten, Rangliste und Top 10 der Schweiz
- Bereiche: Welt & Geschichte (inkl. Geografie, Politik, Religion, 26 Kantone), Natur & Wissen, Schweiz/Geld/Leben, Alltag
- Bilderfragen (Kantonswappen, Flaggen, Tiere, Emoji-Rätsel)
- Fragendatenbank mit Suche, alle Fragen wie in einer Bibliothek
- Eigene Tests erstellen, per Link verschicken und Resultate auswerten
- Live-Wettbewerb (nur auf claude.ai), Vorlesefunktion, Animationen
- Hintergründe: Alpenpanorama (mit Jahreszeiten und Tag/Nacht nach Schweizer Zeit), Farbwolken, Lern-Muster

## Dateien
| Datei | Zweck |
|---|---|
| `index.html` | Die komplette Website (Design, Code, Bilder und alle Fragen als Sicherheitsnetz) |
| `config.js` | Einstellungen für die Fragen-Datenbank (Supabase optional) |
| `fragen-1.json` bis `fragen-3.json` | Fragen-Datenbank (Variante A), wird beim Start geladen |
| `fragen-1.csv` bis `fragen-3.csv` | Dieselben Fragen zum Import in Supabase (Variante B) |
| `supabase/schema.sql` | Tabelle und Sicherheitsregeln für Supabase |
| `ANLEITUNG-DATENBANK.md` | Anleitung für die Fragen-Datenbank |
| `logo.png`, `logo-mit-kindern.png` | Logo-Vorlagen |

## Online stellen
GitHub Pages: Settings → Pages → „Deploy from a branch“ → Branch `main`, Ordner `/ (root)` → Save.
Alternativ Netlify oder Vercel (funktioniert auch mit privatem Repository).

## Funktioniert nur auf claude.ai
Diese Teile nutzen `window.claude.use(...)` und brauchen für die eigene Domain einen eigenen Dienst (z. B. Supabase):
gemeinsame Rangliste und Profile (`db`, `user`), Live-Wettbewerb (`room`), KI-Fragen-Werkstatt (`sample`).
Auf GitHub werden Profil, Statistik und eigene Tests lokal im Browser gespeichert.


## Dateien im Repository (Stand Oktober 2026)

| Datei | Wozu |
|---|---|
| `index.html` | Die ganze Website (Spiel, Bibliothek, Rangliste, Wettbewerb, Profil) |
| `config.js` | Einstellungen für Supabase (leer lassen = ohne Server) |
| `fragen-1.json` bis `fragen-3.json` | Alle Quizfragen, jede mit fester Nummer im Feld `nr` |
| `fragen-1.csv` bis `fragen-3.csv` | Dieselben Fragen als Tabelle, für den Import in Supabase (nacheinander importieren) |
| `texte.json` | Die Beschreibungstexte der Bibliothek |
| `logo.png`, `logo-mit-kindern.png` | Logos |
| `ANLEITUNG-DATENBANK.md` | Supabase für Fragen und Rangliste einrichten |
| `ANLEITUNG-LOGIN.md` | Anmeldung mit E-Mail, Google, Facebook und Apple einrichten |
| `supabase/schema.sql` | Tabellen für Supabase |

**Aktuelle Fragen und Texte:** In der claude.ai-Version unter Fragen-Werkstatt die Knöpfe «fragen.json exportieren» und «texte.json exportieren» nutzen und die Dateien hier ersetzen.


## Fragenummern

Jede Frage hat eine feste Nummer (Feld `nr` in fragen.json). Sie steht beim Spielen klein unten rechts in der Fragekarte, und unter «Suchen & Test erstellen» findet man eine Frage mit «Nr. 1234», «#1234» oder einfach «1234». Neue Fragen ohne `nr` erhalten automatisch eine feste sechsstellige Nummer.

## Bibliothekstexte

`texte-1.json` und `texte-2.json` enthalten die ausführlichen Texte aus der Datenbank, `texte2-1.json` bis `texte2-4.json` die weiteren Lexikontexte für alle übrigen Bibliotheksseiten (aufgeteilt, damit jede Datei klein genug für den Upload im Browser ist). Alle Dateien werden beim Start geladen, Texte aus `texte-1.json` und `texte-2.json` haben Vorrang.

## Dateigrösse

Alle Dateien sind kleiner als 5 MB, damit sie sich auch im Browser auf GitHub hochladen lassen. Die grossen Daten (Fragen, Bilder, Texte) stehen deshalb in eigenen Dateien: `daten-01.js` bis `daten-11.js`, `fragen-1.json` bis `fragen-3.json`, `texte-1.json`, `texte-2.json` und `texte2-1.json` bis `texte2-4.json`. Alle diese Dateien müssen im selben Ordner wie `index.html` liegen. Alte Dateien `fragen.json`, `fragen.csv`, `texte.json` und `texte2.json` werden nicht mehr gebraucht.

## Qeels

Die Qeels (Q für Quiz) zeigen Fragen und Bibliotheksartikel im Stil von Shorts und Reels. Teilen geht über WhatsApp, Telegram, Facebook, X, E-Mail, SMS oder einen Link; die Link-Adresse steht in `config.js` unter `teilenUrl`. Die Anzahl «Gefällt mir» wird gemeinsam gezählt, sobald Supabase eingerichtet ist (Tabelle `likes` und Funktion `like_aendern` aus `supabase/schema.sql`). Ohne Supabase zeigt die GitHub-Version nur das eigene Herz.
