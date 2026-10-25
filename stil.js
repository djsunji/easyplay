/* easyplay · stil.js
   Bringt alle Unterseiten (Bereich, Thema, Modus, Duell, Rangliste, Konto …)
   in den neuen Look der Startseite: farbige Verlaufskarten mit weisser Schrift,
   Bricolage-Titel, Glas-Pillen und die neuen Kids. Läuft nach app.js. */
(function(){
"use strict";
const KIDS = "img/kids/";

const css = document.createElement("style");
css.id = "ep-stil-css";
css.textContent = `
/* ---------- Kopf-Banner ---------- */
.st-kopf{--c:var(--welt);position:relative;max-width:1100px;margin:14px auto 30px;border-radius:36px;padding:34px 330px 30px 40px;color:#fff;text-align:left;
  background:radial-gradient(circle at 2px 2px,rgba(255,255,255,.18) 1.5px,transparent 0) 0 0/18px 18px,
    radial-gradient(120% 140% at 0% 0%,color-mix(in srgb,var(--c) 55%,#1B2240) 0%,transparent 60%),
    linear-gradient(125deg,color-mix(in srgb,var(--c) 78%,#1B2240),var(--c) 55%,color-mix(in srgb,var(--c) 78%,#fff));
  box-shadow:0 8px 0 color-mix(in srgb,var(--c) 55%,#000),0 30px 60px -30px rgba(27,34,64,.6);isolation:isolate}
.st-kopf::before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:-1;
  background:radial-gradient(260px 200px at 84% 40%,rgba(255,255,255,.22),transparent 70%)}
.st-kopf .bhead{justify-content:flex-start!important;text-align:left!important;margin:0 0 12px!important;flex-wrap:nowrap}
.st-kopf .bhead h1,.st-kopf h1{color:#fff!important;font-family:"Bricolage Grotesque",Lexend,system-ui,sans-serif!important;font-weight:800!important;font-size:clamp(2rem,4vw,3.3rem)!important;line-height:1.05;margin:0;text-shadow:0 3px 14px rgba(0,0,0,.18)}
.st-kopf .bhead .emo{flex:0 0 auto;display:grid;place-items:center;width:84px;height:84px;font-size:3rem!important;line-height:0;background:#fff!important;border-radius:26px;color:var(--c)!important;box-shadow:0 10px 22px -10px rgba(0,0,0,.45);transform:rotate(-4deg)}
.st-kopf .bdesc{color:rgba(255,255,255,.94)!important;margin:0 0 18px!important;text-align:left!important;max-width:58ch;font-size:1.05rem;line-height:1.5}
.st-kopf .sbar{justify-content:flex-start!important;margin:0!important}
.st-kopf .sbtns{background:rgba(15,20,48,.28)!important;border:1px solid rgba(255,255,255,.28)!important;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
.st-kopf .sbtns button{color:#fff!important;background:transparent!important}
.st-kopf .sbtns button[aria-pressed="true"]{background:#fff!important;color:#1B2240!important;box-shadow:0 4px 12px -4px rgba(0,0,0,.4)}
.st-kopf .sinfo{color:#fff!important;background:rgba(15,20,48,.22);border-radius:999px;padding:6px 14px;font-size:.92rem}
.st-kopf .st-kids{position:absolute;right:28px;bottom:0;height:calc(100% + 56px);max-height:320px;min-height:200px;width:auto;pointer-events:none;
  filter:drop-shadow(0 14px 18px rgba(0,0,0,.35))}
.st-kopf.st-mitte{text-align:center}

/* Kopf-Varianten der Spezialseiten */
.dukopf.st-kopf,.rlkopf.st-kopf,.pagehead.st-kopf{max-width:1100px;display:block}
.dukopf.st-kopf p,.rlkopf.st-kopf .rlintro{color:rgba(255,255,255,.94)!important;max-width:58ch;margin:8px 0 0;font-size:1.05rem}
.dukopf.st-kopf .dusw{display:inline-grid;place-items:center;width:78px;height:78px;border-radius:24px;background:#fff;font-size:2.6rem;margin-bottom:10px;box-shadow:0 10px 22px -10px rgba(0,0,0,.45);transform:rotate(-4deg)}
.rlkopf.st-kopf .rlpokal{margin:0 0 10px!important}
.rlkopf.st-kopf .rlregeln{margin-top:18px}
.rlkopf.st-kopf .rlregeln>div{background:rgba(15,20,48,.26)!important;border:1px solid rgba(255,255,255,.26)!important;box-shadow:none!important;color:#fff}
.rlkopf.st-kopf .rlregeln b{color:#fff}
.rlkopf.st-kopf .rlregeln span{color:rgba(255,255,255,.88)!important}
.pagehead.st-kopf{display:flex!important;align-items:center;gap:20px;flex-wrap:nowrap}
.pagehead.st-kopf .bigav{background:#fff!important;border:0!important;box-shadow:0 10px 22px -10px rgba(0,0,0,.45)!important;transform:rotate(-4deg);flex:0 0 auto}
.pagehead.st-kopf p,.pagehead.st-kopf .sub{color:rgba(255,255,255,.92)!important}

/* alte Gäste weg, die neuen Kids stehen im Banner */
#app .gaeste,#app img.gast.gl,#app img.gast.gr,#app .libgast{display:none!important}

/* Bibliothek: Lumi und Milo neben dem Buch */
.libkopf{position:relative}
.libkopf .st-libkids{position:absolute;right:-30px;bottom:-26px;height:250px;width:auto;z-index:3;pointer-events:none;filter:drop-shadow(0 14px 18px rgba(0,0,0,.35))}
@media (max-width:1100px){.libkopf .st-libkids{height:190px;right:-10px}}
@media (max-width:860px){.libkopf .st-libkids{display:none}}

/* ---------- Brotkrumen ---------- */
body:not(.ep-app) .crumbs{margin:6px auto 14px;max-width:1100px}
body:not(.ep-app) .crumb{background:rgba(15,20,48,.62)!important;border:1px solid rgba(255,255,255,.22)!important;color:#fff!important;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);box-shadow:0 6px 16px -8px rgba(0,0,0,.45)}
body:not(.ep-app) .crumb:hover{background:rgba(15,20,48,.78)!important}
body:not(.ep-app) .crumb.cur{background:#fff!important;color:#1B2240!important;border-color:#fff!important}
body:not(.ep-app) .crumbs .sep{color:#1B2240;opacity:.55}

/* ---------- Abschnittstitel ---------- */
#app:not(:has(.ep-banner)) p.label{justify-content:flex-start!important;max-width:1100px;margin-inline:auto!important}
#app:not(:has(.ep-banner)) p.label>span{display:inline-flex!important;align-items:center;gap:8px;padding:8px 22px!important;border-radius:999px!important;color:#fff!important;-webkit-text-fill-color:#fff!important;font-size:clamp(1.3rem,2.4vw,1.7rem)!important;
  background:linear-gradient(135deg,#8A3FE0,#3D5AFE)!important;box-shadow:0 6px 0 rgba(0,0,0,.25),0 16px 30px -14px #8A3FE0!important;text-shadow:none!important}
#app:not(:has(.ep-banner)) p.label>small{background:rgba(255,255,255,.9);color:#1B2240;border-radius:999px;padding:4px 12px;font-size:.85rem;font-family:Lexend,system-ui,sans-serif;font-weight:600}

/* ---------- Themen-Kacheln ---------- */
#app .themen{max-width:1100px;margin-inline:auto;gap:18px!important}
#app .themen .thema{border:0!important;color:#fff!important;border-radius:28px!important;min-height:200px;padding:22px 16px 20px!important;
  background:radial-gradient(circle at 2px 2px,rgba(255,255,255,.2) 1.5px,transparent 0) 0 0/18px 18px,
    linear-gradient(160deg,color-mix(in srgb,var(--c) 72%,#fff),var(--c) 70%)!important;
  box-shadow:0 7px 0 color-mix(in srgb,var(--c) 58%,#000),0 18px 30px -18px color-mix(in srgb,var(--c) 70%,#000)!important;
  overflow:hidden;transition:transform .18s}
#app .themen .thema::before{content:"";position:absolute;left:-40px;top:-40px;width:150px;height:150px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.35),transparent 70%);pointer-events:none}
#app .themen .thema:hover{transform:translateY(-4px) rotate(-.4deg)}
#app .themen .thema:active{transform:translateY(4px);box-shadow:0 3px 0 color-mix(in srgb,var(--c) 58%,#000)!important}
#app .themen .thema .emo{background:#fff!important;width:76px;height:76px;display:grid;place-items:center;border-radius:24px!important;font-size:2.7rem!important;padding:0!important;color:var(--c)!important;box-shadow:0 10px 20px -10px rgba(0,0,0,.45);position:relative}
#app .themen .thema b{color:#fff;font-size:1.3rem;line-height:1.15;text-shadow:0 2px 8px rgba(0,0,0,.15)}
#app .themen .thema span.t{color:rgba(255,255,255,.92)!important}
#app .themen .thema span.n{background:rgba(15,20,48,.3)!important;color:#fff!important;margin-top:10px}
#app .themen .thema .step{color:rgba(255,255,255,.55)!important}
#app .themen .thema .stars,#app .themen .thema .t *{color:inherit}

/* ---------- Modus-Karten (Training / Test) ---------- */
#app .modes{max-width:1100px;margin-inline:auto;gap:22px}
#app .modes .mode{border:0!important;color:#fff!important;border-radius:32px!important;padding:28px 26px!important;
  background:radial-gradient(circle at 2px 2px,rgba(255,255,255,.18) 1.5px,transparent 0) 0 0/18px 18px,linear-gradient(150deg,#5B7CFF,#3D5AFE 55%,#2B3FC8)!important;
  box-shadow:0 8px 0 #22309A,0 26px 40px -24px rgba(27,34,64,.7)!important}
#app .modes .mode.test{background:radial-gradient(circle at 2px 2px,rgba(255,255,255,.18) 1.5px,transparent 0) 0 0/18px 18px,linear-gradient(150deg,#A65BFF,#8A3FE0 50%,#E043B8)!important;box-shadow:0 8px 0 #5E2398,0 26px 40px -24px rgba(27,34,64,.7)!important}
#app .modes .mode .em{display:grid;place-items:center;width:80px;height:80px;border-radius:24px;background:#fff;color:#3D5AFE!important;font-size:2.8rem!important;box-shadow:0 10px 20px -10px rgba(0,0,0,.45);transform:rotate(-4deg)}
#app .modes .mode.test .em{color:#8A3FE0!important}
#app .modes .mode h2{color:#fff!important;font-family:"Bricolage Grotesque",Lexend,system-ui,sans-serif;font-size:2.1rem!important}
#app .modes .mode p,#app .modes .mode label,#app .modes .mode .pick-lbl,#app .modes .mode small,#app .modes .mode summary,#app .modes .mode details{color:rgba(255,255,255,.93)!important}
#app .modes .mode b,#app .modes .mode strong{color:#fff}
#app .modes .mode details{background:rgba(15,20,48,.24);border-radius:16px;padding:8px 14px}
#app .modes .mode .counts button{background:rgba(255,255,255,.18)!important;border:1px solid rgba(255,255,255,.35)!important;color:#fff!important;border-radius:999px!important}
#app .modes .mode .counts button[aria-pressed="true"],#app .modes .mode .counts button.on{background:#fff!important;color:#1B2240!important}
#app .modes .mode .slider *{color:#fff}
#app .modes .mode .big,#app .modes .mode .startlbl{background:linear-gradient(135deg,#FFE15A,#FFC23A)!important;color:#1B2240!important;box-shadow:0 6px 0 #C79A12,0 14px 24px -12px rgba(0,0,0,.5)!important;font-weight:700}
#app .modes .mode a{color:#fff}

/* ---------- Bereich-Kacheln auf Unterseiten (Politik, Geschichte …) ---------- */
#app:not(:has(.ep-banner)) .bereiche{max-width:1100px;margin-inline:auto}

/* ---------- Duell & Spielmodi ---------- */
#app .dumodi .dumodus{border:0!important;color:#fff!important;border-radius:28px!important;
  background:radial-gradient(circle at 2px 2px,rgba(255,255,255,.18) 1.5px,transparent 0) 0 0/18px 18px,linear-gradient(150deg,#5B7CFF,#3D5AFE 60%,#2B3FC8)!important;box-shadow:0 7px 0 #22309A,0 22px 34px -22px rgba(27,34,64,.7)!important}
#app .dumodi .dumodus:nth-child(2){background:radial-gradient(circle at 2px 2px,rgba(255,255,255,.18) 1.5px,transparent 0) 0 0/18px 18px,linear-gradient(150deg,#2FD1A7,#12A57F 60%,#0B7C61)!important;box-shadow:0 7px 0 #075A46,0 22px 34px -22px rgba(27,34,64,.7)!important}
#app .dumodi .dumodus:nth-child(3){background:radial-gradient(circle at 2px 2px,rgba(255,255,255,.18) 1.5px,transparent 0) 0 0/18px 18px,linear-gradient(150deg,#A65BFF,#8A3FE0 55%,#E043B8)!important;box-shadow:0 7px 0 #5E2398,0 22px 34px -22px rgba(27,34,64,.7)!important}
#app .dumodi .dumodus h2{color:#fff!important;font-family:"Bricolage Grotesque",Lexend,system-ui,sans-serif}
#app .dumodi .dumodus p{color:rgba(255,255,255,.92)!important}
#app .dumodi .dumodus .dmi{display:inline-grid;place-items:center;justify-self:center;width:66px;height:66px;border-radius:20px;background:#fff;font-size:2.2rem;box-shadow:0 10px 20px -10px rgba(0,0,0,.45)}
#app .dumodi .dumodus .big{background:linear-gradient(135deg,#FFE15A,#FFC23A)!important;color:#1B2240!important;box-shadow:0 6px 0 #C79A12!important}
#app .card.dueinst,#app .authbox,#app .form,#app .card{border-radius:28px!important;border:0!important;box-shadow:0 26px 50px -30px rgba(27,34,64,.55),0 0 0 1px rgba(255,255,255,.9) inset!important}

/* ---------- Rangliste ---------- */
#app .segs{border-radius:999px}
body:not(.ep-app) #app .rlmodus,body:not(.ep-app) #app .rlsegs{background:rgba(15,20,48,.62)!important;border:1px solid rgba(255,255,255,.22)!important;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);padding:5px!important;border-radius:999px!important;width:max-content;max-width:100%;margin-inline:auto!important;display:flex!important;flex-wrap:wrap;justify-content:center}
body:not(.ep-app) #app .rlmodus .seg,body:not(.ep-app) #app .rlsegs .seg{background:transparent!important;border:0!important;color:#fff!important;border-radius:999px!important;box-shadow:none!important}
body:not(.ep-app) #app .rlmodus .seg[aria-pressed="true"],body:not(.ep-app) #app .rlsegs .seg[aria-pressed="true"]{background:linear-gradient(135deg,#3D5AFE,#8A3FE0 60%,#E043B8)!important;color:#fff!important}

/* ---------- Profil ---------- */
#app[data-seite="profil"]>*{max-width:1100px;margin-left:auto;margin-right:auto}
#app[data-seite="profil"] .pagehead.st-kopf{padding-top:30px;padding-bottom:28px}
.st-chips{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}
.st-chips span{display:flex;flex-direction:column;background:rgba(15,20,48,.26);border:1px solid rgba(255,255,255,.28);border-radius:18px;padding:8px 14px;min-width:90px}
.st-chips b{font:800 1.25rem "Bricolage Grotesque",sans-serif;color:#fff;white-space:nowrap}
.st-chips small{font-size:.78rem;color:rgba(255,255,255,.85)}
#app[data-seite="profil"]>.row{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:18px}
#app[data-seite="profil"]>.row .big{border-radius:999px!important;background:linear-gradient(135deg,#FFE15A,#FFC23A)!important;color:#1B2240!important;box-shadow:0 6px 0 #C79A12!important}
#app[data-seite="profil"]>.row .big.alt{background:#fff!important;box-shadow:0 6px 0 #C9CFE8!important}
#app[data-seite="profil"] .statgrid{grid-template-columns:1fr 1fr!important;gap:18px}
#app[data-seite="profil"] .statcard{border:0!important;border-radius:30px!important;padding:22px 24px!important;margin-bottom:18px;background:rgba(255,255,255,.93)!important;box-shadow:0 26px 50px -30px rgba(27,34,64,.55),inset 0 0 0 1px #fff!important;position:relative;overflow:hidden}
#app[data-seite="profil"] .statcard::before{content:"";position:absolute;left:0;top:0;right:0;height:6px;background:linear-gradient(90deg,#3D5AFE,#8A3FE0,#E043B8,#FF8A3D)}
#app[data-seite="profil"] .statcard h2{font-family:"Bricolage Grotesque",sans-serif!important;font-size:1.45rem!important}
#app[data-seite="profil"] .statgrid .statcard{color:#fff;background:radial-gradient(circle at 2px 2px,rgba(255,255,255,.16) 1.5px,transparent 0) 0 0/18px 18px,linear-gradient(150deg,#5B7CFF,#3D5AFE 55%,#2B3FC8)!important;box-shadow:0 8px 0 #22309A,0 26px 40px -24px rgba(27,34,64,.7)!important}
#app[data-seite="profil"] .statgrid .statcard.test{background:radial-gradient(circle at 2px 2px,rgba(255,255,255,.16) 1.5px,transparent 0) 0 0/18px 18px,linear-gradient(150deg,#A65BFF,#8A3FE0 50%,#E043B8)!important;box-shadow:0 8px 0 #5E2398,0 26px 40px -24px rgba(27,34,64,.7)!important}
#app[data-seite="profil"] .statgrid .statcard::before{display:none}
#app[data-seite="profil"] .statgrid .statcard h2,#app[data-seite="profil"] .statgrid .statcard *{color:#fff}
#app[data-seite="profil"] .statgrid .num{background:rgba(255,255,255,.16)!important;border:1px solid rgba(255,255,255,.22)}
#app[data-seite="profil"] .statgrid .num small,#app[data-seite="profil"] .statgrid .num span{color:rgba(255,255,255,.85)!important}
#app[data-seite="profil"] .pokalcard{background:linear-gradient(150deg,#FFF6D6,#FFE7A3)!important}
#app[data-seite="profil"] .erfolg.ok{border:0!important;color:#fff;background:linear-gradient(150deg,#A65BFF,#8A3FE0)!important;box-shadow:0 5px 0 #5E2398}
#app[data-seite="profil"] .erfolg.ok *{color:#fff!important}
#app[data-seite="profil"] .erfolg{border-radius:20px!important}
.st-wochen .st-wgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px}
.st-wab{display:flex;flex-direction:column;align-items:center;text-align:center;gap:2px;padding:14px 10px;border-radius:22px;color:#fff;background:linear-gradient(150deg,#2FD1A7,#12A57F);box-shadow:0 5px 0 #075A46}
.st-wab span{font-size:2rem}.st-wab b{font:800 1.05rem "Bricolage Grotesque",sans-serif}.st-wab small{font-size:.78rem;opacity:.9}
@media (max-width:860px){#app[data-seite="profil"] .statgrid{grid-template-columns:1fr!important}.st-chips span{min-width:0;padding:6px 10px}.st-chips b{font-size:1rem}}

/* ---------- Handy / schmal ---------- */
@media (max-width:860px){
  .st-kopf{padding:26px 24px 26px;margin:10px auto 22px;border-radius:30px}
  .st-kopf .st-kids{display:none}
  .st-kopf .bhead .emo{width:66px;height:66px;font-size:2.3rem!important;border-radius:20px}
  .st-kopf .bhead h1,.st-kopf h1{font-size:clamp(1.6rem,6.4vw,2.3rem)!important}
  .rlkopf.st-kopf .rlregeln{grid-template-columns:1fr}
}
/* In der App-Ansicht ist oben schon die Zurück-Zeile: Banner kompakter */
body.ep-app .st-kopf{padding:20px 18px 20px;margin:4px auto 16px;border-radius:26px}
body.ep-app .st-kopf .bdesc{display:none}
body.ep-app .st-kopf .bhead{margin:0 0 10px!important}
body.ep-app .st-kopf .bhead .emo{width:56px;height:56px;font-size:2rem!important;border-radius:18px}
body.ep-app .st-kopf .sbtns,.st-kopf .sbtns{max-width:100%}
body.ep-app .st-kopf .sbtns{display:flex!important;width:100%}
body.ep-app .st-kopf .sbtns button{flex:1 1 0;justify-content:center;padding:6px 6px;min-height:38px;font-size:.92rem;white-space:nowrap;min-width:0}
body.ep-app .dukopf.st-kopf p{display:none}
body.ep-app .st-kopf .st-kids,body.ep-app .libkopf .st-libkids{display:none}
body.ep-app .st-kopf .sinfo{display:none}
`;
document.head.appendChild(css);

/* Seitenfarbe: aus der ersten Kachel oder dem Bereich/Thema */
function farbe(app){
  try{
    if(S.bereich && S.screen === "bereich" && S.bereich.c) return `var(${S.bereich.c})`;
    if(S.thema && S.thema.bereich && S.thema.bereich.c) return `var(${S.thema.bereich.c})`;
    const k = app.querySelector("[style*='--c']");
    if(k){ const m = /--c:\s*([^;]+)/.exec(k.getAttribute("style")); if(m) return m[1].trim(); }
  }catch(e){}
  return "var(--welt)";
}
const SPEZIAL = {
  board:   {sel:".rlkopf",  c:"#E7A400", kid:"duo-jubel.webp"},
  duell:   {sel:".dukopf",  c:"#E2457A", kid:"duo-bereit.webp"},
  spielmodi:{sel:".pagehead", c:"#8A3FE0", kid:"duo-bereit.webp"},
  register:{sel:".pagehead", c:"#3D5AFE", kid:"duo-winken.webp"},
  login:   {sel:".pagehead", c:"#3D5AFE", kid:"duo-winken.webp"},
  profil:  {sel:".pagehead", c:"#12A57F", kid:"duo-winken.webp"}
};
function kidImg(file){ const i = document.createElement("img"); i.className = "st-kids"; i.src = KIDS + file; i.alt = ""; i.setAttribute("aria-hidden","true"); return i; }

function schmuck(){
  const app = document.getElementById("app"); if(!app) return;
  try{ app.dataset.seite = S.libModus && S.screen === "lib" ? "lib" : S.screen; }catch(e){}
  if(typeof S === "undefined" || S.screen === "home" && !S.libModus) return;
  /* 1) normale Unterseiten mit .bhead → Banner */
  const bh = app.querySelector(":scope > .bhead");
  if(bh && !bh.closest(".st-kopf")){
    const k = document.createElement("section"); k.className = "st-kopf"; k.style.setProperty("--c", farbe(app));
    bh.before(k); k.appendChild(bh);
    let n = k.nextElementSibling;
    while(n && (n.matches(".bdesc") || n.matches(".sbar"))){ const x = n.nextElementSibling; k.appendChild(n); n = x; }
    const file = S.screen === "mode" ? "duo-bereit.webp" : S.screen === "bereich" ? "duo-winken.webp" : "duo-jubel.webp";
    k.appendChild(kidImg(file));
  }
  /* Bibliothek */
  const lk = app.querySelector(".libkopf");
  if(lk && !lk.querySelector(".st-libkids")){ const i = kidImg("duo-winken.webp"); i.className = "st-libkids"; lk.appendChild(i); }
  /* Profil: Kennzahlen im Banner und Wochen-Abzeichen */
  if(S.screen === "profil") profilSchmuck(app);
  /* 2) Spezialseiten: vorhandenen Kopf einfärben */
  const sp = SPEZIAL[S.screen];
  if(sp){
    const el = app.querySelector(sp.sel);
    if(el && !el.classList.contains("st-kopf")){ el.classList.add("st-kopf"); el.style.setProperty("--c", sp.c); el.appendChild(kidImg(sp.kid)); }
  }
}

function profilSchmuck(app){
  const kopf = app.querySelector(".pagehead.st-kopf");
  const ES = window.EP_START || {};
  if(kopf && !kopf.querySelector(".st-chips")){
    let lv = null, se = {n:0}, ab = {hat:0, alle:0}; try{ lv = ES.level(); }catch(e){} try{ se = ES.serie(); }catch(e){} try{ ab = ES.abzeichenZahl(); }catch(e){}
    const d = document.createElement("div"); d.className = "st-chips";
    d.innerHTML = `<span><b>${lv ? lv.level : 1}</b><small>Level</small></span><span><b>${lv ? lv.titel.emo + " " + lv.titel.name : "Neuling"}</b><small>Titel</small></span><span><b>${se.n || 0} 🔥</b><small>Tage Serie</small></span><span><b>${ab.hat || 0}</b><small>Abzeichen</small></span>`;
    const txt = kopf.querySelector(":scope > div:not(.bigav)"); (txt || kopf).appendChild(d);
  }
  const grid = app.querySelector(".statgrid");
  if(grid && !app.querySelector(".st-wochen")){
    let l = []; try{ l = JSON.parse(localStorage.getItem("ep-wochenabzeichen") || "[]"); }catch(e){}
    const sec = document.createElement("section"); sec.className = "statcard st-wochen";
    sec.innerHTML = `<h2>🏔️ Wochen-Abzeichen <small>(${l.length})</small></h2>` + (l.length
      ? `<div class="st-wgrid">${l.slice().reverse().map(x => `<div class="st-wab"><span>🏅</span><b>${(x.name || "").replace(/[<>&]/g, "")}</b><small>${String(x.w || "").replace("-W", " · Woche ")} · ${x.r}/${x.n} richtig</small></div>`).join("")}</div>`
      : `<p class="help">Mach den Test zum Thema der Woche. Schaffst du mindestens die Hälfte, bekommst du ein Wochen-Abzeichen und Extrapunkte.</p>`);
    grid.after(sec);
  }
}

const app = document.getElementById("app");
if(app){
  new MutationObserver(() => schmuck()).observe(app, {childList:true});
  schmuck();
}
})();

