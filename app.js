/* easyplay: App-Ansicht für Handy und iPad
   Statt einer langen Startseite gibt es fünf Bereiche (Heute, Themen, Duell, Qeels, Ich).
   Jeder Bereich passt auf einen Bildschirm. Unten eine Tab-Leiste, auf dem iPad quer eine Seitenleiste links.
   Der Computer (Maus, breiter Bildschirm) bleibt unverändert.
   Muster wie startseite.js: renderHome und render werden umhüllt, Daten kommen aus window.EP_START. */
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
const TABS = ["heute", "themen", "duell", "qeels", "ich"];
let tab = "heute"; try{ const t = sessionStorage.getItem("ep-apptab"); if(["heute","themen","duell"].includes(t)) tab = t; }catch(e){}
const setTab = t => { tab = t; try{ sessionStorage.setItem("ep-apptab", t); }catch(e){} };
const OHNE_LEISTE = ["quiz","done","duellplay","duelllobby","duellannahme","check","checkdone","livequiz","liveplay","livehost"];
function tabVon(sc){
  if(sc === "home") return tab;
  if(["profil","register","login","historie","spieler"].includes(sc)) return "ich";
  if(["duell","duellsplit","duellende","duellresultat","spielmodi","board","live","chat"].includes(sc)) return sc === "chat" ? "heute" : "duell";
  return "themen";
}

