/* easyplay Welt «Schweizer Karte»: alle 26 Kantone freispielen.
   Kartendaten: welten/karte/kantone.js (wird beim ersten Öffnen nachgeladen).
   Grenzen: Bundesamt für Statistik (BFS), GEOSTAT, generalisierte Grenzen 2026 (Basis swisstopo),
   aufbereitet mit dem npm-Paket swiss-maps 4.7.0 von Interactive Things (BSD-3-Clause).

   Regeln:
   - angefangen: mindestens eine Kantonsfrage richtig beantwortet (normales Spiel oder Karten-Quiz) oder ein Karten-Quiz gespielt
   - freigespielt: ein Karten-Quiz zum Kanton bestanden (8 Fragen, mindestens 6 richtig)
   - Gold: freigespielt und 20 verschiedene Fragen des Kantons richtig, oder das Karten-Quiz in allen 3 Stufen bestanden
   API: window.EP_KARTE = { fortschritt() → {frei, gold, angefangen, alle:26}, stand(kuerzel) → {stufe, richtig, frei, gold, stufen}, oeffne(kuerzel?) }
   Speicher: ep-x-karte-v1 (Fortschritt), ep-x-karte-lauf (laufendes Karten-Quiz) */
(function(){
"use strict";
if(!window.EP_EXTRAS || typeof window.EP_EXTRAS.register !== "function") return;

const SK = "ep-x-karte-v1", SK_LAUF = "ep-x-karte-lauf";
const QUIZ_N = 8, QUIZ_MIN = 6, GOLD_N = 20, XP_FREI = 30, XP_GOLD = 50;
const DATEN_URL = "welten/karte/kantone.js";

/* Reihenfolge wie KANTONE der Seite (BFS-Nummern 1 bis 26) */
const KZ = ["ZH","BE","LU","UR","SZ","OW","NW","GL","ZG","FR","SO","BS","BL","SH","AR","AI","SG","GR","AG","TG","TI","VD","VS","NE","GE","JU"];
/* Hauptort, Beitritt zur Eidgenossenschaft, Amtssprachen */
const INFO = {
  ZH:["Zürich",1351,"Deutsch"], BE:["Bern",1353,"Deutsch, Französisch"], LU:["Luzern",1332,"Deutsch"], UR:["Altdorf",1291,"Deutsch"],
  SZ:["Schwyz",1291,"Deutsch"], OW:["Sarnen",1291,"Deutsch"], NW:["Stans",1291,"Deutsch"], GL:["Glarus",1352,"Deutsch"],
  ZG:["Zug",1352,"Deutsch"], FR:["Freiburg",1481,"Französisch, Deutsch"], SO:["Solothurn",1481,"Deutsch"], BS:["Basel",1501,"Deutsch"],
  BL:["Liestal",1501,"Deutsch"], SH:["Schaffhausen",1501,"Deutsch"], AR:["Herisau",1513,"Deutsch"], AI:["Appenzell",1513,"Deutsch"],
  SG:["St. Gallen",1803,"Deutsch"], GR:["Chur",1803,"Deutsch, Rätoromanisch, Italienisch"], AG:["Aarau",1803,"Deutsch"], TG:["Frauenfeld",1803,"Deutsch"],
  TI:["Bellinzona",1803,"Italienisch"], VD:["Lausanne",1803,"Französisch"], VS:["Sitten",1815,"Französisch, Deutsch"], NE:["Neuenburg",1815,"Französisch"],
  GE:["Genf",1815,"Französisch"], JU:["Delsberg",1979,"Französisch"]
};
/* Kantonsfarbe (angelehnt an die Wappenfarben, dunkel genug für weisse Schrift) */
const FARBE = {
  ZH:"#1F6FC4", BE:"#D0312D", LU:"#2A7BC8", UR:"#B98A00", SZ:"#C62828", OW:"#B71C3A", NW:"#A61B33", GL:"#C2362B",
  ZG:"#1C64B4", FR:"#3D4A63", SO:"#C7362F", BS:"#3A3F55", BL:"#B3243A", SH:"#A87C00", AR:"#454B63", AI:"#565C78",
  SG:"#0E8A4B", GR:"#4E62C8", AG:"#1C5FAE", TG:"#13844A", TI:"#2559A8", VD:"#178A45", VS:"#B8203A", NE:"#12814A",
  GE:"#B8862B", JU:"#B3243A"
};

const LSx = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} },
  weg(k){ try{ localStorage.removeItem(k); }catch(e){} }
};
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const heute = () => { const x = new Date(); return x.getFullYear() + "-" + String(x.getMonth()+1).padStart(2,"0") + "-" + String(x.getDate()).padStart(2,"0"); };
const ruhig = () => { try{ return matchMedia("(prefers-reduced-motion: reduce)").matches; }catch(e){ return false; } };
const ton = n => { try{ window.EP_SOUND?.play(n); }catch(e){} };
let API = (window.EP_EXTRAS && window.EP_EXTRAS.api) || null;
const meldung = t => { try{ if(API) API.toast(t, 3600); }catch(e){} };
const xpGeben = n => { try{ return API ? (API.xp(n) || 0) : 0; }catch(e){ return 0; } };