/* ================= Qeels: Schalter Quiz/Wissen, Erklärung, kein Abschneiden ================= */
(function(){
"use strict";
const css = document.createElement("style");
css.id = "ep-qeels-css";
css.textContent = `
#reels .rinhalt{justify-content:safe center!important}
#reels:has(.rstories) .rinhalt{padding-top:182px!important}
#reels .ropts:has(.richtig) .ropt:not(.richtig):not(.falsch){display:none!important}
#reels .ropts:has(.richtig) ~ .rerkl{margin-top:2px}
#reels .rtabs [data-rtab="quiz"],#reels .rtabs [data-rtab="wissen"]{display:none!important}
#reels .rschalter{display:inline-flex;align-items:center;gap:7px;margin:0 4px;user-select:none;-webkit-user-select:none}
#reels .rschalter .rsl{font-weight:700;font-size:.9rem;color:rgba(255,255,255,.65);cursor:pointer;background:none;border:0;padding:4px 0;font-family:inherit}
#reels .rschalter .rsl.an{color:#fff}
#reels .rsw{position:relative;width:54px;height:32px;border-radius:999px;border:0;padding:0;cursor:grab;touch-action:none;flex:0 0 auto;
  background:rgba(255,255,255,.28);box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.35);transition:background .25s}
#reels .rsw i{position:absolute;top:3px;left:12px;width:26px;height:26px;border-radius:50%;background:#fff;box-shadow:0 3px 8px rgba(0,0,0,.35);transition:left .25s cubic-bezier(.3,1.4,.5,1)}
#reels .rsw[data-st="quiz"]{background:linear-gradient(135deg,#FF8A3D,#E043B8)}
#reels .rsw[data-st="quiz"] i{left:3px}
#reels .rsw[data-st="wissen"]{background:linear-gradient(135deg,#3D5AFE,#12A5C9)}
#reels .rsw[data-st="wissen"] i{left:25px}
#reels .rsw.zieht{cursor:grabbing}
#reels .rsw.zieht i{transition:none}
@media (max-width:440px){#reels #rZu .apzt,#reels #rZu span{display:none!important}#reels #rZu{padding:0!important;width:44px;min-width:44px;justify-content:center}#reels .rtabs{min-width:0;flex:1 1 auto;justify-content:center}}
@media (max-width:420px){#reels .rschalter .rsl{font-size:.8rem}#reels .rsw{width:46px;height:28px}#reels .rsw i{width:22px;height:22px}#reels .rsw[data-st="wissen"] i{left:21px}#reels .rsw i{left:10px}}
`;
document.head.appendChild(css);

const BIRNE = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z"></path></svg>';

function zustand(o){ const q = o.querySelector('.rtabs [data-rtab="quiz"]'), w = o.querySelector('.rtabs [data-rtab="wissen"]');
  return q && q.getAttribute("aria-selected") === "true" ? "quiz" : w && w.getAttribute("aria-selected") === "true" ? "wissen" : "mix"; }
function setze(o, t){ const b = o.querySelector(`.rtabs [data-rtab="${t}"]`); if(b) b.click(); }

function schalter(o){
  const tabs = o.querySelector(".rtabs"); if(!tabs) return;
  let s = tabs.querySelector(".rschalter");
  if(!s){
    s = document.createElement("span"); s.className = "rschalter";
    s.innerHTML = `<button type="button" class="rsl" data-z="quiz">Quiz</button><button type="button" class="rsw" role="switch" aria-label="Zwischen Quiz und Wissen wechseln"><i></i></button><button type="button" class="rsl" data-z="wissen">Wissen</button>`;
    const nach = tabs.querySelector('[data-rtab="mix"]'); if(nach) nach.after(s); else tabs.prepend(s);
    s.querySelectorAll("[data-z]").forEach(b => b.onclick = () => setze(o, b.dataset.z));
    const sw = s.querySelector(".rsw"), knopf = sw.querySelector("i");
    let x0 = null, bewegt = false;
    sw.addEventListener("pointerdown", e => { x0 = e.clientX; bewegt = false; sw.classList.add("zieht"); try{ sw.setPointerCapture(e.pointerId); }catch(err){} });
    sw.addEventListener("pointermove", e => { if(x0 == null) return; const dx = e.clientX - x0; if(Math.abs(dx) > 4) bewegt = true;
      const max = sw.clientWidth - knopf.offsetWidth - 3; const start = zustand(o) === "wissen" ? max : zustand(o) === "quiz" ? 3 : (sw.clientWidth - knopf.offsetWidth) / 2;
      knopf.style.left = Math.max(3, Math.min(max, start + dx)) + "px"; });
    const los = e => { if(x0 == null) return; const dx = e.clientX - x0; x0 = null; sw.classList.remove("zieht"); knopf.style.left = "";
      const z = zustand(o);
      if(bewegt && Math.abs(dx) > 8) setze(o, dx > 0 ? "wissen" : "quiz");
      else setze(o, z === "quiz" ? "wissen" : "quiz"); };
    sw.addEventListener("pointerup", los); sw.addEventListener("pointercancel", () => { x0 = null; sw.classList.remove("zieht"); knopf.style.left = ""; });
  }
  const z = zustand(o), sw = s.querySelector(".rsw");
  if(sw.dataset.st !== z){ sw.dataset.st = z; sw.setAttribute("aria-checked", z === "wissen"); }
  s.querySelectorAll("[data-z]").forEach(b => b.classList.toggle("an", b.dataset.z === z));
}

function rail(o){
  o.querySelectorAll(".rrail [data-erkl]").forEach(b => b.remove());
  o.querySelectorAll(".rrail [data-qart]").forEach(b => {
    const sm = b.querySelector("small"); if(sm && sm.textContent !== "Erklärung") sm.textContent = "Erklärung";
    const bi = b.querySelector(".rbi"); if(!bi || bi.dataset.birne) return;
    bi.dataset.birne = "1"; bi.innerHTML = bi.querySelector("svg") || document.body.classList.contains("ep-app") ? BIRNE : "💡";
  });
}

function schmuck(){ const o = document.getElementById("reels"); if(!o) return; schalter(o); rail(o); }
let beob = null;
const vor = window.oeffneReels;
if(typeof vor === "function"){
  window.oeffneReels = function(){
    const r = vor.apply(this, arguments);
    try{ const o = document.getElementById("reels"); schmuck();
      if(o && !beob){ beob = new MutationObserver(() => { beob.disconnect(); try{ schmuck(); }finally{ beob.observe(o, {childList:true, subtree:true, attributes:true, attributeFilter:["aria-selected"]}); } });
        beob.observe(o, {childList:true, subtree:true, attributes:true, attributeFilter:["aria-selected"]}); } }catch(e){ console.warn("stil.js qeels", e); }
    return r;
  };
}
})();

