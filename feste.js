/* easyplay Welt «Feste und Jahreszeiten» (x-feste)
   Festkalender der Schweiz mit berechneten Daten (Ostern, Fasnacht, Sechseläuten, Zibelemärit, Advent ...),
   dezente Fest-Dekoration am oberen Rand, Karussell-Folie, Fest-Quiz pro Fest (welten/feste/fragen.json)
   und Fest-Abzeichen (einmal pro Fest und Jahr).
   API: window.EP_FESTE = { aktiv(), naechstes(), liste(jahr), jahreszeit(), abzeichen(), quiz(id), heute() } */
(function(){
"use strict";
if(!window.EP_EXTRAS) return;
const X = window.EP_EXTRAS, A = X.api;

/* ---------- Datum (Schweizer Zeit; window.__epDatum wie im Rest der Seite zum Testen) ---------- */
const TAG = 864e5;
const nr = (j, m, t) => Math.round(Date.UTC(j, m - 1, t) / TAG);          // Tagesnummer
const aus = n => { const d = new Date(n * TAG); return {j:d.getUTCFullYear(), m:d.getUTCMonth() + 1, t:d.getUTCDate()}; };
const wt = n => ((n % 7) + 11) % 7;                                         // 0 = Sonntag (1.1.1970 war ein Donnerstag)
function heuteNr(){
  let d = new Date(); try{ if(window.__epDatum) d = new Date(window.__epDatum); }catch(e){}
  try{
    const p = Object.fromEntries(new Intl.DateTimeFormat("de-CH", {timeZone:"Europe/Zurich", year:"numeric", month:"numeric", day:"numeric"}).formatToParts(d).map(x => [x.type, x.value]));
    return nr(+p.year, +p.month, +p.day);
  }catch(e){ return nr(d.getFullYear(), d.getMonth() + 1, d.getDate()); }
}
function ostern(j){ // Gauss/Meeus, gregorianisch
  const a = j % 19, b = Math.floor(j / 100), c = j % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3),
    h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  return nr(j, Math.floor((h + l - 7 * m + 114) / 31), ((h + l - 7 * m + 114) % 31) + 1);
}
const nter = (j, m, w, n) => { const e = nr(j, m, 1); return e + ((w - wt(e) + 7) % 7) + 7 * (n - 1); };        // n-ter Wochentag im Monat
const letzter = (j, m, w) => { const e = nr(j, m + 1, 0); return e - ((wt(e) - w + 7) % 7); };                   // letzter Wochentag im Monat
const bettag = j => nter(j, 9, 0, 3);                                                                             // 3. Sonntag im September
function sechselaeuten(j){ // 3. Montag im April; in der Karwoche: 2. Montag; am Ostermontag: 4. Montag (Stadtratsbeschluss 1952)
  const o = ostern(j), m3 = nter(j, 4, 1, 3);
  if(m3 === o + 1) return nter(j, 4, 1, 4);
  if(m3 === o - 6) return nter(j, 4, 1, 2);
  return m3;
}
function advent1(j){ const w = nr(j, 12, 25); return w - (wt(w) || 7) - 21; }                                      // 4. Sonntag vor Weihnachten

const WT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"], WTL = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
const MO = ["Jan.", "Feb.", "März", "April", "Mai", "Juni", "Juli", "Aug.", "Sept.", "Okt.", "Nov.", "Dez."];
const MOL = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const kurzDatum = n => { const d = aus(n); return `${WT[wt(n)]} ${d.t}. ${MO[d.m - 1]}`; };
const langDatum = n => { const d = aus(n); return `${WTL[wt(n)]}, ${d.t}. ${MOL[d.m - 1]} ${d.j}`; };
const iso = n => { const d = aus(n); return d.j + "-" + String(d.m).padStart(2, "0") + "-" + String(d.t).padStart(2, "0"); };

/* ---------- Die Feste ----------
   d(j) → [von, bis] als Tagesnummern. ca: Datum je nach Ort verschieden (wir nehmen einen typischen Tag). */
const FESTE = [
  {id:"neujahr", name:"Neujahr und Berchtoldstag", emo:"🎆", deko:"funken", farbe:"linear-gradient(135deg,#1B2A6B,#4B3BC9)",
   d:j => [nr(j, 1, 1), nr(j, 1, 2)], kurz:"Das neue Jahr beginnt. Am 2. Januar ist in vielen Kantonen frei.",
   text:"Am 1. Januar beginnt das neue Jahr. Der 2. Januar heisst Berchtoldstag und ist in vielen Kantonen ein freier Tag. Man wünscht sich «Es guets Neus»."},
  {id:"dreikoenig", name:"Dreikönigstag", emo:"👑", deko:"sterne", farbe:"linear-gradient(135deg,#8A5A00,#D9A21B)",
   d:j => [nr(j, 1, 6), nr(j, 1, 6)], kurz:"Wer die Figur im Kuchen findet, ist König für einen Tag.",
   text:"Am 6. Januar erinnern Christinnen und Christen an die drei Weisen aus dem Morgenland. In der Schweiz gehört der Dreikönigskuchen dazu: Wer die kleine Figur findet, trägt die Krone."},
  {id:"fasnacht-lu", name:"Luzerner Fasnacht", emo:"🎭", deko:"konfetti", farbe:"linear-gradient(135deg,#A3127A,#E8541E)",
   d:j => [ostern(j) - 52, ostern(j) - 47], kurz:"Schmutziger Donnerstag, 5 Uhr: Urknall! Guggenmusigen und Umzüge.",
   text:"Am Schmutzigen Donnerstag um 5 Uhr früh knallt es: Bruder Fritschi kommt über den See, Konfetti regnet, und die Guggenmusigen spielen. Bis zum Güdisdienstag ist Luzern bunt und laut."},
  {id:"fasnacht-bs", name:"Basler Fasnacht", emo:"🥁", deko:"konfetti", farbe:"linear-gradient(135deg,#0E4C92,#7B2FBF)",
   d:j => [ostern(j) - 41, ostern(j) - 39], kurz:"Morgestraich um 4 Uhr, Laternen, Piccolos und Räppli. Drei Tage lang.",
   text:"Am Montag nach Aschermittwoch gehen um 4 Uhr früh in Basel die Lichter aus: Morgestraich! Cliquen ziehen mit leuchtenden Laternen, Trommeln und Piccolos durch die Gassen. Genau 72 Stunden lang."},
  {id:"sechselaeuten", name:"Sechseläuten", emo:"⛄", deko:"funken2", farbe:"linear-gradient(135deg,#B3261E,#F08A24)",
   d:j => [sechselaeuten(j), sechselaeuten(j)], kurz:"Zürich verbrennt den Böögg und verabschiedet den Winter.",
   text:"Am Zürcher Frühlingsfest ziehen die Zünfte durch die Stadt. Um 18 Uhr wird der Böögg angezündet. Je schneller sein Kopf explodiert, desto schöner soll der Sommer werden, sagt der Volksglaube."},
  {id:"ostern", name:"Ostern", emo:"🐣", deko:"eier", farbe:"linear-gradient(135deg,#2E8B57,#7CC242)",
   d:j => [ostern(j) - 2, ostern(j) + 1], kurz:"Eier färben, Eiertütschen und Ostereier suchen.",
   text:"An Ostern feiern Christinnen und Christen die Auferstehung von Jesus. Von Karfreitag bis Ostermontag haben viele frei. Kinder suchen Eier und machen beim Eiertütschen mit."},
  {id:"muttertag", name:"Muttertag", emo:"💐", deko:"herzen", farbe:"linear-gradient(135deg,#C2185B,#F06292)",
   d:j => [nter(j, 5, 0, 2), nter(j, 5, 0, 2)], kurz:"Danke sagen, mit Blumen, einem Bild oder Frühstück.",
   text:"Am zweiten Sonntag im Mai sagen viele Kinder Danke, zum Beispiel mit einer Zeichnung, Blumen oder einem selbst gemachten Frühstück."},
  {id:"auffahrt", name:"Auffahrt", emo:"☁️", deko:"", farbe:"linear-gradient(135deg,#1D6FA3,#5BB6E8)",
   d:j => [ostern(j) + 39, ostern(j) + 39], kurz:"Ein Donnerstag, 39 Tage nach Ostern. Oft mit langem Wochenende.",
   text:"An Auffahrt erinnern Christinnen und Christen daran, dass Jesus in den Himmel aufgefahren ist. Auffahrt ist immer ein Donnerstag und in der ganzen Schweiz ein Feiertag."},
  {id:"pfingsten", name:"Pfingsten", emo:"🕊️", deko:"", farbe:"linear-gradient(135deg,#B7410E,#E9762B)",
   d:j => [ostern(j) + 49, ostern(j) + 50], kurz:"50 Tage nach Ostern. Pfingstmontag ist vielerorts frei.",
   text:"An Pfingsten feiern Christinnen und Christen das Kommen des Heiligen Geistes. Es ist der 50. Tag der Osterzeit. Der Pfingstmontag ist in vielen Kantonen frei."},
  {id:"augustfeier", name:"Nationalfeiertag", emo:"🇨🇭", deko:"funken", farbe:"linear-gradient(135deg,#C8102E,#E8434F)",
   d:j => [nr(j, 8, 1), nr(j, 8, 1)], kurz:"Happy Birthday, Schweiz! Lampions, Höhenfeuer und Feuerwerk.",
   text:"Am 1. August feiert die Schweiz ihren Geburtstag. Er erinnert an den Bundesbrief von 1291. Kinder tragen Lampions, auf den Hügeln brennen Höhenfeuer."},
  {id:"knabenschiessen", name:"Knabenschiessen", emo:"🎡", deko:"", farbe:"linear-gradient(135deg,#0A6575,#0E9384)",
   d:j => [bettag(j) - 8, bettag(j) - 6], kurz:"Zürichs grosses Volksfest mit Chilbi und Wettschiessen für Jugendliche.",
   text:"Am Wochenende vor dem Bettag treffen sich Jugendliche von 13 bis 17 Jahren aus dem Kanton Zürich zum Wettschiessen im Albisgüetli. Rundherum gibt es eine grosse Chilbi für alle."},
  {id:"alpabzug", name:"Alpabzug und Erntedank", emo:"🐄", deko:"blumen", farbe:"linear-gradient(135deg,#5B7F1A,#9DBB2E)", ca:"Je nach Alp von Mitte September bis Anfang Oktober.",
   d:j => [letzter(j, 9, 6), letzter(j, 9, 6)], kurz:"Geschmückte Kühe kehren von der Alp zurück. Danke für die Ernte!",
   text:"Im Herbst kommen die Kühe mit Blumenschmuck und grossen Treicheln von der Alp ins Tal. Viele Gemeinden feiern dazu Erntedank."},
  {id:"raebeliechtli", name:"Räbeliechtli", emo:"🏮", deko:"laternen", farbe:"linear-gradient(135deg,#A84A00,#E88A1A)", ca:"Je nach Gemeinde Anfang bis Mitte November. Die Räbechilbi in Richterswil ist am 2. Samstag im November.",
   d:j => [nter(j, 11, 6, 2), nter(j, 11, 6, 2)], kurz:"Kinder ziehen mit geschnitzten, leuchtenden Räben durch die Nacht.",
   text:"Im November schnitzen Kinder Muster in ausgehöhlte Räben und stellen eine Kerze hinein. Am Abend ziehen sie singend durch die dunklen Strassen."},
  {id:"martini", name:"Martinstag", emo:"🪿", deko:"laternen", farbe:"linear-gradient(135deg,#7A2E8E,#C2185B)",
   d:j => [nr(j, 11, 11), nr(j, 11, 11)], kurz:"Der heilige Martin teilte seinen Mantel. Laternen und Martinsgans.",
   text:"Am 11. November erinnern viele an den heiligen Martin, der seinen Mantel mit einem Bettler teilte. In Sursee findet die Gansabhauet statt, vielerorts gibt es Laternenumzüge."},
  {id:"zibelemaerit", name:"Zibelemärit", emo:"🧅", deko:"konfetti", farbe:"linear-gradient(135deg,#8A4B12,#C9822B)",
   d:j => [nter(j, 11, 1, 4), nter(j, 11, 1, 4)], kurz:"Bern: Zwiebelzöpfe, Zibelechueche und Konfetti.",
   text:"Am vierten Montag im November verwandelt sich die Berner Altstadt in einen riesigen Zwiebelmarkt. Es gibt Zibelezüpfe, Zwiebelkuchen und Konfettischlachten."},
  {id:"samichlaus", name:"Samichlaus", emo:"🎅", deko:"schnee", farbe:"linear-gradient(135deg,#B3121F,#E53935)",
   d:j => [nr(j, 12, 6), nr(j, 12, 6)], kurz:"Mit Schmutzli und Esel, Nüssen, Mandarinen und einem Sprüchli.",
   text:"Am 6. Dezember kommt der Samichlaus mit dem Schmutzli. Wer ein Sprüchli aufsagt, bekommt ein Chlaussäckli mit Nüssen, Mandarinen, Lebkuchen und Schokolade."},
  {id:"advent", name:"Advent", emo:"🕯️", deko:"sterne", farbe:"linear-gradient(135deg,#4A1E7A,#7B3FB8)",
   d:j => [advent1(j), nr(j, 12, 23)], kurz:"Vier Kerzen, 24 Türchen und frisch gebackene Guetzli.",
   text:"Die Adventszeit beginnt am vierten Sonntag vor Weihnachten. Jeden Sonntag brennt eine Kerze mehr am Adventskranz, und im Kalender wartet jeden Tag ein Türchen."},
  {id:"weihnachten", name:"Weihnachten", emo:"🎄", deko:"sterne", farbe:"linear-gradient(135deg,#1B6B3A,#2E9E5B)",
   d:j => [nr(j, 12, 24), nr(j, 12, 26)], kurz:"Heiligabend, Christtag und Stephanstag.",
   text:"An Weihnachten feiern Christinnen und Christen die Geburt von Jesus. Am Heiligabend leuchtet der Christbaum, und der 26. Dezember ist als Stephanstag in den meisten Kantonen frei."},
  {id:"silvester", name:"Silvester", emo:"🥂", deko:"funken", farbe:"linear-gradient(135deg,#232B6B,#6A3FC9)",
   d:j => [nr(j, 12, 31), nr(j, 12, 31)], kurz:"Letzter Tag des Jahres. Im Appenzellerland ziehen die Silvesterchläuse.",
   text:"Am 31. Dezember endet das Jahr. Im Appenzellerland ziehen die Silvesterchläuse mit grossen Glocken von Hof zu Hof, um Mitternacht beginnt das neue Jahr."}
];
const KURZ = {"neujahr": "Neujahr", "dreikoenig": "Dreikönig", "fasnacht-lu": "Fasnacht Luzern", "fasnacht-bs": "Fasnacht Basel", "sechselaeuten": "Sechse­läuten", "ostern": "Ostern", "muttertag": "Muttertag", "auffahrt": "Auffahrt", "pfingsten": "Pfingsten", "augustfeier": "1. August", "knabenschiessen": "Knaben­schiessen", "alpabzug": "Alpabzug", "raebeliechtli": "Räbe­liechtli", "martini": "Martini", "zibelemaerit": "Zibele­märit", "samichlaus": "Sami­chlaus", "advent": "Advent", "weihnachten": "Weih­nachten", "silvester": "Silvester"};  // Namen für die Abzeichen (mit weichem Trennstrich)
FESTE.forEach(f => f.kurzname = KURZ[f.id] || f.name);
const FEST = Object.fromEntries(FESTE.map(f => [f.id, f]));

/* Jahreszeiten (gleiche Grenzen wie der Himmel der Seite) */
const SAISON = [
  {id:"fruehling", name:"Frühling", emo:"🌸", m:3, t:20, farbe:"linear-gradient(135deg,#C2407E,#F07AAE)", text:"Die Tage werden länger, Blumen blühen, Vögel kehren zurück."},
  {id:"sommer", name:"Sommer", emo:"☀️", m:6, t:21, farbe:"linear-gradient(135deg,#C46A00,#F2A422)", text:"Die längsten Tage des Jahres, Badi, Alpsommer und 1. August."},
  {id:"herbst", name:"Herbst", emo:"🍂", m:9, t:23, farbe:"linear-gradient(135deg,#9A3F12,#D9772B)", text:"Bunte Blätter, Alpabzug, Räbeliechtli und frischer Most."},
  {id:"winter", name:"Winter", emo:"❄️", m:12, t:21, farbe:"linear-gradient(135deg,#2B5C9E,#5A8FD8)", text:"Kurze Tage, Schnee in den Bergen, Advent und Weihnachten."}
];
function jahreszeit(n){
  n = n == null ? heuteNr() : n; const {j} = aus(n);
  const starts = [];
  [j - 1, j, j + 1].forEach(y => SAISON.forEach(s => starts.push({s, von:nr(y, s.m, s.t)})));
  starts.sort((a, b) => a.von - b.von);
  let i = starts.findIndex(x => x.von > n) - 1; if(i < 0) i = 0;
  return {...starts[i].s, seit:starts[i].von, naechste:starts[i + 1].s, naechsteAb:starts[i + 1].von, inTagen:starts[i + 1].von - n};
}

/* Vorkommen eines Festes in einem Jahr */
function termin(f, j){ const [von, bis] = f.d(j); return {f, j, von, bis}; }
function alleUm(n){ const {j} = aus(n); const l = []; [j - 1, j, j + 1].forEach(y => FESTE.forEach(f => l.push(termin(f, y)))); return l; }
function info(t, n){
  n = n == null ? heuteNr() : n;
  const laeuft = n >= t.von && n <= t.bis;
  return {id:t.f.id, name:t.f.name, emo:t.f.emo, von:iso(t.von), bis:iso(t.bis), jahr:t.j, inTagen:Math.max(0, t.von - n), laeuft, vorbei:n > t.bis, ca:!!t.f.ca};
}
/* Aktiv: 7 Tage davor bis 1 Tag danach. Bei mehreren zählt zuerst ein Fest, das heute ist (oder eine lange Festzeit wie der Advent
   an ihren ersten zwei Tagen), dann das nächste kommende Fest, dann eine laufende lange Festzeit, zuletzt ein Fest von gestern. */
function aktivTermin(n){
  n = n == null ? heuteNr() : n;
  const l = alleUm(n).filter(t => n >= t.von - 7 && n <= t.bis + 1);
  if(!l.length) return null;
  const lang = t => t.bis - t.von > 6;
  const rang = t => n >= t.von && n <= t.bis ? (!lang(t) || n - t.von < 2 ? 0 : 2) : n < t.von ? 1 : 3;
  l.sort((a, b) => rang(a) - rang(b) || (rang(a) === 1 ? a.von - b.von : (a.bis - a.von) - (b.bis - b.von)));
  return l[0];
}
function naechsterTermin(n, id){
  n = n == null ? heuteNr() : n;
  return alleUm(n).filter(t => t.bis >= n && (!id || t.f.id === id)).sort((a, b) => a.von - b.von || (a.bis - a.von) - (b.bis - b.von))[0] || null;
}

/* ---------- Speicher ---------- */
const K_ABZ = "ep-x-feste-abzeichen";      // { "<fest>-<jahr>": {d:"YYYY-MM-DD", r, t} }
const K_BEST = "ep-x-feste-best";          // { "<fest>": beste Quote 0..100 }
const abzListe = () => A.LS.get(K_ABZ, {}) || {};
const hatAbz = (id, j) => !!abzListe()[id + "-" + j];

/* ---------- Fragen ---------- */
let FRAGEN_P = null;
function fragen(){
  if(!FRAGEN_P) FRAGEN_P = fetch("welten/feste/fragen.json", {cache:"no-cache"}).then(r => r.ok ? r.json() : {}).catch(() => ({}));
  return FRAGEN_P;
}
const quizTitel = f => "Fest-Quiz: " + f.name;
let laufend = null, neuAbz = null;
function quizStarten(id){
  const f = FEST[id]; if(!f) return;
  fragen().then(F => {
    const l = (F[id] || []).filter(q => q && Array.isArray(q.a) && q.a.length === 4).map(q => ({q:q.q, a:q.a.slice(), e:q.e, l:q.l, s:f.name}));
    if(!l.length){ A.toast("Die Fragen konnten nicht geladen werden. Bitte versuch es nochmals."); FRAGEN_P = null; return; }
    laufend = {id, titel:quizTitel(f), jahr:aus(heuteNr()).j};
    A.ton("klick");
    A.quiz(l, laufend.titel);
  });
}
document.addEventListener("ep:quizende", e => {
  const d = e.detail || {}; if(!laufend || d.titel !== laufend.titel) return;
  const L = laufend; laufend = null;
  const quote = d.total ? Math.round(d.richtig / d.total * 100) : 0;
  const best = A.LS.get(K_BEST, {}) || {}; if(!(best[L.id] >= quote)){ best[L.id] = quote; A.LS.set(K_BEST, best); }
  const f = FEST[L.id];
  let text, neu = false, xp = 0;
  if(quote >= 60 && !hatAbz(L.id, L.jahr)){
    const a = abzListe(); a[L.id + "-" + L.jahr] = {d:iso(heuteNr()), r:d.richtig, t:d.total}; A.LS.set(K_ABZ, a);
    neuAbz = L.id; neu = true; xp = A.xp(30);
    text = `${f.emo} Fest-Abzeichen «${f.name}» gesammelt!${xp ? ` +${xp} XP` : ""}`;
  } else if(quote >= 60) text = `${f.emo} Super! Das Abzeichen «${f.name}» hast du dieses Jahr schon.`;
  else text = `${d.richtig} von ${d.total} richtig. Ab 60 % gibt es das Fest-Abzeichen. Probier es gern nochmals!`;
  // etwas später melden, damit andere Welten (Garderobe, Album ...) ihre Meldung nach dem Quiz zuerst zeigen können
  setTimeout(() => {
    A.toast(text, 3600);
    if(neu){ try{ window.EP_SOUND?.play("freischalten"); }catch(err){} A.konfetti(); }
  }, 2800);
});

/* ---------- Dekoration (oberer Rand, hinter dem Inhalt, ohne Klicks) ---------- */
function dekoTyp(t){
  if(!t) return "";
  let typ = t.f.deko || "";
  try{ if(typeof window.aktuellesEvent === "function" && window.aktuellesEvent()) return ""; }catch(e){}  // die Seite feiert schon selbst
  const saison = document.documentElement.dataset.season;
  if(typ === "schnee" && saison === "winter") typ = "sterne";                                          // Schnee fällt im Winter schon
  return typ;
}
function dekoSetzen(){
  let el = document.getElementById("xf-deko");
  const typ = A.ruhig() ? "" : dekoTyp(aktivTermin());
  if(!typ){ if(el) el.remove(); return; }
  if(el && el.dataset.typ === typ) return;
  if(!el){ el = document.createElement("div"); el.id = "xf-deko"; el.setAttribute("aria-hidden", "true"); document.body.appendChild(el); }
  el.dataset.typ = typ; el.className = "xf-deko xf-d-" + typ;
  const r = (a, b) => (a + Math.random() * (b - a)).toFixed(1);
  const farben = {konfetti:["#FF4D8D", "#FFD23F", "#3EC1F3", "#7BE07B", "#B98CFF", "#FF8A3D"], funken:["#FFD34D", "#FF6B6B", "#FFFFFF", "#7FD1FF"], funken2:["#FFB347", "#FF7A2F", "#FFD34D"]};
  let html = "";
  if(typ === "laternen" || typ === "eier" || typ === "blumen"){
    const n = innerWidth < 600 ? 9 : 14;
    html = `<svg class="xf-schnur" viewBox="0 0 100 36" preserveAspectRatio="none"><path d="M0 4 Q 50 34 100 4" fill="none" stroke="rgba(90,70,40,.45)" stroke-width="1" vector-effect="non-scaling-stroke"/></svg>`;
    for(let i = 0; i < n; i++){
      const x = (100 / n) * (i + .5), u = x / 100, y = 4 + 60 * u * (1 - u);  // Höhe der Schnur an dieser Stelle
      const inh = typ === "blumen" ? ["🌼", "🌸", "🔔"][i % 3] : "";
      html += `<i style="left:${x.toFixed(1)}%;top:${(y + 8).toFixed(0)}px;--d:${r(0, 2)}s;--c:${["#FF7A1A", "#FFB21A", "#FF4E4E", "#7FD1FF", "#B98CFF", "#7BE07B"][i % 6]}">${inh}</i>`;
    }
  } else {
    const n = typ === "funken" || typ === "funken2" ? 24 : typ === "konfetti" ? 22 : typ === "herzen" ? 12 : 18;
    for(let i = 0; i < n; i++){
      if(typ === "funken" || typ === "funken2"){
        const burst = Math.floor(i / 8), k = i % 8, w = k / 8 * Math.PI * 2, cx = [14, 86, 50][burst], cy = [40, 56, 22][burst];
        const f = farben[typ][i % farben[typ].length];
        html += `<i style="left:${cx}%;top:${cy}px;--dx:${(Math.cos(w) * 38).toFixed(0)}px;--dy:${(Math.sin(w) * 38).toFixed(0)}px;--d:${(burst * 1.3 + k * .02).toFixed(2)}s;--c:${f}"></i>`;
      } else if(typ === "konfetti"){
        html += `<i style="left:${r(1, 99)}%;--d:${r(0, 9)}s;--t:${r(7, 12)}s;--c:${farben.konfetti[i % 6]};--rot:${r(-200, 200)}deg"></i>`;
      } else if(typ === "schnee"){
        html += `<i style="left:${r(1, 99)}%;--d:${r(0, 10)}s;--t:${r(8, 14)}s;--s:${r(3, 7)}px"></i>`;
      } else if(typ === "sterne"){
        html += `<i style="left:${r(2, 98)}%;top:${r(4, 120)}px;--d:${r(0, 4)}s;--s:${r(8, 15)}px">✦</i>`;
      } else if(typ === "herzen"){
        html += `<i style="left:${r(2, 98)}%;--d:${r(0, 10)}s;--t:${r(9, 14)}s">♥</i>`;
      }
    }
  }
  el.innerHTML = html;
}

/* ---------- Seite x-feste ---------- */
let wahl = null; // ausgewähltes Fest im grossen Kasten
function zaehlText(t, n){
  const vor = t.von - n;
  if(n >= t.von && n <= t.bis) return t.von === t.bis ? "Heute" : "Jetzt";
  if(n === t.bis + 1) return "Gestern";
  if(vor === 1) return "Morgen";
  return vor > 0 ? `In ${vor} Tagen` : `Vor ${n - t.bis} Tagen`;
}
function datumText(t){
  const v = t.von === t.bis ? langDatum(t.von) : `${kurzDatum(t.von)} bis ${langDatum(t.bis)}`;
  return t.f.ca ? "ca. " + v : v;
}
function heldHTML(t, n){
  const f = t.f, laeuft = n >= t.von && n <= t.bis, vor = t.von - n;
  const j = aus(n).j, hat = hatAbz(f.id, j);
  const gross = laeuft ? "🎉" : String(Math.max(0, vor));
  const klein = laeuft ? (t.von === t.bis ? "Heute!" : "Jetzt!") : vor === 1 ? "Tag" : "Tage";
  const pille = laeuft ? "Heute" : vor === 1 ? "Morgen" : `In ${vor} Tagen`;
  return `<section class="xf-held" style="background:${f.farbe}" aria-labelledby="xfHeldT">
    <div class="xf-held-tx">
      <span class="xf-pille">${pille} · ${A.h(datumText(t))}</span>
      <h2 id="xfHeldT"><span class="xf-held-emo" aria-hidden="true">${f.emo}</span> ${A.h(f.name)}</h2>
      <p>${A.h(f.text)}</p>
      ${f.ca ? `<p class="xf-ca">${A.h(f.ca)}</p>` : ""}
      <div class="xf-knoepfe"><button type="button" class="xf-btn" data-quiz="${f.id}">🎉 Fest-Quiz starten</button>
        <span class="xf-status">${hat ? `🏅 Abzeichen ${j} gesammelt` : "🏅 Abzeichen ab 60 % richtig"}</span></div>
    </div>
    <div class="xf-cd" role="img" aria-label="${laeuft ? "Das Fest ist jetzt" : `Noch ${vor} ${vor === 1 ? "Tag" : "Tage"}`}"><b>${gross}</b><small>${klein}</small></div>
  </section>`;
}
function saisonHTML(n){
  const s = jahreszeit(n), na = aus(s.naechsteAb);
  return `<section class="xf-saison" style="background:${s.farbe}" aria-label="Jahreszeit">
    <span class="xf-saison-emo" aria-hidden="true">${s.emo}</span>
    <div><b>Jetzt ist ${s.name}</b><span>${A.h(s.text)}</span><small>${s.naechste.emo} ${s.naechste.name} beginnt in ${s.inTagen} ${s.inTagen === 1 ? "Tag" : "Tagen"} (${na.t}. ${MOL[na.m - 1]})</small></div>
    <ul class="xf-saisons">${SAISON.map(x => `<li class="${x.id === s.id ? "an" : ""}"><span aria-hidden="true">${x.emo}</span>${x.name}<small>ab ${x.t}. ${MO[x.m - 1]}</small></li>`).join("")}</ul>
  </section>`;
}
function kalenderHTML(n){
  const j = aus(n).j;
  const l = FESTE.map(f => termin(f, j)).sort((a, b) => a.von - b.von);
  return `<div class="xf-reihe" role="list" aria-label="Festkalender ${j}">${l.map(t => {
    const vorbei = n > t.bis, laeuft = n >= t.von && n <= t.bis, hat = hatAbz(t.f.id, j);
    return `<div role="listitem" class="xf-kw"><button type="button" class="xf-karte${vorbei ? " vorbei" : ""}${laeuft ? " heute" : ""}${wahl === t.f.id ? " gewaehlt" : ""}" data-fest="${t.f.id}" style="background:${t.f.farbe}" aria-label="${A.h(t.f.name)}, ${A.h(datumText(t))}${hat ? ", Abzeichen gesammelt" : ""}">
      <span class="xf-k-emo" aria-hidden="true">${t.f.emo}</span>${hat ? `<span class="xf-k-abz" aria-hidden="true">🏅</span>` : ""}
      <small class="xf-k-dat">${t.f.ca ? "ca. " : ""}${A.h(kurzDatum(t.von))}${t.bis > t.von ? " bis " + A.h(kurzDatum(t.bis)) : ""}</small>
      <b>${A.h(t.f.name)}</b><span class="xf-k-tx">${A.h(t.f.kurz)}</span>
      <em>${vorbei ? "Vorbei" : A.h(zaehlText(t, n))}</em></button></div>`; }).join("")}</div>`;
}
function abzeichenHTML(n){
  const j = aus(n).j, a = abzListe();
  const dieses = FESTE.filter(f => a[f.id + "-" + j]).length, total = Object.keys(a).length;
  return `<div class="xf-abz-kopf"><h2 class="xf-titel">🏅 Deine Fest-Abzeichen</h2><span class="xf-pille dunkel">${dieses} von ${FESTE.length} im Jahr ${j}${total > dieses ? ` · ${total} insgesamt` : ""}</span></div>
    <div class="xf-abz" role="list">${FESTE.map(f => { const hat = !!a[f.id + "-" + j]; const jahre = Object.keys(a).filter(k => k.startsWith(f.id + "-")).length;
      return `<button type="button" role="listitem" class="xf-ab${hat ? " hat" : ""}${hat && neuAbz === f.id ? " neu" : ""}" data-fest="${f.id}" style="${hat ? `background:${f.farbe}` : ""}" aria-label="${A.h(f.name)}: ${hat ? "Abzeichen gesammelt" : "noch offen"}"><span aria-hidden="true">${f.emo}</span><small>${A.h(f.kurzname)}</small>${jahre > 1 ? `<i>×${jahre}</i>` : ""}</button>`; }).join("")}</div>
    <p class="xf-tipp">Spiel ein Fest-Quiz und beantworte mindestens 60 % richtig. Jedes Abzeichen gibt es einmal pro Jahr, dazu 30 XP.</p>`;
}
function seite(box){
  const n = heuteNr(), j = aus(n).j;
  const akt = aktivTermin(n) || naechsterTermin(n);
  if(!wahl || !FEST[wahl]) wahl = akt ? akt.f.id : FESTE[0].id;
  const t = (akt && akt.f.id === wahl) ? akt : (naechsterTermin(n, wahl) || akt);
  box.innerHTML = `<div class="x-kopf xf-kopf"><span class="x-kopf-emo" aria-hidden="true">🎉</span><div><h1>Feste und Jahreszeiten</h1><p>Was feiert die Schweiz wann?</p></div><img src="img/kids/duo-jubel.webp" alt=""></div>
    <div class="xf-oben"><div class="xf-heldbox">${heldHTML(t, n)}</div>${saisonHTML(n)}</div>
    <div class="xf-kal-kopf"><h2 class="xf-titel">📅 Festkalender ${j}</h2><span class="xf-pille dunkel">Tippe ein Fest an</span></div>
    ${kalenderHTML(n)}
    ${abzeichenHTML(n)}`;
  binden(box);
  // Kalender zum gewählten oder nächsten Fest scrollen (nur innerhalb der Reihe)
  requestAnimationFrame(() => { try{
    const reihe = box.querySelector(".xf-reihe"), k = reihe && (reihe.querySelector(".gewaehlt") || reihe.querySelector(".xf-karte:not(.vorbei)"));
    const ziel = k && (k.parentNode.previousElementSibling || k.parentNode);
    if(reihe && ziel) reihe.scrollLeft = Math.max(0, reihe.scrollLeft + ziel.getBoundingClientRect().left - reihe.getBoundingClientRect().left - 6);
  }catch(e){} });
}
function binden(box){
  box.querySelectorAll("[data-quiz]").forEach(b => b.onclick = () => quizStarten(b.dataset.quiz));
  box.querySelectorAll("[data-fest]").forEach(b => b.onclick = () => {
    wahl = b.dataset.fest; A.ton("klick");
    const n = heuteNr(), akt = aktivTermin(n), t = (akt && akt.f.id === wahl) ? akt : naechsterTermin(n, wahl);
    const hb = box.querySelector(".xf-heldbox"); if(!hb || !t) return;
    hb.innerHTML = heldHTML(t, n); hb.querySelectorAll("[data-quiz]").forEach(q => q.onclick = () => quizStarten(q.dataset.quiz));
    box.querySelectorAll(".xf-karte").forEach(k => k.classList.toggle("gewaehlt", k.dataset.fest === wahl));
    try{ const r = hb.getBoundingClientRect(); if(r.top < 0 || r.top > innerHeight * .5) hb.scrollIntoView({behavior:A.ruhig() ? "auto" : "smooth", block:"start"}); }catch(e){}
    try{ hb.querySelector(".xf-btn").focus({preventScroll:true}); }catch(e){}
  });
}

/* ---------- Stil ---------- */
const css = document.createElement("style"); css.id = "ep-x-feste";
css.textContent = `
.xf-kopf{background:linear-gradient(135deg,#C2185B,#F08A24 70%,#FFC23A)!important}
.xf-oben{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:14px;margin-bottom:16px}
.xf-heldbox{min-width:0;display:flex}
.xf-held{position:relative;flex:1;display:flex;gap:14px;align-items:stretch;border-radius:28px;padding:22px 22px 20px;color:#fff;box-shadow:0 14px 30px rgba(27,34,64,.25);box-sizing:border-box;overflow:hidden;scroll-margin-top:90px}
.xf-held::before{content:"";position:absolute;inset:0;background:radial-gradient(60% 70% at 12% 0%,rgba(255,255,255,.25),transparent 60%);pointer-events:none}
.xf-held-tx{position:relative;flex:1;min-width:0;display:flex;flex-direction:column;gap:8px}
.xf-held h2{margin:0;font:800 clamp(1.5rem,3.6vw,2.3rem)/1.1 "Bricolage Grotesque","Fredoka",system-ui,sans-serif;color:#fff}
.xf-held p{margin:0;color:#fff;opacity:.96;line-height:1.45;font-size:.98rem}
.xf-held .xf-ca{font-size:.82rem;opacity:.9}
.xf-pille{align-self:flex-start;display:inline-block;background:rgba(15,20,48,.32);color:#fff;font-weight:700;font-size:.8rem;padding:5px 11px;border-radius:999px}
.xf-pille.dunkel{background:rgba(15,20,48,.55);align-self:center}
.xf-knoepfe{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;margin-top:auto;padding-top:4px}
.xf-btn{border:0;border-radius:999px;background:#fff;color:#1B2240;font:800 1rem "Lexend",system-ui,sans-serif;padding:12px 20px;cursor:pointer;box-shadow:0 6px 14px rgba(0,0,0,.18);min-height:44px}
.xf-btn:hover{transform:translateY(-1px)}
.xf-btn:focus-visible,.xf-karte:focus-visible,.xf-ab:focus-visible{outline:3px solid #FFE34D;outline-offset:3px}
.xf-status{font-size:.85rem;font-weight:700;color:#fff;opacity:.95}
.xf-cd{position:relative;flex:0 0 auto;align-self:center;width:104px;height:104px;border-radius:26px;background:rgba(255,255,255,.18);border:2px solid rgba(255,255,255,.4);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;box-sizing:border-box}
.xf-cd b{font:800 2.6rem/1 "Bricolage Grotesque","Fredoka",system-ui,sans-serif;color:#fff}
.xf-cd small{font-weight:700;font-size:.85rem;color:#fff}
.xf-saison{position:relative;border-radius:28px;padding:18px;color:#fff;box-shadow:0 14px 30px rgba(27,34,64,.22);display:flex;flex-wrap:wrap;gap:10px 12px;align-content:flex-start;box-sizing:border-box;min-width:0}
.xf-saison-emo{font-size:2.2rem;line-height:1}
.xf-saison>div{flex:1;min-width:150px;display:flex;flex-direction:column;gap:3px}
.xf-saison b{font-size:1.15rem;color:#fff}
.xf-saison span,.xf-saison small{color:#fff;font-size:.88rem;line-height:1.35}
.xf-saison small{opacity:.95;font-weight:700}
.xf-saisons{list-style:none;margin:0;padding:0;width:100%;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
.xf-saisons li{background:rgba(15,20,48,.22);border-radius:14px;padding:6px 4px;text-align:center;font-size:.78rem;font-weight:700;color:#fff;display:flex;flex-direction:column;align-items:center;gap:1px}
.xf-saisons li span{font-size:1.1rem}
.xf-saisons li small{font-size:.68rem;font-weight:600;opacity:.9}
.xf-saisons li.an{background:rgba(255,255,255,.3);box-shadow:inset 0 0 0 2px rgba(255,255,255,.7)}
.xf-kal-kopf,.xf-abz-kopf{display:flex;flex-wrap:wrap;align-items:center;gap:8px 10px;margin:4px 0 10px}
.xf-titel{margin:0;display:inline-block;background:rgba(15,20,48,.55);color:#fff;font:800 1.1rem "Lexend",system-ui,sans-serif;padding:7px 14px;border-radius:999px}
.xf-reihe{display:flex;gap:12px;overflow-x:auto;overscroll-behavior-x:contain;scroll-snap-type:x proximity;padding:6px 6px 14px;margin:0 0 8px;scrollbar-width:thin;-webkit-overflow-scrolling:touch}
.xf-kw{flex:0 0 auto;scroll-snap-align:start;display:flex}
.xf-karte{position:relative;width:196px;min-height:172px;border:0;border-radius:22px;padding:14px 14px 12px;color:#fff;text-align:left;cursor:pointer;display:flex;flex-direction:column;gap:4px;box-shadow:0 10px 22px rgba(27,34,64,.22);transition:transform .15s,opacity .2s;box-sizing:border-box;font:inherit}
.xf-karte:hover{transform:translateY(-2px)}
.xf-karte.vorbei{opacity:.62}
.xf-karte.gewaehlt{box-shadow:0 0 0 3px #fff,0 0 0 6px rgba(15,20,48,.35),0 10px 22px rgba(27,34,64,.22);opacity:1}
.xf-karte.heute::after{content:"Heute";position:absolute;top:10px;right:10px;background:#FFE34D;color:#1B2240;font-weight:800;font-size:.7rem;padding:2px 8px;border-radius:999px}
.xf-k-emo{font-size:1.9rem;line-height:1}
.xf-k-abz{position:absolute;top:10px;right:10px;font-size:1.2rem}
.xf-karte.heute .xf-k-abz{top:32px}
.xf-k-dat{font-size:.78rem;font-weight:700;color:#fff;opacity:.95}
.xf-karte b{font-size:1.02rem;color:#fff;line-height:1.2}
.xf-k-tx{font-size:.8rem;line-height:1.3;color:#fff;opacity:.95}
.xf-karte em{margin-top:auto;font-style:normal;font-weight:800;font-size:.78rem;background:rgba(15,20,48,.28);color:#fff;align-self:flex-start;padding:3px 9px;border-radius:999px}
.xf-abz{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:10px}
.xf-ab{position:relative;border:0;border-radius:20px;min-height:84px;padding:10px 6px 8px;background:rgba(15,20,48,.5);color:#fff;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;box-shadow:0 8px 18px rgba(27,34,64,.16);font:inherit}
.xf-ab span{font-size:1.7rem;line-height:1;filter:grayscale(.85);opacity:.55}
.xf-ab.hat span{filter:none;opacity:1}
.xf-ab small{font-size:.72rem;font-weight:700;color:#fff;text-align:center;line-height:1.15;max-width:100%;overflow-wrap:anywhere;hyphens:manual}
.xf-ab.neu{animation:xfNeu 1.2s ease-in-out 3}
@keyframes xfNeu{50%{transform:scale(1.08);box-shadow:0 0 0 4px #FFE34D,0 8px 18px rgba(27,34,64,.16)}}
@media (prefers-reduced-motion:reduce){.xf-ab.neu{animation:none;box-shadow:0 0 0 3px #FFE34D}}
.xf-ab i{position:absolute;top:6px;right:8px;font-style:normal;font-size:.68rem;font-weight:800;background:#FFE34D;color:#1B2240;border-radius:999px;padding:1px 6px}
.xf-tipp{margin:12px 0 0;display:inline-block;background:rgba(15,20,48,.55);color:#fff;font-size:.86rem;padding:8px 14px;border-radius:16px;line-height:1.4}
@media (max-width:860px){.xf-oben{grid-template-columns:1fr}}
@media (max-width:560px){
  .xf-held{padding:16px;border-radius:22px;gap:10px}
  .xf-held p{font-size:.9rem}
  .xf-cd{position:absolute;top:12px;right:12px;width:62px;height:62px;border-radius:18px}
  .xf-cd b{font-size:1.5rem}.xf-cd small{font-size:.66rem}
  .xf-held h2{padding-right:68px}
  .xf-pille{max-width:calc(100% - 72px)}
  .xf-saison{padding:14px;border-radius:22px}
  .xf-karte{width:164px;min-height:160px;padding:12px}
  .xf-abz{grid-template-columns:repeat(auto-fill,minmax(76px,1fr));gap:8px}
  .xf-ab{min-height:74px}
}
/* App-Startseite: Karussell-Folie */
.ap-held.hs-fest{background:linear-gradient(140deg,#C2185B,#F08A24)!important}
/* Dekoration: nur oberer Rand, hinter allem Inhalt, keine Klicks */
#xf-deko{position:fixed;left:0;right:0;top:0;height:min(32vh,240px);z-index:-1;opacity:.8;pointer-events:none;overflow:hidden;contain:strict;-webkit-mask-image:linear-gradient(#000 55%,transparent);mask-image:linear-gradient(#000 55%,transparent)}
#xf-deko i{position:absolute;display:block;font-style:normal;pointer-events:none}
.xf-d-konfetti i{top:-14px;width:7px;height:11px;border-radius:2px;background:var(--c);opacity:.85;animation:xfFall var(--t) linear var(--d) infinite both}
.xf-d-schnee i{top:-10px;width:var(--s);height:var(--s);border-radius:50%;background:#fff;box-shadow:0 0 3px rgba(80,110,200,.5);opacity:.9;animation:xfFall var(--t) linear var(--d) infinite both}
.xf-d-herzen i{top:-16px;color:#FF5C9A;font-size:14px;opacity:.75;animation:xfFall var(--t) linear var(--d) infinite both}
.xf-d-sterne i{color:#FFE27A;font-size:var(--s);text-shadow:0 0 6px rgba(255,214,90,.8);animation:xfFunkel 3.2s ease-in-out var(--d) infinite both}
.xf-d-funken i,.xf-d-funken2 i{width:5px;height:5px;border-radius:50%;background:var(--c);box-shadow:0 0 6px var(--c);opacity:0;animation:xfKnall 4s ease-out var(--d) infinite}
.xf-schnur{position:absolute;left:0;top:0;width:100%;height:36px}
.xf-d-laternen i{width:16px;height:22px;margin-left:-8px;border-radius:8px 8px 10px 10px;background:radial-gradient(circle at 50% 55%,#FFF4C2 0 20%,var(--c) 60%);box-shadow:0 0 12px 3px rgba(255,170,60,.55);transform-origin:50% -8px;animation:xfSchwing 3.4s ease-in-out var(--d) infinite alternate}
.xf-d-laternen i::before,.xf-d-eier i::before{content:"";position:absolute;left:50%;top:-8px;width:1px;height:8px;background:rgba(90,70,40,.5)}
.xf-d-eier i{width:13px;height:17px;margin-left:-6px;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:var(--c);box-shadow:inset -2px -3px 0 rgba(0,0,0,.12);transform-origin:50% -8px;animation:xfSchwing 3.4s ease-in-out var(--d) infinite alternate}
.xf-d-blumen i{font-size:16px;line-height:1;margin-left:-8px;transform-origin:50% -6px;animation:xfSchwing 3.4s ease-in-out var(--d) infinite alternate}
@keyframes xfFall{0%{transform:translate(0,0) rotate(0);opacity:0}10%{opacity:.9}100%{transform:translate(24px,250px) rotate(var(--rot,180deg));opacity:0}}
@keyframes xfFunkel{0%,100%{opacity:.15;transform:scale(.7)}50%{opacity:.9;transform:scale(1)}}
@keyframes xfKnall{0%{opacity:0;transform:translate(0,0) scale(.4)}6%{opacity:1}45%{opacity:.9;transform:translate(var(--dx),var(--dy)) scale(1)}70%,100%{opacity:0;transform:translate(var(--dx),calc(var(--dy) + 22px)) scale(.6)}}
@keyframes xfSchwing{from{transform:rotate(-6deg)}to{transform:rotate(6deg)}}
@media (prefers-reduced-motion:reduce){#xf-deko{display:none}}
@media print{#xf-deko{display:none}}
`;
document.head.appendChild(css);

/* ---------- Anmelden ---------- */
X.register({
  id:"feste", titel:"Feste und Jahreszeiten", text:"Festkalender, Countdown und Fest-Quiz", emo:"🎉",
  farbe:"linear-gradient(135deg,#C2185B,#F08A24)", reihe:60,
  hinweis(){ const t = aktivTermin(); if(!t) return ""; const n = heuteNr(); return n >= t.von && n <= t.bis ? "Heute" : n < t.von ? "Bald" : ""; },
  folie(){
    const t = aktivTermin(); if(!t) return null;
    const n = heuteNr(), f = t.f;
    return {cls:"hs-fest", ic:f.emo, lbl:zaehlText(t, n), titel:f.name, text:n > t.bis ? "Schön war's! Spiel jetzt das Fest-Quiz." : f.kurz, btn:"🎉 Fest-Quiz", a:"x-feste"};
  },
  render(box){ seite(box); fragen(); }
});

window.EP_FESTE = {
  aktiv(){ const t = aktivTermin(); return t ? info(t) : null; },
  naechstes(){ const t = naechsterTermin(); return t ? info(t) : null; },
  liste(j){ j = j || aus(heuteNr()).j; return FESTE.map(f => info(termin(f, j))).sort((a, b) => a.von < b.von ? -1 : 1); },
  jahreszeit(){ const s = jahreszeit(); return {id:s.id, name:s.name, emo:s.emo, naechste:s.naechste.id, inTagen:s.inTagen}; },
  abzeichen(){ const a = abzListe(); return {hat:Object.keys(a).length, diesesJahr:FESTE.filter(f => a[f.id + "-" + aus(heuteNr()).j]).length, alle:FESTE.length, liste:a}; },
  quiz:quizStarten,
  heute(){ return iso(heuteNr()); },
  deko(){ dekoSetzen(); const el = document.getElementById("xf-deko"); return el ? el.dataset.typ : ""; }
};

/* Dekoration beim Laden und danach regelmässig prüfen (Datum, Jahreszeit, Bewegungseinstellung) */
const start = () => { try{ dekoSetzen(); }catch(e){} };
if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
addEventListener("load", () => setTimeout(start, 300));
setInterval(start, 15 * 60 * 1000);
try{ matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", start); }catch(e){}
})();
