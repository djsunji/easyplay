# Startseite easyplay: alle Vorschläge (Stand 13.10.2026)

Hier sind alle Entwürfe für eine neue Startseite von https://djsunji.github.io/easyplay/ gesammelt. Keiner davon ist live.

**Vorgaben des Nutzers:**
- Den originalen Alpen-Hintergrund der Seite behalten.
- Die neuen Bilder von Lumi (Mädchen) und Milo (Junge) verwenden.
- Slogan «Spiel dich schlau!».
- Schweizer Schreibweise: «ss», kein «ß», keine Gedankenstriche.

## Ordner in diesem Zweig
- `bilder/`: Screenshots jedes Vorschlags, je `-computer`, `-ipad` und `-handy`.
- `figuren/`: freigestellte Kids-Bilder aus den Uploads des Nutzers.
  - `m1` bis `m8`: Lumi-Posen
  - `j1` bis `j8`: Milo-Posen
  - `spring0` (Milo) und `spring1` (Lumi): springend
  - `liegen`: Lumi liegend
  - `zeigen`: Milo lehnt und zeigt
  - `duo3` bis `duo6`: beide zusammen; `duo1` und `duo2` sind angeschnitten und unbrauchbar
- `generator/`: Python-Skripte und CSS, mit denen die Entwürfe gebaut wurden.
  - Sie fügen in eine Kopie von `index.html` einen Wrapper um `renderHome` ein. Dieser ersetzt nur den Inhalt von `.hero`.
  - Die Bilder liegen dabei unter `_vs/`.
  - Die Screenshots macht `shot.js` (Playwright) auf `localhost:8765`.

## Die Vorschläge

### Erste Runde
- **Erster Vorschlag**: zentrale Bühne mit grossem Logo und Kids, «Heute für dich», 4 Aktionskacheln. Er hatte noch einen eigenen Hintergrund; der Nutzer wollte stattdessen den originalen.
- **A «Sprung»**: Logo in der Mitte, Lumi und Milo springen links und rechts, darunter Slogan, Kennzahlen und 3 Knöpfe.
- **B «Heute für dich»**: Links Logo, Slogan und Knöpfe. Rechts liegt Lumi auf einer Karte mit Tagesquiz, Serie und Fehler üben; Milo lehnt daneben.
- **C «Spielkacheln»**: Kompakter Kopf mit 4 grossen Kacheln, aus denen je ein Kind springt. Das sitzende Duo steht über den Bereichen.

### «Heutige Ansprüche»
- **D «Abenteuerpfad»** (wie bei Duolingo): Ein Weg mit Stationen (Tagesquiz, Zufall, Bibliothek, Duell, Schatz) und XP-Balken. Auf dem Handy wird daraus ein Zickzack-Pfad.
- **E «Sofort spielen»**: Eine echte Quizfrage direkt auf der Startseite, mit Zeitbalken und Konfetti. Die Antworten lassen sich anklicken.
- **F «Stories & Qeels»** (wie Instagram und TikTok): Themen-Bubbles mit «NEU», darunter Qeels-Karten im Hochformat.
- **G «Bento»**: Raster aus Kacheln mit Serie-Ring, Countdown zum Tagesquiz, Rangliste, Duell, «Wusstest du?», Abzeichen und Qeels.
- **H «Challenge & Belohnungen»**: Wochen-Challenge «Alpen-Expedition» mit Countdown, Level und Münzen, tägliche Truhe, Begleiter-Outfits zum Freischalten, Klassen-Rangliste.

### Weitere Varianten von H (der Nutzer wollte mehr in diese Richtung)
- **H2 «Gipfel-Challenge»**: Matterhorn erklettern, 10 Meter pro richtige Antwort, dazu Missionen mit Bonus-Metern.
- **H3 «Glücksrad & Stickerheft»**: tägliches Glücksrad, Stickerheft «Tiere der Schweiz» (30 Sticker), Laden nur mit Münzen.
- **H4 «Team Lumi gegen Team Milo»**: Team-Woche mit Balken, Live-Liste, eigenem Beitrag und Siegerpreis.
- **H5 «Saison-Pass»**: Herbst-Pass mit 20 Stufen und Belohnungen, Tagesaufgaben mit XP, eigenes Zimmer.

### Berg und Team kombiniert (letzter Wunsch des Nutzers)
- **K1 «Gipfel-Wettlauf»**: Ein Matterhorn mit zwei Wegen, links Team Lumi in Pink, rechts Team Milo in Blau. Dazu Stand, eigener Beitrag und Bonus-Meter.
- **K2 «Seilschaft»**: Eine Klasse klettert gemeinsam an einem Seil. Lager mit Belohnungen für alle, Liste «Wer zieht am meisten?». Passt zum Lehrerbereich.
- **K3 «Gipfel-Rennen»**: 5 Teams (Steinböcke, Adler, Team Lumi, Murmeltiere, Bären) mit je einem Berg, der sich füllt. Medaillen und Wochenpreise.
- **K4 «Berg-Duell mit Hütten»**: Zwei Berge nebeneinander, unterwegs echte Matterhorn-Hütten (Hörnlihütte, Solvay-Biwak, Schulter, Gipfel) mit Team-Belohnungen.