/* ================= Live-Quiz ================= */
(function(){
const css = document.createElement("style"); css.id = "ep-live2-css";
css.textContent = `
.lq{display:flex;flex-direction:column;gap:18px;max-width:1100px!important;color:#fff}
.lq-zurueck{align-self:flex-start;display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(255,255,255,.25);background:rgba(15,20,48,.66);color:#fff;font:700 1rem Lexend,system-ui,sans-serif;padding:10px 18px;border-radius:999px;cursor:pointer;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);box-shadow:0 8px 18px -10px rgba(0,0,0,.5)}
.lq-zurueck:hover{background:rgba(15,20,48,.82)}
body.ep-app .lq-zurueck{display:none}
.lq-held{position:relative;border-radius:36px;padding:26px 330px 30px 34px;overflow:visible;isolation:isolate;
  background:radial-gradient(circle at 2px 2px,rgba(255,255,255,.14) 1.5px,transparent 0) 0 0/18px 18px,radial-gradient(90% 120% at 0% 0%,#E2457A55,transparent 60%),linear-gradient(125deg,#1B2240,#3D2A9E 45%,#B4237E);
  box-shadow:0 8px 0 #120f3a,0 30px 60px -30px rgba(27,34,64,.7)}
.lq-held::after{content:"";position:absolute;right:40px;top:-10px;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(255,227,77,.35),transparent 65%);z-index:-1;animation:lqGlow 2.6s ease-in-out infinite}
@keyframes lqGlow{50%{transform:scale(1.12);opacity:.7}}
.lq-kids{position:absolute;right:24px;bottom:0;height:calc(100% + 50px);max-height:360px;filter:drop-shadow(0 14px 18px rgba(0,0,0,.4)) drop-shadow(0 0 22px rgba(255,227,77,.45))}
.lq-ansage{display:flex;align-items:center;gap:12px;background:#FFE34D;color:#1B2240;border-radius:22px;padding:10px 12px 10px 14px;margin:0 0 16px;box-shadow:0 6px 0 #C9A200;max-width:640px;animation:lqWackel 3s ease-in-out infinite}
@keyframes lqWackel{0%,90%,100%{transform:rotate(0)}93%{transform:rotate(-1.2deg)}96%{transform:rotate(1.2deg)}}
.lq-mega{font-size:2rem;line-height:1}
.lq-ansage small{display:block;font:800 .72rem Lexend,sans-serif;letter-spacing:.1em;text-transform:uppercase;opacity:.7}
.lq-ansage p{margin:0;font:600 1rem/1.35 Lexend,sans-serif}
.lq-vorlesen{margin-left:auto;flex:0 0 auto;width:44px;height:44px;border-radius:14px;border:0;background:#1B2240;color:#fff;font-size:1.2rem;cursor:pointer}
.lq-tag{display:inline-flex;align-items:center;gap:8px;background:#E8364F;border-radius:999px;padding:5px 14px;font:800 .78rem Lexend,sans-serif;letter-spacing:.1em;text-transform:uppercase}
.lq-tag i{width:9px;height:9px;border-radius:50%;background:#fff;animation:lqPunkt 1s infinite}
@keyframes lqPunkt{50%{opacity:.2}}
.lq-thema{display:flex;align-items:center;gap:16px;margin:16px 0 12px}
.lq-ic{display:grid;place-items:center;width:84px;height:84px;border-radius:26px;background:#fff;font-size:3rem;line-height:0;transform:rotate(-5deg);box-shadow:0 10px 22px -10px rgba(0,0,0,.5);flex:0 0 auto}
.lq-thema small{font:700 .85rem Lexend,sans-serif;color:rgba(255,255,255,.8)}
.lq-thema h1{margin:2px 0 0;font:800 clamp(2rem,4.4vw,3.4rem)/1 "Bricolage Grotesque",sans-serif;color:#fff}
.lq-cd{display:flex;align-items:center;gap:8px;margin:6px 0 12px}
.lq-cd span{display:flex;flex-direction:column;align-items:center;min-width:76px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22);border-radius:18px;padding:8px 6px}
.lq-cd b{font:800 2.3rem/1 "Bricolage Grotesque",sans-serif;font-variant-numeric:tabular-nums}
.lq-cd small{font:600 .75rem Lexend,sans-serif;color:rgba(255,255,255,.75)}
.lq-cd i{font:800 1.8rem "Bricolage Grotesque",sans-serif;font-style:normal;color:#FFE34D}
.lq-info{margin:0;max-width:56ch;color:rgba(255,255,255,.9);font-size:1rem;line-height:1.5}
.lq-teams{display:grid;grid-template-columns:1fr auto 1fr;gap:14px;align-items:center}
.lq-team{position:relative;display:flex;align-items:flex-end;gap:12px;min-height:150px;border-radius:30px;padding:16px 18px 16px 150px;overflow:visible;color:#fff}
.lq-team.lqlumi{background:linear-gradient(135deg,#FF7AD9,#E043B8 55%,#A3127F);box-shadow:0 7px 0 #8A1270,0 24px 40px -22px #E043B8}
.lq-team.lqmilo{background:linear-gradient(135deg,#8FA6FF,#3D5AFE 55%,#2232B8);box-shadow:0 7px 0 #1C2A99,0 24px 40px -22px #3D5AFE}
.lq-team img{position:absolute;left:10px;bottom:0;height:175px;filter:drop-shadow(0 10px 12px rgba(0,0,0,.35))}
.lq-team.dein img{filter:drop-shadow(0 0 16px rgba(255,255,255,.9)) drop-shadow(0 10px 12px rgba(0,0,0,.35))}
.lq-team b{display:block;font:800 1.5rem "Bricolage Grotesque",sans-serif}
.lq-team small{display:block;color:rgba(255,255,255,.9);font-size:.9rem;line-height:1.35}
.lq-dein{display:inline-block;margin-top:8px;background:#FFE34D;color:#1B2240;border-radius:999px;padding:3px 12px;font:800 .8rem Lexend,sans-serif}
.lq-team.dein{outline:4px solid #FFE34D;outline-offset:3px}
.lq-vs{display:grid;place-items:center;width:70px;height:70px;border-radius:50%;background:#1B2240;color:#FFE34D;font:800 1.6rem "Bricolage Grotesque",sans-serif;box-shadow:0 0 0 5px #FFE34D,0 10px 24px -6px rgba(0,0,0,.5);animation:lqWackel 2.4s infinite}
.lq-wechsel{align-self:center;background:rgba(255,255,255,.92);color:#1B2240;border-radius:999px;padding:8px 18px;font-weight:600}
.lq-plan,.lq-karte{background:rgba(15,20,48,.66);border:1px solid rgba(255,255,255,.18);border-radius:26px;padding:16px 18px;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
.lq-plan h2,.lq-karte h2{margin:0 0 10px;font:800 1.2rem "Bricolage Grotesque",sans-serif;color:#fff}
.lq-plan>div{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.lq-plan span{display:flex;flex-direction:column;gap:2px;background:rgba(255,255,255,.1);border-radius:16px;padding:10px 12px}
.lq-plan span.an{background:linear-gradient(135deg,#E8364F,#B4237E)}
.lq-plan b{font:800 1.15rem "Bricolage Grotesque",sans-serif}.lq-plan small{color:rgba(255,255,255,.85)}
.lq-karte p{margin:4px 0;color:rgba(255,255,255,.92)}
.lq-regeln{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.lq-regeln div{display:flex;flex-direction:column;gap:2px;border-radius:24px;padding:16px;background:rgba(255,255,255,.94);color:#1B2240;box-shadow:0 16px 30px -20px rgba(27,34,64,.6)}
.lq-regeln span{font-size:1.8rem}.lq-regeln b{font:800 1.1rem "Bricolage Grotesque",sans-serif}.lq-regeln small{color:#5D5C80}
.lq .ep-liverun{background:radial-gradient(circle at 2px 2px,rgba(255,255,255,.12) 1.5px,transparent 0) 0 0/18px 18px,linear-gradient(125deg,#1B2240,#3D2A9E 45%,#B4237E)!important;border-radius:32px}
.lq .ep-turm{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2)}
.lq .ep-turm.eplumi{box-shadow:0 0 30px -6px #E043B8}.lq .ep-turm.epmilo{box-shadow:0 0 30px -6px #3D5AFE}
.lq .ep-turm img{filter:drop-shadow(0 0 14px rgba(255,255,255,.55)) drop-shadow(0 10px 12px rgba(0,0,0,.35))}
.lq-fnr{display:block;font:800 .78rem Lexend,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#8A3FE0;margin:8px 0 2px}
@media (max-width:860px){
  .lq-held{padding:20px 18px 22px;border-radius:28px}
  .lq-kids{display:none}
  .lq-teams{grid-template-columns:1fr 1fr}.lq-vs{display:none}
  .lq-team{flex-direction:column;align-items:flex-start;padding:96px 14px 14px;min-height:0}
  .lq-team img{height:110px;left:auto;right:6px;top:-18px;bottom:auto}
  .lq-team b{font-size:1.15rem}
  .lq-team small{font-size:.8rem}
  .lq-plan>div{grid-template-columns:1fr 1fr}
  .lq-regeln{grid-template-columns:1fr}
  .lq-cd span{min-width:60px}.lq-cd b{font-size:1.8rem}
  .lq-ic{width:64px;height:64px;font-size:2.3rem}
}
`;
document.head.appendChild(css);
})();

