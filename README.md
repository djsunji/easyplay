# easyplay, Fragen. Wissen. Weiterkommen.

Spielerische Lern-Website für Kinder und Jugendliche (6 bis 20 Jahre) mit über 700 Multiple-Choice-Fragen, vielen Schweiz-Themen und drei Stufen (Entdecker, Könner, Profis).

## Funktionen
- Training mit frei wählbarer Anzahl Fragen (1 bis 100), Erklärungen, Merksätzen und Wikipedia-Quellen
- Gewertete Tests (20 Fragen, 30 Minuten) mit Punkten, Rangliste und Top 10 der Schweiz
- Bereiche: Welt & Geschichte (inkl. Geografie, Politik, Religion, 26 Kantone), Natur & Wissen, Schweiz/Geld/Leben, Alltag
- Bilderfragen (Kantonswappen, Flaggen, Tiere, Emoji-Rätsel)
- Wissensdatenbank mit Suche, alle Fragen wie in einer Bibliothek
- Eigene Tests erstellen, per Link verschicken und Resultate auswerten
- Live-Wettbewerb (nur auf claude.ai), Vorlesefunktion, Animationen
- Hintergründe: Alpenpanorama (mit Jahreszeiten und Tag/Nacht nach Schweizer Zeit), Farbwolken, Lern-Muster

## Dateien
| Datei | Zweck |
|---|---|
| `index.html` | Die komplette Website (Design, Code, Bilder und alle Fragen als Sicherheitsnetz) |
| `config.js` | Einstellungen für die Fragen-Datenbank (Supabase optional) |
| `fragen.json` | Fragen-Datenbank (Variante A), wird beim Start geladen |
| `fragen.csv` | Dieselben Fragen zum Import in Supabase (Variante B) |
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
