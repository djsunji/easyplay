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
/* Thema der Woche: Vorschau der nächsten Wochen */
.wk2-plan{margin-top:18px;padding:16px;border-radius:24px;background:linear-gradient(135deg,#1E3A8A,#3D5AFE 60%,#8A3FE0);color:#fff;box-shadow:0 12px 26px rgba(30,40,120,.3)}
.wk2-plan h3{margin:0 0 10px;font-size:1.15rem;color:#fff}
.wk2-plan p{margin:10px 0 0;font-size:.85rem;opacity:.9;color:#fff}
.wk2-pl{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.wk2-pk{display:flex;flex-direction:column;align-items:flex-start;gap:3px;padding:12px;border-radius:18px;background:rgba(255,255,255,.16);min-width:0}
.wk2-pk small{font-size:.72rem;opacity:.9;color:#fff}
.wk2-pk b{font-size:1rem;line-height:1.15;color:#fff;-webkit-hyphens:auto;hyphens:auto}
.wk2-pi{display:grid;place-items:center;width:40px;height:40px;border-radius:12px;background:#fff;margin-bottom:4px;overflow:hidden}
.wk2-pi img,.wk2-pi svg{width:30px;height:30px;object-fit:contain}
@media (max-width:420px){.wk2-pl{gap:6px}.wk2-pk{padding:9px}.wk2-pk b{font-size:.8rem}.wk2-pi{width:34px;height:34px}}
/* Duell-Seite: Symbol und Titel in der Mitte */
html body .dukopf{text-align:center!important}
html body .dukopf .dusw{display:grid!important;place-items:center;margin-left:auto!important;margin-right:auto!important}
html body .dukopf h1,html body .dukopf p{margin-left:auto!important;margin-right:auto!important;text-align:center!important;position:relative;z-index:1}
/* Duell-Menü: farbige Kacheln statt dunkler Kästen */
html body .du2-team{background:linear-gradient(120deg,#E043B8,#8A3FE0 50%,#3D5AFE)!important;border:0!important;box-shadow:0 12px 26px rgba(110,50,200,.3);background-size:170% 170%!important;animation:xkFluss 12s ease-in-out infinite alternate}
html body .du2-team .lbl{color:#fff!important;opacity:.95}
html body .du2-rang{background:linear-gradient(120deg,#F4A818,#E8790C 60%,#D9480F)!important;border:0!important;color:#fff!important;box-shadow:0 10px 22px rgba(200,100,10,.3)}
html body .du2-rang>span:not(.du2-liga),html body .du2-rang>small{color:#fff!important}
@media (prefers-reduced-motion:reduce){html body .du2-team{animation:none}}
/* iPhone: Logo etwas kleiner, damit Fahne und Lautsprecher nebeneinander Platz haben */
@media (max-width:400px){body.ep-app .ap-gruss .ap-logo{height:38px!important;top:2px!important}}
@media (max-width:340px){body.ep-app .ap-gruss .ap-logo{height:31px!important;top:5px!important}}
/* Feinschliff: nichts abschneiden */
.xa-tab b{white-space:normal!important;overflow:visible!important;text-overflow:clip!important;line-height:1.15}
.xg-teil b{white-space:normal!important;overflow:visible!important;text-overflow:clip!important;line-height:1.1;-webkit-hyphens:auto;hyphens:auto;letter-spacing:-.01em}@media (max-width:420px){.xg-teil b{font-size:10.5px!important}}
body.ep-app .apf.x-app{overflow:visible!important}
body.ep-app .ap-gruss b{overflow:visible!important}
body.ep-app .ap-kz>h1{white-space:normal!important;text-overflow:clip!important;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;line-height:1.1!important;overflow-wrap:anywhere;hyphens:auto}
@media (max-width:420px){body.ep-app .ap-kz>h1{font-size:15px!important}}
/* ===== App (Handy und iPad): gleiche Lebendigkeit wie am Computer ===== */
body.ep-app .apf::before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.2) 50%,transparent 65%);background-size:250% 100%;background-position:150% 0;animation:xkGlanz 8s ease-in-out infinite}
body.ep-app .apf:nth-child(2n)::before{animation-delay:2s}body.ep-app .apf:nth-child(3n)::before{animation-delay:4s}body.ep-app .apf:nth-child(5n)::before{animation-delay:6s}
body.ep-app .apf:is(.f-lila,.f-gold,.f-navy,.f-blau,.f-pink,.f-orange,.f-teal,.f-gruen){background-size:170% 170%!important;animation:xkFluss 12s ease-in-out infinite alternate}
body.ep-app .ap-stats>*{background-size:170% 170%!important;animation:xkFluss 12s ease-in-out infinite alternate}
body.ep-app .apf .apico,body.ep-app .ap-zwei .apf>svg:first-child{animation:xkSchweb 4s ease-in-out infinite}
body.ep-app .apf:active{transform:scale(.97)}
/* Profil: Entdecken als farbige ganze Zeile, Symbole in farbigen Kreisen */
body.ep-app .ap-liste .x-ein{grid-column:1/-1;justify-content:flex-start;min-height:50px;background:linear-gradient(120deg,#FF5FA2,#8A3FE0 55%,#3D5AFE)!important;font-weight:800!important;box-shadow:0 8px 18px rgba(110,50,200,.35)}
body.ep-app .ap-liste .x-ein span:not(.x-ein-emo){overflow:visible}
body.ep-app .ap-liste>*:not(.x-ein)>svg:first-child{box-sizing:content-box;padding:7px;border-radius:50%;background:var(--xli,#5B4BF5);opacity:1;box-shadow:0 3px 8px rgba(0,0,0,.25)}
body.ep-app .ap-liste>*:nth-child(6n+2)>svg:first-child{--xli:linear-gradient(135deg,#FF8A3D,#FF5F9E)}
body.ep-app .ap-liste>*:nth-child(6n+3)>svg:first-child{--xli:linear-gradient(135deg,#0FA968,#0B6E86)}
body.ep-app .ap-liste>*:nth-child(6n+4)>svg:first-child{--xli:linear-gradient(135deg,#2E5BFF,#22A9BB)}
body.ep-app .ap-liste>*:nth-child(6n+5)>svg:first-child{--xli:linear-gradient(135deg,#F4A818,#E8590C)}
body.ep-app .ap-liste>*:nth-child(6n)>svg:first-child{--xli:linear-gradient(135deg,#B5179E,#E8366F)}
body.ep-app .ap-liste>*:nth-child(6n+1):not(.x-ein)>svg:first-child{--xli:linear-gradient(135deg,#5B2BD9,#9B4DE0)}
@media (prefers-reduced-motion:reduce){body.ep-app .apf,body.ep-app .apf::before,body.ep-app .apf *,body.ep-app .ap-stats>*{animation:none!important}}
/* ===== Lebendige Kacheln auf der Startseite (Computer) ===== */
html body .ep-wg>.ep-w:is(.eptl,[data-a=zufall],[data-a=fehler],[data-a=live]):not(.x-ein),html body .ep-wg>.ep-w:has(.epring),html body .ep-wg>.ep-w:has(.epabz),html body .ep-wg>.ep-w:has(.epfakt){color:#fff!important;border:0!important;background-size:180% 180%!important;animation:xkFluss 12s ease-in-out infinite alternate;box-shadow:0 12px 28px rgba(20,20,70,.28),inset 0 1px 0 rgba(255,255,255,.25)!important;isolation:isolate}
html body .ep-wg>.ep-w.eptl{background:linear-gradient(135deg,#1E3A8A,#2E5BFF 60%,#4F8BFF)!important}
html body .ep-wg>.ep-w[data-a=zufall]{background:linear-gradient(135deg,#FF8A3D,#FF5F9E 60%,#E043B8)!important}
html body .ep-wg>.ep-w:has(.epring){background:linear-gradient(135deg,#0FA968,#0B8A7A 55%,#0B6E86)!important}
html body .ep-wg>.ep-w[data-a=live]{background:linear-gradient(135deg,#7B1FA2,#B5179E 55%,#E8366F)!important}
html body .ep-wg>.ep-w[data-a=live].rot{background:linear-gradient(135deg,#E8364F,#FF6B3D)!important}
html body .ep-wg>.ep-w:has(.epabz){background:linear-gradient(135deg,#F4A818,#E8790C 60%,#D9480F)!important}
html body .ep-wg>.ep-w:has(.epfakt){background:linear-gradient(135deg,#2E5BFF,#2A86E0 55%,#22A9BB)!important}
html body .ep-wg>.ep-w[data-a=fehler]{background:linear-gradient(135deg,#FF5F6D,#FF8A5C 60%,#FFB347)!important}
html body .ep-wg>.ep-w[data-a=fehler][disabled]{background:linear-gradient(135deg,#17B26A,#12A57F 55%,#0B8A7A)!important;opacity:1!important;cursor:default}
/* Texte weiss */
html body .ep-wg>.ep-w:is(.eptl,[data-a=zufall],[data-a=fehler],[data-a=live]) *,html body .ep-wg>.ep-w:has(.epring) *,html body .ep-wg>.ep-w:has(.epabz) *,html body .ep-wg>.ep-w:has(.epfakt) *{color:#fff!important}
html body .ep-wg>.ep-w small{opacity:.9;letter-spacing:.06em}
html body .ep-wg>.ep-w :is(.ep-btn.gelb,.epmini,[class*=gelb]),html body .ep-wg>.ep-w[data-a=live] .ep-btn,html body .ep-wg>.ep-w .xg-tag *{color:#1B2240!important}
html body .ep-wg>.ep-w:has(.epfakt) span:last-child{display:inline-block;width:fit-content;padding:6px 12px;border-radius:999px;background:rgba(255,255,255,.2);font-size:.9rem}
html body .ep-wg>.ep-w.eptl .epe b{color:#fff!important}
html body .ep-wg>.ep-w.eptl .epe small{opacity:.85}
html body .ep-wg>.ep-w.eptl .epe::before{background:rgba(255,255,255,.3)!important}
html body .ep-wg>.ep-w.eptl .epe i{background:#2348C8!important}
html body .ep-wg>.ep-w.eptl .epe.st-jetzt i{animation:xkPuls 1.8s ease-out infinite}
html body .ep-wg>.ep-w.eptl time{color:rgba(255,255,255,.75)!important}
html body .ep-wg>.ep-w:has(.epring) .epring b{background:#0B7A80!important}
html body .ep-wg>.ep-w[data-a=zufall] .eptage i{background:rgba(255,255,255,.3)}
html body .ep-wg>.ep-w[data-a=zufall] .eptage i.an{background:#FFE34D}
html body .ep-wg>.ep-w[data-a=live] .ep-btn,html body .ep-wg>.ep-w[data-a=live] button{color:#2a1d5c!important}
/* grosses Symbol als Wasserzeichen, sanft bewegt */
html body .ep-wg>.ep-w:is(.eptl,[data-a=zufall],[data-a=fehler],[data-a=live]):not(.x-ein)::after,html body .ep-wg>.ep-w:has(.epring)::after,html body .ep-wg>.ep-w:has(.epabz)::after,html body .ep-wg>.ep-w:has(.epfakt)::after{position:absolute;right:-8px;bottom:-18px;z-index:-1;font-size:118px;line-height:1;opacity:.2;pointer-events:none;animation:xkSchweb 5s ease-in-out infinite;filter:saturate(1.2)}
html body .ep-wg>.ep-w.eptl::after{content:"☀️";font-size:150px;right:-20px;bottom:-30px;animation:xkDreh 40s linear infinite}
html body .ep-wg>.ep-w[data-a=zufall]::after{content:"🔥"}
html body .ep-wg>.ep-w:has(.epring)::after{content:"⭐";animation:xkDreh 24s linear infinite}
html body .ep-wg>.ep-w[data-a=live]::after{content:"⚡";font-size:150px}
html body .ep-wg>.ep-w:has(.epabz)::after{content:"🏆"}
html body .ep-wg>.ep-w:has(.epfakt)::after{content:"💡";animation:xkLeucht 3s ease-in-out infinite}
html body .ep-wg>.ep-w[data-a=fehler]::after{content:"🎯"}
/* Glanz, der über die Kachel streicht */
html body .ep-wg>.ep-w:is(.eptl,[data-a=zufall],[data-a=fehler],[data-a=live]):not(.x-ein)::before,html body .ep-wg>.ep-w:has(.epring)::before,html body .ep-wg>.ep-w:has(.epabz)::before,html body .ep-wg>.ep-w:has(.epfakt)::before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.22) 50%,transparent 65%);background-size:250% 100%;background-position:150% 0;animation:xkGlanz 7s ease-in-out infinite}
html body .ep-wg>.ep-w:nth-child(3)::before{animation-delay:1s}html body .ep-wg>.ep-w:nth-child(4)::before{animation-delay:2s}html body .ep-wg>.ep-w:nth-child(7)::before{animation-delay:3s}html body .ep-wg>.ep-w:nth-child(9)::before{animation-delay:4s}html body .ep-wg>.ep-w:nth-child(10)::before{animation-delay:5s}html body .ep-wg>.ep-w:nth-child(11)::before{animation-delay:6s}
/* lebendige Inhalte */
html body .ep-wg>.ep-w[data-a=zufall] .epzahl{display:inline-block;transform-origin:bottom center}
html body .ep-wg>.ep-w:has(.epabz) .epabz{display:inline-block;animation:xkWackel 2.6s ease-in-out infinite}
html body .ep-wg>.ep-w[data-a=live] #epLiveCd{animation:xkTick 1s ease-in-out infinite}
html body .ep-wg>.ep-w:has(.epring) .epring{animation:xkSchweb 4s ease-in-out infinite}
html body .ep-wg>.ep-w:not(.x-gross):hover{transform:translateY(-4px) scale(1.01);transition:transform .2s}
@keyframes xkFluss{from{background-position:0% 30%}to{background-position:100% 70%}}
@keyframes xkSchweb{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-8px) rotate(4deg)}}
@keyframes xkDreh{to{transform:rotate(360deg)}}
@keyframes xkLeucht{0%,100%{opacity:.16;filter:drop-shadow(0 0 0 #FFE34D)}50%{opacity:.38;filter:drop-shadow(0 0 18px #FFE34D)}}
@keyframes xkGlanz{0%,70%{background-position:150% 0}100%{background-position:-60% 0}}
@keyframes xkWackel{0%,100%{transform:rotate(0)}20%{transform:rotate(-8deg) scale(1.08)}40%{transform:rotate(6deg)}60%{transform:rotate(0) scale(1)}}
@keyframes xkTick{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
@keyframes xkPuls{0%{box-shadow:0 0 0 0 rgba(255,227,77,.7)}100%{box-shadow:0 0 0 12px rgba(255,227,77,0)}}
/* App: Kachel «Mein Level» farbig statt dunkel */
.ap-heute .ap-tag .apf.f-navy{background:linear-gradient(135deg,#0FA968,#0B6E86)!important}
.ap-heute .apf .apico{animation:xkSchweb 4s ease-in-out infinite}
.ap-heute .ap-tag .apf:nth-child(2) .apico{animation-delay:-1s}.ap-heute .ap-tag .apf:nth-child(3) .apico{animation-delay:-2s}.ap-heute .ap-tag .apf:nth-child(4) .apico{animation-delay:-3s}
@media (prefers-reduced-motion:reduce){html body .ep-wg>.ep-w,html body .ep-wg>.ep-w::before,html body .ep-wg>.ep-w::after,html body .ep-wg>.ep-w *,.ap-heute .apf .apico{animation:none!important}}
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