/* ================= Tagesquiz-Chat ================= */
(function(){
const css = document.createElement("style"); css.id = "ep-chat2-css";
css.textContent = `
.ep-chat2{max-width:1100px;margin:0 auto;display:flex;flex-direction:column;gap:16px;color:#1B2240}
.c2-kopf{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.c2-home{display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(255,255,255,.25);background:rgba(15,20,48,.72);color:#fff;font:700 1.05rem Lexend,system-ui,sans-serif;padding:12px 20px;border-radius:999px;cursor:pointer;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);box-shadow:0 8px 18px -10px rgba(0,0,0,.5)}
.c2-home:hover{background:rgba(15,20,48,.88)}
.c2-wer{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.92);border-radius:999px;padding:6px 18px 6px 6px;box-shadow:0 10px 24px -14px rgba(27,34,64,.5)}
.c2-avs{display:flex}.c2-avs img{width:40px;height:40px;border-radius:50%;object-fit:cover;object-position:top;border:3px solid #fff;background:#FFD6EC}
.c2-avs img+img{margin-left:-12px;background:#D6E0FF}
.c2-wer b{display:block;font:800 1.05rem "Bricolage Grotesque",sans-serif}.c2-wer small{color:#5D5C80;font-size:.8rem}
.c2-mitte{display:grid;grid-template-columns:1fr 250px;gap:16px;align-items:end}
.c2-box{display:flex;flex-direction:column;gap:12px;background:rgba(255,255,255,.9);border-radius:30px;padding:20px;box-shadow:0 24px 50px -30px rgba(27,34,64,.6),inset 0 0 0 1px #fff;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
.c2-msg{display:flex;align-items:flex-end;gap:10px;max-width:88%}
.c2-msg.r{flex-direction:row-reverse;align-self:flex-end}
.c2-av{flex:0 0 auto;width:40px;height:40px;border-radius:50%;overflow:hidden;background:#FFD6EC;border:2px solid #fff;box-shadow:0 4px 10px -4px rgba(0,0,0,.3)}
.c2-msg.r .c2-av{background:#D6E0FF}
.c2-av img{width:100%;height:100%;object-fit:cover;object-position:top}
.c2-bl{position:relative;background:#F1EEFF;border-radius:20px 20px 20px 6px;padding:10px 14px;font:500 1.02rem/1.4 Lexend,system-ui,sans-serif}
.c2-msg.r .c2-bl{background:linear-gradient(135deg,#3D5AFE,#8A3FE0);color:#fff;border-radius:20px 20px 6px 20px}
.c2-tipp{display:none}
.c2-wart{visibility:hidden}
.c2-tippt .c2-tx{visibility:hidden}
.c2-tippt .c2-tipp{display:grid;place-items:center;position:absolute;inset:0;font-size:1.3rem;letter-spacing:.15em;animation:lqPunkt 1s infinite}
.c2-msg:not(.c2-wart):not(.c2-tippt){animation:c2Auf .3s ease both}
@keyframes c2Auf{from{transform:translateY(6px);opacity:0}}
.c2-kids{width:100%;filter:drop-shadow(0 14px 18px rgba(0,0,0,.35));align-self:end;margin-bottom:-6px}
.c2-opts{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.c2-o{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:10px;border:0;border-radius:26px;padding:16px;min-height:132px;color:#fff;text-align:left;cursor:pointer;font-family:inherit;transition:transform .15s;
  background:radial-gradient(circle at 2px 2px,rgba(255,255,255,.18) 1.5px,transparent 0) 0 0/18px 18px,linear-gradient(150deg,var(--a),var(--b))}
.c2-o{box-shadow:0 7px 0 var(--s),0 20px 30px -20px var(--b)}
.c2-o:hover{transform:translateY(-3px)}.c2-o:active{transform:translateY(4px);box-shadow:0 3px 0 var(--s)}
.c2-o:disabled{opacity:.55;cursor:default;transform:none}
.c2-o b{display:block;font:800 1.25rem/1.1 "Bricolage Grotesque",sans-serif}
.c2-o small{display:block;margin-top:3px;font-size:.88rem;color:rgba(255,255,255,.9)}
.c2-ic{display:grid;place-items:center;width:52px;height:52px;border-radius:16px;background:#fff;font-size:1.7rem;box-shadow:0 8px 16px -8px rgba(0,0,0,.45);flex:0 0 auto}
.c2-haupt{grid-column:1/-1;flex-direction:row;align-items:center;gap:16px;min-height:96px;padding:18px 22px;--a:#FF6FB5;--b:#E043B8;--s:#9B1C7C}
.c2-haupt b{font-size:1.7rem}.c2-haupt .c2-ic{width:64px;height:64px;font-size:2.1rem}
.c2-pf{margin-left:auto;display:grid;place-items:center;width:56px;height:56px;border-radius:50%;background:#FFE34D;color:#1B2240;font-size:1.3rem;box-shadow:0 5px 0 #C9A200}
.c2-blau{--a:#6F86FF;--b:#3D5AFE;--s:#22309A}.c2-rot{--a:#FF6B6B;--b:#E8364F;--s:#9E1E30}.c2-gruen{--a:#2FD1A7;--b:#12A57F;--s:#075A46}.c2-orange{--a:#FFB347;--b:#FF7A1A;--s:#B54F05}
@media (max-width:860px){
  .c2-mitte{grid-template-columns:1fr 150px}
  .c2-opts{grid-template-columns:1fr 1fr}
}
@media (max-width:699px){
  .ep-chat2{gap:10px}
  .c2-home{padding:9px 14px;font-size:.95rem}
  .c2-wer{padding:4px 12px 4px 4px}.c2-avs img{width:32px;height:32px}.c2-wer b{font-size:.92rem}.c2-wer small{font-size:.72rem}
  .c2-mitte{grid-template-columns:1fr}
  .c2-kids{display:none}
  .c2-box{padding:12px;gap:8px;border-radius:22px}
  .c2-msg{max-width:94%;gap:6px}.c2-av{width:30px;height:30px}
  .c2-bl{font-size:.86rem;line-height:1.3;padding:8px 11px;border-radius:16px 16px 16px 5px}
  .c2-msg.r .c2-bl{border-radius:16px 16px 5px 16px}
  .c2-opts{gap:10px}
  .c2-o{min-height:0;padding:12px;gap:8px;border-radius:20px}
  .c2-o b{font-size:1.02rem}.c2-o small{font-size:.74rem}
  .c2-ic{width:40px;height:40px;font-size:1.3rem;border-radius:12px}
  .c2-haupt{min-height:0;padding:12px 14px;gap:12px}.c2-haupt b{font-size:1.2rem}.c2-haupt .c2-ic{width:48px;height:48px;font-size:1.6rem}
  .c2-pf{width:42px;height:42px;font-size:1rem}
}
@media (max-width:699px) and (max-height:720px){.c2-o small{display:none}.c2-bl{font-size:.8rem;padding:6px 10px}.c2-box{padding:10px;gap:6px}.ep-chat2{gap:8px}.c2-o{padding:9px 12px;flex-direction:row;align-items:center}.c2-ic{width:34px;height:34px;font-size:1.1rem}.c2-haupt .c2-ic{width:40px;height:40px}.c2-pf{width:36px;height:36px}.c2-haupt{padding:9px 12px}}
`;
document.head.appendChild(css);
})();

