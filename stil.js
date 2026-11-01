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
/* Bibliothek */
.ep-w.ep-bibk{background:radial-gradient(120% 80% at 85% 110%,rgba(255,214,102,.45),transparent 60%),radial-gradient(circle at 2px 2px,rgba(255,255,255,.12) 1.5px,transparent 0) 0 0/18px 18px,linear-gradient(140deg,#7A3E12,#C26A1A 50%,#F2A23A)!important;color:#fff;gap:6px;justify-content:flex-start!important;overflow:hidden;isolation:isolate}
.ep-bibk>small{color:rgba(255,255,255,.88);font-weight:800;letter-spacing:.06em;text-transform:uppercase;font-size:.72rem}
.ep-bibk .epgross{max-width:none!important}
.ep-bibk .epzufalltext{max-width:62%;font-size:.85rem;color:rgba(255,255,255,.92);line-height:1.35}
.ep-bibk .eptk-ic{animation:epBibBlatt 3.6s ease-in-out infinite}
.ep-bibk .ep-btn.weiss{background:rgba(255,255,255,.18)!important;color:#fff!important;border:1px solid rgba(255,255,255,.35)!important;box-shadow:none!important}
.ep-bibk img{z-index:1}
.epbib-buecher{display:flex;gap:4px;max-width:62%;flex-wrap:wrap;margin:2px 0}
.epbib-buecher i{font-style:normal;display:grid;place-items:center;width:28px;height:28px;border-radius:9px;background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.3);font-size:.95rem;animation:epBibHuepf 4s ease-in-out infinite;animation-delay:calc(var(--i) * .25s)}
.epbib-funken{position:absolute;inset:0;pointer-events:none;z-index:0}
.epbib-funken i{position:absolute;font-style:normal;color:#FFE7A3;opacity:0;font-size:14px;animation:epBibFunke 4.5s ease-in-out infinite}
.epbib-funken i:nth-child(1){right:34%;top:18%}.epbib-funken i:nth-child(2){right:22%;top:10%;animation-delay:1.1s;font-size:18px}
.epbib-funken i:nth-child(3){right:40%;top:42%;animation-delay:2.2s}.epbib-funken i:nth-child(4){right:12%;top:34%;animation-delay:3.3s;font-size:12px}
.ep-w.ep-bibk::before{content:"";position:absolute;inset:0;z-index:0;pointer-events:none;background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,.22) 50%,transparent 60%) 0 0/250% 100% no-repeat;animation:epBibGlanz 6s ease-in-out infinite}
.ep-w.ep-bibk::after{content:"📚";position:absolute;right:-10px;bottom:-22px;font-size:120px;opacity:.12;z-index:0;pointer-events:none;transform:rotate(-10deg)}
.ep-bibk>*:not(img):not(.epbib-funken){position:relative;z-index:2}
@keyframes epBibBlatt{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(4deg) translateY(-3px)}}
@keyframes epBibHuepf{0%,80%,100%{transform:translateY(0)}88%{transform:translateY(-5px)}}
@keyframes epBibFunke{0%,100%{opacity:0;transform:scale(.6)}50%{opacity:.95;transform:scale(1.15)}}
@keyframes epBibGlanz{0%,60%{background-position:150% 0}100%{background-position:-60% 0}}
@media (prefers-reduced-motion:reduce){.ep-bibk *,.ep-w.ep-bibk::before{animation:none!important}}
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
css.textContent = T.map(([s, n]) => `${W}${s}{background:url(${K}${n}-symbol.webp?v=2) ${SYM[n][0]}/auto ${SYM[n][1]} no-repeat,url(${K}${n}-grund.webp?v=2) 0 0/100% 100% no-repeat,transparent!important;animation:none!important}`).join("\n") + `
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
html:root body #nav #navKonto.st-anm{width:168px!important;min-width:0!important;max-width:none!important;height:48px!important;min-height:48px!important;flex:0 0 auto!important;padding:0!important;border:0!important;border-radius:999px!important;color:transparent!important;font-size:0!important;
  background:url(${K}anmelden.webp) center/contain no-repeat!important;box-shadow:0 10px 22px -10px rgba(91,63,224,.7)!important;transition:transform .15s}
#nav #navKonto.st-anm *{display:none!important}
html:root body #nav .menubtn.st-menue{width:150px!important;min-width:0!important;height:48px!important;min-height:48px!important;flex:0 0 auto!important;padding:0!important;border:0!important;border-radius:999px!important;color:transparent!important;font-size:0!important;
  background:url(${K}menue.webp) center/contain no-repeat!important;box-shadow:0 10px 22px -10px rgba(91,63,224,.6)!important;transition:transform .15s}
#nav .menubtn.st-menue *{display:none!important}
#nav .xs-knopf.st-ton{width:50px!important;height:50px!important;min-width:0!important;min-height:0!important;padding:0!important;border:0!important;border-radius:50%!important;color:transparent!important;font-size:0!important;
  background:url(${K}ton.webp) center/contain no-repeat!important;box-shadow:0 10px 22px -10px rgba(91,63,224,.6)!important;transition:transform .15s,filter .2s}
#nav .xs-knopf.st-ton>*{opacity:0!important}
#nav .xs-knopf.st-ton.st-stumm{filter:grayscale(.85) opacity(.7)}
html:root body #nav #navReels.st-qeels{width:142px!important;min-width:0!important;height:48px!important;min-height:48px!important;flex:0 0 auto!important;padding:0!important;border:0!important;border-radius:999px!important;color:transparent!important;font-size:0!important;
  background:url(${K}qeels.webp) center/contain no-repeat!important;box-shadow:0 10px 22px -10px rgba(91,63,224,.55)!important;transition:transform .15s}
#nav #navReels.st-qeels>*{opacity:0!important}
#nav .xui-knopf.st-de{width:50px!important;height:54px!important;min-width:0!important;min-height:0!important;padding:0!important;border:0!important;border-radius:50%!important;color:transparent!important;font-size:0!important;
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
// Die ganze Grafik füllt die Kachel (nichts geschnitten, keine Nähte), die Kachel hat dafür das Seitenverhältnis
// der Datei (900 x 515). Nur wenn der Text mehr Platz braucht, wird die Kachel höher und die Grafik leicht gedehnt.
const K = "img/kacheln/bereich-", N = ["welt", "natur", "geld", "alltag"];
const pc = n => `html:root body:not(.ep-app) .bereiche>.bereich[data-b=${n}]`;
const alle = N.map(pc).join(",");
const css = document.createElement("style"); css.id = "ep-bereich-kacheln-css";
css.textContent = N.map(n => `${pc(n)}{background:url(${K}${n}.webp?v=2) 0 0/100% 100% no-repeat!important}`).join("\n") + `
:is(${alle}){border-image:none!important;animation:none!important;border:0!important;border-radius:4.5%/7.8%!important;aspect-ratio:900/515;height:auto!important;color:#fff!important;box-shadow:none!important;overflow:visible;filter:drop-shadow(0 14px 22px rgba(20,20,70,.35))}
:is(${alle})::before,:is(${alle})::after{display:none!important}
:is(${alle}) :is(h2,p,b,small,.apn){text-shadow:0 2px 8px rgba(20,10,60,.5)}
`;
document.head.appendChild(css);
})();

/* ================= Kacheln der Startseite Handy und iPad (App-Ansicht .ap-heute) mit gezeichneten Grafiken ================= */
(function(){
// Grund als Neun-Teile-Bild (Ecken und Rand unverzerrt), Symbol bündig rechts unten im selben Massstab wie der Rahmen,
// so liegen die Rahmen genau aufeinander und nichts wird abgeschnitten. --s = Massstab je Kachel (unten per ResizeObserver).
const K = "img/kacheln/", T = "html:root body .ap-heute";
const G = {serie:[269,301], wissen:[288,337], level:[325,288], tag:[252,344], live:[252,287], fehler:[336,324], abzeichen:[290,358]};
const M = {zufall:"serie", lib:"wissen", profil:"level", chat:"tag", live:"live", fehler:"fehler"};
const s = "var(--s,.25)";
const grund = n => `border-image:url(${K}${n}-grund.webp?v=2) 60 60 66 60 fill/calc(60px*${s}) calc(60px*${s}) calc(66px*${s}) calc(60px*${s}) stretch!important;border-style:solid!important;border-width:0!important;border-color:transparent!important;background:transparent!important`;
const sym = n => `content:""!important;display:block!important;position:absolute!important;right:0!important;bottom:0!important;top:auto!important;left:auto!important;width:calc(${G[n][0]}px*${s})!important;height:calc(${G[n][1]}px*${s})!important;background:url(${K}${n}-symbol.webp?v=2) 0 0/100% 100% no-repeat!important;border-radius:0!important;opacity:1!important;transform:none!important;filter:none!important;animation:none!important;pointer-events:none;z-index:0!important`;
const A = `${T} :is(.ap-tag>.apf,.ap-woche,.ap-fakt)`;
const css = document.createElement("style"); css.id = "ep-app-kacheln-css";
css.textContent = Object.entries(M).map(([x, n]) => `${T} .ap-tag>.apf[data-x=${x}]{${grund(n)}}\n${T} .ap-tag>.apf[data-x=${x}]::after{${sym(n)}}`).join("\n") + `
${T} .ap-woche{${grund("serie")}}
${T} .ap-woche::after{${sym("abzeichen")}}
${T} .ap-fakt{${grund("wissen")}}
${T} .ap-fakt::after{${sym("wissen")}}
${A}{position:relative!important;border-radius:calc(40px*${s})!important;box-shadow:0 10px 22px -12px rgba(20,20,70,.55)!important;color:#fff!important;animation:none!important;overflow:visible!important}
${T} .ap-tag>.apf .apico,${T} :is(.ap-fakt,.ap-woche)>svg{display:none!important}
${A}::before{display:none!important}
${A} :is(b,small,p,em,span){text-shadow:0 2px 6px rgba(20,10,60,.5);position:relative;z-index:1}
${T} :is(.ap-woche,.ap-fakt) .aptx{max-width:68%}
${T} .ap-tag>.apf[disabled]{filter:saturate(.8)}
`;
document.head.appendChild(css);
const name = e => e.classList.contains("ap-woche") ? "abzeichen" : e.classList.contains("ap-fakt") ? "wissen" : M[e.dataset.x];
function mass(e){ const g = G[name(e)]; if(!g) return; const r = e.getBoundingClientRect(); if(!r.height) return;
  const breit = e.classList.contains("ap-woche") || e.classList.contains("ap-fakt");
  const v = Math.min(r.height * (breit ? .92 : .58) / g[1], r.width * (breit ? .3 : .5) / g[0]);
  e.style.setProperty("--s", v.toFixed(4)); }
const ro = window.ResizeObserver ? new ResizeObserver(l => l.forEach(x => mass(x.target))) : null;
function suchen(){ document.querySelectorAll(".ap-heute .ap-tag>.apf,.ap-heute .ap-woche,.ap-heute .ap-fakt").forEach(e => { if(e.dataset.ks) return; e.dataset.ks = "1"; mass(e); if(ro) ro.observe(e); }); }
const app = document.getElementById("app") || document.body;
new MutationObserver(suchen).observe(app, {childList:true, subtree:true});
suchen();
})();

/* ================= Themen-Kacheln der vier Bereiche im neuen Stil (nur Computer) ================= */
(function(){
// Grund: gezeichnete Karte mit Wellen in der Farbe des Bereichs (img/kacheln/thema-<bereich>.webp, 935 x 381) als Neun-Teile-Bild,
// Ecken, Unterkante und Wellen bleiben unverzerrt. Symbol oben links, Text links, grosses helles Wasserzeichen rechts unten (data-wz).
const B = {welt:"30,50,160", natur:"10,90,60", geld:"140,20,30", alltag:"150,80,0"};
const WZ = {
  geldalles:"💰", alltagalles:"🏠", sprachenalles:"💬", naturalles:"🦊", wissenalles:"🧪", technikalles:"🤖",geschichte:"🏰", politik:"🏛️", geografie:"🌍", religion:"🕊️", bilder:"🖼️",
  natur:"🌳", tiere:"🦊", wissenschaft:"🧪", koerper:"💪", physik:"⚡", weltall:"🔭", erde:"🌋", chemie:"⚗️", mathe:"🔢", technik:"🤖", informatik:"💻",
  geld:"🪙", banken:"🏦", steuern:"🧾", krankenkasse:"🩺", medien:"📱", beruf:"🧰", haushalt:"🍳", schweiz:"🏔️", wirtschaft:"💰", logos:"🏷️",
  alltag:"🏠", sprache:"🔤", fremdsprachen:"💬", franzoesisch:"🥐", englisch:"💂", kunst:"🎨", musik:"🎵", sport:"⚽", unterhaltung:"🎬", allgemein:"🧩", ethik:"⚖️"};
const sel = n => `html:root body:not(.ep-app) #app .themen>.thema[style*='--${n}']`;
const A = Object.keys(B).map(sel).join(",");
const css = document.createElement("style"); css.id = "ep-thema-welt-css";
css.textContent = Object.entries(B).map(([n, rgb]) => `${sel(n)}{border-image:url(img/kacheln/thema-${n}.webp?v=2) 56 56 210 56 fill/20px 20px 76px 20px stretch!important;filter:drop-shadow(0 16px 22px rgba(${rgb},.35))}
${sel(n)} b{text-shadow:0 2px 10px rgba(${rgb},.45)!important}
${sel(n)} span.n{background:rgba(${rgb},.5)!important}`).join("\n") + `
:is(${A}){border-style:solid!important;border-width:0!important;border-color:transparent!important;
  background:transparent!important;box-shadow:none!important;border-radius:0!important;
  display:flex!important;flex-direction:column!important;align-items:flex-start!important;justify-content:flex-start!important;text-align:left!important;gap:12px!important;
  padding:26px 28px 30px!important;min-height:230px;overflow:hidden;isolation:isolate}
:is(${A})::before{display:none!important}
:is(${A})::after{content:attr(data-wz);position:absolute;right:-6px;bottom:-14px;z-index:-1;font-size:118px;line-height:1;pointer-events:none;
  filter:brightness(0) invert(1);opacity:.14;transform:rotate(-6deg)}
:is(${A}) .emo{margin:0!important;width:78px!important;height:78px!important;border-radius:24px!important;background:linear-gradient(160deg,#fff,#EEF1FF)!important;box-shadow:0 12px 22px -10px rgba(10,20,60,.5),inset 0 -3px 0 rgba(0,0,0,.06)!important}
:is(${A})>span:not(.emo){display:flex;flex-direction:column;align-items:flex-start;gap:6px;max-width:72%;position:relative;z-index:1}
:is(${A}) b{font-size:1.45rem!important}
:is(${A}) span.t{font-size:1rem;line-height:1.35;text-shadow:0 1px 6px rgba(0,0,0,.18)}
:is(${A}) span.n{margin-top:6px!important;padding:5px 14px!important;border-radius:999px!important}
:is(${A}):hover{transform:translateY(-4px)}
:is(${A}):active{transform:translateY(3px)}
`;
document.head.appendChild(css);
function setzen(){ document.querySelectorAll("#app .themen>.thema[data-t]").forEach(e => { const z = WZ[e.dataset.t]; if(z && e.dataset.wz !== z) e.dataset.wz = z; }); }
const app = document.getElementById("app");
if(app) new MutationObserver(setzen).observe(app, {childList:true, subtree:true});
setzen();
})();

