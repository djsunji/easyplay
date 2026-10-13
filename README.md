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

### Modern (10 neue Startseiten, je eine moderne App-Idee)
- **P1 «Fokus»**: Ganz ruhig. Ein grosser runder «Weiterspielen»-Knopf mit Fortschrittsring, darunter nur kleine Links. Lumi und Milo am Rand.
- **P2 «Für dich»**: Wie Spotify oder Netflix. Dunkle Fläche mit «Weiterspielen», Reihe «Neu für dich» mit Themen-Covern und «Beliebt in deiner Klasse».
- **P3 «Chat mit Lumi»**: Lumi spricht das Kind in Sprechblasen an und bietet 4 Antwort-Knöpfe an. Milo meldet sich mit einer Herausforderung.
- **P4 «Kartenstapel»**: Themen als Kartenstapel zum Wischen wie bei Tinder: links weiter, rechts spielen, Herz zum Merken.
- **P5 «Widgets»**: Startseite aus Widgets wie auf dem iPhone: Weiterspielen, Serie, Münzen, Tagesquiz-Countdown, «Wusstest du?», Duell, Abzeichen.
- **P6 «Wissensdorf»**: Ein Dorf, jedes Haus ist ein Bereich (Schulhaus = Tagesquiz, Bibliothek, Arena = Duell, Kiosk = Laden, Bergstation, Museum). Auf dem Handy als Liste.
- **P7 «Sammelkarten»**: Glänzende Tierkarten der Schweiz (häufig, selten, episch). 10 richtige Antworten öffnen ein Päckli mit 3 Karten.
- **P8 «Tagesreise»**: Sonnenbogen über den Tag mit 4 Stopps (Morgenfrage, Wusstest du?, Tagesquiz, Abend-Truhe).
- **P9 «Quiz-Show»**: TV-Studio mit Licht, Podesten für Team Lumi und Team Milo und grossem Buzzer. Jeden Abend eine Live-Show.
- **P10 «Thema der Woche»**: Magazin-Stil mit grossem Titelthema (Gletscher), Fakten daneben und «Auch neu».
- Gebaut mit `generator/gen7.py` und `generator/P.css`.

### Angelehnt an den «Ersten Vorschlag» (Bühne, «Heute für dich», 4 Kacheln)
Alle zehn haben den gleichen Aufbau wie der erste Vorschlag, jetzt aber auf dem originalen Alpen-Hintergrund: grosse Bühne mit Logo und Kids, Slogan, Kennzahlen, Knöpfe, «Heute für dich» und vier Aktionskacheln.
- **Q1 «Klassisch»**: Der erste Vorschlag eins zu eins auf dem Alpen-Hintergrund.
- **Q2 «Nebeneinander»**: Bühne links, «Heute für dich» als Karte rechts. Kacheln darunter mit Untertitel.
- **Q3 «Glasbühne»**: Alles in einer grossen Glasfläche; «Heute für dich» als Leiste am unteren Rand. Kacheln aus Glas mit farbigem Symbol.
- **Q4 «Ein grosser Knopf»**: Nur ein breiter «Los geht's»-Knopf mit Serie und Fortschritt drin. Kacheln als 2×2 Liste.
- **Q5 «Kids halten die Kacheln»**: Lumi und Milo stehen links und rechts der vier Kacheln. «Heute für dich» als drei Pillen.
- **Q6 «Heute-Ring»**: «Heute für dich» als eine breite Karte mit Fortschrittsring (5/10), Wochentagen der Serie und zwei Knöpfen. Das sitzende Duo schaut rein.
- **Q7 «Nachtbühne»**: Bühne in einer dunklen Fläche mit Lichtkegel und Sternen, Slogan in Gelb-Pink, gelber Knopf.
- **Q8 «Sprechblasen»**: Lumi sagt den Wusstest-du-Satz, Milo fordert heraus. Der Tipp vom ersten Vorschlag wandert so nach oben.
- **Q9 «Türen»**: Vier hohe Kacheln wie Türen, in jeder steht ein Kind. «Heute für dich» darunter.
- **Q10 «Leicht»**: Luftig und hell: eine Leiste für «Heute für dich», weisse Kacheln mit farbigem Rand.
- Gebaut mit `generator/gen8.py` und `generator/Q.css`. `shot.js` friert die Uhr auf 11 Uhr ein, damit der Himmel auf allen Screenshots gleich aussieht.

