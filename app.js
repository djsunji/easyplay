/* easyplay: App-Ansicht für Handy und iPad
   Statt einer langen Startseite gibt es fünf Bereiche (Heute, Themen, Duell, Qeels, Profil).
   Jeder Bereich passt auf einen Bildschirm. Unten eine Tab-Leiste, auf dem iPad quer eine Seitenleiste links.
   Die Leiste oben (Anmelden, Menü) ist ausgeblendet; was im Menü stand, steht im Bereich Profil.
   Karten sind farbig mit weisser Schrift. Der Computer (Maus, breiter Bildschirm) bleibt unverändert.
   Muster wie startseite.js: renderHome, render und oeffneReels werden umhüllt, Daten kommen aus window.EP_START. */
(function(){
"use strict";
if(typeof window.render !== "function" || typeof window.renderHome !== "function") return;

const MQ = matchMedia("(max-width: 760px), (pointer: coarse) and (max-width: 1366px)");
const QUER = matchMedia("(min-width: 1000px) and (orientation: landscape)");
const an = () => MQ.matches;
const KIDS = "img/kids/";
const E = () => window.EP_START || {};
const h = s => { try{ return esc(s); }catch(e){ return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); } };
const zahl = n => Math.round(Number(n || 0)).toLocaleString("de-CH");
const TABS = ["heute", "themen", "duell", "qeels", "profil"];
const HOME_TABS = ["heute", "themen", "duell", "profil"];
let tab = "heute"; try{ const t = sessionStorage.getItem("ep-apptab"); if(HOME_TABS.includes(t)) tab = t; }catch(e){}
const setTab = t => { tab = t; try{ sessionStorage.setItem("ep-apptab", t); }catch(e){} };
const OHNE_LEISTE = ["quiz","done","duellplay","duelllobby","duellannahme","check","checkdone","livequiz","liveplay","livehost"];
function tabVon(sc){
  if(sc === "home") return tab;
  if(["profil","register","login","historie","spieler","lehrer","lcode","suche","meinetests","testergebnis","bibliothek","werkstatt"].includes(sc)) return "profil";
  if(sc === "chat" || sc === "epwoche") return "heute";
  if(sc === "livequiz") return "duell";
  if(["duell","duellsplit","duellende","duellresultat","spielmodi","board","live"].includes(sc)) return "duell";
  return "themen";
}

/* ---------- Symbole ---------- */
const SV = (d, w = 22) => `<svg width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const I = {
  heute: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  themen: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  duell: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  qeels: '<rect x="3" y="3" width="18" height="18" rx="5"/><path d="M10 8.5v7l6-3.5z"/>',
  profil: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  kal: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  live: '<circle cx="12" cy="12" r="2"/><path d="M16.2 7.8a6 6 0 0 1 0 8.4M7.8 16.2a6 6 0 0 1 0-8.4M19 5a10 10 0 0 1 0 14M5 19A10 10 0 0 1 5 5"/>',
  ziel: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  birne: '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z"/>',
  pfeil: '<path d="m9 6 6 6-6 6"/>',
  zurueck: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  play: '<path d="M7 4.5v15l13-7.5z" fill="currentColor" stroke="none"/>',
  buch: '<path d="M4 19V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M8 7h7M8 11h5"/>',
  pokal: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
  pad: '<rect x="2" y="7" width="20" height="12" rx="5"/><path d="M7 11v4M5 13h4"/><circle cx="16" cy="12" r="1"/><circle cx="18" cy="14.5" r="1"/>',
  flamme: '<path d="M12 22c4 0 7-2.8 7-6.8 0-3.6-2.6-5.8-4-8.2-.6 2-1.8 3-3 3 .4-3-1-6-3-8 0 4-5 6.5-5 12.6C4 19.3 7.6 22 12 22z"/>',
  stern: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  medaille: '<circle cx="12" cy="15" r="6"/><path d="M8.5 10 6 3h4l2 4 2-4h4l-2.5 7"/>',
  wuerfel: '<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1.2" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.2" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.2" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1.2" fill="currentColor"/>',
  pinsel: '<path d="M14 4l6 6-9 9H5v-6z"/><path d="M12 6l6 6"/>',
  hut: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/>',
  code: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M8 10v4M12 10v4M16 10v4"/>',
  lupe: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  werkzeug: '<path d="M14.7 6.3a4 4 0 0 0 5 5L13 18l-3 1 1-3z"/><path d="M4 20l4-4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  schild: '<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/>',
  tuer: '<path d="M14 4h5v16h-5M10 12h9M7 9l-3 3 3 3"/>',
  herz: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  sprechblase: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
  teilen: '<path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
  laut: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/>'
};
const TAB_NAME = {heute:"Hauptmenü", themen:"Themen", duell:"Duell", qeels:"Qeels", profil:"Profil"};

/* ---------- Gestaltung ---------- */
const css = document.createElement("style");
css.id = "ep-app-css";
css.textContent = `
body.ep-app{padding-bottom:calc(96px + env(safe-area-inset-bottom))}
body.ep-app .topbar{display:none!important}
body.ep-app .wrap{padding-top:calc(12px + env(safe-area-inset-top))!important}
body.ep-app.ep-home .eplegal{display:none}
body.ep-app.ep-home{overflow:hidden;overscroll-behavior:none;padding-bottom:0}
html:has(body.ep-app.ep-home){overflow:hidden}
body.ep-app.ep-home .wrap{padding-bottom:0!important;min-height:0!important}
body.ep-app.ep-ohne{padding-bottom:0}
body.ep-app.ep-ohne #epTabs{display:none}
body.ep-app .pagehead .bigav{display:none!important}

#epTabs{position:fixed;z-index:60;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));max-width:560px;margin:0 auto;height:70px;box-sizing:border-box;padding:6px;border-radius:26px;background:rgba(27,34,64,.88);border:1px solid rgba(255,255,255,.12);box-shadow:0 18px 40px -16px rgba(27,34,64,.7);display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px;-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}
#epTabs button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;border:0;border-radius:20px;background:none;color:rgba(255,255,255,.78);font:600 11px "Lexend",system-ui,sans-serif;cursor:pointer;min-height:44px;padding:0}
#epTabs button[aria-current="page"]{background:linear-gradient(135deg,#3D5AFE,#8A3FE0 60%,#E043B8);color:#fff}
#epTabs .tabav{width:26px;height:26px;border-radius:13px;overflow:hidden;background:#FFF0F6;display:block;border:2px solid rgba(255,255,255,.85);box-sizing:border-box}
#epTabs .tabav img{width:100%;height:140%;object-fit:cover;object-position:top}
body:has(#reels:not([hidden])) #epTabs,body:has(.ep-modal) #epTabs{display:none}

/* Grundbausteine */
.ap{display:flex;flex-direction:column;gap:12px;color:#fff;text-align:left;overflow:auto;overscroll-behavior:contain;padding:2px 2px 4px;box-sizing:border-box;scrollbar-width:none}
.ap::-webkit-scrollbar{display:none}
.ap>*{flex-shrink:0}
.ap>.ap-held,.ap>.ap-karu,.ap>.ap-ber,.ap>.ap-bereit{flex-shrink:1}
.ap button{font-family:inherit}
.ap .auf{text-shadow:0 2px 3px rgba(27,34,64,.5),0 2px 14px rgba(27,34,64,.45)}
.ap .pille{display:inline-flex;align-items:center;align-self:flex-start;min-height:30px;padding:0 12px;border-radius:15px;background:rgba(27,34,64,.55);border:1px solid rgba(255,255,255,.16);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);color:#fff}
.ap .aplbl{font:700 12px "Lexend",system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase}
.ap .apf{border:0;border-radius:22px;color:#fff;box-shadow:0 16px 30px -18px rgba(27,34,64,.75);text-align:left;cursor:pointer;position:relative;overflow:hidden}
.ap .apf::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:radial-gradient(120% 90% at 100% 0%,rgba(255,255,255,.18),transparent 55%)}
.ap .apf small,.ap .apf .apsub{color:rgba(255,255,255,.88)}
.ap .apf:active{transform:translateY(2px)}
.ap .f-blau{background:linear-gradient(140deg,#2E4BEA,#5B6CFF)}
.ap .f-pink{background:linear-gradient(140deg,#B0216F,#E043B8)}
.ap .f-orange{background:linear-gradient(140deg,#B93A0B,#E8621A)}
.ap .f-teal{background:linear-gradient(140deg,#0A6575,#0E9384)}
.ap .f-navy{background:linear-gradient(140deg,#1B2240,#33408A)}
.ap .f-lila{background:linear-gradient(140deg,#5B21B6,#8A3FE0)}
.ap .f-gold{background:linear-gradient(140deg,#8A3B0C,#B4580D)}
.ap .f-gruen{background:linear-gradient(140deg,#13703A,#0F9050)}
.ap .f-held{background:linear-gradient(135deg,#3D5AFE 0%,#8A3FE0 55%,#E043B8 100%)}
.ap .glas{background:rgba(27,34,64,.55);border:1px solid rgba(255,255,255,.16);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border-radius:22px;color:#fff}
.ap .apico{width:44px;height:44px;border-radius:14px;display:grid;place-items:center;flex:none;background:rgba(255,255,255,.2);color:#fff}
.ap .apzeile{display:flex;align-items:center;gap:12px;padding:12px 14px;width:100%;box-sizing:border-box}
.ap .apzeile .aptx{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.ap .apzeile b{font:600 16px "Fredoka",system-ui,sans-serif}
.ap .apzeile small{font:400 12.5px "Lexend",system-ui,sans-serif}
.ap .ap-titel{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:0 4px}
.ap .ap-titel h2{margin:0;font:800 30px/1.1 "Bricolage Grotesque","Fredoka",system-ui,sans-serif;letter-spacing:-.02em;color:#fff}
.ap .ap-weissbtn,.ap .ap-gelbbtn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:50px;padding:0 22px;border:0;border-radius:18px;font:700 17px "Fredoka",system-ui,sans-serif;cursor:pointer}
.ap .ap-weissbtn{background:#fff;color:#3D2AB8;box-shadow:0 6px 0 rgba(27,34,64,.28)}
.ap .ap-gelbbtn{background:#FFE34D;color:#1B2240;box-shadow:0 6px 0 #C9A200}

/* Heute */
.ap-held{position:relative;flex:1 1 0;min-height:180px;margin-top:58px;border-radius:28px;padding:18px;box-sizing:border-box;display:flex;box-shadow:0 22px 44px -24px rgba(61,42,184,.75);cursor:default}
.ap .ap-held{overflow:visible}
.ap-held::after{border-radius:28px}
.ap-held::before{content:"";position:absolute;inset:0;border-radius:inherit;background:radial-gradient(60% 70% at 15% 10%,rgba(255,255,255,.28),transparent 60%),radial-gradient(50% 60% at 95% 100%,rgba(255,227,77,.35),transparent 60%);pointer-events:none}
.ap-held .apht{position:relative;z-index:2;width:56%;display:flex;flex-direction:column;gap:8px}
.ap-held .aphoi{font:500 14px "Lexend",system-ui,sans-serif;color:rgba(255,255,255,.9)}
.ap-held h1{margin:0;font:800 clamp(30px,8.2vw,66px)/1 "Bricolage Grotesque","Fredoka",system-ui,sans-serif;letter-spacing:-.02em;color:#fff;text-shadow:0 3px 0 rgba(27,34,64,.18)}
.ap-held .apzahlen{font:500 13px "Lexend",system-ui,sans-serif;color:rgba(255,255,255,.88)}
.ap-held .ap-weissbtn{margin-top:auto;align-self:flex-start}
.ap-held>img{position:absolute;right:-6px;bottom:0;height:calc(100% + 56px);max-width:62%;object-fit:contain;object-position:bottom right;z-index:1;filter:drop-shadow(0 14px 16px rgba(27,34,64,.35))}
.ap-kopf{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 4px}
.ap-chips{display:flex;gap:6px}
.ap-chips span{display:inline-flex;align-items:center;gap:5px;height:30px;padding:0 11px;border-radius:15px;font:600 13px "Fredoka",system-ui,sans-serif}
.ap-tag{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.ap-tag button{display:flex;flex-direction:column;gap:6px;padding:12px;min-height:118px;box-sizing:border-box}
.ap-tag button b{font:600 15px/1.15 "Fredoka",system-ui,sans-serif}
.ap-tag button small{font:400 12px/1.3 "Lexend",system-ui,sans-serif}
.ap-tag button .apico{width:38px;height:38px;border-radius:12px}
.ap-tag button.ok .apico::after{content:"✓";position:absolute;margin:-26px 0 0 26px;width:18px;height:18px;border-radius:9px;background:#12B76A;color:#fff;font:700 11px/18px system-ui;text-align:center}
.ap-tag button:disabled{cursor:default;opacity:.7}
.ap-woche{display:flex;align-items:center;gap:12px;padding:14px 16px;width:100%;box-sizing:border-box}
.ap-woche .aptx{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px}
.ap-woche small{font:600 11px "Lexend",system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase}
.ap-woche b{font:700 18px "Fredoka",system-ui,sans-serif}
.ap-woche .apbar{height:8px;border-radius:4px;background:rgba(255,255,255,.25);overflow:hidden}
.ap-woche .apbar i{display:block;height:100%;background:#FFE34D;border-radius:4px}
.ap-woche span.apz{font:400 12px "Lexend",system-ui,sans-serif;color:rgba(255,255,255,.88)}
.ap-fakt{display:flex;gap:12px;align-items:flex-start;padding:14px 16px;width:100%;box-sizing:border-box}
.ap-fakt .aptx{display:flex;flex-direction:column;gap:4px}
.ap-fakt p{margin:0;font:500 14px/1.35 "Lexend",system-ui,sans-serif;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.ap-fakt em{font:700 13px "Lexend",system-ui,sans-serif;color:#FFE34D;font-style:normal}
.ap-fakt>svg{color:#FFE34D;flex:none;margin-top:2px}
.ap.ap-eng .ap-fakt,.ap.ap-eng .apzahlen{display:none}
.ap .ap-weiter{display:none}

/* Themen */
.ap-stufen{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;padding:6px}
.ap-stufen button{min-height:52px;border:0;border-radius:16px;background:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;color:#fff}
.ap-stufen button b{white-space:nowrap;font:600 clamp(13px,3.6vw,16px) "Fredoka",system-ui,sans-serif}
.ap-stufen button small{font:400 11px "Lexend",system-ui,sans-serif;color:rgba(255,255,255,.8)}
.ap-stufen button[aria-pressed="true"]{background:linear-gradient(135deg,#3D5AFE,#8A3FE0 60%,#E043B8);box-shadow:0 6px 16px -8px rgba(61,90,254,.8)}
.ap-stufen button[aria-pressed="true"] small{color:#fff}
.ap-info{margin:-4px 2px 0;font:500 12px "Lexend",system-ui,sans-serif}
.ap-ber{flex:1 1 0;min-height:260px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:1fr;gap:10px}
.ap-ber .apb{position:relative;display:flex;flex-direction:column;min-height:0;border-radius:24px;overflow:hidden;background:var(--c);background-image:linear-gradient(160deg,rgba(255,255,255,.14),rgba(0,0,0,.22));box-shadow:0 6px 0 rgba(0,0,0,.18),0 18px 30px -18px rgba(27,34,64,.6)}
.ap-ber .apwm{position:absolute;right:-18px;bottom:-22px;width:120px;height:120px;display:grid;place-items:center;font-size:96px;opacity:.16;transform:rotate(-12deg);pointer-events:none;filter:grayscale(1) brightness(3)}
.ap-ber .apwm svg,.ap-ber .apwm img{width:110px;height:110px}
.ap-ber .apb-kopf{flex:1;position:relative;border:0;background:none;padding:14px;color:#fff;text-align:left;cursor:pointer;display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto 1fr auto auto;column-gap:10px;row-gap:3px;min-height:0}
.ap-ber .apem{width:68px;height:68px;border-radius:20px;background:rgba(255,255,255,.95);box-shadow:0 8px 16px -8px rgba(0,0,0,.4);display:grid;place-items:center;font-size:44px}
.ap-ber .apem svg,.ap-ber .apem img{width:46px;height:46px}
.ap-ber .apn{justify-self:end;align-self:start;white-space:nowrap;font:700 11px "Lexend",system-ui,sans-serif;padding:5px 9px;border-radius:10px;background:rgba(0,0,0,.2)}
.ap-ber .apb-kopf b{grid-column:1/3;grid-row:3;font:700 18px/1.1 "Fredoka",system-ui,sans-serif;text-shadow:0 1px 2px rgba(0,0,0,.25)}
.ap-ber .apb-kopf small{grid-column:1/3;grid-row:4;font:400 12px/1.3 "Lexend",system-ui,sans-serif;color:rgba(255,255,255,.92);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.ap-ber .apb-liste,.ap-ber .apb-alle{display:none}
.ap-ber .apn i{font-style:normal;display:none}
.ap-ber .apb-kopf b,.ap-ber .apb-kopf small{min-width:0;overflow-wrap:anywhere}
.ap-unten{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.ap-unten>*{grid-column:1/-1}
@media (min-width:700px){.ap-unten>*{grid-column:auto}}
@media (max-width:699px){.ap-held>img{max-width:54%}}
.ap-unten small{line-height:1.3}

/* Duell */
.ap-bereit{position:relative;flex:1 1 0;min-height:240px;border-radius:28px;padding:18px;box-sizing:border-box;display:flex;flex-direction:column;gap:8px;cursor:default;background:linear-gradient(150deg,#F0466E 0%,#E043B8 50%,#8A3FE0 100%)!important}
.ap-bereit h2{margin:0;position:relative;z-index:2;font:800 clamp(26px,7vw,52px)/1.02 "Bricolage Grotesque","Fredoka",system-ui,sans-serif;letter-spacing:-.02em}
.ap-bereit p{margin:0;position:relative;z-index:2;font:400 13px/1.4 "Lexend",system-ui,sans-serif;max-width:330px;color:rgba(255,255,255,.92)}
.ap-bereit .apwahl{position:relative;z-index:2;margin-top:auto;width:min(210px,54%);display:flex;flex-direction:column;gap:8px}
.ap-bereit .apteam{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
.ap-bereit .apteam button{min-height:44px;border-radius:14px;border:2px solid rgba(255,255,255,.4);background:rgba(255,255,255,.14);font:600 15px "Fredoka",system-ui,sans-serif;cursor:pointer;color:#fff}
.ap-bereit .apteam button[aria-pressed="true"]{background:#fff;border-color:#fff}
.ap-bereit .apteam button[data-team="lumi"][aria-pressed="true"]{color:#B0216F}
.ap-bereit .apteam button[data-team="milo"][aria-pressed="true"]{color:#2E4BEA}
.ap-bereit .ap-gelbbtn{min-height:48px;padding:0 12px;white-space:nowrap;font-size:16px}
.ap-bereit>img{position:absolute;right:-6px;bottom:0;height:min(80%,420px);max-width:56%;object-fit:contain;object-position:bottom right;z-index:1;filter:drop-shadow(0 12px 14px rgba(27,34,64,.35))}
.ap-cd{font:700 17px "Fredoka",system-ui,sans-serif;font-variant-numeric:tabular-nums}
.ap-zwei{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.ap-zwei button{display:flex;flex-direction:column;gap:6px;padding:12px 14px;min-height:84px;box-sizing:border-box}
.ap-zwei button b{font:600 15px/1.15 "Fredoka",system-ui,sans-serif}
.ap-mult{height:32px;padding:0 10px;border-radius:10px;display:grid;place-items:center;background:rgba(255,255,255,.22);font:700 15px "Fredoka",system-ui,sans-serif;flex:none}
.ap .ap-top{display:none}

/* Profil */
.ap-konto{display:flex;flex-direction:column;gap:10px;padding:20px;min-height:170px;box-sizing:border-box;cursor:default}
.ap-konto .apkn{position:relative;z-index:2;max-width:64%;display:flex;flex-direction:column;gap:8px}
.ap-konto b.apgross{font:800 24px/1.1 "Bricolage Grotesque","Fredoka",system-ui,sans-serif}
.ap-konto p{margin:0;font:400 13.5px/1.4 "Lexend",system-ui,sans-serif;color:rgba(255,255,255,.92)}
.ap-konto .apbtns{position:relative;z-index:2;display:flex;flex-wrap:wrap;gap:10px;margin-top:auto}
.ap-konto>img{position:absolute;right:6px;bottom:0;height:88%;max-height:240px;z-index:1;filter:drop-shadow(0 10px 12px rgba(27,34,64,.35))}
.ap-konto .apav{width:64px;height:64px;border-radius:32px;overflow:hidden;background:#fff;display:grid;place-items:center;font-size:36px;border:3px solid rgba(255,255,255,.85)}
.ap-konto .apav img,.ap-konto .apav svg{width:100%;height:100%;object-fit:cover}
.ap-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.ap-stats>div{padding:12px;display:flex;flex-direction:column;gap:2px;cursor:default}
.ap-stats small{font:700 11px "Lexend",system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase}
.ap-stats b{font:800 24px "Bricolage Grotesque","Fredoka",system-ui,sans-serif;display:flex;align-items:center;gap:6px}
.ap-stats span{font:400 12px "Lexend",system-ui,sans-serif;color:rgba(255,255,255,.88)}
.ap-liste{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));padding:6px;gap:2px 4px}
.ap-liste>*{display:flex;align-items:center;gap:10px;min-height:46px;padding:0 10px;min-width:0;border:0;border-radius:14px;background:none;color:#fff;text-decoration:none;font:500 15px "Lexend",system-ui,sans-serif;cursor:pointer;text-align:left}
.ap-liste>*:hover,.ap-liste>*:focus-visible{background:rgba(255,255,255,.12)}
.ap-liste>* span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ap-liste>* svg:last-child{display:none}
.ap-liste svg{flex:none;opacity:.9}
.ap-liste .rot{color:#FFB4B4}

/* Kleine Handys (z. B. iPhone SE) */
@media (max-height:720px) and (max-width:699px){
  .ap{gap:8px}
  .ap-karu{min-height:150px;margin-top:46px}.ap-held{min-height:150px;padding:14px}.ap-held.hs-start .aphoi{display:none}.ap-held>img{height:calc(100% + 44px)}
  .ap-tag button{min-height:92px;padding:10px;gap:4px}.ap-tag button .apico{width:32px;height:32px}
  .ap-woche{padding:10px 14px}.ap-woche b{font-size:16px}
  .ap .ap-titel h2{font-size:24px}
  .ap-stufen button{min-height:44px}.ap-info{display:none}
  .ap-ber{min-height:200px}.ap-ber .apem{width:54px;height:54px;font-size:34px}.ap-ber .apem svg,.ap-ber .apem img{width:36px;height:36px}.ap-ber .apb-kopf small{display:none}
  .ap-bereit{min-height:200px;padding:14px}.ap-bereit p{display:none}
  .ap .apzeile{padding:8px 12px}.ap-zwei button{min-height:60px;padding:10px 12px;flex-direction:row;align-items:center}
  .ap-konto{min-height:140px;padding:16px}.ap-liste>*{min-height:40px}
}
/* iPad hoch und grösser */
@media (min-width:700px){
  .ap{gap:16px}
  .ap .ap-titel h2{font-size:38px}
  .ap-karu{margin-top:80px}.ap-held{padding:30px}.ap-held .aphoi{font-size:16px}.ap-held .apzahlen{font-size:15px}.ap-held>img{height:calc(100% + 80px)}
  .ap-tag button{min-height:150px;padding:18px}.ap-tag button b{font-size:19px}.ap-tag button small{font-size:14px}.ap-tag button .apico{width:48px;height:48px}
  .ap-bereit{padding:30px}.ap-bereit p{font-size:15px}
  .ap-konto{padding:28px;min-height:230px}.ap-konto b.apgross{font-size:32px}.ap-konto p{font-size:15px}
  .ap-stats b{font-size:32px}
  .ap-konto>img{max-height:440px;height:94%}
  .ap-liste{grid-template-columns:repeat(2,minmax(0,1fr));gap:4px 8px;padding:8px}
  .ap-liste>*{min-height:52px;font-size:16px}
  /* Bereich-Karten mit Themen */
  .ap-ber{gap:14px}
  .ap-ber .apn i{display:inline}
  .ap-ber .apb-kopf{flex:none;min-height:150px;padding:16px 18px;grid-template-rows:auto auto auto}
  .ap-ber .apem{width:80px;height:80px;border-radius:24px;font-size:52px}.ap-ber .apem svg,.ap-ber .apem img{width:56px;height:56px}
  .ap-ber .apb-kopf b{grid-row:2;font-size:22px;margin-top:8px}
  .ap-ber .apb-kopf small{grid-row:3;font-size:13px;-webkit-line-clamp:1}
  .ap-ber .apwm{width:160px;height:160px;font-size:130px;right:-24px;bottom:-30px}
  .ap-ber .apb-liste{position:relative;z-index:1;flex:1 1 0;min-height:0;overflow:hidden;display:flex;flex-wrap:wrap;align-content:flex-start;gap:8px;padding:4px 14px 4px}
  .ap-ber .apc{display:inline-flex;align-items:center;gap:7px;max-width:100%;min-height:42px;box-sizing:border-box;padding:6px 12px 6px 6px;border-radius:14px;border:1px solid rgba(255,255,255,.28);cursor:pointer;background:rgba(255,255,255,.16);color:#fff;text-align:left;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
  .ap-ber .apc:hover,.ap-ber .apc:focus-visible{background:rgba(255,255,255,.28)}
  .ap-ber .apc .apci{width:30px;height:30px;border-radius:10px;background:#fff;display:grid;place-items:center;font-size:17px;flex:none;box-shadow:0 2px 6px rgba(0,0,0,.15)}
  .ap-ber .apc .apci svg,.ap-ber .apc .apci img{width:20px;height:20px}
  .ap-ber .apc .apcn{font:600 14.5px/1.15 "Fredoka",system-ui,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .ap-ber .apc small{font:600 11px "Lexend",system-ui,sans-serif;color:rgba(255,255,255,.85);white-space:nowrap;background:rgba(0,0,0,.18);border-radius:8px;padding:2px 6px}
  .ap-ber .apc.leer{opacity:.55}
  .ap-ber .apc[hidden]{display:none}
  .ap-ber .apb-alle{position:relative;z-index:1;display:flex;align-items:center;gap:4px;align-self:flex-start;margin:8px 14px 14px;padding:8px 14px;border:0;border-radius:12px;background:rgba(0,0,0,.2);cursor:pointer;font:700 14px "Lexend",system-ui,sans-serif;color:#fff}
}
/* iPad quer: Seitenleiste */
@media (min-width:1000px) and (orientation:landscape){
  body.ep-app{padding-bottom:0;padding-left:140px}
  #epTabs{left:16px;top:16px;bottom:16px;right:auto;width:108px;height:auto;max-width:none;margin:0;grid-template-columns:none;grid-template-rows:repeat(4,72px) 1fr;align-content:start;padding:16px 10px;border-radius:30px}
  #epTabs button{font-size:12px;border-radius:22px}
  #epTabs button[data-tab="profil"]{align-self:end;height:88px}
  .ap-heute{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-template-rows:auto minmax(0,1.9fr) minmax(0,1fr);gap:16px}
  .ap-heute .ap-gruss{grid-column:1/-1;grid-row:1;margin-bottom:-40px}
  .ap-heute .ap-karu{grid-column:1/3;grid-row:2;min-height:0;margin-top:40px}
  .ap-heute .ap-kopf{display:none}
  .ap-heute .ap-tag{grid-column:3;grid-row:2;grid-template-columns:1fr;grid-auto-rows:1fr;margin-top:40px}
  .ap-heute .ap-tag button{display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto auto;column-gap:14px;row-gap:2px;align-content:center;min-height:0}
  .ap-heute .ap-tag button .apico{grid-row:1/3}
  .ap-heute .ap-woche,.ap-heute .ap-fakt,.ap-heute .ap-weiter{grid-row:3;height:100%;align-items:flex-start}
  .ap-heute .ap-woche{grid-column:1}.ap-heute .ap-fakt{grid-column:2;display:flex!important}.ap-heute .ap-weiter{grid-column:3;display:flex}
  .ap-heute .ap-woche .aptx{height:100%}
  .ap-themen .ap-ber{grid-template-columns:repeat(4,minmax(0,1fr))}
  .ap-ber .apb-kopf{min-height:178px}
  .ap-ber .apb-liste{flex-direction:column;flex-wrap:nowrap;gap:6px}
  .ap-ber .apc{width:100%;min-height:40px}
  .ap-ber .apc .apcn{flex:1}
  .ap-themen .ap-unten{grid-template-columns:repeat(3,minmax(0,1fr))}
  .ap-duell{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-template-rows:auto minmax(0,1fr) auto;gap:16px}
  .ap-duell .ap-titel{grid-column:1/-1}
  .ap-duell .ap-bereit{grid-column:1/3;min-height:0}
  .ap-duell .ap-top{grid-column:3;grid-row:2;display:flex;flex-direction:column;gap:10px;padding:22px}
  .ap-duell .ap-top img{position:absolute;right:6px;bottom:-8px;height:58%}
  .ap-duell .ap-top p{margin:0;max-width:60%;font:500 15px/1.45 "Lexend",system-ui,sans-serif;color:rgba(255,255,255,.9)}
  .ap-duell .ap-top b{font:700 22px "Fredoka",system-ui,sans-serif;display:flex;gap:8px;align-items:center}
  .ap-duell .ap-zwei{display:contents}
  .ap-duell .ap-zwei .gold{display:none}
  .ap-profil{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-template-rows:auto minmax(0,1fr) auto;gap:16px}
  .ap-profil .ap-konto{min-height:0}
  .ap-profil .ap-liste{align-self:end}
  .ap-profil .ap-titel{grid-column:1/-1}
  .ap-profil .ap-konto{grid-column:1/3}
  .ap-profil .ap-stats{grid-column:3;grid-template-columns:1fr;grid-auto-rows:1fr}
  .ap-profil .ap-liste{grid-column:1/3;grid-row:3;grid-template-columns:repeat(2,minmax(0,1fr));align-content:start}
  .ap-profil .ap-ersch{grid-column:3;grid-row:3;align-self:stretch;height:100%}
  .ap-profil .ap-liste>*{min-height:44px}
}

/* Held-Karussell: 5 Karten, alle 10 s weiter, wischen möglich */
.ap-karu{position:relative;flex:1 1 0;min-height:180px;margin-top:58px;display:flex;flex-direction:column;min-width:0}
.ap-karu-spur{flex:1 1 0;min-height:0;display:flex;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;scrollbar-width:none;gap:12px;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain}
.ap-karu-spur::-webkit-scrollbar{display:none}
.ap-karu-spur>.ap-held{flex:0 0 100%;scroll-snap-align:start;margin-top:0;min-height:0;height:100%;overflow:visible}
.ap-karu-punkte{display:flex;justify-content:center;gap:5px;height:14px;align-items:center;margin-top:2px}
.ap-karu-punkte i{width:6px;height:6px;border-radius:3px;background:rgba(255,255,255,.45);transition:width .25s,background .25s}
.ap-karu-punkte i.an{width:18px;background:#fff}
.ap-held2 .apht{width:66%;gap:5px}
.ap-held2 .aphoi{display:flex;align-items:center;gap:6px;font-weight:700}
.ap-held2 .aph-ic{display:inline-grid;place-items:center;width:28px;height:28px;border-radius:9px;background:#fff;color:#1B2240;font-size:16px;line-height:0}
.ap-held2 .aph-klein{font-size:clamp(20px,5.4vw,36px)!important;line-height:1.08!important;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.ap-held2 .aph-text{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.35}
.ap-held2>img{height:calc(100% + 30px);max-width:32%}
.ap-held.hs-lib1,.ap-held.hs-lib2{background:linear-gradient(140deg,#8A3B0C,#D97A1A)!important}
.ap-held.hs-tq{background:linear-gradient(140deg,#2E4BEA,#5B6CFF)!important}
.ap-held.hs-live{background:linear-gradient(140deg,#B0216F,#E043B8)!important}
.ap-held.hs-duell{background:linear-gradient(140deg,#0A6575,#0E9384)!important}
/* Kachel-Reihe: 6 Kacheln, 3 sichtbar, wischen */
.ap-tagswipe{display:grid;grid-template-columns:none!important;grid-auto-flow:column;grid-auto-columns:calc((100% - 20px) / 3);overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;padding-bottom:2px;overscroll-behavior-x:contain}
.ap-tagswipe::-webkit-scrollbar{display:none}
.ap-tagswipe>button{scroll-snap-align:start}
@media (min-width:700px){.ap-tagswipe{grid-auto-columns:calc((100% - 30px) / 4)}}
@media (min-width:1000px) and (orientation:landscape){.ap-heute .ap-tagswipe{grid-template-columns:1fr!important;grid-auto-flow:row;grid-auto-columns:auto;grid-auto-rows:1fr;overflow:visible;gap:8px}.ap-heute .ap-tagswipe button{padding:8px 14px;min-width:0}.ap-heute .ap-tagswipe button .apico{width:38px;height:38px}.ap-heute .ap-tagswipe button b{font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}.ap-heute .ap-tagswipe button small{font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}}
.ap-ersch{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px;width:100%;box-sizing:border-box;cursor:pointer}
.ap-ersch .aptx{display:flex;flex-direction:column;gap:2px;flex:1;min-width:0}
.ap-ersch b{font:600 15px "Fredoka",system-ui,sans-serif}.ap-ersch small{font:400 12px "Lexend",system-ui,sans-serif;color:rgba(255,255,255,.85)}
.ap-sw{position:relative;flex:none;width:50px;height:30px;border-radius:15px;background:rgba(255,255,255,.3);transition:background .25s}
.ap-sw i{position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:12px;background:#fff;transition:left .25s}
.ap-ersch[aria-pressed="true"] .ap-sw{background:#12B76A}.ap-ersch[aria-pressed="true"] .ap-sw i{left:23px}

/* ---------- Bereich-Seite: Stufen passen, Themen als wischbare Seiten ---------- */
body.ep-app .st-kopf .sbtns button{font-size:.72rem!important;padding:4px 2px!important;min-height:36px;white-space:normal!important;line-height:1.05;letter-spacing:0}
body.ep-app .st-kopf .bhead h1{font-size:clamp(1.3rem,5.4vw,1.8rem)!important}
body.ep-app .ap-tp{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;gap:12px;margin:0 -2px;padding:0 2px 4px;overscroll-behavior-x:contain}
body.ep-app .ap-tp::-webkit-scrollbar{display:none}
body.ep-app .ap-tp .ap-tpage{flex:0 0 100%;scroll-snap-align:start;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;align-content:start}
body.ep-app .ap-tp .thema{min-height:0!important;padding:12px 12px 10px!important;border-radius:20px!important;display:grid!important;grid-template-columns:44px 1fr;grid-template-rows:auto auto;column-gap:10px;row-gap:2px;align-items:center;text-align:left}
body.ep-app .ap-tp .thema .emo{width:44px!important;height:44px!important;font-size:1.6rem!important;border-radius:14px!important;grid-row:1/3;margin:0!important;transform:none!important}
body.ep-app .ap-tp .thema .emo svg,body.ep-app .ap-tp .thema .emo img{width:26px;height:26px}
body.ep-app .ap-tp .thema>span:not(.emo){display:contents}
body.ep-app .ap-tp .thema b{font-size:.98rem!important;line-height:1.15!important;white-space:normal!important;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
body.ep-app .ap-tp .thema span.t{display:none!important}
body.ep-app .ap-tp .thema span.n{margin:0!important;font-size:.7rem!important;padding:2px 8px!important;justify-self:start;background:rgba(15,20,48,.3)!important}
body.ep-app .ap-tp .thema .step{display:none}
body.ep-app .ap-tp .thema::before{display:none}
body.ep-app .ap-tpunkte{display:flex;justify-content:center;gap:5px;height:14px;align-items:center;margin:4px 0 0}
body.ep-app .ap-tpunkte i{width:6px;height:6px;border-radius:3px;background:rgba(27,34,64,.35);transition:width .25s,background .25s}
body.ep-app .ap-tpunkte i.an{width:18px;background:#1B2240}
body.ep-app.ep-s-bereich,body.ep-app.ep-s-submenu{overflow:hidden}
@media (min-width:700px){body.ep-app .ap-tp .ap-tpage{grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}body.ep-app .ap-tp .thema{padding:18px 16px 16px!important;grid-template-columns:56px 1fr;column-gap:14px!important}body.ep-app .ap-tp .thema .emo{width:56px!important;height:56px!important;font-size:2rem!important}body.ep-app .ap-tp .thema b{font-size:1.15rem!important}body.ep-app .ap-tp .thema span.n{font-size:.8rem!important;padding:3px 10px!important}}

/* ---------- Quiz: alles auf einem Bildschirm ---------- */
body.ep-app.ep-s-quiz .wrap{padding-top:calc(8px + env(safe-area-inset-top))!important}
body.ep-app.ep-s-quiz .eplegal{display:none}
body.ep-app.ep-s-quiz .qtop{margin:0 0 8px;gap:8px}
body.ep-app.ep-s-quiz .qtop .count{font-size:.82rem;background:rgba(27,34,64,.62);color:#fff;border-radius:999px;padding:4px 12px;font-weight:700;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
body.ep-app.ep-s-quiz .qtop .timer{background:rgba(27,34,64,.62);color:#fff;border-radius:999px;padding:4px 12px;font-weight:700}
body.ep-app.ep-s-quiz .qtop .bar{height:8px;border-radius:4px;background:rgba(255,255,255,.55);flex:1 1 100%;order:-1}
body.ep-app.ep-s-quiz .qnav{display:grid;grid-template-columns:48px 48px 1fr 48px auto;gap:6px;margin:0 0 10px;background:rgba(27,34,64,.62);border:1px solid rgba(255,255,255,.14);border-radius:999px;padding:5px;-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px)}
body.ep-app.ep-s-quiz .qnbtn{min-height:40px!important;border:0!important;border-radius:999px!important;background:transparent!important;color:#fff!important;font:700 .9rem "Lexend",system-ui,sans-serif!important;padding:0 6px!important;box-shadow:none!important;display:inline-flex;align-items:center;justify-content:center;gap:4px;white-space:nowrap}
body.ep-app.ep-s-quiz .qnbtn .tlab{display:none}
body.ep-app.ep-s-quiz .qnbtn.mark.on{background:rgba(255,227,77,.25)!important}
body.ep-app.ep-s-quiz .qnbtn#qGrid{background:rgba(255,255,255,.12)!important}
body.ep-app.ep-s-quiz .qnbtn.abgabe{background:linear-gradient(135deg,#FFE15A,#FFC23A)!important;color:#1B2240!important;padding:0 14px!important}
body.ep-app.ep-s-quiz .qnbtn:disabled{opacity:.35}
body.ep-app.ep-s-quiz .qgrid{margin-bottom:10px}
body.ep-app.ep-s-quiz .card{padding:14px 14px 12px!important;border-radius:24px!important}
body.ep-app.ep-s-quiz .tabs{margin-bottom:10px;gap:6px}
body.ep-app.ep-s-quiz .tabbtn{min-height:42px;font-size:.92rem;border-width:2px;border-radius:12px}
body.ep-app.ep-s-quiz .speakrow{display:flex;justify-content:flex-end;margin:0 0 4px}
body.ep-app.ep-s-quiz .speak{min-height:34px;padding:4px 10px;font-size:.8rem;border-width:1.5px;border-radius:999px}
body.ep-app.ep-s-quiz .modebadge{font-size:.78rem;margin-bottom:6px}
body.ep-app.ep-s-quiz .question{font-size:clamp(1.05rem,4.6vw,1.35rem)!important;margin:0 0 12px;text-align:center}
body.ep-app.ep-s-quiz .qimg{max-height:120px;margin-bottom:8px}
body.ep-app.ep-s-quiz .qimg svg,body.ep-app.ep-s-quiz .qimg img{max-height:120px;width:auto}
body.ep-app.ep-s-quiz .answers{gap:8px}
body.ep-app.ep-s-quiz .ans{min-height:50px!important;padding:8px 12px!important;font-size:.98rem!important;border-radius:14px!important;border-width:0!important;box-shadow:0 4px 0 rgba(0,0,0,.18)!important;color:#fff!important;gap:10px}
body.ep-app.ep-s-quiz .ans:nth-child(1){background:linear-gradient(135deg,#5B7CFF,#3D5AFE)!important}
body.ep-app.ep-s-quiz .ans:nth-child(2){background:linear-gradient(135deg,#FF6FB5,#E043B8)!important}
body.ep-app.ep-s-quiz .ans:nth-child(3){background:linear-gradient(135deg,#2FD1A7,#12A57F)!important}
body.ep-app.ep-s-quiz .ans:nth-child(4){background:linear-gradient(135deg,#FFB347,#FF8A1A)!important}
body.ep-app.ep-s-quiz .ans .key{background:rgba(255,255,255,.25)!important;color:#fff!important;border:0!important;width:30px;height:30px;min-width:30px;border-radius:9px;font-size:.9rem}
body.ep-app.ep-s-quiz .ans.right{box-shadow:0 0 0 3px #12B76A,0 4px 0 rgba(0,0,0,.18)!important}
body.ep-app.ep-s-quiz .ans.wrong{opacity:.45}
body.ep-app.ep-s-quiz .ans:disabled:not(.right):not(.wrong){opacity:.45}
body.ep-app.ep-s-quiz .tasthinweis,body.ep-app.ep-s-quiz .qnr{display:none!important}
body.ep-app.ep-s-quiz .feedback{margin-top:10px;padding:10px 12px;border-radius:16px}
body.ep-app.ep-s-quiz .feedback p{margin:0 0 6px;font-size:.95rem}
body.ep-app.ep-s-quiz .feedback .pdetail{font-size:.78rem}
body.ep-app.ep-s-quiz .feedback .row{gap:8px}
body.ep-app.ep-s-quiz .feedback .big{min-height:44px;padding:8px 14px;font-size:.92rem;border-radius:12px;flex:1}
body.ep-app.ep-s-quiz .explain{padding:0}
body.ep-app.ep-s-quiz .explain .pic{display:none}
body.ep-app.ep-s-quiz .explain p{font-size:.95rem;margin:6px 0}
body.ep-app.ep-s-quiz .explain .merke{font-size:.92rem;padding:8px 12px}
body.ep-app.ep-s-quiz .explain .big{min-height:44px;font-size:.92rem}
@media (max-height:720px){body.ep-app.ep-s-quiz .question{font-size:1rem!important;margin-bottom:8px}body.ep-app.ep-s-quiz .ans{min-height:44px!important;font-size:.9rem!important}}
/* iPad: Quiz grösser und mittig */
@media (min-width:700px){
  body.ep-app.ep-s-quiz .qtop,body.ep-app.ep-s-quiz .qnav,body.ep-app.ep-s-quiz .card,body.ep-app.ep-s-quiz .qgrid{max-width:860px;margin-left:auto!important;margin-right:auto!important}
  body.ep-app.ep-s-quiz .qtop{margin-bottom:10px!important}body.ep-app.ep-s-quiz .qnav{margin-bottom:14px!important}
  body.ep-app.ep-s-quiz .card{padding:22px 24px 20px!important;border-radius:30px!important}
  body.ep-app.ep-s-quiz .question{font-size:1.55rem!important;margin:6px 0 18px;line-height:1.3}
  body.ep-app.ep-s-quiz .qimg,body.ep-app.ep-s-quiz .qimg svg,body.ep-app.ep-s-quiz .qimg img{max-height:220px}
  body.ep-app.ep-s-quiz .answers{gap:12px}
  body.ep-app.ep-s-quiz .ans{min-height:64px!important;font-size:1.15rem!important;padding:12px 18px!important;border-radius:18px!important}
  body.ep-app.ep-s-quiz .ans .key{width:36px;height:36px;min-width:36px;font-size:1rem}
  body.ep-app.ep-s-quiz .tabbtn{min-height:48px;font-size:1rem}
  body.ep-app.ep-s-quiz .feedback p,body.ep-app.ep-s-quiz .explain p{font-size:1.05rem}
}
@media (min-width:1000px) and (orientation:landscape){body.ep-app.ep-ohne{padding-left:0}}

/* ---------- Zusammenfassung: kompakt ---------- */
body.ep-app.ep-s-done .done{padding:14px 12px!important}
body.ep-app.ep-s-done .done h1{font-size:1.5rem!important;margin:4px 0}
body.ep-app.ep-s-done .stars{font-size:2rem;margin:2px 0}
body.ep-app.ep-s-done .done>p{font-size:.9rem;margin:4px 0}
body.ep-app.ep-s-done .pbilanz{gap:6px;font-size:.8rem}
body.ep-app.ep-s-done .done .row{gap:8px;margin:10px 0}
body.ep-app.ep-s-done .done .row .big{min-height:44px;padding:8px 12px;font-size:.9rem;flex:1 1 auto;border-radius:12px}
body.ep-app.ep-s-done .summary{margin-top:10px}
body.ep-app.ep-s-done .summary h2{font-size:1.05rem;margin:0 0 6px}
body.ep-app.ep-s-done .sumline .pill{font-size:.85rem;padding:4px 10px}
body.ep-app.ep-s-done .review{margin-top:8px;gap:6px}
body.ep-app.ep-s-done .review[hidden]{display:none}
body.ep-app.ep-s-done .rev{padding:8px 10px;border-radius:12px;font-size:.85rem;gap:2px}
body.ep-app.ep-s-done .rev p,body.ep-app.ep-s-done .rev .revex{display:none}
body.ep-app.ep-s-done .rev .revhead b{font-weight:600}
body.ep-app.ep-s-done .ap-revbtn{width:100%;min-height:44px;border:2px solid var(--line);border-radius:12px;background:var(--surface);font:700 .92rem "Lexend",system-ui,sans-serif;color:var(--ink);margin-top:8px}
body.ep-app.ep-s-done .more{display:none}
@media (min-width:700px){
  body.ep-app.ep-s-done .done{max-width:760px;margin:6vh auto 0!important;padding:26px 28px 22px!important;border-radius:30px!important}
  body.ep-app.ep-s-done .done h1{font-size:2rem!important;margin:6px 0 10px}
  body.ep-app.ep-s-done .stars{font-size:2.6rem}
  body.ep-app.ep-s-done .done>p{font-size:1.05rem}
  body.ep-app.ep-s-done .pbilanz{font-size:.95rem;gap:10px}
  body.ep-app.ep-s-done .done .row{gap:12px;margin:16px 0}
  body.ep-app.ep-s-done .done .row .big{min-height:54px;font-size:1.05rem;border-radius:16px}
  body.ep-app.ep-s-done .summary h2{font-size:1.2rem}
  body.ep-app.ep-s-done .sumline .pill{font-size:1rem;padding:6px 14px}
  body.ep-app.ep-s-done .ap-revbtn{min-height:50px;font-size:1rem}
  body.ep-app.ep-s-done .rev{font-size:.95rem;padding:10px 14px}
}


/* ---------- Bibliothek auf dem Handy: Suche und Bücher auf einem Bildschirm ---------- */
body.ep-app.ep-s-lib{overflow:hidden}
body.ep-app.ep-s-lib .libhero,body.ep-app.ep-s-lib .libhint,body.ep-app.ep-s-lib .eplegal,body.ep-app.ep-s-lib .libkopf .st-libkids{display:none!important}
body.ep-app.ep-s-lib .libhome-suche{margin:0 0 10px}
body.ep-app.ep-s-lib .libhome-suche input{min-height:46px;border-radius:16px;font-size:.95rem}
body.ep-app.ep-s-lib .libszene{display:none!important}
body.ep-app.ep-s-lib .regal{background:linear-gradient(180deg,#9C6A3F,#7A4F2A);border-radius:22px;padding:10px 8px 12px!important;box-shadow:0 8px 0 #4E3119,0 20px 30px -18px rgba(0,0,0,.5);margin:0!important}
body.ep-app.ep-s-lib .regal .regaltitel{display:none}
body.ep-app.ep-s-lib .regal .buecher{gap:10px 8px!important}
body.ep-app.ep-s-lib .regal .buch{aspect-ratio:3/4!important;height:auto!important}
@media (min-width:700px){body.ep-app.ep-s-lib .regal .regaltitel{display:block;color:#fff;font:800 1.05rem "Bricolage Grotesque",sans-serif;text-align:center;margin:2px 0 8px}}
body.ep-app.ep-s-lib .regal .buch .bcover{padding:8px 6px!important}
body.ep-app.ep-s-lib .buch .bemo2{font-size:1.9rem!important}
body.ep-app.ep-s-lib .buch .btitel{font-size:.88rem!important}
body.ep-app.ep-s-lib .buch .bunter{font-size:.58rem!important;line-height:1.2}
body.ep-app.ep-s-lib .buch .btop{font-size:.55rem;bottom:6px;left:6%;right:6%}
body.ep-app.ep-s-lib .ap-libkids{display:flex;justify-content:center;align-items:flex-end;gap:0;height:74px;margin:-10px 0 -8px;position:relative;z-index:2;pointer-events:none}
body.ep-app.ep-s-lib .ap-libkids img{height:100%;filter:drop-shadow(0 8px 10px rgba(0,0,0,.35))}
body.ep-app.ep-s-lib .ap-libkids img+img{margin-left:-6px}
@media (min-width:700px){body.ep-app.ep-s-lib .regal .buecher{grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:16px 14px!important}body.ep-app.ep-s-lib .buch .bemo2{font-size:2.6rem!important}body.ep-app.ep-s-lib .buch .btitel{font-size:1.1rem!important}body.ep-app.ep-s-lib .buch .bunter{font-size:.72rem!important}body.ep-app.ep-s-lib .ap-libkids{height:150px}}
@media (max-height:720px) and (max-width:699px){body.ep-app.ep-s-lib .ap-libkids{display:none}body.ep-app.ep-s-lib .regal .buecher{gap:8px!important}}

/* Begrüssung oben auf Heute */
.ap-gruss{display:flex;flex-direction:column;gap:2px;padding:0 4px;margin-bottom:-46px;position:relative;z-index:0}
.ap-gruss b{font:800 30px/1.05 "Bricolage Grotesque","Fredoka",system-ui,sans-serif;color:#fff;letter-spacing:-.01em}
.ap-gruss span{font:600 15px "Lexend",system-ui,sans-serif;color:#fff}
.ap-gruss .ap-logo{position:absolute;right:0;top:-2px;height:46px;width:auto;filter:drop-shadow(0 4px 8px rgba(40,30,120,.3))}
@media (min-width:700px){.ap-gruss .ap-logo{height:72px}}
@media (max-height:720px) and (max-width:699px){.ap-gruss .ap-logo{height:38px}}
@media (min-width:700px){.ap-gruss{margin-bottom:-70px}.ap-gruss b{font-size:44px}.ap-gruss span{font-size:18px}}
@media (max-height:720px) and (max-width:699px){.ap-gruss b{font-size:24px}.ap-gruss span{font-size:13px}.ap-gruss{margin-bottom:-40px}}

/* Unterseiten: Kopfzeile mit Zurück, ohne Brotkrumen */
body.ep-app .crumbs{display:none!important}
.ap-kz{display:flex;align-items:center;gap:12px;margin:0 0 14px;min-height:48px}
.ap-kz h1{margin:0;flex:1;min-width:0;font:800 24px/1.1 "Bricolage Grotesque","Fredoka",system-ui,sans-serif;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 2px 3px rgba(27,34,64,.5),0 2px 14px rgba(27,34,64,.45)}
.ap-zbtn{display:inline-flex;align-items:center;gap:6px;height:48px;padding:0 16px 0 12px;border:1px solid rgba(255,255,255,.18);border-radius:24px;background:rgba(27,34,64,.7);color:#fff;font:700 15px "Lexend",system-ui,sans-serif;cursor:pointer;flex:none;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);box-shadow:0 10px 20px -12px rgba(27,34,64,.7)}
@media (min-width:700px){.ap-kz h1{font-size:32px}}
/* Deko auf Unterseiten weg, damit nichts abgeschnitten wird */
body.ep-app .gaeste,body.ep-app .libgast,body.ep-app .bereichgaeste,body.ep-app .libbuchani{display:none!important}
body.ep-app .libhero{padding:14px 16px!important;min-height:0!important}
body.ep-app .libhero h1{display:none}
body.ep-app .libhero p{margin:0!important;font-size:.95rem!important}
/* Bibliothek: Bücher kleiner, drei pro Reihe (Handy), fünf (iPad) */
body.ep-app .regal{padding:0 4px!important}
body.ep-app .regal .buecher{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:14px 10px!important;padding:4px 6px 0!important;justify-items:stretch}
body.ep-app .regal .buch{width:100%!important;max-width:none!important;height:auto!important;aspect-ratio:2/3}
body.ep-app .regal .buch .bemo2{font-size:2.1rem!important}
body.ep-app .regal .buch .btitel{font-size:.95rem!important}
body.ep-app .regal .buch .bunter{font-size:.62rem!important;line-height:1.2}
body.ep-app .regal .buch .blogo{font-size:.58rem!important;bottom:8px!important}
@media (min-width:700px){body.ep-app .regal .buch .bemo2{font-size:2.8rem!important}body.ep-app .regal .buch .btitel{font-size:1.15rem!important}body.ep-app .regal .buch .bunter{font-size:.75rem!important}}
body.ep-app .sbrett{display:none!important}
@media (min-width:700px){body.ep-app .regal .buecher{grid-template-columns:repeat(5,minmax(0,1fr))!important}}
@media (min-width:1000px) and (orientation:landscape){body.ep-app.ep-s-lib .regal .buecher{grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:12px 14px!important}body.ep-app.ep-s-lib .regal .buch{aspect-ratio:1/1!important}body.ep-app.ep-s-lib .ap-libkids{display:none}body.ep-app.ep-s-lib .regal .regaltitel{display:none}body.ep-app.ep-s-lib .libhome-suche input{min-height:44px}body.ep-app.ep-s-lib .buch .bemo2{font-size:2.2rem!important}body.ep-app.ep-s-lib .buch .btitel{font-size:1rem!important}}
/* Wettbewerb, Duell & Hardcore: kompakte Karten */
body.ep-app .smwrap .pagehead{display:none!important}
body.ep-app .smgitter{display:grid!important;grid-template-columns:1fr!important;gap:12px!important}
body.ep-app .smkarte{display:grid!important;grid-template-columns:auto 1fr;grid-template-rows:auto auto;column-gap:14px;align-items:center;text-align:left!important;min-height:0!important;padding:16px 18px!important}
body.ep-app .smkarte .smemo{grid-row:1/3;font-size:34px!important;margin:0!important}
body.ep-app .smkarte b{margin:0!important}
@media (min-width:700px){body.ep-app .smgitter{grid-template-columns:repeat(3,minmax(0,1fr))!important}body.ep-app .smkarte{grid-template-columns:1fr;grid-template-rows:auto;text-align:center!important;justify-items:center;padding:26px 18px!important}body.ep-app .smkarte .smemo{grid-row:auto;font-size:44px!important}}
/* Rangliste: Umschalter als Leiste über der Tab-Leiste, Season mit Symbol */
body.ep-app.ep-s-board{padding-bottom:calc(170px + env(safe-area-inset-bottom))}
body.ep-app.ep-s-board .rlmodus{position:fixed!important;z-index:59;left:50%;transform:translateX(-50%);bottom:calc(92px + env(safe-area-inset-bottom));margin:0!important;width:max-content!important;max-width:calc(100vw - 24px)!important;padding:5px!important;gap:4px!important;border-radius:20px;background:rgba(27,34,64,.88);border:1px solid rgba(255,255,255,.14);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);box-shadow:0 14px 30px -14px rgba(27,34,64,.7)}
body.ep-app.ep-s-board .rlmodus .seg{display:inline-flex!important;align-items:center;gap:6px;border:0!important;border-radius:16px!important;background:none!important;color:rgba(255,255,255,.8)!important;font:600 14px "Lexend",system-ui,sans-serif!important;padding:9px 14px!important;box-shadow:none!important;min-height:42px}
body.ep-app.ep-s-board .rlmodus .seg[aria-pressed="true"]{background:linear-gradient(135deg,#3D5AFE,#8A3FE0 60%,#E043B8)!important;color:#fff!important}
@media (min-width:1000px) and (orientation:landscape){body.ep-app.ep-s-board{padding-bottom:90px}body.ep-app.ep-s-board .rlmodus{bottom:16px;left:calc(50% + 70px)}}
body.ep-app .rlpokal{display:none!important}
body.ep-app .rlintro{font-size:.9rem!important;margin-top:0!important}
body.ep-app .seasonband{display:grid!important;grid-template-columns:auto 1fr;gap:12px;align-items:center;text-align:left}
body.ep-app .seasonband .stier{width:52px;height:52px;border-radius:16px;display:grid!important;place-items:center;background:linear-gradient(135deg,#FFB020,#E8621A);color:#fff;font-size:0!important;flex:none}
body.ep-app .seasonband .sbtext{min-width:0}
body.ep-app .seasonband .sbinfo{flex-wrap:wrap}
body.ep-app .seasonband #zurSeason{grid-column:1/-1;justify-self:start}
body.ep-app .stimeline{max-width:100%;overflow:hidden}
/* Tagesquiz-Chat: feste Höhe, Nachrichten scrollen innen, Kids sichtbar */
body.ep-app .ep-chat{display:flex;flex-direction:column;max-width:760px;margin:0 auto}
body.ep-app .ep-chatkopf{flex:none;margin-bottom:10px!important}
body.ep-app .ep-chatbox{flex:1 1 0;min-height:120px!important;overflow-y:auto;overscroll-behavior:contain}
body.ep-app .ep-chatantw{flex:none}
body.ep-app .ep-chatantw button{padding:8px 13px!important;font-size:.85rem!important}
body.ep-app .ep-chatkids{flex:none;height:96px;margin:6px 0 0!important;overflow:visible}
body.ep-app .ep-chatkids img{height:96px!important}
@media (min-width:700px){body.ep-app .ep-chatkids,body.ep-app .ep-chatkids img{height:150px!important}}
/* Team-Auswahl: passt aufs Handy */
@media (max-width:699px){
  body.ep-app .ep-modal{padding:10px;align-items:center}
  body.ep-app .ep-box{padding:20px 14px 16px;max-height:calc(100dvh - 20px);overflow:auto;border-radius:24px}
  body.ep-app .ep-box h2{font-size:1.3rem;padding:0 30px}
  body.ep-app .ep-box .ep-mut{font-size:.85rem;margin:6px 0 0}
  body.ep-app .ep-teamgrid{grid-template-columns:1fr 1fr!important;gap:10px}
  body.ep-app .ep-team{min-height:200px!important;padding:12px!important;border-radius:20px;justify-content:flex-start}
  body.ep-app .ep-team img{height:110px!important;right:-6px}
  body.ep-app .ep-team p{display:none}
  body.ep-app .ep-team b{font-size:1.1rem}
  body.ep-app .ep-team small{font-size:.6rem}
  body.ep-app .ep-team .ep-btn{position:absolute;left:10px;bottom:10px;padding:8px 12px;font-size:.85rem;z-index:2}
}
/* Live-Quiz und andere Seiten: Abstand unten für die Leiste */
body.ep-app.ep-s-livequiz{padding-bottom:40px}
/* Thema der Woche */
.ap-seite{display:flex;flex-direction:column;gap:14px;color:#fff;max-width:760px;margin:0 auto}
.ap-seite .apf{border:0;border-radius:22px;color:#fff;box-shadow:0 16px 30px -18px rgba(27,34,64,.75);text-align:left;cursor:pointer;position:relative;overflow:hidden;font-family:inherit}
.ap-seite .f-teal{background:linear-gradient(140deg,#0A6575,#0E9384)}.ap-seite .f-blau{background:linear-gradient(140deg,#2E4BEA,#5B6CFF)}.ap-seite .f-lila{background:linear-gradient(140deg,#5B21B6,#8A3FE0)}
.ap-seite .aplbl{font:700 12px "Lexend",system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase}
.ap-wk{display:flex;flex-direction:column;gap:6px;padding:16px 18px;cursor:default}
.ap-wk b{font:800 26px/1.1 "Bricolage Grotesque","Fredoka",system-ui,sans-serif}
.ap-wk .apbar{height:8px;border-radius:4px;background:rgba(255,255,255,.25);overflow:hidden}.ap-wk .apbar i{display:block;height:100%;background:#FFE34D}
.ap-wk .apsub{font:400 13px "Lexend",system-ui,sans-serif;color:rgba(255,255,255,.9)}
.ap-lesen{background:rgba(27,34,64,.62);border:1px solid rgba(255,255,255,.16);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border-radius:22px;padding:16px 18px;display:flex;flex-direction:column;gap:10px}
.ap-lkopf{display:flex;gap:12px;align-items:flex-start}
.ap-lic{width:52px;height:52px;border-radius:16px;background:#fff;display:grid;place-items:center;font-size:30px;flex:none}
.ap-lic svg,.ap-lic img{width:34px;height:34px}
.ap-lesen h2{margin:2px 0 2px;font:800 22px "Bricolage Grotesque","Fredoka",system-ui,sans-serif}
.ap-lesen p{margin:0;font:400 14px/1.4 "Lexend",system-ui,sans-serif;color:rgba(255,255,255,.9)}
.ap-lesen ul{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px;font:500 15px/1.4 "Lexend",system-ui,sans-serif}
.ap-mehr{align-self:flex-start;display:inline-flex;align-items:center;gap:4px;border:0;border-radius:12px;padding:9px 14px;background:rgba(255,255,255,.16);color:#FFE34D;font:700 14px "Lexend",system-ui,sans-serif;cursor:pointer}
.ap-wahl{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.ap-wahl .apf{display:flex;flex-direction:column;align-items:flex-start;gap:8px;padding:16px;min-height:120px}
.ap-wahl .apf:disabled{opacity:.55;cursor:default}
.ap-wahl .aptx{display:flex;flex-direction:column;gap:2px}
.ap-wahl b{font:700 20px "Fredoka",system-ui,sans-serif}.ap-wahl small{font:400 12.5px/1.3 "Lexend",system-ui,sans-serif;color:rgba(255,255,255,.88)}
.ap-wahl .apico{width:44px;height:44px;border-radius:14px;display:grid;place-items:center;background:rgba(255,255,255,.2)}

/* Qeels: Stories, Symbole, grösserer Zurück-Knopf */
body.ep-app #reels:has(.rstories) .rinhalt{padding-top:176px;padding-bottom:130px}
body.ep-app #rZu{height:50px;padding:0 18px 0 14px!important;gap:6px;border-radius:25px;background:rgba(255,255,255,.95)!important;color:#1B2240!important;font:700 15px "Lexend",system-ui,sans-serif!important;justify-content:center;box-shadow:0 10px 24px -10px rgba(0,0,0,.6)}
body.ep-app #rZu svg{width:24px;height:24px}
body.ep-app #rZu .apzt{display:inline!important;font-size:15px!important}
body.ep-app .rstories .epalle{background:#fff}
body.ep-app .rstories .epalle b{background:linear-gradient(135deg,#3D5AFE,#8A3FE0)!important;color:#fff}
body.ep-app .rstories [data-alle][aria-selected="true"] .epalle{box-shadow:0 0 0 3px #FFE34D}
body.ep-app .rrail .rbi{display:grid;place-items:center;background:rgba(255,255,255,.18);border-radius:50%;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);box-shadow:inset 0 0 0 1px rgba(255,255,255,.25)}
body.ep-app .rrail .rbi svg{width:26px;height:26px;color:#fff}
body.ep-app .rrail .rlike[aria-pressed="true"] .rbi{background:rgba(255,61,110,.25)}
body.ep-app .rrail .rlike[aria-pressed="true"] .rbi svg{color:#FF3D6E;fill:#FF3D6E}
`;
document.head.appendChild(css);

/* ---------- Bausteine ---------- */
function liveInfo(){
  const ES = E(); try{
    const nl = ES.liveNaechster && ES.liveNaechster(); if(!nl) return null;
    const st = ES.liveStatus(nl), zeit = ES.slotLabel ? ES.slotLabel(nl) : String(nl.std).padStart(2,"0") + ":00";
    return {nl, st, zeit, thema:nl.thema ? nl.thema.name : "Gemischt", rest:nl.start - Date.now()};
  }catch(e){ return null; }
}
const zuletzt = () => { try{ return JSON.parse(localStorage.getItem((E().K && E().K.zuletzt) || "ep-zuletzt")); }catch(e){ return null; } };

function heuteHTML(){
  const ES = E(), n = (S.profil && S.profil.name) || "";
  let anz = 0; try{ anz = allCount(); }catch(e){}
  const themen = Object.keys(THEMA).filter(id => !THEMA[id].menu).length;
  const s = ES.serie ? ES.serie() : {n:0}, lv = ES.level ? ES.level() : null, tq = ES.tagesquiz ? ES.tagesquiz() : null, nf = ES.fehlerAnzahl ? ES.fehlerAnzahl() : 0;
  const li = liveInfo(), fk = ES.fakt ? ES.fakt() : null, zl = zuletzt();
  let wo = null; try{ wo = ES.woche(); }catch(e){}
  const erledigt = (tq ? 1 : 0) + (li && li.st === "ok" ? 1 : 0) + (nf ? 0 : 1);
  const liveTxt = !li ? "Heute vorbei" : li.st === "jetzt" ? "<b>Läuft jetzt!</b>" : `${h(li.thema)}, in <span id="epLiveCd">${ES.dauerText ? ES.dauerText(li.rest) : ""}</span>`;
  const wp = wo && wo.thema ? Math.min(100, Math.round(wo.r / wo.ziel * 100)) : 0;
  let slides = [{cls:"hs-start"}]; try{ slides = ES.heldSlides(); }catch(e){}
  const tageRest = wo && wo.ende ? Math.max(0, Math.ceil((wo.ende - Date.now()) / 864e5)) : 0;
  return `<div class="ap ap-heute">
    <div class="ap-gruss auf"><b>Hoi${n ? " " + h(n) : ""}!</b><span>Schön, dass du da bist.</span><img class="ap-logo" src="img/logo.webp" alt="easyplay"></div>
    <div class="ap-karu" id="apKaru"><div class="ap-karu-spur">${slides.map((sl, i) => `<section class="apf f-held ap-held ${sl.cls}${i ? " ap-held2" : ""}" data-i="${i}">${i ? `<div class="apht"><span class="aphoi">${sl.ic ? `<span class="aph-ic" aria-hidden="true">${sl.ic}</span>` : ""}${h(sl.lbl)}</span><h1 class="aph-klein">${h(sl.titel)}</h1><span class="apzahlen aph-text">${h(sl.text)}</span><button type="button" class="ap-weissbtn" data-x="${sl.a}"${sl.t ? ` data-t="${h(sl.t)}"` : ""}>${h(sl.btn)}</button></div><img class="hs-kid" src="${KIDS}${i % 2 ? "leni.webp" : "ben.webp"}" alt="">`
      : `<div class="apht"><h1>Spiel dich schlau!</h1><span class="apzahlen">${zahl(anz)} Fragen · ${themen} Themen</span><button type="button" class="ap-weissbtn" data-x="themen">${SV(I.play, 18)} Los geht's</button></div><img src="${KIDS}duo-jubel.webp" alt="Lumi und Milo jubeln"><span class="epname eplumi">Lumi</span><span class="epname epmilo">Milo</span>`}</section>`).join("")}</div>
      <div class="ap-karu-punkte" aria-hidden="true">${slides.map((x, i) => `<i${i ? "" : ' class="an"'}></i>`).join("")}</div></div>
    <div class="ap-kopf"><span class="aplbl pille">Dein Tag · ${erledigt} von 3</span><span class="ap-chips"><span class="glas">${SV(I.flamme, 16)}${s.n || 0}</span><span class="glas">${SV(I.stern, 16)}Lv ${lv ? lv.level : 1}</span></span></div>
    <div class="ap-tag ap-tagswipe" id="apTag">
      <button type="button" class="apf f-lila" data-x="zufall"><span class="apico">${SV(I.wuerfel, 20)}</span><b>Zufällige Fragen</b><small>Aus allen Themen</small></button>
      <button type="button" class="apf f-gold" data-x="lib"><span class="apico">${SV(I.buch, 20)}</span><b>Bibliothek</b><small>Lesen und entdecken</small></button>
      <button type="button" class="apf f-navy" data-x="profil"><span class="apico">${SV(I.stern, 20)}</span><b>Mein Level</b><small>${lv ? `Level ${lv.level} · ${h(lv.titel ? lv.titel.name : "")}` : "Level 1"}</small></button>
      <button type="button" class="apf f-blau${tq ? " ok" : ""}" data-x="chat"><span class="apico">${SV(I.kal, 20)}</span><b>Tagesquiz</b><small>${tq ? `Erledigt: ${tq.r} von ${tq.n}` : "5 neue Fragen"}</small></button>
      <button type="button" class="apf f-pink${li && li.st === "ok" ? " ok" : ""}" data-x="live"><span class="apico">${SV(I.live, 20)}</span><b>Live ${li ? li.zeit : ""}</b><small>${liveTxt}</small></button>
      <button type="button" class="apf f-orange${nf ? "" : " ok"}" data-x="fehler"${nf ? "" : " disabled"}><span class="apico">${SV(I.ziel, 20)}</span><b>Fehler üben</b><small>${nf ? nf + " offen" : "Alles geübt"}</small></button>
    </div>
    ${wo && wo.thema ? `<button type="button" class="apf f-teal ap-woche" data-x="wochebild"><span class="aptx"><small>Wochen-Challenge</small><b>${wo.fertig ? "Geschafft: " : "Thema der Woche: "}${h(wo.thema.name)}</b><span class="apbar"><i style="width:${wp}%"></i></span><span class="apz">${wo.r} von ${wo.ziel} richtig · noch ${tageRest} ${tageRest === 1 ? "Tag" : "Tage"}</span></span>${SV(I.pfeil, 22)}</button>` : ""}
    ${fk ? `<button type="button" class="apf f-navy ap-fakt" data-x="faktlib" data-t="${h(fk.t)}">${SV(I.birne, 22)}<span class="aptx"><span class="aplbl">Wusstest du?</span><p>${h(fk.text)}</p><em>In der Bibliothek lesen</em></span></button>` : ""}
    <button type="button" class="apf f-lila apzeile ap-weiter" data-x="${zl ? "weiter" : "zufall"}"><span class="aptx"><span class="aplbl">${zl ? "Weiterspielen" : "Überrasch dich"}</span><b style="font-size:22px">${h(zl ? zl.name : "Zufällige Fragen")}</b><small>${zl ? "Da weitermachen, wo du warst" : "Gemischte Fragen aus allen Themen deiner Stufe. Jedes Mal etwas Neues!"}</small></span><span class="apico">${SV(I.play, 20)}</span></button>
  </div>`;
}
function themenHTML(){
  let anz = 0; try{ anz = allCountL(S.stufe); }catch(e){}
  const SCH = {1:"Primarschule 1. bis 3. Klasse", 2:"4. bis 8. Klasse", 3:"Oberstufe bis Lehre und Studium"};
  const zl = zuletzt();
  const so = (typeof stufeObj === "function" ? stufeObj() : {name:""});
  return `<div class="ap ap-themen">
    <div class="ap-titel"><h2 class="auf">Themen</h2></div>
    <div class="glas ap-stufen" role="group" aria-label="Deine Stufe">${[...STUFEN, STUFE_ALLE].map(s => `<button type="button" data-s="${s.id}" aria-pressed="${S.stufe === s.id}"><b>${h(s.name)}</b><small>${h(s.alter)}</small></button>`).join("")}</div>
    <p class="ap-info pille">${h(so.name)}: ${zahl(anz)} Fragen, ${h(SCH[S.stufe] || "")}</p>
    <div class="ap-ber">${BEREICHE.map(b => { let c = 0; try{ c = countBereich(b, S.stufe); }catch(e){} let em = ""; try{ em = ico(b.emo); }catch(e){}
      const th = b.themen.filter(t => { try{ return t.menu || [1,2,3].some(l => countThema(t.id, l)); }catch(e){ return true; } });
      const chips = th.map(t => { let n = 0, ic = ""; try{ n = countThema(t.id, S.stufe); }catch(e){} try{ ic = themaIcon(t); }catch(e){}
        return `<button type="button" class="apc${n ? "" : " leer"}" data-tt="${h(t.id)}" data-bb="${b.id}"><span class="apci" aria-hidden="true">${ic}</span><span class="apcn">${h(t.name)}</span><small>${n ? zahl(n) : "0"}</small></button>`; }).join("");
      return `<div class="apb" style="--c:var(${b.c})"><span class="apwm" aria-hidden="true">${em}</span><button type="button" class="apb-kopf" data-b="${b.id}"><span class="apem" aria-hidden="true">${em}</span><span class="apn">${zahl(c)}<i> Fragen</i></span><b>${h(b.name)}</b><small>${h(b.text)}</small></button>
        <div class="apb-liste">${chips}</div><button type="button" class="apb-alle" data-b="${b.id}">Alle ${th.length} Themen ${SV(I.pfeil, 16)}</button></div>`; }).join("")}</div>
    <div class="ap-unten">
      <button type="button" class="apf f-lila apzeile" data-x="mix"><span class="apico">${SV(I.wuerfel, 20)}</span><span class="aptx"><b>Alles gemischt</b><small>Fragen aus jedem Bereich, passend zu ${h(so.name)}</small></span></button>
      <button type="button" class="apf f-gold apzeile" data-x="lib"><span class="apico">${SV(I.buch, 20)}</span><span class="aptx"><b>Bibliothek</b><small>Lesen und entdecken</small></span></button>
      ${zl ? `<button type="button" class="apf f-blau apzeile ap-weiter" data-x="weiter"><span class="apico">${SV(I.play, 20)}</span><span class="aptx"><b>${h(zl.name)}</b><small>Da weitermachen, wo du warst</small></span></button>` : ""}
    </div>
  </div>`;
}
function duellHTML(){
  const ES = E(), t = ES.team ? ES.team() : null, li = liveInfo();
  let se = null, p = null; try{ se = aktuelleSeason(); p = seasonPhase(se); }catch(e){}
  const seTxt = !p ? "" : p.mult > 1 ? `${h(p.text || "")} Noch ${p.rest} ${p.rest === 1 ? "Tag" : "Tage"}.` : `In ${p.bisBonus} ${p.bisBonus === 1 ? "Tag" : "Tagen"} Bonuswochen mit doppelten Punkten`;
  const liveTxt = !li ? "Heute keines mehr, morgen um 8 Uhr" : li.st === "jetzt" ? "Läuft jetzt, mitspielen!" : `${(ES.LIVE && ES.LIVE.fragen) || 20} Fragen, alle gleichzeitig`;
  return `<div class="ap ap-duell">
    <div class="ap-titel"><h2 class="auf">Duell</h2></div>
    <section class="apf ap-bereit"><h2>Bereit für dein Duell?</h2><p>Wähle dein Team, dann tritt gegen Freunde, Familie oder deine Klasse an.</p>
      <div class="apwahl"><span class="aplbl">Dein Team</span>
        <div class="apteam" role="group" aria-label="Team wählen"><button type="button" data-team="lumi" aria-pressed="${!!(t && t.id === "lumi")}">Lumi</button><button type="button" data-team="milo" aria-pressed="${!!(t && t.id === "milo")}">Milo</button></div>
        <button type="button" class="ap-gelbbtn" data-x="duell">${SV(I.duell, 18)} Duell starten</button></div>
      <img src="${KIDS}duo-bereit.webp" alt="Lumi und Milo kampfbereit"></section>
    <button type="button" class="apf f-navy ap-top" data-x="board"><b>${SV(I.pokal, 24)} Top 10 der Schweiz</b><p>Mach einen gewerteten Test und komm auf die Rangliste.</p><img src="${KIDS}j1.webp" alt=""></button>
    <button type="button" class="apf f-teal apzeile" data-x="live"><span class="apico">${SV(I.live, 22)}</span><span class="aptx"><b>Live-Quiz${li ? " " + li.zeit + " · " + h(li.thema) : ""}</b><small>${liveTxt}</small></span>${li && li.st !== "jetzt" ? `<span class="ap-cd" id="epLiveCd">${ES.dauerText ? ES.dauerText(li.rest) : ""}</span>` : ""}</button>
    <div class="ap-zwei">
      <button type="button" class="apf f-lila" data-x="spielmodi">${SV(I.pad, 24)}<b>Wettbewerb &amp; Hardcore</b></button>
      <button type="button" class="apf f-gold gold" data-x="board">${SV(I.pokal, 24)}<b>Top 10 der Schweiz</b></button>
    </div>
    ${se ? `<button type="button" class="apf f-gruen apzeile" data-x="season"><span class="ap-mult">×${p.mult}</span><span class="aptx"><b>${h(se.name)} · noch ${p.rest} Tage</b><small>${seTxt}</small></span>${SV(I.pfeil, 20)}</button>` : ""}
  </div>`;
}
function profilHTML(){
  const ES = E(), p = S.profil;
  const s = ES.serie ? ES.serie() : {n:0}, lv = ES.level ? ES.level() : null;
  let ab = {hat:0, alle:0}; try{ ab = ES.abzeichenZahl(); }catch(e){}
  let av = ""; try{ if(p) av = avatar(p.avatar); }catch(e){}
  const zeile = (attr, ico, txt, cls = "") => `<button type="button" ${attr}${cls ? ` class="${cls}"` : ""}>${SV(ico, 20)}<span>${txt}</span>${SV(I.pfeil, 18)}</button>`;
  return `<div class="ap ap-profil">
    <div class="ap-titel"><h2 class="auf">Profil</h2></div>
    <section class="apf f-held ap-konto">${p
      ? `<div class="apkn"><span class="apav">${av}</span><b class="apgross">${h(p.name || "")}</b><p>${lv ? `Level ${lv.level} · ${h(lv.titel ? lv.titel.name : "")}` : ""}</p><p>🔑 Code ${(() => { try{ const c = window.EP_PROFILCODE(); return c.slice(0, 4) + " " + c.slice(4); }catch(e){ return ""; } })()}</p></div><div class="apbtns"><button type="button" class="ap-weissbtn" data-x="meinprofil">Mein Profil</button></div>`
      : `<div class="apkn"><b class="apgross">Melde dich an</b><p>Dann bleiben deine Punkte, deine Serie und deine Abzeichen gespeichert.</p></div><div class="apbtns"><button type="button" class="ap-weissbtn" data-x="login">Anmelden</button><button type="button" class="ap-gelbbtn" data-x="register">Registrieren</button></div>`}
      <img src="${KIDS}m3.webp" alt=""></section>
    <div class="ap-stats">
      <div class="apf f-orange"><small>Serie</small><b>${s.n || 0} ${SV(I.flamme, 20)}</b><span>Tage am Stück</span></div>
      <div class="apf f-lila"><small>Level</small><b>${lv ? lv.level : 1}</b><span>${h(lv && lv.titel ? lv.titel.name : "Neuling")}</span></div>
      <div class="apf f-gold"><small>Abzeichen</small><b>${ab.hat}</b><span>von ${ab.alle}</span></div>
    </div>
    <button type="button" class="apf f-navy ap-ersch" data-x="erw" aria-pressed="${!!(ES.erwachsen && ES.erwachsen())}"><span class="aptx"><b>Erwachsenenmodus</b><small>Ohne Lumi, Milo, Leni und Ben, ohne Konfetti</small></span><span class="ap-sw"><i></i></span></button>
    <nav class="glas ap-liste" aria-label="Mehr">
      ${zeile('data-x="board"', I.pokal, "Rangliste")}
      ${zeile('data-x="lib"', I.buch, "Bibliothek")}
      ${zeile('data-m="set"', I.pinsel, "Hintergrund")}
      ${zeile('data-lm="lcode"', I.code, "Test mit Code")}
      ${zeile('data-m="suche"', I.lupe, "Test erstellen")}
      ${S.canEdit ? zeile('data-m="werkstatt"', I.werkzeug, "Fragen-Werkstatt") : ""}
      <a href="impressum.html">${SV(I.info, 20)}<span>Impressum</span>${SV(I.pfeil, 18)}</a>
      <a href="datenschutz.html">${SV(I.schild, 20)}<span>Datenschutz</span>${SV(I.pfeil, 18)}</a>
      ${p ? zeile('data-x="abmelden"', I.tuer, "Abmelden", "rot") : ""}
    </nav>
  </div>`;
}

/* ---------- Einpassen: jeder Bereich so hoch wie der freie Bildschirm ---------- */
function einpassen(){
  const ap = document.querySelector("#app > .ap"); if(!ap) return;
  const top = ap.getBoundingClientRect().top + scrollY;
  const quer = QUER.matches;
  const tabs = document.getElementById("epTabs"); const tr = tabs && !quer ? tabs.getBoundingClientRect() : null;
  const ende = tr ? tr.top - 10 : innerHeight - 16;
  ap.style.height = Math.max(300, Math.floor(ende - top)) + "px";
  ap.classList.remove("ap-eng");
  if(ap.scrollHeight > ap.clientHeight + 2) ap.classList.add("ap-eng");
  ap.querySelectorAll(".apb-liste").forEach(l => { const k = [...l.children]; k.forEach(c => c.hidden = false);
    const max = l.clientHeight - 4; k.forEach(c => { if(c.offsetTop + c.offsetHeight > max) c.hidden = true; }); });
}

/* ---------- Aktionen ---------- */
function menuKlick(sel){ const b = document.querySelector("#hauptmenue " + sel); if(b){ b.click(); return true; } return false; }
function binden(wurzel){
  const ES = E();
  wurzel.querySelectorAll("[data-x]").forEach(b => b.addEventListener("click", e => { e.stopPropagation(); const a = b.dataset.x;
    if(a === "board"){ S.boardStufe = S.stufe; go("board"); }
    else if(a === "season"){ try{ S.boardModus = "season"; S.boardSeason = aktuelleSeason().id; }catch(err){} go("board"); }
    else if(a === "lib"){ setLibModus(true); scrollTo(0, 0); }
    else if(a === "themen"){ setTab("themen"); go("home"); }
    else if(a === "wochebild") go("epwoche");
    else if(a === "faktlib") libThemaOeffnen(b.dataset.t);
    else if(a === "wochetest"){ const w = (() => { try{ return ES.woche(); }catch(err){ return null; } })(); if(w && w.thema){ S.thema = THEMA[w.thema.id] || w.thema; if(!S.profil){ S.after = "mode"; go("register"); return; } try{ startQuiz(w.thema.id, "test"); }catch(err){ go("mode"); } } }
    else if(a === "heim") go("home");
    else if(a === "wochelesen"){ const w = (() => { try{ return ES.woche(); }catch(err){ return null; } })(); if(w && w.thema) libThemaOeffnen(w.thema.id); }
    else if(a === "login") go("login");
    else if(a === "register") go("register");
    else if(a === "meinprofil") go("profil");
    else if(a === "abmelden"){ try{ abmelden(); }catch(err){} }
    else if(ES.aktion) ES.aktion(a, b); }));
  wurzel.querySelectorAll("[data-m]").forEach(b => b.onclick = () => { if(!menuKlick(`[data-m="${b.dataset.m}"]`)){ if(b.dataset.m === "set"){ try{ oeffneEinstellungen(); }catch(e){} } else go(b.dataset.m); } });
  wurzel.querySelectorAll("[data-lm]").forEach(b => b.onclick = () => { menuKlick(`[data-lm="${b.dataset.lm}"]`); });
  wurzel.querySelectorAll("[data-s]").forEach(b => b.onclick = () => { S.stufe = +b.dataset.s; try{ store.set("ep-stufe", S.stufe); }catch(e){} render(); });
  wurzel.querySelectorAll("[data-tt]").forEach(b => b.onclick = () => { const t = THEMA[b.dataset.tt]; if(!t) return; S.bereich = BEREICHE.find(x => x.id === b.dataset.bb); S.thema = t;
    if(t.menu === "submenu"){ S.menu = t.id; go("submenu"); } else if(t.menu) go(t.menu); else if(t.id === "beruf") go("berufmenu"); else go("mode"); });
  wurzel.querySelectorAll("[data-b]").forEach(b => b.onclick = () => { S.bereich = BEREICHE.find(x => x.id === b.dataset.b); go("bereich"); });
  wurzel.querySelectorAll("[data-team]").forEach(b => b.onclick = () => { try{ localStorage.setItem((ES.K && ES.K.team) || "ep-team", JSON.stringify(b.dataset.team)); }catch(e){} render(); });
}

/* ---------- Tab-Leiste ---------- */
function leiste(){
  let el = document.getElementById("epTabs");
  if(!an()){ if(el) el.remove(); return; }
  if(!el){
    el = document.createElement("nav"); el.id = "epTabs"; el.setAttribute("aria-label", "Hauptbereiche");
    el.innerHTML = TABS.map(t => `<button type="button" data-tab="${t}">${t === "profil" ? `<span class="tabav"><img src="${KIDS}m1.webp" alt=""></span>` : SV(I[t], 22)}<span>${TAB_NAME[t]}</span></button>`).join("");
    document.body.appendChild(el);
    el.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => { const t = b.dataset.tab;
      if(t === "qeels"){ try{ oeffneReels(); }catch(e){} return; }
      setTab(t); if(S.libModus){ S.libModus = false; document.documentElement.dataset.mode = "spiel"; } go("home"); });
  }
  const akt = S.libModus ? "themen" : tabVon(S.screen);
  el.querySelectorAll("[data-tab]").forEach(b => { if(b.dataset.tab === akt) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
}

/* ---------- Qeels: schönere Symbole und grösserer Zurück-Knopf ---------- */
const RAIL = [["like", I.herz], ["komm", I.sprechblase], ["teilen", I.teilen], ["vorlesen", I.laut], ["erkl", I.birne], ["qart", I.buch], ["lesen", I.buch], ["dazu", I.pad]];
function reelsSchmuck(){
  if(!an()) return; const o = document.getElementById("reels"); if(!o) return;
  const zu = document.getElementById("rZu"); if(zu && !zu.querySelector("svg")) zu.innerHTML = SV(I.zurueck, 24) + '<span class="apzt">Zurück</span>';
  const st = o.querySelector(".rstories");
  if(st && !st.querySelector("[data-alle]")){ const b = document.createElement("button"); b.type = "button"; b.dataset.alle = "1"; b.title = "Alles";
    b.innerHTML = `<span class="epring epalle"><b>${SV(I.themen, 24)}</b></span><span>Alles</span>`;
    b.onclick = () => { try{ rlTab(RL_TABS[0][0]); }catch(e){} st.querySelectorAll("button").forEach(x => x.setAttribute("aria-selected", x === b)); };
    st.prepend(b); }
  o.querySelectorAll(".rrail .rbtn").forEach(b => { const bi = b.querySelector(".rbi"); if(!bi || bi.querySelector("svg")) return;
    const r = RAIL.find(([k]) => b.dataset[k] !== undefined); if(r) bi.innerHTML = SV(r[1], 26); });
}
let reelsBeob = null;
const vorReels = window.oeffneReels;
if(typeof vorReels === "function"){
  window.oeffneReels = function(){
    const r = vorReels.apply(this, arguments);
    try{ reelsSchmuck(); const o = document.getElementById("reels");
      if(o && !reelsBeob){ reelsBeob = new MutationObserver(() => { reelsBeob.disconnect(); try{ reelsSchmuck(); }finally{ reelsBeob.observe(o, {childList:true, subtree:true}); } }); reelsBeob.observe(o, {childList:true, subtree:true}); } }catch(e){ console.warn("app.js", e); }
    return r;
  };
}

/* ---------- Bibliothek zu einem Thema öffnen ---------- */
function libThemaOeffnen(id){
  if(!id || !THEMA[id]){ setLibModus(true); return; }
  try{ LIB.thema = id; LIB.buch = (THEMA[id].bereich && THEMA[id].bereich.id) || LIB.buch; }catch(e){}
  S.libModus = true; document.documentElement.dataset.mode = "lib"; go("libthema");
}

/* ---------- Held-Karussell: alle 10 Sekunden weiter, Wischen erlaubt ---------- */
let karuTimer = null;
function karussell(){
  const k = document.getElementById("apKaru"); if(karuTimer){ clearInterval(karuTimer); karuTimer = null; } if(!k) return;
  const spur = k.querySelector(".ap-karu-spur"), punkte = [...k.querySelectorAll(".ap-karu-punkte i")], n = spur.children.length;
  const pos = () => Math.round(spur.scrollLeft / Math.max(1, spur.clientWidth + 12));
  const zeige = (i, sanft) => { spur.scrollTo({left:i * (spur.clientWidth + 12), behavior:sanft ? "smooth" : "auto"}); };
  spur.addEventListener("scroll", () => { const i = pos(); punkte.forEach((p, j) => p.classList.toggle("an", j === i)); }, {passive:true});
  let ruhe = 0; spur.addEventListener("pointerdown", () => { ruhe = Date.now() + 15000; }, {passive:true}); spur.addEventListener("touchstart", () => { ruhe = Date.now() + 15000; }, {passive:true});
  karuTimer = setInterval(() => { if(S.screen !== "home" || !document.getElementById("apKaru")){ clearInterval(karuTimer); karuTimer = null; return; } if(Date.now() < ruhe || document.hidden) return; zeige((pos() + 1) % n, !matchMedia("(prefers-reduced-motion: reduce)").matches); }, 10000);
}

/* ---------- Namensschilder Lumi und Milo im Startbanner ---------- */
function namenSetzen(){
  const held = document.querySelector("#app .ap-held"); if(!held) return; const img = held.querySelector(":scope > img"); if(!img) return;
  const go2 = () => { const hr = held.getBoundingClientRect(), ir = img.getBoundingClientRect(); if(!ir.width || !img.naturalWidth) return;
    const asp = img.naturalWidth / img.naturalHeight, w = Math.min(ir.width, ir.height * asp), hgt = w / asp, links = ir.right - w - hr.left, oben = ir.bottom - hgt - hr.top;
    const l = held.querySelector(".epname.eplumi"), m = held.querySelector(".epname.epmilo");
    if(l){ l.style.left = Math.round(links + w * .02) + "px"; l.style.top = Math.round(oben + hgt * .50) + "px"; l.style.right = "auto"; }
    if(m){ m.style.left = Math.round(links + w * .60) + "px"; m.style.top = Math.round(oben + hgt * .40) + "px"; m.style.right = "auto"; } };
  if(img.complete) go2(); else img.addEventListener("load", go2, {once:true});
}
addEventListener("resize", () => { try{ namenSetzen(); }catch(e){} });

/* ---------- Thema der Woche: Box mit dem Wichtigsten, dann Training oder Test ---------- */
function wocheHTML(){
  const ES = E(); let w = null; try{ w = ES.woche(); }catch(e){}
  if(!w || !w.thema) return `<div class="ap-seite"><p class="auf">Diese Woche gibt es kein Thema.</p></div>`;
  const t = THEMA[w.thema.id] || w.thema;
  let merk = []; try{ merk = [...new Set(libMerkliste(t.id).map(f => f.m).filter(Boolean))].slice(0, 6); }catch(e){}
  let ic = ""; try{ ic = themaIcon(t); }catch(e){}
  const p = Math.min(100, Math.round(w.r / w.ziel * 100)), rest = Math.max(0, w.ende - Date.now());
  const tage = Math.floor(rest / 864e5), std = Math.floor(rest % 864e5 / 36e5), min = Math.floor(rest % 36e5 / 6e4);
  let testOk = true; try{ testOk = pool(t.id).length >= TEST_MIN; }catch(e){}
  let abz = null; try{ abz = (JSON.parse(localStorage.getItem("ep-wochenabzeichen") || "[]")).find(x => x.w === w.w); }catch(e){}
  const bonus = ES.WOCHE_TEST_XP || 100, xp = window.WOCHE_XP || 150;
  return `<div class="ap-seite wk2">
    <button type="button" class="wk2-zurueck" data-x="heim">← Startseite</button>
    <section class="wk2-held"><span class="wk2-tag">Wochen-Challenge · ${h(String(w.w).replace("-W", ", Woche "))}</span>
      <div class="wk2-titel"><span class="wk2-ic" aria-hidden="true">${ic}</span><div><small>Thema der Woche</small><h1>${h(t.name)}</h1></div></div>
      <div class="wk2-cd"><span><b>${tage}</b><small>Tage</small></span><span><b>${std}</b><small>Std</small></span><span><b>${min}</b><small>Min</small></span></div>
      <div class="wk2-ziel"><span class="wk2-bar"><i style="width:${p}%"></i></span><small>${w.r} von ${w.ziel} richtig · ${w.fertig ? "Challenge geschafft! 🎉" : `${xp} XP extra bei ${w.ziel} richtigen`}</small></div>
      <img class="wk2-kids" src="img/kids/duo-jubel.webp" alt=""></section>
    <article class="wk2-box"><div class="wk2-bkopf"><span class="wk2-buch" aria-hidden="true">📖</span><div><small>Das Wichtigste aus der Bibliothek</small><h2>${h(t.name)}</h2>${t.text ? `<p>${h(t.text)}</p>` : ""}</div></div>
      ${merk.length ? `<ul>${merk.map(m => `<li>${h(m)}</li>`).join("")}</ul>` : `<p>Lies den Text in der Bibliothek, dann bist du bereit.</p>`}
      <button type="button" class="wk2-mehr" data-x="wochelesen">Ganzen Text lesen →</button></article>
    <div class="wk2-wahl">
      <button type="button" class="wk2-k wk2-train" data-x="wochetrain"><span class="wk2-kic">🏋️</span><b>Trainieren</b><small>In deinem Tempo, mit Erklärungen. Jede richtige Antwort zählt für die Wochen-Challenge.</small><span class="wk2-los">Training starten ▶</span></button>
      <button type="button" class="wk2-k wk2-test" data-x="wochetest"${testOk ? "" : " disabled"}><span class="wk2-kic">🏆</span><b>Test absolvieren</b><small>Gewertet mit Punkten für die Rangliste. Wochen-Bonus: +${bonus} XP und das Wochen-Abzeichen ab der Hälfte richtig.</small>
        ${abz ? `<span class="wk2-abz">🏅 Abzeichen geholt: ${abz.r} von ${abz.n}</span>` : `<span class="wk2-abz">🏅 Wochen-Abzeichen offen</span>`}<span class="wk2-los">${S.profil ? "Test starten ▶" : "Registrieren und starten ▶"}</span></button>
    </div>
  </div>`;
}

/* ---------- Kopfzeile mit Zurück auf allen Unterseiten ---------- */
const TITEL = {chat:"Tagesquiz", livequiz:"Live-Quiz", spielmodi:"Wettbewerb & Duell", board:"Rangliste", lib:"Bibliothek", profil:"Mein Profil", register:"Registrieren", login:"Anmelden", duell:"Duell", epwoche:"Thema der Woche", hardcoreinfo:"Hardcore", live:"Wettbewerb", lehrer:"Lehrerbereich"};
function zurueck(){
  const cr = document.querySelector("#app .crumbs");
  if(cr && Array.isArray(S._crumbs) && S._crumbs.length){ try{ S._crumbs[S._crumbs.length - 1](); return; }catch(e){} }
  const t = tabVon(S.screen); if(HOME_TABS.includes(t)) setTab(t);
  if(S.libModus){ S.libModus = false; document.documentElement.dataset.mode = "spiel"; }
  go("home");
}
function kopfzeile(){
  const app = document.getElementById("app"); if(!app) return;
  app.querySelectorAll(":scope > .ap-kz").forEach(e => e.remove());
  if(S.screen === "home" && !S.libModus) return;
  if(["quiz","done","duellplay","check","checkdone","liveplay","livehost","chat"].includes(S.screen)) return;
  const cur = app.querySelector(".crumbs .crumb.cur");
  const titel = (cur && cur.textContent.trim()) || TITEL[S.screen] || "";
  const d = document.createElement("div"); d.className = "ap-kz";
  d.innerHTML = `<button type="button" class="ap-zbtn" aria-label="Zurück">${SV(I.zurueck, 24)}<span>Zurück</span></button><h1 class="auf">${h(titel)}</h1>`;
  d.querySelector("button").onclick = zurueck;
  app.prepend(d);
}
/* Rangliste: Season mit Symbol, Umschalter als Leiste unten */
function schmuckSeiten(){
  const app = document.getElementById("app"); if(!app) return;
  app.querySelectorAll(".seasonband .stier").forEach(e => { if(!e.dataset.ap){ e.dataset.ap = "1"; e.innerHTML = SV(I.pokal, 30); } });
  app.querySelectorAll(".rlmodus .seg").forEach(b => { if(b.dataset.ap) return; b.dataset.ap = "1";
    const m = b.dataset.bm || (b.textContent.includes("Hardcore") ? "hc" : ""); const ic = m === "gesamt" ? I.pokal : m === "season" ? I.kal : I.flamme;
    const txt = b.textContent.replace(/^[^A-Za-zÄÖÜäöü]+/, "").trim(); b.innerHTML = SV(ic, 20) + `<span>${h(txt)}</span>`; });
}
/* Bereich-Seite: Themen in wischbare Seiten packen, so viele wie auf den Bildschirm passen */
function themenSeiten(){
  const app = document.getElementById("app"); const th = app && app.querySelector(":scope > .themen"); if(!th || th.dataset.ap) return;
  th.dataset.ap = "1";
  const kacheln = [...th.querySelectorAll(":scope > .thema")]; if(!kacheln.length) return;
  const quer = QUER.matches, tabs = document.getElementById("epTabs"); const tr = tabs && !quer && getComputedStyle(tabs).display !== "none" ? tabs.getBoundingClientRect() : null;
  const ende = tr ? tr.top - 10 : innerHeight - 16;
  const wrap = document.createElement("div"); wrap.className = "ap-tp"; th.before(wrap); th.remove();
  const spalten = innerWidth >= 700 ? 3 : 2;
  const probe = document.createElement("div"); probe.className = "ap-tpage"; wrap.appendChild(probe); probe.appendChild(kacheln[0]);
  const top = wrap.getBoundingClientRect().top + scrollY, hoehe = Math.max(140, ende - top - 22), kh = kacheln[0].getBoundingClientRect().height + 10;
  const zeilen = Math.max(2, Math.floor(hoehe / kh)), proSeite = zeilen * spalten;
  wrap.innerHTML = "";
  for(let i = 0; i < kacheln.length; i += proSeite){ const pg = document.createElement("div"); pg.className = "ap-tpage"; kacheln.slice(i, i + proSeite).forEach(k => pg.appendChild(k)); wrap.appendChild(pg); }
  const n = wrap.children.length;
  if(n > 1){ const pk = document.createElement("div"); pk.className = "ap-tpunkte"; pk.innerHTML = Array.from({length:n}, (x, i) => `<i${i ? "" : ' class="an"'}></i>`).join(""); wrap.after(pk);
    wrap.addEventListener("scroll", () => { const i = Math.round(wrap.scrollLeft / Math.max(1, wrap.clientWidth + 12)); [...pk.children].forEach((p, j) => p.classList.toggle("an", j === i)); }, {passive:true}); }
}
function libKompakt(){
  const app = document.getElementById("app"); const reg = app && app.querySelector(".regal"); if(!reg || app.querySelector(".ap-libkids")) return;
  const d = document.createElement("div"); d.className = "ap-libkids"; d.innerHTML = `<img src="${KIDS}leni.webp" alt=""><img src="${KIDS}ben.webp" alt="">`; reg.before(d);
  const bk = app.querySelector(".ap-kz"); if(bk) bk.querySelector("h1").textContent = "Bibliothek";
}
function doneKompakt(){
  const app = document.getElementById("app"); const rv = app && app.querySelector(".done .review"); if(!rv || rv.dataset.ap) return;
  rv.dataset.ap = "1"; rv.hidden = true;
  const b = document.createElement("button"); b.type = "button"; b.className = "ap-revbtn"; b.textContent = "Alle Antworten ansehen";
  rv.before(b); b.onclick = () => { rv.hidden = !rv.hidden; b.textContent = rv.hidden ? "Alle Antworten ansehen" : "Antworten ausblenden"; };
}
/* Chat und andere feste Seiten auf die Bildschirmhöhe einpassen */
function seitenEinpassen(){
  const quer = QUER.matches, tabs = document.getElementById("epTabs");
  const tr = tabs && !quer && getComputedStyle(tabs).display !== "none" ? tabs.getBoundingClientRect() : null;
  const ende = tr ? tr.top - 10 : innerHeight - 16;
  const c = document.querySelector("#app .ep-chat"); if(c){ const top = c.getBoundingClientRect().top + scrollY; c.style.height = Math.max(320, Math.floor(ende - top)) + "px"; }
}

/* ---------- Einhängen ---------- */
const vorHome = window.renderHome;
window.renderHome = function(){
  const r = vorHome.apply(this, arguments);
  if(!an()) return r;
  try{
    const app = document.getElementById("app"); if(!app) return r;
    app.innerHTML = tab === "themen" ? themenHTML() : tab === "duell" ? duellHTML() : tab === "profil" ? profilHTML() : heuteHTML();
    binden(app);
    requestAnimationFrame(() => { einpassen(); namenSetzen(); karussell(); });
  }catch(e){ console.warn("app.js", e); }
  return r;
};
const vorRender = window.render;
window.render = function(){
  if(S.screen === "epwoche"){
    try{ renderNav(); }catch(e){}
    const app = document.getElementById("app"); if(app){ app.innerHTML = wocheHTML(); binden(app); }
    document.body.classList.toggle("ep-app", an()); document.body.classList.remove("ep-home", "ep-ohne"); leiste(); kopfzeile(); try{ scrollTo({top:0}); }catch(e){}
    return;
  }
  const r = vorRender.apply(this, arguments);
  try{
    document.body.classList.toggle("ep-app", an());
    document.body.classList.toggle("ep-home", an() && S.screen === "home" && !S.libModus);
    document.body.classList.toggle("ep-ohne", an() && OHNE_LEISTE.includes(S.screen));
    [...document.body.classList].filter(k => k.startsWith("ep-s-")).forEach(k => document.body.classList.remove(k));
    if(an()) document.body.classList.add("ep-s-" + (S.libModus && S.screen === "lib" ? "lib" : S.screen));
    leiste();
    if(an()){ kopfzeile(); schmuckSeiten(); requestAnimationFrame(seitenEinpassen); if(S.screen === "bereich" || S.screen === "submenu") requestAnimationFrame(themenSeiten); if(S.screen === "done") doneKompakt(); if(S.libModus && S.screen === "lib") libKompakt(); }
  }catch(e){ console.warn("app.js", e); }
  return r;
};
const neu = () => { try{ render(); }catch(e){} };
try{ MQ.addEventListener("change", neu); QUER.addEventListener("change", neu); }catch(e){}
addEventListener("resize", () => { if(an() && S.screen === "home") requestAnimationFrame(einpassen); if(an()) requestAnimationFrame(seitenEinpassen); });

window.EP_APP = { an, tab: () => tab, setTab };
try{ if(an()) render(); }catch(e){}
})();
