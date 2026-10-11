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
const VERSION = "1.0.0";
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
  alltag:[["NMG.10","NMG.1"],["WAH.5","ERG.5"]], sprache:[["D.5","D.6"],["D.5","D.6"]], fremdsprachen:[["FS1E.5","FS2F.5"],["FS1E.5","FS2F.5"]],
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
function neuerPin(belegt){ const set=new Set(belegt||[]); for(let i=0;i<500;i++){ const p=String(1000+zufallInt(9000)); if(!set.has(p)) return p; } return String(10000+zufallInt(90000)); }
async function hashHex(s){
  try{ if(crypto?.subtle){ const d=await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)); return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,"0")).join("").slice(0,24); } }catch(e){}
  let x=2166136261, y=5381; for(const c of s){ x^=c.charCodeAt(0); x=Math.imul(x,16777619); y=(Math.imul(y,33)^c.charCodeAt(0))>>>0; }
  return (x>>>0).toString(16).padStart(8,"0")+y.toString(16).padStart(8,"0");
}
const pinHash = (code,pin) => hashHex(`easyplay|${normCode(code)}|${normPin(pin)}`);
const datum = d => { try{ return new Date(d).toLocaleDateString("de-CH"); }catch(e){ return ""; } };
const zeit = ms => typeof fmtZeit==="function" ? fmtZeit(ms) : `${Math.round((ms||0)/1000)} s`;
const plain = o => JSON.parse(JSON.stringify(o));
function alleFr(){ try{ if(typeof alleFragen==="function") return alleFragen(); }catch(e){} return typeof FRAGEN!=="undefined" ? FRAGEN : []; }
function fNr(f){ try{ if(typeof frageNr==="function") return frageNr(f)||0; }catch(e){} return +f.nr||0; }
function fKey(f){ try{ if(typeof qid==="function") return qid(f); }catch(e){} let x=2166136261; for(const c of String(f.q)){ x^=c.charCodeAt(0); x=Math.imul(x,16777619); } return (x>>>0).toString(36); }
const themaName = id => (typeof THEMA!=="undefined" && THEMA[id]?.name) || (String(id).startsWith("kt_") ? "Kanton "+String(id).slice(3) : String(id||""));
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
function bewerte(fragen, antworten){
  let p=0; fragen.forEach((f,i)=>{ if(antworten[i]!=null && +antworten[i]===+f.r) p++; });
  return {punkte:p, max:fragen.length, note:note(p, fragen.length), loesung:fragen.map(f=>({r:+f.r, e:f.e||""}))};
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

/* ---------- c) lokal (localStorage, gemeinsames Gerät) ---------- */
function lokalSpeicher(){
  const lese = () => { const d=lsGet(LS_DATEN,null)||{}; return {klassen:Array.isArray(d.klassen)?d.klassen:[], tests:Array.isArray(d.tests)?d.tests:[], abgaben:Array.isArray(d.abgaben)?d.abgaben:[]}; };
  const schreibe = d => { if(!lsSet(LS_DATEN,d)) throw new Error("Speichern im Browser nicht möglich (privates Fenster oder Speicher voll)."); };
  const lid = () => { const p=S.profil; if(!p) return null; return p.email ? "m:"+String(p.email).toLowerCase() : (p.name ? "n:"+p.name : null); };
  return {
    art:"lokal",
    lehrerId: lid,
    istLehrer(){ const id=lid(); return !!(id && lsGet(LS_ROLLE,{})[id]); },
    async rolleSetzen(){ const id=lid(); if(!id) return; const r=lsGet(LS_ROLLE,{}); r[id]=true; lsSet(LS_ROLLE,r); },
    async klassen(){ const id=lid(); return lese().klassen.filter(k=>k.lehrer===id); },
    async klasseSpeichern(k){ const d=lese(); const x={...plain(k), lehrer:lid()}; const i=d.klassen.findIndex(y=>y.id===k.id); if(i>=0) d.klassen[i]=x; else d.klassen.push(x);
      const sids=new Set((k.schueler||[]).map(s=>s.id)); const codes=new Set(d.tests.filter(t=>t.klasseId===k.id).map(t=>t.code));
      d.abgaben=d.abgaben.filter(a=>!codes.has(a.code) || sids.has(a.sid)); schreibe(d); return x; },
    async klasseLoeschen(id){ const d=lese(); const codes=new Set(d.tests.filter(t=>t.klasseId===id).map(t=>t.code));
      d.klassen=d.klassen.filter(k=>k.id!==id); d.tests=d.tests.filter(t=>t.klasseId!==id); d.abgaben=d.abgaben.filter(a=>!codes.has(a.code)); schreibe(d); },
    async tests(){ const id=lid(); return lese().tests.filter(t=>t.lehrer===id); },
    async codeFrei(code){ return !lese().tests.some(t=>t.code===code); },
    async testSpeichern(t){ const d=lese(); const x={...plain(t), lehrer:lid()}; const i=d.tests.findIndex(y=>y.code===t.code); if(i>=0) d.tests[i]=x; else d.tests.push(x); schreibe(d); return x; },
    async testLoeschen(code){ const d=lese(); d.tests=d.tests.filter(t=>t.code!==code); d.abgaben=d.abgaben.filter(a=>a.code!==code); schreibe(d); },
    async abgaben(){ const d=lese(); const codes=new Set(d.tests.filter(t=>t.lehrer===lid()).map(t=>t.code)); return d.abgaben.filter(a=>codes.has(a.code)); },
    async abgabeLoeschen(a){ const d=lese(); d.abgaben=d.abgaben.filter(x=>x.id!==a.id); schreibe(d); },
    async kidLaden(code, pin){
      const d=lese(); const t=d.tests.find(x=>x.code===normCode(code)); if(!t) return {fehler:"code"};
      const k=d.klassen.find(x=>x.id===t.klasseId); const s=(k?.schueler||[]).find(x=>x.pin===normPin(pin)); if(!s) return {fehler:"pin"};
      if(t.aktiv===false) return {fehler:"geschlossen"};
      return {test:{code:t.code, titel:t.titel, schuljahr:t.schuljahr, fragen:t.fragen.map(f=>({q:f.q, o:f.o, nr:f.nr, t:f.t, l:f.l}))}, kind:{id:s.id, name:s.name},
              schon:d.abgaben.some(a=>a.code===t.code && a.sid===s.id)};
    },
    async kidAbgeben(code, pin, antworten, dauer){
      const d=lese(); const t=d.tests.find(x=>x.code===normCode(code)); if(!t) return {fehler:"code"};
      const k=d.klassen.find(x=>x.id===t.klasseId); const s=(k?.schueler||[]).find(x=>x.pin===normPin(pin)); if(!s) return {fehler:"pin"};
      if(t.aktiv===false) return {fehler:"geschlossen"};
      if(d.abgaben.some(a=>a.code===t.code && a.sid===s.id)) return {fehler:"schon"};
      const ant=t.fragen.map((f,i)=>{ const v=antworten[i]; return (v===0||v===1||v===2||v===3) ? v : null; });
      const r=bewerte(t.fragen, ant);
      d.abgaben.push({id:neueId(), code:t.code, sid:s.id, name:s.name, antworten:ant, punkte:r.punkte, max:r.max, note:r.note, dauer:Math.max(0,Math.min(86400000,dauer|0)), datum:new Date().toISOString()});
      schreibe(d); return r;
    }
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
    istLehrer(){ const u=AUTH.user; if(!u) return false; return u.user_metadata?.rolle==="lehrperson" || !!lsGet(LS_ROLLE,{})["s:"+u.id]; },
    async rolleSetzen(){ const u=AUTH.user; if(!u) return; const r=lsGet(LS_ROLLE,{}); r["s:"+u.id]=true; lsSet(LS_ROLLE,r);
      try{ const res=await sb().auth.updateUser({data:{rolle:"lehrperson"}}); if(res?.data?.user) AUTH.user=res.data.user; }catch(e){} },
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
    async abgaben(){ return chk(await sb().from("lehrer_abgaben").select("id,test_code,schueler_id,name,antworten,punkte,max,note,dauer_ms,abgegeben").order("abgegeben"))
      .map(a=>({id:a.id, code:a.test_code, sid:a.schueler_id, name:a.name, antworten:a.antworten||[], punkte:a.punkte, max:a.max, note:+a.note, dauer:a.dauer_ms, datum:a.abgegeben})); },
    async abgabeLoeschen(a){ chk(await sb().from("lehrer_abgaben").delete().eq("id",a.id)); },
    async kidLaden(code, pin){ const r=await sb().rpc("test_laden",{test_code:normCode(code), pin:normPin(pin)}); if(r.error) throw new Error(r.error.message); return r.data||{fehler:"code"}; },
    async kidAbgeben(code, pin, antworten, dauer){ const r=await sb().rpc("abgabe_einreichen",{test_code:normCode(code), pin:normPin(pin), antworten, dauer_ms:Math.max(0,dauer|0)}); if(r.error) throw new Error(r.error.message);
      const d=r.data||{fehler:"daten"}; if(d.note!=null) d.note=+d.note; return d; }
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
    async kidLaden(code, pin){
      const r=await kidFinden(code, pin); if(r.fehler) return r;
      return {test:{code:r.t.code||normCode(code), titel:r.t.titel, schuljahr:r.t.schuljahr, fragen:r.t.fragen.map(f=>({q:f.q, o:f.o, nr:f.nr, t:f.t, l:f.l}))}, kind:{id:r.s.sid, name:r.s.name}, schon:r.schon};
    },
    async kidAbgeben(code, pin, antworten, dauer){
      const r=await kidFinden(code, pin); if(r.fehler) return r; if(r.schon) return {fehler:"schon"};
      const ant=r.t.fragen.map((f,i)=>{ const v=antworten[i]; return (v===0||v===1||v===2||v===3) ? v : null; });
      const b=bewerte(r.t.fragen, ant);
      const eintrag={name:r.s.name, antworten:ant, punkte:b.punkte, max:b.max, note:b.note, dauer:Math.max(0,Math.min(86400000,dauer|0)), datum:new Date().toISOString()};
      if(r.vorh.exists) await r.ref.update({eintraege:{[r.s.sid]:eintrag}}); else await r.ref.set({lehrer:r.t.lehrer, code:normCode(code), eintraege:{[r.s.sid]:eintrag}});
      const kopf=db.doc(`abgaben/${uid}`); const ks=await kopf.get();
      if(ks.exists) await kopf.update({codes:{[normCode(code)]:true}, zuletzt:eintrag.datum}); else await kopf.set({codes:{[normCode(code)]:true}, zuletzt:eintrag.datum});
      return b;
    }
  };
}

/* ================= 4. Auswertung ================= */
// pro Kind und Test nur die erste Abgabe
function abgabenEindeutig(list){ const seen=new Set(); return [...list].sort((a,b)=>String(a.datum).localeCompare(String(b.datum))).filter(a=>{ const k=a.code+"|"+a.sid; if(seen.has(k)) return false; seen.add(k); return true; }); }
function fehlerAnalyse(tests, abgaben, sid){
  const tm={}; tests.forEach(t=>tm[t.code]=t); const map=new Map();
  abgaben.filter(a=>!sid || a.sid===sid).forEach(a=>{ const t=tm[a.code]; if(!t) return;
    t.fragen.forEach((f,i)=>{ const key=f.nr ? "n"+f.nr : f.q; let st=map.get(key); if(!st){ st={f, n:0, falsch:0, wahl:{}, tests:new Set()}; map.set(key,st); }
      st.n++; st.tests.add(t.titel); const x=a.antworten?.[i];
      if(x==null || +x!==+f.r){ st.falsch++; const txt = x==null ? "(keine Antwort)" : (f.o[x] ?? "?"); st.wahl[txt]=(st.wahl[txt]||0)+1; if(sid) st.dein=txt; } });
  });
  return [...map.values()].map(st=>{ const top=Object.entries(st.wahl).sort((a,b)=>b[1]-a[1])[0]; return {...st, quote:st.n?st.falsch/st.n:0, top:top?{text:top[0], n:top[1]}:null}; })
    .sort((a,b)=>b.quote-a.quote || b.falsch-a.falsch || b.n-a.n);
}
function themenQuote(tests, abgaben, sid){
  const tm={}; tests.forEach(t=>tm[t.code]=t); const m={};
  abgaben.filter(a=>!sid || a.sid===sid).forEach(a=>{ const t=tm[a.code]; if(!t) return; t.fragen.forEach((f,i)=>{ const k=f.t||"?"; m[k]=m[k]||{t:k,n:0,falsch:0}; m[k].n++; const x=a.antworten?.[i]; if(x==null || +x!==+f.r) m[k].falsch++; }); });
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
  if(!JSPDF_P) JSPDF_P=new Promise((ok,err)=>{ const s=document.createElement("script"); s.src=JSPDF_URL; s.async=true;
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
async function pdfTest(t, klasse, loesung){
  const jsPDF=await ladeJsPDF();
  const doc=new jsPDF({unit:"mm", format:"a4", compress:true});
  const W=210, H=297, M=16, BR=W-2*M; let y=0;
  const art = loesung ? "Lösungsblatt" : "Arbeitsblatt";
  doc.setProperties({title:pdfText(`${t.titel}, ${art}`), subject:"easyplay", creator:"easyplay"});
  const farbe = c => { doc.setTextColor(...c); };
  const kopfKlein = () => { doc.setFillColor(...FARBE.blau); doc.rect(0,0,W,6,"F"); doc.setFillColor(...FARBE.lila); doc.rect(W*0.62,0,W*0.38,6,"F");
    doc.setFont("helvetica","bold"); doc.setFontSize(9); farbe(FARBE.grau); doc.text(pdfText(`${t.titel} · ${art}`), M, 13); y=20; };
  // Kopf
  doc.setFillColor(...FARBE.blau); doc.rect(0,0,W,26,"F"); doc.setFillColor(...FARBE.lila); doc.rect(W*0.62,0,W*0.38,26,"F");
  doc.setFont("helvetica","bold"); doc.setFontSize(22); farbe([255,255,255]); doc.text("easyplay", M, 16);
  doc.setFontSize(12); doc.setFont("helvetica","normal"); doc.text(pdfText(art), W-M, 16, {align:"right"});
  y=38; doc.setFont("helvetica","bold"); doc.setFontSize(17); farbe(FARBE.tinte);
  doc.splitTextToSize(pdfText(t.titel), BR).forEach(z=>{ doc.text(z, M, y); y+=7.5; });
  doc.setFont("helvetica","normal"); doc.setFontSize(10); farbe(FARBE.grau);
  const infos=[klasse?.name ? "Klasse: "+klasse.name : "", t.schuljahr ? sjName(t.schuljahr) : "", "Datum: "+new Date().toLocaleDateString("de-CH"), "Test-Code: "+t.code].filter(Boolean).join("   ·   ");
  doc.splitTextToSize(pdfText(infos), BR).forEach(z=>{ doc.text(z, M, y); y+=5; });
  if(t.lp21?.length){ doc.setFontSize(8.5); doc.splitTextToSize(pdfText("Lehrplan 21: "+t.lp21.map(lpLabel).join("; ")), BR).forEach(z=>{ doc.text(z, M, y); y+=4.2; }); }
  y+=3;
  if(!loesung){
    doc.setDrawColor(...FARBE.linie); doc.setFillColor(...FARBE.hell); doc.roundedRect(M, y, BR, 22, 3, 3, "FD");
    doc.setFont("helvetica","bold"); doc.setFontSize(11); farbe(FARBE.tinte);
    doc.text("Name:", M+5, y+9); doc.setDrawColor(...FARBE.grau); doc.setLineWidth(0.3); doc.line(M+19, y+9.5, M+BR*0.58, y+9.5);
    doc.text("Punkte:", M+BR*0.62, y+9); doc.line(M+BR*0.62+16, y+9.5, M+BR*0.62+30, y+9.5); doc.setFont("helvetica","normal"); doc.text(`/ ${t.fragen.length}`, M+BR*0.62+32, y+9);
    doc.setFont("helvetica","bold"); doc.text("Note:", M+BR*0.62+46, y+9); doc.line(M+BR*0.62+58, y+9.5, M+BR-4, y+9.5);
    doc.setFont("helvetica","normal"); doc.setFontSize(9); farbe(FARBE.grau);
    doc.text(pdfText("Kreuze bei jeder Frage genau eine Antwort an. Es ist immer nur eine Antwort richtig."), M+5, y+17);
    y+=30;
  } else {
    doc.setFont("helvetica","normal"); doc.setFontSize(9.5); farbe(FARBE.grau);
    doc.text(pdfText(`Richtige Antworten sind grün markiert. Note = 5 × Punkte / ${t.fragen.length} + 1, auf halbe Noten gerundet.`), M, y+2); y+=9;
  }
  const BUCH="abcd"; const tx=M+11, tw=BR-11;
  t.fragen.forEach((f,i)=>{
    doc.setFont("helvetica","bold"); doc.setFontSize(11);
    const qz=doc.splitTextToSize(pdfText(f.q), tw);
    doc.setFontSize(10.5);
    // Breite immer fett messen, damit die markierte Lösung nicht in die zweite Spalte ragt
    doc.setFont("helvetica","bold");
    const kurz=f.o.every(o=>doc.getTextWidth(pdfText(o))<(tw/2-18));
    const oz=f.o.map((o,j)=>{ doc.setFont("helvetica", loesung && j===+f.r ? "bold" : "normal"); return doc.splitTextToSize(pdfText(o), kurz ? tw/2-16 : tw-12); });
    doc.setFont("helvetica","normal");
    let ez=[]; if(loesung && f.e){ doc.setFontSize(9); ez=doc.splitTextToSize(pdfText("Erklärung: "+f.e), tw); }
    const optH = kurz ? Math.max(oz[0].length,oz[1].length)*5+Math.max(oz[2].length,oz[3].length)*5+4 : oz.reduce((s,z)=>s+z.length*5+1.6,0);
    const hoehe = qz.length*5.4 + 3 + optH + (ez.length ? ez.length*4.3+3 : 0) + 6;
    if(y+hoehe > H-16){ doc.addPage(); kopfKlein(); }
    // Nummer
    doc.setFillColor(...(loesung?FARBE.gruen:FARBE.blau)); doc.circle(M+4, y-1.4, 3.6, "F");
    doc.setFont("helvetica","bold"); doc.setFontSize(9.5); farbe([255,255,255]); doc.text(String(i+1), M+4, y, {align:"center"});
    doc.setFontSize(11); farbe(FARBE.tinte); qz.forEach(z=>{ doc.text(z, tx, y); y+=5.4; }); y+=1.5;
    doc.setFont("helvetica","normal"); doc.setFontSize(10.5);
    const box=(bx,by,ok)=>{ doc.setLineWidth(0.35); doc.setDrawColor(...(ok?FARBE.gruen:FARBE.grau));
      if(ok){ doc.setFillColor(...FARBE.gruen); doc.roundedRect(bx,by-3.4,4,4,0.6,0.6,"FD"); doc.setDrawColor(255,255,255); doc.setLineWidth(0.6); doc.line(bx+0.8,by-1.4,bx+1.7,by-0.4); doc.line(bx+1.7,by-0.4,bx+3.3,by-2.7); }
      else doc.roundedRect(bx,by-3.4,4,4,0.6,0.6,"S"); };
    const opt=(j,ox,oy,breite)=>{ const ok=loesung && j===+f.r; box(ox,oy,ok);
      doc.setFont("helvetica", ok?"bold":"normal"); farbe(ok?FARBE.gruen:FARBE.tinte); doc.text(BUCH[j]+")", ox+6, oy);
      let yy=oy; oz[j].forEach(z=>{ doc.text(z, ox+12, yy); yy+=5; }); return yy; };
    if(kurz){
      const c2=tx+tw/2; let y1=opt(0,tx,y,tw/2); let y2=opt(1,c2,y,tw/2); y=Math.max(y1,y2)+1.5;
      y1=opt(2,tx,y,tw/2); y2=opt(3,c2,y,tw/2); y=Math.max(y1,y2);
    } else { f.o.forEach((o,j)=>{ y=opt(j,tx,y,tw)+1.6; }); }
    if(ez.length){ y+=1.5; doc.setFont("helvetica","italic"); doc.setFontSize(9); farbe(FARBE.grau); ez.forEach(z=>{ doc.text(z, tx, y); y+=4.3; }); }
    y+=4; doc.setDrawColor(...FARBE.linie); doc.setLineWidth(0.2); doc.line(tx, y-2.5, M+BR, y-2.5); y+=3;
  });
  const n=doc.getNumberOfPages();
  for(let p=1;p<=n;p++){ doc.setPage(p); doc.setFont("helvetica","normal"); doc.setFontSize(8.5); farbe(FARBE.grau);
    doc.text(pdfText(`easyplay · ${t.titel} · Code ${t.code}`), M, H-8); doc.text(`Seite ${p} von ${n}`, W-M, H-8, {align:"right"}); }
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
    doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(...FARBE.grau); doc.text(pdfText("Startseite: «Test mit Code starten»"), x+cw-5, y+36, {align:"right"});
    i++; if(i%2){ x=M+cw+6; } else { x=M; y+=ch+6; }
  });
  return doc;
}

/* ================= 6. Seiten für Lehrpersonen ================= */
const LZ = { daten:null, lid:null, laedt:false, fehler:"", klasseId:null, testCode:null, kindId:null, neu:null, kid:null, offen:{} };
const app = () => $q("#app");
function rerender(){ if(SEITEN[S.screen]) render(); }
function setze(html){ const a=app(); if(a) a.innerHTML=html; bindLc(); }
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
    LZ.daten={klassen:k, tests:t, abgaben:abgabenEindeutig(a)}; LZ.lid=sp.lehrerId(); }
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
  $q("#lzIn") && ($q("#lzIn").onclick=()=>go("login"));
  $q("#lzReg") && ($q("#lzReg").onclick=()=>go("register"));
  $q("#lzZumCode").onclick=()=>{ LZ.kid=null; go("lcode"); };
}
function seiteRolle(){
  setze(`${lc([START], "Lehrerbereich")}
    <div class="authbox lz-box">
      <div class="authkopf"><span class="authicon">🎓</span><h1>Bist du Lehrperson?</h1>
      <p>Im Lehrerbereich legst du Klassen an, erstellst Tests mit Code, siehst die Resultate mit Noten und eine Fehleranalyse und druckst Arbeitsblätter.</p></div>
      <button class="big gold" id="lzRolle" type="button">🎓 Ich bin Lehrperson</button>
      <p class="help">Die Rolle wird in deinem Konto gespeichert. Kinder brauchen kein Konto: Sie lösen Tests nur mit Test-Code und PIN.</p>
      <p class="err" id="lzRolleErr" aria-live="polite"></p>
    </div>`);
  $q("#lzRolle").onclick=async()=>{ const b=$q("#lzRolle"); b.disabled=true; try{ await SP.rolleSetzen(); go("lehrer"); }catch(e){ $q("#lzRolleErr").textContent=fehlerText(e); b.disabled=false; } };
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
  const zell=(kid,t)=>{ const a=LZ.daten.abgaben.find(x=>x.code===t.code && x.sid===kid.id); return a ? `<td class="lz-n ${noteKlasse(a.note)}" title="${a.punkte}/${a.max} Punkte">${fmtNote(a.note)}</td>` : `<td class="lz-n leer" title="noch nicht abgegeben">·</td>`; };
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
      ${[...ts].sort((a,b)=>String(a.erstellt).localeCompare(String(b.erstellt))).map(t=>{ const a=abK.find(x=>x.code===t.code); return `<tr><th scope="row"><button type="button" class="lz-th" data-t="${h(t.code)}">${h(t.titel)}</button></th>${a?`<td>${a.punkte}/${a.max}</td><td class="lz-n ${noteKlasse(a.note)}">${fmtNote(a.note)}</td><td>${h(zeit(a.dauer))}</td><td>${datum(a.datum)}</td>`:`<td colspan="4" class="lz-offen">noch nicht abgegeben</td>`}</tr>`; }).join("")}
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
  LZ.neu={titel:"", klasseId:kid, schuljahr:k?.schuljahr||"h6", thema:"", stufe:0, unter:"", anzahl:10, modus:"zufall", sel:[], fmap:new Map(), suche:"", lp21:[], lpAuto:true, fach:""};
  LZ.neuKlasse=null; lpAuto();
}
function zyklusNeu(){ const n=LZ.neu; const s=sjObj(n.schuljahr); return s ? s.zyklus : (klasseVon(n.klasseId)?.zyklus||2); }
function lpAuto(){ const n=LZ.neu; if(!n.lpAuto) return; n.lp21=lp21Vorschlag(themaIds(n.thema)||[], zyklusNeu()); n.fach = n.lp21[0] ? LP21_KB[n.lp21[0]].fach : n.fach; }
function poolNeu(ohneUnter){
  const n=LZ.neu; const ids=themaIds(n.thema); const set=ids?new Set(ids):null; const u=ohneUnter?"":n.unter.trim().toLowerCase();
  return alleFr().filter(f=>f && typeof THEMA!=="undefined" && THEMA[f.t] && !f.img && Array.isArray(f.a) && f.a.length===4 && (!n.stufe || f.l===n.stufe) && (!set || set.has(f.t)) && (!u || String(f.s||"").toLowerCase().includes(u)));
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
    <section class="statcard lz-sek"><h2>3. Ausgewählte Fragen <span class="lz-zahl">${sel.length}</span></h2>
      ${sel.length ? `<ol class="lz-sel">${sel.map(f=>`<li><span><b>${h(f.q)}</b><small>${h(themaName(f.t))} · Stufe ${f.l} · ✅ ${h(f.a[0])}</small></span><button type="button" class="lz-mini" data-rm="${h(fKey(f))}" aria-label="Frage entfernen">✕</button></li>`).join("")}</ol>
        <div class="row lz-links"><button class="big alt small" id="lzLeeren" type="button">Alle entfernen</button></div>`
        : `<p class="empty">${n.modus==="zufall"?"Noch keine Fragen gezogen. Tippe auf «Fragen ziehen».":"Hake oben die gewünschten Fragen an."}</p>`}
      ${sel.length>MAX_FRAGEN?`<p class="err">Höchstens ${MAX_FRAGEN} Fragen pro Test.</p>`:""}
    </section>
    <section class="statcard lz-sek"><h2>4. Lehrplan 21</h2>
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
    n.fmap=new Map(z.map(f=>[fKey(f),f])); n.sel=z.map(fKey); }));
  if($q("#lzNSuche")){ const inp=$q("#lzNSuche"); let tm; inp.oninput=()=>{ clearTimeout(tm); tm=setTimeout(()=>{ merke(); n.suche=inp.value; const pos=inp.selectionStart, y=scrollY; render(); scrollTo(0,y); const x=$q("#lzNSuche"); if(x){ x.focus(); try{ x.setSelectionRange(pos,pos); }catch(e){} } },300); }; }
  $a("[data-fq]").forEach(c=>c.onchange=()=>neu(()=>{ const f=liste.find(x=>fKey(x)===c.dataset.fq); if(!f) return;
    if(c.checked){ if(!n.sel.includes(c.dataset.fq)){ n.sel.push(c.dataset.fq); n.fmap.set(c.dataset.fq,f); } } else n.sel=n.sel.filter(x=>x!==c.dataset.fq); }));
  $a("[data-rm]").forEach(b=>b.onclick=()=>neu(()=>{ n.sel=n.sel.filter(x=>x!==b.dataset.rm); }));
  $q("#lzLeeren") && ($q("#lzLeeren").onclick=()=>neu(()=>{ n.sel=[]; }));
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
        fragen:sel.map(f=>{ const o=mischen(f.a.map((x,i)=>({x, ok:i===0}))); return {q:f.q, o:o.map(y=>y.x), r:o.findIndex(y=>y.ok), e:f.e||"", nr:fNr(f), t:f.t, l:f.l, s:f.s||""}; })};
      await SP.testSpeichern(t, k); LZ.daten.tests.unshift(t); LZ.neu=null; LZ.testCode=code; toast(`Test erstellt. Code: ${code}`,"ok"); go("ltest");
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
function seiteTest(){
  if(!bereitFuerLehrer("Test")) return;
  const t=LZ.daten.tests.find(x=>x.code===LZ.testCode); if(!t){ go("lehrer"); return; }
  const k=klasseVon(t.klasseId); const kids=k?.schueler||[]; const ab=abgabenVon(t.code);
  const s=schnitt(ab.map(a=>a.note)), sp=schnitt(ab.map(a=>a.punkte)), sz=schnitt(ab.map(a=>a.dauer||0));
  const link=testLink(t.code);
  const zeilen=[...kids.map(kid=>({kid, a:ab.find(a=>a.sid===kid.id)})), ...ab.filter(a=>!kids.some(x=>x.id===a.sid)).map(a=>({kid:{id:a.sid, name:a.name+" (entfernt)"}, a}))]
    .sort((x,y)=>(y.a?1:0)-(x.a?1:0) || (y.a?.note||0)-(x.a?.note||0) || x.kid.name.localeCompare(y.kid.name,"de"));
  setze(`${lc([START,LB,...(k?[[k.name,()=>{ LZ.klasseId=k.id; go("lklasse"); }]]:[])], t.titel)}
    <div class="bhead"><span class="emo" aria-hidden="true">📝</span><h1>${h(t.titel)}</h1></div>
    <p class="bdesc">${h(k?.name||"")} · ${h(sjName(t.schuljahr))} · ${t.fragen.length} Fragen · erstellt am ${datum(t.erstellt)}</p>
    ${t.lp21?.length?`<div class="lz-chips lz-mitte">${t.lp21.map(c=>`<span class="lz-chip still" title="${h(LP21_KB[c]?.fachName||"")}">${h(lpLabel(c))}</span>`).join("")}</div>`:""}
    <div class="lz-grid2">
      <section class="statcard"><h2>📤 Test verteilen</h2>
        <p class="lz-codegross" aria-label="Test-Code ${h(t.code.split("").join(" "))}">${h(t.code)}</p>
        <p class="help">Die Kinder öffnen den Link oder tippen auf der Startseite auf <b>«Test mit Code starten»</b>, geben den Test-Code und ihren PIN ein und lösen den Test.</p>
        ${teilenHTML(link, `easyplay-Test «${t.titel}», Code ${t.code}`)}
        <label class="lz-schalter"><input type="checkbox" id="lzAktiv" ${t.aktiv!==false?"checked":""}><span>Test ist offen (Kinder können ihn lösen)</span></label>
      </section>
      <section class="statcard"><h2>🖨️ Arbeitsblatt</h2>
        <p class="help">Für die Arbeit auf Papier: Arbeitsblatt mit Kopf (Klasse, Datum, Name) und Ankreuzfeldern, Lösungsblatt mit richtigen Antworten und Erklärungen.</p>
        <div class="row lz-links"><button class="big" id="lzPdfA" type="button">📄 Arbeitsblatt (PDF)</button><button class="big alt" id="lzPdfL" type="button">✅ Lösungsblatt (PDF)</button></div>
        <p class="status" id="lzPdfSt" aria-live="polite"></p>
      </section>
    </div>
    <section class="statcard lz-sek"><h2>📊 Resultate <span class="lz-zahl">${ab.length}/${kids.length}</span></h2>
      ${ab.length?`<div class="lz-kpis"><div><b>${fmtNote(s)}</b><span>Ø Note</span></div><div><b>${sp!=null?(Math.round(sp*10)/10).toLocaleString("de-CH"):"-"}/${t.fragen.length}</b><span>Ø Punkte</span></div><div><b>${h(zeit(sz))}</b><span>Ø Zeit</span></div><div><b>${ab.filter(a=>a.note>=4).length}/${ab.length}</b><span>genügend</span></div></div>`:""}
      ${zeilen.length?`<div class="lz-tabwrap"><table class="lz-tab lz-liste"><thead><tr><th scope="col">Kind</th><th scope="col">Punkte</th><th scope="col">Note</th><th scope="col">Zeit</th><th scope="col">Abgabe</th><th scope="col"><span class="sr-only">Aktion</span></th></tr></thead><tbody>
        ${zeilen.map(({kid,a})=>a?`<tr><th scope="row"><button type="button" class="lz-th" data-kind="${h(kid.id)}">${h(kid.name)}</button></th><td>${a.punkte}/${a.max}</td><td class="lz-n ${noteKlasse(a.note)}">${fmtNote(a.note)}</td><td>${h(zeit(a.dauer))}</td><td>${datum(a.datum)}</td><td><button type="button" class="lz-mini" data-abdel="${h(a.id)}" title="Abgabe löschen, damit das Kind nochmals lösen kann" aria-label="Abgabe von ${h(kid.name)} löschen">↩️</button></td></tr>`
          :`<tr><th scope="row">${h(kid.name)}</th><td colspan="5" class="lz-offen">noch nicht abgegeben · PIN ${h(kid.pin||"")}</td></tr>`).join("")}
      </tbody></table></div>`:`<p class="empty">Diese Klasse hat noch keine Kinder.</p>`}
    </section>
    <section class="statcard lz-sek"><h2>🔍 Fehleranalyse</h2>
      <p class="help">Fragen sortiert nach Fehlerquote, mit der häufigsten falschen Antwort.</p>
      ${fehlerListe(fehlerAnalyse([t], ab), 50)}
    </section>
    <details class="bibthema lz-sek"><summary><span class="bname">👀 Fragen in diesem Test</span><span class="bn">${t.fragen.length}</span></summary>
      <ol class="lz-sel lz-vorschau">${t.fragen.map(f=>`<li><span><b>${h(f.q)}</b><small>${f.o.map((o,j)=>`${"abcd"[j]}) ${j===+f.r?`<b class="lz-richtig">${h(o)}</b>`:h(o)}`).join(" · ")}</small></span></li>`).join("")}</ol></details>
    <div class="row"><button class="big alt small" id="lzTReload" type="button">🔄 Resultate aktualisieren</button><button class="big alt small lz-gefahr" id="lzTDel" type="button">🗑️ Test löschen</button></div>`);
  bindTeilenL();
  $a("[data-kind]").forEach(b=>b.onclick=()=>{ LZ.kindId=b.dataset.kind; go("lkind"); });
  $q("#lzAktiv").onchange=async e=>{ const neu={...t, aktiv:e.target.checked}; try{ await SP.testSpeichern(neu, k); t.aktiv=neu.aktiv; toast(t.aktiv?"Test ist offen.":"Test ist geschlossen.","ok"); rerender(); }catch(x){ e.target.checked=!e.target.checked; toast(fehlerText(x),"bad"); } };
  const pdf=async(loes)=>{ const st=$q("#lzPdfSt"); st.textContent="PDF wird erstellt …"; $a("#lzPdfA,#lzPdfL").forEach(b=>b.disabled=true);
    try{ const d=await pdfTest(t, k, loes); const r=await pdfSpeichern(d, `${loes?"Loesungsblatt":"Arbeitsblatt"}-${slug(t.titel)}-${t.code}.pdf`); st.textContent = r==="gespeichert" ? "✅ PDF erstellt." : r==="abgebrochen" ? "Download abgebrochen." : "Bitte kurz warten und nochmals versuchen."; }
    catch(e){ st.textContent=fehlerText(e); } $a("#lzPdfA,#lzPdfL").forEach(b=>b.disabled=false); };
  $q("#lzPdfA").onclick=()=>pdf(false); $q("#lzPdfL").onclick=()=>pdf(true);
  $a("[data-abdel]").forEach(b=>b.onclick=async()=>{ const a=ab.find(x=>x.id===b.dataset.abdel); if(!a || !confirm(`Abgabe von ${a.name} löschen? Danach kann das Kind den Test nochmals lösen.`)) return;
    try{ await SP.abgabeLoeschen(a); LZ.daten.abgaben=LZ.daten.abgaben.filter(x=>x.id!==a.id); toast("Abgabe gelöscht.","ok"); rerender(); }catch(e){ toast(fehlerText(e),"bad"); } });
  $q("#lzTReload").onclick=()=>neuLaden();
  $q("#lzTDel").onclick=async()=>{ if(!confirm(`Test «${t.titel}» und alle Resultate löschen?`)) return;
    try{ await SP.testLoeschen(t.code); LZ.daten.tests=LZ.daten.tests.filter(x=>x.code!==t.code); LZ.daten.abgaben=LZ.daten.abgaben.filter(x=>x.code!==t.code); toast("Test gelöscht.","ok"); go("lehrer"); }catch(e){ toast(fehlerText(e),"bad"); } };
}

