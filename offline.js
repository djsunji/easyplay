/* easyplay: Welt «Offline spielen» (offline.js)
   Download-Manager für Offline-Pakete (Grundlage für die spätere iPad-App).
   Jedes Paket liegt in einem eigenen Cache "epoff-<paket>"; der Service Worker (sw.js) liest diese Caches,
   wenn kein Internet da ist. Ohne Zustimmung wird nichts Grosses vorab geladen.
   Ausserdem: kleine Pille «Offline», freundliche Hinweise bei Funktionen, die Internet brauchen.
   API: window.EP_OFFLINE = { status(), pakete(), laden(id), entfernen(id), abbrechen() }
   Speicher: ep-x-offline-pakete, ep-x-offline-auto, ep-x-offline-schutz */
(function(){
"use strict";

const LSK = "ep-x-offline-pakete";   // {paketId: {datum, version, n, bytes, teil, fehlt, fehler}}
const LSA = "ep-x-offline-auto";     // Grundpaket automatisch aktualisieren (true/false)
const LSS = "ep-x-offline-schutz";   // Ergebnis von navigator.storage.persist()
const PRE = "epoff-";
const KOPF = "x-ep-offline";
const KB = 1024;

const LS = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};
const h = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const pause = ms => new Promise(r => setTimeout(r, ms));
const idle = f => (window.requestIdleCallback || (g => setTimeout(g, 50)))(f);
const online = () => navigator.onLine !== false;
const sparModus = () => { try{ const c = navigator.connection; return !!(c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || ""))); }catch(e){ return false; } };

const SW_DA = (() => { try{ return "serviceWorker" in navigator && "caches" in window && window.isSecureContext && !window.claude; }catch(e){ return false; } })();
const CACHE_DA = (() => { try{ return "caches" in window && window.isSecureContext; }catch(e){ return false; } })();

const zahl = (x, d) => Number(x).toLocaleString("de-CH", {maximumFractionDigits:d, minimumFractionDigits:d});
function groesse(b){
  if(!(b > 0)) return "0 MB";
  if(b < KB * KB) return Math.max(1, Math.round(b / KB)) + " KB";
  if(b < KB * KB * KB) return zahl(b / KB / KB, b < 10 * KB * KB ? 1 : 0) + " MB";
  return zahl(b / KB / KB / KB, 1) + " GB";
}
const datum = ts => { try{ return new Date(ts).toLocaleDateString("de-CH", {day:"numeric", month:"numeric", year:"numeric"}); }catch(e){ return ""; } };

/* ---------- Pfade ---------- */
const BASIS = (() => { try{ return new URL("./", location.href); }catch(e){ return null; } })();
const abs = p => new URL(p, BASIS || location.href).href;
function rel(u){
  try{ const x = new URL(u, location.href); if(x.origin !== location.origin) return null;
    const b = BASIS ? BASIS.pathname : "/"; if(!x.pathname.startsWith(b)) return null;
    return x.pathname.slice(b.length) || "./"; }catch(e){ return null; }
}

/* Feste Listen (werden beim Laden zusätzlich aus den Quelltexten ergänzt) */
const KIDS = "ben-daumen ben-denken ben-jubel ben-winken ben duo-bereit duo-jubel duo-winken j1 j3 j5 lb-cool lb-daumen lb-denken lb-jubel lb-karten lb-peace lb-schock lb-sitzen lb-winken lb-zeigen leni-daumen leni-denken leni-jubel leni-winken leni liegen m1 m3 m5 spring0 spring1"
  .split(" ").map(n => "img/kids/" + n + ".webp");
const IMG = ["img/logo.webp", "img/fragezeichen.webp", "img/fragezeichen-zwinkern.webp", "img/kinder.webp", "img/app-192.png", "img/favicon-48.png", "img/apple-touch-icon.png", "img/app-512.png"];
const FLAGGEN = ("ad ae af ag al am ao ar at au az ba bb bd be bf bg bh bi bj bn bo br bs bt bw by bz ca cd cf cg ch ci cl cm cn co cr cu cv cy cz de dj dk dm do dz ec ee eg er es et fi fj fm fr ga gb gd ge gh gm gn gq gr gt gw gy hn hr ht hu id ie il in iq ir is it jm jo jp ke kg kh ki km kn kp kr kw kz la lb lc li lk lr ls lt lu lv ly ma mc md me mg mh mk ml mm mn mr mt mu mv mw mx my mz na ne ng ni nl no np nr nz om pa pe pg ph pk pl pt pw py qa ro rs ru rw sa sb sc sd se sg si sk sl sm sn so sr ss st sv sy sz td tg th tj tl tm tn to tr tt tv tz ua ug us uy uz va vc ve vn vu ws xk ye za zm zw")
  .split(" ").map(c => "flags/" + c + ".svg");
const WELTEN = ["welten/album/karten.json", "welten/feste/fragen.json", "welten/karte/kantone.js", "welten/forscher/auftraege.json",
  "welten/spielwelt/bilder.json", "welten/spielwelt/paare.json", "welten/spielwelt/reihen.json",
  "welten/sprachen/en.json", "welten/sprachen/fr.json",
  "welten/i18n/index.json", "welten/i18n/ui-fr.json", "welten/i18n/ui-it.json",
  "welten/hilfen/atkinson-hyperlegible-latin-400-normal.woff2", "welten/hilfen/atkinson-hyperlegible-latin-700-normal.woff2",
  "welten/hilfen/atkinson-hyperlegible-latin-ext-400-normal.woff2", "welten/hilfen/atkinson-hyperlegible-latin-ext-700-normal.woff2"];
const BILD_KLEIN = /^bilder\/[a-z0-9]{2}\/[a-z0-9]+\.webp$/;
const BILD_SCHNITT = 38 * KB;   // geschätzte Grösse eines kleinen Bildes (480 px, webp)

