/* easyplay · mobilpager.js
   Handy-Ansicht ohne Hoch-Scrollen: Ist eine Seite länger als der Bildschirm, wird sie in Seiten
   aufgeteilt, die man nach links und rechts wischt. Die Bausteine bleiben, wo sie sind; gezeigt wird
   jeweils ein Ausschnitt, geschnitten wird immer zwischen zwei Bausteinen (nie mitten durch eine Karte).
   Anzeige: Punkte unten, Pfeile links und rechts, beim ersten Mal am Tag ein Hinweis «Wische für mehr».
   Nicht angefasst: Startseite, Quiz, Lesen in der Bibliothek, Qeels, laufende Spiele.
   Läuft nur in der App-Ansicht (Handy, iPad hochkant). API: window.EP_MOBILPAGER.neu() */
(function(){
"use strict";
if(typeof window.render !== "function") return;

const AUS = new Set(["home", "quiz", "libseite", "libartikel", "duellsplit", "duellplay", "liveplay", "livehost", "hardcore", "check", "fremdtest", "duelllobby"]);
const KS = "ep-x-mobilpager-hinweis";
const ruhig = () => { try{ return matchMedia("(prefers-reduced-motion: reduce)").matches; }catch(e){ return false; } };
let P = null, zeit = null, breite = innerWidth;

function aktiv(){
  try{ if(!(window.EP_APP && window.EP_APP.an())) return false; }catch(e){ return false; }
  if(innerWidth >= 700 && innerHeight < innerWidth) return false;
  let sc = ""; try{ sc = S.screen || ""; }catch(e){}
  if(AUS.has(sc) || document.body.classList.contains("reelsauf")) return false;
  if(document.querySelector(".modal.offen, dialog[open]")) return false;
  try{ if(S.libModus && !/^lib(thema)?$/.test(sc)) return false; }catch(e){}
  return true;
}
function navOben(){ const n = document.getElementById("epTabs"); if(n){ const cs = getComputedStyle(n), r = n.getBoundingClientRect(); if(cs.position === "fixed" && cs.display !== "none" && r.height > 20 && r.top > innerHeight * 0.5) return r.top; } return innerHeight; }
const istKopf = c => c.classList.contains("ap-kz") || c.matches("nav.crumbs") || c.classList.contains("crumbs");

/* Schnittkanten: Oberkanten aller «Bausteine» (Elemente, die nicht zu hoch sind, um ganz auf eine Seite zu passen) */
function kanten(wurzel, H){
  const basis = wurzel.getBoundingClientRect().top, out = new Set([0]);
  const geh = (el, tiefe) => {
    [...el.children].forEach(c => {
      const cs = getComputedStyle(c); if(cs.display === "none" || cs.position === "fixed" || cs.position === "absolute") return;
      const r = c.getBoundingClientRect(); if(r.height < 1) return;
      const oben = r.top - basis;
      out.add(Math.max(0, Math.round(oben - 6)));
      if(r.height > H * 0.9 && tiefe < 8 && c.children.length) geh(c, tiefe + 1);
    });
  };
  geh(wurzel, 0);
  return [...out].sort((a, b) => a - b);
}
function seitenPlanen(gesamt, H, k){
  const starts = [0]; let s = 0;
  while(gesamt - s > H + 4){
    let n = 0; for(const t of k){ if(t > s + 40 && t <= s + H) n = t; }
    if(!n) n = s + H;                       // ein Baustein ist höher als eine Seite: dann eben dort schneiden
    starts.push(n); s = n;
  }
  return starts;
}

function weg(){
  if(!P) return;
  try{ P.ro && P.ro.disconnect(); }catch(e){}
  P.rest.forEach(c => { c.style.transform = ""; c.style.clipPath = ""; c.style.transition = ""; c.style.opacity = ""; c.classList.remove("mp-teil"); });
  P.zeig && P.zeig.remove(); P.hw && P.hw.remove();
  P.app && P.handler.forEach(([t, f, o]) => P.app.removeEventListener(t, f, o));
  document.body.classList.remove("mp-an"); P = null;
}
function aufbauen(){
  weg(); document.body.classList.remove("mp-fest");
  if(!aktiv()) return;
  const app = document.getElementById("app"); if(!app) return;
  document.documentElement.scrollTop = 0; scrollTo(0, 0);
  const kinder = [...app.children].filter(c => { const cs = getComputedStyle(c); return cs.display !== "none" && cs.position !== "fixed" && cs.position !== "absolute"; });
  const kopf = []; let i = 0; while(i < kinder.length && istKopf(kinder[i])){ kopf.push(kinder[i]); i++; }
  const rest = kinder.slice(i); if(!rest.length) return;
  const navT = navOben();
  const oben = Math.min(...rest.map(c => c.getBoundingClientRect().top));
  const bottom = Math.max(...rest.map(c => c.getBoundingClientRect().bottom));
  const H = Math.floor(navT - 46 - oben);
  if(bottom <= navT - 6){ document.body.classList.add("mp-fest"); return; }      // passt: nur festhalten, nichts teilen
  if(H < 220) return;
  P = {app, rest, H, oben, seite:0, starts:[0], innen:0, handler:[]};
  rest.forEach(c => c.classList.add("mp-teil"));
  document.body.classList.add("mp-an");
  // Anzeige (fest über der unteren Leiste)
  const zeig = document.createElement("div"); zeig.className = "mp-zeig"; zeig.style.bottom = Math.round(innerHeight - navT + 8) + "px";
  document.body.appendChild(zeig); P.zeig = zeig;
  neuMessen();
  // Wischen
  let x0 = 0, y0 = 0, t0 = 0, wisch = false, sperre = false, imInhalt = false;
  const an = (t, f, o) => { app.addEventListener(t, f, o); P.handler.push([t, f, o]); };
  an("touchstart", e => {
    const t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; t0 = Date.now(); wisch = false;
    imInhalt = rest.some(c => c.contains(e.target)); sperre = false;
    let el = e.target;
    while(el && el !== app){ const cs = getComputedStyle(el); if(/(auto|scroll)/.test(cs.overflowX) && el.scrollWidth > el.clientWidth + 4){ sperre = true; break; } el = el.parentElement; }
  }, {passive:true});
  an("touchmove", e => {
    if(!P || sperre || !imInhalt) return; const t = e.touches[0], dx = t.clientX - x0, dy = t.clientY - y0;
    if(!wisch && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.2) wisch = true;
    if(wisch){ const rand = (dx > 0 && P.seite === 0) || (dx < 0 && P.seite === P.starts.length - 1); setze(rand ? dx * .25 : dx, false); }
    else if(Math.abs(dy) > 8){ seiteInnen(dy); y0 = t.clientY; }
  }, {passive:true});
  an("touchend", e => {
    if(!P || !wisch) return;
    const dx = ((e.changedTouches[0] || {}).clientX || x0) - x0, schnell = Date.now() - t0 < 300;
    if(dx < -60 || (schnell && dx < -25)) geh(1); else if(dx > 60 || (schnell && dx > 25)) geh(-1); else zeigen(P.seite, true);
  });
  an("keydown", e => { if(e.target.closest && e.target.closest("input,textarea,select,[contenteditable]")) return; if(e.key === "PageDown"){ e.preventDefault(); geh(1); } else if(e.key === "PageUp"){ e.preventDefault(); geh(-1); } });
  an("wheel", e => { if(!P) return; e.preventDefault(); if(P.rad) return; if(Math.abs(e.deltaY) < 20 && Math.abs(e.deltaX) < 20) return; P.rad = 1; setTimeout(() => { if(P) P.rad = 0; }, 450); geh((Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) > 0 ? 1 : -1); }, {passive:false});
  an("focusin", e => { if(!P || !rest.some(c => c.contains(e.target))) return; const y = posVon(e.target); let s = 0; P.starts.forEach((st, j) => { if(st <= y + 2) s = j; }); if(s !== P.seite) zeigen(s, false); });
  try{ P.ro = new ResizeObserver(() => { clearTimeout(P.rt); P.rt = setTimeout(neuMessen, 150); }); rest.forEach(c => P.ro.observe(c)); }catch(e){}
  // Hinweis
  let gesehen = ""; try{ gesehen = localStorage.getItem(KS) || ""; }catch(e){}
  const tag = new Date().toDateString();
  if(P.starts.length > 1){
    if(gesehen !== tag){
      const hw = document.createElement("div"); hw.className = "mp-hinweis"; hw.setAttribute("role", "status"); hw.style.bottom = Math.round(innerHeight - navT + 48) + "px";
      hw.innerHTML = `<span class="mp-hand" aria-hidden="true">👈</span> Wische für mehr`;
      document.body.appendChild(hw); P.hw = hw;
      setTimeout(() => { hw.remove(); try{ localStorage.setItem(KS, tag); }catch(e){} }, 4200);
    } else if(!ruhig()){
      setTimeout(() => { if(!P || P.seite) return; setze(-22, true); setTimeout(() => P && zeigen(P.seite, true), 380); }, 700);
    }
  }
}
/* Position (in Inhalts-Koordinaten, ohne Verschiebung) */
function posVon(el){ const r = el.getBoundingClientRect(); return r.top - P.oben + P.starts[P.seite] + P.innen; }
function setze(dx, anim){
  const y = P.starts[P.seite] + P.innen;
  P.rest.forEach(c => { c.style.transition = anim ? "transform .35s ease" : "none"; c.style.transform = `translate(${dx}px, ${-y}px)`; });
}
/* Ist ein einzelner Baustein höher als die Seite, darf man innerhalb der Seite verschieben */
function seiteInnen(dy){
  if(!P) return; const s = P.seite, von = P.starts[s], bis = (P.starts[s + 1] != null ? P.starts[s + 1] : P.gesamt) - von;
  if(bis <= P.H + 4) return;
  P.innen = Math.max(0, Math.min(bis - P.H, P.innen - dy)); schneiden(); setze(0, false);
}
function neuMessen(){
  if(!P) return;
  // Masse ohne Verschiebung bestimmen
  const alt = P.rest.map(c => [c.style.transform, c.style.clipPath]);
  P.rest.forEach(c => { c.style.transform = "none"; c.style.clipPath = "none"; });
  P.oben = Math.min(...P.rest.map(c => c.getBoundingClientRect().top));
  const unten = Math.max(...P.rest.map(c => c.getBoundingClientRect().bottom));
  P.gesamt = unten - P.oben;
  const k = new Set([0]); P.rest.forEach(c => kantenIn(c, P.oben, P.H, k));
  P.starts = seitenPlanen(P.gesamt, P.H, [...k].sort((a, b) => a - b));
  P.rest.forEach((c, i) => { c.style.transform = alt[i][0]; c.style.clipPath = alt[i][1]; });
  if(P.seite > P.starts.length - 1) P.seite = P.starts.length - 1;
  punkte(); zeigen(P.seite, false);
}
function kantenIn(el, basis, H, out){
  const r = el.getBoundingClientRect(); if(r.height < 1) return;
  out.add(Math.max(0, Math.round(r.top - basis - 6)));
  if(r.height > H * 0.9 && el.children.length) [...el.children].forEach(c => { const cs = getComputedStyle(c); if(cs.display === "none" || cs.position === "fixed" || cs.position === "absolute") return; kantenIn(c, basis, H, out); });
}
function punkte(){
  const {zeig, starts} = P, n = starts.length;
  if(n < 2){ zeig.innerHTML = ""; zeig.hidden = true; return; }
  zeig.hidden = false;
  zeig.innerHTML = `<button type="button" class="mp-pf l" aria-label="Vorherige Seite">‹</button><span class="mp-punkte">${starts.map((_, i) => `<button type="button" class="${i === P.seite ? "an" : ""}" aria-label="Seite ${i + 1} von ${n}" data-mps="${i}"></button>`).join("")}<b class="mp-zahl">${P.seite + 1}/${n}</b></span><button type="button" class="mp-pf r" aria-label="Nächste Seite">›</button>`;
  zeig.querySelector(".l").onclick = () => geh(-1); zeig.querySelector(".r").onclick = () => geh(1);
  zeig.querySelectorAll("[data-mps]").forEach(b => b.onclick = () => zeigen(+b.dataset.mps, true));
}
function geh(d){ if(!P) return; if(P.hw){ P.hw.remove(); P.hw = null; try{ localStorage.setItem(KS, new Date().toDateString()); }catch(e){} } const z = Math.max(0, Math.min(P.starts.length - 1, P.seite + d)); if(z === P.seite){ zeigen(z, true); return; } zeigen(z, true, d); try{ window.EP_SOUND?.play?.("wisch"); }catch(e){} }
/* sichtbarer Bereich: von starts[s] bis zum nächsten Schnitt (höchstens eine Seitenhöhe) */
function schneiden(){
  const s = P.seite, von = P.starts[s] + P.innen, bis = Math.min(von + P.H, P.starts[s + 1] != null && !P.innen ? P.starts[s + 1] : von + P.H);
  P.rest.forEach(c => {
    const t = c.style.transform; c.style.transform = "none";
    const r = c.getBoundingClientRect(); c.style.transform = t;
    const o = r.top - P.oben, h = r.height;
    const oben = Math.max(0, von - o), unten = Math.max(0, (o + h) - bis);
    c.style.clipPath = (oben >= h || unten >= h || oben + unten >= h) ? "inset(0 0 100% 0)" : `inset(${oben > 0 ? oben : -40}px -40px ${unten}px -40px)`;
  });
}
function zeigen(s, anim, richtung){
  if(!P) return; P.seite = s; P.innen = 0;
  schneiden();
  if(anim && richtung && !ruhig()){
    P.rest.forEach(c => { c.style.transition = "none"; c.style.opacity = "0"; });
    setze(richtung > 0 ? 50 : -50, false); void P.rest[0].offsetWidth;
    P.rest.forEach(c => { c.style.transition = "transform .25s ease-out, opacity .25s"; c.style.opacity = "1"; });
    const y = P.starts[s]; P.rest.forEach(c => c.style.transform = `translate(0px, ${-y}px)`);
  } else { P.rest.forEach(c => c.style.opacity = "1"); setze(0, !!anim); }
  const zeig = P.zeig;
  zeig.querySelectorAll("[data-mps]").forEach((b, i) => b.classList.toggle("an", i === s));
  const z = zeig.querySelector(".mp-zahl"); if(z) z.textContent = `${s + 1}/${P.starts.length}`;
  const l = zeig.querySelector(".l"), r = zeig.querySelector(".r"); if(l) l.disabled = s <= 0; if(r) r.disabled = s >= P.starts.length - 1;
}

function planen(){ clearTimeout(zeit); zeit = setTimeout(aufbauen, 450); }
const vor = window.render;
window.render = function(){ weg(); const r = vor.apply(this, arguments); planen(); return r; };
addEventListener("resize", () => { if(Math.abs(innerWidth - breite) < 2 && P){ return; } breite = innerWidth; planen(); });
addEventListener("orientationchange", () => setTimeout(planen, 300));

const css = document.createElement("style"); css.id = "ep-x-mobilpager";
css.textContent = `
body.mp-an,body.mp-fest{overflow:hidden!important;overscroll-behavior:none}
html:has(body.mp-an),html:has(body.mp-fest){overflow:hidden}
body.ep-app .eplegal{display:none!important}
.mp-teil{will-change:transform;touch-action:pan-x pan-y pinch-zoom}
.mp-zeig{position:fixed;left:0;right:0;z-index:60;display:flex;align-items:center;justify-content:center;gap:10px;pointer-events:none}
.mp-zeig[hidden]{display:none}
.mp-zeig>*{pointer-events:auto}
.mp-punkte{display:flex;gap:6px;align-items:center;padding:7px 12px;border-radius:999px;background:rgba(15,20,48,.78);box-shadow:0 4px 14px rgba(0,0,0,.3);max-width:70vw;overflow:hidden}
.mp-punkte button{width:8px;height:8px;padding:0;border:0;border-radius:50%;background:rgba(255,255,255,.45);cursor:pointer;flex:none;transition:width .2s,background .2s}
.mp-punkte button.an{width:22px;border-radius:99px;background:#FFE34D}
.mp-zahl{font:700 11px/1 "Lexend",system-ui,sans-serif;color:#fff;margin-left:4px;display:none}
.mp-punkte:has(button:nth-child(9)) button:not(.an){width:5px;height:5px}
.mp-punkte:has(button:nth-child(13)) button:not(.an){display:none}
.mp-punkte:has(button:nth-child(13)) .mp-zahl{display:inline}
.mp-pf{width:34px;height:34px;border-radius:50%;border:0;background:linear-gradient(135deg,#FF5FA2,#8A3FE0);color:#fff;font:800 22px/1 system-ui,sans-serif;cursor:pointer;display:grid;place-items:center;padding:0 0 3px;box-shadow:0 4px 12px rgba(80,30,160,.45)}
.mp-pf:disabled{opacity:.3;cursor:default;background:rgba(15,20,48,.7);box-shadow:none}
.mp-pf:focus-visible,.mp-punkte button:focus-visible{outline:3px solid #FFE34D;outline-offset:2px}
.mp-hinweis{position:fixed;right:16px;z-index:61;display:flex;align-items:center;gap:8px;padding:9px 14px;border-radius:999px;background:linear-gradient(135deg,#FF5FA2,#8A3FE0);color:#fff;font:700 13px "Lexend",system-ui,sans-serif;box-shadow:0 8px 20px rgba(80,30,160,.4);pointer-events:none;white-space:nowrap;animation:mpHinweis 4.2s ease forwards}
.mp-hand{display:inline-block;animation:mpHand 1s ease-in-out infinite}
@keyframes mpHand{0%,100%{transform:translateX(0)}50%{transform:translateX(-8px)}}
@keyframes mpHinweis{0%{opacity:0;transform:translateY(8px)}10%,85%{opacity:1;transform:none}100%{opacity:0}}
@media (prefers-reduced-motion:reduce){.mp-hand,.mp-hinweis,.mp-punkte button{animation:none;transition:none}}
`;
document.head.appendChild(css);
window.EP_MOBILPAGER = { neu:planen, seite:() => P ? {seite:P.seite, anzahl:P.starts.length} : null, geh };
})();
