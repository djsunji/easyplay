/* easyplay: Feinschliff der App-Ansicht (Handy und iPad, body.ep-app), 26.10.
   Lädt als letztes Skript. Nur CSS-Überschreibungen und kleine Eingriffe nach dem Zeichnen:
   Begrüssung «Hoi Name» ohne Logo, Ton und Sprache ganz rechts, Karussell kleiner, Startseite ohne Scrollen,
   Grafiken nicht per langem Drücken speicherbar, Entdecken- und Themen-Grafiken, Impressum nur im Profil,
   Bibliothek ohne Scrollen, schönere Stufenwahl, kompakte Zeitreise, Politik und Training/Test. */
(function(){
"use strict";
const app = () => document.body.classList.contains("ep-app");
const G = "img/app2/";

/* ---------- Stil ---------- */
const css = document.createElement("style"); css.id = "ep-appfein";
css.textContent = `
/* Grafiken: kein Speichern per langem Drücken, kein Ziehen */
body.ep-app img,body.ep-app .ap-held,body.ep-app .ap-karu{-webkit-touch-callout:none!important;-webkit-user-select:none!important;user-select:none!important;-webkit-user-drag:none!important}
body.ep-app .ap img,body.ep-app .ap-held img,body.ep-app .st-kids,body.ep-app .ap-libkids img,body.ep-app #epTabs img,body.ep-app .x-app img,body.ep-app .wk2-kids,body.ep-app button img{pointer-events:none}

/* Impressum und Datenschutz nur im Profil */
html body.ep-app footer.eplegal{display:none!important}

/* ---- Startseite: Begrüssung, Ton und Sprache rechts ---- */
html body.ep-app .ap-heute{position:relative;overflow:hidden!important;overscroll-behavior:none}
html body.ep-app .ap-heute .ap-gruss .ap-logo{display:none!important}
html body.ep-app .ap-heute .ap-gruss > span{display:none!important}
html body.ep-app .ap-heute .ap-gruss > b{padding-right:110px!important;white-space:nowrap;overflow:hidden!important;text-overflow:ellipsis;font-size:32px}
html body.ep-app .ap-heute > .xs-knopf,html body.ep-app .ap-heute > .xui-knopf{position:absolute!important;left:auto!important;top:2px!important;visibility:visible!important;margin:0!important}
html body.ep-app .ap-heute > .xui-knopf{right:4px!important}
html body.ep-app .ap-heute > .xs-knopf{right:54px!important}
@media (min-width:700px){html body.ep-app .ap-heute .ap-gruss > b{font-size:44px}html body.ep-app .ap-heute > .xs-knopf,html body.ep-app .ap-heute > .xui-knopf{top:8px!important}}

/* ---- Karussell: Text und Knopf kleiner, nichts wird abgeschnitten ---- */
html body.ep-app .ap-held .apht{width:58%;gap:4px;justify-content:center;min-height:0;overflow:hidden}
html body.ep-app .ap-held2 .apht{width:62%}
html body.ep-app .ap-held.hs-start .apht{width:50%}
html body.ep-app .ap-held h1{font-size:clamp(24px,7vw,46px)!important;line-height:1.02!important}
html body.ep-app .ap-held .aph-klein{font-size:clamp(17px,5vw,30px)!important;line-height:1.1!important;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
html body.ep-app .ap-held .aphoi{font-size:12px!important;line-height:1.2;display:flex!important;align-items:center;gap:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
html body.ep-app .ap-held .aph-ic{flex:none;transform:scale(.85);transform-origin:left center}
html body.ep-app .ap-held .apzahlen,html body.ep-app .ap-held .aph-text{font-size:12.5px!important;line-height:1.25!important;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
html body.ep-app .ap-held .ap-weissbtn{margin-top:6px!important;padding:7px 14px!important;min-height:0!important;height:auto!important;font-size:14px!important;line-height:1.2!important;border-radius:999px!important;gap:6px;box-shadow:0 4px 0 rgba(27,34,64,.25)!important;flex:none;white-space:nowrap}
html body.ep-app .ap-held .ap-weissbtn svg{width:14px;height:14px}
@media (min-width:700px){html body.ep-app .ap-held .ap-weissbtn{font-size:17px!important;padding:10px 20px!important}html body.ep-app .ap-held .aphoi{font-size:15px!important}html body.ep-app .ap-held .apzahlen,html body.ep-app .ap-held .aph-text{font-size:15px!important}}

/* ---- Entdecken mit neuer Grafik ---- */
html body.ep-app .ap-heute .x-app{background:url(${G}entdecken.webp) center/100% 100% no-repeat!important;border:0!important;box-shadow:0 14px 28px -16px rgba(80,40,200,.7)!important}
html body.ep-app .ap-heute .x-app::before,html body.ep-app .ap-heute .x-app::after{display:none!important}

/* ---- Themen: Grafiken der Bereiche ---- */
html body.ep-app .ap-themen .apb{background-color:transparent!important;background-position:center!important;background-size:100% 100%!important;background-repeat:no-repeat!important;border:0!important}
html body.ep-app .ap-themen .apb::before,html body.ep-app .ap-themen .apb::after{display:none!important}
html body.ep-app .ap-themen .apb .apwm{display:none!important}
html body.ep-app .ap-themen .apb[data-af="welt"]{background-image:url(${G}th-welt.webp)!important}
html body.ep-app .ap-themen .apb[data-af="natur"]{background-image:url(${G}th-natur.webp)!important}
html body.ep-app .ap-themen .apb[data-af="geld"]{background-image:url(${G}th-schweiz.webp)!important}
html body.ep-app .ap-themen .apb[data-af="alltag"]{background-image:url(${G}th-alltag.webp)!important}
html body.ep-app .ap-themen .ap-unten [data-x="mix"]{background:url(${G}th-mix.webp) center/100% 100% no-repeat!important;border:0!important}
html body.ep-app .ap-themen .ap-unten [data-x="lib"]{background:url(${G}th-lib.webp) center/100% 100% no-repeat!important;border:0!important}
html body.ep-app .ap-themen .ap-unten [data-x="mix"]::before,html body.ep-app .ap-themen .ap-unten [data-x="lib"]::before,html body.ep-app .ap-themen .ap-unten [data-x="mix"]::after,html body.ep-app .ap-themen .ap-unten [data-x="lib"]::after{display:none!important}
html body.ep-app .ap-themen .ap-unten [data-x="mix"] .apico,html body.ep-app .ap-themen .ap-unten [data-x="lib"] .apico{background:center/contain no-repeat!important;border:0!important;box-shadow:0 6px 12px -6px rgba(0,0,0,.45)!important;border-radius:12px!important}
html body.ep-app .ap-themen .ap-unten [data-x="mix"] .apico{background-image:url(${G}ic-wuerfel.webp)!important}
html body.ep-app .ap-themen .ap-unten [data-x="lib"] .apico{background-image:url(${G}ic-buch.webp)!important}
html body.ep-app .ap-themen .ap-unten [data-x="mix"] .apico svg,html body.ep-app .ap-themen .ap-unten [data-x="lib"] .apico svg{display:none!important}

/* ---- Stufenwahl (Themen) und Stufen-Regler (Unterseiten): gleiche, schönere Form ---- */
html body.ep-app .ap-stufen,html body.ep-app .sbar .sbtns{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:5px!important;padding:5px!important;border-radius:20px!important;background:rgba(22,14,78,.38)!important;border:1.5px solid rgba(255,255,255,.28)!important;box-shadow:inset 0 2px 6px rgba(0,0,0,.18),0 10px 22px -14px rgba(27,20,90,.6)!important;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);overflow:visible!important;width:100%!important;box-sizing:border-box!important;flex-wrap:nowrap!important}
html body.ep-app .ap-stufen > button,html body.ep-app .sbar .sbtns > button{all:unset;box-sizing:border-box;display:flex!important;flex-direction:column;align-items:center;justify-content:center;gap:1px;min-width:0!important;width:auto!important;min-height:52px;padding:6px 2px!important;border-radius:15px!important;text-align:center;cursor:pointer;color:#fff!important;font:800 13px/1.1 "Lexend","Fredoka",system-ui,sans-serif!important;letter-spacing:-.01em;background:transparent!important;box-shadow:none!important;transition:background .2s,color .2s,transform .15s,box-shadow .2s;-webkit-tap-highlight-color:transparent;white-space:normal!important;overflow:hidden}
html body.ep-app .ap-stufen > button:active,html body.ep-app .sbar .sbtns > button:active{transform:scale(.95)}
html body.ep-app .ap-stufen > button b{font:800 13px/1.1 "Lexend","Fredoka",system-ui,sans-serif!important;color:inherit!important;white-space:nowrap}
html body.ep-app .ap-stufen > button small{font:600 10px/1.15 "Lexend",system-ui,sans-serif!important;color:inherit!important;opacity:.8;white-space:nowrap}
html body.ep-app .ap-stufen > button .af-se,html body.ep-app .sbar .sbtns > button .ic{font-size:20px!important;line-height:1!important;display:block!important;margin:0 0 2px!important;width:auto!important;height:auto!important}
html body.ep-app .ap-stufen > button[aria-pressed="true"],html body.ep-app .sbar .sbtns > button[aria-pressed="true"]{background:linear-gradient(180deg,#fff,#EEE9FF)!important;color:#3D2AB8!important;box-shadow:0 4px 0 #B9ABFF,0 8px 16px -6px rgba(27,20,90,.55)!important;transform:translateY(-1px)}
html body.ep-app .ap-stufen > button[aria-pressed="true"] small{opacity:.75}
html body.ep-app .sbar{display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:6px!important;width:100%!important;max-width:100%!important;box-sizing:border-box!important}
html body.ep-app .sbar .sbtns > button{font-size:12.5px!important;min-height:50px}
html body.ep-app .sbar .sinfo{align-self:flex-start}
@media (max-width:360px){html body.ep-app .ap-stufen > button b,html body.ep-app .sbar .sbtns > button{font-size:11.5px!important}html body.ep-app .ap-stufen > button small{font-size:9px!important}}

/* ---- Bibliothek Startseite: grosser Titel, ohne Kinder, ohne Scrollen ---- */
html body.ep-app.ep-s-lib .ap-libkids{display:none!important}
html body.ep-app.ep-s-lib .ap-kz h1{font-size:28px!important;white-space:nowrap!important;hyphens:none!important;-webkit-hyphens:none!important;overflow:visible!important;line-height:1.05!important;letter-spacing:-.01em}
html body.ep-app.ep-s-lib{overflow:hidden!important;overscroll-behavior:none}
html.ep-af-lib,html.ep-af-lib body{overflow:hidden!important;height:100%}

/* ---- Geschichte: Zeitreise kompakt in zwei Spalten ---- */
html body.ep-app.ep-s-geschmenu .epochs{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important}
html body.ep-app.ep-s-geschmenu .epochs .thema{min-height:0!important;padding:12px 10px 12px 12px!important;display:flex!important;flex-direction:row!important;align-items:center!important;gap:10px!important;text-align:left!important;border-radius:20px!important}
html body.ep-app.ep-s-geschmenu .epochs .thema .emo{width:42px!important;height:42px!important;min-width:42px;flex:none;margin:0!important;border-radius:13px!important;font-size:24px!important;display:grid!important;place-items:center}
html body.ep-app.ep-s-geschmenu .epochs .thema .emo .ic{font-size:24px!important}
html body.ep-app.ep-s-geschmenu .epochs .thema b{font-size:14px!important;line-height:1.15!important;display:block}
html body.ep-app.ep-s-geschmenu .epochs .thema .t{display:none!important}
html body.ep-app.ep-s-geschmenu .epochs .thema .n{font-size:11px!important;padding:2px 8px!important;margin-top:4px!important}
html body.ep-app.ep-s-geschmenu .epochs .thema .step{top:6px!important;right:9px!important;font-size:14px!important}
html body.ep-app.ep-s-geschmenu .epochs .thema > span:last-child{min-width:0}
html body.ep-app.ep-s-geschmenu p.label{margin:12px 0 8px!important;display:flex!important;align-items:baseline;gap:8px;flex-wrap:wrap}
html body.ep-app.ep-s-geschmenu p.label span{font-size:17px!important;padding:6px 14px!important}
html body.ep-app.ep-s-geschmenu p.label small{font-size:12px!important;padding:3px 10px!important}
html body.ep-app.ep-s-geschmenu .bereiche .bereich,html body.ep-app.ep-s-submenu #mixAll{min-height:0!important;padding:12px 14px!important;display:grid!important;grid-template-columns:44px 1fr auto;grid-template-areas:"e h c" "e p p";align-items:center;column-gap:12px;row-gap:2px;text-align:left!important;border-radius:20px!important}
html body.ep-app.ep-s-geschmenu .bereiche .bereich .emo,html body.ep-app.ep-s-submenu #mixAll .emo{grid-area:e;width:44px!important;height:44px!important;margin:0!important;font-size:24px!important;border-radius:13px!important;display:grid!important;place-items:center}
html body.ep-app.ep-s-geschmenu .bereiche .bereich h2,html body.ep-app.ep-s-submenu #mixAll h2{grid-area:h;font-size:17px!important;margin:0!important;line-height:1.15!important}
html body.ep-app.ep-s-geschmenu .bereiche .bereich p,html body.ep-app.ep-s-submenu #mixAll p{grid-area:p;font-size:12px!important;margin:0!important;line-height:1.25!important}
html body.ep-app.ep-s-geschmenu .bereiche .bereich .count-pill,html body.ep-app.ep-s-submenu #mixAll .count-pill{grid-area:c;position:static!important;font-size:11px!important;padding:3px 8px!important;margin:0!important}
html body.ep-app.ep-s-geschmenu .bereiche,html body.ep-app.ep-s-submenu .bereiche{margin-top:10px!important}

/* ---- Kopf der Unterseiten (Bereich, Politik, Geschichte, Training) kompakter ---- */
html body.ep-app.ep-s-geschmenu .bhead,html body.ep-app.ep-s-submenu .bhead,html body.ep-app.ep-s-mode .bhead{margin-bottom:8px!important}
html body.ep-app.ep-s-geschmenu .bhead h1,html body.ep-app.ep-s-submenu .bhead h1,html body.ep-app.ep-s-mode .bhead h1{font-size:22px!important;line-height:1.1!important}
html body.ep-app.ep-s-geschmenu .bhead .emo,html body.ep-app.ep-s-submenu .bhead .emo,html body.ep-app.ep-s-mode .bhead .emo{width:46px!important;height:46px!important;font-size:26px!important}
html body.ep-app.ep-s-submenu .themen{gap:8px!important}

/* ---- Training und gewerteter Test: auf einen Bildschirm ---- */
html body.ep-app.ep-s-mode #app .modes .modes{display:flex!important;flex-direction:column!important;gap:10px!important;margin-top:10px!important}
html body.ep-app.ep-s-mode #app .modes .mode{padding:14px 16px!important;text-align:left!important;border-radius:22px!important;display:grid!important;grid-template-columns:44px 1fr;column-gap:12px;align-items:center;min-height:0!important}
html body.ep-app.ep-s-mode #app .modes .mode > *{grid-column:1/-1}
html body.ep-app.ep-s-mode #app .modes .mode > .em{grid-column:1;grid-row:1/3;width:44px!important;height:44px!important;margin:0!important;font-size:24px!important;border-radius:13px!important;display:grid!important;place-items:center}
html body.ep-app.ep-s-mode #app .modes .mode > .em .ic{font-size:24px!important}
html body.ep-app.ep-s-mode #app .modes .mode > h2{grid-column:2;grid-row:1;font-size:19px!important;margin:0!important;line-height:1.1!important}
html body.ep-app.ep-s-mode #app .modes .mode > h2 + p{grid-column:2;grid-row:2;font-size:12.5px!important;line-height:1.3!important;margin:2px 0 0!important}
html body.ep-app.ep-s-mode #app .modes .mode .pick-lbl{display:none!important}
html body.ep-app.ep-s-mode #app .modes .mode .slider{margin:10px 0 0!important;display:grid!important;grid-template-columns:auto 1fr;align-items:center;column-gap:12px}
html body.ep-app.ep-s-mode #app .modes .mode .slider output{font-size:26px!important;min-width:42px;text-align:center;margin:0!important;line-height:1}
html body.ep-app.ep-s-mode #app .modes .mode .slider input{margin:0!important;width:100%}
html body.ep-app.ep-s-mode #app .modes .mode .slider .sl-scale,html body.ep-app.ep-s-mode #app .modes .mode .slider .help{display:none!important}
html body.ep-app.ep-s-mode #app .modes .mode .counts{display:flex!important;gap:6px!important;margin:8px 0 0!important;flex-wrap:nowrap!important}
html body.ep-app.ep-s-mode #app .modes .mode .counts .cnt{flex:1 1 0;min-width:0!important;height:34px!important;min-height:0!important;padding:0!important;font-size:14px!important}
html body.ep-app.ep-s-mode #app .modes .mode .big{margin-top:10px!important;min-height:0!important;padding:11px 14px!important;font-size:16px!important;width:100%;box-sizing:border-box}
html body.ep-app.ep-s-mode #app .modes .mode.test .punkteinfo{margin:8px 0 0!important;font-size:12.5px!important}
html body.ep-app.ep-s-mode #app .modes .mode.test .punkteinfo summary{padding:6px 10px!important}
html body.ep-app.ep-s-mode #app .modes .mode.test > p:not(:nth-of-type(1)){font-size:12px!important;margin:6px 0 0!important}
html body.ep-app.ep-s-mode .st-kopf{padding:12px 14px!important;margin-bottom:0!important}
html body.ep-app.ep-s-mode .st-kopf .st-kids{display:none!important}
html body.ep-app.ep-s-mode .st-kopf .bhead{margin-bottom:8px!important}
`;
document.head.appendChild(css);

/* lange Berührung auf Bildern: kein Menü zum Speichern */
document.addEventListener("contextmenu", e => { if(app() && e.target && (e.target.tagName === "IMG" || e.target.closest(".ap-held,.ap-karu,.x-app"))) e.preventDefault(); }, true);
document.addEventListener("dragstart", e => { if(app() && e.target && e.target.tagName === "IMG") e.preventDefault(); }, true);

/* ---------- nach dem Zeichnen ---------- */
const EMO = {1:"🌱", 2:"🚀", 3:"🏅", 4:"🌍"};
function gruss(){
  const b = document.querySelector("#app .ap-heute .ap-gruss > b"); if(!b) return;
  let n = ""; try{ n = (S.profil && S.profil.name) || ""; }catch(e){}
  const t = n ? "Hoi " + n : "Hoi!"; if(b.textContent !== t) b.textContent = t;
}
function heuteEinpassen(){
  const ap = document.querySelector("#app > .ap-heute"); if(!ap) return;
  ["ap-woche", "ap-weiter", "ap-fakt"].forEach(k => { const e = ap.querySelector(":scope > ." + k); if(e) e.style.display = ""; });
  ap.classList.remove("af-eng");
  const zuViel = () => ap.scrollHeight > ap.clientHeight + 1;
  for(const k of ["ap-weiter", "ap-fakt", "ap-woche"]){ if(!zuViel()) break; const e = ap.querySelector(":scope > ." + k); if(e) e.style.display = "none"; }
  ap.scrollTop = 0;
}
function themen(){
  const t = document.querySelector("#app .ap-themen"); if(!t) return;
  t.querySelectorAll(".apb").forEach(b => { const k = b.querySelector(".apb-kopf"); if(k && k.dataset.b && b.dataset.af !== k.dataset.b) b.dataset.af = k.dataset.b; });
  t.querySelectorAll(".ap-stufen > button").forEach(b => { if(!b.querySelector(".af-se")){ const i = document.createElement("span"); i.className = "af-se"; i.setAttribute("aria-hidden", "true"); i.textContent = EMO[b.dataset.s] || ""; b.prepend(i); } });
}
function libSperre(){
  const an = app() && document.body.classList.contains("ep-s-lib");
  document.documentElement.classList.toggle("ep-af-lib", an);
  if(an) scrollTo(0, 0);
}
function alles(){
  if(!app()) { document.documentElement.classList.remove("ep-af-lib"); return; }
  try{ gruss(); }catch(e){}
  try{ themen(); }catch(e){}
  try{ libSperre(); }catch(e){}
  requestAnimationFrame(() => { try{ heuteEinpassen(); }catch(e){} });
}
let zeit = 0;
const bald = () => { clearTimeout(zeit); zeit = setTimeout(alles, 60); };

const vorRender = window.render;
if(typeof vorRender === "function"){
  window.render = function(){ const r = vorRender.apply(this, arguments); try{ alles(); bald(); setTimeout(alles, 400); }catch(e){} return r; };
}
const appEl = document.getElementById("app");
if(appEl) new MutationObserver(bald).observe(appEl, {childList:true});
addEventListener("resize", bald);
addEventListener("orientationchange", bald);
try{ alles(); setTimeout(alles, 500); }catch(e){}
})();