/* ---------- Symbole ---------- */
const SV = (d, w = 22) => `<svg width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const I = {
  heute: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  themen: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  duell: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  qeels: '<rect x="3" y="3" width="18" height="18" rx="5"/><path d="M10 8.5v7l6-3.5z"/>',
  ich: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  kal: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  live: '<circle cx="12" cy="12" r="2"/><path d="M16.2 7.8a6 6 0 0 1 0 8.4M7.8 16.2a6 6 0 0 1 0-8.4M19 5a10 10 0 0 1 0 14M5 19A10 10 0 0 1 5 5"/>',
  ziel: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  birne: '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z"/>',
  pfeil: '<path d="m9 6 6 6-6 6"/>',
  play: '<path d="M7 4.5v15l13-7.5z" fill="currentColor" stroke="none"/>',
  buch: '<path d="M4 19V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M8 7h7M8 11h5"/>',
  pokal: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
  pad: '<rect x="2" y="7" width="20" height="12" rx="5"/><path d="M7 11v4M5 13h4"/><circle cx="16" cy="12" r="1"/><circle cx="18" cy="14.5" r="1"/>',
  flamme: '<path d="M12 22c4 0 7-2.8 7-6.8 0-3.6-2.6-5.8-4-8.2-.6 2-1.8 3-3 3 .4-3-1-6-3-8 0 4-5 6.5-5 12.6C4 19.3 7.6 22 12 22z"/>',
  stern: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  wuerfel: '<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1.2" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.2" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.2" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1.2" fill="currentColor"/>'
};
const TAB_NAME = {heute:"Heute", themen:"Themen", duell:"Duell", qeels:"Qeels", ich:"Ich"};

/* ---------- Gestaltung ---------- */
const css = document.createElement("style");
css.id = "ep-app-css";
css.textContent = `
body.ep-app{--ap-card:rgba(255,255,255,.93);--ap-rand:#fff;--ap-weich:#F4F6FF;--ap-schatten:0 16px 32px -24px rgba(27,34,64,.55);padding-bottom:calc(96px + env(safe-area-inset-bottom))}
body.dark.ep-app{--ap-card:rgba(26,30,58,.92);--ap-rand:rgba(255,255,255,.08);--ap-weich:rgba(255,255,255,.06);--ap-schatten:0 16px 32px -24px rgba(0,0,0,.8)}
body.ep-app #navReels{display:none!important}
body.ep-app .topbar{margin-bottom:6px!important}
body.ep-app.ep-home .eplegal{display:none}
body.ep-app.ep-home{overflow:hidden;overscroll-behavior:none;padding-bottom:0}
html:has(body.ep-app.ep-home){overflow:hidden}
body.ep-app.ep-home .wrap{padding-bottom:0!important;min-height:0!important}
body.ep-app.ep-ohne{padding-bottom:0}
body.ep-app.ep-ohne #epTabs{display:none}

#epTabs{position:fixed;z-index:60;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));max-width:560px;margin:0 auto;height:70px;box-sizing:border-box;padding:6px;border-radius:26px;background:var(--ap-card);border:1px solid var(--ap-rand);box-shadow:0 18px 40px -18px rgba(27,34,64,.6);display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px;-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}
#epTabs button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;border:0;border-radius:20px;background:none;color:var(--ep-mut);font:600 11px "Lexend",system-ui,sans-serif;cursor:pointer;min-height:44px;padding:0}
#epTabs button[aria-current="page"]{background:linear-gradient(135deg,#3D5AFE,#8A3FE0);color:#fff}
#epTabs .tabav{width:26px;height:26px;border-radius:13px;overflow:hidden;background:#FFF0F6;display:block}
#epTabs .tabav img{width:100%;height:140%;object-fit:cover;object-position:top}
body:has(#reels:not([hidden])) #epTabs,body:has(.ep-modal) #epTabs{display:none}

.ap{display:flex;flex-direction:column;gap:12px;color:var(--ep-ink);text-align:left;overflow:auto;overscroll-behavior:contain;padding:2px 2px 4px;box-sizing:border-box}
.ap button{font-family:inherit;color:inherit}
.ap .apk{background:var(--ap-card);border:1px solid var(--ap-rand);border-radius:22px;box-shadow:var(--ap-schatten)}
.ap .aplbl{font:600 12px "Lexend",system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--ep-mut)}
.ap .apzeile{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:22px;text-align:left;cursor:pointer;width:100%;box-sizing:border-box}
.ap .apzeile .aptx{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.ap .apzeile b{font:600 16px "Fredoka",system-ui,sans-serif}
.ap .apzeile small{font:400 12.5px "Lexend",system-ui,sans-serif;color:var(--ep-mut)}
.ap .apico{width:44px;height:44px;border-radius:14px;display:grid;place-items:center;flex:none}
.ap .ic-blau{background:#E8EDFF;color:#3D5AFE}.ap .ic-pink{background:#FFE4EF;color:#C2257F}.ap .ic-orange{background:#FFEBD9;color:#C2410C}.ap .ic-gold{background:#FFF3D6;color:#B7791F}.ap .ic-lila{background:#EFE6FF;color:#8A3FE0}
body.dark .ap .ic-blau,body.dark .ap .ic-pink,body.dark .ap .ic-orange,body.dark .ap .ic-gold,body.dark .ap .ic-lila{background:rgba(255,255,255,.1)}

/* Heute */
.ap-held{position:relative;flex:1 1 0;min-height:190px;border-radius:28px;padding:18px;box-sizing:border-box;overflow:hidden;isolation:isolate;background:#fff;border:1.5px solid rgba(255,255,255,.9);box-shadow:0 22px 44px -28px rgba(27,34,64,.6);display:flex}
.ap-held::before{content:"";position:absolute;inset:-25%;z-index:-1;filter:blur(46px);opacity:.85;background:radial-gradient(circle at 15% 30%,#FF8AD8 0,transparent 30%),radial-gradient(circle at 80% 20%,#8FA6FF 0,transparent 30%),radial-gradient(circle at 45% 95%,#FFE34D 0,transparent 28%),radial-gradient(circle at 90% 85%,#8CE0C8 0,transparent 28%)}
body.dark .ap-held{background:#1D2350}
body.dark .ap-held h1{background:linear-gradient(135deg,#A9B8FF,#D9AEFF 55%,#FFA8DC);-webkit-background-clip:text;background-clip:text}
#hauptmenue .ap-recht{display:flex;flex-direction:column}
#hauptmenue .ap-recht a{display:block;padding:10px 14px;border-radius:12px;font-weight:600;color:inherit;text-decoration:none}
#hauptmenue .ap-recht a:hover,#hauptmenue .ap-recht a:focus-visible{background:rgba(61,90,254,.1)}
.ap-held .apht{position:relative;z-index:2;width:56%;display:flex;flex-direction:column;gap:8px}
.ap-held .aphoi{font:500 14px "Lexend",system-ui,sans-serif;color:var(--ep-mut)}
.ap-held h1{margin:0;font:800 clamp(28px,7.6vw,64px)/1 "Bricolage Grotesque","Fredoka",system-ui,sans-serif;letter-spacing:-.02em;background:var(--ep-grad);-webkit-background-clip:text;background-clip:text;color:transparent}
.ap-held .apzahlen{font:500 13px "Lexend",system-ui,sans-serif;color:var(--ep-mut)}
.ap-held .ep-btn{margin-top:auto;align-self:flex-start}
.ap-held>img{position:absolute;right:-4px;bottom:0;height:min(100%,420px);max-width:50%;object-fit:contain;object-position:bottom right;z-index:1;filter:drop-shadow(0 14px 16px rgba(27,34,64,.25))}
.ap-kopf{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 4px}
.ap-chips{display:flex;gap:6px}
.ap-chips span{display:inline-flex;align-items:center;gap:4px;height:30px;padding:0 10px;border-radius:15px;background:var(--ap-card);border:1px solid var(--ap-rand);font:600 13px "Fredoka",system-ui,sans-serif}
.ap-chips .fl{color:#E8590C}.ap-chips .st{color:#8A3FE0}
.ap-tag{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.ap-tag button{display:flex;flex-direction:column;gap:6px;padding:12px;min-height:118px;text-align:left;cursor:pointer;box-sizing:border-box}
.ap-tag button b{font:600 15px/1.15 "Fredoka",system-ui,sans-serif}
.ap-tag button small{font:400 12px/1.3 "Lexend",system-ui,sans-serif;color:var(--ep-mut)}
.ap-tag button .apico{width:38px;height:38px;border-radius:12px}
.ap-tag button.ok{opacity:.75}
.ap-tag button:disabled{cursor:default;opacity:.6}
.ap-woche{display:flex;align-items:center;gap:12px;padding:14px 16px;border:0;border-radius:22px;color:#fff;text-align:left;cursor:pointer;background:linear-gradient(135deg,#3D5AFE,#8A3FE0);box-shadow:0 16px 30px -20px rgba(61,90,254,.8);width:100%;box-sizing:border-box}
.ap-woche .aptx{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px}
.ap-woche small{font:600 11px "Lexend",system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;opacity:.9}
.ap-woche b{font:700 18px "Fredoka",system-ui,sans-serif}
.ap-woche .apbar{height:8px;border-radius:4px;background:rgba(255,255,255,.28);overflow:hidden}
.ap-woche .apbar i{display:block;height:100%;background:#FFE34D;border-radius:4px}
.ap-woche span.apz{font:400 12px "Lexend",system-ui,sans-serif}
.ap-fakt{display:flex;gap:12px;align-items:flex-start;padding:14px 16px;text-align:left;cursor:pointer;width:100%;box-sizing:border-box}
.ap-fakt .aptx{display:flex;flex-direction:column;gap:4px}
.ap-fakt p{margin:0;font:500 14px/1.35 "Lexend",system-ui,sans-serif;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.ap-fakt em{font:600 13px "Lexend",system-ui,sans-serif;color:#3D5AFE;font-style:normal}
.ap-fakt>svg{color:#B7791F;flex:none;margin-top:2px}
.ap.ap-eng .ap-fakt,.ap.ap-eng .apzahlen{display:none}

/* Themen */
.ap-stufen{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;padding:6px;border-radius:22px}
.ap-stufen button{min-height:52px;border:0;border-radius:16px;background:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px}
.ap-stufen button b{font:600 16px "Fredoka",system-ui,sans-serif}
.ap-stufen button small{font:400 11px "Lexend",system-ui,sans-serif;color:var(--ep-mut)}
.ap-stufen button[aria-pressed="true"]{background:linear-gradient(135deg,#3D5AFE,#8A3FE0);color:#fff}
.ap-stufen button[aria-pressed="true"] small{color:#fff}
.ap-info{margin:-4px 6px 0;font:500 12px "Lexend",system-ui,sans-serif;color:var(--ep-mut)}
.ap-ber{flex:1 1 0;min-height:260px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:1fr;gap:10px}
.ap-ber button{position:relative;border:0;border-radius:24px;padding:14px;color:#fff;text-align:left;cursor:pointer;display:flex;flex-direction:column;justify-content:flex-end;gap:4px;background:var(--c);background-image:linear-gradient(160deg,rgba(255,255,255,.12),rgba(0,0,0,.18));background-color:var(--c);box-shadow:0 6px 0 rgba(0,0,0,.16),0 18px 30px -18px rgba(27,34,64,.6);overflow:hidden;min-height:0}
.ap-ber .apem{position:absolute;top:12px;left:12px;width:48px;height:48px;border-radius:16px;background:rgba(255,255,255,.22);display:grid;place-items:center;font-size:26px}
.ap-ber .apem svg,.ap-ber .apem img{width:30px;height:30px}
.ap-ber .apn{position:absolute;top:14px;right:12px;font:600 11px "Lexend",system-ui,sans-serif;padding:4px 8px;border-radius:10px;background:rgba(0,0,0,.18)}
.ap-ber b{font:700 18px/1.1 "Fredoka",system-ui,sans-serif;text-shadow:0 1px 2px rgba(0,0,0,.25)}
.ap-ber small{font:400 12px/1.3 "Lexend",system-ui,sans-serif;text-shadow:0 1px 2px rgba(0,0,0,.25)}
.ap-unten{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}

/* Duell */
.ap-bereit{position:relative;flex:1 1 0;min-height:250px;border-radius:28px;padding:18px;box-sizing:border-box;overflow:hidden;background:linear-gradient(150deg,#FFE6D6 0%,#FFD6E8 50%,#E6E0FF 100%);border:1px solid #fff;box-shadow:0 22px 44px -28px rgba(27,34,64,.6);display:flex;flex-direction:column;gap:8px;color:#1B2240}
body.dark .ap-bereit{background:linear-gradient(150deg,#3A2A55,#2A2550 60%,#22305E);color:#EEF1FF;border-color:rgba(255,255,255,.08)}
.ap-bereit h2{margin:0;position:relative;z-index:2;font:800 clamp(26px,7vw,52px)/1.02 "Bricolage Grotesque","Fredoka",system-ui,sans-serif;letter-spacing:-.02em}
.ap-bereit p{margin:0;position:relative;z-index:2;font:400 13px/1.4 "Lexend",system-ui,sans-serif;max-width:330px;opacity:.85}
.ap-bereit .apwahl{position:relative;z-index:2;margin-top:auto;width:min(200px,52%);display:flex;flex-direction:column;gap:8px}
.ap-bereit .apteam{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
.ap-bereit .apteam button{min-height:44px;border-radius:14px;border:2px solid transparent;background:rgba(255,255,255,.6);font:600 15px "Fredoka",system-ui,sans-serif;cursor:pointer;color:#4A4970}
.ap-bereit .apteam button[data-team="lumi"][aria-pressed="true"]{background:#fff;border-color:#E043B8;color:#9D1C74}
.ap-bereit .apteam button[data-team="milo"][aria-pressed="true"]{background:#fff;border-color:#3D5AFE;color:#2A2FA8}
.ap-bereit>img{position:absolute;right:-6px;bottom:0;height:min(78%,420px);max-width:56%;object-fit:contain;object-position:bottom right;z-index:1}
.ap-cd{font:700 17px "Fredoka",system-ui,sans-serif;font-variant-numeric:tabular-nums}
.ap-zwei{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.ap-zwei button{display:flex;flex-direction:column;gap:6px;padding:12px 14px;min-height:84px;text-align:left;cursor:pointer;box-sizing:border-box}
.ap-zwei button b{font:600 15px/1.15 "Fredoka",system-ui,sans-serif}
.ap-zwei button svg{color:#8A3FE0}.ap-zwei button.gold svg{color:#B7791F}
.ap-mult{height:32px;padding:0 10px;border-radius:10px;display:grid;place-items:center;background:#DCF5E7;color:#0F6B39;font:700 15px "Fredoka",system-ui,sans-serif;flex:none}
.ap-mult.m2{background:#FFF0C2;color:#8A5A00}.ap-mult.m3{background:#FFE0E0;color:#B42318}

/* Kleine Handys (z. B. iPhone SE) */
@media (max-height:720px) and (max-width:699px){
  .ap{gap:8px}
  .ap-held{min-height:150px;padding:14px}.ap-held .aphoi{display:none}
  .ap-tag button{min-height:92px;padding:10px;gap:4px}.ap-tag button .apico{width:32px;height:32px}
  .ap-woche{padding:10px 14px}.ap-woche b{font-size:16px}
  .ap-stufen button{min-height:44px}.ap-info{display:none}
  .ap-ber{min-height:200px}.ap-ber .apem{width:38px;height:38px}.ap-ber small{display:none}
  .ap-bereit{min-height:200px;padding:14px}.ap-bereit p{display:none}
  .ap .apzeile{padding:8px 12px}.ap-zwei button{min-height:60px;padding:10px 12px;flex-direction:row;align-items:center}
}
/* iPad hoch und grösser */
@media (min-width:700px){
  .ap{gap:16px}
  .ap-held{padding:30px}.ap-held .aphoi{font-size:16px}.ap-held .apzahlen{font-size:15px}
  .ap-tag button{min-height:150px;padding:18px}.ap-tag button b{font-size:19px}.ap-tag button small{font-size:14px}.ap-tag button .apico{width:48px;height:48px}
  .ap-ber b{font-size:24px}.ap-ber small{font-size:14px}
  .ap-bereit{padding:30px}.ap-bereit p{font-size:15px}
}
/* iPad quer: Seitenleiste */
@media (min-width:1000px) and (orientation:landscape){
  body.ep-app{padding-bottom:0;padding-left:140px}
  #epTabs{left:16px;top:16px;bottom:16px;right:auto;width:108px;height:auto;max-width:none;margin:0;grid-template-columns:none;grid-template-rows:repeat(4,72px) 1fr;align-content:start;padding:16px 10px;border-radius:30px}
  #epTabs button{font-size:12px;border-radius:22px}
  #epTabs button[data-tab="ich"]{align-self:end;height:88px}
  .ap-heute{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-template-rows:minmax(0,1.9fr) auto minmax(0,1fr);gap:16px}
  .ap-heute .ap-held{grid-column:1/3;grid-row:1/2;min-height:0}
  .ap-heute .ap-kopf{grid-column:3;grid-row:2;display:none}
  .ap-heute .ap-tag{grid-column:3;grid-row:1;grid-template-columns:1fr;grid-auto-rows:1fr}
  .ap-heute .ap-tag button{display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto auto;column-gap:14px;row-gap:2px;align-content:center;min-height:0}
  .ap-heute .ap-tag button .apico{grid-row:1/3}
  .ap-heute .ap-woche,.ap-heute .ap-fakt,.ap-heute .ap-weiter{grid-row:3;height:100%;align-items:flex-start}
  .ap-heute .ap-woche{grid-column:1}.ap-heute .ap-fakt{grid-column:2;display:flex!important}.ap-heute .ap-weiter{grid-column:3}
  .ap-heute .ap-woche .aptx{height:100%}
  .ap-themen .ap-ber{grid-template-columns:repeat(4,minmax(0,1fr))}
  .ap-themen .ap-unten{grid-template-columns:repeat(3,minmax(0,1fr))}
  .ap-duell{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-template-rows:minmax(0,1fr) auto;gap:16px}
  .ap-duell .ap-bereit{grid-column:1/3;min-height:0}
  .ap-duell .ap-top{grid-column:3;grid-row:1}
  .ap-duell .ap-zwei{display:contents}
}
.ap .ap-weiter{display:none}
@media (min-width:1000px) and (orientation:landscape){.ap-heute .ap-weiter{display:flex}}
.ap-top{display:none}
@media (min-width:1000px) and (orientation:landscape){.ap-top{display:flex;position:relative;overflow:hidden;flex-direction:column;gap:10px;padding:22px;text-align:left;cursor:pointer}.ap-top img{position:absolute;right:6px;bottom:-8px;height:58%}.ap-top p{margin:0;max-width:60%;font:500 15px/1.45 "Lexend",system-ui,sans-serif;color:var(--ep-mut)}.ap-top b{font:700 22px "Fredoka",system-ui,sans-serif;display:flex;gap:8px;align-items:center}.ap-duell .ap-zwei .gold{display:none}}
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
function heuteHTML(){
  const ES = E(), n = (S.profil && S.profil.name) || "";
  let anz = 0; try{ anz = allCount(); }catch(e){}
  const themen = Object.keys(THEMA).filter(id => !THEMA[id].menu).length;
  const s = ES.serie ? ES.serie() : {n:0}, lv = ES.level ? ES.level() : null, tq = ES.tagesquiz ? ES.tagesquiz() : null, nf = ES.fehlerAnzahl ? ES.fehlerAnzahl() : 0;
  const li = liveInfo(), fk = ES.fakt ? ES.fakt() : null;
  let wo = null; try{ wo = ES.woche(); }catch(e){}
  let zl = null; try{ zl = JSON.parse(localStorage.getItem((ES.K && ES.K.zuletzt) || "ep-zuletzt")); }catch(e){}
  const erledigt = (tq ? 1 : 0) + (li && li.st === "ok" ? 1 : 0) + (nf ? 0 : 1);
  const liveTxt = !li ? "Heute vorbei" : li.st === "jetzt" ? `<b style="color:#C2257F">Läuft jetzt!</b>` : `${h(li.thema)}, in <span id="epLiveCd">${ES.dauerText ? ES.dauerText(li.rest) : ""}</span>`;
  const wp = wo && wo.thema ? Math.min(100, Math.round(wo.r / wo.ziel * 100)) : 0;
  const tageRest = wo && wo.ende ? Math.max(0, Math.ceil((wo.ende - Date.now()) / 864e5)) : 0;
  return `<div class="ap ap-heute">
    <section class="ap-held"><div class="apht">
      <span class="aphoi">Hoi${n ? " " + h(n) : ""}! Schön, bist du da.</span>
      <h1>Spiel dich schlau!</h1>
      <span class="apzahlen">${zahl(anz)} Fragen · ${themen} Themen</span>
      <button type="button" class="ep-btn" data-x="zufall">${SV(I.play, 18)} Los geht's</button></div>
      <img src="${KIDS}duo-hallo.webp" alt="Lumi und Milo winken"></section>
    <div class="ap-kopf"><span class="aplbl">Dein Tag · ${erledigt} von 3</span><span class="ap-chips"><span class="fl">${SV(I.flamme, 16)}${s.n || 0}</span><span class="st">${SV(I.stern, 16)}Lv ${lv ? lv.level : 1}</span></span></div>
    <div class="ap-tag">
      <button type="button" class="apk${tq ? " ok" : ""}" data-x="chat"><span class="apico ic-blau">${SV(I.kal, 20)}</span><b>Tagesquiz</b><small>${tq ? `Erledigt: ${tq.r} von ${tq.n}` : "5 neue Fragen"}</small></button>
      <button type="button" class="apk${li && li.st === "ok" ? " ok" : ""}" data-x="live"><span class="apico ic-pink">${SV(I.live, 20)}</span><b>Live ${li ? li.zeit : ""}</b><small>${liveTxt}</small></button>
      <button type="button" class="apk${nf ? "" : " ok"}" data-x="fehler"${nf ? "" : " disabled"}><span class="apico ic-orange">${SV(I.ziel, 20)}</span><b>Fehler üben</b><small>${nf ? nf + " offen" : "Alles geübt"}</small></button>
    </div>
    ${wo && wo.thema ? `<button type="button" class="ap-woche" data-x="woche"><span class="aptx"><small>Wochen-Challenge</small><b>${wo.fertig ? "Geschafft: " : "Thema der Woche: "}${h(wo.thema.name)}</b><span class="apbar"><i style="width:${wp}%"></i></span><span class="apz">${wo.r} von ${wo.ziel} richtig · noch ${tageRest} ${tageRest === 1 ? "Tag" : "Tage"}</span></span>${SV(I.pfeil, 22)}</button>` : ""}
    ${fk ? `<button type="button" class="apk ap-fakt" data-x="fakt" data-t="${h(fk.t)}">${SV(I.birne, 22)}<span class="aptx"><span class="aplbl">Wusstest du?</span><p>${h(fk.text)}</p><em>Frage dazu spielen</em></span></button>` : ""}
    <button type="button" class="apk apzeile ap-weiter" data-x="${zl ? "weiter" : "zufall"}"><span class="aptx"><span class="aplbl">${zl ? "Weiterspielen" : "Überrasch dich"}</span><b style="font-size:22px">${h(zl ? zl.name : "Zufällige Fragen")}</b><small>${zl ? "Da weitermachen, wo du warst" : "Fragen aus allen Themen"}</small></span><span class="apico ic-blau">${SV(I.play, 20)}</span></button>
  </div>`;
}
function themenHTML(){
  let anz = 0; try{ anz = allCountL(S.stufe); }catch(e){}
  const SCH = {1:"Primarschule 1. bis 3. Klasse", 2:"4. bis 8. Klasse", 3:"Oberstufe bis Lehre und Studium"};
  let zl = null; try{ zl = JSON.parse(localStorage.getItem("ep-zuletzt")); }catch(e){}
  const so = (typeof stufeObj === "function" ? stufeObj() : {name:""});
  return `<div class="ap ap-themen">
    <div class="apk ap-stufen" role="group" aria-label="Deine Stufe">${STUFEN.map(s => `<button type="button" data-s="${s.id}" aria-pressed="${S.stufe === s.id}"><b>${h(s.name)}</b><small>${h(s.alter)}</small></button>`).join("")}</div>
    <p class="ap-info">${h(so.name)}: ${zahl(anz)} Fragen, ${h(SCH[S.stufe] || "")}</p>
    <div class="ap-ber">${BEREICHE.map(b => { let c = 0; try{ c = countBereich(b, S.stufe); }catch(e){} let em = ""; try{ em = ico(b.emo); }catch(e){}
      return `<button type="button" data-b="${b.id}" style="--c:var(${b.c})"><span class="apem" aria-hidden="true">${em}</span><span class="apn">${zahl(c)}</span><b>${h(b.name)}</b><small>${h(b.text)}</small></button>`; }).join("")}</div>
    <div class="ap-unten">
      <button type="button" class="apk apzeile" data-x="${zl ? "weiter" : "zufall"}"><span class="apico ic-blau">${SV(zl ? I.play : I.wuerfel, 20)}</span><span class="aptx"><b>${h(zl ? zl.name : "Zufällige Fragen")}</b><small>${zl ? "Weiterspielen" : "Überrasch dich"}</small></span></button>
      <button type="button" class="apk apzeile" data-x="lib"><span class="apico ic-gold">${SV(I.buch, 20)}</span><span class="aptx"><b>Bibliothek</b><small>Lesen und entdecken</small></span></button>
      ${zl ? `<button type="button" class="apk apzeile ap-weiter" data-x="zufall"><span class="apico ic-lila">${SV(I.wuerfel, 20)}</span><span class="aptx"><b>Zufällige Fragen</b><small>Überrasch dich</small></span></button>` : ""}
    </div>
  </div>`;
}
function duellHTML(){
  const ES = E(), t = ES.team ? ES.team() : null, li = liveInfo();
  let se = null, p = null; try{ se = aktuelleSeason(); p = seasonPhase(se); }catch(e){}
  const seTxt = !p ? "" : p.mult > 1 ? `${h(p.text || "")} Noch ${p.rest} ${p.rest === 1 ? "Tag" : "Tage"}.` : `In ${p.bisBonus} ${p.bisBonus === 1 ? "Tag" : "Tagen"} Bonuswochen mit doppelten Punkten`;
  const liveTxt = !li ? "Heute keines mehr, morgen um 13 Uhr" : li.st === "jetzt" ? "Läuft jetzt, mitspielen!" : `${(ES.LIVE && ES.LIVE.fragen) || 20} Fragen, alle gleichzeitig`;
  return `<div class="ap ap-duell">
    <section class="ap-bereit"><h2>Bereit für dein Duell?</h2><p>Wähle dein Team, dann tritt gegen Freunde, Familie oder deine Klasse an.</p>
      <div class="apwahl"><span class="aplbl">Dein Team</span>
        <div class="apteam" role="group" aria-label="Team wählen"><button type="button" data-team="lumi" aria-pressed="${!!(t && t.id === "lumi")}">Lumi</button><button type="button" data-team="milo" aria-pressed="${!!(t && t.id === "milo")}">Milo</button></div>
        <button type="button" class="ep-btn" data-x="duell">${SV(I.duell, 18)} Duell starten</button></div>
      <img src="${KIDS}duo-bereit.webp" alt="Lumi und Milo kampfbereit"></section>
    <button type="button" class="apk ap-top" data-x="board"><b>${SV(I.pokal, 24)} Top 10 der Schweiz</b><p>Mach einen gewerteten Test und komm auf die Rangliste.</p><img src="${KIDS}j1.webp" alt=""></button>
    <button type="button" class="apk apzeile" data-x="live"><span class="apico ic-pink">${SV(I.live, 22)}</span><span class="aptx"><b>Live-Quiz${li ? " " + li.zeit + " · " + h(li.thema) : ""}</b><small>${liveTxt}</small></span>${li && li.st !== "jetzt" ? `<span class="ap-cd" id="epLiveCd">${ES.dauerText ? ES.dauerText(li.rest) : ""}</span>` : ""}</button>
    <div class="ap-zwei">
      <button type="button" class="apk" data-x="spielmodi">${SV(I.pad, 24)}<b>Wettbewerb &amp; Hardcore</b></button>
      <button type="button" class="apk gold" data-x="board">${SV(I.pokal, 24)}<b>Top 10 der Schweiz</b></button>
    </div>
    ${se ? `<button type="button" class="apk apzeile" data-x="season"><span class="ap-mult m${p.mult}">×${p.mult}</span><span class="aptx"><b>${h(se.name)} · noch ${p.rest} Tage</b><small>${seTxt}</small></span>${SV(I.pfeil, 20)}</button>` : ""}
  </div>`;
}

/* ---------- Einpassen: jeder Bereich so hoch wie der freie Bildschirm ---------- */
function einpassen(){
  const ap = document.querySelector("#app > .ap"); if(!ap) return;
  const top = ap.getBoundingClientRect().top + scrollY;
  const quer = QUER.matches, unten = quer ? 16 : 96 + (parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--sab")) || 0);
  const tabs = document.getElementById("epTabs"); const tr = tabs && !quer ? tabs.getBoundingClientRect() : null;
  const ende = tr ? tr.top - 10 : innerHeight - unten;
  ap.style.height = Math.max(300, Math.floor(ende - top)) + "px";
  ap.classList.remove("ap-eng");
  if(ap.scrollHeight > ap.clientHeight + 2) ap.classList.add("ap-eng");
}

/* ---------- Aktionen ---------- */
function binden(wurzel){
  const ES = E();
  wurzel.querySelectorAll("[data-x]").forEach(b => b.addEventListener("click", e => { e.stopPropagation(); const a = b.dataset.x;
    if(a === "board"){ S.boardStufe = S.stufe; go("board"); }
    else if(a === "season"){ try{ S.boardModus = "season"; S.boardSeason = aktuelleSeason().id; }catch(err){} go("board"); }
    else if(a === "lib"){ setLibModus(true); scrollTo(0, 0); }
    else if(ES.aktion) ES.aktion(a, b); }));
  wurzel.querySelectorAll("[data-s]").forEach(b => b.onclick = () => { S.stufe = +b.dataset.s; try{ store.set("ep-stufe", S.stufe); }catch(e){} render(); });
  wurzel.querySelectorAll("[data-b]").forEach(b => b.onclick = () => { S.bereich = BEREICHE.find(x => x.id === b.dataset.b); go("bereich"); });
  wurzel.querySelectorAll("[data-team]").forEach(b => b.onclick = () => { try{ localStorage.setItem((ES.K && ES.K.team) || "ep-team", JSON.stringify(b.dataset.team)); }catch(e){} render(); });
}

/* ---------- Tab-Leiste ---------- */
function leiste(){
  let el = document.getElementById("epTabs");
  if(!an()){ if(el) el.remove(); return; }
  if(!el){
    el = document.createElement("nav"); el.id = "epTabs"; el.setAttribute("aria-label", "Hauptbereiche");
    el.innerHTML = TABS.map(t => `<button type="button" data-tab="${t}">${t === "ich" ? `<span class="tabav"><img src="${KIDS}m1.webp" alt=""></span>` : SV(I[t], 22)}<span>${TAB_NAME[t]}</span></button>`).join("");
    document.body.appendChild(el);
    el.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => { const t = b.dataset.tab;
      if(t === "qeels"){ try{ oeffneReels(); }catch(e){} return; }
      if(t === "ich"){ try{ if(S.libModus) S.libModus = false, document.documentElement.dataset.mode = "spiel"; }catch(e){} try{ E().aktion("profil"); }catch(e){ go("profil"); } return; }
      setTab(t); if(S.libModus){ S.libModus = false; document.documentElement.dataset.mode = "spiel"; } go("home"); });
  }
  const akt = S.libModus ? "themen" : tabVon(S.screen);
  el.querySelectorAll("[data-tab]").forEach(b => { if(b.dataset.tab === akt) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
}

/* ---------- Einhängen ---------- */
const vorHome = window.renderHome;
window.renderHome = function(){
  const r = vorHome.apply(this, arguments);
  if(!an()) return r;
  try{
    const app = document.getElementById("app"); if(!app) return r;
    app.innerHTML = tab === "themen" ? themenHTML() : tab === "duell" ? duellHTML() : heuteHTML();
    binden(app);
    requestAnimationFrame(einpassen);
  }catch(e){ console.warn("app.js", e); }
  return r;
};
const vorRender = window.render;
window.render = function(){
  const r = vorRender.apply(this, arguments);
  try{
    document.body.classList.toggle("ep-app", an());
    document.body.classList.toggle("ep-home", an() && S.screen === "home" && !S.libModus);
    document.body.classList.toggle("ep-ohne", an() && OHNE_LEISTE.includes(S.screen));
    leiste();
  }catch(e){ console.warn("app.js", e); }
  return r;
};
/* Menü: Impressum und Datenschutz, weil die Fusszeile auf der Startseite ausgeblendet ist */
const vorNav = window.renderNav;
if(typeof vorNav === "function"){
  window.renderNav = function(){
    const r = vorNav.apply(this, arguments);
    try{ if(an()){ const m = document.getElementById("hauptmenue"); if(m && !m.querySelector(".ap-recht")){ const d = document.createElement("div"); d.className = "ap-recht"; d.innerHTML = `<hr><a role="menuitem" href="impressum.html">Impressum</a><a role="menuitem" href="datenschutz.html">Datenschutz</a>`; m.appendChild(d); } } }catch(e){}
    return r;
  };
}
const neu = () => { try{ render(); }catch(e){} };
try{ MQ.addEventListener("change", neu); QUER.addEventListener("change", neu); }catch(e){}
addEventListener("resize", () => { if(an() && S.screen === "home") requestAnimationFrame(einpassen); });

window.EP_APP = { an, tab: () => tab, setTab };
try{ if(an()) render(); }catch(e){}
})();
