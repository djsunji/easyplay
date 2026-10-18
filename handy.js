/* easyplay · handy.js
   Handy-Design «aufgeräumt im heutigen Stil»: Tagesziel in der Hero-Karte, Bereich-Blatt statt Seitenwechsel,
   Profil mit vier Reitern, farbiges Quiz mit Antwort-Blatt. Greift nur in der App-Ansicht (body.ep-app). */
(function(){
"use strict";
const app = () => document.body.classList.contains("ep-app");
const $ = (s, w) => (w || document).querySelector(s);
const $$ = (s, w) => [...(w || document).querySelectorAll(s)];
const h = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const KIDS = "img/kids/";
const PLAY = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M7 4l13 8-13 8z"/></svg>';

/* ---------- Stil ---------- */
const css = document.createElement("style"); css.id = "ep-handy-css";
css.textContent = `
/* Start: Tagesziel in der Hero-Karte */
body.ep-app .ap-heute .hd-tag{display:flex;flex-direction:column;gap:6px;margin:2px 0 4px}
@media (max-width:375px){body.ep-app .ap-heute .hs-start .epname{display:none}body.ep-app .ap-heute .hd-tag b{font-size:13px!important}}
body.ep-app .ap-heute .hd-tag b{font:600 14px "Lexend",system-ui,sans-serif;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.25)}
body.ep-app .ap-heute .hd-bars{display:flex;gap:5px;width:150px;max-width:100%}
body.ep-app .ap-heute .hd-bars s{flex:1;height:9px;border-radius:5px;background:rgba(255,255,255,.35);text-decoration:none}
body.ep-app .ap-heute .hd-bars s.an{background:#FFD85E;box-shadow:0 0 8px rgba(255,216,94,.8)}
body.ep-app .ap-heute .hs-start .apzahlen{display:none}
body.ep-app .ap-heute .ap-kopf .aplbl{display:none}
body.ep-app .ap-heute .ap-kopf{justify-content:flex-start}
/* Themen: Bibliothek immer sichtbar */
body.ep-app .ap-themen .ap-unten{display:grid;grid-template-columns:1fr 1fr;gap:10px}
body.ep-app .ap-themen .ap-unten .apzeile{min-height:64px}
body.ep-app .ap-themen .ap-unten .apzeile small{display:none}
body.ep-app .ap-themen .ap-unten .apzeile b{font-size:16px}
/* Bereich-Blatt */
.hd-sheet{position:fixed;inset:0;z-index:95;display:flex;align-items:flex-end;background:rgba(8,5,30,.72);-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);animation:hdEin .18s ease}
.hd-sheet .hd-blatt{position:relative;width:100%;max-height:82vh;max-height:82dvh;box-sizing:border-box;padding:10px 16px calc(22px + env(safe-area-inset-bottom));border-radius:34px 34px 0 0;background:linear-gradient(170deg,var(--c2,#25C9AB) 0%,var(--c,#109C86) 45%,var(--c3,#0A7766) 100%);color:#fff;box-shadow:0 -10px 40px rgba(0,0,0,.5),inset 0 2px 0 rgba(255,255,255,.3);display:flex;flex-direction:column;gap:12px;animation:hdHoch .26s cubic-bezier(.2,.9,.3,1.1);overflow:hidden}
.hd-sheet .hd-griff{align-self:center;width:44px;height:5px;border-radius:3px;background:rgba(255,255,255,.5);flex:none}
.hd-sheet .hd-kopf{display:flex;align-items:center;gap:12px;flex:none}
.hd-sheet .hd-kopf .hd-ico{width:58px;height:58px;border-radius:18px;background:#fff;display:grid;place-items:center;font-size:32px;box-shadow:0 6px 12px -4px rgba(0,0,0,.35);flex:none}
.hd-sheet .hd-kopf .hd-ico svg,.hd-sheet .hd-kopf .hd-ico img{width:36px;height:36px}
.hd-sheet .hd-kopf h2{margin:0;font:800 24px/1.05 "Bricolage Grotesque","Fredoka",system-ui,sans-serif;text-shadow:0 1px 2px rgba(0,0,0,.3)}
.hd-sheet .hd-kopf p{margin:2px 0 0;font:500 13px "Lexend",system-ui,sans-serif;text-shadow:0 1px 2px rgba(0,0,0,.3)}
.hd-sheet .hd-zu{margin-left:auto;width:44px;height:44px;border-radius:22px;border:0;background:rgba(0,0,0,.2);color:#fff;font-size:20px;cursor:pointer;flex:none}
.hd-sheet .hd-themen{display:grid;grid-template-columns:1fr 1fr;gap:10px;overflow:auto;min-height:0;padding:2px;margin:-2px;-webkit-overflow-scrolling:touch}
.hd-sheet .hd-thema{position:relative;min-height:86px;border:1px solid rgba(255,255,255,.22);border-radius:22px;background:rgba(255,255,255,.16);box-shadow:inset 0 -4px 0 rgba(0,0,0,.12);color:#fff;text-align:left;padding:12px;display:flex;flex-direction:column;justify-content:space-between;gap:6px;cursor:pointer;font-family:"Lexend",system-ui,sans-serif}
.hd-sheet .hd-thema .hd-ti{font-size:28px;line-height:1}
.hd-sheet .hd-thema .hd-ti svg,.hd-sheet .hd-thema .hd-ti img{width:30px;height:30px}
.hd-sheet .hd-thema b{font:700 16px/1.15 "Lexend",system-ui,sans-serif;text-shadow:0 1px 2px rgba(0,0,0,.3)}
.hd-sheet .hd-thema small{position:absolute;right:12px;top:12px;font:700 11px "Lexend",system-ui,sans-serif;padding:3px 8px;border-radius:9px;background:rgba(0,0,0,.22)}
.hd-sheet .hd-thema.leer{opacity:.5}
.hd-sheet .hd-alle{flex:none;display:flex;align-items:center;justify-content:center;gap:8px;height:56px;border:0;border-radius:28px;background:linear-gradient(180deg,#FFD85E,#FFB21E);color:#2A1D5C;font:700 17px "Lexend",system-ui,sans-serif;box-shadow:0 5px 0 #D2860A,0 12px 20px -8px rgba(255,178,30,.7);cursor:pointer}
@keyframes hdEin{from{opacity:0}to{opacity:1}}
@keyframes hdHoch{from{transform:translateY(60px);opacity:.6}to{transform:none;opacity:1}}
@media (prefers-reduced-motion:reduce){.hd-sheet,.hd-sheet .hd-blatt{animation:none}}
/* Profil: Reiter */
body.ep-app .ap-profil .hd-ptabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;padding:4px;border-radius:19px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.1)}
body.ep-app .ap-profil .hd-ptabs button{height:44px;border:0;border-radius:15px;background:transparent;color:#D7D2FF;font:500 13px "Lexend",system-ui,sans-serif;cursor:pointer;padding:0 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
body.ep-app .ap-profil .hd-ptabs button[aria-selected="true"]{background:linear-gradient(140deg,#FF5C9E,#D92472);color:#fff;font-weight:700;box-shadow:0 6px 14px -4px rgba(226,48,122,.7)}
body.ep-app .ap-profil .hd-garde{position:relative;overflow:hidden;min-height:92px;border:0;border-radius:26px;padding:0 16px;text-align:left;color:#fff;background:linear-gradient(140deg,#FF5C9E 0%,#E2307A 50%,#B5175A 100%);box-shadow:0 14px 26px -12px rgba(0,0,0,.6),inset 0 -5px 0 rgba(0,0,0,.18),inset 0 2px 0 rgba(255,255,255,.28);display:flex;align-items:center;gap:12px;cursor:pointer}
body.ep-app .ap-profil .hd-garde b{font:800 21px "Bricolage Grotesque","Fredoka",system-ui,sans-serif;text-shadow:0 1px 2px rgba(0,0,0,.3)}
body.ep-app .ap-profil .hd-garde small{display:block;font:500 13px "Lexend",system-ui,sans-serif;text-shadow:0 1px 2px rgba(0,0,0,.3)}
body.ep-app .ap-profil .hd-garde img{position:absolute;right:-10px;bottom:-4px;height:100px;width:auto}
body.ep-app .ap-profil .hd-garde .hd-gt{position:relative;flex:1;padding-right:90px}
body.ep-app .ap-profil .hd-erfolge{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
body.ep-app .ap-profil .hd-abz{min-height:96px;border-radius:22px;padding:12px 8px;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;text-align:center;color:#fff;background:linear-gradient(140deg,#FF9B3D,#C3540A);box-shadow:0 10px 20px -10px rgba(0,0,0,.6),inset 0 -4px 0 rgba(0,0,0,.18)}
body.ep-app .ap-profil .hd-abz.aus{background:rgba(255,255,255,.07);border:2px dashed rgba(255,255,255,.3);box-shadow:none;color:#C9C3FF}
body.ep-app .ap-profil .hd-abz i{font-style:normal;font-size:30px;line-height:1}
body.ep-app .ap-profil .hd-abz.aus i{filter:grayscale(1);opacity:.45}
body.ep-app .ap-profil .hd-abz b{font:700 12px/1.15 "Lexend",system-ui,sans-serif}
body.ep-app .ap-profil .hd-leer{padding:14px 16px;border-radius:22px;background:rgba(255,255,255,.08);color:#D7D2FF;font:500 14px/1.45 "Lexend",system-ui,sans-serif}
body.ep-app .ap-profil [data-hdp][hidden]{display:none!important}
/* Quiz: farbige Antworten, dicker Balken, Hilfe-Knöpfe */
body.ep-app .qtop .bar{height:10px;border-radius:5px;background:rgba(255,255,255,.18)}
body.ep-app .qtop .bar i{border-radius:5px;background:linear-gradient(90deg,#4FCB62,#FFD85E);box-shadow:0 0 8px rgba(255,216,94,.7)}
body.ep-app .qtop .count{font:700 15px "Lexend",system-ui,sans-serif}
body.ep-app.ep-s-quiz .answers .ans{padding:10px 48px 10px 54px!important;border-radius:22px!important;min-height:60px!important}
body.ep-app .answers .ans{border:0;border-radius:22px;min-height:60px;color:#fff;font:600 16px "Lexend",system-ui,sans-serif;box-shadow:0 6px 0 rgba(0,0,0,.22),0 12px 20px -10px rgba(0,0,0,.6),inset 0 2px 0 rgba(255,255,255,.3);transition:transform .12s ease,opacity .2s ease}
body.ep-app .answers .ans:nth-child(1){background:linear-gradient(140deg,#5A8BFF,#1D45BF)}
body.ep-app .answers .ans:nth-child(2){background:linear-gradient(140deg,#4FCB62,#1D7F33)}
body.ep-app .answers .ans:nth-child(3){background:linear-gradient(140deg,#FF9B3D,#C3540A)}
body.ep-app .answers .ans:nth-child(4){background:linear-gradient(140deg,#FF5C9E,#B5175A)}
body.ep-app .answers .ans .key{width:34px;height:34px;border-radius:17px;background:#fff;color:#2A1D5C;font:800 15px "Lexend",system-ui,sans-serif;display:inline-grid;place-items:center;flex:none;box-shadow:none}
body.ep-app .answers .ans:active{transform:translateY(3px);box-shadow:0 3px 0 rgba(0,0,0,.22)}
body.ep-app .answers .ans.right{background:linear-gradient(140deg,#4FCB62,#1D7F33)!important;outline:3px solid #fff;box-shadow:0 0 22px rgba(79,203,98,.75),inset 0 -4px 0 rgba(0,0,0,.18)}
body.ep-app .answers .ans.right .key{background:#fff;color:#1D7F33}
body.ep-app .answers .ans.wrong{background:linear-gradient(140deg,#FF6B6B,#B51B1B)!important;outline:3px solid rgba(255,255,255,.7)}
body.ep-app .answers.hd-fertig .ans:not(.right):not(.wrong){background:#E9E6F5!important;color:#8B86A8!important;box-shadow:none;opacity:.9}
body.ep-app .answers.hd-fertig .ans:not(.right):not(.wrong) .key{background:#fff;color:#8B86A8}
body.ep-app .hlf-joker{display:grid;grid-template-columns:1fr 1fr;gap:10px}
body.ep-app .hlf-joker .hlf-j{min-height:48px;border:0;border-radius:16px;color:#fff;font:600 14px "Lexend",system-ui,sans-serif;box-shadow:0 4px 0 rgba(0,0,0,.25),inset 0 2px 0 rgba(255,255,255,.25)}
body.ep-app .hlf-joker .hlf-j:nth-child(1){background:linear-gradient(140deg,#9070FF,#4A2FC0)}
body.ep-app .hlf-joker .hlf-j:nth-child(2){background:linear-gradient(180deg,#FFD85E,#FFB21E);color:#2A1D5C}
body.ep-app .hlf-joker .hlf-j .hlf-n{background:rgba(0,0,0,.22);color:#fff;border-radius:9px;padding:1px 7px}
/* Antwort-Blatt */
body.ep-app .feedback.pop{position:relative;overflow:hidden;margin:12px -4px 0;padding:18px 16px 16px;border-radius:28px;color:#fff;box-shadow:0 14px 30px -12px rgba(0,0,0,.6),inset 0 2px 0 rgba(255,255,255,.35)}
body.ep-app .feedback.pop.hd-ok{background:linear-gradient(170deg,#4FCB62 0%,#2CA343 45%,#1D7F33 100%)}
body.ep-app .feedback.pop.hd-nein{background:linear-gradient(170deg,#FF7A7A 0%,#E0393E 45%,#A71B20 100%)}
body.ep-app .feedback.pop>p{margin:0 0 14px;min-height:60px;font:800 24px "Bricolage Grotesque","Fredoka",system-ui,sans-serif;text-shadow:0 1px 2px rgba(0,0,0,.3);display:flex;align-items:center;gap:8px;padding-right:96px}
body.ep-app .feedback.pop .hd-kid{position:absolute;right:2px;top:2px;height:76px;width:auto;pointer-events:none}
body.ep-app .feedback.pop .row{display:grid;grid-template-columns:1fr 1fr;gap:10px;position:relative}
body.ep-app .feedback.pop .row .big{min-height:52px;border-radius:26px;font:700 16px "Lexend",system-ui,sans-serif;box-shadow:none}
body.ep-app .feedback.pop .row .big.alt{background:rgba(0,0,0,.2);color:#fff;border:2px solid rgba(255,255,255,.6)}
body.ep-app .feedback.pop .row .big:not(.alt){background:linear-gradient(180deg,#FFD85E,#FFB21E);color:#2A1D5C;box-shadow:0 5px 0 #D2860A}
body.ep-app .feedback.pop .row .big:only-child{grid-column:1/-1}
`;
document.head.appendChild(css);

/* ---------- Start: Tagesziel in der Hero-Karte ---------- */
function start(){
  if(!app()) return;
  const held = $("#app .ap-heute .hs-start .apht"); if(!held || held.querySelector(".hd-tag")) return;
  let n = 0; const lbl = $("#app .ap-heute .ap-kopf .aplbl"); const m = lbl && /(\d+)\s*von\s*(\d+)/.exec(lbl.textContent); if(m) n = Math.min(3, +m[1]);
  const t = document.createElement("span"); t.className = "hd-tag";
  t.innerHTML = `<b>Dein Tag: ${n} von 3 Quiz</b><i class="hd-bars" aria-hidden="true">${[0,1,2].map(i => `<s${i < n ? ' class="an"' : ""}></s>`).join("")}</i>`;
  const z = held.querySelector(".apzahlen"); if(z) z.after(t); else held.querySelector("h1")?.after(t);
  const b = held.querySelector(".ap-weissbtn");
  if(b){ if(n >= 3) b.innerHTML = PLAY + " Noch eins!"; else if(n > 0) b.innerHTML = PLAY + " Weiterspielen"; if(n > 0) b.dataset.x = "zufall"; }
}

/* ---------- Themen: Bereich-Blatt ---------- */
function blattZu(){ const s = $(".hd-sheet"); if(s) s.remove(); document.removeEventListener("keydown", escZu); }
function escZu(e){ if(e.key === "Escape") blattZu(); }
function blattAuf(apb){
  blattZu();
  const kopf = apb.querySelector(".apb-kopf"), name = kopf.querySelector("b")?.textContent || "", text = kopf.querySelector("small")?.textContent || "";
  const zahl = kopf.querySelector(".apn")?.textContent || "";
  const em = kopf.querySelector(".apem")?.innerHTML || "";
  const chips = $$(".apb-liste > *", apb), alle = apb.querySelector(".apb-alle");
  const cs = getComputedStyle(apb).getPropertyValue("--c").trim() || "#109C86";
  const s = document.createElement("div"); s.className = "hd-sheet"; s.setAttribute("role", "dialog"); s.setAttribute("aria-modal", "true"); s.setAttribute("aria-label", name);
  s.style.setProperty("--c", cs); s.style.setProperty("--c2", `color-mix(in srgb, ${cs} 70%, #fff)`); s.style.setProperty("--c3", `color-mix(in srgb, ${cs} 70%, #000)`);
  s.innerHTML = `<div class="hd-blatt"><div class="hd-griff" aria-hidden="true"></div>
    <div class="hd-kopf"><span class="hd-ico" aria-hidden="true">${em}</span><div><h2>${h(name)}</h2><p>${h(zahl || text)}</p></div><button type="button" class="hd-zu" aria-label="Schliessen">✕</button></div>
    <div class="hd-themen">${chips.map((c, i) => `<button type="button" class="hd-thema${c.classList.contains("leer") ? " leer" : ""}" data-i="${i}"><span class="hd-ti" aria-hidden="true">${c.querySelector(".apci")?.innerHTML || ""}</span><b>${h(c.querySelector(".apcn")?.textContent || c.textContent)}</b>${c.querySelector("small") ? `<small>${h(c.querySelector("small").textContent)}</small>` : ""}</button>`).join("")}</div>
    ${alle ? `<button type="button" class="hd-alle">${PLAY} ${h(alle.textContent.trim().replace(/\s+/g, " "))}</button>` : ""}</div>`;
  s.addEventListener("click", e => { if(e.target === s) blattZu(); });
  s.querySelector(".hd-zu").onclick = blattZu;
  $$(".hd-thema", s).forEach(b => b.onclick = () => { const c = chips[+b.dataset.i]; blattZu(); c && c.click(); });
  const a = s.querySelector(".hd-alle"); if(a) a.onclick = () => { blattZu(); alle.click(); };
  document.body.appendChild(s); document.addEventListener("keydown", escZu);
  try{ window.EP_SOUND && EP_SOUND.play("klick"); }catch(e){}
}
document.addEventListener("click", e => {
  if(!app()) return; const k = e.target.closest && e.target.closest("#app .ap-themen .apb-kopf"); if(!k) return;
  const apb = k.closest(".apb"); if(!apb || !apb.querySelector(".apb-liste")) return;
  e.preventDefault(); e.stopImmediatePropagation(); blattAuf(apb);
}, true);

/* ---------- Profil: vier Reiter ---------- */
let ptab = "ueber";
function profil(){
  if(!app()) return;
  const ap = $("#app .ap-profil"); if(!ap || ap.querySelector(".hd-ptabs")) return;
  const stats = ap.querySelector(".ap-stats"), liste = ap.querySelector(".ap-liste"); if(!stats || !liste) return;
  const tabs = document.createElement("div"); tabs.className = "hd-ptabs"; tabs.setAttribute("role", "tablist"); tabs.setAttribute("aria-label", "Profil-Bereiche");
  const T = [["ueber", "Übersicht"], ["album", "Album"], ["erfolge", "Erfolge"], ["einst", "Mehr"]];
  tabs.innerHTML = T.map(([id, n]) => `<button type="button" role="tab" data-t="${id}" aria-selected="${ptab === id}">${n}</button>`).join("");
  stats.after(tabs);
  /* Übersicht: Garderobe-Karte */
  const hatGarde = (() => { try{ return (window.EP_EXTRAS.liste() || []).some(w => w.id === "garderobe"); }catch(e){ return false; } })();
  if(hatGarde){ const g = document.createElement("button"); g.type = "button"; g.className = "hd-garde"; g.dataset.hdp = "ueber";
    g.innerHTML = `<span class="hd-gt"><b>Garderobe</b><small>Schmück dein Profilbild mit Mützen, Brillen und mehr</small></span><img src="${KIDS}liegen.webp" alt="">`;
    g.onclick = () => { try{ window.EP_EXTRAS.oeffne("garderobe"); }catch(e){} }; tabs.after(g); }
  /* Erfolge */
  const ef = document.createElement("div"); ef.className = "hd-erfolge"; ef.dataset.hdp = "erfolge";
  let abz = []; try{ abz = window.EP_LERNEN.abzeichen() || []; }catch(e){}
  if(abz.length) ef.innerHTML = abz.slice().sort((a, b) => (b.hat ? 1 : 0) - (a.hat ? 1 : 0)).map(a => `<div class="hd-abz${a.hat ? "" : " aus"}" title="${h(a.text)}"><i>${a.emo}</i><b>${h(a.name)}</b></div>`).join("");
  else { ef.className = "hd-leer"; ef.textContent = "Spiel ein paar Runden, dann sammelst du hier deine Abzeichen."; }
  tabs.after(ef);
  /* Zuordnung */
  ap.querySelector(".ap-konto")?.setAttribute("data-hdp", "ueber"); stats.setAttribute("data-hdp", "ueber");
  liste.setAttribute("data-hdp", "einst"); ap.querySelector(".ep-ver")?.setAttribute("data-hdp", "einst");
  const zeig = () => { $$("[data-hdp]", ap).forEach(el => el.hidden = el.dataset.hdp !== ptab); $$("button", tabs).forEach(b => b.setAttribute("aria-selected", String(b.dataset.t === ptab)));
    try{ window.EP_MOBILPAGER && EP_MOBILPAGER.neu && EP_MOBILPAGER.neu(); }catch(e){} };
  $$("button", tabs).forEach(b => b.onclick = () => { const t = b.dataset.t;
    if(t === "album"){ try{ window.EP_EXTRAS.oeffne("album"); }catch(e){} return; }
    ptab = t; zeig(); try{ window.EP_SOUND && EP_SOUND.play("klick"); }catch(e){} });
  zeig();
}

/* ---------- Quiz: Antwort-Blatt ---------- */
function quiz(){
  if(!app()) return;
  const fb = $("#app .feedback.pop"); if(!fb || fb.dataset.hd) return; fb.dataset.hd = "1";
  const ok = !!$("#app .answers .ans.right") && !$("#app .answers .ans.wrong");
  fb.classList.add(ok ? "hd-ok" : "hd-nein");
  const an = $("#app .answers"); if(an) an.classList.add("hd-fertig");
  const p = fb.querySelector("p"); if(p && !fb.querySelector(".hd-kid")){ const img = document.createElement("img"); img.className = "hd-kid"; img.alt = ""; img.src = KIDS + (ok ? "duo-jubel.webp" : "lb-denken.webp"); fb.appendChild(img); }
}

/* ---------- Anstossen: nach jedem Rendern und bei App-Umbauten ---------- */
function alles(){ try{ start(); }catch(e){} try{ profil(); }catch(e){} try{ quiz(); }catch(e){} }
if(typeof window.render === "function"){ const vor = window.render; window.render = function(){ const r = vor.apply(this, arguments); setTimeout(alles, 0); setTimeout(alles, 80); return r; }; }
let plan = 0;
const mo = new MutationObserver(() => { if(plan) return; plan = setTimeout(() => { plan = 0; alles(); }, 30); });
function beobachten(){ const a = document.getElementById("app"); if(a) mo.observe(a, {childList:true, subtree:true}); alles(); }
if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", beobachten); else beobachten();
window.EP_HANDY = { start, profil, quiz, blattZu };
})();