/* ================= Startseite: Test-Karte, Tacho, Qeels, Namen, Duell ================= */
(function(){
const css = document.createElement("style"); css.id = "ep-start2-css";
css.textContent = `
/* Gewerteter Test */
.ep-w.ep-testk{background:radial-gradient(circle at 2px 2px,rgba(255,255,255,.12) 1.5px,transparent 0) 0 0/18px 18px,linear-gradient(140deg,#5B21B6,#8A3FE0 55%,#E043B8)!important;color:#fff;gap:6px;justify-content:flex-start!important}
.ep-testk>small{color:rgba(255,255,255,.85);font-weight:800;letter-spacing:.06em;text-transform:uppercase;font-size:.72rem}
.eptk-thema{display:flex;align-items:center;gap:10px;max-width:66%}
.eptk-ic{display:grid;place-items:center;width:48px;height:48px;flex:0 0 auto;border-radius:15px;background:#fff;font-size:1.7rem;line-height:0;transform:rotate(-5deg);box-shadow:0 8px 16px -8px rgba(0,0,0,.45)}
.ep-testk .epgross{max-width:none!important}
.ep-testk .epzufalltext{max-width:62%;font-size:.85rem;color:rgba(255,255,255,.9);line-height:1.35}
.eptk-knoepfe{display:flex;gap:8px;flex-wrap:wrap;margin-top:auto;position:relative;z-index:2}
.ep-testk .ep-btn.weiss{background:rgba(255,255,255,.18)!important;color:#fff!important;border:1px solid rgba(255,255,255,.35)!important;box-shadow:none!important}
.ep-testk img{z-index:1}
/* Tacho */
.ep-w.ep-tacho{align-items:stretch;justify-content:flex-start!important;gap:4px;padding:14px 14px 14px!important;border:0!important;color:#fff!important;
  background:radial-gradient(120% 90% at 50% 100%,color-mix(in srgb,var(--tc) 35%,transparent),transparent 65%),radial-gradient(circle at 2px 2px,rgba(255,255,255,.08) 1.5px,transparent 0) 0 0/16px 16px,linear-gradient(160deg,#232A63,#11152F)!important;
  box-shadow:0 8px 0 #0A0D22,0 24px 40px -22px color-mix(in srgb,var(--tc) 70%,#000)!important;transition:box-shadow .5s,background .5s}
.ep-tacho>small{color:rgba(255,255,255,.75)!important;letter-spacing:.08em;text-transform:uppercase;font-size:.7rem!important;font-weight:800}
.eptc-feld{position:relative;width:100%;max-width:280px;margin:2px auto 0;aspect-ratio:240/140}
.eptc-svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;touch-action:none;cursor:grab}
.eptc-svg:active{cursor:grabbing}
.eptc-bogen,.eptc-glow{transition:stroke-dashoffset .6s cubic-bezier(.25,1,.35,1)}
.eptc-nadel{transform-box:view-box;transform-origin:120px 122px;transition:transform .7s cubic-bezier(.3,1.45,.45,1);filter:drop-shadow(0 0 6px var(--tc))}
.eptc-hub{transition:fill .4s}
.eptc-k{position:absolute;transform:translate(-50%,-50%);width:34px;height:34px;border-radius:50%;border:0;padding:0;cursor:pointer;display:grid;place-items:center;
  background:#0F1330;box-shadow:0 0 0 2px rgba(255,255,255,.18),0 6px 12px -4px rgba(0,0,0,.6);transition:transform .35s cubic-bezier(.3,1.6,.5,1),box-shadow .35s,background .35s;z-index:2}
.eptc-k span{font-size:1.05rem;line-height:1;filter:grayscale(.5) opacity(.75);transition:filter .3s}
.eptc-k:hover{transform:translate(-50%,-50%) scale(1.12)}
.eptc-k.an{transform:translate(-50%,-50%) scale(1.3);background:var(--kc);box-shadow:0 0 0 3px #fff,0 0 22px 4px var(--kc)}
.eptc-k.an span{filter:none}
.eptc-k:focus-visible{outline:3px solid #fff;outline-offset:3px}
.eptc-name{display:flex;flex-direction:column;align-items:center;text-align:center;margin-top:2px}
.eptc-name b{font:800 1.35rem/1.1 "Bricolage Grotesque",sans-serif;color:#fff;text-shadow:0 0 18px var(--tc)}
.eptc-name small{font-size:.76rem;color:rgba(255,255,255,.78);text-transform:none!important;letter-spacing:0!important;white-space:nowrap}
.eptc-name.neu{animation:tcNeu .45s cubic-bezier(.3,1.5,.5,1)}
@keyframes tcNeu{from{transform:translateY(6px) scale(.94);opacity:.2}}
@media (prefers-reduced-motion:reduce){.eptc-nadel,.eptc-bogen,.eptc-glow,.eptc-k{transition:none}.eptc-name.neu{animation:none}}
/* Qeels wie Instagram */
.ep-w.ep-qk{border:0!important;color:#fff!important;justify-content:space-between!important;gap:8px;
  background:radial-gradient(120% 120% at 0% 100%,#FEDA75 0%,#FA7E1E 25%,#D62976 50%,#962FBF 75%,#4F5BD5 100%)!important;box-shadow:0 18px 30px -18px #962FBF!important}
.epqk-kopf{display:flex;align-items:center;gap:8px}
.epqk-bild{display:block;height:54px;width:auto;max-width:100%;filter:drop-shadow(0 3px 6px rgba(40,10,60,.35));margin:-4px 0 -2px -4px}
.navbtn.reelsnav{background:rgba(255,255,255,.94)!important;border-color:rgba(255,255,255,.95)!important;padding-top:2px!important;padding-bottom:2px!important}
.navbtn.reelsnav .rnlogo{display:block;height:44px;width:auto;filter:drop-shadow(0 2px 4px rgba(40,10,60,.25))}
@media (max-width:899px){.navbtn.reelsnav .rnlogo{height:34px}}
.epqk-kopf b{font:800 1.35rem "Bricolage Grotesque",sans-serif}
.epqk-logo{display:grid;place-items:center;width:38px;height:38px;border-radius:12px;background:rgba(255,255,255,.18);border:1.5px solid rgba(255,255,255,.6)}
.epqk-st{display:flex;gap:6px}
.epqk-st>span{display:grid;place-items:center;width:44px;height:44px;border-radius:50%;padding:2.5px;background:conic-gradient(#FEDA75,#FA7E1E,#D62976,#962FBF,#4F5BD5,#FEDA75)}
.epqk-st i{display:grid;place-items:center;width:100%;height:100%;border-radius:50%;background:#fff;border:2px solid #fff;font-style:normal;font-size:1.25rem;line-height:0}
.epqk-tx{font-weight:700;font-size:.88rem}
/* Namensschilder Lumi und Milo */
.epduo{position:relative;align-self:end}
.ep-banner>.epduo>img{height:clamp(240px,30vw,400px);margin-top:-40px;display:block;filter:drop-shadow(0 16px 16px rgba(27,34,64,.28))}
.epname{position:absolute;z-index:3;display:inline-flex;align-items:center;gap:4px;padding:5px 14px;border-radius:999px;color:#fff;font:800 1.05rem "Bricolage Grotesque",sans-serif;letter-spacing:.01em;box-shadow:0 5px 0 rgba(0,0,0,.18),0 10px 20px -8px rgba(0,0,0,.4);pointer-events:none;white-space:nowrap}
.epname::before{font-size:.85em}
.epname.eplumi{background:linear-gradient(135deg,#FF7AD9,#E043B8);left:2%;top:40%;transform:rotate(-7deg)}
.epname.eplumi::before{content:"🩷"}
.epname.epmilo{background:linear-gradient(135deg,#6F86FF,#3D5AFE);right:0;top:34%;transform:rotate(6deg)}
.epname.epmilo::before{content:"💙"}
@media (max-width:860px){.ep-banner>.epduo{order:-1;margin:0 auto}.ep-banner>.epduo>img{height:220px;margin:0 auto}.epname{font-size:.9rem;padding:4px 10px}}
/* Bereit für dein Duell */
.ep-bereit{background:radial-gradient(circle at 2px 2px,rgba(255,255,255,.12) 1.5px,transparent 0) 0 0/18px 18px,radial-gradient(70% 90% at 50% 100%,#8A3FE0aa,transparent 70%),linear-gradient(160deg,#1B2240,#3D2A9E 50%,#B4237E)!important;color:#fff!important;box-shadow:0 8px 0 #120f3a,0 30px 60px -30px rgba(27,34,64,.7)!important;overflow:hidden}
.ep-bereit h2{color:#fff!important;text-shadow:0 4px 20px rgba(224,67,184,.6)}
.ep-bereit p{color:rgba(255,255,255,.88)!important}
.ep-bereit .ep-btn.weiss{background:rgba(255,255,255,.16)!important;color:#fff!important;border:1px solid rgba(255,255,255,.4)!important}
.ep-bereit .epgegner{background:rgba(255,255,255,.95)!important}
.epbereit-duo{width:max-content;margin:14px auto 0;position:relative}
.epbereit-duo img{position:relative;z-index:1;display:block;height:clamp(240px,30vw,380px);filter:drop-shadow(0 0 18px rgba(255,255,255,.55)) drop-shadow(0 0 40px rgba(255,190,240,.45))}
.epglow{position:absolute;bottom:4%;width:62%;height:82%;border-radius:50%;filter:blur(26px);z-index:0;animation:epGlow 2.4s ease-in-out infinite}
.epglow.eplumi{left:-6%;background:radial-gradient(circle,#FF5FD2 0%,rgba(255,95,210,.4) 45%,transparent 72%)}
.epglow.epmilo{right:-6%;background:radial-gradient(circle,#4F7BFF 0%,rgba(79,123,255,.45) 45%,transparent 72%);animation-delay:1.2s}
@keyframes epGlow{0%,100%{opacity:.75;transform:scale(1)}50%{opacity:1;transform:scale(1.12)}}
.epbereit-duo .epname.eplumi{left:-10%;top:30%}.epbereit-duo .epname.epmilo{right:-10%;top:24%}
@media (prefers-reduced-motion:reduce){.epglow,.lq-held::after,.lq-ansage,.lq-vs{animation:none!important}}
`;
document.head.appendChild(css);
})();

