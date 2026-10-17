/* easyplay: Zusatzwelten (Entdecken)
   Grundgerüst für neue Bereiche wie Schweizer Karte, Sammelalbum, Garderobe, Abenteuer, Spielwelt, Feste.
   Jede Welt liegt in einer eigenen Datei und meldet sich hier an:

     EP_EXTRAS.register({
       id: "karte",                 // Bildschirm heisst dann "x-karte"
       titel: "Schweizer Karte",
       text: "Spiel alle 26 Kantone frei",
       emo: "🗺️",
       farbe: "linear-gradient(135deg,#0B6E6A,#0FA968)",  // Kachel-Hintergrund, Schrift ist weiss
       reihe: 10,                   // Reihenfolge im Entdecken-Menü (klein = weiter vorne)
       sichtbar: () => true,        // optional: nur zeigen, wenn ...
       hinweis: () => "3 neu",      // optional: kleines Abzeichen auf der Kachel
       render(box, api){ ... }      // füllt die Seite (box ist ein leeres <div class="xseite">)
     });

   Lädt vor lernen.js, damit app.js und startseite.js (die später laden) diese Seiten wie alle anderen
   behandeln (Zurück-Knopf oben, Leiste unten). */
(function(){
"use strict";
if(typeof window.render !== "function") return;

const LS = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};
const h = s => { try{ return esc(s); }catch(e){ return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); } };
const heute = (d) => { const x = d ? new Date(d) : new Date(); return x.getFullYear() + "-" + String(x.getMonth()+1).padStart(2,"0") + "-" + String(x.getDate()).padStart(2,"0"); };
const ruhig = () => { try{ return matchMedia("(prefers-reduced-motion: reduce)").matches; }catch(e){ return false; } };

const MODS = [];
const sichtbar = m => { try{ return !m.sichtbar || m.sichtbar(); }catch(e){ return false; } };
const liste = () => MODS.filter(m => m.id !== "entdecken" && sichtbar(m));

/* Kleine Hilfen für alle Welten */
const api = {
  LS, h, heute, ruhig,
  /* XP geben (Level-System); gibt die tatsächlich vergebenen XP zurück */
  xp(n){ try{ return window.EP_LEVEL.gib(n) || 0; }catch(e){ return 0; } },
  /* Ton abspielen, falls das Soundpaket geladen ist */
  ton(name){ try{ window.EP_SOUND && window.EP_SOUND.play(name); }catch(e){} },
  /* Kurze Meldung unten am Bildschirm */
  toast(text, ms){ meldung(text, ms); },
  /* Konfetti, falls vorhanden */
  konfetti(){ try{ if(typeof window.confetti === "function") window.confetti(); else if(typeof window.konfetti === "function") window.konfetti(); }catch(e){} },
  /* Fragen-Pool: alle Fragen (Objekte mit q, a[4], e, t, l), optional gefiltert */
  fragen(filter){ let a = []; try{ a = (typeof alleFragen === "function" ? alleFragen() : FRAGEN); }catch(e){} a = a.filter(f => f && Array.isArray(f.a) && f.a.length === 4); return filter ? a.filter(filter) : a; },
  /* Ein Quiz mit einer eigenen Liste starten (nutzt das normale Quiz der Seite) */
  quiz(liste, titel){ try{ startListe(liste, titel); }catch(e){ console.warn("extras quiz", e); } },
  oeffne(id){ go("x-" + id); },
  zurueck(){ go("home"); },
  stufe(){ return (typeof S !== "undefined" && S.stufe) || 1; },
  profil(){ return (typeof S !== "undefined" && S.profil) || null; }
};

function meldung(text, ms){
  try{
    document.querySelectorAll(".x-toast").forEach(e => e.remove());
    const d = document.createElement("div"); d.className = "x-toast"; d.setAttribute("role", "status"); d.textContent = text;
    document.body.appendChild(d); requestAnimationFrame(() => d.classList.add("an"));
    setTimeout(() => { d.classList.remove("an"); setTimeout(() => d.remove(), 400); }, ms || 2600);
  }catch(e){}
}

function crumbsHTML(pfad, cur){
  try{ S._crumbs = pfad.map(p => p[1]); }catch(e){}
  let haus = ""; try{ haus = ico("house") + " "; }catch(e){}
  return `<nav class="crumbs" aria-label="Verlauf">${pfad.map((p, i) => `<button type="button" class="crumb" data-ci="${i}">${i === 0 ? haus : ""}${h(p[0])}</button><span class="sep" aria-hidden="true">›</span>`).join("")}<span class="crumb cur" aria-current="page">${h(cur)}</span></nav>`;
}