/* ================= Quiz: Antworten im Glanz-Stil der Qeels (A bis D als Bild, Knopf mit Buchstabe) ================= */
(function(){
const A = "html body #app .answers .ans";
const css = document.createElement("style"); css.id = "ep-antworten-qeels-css";
css.textContent = `
${A}{--ah:66px;--ab:url("img/qeels-antwort-a.webp");--ak:url("img/qeels-antwort-a-knopf.webp");position:relative;display:flex!important;align-items:center;justify-content:flex-start!important;gap:12px;
  min-height:var(--ah)!important;padding:2px calc(var(--ah) * .3) 2px calc(var(--ah) * .1)!important;box-sizing:border-box;
  background:none!important;border:0 solid transparent!important;border-width:calc(var(--ah) * .3) calc(var(--ah) * .5)!important;
  border-image:var(--ab) 48 80 fill / calc(var(--ah) * .3) calc(var(--ah) * .5) stretch!important;border-radius:0!important;box-shadow:none!important;
  color:#fff!important;text-align:left!important;font-weight:800;line-height:1.22;text-shadow:0 1px 3px rgba(0,0,0,.45);
  filter:drop-shadow(0 5px 10px rgba(0,0,0,.25));transition:transform .12s,filter .12s}
${A}:nth-child(2){--ab:url("img/qeels-antwort-b.webp");--ak:url("img/qeels-antwort-b-knopf.webp")}
${A}:nth-child(3){--ab:url("img/qeels-antwort-c.webp");--ak:url("img/qeels-antwort-c-knopf.webp")}
${A}:nth-child(4){--ab:url("img/qeels-antwort-d.webp");--ak:url("img/qeels-antwort-d-knopf.webp")}
${A} .key{position:static!important;transform:none!important;flex:none;width:calc(var(--ah) * .8)!important;height:calc(var(--ah) * .8)!important;margin:calc(var(--ah) * -.3) 0 calc(var(--ah) * -.3) calc(var(--ah) * -.5)!important;
  background:center/contain no-repeat var(--ak)!important;border:0!important;box-shadow:none!important;border-radius:50%;color:transparent!important;font-size:0!important}
${A} > span:not(.key){flex:1;min-width:0;text-align:left}
${A}:hover:not([disabled]){filter:brightness(1.08) drop-shadow(0 8px 14px rgba(0,0,0,.3));transform:translateY(-2px)}
${A}:active:not([disabled]){filter:brightness(.95) drop-shadow(0 2px 6px rgba(0,0,0,.25));transform:translateY(2px) scale(.985)}
${A}:focus-visible{outline:3px solid #FFE34D;outline-offset:3px}
${A}[disabled]:not(.right):not(.wrong){opacity:.5;filter:saturate(.6) drop-shadow(0 4px 8px rgba(0,0,0,.2))}
${A}.right{opacity:1!important;outline:0;filter:drop-shadow(0 0 12px rgba(59,255,142,.75))!important}
${A}.wrong{opacity:1!important;filter:drop-shadow(0 0 12px rgba(255,59,59,.7))!important}
${A}.right::after,${A}.wrong::after{content:"✓";margin-left:auto;flex:none;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:#16A35A;color:#fff;font-weight:900;font-size:1rem;box-shadow:0 0 0 2px #fff;text-shadow:none;position:static!important;top:auto!important;right:auto!important;transform:none!important;align-self:center}
${A}.wrong::after{content:"✗";background:#D6362E}
html body.ep-app #app .answers .ans{--ah:56px}
@media (prefers-reduced-motion:reduce){${A}{transition:none}}
`;
document.head.appendChild(css);
})();

/* ===== Neue Knopf-Grafiken von Dejan (30.10.): Quiz-Leiste, Reiter, Joker, Vorlesen, goldene Knöpfe, Training/Test-Karten, Stufen ===== */
(function(){
if(document.getElementById("ep-grafik-knoepfe-css")) return;
const css = document.createElement("style"); css.id = "ep-grafik-knoepfe-css";
css.textContent = `
html body #app .qnav .qnbtn{--gh:50px;height:var(--gh)!important;min-height:0!important;box-sizing:border-box!important;background:none!important;border:0 solid transparent!important;border-width:calc(var(--gh)*.3) calc(var(--gh)*.5)!important;border-image:url("img/grafik/knopf-zurueck.webp?v=1") 70 118 fill / calc(var(--gh)*.3) calc(var(--gh)*.5) stretch!important;border-radius:0!important;box-shadow:none!important;padding:0 calc(var(--gh)*.05)!important;display:inline-flex!important;align-items:center;justify-content:center;gap:8px;filter:drop-shadow(0 4px 6px rgba(20,20,60,.22));transition:transform .12s,filter .12s;color:#28304A!important;font-weight:800}
html body #app .qnav #qNext{--gh:50px;height:var(--gh)!important;min-height:0!important;box-sizing:border-box!important;background:none!important;border:0 solid transparent!important;border-width:calc(var(--gh)*.3) calc(var(--gh)*.5)!important;border-image:url("img/grafik/knopf-weiter.webp?v=1") 70 117 fill / calc(var(--gh)*.3) calc(var(--gh)*.5) stretch!important;border-radius:0!important;box-shadow:none!important;padding:0 calc(var(--gh)*.05)!important;display:inline-flex!important;align-items:center;justify-content:center;gap:8px;filter:drop-shadow(0 4px 6px rgba(20,20,60,.22));transition:transform .12s,filter .12s;color:#28304A!important;font-weight:800}
html body #app .qnav #qMark{--gh:50px;height:var(--gh)!important;min-height:0!important;box-sizing:border-box!important;background:none!important;border:0 solid transparent!important;border-width:calc(var(--gh)*.3) calc(var(--gh)*.5)!important;border-image:url("img/grafik/knopf-markieren.webp?v=1") 66 110 fill / calc(var(--gh)*.3) calc(var(--gh)*.5) stretch!important;border-radius:0!important;box-shadow:none!important;padding:0 calc(var(--gh)*.05)!important;display:inline-flex!important;align-items:center;justify-content:center;gap:8px;filter:drop-shadow(0 4px 6px rgba(20,20,60,.22));transition:transform .12s,filter .12s;color:#fff!important;text-shadow:0 1px 2px rgba(0,0,0,.35)}
html body #app .qnav .abgabe{--gh:50px;height:var(--gh)!important;min-height:0!important;box-sizing:border-box!important;background:none!important;border:0 solid transparent!important;border-width:calc(var(--gh)*.3) calc(var(--gh)*.5)!important;border-image:url("img/grafik/knopf-beenden.webp?v=1") 66 110 fill / calc(var(--gh)*.3) calc(var(--gh)*.5) stretch!important;border-radius:0!important;box-shadow:none!important;padding:0 calc(var(--gh)*.05)!important;display:inline-flex!important;align-items:center;justify-content:center;gap:8px;filter:drop-shadow(0 4px 6px rgba(20,20,60,.22));transition:transform .12s,filter .12s;color:#fff!important;text-shadow:0 1px 2px rgba(0,0,0,.35)}
html body #app .qnav .qnbtn:not([disabled]):hover{transform:translateY(-2px);filter:brightness(1.05) drop-shadow(0 6px 8px rgba(20,20,60,.25))}
html body #app .qnav .qnbtn[disabled]{opacity:.45}
html body #app .qnav .gki{width:26px;height:26px;object-fit:contain;flex:none}
html body #app .card .tabs .tabbtn{--gh:58px;height:var(--gh)!important;min-height:0!important;box-sizing:border-box!important;background:none!important;border:0 solid transparent!important;border-width:calc(var(--gh)*.3) calc(var(--gh)*.5)!important;border-image:url("img/grafik/knopf-zurueck.webp?v=1") 70 118 fill / calc(var(--gh)*.3) calc(var(--gh)*.5) stretch!important;border-radius:0!important;box-shadow:none!important;padding:0 calc(var(--gh)*.05)!important;display:inline-flex!important;align-items:center;justify-content:center;gap:8px;filter:drop-shadow(0 4px 6px rgba(20,20,60,.22));transition:transform .12s,filter .12s;color:#28304A!important;font-weight:800;flex:1;width:100%}
html body #app .card .tabs .tabbtn[data-tab="frage"][aria-selected="true"]{--gh:58px;height:var(--gh)!important;min-height:0!important;box-sizing:border-box!important;background:none!important;border:0 solid transparent!important;border-width:calc(var(--gh)*.3) calc(var(--gh)*.5)!important;border-image:url("img/grafik/knopf-zurueck.webp?v=1") 70 118 fill / calc(var(--gh)*.3) calc(var(--gh)*.5) stretch!important;border-radius:0!important;box-shadow:none!important;padding:0 calc(var(--gh)*.05)!important;display:inline-flex!important;align-items:center;justify-content:center;gap:8px;filter:drop-shadow(0 4px 6px rgba(20,20,60,.22));transition:transform .12s,filter .12s;color:#28304A!important;text-shadow:none}
html body #app .card .tabs .tabbtn[data-tab="erklaerung"][aria-selected="true"]{--gh:58px;height:var(--gh)!important;min-height:0!important;box-sizing:border-box!important;background:none!important;border:0 solid transparent!important;border-width:calc(var(--gh)*.3) calc(var(--gh)*.5)!important;border-image:url("img/grafik/knopf-blau.webp?v=1") 44 73 fill / calc(var(--gh)*.3) calc(var(--gh)*.5) stretch!important;border-radius:0!important;box-shadow:none!important;padding:0 calc(var(--gh)*.05)!important;display:inline-flex!important;align-items:center;justify-content:center;gap:8px;filter:drop-shadow(0 4px 6px rgba(20,20,60,.22));transition:transform .12s,filter .12s;color:#fff!important;text-shadow:0 1px 3px rgba(0,0,0,.35)}
html body #app .card .tabs .gki{width:34px;height:34px;object-fit:contain}
html body #app .hlf-j{--gh:48px;height:var(--gh)!important;min-height:0!important;box-sizing:border-box!important;background:none!important;border:0 solid transparent!important;border-width:calc(var(--gh)*.3) calc(var(--gh)*.5)!important;border-image:url("img/grafik/knopf-5050.webp?v=1") 70 116 fill / calc(var(--gh)*.3) calc(var(--gh)*.5) stretch!important;border-radius:0!important;box-shadow:none!important;padding:0 calc(var(--gh)*.05)!important;display:inline-flex!important;align-items:center;justify-content:center;gap:8px;filter:drop-shadow(0 4px 6px rgba(20,20,60,.22));transition:transform .12s,filter .12s;color:#fff!important;font-weight:800;text-shadow:0 1px 2px rgba(0,0,0,.35)}
html body #app .hlf-j .hlf-ji{background:none!important;width:28px!important;height:28px!important;box-shadow:none!important}html body #app .hlf-j .hlf-ji img{width:28px;height:28px;object-fit:contain}
html body #app .hlf-vl{--gh:44px;height:var(--gh)!important;min-height:0!important;box-sizing:border-box!important;background:none!important;border:0 solid transparent!important;border-width:calc(var(--gh)*.3) calc(var(--gh)*.5)!important;border-image:url("img/grafik/knopf-5050.webp?v=1") 70 116 fill / calc(var(--gh)*.3) calc(var(--gh)*.5) stretch!important;border-radius:0!important;box-shadow:none!important;padding:0 calc(var(--gh)*.05)!important;display:inline-flex!important;align-items:center;justify-content:center;gap:8px;filter:drop-shadow(0 4px 6px rgba(20,20,60,.22));transition:transform .12s,filter .12s;color:#fff!important;text-shadow:0 1px 2px rgba(0,0,0,.35)}
html body #app .hlf-vl.an{--gh:44px;height:var(--gh)!important;min-height:0!important;box-sizing:border-box!important;background:none!important;border:0 solid transparent!important;border-width:calc(var(--gh)*.3) calc(var(--gh)*.5)!important;border-image:url("img/grafik/knopf-vorlesen.webp?v=1") 67 111 fill / calc(var(--gh)*.3) calc(var(--gh)*.5) stretch!important;border-radius:0!important;box-shadow:none!important;padding:0 calc(var(--gh)*.05)!important;display:inline-flex!important;align-items:center;justify-content:center;gap:8px;filter:drop-shadow(0 4px 6px rgba(20,20,60,.22));transition:transform .12s,filter .12s;color:#fff!important}
html body #app .hlf-vl .hlf-vli{background:none!important}html body #app .hlf-vl .hlf-vli img{width:26px;height:26px;object-fit:contain}
html body #app #startTrain{--gh:62px;height:var(--gh)!important;min-height:0!important;box-sizing:border-box!important;background:none!important;border:0 solid transparent!important;border-width:calc(var(--gh)*.3) calc(var(--gh)*.5)!important;border-image:url("img/grafik/knopf-gold.webp?v=1") 52 87 fill / calc(var(--gh)*.3) calc(var(--gh)*.5) stretch!important;border-radius:0!important;box-shadow:none!important;padding:0 calc(var(--gh)*.05)!important;display:inline-flex!important;align-items:center;justify-content:center;gap:8px;filter:drop-shadow(0 4px 6px rgba(20,20,60,.22));transition:transform .12s,filter .12s;color:#3A1C00!important;font:700 1.25rem Fredoka,Lexend,system-ui,sans-serif!important;text-shadow:0 1px 0 rgba(255,255,255,.5)}
html body #app #next{--gh:62px;height:var(--gh)!important;min-height:0!important;box-sizing:border-box!important;background:none!important;border:0 solid transparent!important;border-width:calc(var(--gh)*.3) calc(var(--gh)*.5)!important;border-image:url("img/grafik/knopf-gold.webp?v=1") 52 87 fill / calc(var(--gh)*.3) calc(var(--gh)*.5) stretch!important;border-radius:0!important;box-shadow:none!important;padding:0 calc(var(--gh)*.05)!important;display:inline-flex!important;align-items:center;justify-content:center;gap:8px;filter:drop-shadow(0 4px 6px rgba(20,20,60,.22));transition:transform .12s,filter .12s;color:#3A1C00!important;font:700 1.25rem Fredoka,Lexend,system-ui,sans-serif!important;text-shadow:0 1px 0 rgba(255,255,255,.5)}
html body #app .startlbl{--gh:62px;height:var(--gh)!important;min-height:0!important;box-sizing:border-box!important;background:none!important;border:0 solid transparent!important;border-width:calc(var(--gh)*.3) calc(var(--gh)*.5)!important;border-image:url("img/grafik/knopf-gold.webp?v=1") 52 87 fill / calc(var(--gh)*.3) calc(var(--gh)*.5) stretch!important;border-radius:0!important;box-shadow:none!important;padding:0 calc(var(--gh)*.05)!important;display:inline-flex!important;align-items:center;justify-content:center;gap:8px;filter:drop-shadow(0 4px 6px rgba(20,20,60,.22));transition:transform .12s,filter .12s;color:#3A1C00!important;font:700 1.25rem Fredoka,Lexend,system-ui,sans-serif!important;text-shadow:0 1px 0 rgba(255,255,255,.5)}
html body #app #toExplain{--gh:62px;height:var(--gh)!important;min-height:0!important;box-sizing:border-box!important;background:none!important;border:0 solid transparent!important;border-width:calc(var(--gh)*.3) calc(var(--gh)*.5)!important;border-image:url("img/grafik/knopf-zurueck.webp?v=1") 70 118 fill / calc(var(--gh)*.3) calc(var(--gh)*.5) stretch!important;border-radius:0!important;box-shadow:none!important;padding:0 calc(var(--gh)*.05)!important;display:inline-flex!important;align-items:center;justify-content:center;gap:8px;filter:drop-shadow(0 4px 6px rgba(20,20,60,.22));transition:transform .12s,filter .12s;color:#28304A!important;font-weight:800}
html body #app .np-los{--gh:66px;height:var(--gh)!important;min-height:0!important;box-sizing:border-box!important;background:none!important;border:0 solid transparent!important;border-width:calc(var(--gh)*.3) calc(var(--gh)*.5)!important;border-image:url("img/grafik/knopf-gold.webp?v=1") 52 87 fill / calc(var(--gh)*.3) calc(var(--gh)*.5) stretch!important;border-radius:0!important;box-shadow:none!important;padding:0 calc(var(--gh)*.05)!important;display:inline-flex!important;align-items:center;justify-content:center;gap:8px;filter:drop-shadow(0 4px 6px rgba(20,20,60,.22));transition:transform .12s,filter .12s;color:#3A1C00!important;font:700 24px Fredoka,Lexend,system-ui,sans-serif!important}
html body #app .modes .mode .em.em-bild{width:170px!important;height:auto!important;aspect-ratio:556/377;border-radius:0!important;background:none!important;box-shadow:none!important;transform:rotate(-3deg);filter:drop-shadow(0 10px 14px rgba(0,0,0,.3))}
html body #app .modes .mode .em.em-bild img{width:100%;height:100%;object-fit:contain}
img.gstufe{width:1.35em;height:1.35em;object-fit:contain;vertical-align:-.3em;display:inline-block}
`;
document.head.appendChild(css);
})();

