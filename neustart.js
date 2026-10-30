/* easyplay: neue, kompakte Startseite für den Computer (Entwurf A «Zwei grosse Türen»).
   Zum Testen: easyplay.ch/?neu schaltet sie auf diesem Gerät ein, easyplay.ch/?alt wieder aus.
   Oben zwei grosse Karten (Spielen mit Stufenwahl, Bibliothek mit Suche), darunter vier Kacheln
   (Entdecken, Thema der Woche, Duell, Truhe). Alles auf einem Bildschirm. In der App-Ansicht (Handy, iPad) aus. */
(function(){
"use strict";
if(typeof window.renderHome !== "function") return;
const SCHLUESSEL = "ep-neustart";
try{
  const q = location.search;
  if(/[?&]neu\b/.test(q)) localStorage.setItem(SCHLUESSEL, "1");
  if(/[?&]alt\b/.test(q)) localStorage.removeItem(SCHLUESSEL);
}catch(e){}
const an = () => { try{ return localStorage.getItem(SCHLUESSEL) === "1" && !document.body.classList.contains("ep-app") && !window.EP_NATIV; }catch(e){ return false; } };
const h = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const zahl = n => { try{ return Number(n).toLocaleString("de-CH"); }catch(e){ return String(n); } };
const K = "img/kacheln/", KIDS = "img/kids/";
const STUFEN = [[1, "Entdecker", "bis 9 Jahre"], [2, "Könner", "10 bis 14 Jahre"], [3, "Profis", "ab 15 Jahre"], [4, "Alle Stufen", "alles gemischt"]];
const E = () => window.EP_START || {};
let WAHL = false;   /* nach «Jetzt spielen»: zuerst Bereich wählen, dann im Bereich das Thema */

const css = document.createElement("style"); css.id = "ep-neustart-css";
css.textContent = `
body.ep-neustart .wrap{max-width:1360px}
.np{display:flex;flex-direction:column;gap:22px;padding-top:16px;font-family:Nunito,system-ui,sans-serif}
.np a,.np button{font-family:inherit}
.np-tueren{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:28px}
.np-tuer{position:relative;box-sizing:border-box;min-height:400px;padding:30px 36px;display:flex;flex-direction:column;gap:16px;color:#fff;
  border-style:solid;border-width:0;border-image-slice:56 fill;border-image-width:26px;border-image-repeat:stretch}
.np-spiel{border-image-source:url(${K}live-grund.webp?v=2);filter:drop-shadow(0 16px 22px rgba(80,30,140,.35))}
.np-bib{border-image-source:url(${K}wissen-grund.webp?v=2);filter:drop-shadow(0 16px 22px rgba(20,90,160,.35))}
.np-tuer>*:not(.np-kids){position:relative;z-index:2}
.np-tuer h1,.np-tuer h2{margin:0;font:700 clamp(40px,4vw,54px)/1 Fredoka,Lexend,system-ui,sans-serif;width:min(270px,52%);text-shadow:0 3px 12px rgba(30,10,90,.35)}
.np-tuer p{margin:0;font-size:17px;font-weight:700;width:min(270px,52%);text-shadow:0 1px 6px rgba(10,30,90,.35)}
.np-stufen{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;width:min(280px,54%)}
.np-stufe{border:0;border-radius:16px;padding:8px 12px;display:flex;flex-direction:column;align-items:flex-start;cursor:pointer;text-align:left;background:rgba(255,255,255,.2);color:#fff;transition:transform .12s}
.np-stufe b{font:700 17px/1.15 Fredoka,Lexend,system-ui,sans-serif}
.np-stufe span{font-size:12.5px;font-weight:700;opacity:.9}
.np-stufe:hover{transform:translateY(-2px)}
.np-stufe[aria-pressed="true"]{background:#fff;color:#6A1FB0;box-shadow:0 4px 0 rgba(70,20,120,.35)}
.np-stufe:focus-visible,.np-k:focus-visible,.np-los:focus-visible,.np-link:focus-visible{outline:3px solid #FFE34D;outline-offset:3px}
.np-unten{margin-top:auto;display:flex;flex-direction:column;align-items:flex-start;gap:10px}
.np-los{border:0;cursor:pointer;display:inline-flex;align-items:center;gap:10px;padding:16px 30px;border-radius:999px;font:700 24px Fredoka,Lexend,system-ui,sans-serif;transition:transform .12s}
.np-los:hover{transform:translateY(-2px)}
.np-los:active{transform:translateY(3px)}
.np-los.gelb{background:linear-gradient(180deg,#FFE680,#FFC81E);color:#3A1C00;box-shadow:0 6px 0 #D99A00,inset 0 2px 0 rgba(255,255,255,.7)}
.np-los.weiss{background:linear-gradient(180deg,#fff,#E3F1FF);color:#0F4C9A;box-shadow:0 6px 0 #6FA8E6;font-size:22px;padding:15px 24px}
.np-link{border:0;background:none;padding:0;cursor:pointer;color:#fff;font-weight:800;font-size:15px;text-decoration:underline;text-underline-offset:3px;text-shadow:0 1px 6px rgba(10,30,90,.45)}
.np-link:hover{color:#FFE680}
.np-suche{display:flex;align-items:center;gap:10px;background:#fff;border-radius:16px;padding:0 14px;height:54px;width:min(280px,54%);box-sizing:border-box;box-shadow:0 6px 16px -8px rgba(10,50,110,.5)}
.np-suche input{border:0;outline:0;flex:1;min-width:0;font:700 16px Nunito,system-ui,sans-serif;color:#1D1840;background:transparent}
.np-kids{position:absolute;bottom:0;height:auto;pointer-events:none;z-index:1}
.np-spiel .np-kids{right:-40px;width:min(370px,50%)}
.np-bib .np-kids{right:-36px;width:min(330px,48%)}
.np-kacheln{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px}
.np-k{position:relative;border:0;cursor:pointer;color:#fff;text-align:left;height:162px;box-sizing:border-box;padding:18px 22px;display:flex;flex-direction:column;align-items:flex-start;gap:4px;
  border-style:solid;border-width:0;border-image-slice:56 fill;border-image-width:22px;border-image-repeat:stretch;background:transparent;transition:transform .15s}
.np-k:hover{transform:translateY(-3px)}
.np-k small{font-size:14px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;opacity:.92;position:relative;z-index:1}
.np-k b{font:700 30px/1.08 Fredoka,Lexend,system-ui,sans-serif;max-width:62%;position:relative;z-index:1;text-shadow:0 2px 8px rgba(30,10,70,.35)}
.np-k b.lang{font-size:23px}
.np-k span{font-size:16.5px;font-weight:700;max-width:60%;position:relative;z-index:1;opacity:.95}
.np-k img{position:absolute;right:8px;bottom:8px;height:62%;width:auto;pointer-events:none}
.np-k.entdecken{border-image-source:url(${K}level-grund.webp?v=2);filter:drop-shadow(0 10px 14px rgba(10,120,70,.3))}
.np-k.woche{border-image-source:url(${K}serie-grund.webp?v=2);filter:drop-shadow(0 10px 14px rgba(190,60,40,.3))}
.np-k.duell{border-image-source:url(${K}live-grund.webp?v=2);filter:drop-shadow(0 10px 14px rgba(140,40,170,.3))}
.np-k.truhe{border-image-source:url(${K}truhe-grund.webp?v=2);filter:drop-shadow(0 10px 14px rgba(190,130,0,.3))}
.np-k.truhe.offen{filter:saturate(.7) drop-shadow(0 10px 14px rgba(190,130,0,.25))}
.np-wahl{display:flex;flex-direction:column;gap:18px;padding-top:6px}
.np-wahl-kopf{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.np-wahl-kopf h1{margin:0;font:700 40px/1.05 Fredoka,Lexend,system-ui,sans-serif;color:#2B1A73;text-shadow:0 2px 0 #fff}
.np-zurueck{border:0;cursor:pointer;display:inline-flex;align-items:center;gap:6px;padding:10px 16px;border-radius:999px;background:#fff;color:#2B1A73;font-weight:800;font-size:15px;box-shadow:0 4px 10px -4px rgba(40,30,110,.35)}
.np-wahl .np-stufen{width:auto;display:flex;flex-wrap:wrap;gap:8px;margin-left:auto}
.np-wahl .np-stufe{background:rgba(255,255,255,.75);color:#2B1A73}
.np-wahl .np-stufe[aria-pressed="true"]{background:#5B3FE0;color:#fff;box-shadow:0 4px 0 #3E27B0}
html body #app .np-wahl .bereiche{max-width:940px!important;width:100%;margin:0 auto}
html body #app .np-wahl .bereiche>.bereich h2{font-size:1.75rem!important;line-height:1.1}
html body #app .np-wahl .bereiche>.bereich p{font-size:.95rem!important}
html body #app .np-wahl .bereiche>.bereich .emo{width:64px!important;height:64px!important;font-size:2.2rem!important}
html body #app .np-themenlink{text-align:center;margin:18px 0 0}
html body #app .np-themenlink button{border:0;cursor:pointer;padding:12px 22px;border-radius:999px;background:rgba(255,255,255,.92);color:#3A1F9E;font:800 16px Nunito,system-ui,sans-serif;box-shadow:0 4px 0 rgba(58,31,158,.25)}
html body #app .np-themenlink button:focus-visible{outline:3px solid #FFE34D;outline-offset:2px}
.np-mix{align-self:center;border:0;cursor:pointer;display:inline-flex;align-items:center;gap:10px;padding:14px 26px;border-radius:999px;background:linear-gradient(180deg,#FFE680,#FFC81E);color:#3A1C00;font:700 20px Fredoka,Lexend,system-ui,sans-serif;box-shadow:0 5px 0 #D99A00}
.np-zurueck:focus-visible,.np-mix:focus-visible{outline:3px solid #FFE34D;outline-offset:3px}
@media (max-width:1100px){.np-tueren{gap:20px}.np-tuer{padding:28px 28px}.np-kacheln{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:820px){.np-tueren{grid-template-columns:1fr}}
@media (prefers-reduced-motion:reduce){.np *{transition:none!important}}
`;
document.head.appendChild(css);

function html(){
  const st = [1, 2, 3, 4].includes(S.stufe) ? S.stufe : 1;
  let seiten = 0, buecher = 9; try{ seiten = bibSeitenZahl(); buecher = BUECHER.length; }catch(e){}
  let wo = null; try{ wo = E().woche ? E().woche() : null; }catch(e){}
  let truheOffen = false; try{ truheOffen = window.EP_TRUHE ? window.EP_TRUHE.offen() : false; }catch(e){}
  let welten = 18; try{ welten = (window.EP_EXTRAS && window.EP_EXTRAS.liste) ? window.EP_EXTRAS.liste().length : 18; }catch(e){}
  return `<div class="np">
    <section class="np-tueren">
      <div class="np-tuer np-spiel">
        <h1>Spiel dich schlau!</h1>
        <div class="np-stufen" role="group" aria-label="Schwierigkeit wählen">
          ${STUFEN.map(([n, name, alter]) => `<button type="button" class="np-stufe" data-np-stufe="${n}" aria-pressed="${n === st}"><b>${name}</b><span>${alter}</span></button>`).join("")}
        </div>
        <div class="np-unten">
          <button type="button" class="np-los gelb" data-np="spielen"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4l13 8-13 8z"/></svg>Jetzt spielen</button>
          <button type="button" class="np-link" data-np="tagesquiz">oder Tagesquiz: neue Fragen von heute</button>
        </div>
        <img class="np-kids" src="${KIDS}duo-jubel.webp" alt="">
      </div>
      <div class="np-tuer np-bib">
        <h2>Bibliothek</h2>
        <p>${seiten ? zahl(seiten) : "Tausende"} Seiten in ${buecher} Büchern: Tiere, Geschichte, die Schweiz und vieles mehr.</p>
        <form class="np-suche" data-np-suche role="search">
          <label for="npSuche" class="sr-only">In der Bibliothek suchen</label>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A6FD0" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>
          <input id="npSuche" type="search" placeholder="Katze, Bundesrat …" autocomplete="off">
        </form>
        <div class="np-unten">
          <button type="button" class="np-los weiss" data-np="lib"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" aria-hidden="true"><path d="M3 5c3-1 6-1 9 1 3-2 6-2 9-1v14c-3-1-6-1-9 1-3-2-6-2-9-1z"/><path d="M12 6v14"/></svg>Bibliothek öffnen</button>
          <button type="button" class="np-link" data-np="libzufall">oder eine zufällige Seite lesen</button>
        </div>
        <img class="np-kids" src="${KIDS}lb-denken.webp" alt="">
      </div>
    </section>
    <section class="np-kacheln" aria-label="Mehr entdecken">
      <button type="button" class="np-k entdecken" data-np="entdecken"><small>${welten} Welten</small><b>Entdecken</b><span>Karte, Album, Abenteuer</span><img src="${K}level-symbol.webp" alt=""></button>
      <button type="button" class="np-k woche" data-np="woche"><small>Thema der Woche</small><b class="${(wo && wo.thema ? wo.thema.name : "Wochen-Challenge").length > 14 ? "lang" : ""}">${h(wo && wo.thema ? wo.thema.name : "Wochen-Challenge")}</b><span>${wo && wo.thema ? `${wo.r} von ${wo.ziel} richtig` : "Jede Woche ein neues Thema"}</span><img src="${K}serie-symbol.webp" alt=""></button>
      <button type="button" class="np-k duell" data-np="duell"><small>Gegeneinander</small><b>Duell</b><span>Freunde, Familie, Klasse</span><img src="${K}live-symbol.webp" alt=""></button>
      <button type="button" class="np-k truhe${truheOffen ? " offen" : ""}" data-np="truhe"><small>Jeden Tag neu</small><b>${truheOffen ? "Heute geöffnet" : "Truhe öffnen"}</b><span>${truheOffen ? "Morgen wartet die nächste" : "Eine Überraschung wartet"}</span><img src="${K}truhe-symbol.webp" alt=""></button>
    </section>
  </div>`;
}

function wahlHTML(){
  const st = [1, 2, 3, 4].includes(S.stufe) ? S.stufe : 1;
  const zaehl = b => { try{ return countBereich(b, S.stufe); }catch(e){ return ""; } };
  const icon = e => { try{ return ico(e); }catch(x){ return ""; } };
  return `<div class="np-wahl">
    <div class="np-wahl-kopf">
      <button type="button" class="np-zurueck" data-np="zurueck"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>Zurück</button>
      <h1>Was willst du spielen?</h1>
      <div class="np-stufen" role="group" aria-label="Schwierigkeit wählen">
        ${STUFEN.map(([n, name]) => `<button type="button" class="np-stufe" data-np-stufe="${n}" aria-pressed="${n === st}"><b>${name}</b></button>`).join("")}
      </div>
    </div>
    <div class="bereiche">
      ${BEREICHE.map(b => `<button class="bereich" type="button" data-b="${b.id}" style="--c:var(${b.c})">
        <span class="count-pill">${zaehl(b)} Fragen</span>
        <span class="emo" aria-hidden="true">${icon(b.emo)}</span><h2>${h(b.name)}</h2><p>${h(b.text)}</p></button>`).join("")}
    </div>
    <button type="button" class="np-mix" data-np="mix"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4l13 8-13 8z"/></svg>Oder einfach losspielen: Fragen aus allen Bereichen</button>
  </div>`;
}
function stufe(n){
  S.stufe = n; try{ store.set("ep-stufe", n); }catch(e){ try{ localStorage.setItem("ep-stufe", JSON.stringify(n)); }catch(e2){} }
  document.querySelectorAll("#app .np-stufe").forEach(b => b.setAttribute("aria-pressed", +b.dataset.npStufe === n));
  try{ document.querySelectorAll("#app .np-wahl .bereich[data-b]").forEach(el => { const b = BEREICHE.find(x => x.id === el.dataset.b), p = el.querySelector(".count-pill"); if(b && p) p.textContent = countBereich(b, n) + " Fragen"; }); }catch(e){}
}
function los(was){
  const A = E().aktion;
  try{
    if(was === "spielen"){ WAHL = true; render(); scrollTo(0, 0); return; }
    if(was === "zurueck"){ WAHL = false; render(); return; }
    if(was === "mix"){
      WAHL = false;
      const alle = typeof alleFragen === "function" ? alleFragen() : FRAGEN;
      startListe(alle.filter(f => (S.stufe === 4 || f.l === S.stufe) && Array.isArray(f.a) && f.a.length === 4), "Zufällige Fragen");
    }
    else if(was === "tagesquiz") A("tagesquiz");
    else if(was === "lib") A("lib");
    else if(was === "libzufall") A("libzufall");
    else if(was === "entdecken") go("x-entdecken");
    else if(was === "woche") A("woche");
    else if(was === "duell") A("duell");
    else if(was === "truhe") go("x-truhe");
  }catch(e){ console.warn("neustart", e); }
}
function binden(){
  const app = document.getElementById("app"); if(!app) return;
  app.querySelectorAll("[data-np-stufe]").forEach(b => b.onclick = () => stufe(+b.dataset.npStufe));
  app.querySelectorAll("[data-np]").forEach(b => b.onclick = () => los(b.dataset.np));
  app.querySelectorAll(".np-wahl .bereich[data-b]").forEach(b => b.onclick = () => { WAHL = false; bereichSpielen(b.dataset.b); });
  const f = app.querySelector("[data-np-suche]");
  if(f) f.onsubmit = e => { e.preventDefault(); const v = (f.querySelector("input").value || "").trim(); try{ LIB.qa = v; setLibModus(true); }catch(err){} };
}

/* Ganzer Bereich gemischt: eigenes Thema «bx_<bereich>», damit Training und Test mit Anzahl wie bei einem Thema laufen */
function bereichThema(id){
  const b = BEREICHE.find(x => x.id === id); if(!b) return null;
  const tid = "bx_" + id;
  if(!THEMA[tid]){
    const kids = b.themen.map(t => t.id).filter(t => t !== "bilder");
    THEMA[tid] = { id: tid, name: b.name + ": alles gemischt", emo: b.emo, text: "Fragen aus allen Themen", menu: "mix", kids, bereich: b };
  }
  return THEMA[tid];
}
function bereichSpielen(id){
  const t = bereichThema(id); if(!t) return;
  S.bereich = t.bereich; S.thema = t; go("mode");
}
/* Auf der Wahl-Seite des Bereichs: Weg zu den einzelnen Themen */
const vorMode = window.renderMode;
if(typeof vorMode === "function") window.renderMode = function(){
  const r = vorMode.apply(this, arguments);
  try{
    const t = S.thema;
    if(t && String(t.id).startsWith("bx_")){
      const m = document.querySelector("#app .modes");
      if(m && !document.querySelector("#app .np-themenlink")){
        const d = document.createElement("p"); d.className = "np-themenlink";
        d.innerHTML = `<button type="button">Lieber ein bestimmtes Thema wählen</button>`;
        d.querySelector("button").onclick = () => { S.bereich = t.bereich; go("bereich"); };
        m.insertAdjacentElement("afterend", d);
      }
    }
  }catch(e){ console.warn("neustart", e); }
  return r;
};

const vorHome = window.renderHome;
window.renderHome = function(){
  const r = vorHome.apply(this, arguments);
  const neu = an();
  document.body.classList.toggle("ep-neustart", neu);
  if(!neu) return r;
  try{ const app = document.getElementById("app"); if(app){ app.innerHTML = WAHL ? wahlHTML() : html(); binden(); } }catch(e){ console.warn("neustart", e); }
  return r;
};
/* Beim Verlassen der Startseite die breitere Seite wieder zurücksetzen */
const vorRender = window.render;
if(typeof vorRender === "function") window.render = function(){ const r = vorRender.apply(this, arguments); try{ if(S.screen !== "home"){ document.body.classList.remove("ep-neustart"); WAHL = false; } }catch(e){} return r; };
window.EP_NEUSTART = { an, ein(){ try{ localStorage.setItem(SCHLUESSEL, "1"); }catch(e){} render(); }, aus(){ try{ localStorage.removeItem(SCHLUESSEL); }catch(e){} render(); } };
})();