/* ================= Thema der Woche ================= */
(function(){
const css = document.createElement("style"); css.id = "ep-woche2-css";
css.textContent = `
body:not(.ep-app) #app[data-seite="epwoche"] .ap-kz{display:none}
body.ep-app .wk2-zurueck{display:none}
.wk2{max-width:1100px!important;gap:18px!important;color:#1B2240}
.wk2-zurueck{align-self:flex-start;border:1px solid rgba(255,255,255,.25);background:rgba(15,20,48,.72);color:#fff;font:700 1.05rem Lexend,system-ui,sans-serif;padding:12px 20px;border-radius:999px;cursor:pointer;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.wk2-held{position:relative;border-radius:36px;padding:28px 320px 28px 34px;color:#fff;isolation:isolate;
  background:radial-gradient(circle at 2px 2px,rgba(255,255,255,.14) 1.5px,transparent 0) 0 0/18px 18px,linear-gradient(120deg,#1B2240 0%,#3D5AFE 50%,#C04BD8 100%);box-shadow:0 8px 0 #1A2378,0 30px 60px -30px rgba(27,34,64,.7)}
.wk2-tag{display:inline-block;background:linear-gradient(135deg,#FF4F79,#FF8A3D);border-radius:999px;padding:5px 14px;font:800 .75rem Lexend,sans-serif;letter-spacing:.08em;text-transform:uppercase}
.wk2-titel{display:flex;align-items:center;gap:16px;margin:14px 0}
.wk2-ic{display:grid;place-items:center;width:80px;height:80px;flex:0 0 auto;border-radius:24px;background:#fff;font-size:2.8rem;line-height:0;transform:rotate(-5deg);box-shadow:0 10px 22px -10px rgba(0,0,0,.5)}
.wk2-titel small{font:700 .85rem Lexend,sans-serif;color:rgba(255,255,255,.85)}
.wk2-titel h1{margin:2px 0 0;font:800 clamp(2rem,4.4vw,3.3rem)/1 "Bricolage Grotesque",sans-serif;color:#fff}
.wk2-cd{display:flex;gap:10px;margin-bottom:14px}
.wk2-cd span{display:flex;flex-direction:column;align-items:center;min-width:64px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.28);border-radius:16px;padding:8px 6px}
.wk2-cd b{font:800 1.6rem/1 "Bricolage Grotesque",sans-serif}.wk2-cd small{font-size:.72rem;color:rgba(255,255,255,.85)}
.wk2-ziel{max-width:520px}.wk2-ziel small{display:block;margin-top:6px;color:rgba(255,255,255,.9)}
.wk2-bar{display:block;height:12px;border-radius:999px;background:rgba(255,255,255,.22);overflow:hidden}.wk2-bar i{display:block;height:100%;background:linear-gradient(90deg,#FFE34D,#FFB13D);border-radius:inherit}
.wk2-kids{position:absolute;right:26px;bottom:8px;height:calc(100% + 30px);max-height:310px;filter:drop-shadow(0 14px 18px rgba(0,0,0,.4))}
.wk2-box{background:rgba(255,255,255,.95);border-radius:32px;padding:24px 28px;box-shadow:0 26px 50px -30px rgba(27,34,64,.6),inset 0 0 0 1px #fff;position:relative;overflow:hidden}
.wk2-box::before{content:"";position:absolute;left:0;top:0;right:0;height:6px;background:linear-gradient(90deg,#3D5AFE,#8A3FE0,#E043B8,#FF8A3D)}
.wk2-bkopf{display:flex;gap:14px;align-items:flex-start}
.wk2-buch{display:grid;place-items:center;width:58px;height:58px;flex:0 0 auto;border-radius:18px;background:linear-gradient(135deg,#FFE15A,#FFC23A);font-size:1.9rem;box-shadow:0 5px 0 #C79A12}
.wk2-bkopf small{font:800 .75rem Lexend,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#8A3FE0}
.wk2-bkopf h2{margin:2px 0;font:800 1.7rem "Bricolage Grotesque",sans-serif}
.wk2-bkopf p{margin:0;color:#5D5C80}
.wk2-box ul{list-style:none;margin:16px 0 14px;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:10px}
.wk2-box li{position:relative;background:#F4F2FF;border-radius:16px;padding:12px 14px 12px 44px;font:500 1rem/1.4 Lexend,sans-serif}
.wk2-box li::before{content:"💡";position:absolute;left:12px;top:11px}
.wk2-mehr{border:0;background:linear-gradient(135deg,#3D5AFE,#8A3FE0);color:#fff;font:700 1rem Lexend,sans-serif;padding:12px 20px;border-radius:999px;cursor:pointer;box-shadow:0 5px 0 #2A2E9E}
.wk2-wahl{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.wk2-k{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:8px;text-align:left;border:0;border-radius:30px;padding:22px;color:#fff;cursor:pointer;font-family:inherit;transition:transform .15s}
.wk2-k:hover{transform:translateY(-3px)}.wk2-k:disabled{opacity:.55;cursor:default;transform:none}
.wk2-train{background:radial-gradient(circle at 2px 2px,rgba(255,255,255,.18) 1.5px,transparent 0) 0 0/18px 18px,linear-gradient(150deg,#5B7CFF,#3D5AFE 55%,#2B3FC8);box-shadow:0 8px 0 #22309A,0 26px 40px -24px rgba(27,34,64,.7)}
.wk2-test{background:radial-gradient(circle at 2px 2px,rgba(255,255,255,.18) 1.5px,transparent 0) 0 0/18px 18px,linear-gradient(150deg,#A65BFF,#8A3FE0 50%,#E043B8);box-shadow:0 8px 0 #5E2398,0 26px 40px -24px rgba(27,34,64,.7)}
.wk2-kic{display:grid;place-items:center;width:64px;height:64px;border-radius:20px;background:#fff;font-size:2.2rem;transform:rotate(-4deg);box-shadow:0 10px 20px -10px rgba(0,0,0,.45)}
.wk2-k b{font:800 1.8rem "Bricolage Grotesque",sans-serif}
.wk2-k small{font-size:.95rem;line-height:1.45;color:rgba(255,255,255,.92)}
.wk2-abz{background:rgba(15,20,48,.28);border-radius:999px;padding:5px 12px;font-weight:700;font-size:.85rem}
.wk2-los{margin-top:auto;background:linear-gradient(135deg,#FFE15A,#FFC23A);color:#1B2240;border-radius:999px;padding:10px 18px;font-weight:800;box-shadow:0 5px 0 #C79A12}
@media (max-width:860px){
  .wk2-held{padding:20px 18px 22px;border-radius:28px}.wk2-kids{display:none}
  .wk2-box{padding:18px}.wk2-box ul{grid-template-columns:1fr}
  .wk2-wahl{grid-template-columns:1fr 1fr;gap:12px}.wk2-k{padding:16px;border-radius:24px}.wk2-k b{font-size:1.3rem}.wk2-k small{font-size:.8rem}
  .wk2-ic{width:60px;height:60px;font-size:2.1rem}.wk2-kic{width:48px;height:48px;font-size:1.6rem}
}
@media (max-width:520px){.wk2-wahl{grid-template-columns:1fr}.wk2-k small{display:none}.wk2-k{flex-direction:row;flex-wrap:wrap;align-items:center}.wk2-los{margin-top:0;margin-left:auto}.wk2-abz{order:5}}
`;
document.head.appendChild(css);
})();