/* Knopf «Test starten» auf der Training/Test-Karte: alten goldenen Verlauf und Schatten ausblenden, nur die Grafik zeigen */
(function(){ const c = document.createElement("style"); c.id = "ep-startlbl-fix";
c.textContent = `html body #app .modes .mode.test .startlbl.big.gold,html body #app .modes .mode.test:hover .startlbl.big.gold{background-color:transparent!important;background-image:none!important;box-shadow:none!important}`;
document.head.appendChild(c); })();

/* Gezeichnete Themen-Symbole (ico() mit GICO in index.html) */
(function(){ const c = document.createElement("style"); c.id = "ep-gico-css";
c.textContent = `.ic.gico{display:inline-flex!important;align-items:center;justify-content:center;line-height:1}
.ic.gico img{width:1.15em;height:1.15em;object-fit:contain;display:block;-webkit-user-drag:none;user-select:none;filter:drop-shadow(0 2px 3px rgba(0,0,0,.18))}`;
document.head.appendChild(c); })();

/* ===== Training/Test-Seite: Dejans Wellen-Boxen (blau/lila) und Kopf «Welt» mit Globus, Büchern und Kompass ===== */
(function(){ if(document.getElementById("ep-modus-boxen-css")) return;
const c = document.createElement("style"); c.id = "ep-modus-boxen-css";
const G = "img/grafik/";
c.textContent = `
html body #app .modes>.mode.mode.mode{background:none!important;box-shadow:none!important;border:0 solid transparent!important;border-radius:0!important;
  border-image:url("${G}box-blau.webp?v=3") 64 fill / 34px stretch!important;filter:drop-shadow(0 12px 18px rgba(20,40,120,.28))}
html body #app .modes>.mode.test.test{border-image-source:url("${G}box-lila.webp?v=3")!important;filter:drop-shadow(0 12px 18px rgba(110,30,150,.3))}
html body #app .modes>.mode.test[disabled]{filter:grayscale(.5) drop-shadow(0 8px 12px rgba(0,0,0,.2))}
html body #app .modes>.mode::before,html body #app .modes>.mode::after{display:none!important}
html body #app .st-kopf.ep-kopf-welt{background:none!important;box-shadow:none!important;border:0 solid transparent!important;
  border-image:url("${G}box-blau.webp?v=3") 64 fill / 36px stretch!important;filter:drop-shadow(0 14px 22px rgba(20,40,120,.3));padding-right:34%!important}
html body #app .st-kopf.ep-kopf-welt::before{display:none!important}
html body #app .st-kopf.ep-kopf-welt .st-kids{display:none!important}
html body #app .st-kopf.ep-kopf-welt::after{content:"";position:absolute;right:20px;top:16px;bottom:16px;aspect-ratio:1012/674;max-width:40%;z-index:0;pointer-events:none;
  background:url("${G}kopf-welt-deko.webp?v=4") right center/contain no-repeat}
html body #app .st-kopf.ep-kopf-welt>*{position:relative;z-index:1}
html body #app .st-kopf.ep-kopf-natur{background:url("${G}kopf-natur.webp?v=1") right center/cover no-repeat!important;box-shadow:none!important;border:0!important;border-radius:28px!important;filter:drop-shadow(0 14px 22px rgba(10,90,50,.3));padding-right:30%!important}
html body #app .st-kopf.ep-kopf-natur::before{display:none!important}
html body #app .st-kopf.ep-kopf-geld{background:url("${G}kopf-geld.webp?v=2") right center/cover no-repeat!important;box-shadow:none!important;border:0!important;border-radius:28px!important;filter:drop-shadow(0 14px 22px rgba(120,10,20,.3));padding-right:30%!important}
html body #app .st-kopf.ep-kopf-geld :is(h1,h2,p){text-shadow:0 2px 4px rgba(100,0,10,.5)!important}
@media (min-width:900px){html body #app .st-kopf:is(.ep-kopf-geld,.ep-kopf-alltag) .bhead h1{font-size:2.6rem!important}html body #app .st-kopf:is(.ep-kopf-geld,.ep-kopf-alltag) :is(.bhead h1,.bhead p,h1,p){max-width:50%!important}}
html body #app .st-kopf.ep-kopf-geld::before,html body #app .st-kopf.ep-kopf-geld .st-kids{display:none!important}
html body.ep-app #app .st-kopf.ep-kopf-geld{padding-right:24%!important;border-radius:20px!important}
html body #app .st-kopf.ep-kopf-alltag{background:url("${G}kopf-alltag.webp?v=2") right center/cover no-repeat!important;box-shadow:none!important;border:0!important;border-radius:28px!important;filter:drop-shadow(0 14px 22px rgba(150,80,0,.3));padding-right:30%!important}
html body #app .st-kopf.ep-kopf-alltag::before,html body #app .st-kopf.ep-kopf-alltag .st-kids{display:none!important}
html body #app .st-kopf.ep-kopf-alltag .bhead h1{text-shadow:0 2px 10px rgba(120,50,0,.45)!important}
html body #app .st-kopf.ep-kopf-alltag :is(h1,h2,p,.bhead p){text-shadow:0 2px 3px rgba(110,50,0,.55),0 0 14px rgba(150,70,0,.35)!important}
@media (min-width:900px){html body #app .st-kopf.ep-kopf-alltag html body #app .st-kopf.ep-kopf-alltag .bhead p{max-width:54%!important}}
html body.ep-app #app .st-kopf.ep-kopf-alltag{padding-right:24%!important;border-radius:20px!important}
html body #app .st-kopf.ep-kopf-natur .st-kids{display:none!important}
html body.ep-app #app .st-kopf.ep-kopf-natur{padding-right:24%!important;border-radius:20px!important}
html body.ep-app #app .st-kopf.ep-kopf-welt{padding-right:14px!important}
html body.ep-app #app .st-kopf.ep-kopf-welt::after{display:none}
`;
document.head.appendChild(c);
/* Kopf der Training/Test-Seite im Bereich Welt markieren */
function markieren(){
  try{
    const k = document.querySelector("#app .st-kopf");
    if(!k) return;
    const sc = S.screen;
    let bid = "";
    if(sc === "mode" && S.thema && S.thema.bereich) bid = S.thema.bereich.id;
    else if(sc === "bereich" && S.bereich) bid = S.bereich.id;
    else if(sc === "submenu" && S.menu && THEMA[S.menu] && THEMA[S.menu].bereich) bid = THEMA[S.menu].bereich.id;
    else if(sc === "geschmenu" || sc === "chmenu") bid = "welt";
    k.classList.toggle("ep-kopf-welt", bid === "welt");
    k.classList.toggle("ep-kopf-natur", bid === "natur");
    k.classList.toggle("ep-kopf-geld", bid === "geld");
    k.classList.toggle("ep-kopf-alltag", bid === "alltag");
  }catch(e){}
}
const app = document.getElementById("app");
if(app) new MutationObserver(markieren).observe(app, {childList:true, subtree:false});
markieren();
})();

/* Bereichsseiten mit Dejans Köpfen: Beschreibung nicht unter die Grafik laufen lassen */
(function(){ const c = document.createElement("style"); c.id = "ep-kopf-bdesc";
c.textContent = `html body:not(.ep-app) #app .st-kopf:is(.ep-kopf-welt,.ep-kopf-natur,.ep-kopf-geld,.ep-kopf-alltag) .bdesc{max-width:min(58ch,100%)!important}
html body:not(.ep-app) #app .st-kopf:is(.ep-kopf-natur,.ep-kopf-geld,.ep-kopf-alltag){padding-right:40%!important}`;
document.head.appendChild(c); })();

/* Qeels-Symbole (img/qeels-icons) in Themen, Büchern und Stufen */
(function(){ const c = document.createElement("style"); c.id = "ep-qico-css";
c.textContent = `.ic.qico img{width:1.25em;height:1.25em;filter:drop-shadow(0 2px 3px rgba(0,0,0,.15))}
.bemo2 .ic.qico img{width:1.4em;height:1.4em}`;
document.head.appendChild(c); })();

/* ===== Drei weitere Hintergründe (Einstellungen › Hintergrund): Unterwasser, Farbbänder, Formen-Muster ===== */
(function(){ if(document.getElementById("bgneu")) return;
const L = document.createElement("div"); L.id = "bgneu"; L.setAttribute("aria-hidden", "true");
let fx = ""; for(let i = 0; i < 14; i++) fx += `<i style="--x:${(i * 7.3 + 3) % 100}%;--d:${9 + (i * 3.7) % 9}s;--v:${-(i * 1.9) % 12}s;--g:${6 + (i * 5) % 14}px"></i>`;
L.innerHTML = `<div class="bgn-fx">${fx}</div><div class="bgn-szene"></div>`;
(document.body || document.documentElement).appendChild(L);
const c = document.createElement("style"); c.id = "ep-bgneu-css";
const N = ':root:is([data-bg="unterwasser"],[data-bg="baender"],[data-bg="formen"])';
c.textContent = `
#bgneu{display:none;position:fixed;inset:0;z-index:-1;pointer-events:none;overflow:hidden}
${N} #bgneu{display:block}
${N} #alpen,${N} #himmel,${N} #flocken,${N} #clouds,${N} #pattern{display:none!important}
#bgneu .bgn-szene{position:absolute;left:0;right:0;bottom:0;height:34vh;min-height:180px;background:bottom center/cover no-repeat}
#bgneu .bgn-fx i{position:absolute;display:block}
/* Unterwasser */
:root[data-bg="unterwasser"] body{background:linear-gradient(180deg,#D7F5FF 0%,#9FDDF3 55%,#6CC2E6 100%) fixed!important}
:root[data-bg="unterwasser"] body.dark{background:linear-gradient(180deg,#0B2A44,#0A3A5C 60%,#0C4E74) fixed!important}
:root[data-bg="unterwasser"] #bgneu .bgn-szene{background-image:url("img/hg/unterwasser.svg")}
:root[data-bg="unterwasser"] #bgneu::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(100deg,rgba(255,255,255,.18) 0 40px,transparent 40px 160px);mask:linear-gradient(180deg,#000,transparent 55%);-webkit-mask:linear-gradient(180deg,#000,transparent 55%);animation:bgnLicht 14s ease-in-out infinite alternate}
:root[data-bg="unterwasser"] #bgneu .bgn-fx i{left:var(--x);bottom:-30px;width:var(--g);height:var(--g);border-radius:50%;border:2px solid rgba(255,255,255,.75);background:radial-gradient(circle at 30% 30%,rgba(255,255,255,.8),rgba(255,255,255,.1) 60%);animation:bgnBlase var(--d) linear infinite;animation-delay:var(--v)}
@keyframes bgnBlase{0%{transform:translate(0,0);opacity:0}10%{opacity:1}50%{transform:translate(14px,-55vh)}100%{transform:translate(-6px,-110vh);opacity:.2}}
@keyframes bgnLicht{to{transform:translateX(-80px)}}
/* Farbbänder */
:root[data-bg="baender"] body{background:#F6F4FF!important}
:root[data-bg="baender"] body.dark{background:#0F1230!important}
:root[data-bg="baender"] #bgneu::before{content:"";position:absolute;inset:-40%;background:linear-gradient(115deg,transparent 0 18%,rgba(61,90,254,.28) 24%,transparent 32%,transparent 40%,rgba(224,67,184,.26) 47%,transparent 55%,transparent 62%,rgba(255,179,0,.26) 69%,transparent 77%,rgba(23,163,90,.22) 84%,transparent 92%);filter:blur(28px);animation:bgnBand 26s ease-in-out infinite alternate}
:root[data-bg="baender"] #bgneu::after{content:"";position:absolute;inset:-40%;background:linear-gradient(65deg,transparent 0 30%,rgba(138,63,224,.2) 38%,transparent 48%,transparent 60%,rgba(0,184,212,.2) 68%,transparent 78%);filter:blur(34px);animation:bgnBand 34s ease-in-out infinite alternate-reverse}
:root[data-bg="baender"] body.dark #bgneu::before,:root[data-bg="baender"] body.dark #bgneu::after{opacity:.6}
@keyframes bgnBand{0%{transform:translate(-6%,-3%) rotate(0deg)}100%{transform:translate(6%,4%) rotate(6deg)}}
/* Formen-Muster */
:root[data-bg="formen"] body{background:#F7F8FF!important}
:root[data-bg="formen"] body.dark{background:#10152C!important}
:root[data-bg="formen"] #bgneu::before{content:"";position:absolute;inset:-240px;background:url("img/hg/formen.svg") 0 0/280px 280px;opacity:.6;animation:bgnWander 90s linear infinite}
:root[data-bg="formen"] body.dark #bgneu::before{opacity:.45}
@keyframes bgnWander{to{transform:translate(280px,280px)}}
:root:is([data-bg="baender"],[data-bg="formen"]) #bgneu .bgn-fx,:root:is([data-bg="baender"],[data-bg="formen"]) #bgneu .bgn-szene{display:none}
@media (prefers-reduced-motion:reduce){#bgneu *,#bgneu::before{animation:none!important}}
@media (max-width:640px){#bgneu .bgn-szene{height:26vh}}
/* Vorschau in den Einstellungen */
.prev-unterwasser{background:url("img/hg/unterwasser.svg") bottom/cover no-repeat,linear-gradient(180deg,#D7F5FF,#6CC2E6)}
.prev-baender{background:linear-gradient(115deg,#F6F4FF 10%,#C9D2FF 30%,#F6F4FF 42%,#F7C8EA 55%,#F6F4FF 66%,#FFE3A6 80%,#F6F4FF)}
.prev-formen{background:url("img/hg/formen.svg") 0 0/90px 90px,#F7F8FF}
`;
document.head.appendChild(c);
})();

/* ================= Quiz-Knöpfe als farbige Pillen mit Symbol (Dejans Bilder, img/grafik/neu/knopf-*-symbol.webp) ================= */
(function(){
// Die Bilder haben das Symbol schon drin: ganzes Bild als Hintergrund, Text und kleines Symbol ausblenden (bleibt für Vorleser lesbar).
const K = n => `url("img/grafik/neu/knopf-${n}-symbol.webp?v=1") center/contain no-repeat`;
const B = "html body #app";
const pille = (sel, n, h) => `${sel}{--gh:${h}px;height:var(--gh)!important;width:calc(var(--gh)*2.24)!important;min-width:calc(var(--gh)*2.24)!important;flex:none!important;margin:0 2px!important;padding:0!important;border:0!important;border-image:none!important;border-radius:999px!important;background:${K(n)}!important;box-shadow:none!important;font-size:0!important;color:transparent!important;text-shadow:none!important;position:relative;filter:drop-shadow(0 4px 6px rgba(20,20,60,.22))}
${sel} > :not(.hlf-n){display:none!important}`;
const css = document.createElement("style"); css.id = "ep-quiz-pillen-css";
css.textContent = [
  pille(`${B} .qnav button#qPrev.qnbtn`, "zurueck", 46),
  pille(`${B} .qnav button#qNext.qnbtn`, "weiterblau", 46),
  pille(`${B} .qnav button#qMark.qnbtn`, "markieren", 46),
  pille(`${B} .qnav button#qAbgabe.qnbtn:has(.gki)`, "beenden", 46),
  pille(`${B} button.hlf-vl.hlf-vl`, "vorlesen", 40),
].join("\n") + `
${B} .qnav button#qMark.qnbtn:not(.on){filter:saturate(.55) drop-shadow(0 4px 6px rgba(20,20,60,.22))}
${B} .qnav button#qMark.qnbtn.on{outline:3px solid #FFD34D;outline-offset:1px}
${B} button.hlf-vl.hlf-vl:not(.an){filter:saturate(.35) opacity(.8) drop-shadow(0 4px 6px rgba(20,20,60,.22))}
${B} button.hlf-j.hlf-j[data-hj=f50]{--gh:44px;height:var(--gh)!important;min-height:0!important;padding:0 calc(var(--gh)*.5)!important;border:0 solid transparent!important;border-width:calc(var(--gh)*.28) calc(var(--gh)*.45)!important;border-image:url("img/grafik/neu/knopf-5050-leer.webp?v=1") 70 120 fill / calc(var(--gh)*.28) calc(var(--gh)*.45) stretch!important;border-radius:999px!important;background:none!important;box-shadow:none!important;display:inline-flex!important;align-items:center;justify-content:center;gap:6px;position:relative;color:#fff!important;font-size:17px!important;font-weight:800!important;letter-spacing:.5px;text-shadow:0 1px 2px rgba(0,40,80,.45)!important;filter:drop-shadow(0 4px 6px rgba(20,20,60,.22))}
${B} button.hlf-j.hlf-j[data-hj=f50] .hlf-ji{display:inline-grid!important;width:24px!important;height:24px!important;background:none!important}
${B} button.hlf-j.hlf-j[data-hj=f50] .hlf-ji img{width:24px!important;height:24px!important}
${B} button.hlf-j.hlf-j[data-hj=f50] .hlf-n{position:absolute;right:-6px;top:-8px;font-size:.78rem!important;color:#1B2240!important;text-shadow:none!important}
@media (max-width:640px){${B} .qnav button.qnbtn.qnbtn:is(#qPrev,#qNext,#qMark,#qAbgabe:has(.gki)){--gh:28px;margin:0!important}
${B} .qnav.qnav{grid-template-columns:auto auto minmax(0,1fr) auto auto!important;gap:4px!important}
${B} .qnav.qnav #qGrid{min-width:0!important;width:auto!important;padding:0 8px!important}}
`;
document.head.appendChild(css);
})();