/* ---------- Fortschritt ---------- */
function laden(){ const d = LSx.get(SK, null); return (d && typeof d === "object" && d.kt && typeof d.kt === "object") ? d : {kt:{}}; }
function speichern(d){ LSx.set(SK, d); }
function eintrag(d, k){ const e = d.kt[k] || (d.kt[k] = {}); if(!Array.isArray(e.ok)) e.ok = []; if(!Array.isArray(e.st)) e.st = []; return e; }
function stand(k, d){
  d = d || laden(); const e = d.kt[k] || {};
  const ok = Array.isArray(e.ok) ? e.ok : [], st = Array.isArray(e.st) ? e.st : [];
  const stufe = e.gold ? 3 : e.frei ? 2 : (ok.length || st.length || e.versucht) ? 1 : 0;
  return {stufe, richtig:ok.length, frei:!!e.frei, gold:!!e.gold, stufen:st.slice().sort()};
}
function zaehlen(){
  const d = laden(); let frei = 0, gold = 0, an = 0;
  KZ.forEach(k => { const s = stand(k, d); if(s.frei) frei++; if(s.gold) gold++; if(s.stufe >= 1) an++; });
  return {frei, gold, angefangen:an, alle:26};
}
const thema = k => { try{ return (typeof THEMA !== "undefined" && THEMA["kt_" + k]) || null; }catch(e){ return null; } };
const kurz = k => (thema(k) && thema(k).kurz) || k;
const name = k => (thema(k) && thema(k).name) || ("Kanton " + k);
const fKey = f => f.nr != null ? "n" + f.nr : "q" + String(f.q || "").slice(0, 60);
const ktVon = t => { t = String(t || ""); return /^kt_[A-Z]{2}$/.test(t) && KZ.includes(t.slice(3)) ? t.slice(3) : null; };

/* Gold prüfen; gibt true zurück, wenn neu Gold */
function goldPruefen(d, k){
  const e = eintrag(d, k); if(!e.frei || e.gold) return false;
  const st = new Set(e.st);
  if(e.ok.length >= GOLD_N || (st.has(1) && st.has(2) && st.has(3))){ e.gold = heute(); d.neu = k; return true; }
  return false;
}