/* ================= 7. Seiten für Kinder: Test mit Code ================= */
const KID_FEHLER = {code:"Diesen Test-Code gibt es nicht. Schau nochmals genau hin.", pin:"Der PIN passt nicht zu diesem Test. Frag deine Lehrperson.", geschlossen:"Dieser Test ist geschlossen. Frag deine Lehrperson.",
  schon:"Du hast diesen Test schon abgegeben. 🎉", gesperrt:"Zu viele falsche Versuche. Bitte warte ein paar Minuten.", konto:"Bitte melde dich zuerst bei claude.ai an.", daten:"Die Antworten konnten nicht gelesen werden."};
function seiteCode(){
  const K=LZ.kid||(LZ.kid={});
  setze(`${lc([START], "Test mit Code")}
    <div class="lwait lz-codebox">
      <div class="lz-gross" aria-hidden="true">🔢</div>
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
  const T=K.test, n=T.fragen.length, i=Math.max(0,Math.min(n-1,K.i)), f=T.fragen[i], gew=K.antworten[i], offen=K.antworten.filter(x=>x==null).length;
  setze(`<div class="lz-spiel">
    <div class="lz-spielkopf"><div><b>${h(T.titel)}</b><span>👋 ${h(K.kind.name)}</span></div><span class="lz-fz">Frage ${i+1} von ${n}</span></div>
    <div class="lz-fort" role="progressbar" aria-valuemin="0" aria-valuemax="${n}" aria-valuenow="${n-offen}" aria-label="Beantwortete Fragen"><i style="width:${Math.round((n-offen)/n*100)}%"></i></div>
    <div class="card lz-frage" style="--c:var(--welt)">
      <h2 class="lz-q">${h(f.q)}</h2>
      ${typeof speakBtn==="function" ? speakBtn(f.q+". "+f.o.map((o,j)=>"ABCD"[j]+": "+o).join(". ")) : ""}
      <div class="lz-opts" role="radiogroup" aria-label="Antworten">${f.o.map((o,j)=>`<button type="button" class="lz-opt" role="radio" aria-checked="${gew===j}" data-o="${j}"><span class="lz-bu" aria-hidden="true">${"ABCD"[j]}</span><span>${h(o)}</span></button>`).join("")}</div>
    </div>
    <div class="lz-nav">
      <button class="big alt" id="lzZur" type="button" ${i===0?"disabled":""}>← Zurück</button>
      ${i<n-1 ? `<button class="big" id="lzWeiter" type="button">Weiter →</button>` : `<button class="big gold" id="lzAbgeben" type="button">✅ Test abgeben</button>`}
    </div>
    <nav class="lz-punkte" aria-label="Zu einer Frage springen">${T.fragen.map((_,j)=>`<button type="button" data-sprung="${j}" class="${K.antworten[j]!=null?"ja":""} ${j===i?"jetzt":""}" aria-label="Frage ${j+1}${K.antworten[j]!=null?", beantwortet":""}" ${j===i?'aria-current="step"':""}>${j+1}</button>`).join("")}</nav>
    ${i<n-1 && offen===0 ? `<div class="row"><button class="big gold" id="lzAbgeben2" type="button">✅ Alles beantwortet: Test abgeben</button></div>` : ""}
    <p class="lz-tipp">Die Lösungen und Erklärungen siehst du nach der Abgabe.</p>
    <p class="err" id="lzSpielErr" aria-live="polite"></p>
  </div>`);
  if(typeof bindSpeak==="function") try{ bindSpeak(); }catch(e){}
  $a("[data-o]").forEach(b=>b.onclick=()=>{ K.antworten[i]=+b.dataset.o; rerender(); const nb=$q(`.lz-opt[data-o="${b.dataset.o}"]`); nb && nb.focus(); });
  const wechsel=j=>{ K.i=j; rerender(); scrollTo({top:0}); };
  $q("#lzZur").onclick=()=>wechsel(i-1);
  $q("#lzWeiter") && ($q("#lzWeiter").onclick=()=>wechsel(i+1));
  $a("[data-sprung]").forEach(b=>b.onclick=()=>wechsel(+b.dataset.sprung));
  const abgeben=async()=>{
    const off=K.antworten.filter(x=>x==null).length;
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
  const lob = E.note>=5.5?"Wow, hervorragend! 🌟":E.note>=5?"Sehr gut gemacht! 💪":E.note>=4?"Gut gemacht, genügend! 👍":"Nicht aufgeben, beim nächsten Mal klappt es besser! 🍀";
  setze(`<div class="card done pop lz-fertig">
    <p class="lz-gross" aria-hidden="true">${E.note>=4?"🎉":"🌱"}</p>
    <h1>${h(lob)}</h1>
    <div class="lz-notebox ${noteKlasse(E.note)}"><span>Note</span><b>${fmtNote(E.note)}</b></div>
    <p>${E.punkte} von ${E.max} Punkten · Zeit ${h(zeit(E.dauer))} · ${h(T.titel)}</p>
    <p class="help">Dein Resultat ist bei deiner Lehrperson angekommen.</p>
    <div class="summary"><h2>Lösungen und Erklärungen</h2>
      <div class="review">${T.fragen.map((f,i)=>{ const l=E.loesung?.[i]||{}; const d=K.antworten[i]; const ok=d!=null && d===l.r;
        return `<div class="rev ${ok?"r-ok":"r-bad"}"><div class="revhead"><span class="revnr">${i+1}</span><span aria-hidden="true">${ok?"✅":"❌"}</span><b>${h(f.q)}</b></div>
          ${ok?`<span class="ans-ok">Deine Antwort: ${h(f.o[d])}</span>`:`<span class="ans-bad">${d==null?"Nicht beantwortet":"Deine Antwort: "+h(f.o[d])}</span><span class="ans-ok">Richtig wäre: ${h(f.o[l.r]??"")}</span>`}
          ${l.e?`<span class="revm">💡 ${h(l.e)}</span>`:""}</div>`; }).join("")}</div></div>
    <div class="row"><button class="big" id="lzFertigOk" type="button">🏠 Zur Startseite</button></div></div>`);
  $q("#lzFertigOk").onclick=()=>{ LZ.kid=null; go("home"); };
}

/* ================= 8. Einbindung in easyplay ================= */
const SEITEN = {lehrer:seiteLehrer, lklasse:seiteKlasse, lkind:seiteKind, ltestneu:seiteTestNeu, ltest:seiteTest, lcode:seiteCode, lspiel:seiteSpiel, lfertig:seiteFertig};
const origRender=window.render;
window.render=function(){
  if(SEITEN[S.screen]){
    try{ if(typeof applyDark==="function") applyDark(); }catch(e){}
    try{ if(S.timer){ clearInterval(S.timer); S.timer=null; } }catch(e){}
    try{ renderNav(); }catch(e){ console.warn(e); }
    try{ SEITEN[S.screen](); }catch(e){ console.error("lehrer.js", e); setze(`<div class="lwait"><h2>😕 Hoppla</h2><p>${h(fehlerText(e))}</p><div class="row"><button class="big" type="button" id="lzHome">Zur Startseite</button></div></div>`); const b=$q("#lzHome"); b&&(b.onclick=()=>go("home")); }
    return;
  }
  return origRender.apply(this, arguments);
};
function zuSeite(s){ try{ if(S.libModus && typeof setLibModus==="function"){ S.libModus=false; document.documentElement.dataset.mode="spiel"; } }catch(e){} go(s); }
// Menüeinträge
if(typeof window.renderNav==="function"){
  const origNav=window.renderNav;
  window.renderNav=function(){
    const r=origNav.apply(this, arguments);
    try{
      const menu=$q("#hauptmenue");
      if(menu && !menu.querySelector("[data-lm]")){
        const ref=menu.querySelector('[data-m="meinetests"]') || menu.querySelector('[data-m="set"]');
        const wrap=document.createElement("div"); wrap.innerHTML=`<button role="menuitem" type="button" data-lm="lehrer">🎓 Lehrerbereich</button><button role="menuitem" type="button" data-lm="lcode">🔢 Test mit Code</button>`;
        const items=[...wrap.children]; if(ref && ref.parentNode===menu){ items.reverse().forEach(x=>ref.after(x)); } else items.forEach(x=>menu.appendChild(x));
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
// Startseite: «Test mit Code starten»
if(typeof window.renderHome==="function"){
  const origHome=window.renderHome;
  window.renderHome=function(){
    const r=origHome.apply(this, arguments);
    try{ const c=$q(".ctas"); if(c && !$q("#lzCodeStart")){ const b=document.createElement("button"); b.className="big lz-codestart"; b.type="button"; b.id="lzCodeStart";
        b.innerHTML=`<span class="cicon" aria-hidden="true">🔢</span> Test mit Code<span class="lz-lang"> starten</span>`; b.onclick=()=>{ LZ.kid=null; go("lcode"); }; c.appendChild(b); } }catch(e){}
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
        const z=box.querySelector("#lzProfZu"); z&&(z.onclick=()=>go("lehrer"));
        const ro=box.querySelector("#lzProfRolle"); ro&&(ro.onclick=async()=>{ ro.disabled=true; try{ const sp=await speicher(); if(!sp.lehrerId()){ go("lehrer"); return; } await sp.rolleSetzen(); go("lehrer"); }catch(e){ toast(fehlerText(e),"bad"); ro.disabled=false; } }); };
      fertig(); app().appendChild(box); if(!SP) speicher().then(()=>{ if(document.body.contains(box)) fertig(); });
    } }catch(e){}
    return r;
  };
}
// Link #test=CODE
function pruefeHash(){ const m=String(location.hash).match(/#test=([A-Za-z0-9]{4,8})/); if(!m) return; LZ.kid={code:normCode(m[1])}; go("lcode"); }
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
`;
const st=document.createElement("style"); st.id="lehrer-css"; st.textContent=css; document.head.appendChild(st);

window.EP_LEHRER = {version:VERSION, note, fmtNote, lp21Vorschlag, LP21, SCHULJAHRE, speicher, pdfTest, pdfPins, pdfText, fehlerAnalyse, wochenSchnitt, _LZ:LZ};
})();
