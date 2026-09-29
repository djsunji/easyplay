# easyplay – Fragen. Wissen. Weiterkommen.

Lern-Website für Kinder und Jugendliche (6–20 Jahre) mit Multiple-Choice-Fragen, Schweiz-Themen, Training, gewerteten Tests, Rangliste und Live-Wettbewerb.

## Dateien
- `index.html` – die komplette Website (Design, Code, Fragen, Logo eingebettet)
- `logo.png` – Logo-Symbol freigestellt (transparenter Hintergrund)
- `logo-original.png` – Original-Logo mit Schriftzug

## Online stellen (GitHub Pages)
Settings → Pages → „Deploy from a branch“ → Branch `main`, Ordner `/ (root)` → Save.

## Funktioniert überall
Training, gewertete Tests (20 Fragen, 30 Minuten), 526 eingebaute Fragen mit Erklärungen und Wikipedia-Quellen, Bildfragen, Vorlesen, Berufs-Check. Profil und Statistik werden lokal im Browser gespeichert.

## Funktioniert nur auf claude.ai (muss für die eigene Domain ersetzt werden)
Der Code nutzt an diesen Stellen `window.claude.use(...)`:
- `db` – gemeinsame Rangliste, Profile, Fragen aus der Werkstatt → z. B. Supabase oder Firebase
- `user` – Anmeldung und Besitzerrechte → z. B. Supabase Auth / Firebase Auth (mit Bestätigungsmail)
- `room` – Live-Wettbewerb → z. B. Supabase Realtime oder WebSockets
- `sample` – KI-Fragen in der Fragen-Werkstatt → KI-Schnittstelle über einen eigenen Server (API-Schlüssel nie in den Code!)
