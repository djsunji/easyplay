/* easyplay Welt «Spielwelt»: neue Spielformen neben Multiple Choice.
   Vier Spiele: Bild-Rätsel, Reihenfolge, Zuordnen, Zeitstrahl. Jede Runde hat 5 bis 8 Aufgaben (je nach Stufe).
   Daten (werden erst beim Spielen geladen):
     welten/spielwelt/bilder.json  vorab gefilterte Bibliotheksbilder [{t,b,g,u,k,kt,bu,a,l,d,s,e?}]
                                   (t Titel, b/g lokales Bild klein/gross, u Originaladresse, k/kt Kapitel, bu Buch,
                                    a Urheber, l Lizenz, d Dateiseite, s Schwierigkeit 1-3, e=1 einfach für Entdecker)
     welten/spielwelt/reihen.json  {kategorien:[{id,titel,frage,richtung:"auf"|"ab",einheit,stufe,emo,jahr,quelle,eintraege:[{n,w,t?}]}]}
     welten/spielwelt/paare.json   {saetze:[{id,titel,links,rechts,stufe,paare:[{l,r,f?,e?}]}], kantone:[{k,name,ort}]}
   API: window.EP_SPIELWELT = {
          bestwerte() → {bild:{r,n,datum}|null, reihe:…, paare:…, zeit:…},
          spiele()    → [{id,titel,emo}],
          runden()    → Anzahl gespielter Runden,
          oeffne(id?) → Spielwelt öffnen und optional gleich ein Spiel starten ("bild"|"reihe"|"paare"|"zeit") }
   Speicher: ep-x-spielwelt-best (Bestwerte pro Spiel), ep-x-spielwelt-stat (Runden, zuletzt gespielte Sätze) */