/* ---------- Seite «Entdecken» ---------- */
function entdeckenHTML(){
  const l = liste();
  return `<div class="x-kopf"><span class="x-kopf-emo" aria-hidden="true">✨</span><div><h1>Entdecken</h1><p>Sammeln, freispielen, Abenteuer erleben</p></div><img src="img/kids/duo-winken.webp" alt=""></div>
    <div class="x-kacheln">${l.map(m => { let hw = ""; try{ hw = m.hinweis ? m.hinweis() : ""; }catch(e){}
      return `<button type="button" class="x-kachel" data-xo="${h(m.id)}" style="background:${m.farbe || "linear-gradient(135deg,#5B4BF5,#9B4DE0)"}"><span class="x-emo" aria-hidden="true">${m.emo || "✨"}</span><b>${h(m.titel)}</b><small>${h(m.text || "")}</small>${hw ? `<i class="x-badge">${h(hw)}</i>` : ""}</button>`; }).join("") || `<p class="x-leer">Hier kommt bald etwas Neues.</p>`}</div>`;
}
const ENTDECKEN = { id:"entdecken", titel:"Entdecken", render(box){ box.innerHTML = entdeckenHTML(); box.querySelectorAll("[data-xo]").forEach(b => b.onclick = () => { api.ton("klick"); go("x-" + b.dataset.xo); }); } };

/* ---------- Gemeinsame Ereignisse für alle Welten ----------
   document "ep:antwort"  detail {ok, frage, thema, stufe, modus}   nach jeder beantworteten Quizfrage
   document "ep:quizende" detail {richtig, total, thema, modus, titel}  wenn die Ergebnisseite eines Quiz erscheint */
const vorAnswer = window.answer;
if(typeof vorAnswer === "function"){
  window.answer = function(i){
    let Q = null, vorher = null; try{ Q = S.quiz; vorher = Q ? Q.picked : null; }catch(e){}
    const r = vorAnswer.apply(this, arguments);
    try{ if(Q && vorher == null && Q.picked != null){ const f = Q.list[Q.i] || {}; const o = f.opts && f.opts[Q.picked];
      document.dispatchEvent(new CustomEvent("ep:antwort", {detail:{ok:!!(o && o.ok), frage:f, thema:f.t, stufe:f.l, modus:Q.mode}})); } }catch(e){}
    return r;
  };
}
function quizEnde(){
  try{ const Q = S.quiz; if(!Q || Q.__xende) return; Q.__xende = true;
    document.dispatchEvent(new CustomEvent("ep:quizende", {detail:{richtig:Q.score || 0, total:(Q.list || []).length, thema:Q.themaId || (S.thema && S.thema.id) || null, modus:Q.mode, titel:Q.titel || (S.thema && S.thema.name) || ""}})); }catch(e){}
}

/* ---------- Bildschirme einhängen ---------- */
const vorRender = window.render;
window.render = function(){
  if(typeof S !== "undefined" && typeof S.screen === "string" && S.screen.startsWith("x-")){
    const id = S.screen.slice(2);
    const m = id === "entdecken" ? ENTDECKEN : MODS.find(x => x.id === id);
    if(!m){ S.screen = "home"; return vorRender.apply(this, arguments); }
    try{ renderNav(); }catch(e){}
    try{ if(S.libModus){ S.libModus = false; document.documentElement.dataset.mode = "spiel"; } }catch(e){}
    const app = document.getElementById("app");
    if(app){
      const pfad = [["Start", () => go("home")]];
      if(id !== "entdecken") pfad.push(["Entdecken", () => go("x-entdecken")]);
      app.innerHTML = crumbsHTML(pfad, m.titel) + `<div class="xseite" data-xwelt="${h(id)}"></div>`;
      const box = app.querySelector(".xseite");
      try{ m.render(box, api); }catch(e){ console.warn("extras", id, e); box.innerHTML = `<p class="x-leer">Das hat leider nicht geklappt. Bitte lade die Seite neu.</p>`; }
      try{ bindCrumbs(); }catch(e){}
    }
    try{ document.body.dataset.xwelt = id; }catch(e){}
    return;
  }
  try{ delete document.body.dataset.xwelt; }catch(e){}
  const r = vorRender.apply(this, arguments);
  try{ if(S.screen === "done") quizEnde(); }catch(e){}
  requestAnimationFrame(einstiege); setTimeout(einstiege, 400);
  return r;
};

/* ---------- Einstiege: Karussell (App), Startseite (Computer), Profil-Liste (App) ---------- */
function einstiege(){
  try{
    if(typeof S === "undefined" || S.screen !== "home" || S.libModus) return;
    const app = document.getElementById("app"); if(!app) return;
    const appAn = (() => { try{ return window.EP_APP && window.EP_APP.an(); }catch(e){ return false; } })();
    const welten = liste().slice().sort((x, y) => (x.reihe || 99) - (y.reihe || 99));
    if(!appAn){
      const wg = app.querySelector(".ep-wg");
      if(wg && !wg.querySelector(".x-ein")){
        const b = document.createElement("button"); b.type = "button"; b.className = "ep-w x-ein x-gross";
        b.setAttribute("aria-label", `Entdecken: ${welten.length} Welten`);
        b.innerHTML = `<span class="x-g-txt"><small>✨ ${welten.length} Welten zum Entdecken</small><b>Entdecken</b>
          <span class="x-g-sub">Schweizer Karte, Sammelalbum, Abenteuer, Regionen-Duell, Musik und vieles mehr</span>
          <span class="x-g-chips">${welten.slice(0, 6).map(m => `<i>${h(m.emo)} ${h(m.titel)}</i>`).join("")}<i>+${Math.max(0, welten.length - 6)} weitere</i></span>
          <span class="x-g-los">Los geht's ›</span></span>
          <img class="x-g-bild" src="img/kids/duo-jubel.webp" alt="">`;
        b.onclick = () => go("x-entdecken");
        /* gross nach den ersten vier Kacheln (Dein Tag, Test, Serie, Level) */
        wg.insertBefore(b, wg.children[4] || null);
      }
      /* Truhe neben Entdecken, damit die Reihe voll ist */
      const x = wg && wg.querySelector(".x-ein"), t = wg && wg.querySelector(".xt-ein");
      if(x && t && x.nextElementSibling !== t) x.after(t);
    } else {
      const fakt = app.querySelector(".ap-heute .ap-fakt");
      if(fakt && !app.querySelector(".ap-heute .x-app")){
        const b = document.createElement("button"); b.type = "button"; b.className = "apf x-app";
        b.setAttribute("aria-label", `Entdecken: ${welten.length} Welten`);
        b.innerHTML = `<span class="x-a-txt"><small>✨ ${welten.length} Welten</small><b>Entdecken</b><span class="x-a-emo" aria-hidden="true">${welten.slice(0, 7).map(m => `<i>${h(m.emo)}</i>`).join("")}</span></span><img src="img/kids/duo-jubel.webp" alt="">`;
        b.onclick = () => go("x-entdecken");
        fakt.remove();
        const woche = app.querySelector(".ap-heute .ap-woche");
        if(woche) woche.before(b); else app.querySelector(".ap-heute").appendChild(b);
      }
    }
    const nav = app.querySelector(".ap-profil .ap-liste");
    if(nav && !nav.querySelector(".x-ein")){
      const b = document.createElement("button"); b.type = "button"; b.className = "x-ein";
      b.innerHTML = `<span class="x-ein-emo" aria-hidden="true">✨</span><span>Entdecken</span>`;
      b.onclick = () => go("x-entdecken");
      nav.insertBefore(b, nav.firstChild);
    }
  }catch(e){ console.warn("extras einstiege", e); }
}

/* Karussell-Folie und Aktionen (EP_START lädt nach dieser Datei, darum erst beim ersten Gebrauch einhängen) */
function startEinhaengen(){
  const ES = window.EP_START; if(!ES || ES.__x) return;
  ES.__x = true;
  const vorSlides = ES.heldSlides, vorAktion = ES.aktion;
  if(typeof vorSlides === "function") ES.heldSlides = function(){
    const l = vorSlides.apply(this, arguments) || [];
    try{ let extra = []; MODS.forEach(m => { if(m.folie && sichtbar(m)){ try{ const f = m.folie(); if(f) extra.push(f); }catch(e){} } });
      extra.push({cls:"hs-x", ic:"✨", lbl:"Neu bei easyplay", titel:"Entdecken", text:"Schweizer Karte, Sammelalbum, Abenteuer und mehr", btn:"✨ Entdecken", a:"x-entdecken"});
      return l.slice(0, 1).concat(extra, l.slice(1)); }catch(e){ return l; }
  };
  if(typeof vorAktion === "function") ES.aktion = function(a, el){
    if(typeof a === "string" && a.startsWith("x-")){ go(a); return; }
    return vorAktion.apply(this, arguments);
  };
}
document.addEventListener("DOMContentLoaded", startEinhaengen);
addEventListener("load", startEinhaengen);

/* ---------- Stil ---------- */
const css = document.createElement("style"); css.id = "ep-extras";
css.textContent = `
.xseite{max-width:1100px;margin:0 auto 24px;padding:0 4px;box-sizing:border-box}
.x-kopf{position:relative;display:flex;align-items:center;gap:14px;padding:22px 24px;border-radius:28px;color:#fff;background:linear-gradient(135deg,#5B4BF5,#9B4DE0 60%,#E043B8);box-shadow:0 14px 30px rgba(60,40,140,.25);overflow:visible;margin:6px 0 18px;min-height:96px}
.x-kopf h1{margin:0;font-size:clamp(1.5rem,4vw,2.2rem);color:#fff}
.x-kopf p{margin:4px 0 0;opacity:.92;color:#fff}
.x-kopf-emo{font-size:2.4rem}
.x-kopf img{position:absolute;right:14px;bottom:0;height:calc(100% + 30px);max-height:170px;pointer-events:none}
.x-kopf>div{padding-right:150px}
.x-kacheln{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:14px}
.x-kachel{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:4px;text-align:left;border:0;border-radius:24px;padding:18px 18px 16px;min-height:132px;color:#fff;cursor:pointer;box-shadow:0 10px 22px rgba(27,34,64,.22);transition:transform .15s}
.x-kachel:hover{transform:translateY(-2px)}
.x-kachel:focus-visible{outline:3px solid #FFE34D;outline-offset:3px}
.x-kachel .x-emo{font-size:2rem;line-height:1}
.x-kachel b{font-size:1.15rem;color:#fff}
.x-kachel small{font-size:.86rem;opacity:.95;color:#fff;line-height:1.3}
.x-badge{position:absolute;top:10px;right:12px;font-style:normal;background:#FFE34D;color:#1B2240;font-weight:800;font-size:.75rem;padding:3px 8px;border-radius:999px}
.x-leer{color:#fff;background:rgba(15,20,48,.45);padding:12px 16px;border-radius:16px}
.ep-w.x-gross{grid-column:span 3;position:relative;overflow:visible;min-height:250px;padding:26px 28px!important;display:flex;align-items:stretch;background:linear-gradient(120deg,#FF5FA2 0%,#8A3FE0 45%,#3D5AFE 100%)!important;box-shadow:0 16px 36px rgba(110,50,200,.35)!important}
.ep-w.x-gross .x-g-txt{display:flex;flex-direction:column;gap:8px;max-width:58%;position:relative;z-index:1}
.ep-w.x-gross small{display:inline-block;width:fit-content;padding:5px 12px;border-radius:999px;background:rgba(255,255,255,.22);font-size:.82rem;font-weight:800;letter-spacing:.02em;text-transform:none}
.ep-w.x-gross b{font-size:clamp(2.2rem,3.6vw,3.2rem);line-height:1;font-weight:900;letter-spacing:-.01em;text-shadow:0 3px 12px rgba(40,10,90,.35)}
.ep-w.x-gross .x-g-sub{font-size:1rem;line-height:1.35;opacity:.95}
.ep-w.x-gross .x-g-chips{display:flex;flex-wrap:wrap;gap:6px}
.ep-w.x-gross .x-g-chips i{font-style:normal;font-size:.82rem;font-weight:700;padding:4px 10px;border-radius:999px;background:rgba(15,20,48,.32);white-space:nowrap}
.ep-w.x-gross .x-g-los{margin-top:auto;width:fit-content;padding:10px 20px;border-radius:999px;background:#FFE34D;color:#2a1d5c!important;font-weight:900;box-shadow:0 5px 0 #C9A800}
.ep-w.x-gross .x-g-bild{position:absolute;right:10px;bottom:0;height:calc(100% + 34px);max-width:42%;object-fit:contain;object-position:bottom right;pointer-events:none;filter:drop-shadow(0 10px 18px rgba(30,10,80,.35))}
.ep-w.x-gross:hover{transform:translateY(-3px)}
.ep-w.x-gross:hover .x-g-bild{transform:scale(1.03);transition:transform .25s}
.ep-wg>.xt-ein{min-height:250px;display:flex!important;flex-direction:column;justify-content:space-between}
@media (min-width:861px){.ep-wg>.xt-ein .xt-ein-truhe{position:static!important;display:block;width:78%!important;max-width:190px;height:auto!important;margin:6px auto 0;transform:none!important;order:1}
.ep-wg>.xt-ein .xt-ein-truhe svg{width:100%!important;height:auto!important}
.ep-wg>.xt-ein>b,.ep-wg>.xt-ein>span:not(.xt-ein-truhe){order:2}
.ep-wg .eptl{display:flex!important;flex-direction:column}.ep-wg .eptl .epe{flex:1 1 auto}}
@media (max-width:860px){.ep-w.x-gross{grid-column:1/-1}.ep-wg>.xt-ein{min-height:0;grid-column:1/-1}}
.apf.x-app{position:relative;overflow:visible;display:flex;align-items:center;text-align:left;min-height:108px;padding:14px 16px;border:0;border-radius:24px;color:#fff;cursor:pointer;background:linear-gradient(120deg,#FF5FA2 0%,#8A3FE0 50%,#3D5AFE 100%);box-shadow:0 12px 26px rgba(110,50,200,.35);font:inherit}
.apf.x-app .x-a-txt{display:flex;flex-direction:column;gap:4px;max-width:62%;position:relative;z-index:1}
.apf.x-app small{width:fit-content;padding:3px 10px;border-radius:999px;background:rgba(255,255,255,.22);font-size:.74rem;font-weight:800}
.apf.x-app b{font-size:1.75rem;line-height:1;font-weight:900;text-shadow:0 2px 10px rgba(40,10,90,.35)}
.apf.x-app .x-a-emo{display:flex;gap:3px;font-size:1.05rem}
.apf.x-app .x-a-emo i{font-style:normal;display:grid;place-items:center;width:27px;height:27px;border-radius:50%;background:rgba(255,255,255,.2)}
.apf.x-app img{position:absolute;right:6px;bottom:0;height:calc(100% + 26px);max-width:44%;object-fit:contain;object-position:bottom right;pointer-events:none;filter:drop-shadow(0 8px 14px rgba(30,10,80,.35))}
@media (max-height:780px) and (max-width:699px){.ap-heute .ap-woche{display:none!important}}
.apf.x-app:focus-visible,.ep-w.x-gross:focus-visible{outline:3px solid #FFE34D;outline-offset:3px}
@media (min-width:700px){.apf.x-app{min-height:170px;padding:20px 24px}.apf.x-app b{font-size:2.4rem}.apf.x-app .x-a-emo{font-size:1.3rem}.apf.x-app .x-a-emo i{width:34px;height:34px}}
@media (prefers-reduced-motion:reduce){.ep-w.x-gross:hover,.ep-w.x-gross:hover .x-g-bild{transform:none}}
.ep-w.x-ein{background:linear-gradient(135deg,#5B4BF5,#9B4DE0 60%,#E043B8)!important;color:#fff!important;text-align:left;cursor:pointer;border:0}
.ep-w.x-ein b,.ep-w.x-ein small,.ep-w.x-ein span{color:#fff!important}
.ap-liste .x-ein{display:flex;align-items:center;gap:10px}
.ap-liste .x-ein-emo{font-size:1.15rem;width:20px;text-align:center}
.x-toast{position:fixed;left:50%;bottom:calc(96px + env(safe-area-inset-bottom));transform:translate(-50%,20px);opacity:0;z-index:9999;background:#1B2240;color:#fff;font-weight:700;padding:12px 18px;border-radius:16px;box-shadow:0 10px 24px rgba(0,0,0,.3);transition:opacity .3s,transform .3s;max-width:min(92vw,460px);text-align:center}
.x-toast.an{opacity:1;transform:translate(-50%,0)}
@media (max-width:560px){
  .x-kopf{padding:16px 16px;border-radius:22px;min-height:84px;margin-top:2px}
  .x-kopf>div{padding-right:96px}
  .x-kopf img{max-height:118px;right:6px}
  .x-kopf-emo{font-size:1.8rem}
  .x-kacheln{grid-template-columns:1fr 1fr;gap:10px}
  .x-kachel{min-height:112px;padding:14px 12px;border-radius:20px}
  .x-kachel b{font-size:1rem}
  .x-kachel small{font-size:.76rem}
}
`;
document.head.appendChild(css);

window.EP_EXTRAS = {
  register(m){ if(!m || !m.id || typeof m.render !== "function") return; const i = MODS.findIndex(x => x.id === m.id); if(i >= 0) MODS.splice(i, 1); MODS.push(m); MODS.sort((a, b) => (a.reihe || 50) - (b.reihe || 50)); },
  liste, api, oeffne: id => go("x-" + id), meldung
};
})();