/* Grösse vorab schätzen (entpackte Bytes, so wie sie im Speicher liegen) */
function schaetze(p){
  if(/^fragen-\d+\.json$/.test(p)) return 3100 * KB;
  if(/^daten-\d+\.js$/.test(p)) return 720 * KB;
  if(/^texte2-\d+\.json$/.test(p)) return 2150 * KB;
  if(/^texte-\d+\.json$/.test(p)) return 2350 * KB;
  if(p === "bildindex.json") return 3900 * KB;
  if(p === "./" || p === "index.html") return 1750 * KB;
  if(p.startsWith("flags/")) return 15 * KB;
  if(p.startsWith("img/kids/")) return 95 * KB;
  if(p.startsWith("img/")) return 60 * KB;
  if(p.startsWith("bilder/")) return BILD_SCHNITT;
  if(/^welten\/i18n\/[a-z]{2}\//.test(p)) return 330 * KB;
  if(p.startsWith("welten/")) return 60 * KB;
  if(/\.js$/.test(p)) return 45 * KB;
  return 20 * KB;
}

/* ---------- Verbindung zum Service Worker ---------- */
function swInfo(){
  return new Promise(res => {
    try{
      const c = navigator.serviceWorker && navigator.serviceWorker.controller;
      if(!c) return res(null);
      const ch = new MessageChannel(); const t = setTimeout(() => res(null), 3000);
      ch.port1.onmessage = e => { clearTimeout(t); res(e.data || null); };
      c.postMessage({typ:"info"}, [ch.port2]);
    }catch(e){ res(null); }
  });
}
function swPakete(){ try{ navigator.serviceWorker && navigator.serviceWorker.controller && navigator.serviceWorker.controller.postMessage({typ:"pakete"}); }catch(e){} }

/* Pfade aus den Quelltexten der Seite (index.html und alle eigenen Skripte) sammeln */
async function quellPfade(){
  const set = new Set();
  const rx = /((?:welten|img|flags)\/[A-Za-z0-9_\-\/.]+\.(?:json|js|webp|png|jpg|jpeg|svg|woff2?|mp3|ogg|m4a|txt))/g;
  const texte = [];
  try{ texte.push(document.documentElement.innerHTML); }catch(e){}
  for(const sc of Array.from(document.scripts)){
    const r = sc.src && rel(sc.src); if(!r) continue;
    try{ const a = await fetch(abs(r)); if(a.ok) texte.push(await a.text()); }catch(e){}
  }
  for(const t of texte){ let m; rx.lastIndex = 0; while((m = rx.exec(t))) set.add(m[1].replace(/^\.\//, "")); }
  return [...set].filter(p => !p.includes("..") && !p.startsWith("bilder/"));
}

/* ---------- Pakete ---------- */
async function grundDateien(){
  const info = await swInfo();
  const cfg = window.EP_CONFIG || {};
  const s = new Set(["./", "index.html", "manifest.webmanifest", "impressum.html", "datenschutz.html", "config.js", "bibidx.js", "bildindex.json"]);
  const dazu = p => { if(p && typeof p === "string" && !p.includes("admin/") && p !== "sw.js") s.add(p.replace(/^\.\//, "") || "./"); };
  ((info && info.huelle) || []).forEach(dazu);
  for(const sc of Array.from(document.scripts)) if(sc.src) dazu(rel(sc.src));
  for(const l of Array.from(document.querySelectorAll("link[href]"))){ const r = rel(l.href); if(r && !/\.html$/.test(r)) dazu(r); }
  (cfg.fragenDateien || Array.from({length:18}, (_, i) => "fragen-" + (i + 1) + ".json")).forEach(dazu);
  for(let i = 1; i <= 12; i++) dazu("daten-" + String(i).padStart(2, "0") + ".js");
  [...IMG, ...KIDS, ...FLAGGEN, ...WELTEN].forEach(dazu);
  try{ (await quellPfade()).forEach(dazu); }catch(e){}
  // Übersetzte Fragen (Französisch, Italienisch) laut welten/i18n/index.json
  try{ const ix = await jsonLesen("welten/i18n/index.json");
    if(ix && typeof ix === "object") for(const l of Object.keys(ix)){ if(/^[a-z]{2}$/.test(l) && Array.isArray(ix[l])) ix[l].forEach(f => { if(/^[a-z0-9_\-]+\.json$/i.test(f)) dazu("welten/i18n/" + l + "/" + f); }); }
  }catch(e){}
  return [...s];
}
function texteDateien(){
  const cfg = window.EP_CONFIG || {};
  return [...(cfg.texteDateien || ["texte-1.json", "texte-2.json"]), ...(cfg.texteDateien2 || [])];
}
const albumPfad = id => "bilder/" + id.slice(-2) + "/" + id + ".webp";
async function jsonLesen(p){ try{ const r = await fetch(abs(p)); return r.ok ? await r.json() : null; }catch(e){ return null; } }
async function albumDateien(){
  const j = await jsonLesen("welten/album/karten.json");
  return [...new Set(((j && j.k) || []).map(k => k && typeof k[0] === "string" ? albumPfad(k[0]) : "").filter(p => BILD_KLEIN.test(p)))];
}
async function spielweltDateien(){
  const j = await jsonLesen("welten/spielwelt/bilder.json");
  return [...new Set((Array.isArray(j) ? j : []).map(x => x && x.b).filter(p => typeof p === "string" && BILD_KLEIN.test(p)))];
}

/* Bücher der Bibliothek: kleine Bilder (480 px) aus bildindex.json für alle Seiten eines Buches */
function buecher(){ try{ return (typeof BUECHER !== "undefined" && Array.isArray(BUECHER)) ? BUECHER : []; }catch(e){ return []; } }
async function fragenBereit(){
  for(let i = 0; i < 40; i++){ try{ if(typeof FRAGEN !== "undefined" && FRAGEN.length > 500) return true; }catch(e){} await pause(250); }
  return false;
}
async function bildIdx(){
  try{ if(typeof bildIndex === "function") return (await bildIndex()) || {}; }catch(e){}
  return (await jsonLesen("bildindex.json")) || {};
}
const BUCH_LISTE = {};   // Buch-Id -> Pfadliste (zwischengespeichert)
async function buchDateien(bid){
  if(BUCH_LISTE[bid]) return BUCH_LISTE[bid];
  await fragenBereit();
  const ix = await bildIdx();
  const out = new Set();
  try{
    const D = buchDaten(bid);
    for(const s of D.seiten || []){
      let k = ""; try{ k = seiteKey(s); }catch(e){ continue; }
      const e = ix[k]; if(e && BILD_KLEIN.test(e[6] || "")) out.add(e[6]);
    }
  }catch(e){}
  return (BUCH_LISTE[bid] = [...out]);
}

const PAKETE = [
  {id:"grund", titel:"Grundpaket", emo:"📦", pflicht:true, farbe:"linear-gradient(135deg,#5B4BF5,#9B4DE0)",
   text:"App, alle Quizfragen, Daten der Welten und Figuren. Nötig zum Offline-Spielen.", dateien:grundDateien, par:3},
  {id:"texte", titel:"Bibliothek: Texte", emo:"📚", farbe:"linear-gradient(135deg,#0B6E6A,#0FA968)",
   text:"Alle Lesetexte der Bibliothek, damit du auch offline lesen kannst.", dateien:async () => texteDateien(), par:2},
  {id:"album", titel:"Sammelalbum-Bilder", emo:"🃏", farbe:"linear-gradient(135deg,#E0663B,#E043B8)",
   text:"Die Bilder aller Sammelkarten.", dateien:albumDateien, par:8, bilder:true},
  {id:"spielwelt", titel:"Spielwelt-Bilder", emo:"🧩", farbe:"linear-gradient(135deg,#2F4BD8,#1FA2E0)",
   text:"Bilder für Memory und die Spiele der Spielwelt.", dateien:spielweltDateien, par:8, bilder:true}
];
function paket(id){
  const p = PAKETE.find(x => x.id === id); if(p) return p;
  if(String(id).startsWith("buch-")){
    const bid = id.slice(5); const B = buecher().find(b => b.id === bid); if(!B) return null;
    return {id, titel:"Bilder: " + B.titel, emo:B.emo || "📖", farbe:`linear-gradient(135deg,${B.farbe || "#5B4BF5"},${B.farbe2 || B.farbe || "#3F2390"})`,
      text:"Kleine Bilder für alle Seiten im Buch «" + B.titel + "».", dateien:() => buchDateien(bid), par:8, bilder:true, buch:bid};
  }
  return null;
}

/* ---------- Status ---------- */
const meta = () => LS.get(LSK, {}) || {};
function metaSetzen(id, v){ const m = meta(); if(v == null) delete m[id]; else m[id] = v; LS.set(LSK, m); }
const fertig = id => { const m = meta()[id]; return !!(m && !m.teil); };
const bereit = () => fertig("grund");

/* Prüfen, ob der Browser Pakete inzwischen gelöscht hat */
async function abgleichen(){
  if(!CACHE_DA) return;
  try{ const m = meta(); let ge = false;
    for(const id of Object.keys(m)){ if(LAUF && LAUF.id === id) continue; if(!(await caches.has(PRE + id))){ delete m[id]; ge = true; } }
    if(ge) LS.set(LSK, m);
  }catch(e){}
}

/* ---------- Herunterladen ---------- */
let LAUF = null;   // {id, ctrl, done, total, bytes, est, fehlt, fehler, still, voll}
const GROESSE = {};  // Paket-Id -> {n, est} (Schätzung vor dem Laden)

async function koerperLesen(r, zaehle, signal, ganz){
  if(ganz || !r.body || !r.body.getReader){ const b = await r.blob(); zaehle(b.size); return b; }
  const rd = r.body.getReader(); const teile = [];
  for(;;){
    if(signal.aborted){ try{ rd.cancel(); }catch(e){} throw new DOMException("Abgebrochen", "AbortError"); }
    const {done, value} = await rd.read(); if(done) break;
    teile.push(value); zaehle(value.byteLength);
  }
  return new Blob(teile, {type:r.headers.get("content-type") || ""});
}

async function dublettenWeg(id){
  // Grosse Daten, die jetzt im Paket liegen, nicht doppelt im Versions-Cache behalten
  if(id !== "grund" && id !== "texte") return;
  try{ const info = await swInfo(); if(!info || !info.cacheHuelle || !(await caches.has(info.cacheHuelle))) return;
    const c = await caches.open(info.cacheHuelle), p = await caches.open(PRE + id);
    for(const req of await c.keys()){
      const r = rel(req.url) || "";
      if(/^(fragen-|texte|daten-)|^bildindex\.json$/.test(r) && await p.match(req, {ignoreSearch:true})) await c.delete(req);
    }
  }catch(e){}
}

async function schutzAnfragen(){
  try{ if(!navigator.storage || !navigator.storage.persist) return false;
    if(await navigator.storage.persisted()){ LS.set(LSS, true); return true; }
    const ok = await navigator.storage.persist(); LS.set(LSS, !!ok); return ok;
  }catch(e){ return false; }
}

async function laden(id, opt){
  opt = opt || {};
  if(!CACHE_DA || LAUF) return false;
  const P = paket(id); if(!P) return false;
  if(!online()){ zeigeNeu(); return false; }
  const ctrl = new AbortController();
  LAUF = {id, ctrl, done:0, total:0, bytes:0, est:0, fehlt:0, fehler:0, still:!!opt.still, voll:false};
  melde();
  if(!opt.still) schutzAnfragen();
  let liste = [];
  try{ liste = await P.dateien(); }catch(e){ liste = []; }
  if(!liste.length || ctrl.signal.aborted){ LAUF = null; zeigeNeu(); if(!liste.length && !opt.still) toast("Für dieses Paket wurden keine Dateien gefunden."); return false; }
  LAUF.total = liste.length; LAUF.est = liste.reduce((s, p) => s + schaetze(p), 0);
  let cache; try{ cache = await caches.open(PRE + id); }catch(e){ LAUF = null; zeigeNeu(); return false; }
  const version = ((await swInfo()) || {}).version || (meta()[id] || {}).version || "";
  // Schon vorhandene Dateien einmal auflisten (Weiterladen nach Abbruch)
  const vorhanden = new Set();
  if(!opt.frisch){ try{ for(const req of await cache.keys()) vorhanden.add(req.url.split("?")[0]); }catch(e){} }
  let i = 0;
  const arbeiter = async () => {
    while(i < liste.length && !ctrl.signal.aborted){
      const pfad = liste[i++]; const url = abs(pfad);
      try{
        if(vorhanden.has(url)){ LAUF.done++; melde(); continue; }
        const kopfAnfrage = {[KOPF]:"1"};
        if(opt.frisch){
          // Schonend: nur nachfragen, ob sich die Datei geändert hat (304 = unverändert, kein Download)
          const alt = await cache.match(url, {ignoreSearch:true});
          const et = alt && alt.headers.get("etag"), lm = alt && alt.headers.get("last-modified");
          if(et) kopfAnfrage["If-None-Match"] = et; else if(lm) kopfAnfrage["If-Modified-Since"] = lm;
        }
        const r = await fetch(url, {cache: opt.frisch ? "no-store" : "default", headers:kopfAnfrage, signal:ctrl.signal, credentials:"same-origin"});
        if(r.status === 304){ LAUF.done++; melde(); if(opt.still) await pause(60); continue; }
        if(!r.ok || r.type !== "basic"){ if(r.status === 404) LAUF.fehlt++; else LAUF.fehler++; LAUF.done++; melde(); continue; }
        const blob = await koerperLesen(r, n => { LAUF.bytes += n; melde(); }, ctrl.signal, !!P.bilder);
        const kopf = {"Content-Type": r.headers.get("content-type") || "application/octet-stream", "x-ep-groesse": String(blob.size), "x-ep-paket": id};
        const lm = r.headers.get("last-modified"); if(lm) kopf["Last-Modified"] = lm;
        const et = r.headers.get("etag"); if(et) kopf["ETag"] = et;
        await cache.put(url, new Response(blob, {status:200, statusText:"OK", headers:kopf}));
      }catch(e){
        if(e && e.name === "AbortError") break;
        if(e && e.name === "QuotaExceededError"){ LAUF.voll = true; ctrl.abort(); break; }
        LAUF.fehler++;
      }
      LAUF.done++; melde();
      if(opt.still) await pause(150);
    }
  };
  await Promise.all(Array.from({length: opt.still ? 1 : (P.par || 3)}, arbeiter));
  const L = LAUF;
  const abgebrochen = ctrl.signal.aborted;
  // Grösse und Anzahl aus dem Cache bestimmen, veraltete Einträge entfernen
  let n = 0, bytes = 0;
  try{
    const soll = new Set(liste.map(p => abs(p)));
    for(const req of await cache.keys()){
      const k = req.url.split("?")[0];
      if(!soll.has(k) && !abgebrochen){ await cache.delete(req); continue; }
      const r = await cache.match(req); n++; bytes += +((r && r.headers.get("x-ep-groesse")) || 0);
    }
  }catch(e){}
  LAUF = null;
  const teil = abgebrochen || L.fehler > 0 || n === 0;
  metaSetzen(id, {datum:Date.now(), version, n, bytes, teil, fehlt:L.fehlt, fehler:L.fehler, voll:L.voll});
  swPakete();
  if(!teil) dublettenWeg(id);
  if(!L.still){
    if(L.voll) toast("Der Speicher ist voll. Entferne ein anderes Paket oder mach Platz auf dem Gerät.");
    else if(abgebrochen) toast("Abgebrochen. Du kannst später weiterladen.");
    else if(teil) toast("Fast geschafft: Einige Dateien fehlen noch. Versuch es später nochmals.");
    else toast((P.titel || "Paket") + " ist offline bereit ✅");
    try{ window.EP_SOUND && window.EP_SOUND.play(teil ? "klick" : "sammeln"); }catch(e){}
  }
  zeigeNeu();
  return !teil;
}
async function entfernen(id){
  if(LAUF && LAUF.id === id){ abbrechen(); for(let i = 0; i < 40 && LAUF; i++) await pause(100); }
  try{ await caches.delete(PRE + id); }catch(e){}
  metaSetzen(id, null); swPakete(); zeigeNeu();
}
function abbrechen(){ try{ LAUF && LAUF.ctrl.abort(); }catch(e){} }

/* Bei neuer Website-Version das Grundpaket still im Hintergrund auffrischen */
let autoLaeuft = false;
async function autoPruefen(){
  if(autoLaeuft || !SW_DA || !online() || sparModus() || LAUF) return;
  if(LS.get(LSA, true) === false) return;
  const m = meta().grund; if(!m) return;
  autoLaeuft = true;
  try{
    const info = await swInfo();
    if(info && info.version && (info.version !== m.version || m.teil)) await laden("grund", {still:true, frisch:!m.teil});
  }catch(e){}
  autoLaeuft = false;
}

/* ---------- Grössen schätzen ---------- */
async function schaetzen(id){
  if(GROESSE[id]) return GROESSE[id];
  const P = paket(id); if(!P) return null;
  let liste = [];
  if(id === "grund"){
    const cfg = window.EP_CONFIG || {};
    const f = (cfg.fragenDateien || []).length || 18;
    liste = [...Array(f).fill("fragen-1.json"), ...Array(12).fill("daten-01.js"), "bildindex.json", "./", "index.html", ...IMG, ...KIDS, ...FLAGGEN, ...WELTEN, ...Array(8).fill("welten/i18n/fr/q-1.json"), ...Array(40).fill("x.js")];
  } else liste = await P.dateien();
  return (GROESSE[id] = {n:liste.length, est:liste.reduce((s, p) => s + schaetze(p), 0)});
}

/* ---------- Oberfläche: Welt ---------- */
let BOX = null, API = null;
const warnung = {};
function toast(t){ try{ if(API && API.toast) API.toast(t); else meldung(t); }catch(e){ meldung(t); } }
function meldung(text){
  try{ document.querySelectorAll(".xof-toast").forEach(e => e.remove());
    const d = document.createElement("div"); d.className = "xof-toast"; d.setAttribute("role", "status"); d.textContent = text;
    document.body.appendChild(d); setTimeout(() => d.remove(), 3200);
  }catch(e){}
}

function kartenInfo(P){
  const m = meta()[P.id]; const g = GROESSE[P.id];
  if(LAUF && LAUF.id === P.id) return laufText();
  if(m && !m.teil) return `✅ Geladen am ${datum(m.datum)} · ${groesse(m.bytes)}${m.n ? ` · ${m.n} Dateien` : ""}`;
  if(m && m.teil) return `⏸️ Noch nicht ganz fertig (${groesse(m.bytes)}). Tippe auf «Weiterladen».`;
  if(g) return g.n ? `ca. ${groesse(g.est)}${P.bilder ? ` · ${g.n} Bilder` : ""}` : "Keine Bilder gefunden";
  return "Grösse wird berechnet …";
}
function laufText(){
  if(!LAUF) return "";
  if(!LAUF.total) return "Wird vorbereitet …";
  const ges = Math.max(LAUF.est, LAUF.bytes);
  return `${LAUF.still ? "Wird still aktualisiert: " : ""}${groesse(LAUF.bytes)} von ca. ${groesse(ges)} · ${LAUF.done} von ${LAUF.total} Dateien`;
}
function anteil(){ if(!LAUF || !LAUF.total) return 0; return Math.min(1, Math.max(LAUF.done / LAUF.total, LAUF.bytes / Math.max(LAUF.est, LAUF.bytes, 1))); }

function karteHTML(P, klein){
  const m = meta()[P.id]; const lauf = LAUF && LAUF.id === P.id; const anderer = LAUF && !lauf;
  const brauchtGrund = !P.pflicht && !bereit();
  const netz = online();
  let knoepfe = "";
  if(lauf) knoepfe = `<button type="button" class="xof-btn xof-stopp" data-a="stopp" aria-label="${h(P.titel)}: Herunterladen abbrechen">✋ Abbrechen</button>`;
  else {
    const kannLaden = netz && SW_DA && !anderer && !brauchtGrund;
    const wort = !m ? "⬇️ Herunterladen" : m.teil ? "⬇️ Weiterladen" : "🔄 Aktualisieren";
    if(!m || m.teil || !klein) knoepfe += `<button type="button" class="xof-btn xof-haupt" data-a="laden" ${kannLaden ? "" : "disabled"} aria-label="${h(P.titel)}: ${h(wort.replace(/^\S+\s/, ""))}">${warnung[P.id] ? "⬇️ Trotzdem laden" : wort}</button>`;
    if(m) knoepfe += `<button type="button" class="xof-btn" data-a="weg" ${anderer ? "disabled" : ""} aria-label="${h(P.titel)} entfernen">${warnung["weg-" + P.id] ? "Wirklich entfernen?" : "🗑️ Entfernen"}</button>`;
  }
  let notiz = "";
  if(!lauf && (!m || m.teil)){
    if(brauchtGrund) notiz = "Lade zuerst das Grundpaket.";
    else if(!netz) notiz = "Zum Herunterladen brauchst du Internet.";
    else if(warnung[P.id]) notiz = warnung[P.id];
  }
  const p = lauf ? Math.round(anteil() * 100) : 0;
  return `<article class="xof-karte${klein ? " xof-klein" : ""}${m && !m.teil ? " xof-ok" : ""}" data-p="${h(P.id)}" style="background:${P.farbe}">
    <div class="xof-k1"><span class="xof-emo" aria-hidden="true">${P.emo}</span><div class="xof-kt"><b>${h(P.titel)}</b>${klein ? "" : `<small>${h(P.text)}</small>`}</div>${P.pflicht ? `<i class="xof-marke">Pflicht</i>` : ""}</div>
    <div class="xof-info" aria-live="polite">${h(kartenInfo(P))}</div>
    <div class="xof-balken" ${lauf ? "" : "hidden"} role="progressbar" aria-label="Fortschritt ${h(P.titel)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p}"><span style="width:${p}%"></span></div>
    ${notiz ? `<div class="xof-notiz">${h(notiz)}</div>` : ""}
    <div class="xof-knoepfe">${knoepfe}</div>
  </article>`;
}

function statusHTML(){
  const m = meta().grund;
  if(!SW_DA) return `<div class="xof-status">ℹ️ Offline spielen geht in diesem Browser leider nicht. Öffne easyplay in Safari, Chrome, Edge oder Firefox.</div>`;
  if(m && !m.teil) return `<div class="xof-status xof-bereit">✅ Offline bereit seit ${h(datum(m.datum))}</div>`;
  if(m && m.teil) return `<div class="xof-status">⏸️ Grundpaket noch nicht ganz geladen</div>`;
  return `<div class="xof-status">☁️ Noch nicht offline bereit</div>`;
}

function seiteHTML(){
  const B = buecher();
  const auto = LS.get(LSA, true) !== false;
  return `<div class="x-kopf xof-kopf"><span class="x-kopf-emo" aria-hidden="true">📴</span><div><h1>Offline spielen</h1><p>Lade easyplay aufs Gerät und spiel Quiz, Bibliothek und Welten ohne Internet.</p></div><img src="img/kids/duo-bereit.webp" alt=""></div>
    <div class="xof-zeile">${statusHTML()}<div class="xof-netz ${online() ? "an" : "aus"}">${online() ? "📶 Online" : "📴 Offline"}</div></div>
    <div class="xof-speicher" id="xofSpeicher"><div class="xof-sp-t">💾 Speicher wird geprüft …</div><div class="xof-sp-b"><span style="width:0%"></span></div></div>
    <h2 class="xof-h2">Pakete</h2>
    <div class="xof-pakete">${PAKETE.map(P => karteHTML(P, false)).join("")}</div>
    ${B.length ? `<h2 class="xof-h2">Bilder für die Bibliothek</h2>
    <div class="xof-buecher">${B.map(b => paket("buch-" + b.id)).filter(Boolean).map(P => karteHTML(P, true)).join("")}</div>` : ""}
    <label class="xof-auto"><input type="checkbox" id="xofAuto" ${auto ? "checked" : ""}> <span>Grundpaket bei einer neuen Version von easyplay automatisch und schonend im Hintergrund aktualisieren</span></label>
    <p class="xof-tipp">💡 Tipp für iPad und iPhone: Füge easyplay in Safari mit «Teilen» und «Zum Home-Bildschirm» hinzu. So bleiben die Pakete sicher gespeichert.</p>`;
}

let SPEICHER_FREI = Infinity;
async function speicherZeigen(){
  const el = BOX && BOX.querySelector("#xofSpeicher"); if(!el) return;
  let t = "💾 Speicherplatz: keine Angaben verfügbar", w = 0, knapp = false;
  try{
    if(navigator.storage && navigator.storage.estimate){
      const e = await navigator.storage.estimate();
      const frei = Math.max(0, (e.quota || 0) - (e.usage || 0));
      w = e.quota ? Math.min(100, (e.usage || 0) / e.quota * 100) : 0;
      const geschuetzt = navigator.storage.persisted ? await navigator.storage.persisted() : false;
      t = `💾 Belegt: ${groesse(e.usage || 0)} · frei: ca. ${groesse(frei)}${geschuetzt ? " · 🔒 geschützt" : ""}`;
      knapp = frei < 150 * KB * KB;
      SPEICHER_FREI = frei;
    }
  }catch(e){}
  if(!el.isConnected) return;
  el.querySelector(".xof-sp-t").textContent = t + (knapp ? " · Wenig Platz frei. Lade nur, was du brauchst." : "");
  el.querySelector(".xof-sp-b span").style.width = w.toFixed(1) + "%";
  el.classList.toggle("xof-knapp", knapp);
}

function binden(){
  if(!BOX) return;
  BOX.querySelectorAll(".xof-karte [data-a]").forEach(b => b.onclick = async () => {
    const id = b.closest(".xof-karte").dataset.p; const a = b.dataset.a;
    try{ window.EP_SOUND && window.EP_SOUND.play("klick"); }catch(e){}
    if(a === "stopp"){ abbrechen(); return; }
    if(a === "weg"){
      if(!warnung["weg-" + id]){ warnung["weg-" + id] = true; zeigeNeu(); setTimeout(() => { if(warnung["weg-" + id]){ delete warnung["weg-" + id]; zeigeNeu(); } }, 5000); return; }
      delete warnung["weg-" + id]; await entfernen(id); toast("Entfernt. Der Speicher ist wieder frei."); speicherZeigen(); return;
    }
    if(a === "laden"){
      const g = await schaetzen(id).catch(() => null);
      const m = meta()[id];
      if(!warnung[id] && !m && g && g.est * 1.15 > SPEICHER_FREI){
        warnung[id] = `Auf dem Gerät ist wenig Platz frei (ca. ${groesse(SPEICHER_FREI)}). Das Paket braucht ca. ${groesse(g.est)}.`; zeigeNeu(); return;
      }
      delete warnung[id];
      laden(id, {frisch: !!(m && !m.teil)});
    }
  });
  const au = BOX.querySelector("#xofAuto"); if(au) au.onchange = () => LS.set(LSA, !!au.checked);
}

function zeigeNeu(){
  if(!BOX || !BOX.isConnected){ BOX = null; return; }
  const ak = document.activeElement;
  const fokus = ak && ak.closest && ak.closest(".xof-karte");
  const fid = fokus && fokus.dataset.p, fa = ak && ak.dataset && ak.dataset.a;
  BOX.innerHTML = seiteHTML(); binden(); speicherZeigen();
  if(fid){ const k = BOX.querySelector(`.xof-karte[data-p="${CSS.escape(fid)}"]`); const b = k && ((fa && k.querySelector(`[data-a="${fa}"]`)) || k.querySelector("[data-a]:not([disabled])")); if(b) try{ b.focus({preventScroll:true}); }catch(e){} }
}

let meldeRaf = 0, letzteVolleAnzeige = "";
function melde(){
  if(meldeRaf) return;
  meldeRaf = requestAnimationFrame(() => {
    meldeRaf = 0;
    if(!BOX || !BOX.isConnected) return;
    const key = LAUF ? LAUF.id : "";
    if(key !== letzteVolleAnzeige){ letzteVolleAnzeige = key; zeigeNeu(); return; }
    if(!LAUF) return;
    const k = BOX.querySelector(`.xof-karte[data-p="${CSS.escape(LAUF.id)}"]`); if(!k) return;
    const p = Math.round(anteil() * 100);
    const bal = k.querySelector(".xof-balken"); bal.hidden = false; bal.setAttribute("aria-valuenow", p); bal.firstElementChild.style.width = p + "%";
    k.querySelector(".xof-info").textContent = laufText();
  });
}

async function groessenNachladen(){
  // Erst die festen Pakete, dann die Bücher, mit Pausen (die Seite bleibt flüssig)
  const ids = [...PAKETE.map(p => p.id), ...buecher().map(b => "buch-" + b.id)];
  for(const id of ids){
    if(!BOX || !BOX.isConnected) return;
    if(GROESSE[id]) continue;
    try{ await schaetzen(id); }catch(e){}
    const k = BOX && BOX.querySelector(`.xof-karte[data-p="${CSS.escape(id)}"] .xof-info`);
    const P = paket(id);
    if(k && P && !(LAUF && LAUF.id === id)) k.textContent = kartenInfo(P);
    await pause(30);
  }
}

/* ---------- CSS ---------- */
function stil(){
  if(document.getElementById("ep-x-offline")) return;
  const s = document.createElement("style"); s.id = "ep-x-offline";
  s.textContent = `
.xof-kopf{background:linear-gradient(135deg,#3B4BD8,#5B4BF5 55%,#0FA9A0)}
.xof-zeile{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 10px}
.xof-status,.xof-netz{background:rgba(15,20,48,.62);color:#fff;border-radius:999px;padding:8px 14px;font-weight:700;font-size:.95rem;line-height:1.3}
.xof-status.xof-bereit{background:linear-gradient(135deg,#0E8F5A,#17B26A)}
.xof-netz.aus{background:#5A3A8A}
.xof-speicher{background:rgba(15,20,48,.58);color:#fff;border-radius:20px;padding:10px 14px;margin:0 0 6px}
.xof-sp-t{font-size:.9rem;font-weight:600}
.xof-sp-b{height:8px;border-radius:99px;background:rgba(255,255,255,.22);margin-top:7px;overflow:hidden}
.xof-sp-b span{display:block;height:100%;background:#7FE3FF;border-radius:99px}
.xof-speicher.xof-knapp .xof-sp-b span{background:#FFD84D}
.xof-h2{display:inline-block;background:rgba(15,20,48,.58);color:#fff;border-radius:999px;padding:6px 14px;font-size:1.05rem;margin:14px 0 10px}
.xof-pakete{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}
.xof-buecher{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px}
.xof-karte{position:relative;display:flex;flex-direction:column;gap:8px;border-radius:24px;padding:14px 16px;color:#fff;box-shadow:0 10px 22px rgba(27,34,64,.22);min-width:0}
.xof-karte.xof-klein{border-radius:20px;padding:12px 14px;gap:6px}
.xof-k1{display:flex;align-items:flex-start;gap:10px;min-width:0}
.xof-emo{font-size:1.8rem;line-height:1}
.xof-klein .xof-emo{font-size:1.4rem}
.xof-kt{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}
.xof-kt b{font-size:1.08rem;color:#fff;overflow-wrap:anywhere}
.xof-kt small{font-size:.85rem;opacity:.95;line-height:1.3;color:#fff}
.xof-marke{font-style:normal;background:#FFE34D;color:#1B2240;font-weight:800;font-size:.72rem;padding:3px 8px;border-radius:999px;white-space:nowrap}
.xof-info{font-size:.85rem;font-weight:600;color:#fff;background:rgba(0,0,0,.18);border-radius:12px;padding:6px 10px;overflow-wrap:anywhere}
.xof-notiz{font-size:.82rem;color:#fff;background:rgba(15,20,48,.35);border-radius:12px;padding:6px 10px}
.xof-balken{height:10px;border-radius:99px;background:rgba(255,255,255,.28);overflow:hidden}
.xof-balken[hidden]{display:none}
.xof-balken span{display:block;height:100%;background:#fff;border-radius:99px;transition:width .3s}
.xof-knoepfe{display:flex;flex-wrap:wrap;gap:8px;margin-top:auto}
.xof-btn{font:inherit;font-weight:700;font-size:.9rem;border:0;border-radius:999px;padding:9px 14px;min-height:40px;cursor:pointer;background:rgba(255,255,255,.22);color:#fff}
.xof-btn.xof-haupt{background:#fff;color:#2A2F7A}
.xof-btn.xof-stopp{background:rgba(15,20,48,.45);color:#fff}
.xof-btn:disabled{opacity:.55;cursor:default}
.xof-btn:focus-visible,.xof-auto input:focus-visible{outline:3px solid #FFE34D;outline-offset:2px}
.xof-ok{outline:3px solid rgba(255,255,255,.55);outline-offset:-3px}
.xof-auto{display:flex;gap:10px;align-items:flex-start;background:rgba(15,20,48,.58);color:#fff;border-radius:18px;padding:10px 14px;margin:14px 0 8px;font-size:.9rem;cursor:pointer}
.xof-auto input{width:20px;height:20px;flex:none;margin:1px 0 0}
.xof-tipp{background:rgba(15,20,48,.5);color:#fff;border-radius:18px;padding:10px 14px;font-size:.88rem;margin:0 0 16px}
.xof-pill{position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 6px);transform:translateX(-50%);z-index:2147483000;
  background:rgba(15,20,48,.82);color:#fff;font:700 .82rem/1 system-ui,-apple-system,"Segoe UI",sans-serif;padding:6px 12px;border-radius:999px;
  box-shadow:0 6px 16px rgba(0,0,0,.25);pointer-events:none;white-space:nowrap}
.xof-pill[hidden]{display:none}
.xof-pill.wieder{background:#17915A}
.xof-hinweis{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 86px);transform:translateX(-50%);z-index:2147483001;
  width:min(420px,calc(100vw - 24px));box-sizing:border-box;display:flex;gap:12px;align-items:center;padding:14px 16px;border-radius:24px;color:#fff;
  background:linear-gradient(135deg,#5B4BF5,#9B4DE0);box-shadow:0 14px 30px rgba(40,30,120,.35)}
.xof-hinweis img{width:58px;height:58px;object-fit:contain;flex:none}
.xof-hinweis div{flex:1;min-width:0}
.xof-hinweis b{display:block;font-size:1rem;color:#fff}
.xof-hinweis p{margin:3px 0 0;font-size:.88rem;line-height:1.35;color:#fff}
.xof-hinweis button{font:inherit;font-weight:700;border:0;border-radius:999px;padding:8px 14px;background:#fff;color:#4B32C8;cursor:pointer;flex:none}
.xof-hinweis button:focus-visible{outline:3px solid #FFE34D;outline-offset:2px}
.xof-banner{display:flex;gap:10px;align-items:center;background:rgba(15,20,48,.62);color:#fff;border-radius:18px;padding:10px 14px;margin:6px 0 12px;font-size:.92rem;font-weight:600}
.xof-wiki{position:absolute;left:10px;bottom:10px;background:rgba(15,20,48,.62);color:#fff;font-size:.78rem;font-weight:700;padding:4px 10px;border-radius:999px}
.xof-toast{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 90px);transform:translateX(-50%);z-index:2147483001;max-width:calc(100vw - 32px);
  background:rgba(15,20,48,.9);color:#fff;padding:10px 16px;border-radius:16px;font-weight:600;font-size:.92rem;text-align:center}
@media (max-width:560px){.xof-kopf{padding:16px 18px;min-height:0}.xof-kopf .x-kopf-emo{display:none}.xof-kopf>div{padding-right:92px}.xof-kopf p{font-size:.92rem}.xof-kopf img{max-height:118px}.xof-status,.xof-netz{font-size:.86rem;padding:7px 12px}.xof-pakete{grid-template-columns:1fr}.xof-buecher{grid-template-columns:1fr 1fr}
  .xof-klein .xof-btn{padding:8px 10px;font-size:.82rem}.xof-klein .xof-kt b{font-size:.95rem}}
@media (max-width:370px){.xof-buecher{grid-template-columns:1fr}}
@media (max-width:900px){.xof-pill{top:auto;left:12px;transform:none;bottom:calc(env(safe-area-inset-bottom,0px) + 92px)}
  .xof-hinweis,.xof-toast{bottom:calc(env(safe-area-inset-bottom,0px) + 128px)}}
@media (prefers-reduced-motion:reduce){.xof-balken span{transition:none}}
`;
  document.head.appendChild(s);
}

/* ---------- Pille «Offline» ---------- */
let pillT = 0;
function pille(wieder){
  try{
    let p = document.getElementById("xof-pill");
    if(!p){ p = document.createElement("div"); p.id = "xof-pill"; p.className = "xof-pill"; p.setAttribute("role", "status"); p.setAttribute("aria-live", "polite"); p.hidden = true; document.body.appendChild(p); }
    clearTimeout(pillT);
    if(!online()){ p.textContent = "📴 Offline"; p.classList.remove("wieder"); p.hidden = false; }
    else if(wieder){ p.textContent = "📶 Wieder online"; p.classList.add("wieder"); p.hidden = false; pillT = setTimeout(() => { p.hidden = true; }, 2500); }
    else p.hidden = true;
  }catch(e){}
}

/* ---------- Freundliche Hinweise, wenn etwas Internet braucht ---------- */
let hinweisT = 0;
function hinweis(titel, text){
  try{
    document.querySelectorAll(".xof-hinweis").forEach(e => e.remove());
    const d = document.createElement("div"); d.className = "xof-hinweis"; d.setAttribute("role", "status"); d.setAttribute("aria-live", "polite");
    d.innerHTML = `<img src="img/kids/m3.webp" alt="" onerror="this.remove()"><div><b>${h(titel)}</b><p>${h(text)}</p></div><button type="button">Okay</button>`;
    d.querySelector("button").onclick = () => d.remove();
    document.body.appendChild(d);
    clearTimeout(hinweisT); hinweisT = setTimeout(() => d.remove(), 7000);
    try{ window.EP_SOUND && window.EP_SOUND.play("klick"); }catch(e){}
  }catch(e){}
}
/* Nur Seiten, die wirklich eine Verbindung zu anderen Geräten brauchen.
   Tagesquiz (chat) und Live-Quiz (livequiz) laufen auch ohne Internet auf dem Gerät. */
const NETZ_SEITEN = {
  live:"Der Wettbewerb", livehost:"Der Wettbewerb", liveplay:"Der Wettbewerb",
  duelllobby:"Das Online-Duell", duellannahme:"Das Online-Duell"
};
const NETZ_TEXT = "Sobald du wieder Internet hast, geht es weiter. Quiz, Bibliothek und Welten kannst du offline spielen.";

function goEinhaengen(){
  const vor = window.go;
  if(typeof vor !== "function" || vor.__xof) return;
  const neu = function(screen){
    if(!online() && typeof screen === "string" && NETZ_SEITEN[screen]){ hinweis(NETZ_SEITEN[screen] + " braucht Internet", NETZ_TEXT); return; }
    return vor.apply(this, arguments);
  };
  neu.__xof = true;
  window.go = neu;
}
function backendDa(){
  try{ if(typeof S !== "undefined" && S.db) return true; }catch(e){}
  try{ if(typeof lkSupa === "function" && lkSupa()) return true; }catch(e){}
  return false;
}
function klickWache(e){
  if(online()) return;
  const t = e.target && e.target.closest ? e.target : null; if(!t) return;
  if(t.closest("[data-komm]") && backendDa()){
    e.preventDefault(); e.stopImmediatePropagation();
    hinweis("Kommentare brauchen Internet", "Lesen und Schreiben von Kommentaren geht wieder, sobald du online bist.");
  }
}
function banner(app, text){
  if(app.querySelector(".xof-banner")) return;
  const b = document.createElement("div"); b.className = "xof-banner"; b.setAttribute("role", "note");
  b.innerHTML = `<span aria-hidden="true">📴</span><span>${h(text)}</span>`;
  const ziel = app.querySelector(".crumbs"); if(ziel) ziel.after(b); else app.prepend(b);
}
function nachRender(){
  if(online()) return;
  try{
    const sc = typeof S !== "undefined" ? String(S.screen || "") : "";
    const app = document.getElementById("app"); if(!app) return;
    if(sc === "duell") banner(app, "Du bist offline. Zu zweit am gleichen Gerät klappt das Duell. Gegen andere Geräte braucht es Internet.");
    if(NETZ_SEITEN[sc]) banner(app, NETZ_SEITEN[sc] + " braucht Internet. " + NETZ_TEXT);
    if(sc === "libseite") setTimeout(wikiHinweis, 1200);
  }catch(e){}
}
function wikiHinweis(){
  if(online()) return;
  const f = document.getElementById("wBild");
  if(f && f.classList.contains("ersatz") && !f.hidden && !f.querySelector(".xof-wiki")){
    if(getComputedStyle(f).position === "static") f.style.position = "relative";
    const s = document.createElement("span"); s.className = "xof-wiki"; s.textContent = "📴 Foto braucht Internet"; f.appendChild(s);
  }
}
function renderEinhaengen(){
  const vor = window.render;
  if(typeof vor !== "function" || vor.__xof) return;
  const neu = function(){ const r = vor.apply(this, arguments); try{ nachRender(); }catch(e){} return r; };
  neu.__xof = true;
  window.render = neu;
}

/* ---------- Welt anmelden ---------- */
if(window.EP_EXTRAS && typeof window.EP_EXTRAS.register === "function"){
  window.EP_EXTRAS.register({
    id:"offline", titel:"Offline spielen", text:"Lade easyplay aufs Gerät und spiel ohne Internet", emo:"📴",
    farbe:"linear-gradient(135deg,#3B4BD8,#5B4BF5 55%,#0FA9A0)", reihe:90,
    hinweis(){ return bereit() ? "bereit" : ""; },
    render(box, api){
      stil(); BOX = box; API = api; letzteVolleAnzeige = LAUF ? LAUF.id : "";
      box.innerHTML = seiteHTML(); binden(); speicherZeigen();
      abgleichen().then(() => { if(BOX === box) zeigeNeu(); });
      setTimeout(() => idle(groessenNachladen), 300);
    }
  });
}

/* ---------- Start ---------- */
function start(){
  stil(); pille(false);
  goEinhaengen(); renderEinhaengen();
  document.addEventListener("click", klickWache, true);
  addEventListener("offline", () => { pille(false); try{ nachRender(); }catch(e){} if(BOX) zeigeNeu(); });
  addEventListener("online", () => { pille(true); if(BOX) zeigeNeu(); setTimeout(() => idle(autoPruefen), 20000); });
  // Automatische Aktualisierung erst, wenn die Seite in Ruhe ist
  if(SW_DA) setTimeout(() => idle(() => { abgleichen().then(autoPruefen); }), 30000);
}
if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
// render/go können von später geladenen Skripten ersetzt werden: nach dem Laden nochmals einhängen
addEventListener("load", () => { goEinhaengen(); renderEinhaengen(); });

window.EP_OFFLINE = {
  status(){
    const m = meta(); const g = m.grund;
    return {bereit:bereit(), datum:g && !g.teil ? g.datum : null, version:g ? g.version : null, online:online(),
      unterstuetzt:SW_DA, laeuft:LAUF ? {id:LAUF.id, done:LAUF.done, total:LAUF.total, bytes:LAUF.bytes} : null, pakete:m};
  },
  pakete(){ return [...PAKETE.map(p => p.id), ...buecher().map(b => "buch-" + b.id)]; },
  laden(id, opt){ return laden(id, opt); },
  entfernen(id){ return entfernen(id); },
  abbrechen
};
})();