/* ================= Frage in einer Sprechblase (Quiz, Duell und weitere Stellen mit h2.question) ================= */
(function(){
// Grosse gelbe Comic-Blase mit dunklem Rand und Schatten; links daneben der Kopf von Ben oder Leni
// (nur Ben und Leni, Wunsch Dejan) mit nachdenklichem oder staunendem Gesicht, unten ausgeblendet. Bei jeder Frage ein anderes Gesicht.
const Q = "html body #app h2.question";
const RAND = "#3A2400";
const css = document.createElement("style"); css.id = "ep-sprechblase-css";
css.textContent = `
${Q}{position:relative;isolation:isolate;overflow:visible;overflow-wrap:anywhere;hyphens:auto;-webkit-hyphens:auto;display:flex;align-items:center;justify-content:center;text-align:center;min-height:150px;background:linear-gradient(160deg,#FFEB85 0%,#FFD43B 50%,#F7B500 100%)!important;border:4px solid ${RAND}!important;border-radius:44px!important;padding:36px 44px!important;margin:12px 0 30px 176px!important;color:${RAND}!important;font-size:34px!important;line-height:1.2!important;text-shadow:none!important;box-shadow:6px 8px 0 ${RAND}!important}
/* Spitze: gedrehtes Quadrat mit dunklem Rand, zeigt zum Kopf */
${Q}::before{content:"";position:absolute;left:-23px;top:50%;width:40px;height:40px;margin-top:-20px;background:#FFD43B;border:4px solid ${RAND};border-right:0;border-top:0;border-radius:0 0 0 10px;transform:rotate(45deg);z-index:-1}
${Q}::after{display:none}
/* Kopf des Kids: feste Box links neben der Spitze, damit breite Köpfe nie in die Blase ragen */
${Q} > .ep-blase-kind{position:absolute;left:-180px;top:50%;width:150px;height:165px;object-fit:contain;object-position:right center;transform:translateY(-50%);pointer-events:none;filter:drop-shadow(0 3px 4px rgba(20,20,60,.18))}
@media (max-width:640px){
  ${Q}{min-height:110px;margin:8px 0 24px 96px!important;padding:22px 18px!important;border-radius:28px!important;font-size:23px!important;box-shadow:4px 5px 0 ${RAND}!important}
  ${Q}::before{left:-17px;width:28px;height:28px;margin-top:-14px}
  ${Q} > .ep-blase-kind{left:-102px;width:76px;height:90px}
}
@media (max-width:360px){
  ${Q}{margin-left:78px!important;padding:18px 14px!important;font-size:20px!important}
  ${Q} > .ep-blase-kind{left:-86px;width:60px;height:74px}
}`;
document.head.appendChild(css);
const KOEPFE = ["ben-denken","ben-denken2","ben-staunen","leni-denken","leni-denken2","leni-staunen","lumi-frage1","lumi-frage2","lumi-frage3","lumi-frage4","lumi-frage5","milo-frage1","milo-frage2","milo-frage3","milo-frage4","milo-frage5"];
let letzter = -1;
// Kopf neben jede neue Frage setzen, nie zweimal hintereinander der gleiche
const kind = () => document.querySelectorAll("#app h2.question:not([data-blase])").forEach(h => {
  h.dataset.blase = "1";
  // Pro Frage immer dasselbe Kind (aus dem Fragetext berechnet), damit es beim Wechsel Frage/Erklärung oder Zurück nicht springt
  let n = 0; try{ const Q = S.quiz, f = Q && Q.list && Q.list[Q.i]; const k = f ? (f.id || f.q || "") : (h.textContent || ""); let x = 7; for(const ch of String(k)) x = (x * 31 + ch.charCodeAt(0)) >>> 0; n = x % KOEPFE.length; }catch(e){}
  letzter = n;
  const i = document.createElement("img"); i.className = "ep-blase-kind"; i.src = "img/kids/koepfe/" + KOEPFE[n] + ".webp"; i.alt = ""; i.setAttribute("aria-hidden", "true");
  h.appendChild(i);
});
const app = document.getElementById("app") || document.body;
new MutationObserver(kind).observe(app, {childList:true, subtree:true});
kind();
})();

/* ================= Vorlesen klein unten rechts neben dem 50:50, gleich grosse Frage/Erklärung-Knöpfe am Handy ================= */
(function(){
// Der Vorlese-Schalter wandert hinter die Antworten (bzw. hinter die Joker-Leiste) und sitzt rechts auf deren Höhe.
// hilfen.js setzt die Joker-Leiste immer direkt hinter .answers ein, also bleibt sie vor dem Schalter.
const B = "html body #app";
const css = document.createElement("style"); css.id = "ep-vorlesen-unten-css";
css.textContent = `
${B} .card .answers ~ .hlf-vlrow{display:flex!important;justify-content:flex-end!important;align-items:center;margin:12px 0 0!important;min-height:44px}
${B} .card .hlf-joker + .hlf-vlrow{margin-top:-44px!important;pointer-events:none;position:relative}
${B} .card .answers ~ .hlf-vlrow button.hlf-vl.hlf-vl{--gh:32px;pointer-events:auto}
@media (max-width:640px){
  ${B} .card .tabs{gap:8px!important}
  ${B} .card .tabs .tabbtn.tabbtn{--gh:42px!important;flex:1 1 0!important;min-width:0!important;width:auto!important;font-size:.95rem!important;gap:6px!important}
  ${B} .card .tabs .tabbtn.tabbtn .gki{width:24px!important;height:24px!important}
}`;
document.head.appendChild(css);
const schieben = () => document.querySelectorAll("#app .card").forEach(card => {
  const row = card.querySelector(":scope > .hlf-vlrow"), ans = card.querySelector(":scope > .answers");
  if(!row || !ans) return;
  const ziel = ans.nextElementSibling?.classList.contains("hlf-joker") ? ans.nextElementSibling : ans;
  if(ziel.nextElementSibling !== row) ziel.insertAdjacentElement("afterend", row);
});
new MutationObserver(schieben).observe(document.getElementById("app") || document.body, {childList:true, subtree:true});
schieben();
})();

/* ================= Fortschrittsbalken mit Text drin und Animation, gleich grosse Knöpfe oben am Handy ================= */
(function(){
// Der Text «Frage 3 von 10» steht neu im Balken (die alte .count daneben wird ausgeblendet, bleibt für Vorleser lesbar).
// Der Balken wächst bei jeder neuen Frage vom alten auf den neuen Stand, die Füllung hat wandernde Streifen.
const B = "html body #app";
const css = document.createElement("style"); css.id = "ep-balken-css";
css.textContent = `
${B} .qtop .bar.ep-balken{position:relative;flex:1 1 100%!important;order:-1;height:30px!important;border-radius:999px!important;overflow:hidden;background:rgba(27,34,64,.88)!important;border:2px solid rgba(255,255,255,.75);box-shadow:inset 0 2px 4px rgba(0,0,0,.25),0 4px 10px rgba(20,20,60,.18);box-sizing:border-box}
${B} .qtop .bar.ep-balken > i{position:absolute;left:0;top:0;bottom:0;min-width:0;border-radius:999px!important;transition:width .8s cubic-bezier(.3,1.3,.5,1)!important;
  background:linear-gradient(180deg,rgba(255,255,255,.45),rgba(255,255,255,0) 55%),repeating-linear-gradient(-45deg,rgba(255,255,255,.22) 0 10px,rgba(255,255,255,0) 10px 20px),linear-gradient(90deg,#FFB020,#FF5FA2 60%,#A855F7)!important;
  background-size:100% 100%,28px 28px,100% 100%!important;animation:ep-streifen 1s linear infinite}
${B} .qtop .bar.ep-balken > .ep-balken-text{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:6px;font-weight:800;font-size:.95rem;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.7),0 0 6px rgba(0,0,0,.35);letter-spacing:.2px;white-space:nowrap;z-index:1}
${B} .qtop:has(.ep-balken) > .count{position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;padding:0!important;margin:-1px!important;border:0!important}
@keyframes ep-streifen{from{background-position:0 0,0 0,0 0}to{background-position:0 0,28px 0,0 0}}
@media (prefers-reduced-motion:reduce){${B} .qtop .bar.ep-balken > i{animation:none;transition:none!important}}
@media (max-width:640px){
  ${B} .qtop .bar.ep-balken{height:26px!important}
  ${B} .qtop .bar.ep-balken > .ep-balken-text{font-size:.85rem}
  /* obere Leiste: fünf gleich grosse Knöpfe */
  ${B} .qnav.qnav{grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:4px!important;justify-items:center;align-items:center}
  ${B} .qnav.qnav button.qnbtn.qnbtn{--gh:29px!important;width:calc(29px*2.24)!important;min-width:0!important;max-width:100%!important;height:29px!important;margin:0!important}
  ${B} .qnav.qnav button#qGrid.qnbtn{padding:0!important;border-width:8px 12px!important;border-image-width:8px 12px!important;font-size:0!important;gap:3px!important;background:none!important}
  ${B} .qnav.qnav button#qGrid.qnbtn > span{font-size:.78rem!important;font-weight:800;line-height:1}
  ${B} .qnav.qnav button#qGrid.qnbtn > .qnm{display:none!important}
}`;
document.head.appendChild(css);
let letzt = null;
const balken = () => document.querySelectorAll("#app .qtop").forEach(top => {
  const bar = top.querySelector(":scope > .bar"), cnt = top.querySelector(":scope > .count"), fill = bar && bar.querySelector("i");
  if(!bar || !cnt || !fill || bar.classList.contains("ep-balken")) return;
  bar.classList.add("ep-balken");
  const t = document.createElement("span"); t.className = "ep-balken-text"; t.setAttribute("aria-hidden", "true"); t.textContent = cnt.textContent.trim();
  bar.appendChild(t);
  const ziel = fill.style.width;
  if(letzt != null && letzt !== ziel && parseFloat(ziel) > 0){
    // ohne Übergang auf den alten Stand setzen, Layout erzwingen, dann zum neuen Stand gleiten
    fill.style.setProperty("transition", "none", "important"); fill.style.width = letzt; void fill.offsetWidth;
    fill.style.removeProperty("transition"); fill.style.width = ziel;
  }
  letzt = ziel;
});
new MutationObserver(balken).observe(document.getElementById("app") || document.body, {childList:true, subtree:true});
balken();
})();

/* ===== Quiz: weisse Fragen-Box mit Dejans Rahmen (img/grafik/frage-box.webp, Neun-Teile-Bild), nur am Computer.
   Handy und iPad behalten das Qeels-Design aus quizstil.js (Dejans Entscheid 30.10.). ===== */
(function(){ const c = document.createElement("style"); c.id = "ep-frage-box-css";
const D = "html body:not(.ep-app) #app > .card.card:has(> .tabs, .answers, .qnav)";
c.textContent = `${D}{background:none!important;box-shadow:none!important;border:0 solid transparent!important;border-radius:0!important;
  border-image:url("img/grafik/frage-box.webp?v=1") 210 250 215 240 fill / 62px 74px 64px 72px stretch!important;filter:drop-shadow(0 16px 26px rgba(30,40,120,.22));
  padding:30px 44px 34px!important;--ink:#1B2240;--soft:#5A6386;--mut:#5A6386;--surface:#FFFFFF;--bg:#F5F7FF;--line:#E3E7F5;color:#1B2240!important}
${D}::before,${D}::after{display:none!important}
html body.dark:not(.ep-app) #app > .card.card:has(> .tabs, .answers, .qnav){filter:drop-shadow(0 16px 26px rgba(0,0,0,.45))}
${D} .qq-titel,${D} .modebadge{color:#6A3FC8!important}
${D} .hlf-hinweis{background:#EEF1FB!important;color:#3A4366!important;border:1px solid #DDE2F2!important}
${D} .qnr,${D} .tasthinweis{color:#7A82A3!important}
${D} .tasthinweis kbd{background:#fff!important;color:#3A4366!important;border-color:#D5DAEC!important}
${D} .feedback,${D} .dufb{background:transparent!important;border:0!important;color:#1B2240!important}
${D} .feedback p,${D} .feedback *:not(button){color:#1B2240!important}
${D} .explain,${D} .erkl,${D} [data-panel="erklaerung"]{color:#1B2240!important}
${D} #next,${D} #toExplain{all:unset;box-sizing:border-box!important;display:flex!important;align-items:center!important;justify-content:center!important;flex:1 1 0;height:58px!important;min-height:0!important;padding:0 8px!important;cursor:pointer;text-align:center;
  background:none!important;border:0 solid transparent!important;border-width:17px 29px!important;border-radius:0!important;box-shadow:none!important;line-height:1!important;filter:drop-shadow(0 4px 6px rgba(20,20,60,.2));transition:transform .12s,filter .12s}
${D} #next{border-image:url("img/grafik/knopf-gold.webp?v=1") 52 87 fill / 17px 29px stretch!important;color:#3A1C00!important;font:700 1.2rem Fredoka,Lexend,system-ui,sans-serif!important;text-shadow:0 1px 0 rgba(255,255,255,.5)}
${D} #toExplain{border-image:url("img/grafik/knopf-zurueck.webp?v=1") 70 118 fill / 17px 29px stretch!important;color:#28304A!important;font:800 1.05rem Lexend,system-ui,sans-serif!important}
${D} #next:hover,${D} #toExplain:hover{transform:translateY(-2px);filter:brightness(1.04) drop-shadow(0 6px 8px rgba(20,20,60,.25))}
${D} #next:active,${D} #toExplain:active{transform:translateY(2px)}
${D} #next:focus-visible,${D} #toExplain:focus-visible{outline:3px solid #8A3FE0;outline-offset:3px}
${D} .feedback .row{display:flex!important;gap:14px!important;width:100%;align-items:center}
/* Fortschrittsbalken am Computer: glänzend, wandernde Streifen, Funkeln am Ende */
html.qq-an body:not(.ep-app) #app > .qtop .bar.ep-balken{height:34px!important;background:linear-gradient(180deg,#2A2F6B,#1B2050)!important;border:3px solid #fff!important;box-shadow:0 6px 14px -4px rgba(40,30,120,.45),inset 0 3px 6px rgba(0,0,0,.35)!important}
html.qq-an body:not(.ep-app) #app > .qtop .bar.ep-balken > i{overflow:hidden;border-radius:999px!important;
  background:linear-gradient(180deg,rgba(255,255,255,.55),rgba(255,255,255,0) 50%),repeating-linear-gradient(-45deg,rgba(255,255,255,.28) 0 11px,rgba(255,255,255,0) 11px 22px),linear-gradient(90deg,#FFD43B,#FF9F1C 45%,#FF5FA2 80%,#C04BFF)!important;
  background-size:100% 100%,31px 31px,100% 100%!important;animation:ep-streifen-d .9s linear infinite!important;box-shadow:0 0 14px rgba(255,180,60,.65)}
html.qq-an body:not(.ep-app) #app > .qtop .bar.ep-balken > i::after{content:"";position:absolute;right:4px;top:50%;width:18px;height:18px;transform:translateY(-50%);background:radial-gradient(circle,#fff 0 22%,rgba(255,255,255,.6) 35%,rgba(255,255,255,0) 70%);border-radius:50%;animation:ep-funkel 1.4s ease-in-out infinite}
html.qq-an body:not(.ep-app) #app > .qtop .bar.ep-balken > .ep-balken-text{font-size:1rem!important;letter-spacing:.4px}
@keyframes ep-streifen-d{from{background-position:0 0,0 0,0 0}to{background-position:0 0,31px 0,0 0}}
@keyframes ep-funkel{0%,100%{opacity:.5;transform:translateY(-50%) scale(.7)}50%{opacity:1;transform:translateY(-50%) scale(1.15)}}
@media (prefers-reduced-motion:reduce){html.qq-an body:not(.ep-app) #app > .qtop .bar.ep-balken > i,html.qq-an body:not(.ep-app) #app > .qtop .bar.ep-balken > i::after{animation:none!important}}`;
document.head.appendChild(c); })();