### Noch 10 wie der «Erste Vorschlag» (R-Runde)
Gleicher Aufbau wie die Q-Runde, je mit einer anderen Idee für die Darstellung.
- **R1 «Sticker»**: Kacheln als leicht gedrehte Sticker mit weissem Rand, «Heute für dich» als Klebezettel in Gelb, Rosa und Blau.
- **R2 «Text links»**: Slogan, kurzer Satz, Kennzahlen und Knöpfe links, die Bühne mit Logo und Kids rechts.
- **R3 «Dock»**: Die Aktionen als runde App-Symbole in einer Glas-Leiste wie auf dem iPad, mit kleinen roten Zählern.
- **R4 «Tagesplan»**: «Heute für dich» als Checkliste mit Datum, Häkchen und XP pro Aufgabe.
- **R5 «Wolke»**: Die Bühne sitzt in einer weissen Wolke, die Kacheln sind pastellfarben mit dunkler Schrift.
- **R6 «Lernen oder Spielen»**: Statt vier Kacheln zwei grosse Hälften: Lernen (Bibliothek, Zufall) mit Lumi, Spielen (Qeels, Duell) mit Milo.
- **R7 «Schultafel»**: «Heute für dich» auf einer grünen Wandtafel mit Holzrahmen und Kreide, die Kacheln als Schulhefte.
- **R8 «Kompakt»**: Alles passt ohne Scrollen auf einen Bildschirm: kleine Bühne links, Slogan rechts, darunter Heute und Kacheln.
- **R9 «Konsole»**: Die vier Aktionen als Knöpfe einer Spielkonsole, «Heute für dich» auf dem kleinen Bildschirm, gelber Startknopf.
- **R10 «Postkarte»**: Eine Postkarte aus den Alpen mit Lumi und Milo als Bild, «Heute für dich» als Kartentext, Briefmarke mit Logo und Poststempel. Die Kacheln sehen aus wie Briefmarken.
- Gebaut mit `generator/gen9.py` und `generator/R.css` (baut auf `Q.css` auf).

### Modern, 20 neue (S-Runde)
Der Nutzer wollte nochmals 20 Entwürfe in modernem Design. Alle zeigen Logo, Lumi und Milo, Slogan, «Heute für dich» und die vier Aktionen, aber je in einer anderen modernen Gestaltung.
- **S1 «Bento»**: Weisses Kachelraster mit grosser Bühne, Slogan-Kachel, Verlauf-Kachel mit Knopf, Zahlen-Kacheln und vier farbigen Aktionen.
- **S2 «Mesh»**: Weiche, verschwommene Farbflecken hinter der Bühne, Karten aus Glas.
- **S3 «Dunkelmodus»**: Alles in einer dunklen Fläche mit limettengrünem Knopf und hellen Akzenten.
- **S4 «Grosse Typo»**: Riesiger Slogan links, Bühne rechts, darunter Zahlen und eine Textliste mit Pfeilen.
- **S5 «Karussell»**: Grosse Karten zum Wischen (Weiterspielen, Serie, Tagesquiz, Fehler üben, Duell) mit Punkten.
- **S6 «Neo-Brutal»**: Dicke schwarze Ränder, harte Schatten, Gelb, Rosa, Mint und Blau.
- **S7 «Soft UI»**: Weiche, in die Fläche gedrückte Karten und Knöpfe mit doppelten Schatten.
- **S8 «Split»**: Links ein Farbblock mit Slogan und Knöpfen, rechts weiss mit Bühne und «Heute für dich».
- **S9 «Insel»**: Alles auf einer schwebenden weissen Karte, Lumi und Milo an den oberen Ecken.
- **S10 «Dashboard»**: Fortschrittsring, Wochenbalken und Zahlen, darunter runde Aktionsknöpfe.
- **S11 «Verlaufsrand»**: Weisse Karten mit feinem Farbverlauf als Rand, Logo im Verlaufsring.
- **S12 «Pillen-Navigation»**: Segmentierte Pillen-Navigation (Heute, Spielen, Lernen, Freunde) mit einem ruhigen Panel.
- **S13 «3D-Kacheln»**: Kacheln mit dicker Unterkante und Perspektive, Bodenschatten unter der Bühne.
- **S14 «Stories und Feed»**: Runde Story-Kreise mit Lumi, Milo und Themen, darunter ein Feed mit grossen Covern.
- **S15 «Zeitstrahl»**: Bühne links, rechts «Dein Tag» als Zeitstrahl mit Uhrzeiten und Häkchen.
- **S16 «Themen-Wolke»**: Eine Leiste für «Heute für dich» und eine Wolke aus farbigen Themen-Pillen.
- **S17 «Streaming»**: Grosse Hero-Karte wie bei Netflix mit «Weiterspielen» und dem Duo, darunter vier Poster.
- **S18 «Zahlen»**: Drei grosse Zahlen-Karten (Fragen, Themen, Schweiz-Wissen) in Verlaufs-Schrift.
- **S19 «Gruppenliste»**: Gruppierte Listen mit Symbolquadrat und Pfeil, wie in iPhone-Einstellungen.
- **S20 «Schwebender Knopf»**: Ruhige, flache Karten und ein grosser schwebender Startknopf unten rechts.
- Gebaut mit `generator/gen10.py` und `generator/S.css` (baut auf `Q.css` auf). Wichtig: Die Live-Seite macht den Hero-Inhalt zu einem Flex-Container; `.vsS{display:block}` verhindert, dass zentrierte Karten mit `max-width` schmal werden.

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
