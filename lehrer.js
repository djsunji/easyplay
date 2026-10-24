/* easyplay Lehrerbereich (lehrer.js)
   Klassen, Kinder mit PIN, Tests mit Code, Auswertung mit Schweizer Noten, Fehleranalyse,
   Arbeits- und Lösungsblatt als PDF, Lehrplan-21-Bezug und Lernverlauf.
   Wird nach dem Hauptskript von easyplay geladen (index.html bzw. lernspiel.html) und hängt sich
   an go()/render(), renderNav(), renderHome() und renderProfil() an. Kein Framework. */
(function(){
"use strict";

/* ================= 0. Start und Abhängigkeiten ================= */
if(window.EP_LEHRER) return;
if(typeof go!=="function" || typeof render!=="function" || typeof S==="undefined"){
  console.warn("lehrer.js: easyplay-Grundlage nicht gefunden, Lehrerbereich ausgeschaltet.");
  return;
}
const VERSION = "1.1.0";
const TITEL0 = document.title;
const JSPDF_URL = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
const LS_DATEN = "ep-lehrer-daten";
const LS_ROLLE = "ep-lehrer-rolle";
const MAX_FRAGEN = 50;

/* ================= 1. Konstanten: Schuljahre, Lehrplan 21 ================= */
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
  natur:[["NMG.2"],["NT.9"]], tiere:[["NMG.2"],["NT.9","NT.8"]], wissenschaft:[["NMG.4","NMG.5"],["NT.1"]], koerper:[["NMG.1"],["NT.7","NT.6"]],
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

/* ================= 2. Hilfsfunktionen ================= */
const $q = s => document.querySelector(s);
const $a = s => [...document.querySelectorAll(s)];
const h = typeof esc==="function" ? esc : (s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])));
const mischen = a => { a=[...a]; for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
const warte = ms => new Promise(r=>setTimeout(r,ms));
function lsGet(k,d){ try{ const v=localStorage.getItem(k); return v==null ? d : (JSON.parse(v) ?? d); }catch(e){ return d; } }
function lsSet(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); return true; }catch(e){ return false; } }
function neueId(){ try{ if(crypto.randomUUID) return crypto.randomUUID(); }catch(e){}
  const b=new Uint8Array(16); try{ crypto.getRandomValues(b); }catch(e){ for(let i=0;i<16;i++) b[i]=Math.random()*256|0; }
  b[6]=(b[6]&15)|64; b[8]=(b[8]&63)|128; const x=[...b].map(v=>v.toString(16).padStart(2,"0")).join("");
  return `${x.slice(0,8)}-${x.slice(8,12)}-${x.slice(12,16)}-${x.slice(16,20)}-${x.slice(20)}`; }
function zufallInt(n){ try{ const a=new Uint32Array(1); crypto.getRandomValues(a); return a[0]%n; }catch(e){ return Math.floor(Math.random()*n); } }
const CODE_ZEICHEN = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const neuerCode = () => Array.from({length:6},()=>CODE_ZEICHEN[zufallInt(CODE_ZEICHEN.length)]).join("");
const normCode = s => String(s||"").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,6);
const normPin = s => String(s||"").replace(/\D/g,"").slice(0,6);
function neuerPin(belegt){ const set=new Set(belegt||[]); for(let i=0;i<500;i++){ const p=String(100000+zufallInt(900000)); if(!set.has(p)) return p; } return String(100000+zufallInt(900000)); }
async function hashHex(s){
  try{ if(crypto?.subtle){ const d=await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)); return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,"0")).join("").slice(0,24); } }catch(e){}
  let x=2166136261, y=5381; for(const c of s){ x^=c.charCodeAt(0); x=Math.imul(x,16777619); y=(Math.imul(y,33)^c.charCodeAt(0))>>>0; }
  return (x>>>0).toString(16).padStart(8,"0")+y.toString(16).padStart(8,"0");
}
const pinHash = (code,pin) => hashHex(`easyplay|${normCode(code)}|${normPin(pin)}`);
const datum = d => { try{ return new Date(d).toLocaleDateString("de-CH"); }catch(e){ return ""; } };
const zeit = ms => typeof fmtZeit==="function" ? fmtZeit(ms) : `${Math.round((ms||0)/1000)} s`;
const plain = o => JSON.parse(JSON.stringify(o));
const fragenFuerKind = f => f.art==="offen" ? ({q:f.q, art:"offen", p:f.p||1, z:f.z||3, nr:f.nr||0, t:f.t||"", l:f.l||0}) : ({q:f.q, o:f.o, nr:f.nr, t:f.t, l:f.l});
function alleFr(){ try{ if(typeof alleFragen==="function") return alleFragen(); }catch(e){} return typeof FRAGEN!=="undefined" ? FRAGEN : []; }
function fNr(f){ try{ if(typeof frageNr==="function") return frageNr(f)||0; }catch(e){} return +f.nr||0; }
function fKey(f){ if(f && f.eigen && f.id) return f.id; try{ if(typeof qid==="function") return qid(f); }catch(e){} let x=2166136261; for(const c of String(f.q)){ x^=c.charCodeAt(0); x=Math.imul(x,16777619); } return (x>>>0).toString(36); }
const themaName = id => id==="eigen" ? "Eigene Fragen" : (typeof THEMA!=="undefined" && THEMA[id]?.name) || (String(id).startsWith("kt_") ? "Kanton "+String(id).slice(3) : String(id||""));
function testBasis(){
  try{ if(window.claude && typeof ARTIFACT_URL!=="undefined" && ARTIFACT_URL) return ARTIFACT_URL; }catch(e){}
  if(/^https?:/.test(location.protocol)) return location.href.split("#")[0];
  const c=window.EP_CONFIG||{}; return c.teilenUrl || location.href.split("#")[0];
}
const testLink = code => `${testBasis()}#test=${code}`;

// Note nach Schweizer Skala: 5 * Punkte / Max + 1, auf halbe Noten gerundet
function note(p, max){ if(!max) return 1; const n = 5*p/max + 1; return Math.min(6, Math.max(1, Math.round(n*2)/2)); }
const fmtNote = n => (n==null || isNaN(n)) ? "-" : (Math.round(n*10)/10).toFixed(1).replace(/\.0$/,"");
const noteKlasse = n => n==null ? "" : n>=5 ? "gut" : n>=4 ? "ok" : "tief";
/* Fragearten: "mc" (vier Antworten, eine richtig) und "offen" (Textantwort, von der Lehrperson korrigiert, f.p Punkte) */
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
  return {punkte:p, max, note:note(p, max), offen, loesung:fragen.map(f=>istOffen(f)?({offen:true, m:f.m||"", e:f.e||"", p:fPunkte(f)}):({r:+f.r, e:f.e||""}))};
}
/* Antworten säubern: Zahl 0 bis 3 bei Auswahlfragen, Text bei offenen Fragen */
function antwortenSaeubern(fragen, antworten){
  return fragen.map((f,i)=>{ const v=(antworten||[])[i];
    if(istOffen(f)) return (v==null || typeof v==="object") ? null : String(v).slice(0,2000);
    return (v===0||v===1||v===2||v===3) ? v : null; });
}
function toast(text, art){
  let el=$q("#lzToast"); if(!el){ el=document.createElement("div"); el.id="lzToast"; el.setAttribute("role","status"); el.setAttribute("aria-live","polite"); document.body.appendChild(el); }
  el.textContent=text; el.className="lz-toast "+(art||""); el.hidden=false; clearTimeout(el._t); el._t=setTimeout(()=>{ el.hidden=true; }, 3800);
}
function fehlerText(e){
  const m=String(e?.message||e?.code||e||"");
  if(/42P01|does not exist|relation .* not exist|schema cache/i.test(m)) return "Die Lehrer-Tabellen fehlen in Supabase. Bitte lehrer.sql im SQL Editor ausführen (siehe ANLEITUNG-LEHRER.md).";
  if(/quota_exceeded/i.test(m)) return "Der Speicher ist voll. Bitte alte Tests löschen.";
  if(/invalid_argument/i.test(m)) return "Speichern nicht erlaubt. Fehlen dir die nötigen Rechte?";
  if(/42501|row-level security|lehrperson/i.test(m)) return "Dein Lehrerkonto ist noch nicht freigegeben. Sobald es geprüft ist, kannst du Klassen anlegen.";
  if(/lz-gesperrt/i.test(m)) return "Der Lehrerbereich ist gesperrt. Bitte gib dein Lehrer-Passwort ein.";
  return "Das hat nicht geklappt: "+(m||"unbekannter Fehler");
}

/* ================= 3. Speicher-Schicht ================= */
/* Gemeinsame Schnittstelle (alles async ausser lehrerId/istLehrer):
   art, lehrerId(), istLehrer(), rolleSetzen(), klassen(), klasseSpeichern(k, tests), klasseLoeschen(id),
   tests(), codeFrei(code), testSpeichern(t, klasse), testLoeschen(code), abgaben(), abgabeLoeschen(a),
   kidLaden(code, pin), kidAbgeben(code, pin, antworten, dauerMs) */
let SP=null, SP_P=null;
function speicher(){ if(!SP_P) SP_P = waehleSpeicher().then(sp=>{ SP=sp; return sp; }); return SP_P; }
async function waehleSpeicher(){
  if(window.claude && typeof window.claude.use==="function"){
    try{
      const db = await window.claude.use("db");
      if(db){ let user=null; try{ user=await window.claude.use("user"); }catch(e){}
        const sp=claudeSpeicher(db, user); await sp.init; return sp; }
    }catch(e){ console.warn("lehrer.js: claude.ai db nicht verfügbar", e); }
    return lokalSpeicher();
  }
  const cfg=window.EP_CONFIG||{};
  if(cfg.supabaseUrl && cfg.supabaseKey && typeof AUTH!=="undefined"){
    for(let i=0;i<100 && !AUTH.bereit;i++) await warte(100);
    if(AUTH.modus==="supabase" && AUTH.sb) return supaSpeicher();
  }
  return lokalSpeicher();
}

/* ---------- c) lokal (localStorage, gemeinsames Gerät) ----------
   Ohne Online-Konto hängt der Lehrerbereich am Profil dieses Geräts. Damit ein Kind mit gleichem Profilnamen
   nicht Klassen, PINs und Noten sieht, schützt ein Lehrer-Passwort (PBKDF2) den Bereich; entsperrt gilt nur für diese Sitzung. */
const LS_LZPW = "ep-lehrer-pw", SS_LZOFFEN = "ep-lz-offen";
async function lzHash(pw, salt){
  const key=await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveBits"]);
  const bits=await crypto.subtle.deriveBits({name:"PBKDF2", hash:"SHA-256", salt:new TextEncoder().encode(salt), iterations:600000}, key, 256);
  return btoa(String.fromCharCode(...new Uint8Array(bits)));
}
function lokalSpeicher(){
  const lese = () => { const d=lsGet(LS_DATEN,null)||{}; return {klassen:Array.isArray(d.klassen)?d.klassen:[], tests:Array.isArray(d.tests)?d.tests:[], abgaben:Array.isArray(d.abgaben)?d.abgaben:[]}; };
  const schreibe = d => { if(!lsSet(LS_DATEN,d)) throw new Error("Speichern im Browser nicht möglich (privates Fenster oder Speicher voll)."); };
  const lid = () => { const p=S.profil; if(!p) return null; return p.email ? "m:"+String(p.email).toLowerCase() : (p.name ? "n:"+p.name : null); };
  const offen = () => { const id=lid(); try{ return !!id && sessionStorage.getItem(SS_LZOFFEN)===id; }catch(e){ return false; } };
  const pruefOffen = () => { if(!offen()) throw new Error("lz-gesperrt"); };
  return {
    art:"lokal",
    lehrerId: lid,
    istLehrer(){ const id=lid(); return !!(id && lsGet(LS_ROLLE,{})[id]); },
    hatPasswort(){ const id=lid(); return !!(id && (lsGet(LS_LZPW,{})||{})[id]); },
    entsperrt: offen,
    async passwortSetzen(pw){ const id=lid(); if(!id) return; if(String(pw||"").length<8) throw new Error("Das Passwort braucht mindestens 8 Zeichen.");
      const salt=crypto.getRandomValues(new Uint32Array(4)).join("-"); const m=lsGet(LS_LZPW,{})||{}; m[id]={salt, hash:await lzHash(pw, salt)}; lsSet(LS_LZPW,m);
      try{ sessionStorage.setItem(SS_LZOFFEN, id); }catch(e){} },
    async entsperren(pw){ const id=lid(); const e=(lsGet(LS_LZPW,{})||{})[id]; if(!e) return false;
      const ok = (await lzHash(String(pw||""), e.salt)) === e.hash; if(ok){ try{ sessionStorage.setItem(SS_LZOFFEN, id); }catch(err){} } return ok; },
    sperren(){ try{ sessionStorage.removeItem(SS_LZOFFEN); }catch(e){} },
    async rolleSetzen(pw){ const id=lid(); if(!id) return; if(!this.hatPasswort()) await this.passwortSetzen(pw); const r=lsGet(LS_ROLLE,{}); r[id]=true; lsSet(LS_ROLLE,r); },
    async klassen(){ pruefOffen(); const id=lid(); return lese().klassen.filter(k=>k.lehrer===id); },
    async klasseSpeichern(k){ const d=lese(); const x={...plain(k), lehrer:lid()}; const i=d.klassen.findIndex(y=>y.id===k.id); if(i>=0) d.klassen[i]=x; else d.klassen.push(x);
      const sids=new Set((k.schueler||[]).map(s=>s.id)); const codes=new Set(d.tests.filter(t=>t.klasseId===k.id).map(t=>t.code));
      d.abgaben=d.abgaben.filter(a=>!codes.has(a.code) || sids.has(a.sid)); schreibe(d); return x; },
    async klasseLoeschen(id){ const d=lese(); const codes=new Set(d.tests.filter(t=>t.klasseId===id).map(t=>t.code));
      d.klassen=d.klassen.filter(k=>k.id!==id); d.tests=d.tests.filter(t=>t.klasseId!==id); d.abgaben=d.abgaben.filter(a=>!codes.has(a.code)); schreibe(d); },
    async tests(){ pruefOffen(); const id=lid(); return lese().tests.filter(t=>t.lehrer===id); },
    async codeFrei(code){ return !lese().tests.some(t=>t.code===code); },
    async testSpeichern(t){ const d=lese(); const x={...plain(t), lehrer:lid()}; const i=d.tests.findIndex(y=>y.code===t.code); if(i>=0) d.tests[i]=x; else d.tests.push(x); schreibe(d); return x; },
    async testLoeschen(code){ const d=lese(); d.tests=d.tests.filter(t=>t.code!==code); d.abgaben=d.abgaben.filter(a=>a.code!==code); schreibe(d); },
    async abgaben(){ pruefOffen(); const d=lese(); const codes=new Set(d.tests.filter(t=>t.lehrer===lid()).map(t=>t.code)); return d.abgaben.filter(a=>codes.has(a.code)); },
    async abgabeLoeschen(a){ const d=lese(); d.abgaben=d.abgaben.filter(x=>x.id!==a.id); schreibe(d); },
    async kidLaden(code, pin){
      const d=lese(); const t=d.tests.find(x=>x.code===normCode(code)); if(!t) return {fehler:"code"};
      const k=d.klassen.find(x=>x.id===t.klasseId); const s=(k?.schueler||[]).find(x=>x.pin===normPin(pin)); if(!s) return {fehler:"pin"};
      if(t.aktiv===false) return {fehler:"geschlossen"};
      return {test:{code:t.code, titel:t.titel, schuljahr:t.schuljahr, fragen:t.fragen.map(f=>fragenFuerKind(f))}, kind:{id:s.id, name:s.name},
              schon:d.abgaben.some(a=>a.code===t.code && a.sid===s.id)};
    },
    async kidAbgeben(code, pin, antworten, dauer){
      const d=lese(); const t=d.tests.find(x=>x.code===normCode(code)); if(!t) return {fehler:"code"};
      const k=d.klassen.find(x=>x.id===t.klasseId); const s=(k?.schueler||[]).find(x=>x.pin===normPin(pin)); if(!s) return {fehler:"pin"};
      if(t.aktiv===false) return {fehler:"geschlossen"};
      if(d.abgaben.some(a=>a.code===t.code && a.sid===s.id)) return {fehler:"schon"};
      const ant=antwortenSaeubern(t.fragen, antworten);
      const r=bewerte(t.fragen, ant);
      d.abgaben.push({id:neueId(), code:t.code, sid:s.id, name:s.name, antworten:ant, korrektur:{}, punkte:r.punkte, max:r.max, note:r.note, dauer:Math.max(0,Math.min(86400000,dauer|0)), datum:new Date().toISOString()});
      schreibe(d); return r;
    },
    async abgabeKorrigieren(a, korrektur){ const d=lese(); const x=d.abgaben.find(y=>y.id===a.id); if(!x) return; const t=d.tests.find(y=>y.code===x.code); x.korrektur=korrektur||{};
      if(t){ const r=bewerte(t.fragen, antwortenSaeubern(t.fragen, x.antworten), x.korrektur); x.punkte=r.punkte; x.max=r.max; x.note=r.note; } schreibe(d); }
  };
}

/* ---------- a) Supabase ---------- */
function supaSpeicher(){
  const sb = () => AUTH.sb;
  const lid = () => AUTH.user?.id || null;
  const chk = r => { if(r.error) throw new Error((r.error.code?r.error.code+" ":"")+(r.error.message||"Fehler")); return r.data; };
  const testAusZeile = r => ({code:r.code, klasseId:r.klasse_id, titel:r.titel, schuljahr:r.schuljahr, lp21:r.lp21||[], fragen:r.fragen||[], aktiv:r.aktiv!==false, erstellt:r.erstellt, info:r.info||{}});
  return {
    art:"supabase",
    lehrerId: lid,
    // Lehrperson ist nur, wen die Verwaltung freigegeben hat (app_metadata, vom Konto selbst nicht änderbar)
    istLehrer(){ const u=AUTH.user; return !!(u && u.app_metadata?.rolle==="lehrperson"); },
    beantragt(){ const u=AUTH.user; return !!(u && u.user_metadata?.rolle==="lehrperson"); },
    async neuPruefen(){ try{ const r=await sb().auth.refreshSession(); if(r?.data?.user) AUTH.user=r.data.user; }catch(e){} },
    async rolleSetzen(){ const u=AUTH.user; if(!u) return;   // nur Antrag; freigeben kann nur die Verwaltung
      const res=await sb().auth.updateUser({data:{rolle:"lehrperson"}}); if(res?.data?.user) AUTH.user=res.data.user; await this.neuPruefen(); },
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
      if(k.schueler?.length){
        // zuerst geänderte PINs freigeben, damit unique(klasse_id, pin) nicht stört
        chk(await sb().from("lehrer_schueler").upsert(k.schueler.map(s=>({id:s.id, klasse_id:k.id, lehrer:lid(), name:s.name, pin:s.pin}))));
      }
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
    async abgabeKorrigieren(a, korrektur){ const t=LZ.daten?.tests.find(x=>x.code===a.code); const r=t ? bewerte(t.fragen, antwortenSaeubern(t.fragen, a.antworten), korrektur) : null;
      chk(await sb().from("lehrer_abgaben").update({korrektur:korrektur||{}, ...(r?{punkte:r.punkte, max:r.max, note:r.note}:{})}).eq("id",a.id)); },
    async kidLaden(code, pin){ const r=await sb().rpc("test_laden",{test_code:normCode(code), pin:normPin(pin)}); if(r.error) throw new Error(r.error.message); return r.data||{fehler:"code"}; },
    async kidAbgeben(code, pin, antworten, dauer){ const r=await sb().rpc("abgabe_einreichen",{test_code:normCode(code), pin:normPin(pin), antworten, dauer_ms:Math.max(0,dauer|0)}); if(r.error) throw new Error(r.error.message);
      const d=r.data||{fehler:"daten"}; if(d.note!=null) d.note=+d.note; return d; },
    /* Klassen-Liga (supabase/klassenliga.sql) */
    liga: true,
    async ligaMeine(){ return chk(await sb().from("liga_klassen").select("klasse_id,liga_id,anzeige,kanton,gesperrt")); },
    async ligaAnmelden(klasseId, anzeige, kanton){ const r=await sb().rpc("liga_anmelden",{p_klasse:klasseId, p_anzeige:anzeige, p_kanton:kanton||""}); if(r.error) throw new Error((r.error.code?r.error.code+" ":"")+r.error.message); return r.data||{fehler:"daten"}; },
    async ligaAbmelden(klasseId){ const r=await sb().rpc("liga_abmelden",{p_klasse:klasseId}); if(r.error) throw new Error((r.error.code?r.error.code+" ":"")+r.error.message); return !!r.data; },
    async ligaRangliste(woche, kanton){ const r=await sb().rpc("liga_rangliste",{p_woche:woche||null, p_kanton:kanton||null}); if(r.error) throw new Error((r.error.code?r.error.code+" ":"")+r.error.message);
      return (r.data||[]).map(x=>({platz:+x.platz, id:x.liga_id, anzeige:x.anzeige, kanton:x.kanton||"", zyklus:x.zyklus, punkte:+x.punkte, kinder:+x.kinder, aktiv:+x.aktiv})); },
    async ligaKind(code, pin){ const r=await sb().rpc("liga_meine_klasse",{test_code:normCode(code), pin:normPin(pin)}); if(r.error) throw new Error(r.error.message); return r.data||{liga:false}; }
  };
}

/* ---------- b) claude.ai db ----------
   klassen/<lehrer>/liste/<id>          privat für die Lehrperson (Regel klassen/{self})
   tests/<lehrer>/liste/<CODE>          lesbar für alle, schreibbar nur für die Lehrperson (tests/{self})
   testcodes/<CODE>                     {lehrer}: findet den Test zum Code
   abgaben/<kind-konto>                 {codes:{CODE:true}}: Verzeichnis für die Lehrperson
   abgaben/<kind-konto>/tests/<CODE>    {lehrer, eintraege:{<sid>: Abgabe}} (abgaben/{self}, lesbar ab admin) */
function claudeSpeicher(db, user){
  let uid=null, admin=false;
  const init=(async()=>{ try{ uid = user ? await user.id() : null; }catch(e){} try{ admin = user ? !!(await user.canEdit()) : false; }catch(e){} })();
  const kl = () => db.collection(`klassen/${uid}/liste`);
  const te = () => db.collection(`tests/${uid}/liste`);
  async function teilnehmer(k, code){ return Promise.all((k?.schueler||[]).map(async s=>({sid:s.id, name:s.name, ph:await pinHash(code, s.pin)}))); }
  async function testHolen(code){
    const c=await db.doc(`testcodes/${normCode(code)}`).get(); if(!c.exists) return null;
    const lehrer=c.data()?.lehrer; if(!lehrer) return null;
    const t=await db.doc(`tests/${lehrer}/liste/${normCode(code)}`).get(); return t.exists ? {...t.data(), lehrer} : null;
  }
  async function kidFinden(code, pin){
    if(!uid) return {fehler:"konto"};
    const t=await testHolen(code); if(!t) return {fehler:"code"};
    const ph=await pinHash(code, pin); const s=(t.teilnehmer||[]).find(x=>x.ph===ph); if(!s) return {fehler:"pin"};
    if(t.aktiv===false) return {fehler:"geschlossen"};
    const ref=db.doc(`abgaben/${uid}/tests/${normCode(code)}`); const vorh=await ref.get();
    return {t, s, ref, vorh, schon: !!(vorh.exists && vorh.data()?.eintraege?.[s.sid])};
  }
  return {
    art:"claude", init,
    lehrerId: () => uid,
    istLehrer: () => !!uid,
    admin: () => admin,
    async rolleSetzen(){},
    async klassen(){ const s=await kl().get(); return s.docs.map(d=>({...plain(d.data()), id:d.id})); },
    async klasseSpeichern(k, tests){
      await kl().doc(k.id).set(plain(k));
      for(const t of (tests||[]).filter(x=>x.klasseId===k.id)){ t.teilnehmer=await teilnehmer(k, t.code); await te().doc(t.code).set(plain(t)); }
      return k;
    },
    async klasseLoeschen(id, tests){ for(const t of (tests||[]).filter(x=>x.klasseId===id)) await this.testLoeschen(t.code); await kl().doc(id).delete(); },
    async tests(){ const s=await te().get(); return s.docs.map(d=>({...plain(d.data()), code:d.id})).sort((a,b)=>String(b.erstellt).localeCompare(String(a.erstellt))); },
    async codeFrei(code){ const s=await db.doc(`testcodes/${code}`).get(); return !s.exists; },
    async testSpeichern(t, k){ if(k) t.teilnehmer=await teilnehmer(k, t.code); await te().doc(t.code).set(plain(t)); await db.doc(`testcodes/${t.code}`).set({lehrer:uid}); return t; },
    async testLoeschen(code){ await te().doc(code).delete(); try{ await db.doc(`testcodes/${code}`).delete(); }catch(e){} },
    async abgaben(){
      const meine=new Set((await this.tests()).map(t=>t.code)); const out=[];
      let konten=[]; try{ konten=(await db.collection("abgaben").get()).docs; }catch(e){ return out; }
      for(const kd of konten){
        const codes=Object.keys(kd.data()?.codes||{}).filter(c=>meine.has(c));
        for(const c of codes){
          try{ const s=await db.doc(`abgaben/${kd.id}/tests/${c}`).get(); if(!s.exists) continue; const d=s.data()||{}; if(d.lehrer!==uid) continue;
            Object.entries(d.eintraege||{}).forEach(([sid,a])=>out.push({...plain(a), id:`${kd.id}|${c}|${sid}`, code:c, sid, _konto:kd.id})); }catch(e){}
        }
      }
      return out.sort((a,b)=>String(a.datum).localeCompare(String(b.datum)));
    },
    async abgabeLoeschen(a){ const ref=db.doc(`abgaben/${a._konto}/tests/${a.code}`); const s=await ref.get(); if(!s.exists) return; const d=plain(s.data()); delete d.eintraege[a.sid]; await ref.set(d); },
    async abgabeKorrigieren(a, korrektur){ const ref=db.doc(`abgaben/${a._konto}/tests/${a.code}`); const s=await ref.get(); if(!s.exists) return; const d=plain(s.data()); const e=d.eintraege?.[a.sid]; if(!e) return;
      const t=LZ.daten?.tests.find(x=>x.code===a.code); e.korrektur=korrektur||{}; if(t){ const r=bewerte(t.fragen, antwortenSaeubern(t.fragen, e.antworten), e.korrektur); e.punkte=r.punkte; e.max=r.max; e.note=r.note; } await ref.set(d); },
    async kidLaden(code, pin){
      const r=await kidFinden(code, pin); if(r.fehler) return r;
      return {test:{code:r.t.code||normCode(code), titel:r.t.titel, schuljahr:r.t.schuljahr, fragen:r.t.fragen.map(f=>fragenFuerKind(f))}, kind:{id:r.s.sid, name:r.s.name}, schon:r.schon};
    },
    async kidAbgeben(code, pin, antworten, dauer){
      const r=await kidFinden(code, pin); if(r.fehler) return r; if(r.schon) return {fehler:"schon"};
      const ant=antwortenSaeubern(r.t.fragen, antworten);
      const b=bewerte(r.t.fragen, ant);
      const eintrag={name:r.s.name, antworten:ant, korrektur:{}, punkte:b.punkte, max:b.max, note:b.note, dauer:Math.max(0,Math.min(86400000,dauer|0)), datum:new Date().toISOString()};
      if(r.vorh.exists) await r.ref.update({eintraege:{[r.s.sid]:eintrag}}); else await r.ref.set({lehrer:r.t.lehrer, code:normCode(code), eintraege:{[r.s.sid]:eintrag}});
      const kopf=db.doc(`abgaben/${uid}`); const ks=await kopf.get();
      if(ks.exists) await kopf.update({codes:{[normCode(code)]:true}, zuletzt:eintrag.datum}); else await kopf.set({codes:{[normCode(code)]:true}, zuletzt:eintrag.datum});
      return b;
    }
  };
}