### Noch 5 neue (Berg + Team, je eine neue Idee)
- **M1 «Gipfeltour Schweiz»**: Schweizer Karte mit 5 Gipfeln als Wochen-Etappen (Säntis, Pilatus, Eiger, Matterhorn, Piz Bernina). Fragen zur Region bringen doppelte Meter.
- **M2 «Bergbahn-Rennen»**: Zwei Gondeln, Team Lumi in Pink und Team Milo in Blau, fahren an Seilen zur Gipfelstation. Dazu Turbo bei 5 richtigen Antworten am Stück.
- **M3 «Gipfelbuch»**: Eine Team-Fahne mit Höhe und Anzahl Kinder, daneben ein Gipfelbuch mit Erfolgen der anderen. Kinder schreiben keinen freien Text, sondern setzen nur vorgegebene Stempel wie «Bravo!». So ist es sicher.
- **M4 «Live-Arena»**: Jeden Tag um 17 Uhr ein Live-Quiz mit 10 Fragen für alle. Zwei Team-Türme steigen live.
- **M5 «Routenwahl»**: Drei Routen passend zu den Stufen. Wanderweg (Entdecker) gibt ×1, Klettersteig (Könner) ×2, Nordwand (Profis) ×3. Alle zählen fürs Team. Wetter-Ereignis «Föhn» bringt doppelte Meter.

### Ohne Berg (Team und Belohnungen in anderen Welten)
- **N1 «Weltraum-Mission»**: Die Raketen von Team Lumi und Team Milo fliegen von der Erde über Mond und Mars bis zu einem fernen Stern. Richtige Antworten sind Treibstoff.
- **N2 «Schatzinsel»**: Zwei Segelschiffe fahren von Insel zu Insel. Jede Insel gibt ein Teil der Schatzkarte (6 Teile), am Ende wartet die Schatzkiste.
- **N3 «Zugreise Schweiz»**: Zwei Züge fahren von Genf über Bern, Luzern und Zürich nach St. Gallen. Pro Halt gibt es ein «Billett» mit Bonus-Frage zur Stadt.
- **N4 «Team-Tierpark»**: Alle 50 richtigen Antworten zieht ein neues Tier ins Gehege des Teams. Wer am Sonntag mehr Tiere hat, gewinnt.
- **N5 «Wissens-Liga»**: Fussball-Look; jede richtige Antwort ist ein Tor. Dazu Anzeigetafel, Tabelle mit 5 Teams, eigene Tore und Pokal am Saisonende.

## Empfehlung und offene Entscheidung
- **Empfehlung:** K1 als Startseite, ergänzt um die Hütten aus K4. Für Klassen zusätzlich die Seilschaft aus K2.
- **Nach den M-Vorschlägen:** M5 (Routenwahl) passt besonders gut, weil sie die bestehenden 3 Stufen nutzt. Sie lässt sich gut mit K1 oder M1 kombinieren.
- **Entscheidung des Nutzers steht noch aus.** Er soll Variante oder Kombination wählen.

## Was für die Umsetzung fehlt
- **Schon vorhanden** (in `lernen.js`, localStorage): Serie, Tagesquiz, Fehler üben, 17 Abzeichen, Elternansicht.
- **Neu zu bauen:** Meter, XP und Level, Münzen, Teams, Missionen. Je nach Wahl auch Truhe, Stickerheft, Pass und Outfits.
- **Team-Punkte, Rangliste, Live-Liste und Seilschaft** brauchen Supabase, weil die Punkte aller Kinder zusammengezählt werden. Supabase ist noch nicht eingerichtet; die Anleitung steht in `ANLEITUNG-SUPABASE.md` auf `main`.
- **Ohne Supabase** ginge nur eine lokale Version, in der jedes Kind seine eigenen Meter sieht.
- **Grundsätze:** Den Laden nur mit Münzen betreiben, kein echtes Geld. Keine persönlichen Daten der Kinder öffentlich zeigen, nur Spitznamen.

## Technik der Live-Seite (Kurzfassung)
- **Hauptdatei:** `index.html` auf `main`.
  - Die Startseite wird von `renderHome()` gebaut.
  - `lernen.js` und `hardcore.js` hängen sich als Wrapper an `renderHome` an.
  - `S` ist eine Konstante auf Skript-Ebene und hängt nicht an `window`.
- **Service Worker:** `sw.js`. Bei jeder Änderung an der Seite `VERSION` erhöhen.
- **Hero-Markup:** `.hero` mit `.mobkids`, Slogan, `.kennzahlen kz2`, `.heroart` und `.ctas`. Das iPad-CSS steht in `<style id="tablet">`.