/* ---------- Fragen ---------- */
function alleF(){ let a = []; try{ a = (typeof alleFragen === "function" ? alleFragen() : FRAGEN); }catch(e){} return (a || []).filter(f => f && Array.isArray(f.a) && f.a.length === 4); }
function ktFragen(k){ const seen = new Set(); return alleF().filter(f => f.t === "kt_" + k && !seen.has(f.q) && seen.add(f.q)); }
function mischen(a){ a = a.slice(); for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function quizListe(k, stufe){
  const alle = ktFragen(k);
  let l = mischen(alle.filter(f => (f.l || 1) === stufe));
  if(l.length < QUIZ_N){
    const rest = mischen(alle.filter(f => (f.l || 1) !== stufe)).sort((a, b) => Math.abs((a.l || 1) - stufe) - Math.abs((b.l || 1) - stufe));
    l = l.concat(rest);
  }
  return l.slice(0, QUIZ_N);
}

/* ---------- Bibliothek ---------- */
const bibCache = {};
function bibSeite(k){
  if(k in bibCache) return bibCache[k];
  let nr = null;
  try{ if(typeof buchDaten === "function"){
    const D = buchDaten("welt"); const n = name(k);
    for(const kid of ["kt_alle", "geo_schweiz"]){ const kap = D.kap.find(x => x.id === kid); const s = kap && kap.seiten.find(x => x.titel === n); if(s){ nr = s.nr; break; } }
  } }catch(e){}
  return (bibCache[k] = nr);
}
function bibOeffnen(nr){
  try{ LIB.buch = "welt"; LIB.seite = nr; LIB.zufall = false; LIB.vonQuiz = false;
    S.libModus = true; document.documentElement.dataset.mode = "lib"; go("libseite"); scrollTo(0, 0); }catch(e){ console.warn("karte bib", e); }
}

/* ---------- Konfetti (eigenes, falls die Seite keines hat) ---------- */
function konfetti(){
  if(ruhig()) return;
  try{ if(typeof window.confetti === "function"){ window.confetti(); return; } }catch(e){}
  stilEinfuegen();
  const box = document.createElement("div"); box.className = "xk-konf"; box.setAttribute("aria-hidden", "true");
  const farben = ["#FFE34D","#FF6FB5","#4FC3F7","#7CE38B","#FF9F43","#B794F6"];
  for(let i = 0; i < 46; i++){ const s = document.createElement("i");
    s.style.cssText = `left:${(Math.random()*100).toFixed(1)}%;background:${farben[i % farben.length]};animation-delay:${(Math.random()*.5).toFixed(2)}s;animation-duration:${(1.6+Math.random()*1.2).toFixed(2)}s`;
    box.appendChild(s); }
  document.body.appendChild(box); setTimeout(() => box.remove(), 3600);
}

/* ---------- Ereignisse: Antworten zählen, Quiz-Ende auswerten ---------- */
document.addEventListener("ep:antwort", ev => {
  try{ const dt = ev.detail || {}; const f = dt.frage || {}; const k = ktVon(f.t) || ktVon(dt.thema); if(!k) return;
    const lauf = LSx.get(SK_LAUF, null);
    const imLauf = !!(lauf && lauf.kt === k);
    if(imLauf){ lauf.ok = (lauf.ok || 0) + (dt.ok ? 1 : 0); lauf.n = (lauf.n || 0) + 1; LSx.set(SK_LAUF, lauf); }
    if(!dt.ok) return;
    const d = laden(); const e = eintrag(d, k); const key = fKey(f);
    if(!e.ok.includes(key)){ e.ok.push(key); if(e.ok.length > 60) e.ok = e.ok.slice(-60); }
    const neuGold = !imLauf && goldPruefen(d, k);
    speichern(d);
    if(neuGold){ const xp = xpGeben(XP_GOLD); ton("fanfare"); meldung(`⭐ Gold für ${kurz(k)}!${xp ? ` +${xp} XP` : ""}`); }
  }catch(e){ console.warn("karte antwort", e); }
});

document.addEventListener("ep:quizende", ev => {
  const lauf = LSx.get(SK_LAUF, null); if(!lauf) return;
  LSx.weg(SK_LAUF);
  try{ const dt = ev.detail || {};
    if(dt.titel !== lauf.titel || Date.now() - (lauf.t || 0) > 3 * 3600e3 || !KZ.includes(lauf.kt)) return;
    const k = lauf.kt; const total = dt.total || lauf.total || QUIZ_N;
    const richtig = lauf.n ? (lauf.ok || 0) : (dt.richtig || 0);
    const minimum = Math.ceil(total * QUIZ_MIN / QUIZ_N);
    const d = laden(); const e = eintrag(d, k); e.versucht = (e.versucht || 0) + 1;
    let text = "", feiern = false;
    if(richtig >= minimum){
      if(!e.st.includes(lauf.stufe)) e.st.push(lauf.stufe);
      const warFrei = !!e.frei;
      if(!warFrei){ e.frei = heute(); d.neu = k; }
      const neuGold = goldPruefen(d, k);
      speichern(d);
      if(!warFrei){
        feiern = true; const xp = xpGeben(XP_FREI);
        ton("freischalten");
        let karte = null; try{ karte = window.EP_ALBUM?.karteGeben({thema:"kt_" + k}); }catch(e){}
        text = `🎉 ${kurz(k)} ist freigespielt!${xp ? ` +${xp} XP` : ""}${karte && karte.titel ? ` Neue Albumkarte: ${karte.titel}` : ""}`;
      }
      if(neuGold){ feiern = true; const xp = xpGeben(XP_GOLD); ton("fanfare");
        text = (text ? text + " " : "") + `⭐ Gold für ${kurz(k)}!${xp ? ` +${xp} XP` : ""}`; }
      if(!feiern) text = `Stark! ${richtig} von ${total} richtig bei ${kurz(k)}.`;
    }else{
      speichern(d);
      text = `${richtig} von ${total} richtig. Mit ${minimum} richtigen spielst du ${kurz(k)} frei. Probier es gleich nochmal!`;
    }
    if(feiern) konfetti();
    setTimeout(() => meldung(text), feiern ? 400 : 100);
    requestAnimationFrame(() => zurueckKnopf(k));
  }catch(e){ console.warn("karte quizende", e); }
});

/* Knopf auf der Ergebnisseite, damit man direkt zurück zur Karte kommt */
function zurueckKnopf(k){
  try{ const app = document.getElementById("app"); if(!app || app.querySelector(".xk-zurueck")) return;
    stilEinfuegen();
    const b = document.createElement("button"); b.type = "button"; b.className = "xk-zurueck";
    b.innerHTML = `<span aria-hidden="true">🗺️</span> Zurück zur Schweizer Karte`;
    b.onclick = () => { AUSWAHL = k; go("x-karte"); scrollTo(0, 0); };
    app.appendChild(b);
  }catch(e){}
}

/* ---------- Kartendaten nachladen ---------- */
let datenP = null;
function daten(){
  if(window.EP_KARTE_DATEN) return Promise.resolve(window.EP_KARTE_DATEN);
  if(datenP) return datenP;
  datenP = new Promise((ok, nein) => { const s = document.createElement("script"); s.src = DATEN_URL; s.async = true;
    s.onload = () => window.EP_KARTE_DATEN ? ok(window.EP_KARTE_DATEN) : nein(new Error("keine Daten"));
    s.onerror = () => { datenP = null; s.remove(); nein(new Error("Laden fehlgeschlagen")); };
    document.head.appendChild(s); });
  return datenP;
}

/* ---------- Seite ---------- */
let AUSWAHL = null;
const STUFE_TXT = ["noch nicht gespielt", "angefangen", "freigespielt", "Gold"];
const gross = s => s.charAt(0).toUpperCase() + s.slice(1);

function wappenHTML(k){ try{ if(typeof wappen === "function"){ const w = wappen(k, "xk-w"); if(w) return w; } }catch(e){} return `<span class="xk-wfallback">${esc(k)}</span>`; }

function render(box, api){
  API = api;
  stilEinfuegen();
  const z = zaehlen();
  box.innerHTML = `<div class="xk">
    <header class="xk-kopf">
      <div class="xk-kopf-t"><h1><span aria-hidden="true">🗺️</span> Schweizer Karte</h1>
        <p>Besteh ein Kantons-Quiz und spiel den Kanton frei.</p></div>
      <div class="xk-fort">
        <div class="xk-fort-zeile"><b class="xk-fort-zahl">${z.frei} von 26 Kantonen</b>${z.gold ? `<span class="xk-gold-pill">⭐ ${z.gold} Gold</span>` : ""}</div>
        <div class="xk-balken" role="progressbar" aria-valuemin="0" aria-valuemax="26" aria-valuenow="${z.frei}" aria-label="${z.frei} von 26 Kantonen freigespielt"><i style="width:${(z.frei / 26 * 100).toFixed(1)}%"></i></div>
      </div>
      <img class="xk-kopf-img" src="img/kids/duo-jubel.webp" alt="">
    </header>
    <div class="xk-haupt">
      <section class="xk-karte" aria-label="Karte der Schweiz mit 26 Kantonen">
        <div class="xk-svgbox"><p class="xk-laden">Karte wird geladen …</p></div>
        <div class="xk-fuss">
          <ul class="xk-legende" aria-label="Legende">
            <li><i class="l0"></i>noch nicht</li><li><i class="l1"></i>angefangen</li><li><i class="l2"></i>freigespielt</li><li><i class="l3"></i>Gold</li>
          </ul>
          <small class="xk-quelle">Grenzen: BFS GEOSTAT, swisstopo</small>
        </div>
      </section>
      <aside class="xk-panel" aria-live="polite"></aside>
    </div>
  </div>`;
  const svgbox = box.querySelector(".xk-svgbox"), panel = box.querySelector(".xk-panel");
  panelZeigen(panel, AUSWAHL);
  daten().then(D => {
    if(!svgbox.isConnected) return;
    zeichnen(svgbox, D);
    const d = laden();
    if(d.neu){ const p = svgbox.querySelector(`[data-k="${d.neu}"]`); if(p && !ruhig()) p.classList.add("xk-neu"); delete d.neu; speichern(d); }
  }).catch(() => { if(svgbox.isConnected) svgbox.innerHTML = `<p class="xk-laden">Die Karte konnte nicht geladen werden. Bitte lade die Seite neu.</p>`; });
}

function farbeFuer(k, st){
  if(st.stufe >= 2) return FARBE[k];
  if(st.stufe === 1) return FARBE[k] + "88";
  return "rgba(255,255,255,.16)";
}

function zeichnen(svgbox, D){
  const d = laden();
  const pfade = KZ.map(k => { const st = stand(k, d);
    return `<path class="xk-kt s${st.stufe}" data-k="${k}" id="xk-p-${k}" d="${D.pfade[k]}" fill="${farbeFuer(k, st)}" tabindex="0" role="button" aria-label="${esc(name(k))}, ${STUFE_TXT[st.stufe]}"></path>`; }).join("");
  const seen = (D.seen || []).map(p => `<path d="${p}"></path>`).join("");
  const sterne = KZ.filter(k => stand(k, d).gold).map(k => { const m = D.mitte[k]; return `<text x="${m[0]}" y="${m[1] - 12}">★</text>`; }).join("");
  const labels = KZ.map(k => { const m = D.mitte[k]; return `<text x="${m[0]}" y="${m[1] + 5}">${k}</text>`; }).join("");
  svgbox.innerHTML = `<svg class="xk-svg" viewBox="${D.viewBox}" preserveAspectRatio="xMidYMid meet" role="group" aria-label="Kantone der Schweiz">
    <g class="xk-kte">${pfade}</g><g class="xk-seen" aria-hidden="true">${seen}</g>
    <path class="xk-wahl" d="" style="display:none" aria-hidden="true"></path>
    <g class="xk-labels" aria-hidden="true">${labels}</g><g class="xk-sterne" aria-hidden="true">${sterne}</g></svg>`;
  const svg = svgbox.querySelector("svg");
  const waehle = k => { AUSWAHL = k; ton("klick"); markieren(k); panelZeigen(document.querySelector(".xk-panel"), k, true); };
  svg.querySelectorAll(".xk-kt").forEach(p => {
    p.addEventListener("click", () => waehle(p.dataset.k));
    p.addEventListener("keydown", e => { if(e.key === "Enter" || e.key === " "){ e.preventDefault(); waehle(p.dataset.k); } });
  });
  markieren(AUSWAHL);
  const klein = () => { if(svg.isConnected) svg.classList.toggle("xk-klein", svg.getBoundingClientRect().width < 600); };
  klein(); try{ new ResizeObserver(klein).observe(svgbox); }catch(e){}
}
function markieren(k){
  const svg = document.querySelector(".xk-svg"); if(!svg) return; const u = svg.querySelector(".xk-wahl");
  svg.querySelectorAll(".xk-kt.an").forEach(p => p.classList.remove("an"));
  const p = k && svg.querySelector(`[data-k="${k}"]`);
  if(p){ u.setAttribute("d", p.getAttribute("d")); u.style.display = ""; p.classList.add("an"); }
  else u.style.display = "none";
}

function chipsHTML(d){
  return `<div class="xk-chips" role="group" aria-label="Alle Kantone">${KZ.map(k => { const st = stand(k, d);
    return `<button type="button" class="xk-chip s${st.stufe}" data-k="${k}" style="--kf:${FARBE[k]}" aria-label="${esc(name(k))}, ${STUFE_TXT[st.stufe]}">${k}${st.gold ? "<i aria-hidden=\"true\">★</i>" : ""}</button>`; }).join("")}</div>`;
}

function panelZeigen(panel, k, fokus){
  if(!panel) return;
  const d = laden();
  if(!k){
    const z = zaehlen();
    panel.style.removeProperty("--kf");
    panel.innerHTML = `<div class="xk-p-leer"><img src="img/kids/duo-winken.webp" alt="" class="xk-p-duo">
      <h2 tabindex="-1">Tippe auf einen Kanton</h2><p>${z.frei ? `Super, du hast schon ${z.frei} ${z.frei === 1 ? "Kanton" : "Kantone"} freigespielt.` : "Wähle einen Kanton auf der Karte oder hier unten und starte sein Quiz."}</p></div>
      ${chipsHTML(d)}`;
    panel.querySelectorAll(".xk-chip").forEach(b => b.onclick = () => { AUSWAHL = b.dataset.k; ton("klick"); markieren(AUSWAHL); panelZeigen(panel, AUSWAHL, true); });
    if(fokus){ try{ panel.querySelector("h2").focus({preventScroll:true}); }catch(e){} }
    return;
  }
  const st = stand(k, d), inf = INFO[k];
  const anz = ktFragen(k).length, nr = bibSeite(k), i = KZ.indexOf(k);
  const stufeNow = (API && API.stufe()) || 1;
  const goldTxt = st.gold ? "Gold geschafft!" : st.frei ? `${Math.min(st.richtig, GOLD_N)} von ${GOLD_N} richtigen Antworten bis Gold` : `${st.richtig} ${st.richtig === 1 ? "Frage" : "Fragen"} richtig beantwortet`;
  const pct = st.gold ? 100 : Math.min(100, st.richtig / GOLD_N * 100);
  const vor = KZ[(i + 25) % 26], nach = KZ[(i + 1) % 26];
  panel.style.setProperty("--kf", FARBE[k]);
  panel.innerHTML = `<div class="xk-p-kopf">
      <div class="xk-p-wappen">${wappenHTML(k)}</div>
      <div class="xk-p-titel"><h2 tabindex="-1">${esc(name(k))}</h2><p class="xk-p-status s${st.stufe}">${st.gold ? "⭐ " : st.frei ? "✅ " : st.stufe ? "🌱 " : ""}${gross(STUFE_TXT[st.stufe])}</p></div>
    </div>
    <dl class="xk-fakten">
      <div><dt>Hauptort</dt><dd>${esc(inf[0])}</dd></div>
      <div><dt>Bei der Eidgenossenschaft seit</dt><dd>${inf[1]}</dd></div>
      <div><dt>Amtssprache</dt><dd>${esc(inf[2])}</dd></div>
    </dl>
    <div class="xk-p-fort"><span>${goldTxt}</span><div class="xk-balken klein" aria-hidden="true"><i style="width:${pct.toFixed(0)}%"></i></div>
      <span class="xk-stufen" role="list" aria-label="Bestandene Quiz-Stufen">${[1,2,3].map(s => `<b role="listitem" class="${st.stufen.includes(s) ? "ja" : ""}">Stufe ${s}${st.stufen.includes(s) ? " ✓" : ""}</b>`).join("")}</span></div>
    <div class="xk-p-knoepfe">
      <button type="button" class="xk-btn haupt" id="xkQuiz" ${anz ? "" : "disabled"}>🎮 Quiz zu ${esc(kurz(k))}</button>
      ${nr ? `<button type="button" class="xk-btn" id="xkBib">📖 In der Bibliothek lesen</button>` : ""}
    </div>
    <p class="xk-p-regel">${st.frei ? `Quiz in Stufe ${stufeNow} mit ${QUIZ_N} Fragen. Besteh alle 3 Stufen oder beantworte ${GOLD_N} Fragen richtig für Gold.` : `${QUIZ_N} Fragen, ab ${QUIZ_MIN} richtigen ist ${esc(kurz(k))} freigespielt.`}</p>
    <nav class="xk-p-nav" aria-label="Kantone blättern">
      <button type="button" class="xk-nav" data-n="${vor}" aria-label="Vorheriger Kanton: ${esc(kurz(vor))}">‹</button>
      <button type="button" class="xk-nav alle" data-n="">Alle Kantone</button>
      <button type="button" class="xk-nav" data-n="${nach}" aria-label="Nächster Kanton: ${esc(kurz(nach))}">›</button>
    </nav>`;
  const q = panel.querySelector("#xkQuiz"); if(q) q.onclick = () => quizStarten(k);
  const b = panel.querySelector("#xkBib"); if(b) b.onclick = () => { ton("klick"); bibOeffnen(nr); };
  panel.querySelectorAll(".xk-nav").forEach(n => n.onclick = () => { AUSWAHL = n.dataset.n || null; ton("wisch"); markieren(AUSWAHL); panelZeigen(panel, AUSWAHL, true); });
  if(fokus){ try{ panel.querySelector("h2").focus({preventScroll:true}); }catch(e){}
    if(innerWidth < 900){ const r = panel.getBoundingClientRect(); if(r.top > innerHeight * .62 || r.top < 0) panel.scrollIntoView({behavior:ruhig() ? "auto" : "smooth", block:"start"}); } }
}

function quizStarten(k){
  const stufe = (API && API.stufe()) || 1;
  const liste = quizListe(k, stufe); if(!liste.length) return;
  const titel = `Karten-Quiz: ${kurz(k)}`;
  LSx.set(SK_LAUF, {kt:k, stufe, titel, t:Date.now(), total:liste.length, ok:0, n:0});
  AUSWAHL = k; ton("klick");
  if(API) API.quiz(liste, titel);
}

/* ---------- Stil ---------- */
function stilEinfuegen(){
  if(document.getElementById("ep-x-karte")) return;
  const c = document.createElement("style"); c.id = "ep-x-karte";
  c.textContent = `
.xk{color:#fff}
.xk-kopf{position:relative;display:flex;align-items:center;gap:12px 18px;flex-wrap:wrap;padding:18px 22px;border-radius:28px;background:linear-gradient(135deg,#0B6E6A,#0FA968);box-shadow:0 14px 30px rgba(10,80,70,.28);margin:6px 0 14px}
.xk-kopf-t{flex:1 1 260px;min-width:0}
.xk-kopf h1{margin:0;font-size:clamp(1.35rem,3.6vw,2rem);color:#fff;line-height:1.15}
.xk-kopf p{margin:4px 0 0;color:#fff;opacity:.94;font-size:.95rem}
.xk-kopf-img{position:absolute;right:14px;bottom:0;height:128px;pointer-events:none}
.xk-fort{flex:1 1 260px;min-width:0;max-width:440px;margin-right:150px}
.xk-fort-zeile{display:flex;align-items:center;gap:10px;margin-bottom:6px;flex-wrap:wrap}
.xk-fort-zahl{font-size:1.05rem;color:#fff}
.xk-gold-pill{background:#FFE34D;color:#1B2240;font-weight:800;font-size:.8rem;padding:3px 10px;border-radius:999px}
.xk-balken{height:14px;border-radius:999px;background:rgba(255,255,255,.25);overflow:hidden}
.xk-balken>i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#FFE34D,#FFB547);min-width:6px;transition:width .6s}
.xk-balken.klein{height:10px;margin:6px 0;background:rgba(15,20,48,.3)}
.xk-haupt{display:grid;grid-template-columns:minmax(0,1fr);gap:14px}
@media (min-width:900px){.xk-haupt{grid-template-columns:minmax(0,1.75fr) minmax(300px,1fr);align-items:start}}
.xk-karte{border-radius:26px;padding:12px;background:radial-gradient(120% 120% at 20% 0%,#1E3E7A 0%,#152A5A 45%,#0F1E44 100%);box-shadow:0 14px 30px rgba(20,30,70,.3)}
.xk-svgbox{position:relative;width:100%;aspect-ratio:1000/640;display:flex;align-items:center;justify-content:center}
.xk-svg{width:100%;height:100%;display:block;overflow:visible;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
.xk-laden{color:#fff;opacity:.85;margin:0}
.xk-kt{stroke:rgba(255,255,255,.8);stroke-width:1.3;stroke-linejoin:round;cursor:pointer;transition:filter .15s,fill .3s;outline:none}
.xk-kt.s0{stroke:rgba(255,255,255,.45)}
.xk-kt:hover{filter:brightness(1.3)}
.xk-kt.s0:hover{fill:rgba(255,255,255,.32)}
.xk-kt:focus-visible{stroke:#FFE34D;stroke-width:4;filter:brightness(1.25)}
.xk-kt.an{filter:brightness(1.2)}
.xk-kt.s0.an{fill:rgba(255,255,255,.34)}
.xk-wahl{fill:none;stroke:#FFE34D;stroke-width:4.5;pointer-events:none}
.xk-kt.s3{stroke:#FFE34D;stroke-width:2.6}
.xk-seen path{fill:#7FB8E8;opacity:.8;pointer-events:none}
.xk-labels text{fill:#fff;font:700 15px/1 system-ui,sans-serif;text-anchor:middle;pointer-events:none;paint-order:stroke;stroke:rgba(10,20,50,.6);stroke-width:3px}
.xk-sterne text{fill:#FFE34D;font:900 20px/1 system-ui,sans-serif;text-anchor:middle;pointer-events:none;paint-order:stroke;stroke:rgba(80,50,0,.7);stroke-width:2px}
.xk-svg.xk-klein .xk-labels{display:none}
.xk-svg.xk-klein .xk-sterne text{font-size:30px;transform:translateY(14px)}
.xk-neu{animation:xkNeu 1.4s ease-in-out 3}
@keyframes xkNeu{50%{filter:brightness(1.7)}}
.xk-fuss{display:flex;align-items:center;justify-content:space-between;gap:6px 10px;flex-wrap:wrap;margin-top:6px;padding:0 4px}
.xk-legende{display:flex;flex-wrap:wrap;gap:4px 12px;list-style:none;margin:0;padding:0;font-size:.8rem;color:#fff}
.xk-legende li{display:flex;align-items:center;gap:5px}
.xk-legende i{width:14px;height:14px;border-radius:4px;display:inline-block;border:1px solid rgba(255,255,255,.6);box-sizing:border-box}
.xk-legende .l0{background:rgba(255,255,255,.16)}.xk-legende .l1{background:#1F6FC488}.xk-legende .l2{background:#1F6FC4}.xk-legende .l3{background:#1F6FC4;border:2px solid #FFE34D}
.xk-quelle{font-size:.7rem;color:#fff;opacity:.78}
.xk-panel{--kf:#0B6E6A;border-radius:26px;padding:18px;color:#fff;background:linear-gradient(150deg,var(--kf),color-mix(in srgb,var(--kf) 55%,#0F1E44));box-shadow:0 14px 30px rgba(20,30,70,.28);scroll-margin-top:70px;min-width:0}
.xk-panel h2{margin:0;font-size:1.35rem;color:#fff;line-height:1.2;outline:none}
.xk-p-leer{position:relative;padding-right:100px;min-height:84px}
.xk-p-leer p{margin:6px 0 0;color:#fff;opacity:.95}
.xk-p-duo{position:absolute;right:-4px;top:-6px;height:96px;pointer-events:none}
.xk-chips{display:grid;grid-template-columns:repeat(auto-fill,minmax(52px,1fr));gap:7px;margin-top:14px}
.xk-chip{position:relative;border:2px solid rgba(255,255,255,.45);border-radius:14px;padding:9px 0;font-weight:800;font-size:.9rem;color:#fff;background:rgba(255,255,255,.12);cursor:pointer;min-height:42px;min-width:0}
.xk-chip.s1{background:color-mix(in srgb,var(--kf) 55%,transparent)}
.xk-chip.s2,.xk-chip.s3{background:var(--kf);border-color:#fff}
.xk-chip.s3{border-color:#FFE34D;box-shadow:0 0 0 2px #FFE34D inset}
.xk-chip i{position:absolute;top:-8px;right:-4px;font-style:normal;color:#FFE34D;font-size:.95rem;text-shadow:0 1px 2px rgba(0,0,0,.5)}
.xk-chip:hover{filter:brightness(1.15)}
.xk-chip:focus-visible,.xk-btn:focus-visible,.xk-nav:focus-visible,.xk-zurueck:focus-visible{outline:3px solid #FFE34D;outline-offset:3px}
.xk-p-kopf{display:flex;align-items:center;gap:14px}
.xk-p-titel{min-width:0}
.xk-p-wappen{flex:0 0 auto;width:58px;height:68px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.92);border-radius:16px;padding:6px;box-sizing:border-box}
.xk-p-wappen .wappen,.xk-p-wappen img,.xk-p-wappen svg{width:100%;height:100%;object-fit:contain;margin:0;vertical-align:middle}
.xk-wfallback{color:#1B2240;font-weight:800}
.xk-p-status{display:inline-block;margin:6px 0 0;padding:3px 10px;border-radius:999px;background:rgba(15,20,48,.4);font-size:.85rem;font-weight:700;color:#fff}
.xk-p-status.s3{background:#FFE34D;color:#1B2240}
.xk-fakten{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:14px 0 10px}
.xk-fakten div{background:rgba(15,20,48,.3);border-radius:14px;padding:8px 10px;min-width:0}
.xk-fakten div:last-child{grid-column:1/-1}
.xk-fakten dt{font-size:.74rem;opacity:.92;color:#fff}
.xk-fakten dd{margin:2px 0 0;font-weight:800;color:#fff;overflow-wrap:anywhere}
.xk-p-fort{font-size:.88rem;color:#fff}
.xk-stufen{display:flex;gap:6px;flex-wrap:wrap}
.xk-stufen b{font-size:.74rem;padding:2px 8px;border-radius:999px;background:rgba(15,20,48,.32);font-weight:700;color:#fff}
.xk-stufen b.ja{background:#FFE34D;color:#1B2240}
.xk-p-knoepfe{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.xk-btn{flex:1 1 180px;border:0;border-radius:18px;padding:13px 16px;font-weight:800;font-size:1rem;cursor:pointer;color:#fff;background:rgba(15,20,48,.38);box-shadow:inset 0 0 0 2px rgba(255,255,255,.5)}
.xk-btn.haupt{background:linear-gradient(135deg,#F59E2B,#E8642A);box-shadow:0 8px 18px rgba(0,0,0,.2)}
.xk-btn:hover{filter:brightness(1.08)}
.xk-btn:disabled{opacity:.5;cursor:default}
.xk-p-regel{margin:8px 0 0;font-size:.8rem;color:#fff;opacity:.92}
.xk-p-nav{display:flex;gap:8px;margin-top:12px}
.xk-nav{border:0;border-radius:14px;min-width:46px;min-height:40px;font-size:1.25rem;font-weight:800;color:#fff;background:rgba(15,20,48,.34);cursor:pointer}
.xk-nav.alle{flex:1;font-size:.92rem}
.xk-zurueck{display:flex;align-items:center;justify-content:center;gap:8px;margin:14px auto;border:0;border-radius:18px;padding:12px 20px;font-weight:800;font-size:1rem;color:#fff;background:linear-gradient(135deg,#0B6E6A,#0FA968);box-shadow:0 8px 18px rgba(10,80,70,.28);cursor:pointer}
.xk-konf{position:fixed;inset:0;pointer-events:none;z-index:9998;overflow:hidden}
.xk-konf i{position:absolute;top:-14px;width:9px;height:14px;border-radius:2px;animation-name:xkFall;animation-timing-function:linear;animation-fill-mode:forwards}
@keyframes xkFall{to{transform:translateY(105vh) rotate(540deg);opacity:.6}}
@media (max-width:899px){.xk-kopf-img{height:112px}}
@media (max-width:560px){
  .xk-kopf{padding:14px 16px;border-radius:22px;gap:10px;margin-top:2px}
  .xk-kopf-t{padding-right:86px;flex-basis:100%}
  .xk-kopf p{font-size:.85rem}
  .xk-kopf-img{height:92px;right:4px;top:2px;bottom:auto}
  .xk-fort{margin-right:0;max-width:none;flex-basis:100%}
  .xk-karte{padding:8px;border-radius:22px}
  .xk-panel{padding:14px;border-radius:22px}
  .xk-panel h2{font-size:1.2rem}
  .xk-p-duo{height:80px}
  .xk-chips{grid-template-columns:repeat(7,minmax(0,1fr));gap:5px}
  .xk-chip{font-size:.78rem;padding:7px 0;min-height:38px;border-radius:12px}
  .xk-legende{font-size:.72rem;gap:3px 9px}
  .xk-fakten dd{font-size:.92rem}
}
@media (prefers-reduced-motion:reduce){.xk-balken>i,.xk-kt{transition:none}.xk-neu{animation:none}}
`;
  document.head.appendChild(c);
}

/* ---------- Anmelden ---------- */
window.EP_KARTE = {
  fortschritt(){ return zaehlen(); },
  stand(k){ return KZ.includes(k) ? stand(k) : null; },
  oeffne(k){ AUSWAHL = KZ.includes(k) ? k : null; try{ go("x-karte"); }catch(e){} }
};

EP_EXTRAS.register({
  id:"karte", titel:"Schweizer Karte", text:"Spiel alle 26 Kantone frei", emo:"🗺️",
  farbe:"linear-gradient(135deg,#0B6E6A,#0FA968)", reihe:10,
  hinweis(){ return zaehlen().frei + "/26"; },
  render(box, api){ render(box, api); }
});
})();
