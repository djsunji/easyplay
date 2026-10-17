/* easyplay: Abenteuer mit Lumi und Milo
   Geschichten in Kapiteln; jedes Kapitel endet mit einem kleinen Quiz (5 Fragen aus dem Fragenpool).
   Ab 3 von 5 richtig ist das nächste Kapitel frei, dazu 1 bis 3 Sterne und etwas XP.
   Seite: x-abenteuer. API: window.EP_ABENTEUER = { stand(), oeffne(aid, nr) }.
   Speicher: localStorage ep-x-abenteuer-stand, ep-x-abenteuer-wahl; sessionStorage ep-x-abenteuer-lauf, ep-x-abenteuer-ergebnis. */
(function(){
"use strict";
if(!window.EP_EXTRAS) return;

const KIDS = "img/kids/";
const K_STAND = "ep-x-abenteuer-stand", K_WAHL = "ep-x-abenteuer-wahl", K_LAUF = "ep-x-abenteuer-lauf", K_ERG = "ep-x-abenteuer-ergebnis";

/* Bilder aus der Bibliothek (bildindex.json): lokale Datei, sonst Wikimedia, sonst Emoji-Szene */
const BILD = {"bern": {"u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/17/Zytglogge_01.jpg/960px-Zytglogge_01.jpg", "t": "Zytglogge", "a": "Mike Lehmann, Mike Switzerland 13:37, 2 July 2006 (UTC)", "l": "CC BY-SA 3.0", "p": "https://commons.wikimedia.org/wiki/File:Zytglogge_01.jpg", "k": "bilder/zi/t1njr2zi.webp", "g": "bilder/gross/zi/t1njr2zi.webp"}, "basel": {"u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1b/Der_Rhein_in_Basel_2.jpg/960px-Der_Rhein_in_Basel_2.jpg", "t": "Basel", "a": "WikiEuropian", "l": "CC BY-SA 4.0", "p": "https://commons.wikimedia.org/wiki/File:Der_Rhein_in_Basel_2.jpg", "k": "bilder/87/t1afam87.webp", "g": "bilder/gross/87/t1afam87.webp"}, "jura": {"u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b4/La_chaux_de_fond1-ag.jpg/960px-La_chaux_de_fond1-ag.jpg", "t": "La Chaux-de-Fonds / Le Locle, Stadtlandschaft Uhrenindustrie", "a": "Arnaud Gaillard (arnaud () amarys.com)", "l": "CC BY-SA 2.0", "p": "https://commons.wikimedia.org/wiki/File:La_chaux_de_fond1-ag.jpg", "k": "bilder/d0/tny8fd0.webp", "g": "bilder/gross/d0/tny8fd0.webp"}, "genf": {"u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b0/Jet_d%27eau_de_Gen%C3%A8ve_%28swiss%29.jpg/960px-Jet_d%27eau_de_Gen%C3%A8ve_%28swiss%29.jpg", "t": "Genf", "a": "Wikibusters", "l": "CC BY-SA 4.0", "p": "https://commons.wikimedia.org/wiki/File:Jet_d%27eau_de_Gen%C3%A8ve_(swiss).jpg", "k": "bilder/o2/tj8nao2.webp", "g": "bilder/gross/o2/tj8nao2.webp"}, "wallis": {"u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cf/3818_-_Riffelberg_-_Matterhorn_viewed_from_Gornergratbahn.JPG/960px-3818_-_Riffelberg_-_Matterhorn_viewed_from_Gornergratbahn.JPG", "t": "Matterhorn", "a": "Andrew Bossi", "l": "CC BY-SA 2.5", "p": "https://commons.wikimedia.org/wiki/File:3818_-_Riffelberg_-_Matterhorn_viewed_from_Gornergratbahn.JPG", "k": "bilder/9u/t8fn49u.webp", "g": "bilder/gross/9u/t8fn49u.webp"}, "tessin": {"u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/91/Castelli.JPG/960px-Castelli.JPG", "t": "Burgen von Bellinzona", "a": "Massimo Macconi", "l": "Public domain", "p": "https://commons.wikimedia.org/wiki/File:Castelli.JPG", "k": "bilder/0j/txh990j.webp", "g": "bilder/gross/0j/txh990j.webp"}, "gr": {"u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1a/Ofenpass_Snow.JPG/960px-Ofenpass_Snow.JPG", "t": "Schweizerischer Nationalpark", "a": "Adrian Michael", "l": "CC BY-SA 3.0", "p": "https://commons.wikimedia.org/wiki/File:Ofenpass_Snow.JPG", "k": "bilder/q5/tb2faq5.webp", "g": "bilder/gross/q5/tb2faq5.webp"}, "ost": {"u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/40/S%C3%A4ntis_mountain_by_sunset.jpg/960px-S%C3%A4ntis_mountain_by_sunset.jpg", "t": "Säntis", "a": "B0rder", "l": "CC BY-SA 3.0", "p": "https://commons.wikimedia.org/wiki/File:S%C3%A4ntis_mountain_by_sunset.jpg", "k": "bilder/wg/t1y9uxwg.webp", "g": "bilder/gross/wg/t1y9uxwg.webp"}, "zh": {"u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/af/Altstadt_Z%C3%BCrich_2015.jpg/960px-Altstadt_Z%C3%BCrich_2015.jpg", "t": "Zürich", "a": "Thomas Wolf , www.foto-tw.de", "l": "CC BY-SA 3.0 de", "p": "https://commons.wikimedia.org/wiki/File:Altstadt_Z%C3%BCrich_2015.jpg", "k": "bilder/4n/tukf4n.webp", "g": "bilder/gross/4n/tukf4n.webp"}, "lu": {"u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/56/Kapellenbr%C3%BCcke_Luzern.jpg/960px-Kapellenbr%C3%BCcke_Luzern.jpg", "t": "Kapellbrücke", "a": "Sputniktilt", "l": "CC BY-SA 3.0", "p": "https://commons.wikimedia.org/wiki/File:Kapellenbr%C3%BCcke_Luzern.jpg", "k": "bilder/10/tdfjb10.webp", "g": "bilder/gross/10/tdfjb10.webp"}, "uri": {"u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/58/Teufelsbr%C3%BCcke_aus_der_Bahn.JPG/960px-Teufelsbr%C3%BCcke_aus_der_Bahn.JPG", "t": "Teufelsbrücke (Schöllenen)", "a": "Albinfo", "l": "CC BY 4.0", "p": "https://commons.wikimedia.org/wiki/File:Teufelsbr%C3%BCcke_aus_der_Bahn.JPG", "k": "bilder/u5/tt5hmu5.webp", "g": "bilder/gross/u5/tt5hmu5.webp"}, "ziel": {"u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/61/%C3%84lggi_Alp.JPG/960px-%C3%84lggi_Alp.JPG", "t": "Älggi-Alp", "a": "Staycoolandbegood", "l": "Public domain", "p": "https://commons.wikimedia.org/wiki/File:%C3%84lggi_Alp.JPG", "k": "bilder/hf/tr63hf.webp", "g": "bilder/gross/hf/tr63hf.webp"}, "pfahl": {"u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d5/Lake_Dwellings_Unteruhldingen_11.jpg/960px-Lake_Dwellings_Unteruhldingen_11.jpg", "t": "Prähistorische Pfahlbauten um die Alpen", "a": "H. Zell", "l": "CC BY-SA 3.0", "p": "https://commons.wikimedia.org/wiki/File:Lake_Dwellings_Unteruhldingen_11.jpg", "k": "bilder/jr/t12g4bjr.webp", "g": "bilder/gross/jr/t12g4bjr.webp"}, "rom": {"u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/66/Augusta_Raurica_Stadtrekonstruktion_Bluetezeit_240_Zeichnung_Markus_Schaub.jpg/960px-Augusta_Raurica_Stadtrekonstruktion_Bluetezeit_240_Zeichnung_Markus_Schaub.jpg", "t": "Augusta Raurica", "a": "MunatiaPlancina", "l": "CC BY-SA 4.0", "p": "https://commons.wikimedia.org/wiki/File:Augusta_Raurica_Stadtrekonstruktion_Bluetezeit_240_Zeichnung_Markus_Schaub.jpg", "k": "bilder/yi/t1tkvuyi.webp", "g": "bilder/gross/yi/t1tkvuyi.webp"}, "burg": {"u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3e/Habsburg-Schloss.jpg/960px-Habsburg-Schloss.jpg", "t": "Schloss Habsburg", "a": "Roland Zumbuehl", "l": "CC BY-SA 3.0", "p": "https://commons.wikimedia.org/wiki/File:Habsburg-Schloss.jpg", "k": "bilder/cv/t18r12cv.webp", "g": "bilder/gross/cv/t18r12cv.webp"}, "brief": {"u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7a/Bundesbrief2.jpg/960px-Bundesbrief2.jpg", "t": "Bundesbrief von 1291", "a": "Unknown author Unknown author", "l": "Public domain", "p": "https://commons.wikimedia.org/wiki/File:Bundesbrief2.jpg", "k": "bilder/9j/tlmkt9j.webp", "g": "bilder/gross/9j/tlmkt9j.webp"}, "bahn": {"u": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/86/Zentralbibliothek_Z%C3%BCrich_-_Nachricht_an_das_reiselustige_Publikum_-_000012136.jpg/960px-Zentralbibliothek_Z%C3%BCrich_-_Nachricht_an_das_reiselustige_Publikum_-_000012136.jpg", "t": "Spanisch-Brötli-Bahn", "a": "anonymous", "l": "Public domain", "p": "https://commons.wikimedia.org/wiki/File:Zentralbibliothek_Z%C3%BCrich_-_Nachricht_an_das_reiselustige_Publikum_-_000012136.jpg", "k": "bilder/ff/t1txznff.webp", "g": "bilder/gross/ff/t1txznff.webp"}, "heute": {"u": "https://live.staticflickr.com/2817/10577574344_20f3511d0e_b.jpg", "t": "Bundesplatz", "a": "Kopf oder Zahl", "l": "Public Domain", "p": "https://www.flickr.com/photos/104164910@N03/10577574344", "k": "bilder/lo/t16frllo.webp", "g": "bilder/gross/lo/t16frllo.webp"}};

/* Figuren: Lumi (m*, spring0, liegen), Milo (j*, spring1), beide (duo-*) */
const POSE = {
  l:["m1","m5","spring0","m3","liegen"],
  m:["j1","j5","spring1","j3"],
  e:["duo-winken","duo-bereit","duo-jubel"]
};
const NAME = { l:"Lumi", m:"Milo", e:"Erzähler" };

/* ---------- Abenteuer und Kapitel ----------
   sz: Szenen [wer, text, pose?]  wer: l = Lumi, m = Milo, e = Erzähltext
   th: Themen, aus denen Fragen kommen; rx: Suchwörter in Schweiz-Themen (und tx: weitere Themen) */
const KT_REISE = ["kt_BE","kt_BS","kt_JU","kt_NE","kt_GE","kt_VD","kt_VS","kt_TI","kt_GR","kt_SG","kt_AI","kt_AR","kt_ZH","kt_LU","kt_UR","kt_OW"];
const ABENTEUER = [
{ id:"schweiz", titel:"Reise durch die Schweiz", kurz:"Schweiz-Reise", emo:"🇨🇭", farbe:"linear-gradient(135deg,#0B6E6A,#0FA968)",
  text:"12 Stationen von Bern bis zur Mitte der Schweiz",
  kap:[
  { name:"Start in der Bundesstadt", kurz:"Bern", emo:"🐻", bild:"bern", farbe:"linear-gradient(135deg,#C0392B,#E8743B)",
    th:["kt_BE"], rx:/\bBern\b|Berner Altstadt|Bundeshaus|Zytglogge|Bärenpark|Bundesplatz/,
    sz:[
      ["e","Ein sonniger Morgen in Bern. Lumi und Milo stehen mit ihren Rucksäcken vor dem Bundeshaus. Heute beginnt ihre grosse Reise durch die Schweiz!","duo-winken"],
      ["m","Schau mal, Lumi! In diesem Gebäude treffen sich das Parlament und der Bundesrat."],
      ["l","Darum nennt man Bern die Bundesstadt. Eine offizielle Hauptstadt steht nämlich in keinem Gesetz!"],
      ["m","Und da drüben ist die Zytglogge. Kurz vor der vollen Stunde kräht ein Hahn, ein Narr läutet Glöckchen und kleine Bären ziehen im Kreis."],
      ["l","Echte Bären gibt es auch: unten an der Aare im Bärenpark. Der Bär ist ja das Wappentier von Bern!","spring0"],
      ["m","Hier ist unser Reisepass. Für jedes geschaffte Kapitel bekommen wir einen Stempel. Bereit fürs erste Quiz?","j5"]
    ]},
  { name:"Basel am Rhein", kurz:"Basel", emo:"⛴️", bild:"basel", farbe:"linear-gradient(135deg,#1F5FBF,#3FA3E0)",
    th:["kt_BS"], rx:/Basel|Basler|Läckerli|Zolli|Dreiländereck|Morgestraich|Spalentor/,
    sz:[
      ["e","Mit dem Zug fahren die beiden nach Basel. Mitten durch die Stadt fliesst der Rhein, breit und glitzernd."],
      ["l","Milo, das Boot dort hat gar keinen Motor! Wie kommt es ans andere Ufer?","m1"],
      ["m","Das ist eine Fähre. Sie hängt an einem Seil, und die Strömung des Rheins schiebt sie hinüber. Ganz schön schlau, oder?"],
      ["l","Beim Dreiländereck treffen sich die Schweiz, Deutschland und Frankreich. Ich winke allen drei Ländern zu!","spring0"],
      ["m","Und ich habe Basler Läckerli gekauft, ein Gebäck mit Honig, Mandeln und Gewürzen. Eins für dich, eins für mich und eins für unterwegs!","j5"]
    ]},
  { name:"Jura und Uhren", kurz:"Jura", emo:"⌚", bild:"jura", farbe:"linear-gradient(135deg,#6A4BC4,#9B6BE8)",
    th:["kt_JU","kt_NE"], rx:/\bJura\b|Uhrenindustrie|Uhrmacher|Uhrenst|Chaux-de-Fonds|Le Locle|Freiberg|Neuenburg|Saint-Ursanne|Delsberg/,
    sz:[
      ["e","Weiter geht es in den Jura. Hier gibt es sanfte Hügel, dunkle Tannenwälder und weite Weiden."],
      ["m","Schau, Pferde! Das sind Freiberger. Diese Pferderasse stammt aus dem Jura.","j1"],
      ["l","Und wusstest du, dass der Kanton Jura der jüngste Kanton der Schweiz ist? Es gibt ihn erst seit 1979."],
      ["e","In La Chaux-de-Fonds und Le Locle wurden ganz viele Uhren gebaut. Die beiden Uhrenstädte gehören zum UNESCO-Welterbe."],
      ["m","Tick, tack! In einer kleinen Uhr stecken winzige Rädchen. Dafür braucht man ganz ruhige Hände.","j3"],
      ["l","Dann los zum Quiz. Keine Sorge, wir haben genug Zeit!","m5"]
    ]},
  { name:"Am Genfersee", kurz:"Genfersee", emo:"⛲", bild:"genf", farbe:"linear-gradient(135deg,#0E7FA6,#29B6D8)",
    th:["kt_GE","kt_VD"], rx:/Genf|Lausanne|Waadt|Montreux|Chillon|Lavaux|Jet d'eau|Olympische/,
    sz:[
      ["e","Von den Uhrenstädten reisen Lumi und Milo an den Genfersee. Hier spricht man Französisch."],
      ["l","Bonjour, Milo! Schau, der Jet d'eau! Das Wasser spritzt etwa 140 Meter hoch.","spring0"],
      ["m","In Genf wurde 1863 das Rote Kreuz gegründet. Es hilft Menschen in Not auf der ganzen Welt."],
      ["e","Mit dem Schiff fahren sie nach Lausanne. Dort hat das Internationale Olympische Komitee seinen Sitz."],
      ["l","Und bei Montreux steht Schloss Chillon auf einem Felsen im See. Es sieht aus, als würde es schwimmen!","m3"]
    ]},
  { name:"Wallis und Matterhorn", kurz:"Wallis", emo:"🏔️", bild:"wallis", farbe:"linear-gradient(135deg,#2B4C9A,#5C8DE0)",
    th:["kt_VS"], rx:/Wallis|Walliser|Matterhorn|Zermatt|Aletsch|Rhonegletscher|Dufourspitze|Raclette|Sitten/,
    sz:[
      ["e","Das Rhonetal entlang geht es ins Wallis. Die Rhone fliesst vom Rhonegletscher bis in den Genfersee."],
      ["m","In Zermatt fahren keine gewöhnlichen Autos, nur kleine Elektrofahrzeuge. Darum ist es hier so ruhig.","j1"],
      ["l","Wow, das Matterhorn! Es ist 4478 Meter hoch und spitz wie eine Pyramide.","m1"],
      ["m","Der höchste Berg der Schweiz steht auch im Wallis: die Dufourspitze mit 4634 Metern."],
      ["e","Am Abend gibt es Raclette, geschmolzenen Käse mit Kartoffeln. Milo nimmt schon die dritte Portion."],
      ["l","Morgen schauen wir den Grossen Aletschgletscher an, den grössten Gletscher der Alpen. Aber zuerst: Quiz!","m5"]
    ]},
  { name:"Sonniges Tessin", kurz:"Tessin", emo:"🌴", bild:"tessin", farbe:"linear-gradient(135deg,#D9822B,#F2B33D)",
    th:["kt_TI"], rx:/Tessin|Lugano|Locarno|Bellinzona|Ascona|Lago Maggiore|Luganersee|Monte San Giorgio/,
    sz:[
      ["e","Über den Nufenenpass geht es vom Wallis hinüber ins Tessin."],
      ["l","Buongiorno! Im Tessin spricht man Italienisch. Und schau mal, Palmen!","spring0"],
      ["m","In Bellinzona stehen drei Burgen: Castelgrande, Montebello und Sasso Corbaro. Sie gehören zum UNESCO-Welterbe.","j1"],
      ["e","In Locarno am Lago Maggiore gibt es jeden Sommer ein grosses Filmfestival. Die Filme laufen auf der Piazza Grande unter freiem Himmel."],
      ["l","Ich hätte so gern ein Gelato!","liegen"],
      ["m","Zuerst das Quiz, dann das Gelato. Abgemacht?","j5"]
    ]},
  { name:"Graubünden und Nationalpark", kurz:"Graubünden", emo:"🐐", bild:"gr", farbe:"linear-gradient(135deg,#2E7D32,#66BB6A)",
    th:["kt_GR"], rx:/Graubünden|Bündner|Nationalpark|Engadin|Rätoromanisch|Allegra|\bChur\b|Davos|St\. Moritz|Steinbock|Rhätische Bahn|Landwasser/,
    sz:[
      ["e","Über den San-Bernardino-Pass erreichen die beiden Graubünden, den grössten Kanton der Schweiz."],
      ["m","Allegra! So grüsst man auf Rätoromanisch. In Graubünden spricht man Deutsch, Rätoromanisch und Italienisch.","j1"],
      ["l","Wir sind im Schweizerischen Nationalpark! Er wurde 1914 gegründet und ist der einzige Nationalpark der Schweiz.","m1"],
      ["e","Plötzlich pfeift es laut: Ein Murmeltier warnt seine Familie. Oben am Felsen klettert ein Steinbock. Er ist auch im Wappen von Graubünden zu sehen."],
      ["m","Pssst, ganz leise! Im Nationalpark bleiben wir auf den Wegen, damit die Tiere ihre Ruhe haben.","j3"]
    ]},
  { name:"Säntis und Bodensee", kurz:"Ostschweiz", emo:"🚡", bild:"ost", farbe:"linear-gradient(135deg,#00897B,#4DB6AC)",
    th:["kt_SG","kt_AI","kt_AR"], rx:/Säntis|Bodensee|St\. Gallen|Appenzell|Thurgau|Rheinfall|Alpstein|Stiftsbibliothek/,
    sz:[
      ["e","Weiter geht die Reise in die Ostschweiz. In Appenzell sind viele Häuser bunt bemalt."],
      ["m","Mit der Schwebebahn geht es hinauf auf den Säntis. Er ist 2502 Meter hoch, der höchste Berg im Alpstein.","j5"],
      ["l","Von hier oben sieht man den Bodensee! An ihm liegen drei Länder: die Schweiz, Deutschland und Österreich.","m1"],
      ["e","In St. Gallen besuchen sie die Stiftsbibliothek, eine der ältesten Klosterbibliotheken der Welt. Im Barocksaal zieht man Filzpantoffeln über die Schuhe."],
      ["m","Hui, ich rutsche wie auf dem Eis!","spring1"],
      ["l","Pssst, Milo! In einer Bibliothek ist man leise. Auf dem Weg nach Zürich halten wir noch beim Rheinfall.","liegen"]
    ]},
  { name:"Zürich an der Limmat", kurz:"Zürich", emo:"🏙️", bild:"zh", farbe:"linear-gradient(135deg,#1565C0,#42A5F5)",
    th:["kt_ZH"], rx:/Zürich|Zürcher|Limmat|Sechseläuten|Böögg|Grossmünster|Fraumünster|Uetliberg/,
    sz:[
      ["e","Zürich ist die grösste Stadt der Schweiz. Die Limmat fliesst aus dem Zürichsee mitten durch die Altstadt."],
      ["m","Schau mal, die Kirche St. Peter! Sie hat das grösste Kirchturm-Zifferblatt Europas.","j1"],
      ["l","Im Frühling feiert Zürich das Sechseläuten. Dann brennt der Böögg, ein Schneemann aus Watte. Je schneller sein Kopf platzt, desto schöner soll der Sommer werden, sagt man.","m1"],
      ["e","Am Seeufer essen die beiden ein Glace und zählen die Segelboote."],
      ["m","Albert Einstein hat hier an der ETH studiert. Ob wir auch einmal so schlau werden?","j3"],
      ["l","Wir üben ja schon fleissig, mit jedem Quiz!","m5"]
    ]},
  { name:"Luzern und Pilatus", kurz:"Luzern", emo:"🌉", bild:"lu", farbe:"linear-gradient(135deg,#8E3BB8,#C567E0)",
    th:["kt_LU"], rx:/Luzern|Kapellbrücke|Pilatus|Vierwaldstättersee|\bRigi\b|Verkehrshaus|Wasserturm/,
    sz:[
      ["e","In Luzern spazieren Lumi und Milo über die Kapellbrücke. Sie ist eine der ältesten gedeckten Holzbrücken Europas."],
      ["l","Unter dem Dach hängen alte Bilder. Und daneben steht der Wasserturm mitten in der Reuss!","m1"],
      ["m","Jetzt fahren wir auf den Pilatus, mit der steilsten Zahnradbahn der Welt. An der steilsten Stelle sind es 48 Prozent!","j5"],
      ["l","Eine Sage erzählt, dass am Pilatus früher Drachen wohnten. Ich sehe aber nur Alpendohlen.","liegen"],
      ["m","Im Verkehrshaus in Luzern kann man Züge, Schiffe und Flugzeuge anschauen. Da will ich nach dem Quiz hin!","spring1"]
    ]},
  { name:"Gotthard und Uri", kurz:"Uri", emo:"🚂", bild:"uri", farbe:"linear-gradient(135deg,#B8860B,#E0B030)",
    th:["kt_UR"], rx:/Gotthard|\bUri\b|Urner|Altdorf|Teufelsbrücke|Schöllenen|Andermatt|Flüelen/,
    sz:[
      ["e","Mit dem Dampfschiff fahren Lumi und Milo über den Vierwaldstättersee bis nach Flüelen im Kanton Uri."],
      ["l","In Altdorf steht das Telldenkmal. Wilhelm Tell ist eine Sagenfigur. Ob es ihn wirklich gab, weiss niemand.","m1"],
      ["m","In der Schöllenenschlucht steht die Teufelsbrücke. Die Sage sagt, der Teufel habe sie gebaut. Aber die schlauen Urner schickten zuerst einen Geissbock hinüber!","j1"],
      ["e","Tief unter den Bergen fährt der Zug durch den Gotthard-Basistunnel. Mit 57 Kilometern ist er der längste Eisenbahntunnel der Welt. Er wurde 2016 eröffnet."],
      ["l","Rund um den Gotthard entspringen Rhein, Rhone, Reuss und Ticino. Darum nennt man die Schweiz auch das Wasserschloss Europas.","m5"]
    ]},
  { name:"Ziel: Mitte der Schweiz", kurz:"Ziel", emo:"🏁", bild:"ziel", farbe:"linear-gradient(135deg,#E0457B,#F7A03C)",
    th:KT_REISE, rx:/Älggi|Mittelpunkt der Schweiz|Landessprache/, mix:true,
    sz:[
      ["e","Die letzte Etappe! Lumi und Milo wandern hinauf zur Älggi-Alp im Kanton Obwalden.","duo-bereit"],
      ["m","Hier ist der geografische Mittelpunkt der Schweiz. Wir stehen genau in der Mitte!","spring1"],
      ["l","Unser Reisepass ist fast voll: Bern, Basel, Jura, Genfersee, Wallis, Tessin, Graubünden, Ostschweiz, Zürich, Luzern und Uri.","m1"],
      ["m","Die Schweiz ist klein, aber so vielfältig: vier Landessprachen, hohe Berge, grosse Seen und viele Bräuche.","j1"],
      ["e","Für den letzten Stempel gibt es ein Finale mit Fragen aus der ganzen Reise. Zusammen schaffen die beiden das!","duo-jubel"]
    ]}
  ]},
{ id:"zeit", titel:"Zeitreise", kurz:"Zeitreise", emo:"⏳", farbe:"linear-gradient(135deg,#5B4BF5,#9B4DE0 60%,#E043B8)",
  text:"Von den Pfahlbauern bis heute",
  kap:[
  { name:"Bei den Pfahlbauern", kurz:"Pfahlbauer", emo:"🛖", bild:"pfahl", farbe:"linear-gradient(135deg,#6D4C41,#A1887F)",
    th:[], tx:["g_urzeit"], rx:/Pfahlbau|Jungsteinzeit|Bronzezeit|Steinzeit|Einbaum|Feuerstein/,
    sz:[
      ["e","Im Museum entdecken Lumi und Milo eine alte Sanduhr. Milo dreht sie um, und schwupps, alles wirbelt durcheinander!","duo-bereit"],
      ["l","Milo, wo sind wir? Da stehen Häuser auf Holzpfählen am Seeufer!","m3"],
      ["m","Das sind Pfahlbauten! Vor Tausenden von Jahren lebten hier Menschen, in der Jungsteinzeit und in der Bronzezeit.","j1"],
      ["e","Die Menschen bauen Getreide an, halten Ziegen und Rinder und fahren mit Einbäumen über den See."],
      ["l","56 Pfahlbau-Fundstellen in der Schweiz gehören heute zum UNESCO-Welterbe. Viele liegen unter Wasser, darum ist so viel erhalten geblieben.","m1"],
      ["m","Rund um die Alpen hat man in Pfahlbauten sogar einige der ältesten Holzräder der Welt gefunden!","j5"]
    ]},
  { name:"Römer in Augusta Raurica", kurz:"Römer", emo:"🏛️", bild:"rom", farbe:"linear-gradient(135deg,#B23A48,#E2725B)",
    th:[], tx:["g_antike"], rx:/Augusta Raurica|Aventicum|Vindonissa|Helvetier|Römer.{0,60}Schweiz|Schweiz.{0,60}Römer|römische.{0,40}(Stadt|Strasse|Gutshof).{0,40}(Schweiz|Kanton)/,
    sz:[
      ["e","Die Sanduhr dreht sich wieder. Diesmal landen die beiden in einer römischen Stadt am Rhein: Augusta Raurica, beim heutigen Augst."],
      ["m","Die Stadt wurde im Jahr 44 vor Christus gegründet. Um das Jahr 200 lebten hier etwa 20'000 Menschen!","j1"],
      ["l","Schau, ein riesiges Theater! Seine Mauern kann man heute noch besichtigen.","spring0"],
      ["e","Die Römer bauten gepflasterte Strassen, Wasserleitungen und warme Bäder."],
      ["m","Und sie schrieben Zahlen mit Buchstaben. Das Jahr 2016 wäre MMXVI!","j5"],
      ["l","Dann ist unser Quiz jetzt Nummer I. Los geht's!","m5"]
    ]},
  { name:"Burgen und Klöster", kurz:"Mittelalter", emo:"🏰", bild:"burg", farbe:"linear-gradient(135deg,#455A64,#78909C)",
    th:[], rx:/Mittelalter|\bBurg\b|Burgen|Ritter|Kloster|Habsburg|Zähringer|Mönch|Stiftsbibliothek|Schloss Chillon/,
    sz:[
      ["e","Wusch! Jetzt stehen Lumi und Milo vor einer Burg auf einem Hügel. Sie sind im Mittelalter gelandet."],
      ["l","Das ist die Habsburg im heutigen Aargau. Von hier stammt die Familie der Habsburger, die später in Europa sehr mächtig wurde.","m1"],
      ["m","Im Mittelalter entstanden viele Städte. Bern zum Beispiel wurde 1191 von den Zähringern gegründet.","j1"],
      ["e","In den Klöstern schreiben Mönche Bücher von Hand ab, Buchstabe für Buchstabe. Für ein einziges Buch brauchen sie oft Monate."],
      ["l","Kein Wunder, dass die Stiftsbibliothek in St. Gallen so berühmt ist. Da waren wir ja schon!","spring0"]
    ]},
  { name:"1291: Der Bundesbrief", kurz:"1291", emo:"📜", bild:"brief", farbe:"linear-gradient(135deg,#C62828,#EF5350)",
    th:["kt_SZ"], rx:/1291|Bundesbrief|Rütli|Urschweiz|Waldstätte|Wilhelm Tell|Tellsage|Bundesfeier|1\. August/,
    sz:[
      ["e","Die Sanduhr bringt Lumi und Milo in die Innerschweiz, ins Jahr 1291."],
      ["m","Damals versprachen sich Uri, Schwyz und Unterwalden, einander zu helfen. Das steht im Bundesbrief, geschrieben auf Latein.","j1"],
      ["l","Den echten Bundesbrief kann man heute im Bundesbriefmuseum in Schwyz anschauen.","m1"],
      ["m","Und was ist mit dem Rütlischwur und Wilhelm Tell?","j3"],
      ["l","Das sind Sagen, die erst viel später aufgeschrieben wurden. Ob alles so passiert ist, weiss niemand. Der Bundesbrief aber ist ein echtes Dokument.","liegen"],
      ["e","Die Schweiz ist nicht an einem Tag entstanden, sondern über viele Jahrhunderte gewachsen. Weil der Bundesbrief Anfang August 1291 datiert ist, feiern wir am 1. August den Nationalfeiertag."]
    ]},
  { name:"Fabriken und Eisenbahnen", kurz:"Industrie", emo:"🏭", bild:"bahn", farbe:"linear-gradient(135deg,#37474F,#FF8F00)",
    th:[], rx:/Industrialisierung|Fabrik|Eisenbahn|Dampflok|Spanisch-Brötli|Textilindustrie|Gotthardbahn|Alfred Escher|Kinderarbeit|Stickerei|Spinnerei/,
    sz:[
      ["e","Pfff! Eine Dampflok! Lumi und Milo sind im Jahr 1847 gelandet. Zwischen Zürich und Baden fährt die erste Eisenbahn, die ganz in der Schweiz liegt."],
      ["m","Man nennt sie Spanisch-Brötli-Bahn. Der Name kommt von einem feinen Gebäck aus Baden.","j5"],
      ["e","In den Fabriken surren Webstühle und Spinnmaschinen. Stoffe aus der Schweiz werden in viele Länder verkauft."],
      ["l","Damals mussten auch viele Kinder in Fabriken arbeiten, statt zu spielen. 1877 verbot ein Gesetz die Fabrikarbeit für Kinder unter 14 Jahren.","liegen"],
      ["m","Zum Glück! Und 1882 wurde die Gotthardbahn eröffnet. Jetzt konnten Züge durch einen langen Tunnel unter den Alpen fahren.","spring1"]
    ]},
  { name:"Die Schweiz heute", kurz:"Heute", emo:"🗳️", bild:"heute", farbe:"linear-gradient(135deg,#D32F2F,#F06292)",
    th:[], tx:["pol_demokratie"], rx:/1848|Bundesverfassung|Bundesrat|Bundesstaat|Frauenstimmrecht|Volksinitiative|Referendum|Landessprache|direkte Demokratie|Landsgemeinde/, chOnly:true,
    sz:[
      ["e","Die Sanduhr dreht sich ein letztes Mal. Lumi und Milo landen wieder im Museum, in der Gegenwart.","duo-winken"],
      ["m","Seit 1848 ist die Schweiz ein Bundesstaat mit einer Bundesverfassung. Damals wurde Bern zur Bundesstadt.","j1"],
      ["l","Heute regieren sieben Bundesrätinnen und Bundesräte gemeinsam. Und das Volk darf oft abstimmen. Das nennt man direkte Demokratie.","m1"],
      ["e","Seit 1971 dürfen die Frauen in der ganzen Schweiz auf Bundesebene abstimmen und wählen."],
      ["m","Vier Landessprachen, 26 Kantone und so viele Geschichten. Was für eine Reise!","spring1"],
      ["l","Noch ein letztes Quiz, dann haben wir die Zeitreise geschafft!","m5"]
    ]}
  ]}
];
ABENTEUER.forEach(A => A.kap.forEach((k, i) => { k.nr = i + 1; }));

/* ---------- Hilfen ---------- */
const api = () => window.EP_EXTRAS.api;
const LS = { get(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } },
             set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} } };
const SS = { get(k){ try{ const v = sessionStorage.getItem(k); return v ? JSON.parse(v) : null; }catch(e){ return null; } },
             set(k, v){ try{ if(v == null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, JSON.stringify(v)); }catch(e){} } };
const h = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const ton = n => { try{ window.EP_SOUND?.play?.(n); }catch(e){} };
const ruhig = () => { try{ return matchMedia("(prefers-reduced-motion: reduce)").matches; }catch(e){ return false; } };
const shuffle = a => { for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const finde = id => ABENTEUER.find(a => a.id === id) || ABENTEUER[0];

function stand(){ const s = LS.get(K_STAND, {}); return (s && typeof s === "object") ? s : {}; }
function kapStand(aid, i){ const s = stand(); return (s[aid] && s[aid][i]) || null; }
function geschafft(aid, i){ const k = kapStand(aid, i); return !!(k && k.ok); }
function frei(aid, i){ return i === 0 || geschafft(aid, i - 1); }
function naechstes(A){ const i = A.kap.findIndex((k, j) => !geschafft(A.id, j)); return i < 0 ? A.kap.length : i; }
function sterneVon(A){ return A.kap.reduce((n, k, i) => n + ((kapStand(A.id, i) || {}).s || 0), 0); }
function wahl(){ const w = LS.get(K_WAHL, "schweiz"); return ABENTEUER.some(a => a.id === w) ? w : "schweiz"; }
const quizTitel = (A, k) => `${A.kurz}, Kapitel ${k.nr}: ${k.name}`;
const sterneFuer = (r, n) => { const q = n ? r / n : 0; return q >= 1 ? 3 : q >= 0.8 ? 2 : q >= 0.6 ? 1 : 0; };

/* ---------- Fragen auswählen ---------- */
const CH_T = /^(kt_[A-Z]{2}|geo_schweiz|ch_geschichte|schweiz)$/;
const SANFT = /Schlacht|Krieg|töte|getötet|Mord|ermord|Blut|Hinricht|Waffe|Leiche|Gefängnis|Pest|Folter|Bombe|Söldner|Gessler|Armbrust|erschoss|gestorben|\bstarb\b|\bTod\b|Toten|Seuche|Massaker|Attentat|Löwendenkmal|Caesar|Bibracte|Eroberung|erobert|besiegt|Niederlage|Kampf|kämpf|Angriff|Überfall|Feldzug|belager|zerstör|Gardist|\bsiegt|\bSieg\b|besieg/i;
const POOL = new Map();
function fragenFuer(k){
  const alle = api().fragen();
  const alt = POOL.get(k); if(alt && alt.n === alle.length) return alt;
  const th = new Set(k.th || []), tx = new Set(k.tx || []);
  const gesehen = new Set();
  const A = [], B = [], B2 = [];
  for(const f of alle){
    if(!f) continue;
    const inTh = th.has(f.t), inRx = !inTh && !!k.rx && (CH_T.test(f.t) || tx.has(f.t));
    if((!inTh && !inRx) || gesehen.has(f.q)) continue;
    const q = f.q + " " + (f.s || "");
    if(inRx && !k.rx.test(q)) continue;
    if(SANFT.test(q + " " + f.a[0])) continue;
    if(inRx && k.chOnly && tx.has(f.t) && !/Schweiz|Kanton|Bundes/.test(q)) continue;
    gesehen.add(f.q); (inTh ? A : tx.has(f.t) ? B2 : B).push(f);
  }
  const p = {A, B, B2, n:alle.length}; POOL.set(k, p);
  return p;
}
function quizListe(k, stufe){
  const {A, B, B2} = fragenFuer(k);
  const stufen = [stufe, ...[1, 2, 3].filter(x => x !== stufe).sort((a, b) => Math.abs(a - stufe) - Math.abs(b - stufe))];
  const aus = [];
  const nimm = (liste, n) => { for(const f of liste){ if(aus.length >= 5 || n <= 0) break; if(!aus.includes(f)){ aus.push(f); n--; } } };
  for(const l of stufen){
    if(aus.length >= 5) break;
    const a = shuffle(A.filter(f => (f.l || 1) === l)), b = shuffle(B.filter(f => (f.l || 1) === l)), b2 = shuffle(B2.filter(f => (f.l || 1) === l));
    if(k.mix){
      /* Finale: Fragen aus möglichst vielen verschiedenen Kantonen */
      const proT = new Map(); a.forEach(f => { if(!proT.has(f.t)) proT.set(f.t, f); });
      nimm(shuffle([...proT.values()]), 4); nimm(b, 1); nimm(a, 5);
    } else {
      nimm(a, b.length + b2.length ? 3 : 5); nimm(b, b2.length ? 3 : 5); nimm(b2, 5); nimm(b, 5); nimm(a, 5);
    }
  }
  return shuffle(aus).slice(0, 5);
}

/* ---------- Ergebnis eines Kapitel-Quiz ---------- */
function ergebnisSpeichern(lauf, richtig, total){
  const A = finde(lauf.aid), i = lauf.i, k = A.kap[i]; if(!k) return null;
  const s = stand(); s[A.id] = s[A.id] || {};
  const alt = s[A.id][i] || null;
  const st = sterneFuer(richtig, total), ok = total > 0 && richtig >= Math.ceil(total * 0.6);
  const neu = { ok: !!(alt && alt.ok) || ok, s: Math.max(alt ? alt.s || 0 : 0, ok ? st : 0), best: Math.max(alt ? alt.best || 0 : 0, richtig), n: (alt ? alt.n || 0 : 0) + 1 };
  s[A.id][i] = neu; LS.set(K_STAND, s);
  let xp = 0;
  if(ok && !(alt && alt.ok)) xp = 15 + 5 * st;
  else if(ok && st > (alt ? alt.s || 0 : 0)) xp = 5 * (st - (alt.s || 0));
  let xpEcht = 0; if(xp){ try{ xpEcht = api().xp(xp) || xp; }catch(e){ xpEcht = xp; } }
  const zumErstenMal = ok && !(alt && alt.ok);
  const fertig = zumErstenMal && A.kap.every((x, j) => geschafft(A.id, j));
  let karte = null, teil = null;
  if(fertig){
    try{ karte = window.EP_ALBUM?.karteGeben?.({thema: A.id === "zeit" ? "ch_geschichte" : "geo_schweiz", selten:true}) || null; }catch(e){}
    try{ teil = window.EP_GARDEROBE?.teilGeben?.() || null; }catch(e){}
  }
  const erg = { aid:A.id, i, richtig, total, s:st, ok, xp:xpEcht, neuFrei: zumErstenMal && i + 1 < A.kap.length, fertig,
    karte: karte ? {titel:karte.titel || "", seltenheit:karte.seltenheit || ""} : null, teil: teil ? {name:teil.name || "", emo:teil.emo || "🎁"} : null };
  SS.set(K_ERG, erg);
  return erg;
}

document.addEventListener("ep:quizende", e => {
  try{
    const d = e.detail || {}, lauf = SS.get(K_LAUF);
    if(!lauf || d.titel !== lauf.titel) return;
    const erg = ergebnisSpeichern(lauf, d.richtig || 0, d.total || 0); if(!erg) return;
    if(erg.ok) ton(erg.neuFrei || erg.fertig ? "freischalten" : "richtig");
    /* Knopf «Weiter zum Abenteuer» auf der Ergebnisseite */
    const karte = document.querySelector("#app .card.done"); if(!karte || karte.querySelector(".xa-done")) return;
    const A = finde(erg.aid), k = A.kap[erg.i];
    const d2 = document.createElement("div"); d2.className = "xa-done";
    const text = erg.ok
      ? (erg.fertig ? `🏆 Abenteuer «${A.titel}» geschafft!` : erg.neuFrei ? `✅ Kapitel ${k.nr} geschafft! Kapitel ${k.nr + 1} ist jetzt frei.` : `✅ Kapitel ${k.nr} geschafft!`)
      : `💪 Ab ${Math.ceil(erg.total * 0.6)} richtigen Antworten geht es weiter. Lumi und Milo warten auf dich!`;
    d2.innerHTML = `<img src="${KIDS}${erg.ok ? "duo-jubel" : "duo-bereit"}.webp" alt=""><div><p>${h(text)}</p>${erg.xp ? `<small>+${erg.xp} XP</small>` : ""}</div><button type="button" class="xa-done-btn">🗺️ Weiter zum Abenteuer</button>`;
    d2.querySelector("button").onclick = () => { ton("klick"); SS.set(K_LAUF, null); go("x-abenteuer"); };
    const row = karte.querySelector(".row"); if(row) karte.insertBefore(d2, row); else karte.appendChild(d2);
  }catch(err){ console.warn("abenteuer quizende", err); }
});

/* ---------- Seite ---------- */
const V = { ansicht:"karte", aid:null, i:0, sz:0, box:null, cols:0 };

const LAND = `<svg class="xa-land" viewBox="0 0 400 200" preserveAspectRatio="none"><path d="M0 200V128L70 70L112 102L180 34L250 112L300 76L400 140V200Z" fill="#7FA7C9"/><path d="M180 34L204 62L190 58L178 68L164 58Z M70 70L86 83L74 82L62 88Z M300 76L318 89L304 88L292 92Z" fill="#fff"/><path d="M0 200V160Q100 128 200 158T400 150V200Z" fill="#6CC070"/><path d="M0 200V178Q120 160 260 182T400 176V200Z" fill="#4FA65A"/></svg>`;
function bildHTML(k, gross){
  const b = BILD[k.bild];
  const quellen = [];
  if(b){
    const breit = (innerWidth || 0) * (devicePixelRatio || 1) > 640;
    if(!window.claude){ const lok = breit ? (b.g || b.k) : b.k; if(lok && /^bilder\/(gross\/)?[a-z0-9]{2}\/[a-z0-9]+\.webp$/.test(lok)) quellen.push(lok); }
    if(/^https:\/\//.test(b.u)) quellen.push(b.u);
  }
  return `<figure class="xa-bild${gross ? " gross" : ""}" style="--kf:${k.farbe}">
    <div class="xa-szene" aria-hidden="true"><span class="xa-sonne"></span>${LAND}<span class="xa-bemo">${k.emo}</span></div>
    ${quellen.length ? `<img class="xa-foto" alt="${h(b.t)}" data-q='${h(JSON.stringify(quellen))}' data-qi="0" src="${h(quellen[0])}" decoding="async">` : ""}
    ${b ? `<figcaption class="xa-credit"><a href="${h(b.p)}" target="_blank" rel="noopener">${h(b.t)}</a> · ${h(b.a)} · ${h(b.l)}</figcaption>` : ""}
  </figure>`;
}
function bilderBinden(root){
  root.querySelectorAll("img.xa-foto").forEach(img => {
    const fig = img.closest(".xa-bild");
    const ok = () => fig && fig.classList.add("geladen");
    if(img.complete && img.naturalWidth) ok();
    img.addEventListener("load", ok);
    img.addEventListener("error", () => {
      let q = []; try{ q = JSON.parse(img.dataset.q || "[]"); }catch(e){}
      const n = (+img.dataset.qi || 0) + 1;
      if(n < q.length){ img.dataset.qi = n; img.src = q[n]; }
      else { img.remove(); fig && fig.classList.remove("geladen"); }
    });
  });
}

function kopfHTML(){
  return `<div class="xa-kopf"><div class="xa-kt"><h1>Abenteuer mit Lumi und Milo</h1><p>Lies die Geschichte und hilf beim Quiz, dann geht die Reise weiter.</p></div><img src="${KIDS}duo-bereit.webp" alt=""></div>`;
}
function tabsHTML(A){
  return `<div class="xa-tabs" role="tablist" aria-label="Abenteuer wählen">${ABENTEUER.map(x => {
    const n = x.kap.filter((k, i) => geschafft(x.id, i)).length;
    return `<button type="button" role="tab" class="xa-tab${x.id === A.id ? " an" : ""}" aria-selected="${x.id === A.id}" data-ab="${x.id}" style="--af:${x.farbe}"><span aria-hidden="true">${x.emo}</span><b>${h(x.titel)}</b><small>${n}/${x.kap.length}</small></button>`; }).join("")}</div>`;
}
function spalten(){
  const w = (V.box && V.box.clientWidth) || innerWidth;
  return w < 520 ? 3 : w < 760 ? 4 : 6;
}
function karteHTML(A){
  const cols = V.cols = spalten(), n = naechstes(A);
  const st = A.kap.map((k, i) => {
    const r = Math.floor(i / cols), c = r % 2 ? cols - 1 - (i % cols) : i % cols;
    const ks = kapStand(A.id, i), fertig = !!(ks && ks.ok), akt = i === n, zu = !frei(A.id, i);
    const cls = fertig ? "fertig" : akt ? "aktuell" : zu ? "zu" : "";
    const zustand = fertig ? `geschafft, ${ks.s} von 3 Sternen` : akt ? "als Nächstes dran" : zu ? "noch gesperrt" : "";
    return `<button type="button" class="xa-st ${cls}" data-k="${i}" style="grid-row:${r + 1};grid-column:${c + 1}" aria-label="Kapitel ${k.nr}: ${h(k.name)}, ${zustand}">
      <span class="xa-kreis" style="--kf:${k.farbe}"><span class="xa-semo" aria-hidden="true">${zu ? "🔒" : k.emo}</span><i>${k.nr}</i>${akt ? `<img class="xa-mini" src="${KIDS}m1.webp" alt="">` : ""}</span>
      <span class="xa-sname">${h(k.kurz)}</span>
      <span class="xa-sst" aria-hidden="true">${fertig ? "★".repeat(ks.s) + "☆".repeat(3 - ks.s) : ""}</span>
    </button>`;
  }).join("");
  const rows = Math.ceil(A.kap.length / cols);
  return `<div class="xa-karte" style="--af:${A.farbe}"><svg class="xa-pfad" aria-hidden="true"></svg><div class="xa-gitter" style="grid-template-columns:repeat(${cols},minmax(0,1fr));grid-template-rows:repeat(${rows},auto)">${st}</div></div>`;
}
function weiterHTML(A){
  const n = naechstes(A), alle = A.kap.length, sterne = sterneVon(A);
  if(n >= alle) return `<div class="xa-weiter fertig"><img src="${KIDS}duo-jubel.webp" alt=""><div><small>Alle ${alle} Kapitel geschafft · ${sterne}/${alle * 3} ★</small><b>${h(A.titel)} geschafft!</b><p>Du kannst jedes Kapitel nochmals lesen und mehr Sterne holen.</p></div></div>`;
  const k = A.kap[n];
  return `<div class="xa-weiter"><img src="${KIDS}${n % 2 ? "j1" : "m1"}.webp" alt=""><div><small>${n ? `${n}/${alle} geschafft · ${sterne} ★` : `${alle} Kapitel · ${h(A.text)}`}</small><b>Kapitel ${k.nr}: ${h(k.name)}</b><button type="button" class="xa-btn gelb" data-oeffne="${n}">${n ? "▶ Weiterlesen" : "▶ Abenteuer starten"}</button></div></div>`;
}

function seiteKarte(){
  const A = finde(V.aid);
  V.box.innerHTML = `<div class="xa-seite">${kopfHTML()}${tabsHTML(A)}<div class="xa-haupt">${karteHTML(A)}${weiterHTML(A)}</div></div>`;
  V.box.querySelectorAll("[data-ab]").forEach(b => b.onclick = () => { ton("klick"); V.aid = b.dataset.ab; LS.set(K_WAHL, V.aid); zeichne(); });
  V.box.querySelectorAll(".xa-st").forEach(b => b.onclick = () => {
    const i = +b.dataset.k;
    if(!frei(A.id, i)){ ton("klick"); api().toast(`Schaff zuerst Kapitel ${i}, dann geht es hier weiter.`); return; }
    oeffne(i);
  });
  V.box.querySelectorAll("[data-oeffne]").forEach(b => b.onclick = () => oeffne(+b.dataset.oeffne));
  requestAnimationFrame(pfadZeichnen);
}
function pfadZeichnen(){
  const karte = V.box && V.box.querySelector(".xa-karte"), svg = karte && karte.querySelector(".xa-pfad"); if(!svg) return;
  const A = finde(V.aid), n = naechstes(A), r0 = karte.getBoundingClientRect();
  const p = [...karte.querySelectorAll(".xa-st .xa-kreis")].map(e => { const r = e.getBoundingClientRect(); return [r.left - r0.left + r.width / 2, r.top - r0.top + r.height / 2]; });
  if(p.length < 2) return;
  const weg = upto => { let d = `M${p[0][0]},${p[0][1]}`; for(let i = 1; i <= upto && i < p.length; i++){ const [x0, y0] = p[i - 1], [x1, y1] = p[i];
    if(Math.abs(y1 - y0) < 4) d += ` L${x1},${y1}`; else { const dx = (x0 > r0.width / 2 ? 1 : -1) * Math.min(60, r0.width * .08); d += ` C${x0 + dx},${y0} ${x1 + dx},${y1} ${x1},${y1}`; } } return d; };
  svg.setAttribute("viewBox", `0 0 ${r0.width} ${r0.height}`);
  svg.innerHTML = `<path d="${weg(p.length)}" class="xa-weg"/>${n > 0 ? `<path d="${weg(Math.min(n, p.length - 1))}" class="xa-weg-ok"/>` : ""}`;
}

function oeffne(i){ ton("klick"); V.ansicht = "kapitel"; V.i = i; V.sz = 0; zeichne(); try{ scrollTo(0, 0); }catch(e){} }

function figurHTML(wer, pose){
  const src = pose || POSE[wer][(V.sz) % POSE[wer].length];
  const alt = wer === "l" ? "Lumi" : wer === "m" ? "Milo" : "Lumi und Milo";
  return `<img class="xa-figur ${wer === "e" ? "duo" : wer}" src="${KIDS}${src}.webp" alt="${alt}">`;
}
function kapTeile(A, k){
  const sz = k.sz, i = Math.max(0, Math.min(V.sz, sz.length - 1)), [wer, text, pose] = sz[i], letzte = i === sz.length - 1;
  const ks = kapStand(A.id, V.i);
  return {
    zahl: `${i + 1}/${sz.length}`, zahlLabel: `Szene ${i + 1} von ${sz.length}`, wer,
    spiel: `<div class="xa-blase ${wer}" aria-live="polite"><b>${wer === "e" ? "📖 Erzähler" : h(NAME[wer])}</b><p>${h(text)}</p></div>
        <div class="xa-figbox">${figurHTML(wer, pose)}</div>`,
    steuer: `<button type="button" class="xa-btn glas" data-zurueck ${i === 0 ? "disabled" : ""} aria-label="Vorherige Szene">◀</button>
      <div class="xa-punkte" aria-hidden="true">${sz.map((x, j) => `<i class="${j === i ? "an" : j < i ? "ok" : ""}"></i>`).join("")}</div>
      ${letzte ? `<button type="button" class="xa-btn gelb gross" data-quiz>🎯 Quiz starten</button>` : `<button type="button" class="xa-btn weiss gross" data-weiter>Weiter ▶</button>`}`,
    info: letzte ? `5 Fragen · ab 3 richtigen geht es weiter${ks && ks.ok ? ` · bisher ${"★".repeat(ks.s)}${"☆".repeat(3 - ks.s)}` : ""}` : ""
  };
}
function kapBinden(A){
  const zb = V.box.querySelector("[data-zurueck]"); if(zb) zb.onclick = () => szene(-1);
  const wb = V.box.querySelector("[data-weiter]"); if(wb) wb.onclick = () => szene(1);
  const qb = V.box.querySelector("[data-quiz]"); if(qb) qb.onclick = () => quizStarten(A, V.i);
}
function seiteKapitel(){
  const A = finde(V.aid), k = A.kap[V.i]; if(!k){ V.ansicht = "karte"; return seiteKarte(); }
  const t = kapTeile(A, k);
  V.box.innerHTML = `<div class="xa-seite xa-kap" data-kap="${A.id}-${V.i}">
    <div class="xa-leiste"><button type="button" class="xa-pill knopf" data-zur-karte aria-label="Zurück zur Abenteuer-Karte">🗺️ Karte</button><span class="xa-pill titel">Kapitel ${k.nr} · ${h(k.name)}</span><span class="xa-pill zahl" aria-label="${t.zahlLabel}">${t.zahl}</span></div>
    <div class="xa-buehne" style="--kf:${k.farbe}">
      ${bildHTML(k, true)}
      <div class="xa-spiel ${t.wer}">${t.spiel}</div>
    </div>
    <div class="xa-steuer">${t.steuer}</div>
    <p class="xa-info"${t.info ? "" : " hidden"}>${t.info}</p>
  </div>`;
  bilderBinden(V.box);
  V.box.querySelector("[data-zur-karte]").onclick = () => { ton("klick"); V.ansicht = "karte"; zeichne(); };
  kapBinden(A);
}
function szene(d){
  const A = finde(V.aid), k = A.kap[V.i]; if(!k) return;
  const n = V.sz + d; if(n < 0 || n >= k.sz.length) return;
  ton(d > 0 ? "wisch" : "klick"); V.sz = n;
  const kap = V.box && V.box.querySelector(`.xa-kap[data-kap="${A.id}-${V.i}"]`);
  if(kap){
    /* nur Sprechblase, Figur und Knöpfe tauschen; das Kapitelbild bleibt stehen */
    const t = kapTeile(A, k);
    const sp = kap.querySelector(".xa-spiel"); sp.className = "xa-spiel " + t.wer; sp.innerHTML = t.spiel;
    kap.querySelector(".xa-steuer").innerHTML = t.steuer;
    const z = kap.querySelector(".xa-pill.zahl"); z.textContent = t.zahl; z.setAttribute("aria-label", t.zahlLabel);
    const inf = kap.querySelector(".xa-info"); inf.textContent = t.info; inf.hidden = !t.info;
    kapBinden(A);
  } else zeichne();
  const f = V.box.querySelector(d > 0 ? "[data-weiter],[data-quiz]" : "[data-zurueck]:not([disabled])") || V.box.querySelector("[data-weiter],[data-quiz]");
  try{ f && f.focus({preventScroll:true}); }catch(e){}
}
function quizStarten(A, i){
  const k = A.kap[i];
  const liste = quizListe(k, api().stufe());
  if(liste.length < 3){ api().toast("Für dieses Kapitel sind gerade zu wenige Fragen geladen. Versuch es gleich nochmals."); return; }
  const titel = quizTitel(A, k);
  SS.set(K_LAUF, { aid:A.id, i, titel, t:Date.now() });
  SS.set(K_ERG, null);
  ton("klick");
  api().quiz(liste, titel);
}

/* Erfolgsszene nach dem Quiz */
function erfolgZeigen(erg){
  const A = finde(erg.aid), k = A.kap[erg.i]; if(!k) return;
  const naechst = A.kap[erg.i + 1];
  const andere = ABENTEUER.find(x => x.id !== A.id && naechstes(x) < x.kap.length);
  const titel = erg.ok ? (erg.fertig ? "Abenteuer geschafft!" : "Kapitel geschafft!") : "Fast geschafft!";
  const text = erg.ok
    ? (erg.fertig ? (A.id === "schweiz" ? "Der Reisepass ist voll! Lumi und Milo haben die ganze Schweiz durchquert, und du warst dabei." : "Die Sanduhr steht still. Was für eine Reise durch die Zeit!")
       : naechst ? (A.id === "schweiz" ? `Stempel ${k.nr} ist im Reisepass. Weiter geht es: ${naechst.kurz}!` : `Die Sanduhr dreht sich schon. Nächster Halt: ${naechst.kurz}!`) : "Super gemacht!")
    : `${erg.richtig} von ${erg.total} richtig. Ab ${Math.ceil(erg.total * 0.6)} richtigen geht es weiter. Lumi und Milo glauben an dich!`;
  const d = document.createElement("div"); d.className = "xa-erfolg"; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-label", titel);
  d.innerHTML = `<div class="xa-ekarte ${erg.ok ? "ok" : "nochmal"}" style="--kf:${k.farbe}">
    <img class="xa-efig" src="${KIDS}${erg.ok ? "duo-jubel" : "duo-bereit"}.webp" alt="">
    <div class="xa-etext">
      <small>Kapitel ${k.nr} · ${h(k.name)}</small>
      <h2>${titel}</h2>
      ${erg.ok ? `<div class="xa-esterne" aria-label="${erg.s} von 3 Sternen">${[0, 1, 2].map(j => `<span class="${j < erg.s ? "an" : ""}" style="--d:${j * .18}s">★</span>`).join("")}</div>` : ""}
      <p>${h(text)}</p>
      <div class="xa-ebelohnung">${erg.ok ? `<span>✅ ${erg.richtig}/${erg.total} richtig</span>` : ""}${erg.xp ? `<span>⚡ +${erg.xp} XP</span>` : ""}${erg.karte ? `<span>🃏 ${h(erg.karte.titel || "Sammelkarte")}</span>` : ""}${erg.teil ? `<span>${h(erg.teil.emo)} ${h(erg.teil.name)}</span>` : ""}</div>
      <div class="xa-eknoepfe">
        ${erg.ok && naechst ? `<button type="button" class="xa-btn gelb" data-e="weiter">▶ Kapitel ${naechst.nr}: ${h(naechst.kurz)}</button>` : ""}
        ${!erg.ok ? `<button type="button" class="xa-btn gelb" data-e="nochmal">🎯 Nochmals versuchen</button><button type="button" class="xa-btn weiss" data-e="lesen">📖 Geschichte nochmals</button>` : ""}
        ${erg.fertig && andere ? `<button type="button" class="xa-btn gelb" data-e="andere">${andere.emo} ${h(andere.titel)} starten</button>` : ""}
        <button type="button" class="xa-btn glas" data-e="karte">🗺️ Zur Karte</button>
      </div>
    </div></div>`;
  document.body.appendChild(d);
  const zu = () => { d.remove(); document.removeEventListener("keydown", esc, true); };
  const esc = e => { if(e.key === "Escape"){ e.stopPropagation(); zu(); zeichne(); } };
  document.addEventListener("keydown", esc, true);
  d.addEventListener("click", e => { if(e.target === d){ zu(); zeichne(); } });
  d.querySelectorAll("[data-e]").forEach(b => b.onclick = () => {
    const a = b.dataset.e; zu();
    if(a === "weiter"){ oeffne(erg.i + 1); }
    else if(a === "nochmal"){ quizStarten(A, erg.i); }
    else if(a === "lesen"){ oeffne(erg.i); }
    else if(a === "andere" && andere){ V.aid = andere.id; LS.set(K_WAHL, V.aid); oeffne(naechstes(andere)); }
    else { ton("klick"); V.ansicht = "karte"; zeichne(); }
  });
  if(erg.ok){ ton(erg.fertig ? "fanfare" : "sammeln"); if(erg.fertig || erg.s === 3) try{ api().konfetti(); }catch(e){} }
  setTimeout(() => { try{ (d.querySelector(".xa-btn.gelb") || d.querySelector(".xa-btn")).focus(); }catch(e){} }, 60);
}

function zeichne(){
  if(!V.box || !V.box.isConnected) return;
  if(V.ansicht === "kapitel") seiteKapitel(); else seiteKarte();
}

/* Tastatur: Pfeile blättern in der Geschichte */
document.addEventListener("keydown", e => {
  try{
    if(typeof S === "undefined" || S.screen !== "x-abenteuer" || V.ansicht !== "kapitel" || document.querySelector(".xa-erfolg")) return;
    const t = e.target; if(t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    if(e.key === "ArrowRight"){ e.preventDefault(); szene(1); }
    else if(e.key === "ArrowLeft"){ e.preventDefault(); szene(-1); }
  }catch(err){}
});
let rz = 0;
addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => {
  try{ if(typeof S === "undefined" || S.screen !== "x-abenteuer" || V.ansicht !== "karte") return;
    if(spalten() !== V.cols) zeichne(); else pfadZeichnen(); }catch(e){} }, 150); });

/* ---------- Stil ---------- */
const css = document.createElement("style"); css.id = "ep-x-abenteuer";
css.textContent = `
.xa-seite{display:flex;flex-direction:column;gap:12px;color:#fff}
.xa-kopf{position:relative;display:flex;align-items:center;padding:18px 22px;border-radius:28px;color:#fff;background:linear-gradient(135deg,#0B6E6A,#0FA968 55%,#7BC043);box-shadow:0 14px 30px rgba(20,80,60,.25);min-height:92px;margin-top:4px}
.xa-kopf h1{margin:0;font-size:clamp(1.3rem,3.6vw,2rem);color:#fff;line-height:1.15}
.xa-kopf p{margin:4px 0 0;color:#fff;opacity:.95;font-size:.95rem}
.xa-kt{padding-right:150px}
.xa-kopf img{position:absolute;right:12px;bottom:0;height:calc(100% + 26px);max-height:150px;pointer-events:none}
.xa-tabs{display:flex;gap:10px;flex-wrap:wrap}
.xa-tab{flex:1 1 220px;display:flex;align-items:center;gap:10px;border:0;border-radius:20px;padding:10px 14px;color:#fff;background:rgba(15,20,48,.55);cursor:pointer;font:inherit;text-align:left;box-shadow:0 6px 16px rgba(27,34,64,.15);min-height:48px}
.xa-tab span{font-size:1.4rem}
.xa-tab b{flex:1;color:#fff;font-size:1rem}
.xa-tab small{color:#fff;font-weight:800;background:rgba(255,255,255,.2);border-radius:999px;padding:2px 9px}
.xa-tab.an{background:var(--af);box-shadow:0 10px 22px rgba(27,34,64,.25)}
.xa-haupt{display:grid;grid-template-columns:minmax(0,2.1fr) minmax(250px,1fr);gap:14px;align-items:stretch}
.xa-karte{position:relative;border-radius:28px;padding:20px 12px 14px;background:var(--af);box-shadow:0 14px 30px rgba(27,34,64,.22);overflow:hidden}
.xa-karte::before{content:"";position:absolute;inset:auto -10% -30px -10%;height:46%;background:radial-gradient(ellipse at 20% 100%,rgba(255,255,255,.16),transparent 60%),radial-gradient(ellipse at 80% 100%,rgba(255,255,255,.12),transparent 55%);pointer-events:none}
.xa-pfad{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.xa-weg{fill:none;stroke:rgba(255,255,255,.55);stroke-width:5;stroke-dasharray:2 12;stroke-linecap:round}
.xa-weg-ok{fill:none;stroke:#FFE34D;stroke-width:6;stroke-linecap:round;opacity:.95}
.xa-gitter{position:relative;display:grid;gap:10px 6px}
.xa-st{display:flex;flex-direction:column;align-items:center;gap:3px;border:0;background:none;color:#fff;cursor:pointer;font:inherit;padding:4px 2px;border-radius:18px;min-width:0}
.xa-st:focus-visible{outline:3px solid #FFE34D;outline-offset:2px}
.xa-kreis{position:relative;display:grid;place-items:center;width:64px;height:64px;border-radius:50%;background:var(--kf);border:4px solid #fff;box-shadow:0 8px 16px rgba(0,0,0,.25);transition:transform .15s}
.xa-st:hover .xa-kreis{transform:scale(1.06)}
.xa-semo{font-size:1.75rem;line-height:1}
.xa-kreis i{position:absolute;top:-6px;left:-6px;min-width:22px;height:22px;border-radius:999px;background:#1B2240;color:#fff;font-style:normal;font-weight:800;font-size:.75rem;display:grid;place-items:center;border:2px solid #fff}
.xa-sname{font-weight:800;font-size:.86rem;color:#fff;background:rgba(15,20,48,.45);padding:2px 8px;border-radius:999px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.xa-sst{min-height:1em;color:#FFE34D;font-size:.9rem;letter-spacing:1px;text-shadow:0 1px 2px rgba(0,0,0,.35)}
.xa-st.zu .xa-kreis{background:rgba(15,20,48,.45);border-color:rgba(255,255,255,.6);box-shadow:none}
.xa-st.zu .xa-sname{opacity:.8}
.xa-st.fertig .xa-kreis{border-color:#FFE34D}
.xa-st.aktuell .xa-kreis{border-color:#FFE34D;box-shadow:0 0 0 6px rgba(255,227,77,.35),0 8px 16px rgba(0,0,0,.25);animation:xaPuls 1.8s ease-in-out infinite}
.xa-mini{position:absolute;right:-16px;bottom:-8px;height:46px;pointer-events:none;filter:drop-shadow(0 2px 3px rgba(0,0,0,.3))}
@keyframes xaPuls{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
.xa-weiter{position:relative;display:flex;align-items:flex-end;gap:12px;border-radius:28px;padding:18px;background:linear-gradient(135deg,#5B4BF5,#9B4DE0 60%,#E043B8);box-shadow:0 14px 30px rgba(60,40,140,.25);color:#fff;overflow:hidden}
.xa-weiter img{height:150px;flex:none;align-self:flex-end;margin-bottom:-18px;filter:drop-shadow(0 4px 6px rgba(0,0,0,.2))}
.xa-weiter div{display:flex;flex-direction:column;gap:6px;min-width:0}
.xa-weiter small{color:#fff;opacity:.95;font-weight:700}
.xa-weiter b{font-size:1.2rem;color:#fff;line-height:1.2}
.xa-weiter p{margin:0;color:#fff;font-size:.92rem}
.xa-btn{border:0;border-radius:999px;padding:12px 20px;font:inherit;font-weight:800;cursor:pointer;min-height:46px;box-shadow:0 6px 14px rgba(0,0,0,.18);transition:transform .12s}
.xa-btn:hover:not([disabled]){transform:translateY(-1px)}
.xa-btn:focus-visible,.xa-pill.knopf:focus-visible,.xa-tab:focus-visible,.xa-done-btn:focus-visible{outline:3px solid #FFE34D;outline-offset:3px}
.xa-btn.gelb{background:#FFE34D;color:#1B2240}
.xa-btn.weiss{background:#fff;color:#1B2240}
.xa-btn.glas{background:rgba(15,20,48,.6);color:#fff}
.xa-btn[disabled]{opacity:.45;cursor:default}
.xa-btn.gross{font-size:1.05rem;padding:13px 26px}
/* Kapitelansicht */
.xa-leiste{display:flex;align-items:center;gap:8px;min-width:0}
.xa-pill{background:rgba(15,20,48,.6);color:#fff;border-radius:999px;padding:8px 14px;font-weight:800;font-size:.92rem;white-space:nowrap}
.xa-pill.knopf{border:0;font:inherit;font-weight:800;cursor:pointer;min-height:40px}
.xa-pill.titel{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis}
.xa-buehne{position:relative;display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:14px;border-radius:28px;padding:14px;background:var(--kf);box-shadow:0 14px 30px rgba(27,34,64,.22)}
.xa-bild{position:relative;margin:0;border-radius:22px;overflow:hidden;min-height:180px;background:linear-gradient(180deg,#8FD3FF,#CDEBFF 60%,#E9F7FF)}
.xa-bild.gross{min-height:min(48vh,400px)}
.xa-szene{position:absolute;inset:0}
.xa-land{position:absolute;left:0;bottom:0;width:100%;height:70%}
.xa-sonne{position:absolute;top:12%;right:14%;width:52px;height:52px;border-radius:50%;background:#FFE34D;box-shadow:0 0 30px rgba(255,227,77,.8)}
.xa-bemo{position:absolute;left:50%;top:48%;transform:translate(-50%,-50%);font-size:clamp(3.5rem,10vw,6rem);filter:drop-shadow(0 6px 8px rgba(0,0,0,.25))}
.xa-foto{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .4s}
.xa-bild.geladen .xa-foto{opacity:1}
.xa-credit{position:absolute;left:8px;right:8px;bottom:8px;font-size:.68rem;color:#fff;background:rgba(15,20,48,.6);border-radius:10px;padding:3px 8px;opacity:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.xa-bild.geladen .xa-credit{opacity:1}
.xa-credit a{color:#fff}
.xa-spiel{position:relative;display:flex;flex-direction:column;justify-content:space-between;gap:8px;min-height:0}
.xa-blase{position:relative;border-radius:22px;padding:14px 16px;color:#fff;box-shadow:0 8px 18px rgba(0,0,0,.18);animation:xaRein .35s ease-out}
.xa-blase b{display:block;font-size:.85rem;opacity:.95;margin-bottom:3px;color:#fff}
.xa-blase p{margin:0;font-size:clamp(1rem,1.6vw,1.2rem);line-height:1.45;color:#fff}
.xa-blase.l{background:linear-gradient(135deg,#D63E9A,#A63BD6)}
.xa-blase.m{background:linear-gradient(135deg,#2F6BFF,#1C3FCC)}
.xa-blase.e{background:rgba(15,20,48,.72)}
.xa-blase.e p{font-style:italic}
.xa-blase.l::after,.xa-blase.m::after{content:"";position:absolute;bottom:-12px;width:0;height:0;border:12px solid transparent;border-bottom:0}
.xa-blase.l::after{left:34px;border-top-color:#B93CC6}
.xa-blase.m::after{right:34px;border-top-color:#1F48D8}
.xa-figbox{display:flex;align-items:flex-end;justify-content:flex-start;min-height:0;flex:1}
.xa-spiel.m .xa-figbox{justify-content:flex-end}
.xa-spiel.e .xa-figbox{justify-content:center}
.xa-figur{max-height:min(34vh,290px);max-width:100%;object-fit:contain;filter:drop-shadow(0 6px 10px rgba(0,0,0,.25));animation:xaHupf .45s ease-out}
.xa-figur.duo{max-height:min(30vh,260px)}
@keyframes xaRein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes xaHupf{0%{transform:translateY(10px) scale(.96);opacity:.3}100%{transform:none;opacity:1}}
.xa-steuer{display:flex;align-items:center;gap:10px}
.xa-steuer .xa-btn.glas{width:48px;padding:0;flex:none}
.xa-punkte{flex:1;display:flex;justify-content:center;gap:6px;flex-wrap:wrap}
.xa-punkte i{width:10px;height:10px;border-radius:50%;background:rgba(15,20,48,.3)}
.xa-punkte i.ok{background:rgba(15,20,48,.6)}
.xa-punkte i.an{background:#FFE34D;box-shadow:0 0 0 2px rgba(15,20,48,.55);transform:scale(1.25)}
.xa-info[hidden]{display:none}
.xa-info{margin:0;align-self:center;background:rgba(15,20,48,.55);color:#fff;border-radius:999px;padding:6px 14px;font-size:.88rem;font-weight:700;text-align:center}
/* Erfolg */
.xa-erfolg{position:fixed;inset:0;z-index:9000;display:grid;place-items:center;padding:16px;background:rgba(15,20,48,.55);animation:xaRein .25s ease-out}
.xa-ekarte{position:relative;display:flex;align-items:flex-end;gap:12px;width:min(640px,100%);border-radius:28px;padding:22px 22px 0;background:var(--kf);color:#fff;box-shadow:0 20px 40px rgba(0,0,0,.35);overflow:hidden;max-height:calc(100vh - 32px);overflow-y:auto}
.xa-efig{width:min(40%,230px);flex:none;align-self:flex-end;filter:drop-shadow(0 6px 10px rgba(0,0,0,.25))}
.xa-etext{display:flex;flex-direction:column;gap:8px;padding-bottom:22px;min-width:0}
.xa-etext small{font-weight:700;color:#fff;opacity:.95}
.xa-etext h2{margin:0;color:#fff;font-size:clamp(1.5rem,4vw,2rem)}
.xa-etext p{margin:0;color:#fff;line-height:1.4}
.xa-esterne{display:flex;gap:6px;font-size:2.4rem;line-height:1}
.xa-esterne span{color:rgba(255,255,255,.35);text-shadow:0 2px 4px rgba(0,0,0,.2)}
.xa-esterne span.an{color:#FFE34D;animation:xaStern .5s var(--d) both ease-out}
@keyframes xaStern{0%{transform:scale(0) rotate(-40deg)}70%{transform:scale(1.25)}100%{transform:none}}
.xa-ebelohnung{display:flex;flex-wrap:wrap;gap:6px}
.xa-ebelohnung span{background:rgba(15,20,48,.45);border-radius:999px;padding:4px 10px;font-weight:800;font-size:.85rem;color:#fff}
.xa-ebelohnung:empty{display:none}
.xa-eknoepfe{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px}
/* Ergebnisseite des Quiz */
.xa-done{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:12px 0;padding:12px 16px;border-radius:22px;background:linear-gradient(135deg,#0B6E6A,#0FA968);color:#fff;text-align:left;box-shadow:0 10px 22px rgba(27,34,64,.2)}
.xa-done img{height:70px;flex:none}
.xa-done div{flex:1;min-width:160px}
.xa-done p{margin:0;color:#fff;font-weight:800}
.xa-done small{color:#fff;font-weight:700;opacity:.95}
.xa-done-btn{border:0;border-radius:999px;background:#FFE34D;color:#1B2240;font:inherit;font-weight:800;padding:12px 20px;min-height:46px;cursor:pointer;box-shadow:0 6px 14px rgba(0,0,0,.18)}
@media (max-width:900px){
  .xa-haupt{grid-template-columns:1fr}
  .xa-weiter{padding:14px 16px}
  .xa-weiter img{height:118px;margin-bottom:-14px}
}
@media (max-width:760px){
  .xa-buehne{grid-template-columns:1fr;padding:10px;gap:10px}
  .xa-bild.gross{min-height:0;height:clamp(130px,24vh,260px)}
  .xa-spiel{flex-direction:row;align-items:flex-end;gap:6px}
  .xa-spiel.m{flex-direction:row-reverse}
  .xa-blase{flex:1;min-width:0}
  .xa-figbox{flex:0 0 auto;width:30%;max-width:150px;justify-content:center}
  .xa-spiel.e .xa-figbox{width:36%;max-width:180px}
  .xa-figur{max-height:min(26vh,210px)}
  .xa-figur.duo{max-height:min(22vh,190px)}
  .xa-blase.l::after{left:auto;right:-10px;bottom:22px;border:10px solid transparent;border-right:0;border-left-color:#B93CC6}
  .xa-blase.m::after{right:auto;left:-10px;bottom:22px;border:10px solid transparent;border-left:0;border-right-color:#1F48D8}
}
@media (max-width:560px){
  .xa-seite{gap:10px}
  .xa-kopf{display:none}
  .xa-haupt{display:flex;flex-direction:column;gap:10px}
  .xa-weiter{order:-1}
  .xa-kopf{padding:14px 16px;border-radius:22px;min-height:76px}
  .xa-kopf p{font-size:.84rem}
  .xa-kt{padding-right:100px}
  .xa-kopf img{max-height:112px;right:4px}
  .xa-tabs{gap:6px;flex-wrap:nowrap}
  .xa-tab{flex:1 1 0;min-width:0;padding:8px 10px;gap:6px;border-radius:16px}
  .xa-tab b{font-size:.84rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .xa-tab span{font-size:1.15rem}
  .xa-tab small{font-size:.72rem;padding:1px 6px}
  .xa-karte{padding:14px 4px 8px;border-radius:22px}
  .xa-gitter{gap:2px 2px}
  .xa-st{padding:2px}
  .xa-sst{font-size:.8rem}
  .xa-kreis{width:54px;height:54px;border-width:3px}
  .xa-semo{font-size:1.45rem}
  .xa-sname{font-size:.76rem;padding:1px 7px}
  .xa-mini{height:38px;right:-14px}
  .xa-weiter{border-radius:22px;padding:12px 14px;align-items:center}
  .xa-weiter img{height:96px;margin-bottom:-12px;align-self:flex-end}
  .xa-weiter b{font-size:1rem}
  .xa-pill{padding:7px 11px;font-size:.84rem}
  .xa-blase{padding:11px 13px;border-radius:18px}
  .xa-blase p{font-size:.98rem;line-height:1.4}
  .xa-steuer .xa-btn.gross{padding:12px 18px;font-size:1rem}
  .xa-ekarte{flex-direction:column;align-items:stretch;padding:18px 18px 0}
  .xa-efig{order:2;width:auto;height:150px;align-self:center;object-fit:contain;margin-top:-6px}
  .xa-etext{padding-bottom:0}
  .xa-eknoepfe .xa-btn{flex:1 1 auto}
}
@media (max-height:760px) and (max-width:760px){
  .xa-bild.gross{height:clamp(110px,20vh,200px)}
  .xa-figur{max-height:22vh}
}
@media (prefers-reduced-motion: reduce){
  .xa-st.aktuell .xa-kreis,.xa-blase,.xa-figur,.xa-esterne span.an,.xa-erfolg{animation:none}
  .xa-foto,.xa-kreis,.xa-btn{transition:none}
}
`;
document.head.appendChild(css);

/* ---------- Anmelden ---------- */
EP_EXTRAS.register({
  id:"abenteuer", titel:"Abenteuer", text:"Reise mit Lumi und Milo durch die Schweiz", emo:"🗺️",
  farbe:"linear-gradient(135deg,#0B6E6A,#0FA968 55%,#7BC043)", reihe:30,
  hinweis(){
    try{ const A = finde(wahl()), n = naechstes(A); return n >= A.kap.length ? "Geschafft" : "Kapitel " + (n + 1); }catch(e){ return ""; }
  },
  folie(){
    try{ const A = finde(wahl()), n = naechstes(A); if(n === 0 || n >= A.kap.length) return null; const k = A.kap[n];
      return {cls:"hs-x", ic:"🗺️", lbl:"Abenteuer mit Lumi und Milo", titel:A.titel, text:`Kapitel ${k.nr}: ${k.name}`, btn:"🗺️ Weiterspielen", a:"x-abenteuer"}; }catch(e){ return null; }
  },
  render(box){
    V.box = box;
    if(!V.aid) V.aid = wahl();
    try{ window.EP_SOUND?.musik?.("abenteuer"); }catch(e){}
    const erg = SS.get(K_ERG);
    if(erg && ABENTEUER.some(a => a.id === erg.aid)){
      SS.set(K_ERG, null); SS.set(K_LAUF, null);
      V.aid = erg.aid; LS.set(K_WAHL, V.aid); V.ansicht = "karte";
      zeichne();
      setTimeout(() => erfolgZeigen(erg), ruhig() ? 0 : 250);
      return;
    }
    zeichne();
  }
});

window.EP_ABENTEUER = {
  /* Fortschritt aller Abenteuer */
  stand(){
    const l = ABENTEUER.map(A => { const n = naechstes(A); return { id:A.id, titel:A.titel, kapitel:A.kap.length, geschafft:A.kap.filter((k, i) => geschafft(A.id, i)).length,
      sterne:sterneVon(A), maxSterne:A.kap.length * 3, fertig:n >= A.kap.length, naechstes:n < A.kap.length ? {nr:n + 1, name:A.kap[n].name} : null }; });
    return { abenteuer:l, sterne:l.reduce((s, a) => s + a.sterne, 0), maxSterne:l.reduce((s, a) => s + a.maxSterne, 0), aktuell:wahl() };
  },
  /* Kapitel direkt öffnen (nr ab 1; ohne nr die Karte) */
  oeffne(aid, nr){ V.aid = finde(aid).id; V.ansicht = nr ? "kapitel" : "karte"; V.i = Math.max(0, (nr || 1) - 1); V.sz = 0; go("x-abenteuer"); },
  _fragen(aid, nr, stufe){ const k = finde(aid).kap[(nr || 1) - 1]; if(!k) return null; const p = fragenFuer(k); return { a:p.A.length, b:p.B.length, b2:p.B2.length, liste:quizListe(k, stufe || 1) }; }
};
})();