/* Reiter «Frage» weiss (Dejans Wunsch); gewählt: violetter Schein und violette Schrift */
(function(){ const c = document.createElement("style"); c.id = "ep-frage-reiter-weiss";
c.textContent = `html body #app .card .tabs .tabbtn[data-tab="frage"][aria-selected="true"]{color:#5B2BB5!important;filter:drop-shadow(0 0 7px rgba(138,63,224,.55)) drop-shadow(0 4px 6px rgba(20,20,60,.18))!important}`;
document.head.appendChild(c); })();

/* ===== Wochen-Challenge: Dejans Grafiken. Box «Das Wichtigste» im weissen Rahmen (frage-box.webp), Trainieren/Test als
   Wellen-Boxen blau/lila mit Bildsymbolen und goldenem Knopf, «Die nächsten Wochen» auf box-wochen.webp (Neun-Teile-Bilder) ===== */
(function(){ if(document.getElementById("ep-woche-boxen-css")) return;
const c = document.createElement("style"); c.id = "ep-woche-boxen-css"; const G = "img/grafik/";
c.textContent = `
html body #app .wk2 .wk2-box.wk2-box{background:none!important;box-shadow:none!important;border:0 solid transparent!important;border-radius:0!important;overflow:visible!important;
  border-image:url("${G}frage-box.webp?v=1") 210 250 215 240 fill / 52px 62px 54px 60px stretch!important;filter:drop-shadow(0 16px 26px rgba(30,40,120,.22));padding:20px 26px 24px!important}
html body #app .wk2 .wk2-box::before{display:none!important}
html body #app .wk2 .wk2-buch{background:none!important;box-shadow:none!important;width:64px;height:64px}
html body #app .wk2 .wk2-buch img,html body #app .wk2 .wk2-kic img{width:100%;height:100%;object-fit:contain;display:block;-webkit-user-drag:none}
html body #app .wk2 .wk2-k.wk2-k{background:none!important;box-shadow:none!important;border:0 solid transparent!important;border-radius:0!important;
  border-image:url("${G}box-blau.webp?v=3") 64 fill / 34px stretch!important;filter:drop-shadow(0 12px 18px rgba(20,40,120,.28));padding:14px 18px 18px!important}
html body #app .wk2 .wk2-k.wk2-test{border-image-source:url("${G}box-lila.webp?v=3")!important;filter:drop-shadow(0 12px 18px rgba(110,30,150,.3))}
html body #app .wk2 .wk2-k:disabled{filter:grayscale(.5) drop-shadow(0 8px 12px rgba(0,0,0,.2))}
html body #app .wk2 .wk2-kic{background:none!important;box-shadow:none!important;transform:none!important;width:78px;height:78px}
html body #app .wk2 .wk2-los{background:none!important;box-shadow:none!important;border:0 solid transparent;border-width:15px 26px;border-radius:0!important;padding:0 4px!important;
  border-image:url("${G}knopf-gold.webp?v=1") 52 87 fill / 15px 26px stretch;height:52px;box-sizing:border-box;display:inline-flex;align-items:center;color:#3A1C00!important;font:700 1.05rem Fredoka,Lexend,sans-serif!important}
html body #app .wk2 .wk2-plan.wk2-plan{background:none!important;box-shadow:none!important;border:0 solid transparent!important;border-radius:0!important;
  border-image:url("${G}box-wochen.webp?v=1") 70 fill / 32px stretch!important;filter:drop-shadow(0 12px 20px rgba(60,30,160,.3));padding:14px 18px 16px!important}
html body #app .wk2 .wk2-plan::before,html body #app .wk2 .wk2-plan::after{display:none!important}
html body #app .wk2 .wk2-pk{background:rgba(255,255,255,.16)!important;border:1px solid rgba(255,255,255,.28)!important}
@media (max-width:860px){
  html body #app .wk2 .wk2-box.wk2-box{border-image-width:40px 46px 42px 44px!important;padding:12px 14px 16px!important}
  html body #app .wk2 .wk2-k.wk2-k{border-image-width:26px!important;padding:10px 10px 12px!important}
  html body #app .wk2 .wk2-kic{width:56px;height:56px}
  html body #app .wk2 .wk2-buch{width:52px;height:52px}
  html body #app .wk2 .wk2-los{height:46px;border-width:13px 22px;border-image-width:13px 22px;font-size:.98rem!important}
  html body #app .wk2 .wk2-plan.wk2-plan{border-image-width:24px!important;padding:10px 12px 12px!important}
}`;
document.head.appendChild(c); })();

/* ===== Entdecken: Dejans Glanz-Kacheln (img/grafik/entdecken/kachel-01..18.webp, Kopf kopf.webp, Neun-Teile-Bilder) ===== */
(function(){ if(document.getElementById("ep-entdecken-kacheln-css")) return;
const c = document.createElement("style"); c.id = "ep-entdecken-kacheln-css"; const G = "img/grafik/entdecken/";
const K = {regionen:11, wiederholen:5, truhe:1, karte:11, familie:9, album:2, sprachen:16, garderobe:8, abenteuer:7, mathe:13,
  spielwelt:6, feste:4, forscher:8, sound:9, hilfen:2, eltern:15, offline:5, sprache:12};  /* Farben so gewählt, dass Dejans Welt-Symbol gut sichtbar ist */
const nr = n => String(n).padStart(2, "0");
c.textContent = `
html body #app .x-kacheln > .x-kachel.x-kachel{background:none!important;box-shadow:none!important;border:0 solid transparent!important;border-radius:0!important;
  border-width:24px!important;border-image:url("${G}kachel-01.webp?v=3") 46 fill / 24px stretch!important;padding:0 2px 2px!important;
  filter:drop-shadow(0 10px 16px rgba(30,30,90,.28));overflow:visible!important}
html body #app .x-kacheln > .x-kachel::before,html body #app .x-kacheln > .x-kachel::after{display:none!important}
${Object.entries(K).map(([id, n]) => `html body #app .x-kacheln > .x-kachel[data-xo="${id}"]{border-image-source:url("${G}kachel-${nr(n)}.webp?v=3")!important}`).join("\n")}
html body #app .x-kacheln > .x-kachel .x-badge{top:-14px!important;right:-12px!important}
html body #app .x-kacheln > .x-kachel b,html body #app .x-kacheln > .x-kachel small{color:#fff!important;text-shadow:0 1px 2px rgba(0,0,0,.55),0 0 8px rgba(0,0,0,.25)!important}
html body #app .x-kopf.x-kopf{background:none!important;box-shadow:none!important;border:0 solid transparent!important;border-radius:0!important;
  border-image:url("${G}kopf.webp?v=1") 50 fill / 30px stretch!important;filter:drop-shadow(0 12px 20px rgba(60,30,160,.3));overflow:visible!important}
html body #app .x-kopf.x-kopf::before,html body #app .x-kopf.x-kopf::after{display:none!important}
@media (max-width:700px){html body #app .x-kacheln > .x-kachel.x-kachel{border-width:18px!important;border-image-width:18px!important}
  html body #app .x-kopf.x-kopf{border-image-width:22px!important}}`;
document.head.appendChild(c); })();

/* ===== Entdecken-Unterseiten: alle Köpfe und Karten mit Dejans Glanz-Kacheln (img/grafik/entdecken/, Neun-Teile-Bilder).
   Köpfe: kopf.webp (wie .x-kopf). Wiederholte Karten wechseln reihum durch die 18 Farben, grosse Felder haben je eine feste Farbe. ===== */
(function(){ if(document.getElementById("ep-welten-kacheln-css")) return;
const c = document.createElement("style"); c.id = "ep-welten-kacheln-css"; const G = "img/grafik/entdecken/";
const W = "html body #app .xseite";
const nr = n => String(n).padStart(2, "0");
const kopf = [".xk-kopf", ".fq-kopf", ".alb-kopf", ".xa-kopf", ".xmt-kopf", ".hlf-kopf"];
/* Karten, die mehrfach vorkommen: Farbe reihum */
const reihum = [".wdh-karte", ".alb-k", ".spr-thema", ".spr-sp", ".xmt-kachel", ".xsw-kachel", ".xf-karte", ".xfo-karte", ".xfo-kat", ".xs-stueck", ".xs-fxk",
  ".hlf-k", ".xel-kpi", ".xof-karte", ".xui-karte", ".fq-karte", ".xel-karte"];
/* grosse Einzelfelder: feste Farbe (Nummer der Kachel) */
const fest = {".xt-karte":12, ".xt-buehne":10, ".xk-panel":4, ".spr-wdh":15, ".xa-karte":9, ".xf-held":5, ".xf-saison":12, ".xfo-held":13,
  ".xs-karte":14, ".xel-box":16, ".xof-speicher":17, ".xui-box":18, ".fq-fair":15, ".fq-info":16};
const basis = `background:none!important;background-color:transparent!important;box-shadow:none!important;border:0 solid transparent!important;border-radius:0!important;
  border-width:22px!important;border-image:url("${G}kachel-01.webp?v=3") 46 fill / 22px stretch!important;filter:drop-shadow(0 8px 14px rgba(30,30,90,.25));overflow:visible!important;color:#fff!important;box-sizing:border-box!important;min-width:0!important;max-width:100%!important`;
let css = `${kopf.map(k => `${W} ${k}.${k.slice(1)}`).join(",")}{background:none!important;box-shadow:none!important;border:0 solid transparent!important;border-radius:0!important;
  border-image:url("${G}kopf.webp?v=1") 50 fill / 30px stretch!important;filter:drop-shadow(0 12px 20px rgba(60,30,160,.3));overflow:visible!important}
${kopf.map(k => `${W} ${k}::before,${W} ${k}::after`).join(",")}{display:none!important}
${[...reihum, ...Object.keys(fest)].map(k => `${W} ${k}${k}`).join(",")}{${basis}}
${[...reihum, ...Object.keys(fest)].map(k => `${W} ${k}::before,${W} ${k}::after`).join(",")}{opacity:0!important}
${[...reihum, ...Object.keys(fest)].map(k => `${W} ${k} :is(b,h2,h3,strong,small,p,span)`).join(",")}{text-shadow:0 1px 2px rgba(0,0,0,.45)}\n`;
const FOLGE = [1,2,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18];   /* ohne 3 (gelb): weisse Schrift schlecht lesbar */
for(const k of reihum) FOLGE.forEach((n, i) => { css += `${W} ${k}:nth-child(${FOLGE.length}n+${i + 1}){border-image-source:url("${G}kachel-${nr(n)}.webp?v=3")!important}\n`; });
css += `${[...reihum, ...Object.keys(fest)].map(k => `${W} ${k} :is(small,p):not(button *):not(button)`).join(",")}{color:rgba(255,255,255,.93)!important}\n`;
for(const [k, n] of Object.entries(fest)) css += `${W} ${k}${k}{border-image-source:url("${G}kachel-${nr(n)}.webp?v=3")!important}\n`;
css += `@media (max-width:700px){${[...reihum, ...Object.keys(fest)].map(k => `${W} ${k}${k}`).join(",")}{border-width:16px!important;border-image-width:16px!important}
  ${kopf.map(k => `${W} ${k}.${k.slice(1)}`).join(",")}{border-image-width:22px!important}}`;
c.textContent = css; document.head.appendChild(c); })();

/* ===== Entdecken: Dejans Welt-Symbole (img/grafik/welten/<id>.webp) statt Emoji, auf den Kacheln und im Kopf jeder Welt ===== */
(function(){
const IDS = ["wiederholen","truhe","karte","familie","album","sprachen","abenteuer","mathe","spielwelt","feste","forscher","sound","hilfen","eltern","offline","sprache"];
const bild = id => `<img class="ep-welt-ic" src="img/grafik/welten/${id}.webp?v=2" alt="" draggable="false">`;
const EMO = /^\s*\p{Extended_Pictographic}[️‍\p{Extended_Pictographic}]*\s*$/u;
function setzen(){
  try{
    const app = document.getElementById("app"); if(!app) return;
    app.querySelectorAll(".x-kacheln > .x-kachel[data-xo]").forEach(k => {
      const id = k.dataset.xo, e = k.querySelector(".x-emo"); if(!e || !IDS.includes(id) || e.querySelector(".ep-welt-ic")) return;
      e.innerHTML = bild(id); e.classList.add("ep-welt-hat"); });
    const s = app.querySelector(".xseite[data-xwelt]"); if(!s) return;
    const id = s.dataset.xwelt; if(!IDS.includes(id)) return;
    const kopf = s.querySelector(".x-kopf, .xk-kopf, .fq-kopf, .alb-kopf, .xa-kopf, .xmt-kopf, .hlf-kopf"); if(!kopf || kopf.querySelector(".ep-welt-ic")) return;
    const span = [...kopf.querySelectorAll("span, div, i, b")].find(x => !x.children.length && EMO.test(x.textContent || ""));
    if(span){ span.innerHTML = bild(id); span.classList.add("ep-welt-hat"); }
    else if(id === "abenteuer" || id === "hilfen"){
      const h1 = kopf.querySelector("h1"); if(h1){ const sp = document.createElement("span"); sp.className = "ep-welt-hat ep-welt-vor"; sp.setAttribute("aria-hidden", "true"); sp.innerHTML = bild(id);
        h1.style.display = "flex"; h1.style.alignItems = "center"; h1.style.gap = "12px"; h1.prepend(sp); } }
  }catch(e){}
}
const app = document.getElementById("app");
if(app) new MutationObserver(() => requestAnimationFrame(setzen)).observe(app, {childList:true, subtree:true});
const c = document.createElement("style"); c.id = "ep-welt-ic-css";
c.textContent = `html body #app .ep-welt-hat{background:none!important;box-shadow:none!important;border:0!important;font-size:0!important;line-height:0!important;display:inline-grid;place-items:center}
html body #app .ep-welt-hat > img.ep-welt-ic{position:static!important;inset:auto!important;transform:none!important;margin:0!important;max-height:none!important;opacity:1!important;visibility:visible!important}
html body #app .ep-welt-ic{width:64px;height:64px;object-fit:contain;display:block;filter:drop-shadow(0 4px 6px rgba(0,0,0,.25));-webkit-user-drag:none;user-select:none}
html body #app .x-kacheln .ep-welt-hat{width:auto!important;height:auto!important;min-width:0!important}
html body #app .x-kacheln .ep-welt-ic{width:58px;height:58px;filter:drop-shadow(0 0 5px rgba(255,255,255,.75)) drop-shadow(0 3px 4px rgba(0,0,0,.3))}
html body #app .ep-welt-hat{width:auto!important;height:auto!important;transform:none!important}
html body #app :is(.x-kopf,.xk-kopf,.fq-kopf,.alb-kopf,.xa-kopf,.xmt-kopf,.hlf-kopf) .ep-welt-hat{width:76px!important;height:76px!important;min-width:76px!important;flex:none!important;overflow:visible!important}
@media (max-width:700px){html body #app :is(.x-kopf,.xk-kopf,.fq-kopf,.alb-kopf,.xa-kopf,.xmt-kopf,.hlf-kopf) .ep-welt-hat{width:58px!important;height:58px!important;min-width:58px!important}}
html body #app .ep-welt-vor{width:56px!important;height:56px!important;min-width:56px!important}
html body #app .ep-welt-vor .ep-welt-ic{width:56px!important;height:56px!important}
html body #app .x-kopf .ep-welt-ic,html body #app .xk-kopf .ep-welt-ic,html body #app .fq-kopf .ep-welt-ic,html body #app .xmt-kopf .ep-welt-ic{width:72px;height:72px}
@media (max-width:700px){html body #app .ep-welt-ic,html body #app .x-kacheln .ep-welt-ic{width:46px;height:46px}
  html body #app .x-kopf .ep-welt-ic,html body #app .xk-kopf .ep-welt-ic,html body #app .fq-kopf .ep-welt-ic,html body #app .xmt-kopf .ep-welt-ic{width:56px;height:56px}}`;
document.head.appendChild(c);
})();

