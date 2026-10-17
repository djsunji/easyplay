/* easyplay: Sammelalbum mit Wissenskarten (Welt «album», Seite x-album)
   Karten stammen aus der Bibliothek (Seiten mit lokalem Bild) und liegen kompakt in welten/album/karten.json.
   Die Datei wird erst beim ersten Bedarf geladen (Album öffnen, erste Quizantwort, karteGeben).

   Karten verdienen:
   - je 5 richtige Antworten im Quiz eine Karte (passend zum Thema der Frage, sonst zufällig)
   - Quiz mit mindestens 5 Fragen und mindestens 80 % richtig: eine Bonus-Karte
   - doppelte Karten zählen als «Doppelte»; 5 Doppelte kann man gegen eine neue Karte tauschen

   Schnittstelle für andere Welten:
     window.EP_ALBUM.karteGeben({thema?, selten?, leise?}) → {id, titel, bild, seltenheit, doppelt} oder null
         (ist die Kartenliste noch nicht geladen, kommt ein vorläufiges Objekt {spaeter:true, fertig:Promise} zurück)
     window.EP_ALBUM.anzahl() → {hat, alle}
     window.EP_ALBUM.laden() → Promise (Kartenliste laden)
     window.EP_ALBUM.neu() → Anzahl ungesehener Karten
   Ereignis: document "ep:albumkarte" detail {id, titel, bild, seltenheit, doppelt}
   Speicher: ep-x-album-v1 (Sammlung), ep-x-album-ansicht (Filter) */