/* ================= 4. Auswertung ================= */
// pro Kind und Test nur die erste Abgabe
// Abgaben nie blind übernehmen: aus den Antworten neu bewerten und nur Zahlen zulassen
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
function wochenSchnitt(abgaben){ const m={}; abgaben.forEach(a=>{ const w=wochenStart(a.datum); (m[w]=m[w]||[]).push(+a.note); }); return Object.entries(m).map(([w,l])=>({w, wert:l.reduce((s,x)=>s+x,0)/l.length, n:l.length})).sort((a,b)=>a.w.localeCompare(b.w)); }
function schnitt(l){ return l.length ? l.reduce((s,x)=>s+(+x),0)/l.length : null; }

function verlaufSVG(reihen, titel){
  const wochen=[...new Set(reihen.flatMap(r=>r.punkte.map(p=>p.w)))].sort();
  if(!wochen.length) return `<p class="empty">Noch keine Resultate für einen Verlauf.</p>`;
  const W=640, H=270, pl=42, pr=18, pt=18, pb=46, bw=W-pl-pr, bh=H-pt-pb;
  const x=i => wochen.length===1 ? pl+bw/2 : pl+i*bw/(wochen.length-1);
  const y=n => pt+(6-n)/5*bh;
  const jedes=Math.max(1, Math.ceil(wochen.length/7));
  let g="";
  for(let n=1;n<=6;n++) g+=`<line x1="${pl}" x2="${W-pr}" y1="${y(n)}" y2="${y(n)}" class="lz-gl${n===4?" vier":""}"/><text x="${pl-10}" y="${y(n)+5}" text-anchor="end" class="lz-ax">${n}</text>`;
  wochen.forEach((w,i)=>{ if(i%jedes) return; const d=new Date(w+"T12:00:00"); g+=`<text x="${x(i)}" y="${H-24}" text-anchor="middle" class="lz-ax">KW ${kw(w)}</text><text x="${x(i)}" y="${H-8}" text-anchor="middle" class="lz-ax klein">${d.getDate()}.${d.getMonth()+1}.</text>`; });
  const linien=reihen.map((r,ri)=>{ const pts=r.punkte.map(p=>[x(wochen.indexOf(p.w)), y(p.wert), p]);
    return `<g class="lz-reihe r${ri}">${pts.length>1?`<polyline points="${pts.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" ")}" style="stroke:${r.farbe}"${r.gestrichelt?' stroke-dasharray="7 6"':""}/>`:""}
      ${pts.map(p=>`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${r.gestrichelt?4:6}" style="fill:${r.farbe}"><title>${h(r.name)}, KW ${kw(p[2].w)}: Note ${fmtNote(p[2].wert)} (${p[2].n} ${p[2].n===1?"Test":"Tests"})</title></circle>`).join("")}</g>`; }).join("");
  return `<figure class="lz-chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${h(titel||"Verlauf der Noten")}">${g}${linien}</svg>
    <figcaption>${reihen.map(r=>`<span><i style="background:${r.farbe}"></i>${h(r.name)}</span>`).join("")}<span class="lz-leg4"><i></i>Note 4 (genügend)</span></figcaption></figure>`;
}

/* ================= 5. PDF ================= */
let JSPDF_P=null;
function ladeJsPDF(){
  if(window.jspdf?.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
  if(!JSPDF_P) JSPDF_P=new Promise((ok,err)=>{ const s=document.createElement("script"); s.src=JSPDF_URL; s.integrity="sha384-JcnsjUPPylna1s1fvi1u12X5qjY5OL56iySh75FdtrwhO/SWXgMjoVqcKyIIWOLk"; s.crossOrigin="anonymous"; s.async=true;
    s.onload=()=> window.jspdf?.jsPDF ? ok(window.jspdf.jsPDF) : err(new Error("jsPDF fehlt"));
    s.onerror=()=>{ JSPDF_P=null; s.remove(); err(new Error("jsPDF konnte nicht geladen werden. Bist du online?")); };
    document.head.appendChild(s); });
  return JSPDF_P;
}
// Helvetica (Standardschrift) kennt nur Latin-1: ä ö ü é à « » usw. gehen, Emojis und typografische Zeichen werden ersetzt
const PDF_MAP = {"\u2018":"'","\u2019":"'","\u201A":",","\u201C":'"',"\u201D":'"',"\u201E":'"',"\u2026":"...","\u2013":"-","\u2014":"-","\u2212":"-","\u2022":"-","\u00A0":" ","\u202F":" ","\u2009":" ","\u2011":"-","\u2010":"-","\u2192":"->","\u00DF":"ss","\u2039":"<","\u203A":">","\u20AC":"EUR","\u2264":"<=","\u2265":">=","\u2248":"~","\u00D7":"x"};
function pdfText(s){
  let o=""; for(const ch of String(s??"").replace(/\r/g,"")){ const c=ch.codePointAt(0);
    if(PDF_MAP[ch]!=null){ o+=PDF_MAP[ch]; continue; }
    if(c<=255){ if(c>=0x7F && c<0xA0) continue; o+= (c<32 && ch!=="\n") ? " " : ch; continue; }
    const b=ch.normalize("NFD").replace(/[\u0300-\u036F]/g,""); if(b && b.codePointAt(0)<=255) o+=b; }
  return o.replace(/[ \t]{2,}/g," ").trim();
}
const slug = s => pdfText(s).replace(/[äÄ]/g,"ae").replace(/[öÖ]/g,"oe").replace(/[üÜ]/g,"ue").replace(/[^A-Za-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,40) || "test";
async function pdfSpeichern(doc, name){
  const blob=doc.output("blob");
  if(window.claude && typeof window.claude.use==="function"){
    try{ const dl=await window.claude.use("downloads"); if(dl){ await dl.save({filename:name, data:blob}); return "gespeichert"; } }
    catch(e){ if(e?.code==="declined") return "abgebrochen"; if(e?.code==="rate_limited") return "warten"; }
  }
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=name; a.rel="noopener"; document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 5000);
  return "gespeichert";
}
const FARBE = {blau:[61,90,254], lila:[138,63,224], tinte:[27,34,64], grau:[90,99,133], linie:[205,212,235], gruen:[23,140,78], hell:[243,246,255], gold:[242,180,0]};
/* Prüfung als PDF: schlicht wie eine normale Schulprüfung, schwarz-weiss, ohne Logo und ohne Schmuck */
async function pdfTest(t, klasse, loesung){
  const jsPDF=await ladeJsPDF();
  const doc=new jsPDF({unit:"mm", format:"a4", compress:true});
  const W=210, H=297, M=20, BR=W-2*M, PKT=22; let y=0;
  const schwarz=()=>doc.setTextColor(0,0,0), grau=()=>doc.setTextColor(90,90,90);
  doc.setProperties({title:pdfText(t.titel+(loesung?" (Lösungen)":""))});
  const maxP=maxPunkte(t.fragen), hatMc=t.fragen.some(f=>!istOffen(f)), hatOffen=t.fragen.some(istOffen);
  const linie=(x1,yy,x2)=>{ doc.setDrawColor(0); doc.setLineWidth(0.25); doc.line(x1,yy,x2,yy); };
  // Kopf: Name, Klasse, Datum, Punkte, Note
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
    const hoehe=qz.length*5.4+3+optH+7;
    if(y+hoehe > H-18){ doc.addPage(); y=20; }
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
  for(let pg=1;pg<=n;pg++){ doc.setPage(pg); doc.setFont("helvetica","normal"); doc.setFontSize(8.5); grau();
    doc.text(pdfText(t.titel), M, H-10); doc.text(`Seite ${pg} von ${n}`, W-M, H-10, {align:"right"}); }
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

/* ================= 6. Seiten für Lehrpersonen ================= */
const LZ = { daten:null, lid:null, laedt:false, fehler:"", klasseId:null, testCode:null, kindId:null, neu:null, kid:null, offen:{} };
const app = () => $q("#app");
function rerender(){ if(SEITEN[S.screen]) render(); }
/* Lehrerbereich im Stil der Verwaltung: Kopfzeile, Navigation links, Inhalt rechts, ohne Figuren und Effekte */
const ADMIN_SEITEN = new Set(["lehrer","lklasse","lkind","ltestneu","ltest","lkinder","lliga","lfragen","lbib","lbibseite","lmeld"]);
const NAV_L = [["lehrer","Übersicht","Klassen und Tests"],["lkinder","Kinder","Leistung und Verlauf"],["lliga","Klassen-Liga","Klasse gegen Klasse"],["ltestneu","Neuer Test","Fragen wählen oder selbst schreiben"],["lfragen","Fragendatenbank","alle Fragen lesen"],["lbib","Bibliothek","alle Artikel lesen"],["lmeld","Fehlermeldungen","gemeldete Fehler"]];
const NAV_AKTIV = {lklasse:"lehrer", ltest:"lehrer", lkind:"lkinder", lbibseite:"lbib"};
function shell(html){
  const akt = NAV_AKTIV[S.screen] || S.screen;
  const ich = S.profil ? (S.profil.name || S.profil.email || "") : "";
  const sp = SP ? (SP.art==="supabase" ? "Supabase" : SP.art==="claude" ? "claude.ai" : "dieses Gerät") : "";
  const nm = meldungenLokal().filter(m=>!m.gesendet).length;
  return `<div class="lza">
    <header class="lza-kopf"><button type="button" class="lza-marke" data-lnav="lehrer"><img src="img/fragezeichen.webp" alt="" width="30" height="28"><b>Lehrerbereich</b></button>
      <span class="lza-status">${sp?`<span>Speicher: ${h(sp)}</span>`:""}${ich?`<span>${h(ich)}</span>`:""}<button type="button" class="lza-k" data-lnav="home">Zur App</button></span></header>
    <div class="lza-rahmen">
      <nav class="lza-nav" aria-label="Lehrerbereich">${NAV_L.map(([id,n,u])=>`<button type="button" data-lnav="${id}" class="${id===akt?"an":""}" ${id===akt?'aria-current="page"':""}><span>${n}${id==="lmeld"&&nm?` <i class="lza-zahl">${nm}</i>`:""}</span><small>${u}</small></button>`).join("")}</nav>
      <main class="lza-inhalt">${html}</main>
    </div></div>`;
}
function bindShell(){ $a("[data-lnav]").forEach(b=>b.onclick=()=>{ const z=b.dataset.lnav; if(z==="ltestneu"){ if(!LZ.neu) LZ.neu=null; } if(z==="home"){ document.body.classList.remove("lz-admin"); go("home"); return; } go(z); scrollTo(0,0); }); }
const EMO_VORN = /(<(?:button|h2|h3|summary)(?:\s[^>]*)?>|<span class="bname">)\s*(?:[\p{Extended_Pictographic}\u2190-\u21FF\u2600-\u27BF][\uFE0F\u200D]*\s*)+(?=[A-Za-zÄÖÜäöü«0-9])/gu;
function setze(html){ const a=app(); if(!a) return; if(ADMIN_SEITEN.has(S.screen)){ a.innerHTML=shell(String(html).replace(EMO_VORN,"$1")); bindShell(); } else a.innerHTML=html; bindLc(); }
function lc(pfad, aktuell){ // eigene Brotkrumen
  LZ._lc=pfad.map(p=>p[1]);
  return `<nav class="crumbs" aria-label="Verlauf">${pfad.map((p,i)=>`<button type="button" class="crumb" data-lc="${i}">${i===0?"🏠 ":""}${h(p[0])}</button><span class="sep" aria-hidden="true">›</span>`).join("")}<span class="crumb cur" aria-current="page">${h(aktuell)}</span></nav>`;
}
function bindLc(){ $a("[data-lc]").forEach(b=>b.onclick=()=>{ const f=LZ._lc?.[+b.dataset.lc]; f&&f(); }); }
const START = ["Start", ()=>go("home")];
const LB = ["Lehrerbereich", ()=>go("lehrer")];
function ladeAnzeige(text){ return `<div class="lwait lz-laden"><div class="lz-spinner" aria-hidden="true"></div><p>${h(text||"Wird geladen …")}</p></div>`; }

function datenAktuell(){ return LZ.daten && SP && LZ.lid===SP.lehrerId(); }
async function ladeDaten(){
  if(LZ.laedt) return; LZ.laedt=true; LZ.fehler="";
  try{ const sp=await speicher(); const [k,t]=await Promise.all([sp.klassen(), sp.tests()]); const a=await sp.abgaben();
    LZ.daten={klassen:k, tests:t, abgaben:abgabenEindeutig(abgabenPruefen(a, t))}; LZ.lid=sp.lehrerId(); }
  catch(e){ console.warn("lehrer.js", e); LZ.fehler=fehlerText(e); LZ.daten=null; }
  finally{ LZ.laedt=false; rerender(); }
}
async function neuLaden(){ LZ.daten=null; await ladeDaten(); }
// Vorbedingungen für alle Lehrerseiten; liefert true, wenn die Seite gezeichnet werden darf
function bereitFuerLehrer(titel){
  if(!SP){ setze(lc([START], titel)+ladeAnzeige("Lehrerbereich wird geladen …")); speicher().then(rerender); return false; }
  const lid=SP.lehrerId();
  if(!lid){ seiteAnmelden(); return false; }
  if(!SP.istLehrer()){ seiteRolle(); return false; }
  if(SP.art==="lokal" && !SP.entsperrt()){ seiteEntsperren(); return false; }
  if(LZ.fehler && !LZ.laedt){ setze(lc([START,LB], titel)+`<div class="lwait"><h2>😕 Daten nicht erreichbar</h2><p>${h(LZ.fehler)}</p><div class="row"><button class="big" id="lzNochmal" type="button">Nochmals versuchen</button></div></div>`);
    $q("#lzNochmal").onclick=()=>{ LZ.fehler=""; neuLaden(); }; return false; }
  if(!datenAktuell()){ setze(lc([START], titel)+ladeAnzeige("Deine Klassen und Tests werden geladen …")); ladeDaten(); return false; }
  return true;
}
function seiteAnmelden(){
  const claudeOhneKonto = SP?.art==="claude";
  setze(`${lc([START], "Lehrerbereich")}
    <div class="authbox lz-box">
      <div class="authkopf"><span class="authicon">🎓</span><h1>Lehrerbereich</h1>
      <p>${claudeOhneKonto ? "Für den Lehrerbereich musst du bei claude.ai angemeldet sein." : "Melde dich mit deinem easyplay-Konto an. Danach kannst du dich als Lehrperson freischalten, Klassen anlegen und Tests verteilen."}</p></div>
      ${claudeOhneKonto ? "" : `<button class="big" id="lzIn" type="button">🔑 Anmelden</button><button class="big alt" id="lzReg" type="button">✨ Konto erstellen</button>`}
      <p class="help">Bist du ein Kind und hast einen Test-Code bekommen? <button type="button" class="lz-link" id="lzZumCode">Hier geht es zum Test.</button></p>
    </div>`);
  const merk=()=>{ try{ sessionStorage.setItem("ep-lz-nach-login","1"); }catch(e){} };
  $q("#lzIn") && ($q("#lzIn").onclick=()=>{ merk(); go("login"); });
  $q("#lzReg") && ($q("#lzReg").onclick=()=>{ merk(); go("register"); });
  $q("#lzZumCode").onclick=()=>{ LZ.kid=null; go("lcode"); };
}
function seiteRolle(){
  const lokal = SP.art==="lokal", supa = SP.art==="supabase", wartet = supa && SP.beantragt && SP.beantragt();
  setze(`${lc([START], "Lehrerbereich")}
    <div class="authbox lz-box">
      <div class="authkopf"><span class="authicon">🎓</span><h1>${wartet ? "Dein Lehrerkonto wird geprüft" : "Bist du Lehrperson?"}</h1>
      <p>${wartet ? "Danke! Sobald dein Konto freigegeben ist, kannst du Klassen anlegen und Tests verteilen. Das kann etwas dauern." : "Im Lehrerbereich legst du Klassen an, erstellst Tests mit Code, siehst die Resultate mit Noten und eine Fehleranalyse und druckst Arbeitsblätter."}</p></div>
      ${lokal ? `<label class="pick-lbl" for="lzPw1">Lehrer-Passwort (mindestens 8 Zeichen)</label><input id="lzPw1" class="sel" type="password" autocomplete="new-password">
        <label class="pick-lbl" for="lzPw2">Passwort wiederholen</label><input id="lzPw2" class="sel" type="password" autocomplete="new-password">
        <p class="help">Das Passwort schützt Klassen, PINs und Noten auf diesem Gerät, damit Kinder sie nicht sehen. Es lässt sich nicht wiederherstellen, bitte gut merken.</p>` : ""}
      ${wartet ? `<button class="big" id="lzPruef" type="button">🔄 Nochmals prüfen</button>` : `<button class="big gold" id="lzRolle" type="button">🎓 ${supa ? "Als Lehrperson anmelden" : "Ich bin Lehrperson"}</button>`}
      <p class="help">${supa && !wartet ? "Dein Konto wird danach von uns kurz geprüft und freigegeben. " : ""}Kinder brauchen kein Konto: Sie lösen Tests nur mit Test-Code und PIN.</p>
      <p class="err" id="lzRolleErr" aria-live="polite"></p>
    </div>`);
  const pruef=$q("#lzPruef"); if(pruef) pruef.onclick=async()=>{ pruef.disabled=true; await SP.neuPruefen(); if(SP.istLehrer()) go("lehrer"); else { $q("#lzRolleErr").textContent="Noch nicht freigegeben."; pruef.disabled=false; } };
  const b0=$q("#lzRolle"); if(b0) b0.onclick=async()=>{ const b=b0; b.disabled=true;
    try{ let pw;
      if(lokal){ pw=$q("#lzPw1").value; if(pw.length<8) throw new Error("Das Passwort braucht mindestens 8 Zeichen."); if(pw!==$q("#lzPw2").value) throw new Error("Die beiden Passwörter sind nicht gleich."); }
      await SP.rolleSetzen(pw); go("lehrer"); }
    catch(e){ $q("#lzRolleErr").textContent=/Passw/.test(e.message||"") ? e.message : fehlerText(e); b.disabled=false; } };
}
function seiteEntsperren(){
  const neu = !SP.hatPasswort();
  setze(`${lc([START], "Lehrerbereich")}
    <div class="authbox lz-box">
      <div class="authkopf"><span class="authicon">🔒</span><h1>${neu ? "Lehrer-Passwort festlegen" : "Lehrerbereich entsperren"}</h1>
      <p>${neu ? "Neu schützt ein Passwort deine Klassen, PINs und Noten auf diesem Gerät, damit Kinder sie nicht sehen." : "Bitte gib dein Lehrer-Passwort ein."}</p></div>
      <label class="pick-lbl" for="lzPwE">${neu ? "Neues Lehrer-Passwort (mindestens 8 Zeichen)" : "Lehrer-Passwort"}</label><input id="lzPwE" class="sel" type="password" autocomplete="${neu ? "new-password" : "current-password"}">
      ${neu ? `<label class="pick-lbl" for="lzPwE2">Passwort wiederholen</label><input id="lzPwE2" class="sel" type="password" autocomplete="new-password">` : ""}
      <button class="big" id="lzOffen" type="button">${neu ? "Speichern und öffnen" : "🔓 Entsperren"}</button>
      <p class="err" id="lzPwErr" aria-live="polite"></p>
    </div>`);
  const los=async()=>{ const b=$q("#lzOffen"), pw=$q("#lzPwE").value; b.disabled=true; $q("#lzPwErr").textContent="";
    try{ if(neu){ if(pw!==$q("#lzPwE2").value) throw new Error("Die beiden Passwörter sind nicht gleich."); await SP.passwortSetzen(pw); go("lehrer"); return; }
      if(await SP.entsperren(pw)){ go("lehrer"); return; } $q("#lzPwErr").textContent="Das Passwort stimmt nicht."; }
    catch(e){ $q("#lzPwErr").textContent=e.message||String(e); }
    b.disabled=false; };
  $q("#lzOffen").onclick=los; $q("#lzPwE").onkeydown=e=>{ if(e.key==="Enter") los(); };
  setTimeout(()=>{ try{ $q("#lzPwE").focus(); }catch(e){} }, 50);
}
function hinweisSpeicher(){
  if(!SP) return "";
  if(SP.art==="lokal") return `<div class="lz-hinweis">💡 <span><b>Gespeichert auf diesem Gerät.</b> Klassen, Tests und Resultate bleiben in diesem Browser. Das passt, wenn die Kinder am selben Gerät (z. B. Tablet im Schulzimmer) lösen. Für mehrere Geräte braucht es Supabase, siehe <i>ANLEITUNG-LEHRER.md</i>.</span></div>`;
  if(SP.art==="claude" && !SP.admin()) return `<div class="lz-hinweis">💡 <span>Resultate der Kinder sieht nur, wer dieses Artifact bearbeiten darf (Editor oder Owner). Bitte die Besitzerin oder den Besitzer, dich als Editor hinzuzufügen.</span></div>`;
  return "";
}
const datenschutz = () => `<div class="lz-hinweis lz-ds">🔒 <span><b>Datenschutz:</b> Erfasse nur Vornamen oder Kürzel (z. B. «Lena» oder «LM»), keine Nachnamen, Geburtsdaten, E-Mail-Adressen oder Fotos. Die Kinder melden sich nur mit dem Test-Code und ihrem PIN an. Lösche Klassen am Ende des Schuljahres.</span></div>`;
function sjOptionen(sel){ return SCHULJAHRE.map(s=>`<option value="${s.id}" ${s.id===sel?"selected":""}>${h(s.name)}${s.harmos?` · HarmoS ${s.harmos}`:""}</option>`).join(""); }
function zyOptionen(sel){ return [1,2,3].map(z=>`<option value="${z}" ${+sel===z?"selected":""}>Zyklus ${z}</option>`).join(""); }
function klasseVon(id){ return LZ.daten?.klassen.find(k=>k.id===id) || null; }
function testsVon(kid){ return (LZ.daten?.tests||[]).filter(t=>t.klasseId===kid); }
function abgabenVon(code){ return (LZ.daten?.abgaben||[]).filter(a=>a.code===code); }

function seiteLehrer(){
  if(!bereitFuerLehrer("Lehrerbereich")) return;
  const D=LZ.daten;
  const kl=D.klassen.map(k=>{ const ts=testsVon(k.id); const ab=D.abgaben.filter(a=>ts.some(t=>t.code===a.code)); const s=schnitt(ab.map(a=>a.note));
    return `<button type="button" class="mtitem lz-item" data-k="${h(k.id)}"><b>👥 ${h(k.name)}</b><span>${h(sjName(k.schuljahr))} · Zyklus ${h(k.zyklus||"-")} · ${(k.schueler||[]).length} ${(k.schueler||[]).length===1?"Kind":"Kinder"} · ${ts.length} ${ts.length===1?"Test":"Tests"}${s!=null?` · Ø Note ${fmtNote(s)}`:""}</span></button>`; }).join("");
  const te=D.tests.map(t=>{ const k=klasseVon(t.klasseId); const ab=abgabenVon(t.code); const s=schnitt(ab.map(a=>a.note));
    return `<button type="button" class="mtitem lz-item" data-t="${h(t.code)}"><b>📝 ${h(t.titel)} ${t.aktiv===false?`<span class="lz-tag zu">geschlossen</span>`:""}</b><span>${h(k?.name||"ohne Klasse")} · Code <b class="lz-code">${h(t.code)}</b> · ${ab.length}/${(k?.schueler||[]).length} abgegeben${s!=null?` · Ø Note ${fmtNote(s)}`:""} · ${datum(t.erstellt)}</span></button>`; }).join("");
  setze(`${lc([START], "Lehrerbereich")}
    <div class="bhead"><span class="emo" aria-hidden="true">🎓</span><h1>Lehrerbereich</h1></div>
    <p class="bdesc">Klassen verwalten, Tests mit Code verteilen, Resultate und Lernfortschritte im Blick behalten.</p>
    ${hinweisSpeicher()}
    <div class="lz-grid2">
      <section class="statcard"><h2>👥 Meine Klassen</h2>
        <div class="mtlist">${kl || `<p class="empty">Noch keine Klasse. Lege unten deine erste Klasse an.</p>`}</div>
        <details class="lz-neu" ${D.klassen.length?"":"open"}><summary>➕ Neue Klasse anlegen</summary>
          <div class="lz-form">
            <label for="lzKName">Name der Klasse</label><input id="lzKName" class="sel" maxlength="60" placeholder="z. B. 4b Schulhaus Lindenhof">
            <div class="lz-zwei"><div><label for="lzKSj">Schuljahr</label><select id="lzKSj" class="sel">${sjOptionen("h6")}</select></div>
            <div><label for="lzKZy">Zyklus</label><select id="lzKZy" class="sel">${zyOptionen(2)}</select></div></div>
            <p class="err" id="lzKErr" aria-live="polite"></p>
            <button class="big" id="lzKNeu" type="button">Klasse anlegen</button>
          </div></details>
      </section>
      <section class="statcard"><h2>📝 Meine Tests</h2>
        <div class="row lz-links"><button class="big gold" id="lzTNeu" type="button" ${D.klassen.length?"":"disabled"}>➕ Neuer Test</button></div>
        ${D.klassen.length?"":`<p class="help">Lege zuerst eine Klasse an.</p>`}
        <div class="mtlist">${te || `<p class="empty">Noch keine Tests.</p>`}</div>
      </section>
    </div>
    ${datenschutz()}
    <div class="row"><button class="big alt small" id="lzReload" type="button">🔄 Aktualisieren</button><button class="big alt small" id="lzZumCode2" type="button">🔢 Test als Kind öffnen</button></div>`);
  $a("[data-k]").forEach(b=>b.onclick=()=>{ LZ.klasseId=b.dataset.k; go("lklasse"); });
  $a("[data-t]").forEach(b=>b.onclick=()=>{ LZ.testCode=b.dataset.t; go("ltest"); });
  $q("#lzKSj").onchange=e=>{ const s=sjObj(e.target.value); if(s) $q("#lzKZy").value=String(s.zyklus); };
  $q("#lzKNeu").onclick=async()=>{
    const name=$q("#lzKName").value.trim().slice(0,60); if(!name){ $q("#lzKErr").textContent="Bitte gib der Klasse einen Namen."; $q("#lzKName").focus(); return; }
    const k={id:neueId(), name, schuljahr:$q("#lzKSj").value, zyklus:+$q("#lzKZy").value, schueler:[], erstellt:new Date().toISOString()};
    const b=$q("#lzKNeu"); b.disabled=true;
    try{ await SP.klasseSpeichern(k, []); LZ.daten.klassen.push(k); LZ.klasseId=k.id; toast("Klasse angelegt. Jetzt Kinder hinzufügen.","ok"); go("lklasse"); }
    catch(e){ $q("#lzKErr").textContent=fehlerText(e); b.disabled=false; }
  };
  $q("#lzTNeu").onclick=()=>{ LZ.neu=null; go("ltestneu"); };
  $q("#lzReload").onclick=()=>neuLaden();
  $q("#lzZumCode2").onclick=()=>{ LZ.kid=null; go("lcode"); };
}

function tabelleKindTest(k, ts){
  const kids=k.schueler||[]; if(!kids.length || !ts.length) return `<p class="empty">Noch keine Tests oder Kinder in dieser Klasse.</p>`;
  const tsorted=[...ts].sort((a,b)=>String(a.erstellt).localeCompare(String(b.erstellt)));
  const zell=(kid,t)=>{ const a=LZ.daten.abgaben.find(x=>x.code===t.code && x.sid===kid.id); return a ? `<td class="lz-n ${noteKlasse(a.note)}" title="${h(a.punkte)}/${h(a.max)} Punkte">${fmtNote(a.note)}</td>` : `<td class="lz-n leer" title="noch nicht abgegeben">·</td>`; };
  return `<div class="lz-tabwrap" tabindex="0" role="region" aria-label="Tabelle Kinder und Tests"><table class="lz-tab">
    <thead><tr><th scope="col">Kind</th>${tsorted.map(t=>`<th scope="col" title="${h(t.titel)}"><button type="button" class="lz-th" data-t="${h(t.code)}">${h(t.titel.length>14?t.titel.slice(0,13)+"…":t.titel)}</button><small>${datum(t.erstellt)}</small></th>`).join("")}<th scope="col">Ø</th></tr></thead>
    <tbody>${kids.map(kid=>{ const ns=LZ.daten.abgaben.filter(a=>a.sid===kid.id && tsorted.some(t=>t.code===a.code)).map(a=>a.note); const s=schnitt(ns);
      return `<tr><th scope="row"><button type="button" class="lz-th" data-kind="${h(kid.id)}">${h(kid.name)}</button></th>${tsorted.map(t=>zell(kid,t)).join("")}<td class="lz-n ${noteKlasse(s)} fett">${s!=null?fmtNote(s):"·"}</td></tr>`; }).join("")}
    <tr class="lz-schnitt"><th scope="row">Ø Klasse</th>${tsorted.map(t=>{ const s=schnitt(abgabenVon(t.code).map(a=>a.note)); return `<td class="lz-n ${noteKlasse(s)}">${s!=null?fmtNote(s):"·"}</td>`; }).join("")}<td></td></tr></tbody></table></div>`;
}
function fehlerListe(liste, max, proKind){
  const l=liste.filter(x=>x.falsch>0).slice(0,max||15);
  if(!l.length) return `<p class="empty">${proKind?"Keine Fehler, super!":"Noch keine falschen Antworten. Sobald Resultate da sind, erscheint hier die Fehleranalyse."}</p>`;
  return `<ol class="lz-fehler">${l.map(x=>{ const f=x.f; const p=Math.round(x.quote*100);
    return `<li><div class="lz-fkopf"><b>${h(f.q)}</b><small>${f.nr?`Nr. ${f.nr} · `:""}${h(themaName(f.t))} · ${h([...x.tests].join(", "))}</small></div>
      ${proKind ? "" : `<div class="lz-quote"><span class="lz-bar"><i style="width:${p}%"></i></span><b>${p} %</b><small>${x.falsch} von ${x.n} falsch</small></div>`}
      <p class="lz-ant">${proKind ? `<span class="ans-bad">Antwort: «${h(x.dein||"")}»</span>` : x.top ? `<span class="ans-bad">Häufigste falsche Antwort: «${h(x.top.text)}» (${x.top.n}×)</span>` : ""}<span class="ans-ok">Richtig: «${h(f.o[f.r])}»</span></p></li>`; }).join("")}</ol>`;
}
function themenBalken(l){
  if(!l.length) return "";
  return `<ul class="lz-themen">${l.slice(0,8).map(x=>{ const p=Math.round(x.quote*100); return `<li><span>${h(themaName(x.t))}</span><span class="lz-bar"><i style="width:${p}%"></i></span><b>${p} %</b><small>${x.falsch}/${x.n}</small></li>`; }).join("")}</ul>`;
}

function seiteKlasse(){
  if(!bereitFuerLehrer("Klasse")) return;
  const k=klasseVon(LZ.klasseId); if(!k){ go("lehrer"); return; }
  const ts=testsVon(k.id), ab=LZ.daten.abgaben.filter(a=>ts.some(t=>t.code===a.code));
  const kids=k.schueler||[];
  setze(`${lc([START,LB], k.name)}
    <div class="bhead"><span class="emo" aria-hidden="true">👥</span><h1>${h(k.name)}</h1></div>
    <p class="bdesc">${h(sjName(k.schuljahr))} · Zyklus ${h(k.zyklus||"-")} · ${kids.length} ${kids.length===1?"Kind":"Kinder"} · ${ts.length} ${ts.length===1?"Test":"Tests"}</p>
    <div class="lz-grid2">
      <section class="statcard"><h2>🧒 Kinder und PINs</h2>
        ${kids.length ? `<ul class="lz-kinder">${kids.map(s=>`<li><button type="button" class="lz-kname" data-kind="${h(s.id)}">${h(s.name)}</button><span class="lz-pin" aria-label="PIN ${h(s.pin)}">${h(s.pin)}</span>
            <span class="lz-kakt"><button type="button" class="lz-mini" data-pinneu="${h(s.id)}" title="Neuen PIN erzeugen" aria-label="Neuen PIN für ${h(s.name)}">🔁</button><button type="button" class="lz-mini" data-weg="${h(s.id)}" title="Entfernen" aria-label="${h(s.name)} entfernen">🗑️</button></span></li>`).join("")}</ul>`
          : `<p class="empty">Noch keine Kinder in dieser Klasse.</p>`}
        <div class="lz-form">
          <label for="lzKids">Kinder hinzufügen (nur Vorname oder Kürzel, eines pro Zeile)</label>
          <textarea id="lzKids" class="sel lz-ta" rows="4" placeholder="Lena&#10;Noah&#10;Mia S."></textarea>
          <p class="err" id="lzKidsErr" aria-live="polite"></p>
          <div class="row lz-links"><button class="big" id="lzKidsAdd" type="button">➕ Hinzufügen</button>${kids.length?`<button class="big alt" id="lzPinPdf" type="button">🖨️ PIN-Kärtchen (PDF)</button>`:""}</div>
        </div>
      </section>
      <section class="statcard"><h2>⚙️ Klasse bearbeiten</h2>
        <div class="lz-form">
          <label for="lzEName">Name</label><input id="lzEName" class="sel" maxlength="60" value="${h(k.name)}">
          <div class="lz-zwei"><div><label for="lzESj">Schuljahr</label><select id="lzESj" class="sel">${sjOptionen(k.schuljahr)}</select></div>
          <div><label for="lzEZy">Zyklus</label><select id="lzEZy" class="sel">${zyOptionen(k.zyklus)}</select></div></div>
          <p class="err" id="lzEErr" aria-live="polite"></p>
          <div class="row lz-links"><button class="big alt" id="lzESave" type="button">💾 Speichern</button><button class="big gold" id="lzTNeuK" type="button">📝 Test für diese Klasse</button></div>
        </div>
      </section>
    </div>
    <section class="statcard lz-sek"><h2>📈 Lernfortschritt der Klasse</h2>
      <p class="help">Durchschnittliche Note pro Woche über alle Tests dieser Klasse.</p>
      ${verlaufSVG([{name:"Ø Klasse", farbe:"var(--welt)", punkte:wochenSchnitt(ab).map(p=>({w:p.w, wert:p.wert, n:p.n}))}], "Notenverlauf der Klasse")}
    </section>
    <section class="statcard lz-sek"><h2>📋 Noten: Kinder × Tests</h2>${tabelleKindTest(k, ts)}</section>
    ${ligaKlasseHTML(k)}
    <section class="statcard lz-sek"><h2>🔍 Fehleranalyse der Klasse</h2>
      <p class="help">Fragen, die in allen Tests dieser Klasse am häufigsten falsch beantwortet wurden.</p>
      ${themenBalken(themenQuote(ts, ab))}
      ${fehlerListe(fehlerAnalyse(ts, ab), 15)}
    </section>
    ${datenschutz()}
    <div class="row"><button class="big alt small lz-gefahr" id="lzKDel" type="button">🗑️ Klasse löschen</button></div>`);
  const speichern=async(neu, msg)=>{ try{ await SP.klasseSpeichern(neu, LZ.daten.tests); Object.assign(k, neu); toast(msg||"Gespeichert.","ok"); rerender(); }catch(e){ toast(fehlerText(e),"bad"); } };
  $a("[data-kind]").forEach(b=>b.onclick=()=>{ LZ.kindId=b.dataset.kind; go("lkind"); });
  $a("[data-t]").forEach(b=>b.onclick=()=>{ LZ.testCode=b.dataset.t; go("ltest"); });
  $q("#lzESj").onchange=e=>{ const s=sjObj(e.target.value); if(s) $q("#lzEZy").value=String(s.zyklus); };
  $q("#lzKidsAdd").onclick=()=>{
    const roh=$q("#lzKids").value.split(/[\n,;]+/).map(x=>x.replace(/\s+/g," ").trim()).filter(Boolean);
    if(!roh.length){ $q("#lzKidsErr").textContent="Bitte mindestens einen Vornamen oder ein Kürzel eingeben."; return; }
    const falsch=roh.filter(n=>n.split(" ").length>2 || /@|\d{3,}/.test(n) || n.length>30);
    if(falsch.length){ $q("#lzKidsErr").textContent=`Bitte nur Vorname oder Kürzel (höchstens zwei Wörter, ohne E-Mail): ${falsch.slice(0,3).join(", ")}`; return; }
    if(kids.length+roh.length>60){ $q("#lzKidsErr").textContent="Höchstens 60 Kinder pro Klasse."; return; }
    const pins=kids.map(s=>s.pin); const neue=roh.map(n=>{ const p=neuerPin(pins); pins.push(p); return {id:neueId(), name:n, pin:p}; });
    speichern({...k, schueler:[...kids, ...neue]}, `${neue.length} ${neue.length===1?"Kind":"Kinder"} hinzugefügt.`);
  };
  $a("[data-pinneu]").forEach(b=>b.onclick=()=>{ const s=kids.find(x=>x.id===b.dataset.pinneu); if(!s || !confirm(`Neuen PIN für ${s.name} erzeugen? Der alte PIN gilt dann nicht mehr.`)) return;
    const p=neuerPin(kids.map(x=>x.pin)); speichern({...k, schueler:kids.map(x=>x.id===s.id?{...x, pin:p}:x)}, `Neuer PIN für ${s.name}: ${p}`); });
  $a("[data-weg]").forEach(b=>b.onclick=()=>{ const s=kids.find(x=>x.id===b.dataset.weg); if(!s || !confirm(`${s.name} aus der Klasse entfernen? Die Resultate dieses Kindes werden nicht mehr angezeigt.`)) return;
    LZ.daten.abgaben=LZ.daten.abgaben.filter(a=>!(a.sid===s.id && SP.art!=="claude"));
    speichern({...k, schueler:kids.filter(x=>x.id!==s.id)}, `${s.name} entfernt.`); });
  $q("#lzESave").onclick=()=>{ const name=$q("#lzEName").value.trim().slice(0,60); if(!name){ $q("#lzEErr").textContent="Der Name darf nicht leer sein."; return; }
    speichern({...k, name, schuljahr:$q("#lzESj").value, zyklus:+$q("#lzEZy").value}); };
  $q("#lzTNeuK").onclick=()=>{ LZ.neu=null; LZ.neuKlasse=k.id; go("ltestneu"); };
  $a("[data-lzl-zu]").forEach(b=>b.onclick=()=>{ go("lliga"); scrollTo(0,0); });
  $q("#lzPinPdf") && ($q("#lzPinPdf").onclick=async()=>{ const b=$q("#lzPinPdf"); b.disabled=true; try{ const d=await pdfPins(k); const r=await pdfSpeichern(d, `PIN-Kaertchen-${slug(k.name)}.pdf`); if(r==="gespeichert") toast("PDF erstellt.","ok"); }catch(e){ toast(fehlerText(e),"bad"); } b.disabled=false; });
  $q("#lzKDel").onclick=async()=>{ if(!confirm(`Klasse «${k.name}» mit allen Tests und Resultaten löschen? Das kann nicht rückgängig gemacht werden.`)) return;
    try{ await SP.klasseLoeschen(k.id, LZ.daten.tests); toast("Klasse gelöscht.","ok"); await neuLaden(); go("lehrer"); }catch(e){ toast(fehlerText(e),"bad"); } };
}

function seiteKind(){
  if(!bereitFuerLehrer("Kind")) return;
  const k=LZ.daten.klassen.find(x=>(x.schueler||[]).some(s=>s.id===LZ.kindId)); const s=k?.schueler.find(x=>x.id===LZ.kindId);
  if(!k||!s){ go("lehrer"); return; }
  const ts=testsVon(k.id), abK=LZ.daten.abgaben.filter(a=>a.sid===s.id && ts.some(t=>t.code===a.code)), abAlle=LZ.daten.abgaben.filter(a=>ts.some(t=>t.code===a.code));
  const sn=schnitt(abK.map(a=>a.note));
  setze(`${lc([START,LB,[k.name,()=>{ LZ.klasseId=k.id; go("lklasse"); }]], s.name)}
    <div class="bhead"><span class="emo" aria-hidden="true">🧒</span><h1>${h(s.name)}</h1></div>
    <p class="bdesc">${h(k.name)} · PIN <b class="lz-code">${h(s.pin)}</b> · ${abK.length} von ${ts.length} Tests gelöst${sn!=null?` · Ø Note ${fmtNote(sn)}`:""}</p>
    <section class="statcard lz-sek"><h2>📈 Lernfortschritt</h2>
      ${verlaufSVG([{name:s.name, farbe:"var(--alltag)", punkte:wochenSchnitt(abK)}, {name:"Ø Klasse", farbe:"var(--welt)", gestrichelt:true, punkte:wochenSchnitt(abAlle)}], "Notenverlauf von "+s.name)}
    </section>
    <section class="statcard lz-sek"><h2>📝 Tests</h2>
      ${ts.length?`<div class="lz-tabwrap"><table class="lz-tab lz-liste"><thead><tr><th scope="col">Test</th><th scope="col">Punkte</th><th scope="col">Note</th><th scope="col">Zeit</th><th scope="col">Datum</th></tr></thead><tbody>
      ${[...ts].sort((a,b)=>String(a.erstellt).localeCompare(String(b.erstellt))).map(t=>{ const a=abK.find(x=>x.code===t.code); return `<tr><th scope="row"><button type="button" class="lz-th" data-t="${h(t.code)}">${h(t.titel)}</button></th>${a?`<td>${h(a.punkte)}/${h(a.max)}</td><td class="lz-n ${noteKlasse(a.note)}">${fmtNote(a.note)}</td><td>${h(zeit(a.dauer))}</td><td>${datum(a.datum)}</td>`:`<td colspan="4" class="lz-offen">noch nicht abgegeben</td>`}</tr>`; }).join("")}
      </tbody></table></div>`:`<p class="empty">Noch keine Tests.</p>`}
    </section>
    <section class="statcard lz-sek"><h2>🔍 Fehleranalyse für ${h(s.name)}</h2>
      <h3 class="lz-h3">Themen mit den meisten Fehlern</h3>${themenBalken(themenQuote(ts, abK)) || `<p class="empty">Noch keine Resultate.</p>`}
      <h3 class="lz-h3">Falsch beantwortete Fragen</h3>${fehlerListe(fehlerAnalyse(ts, abK, s.id), 30, true)}
    </section>`);
  $a("[data-t]").forEach(b=>b.onclick=()=>{ LZ.testCode=b.dataset.t; go("ltest"); });
}

/* ---------- Test erstellen ---------- */
function themaOptionen(sel){
  const o=(v,l,ind)=>`<option value="${h(v)}" ${sel===v?"selected":""}>${ind?"   ":""}${h(l)}</option>`;
  let html=o("","Alle Themen");
  (typeof BEREICHE!=="undefined"?BEREICHE:[]).forEach(b=>{
    html+=`<optgroup label="${h(b.name)}">`+o("b:"+b.id, "Ganzer Bereich «"+b.name+"»");
    b.themen.forEach(t=>{
      if(t.id==="geschichte" && typeof GESCH_EPOCHEN!=="undefined"){ html+=o("geschichte","Geschichte, alles")+GESCH_EPOCHEN.map(e=>o(e.id,e.name,1)).join("")+(typeof CH_ALLG!=="undefined"?o(CH_ALLG.id,"Schweizer Geschichte",1):"")+(typeof KANTONE!=="undefined"?o("kt_alle","Alle Kantone",1):""); return; }
      if(t.kids){ html+=o(t.id, t.name+", alles")+t.kids.map(k=>o(k, themaName(k), 1)).join(""); return; }
      html+=o(t.id,t.name);
    });
    html+="</optgroup>";
  });
  return html;
}
function themaIds(v){
  if(!v) return null;
  if(v.startsWith("b:")){ const b=(typeof BEREICHE!=="undefined"?BEREICHE:[]).find(x=>x.id===v.slice(2)); return b ? b.themen.flatMap(t=>themaIds(t.id)||[]) : null; }
  if(v==="geschichte"){ try{ return GESCH_IDS; }catch(e){ return []; } }
  if(v==="kt_alle"){ try{ return KANTONE.map(k=>k.id); }catch(e){ return []; } }
  if(typeof THEMA!=="undefined" && THEMA[v]?.kids) return THEMA[v].kids;
  return [v];
}
function themaLabel(v){ if(!v) return "Gemischt"; if(v.startsWith("b:")) return (BEREICHE.find(x=>x.id===v.slice(2))?.name)||"Bereich"; if(v==="kt_alle") return "Kantone"; return themaName(v); }
function neuStart(){
  const kid = LZ.neuKlasse && klasseVon(LZ.neuKlasse) ? LZ.neuKlasse : LZ.daten.klassen[0]?.id || "";
  const k=klasseVon(kid);
  LZ.neu={titel:"", klasseId:kid, schuljahr:k?.schuljahr||"h6", thema:"", stufe:0, unter:"", anzahl:10, modus:"zufall", sel:[], fmap:new Map(), suche:"", lp21:[], lpAuto:true, fach:"", edit:{}, alleOffen:false, bearb:null, entwurf:{art:"mc", q:"", a:["","","",""], m:"", p:2, z:4}};
  LZ.neuKlasse=null; lpAuto();
}
function zyklusNeu(){ const n=LZ.neu; const s=sjObj(n.schuljahr); return s ? s.zyklus : (klasseVon(n.klasseId)?.zyklus||2); }
function lpAuto(){ const n=LZ.neu; if(!n.lpAuto) return; n.lp21=lp21Vorschlag(themaIds(n.thema)||[], zyklusNeu()); n.fach = n.lp21[0] ? LP21_KB[n.lp21[0]].fach : n.fach; }
function poolNeu(ohneUnter){
  const n=LZ.neu; const ids=themaIds(n.thema); const set=ids?new Set(ids):null; const u=ohneUnter?"":n.unter.trim().toLowerCase();
  return alleFr().filter(f=>f && typeof THEMA!=="undefined" && THEMA[f.t] && !f.img && Array.isArray(f.a) && f.a.length===4 && (!n.stufe || f.l===n.stufe) && (!set || set.has(f.t)) && (!u || String(f.s||"").toLowerCase().includes(u)));
}
/* Frage so, wie sie im Test steht: Fragetext und Art (Auswahl oder offen) können geändert sein */
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
  if(n.bearb===k) return `<li class="lza-bearb"><div class="lz-form">
      <label for="lzEdQ">Fragetext</label><textarea id="lzEdQ" class="sel" rows="2" maxlength="600">${h(tf.q)}</textarea>
      ${f.eigen?"":`<label class="lz-schalter"><input type="checkbox" id="lzEdOffen" ${offen?"checked":""} ${n.alleOffen?"disabled":""}><span>Als offene Frage (ohne Auswahlantworten)</span></label>`}
      ${offen?`<label for="lzEdM">Musterlösung (für dich und das Lösungsblatt)</label><textarea id="lzEdM" class="sel" rows="2" maxlength="1000">${h(tf.m)}</textarea>
        <div class="lz-zwei"><div><label for="lzEdP">Punkte</label><input id="lzEdP" class="sel" type="number" min="1" max="20" value="${tf.p}"></div><div><label for="lzEdZ">Schreiblinien im PDF</label><input id="lzEdZ" class="sel" type="number" min="1" max="15" value="${tf.z}"></div></div>`
        :`<p class="help">Antworten: ${f.a.map((a,i)=>i===0?`<b>${h(a)}</b>`:h(a)).join(" · ")}</p>`}
      <div class="row lz-links"><button type="button" class="big small" id="lzEdOk">Übernehmen</button><button type="button" class="big alt small" id="lzEdAb">Abbrechen</button>${ed.q!=null&&!f.eigen?`<button type="button" class="big alt small" id="lzEdOrig">Originaltext</button>`:""}</div></div></li>`;
  return `<li><span><b>${h(tf.q)}</b><small>${meta}${offen?(tf.m?` · Lösung: ${h(tf.m)}`:""):` · richtig: ${h(f.a[0])}`}${ed.q!=null?" · Text geändert":""}</small></span>
    <span class="lza-selakt"><button type="button" class="lz-mini" data-ed="${h(k)}" title="Bearbeiten" aria-label="Frage bearbeiten">✏️</button><button type="button" class="lz-mini" data-rm="${h(k)}" aria-label="Frage entfernen">✕</button></span></li>`;
}
function selBinden(n, neu){
  $a("[data-ed]").forEach(b=>b.onclick=()=>neu(()=>{ n.bearb=b.dataset.ed; }));
  const ok=$q("#lzEdOk"); if(!ok) return; const k=n.bearb; const f=n.fmap.get(k);
  ok.onclick=()=>neu(()=>{ const q=$q("#lzEdQ").value.trim(); if(!q) return;
    if(f && f.eigen){ f.q=q; const m=$q("#lzEdM"); if(m){ f.m=m.value.trim(); f.p=+$q("#lzEdP").value||1; f.z=+$q("#lzEdZ").value||3; } }
    else { const ed=n.edit[k]=n.edit[k]||{}; if(f && q!==f.q) ed.q=q; else delete ed.q; const o=$q("#lzEdOffen"); if(o) ed.offen=o.checked;
      const m=$q("#lzEdM"); if(m){ ed.m=m.value.trim(); ed.p=+$q("#lzEdP").value||1; ed.z=+$q("#lzEdZ").value||3; } }
    n.bearb=null; });
  $q("#lzEdAb").onclick=()=>neu(()=>{ n.bearb=null; });
  const og=$q("#lzEdOrig"); og && (og.onclick=()=>neu(()=>{ if(n.edit[k]) delete n.edit[k].q; n.bearb=null; }));
  const off=$q("#lzEdOffen"); off && (off.onchange=()=>neu(()=>{ const ed=n.edit[k]=n.edit[k]||{}; ed.offen=off.checked; const q=$q("#lzEdQ").value.trim(); if(f && q && q!==f.q) ed.q=q; }));
}
function entwurfHTML(n){
  const E=n.entwurf;
  return `<p class="help">Schreib deine eigene Frage, mit vier Antworten zur Auswahl oder als offene Frage, bei der die Kinder selbst schreiben. Offene Fragen korrigierst du nach der Abgabe.</p>
    <div class="segs" role="group" aria-label="Fragenart"><button type="button" class="seg" data-ea="mc" aria-pressed="${E.art==="mc"}">Mit Auswahl (A bis D)</button><button type="button" class="seg" data-ea="offen" aria-pressed="${E.art==="offen"}">Offene Frage</button></div>
    <div class="lz-form"><label for="lzEQ">Fragetext</label><textarea id="lzEQ" class="sel" rows="2" maxlength="600" placeholder="z. B. Nenne zwei Gründe, warum die Schweiz vier Landessprachen hat.">${h(E.q)}</textarea>
    ${E.art==="mc" ? `<div class="lz-zwei"><div><label for="lzEA0">Richtige Antwort</label><input id="lzEA0" class="sel" maxlength="200" value="${h(E.a[0])}"></div><div><label for="lzEA1">Falsche Antwort 1</label><input id="lzEA1" class="sel" maxlength="200" value="${h(E.a[1])}"></div></div>
      <div class="lz-zwei"><div><label for="lzEA2">Falsche Antwort 2</label><input id="lzEA2" class="sel" maxlength="200" value="${h(E.a[2])}"></div><div><label for="lzEA3">Falsche Antwort 3</label><input id="lzEA3" class="sel" maxlength="200" value="${h(E.a[3])}"></div></div>`
      : `<label for="lzEM">Musterlösung (erscheint nur auf dem Lösungsblatt)</label><textarea id="lzEM" class="sel" rows="2" maxlength="1000">${h(E.m)}</textarea>
      <div class="lz-zwei"><div><label for="lzEP">Punkte</label><input id="lzEP" class="sel" type="number" min="1" max="20" value="${E.p}"></div><div><label for="lzEZ">Schreiblinien im PDF</label><input id="lzEZ" class="sel" type="number" min="1" max="15" value="${E.z}"></div></div>`}
    <p class="err" id="lzEErr2" aria-live="polite"></p>
    <div class="row lz-links"><button type="button" class="big" id="lzEAdd">Frage hinzufügen</button></div></div>`;
}
function entwurfBinden(n, neu){
  const E=n.entwurf, $v=id=>$q(id)?.value ?? "";
  const lesen=()=>{ E.q=$v("#lzEQ"); if(E.art==="mc") [0,1,2,3].forEach(i=>E.a[i]=$v("#lzEA"+i)); else { E.m=$v("#lzEM"); E.p=Math.max(1,Math.min(20,+$v("#lzEP")||1)); E.z=Math.max(1,Math.min(15,+$v("#lzEZ")||3)); } };
  $a("#lzEQ,#lzEA0,#lzEA1,#lzEA2,#lzEA3,#lzEM,#lzEP,#lzEZ").forEach(x=>x.oninput=lesen);
  $a("[data-ea]").forEach(b=>b.onclick=()=>neu(()=>{ lesen(); E.art=b.dataset.ea; }));
  $q("#lzEAdd").onclick=()=>{ lesen(); const err=$q("#lzEErr2"); const q=E.q.trim();
    if(q.length<3){ err.textContent="Bitte einen Fragetext schreiben."; return; }
    if(E.art==="mc" && E.a.some(a=>!a.trim())){ err.textContent="Bitte alle vier Antworten ausfüllen."; return; }
    if(E.art==="mc" && new Set(E.a.map(a=>a.trim().toLowerCase())).size<4){ err.textContent="Die vier Antworten müssen verschieden sein."; return; }
    if(n.sel.length>=MAX_FRAGEN){ err.textContent=`Höchstens ${MAX_FRAGEN} Fragen pro Test.`; return; }
    const f={eigen:true, id:"e"+neueId(), art:E.art, q, a:E.art==="mc"?E.a.map(a=>a.trim()):[], m:E.m.trim(), p:E.p, z:E.z, e:""};
    neu(()=>{ n.fmap.set(f.id,f); n.sel.push(f.id); n.entwurf={art:E.art, q:"", a:["","","",""], m:"", p:E.p, z:E.z}; });
    toast("Eigene Frage hinzugefügt.","ok"); };
}
function seiteTestNeu(){
  if(!bereitFuerLehrer("Neuer Test")) return;
  if(!LZ.daten.klassen.length){ go("lehrer"); return; }
  if(!LZ.neu) neuStart();
  const n=LZ.neu;
  const pool=poolNeu(); const basis=n.unter?poolNeu(true):pool;
  const subs={}; basis.forEach(f=>{ if(f.s) subs[f.s]=(subs[f.s]||0)+1; });
  const subListe=Object.entries(subs).sort((a,b)=>b[1]-a[1]).slice(0,400).sort((a,b)=>a[0].localeCompare(b[0],"de"));
  const sel=n.sel.map(k=>n.fmap.get(k)).filter(Boolean);
  const q=n.suche.trim().toLowerCase();
  const liste = n.modus==="manuell" ? (q.length>=2 ? pool.filter(f=>(f.q+" "+f.a[0]+" "+(f.s||"")).toLowerCase().includes(q)) : pool).slice(0,150) : [];
  const selSet=new Set(n.sel);
  const fb=LP21.find(x=>x.f===n.fach) || LP21.find(x=>x.z.includes(zyklusNeu())) || LP21[0];
  const vorschlag=lp21Vorschlag(themaIds(n.thema)||[], zyklusNeu());
  setze(`${lc([START,LB], "Neuer Test")}
    <div class="bhead"><span class="emo" aria-hidden="true">📝</span><h1>Neuer Test</h1></div>
    <p class="bdesc">Wähle Klasse, Thema und Fragen. Der Test bekommt einen Code, den die Kinder mit ihrem PIN eingeben.</p>
    <section class="statcard lz-sek"><h2>1. Grunddaten</h2><div class="lz-form">
      <label for="lzNTitel">Titel</label><input id="lzNTitel" class="sel" maxlength="80" placeholder="${h(themaLabel(n.thema))}-Test" value="${h(n.titel)}">
      <div class="lz-zwei"><div><label for="lzNKl">Klasse</label><select id="lzNKl" class="sel">${LZ.daten.klassen.map(k=>`<option value="${h(k.id)}" ${k.id===n.klasseId?"selected":""}>${h(k.name)} (${(k.schueler||[]).length})</option>`).join("")}</select></div>
      <div><label for="lzNSj">Schuljahr</label><select id="lzNSj" class="sel">${sjOptionen(n.schuljahr)}</select></div></div>
    </div></section>
    <section class="statcard lz-sek"><h2>2. Fragen auswählen</h2><div class="lz-form">
      <div class="lz-zwei"><div><label for="lzNTh">Thema oder Bereich</label><select id="lzNTh" class="sel">${themaOptionen(n.thema)}</select></div>
      <div><label for="lzNSub">Unterthema (Stichwort)</label><input id="lzNSub" class="sel" list="lzSubs" placeholder="z. B. Römer, Fuchs, Bern" value="${h(n.unter)}" autocomplete="off"><datalist id="lzSubs">${subListe.map(([s,c])=>`<option value="${h(s)}">${c} Fragen</option>`).join("")}</datalist></div></div>
      <span class="lz-lbl" id="lzStLbl">Stufe</span>
      <div class="segs" role="group" aria-labelledby="lzStLbl">${[[0,"Alle"],[1,"🌱 Entdecker"],[2,"🚀 Könner"],[3,"🏅 Profis"]].map(([v,l])=>`<button type="button" class="seg" data-st="${v}" aria-pressed="${n.stufe===v}">${l}</button>`).join("")}</div>
      <p class="lz-verf"><b>${pool.length.toLocaleString("de-CH")}</b> passende Fragen</p>
      <span class="lz-lbl" id="lzMoLbl">Auswahl</span>
      <div class="segs" role="group" aria-labelledby="lzMoLbl"><button type="button" class="seg" data-mo="zufall" aria-pressed="${n.modus==="zufall"}">🎲 Zufällig</button><button type="button" class="seg" data-mo="manuell" aria-pressed="${n.modus==="manuell"}">☑️ Selbst auswählen</button></div>
      ${n.modus==="zufall" ? `<div class="lz-zufall"><label for="lzNAnz">Anzahl Fragen</label><input id="lzNAnz" class="sel lz-anz" type="number" min="1" max="${MAX_FRAGEN}" value="${n.anzahl}" inputmode="numeric">
          <button class="big" id="lzZiehen" type="button" ${pool.length?"":"disabled"}>🎲 ${n.sel.length?"Neu ziehen":"Fragen ziehen"}</button></div>`
        : `<label for="lzNSuche">In den Fragen suchen</label><input id="lzNSuche" class="sel" type="search" placeholder="Suchwort …" value="${h(n.suche)}" autocomplete="off">
          <p class="help">${liste.length<pool.length?`Die ersten ${liste.length} von ${pool.length.toLocaleString("de-CH")} Fragen. Grenze mit Thema, Stufe, Unterthema oder Suchwort ein.`:`${liste.length} Fragen`}</p>
          <div class="suchliste lz-auswahl">${liste.map(f=>{ const id=fKey(f); return `<label class="sq ${selSet.has(id)?"on":""}"><input type="checkbox" data-fq="${h(id)}" ${selSet.has(id)?"checked":""}><span><b>${h(f.q)}</b><small>Nr. ${fNr(f)} · ${h(themaName(f.t))} · Stufe ${f.l}${f.s?` · ${h(f.s)}`:""} · ✅ ${h(f.a[0])}</small></span></label>`; }).join("") || `<p class="empty">Keine Fragen gefunden.</p>`}</div>`}
    </div></section>
    <section class="statcard lz-sek"><h2>3. Eigene Frage schreiben</h2>${entwurfHTML(n)}</section>
    <section class="statcard lz-sek"><h2>4. Fragen im Test <span class="lz-zahl">${sel.length}</span></h2>
      <label class="lz-schalter"><input type="checkbox" id="lzAlleOffen" ${n.alleOffen?"checked":""}><span>Ohne Auswahlantworten: alle Fragen als offene Fragen (die Kinder schreiben die Antwort selbst)</span></label>
      ${sel.length ? `<ol class="lz-sel lza-sel">${sel.map(f=>selItemHTML(n,f)).join("")}</ol>
        <p class="help">Total ${sel.reduce((x,f)=>x+fPunkte(alsTestFrage(n,f)),0)} Punkte. Mit «Bearbeiten» änderst du den Fragetext, die Musterlösung und die Punkte.</p>
        <div class="row lz-links"><button class="big alt small" id="lzLeeren" type="button">Alle entfernen</button></div>`
        : `<p class="empty">Noch keine Fragen. Ziehe Fragen aus der Datenbank, wähle sie selbst aus oder schreibe eigene Fragen.</p>`}
      ${sel.length>MAX_FRAGEN?`<p class="err">Höchstens ${MAX_FRAGEN} Fragen pro Test.</p>`:""}
    </section>
    <section class="statcard lz-sek"><h2>5. Lehrplan 21</h2>
      <p class="help">Vorschlag aus dem Thema (Zyklus ${zyklusNeu()}): ${vorschlag.length?vorschlag.map(c=>`<b>${h(c)}</b>`).join(", "):"kein Vorschlag"}${n.lpAuto?"":` <button type="button" class="lz-link" id="lzLpAuto">übernehmen</button>`}</p>
      <div class="lz-chips">${n.lp21.map(c=>`<button type="button" class="lz-chip" data-lprm="${h(c)}" aria-label="${h(lpLabel(c))} entfernen">${h(lpLabel(c))} <span aria-hidden="true">✕</span></button>`).join("") || `<span class="help">Noch kein Lehrplanbezug gewählt.</span>`}</div>
      <div class="lz-form"><label for="lzFach">Fachbereich</label><select id="lzFach" class="sel">${LP21.map(x=>`<option value="${x.f}" ${x.f===fb.f?"selected":""}>${h(x.f)} ${h(x.n)} (Zyklus ${x.z.join(", ")})</option>`).join("")}</select>
      <div class="lz-kbs">${fb.kb.map(([c,t])=>`<label class="lz-kb"><input type="checkbox" data-lp="${h(c)}" ${n.lp21.includes(c)?"checked":""}><span><b>${h(c)}</b> ${h(t)}</span></label>`).join("")}</div></div>
    </section>
    <div class="lz-erstellen"><p class="err" id="lzNErr" aria-live="polite"></p>
      <button class="big gold" id="lzErst" type="button" ${sel.length && sel.length<=MAX_FRAGEN?"":"disabled"}>✅ Test erstellen (${sel.length} ${sel.length===1?"Frage":"Fragen"})</button></div>`);
  const merke=()=>{ const t=$q("#lzNTitel"); if(t) n.titel=t.value; };
  const neu=(fn)=>{ merke(); fn(); const y=scrollY; render(); scrollTo(0,y); };
  $q("#lzNTitel").oninput=e=>{ n.titel=e.target.value; };
  $q("#lzNKl").onchange=e=>neu(()=>{ n.klasseId=e.target.value; const k=klasseVon(n.klasseId); if(k?.schuljahr) n.schuljahr=k.schuljahr; lpAuto(); });
  $q("#lzNSj").onchange=e=>neu(()=>{ n.schuljahr=e.target.value; lpAuto(); });
  $q("#lzNTh").onchange=e=>neu(()=>{ n.thema=e.target.value; n.unter=""; lpAuto(); });
  $q("#lzNSub").onchange=e=>neu(()=>{ n.unter=e.target.value.trim(); });
  $a("[data-st]").forEach(b=>b.onclick=()=>neu(()=>{ n.stufe=+b.dataset.st; }));
  $a("[data-mo]").forEach(b=>b.onclick=()=>neu(()=>{ n.modus=b.dataset.mo; }));
  $q("#lzNAnz") && ($q("#lzNAnz").onchange=e=>{ n.anzahl=Math.max(1,Math.min(MAX_FRAGEN,parseInt(e.target.value,10)||10)); e.target.value=n.anzahl; });
  $q("#lzZiehen") && ($q("#lzZiehen").onclick=()=>neu(()=>{ const a=Math.max(1,Math.min(MAX_FRAGEN,parseInt($q("#lzNAnz").value,10)||10)); n.anzahl=a;
    // möglichst verschiedene Fragen (gleicher Fragetext nur einmal)
    const gesehen=new Set(); const z=mischen(pool).filter(f=>{ const k=f.q.trim().toLowerCase(); if(gesehen.has(k)) return false; gesehen.add(k); return true; }).slice(0,a);
    const eig=n.sel.filter(k=>n.fmap.get(k)?.eigen); const em=eig.map(k=>[k,n.fmap.get(k)]);
    n.fmap=new Map([...em, ...z.map(f=>[fKey(f),f])]); n.sel=[...eig, ...z.map(fKey)].slice(0,MAX_FRAGEN); }));
  if($q("#lzNSuche")){ const inp=$q("#lzNSuche"); let tm; inp.oninput=()=>{ clearTimeout(tm); tm=setTimeout(()=>{ merke(); n.suche=inp.value; const pos=inp.selectionStart, y=scrollY; render(); scrollTo(0,y); const x=$q("#lzNSuche"); if(x){ x.focus(); try{ x.setSelectionRange(pos,pos); }catch(e){} } },300); }; }
  $a("[data-fq]").forEach(c=>c.onchange=()=>neu(()=>{ const f=liste.find(x=>fKey(x)===c.dataset.fq); if(!f) return;
    if(c.checked){ if(!n.sel.includes(c.dataset.fq)){ n.sel.push(c.dataset.fq); n.fmap.set(c.dataset.fq,f); } } else n.sel=n.sel.filter(x=>x!==c.dataset.fq); }));
  $a("[data-rm]").forEach(b=>b.onclick=()=>neu(()=>{ n.sel=n.sel.filter(x=>x!==b.dataset.rm); }));
  $q("#lzLeeren") && ($q("#lzLeeren").onclick=()=>neu(()=>{ n.sel=[]; n.edit={}; }));
  $q("#lzAlleOffen").onchange=e=>neu(()=>{ n.alleOffen=e.target.checked; });
  entwurfBinden(n, neu); selBinden(n, neu);
  $q("#lzLpAuto") && ($q("#lzLpAuto").onclick=()=>neu(()=>{ n.lpAuto=true; lpAuto(); }));
  $a("[data-lprm]").forEach(b=>b.onclick=()=>neu(()=>{ n.lpAuto=false; n.lp21=n.lp21.filter(x=>x!==b.dataset.lprm); }));
  $q("#lzFach").onchange=e=>neu(()=>{ n.fach=e.target.value; });
  $a("[data-lp]").forEach(c=>c.onchange=()=>neu(()=>{ n.lpAuto=false; n.fach=LP21_KB[c.dataset.lp].fach; if(c.checked){ if(!n.lp21.includes(c.dataset.lp)) n.lp21.push(c.dataset.lp); } else n.lp21=n.lp21.filter(x=>x!==c.dataset.lp); }));
  $q("#lzErst").onclick=async()=>{
    merke(); const err=$q("#lzNErr"); const k=klasseVon(n.klasseId);
    if(!k){ err.textContent="Bitte eine Klasse wählen."; return; }
    if(!sel.length || sel.length>MAX_FRAGEN){ err.textContent=`Bitte 1 bis ${MAX_FRAGEN} Fragen auswählen.`; return; }
    const b=$q("#lzErst"); b.disabled=true; err.textContent="";
    try{
      let code=""; for(let i=0;i<8;i++){ const c=neuerCode(); if(await SP.codeFrei(c)){ code=c; break; } } if(!code) throw new Error("Kein freier Test-Code gefunden.");
      const titel=(n.titel.trim() || themaLabel(n.thema)+"-Test").slice(0,80);
      const t={code, klasseId:k.id, titel, schuljahr:n.schuljahr, lp21:[...n.lp21], aktiv:true, erstellt:new Date().toISOString(),
        info:{thema:n.thema, stufe:n.stufe, zyklus:zyklusNeu(), klasse:k.name},
        fragen:sel.map(f=>alsTestFrage(n,f,true))};
      await SP.testSpeichern(t, k); LZ.daten.tests.unshift(t); LZ.neu=null; LZ.testCode=code; toast(`Test erstellt. Code: ${code}. Die Prüfung als PDF wird erstellt.`,"ok"); go("ltest");
      try{ const d=await pdfTest(t, k, false); await pdfSpeichern(d, `Pruefung-${slug(t.titel)}.pdf`); }catch(e){ console.warn(e); }
    }catch(e){ err.textContent=fehlerText(e); b.disabled=false; }
  };
}

/* ---------- Test ansehen, verteilen, auswerten ---------- */
function teilenHTML(link, text){
  if(typeof teilenKnoepfe==="function") return teilenKnoepfe(link, text);
  return `<div class="sharebox"><input class="sel sharelink" readonly value="${h(link)}" aria-label="Link"><div class="row"><button type="button" class="big small" data-copy="${h(link)}">📋 Link kopieren</button></div><p class="status copymsg" aria-live="polite"></p></div>`;
}
function bindTeilenL(){
  if(typeof bindTeilen==="function"){ bindTeilen(); return; }
  $a("[data-copy]").forEach(b=>b.onclick=async()=>{ const m=b.closest(".sharebox")?.querySelector(".copymsg"); try{ await navigator.clipboard.writeText(b.dataset.copy); if(m) m.textContent="✅ Link kopiert!"; }catch(e){ if(m) m.textContent="Bitte den Link markieren und kopieren."; } });
}
function korrPanel(t, a){
  const kor=a.korrektur||{};
  return `<tr class="lza-korr"><td colspan="6"><div class="lza-korbox"><b>Offene Fragen von ${h(a.name)} korrigieren</b>
    ${t.fragen.map((f,i)=>istOffen(f)?`<div class="lza-korf"><p><span class="lza-mu">Frage ${i+1}:</span> ${h(f.q)}</p>
      <p class="lza-korant">${a.antworten?.[i]!=null && String(a.antworten[i]).trim() ? h(a.antworten[i]) : `<span class="lza-mu">keine Antwort</span>`}</p>
      ${f.m?`<p class="lza-mu">Musterlösung: ${h(f.m)}</p>`:""}
      <label>Punkte <input type="number" min="0" max="${fPunkte(f)}" step="0.5" data-kp="${i}" value="${kor[i]!=null?h(kor[i]):""}"> von ${fPunkte(f)}</label></div>`:"").join("")}
    <div class="lza-leiste"><button type="button" class="lza-k p" id="lzaKorSave">Korrektur speichern</button><button type="button" class="lza-k" id="lzaKorZu">Schliessen</button></div></div></td></tr>`;
}
function seiteTest(){
  if(!bereitFuerLehrer("Test")) return;
  const t=LZ.daten.tests.find(x=>x.code===LZ.testCode); if(!t){ go("lehrer"); return; }
  const k=klasseVon(t.klasseId); const kids=k?.schueler||[]; const ab=abgabenVon(t.code);
  const s=schnitt(ab.map(a=>a.note)), sp=schnitt(ab.map(a=>a.punkte)), sz=schnitt(ab.map(a=>a.dauer||0));
  const link=testLink(t.code); const hatOffen=t.fragen.some(istOffen);
  const zeilen=[...kids.map(kid=>({kid, a:ab.find(a=>a.sid===kid.id)})), ...ab.filter(a=>!kids.some(x=>x.id===a.sid)).map(a=>({kid:{id:a.sid, name:a.name+" (entfernt)"}, a}))]
    .sort((x,y)=>(y.a?1:0)-(x.a?1:0) || (y.a?.note||0)-(x.a?.note||0) || x.kid.name.localeCompare(y.kid.name,"de"));
  setze(`${lc([START,LB,...(k?[[k.name,()=>{ LZ.klasseId=k.id; go("lklasse"); }]]:[])], t.titel)}
    <div class="bhead"><span class="emo" aria-hidden="true">📝</span><h1>${h(t.titel)}</h1></div>
    <p class="bdesc">${h(k?.name||"")} · ${h(sjName(t.schuljahr))} · ${t.fragen.length} Fragen · erstellt am ${datum(t.erstellt)}</p>
    ${t.lp21?.length?`<div class="lz-chips lz-mitte">${t.lp21.map(c=>`<span class="lz-chip still" title="${h(LP21_KB[c]?.fachName||"")}">${h(lpLabel(c))}</span>`).join("")}</div>`:""}
    <div class="lz-grid2">
      <section class="statcard"><h2>📤 Test verteilen</h2>
        <p class="lz-codegross" aria-label="Test-Code ${h(t.code.split("").join(" "))}">${h(t.code)}</p>
        <p class="help">Die Kinder öffnen den Link oder tippen im Menü auf <b>«Test mit Code»</b>, geben den Test-Code und ihren PIN ein und lösen den Test.</p>
        ${teilenHTML(link, `easyplay-Test «${t.titel}», Code ${t.code}`)}
        <label class="lz-schalter"><input type="checkbox" id="lzAktiv" ${t.aktiv!==false?"checked":""}><span>Test ist offen (Kinder können ihn lösen)</span></label>
      </section>
      <section class="statcard"><h2>🖨️ Prüfung auf Papier</h2>
        <p class="help">Schlichte Prüfung wie in der Schule: Kopf mit Name, Klasse, Datum, Punkten und Note, Ankreuzfelder und Schreiblinien. Das Lösungsblatt zeigt die richtigen Antworten und Musterlösungen.</p>
        <div class="row lz-links"><button class="big" id="lzPdfA" type="button">📄 Prüfung (PDF)</button><button class="big alt" id="lzPdfL" type="button">✅ Lösungsblatt (PDF)</button></div>
        <p class="status" id="lzPdfSt" aria-live="polite"></p>
      </section>
    </div>
    <section class="statcard lz-sek"><h2>📊 Resultate <span class="lz-zahl">${ab.length}/${kids.length}</span></h2>
      ${ab.length?`<div class="lz-kpis"><div><b>${fmtNote(s)}</b><span>Ø Note</span></div><div><b>${sp!=null?(Math.round(sp*10)/10).toLocaleString("de-CH"):"-"}/${maxPunkte(t.fragen)}</b><span>Ø Punkte</span></div><div><b>${h(zeit(sz))}</b><span>Ø Zeit</span></div><div><b>${ab.filter(a=>a.note>=4).length}/${ab.length}</b><span>genügend</span></div></div>`:""}
      ${zeilen.length?`<div class="lz-tabwrap"><table class="lz-tab lz-liste"><thead><tr><th scope="col">Kind</th><th scope="col">Punkte</th><th scope="col">Note</th><th scope="col">Zeit</th><th scope="col">Abgabe</th><th scope="col"><span class="sr-only">Aktion</span></th></tr></thead><tbody>
        ${zeilen.map(({kid,a})=>a?`<tr><th scope="row"><button type="button" class="lz-th" data-kind="${h(kid.id)}">${h(kid.name)}</button></th><td>${h(a.punkte)}/${h(a.max)}</td><td class="lz-n ${a.offen?"":noteKlasse(a.note)}">${a.offen?`<span class="lza-mu" title="vorläufig, offene Fragen noch nicht korrigiert">(${fmtNote(a.note)})</span>`:fmtNote(a.note)}</td><td>${h(zeit(a.dauer))}</td><td>${datum(a.datum)}</td><td class="nowrap">${hatOffen?`<button type="button" class="lz-mini lza-korbtn ${a.offen?"offen":""}" data-kor="${h(a.id)}">${a.offen?`✎ ${a.offen} korrigieren`:"✎ korrigiert"}</button>`:""}<button type="button" class="lz-mini" data-abdel="${h(a.id)}" title="Abgabe löschen, damit das Kind nochmals lösen kann" aria-label="Abgabe von ${h(kid.name)} löschen">↩️</button></td></tr>${LZ.kor===a.id?korrPanel(t,a):""}`
          :`<tr><th scope="row">${h(kid.name)}</th><td colspan="5" class="lz-offen">noch nicht abgegeben · PIN ${h(kid.pin||"")}</td></tr>`).join("")}
      </tbody></table></div>`:`<p class="empty">Diese Klasse hat noch keine Kinder.</p>`}
    </section>
    <section class="statcard lz-sek"><h2>🔍 Fehleranalyse</h2>
      <p class="help">Fragen sortiert nach Fehlerquote, mit der häufigsten falschen Antwort.</p>
      ${fehlerListe(fehlerAnalyse([t], ab), 50)}
    </section>
    <details class="bibthema lz-sek"><summary><span class="bname">👀 Fragen in diesem Test</span><span class="bn">${t.fragen.length}</span></summary>
      <ol class="lz-sel lz-vorschau">${t.fragen.map(f=>`<li><span><b>${h(f.q)}</b><small>${istOffen(f)?`Offene Frage, ${fPunkte(f)} ${fPunkte(f)===1?"Punkt":"Punkte"}${f.m?` · Musterlösung: <b class="lz-richtig">${h(f.m)}</b>`:""}`:f.o.map((o,j)=>`${"abcd"[j]}) ${j===+f.r?`<b class="lz-richtig">${h(o)}</b>`:h(o)}`).join(" · ")}</small></span></li>`).join("")}</ol></details>
    <div class="row"><button class="big alt small" id="lzTReload" type="button">🔄 Resultate aktualisieren</button><button class="big alt small lz-gefahr" id="lzTDel" type="button">🗑️ Test löschen</button></div>`);
  bindTeilenL();
  $a("[data-kind]").forEach(b=>b.onclick=()=>{ LZ.kindId=b.dataset.kind; go("lkind"); });
  $q("#lzAktiv").onchange=async e=>{ const neu={...t, aktiv:e.target.checked}; try{ await SP.testSpeichern(neu, k); t.aktiv=neu.aktiv; toast(t.aktiv?"Test ist offen.":"Test ist geschlossen.","ok"); rerender(); }catch(x){ e.target.checked=!e.target.checked; toast(fehlerText(x),"bad"); } };
  const pdf=async(loes)=>{ const st=$q("#lzPdfSt"); st.textContent="PDF wird erstellt …"; $a("#lzPdfA,#lzPdfL").forEach(b=>b.disabled=true);
    try{ const d=await pdfTest(t, k, loes); const r=await pdfSpeichern(d, `${loes?"Loesungen":"Pruefung"}-${slug(t.titel)}.pdf`); st.textContent = r==="gespeichert" ? "✅ PDF erstellt." : r==="abgebrochen" ? "Download abgebrochen." : "Bitte kurz warten und nochmals versuchen."; }
    catch(e){ st.textContent=fehlerText(e); } $a("#lzPdfA,#lzPdfL").forEach(b=>b.disabled=false); };
  $q("#lzPdfA").onclick=()=>pdf(false); $q("#lzPdfL").onclick=()=>pdf(true);
  $a("[data-kor]").forEach(b=>b.onclick=()=>{ LZ.kor = LZ.kor===b.dataset.kor ? null : b.dataset.kor; const y=scrollY; rerender(); scrollTo(0,y); });
  const ks=$q("#lzaKorSave"); if(ks){ const a=ab.find(x=>x.id===LZ.kor);
    $q("#lzaKorZu").onclick=()=>{ LZ.kor=null; const y=scrollY; rerender(); scrollTo(0,y); };
    ks.onclick=async()=>{ const kor={}; $a("[data-kp]").forEach(inp=>{ if(inp.value!=="") kor[inp.dataset.kp]=Math.max(0,Math.min(+inp.max||1,+inp.value||0)); });
      ks.disabled=true; try{ await (SP.abgabeKorrigieren ? SP.abgabeKorrigieren(a, kor) : Promise.reject(new Error("Korrigieren ist hier nicht möglich.")));
        const r=bewerte(t.fragen, antwortenSaeubern(t.fragen, a.antworten), kor); Object.assign(a, {korrektur:kor, punkte:r.punkte, max:r.max, note:r.note, offen:r.offen});
        const g=LZ.daten.abgaben.find(x=>x.id===a.id); if(g) Object.assign(g, a); toast(`Korrektur gespeichert: Note ${fmtNote(r.note)}.`,"ok"); LZ.kor=null; const y=scrollY; rerender(); scrollTo(0,y); }
      catch(e){ ks.disabled=false; toast(fehlerText(e),"bad"); } }; }
  $a("[data-abdel]").forEach(b=>b.onclick=async()=>{ const a=ab.find(x=>x.id===b.dataset.abdel); if(!a || !confirm(`Abgabe von ${a.name} löschen? Danach kann das Kind den Test nochmals lösen.`)) return;
    try{ await SP.abgabeLoeschen(a); LZ.daten.abgaben=LZ.daten.abgaben.filter(x=>x.id!==a.id); toast("Abgabe gelöscht.","ok"); rerender(); }catch(e){ toast(fehlerText(e),"bad"); } });
  $q("#lzTReload").onclick=()=>neuLaden();
  $q("#lzTDel").onclick=async()=>{ if(!confirm(`Test «${t.titel}» und alle Resultate löschen?`)) return;
    try{ await SP.testLoeschen(t.code); LZ.daten.tests=LZ.daten.tests.filter(x=>x.code!==t.code); LZ.daten.abgaben=LZ.daten.abgaben.filter(x=>x.code!==t.code); toast("Test gelöscht.","ok"); go("lehrer"); }catch(e){ toast(fehlerText(e),"bad"); } };
}

/* ================= 6b. Lehrerbereich: Kinder, Fragendatenbank, Bibliothek, Fehlermeldungen ================= */
const LS_MELD = "ep-fehlermeldungen";
const MELD_GRUND = ["Antwort ist falsch","Mehrere Antworten richtig","Frage ist unklar","Tipp- oder Rechtschreibfehler","Inhalt ist veraltet","Nicht kindgerecht","Anderes"];
function meldungenLokal(){ const l=lsGet(LS_MELD,[]); return Array.isArray(l) ? l : []; }
async function meldungSenden(m){
  const cfg=window.EP_CONFIG||{}; let gesendet=false;
  if(cfg.supabaseUrl && cfg.supabaseKey && !window.claude){
    try{ let tok=null; try{ tok=AUTH?.sb ? (await AUTH.sb.auth.getSession())?.data?.session?.access_token : null; }catch(e){}
      const r=await fetch(cfg.supabaseUrl.replace(/\/$/,"")+"/rest/v1/rpc/fehler_melden",{method:"POST",headers:{apikey:cfg.supabaseKey, Authorization:"Bearer "+(tok||cfg.supabaseKey), "Content-Type":"application/json"},
        body:JSON.stringify({p_art:m.art, p_ref:String(m.ref||""), p_titel:String(m.titel||"").slice(0,300), p_grund:m.grund, p_text:String(m.text||"").slice(0,2000)})});
      gesendet=r.ok; }catch(e){}
  }
  const l=meldungenLokal(); l.unshift({...m, id:neueId(), datum:new Date().toISOString(), gesendet}); lsSet(LS_MELD, l.slice(0,300));
  return gesendet;
}
function meldenDialog(m){
  $q("#lzaMeld")?.remove();
  const d=document.createElement("dialog"); d.id="lzaMeld"; d.className="lza-dlg";
  d.innerHTML=`<form method="dialog"><h2>Fehler melden</h2><p class="lza-mu">${h(m.titel||"")}</p>
    <label for="lzaMG">Was stimmt nicht?</label><select id="lzaMG">${MELD_GRUND.map(g=>`<option>${h(g)}</option>`).join("")}</select>
    <label for="lzaMT">Beschreibung (was wäre richtig?)</label><textarea id="lzaMT" rows="4" maxlength="2000" placeholder="z. B. Richtig wäre 1848, nicht 1291."></textarea>
    <div class="lza-leiste"><button type="button" class="lza-k" id="lzaMA">Abbrechen</button><button type="submit" class="lza-k p" id="lzaMS">Melden</button></div></form>`;
  document.body.appendChild(d); try{ d.showModal(); }catch(e){ d.setAttribute("open",""); }
  d.querySelector("#lzaMA").onclick=()=>{ d.close(); d.remove(); };
  d.querySelector("form").onsubmit=async e=>{ e.preventDefault(); const b=d.querySelector("#lzaMS"); b.disabled=true;
    const ok=await meldungSenden({art:m.art, ref:m.ref, titel:m.titel, grund:d.querySelector("#lzaMG").value, text:d.querySelector("#lzaMT").value.trim()});
    d.close(); d.remove(); toast(ok ? "Danke! Die Meldung ist eingegangen." : "Gespeichert. Unter «Fehlermeldungen» kannst du sie per E-Mail senden.", "ok");
    if(ADMIN_SEITEN.has(S.screen)){ const y=scrollY; rerender(); scrollTo(0,y); } };
}
function seiteMeldungen(){
  const l=meldungenLokal(), offen=l.filter(m=>!m.gesendet);
  setze(`${lc([LB], "Fehlermeldungen")}
    <div class="bhead"><h1>Fehlermeldungen</h1></div>
    <p class="bdesc">Fehler, die du in der Fragendatenbank oder in der Bibliothek gemeldet hast. Mit Supabase gehen sie direkt an die Verwaltung, sonst kannst du sie hier per E-Mail senden.</p>
    <div class="lza-leiste"><button type="button" class="lza-k p" id="lzaMail" ${offen.length?"":"disabled"}>Offene per E-Mail senden (${offen.length})</button>${l.length?`<button type="button" class="lza-k g lza-rechts" id="lzaMLeer">Liste leeren</button>`:""}</div>
    ${l.length?`<div class="lz-tabwrap"><table class="lz-tab"><thead><tr><th>Datum</th><th>Wo</th><th>Was</th><th>Grund und Beschreibung</th><th>Status</th><th></th></tr></thead><tbody>
      ${l.map(m=>`<tr><td class="nowrap">${datum(m.datum)}</td><td>${m.art==="frage"?`Frage Nr. ${h(m.ref)}`:`Bibliothek, ${h(m.ref)}`}</td><td>${h(m.titel)}</td><td><b>${h(m.grund)}</b>${m.text?`<br><span class="lza-mu">${h(m.text)}</span>`:""}</td><td>${m.gesendet?`<span class="lza-ok">gesendet</span>`:`<span class="lza-wa">offen</span>`}</td><td><button type="button" class="lza-k klein" data-mdel="${h(m.id)}">Löschen</button></td></tr>`).join("")}
    </tbody></table></div>`:`<p class="empty">Noch keine Meldungen. In der Fragendatenbank und in der Bibliothek gibt es bei jedem Eintrag den Knopf «Fehler melden».</p>`}`);
  $q("#lzaMail") && ($q("#lzaMail").onclick=()=>{
    const txt=offen.map((m,i)=>`${i+1}. ${m.art==="frage"?"Frage Nr. "+m.ref:"Bibliothek: "+m.ref}\n   ${m.titel}\n   Grund: ${m.grund}${m.text?"\n   "+m.text:""}`).join("\n\n");
    location.href=`mailto:dejan.ehrbar@bluewin.ch?subject=${encodeURIComponent("easyplay: "+offen.length+" Fehlermeldung"+(offen.length===1?"":"en"))}&body=${encodeURIComponent("Hallo\n\nIch habe folgende Fehler gefunden:\n\n"+txt+"\n\nFreundliche Grüsse")}`;
    lsSet(LS_MELD, l.map(m=>({...m, gesendet:true}))); setTimeout(rerender, 400); });
  $q("#lzaMLeer") && ($q("#lzaMLeer").onclick=()=>{ if(!confirm("Alle Meldungen aus dieser Liste löschen?")) return; lsSet(LS_MELD, []); rerender(); });
  $a("[data-mdel]").forEach(b=>b.onclick=()=>{ lsSet(LS_MELD, meldungenLokal().filter(m=>m.id!==b.dataset.mdel)); rerender(); });
}

/* ---------- Kinder: alle Kinder aller Klassen mit Leistung ---------- */
function seiteKinder(){
  if(!bereitFuerLehrer("Kinder")) return;
  const D=LZ.daten; LZ.ki=LZ.ki||{klasse:"", q:""}; const F=LZ.ki;
  const zeilen=[]; D.klassen.filter(k=>!F.klasse || k.id===F.klasse).forEach(k=>{ const ts=testsVon(k.id); const codes=new Set(ts.map(t=>t.code));
    (k.schueler||[]).filter(s=>!F.q || s.name.toLowerCase().includes(F.q.toLowerCase())).forEach(s=>{
      const ab=D.abgaben.filter(a=>a.sid===s.id && codes.has(a.code)).sort((a,b)=>String(a.datum).localeCompare(String(b.datum)));
      const sn=schnitt(ab.map(a=>a.note)), letzte=ab.length?ab[ab.length-1].note:null, vor=ab.length>1?ab[ab.length-2].note:null;
      const th=themenQuote(ts, ab).filter(x=>x.falsch>0)[0];
      zeilen.push({k, s, ab, ts, sn, letzte, trend: letzte!=null && vor!=null ? Math.sign(letzte-vor) : 0, th, offen:ab.filter(a=>a.offen).length}); }); });
  setze(`${lc([LB], "Kinder")}
    <div class="bhead"><h1>Kinder</h1></div>
    <p class="bdesc">Alle Kinder deiner Klassen mit Durchschnitt, letzter Note und dem Thema mit den meisten Fehlern. Ein Klick auf den Namen zeigt den Verlauf.</p>
    <div class="lza-leiste"><select id="lzaKiK"><option value="">Alle Klassen</option>${D.klassen.map(k=>`<option value="${h(k.id)}" ${k.id===F.klasse?"selected":""}>${h(k.name)}</option>`).join("")}</select>
      <input id="lzaKiQ" type="search" placeholder="Name suchen" value="${h(F.q)}"><span class="lza-mu">${zeilen.length} ${zeilen.length===1?"Kind":"Kinder"}</span></div>
    ${zeilen.length?`<div class="lz-tabwrap"><table class="lz-tab"><thead><tr><th>Name</th><th>Klasse</th><th>PIN</th><th class="r">Tests</th><th class="r">Ø Note</th><th class="r">Letzte</th><th>Trend</th><th>Meiste Fehler</th></tr></thead><tbody>
      ${zeilen.map(z=>`<tr><th scope="row"><button type="button" class="lz-th" data-kind="${h(z.s.id)}">${h(z.s.name)}</button></th><td>${h(z.k.name)}</td><td class="lz-code">${h(z.s.pin)}</td><td class="r">${z.ab.length}/${z.ts.length}${z.offen?` <span class="lza-wa" title="offene Fragen noch nicht korrigiert">✎${z.offen}</span>`:""}</td>
        <td class="r lz-n ${noteKlasse(z.sn)}">${fmtNote(z.sn)}</td><td class="r lz-n ${noteKlasse(z.letzte)}">${fmtNote(z.letzte)}</td><td>${z.trend>0?`<span class="lza-ok">▲ besser</span>`:z.trend<0?`<span class="lza-fe">▼ schlechter</span>`:`<span class="lza-mu">–</span>`}</td>
        <td>${z.th?`${h(themaName(z.th.t))} <span class="lza-mu">(${Math.round(z.th.quote*100)} %)</span>`:`<span class="lza-mu">–</span>`}</td></tr>`).join("")}
    </tbody></table></div>`:`<p class="empty">${D.klassen.length?"Keine Kinder gefunden.":"Noch keine Klasse. Lege unter «Übersicht» eine Klasse an."}</p>`}
    ${D.klassen.length?`<section class="statcard lz-sek"><h2>Kinder erfassen</h2><div class="lz-form">
      <label for="lzaKiNK">Klasse</label><select id="lzaKiNK" class="sel">${D.klassen.map(k=>`<option value="${h(k.id)}" ${k.id===(F.klasse||D.klassen[0].id)?"selected":""}>${h(k.name)}</option>`).join("")}</select>
      <label for="lzaKiN">Vornamen oder Kürzel, eines pro Zeile</label><textarea id="lzaKiN" class="sel lz-ta" rows="4" placeholder="Lena&#10;Noah&#10;Mia S."></textarea>
      <p class="err" id="lzaKiErr" aria-live="polite"></p>
      <div class="row lz-links"><button class="big" id="lzaKiAdd" type="button">Hinzufügen</button></div>
      <p class="help">Jedes Kind bekommt automatisch einen 6-stelligen PIN. Damit löst es Tests mit Code. PIN-Kärtchen zum Ausdrucken gibt es auf der Seite der Klasse.</p></div></section>`:""}
    ${datenschutz()}`);
  $q("#lzaKiK").onchange=e=>{ F.klasse=e.target.value; rerender(); };
  const qi=$q("#lzaKiQ"); let tm; qi.oninput=()=>{ clearTimeout(tm); tm=setTimeout(()=>{ F.q=qi.value; rerender(); const x=$q("#lzaKiQ"); if(x){ x.focus(); x.setSelectionRange(x.value.length,x.value.length); } },250); };
  $a("[data-kind]").forEach(b=>b.onclick=()=>{ LZ.kindId=b.dataset.kind; go("lkind"); });
  $q("#lzaKiAdd") && ($q("#lzaKiAdd").onclick=async()=>{
    const k=klasseVon($q("#lzaKiNK").value); const err=$q("#lzaKiErr"); if(!k) return;
    const roh=$q("#lzaKiN").value.split(/[\n,;]+/).map(x=>x.replace(/\s+/g," ").trim()).filter(Boolean);
    if(!roh.length){ err.textContent="Bitte mindestens einen Vornamen oder ein Kürzel eingeben."; return; }
    const falsch=roh.filter(n=>n.split(" ").length>2 || /@|\d{3,}/.test(n) || n.length>30);
    if(falsch.length){ err.textContent=`Bitte nur Vorname oder Kürzel (höchstens zwei Wörter): ${falsch.slice(0,3).join(", ")}`; return; }
    const kids=k.schueler||[]; if(kids.length+roh.length>60){ err.textContent="Höchstens 60 Kinder pro Klasse."; return; }
    const pins=kids.map(s=>s.pin); const neue=roh.map(n=>{ const p=neuerPin(pins); pins.push(p); return {id:neueId(), name:n, pin:p}; });
    const neu={...k, schueler:[...kids, ...neue]};
    try{ await SP.klasseSpeichern(neu, LZ.daten.tests); Object.assign(k, neu); toast(`${neue.length} ${neue.length===1?"Kind":"Kinder"} hinzugefügt.`,"ok"); rerender(); }catch(e){ err.textContent=fehlerText(e); } });
}

/* ---------- Fragendatenbank: nur lesen, Fehler melden, in einen Test übernehmen ---------- */
function seiteFragen(){
  if(!bereitFuerLehrer("Fragendatenbank")) return;
  LZ.fq=LZ.fq||{thema:"", stufe:0, q:"", seite:0}; const F=LZ.fq; const PRO=40;
  const ids=themaIds(F.thema); const set=ids?new Set(ids):null; const q=F.q.trim().toLowerCase();
  const nrQ=/^\d+$/.test(q) ? +q : 0;
  const pool=alleFr().filter(f=>f && Array.isArray(f.a) && (!set || set.has(f.t)) && (!F.stufe || f.l===F.stufe) && (!q || (nrQ ? fNr(f)===nrQ : (f.q+" "+f.a.join(" ")+" "+(f.s||"")).toLowerCase().includes(q))));
  const seiten=Math.max(1, Math.ceil(pool.length/PRO)); F.seite=Math.min(F.seite, seiten-1);
  const liste=pool.slice(F.seite*PRO, F.seite*PRO+PRO);
  const imTest=new Set(LZ.neu?.sel||[]);
  const blaetter=`<div class="lza-seiten"><button type="button" class="lza-k" data-fs="${F.seite-1}" ${F.seite?"":"disabled"}>‹ Zurück</button><span>Seite ${F.seite+1} von ${seiten.toLocaleString("de-CH")}</span><button type="button" class="lza-k" data-fs="${F.seite+1}" ${F.seite<seiten-1?"":"disabled"}>Weiter ›</button></div>`;
  setze(`${lc([LB], "Fragendatenbank")}
    <div class="bhead"><h1>Fragendatenbank</h1></div>
    <p class="bdesc">Alle ${alleFr().length.toLocaleString("de-CH")} Fragen zum Nachlesen. Die richtige Antwort ist fett. Findest du einen Fehler, tippe auf «Fehler melden».</p>
    <div class="lza-leiste"><select id="lzaFT">${themaOptionen(F.thema)}</select>
      <select id="lzaFS">${[[0,"Alle Stufen"],[1,"Entdecker (bis 9)"],[2,"Könner (10 bis 14)"],[3,"Profis (ab 15)"]].map(([v,n])=>`<option value="${v}" ${F.stufe===v?"selected":""}>${n}</option>`).join("")}</select>
      <input id="lzaFQ" type="search" placeholder="Suchwort oder Fragenummer" value="${h(F.q)}"><span class="lza-mu">${pool.length.toLocaleString("de-CH")} Fragen</span></div>
    ${liste.length?`${blaetter}<div class="lz-tabwrap"><table class="lz-tab lza-fragen"><thead><tr><th class="r">Nr.</th><th>Frage und Antworten</th><th>Thema</th><th>Stufe</th><th></th></tr></thead><tbody>
      ${liste.map(f=>{ const k=fKey(f); return `<tr><td class="r lza-mu">${fNr(f)}</td><td><b>${h(f.q)}</b>${f.img?` <span class="lza-mu">(mit Bild)</span>`:""}<ul class="lza-antw">${f.a.map((a,i)=>`<li class="${i===0?"ok":""}">${h(a)}</li>`).join("")}</ul>${f.e?`<p class="lza-mu lza-erkl">${h(f.e)}</p>`:""}</td>
        <td>${h(themaName(f.t))}${f.s?`<br><span class="lza-mu">${h(f.s)}</span>`:""}</td><td>${f.l||""}</td>
        <td class="lza-akt"><button type="button" class="lza-k klein" data-fm="${h(k)}">Fehler melden</button>${f.img?"":`<button type="button" class="lza-k klein ${imTest.has(k)?"an":""}" data-ft="${h(k)}">${imTest.has(k)?"Im Test ✓":"In Test"}</button>`}</td></tr>`; }).join("")}
    </tbody></table></div>${blaetter}`:`<p class="empty">Keine Fragen gefunden.</p>`}
    ${LZ.neu?.sel?.length?`<div class="lza-fuss"><span>${LZ.neu.sel.length} ${LZ.neu.sel.length===1?"Frage":"Fragen"} für den neuen Test gewählt</span><button type="button" class="lza-k p" id="lzaZumTest">Zum neuen Test</button></div>`:""}`);
  const neu=fn=>{ fn(); rerender(); };
  $q("#lzaFT").onchange=e=>neu(()=>{ F.thema=e.target.value; F.seite=0; });
  $q("#lzaFS").onchange=e=>neu(()=>{ F.stufe=+e.target.value; F.seite=0; });
  const qi=$q("#lzaFQ"); let tm; qi.oninput=()=>{ clearTimeout(tm); tm=setTimeout(()=>{ F.q=qi.value; F.seite=0; rerender(); const x=$q("#lzaFQ"); if(x){ x.focus(); x.setSelectionRange(x.value.length,x.value.length); } },350); };
  $a("[data-fs]").forEach(b=>b.onclick=()=>{ F.seite=+b.dataset.fs; rerender(); scrollTo(0,0); });
  const finde=k=>liste.find(f=>fKey(f)===k);
  $a("[data-fm]").forEach(b=>b.onclick=()=>{ const f=finde(b.dataset.fm); if(f) meldenDialog({art:"frage", ref:fNr(f), titel:f.q}); });
  $a("[data-ft]").forEach(b=>b.onclick=()=>{ const f=finde(b.dataset.ft); if(!f) return; if(!LZ.neu) neuStart(); const n=LZ.neu, k=b.dataset.ft;
    if(n.sel.includes(k)) n.sel=n.sel.filter(x=>x!==k); else { if(n.sel.length>=MAX_FRAGEN){ toast(`Höchstens ${MAX_FRAGEN} Fragen pro Test.`,"bad"); return; } n.sel.push(k); n.fmap.set(k,f); n.modus="manuell"; }
    const y=scrollY; rerender(); scrollTo(0,y); });
  $q("#lzaZumTest") && ($q("#lzaZumTest").onclick=()=>go("ltestneu"));
}

/* ---------- Bibliothek: lesen und Fehler melden ---------- */
function seiteBib(){
  if(!bereitFuerLehrer("Bibliothek")) return;
  if(typeof BUECHER==="undefined" || typeof buchDaten!=="function"){ setze(`<p class="empty">Die Bibliothek ist hier nicht verfügbar.</p>`); return; }
  LZ.bb=LZ.bb||{buch:"", q:""}; const F=LZ.bb; const q=F.q.trim().toLowerCase();
  let inhalt="";
  if(q.length>=2){
    const tr=[]; for(const B of BUECHER){ let D; try{ D=buchDaten(B.id); }catch(e){ continue; } for(const s of D.seiten){ if(String(s.titel).toLowerCase().includes(q)){ tr.push({B,s}); if(tr.length>=80) break; } } if(tr.length>=80) break; }
    inhalt=tr.length?`<div class="lz-tabwrap"><table class="lz-tab"><thead><tr><th>Artikel</th><th>Buch</th><th>Kapitel</th><th class="r">Seite</th></tr></thead><tbody>${tr.map(({B,s})=>`<tr class="lza-klick" data-bs="${h(B.id)}|${s.nr}"><td><b>${h(s.titel)}</b></td><td>${h(B.titel)}</td><td>${h(s.kap?.titel||"")}</td><td class="r">${s.nr}</td></tr>`).join("")}</tbody></table></div>`:`<p class="empty">Kein Artikel gefunden.</p>`;
  } else if(F.buch){
    const B=BUECHER.find(x=>x.id===F.buch); let D=null; try{ D=buchDaten(F.buch); }catch(e){}
    inhalt = B && D ? `<div class="lza-leiste"><button type="button" class="lza-k" id="lzaBZ">‹ Alle Bücher</button><b>${h(B.titel)}</b><span class="lza-mu">${D.seiten.length.toLocaleString("de-CH")} Seiten · ${D.kap.length} Kapitel</span></div>
      ${D.kap.map(k=>`<details class="lza-kap"><summary><b>${h(k.titel)}</b><span class="lza-mu">${k.seiten.length} Seiten</span></summary><ul class="lza-seitenliste">${k.seiten.map(s=>`<li><button type="button" data-bs="${h(B.id)}|${s.nr}">${h(s.titel)}</button></li>`).join("")}</ul></details>`).join("")}` : "";
  } else {
    inhalt=`<div class="lz-tabwrap"><table class="lz-tab"><thead><tr><th>Buch</th><th>Inhalt</th><th class="r">Seiten</th></tr></thead><tbody>${BUECHER.map(B=>{ let n=0; try{ n=buchDaten(B.id).seiten.length; }catch(e){} return `<tr class="lza-klick" data-bb="${h(B.id)}"><td><b>${h(B.titel)}</b></td><td>${h(B.untertitel||"")}</td><td class="r">${n.toLocaleString("de-CH")}</td></tr>`; }).join("")}</tbody></table></div>`;
  }
  setze(`${lc([LB], "Bibliothek")}
    <div class="bhead"><h1>Bibliothek</h1></div>
    <p class="bdesc">Alle Artikel der Kinder-Bibliothek zum Lesen. Fehler kannst du auf jeder Seite melden.</p>
    <div class="lza-leiste"><input id="lzaBQ" type="search" placeholder="Artikel suchen, z. B. Bundesrat" value="${h(F.q)}"></div>
    ${inhalt}`);
  const qi=$q("#lzaBQ"); let tm; qi.oninput=()=>{ clearTimeout(tm); tm=setTimeout(()=>{ F.q=qi.value; rerender(); const x=$q("#lzaBQ"); if(x){ x.focus(); x.setSelectionRange(x.value.length,x.value.length); } },300); };
  $a("[data-bb]").forEach(b=>b.onclick=()=>{ F.buch=b.dataset.bb; rerender(); scrollTo(0,0); });
  $q("#lzaBZ") && ($q("#lzaBZ").onclick=()=>{ F.buch=""; rerender(); });
  $a("[data-bs]").forEach(b=>b.onclick=()=>{ const [bid,nr]=b.dataset.bs.split("|"); LIB.buch=bid; LIB.seite=+nr; LIB.zufall=false; go("lbibseite"); scrollTo(0,0); });
}
function seiteBibSeite(){
  if(!bereitFuerLehrer("Bibliothek")) return;
  const B=BUECHER.find(x=>x.id===LIB.buch); let s=null; try{ s=buchDaten(LIB.buch).seiten.find(x=>x.nr===LIB.seite); }catch(e){}
  if(!B||!s){ go("lbib"); return; }
  setze(`${lc([LB,["Bibliothek",()=>{ LZ.bb={buch:"",q:""}; go("lbib"); }],[B.titel,()=>{ LZ.bb={buch:B.id,q:""}; go("lbib"); }]], s.titel)}
    <div class="lza-leiste"><button type="button" class="lza-k" id="lzaBZur">‹ ${h(B.titel)}</button><span class="lza-mu">${h(s.kap?.titel||"")} · Seite ${s.nr}</span><button type="button" class="lza-k g lza-rechts" id="lzaBMeld">Fehler melden</button></div>
    <div id="lzaLib" class="lza-lib"></div>`);
  const ziel=$q("#lzaLib"), a=app();
  if(ziel && a){ a.id="lzaHinten"; ziel.id="app"; try{ renderLibSeite(); }catch(e){ console.warn(e); } finally{ ziel.id="lzaLib"; a.id="app"; }
    ziel.querySelectorAll(".crumbs,#zumQuiz,#nochZufall,#libQuiz,#textGen,#textSt,.eplegal").forEach(e=>e.remove());
    const idx=ziel.querySelector("#sIdx"); if(idx) idx.onclick=()=>{ LZ.bb={buch:B.id,q:""}; go("lbib"); }; }
  $q("#lzaBZur").onclick=()=>{ LZ.bb={buch:B.id,q:""}; go("lbib"); };
  $q("#lzaBMeld").onclick=()=>meldenDialog({art:"bib", ref:`${B.titel} S. ${s.nr}`, titel:s.titel});
}
/* Links in Bibliotheksartikeln bleiben im Lehrerbereich */
(function(){ const goAlt=window.go; window.go=function(z){ if(S.screen==="lbibseite"){ if(z==="libseite") z="lbibseite"; else if(z==="libkapitel"||z==="libbuch"||z==="lib"){ LZ.bb={buch:LIB.buch||"", q:""}; z="lbib"; } } return goAlt.call(this, z); }; })();

/* ================= 7. Seiten für Kinder: Test mit Code ================= */
const KID_FEHLER = {code:"Diesen Test-Code gibt es nicht. Schau nochmals genau hin.", pin:"Der PIN passt nicht zu diesem Test. Frag deine Lehrperson.", geschlossen:"Dieser Test ist geschlossen. Frag deine Lehrperson.",
  schon:"Du hast diesen Test schon abgegeben. 🎉", gesperrt:"Zu viele falsche Versuche. Bitte warte ein paar Minuten.", konto:"Bitte melde dich zuerst bei claude.ai an.", daten:"Die Antworten konnten nicht gelesen werden."};
function seiteCode(){
  const K=LZ.kid||(LZ.kid={});
  setze(`${lc([START], "Test mit Code")}
    <div class="lwait lz-codebox">
      <img class="lz-kidbild" src="img/kids/lb-karten.webp" alt="">
      <h2>Test mit Code starten</h2>
      <p>Gib den Test-Code und deinen PIN ein. Beides bekommst du von deiner Lehrperson.</p>
      <form id="lzCodeForm" class="lz-codeform" autocomplete="off">
        <label for="lzCode">Test-Code</label>
        <input id="lzCode" class="sel lz-codein" maxlength="7" inputmode="text" autocapitalize="characters" spellcheck="false" placeholder="6 Zeichen" value="${h(K.code||"")}">
        <label for="lzPin">Dein PIN</label>
        <input id="lzPin" class="sel lz-codein" maxlength="6" inputmode="numeric" pattern="[0-9]*" type="password" placeholder="••••" value="">
        <p class="err" id="lzCodeErr" aria-live="polite">${h(K.fehlerText||"")}</p>
        <button class="big gold" id="lzCodeGo" type="submit">🚀 Los geht's</button>
      </form>
    </div>`);
  K.fehlerText="";
  (K.code ? $q("#lzPin") : $q("#lzCode")).focus();
  $q("#lzCode").oninput=e=>{ const v=normCode(e.target.value); if(e.target.value!==v) e.target.value=v; };
  $q("#lzCodeForm").onsubmit=async e=>{ e.preventDefault();
    const code=normCode($q("#lzCode").value), pin=normPin($q("#lzPin").value), err=$q("#lzCodeErr");
    if(code.length!==6){ err.textContent="Der Test-Code hat 6 Zeichen."; $q("#lzCode").focus(); return; }
    if(pin.length<4){ err.textContent="Der PIN hat 4 Ziffern."; $q("#lzPin").focus(); return; }
    const b=$q("#lzCodeGo"); b.disabled=true; err.textContent="Test wird geladen …";
    try{ const sp=await speicher(); const r=await sp.kidLaden(code, pin);
      if(!r || r.fehler){ err.textContent=KID_FEHLER[r?.fehler]||KID_FEHLER.code; b.disabled=false; return; }
      if(r.schon){ err.textContent=KID_FEHLER.schon; b.disabled=false; return; }
      LZ.kid={code, pin, test:r.test, kind:r.kind, antworten:r.test.fragen.map(()=>null), i:0, start:Date.now(), ergebnis:null};
      try{ if(/#test=/.test(location.hash)) history.replaceState(null,"",location.pathname+location.search); }catch(x){}
      go("lspiel");
    }catch(x){ console.warn(x); err.textContent="Der Test konnte nicht geladen werden. Bist du online?"; b.disabled=false; }
  };
}
function seiteSpiel(){
  const K=LZ.kid; if(!K?.test){ go("lcode"); return; }
  if(K.ergebnis){ go("lfertig"); return; }
  const ja = x => x!=null && String(x).trim()!=="";
  const T=K.test, n=T.fragen.length, i=Math.max(0,Math.min(n-1,K.i)), f=T.fragen[i], gew=K.antworten[i], offen=T.fragen.filter((_,j)=>!ja(K.antworten[j])).length;
  setze(`<div class="lz-spiel">
    <div class="lz-spielkopf"><div><b>${h(T.titel)}</b><span>👋 ${h(K.kind.name)}</span></div><span class="lz-fz">Frage ${i+1} von ${n}</span></div>
    <div class="lz-fort" role="progressbar" aria-valuemin="0" aria-valuemax="${n}" aria-valuenow="${n-offen}" aria-label="Beantwortete Fragen"><i style="width:${Math.round((n-offen)/n*100)}%"></i></div>
    <div class="card lz-frage" style="--c:var(--welt)">
      <h2 class="lz-q">${h(f.q)}</h2>
      ${typeof speakBtn==="function" ? speakBtn(istOffen(f) ? f.q : f.q+". "+f.o.map((o,j)=>"ABCD"[j]+": "+o).join(". ")) : ""}
      ${istOffen(f) ? `<label class="lz-offenlbl" for="lzOffen">Deine Antwort <small>(${fPunkte(f)} ${fPunkte(f)===1?"Punkt":"Punkte"})</small></label><textarea id="lzOffen" class="sel lz-offen" rows="${Math.max(3,Math.min(8,f.z||3))}" maxlength="2000" placeholder="Schreib deine Antwort hier hin …">${h(gew??"")}</textarea>`
      : `<div class="lz-opts" role="radiogroup" aria-label="Antworten">${f.o.map((o,j)=>`<button type="button" class="lz-opt" role="radio" aria-checked="${gew===j}" data-o="${j}"><span class="lz-bu" aria-hidden="true">${"ABCD"[j]}</span><span>${h(o)}</span></button>`).join("")}</div>`}
    </div>
    <div class="lz-nav">
      <button class="big alt" id="lzZur" type="button" ${i===0?"disabled":""}>← Zurück</button>
      ${i<n-1 ? `<button class="big" id="lzWeiter" type="button">Weiter →</button>` : `<button class="big gold" id="lzAbgeben" type="button">✅ Test abgeben</button>`}
    </div>
    <nav class="lz-punkte" aria-label="Zu einer Frage springen">${T.fragen.map((_,j)=>`<button type="button" data-sprung="${j}" class="${ja(K.antworten[j])?"ja":""} ${j===i?"jetzt":""}" aria-label="Frage ${j+1}${ja(K.antworten[j])?", beantwortet":""}" ${j===i?'aria-current="step"':""}>${j+1}</button>`).join("")}</nav>
    ${i<n-1 && offen===0 ? `<div class="row"><button class="big gold" id="lzAbgeben2" type="button">✅ Alles beantwortet: Test abgeben</button></div>` : ""}
    <p class="lz-tipp">Die Lösungen und Erklärungen siehst du nach der Abgabe.</p>
    <p class="err" id="lzSpielErr" aria-live="polite"></p>
  </div>`);
  if(typeof bindSpeak==="function") try{ bindSpeak(); }catch(e){}
  const ta=$q("#lzOffen"); if(ta){ ta.oninput=()=>{ K.antworten[i]=ta.value; const p=$q(`[data-sprung="${i}"]`); if(p) p.classList.toggle("ja", ja(ta.value)); }; }
  $a("[data-o]").forEach(b=>b.onclick=()=>{ K.antworten[i]=+b.dataset.o; rerender(); const nb=$q(`.lz-opt[data-o="${b.dataset.o}"]`); nb && nb.focus(); });
  const wechsel=j=>{ K.i=j; rerender(); scrollTo({top:0}); };
  $q("#lzZur").onclick=()=>wechsel(i-1);
  $q("#lzWeiter") && ($q("#lzWeiter").onclick=()=>wechsel(i+1));
  $a("[data-sprung]").forEach(b=>b.onclick=()=>wechsel(+b.dataset.sprung));
  const abgeben=async()=>{
    const off=T.fragen.filter((_,j)=>!ja(K.antworten[j])).length;
    if(off && !confirm(`Du hast noch ${off} ${off===1?"Frage":"Fragen"} nicht beantwortet. Trotzdem abgeben?`)) return;
    $a("#lzAbgeben,#lzAbgeben2").forEach(b=>b.disabled=true); $q("#lzSpielErr").textContent="Wird abgegeben …";
    try{ const sp=await speicher(); const r=await sp.kidAbgeben(K.code, K.pin, K.antworten, Date.now()-K.start);
      if(!r || r.fehler){ $q("#lzSpielErr").textContent=KID_FEHLER[r?.fehler]||"Abgeben hat nicht geklappt."; $a("#lzAbgeben,#lzAbgeben2").forEach(b=>b.disabled=false); return; }
      K.ergebnis={...r, dauer:Date.now()-K.start}; go("lfertig");
    }catch(e){ console.warn(e); $q("#lzSpielErr").textContent="Abgeben hat nicht geklappt. Bitte nochmals versuchen."; $a("#lzAbgeben,#lzAbgeben2").forEach(b=>b.disabled=false); }
  };
  $q("#lzAbgeben") && ($q("#lzAbgeben").onclick=abgeben);
  $q("#lzAbgeben2") && ($q("#lzAbgeben2").onclick=abgeben);
}
function seiteFertig(){
  const K=LZ.kid; if(!K?.ergebnis){ go("lcode"); return; }
  const E=K.ergebnis, T=K.test;
  const lob = T.fragen.some(istOffen) ? "Test abgegeben! 🎉" : E.note>=5.5?"Wow, hervorragend! 🌟":E.note>=5?"Sehr gut gemacht! 💪":E.note>=4?"Gut gemacht, genügend! 👍":"Nicht aufgeben, beim nächsten Mal klappt es besser! 🍀";
  setze(`<div class="card done pop lz-fertig">
    <img class="lz-kidbild" src="img/kids/${T.fragen.some(istOffen) ? "lb-daumen" : E.note>=4 ? "lb-jubel" : "lb-zeigen"}.webp" alt="">
    <h1>${h(lob)}</h1>
    ${T.fragen.some(istOffen) ? `<div class="lz-notebox"><span>Punkte bisher</span><b>${E.punkte}</b></div>` : `<div class="lz-notebox ${noteKlasse(E.note)}"><span>Note</span><b>${fmtNote(E.note)}</b></div>`}
    <p>${E.punkte} von ${E.max} Punkten · Zeit ${h(zeit(E.dauer))} · ${h(T.titel)}</p>
    ${T.fragen.some(istOffen)?`<p class="help">Die Note bekommst du, sobald deine Lehrperson die offenen Fragen korrigiert hat.</p>`:""}
    <p class="help">Dein Resultat ist bei deiner Lehrperson angekommen.</p>
    <div id="lzLigaKind"></div>
    <div class="summary"><h2>Lösungen und Erklärungen</h2>
      <div class="review">${T.fragen.map((f,i)=>{ const l=E.loesung?.[i]||{}; const d=K.antworten[i];
        if(istOffen(f) || l.offen) return `<div class="rev r-offen"><div class="revhead"><span class="revnr">${i+1}</span><span aria-hidden="true">✍️</span><b>${h(f.q)}</b></div>
          <span>${d!=null && String(d).trim() ? "Deine Antwort: "+h(d) : "Nicht beantwortet"}</span>${l.m?`<span class="ans-ok">Musterlösung: ${h(l.m)}</span>`:""}<span class="revm">Diese Frage korrigiert deine Lehrperson (${fPunkte(f)} ${fPunkte(f)===1?"Punkt":"Punkte"}).</span></div>`;
        const ok=d!=null && d===l.r;
        return `<div class="rev ${ok?"r-ok":"r-bad"}"><div class="revhead"><span class="revnr">${i+1}</span><span aria-hidden="true">${ok?"✅":"❌"}</span><b>${h(f.q)}</b></div>
          ${ok?`<span class="ans-ok">Deine Antwort: ${h(f.o[d])}</span>`:`<span class="ans-bad">${d==null?"Nicht beantwortet":"Deine Antwort: "+h(f.o[d])}</span><span class="ans-ok">Richtig wäre: ${h(f.o[l.r]??"")}</span>`}
          ${l.e?`<span class="revm">💡 ${h(l.e)}</span>`:""}</div>`; }).join("")}</div></div>
    <div class="row"><button class="big" id="lzFertigOk" type="button">🏠 Zur Startseite</button></div></div>`);
  $q("#lzFertigOk").onclick=()=>{ LZ.kid=null; go("home"); };
  ligaKindNachAbgabe(K);
}

/* ================= 7b. Klassen-Liga («Klasse gegen Klasse») =================
   Lehrpersonen melden eine Klasse freiwillig mit Anzeigenamen (ohne Kindernamen) an.
   Punkte pro ISO-Woche = Testpunkte aller Abgaben der Klasse (pro Kind höchstens 150) / Anzahl eingetragener Kinder.
   Berechnet wird nur auf dem Server (supabase/klassenliga.sql, Funktion liga_rangliste). Ohne Supabase: Hinweis und Vorschau mit Beispieldaten. */
const LS_LIGA = "ep-lehrer-liga";   // Gerät eines Kindes: {id, anzeige, kanton} der Liga-Klasse (kein Name, kein PIN)
const LIGA_MIN = 5;
const LIGA = {woche:"jetzt", kanton:"", cache:{}, laedt:{}, fehler:"", meine:null, meineLaedt:false, offen:null, info:""};
function isoWoche(d){
  const t=new Date(d||Date.now()); t.setHours(12,0,0,0); t.setDate(t.getDate()+3-((t.getDay()+6)%7));
  const jahr=t.getFullYear(), j4=new Date(jahr,0,4,12); const n=1+Math.round(((t-j4)/864e5-3+((j4.getDay()+6)%7))/7);
  return {jahr, kw:n, key:`${jahr}-${String(n).padStart(2,"0")}`};
}
function ligaWochen(){ return {jetzt:isoWoche(new Date()), vor:isoWoche(new Date(Date.now()-7*864e5))}; }
const fmtPkt = n => { const x=Math.round((+n||0)*10)/10; try{ return x.toLocaleString("de-CH",{minimumFractionDigits:1, maximumFractionDigits:1}); }catch(e){ return x.toFixed(1); } };
const KT_STD = [["AG","Aargau"],["AI","Appenzell Innerrhoden"],["AR","Appenzell Ausserrhoden"],["BE","Bern"],["BL","Basel-Landschaft"],["BS","Basel-Stadt"],["FR","Freiburg"],["GE","Genf"],["GL","Glarus"],["GR","Graubünden"],["JU","Jura"],["LU","Luzern"],["NE","Neuenburg"],["NW","Nidwalden"],["OW","Obwalden"],["SG","St. Gallen"],["SH","Schaffhausen"],["SO","Solothurn"],["SZ","Schwyz"],["TG","Thurgau"],["TI","Tessin"],["UR","Uri"],["VD","Waadt"],["VS","Wallis"],["ZG","Zug"],["ZH","Zürich"]];
let KT_CACHE=null;
// KANTONE der Seite kann [Kürzel, Name] oder {kuerzel, kurz} enthalten; die 26 Kantone als Rückfall
function kantonListe(){
  if(KT_CACHE) return KT_CACHE;
  let l=[]; try{ if(typeof KANTONE!=="undefined" && Array.isArray(KANTONE)) l=KANTONE.map(k=>Array.isArray(k) ? [k[0],k[1]] : (k && k.kuerzel ? [k.kuerzel, k.kurz||String(k.name||"").replace(/^Kanton\s+/,"")] : null)).filter(k=>k && /^[A-Z]{2}$/.test(k[0]) && k[1]); }catch(e){}
  KT_CACHE = (l.length>=26 ? l : KT_STD).slice().sort((a,b)=>String(a[1]).localeCompare(String(b[1]),"de"));
  return KT_CACHE;
}
const ktName = c => (kantonListe().find(k=>k[0]===c)||[])[1] || c || "";
const MEDAILLE = {1:["🥇","Gold"], 2:["🥈","Silber"], 3:["🥉","Bronze"]};
const LIGA_FEHLER = {konto:"Bitte melde dich zuerst an.", klasse:"Diese Klasse gehört nicht zu deinem Konto.", name:"Der Anzeigename braucht 2 bis 40 Zeichen, ohne E-Mail-Adresse oder Link.",
  kanton:"Bitte einen Kanton aus der Liste wählen.", klein:`Für die Liga braucht die Klasse mindestens ${LIGA_MIN} eingetragene Kinder.`, viele:"Du hast schon 30 Klassen in der Liga.", daten:"Das hat nicht geklappt."};
function ligaFehlerText(e){
  const m=String(e?.message||e||"");
  if(/PGRST202|42883|42P01|could not find the function|liga_klassen|does not exist|schema cache/i.test(m)) return "Die Klassen-Liga ist in Supabase noch nicht eingerichtet. Bitte supabase/klassenliga.sql im SQL Editor ausführen (ANLEITUNG-SUPABASE.md, Schritt 7).";
  return fehlerText(e);
}
// Beispieldaten für die Vorschau ohne Online-Datenbank (klar als Beispiel markiert)
const LIGA_BSP = {
  jetzt:[["5b Solothurn","SO",2,24.6,22,21],["6a Wil","SG",2,22.1,19,18],["4c Bern Kirchenfeld","BE",2,19.8,24,20],["Deine Klasse (Beispiel)","ZH",2,17.3,21,17,1],
         ["3b Chur","GR",2,15.0,18,14],["2. Sek Aarau","AG",3,12.4,23,16],["5a Luzern","LU",2,9.7,20,12],["4b Frauenfeld","TG",2,6.2,17,9],["6c Zürich Wipkingen","ZH",2,4.8,25,10]],
  vor:[["6a Wil","SG",2,26.3,19,19],["Deine Klasse (Beispiel)","ZH",2,23.9,21,20,1],["5b Solothurn","SO",2,21.0,22,19],["2. Sek Aarau","AG",3,18.2,23,20],
       ["4c Bern Kirchenfeld","BE",2,14.5,24,17],["3b Chur","GR",2,11.1,18,12],["6c Zürich Wipkingen","ZH",2,7.6,25,13]]
};
function mitPlatz(l){ const s=[...l].sort((a,b)=>b.punkte-a.punkte || String(a.anzeige).localeCompare(String(b.anzeige),"de")); let p=0, last=null;
  return s.map((x,i)=>{ if(x.punkte!==last){ p=i+1; last=x.punkte; } return {...x, platz:p}; }); }
function ligaBeispiel(woche, kanton){
  const l=(LIGA_BSP[woche]||[]).map(([anzeige,kt,zy,pk,ki,ak,eig])=>({id:"bsp-"+anzeige, anzeige, kanton:kt, zyklus:zy, punkte:pk, kinder:ki, aktiv:ak, eigen:!!eig}));
  return mitPlatz(l.filter(x=>!kanton || x.kanton===kanton));
}
// Rangliste laden (Supabase), zwischengespeichert pro Woche und Kanton; zeichnet die Seite danach neu
function ligaLaden(key, kanton, nachher){
  const ck=key+"|"+(kanton||"");
  if(LIGA.cache[ck] || LIGA.laedt[ck] || !SP?.liga) return LIGA.cache[ck]||null;
  LIGA.laedt[ck]=true;
  SP.ligaRangliste(key, kanton).then(l=>{ LIGA.cache[ck]={liste:l, zeit:Date.now()}; LIGA.fehler=""; })
    .catch(e=>{ console.warn("lehrer.js Liga", e); LIGA.fehler=ligaFehlerText(e); LIGA.cache[ck]={liste:[], zeit:Date.now(), fehler:true}; })
    .finally(()=>{ delete LIGA.laedt[ck]; try{ nachher ? nachher() : (S.screen==="lliga" || S.screen==="lklasse") && rerender(); }catch(e){} });
  return null;
}
function ligaMeineLaden(){
  if(LIGA.meine || LIGA.meineLaedt || !SP?.liga) return;
  LIGA.meineLaedt=true;
  SP.ligaMeine().then(l=>{ LIGA.meine=l||[]; }).catch(e=>{ console.warn("lehrer.js Liga", e); LIGA.meine=[]; LIGA.fehler=ligaFehlerText(e); })
    .finally(()=>{ LIGA.meineLaedt=false; if(S.screen==="lliga" || S.screen==="lklasse") rerender(); });
}
function ligaNeuLaden(){ LIGA.cache={}; LIGA.meine=null; LIGA.fehler=""; }
function ligaListeHTML(liste, eigene, leerText){
  if(!liste.length) return `<p class="empty">${h(leerText||"Diese Woche hat noch keine Klasse Punkte gesammelt.")}</p>`;
  const top=Math.max(0.1, liste[0].punkte);
  const zeigen=liste.filter((x,i)=>i<30 || eigene(x));
  return `<ol class="lzl-liste" aria-label="Rangliste">${zeigen.map((x,i)=>{ const eig=eigene(x), m=MEDAILLE[x.platz], p=Math.max(3, Math.round(x.punkte/top*100));
    const luecke = i>0 && liste.indexOf(x)!==liste.indexOf(zeigen[i-1])+1;
    return `${luecke?`<li class="lzl-luecke" aria-hidden="true">⋯</li>`:""}<li class="lzl-karte ${m?"lzl-p"+x.platz:""} ${eig?"lzl-eigen":""}" ${eig?'aria-current="true"':""}>
      <span class="lzl-platz">${m?`<span aria-hidden="true">${m[0]}</span><span class="lzl-sr">Platz ${x.platz}</span>`:`<span class="lzl-sr">Platz </span>${x.platz}`}</span>
      <span class="lzl-mitte"><b class="lzl-name">${h(x.anzeige)}</b>
        <span class="lzl-pills">${eig?`<i class="lzl-pill">Deine Klasse</i>`:""}${m?`<i class="lzl-pill">${m[1]}-Abzeichen</i>`:""}</span>
        <small>${x.kanton?h(ktName(x.kanton))+" · ":""}${x.zyklus?"Zyklus "+h(x.zyklus)+" · ":""}${h(x.aktiv)} von ${h(x.kinder)} Kindern aktiv</small>
        <span class="lzl-bar" aria-hidden="true"><i style="width:${p}%"></i></span></span>
      <span class="lzl-pkt"><b>${fmtPkt(x.punkte)}</b><small>Punkte pro Kind</small></span></li>`; }).join("")}</ol>`;
}
function ligaFilterHTML(W){
  return `<div class="lzl-filter">
    <div class="segs" role="group" aria-label="Woche"><button type="button" class="seg" data-lw="jetzt" aria-pressed="${LIGA.woche==="jetzt"}">Diese Woche · KW ${W.jetzt.kw}</button><button type="button" class="seg" data-lw="vor" aria-pressed="${LIGA.woche==="vor"}">Vorwoche · KW ${W.vor.kw}</button></div>
    <label class="lzl-kt"><span>Kanton</span><select id="lzlKt" class="sel"><option value="">Ganze Schweiz</option>${kantonListe().map(([c,n])=>`<option value="${h(c)}" ${LIGA.kanton===c?"selected":""}>${h(n)}</option>`).join("")}</select></label>
  </div>`;
}
function ligaFilterBinden(){
  $a("[data-lw]").forEach(b=>b.onclick=()=>{ LIGA.woche=b.dataset.lw; rerender(); const n=$q(`[data-lw="${LIGA.woche}"]`); n&&n.focus(); });
  const k=$q("#lzlKt"); k && (k.onchange=()=>{ LIGA.kanton=k.value; rerender(); const n=$q("#lzlKt"); n&&n.focus(); });
}
const ligaRegeln = () => `<details class="lzl-regeln"><summary>So werden die Punkte berechnet</summary>
  <ul><li>Gezählt werden die <b>Testpunkte</b> aller Abgaben der Kinder einer Klasse in der Kalenderwoche (Montag bis Sonntag). Bei Auswahlfragen gibt jede richtige Antwort 1 Punkt, offene Fragen zählen mit den Punkten aus deiner Korrektur.</li>
  <li>Pro Kind zählen höchstens 150 Punkte pro Woche.</li>
  <li>Die Summe wird durch die Anzahl <b>eingetragener Kinder</b> der Klasse geteilt. So sind kleine und grosse Klassen vergleichbar, und es lohnt sich, dass alle mitmachen.</li>
  <li>Mitmachen können Klassen ab ${LIGA_MIN} Kindern. Öffentlich sind nur Anzeigename, Kanton, Zyklus, Punkte pro Kind und wie viele Kinder aktiv waren, nie Namen oder einzelne Resultate.</li>
  <li>Die drei besten Klassen der Woche bekommen ein Gold-, Silber- oder Bronze-Abzeichen.</li></ul></details>`;
// Karte für Kinder: Platz der eigenen Klasse und Fortschrittsbalken (Abstand zur besten Klasse)
function ligaKindKarte(info, liste, beispiel){
  const W=ligaWochen().jetzt; const x=(liste||[]).find(y=>y.id===info.id); let haupt, sub, p=0, med="";
  if(x){ const top=Math.max(0.1, liste[0].punkte); p=Math.max(6, Math.round(x.punkte/top*100)); const m=MEDAILLE[x.platz]; med=m?m[0]+" ":"";
    const vor=[...liste].reverse().find(y=>y.platz<x.platz);
    haupt=`Platz ${x.platz} von ${liste.length}`;
    sub = !vor ? "Eure Klasse ist ganz vorne. Super gemacht!" : `Noch ${fmtPkt(Math.max(0.1, vor.punkte-x.punkte))} Punkte pro Kind bis Platz ${vor.platz}. Jeder Test hilft mit!`;
  } else { haupt="Noch keine Punkte"; sub="Diese Woche zählt jeder gelöste Test. Gemeinsam schafft ihr das!"; }
  return `<section class="lzl-kind${beispiel?" lzl-bsp":""}" aria-label="Klassen-Liga">
    <img src="img/kids/duo-jubel.webp" alt="" class="lzl-kindbild" width="120" height="120">
    <div class="lzl-kindtext"><small>🏆 Klassen-Liga · KW ${W.kw}${beispiel?" · Beispiel":""}</small>
      <b>${h(info.anzeige)}</b><span class="lzl-gross">${med}${h(haupt)}</span>
      <span class="lzl-bar hell" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p}" aria-label="Punkte im Vergleich zur besten Klasse"><i style="width:${p}%"></i></span>
      <span class="lzl-sub">${h(sub)}</span></div></section>`;
}

function seiteLiga(){
  if(!bereitFuerLehrer("Klassen-Liga")) return;
  const W=ligaWochen(), wk=LIGA.woche==="vor"?W.vor:W.jetzt, D=LZ.daten;
  const kopf=`${lc([START,LB], "Klassen-Liga")}
    <div class="bhead"><span class="emo" aria-hidden="true">🏆</span><h1>Klassen-Liga</h1></div>
    <p class="bdesc">Klasse gegen Klasse: Jede Woche zählen die Testpunkte eurer Kinder, geteilt durch die Anzahl Kinder der Klasse. So haben kleine und grosse Klassen die gleichen Chancen. Mitmachen ist freiwillig.</p>`;
  if(!SP.liga){
    const bsp=ligaBeispiel(LIGA.woche, LIGA.kanton); const bspJetzt=ligaBeispiel("jetzt","");
    setze(`${kopf}
      <div class="lzl-online"><span class="lzl-onicon" aria-hidden="true">🌐</span><div><b>Die Klassen-Liga braucht die Online-Datenbank.</b>
        <p>Damit Klassen von verschiedenen Schulen gegeneinander spielen können, müssen die Punkte an einem gemeinsamen Ort zusammenkommen. Im Moment speichert easyplay alles nur ${SP.art==="claude"?"in diesem claude.ai-Artifact":"auf diesem Gerät"}. Sobald Supabase verbunden ist (ANLEITUNG-SUPABASE.md, Schritt 7), kannst du deine Klassen hier anmelden.</p></div></div>
      <section class="statcard"><h2>Vorschau mit Beispieldaten</h2>
        <p class="lzl-bspband" role="note">Beispiel: Diese Klassen und Punkte sind erfunden und dienen nur zur Ansicht.</p>
        ${ligaFilterHTML(W)}
        ${ligaListeHTML(bsp, x=>x.eigen, "In diesem Kanton gibt es in den Beispieldaten keine Klasse.")}
      </section>
      <div class="lz-grid2">
        <section class="statcard"><h2>So sehen es die Kinder</h2>
          <p class="help">Nach einem Test und im Profil sehen die Kinder den Platz ihrer Klasse (Beispiel):</p>
          ${ligaKindKarte({id:"bsp-Deine Klasse (Beispiel)", anzeige:"Deine Klasse (Beispiel)"}, bspJetzt, true)}
        </section>
        <section class="statcard"><h2>Meine Klassen</h2>
          ${D.klassen.length ? `<ul class="lzl-meine">${D.klassen.map(k=>`<li><span><b>${h(k.name)}</b><small>${(k.schueler||[]).length} Kinder</small></span><button type="button" class="lza-k klein" disabled>Anmelden</button></li>`).join("")}</ul>
            <p class="help">Anmelden geht, sobald die Online-Datenbank verbunden ist.</p>` : `<p class="empty">Noch keine Klasse.</p>`}
        </section>
      </div>
      ${ligaRegeln()}`);
    ligaFilterBinden();
    return;
  }
  // Online (Supabase)
  ligaMeineLaden();
  const daten=ligaLaden(wk.key, LIGA.kanton); const jetztAlle=ligaLaden(W.jetzt.key, ""); const vorAlle=ligaLaden(W.vor.key, "");
  const meine=LIGA.meine||[]; const meineIds=new Set(meine.map(m=>m.liga_id));
  const eigen=x=>meineIds.has(x.id);
  const platzVon=(cache,id)=>cache?.liste?.find(x=>x.id===id)||null;
  const klassenHTML = !LIGA.meine ? ladeAnzeige("Anmeldungen werden geladen …") : !D.klassen.length ? `<p class="empty">Lege zuerst eine Klasse an.</p>` :
    `<ul class="lzl-meine">${D.klassen.map(k=>{ const a=meine.find(m=>m.klasse_id===k.id); const n=(k.schueler||[]).length;
      const j=a&&platzVon(jetztAlle,a.liga_id), v=a&&platzVon(vorAlle,a.liga_id); const mv=v&&MEDAILLE[v.platz];
      const status = !a ? (n<LIGA_MIN ? `Nicht angemeldet. Ab ${LIGA_MIN} Kindern möglich (jetzt ${n}).` : "Nicht angemeldet.")
        : a.gesperrt ? `Als «${h(a.anzeige)}» angemeldet, aber von der Verwaltung ausgeblendet. Bitte melde dich bei easyplay.`
        : `Als «${h(a.anzeige)}»${a.kanton?" · "+h(ktName(a.kanton)):""} · ${j?`diese Woche Platz ${j.platz} (${fmtPkt(j.punkte)} Punkte pro Kind)`:"diese Woche noch keine Punkte"}${mv?` · ${mv[0]} ${mv[1]}-Abzeichen der Vorwoche`:""}`;
      const form = LIGA.offen===k.id ? `<div class="lz-form lzl-form">
          <label for="lzlName">Anzeigename der Klasse (ohne Kindernamen)</label><input id="lzlName" class="sel" maxlength="40" value="${h(a?.anzeige||k.name)}" placeholder="z. B. 5b Solothurn">
          <label for="lzlKanton">Kanton</label><select id="lzlKanton" class="sel"><option value="">ohne Kanton</option>${kantonListe().map(([c,nm])=>`<option value="${h(c)}" ${(a?.kanton||"")===c?"selected":""}>${h(nm)}</option>`).join("")}</select>
          <p class="help">Der Anzeigename ist für alle easyplay-Besucher sichtbar. Nimm Klasse und Ort oder Schulhaus, keine Namen von Kindern oder Lehrpersonen.</p>
          <p class="err" id="lzlErr" aria-live="polite"></p>
          <div class="row"><button type="button" class="big" id="lzlSave" data-k="${h(k.id)}">${a?"Speichern":"Für die Liga anmelden"}</button><button type="button" class="big alt" id="lzlAbbr">Abbrechen</button></div></div>` : "";
      return `<li class="${LIGA.offen===k.id?"offen":""}"><span><b>${h(k.name)}</b><small>${status}</small></span>
        <span class="lzl-akt">${a ? `<button type="button" class="lza-k klein" data-lzl-edit="${h(k.id)}">Ändern</button>${a.gesperrt?"":`<button type="button" class="lza-k klein g" data-lzl-ab="${h(k.id)}">Abmelden</button>`}`
          : `<button type="button" class="lza-k klein p" data-lzl-edit="${h(k.id)}" ${n<LIGA_MIN?"disabled":""}>Anmelden</button>`}</span>${form}</li>`; }).join("")}</ul>`;
  setze(`${kopf}
    ${LIGA.fehler?`<div class="lz-hinweis">⚠️ <span>${h(LIGA.fehler)}</span></div>`:""}
    ${LIGA.info?`<p class="lzl-info" role="status">${h(LIGA.info)}</p>`:""}
    <section class="statcard"><h2>Meine Klassen in der Liga</h2>${klassenHTML}</section>
    <section class="statcard"><h2>Rangliste KW ${wk.kw}${LIGA.kanton?" · "+h(ktName(LIGA.kanton)):""}</h2>
      ${ligaFilterHTML(W)}
      ${daten ? ligaListeHTML(daten.liste, eigen, LIGA.kanton ? "In diesem Kanton hat diese Woche noch keine Klasse Punkte." : (LIGA.woche==="vor" ? "In der Vorwoche hat keine Klasse Punkte gesammelt." : "Diese Woche hat noch keine Klasse Punkte gesammelt. Der erste Test zählt!")) : ladeAnzeige("Rangliste wird geladen …")}
      <div class="row"><button type="button" class="lza-k" id="lzlReload">Aktualisieren</button></div>
    </section>
    ${ligaRegeln()}`);
  LIGA.info="";
  ligaFilterBinden();
  $q("#lzlReload").onclick=()=>{ ligaNeuLaden(); rerender(); };
  $a("[data-lzl-edit]").forEach(b=>b.onclick=()=>{ LIGA.offen = LIGA.offen===b.dataset.lzlEdit ? null : b.dataset.lzlEdit; rerender(); const i=$q("#lzlName"); i&&i.focus(); });
  $q("#lzlAbbr") && ($q("#lzlAbbr").onclick=()=>{ LIGA.offen=null; rerender(); });
  $q("#lzlSave") && ($q("#lzlSave").onclick=async()=>{ const b=$q("#lzlSave"), err=$q("#lzlErr"); const name=$q("#lzlName").value.replace(/\s+/g," ").trim();
    if(name.length<2 || name.length>40 || /[@<>{}]|https?:|www\./i.test(name)){ err.textContent=LIGA_FEHLER.name; $q("#lzlName").focus(); return; }
    const kid=(LZ.daten.klassen.find(k=>k.id===b.dataset.k)?.schueler||[]).map(s=>s.name.toLowerCase());
    if(kid.some(n=>n.length>=3 && new RegExp(`(^|[^a-zäöü])${n.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}([^a-zäöü]|$)`,"i").test(name))){ err.textContent="Bitte keine Namen von Kindern im Anzeigenamen."; $q("#lzlName").focus(); return; }
    b.disabled=true; err.textContent="Wird gespeichert …";
    try{ const r=await SP.ligaAnmelden(b.dataset.k, name, $q("#lzlKanton").value);
      if(!r || r.fehler){ err.textContent=LIGA_FEHLER[r?.fehler]||LIGA_FEHLER.daten; b.disabled=false; return; }
      LIGA.offen=null; LIGA.info=`«${r.anzeige}» ist in der Klassen-Liga angemeldet.`; ligaNeuLaden(); rerender(); toast("Gespeichert.","ok");
    }catch(e){ err.textContent=ligaFehlerText(e); b.disabled=false; } });
  $a("[data-lzl-ab]").forEach(b=>b.onclick=async()=>{ const k=LZ.daten.klassen.find(x=>x.id===b.dataset.lzlAb); if(!k || !confirm(`«${k.name}» aus der Klassen-Liga abmelden? Die Klasse erscheint dann nicht mehr in der Rangliste.`)) return;
    b.disabled=true; try{ await SP.ligaAbmelden(k.id); LIGA.info=`«${k.name}» ist abgemeldet.`; ligaNeuLaden(); rerender(); }catch(e){ toast(ligaFehlerText(e),"bad"); b.disabled=false; } });
}
// Kurzer Liga-Block auf der Klassenseite
function ligaKlasseHTML(k){
  if(!SP?.liga) return `<section class="statcard lz-sek"><h2>🏆 Klassen-Liga</h2><p class="help">Klasse gegen Klasse: Die Liga braucht die Online-Datenbank. Schau dir die Vorschau mit Beispieldaten an.</p><div class="row lz-links"><button type="button" class="big alt" data-lzl-zu="1">Zur Klassen-Liga</button></div></section>`;
  ligaMeineLaden(); const a=(LIGA.meine||[]).find(m=>m.klasse_id===k.id);
  const W=ligaWochen(); const c=a ? ligaLaden(W.jetzt.key, "") : null; const j=c?.liste?.find(x=>x.id===a.liga_id);
  const txt = !LIGA.meine ? "Wird geladen …" : !a ? "Diese Klasse ist nicht in der Liga angemeldet. Mitmachen ist freiwillig." : a.gesperrt ? `Als «${a.anzeige}» angemeldet, von der Verwaltung ausgeblendet.` : `Als «${a.anzeige}» angemeldet · ${j?`diese Woche Platz ${j.platz} mit ${fmtPkt(j.punkte)} Punkten pro Kind`:"diese Woche noch keine Punkte"}.`;
  return `<section class="statcard lz-sek"><h2>🏆 Klassen-Liga</h2><p class="help">${h(txt)}</p><div class="row lz-links"><button type="button" class="big alt" data-lzl-zu="1">Zur Klassen-Liga</button></div></section>`;
}
// Kinder: nach der Abgabe (mit Code und PIN) die eigene Liga-Klasse merken und den Platz zeigen
async function ligaKindNachAbgabe(K){
  try{
    if(!SP?.liga || !K?.code || !K?.pin) return;
    if(!K.liga){ const r=await SP.ligaKind(K.code, K.pin); K.liga = r && r.liga ? {id:r.liga_id, anzeige:r.anzeige, kanton:r.kanton||""} : {kein:true};
      if(!K.liga.kein) lsSet(LS_LIGA, K.liga); }
    if(K.liga.kein) return;
    const W=ligaWochen(); const ck=W.jetzt.key+"|";
    const zeige=()=>{ const el=$q("#lzLigaKind"); const c=LIGA.cache[ck]; if(el && c && !c.fehler) el.innerHTML=ligaKindKarte(K.liga, c.liste, false); };
    if(LIGA.cache[ck] && Date.now()-LIGA.cache[ck].zeit<60000) zeige(); else { delete LIGA.cache[ck]; ligaLaden(W.jetzt.key, "", zeige); }
  }catch(e){ console.warn("lehrer.js Liga (Kind)", e); }
}
// Kinder: im Profil, falls dieses Gerät eine Liga-Klasse kennt
function ligaProfil(){
  try{
    const info=lsGet(LS_LIGA, null); if(!info || !info.id || S.screen!=="profil" || !app() || $q("#lzlProfil")) return;
    const box=document.createElement("div"); box.id="lzlProfil"; box.className="lz-sek"; app().appendChild(box);
    speicher().then(sp=>{ if(!sp?.liga){ box.remove(); return; } const W=ligaWochen(); const ck=W.jetzt.key+"|";
      const zeige=()=>{ const c=LIGA.cache[ck]; if(!document.body.contains(box) || !c || c.fehler) return;
        box.innerHTML=ligaKindKarte(info, c.liste, false)+`<p class="lzl-weg"><button type="button" class="lz-link" id="lzlVergessen">Klasse auf diesem Gerät nicht mehr anzeigen</button></p>`;
        const v=box.querySelector("#lzlVergessen"); v&&(v.onclick=()=>{ try{ localStorage.removeItem(LS_LIGA); }catch(e){} box.remove(); }); };
      if(LIGA.cache[ck] && Date.now()-LIGA.cache[ck].zeit<60000) zeige(); else { delete LIGA.cache[ck]; ligaLaden(W.jetzt.key, "", zeige); }
    }).catch(()=>{});
  }catch(e){}
}

/* ================= 8. Einbindung in easyplay ================= */
const SEITEN = {lehrer:seiteLehrer, lklasse:seiteKlasse, lkind:seiteKind, ltestneu:seiteTestNeu, ltest:seiteTest, lcode:seiteCode, lspiel:seiteSpiel, lfertig:seiteFertig,
  lkinder:seiteKinder, lliga:seiteLiga, lfragen:seiteFragen, lbib:seiteBib, lbibseite:seiteBibSeite, lmeld:seiteMeldungen};
const origRender=window.render;
window.render=function(){
  try{ if(S.profil && !["login","register"].includes(S.screen) && sessionStorage.getItem("ep-lz-nach-login")){ sessionStorage.removeItem("ep-lz-nach-login"); S.screen="lehrer"; } }catch(e){}
  document.body.classList.toggle("lz-admin", ADMIN_SEITEN.has(S.screen)); hashNachfuehren();
  try{ document.title = ADMIN_SEITEN.has(S.screen) ? "easyplay Lehrerbereich" : (document.title==="easyplay Lehrerbereich" ? TITEL0 : document.title); }catch(e){}
  if(SEITEN[S.screen]){
    try{ if(typeof applyDark==="function") applyDark(); }catch(e){}
    try{ if(S.timer){ clearInterval(S.timer); S.timer=null; } }catch(e){}
    try{ renderNav(); }catch(e){ console.warn(e); }
    try{ SEITEN[S.screen](); }catch(e){ console.error("lehrer.js", e); setze(`<div class="lwait"><h2>😕 Hoppla</h2><p>${h(fehlerText(e))}</p><div class="row"><button class="big" type="button" id="lzHome">Zur Startseite</button></div></div>`); const b=$q("#lzHome"); b&&(b.onclick=()=>go("home")); }
    return;
  }
  return origRender.apply(this, arguments);
};
// Der Lehrerbereich ist eine eigene Seite (lehrer/index.html); in claude.ai bleibt er in der App
function zumLehrerbereich(){ if(window.claude || !/^https?:/.test(location.protocol)) return false; location.href="lehrer/"; return true; }
function zuSeite(s){ if(s==="lehrer" && zumLehrerbereich()) return; try{ if(S.libModus && typeof setLibModus==="function"){ S.libModus=false; document.documentElement.dataset.mode="spiel"; } }catch(e){} go(s); }
// Menüeinträge
if(typeof window.renderNav==="function"){
  const origNav=window.renderNav;
  window.renderNav=function(){
    const r=origNav.apply(this, arguments);
    try{
      const menu=$q("#hauptmenue");
      if(menu && !menu.dataset.lmGebunden){ menu.dataset.lmGebunden="1";
        if(!menu.querySelector("[data-lm]")){ const ref=menu.querySelector('[data-m="meinetests"]') || menu.querySelector('[data-m="set"]');
        const wrap=document.createElement("div"); wrap.innerHTML=`<button role="menuitem" type="button" data-lm="lehrer">🎓 Lehrerbereich</button><button role="menuitem" type="button" data-lm="lcode">🔢 Test mit Code</button>`;
        const items=[...wrap.children]; if(ref && ref.parentNode===menu){ items.reverse().forEach(x=>ref.after(x)); } else items.forEach(x=>menu.appendChild(x)); }
        menu.querySelectorAll("[data-lm]").forEach(b=>b.onclick=()=>{ const btn=$q("#navMenu"); if(btn && !menu.hidden) btn.click(); if(b.dataset.lm==="lcode") LZ.kid=null; zuSeite(b.dataset.lm); });
      }
      const km=$q("#kontomenue");
      if(km && !km.querySelector("[data-lm]")){
        const b=document.createElement("button"); b.setAttribute("role","menuitem"); b.type="button"; b.className="kopt"; b.dataset.lm="lehrer";
        b.innerHTML=`<span class="ki">🎓</span><span><b>Lehrerbereich</b><small>Klassen und Tests verwalten</small></span>`;
        km.appendChild(b); b.onclick=()=>{ const kb=$q("#navKonto"); if(kb && !km.hidden) kb.click(); zuSeite("lehrer"); };
      }
    }catch(e){ console.warn("lehrer.js Menü", e); }
    return r;
  };
}
// Profil: Rolle «Lehrperson»
if(typeof window.renderProfil==="function"){
  const origProfil=window.renderProfil;
  window.renderProfil=function(){
    const r=origProfil.apply(this, arguments);
    try{ if(S.screen==="profil" && app() && !$q("#lzProfil")){
      const box=document.createElement("section"); box.className="statcard lz-sek"; box.id="lzProfil";
      const fertig=()=>{ const ist=SP?.istLehrer?.(); box.innerHTML=`<h2>🎓 Lehrperson</h2><p class="help">${ist?"Du bist als Lehrperson freigeschaltet.":"Bist du Lehrerin oder Lehrer? Dann schalte den Lehrerbereich frei: Klassen, Tests mit Code, Noten und Arbeitsblätter."}</p>
        <div class="row lz-links">${ist?`<button class="big" type="button" id="lzProfZu">🎓 Zum Lehrerbereich</button>`:`<button class="big gold" type="button" id="lzProfRolle">🎓 Ich bin Lehrperson</button>`}</div>`;
        const z=box.querySelector("#lzProfZu"); z&&(z.onclick=()=>zuSeite("lehrer"));
        const ro=box.querySelector("#lzProfRolle"); ro&&(ro.onclick=async()=>{ ro.disabled=true; try{ zuSeite("lehrer"); }catch(e){ toast(fehlerText(e),"bad"); ro.disabled=false; } }); };
      fertig(); app().appendChild(box); if(!SP) speicher().then(()=>{ if(document.body.contains(box)) fertig(); });
    } }catch(e){}
    ligaProfil();
    return r;
  };
}
// Link #test=CODE
function pruefeHash(){ if(/^#lehrer\b/.test(location.hash)){ if(!ADMIN_SEITEN.has(S.screen)) zuSeite("lehrer"); return; }
  const m=String(location.hash).match(/#test=([A-Za-z0-9]{4,8})/); if(!m) return; LZ.kid={code:normCode(m[1])}; go("lcode"); }
/* Adresse #lehrer, damit der Lehrerbereich ein eigenes Lesezeichen hat und ein Neuladen dort bleibt */
function hashNachfuehren(){ try{ const im=ADMIN_SEITEN.has(S.screen), hat=/^#lehrer\b/.test(location.hash);
  if(im && !hat) history.replaceState(null, "", location.pathname+location.search+"#lehrer");
  else if(!im && hat) history.replaceState(null, "", location.pathname+location.search); }catch(e){} }
addEventListener("hashchange", pruefeHash);
pruefeHash();
// Wenn die Anmeldung (Supabase/lokal) wechselt, Daten neu laden
setInterval(()=>{ if(SP && LZ.daten && LZ.lid!==SP.lehrerId()){ LZ.daten=null; if(SEITEN[S.screen] && !["lcode","lspiel","lfertig"].includes(S.screen)) rerender(); } }, 1500);
speicher();
// aktuelle Seite neu zeichnen, damit Menü und Startseite die neuen Einträge zeigen
try{ if(!SEITEN[S.screen]) render(); }catch(e){}

/* ================= 9. CSS ================= */
const css=`
.lz-box{text-align:center}
.lz-box .big{width:100%}
.lz-link{background:none;border:0;padding:0;color:var(--welt);font-weight:700;text-decoration:underline;cursor:pointer;font:inherit}
.lz-hinweis{display:flex;gap:10px;align-items:flex-start;background:color-mix(in srgb,var(--welt) 8%,var(--surface));border:2px solid color-mix(in srgb,var(--welt) 30%,var(--line));border-radius:18px;padding:12px 16px;margin:0 0 18px;font-size:.98rem;line-height:1.45}
.lz-hinweis.lz-ds{background:color-mix(in srgb,var(--natur) 8%,var(--surface));border-color:color-mix(in srgb,var(--natur) 30%,var(--line));margin-top:18px}
.lz-grid2{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:18px;align-items:start}
.lz-sek{margin-top:18px}
.lz-item b{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.lz-tag{font-size:.75rem;font-weight:700;border-radius:999px;padding:2px 8px;background:var(--bg);border:1px solid var(--line)}
.lz-tag.zu{color:var(--bad);border-color:var(--bad)}
.lz-code{font-family:"Fredoka",ui-monospace,monospace;letter-spacing:.08em;color:var(--welt)}
.lz-neu{margin-top:16px;border-top:2px dashed var(--line);padding-top:12px}
.lz-neu summary{cursor:pointer;font-weight:700;min-height:44px;display:flex;align-items:center}
.lz-form{display:grid;gap:6px;min-width:0}
.lz-form label,.lz-lbl{font-weight:700;margin-top:6px;display:block}
.lz-form .sel,.lz-ta{width:100%;max-width:100%}
.lz-ta{min-height:110px;font:inherit;resize:vertical}
.lz-zwei{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr));gap:10px}
.lz-links{justify-content:flex-start!important;margin-top:12px}
.lz-kinder{list-style:none;margin:0 0 10px;padding:0;display:grid;gap:6px}
.lz-kinder li{display:flex;align-items:center;gap:10px;background:var(--bg);border:2px solid var(--line);border-radius:14px;padding:6px 8px 6px 12px;min-width:0}
.lz-kname{flex:1 1 auto;min-width:0;text-align:left;background:none;border:0;font-weight:700;padding:6px 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--ink)}
.lz-pin{font-family:"Fredoka",ui-monospace,monospace;font-size:1.25rem;font-weight:700;letter-spacing:.12em;color:var(--welt)}
.lz-kakt{display:flex;gap:4px}
.lz-mini{min-width:40px;min-height:40px;border-radius:12px;border:2px solid var(--line);background:var(--surface);display:inline-grid;place-items:center;font-size:1rem;padding:0 6px;color:var(--ink)}
.lz-mini:hover{border-color:var(--welt)}
.lz-gefahr{color:var(--bad)!important}
.lz-zahl{display:inline-block;font-size:.95rem;background:var(--bg);border:2px solid var(--line);border-radius:999px;padding:2px 12px;vertical-align:middle;margin-left:6px}
.lz-chart{margin:0}
.lz-chart svg{width:100%;height:auto;display:block}
.lz-chart polyline{fill:none;stroke-width:3.5;stroke-linejoin:round;stroke-linecap:round}
.lz-chart circle{stroke:var(--surface);stroke-width:2}
.lz-gl{stroke:var(--line);stroke-width:1}
.lz-gl.vier{stroke:var(--ok);stroke-dasharray:6 5;stroke-width:1.6}
.lz-ax{fill:var(--soft);font-size:13px;font-family:"Lexend",system-ui,sans-serif}
.lz-ax.klein{font-size:11px}
.lz-chart figcaption{display:flex;flex-wrap:wrap;gap:6px 16px;justify-content:center;font-size:.92rem;color:var(--soft);margin-top:6px}
.lz-chart figcaption span{display:inline-flex;align-items:center;gap:6px}
.lz-chart figcaption i{width:22px;height:5px;border-radius:3px;display:inline-block}
.lz-leg4 i{background:repeating-linear-gradient(90deg,var(--ok) 0 6px,transparent 6px 10px)}
.lz-tabwrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;border:2px solid var(--line);border-radius:16px;background:var(--surface)}
.lz-tab{border-collapse:collapse;width:100%;font-size:.95rem}
.lz-tab th,.lz-tab td{padding:8px 10px;border-bottom:1px solid var(--line);text-align:center;white-space:nowrap}
.lz-tab thead th{background:var(--bg);font-size:.85rem;vertical-align:bottom}
.lz-tab thead th small{display:block;color:var(--soft);font-weight:400}
.lz-tab tbody th{text-align:left;position:sticky;left:0;background:var(--surface);z-index:1}
.lz-tab.lz-liste td,.lz-tab.lz-liste th{text-align:left}
.lz-th{background:none;border:0;padding:0;font-weight:700;color:var(--ink);text-align:inherit;cursor:pointer;font-size:inherit}
.lz-th:hover{color:var(--welt);text-decoration:underline}
.lz-n{font-weight:700;font-family:"Fredoka",system-ui,sans-serif;font-size:1.05rem}
.lz-n.gut{color:var(--ok)}
.lz-n.tief{color:var(--bad)}
.lz-n.leer{color:var(--soft)}
.lz-n.fett{background:var(--bg)}
.lz-schnitt th,.lz-schnitt td{background:var(--bg);font-size:.9rem}
.lz-offen{color:var(--soft);font-style:italic}
.lz-fehler{list-style:none;counter-reset:f;margin:0;padding:0;display:grid;gap:10px}
.lz-fehler li{counter-increment:f;border:2px solid var(--line);border-radius:16px;padding:12px 14px;background:var(--surface);display:grid;gap:6px;min-width:0}
.lz-fkopf b{display:block;overflow-wrap:anywhere}
.lz-fkopf b::before{content:counter(f) ". ";color:var(--soft)}
.lz-fkopf small{color:var(--soft)}
.lz-quote{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.lz-bar{flex:1 1 120px;height:12px;border-radius:999px;background:var(--bg);border:1px solid var(--line);overflow:hidden;min-width:80px}
.lz-bar i{display:block;height:100%;background:linear-gradient(90deg,var(--alltag),var(--bad));border-radius:999px}
.lz-quote small{color:var(--soft)}
.lz-ant{margin:0;display:flex;flex-wrap:wrap;gap:4px 14px;font-size:.95rem}
.lz-ant .ans-bad{color:var(--bad);text-decoration:none}
.lz-ant .ans-ok{color:var(--ok);font-weight:600}
.lz-themen{list-style:none;margin:0 0 16px;padding:0;display:grid;gap:8px}
.lz-themen li{display:grid;grid-template-columns:minmax(90px,1.2fr) 2fr auto auto;align-items:center;gap:10px;font-size:.95rem}
.lz-themen small{color:var(--soft)}
.lz-h3{font-size:1.15rem;margin:16px 0 10px}
.lz-verf{margin:6px 0;color:var(--soft)}
.lz-verf b{color:var(--ink);font-size:1.15rem}
.lz-zufall{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end}
.lz-zufall label{width:100%}
.lz-anz{width:120px!important}
.lz-auswahl{max-height:460px;overflow:auto;display:grid;gap:8px;padding:4px}
.lz-auswahl .sq b,.lz-sel b{overflow-wrap:anywhere}
.lz-sel{margin:0;padding-left:1.6em;display:grid;gap:8px}
.lz-sel li{padding-left:4px}
.lz-sel li>span{display:inline-block;width:calc(100% - 52px);vertical-align:top}
.lz-sel li>.lz-mini{float:right}
.lz-sel small{display:block;color:var(--soft);overflow-wrap:anywhere}
.lz-vorschau{padding:12px 16px 12px 2.2em}
.lz-vorschau li>span{width:100%}
.lz-richtig{color:var(--ok)}
.lz-chips{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0 12px}
.lz-chips.lz-mitte{justify-content:center;margin-top:-6px}
.lz-chip{border:2px solid color-mix(in srgb,#8A3FE0 40%,var(--line));background:color-mix(in srgb,#8A3FE0 8%,var(--surface));color:var(--ink);border-radius:999px;padding:6px 12px;font-size:.9rem;font-weight:600;text-align:left;max-width:100%;overflow-wrap:anywhere}
.lz-chip.still{cursor:default}
.lz-kbs{display:grid;gap:6px;margin-top:6px}
.lz-kb{display:flex;gap:10px;align-items:flex-start;border:2px solid var(--line);border-radius:12px;padding:8px 12px;background:var(--surface);cursor:pointer;font-weight:400!important;margin:0!important}
.lz-kb input{width:20px;height:20px;flex:none;margin-top:3px;accent-color:#8A3FE0}
.lz-erstellen{position:sticky;bottom:10px;z-index:5;margin-top:18px;background:color-mix(in srgb,var(--surface) 92%,transparent);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border:2px solid var(--line);border-radius:20px;padding:12px;display:grid;gap:4px;box-shadow:var(--shadow)}
.lz-erstellen .big{width:100%}
.lz-erstellen .err:empty{display:none}
.lz-codegross{font-family:"Fredoka","Bricolage Grotesque",system-ui,sans-serif;font-size:clamp(2.4rem,11vw,3.6rem);font-weight:700;letter-spacing:.14em;text-align:center;color:var(--welt);margin:4px 0 6px;line-height:1.1}
.lz-schalter{display:flex;gap:10px;align-items:center;margin-top:14px;font-weight:600;cursor:pointer}
.lz-schalter input{width:24px;height:24px;accent-color:var(--ok)}
.lz-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px;margin-bottom:14px}
.lz-kpis div{background:var(--bg);border:2px solid var(--line);border-radius:16px;padding:10px;text-align:center;display:grid}
.lz-kpis b{font-family:"Fredoka",system-ui,sans-serif;font-size:1.5rem}
.lz-kpis span{color:var(--soft);font-size:.88rem}
.lz-codebox{max-width:520px;margin:20px auto}
.lz-gross{font-size:3.4rem;line-height:1;margin:0}
.lz-codeform{display:grid;gap:6px;width:100%;max-width:340px;margin-top:10px;text-align:left}
.lz-codeform label{font-weight:700;margin-top:6px}
.lz-codein{text-align:center;font-family:"Fredoka",ui-monospace,monospace;font-size:1.7rem!important;letter-spacing:.2em;text-transform:uppercase}
.lz-codeform .big{margin-top:8px;width:100%}
.lz-codein::placeholder{letter-spacing:normal;text-transform:none;font-family:"Lexend",system-ui,sans-serif;font-size:1.05rem}
.lz-spiel{max-width:760px;margin:0 auto}
.lz-spielkopf{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin:6px 0 10px}
.lz-spielkopf>div{display:grid}
.lz-spielkopf b{font-family:"Bricolage Grotesque",system-ui,sans-serif;font-size:1.25rem}
.lz-spielkopf span{color:var(--soft)}
.lz-fz{font-weight:700;color:var(--ink)!important;background:var(--surface);border:2px solid var(--line);border-radius:999px;padding:4px 12px}
.lz-fort{height:12px;border-radius:999px;background:var(--surface);border:2px solid var(--line);overflow:hidden;margin-bottom:14px}
.lz-fort i{display:block;height:100%;background:linear-gradient(90deg,#3D5AFE,#8A3FE0,#E043B8);transition:width .3s}
.lz-q{font-size:clamp(1.3rem,4.4vw,1.8rem);margin-bottom:14px;overflow-wrap:anywhere}
.lz-opts{display:grid;gap:10px;margin-top:10px}
.lz-opt{display:flex;align-items:center;gap:12px;text-align:left;min-height:58px;border:3px solid var(--line);background:var(--surface);border-radius:18px;padding:10px 14px;font-weight:600;font-size:1.05rem;color:var(--ink);transition:transform .08s,border-color .15s}
.lz-opt:hover{border-color:color-mix(in srgb,var(--welt) 50%,var(--line))}
.lz-opt[aria-checked="true"]{border-color:var(--welt);background:color-mix(in srgb,var(--welt) 12%,var(--surface));box-shadow:0 4px 0 color-mix(in srgb,var(--welt) 45%,transparent)}
.lz-opt span:last-child{overflow-wrap:anywhere;min-width:0}
.lz-bu{flex:none;width:36px;height:36px;border-radius:12px;display:grid;place-items:center;background:var(--bg);border:2px solid var(--line);font-family:"Fredoka",system-ui,sans-serif;font-weight:700}
.lz-opt[aria-checked="true"] .lz-bu{background:var(--welt);color:#fff;border-color:var(--welt)}
.lz-nav{display:flex;justify-content:space-between;gap:10px;margin-top:16px}
.lz-nav .big{flex:1 1 0;min-width:0}
.lz-punkte{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:16px}
.lz-punkte button{width:38px;height:38px;border-radius:50%;border:2px solid var(--line);background:var(--surface);font-weight:700;font-size:.9rem;color:var(--soft)}
.lz-punkte button.ja{background:color-mix(in srgb,var(--welt) 18%,var(--surface));border-color:color-mix(in srgb,var(--welt) 50%,var(--line));color:var(--ink)}
.lz-punkte button.jetzt{outline:3px solid var(--gold);outline-offset:1px}
.lz-tipp{text-align:center;color:var(--soft);font-size:.92rem;margin-top:12px}
.lz-fertig{text-align:center}
.lz-notebox{display:inline-grid;margin:12px auto;padding:10px 28px;border-radius:24px;border:3px solid var(--line);background:var(--bg)}
.lz-notebox span{color:var(--soft);font-weight:600}
.lz-notebox b{font-family:"Fredoka",system-ui,sans-serif;font-size:3.6rem;line-height:1}
.lz-notebox.gut{border-color:var(--ok)} .lz-notebox.gut b{color:var(--ok)}
.lz-notebox.tief{border-color:var(--bad)} .lz-notebox.tief b{color:var(--bad)}
.lz-notebox.ok b{color:var(--welt)}
.lz-fertig .rev span{overflow-wrap:anywhere}
.lz-laden{max-width:520px;margin:30px auto}
.lz-spinner{width:44px;height:44px;border-radius:50%;border:5px solid var(--line);border-top-color:var(--welt);animation:lzdreh 1s linear infinite}
@keyframes lzdreh{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.lz-spinner{animation:none}}
.lz-toast{position:fixed;left:50%;bottom:calc(18px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:1000;max-width:min(92vw,520px);background:var(--ink);color:var(--bg);padding:12px 18px;border-radius:16px;font-weight:600;box-shadow:var(--shadow);text-align:center}
.lz-toast.bad{background:var(--bad);color:#fff}
.lz-toast[hidden]{display:none}
.lz-codestart{background:linear-gradient(135deg,#17A35A,#0E8A8A)!important;color:#fff!important;box-shadow:0 6px 0 #0B6B4A,0 12px 22px -12px rgba(23,163,90,.7)!important}
#hauptmenue [data-lm]{display:block;width:100%}
@media (max-width:560px){.lz-lang{display:none}}
@media (max-width:560px){
  .lz-themen li{grid-template-columns:1fr auto;gap:4px 10px}
  .lz-themen .lz-bar{grid-column:1/-1;order:3}
  .lz-themen small{display:none}
  .lz-kinder li{flex-wrap:wrap}
  .statcard{padding:16px}
  .lz-tab th,.lz-tab td{padding:7px 8px}
}
/* ---------- Lehrerbereich im Stil der Verwaltung ---------- */
body.lz-admin{background:#f5f3fb!important;--lza-fl:#fff;--lza-tx:#1d1b2e;--lza-mu:#6b6880;--lza-li:#e2def0;--lza-ak:#5b45e8;--lza-ok:#1d7a3a;--lza-wa:#a86400;--lza-fe:#b3261e;--lza-zb:#fafafb}
body.lz-admin #himmel,body.lz-admin #alpen,body.lz-admin #flocken,body.lz-admin #pattern,body.lz-admin #eventlayer,body.lz-admin #clouds,body.lz-admin .topbar,body.lz-admin #epTabs,body.lz-admin .eplegal,body.lz-admin .ap-kz,body.lz-admin .st-kids,body.lz-admin .pkonfetti{display:none!important}
body.lz-admin .wrap,body.lz-admin #app{max-width:none!important;width:100%!important;padding:0!important;margin:0!important}
body.lz-admin,body.ep-app.lz-admin{padding:0!important}
.lza{min-height:100vh;color:var(--lza-tx);font:14px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:left}
.lza-kopf{display:flex;align-items:center;gap:16px;flex-wrap:wrap;padding:8px 16px;padding-top:calc(8px + env(safe-area-inset-top));background:var(--lza-fl);box-shadow:0 1px 0 var(--lza-li);position:sticky;top:0;z-index:20;min-height:48px}
.lza-kopf::before{content:"";position:absolute;left:0;right:0;top:0;height:3px;background:linear-gradient(135deg,#8A3FE0,#3D5AFE)}
.lza-marke{display:flex;align-items:center;gap:8px;border:0;background:none;padding:0;cursor:pointer;color:inherit;font:inherit}
.lza-marke b{font:700 16px "Bricolage Grotesque",system-ui,sans-serif}
.lza-status{margin-left:auto;display:flex;gap:12px;align-items:center;font-size:12px;color:var(--lza-mu);flex-wrap:wrap}
.lza-rahmen{display:grid;grid-template-columns:200px minmax(0,1fr);min-height:calc(100vh - 48px)}
.lza-nav{display:flex;flex-direction:column;gap:2px;padding:12px 8px;background:var(--lza-fl);border-right:1px solid var(--lza-li);position:sticky;top:48px;height:calc(100vh - 48px);overflow:auto}
.lza-nav button{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:0;background:none;border:0;border-radius:6px;padding:7px 10px;color:var(--lza-tx);font:inherit;cursor:pointer;text-align:left}
.lza-nav button small{color:var(--lza-mu);font-size:11px}
.lza-nav button:hover{background:#f5f3fb}
.lza-nav button.an{background:linear-gradient(90deg,rgba(138,63,224,.14),transparent);font-weight:600}
.lza-nav button.an::before{content:"";position:absolute;left:0;top:6px;bottom:6px;width:3px;border-radius:3px;background:linear-gradient(#8A3FE0,#3D5AFE)}
.lza-zahl{font-style:normal;font-size:11px;background:var(--lza-wa);color:#fff;border-radius:9px;padding:0 6px;margin-left:4px}
.lza-inhalt{padding:16px 22px 40px;max-width:1300px;width:100%;box-sizing:border-box;min-width:0}
@media (max-width:800px){.lza-rahmen{grid-template-columns:1fr;grid-template-rows:auto 1fr;align-content:start}.lza-nav{align-self:start;align-items:center}.lza-nav button.an::before{top:auto;bottom:0;left:10px;right:10px;width:auto;height:3px}.lza-nav{position:static;height:auto;flex-direction:row;overflow-x:auto;border-right:0;border-bottom:1px solid var(--lza-li);padding:6px}.lza-nav button{flex:none}.lza-nav button small{display:none}.lza-inhalt{padding:12px 12px 32px}.lza-status span{display:none}}
.lza .crumbs{display:flex;flex-wrap:wrap;gap:4px;align-items:center;margin:0 0 6px;padding:0;background:none;border:0;box-shadow:none;font-size:12px}
.lza .crumbs .crumb{background:none!important;border:0!important;box-shadow:none!important;padding:0!important;color:var(--lza-ak)!important;font:inherit!important;min-height:0!important;cursor:pointer}
.lza .crumbs .crumb.cur{color:var(--lza-mu)!important;cursor:default}
.lza .crumbs .sep{color:var(--lza-mu)}
.lza .bhead{display:block!important;margin:0 0 2px!important;padding:0!important;background:none!important;text-align:left!important}
.lza .bhead .emo{display:none!important}
.lza .bhead h1{font:800 22px "Bricolage Grotesque",system-ui,sans-serif!important;margin:0!important;color:var(--lza-tx)!important;text-shadow:none!important;letter-spacing:-.01em}
.lza .bdesc{color:var(--lza-mu)!important;margin:0 0 14px!important;font-size:14px!important;text-align:left!important;max-width:80ch}
.lza .statcard,.lza details.bibthema,.lza .lz-neu{background:var(--lza-fl)!important;border:1px solid var(--lza-li)!important;border-radius:10px!important;box-shadow:none!important;padding:14px 16px!important;margin:0 0 14px!important;color:var(--lza-tx)!important}
.lza .statcard h2{font:600 15px system-ui,sans-serif!important;margin:0 0 10px!important;color:var(--lza-tx)!important;display:flex;align-items:center;gap:8px}
.lza .statcard h2::before{content:"";width:14px;height:4px;border-radius:2px;background:linear-gradient(135deg,#8A3FE0,#3D5AFE);flex:none}
.lza .lz-zahl{background:#f0edfa;color:var(--lza-tx);border-radius:9px;padding:0 7px;font-size:12px}
.lza .help,.lza .lza-mu{color:var(--lza-mu)!important}
.lza .help{font-size:13px}
.lza .empty{color:var(--lza-mu);font-style:italic;text-align:left;padding:8px 0;background:none;border:0}
.lza .err{color:var(--lza-fe)}
.lza .big{background:var(--lza-fl)!important;color:var(--lza-tx)!important;border:1px solid var(--lza-li)!important;border-radius:6px!important;box-shadow:none!important;padding:7px 12px!important;font:600 13.5px system-ui,sans-serif!important;min-height:0!important;width:auto!important;transform:none!important;text-shadow:none!important;cursor:pointer}
.lza .big:hover{border-color:var(--lza-mu)!important}
.lza .big:not(.alt){background:var(--lza-ak)!important;border-color:var(--lza-ak)!important;color:#fff!important}
.lza .big.lz-gefahr{color:var(--lza-fe)!important;background:var(--lza-fl)!important}
.lza .big:disabled{opacity:.45;cursor:default}
.lza .row{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-start!important;margin:10px 0}
.lza .sel,.lza input[type=text],.lza input[type=search],.lza input[type=number],.lza input:not([type]),.lza select,.lza textarea{background:var(--lza-fl)!important;border:1px solid var(--lza-li)!important;border-radius:5px!important;padding:6px 8px!important;font:14px system-ui,sans-serif!important;color:var(--lza-tx)!important;min-height:0!important;box-shadow:none!important;width:auto;max-width:100%}
.lza .lz-form .sel,.lza textarea{width:100%!important;box-sizing:border-box}
.lza .lz-form label,.lza .lz-lbl{font-size:12px;color:var(--lza-mu);font-weight:600;margin-top:6px;display:block}
.lza .segs{display:inline-flex!important;flex-wrap:wrap;gap:0!important;background:none!important;border:1px solid var(--lza-li)!important;border-radius:6px!important;padding:0!important;overflow:hidden;margin:4px 0 8px!important;width:auto!important}
.lza .seg{border:0!important;border-right:1px solid var(--lza-li)!important;border-radius:0!important;background:var(--lza-fl)!important;padding:6px 12px!important;box-shadow:none!important;color:var(--lza-tx)!important;font:500 13px system-ui,sans-serif!important;min-height:0!important;transform:none!important}
.lza .seg:last-child{border-right:0!important}
.lza .seg[aria-pressed="true"]{background:var(--lza-ak)!important;color:#fff!important}
.lza .mtlist{display:flex;flex-direction:column;gap:0;border:1px solid var(--lza-li);border-radius:8px;overflow:hidden}
.lza .mtitem{display:flex!important;flex-direction:column;align-items:flex-start;gap:2px;background:var(--lza-fl)!important;border:0!important;border-bottom:1px solid var(--lza-li)!important;border-radius:0!important;box-shadow:none!important;padding:8px 12px!important;text-align:left;color:var(--lza-tx)!important;transform:none!important;width:100%;cursor:pointer;font:inherit}
.lza .mtitem:last-child{border-bottom:0!important}
.lza .mtitem:hover{background:var(--lza-zb)!important}
.lza .mtitem b{font-weight:600;font-size:14px}.lza .mtitem span{font-size:12px;color:var(--lza-mu)}
.lza .lz-tabwrap{overflow-x:auto;border-radius:10px;box-shadow:0 0 0 1px var(--lza-li);background:var(--lza-fl);margin:0 0 12px}
.lza .lz-tab{width:100%;border-collapse:collapse;background:var(--lza-fl);font-variant-numeric:tabular-nums;font-size:13.5px}
.lza .lz-tab th,.lza .lz-tab td{text-align:left;padding:6px 9px!important;border-bottom:1px solid var(--lza-li);vertical-align:top}
.lza .lz-tab thead th{font-size:12px;color:var(--lza-mu);font-weight:600;background:var(--lza-zb)}
.lza .lz-tab .r{text-align:right}
.lza .lz-th{background:none;border:0;padding:0;color:var(--lza-ak);font:inherit;font-weight:600;cursor:pointer;text-align:left}
.lza .lz-hinweis{background:var(--lza-fl)!important;border:0!important;border-left:3px solid var(--lza-wa)!important;border-radius:0!important;padding:8px 12px!important;font-size:13px!important}
.lza .lz-mini{background:var(--lza-fl)!important;border:1px solid var(--lza-li)!important;border-radius:5px!important;padding:3px 7px!important;cursor:pointer;font-size:12px!important;margin-left:4px;box-shadow:none!important;width:auto!important;height:auto!important;min-width:0!important;min-height:0!important;display:inline-flex!important;align-items:center}
.lza .lz-fehler li,.lza .lz-themen li{background:var(--lza-fl)!important;border:1px solid var(--lza-li)!important;border-radius:8px!important;box-shadow:none!important}
.lza .lz-fehler .ans-bad,.lza .lz-fehler .ans-ok{font-size:13px}
.lza details.bibthema summary{padding:0!important;background:none!important;box-shadow:none!important;border:0!important}
.lza .lza-korbtn.offen{border-color:var(--lza-wa);color:var(--lza-wa);font-weight:600}
.lza .lz-sel li{background:var(--lza-fl)!important;border:1px solid var(--lza-li)!important;border-radius:6px!important;box-shadow:none!important}
.lza .lza-sel li{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}
.lza .lza-sel li.lza-bearb{display:block}
.lza .lza-sel li{padding:8px 10px!important}
.lza .lza-sel li>span:first-child{display:block;flex:1 1 auto;min-width:0;width:auto!important}
.lza .lza-sel li>span:first-child small{color:var(--lza-mu);font-size:12px}
.lza .lz-sel small{color:var(--lza-mu)}
.lza .lza-selakt{display:flex;flex:none;width:auto!important}
.lza .suchliste .sq{background:var(--lza-fl)!important;border:1px solid var(--lza-li)!important;border-radius:6px!important;box-shadow:none!important}
.lza .lz-chip{background:#f0edfa!important;border:1px solid var(--lza-li)!important;color:var(--lza-tx)!important;box-shadow:none!important;border-radius:9px!important}
.lza .lz-codegross{font:700 30px ui-monospace,monospace!important;letter-spacing:.15em;color:var(--lza-tx)!important;background:var(--lza-zb)!important;border:1px dashed var(--lza-li)!important;box-shadow:none!important}
.lza .lz-n.gut{color:var(--lza-ok)}.lza .lz-n.tief{color:var(--lza-fe)}
.lza .lz-kpis>div{background:var(--lza-zb)!important;border:1px solid var(--lza-li)!important;box-shadow:none!important;border-radius:8px!important}
.lza .lz-kpis b{color:var(--lza-tx)!important}
.lza .lz-bar{background:var(--lza-zb)!important}.lza .lz-bar i{background:var(--lza-ak)!important}
.lza .lz-chips.lz-mitte{justify-content:flex-start}
.lza .lza-leiste{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:0 0 12px}
.lza .lza-rechts{margin-left:auto}
.lza .lza-k{background:var(--lza-fl);border:1px solid var(--lza-li);border-radius:5px;padding:6px 11px;cursor:pointer;font:13px system-ui,sans-serif;color:var(--lza-tx)}
.lza .lza-k:hover{border-color:var(--lza-mu)}
.lza .lza-k.p{background:var(--lza-ak);border-color:var(--lza-ak);color:#fff}
.lza .lza-k.g{color:var(--lza-fe);border-color:#e9c6c3}
.lza .lza-k.klein{padding:3px 8px;font-size:12px}
.lza .lza-k.an{background:#e9e4ff;border-color:var(--lza-ak);color:var(--lza-ak)}
.lza .lza-k:disabled{opacity:.45;cursor:default}
.lza-kopf .lza-k{background:var(--lza-fl);border:1px solid var(--lza-li);border-radius:5px;padding:5px 10px;cursor:pointer;font:13px system-ui,sans-serif;color:var(--lza-tx)}
.lza .lza-ok{color:var(--lza-ok)}.lza .lza-wa{color:var(--lza-wa)}.lza .lza-fe{color:var(--lza-fe)}
.lza .nowrap{white-space:nowrap}
.lza .lza-antw{margin:4px 0 0;padding-left:18px;font-size:13px;color:var(--lza-mu)}
.lza .lza-antw li.ok{color:var(--lza-ok);font-weight:600}
.lza .lza-erkl{font-size:12px;margin:4px 0 0}
.lza .lza-akt{white-space:nowrap}.lza .lza-akt .lza-k{display:block;width:100%;margin:0 0 4px}
.lza .lza-fragen td,.lza .lz-tab td{white-space:normal!important}.lza .lza-fragen td:nth-child(2){min-width:280px}.lza .lza-fragen td:nth-child(3){min-width:120px}.lza .lza-fragen td:last-child{width:110px}.lza .lz-tab td.nowrap{white-space:nowrap!important}
.lza .lza-seiten{display:flex;gap:8px;align-items:center;margin:0 0 10px;font-size:13px;color:var(--lza-mu)}
.lza .lza-fuss{position:sticky;bottom:0;display:flex;gap:12px;align-items:center;justify-content:space-between;background:var(--lza-fl);border-top:2px solid var(--lza-ak);padding:8px 14px;margin:0 -22px -40px}
.lza .lza-klick{cursor:pointer}.lza .lza-klick:hover td{background:var(--lza-zb)}
.lza .lza-kap{background:var(--lza-fl);border:1px solid var(--lza-li);border-radius:8px;margin:0 0 6px}
.lza .lza-kap summary{display:flex;justify-content:space-between;gap:8px;padding:8px 12px;cursor:pointer}
.lza .lza-seitenliste{columns:3 220px;margin:0;padding:4px 12px 10px 28px;font-size:13px}
.lza .lza-seitenliste button{background:none;border:0;padding:1px 0;color:var(--lza-ak);cursor:pointer;font:inherit;text-align:left}
.lza .lza-lib{background:var(--lza-fl);border:1px solid var(--lza-li);border-radius:10px;padding:14px}
.lza .lza-lib .buchseite,.lza .lza-lib .libart{box-shadow:none!important;border-radius:6px!important}
.lza .lza-korr td{background:#fbfaff}
.lza .lza-korbox{display:flex;flex-direction:column;gap:10px;padding:6px 0}
.lza .lza-korf{border:1px solid var(--lza-li);border-radius:6px;padding:8px 10px;background:var(--lza-fl)}
.lza .lza-korf p{margin:0 0 4px}
.lza .lza-korant{background:var(--lza-zb);border-left:3px solid var(--lza-ak);padding:6px 8px;white-space:pre-wrap}
.lza .lza-korf input{width:70px!important}
.lza .lz-schalter{display:flex;gap:8px;align-items:flex-start;font-size:13px;margin:4px 0 10px}
.lza-dlg{border:1px solid #e2def0;border-radius:8px;max-width:520px;width:calc(100% - 32px);font:14px system-ui,sans-serif;color:#1d1b2e}
.lza-dlg::backdrop{background:rgba(0,0,0,.35)}
.lza-dlg form{display:flex;flex-direction:column;gap:6px}
.lza-dlg h2{font:700 17px "Bricolage Grotesque",system-ui,sans-serif;margin:0}
.lza-dlg label{font-size:12px;color:#6b6880;font-weight:600;margin-top:6px}
.lza-dlg select,.lza-dlg textarea{border:1px solid #e2def0;border-radius:5px;padding:6px 8px;font:inherit;width:100%;box-sizing:border-box}
.lza-dlg .lza-leiste{display:flex;gap:8px;justify-content:flex-end;margin-top:10px}
.lza-dlg .lza-k{background:#fff;border:1px solid #e2def0;border-radius:5px;padding:6px 12px;cursor:pointer;font:inherit}
.lza-dlg .lza-k.p{background:#5b45e8;border-color:#5b45e8;color:#fff}
.lza-dlg .lza-mu{color:#6b6880;margin:0}
.lza .authbox{max-width:440px;margin:30px auto!important;background:var(--lza-fl)!important;border:1px solid var(--lza-li)!important;border-radius:10px!important;box-shadow:none!important;padding:24px!important;text-align:left!important}
.lza .authbox .authicon{display:none!important}
.lza .authbox h1{font:800 20px "Bricolage Grotesque",system-ui,sans-serif!important;color:var(--lza-tx)!important;margin:0 0 6px!important}
.lza .authbox p{color:var(--lza-mu)!important;font-size:14px!important}
.lza .authbox .big{width:100%!important;margin:4px 0!important}
.lza .lz-link{color:var(--lza-ak)!important}
.lza .lwait{color:var(--lza-mu)}
.lza .lz-kb{border:1px solid var(--lza-li)!important;border-radius:6px!important;box-shadow:none!important;padding:6px 10px!important;background:var(--lza-fl)!important;display:flex;gap:8px;align-items:center}
.lza .lz-erstellen{position:sticky;bottom:0;background:var(--lza-fl)!important;border:1px solid var(--lza-li)!important;border-radius:10px!important;box-shadow:0 -4px 12px rgba(40,20,90,.06)!important;padding:10px 14px!important;z-index:3}
.lz-kidbild{height:150px;width:auto;display:block;margin:0 auto 6px;filter:drop-shadow(0 10px 16px rgba(40,30,120,.25))}
@media (max-width:520px){.lz-kidbild{height:110px}}
/* Klassen-Liga */
.lzl-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.lzl-online{display:flex;gap:14px;align-items:flex-start;background:linear-gradient(135deg,#5B45E8,#8A3FE0);color:#fff;border-radius:22px;padding:16px 18px;margin:0 0 14px;box-shadow:0 10px 24px rgba(70,40,160,.22)}
.lzl-online b{font-size:16px;display:block;margin-bottom:4px}
.lzl-online p{margin:0;color:#fff;opacity:.95;line-height:1.5}
.lzl-onicon{font-size:30px;line-height:1}
.lzl-bspband{display:inline-block;background:rgba(15,20,48,.78);color:#fff;border-radius:999px;padding:4px 12px;font-size:12.5px;font-weight:600;margin:0 0 10px}
.lzl-filter{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;margin:0 0 12px}
.lzl-filter .segs{margin:0!important}
.lzl-kt{display:flex;gap:8px;align-items:center;font-size:13px;font-weight:600}
.lzl-kt select{min-width:170px}
.lzl-liste{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.lzl-karte{position:relative;display:grid;grid-template-columns:52px minmax(0,1fr) auto;gap:12px;align-items:center;padding:12px 16px;border-radius:20px;color:#fff;
  background:linear-gradient(135deg,#4A3BD1,#7B3FD8);box-shadow:0 6px 16px rgba(60,40,150,.18)}
.lzl-karte.lzl-p1{background:linear-gradient(135deg,#9A5B00,#C27C0E)}
.lzl-karte.lzl-p2{background:linear-gradient(135deg,#4F5B6B,#76839A)}
.lzl-karte.lzl-p3{background:linear-gradient(135deg,#86411C,#A85A2E)}
.lzl-karte.lzl-eigen{outline:4px solid #FF4FA3;outline-offset:2px;box-shadow:0 8px 22px rgba(255,79,163,.35)}
.lzl-platz{width:46px;height:46px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.18);font:800 20px "Fredoka",system-ui,sans-serif;color:#fff}
.lzl-p1 .lzl-platz,.lzl-p2 .lzl-platz,.lzl-p3 .lzl-platz{font-size:28px;background:rgba(255,255,255,.22)}
.lzl-mitte{display:flex;flex-direction:column;gap:3px;min-width:0}
.lzl-name{font-size:15.5px;font-weight:700;overflow-wrap:anywhere;color:#fff}
.lzl-mitte small{color:#fff;opacity:.9;font-size:12.5px}
.lzl-pills{display:flex;flex-wrap:wrap;gap:4px}
.lzl-pills:empty{display:none}
.lzl-pill{font-style:normal;font-size:11.5px;font-weight:700;background:rgba(15,20,48,.4);color:#fff;border-radius:999px;padding:1px 9px}
.lzl-eigen .lzl-pill:first-child{background:#FF4FA3}
.lzl-bar{display:block;height:8px;border-radius:999px;background:rgba(255,255,255,.25);overflow:hidden;margin-top:3px;max-width:340px}
.lzl-bar i{display:block;height:100%;border-radius:999px;background:#fff}
.lzl-pkt{text-align:right;display:flex;flex-direction:column;align-items:flex-end}
.lzl-pkt b{font:800 24px "Fredoka",system-ui,sans-serif;color:#fff;line-height:1.1;font-variant-numeric:tabular-nums}
.lzl-pkt small{font-size:11.5px;color:#fff;opacity:.9;white-space:nowrap}
.lzl-luecke{text-align:center;color:var(--lza-mu,#6b6880);font-size:18px;line-height:1}
.lzl-regeln{background:var(--lza-fl,#fff);border:1px solid var(--lza-li,#e2def0);border-radius:10px;padding:10px 16px;margin:0 0 14px;font-size:13.5px}
.lzl-regeln summary{cursor:pointer;font-weight:600;min-height:32px;display:flex;align-items:center}
.lzl-regeln ul{margin:6px 0 4px;padding-left:20px;display:grid;gap:4px}
.lzl-meine{list-style:none;margin:0;padding:0;border:1px solid var(--lza-li,#e2def0);border-radius:8px;overflow:hidden}
.lzl-meine>li{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;justify-content:space-between;padding:9px 12px;border-bottom:1px solid var(--lza-li,#e2def0)}
.lzl-meine>li:last-child{border-bottom:0}
.lzl-meine>li>span:first-child{display:flex;flex-direction:column;min-width:0;flex:1 1 240px}
.lzl-meine small{color:var(--lza-mu,#6b6880);font-size:12.5px}
.lzl-akt{display:flex;gap:6px;flex-wrap:wrap}
.lzl-form{flex:1 1 100%;max-width:520px}
.lzl-info{background:#e8f6ec;border-left:3px solid #1d7a3a;padding:8px 12px;margin:0 0 12px;font-size:13px}
.lzl-kind{display:flex;gap:14px;align-items:center;background:linear-gradient(135deg,#5B45E8,#C2338A);color:#fff;border-radius:24px;padding:14px 18px;margin:14px 0;box-shadow:0 10px 24px rgba(90,40,160,.25);text-align:left}
.lzl-kind.lzl-bsp{background:linear-gradient(135deg,#4A3BD1,#B0307E)}
.lzl-kindbild{width:96px;height:auto;flex:none;filter:drop-shadow(0 6px 10px rgba(0,0,0,.2))}
.lzl-kindtext{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1}
.lzl-kindtext small{font-size:12.5px;font-weight:600;color:#fff;opacity:.92}
.lzl-kindtext b{font-size:16px;color:#fff;overflow-wrap:anywhere}
.lzl-gross{font:800 24px "Fredoka",system-ui,sans-serif;color:#fff;line-height:1.15}
.lzl-sub{font-size:13.5px;color:#fff;line-height:1.4}
.lzl-bar.hell{height:12px;max-width:none;margin:4px 0}
.lzl-weg{margin:-6px 0 12px;text-align:center;font-size:13px}
.lzl-weg .lz-link{display:inline-block;background:rgba(15,20,48,.55)!important;color:#fff!important;border-radius:999px;padding:5px 14px;text-decoration:none;font-weight:600;min-height:32px}
@media (max-width:520px){
  .lzl-karte{grid-template-columns:40px minmax(0,1fr);gap:4px 10px;padding:10px 12px}
  .lzl-platz{width:38px;height:38px;font-size:17px}
  .lzl-p1 .lzl-platz,.lzl-p2 .lzl-platz,.lzl-p3 .lzl-platz{font-size:22px}
  .lzl-pkt{grid-column:2;flex-direction:row;align-items:baseline;gap:6px;justify-content:flex-start}
  .lzl-pkt b{font-size:19px}
  .lzl-kind{padding:12px 14px;gap:10px}
  .lzl-kindbild{width:70px}
  .lzl-gross{font-size:20px}
  .lzl-kt{flex:1 1 100%}.lzl-kt select{flex:1;min-width:0}
}
.lzl-karte :focus-visible,.lzl-meine :focus-visible,.lzl-filter :focus-visible{outline:3px solid #FF4FA3;outline-offset:2px}
/* Kinder: offene Frage */
.lz-offenlbl{display:block;font-weight:700;margin:6px 0 6px}
.lz-offen{width:100%;box-sizing:border-box;min-height:110px;font:500 1.05rem/1.5 "Lexend",system-ui,sans-serif!important;font-style:normal!important;color:var(--ink,#1B2240)!important;text-align:left!important;padding:12px 14px;border-radius:16px;resize:vertical}
.rev.r-offen{border-left:4px solid #8A3FE0}

`;
const st=document.createElement("style"); st.id="lehrer-css"; st.textContent=css; document.head.appendChild(st);

window.EP_LEHRER = {version:VERSION, note, fmtNote, lp21Vorschlag, LP21, SCHULJAHRE, speicher, pdfTest, pdfPins, pdfText, fehlerAnalyse, wochenSchnitt, _LZ:LZ};
})();