/* ================= Qeels: Teilen über das System-Menü, lange Texte kleiner ================= */
(function(){
"use strict";
if(typeof window.rlTeilen === "function" && typeof window.qeelLink === "function"){
  const vor = window.rlTeilen;
  window.rlTeilen = function(it){
    const coarse = matchMedia("(pointer: coarse)").matches;
    if(navigator.share && coarse){
      let link = "", text = ""; try{ link = qeelLink(it); text = it.share || "easyplay Qeel"; }catch(e){}
      if(link){ navigator.share({title:"easyplay", text, url:link}).catch(e => { if(e && e.name !== "AbortError") vor.call(this, it); }); return; }
    }
    return vor.apply(this, arguments);
  };
}
const css = document.createElement("style"); css.id = "ep-qeels3-css";
css.textContent = `
#reels .rfrage{overflow-wrap:anywhere}
#reels .rfrage.lang{font-size:clamp(1.05rem,3.6vh,1.5rem)!important;line-height:1.2}
#reels .rfrage.sehrlang{font-size:clamp(.95rem,3vh,1.25rem)!important;line-height:1.2}
#reels .ropt.lang{font-size:.86rem!important;min-height:42px!important;padding:6px 10px!important}
#reels .ropt.sehrlang{font-size:.78rem!important;min-height:38px!important;padding:5px 9px!important;line-height:1.2}
#reels .rinhalt{padding-right:84px!important;box-sizing:border-box}
#reels .rinhalt>*{max-width:100%}
@media (max-width:420px){#reels .rinhalt{padding-right:78px!important}}
`;
document.head.appendChild(css);
function messen(){ const o = document.getElementById("reels"); if(!o) return;
  o.querySelectorAll(".rfrage").forEach(f => { const n = (f.textContent || "").length; f.classList.toggle("sehrlang", n > 140); f.classList.toggle("lang", n > 80 && n <= 140); });
  o.querySelectorAll(".ropts").forEach(g => { const max = Math.max(0, ...[...g.querySelectorAll(".ropt")].map(x => (x.textContent || "").length)); g.querySelectorAll(".ropt").forEach(x => { x.classList.toggle("sehrlang", max > 60); x.classList.toggle("lang", max > 34 && max <= 60); }); });
  // Wenn ein Qeel trotzdem höher ist als der Bildschirm, Schrift nochmals verkleinern
  o.querySelectorAll(".rinhalt").forEach(c => { const sek = c.closest("section") || c.parentElement; if(!sek) return; let k = 0;
    while(k < 3 && c.scrollHeight > c.clientHeight + 4){ k++; c.style.fontSize = (100 - k * 8) + "%"; const f = c.querySelector(".rfrage"); if(f) f.style.fontSize = (1.3 - k * .15) + "rem"; } });
}
const vor = window.oeffneReels;
if(typeof vor === "function"){
  let beob = null;
  window.oeffneReels = function(){ const r = vor.apply(this, arguments);
    try{ const o = document.getElementById("reels"); messen(); if(o && !beob){ beob = new MutationObserver(() => { beob.disconnect(); try{ messen(); }finally{ beob.observe(o, {childList:true, subtree:true}); } }); beob.observe(o, {childList:true, subtree:true}); } }catch(e){}
    return r; };
}
})();

