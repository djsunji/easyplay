/* easyplay: Tägliche Truhe und sanfte Pausen-Erinnerung (Modul «truhe»)
   A) Einmal pro Kalendertag (lokales Datum) eine Überraschungstruhe: immer XP, dazu eine Sammelkarte, ein Garderobe-Teil
      oder ein «Wusstest du?»-Fakt. Jede 7. geöffnete Truhe ist eine grosse Sternentruhe. Lässt man einen Tag aus, geht nichts verloren.
      Einstiege: Pille in der Zeile «Dein Tag» der App-Startseite (iPad quer: neben dem Gruss), Karte auf der Computer-Startseite,
      Welt «Tägliche Truhe» im Entdecken-Menü.
   B) Pausen-Erinnerung: nach 30 Minuten aktiver Nutzung (Tab sichtbar, Interaktion in den letzten 2 Minuten) ein freundliches
      Fenster mit Lumi und Milo. Nie während einer laufenden Testfrage, im Duell oder im Live-Quiz.
   API: window.EP_TRUHE = { offen(): bool (heute schon geöffnet), verfuegbar(): bool, pauseAn(): bool, pauseSetzen(bool) }
   Speicher: ep-x-truhe-tage, ep-x-truhe-zahl, ep-x-truhe-pause, ep-x-truhe-aktiv, (Test) ep-x-truhe-testminuten */