/* ===== Entdecken: Dejans Symbole in den Welten (Sprachen, Mathe, Spielwelt, Feste, Forscher, Musik) =====
   window.EP_GI(ordner, id, emoji) gibt ein Bild aus img/grafik/<ordner>/<id>.webp zurück, sonst das Emoji. */
(function(){
  const L = {sprachen:"begruessung berufe essen familie farben freizeit gefuehle haus kleider koerper natur schule stadt tiere verben wetter zahlen zeit",mathe:"bild br dez emm entdecken gl kopf mass paare pm proz reihe schr text zeit",feste:"advent alpabzug auffahrt augustfeier dreikoenig fasnacht-bs fasnacht-lu knabenschiessen martini muttertag neujahr ostern pfingsten raebeliechtli samichlaus sechselaeuten silvester weihnachten zibelemaerit",forscher:"ameisen atemwolke bahnhof barfuss baum bechertelefon blaetter blinderfleck blumen bronze brunnen buchstaben dauer echo eisbecher eiswuerfel farbenjagd fruehlingsboten fuehlsack geraeusche gewitter glasregenbogen gleichgewicht gluehwuermchen gold hausnummern herbstfruechte insekten jahreszeit kastanien kirchturm knospen kresse laub messen monat moos morgenkonzert natur nebel ort papierflieger pfeffer puls pupille recycling regenbogenjagd regenmesser riechen schatten schilder schmecken schnecken schneeflocken schneehoehe schneespuren schwimmen silber sinne sommerwiese spielplatz spinnennetz steine strassennamen tab-auftraege tab-tagebuch tau temperaturtagebuch thermometer tropfenrennen verkehr voegel vorhersage waegen waldboden wappen wasserwanderung wetter wind windrad wolkenarten wolkentiere zugvoegel zuhause",sound:"abenteuer bibliothek countdown duell duellstart falsch fanfare fehler fest freischalten klick levelup live qeels quiz richtig sammeln sonnenschein start tick truhe wisch xp zauberlaterne",diverse:"abzeichen baer bauklotz baum berg brief buch buecher croissant doktorhut download drucker familie festkalender frage fruehling funkeln geteilt gluehbirne haken handschlag handy herbst kaffee karten keimling konfetti kontrast kopfhoerer landkarte lautsprecher link lupe lupe-stern muskel nochmals notizbuch offline paket palette play puzzle rakete ruhe sanduhr schildkroete schloss schrift sommer speicher sprechblase stern stumm teilen waage winter wolke-download wuerfel ziel"}, S = {};
  Object.keys(L).forEach(k => S[k] = new Set(L[k].split(" ")));
  window.EP_GI = (d, id, emo) => (S[d] && S[d].has(id)) ? `<img class="ep-gi" src="img/grafik/${d}/${id}.webp?v=2" alt="" draggable="false">` : emo;
  const css = document.createElement("style");
  css.textContent = `img.ep-gi{display:inline-block;width:1.45em;height:1.45em;object-fit:contain;vertical-align:middle;filter:drop-shadow(0 2px 3px rgba(0,0,0,.25));pointer-events:none;-webkit-user-drag:none}
.spr-thema .spr-th-emo,.xmt-kachel .xmt-emo,.xsw-kachel .xsw-k-emo,.xf-karte .xf-k-emo,.xfo-karte .xfo-k-emo,.xs-stueck .xs-emo{line-height:1}
.x-kopf-emo img.ep-gi{width:1.6em;height:1.6em}
.xs-fxk img.ep-gi{width:1.6em;height:1.6em;display:block;margin:0 auto 4px}
.xf-ab img.ep-gi{width:1.7em;height:1.7em}`;
  document.head.appendChild(css);
})();

/* ===== Schweizer Karte: helle Kartenfläche, Symbol neben dem Titel, «angefangen» dezent ===== */
(function(){
  const css = document.createElement("style");
  css.textContent = `
html body .xk-kopf h1{display:flex;align-items:center;gap:14px}
html body .xk-kopf h1 > .ep-welt-hat{flex:none;line-height:0}
html body .xk-karte{background:linear-gradient(180deg,#FFFFFF,#EEF4FF)!important;border:4px solid #fff!important;border-image:none!important;padding:14px!important;border-radius:28px!important;box-shadow:0 12px 28px rgba(40,60,140,.18)!important;filter:none!important}
html body .xk-karte .xk-kt{stroke:#fff;stroke-width:1.6}
html body .xk-karte .xk-kt.s0{fill:#D3DEF3;stroke:#fff}
html body .xk-karte .xk-kt.s0:hover,html body .xk-karte .xk-kt.s0.an{fill:#B9CCEE}
html body .xk-karte .xk-kt.s1{fill-opacity:.6}
html body .xk-karte .xk-legende .l1{opacity:.6}
html body .xk-karte .xk-seen path{fill:#7FC0F0;opacity:.9}
html body .xk-karte .xk-labels text{font-size:21px;fill:#1B2A55;stroke:rgba(255,255,255,.85)}
html body .xk-karte .xk-legende{color:#2A3560}
html body .xk-karte .xk-legende i{border-color:rgba(40,60,120,.35)}
html body .xk-karte .xk-legende .l0{background:#D3DEF3}
html body .xk-karte .xk-quelle{color:#4A5580;opacity:1}
html body .xk-karte .xk-laden{color:#2A3560}
html body .xk-chips .xk-chip.xk-chip{left:auto!important;top:auto!important;right:auto!important;bottom:auto!important}
html body .xk-chip.s1{background:rgba(255,255,255,.16)!important;border-color:rgba(255,255,255,.45)!important;position:relative}
html body .xk-chip.s1::after{content:"";position:absolute;right:6px;top:6px;width:8px;height:8px;border-radius:50%;background:#FFE34D;box-shadow:0 0 0 2px rgba(0,0,0,.15)}`;
  document.head.appendChild(css);
})();

/* ===== Entdecken: übrige Emoji durch Dejans Symbole ersetzen (nur in den Welten x-…) =====
   Ersetzt Emoji in Textknoten von #app. Liste E: Emoji → Bild. Jahreszeiten nur im Kasten .xf-saison. */
(function(){
  const g = (d, id) => `img/grafik/${d}/${id}.webp?v=2`, b = id => `img/qeels-icons/buecher/${id}.webp`;
  const E = {"🔒":g("diverse","schloss"), "🐻":g("diverse","baer"), "⏳":g("diverse","sanduhr"), "🏅":g("diverse","abzeichen"),
    "📅":g("diverse","festkalender"), "🗓":g("forscher","monat"), "🧭":g("forscher","tab-auftraege"), "📓":g("forscher","tab-tagebuch"),
    "⏱":g("forscher","dauer"), "🥉":g("forscher","bronze"), "🥈":g("forscher","silber"), "🥇":g("forscher","gold"),
    "⬇":g("diverse","download"), "☁":g("diverse","wolke-download"), "📶":g("diverse","offline"), "💾":g("diverse","speicher"),
    "📦":g("diverse","paket"), "💡":g("diverse","gluehbirne"), "🥐":g("diverse","croissant"), "☕":g("diverse","kaffee"),
    "🔈":g("diverse","lautsprecher"), "🔊":g("diverse","lautsprecher"), "🔍":g("diverse","lupe-stern"), "🌟":g("diverse","lupe-stern"),
    "🌱":g("diverse","keimling"), "🚀":g("diverse","rakete"), "🎓":g("diverse","doktorhut"), "🎲":g("diverse","wuerfel"), "⚖":g("diverse","waage"),
    "🔁":g("diverse","nochmals"), "🔄":g("diverse","nochmals"), "🤝":g("diverse","handschlag"), "🏔":g("diverse","berg"), "▶":g("diverse","play"), "📚":g("diverse","buecher"),
    "🎉":g("diverse","konfetti"), "✨":g("diverse","funkeln"), "⭐":g("diverse","stern"), "🌳":g("diverse","baum"), "🔎":g("diverse","lupe"), "🃏":g("diverse","karten"),
    "🧩":g("diverse","puzzle"), "🎧":g("diverse","kopfhoerer"), "🔤":g("diverse","bauklotz"), "🐢":g("diverse","schildkroete"), "🔠":g("diverse","schrift"),
    "🌗":g("diverse","kontrast"), "🍃":g("diverse","ruhe"), "🔇":g("diverse","stumm"), "❓":g("diverse","frage"), "✅":g("diverse","haken"), "🎯":g("diverse","ziel"),
    "💪":g("diverse","muskel"), "🗺":g("diverse","landkarte"), "📒":g("diverse","notizbuch"), "🎨":g("diverse","palette"), "➗":g("diverse","geteilt"),
    "💬":g("diverse","sprechblase"), "📖":g("diverse","buch"), "📤":g("diverse","teilen"), "🔗":g("diverse","link"), "✉":g("diverse","brief"),
    "🖨":g("diverse","drucker"), "📱":g("diverse","handy"), "👪":g("diverse","familie"),
    "🔥":g("diverse","flamme"), "🏆":g("diverse","pokal"), "⚡":g("diverse","blitz"), "🎮":g("diverse","controller"), "⚙":g("diverse","zahnrad"),
    "🌐":g("diverse","online"), "📋":g("diverse","klemmbrett"), "📜":g("diverse","rolle"), "🗣":g("diverse","sprechen"), "🦊":g("diverse","fuchs"),
    "🦉":g("diverse","eule"), "🪴":g("diverse","pflanze"), "🧸":g("diverse","teddy"), "🐈":g("diverse","katze"), "🐱":g("diverse","katze"), "🐖":g("diverse","sparschwein"),
    "🐷":g("diverse","sparschwein"), "👉":g("diverse","zeigefinger"), "👆":g("sound","klick"), "🎁":g("sound","truhe"), "⚔":g("sound","duellstart"),
    "🏰":b("geschichte"), "🌍":b("welt"), "🌿":b("natur"), "🔬":b("wissen"), "🏛":b("schweiz"), "🗳":b("politik"), "💰":b("geld"), "🏡":b("leben"), "🚲":b("alltag")};
  const J = {"🌸":g("diverse","fruehling"), "☀":g("diverse","sommer"), "🍂":g("diverse","herbst"), "❄":g("diverse","winter")};
  const re = o => new RegExp("(" + Object.keys(o).join("|") + ")\uFE0F?", "g");
  const RE = re(E), RJ = re(J);
  const WEITERE = new Set(["home", "start", "duell", "live", "lib", "hardcore", "rangliste", "truhe", "abzeichen", "level", "register", "profil"]);
  const anSeite = () => { try{ return (/^x-/.test(S.screen) && S.screen !== "x-karte") || WEITERE.has(S.screen); }catch(e){ return false; } };
  function knoten(t){
    const p = t.parentElement; if(!p || p.closest("svg,script,style,textarea,input,select,option,[contenteditable]")) return;
    const saison = p.closest(".xf-saison, .xf-saisons");
    const txt = t.nodeValue; RE.lastIndex = 0; RJ.lastIndex = 0;
    if(!RE.test(txt) && !(saison && RJ.test(txt))) return;
    const map = saison ? Object.assign({}, E, J) : E, R = saison ? re(map) : new RegExp(RE.source, "g");
    const fr = document.createDocumentFragment(); let last = 0;
    txt.replace(R, (m, e, i) => { if(i > last) fr.appendChild(document.createTextNode(txt.slice(last, i)));
      const im = document.createElement("img"); im.className = "ep-gi ep-gi2"; im.src = map[e]; im.alt = ""; im.draggable = false; im.setAttribute("aria-hidden", "true");
      fr.appendChild(im); last = i + m.length; return m; });
    if(last < txt.length) fr.appendChild(document.createTextNode(txt.slice(last)));
    t.parentNode.replaceChild(fr, t);
  }
  function lauf(){
    const app = document.getElementById("app"); if(!app || !anSeite()) return;
    const w = document.createTreeWalker(app, NodeFilter.SHOW_TEXT), l = [];
    while(w.nextNode()) l.push(w.currentNode);
    l.forEach(knoten);
  }
  let plan = 0; const los = () => { if(!plan) plan = requestAnimationFrame(() => { plan = 0; lauf(); }); };
  const start = () => { const app = document.getElementById("app"); if(!app) return setTimeout(start, 300);
    new MutationObserver(los).observe(app, {childList:true, subtree:true, characterData:true}); los(); };
  start();
  const css = document.createElement("style");
  css.textContent = `img.ep-gi2{width:1.3em;height:1.3em}`;
  document.head.appendChild(css);
})();

/* ===== Ergebnis-Seite (screen «done»): neuer Stil mit Dejans Grafiken ===== */
(function(){
  const G = "img/grafik/";
  const css = document.createElement("style");
  css.textContent = `
html body #app .card.done{background:rgba(255,255,255,.9)!important;border:4px solid #fff!important;border-radius:34px!important;box-shadow:0 18px 40px rgba(40,30,120,.22)!important;padding:18px 22px 26px!important}
html body #app .card.done .ep-done-kopf{position:relative;margin:0 0 18px;padding:22px 20px 26px;color:#fff;text-align:center;background:none;border:0 solid transparent;border-width:30px;border-image:url("${G}entdecken/kopf.webp") 50 fill / 30px stretch;filter:drop-shadow(0 10px 18px rgba(80,30,160,.3))}
html body #app .card.done .ep-done-kopf > *{position:relative}
html body #app .card.done .ep-done-kopf h1{color:#fff!important;text-shadow:0 3px 0 rgba(40,10,90,.35),0 6px 14px rgba(40,10,90,.35);margin:6px 0 10px!important}
html body #app .card.done .ep-done-kopf p{color:#fff!important;opacity:.96;text-shadow:0 1px 3px rgba(30,10,80,.45)}
html body #app .card.done .ep-done-kopf .stars svg{width:62px;height:62px;filter:drop-shadow(0 4px 6px rgba(40,10,90,.35))}
html body #app .card.done .ep-done-kopf .modebadge{background:rgba(255,255,255,.95);color:#4A2B9A}
html body #app .card.done .row{gap:12px;justify-content:center;flex-wrap:wrap}
html body #app .card.done .row .big{all:unset;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;gap:8px;height:58px;padding:0 10px;cursor:pointer;min-width:170px;
  border:0 solid transparent;border-width:17px 29px;border-image:url("${G}knopf-zurueck.webp?v=1") 70 118 fill / 17px 29px stretch;color:#28304A;font:800 1.05rem Lexend,system-ui,sans-serif;filter:drop-shadow(0 4px 6px rgba(40,30,120,.2))}
html body #app .card.done .row #again{border-image:url("${G}knopf-gold.webp?v=1") 52 87 fill / 17px 29px stretch;color:#3A1C00;font:700 1.2rem Fredoka,Lexend,system-ui,sans-serif;min-width:220px}
html body #app .card.done .row .big:hover{filter:brightness(1.06) drop-shadow(0 6px 8px rgba(40,30,120,.25))}
html body #app .card.done .row .big:focus-visible{outline:3px solid #7B3FE4;outline-offset:3px}
html body #app .card.done .row .big svg{width:22px;height:22px}
html body #app .card.done .summary h2{color:#2A1F5C}
html body #app .card.done .pill{padding:7px 16px;font-size:1rem;box-shadow:0 3px 0 rgba(0,0,0,.08)}
html body #app .card.done .pill.ok{background:linear-gradient(135deg,#2DD48F,#13A57A);color:#fff}
html body #app .card.done .pill.bad{background:linear-gradient(135deg,#FF6B6B,#E0344F);color:#fff}
html body #app .card.done img.ep-rv-ic{width:24px;height:24px;object-fit:contain;flex:none;vertical-align:-6px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.2))}
html body #app .card.done .revm img.ep-rv-ic{width:20px;height:20px;vertical-align:-4px}
html body #app .card.done .review{display:grid;gap:12px}
html body #app .card.done .rev{border:0!important;border-radius:22px!important;padding:14px 18px 14px 20px!important;background:#fff!important;box-shadow:0 6px 16px rgba(40,30,120,.12);position:relative;overflow:hidden}
html body #app .card.done .rev::before{content:"";position:absolute;left:0;top:0;bottom:0;width:7px;background:linear-gradient(180deg,#2DD48F,#13A57A)}
html body #app .card.done .rev.r-bad::before{background:linear-gradient(180deg,#FF6B6B,#E0344F)}
html body #app .card.done .revhead{align-items:center}
html body #app .card.done .revnr{background:linear-gradient(135deg,#7B5BFF,#4B2BD0);color:#fff}
html body #app .card.done .revm{display:block;margin-top:4px;padding:8px 12px;border-radius:14px;background:#F3F1FF;color:#4A4F72}
@media (max-width:600px){
  html body #app .card.done{padding:12px 10px 20px!important;border-radius:26px!important}
  html body #app .card.done .ep-done-kopf{border-width:22px;border-image-width:22px;padding:12px 8px 16px}
  html body #app .card.done .ep-done-kopf .stars svg{width:46px;height:46px}
  html body #app .card.done .row .big{min-width:0;flex:1 1 140px;height:52px;border-width:15px 24px;border-image-width:15px 24px;font-size:.95rem}
  html body #app .card.done .row #again{flex-basis:100%}
  html body #app .card.done .row .big{white-space:nowrap;font-size:.9rem;padding:0 2px}
  html body #app .card.done .revhead{align-items:flex-start}
}
@media (min-width:900px){
  html body #app .card.done .ep-done-kopf{padding-left:40px;padding-right:200px}
  html body #app .card.done .ep-done-kopf::after{content:"";position:absolute;right:-6px;bottom:-26px;width:210px;height:250px;background:url("img/kids/duo-jubel.webp") center bottom/contain no-repeat;pointer-events:none}
}`;
  document.head.appendChild(css);
})();

