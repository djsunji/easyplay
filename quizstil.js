/* easyplay: Quiz und Duell im Design der Qeels-App (Duell-Ansicht, Stand 30.10.)
   Frage-Karte mit Verlauf Pink, Lila, Blau, Kopfzeile «FRAGE 3 VON 10», Frage in weisser fetter Schrift
   (in der gelben Sprechblase), Antworten als Qeels-Glanzknöpfe A bis D, nach der Antwort die übrigen blass,
   gelber Knopf «Weiter», gelber Fortschrittsbalken, im Duell Spielerkärtchen wie in Qeels.
   Lädt nach appfein.js. Aktiv nur, wenn eine Quiz- oder Duellfrage offen ist (Klasse qq-an an <html>). */
(function(){
"use strict";
const SEITEN = ["quiz", "duellplay"];
const css = document.createElement("style"); css.id = "ep-quizstil";
const A = "html.qq-an body #app";
css.textContent = `
/* ---- Frage-Karte ---- */
${A} > .card{background:linear-gradient(155deg,#FF5FA2 0%,#7C3AED 50%,#2563EB 100%)!important;border:1px solid rgba(255,255,255,.3)!important;border-radius:24px!important;
  box-shadow:0 18px 34px -18px rgba(60,20,140,.75)!important;padding:12px 14px 14px!important;color:#fff!important;overflow:visible}
${A} > .card::before,${A} > .card::after{display:none!important}
${A} > .card .qq-titel,${A} > .card .modebadge{display:block!important;background:none!important;border:0!important;box-shadow:none!important;padding:0!important;margin:6px 4px 2px!important;
  color:#FFE4F1!important;font:900 12px/1.2 "Lexend","Fredoka",system-ui,sans-serif!important;letter-spacing:.06em;text-transform:uppercase}
/* Frage: bleibt in Dejans gelber Sprechblase mit Ben oder Leni (stil.js) */
/* Antworten: Qeels-Glanzknöpfe (Bilder kommen aus stil.js), nach der Antwort die übrigen blass */
${A} > .card .answers{gap:9px!important;margin-top:4px!important}
${A} > .card .answers .ans{min-height:52px!important;color:#fff!important;font-weight:900!important;text-shadow:0 1.5px 3px rgba(0,0,0,.35)!important}
${A} > .card .answers .ans[disabled]:not(.right):not(.wrong){opacity:.4!important;filter:saturate(.6)!important}
${A} > .card .answers .ans.right,${A} > .card .answers .ans.wrong{opacity:1!important}
/* Hinweise und Nummer auf der farbigen Karte lesbar */
${A} > .card .hlf-hinweis{background:rgba(20,10,70,.35)!important;color:#fff!important;border:1px solid rgba(255,255,255,.25)!important}
${A} > .card .qnr,${A} > .card .tasthinweis{color:rgba(255,255,255,.75)!important}
${A} > .card .tasthinweis kbd{background:rgba(255,255,255,.2)!important;color:#fff!important;border-color:rgba(255,255,255,.35)!important}
${A} > .card .feedback,${A} > .card .dufb{background:rgba(20,10,70,.35)!important;border:1px solid rgba(255,255,255,.25)!important;color:#fff!important;border-radius:18px!important;box-shadow:none!important}
${A} > .card .feedback p,${A} > .card .feedback *:not(button){color:#fff!important}
/* Erklärung lesbar auf der Karte */
${A} > .card .explain,${A} > .card .erkl,${A} > .card [data-panel="erklaerung"]{color:#fff!important}
/* Weiter: gelber Qeels-Knopf, Erklärung als dunkle Pille */
${A} > .card #next{all:unset;box-sizing:border-box;display:flex!important;align-items:center;justify-content:center;flex:1 1 0;min-height:46px;padding:10px 16px!important;border-radius:999px!important;cursor:pointer;
  background:#FFD43B!important;border-bottom:4px solid #C99A00!important;color:#2A1F5C!important;font:900 16px/1.2 "Lexend","Fredoka",system-ui,sans-serif!important;text-align:center;transition:transform .1s}
${A} > .card #next:active{transform:translateY(3px)}
${A} > .card #toExplain{all:unset;box-sizing:border-box;display:flex!important;align-items:center;justify-content:center;flex:1 1 0;min-height:46px;padding:10px 16px!important;border-radius:999px!important;cursor:pointer;
  background:rgba(30,20,96,.78)!important;border:2px solid rgba(255,255,255,.28)!important;color:#fff!important;font:800 15px/1.2 "Lexend","Fredoka",system-ui,sans-serif!important;text-align:center}
${A} > .card .feedback .row{display:flex!important;gap:8px!important;width:100%}
/* ---- Fortschritt oben: Balken der Hauptseite bleibt, nur in Qeels-Gelb ---- */
${A} > .qtop .bar > i,${A} > .bar.dubar > i:not(.gegbar){background:linear-gradient(90deg,#FFE27A,#FFC21F)!important}
${A} > .bar.dubar{height:8px!important;border-radius:999px!important;background:rgba(30,20,96,.55)!important;border:1px solid rgba(255,255,255,.25)!important;overflow:hidden;position:relative}
${A} > .bar.dubar > i.gegbar{background:rgba(255,95,162,.8)!important}
/* ---- Duell: Spielerkärtchen wie in Qeels ---- */
${A} > .dutop{display:flex!important;gap:8px!important;align-items:stretch!important;margin:0 0 8px!important;background:none!important;border:0!important;box-shadow:none!important;padding:0!important;flex-wrap:nowrap}
${A} > .dutop > span{flex:1 1 0;min-width:0;display:flex!important;flex-direction:column;align-items:center;justify-content:center;gap:2px;border-radius:14px!important;padding:6px 6px!important;
  background:rgba(30,20,96,.75)!important;border:2px solid transparent!important;color:#fff!important;font:800 12px/1.2 "Lexend",system-ui,sans-serif!important;text-align:center;text-shadow:none!important}
${A} > .dutop > span b{font:900 20px/1.1 "Lexend",system-ui,sans-serif!important;color:#fff!important}
${A} > .dutop > .duich{border-color:#FF8A3D!important;background:rgba(52,36,140,.92)!important}
${A} > .dutop > .dugeg{opacity:.85}
${A} > .dutop > .duzeit{flex:0 0 auto;min-width:64px;background:linear-gradient(135deg,#FFE27A,#FFC21F)!important;color:#4A2A00!important;border-color:#FFF3B0!important}
${A} > .dutop > .duzeit b{color:#4A2A00!important}
${A} > .dutop small{font-size:10px!important;opacity:.85}
/* Duell (duell2.js): zwei Fortschrittsbalken in Qeels-Gelb, Gegner in Pink, auf dunkler Bahn */
html.qq-an body #app .du2-bars div{height:8px!important;border-radius:999px!important;background:rgba(30,20,96,.55)!important;border:1px solid rgba(255,255,255,.25)}
html.qq-an body #app .du2-bars i{background:linear-gradient(90deg,#FFE27A,#FFC21F)!important;border-radius:999px!important}
html.qq-an body #app .du2-bars .geg i{background:linear-gradient(90deg,#FF8FC0,#FF5FA2)!important}
/* Computer: Frage grösser */
@media (min-width:900px){ ${A} > .card .qq-titel,${A} > .card .modebadge{font-size:14px!important} }
/* Handy etwas enger */
@media (max-width:440px){
  ${A} > .card{padding:10px 12px 12px!important;border-radius:22px!important}
  ${A} > .card .answers{gap:8px!important}
  ${A} > .card .answers .ans{min-height:48px!important}
}
`;
document.head.appendChild(css);

/* Kopfzeile «FRAGE X VON Y» in der Quiz-Karte (im Duell gibt es sie schon als .modebadge) */
function titel(){
  const app = document.getElementById("app"); if(!app) return;
  const card = app.querySelector(":scope > .card"); if(!card) return;
  if(card.querySelector(".modebadge")){ const b = card.querySelector(".modebadge"); const t = b.textContent.replace(/^\s*⚔️\s*Duell\s*·\s*/, ""); if(!/^⚔️ /.test(b.textContent) || /Duell ·/.test(b.textContent)) b.textContent = "⚔️ " + t; return; }
  const c = app.querySelector(".qtop .count"), q = card.querySelector("h2.question"); if(!c || !q) return;
  let el = card.querySelector(".qq-titel");
  if(!el){ el = document.createElement("span"); el.className = "qq-titel"; el.setAttribute("aria-hidden", "true"); q.before(el); }
  const t = "🎯 " + c.textContent.trim(); if(el.textContent !== t) el.textContent = t;
}
function an(){
  let sc = ""; try{ sc = S.screen; }catch(e){}
  const ja = SEITEN.includes(sc) && !!document.querySelector("#app > .card");
  document.documentElement.classList.toggle("qq-an", ja);
  if(ja){ try{ titel(); }catch(e){} }
}
const vor = window.render;
if(typeof vor === "function") window.render = function(){ const r = vor.apply(this, arguments); try{ an(); }catch(e){} return r; };
const app = document.getElementById("app");
if(app) new MutationObserver(() => { try{ an(); }catch(e){} }).observe(app, {childList:true, subtree:true});
try{ an(); }catch(e){}
})();
