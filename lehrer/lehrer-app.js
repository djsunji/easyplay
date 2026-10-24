/* easyplay Lehrerbereich (lehrer/lehrer-app.js)
   Eigenständige Lehrer-Plattform im Stil der Verwaltung (admin/index.html).
   Speichert kompatibel zu lehrer.js der Hauptseite:
   - ohne Supabase: localStorage "ep-lehrer-daten" (Klassen, Tests, Abgaben), Konten in "ep-konten" (PBKDF2), Rolle in "ep-lehrer-rolle"
   - mit Supabase (config.js): Tabellen lehrer_klassen, lehrer_schueler, lehrer_tests, lehrer_abgaben und die Liga-RPCs aus supabase/klassenliga.sql
   - Testzugang: immer lokal, eigene Schlüssel "ep-lt-*". Damit Kinder Tests aus dem Testzugang in der Hauptseite lösen können,
     werden Klassen, Tests und Abgaben des Testzugangs (Lehrer-ID "t:test@easyplay.ch") nach "ep-lehrer-daten" gespiegelt,
     solange die Hauptseite ohne Supabase lokal speichert. Echte Konten sehen diese Einträge nie (andere Lehrer-ID).
   Kein Framework. */
(function(){
"use strict";

/* ================= 0. Grundlagen ================= */
const VERSION = "2.0.0";
const CFG = window.EP_CONFIG || {};
const SUPA = !!(CFG.supabaseUrl && CFG.supabaseKey);
const LS_DATEN = "ep-lehrer-daten", LS_ROLLE = "ep-lehrer-rolle", LS_MELD = "ep-fehlermeldungen", LS_LIGA_KIND = "ep-lehrer-liga";
const LT_DATEN = "ep-lt-daten", LT_MELD = "ep-lt-meldungen", LT_SITZUNG = "ep-lt-sitzung";
const TEST_MAIL = "test@easyplay.ch", TEST_PW = "Lehrer-Test-2026", TEST_LID = "t:test@easyplay.ch";
const MAX_FRAGEN = 50, LIGA_MIN = 5;
const JSPDF_URL = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
const JSPDF_SRI = "sha384-JcnsjUPPylna1s1fvi1u12X5qjY5OL56iySh75FdtrwhO/SWXgMjoVqcKyIIWOLk";
const SUPA_JS = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js";
const SUPA_SRI = "sha384-GFr3yTh5lJznCbZfpTtXnwboFsxqtTQoeTZCRHhE0579KrRmlCzen5AA8ohaB5ug";
// Kontakt für Fehlermeldungen; erst beim Klick zusammengesetzt, damit Adress-Sammler sie nicht im Klartext finden
const ADMIN_MAIL_TEILE = ["ch", "bluewin", "dejan.ehrbar"];
const adminMail = () => ADMIN_MAIL_TEILE[2] + "@" + ADMIN_MAIL_TEILE[1] + "." + ADMIN_MAIL_TEILE[0];

/* ================= 1. Schuljahre und Lehrplan 21 (wie lehrer.js) ================= */
// Schuljahre nach HarmoS (1. bis 11. Schuljahr), angezeigt mit der üblichen Bezeichnung
const SCHULJAHRE = [
  {id:"h1",  name:"1. Kindergarten", harmos:1,  zyklus:1},
  {id:"h2",  name:"2. Kindergarten", harmos:2,  zyklus:1},
  {id:"h3",  name:"1. Klasse", harmos:3,  zyklus:1},
  {id:"h4",  name:"2. Klasse", harmos:4,  zyklus:1},
  {id:"h5",  name:"3. Klasse", harmos:5,  zyklus:2},
  {id:"h6",  name:"4. Klasse", harmos:6,  zyklus:2},
  {id:"h7",  name:"5. Klasse", harmos:7,  zyklus:2},
  {id:"h8",  name:"6. Klasse", harmos:8,  zyklus:2},
  {id:"h9",  name:"7. Klasse (1. Oberstufe)", harmos:9,  zyklus:3},
  {id:"h10", name:"8. Klasse (2. Oberstufe)", harmos:10, zyklus:3},
  {id:"h11", name:"9. Klasse (3. Oberstufe)", harmos:11, zyklus:3},
  {id:"gym", name:"Gymnasium", harmos:0, zyklus:3},
  {id:"bs",  name:"Berufsschule", harmos:0, zyklus:3}
];
const sjObj = id => SCHULJAHRE.find(x=>x.id===id) || null;
const sjName = id => sjObj(id)?.name || String(id||"");

// Lehrplan 21 (Vorlage V-FE): Fachbereiche mit Kompetenzbereichen.
// Gedankenstriche aus den offiziellen Titeln sind durch Doppelpunkte ersetzt.
const LP21 = [
  {f:"D", n:"Deutsch", z:[1,2,3], kb:[["D.1","Hören"],["D.2","Lesen"],["D.3","Sprechen"],["D.4","Schreiben"],["D.5","Sprache(n) im Fokus"],["D.6","Literatur im Fokus"]]},
  {f:"FS1E", n:"Englisch", z:[2,3], kb:[["FS1E.1","Hören"],["FS1E.2","Lesen"],["FS1E.3","Sprechen"],["FS1E.4","Schreiben"],["FS1E.5","Sprache(n) im Fokus"],["FS1E.6","Kulturen im Fokus"]]},
  {f:"FS2F", n:"Französisch", z:[2,3], kb:[["FS2F.1","Hören"],["FS2F.2","Lesen"],["FS2F.3","Sprechen"],["FS2F.4","Schreiben"],["FS2F.5","Sprache(n) im Fokus"],["FS2F.6","Kulturen im Fokus"]]},
  {f:"MA", n:"Mathematik", z:[1,2,3], kb:[
    ["MA.1.A","Zahl und Variable: Operieren und Benennen"],["MA.1.B","Zahl und Variable: Erforschen und Argumentieren"],["MA.1.C","Zahl und Variable: Mathematisieren und Darstellen"],
    ["MA.2.A","Form und Raum: Operieren und Benennen"],["MA.2.B","Form und Raum: Erforschen und Argumentieren"],["MA.2.C","Form und Raum: Mathematisieren und Darstellen"],
    ["MA.3.A","Grössen, Funktionen, Daten und Zufall: Operieren und Benennen"],["MA.3.B","Grössen, Funktionen, Daten und Zufall: Erforschen und Argumentieren"],["MA.3.C","Grössen, Funktionen, Daten und Zufall: Mathematisieren und Darstellen"]]},
  {f:"NMG", n:"Natur, Mensch, Gesellschaft", z:[1,2], kb:[
    ["NMG.1","Identität, Körper, Gesundheit: sich kennen und sich Sorge tragen"],["NMG.2","Tiere, Pflanzen und Lebensräume erkunden und erhalten"],
    ["NMG.3","Stoffe, Energie und Bewegungen beschreiben, untersuchen und nutzen"],["NMG.4","Phänomene der belebten und unbelebten Natur erforschen und erklären"],
    ["NMG.5","Technische Entwicklungen und Umsetzungen erschliessen, einschätzen und anwenden"],["NMG.6","Arbeit, Produktion und Konsum: Situationen erschliessen"],
    ["NMG.7","Lebensweisen und Lebensräume von Menschen erschliessen und vergleichen"],["NMG.8","Menschen nutzen Räume: sich orientieren und mitgestalten"],
    ["NMG.9","Zeit, Dauer und Wandel verstehen: Geschichte und Geschichten unterscheiden"],["NMG.10","Gemeinschaft und Gesellschaft: Zusammenleben gestalten und sich engagieren"],
    ["NMG.11","Grunderfahrungen, Werte und Normen erkunden und reflektieren"],["NMG.12","Religionen und Weltsichten begegnen"]]},
  {f:"NT", n:"Natur und Technik", z:[3], kb:[
    ["NT.1","Wesen und Bedeutung von Naturwissenschaften und Technik verstehen"],["NT.2","Stoffe untersuchen und gewinnen"],["NT.3","Chemische Reaktionen erforschen"],
    ["NT.4","Energieumwandlungen analysieren und reflektieren"],["NT.5","Mechanische und elektrische Phänomene untersuchen"],["NT.6","Sinne und Signale erforschen"],
    ["NT.7","Körperfunktionen verstehen"],["NT.8","Fortpflanzung und Entwicklung analysieren"],["NT.9","Ökosysteme erkunden"]]},
  {f:"WAH", n:"Wirtschaft, Arbeit, Haushalt", z:[3], kb:[
    ["WAH.1","Produktions- und Arbeitswelten erkunden"],["WAH.2","Märkte und Handel verstehen, über Geld nachdenken"],["WAH.3","Konsum gestalten"],
    ["WAH.4","Ernährung und Gesundheit: Zusammenhänge verstehen"],["WAH.5","Haushalten und Zusammenleben gestalten"]]},
  {f:"RZG", n:"Räume, Zeiten, Gesellschaften", z:[3], kb:[
    ["RZG.1","Natürliche Grundlagen der Erde untersuchen"],["RZG.2","Lebensweisen und Lebensräume charakterisieren"],["RZG.3","Mensch-Umwelt-Beziehungen analysieren"],
    ["RZG.4","Sich in Räumen orientieren"],["RZG.5","Schweiz in Tradition und Wandel verstehen"],["RZG.6","Weltgeschichtliche Kontinuitäten und Umbrüche erklären"],
    ["RZG.7","Geschichtskultur analysieren und nutzen"],["RZG.8","Demokratie und Menschenrechte verstehen und sich dafür engagieren"]]},
  {f:"ERG", n:"Ethik, Religionen, Gemeinschaft", z:[3], kb:[
    ["ERG.1","Existentielle Grunderfahrungen reflektieren"],["ERG.2","Werte und Normen klären und Entscheidungen verantworten"],
    ["ERG.3","Spuren und Einfluss von Religionen in Kultur und Gesellschaft erkennen"],["ERG.4","Sich mit Religionen und Weltsichten auseinandersetzen"],
    ["ERG.5","Ich und die Gemeinschaft: Leben und Zusammenleben gestalten"]]},
  {f:"BG", n:"Bildnerisches Gestalten", z:[1,2,3], kb:[["BG.1","Wahrnehmung und Kommunikation"],["BG.2","Prozesse und Produkte"],["BG.3","Kontexte und Orientierung"]]},
  {f:"TTG", n:"Textiles und Technisches Gestalten", z:[1,2,3], kb:[["TTG.1","Wahrnehmung und Kommunikation"],["TTG.2","Prozesse und Produkte"],["TTG.3","Kontexte und Orientierung"]]},
  {f:"MU", n:"Musik", z:[1,2,3], kb:[["MU.1","Singen und Sprechen"],["MU.2","Hören und Sich-Orientieren"],["MU.3","Bewegen und Tanzen"],["MU.4","Musizieren"],["MU.5","Gestaltungsprozesse"],["MU.6","Praxis des musikalischen Wissens"]]},
  {f:"BS", n:"Bewegung und Sport", z:[1,2,3], kb:[["BS.1","Laufen, Springen, Werfen"],["BS.2","Bewegen an Geräten"],["BS.3","Darstellen und Tanzen"],["BS.4","Spielen"],["BS.5","Gleiten, Rollen, Fahren"],["BS.6","Bewegen im Wasser"]]},
  {f:"MI", n:"Medien und Informatik", z:[1,2,3], kb:[["MI.1","Medien"],["MI.2","Informatik"]]},
  {f:"BO", n:"Berufliche Orientierung", z:[3], kb:[["BO.1","Persönlichkeitsprofil"],["BO.2","Bildungswege, Arbeits- und Berufswelt"],["BO.3","Entscheidung und Umgang mit Schwierigkeiten"],["BO.4","Planung, Umsetzung und Dokumentation"]]}
];
const LP21_KB = {}; LP21.forEach(fb=>fb.kb.forEach(([c,t])=>{ LP21_KB[c]={code:c, titel:t, fach:fb.f, fachName:fb.n}; }));
const lpLabel = c => LP21_KB[c] ? `${c} ${LP21_KB[c].titel}` : c;

// Thema-ID von easyplay → Lehrplan 21: [Zyklus 1 und 2, Zyklus 3]
const THEMA_LP21 = {
  g_urzeit:[["NMG.9"],["RZG.6","RZG.7"]], g_antike:[["NMG.9"],["RZG.6","RZG.7"]], g_mittelalter:[["NMG.9"],["RZG.6","RZG.7"]], g_neuzeit:[["NMG.9"],["RZG.6","RZG.7"]],
  ch_geschichte:[["NMG.9","NMG.10"],["RZG.5","RZG.7"]], kt_:[["NMG.8","NMG.10"],["RZG.5","RZG.4"]],
  pol_demokratie:[["NMG.10"],["RZG.8"]], pol_welt:[["NMG.10"],["RZG.8","RZG.6"]], pol_diktatur:[["NMG.10","NMG.9"],["RZG.8","RZG.6"]], pol_kommunismus:[["NMG.9","NMG.10"],["RZG.6","RZG.8"]],
  geo_schweiz:[["NMG.8"],["RZG.4","RZG.1"]], geo_europa:[["NMG.8","NMG.7"],["RZG.4","RZG.2"]], geo_welt:[["NMG.8","NMG.7"],["RZG.4","RZG.2","RZG.1"]],
  rel_christentum:[["NMG.12"],["ERG.4","ERG.3"]], rel_islam:[["NMG.12"],["ERG.4","ERG.3"]], rel_andere:[["NMG.12"],["ERG.4","ERG.3"]],
  bilder:[["NMG.8"],["RZG.4"]],
  natur:[["NMG.2"],["NT.9"]], tiere:[["NMG.2"],["NT.9"]], wissenschaft:[["NMG.4","NMG.5"],["NT.1"]], koerper:[["NMG.1"],["NT.7","NT.6"]],
  physik:[["NMG.3","NMG.4"],["NT.5","NT.4"]], weltall:[["NMG.4"],["NT.1","RZG.1"]], erde:[["NMG.4","NMG.8"],["RZG.1","RZG.3"]], chemie:[["NMG.3"],["NT.2","NT.3"]],
  mathe:[["MA.1.A","MA.2.A"],["MA.1.A","MA.2.A","MA.3.A"]], technik:[["NMG.5","MI.2"],["NT.1","MI.2"]],
  geld:[["NMG.6"],["WAH.2"]], banken:[["NMG.6"],["WAH.2"]], steuern:[["NMG.6","NMG.10"],["WAH.2","RZG.8"]], krankenkasse:[["NMG.1","NMG.6"],["WAH.5","WAH.4"]],
  medien:[["MI.1"],["MI.1"]], beruf:[["NMG.6"],["BO.2","BO.1"]], schweiz:[["NMG.10","NMG.8"],["RZG.5","RZG.8"]], wirtschaft:[["NMG.6"],["WAH.2","WAH.1"]], logos:[["NMG.6"],["WAH.3"]],
  alltag:[["NMG.10","NMG.1"],["WAH.5","ERG.5"]], sprache:[["D.5","D.6"],["D.5","D.6"]], englisch:[["FS1E.5","FS1E.6"],["FS1E.5","FS1E.6"]], franzoesisch:[["FS2F.5","FS2F.6"],["FS2F.5","FS2F.6"]], ethik:[["NMG.11"],["ERG.2","ERG.1","ERG.5"]], informatik:[["MI.2"],["MI.2","MI.AK"]], haushalt:[["NMG.6","NMG.1"],["WAH.4","WAH.3","WAH.5"]],
  fremdsprachen:[["FS1E.5","FS2F.5"],["FS1E.5","FS2F.5"]],
  kunst:[["BG.3"],["BG.3"]], musik:[["MU.6","MU.2"],["MU.6","MU.2"]], sport:[["BS.4"],["BS.4"]], unterhaltung:[["MI.1","D.6"],["MI.1","D.6"]], allgemein:[["NMG.4"],["NT.1"]]
};
function lp21Vorschlag(themaIds, zyklus){
  const out=[]; const z3 = +zyklus>=3;
  (themaIds||[]).forEach(id=>{ const m = THEMA_LP21[id] || (String(id).startsWith("kt_") ? THEMA_LP21.kt_ : null); if(!m) return; (z3?m[1]:m[0]).forEach(c=>{ if(!out.includes(c)) out.push(c); }); });
  return out.slice(0,4);
}

/* ================= 1b. Themen (Namen wie in der Hauptseite, BEREICHE/SUBTHEMEN/GESCH_EPOCHEN/KANTONE in index.html) ================= */
const BEREICHE = [
  {id:"welt", name:"Welt & Geschichte", themen:[{id:"geschichte", name:"Geschichte"},{id:"politik", name:"Politik", kids:["pol_welt","pol_demokratie","pol_kommunismus","pol_diktatur"]},
    {id:"geografie", name:"Geografie", kids:["geo_schweiz","geo_europa","geo_welt"]},{id:"religion", name:"Religion", kids:["rel_christentum","rel_islam","rel_andere"]},{id:"bilder", name:"Bilder-Quiz"}]},
  {id:"natur", name:"Natur & Wissen", themen:[{id:"natur", name:"Natur & Pflanzen"},{id:"tiere", name:"Tiere"},{id:"wissenschaft", name:"Wissenschaft"},{id:"koerper", name:"Körper"},
    {id:"physik", name:"Physik"},{id:"weltall", name:"Weltall & Astronomie"},{id:"erde", name:"Erde & Naturphänomene"},{id:"chemie", name:"Chemie"},{id:"mathe", name:"Mathematik & Logik"},
    {id:"technik", name:"Technik & Erfindungen"},{id:"informatik", name:"Informatik"}]},
  {id:"geld", name:"Schweiz, Geld & Leben", themen:[{id:"geld", name:"Umgang mit Geld"},{id:"banken", name:"Banken"},{id:"steuern", name:"Steuern"},{id:"krankenkasse", name:"Krankenkasse"},
    {id:"medien", name:"Medien & Social Media"},{id:"beruf", name:"Berufswahl & Lehre"},{id:"haushalt", name:"Haushalt & Ernährung"},{id:"schweiz", name:"Die Schweiz"},
    {id:"wirtschaft", name:"Geld & Wirtschaft"},{id:"logos", name:"Logo-Quiz"}]},
  {id:"alltag", name:"Alltag & Kultur", themen:[{id:"alltag", name:"Alltägliches"},{id:"sprache", name:"Sprache & Deutsch"},{id:"fremdsprachen", name:"Fremdsprachen"},{id:"franzoesisch", name:"Französisch"},
    {id:"englisch", name:"Englisch"},{id:"kunst", name:"Kunst & Kultur"},{id:"musik", name:"Musik"},{id:"sport", name:"Sport"},{id:"unterhaltung", name:"Medien & Unterhaltung"},
    {id:"allgemein", name:"Allgemeinwissen"},{id:"ethik", name:"Ethik"}]}
];
const SUBTHEMEN = {pol_welt:"Weltpolitik", pol_demokratie:"Demokratie", pol_kommunismus:"Kommunismus", pol_diktatur:"Diktatur", geo_schweiz:"Geografie der Schweiz", geo_europa:"Europa",
  geo_welt:"Welt & Kontinente", rel_christentum:"Christentum", rel_islam:"Islam", rel_andere:"Weitere Religionen"};
const GESCH_EPOCHEN = [{id:"g_urzeit", name:"Vom Urknall zur Steinzeit"},{id:"g_antike", name:"Antike"},{id:"g_mittelalter", name:"Mittelalter & Entdeckungen"},{id:"g_neuzeit", name:"Neuzeit bis heute"}];
const CH_ALLG = {id:"ch_geschichte", name:"Schweizer Geschichte"};
const KT_STD = [["AG","Aargau"],["AI","Appenzell Innerrhoden"],["AR","Appenzell Ausserrhoden"],["BE","Bern"],["BL","Basel-Landschaft"],["BS","Basel-Stadt"],["FR","Freiburg"],["GE","Genf"],["GL","Glarus"],["GR","Graubünden"],["JU","Jura"],["LU","Luzern"],["NE","Neuenburg"],["NW","Nidwalden"],["OW","Obwalden"],["SG","St. Gallen"],["SH","Schaffhausen"],["SO","Solothurn"],["SZ","Schwyz"],["TG","Thurgau"],["TI","Tessin"],["UR","Uri"],["VD","Waadt"],["VS","Wallis"],["ZG","Zug"],["ZH","Zürich"]];
const KANTONE = KT_STD.map(([k,n])=>({id:"kt_"+k, kuerzel:k, name:"Kanton "+n}));
const GESCH_IDS = [...GESCH_EPOCHEN, CH_ALLG, ...KANTONE].map(t=>t.id);
const THEMA = {};
BEREICHE.forEach(b=>b.themen.forEach(t=>{ THEMA[t.id]={...t, bereich:b.id}; }));
Object.entries(SUBTHEMEN).forEach(([id,name])=>{ THEMA[id]={id, name}; });
[...GESCH_EPOCHEN, CH_ALLG, ...KANTONE].forEach(t=>{ THEMA[t.id]=t; });
const themaName = id => id==="eigen" ? "Eigene Fragen" : (THEMA[id]?.name || (String(id).startsWith("kt_") ? "Kanton "+String(id).slice(3) : String(id||"")));
const ktName = c => (KT_STD.find(k=>k[0]===c)||[])[1] || c || "";

/* ================= 2. Hilfsfunktionen ================= */
const $ = (q, el) => (el||document).querySelector(q);
const $$ = (q, el) => [...(el||document).querySelectorAll(q)];
const h = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const mischen = a => { a=[...a]; for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
const warte = ms => new Promise(r=>setTimeout(r,ms));
function lsGet(k,d){ try{ const v=localStorage.getItem(k); return v==null ? d : (JSON.parse(v) ?? d); }catch(e){ return d; } }
function lsSet(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); return true; }catch(e){ return false; } }
function lsDel(k){ try{ localStorage.removeItem(k); }catch(e){} }
function neueId(){ try{ if(crypto.randomUUID) return crypto.randomUUID(); }catch(e){}
  const b=new Uint8Array(16); try{ crypto.getRandomValues(b); }catch(e){ for(let i=0;i<16;i++) b[i]=Math.random()*256|0; }
  b[6]=(b[6]&15)|64; b[8]=(b[8]&63)|128; const x=[...b].map(v=>v.toString(16).padStart(2,"0")).join("");
  return `${x.slice(0,8)}-${x.slice(8,12)}-${x.slice(12,16)}-${x.slice(16,20)}-${x.slice(20)}`; }
function zufallInt(n){ try{ const a=new Uint32Array(1); crypto.getRandomValues(a); return a[0]%n; }catch(e){ return Math.floor(Math.random()*n); } }
const CODE_ZEICHEN = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const neuerCode = () => Array.from({length:6},()=>CODE_ZEICHEN[zufallInt(CODE_ZEICHEN.length)]).join("");
const normCode = s => String(s||"").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,6);
function neuerPin(belegt){ const set=new Set(belegt||[]); for(let i=0;i<500;i++){ const p=String(100000+zufallInt(900000)); if(!set.has(p)) return p; } return String(100000+zufallInt(900000)); }
const datum = d => { try{ return d ? new Date(d).toLocaleDateString("de-CH") : ""; }catch(e){ return ""; } };
const datumZeit = d => { try{ return d ? new Date(d).toLocaleString("de-CH",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}) : ""; }catch(e){ return ""; } };
const zeit = ms => { const s=Math.round((+ms||0)/1000); if(s<60) return `${s} s`; const m=Math.floor(s/60); return `${m} min ${String(s%60).padStart(2,"0")} s`; };
const zahl = n => (n==null || isNaN(n)) ? "·" : Number(n).toLocaleString("de-CH");
const plain = o => JSON.parse(JSON.stringify(o));
const emailOk = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
// Gedankenstriche aus Fragen entfernen (wie ohneStrich() der Hauptseite)
function ohneStrich(t){ if(typeof t!=="string") return t; return t.replace(/(\d)\s*[–—]\s*(\d)/g,"$1 bis $2").replace(/([.!?:;,])\s*[–—]\s*/g,"$1 ").replace(/(^|[\n(\["'])\s*[–—]\s*/g,"$1").replace(/\s+[–—]\s*$/g,"").replace(/\s+[–—]\s+/g,", ").replace(/[–—]/g,"-"); }
function frageOhneStrich(f){ return {...f, q:ohneStrich(f.q), a:f.a.map(ohneStrich), e:ohneStrich(f.e), m:ohneStrich(f.m)}; }
function qid(f){ let x=2166136261; for(const c of String(f.q)){ x^=c.charCodeAt(0); x=Math.imul(x,16777619); } return (x>>>0).toString(36); }
const fNr = f => +f?.nr || 0;
const fKey = f => (f && f.eigen && f.id) ? f.id : qid(f);

// Note nach Schweizer Skala: 5 * Punkte / Max + 1, auf halbe Noten gerundet
function note(p, max){ if(!max) return 1; const n = 5*p/max + 1; return Math.min(6, Math.max(1, Math.round(n*2)/2)); }
const fmtNote = n => (n==null || isNaN(n)) ? "·" : (Math.round(n*10)/10).toFixed(1).replace(/\.0$/,"");
const noteKlasse = n => n==null || isNaN(n) ? "" : n>=5 ? "gut" : n>=4 ? "" : "tief";
const istOffen = f => !!f && f.art==="offen";
const fPunkte = f => istOffen(f) ? Math.max(1, Math.min(20, +f.p||1)) : 1;
const maxPunkte = fragen => (fragen||[]).reduce((s,f)=>s+fPunkte(f), 0);
function bewerte(fragen, antworten, korrektur){
  let p=0, offen=0; const k=korrektur||{};
  fragen.forEach((f,i)=>{
    if(istOffen(f)){ const kp=k[i]; if(kp!=null && kp!=="") p+=Math.max(0, Math.min(fPunkte(f), +kp||0)); else if(antworten[i]!=null && String(antworten[i]).trim()!=="") offen++; }
    else if(antworten[i]!=null && +antworten[i]===+f.r) p++;
  });
  const max=maxPunkte(fragen);
  return {punkte:p, max, note:note(p, max), offen};
}
function antwortenSaeubern(fragen, antworten){
  return fragen.map((f,i)=>{ const v=(antworten||[])[i];
    if(istOffen(f)) return (v==null || typeof v==="object") ? null : String(v).slice(0,2000);
    return (v===0||v===1||v===2||v===3) ? v : null; });
}
// Abgaben nie blind übernehmen: aus den Antworten neu bewerten
function abgabenPruefen(list, tests){
  const nachCode={}; (tests||[]).forEach(t=>nachCode[t.code]=t);
  return (list||[]).filter(a=>a && nachCode[a.code]).map(a=>{
    const t=nachCode[a.code], ant=antwortenSaeubern(t.fragen, Array.isArray(a.antworten)?a.antworten:[]);
    const kor=(a.korrektur && typeof a.korrektur==="object") ? a.korrektur : {};
    const b=bewerte(t.fragen, ant, kor);
    return {...a, id:String(a.id), code:String(a.code), sid:String(a.sid), name:String(a.name||"").slice(0,60), antworten:ant, korrektur:kor,
      punkte:b.punkte, max:b.max, note:b.note, offen:b.offen, dauer:Math.max(0,Math.min(+a.dauer||0, 864e5)), datum:String(a.datum||"").slice(0,40)};
  });
}
function abgabenEindeutig(list){ const seen=new Set(); return [...list].sort((a,b)=>String(a.datum).localeCompare(String(b.datum))).filter(a=>{ const k=a.code+"|"+a.sid; if(seen.has(k)) return false; seen.add(k); return true; }); }
function fehlerAnalyse(tests, abgaben, sid){
  const tm={}; tests.forEach(t=>tm[t.code]=t); const map=new Map();
  abgaben.filter(a=>!sid || a.sid===sid).forEach(a=>{ const t=tm[a.code]; if(!t) return;
    t.fragen.forEach((f,i)=>{ if(istOffen(f)) return; const key=f.nr ? "n"+f.nr : f.q; let st=map.get(key); if(!st){ st={f, n:0, falsch:0, wahl:{}, tests:new Set()}; map.set(key,st); }
      st.n++; st.tests.add(t.titel); const x=a.antworten?.[i];
      if(x==null || +x!==+f.r){ st.falsch++; const txt = x==null ? "(keine Antwort)" : (f.o[x] ?? "?"); st.wahl[txt]=(st.wahl[txt]||0)+1; if(sid) st.dein=txt; } });
  });
  return [...map.values()].map(st=>{ const top=Object.entries(st.wahl).sort((a,b)=>b[1]-a[1])[0]; return {...st, quote:st.n?st.falsch/st.n:0, top:top?{text:top[0], n:top[1]}:null}; })
    .sort((a,b)=>b.quote-a.quote || b.falsch-a.falsch || b.n-a.n);
}
function themenQuote(tests, abgaben, sid){
  const tm={}; tests.forEach(t=>tm[t.code]=t); const m={};
  abgaben.filter(a=>!sid || a.sid===sid).forEach(a=>{ const t=tm[a.code]; if(!t) return; t.fragen.forEach((f,i)=>{ if(istOffen(f)) return; const k=f.t||"?"; m[k]=m[k]||{t:k,n:0,falsch:0}; m[k].n++; const x=a.antworten?.[i]; if(x==null || +x!==+f.r) m[k].falsch++; }); });
  return Object.values(m).map(x=>({...x, quote:x.n?x.falsch/x.n:0})).sort((a,b)=>b.quote-a.quote || b.n-a.n);
}
function wochenStart(d){ const x=new Date(d); x.setHours(12,0,0,0); const wd=(x.getDay()+6)%7; x.setDate(x.getDate()-wd); return x.toISOString().slice(0,10); }
function kw(iso){ const d=new Date(iso+"T12:00:00"); const t=new Date(d); t.setDate(t.getDate()+3-((t.getDay()+6)%7)); const j=new Date(t.getFullYear(),0,4); return 1+Math.round(((t-j)/864e5-3+((j.getDay()+6)%7))/7); }
function wochenSchnitt(abgaben){ const m={}; abgaben.filter(a=>!a.offen).forEach(a=>{ const w=wochenStart(a.datum); (m[w]=m[w]||[]).push(+a.note); }); return Object.entries(m).map(([w,l])=>({w, wert:l.reduce((s,x)=>s+x,0)/l.length, n:l.length})).sort((a,b)=>a.w.localeCompare(b.w)); }
function schnitt(l){ l=l.filter(x=>x!=null && !isNaN(x)); return l.length ? l.reduce((s,x)=>s+(+x),0)/l.length : null; }
function isoWoche(d){
  const t=new Date(d||Date.now()); t.setHours(12,0,0,0); t.setDate(t.getDate()+3-((t.getDay()+6)%7));
  const jahr=t.getFullYear(), j4=new Date(jahr,0,4,12); const n=1+Math.round(((t-j4)/864e5-3+((j4.getDay()+6)%7))/7);
  return {jahr, kw:n, key:`${jahr}-${String(n).padStart(2,"0")}`};
}
function ligaWochen(){ return {jetzt:isoWoche(new Date()), vor:isoWoche(new Date(Date.now()-7*864e5))}; }
const FARBEN = ["#8A3FE0","#3D5AFE","#17A35A","#D97706","#D6336C","#0E9AA7"];

function verlaufSVG(reihen, titel){
  const wochen=[...new Set(reihen.flatMap(r=>r.punkte.map(p=>p.w)))].sort();
  if(!wochen.length) return `<p class="mu">Noch keine korrigierten Resultate für einen Verlauf.</p>`;
  const W=640, H=250, pl=40, pr=18, pt=16, pb=44, bw=W-pl-pr, bh=H-pt-pb;
  const x=i => wochen.length===1 ? pl+bw/2 : pl+i*bw/(wochen.length-1);
  const y=n => pt+(6-n)/5*bh;
  const jedes=Math.max(1, Math.ceil(wochen.length/7));
  let g="";
  for(let n=1;n<=6;n++) g+=`<line x1="${pl}" x2="${W-pr}" y1="${y(n)}" y2="${y(n)}" class="gl${n===4?" vier":""}"/><text x="${pl-10}" y="${y(n)+5}" text-anchor="end" class="ax">${n}</text>`;
  wochen.forEach((w,i)=>{ if(i%jedes) return; const d=new Date(w+"T12:00:00"); g+=`<text x="${x(i)}" y="${H-24}" text-anchor="middle" class="ax">KW ${kw(w)}</text><text x="${x(i)}" y="${H-8}" text-anchor="middle" class="ax kl">${d.getDate()}.${d.getMonth()+1}.</text>`; });
  const linien=reihen.map(r=>{ const pts=r.punkte.map(p=>[x(wochen.indexOf(p.w)), y(p.wert), p]);
    return `<g>${pts.length>1?`<polyline points="${pts.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" ")}" style="stroke:${r.farbe}"${r.gestrichelt?' stroke-dasharray="7 6"':""}/>`:""}
      ${pts.map(p=>`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${r.gestrichelt?4:6}" style="fill:${r.farbe}"><title>${h(r.name)}, KW ${kw(p[2].w)}: Note ${fmtNote(p[2].wert)} (${p[2].n} ${p[2].n===1?"Abgabe":"Abgaben"})</title></circle>`).join("")}</g>`; }).join("");
  return `<figure class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${h(titel||"Verlauf der Noten")}">${g}${linien}</svg>
    <figcaption>${reihen.map(r=>`<span><i style="background:${r.farbe}"></i>${h(r.name)}</span>`).join("")}<span class="leg4"><i></i>Note 4 (genügend)</span></figcaption></figure>`;
}

/* ---------- Meldung (Toast) und Dialoge ---------- */
function melde(t, art){ const m=$("#meldung"); m.textContent=t; m.classList.toggle("fe", art==="fe"); m.style.display="block"; clearTimeout(m._t); m._t=setTimeout(()=>m.style.display="none", art==="fe"?7000:3500); }
function dialog(html, binden){
  const d=$("#dlg"); if(d.open) d.close(); d.innerHTML=html;
  try{ d.showModal(); }catch(e){ d.setAttribute("open",""); }
  binden && binden(d);
  const erstes=d.querySelector("[autofocus],input,textarea,select"); if(erstes) try{ erstes.focus(); }catch(e){}
  return d;
}
function schliesse(){ const d=$("#dlg"); try{ if(d.open) d.close(); }catch(e){ d.removeAttribute("open"); } d.innerHTML=""; }
function bestaetige(titel, text, ok, gefahr){
  return new Promise(res=>{ let fertig=false; const ende=v=>{ if(fertig) return; fertig=true; schliesse(); res(v); };
    dialog(`<h2 id="dlgTitel">${h(titel)}</h2><p>${h(text)}</p><div class="knoepfe"><button type="button" class="k" data-x="0">Abbrechen</button><button type="button" class="k ${gefahr?"g":"p"}" data-x="1" autofocus>${h(ok||"OK")}</button></div>`,
      d=>{ d.querySelectorAll("[data-x]").forEach(b=>b.onclick=()=>ende(b.dataset.x==="1")); d.oncancel=e=>{ e.preventDefault(); ende(false); }; }); });
}
const laden = text => `<div class="laden"><div class="spinner" aria-hidden="true"></div><span>${h(text||"Wird geladen …")}</span></div>`;
function fehlerText(e){
  const m=String(e?.message||e?.code||e||"");
  if(/42P01|does not exist|relation .* not exist|schema cache/i.test(m)) return "Die Lehrer-Tabellen fehlen in Supabase. Bitte supabase/lehrer.sql im SQL Editor ausführen (siehe ANLEITUNG-LEHRER.md).";
  if(/quota_exceeded|QuotaExceeded/i.test(m)) return "Der Speicher ist voll. Bitte alte Tests löschen.";
  if(/JWT|not authenticated|401/i.test(m)) return "Bitte melde dich nochmals an.";
  if(/42501|row-level security|lehrperson/i.test(m)) return "Dein Lehrerkonto ist noch nicht freigegeben. Sobald es geprüft ist, kannst du Klassen anlegen.";
  return "Das hat nicht geklappt: "+(m||"unbekannter Fehler");
}

/* ================= 3. Speicher ================= */
/* Gemeinsame Schnittstelle (wie lehrer.js): art, lehrerId(), istLehrer(), rolleSetzen(), klassen(), klasseSpeichern(k),
   klasseLoeschen(id), tests(), codeFrei(code), testSpeichern(t), testLoeschen(code), abgaben(), abgabeLoeschen(a), abgabeKorrigieren(a, korrektur) */
function datenLesen(key){ const d=lsGet(key,null)||{}; return {klassen:Array.isArray(d.klassen)?d.klassen:[], tests:Array.isArray(d.tests)?d.tests:[], abgaben:Array.isArray(d.abgaben)?d.abgaben:[]}; }
function datenSchreiben(key, d){ if(!lsSet(key,d)) throw new Error("Speichern im Browser nicht möglich (privates Fenster oder Speicher voll)."); }

function lokalSpeicher(key, lid, art, nachSchreiben, vorLesen){
  const lese = () => datenLesen(key);
  const schreibe = d => { datenSchreiben(key, d); if(nachSchreiben) nachSchreiben(); };
  return {
    art,
    lehrerId: lid,
    istLehrer(){ if(art==="test") return true; const id=lid(); return !!(id && lsGet(LS_ROLLE,{})[id]); },
    async rolleSetzen(){ const id=lid(); if(!id || art==="test") return; const r=lsGet(LS_ROLLE,{}); r[id]=true; lsSet(LS_ROLLE,r); },
    async klassen(){ const id=lid(); return lese().klassen.filter(k=>k.lehrer===id); },
    async klasseSpeichern(k){ const d=lese(); const x={...plain(k), lehrer:lid()}; const i=d.klassen.findIndex(y=>y.id===k.id); if(i>=0) d.klassen[i]=x; else d.klassen.push(x);
      const sids=new Set((k.schueler||[]).map(s=>s.id)); const codes=new Set(d.tests.filter(t=>t.klasseId===k.id).map(t=>t.code));
      d.abgaben=d.abgaben.filter(a=>!codes.has(a.code) || sids.has(a.sid)); schreibe(d); return x; },
    async klasseLoeschen(id){ const d=lese(); const codes=new Set(d.tests.filter(t=>t.klasseId===id).map(t=>t.code));
      d.klassen=d.klassen.filter(k=>k.id!==id); d.tests=d.tests.filter(t=>t.klasseId!==id); d.abgaben=d.abgaben.filter(a=>!codes.has(a.code)); schreibe(d); },
    async tests(){ const id=lid(); return lese().tests.filter(t=>t.lehrer===id).sort((a,b)=>String(b.erstellt).localeCompare(String(a.erstellt))); },
    async codeFrei(code){ return !lese().tests.some(t=>t.code===code) && !datenLesen(LS_DATEN).tests.some(t=>t.code===code); },
    async testSpeichern(t){ const d=lese(); const x={...plain(t), lehrer:lid()}; const i=d.tests.findIndex(y=>y.code===t.code); if(i>=0) d.tests[i]=x; else d.tests.push(x); schreibe(d); return x; },
    async testLoeschen(code){ const d=lese(); d.tests=d.tests.filter(t=>t.code!==code); d.abgaben=d.abgaben.filter(a=>a.code!==code); schreibe(d); },
    async abgaben(){ if(vorLesen) vorLesen(); const d=lese(); const codes=new Set(d.tests.filter(t=>t.lehrer===lid()).map(t=>t.code)); return d.abgaben.filter(a=>codes.has(a.code)); },
    async abgabeLoeschen(a){ const d=lese(); d.abgaben=d.abgaben.filter(x=>x.id!==a.id); schreibe(d); },
    async abgabeKorrigieren(a, korrektur){ const d=lese(); const x=d.abgaben.find(y=>y.id===a.id); if(!x) throw new Error("Abgabe nicht gefunden."); const t=d.tests.find(y=>y.code===x.code); x.korrektur=korrektur||{};
      if(t){ const r=bewerte(t.fragen, antwortenSaeubern(t.fragen, x.antworten), x.korrektur); x.punkte=r.punkte; x.max=r.max; x.note=r.note; } schreibe(d); },
    liga:false
  };
}

/* Brücke Testzugang → Hauptseite: spiegelt Klassen, Tests und Abgaben des Testzugangs nach "ep-lehrer-daten"
   und übernimmt neue Abgaben, die Kinder in der Hauptseite (gleiches Gerät, gleicher Ursprung) gemacht haben. */
function brueckeAktiv(){ return !SUPA; }
function bruecke(){
  if(!brueckeAktiv()) return;
  try{
    const T=datenLesen(LT_DATEN), S=datenLesen(LS_DATEN);
    const codes=new Set(T.tests.map(t=>t.code));
    const alteCodes=new Set(S.tests.filter(t=>t.lehrer===TEST_LID).map(t=>t.code));
    const vorhanden=new Set(T.abgaben.map(a=>a.id));
    let neu=0;
    S.abgaben.forEach(a=>{ if(codes.has(a.code) && !vorhanden.has(String(a.id))){ T.abgaben.push(a); neu++; } });
    if(neu) datenSchreiben(LT_DATEN, T);
    S.klassen=S.klassen.filter(k=>k.lehrer!==TEST_LID).concat(T.klassen.map(k=>({...k, lehrer:TEST_LID})));
    S.tests=S.tests.filter(t=>t.lehrer!==TEST_LID).concat(T.tests.map(t=>({...t, lehrer:TEST_LID})));
    S.abgaben=S.abgaben.filter(a=>!codes.has(a.code) && !alteCodes.has(a.code)).concat(T.abgaben);
    datenSchreiben(LS_DATEN, S);
  }catch(e){ console.warn("Lehrerbereich: Brücke zum Testzugang", e); }
}
function brueckeEntfernen(){
  try{ const S=datenLesen(LS_DATEN); const alte=new Set(S.tests.filter(t=>t.lehrer===TEST_LID).map(t=>t.code));
    S.klassen=S.klassen.filter(k=>k.lehrer!==TEST_LID); S.tests=S.tests.filter(t=>t.lehrer!==TEST_LID); S.abgaben=S.abgaben.filter(a=>!alte.has(a.code)); datenSchreiben(LS_DATEN, S); }catch(e){}
}
function testSpeicher(){ return lokalSpeicher(LT_DATEN, ()=>TEST_LID, "test", bruecke, bruecke); }

/* Supabase (gleiche Tabellen und RPCs wie lehrer.js) */
const AUTH = { sb:null, user:null, bereit:false };
function supaSpeicher(){
  const sb = () => AUTH.sb;
  const lid = () => AUTH.user?.id || null;
  const chk = r => { if(r.error) throw new Error((r.error.code?r.error.code+" ":"")+(r.error.message||"Fehler")); return r.data; };
  const testAusZeile = r => ({code:r.code, klasseId:r.klasse_id, titel:r.titel, schuljahr:r.schuljahr, lp21:r.lp21||[], fragen:r.fragen||[], aktiv:r.aktiv!==false, erstellt:r.erstellt, info:r.info||{}});
  const rpcFehler = r => { if(r.error) throw new Error((r.error.code?r.error.code+" ":"")+r.error.message); };
  return {
    art:"supabase",
    lehrerId: lid,
    // Lehrperson ist nur, wen die Verwaltung freigegeben hat (app_metadata, vom Konto selbst nicht änderbar)
    istLehrer(){ const u=AUTH.user; return !!(u && u.app_metadata?.rolle==="lehrperson"); },
    beantragt(){ const u=AUTH.user; return !!(u && u.user_metadata?.rolle==="lehrperson"); },
    async neuPruefen(){ try{ const r=await AUTH.sb.auth.refreshSession(); if(r?.data?.user) AUTH.user=r.data.user; }catch(e){} },
    async rolleSetzen(){ const u=AUTH.user; if(!u) return;   // nur Antrag
      try{ const res=await sb().auth.updateUser({data:{rolle:"lehrperson"}}); if(res?.data?.user) AUTH.user=res.data.user; }catch(e){} await this.neuPruefen(); },
    async klassen(){
      const k=chk(await sb().from("lehrer_klassen").select("id,name,schuljahr,zyklus,erstellt").order("erstellt"));
      const s=chk(await sb().from("lehrer_schueler").select("id,klasse_id,name,pin").order("name"));
      return k.map(x=>({id:x.id, name:x.name, schuljahr:x.schuljahr, zyklus:x.zyklus, erstellt:x.erstellt, schueler:s.filter(y=>y.klasse_id===x.id).map(y=>({id:y.id, name:y.name, pin:y.pin}))}));
    },
    async klasseSpeichern(k){
      chk(await sb().from("lehrer_klassen").upsert({id:k.id, lehrer:lid(), name:k.name, schuljahr:k.schuljahr||"", zyklus:+k.zyklus||null}));
      const alt=chk(await sb().from("lehrer_schueler").select("id").eq("klasse_id",k.id));
      const ids=new Set((k.schueler||[]).map(s=>s.id)); const weg=alt.filter(x=>!ids.has(x.id)).map(x=>x.id);
      if(weg.length) chk(await sb().from("lehrer_schueler").delete().in("id",weg));
      if(k.schueler?.length) chk(await sb().from("lehrer_schueler").upsert(k.schueler.map(s=>({id:s.id, klasse_id:k.id, lehrer:lid(), name:s.name, pin:s.pin}))));
      return k;
    },
    async klasseLoeschen(id){ chk(await sb().from("lehrer_klassen").delete().eq("id",id)); },
    async tests(){ return chk(await sb().from("lehrer_tests").select("*").order("erstellt",{ascending:false})).map(testAusZeile); },
    async codeFrei(code){ const r=chk(await sb().from("lehrer_tests").select("code").eq("code",code)); return !r.length; },
    async testSpeichern(t){ chk(await sb().from("lehrer_tests").upsert({code:t.code, lehrer:lid(), klasse_id:t.klasseId, titel:t.titel, schuljahr:t.schuljahr||"", lp21:t.lp21||[], fragen:t.fragen, info:t.info||{}, aktiv:t.aktiv!==false})); return t; },
    async testLoeschen(code){ chk(await sb().from("lehrer_tests").delete().eq("code",code)); },
    async abgaben(){ return chk(await sb().from("lehrer_abgaben").select("id,test_code,schueler_id,name,antworten,korrektur,punkte,max,note,dauer_ms,abgegeben").order("abgegeben"))
      .map(a=>({id:a.id, code:a.test_code, sid:a.schueler_id, name:a.name, antworten:a.antworten||[], korrektur:a.korrektur||{}, punkte:a.punkte, max:a.max, note:+a.note, dauer:a.dauer_ms, datum:a.abgegeben})); },
    async abgabeLoeschen(a){ chk(await sb().from("lehrer_abgaben").delete().eq("id",a.id)); },
    async abgabeKorrigieren(a, korrektur){ const t=ST.daten?.tests.find(x=>x.code===a.code); const r=t ? bewerte(t.fragen, antwortenSaeubern(t.fragen, a.antworten), korrektur) : null;
      chk(await sb().from("lehrer_abgaben").update({korrektur:korrektur||{}, ...(r?{punkte:r.punkte, max:r.max, note:r.note}:{})}).eq("id",a.id)); },
    liga: true,
    async ligaMeine(){ return chk(await sb().from("liga_klassen").select("klasse_id,liga_id,anzeige,kanton,gesperrt")); },
    async ligaAnmelden(klasseId, anzeige, kanton){ const r=await sb().rpc("liga_anmelden",{p_klasse:klasseId, p_anzeige:anzeige, p_kanton:kanton||""}); rpcFehler(r); return r.data||{fehler:"daten"}; },
    async ligaAbmelden(klasseId){ const r=await sb().rpc("liga_abmelden",{p_klasse:klasseId}); rpcFehler(r); return !!r.data; },
    async ligaRangliste(woche, kanton){ const r=await sb().rpc("liga_rangliste",{p_woche:woche||null, p_kanton:kanton||null}); rpcFehler(r);
      return (r.data||[]).map(x=>({platz:+x.platz, id:x.liga_id, anzeige:x.anzeige, kanton:x.kanton||"", zyklus:x.zyklus, punkte:+x.punkte, kinder:+x.kinder, aktiv:+x.aktiv})); }
  };
}

/* ================= 4. Konten und Anmeldung ================= */
// Lokale Konten wie die Hauptseite: "ep-konten" {mail:{salt, hash:"p2:…" (PBKDF2, 600 000 Runden), profil}}, nie Klartext
async function pwHashNeu(pw, salt){
  const key=await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveBits"]);
  const bits=await crypto.subtle.deriveBits({name:"PBKDF2", hash:"SHA-256", salt:new TextEncoder().encode(salt), iterations:600000}, key, 256);
  return "p2:"+[...new Uint8Array(bits)].map(b=>b.toString(16).padStart(2,"0")).join("");
}
async function pwHashAlt(pw, salt){ const d=await crypto.subtle.digest("SHA-256", new TextEncoder().encode(salt+"|"+pw)); return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,"0")).join(""); }
async function pwPruefen(pw, k){ if(!k || !k.hash) return false; if(String(k.hash).startsWith("p2:")) return (await pwHashNeu(pw,k.salt))===k.hash; return (await pwHashAlt(pw,k.salt))===k.hash; }
const neuesSalz = () => { const a=new Uint32Array(4); crypto.getRandomValues(a); return [...a].join("-"); };
const lokaleKonten = () => lsGet("ep-konten",{}) || {};

const ST = { konto:null, sp:null, daten:null, laedt:false, fehler:"", tab:"uebersicht", param:"", neu:null, ki:{klasse:"", q:""}, te:{klasse:""}, fq:{thema:"", stufe:0, q:"", seite:0} };

function ladeSupabase(){
  return new Promise((ok,err)=>{ if(window.supabase?.createClient) return ok(); const s=document.createElement("script"); s.src=SUPA_JS; s.integrity=SUPA_SRI; s.crossOrigin="anonymous"; s.onload=ok; s.onerror=()=>err(new Error("Supabase konnte nicht geladen werden.")); document.head.appendChild(s); });
}
async function authInit(){
  if(!SUPA){ AUTH.bereit=true; return; }
  try{
    await ladeSupabase();
    AUTH.sb=window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey);
    const {data}=await AUTH.sb.auth.getSession(); AUTH.user=data?.session?.user||null;
    AUTH.sb.auth.onAuthStateChange((ev, sess)=>{ const vorher=AUTH.user?.id; AUTH.user=sess?.user||null;
      if(ST.konto?.art==="supabase" && !AUTH.user && ev==="SIGNED_OUT"){ ST.konto=null; ST.sp=null; ST.daten=null; zeigeLogin("anmelden"); }
      else if(AUTH.user && vorher!==AUTH.user.id && ST.konto?.art==="supabase"){ kontoSupabase(); weiterNachLogin(); } });
  }catch(e){ console.warn("Lehrerbereich: Supabase nicht erreichbar", e); AUTH.fehler=e.message; }
  AUTH.bereit=true;
}
function kontoTest(){ ST.konto={art:"test", email:TEST_MAIL, name:"Testlehrperson", vorname:"Testlehrperson", kanton:"SO"}; ST.sp=testSpeicher(); ST.daten=null; }
function kontoLokal(profil){ const mail=String(profil.email||"").toLowerCase();
  ST.konto={art:"lokal", email:mail, name:profil.name||profil.vorname||mail, vorname:profil.vorname||"", kanton:profil.kanton||""};
  const lid = () => ST.konto?.email ? "m:"+ST.konto.email : (profil.name ? "n:"+profil.name : null);
  ST.sp=lokalSpeicher(LS_DATEN, lid, "lokal"); ST.daten=null; }
function kontoSupabase(){ const u=AUTH.user, m=u?.user_metadata||{};
  ST.konto={art:"supabase", email:u?.email||"", name:(m.vorname?`${m.vorname} ${(m.nachname||"").charAt(0)}.`.replace(/ \.$/,""):"")||(u?.email||"").split("@")[0], vorname:m.vorname||"", kanton:m.kanton||""};
  ST.sp=supaSpeicher(); ST.daten=null; }

async function start(){
  await authInit();
  if(lsGet(LT_SITZUNG,false)){ kontoTest(); return weiterNachLogin(); }
  if(SUPA && AUTH.user){ kontoSupabase(); return weiterNachLogin(); }
  if(!SUPA){ const p=lsGet("ep-profil",null); if(p && (p.email || p.name) && !lsGet("ep-abgemeldet",false)){ kontoLokal(p); return weiterNachLogin(); } }
  zeigeLogin("anmelden");
}
function weiterNachLogin(){ if(!ST.sp.istLehrer()) return zeigeRolle(); appStart(); }

async function testStarten(){
  lsSet(LT_SITZUNG, true);
  if(!lsGet(LT_DATEN,null)) testdatenAnlegen(); else bruecke();
  kontoTest(); melde("Testzugang geöffnet. Alle Daten bleiben auf diesem Gerät.");
  appStart();
}
async function testZuruecksetzen(){
  if(!await bestaetige("Testdaten zurücksetzen?", "Alle Klassen, Tests und Resultate des Testzugangs werden gelöscht und durch frische Beispieldaten ersetzt. Echte Konten sind davon nicht betroffen.", "Zurücksetzen", true)) return;
  brueckeEntfernen(); lsDel(LT_DATEN); lsDel(LT_MELD); testdatenAnlegen(); ST.daten=null; ST.neu=null; melde("Die Testdaten sind wieder wie neu."); zeige("uebersicht");
}
async function abmelden(){
  if(!await bestaetige("Abmelden?", ST.konto?.art==="test" ? "Der Testzugang wird geschlossen. Die Testdaten bleiben auf diesem Gerät, bis du sie zurücksetzt." : "Du wirst vom Lehrerbereich abgemeldet. Deine Klassen und Tests bleiben gespeichert.", "Abmelden")) return;
  const art=ST.konto?.art;
  if(art==="test") lsDel(LT_SITZUNG);
  else if(art==="supabase"){ try{ await AUTH.sb.auth.signOut(); }catch(e){} }
  else { lsSet("ep-abgemeldet", true); const p=lsGet("ep-profil",null); if(p) lsSet("ep-profil-alt", p); lsDel("ep-profil"); }
  ST.konto=null; ST.sp=null; ST.daten=null; ST.neu=null;
  history.replaceState(null, "", location.pathname+location.search);
  zeigeLogin("anmelden"); melde("Du bist abgemeldet.");
}

/* ---------- Anmeldemaske ---------- */
function zeigeLogin(modus, vorMail){
  $("#app").hidden=true; $("#login").hidden=false; document.title="easyplay Lehrerbereich: Anmelden";
  const reg = modus==="registrieren";
  const letzte = vorMail || lsGet("ep-letztemail","") || "";
  $("#loginKarte").innerHTML=`
    <h1>Lehrerbereich</h1>
    <p class="mu klein">Klassen verwalten, Tests mit Code verteilen und Resultate auswerten.</p>
    <div class="segs" role="group" aria-label="Anmelden oder registrieren"><button type="button" data-lm="anmelden" aria-pressed="${!reg}">Anmelden</button><button type="button" data-lm="registrieren" aria-pressed="${reg}">Konto erstellen</button></div>
    ${reg ? `<form id="regForm" novalidate>
        <div class="zwei"><div class="feld"><label for="rVor">Vorname</label><input id="rVor" autocomplete="given-name" maxlength="30" required></div>
        <div class="feld"><label for="rNach">Nachname</label><input id="rNach" autocomplete="family-name" maxlength="30" required></div></div>
        <label for="rMail">E-Mail-Adresse</label><input id="rMail" type="email" autocomplete="email" placeholder="name@schule.ch" required>
        <label for="rKt">Kanton der Schule</label><select id="rKt"><option value="">Bitte wählen</option>${KT_STD.map(([c,n])=>`<option value="${c}">${h(n)}</option>`).join("")}</select>
        <label for="rPw">Passwort (mindestens 8 Zeichen)</label><div class="pwfeld"><input id="rPw" type="password" autocomplete="new-password" minlength="8" required><button type="button" data-zeig="rPw">zeigen</button></div>
        <label for="rPw2">Passwort wiederholen</label><input id="rPw2" type="password" autocomplete="new-password" required>
        <label class="schalter"><input type="checkbox" id="rOk"><span class="klein">Ich bin Lehrperson und erfasse von Kindern nur Vornamen oder Kürzel.</span></label>
        <p class="fehlertext klein" id="lFehler" aria-live="polite"></p>
        <button class="k p knopfbreit" type="submit" id="rGo">Konto erstellen</button>
      </form>`
    : `<form id="anmForm" novalidate>
        <label for="lMail">E-Mail-Adresse</label><input id="lMail" type="email" autocomplete="username" placeholder="name@schule.ch" value="${h(letzte)}" required>
        <label for="lPw">Passwort</label><div class="pwfeld"><input id="lPw" type="password" autocomplete="current-password" required><button type="button" data-zeig="lPw">zeigen</button></div>
        <p class="fehlertext klein" id="lFehler" aria-live="polite"></p>
        <button class="k p knopfbreit" type="submit" id="lGo">Anmelden</button>
      </form>`}
    <div class="trenner">oder</div>
    <button type="button" id="testKnopf"><span aria-hidden="true">🧪</span> Test-Zugang ausprobieren</button>
    <p class="zugang">Zugangsdaten: Benutzer <code>${TEST_MAIL}</code> · Passwort <code>${TEST_PW}</code><br>Testzugang mit Beispielklassen. Daten nur auf diesem Gerät.</p>
    <p class="kinder">Bist du ein Kind und hast einen Test-Code? <a class="link" href="../">Zu easyplay, dort «Test mit Code»</a></p>
    <p class="modus">${SUPA ? (AUTH.sb ? "Anmeldung über die easyplay-Datenbank (Supabase)." : "Die Online-Datenbank ist im Moment nicht erreichbar. Der Testzugang funktioniert trotzdem.") : "Ohne Online-Datenbank: Konten, Klassen und Resultate bleiben in diesem Browser."}</p>`;
  $$("[data-lm]").forEach(b=>b.onclick=()=>zeigeLogin(b.dataset.lm, ($("#lMail")||$("#rMail"))?.value));
  $$("[data-zeig]").forEach(b=>b.onclick=()=>{ const i=$("#"+b.dataset.zeig); i.type=i.type==="password"?"text":"password"; b.textContent=i.type==="password"?"zeigen":"verbergen"; });
  $("#testKnopf").onclick=testStarten;
  const err=t=>{ $("#lFehler").textContent=t; };
  if(reg){
    if(vorMail) $("#rMail").value=vorMail;
    $("#regForm").onsubmit=async e=>{ e.preventDefault();
      const clean=v=>v.trim().replace(/\s+/g," "); const re=/^[\p{L}][\p{L}' \-]{1,29}$/u;
      const vor=clean($("#rVor").value), nach=clean($("#rNach").value), mail=$("#rMail").value.trim().toLowerCase(), kt=$("#rKt").value, pw=$("#rPw").value;
      if(!re.test(vor)) return err("Bitte gib deinen Vornamen ein (nur Buchstaben).");
      if(!re.test(nach)) return err("Bitte gib deinen Nachnamen ein (nur Buchstaben).");
      if(!emailOk(mail)) return err("Bitte gib eine gültige E-Mail-Adresse ein.");
      if(mail===TEST_MAIL) return err("Diese Adresse ist für den Testzugang reserviert.");
      if(!kt) return err("Bitte wähle den Kanton deiner Schule.");
      if(pw.length<8) return err("Das Passwort braucht mindestens 8 Zeichen.");
      if(pw!==$("#rPw2").value) return err("Die beiden Passwörter sind nicht gleich.");
      if(!$("#rOk").checked) return err("Bitte bestätige, dass du Lehrperson bist.");
      const b=$("#rGo"); b.disabled=true; err(""); b.textContent="Konto wird erstellt …";
      try{
        if(SUPA){
          if(!AUTH.sb) throw new Error("Die Online-Datenbank ist nicht erreichbar.");
          const meta={vorname:vor, nachname:nach, avatar:"fuchs", stufe:3, kanton:kt, best:{}, tests:0, erstellt:new Date().toISOString(), rolle:"lehrperson"};
          const {data, error}=await AUTH.sb.auth.signUp({email:mail, password:pw, options:{data:meta, emailRedirectTo:location.origin+location.pathname}});
          if(error) throw new Error(/registered|exists/i.test(error.message)?"Mit dieser E-Mail gibt es schon ein Konto. Bitte melde dich an.":"Registrierung hat nicht geklappt: "+error.message);
          lsSet("ep-letztemail", mail);
          if(data?.session?.user){ AUTH.user=data.session.user; kontoSupabase(); await ST.sp.rolleSetzen(); if(ST.sp.istLehrer()){ appStart(); melde("Willkommen im Lehrerbereich!"); } else zeigeRolle(); }
          else { zeigeLogin("anmelden", mail); $("#lFehler").textContent="Fast fertig: Bitte bestätige deine E-Mail-Adresse (Link im Mail) und melde dich dann an."; }
          return;
        }
        const konten=lokaleKonten(); if(konten[mail]) throw new Error("Mit dieser E-Mail gibt es auf diesem Gerät schon ein Konto. Bitte melde dich an.");
        const profil={name:`${vor} ${nach.charAt(0).toUpperCase()}.`, vorname:vor, nachname:nach, email:mail, avatar:"fuchs", stufe:3, kanton:kt, best:{}, tests:0, erstellt:new Date().toISOString()};
        const salt=neuesSalz(); konten[mail]={salt, hash:await pwHashNeu(pw,salt), profil}; lsSet("ep-konten", konten);
        const r=lsGet(LS_ROLLE,{}); r["m:"+mail]=true; lsSet(LS_ROLLE, r);
        lsSet("ep-profil", profil); lsSet("ep-abgemeldet", false); lsSet("ep-letztemail", mail);
        kontoLokal(profil); appStart(); melde("Konto erstellt. Willkommen im Lehrerbereich!");
      }catch(x){ err(x.message); b.disabled=false; b.textContent="Konto erstellen"; }
    };
  } else {
    $("#anmForm").onsubmit=async e=>{ e.preventDefault();
      const mail=$("#lMail").value.trim().toLowerCase(), pw=$("#lPw").value;
      if(mail===TEST_MAIL){ if(pw===TEST_PW) return testStarten(); return err("Das Passwort für den Testzugang stimmt nicht. Es lautet "+TEST_PW+"."); }
      if(!emailOk(mail)) return err("Bitte gib eine gültige E-Mail-Adresse ein.");
      if(!pw) return err("Bitte gib dein Passwort ein.");
      const b=$("#lGo"); b.disabled=true; err(""); b.textContent="Wird geprüft …";
      try{
        if(SUPA){
          if(!AUTH.sb) throw new Error("Die Online-Datenbank ist nicht erreichbar.");
          const {data, error}=await AUTH.sb.auth.signInWithPassword({email:mail, password:pw});
          if(error) throw new Error(/confirm/i.test(error.message)?"Bitte bestätige zuerst deine E-Mail-Adresse (Link im Bestätigungsmail).":"E-Mail oder Passwort stimmt nicht.");
          AUTH.user=data.user; lsSet("ep-letztemail", mail); kontoSupabase(); return weiterNachLogin();
        }
        const k=lokaleKonten()[mail];
        if(!(await pwPruefen(pw,k))) throw new Error("E-Mail oder Passwort stimmt nicht.");
        if(!String(k.hash).startsWith("p2:")){ try{ const alle=lokaleKonten(); k.salt=neuesSalz(); k.hash=await pwHashNeu(pw,k.salt); alle[mail]=k; lsSet("ep-konten",alle); }catch(x){} }
        const profil={...(k.profil||{}), email:mail}; lsSet("ep-profil", profil); lsSet("ep-abgemeldet", false); lsSet("ep-letztemail", mail);
        kontoLokal(profil); weiterNachLogin();
      }catch(x){ err(x.message); b.disabled=false; b.textContent="Anmelden"; }
    };
    ($("#lMail").value ? $("#lPw") : $("#lMail")).focus();
  }
}
function zeigeRolle(){
  $("#app").hidden=true; $("#login").hidden=false;
  if(ST.sp && ST.sp.beantragt && ST.sp.beantragt()){
    $("#loginKarte").innerHTML=`<h1>Dein Lehrerkonto wird geprüft</h1>
      <p class="mu">Danke! Angemeldet als <b>${h(ST.konto.email||ST.konto.name)}</b>. Sobald dein Konto freigegeben ist, kannst du Klassen anlegen und Tests verteilen.</p>
      <button type="button" class="k p knopfbreit" id="rollePruef">Nochmals prüfen</button>
      <button type="button" class="k knopfbreit" id="rolleNein">Mit einem anderen Konto anmelden</button>
      <p class="fehlertext klein" id="rolleErr" aria-live="polite"></p>`;
    $("#rollePruef").onclick=async()=>{ const b=$("#rollePruef"); b.disabled=true; await ST.sp.neuPruefen(); if(ST.sp.istLehrer()) appStart(); else { $("#rolleErr").textContent="Noch nicht freigegeben."; b.disabled=false; } };
    $("#rolleNein").onclick=async()=>{ try{ await AUTH.sb.auth.signOut(); }catch(e){} ST.konto=null; ST.sp=null; zeigeLogin("anmelden"); };
    return;
  }
  $("#loginKarte").innerHTML=`<h1>Bist du Lehrperson?</h1>
    <p class="mu">Angemeldet als <b>${h(ST.konto.email||ST.konto.name)}</b>. Im Lehrerbereich legst du Klassen an, erstellst Tests mit Code und siehst die Resultate mit Noten.</p>
    <button type="button" class="k p knopfbreit" id="rolleJa">Ja, ich bin Lehrperson</button>
    <button type="button" class="k knopfbreit" id="rolleNein">Mit einem anderen Konto anmelden</button>
    <p class="fehlertext klein" id="rolleErr" aria-live="polite"></p>
    <p class="modus">Kinder brauchen kein Konto: Sie lösen Tests in easyplay nur mit Test-Code und PIN.</p>`;
  $("#rolleJa").onclick=async()=>{ const b=$("#rolleJa"); b.disabled=true; try{ await ST.sp.rolleSetzen(); if(ST.sp.istLehrer()) appStart(); else zeigeRolle(); }catch(e){ $("#rolleErr").textContent=fehlerText(e); b.disabled=false; } };
  $("#rolleNein").onclick=async()=>{ if(ST.konto.art==="supabase"){ try{ await AUTH.sb.auth.signOut(); }catch(e){} } else if(ST.konto.art==="lokal"){ lsSet("ep-abgemeldet",true); } ST.konto=null; ST.sp=null; zeigeLogin("anmelden"); };
}

/* ================= 5. Rahmen: Kopfzeile, Navigation, Routen ================= */
const NAV = [
  ["Überblick", [["uebersicht","Übersicht"],["auswertung","Auswertung"]]],
  ["Klassen", [["klassen","Klassen"],["kinder","Kinder"]]],
  ["Tests", [["tests","Tests"],["lehrplan","Lehrplan 21"],["neu","Neuer Test"],["korrigieren","Korrigieren"],["fragen","Fragenpool"]]],
  ["Mitmachen", [["liga","Klassen-Liga"],["meldungen","Fehlermeldungen"]]],
  ["Konto", [["einstellungen","Einstellungen"]]]
];
const NAV_ELTERN = {klasse:"klassen", kind:"kinder", test:"tests"};
const TITEL = {uebersicht:"Übersicht", auswertung:"Auswertung", klassen:"Klassen", klasse:"Klasse", kinder:"Kinder", kind:"Kind", tests:"Tests", test:"Test", neu:"Neuer Test", lehrplan:"Lehrplan 21", korrigieren:"Korrigieren", fragen:"Fragenpool", liga:"Klassen-Liga", meldungen:"Fehlermeldungen", einstellungen:"Einstellungen"};

function appStart(){
  $("#login").hidden=true; $("#app").hidden=false; ST.daten=null;
  kopfZeichnen(); navZeichnen();
  const kh=()=>{ const k=$("#kopf"); if(k) document.documentElement.style.setProperty("--kopfh", k.offsetHeight+"px"); }; kh(); addEventListener("resize", kh);
  route();
}
function kopfZeichnen(){
  const k=ST.konto, test=k.art==="test";
  $("#testPill").hidden=!test;
  const sp = test ? "Testzugang, nur dieses Gerät" : k.art==="supabase" ? "Supabase" : "dieses Gerät";
  $("#status").innerHTML=`<span class="nurgross">Speicher: <b>${h(sp)}</b></span><span class="nurgross">Angemeldet: <b>${h(k.name||k.email)}</b></span><a class="k nurgross" href="../">Zu easyplay</a><button type="button" class="k" id="stAus">Abmelden</button>`;
  $("#stAus").onclick=abmelden;
  $("#zurStart").onclick=()=>zeige("uebersicht");
  const band=$("#testband"); band.hidden=!test;
  if(test) band.innerHTML=`<span><b>Testzugang:</b> Beispieldaten, Daten nur auf diesem Gerät. Echte Konten bleiben getrennt.</span><span class="rechts"><button type="button" class="k klein" id="tbReset">Testdaten zurücksetzen</button><button type="button" class="k klein" id="tbEnde">Testzugang beenden</button></span>`;
  if(test){ $("#tbReset").onclick=testZuruecksetzen; $("#tbEnde").onclick=abmelden; }
}
function offeneKorrekturen(){ return (ST.daten?.abgaben||[]).filter(a=>a.offen>0).length; }
function meldungenListe(){ const l=lsGet(ST.konto?.art==="test"?LT_MELD:LS_MELD,[]); return Array.isArray(l)?l:[]; }
function navZeichnen(){
  const akt=NAV_ELTERN[ST.tab]||ST.tab, D=ST.daten;
  const zusatz={klassen:D?D.klassen.length:"", tests:D?D.tests.length:"", korrigieren:offeneKorrekturen()||"", meldungen:meldungenListe().filter(m=>!m.gesendet).length||""};
  const pill=id=> (id==="korrigieren"||id==="meldungen") && zusatz[id] ? `<span class="zahlpill">${zusatz[id]}</span>` : (zusatz[id]!=="" && zusatz[id]!=null ? `<small>${zusatz[id]}</small>` : "");
  $("#tabs").innerHTML=NAV.map(([gr,l])=>`<div class="gr">${h(gr)}</div>${l.map(([id,n])=>`<button type="button" data-t="${id}" class="${id===akt?"an":""}" ${id===akt?'aria-current="page"':""}><span>${h(n)}</span>${pill(id)}</button>`).join("")}`).join("")
    +`<div class="fusskinder" aria-hidden="true"><img src="../img/kinder.webp" alt="" width="760" height="507" loading="lazy"></div>`;
  $$("#tabs [data-t]").forEach(b=>b.onclick=()=>{ if(b.dataset.t==="neu" && ST.tab!=="neu" && ST.neu && !ST.neu.sel.length) ST.neu=null; zeige(b.dataset.t); });
  const an=$("#tabs .an"); if(an && innerWidth<=800){ const n=$("#tabs"); const l=an.offsetLeft-16; if(l<n.scrollLeft || an.offsetLeft+an.offsetWidth>n.scrollLeft+n.clientWidth) n.scrollLeft=Math.max(0,l); }
}
function zeige(tab, param){
  const neu="#"+tab+(param?"/"+encodeURIComponent(param):"");
  if(location.hash===neu) route(); else location.hash=neu;
}
function route(){
  if(!ST.konto) return;
  const m=String(location.hash||"").replace(/^#/,"").split("/");
  const tab=TITEL[m[0]] ? m[0] : "uebersicht";
  const wechsel = tab!==ST.tab || decodeURIComponent(m[1]||"")!==ST.param;
  ST.tab=tab; ST.param=decodeURIComponent(m[1]||"");
  zeichne();
  if(wechsel){ scrollTo(0,0); try{ $("#inhalt").focus({preventScroll:true}); }catch(e){} }
}
addEventListener("hashchange", route);
async function ladeDaten(){
  if(ST.laedt) return; ST.laedt=true; ST.fehler="";
  try{ const sp=ST.sp; const [k,t]=await Promise.all([sp.klassen(), sp.tests()]); const a=await sp.abgaben();
    ST.daten={klassen:k, tests:t, abgaben:abgabenEindeutig(abgabenPruefen(a, t))}; }
  catch(e){ console.warn("Lehrerbereich", e); ST.fehler=fehlerText(e); ST.daten=null; }
  finally{ ST.laedt=false; }
}
async function neuLaden(){ ST.daten=null; await zeichne(); }
async function zeichne(){
  const el=$("#inhalt"); if(!el || !ST.konto) return;
  document.title=`${TITEL[ST.tab]||"Lehrerbereich"} · easyplay Lehrerbereich`;
  if(!ST.daten){
    el.innerHTML=laden("Deine Klassen und Tests werden geladen …");
    await ladeDaten();
    if(!ST.daten){ el.innerHTML=`<div class="hinweis"><b>Daten nicht erreichbar.</b><p>${h(ST.fehler)}</p></div><button type="button" class="k p" id="nochmal">Nochmals versuchen</button>`; $("#nochmal").onclick=neuLaden; return; }
  }
  navZeichnen();
  try{ (SEITEN[ST.tab]||SEITEN.uebersicht)(el); }
  catch(e){ console.error("Lehrerbereich", e); el.innerHTML=`<div class="hinweis"><b>Hoppla, hier ist etwas schiefgelaufen.</b><p>${h(e.message||e)}</p></div>`; }
}
// Neu zeichnen und Scroll-Position behalten
function neu(fn){ if(fn) fn(); const y=scrollY; zeichne(); scrollTo(0,y); }

/* ---------- gemeinsame Bausteine ---------- */
const klasseVon = id => ST.daten?.klassen.find(k=>k.id===id) || null;
const testsVon = kid => (ST.daten?.tests||[]).filter(t=>t.klasseId===kid);
const abgabenVon = code => (ST.daten?.abgaben||[]).filter(a=>a.code===code);
const sjOptionen = sel => SCHULJAHRE.map(s=>`<option value="${s.id}" ${s.id===sel?"selected":""}>${h(s.name)}${s.harmos?` · HarmoS ${s.harmos}`:""}</option>`).join("");
const zyOptionen = sel => [1,2,3].map(z=>`<option value="${z}" ${+sel===z?"selected":""}>Zyklus ${z}</option>`).join("");
const brot = pfad => `<nav class="brot" aria-label="Pfad">${pfad.map(([n,t,p],i)=>i<pfad.length-1?`<button type="button" data-brot="${h(t)}" data-brotp="${h(p||"")}">${h(n)}</button><span aria-hidden="true">›</span>`:`<span aria-current="page">${h(n)}</span>`).join("")}</nav>`;
function brotBinden(el){ $$("[data-brot]", el).forEach(b=>b.onclick=()=>zeige(b.dataset.brot, b.dataset.brotp)); }
const kacheln = l => `<div class="raster">${l.map(([n,w,u,st,ziel])=>`<div class="zahl ${st||""}"${ziel?` data-ziel="${h(ziel)}" role="button" tabindex="0"`:""}><span>${h(n)}</span><b>${w}</b>${u?`<small>${u}</small>`:"<small>&nbsp;</small>"}</div>`).join("")}</div>`;
function zielBinden(el){ $$("[data-ziel]", el).forEach(z=>{ const los=()=>{ const [t,p]=z.dataset.ziel.split("/"); zeige(t,p); }; z.onclick=los; z.onkeydown=e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); los(); } }; }); }
const leer = (text, knopf) => `<div class="leerbild"><img src="../img/fragezeichen.webp" alt="" width="64" height="60"><div><p>${text}</p>${knopf||""}</div></div>`;
const noteZelle = (a) => a ? (a.offen ? `<span class="note vorl" title="vorläufig, offene Fragen noch nicht korrigiert">(${fmtNote(a.note)})</span>` : `<span class="note ${noteKlasse(a.note)}">${fmtNote(a.note)}</span>`) : `<span class="mu">·</span>`;
function hinweisSpeicher(){
  const k=ST.konto;
  if(k.art==="test") return `<div class="hinweis ak"><b>Testzugang mit Beispieldaten.</b><p>${brueckeAktiv() ? `Probier es aus: Öffne einen Test, tippe auf «Als Kind lösen» und gib einen PIN aus der Klasse ein. Das Resultat erscheint danach hier (gleiches Gerät, gleicher Browser).` : `Weil easyplay mit der Online-Datenbank verbunden ist, können Kinder Tests aus dem Testzugang in der Hauptseite nicht lösen. Der Testzugang zeigt nur, wie der Lehrerbereich funktioniert.`}</p></div>`;
  if(k.art==="lokal") return `<div class="hinweis"><b>Gespeichert auf diesem Gerät.</b><p>Klassen, Tests und Resultate bleiben in diesem Browser. Das passt, wenn die Kinder am selben Gerät lösen (z. B. Tablet im Schulzimmer). Für mehrere Geräte braucht es Supabase, siehe ANLEITUNG-LEHRER.md.</p></div>`;
  return "";
}
const datenschutz = () => `<div class="hinweis gruen"><b>Datenschutz:</b> Erfasse nur Vornamen oder Kürzel (z. B. «Lena» oder «LM»), keine Nachnamen, Geburtsdaten, E-Mail-Adressen oder Fotos. Kinder melden sich nur mit Test-Code und PIN an. Lösche Klassen am Ende des Schuljahres.</div>`;
const kindLink = code => new URL("../", location.href).href + "#test=" + encodeURIComponent(code);
function kinderPruefen(roh){
  const namen=roh.split(/[\n,;]+/).map(x=>x.replace(/\s+/g," ").trim()).filter(Boolean);
  if(!namen.length) return {fehler:"Bitte mindestens einen Vornamen oder ein Kürzel eingeben."};
  const falsch=namen.filter(n=>n.split(" ").length>2 || /@|\d{3,}/.test(n) || n.length>30);
  if(falsch.length) return {fehler:`Bitte nur Vorname oder Kürzel (höchstens zwei Wörter, ohne E-Mail): ${falsch.slice(0,3).join(", ")}`};
  return {namen};
}
async function kinderHinzufuegen(k, namen){
  const kids=k.schueler||[]; if(kids.length+namen.length>60) throw new Error("Höchstens 60 Kinder pro Klasse.");
  const pins=kids.map(s=>s.pin); const neue=namen.map(n=>{ const p=neuerPin(pins); pins.push(p); return {id:neueId(), name:n, pin:p}; });
  const neuK={...k, schueler:[...kids, ...neue]}; await ST.sp.klasseSpeichern(neuK, ST.daten.tests); Object.assign(k, neuK); return neue.length;
}
function fehlerListe(liste, max, proKind){
  const l=liste.filter(x=>x.falsch>0).slice(0,max||15);
  if(!l.length) return `<p class="mu">${proKind?"Keine falschen Antworten. Super!":"Noch keine falschen Antworten. Sobald Resultate da sind, erscheint hier die Fehleranalyse."}</p>`;
  return `<ol class="fehlerliste">${l.map(x=>{ const f=x.f, p=Math.round(x.quote*100);
    return `<li><b class="fq">${h(f.q)}</b><small class="mu">${f.nr?`Nr. ${f.nr} · `:""}${h(themaName(f.t))} · ${h([...x.tests].join(", "))}</small>
      ${proKind?"":`<div class="quote"><span class="mini"><i style="width:${p}%"></i></span><b>${p} %</b><span class="mu">${x.falsch} von ${x.n} falsch</span></div>`}
      <div class="zeile">${proKind?`<span class="fe">Antwort: «${h(x.dein||"")}»</span>`:x.top?`<span class="fe">Häufigste falsche Antwort: «${h(x.top.text)}» (${x.top.n}×)</span>`:""}<span class="ok">Richtig: «${h(f.o[f.r])}»</span></div></li>`; }).join("")}</ol>`;
}
function themenBalken(l){
  if(!l.length) return `<p class="mu">Noch keine Resultate.</p>`;
  return l.slice(0,8).map(x=>{ const p=Math.round(x.quote*100); return `<div class="balkenzeile" title="${x.falsch} von ${x.n} Antworten falsch"><span>${h(themaName(x.t))}</span><span class="mini"><i style="width:${p}%"></i></span><span class="r">${p} %</span></div>`; }).join("");
}

/* ================= 6. Seiten ================= */
const SEITEN = {};

/* ---------- Übersicht ---------- */
SEITEN.uebersicht = el => {
  const D=ST.daten, k=ST.konto;
  const kinder=D.klassen.reduce((s,x)=>s+(x.schueler||[]).length,0);
  const offen=offeneKorrekturen();
  const W=ligaWochen(); const dieseWoche=D.abgaben.filter(a=>isoWoche(new Date(a.datum)).key===W.jetzt.key).length;
  const fertige=D.abgaben.filter(a=>!a.offen); const sn=schnitt(fertige.map(a=>a.note)); const gen=fertige.length?Math.round(fertige.filter(a=>a.note>=4).length/fertige.length*100):null;
  const std=new Date().getHours(), gruss=std<11?"Guten Morgen":std<17?"Hallo":"Guten Abend";
  const vn=k.vorname || (k.art==="test"?"":String(k.name||"").split(" ")[0]);
  const tests=[...D.tests].slice(0,6);
  const letzte=[...D.abgaben].sort((a,b)=>String(b.datum).localeCompare(String(a.datum))).slice(0,8);
  el.innerHTML=`<div class="held"><div class="text"><h2>${gruss}${vn?", "+h(vn):""}!</h2>
      <p>${D.klassen.length?`${D.klassen.length} ${D.klassen.length===1?"Klasse":"Klassen"} mit ${kinder} Kindern und ${D.tests.length} ${D.tests.length===1?"Test":"Tests"}. ${offen?`${offen} ${offen===1?"Abgabe wartet":"Abgaben warten"} auf deine Korrektur.`:"Alle offenen Fragen sind korrigiert."}`:"Lege deine erste Klasse an, trage die Kinder ein und verteile einen Test mit Code."}</p>
      <div class="chips"><button type="button" data-ziel="neu">Neuer Test</button><button type="button" data-ziel="klassen">Klasse anlegen</button>${offen?`<button type="button" data-ziel="korrigieren">Korrigieren (${offen})</button>`:""}<span>${datumZeit(new Date())}</span></div></div>
      <img src="../img/kinder.webp" alt="" width="760" height="507"></div>
    ${hinweisSpeicher()}
    <div class="abschnitt"><h3>Kennzahlen</h3>${kacheln([
      ["Klassen", zahl(D.klassen.length), `${zahl(kinder)} Kinder`, "ak", "klassen"],
      ["Tests", zahl(D.tests.length), `${D.tests.filter(t=>t.aktiv!==false).length} offen`, "ak", "tests"],
      ["Abgaben", zahl(D.abgaben.length), `${dieseWoche} diese Woche`, "", "auswertung"],
      ["Ø Note", fmtNote(sn), "korrigierte Abgaben", sn==null?"":sn>=4.5?"ok":sn>=4?"wa":"fe", "auswertung"],
      ["Genügend", gen==null?"·":gen+" %", "Note 4 oder besser", gen==null?"":gen>=80?"ok":gen>=60?"wa":"fe", "auswertung"],
      ["Zu korrigieren", zahl(offen), "offene Fragen", offen?"wa":"ok", "korrigieren"]
    ])}</div>
    <div class="spalten">
      <div class="box"><h2>Neueste Tests</h2>${tests.length?`<div class="tabwrap"><table><thead><tr><th>Test</th><th>Klasse</th><th>Code</th><th class="r">Abgaben</th><th class="r">Ø Note</th></tr></thead><tbody>
        ${tests.map(t=>{ const kl=klasseVon(t.klasseId), ab=abgabenVon(t.code), s=schnitt(ab.filter(a=>!a.offen).map(a=>a.note));
          return `<tr class="klick" data-ziel="test/${h(t.code)}"><td><b>${h(t.titel)}</b>${t.aktiv===false?` <span class="marke">geschlossen</span>`:""}</td><td>${h(kl?.name||"")}</td><td class="code">${h(t.code)}</td><td class="r">${ab.length}/${(kl?.schueler||[]).length}</td><td class="r"><span class="note ${noteKlasse(s)}">${fmtNote(s)}</span></td></tr>`; }).join("")}</tbody></table></div>`
        : leer("Noch keine Tests.", D.klassen.length?`<button type="button" class="k p" data-ziel="neu">Ersten Test erstellen</button>`:"")}</div>
      <div class="box"><h2>Letzte Abgaben</h2>${letzte.length?`<div class="tabwrap"><table><thead><tr><th>Kind</th><th>Test</th><th class="r">Note</th><th>Abgabe</th></tr></thead><tbody>
        ${letzte.map(a=>{ const t=D.tests.find(x=>x.code===a.code); return `<tr class="klick" data-ziel="test/${h(a.code)}"><td>${h(a.name)}</td><td>${h(t?.titel||"")}</td><td class="r">${noteZelle(a)}</td><td class="nowrap">${datumZeit(a.datum)}</td></tr>`; }).join("")}</tbody></table></div>`
        : leer("Noch keine Abgaben. Sobald Kinder einen Test mit Code lösen, erscheinen sie hier.")}</div>
    </div>
    ${D.klassen.length?"":`<div class="box">${leer("Du hast noch keine Klasse.", `<button type="button" class="k p" data-ziel="klassen">Erste Klasse anlegen</button>`)}</div>`}
    ${datenschutz()}`;
  zielBinden(el);
};

/* ---------- Klassen ---------- */
SEITEN.klassen = el => {
  const D=ST.daten;
  el.innerHTML=`<div class="kopfzeile"><div><h1>Klassen</h1><p>Klassen mit Kindern und PINs. Jedes Kind löst Tests mit dem Test-Code und seinem PIN.</p></div></div>
    ${D.klassen.length?`<div class="tabwrap abschnitt"><table><thead><tr><th>Klasse</th><th>Schuljahr</th><th>Zyklus</th><th class="r">Kinder</th><th class="r">Tests</th><th class="r">Ø Note</th></tr></thead><tbody>
      ${D.klassen.map(k=>{ const ts=testsVon(k.id), codes=new Set(ts.map(t=>t.code)); const s=schnitt(D.abgaben.filter(a=>codes.has(a.code) && !a.offen).map(a=>a.note));
        return `<tr class="klick" data-ziel="klasse/${h(k.id)}"><td><b>${h(k.name)}</b></td><td>${h(sjName(k.schuljahr))}</td><td>${h(k.zyklus||"")}</td><td class="r">${(k.schueler||[]).length}</td><td class="r">${ts.length}</td><td class="r"><span class="note ${noteKlasse(s)}">${fmtNote(s)}</span></td></tr>`; }).join("")}
    </tbody></table></div>`:`<div class="box">${leer("Noch keine Klasse. Lege unten deine erste Klasse an.")}</div>`}
    <div class="box"><h2>Neue Klasse anlegen</h2>
      <div class="formular">
        <label for="kName">Name der Klasse</label><input id="kName" maxlength="60" placeholder="z. B. 4b Schulhaus Lindenhof">
        <label for="kSj">Schuljahr</label><select id="kSj">${sjOptionen("h6")}</select>
        <label for="kZy">Zyklus</label><select id="kZy">${zyOptionen(2)}</select>
        <label for="kKids">Kinder (optional)</label><div><textarea id="kKids" rows="4" placeholder="Ein Vorname oder Kürzel pro Zeile&#10;Lena&#10;Noah&#10;Mia S."></textarea><span class="mu klein">Jedes Kind bekommt automatisch einen 6-stelligen PIN.</span></div>
      </div>
      <p class="fehlertext" id="kErr" aria-live="polite"></p>
      <button type="button" class="k p" id="kNeu">Klasse anlegen</button>
    </div>
    ${datenschutz()}`;
  zielBinden(el);
  $("#kSj").onchange=e=>{ const s=sjObj(e.target.value); if(s) $("#kZy").value=String(s.zyklus); };
  $("#kNeu").onclick=async()=>{
    const err=$("#kErr"); const name=$("#kName").value.trim().replace(/\s+/g," ").slice(0,60); if(!name){ err.textContent="Bitte gib der Klasse einen Namen."; $("#kName").focus(); return; }
    let namen=[]; if($("#kKids").value.trim()){ const r=kinderPruefen($("#kKids").value); if(r.fehler){ err.textContent=r.fehler; return; } namen=r.namen; if(namen.length>60){ err.textContent="Höchstens 60 Kinder pro Klasse."; return; } }
    const pins=[]; const k={id:neueId(), name, schuljahr:$("#kSj").value, zyklus:+$("#kZy").value, schueler:namen.map(n=>{ const p=neuerPin(pins); pins.push(p); return {id:neueId(), name:n, pin:p}; }), erstellt:new Date().toISOString()};
    const b=$("#kNeu"); b.disabled=true;
    try{ await ST.sp.klasseSpeichern(k, []); ST.daten.klassen.push(k); melde(`Klasse «${name}» angelegt.`); zeige("klasse", k.id); }
    catch(e){ err.textContent=fehlerText(e); b.disabled=false; }
  };
};

SEITEN.klasse = el => {
  const D=ST.daten, k=klasseVon(ST.param); if(!k){ el.innerHTML=leer("Diese Klasse gibt es nicht mehr.", `<button type="button" class="k" data-ziel="klassen">Zu den Klassen</button>`); zielBinden(el); return; }
  const ts=testsVon(k.id), codes=new Set(ts.map(t=>t.code)), ab=D.abgaben.filter(a=>codes.has(a.code)), kids=k.schueler||[];
  const tsort=[...ts].sort((a,b)=>String(a.erstellt).localeCompare(String(b.erstellt)));
  el.innerHTML=`${brot([["Klassen","klassen"],[k.name]])}
    <div class="kopfzeile"><div><h1>${h(k.name)}</h1><p>${h(sjName(k.schuljahr))} · Zyklus ${h(k.zyklus||"")} · ${kids.length} ${kids.length===1?"Kind":"Kinder"} · ${ts.length} ${ts.length===1?"Test":"Tests"}</p></div>
      <div class="leiste"><button type="button" class="k p" id="kTest">Test für diese Klasse</button>${kids.length?`<button type="button" class="k" id="kPdf">PIN-Kärtchen (PDF)</button>`:""}</div></div>
    <div class="spalten">
      <div class="box"><h2>Kinder und PINs</h2>
        ${kids.length?`<ul class="kinderliste">${kids.map(s=>`<li><button type="button" class="link" data-ziel="kind/${h(s.id)}">${h(s.name)}</button><span class="pin" aria-label="PIN ${h(s.pin)}">${h(s.pin)}</span><button type="button" class="k klein" data-pinneu="${h(s.id)}" title="Neuen PIN erzeugen" aria-label="Neuen PIN für ${h(s.name)}">PIN neu</button><button type="button" class="k klein g" data-weg="${h(s.id)}" aria-label="${h(s.name)} entfernen">Entfernen</button></li>`).join("")}</ul>`:`<p class="mu">Noch keine Kinder in dieser Klasse.</p>`}
        <label for="kdNeu" class="mu klein">Kinder hinzufügen (nur Vorname oder Kürzel, eines pro Zeile)</label>
        <textarea id="kdNeu" rows="3" placeholder="Lena&#10;Noah&#10;Mia S."></textarea>
        <p class="fehlertext" id="kdErr" aria-live="polite"></p>
        <button type="button" class="k p" id="kdAdd">Hinzufügen</button>
      </div>
      <div class="box"><h2>Klasse bearbeiten</h2>
        <div class="formular"><label for="eName">Name</label><input id="eName" maxlength="60" value="${h(k.name)}">
          <label for="eSj">Schuljahr</label><select id="eSj">${sjOptionen(k.schuljahr)}</select>
          <label for="eZy">Zyklus</label><select id="eZy">${zyOptionen(k.zyklus)}</select></div>
        <p class="fehlertext" id="eErr" aria-live="polite"></p>
        <div class="leiste"><button type="button" class="k p" id="eSave">Speichern</button><button type="button" class="k g rechts" id="kDel">Klasse löschen</button></div>
        <h3>Klassen-Liga</h3><div id="kLiga">${ligaKlasseText(k)}</div>
      </div>
    </div>
    <div class="box"><h2>Noten: Kinder × Tests</h2>
      ${kids.length && ts.length ? `<div class="tabwrap"><table><thead><tr><th>Kind</th>${tsort.map(t=>`<th class="c" title="${h(t.titel)}"><button type="button" class="link" data-ziel="test/${h(t.code)}">${h(t.titel.length>16?t.titel.slice(0,15)+"…":t.titel)}</button><br><span class="mu klein">${datum(t.erstellt)}</span></th>`).join("")}<th class="c">Ø</th></tr></thead><tbody>
        ${kids.map(s=>{ const ns=ab.filter(a=>a.sid===s.id && !a.offen).map(a=>a.note); const sn=schnitt(ns);
          return `<tr><th><button type="button" class="link" data-ziel="kind/${h(s.id)}">${h(s.name)}</button></th>${tsort.map(t=>`<td class="c">${noteZelle(ab.find(a=>a.code===t.code && a.sid===s.id))}</td>`).join("")}<td class="c"><span class="note ${noteKlasse(sn)}">${fmtNote(sn)}</span></td></tr>`; }).join("")}
        <tr class="summe"><th>Ø Klasse</th>${tsort.map(t=>{ const s=schnitt(abgabenVon(t.code).filter(a=>!a.offen).map(a=>a.note)); return `<td class="c"><span class="note ${noteKlasse(s)}">${fmtNote(s)}</span></td>`; }).join("")}<td></td></tr></tbody></table></div>`
        : `<p class="mu">Noch keine Tests oder Kinder in dieser Klasse.</p>`}
    </div>
    <div class="spalten">
      <div class="box"><h2>Lernfortschritt</h2><p class="mu klein">Durchschnittsnote pro Woche über alle Tests dieser Klasse.</p>${verlaufSVG([{name:"Ø "+k.name, farbe:FARBEN[0], punkte:wochenSchnitt(ab)}], "Notenverlauf der Klasse")}</div>
      <div class="box"><h2>Themen mit den meisten Fehlern</h2>${themenBalken(themenQuote(ts, ab))}</div>
    </div>
    <div class="box"><h2>Fehleranalyse der Klasse</h2><p class="mu klein">Fragen aus allen Tests dieser Klasse, die am häufigsten falsch beantwortet wurden.</p>${fehlerListe(fehlerAnalyse(ts, ab), 12)}</div>
    ${datenschutz()}`;
  brotBinden(el); zielBinden(el);
  const speichern=async(neuK, text)=>{ try{ await ST.sp.klasseSpeichern(neuK, ST.daten.tests); Object.assign(k, neuK); melde(text||"Gespeichert."); neu(); }catch(e){ melde(fehlerText(e),"fe"); } };
  $("#eSj").onchange=e=>{ const s=sjObj(e.target.value); if(s) $("#eZy").value=String(s.zyklus); };
  $("#kdAdd").onclick=async()=>{ const r=kinderPruefen($("#kdNeu").value); if(r.fehler){ $("#kdErr").textContent=r.fehler; return; }
    try{ const n=await kinderHinzufuegen(k, r.namen); melde(`${n} ${n===1?"Kind":"Kinder"} hinzugefügt.`); neu(); }catch(e){ $("#kdErr").textContent=e.message.startsWith("Höchstens")?e.message:fehlerText(e); } };
  $$("[data-pinneu]", el).forEach(b=>b.onclick=async()=>{ const s=kids.find(x=>x.id===b.dataset.pinneu); if(!s || !await bestaetige("Neuer PIN?", `Neuen PIN für ${s.name} erzeugen? Der alte PIN gilt dann nicht mehr.`, "Neuer PIN")) return;
    const p=neuerPin(kids.map(x=>x.pin)); speichern({...k, schueler:kids.map(x=>x.id===s.id?{...x, pin:p}:x)}, `Neuer PIN für ${s.name}: ${p}`); });
  $$("[data-weg]", el).forEach(b=>b.onclick=async()=>{ const s=kids.find(x=>x.id===b.dataset.weg); if(!s || !await bestaetige("Kind entfernen?", `${s.name} aus der Klasse entfernen? Die Resultate dieses Kindes werden gelöscht.`, "Entfernen", true)) return;
    ST.daten.abgaben=ST.daten.abgaben.filter(a=>!(a.sid===s.id && codes.has(a.code))); speichern({...k, schueler:kids.filter(x=>x.id!==s.id)}, `${s.name} entfernt.`); });
  $("#eSave").onclick=()=>{ const name=$("#eName").value.trim().replace(/\s+/g," ").slice(0,60); if(!name){ $("#eErr").textContent="Der Name darf nicht leer sein."; return; }
    speichern({...k, name, schuljahr:$("#eSj").value, zyklus:+$("#eZy").value}); };
  $("#kTest").onclick=()=>{ ST.neu=null; neuStart(k.id); zeige("neu"); };
  $("#kPdf") && ($("#kPdf").onclick=async()=>{ const b=$("#kPdf"); b.disabled=true; try{ const d=await pdfPins(k); pdfSpeichern(d, `PIN-Kaertchen-${slug(k.name)}.pdf`); melde("PDF erstellt."); }catch(e){ melde(e.message,"fe"); } b.disabled=false; });
  $("#kDel").onclick=async()=>{ if(!await bestaetige("Klasse löschen?", `Klasse «${k.name}» mit allen Tests und Resultaten löschen? Das kann nicht rückgängig gemacht werden.`, "Endgültig löschen", true)) return;
    try{ await ST.sp.klasseLoeschen(k.id, ST.daten.tests); melde("Klasse gelöscht."); ST.daten=null; zeige("klassen"); }catch(e){ melde(fehlerText(e),"fe"); } };
  ligaKlasseNachladen(k);
};

/* ---------- Kinder ---------- */
SEITEN.kinder = el => {
  const D=ST.daten, F=ST.ki; const zeilen=[];
  D.klassen.filter(k=>!F.klasse || k.id===F.klasse).forEach(k=>{ const ts=testsVon(k.id), codes=new Set(ts.map(t=>t.code));
    (k.schueler||[]).filter(s=>!F.q || s.name.toLowerCase().includes(F.q.toLowerCase())).forEach(s=>{
      const ab=D.abgaben.filter(a=>a.sid===s.id && codes.has(a.code)).sort((a,b)=>String(a.datum).localeCompare(String(b.datum)));
      const fertig=ab.filter(a=>!a.offen); const sn=schnitt(fertig.map(a=>a.note)), letzte=fertig.length?fertig[fertig.length-1].note:null, vor=fertig.length>1?fertig[fertig.length-2].note:null;
      const th=themenQuote(ts, ab).filter(x=>x.falsch>0)[0];
      zeilen.push({k, s, ab, ts, sn, letzte, trend: letzte!=null && vor!=null ? Math.sign(letzte-vor) : 0, th, offen:ab.filter(a=>a.offen).length}); }); });
  el.innerHTML=`<div class="kopfzeile"><div><h1>Kinder</h1><p>Alle Kinder deiner Klassen mit Durchschnitt, letzter Note und dem Thema mit den meisten Fehlern.</p></div></div>
    <div class="leiste"><select id="kiK" aria-label="Klasse"><option value="">Alle Klassen</option>${D.klassen.map(k=>`<option value="${h(k.id)}" ${k.id===F.klasse?"selected":""}>${h(k.name)}</option>`).join("")}</select>
      <input id="kiQ" type="search" placeholder="Name suchen" aria-label="Name suchen" value="${h(F.q)}"><span class="mu">${zeilen.length} ${zeilen.length===1?"Kind":"Kinder"}</span></div>
    ${zeilen.length?`<div class="tabwrap abschnitt"><table><thead><tr><th>Name</th><th>Klasse</th><th>PIN</th><th class="r">Tests</th><th class="r">Ø Note</th><th class="r">Letzte</th><th>Trend</th><th>Meiste Fehler</th></tr></thead><tbody>
      ${zeilen.map(z=>`<tr class="klick" data-ziel="kind/${h(z.s.id)}"><th>${h(z.s.name)}</th><td>${h(z.k.name)}</td><td class="pin">${h(z.s.pin)}</td><td class="r">${z.ab.length}/${z.ts.length}${z.offen?` <span class="marke wa" title="offene Fragen noch nicht korrigiert">${z.offen} offen</span>`:""}</td>
        <td class="r"><span class="note ${noteKlasse(z.sn)}">${fmtNote(z.sn)}</span></td><td class="r"><span class="note ${noteKlasse(z.letzte)}">${fmtNote(z.letzte)}</span></td>
        <td>${z.trend>0?`<span class="ok">▲ besser</span>`:z.trend<0?`<span class="fe">▼ tiefer</span>`:`<span class="mu">·</span>`}</td>
        <td>${z.th?`${h(themaName(z.th.t))} <span class="mu">(${Math.round(z.th.quote*100)} %)</span>`:`<span class="mu">·</span>`}</td></tr>`).join("")}
    </tbody></table></div>`:`<div class="box">${leer(D.klassen.length?"Keine Kinder gefunden.":"Noch keine Klasse. Lege zuerst eine Klasse an.", D.klassen.length?"":`<button type="button" class="k p" data-ziel="klassen">Klasse anlegen</button>`)}</div>`}
    ${D.klassen.length?`<div class="box"><h2>Kinder erfassen</h2><div class="formular">
      <label for="kiNK">Klasse</label><select id="kiNK">${D.klassen.map(k=>`<option value="${h(k.id)}" ${k.id===(F.klasse||D.klassen[0].id)?"selected":""}>${h(k.name)}</option>`).join("")}</select>
      <label for="kiN">Vornamen oder Kürzel</label><textarea id="kiN" rows="4" placeholder="Eines pro Zeile&#10;Lena&#10;Noah"></textarea></div>
      <p class="fehlertext" id="kiErr" aria-live="polite"></p><button type="button" class="k p" id="kiAdd">Hinzufügen</button>
      <p class="mu klein">Jedes Kind bekommt automatisch einen 6-stelligen PIN. PIN-Kärtchen zum Ausdrucken gibt es auf der Seite der Klasse.</p></div>`:""}
    ${datenschutz()}`;
  zielBinden(el);
  $("#kiK").onchange=e=>neu(()=>{ F.klasse=e.target.value; });
  const qi=$("#kiQ"); let tm; qi.oninput=()=>{ clearTimeout(tm); tm=setTimeout(()=>{ F.q=qi.value; neu(); const x=$("#kiQ"); if(x){ x.focus(); x.setSelectionRange(x.value.length,x.value.length); } },250); };
  $("#kiAdd") && ($("#kiAdd").onclick=async()=>{ const k=klasseVon($("#kiNK").value); if(!k) return; const r=kinderPruefen($("#kiN").value); if(r.fehler){ $("#kiErr").textContent=r.fehler; return; }
    try{ const n=await kinderHinzufuegen(k, r.namen); melde(`${n} ${n===1?"Kind":"Kinder"} in ${k.name} hinzugefügt.`); neu(); }catch(e){ $("#kiErr").textContent=e.message.startsWith("Höchstens")?e.message:fehlerText(e); } });
};

SEITEN.kind = el => {
  const D=ST.daten; const k=D.klassen.find(x=>(x.schueler||[]).some(s=>s.id===ST.param)); const s=k?.schueler.find(x=>x.id===ST.param);
  if(!k||!s){ el.innerHTML=leer("Dieses Kind gibt es nicht mehr.", `<button type="button" class="k" data-ziel="kinder">Zu den Kindern</button>`); zielBinden(el); return; }
  const ts=testsVon(k.id), codes=new Set(ts.map(t=>t.code)), abK=D.abgaben.filter(a=>a.sid===s.id && codes.has(a.code)), abAlle=D.abgaben.filter(a=>codes.has(a.code));
  const sn=schnitt(abK.filter(a=>!a.offen).map(a=>a.note)), sk=schnitt(abAlle.filter(a=>!a.offen).map(a=>a.note));
  el.innerHTML=`${brot([["Kinder","kinder"],[k.name,"klasse",k.id],[s.name]])}
    <div class="kopfzeile"><div><h1>${h(s.name)}</h1><p>${h(k.name)} · PIN <span class="pin">${h(s.pin)}</span></p></div></div>
    ${kacheln([["Gelöste Tests", `${abK.length}/${ts.length}`, "", "ak"],["Ø Note", fmtNote(sn), sk!=null?`Klasse ${fmtNote(sk)}`:"", sn==null?"":sn>=4.5?"ok":sn>=4?"wa":"fe"],["Offene Korrekturen", zahl(abK.filter(a=>a.offen).length), "", abK.some(a=>a.offen)?"wa":"ok", abK.some(a=>a.offen)?"korrigieren":""]])}
    <div class="box" style="margin-top:12px"><h2>Lernfortschritt</h2>${verlaufSVG([{name:s.name, farbe:FARBEN[0], punkte:wochenSchnitt(abK)},{name:"Ø Klasse", farbe:FARBEN[1], gestrichelt:true, punkte:wochenSchnitt(abAlle)}], "Notenverlauf von "+s.name)}</div>
    <div class="box"><h2>Tests</h2>${ts.length?`<div class="tabwrap"><table><thead><tr><th>Test</th><th class="r">Punkte</th><th class="r">Note</th><th>Zeit</th><th>Abgabe</th></tr></thead><tbody>
      ${[...ts].sort((a,b)=>String(a.erstellt).localeCompare(String(b.erstellt))).map(t=>{ const a=abK.find(x=>x.code===t.code);
        return `<tr class="klick" data-ziel="test/${h(t.code)}"><td><b>${h(t.titel)}</b></td>${a?`<td class="r">${zahl(a.punkte)}/${a.max}</td><td class="r">${noteZelle(a)}</td><td class="nowrap">${h(zeit(a.dauer))}</td><td class="nowrap">${datumZeit(a.datum)}</td>`:`<td colspan="4" class="mu">noch nicht abgegeben</td>`}</tr>`; }).join("")}
    </tbody></table></div>`:`<p class="mu">Noch keine Tests.</p>`}</div>
    <div class="spalten"><div class="box"><h2>Themen mit den meisten Fehlern</h2>${themenBalken(themenQuote(ts, abK))}</div>
    <div class="box"><h2>Falsch beantwortete Fragen</h2>${fehlerListe(fehlerAnalyse(ts, abK, s.id), 30, true)}</div></div>`;
  brotBinden(el); zielBinden(el);
};

/* ---------- Tests ---------- */
SEITEN.tests = el => {
  const D=ST.daten, F=ST.te; const liste=D.tests.filter(t=>!F.klasse || t.klasseId===F.klasse);
  el.innerHTML=`<div class="kopfzeile"><div><h1>Tests</h1><p>Jeder Test hat einen Code. Die Kinder öffnen easyplay, tippen auf «Test mit Code» und geben Code und PIN ein.</p></div>
      <div class="leiste"><button type="button" class="k p" data-ziel="neu" ${D.klassen.length?"":"disabled"}>Neuer Test</button></div></div>
    <div class="leiste"><select id="teK" aria-label="Klasse"><option value="">Alle Klassen</option>${D.klassen.map(k=>`<option value="${h(k.id)}" ${k.id===F.klasse?"selected":""}>${h(k.name)}</option>`).join("")}</select><span class="mu">${liste.length} ${liste.length===1?"Test":"Tests"}</span></div>
    ${liste.length?`<div class="tabwrap abschnitt"><table><thead><tr><th>Test</th><th>Klasse</th><th>Code</th><th class="r">Fragen</th><th class="r">Abgaben</th><th class="r">Ø Note</th><th>Korrektur</th><th>Status</th><th>Erstellt</th></tr></thead><tbody>
      ${liste.map(t=>{ const k=klasseVon(t.klasseId), ab=abgabenVon(t.code), s=schnitt(ab.filter(a=>!a.offen).map(a=>a.note)), off=ab.filter(a=>a.offen).length, hatOffen=t.fragen.some(istOffen);
        return `<tr class="klick" data-ziel="test/${h(t.code)}"><td><b>${h(t.titel)}</b></td><td>${h(k?.name||"ohne Klasse")}</td><td class="code">${h(t.code)}</td><td class="r">${t.fragen.length}</td><td class="r">${ab.length}/${(k?.schueler||[]).length}</td><td class="r"><span class="note ${noteKlasse(s)}">${fmtNote(s)}</span></td>
          <td>${hatOffen?(off?`<span class="marke wa">${off} offen</span>`:ab.length?`<span class="marke ok">erledigt</span>`:`<span class="mu">·</span>`):`<span class="mu">automatisch</span>`}</td><td>${t.aktiv===false?`<span class="marke">geschlossen</span>`:`<span class="marke ok">offen</span>`}</td><td class="nowrap">${datum(t.erstellt)}</td></tr>`; }).join("")}
    </tbody></table></div>`:`<div class="box">${leer(D.klassen.length?"Noch keine Tests.":"Lege zuerst eine Klasse an, dann kannst du Tests erstellen.", D.klassen.length?`<button type="button" class="k p" data-ziel="neu">Ersten Test erstellen</button>`:`<button type="button" class="k p" data-ziel="klassen">Klasse anlegen</button>`)}</div>`}`;
  zielBinden(el);
  $("#teK").onchange=e=>neu(()=>{ F.klasse=e.target.value; });
};

SEITEN.test = el => {
  const D=ST.daten, t=D.tests.find(x=>x.code===ST.param);
  if(!t){ el.innerHTML=leer("Diesen Test gibt es nicht mehr.", `<button type="button" class="k" data-ziel="tests">Zu den Tests</button>`); zielBinden(el); return; }
  const k=klasseVon(t.klasseId), kids=k?.schueler||[], ab=abgabenVon(t.code), fertig=ab.filter(a=>!a.offen);
  const s=schnitt(fertig.map(a=>a.note)), sp=schnitt(fertig.map(a=>a.punkte)), sz=schnitt(ab.map(a=>a.dauer||0)), hatOffen=t.fragen.some(istOffen), link=kindLink(t.code);
  const zeilen=[...kids.map(kid=>({kid, a:ab.find(a=>a.sid===kid.id)})), ...ab.filter(a=>!kids.some(x=>x.id===a.sid)).map(a=>({kid:{id:a.sid, name:a.name+" (entfernt)"}, a}))]
    .sort((x,y)=>(y.a?1:0)-(x.a?1:0) || (y.a?.offen?1:0)-(x.a?.offen?1:0) || (y.a?.note||0)-(x.a?.note||0) || x.kid.name.localeCompare(y.kid.name,"de"));
  const ohne=kids.filter(kid=>!ab.some(a=>a.sid===kid.id));
  el.innerHTML=`${brot([["Tests","tests"],...(k?[[k.name,"klasse",k.id]]:[]),[t.titel]])}
    <div class="kopfzeile"><div><h1>${h(t.titel)}</h1><p>${h(k?.name||"")} · ${h(sjName(t.schuljahr))} · ${t.fragen.length} Fragen · ${maxPunkte(t.fragen)} Punkte · erstellt am ${datum(t.erstellt)}</p></div>
      <div class="leiste"><button type="button" class="k" id="pdfA">Prüfung (PDF)</button><button type="button" class="k" id="pdfL">Lösungsblatt (PDF)</button></div></div>
    ${t.lp21?.length?`<div class="chips abschnitt">${t.lp21.map(c=>`<span class="chip still" title="${h(LP21_KB[c]?.fachName||"")}">${h(lpLabel(c))}</span>`).join("")}</div>`:""}
    <div class="spalten">
      <div class="box"><h2>Test verteilen</h2>
        <p class="mu klein" style="margin:0">Test-Code</p><p class="codegross" aria-label="Test-Code ${h(t.code.split("").join(" "))}">${h(t.code)}</p>
        <p class="klein">Die Kinder öffnen easyplay, tippen auf <b>«Test mit Code»</b> und geben Code und PIN ein. Oder sie öffnen direkt diesen Link:</p>
        <div class="leiste"><input type="text" readonly value="${h(link)}" aria-label="Link zum Test" id="tLink" style="flex:1;min-width:0"><button type="button" class="k" id="tCopy">Link kopieren</button></div>
        <div class="leiste"><a class="k p" href="${h(link)}" target="_blank" rel="noopener" id="tKind">Als Kind lösen</a>${ohne.length?`<span class="mu klein">z. B. mit dem PIN von ${h(ohne[0].name)}: <span class="pin">${h(ohne[0].pin)}</span></span>`:""}</div>
        ${ST.konto.art!=="supabase"?`<p class="mu klein">${ST.konto.art==="test" && !brueckeAktiv() ? "Im Testzugang mit Online-Datenbank können Kinder diesen Code nicht lösen." : "Ohne Online-Datenbank funktioniert der Code nur auf diesem Gerät und in diesem Browser."}</p>`:""}
        <label class="schalter"><input type="checkbox" id="tAktiv" ${t.aktiv!==false?"checked":""}><span>Test ist offen (Kinder können ihn lösen)</span></label>
      </div>
      <div class="box"><h2>Auf einen Blick</h2>
        ${kacheln([["Abgaben", `${ab.length}/${kids.length}`, ohne.length?`${ohne.length} fehlen`:"alle abgegeben", ohne.length?"wa":"ok"],["Ø Note", fmtNote(s), fertig.length<ab.length?"ohne offene":"", s==null?"":s>=4.5?"ok":s>=4?"wa":"fe"],
          ["Ø Punkte", sp!=null?(Math.round(sp*10)/10).toLocaleString("de-CH")+"/"+maxPunkte(t.fragen):"·", "", "ak"],["Ø Zeit", ab.length?h(zeit(sz)):"·", "", ""],
          ...(hatOffen?[["Zu korrigieren", zahl(ab.filter(a=>a.offen).length), "Abgaben mit offenen Fragen", ab.some(a=>a.offen)?"wa":"ok"]]:[])])}
        <div class="leiste" style="margin-top:10px"><button type="button" class="k" id="tReload">Resultate aktualisieren</button><button type="button" class="k g rechts" id="tDel">Test löschen</button></div>
      </div>
    </div>
    <div class="box"><h2>Resultate</h2>
      ${zeilen.length?`<div class="tabwrap"><table><thead><tr><th>Kind</th><th class="r">Punkte</th><th class="r">Note</th><th>Zeit</th><th>Abgabe</th><th class="r">Aktion</th></tr></thead><tbody>
        ${zeilen.map(({kid,a})=>a?`<tr><th><button type="button" class="link" data-ziel="kind/${h(kid.id)}">${h(kid.name)}</button></th><td class="r">${zahl(a.punkte)}/${a.max}</td><td class="r">${noteZelle(a)}</td><td class="nowrap">${h(zeit(a.dauer))}</td><td class="nowrap">${datumZeit(a.datum)}</td>
            <td class="r nowrap">${hatOffen?`<button type="button" class="k klein ${a.offen?"p":""}" data-kor="${h(a.id)}">${a.offen?`Korrigieren (${a.offen})`:"Korrektur ansehen"}</button> `:""}<button type="button" class="k klein" data-abdel="${h(a.id)}" title="Abgabe löschen, damit das Kind nochmals lösen kann">Zurücksetzen</button></td></tr>`
          :`<tr><th>${h(kid.name)}</th><td colspan="5" class="mu">noch nicht abgegeben · PIN <span class="pin">${h(kid.pin||"")}</span></td></tr>`).join("")}
      </tbody></table></div>`:`<p class="mu">Diese Klasse hat noch keine Kinder.</p>`}
    </div>
    <div class="box"><h2>Fehleranalyse</h2><p class="mu klein">Auswahlfragen sortiert nach Fehlerquote, mit der häufigsten falschen Antwort.</p>${fehlerListe(fehlerAnalyse([t], ab), 50)}</div>
    <details class="box"><summary><b>Fragen in diesem Test (${t.fragen.length})</b></summary>
      <ol class="selliste" style="margin-top:10px">${t.fragen.map(f=>`<li><span><b>${h(f.q)}</b><small>${istOffen(f)?`Offene Frage, ${fPunkte(f)} ${fPunkte(f)===1?"Punkt":"Punkte"}${f.m?` · Musterlösung: <span class="ok">${h(f.m)}</span>`:""}`:f.o.map((o,j)=>`${"abcd"[j]}) ${j===+f.r?`<b class="ok">${h(o)}</b>`:h(o)}`).join(" · ")}</small></span></li>`).join("")}</ol></details>`;
  brotBinden(el); zielBinden(el);
  $("#tCopy").onclick=async()=>{ try{ await navigator.clipboard.writeText(link); melde("Link kopiert."); }catch(e){ $("#tLink").select(); melde("Bitte den Link markieren und kopieren."); } };
  $("#tAktiv").onchange=async e=>{ const neuT={...t, aktiv:e.target.checked}; try{ await ST.sp.testSpeichern(neuT, k); t.aktiv=neuT.aktiv; melde(t.aktiv?"Test ist offen.":"Test ist geschlossen."); navZeichnen(); }catch(x){ e.target.checked=!e.target.checked; melde(fehlerText(x),"fe"); } };
  const pdf=async loes=>{ $$("#pdfA,#pdfL").forEach(b=>b.disabled=true); melde("PDF wird erstellt …");
    try{ const d=await pdfTest(t, k, loes); pdfSpeichern(d, `${loes?"Loesungen":"Pruefung"}-${slug(t.titel)}.pdf`); melde("PDF erstellt."); }catch(e){ melde(e.message,"fe"); } $$("#pdfA,#pdfL").forEach(b=>b.disabled=false); };
  $("#pdfA").onclick=()=>pdf(false); $("#pdfL").onclick=()=>pdf(true);
  $$("[data-kor]", el).forEach(b=>b.onclick=()=>korrigierDialog(ab.find(a=>a.id===b.dataset.kor)));
  $$("[data-abdel]", el).forEach(b=>b.onclick=async()=>{ const a=ab.find(x=>x.id===b.dataset.abdel); if(!a || !await bestaetige("Abgabe zurücksetzen?", `Abgabe von ${a.name} löschen? Danach kann das Kind den Test nochmals lösen.`, "Abgabe löschen", true)) return;
    try{ await ST.sp.abgabeLoeschen(a); ST.daten.abgaben=ST.daten.abgaben.filter(x=>x.id!==a.id); melde("Abgabe gelöscht."); neu(); }catch(e){ melde(fehlerText(e),"fe"); } });
  $("#tReload").onclick=()=>neuLaden();
  $("#tDel").onclick=async()=>{ if(!await bestaetige("Test löschen?", `Test «${t.titel}» und alle Resultate löschen? Der Code funktioniert danach nicht mehr.`, "Endgültig löschen", true)) return;
    try{ await ST.sp.testLoeschen(t.code); ST.daten.tests=ST.daten.tests.filter(x=>x.code!==t.code); ST.daten.abgaben=ST.daten.abgaben.filter(x=>x.code!==t.code); melde("Test gelöscht."); zeige("tests"); }catch(e){ melde(fehlerText(e),"fe"); } };
};

/* ---------- Korrigieren (offene Fragen) ---------- */
function korrigierDialog(a, reihe){
  if(!a) return; const t=ST.daten.tests.find(x=>x.code===a.code); if(!t) return;
  const kor={...(a.korrektur||{})}; const idx=t.fragen.map((f,i)=>istOffen(f)?i:-1).filter(i=>i>=0);
  const naechste = reihe ? reihe.filter(x=>x.id!==a.id) : [];
  const wahl=(i,max)=>{ const opts=[]; for(let p=0;p<=max;p+=0.5) opts.push(p); return opts.length<=9 ? `<div class="punktwahl" role="group" aria-label="Punkte für Frage ${i+1}">${opts.map(p=>`<button type="button" class="k klein" data-kp="${i}" data-wert="${p}" aria-pressed="${kor[i]!=null && +kor[i]===p}">${String(p).replace(".",",")}</button>`).join("")}<span class="mu klein">von ${max}</span></div>`
    : `<label class="mu klein">Punkte <input type="number" min="0" max="${max}" step="0.5" data-kpz="${i}" value="${kor[i]!=null?h(kor[i]):""}" style="width:90px"> von ${max}</label>`; };
  dialog(`<h2 id="dlgTitel">Korrigieren: ${h(a.name)}</h2><p class="mu klein" style="margin:0">${h(t.titel)} · abgegeben ${datumZeit(a.datum)} · Auswahlfragen: ${t.fragen.filter((f,i)=>!istOffen(f) && a.antworten[i]!=null && +a.antworten[i]===+f.r).length} von ${t.fragen.filter(f=>!istOffen(f)).length} richtig</p>
    ${idx.map(i=>{ const f=t.fragen[i], ant=a.antworten?.[i]; return `<div class="korf"><p><b>Frage ${i+1}:</b> ${h(f.q)}</p>
      <div class="korant">${ant!=null && String(ant).trim() ? h(ant) : `<span class="mu">keine Antwort</span>`}</div>
      ${f.m?`<p class="mu klein" style="margin-top:6px">Musterlösung: ${h(f.m)}</p>`:""}${wahl(i, fPunkte(f))}</div>`; }).join("")}
    <p class="klein" id="korStand"></p>
    <div class="knoepfe"><button type="button" class="k" id="korAb">Abbrechen</button>${naechste.length?`<button type="button" class="k" id="korWeiter">Speichern und nächste (${naechste.length})</button>`:""}<button type="button" class="k p" id="korOk">Speichern</button></div>`,
  d=>{
    const stand=()=>{ const r=bewerte(t.fragen, a.antworten, kor); $("#korStand", d).innerHTML = r.offen ? `Noch ${r.offen} ${r.offen===1?"Frage":"Fragen"} ohne Punkte. Vorläufig: ${zahl(r.punkte)} von ${r.max} Punkten.` : `Total ${zahl(r.punkte)} von ${r.max} Punkten, <b>Note ${fmtNote(r.note)}</b>.`; };
    $$("[data-kp]", d).forEach(b=>b.onclick=()=>{ const i=b.dataset.kp; kor[i]=+b.dataset.wert; $$(`[data-kp="${i}"]`, d).forEach(x=>x.setAttribute("aria-pressed", String(x===b))); stand(); });
    $$("[data-kpz]", d).forEach(inp=>inp.oninput=()=>{ const i=inp.dataset.kpz; if(inp.value==="") delete kor[i]; else kor[i]=Math.max(0,Math.min(+inp.max,+inp.value||0)); stand(); });
    stand();
    $("#korAb", d).onclick=schliesse;
    const speichern=async weiter=>{ $$("#korOk,#korWeiter", d).forEach(b=>b.disabled=true);
      try{ await ST.sp.abgabeKorrigieren(a, kor); const r=bewerte(t.fragen, antwortenSaeubern(t.fragen, a.antworten), kor);
        const g=ST.daten.abgaben.find(x=>x.id===a.id); if(g) Object.assign(g, {korrektur:{...kor}, punkte:r.punkte, max:r.max, note:r.note, offen:r.offen});
        melde(r.offen ? "Korrektur gespeichert (noch nicht vollständig)." : `Korrektur gespeichert: ${a.name} hat Note ${fmtNote(r.note)}.`);
        schliesse(); neu(); if(weiter && naechste.length){ const n=ST.daten.abgaben.find(x=>x.id===naechste[0].id); korrigierDialog(n, naechste); } }
      catch(e){ melde(fehlerText(e),"fe"); $$("#korOk,#korWeiter", d).forEach(b=>b.disabled=false); } };
    $("#korOk", d).onclick=()=>speichern(false);
    $("#korWeiter", d) && ($("#korWeiter", d).onclick=()=>speichern(true));
  });
}
SEITEN.korrigieren = el => {
  const D=ST.daten; const tm={}; D.tests.forEach(t=>tm[t.code]=t);
  const offen=D.abgaben.filter(a=>a.offen>0).sort((a,b)=>String(a.datum).localeCompare(String(b.datum)));
  const erledigt=D.abgaben.filter(a=>!a.offen && tm[a.code]?.fragen.some(istOffen)).sort((a,b)=>String(b.datum).localeCompare(String(a.datum))).slice(0,20);
  const zeile=(a,knopf)=>{ const t=tm[a.code], k=klasseVon(t?.klasseId); return `<tr><th>${h(a.name)}</th><td><button type="button" class="link" data-ziel="test/${h(a.code)}">${h(t?.titel||"")}</button></td><td>${h(k?.name||"")}</td><td class="r">${noteZelle(a)}</td><td class="nowrap">${datumZeit(a.datum)}</td><td class="r">${knopf}</td></tr>`; };
  el.innerHTML=`<div class="kopfzeile"><div><h1>Korrigieren</h1><p>Offene Fragen bewertest du selbst. Bis alles korrigiert ist, gilt die Note als vorläufig (in Klammern).</p></div>
      ${offen.length?`<div class="leiste"><button type="button" class="k p" id="korAlle">Alle der Reihe nach korrigieren</button></div>`:""}</div>
    <div class="box"><h2>Offen <span class="marke wa">${offen.length}</span></h2>
      ${offen.length?`<div class="tabwrap"><table><thead><tr><th>Kind</th><th>Test</th><th>Klasse</th><th class="r">Note</th><th>Abgabe</th><th class="r">Aktion</th></tr></thead><tbody>${offen.map(a=>zeile(a, `<button type="button" class="k klein p" data-kor="${h(a.id)}">${a.offen} ${a.offen===1?"Frage":"Fragen"} korrigieren</button>`)).join("")}</tbody></table></div>`
        : leer("Alles korrigiert. Gut gemacht!")}</div>
    <div class="box"><h2>Zuletzt korrigiert</h2>
      ${erledigt.length?`<div class="tabwrap"><table><thead><tr><th>Kind</th><th>Test</th><th>Klasse</th><th class="r">Note</th><th>Abgabe</th><th class="r">Aktion</th></tr></thead><tbody>${erledigt.map(a=>zeile(a, `<button type="button" class="k klein" data-kor="${h(a.id)}">Ändern</button>`)).join("")}</tbody></table></div>`
        : `<p class="mu">Noch keine Tests mit offenen Fragen korrigiert. Offene Fragen fügst du beim Erstellen eines Tests hinzu («Eigene Frage», Art «Offene Frage»).</p>`}</div>`;
  zielBinden(el);
  $$("[data-kor]", el).forEach(b=>b.onclick=()=>{ const a=D.abgaben.find(x=>x.id===b.dataset.kor); korrigierDialog(a, a?.offen ? offen : null); });
  $("#korAlle") && ($("#korAlle").onclick=()=>korrigierDialog(offen[0], offen));
};

/* ---------- Fragenpool laden (erst wenn er gebraucht wird) ---------- */
const POOL = {daten:null, laedt:null, fertig:0, total:0, fehler:""};
function ladePool(){
  if(POOL.daten) return Promise.resolve(POOL.daten);
  if(POOL.laedt) return POOL.laedt;
  const teile=CFG.fragenDateien || ["fragen-1.json","fragen-2.json","fragen-3.json"]; POOL.total=teile.length; POOL.fertig=0; POOL.fehler="";
  const fort=()=>{ const p=Math.round(POOL.fertig/POOL.total*100); $$("[data-poolfort]").forEach(x=>x.style.width=p+"%"); $$("[data-pooltext]").forEach(x=>x.textContent=`Fragenpool wird geladen … ${POOL.fertig} von ${POOL.total} Dateien`); };
  POOL.laedt=Promise.all(teile.map(f=>fetch("../"+f).then(r=>r.ok?r.json():[]).catch(()=>[]).then(l=>{ POOL.fertig++; fort(); return l; })))
    .then(res=>{ const ok=[]; res.forEach(l=>(Array.isArray(l)?l:[]).forEach(f=>{ if(f && f.t && f.q && Array.isArray(f.a) && f.a.length===4 && f.l>=1 && f.l<=3) ok.push(frageOhneStrich(f)); }));
      POOL.daten=ok; POOL.laedt=null; if(!ok.length) POOL.fehler="Der Fragenpool konnte nicht geladen werden. Bist du online?"; return ok; });
  return POOL.laedt;
}
const poolLadeAnzeige = () => `<div class="laden"><div class="spinner" aria-hidden="true"></div><div><span data-pooltext>Fragenpool wird geladen … ${POOL.fertig} von ${POOL.total||"?"} Dateien</span><div class="fortschritt"><i data-poolfort style="width:${POOL.total?Math.round(POOL.fertig/POOL.total*100):0}%"></i></div><span class="mu klein">Rund 128 000 Fragen. Beim ersten Mal dauert das einen Moment.</span></div></div>`;
function poolSicher(){ if(POOL.daten) return true; ladePool().then(()=>{ if(["neu","fragen","lehrplan"].includes(ST.tab)) neu(); }); return false; }


/* ================= Lehrplan 21: Karte der Kompetenzbereiche, Tests daraus ================= */
const LP_AUS = new Set(["NT.8"]);                 // Fortpflanzung: bei easyplay bewusst nicht
const LP_FARBE = {D:"#E8364F",FS1E:"#2E86DE",FS2F:"#3D5AFE",MA:"#8A3FE0",NMG:"#0FA968",NT:"#12A57F",WAH:"#E8840C",RZG:"#B5179E",ERG:"#5B2BD9",BG:"#E043B8",TTG:"#C2185B",MU:"#F4A818",BS:"#22A9BB",MI:"#1E3A8A",BO:"#6D4C41"};
const Z_STUFE = {1:[1], 2:[1,2], 3:[2,3]};
function lpWahl(v){ const m=String(v).slice(3).split("@"); return {codes:(m[0]||"").split(",").filter(Boolean), z:+m[1]||2}; }
function lpThemen(codes, z){
  const out=new Set(), z3=+z>=3, want=new Set(codes);
  Object.entries(THEMA_LP21).forEach(([id,m])=>{ (z3?m[1]:m[0]).forEach(c=>{ if(want.has(c)){ if(id==="kt_") KANTONE.forEach(k=>out.add(k.id)); else if(THEMA[id]?.kids) THEMA[id].kids.forEach(k=>out.add(k)); else if(id==="geschichte") GESCH_IDS.forEach(k=>out.add(k)); else out.add(id); } }); });
  return [...out];
}
let LP_ZAHL = null;
function lpZahlen(){
  if(LP_ZAHL || !POOL.daten) return LP_ZAHL;
  const proThema={}; POOL.daten.forEach(f=>{ if(f.img) return; const o=proThema[f.t]||(proThema[f.t]={1:0,2:0,3:0}); o[f.l]=(o[f.l]||0)+1; });
  LP_ZAHL={};
  [1,2,3].forEach(z=>{ const r=LP_ZAHL[z]={}; Object.keys(LP21_KB).forEach(c=>{ if(LP_AUS.has(c)) return; const th=lpThemen([c], z); let n=0; th.forEach(t=>{ const o=proThema[t]; if(o) Z_STUFE[z].forEach(l=>n+=o[l]||0); }); r[c]={n, th}; }); });
  return LP_ZAHL;
}
const LP = {z:0, wahl:new Set()};
function lpThemaText(th){ const kt=th.filter(x=>String(x).startsWith("kt_")).length, rest=th.filter(x=>!String(x).startsWith("kt_")).map(x=>themaName(x)); if(kt) rest.push(kt+" Kantonen"); return h(rest.slice(0,7).join(", ")+(rest.length>7?" und weiteren":"")); }
function lpStufe(n){ return n>=150 ? 3 : n>=30 ? 2 : n>0 ? 1 : 0; }
SEITEN.lehrplan = el => {
  const D=ST.daten; if(!LP.z) LP.z = D.klassen[0]?.zyklus || sjObj(D.klassen[0]?.schuljahr)?.zyklus || 2;
  const fachAkt = ST.param && LP21.find(f=>f.f===ST.param) ? ST.param : "";
  const poolDa = poolSicher(); const Z = poolDa ? lpZahlen() : null; const zz=LP.z;
  const faecher = LP21.filter(f=>f.z.includes(zz));
  const kbs = f => f.kb.filter(([c])=>!LP_AUS.has(c));
  const zelle = (f, z) => { if(!f.z.includes(z)) return `<td class="lpx" aria-label="nicht in Zyklus ${z}">·</td>`; if(!Z) return `<td class="lpc">…</td>`;
    const l=kbs(f), ab=l.filter(([c])=>Z[z][c]?.n>0).length, n=l.reduce((s,[c])=>s+(Z[z][c]?.n||0),0);
    return `<td><button type="button" class="lpc s${lpStufe(n/Math.max(1,l.length))}" data-lpf="${f.f}" data-lpz="${z}" style="--lf:${LP_FARBE[f.f]||"#5b45e8"}" title="${h(f.n)}, Zyklus ${z}: ${ab} von ${l.length} Kompetenzbereichen mit Fragen"><b>${ab}/${l.length}</b><small>${n.toLocaleString("de-CH")}</small></button></td>`; };
  const kopf = `<div class="held lphe"><div class="text"><h2>Lehrplan 21</h2><p>Alle Fachbereiche und Kompetenzbereiche auf einen Blick. Sieh, wo easyplay Fragen hat, und mach daraus mit zwei Klicks einen Test.</p>
      <div class="chips">${[1,2,3].map(z=>`<button type="button" data-lpzy="${z}" aria-pressed="${zz===z}" style="${zz===z?"background:#fff;color:#4b32c8":""}">Zyklus ${z} · ${["","KG bis 2. Klasse","3. bis 6. Klasse","7. bis 9. Klasse"][z]}</button>`).join("")}</div></div></div>`;
  if(!fachAkt){
    el.innerHTML = kopf + `
      <div class="box"><h2>Karte: Fachbereiche und Zyklen</h2><p class="mu klein">Jede Zelle zeigt, wie viele Kompetenzbereiche easyplay mit Fragen abdeckt, darunter die Zahl passender Fragen. Je kräftiger die Farbe, desto mehr Fragen. Tippe eine Zelle an.</p>
        ${poolDa?"":poolLadeAnzeige()}
        <div class="tabwrap"><table class="lpkarte"><thead><tr><th>Fachbereich</th><th class="c">Zyklus 1</th><th class="c">Zyklus 2</th><th class="c">Zyklus 3</th></tr></thead><tbody>
        ${LP21.map(f=>`<tr><th scope="row"><span class="lpdot" style="--lf:${LP_FARBE[f.f]}"></span>${h(f.n)} <span class="mu klein">${f.f}</span></th>${[1,2,3].map(z=>zelle(f,z)).join("")}</tr>`).join("")}
        </tbody></table></div>
        <p class="mu klein">Legende: <span class="lpleg s3">viele Fragen</span> <span class="lpleg s2">einige</span> <span class="lpleg s1">wenige</span> <span class="lpleg s0">noch keine</span></p></div>
      <div class="box"><h2>Fachbereiche im Zyklus ${zz}</h2><div class="lpgrid">${faecher.map(f=>{ const l=kbs(f), ab=Z?l.filter(([c])=>Z[zz][c]?.n>0).length:0, n=Z?l.reduce((s,[c])=>s+(Z[zz][c]?.n||0),0):0;
        return `<button type="button" class="lpfach" data-lpf="${f.f}" style="--lf:${LP_FARBE[f.f]}"><span class="lpcode">${f.f}</span><b>${h(f.n)}</b><span class="lpbar"><i style="width:${l.length?Math.round(ab/l.length*100):0}%"></i></span><small>${Z?`${ab} von ${l.length} Kompetenzbereichen · ${n.toLocaleString("de-CH")} Fragen`:"wird gezählt …"}</small></button>`; }).join("")}</div></div>`;
  } else {
    const f=LP21.find(x=>x.f===fachAkt), l=kbs(f), aktivZ=f.z.includes(zz);
    el.innerHTML = kopf + brot([["Lehrplan 21","lehrplan"],[f.n]]) + `
      <div class="box lpdetail" style="--lf:${LP_FARBE[f.f]}"><div class="kopfzeile"><div><h1><span class="lpdot"></span>${h(f.n)} <span class="mu">${f.f}</span></h1><p class="mu">Zyklus ${zz}${aktivZ?"":" (dieser Fachbereich gehört nicht zu Zyklus "+zz+")"} · Wähle Kompetenzbereiche aus und erstelle daraus einen Test.</p></div></div>
      ${poolDa?"":poolLadeAnzeige()}
      <div class="lpkb">${l.map(([c,t])=>{ const d=Z?Z[zz][c]:null, n=d?d.n:0, an=LP.wahl.has(c);
        return `<label class="lpzeile ${an?"an":""} ${n?"":"leer"}"><input type="checkbox" data-lpk="${c}" ${an?"checked":""} ${n?"":"disabled"}><span class="lpcode">${c}</span><span class="lptx"><b>${h(t)}</b><small>${Z?(n?`${n.toLocaleString("de-CH")} Fragen aus ${lpThemaText(d.th)}`:"Dazu gibt es bei easyplay noch keine Fragen. Eigene Fragen kannst du beim neuen Test ergänzen."):"wird gezählt …"}</small></span><span class="lpn s${lpStufe(n)}">${Z?n.toLocaleString("de-CH"):""}</span></label>`; }).join("")}</div>
      <div class="festleiste"><span>${LP.wahl.size ? `${LP.wahl.size} ${LP.wahl.size===1?"Kompetenzbereich":"Kompetenzbereiche"} gewählt` : "Kompetenzbereiche ankreuzen"}</span>
        <button type="button" class="k rechts" id="lpAlle">Alle mit Fragen</button><button type="button" class="k p" id="lpTest" ${LP.wahl.size?"":"disabled"}>Test daraus erstellen ›</button></div></div>`;
  }
  brotBinden(el);
  $$("[data-lpzy]", el).forEach(b=>b.onclick=()=>neu(()=>{ LP.z=+b.dataset.lpzy; LP.wahl.clear(); }));
  $$("[data-lpf]", el).forEach(b=>b.onclick=()=>{ if(b.dataset.lpz) LP.z=+b.dataset.lpz; LP.wahl.clear(); zeige("lehrplan", b.dataset.lpf); });
  $$("[data-lpk]", el).forEach(cb=>cb.onchange=()=>neu(()=>{ if(cb.checked) LP.wahl.add(cb.dataset.lpk); else LP.wahl.delete(cb.dataset.lpk); }));
  const alle=$("#lpAlle"); if(alle) alle.onclick=()=>neu(()=>{ const f=LP21.find(x=>x.f===fachAkt); const Zl=lpZahlen(); if(!Zl) return; kbs(f).forEach(([c])=>{ if(Zl[LP.z][c]?.n) LP.wahl.add(c); }); });
  const los=$("#lpTest"); if(los) los.onclick=()=>{
    if(!D.klassen.length){ melde("Lege zuerst eine Klasse an, dann kannst du den Test erstellen.","fe"); zeige("klassen"); return; }
    const codes=[...LP.wahl]; const k=D.klassen.find(x=>(x.zyklus||sjObj(x.schuljahr)?.zyklus)===LP.z) || D.klassen[0];
    neuStart(k.id); const n=ST.neu; n.thema="lp:"+codes.join(",")+"@"+LP.z; n.stufe={1:1,2:2,3:3}[LP.z]||0;
    const f=LP21_KB[codes[0]]; n.titel=(f?f.fachName:"Lehrplan 21")+": "+(codes.length<=3 ? codes.join(", ") : codes.length+" Kompetenzbereiche")+" (Zyklus "+LP.z+")";
    if(!(sjObj(n.schuljahr)?.zyklus===LP.z)){ const sj=SCHULJAHRE.find(x=>x.zyklus===LP.z && x.harmos); if(sj) n.schuljahr=sj.id; }
    lpAuto(); zeige("neu");
  };
};
/* ---------- Neuer Test ---------- */
function themaOptionen(sel){
  const o=(v,l,ind)=>`<option value="${h(v)}" ${sel===v?"selected":""}>${ind?"   ":""}${h(l)}</option>`;
  let html=(String(sel).startsWith("lp:") ? o(sel, themaLabel(sel)) : "")+o("","Alle Themen");
  BEREICHE.forEach(b=>{
    html+=`<optgroup label="${h(b.name)}">`+o("b:"+b.id, "Ganzer Bereich «"+b.name+"»");
    b.themen.forEach(t=>{
      if(t.id==="geschichte"){ html+=o("geschichte","Geschichte, alles")+GESCH_EPOCHEN.map(e=>o(e.id,e.name,1)).join("")+o(CH_ALLG.id,"Schweizer Geschichte",1)+o("kt_alle","Alle Kantone",1); return; }
      if(t.kids){ html+=o(t.id, t.name+", alles")+t.kids.map(k=>o(k, themaName(k), 1)).join(""); return; }
      html+=o(t.id,t.name);
    });
    html+="</optgroup>";
  });
  return html;
}
function themaIds(v){
  if(!v) return null;
  if(v.startsWith("lp:")){ const {codes, z}=lpWahl(v); return lpThemen(codes, z); }
  if(v.startsWith("b:")){ const b=BEREICHE.find(x=>x.id===v.slice(2)); return b ? b.themen.flatMap(t=>themaIds(t.id)||[]) : null; }
  if(v==="geschichte") return GESCH_IDS;
  if(v==="kt_alle") return KANTONE.map(k=>k.id);
  if(THEMA[v]?.kids) return THEMA[v].kids;
  return [v];
}
function themaLabel(v){ if(!v) return "Gemischt"; if(v.startsWith("lp:")){ const {codes}=lpWahl(v); return "Lehrplan 21 "+codes.join(", "); } if(v.startsWith("b:")) return (BEREICHE.find(x=>x.id===v.slice(2))?.name)||"Bereich"; if(v==="kt_alle") return "Kantone"; return themaName(v); }
function neuStart(klasseId){
  const D=ST.daten; const kid = klasseId && klasseVon(klasseId) ? klasseId : D.klassen[0]?.id || ""; const k=klasseVon(kid);
  ST.neu={titel:"", klasseId:kid, schuljahr:k?.schuljahr||"h6", thema:"", stufe:0, unter:"", anzahl:10, modus:"zufall", sel:[], fmap:new Map(), suche:"", lp21:[], lpAuto:true, fach:"", edit:{}, alleOffen:false, bearb:null, entwurf:{art:"mc", q:"", a:["","","",""], m:"", p:2, z:4}};
  lpAuto();
}
function zyklusNeu(){ const n=ST.neu; const s=sjObj(n.schuljahr); return s ? s.zyklus : (klasseVon(n.klasseId)?.zyklus||2); }
function lpAuto(){ const n=ST.neu; if(String(n.thema).startsWith("lp:")){ const {codes}=lpWahl(n.thema); n.lp21=codes.slice(0,4); n.fach=LP21_KB[codes[0]]?.fach||n.fach; return; } if(!n.lpAuto) return; n.lp21=lp21Vorschlag(themaIds(n.thema)||[], zyklusNeu()); n.fach = n.lp21[0] ? LP21_KB[n.lp21[0]].fach : n.fach; }
function poolNeu(ohneUnter){
  const n=ST.neu; const ids=themaIds(n.thema); const set=ids?new Set(ids):null; const u=ohneUnter?"":n.unter.trim().toLowerCase();
  return (POOL.daten||[]).filter(f=>THEMA[f.t] && !f.img && (!n.stufe || f.l===n.stufe) && (!set || set.has(f.t)) && (!u || String(f.s||"").toLowerCase().includes(u)));
}
function alsTestFrage(n, f, mischenJa){
  const k=fKey(f), ed=n.edit[k]||{};
  const q=String(ed.q!=null ? ed.q : f.q).trim().slice(0,600);
  const offen = f.eigen ? f.art==="offen" : !!(n.alleOffen || ed.offen);
  const basis={q, e:f.e||"", nr:f.eigen?0:fNr(f), t:f.eigen?"eigen":f.t, l:f.eigen?0:f.l, s:f.s||"", ...(f.eigen?{eigen:true}:{})};
  if(offen) return {...basis, art:"offen", m:String(ed.m!=null ? ed.m : (f.eigen ? f.m : f.a[0])||"").slice(0,1000), p:Math.max(1,Math.min(20,+(ed.p||f.p||1))), z:Math.max(1,Math.min(15,+(ed.z||f.z||3)))};
  const a=f.a; if(!mischenJa) return {...basis, o:a, r:0};
  const o=mischen(a.map((x,i)=>({x, ok:i===0}))); return {...basis, o:o.map(y=>y.x), r:o.findIndex(y=>y.ok)};
}
function selItemHTML(n, f){
  const k=fKey(f), tf=alsTestFrage(n,f), offen=istOffen(tf), ed=n.edit[k]||{};
  const meta=`${f.eigen?"Eigene Frage":h(themaName(f.t))+" · Stufe "+f.l} · ${offen?`offen, ${tf.p} ${tf.p===1?"Punkt":"Punkte"}`:"Auswahl"}`;
  if(n.bearb===k) return `<li><div class="bearb">
      <label class="mu klein" for="edQ">Fragetext</label><textarea id="edQ" rows="2" maxlength="600">${h(tf.q)}</textarea>
      ${f.eigen?"":`<label class="schalter"><input type="checkbox" id="edOffen" ${offen?"checked":""} ${n.alleOffen?"disabled":""}><span>Als offene Frage (ohne Auswahlantworten)</span></label>`}
      ${offen?`<label class="mu klein" for="edM">Musterlösung</label><textarea id="edM" rows="2" maxlength="1000">${h(tf.m)}</textarea>
        <div class="zwei"><div class="feld"><label class="mu klein" for="edP">Punkte</label><input id="edP" type="number" min="1" max="20" value="${tf.p}"></div><div class="feld"><label class="mu klein" for="edZ">Schreiblinien im PDF</label><input id="edZ" type="number" min="1" max="15" value="${tf.z}"></div></div>`
        :`<p class="mu klein" style="margin:0">Antworten: ${f.a.map((a,i)=>i===0?`<b class="ok">${h(a)}</b>`:h(a)).join(" · ")}</p>`}
      <div class="leiste"><button type="button" class="k p klein" id="edOk">Übernehmen</button><button type="button" class="k klein" id="edAb">Abbrechen</button>${ed.q!=null&&!f.eigen?`<button type="button" class="k klein" id="edOrig">Originaltext</button>`:""}</div></div></li>`;
  return `<li><span><b>${h(tf.q)}</b><small>${meta}${offen?(tf.m?` · Lösung: ${h(tf.m)}`:""):` · richtig: ${h(f.a[0])}`}${ed.q!=null?" · Text geändert":""}</small></span>
    <span class="akt"><button type="button" class="k klein" data-ed="${h(k)}" aria-label="Frage bearbeiten">Bearbeiten</button><button type="button" class="k klein g" data-rm="${h(k)}" aria-label="Frage entfernen">Entfernen</button></span></li>`;
}
SEITEN.neu = el => {
  const D=ST.daten;
  if(!D.klassen.length){ el.innerHTML=`<h1>Neuer Test</h1><div class="box">${leer("Für einen Test brauchst du zuerst eine Klasse mit Kindern.", `<button type="button" class="k p" data-ziel="klassen">Klasse anlegen</button>`)}</div>`; zielBinden(el); return; }
  if(!ST.neu || !klasseVon(ST.neu.klasseId)) neuStart();
  const n=ST.neu, poolDa=poolSicher();
  const pool=poolDa?poolNeu():[]; const basis=poolDa&&n.unter?poolNeu(true):pool;
  const subs={}; basis.forEach(f=>{ if(f.s) subs[f.s]=(subs[f.s]||0)+1; });
  const subListe=Object.entries(subs).sort((a,b)=>b[1]-a[1]).slice(0,400).sort((a,b)=>a[0].localeCompare(b[0],"de"));
  const sel=n.sel.map(k=>n.fmap.get(k)).filter(Boolean), selSet=new Set(n.sel);
  const q=n.suche.trim().toLowerCase();
  const liste = poolDa && n.modus==="manuell" ? (q.length>=2 ? pool.filter(f=>(f.q+" "+f.a[0]+" "+(f.s||"")).toLowerCase().includes(q)) : pool).slice(0,150) : [];
  const fb=LP21.find(x=>x.f===n.fach) || LP21.find(x=>x.z.includes(zyklusNeu())) || LP21[0];
  const vorschlag=lp21Vorschlag(themaIds(n.thema)||[], zyklusNeu()); const E=n.entwurf;
  const total=sel.reduce((x,f)=>x+fPunkte(alsTestFrage(n,f)),0);
  el.innerHTML=`<div class="kopfzeile"><div><h1>Neuer Test</h1><p>Wähle Klasse und Fragen. Der Test bekommt einen Code, den die Kinder mit ihrem PIN eingeben.</p></div></div>
    <div class="box"><h2>1. Grunddaten</h2><div class="formular">
      <label for="nTitel">Titel</label><input id="nTitel" maxlength="80" placeholder="${h(themaLabel(n.thema))}-Test" value="${h(n.titel)}">
      <label for="nKl">Klasse</label><select id="nKl">${D.klassen.map(k=>`<option value="${h(k.id)}" ${k.id===n.klasseId?"selected":""}>${h(k.name)} (${(k.schueler||[]).length} Kinder)</option>`).join("")}</select>
      <label for="nSj">Schuljahr</label><select id="nSj">${sjOptionen(n.schuljahr)}</select></div></div>
    <div class="box"><h2>2. Fragen aus dem Fragenpool</h2>
      ${!poolDa ? (POOL.fehler?`<div class="hinweis">${h(POOL.fehler)} <button type="button" class="k klein" id="poolNochmal">Nochmals</button></div>`:poolLadeAnzeige()) : `<div class="formular">
        <label for="nTh">Thema oder Bereich</label><select id="nTh">${themaOptionen(n.thema)}</select>
        <label for="nSub">Unterthema</label><div><input id="nSub" list="nSubs" placeholder="Stichwort, z. B. Römer, Fuchs, Bern" value="${h(n.unter)}" autocomplete="off" style="width:100%"><datalist id="nSubs">${subListe.map(([s,c])=>`<option value="${h(s)}">${c} Fragen</option>`).join("")}</datalist></div>
        <span class="mu" style="padding-top:7px">Stufe</span><div class="segs" role="group" aria-label="Stufe">${[[0,"Alle"],[1,"Entdecker"],[2,"Könner"],[3,"Profis"]].map(([v,l])=>`<button type="button" data-st="${v}" aria-pressed="${n.stufe===v}">${l}</button>`).join("")}</div>
        <span class="mu" style="padding-top:7px">Auswahl</span><div><div class="segs" role="group" aria-label="Auswahl"><button type="button" data-mo="zufall" aria-pressed="${n.modus==="zufall"}">Zufällig ziehen</button><button type="button" data-mo="manuell" aria-pressed="${n.modus==="manuell"}">Selbst auswählen</button></div>
          <span class="mu klein" style="margin-left:8px"><b>${pool.length.toLocaleString("de-CH")}</b> passende Fragen</span></div>
      </div>
      ${n.modus==="zufall" ? `<div class="leiste" style="margin-top:10px"><label for="nAnz" class="mu">Anzahl</label><input id="nAnz" type="number" min="1" max="${MAX_FRAGEN}" value="${n.anzahl}" inputmode="numeric" style="width:80px"><button type="button" class="k p" id="nZiehen" ${pool.length?"":"disabled"}>${n.sel.some(k=>!n.fmap.get(k)?.eigen)?"Neu ziehen":"Fragen ziehen"}</button></div>`
        : `<div class="leiste" style="margin-top:10px"><input id="nSuche" type="search" placeholder="In den Fragen suchen" aria-label="In den Fragen suchen" value="${h(n.suche)}" autocomplete="off" style="flex:1;min-width:0"></div>
          <p class="mu klein">${liste.length<pool.length?`Die ersten ${liste.length} von ${pool.length.toLocaleString("de-CH")} Fragen. Grenze mit Thema, Stufe, Unterthema oder Suchwort ein.`:`${liste.length} Fragen`}</p>
          <div class="auswahl">${liste.map(f=>{ const id=fKey(f); return `<label class="${selSet.has(id)?"an":""}"><input type="checkbox" data-fq="${h(id)}" ${selSet.has(id)?"checked":""}><span><b>${h(f.q)}</b><small>Nr. ${fNr(f)} · ${h(themaName(f.t))} · Stufe ${f.l}${f.s?` · ${h(f.s)}`:""} · richtig: ${h(f.a[0])}</small></span></label>`; }).join("") || `<p class="mu" style="padding:10px">Keine Fragen gefunden.</p>`}</div>`}`}
    </div>
    <div class="box"><h2>3. Eigene Frage schreiben</h2>
      <p class="mu klein">Mit vier Antworten zur Auswahl oder als offene Frage, bei der die Kinder selbst schreiben. Offene Fragen korrigierst du nach der Abgabe.</p>
      <div class="segs" role="group" aria-label="Fragenart"><button type="button" data-ea="mc" aria-pressed="${E.art==="mc"}">Mit Auswahl (A bis D)</button><button type="button" data-ea="offen" aria-pressed="${E.art==="offen"}">Offene Frage</button></div>
      <div class="formular" style="margin-top:10px"><label for="eQ">Fragetext</label><textarea id="eQ" rows="2" maxlength="600" placeholder="z. B. Nenne zwei Gründe, warum die Schweiz vier Landessprachen hat.">${h(E.q)}</textarea>
      ${E.art==="mc" ? `<label for="eA0">Richtige Antwort</label><input id="eA0" maxlength="200" value="${h(E.a[0])}">${[1,2,3].map(i=>`<label for="eA${i}">Falsche Antwort ${i}</label><input id="eA${i}" maxlength="200" value="${h(E.a[i])}">`).join("")}`
        : `<label for="eM">Musterlösung</label><textarea id="eM" rows="2" maxlength="1000" placeholder="erscheint nur für dich und auf dem Lösungsblatt">${h(E.m)}</textarea>
          <label for="eP">Punkte</label><input id="eP" type="number" min="1" max="20" value="${E.p}" style="width:90px"><label for="eZ">Schreiblinien (PDF)</label><input id="eZ" type="number" min="1" max="15" value="${E.z}" style="width:90px">`}</div>
      <p class="fehlertext" id="eErr" aria-live="polite"></p><button type="button" class="k p" id="eAdd">Frage hinzufügen</button>
    </div>
    <div class="box"><h2>4. Fragen im Test <span class="marke ak">${sel.length}</span></h2>
      <label class="schalter"><input type="checkbox" id="nAlleOffen" ${n.alleOffen?"checked":""}><span>Ohne Auswahlantworten: alle Fragen als offene Fragen (die Kinder schreiben die Antwort selbst)</span></label>
      ${sel.length ? `<ol class="selliste">${sel.map(f=>selItemHTML(n,f)).join("")}</ol>
        <div class="leiste" style="margin-top:8px"><span class="mu klein">Total ${total} Punkte. Mit «Bearbeiten» änderst du Fragetext, Musterlösung und Punkte.</span><button type="button" class="k klein g rechts" id="nLeeren">Alle entfernen</button></div>`
        : `<p class="mu">Noch keine Fragen. Ziehe Fragen aus dem Pool, wähle sie selbst aus oder schreibe eigene.</p>`}
    </div>
    <div class="box"><h2>5. Lehrplan 21</h2>
      <p class="mu klein">Vorschlag aus dem Thema (Zyklus ${zyklusNeu()}): ${vorschlag.length?vorschlag.map(c=>`<b>${h(c)}</b>`).join(", "):"kein Vorschlag"}${n.lpAuto?"":` <button type="button" class="linkbtn" id="lpAuto">übernehmen</button>`}</p>
      <div class="chips">${n.lp21.map(c=>`<button type="button" class="chip" data-lprm="${h(c)}" aria-label="${h(lpLabel(c))} entfernen">${h(lpLabel(c))} ✕</button>`).join("") || `<span class="mu klein">Noch kein Lehrplanbezug gewählt.</span>`}</div>
      <div class="formular" style="margin-top:10px"><label for="lpFach">Fachbereich</label><select id="lpFach">${LP21.map(x=>`<option value="${x.f}" ${x.f===fb.f?"selected":""}>${h(x.f)} ${h(x.n)} (Zyklus ${x.z.join(", ")})</option>`).join("")}</select></div>
      <div class="lpgitter">${fb.kb.map(([c,t])=>`<label><input type="checkbox" data-lp="${h(c)}" ${n.lp21.includes(c)?"checked":""}><span><b>${h(c)}</b> ${h(t)}</span></label>`).join("")}</div>
    </div>
    <div class="festleiste"><span><b>${sel.length}</b> ${sel.length===1?"Frage":"Fragen"} · ${total} Punkte · ${h(klasseVon(n.klasseId)?.name||"")}</span><span class="fehlertext" id="nErr" aria-live="polite" style="margin:0"></span>
      <button type="button" class="k p gross rechts" id="nErst" ${sel.length && sel.length<=MAX_FRAGEN?"":"disabled"}>Test erstellen</button></div>`;
  zielBinden(el);
  const merke=()=>{ const t=$("#nTitel"); if(t) n.titel=t.value; };
  const nn=fn=>neu(()=>{ merke(); fn(); });
  $("#nTitel").oninput=e=>{ n.titel=e.target.value; };
  $("#nKl").onchange=e=>nn(()=>{ n.klasseId=e.target.value; const k=klasseVon(n.klasseId); if(k?.schuljahr) n.schuljahr=k.schuljahr; lpAuto(); });
  $("#nSj").onchange=e=>nn(()=>{ n.schuljahr=e.target.value; lpAuto(); });
  $("#poolNochmal") && ($("#poolNochmal").onclick=()=>{ POOL.fehler=""; POOL.daten=null; neu(); });
  if(poolDa){
    $("#nTh").onchange=e=>nn(()=>{ n.thema=e.target.value; n.unter=""; lpAuto(); });
    $("#nSub").onchange=e=>nn(()=>{ n.unter=e.target.value.trim(); });
    $$("[data-st]", el).forEach(b=>b.onclick=()=>nn(()=>{ n.stufe=+b.dataset.st; }));
    $$("[data-mo]", el).forEach(b=>b.onclick=()=>nn(()=>{ n.modus=b.dataset.mo; }));
    $("#nAnz") && ($("#nAnz").onchange=e=>{ n.anzahl=Math.max(1,Math.min(MAX_FRAGEN,parseInt(e.target.value,10)||10)); e.target.value=n.anzahl; });
    $("#nZiehen") && ($("#nZiehen").onclick=()=>nn(()=>{ const a=Math.max(1,Math.min(MAX_FRAGEN,parseInt($("#nAnz").value,10)||10)); n.anzahl=a;
      const gesehen=new Set(); const z=mischen(pool).filter(f=>{ const k=f.q.trim().toLowerCase(); if(gesehen.has(k)) return false; gesehen.add(k); return true; }).slice(0,a);
      const eig=n.sel.filter(k=>n.fmap.get(k)?.eigen); const em=eig.map(k=>[k,n.fmap.get(k)]);
      n.fmap=new Map([...em, ...z.map(f=>[fKey(f),f])]); n.sel=[...eig, ...z.map(fKey)].slice(0,MAX_FRAGEN); }));
    if($("#nSuche")){ const inp=$("#nSuche"); let tm; inp.oninput=()=>{ clearTimeout(tm); tm=setTimeout(()=>{ merke(); n.suche=inp.value; const pos=inp.selectionStart; neu(); const x=$("#nSuche"); if(x){ x.focus(); try{ x.setSelectionRange(pos,pos); }catch(e){} } },300); }; }
    $$("[data-fq]", el).forEach(c=>c.onchange=()=>nn(()=>{ const f=liste.find(x=>fKey(x)===c.dataset.fq); if(!f) return;
      if(c.checked){ if(n.sel.length>=MAX_FRAGEN){ melde(`Höchstens ${MAX_FRAGEN} Fragen pro Test.`,"fe"); return; } if(!n.sel.includes(c.dataset.fq)){ n.sel.push(c.dataset.fq); n.fmap.set(c.dataset.fq,f); } } else n.sel=n.sel.filter(x=>x!==c.dataset.fq); }));
  }
  // eigene Frage
  const $v=id=>$(id)?.value ?? "";
  const lesen=()=>{ E.q=$v("#eQ"); if(E.art==="mc") [0,1,2,3].forEach(i=>E.a[i]=$v("#eA"+i)); else { E.m=$v("#eM"); E.p=Math.max(1,Math.min(20,+$v("#eP")||1)); E.z=Math.max(1,Math.min(15,+$v("#eZ")||3)); } };
  $$("#eQ,#eA0,#eA1,#eA2,#eA3,#eM,#eP,#eZ").forEach(x=>x.oninput=lesen);
  $$("[data-ea]", el).forEach(b=>b.onclick=()=>nn(()=>{ lesen(); E.art=b.dataset.ea; }));
  $("#eAdd").onclick=()=>{ lesen(); const err=$("#eErr"); const q=E.q.trim();
    if(q.length<3){ err.textContent="Bitte einen Fragetext schreiben."; $("#eQ").focus(); return; }
    if(E.art==="mc" && E.a.some(a=>!a.trim())){ err.textContent="Bitte alle vier Antworten ausfüllen."; return; }
    if(E.art==="mc" && new Set(E.a.map(a=>a.trim().toLowerCase())).size<4){ err.textContent="Die vier Antworten müssen verschieden sein."; return; }
    if(n.sel.length>=MAX_FRAGEN){ err.textContent=`Höchstens ${MAX_FRAGEN} Fragen pro Test.`; return; }
    const f={eigen:true, id:"e"+neueId(), art:E.art, q:ohneStrich(q), a:E.art==="mc"?E.a.map(a=>ohneStrich(a.trim())):[], m:ohneStrich(E.m.trim()), p:E.p, z:E.z, e:""};
    nn(()=>{ n.fmap.set(f.id,f); n.sel.push(f.id); n.entwurf={art:E.art, q:"", a:["","","",""], m:"", p:E.p, z:E.z}; });
    melde("Eigene Frage hinzugefügt."); };
  // Auswahl bearbeiten
  $$("[data-rm]", el).forEach(b=>b.onclick=()=>nn(()=>{ n.sel=n.sel.filter(x=>x!==b.dataset.rm); }));
  $$("[data-ed]", el).forEach(b=>b.onclick=()=>nn(()=>{ n.bearb=b.dataset.ed; }));
  if($("#edOk")){ const k=n.bearb, f=n.fmap.get(k);
    $("#edOk").onclick=()=>nn(()=>{ const q=$("#edQ").value.trim(); if(!q) return;
      if(f && f.eigen){ f.q=q; const m=$("#edM"); if(m){ f.m=m.value.trim(); f.p=+$("#edP").value||1; f.z=+$("#edZ").value||3; } }
      else { const ed=n.edit[k]=n.edit[k]||{}; if(f && q!==f.q) ed.q=q; else delete ed.q; const o=$("#edOffen"); if(o) ed.offen=o.checked;
        const m=$("#edM"); if(m){ ed.m=m.value.trim(); ed.p=+$("#edP").value||1; ed.z=+$("#edZ").value||3; } }
      n.bearb=null; });
    $("#edAb").onclick=()=>nn(()=>{ n.bearb=null; });
    $("#edOrig") && ($("#edOrig").onclick=()=>nn(()=>{ if(n.edit[k]) delete n.edit[k].q; n.bearb=null; }));
    $("#edOffen") && ($("#edOffen").onchange=()=>nn(()=>{ const ed=n.edit[k]=n.edit[k]||{}; ed.offen=$("#edOffen").checked; const q=$("#edQ").value.trim(); if(f && q && q!==f.q) ed.q=q; }));
  }
  $("#nLeeren") && ($("#nLeeren").onclick=()=>nn(()=>{ n.sel=[]; n.edit={}; }));
  $("#nAlleOffen").onchange=e=>nn(()=>{ n.alleOffen=e.target.checked; });
  $("#lpAuto") && ($("#lpAuto").onclick=()=>nn(()=>{ n.lpAuto=true; lpAuto(); }));
  $$("[data-lprm]", el).forEach(b=>b.onclick=()=>nn(()=>{ n.lpAuto=false; n.lp21=n.lp21.filter(x=>x!==b.dataset.lprm); }));
  $("#lpFach").onchange=e=>nn(()=>{ n.fach=e.target.value; });
  $$("[data-lp]", el).forEach(c=>c.onchange=()=>nn(()=>{ n.lpAuto=false; n.fach=LP21_KB[c.dataset.lp].fach; if(c.checked){ if(!n.lp21.includes(c.dataset.lp)) n.lp21.push(c.dataset.lp); } else n.lp21=n.lp21.filter(x=>x!==c.dataset.lp); }));
  $("#nErst").onclick=async()=>{
    merke(); const err=$("#nErr"); const k=klasseVon(n.klasseId);
    if(!k){ err.textContent="Bitte eine Klasse wählen."; return; }
    if(!sel.length || sel.length>MAX_FRAGEN){ err.textContent=`Bitte 1 bis ${MAX_FRAGEN} Fragen auswählen.`; return; }
    const b=$("#nErst"); b.disabled=true; err.textContent="";
    try{
      let code=""; for(let i=0;i<8;i++){ const c=neuerCode(); if(await ST.sp.codeFrei(c)){ code=c; break; } } if(!code) throw new Error("Kein freier Test-Code gefunden.");
      const titel=(n.titel.trim() || themaLabel(n.thema)+"-Test").replace(/\s+/g," ").slice(0,80);
      const t={code, klasseId:k.id, titel, schuljahr:n.schuljahr, lp21:[...n.lp21], aktiv:true, erstellt:new Date().toISOString(),
        info:{thema:n.thema, stufe:n.stufe, zyklus:zyklusNeu(), klasse:k.name}, fragen:sel.map(f=>alsTestFrage(n,f,true))};
      await ST.sp.testSpeichern(t, k); ST.daten.tests.unshift(t); ST.neu=null;
      melde(`Test erstellt. Code: ${code}`); zeige("test", code);
    }catch(e){ err.textContent=fehlerText(e); b.disabled=false; }
  };
};

/* ---------- Fragenpool lesen und Fehler melden ---------- */
SEITEN.fragen = el => {
  if(!poolSicher()){ el.innerHTML=`<h1>Fragenpool</h1>${POOL.fehler?`<div class="hinweis">${h(POOL.fehler)}</div>`:poolLadeAnzeige()}`; return; }
  const F=ST.fq, PRO=40; const ids=themaIds(F.thema); const set=ids?new Set(ids):null; const q=F.q.trim().toLowerCase(); const nrQ=/^\d+$/.test(q) ? +q : 0;
  const pool=POOL.daten.filter(f=>(!set || set.has(f.t)) && (!F.stufe || f.l===F.stufe) && (!q || (nrQ ? fNr(f)===nrQ : (f.q+" "+f.a.join(" ")+" "+(f.s||"")).toLowerCase().includes(q))));
  const seiten=Math.max(1, Math.ceil(pool.length/PRO)); F.seite=Math.min(F.seite, seiten-1);
  const liste=pool.slice(F.seite*PRO, F.seite*PRO+PRO); const imTest=new Set(ST.neu?.sel||[]);
  const blaettern=`<div class="leiste"><button type="button" class="k" data-fs="${F.seite-1}" ${F.seite?"":"disabled"}>‹ Zurück</button><span class="mu">Seite ${F.seite+1} von ${seiten.toLocaleString("de-CH")}</span><button type="button" class="k" data-fs="${F.seite+1}" ${F.seite<seiten-1?"":"disabled"}>Weiter ›</button></div>`;
  el.innerHTML=`<div class="kopfzeile"><div><h1>Fragenpool</h1><p>Alle ${POOL.daten.length.toLocaleString("de-CH")} Fragen zum Nachlesen. Die richtige Antwort ist grün. Findest du einen Fehler, tippe auf «Fehler melden».</p></div></div>
    <div class="leiste"><select id="fT" aria-label="Thema">${themaOptionen(F.thema)}</select>
      <select id="fS" aria-label="Stufe">${[[0,"Alle Stufen"],[1,"Entdecker (bis 9)"],[2,"Könner (10 bis 14)"],[3,"Profis (ab 15)"]].map(([v,n])=>`<option value="${v}" ${F.stufe===v?"selected":""}>${n}</option>`).join("")}</select>
      <input id="fQ" type="search" placeholder="Suchwort oder Fragenummer" aria-label="Suchen" value="${h(F.q)}"><span class="mu">${pool.length.toLocaleString("de-CH")} Fragen</span></div>
    ${liste.length?`${blaettern}<div class="tabwrap"><table><thead><tr><th class="r">Nr.</th><th>Frage und Antworten</th><th>Thema</th><th class="c">Stufe</th><th class="r">Aktion</th></tr></thead><tbody>
      ${liste.map(f=>{ const k=fKey(f); return `<tr><td class="r mu">${fNr(f)}</td><td style="min-width:220px"><b>${h(f.q)}</b>${f.img?` <span class="mu">(mit Bild)</span>`:""}<ul class="antw">${f.a.map((a,i)=>`<li class="${i===0?"ok":""}">${h(a)}</li>`).join("")}</ul>${f.e?`<p class="mu klein" style="margin:4px 0 0">${h(f.e)}</p>`:""}</td>
        <td>${h(themaName(f.t))}${f.s?`<br><span class="mu klein">${h(f.s)}</span>`:""}</td><td class="c">${f.l||""}</td>
        <td class="r"><div style="display:grid;gap:4px;justify-items:end"><button type="button" class="k klein" data-fm="${h(k)}">Fehler melden</button>${f.img?"":`<button type="button" class="k klein ${imTest.has(k)?"an":""}" data-ft="${h(k)}">${imTest.has(k)?"Im Test ✓":"In neuen Test"}</button>`}</div></td></tr>`; }).join("")}
    </tbody></table></div>${blaettern}`:`<div class="box">${leer("Keine Fragen gefunden.")}</div>`}
    ${ST.neu?.sel?.length?`<div class="festleiste"><span>${ST.neu.sel.length} ${ST.neu.sel.length===1?"Frage":"Fragen"} für den neuen Test gewählt</span><button type="button" class="k p rechts" data-ziel="neu">Zum neuen Test</button></div>`:""}`;
  zielBinden(el);
  $("#fT").onchange=e=>neu(()=>{ F.thema=e.target.value; F.seite=0; });
  $("#fS").onchange=e=>neu(()=>{ F.stufe=+e.target.value; F.seite=0; });
  const qi=$("#fQ"); let tm; qi.oninput=()=>{ clearTimeout(tm); tm=setTimeout(()=>{ F.q=qi.value; F.seite=0; neu(); const x=$("#fQ"); if(x){ x.focus(); x.setSelectionRange(x.value.length,x.value.length); } },350); };
  $$("[data-fs]", el).forEach(b=>b.onclick=()=>{ F.seite=+b.dataset.fs; zeichne(); scrollTo(0,0); });
  const finde=k=>liste.find(f=>fKey(f)===k);
  $$("[data-fm]", el).forEach(b=>b.onclick=()=>{ const f=finde(b.dataset.fm); if(f) meldenDialog({art:"frage", ref:fNr(f), titel:f.q}); });
  $$("[data-ft]", el).forEach(b=>b.onclick=()=>{ const f=finde(b.dataset.ft); if(!f) return; if(!ST.neu) neuStart(); const n=ST.neu, k=b.dataset.ft;
    if(n.sel.includes(k)) n.sel=n.sel.filter(x=>x!==k); else { if(n.sel.length>=MAX_FRAGEN){ melde(`Höchstens ${MAX_FRAGEN} Fragen pro Test.`,"fe"); return; } n.sel.push(k); n.fmap.set(k,f); n.modus="manuell"; }
    neu(); });
};

/* ---------- Auswertung ---------- */
SEITEN.auswertung = el => {
  const D=ST.daten; const fertig=D.abgaben.filter(a=>!a.offen);
  const stufen=[]; for(let n=1;n<=6;n+=0.5) stufen.push(n);
  const vert=stufen.map(n=>fertig.filter(a=>a.note===n).length); const vmax=Math.max(1,...vert);
  const sn=schnitt(fertig.map(a=>a.note)); const gen=fertig.length?Math.round(fertig.filter(a=>a.note>=4).length/fertig.length*100):null;
  const beteiligung=(()=>{ let soll=0, ist=0; D.tests.forEach(t=>{ const k=klasseVon(t.klasseId); soll+=(k?.schueler||[]).length; ist+=abgabenVon(t.code).length; }); return soll?Math.round(ist/soll*100):null; })();
  const reihen=D.klassen.map((k,i)=>{ const codes=new Set(testsVon(k.id).map(t=>t.code)); return {name:k.name, farbe:FARBEN[i%FARBEN.length], punkte:wochenSchnitt(D.abgaben.filter(a=>codes.has(a.code)))}; }).filter(r=>r.punkte.length);
  el.innerHTML=`<div class="kopfzeile"><div><h1>Auswertung</h1><p>Alle Klassen und Tests zusammen. Vorläufige Noten (offene Fragen noch nicht korrigiert) zählen hier nicht mit.</p></div></div>
    ${kacheln([["Abgaben", zahl(D.abgaben.length), `${zahl(fertig.length)} fertig bewertet`, "ak"],["Ø Note", fmtNote(sn), "alle Klassen", sn==null?"":sn>=4.5?"ok":sn>=4?"wa":"fe"],["Genügend", gen==null?"·":gen+" %", "Note 4 oder besser", gen==null?"":gen>=80?"ok":gen>=60?"wa":"fe"],["Beteiligung", beteiligung==null?"·":beteiligung+" %", "Abgaben pro Kind und Test", beteiligung==null?"":beteiligung>=85?"ok":beteiligung>=60?"wa":"fe"],["Zu korrigieren", zahl(offeneKorrekturen()), "Abgaben", offeneKorrekturen()?"wa":"ok", "korrigieren"]])}
    <div class="spalten" style="margin-top:12px">
      <div class="box"><h2>Notenverteilung</h2>${fertig.length?`<div class="verteilung" role="img" aria-label="Notenverteilung">${stufen.map((n,i)=>`<div title="Note ${fmtNote(n)}: ${vert[i]}"><b>${vert[i]||""}</b><i class="${n<4?"tief":""}" style="height:${Math.round(vert[i]/vmax*100)}%"></i></div>`).join("")}</div><div class="achse">${stufen.map(n=>`<span>${Number.isInteger(n)?n:""}</span>`).join("")}</div>`:`<p class="mu">Noch keine bewerteten Abgaben.</p>`}</div>
      <div class="box"><h2>Notenverlauf pro Klasse</h2>${verlaufSVG(reihen, "Notenverlauf pro Klasse")}</div>
    </div>
    <div class="box"><h2>Klassenvergleich</h2>${D.klassen.length?`<div class="tabwrap"><table><thead><tr><th>Klasse</th><th class="r">Kinder</th><th class="r">Tests</th><th class="r">Abgaben</th><th class="r">Beteiligung</th><th class="r">Ø Note</th><th class="r">Genügend</th><th>Schwierigstes Thema</th></tr></thead><tbody>
      ${D.klassen.map(k=>{ const ts=testsVon(k.id), codes=new Set(ts.map(t=>t.code)), ab=D.abgaben.filter(a=>codes.has(a.code)), fe=ab.filter(a=>!a.offen); const s=schnitt(fe.map(a=>a.note)); const soll=ts.length*(k.schueler||[]).length; const th=themenQuote(ts, ab).filter(x=>x.falsch>0)[0];
        return `<tr class="klick" data-ziel="klasse/${h(k.id)}"><td><b>${h(k.name)}</b></td><td class="r">${(k.schueler||[]).length}</td><td class="r">${ts.length}</td><td class="r">${ab.length}</td><td class="r">${soll?Math.round(ab.length/soll*100)+" %":"·"}</td><td class="r"><span class="note ${noteKlasse(s)}">${fmtNote(s)}</span></td><td class="r">${fe.length?Math.round(fe.filter(a=>a.note>=4).length/fe.length*100)+" %":"·"}</td><td>${th?`${h(themaName(th.t))} <span class="mu">(${Math.round(th.quote*100)} % falsch)</span>`:`<span class="mu">·</span>`}</td></tr>`; }).join("")}
    </tbody></table></div>`:`<p class="mu">Noch keine Klassen.</p>`}</div>
    <div class="spalten"><div class="box"><h2>Themen mit den meisten Fehlern</h2>${themenBalken(themenQuote(D.tests, D.abgaben))}</div>
      <div class="box"><h2>Schwierigste Fragen</h2>${fehlerListe(fehlerAnalyse(D.tests, D.abgaben), 8)}</div></div>
    <div class="box"><h2>Tests im Vergleich</h2>${D.tests.length?`<div class="tabwrap"><table><thead><tr><th>Test</th><th>Klasse</th><th class="r">Abgaben</th><th class="r">Ø Note</th><th class="r">Ø Zeit</th><th style="min-width:120px">Ø Punkte</th></tr></thead><tbody>
      ${D.tests.map(t=>{ const k=klasseVon(t.klasseId), ab=abgabenVon(t.code), fe=ab.filter(a=>!a.offen), s=schnitt(fe.map(a=>a.note)), p=schnitt(fe.map(a=>a.punkte/(a.max||1))), z=schnitt(ab.map(a=>a.dauer||0));
        return `<tr class="klick" data-ziel="test/${h(t.code)}"><td><b>${h(t.titel)}</b></td><td>${h(k?.name||"")}</td><td class="r">${ab.length}/${(k?.schueler||[]).length}</td><td class="r"><span class="note ${noteKlasse(s)}">${fmtNote(s)}</span></td><td class="r nowrap">${ab.length?h(zeit(z)):"·"}</td><td>${p!=null?`<div class="balkenzeile" style="grid-template-columns:minmax(40px,1fr) 44px"><span class="mini"><i style="width:${Math.round(p*100)}%"></i></span><span class="r">${Math.round(p*100)} %</span></div>`:`<span class="mu">·</span>`}</td></tr>`; }).join("")}
    </tbody></table></div>`:`<p class="mu">Noch keine Tests.</p>`}</div>`;
  zielBinden(el);
};

/* ---------- Klassen-Liga ---------- */
const LIGA = {woche:"jetzt", kanton:"", cache:{}, laedt:{}, fehler:"", meine:null, meineLaedt:false, offen:null, info:""};
const fmtPkt = n => { const x=Math.round((+n||0)*10)/10; try{ return x.toLocaleString("de-CH",{minimumFractionDigits:1, maximumFractionDigits:1}); }catch(e){ return x.toFixed(1); } };
const MEDAILLE = {1:"Gold", 2:"Silber", 3:"Bronze"};
const LIGA_FEHLER = {konto:"Bitte melde dich zuerst an.", klasse:"Diese Klasse gehört nicht zu deinem Konto.", name:"Der Anzeigename braucht 2 bis 40 Zeichen, ohne E-Mail-Adresse oder Link.",
  kanton:"Bitte einen Kanton aus der Liste wählen.", klein:`Für die Liga braucht die Klasse mindestens ${LIGA_MIN} eingetragene Kinder.`, viele:"Du hast schon 30 Klassen in der Liga.", daten:"Das hat nicht geklappt."};
function ligaFehlerText(e){ const m=String(e?.message||e||"");
  if(/PGRST202|42883|42P01|could not find the function|liga_klassen|does not exist|schema cache/i.test(m)) return "Die Klassen-Liga ist in Supabase noch nicht eingerichtet. Bitte supabase/klassenliga.sql im SQL Editor ausführen (ANLEITUNG-SUPABASE.md, Schritt 7).";
  return fehlerText(e); }
// Erfundene Vergleichsklassen für die Vorschau ohne Online-Datenbank (klar als Beispiel markiert)
const LIGA_BSP = {
  jetzt:[["5b Grenchen","SO",2,9.6,22,19],["6a Wil","SG",2,8.1,19,16],["4c Bern Kirchenfeld","BE",2,7.4,24,20],["3b Chur","GR",2,6.0,18,14],["2. Sek Aarau","AG",3,5.2,23,16],["5a Luzern","LU",2,4.1,20,12],["4b Frauenfeld","TG",2,2.9,17,9],["6c Zürich Wipkingen","ZH",2,1.8,25,10]],
  vor:[["6a Wil","SG",2,11.3,19,19],["5b Grenchen","SO",2,9.0,22,19],["2. Sek Aarau","AG",3,8.2,23,20],["4c Bern Kirchenfeld","BE",2,6.5,24,17],["3b Chur","GR",2,5.1,18,12],["6c Zürich Wipkingen","ZH",2,3.6,25,13]]
};
function mitPlatz(l){ const s=[...l].sort((a,b)=>b.punkte-a.punkte || String(a.anzeige).localeCompare(String(b.anzeige),"de")); let p=0, last=null; return s.map((x,i)=>{ if(x.punkte!==last){ p=i+1; last=x.punkte; } return {...x, platz:p}; }); }
// Eigene Klassen lokal berechnet: Testpunkte der Woche (pro Kind höchstens 150) / Anzahl eingetragene Kinder
function ligaLokal(wocheKey){
  const D=ST.daten; const out=[];
  D.klassen.forEach(k=>{ const kids=k.schueler||[]; if(kids.length<LIGA_MIN) return; const ids=new Set(kids.map(s=>s.id)); const codes=new Set(testsVon(k.id).map(t=>t.code)); const pro={};
    D.abgaben.forEach(a=>{ if(!codes.has(a.code) || !ids.has(a.sid) || isoWoche(new Date(a.datum)).key!==wocheKey) return; pro[a.sid]=(pro[a.sid]||0)+(+a.punkte||0); });
    const sum=Object.values(pro).reduce((s,x)=>s+Math.min(150,x),0);
    out.push({id:"eigen-"+k.id, anzeige:k.name, kanton:ST.konto.kanton||"", zyklus:k.zyklus, punkte:Math.round(sum/kids.length*10)/10, kinder:kids.length, aktiv:Object.keys(pro).length, eigen:true}); });
  return out;
}
function ligaVorschau(woche, kanton){
  const W=ligaWochen(); const key=(woche==="vor"?W.vor:W.jetzt).key;
  const bsp=(LIGA_BSP[woche]||[]).map(([anzeige,kt,zy,pk,ki,ak])=>({id:"bsp-"+anzeige, anzeige, kanton:kt, zyklus:zy, punkte:pk, kinder:ki, aktiv:ak}));
  return mitPlatz([...bsp, ...ligaLokal(key)].filter(x=>!kanton || x.kanton===kanton));
}
function ligaListeHTML(liste, leerText){
  if(!liste.length) return `<p class="mu">${h(leerText||"Diese Woche hat noch keine Klasse Punkte gesammelt.")}</p>`;
  const top=Math.max(0.1, liste[0].punkte); const zeigen=liste.filter((x,i)=>i<30 || x.eigen);
  return `<ol class="liga" aria-label="Rangliste">${zeigen.map((x,i)=>{ const m=MEDAILLE[x.platz], p=Math.max(3, Math.round(x.punkte/top*100)); const luecke=i>0 && liste.indexOf(x)!==liste.indexOf(zeigen[i-1])+1;
    return `${luecke?`<li class="luecke" aria-hidden="true">⋯</li>`:""}<li class="${m?"p"+x.platz:""} ${x.eigen?"eigen":""}" ${x.eigen?'aria-current="true"':""}>
      <span class="platz"><span class="sr">Platz </span>${x.platz}</span>
      <span><span class="name">${h(x.anzeige)}</span> ${x.eigen?`<span class="marke ak">Deine Klasse</span>`:""} ${m?`<span class="marke wa">${m}-Abzeichen</span>`:""}
        <small>${x.kanton?h(ktName(x.kanton))+" · ":""}${x.zyklus?"Zyklus "+h(x.zyklus)+" · ":""}${h(x.aktiv)} von ${h(x.kinder)} Kindern aktiv</small><span class="mini" aria-hidden="true"><i style="width:${p}%"></i></span></span>
      <span class="pkt"><b>${fmtPkt(x.punkte)}</b><small>Punkte pro Kind</small></span></li>`; }).join("")}</ol>`;
}
function ligaFilterHTML(W){
  return `<div class="leiste"><div class="segs" role="group" aria-label="Woche"><button type="button" data-lw="jetzt" aria-pressed="${LIGA.woche==="jetzt"}">Diese Woche · KW ${W.jetzt.kw}</button><button type="button" data-lw="vor" aria-pressed="${LIGA.woche==="vor"}">Vorwoche · KW ${W.vor.kw}</button></div>
    <select id="lzKt" aria-label="Kanton"><option value="">Ganze Schweiz</option>${KT_STD.slice().sort((a,b)=>a[1].localeCompare(b[1],"de")).map(([c,n])=>`<option value="${h(c)}" ${LIGA.kanton===c?"selected":""}>${h(n)}</option>`).join("")}</select></div>`;
}
function ligaFilterBinden(el){
  $$("[data-lw]", el).forEach(b=>b.onclick=()=>neu(()=>{ LIGA.woche=b.dataset.lw; }));
  const k=$("#lzKt"); k && (k.onchange=()=>neu(()=>{ LIGA.kanton=k.value; }));
}
const ligaRegeln = () => `<details class="box regeln"><summary>So werden die Punkte berechnet</summary>
  <ul><li>Gezählt werden die <b>Testpunkte</b> aller Abgaben der Kinder einer Klasse in der Kalenderwoche (Montag bis Sonntag). Bei Auswahlfragen gibt jede richtige Antwort 1 Punkt, offene Fragen zählen mit den Punkten aus deiner Korrektur.</li>
  <li>Pro Kind zählen höchstens 150 Punkte pro Woche.</li>
  <li>Die Summe wird durch die Anzahl <b>eingetragener Kinder</b> geteilt. So sind kleine und grosse Klassen vergleichbar.</li>
  <li>Mitmachen können Klassen ab ${LIGA_MIN} Kindern. Öffentlich sind nur Anzeigename, Kanton, Zyklus, Punkte pro Kind und wie viele Kinder aktiv waren, nie Namen oder einzelne Resultate.</li>
  <li>Die drei besten Klassen der Woche bekommen ein Gold-, Silber- oder Bronze-Abzeichen.</li></ul></details>`;
function ligaKindKarte(x, liste, beispiel){
  const W=ligaWochen().jetzt; let haupt, sub, p=0;
  if(x){ const top=Math.max(0.1, liste[0].punkte); p=Math.max(6, Math.round(x.punkte/top*100)); const vor=[...liste].reverse().find(y=>y.platz<x.platz);
    haupt=`Platz ${x.platz} von ${liste.length}`; sub=!vor ? "Eure Klasse ist ganz vorne. Super gemacht!" : `Noch ${fmtPkt(Math.max(0.1, vor.punkte-x.punkte))} Punkte pro Kind bis Platz ${vor.platz}. Jeder Test hilft mit!`; }
  else { haupt="Noch keine Punkte"; sub="Diese Woche zählt jeder gelöste Test."; }
  return `<div class="kindkarte"><img src="../img/kids/duo-jubel.webp" alt="" width="84" height="84"><div><small>Klassen-Liga · KW ${W.kw}${beispiel?" · Beispiel":""}</small><b>${h(x?.anzeige||"Deine Klasse")}</b><span>${h(haupt)}</span><span class="mini" aria-hidden="true"><i style="width:${p}%"></i></span><small>${h(sub)}</small></div></div>`;
}
function ligaLaden(key, kanton){
  const ck=key+"|"+(kanton||"");
  if(LIGA.cache[ck] || LIGA.laedt[ck] || !ST.sp?.liga) return LIGA.cache[ck]||null;
  LIGA.laedt[ck]=true;
  ST.sp.ligaRangliste(key, kanton).then(l=>{ LIGA.cache[ck]={liste:l, zeit:Date.now()}; LIGA.fehler=""; })
    .catch(e=>{ console.warn("Liga", e); LIGA.fehler=ligaFehlerText(e); LIGA.cache[ck]={liste:[], fehler:true}; })
    .finally(()=>{ delete LIGA.laedt[ck]; if(ST.tab==="liga"||ST.tab==="klasse") neu(); });
  return null;
}
function ligaMeineLaden(){
  if(LIGA.meine || LIGA.meineLaedt || !ST.sp?.liga) return; LIGA.meineLaedt=true;
  ST.sp.ligaMeine().then(l=>{ LIGA.meine=l||[]; }).catch(e=>{ LIGA.meine=[]; LIGA.fehler=ligaFehlerText(e); }).finally(()=>{ LIGA.meineLaedt=false; if(ST.tab==="liga"||ST.tab==="klasse") neu(); });
}
function ligaNeuLaden(){ LIGA.cache={}; LIGA.meine=null; LIGA.fehler=""; }
function ligaKlasseText(k){
  const n=(k.schueler||[]).length;
  if(!ST.sp.liga){ const l=ligaVorschau("jetzt",""); const x=l.find(y=>y.id==="eigen-"+k.id);
    return `<p class="klein">${n<LIGA_MIN?`Ab ${LIGA_MIN} Kindern kann die Klasse mitmachen.`:x?`Vorschau: diese Woche Platz ${x.platz} mit ${fmtPkt(x.punkte)} Punkten pro Kind (verglichen mit Beispielklassen).`:""} Die echte Liga braucht die Online-Datenbank.</p><button type="button" class="k klein" data-ziel="liga">Zur Klassen-Liga</button>`; }
  return `<p class="klein" id="kLigaText">Wird geladen …</p><button type="button" class="k klein" data-ziel="liga">Zur Klassen-Liga</button>`;
}
function ligaKlasseNachladen(k){
  if(!ST.sp.liga) return; ligaMeineLaden(); const a=(LIGA.meine||[]).find(m=>m.klasse_id===k.id); const W=ligaWochen(); const c=a?ligaLaden(W.jetzt.key,""):null; const j=c?.liste?.find(x=>x.id===a.liga_id);
  const t=$("#kLigaText"); if(!t) return;
  t.textContent = !LIGA.meine ? "Wird geladen …" : !a ? "Diese Klasse ist nicht in der Liga angemeldet. Mitmachen ist freiwillig." : a.gesperrt ? `Als «${a.anzeige}» angemeldet, von der Verwaltung ausgeblendet.` : `Als «${a.anzeige}» angemeldet · ${j?`diese Woche Platz ${j.platz} mit ${fmtPkt(j.punkte)} Punkten pro Kind`:"diese Woche noch keine Punkte"}.`;
}
SEITEN.liga = el => {
  const W=ligaWochen(), wk=LIGA.woche==="vor"?W.vor:W.jetzt, D=ST.daten;
  const kopf=`<div class="kopfzeile"><div><h1>Klassen-Liga</h1><p>Klasse gegen Klasse: Jede Woche zählen die Testpunkte eurer Kinder, geteilt durch die Anzahl Kinder der Klasse. Mitmachen ist freiwillig.</p></div></div>`;
  if(!ST.sp.liga){
    const liste=ligaVorschau(LIGA.woche, LIGA.kanton); const jetzt=ligaVorschau("jetzt",""); const eig=jetzt.find(x=>x.eigen);
    el.innerHTML=`${kopf}
      <div class="hinweis ak"><b>Die echte Klassen-Liga braucht die Online-Datenbank.</b><p>Damit Klassen von verschiedenen Schulen gegeneinander spielen, müssen die Punkte an einem gemeinsamen Ort zusammenkommen. ${ST.konto.art==="test"?"Im Testzugang":"Im Moment"} speichert easyplay alles nur auf diesem Gerät. Unten siehst du eine Vorschau: Deine Klassen sind mit ihren echten Punkten dieser Woche berechnet, die anderen Klassen sind erfunden.</p></div>
      <div class="box"><h2>Vorschau Rangliste KW ${wk.kw}</h2><p class="bspband" role="note">Beispiel: Die Vergleichsklassen und ihre Punkte sind erfunden.</p>
        ${ligaFilterHTML(W)}${ligaListeHTML(liste, "In diesem Kanton gibt es in der Vorschau keine Klasse.")}</div>
      <div class="spalten"><div class="box"><h2>So sehen es die Kinder</h2><p class="mu klein">Nach einem Test sehen die Kinder den Platz ihrer Klasse (Beispiel):</p>${ligaKindKarte(eig||jetzt[3]||jetzt[0], jetzt, true)}</div>
        <div class="box"><h2>Meine Klassen</h2>${D.klassen.length?`<ul class="liste">${D.klassen.map(k=>{ const n=(k.schueler||[]).length, x=jetzt.find(y=>y.id==="eigen-"+k.id); return `<li><span><b>${h(k.name)}</b><small>${n} Kinder · ${n<LIGA_MIN?`ab ${LIGA_MIN} Kindern möglich`:x?`Vorschau: Platz ${x.platz}, ${fmtPkt(x.punkte)} Punkte pro Kind`:""}</small></span><button type="button" class="k klein" disabled title="braucht die Online-Datenbank">Anmelden</button></li>`; }).join("")}</ul><p class="mu klein">Anmelden geht, sobald Supabase verbunden ist (ANLEITUNG-SUPABASE.md, Schritt 7).</p>`:`<p class="mu">Noch keine Klasse.</p>`}</div></div>
      ${ligaRegeln()}`;
    ligaFilterBinden(el); return;
  }
  ligaMeineLaden();
  const daten=ligaLaden(wk.key, LIGA.kanton), jetztAlle=ligaLaden(W.jetzt.key,""), vorAlle=ligaLaden(W.vor.key,"");
  const meine=LIGA.meine||[], meineIds=new Set(meine.map(m=>m.liga_id));
  const platzVon=(c,id)=>c?.liste?.find(x=>x.id===id)||null;
  const klassenHTML = !LIGA.meine ? laden("Anmeldungen werden geladen …") : !D.klassen.length ? `<p class="mu">Lege zuerst eine Klasse an.</p>` :
    `<ul class="liste">${D.klassen.map(k=>{ const a=meine.find(m=>m.klasse_id===k.id), n=(k.schueler||[]).length, j=a&&platzVon(jetztAlle,a.liga_id), v=a&&platzVon(vorAlle,a.liga_id), mv=v&&MEDAILLE[v.platz];
      const status = !a ? (n<LIGA_MIN?`Nicht angemeldet. Ab ${LIGA_MIN} Kindern möglich (jetzt ${n}).`:"Nicht angemeldet.") : a.gesperrt ? `Als «${h(a.anzeige)}» angemeldet, aber von der Verwaltung ausgeblendet.`
        : `Als «${h(a.anzeige)}»${a.kanton?" · "+h(ktName(a.kanton)):""} · ${j?`diese Woche Platz ${j.platz} (${fmtPkt(j.punkte)} Punkte pro Kind)`:"diese Woche noch keine Punkte"}${mv?` · ${mv}-Abzeichen der Vorwoche`:""}`;
      const form = LIGA.offen===k.id ? `<div style="flex-basis:100%" class="formular"><label for="lzName">Anzeigename</label><input id="lzName" maxlength="40" value="${h(a?.anzeige||k.name)}" placeholder="z. B. 5b Solothurn">
          <label for="lzKanton">Kanton</label><select id="lzKanton"><option value="">ohne Kanton</option>${KT_STD.map(([c,nm])=>`<option value="${h(c)}" ${(a?.kanton||ST.konto.kanton||"")===c?"selected":""}>${h(nm)}</option>`).join("")}</select>
          <span></span><span class="mu klein">Der Anzeigename ist öffentlich. Nimm Klasse und Ort oder Schulhaus, keine Namen von Kindern oder Lehrpersonen.</span>
          <span></span><div><p class="fehlertext" id="lzErr" aria-live="polite"></p><div class="leiste"><button type="button" class="k p" id="lzSave" data-k="${h(k.id)}">${a?"Speichern":"Für die Liga anmelden"}</button><button type="button" class="k" id="lzAbbr">Abbrechen</button></div></div></div>` : "";
      return `<li><span><b>${h(k.name)}</b><small>${status}</small></span><span>${a?`<button type="button" class="k klein" data-lze="${h(k.id)}">Ändern</button> ${a.gesperrt?"":`<button type="button" class="k klein g" data-lzab="${h(k.id)}">Abmelden</button>`}`:`<button type="button" class="k klein p" data-lze="${h(k.id)}" ${n<LIGA_MIN?"disabled":""}>Anmelden</button>`}</span>${form}</li>`; }).join("")}</ul>`;
  const anz=daten?daten.liste.map(x=>({...x, eigen:meineIds.has(x.id)})):null;
  el.innerHTML=`${kopf}${LIGA.fehler?`<div class="hinweis">${h(LIGA.fehler)}</div>`:""}${LIGA.info?`<div class="hinweis gruen" role="status">${h(LIGA.info)}</div>`:""}
    <div class="box"><h2>Meine Klassen in der Liga</h2>${klassenHTML}</div>
    <div class="box"><h2>Rangliste KW ${wk.kw}${LIGA.kanton?" · "+h(ktName(LIGA.kanton)):""}</h2>${ligaFilterHTML(W)}
      ${anz?ligaListeHTML(anz, LIGA.kanton?"In diesem Kanton hat diese Woche noch keine Klasse Punkte.":"Diese Woche hat noch keine Klasse Punkte gesammelt. Der erste Test zählt!"):laden("Rangliste wird geladen …")}
      <div class="leiste" style="margin-top:10px"><button type="button" class="k" id="lzReload">Aktualisieren</button></div></div>
    ${ligaRegeln()}`;
  LIGA.info=""; ligaFilterBinden(el);
  $("#lzReload").onclick=()=>neu(ligaNeuLaden);
  $$("[data-lze]", el).forEach(b=>b.onclick=()=>{ neu(()=>{ LIGA.offen=LIGA.offen===b.dataset.lze?null:b.dataset.lze; }); const i=$("#lzName"); i&&i.focus(); });
  $("#lzAbbr") && ($("#lzAbbr").onclick=()=>neu(()=>{ LIGA.offen=null; }));
  $("#lzSave") && ($("#lzSave").onclick=async()=>{ const b=$("#lzSave"), err=$("#lzErr"); const name=$("#lzName").value.replace(/\s+/g," ").trim();
    if(name.length<2 || name.length>40 || /[@<>{}]|https?:|www\./i.test(name)){ err.textContent=LIGA_FEHLER.name; return; }
    const kid=(klasseVon(b.dataset.k)?.schueler||[]).map(s=>s.name.toLowerCase());
    if(kid.some(n=>n.length>=3 && new RegExp(`(^|[^a-zäöü])${n.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}([^a-zäöü]|$)`,"i").test(name))){ err.textContent="Bitte keine Namen von Kindern im Anzeigenamen."; return; }
    b.disabled=true; err.textContent="Wird gespeichert …";
    try{ const r=await ST.sp.ligaAnmelden(b.dataset.k, name, $("#lzKanton").value); if(!r || r.fehler){ err.textContent=LIGA_FEHLER[r?.fehler]||LIGA_FEHLER.daten; b.disabled=false; return; }
      LIGA.offen=null; LIGA.info=`«${r.anzeige||name}» ist in der Klassen-Liga angemeldet.`; ligaNeuLaden(); neu(); }catch(e){ err.textContent=ligaFehlerText(e); b.disabled=false; } });
  $$("[data-lzab]", el).forEach(b=>b.onclick=async()=>{ const k=klasseVon(b.dataset.lzab); if(!k || !await bestaetige("Aus der Liga abmelden?", `«${k.name}» erscheint dann nicht mehr in der Rangliste.`, "Abmelden", true)) return;
    try{ await ST.sp.ligaAbmelden(k.id); LIGA.info=`«${k.name}» ist abgemeldet.`; ligaNeuLaden(); neu(); }catch(e){ melde(ligaFehlerText(e),"fe"); } });
};

/* ---------- Fehlermeldungen an die Verwaltung ---------- */
const MELD_GRUND = ["Antwort ist falsch","Mehrere Antworten richtig","Frage ist unklar","Tipp- oder Rechtschreibfehler","Inhalt ist veraltet","Nicht kindgerecht","Anderes"];
async function meldungSenden(m){
  const test=ST.konto.art==="test"; let gesendet=false;
  if(SUPA && !test){
    try{ let tok=null; try{ tok=AUTH.sb ? (await AUTH.sb.auth.getSession())?.data?.session?.access_token : null; }catch(e){}
      const r=await fetch(CFG.supabaseUrl.replace(/\/$/,"")+"/rest/v1/rpc/fehler_melden",{method:"POST",headers:{apikey:CFG.supabaseKey, Authorization:"Bearer "+(tok||CFG.supabaseKey), "Content-Type":"application/json"},
        body:JSON.stringify({p_art:m.art, p_ref:String(m.ref||""), p_titel:String(m.titel||"").slice(0,300), p_grund:m.grund, p_text:String(m.text||"").slice(0,2000)})});
      gesendet=r.ok; }catch(e){}
  }
  const key=test?LT_MELD:LS_MELD; const l=lsGet(key,[]); const liste=Array.isArray(l)?l:[]; liste.unshift({...m, id:neueId(), datum:new Date().toISOString(), gesendet}); lsSet(key, liste.slice(0,300));
  return gesendet;
}
function meldenDialog(m){
  dialog(`<h2 id="dlgTitel">Fehler melden</h2><p class="mu klein" style="margin:0 0 6px">${h(m.titel||"")}</p>
    <form id="mForm"><label for="mG">Was stimmt nicht?</label><select id="mG">${MELD_GRUND.map(g=>`<option>${h(g)}</option>`).join("")}</select>
    <label for="mT">Beschreibung (was wäre richtig?)</label><textarea id="mT" rows="4" maxlength="2000" placeholder="z. B. Richtig wäre 1848, nicht 1291."></textarea>
    ${ST.konto.art==="test"?`<p class="mu klein">Im Testzugang wird die Meldung nur auf diesem Gerät gespeichert und nicht gesendet.</p>`:""}
    <div class="knoepfe"><button type="button" class="k" id="mAb">Abbrechen</button><button type="submit" class="k p" id="mOk">Melden</button></div></form>`,
  d=>{ $("#mAb", d).onclick=schliesse;
    $("#mForm", d).onsubmit=async e=>{ e.preventDefault(); $("#mOk", d).disabled=true;
      const ok=await meldungSenden({art:m.art, ref:m.ref, titel:m.titel, grund:$("#mG", d).value, text:$("#mT", d).value.trim()});
      schliesse(); melde(ok ? "Danke! Die Meldung ist bei der Verwaltung eingegangen." : ST.konto.art==="test" ? "Gespeichert (Testzugang, nicht gesendet)." : "Gespeichert. Unter «Fehlermeldungen» kannst du sie per E-Mail senden."); navZeichnen(); }; });
}
SEITEN.meldungen = el => {
  const test=ST.konto.art==="test", key=test?LT_MELD:LS_MELD; const l=meldungenListe(), offen=l.filter(m=>!m.gesendet);
  el.innerHTML=`<div class="kopfzeile"><div><h1>Fehlermeldungen</h1><p>Fehler, die du im Fragenpool gemeldet hast. ${SUPA&&!test?"Mit Supabase gehen sie direkt an die Verwaltung.":"Ohne Online-Datenbank kannst du sie hier per E-Mail an die Verwaltung senden."}</p></div>
      <div class="leiste"><button type="button" class="k p" id="mMail" ${offen.length&&!test?"":"disabled"}>Offene per E-Mail senden (${offen.length})</button><button type="button" class="k" data-ziel="fragen">Zum Fragenpool</button>${l.length?`<button type="button" class="k g" id="mLeer">Liste leeren</button>`:""}</div></div>
    ${test?`<div class="hinweis ak">Im Testzugang werden Meldungen nicht an die Verwaltung gesendet.</div>`:""}
    ${l.length?`<div class="tabwrap"><table><thead><tr><th>Datum</th><th>Wo</th><th>Frage</th><th>Grund und Beschreibung</th><th>Status</th><th class="r">Aktion</th></tr></thead><tbody>
      ${l.map(m=>`<tr><td class="nowrap">${datum(m.datum)}</td><td class="nowrap">${m.art==="frage"?`Frage Nr. ${h(m.ref)}`:h(m.ref)}</td><td>${h(m.titel)}</td><td><b>${h(m.grund)}</b>${m.text?`<br><span class="mu">${h(m.text)}</span>`:""}</td><td>${m.gesendet?`<span class="marke ok">gesendet</span>`:`<span class="marke wa">offen</span>`}</td><td class="r"><button type="button" class="k klein" data-mdel="${h(m.id)}">Löschen</button></td></tr>`).join("")}
    </tbody></table></div>`:`<div class="box">${leer("Noch keine Meldungen. Im Fragenpool gibt es bei jeder Frage den Knopf «Fehler melden».", `<button type="button" class="k" data-ziel="fragen">Zum Fragenpool</button>`)}</div>`}`;
  zielBinden(el);
  $("#mMail").onclick=()=>{ const txt=offen.map((m,i)=>`${i+1}. ${m.art==="frage"?"Frage Nr. "+m.ref:m.ref}\n   ${m.titel}\n   Grund: ${m.grund}${m.text?"\n   "+m.text:""}`).join("\n\n");
    location.href=`mailto:${adminMail()}?subject=${encodeURIComponent("easyplay: "+offen.length+" Fehlermeldung"+(offen.length===1?"":"en"))}&body=${encodeURIComponent("Hallo\n\nIch habe folgende Fehler gefunden:\n\n"+txt+"\n\nFreundliche Grüsse")}`;
    lsSet(key, l.map(m=>({...m, gesendet:true}))); setTimeout(()=>neu(), 400); };
  $("#mLeer") && ($("#mLeer").onclick=async()=>{ if(!await bestaetige("Liste leeren?", "Alle Meldungen aus dieser Liste löschen?", "Leeren", true)) return; lsSet(key, []); neu(); });
  $$("[data-mdel]", el).forEach(b=>b.onclick=()=>{ lsSet(key, meldungenListe().filter(m=>m.id!==b.dataset.mdel)); neu(); });
};

/* ---------- Einstellungen ---------- */
SEITEN.einstellungen = el => {
  const k=ST.konto, test=k.art==="test", D=ST.daten;
  const art = test ? "Testzugang (nur dieses Gerät)" : k.art==="supabase" ? "easyplay-Konto (Supabase)" : "Konto auf diesem Gerät";
  el.innerHTML=`<div class="kopfzeile"><div><h1>Einstellungen</h1><p>Konto, Speicher und Daten.</p></div></div>
    <div class="spalten">
      <div class="box"><h2>Konto</h2><div class="formular"><span class="mu">Name</span><span>${h(k.name||"")}</span><span class="mu">E-Mail</span><span>${h(k.email||"")}</span><span class="mu">Art</span><span>${h(art)}</span><span class="mu">Rolle</span><span>Lehrperson</span>${k.kanton?`<span class="mu">Kanton</span><span>${h(ktName(k.kanton))}</span>`:""}</div>
        <div class="leiste" style="margin-top:12px"><button type="button" class="k" id="esAus">Abmelden</button><a class="k" href="../">Zu easyplay</a></div></div>
      ${test?`<div class="box"><h2>Testzugang</h2><p>Benutzer <code>${TEST_MAIL}</code>, Passwort <code>${TEST_PW}</code>. Die Beispieldaten liegen nur in diesem Browser (Schlüssel «ep-lt-…») und mischen sich nie mit echten Konten.</p>
        <p class="mu klein">${brueckeAktiv()?"Damit Kinder die Test-Codes auf diesem Gerät in easyplay lösen können, sind die Testklassen und Tests zusätzlich mit der Kennung «Testzugang» im lokalen Lehrer-Speicher der Hauptseite hinterlegt. «Testdaten zurücksetzen» entfernt sie dort ebenfalls.":"Weil easyplay mit Supabase verbunden ist, können Kinder Codes aus dem Testzugang nicht lösen."}</p>
        <div class="leiste"><button type="button" class="k g" id="esReset">Testdaten zurücksetzen</button></div></div>`
      :`<div class="box"><h2>Passwort ändern</h2><form id="pwForm" class="formular" novalidate>${k.art==="lokal"?`<label for="pwAlt">Aktuelles Passwort</label><input id="pwAlt" type="password" autocomplete="current-password">`:""}
        <label for="pwNeu">Neues Passwort</label><input id="pwNeu" type="password" autocomplete="new-password" minlength="8"><label for="pwNeu2">Wiederholen</label><input id="pwNeu2" type="password" autocomplete="new-password">
        <span></span><div><p class="fehlertext" id="pwErr" aria-live="polite"></p><button type="submit" class="k p" id="pwGo">Passwort ändern</button></div></form></div>`}
      <div class="box"><h2>Speicher</h2><p>${test?"Testzugang: alles bleibt in diesem Browser.":k.art==="supabase"?"Klassen, Tests und Resultate liegen in der easyplay-Datenbank (Supabase). Kinder können auf jedem Gerät lösen.":"Klassen, Tests und Resultate liegen in diesem Browser. Kinder müssen am selben Gerät lösen. Beim Löschen der Browserdaten ist alles weg: Mach ab und zu eine Sicherung."}</p>
        <p class="mu klein">${D.klassen.length} Klassen · ${D.klassen.reduce((s,x)=>s+(x.schueler||[]).length,0)} Kinder · ${D.tests.length} Tests · ${D.abgaben.length} Abgaben</p>
        <div class="leiste"><button type="button" class="k" id="esExport">Sicherung herunterladen (JSON)</button><button type="button" class="k" id="esReload">Daten neu laden</button></div></div>
      <div class="box"><h2>So lösen Kinder einen Test</h2><ol style="margin:0;padding-left:18px"><li>easyplay öffnen (gleiches Gerät, falls ohne Online-Datenbank).</li><li>Im Menü oder auf der Startseite «Test mit Code» wählen, oder den Link des Tests öffnen.</li><li>Test-Code und den eigenen PIN eingeben, Fragen beantworten, abgeben.</li></ol>
        <p class="mu klein">Version ${VERSION}</p></div>
    </div>`;
  zielBinden(el);
  $("#esAus").onclick=abmelden;
  $("#esReset") && ($("#esReset").onclick=testZuruecksetzen);
  $("#esReload").onclick=()=>neuLaden();
  $("#esExport").onclick=()=>{ const blob=new Blob([JSON.stringify({version:VERSION, exportiert:new Date().toISOString(), konto:k.email, ...ST.daten}, null, 2)], {type:"application/json"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`easyplay-lehrer-${new Date().toISOString().slice(0,10)}.json`; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 4000); melde("Sicherung heruntergeladen."); };
  $("#pwForm") && ($("#pwForm").onsubmit=async e=>{ e.preventDefault(); const err=$("#pwErr"), pw=$("#pwNeu").value; err.textContent="";
    if(pw.length<8) return err.textContent="Das neue Passwort braucht mindestens 8 Zeichen.";
    if(pw!==$("#pwNeu2").value) return err.textContent="Die beiden Passwörter sind nicht gleich.";
    const b=$("#pwGo"); b.disabled=true;
    try{ if(k.art==="supabase"){ const {error}=await AUTH.sb.auth.updateUser({password:pw}); if(error) throw error; }
      else { const alle=lokaleKonten(), kk=alle[k.email]; if(!(await pwPruefen($("#pwAlt").value, kk))) throw new Error("Das aktuelle Passwort stimmt nicht."); kk.salt=neuesSalz(); kk.hash=await pwHashNeu(pw, kk.salt); alle[k.email]=kk; lsSet("ep-konten", alle); }
      melde("Passwort geändert."); e.target.reset(); }
    catch(x){ err.textContent=x.message||String(x); }
    b.disabled=false; });
};

/* ================= 7. PDF (Prüfung, Lösungsblatt, PIN-Kärtchen) ================= */
let JSPDF_P=null;
function ladeJsPDF(){
  if(window.jspdf?.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
  if(!JSPDF_P) JSPDF_P=new Promise((ok,err)=>{ const s=document.createElement("script"); s.src=JSPDF_URL; s.integrity=JSPDF_SRI; s.crossOrigin="anonymous"; s.async=true;
    s.onload=()=> window.jspdf?.jsPDF ? ok(window.jspdf.jsPDF) : err(new Error("jsPDF fehlt"));
    s.onerror=()=>{ JSPDF_P=null; s.remove(); err(new Error("Das PDF-Werkzeug konnte nicht geladen werden. Bist du online?")); };
    document.head.appendChild(s); });
  return JSPDF_P;
}
const PDF_MAP = {"‘":"'","’":"'","‚":",","“":'"',"”":'"',"„":'"',"…":"...","–":"-","—":"-","−":"-","•":"-"," ":" "," ":" "," ":" ","‑":"-","‐":"-","→":"->","ß":"ss","‹":"<","›":">","€":"EUR","≤":"<=","≥":">=","≈":"~","×":"x"};
function pdfText(s){
  let o=""; for(const ch of String(s??"").replace(/\r/g,"")){ const c=ch.codePointAt(0);
    if(PDF_MAP[ch]!=null){ o+=PDF_MAP[ch]; continue; }
    if(c<=255){ if(c>=0x7F && c<0xA0) continue; o+= (c<32 && ch!=="\n") ? " " : ch; continue; }
    const b=ch.normalize("NFD").replace(/[̀-ͯ]/g,""); if(b && b.codePointAt(0)<=255) o+=b; }
  return o.replace(/[ \t]{2,}/g," ").trim();
}
const slug = s => pdfText(s).replace(/[äÄ]/g,"ae").replace(/[öÖ]/g,"oe").replace(/[üÜ]/g,"ue").replace(/[^A-Za-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,40) || "test";
function pdfSpeichern(doc, name){ const blob=doc.output("blob"); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=name; a.rel="noopener"; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 5000); }
const FARBE = {blau:[61,90,254], tinte:[27,34,64], grau:[90,99,133], linie:[205,212,235]};
async function pdfTest(t, klasse, loesung){
  const jsPDF=await ladeJsPDF();
  const doc=new jsPDF({unit:"mm", format:"a4", compress:true});
  const W=210, H=297, M=20, BR=W-2*M, PKT=22; let y=0;
  const schwarz=()=>doc.setTextColor(0,0,0), grau=()=>doc.setTextColor(90,90,90);
  doc.setProperties({title:pdfText(t.titel+(loesung?" (Lösungen)":""))});
  const maxP=maxPunkte(t.fragen), hatMc=t.fragen.some(f=>!istOffen(f)), hatOffen=t.fragen.some(istOffen);
  const linie=(x1,yy,x2)=>{ doc.setDrawColor(0); doc.setLineWidth(0.25); doc.line(x1,yy,x2,yy); };
  y=18; doc.setDrawColor(0); doc.setLineWidth(0.3); doc.rect(M, y, BR, 20);
  doc.line(M, y+10, M+BR, y+10); doc.line(M+BR*0.62, y, M+BR*0.62, y+20);
  doc.setFont("helvetica","normal"); doc.setFontSize(10); schwarz();
  doc.text("Name:", M+2.5, y+6.5); doc.text("Datum:", M+BR*0.62+2.5, y+6.5);
  doc.text(pdfText("Klasse:"+(klasse?.name?"  "+klasse.name:"")), M+2.5, y+16.5);
  doc.text("Punkte:", M+BR*0.62+2.5, y+16.5); doc.text(`/ ${maxP}`, M+BR*0.62+24, y+16.5); doc.text("Note:", M+BR*0.62+40, y+16.5);
  if(loesung){ doc.setFont("helvetica","bold"); doc.text(pdfText("Lösungen"), M+BR*0.62-3, y+6.5, {align:"right"}); doc.setFont("helvetica","normal"); }
  y+=31;
  doc.setFont("helvetica","bold"); doc.setFontSize(15); schwarz();
  doc.splitTextToSize(pdfText(t.titel), BR).forEach(z=>{ doc.text(z, M, y); y+=6.8; });
  doc.setFont("helvetica","normal"); doc.setFontSize(9.5); grau();
  const hinw=[hatMc?"Kreuze bei Auswahlfragen genau eine Antwort an.":"", hatOffen?"Beantworte offene Fragen in ganzen Sätzen.":"", `Total ${maxP} ${maxP===1?"Punkt":"Punkte"}.`].filter(Boolean).join(" ");
  doc.splitTextToSize(pdfText(hinw), BR).forEach(z=>{ doc.text(z, M, y); y+=4.6; });
  y+=4; linie(M, y-2, M+BR); y+=5;
  const tx=M+8, tw=BR-8-PKT;
  t.fragen.forEach((f,i)=>{
    const offen=istOffen(f), p=fPunkte(f);
    doc.setFont("helvetica","normal"); doc.setFontSize(11);
    const qz=doc.splitTextToSize(pdfText(f.q), tw);
    let oz=[], kurz=false, mz=[];
    if(!offen){ doc.setFontSize(10.5); kurz=f.o.every(o=>doc.getTextWidth(pdfText(o))<(tw/2-14)); oz=f.o.map(o=>doc.splitTextToSize(pdfText(o), kurz ? tw/2-12 : tw-10)); }
    else if(loesung && f.m){ doc.setFontSize(10.5); mz=doc.splitTextToSize(pdfText(f.m), tw); }
    const zeilen=Math.max(1, f.z||3);
    const optH = offen ? (loesung && mz.length ? mz.length*5.2+4 : zeilen*8.5+2) : kurz ? Math.max(oz[0].length,oz[1].length)*5+Math.max(oz[2].length,oz[3].length)*5+5 : oz.reduce((x,z)=>x+z.length*5+2,0);
    if(y+qz.length*5.4+3+optH+7 > H-18){ doc.addPage(); y=20; }
    doc.setFont("helvetica","bold"); doc.setFontSize(11); schwarz(); doc.text(`${i+1}.`, M, y);
    doc.setFont("helvetica","normal"); doc.setFontSize(9.5); doc.text(`___ / ${String(p).replace(".",",")} P.`, M+BR, y, {align:"right"});
    doc.setFontSize(11); qz.forEach(z=>{ doc.text(z, tx, y); y+=5.4; }); y+=2;
    if(offen){
      if(loesung && mz.length){ doc.setFont("helvetica","italic"); doc.setFontSize(10.5); mz.forEach(z=>{ doc.text(z, tx, y+1); y+=5.2; }); y+=4; }
      else if(loesung){ doc.setFont("helvetica","italic"); doc.setFontSize(10); grau(); doc.text("(Antwort frei)", tx, y+1); y+=7; schwarz(); }
      else { for(let z=0;z<zeilen;z++){ y+=8.5; linie(tx, y-2, M+BR-PKT+12); } y+=2; }
    } else {
      doc.setFontSize(10.5);
      const opt=(j,ox,oy)=>{ const ok=loesung && j===+f.r; doc.setDrawColor(0); doc.setLineWidth(0.3); doc.rect(ox, oy-3.3, 3.6, 3.6);
        if(ok){ doc.setLineWidth(0.5); doc.line(ox+0.4, oy-2.9, ox+3.2, oy-0.1); doc.line(ox+3.2, oy-2.9, ox+0.4, oy-0.1); }
        doc.setFont("helvetica", ok?"bold":"normal"); schwarz(); doc.text("abcd"[j]+")", ox+5.5, oy);
        let yy=oy; oz[j].forEach(z=>{ doc.text(z, ox+11, yy); yy+=5; }); return yy; };
      if(kurz){ const c2=tx+tw/2; let y1=opt(0,tx,y), y2=opt(1,c2,y); y=Math.max(y1,y2)+1.5; y1=opt(2,tx,y); y2=opt(3,c2,y); y=Math.max(y1,y2); }
      else f.o.forEach((o,j)=>{ y=opt(j,tx,y)+2; });
    }
    y+=6;
  });
  const n=doc.getNumberOfPages();
  for(let pg=1;pg<=n;pg++){ doc.setPage(pg); doc.setFont("helvetica","normal"); doc.setFontSize(8.5); grau(); doc.text(pdfText(t.titel), M, H-10); doc.text(`Seite ${pg} von ${n}`, W-M, H-10, {align:"right"}); }
  return doc;
}
async function pdfPins(k){
  const jsPDF=await ladeJsPDF();
  const doc=new jsPDF({unit:"mm", format:"a4"}); const W=210, M=14, cw=(W-2*M-6)/2, ch=40; let x=M, y=24, i=0;
  doc.setFont("helvetica","bold"); doc.setFontSize(16); doc.setTextColor(...FARBE.tinte); doc.text(pdfText(`PIN-Kärtchen · ${k.name}`), M, 15);
  doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(...FARBE.grau); doc.text(pdfText("Ausschneiden und verteilen. Den PIN nicht weitergeben."), W-M, 15, {align:"right"});
  (k.schueler||[]).forEach(s=>{
    if(y+ch>285){ doc.addPage(); y=16; }
    doc.setDrawColor(...FARBE.linie); doc.setLineDashPattern([2,1.5],0); doc.roundedRect(x,y,cw,ch,3,3,"S"); doc.setLineDashPattern([],0);
    doc.setFillColor(...FARBE.blau); doc.roundedRect(x+4,y+4,cw-8,9,2,2,"F");
    doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.setTextColor(255,255,255); doc.text("easyplay · Mein Test-PIN", x+8, y+10);
    doc.setTextColor(...FARBE.tinte); doc.setFontSize(13); doc.text(pdfText(s.name), x+6, y+21);
    doc.setFontSize(24); doc.setTextColor(...FARBE.blau); doc.text(String(s.pin).split("").join(" "), x+6, y+33);
    doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(...FARBE.grau); doc.text(pdfText("Menü: «Test mit Code»"), x+cw-5, y+36, {align:"right"});
    i++; if(i%2){ x=M+cw+6; } else { x=M; y+=ch+6; }
  });
  return doc;
}

/* ================= 8. Beispieldaten für den Testzugang ================= */
function zufallsGenerator(seed){ let a=seed>>>0; return ()=>{ a=(a+0x6D2B79F5)>>>0; let t=a; t=Math.imul(t^(t>>>15), t|1); t^=t+Math.imul(t^(t>>>7), t|61); return ((t^(t>>>14))>>>0)/4294967296; }; }
function testdatenAnlegen(){
  const rnd=zufallsGenerator(Date.now()%100000+7);
  const zwischen=(a,b)=>a+(b-a)*rnd();
  // Abgaben nur während der Schulzeit (Montag bis Freitag, 8 bis 16 Uhr)
  const schulzeit=(von,bis)=>{ for(let i=0;i<40;i++){ const d=new Date(zwischen(von,bis)); if(d.getDay()===0||d.getDay()===6) continue; d.setHours(8+Math.floor(rnd()*8), Math.floor(rnd()*60), 0, 0); if(+d>=von && +d<=bis) return d.toISOString(); } return new Date(zwischen(von,bis)).toISOString(); };
  const pinListe=[]; const kind=n=>{ const p=neuerPin(pinListe); pinListe.push(p); return {id:neueId(), name:n, pin:p}; };
  const k5={id:neueId(), name:"5a Solothurn", schuljahr:"h7", zyklus:2, erstellt:new Date(Date.now()-40*864e5).toISOString(),
    schueler:["Lena","Noah","Mia","Luca","Emma","Leon","Lina","Elias","Sofia","Nico","Laura","Jan","Elena","Tim","Alina","Samuel","Lea","Matteo"].map(kind)};
  const k6={id:neueId(), name:"6b Olten", schuljahr:"h8", zyklus:2, erstellt:new Date(Date.now()-38*864e5).toISOString(),
    schueler:["Anna","Jonas","Chiara","Levin","Nora","Fabio","Julia","Nils","Lara","Gian","Mila","Yannick"].map(kind)};
  // Wochen: Test A in der Vorwoche, Test B und C in dieser Woche (für Verlauf und Klassen-Liga)
  const jetzt=Date.now(); const mo=new Date(); mo.setHours(7,30,0,0); mo.setDate(mo.getDate()-((mo.getDay()+6)%7));
  let wa=mo.getTime(), we=jetzt-15*60000; if(we-wa<3*3600000){ wa=jetzt-3*3600000; }
  const va=mo.getTime()-7*864e5+864e5, ve=mo.getTime()-864e5;
  const mc=(t,l,q,a,s,e)=>({q,a,t,l,s:s||"",e:e||""});
  const fragenA=[mc("geo_schweiz",1,"Welche Stadt ist die Bundesstadt der Schweiz?",["Bern","Zürich","Genf","Basel"],"Bern","Im Bundeshaus in Bern arbeiten Bundesrat und Parlament."),
    mc("geo_schweiz",1,"Wie viele Kantone hat die Schweiz?",["26","20","23","30"],"Kantone"),
    mc("geo_schweiz",1,"Welcher Fluss fliesst durch Solothurn und Olten?",["Die Aare","Die Rhone","Die Reuss","Der Inn"],"Aare"),
    mc("geo_schweiz",2,"Welcher ist der grösste See, der ganz in der Schweiz liegt?",["Neuenburgersee","Zürichsee","Vierwaldstättersee","Thunersee"],"Seen","Der Genfersee ist grösser, liegt aber teilweise in Frankreich."),
    mc("geo_schweiz",2,"Wie heisst der höchste Berg der Schweiz?",["Dufourspitze","Matterhorn","Eiger","Säntis"],"Berge","Die Dufourspitze im Monte-Rosa-Massiv ist 4634 Meter hoch."),
    mc("geo_schweiz",1,"In welchem Kanton liegt Olten?",["Solothurn","Aargau","Bern","Luzern"],"Kantone"),
    mc("geo_schweiz",1,"Welche Sprache spricht man im Kanton Tessin hauptsächlich?",["Italienisch","Französisch","Rätoromanisch","Deutsch"],"Sprachen"),
    mc("geo_schweiz",2,"Wie heisst der Hauptort des Kantons Graubünden?",["Chur","Davos","St. Moritz","Landquart"],"Kantone"),
    mc("geo_schweiz",2,"Welcher Fluss entspringt am Rhonegletscher im Wallis?",["Die Rhone","Die Aare","Der Rhein","Der Ticino"],"Flüsse"),
    mc("geo_schweiz",1,"Welche Farbe hat das Kreuz in der Schweizer Fahne?",["Weiss","Rot","Gelb","Blau"],"Fahne")];
  const fragenB=[mc("tiere",1,"Welches Tier baut im Wald grosse Haufen aus Nadeln und Zweigen?",["Die Rote Waldameise","Der Borkenkäfer","Die Honigbiene","Die Wespe"],"Ameisen"),
    mc("tiere",1,"Wie nennt man das Junge eines Rehs?",["Kitz","Fohlen","Ferkel","Lamm"],"Reh"),
    mc("tiere",1,"Welcher Vogel klopft mit dem Schnabel Löcher in Baumstämme?",["Der Specht","Die Amsel","Der Spatz","Die Taube"],"Specht"),
    mc("tiere",1,"Was frisst ein Eichhörnchen im Winter vor allem?",["Gesammelte Nüsse und Samen","Gras","Mäuse","Blätter"],"Eichhörnchen","Eichhörnchen verstecken im Herbst Vorräte und halten im Winter nur Winterruhe."),
    mc("tiere",2,"Welches Tier hält einen echten Winterschlaf?",["Der Igel","Der Fuchs","Das Reh","Das Wildschwein"],"Winterschlaf"),
    mc("tiere",1,"Wann ist der Uhu vor allem unterwegs?",["In der Nacht","Am Mittag","Nur im Winter","Am frühen Nachmittag"],"Eulen"),
    mc("tiere",1,"Welches Waldtier wohnt in einem Bau unter der Erde und hat einen buschigen Schwanz?",["Der Fuchs","Der Hirsch","Das Reh","Der Luchs"],"Fuchs"),
    mc("tiere",2,"Welche Raubkatze wurde ab 1971 in der Schweiz wieder angesiedelt?",["Der Luchs","Der Löwe","Der Tiger","Der Gepard"],"Luchs")];
  const fragenC=[mc("pol_demokratie",1,"Wie viele Mitglieder hat der Bundesrat?",["Sieben","Fünf","Neun","Zwölf"],"Bundesrat"),
    mc("pol_demokratie",2,"Ab welchem Alter darf man bei eidgenössischen Abstimmungen mitmachen?",["Ab 18","Ab 16","Ab 20","Ab 21"],"Stimmrecht"),
    mc("pol_demokratie",3,"Wie viele Unterschriften braucht eine eidgenössische Volksinitiative?",["100'000","50'000","10'000","1 Million"],"Volksinitiative"),
    mc("pol_demokratie",2,"Wie heissen die beiden Kammern des Bundesparlaments?",["Nationalrat und Ständerat","Bundesrat und Nationalrat","Kantonsrat und Gemeinderat","Senat und Kongress"],"Parlament"),
    mc("pol_demokratie",2,"Seit wann dürfen Frauen in der Schweiz auf Bundesebene abstimmen und wählen?",["Seit 1971","Seit 1848","Seit 1919","Seit 2000"],"Frauenstimmrecht")];
  const offenC=[{q:"Erkläre in eigenen Worten den Unterschied zwischen Wählen und Abstimmen.", m:"Beim Wählen bestimmt man Personen, beim Abstimmen entscheidet man über eine Sachfrage.", p:2, z:4,
      ant:["Beim Wählen bestimmt man Personen, zum Beispiel für den Nationalrat. Beim Abstimmen sagt man Ja oder Nein zu einer Sache.","Wählen ist für Leute und Abstimmen ist für Gesetze.","Das ist fast das Gleiche."]},
    {q:"Nenne zwei Möglichkeiten, wie Kinder in ihrer Schule oder Gemeinde mitbestimmen können.", m:"Zum Beispiel Klassenrat, Schülerrat, Kinderparlament oder Umfragen der Gemeinde.", p:2, z:3,
      ant:["Im Klassenrat und im Schülerrat.","Man kann im Klassenrat etwas sagen.","Weiss ich nicht."]},
    {q:"Warum hat die Schweiz vier Landessprachen? Schreibe einen Satz.", m:"Weil in verschiedenen Regionen der Schweiz seit langem Deutsch, Französisch, Italienisch und Rätoromanisch gesprochen werden.", p:2, z:3,
      ant:["Weil man in verschiedenen Teilen der Schweiz verschiedene Sprachen spricht.","Weil die Schweiz viele Kantone hat.",""]}];
  const alsTest=fr=>fr.map((f,i)=>{ const o=mischen(f.a.map((x,j)=>({x, ok:j===0}))); return {q:f.q, e:f.e, nr:0, t:f.t, l:f.l, s:f.s, o:o.map(y=>y.x), r:o.findIndex(y=>y.ok)}; });
  const tA={code:"BERG5A", klasseId:k5.id, titel:"Schweiz: Kantone und Gewässer", schuljahr:"h7", lp21:["NMG.8"], aktiv:false, erstellt:new Date(va-864e5/2).toISOString(), info:{thema:"geo_schweiz", stufe:0, zyklus:2, klasse:k5.name}, fragen:alsTest(fragenA)};
  const tB={code:"WALD5A", klasseId:k5.id, titel:"Tiere im Schweizer Wald", schuljahr:"h7", lp21:["NMG.2"], aktiv:true, erstellt:new Date(wa-1800000).toISOString(), info:{thema:"tiere", stufe:1, zyklus:2, klasse:k5.name}, fragen:alsTest(fragenB)};
  const tC={code:"WAHL6B", klasseId:k6.id, titel:"Demokratie in der Schweiz", schuljahr:"h8", lp21:["NMG.10"], aktiv:true, erstellt:new Date(wa+(we-wa)*0.2).toISOString(), info:{thema:"pol_demokratie", stufe:0, zyklus:2, klasse:k6.name},
    fragen:[...alsTest(fragenC), ...offenC.map(o=>({q:o.q, e:"", nr:0, t:"eigen", l:0, s:"", eigen:true, art:"offen", m:o.m, p:o.p, z:o.z}))]};
  const abgaben=[];
  const koennen={}; [...k5.schueler, ...k6.schueler].forEach(s=>{ koennen[s.id]=zwischen(0.45, 0.97); });
  const abgeben=(t, s, von, bis, korrigiert)=>{
    const p=koennen[s.id]; const ant=t.fragen.map((f,i)=>{
      if(istOffen(f)){ const o=offenC.find(x=>x.q===f.q); const stufe=p>0.8?0:p>0.6?(rnd()<0.6?0:1):(rnd()<0.5?1:2); return o.ant[stufe]; }
      if(rnd()<p) return +f.r; const falsch=[0,1,2,3].filter(j=>j!==+f.r); return rnd()<0.6 ? falsch[0] : falsch[Math.floor(rnd()*3)]; });
    const kor={}; if(korrigiert) t.fragen.forEach((f,i)=>{ if(!istOffen(f)) return; const o=offenC.find(x=>x.q===f.q); const st=o.ant.indexOf(ant[i]); kor[i]=st===0?2:st===1?1:0; if(st===0 && rnd()<0.3) kor[i]=1.5; });
    const b=bewerte(t.fragen, ant, kor);
    abgaben.push({id:neueId(), code:t.code, sid:s.id, name:s.name, antworten:ant, korrektur:kor, punkte:b.punkte, max:b.max, note:b.note, dauer:Math.round(zwischen(4,14)*60000), datum:schulzeit(von,bis)});
  };
  k5.schueler.forEach((s,i)=>{ if(i!==6) abgeben(tA, s, va, ve); });             // 17 von 18
  k5.schueler.forEach((s,i)=>{ if(![2,9,15].includes(i)) abgeben(tB, s, +new Date(tB.erstellt)+600000, we); });   // 15 von 18
  const cStart=+new Date(tC.erstellt)+600000;
  k6.schueler.forEach((s,i)=>{ if(i<10) abgeben(tC, s, cStart, we, i<6); });       // 10 von 12, 6 korrigiert
  datenSchreiben(LT_DATEN, {klassen:[k5,k6].map(k=>({...k, lehrer:TEST_LID})), tests:[tA,tB,tC].map(t=>({...t, lehrer:TEST_LID})), abgaben});
  lsSet(LT_MELD, [{art:"frage", ref:"4711", titel:"Welcher ist der grösste See, der ganz in der Schweiz liegt?", grund:"Frage ist unklar", text:"Beispielmeldung aus dem Testzugang: «ganz in der Schweiz» fett schreiben?", id:neueId(), datum:new Date(jetzt-2*864e5).toISOString(), gesendet:false}]);
  bruecke();
}

/* ================= 9. Start ================= */
start().catch(e=>{ console.error("Lehrerbereich", e); zeigeLogin("anmelden"); });
})();