(function(){
"use strict";
if(!window.EP_EXTRAS) return;
const X = window.EP_EXTRAS, api = X.api, LS = api.LS, h = api.h;

const K = {
  tage: "ep-x-truhe-tage",          // {"2026-10-17": {xp, gross, nr, items:[...]}} (letzte 60 Einträge)
  zahl: "ep-x-truhe-zahl",          // Anzahl geöffneter Truhen insgesamt (für die grosse Truhe)
  pause: "ep-x-truhe-pause",        // Pausen-Erinnerung an (true, Standard) oder aus (false)
  aktiv: "ep-x-truhe-aktiv",        // {ms, t} aktive Spielzeit seit der letzten Erinnerung
  test: "ep-x-truhe-testminuten"    // nur zum Testen: Schwelle in Minuten statt 30
};
const GROSS_ALLE = 7;
const heute = () => api.heute();
const tage = () => { const t = LS.get(K.tage, {}); return t && typeof t === "object" ? t : {}; };
const offen = () => !!tage()[heute()];
const zahl = () => Math.max(0, +LS.get(K.zahl, 0) || 0);
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const ton = n => { try{ window.EP_SOUND && window.EP_SOUND.play(n); }catch(e){} };
const welt = id => { try{ return X.liste().some(m => m.id === id); }catch(e){ return false; } };

/* ---------- Truhe als SVG ---------- */
let svgNr = 0;
function truheSVG(gross, cls){
  const k = gross ? ["#6D28D9", "#4C1D95", "#8B5CF6"] : ["#A0522D", "#6B3410", "#C46A32"];
  const id = "xtg" + (++svgNr);
  return `<svg class="xt-svg ${cls || ""}" viewBox="0 0 220 190" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="${id}k" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${k[2]}"/><stop offset="1" stop-color="${k[1]}"/></linearGradient>
      <linearGradient id="${id}d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${k[2]}"/><stop offset="1" stop-color="${k[0]}"/></linearGradient>
      <linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE98A"/><stop offset="1" stop-color="#F4A818"/></linearGradient>
      <radialGradient id="${id}i" cx=".5" cy=".9" r=".8"><stop offset="0" stop-color="#FFF6C8"/><stop offset=".6" stop-color="#FFD23F"/><stop offset="1" stop-color="#E08A00"/></radialGradient>
    </defs>
    <ellipse cx="110" cy="178" rx="84" ry="9" fill="rgba(20,20,60,.22)"/>
    <rect class="xt-innen" x="34" y="78" width="152" height="22" rx="8" fill="url(#${id}i)"/>
    <g class="xt-koerper">
      <rect x="30" y="88" width="160" height="82" rx="14" fill="url(#${id}k)"/>
      <path d="M36 112h148M36 136h148" stroke="rgba(0,0,0,.18)" stroke-width="3"/>
      <rect x="48" y="88" width="16" height="82" fill="url(#${id}g)"/><rect x="156" y="88" width="16" height="82" fill="url(#${id}g)"/>
      <rect x="30" y="158" width="160" height="12" rx="6" fill="url(#${id}g)"/>
      <rect x="94" y="94" width="32" height="36" rx="8" fill="url(#${id}g)" stroke="#C47F00" stroke-width="2"/>
      ${gross ? `<path d="m110 101 3.2 6.5 7.1 1-5.2 5 1.2 7.1-6.3-3.4-6.3 3.4 1.2-7.1-5.2-5 7.1-1z" fill="#fff"/>` : `<circle cx="110" cy="108" r="5" fill="#6B3410"/><rect x="107.5" y="110" width="5" height="11" rx="2" fill="#6B3410"/>`}
    </g>
    <g class="xt-deckel">
      <path d="M30 92V70c0-22 30-36 80-36s80 14 80 36v22z" fill="url(#${id}d)"/>
      <path d="M30 86h160v8H30z" fill="url(#${id}g)"/>
      <path d="M48 92V48c4-3 10-5 16-6v50zM156 42c6 1 12 3 16 6v44h-16z" fill="url(#${id}g)"/>
      <path d="M44 62c18-12 44-16 66-16" stroke="rgba(255,255,255,.35)" stroke-width="5" stroke-linecap="round" fill="none"/>
      ${gross ? `<circle cx="110" cy="62" r="9" fill="url(#${id}g)"/><path d="m110 56 1.9 3.9 4.3.6-3.1 3 .7 4.3-3.8-2-3.8 2 .7-4.3-3.1-3 4.3-.6z" fill="#fff"/>` : ""}
    </g>
  </svg>`;
}
const MINI = `<svg class="xt-mini" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="M3 11V8.5C3 6 6.5 4.5 12 4.5S21 6 21 8.5V11z" fill="#C46A32"/><rect x="3" y="11" width="18" height="9" rx="2.2" fill="#8B4513"/><path d="M3 10.2h18v1.8H3zM6 4.9h2.4V20H6zM15.6 4.9H18V20h-2.6z" fill="#FFC83D"/><rect x="10.3" y="10" width="3.4" height="4.4" rx="1" fill="#FFE34D" stroke="#B87400" stroke-width=".6"/></svg>`;

/* ---------- Belohnung ---------- */
let faktPool = null;
function faktZiehen(){
  try{
    if(!faktPool){
      const heikel = /sexual|aufklär|pubert|fortpflanz|verhüt/i;
      faktPool = api.fragen(f => f.e && !f.img && String(f.e).length > 40 && String(f.e).length < 170 && typeof THEMA !== "undefined" && THEMA[f.t] && !heikel.test(THEMA[f.t].name || "") && !heikel.test(f.e));
    }
    if(!faktPool.length) return null;
    const st = api.stufe(), passend = faktPool.filter(f => !f.l || f.l === st || st > 3);
    const l = passend.length > 20 ? passend : faktPool;
    const f = l[Math.floor(Math.random() * l.length)];
    return {art:"fakt", text:String(f.e), t:f.t, name:(THEMA[f.t] && THEMA[f.t].name) || ""};
  }catch(e){ return null; }
}
function karte(){ try{ const k = window.EP_ALBUM && window.EP_ALBUM.karteGeben({selten:true}); return k ? {art:"karte", titel:k.titel || "Sammelkarte", bild:k.bild || "", seltenheit:k.seltenheit || ""} : null; }catch(e){ return null; } }
function teil(){ try{ const t = window.EP_GARDEROBE && window.EP_GARDEROBE.teilGeben(); return t ? {art:"teil", name:t.name || "Neues Teil", emo:t.emo || "👕"} : null; }catch(e){ return null; } }

function oeffnen(){
  const t = heute(), alle = tage();
  if(alle[t]) return alle[t];
  const nr = zahl() + 1, gross = nr % GROSS_ALLE === 0;
  let xp = gross ? rnd(50, 80) : rnd(15, 40);
  const items = [];
  if(gross){
    const k = karte(); if(k) items.push(k); else xp += 15;
    const g = teil(); if(g) items.push(g); else xp += 10;
    const f = faktZiehen(); if(f) items.push(f);
  }else{
    const r = Math.random(), wahl = r < .35 ? ["karte", "teil", "fakt"] : r < .65 ? ["teil", "karte", "fakt"] : ["fakt"];
    for(const w of wahl){
      const it = w === "karte" ? karte() : w === "teil" ? teil() : faktZiehen();
      if(it){ items.push(it); break; }
      xp += 10;   // fehlt das Modul, gibt es dafür mehr XP
    }
  }
  const eintrag = {xp, gross, nr, items, g:false};   // XP gibt es erst beim Aufdecken (xpGeben), damit kein Level-Fenster die Animation verdeckt
  alle[t] = eintrag;
  const keys = Object.keys(alle).sort(); while(keys.length > 60) delete alle[keys.shift()];
  LS.set(K.tage, alle); LS.set(K.zahl, nr);
  ton("truhe");
  return eintrag;
}

function xpGeben(){
  const alle = tage(), e = alle[heute()];
  if(!e || e.g) return e;
  e.g = true; LS.set(K.tage, alle);           // zuerst merken, damit es nie doppelt XP gibt
  const bekam = api.xp(e.xp); if(bekam && bekam !== e.xp){ e.xp = bekam; LS.set(K.tage, alle); }
  return e;
}

/* ---------- Seite ---------- */
const WT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
function kalenderHTML(){
  const alle = tage(); let s = "";
  for(let i = -6; i <= 0; i++){
    const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + i);
    const e = alle[api.heute(d)];
    s += `<li class="${e ? "xt-ja" : ""}${i === 0 ? " xt-heute" : ""}${e && e.gross ? " xt-gr" : ""}" aria-label="${i === 0 ? "Heute" : WT[d.getDay()] + " " + d.getDate() + "."}: ${e ? "Truhe geöffnet" : "keine Truhe"}">
      <small>${i === 0 ? "Heute" : WT[d.getDay()]}</small><span class="xt-kt">${e ? (e.gross ? "🌟" : MINI) : ""}</span><i>${d.getDate()}.</i></li>`;
  }
  return `<ol class="xt-kal">${s}</ol>`;
}
function itemHTML(it, i){
  const st = `style="--i:${i}"`;
  if(it.art === "xp") return `<li class="xt-bel xt-b-xp" ${st}><span class="xt-bic" aria-hidden="true">⭐</span><span><b>+${it.xp} XP</b><small>für dein Level</small></span></li>`;
  if(it.art === "karte") return `<li class="xt-bel xt-b-karte" ${st}><span class="xt-bic" aria-hidden="true">${it.bild ? `<img src="${h(it.bild)}" alt="">` : "🃏"}</span><span><b>${h(it.titel)}</b><small>Sammelkarte${it.seltenheit ? " · " + h(it.seltenheit) : ""}</small></span>${welt("album") ? `<button type="button" class="xt-mini-btn" data-zu="album">Album</button>` : ""}</li>`;
  if(it.art === "teil") return `<li class="xt-bel xt-b-teil" ${st}><span class="xt-bic" aria-hidden="true">${h(it.emo)}</span><span><b>${h(it.name)}</b><small>Neu für dein Profil</small></span>${welt("garderobe") ? `<button type="button" class="xt-mini-btn" data-zu="garderobe">Verzieren</button>` : ""}</li>`;
  if(it.art === "fakt") return `<li class="xt-bel xt-b-fakt" ${st}><span class="xt-bic" aria-hidden="true">💡</span><span><b>Wusstest du?</b><small class="xt-fakt">${h(it.text)}</small></span><button type="button" class="xt-mini-btn" data-fakt="${h(it.t)}" aria-label="Mehr dazu in der Bibliothek">Mehr</button></li>`;
  return "";
}
function belohnungHTML(e){
  if(!e) return "";
  const l = [{art:"xp", xp:e.xp}].concat(e.items || []);
  return `<p class="xt-glas xt-bel-titel">${e.gross ? "🌟 Die grosse Sternentruhe!" : "Das war heute drin:"}</p><ul class="xt-bel-liste">${l.map(itemHTML).join("")}</ul>
    <p class="xt-morgen"><img src="img/kids/duo-winken.webp" alt="" class="xt-morgen-img"><span>Morgen gibt es wieder eine Truhe. Bis dann!</span></p>`;
}
function fortschrittHTML(){
  const n = zahl(), e = tage()[heute()];
  const im = n % GROSS_ALLE, noch = GROSS_ALLE - im, voll = !!(e && e.gross);
  const punkte = Array.from({length:GROSS_ALLE}, (x, i) => `<i class="${i < im || voll ? "xt-an" : ""}${i === GROSS_ALLE - 1 ? " xt-stern" : ""}"></i>`).join("");
  const txt = voll ? "Heute war die grosse Sternentruhe dran. Jetzt beginnt eine neue Runde."
    : noch === 1 ? "Die nächste Truhe ist eine grosse Sternentruhe."
    : `Jede 7. Truhe ist eine grosse Sternentruhe. Noch ${noch} Truhen. Ein Tag Pause ist kein Problem, es geht nichts verloren.`;
  return `<div class="xt-fort"><div class="xt-punkte" aria-hidden="true">${punkte}</div><p>${txt}</p></div>`;
}

function seite(box){
  xpGeben();   // falls die Seite beim Aufdecken verlassen wurde
  const e = tage()[heute()], naechsteGross = (zahl() + 1) % GROSS_ALLE === 0;
  const grossBild = e ? e.gross : naechsteGross;
  box.innerHTML = `<div class="xt">
    <div class="x-kopf xt-kopf"><span class="x-kopf-emo" aria-hidden="true">🎁</span><div><h1>Tägliche Truhe</h1><p>Jeden Tag eine kleine Überraschung</p></div><img src="img/kids/lb-karten.webp" alt=""></div>
    <div class="xt-raster">
      <section class="xt-buehne${grossBild ? " xt-gross" : ""}${e ? " xt-auf xt-fertig" : ""}" aria-label="Truhe" aria-live="polite">
        <div class="xt-strahlen" aria-hidden="true"></div>
        <div class="xt-truhe">${truheSVG(grossBild)}<div class="xt-funken" aria-hidden="true"></div></div>
        <div class="xt-aktion">${e ? belohnungHTML(e) : `<p class="xt-glas">${naechsteGross ? "Heute wartet die grosse Sternentruhe!" : "Deine Truhe für heute ist bereit."}</p><button type="button" class="xt-btn" id="xtOeffnen">${MINI} Truhe öffnen</button>`}</div>
      </section>
      <div class="xt-seite">
        <section class="xt-karte xt-k-kal"><h2>Deine letzten 7 Tage</h2>${kalenderHTML()}${fortschrittHTML()}</section>
        <section class="xt-karte xt-k-pause"><div><h2 id="xtPauseT">Pausen-Erinnerung</h2><p>Nach 30 Minuten Spielen erinnern Lumi und Milo dich an eine kurze Pause.</p></div>
          <button type="button" class="xt-schalter" role="switch" aria-checked="${pauseAn()}" aria-labelledby="xtPauseT" id="xtPause"><span class="xt-sch-k" aria-hidden="true"></span><span class="xt-sch-t" aria-hidden="true">${pauseAn() ? "An" : "Aus"}</span></button></section>
      </div>
    </div></div>`;
  binden(box);
  const b = box.querySelector("#xtOeffnen");
  if(b) b.onclick = () => {
    if(offen()) return;
    b.disabled = true;
    const buehne = box.querySelector(".xt-buehne");
    let ein = oeffnen();
    if(ein.gross && !buehne.classList.contains("xt-gross")){ buehne.classList.add("xt-gross"); }
    const weiter = () => {
      buehne.classList.remove("xt-wackeln"); buehne.classList.add("xt-auf"); funken(buehne.querySelector(".xt-funken"), ein.gross);
      setTimeout(() => { ein = xpGeben() || ein; const a = buehne.querySelector(".xt-aktion"); a.innerHTML = belohnungHTML(ein); binden(box);
        const k = box.querySelector(".xt-k-kal"); if(k) k.innerHTML = `<h2>Deine letzten 7 Tage</h2>${kalenderHTML()}${fortschrittHTML()}`;
        buehne.classList.add("xt-fertig"); if(ein.gross) ton("fanfare");
        const f = a.querySelector(".xt-bel-titel"); if(f){ f.tabIndex = -1; f.focus({preventScroll:true}); } }, api.ruhig() ? 30 : 600);
    };
    if(api.ruhig()) weiter(); else { buehne.classList.add("xt-wackeln"); setTimeout(weiter, 700); }
  };
}
function binden(box){
  box.querySelectorAll(".xt-bic img").forEach(i => i.addEventListener("error", () => { const p = i.parentNode; if(p) p.textContent = "🃏"; }, {once:true}));
  box.querySelectorAll("[data-zu]").forEach(b => b.onclick = () => api.oeffne(b.dataset.zu));
  box.querySelectorAll("[data-fakt]").forEach(b => b.onclick = () => {
    try{ const ES = window.EP_START; if(ES && ES.aktion){ ES.aktion("fakt", b); return; } }catch(e){}
    try{ go("home"); }catch(e){} });
  const p = box.querySelector("#xtPause");
  if(p) p.onclick = () => { const an = !pauseAn(); pauseSetzen(an); p.setAttribute("aria-checked", String(an)); p.querySelector(".xt-sch-t").textContent = an ? "An" : "Aus"; ton("klick");
    api.toast(an ? "Die Pausen-Erinnerung ist an." : "Die Pausen-Erinnerung ist aus."); };
}
function funken(el, gross){
  if(!el || api.ruhig()) return;
  el.innerHTML = "";
  const farben = ["#FFE34D", "#FFFFFF", "#FF8FD8", "#7FE7FF", "#FFC83D"], n = gross ? 26 : 16;
  for(let i = 0; i < n; i++){
    const s = document.createElement("i"), w = (i / n) * Math.PI * 2 + Math.random() * .4, r = 70 + Math.random() * (gross ? 90 : 60);
    s.style.setProperty("--dx", Math.round(Math.cos(w) * r) + "px"); s.style.setProperty("--dy", Math.round(Math.sin(w) * r * .8 - 40) + "px");
    s.style.setProperty("--d", (Math.random() * .15).toFixed(2) + "s"); s.style.background = farben[i % farben.length];
    if(i % 3 === 0) s.className = "xt-st";
    el.appendChild(s);
  }
  setTimeout(() => { el.innerHTML = ""; }, 1800);
}

/* ---------- Einstiege: Pille (App) und Karte (Computer) ---------- */
function pilleHTML(cls){
  const o = offen();
  return `<button type="button" class="xt-pille ${o ? "xt-o" : "xt-z"} ${cls}" aria-label="${o ? "Tägliche Truhe: heute schon geöffnet, morgen wieder" : "Tägliche Truhe öffnen"}">${MINI}<span class="xt-p-t">${o ? "Morgen wieder" : "Truhe"}</span>${o ? `<span class="xt-p-ok" aria-hidden="true">✓</span>` : ""}</button>`;
}
function einstiege(){
  try{
    if(typeof S === "undefined" || S.screen !== "home" || S.libModus) return;
    const app = document.getElementById("app"); if(!app) return;
    try{ const e = tage()[heute()]; if(e && !e.g) xpGeben(); }catch(e){}
    const appAn = (() => { try{ return window.EP_APP && window.EP_APP.an(); }catch(e){ return false; } })();
    if(appAn){
      const chips = app.querySelector(".ap-heute .ap-kopf .ap-chips");
      if(chips && !chips.querySelector(".xt-pille")){
        const w = document.createElement("span"); w.className = "xt-pw"; w.innerHTML = pilleHTML("xt-p-kopf"); chips.insertBefore(w, chips.firstChild);
      }
      const ah = app.querySelector(".ap-heute");
      if(ah && !ah.querySelector(".xt-pw-quer")){
        const w = document.createElement("span"); w.className = "xt-pw xt-pw-quer"; w.innerHTML = pilleHTML("xt-p-quer"); ah.appendChild(w);
      }
      app.querySelectorAll(".xt-pille").forEach(b => b.onclick = e => { e.stopPropagation(); ton("klick"); go("x-truhe"); });
    }else{
      const wg = app.querySelector(".ep-wg");
      if(wg && !wg.querySelector(".xt-ein")){
        const o = offen(), b = document.createElement("button"); b.type = "button"; b.className = "ep-w xt-ein" + (o ? " xt-o" : " xt-z");
        b.innerHTML = `<small>Tägliche Truhe</small><span class="xt-ein-truhe" aria-hidden="true">${truheSVG(false, o ? "xt-offen" : "")}</span><b>${o ? "Heute geöffnet" : "Truhe öffnen"}</b><span class="xt-ein-t">${o ? "Morgen gibt es wieder eine Truhe" : "Eine kleine Überraschung wartet"}</span>`;
        b.setAttribute("aria-label", o ? "Tägliche Truhe: heute geöffnet, morgen wieder" : "Tägliche Truhe öffnen");
        b.onclick = () => { ton("klick"); go("x-truhe"); };
        const x = wg.querySelector(".x-ein"); if(x) wg.insertBefore(b, x); else wg.appendChild(b);
      }
    }
  }catch(e){ console.warn("truhe einstiege", e); }
}
let geplant = false;
const planen = () => { if(geplant) return; geplant = true; requestAnimationFrame(() => { geplant = false; einstiege(); }); };
const vorRender = window.render;
if(typeof vorRender === "function") window.render = function(){ const r = vorRender.apply(this, arguments); planen(); return r; };
function beobachten(){ const app = document.getElementById("app"); if(!app) return; try{ new MutationObserver(planen).observe(app, {childList:true, subtree:true}); }catch(e){} planen(); }
if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", beobachten); else beobachten();

/* ---------- B) Pausen-Erinnerung ---------- */
function pauseAn(){ return LS.get(K.pause, true) !== false; }
function pauseSetzen(an){ LS.set(K.pause, !!an); if(an) aktivSetzen(0); }
function schwelle(){ const t = +LS.get(K.test, 0); return (t > 0 ? t : 30) * 60000; }
let letzteAktion = Date.now(), letzterTick = Date.now(), wartet = false, fensterOffen = false;
const aktivLesen = () => { const a = LS.get(K.aktiv, null); if(!a || typeof a.ms !== "number" || Date.now() - (a.t || 0) > 20 * 60000) return 0; return a.ms; };
let aktivMs = aktivLesen();
function aktivSetzen(ms){ aktivMs = ms; LS.set(K.aktiv, {ms, t:Date.now()}); }
["pointerdown", "keydown", "touchstart", "wheel"].forEach(t => addEventListener(t, () => { letzteAktion = Date.now(); }, {passive:true, capture:true}));

/* Nie mitten in einer Testfrage, im Duell, im Live-Quiz oder im Hardcore-Modus */
function gesperrt(){
  try{
    const sc = S.screen || "";
    if(/^(duell|live)/.test(sc) || sc === "hardcore" || sc === "check") return true;
    if(sc === "quiz"){ const Q = S.quiz; if(!Q) return false; if(Q.mode === "test" || /duell|live|hardcore/.test(String(Q.mode))) return true; return Q.picked == null; }
  }catch(e){}
  return false;
}
function tick(){
  const jetzt = Date.now(), dt = Math.min(Math.max(0, jetzt - letzterTick), 15000); letzterTick = jetzt;
  if(!pauseAn() || fensterOffen) return;
  if(document.visibilityState !== "visible") return;
  if(!wartet && jetzt - letzteAktion <= 120000) aktivSetzen(aktivMs + dt);
  if(aktivMs >= schwelle()) wartet = true;
  if(wartet && !gesperrt()) erinnern();
}
setInterval(tick, 5000);
document.addEventListener("visibilitychange", () => { letzterTick = Date.now(); });

let vorFokus = null;
function overlay(cls, html, label){
  const d = document.createElement("div"); d.className = "xt-ov " + cls;
  d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-label", label);
  d.innerHTML = html; document.body.appendChild(d);
  requestAnimationFrame(() => d.classList.add("xt-an"));
  return d;
}
function schliessen(d){ if(!d) return; d.classList.remove("xt-an"); setTimeout(() => d.remove(), api.ruhig() ? 0 : 300); try{ vorFokus && vorFokus.focus && vorFokus.focus({preventScroll:true}); }catch(e){} }
function fokusFalle(d, weg){
  d.addEventListener("keydown", e => {
    if(e.key === "Escape"){ e.preventDefault(); weg(); return; }
    if(e.key !== "Tab") return;
    const f = [...d.querySelectorAll("button")]; if(!f.length) return;
    const i = f.indexOf(document.activeElement);
    if(e.shiftKey && i <= 0){ e.preventDefault(); f[f.length - 1].focus(); }
    else if(!e.shiftKey && i === f.length - 1){ e.preventDefault(); f[0].focus(); }
  });
}
function erinnern(){
  if(fensterOffen || document.querySelector(".xt-ov")) return;
  wartet = false; fensterOffen = true; vorFokus = document.activeElement;
  const min = Math.max(1, Math.round(schwelle() / 60000));
  const d = overlay("xt-erinnerung", `<div class="xt-box">
    <img src="img/kids/duo-winken.webp" alt="Lumi und Milo winken">
    <h2>Du spielst schon ${min} ${min === 1 ? "Minute" : "Minuten"}.</h2>
    <p>Zeit für eine kurze Pause? Trink etwas Wasser, schau aus dem Fenster.</p>
    <div class="xt-knoepfe"><button type="button" class="xt-btn" data-p="pause">☁️ Pause machen</button><button type="button" class="xt-btn hell" data-p="weiter">Noch ein bisschen weiter</button></div></div>`, "Pausen-Erinnerung");
  const weiter = () => { aktivSetzen(0); fensterOffen = false; schliessen(d); };
  fokusFalle(d, weiter);
  d.querySelector('[data-p="weiter"]').onclick = weiter;
  d.querySelector('[data-p="pause"]').onclick = () => { d.remove(); pauseBildschirm(); };
  setTimeout(() => { const b = d.querySelector('[data-p="pause"]'); b && b.focus({preventScroll:true}); }, 60);
}
function pauseBildschirm(){
  fensterOffen = true; if(!vorFokus) vorFokus = document.activeElement;
  const DAUER = 5 * 60000, start = Date.now(), U = 2 * Math.PI * 54;
  const d = overlay("xt-pause", `<div class="xt-pbox">
    <p class="xt-ptitel">Pause</p>
    <div class="xt-uhr"><span class="xt-atem" aria-hidden="true"></span><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="54" class="xt-u0"/><circle cx="60" cy="60" r="54" class="xt-u1" stroke-dasharray="${U}" stroke-dashoffset="0"/></svg><b class="xt-zeit" role="timer" aria-live="off">5:00</b></div>
    <p class="xt-ptext">Atme ruhig ein und aus. Trink etwas Wasser, streck dich oder schau aus dem Fenster in die Ferne.</p>
    <img src="img/kids/liegen.webp" alt="Lumi ruht sich aus" class="xt-pimg">
    <button type="button" class="xt-btn hell" data-p="ende">Pause beenden</button></div>`, "Pause");
  const zeit = d.querySelector(".xt-zeit"), ring = d.querySelector(".xt-u1"), text = d.querySelector(".xt-ptext"), knopf = d.querySelector('[data-p="ende"]');
  let fertig = false;
  const iv = setInterval(() => {
    const rest = Math.max(0, DAUER - (Date.now() - start)), s = Math.ceil(rest / 1000);
    zeit.textContent = Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
    ring.setAttribute("stroke-dashoffset", String((1 - rest / DAUER) * U));
    if(!rest && !fertig){ fertig = true; clearInterval(iv); d.classList.add("xt-fertig");
      text.textContent = "Schön, dass du dir eine Pause gegönnt hast. Viel Spass beim Weiterspielen!"; knopf.textContent = "Weiterspielen"; }
  }, 500);
  const ende = () => { clearInterval(iv); aktivSetzen(0); fensterOffen = false; schliessen(d); vorFokus = null; };
  fokusFalle(d, ende);
  knopf.onclick = ende;
  setTimeout(() => knopf.focus({preventScroll:true}), 60);
}

/* ---------- Anmelden ---------- */
X.register({
  id:"truhe", titel:"Tägliche Truhe", text:"Jeden Tag eine kleine Überraschung", emo:"🎁",
  farbe:"linear-gradient(135deg,#E8890C,#F2B705 55%,#E85D9A)", reihe:5,
  hinweis(){ return offen() ? "" : "Bereit"; },
  render(box){ seite(box); }
});

window.EP_TRUHE = { offen, verfuegbar: () => !offen(), pauseAn, pauseSetzen, _erinnern: erinnern, _pause: pauseBildschirm, _gesperrt: gesperrt };

/* ---------- Stil ---------- */
const css = document.createElement("style"); css.id = "ep-x-truhe";
css.textContent = `
.xt-pw{display:inline-flex}
.ap-chips .xt-pw{height:auto;padding:0;gap:0;border-radius:0;font:inherit}
.ap-chips .xt-pille .xt-p-t{display:inline;height:auto;padding:0;border-radius:0;font:inherit}
.ap-chips .xt-pille .xt-p-ok{display:block;height:15px;padding:0;border-radius:50%;font:800 10px/15px system-ui}
.xt-pille{display:inline-flex;align-items:center;gap:5px;height:30px;padding:0 10px 0 8px;border-radius:15px;border:1px solid rgba(255,255,255,.22);background:linear-gradient(135deg,#E8890C,#F2B705);color:#fff;font:700 13px "Fredoka",system-ui,sans-serif;cursor:pointer;position:relative;white-space:nowrap;box-shadow:0 6px 14px -6px rgba(232,137,12,.8);box-sizing:border-box}
.xt-pille.xt-o{background:rgba(27,34,64,.55);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border-color:rgba(255,255,255,.16);box-shadow:none}
.xt-pille:focus-visible{outline:3px solid #FFE34D;outline-offset:2px}
.xt-pille .xt-mini{flex:none;width:20px;height:20px}
.xt-pille.xt-z{animation:xtHuepf 3.2s ease-in-out infinite}
.xt-pille.xt-z::after{content:"";position:absolute;inset:-3px;border-radius:18px;animation:xtGlow 3.2s ease-out infinite;pointer-events:none}
.xt-p-ok{position:absolute;right:-4px;top:-5px;width:15px;height:15px;border-radius:50%;background:#14B87A;color:#fff;font:800 10px/15px system-ui;text-align:center}
@keyframes xtHuepf{0%,70%,100%{transform:translateY(0)}76%{transform:translateY(-4px)}82%{transform:translateY(0)}88%{transform:translateY(-2px)}}
@keyframes xtGlow{0%,60%{box-shadow:0 0 0 0 rgba(255,214,60,.65)}90%,100%{box-shadow:0 0 0 7px rgba(255,214,60,0)}}
.xt-pw-quer{display:none}
@media (max-width:440px){.ap-chips .xt-p-kopf .xt-p-t{display:none}.xt-p-kopf{padding:0;width:32px;justify-content:center}}
/* Sehr schmale Handys: die Zeile «Dein Tag» etwas enger setzen, damit die Pille ohne Umbruch Platz hat */
@media (max-width:380px){
  .ap-kopf:has(.xt-pw) .aplbl{letter-spacing:.05em;padding:0 10px;white-space:nowrap}
  .ap-kopf:has(.xt-pw) .ap-chips{gap:5px}
  .ap-kopf:has(.xt-pw) .ap-chips>span.glas{padding:0 8px;white-space:nowrap}
  .xt-p-kopf{width:30px}
}
/* iPad quer: die Zeile «Dein Tag» ist ausgeblendet, darum eine Kachel im freien Teil der Seitenleiste */
@media (min-width:1000px) and (orientation:landscape){
  .ap-heute .xt-pw-quer{display:flex;position:fixed;left:16px;width:108px;top:50%;transform:translateY(-50%);justify-content:center;z-index:61}
  .ap-heute .xt-pw-quer .xt-pille{flex-direction:column;justify-content:center;gap:5px;width:84px;height:auto;min-height:78px;padding:10px 4px;border-radius:22px;font:700 12px/1.15 "Lexend",system-ui,sans-serif;white-space:normal;text-align:center}
  .ap-heute .xt-pw-quer .xt-pille.xt-z::after{border-radius:25px}
  .ap-heute .xt-pw-quer .xt-mini{width:28px;height:28px}
  .ap-heute .xt-pw-quer .xt-p-ok{right:6px;top:6px}
}
.ep-w.xt-ein{background:linear-gradient(135deg,#E8890C,#F2B705 55%,#E85D9A)!important;color:#fff!important;border:0!important;text-align:left;cursor:pointer;gap:4px;justify-content:flex-start}
.ep-w.xt-ein.xt-o{background:linear-gradient(135deg,#8A5A16,#B0800F 55%,#A2457A)!important}
.ep-w.xt-ein small,.ep-w.xt-ein b,.ep-w.xt-ein .xt-ein-t{color:#fff!important;position:relative;z-index:1}
.ep-w.xt-ein small{font-weight:800;letter-spacing:.06em;text-transform:uppercase;font-size:.75rem;opacity:.95}
.ep-w.xt-ein b{font-size:1.25rem;margin-top:auto;max-width:62%}
.ep-w.xt-ein .xt-ein-t{font-size:.85rem;font-weight:600;opacity:.95;max-width:58%}
.ep-w.xt-ein .xt-ein-truhe{position:absolute;right:8px;bottom:8px;width:40%;max-width:120px}
.ep-w.xt-ein.xt-z .xt-ein-truhe{animation:xtHuepf 3.2s ease-in-out infinite}
.ep-w.xt-ein:focus-visible{outline:3px solid #FFE34D;outline-offset:3px}
.xt-svg{display:block;width:100%;height:auto;overflow:visible}
.xt-svg .xt-deckel{transform-box:fill-box;transform-origin:0% 100%;transition:transform .55s cubic-bezier(.34,1.8,.5,1)}
.xt-svg .xt-innen{opacity:0;transition:opacity .3s}
.xt-svg.xt-offen .xt-deckel,.xt-buehne.xt-auf .xt-deckel{transform:translate(-4px,-22px) rotate(-24deg)}
.xt-svg.xt-offen .xt-innen,.xt-buehne.xt-auf .xt-innen{opacity:1}

.xseite .xt-kopf{background:linear-gradient(135deg,#E8890C,#F2B705 55%,#E85D9A)}
.xt-raster{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:16px;align-items:start}
.xt-buehne{position:relative;border-radius:28px;padding:22px 20px 20px;color:#fff;background:linear-gradient(160deg,#2B2F7A,#4C2C8F 55%,#7A2E86);box-shadow:0 14px 30px rgba(60,40,140,.25);overflow:hidden;display:flex;flex-direction:column;align-items:center;gap:14px;min-height:360px;box-sizing:border-box}
.xt-buehne.xt-gross{background:linear-gradient(160deg,#3A1677,#6D28D9 55%,#C0369B)}
.xt-strahlen{position:absolute;left:50%;top:130px;width:520px;height:520px;margin:-260px 0 0 -260px;border-radius:50%;background:repeating-conic-gradient(from 0deg,rgba(255,230,140,.16) 0 10deg,transparent 10deg 24deg);opacity:0;transform:scale(.6);transition:opacity .6s,transform .8s;pointer-events:none;-webkit-mask:radial-gradient(circle,#000 20%,transparent 68%);mask:radial-gradient(circle,#000 20%,transparent 68%)}
.xt-buehne.xt-auf .xt-strahlen{opacity:1;transform:scale(1);animation:xtDreh 30s linear infinite}
@keyframes xtDreh{to{transform:rotate(360deg)}}
.xt-truhe{position:relative;width:min(240px,62vw);z-index:1;margin-top:18px}
.xt-buehne:not(.xt-auf) .xt-truhe{animation:xtSchweb 3s ease-in-out infinite}
.xt-buehne.xt-wackeln .xt-truhe{animation:xtWackel .7s ease-in-out}
@keyframes xtSchweb{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes xtWackel{0%,100%{transform:rotate(0)}15%{transform:rotate(-6deg)}30%{transform:rotate(6deg)}45%{transform:rotate(-5deg)}60%{transform:rotate(4deg)}75%{transform:rotate(-2deg)}}
.xt-funken{position:absolute;left:50%;top:44%;width:0;height:0}
.xt-funken i{position:absolute;left:-5px;top:-5px;width:10px;height:10px;border-radius:50%;opacity:0;animation:xtFunke 1.3s cubic-bezier(.15,.7,.3,1) var(--d,0s) forwards}
.xt-funken i.xt-st{border-radius:2px;width:9px;height:9px}
@keyframes xtFunke{0%{opacity:1;transform:translate(0,0) scale(.4)}60%{opacity:1}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(1.1)}}
.xt-aktion{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:12px;width:100%}
.xt-glas{margin:0;background:rgba(15,20,48,.55);color:#fff;padding:9px 16px;border-radius:16px;font-weight:700;text-align:center}
.xt-bel-titel:focus{outline:none}
.xt-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:0;border-radius:18px;padding:14px 26px;font:800 1.1rem "Lexend",system-ui,sans-serif;color:#1B2240;background:#FFE34D;box-shadow:0 6px 0 #C9A200,0 14px 26px -10px rgba(0,0,0,.4);cursor:pointer;transition:transform .1s}
.xt-btn:active{transform:translateY(3px);box-shadow:0 3px 0 #C9A200}
.xt-btn:disabled{opacity:.7;cursor:default}
.xt-btn:focus-visible,.xt-mini-btn:focus-visible,.xt-schalter:focus-visible{outline:3px solid #fff;outline-offset:3px}
.xt-btn.hell{background:#fff;box-shadow:0 6px 0 #CFC8EE,0 14px 26px -12px rgba(0,0,0,.35)}
.xt-btn .xt-mini{width:22px;height:22px}
.xt-bel-liste{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px;width:100%;max-width:460px}
.xt-bel{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:18px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.2);animation:xtRein .45s cubic-bezier(.3,1.4,.5,1) calc(var(--i,0)*.12s) both}
@keyframes xtRein{from{opacity:0;transform:translateY(12px) scale(.96)}to{opacity:1;transform:none}}
.xt-bel>span:nth-child(2){display:flex;flex-direction:column;min-width:0;flex:1}
.xt-bel b{font:700 1.05rem "Fredoka",system-ui,sans-serif;color:#fff}
.xt-bel small{color:rgba(255,255,255,.92);font-size:.85rem;line-height:1.35}
.xt-bic{flex:none;width:42px;height:42px;border-radius:14px;display:grid;place-items:center;font-size:24px;background:rgba(255,255,255,.2);overflow:hidden}
.xt-bic img{width:100%;height:100%;object-fit:cover}
.xt-b-xp .xt-bic{background:#FFE34D}
.xt-mini-btn{flex:none;border:0;border-radius:12px;padding:8px 12px;background:#fff;color:#1B2240;font:700 .85rem "Lexend",system-ui,sans-serif;cursor:pointer}
.xt-morgen{display:flex;align-items:center;gap:10px;margin:2px 0 0;background:rgba(15,20,48,.55);padding:8px 14px 8px 8px;border-radius:18px;font-weight:700}
.xt-morgen-img{width:46px;height:46px;object-fit:cover;object-position:top;border-radius:50%;background:rgba(255,255,255,.2);flex:none}
.xt-seite{display:flex;flex-direction:column;gap:16px;min-width:0}
.xt-karte{border-radius:24px;padding:18px;color:#fff;background:linear-gradient(140deg,#0A6575,#0E9384);box-shadow:0 10px 22px rgba(27,34,64,.22)}
.xt-karte h2{margin:0 0 10px;font:800 1.2rem "Bricolage Grotesque","Fredoka",system-ui,sans-serif;color:#fff}
.xt-karte p{margin:0;color:rgba(255,255,255,.92);font-size:.9rem;line-height:1.4}
.xt-k-pause{display:flex;align-items:center;gap:14px;background:linear-gradient(140deg,#2E4BEA,#5B6CFF)}
.xt-k-pause h2{margin-bottom:4px}
.xt-kal{list-style:none;margin:0 0 12px;padding:0;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px}
.xt-kal li{display:flex;flex-direction:column;align-items:center;gap:3px;padding:7px 2px;border-radius:14px;background:rgba(255,255,255,.12);min-width:0}
.xt-kal li.xt-heute{box-shadow:inset 0 0 0 2px #FFE34D}
.xt-kal li.xt-ja{background:rgba(255,255,255,.26)}
.xt-kal small{font-size:.72rem;font-weight:700;color:#fff}
.xt-kal i{font-style:normal;font-size:.7rem;opacity:.9}
.xt-kt{width:26px;height:26px;display:grid;place-items:center;border-radius:50%;background:rgba(255,255,255,.14);font-size:17px}
.xt-kal li.xt-ja .xt-kt{background:rgba(255,255,255,.9)}
.xt-kt .xt-mini{width:19px;height:19px}
.xt-fort{display:flex;flex-direction:column;gap:8px}
.xt-punkte{display:flex;gap:6px}
.xt-punkte i{width:18px;height:18px;border-radius:50%;background:rgba(255,255,255,.22)}
.xt-punkte i.xt-an{background:#FFE34D}
.xt-punkte i.xt-stern{border-radius:4px;transform:rotate(45deg) scale(.9)}
.xt-schalter{flex:none;margin-left:auto;display:flex;align-items:center;gap:8px;border:0;background:rgba(15,20,48,.35);border-radius:999px;padding:5px 12px 5px 5px;cursor:pointer;color:#fff;font:700 .9rem "Lexend",system-ui,sans-serif}
.xt-sch-k{width:44px;height:26px;border-radius:13px;background:rgba(255,255,255,.3);position:relative;transition:background .2s}
.xt-sch-k::after{content:"";position:absolute;left:3px;top:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:transform .2s}
.xt-schalter[aria-checked="true"] .xt-sch-k{background:#14B87A}
.xt-schalter[aria-checked="true"] .xt-sch-k::after{transform:translateX(18px)}

.xt-ov{position:fixed;inset:0;z-index:10000;display:grid;place-items:center;padding:16px;box-sizing:border-box;opacity:0;transition:opacity .3s}
.xt-ov.xt-an{opacity:1}
.xt-erinnerung{background:rgba(15,20,48,.5);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}
.xt-box{position:relative;width:min(420px,100%);border-radius:28px;padding:20px 22px 22px;color:#fff;text-align:center;background:linear-gradient(150deg,#0E9384,#2E4BEA 70%,#5B4BF5);box-shadow:0 24px 50px rgba(0,0,0,.35);transform:translateY(16px) scale(.97);transition:transform .35s cubic-bezier(.3,1.4,.5,1);box-sizing:border-box}
.xt-ov.xt-an .xt-box{transform:none}
.xt-box img{height:150px;width:auto;max-width:100%;margin:-6px auto 4px;display:block}
.xt-box h2{margin:0 0 6px;font:800 1.4rem "Bricolage Grotesque","Fredoka",system-ui,sans-serif;color:#fff}
.xt-box p{margin:0 0 16px;font-size:1rem;line-height:1.45;color:#fff}
.xt-knoepfe{display:flex;flex-direction:column;gap:12px}
.xt-pause{background:linear-gradient(180deg,#1C2E5C,#2D5F7A 60%,#3E8C86);overflow:auto}
.xt-pbox{display:flex;flex-direction:column;align-items:center;gap:14px;color:#fff;text-align:center;max-width:460px;width:100%;padding:8px 0}
.xt-ptitel{margin:0;font:800 1.8rem "Bricolage Grotesque","Fredoka",system-ui,sans-serif;letter-spacing:.04em;color:#fff}
.xt-ptext{margin:0;font-size:1.02rem;line-height:1.5;background:rgba(15,20,48,.35);padding:10px 16px;border-radius:18px;color:#fff}
.xt-uhr{position:relative;width:min(210px,52vw);aspect-ratio:1;display:grid;place-items:center}
.xt-uhr svg{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg)}
.xt-u0{fill:none;stroke:rgba(255,255,255,.18);stroke-width:7}
.xt-u1{fill:none;stroke:#BFF3E6;stroke-width:7;stroke-linecap:round;transition:stroke-dashoffset .5s linear}
.xt-atem{position:absolute;inset:22%;border-radius:50%;background:radial-gradient(circle,rgba(191,243,230,.45),rgba(191,243,230,.08) 70%);animation:xtAtem 8s ease-in-out infinite}
@keyframes xtAtem{0%,100%{transform:scale(.8)}50%{transform:scale(1.15)}}
.xt-zeit{position:relative;font:700 2.4rem "Fredoka",system-ui,sans-serif;font-variant-numeric:tabular-nums;color:#fff}
.xt-pimg{width:min(240px,60vw);height:auto}
.xt-pause.xt-fertig .xt-u1{stroke:#FFE34D}
@media (max-width:860px){.xt-raster{grid-template-columns:1fr}}
@media (max-width:560px){
  .xt-buehne{padding:14px 12px 16px;border-radius:24px;min-height:0;gap:10px}
  .xt-truhe{width:min(170px,46vw);margin-top:6px}
  .xt-btn{padding:12px 22px;font-size:1rem}
  .xt-bel{padding:8px 10px;gap:10px}
  .xt-bic{width:36px;height:36px;font-size:20px}
  .xt-karte{padding:14px;border-radius:22px}
  .xt-kal{gap:4px}
  .xt-k-pause{gap:10px}
  .xt-box img{height:120px}
}
@media (max-height:700px){.xt-pimg{display:none}.xt-uhr{width:min(170px,44vw)}}
@media (prefers-reduced-motion:reduce){
  .xt-pille.xt-z,.xt-pille.xt-z::after,.ep-w.xt-ein.xt-z .xt-ein-truhe,.xt-buehne:not(.xt-auf) .xt-truhe,.xt-buehne.xt-wackeln .xt-truhe,.xt-buehne.xt-auf .xt-strahlen,.xt-atem{animation:none!important}
  .xt-svg .xt-deckel{transition:none}
  .xt-bel{animation:none}
  .xt-ov,.xt-box,.xt-strahlen{transition:none}
}
`;
document.head.appendChild(css);
})();