/* ===== Weitere Seiten im neuen Stil (Duell, Live, Spielmodi, Bibliothek, Suche, Meine Tests, Rangliste, Hardcore,
   Anmelden/Konto, Profil verzieren, Tagesquiz-Chat, Hinweisseiten). Seite steht in html[data-scr]. ===== */
(function(){
  const setz = () => { try{ document.documentElement.dataset.scr = S.screen || ""; }catch(e){} };
  const start = () => { const app = document.getElementById("app"); if(!app) return setTimeout(start, 300);
    new MutationObserver(setz).observe(app, {childList:true}); setz(); };
  start();
  const G = "img/grafik/", E = G + "entdecken/";
  const SCR = ["duell","duelllobby","duellannahme","duellende","duellresultat","live","livequiz","livehost","lib","bibliothek","suche","meinetests",
    "board","spieler","hardcore","hardcoreinfo","hcboard","register","login","konto","spielmodi","x-garderobe","resinfo","chat","fremdtest","fremddone","historie","profil"];
  const S1 = sel => SCR.map(s => `html[data-scr="${s}"] body #app ${sel}`).join(",");
  const kopf = [".dukopf", ".rlkopf", ".pagehead.st-kopf", "section.st-kopf", ".pp-kopf", ".libhero"];
  const kacheln = [".du2-m", ".smkarte", ".kwkarte", ".c2-o"];
  const fest = {".du2-team":6};
  const glas = [".card.lwait", ".dulobby", ".hcregeln", ".authbox", ".statcard", ".rlliste", ".hckarte", ".card.hcregeln"];
  const FOLGE = [7, 9, 2, 8, 12, 15, 5, 13];
  const nr = n => String(n).padStart(2, "0");
  let css = `
${kopf.map(k => S1(k)).join(",")}{background:none!important;box-shadow:none!important;border:0 solid transparent!important;border-width:30px!important;border-radius:0!important;
  border-image:url("${E}kopf.webp?v=1") 50 fill / 30px stretch!important;filter:drop-shadow(0 12px 20px rgba(60,30,160,.3));overflow:visible!important;color:#fff!important;box-sizing:border-box!important}
${kopf.map(k => S1(k + "::before")).join(",")}{opacity:0!important}
${kopf.map(k => S1(k + " :is(h1,h2,p,b,span,small)")).join(",")}{text-shadow:0 2px 4px rgba(30,10,80,.4)}
${kacheln.map(k => S1(k)).join(",")},${Object.keys(fest).map(k => S1(k)).join(",")}{background:none!important;background-color:transparent!important;box-shadow:none!important;border:0 solid transparent!important;border-radius:0!important;
  border-width:22px!important;border-image:url("${E}kachel-07.webp?v=3") 46 fill / 22px stretch!important;filter:drop-shadow(0 8px 14px rgba(30,30,90,.25));color:#fff!important;box-sizing:border-box!important;min-width:0!important;max-width:100%!important}
${kacheln.map(k => S1(k + "::before") + "," + S1(k + "::after")).join(",")}{opacity:0!important}
${kacheln.map(k => S1(k + " :is(b,h2,h3,strong,small,p,span)")).join(",")}{text-shadow:0 1px 2px rgba(0,0,0,.45);color:#fff}
${glas.map(k => S1(k)).join(",")}{background:rgba(255,255,255,.93)!important;border:4px solid #fff!important;border-radius:30px!important;box-shadow:0 16px 36px rgba(40,30,120,.2)!important}
${S1(".big.gold")}{all:unset;box-sizing:border-box!important;display:inline-flex!important;align-items:center;justify-content:center;gap:8px;height:58px!important;min-width:180px;padding:0 10px!important;cursor:pointer;
  border:0 solid transparent!important;border-width:17px 29px!important;border-image:url("${G}knopf-gold.webp?v=1") 52 87 fill / 17px 29px stretch!important;color:#3A1C00!important;font:700 1.15rem Fredoka,Lexend,system-ui,sans-serif!important;filter:drop-shadow(0 4px 6px rgba(120,70,0,.25))}
${S1(".big.alt")}{all:unset;box-sizing:border-box!important;display:inline-flex!important;align-items:center;justify-content:center;gap:8px;height:58px!important;min-width:150px;padding:0 10px!important;cursor:pointer;
  border:0 solid transparent!important;border-width:17px 29px!important;border-image:url("${G}knopf-zurueck.webp?v=1") 70 118 fill / 17px 29px stretch!important;color:#28304A!important;font:800 1rem Lexend,system-ui,sans-serif!important;filter:drop-shadow(0 4px 6px rgba(40,30,120,.2))}
${S1(".big.gold:focus-visible")},${S1(".big.alt:focus-visible")}{outline:3px solid #7B3FE4;outline-offset:3px}
${S1(".du2-m .los")},${S1(".du2-m .tag")}{color:#3A1C00!important;text-shadow:none!important}
${S1(".du2-m .tx")}{flex:1 1 auto;min-width:0}
@media (max-width:600px){${S1(".du2-m .los")}{font-size:.78rem!important;padding:6px 9px!important;white-space:nowrap}${S1(".du2-m .tx small")}{font-size:.74rem!important}}
${S1(".kwkarte .kwlos")}{color:#3A2A8A!important;text-shadow:none!important}
${S1(".libhero :is(h1,h2,p)")},${S1(".pp-kopf :is(h1,h2,p)")}{color:#fff!important}
html body #app .xa-sname{white-space:normal!important;text-overflow:clip!important;overflow:visible!important;font-size:.76rem!important;line-height:1.1;text-align:center;padding:2px 6px!important}
html[data-scr="live"] body #app .mode{background:none!important;box-shadow:none!important;border:0 solid transparent!important;border-width:22px!important;border-radius:0!important;border-image:url("${E}kachel-07.webp?v=3") 46 fill / 22px stretch!important;filter:drop-shadow(0 8px 14px rgba(30,30,90,.25));box-sizing:border-box}
html[data-scr="live"] body #app .mode + .mode{border-image-source:url("${E}kachel-08.webp?v=3")!important}
`;
  for(const k of kacheln) FOLGE.forEach((n, i) => { css += `${S1(k + `:nth-of-type(${FOLGE.length}n+${i + 1})`)}{border-image-source:url("${E}kachel-${nr(n)}.webp?v=3")!important}\n`; });
  for(const [k, n] of Object.entries(fest)) css += `${S1(k)}{border-image-source:url("${E}kachel-${nr(n)}.webp?v=3")!important}\n`;
  css += `@media (max-width:700px){${kacheln.map(k => S1(k)).join(",")},${S1(".du2-team")}{border-width:16px!important;border-image-width:16px!important}
  ${kopf.map(k => S1(k)).join(",")}{border-width:22px!important;border-image-width:22px!important}
  ${S1(".big.gold")},${S1(".big.alt")}{height:52px!important;min-width:0;border-width:15px 24px!important;border-image-width:15px 24px!important;font-size:.95rem!important}}`;
  const c = document.createElement("style"); c.id = "ep-weitere-seiten-css"; c.textContent = css; document.head.appendChild(c);
})();

/* ===== Spielwelt-Spiele (Bild-Rätsel, Reihenfolge, Zuordnen, Zeitstrahl) im neuen Stil ===== */
(function(){
  const E = "img/grafik/entdecken/", G = "img/grafik/", P = "html body #app .xsw-spiel";
  const css = document.createElement("style");
  css.textContent = `
${P} .xsw-leiste{background:none!important;box-shadow:none!important;border:0 solid transparent!important;border-width:20px 24px!important;border-radius:0!important;
  border-image:url("${E}kopf.webp?v=1") 50 fill / 20px 24px stretch!important;filter:drop-shadow(0 8px 14px rgba(60,30,160,.3));padding:0 4px 4px 0!important;min-height:0}
${P} .xsw-titel{text-shadow:0 2px 4px rgba(30,10,80,.45);font-size:1.15rem}
${P} .xsw-zur{background:#fff!important;color:#4A2B9A!important;box-shadow:0 3px 0 rgba(40,20,100,.25)}
${P} .xsw-pille{background:rgba(255,255,255,.94)!important;color:#2A1F5C!important;border:3px solid #fff;border-radius:22px!important;font-weight:800;box-shadow:0 8px 18px rgba(40,30,120,.18)}
${P} .xsw-rahmen{background:rgba(255,255,255,.9)!important;border:5px solid #fff;border-radius:28px!important;box-shadow:0 14px 30px rgba(40,30,120,.22)!important}
${P} .xsw-nachweis{background:rgba(255,255,255,.85)!important;color:#3A3F66!important}
${P} .xsw-nachweis a{color:#4A2B9A!important}
${P} .xsw-optionen{gap:12px!important}
${P} .xsw-opt{--ah:62px;--ab:url("img/qeels-antwort-a.webp");min-height:var(--ah)!important;background:none!important;box-shadow:none!important;border-radius:0!important;
  border:0 solid transparent!important;border-width:calc(var(--ah)*.3) calc(var(--ah)*.5)!important;border-image:var(--ab) 48 80 fill / calc(var(--ah)*.3) calc(var(--ah)*.5) stretch!important;
  padding:0 4px!important;color:#fff!important;text-shadow:0 1px 3px rgba(0,0,0,.45);font-size:1.05rem!important;filter:drop-shadow(0 5px 10px rgba(0,0,0,.25));transition:transform .12s,filter .12s;box-sizing:border-box}
${P} .xsw-opt:nth-child(4n+2){--ab:url("img/qeels-antwort-b.webp")}
${P} .xsw-opt:nth-child(4n+3){--ab:url("img/qeels-antwort-c.webp")}
${P} .xsw-opt:nth-child(4n+4){--ab:url("img/qeels-antwort-d.webp")}
${P} .xsw-opt:hover:not([disabled]){filter:brightness(1.08) drop-shadow(0 8px 14px rgba(0,0,0,.3));transform:translateY(-2px)}
${P} .xsw-opt[disabled]:not(.richtig):not(.falsch){opacity:1;filter:grayscale(.7) brightness(.9) drop-shadow(0 3px 6px rgba(0,0,0,.2))}
${P} .xsw-rueck{background:rgba(255,255,255,.95)!important;color:#2A1F5C!important;border:3px solid #fff;border-left:8px solid #E0344F!important;border-radius:22px!important;box-shadow:0 10px 22px rgba(40,30,120,.2)!important}
${P} .xsw-rueck.gut{border-left-color:#13A57A!important}
${P} .xsw-rueck small{color:#5A5F86!important}
${P} .xsw-opt.richtig{opacity:1!important;filter:drop-shadow(0 0 12px rgba(59,255,142,.8))!important}
${P} .xsw-opt.falsch{opacity:1!important;filter:drop-shadow(0 0 12px rgba(255,59,59,.75))!important}
${P} .xsw-knopf:not(.xsw-hell){all:unset;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;height:56px;padding:0 8px;cursor:pointer;
  border:0 solid transparent;border-width:16px 28px;border-image:url("${G}knopf-gold.webp?v=1") 52 87 fill / 16px 28px stretch;color:#3A1C00;font:700 1.1rem Fredoka,Lexend,system-ui,sans-serif;filter:drop-shadow(0 4px 6px rgba(120,70,0,.25))}
${P} .xsw-knopf.xsw-hell{all:unset;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;height:56px;padding:0 8px;cursor:pointer;
  border:0 solid transparent;border-width:16px 28px;border-image:url("${G}knopf-zurueck.webp?v=1") 70 118 fill / 16px 28px stretch;color:#28304A;font:800 1rem Lexend,system-ui,sans-serif;filter:drop-shadow(0 4px 6px rgba(40,30,120,.2))}
${P} .xsw-knopf:focus-visible,${P} .xsw-opt:focus-visible{outline:3px solid #FFE34D;outline-offset:3px}
@media (max-width:600px){${P} .xsw-opt{--ah:54px;font-size:.95rem!important}${P} .xsw-leiste{border-width:16px 18px!important;border-image-width:16px 18px!important}}`;
  document.head.appendChild(css);
})();

/* ===== Computer: Hauptmenü-Leiste oben (statt Brotkrumen) und Zurück-Knopf mit Ziel =====
   Leiste #ep-hnav nach .topbar, aktive Rubrik je nach S.screen. Brotkrumen (.crumbs) am Computer ausgeblendet,
   stattdessen .ep-zur «‹ <vorherige Seite>» (Ziel aus S._crumbs, Name aus den versteckten Krumen). Nicht in der App-Ansicht. ===== */