(function(){
"use strict";
if(!window.EP_EXTRAS || typeof window.EP_EXTRAS.register !== "function") return;

const SK_BEST = "ep-x-spielwelt-best", SK_STAT = "ep-x-spielwelt-stat";
const BASIS = "welten/spielwelt/";
const XP_PRO = 2;

const LS = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};
const h = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const ruhig = () => { try{ return matchMedia("(prefers-reduced-motion: reduce)").matches; }catch(e){ return false; } };
const mische = a => { a = a.slice(); for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const wahl = a => a[Math.floor(Math.random() * a.length)];
const zahl = (w) => { try{ return Number(w).toLocaleString("de-CH"); }catch(e){ return String(w); } };

const SPIELE = [
  {id:"bild",  titel:"Bild-Rätsel", text:"Was ist auf dem Bild zu sehen?",           emo:"🖼️", farbe:"linear-gradient(135deg,#C2410C,#E8590C 60%,#EF7A00)"},
  {id:"reihe", titel:"Reihenfolge", text:"Bring vier Dinge in die richtige Ordnung", emo:"📊", farbe:"linear-gradient(135deg,#1864AB,#1C6FC9 60%,#2F7FD6)"},
  {id:"paare", titel:"Zuordnen",    text:"Verbinde, was zusammengehört",             emo:"🔗", farbe:"linear-gradient(135deg,#087F5B,#0B8A62 60%,#0F9568)"},
  {id:"zeit",  titel:"Zeitstrahl",  text:"Lege Ereignisse an die richtige Stelle",    emo:"⏳", farbe:"linear-gradient(135deg,#5F3DC4,#7B3FC8 60%,#9C36B5)"}
];
const STUFEN = {1:"Entdecker", 2:"Könner", 3:"Profis"};
const spielInfo = id => SPIELE.find(s => s.id === id) || SPIELE[0];

/* ---------- Daten laden ---------- */
const CACHE = {};
function lade(name){
  if(!CACHE[name]) CACHE[name] = fetch(BASIS + name + ".json", {cache:"no-cache"}).then(r => { if(!r.ok) throw new Error(r.status); return r.json(); })
    .catch(e => { delete CACHE[name]; throw e; });
  return CACHE[name];
}

/* ---------- Bestwerte ---------- */
function bestwerte(){ const b = LS.get(SK_BEST, {}) || {}; const o = {}; SPIELE.forEach(s => { o[s.id] = b[s.id] || null; }); return o; }
function bestSpeichern(id, r, n){
  const b = LS.get(SK_BEST, {}) || {}; const alt = b[id] || null;
  const neu = r > 0 && (!alt || (r / n) > (alt.r / alt.n) || ((r / n) === (alt.r / alt.n) && r > alt.r));
  if(neu){ const d = new Date(); b[id] = {r, n, datum:d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0")}; LS.set(SK_BEST, b); }
  return {neu, alt};
}
function stat(){ const s = LS.get(SK_STAT, null); return s && typeof s === "object" ? s : {runden:0, letzt:{}}; }

/* ---------- Zustand ---------- */
let BOX = null, API = null, SP = null, START = null, LAUF = 0;
const stufe = () => { let s = 1; try{ s = API ? API.stufe() : ((typeof S !== "undefined" && S.stufe) || 1); }catch(e){} s = Number(s) || 1; return s < 1 ? 1 : s > 3 ? 3 : s; };
const ton = n => { try{ if(API) API.ton(n); else window.EP_SOUND?.play?.(n); }catch(e){} };
const toast = t => { try{ API && API.toast(t, 3200); }catch(e){} };

function norm(s){ return String(s || "").toLowerCase().replace(/ä/g,"ae").replace(/ö/g,"oe").replace(/ü/g,"ue").normalize("NFKD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g," ").trim(); }
/* zwei Titel sind zu ähnlich, wenn einer im anderen steckt oder das Grundwort gleich endet (Braunbär, Eisbär) */
function aehnlich(a, b){
  const x = norm(a), y = norm(b); if(!x || !y) return false;
  if(x === y || x.includes(y) || y.includes(x)) return true;
  const lx = x.split(" ").pop(), ly = y.split(" ").pop();
  return lx.length >= 4 && ly.length >= 4 && lx.slice(-4) === ly.slice(-4);
}

/* ---------- Runde ---------- */
function anzahl(id, st){ if(id === "zeit") return [5, 6, 7][st-1]; return [5, 6, 8][st-1]; }
function neueRunde(id){
  const st = stufe();
  SP = {spiel:id, st, n:anzahl(id, st), i:0, richtig:0, serie:0, karte:null, karteVersucht:false, phase:"laden", lauf:++LAUF};
  const lauf = SP.lauf;
  zeichne();
  const fertig = () => { if(SP && SP.lauf === lauf){ SP.phase = "frage"; zeichne(); fokusStart(); } };
  const fehler = (e) => { console.warn("spielwelt", e); if(SP && SP.lauf === lauf){ SP.phase = "fehler"; zeichne(); } };
  const bau = {bild:["bilder", bauBild], reihe:["reihen", bauReihe], paare:["paare", bauPaare], zeit:["reihen", bauZeit]}[id];
  if(!bau){ SP = null; zeichne(); return; }
  lade(bau[0]).then(d => { if(SP && SP.lauf === lauf){ bau[1](d); fertig(); } }).catch(fehler);
}
/* eine Aufgabe auswerten */
function melde(ok){
  if(ok){
    SP.richtig++; SP.serie++; ton("richtig");
    if(SP.serie >= 5 && !SP.karteVersucht){
      SP.karteVersucht = true;
      /* das Album zeigt selbst ein Fenster mit der Karte und spielt den Ton */
      try{
        const runde = SP, k = window.EP_ALBUM?.karteGeben?.({});
        if(k && k.spaeter && k.fertig && typeof k.fertig.then === "function"){ runde.karte = {titel:k.titel || "Neue Wissenskarte"}; k.fertig.then(r => { if(r) runde.karte = r; }).catch(() => {}); }
        else if(k) runde.karte = k;
        else toast("5 richtig in Folge, super!");
      }catch(e){}
    }
  } else { SP.serie = 0; ton("falsch"); }
}
function weiter(){
  if(!SP) return;
  SP.i++;
  if(SP.i >= SP.n) return ende();
  if(SP.spiel === "bild") SP.bild.akt = null;
  if(SP.spiel === "zeit") SP.zeit.akt = null;
  if(SP.spiel === "reihe") reiheVorbereiten();
  SP.phase = "frage"; ton("wisch"); zeichne(); fokusStart();
}
function ende(){
  const s = stat(); s.runden = (s.runden || 0) + 1; LS.set(SK_STAT, s);
  let xp = 0; try{ xp = SP.richtig > 0 && API ? (API.xp(SP.richtig * XP_PRO) || 0) : 0; }catch(e){}
  const b = bestSpeichern(SP.spiel, SP.richtig, SP.n);
  SP.ergebnis = {xp, neu:b.neu, alt:b.alt};
  SP.phase = "ende";
  if(SP.richtig >= Math.ceil(SP.n / 2)) ton("fanfare"); else ton("xp");
  if(SP.richtig === SP.n && !ruhig()){ try{ API && API.konfetti(); }catch(e){} }
  zeichne();
  if(TASTATUR) setTimeout(() => { try{ BOX?.querySelector(".xsw-ende .xsw-knopf")?.focus({preventScroll:true}); }catch(e){} }, 30);
}

/* ---------- Zeichnen ---------- */
function zeichne(){
  if(!BOX || !BOX.isConnected) return;
  if(!SP){ BOX.innerHTML = hubHTML(); bindHub(); return; }
  const g = spielInfo(SP.spiel);
  let inhalt = "";
  if(SP.phase === "laden") inhalt = `<p class="xsw-pille xsw-mitte">Einen Moment, das Spiel wird vorbereitet …</p>`;
  else if(SP.phase === "fehler") inhalt = `<div class="xsw-box"><p>Das Spiel konnte gerade nicht geladen werden. Prüfe die Internetverbindung und versuche es nochmals.</p><button type="button" class="xsw-knopf" data-act="nochmal" data-fokus>Nochmal versuchen</button></div>`;
  else if(SP.phase === "ende") inhalt = endeHTML();
  else inhalt = SP.spiel === "bild" ? bildHTML() : SP.spiel === "reihe" ? reiheHTML() : SP.spiel === "paare" ? paareHTML() : zeitHTML();
  const paare = SP.spiel === "paare" && SP.paare;
  const fort = paare ? SP.paare.fertig.size : Math.min(SP.i + (SP.phase === "antwort" ? 1 : 0), SP.n);
  const pct = SP.phase === "ende" ? 100 : Math.round(fort / SP.n * 100);
  const nr = paare ? fort : Math.min(SP.i + 1, SP.n);
  const zaehler = SP.phase === "ende" || SP.phase === "laden" ? "" :
    `<span class="xsw-zaehler" aria-label="${paare ? `${fort} von ${SP.n} Paaren gefunden` : `Aufgabe ${nr} von ${SP.n}`}">${nr}/${SP.n}</span>`;
  BOX.innerHTML = `<div class="xsw-spiel" data-spiel="${SP.spiel}" style="--xsw-farbe:${g.farbe}">
    <div class="xsw-leiste">
      <button type="button" class="xsw-zur" data-act="hub" aria-label="Zurück zur Spielwelt">‹</button>
      <b class="xsw-titel"><span aria-hidden="true">${g.emo}</span> ${h(g.titel)}</b>
      ${zaehler}<span class="xsw-pkt" aria-label="${SP.richtig} richtig">⭐ ${SP.richtig}</span>
      <i class="xsw-balken" aria-hidden="true"><i style="width:${pct}%"></i></i>
    </div>
    <div class="xsw-buehne">${inhalt}</div>
    <p class="xsw-live" aria-live="polite"></p>
  </div>`;
  binde();
}
function live(t){ const l = BOX?.querySelector(".xsw-live"); if(l) l.textContent = t; }
/* Fokus nur setzen, wenn mit der Tastatur gespielt wird (sonst sähe es auf dem Handy wie eine Vorauswahl aus) */
let TASTATUR = false;
document.addEventListener("keydown", e => { if(e.key === "Tab" || e.key === "Enter" || e.key === " " || e.key.startsWith("Arrow")) TASTATUR = true; }, true);
document.addEventListener("pointerdown", e => { if(e.pointerType !== "") TASTATUR = false; }, true);
function fokusStart(){
  if(!TASTATUR){ try{ const a = document.activeElement; if(a && a !== document.body && !a.isConnected) document.body.focus(); }catch(e){} return; }
  setTimeout(() => {
    const el = BOX?.querySelector("[data-fokus]") || BOX?.querySelector(".xsw-buehne button:not([disabled])");
    try{ el && el.focus({preventScroll:true}); }catch(e){}
  }, 30);
}

function hubHTML(){
  const b = bestwerte(), st = stufe();
  return `<div class="x-kopf xsw-kopf"><span class="x-kopf-emo" aria-hidden="true">🎲</span><div><h1>Spielwelt</h1><p>Vier neue Spiele zum Knobeln</p></div><img src="img/kids/duo-bereit.webp" alt=""></div>
    <div class="xsw-kacheln">${SPIELE.map(s => { const w = b[s.id];
      return `<button type="button" class="xsw-kachel" data-start="${s.id}" style="background:${s.farbe}">
        <span class="xsw-k-emo" aria-hidden="true">${s.emo}</span><b>${h(s.titel)}</b><small>${h(s.text)}</small>
        <i class="xsw-best">${w ? `🏆 Bestwert ${w.r} von ${w.n}` : "Noch nicht gespielt"}</i></button>`; }).join("")}</div>
    <p class="xsw-pille xsw-info">Stufe ${h(STUFEN[st])}: ${anzahl("bild", st)} Aufgaben pro Runde, ${XP_PRO} XP für jede richtige Antwort.</p>`;
}
function bindHub(){
  BOX.querySelectorAll("[data-start]").forEach(b => b.onclick = () => { ton("klick"); neueRunde(b.dataset.start); });
}
function endeHTML(){
  const r = SP.richtig, n = SP.n, E = SP.ergebnis || {};
  const titel = r === n ? "Perfekt!" : r >= n * 0.7 ? "Super gemacht!" : r >= n * 0.4 ? "Gut gemacht!" : "Weiter so!";
  const bild = r >= n * 0.4 ? "img/kids/duo-jubel.webp" : "img/kids/duo-winken.webp";
  const best = E.neu ? `<p class="xsw-neu">🏆 Neuer Bestwert!</p>` : E.alt ? `<p>Dein Bestwert: ${E.alt.r} von ${E.alt.n}</p>` : "";
  return `<div class="xsw-ende" style="background:${spielInfo(SP.spiel).farbe}">
    <img src="${bild}" alt="" class="xsw-ende-bild">
    <h2>${titel}</h2>
    <p class="xsw-gross">${r} von ${n} richtig</p>
    ${E.xp ? `<p>+${E.xp} XP</p>` : ""}${best}
    ${SP.karte ? `<p>🃏 Neue Sammelkarte: ${h(SP.karte.titel || "")}</p>` : ""}
    <div class="xsw-knoepfe"><button type="button" class="xsw-knopf" data-act="nochmal">🔁 Nochmal</button><button type="button" class="xsw-knopf xsw-hell" data-act="hub">Zurück</button></div>
  </div>`;
}

/* gemeinsame Knöpfe */
function binde(){
  BOX.querySelectorAll("[data-act]").forEach(b => b.addEventListener("click", () => {
    const a = b.dataset.act;
    if(a === "hub"){ ton("klick"); const war = SP && SP.spiel; SP = null; LAUF++; zeichne(); if(TASTATUR) setTimeout(() => { try{ BOX?.querySelector(`[data-start="${war}"]`)?.focus({preventScroll:true}); }catch(e){} }, 30); }
    else if(a === "nochmal"){ ton("klick"); neueRunde(SP ? SP.spiel : "bild"); }
    else if(a === "weiter"){ weiter(); }
  }));
  if(!SP || (SP.phase !== "frage" && SP.phase !== "antwort")) return;
  if(SP.spiel === "bild") bindeBild();
  else if(SP.spiel === "reihe") bindeReihe();
  else if(SP.spiel === "paare") bindePaare();
  else if(SP.spiel === "zeit") bindeZeit();
}
const weiterKnopf = (txt) => `<button type="button" class="xsw-knopf xsw-weiter" data-act="weiter" data-fokus>${txt || (SP.i + 1 >= SP.n ? "Zum Ergebnis ›" : "Weiter ›")}</button>`;

/* =====================================================================
   1. Bild-Rätsel
   ===================================================================== */
function bildPool(d, st){
  const ok = e => e && e.t && (e.b || e.u);
  if(st === 1) return d.filter(e => ok(e) && e.e);
  if(st === 2) return d.filter(e => ok(e) && e.s <= 2);
  return d.filter(ok);
}
function bauBild(d){
  const pool = bildPool(Array.isArray(d) ? d : [], SP.st);
  const titel = new Set(), liste = [];
  for(const e of mische(pool)){ if(titel.has(e.t)) continue; titel.add(e.t); liste.push(e); }
  SP.bild = {pool, rest:liste, akt:null, fehler:0};
}
function bildAufgabe(){
  const B = SP.bild;
  if(B.akt) return B.akt;
  const e = B.rest.shift(); if(!e) return null;
  const gew = [];
  const dazu = x => { if(gew.length < 3 && x.t !== e.t && !aehnlich(x.t, e.t) && !gew.some(g => g.t === x.t || aehnlich(g.t, x.t))) gew.push(x); };
  mische(B.pool.filter(x => x.k === e.k)).forEach(dazu);                 // gleiches Kapitel
  if(gew.length < 3) mische(B.pool.filter(x => x.bu === e.bu)).forEach(dazu);  // gleiches Buch
  if(gew.length < 3) mische(B.pool).forEach(dazu);
  B.akt = {e, opts:mische([e.t, ...gew.map(x => x.t)]), wahl:null};
  return B.akt;
}
function bildQuelle(e){
  let breit = false; try{ breit = (innerWidth || 0) * (devicePixelRatio || 1) > 640; }catch(x){}
  if(breit && /^bilder\/gross\/[a-z0-9]{2}\/[a-z0-9]+\.webp$/.test(e.g || "")) return e.g;
  if(/^bilder\/[a-z0-9]{2}\/[a-z0-9]+\.webp$/.test(e.b || "")) return e.b;
  return /^https:\/\//.test(e.u || "") ? e.u : "";
}
function bildHTML(){
  const A = bildAufgabe();
  if(!A) return `<div class="xsw-box"><p>Für diese Stufe gibt es gerade keine weiteren Bilder.</p><button type="button" class="xsw-knopf" data-act="hub" data-fokus>Zurück</button></div>`;
  const e = A.e, beantwortet = A.wahl != null;
  const dat = /^https:\/\//.test(e.d || "") ? e.d : "";
  const nachweis = `Bild: ${h(e.a || "unbekannt")}, ${h(e.l || "")}${dat ? `, <a href="${h(dat)}" target="_blank" rel="noopener">Wikimedia Commons</a>` : ""}`;
  const gut = beantwortet && A.opts[A.wahl] === e.t;
  return `<p class="xsw-pille xsw-frage">Was ist auf dem Bild zu sehen?</p>
    <figure class="xsw-bild"><div class="xsw-rahmen"><img src="${h(bildQuelle(e))}" alt="Rätselbild" decoding="async" draggable="false"></div>
      <figcaption class="xsw-nachweis" title="${h((e.a || "") + ", " + (e.l || ""))}">${nachweis}</figcaption></figure>
    ${beantwortet ? `<div class="xsw-rueck ${gut ? "gut" : "naja"}"><span>${gut ? `Richtig, das ist <b>${h(e.t)}</b>!` : `Das ist: <b>${h(e.t)}</b>`} <small>(${h(e.kt)})</small></span>${weiterKnopf()}</div>` : ""}
    <div class="xsw-optionen" role="group" aria-label="Antworten">${A.opts.map((o, i) => {
      let cls = ""; if(beantwortet){ if(o === e.t) cls = " richtig"; else if(i === A.wahl) cls = " falsch"; }
      return `<button type="button" class="xsw-opt${cls}" data-opt="${i}" ${beantwortet ? "disabled" : ""} ${i === 0 && !beantwortet ? "data-fokus" : ""}>${h(o)}</button>`; }).join("")}</div>`;
}
function bindeBild(){
  const A = SP.bild && SP.bild.akt; if(!A) return;
  const img = BOX.querySelector(".xsw-bild img");
  if(img){
    let versuch = 0;
    const kaputt = () => {
      versuch++;
      const u = /^https:\/\//.test(A.e.u || "") ? A.e.u : "";
      if(versuch === 1 && u && img.getAttribute("src") !== u){ img.src = u; return; }
      /* Bild nicht erreichbar: ein anderes nehmen (zählt nicht als Aufgabe) */
      SP.bild.fehler++;
      if(A.wahl == null && SP.bild.fehler <= 6 && SP.bild.rest.length){ SP.bild.akt = null; zeichne(); fokusStart(); }
      else { const r = img.closest(".xsw-rahmen"); if(r) r.innerHTML = `<p class="xsw-bildfehler">Das Bild kann gerade nicht geladen werden.</p>`; }
    };
    if(!img.getAttribute("src")) kaputt(); else img.addEventListener("error", kaputt);
  }
  BOX.querySelectorAll("[data-opt]").forEach(b => b.onclick = () => {
    if(A.wahl != null) return;
    A.wahl = Number(b.dataset.opt);
    const ok = A.opts[A.wahl] === A.e.t;
    melde(ok); SP.phase = "antwort"; zeichne();
    live(ok ? "Richtig!" : "Leider nicht. Richtig ist " + A.e.t);
    fokusStart();
  });
}

/* =====================================================================
   2. Reihenfolge
   ===================================================================== */
function luecke(kat, a, b, st){
  if(a.w === b.w) return false;
  if(kat.jahr) return Math.abs(a.w - b.w) >= [60, 20, 1][st-1];
  const q = Math.max(a.w, b.w) / Math.max(Math.min(a.w, b.w), 1e-9);
  return q >= [1.6, 1.2, 1.03][st-1];
}
function vierAus(kat, st){
  for(let v = 0; v < 40; v++){
    const g = [];
    for(const e of mische(kat.eintraege)){ if(g.every(x => luecke(kat, x, e, st))) g.push(e); if(g.length === 4) return g; }
  }
  const g = []; for(const e of mische(kat.eintraege)){ if(!g.some(x => x.w === e.w)) g.push(e); if(g.length === 4) break; }
  return g;
}
function bauReihe(d){
  const st = SP.st, kats = ((d && d.kategorien) || []).filter(k => k.stufe <= st && (k.eintraege || []).length >= 4);
  if(!kats.length) throw new Error("keine Kategorien");
  const s = stat(); s.letzt = s.letzt || {};
  let folge = mische(kats); if(folge.length > 1 && folge[0].id === s.letzt.reihe) folge.push(folge.shift());
  while(folge.length < SP.n) folge = folge.concat(mische(kats));
  SP.reihe = {folge:folge.slice(0, SP.n), akt:null};
  s.letzt.reihe = SP.reihe.folge[SP.n - 1].id; LS.set(SK_STAT, s);
  reiheVorbereiten();
}
function reiheVorbereiten(){
  const kat = SP.reihe.folge[SP.i];
  const items = vierAus(kat, SP.st);
  const soll = items.slice().sort((a, b) => kat.richtung === "ab" ? b.w - a.w : a.w - b.w);
  let ord; do{ ord = mische(items.map((x, i) => i)); }while(ord.every((x, i) => items[x] === soll[i]));
  SP.reihe.akt = {kat, items, soll, ord, geprueft:false};
}
function wertText(kat, e){ if(e.t) return e.t; if(kat.jahr) return String(e.w); return zahl(e.w) + (kat.einheit ? " " + kat.einheit : ""); }
const reiheOk = R => R.ord.every((ix, i) => R.items[ix] === R.soll[i]);
function reiheHTML(){
  const R = SP.reihe.akt, k = R.kat, gp = R.geprueft, last = R.ord.length - 1;
  return `<p class="xsw-pille xsw-frage"><span aria-hidden="true">${h(k.emo || "")}</span> <b>${h(k.titel)}</b><br><span>${h(k.frage)}</span></p>
    ${gp ? reiheLoesung(R) : `<p class="xsw-tipp" aria-hidden="true">Ziehe die Karten oder tippe auf ↑ ↓</p>`}
    <ol class="xsw-liste${gp ? " fertig" : ""}" aria-label="Reihenfolge">${R.ord.map((ix, pos) => { const e = R.items[ix];
      const ok = gp && R.soll[pos] === e;
      return `<li class="xsw-karte${gp ? (ok ? " richtig" : " falsch") : ""}" data-ix="${ix}">
        <span class="xsw-nr" aria-hidden="true">${pos + 1}</span>
        <span class="xsw-name">${h(e.n)}${gp ? `<small class="xsw-wert">${h(wertText(k, e))}</small>` : ""}</span>
        ${gp ? `<span class="xsw-mark" aria-label="${ok ? "richtig" : "falsch"}">${ok ? "✓" : "✗"}</span>` :
        `<span class="xsw-pfeile"><button type="button" class="xsw-pf" data-mv="-1" aria-label="${h(e.n)} nach oben" ${pos === 0 ? "disabled" : ""}>↑</button><button type="button" class="xsw-pf" data-mv="1" aria-label="${h(e.n)} nach unten" ${pos === last ? "disabled" : ""}>↓</button></span><span class="xsw-griff" aria-hidden="true">⠿</span>`}
      </li>`; }).join("")}</ol>
    ${gp ? "" : `<button type="button" class="xsw-knopf xsw-pruefen" data-pruefen>Prüfen ✓</button>`}`;
}
function reiheLoesung(R){
  const ok = reiheOk(R);
  return `<div class="xsw-rueck ${ok ? "gut" : "naja"}"><span>${ok ? "Richtig, alles in der richtigen Reihenfolge!" :
    `So stimmt es: ${R.soll.map(e => `<b>${h(e.n)}</b>`).join(" › ")}`}</span>${weiterKnopf()}</div>`;
}
function bindeReihe(){
  const R = SP.reihe.akt; if(!R) return;
  const pr = BOX.querySelector("[data-pruefen]");
  if(pr) pr.onclick = () => {
    R.geprueft = true; const ok = reiheOk(R);
    melde(ok); SP.phase = "antwort"; zeichne();
    live(ok ? "Richtig!" : "Nicht ganz. Richtig ist: " + R.soll.map(e => e.n + " " + wertText(R.kat, e)).join(", "));
    fokusStart();
  };
  if(R.geprueft) return;
  const ol = BOX.querySelector(".xsw-liste");
  BOX.querySelectorAll(".xsw-pf").forEach(b => b.onclick = () => {
    const li = b.closest("li"), ix = Number(li.dataset.ix), pos = R.ord.indexOf(ix), mv = Number(b.dataset.mv), ziel = pos + mv;
    if(ziel < 0 || ziel >= R.ord.length) return;
    [R.ord[pos], R.ord[ziel]] = [R.ord[ziel], R.ord[pos]];
    ton("klick"); zeichne();
    const neu = BOX.querySelector(`.xsw-liste li[data-ix="${ix}"] .xsw-pf[data-mv="${mv}"]`);
    const f = neu && !neu.disabled ? neu : BOX.querySelector(`.xsw-liste li[data-ix="${ix}"] .xsw-pf:not([disabled])`);
    try{ f && f.focus({preventScroll:true}); }catch(e){}
    live(R.items[ix].n + " ist jetzt auf Platz " + (ziel + 1));
  });
  /* Ziehen mit Maus, Finger oder Stift (Pointer Events, touch-action:none auf den Karten) */
  let zug = null;
  ol.querySelectorAll("li").forEach(li => {
    li.addEventListener("pointerdown", ev => {
      if(ev.button > 0 || ev.target.closest("button") || zug) return;
      ev.preventDefault();
      try{ li.setPointerCapture(ev.pointerId); }catch(e){}
      zug = {li, id:ev.pointerId, y0:ev.clientY, top0:li.offsetTop, bewegt:false};
      li.classList.add("zieht");
    });
    li.addEventListener("pointermove", ev => {
      if(!zug || zug.li !== li || ev.pointerId !== zug.id) return;
      ev.preventDefault();
      if(Math.abs(ev.clientY - zug.y0) > 4) zug.bewegt = true;
      const vor = li.previousElementSibling, nach = li.nextElementSibling;
      const mitte = el => { const r = el.getBoundingClientRect(); return r.top + r.height / 2; };
      if(nach && ev.clientY > mitte(nach)) ol.insertBefore(nach, li);
      else if(vor && ev.clientY < mitte(vor)) ol.insertBefore(vor, nach);   /* nie die gezogene Karte selbst umhängen, sonst geht der Pointer-Capture verloren */
      li.style.transform = `translateY(${ev.clientY - zug.y0 - (li.offsetTop - zug.top0)}px)`;
    });
    const los = () => {
      if(!zug || zug.li !== li) return;
      zug = null;
      li.classList.remove("zieht"); li.style.transform = "";
      const neu = [...ol.children].map(x => Number(x.dataset.ix));
      const anders = neu.some((x, i) => x !== R.ord[i]);
      R.ord = neu;
      if(anders){ ton("klick"); zeichne(); live("Neue Reihenfolge: " + R.ord.map(ix => R.items[ix].n).join(", ")); }
    };
    li.addEventListener("pointerup", los);
    li.addEventListener("pointercancel", los);
  });
}

/* =====================================================================
   3. Zuordnen
   ===================================================================== */
function paarSaetze(d, st){
  const L = [];
  const kt = (d && d.kantone) || [];
  ((d && d.saetze) || []).forEach(s => { if((s.stufe || 1) <= st) L.push({id:s.id, titel:s.titel, links:s.links, rechts:s.rechts,
    paare:(s.paare || []).map(p => ({l:p.l, r:p.r, f:p.f, e:p.e}))}); });
  /* Profis und Könner: nur Kantone, deren Hauptort anders heisst */
  L.push({id:"hauptort", titel:"Kanton und Hauptort", links:"Kanton", rechts:"Hauptort",
    paare:kt.filter(k => st === 1 || norm(k.name).split(" ")[0] !== norm(k.ort).split(" ")[0]).map(k => ({l:k.name, r:k.ort}))});
  if(typeof window.wappen === "function") L.push({id:"wappen", titel:"Kanton und Wappen", links:"Wappen", rechts:"Kanton",
    paare:kt.map(k => ({l:k.name, r:k.name, w:k.k, nurWappen:true}))});
  return L.filter(s => s.paare.length >= anzahl("paare", st));
}
function bauPaare(d){
  const saetze = paarSaetze(d, SP.st);
  if(!saetze.length) throw new Error("keine Paare");
  const s = stat(); s.letzt = s.letzt || {};
  let auswahl = saetze.filter(x => x.id !== s.letzt.paare); if(!auswahl.length) auswahl = saetze;
  const satz = wahl(auswahl); s.letzt.paare = satz.id; LS.set(SK_STAT, s);
  const gew = []; for(const p of mische(satz.paare)){ if(!gew.some(g => norm(g.r) === norm(p.r) || norm(g.l) === norm(p.l))) gew.push(p); if(gew.length === SP.n) break; }
  SP.n = gew.length;
  SP.paare = {satz, paare:gew, links:mische(gew.map((p, i) => i)), rechts:mische(gew.map((p, i) => i)), fertig:new Set(), fehler:new Set(), wahl:null, wackel:null};
}
function linksInhalt(p, pos){
  if(p.nurWappen){ let w = ""; try{ w = window.wappen(p.w, "xsw-wappen"); }catch(e){} return `<span class="xsw-wap" aria-hidden="true">${w}</span><span class="xsw-sr">Wappen ${pos + 1}</span>`; }
  const fl = p.f && /^[a-z]{2}$/.test(p.f) ? `<img class="xsw-flagge" src="flags/${p.f}.svg" alt="" draggable="false">` : "";
  const em = p.e ? `<span class="xsw-em" aria-hidden="true">${h(p.e)}</span>` : "";
  return fl + em + `<span>${h(p.l)}</span>`;
}
function paareHTML(){
  const P = SP.paare, satz = P.satz;
  const zelle = (seite, i, pos) => { const p = P.paare[i]; const f = P.fertig.has(i);
    const gew = P.wahl && P.wahl.seite === seite && P.wahl.i === i;
    const wack = P.wackel && P.wackel[seite] === i;
    const inhalt = seite === "l" ? linksInhalt(p, pos) : `<span>${h(p.r)}</span>`;
    return `<button type="button" class="xsw-zelle xsw-${seite}${f ? " fertig" : ""}${gew ? " gewaehlt" : ""}${wack ? " wackel" : ""}" data-seite="${seite}" data-i="${i}" ${f ? "disabled" : ""} aria-pressed="${gew ? "true" : "false"}">${f ? `<span class="xsw-hak" aria-hidden="true">✓</span>` : ""}${inhalt}</button>`; };
  const fertig = P.fertig.size === P.paare.length;
  return `${fertig ? `<div class="xsw-rueck gut"><span>Alle Paare gefunden!${P.fehler.size ? ` ${P.paare.length - P.fehler.size} davon beim ersten Versuch.` : " Alle beim ersten Versuch!"}</span>${weiterKnopf("Zum Ergebnis ›")}</div>` :
      `<p class="xsw-pille xsw-frage"><b>${h(satz.titel)}</b><br><span>Tippe links, dann rechts, oder ziehe hinüber</span></p>`}
    <div class="xsw-paare${P.paare.length > 6 ? " eng" : ""}">
      <div class="xsw-spalte" role="group" aria-label="${h(satz.links)}">${P.links.map((i, pos) => zelle("l", i, pos)).join("")}</div>
      <div class="xsw-spalte" role="group" aria-label="${h(satz.rechts)}">${P.rechts.map((i, pos) => zelle("r", i, pos)).join("")}</div>
    </div>`;
}
function paarPruefen(li, re){
  const P = SP.paare;
  if(P.fertig.has(li) || P.fertig.has(re)) return;
  if(li === re){
    P.fertig.add(li); P.wahl = null; P.wackel = null;
    if(P.fehler.has(li)){ ton("richtig"); } else melde(true);
    live("Richtig: " + P.paare[li].l + " und " + P.paare[li].r);
  } else {
    P.fehler.add(li); P.wahl = null; P.wackel = {l:li, r:re};
    melde(false);
    live("Das passt nicht zusammen. Versuche es nochmals.");
    setTimeout(() => { if(SP && SP.paare === P && P.wackel && P.wackel.l === li){ P.wackel = null; BOX?.querySelectorAll(".wackel").forEach(x => x.classList.remove("wackel")); } }, 650);
  }
  const alle = P.fertig.size === P.paare.length;
  if(alle){ SP.phase = "antwort"; SP.i = SP.n - 1; }   /* «Weiter» führt zum Ergebnis */
  zeichne();
  const fokus = alle ? BOX.querySelector("[data-fokus]") : BOX.querySelector(`.xsw-zelle.xsw-l:not([disabled])`);
  if(TASTATUR){ try{ fokus && fokus.focus({preventScroll:true}); }catch(e){} }
}
function bindePaare(){
  const P = SP.paare; if(!P) return;
  let unterdruecken = false;
  BOX.querySelectorAll(".xsw-zelle").forEach(b => b.addEventListener("click", () => {
    if(unterdruecken){ unterdruecken = false; return; }
    const seite = b.dataset.seite, i = Number(b.dataset.i);
    if(P.fertig.has(i)) return;
    if(P.wahl && P.wahl.seite !== seite){ const li = seite === "l" ? i : P.wahl.i, re = seite === "r" ? i : P.wahl.i; paarPruefen(li, re); return; }
    P.wahl = (P.wahl && P.wahl.seite === seite && P.wahl.i === i) ? null : {seite, i};
    ton("klick");
    BOX.querySelectorAll(".xsw-zelle").forEach(x => { const g = P.wahl && x.dataset.seite === P.wahl.seite && Number(x.dataset.i) === P.wahl.i; x.classList.toggle("gewaehlt", !!g); x.setAttribute("aria-pressed", g ? "true" : "false"); });
  }));
  /* Ziehen von links nach rechts (zusätzlich zum Tippen) */
  BOX.querySelectorAll(".xsw-zelle.xsw-l:not([disabled])").forEach(b => {
    let z = null;
    b.addEventListener("pointerdown", ev => { if(ev.button > 0) return; z = {x:ev.clientX, y:ev.clientY, id:ev.pointerId, geist:null, ziel:null}; try{ b.setPointerCapture(ev.pointerId); }catch(e){} });
    b.addEventListener("pointermove", ev => {
      if(!z || ev.pointerId !== z.id) return;
      if(!z.geist){
        if(Math.hypot(ev.clientX - z.x, ev.clientY - z.y) < 10) return;
        z.geist = document.createElement("div"); z.geist.className = "xsw-geist"; z.geist.innerHTML = b.innerHTML;
        z.geist.setAttribute("aria-hidden", "true");
        document.body.appendChild(z.geist); b.classList.add("gewaehlt");
      }
      ev.preventDefault();
      z.geist.style.left = ev.clientX + "px"; z.geist.style.top = ev.clientY + "px";
      const unter = document.elementFromPoint(ev.clientX, ev.clientY);
      const ziel = unter && unter.closest ? unter.closest(".xsw-zelle.xsw-r:not([disabled])") : null;
      if(z.ziel !== ziel){ z.ziel && z.ziel.classList.remove("ueber"); z.ziel = ziel; ziel && ziel.classList.add("ueber"); }
    });
    const los = ev => {
      if(!z) return; const g = z.geist, ziel = z.ziel; z = null;
      if(!g) return;
      g.remove(); unterdruecken = true; setTimeout(() => { unterdruecken = false; }, 80);
      b.classList.remove("gewaehlt"); ziel && ziel.classList.remove("ueber");
      if(ziel && ev.type === "pointerup") paarPruefen(Number(b.dataset.i), Number(ziel.dataset.i));
    };
    b.addEventListener("pointerup", los); b.addEventListener("pointercancel", los);
  });
}

/* =====================================================================
   4. Zeitstrahl
   ===================================================================== */
function bauZeit(d){
  const quellen = ((d && d.kategorien) || []).filter(k => k.id === "geschichte" || k.id === "erfindungen");
  const alle = []; quellen.forEach(k => k.eintraege.forEach(e => alle.push({n:e.n, w:e.w, t:e.t, kat:k.titel, emo:k.emo})));
  const abstand = [40, 10, 1][SP.st - 1], brauch = SP.n + 1;
  let best = [];
  for(let v = 0; v < 60 && best.length < brauch; v++){
    const gew = []; for(const e of mische(alle)){ if(gew.every(x => Math.abs(x.w - e.w) >= abstand)) gew.push(e); if(gew.length === brauch) break; }
    if(gew.length > best.length) best = gew;
  }
  if(best.length < 2) throw new Error("zu wenig Ereignisse");
  if(best.length < brauch) SP.n = best.length - 1;
  SP.zeit = {gelegt:[best[0]], stapel:best.slice(1), akt:null, letzt:null};
}
function zeitHTML(){
  const Z = SP.zeit;
  if(!Z.akt) Z.akt = Z.stapel[SP.i];
  const neu = Z.akt, beantwortet = SP.phase === "antwort";
  const jahr = e => e.t || String(e.w);
  let oben;
  if(beantwortet){
    const L = Z.letzt;
    oben = `<div class="xsw-rueck ${L.ok ? "gut" : "naja"}"><span>${L.ok ? `Richtig! <b>${h(neu.n)}</b>: ${h(jahr(neu))}` : `Fast! <b>${h(neu.n)}</b> war ${h(jahr(neu))}. Die Karte liegt jetzt am richtigen Platz.`}</span>${weiterKnopf()}</div>`;
  } else {
    oben = `<div class="xsw-neukarte" role="note" aria-label="Neue Karte: ${h(neu.n)}"><small>${h(neu.emo || "")} ${h(neu.kat)}</small><b>${h(neu.n)}</b><span class="xsw-zieh" aria-hidden="true">Tippe auf ＋ oder ziehe die Karte dorthin</span></div>`;
  }
  const g = Z.gelegt; let html = "";
  const slot = (p) => { const vor = g[p - 1], nach = g[p];
    const lab = !vor ? `Vor «${nach.n}» einfügen` : !nach ? `Nach «${vor.n}» einfügen` : `Zwischen «${vor.n}» und «${nach.n}» einfügen`;
    return beantwortet ? `<span class="xsw-luecke" aria-hidden="true"></span>` : `<button type="button" class="xsw-slot" data-slot="${p}" aria-label="${h(lab)}" ${p === 0 ? "data-fokus" : ""}><span aria-hidden="true">＋</span></button>`; };
  for(let p = 0; p <= g.length; p++){
    html += slot(p);
    if(p < g.length){ const e = g[p]; const cls = beantwortet && e === neu ? (Z.letzt.ok ? " neu-ok" : " neu-fix") : "";
      html += `<div class="xsw-zk${cls}"><b>${h(jahr(e))}</b><span>${h(e.n)}</span></div>`; }
  }
  return `<div class="xsw-zeitoben">${oben}</div>
    <div class="xsw-strahl" role="group" aria-label="Zeitstrahl, früher oben, später unten"><span class="xsw-pfeil-o" aria-hidden="true">▲ früher</span>${html}<span class="xsw-pfeil-u" aria-hidden="true">▼ später</span></div>`;
}
function zeitLegen(p){
  const Z = SP.zeit, neu = Z.akt; if(!neu || SP.phase !== "frage") return;
  const richtigPos = Z.gelegt.filter(e => e.w < neu.w).length;
  const ok = p === richtigPos;
  Z.gelegt.splice(richtigPos, 0, neu);
  Z.letzt = {ok, p};
  melde(ok); SP.phase = "antwort"; zeichne();
  live(ok ? "Richtig! " + neu.n + " " + neu.w : "Fast. " + neu.n + " war " + neu.w + ".");
  fokusStart();
}
function bindeZeit(){
  BOX.querySelectorAll("[data-slot]").forEach(b => b.onclick = () => zeitLegen(Number(b.dataset.slot)));
  const k = BOX.querySelector(".xsw-neukarte"); if(!k) return;
  let z = null;
  k.addEventListener("pointerdown", ev => { if(ev.button > 0) return; ev.preventDefault(); z = {x:ev.clientX, y:ev.clientY, id:ev.pointerId, ziel:null, an:false}; try{ k.setPointerCapture(ev.pointerId); }catch(e){} });
  k.addEventListener("pointermove", ev => {
    if(!z || ev.pointerId !== z.id) return;
    const dx = ev.clientX - z.x, dy = ev.clientY - z.y;
    if(!z.an && Math.hypot(dx, dy) < 8) return;
    ev.preventDefault();
    z.an = true; k.classList.add("zieht"); k.style.transform = `translate(${dx}px,${dy}px)`;
    /* nächster Einfügeplatz zum Finger */
    let best = null, bd = 1e9;
    BOX.querySelectorAll("[data-slot]").forEach(s => { const r = s.getBoundingClientRect(); const d = Math.abs(r.top + r.height / 2 - ev.clientY); if(d < bd){ bd = d; best = s; } });
    if(best !== z.ziel){ z.ziel && z.ziel.classList.remove("ueber"); z.ziel = best; best && best.classList.add("ueber"); }
  });
  const los = ev => {
    if(!z) return; const zz = z; z = null;
    k.classList.remove("zieht"); k.style.transform = "";
    zz.ziel && zz.ziel.classList.remove("ueber");
    if(zz.an && zz.ziel && ev.type === "pointerup") zeitLegen(Number(zz.ziel.dataset.slot));
  };
  k.addEventListener("pointerup", los); k.addEventListener("pointercancel", los);
}

/* ---------- Stil ---------- */
function stil(){
  if(document.getElementById("ep-x-spielwelt")) return;
  const c = document.createElement("style"); c.id = "ep-x-spielwelt";
  c.textContent = `
.xsw-kopf{background:linear-gradient(135deg,#C2410C,#9C36B5 55%,#1864AB)!important}
.xsw-kacheln{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px}
.xsw-kachel{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:4px;text-align:left;border:0;border-radius:24px;padding:18px 18px 14px;min-height:150px;color:#fff;cursor:pointer;box-shadow:0 10px 22px rgba(27,34,64,.22);transition:transform .15s;font:inherit}
.xsw-kachel:hover{transform:translateY(-2px)}
.xsw-kachel:focus-visible,.xsw-spiel button:focus-visible,.xsw-spiel a:focus-visible{outline:3px solid #FFE34D;outline-offset:3px}
.xsw-k-emo{font-size:2.1rem;line-height:1}
.xsw-kachel b{font-size:1.2rem;color:#fff}
.xsw-kachel small{font-size:.88rem;color:#fff;opacity:.95;line-height:1.3}
.xsw-best{margin-top:auto;font-style:normal;font-size:.78rem;font-weight:800;background:rgba(0,0,0,.22);color:#fff;padding:4px 10px;border-radius:999px}
.xsw-pille{background:rgba(15,20,48,.62);color:#fff;border-radius:18px;padding:8px 14px;margin:0;line-height:1.3}
.xsw-info{margin-top:14px;font-size:.9rem;display:inline-block}
.xsw-mitte{text-align:center;margin:30px auto;display:block;max-width:420px}
.xsw-spiel{display:flex;flex-direction:column;gap:10px;max-width:760px;margin:0 auto}
.xsw-leiste{position:relative;display:flex;align-items:center;gap:8px;background:var(--xsw-farbe);color:#fff;border-radius:22px;padding:6px 12px 11px 6px;box-shadow:0 8px 18px rgba(27,34,64,.2)}
.xsw-zur{flex:none;width:40px;height:40px;border-radius:50%;border:0;background:rgba(255,255,255,.22);color:#fff;font-size:1.6rem;line-height:1;cursor:pointer;padding:0 0 3px}
.xsw-titel{flex:1;min-width:0;font-size:1.05rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#fff}
.xsw-zaehler,.xsw-pkt{flex:none;font-weight:800;background:rgba(0,0,0,.2);border-radius:999px;padding:4px 10px;font-size:.9rem;color:#fff}
.xsw-balken{position:absolute;left:16px;right:16px;bottom:4px;height:4px;border-radius:4px;background:rgba(255,255,255,.25);overflow:hidden}
.xsw-balken i{display:block;height:100%;background:#FFE34D;border-radius:4px;transition:width .3s}
.xsw-buehne{display:flex;flex-direction:column;gap:10px}
.xsw-frage{font-size:1rem;text-align:center}
.xsw-frage span{opacity:.92;font-size:.92rem}
.xsw-tipp{margin:-2px auto;text-align:center;font-size:.8rem;color:#fff;font-weight:700;background:rgba(15,20,48,.45);border-radius:999px;padding:2px 12px}
.xsw-box{background:rgba(15,20,48,.62);color:#fff;border-radius:22px;padding:18px;text-align:center}
.xsw-knopf{border:0;border-radius:999px;padding:12px 20px;font:inherit;font-weight:800;font-size:1rem;cursor:pointer;background:#1B2240;color:#fff;box-shadow:0 6px 14px rgba(27,34,64,.25);min-height:46px}
.xsw-knopf.xsw-hell{background:#fff;color:#1B2240}
.xsw-pruefen{align-self:center;background:var(--xsw-farbe);min-width:180px}
.xsw-rueck{display:flex;align-items:center;gap:8px 10px;flex-wrap:wrap;justify-content:space-between;border-radius:18px;padding:8px 10px 8px 14px;color:#fff;line-height:1.3}
.xsw-rueck>span{flex:1 1 170px;font-size:.93rem}
.xsw-rueck.gut{background:#0B7A55}
.xsw-rueck.naja{background:#9A4A08}
.xsw-rueck .xsw-knopf{flex:none;white-space:nowrap;background:#fff;color:#1B2240;padding:8px 18px;min-height:42px;margin-left:auto}
.xsw-rueck small{opacity:.9}
/* Bild-Rätsel */
.xsw-bild{margin:0;display:flex;flex-direction:column;align-items:center;gap:3px}
.xsw-rahmen{width:100%;height:clamp(150px,33vh,380px);border-radius:22px;overflow:hidden;background:rgba(15,20,48,.55);box-shadow:0 10px 22px rgba(27,34,64,.22);display:flex;align-items:center;justify-content:center}
.xsw-rahmen img{width:100%;height:100%;object-fit:contain;display:block;-webkit-user-drag:none;user-select:none}
.xsw-bildfehler{color:#fff;padding:16px;text-align:center}
.xsw-nachweis{font-size:.68rem;line-height:1.25;color:#fff;background:rgba(15,20,48,.55);padding:2px 10px;border-radius:999px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;box-sizing:border-box}
.xsw-nachweis a{color:#fff;text-decoration:underline}
.xsw-optionen{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.xsw-opt{border:0;border-radius:18px;min-height:54px;padding:8px 10px;font:inherit;font-weight:800;font-size:.98rem;line-height:1.2;color:#fff;background:rgba(15,20,48,.74);cursor:pointer;box-shadow:0 6px 14px rgba(27,34,64,.18);overflow-wrap:anywhere}
.xsw-opt:not([disabled]):hover{background:rgba(15,20,48,.86)}
.xsw-opt.richtig{background:#0B7A55;opacity:1}
.xsw-opt.falsch{background:#9A4A08;opacity:1}
.xsw-opt[disabled]:not(.richtig):not(.falsch){opacity:.7}
/* Reihenfolge */
.xsw-liste{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px;position:relative}
.xsw-karte{display:flex;align-items:center;gap:10px;min-height:56px;padding:6px 8px 6px 10px;border-radius:18px;background:var(--xsw-farbe);color:#fff;box-shadow:0 6px 14px rgba(27,34,64,.2);touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;cursor:grab;position:relative;box-sizing:border-box}
.xsw-liste.fertig .xsw-karte{cursor:default;touch-action:auto}
.xsw-karte.zieht{z-index:5;cursor:grabbing;box-shadow:0 16px 30px rgba(27,34,64,.35)}
.xsw-nr{flex:none;width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.25);display:flex;align-items:center;justify-content:center;font-weight:800}
.xsw-name{flex:1;min-width:0;font-weight:800;font-size:1rem;line-height:1.2;display:flex;flex-direction:column}
.xsw-wert{font-weight:700;font-size:.85rem;opacity:.95}
.xsw-pfeile{display:flex;gap:6px;flex:none}
.xsw-pf{width:40px;height:40px;border-radius:12px;border:0;background:rgba(255,255,255,.22);color:#fff;font-size:1.2rem;font-weight:800;cursor:pointer;padding:0}
.xsw-pf[disabled]{opacity:.35;cursor:default}
.xsw-griff{flex:none;font-size:1.3rem;opacity:.8;width:16px;text-align:center}
.xsw-karte.richtig{background:#0B7A55}
.xsw-karte.falsch{background:#9A4A08}
.xsw-mark{flex:none;font-size:1.3rem;font-weight:800;width:28px;text-align:center}
/* Zuordnen */
.xsw-paare{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px}
.xsw-spalte{display:flex;flex-direction:column;gap:7px;min-width:0}
.xsw-zelle{position:relative;display:flex;align-items:center;justify-content:center;gap:6px;min-height:50px;padding:6px 8px;border-radius:16px;border:3px solid transparent;font:inherit;font-weight:800;font-size:.92rem;line-height:1.15;color:#fff;cursor:pointer;box-shadow:0 5px 12px rgba(27,34,64,.18);overflow-wrap:break-word;-webkit-hyphens:auto;hyphens:auto;text-align:center;box-sizing:border-box}
.xsw-zelle.xsw-l{background:var(--xsw-farbe);touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
.xsw-zelle.xsw-r{background:rgba(15,20,48,.74)}
.xsw-paare.eng .xsw-zelle{min-height:44px;font-size:.86rem;padding:4px 6px}
.xsw-zelle.gewaehlt{border-color:#FFE34D;transform:scale(1.03)}
.xsw-zelle.ueber{border-color:#FFE34D;background:#26357A}
.xsw-zelle.fertig{background:#0B7A55;opacity:.85;cursor:default;box-shadow:none}
.xsw-zelle.wackel{background:#9A4A08;animation:xsWackel .4s}
.xsw-hak{position:absolute;top:2px;right:6px;font-size:.8rem}
.xsw-flagge{width:26px;height:19px;object-fit:cover;border-radius:3px;flex:none;box-shadow:0 0 0 1px rgba(255,255,255,.5)}
.xsw-em{font-size:1.2rem;flex:none}
.xsw-paare.eng .xsw-em{font-size:1rem}
.xsw-zelle>span{min-width:0}
.xsw-wap{display:flex;align-items:center;justify-content:center;height:38px}
.xsw-wap svg,.xsw-wap img{height:38px!important;width:auto!important;max-width:60px}
.xsw-paare.eng .xsw-wap,.xsw-paare.eng .xsw-wap svg,.xsw-paare.eng .xsw-wap img{height:30px!important}
.xsw-paare.eng .xsw-spalte{gap:6px}
.xsw-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.xsw-geist{position:fixed;z-index:9999;pointer-events:none;transform:translate(-50%,-70%);background:#1B2240;color:#fff;border-radius:14px;padding:6px 12px;font-weight:800;box-shadow:0 12px 26px rgba(0,0,0,.3);display:flex;align-items:center;gap:6px;max-width:200px}
.xsw-geist .xsw-wap svg,.xsw-geist .xsw-wap img{height:30px!important}
@keyframes xsWackel{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
/* Zeitstrahl */
.xsw-zeitoben{min-height:72px;display:flex;flex-direction:column;justify-content:center}
.xsw-neukarte{display:flex;flex-direction:column;gap:2px;align-items:center;text-align:center;padding:9px 14px;border-radius:20px;background:var(--xsw-farbe);color:#fff;box-shadow:0 10px 22px rgba(27,34,64,.25);touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;cursor:grab;position:relative;z-index:3}
.xsw-neukarte.zieht{cursor:grabbing;box-shadow:0 18px 34px rgba(27,34,64,.4);opacity:.95}
.xsw-neukarte b{font-size:1.05rem;line-height:1.2}
.xsw-neukarte small{opacity:.9;font-size:.78rem}
.xsw-zieh{font-size:.72rem;opacity:.85}
.xsw-strahl{position:relative;display:flex;flex-direction:column;align-items:stretch;padding:0 0 0 20px}
.xsw-strahl::before{content:"";position:absolute;left:7px;top:10px;bottom:10px;width:4px;border-radius:4px;background:linear-gradient(#5F3DC4,#9C36B5)}
.xsw-pfeil-o,.xsw-pfeil-u{font-size:.68rem;font-weight:800;color:#fff;background:rgba(15,20,48,.55);border-radius:999px;padding:1px 8px;align-self:flex-start}
.xsw-zk{display:flex;align-items:center;gap:10px;min-height:34px;padding:4px 12px;border-radius:14px;background:rgba(15,20,48,.76);color:#fff;font-size:.86rem;line-height:1.15;box-shadow:0 4px 10px rgba(27,34,64,.15)}
.xsw-zk b{flex:none;min-width:40px;font-size:.95rem;color:#FFE34D}
.xsw-zk.neu-ok{background:#0B7A55}
.xsw-zk.neu-fix{background:#9A4A08}
.xsw-zk.neu-ok b,.xsw-zk.neu-fix b{color:#fff}
.xsw-slot{display:flex;align-items:center;justify-content:center;height:24px;margin:2px 0;border:2px dashed rgba(95,61,196,.75);border-radius:999px;background:rgba(255,255,255,.8);color:#5F3DC4;font-weight:900;font-size:.95rem;cursor:pointer;padding:0;font-family:inherit}
.xsw-slot:hover,.xsw-slot.ueber{background:#FFE34D;border-color:#5F3DC4;border-style:solid}
.xsw-luecke{display:block;height:6px}
/* Ergebnis */
.xsw-ende{position:relative;border-radius:28px;color:#fff;text-align:center;padding:14px 18px 20px;box-shadow:0 14px 30px rgba(60,40,140,.25);display:flex;flex-direction:column;align-items:center;gap:4px}
.xsw-ende-bild{height:clamp(110px,24vh,200px);width:auto;max-width:100%;object-fit:contain}
.xsw-ende h2{margin:4px 0 0;color:#fff;font-size:1.6rem}
.xsw-ende p{margin:2px 0;color:#fff}
.xsw-gross{font-size:1.3rem;font-weight:800}
.xsw-neu{font-weight:800;background:rgba(0,0,0,.2);border-radius:999px;padding:3px 12px}
.xsw-knoepfe{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:10px}
.xsw-live{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);margin:0}
@media (max-width:520px){
  .xsw-kacheln{grid-template-columns:1fr 1fr;gap:10px}
  .xsw-kachel{min-height:140px;padding:14px 12px 12px;border-radius:22px}
  .xsw-kachel b{font-size:1.02rem}
  .xsw-kachel small{font-size:.8rem}
  .xsw-best{font-size:.7rem;padding:3px 8px}
  .xsw-kopf>div{padding-right:110px}
  .xsw-opt{min-height:50px;font-size:.92rem}
  .xsw-zelle{font-size:.86rem}
}
@media (max-height:760px){
  .xsw-spiel{gap:7px}
  .xsw-buehne{gap:7px}
  .xsw-leiste{padding:4px 10px 10px 4px}
  .xsw-zur{width:36px;height:36px}
  .xsw-frage{padding:6px 12px;font-size:.92rem}
  .xsw-karte{min-height:50px}
  .xsw-zk{min-height:30px;font-size:.8rem;padding:3px 10px}
  .xsw-slot{height:20px;margin:1px 0}
  .xsw-zeitoben{min-height:64px}
  .xsw-neukarte{padding:7px 12px}
  .xsw-paare.eng .xsw-zelle{min-height:40px;padding:2px 6px}
  .xsw-paare.eng .xsw-wap,.xsw-paare.eng .xsw-wap svg,.xsw-paare.eng .xsw-wap img{height:26px!important}
  .xsw-paare.eng .xsw-spalte{gap:5px}
  .xsw-opt{min-height:46px}
}
@media (prefers-reduced-motion:reduce){
  .xsw-kachel,.xsw-balken i{transition:none}
  .xsw-kachel:hover{transform:none}
  .xsw-zelle.wackel{animation:none}
  .xsw-zelle.gewaehlt{transform:none}
}`;
  document.head.appendChild(c);
}

/* ---------- Anmelden ---------- */
window.EP_SPIELWELT = {
  bestwerte,
  spiele(){ return SPIELE.map(s => ({id:s.id, titel:s.titel, emo:s.emo})); },
  runden(){ return stat().runden || 0; },
  oeffne(id){ START = SPIELE.some(s => s.id === id) ? id : null; try{ go("x-spielwelt"); }catch(e){} }
};

window.EP_EXTRAS.register({
  id:"spielwelt", titel:"Spielwelt", text:"Bild-Rätsel, Reihenfolge, Zuordnen und Zeitstrahl", emo:"🎲",
  farbe:"linear-gradient(135deg,#C2410C,#9C36B5 55%,#1864AB)", reihe:40,
  hinweis(){ const b = bestwerte(); return SPIELE.some(s => b[s.id]) ? "" : "Neu"; },
  render(box, api){
    stil(); BOX = box; API = api;
    if(START){ const id = START; START = null; neueRunde(id); return; }
    zeichne();
  }
});
})();