/* ================= Kacheln der Startseite mit gezeichneten Grafiken (Computer) ================= */
(function(){
const K = "img/kacheln/";
const T = [
  [".eptl", "tag"], ["[data-a=zufall]", "serie"], [":has(.epring)", "level"], ["[data-a=live]", "live"],
  [":has(.epabz)", "abzeichen"], [":has(.epfakt)", "wissen"], ["[data-a=fehler]", "fehler"], [".xt-ein", "truhe"]];
// Symbol: Höhe in % der Kachel und Lage; der Grund wird ganz eingepasst, das Symbol nie verzerrt oder abgeschnitten
const SYM = {tag:["right bottom","60%"], serie:["right bottom","86%"], level:["right bottom","82%"], live:["right bottom","74%"],
  abzeichen:["right bottom","63%"], wissen:["right bottom","82%"], fehler:["right bottom","80%"], truhe:["right top 6%","54%"]};
const W = "html:root body .ep-wg>.ep-w";
const css = document.createElement("style"); css.id = "ep-kacheln-css";
css.textContent = T.map(([s, n]) => `${W}${s}{background:url(${K}${n}-symbol.webp) ${SYM[n][0]}/auto ${SYM[n][1]} no-repeat,url(${K}${n}-grund.webp) 0 0/100% 100% no-repeat,transparent!important;animation:none!important}`).join("\n") + `
${W}:is(${T.map(t => t[0]).join(",")}){border:0!important;border-radius:28px!important;color:#fff!important;box-shadow:0 14px 30px -14px rgba(20,20,70,.55)!important;overflow:hidden}
${W}:is(${T.map(t => t[0]).join(",")})::after{display:none!important}
@media (max-width:860px){${W}.xt-ein{background-position:right center,0 0!important;background-size:auto 88%,100% 100%!important}}
${W}:is(${T.map(t => t[0]).join(",")}) :is(small,b,p,span,div,time,h4){text-shadow:0 2px 8px rgba(20,10,60,.45)}
${W}:is(${T.map(t => t[0]).join(",")}) :is(.ep-btn,button,.epmini){text-shadow:none}
${W}.xt-ein .xt-ein-truhe{display:none!important}
${W}.xt-ein.xt-o{filter:saturate(.75) brightness(.92)}
${W}[data-a=fehler][disabled]{filter:saturate(.8)}
${W}.eptl .epe i{background:rgba(255,255,255,.95)!important;border-color:#fff!important}
${W}.eptl .epe.st-ok i{background:#2BD67B!important;border-color:#fff!important}
${W}.eptl .epe::before{background:rgba(255,255,255,.45)!important}
#nav #navKonto.st-anm{width:184px;height:54px;padding:0!important;border:0!important;border-radius:999px!important;color:transparent!important;font-size:0!important;
  background:url(${K}anmelden.webp) center/contain no-repeat!important;box-shadow:0 10px 22px -10px rgba(91,63,224,.7)!important;transition:transform .15s}
#nav #navKonto.st-anm *{display:none!important}
#nav .menubtn.st-menue{width:174px;height:55px;padding:0!important;border:0!important;border-radius:999px!important;color:transparent!important;font-size:0!important;
  background:url(${K}menue.webp) center/contain no-repeat!important;box-shadow:0 10px 22px -10px rgba(91,63,224,.6)!important;transition:transform .15s}
#nav .menubtn.st-menue *{display:none!important}
#nav .xs-knopf.st-ton{width:58px;height:58px;padding:0!important;border:0!important;border-radius:50%!important;color:transparent!important;font-size:0!important;
  background:url(${K}ton.webp) center/contain no-repeat!important;box-shadow:0 10px 22px -10px rgba(91,63,224,.6)!important;transition:transform .15s,filter .2s}
#nav .xs-knopf.st-ton>*{opacity:0!important}
#nav .xs-knopf.st-ton.st-stumm{filter:grayscale(.85) opacity(.7)}
#nav #navReels.st-qeels{width:170px;height:57px;padding:0!important;border:0!important;border-radius:999px!important;color:transparent!important;font-size:0!important;
  background:url(${K}qeels.webp) center/contain no-repeat!important;box-shadow:0 10px 22px -10px rgba(91,63,224,.55)!important;transition:transform .15s}
#nav #navReels.st-qeels>*{opacity:0!important}
#nav .xui-knopf.st-de{width:58px;height:62px;padding:0!important;border:0!important;border-radius:50%!important;color:transparent!important;font-size:0!important;
  background:url(${K}sprache-de.webp) center/contain no-repeat!important;box-shadow:none!important;transition:transform .15s}
#nav .xui-knopf.st-de>*{opacity:0!important}
#nav :is(#navReels.st-qeels,.xui-knopf.st-de):hover{transform:translateY(-2px) scale(1.04)}
#nav :is(#navReels.st-qeels,.xui-knopf.st-de):focus-visible{outline:3px solid #FFE34D;outline-offset:3px}
#nav :is(.menubtn.st-menue,.xs-knopf.st-ton):hover{transform:translateY(-2px) scale(1.04)}
#nav :is(.menubtn.st-menue,.xs-knopf.st-ton):focus-visible{outline:3px solid #FFE34D;outline-offset:3px}
#nav #navKonto.st-anm:hover{transform:translateY(-2px) scale(1.03)}
#nav #navKonto.st-anm:focus-visible{outline:3px solid #FFE34D;outline-offset:3px}
`;
document.head.appendChild(css);
function anm(){ const b = document.getElementById("navKonto"); if(!b) return;
  const t = (b.querySelector(".tlab") || b).textContent.trim(); const an = t === "Anmelden";
  if(b.classList.contains("st-anm") !== an){ b.classList.toggle("st-anm", an); if(an) b.setAttribute("aria-label", "Anmelden"); } }
function knoepfe(){
  const m = document.getElementById("navMenu"); if(m){ const t = (m.querySelector(".tlab") || m).textContent.trim(); m.classList.toggle("st-menue", t === "Menü"); if(t === "Menü" && !m.getAttribute("aria-label")) m.setAttribute("aria-label", "Menü"); }
  const q = document.getElementById("navReels"); if(q) q.classList.add("st-qeels");
  const sp = document.querySelector("#nav .xui-knopf"); if(sp) sp.classList.toggle("st-de", /Deutsch\s*$|: Deutsch/.test(sp.getAttribute("aria-label") || ""));
  const t = document.querySelector("#nav .xs-knopf"); if(t){ t.classList.add("st-ton"); const l = (t.getAttribute("aria-label") || "").toLowerCase(); t.classList.toggle("st-stumm", /töne aus/.test(l) && !/musik an/.test(l)); }
}
const nav = document.getElementById("nav") || document.body;
new MutationObserver(() => { anm(); knoepfe(); }).observe(nav, {childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:["aria-label"]});
anm(); knoepfe();
})();

/* ================= Bereich-Kacheln mit gezeichneten Grafiken (nur Startseite Computer, Handy und iPad vorerst ohne) ================= */
(function(){
// Neun-Teile-Skalierung (border-image): Ecken mit Rahmen und das Symbol rechts unten bleiben unverzerrt und ganz,
// nur die ruhigen Flächen dazwischen werden gedehnt. So passt die Grafik in jede Kachelgrösse, ohne abzuschneiden.
// Masse in Pixeln der Datei (900 x 515): oben, rechts, unten, links. Rechts/unten umschliessen das ganze Symbol.
const K = "img/kacheln/bereich-";
const S = {welt:[52,380,342,54], natur:[52,200,384,54], geld:[52,398,404,54], alltag:[52,254,388,54]};
const pc = n => `html:root body:not(.ep-app) .bereiche>.bereich[data-b=${n}]`;
const N = Object.keys(S), alle = N.map(pc).join(",");
const css = document.createElement("style"); css.id = "ep-bereich-kacheln-css";
css.textContent = N.map(n => `${pc(n)}{border-image:url(${K}${n}.webp) ${S[n].join(" ")} fill/var(--kb,${S[n].map(x => Math.round(x * .5) + "px").join(" ")}) stretch!important}`).join("\n") + `
:is(${alle}){background:transparent!important;animation:none!important;border-style:solid!important;border-width:0!important;border-color:transparent!important;border-radius:0!important;color:#fff!important;box-shadow:none!important;overflow:visible;filter:drop-shadow(0 14px 22px rgba(20,20,70,.35))}
:is(${alle})::before,:is(${alle})::after{display:none!important}
:is(${alle}) :is(h2,p,b,small,.apn){text-shadow:0 2px 8px rgba(20,10,60,.5)}
`;
document.head.appendChild(css);
// Massstab je Kachel: Symbol höchstens halb so breit wie die Kachel, Ecken passen immer hinein
function einpassen(el){
  const b = el.querySelector("[data-b]") || el, n = el.dataset.b || (b && b.dataset.b); const s = S[n]; if(!s) return;
  const W = el.clientWidth, H = el.clientHeight; if(!W || !H) return;
  const k = Math.min(H / (s[0] + s[2]), W / (s[1] + s[3]), .42 * W / s[1], 1);
  el.style.setProperty("--kb", s.map(x => (x * k).toFixed(1) + "px").join(" "));
}
const ro = typeof ResizeObserver === "function" ? new ResizeObserver(e => e.forEach(x => einpassen(x.target))) : null;
function suchen(){ document.querySelectorAll(".bereiche>.bereich[data-b]").forEach(el => { if(el.dataset.kb9) return; const n = el.dataset.b; if(!S[n]) return; el.dataset.kb9 = "1"; einpassen(el); if(ro) ro.observe(el); }); }
const app = document.getElementById("app");
if(app) new MutationObserver(suchen).observe(app, {childList:true, subtree:true});
suchen();
})();