(function(){
"use strict";
if(!window.EP_EXTRAS || typeof window.EP_EXTRAS.register !== "function") return;

const DATEI = "welten/album/karten.json";
const KEY = "ep-x-album-v1", KEY_ANSICHT = "ep-x-album-ansicht";
const ALLE_FALLBACK = 1024;
const PRO_KARTE = 5, TAUSCH = 5;

const LS = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};
const h = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const ruhig = () => { try{ return matchMedia("(prefers-reduced-motion: reduce)").matches; }catch(e){ return false; } };
const ton = n => { try{ window.EP_SOUND?.play(n); }catch(e){} };
const bildschirm = () => { try{ return S.screen; }catch(e){ return ""; } };

/* ---------- Zustand ---------- */
function stand(){
  const s = LS.get(KEY, null) || {};
  return { h: s.h && typeof s.h === "object" ? s.h : {}, neu: Array.isArray(s.neu) ? s.neu : [], d: +s.d || 0, z: +s.z || 0, n: +s.n || 0 };
}
let ST = stand();
const speichern = () => LS.set(KEY, ST);
addEventListener("storage", e => { if(e.key === KEY) ST = stand(); });

/* ---------- Kartenliste ---------- */
let POOL = null, POOLP = null;
function seltenheit(id){
  let x = 2166136261; for(const c of String(id)){ x ^= c.charCodeAt(0); x = Math.imul(x, 16777619); }
  const r = ((x >>> 0) % 1000) / 10;
  return r < 7 ? "glaenzend" : r < 27 ? "selten" : "gewoehnlich";
}
const SELTEN_NAME = { gewoehnlich:"Gewöhnlich", selten:"Selten", glaenzend:"Glänzend" };
const bildKlein = id => "bilder/" + id.slice(-2) + "/" + id + ".webp";
const bildGross = id => "bilder/gross/" + id.slice(-2) + "/" + id + ".webp";

function laden(){
  if(POOL) return Promise.resolve(POOL);
  if(!POOLP) POOLP = fetch(DATEI, {cache:"force-cache"}).then(r => r.ok ? r.json() : null).catch(() => null).then(j => {
    if(!j || !Array.isArray(j.k)){ POOLP = null; return null; }
    const kap = j.kap || [], liz = j.liz || [];
    const liste = j.k.map((c, i) => {
      const [id, titel, ki, thema, urheber, li, datei, fakt] = c; const k = kap[ki] || [];
      return { id, titel, buch:k[0] || "", kapId:k[1] || "", kapitel:k[2] || "", thema: thema || k[1] || "", urheber, lizenz: liz[li] || "",
        datei: String(datei || "").startsWith("c:") ? "https://commons.wikimedia.org/wiki/File:" + String(datei).slice(2) : String(datei || ""),
        fakt, nr: i + 1, selten: seltenheit(id) };
    });
    POOL = { liste, map: new Map(liste.map(k => [k.id, k])) };
    const neuGut = ST.neu.filter(id => POOL.map.has(id));
    if(ST.n !== liste.length || neuGut.length !== ST.neu.length){ ST.n = liste.length; ST.neu = neuGut; speichern(); }
    return POOL;
  });
  return POOLP;
}

function bereichVon(themaId){ try{ return (THEMA[themaId] && THEMA[themaId].bereich && THEMA[themaId].bereich.id) || ""; }catch(e){ return ""; } }
const zufall = a => a[Math.floor(Math.random() * a.length)];

/* Karte ziehen: meistens gewöhnlich, manchmal selten, ab und zu glänzend */
function ziehen(opt){
  const L = POOL.liste; opt = opt || {};
  let kand = L;
  if(opt.nurNeu) kand = L.filter(k => !ST.h[k.id]);
  else if(opt.thema){
    let t = L.filter(k => k.thema === opt.thema || k.kapId === opt.thema);
    if(!t.length){ const b = bereichVon(opt.thema); if(b) t = L.filter(k => bereichVon(k.thema) === b); }
    if(t.length && Math.random() < 0.85) kand = t;
  }
  if(!kand.length) return null;
  const w = Math.random();
  const ziel = opt.selten ? (w < 0.3 ? "glaenzend" : "selten") : (w < 0.07 ? "glaenzend" : w < 0.29 ? "selten" : "gewoehnlich");
  let k = kand.filter(x => x.selten === ziel);
  if(!k.length && opt.selten) k = kand.filter(x => x.selten !== "gewoehnlich");
  if(!k.length) k = kand;
  /* bevorzugt Karten, die man noch nicht hat (Doppelte kommen trotzdem vor) */
  const frisch = k.filter(x => !ST.h[x.id]);
  return zufall(frisch.length && Math.random() < 0.75 ? frisch : k);
}

function geben(opt){
  opt = opt || {};
  const k = ziehen(opt); if(!k) return null;
  const doppelt = !!ST.h[k.id];
  if(doppelt) ST.d++;
  else { ST.h[k.id] = Date.now(); if(!ST.neu.includes(k.id)) ST.neu.push(k.id); }
  speichern();
  const res = { id:k.id, titel:k.titel, bild:bildKlein(k.id), seltenheit:k.selten, doppelt };
  if(!opt.leise) popup(k, doppelt, opt.grund);
  ton("sammeln");
  try{ document.dispatchEvent(new CustomEvent("ep:albumkarte", {detail:res})); }catch(e){}
  if(bildschirm() === "x-album" && !document.querySelector(".alb-modal")) neuZeichnen();
  return res;
}

const EP_ALBUM = {
  karteGeben(opt){
    opt = opt || {};
    if(POOL) return geben(opt);
    const fertig = laden().then(p => p ? geben(opt) : null);
    return { id:null, titel:"Neue Wissenskarte", bild:"", seltenheit: opt.selten ? "selten" : "gewoehnlich", spaeter:true, fertig };
  },
  anzahl(){ const ids = Object.keys(ST.h); return { hat: POOL ? ids.filter(id => POOL.map.has(id)).length : ids.length, alle: POOL ? POOL.liste.length : (ST.n || ALLE_FALLBACK) }; },
  neu(){ return ST.neu.length; },
  laden
};
window.EP_ALBUM = EP_ALBUM;

/* ---------- Karten verdienen ---------- */
document.addEventListener("ep:antwort", e => {
  const d = e.detail || {}; laden();
  if(!d.ok) return;
  ST.z++;
  if(ST.z >= PRO_KARTE){
    ST.z = 0; speichern(); const t = d.thema || (d.frage && d.frage.t) || null;
    setTimeout(() => { laden().then(p => { if(p) geben({ thema:t, grund:"antwort" }); }); }, 700);
  } else speichern();
});
document.addEventListener("ep:quizende", e => {
  const d = e.detail || {};
  if((d.total || 0) >= 5 && (d.richtig || 0) / d.total >= 0.8){
    setTimeout(() => { laden().then(p => { if(p) geben({ thema:d.thema || null, selten: d.richtig === d.total, grund:"bonus" }); }); }, 900);
  }
});

/* ---------- Pop-up beim Erhalt (klein, verschwindet von selbst) ---------- */
const POPQ = []; let popAktiv = false;
function popup(k, doppelt, grund){ POPQ.push([k, doppelt, grund]); if(!popAktiv) popWeiter(); }
function popWeiter(){
  const x = POPQ.shift(); if(!x){ popAktiv = false; return; }
  popAktiv = true; const [k, doppelt, grund] = x;
  try{
    document.querySelectorAll(".alb-pop").forEach(p => p.remove());
    const p = document.createElement("div");
    p.className = "alb-pop alb-" + k.selten + (doppelt ? " alb-dop" : "");
    p.setAttribute("role", "status"); p.setAttribute("aria-live", "polite");
    const kopf = doppelt ? "Doppelte Karte" : grund === "bonus" ? "Bonus-Karte!" : "Neue Wissenskarte!";
    const unter = doppelt ? (ST.d >= TAUSCH ? "Du kannst jetzt im Album tauschen!" : `${ST.d} von ${TAUSCH} Doppelten zum Tauschen`) : (k.selten !== "gewoehnlich" ? SELTEN_NAME[k.selten] + " · im Sammelalbum" : "Im Sammelalbum");
    const sc = bildschirm(); const zumAlbum = sc === "done" || sc === "home";
    p.innerHTML = `<img src="${h(bildKlein(k.id))}" alt="" onerror="this.style.visibility='hidden'"><span class="alb-pop-t"><small>${kopf}</small><b>${h(k.titel)}</b><i>${h(unter)}</i></span>${zumAlbum ? `<button type="button" class="alb-pop-a">Ansehen</button>` : ""}<button type="button" class="alb-pop-x" aria-label="Meldung schliessen">×</button>`;
    document.body.appendChild(p);
    requestAnimationFrame(() => p.classList.add("an"));
    let t = 0, fertig = false;
    const zu = () => { if(fertig) return; fertig = true; clearTimeout(t); p.classList.remove("an"); setTimeout(() => { p.remove(); popWeiter(); }, ruhig() ? 50 : 320); };
    p.querySelector(".alb-pop-x").onclick = zu;
    const a = p.querySelector(".alb-pop-a"); if(a) a.onclick = () => { zu(); try{ go("x-album"); }catch(e){} };
    t = setTimeout(zu, POPQ.length ? 2600 : zumAlbum ? 6000 : 3800);
  }catch(e){ popAktiv = false; }
}

/* ---------- Seite x-album ---------- */
const V = Object.assign({ f:"alle", meine:false }, LS.get(KEY_ANSICHT, {}) || {});
let BOX = null, SEITE = 0, PROSEITE = 9, ZEIGE_NEU = new Set(), resizeT = 0;

function buecher(){ try{ return BUECHER; }catch(e){ return []; } }
function buch(id){ return buecher().find(b => b.id === id) || { id, titel:id, emo:"📘", farbe:"#5B4BF5", farbe2:"#3F2390" }; }

function gefiltert(){
  let l = POOL.liste;
  if(V.f !== "alle") l = l.filter(k => k.buch === V.f);
  const hat = l.filter(k => ST.h[k.id]);
  const nh = hat.filter(k => ZEIGE_NEU.has(k.id)).sort((a, b) => ST.h[b.id] - ST.h[a.id]);
  const alt = hat.filter(k => !ZEIGE_NEU.has(k.id));
  return V.meine ? nh.concat(alt) : nh.concat(alt, l.filter(k => !ST.h[k.id]));
}

function lizUrl(l){
  const m = /^CC (BY(?:-SA)?) (\d\.\d)(?: ([a-z]{2,3}))?$/i.exec(String(l || "").trim());
  if(m) return `https://creativecommons.org/licenses/${m[1].toLowerCase()}/${m[2]}/${m[3] ? m[3].toLowerCase() + "/" : ""}deed.de`;
  if(/^CC0/i.test(String(l || ""))) return "https://creativecommons.org/publicdomain/zero/1.0/deed.de";
  return "";
}

const langWort = t => { const m = Math.max(...String(t).split(/[\s-]+/).map(w => w.length)); return m >= 14 ? " alb-l2" : m >= 11 ? " alb-l1" : ""; };
function karteHTML(k){
  const B = buch(k.buch);
  if(!ST.h[k.id]) return `<button type="button" class="alb-k alb-fehlt" data-id="${h(k.id)}" style="--b1:${B.farbe};--b2:${B.farbe2 || B.farbe}" aria-label="Fehlende Karte Nummer ${k.nr} aus dem Buch ${h(B.titel)}"><span class="alb-fz" aria-hidden="true">?</span><span class="alb-fe" aria-hidden="true">${B.emo || "📘"}</span><span class="alb-nr" aria-hidden="true">${k.nr}</span></button>`;
  const neu = ZEIGE_NEU.has(k.id);
  return `<button type="button" class="alb-k alb-${k.selten}${neu ? " alb-neu" : ""}" data-id="${h(k.id)}" style="--b1:${B.farbe};--b2:${B.farbe2 || B.farbe}" aria-label="${h(k.titel)}${k.selten !== "gewoehnlich" ? ", " + SELTEN_NAME[k.selten] : ""}${neu ? ", neu" : ""}">
    <span class="alb-bild"><i aria-hidden="true">${B.emo || "📘"}</i><img src="${h(bildKlein(k.id))}" alt="" loading="lazy" decoding="async" draggable="false" onerror="this.remove()"></span>
    <span class="alb-t${langWort(k.titel)}">${h(k.titel)}</span>${neu ? `<span class="alb-nb" aria-hidden="true">Neu</span>` : ""}${k.selten !== "gewoehnlich" ? `<span class="alb-st" aria-hidden="true">${k.selten === "glaenzend" ? "✦" : "★"}</span>` : ""}${k.selten === "glaenzend" ? `<span class="alb-glanz" aria-hidden="true"></span>` : ""}</button>`;
}

function kopfHTML(){
  const a = EP_ALBUM.anzahl(), pz = a.alle ? Math.round(a.hat / a.alle * 1000) / 10 : 0;
  const alles = a.hat >= a.alle, kannTauschen = ST.d >= TAUSCH && !alles;
  return `<div class="alb-kopf"><span class="alb-kopf-emo" aria-hidden="true">🃏</span><div class="alb-kopf-t"><h1>Sammelalbum</h1>
      <p class="alb-fort"><b>${a.hat}</b> von ${a.alle} Wissenskarten</p>
      <span class="alb-balken" role="progressbar" aria-label="Fortschritt im Album" aria-valuemin="0" aria-valuemax="${a.alle}" aria-valuenow="${a.hat}"><i style="width:${Math.max(a.hat ? 1.5 : 0, pz)}%"></i></span></div>
    <div class="alb-dop"><span class="alb-pill" title="Doppelte Karten">🔁 ${ST.d} Doppelte</span>${kannTauschen ? `<button type="button" class="alb-tausch" id="albTausch">${TAUSCH} Doppelte gegen neue Karte tauschen</button>` : `<span class="alb-pill alb-pill2">${alles ? "Alles gesammelt!" : `Noch ${PRO_KARTE - ST.z} richtige bis zur nächsten Karte`}</span>`}</div>
    <img class="alb-kids" src="img/kids/duo-jubel.webp" alt=""></div>`;
}

function filterHTML(){
  const L = POOL.liste; const zahl = id => { const l = id === "alle" ? L : L.filter(k => k.buch === id); return [l.filter(k => ST.h[k.id]).length, l.length]; };
  const ids = ["alle", ...buecher().map(b => b.id).filter(id => L.some(k => k.buch === id))];
  return `<div class="alb-filter" role="group" aria-label="Nach Buch filtern">${ids.map(id => { const B = id === "alle" ? { titel:"Alle", emo:"📚" } : buch(id); const [n, m] = zahl(id);
      return `<button type="button" class="alb-chip" data-f="${h(id)}" aria-pressed="${V.f === id}">${B.emo || ""} ${h(B.titel)} <small>${n}/${m}</small></button>`; }).join("")}
    <button type="button" class="alb-chip alb-meine" data-meine="1" aria-pressed="${!!V.meine}">✓ Nur meine</button></div>`;
}

/* Wie viele Karten passen auf eine Seite, ohne dass man scrollen muss? */
function seitenMasse(){
  const box = BOX; if(!box) return false;
  const raster = box.querySelector(".alb-raster"); if(!raster) return false;
  const W = raster.clientWidth || box.clientWidth || innerWidth;
  const handy = innerWidth < 600;
  const cols = W < 480 ? 3 : W < 700 ? 4 : W < 980 ? 5 : 6;
  const gap = handy ? 8 : 12;
  const cw = (W - gap * (cols - 1)) / cols;
  /* feste Leiste unten (App-Navigation) messen */
  let unten = innerHeight;
  try{ for(const dy of [4, 16, 32, 52, 76]) for(const fx of [.5, .2]){
      let el = document.elementFromPoint(innerWidth * fx, innerHeight - dy);
      while(el && el !== document.body && el !== document.documentElement){ const cs = getComputedStyle(el); if(cs.position === "fixed" || cs.position === "sticky"){ const t = el.getBoundingClientRect().top; if(t > innerHeight * .6) unten = Math.min(unten, t); break; } el = el.parentElement; } } }catch(e){}
  const top = raster.getBoundingClientRect().top + scrollY;
  const avail = unten - top - 58;
  let rows = handy ? 3 : Math.max(2, Math.min(3, Math.floor((avail + gap) / (cw * 1.2 + gap))));
  let ch = Math.min(cw * 1.32, (avail - gap * (rows - 1)) / rows);
  if(handy && ch < 100){ rows = 2; ch = Math.min(cw * 1.32, (avail - gap) / 2); }
  ch = Math.max(handy ? 104 : 150, Math.min(ch, 250));
  raster.style.setProperty("--alb-cols", cols); raster.style.setProperty("--alb-gap", gap + "px"); raster.style.setProperty("--alb-h", Math.floor(ch) + "px");
  const neu = cols * rows;
  if(neu !== PROSEITE){ const erste = SEITE * PROSEITE; PROSEITE = neu; SEITE = Math.floor(erste / PROSEITE); return true; }
  return false;
}

function rasterZeichnen(richtung){
  const box = BOX; if(!box || !POOL) return;
  const l = gefiltert(); const seiten = Math.max(1, Math.ceil(l.length / PROSEITE));
  SEITE = Math.max(0, Math.min(SEITE, seiten - 1));
  const teil = l.slice(SEITE * PROSEITE, SEITE * PROSEITE + PROSEITE);
  const raster = box.querySelector(".alb-raster");
  raster.innerHTML = teil.length ? teil.map(karteHTML).join("") : `<p class="alb-leer">Hier hast du noch keine Karten. Beantworte Quizfragen richtig: Je ${PRO_KARTE} richtige Antworten gibt es eine Wissenskarte.</p>`;
  raster.setAttribute("aria-label", `Karten, Seite ${SEITE + 1} von ${seiten}`);
  if(richtung && !ruhig()) raster.animate([{ opacity:0, transform:`translateX(${richtung * 40}px)` }, { opacity:1, transform:"none" }], { duration:260, easing:"ease-out" });
  const z = box.querySelector(".alb-zahl"); if(z) z.textContent = `Seite ${SEITE + 1} von ${seiten}`;
  const [zur, vor] = box.querySelectorAll(".alb-pf"); if(zur) zur.disabled = SEITE <= 0; if(vor) vor.disabled = SEITE >= seiten - 1;
  raster.querySelectorAll(".alb-k").forEach(b => b.onclick = () => { if(raster.dataset.gewischt) return; ton("klick"); oeffneKarte(b.dataset.id, l); });
  /* gezeigte neue Karten gelten als gesehen (das Abzeichen bleibt bis zum nächsten Besuch) */
  const gez = new Set(teil.filter(k => ST.neu.includes(k.id)).map(k => k.id));
  if(gez.size){ ST.neu = ST.neu.filter(id => !gez.has(id)); speichern(); }
}
function blaettern(d){
  const l = gefiltert(); const seiten = Math.max(1, Math.ceil(l.length / PROSEITE));
  const n = Math.max(0, Math.min(seiten - 1, SEITE + d)); if(n === SEITE) return;
  SEITE = n; ton("wisch"); rasterZeichnen(d);
}

function neuZeichnen(){
  const box = BOX; if(!box || !box.isConnected || !POOL) return;
  const ae = document.activeElement; const fokus = ae && box.contains(ae) ? (ae.dataset.f ? `[data-f="${ae.dataset.f}"]` : ae.dataset.meine ? "[data-meine]" : ae.classList.contains("alb-pf") ? `.alb-pf[data-d="${ae.dataset.d}"]` : "") : "";
  box.innerHTML = kopfHTML() + filterHTML() + `<div class="alb-buehne"><div class="alb-raster" role="region" tabindex="-1"></div>
    <div class="alb-nav"><button type="button" class="alb-pf" data-d="-1" aria-label="Vorherige Seite">‹</button><span class="alb-zahl" aria-live="polite"></span><button type="button" class="alb-pf" data-d="1" aria-label="Nächste Seite">›</button></div></div>`;
  box.querySelectorAll("[data-f]").forEach(b => b.onclick = () => { V.f = b.dataset.f; SEITE = 0; LS.set(KEY_ANSICHT, V); ton("klick"); b.focus(); neuZeichnen(); });
  const m = box.querySelector("[data-meine]"); m.onclick = () => { V.meine = !V.meine; SEITE = 0; LS.set(KEY_ANSICHT, V); ton("klick"); m.focus(); neuZeichnen(); };
  const tb = box.querySelector("#albTausch"); if(tb) tb.onclick = tauschen;
  box.querySelectorAll(".alb-pf").forEach(b => b.onclick = () => blaettern(+b.dataset.d));
  const f = box.querySelector(".alb-filter .alb-chip[aria-pressed=true]"); if(f) try{ const sc = f.parentElement, a = f.getBoundingClientRect(), b = sc.getBoundingClientRect(); if(a.right > b.right - 8 || a.left < b.left) sc.scrollLeft += a.left - b.left - 16; }catch(e){}
  const raster = box.querySelector(".alb-raster");
  /* Wischen zum Blättern */
  let x0 = null, y0 = 0;
  raster.addEventListener("pointerdown", e => { x0 = e.clientX; y0 = e.clientY; }, { passive:true });
  raster.addEventListener("pointerup", e => { if(x0 == null) return; const dx = e.clientX - x0, dy = e.clientY - y0; x0 = null;
    if(Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3){ raster.dataset.gewischt = "1"; setTimeout(() => { delete raster.dataset.gewischt; }, 80); blaettern(dx < 0 ? 1 : -1); } }, { passive:true });
  raster.addEventListener("pointercancel", () => { x0 = null; });
  box.querySelector(".alb-buehne").addEventListener("keydown", e => {
    if(e.altKey || e.ctrlKey || e.metaKey) return;
    if(e.key === "ArrowRight" || e.key === "PageDown"){ e.preventDefault(); blaettern(1); }
    else if(e.key === "ArrowLeft" || e.key === "PageUp"){ e.preventDefault(); blaettern(-1); }
  });
  seitenMasse();
  rasterZeichnen(0);
  if(fokus){ const x = box.querySelector(fokus); x && x.focus(); }
}

function tauschen(){
  if(!POOL || ST.d < TAUSCH) return;
  const k = ziehen({ nurNeu:true }); if(!k) return;
  ST.d -= TAUSCH;
  ST.h[k.id] = Date.now(); if(!ST.neu.includes(k.id)) ST.neu.push(k.id);
  speichern();
  ton("sammeln");
  ZEIGE_NEU.add(k.id);
  SEITE = 0; neuZeichnen();
  oeffneKarte(k.id, gefiltert(), "Getauscht! Diese Karte ist neu in deinem Album.");
}

/* ---------- Bibliotheksseite zur Karte öffnen ---------- */
function bibliothekOeffnen(k){
  try{
    const D = buchDaten(k.buch); const s = D.seiten.find(x => seiteKey(x) === k.id);
    if(s){ LIB.buch = k.buch; LIB.seite = s.nr; LIB.zufall = false; LIB.vonQuiz = false; S.libModus = true; document.documentElement.dataset.mode = "lib"; go("libseite"); scrollTo(0, 0); return; }
  }catch(e){ console.warn("album bibliothek", e); }
  try{ if(typeof libThemaOeffnen === "function" && THEMA[k.thema]){ libThemaOeffnen(k.thema); return; } }catch(e){}
  try{ S.libModus = true; document.documentElement.dataset.mode = "lib"; go("lib"); }catch(e){}
}

/* ---------- Grosse Ansicht ---------- */
function oeffneKarte(id, liste, meldung){
  const k0 = POOL && POOL.map.get(id); if(!k0) return;
  if(!ST.h[k0.id]){
    hinweisToast(`Karte ${k0.nr} fehlt noch. Sie gehört ins Buch «${buch(k0.buch).titel}» (${k0.kapitel}). Beantworte Fragen dazu, dann findest du sie vielleicht.`);
    return;
  }
  const eigene = (liste || gefiltert()).filter(x => ST.h[x.id]);
  let i = Math.max(0, eigene.findIndex(x => x.id === id));
  const vorher = document.activeElement;
  document.querySelectorAll(".alb-modal").forEach(m => m.remove());
  const m = document.createElement("div"); m.className = "alb-modal";
  m.innerHTML = `<div class="alb-dlg" role="dialog" aria-modal="true" aria-labelledby="albDT"></div>`;
  document.body.appendChild(m);
  const dlg = m.querySelector(".alb-dlg");
  const breit = (innerWidth || 0) * (devicePixelRatio || 1) > 640;
  const zeigen = (richtung) => {
    const k = eigene[i] || k0; const B = buch(k.buch); const lu = lizUrl(k.lizenz);
    if(ST.neu.includes(k.id)){ ST.neu = ST.neu.filter(x => x !== k.id); speichern(); }
    dlg.className = "alb-dlg alb-" + k.selten; dlg.style.setProperty("--b1", B.farbe); dlg.style.setProperty("--b2", B.farbe2 || B.farbe);
    dlg.innerHTML = `<button type="button" class="alb-zu" aria-label="Schliessen">×</button>
      ${meldung ? `<p class="alb-meld">${h(meldung)}</p>` : ""}
      <figure class="alb-gb"><i aria-hidden="true">${B.emo || "📘"}</i><img src="${h(breit ? bildGross(k.id) : bildKlein(k.id))}" alt="${h(k.titel)}" draggable="false">${k.selten === "glaenzend" ? `<span class="alb-glanz" aria-hidden="true"></span>` : ""}</figure>
      <div class="alb-dt">
        <p class="alb-meta"><span>${B.emo || ""} ${h(B.titel)} · ${h(k.kapitel)}</span><span class="alb-sb">${k.selten === "glaenzend" ? "✦ " : k.selten === "selten" ? "★ " : ""}${SELTEN_NAME[k.selten]} · Nr. ${k.nr}</span></p>
        <h2 id="albDT">${h(k.titel)}</h2>
        <p class="alb-fakt"><b>Wusstest du?</b> ${h(k.fakt)}</p>
        <p class="alb-nachweis">Bild: ${h(k.urheber || "Unbekannt")}${k.lizenz ? `, ${lu ? `<a href="${h(lu)}" target="_blank" rel="noopener">${h(k.lizenz)}</a>` : h(k.lizenz)}` : ""}${k.datei ? `, <a href="${h(k.datei)}" target="_blank" rel="noopener">Quelle (Wikimedia)</a>` : ""}</p>
        <div class="alb-knoepfe">${eigene.length > 1 ? `<button type="button" class="alb-dpf" data-d="-1" aria-label="Vorherige Karte">‹</button>` : ""}<button type="button" class="alb-lesen">📖 In der Bibliothek lesen</button>${eigene.length > 1 ? `<button type="button" class="alb-dpf" data-d="1" aria-label="Nächste Karte">›</button>` : ""}</div>
      </div>`;
    meldung = "";
    const img = dlg.querySelector(".alb-gb img");
    img.onerror = () => { if(img.dataset.f){ img.remove(); return; } img.dataset.f = "1"; img.src = bildKlein(k.id); };
    dlg.querySelector(".alb-zu").onclick = () => zu();
    dlg.querySelector(".alb-lesen").onclick = () => { ton("klick"); zu(true); bibliothekOeffnen(k); };
    dlg.querySelectorAll(".alb-dpf").forEach(b => b.onclick = () => { const d = +b.dataset.d; i = (i + d + eigene.length) % eigene.length; ton("wisch"); zeigen(d); const n = dlg.querySelector(`.alb-dpf[data-d="${d}"]`); n && n.focus(); });
    if(richtung && !ruhig()) dlg.animate([{ opacity:.4, transform:`translateX(${richtung * 24}px)` }, { opacity:1, transform:"none" }], { duration:220 });
  };
  function zu(ohneFokus){
    document.removeEventListener("keydown", taste, true);
    m.classList.remove("an"); setTimeout(() => m.remove(), ruhig() ? 0 : 200);
    if(ohneFokus !== true){ kopfAuffrischen(); try{ const z = BOX && BOX.querySelector(`.alb-k[data-id="${CSS.escape(eigene[i] ? eigene[i].id : id)}"]`); const ziel = z || vorher; ziel && ziel.focus && ziel.focus(); }catch(e){} }
  }
  function taste(e){
    if(!m.isConnected){ document.removeEventListener("keydown", taste, true); return; }
    if(e.key === "Escape"){ e.preventDefault(); zu(); }
    else if((e.key === "ArrowRight" || e.key === "ArrowLeft") && eigene.length > 1){ e.preventDefault(); const d = e.key === "ArrowRight" ? 1 : -1; i = (i + d + eigene.length) % eigene.length; zeigen(d); }
    else if(e.key === "Tab"){ const f = [...dlg.querySelectorAll("button,a[href]")]; if(!f.length) return; const a = f[0], z = f[f.length - 1];
      if(e.shiftKey && (document.activeElement === a || !dlg.contains(document.activeElement))){ e.preventDefault(); z.focus(); }
      else if(!e.shiftKey && (document.activeElement === z || !dlg.contains(document.activeElement))){ e.preventDefault(); a.focus(); } }
  }
  document.addEventListener("keydown", taste, true);
  m.addEventListener("click", e => { if(e.target === m) zu(); });
  /* Wischen in der grossen Ansicht */
  let x0 = null, y0 = 0;
  dlg.addEventListener("pointerdown", e => { x0 = e.clientX; y0 = e.clientY; }, { passive:true });
  dlg.addEventListener("pointerup", e => { if(x0 == null || eigene.length < 2) return; const dx = e.clientX - x0, dy = e.clientY - y0; x0 = null; if(Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.3){ const d = dx < 0 ? 1 : -1; i = (i + d + eigene.length) % eigene.length; zeigen(d); } }, { passive:true });
  zeigen(0);
  requestAnimationFrame(() => m.classList.add("an"));
  dlg.querySelector(".alb-zu").focus();
}
/* nach dem Schliessen nur den Kopf auffrischen (Zahlen), die Seite bleibt */
function kopfAuffrischen(){ if(BOX && BOX.isConnected && POOL){ const k = BOX.querySelector(".alb-kopf"); if(k) k.outerHTML = kopfHTML(); const tb = BOX.querySelector("#albTausch"); if(tb) tb.onclick = tauschen; } }

function hinweisToast(t){
  try{ document.querySelectorAll(".x-toast").forEach(e => e.remove());
    const d = document.createElement("div"); d.className = "x-toast"; d.setAttribute("role", "status"); d.textContent = t;
    document.body.appendChild(d); requestAnimationFrame(() => d.classList.add("an"));
    setTimeout(() => { d.classList.remove("an"); setTimeout(() => d.remove(), 400); }, 3800); }catch(e){}
}

function render(box){
  BOX = box; ZEIGE_NEU = new Set(ST.neu);
  box.classList.add("alb-seite");
  box.innerHTML = `<div class="alb-kopf"><span class="alb-kopf-emo" aria-hidden="true">🃏</span><div class="alb-kopf-t"><h1>Sammelalbum</h1><p class="alb-fort">Karten werden geladen …</p></div></div>`;
  laden().then(p => {
    if(!box.isConnected) return;
    if(!p){ box.insertAdjacentHTML("beforeend", `<p class="alb-leer">Die Karten konnten nicht geladen werden. Bitte versuche es später noch einmal.</p>`); return; }
    SEITE = 0; neuZeichnen();
  });
}
addEventListener("resize", () => { clearTimeout(resizeT); resizeT = setTimeout(() => { if(BOX && BOX.isConnected && POOL && bildschirm() === "x-album"){ seitenMasse(); rasterZeichnen(0); } }, 150); });

window.EP_EXTRAS.register({
  id:"album", titel:"Sammelalbum", text:"Sammle Wissenskarten mit Bildern aus der Bibliothek", emo:"🃏",
  farbe:"linear-gradient(135deg,#E0567A,#8E3FD0)", reihe:20,
  hinweis(){ const n = ST.neu.length; return n ? `${n} neu` : ""; },
  render
});

/* ---------- Stil ---------- */
const css = document.createElement("style"); css.id = "ep-x-album";
css.textContent = `
.alb-kopf{position:relative;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:6px 14px;padding:18px 22px;border-radius:28px;color:#fff;background:linear-gradient(135deg,#E0567A,#B243C8 55%,#6A3FC8);box-shadow:0 14px 30px rgba(60,40,140,.25);margin:6px 0 12px;min-height:88px}
.alb-kopf h1{margin:0;font-size:clamp(1.35rem,3.6vw,2rem);color:#fff;line-height:1.1}
.alb-kopf-emo{font-size:2.3rem;line-height:1}
.alb-kopf-t{min-width:0}
.alb-fort{margin:3px 0 6px;color:#fff;font-size:.95rem}
.alb-balken{display:block;height:10px;border-radius:99px;background:rgba(255,255,255,.28);overflow:hidden;max-width:360px}
.alb-balken i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#FFE34D,#FFF6B0)}
.alb-dop{display:flex;flex-direction:column;align-items:flex-end;gap:6px;margin-right:150px}
.alb-pill{background:rgba(15,20,48,.4);color:#fff;font-weight:700;font-size:.84rem;padding:5px 11px;border-radius:999px;white-space:nowrap}
.alb-pill2{font-weight:600;font-size:.78rem}
.alb-tausch{border:0;cursor:pointer;background:#FFE34D;color:#1B2240;font-weight:800;font-size:.86rem;padding:8px 14px;border-radius:999px;box-shadow:0 4px 12px rgba(0,0,0,.18)}
.alb-tausch:focus-visible,.alb-chip:focus-visible,.alb-pf:focus-visible,.alb-k:focus-visible,.alb-dlg button:focus-visible,.alb-dlg a:focus-visible,.alb-pop button:focus-visible{outline:3px solid #FFE34D;outline-offset:2px}
.alb-kids{position:absolute;right:12px;bottom:0;height:calc(100% + 24px);max-height:150px;pointer-events:none}
.alb-filter{display:flex;gap:8px;overflow-x:auto;padding:4px 2px 8px;margin:0 0 4px;scrollbar-width:thin;-webkit-overflow-scrolling:touch}
.alb-chip{flex:0 0 auto;border:0;cursor:pointer;background:rgba(15,20,48,.55);color:#fff;font-weight:700;font-size:.88rem;padding:8px 13px;border-radius:999px;white-space:nowrap}
.alb-chip small{opacity:.85;font-weight:600;margin-left:2px}
.alb-chip[aria-pressed=true]{background:linear-gradient(135deg,#5B4BF5,#9B4DE0);box-shadow:0 4px 12px rgba(60,40,140,.3)}
.alb-meine[aria-pressed=true]{background:linear-gradient(135deg,#0E8A6A,#17B57E)}
.alb-raster{display:grid;grid-template-columns:repeat(var(--alb-cols,3),minmax(0,1fr));grid-auto-rows:var(--alb-h,150px);gap:var(--alb-gap,10px);touch-action:pan-y;outline:none;min-height:120px}
.alb-k{position:relative;display:flex;flex-direction:column;padding:0;border:0;border-radius:18px;overflow:hidden;cursor:pointer;color:#fff;background:linear-gradient(160deg,var(--b1),var(--b2));box-shadow:0 8px 18px rgba(27,34,64,.22);transition:transform .15s;text-align:left;font:inherit;min-width:0;-webkit-user-select:none;user-select:none}
.alb-k:hover{transform:translateY(-2px)}
.alb-bild{position:relative;flex:1;min-height:0;margin:6px 6px 0;border-radius:13px;overflow:hidden;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center}
.alb-bild i{font-style:normal;font-size:1.8rem;opacity:.7}
.alb-bild img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;-webkit-user-drag:none}
.alb-t{padding:6px 8px 8px;font-weight:800;font-size:.82rem;line-height:1.15;color:#fff;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;height:2.3em;flex:0 0 auto;box-sizing:content-box;hyphens:auto;-webkit-hyphens:auto;overflow-wrap:anywhere}
.alb-t.alb-l1{font-size:.74rem}.alb-t.alb-l2{font-size:.66rem}
.alb-nb{position:absolute;top:10px;left:10px;background:#FFE34D;color:#1B2240;font-weight:800;font-size:.7rem;padding:2px 7px;border-radius:99px;box-shadow:0 2px 6px rgba(0,0,0,.25)}
.alb-st{position:absolute;top:9px;right:10px;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.8rem;color:#1B2240;background:#E6ECFF;box-shadow:0 2px 6px rgba(0,0,0,.25)}
.alb-k.alb-selten{box-shadow:0 0 0 3px #C9D6FF,0 8px 18px rgba(27,34,64,.25)}
.alb-k.alb-glaenzend{box-shadow:0 0 0 3px #FFD54A,0 8px 22px rgba(224,160,20,.45)}
.alb-k.alb-glaenzend .alb-st{background:#FFD54A}
.alb-glanz{position:absolute;inset:0;pointer-events:none;border-radius:inherit;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.6) 45%,rgba(255,236,150,.45) 52%,transparent 66%);background-size:250% 100%;mix-blend-mode:overlay;animation:albGlanz 3.2s ease-in-out infinite}
@keyframes albGlanz{0%{background-position:120% 0}60%,100%{background-position:-60% 0}}
.alb-k.alb-neu{animation:albNeu 1.1s ease-out 1}
@keyframes albNeu{0%{transform:scale(.9)}50%{transform:scale(1.04)}100%{transform:none}}
.alb-fehlt{align-items:center;justify-content:center;background:repeating-linear-gradient(135deg,rgba(255,255,255,.07) 0 10px,transparent 10px 20px),linear-gradient(160deg,var(--b1),var(--b2));opacity:.55;box-shadow:inset 0 0 0 2px rgba(255,255,255,.35),0 4px 10px rgba(27,34,64,.15)}
.alb-fz{font-size:2.2rem;font-weight:900;color:#fff;line-height:1}
.alb-fe{font-size:1.1rem;margin-top:4px}
.alb-nr{position:absolute;bottom:6px;right:9px;font-size:.72rem;font-weight:700;color:#fff;opacity:.95}
.alb-nav{display:flex;align-items:center;justify-content:center;gap:14px;margin:10px 0 4px}
.alb-pf{width:44px;height:44px;border-radius:50%;border:0;cursor:pointer;font-size:1.6rem;line-height:1;color:#fff;background:linear-gradient(135deg,#5B4BF5,#9B4DE0);box-shadow:0 6px 14px rgba(60,40,140,.3)}
.alb-pf:disabled{opacity:.35;cursor:default}
.alb-zahl{background:rgba(15,20,48,.55);color:#fff;font-weight:700;font-size:.9rem;padding:7px 14px;border-radius:999px;min-width:130px;text-align:center}
.alb-leer{grid-column:1/-1;color:#fff;background:rgba(15,20,48,.55);padding:14px 18px;border-radius:18px;margin:0;align-self:start}
.alb-modal{position:fixed;inset:0;z-index:10000;background:rgba(10,14,36,.6);display:flex;align-items:center;justify-content:center;padding:14px;opacity:0;transition:opacity .2s;box-sizing:border-box}
.alb-modal.an{opacity:1}
.alb-dlg{position:relative;width:min(460px,100%);max-height:calc(100vh - 28px);max-height:calc(100dvh - 28px);overflow:auto;border-radius:26px;color:#fff;background:linear-gradient(160deg,var(--b1),var(--b2));box-shadow:0 24px 50px rgba(0,0,0,.4);padding:12px 12px 14px;box-sizing:border-box}
.alb-dlg.alb-selten{box-shadow:0 0 0 4px #C9D6FF,0 24px 50px rgba(0,0,0,.4)}
.alb-dlg.alb-glaenzend{box-shadow:0 0 0 4px #FFD54A,0 24px 60px rgba(224,160,20,.5)}
.alb-zu{position:absolute;top:18px;right:18px;z-index:2;width:40px;height:40px;border-radius:50%;border:0;cursor:pointer;font-size:1.5rem;line-height:1;color:#fff;background:rgba(15,20,48,.6)}
.alb-meld{margin:2px 50px 10px 6px;font-weight:800;color:#fff}
.alb-gb{position:relative;margin:0;border-radius:18px;overflow:hidden;background:rgba(255,255,255,.18);aspect-ratio:4/3;max-height:40vh;width:100%;display:flex;align-items:center;justify-content:center}
.alb-gb img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.alb-gb i{font-style:normal;font-size:3rem;opacity:.7}
.alb-dt{padding:10px 6px 0}
.alb-meta{display:flex;flex-wrap:wrap;justify-content:space-between;gap:4px 10px;margin:0;font-size:.8rem;font-weight:700;color:#fff}
.alb-sb{background:rgba(15,20,48,.35);padding:2px 9px;border-radius:99px}
.alb-dlg h2{margin:6px 0 6px;color:#fff;font-size:1.45rem;line-height:1.15}
.alb-fakt{margin:0 0 10px;color:#fff;line-height:1.4;font-size:1rem;background:rgba(15,20,48,.25);padding:10px 12px;border-radius:14px}
.alb-fakt b{display:block;font-size:.8rem;opacity:.95;margin-bottom:2px}
.alb-nachweis{margin:0 0 12px;font-size:.74rem;line-height:1.35;color:#fff;overflow-wrap:anywhere}
.alb-nachweis a{color:#fff;text-decoration:underline}
.alb-knoepfe{display:flex;gap:10px;align-items:center;justify-content:center}
.alb-lesen{flex:1;border:0;cursor:pointer;background:#fff;color:#1B2240;font-weight:800;font-size:.98rem;padding:12px 14px;border-radius:999px;box-shadow:0 6px 14px rgba(0,0,0,.18)}
.alb-dpf{flex:0 0 auto;width:44px;height:44px;border-radius:50%;border:0;cursor:pointer;font-size:1.5rem;line-height:1;color:#fff;background:rgba(15,20,48,.45)}
.alb-pop{position:fixed;bottom:calc(24px + env(safe-area-inset-bottom));right:24px;z-index:9998;display:flex;align-items:center;gap:10px;max-width:min(380px,calc(100vw - 28px));box-sizing:border-box;padding:8px;border-radius:20px;color:#fff;background:linear-gradient(135deg,#E0567A,#8E3FD0);box-shadow:0 12px 28px rgba(30,20,80,.35);transform:translateY(16px);opacity:0;transition:opacity .3s,transform .3s}
.alb-pop.an{opacity:1;transform:none}
.alb-pop.alb-selten{box-shadow:0 0 0 3px #C9D6FF,0 12px 28px rgba(30,20,80,.35)}
.alb-pop.alb-glaenzend{box-shadow:0 0 0 3px #FFD54A,0 12px 28px rgba(224,160,20,.45)}
.alb-pop.alb-dop{background:linear-gradient(135deg,#4B5BD8,#6A3FC8)}
.alb-pop img{width:52px;height:52px;border-radius:13px;object-fit:cover;flex:0 0 auto;background:rgba(255,255,255,.2)}
.alb-pop-t{display:flex;flex-direction:column;min-width:0;flex:1;line-height:1.2}
.alb-pop-t small{font-size:.74rem;font-weight:700;color:#fff}
.alb-pop-t b{font-size:.95rem;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.alb-pop-t i{font-style:normal;font-size:.74rem;color:#fff}
.alb-pop-a{flex:0 0 auto;border:0;cursor:pointer;background:#fff;color:#1B2240;font-weight:800;font-size:.8rem;padding:7px 11px;border-radius:99px}
.alb-pop-x{flex:0 0 auto;width:30px;height:30px;border-radius:50%;border:0;cursor:pointer;color:#fff;background:rgba(15,20,48,.35);font-size:1.1rem;line-height:1}
@media (min-width:1000px){ .alb-filter{flex-wrap:wrap;overflow:visible} }
@media (max-width:700px){
  .alb-kopf{grid-template-columns:auto 1fr;padding:12px 14px;border-radius:22px;min-height:0;margin-top:2px;gap:6px 10px;margin-bottom:8px}
  .alb-kopf h1{font-size:1.3rem}
  .alb-pill{font-size:.76rem;padding:4px 10px}
  .alb-tausch{font-size:.78rem;padding:6px 12px}
  .alb-kopf-emo{font-size:1.8rem}
  .alb-kopf-t{padding-right:84px}
  .alb-dop{grid-column:1/-1;flex-direction:row;align-items:center;justify-content:flex-start;margin-right:0;flex-wrap:wrap}
  .alb-kids{max-height:100px;right:4px;bottom:auto;top:-10px;height:100px}
  .alb-fort{font-size:.88rem;margin-bottom:5px}
  .alb-chip{font-size:.82rem;padding:7px 11px}
  .alb-t{font-size:.74rem;padding:5px 6px 6px}
  .alb-t.alb-l1{font-size:.68rem}.alb-t.alb-l2{font-size:.6rem}
  .alb-k{border-radius:15px}
  .alb-bild{margin:5px 5px 0;border-radius:11px}
  .alb-nav{margin-top:8px}
  .alb-pop{left:50%;right:auto;bottom:calc(96px + env(safe-area-inset-bottom));transform:translate(-50%,16px);width:max-content}
  .alb-pop.an{transform:translate(-50%,0)}
}
@media (max-width:400px){ .alb-kopf-emo{display:none} .alb-kopf{grid-template-columns:1fr} .alb-kopf-t{padding-right:76px} .alb-kids{height:84px;max-height:84px;top:-6px} .alb-fort{font-size:.82rem;margin:2px 0 4px} }
@media (max-width:380px){ .alb-pill2{display:none} .alb-t{font-size:.7rem} }
@media (prefers-reduced-motion: reduce){
  .alb-glanz{animation:none;background-position:40% 0;opacity:.6}
  .alb-k.alb-neu{animation:none}
  .alb-k,.alb-pop,.alb-modal{transition:none}
}
`;
document.head.appendChild(css);
})();