(function(){
  const app = () => document.body.classList.contains("ep-app");
  const PUNKTE = [
    {id:"start",  t:"Start",      i:"img/grafik/ic-house.webp", go:() => go("home")},
    {id:"themen", t:"Themen",     i:"img/grafik/diverse/buecher.webp?v=2", go:() => { try{ window.EP_NP_WAHL && window.EP_NP_WAHL(); }catch(e){} go("home"); }},
    {id:"duell",  t:"Duell",      i:"img/qeels-icons/themen/duell.webp", go:() => go("duell")},
    {id:"entd",   t:"Entdecken",  i:"img/grafik/mathe/entdecken.webp?v=2", go:() => go("x-entdecken")},
    {id:"lib",    t:"Bibliothek", i:"img/app2/ic-buch.webp", go:() => go("lib")},
    {id:"profil", t:"Profil",     i:"", go:() => go("profil")}
  ];
  const aktiv = sc => {
    if(sc === "home") return (document.querySelector(".np-wahl") ? "themen" : "start");
    if(["bereich","submenu","geschmenu","chmenu","berufmenu","mode","quiz","done","epwoche","chat","spielmodi","live","livequiz","livehost","liveplay","hardcore","hardcoreinfo"].includes(sc)) return "themen";
    if(/^duell/.test(sc)) return "duell";
    if(["x-garderobe"].includes(sc)) return "profil";
    if(/^x-/.test(sc)) return "entd";
    if(/^lib/.test(sc) || ["bibliothek","suche"].includes(sc)) return "lib";
    if(["profil","register","login","konto","historie","board","spieler","meinetests","hcboard"].includes(sc)) return "profil";
    return "";
  };
  function profilBild(){ try{ return avatar((S.profil && S.profil.avatar) || "fuchs"); }catch(e){ return ""; } }
  function bauen(){
    if(app()){ const n = document.getElementById("ep-hnav"); if(n) n.remove(); return; }
    const top = document.querySelector(".wrap > .topbar"); if(!top) return;
    let n = document.getElementById("ep-hnav");
    if(!n){
      n = document.createElement("nav"); n.id = "ep-hnav"; n.setAttribute("aria-label", "Hauptmenü");
      n.innerHTML = PUNKTE.map(p => `<button type="button" data-hn="${p.id}"><span class="hn-ic">${p.i ? `<img src="${p.i}" alt="" draggable="false">` : ""}</span><span class="hn-t">${p.t}</span></button>`).join("");
      n.addEventListener("click", e => { const b = e.target.closest("[data-hn]"); if(!b) return; const p = PUNKTE.find(x => x.id === b.dataset.hn);
        if(S.screen === "quiz" && S.quiz && S.quiz.mode === "test" && !S.quiz.flushed && !confirm("Test abbrechen? Er wird nicht gewertet.")) return;
        try{ p.go(); scrollTo(0, 0); }catch(x){} });
      top.insertAdjacentElement("afterend", n);
    }
    const pi = n.querySelector('[data-hn="profil"] .hn-ic'); const pb = profilBild(); if(pi && pi.dataset.av !== pb){ pi.innerHTML = pb; pi.dataset.av = pb; }
    let a = ""; try{ a = aktiv(S.screen); }catch(e){}
    n.querySelectorAll("[data-hn]").forEach(b => { const an = b.dataset.hn === a; b.classList.toggle("an", an); if(an) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
    zurueck();
  }
  function zurueck(){
    const appEl = document.getElementById("app"); if(!appEl) return;
    const alt = appEl.querySelector(":scope > .ep-zur");
    const kr = [...appEl.querySelectorAll(".crumbs .crumb[data-ci]")];
    let sc = ""; try{ sc = S.screen; }catch(e){}
    if(kr.length < 2 || sc === "quiz"){ if(alt) alt.remove(); return; }
    const ziel = kr[kr.length - 1], name = ziel.textContent.trim();
    if(alt && alt.dataset.z === name) return; if(alt) alt.remove();
    const b = document.createElement("button"); b.type = "button"; b.className = "ep-zur"; b.dataset.z = name;
    b.innerHTML = `<img src="img/grafik/sym-zurueck.webp" alt=""><span></span>`; b.querySelector("span").textContent = name;
    b.setAttribute("aria-label", "Zurück zu " + name);
    b.onclick = () => ziel.click();
    const crumbs = appEl.querySelector(".crumbs");
    (crumbs && crumbs.parentElement === appEl ? crumbs : appEl.firstElementChild)?.insertAdjacentElement("beforebegin", b) || appEl.prepend(b);
  }
  let plan = 0; const los = () => { if(!plan) plan = requestAnimationFrame(() => { plan = 0; try{ bauen(); }catch(e){} }); };
  const start = () => { const a = document.getElementById("app"); if(!a) return setTimeout(start, 300);
    new MutationObserver(los).observe(a, {childList:true}); new MutationObserver(los).observe(document.body, {attributes:true, attributeFilter:["class"]}); los(); };
  start();
  const css = document.createElement("style"); css.id = "ep-hnav-css";
  css.textContent = `
#ep-hnav{position:relative;z-index:5;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px;width:100%;max-width:1008px;margin:6px auto 18px;padding:8px;box-sizing:border-box;
  background:linear-gradient(180deg,rgba(255,255,255,.96),rgba(240,236,255,.92));border:3px solid #fff;border-radius:30px;
  box-shadow:0 14px 30px rgba(50,30,130,.25),inset 0 -4px 0 rgba(120,90,220,.12)}
#ep-hnav button{all:unset;box-sizing:border-box;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;height:58px;padding:0 10px;border-radius:22px;
  color:#3A2F72;font:800 1.02rem Lexend,system-ui,sans-serif;transition:transform .15s,background .2s,box-shadow .2s;position:relative;white-space:nowrap}
#ep-hnav .hn-ic{flex:none;width:40px;height:40px;display:grid;place-items:center;transition:transform .2s}
#ep-hnav .hn-ic img,#ep-hnav .hn-ic svg{width:40px;height:40px;object-fit:contain;filter:drop-shadow(0 3px 4px rgba(40,20,100,.25))}
#ep-hnav .hn-ic .avimg{border-radius:50%;box-shadow:0 0 0 3px #fff,0 3px 6px rgba(40,20,100,.3)}
#ep-hnav button:hover{background:rgba(123,91,255,.12);transform:translateY(-2px)}
#ep-hnav button:hover .hn-ic{transform:scale(1.12) rotate(-4deg)}
#ep-hnav button:focus-visible{outline:3px solid #7B3FE4;outline-offset:2px}
#ep-hnav button.an{color:#fff;background:linear-gradient(135deg,#6A4BFF 0%,#A43BE0 55%,#E8409F 100%);
  box-shadow:0 6px 0 #4A23A8,0 10px 20px rgba(140,50,200,.45),inset 0 2px 0 rgba(255,255,255,.35);text-shadow:0 1px 2px rgba(40,0,80,.4);transform:translateY(-2px)}
#ep-hnav button.an .hn-ic{transform:scale(1.15)}
@media (max-width:1100px){#ep-hnav button{font-size:.9rem;gap:6px}#ep-hnav .hn-ic,#ep-hnav .hn-ic img,#ep-hnav .hn-ic svg{width:34px;height:34px}}
@media (max-width:820px){#ep-hnav .hn-t{display:none}}
body.ep-app #ep-hnav{display:none!important}
html[data-scr="home"] body:not(.ep-np-wahl) #ep-hnav{max-width:none}
body:not(.ep-app) #app .crumbs{display:none!important}
body:not(.ep-app) #app > .np-zurueck-unter{display:none!important}
body:not(.ep-app) #app > .ep-zur{all:unset;box-sizing:border-box;cursor:pointer;display:inline-flex;align-items:center;gap:8px;height:54px;margin:0 0 14px;padding:0 6px;
  border:0 solid transparent;border-width:16px 28px;border-image:url("img/grafik/knopf-zurueck.webp?v=1") 70 118 fill / 16px 28px stretch;color:#28304A;font:800 1.02rem Lexend,system-ui,sans-serif;filter:drop-shadow(0 4px 6px rgba(40,30,120,.2))}
body:not(.ep-app) #app > .ep-zur img{width:24px;height:24px;object-fit:contain}
body:not(.ep-app) #app > .ep-zur:hover{filter:brightness(1.05) drop-shadow(0 6px 8px rgba(40,30,120,.25))}
body.ep-app #app > .ep-zur{display:none!important}
@media (prefers-reduced-motion:reduce){#ep-hnav button,#ep-hnav .hn-ic{transition:none}}`;
  document.head.appendChild(css);
})();

/* ===== Dunkler Modus (data-theme="dark", abends): helle Glas-Karten behalten helle Farben und dunkle Schrift ===== */
(function(){
  const HELL = `--bg:#F3F6FF;--surface:#FFFFFF;--ink:#1B2240;--soft:#5A6385;--line:#D9E0F3;--ok:#17A35A;--bad:#D6362E;color:#1B2240`;
  const K = [".card.lwait", ".dulobby", ".hcregeln", ".authbox", ".statcard", ".rlliste", ".hckarte", ".card.done", ".xsw-pille", ".xsw-rahmen", ".xsw-rueck",
    ".xk-karte", ".c2-box", ".c2-wer", ".np-glas", ".wk2-box", ".libhero + *", ".bibthema", ".summary .rev"];
  const css = document.createElement("style"); css.id = "ep-dunkel-glas-css";
  css.textContent = `#ep-hnav,${K.map(k => `html body #app ${k}`).join(",")}{${HELL}}
html body #app :is(${K.join(",")}) :is(input,select,textarea){background:#F3F6FF!important;color:#1B2240!important;border-color:#D9E0F3!important}
html body #app :is(.authbox,.hcregeln,.card.lwait,.statcard) :is(h1,h2,h3,b,strong){color:#1B2240}
html body #app p.label small{color:#3A2F72!important;background:#fff!important;text-shadow:none!important}`;
  document.head.appendChild(css);
})();
/* Handy/iPad: Titel der Bereichsköpfe Schweiz und Alltag nicht über die Grafik */
(function(){ const c = document.createElement("style");
c.textContent = `html body.ep-app #app .st-kopf:is(.ep-kopf-geld,.ep-kopf-alltag) :is(h1,.bhead h1){max-width:56%!important;font-size:clamp(1.05rem,4.6vw,1.6rem)!important;line-height:1.1!important;text-shadow:0 2px 4px rgba(90,20,0,.55)!important}
html body.ep-app #app .st-kopf:is(.ep-kopf-geld,.ep-kopf-alltag){background-position:right center!important}`;
document.head.appendChild(c); })();

/* ===== Fortschrittsbalken in den Glanz-Kacheln: klare dunkle Spur, goldene Füllung (Sprachen, Mathe, Album, Forscher) ===== */
(function(){ const c = document.createElement("style");
const B = [".spr-balken", ".xmt-bar", ".alb-balken", ".xfo-balken"];
c.textContent = `${B.map(b => `html body #app ${b}`).join(",")}{height:10px!important;border-radius:99px!important;background:rgba(20,10,60,.35)!important;
  box-shadow:inset 0 2px 3px rgba(0,0,0,.35),0 1px 0 rgba(255,255,255,.35)!important;overflow:hidden!important;border:0!important}
${B.map(b => `html body #app ${b} > :is(i,span)`).join(",")}{display:block;height:100%!important;min-width:10px;border-radius:99px!important;
  background:linear-gradient(90deg,#FFE15A,#FFB52E)!important;box-shadow:inset 0 2px 0 rgba(255,255,255,.55)!important}
html body #app .xmt-kachel .xmt-k1 b{font-size:1.08rem!important;line-height:1.15;overflow-wrap:normal;word-break:normal}html body #app .xmt-kachel .xmt-k1{gap:8px!important;min-width:0}@media (max-width:600px){html body #app .xmt-kachel .xmt-k1 b{font-size:.86rem!important;overflow-wrap:normal;hyphens:auto}html body #app .xmt-kachel .xmt-k1 .xmt-emo{flex:none!important;width:30px!important;height:30px!important;font-size:30px!important}html body #app .xmt-kachel .xmt-k1 .xmt-emo img.ep-gi{width:30px!important;height:30px!important}html body #app .xmt-kachel .xmt-k1{gap:5px!important}}
html body #app .xmt-kachel .xmt-k1 .xmt-emo img{width:40px!important;height:40px!important}`;
document.head.appendChild(c); })();

/* ===== Entdecken-Kachel der Startseite: Dejans Welt-Symbole statt Emoji ===== */
(function(){ const c = document.createElement("style");
c.textContent = `html body #app .x-app .x-a-emo i{display:inline-grid!important;place-items:center;background:rgba(255,255,255,.95)!important;border-radius:50%!important;overflow:hidden}
html body #app .x-app .x-a-emo i img{width:78%!important;height:78%!important;max-width:78%!important;max-height:78%!important;position:static!important;object-fit:contain;display:block;margin:0!important;transform:none!important}
html body #app .x-gross .x-g-chips i img{width:1.3em;height:1.3em;object-fit:contain;vertical-align:-.3em;margin-right:2px}`;
document.head.appendChild(c); })();

/* ===== Handy/iPad: Stufenwahl kompakter, Themen-Seiten passen ohne Scrollen auf den Bildschirm ===== */
(function(){
  const c = document.createElement("style");
  c.textContent = `
html body.ep-app #app .ap-themen .ap-stufen{padding:4px!important;min-height:0!important}
html body.ep-app #app .ap-themen .ap-stufen button{padding:5px 2px!important;min-height:0!important;font-size:.82rem!important;line-height:1.1}
html body.ep-app #app .ap-themen .ap-stufen button small,html body.ep-app #app .ap-themen .ap-stufen button span:not(:first-child){font-size:.62rem!important}
html body.ep-app #app .ap-themen .ap-stufen button img,html body.ep-app #app .ap-themen .ap-stufen button .ic{width:20px!important;height:20px!important}
html body.ep-app #app .ap-themen .ap-info{padding:3px 10px!important;font-size:.72rem!important;margin:4px 0!important}
html body.ep-app #app .st-kopf .sbar{margin-top:6px!important}
html body.ep-app #app .st-kopf .sbtns button{padding:4px 2px!important;min-height:0!important;font-size:.74rem!important}
html body.ep-app #app .st-kopf .sbtns button img,html body.ep-app #app .st-kopf .sbtns button .ic{width:16px!important;height:16px!important}
html.ep-nofit-scroll,html.ep-nofit-scroll body{overflow:hidden!important;overscroll-behavior:none!important;touch-action:pan-x}`;
  document.head.appendChild(c);
  const SEITEN = ["bereich", "submenu", "geschmenu", "chmenu", "berufmenu"];
  function themenSeite(){ try{ if(!document.body.classList.contains("ep-app")) return false;
    if(SEITEN.includes(S.screen)) return true;
    return S.screen === "home" && !!document.querySelector("#app .ap-themen"); }catch(e){ return false; } }
  function passen(){
    const app = document.getElementById("app"); if(!app) return;
    const an = themenSeite();
    document.documentElement.classList.toggle("ep-nofit-scroll", an);
    app.style.zoom = "";
    if(!an) return;
    scrollTo(0, 0);
    const tb = document.getElementById("epTabs"), unten = tb ? tb.getBoundingClientRect().top - 6 : innerHeight - 6;
    let last = 0; app.querySelectorAll(":scope > * , :scope > * > *").forEach(e => { const r = e.getBoundingClientRect(); if(r.height) last = Math.max(last, r.bottom); });
    const oben = app.getBoundingClientRect().top;
    if(last > unten){ const z = Math.max(.6, (unten - oben) / (last - oben)); app.style.zoom = z.toFixed(3); }
  }
  let t = 0; const los = () => { clearTimeout(t); t = setTimeout(passen, 60); };
  const start = () => { const a = document.getElementById("app"); if(!a) return setTimeout(start, 300);
    new MutationObserver(los).observe(a, {childList:true, subtree:true}); addEventListener("resize", los); los(); };
  start();
})();

/* ===== Handy/iPad: untere Menüleiste (#epTabs) im neuen Stil wie die Leiste am Computer ===== */
(function(){ const c = document.createElement("style");
c.textContent = `
html body.ep-app #epTabs{height:76px!important;padding:6px!important;gap:4px;border-radius:30px!important;
  background:linear-gradient(180deg,rgba(255,255,255,.97),rgba(240,236,255,.95))!important;border:3px solid #fff!important;
  box-shadow:0 14px 30px rgba(50,30,130,.32),inset 0 -4px 0 rgba(120,90,220,.12)!important;backdrop-filter:none!important}
html body.ep-app #epTabs button{color:#3A2F72!important;font:800 11px Lexend,system-ui,sans-serif!important;border-radius:22px!important;gap:2px!important;transition:transform .15s,background .2s;position:relative}
html body.ep-app #epTabs .tabic{width:34px;height:34px;display:grid;place-items:center;transition:transform .2s}
html body.ep-app #epTabs .tabic img{width:34px!important;height:34px!important;object-fit:contain;filter:drop-shadow(0 2px 3px rgba(40,20,100,.25))}
html body.ep-app #epTabs .tabav{width:34px!important;height:34px!important;border-radius:50%!important;border:3px solid #fff!important;box-shadow:0 2px 6px rgba(40,20,100,.3)}
html body.ep-app #epTabs button[aria-current="page"]{color:#fff!important;background:linear-gradient(135deg,#6A4BFF 0%,#A43BE0 55%,#E8409F 100%)!important;
  box-shadow:0 5px 0 #4A23A8,0 8px 16px rgba(140,50,200,.4),inset 0 2px 0 rgba(255,255,255,.35)!important;transform:translateY(-2px);text-shadow:0 1px 2px rgba(40,0,80,.4)}
html body.ep-app #epTabs button[aria-current="page"] .tabic{transform:scale(1.1)}
html body.ep-app #epTabs button:focus-visible{outline:3px solid #7B3FE4;outline-offset:2px}
html body.ep-app #epTabs button svg{color:#3A2F72}
html body.ep-app #epTabs button[aria-current="page"] svg{color:#fff}
@media (min-width:1000px) and (orientation:landscape){html body.ep-app #epTabs{height:auto!important}html body.ep-app #epTabs .tabic,html body.ep-app #epTabs .tabic img{width:40px!important;height:40px!important}}
@media (prefers-reduced-motion:reduce){html body.ep-app #epTabs button,html body.ep-app #epTabs .tabic{transition:none}}`;
document.head.appendChild(c); })();
