/* easyplay · vorlage.js
   Handy-Ansicht genau nach der Vorlage (Design-Seite Nr. 6 bis 12): Start, Themen, Bereich, Duell, Profil, Quiz, Antwort.
   Die Original-Bildschirme bleiben unsichtbar im DOM und liefern Daten und Aktionen; sichtbar ist nur die Vorlage.
   Der Hintergrund (Himmel, Berge) bleibt wie in der App. Greift nur auf dem Handy (body.ep-app, Gerät schmaler als 700 px). */
(function(){
"use strict";
const app = () => document.body.classList.contains("ep-app");
const handy = () => app() && Math.min(innerWidth, (screen && screen.width) || innerWidth) < 700;
const $ = (s, w) => (w || document).querySelector(s);
const $$ = (s, w) => [...(w || document).querySelectorAll(s)];
const h = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const KIDS = "img/kids/";
const tx = el => el ? el.textContent.replace(/\s+/g, " ").trim() : "";
const klick = el => { if(el){ try{ el.click(); }catch(e){} } };
const emoVon = k => { try{ if(typeof EMO !== "undefined" && EMO[k]) return `<span class="emo">${EMO[k]}</span>`; }catch(e){} try{ return ico(k); }catch(e){ return ""; } };
const sterneVon = id => { try{ const t = (EP_LERNEN.elternDaten().th || []).find(x => x[0] === id); if(!t || t[2] < 5) return null; return Math.max(0, Math.min(5, Math.round(t[1] / t[2] * 5))); }catch(e){ return null; } };

/* ---------- Icons aus der Vorlage ---------- */
const SVG = {
  play:'<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4l13 8-13 8z"></path></svg>',
  wuerfel:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4"></rect><circle cx="9" cy="9" r="1.3" fill="#FFFFFF"></circle><circle cx="15" cy="15" r="1.3" fill="#FFFFFF"></circle><circle cx="15" cy="9" r="1.3" fill="#FFFFFF"></circle><circle cx="9" cy="15" r="1.3" fill="#FFFFFF"></circle></svg>',
  buch:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M4 19V5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2 2 2 0 0 0 2 2h14"></path></svg>',
  stern:'<svg width="22" height="22" viewBox="0 0 24 24" fill="#FFFFFF" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"></path></svg>',
  pfeil:'<svg style="position: relative" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"></path></svg>',
  pfeilk:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"></path></svg>',
  suche:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.5-3.5"></path></svg>',
  zu:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg>',
  blitz:'<svg width="22" height="22" viewBox="0 0 24 24" fill="#2A1D5C" aria-hidden="true"><path d="M13 2L4 14h7l-1 8 9-12h-7z"></path></svg>',
  blitzk:'<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13 2L4 14h7l-1 8 9-12h-7z"></path></svg>',
  funk:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="2.2" fill="#FFFFFF"></circle><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14"></path></svg>',
  ton:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"></path><path d="M16.5 8.5a5 5 0 0 1 0 7"></path></svg>',
  haken:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>',
  kreuz:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg>',
  weiter:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"></path></svg>',
  tStart:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"></path></svg>',
  tThemen:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="7" height="7" rx="2"></rect><rect x="13" y="4" width="7" height="7" rx="2"></rect><rect x="4" y="13" width="7" height="7" rx="2"></rect><rect x="13" y="13" width="7" height="7" rx="2"></rect></svg>',
  tDuell:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M13 2L4 14h7l-1 8 9-12h-7z"></path></svg>',
  tQeels:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"></rect><path d="M10 8l6 4-6 4z"></path></svg>'
};
const FARBE = { welt:"g-blau", natur:"g-teal", schweiz:"g-pink", leben:"g-pink", alltag:"g-ora" };
const BLATT = { "g-blau":"#5A8BFF 0%,#2F63EC 40%,#1D45BF 100%", "g-teal":"#25C9AB 0%,#109C86 40%,#0A7766 100%", "g-pink":"#FF5C9E 0%,#E2307A 40%,#B5175A 100%", "g-ora":"#FF9B3D 0%,#EF7418 40%,#C3540A 100%", "g-vio":"#9070FF 0%,#6446E6 40%,#4A2FC0 100%" };

/* ---------- Stil: 1:1 aus der Vorlage, nur unter .vl ---------- */
const css = document.createElement("style"); css.id = "ep-vorlage-css";
css.textContent = `
body.vl-an .vl{position:relative;color:#FFFFFF;font-family:'Lexend',system-ui,sans-serif;-webkit-font-smoothing:antialiased;text-align:left}
.vl *{box-sizing:border-box}
.vl a,.vl button{color:inherit;font-family:inherit;-webkit-tap-highlight-color:transparent;cursor:pointer}
.vl button{border:0;margin:0}
.vl .vl-in{padding:calc(env(safe-area-inset-top) + 12px) 16px 0;display:flex;flex-direction:column;gap:12px;transform-origin:top left}
.vl .k{position:relative;display:block;border-radius:26px;color:#FFFFFF;text-decoration:none;text-align:left;box-shadow:0 14px 26px -12px rgba(0,0,0,.6),inset 0 -5px 0 rgba(0,0,0,.18),inset 0 2px 0 rgba(255,255,255,.28)}
.vl .clip{position:absolute;inset:0;border-radius:inherit;overflow:hidden;pointer-events:none}
.vl .blase{position:absolute;border-radius:50%;background:rgba(255,255,255,.13)}
.vl .g-vio{background:linear-gradient(140deg,#9070FF 0%,#6446E6 50%,#4A2FC0 100%)}
.vl .g-pink{background:linear-gradient(140deg,#FF5C9E 0%,#E2307A 50%,#B5175A 100%)}
.vl .g-teal{background:linear-gradient(140deg,#25C9AB 0%,#109C86 50%,#0A7766 100%)}
.vl .g-ora{background:linear-gradient(140deg,#FF9B3D 0%,#EF7418 50%,#C3540A 100%)}
.vl .g-blau{background:linear-gradient(140deg,#5A8BFF 0%,#2F63EC 50%,#1D45BF 100%)}
.vl .g-gruen{background:linear-gradient(140deg,#4FCB62 0%,#2CA343 50%,#1D7F33 100%)}
.vl .ts{text-shadow:0 1px 2px rgba(0,0,0,.3)}
.vl .h{font-family:'Bricolage Grotesque','Fredoka',system-ui,sans-serif;font-weight:800}
.vl .emo{font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif}
.vl .ico{width:44px;height:44px;border-radius:15px;background:rgba(255,255,255,.22);display:flex;align-items:center;justify-content:center;box-shadow:inset 0 1px 0 rgba(255,255,255,.35);position:relative}
.vl .gold{display:flex;align-items:center;justify-content:center;gap:8px;border-radius:999px;background:linear-gradient(180deg,#FFD85E,#FFB21E);color:#2A1D5C;font-weight:600;text-decoration:none;box-shadow:0 5px 0 #D2860A,0 12px 20px -8px rgba(255,178,30,.7)}
.vl .weiss{display:flex;align-items:center;justify-content:center;gap:8px;border-radius:999px;background:#FFFFFF;font-weight:600;text-decoration:none;box-shadow:0 5px 0 rgba(0,0,0,.2)}
.vl .rund{width:40px;height:40px;border-radius:20px;border:0;background:rgba(255,255,255,.14);color:#FFFFFF;display:flex;align-items:center;justify-content:center;padding:0;flex:none}
.vl .wico{width:58px;height:58px;border-radius:18px;background:#FFFFFF;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 12px -4px rgba(0,0,0,.35)}
.vl .wico svg,.vl .wico img{width:34px;height:34px}
.vl .zahl{font-size:12px;font-weight:600;padding:4px 9px;border-radius:10px;background:rgba(0,0,0,.22)}
.vl .stufe{height:52px;border:0;border-radius:16px;background:transparent;color:#FFFFFF;font-family:'Lexend',sans-serif;font-weight:600;font-size:15px;line-height:1.1}
.vl .kachel{height:124px;padding:12px;display:flex;flex-direction:column;justify-content:space-between}
.vl .stat{height:68px;border-radius:20px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px}
.vl .reiter{height:44px;border:0;border-radius:15px;background:transparent;color:#D7D2FF;font-family:'Lexend',sans-serif;font-weight:500;font-size:13px}
.vl .reiter-an{height:44px;border:0;border-radius:15px;background:linear-gradient(140deg,#FF5C9E,#D92472);color:#FFFFFF;font-family:'Lexend',sans-serif;font-weight:600;font-size:13px;box-shadow:0 6px 14px -4px rgba(226,48,122,.7)}
.vl .zeile{display:flex;align-items:center;gap:12px;height:56px;padding:0 14px;border-radius:18px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.1);color:#FFFFFF;text-decoration:none;width:100%;text-align:left}
.vl .zeile .ic,.vl .zeile svg:first-child{width:20px;height:20px}
.vl .antw{display:flex;align-items:center;gap:14px;min-height:62px;padding:8px 14px;border-radius:22px;color:#FFFFFF;text-decoration:none;font-weight:600;font-size:17px;text-align:left;width:100%;box-shadow:0 6px 0 rgba(0,0,0,.22),0 12px 20px -10px rgba(0,0,0,.6),inset 0 2px 0 rgba(255,255,255,.3)}
.vl .antw:active{transform:translateY(3px);box-shadow:0 3px 0 rgba(0,0,0,.22)}
.vl .antw.weg{opacity:.28;filter:grayscale(1);pointer-events:none}
.vl .bst{width:36px;height:36px;border-radius:18px;background:#FFFFFF;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;flex-shrink:0}
.vl .hilfe{height:50px;border-radius:18px;border:0;color:#FFFFFF;font-family:'Lexend',sans-serif;font-size:14px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:6px;position:relative;box-shadow:0 4px 0 rgba(0,0,0,.25),inset 0 2px 0 rgba(255,255,255,.25)}
.vl .hilfe[disabled]{opacity:.45}
.vl .hilfe .n{position:absolute;right:6px;top:5px;min-width:18px;height:18px;border-radius:9px;background:rgba(0,0,0,.25);font-size:11px;display:grid;place-items:center}
.vl .vl-seg{flex:1;height:10px;border-radius:5px}
.vl .aus{display:flex;align-items:center;gap:14px;min-height:56px;padding:8px 14px;border-radius:20px;background:rgba(255,255,255,.08);color:rgba(255,255,255,.55);font-weight:500;font-size:16px}
.vl .aus .bst{width:32px;height:32px;border-radius:16px;background:rgba(255,255,255,.14);font-weight:700;font-size:15px}
.vl .konf{position:absolute;width:8px;height:14px;border-radius:3px;pointer-events:none}
.vl .vl-thema{position:relative;height:96px;border-radius:22px;padding:12px;display:flex;flex-direction:column;justify-content:space-between;color:#FFFFFF;text-decoration:none;text-align:left;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.22);box-shadow:inset 0 -4px 0 rgba(0,0,0,.12)}
.vl .vl-thema .ic,.vl .vl-thema svg,.vl .vl-thema img{width:28px;height:28px}
.vl .sterne{display:flex;gap:2px;font-size:13px;color:#FFD85E}
.vl .ava2 > *{width:88px!important;height:88px!important;border-radius:0!important}
/* Sichtbarkeit: Original ausblenden, Vorlage zeigen */
body.vl-an #app > :not(.vl):not(.ap){display:none!important}
body.vl-an #app > .ap > :not(.vl):not(.xs-knopf):not(.xui-knopf){display:none!important}
body.vl-an #app > .ap{padding:0!important;margin:0!important;height:auto!important;min-height:0!important;display:block!important;overflow:visible!important;background:none!important}
body.vl-quiz #app > :not(.vl){display:none!important}
body.vl-an .wrap,body.vl-quiz .wrap{padding-left:0!important;padding-right:0!important;padding-top:0!important;max-width:none!important}
body.vl-an .eplegal,body.vl-quiz .eplegal{display:none!important}
body.vl-quiz #mond,body.vl-quiz #sonne{display:none!important}
/* Knöpfe Ton und Sprache in der Kapsel der Vorlage */
body.vl-an .ap-heute > .xs-knopf,body.vl-an .ap-heute > .xui-knopf{position:absolute!important;width:40px!important;height:40px!important;border-radius:20px!important;border:0!important;background:rgba(255,255,255,.14)!important;box-shadow:none!important;padding:0!important;transform:none!important;visibility:visible!important;z-index:6;display:flex!important;align-items:center;justify-content:center;color:#FFFFFF!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}
body.vl-an .ap-heute > .xui-knopf > *{display:none!important}
body.vl-an .ap-heute > .xui-knopf::before{content:"🇩🇪";font:20px/1 "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif}
body.vl-an .ap-heute > .xui-knopf[data-l="fr"]::before{content:"🇫🇷"}
body.vl-an .ap-heute > .xui-knopf[data-l="it"]::before{content:"🇮🇹"}
body.vl-an .ap-heute > .xs-knopf .xs-eqk{display:none}
/* Tableiste wie in der Vorlage */
html body.vl-an #epTabs{left:12px!important;right:12px!important;bottom:calc(14px + env(safe-area-inset-bottom))!important;width:auto!important;height:70px!important;border-radius:26px!important;background:rgba(13,9,48,.95)!important;border:1px solid rgba(255,255,255,.08)!important;box-shadow:0 10px 30px rgba(0,0,0,.5)!important;display:flex!important;justify-content:space-around!important;align-items:center!important;padding:0 6px!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;transform:none!important}
html body.vl-an #epTabs button{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:3px!important;width:64px!important;height:56px!important;min-width:0!important;border-radius:18px!important;color:#A9A3E6!important;font:500 11.5px 'Lexend',system-ui,sans-serif!important;background:transparent!important;box-shadow:none!important;padding:0!important;margin:0!important}
html body.vl-an #epTabs button[aria-current="page"]{background:linear-gradient(140deg,#FF5C9E,#D92472)!important;color:#FFFFFF!important;font-weight:600!important;box-shadow:0 6px 14px -4px rgba(226,48,122,.7)!important}
html body.vl-an #epTabs button svg{width:22px!important;height:22px!important}
html body.vl-an #epTabs .tabav{width:26px!important;height:26px!important;border-radius:13px!important;overflow:hidden;background:#FFC23D;border:2px solid #FFFFFF;box-sizing:border-box;display:block}
html body.vl-an #epTabs .tabav img{width:22px!important;height:32px!important;object-fit:cover;object-position:30% 0}
/* Bereich-Blatt */
.vl-blatt,body.vl-an .vl.vl-blatt{position:fixed!important;inset:0;z-index:90;font-family:'Lexend',system-ui,sans-serif;color:#FFFFFF}
.vl-blatt .vl-dim{position:absolute;inset:0;background:rgba(8,5,30,.7);border:0;padding:0;width:100%;height:100%}
.vl-blatt .vl-schau{position:absolute;right:8px;width:auto;height:150px;pointer-events:none}
.vl-blatt section{position:absolute;left:0;right:0;bottom:0;border-radius:34px 34px 0 0;box-shadow:0 -10px 40px rgba(0,0,0,.5),inset 0 2px 0 rgba(255,255,255,.3);padding:10px 16px calc(30px + env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:14px;overflow:hidden;animation:vlHoch .32s cubic-bezier(.2,.9,.3,1.1) both}
.vl-blatt .vl-gitter{position:relative;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;overflow-y:auto;min-height:0;flex:1 1 auto;align-content:start;padding-bottom:4px}
@keyframes vlHoch{from{transform:translateY(80px);opacity:.5}to{transform:none;opacity:1}}
/* Antwort-Blatt */
.vl .vl-ant{position:fixed;left:0;right:0;bottom:0;z-index:80;border-radius:34px 34px 0 0;box-shadow:0 -10px 40px rgba(0,0,0,.45),inset 0 2px 0 rgba(255,255,255,.35);padding:22px 16px calc(30px + env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:10px;animation:vlHoch .3s cubic-bezier(.2,.9,.3,1.1) both}
.vl .vl-ant.ok{background:linear-gradient(170deg,#4FCB62 0%,#2CA343 45%,#1D7F33 100%)}
.vl .vl-ant.nein{background:linear-gradient(170deg,#FF7A7A 0%,#E0393E 45%,#A71B20 100%)}
.vl .vl-pill{height:40px;padding:0 14px;border-radius:20px;border:0;background:rgba(0,0,0,.2);color:#FFFFFF;font-family:'Lexend',sans-serif;font-size:14px;font-weight:500;display:flex;align-items:center;gap:6px}
.vl .vl-tipp{display:flex;align-items:center;gap:10px;padding:8px 12px 8px 8px;border-radius:18px;background:linear-gradient(135deg,#3D7BFF,#2A4FD6);font-size:14px;line-height:1.35}
.vl .vl-tipp img{width:40px;height:40px;object-fit:contain;flex:none}
:root[data-theme="light"] .vl .vl-hell{text-shadow:0 1px 3px rgba(27,34,64,.55)}
`;
document.head.appendChild(css);

/* ---------- Hilfen ---------- */
let zuletzt = "";
function wurzel(host, key, html){
  let v = host.querySelector(":scope > .vl");
  if(v && v.dataset.key === key) return v;
  if(!v){ v = document.createElement("div"); v.className = "vl"; host.prepend(v); }
  v.dataset.key = key; v.innerHTML = `<div class="vl-in">${html}</div>`;
  return v;
}
function einpassen(v, unten){
  const inn = v.querySelector(".vl-in"); if(!inn) return;
  inn.style.zoom = ""; const frei = innerHeight - unten; const hoch = inn.scrollHeight;
  if(hoch > frei && frei > 200) inn.style.zoom = String(Math.max(.72, frei / hoch));
}
const tabsHoehe = () => { const t = document.getElementById("epTabs"); return t && getComputedStyle(t).display !== "none" ? (innerHeight - t.getBoundingClientRect().top + 8) : 0; };

/* ---------- Tableiste ---------- */
function tableiste(){
  const t = document.getElementById("epTabs"); if(!t) return;
  const I = {heute:SVG.tStart, themen:SVG.tThemen, duell:SVG.tDuell, qeels:SVG.tQeels};
  const N = {heute:"Start", themen:"Themen", duell:"Duell", qeels:"Qeels", profil:"Profil"};
  $$("button[data-tab]", t).forEach(b => { const id = b.dataset.tab; if(b.dataset.vl === id) return;
    if(id === "profil"){ const av = b.querySelector(".tabav"); b.innerHTML = (av ? av.outerHTML : "") + `<span>${N[id]}</span>`; }
    else if(I[id]) b.innerHTML = I[id] + `<span>${N[id] || tx(b)}</span>`;
    b.dataset.vl = id; });
}

/* ======================= 6 · Start ======================= */
function start(){
  const ap = $("#app > .ap.ap-heute"); if(!ap) return false;
  const name = (S.profil && S.profil.name) || "";
  let serie = 0; try{ serie = EP_START.serie().n || 0; }catch(e){}
  let tag = 0; const lb = $(".ap-kopf .aplbl", ap); const m = lb && /(\d+)\s*von\s*(\d+)/.exec(lb.textContent); if(m) tag = Math.min(3, +m[1]);
  let lv = null; try{ lv = EP_LEVEL.stand(); }catch(e){}
  const xa = $(".x-app", ap); const welten = (xa && (/(\d+)\s*Welten/.exec(xa.textContent) || [])[1]) || "";
  const emos = xa ? $$(".x-a-emo i", xa).map(i => i.textContent).join("") : "";
  const wo = $(".ap-woche", ap); let woName = "", woBar = 0, woText = "", woEmo = "🤝";
  try{ const w = EP_START.woche(); if(w && w.thema){ woName = w.thema.name; woEmo = (typeof EMO !== "undefined" && EMO[w.thema.emo]) || woEmo; } }catch(e){}
  if(wo){ const i = $(".apbar i", wo); woBar = i ? parseFloat(i.style.width) || 0 : 0; woText = tx($(".apz", wo)); }
  const btnTxt = tag >= 3 ? "Noch eins!" : tag > 0 ? "Weiterspielen" : "Los geht's";
  const key = ["s", name, serie, tag, lv && lv.level, welten, woName, woBar, woText].join("|");
  const v = wurzel(ap, key, `
<div style="display: flex; align-items: center; justify-content: space-between; height: 44px">
<img src="img/logo.webp" alt="easyplay" style="height: 34px; width: auto">
<div class="vl-kapsel" style="display: flex; align-items: center; gap: 4px; padding: 3px; border-radius: 24px; background: rgba(255,255,255,.1)">
<div style="display: flex; align-items: center; gap: 4px; height: 40px; padding: 0 10px; border-radius: 20px; background: rgba(255,255,255,.14); font-weight: 600; font-size: 14px"><span class="emo">🔥</span>${serie}</div>
<span class="vl-slot" data-s="xui" style="width: 40px; height: 40px; flex: none"></span>
<span class="vl-slot" data-s="xs" style="width: 40px; height: 40px; flex: none"></span>
</div>
</div>
<div class="vl-hell">
<h1 class="h" style="margin: 0; font-size: 32px; line-height: 1.05">Hoi${name ? " " + h(name) : ""}!</h1>
<p style="margin: 4px 0 0; font-size: 15px; color: #D7D2FF">Schön, dass du da bist.</p>
</div>
<div class="k g-pink" style="height: 218px; margin-top: 4px">
<div class="clip"><div class="blase" style="width: 220px; height: 220px; right: -60px; top: -80px"></div><div class="blase" style="width: 120px; height: 120px; left: -40px; bottom: -50px"></div></div>
<img src="${KIDS}duo-jubel.webp" alt="Lumi und Milo jubeln" style="position: absolute; right: -6px; bottom: 0; height: 262px; width: auto; pointer-events: none">
<div style="position: relative; padding: 18px; width: 206px; height: 218px; display: flex; flex-direction: column; gap: 8px">
<span class="h ts" style="font-size: 29px; line-height: 1">Spiel dich schlau!</span>
<span class="ts" style="font-size: 14px; color: #FFF0F6">Dein Tag: ${tag} von 3 Quiz</span>
<div style="display: flex; gap: 5px; width: 150px">${[0,1,2].map(i => i < tag ? '<div style="flex: 1; height: 9px; border-radius: 5px; background: #FFD85E; box-shadow: 0 0 8px rgba(255,216,94,.8)"></div>' : '<div style="flex: 1; height: 9px; border-radius: 5px; background: rgba(255,255,255,.35)"></div>').join("")}</div>
<button type="button" class="weiss" data-vl="held" style="margin-top: auto; height: 52px; width: 176px; color: #D92472; font-size: 17px">${SVG.play}${btnTxt}</button>
</div>
</div>
<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px">
<button type="button" class="k g-vio" data-vl="zufall" style="height: 108px; padding: 12px; display: flex; flex-direction: column; justify-content: space-between">
<div class="clip"><div class="blase" style="width: 80px; height: 80px; right: -26px; top: -26px"></div></div>
<div class="ico" style="width: 38px; height: 38px; border-radius: 13px">${SVG.wuerfel}</div>
<span class="ts" style="position: relative; font-weight: 600; font-size: 15px; line-height: 1.15">Zufällige Fragen</span>
</button>
<button type="button" class="k g-ora" data-vl="lib" style="height: 108px; padding: 12px; display: flex; flex-direction: column; justify-content: space-between">
<div class="clip"><div class="blase" style="width: 80px; height: 80px; right: -26px; top: -26px"></div></div>
<div class="ico" style="width: 38px; height: 38px; border-radius: 13px">${SVG.buch}</div>
<span class="ts" style="position: relative; font-weight: 600; font-size: 15px; line-height: 1.15">Bibliothek</span>
</button>
<button type="button" class="k g-teal" data-vl="level" style="height: 108px; padding: 12px; display: flex; flex-direction: column; justify-content: space-between">
<div class="clip"><div class="blase" style="width: 80px; height: 80px; right: -26px; top: -26px"></div></div>
<div class="ico" style="width: 38px; height: 38px; border-radius: 13px">${SVG.stern}</div>
<span class="ts" style="position: relative; font-weight: 600; font-size: 15px; line-height: 1.15">Level ${lv ? lv.level : 1}<br><span style="font-weight: 400; font-size: 12px">${h(lv && lv.titel ? lv.titel.name : "Neuling")}</span></span>
</button>
</div>
<button type="button" class="k g-vio" data-vl="entdecken" style="height: 104px; display: block; width: 100%">
<div class="clip"><div class="blase" style="width: 160px; height: 160px; right: 40px; top: -70px"></div></div>
<img src="${KIDS}duo-winken.webp" alt="" style="position: absolute; right: 6px; bottom: 0; height: 132px; width: auto; pointer-events: none">
<div style="position: relative; padding: 14px 16px; display: flex; flex-direction: column; gap: 6px; align-items: flex-start">
${welten ? `<span style="font-size: 12px; font-weight: 600; padding: 3px 9px; border-radius: 10px; background: #FFD85E; color: #2A1D5C">${welten} Welten</span>` : ""}
<span class="h ts" style="font-size: 26px; line-height: 1">Entdecken</span>
<span class="emo" style="font-size: 17px; letter-spacing: 3px">${h(emos)}</span>
</div>
</button>
${wo ? `<button type="button" class="k g-teal" data-vl="woche" style="height: 84px; padding: 12px 16px; display: flex; align-items: center; gap: 12px; width: 100%">
<div class="clip"><div class="blase" style="width: 120px; height: 120px; right: -30px; bottom: -60px"></div></div>
<div class="ico"><span class="emo" style="font-size: 24px">${woEmo}</span></div>
<div style="position: relative; flex: 1; display: flex; flex-direction: column; gap: 5px; min-width: 0">
<span class="ts" style="font-size: 12px; font-weight: 600; letter-spacing: .06em">THEMA DER WOCHE${woName ? " · " + h(woName.toUpperCase()) : ""}</span>
<div style="height: 9px; border-radius: 5px; background: rgba(0,0,0,.2)"><div style="width: ${woBar}%; height: 9px; border-radius: 5px; background: #FFD85E"></div></div>
<span class="ts" style="font-size: 12px">${h(woText)}</span>
</div>
${SVG.pfeil}
</button>` : ""}`);
  if(!v.dataset.bound){ v.dataset.bound = "1";
    v.addEventListener("click", e => { const b = e.target.closest("[data-vl]"); if(!b) return;
      const a = b.dataset.vl;
      if(a === "held") klick($(".hs-start .ap-weissbtn", ap) || $('[data-x="themen"]', ap));
      else if(a === "zufall") klick($('.ap-tag [data-x="zufall"]', ap));
      else if(a === "lib") klick($('.ap-tag [data-x="lib"]', ap));
      else if(a === "level") klick($('.ap-tag [data-x="profil"]', ap));
      else if(a === "entdecken") klick($(".x-app", ap));
      else if(a === "woche") klick($(".ap-woche", ap));
    }); }
  /* Ton- und Sprachknopf genau in die Kapsel setzen */
  einpassen(v, tabsHoehe());
  [["xui", ".xui-knopf"], ["xs", ".xs-knopf"]].forEach(([s, sel]) => {
    const slot = $(`.vl-slot[data-s="${s}"]`, v), k = ap.querySelector(":scope > " + sel); if(!slot || !k) return;
    const r = slot.getBoundingClientRect(), op = k.offsetParent || document.body, o = op.getBoundingClientRect(); if(!r.width) return;
    k.style.setProperty("left", Math.round(r.left - o.left - (op.clientLeft || 0) + (op === document.body ? scrollX : op.scrollLeft)) + "px", "important");
    k.style.setProperty("top", Math.round(r.top - o.top - (op.clientTop || 0) + (op === document.body ? scrollY : op.scrollTop)) + "px", "important");
    k.style.setProperty("width", Math.round(r.width) + "px", "important"); k.style.setProperty("height", Math.round(r.height) + "px", "important");
    k.style.setProperty("right", "auto", "important");
  });
  return true;
}

/* ======================= 7 · Themen ======================= */
function themen(){
  const ap = $("#app > .ap.ap-themen"); if(!ap) return false;
  const bers = $$(".ap-ber .apb", ap).map(b => { const k = $(".apb-kopf", b);
    return { id:k.dataset.b, name:tx($("b", k)), n:tx($(".apn", k)).replace(/\s*Fragen/, ""), em:($(".apem", k) || {}).innerHTML || "", el:b }; });
  const stufen = [[1, "🌱", "Entdecker", "bis 9 Jahre"], [2, "🚀", "Könner", "10 bis 14"], [3, "🎓", "Profis", "ab 15"]];
  let th = []; try{ th = (EP_LERNEN.elternDaten().th || []).slice(0, 1); }catch(e){}
  const zuletztTh = th.map(([id]) => { const t = THEMA[id]; if(!t) return null; const st = sterneVon(id); return { id, t, st }; }).filter(Boolean);
  const key = ["t", S.stufe, bers.map(b => b.id + b.n).join(","), zuletztTh.map(x => x.id + x.st).join(",")].join("|");
  const v = wurzel(ap, key, `
<div style="display: flex; align-items: center; justify-content: space-between; height: 44px">
<h1 class="h vl-hell" style="margin: 0; font-size: 32px">Themen</h1>
<button type="button" class="rund" data-vl="suche" aria-label="Thema suchen">${SVG.suche}</button>
</div>
<div role="tablist" aria-label="Stufe" style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 4px; padding: 4px; border-radius: 20px; background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.1)">
${stufen.map(([id, e, n, a]) => { const an = S.stufe === id; return `<button type="button" role="tab" aria-selected="${an}" class="stufe" data-vl="stufe" data-s="${id}"${an ? ' style="background: linear-gradient(140deg,#9070FF,#5B3FD9); box-shadow: 0 6px 14px -4px rgba(91,63,217,.8)"' : ""}><span class="emo">${e}</span> ${n}<br><span style="font-weight: 400; font-size: 12px; color: ${an ? "#E8E3FF" : "#C9C3FF"}">${a}</span></button>`; }).join("")}
</div>
<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px">
${bers.map((b, i) => `<button type="button" class="k ${FARBE[b.id] || "g-vio"}" data-vl="bereich" data-i="${i}" style="height: 172px; padding: 14px; display: flex; flex-direction: column; justify-content: space-between">
<div class="clip"><div class="blase" style="width: 130px; height: 130px; right: -40px; bottom: -50px"></div></div>
<div style="position: relative; display: flex; justify-content: space-between; align-items: flex-start; width: 100%"><div class="wico">${b.em}</div><span class="zahl">${h(b.n)}</span></div>
<span class="h ts" style="position: relative; font-size: 21px; line-height: 1.05">${h(b.name)}</span>
</button>`).join("")}
</div>
<button type="button" class="k g-vio" data-vl="mix" style="height: 72px; padding: 0 14px; display: flex; align-items: center; gap: 12px; width: 100%">
<div class="clip"><div class="blase" style="width: 110px; height: 110px; right: 30px; top: -60px"></div></div>
<div style="position: relative; width: 46px; height: 46px; border-radius: 15px; background: rgba(255,255,255,.22); display: flex; align-items: center; justify-content: center"><span class="emo" style="font-size: 24px">🎲</span></div>
<div style="position: relative; flex: 1; display: flex; flex-direction: column"><span class="ts" style="font-weight: 600; font-size: 17px">Alles gemischt</span><span class="ts" style="font-size: 13px; color: #EEEAFF">Aus jedem Bereich, passend zu dir</span></div>
${SVG.pfeil}
</button>
<div style="display: flex; align-items: center; gap: 8px">
<span class="vl-hell" style="font-size: 12px; font-weight: 600; letter-spacing: .06em; color: #C9C3FF; white-space: nowrap">WEITER</span>
<button type="button" data-vl="lib" style="flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; height: 46px; padding: 0 12px; border-radius: 16px; background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.12); color: #FFFFFF; font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden"><span class="emo">📚</span>Bibliothek</button>
${zuletztTh.map(x => `<button type="button" data-vl="thema" data-t="${h(x.id)}" style="flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; height: 46px; padding: 0 12px; border-radius: 16px; background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.12); color: #FFFFFF; font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${emoVon(x.t.emo)}${h(x.t.name)}${x.st != null ? " · " + x.st + "/5" : ""}</button>`).join("")}
</div>`);
  if(!v.dataset.bound){ v.dataset.bound = "1";
    v.addEventListener("click", e => { const b = e.target.closest("[data-vl]"); if(!b) return; const a = b.dataset.vl;
      const ap2 = $("#app > .ap.ap-themen");
      if(a === "suche"){ try{ go("suche"); }catch(err){} }
      else if(a === "stufe") klick($(`.ap-stufen button[data-s="${b.dataset.s}"]`, ap2));
      else if(a === "bereich"){ const el = $$(".ap-ber .apb", ap2)[+b.dataset.i]; if(el) blattAuf(el); }
      else if(a === "mix") klick($('.ap-unten [data-x="mix"]', ap2));
      else if(a === "lib"){ const l = $('.ap-unten [data-x="lib"]', ap2); if(l) klick(l); else { try{ go("lib"); }catch(err){} } }
      else if(a === "thema"){ try{ startQuiz(b.dataset.t, "train", 10); }catch(err){} }
    }); }
  einpassen(v, tabsHoehe());
  return true;
}

/* ======================= 8 · Bereich ======================= */
function blattZu(){ const s = $(".vl-blatt"); if(s) s.remove(); }
function blattAuf(apb){
  blattZu();
  const k = $(".apb-kopf", apb), id = k.dataset.b, name = tx($("b", k)), n = tx($(".apn", k)).replace(/\s*Fragen/, "");
  const em = ($(".apem", k) || {}).innerHTML || "";
  const chips = $$(".apb-liste > .apc", apb), alle = $(".apb-alle", apb);
  const farbe = FARBE[id] || "g-vio";
  const s = document.createElement("div"); s.className = "vl-blatt vl"; s.setAttribute("role", "dialog"); s.setAttribute("aria-modal", "true"); s.setAttribute("aria-label", name);
  const hoehe = Math.min(620, innerHeight - 150);
  s.innerHTML = `<button type="button" class="vl-dim" aria-label="Schliessen"></button>
<img class="vl-schau" src="${KIDS}lb-denken.webp" alt="Milo und Leni schauen neugierig" style="bottom: ${hoehe - 18}px">
<section aria-label="${h(name)}" style="height: ${hoehe}px; background: linear-gradient(170deg,${BLATT[farbe]})">
<div class="blase" aria-hidden="true" style="width: 260px; height: 260px; right: -90px; top: -110px"></div>
<div aria-hidden="true" style="position: relative; align-self: center; width: 44px; height: 5px; border-radius: 3px; background: rgba(255,255,255,.5); flex: none"></div>
<div style="position: relative; display: flex; align-items: center; gap: 12px; flex: none">
<div class="wico">${em}</div>
<div style="flex: 1; min-width: 0"><h2 class="h ts" style="margin: 0; font-size: 25px">${h(name)}</h2><span class="ts" style="font-size: 13px">${h(n)} Fragen · ${chips.length} Themen</span></div>
<button type="button" class="vl-x" aria-label="Schliessen" style="width: 44px; height: 44px; border-radius: 22px; background: rgba(0,0,0,.2); display: flex; align-items: center; justify-content: center; color: #FFFFFF; flex: none">${SVG.zu}</button>
</div>
<div class="vl-gitter">
${chips.map((c, i) => { const tt = c.dataset.tt, st = sterneVon(tt), ico2 = ($(".apci", c) || {}).innerHTML || "";
  return `<button type="button" class="vl-thema" data-i="${i}"><div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%"><span style="font-size: 28px; line-height: 1">${ico2}</span>${st != null ? `<span class="sterne" aria-label="${st} von 5 Sternen">${"★".repeat(st)}<span style="color: rgba(255,255,255,.35)">${"★".repeat(5 - st)}</span></span>` : ""}</div><span class="ts" style="font-weight: 600; font-size: 17px; line-height: 1.15">${h(tx($(".apcn", c)) || tx(c))}</span></button>`; }).join("")}
</div>
${alle ? `<button type="button" class="gold vl-alle" style="position: relative; height: 58px; font-size: 17px; flex: none; width: 100%">${SVG.play}Alles aus ${h(name)}</button>` : ""}
</section>`;
  s.querySelector(".vl-dim").onclick = blattZu; s.querySelector(".vl-x").onclick = blattZu;
  $$(".vl-thema", s).forEach(b => b.onclick = () => { const c = chips[+b.dataset.i]; blattZu(); klick(c); });
  const a = s.querySelector(".vl-alle"); if(a) a.onclick = () => { blattZu(); klick(alle); };
  document.body.appendChild(s);
  try{ window.EP_SOUND && EP_SOUND.play("klick"); }catch(e){}
}
addEventListener("keydown", e => { if(e.key === "Escape") blattZu(); });

/* ======================= 9 · Duell ======================= */
function duell(){
  const ap = $("#app > .ap.ap-duell"); if(!ap) return false;
  const team = $$(".apteam button", ap).map(b => ({ id:b.dataset.team, n:tx(b), an:b.getAttribute("aria-pressed") === "true" }));
  const live = $('.apzeile[data-x="live"]', ap), zwei = $$(".ap-zwei > button", ap), season = $('.apzeile[data-x="season"]', ap);
  const key = ["d", team.map(t => t.id + t.an).join(","), tx($("b", live)), zwei.length, tx($("b", season))].join("|");
  const v = wurzel(ap, key, `
<div style="position: relative; display: flex; align-items: center; justify-content: center; height: 44px">
<h1 class="h vl-hell" style="margin: 0; font-size: 30px; display: flex; align-items: center; gap: 8px"><span style="width: 38px; height: 38px; border-radius: 13px; background: linear-gradient(180deg,#FFD85E,#FFB21E); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 0 #D2860A">${SVG.blitz}</span>Duell</h1>
</div>
<div class="k g-pink" style="height: 288px">
<div class="clip"><div class="blase" style="width: 240px; height: 240px; right: -70px; top: -90px"></div><div class="blase" style="width: 140px; height: 140px; left: -50px; bottom: -60px"></div></div>
<img src="${KIDS}duo-bereit.webp" alt="Lumi und Milo bereit zum Duell" style="position: absolute; right: -10px; bottom: 0; height: 270px; width: auto; pointer-events: none">
<div style="position: relative; padding: 18px; width: 210px; height: 288px; display: flex; flex-direction: column; gap: 8px">
<span class="h ts" style="font-size: 28px; line-height: 1">Bereit für dein Duell?</span>
<span class="ts" style="font-size: 13px; line-height: 1.35">Gegen Freunde, Familie oder deine Klasse.</span>
<span class="ts" style="margin-top: 4px; font-size: 11px; font-weight: 600; letter-spacing: .08em">DEIN TEAM</span>
<div role="radiogroup" aria-label="Team" style="display: flex; gap: 6px">
${team.map(t => t.an
  ? `<button type="button" role="radio" aria-checked="true" data-vl="team" data-t="${h(t.id)}" style="flex: 1; height: 42px; border-radius: 21px; border: 0; background: #FFFFFF; color: #D92472; font-weight: 600; font-size: 15px; box-shadow: 0 4px 0 rgba(0,0,0,.2)">${h(t.n)}</button>`
  : `<button type="button" role="radio" aria-checked="false" data-vl="team" data-t="${h(t.id)}" style="flex: 1; height: 42px; border-radius: 21px; border: 2px solid rgba(255,255,255,.6); background: rgba(255,255,255,.1); color: #FFFFFF; font-weight: 600; font-size: 15px">${h(t.n)}</button>`).join("")}
</div>
<button type="button" class="gold" data-vl="start" style="margin-top: auto; height: 52px; font-size: 17px">${SVG.blitzk}Duell starten</button>
</div>
</div>
${live ? `<button type="button" class="k g-teal" data-vl="live" style="height: 68px; padding: 0 14px; display: flex; align-items: center; gap: 12px; width: 100%">
<div class="clip"><div class="blase" style="width: 110px; height: 110px; right: 60px; top: -60px"></div></div>
<div style="position: relative; width: 44px; height: 44px; border-radius: 22px; background: rgba(255,255,255,.22); display: flex; align-items: center; justify-content: center; flex: none">${SVG.funk}</div>
<div style="position: relative; flex: 1; display: flex; flex-direction: column; min-width: 0"><span class="ts" style="font-weight: 600; font-size: 15px">${h(tx($("b", live)))}</span><span class="ts" style="font-size: 12px">${h(tx($("small", live)))}</span></div>
<span class="h ts vl-cd" style="position: relative; font-size: 19px; padding: 6px 10px; border-radius: 12px; background: rgba(0,0,0,.2)">${h(tx($(".ap-cd", live)))}</span>
</button>` : ""}
<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px">
<button type="button" class="k g-vio kachel" data-vl="z0">
<div class="clip"><div class="blase" style="width: 80px; height: 80px; right: -26px; top: -26px"></div></div>
<span class="emo" style="position: relative; font-size: 26px">🔥</span>
<span class="ts" style="position: relative; font-weight: 600; font-size: 14px; line-height: 1.15">Wettbewerb &amp; Hardcore</span>
</button>
<button type="button" class="k g-blau kachel" data-vl="z1">
<div class="clip"><div class="blase" style="width: 80px; height: 80px; right: -26px; top: -26px"></div></div>
<div style="position: relative; display: flex; align-items: flex-end; gap: 4px; height: 30px" aria-hidden="true">
<div style="width: 14px; height: 22px; border-radius: 4px; background: rgba(255,255,255,.7)"></div>
<div style="width: 14px; height: 30px; border-radius: 4px; background: #FFD85E"></div>
<div style="width: 14px; height: 17px; border-radius: 4px; background: rgba(255,255,255,.7)"></div>
</div>
<span class="ts" style="position: relative; font-weight: 600; font-size: 14px; line-height: 1.15">Regionen-Duell<br><span style="font-weight: 400; font-size: 11px">DS · Romandie · Tessin</span></span>
</button>
<button type="button" class="k g-ora kachel" data-vl="z2">
<div class="clip"><div class="blase" style="width: 80px; height: 80px; right: -26px; top: -26px"></div></div>
<span class="emo" style="position: relative; font-size: 26px">🏆</span>
<span class="ts" style="position: relative; font-weight: 600; font-size: 14px; line-height: 1.15">Top 10 der Schweiz</span>
</button>
</div>
${season ? `<button type="button" class="k g-gruen" data-vl="season" style="height: 60px; padding: 0 14px; display: flex; align-items: center; gap: 10px; width: 100%">
<span style="position: relative; font-weight: 800; font-size: 15px; padding: 5px 9px; border-radius: 11px; background: #FFD85E; color: #2A1D5C">${h(tx($(".ap-mult", season)) || "×2")}</span>
<span class="ts" style="position: relative; flex: 1; font-weight: 600; font-size: 14px; min-width: 0">${h(tx($("b", season)).replace(/\s*·\s*noch.*$/, ""))} · doppelte Punkte</span>
<span class="ts" style="position: relative; font-size: 12px; white-space: nowrap">${h(((/(\d+)\s*Tag/.exec(tx($("b", season))) || [])[1] || "") ? ((/(\d+)\s*Tag/.exec(tx($("b", season))))[1] + " Tage") : "")}</span>
</button>` : ""}`);
  if(!v.dataset.bound){ v.dataset.bound = "1";
    v.addEventListener("click", e => { const b = e.target.closest("[data-vl]"); if(!b) return; const a = b.dataset.vl; const ap2 = $("#app > .ap.ap-duell");
      if(a === "team") klick($(`.apteam button[data-team="${b.dataset.t}"]`, ap2));
      else if(a === "start") klick($('.apwahl [data-x="duell"]', ap2));
      else if(a === "live") klick($('.apzeile[data-x="live"]', ap2));
      else if(a === "season") klick($('.apzeile[data-x="season"]', ap2));
      else if(/^z\d$/.test(a)) klick($$(".ap-zwei > button", ap2)[+a[1]]);
    }); }
  einpassen(v, tabsHoehe());
  return true;
}
setInterval(() => { const c = $(".vl .vl-cd"), o = $("#app .ap-duell #epLiveCd"); if(c && o) c.textContent = o.textContent; }, 1000);

/* ======================= 10 · Profil ======================= */
let ptab = "uebersicht";
function profil(){
  const ap = $("#app > .ap.ap-profil"); if(!ap) return false;
  const p = S.profil;
  let lv = null; try{ lv = EP_LEVEL.stand(); }catch(e){}
  let serie = 0; try{ serie = EP_START.serie().n || 0; }catch(e){}
  let ab = {hat:0, alle:0}; try{ ab = EP_START.abzeichenZahl(); }catch(e){}
  let d = null; try{ d = EP_LERNEN.elternDaten(); }catch(e){}
  const stufe = (() => { try{ return (STUFEN.find(x => x.id === S.stufe) || {}).name || ""; }catch(e){ return ""; } })();
  let av = ""; try{ if(p && typeof avatar === "function") av = avatar(p.avatar); }catch(e){}
  const tage = (d && d.t || []).slice(-7), max = Math.max(1, ...tage), sum = tage.reduce((a, b) => a + b, 0);
  const N = ["So","Mo","Di","Mi","Do","Fr","Sa"], heute = new Date().getDay();
  const stark = (d && d.th || []).filter(x => x[2] >= 5).map(x => [x[0], x[1] / x[2]]).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => THEMA[id] ? { id, t:THEMA[id] } : null).filter(Boolean);
  const reiter = [["uebersicht","Übersicht"],["album","Album"],["erfolge","Erfolge"],["einst","Einstell."]];
  let abz = []; try{ abz = EP_LERNEN.abzeichen() || []; }catch(e){}
  const liste = $$("nav.ap-liste > button", ap).map((b, i) => ({ i, n:tx($("span", b)) || tx(b), ic:($("svg", b) || {}).outerHTML || "" }));
  const kl = ["g-ora","g-blau","g-vio","g-teal","g-pink","g-gruen"];
  const key = ["p", p ? p.name : "-", lv && lv.xp, serie, ab.hat, sum, ptab, stark.map(x => x.id).join(","), liste.length].join("|");
  const kopf = p ? `
<div class="k g-vio" style="height: 136px; padding: 16px; display: flex; align-items: center; gap: 14px" data-vl="konto">
<div class="clip"><div class="blase" style="width: 200px; height: 200px; right: -60px; top: -90px"></div></div>
<div style="position: relative; width: 96px; height: 96px; flex-shrink: 0">
<div style="width: 96px; height: 96px; border-radius: 48px; background: linear-gradient(180deg,#FFD85E,#FFB21E); padding: 4px; box-shadow: 0 6px 14px -4px rgba(0,0,0,.45)">
<div class="ava2" style="width: 88px; height: 88px; border-radius: 44px; overflow: hidden; background: #FF8FC0">${av}</div>
</div>
<span class="h" style="position: absolute; right: -4px; bottom: -2px; width: 32px; height: 32px; border-radius: 16px; background: #D92472; border: 3px solid #FFFFFF; display: flex; align-items: center; justify-content: center; font-size: 15px; box-sizing: content-box">${lv ? lv.level : 1}</span>
</div>
<div style="position: relative; flex: 1; display: flex; flex-direction: column; gap: 5px; min-width: 0">
<span class="h ts" style="font-size: 26px; line-height: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${h(p.name || "")}</span>
<span class="ts" style="font-size: 14px">${h(lv && lv.titel ? lv.titel.name : "Neuling")}${stufe ? " · " + h(stufe) : ""}</span>
<div style="height: 10px; border-radius: 5px; background: rgba(0,0,0,.25)"><div style="width: ${lv ? Math.round(Math.min(1, lv.anteil) * 100) : 0}%; height: 10px; border-radius: 5px; background: #FFD85E; box-shadow: 0 0 8px rgba(255,216,94,.7)"></div></div>
<span class="ts" style="font-size: 12px">${lv ? (lv.max ? "Höchstes Level erreicht" : `${lv.imLevel} von ${lv.proLevel} XP bis Level ${lv.level + 1}`) : ""}</span>
</div>
</div>` : `
<div class="k g-vio" style="min-height: 136px; padding: 16px; display: flex; flex-direction: column; gap: 10px">
<div class="clip"><div class="blase" style="width: 200px; height: 200px; right: -60px; top: -90px"></div></div>
<span class="h ts" style="position: relative; font-size: 26px; line-height: 1">Melde dich an</span>
<span class="ts" style="position: relative; font-size: 14px; line-height: 1.35">Dann bleiben deine Punkte, deine Serie und deine Abzeichen gespeichert.</span>
<div style="position: relative; display: flex; gap: 8px"><button type="button" class="weiss" data-vl="login" style="height: 44px; padding: 0 18px; color: #6446E6; font-size: 15px">Anmelden</button><button type="button" class="gold" data-vl="register" style="height: 44px; padding: 0 18px; font-size: 15px">Registrieren</button></div>
</div>`;
  const inhalt = ptab === "erfolge" ? `
<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px">
${abz.slice().sort((a, b) => (b.hat ? 1 : 0) - (a.hat ? 1 : 0)).map((e, i) => `<div class="k ${kl[i % kl.length]}" style="height: 110px; padding: 12px; display: flex; flex-direction: column; justify-content: space-between${e.hat ? "" : "; opacity: .45; filter: grayscale(.6)"}">
<div class="clip"><div class="blase" style="width: 80px; height: 80px; right: -24px; top: -24px"></div></div>
<span class="emo" style="position: relative; font-size: 30px">${e.emo}</span>
<span class="ts" style="position: relative; font-weight: 600; font-size: 14px; line-height: 1.2">${h(e.name)}<br><span style="font-weight: 400; font-size: 11px">${h(e.text)}</span></span>
</div>`).join("")}
</div>` : ptab === "einst" ? `
<div style="display: flex; flex-direction: column; gap: 8px">
${liste.map(l => `<button type="button" class="zeile" data-vl="liste" data-i="${l.i}">${l.ic}<span style="flex: 1; font-weight: 500; font-size: 15px">${h(l.n)}</span>${SVG.pfeilk}</button>`).join("")}
<p class="vl-hell" style="margin: 4px 0 0; text-align: center; font-size: 12px; color: #C9C3FF">${h(tx($(".ep-ver", ap)))}</p>
</div>` : `
<div style="display: flex; flex-direction: column; gap: 10px">
${p ? `<div class="k g-blau" style="padding: 14px 16px; display: flex; flex-direction: column; gap: 8px">
<div class="clip"><div class="blase" style="width: 140px; height: 140px; right: -40px; top: -70px"></div></div>
<div style="position: relative; display: flex; justify-content: space-between; align-items: baseline"><span class="ts" style="font-weight: 600; font-size: 16px">Diese Woche</span><span class="ts" style="font-size: 13px">${sum} Fragen</span></div>
<div style="position: relative; display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 8px; align-items: end; height: 84px">
${tage.map((w, i) => { const heuteJa = i === tage.length - 1; return `<div style="display: flex; flex-direction: column; align-items: center; gap: 4px; justify-content: flex-end; height: 84px"><div style="width: 100%; border-radius: 7px; background: ${heuteJa ? "linear-gradient(180deg,#FFE27A,#FFB21E)" : (w ? "rgba(255,255,255,.85)" : "rgba(255,255,255,.25)")}; height: ${Math.max(6, Math.round(w / max * 62))}px; box-shadow: ${heuteJa ? "0 0 10px rgba(255,216,94,.8)" : "none"}"></div><span class="ts" style="font-size: 11px">${N[(heute - (tage.length - 1 - i) + 70) % 7]}</span></div>`; }).join("")}
</div>
</div>` : ""}
<button type="button" class="k g-pink" data-vl="garderobe" style="height: 92px; display: flex; align-items: center; padding: 0 16px; width: 100%; overflow: hidden">
<div class="clip"><div class="blase" style="width: 130px; height: 130px; left: 150px; top: -60px"></div></div>
<div style="position: relative; flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0"><span class="h ts" style="font-size: 21px">Garderobe</span><span class="ts" style="font-size: 13px">Mützen, Brillen und mehr</span></div>
<img src="${KIDS}liegen.webp" alt="Lumi liegt und lacht" style="position: relative; height: 92px; width: auto; margin-right: -16px; align-self: flex-end">
</button>
${stark.length ? `<div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap">
<span class="vl-hell" style="font-size: 12px; font-weight: 600; letter-spacing: .06em; color: #C9C3FF">STARK IN</span>
${stark.map(x => `<button type="button" data-vl="thema" data-t="${h(x.id)}" style="height: 36px; display: flex; align-items: center; gap: 5px; padding: 0 12px; border-radius: 18px; background: rgba(255,255,255,.12); font-size: 13px; font-weight: 500; color: #FFFFFF">${emoVon(x.t.emo)}${h(x.t.name)}</button>`).join("")}
</div>` : ""}
</div>`;
  const v = wurzel(ap, key, kopf + `
<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px">
<div class="k g-ora stat"><span class="h ts" style="font-size: 21px"><span class="emo" style="font-size: 17px">🔥</span> ${serie}</span><span class="ts" style="font-size: 12px">Tage Serie</span></div>
<div class="k g-teal stat"><span class="h ts" style="font-size: 21px">${d ? d.r || 0 : 0}</span><span class="ts" style="font-size: 12px">richtig</span></div>
<div class="k g-pink stat"><span class="h ts" style="font-size: 21px"><span class="emo" style="font-size: 17px">🏅</span> ${ab.hat}</span><span class="ts" style="font-size: 12px">Abzeichen</span></div>
</div>
<div role="tablist" aria-label="Profil-Bereiche" style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4px; padding: 4px; border-radius: 19px; background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.1)">
${reiter.map(([id, n]) => `<button type="button" role="tab" aria-selected="${ptab === id}" class="${ptab === id ? "reiter-an" : "reiter"}" data-vl="reiter" data-t="${id}">${n}</button>`).join("")}
</div>
${inhalt}`);
  if(!v.dataset.bound){ v.dataset.bound = "1";
    v.addEventListener("click", e => { const b = e.target.closest("[data-vl]"); if(!b) return; const a = b.dataset.vl; const ap2 = $("#app > .ap.ap-profil");
      if(a === "reiter"){ const t = b.dataset.t; if(t === "album"){ try{ EP_EXTRAS.oeffne("album"); }catch(err){} return; } ptab = t; alles(); try{ EP_SOUND.play("klick"); }catch(err){} }
      else if(a === "liste") klick($$("nav.ap-liste > button", ap2)[+b.dataset.i]);
      else if(a === "garderobe"){ try{ EP_EXTRAS.oeffne("garderobe"); }catch(err){} }
      else if(a === "thema"){ try{ startQuiz(b.dataset.t, "train", 10); }catch(err){} }
      else if(a === "login") klick($('[data-x="login"]', ap2));
      else if(a === "register") klick($('[data-x="register"]', ap2));
      else if(a === "konto") klick($('[data-x="meinprofil"]', ap2));
    }); }
  einpassen(v, tabsHoehe());
  return true;
}

/* ======================= 11 und 12 · Quiz und Antwort ======================= */
const FARB = [["#5A8BFF","#1D45BF","#2F63EC"],["#4FCB62","#1D7F33","#2CA343"],["#FF9B3D","#C3540A","#EF7418"],["#FF5C9E","#B5175A","#E2307A"]];
function sprich(t){ try{ speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = "de-CH"; speechSynthesis.speak(u); }catch(e){} }
function quiz(){
  if(S.screen !== "quiz") return false;
  const appEl = $("#app"); const card = $("#app .card"); const Q = S.quiz; if(!card || !Q || !Q.list) return false;
  const f = Q.list[Q.i]; if(!f) return false;
  const opts = f.opts || []; const st = Q.st || [];
  const beantw = Q.picked != null;
  const orig = $$(".answers .ans", card);
  const weg = orig.map(a => a.classList.contains("hlf-weg"));
  const fb = $(".feedback.pop", card);
  const ok = beantw && st[Q.i] && st[Q.i].ok;
  const vl = $(".hlf-vl", card), f50 = $('[data-hj="f50"]', card), tipp = $('[data-hj="tipp"]', card);
  const tippTxt = tx($(".hlf-tipp p", card)).replace(/^Milo sagt:\s*/, "");
  const nx = $("#next", card); const nxTxt = nx ? (/Ergebnis|abgeben/i.test(tx(nx)) ? tx(nx).replace(/^[^A-Za-zÄÖÜäöü]+/, "") : "Weiter") : "";
  let serie = 0; for(let i = Q.i; i >= 0; i--){ if(!st[i] || st[i].picked == null) continue; if(st[i].ok) serie++; else break; }
  const t = S.thema, stufe = (() => { try{ return STUFEN.find(x => x.id === S.stufe); }catch(e){ return null; } })();
  let ziel = null; try{ ziel = beantw ? qbZiel(f) : null; }catch(e){}
  const key = ["q", Q.i, Q.picked, weg.join(""), tippTxt, vl && vl.getAttribute("aria-checked"), f50 && f50.disabled, tipp && tipp.disabled, !!fb, nxTxt, st.map(x => x && x.picked != null ? (x.ok ? 1 : 2) : 0).join("")].join("|");
  const segs = Q.list.map((x, i) => { const s = st[i]; const c = s && s.picked != null ? (s.ok ? "#4FCB62; box-shadow: 0 0 8px rgba(79,203,98,.8)" : "#FF6B6B; box-shadow: 0 0 8px rgba(255,107,107,.7)") : (i === Q.i ? "#FFD85E; box-shadow: 0 0 8px rgba(255,216,94,.8)" : "rgba(255,255,255,.2)"); return `<div class="vl-seg" style="background: ${c}"></div>`; }).join("");
  const kopf = `<div style="display: flex; align-items: center; gap: 10px; height: 44px">
<button type="button" data-vl="ende" aria-label="Quiz beenden" style="width: 44px; height: 44px; border-radius: 22px; background: rgba(255,255,255,.16); display: flex; align-items: center; justify-content: center; color: #FFFFFF; flex-shrink: 0">${SVG.zu}</button>
<div role="progressbar" aria-label="Frage ${Q.i + 1} von ${Q.list.length}" aria-valuemin="1" aria-valuemax="${Q.list.length}" aria-valuenow="${Q.i + 1}" style="flex: 1; display: flex; gap: 5px">${segs}</div>
<span style="display: flex; align-items: center; gap: 3px; height: 34px; padding: 0 10px; border-radius: 17px; background: linear-gradient(140deg,#FF9B3D,#C3540A); font-weight: 600; font-size: 14px; box-shadow: ${beantw && ok && serie >= 2 ? "0 0 14px rgba(255,155,61,.8), " : ""}inset 0 -3px 0 rgba(0,0,0,.18)"><span class="emo">🔥</span>${serie}</span>
</div>`;
  let html;
  if(!beantw){
    html = kopf + `
<div style="position: relative; flex: 1; min-height: 0; display: flex; flex-direction: column">
<div style="display: flex; gap: 6px">
${t ? `<span style="display: inline-flex; align-items: center; gap: 5px; height: 30px; padding: 0 11px; border-radius: 15px; background: rgba(255,255,255,.16); font-size: 13px; font-weight: 600">${emoVon(t.emo)}${h(t.name)}</span>` : ""}
${stufe ? `<span style="display: inline-flex; align-items: center; gap: 5px; height: 30px; padding: 0 11px; border-radius: 15px; background: rgba(255,255,255,.16); font-size: 13px; font-weight: 600"><span class="emo">${["", "🌱", "🚀", "🎓"][stufe.id] || "🌍"}</span>${h(stufe.name)}</span>` : ""}
</div>
<h1 class="h ts vl-q" style="margin: 18px 0 0; width: 240px; max-width: 64%; font-size: 31px; line-height: 1.12; position: relative; z-index: 1">${h(f.q)}</h1>
${tippTxt ? `<div class="vl-tipp" style="position: relative; z-index: 2; margin-top: 12px; max-width: 70%"><img src="${KIDS}j1.webp" alt=""><span><b style="display: block; font-size: 12px; opacity: .9">Milo sagt:</b>${h(tippTxt)}</span></div>` : ""}
<img src="${KIDS}lb-denken.webp" alt="Milo und Leni denken nach" style="position: absolute; right: -26px; bottom: -4px; height: 236px; max-height: 100%; width: auto; pointer-events: none">
</div>
<div style="display: flex; flex-direction: column; gap: 12px">
${opts.map((o, i) => { const c = FARB[i % 4]; return `<button type="button" class="antw${weg[i] ? " weg" : ""}" data-vl="ans" data-i="${i}" style="background: linear-gradient(140deg,${c[0]},${c[1]})"><span class="bst" style="color: ${c[2]}">${"ABCD"[i]}</span>${h(o.txt)}</button>`; }).join("")}
</div>
<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 4px">
<button type="button" role="switch" aria-checked="${vl ? vl.getAttribute("aria-checked") : "false"}" class="hilfe" data-vl="vor" style="background: linear-gradient(140deg,#25C9AB,#0A7766)${vl && vl.getAttribute("aria-checked") !== "true" ? "; opacity: .75" : ""}">${SVG.ton}Vorlesen</button>
<button type="button" class="hilfe" data-vl="f50" ${!f50 || f50.disabled ? "disabled" : ""} style="background: linear-gradient(140deg,#9070FF,#4A2FC0)">50:50${f50 ? `<span class="n">${tx($(".hlf-n", f50))}</span>` : ""}</button>
<button type="button" class="hilfe" data-vl="tipp" ${!tipp || tipp.disabled ? "disabled" : ""} style="background: linear-gradient(180deg,#FFD85E,#FFB21E); color: #2A1D5C"><span class="emo">💡</span>Tipp${tipp ? `<span class="n" style="color: #FFFFFF">${tx($(".hlf-n", tipp))}</span>` : ""}</button>
</div>`;
  } else {
    html = kopf + `
<h1 class="h ts" style="margin: 0; font-size: 22px; line-height: 1.15">${h(f.q)}</h1>
<div style="display: flex; flex-direction: column; gap: 8px">
${opts.map((o, i) => { const richtig = !!o.ok, gewaehlt = Q.picked === i;
  if(richtig) return `<div style="display: flex; align-items: center; gap: 14px; min-height: 56px; padding: 8px 14px; border-radius: 20px; background: linear-gradient(140deg,#4FCB62,#1D7F33); border: 3px solid #FFFFFF; font-weight: 600; font-size: 16px; box-shadow: 0 0 22px rgba(79,203,98,.75), inset 0 -4px 0 rgba(0,0,0,.18)"><span style="width: 32px; height: 32px; border-radius: 16px; background: #FFFFFF; color: #1D7F33; display: flex; align-items: center; justify-content: center; flex: none">${SVG.haken}</span><span class="ts">${h(o.txt)}</span></div>`;
  if(gewaehlt) return `<div style="display: flex; align-items: center; gap: 14px; min-height: 56px; padding: 8px 14px; border-radius: 20px; background: linear-gradient(140deg,#FF6B6B,#B51B1B); border: 3px solid rgba(255,255,255,.7); font-weight: 600; font-size: 16px"><span style="width: 32px; height: 32px; border-radius: 16px; background: #FFFFFF; color: #B51B1B; display: flex; align-items: center; justify-content: center; flex: none">${SVG.kreuz}</span><span class="ts">${h(o.txt)}</span></div>`;
  return `<div class="aus"><span class="bst">${"ABCD"[i]}</span>${h(o.txt)}</div>`; }).join("")}
</div>
${ok ? `<div class="konf" style="left: 40px; top: 120px; background: #FFD85E; transform: rotate(20deg)"></div><div class="konf" style="left: 120px; top: 70px; background: #FF5C9E; transform: rotate(-30deg)"></div><div class="konf" style="left: 230px; top: 110px; background: #4FCB62; transform: rotate(45deg)"></div><div class="konf" style="right: 40px; top: 80px; background: #5A8BFF; transform: rotate(-15deg)"></div><div class="konf" style="right: 70px; top: 160px; background: #FF9B3D; transform: rotate(60deg)"></div>` : ""}
${fb || nx ? `<section class="vl-ant ${fb ? (ok ? "ok" : "nein") : "ok"}" aria-label="Ergebnis"${fb ? "" : ' style="background: rgba(13,9,48,.95)"'}>
${fb ? `<img src="${KIDS}${ok ? "duo-jubel" : "lb-denken"}.webp" alt="" style="position: absolute; right: 8px; top: -84px; height: 122px; width: auto; pointer-events: none">
<div style="display: flex; align-items: center; gap: 10px">
<h2 class="h ts" style="margin: 0; font-size: 30px">${ok ? "Richtig!" : "Nicht ganz."}</h2>
${Q.lastPts > 0 ? `<span style="display: flex; align-items: center; gap: 4px; font-size: 14px; font-weight: 700; padding: 5px 11px; border-radius: 12px; background: linear-gradient(180deg,#FFD85E,#FFB21E); color: #2A1D5C; box-shadow: 0 3px 0 #D2860A">+${Q.lastPts} XP</span>` : ""}
</div>
${f.e ? `<p class="ts" style="margin: 0; font-size: 16px; line-height: 1.45">${h(f.e)}</p>` : ""}
<div style="display: flex; gap: 8px; flex-wrap: wrap">
<button type="button" class="vl-pill" data-vl="sprich">${SVG.ton}Vorlesen</button>
${ziel ? `<button type="button" class="vl-pill" data-vl="mehr"><span class="emo">📚</span>Mehr über ${h(ziel.titel)}</button>` : ""}
</div>` : ""}
${nx ? `<button type="button" class="gold" data-vl="weiter" style="margin-top: 6px; height: 58px; font-size: 18px; width: 100%">${h(nxTxt)}${SVG.weiter}</button>` : ""}
</section>` : ""}`;
  }
  let v = appEl.querySelector(":scope > .vl");
  if(!v || v.dataset.key !== key){
    if(!v){ v = document.createElement("div"); v.className = "vl vl-quizv"; appEl.prepend(v); }
    v.dataset.key = key; v.innerHTML = `<div class="vl-in" style="min-height: ${beantw ? "0" : "calc(100dvh)"}; padding-bottom: ${beantw ? "0" : "calc(20px + env(safe-area-inset-bottom))"}">${html}</div>`;
    const ant = $(".vl-ant", v); if(ant){ const inn = $(".vl-in", v); requestAnimationFrame(() => {
      const ah = ant.getBoundingClientRect().height; inn.style.zoom = ""; inn.style.paddingBottom = "0px";
      const frei = innerHeight - ah - 6, hoch = inn.scrollHeight;
      if(hoch > frei && frei > 160) inn.style.zoom = String(Math.max(.6, frei / hoch));
      inn.style.paddingBottom = (ah + 12) + "px"; }); }
  }
  if(!v.dataset.bound){ v.dataset.bound = "1";
    v.addEventListener("click", e => { const b = e.target.closest("[data-vl]"); if(!b) return; const a = b.dataset.vl; const c = $("#app .card");
      if(a === "ans") klick($(`.answers .ans[data-i="${b.dataset.i}"]`, c));
      else if(a === "ende") klick($("#qAbgabe"));
      else if(a === "vor") klick($(".hlf-vl", c));
      else if(a === "f50") klick($('[data-hj="f50"]', c));
      else if(a === "tipp") klick($('[data-hj="tipp"]', c));
      else if(a === "weiter") klick($("#next", c));
      else if(a === "sprich"){ const Q2 = S.quiz, f2 = Q2 && Q2.list[Q2.i]; if(f2) sprich((f2.e || "")); }
      else if(a === "mehr"){ const Q2 = S.quiz, f2 = Q2 && Q2.list[Q2.i]; let z = null; try{ z = qbZiel(f2); }catch(err){} if(!z) return;
        try{ stopSpeak && stopSpeak(); }catch(err){} LIB.buch = z.b; LIB.seite = z.nr; LIB.zufall = false; LIB.vonQuiz = true; S.libModus = true; document.documentElement.dataset.mode = "lib"; go("libseite"); scrollTo(0, 0); }
    }); }
  if(!beantw){ const inn = $(".vl-in", v); inn.style.zoom = ""; const hoch = inn.scrollHeight; if(hoch > innerHeight + 2) inn.style.zoom = String(Math.max(.72, innerHeight / hoch)); }
  return true;
}

/* ---------- Anstossen ---------- */
let laeuft = false;
function alles(){
  if(laeuft) return; laeuft = true;
  try{
    const an = handy();
    let sicht = false, q = false;
    if(an){
      try{ q = quiz(); }catch(e){ console.warn("vorlage quiz", e); }
      if(!q){ try{ sicht = start() || themen() || duell() || profil(); }catch(e){ console.warn("vorlage", e); } }
      if(sicht) try{ tableiste(); }catch(e){}
    }
    document.body.classList.toggle("vl-an", an && sicht);
    document.body.classList.toggle("vl-quiz", an && q);
    if(!(an && (sicht || q))) $$("#app .vl").forEach(x => x.remove());
    if(!q) $$("#app > .vl.vl-quizv").forEach(x => x.remove());
  } finally { laeuft = false; }
}
if(typeof window.render === "function"){ const vor = window.render; window.render = function(){ const r = vor.apply(this, arguments); setTimeout(alles, 0); setTimeout(alles, 90); setTimeout(alles, 400); setTimeout(alles, 1200); return r; }; }
let plan = 0;
const mo = new MutationObserver(list => {
  if(list.every(m => m.target.closest && m.target.closest(".vl"))) return;
  if(plan) return; plan = setTimeout(() => { plan = 0; alles(); }, 30);
});
function beobachten(){ const a = document.getElementById("app"); if(a) mo.observe(a, {childList:true, subtree:true, attributes:true, attributeFilter:["aria-pressed","aria-checked","disabled","class"]}); const t = document.getElementById("epTabs"); if(t) mo.observe(t, {childList:true, subtree:true}); alles(); }
if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", beobachten); else beobachten();
addEventListener("resize", () => setTimeout(alles, 50));
window.EP_VORLAGE = { alles, blattAuf, blattZu };
})();
