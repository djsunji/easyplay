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

/* ===== Dejans gemalte Hintergründe (Einstellungen › Hintergrund, ids «b-…», Bilder img/hg/bild-<name>.webp) ===== */
(function(){ if(document.getElementById("bgbild")) return;
const NAMEN = ["sommerwiese","bergsee","herbst","winter","dorf","wolkenmeer","sternennacht","pastell"];
const HOCH = ["sommerwiese","bergsee","herbst","winter","dorf","wolkenmeer","sternennacht"]; // haben eine Hochformat-Version bild-<name>-hoch.webp
const L = document.createElement("div"); L.id = "bgbild"; L.setAttribute("aria-hidden", "true");
(document.body || document.documentElement).appendChild(L);
const B = ':root[data-bg^="b-"]';
const c = document.createElement("style"); c.id = "ep-bgbild-css";
c.textContent = `
#bgbild{display:none;position:fixed;inset:0;z-index:-1;pointer-events:none;background:#9FC8F5 center bottom/cover no-repeat}
${B} #bgbild{display:block}
${B} #alpen,${B} #himmel,${B} #flocken,${B} #clouds,${B} #pattern,${B} #bgneu{display:none!important}
${B} body,${B} body.dark{background:#9FC8F5!important;background-image:none!important}
/* dunkler Modus: Bild abdunkeln, damit helle Schrift lesbar bleibt (Sternennacht ist schon dunkel) */
#bgbild::after{content:"";position:absolute;inset:0;background:rgba(14,18,48,.5);opacity:0;transition:opacity .6s}
${B} body.dark #bgbild::after{opacity:1}
:root[data-bg="b-sternennacht"] body.dark #bgbild::after{opacity:.15}
${NAMEN.map(n => `:root[data-bg="b-${n}"] #bgbild{background-image:url("img/hg/bild-${n}.webp")}
.prev-b-${n}{background:url("img/hg/bild-${n}-klein.webp") center bottom/cover no-repeat,#9FC8F5}`).join("\n")}
/* Hochkant (Handy, iPad hoch): Hochformat-Version */
@media (orientation:portrait){${HOCH.map(n => `:root[data-bg="b-${n}"] #bgbild{background-image:url("img/hg/bild-${n}-hoch.webp")}`).join("\n")}}
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
${P} .xsw-opt:has(.xsw-key){--ak:url("img/qeels-antwort-a-knopf.webp");display:flex!important;align-items:center;gap:10px;text-align:left!important}
${P} .xsw-opt:nth-child(4n+2):has(.xsw-key){--ak:url("img/qeels-antwort-b-knopf.webp")}
${P} .xsw-opt:nth-child(4n+3):has(.xsw-key){--ak:url("img/qeels-antwort-c-knopf.webp")}
${P} .xsw-opt:nth-child(4n+4):has(.xsw-key){--ak:url("img/qeels-antwort-d-knopf.webp")}
${P} .xsw-key{flex:none;width:calc(var(--ah)*.8);height:calc(var(--ah)*.8);margin:calc(var(--ah)*-.3) 0 calc(var(--ah)*-.3) calc(var(--ah)*-.42);background:center/contain no-repeat var(--ak);border-radius:50%;color:transparent;font-size:0}
${P} .xsw-otx{flex:1;min-width:0;overflow-wrap:normal;word-break:normal;hyphens:auto;-webkit-hyphens:auto;line-height:1.15}
@media (max-width:480px){${P} .xsw-opt:has(.xsw-key){font-size:.95rem!important;gap:7px}}
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
    {id:"start",  t:"Start",      i:"img/grafik/sprachen/haus.webp?v=2", go:() => { try{ window.EP_NP_START && window.EP_NP_START(); }catch(e){} go("home"); }},
    {id:"themen", t:"Themen",     i:"img/grafik/diverse/buecher.webp?v=2", go:() => { try{ window.EP_NP_WAHL && window.EP_NP_WAHL(); }catch(e){} go("home"); }},
    {id:"duell",  t:"Duell",      i:"img/qeels-icons/themen/duell.webp", go:() => go("duell")},
    {id:"entd",   t:"Entdecken",  i:"img/grafik/mathe/entdecken.webp?v=2", go:() => go("x-entdecken")},
    {id:"lib",    t:"Bibliothek", i:"img/grafik/diverse/buch.webp?v=2", go:() => go("lib")},
    {id:"profil", t:"Profil",     i:"", go:() => go("profil")},
    {id:"anm",    t:"Anmelden",   i:"img/grafik/diverse/schloss.webp?v=2", go:() => go("konto")}
  ];
  const aktiv = sc => {
    if(sc === "home") return (document.querySelector(".np-wahl") ? "themen" : "start");
    if(["bereich","submenu","geschmenu","chmenu","berufmenu","mode","quiz","done","epwoche","chat","spielmodi","live","livequiz","livehost","liveplay","hardcore","hardcoreinfo"].includes(sc)) return "themen";
    if(/^duell/.test(sc)) return "duell";
    if(["x-garderobe"].includes(sc)) return "profil";
    if(/^x-/.test(sc)) return "entd";
    if(/^lib/.test(sc) || ["bibliothek","suche"].includes(sc)) return "lib";
    if(["register","login","konto"].includes(sc)){ let an = false; try{ an = !!S.profil; }catch(e){} if(!an) return "anm"; }
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
    { const pk = n.querySelector('[data-hn="profil"]'); if(pk){ let an = false; try{ an = !!S.profil; }catch(e){} pk.hidden = !an; pk.style.display = an ? "" : "none"; const ak = n.querySelector('[data-hn="anm"]'); if(ak){ ak.hidden = an; ak.style.display = an ? "none" : ""; } } }
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
body:not(.ep-app) #ep-hnav{max-width:none}
/* Alle Seiten am Computer so breit wie die Startseite (1360 px), Menüleiste springt nicht mehr */
body:not(.ep-app) .wrap{max-width:1360px}
body:not(.ep-app) #app :is(.st-kopf,.themen,.modes,.bereiche,.xseite,.du2,.pp-seite,.statgrid,.statcard,.pp-restzeile,p.label,.libkopf,.ak-wahl,.ak-login,.kf-seite,.dukopf,.rlkopf,.pagehead,.crumbs){max-width:none!important}
@media (min-width:701px){body:not(.ep-app) #app .x-kacheln{grid-template-columns:repeat(auto-fit,minmax(210px,1fr))}}
body:not(.ep-app) #nav #navKonto{display:none!important}
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
    /* nur den eigenen Zoom zurücksetzen: das Quiz (appfein.js) verkleinert #app selbst */
    if(app.dataset.npz){ app.style.zoom = ""; delete app.dataset.npz; }
    if(!an) return;
    scrollTo(0, 0);
    /* am iPad quer ist die Leiste links (Seitenleiste): dann zählt der untere Bildschirmrand */
    const tb = document.getElementById("epTabs"), tr = tb && getComputedStyle(tb).display !== "none" ? tb.getBoundingClientRect() : null;
    const unten = tr && tr.width > innerWidth / 2 ? tr.top - 6 : innerHeight - 6;
    let last = 0; app.querySelectorAll(":scope > * , :scope > * > *").forEach(e => { const r = e.getBoundingClientRect(); if(r.height) last = Math.max(last, r.bottom); });
    const oben = app.getBoundingClientRect().top;
    if(last > unten){ const z = Math.max(.6, (unten - oben) / (last - oben)); app.style.zoom = z.toFixed(3); app.dataset.npz = "1"; }
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

/* ===== Startseite Handy/iPad: Dejans gezeichnete Kacheln mit Live-Infos (Serie, Level, Fehler, Woche) ===== */
(function(){
  const E = "img/grafik/entdecken/", D = "img/grafik/diverse/";
  const KK = {zufall:["05","wuerfel"], lib:["03","buch"], profil:["10","stern"], chat:["01","festkalender"], live:["02","blitz"], fehler:["04","ziel"]};
  const zahl = n => { try{ return Number(n).toLocaleString("de-CH"); }catch(e){ return String(n); } };
  function info(x){
    try{
      if(x === "zufall"){ const se = window.EP_LERNEN && EP_LERNEN.serie(); return se && se.heute ? {t:`Heute ${se.heute} Fragen`, bar:Math.min(1, se.heute / 5)} : {t:`${zahl(FRAGEN.length)} Fragen`}; }
      if(x === "lib"){ const n = typeof bibSeitenZahl === "function" ? bibSeitenZahl() : 0; return {t: n ? `${zahl(n)} Seiten` : "9 Bücher"}; }
      if(x === "profil"){ if(!S.profil) return {t:"Mit Konto XP sammeln"}; const s = EP_LEVEL.stand(); return {t: s.max ? "Höchstes Level!" : `Noch ${zahl(s.proLevel - s.imLevel)} XP`, bar:s.anteil}; }
      if(x === "chat"){ const se = EP_LERNEN.serie(); return {t: se.aktiv ? "Heute geschafft" : (se.n ? `Serie ${se.n} ${se.n === 1 ? "Tag" : "Tage"}` : "5 neue Fragen"), bar:Math.min(1, (se.heute || 0) / 5), neu:!se.aktiv}; }
      if(x === "fehler"){ const l = EP_LERNEN.fehlerListe(); return {t: l && l.length ? `${l.length} zum Üben` : "Alles geübt", neu:!!(l && l.length)}; }
    }catch(e){}
    return null;
  }
  function machen(){
    document.querySelectorAll(".ap-heute .ap-tag>.apf[data-x]").forEach(b => {
      const k = KK[b.dataset.x]; if(!k) return;
      b.classList.add("k2-live");
      const d = info(b.dataset.x); let z = b.querySelector(".k2-info");
      if(d){ if(!z){ z = document.createElement("span"); z.className = "k2-info"; b.appendChild(z); }
        const html = `<em>${d.t}</em>${d.bar != null ? `<i class="k2-bar"><i style="width:${Math.round(Math.max(.04, d.bar) * 100)}%"></i></i>` : ""}`;
        if(z.innerHTML !== html) z.innerHTML = html; b.classList.toggle("k2-neu", !!d.neu); }
    });
  }
  let t = 0; const los = () => { clearTimeout(t); t = setTimeout(machen, 40); };
  const start = () => { const a = document.getElementById("app"); if(!a) return setTimeout(start, 300); new MutationObserver(los).observe(a, {childList:true, subtree:true}); los(); };
  start();
  const T = "html:root body.ep-app .ap-heute";
  const c = document.createElement("style"); c.id = "ep-app-kacheln2-css";
  c.textContent = `
${T} .ap-tag>.apf.k2-live > small{display:none!important}
${T} .ap-tag>.apf.k2-live .k2-info{position:relative;z-index:2;margin-top:auto;max-width:62%;display:flex;flex-direction:column;gap:4px;align-self:flex-start}
${T} .ap-tag>.apf.k2-live .k2-info em{font:800 .64rem/1.15 Lexend,system-ui,sans-serif;font-style:normal;color:#fff;background:rgba(20,10,60,.35);border-radius:10px;padding:2px 7px;align-self:flex-start;box-sizing:border-box;text-shadow:none}
${T} .ap-tag>.apf.k2-live .k2-bar{display:block;width:100%;height:7px;border-radius:99px;background:rgba(20,10,60,.35);box-shadow:inset 0 1px 2px rgba(0,0,0,.35);overflow:hidden}
${T} .ap-tag>.apf.k2-live .k2-bar > i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#FFE15A,#FFB52E)}
${T} .ap-tag>.apf.k2-live.k2-neu::before{display:block!important;content:""!important;position:absolute;top:-6px;right:-4px;width:14px;height:14px;border-radius:50%;background:#FFE15A;box-shadow:0 0 0 3px #fff,0 0 12px #FFE15A;animation:k2puls 1.6s ease-in-out infinite;z-index:3}
@keyframes k2puls{50%{transform:scale(1.25);box-shadow:0 0 0 3px #fff,0 0 22px #FFE15A}}
${T} .ap-tag>.apf.k2-live{animation:k2ein .45s ease-out both}
${T} .ap-tag>.apf.k2-live:nth-child(2){animation-delay:.05s}${T} .ap-tag>.apf.k2-live:nth-child(3){animation-delay:.1s}
@keyframes k2ein{from{opacity:0;transform:translateY(10px) scale(.96)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){${T} .ap-tag>.apf.k2-live,${T} .ap-tag>.apf.k2-live.k2-neu::before{animation:none!important}}`;
  document.head.appendChild(c);
})();

/* ===== Duell-Ende im neuen Stil: Kopf auf Dejans Glanz-Kachel mit Ergebnis, weisse Glas-Karten, goldener Knopf.
   Gilt auch abends im dunklen Modus (feste helle Farben in den Karten). ===== */
(function(){
  const E = "img/grafik/entdecken/", P = "html body #app .du2-ende";
  const c = document.createElement("style"); c.id = "ep-duellende-css";
  c.textContent = `
${P}{background:none!important;border:0!important;box-shadow:none!important;max-width:720px!important;padding:0!important;overflow:visible!important;color:#2A1F5C}
${P}::before,${P}::after{display:none!important}
${P} .du2-ek{position:relative;display:flex!important;align-items:center;gap:14px;margin:0 0 14px!important;padding:6px 8px 4px!important;
  background:none!important;border:0 solid transparent!important;border-width:30px!important;border-image:url("${E}kopf.webp?v=1") 50 fill / 30px stretch!important;
  filter:drop-shadow(0 12px 20px rgba(60,30,160,.3));box-sizing:border-box;color:#fff!important}
${P}.nieder .du2-ek{border-image-source:url("${E}kachel-09.webp?v=3")!important}
${P} .du2-ek > img{height:150px!important;width:auto;flex:0 0 auto;margin:-40px 0 -26px -10px;filter:drop-shadow(0 6px 8px rgba(30,10,80,.35))}
${P} .du2-ek > div{flex:1 1 auto;min-width:0;text-align:center}
${P} .du2-ek h1{color:#fff!important;font-size:1.7rem!important;margin:0 0 4px!important;text-shadow:0 2px 5px rgba(30,10,80,.5)}
${P} .du2-ek p{color:#fff!important;margin:0!important;text-shadow:0 1px 3px rgba(30,10,80,.5);display:flex;flex-wrap:wrap;gap:6px;justify-content:center;align-items:center}
${P} .du2-ek .du2-mu{color:rgba(255,255,255,.85)!important}
${P} .du2-ek .du2-liga{background:#fff!important;color:#2A1F5C!important;text-shadow:none}
${P} .du2-ek .duvs.gross{margin:8px 0 0!important;gap:12px!important}
${P} .du2-ek .duvs > div{background:rgba(255,255,255,.95);border:3px solid #fff;border-radius:20px;padding:4px 18px 2px;min-width:104px;box-shadow:0 6px 14px rgba(30,10,80,.25)}
${P} .du2-ek .duvs b{color:#5B4F86!important;font-size:.9rem;text-shadow:none}
${P} .du2-ek .duvs .dupkt{color:#2A1F5C!important;font-size:2.2rem!important;line-height:1.1;text-shadow:none}
${P} .du2-ek .duvs .sieger{transform:scale(1.08);background:linear-gradient(180deg,#FFE680,#FFC53D);border-color:#FFF3C2}
${P} .du2-ek .duvs .sieger .dupkt,${P} .du2-ek .duvs .sieger b{color:#5A3300!important}
${P} .du2-ek .duvs .vs{color:#FFD34D!important;text-shadow:0 2px 3px rgba(30,10,80,.5)}
${P} :is(.du2-elo,.du2-verlauf,.du2-warte){background:rgba(255,255,255,.94)!important;border:4px solid #fff!important;border-radius:26px!important;box-shadow:0 12px 28px rgba(40,30,120,.2)!important;color:#2A1F5C!important}
${P} .du2-elo{padding:12px 16px!important;margin:0 0 8px!important}
${P} .du2-elo.plus .du2-eloz b{color:#12A57F!important}${P} .du2-elo.minus .du2-eloz b{color:#E5484D!important}
${P} .du2-eloz span,${P} .du2-elol small{color:#6B6390!important}
${P} .du2-elol > b{color:#2A1F5C!important}
${P} .du2-elo .du2-liga{background:#F1EEFF!important;color:#2A1F5C!important}
${P} .du2-elobar{background:#E6E2F5!important;height:12px!important;border-radius:99px!important;overflow:hidden}
${P} .du2-elobar i{background:linear-gradient(90deg,#FFC53D,#FF8A3D,#E2457A)!important;border-radius:99px}
${P} .du2-hinw{color:#fff!important;text-align:center;text-shadow:0 1px 3px rgba(0,0,0,.45);margin:4px 0 10px!important}
${P} .du2-stats{gap:10px!important;margin:0 0 10px!important}
${P} .du2-stats > div{background:#fff!important;border:0!important;border-radius:18px!important;padding:10px 12px 8px!important;box-shadow:0 8px 18px rgba(40,30,120,.18)!important;border-top:6px solid var(--st,#7B3FE4)!important;color:#2A1F5C!important}
${P} .du2-stats > div:nth-child(1){--st:#12A57F}${P} .du2-stats > div:nth-child(2){--st:#3D7BFF}${P} .du2-stats > div:nth-child(3){--st:#FF8A3D}${P} .du2-stats > div:nth-child(4){--st:#B13FE0}
${P} .du2-stats span{color:#6B6390!important}${P} .du2-stats b{color:#2A1F5C!important}${P} .du2-stats small{color:#857DA8!important}
${P} .du2-verlauf{padding:10px 14px!important;margin:0 0 6px!important}
${P} .du2-verlauf span{color:#2A1F5C!important;font-weight:800}
${P} .du2-bilanz{color:#fff!important;text-align:center;text-shadow:0 1px 3px rgba(0,0,0,.45)}
${P} .du2-auf,${P} .du2-ab{border-radius:20px!important;border:3px solid #fff!important;box-shadow:0 8px 18px rgba(40,30,120,.18)}
${P} .row{gap:14px!important;margin-top:10px!important;flex-wrap:wrap}
@media (max-width:600px){
  ${P} .du2-ek{border-width:22px!important;border-image-width:22px!important;gap:6px;padding:2px 2px 0!important}
  ${P} .du2-ek > img{height:96px!important;margin:-28px -4px -18px -8px}
  ${P} .du2-ek h1{font-size:1.2rem!important}
  ${P} .du2-ek .duvs > div{min-width:76px;padding:2px 10px 0}
  ${P} .du2-ek .duvs .dupkt{font-size:1.6rem!important}
  ${P} .du2-stats{gap:6px!important}${P} .du2-stats > div{padding:7px 7px 6px!important;border-top-width:5px!important}
  ${P} .du2-elo{padding:8px 10px!important}
}`;
  document.head.appendChild(c);
})();

/* ===== Bibliothek: Dejans gezeichnete Bücher (img/grafik/buecher/<id>.webp) im Regal und beim Zauber-Öffnen ===== */
(function(){
  const B = "img/grafik/buecher/", IDS = ["geschichte","welt","natur","wissen","schweiz","politik","geld","leben","alltag"];
  const R = "html body #app .buecher .buch";
  const FARBE = [["geschichte","#E3C2FF","#3A0F6B"],["welt","#BFD6FF","#0C2378"],["natur","#C9F5B0","#0E4A16"],["wissen","#B5F4F5","#06474E"],["schweiz","#FFC2BC","#5E0A0A"],
    ["politik","#FFC0CD","#4E0718"],["geld","#FFD3A6","#6A2600"],["leben","#FFC3E3","#5A0532"],["alltag","#FFF0A8","#5E3A00"]];
  try{ if(!document.getElementById("ep-font-cinzel")){ const l = document.createElement("link"); l.id = "ep-font-cinzel"; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@900&display=swap"; document.head.appendChild(l); } }catch(e){}
  const c = document.createElement("style"); c.id = "ep-buecher-css";
  c.textContent = `
${R}{height:auto!important;aspect-ratio:.7!important;perspective:none!important;filter:drop-shadow(0 10px 10px rgba(40,20,5,.45));transition:transform .3s ease,filter .3s ease}
${R}:hover,${R}:focus-visible{transform:translateY(-8px) rotate(-2deg);filter:drop-shadow(0 16px 14px rgba(40,20,5,.5)) drop-shadow(0 0 14px rgba(255,214,110,.75));outline:none}
${R} .bcover{background-color:transparent!important;background-position:center!important;background-size:100% 100%!important;background-repeat:no-repeat!important;border:0!important;border-radius:0!important;box-shadow:none!important;transform:none!important;
  padding:16% 24% 30% 17%!important;gap:3%!important;justify-content:center!important}
${R} .bcover::before,${R} .bcover::after,${R} .bruecken{display:none!important}
${R} .bemo2,${R} .btop{display:none!important}
${R} .btitel{color:#fff!important;font:800 clamp(.95rem,2cqw,1.5rem)/1.1 Fredoka,Lexend,system-ui,sans-serif!important;text-shadow:0 2px 0 rgba(0,0,0,.35),0 0 10px rgba(0,0,0,.45),0 0 2px #000!important;letter-spacing:.01em;word-break:keep-all;overflow-wrap:normal;hyphens:manual;white-space:nowrap}
${R} .bunter{color:#FFE9A8!important;font:700 clamp(.66rem,1.15cqw,.9rem)/1.15 Lexend,system-ui,sans-serif!important;font-style:normal!important;text-shadow:0 1px 2px rgba(0,0,0,.7)!important;opacity:1!important}
${R}.gross{aspect-ratio:.7!important}
${R} .bunter,.zauber .zbuch[data-buch] .zvorne .bunter{display:none!important}
${R} .bcover{padding:15% 17% 61% 21%!important}
${R} .btitel,.zauber .zbuch[data-buch] .zvorne .btitel{font-family:"Cinzel Decorative",Georgia,serif!important;font-weight:900!important;font-style:normal!important;line-height:1!important;white-space:nowrap;
  color:var(--bt,#FFE29A)!important;-webkit-text-stroke:.16em var(--bs,#2A1200);paint-order:stroke fill;transform:rotate(-9deg);display:inline-block!important;max-width:none!important;width:max-content!important;flex:none!important;align-self:center!important;overflow:visible!important;letter-spacing:.02em;
  text-shadow:0 .06em 0 var(--bs,#2A1200),0 0 .35em rgba(255,214,110,.85)!important}
${R} .bcover{container-type:inline-size}
${R} .btitel{font-size:24cqi!important}
${R}[data-buch="geschichte"] .btitel{font-size:17cqi!important}${R}:is([data-buch="politik"],[data-buch="schweiz"],[data-buch="wissen"],[data-buch="alltag"]) .btitel{font-size:21cqi!important}
.zauber .zbuch[data-buch] .zvorne{padding:15% 17% 61% 21%!important}
.zauber .zbuch[data-buch] .zvorne .btitel{font-size:2.1rem!important}
${FARBE.map(([id, t, st]) => `${R}[data-buch="${id}"],.zauber .zbuch[data-buch="${id}"]{--bt:${t};--bs:${st}}`).join("\n")}

${IDS.map(id => `${R}[data-buch="${id}"] .bcover,.zauber .zbuch[data-buch="${id}"] .zvorne{background-image:url("${B}${id}.webp?v=2")!important}`).join("\n")}
.zauber .zbuch[data-buch] .zvorne{background-color:transparent!important;background-position:center!important;background-size:100% 100%!important;background-repeat:no-repeat!important;box-shadow:none!important;border-radius:0!important;padding:16% 24% 30% 17%!important;filter:drop-shadow(0 0 18px rgba(255,214,110,.7))}
.zauber .zbuch[data-buch] .zvorne::before,.zauber .zbuch[data-buch] .zvorne .bemo2{display:none!important}
.zauber .zbuch[data-buch] .zvorne .bunter{color:#FFE9A8;font-weight:700;text-shadow:0 1px 2px rgba(0,0,0,.7)}
.zauber .zbuch[data-buch] .zhinten{inset:2% 4% 6% 3%!important;border-radius:8px 16px 16px 8px}
.zkreis{position:absolute;left:50%;top:50%;width:min(92vw,620px);aspect-ratio:1;transform:translate(-50%,-50%);opacity:0;pointer-events:none}
.zkreis svg{width:100%;height:100%;animation:zkdreh 14s linear infinite;filter:drop-shadow(0 0 8px rgba(255,214,110,.9))}
.zkreis circle{fill:none;stroke:rgba(255,220,140,.75);stroke-width:1.2;stroke-dasharray:3 5}
.zkreis circle + circle{stroke:rgba(190,150,255,.6);stroke-dasharray:none;stroke-width:.8}
.zkreis text{fill:#FFE29A;font:11px Georgia,serif;letter-spacing:3px}
@keyframes zkdreh{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion: reduce){.zkreis svg{animation:none}}`;
  c.textContent += `
/* Dejans Bücher tragen den Titel jetzt selbst im Bild */
${R} .btitel,${R} .bunter,.zauber .zbuch[data-buch] .zvorne .btitel,.zauber .zbuch[data-buch] .zvorne .bunter{position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;white-space:nowrap!important}`;
  document.head.appendChild(c);
  /* Titel so verkleinern, dass er samt Schräglage im inneren Goldrahmen bleibt */
  const SCHRAEG = 9 * Math.PI / 180;
  function passen(t){ const box = t.parentElement; if(!box) return;
    const cs = getComputedStyle(box), frei = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    if(frei <= 0) return;
    t.style.removeProperty("font-size");
    const w = t.offsetWidth, h = t.offsetHeight; if(!w) return;
    const f0 = parseFloat(getComputedStyle(t).fontSize);
    /* Breite samt dunklem Rand (.16em je Seite) und Schräglage, mit etwas Luft zum Goldrahmen */
    const breit = (w + f0 * .34) * Math.cos(SCHRAEG) + h * Math.sin(SCHRAEG), ziel = frei * .94;
    /* immer genau so gross, dass der Titel von Linie zu Linie reicht (auch vergrössern) */
    t.style.setProperty("font-size", (f0 * ziel / breit).toFixed(1) + "px", "important");
  }
  const alle = () => document.querySelectorAll("#app .buecher .buch .btitel, .zauber .zbuch[data-buch] .zvorne .btitel").forEach(passen);
  let tm; const bald = () => { clearTimeout(tm); tm = setTimeout(alle, 60); };
  new MutationObserver(bald).observe(document.body, {childList:true, subtree:true});
  addEventListener("resize", bald);
  try{ document.fonts.ready.then(alle); document.fonts.addEventListener("loadingdone", bald); }catch(e){}
})();

/* ===== Bibliothek-Startseite: Dejans Holzregal (img/grafik/regal-wand.webp als Neun-Teile-Bild, Bretter regal-brett.webp
   unter jeder Bücherreihe). Ohne Bibliothek-Kachel oben und ohne Zimmer mit Kindern unten: zuerst Suche, dann Regal. ===== */
(function(){
  const G = "img/grafik/", P = 'html[data-scr="lib"] body #app';
  const c = document.createElement("style"); c.id = "ep-regal-css";
  c.textContent = `
${P} .libkopf,${P} .libszene,${P} .libhint,${P} .regaltitel{display:none!important}
${P} .libhome-suche{margin:6px auto 14px!important;max-width:1010px}
${P} .regal{background:none!important;box-shadow:none!important;border:0 solid transparent!important;border-radius:0!important;
  border-width:44px 48px 30px!important;border-image:url("${G}regal-wand.webp?v=1") 110 120 60 fill / 44px 48px 30px stretch!important;
  padding:6px 4px 10px!important;max-width:1100px!important;filter:drop-shadow(0 14px 24px rgba(10,5,30,.45))}
${P} .regal .buecher{position:relative!important;row-gap:64px!important;column-gap:22px!important;padding:8px 0 40px!important}
${P} .regal .buch{z-index:2}
@media (min-width:761px){${P} .regal .buch{width:150px!important}}
${P} .regal .buch::after{display:none!important}
${P} .regal .ep-brett{position:absolute;left:-14px;right:-14px;height:24px;z-index:1;pointer-events:none;box-sizing:border-box;
  border:0 solid transparent;border-width:0 24px;border-image:url("${G}regal-brett.webp?v=3") 0 40 fill / 0 24px stretch;filter:drop-shadow(0 10px 8px rgba(40,15,0,.45))}
@media (max-width:760px){
  ${P} .regal{border-width:26px 26px 18px!important;border-image-width:26px 26px 18px!important;padding:4px 0 6px!important}
  ${P} .regal .buecher{row-gap:40px!important;column-gap:10px!important;padding:4px 0 26px!important}
  ${P} .regal .ep-brett{height:16px;border-width:0 14px;border-image-width:0 14px;left:-8px;right:-8px}
}`;
  document.head.appendChild(c);
  /* Handy/iPad hoch: Regal so klein, dass Suche und alle Bücher ohne Scrollen über der Menüleiste Platz haben */
  function einpassen(bu){
    const regal = bu.closest(".regal"); if(!regal) return;
    const buecher = [...bu.querySelectorAll(":scope > .buch")];
    if(!document.body.classList.contains("ep-app") || innerWidth > 900){ buecher.forEach(b => { b.style.removeProperty("width"); b.style.removeProperty("height"); b.style.removeProperty("aspect-ratio"); }); regal.style.removeProperty("max-width"); ["grid-auto-rows","grid-template-rows","align-items","row-gap","grid-template-columns","justify-content","column-gap"].forEach(k => bu.style.removeProperty(k)); return; }
    const tabs = document.getElementById("epTabs"), tr = tabs && tabs.getBoundingClientRect();
    const unten = tr && tr.top > innerHeight / 2 ? tr.top - 8 : innerHeight - 8;
    const oben = regal.getBoundingClientRect().top + scrollY - (document.scrollingElement.scrollTop || 0);
    const reihen = Math.ceil(buecher.length / 3), rand = 26 + 18 + 10 + 30, luecke = 30;
    const platz = unten - oben - rand - reihen * luecke + luecke - 26;
    const hoch = platz / reihen, breit = Math.max(40, Math.min(hoch * .7, (bu.clientWidth - 20) / 3));
    let w = breit;
    const setz = x => { buecher.forEach(b => { b.style.setProperty("width", x.toFixed(1) + "px", "important"); b.style.setProperty("height", (x / .7).toFixed(1) + "px", "important"); b.style.setProperty("aspect-ratio", "auto", "important"); });
      bu.style.setProperty("grid-auto-rows", "min-content", "important"); bu.style.setProperty("grid-template-rows", "none", "important"); bu.style.setProperty("align-items", "end", "important");
      bu.style.setProperty("row-gap", "30px", "important"); bu.style.setProperty("grid-template-columns", "repeat(3," + x.toFixed(1) + "px)", "important"); bu.style.setProperty("justify-content", "space-evenly", "important");
      regal.style.setProperty("margin-left", "auto", "important"); regal.style.setProperty("margin-right", "auto", "important");
      regal.style.setProperty("max-width", Math.round(x * 3 + 2 * 16 + 52 + 40) + "px", "important"); bu.style.setProperty("column-gap", "16px", "important"); };
    setz(w);
    /* nachmessen und so lange verkleinern, bis das Regal über der Menüleiste endet */
    for(let i = 0; i < 4; i++){ const ueber = regal.getBoundingClientRect().bottom - unten; if(ueber <= 0) break;
      const hoeheBuecher = reihen * (w / .7); w = Math.max(40, w * (hoeheBuecher - ueber - 4) / hoeheBuecher); setz(w); }
    { const frei = unten - regal.getBoundingClientRect().bottom; if(frei > 12){ const hb = reihen * (w / .7); const w2 = Math.min((bu.clientWidth - 20) / 3, w * (hb + frei - 8) / hb); setz(w2); if(regal.getBoundingClientRect().bottom > unten) setz(w); } }
  }
  function bretter(){
    const bu = document.querySelector('html[data-scr="lib"] #app .regal .buecher'); if(!bu) return;
    einpassen(bu);
    bu.querySelectorAll(":scope > .ep-brett").forEach(x => x.remove());
    const reihen = new Map();
    bu.querySelectorAll(":scope > .buch").forEach(b => { const t = b.offsetTop; const h = b.offsetHeight; if(!h) return; const r = reihen.get(t); if(!r || h > r) reihen.set(t, h); });
    reihen.forEach((h, t) => { const d = document.createElement("div"); d.className = "ep-brett"; d.setAttribute("aria-hidden", "true"); d.style.top = Math.round(t + h * .875) + "px"; bu.appendChild(d); });
  }
  let tm; const bald = () => { clearTimeout(tm); tm = setTimeout(bretter, 80); };
  new MutationObserver(m => { if(m.some(x => [...x.addedNodes].some(n => n.nodeType === 1 && !n.classList.contains("ep-brett")))) bald(); }).observe(document.body, {childList:true, subtree:true});
  addEventListener("resize", bald);
})();

/* ===== Bibliothek: aufgeschlagenes Zauberbuch (renderLibBuch, Klasse .zbo) =====
   Einband in der Buchfarbe mit Goldrahmen und Ecken, Pergamentseiten, Dejans gezeichnetes Buch schwebt vor einem Runenkreis,
   Seiten und Kapitel als Siegel, Rubriken als Bänder, Kapitelnummern als Goldmünzen, Funkeln. Gleiches Aussehen hell und dunkel. */
(function(){
  const FARBE = {geschichte:["#E3C2FF","#3A0F6B"],welt:["#BFD6FF","#0C2378"],natur:["#C9F5B0","#0E4A16"],wissen:["#B5F4F5","#06474E"],schweiz:["#FFC2BC","#5E0A0A"],
    politik:["#FFC0CD","#4E0718"],geld:["#FFD3A6","#6A2600"],leben:["#FFC3E3","#5A0532"],alltag:["#FFF0A8","#5E3A00"]};
  const ecke = r => "url(\"data:image/svg+xml," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#FFF1B8'/><stop offset='.45' stop-color='#E9B949'/><stop offset='1' stop-color='#9A6512'/></linearGradient></defs><g transform='rotate(${r} 30 30)'><path d='M3 3h40c-7 2-12 6-14 12-6-3-13-1-15 5 5 2 6 8 4 14-6 1-11 6-12 12V3z' fill='url(#g)' stroke='#6E430A' stroke-width='1.6' stroke-linejoin='round'/><path d='M10 10c8 0 14 2 18 8M10 10c0 8 2 14 8 18' fill='none' stroke='#6E430A' stroke-width='1.2' opacity='.6'/><circle cx='13' cy='13' r='5.5' fill='#fff' fill-opacity='.85' stroke='#6E430A' stroke-width='1.4'/><circle cx='11.5' cy='11.5' r='1.8' fill='#fff'/></g></svg>`) + "\")";
  const Z = "html body #app .offen.zbo", K = "html body #app .libart.zbk", ZA = "html body #app :is(.offen.zbo,.libart.zbk)";
  const c = document.createElement("style"); c.id = "ep-zauberbuch-css";
  c.textContent = `
${ZA}{--zp1:#FDF6E3;--zp2:#F3E3BC;--zink:#3A2610;--zink2:#5C4526;--zgold:#E9B949;--zgoldd:#8A5A12;--zakz:color-mix(in srgb,var(--bf) 72%,#1E0F00);
  --libink:#3A2610;--libpaper:#FFFBF0;--libline:#E2C98F;--libacc:#8A5A12;--ink:#3A2610;--soft:#8A7150;--surface:#FFFBF0;--line:#E2C98F;color:var(--zink)}
${Z}{
  position:relative;isolation:isolate;max-width:1040px;margin:18px auto 70px;padding:20px;gap:0;border-radius:22px 28px 28px 22px;overflow:visible;
  background:radial-gradient(120% 90% at 28% 0%,color-mix(in srgb,var(--bf) 80%,#fff),var(--bf) 42%,var(--bf2) 100%);
  box-shadow:inset 0 0 0 3px var(--zgold),inset 0 0 0 7px var(--bf2),inset 0 0 0 9px rgba(255,226,154,.5),0 32px 54px -24px rgba(20,8,40,.75),0 0 70px -12px color-mix(in srgb,var(--bf) 70%,transparent)}
${Z}::before{content:"";position:absolute;inset:-4px;pointer-events:none;z-index:2;background:${ecke(0)} left top/58px no-repeat,${ecke(90)} right top/58px no-repeat,${ecke(180)} right bottom/58px no-repeat,${ecke(270)} left bottom/58px no-repeat;filter:drop-shadow(0 2px 3px rgba(40,20,0,.4))}
${Z}::after{content:"";position:absolute;left:50%;top:14px;bottom:14px;width:26px;transform:translateX(-50%);display:none}
${ZA} .zband{position:absolute;bottom:-46px;width:24px;height:70px;z-index:-1;clip-path:polygon(0 0,100% 0,100% 100%,50% 78%,0 100%);box-shadow:inset 0 0 0 2px rgba(255,255,255,.25)}
${ZA} .zband.a{right:16%;background:linear-gradient(90deg,var(--bf2),var(--bf) 50%,var(--bf2));animation:zbband 5s ease-in-out infinite;transform-origin:top}
${ZA} .zband.b{right:calc(16% + 30px);height:56px;background:linear-gradient(90deg,#B07A1C,#F5D06A 50%,#B07A1C);animation:zbband 5s ease-in-out -2.5s infinite;transform-origin:top}
${K}::before{content:"";position:absolute;inset:-22px;pointer-events:none;z-index:2;background:${ecke(0)} left top/58px no-repeat,${ecke(90)} right top/58px no-repeat,${ecke(180)} right bottom/58px no-repeat,${ecke(270)} left bottom/58px no-repeat;filter:drop-shadow(0 2px 3px rgba(40,20,0,.4))}
@keyframes zbband{50%{transform:rotate(3deg)}}
${ZA} .zfunken{position:absolute;inset:-22px;pointer-events:none;z-index:4}
${ZA} .zfunken i{position:absolute;width:16px;height:16px;margin:-8px 0 0 -8px;background:#FFE7A0;clip-path:polygon(50% 0,61% 39%,100% 50%,61% 61%,50% 100%,39% 61%,0 50%,39% 39%);filter:drop-shadow(0 0 6px #FFD36E);animation:zbfunk 3.6s ease-in-out infinite;opacity:0}
${ZA} .zfunken i:nth-child(3n){width:10px;height:10px;background:#fff}
${ZA} .zfunken i:nth-child(4n){background:color-mix(in srgb,var(--bf) 35%,#fff)}
@keyframes zbfunk{0%,100%{opacity:0;transform:scale(.3) rotate(0)}45%{opacity:1;transform:scale(1) rotate(45deg)}70%{opacity:.6}}

/* Seiten */
${Z}>.seite{position:relative;z-index:1;color:var(--zink);min-width:0;
  background:radial-gradient(ellipse 80% 40% at 50% 0%,rgba(255,255,255,.7),transparent 70%),radial-gradient(circle at 12% 88%,rgba(196,140,50,.12),transparent 38%),radial-gradient(circle at 92% 20%,rgba(196,140,50,.08),transparent 30%),linear-gradient(180deg,var(--zp1),var(--zp2))}
${Z} .zlinks{display:grid;align-content:start;gap:16px;position:sticky;top:16px}
${Z}>.seite.links{display:block!important;border-radius:16px 3px 3px 16px;padding:26px 28px 30px;box-shadow:inset -30px 0 32px -26px rgba(90,55,10,.6),-3px 2px 0 #EBDCB4,-6px 4px 0 #DCC694,-9px 6px 0 #C7AC72}
${Z}>.seite.rechts{border-radius:3px 16px 16px 3px;padding:26px 30px 30px;box-shadow:inset 30px 0 32px -26px rgba(90,55,10,.6),3px 2px 0 #EBDCB4,6px 4px 0 #DCC694,9px 6px 0 #C7AC72}

/* Linke Seite: schwebendes Buch im Runenkreis */
${Z} .minicover{display:grid!important;justify-items:center;gap:10px;padding:4px 0 0!important;background:none!important;box-shadow:none!important;color:var(--zink)!important;border-radius:0!important;text-align:center}
${Z} .mbuehne{position:relative;display:block;width:min(170px,54%);aspect-ratio:303/436;margin:18px 0 10px}
${Z} .mbuehne::before{content:"";position:absolute;left:50%;top:50%;width:150%;aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle,rgba(255,220,130,.55),color-mix(in srgb,var(--bf) 18%,transparent) 45%,transparent 68%)}
${ZA} .mkreis{position:absolute;left:50%;top:50%;width:160%;aspect-ratio:1;transform:translate(-50%,-50%);pointer-events:none}
${ZA} .mkreis svg{display:block;width:100%;height:100%;animation:zbkreis 40s linear infinite}
${ZA} .mkreis circle{fill:none;stroke:color-mix(in srgb,var(--bf) 55%,#B07A1C);stroke-width:1.1;stroke-dasharray:3 5;opacity:.75}
${ZA} .mkreis circle+circle{stroke-dasharray:none;stroke-width:.7;opacity:.4}
${ZA} .mkreis text{fill:color-mix(in srgb,var(--bf) 65%,#7A4A0C);font:11px Georgia,serif;letter-spacing:3px;opacity:.85}
@keyframes zbkreis{to{transform:rotate(360deg)}}
${Z} .mbild{position:relative;display:block;width:100%;height:auto;animation:zbschweb 4.8s ease-in-out infinite;filter:drop-shadow(0 16px 12px rgba(60,30,5,.35)) drop-shadow(0 0 16px rgba(255,214,110,.65))}
@keyframes zbschweb{50%{transform:translateY(-9px) rotate(1.5deg)}}
${Z} .mtext{display:grid;justify-items:center;gap:6px}
${Z} .minicover .bemo2{display:none!important}
/* Dejans Buchbilder tragen den Titel selbst (?v=2, gleich wie im Regal): Titel darunter nur noch für Vorleser */
${Z} .minicover .btitel{position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;white-space:nowrap!important}
${Z} .mtext{position:relative}
${Z} .minicover .btitel{font-family:"Cinzel Decorative",Georgia,serif!important;font-weight:900!important;font-size:clamp(1.8rem,3vw,2.4rem)!important;line-height:1.05!important;color:var(--bt,#FFE29A)!important;
  -webkit-text-stroke:.15em var(--bs,#2A1200);paint-order:stroke fill;text-shadow:0 .07em 0 var(--bs,#2A1200),0 0 .45em rgba(255,214,110,.9)!important;transform:rotate(-4deg);display:inline-block;letter-spacing:.02em}
${Z} .minicover .bunter{font:600 1rem/1.3 Fredoka,Lexend,system-ui,sans-serif!important;font-style:normal!important;color:var(--zakz)!important;opacity:1!important;letter-spacing:.02em}
${Z} .libdesc{color:var(--zink2)!important;font:400 1.02rem/1.6 Lexend,system-ui,sans-serif;text-align:left;margin:0!important}
${Z} .libdesc::first-letter{float:left;font:900 3.1em/.85 "Cinzel Decorative",Georgia,serif;margin:.06em .1em 0 0;color:var(--bf);text-shadow:1px 1px 0 var(--zgold),2px 2px 0 var(--zgoldd),0 0 .35em rgba(255,214,110,.9)}
${ZA} .bstat{display:flex!important;gap:18px;justify-content:center;margin:2px 0!important}
${ZA} .siegel{display:grid;place-items:center;align-content:center;width:86px;aspect-ratio:1;border-radius:50%;color:#FFF3D0;font:600 .74rem/1.15 Fredoka,Lexend,system-ui,sans-serif;text-align:center;letter-spacing:.03em;transform:rotate(-7deg);
  background:radial-gradient(circle at 35% 28%,color-mix(in srgb,var(--bf) 45%,#fff),var(--bf) 52%,var(--bf2));
  box-shadow:inset 0 0 0 3px var(--zgold),inset 0 0 0 6px color-mix(in srgb,var(--bf2) 70%,transparent),inset 0 0 0 7px rgba(255,226,154,.45),0 7px 12px -5px rgba(60,30,5,.5)}
${ZA} .siegel:nth-child(2){transform:rotate(6deg)}
${ZA} .siegel b{display:block;font:900 1.3rem/1 "Cinzel Decorative",Georgia,serif;color:#FFE29A;text-shadow:0 1px 0 rgba(0,0,0,.35);font-variant-numeric:tabular-nums}
${ZA} .libsuche input.sel{background:#FFFBF0!important;color:var(--zink)!important;border:2px solid #D9B266!important;border-radius:999px!important;box-shadow:inset 0 2px 6px rgba(120,80,20,.14)!important;font-family:Lexend,system-ui,sans-serif!important}
${ZA} .libsuche input.sel::placeholder{color:#9A7F55}
${ZA} .libsuche input.sel:focus{outline:none;border-color:var(--bf)!important;box-shadow:0 0 0 4px color-mix(in srgb,var(--bf) 22%,transparent),0 0 20px rgba(255,214,110,.75)!important}
${Z} .btabs{display:grid!important;grid-template-columns:1fr 1fr;gap:10px;margin:0!important}
${Z} .btabs .seg{min-height:50px;border-radius:16px!important;border:2px solid #D9B266!important;background:#FFF8E6!important;color:var(--zink)!important;font:600 1rem/1.15 Fredoka,Lexend,system-ui,sans-serif!important;box-shadow:0 4px 0 #D9B266!important;transition:transform .15s}
${Z} .btabs .seg:hover{transform:translateY(-2px)}
${Z} .btabs .seg[aria-pressed="true"]{background:linear-gradient(160deg,var(--bf),var(--bf2))!important;color:#FFE29A!important;border-color:var(--zgold)!important;box-shadow:0 4px 0 var(--bf2),0 0 18px -2px color-mix(in srgb,var(--bf) 75%,transparent)!important}
${Z} .btabs .seg:focus-visible{outline:3px solid var(--bf);outline-offset:2px}

/* Rechte Seite: Inhalt */
${Z} .seite.rechts>h2{display:flex;align-items:center;justify-content:center;gap:14px;margin:0 0 16px!important;font:900 2.1rem/1.1 "Cinzel Decorative",Georgia,serif!important;color:var(--zakz)!important;text-shadow:0 0 .4em rgba(255,214,110,.6)}
${Z} .seite.rechts>h2::before,${Z} .seite.rechts>h2::after{content:"";flex:1;max-width:120px;height:12px;background:radial-gradient(circle,var(--zgold) 3px,transparent 4px) center/12px 12px no-repeat,linear-gradient(var(--zgold),var(--zgold)) center/100% 2px no-repeat;opacity:.9}
${Z} .inhalt{gap:6px!important;grid-template-columns:minmax(0,1fr)}
${Z} .inhalt>li,${Z} .kapitel,${Z} .kt{min-width:0}
${Z} .kt b{hyphens:auto;-webkit-hyphens:auto;overflow-wrap:break-word}
${Z} .inhalt .rubrik{position:relative;margin:20px -10px 6px!important;padding:10px 30px 10px 30px!important;border:0!important;border-radius:0!important;gap:12px!important;color:#fff;
  background:linear-gradient(160deg,var(--bf),var(--bf2))!important;clip-path:polygon(0 0,100% 0,calc(100% - 16px) 50%,100% 100%,0 100%,16px 50%);
  box-shadow:inset 0 3px 0 rgba(255,226,154,.55),inset 0 -3px 0 rgba(0,0,0,.2)!important}
${Z} .inhalt .rubrik:first-child{margin-top:4px!important}
${Z} .inhalt .rubrik b{color:#fff!important;font:700 1.22rem/1.2 Fredoka,Lexend,system-ui,sans-serif!important;text-shadow:0 1px 2px rgba(0,0,0,.3)}
${Z} .inhalt .rbemo{flex:none;width:40px;height:40px;border-radius:50%;display:grid;place-items:center;font-size:1.35rem!important;background:radial-gradient(circle at 35% 30%,#FFF6CF,#F0C65A 55%,#B9851E);box-shadow:0 0 0 2px rgba(255,255,255,.45),0 2px 4px rgba(0,0,0,.3)}
${Z} .inhalt .rbseiten{color:#FFE29A!important;font:600 .85rem Fredoka,Lexend,system-ui,sans-serif!important;background:rgba(0,0,0,.2);padding:3px 11px;border-radius:999px}
${Z} .inhalt .rubrik ~ li .kapitel{padding-left:12px!important}
${Z} .kapitel{position:relative;gap:12px!important;padding:10px 14px 10px 12px!important;border-radius:16px!important;color:var(--zink)!important;transition:transform .2s ease,background .2s ease,box-shadow .2s ease}
${Z} .kapitel:hover,${Z} .kapitel:focus-visible{background:rgba(255,255,255,.62)!important;transform:translateX(5px);outline:none;
  box-shadow:0 0 0 2px color-mix(in srgb,var(--bf) 45%,transparent),0 8px 18px -8px color-mix(in srgb,var(--bf) 70%,transparent)}
${Z} .kapitel::after{content:"";position:absolute;right:-7px;top:-7px;width:18px;height:18px;background:#F5C84C;clip-path:polygon(50% 0,61% 39%,100% 50%,61% 61%,50% 100%,39% 61%,0 50%,39% 39%);filter:drop-shadow(0 0 5px #FFD36E);opacity:0;transform:scale(.3) rotate(-45deg);transition:.3s}
${Z} .kapitel:hover::after,${Z} .kapitel:focus-visible::after{opacity:1;transform:scale(1) rotate(0)}
${Z} .knr{flex:none;display:grid!important;place-items:center;width:36px;height:36px;min-width:36px!important;border-radius:50%;font:900 .95rem/1 "Cinzel Decorative",Georgia,serif!important;color:#5A3A08!important;
  background:radial-gradient(circle at 35% 28%,#FFF6CF,#F0C65A 55%,#B9851E);box-shadow:inset 0 0 0 2px rgba(255,255,255,.55),0 2px 4px rgba(90,55,10,.35);font-variant-numeric:tabular-nums}
${Z} .kemo{flex:none;width:42px;height:42px;border-radius:14px;display:grid!important;place-items:center;font-size:1.4rem!important;transform:rotate(-5deg);
  background:color-mix(in srgb,var(--bf) 14%,#fff);box-shadow:inset 0 0 0 2px color-mix(in srgb,var(--bf) 25%,transparent)}
${Z} .kapitel:hover .kemo{animation:zbwackel .55s ease}
@keyframes zbwackel{30%{transform:rotate(10deg) scale(1.12)}65%{transform:rotate(-9deg) scale(1.05)}}
${Z} .kt b{font:600 1.08rem/1.25 Fredoka,Lexend,system-ui,sans-serif!important;color:var(--zink)!important}
${Z} .kt small{color:#8A7150!important;font:400 .85rem Lexend,system-ui,sans-serif}
${ZA} .kpunkte,${ZA} .rpunkte{border-bottom:3px dotted color-mix(in srgb,var(--zgold) 85%,transparent)!important}
${Z} .kseite{font:600 .98rem Fredoka,Lexend,system-ui,sans-serif!important;color:var(--zakz)!important;white-space:nowrap}
${Z} .kapitel.kwichtig{background:linear-gradient(90deg,rgba(255,214,110,.42),rgba(255,214,110,.06))!important}
${Z} .kstern{margin-left:8px;background:radial-gradient(circle at 35% 28%,#FFF6CF,#F0C65A 55%,#C89225)!important;color:#5A3A08!important;border-radius:999px;padding:2px 9px!important;font:700 .7rem Fredoka,Lexend,system-ui,sans-serif!important;
  display:inline-block;transform:rotate(-4deg);box-shadow:0 0 10px rgba(255,214,110,.85)}

/* Register und Treffer */
${Z} .abc{gap:6px!important;justify-content:center;margin-bottom:14px!important}
${Z} .abc a{display:inline-grid;place-items:center;width:34px;height:34px;border-radius:50%;text-decoration:none;font:900 .9rem "Cinzel Decorative",Georgia,serif!important;color:#5A3A08!important;
  background:radial-gradient(circle at 35% 28%,#FFF6CF,#F0C65A 55%,#B9851E);box-shadow:inset 0 0 0 2px rgba(255,255,255,.5),0 2px 4px rgba(90,55,10,.3);transition:transform .15s}
${Z} .abc a:hover,${Z} .abc a:focus-visible{transform:translateY(-3px) rotate(-6deg);outline:none}
${ZA} .buchst{border-top:2px dashed color-mix(in srgb,var(--zgold) 60%,transparent)!important}
${ZA} .initial{font-family:"Cinzel Decorative",Georgia,serif!important;background:none!important;-webkit-background-clip:border-box!important;background-clip:border-box!important;
  color:var(--bt,#FFE29A)!important;-webkit-text-fill-color:var(--bt,#FFE29A)!important;-webkit-text-stroke:.09em var(--bs,#2A1200);paint-order:stroke fill;text-shadow:0 0 .3em rgba(255,214,110,.8)}
${ZA} .regitem{color:var(--zink)!important;font-family:Lexend,system-ui,sans-serif;border-radius:10px!important}
${ZA} .regitem:hover,${ZA} .regitem:focus-visible{background:rgba(255,255,255,.65)!important;box-shadow:0 0 0 2px color-mix(in srgb,var(--bf) 35%,transparent);outline:none}
${ZA} .rnr{color:var(--zakz);font:600 .9rem Fredoka,Lexend,system-ui,sans-serif;font-variant-numeric:tabular-nums}

${Object.entries(FARBE).map(([id,[t,s]]) => `${ZA}[data-buch="${id}"]{--bt:${t};--bs:${s}}`).join("\n")}

/* Kapitelseite und Themenseite (.libart.zbk): eine Pergamentseite im Einband */
${K}{position:relative;isolation:isolate;overflow:visible;max-width:880px;margin:34px auto 90px!important;padding:34px clamp(20px,4vw,48px) 40px!important;border:0!important;border-radius:16px!important;color:var(--zink)!important;
  background:radial-gradient(ellipse 80% 30% at 50% 0%,rgba(255,255,255,.75),transparent 70%),radial-gradient(circle at 8% 92%,rgba(196,140,50,.12),transparent 30%),radial-gradient(circle at 95% 40%,rgba(196,140,50,.08),transparent 26%),linear-gradient(180deg,var(--zp1),var(--zp2))!important;
  box-shadow:inset 0 0 40px -18px rgba(120,80,20,.45),0 0 0 3px #EBDCB4,0 0 0 15px var(--bf),0 0 0 18px var(--zgold),0 0 0 21px var(--bf2),0 34px 54px -20px rgba(20,8,40,.7),0 0 80px -6px color-mix(in srgb,var(--bf) 60%,transparent)!important}
${K} .zband{bottom:-62px}
${K} .zfunken{inset:-34px}
${K}>header{display:grid;justify-items:center;gap:8px;text-align:center;margin-bottom:14px!important}
${K} .zkemo{position:relative;display:grid;place-items:center;width:112px;height:112px;margin:10px 0 12px}
${K} .zkemo .mkreis{width:190%}
${K} .zkemo::before{content:"";position:absolute;inset:-30%;border-radius:50%;background:radial-gradient(circle,rgba(255,220,130,.55),transparent 65%)}
${K} .zkemo .aemo{position:relative;display:grid;place-items:center;width:100%;height:100%;border-radius:50%;font-size:3.1rem!important;line-height:1;animation:zbschweb 4.8s ease-in-out infinite;
  background:radial-gradient(circle at 35% 28%,color-mix(in srgb,var(--bf) 40%,#fff),var(--bf) 55%,var(--bf2));
  box-shadow:inset 0 0 0 4px var(--zgold),inset 0 0 0 8px color-mix(in srgb,var(--bf2) 70%,transparent),inset 0 0 0 9px rgba(255,226,154,.5),0 10px 18px -6px rgba(60,30,5,.5),0 0 22px rgba(255,214,110,.6)}
${K} .zkemo .aemo .emo-i{font-size:3.1rem}
${K} .zkemo .aemo img{width:66%;height:66%;object-fit:contain;filter:drop-shadow(0 3px 4px rgba(0,0,0,.35))}
${K}>header h1{margin:0!important;max-width:100%;font:900 clamp(1.9rem,4.4vw,2.9rem)/1.12 "Cinzel Decorative",Georgia,serif!important;color:var(--bt,#FFE29A)!important;text-wrap:balance;overflow-wrap:break-word;
  -webkit-text-stroke:.13em var(--bs,#2A1200);paint-order:stroke fill;text-shadow:0 .06em 0 var(--bs,#2A1200),0 0 .45em rgba(255,214,110,.85)!important;letter-spacing:.01em}
${K}>header .libdesc{margin:2px 0 0!important;text-align:center!important;font:600 .98rem/1.45 Fredoka,Lexend,system-ui,sans-serif!important;color:var(--zakz)!important;max-width:60ch}
${K}>header .libdesc::first-letter{all:unset}
${K}>header .bstat{margin-top:8px!important}
${K} h3{display:flex;align-items:center;justify-content:center;gap:14px;margin:26px 0 14px!important;font:900 1.6rem/1.15 "Cinzel Decorative",Georgia,serif!important;color:var(--zakz)!important;text-align:center;text-shadow:0 0 .4em rgba(255,214,110,.6)}
${K} h3::before,${K} h3::after{content:"";flex:1;max-width:110px;height:12px;background:radial-gradient(circle,var(--zgold) 3px,transparent 4px) center/12px 12px no-repeat,linear-gradient(var(--zgold),var(--zgold)) center/100% 2px no-repeat}
${K} .libsuche{margin:6px 0 4px}
${K} .reg{min-width:0}
${K} .regitem{font-size:1rem}
${K} .regitem small{color:var(--soft)!important}
${K} .empty{color:var(--zink2)!important}
${K} .segs{justify-content:center;gap:8px!important}
${K} .segs .seg{min-height:46px;border-radius:999px!important;border:2px solid #D9B266!important;background:#FFF8E6!important;color:var(--zink)!important;font:600 .95rem Fredoka,Lexend,system-ui,sans-serif!important;box-shadow:0 3px 0 #D9B266!important}
${K} .segs .seg[aria-pressed="true"]{background:linear-gradient(160deg,var(--bf),var(--bf2))!important;color:#FFE29A!important;border-color:var(--zgold)!important;box-shadow:0 3px 0 var(--bf2),0 0 14px -2px color-mix(in srgb,var(--bf) 75%,transparent)!important}
${K} .top10{background:rgba(255,255,255,.5)!important;border:2px solid #D9B266!important;box-shadow:none!important;color:var(--zink)}
${K} .merkliste{list-style:none;padding:0!important;display:grid;gap:8px;margin:0}
${K} .merkliste li{position:relative;padding:8px 12px 8px 40px;border-radius:14px;background:rgba(255,255,255,.55);box-shadow:0 0 0 1.5px color-mix(in srgb,var(--zgold) 55%,transparent);line-height:1.5;font-size:1rem}
${K} .merkliste li::before{content:"";position:absolute;left:12px;top:.75em;width:16px;height:16px;background:radial-gradient(circle at 35% 28%,#FFF6CF,#F0C65A 55%,#B9851E);clip-path:polygon(50% 0,61% 39%,100% 50%,61% 61%,50% 100%,39% 61%,0 50%,39% 39%)}
${K} .wk{background:#FFFBF0!important;border:2px solid #D9B266!important;color:var(--zink)!important;box-shadow:0 6px 14px -8px rgba(90,55,10,.5)}
${K} .wk a{color:var(--zakz)!important}
${K} .wknav button{border-color:#D9B266!important;background:#FFF8E6!important;color:var(--zink)!important}
${K} .wkzahl{color:var(--zink2)!important}
${K} .libnav{justify-content:center;margin-top:24px}
:root[data-theme="dark"] ${K}{--zp1:#F1E5C7;--zp2:#E2CD9C}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) ${K}{--zp1:#F1E5C7;--zp2:#E2CD9C}}
@media (max-width:720px){
  ${K}{margin:22px 10px 80px!important;padding:24px 16px 28px!important;box-shadow:inset 0 0 30px -14px rgba(120,80,20,.45),0 0 0 2px #EBDCB4,0 0 0 10px var(--bf),0 0 0 12px var(--zgold),0 0 0 14px var(--bf2),0 24px 40px -18px rgba(20,8,40,.7)!important}
  ${K}::before{inset:-15px;background-size:40px!important}
  ${K} .zfunken{inset:0}
  ${K} .zkemo{width:88px;height:88px}${K} .zkemo .aemo{font-size:2.4rem!important}
  ${K} h3{font-size:1.3rem!important}
  ${K} .zband{bottom:-52px}
}
@media (prefers-reduced-motion:reduce){${K} .zkemo .aemo{animation:none!important}}

/* Dunkler Modus: Buch leuchtet in der Nacht, Pergament etwas gedämpft */
:root[data-theme="dark"] ${Z}{--zp1:#F1E5C7;--zp2:#E2CD9C;box-shadow:inset 0 0 0 3px var(--zgold),inset 0 0 0 7px var(--bf2),inset 0 0 0 9px rgba(255,226,154,.5),0 32px 54px -24px rgba(0,0,0,.8),0 0 90px -6px color-mix(in srgb,var(--bf) 80%,transparent),0 0 40px -10px rgba(255,214,110,.45)}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) ${Z}{--zp1:#F1E5C7;--zp2:#E2CD9C;box-shadow:inset 0 0 0 3px var(--zgold),inset 0 0 0 7px var(--bf2),inset 0 0 0 9px rgba(255,226,154,.5),0 32px 54px -24px rgba(0,0,0,.8),0 0 90px -6px color-mix(in srgb,var(--bf) 80%,transparent),0 0 40px -10px rgba(255,214,110,.45)}}

/* Handy: Seiten untereinander, Buch klein neben dem Titel */
@media (max-width:720px){
  ${Z} .zlinks{position:static;gap:14px}
  ${Z}{padding:12px!important;gap:12px!important;margin:8px auto 60px;border-radius:20px}
  ${Z}::before{background-size:34px!important}
  ${Z}>.seite.links,${Z}>.seite.rechts{border-radius:12px!important;padding:18px 16px 20px!important;box-shadow:inset 0 0 26px -12px rgba(90,55,10,.45)!important}
  ${Z} .minicover{grid-template-columns:1fr;justify-items:center;gap:6px}
  ${Z} .mbuehne{width:132px;margin:22px 0 18px}
  ${Z} .mkreis{width:150%}
  ${Z} .minicover .btitel{font-size:1.7rem!important;transform:rotate(-4deg);transform-origin:left center}
  ${Z} .minicover .bunter{font-size:.9rem!important}
  ${Z} .libdesc{font-size:.95rem}
  ${Z} .siegel{width:70px}${Z} .siegel b{font-size:1.1rem}
  ${Z} .seite.rechts>h2{font-size:1.7rem!important}
  ${Z} .inhalt .rubrik{margin:16px -6px 6px!important;padding:9px 22px!important}
  ${Z} .inhalt .rubrik b{font-size:1.05rem!important}
  ${Z} .inhalt .rbemo{width:34px;height:34px;font-size:1.15rem!important}
  ${Z} .knr{width:30px;height:30px;min-width:30px!important;font-size:.8rem!important}
  ${Z} .kemo{width:34px;height:34px;font-size:1.15rem!important;border-radius:11px}
  ${Z} .kapitel{gap:9px!important;padding:9px 8px!important}
  ${Z} .kt b{font-size:.98rem!important}
  ${Z} .kapitel:hover,${Z} .kapitel:focus-visible{transform:none}
  ${Z} .kseite{font-size:.82rem!important}
  ${Z} .inhalt .rubrik{flex-wrap:wrap}
  ${Z} .zfunken{inset:0}
  ${Z} .zband{bottom:-40px}
}
@media (prefers-reduced-motion:reduce){${ZA} .mkreis svg,${Z} .mbild,${ZA} .zfunken i,${ZA} .zband{animation:none!important}${ZA} .zfunken i{opacity:.7}${Z} .kapitel:hover .kemo{animation:none}}`;
  document.head.appendChild(c);
})();

/* ===== Themen am Handy/iPad: Bereich-Kacheln mit Dejans Grafiken vom Computer (img/kacheln/bereich-*.webp)
   als Neun-Teile-Bild auf einer eigenen Ebene (::before), Symbol unverzerrt unten rechts. Weisses Symbol-Kästchen weg. ===== */
(function(){
  const K = "img/kacheln/", P = "html body.ep-app .ap-themen .apb";
  const BILD = {welt:"welt", natur:"natur", geld:"geld", alltag:"alltag"};
  const c = document.createElement("style"); c.id = "ep-themen-bereich-css";
  c.textContent = `
${P}[data-af]{background:none!important;box-shadow:0 14px 26px -16px rgba(20,10,60,.7)!important;overflow:visible!important;border-radius:0!important;isolation:isolate}
${P}[data-af]::before{content:""!important;display:block!important;position:absolute!important;inset:0!important;z-index:-1!important;pointer-events:none;
  border:0 solid transparent!important;border-width:calc(var(--bs,.3px)*95) calc(var(--bs,.3px)*440) calc(var(--bs,.3px)*385) calc(var(--bs,.3px)*90)!important;
  border-image-slice:95 440 385 90 fill!important;border-image-repeat:stretch!important;box-sizing:border-box;opacity:1!important;background:none!important}
${Object.keys(BILD).map(id => `${P}[data-af="${id}"][data-af]{background-image:none!important}`).join("\n")}
${P}[data-af] .apb-kopf{grid-template-rows:auto auto auto 1fr!important;align-content:start!important}
${P}[data-af] .apb-kopf b{margin-top:8px!important;max-width:100%!important}
${Object.entries(BILD).map(([id, f]) => `${P}[data-af="${id}"]::before{border-image-source:url("${K}bereich-${f}.webp?v=2")!important}`).join("\n")}
${P}[data-af] .apem,${P}[data-af] .apwm{display:none!important}
${P}[data-af] .apb-kopf b,${P}[data-af] .apb-kopf small{text-shadow:0 2px 4px rgba(0,0,0,.45)!important}`;
  document.head.appendChild(c);
  function mass(){ document.querySelectorAll(P.replace("html body.ep-app ", "body.ep-app ") + "[data-af]").forEach(b => {
    const w = b.offsetWidth, h = b.offsetHeight; if(!w || !h) return;
    const s = Math.min(w * .7 / 530, h * .6 / 480); b.style.setProperty("--bs", s.toFixed(4) + "px"); }); }
  let tm; const bald = () => { clearTimeout(tm); tm = setTimeout(mass, 60); };
  new MutationObserver(bald).observe(document.body, {childList:true, subtree:true});
  addEventListener("resize", bald);
})();

/* ===== Startseite Handy/iPad: Karussell oben im neuen Glanz-Stil (Dejans Glanz-Kacheln, Goldmünze als Symbol,
   goldener Grafik-Knopf, goldene Punkte, Funkeln). Farbe je Folie in Liste FARBE. ===== */
(function(){
  const E = "img/grafik/entdecken/", G = "img/grafik/", P = "html body.ep-app .ap-karu .ap-held";
  const FARBE = {"hs-start":"kopf.webp?v=1", "hs-forscher":"kachel-04.webp?v=3", "hs-x":"kachel-06.webp?v=3", "hs-lib1":"kachel-03.webp?v=3",
    "hs-lib2":"kachel-12.webp?v=3", "hs-tq":"kachel-01.webp?v=3", "hs-live":"kachel-05.webp?v=3", "hs-duell":"kachel-02.webp?v=3", "hs-wdh":"kachel-11.webp?v=3"};
  const c = document.createElement("style"); c.id = "ep-karussell-css";
  c.textContent = `
${P}{background:none!important;box-shadow:none!important;border:0 solid transparent!important;border-radius:0!important;border-width:26px!important;
  border-image:url("${E}kachel-06.webp?v=3") 46 fill / 26px stretch!important;padding:0 2px!important;box-sizing:border-box!important;filter:none!important}
${P}::before{display:none!important}
${P}::after{display:none!important}
${Object.entries(FARBE).map(([k, f]) => `${P}.${k}{border-image-source:url("${E}${f}")!important}`).join("\n")}
${P}.hs-start{border-image-slice:50 fill!important}
${P} .apht{gap:6px!important}
${P} h1{text-shadow:0 3px 0 rgba(20,8,60,.25),0 0 18px rgba(255,255,255,.25)!important}
${P} .aphoi{font:800 13px/1.1 Lexend,system-ui,sans-serif!important;color:#FFE9A8!important;letter-spacing:.01em;white-space:normal;text-shadow:0 1px 2px rgba(0,0,0,.4)}
${P} .aph-ic{width:34px!important;height:34px!important;border-radius:50%!important;background:radial-gradient(circle at 35% 30%,#FFF6C8,#FFD34D 45%,#E59A12 100%)!important;
  box-shadow:0 0 0 2px #FFF3C2,0 4px 8px rgba(80,40,0,.35),0 0 14px rgba(255,214,110,.7)!important;font-size:18px!important}
${P} .aph-ic{flex:none!important;overflow:visible!important;line-height:0!important;padding:0!important}
${P} .aphoi{overflow:visible!important;padding:4px 0 4px 4px!important;margin:-4px 0 -4px -4px!important;contain:none!important}
${P} .apht{overflow:visible!important;contain:none!important}
${P} .aph-ic img,${P} .aph-ic .ic img{width:22px!important;height:22px!important;max-width:none!important;object-fit:contain!important;margin:0!important;transform:none!important;position:static!important}
${P} .aph-ic .ic{display:grid!important;place-items:center!important;width:22px!important;height:22px!important;margin:0!important;padding:0!important;background:none!important;box-shadow:none!important;border:0!important;overflow:visible!important}
${P} .apzahlen{color:rgba(255,255,255,.95)!important;text-shadow:0 1px 3px rgba(0,0,0,.35)}
${P} .ap-weissbtn{all:unset;box-sizing:border-box!important;display:inline-flex!important;align-items:center;justify-content:center;gap:6px;height:46px!important;padding:0 8px!important;
  margin-top:auto!important;cursor:pointer;border:0 solid transparent!important;border-width:13px 22px!important;border-image:url("${G}knopf-gold.webp?v=1") 52 87 fill / 13px 22px stretch!important;
  color:#3A1C00!important;font:800 15px/1 Fredoka,Lexend,system-ui,sans-serif!important;white-space:nowrap;filter:drop-shadow(0 4px 5px rgba(120,70,0,.3));align-self:flex-start}
${P} .ap-weissbtn svg{width:15px;height:15px;color:#3A1C00}
${P} .apht{position:relative;z-index:4!important;overflow:visible!important}
${P} .ap-weissbtn{max-width:none!important;flex:none!important;width:auto!important;min-width:max-content!important}
${P} .ap-weissbtn img{width:20px!important;height:20px!important}
${P} .ap-weissbtn:active{transform:scale(.96)}
${P} .ep-funkel{position:absolute;z-index:3;pointer-events:none;color:#FFF3C2;text-shadow:0 0 8px #FFD34D,0 0 14px rgba(255,214,110,.8);animation:epFunkel 2.6s ease-in-out infinite}
@keyframes epFunkel{0%,100%{opacity:.15;transform:scale(.6) rotate(0)}50%{opacity:1;transform:scale(1.15) rotate(25deg)}}
html body.ep-app .ap-karu-punkte i{background:rgba(255,255,255,.45)!important;box-shadow:none!important}
html body.ep-app .ap-karu-punkte i.an{background:linear-gradient(90deg,#FFE680,#FFB000)!important;box-shadow:0 0 8px rgba(255,200,60,.8)!important}
@media (prefers-reduced-motion: reduce){${P} .ep-funkel{animation:none}}
@media (max-width:380px){${P} .ap-weissbtn{height:40px!important;font-size:13px!important;border-width:11px 18px!important;border-image-width:11px 18px!important}}`;
  document.head.appendChild(c);
  /* drei kleine Funkelsterne pro Folie */
  function funkeln(){ document.querySelectorAll("body.ep-app .ap-karu .ap-held").forEach(s => { if(s.querySelector(".ep-funkel")) return;
    [["8%","58%","14px","0s"],["30%","88%","10px",".9s"],["74%","50%","12px","1.7s"]].forEach(([t, l, f, d]) => {
      const i = document.createElement("i"); i.className = "ep-funkel"; i.textContent = "✦"; i.setAttribute("aria-hidden", "true");
      i.style.cssText = `top:${t};left:${l};font-size:${f};animation-delay:${d}`; s.appendChild(i); }); }); }
  let tm; new MutationObserver(() => { clearTimeout(tm); tm = setTimeout(funkeln, 80); }).observe(document.body, {childList:true, subtree:true});
})();

/* ===== Entdecken-Unterseiten: alle übrigen alten Knöpfe im neuen Stil.
   Hauptknöpfe = goldener Grafik-Knopf, Nebenknöpfe = weisse Grafik-Pille, Reiter/Filter = weisse Glas-Pillen (gewählt: Violett-Pink).
   Neue Knopf-Klassen in den Listen GOLD, WEISS, PILLE eintragen. ===== */
(function(){
  const G = "img/grafik/", E = G + "entdecken/", W = "html body #app .xseite";
  const GOLD = [".spr-knopf", ".fq-weiter", ".xmt-weiter", ".xt-btn", ".xf-btn", ".xfo-btn", ".xel-btn.hell", ".xof-btn.xof-haupt", ".wdh-btn2", ".fq-start"];
  const WEISS = [".xmt-zur", ".hlf-btn", ".xof-btn:not(.xof-haupt)"];
  const PILLE = [".xel-btn:not(.hell)", ".xfo-tab", ".xa-tab", ".xel-tab", ".alb-chip", ".xf-ab", ".xs-schalter", ".hlf-sw", ".fq-figwahl", ".fq-plus", ".fq-seg button", ".hlf-k button:not(.hlf-btn)", ".spr-stufen button", ".spr-richtung button", ".spr-modi button", ".xmt-seg button", ".xmt-chip", ".xmt-opt"];
  const GOLD2 = [".spr-knopf", ".fq-weiter", ".spr-zur", ".xmt-los", ".xsw-los"];
  const sel = (l, z = "") => l.map(k => `${W} ${k}${z}`).join(",");
  const c = document.createElement("style"); c.id = "ep-welten-knoepfe-css";
  c.textContent = `
${sel(GOLD)}{background:none!important;background-color:transparent!important;box-shadow:none!important;border-radius:0!important;border:0 solid transparent!important;border-width:15px 26px!important;
  border-image:url("${G}knopf-gold.webp?v=1") 52 87 fill / 15px 26px stretch!important;min-height:52px!important;padding:0 8px!important;box-sizing:border-box!important;
  color:#3A1C00!important;font-weight:800!important;text-shadow:none!important;filter:drop-shadow(0 4px 6px rgba(120,70,0,.28));cursor:pointer}
${sel(GOLD, " *")}{color:#3A1C00!important;text-shadow:none!important}
${sel(WEISS)}{background:none!important;background-color:transparent!important;box-shadow:none!important;border-radius:0!important;border:0 solid transparent!important;border-width:14px 24px!important;
  border-image:url("${G}knopf-zurueck.webp?v=1") 70 118 fill / 14px 24px stretch!important;min-height:48px!important;padding:0 6px!important;box-sizing:border-box!important;
  color:#28304A!important;font-weight:800!important;text-shadow:none!important;filter:drop-shadow(0 3px 5px rgba(40,30,120,.2));cursor:pointer}
${sel(WEISS, " *")}{color:#28304A!important;text-shadow:none!important}
${sel(PILLE)}{background:rgba(255,255,255,.9)!important;color:#2A1F5C!important;border:2px solid #fff!important;border-radius:999px!important;
  box-shadow:0 4px 10px rgba(40,30,120,.18)!important;text-shadow:none!important;font-weight:800!important;backdrop-filter:blur(6px)}
${sel(PILLE, " :is(span,b,small,i)")}{color:inherit!important;text-shadow:none!important}
${sel(PILLE.map(k => k + ":is(.an,[aria-pressed=true],[aria-selected=true],[aria-checked=true])"))}{background:linear-gradient(135deg,#7B3FE4,#E2457A)!important;color:#fff!important;border-color:#fff!important;
  box-shadow:0 6px 14px rgba(123,63,228,.45)!important}
${sel(PILLE.map(k => k + " i"))}{background:rgba(42,31,92,.12)!important;color:inherit!important;border-radius:999px;padding:1px 7px;font-style:normal}
${sel(PILLE.map(k => k + ":is(.an,[aria-pressed=true],[aria-selected=true]) i"))}{background:rgba(255,255,255,.25)!important}
/* Forscher: Abzeichen-Karten auf Glanz-Kacheln, Medaillen-Felder als helles Glas */
${W} .xfo-abz-k.xfo-abz-k{background:none!important;box-shadow:none!important;border:0 solid transparent!important;border-radius:0!important;border-width:20px!important;
  border-image:url("${E}kachel-04.webp?v=3") 46 fill / 20px stretch!important;filter:drop-shadow(0 8px 14px rgba(30,30,90,.25));box-sizing:border-box}
${[["1","04"],["2","12"],["3","06"],["4","01"],["5","05"],["6","13"]].map(([n, k]) => `${W} .xfo-abz-k:nth-child(6n+${n}){border-image-source:url("${E}kachel-${k}.webp?v=3")!important}`).join("\n")}
${W} .xfo-abz-k :is(b,small){text-shadow:0 1px 2px rgba(0,0,0,.45)}
${W} .xfo-abz-k .xfo-med{background:rgba(255,255,255,.18)!important;border:1.5px solid rgba(255,255,255,.35)!important;border-radius:16px!important}
${W} :is(.xfo-liste-kopf b,.xfo-liste-kopf small,.xfo-liste-kopf>span){background:rgba(255,255,255,.9)!important;color:#2A1F5C!important;text-shadow:none!important}
${W} :is(.xfo-tipp,.xfo-abz-fuss,.xfo-hinweis){background:rgba(255,255,255,.9)!important;color:#2A1F5C!important;border:2px solid #fff!important;text-shadow:none!important}
@media (max-width:700px){${sel(GOLD)}{border-width:13px 22px!important;border-image-width:13px 22px!important;min-height:46px!important}
  ${sel(WEISS)}{border-width:12px 20px!important;border-image-width:12px 20px!important;min-height:44px!important}}`;
  document.head.appendChild(c);
})();

/* ===== Duell: Team-Wahl als zwei grosse Team-Karten (Lumi magenta, Milo blau) auf Glanz-Kacheln, mit Kind, Joker in goldener Münze,
   gewähltes Team leuchtet golden mit «Dein Team», das andere tritt zurück. Markup in teamBox() (duell2.js). ===== */
(function(){
  const E = "img/grafik/entdecken/", T = "html body #app .du2-team.du2-team2";
  const c = document.createElement("style"); c.id = "ep-teamwahl-css";
  c.textContent = `
html[data-scr] ${T}.du2-team2,${T}{border:0!important;border-image:none!important;background:none!important;box-shadow:none!important;filter:none!important;border-radius:0!important}
${T}{all:unset;display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:10px!important;box-sizing:border-box;width:100%;min-height:0!important;padding:0!important;position:relative!important}
${T}::before,${T}::after{display:none!important}
${T} .lbl{position:static!important;align-self:flex-start;display:inline-block;padding:6px 14px;border-radius:999px;background:rgba(255,255,255,.92);color:#2A1F5C!important;
  font:800 .85rem Lexend,system-ui,sans-serif!important;letter-spacing:.04em;text-transform:none!important;box-shadow:0 4px 10px rgba(40,30,120,.18)}
${T} .du2-kids{display:grid!important;grid-template-columns:1fr 1fr!important;gap:12px!important;width:100%;flex-direction:row!important}
${T} .du2-tk{all:unset;box-sizing:border-box;position:relative;cursor:pointer;display:grid;grid-template-rows:auto auto 1fr;justify-items:center;text-align:center;gap:4px;
  padding:2px 4px 6px;min-width:0;border:0 solid transparent;border-width:22px;border-image:url("${E}kachel-05.webp?v=3") 46 fill / 22px stretch;color:#fff;
  filter:drop-shadow(0 10px 16px rgba(30,10,80,.3));transition:transform .2s,filter .2s,opacity .2s}
${T} .du2-tk.milo{border-image-source:url("${E}kachel-01.webp?v=3")}
${T} .du2-tk.leni{border-image-source:url("${E}kachel-03.webp?v=3")}
${T} .du2-tk.ben{border-image-source:url("${E}kachel-04.webp?v=3")}
${T} .du2-kids{grid-template-columns:repeat(4,minmax(0,1fr))!important}
@media (max-width:760px){${T} .du2-kids{grid-template-columns:1fr 1fr!important;row-gap:30px!important}}
${T} .du2-tk:hover{transform:translateY(-3px)}
${T} .du2-tk:focus-visible{outline:3px solid #FFE14D;outline-offset:4px}
${T} .tk-bild{height:170px!important;width:auto!important;max-width:100%;object-fit:contain;margin:-6px 0 -2px;filter:drop-shadow(0 6px 8px rgba(20,8,60,.35));transition:transform .25s}
${T} .du2-tk > span:not(.tk-haken),${T} .du2-tk.an > span:not(.tk-haken),${T} .du2-tk .tk-joker > :not(.tk-muenze){background:none!important;background-color:transparent!important;box-shadow:none!important;padding:0!important}
${T} .du2-tk .tk-joker{background:rgba(255,255,255,.16)!important}
${T} .tk-name{padding:0!important;font:800 1.25rem/1.1 Fredoka,Lexend,system-ui,sans-serif;text-shadow:0 2px 3px rgba(20,8,60,.45)}
${T} .tk-joker{display:grid;justify-items:center;gap:2px;margin-top:2px;padding:8px 8px 6px;border-radius:16px;background:rgba(255,255,255,.16);border:1.5px solid rgba(255,255,255,.35);width:100%;box-sizing:border-box}
${T} .tk-muenze{font-style:normal;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;font-size:18px;
  background:radial-gradient(circle at 35% 30%,#FFF6C8,#FFD34D 45%,#E59A12 100%);box-shadow:0 0 0 2px #FFF3C2,0 3px 6px rgba(80,40,0,.35)}
${T} .tk-joker b{font:800 .92rem/1.15 Fredoka,Lexend,system-ui,sans-serif;color:#FFE9A8;text-shadow:0 1px 2px rgba(0,0,0,.4)}
${T} .tk-joker em{font:700 .66rem/1.2 Lexend,system-ui,sans-serif;font-style:normal;color:rgba(255,255,255,.75);letter-spacing:.03em;margin-top:2px}
${T} .tk-joker small{font:500 .74rem/1.3 Lexend,system-ui,sans-serif;color:rgba(255,255,255,.95);text-shadow:0 1px 2px rgba(0,0,0,.35)}
${T} .tk-haken{position:absolute;top:-30px;left:50%;transform:translateX(-50%) scale(.6);opacity:0;z-index:3;white-space:nowrap;padding:5px 12px;border-radius:999px;
  background:linear-gradient(180deg,#FFE680,#FFB000);color:#5A3300;font:800 .78rem Fredoka,Lexend,system-ui,sans-serif;box-shadow:0 0 0 2px #fff,0 4px 10px rgba(120,70,0,.4);transition:.25s}
${T}:has(.du2-tk.an) .du2-tk:not(.an){filter:saturate(.45) brightness(.88) drop-shadow(0 6px 10px rgba(30,10,80,.2));transform:scale(.96)}
${T} .du2-tk.an{filter:drop-shadow(0 0 0 #fff) drop-shadow(0 0 10px rgba(255,225,77,.95)) drop-shadow(0 10px 16px rgba(30,10,80,.35))}
${T} .du2-tk.an .tk-haken{opacity:1;transform:translateX(-50%) scale(1)}
${T} .du2-tk.an .tk-bild{transform:scale(1.08) translateY(-3px);animation:tkHuepf 2.2s ease-in-out infinite}
@keyframes tkHuepf{0%,100%{transform:scale(1.08) translateY(-3px)}50%{transform:scale(1.08) translateY(-9px)}}
${T} .du2-joker-info{display:none!important}
@media (max-width:420px){${T} .du2-tk{border-width:16px;border-image-width:16px}${T} .tk-bild{height:140px!important}${T} .tk-name{font-size:1.05rem}${T} .tk-haken{top:-24px}}
@media (prefers-reduced-motion: reduce){${T} .du2-tk.an .tk-bild{animation:none}}`;
  document.head.appendChild(c);
})();

/* ===== Duell: Team-Karten (4 Teams) schöner und alle gleich gross ===== */
(function(){
  const T = "html body #app .du2-team.du2-team2";
  const c = document.createElement("style"); c.id = "ep-teamwahl2-css";
  c.textContent = `
${T} .du2-kids{align-items:stretch!important;grid-auto-rows:1fr!important}
${T} .du2-tk{height:100%;grid-template-rows:auto auto 1fr!important;align-content:stretch;transform:none!important;isolation:isolate;overflow:visible}
${T} .du2-tk::before{content:"";position:absolute;z-index:-1;left:50%;top:6px;width:150px;height:150px;transform:translateX(-50%);border-radius:50%;
  background:radial-gradient(circle,rgba(255,255,255,.55) 0,rgba(255,255,255,.18) 45%,transparent 70%);pointer-events:none}
${T} .du2-tk::after{content:"✦  ✧";position:absolute;top:10px;left:10px;right:10px;display:flex;justify-content:space-between;color:#FFF3C2;font-size:14px;
  text-shadow:0 0 8px #FFD34D;pointer-events:none;animation:tkFunkel 2.8s ease-in-out infinite}
@keyframes tkFunkel{0%,100%{opacity:.35}50%{opacity:1}}
${T} .tk-bild{height:160px!important;width:100%!important;object-fit:contain!important;object-position:center bottom}
${T} .tk-name{display:inline-block;margin:2px auto 4px;padding:3px 14px!important;border-radius:999px;background:rgba(20,8,60,.28)!important;
  border:1.5px solid rgba(255,255,255,.45);font-size:1.15rem!important;letter-spacing:.01em}
${T} .du2-tk.du2-tk > span.tk-joker.tk-joker{align-self:stretch;align-content:start;background:rgba(255,255,255,.93)!important;border:2px solid #fff!important;border-radius:18px!important;
  box-shadow:0 6px 14px rgba(20,8,60,.22)!important;padding:26px 8px 9px!important;margin-top:16px;position:relative}
${T} .du2-tk .tk-joker .tk-muenze.tk-muenze{width:38px!important;height:38px!important;position:absolute;top:-18px;left:50%;transform:translateX(-50%)}
${T} .du2-tk.du2-tk .tk-joker.tk-joker > b{color:var(--tk,#7A1F8E)!important;text-shadow:none!important;font-size:.95rem!important}
${T} .du2-tk.du2-tk .tk-joker.tk-joker > small{color:#3B2F66!important;text-shadow:none!important;font-weight:600!important}
${T} .du2-tk.du2-tk .tk-joker.tk-joker > em{color:#8A80A8!important}
${T} .du2-tk.lumi{--tk:#B0216F}${T} .du2-tk.milo{--tk:#1E3FB0}${T} .du2-tk.leni{--tk:#B4560A}${T} .du2-tk.ben{--tk:#0E7A3E}
${T}:has(.du2-tk.an) .du2-tk:not(.an){filter:saturate(.55) brightness(.9) drop-shadow(0 6px 10px rgba(30,10,80,.2))!important}
${T} .du2-tk.an{filter:drop-shadow(0 0 10px rgba(255,225,77,.95)) drop-shadow(0 10px 16px rgba(30,10,80,.35))!important}
${T} .du2-tk.an .tk-bild{animation:tkHuepf2 2.2s ease-in-out infinite}
@keyframes tkHuepf2{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
@media (max-width:760px){${T} .tk-bild{height:104px!important}${T} .du2-tk::before{width:110px;height:110px}${T} .tk-name{font-size:1rem!important;padding:2px 10px!important}${T} .du2-tk.du2-tk > span.tk-joker.tk-joker{padding:22px 5px 6px!important;margin-top:14px}${T} .du2-tk.du2-tk .tk-joker.tk-joker > small{font-size:.72rem!important;line-height:1.2}${T} .du2-tk.du2-tk .tk-joker.tk-joker > b{font-size:.8rem!important}}
@media (prefers-reduced-motion: reduce){${T} .du2-tk::after,${T} .du2-tk.an .tk-bild{animation:none}}`;
  document.head.appendChild(c);
})();

/* ===== Duell: Team-Wahl mit mehr Glanz, grösserem Titel, Handy kompakt ===== */
(function(){
  const T = "html body #app .du2-team.du2-team2";
  const c = document.createElement("style"); c.id = "ep-teamwahl3-css";
  c.textContent = `
${T} > .tk-titel{display:block!important;width:max-content;max-width:100%;margin:0 auto 26px!important;padding:10px 30px!important;border-radius:999px!important;
  background:linear-gradient(180deg,#FFE680,#FFB72E)!important;border:3px solid #fff!important;box-shadow:0 6px 0 #D9861A,0 10px 22px rgba(120,60,0,.3)!important;
  font:800 clamp(1.35rem,2.6vw,1.9rem)/1.1 Fredoka,system-ui,sans-serif!important;color:#5A2C00!important;text-shadow:0 1px 0 rgba(255,255,255,.6)!important;letter-spacing:.01em;text-align:center}
${T} .du2-tk > i.tk-glanz,${T} .du2-tk > i.tk-fk{display:none}
${T} .du2-tk.an > i.tk-glanz{display:block;position:absolute;inset:0;z-index:2;pointer-events:none;border-radius:inherit;
  background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.55) 45%,rgba(255,240,180,.25) 52%,transparent 64%) no-repeat;background-size:250% 100%;
  animation:tkGlanz 2.6s ease-in-out infinite}
@keyframes tkGlanz{0%{background-position:150% 0}60%,100%{background-position:-60% 0}}
${T} .du2-tk.an > i.tk-fk{display:block;position:absolute;z-index:3;pointer-events:none;font-style:normal;color:#FFF6C8;
  text-shadow:0 0 6px #FFD84D,0 0 14px #FFB300;animation:tkStern 1.8s ease-in-out infinite}
${T} .du2-tk.an > .f1{top:14%;left:9%;font-size:22px}
${T} .du2-tk.an > .f2{top:8%;right:11%;font-size:26px;animation-delay:.4s}
${T} .du2-tk.an > .f3{top:34%;right:7%;font-size:16px;animation-delay:.9s}
${T} .du2-tk.an > .f4{top:40%;left:6%;font-size:15px;animation-delay:1.2s}
${T} .du2-tk.an > .f5{top:24%;left:22%;font-size:12px;animation-delay:.7s}
${T} .du2-tk.an > .f6{top:22%;right:25%;font-size:13px;animation-delay:1.5s}
@keyframes tkStern{0%,100%{opacity:0;transform:scale(.4) rotate(0)}50%{opacity:1;transform:scale(1.15) rotate(25deg)}}
${T} .du2-tk.an{
  filter:drop-shadow(0 0 4px #FFE680) drop-shadow(0 0 14px rgba(255,214,60,1)) drop-shadow(0 0 26px rgba(255,180,40,.8)) drop-shadow(0 10px 16px rgba(30,10,80,.35))!important;
  animation:tkPuls 2.2s ease-in-out infinite}
@keyframes tkPuls{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
${T} .du2-tk.an::before{background:radial-gradient(circle,rgba(255,246,200,.85) 0,rgba(255,220,110,.35) 45%,transparent 70%)!important}
${T} .du2-tk > .tk-haken{z-index:4}
${T} .du2-tk.an .tk-name{border-color:#FFE680!important;box-shadow:0 0 12px rgba(255,220,90,.8)}
@media (max-width:760px){
  ${T} > .tk-titel{font-size:1.35rem!important;padding:8px 22px!important;margin-bottom:22px!important}
  ${T} .du2-kids{gap:16px 12px!important}
  ${T} .du2-tk{padding:14px 8px 10px!important;grid-template-rows:auto auto 1fr!important}
  ${T} .tk-bild{height:84px!important}
  ${T} .du2-tk::before,${T} .du2-tk::after{display:none}
  ${T} .tk-name{font-size:.92rem!important;margin:2px auto 0!important}
  ${T} .du2-tk.du2-tk > span.tk-joker.tk-joker{margin-top:8px!important;padding:6px 6px 7px!important;display:grid!important;grid-template-columns:28px 1fr;column-gap:6px;align-items:center;text-align:left!important}
  ${T} .du2-tk .tk-joker .tk-muenze.tk-muenze{position:static!important;transform:none!important;width:28px!important;height:28px!important;font-size:14px!important;grid-row:1}
  ${T} .du2-tk.du2-tk .tk-joker.tk-joker > b{grid-row:1;font-size:.78rem!important;line-height:1.1}
  ${T} .du2-tk.du2-tk .tk-joker.tk-joker > small{grid-column:1 / -1;font-size:.7rem!important;line-height:1.2;margin-top:4px;text-align:center}
  ${T} .du2-tk.du2-tk .tk-joker.tk-joker > em{display:none!important}
  ${T} .du2-tk > .tk-haken{font-size:.72rem!important;padding:3px 10px!important}
  ${T} .du2-tk.du2-tk .tk-joker.tk-joker > b{font-size:.74rem!important}
  ${T} .du2-tk{padding-top:18px!important}
}
@media (prefers-reduced-motion: reduce){${T} .du2-tk.an,${T} .du2-tk.an > i{animation:none!important}}`;
  document.head.appendChild(c);
})();

/* ===== Duell: Team-Karten mit Dejans Bildern (img/grafik/duell/) ===== */
(function(){
  const T = "html body #app .du2-team.du2-team2", G = "img/grafik/duell/";
  const c = document.createElement("style"); c.id = "ep-teamwahl4-css";
  c.textContent = `
${T} .du2-tk.du2-tk{border:0!important;border-image:none!important;background:url(${G}karte-lumi.webp) center/100% 100% no-repeat!important;border-radius:26px;padding:22px 14px 16px!important}
${T} .du2-tk.du2-tk.milo{background-image:url(${G}karte-milo.webp)!important}
${T} .du2-tk.du2-tk.leni{background-image:url(${G}karte-leni.webp)!important}
${T} .du2-tk.du2-tk.ben{background-image:url(${G}karte-ben.webp)!important}
${T} .du2-tk.du2-tk.an{background-image:url(${G}rahmen-gold.webp),url(${G}karte-lumi.webp)!important;background-size:104% 103%,100% 100%!important;background-position:center!important}
${T} .du2-tk.du2-tk.an.milo{background-image:url(${G}rahmen-gold.webp),url(${G}karte-milo.webp)!important}
${T} .du2-tk.du2-tk.an.leni{background-image:url(${G}rahmen-gold.webp),url(${G}karte-leni.webp)!important}
${T} .du2-tk.du2-tk.an.ben{background-image:url(${G}rahmen-gold.webp),url(${G}karte-ben.webp)!important}
${T} .du2-tk.du2-tk > span.tk-name{background:none!important;border:0!important;box-shadow:none!important;padding:0!important;margin:-6px auto 0!important;display:block;line-height:0}
${T} .tk-name img{display:block;height:64px;width:auto;max-width:100%;margin:0 auto;object-fit:contain;filter:drop-shadow(0 3px 4px rgba(20,8,60,.35))}
${T} .du2-tk .tk-joker .tk-muenze.tk-muenze{background:none!important;box-shadow:none!important;border:0!important;width:52px!important;height:52px!important;top:-28px!important;display:grid;place-items:center}
${T} .tk-muenze img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 3px 4px rgba(20,8,60,.35))}
${T} .du2-tk.du2-tk > span.tk-joker.tk-joker{padding-top:36px!important;margin-top:28px!important}
${T} .du2-tk.du2-tk > .tk-haken{top:-14px!important;bottom:auto!important}
.du-joker .ji img,.du2-joker-info img{width:1.7em;height:1.7em;object-fit:contain;vertical-align:middle}
@media (max-width:760px){
  ${T} .du2-tk.du2-tk{padding:16px 8px 10px!important;border-radius:18px}
  ${T} .tk-name img{height:44px}
  ${T} .du2-tk .tk-joker .tk-muenze.tk-muenze{width:34px!important;height:34px!important}
  ${T} .du2-tk.du2-tk > span.tk-joker.tk-joker{padding:6px 6px 7px!important;margin-top:8px!important;grid-template-columns:34px 1fr!important}
}`;
  document.head.appendChild(c);
})();

/* ===== Wochen-Challenge: Kopf im Glanz-Stil mit Dejans Symbolen ===== */
(function(){
  const H = "html body .wk2 .wk2-held";
  const c = document.createElement("style"); c.id = "ep-woche-held-css";
  c.textContent = `
${H}{background:none!important;border:30px solid transparent!important;border-image:url("img/grafik/entdecken/kopf.webp") 50 fill / 30px stretch!important;
  border-radius:0!important;box-shadow:none!important;filter:drop-shadow(0 12px 20px rgba(80,30,160,.32));padding:0 300px 0 6px!important;min-height:250px}
${H}::before,${H}::after{display:none!important}
${H} .wk2-tag{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(180deg,#FFE680,#FFB72E)!important;color:#5A2C00!important;border:2px solid #fff;
  box-shadow:0 3px 0 #D9861A;padding:4px 14px 4px 6px!important;font-size:.78rem!important}
${H} .wk2-tag img{width:26px;height:26px;object-fit:contain}
${H} .wk2-ic{width:96px!important;height:96px!important;border-radius:50%!important;transform:none!important;
  background:radial-gradient(circle at 35% 30%,#FFF7C9,#FFD24D 45%,#E7A21A 80%)!important;border:4px solid #fff!important;
  box-shadow:0 6px 0 #B97A0E,0 0 0 6px rgba(255,230,120,.35),0 14px 24px -8px rgba(60,20,0,.5)!important;animation:wk2Schweb 3s ease-in-out infinite}
${H} .wk2-ic > *{width:70%!important;height:70%!important;display:grid;place-items:center;font-size:2.6rem;background:none!important;box-shadow:none!important}
${H} .wk2-ic img{width:100%!important;height:100%!important;max-width:none!important;object-fit:contain;filter:drop-shadow(0 3px 3px rgba(80,20,0,.35))}
@keyframes wk2Schweb{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-5px) rotate(4deg)}}
${H} .wk2-titel h1{text-shadow:0 3px 0 rgba(40,10,90,.35),0 6px 18px rgba(40,10,90,.35)}
${H} .wk2-titel small{text-transform:uppercase;letter-spacing:.08em;color:#FFE680!important;font-weight:800!important}
${H} .wk2-cd{align-items:center;gap:8px!important}
${H} .wk2-cdi{width:40px;height:40px;object-fit:contain;animation:wk2Kipp 4s ease-in-out infinite}
@keyframes wk2Kipp{0%,80%{transform:rotate(0)}90%,100%{transform:rotate(180deg)}}
${H} .wk2-cd span{background:rgba(255,255,255,.95)!important;border:0!important;box-shadow:0 4px 0 rgba(40,20,100,.25);color:#2B1466;min-width:60px!important}
${H} .wk2-cd span b{color:#2B1466}${H} .wk2-cd span small{color:#7A6FA8!important;font-weight:700}
${H} .wk2-cd em{font:700 .82rem Lexend,sans-serif;font-style:normal;color:rgba(255,255,255,.9)}
${H} .wk2-ziel{position:relative;max-width:540px!important;padding-right:46px}
${H} .wk2-bar{height:16px!important;background:rgba(20,8,60,.45)!important;box-shadow:inset 0 2px 4px rgba(0,0,0,.3)}
${H} .wk2-bar i{min-width:16px;background:linear-gradient(90deg,#FFE680,#FFB72E)!important;box-shadow:0 0 10px rgba(255,214,60,.8)}
${H} .wk2-pokal{position:absolute;right:0;top:-14px;width:42px;height:42px;object-fit:contain;filter:drop-shadow(0 3px 4px rgba(0,0,0,.35))}
${H} .wk2-ziel small{display:flex!important;flex-wrap:wrap;align-items:center;gap:6px 12px;margin-top:10px!important;font-weight:700}
${H} .wk2-ziel small > img{width:22px;height:22px;object-fit:contain}
${H} .wk2-xp{display:inline-flex;align-items:center;gap:4px;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.35);border-radius:999px;padding:2px 10px 2px 4px;color:#FFE680}
${H} .wk2-xp img{width:20px;height:20px;object-fit:contain}
${H} .wk2-kids{right:6px!important;bottom:-24px!important;max-height:300px!important}
html body .wk2 .wk2-box li::before{content:""!important;width:24px;height:24px;background:url("img/grafik/diverse/gluehbirne.webp") center/contain no-repeat}
@media (max-width:760px){
  ${H}{border-width:20px!important;border-image-width:20px!important;padding:0 0 0 2px!important;min-height:0}
  ${H} .wk2-kids{height:120px!important;right:-6px!important;bottom:auto!important;top:-14px}
  ${H} .wk2-tag{font-size:.62rem!important;padding-right:10px!important}${H} .wk2-tag img{width:20px;height:20px}
  ${H} .wk2-ic{width:64px!important;height:64px!important;border-width:3px!important}
  ${H} .wk2-titel{margin:10px 0!important;gap:12px!important}
  ${H} .wk2-titel h1{font-size:1.9rem!important}
  ${H} .wk2-cdi{width:30px;height:30px}${H} .wk2-cd span{min-width:50px!important;padding:5px 4px!important}${H} .wk2-cd b{font-size:1.25rem!important}
  ${H} .wk2-cd em{display:none}
  ${H} .wk2-ziel small{font-size:.74rem}
}
@media (prefers-reduced-motion: reduce){${H} .wk2-ic,${H} .wk2-cdi{animation:none}}`;
  document.head.appendChild(c);
})();

/* ===== Entdecken: letzte alte Flächen und dunkle Pillen im neuen Stil (Prüfung aller Welten am 02.11.).
   GLANZ: farbige Flächen auf Dejans Glanz-Kacheln (feste Nummer), REIHUM: wiederholte Karten, KOPF: Köpfe,
   PILLE: dunkle Schilder/Pillen als weisse Glas-Pille, GOLDK: goldener Grafik-Knopf, WEISSK: weisser Grafik-Knopf. ===== */
(function(){
  const W = "html body #app .xseite", G = "img/grafik/entdecken/";
  const GLANZ = {".spr-k-vorne":9, ".spr-k-hinten":2, ".spr-frage":9, ".xmt-panel":2, ".xmt-karte":1, ".fq-bereit-karte":2, ".xa-weiter":5,
    ".xa-buehne":9, ".xfo-auf-kopf":13, ".xfo-sicher":10, ".xfo-panel":1};
  const REIHUM = [".spr-modus", ".xsw-karte", ".xf-ab"];
  const KOPF = [".spr-thkopf"];
  const PILLE = [".spr-zur", ".spr-pille", ".spr-hinweis", ".spr-fuss", ".xmt-pill", ".fq-klein", ".xa-pill", ".xfo-titel", ".xfo-pille.dunkel", ".xk-p-status",
    ".xk-nav", ".wdh-pille", ".xt-glas", ".alb-pill", ".alb-zahl", ".xf-pille", ".xf-titel", ".xf-tipp", ".xs-h2", ".xs-hinweis", ".xsw-info", ".hlf-vorschau",
    ".hlf-pille", ".xof-status", ".xof-netz", ".xof-h2", ".xof-auto", ".xof-tipp", ".xmt-top > span", ".xmt-best"];
  const GOLDK = [".xk-btn.haupt", ".xmt-panel .xmt-go:not(.xmt-zwei)", ".fq-gross", ".wdh-gelernt", ".xmt-t.xmt-ok"];
  const WEISSK = [".xk-btn:not(.haupt)", ".xmt-panel .xmt-go.xmt-zwei", ".xa-btn.weiss"];
  const nr = n => String(n).padStart(2, "0");
  const sel = (l, z = "") => l.map(k => `${W} ${k}${z}`).join(",");
  const dbl = l => l.map(k => `${W} ${k}${k.split(" ").pop().replace(/:.*$/, "")}`).join(",");
  let css = `
${dbl([...Object.keys(GLANZ), ...REIHUM])}{background:none!important;background-color:transparent!important;box-shadow:none!important;border:22px solid transparent!important;border-radius:0!important;
  border-image:url("${G}kachel-01.webp?v=3") 46 fill / 22px stretch!important;filter:drop-shadow(0 8px 14px rgba(30,30,90,.25));color:#fff!important;box-sizing:border-box!important}
${sel([...Object.keys(GLANZ), ...REIHUM], "::before")},${sel([...Object.keys(GLANZ), ...REIHUM], "::after")}{opacity:0!important}
${sel([...Object.keys(GLANZ), ...REIHUM], " :is(b,h2,h3,strong,small,p,span)")}{text-shadow:0 1px 2px rgba(0,0,0,.45)}
${dbl(KOPF)}{background:none!important;box-shadow:none!important;border:30px solid transparent!important;border-radius:0!important;
  border-image:url("${G}kopf.webp?v=1") 50 fill / 30px stretch!important;filter:drop-shadow(0 12px 20px rgba(60,30,160,.3));padding:0 6px!important}
${dbl(PILLE)}{background:rgba(255,255,255,.93)!important;background-image:none!important;border:1.5px solid #fff!important;color:#2B1466!important;
  box-shadow:0 3px 0 rgba(40,20,100,.14),0 6px 14px rgba(40,20,100,.12)!important;text-shadow:none!important;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
${sel(PILLE, " *")}{color:#2B1466!important;text-shadow:none!important}
${dbl(GOLDK)}{background:none!important;border:0 solid transparent!important;border-image:url("img/grafik/knopf-gold.webp?v=1") 52 87 fill / 26px 44px stretch!important;
  border-width:0!important;box-shadow:none!important;color:#5A2C00!important;text-shadow:0 1px 0 rgba(255,255,255,.5)!important;font-weight:800!important;border-radius:0!important}
${sel(GOLDK, " *")}{color:#5A2C00!important;text-shadow:none!important}
${dbl(WEISSK)}{background:none!important;border:0 solid transparent!important;border-image:url("img/grafik/knopf-zurueck.webp?v=1") 70 118 fill / 30px 50px stretch!important;
  border-width:0!important;box-shadow:none!important;color:#2B1466!important;text-shadow:none!important;font-weight:800!important;border-radius:0!important}
${sel(WEISSK, " *")}{color:#2B1466!important;text-shadow:none!important}
/* Container, die nur einen dunklen Rahmen hatten */
${W} .spr-stufen.spr-stufen,${W} .spr-richtung.spr-richtung,${W} .xel-wahl.xel-wahl{background:none!important;box-shadow:none!important;border:0!important}
/* Erzähler-Blase im Abenteuer: weisse Sprechblase */
${W} .xa-blase.xa-blase{background:rgba(255,255,255,.95)!important;color:#2B1466!important;border:2px solid #fff!important;box-shadow:0 6px 16px rgba(40,20,100,.25)!important}
${W} .xa-blase.xa-blase *{color:#2B1466!important;text-shadow:none!important}
/* Mathe-Tastatur: weisse Glas-Tasten */
${W} .xmt-t.xmt-t:not(.xmt-ok){background:rgba(255,255,255,.95)!important;background-image:none!important;color:#2B1466!important;border:2px solid #fff!important;box-shadow:0 4px 0 rgba(40,20,100,.18)!important;text-shadow:none!important}
${W} .xmt-t.xmt-del.xmt-del{color:#C2185B!important}
/* Symbole in Knöpfen und Kacheln */
${W} .spr-modus .spr-m-ic{display:block;line-height:0}
${W} .spr-modus .spr-m-ic img{width:54px;height:54px;object-fit:contain;filter:drop-shadow(0 3px 4px rgba(0,0,0,.3))}
${W} .xk-btn .xk-bic{width:26px;height:26px;object-fit:contain;vertical-align:middle;margin-right:8px}
${W} .xmt-kl .ep-gi{width:20px;height:20px;object-fit:contain;vertical-align:-4px;margin-right:4px}
@media (max-width:700px){${dbl([...Object.keys(GLANZ), ...REIHUM])}{border-width:16px!important;border-image-width:16px!important}
  ${dbl(KOPF)}{border-width:22px!important;border-image-width:22px!important}
  ${W} .spr-modus .spr-m-ic img{width:40px;height:40px}}`;
  const FOLGE = [1,2,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18];
  for(const k of REIHUM) FOLGE.forEach((n, i) => { css += `${W} ${k}${k}:nth-child(${FOLGE.length}n+${i + 1}){border-image-source:url("${G}kachel-${nr(n)}.webp?v=3")!important}\n`; });
  for(const [k, n] of Object.entries(GLANZ)) css += `${W} ${k}${k}{border-image-source:url("${G}kachel-${nr(n)}.webp?v=3")!important}\n`;
  const c = document.createElement("style"); c.id = "ep-entdecken-rest-css"; c.textContent = css; document.head.appendChild(c);
})();

/* ===== Duell-Seite: kompakter Kopf mit Elo und Modus-Wahl, grosser Play-Knopf, Einstellungen unten ===== */
(function(){
  const A = "html body #app";
  const c = document.createElement("style"); c.id = "ep-duell3-css";
  c.textContent = `
${A} .du2-modi,${A} .du2-rang{display:none!important}
${A} .du3-kopf{position:relative;display:grid;grid-template-columns:auto 1fr auto;grid-template-areas:"titel elo kids" "modi modi kids";gap:12px 18px;align-items:center;
  border:30px solid transparent;border-image:url("img/grafik/entdecken/kopf.webp?v=1") 50 fill / 30px stretch;filter:drop-shadow(0 12px 20px rgba(60,30,160,.3));
  padding:0 4px;margin:6px 0 18px;color:#fff;min-height:0}
${A} .du3-titel{grid-area:titel;display:flex;align-items:center;gap:12px}
${A} .du3-ic{width:64px;height:64px;object-fit:contain;filter:drop-shadow(0 4px 6px rgba(0,0,0,.3))}
${A} .du3-titel h1{margin:0;font:800 2.4rem/1 "Bricolage Grotesque",Fredoka,sans-serif;color:#fff;text-shadow:0 3px 0 rgba(40,10,90,.35)}
${A} .du3-titel p{margin:2px 0 0;font:700 .9rem Lexend,sans-serif;color:rgba(255,255,255,.9)}
${A} .du3-elo{grid-area:elo;justify-self:end;display:grid;grid-template-columns:auto auto;grid-template-areas:"s z" "b z" "bar bar" "em em";column-gap:14px;row-gap:2px;
  background:rgba(255,255,255,.95);border:2px solid #fff;border-radius:20px;padding:10px 16px;min-width:250px;color:#2B1466;box-shadow:0 4px 0 rgba(40,20,100,.2)}
${A} .du3-elo small{grid-area:s;font:800 .68rem Lexend,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#7A6FA8}
${A} .du3-elo b{grid-area:b;font:800 1.15rem Fredoka,Lexend,sans-serif;color:var(--lc,#6B4FD8)}
${A} .du3-zahl{grid-area:z;align-self:center;justify-self:end;font:800 1.9rem/1 "Bricolage Grotesque",sans-serif;color:#2B1466}
${A} .du3-zahl i{font:700 .75rem Lexend,sans-serif;font-style:normal;color:#7A6FA8}
${A} .du3-bar{grid-area:bar;display:block;height:9px;border-radius:999px;background:#E9E5FA;overflow:hidden;margin-top:6px}
${A} .du3-bar i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#FFE680,#FFB72E)}
${A} .du3-elo em{grid-area:em;font:600 .74rem Lexend,sans-serif;font-style:normal;color:#5D5C80;margin-top:3px}
${A} .du3-modi{grid-area:modi;display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
${A} .du3-m{all:unset;box-sizing:border-box;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;padding:10px 14px;border-radius:18px;
  background:rgba(255,255,255,.18);border:2px solid rgba(255,255,255,.45);color:#fff;font:800 1rem Fredoka,Lexend,sans-serif;transition:transform .12s}
${A} .du3-m img{width:34px;height:34px;object-fit:contain;filter:drop-shadow(0 2px 3px rgba(0,0,0,.3))}
${A} .du3-m:hover{transform:translateY(-2px)}
${A} .du3-m.an{background:#fff;color:#2B1466;border-color:#FFE680;box-shadow:0 0 0 3px #FFD84D,0 0 18px rgba(255,214,60,.8)}
${A} .du3-m:focus-visible{outline:3px solid #FFE680;outline-offset:2px}
${A} .du3-kopf > img.du3-kids{grid-area:kids;position:static!important;align-self:end;height:170px;width:auto;max-width:none;margin:-60px -14px -34px 0;filter:drop-shadow(0 10px 14px rgba(0,0,0,.35));pointer-events:none}
${A} .du3-play{all:unset;box-sizing:border-box;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:16px;width:min(560px,100%);margin:22px auto 18px;
  height:116px;padding:0 64px;border:0 solid transparent;border-image:url("img/grafik/duell/play-knopf.webp") 0 130 fill / 0 61px stretch;
  filter:drop-shadow(0 10px 16px rgba(160,90,0,.35));color:#5A2C00;text-align:left;animation:du3Puls 2.4s ease-in-out infinite}
${A} .du3-play img{width:72px;height:72px;margin-top:-6px;object-fit:contain;filter:drop-shadow(0 3px 4px rgba(0,0,0,.3))}
${A} .du3-play b{display:block;font:900 2.1rem/1 Fredoka,"Bricolage Grotesque",sans-serif;color:#fff;text-shadow:0 3px 0 #B4400A,0 0 2px #B4400A,0 5px 10px rgba(120,40,0,.35);letter-spacing:.01em}
${A} .du3-play small{display:block;margin-top:6px;font:700 .85rem Lexend,sans-serif;color:#fff;text-shadow:0 1px 2px rgba(120,40,0,.6)}
${A} .du3-play:hover{transform:translateY(-2px)}
${A} .du3-play:active{transform:translateY(2px)}
@keyframes du3Puls{0%,100%{filter:drop-shadow(0 10px 16px rgba(160,90,0,.35))}50%{filter:drop-shadow(0 10px 16px rgba(160,90,0,.35)) drop-shadow(0 0 16px rgba(255,214,60,.85))}}
@media (max-width:760px){
  ${A} .du3-kopf{grid-template-columns:1fr;grid-template-areas:"titel" "elo" "modi";border-width:20px;border-image-width:20px;padding:0 0 0 2px;gap:10px}
  ${A} .du3-kopf > img.du3-kids{position:absolute!important;height:96px;right:-4px;top:-24px;margin:0}
  ${A} .du3-ic{width:46px;height:46px}${A} .du3-titel h1{font-size:1.8rem}
  ${A} .du3-elo{justify-self:stretch;min-width:0;padding:8px 12px}${A} .du3-zahl{font-size:1.5rem}
  ${A} .du3-modi{gap:6px}${A} .du3-m{flex-direction:column;gap:3px;padding:8px 4px;font-size:.78rem;text-align:center}${A} .du3-m img{width:28px;height:28px}
  ${A} .du3-play{height:96px;gap:10px;padding:0 44px;border-image-width:0 50px;margin:16px auto 12px}
  ${A} .du3-play b{font-size:1.55rem}${A} .du3-play small{font-size:.66rem}${A} .du3-play img{width:56px;height:56px}
}
${A} .du2 details.du2-ein > summary{background:rgba(255,255,255,.93)!important;color:#2B1466!important;border:1.5px solid #fff!important;box-shadow:0 3px 0 rgba(40,20,100,.14),0 6px 14px rgba(40,20,100,.12)!important;text-shadow:none!important}
${A} .du2 details.du2-ein > summary *{color:#2B1466!important;text-shadow:none!important}
${A} .du2 details.du2-ein > summary .zus{color:#5D5C80!important}
@media (prefers-reduced-motion: reduce){${A} .du3-play{animation:none}}`;
  document.head.appendChild(c);
})();

/* ===== Entdecken: Kacheln mit grösserem Symbol, grösserer Schrift und dem Symbol als helle Silhouette im Hintergrund.
   JS sucht in jeder Glanz-Kachel (Liste KACHELN) das erste Symbol-Bild, markiert es (.ep-kic), den Titel (.ep-kti)
   und legt eine Silhouette .ep-wz in die Kachel. Neue Kachelarten in KACHELN eintragen. ===== */
(function(){
  const KACHELN = [".x-kachel", ".wdh-karte", ".spr-thema", ".spr-sp", ".spr-modus", ".spr-wdh", ".xmt-kachel", ".xsw-kachel", ".xf-karte", ".xfo-karte", ".xfo-kat",
    ".xs-stueck", ".xs-fxk", ".hlf-k", ".xel-kpi", ".xof-karte", ".xui-karte", ".fq-karte", ".xel-karte", ".xf-ab"];
  const SEL = KACHELN.map(k => "#app .xseite " + k + ", #app .x-kacheln " + k).join(",");
  function machen(){
    try{
      document.querySelectorAll(SEL).forEach(k => {
        if(k.dataset.wz) return;
        const img = k.querySelector("img.ep-gi, img.ep-welt-ic, .spr-m-ic img, img.ep-emo, img.ep-gimg, img[src*='img/grafik/'], img[src*='qeels-icons']");
        if(!img){ return; }
        k.dataset.wz = "1"; img.classList.add("ep-kic");
        const t = k.querySelector("b, h3, strong"); if(t) t.classList.add("ep-kti");
        const box = document.createElement("span"); box.className = "ep-wzbox"; box.setAttribute("aria-hidden", "true");
        const w = document.createElement("i"); w.className = "ep-wz"; w.style.backgroundImage = `url("${img.getAttribute("src")}")`;
        box.appendChild(w); k.appendChild(box);
        if(getComputedStyle(k).position === "static") k.style.position = "relative";
      });
    }catch(e){}
  }
  const app = document.getElementById("app");
  if(app) new MutationObserver(() => requestAnimationFrame(machen)).observe(app, {childList:true, subtree:true});
  const K = KACHELN.map(k => `html body #app ${k}`).join(",");
  const c = document.createElement("style"); c.id = "ep-kachel-wz-css";
  c.textContent = `
${KACHELN.map(k => `html body #app ${k}[data-wz]`).join(",")}{isolation:isolate}
html body #app .ep-wzbox{position:absolute;inset:0;overflow:hidden;container-type:size;z-index:-1;pointer-events:none;border-radius:14px;display:block!important;padding:0!important;margin:0!important;background:none!important}
html body #app .ep-wz{position:absolute;right:-18cqmin;bottom:-26cqmin;width:120cqmin;height:120cqmin;background:center/contain no-repeat;
  filter:brightness(0) invert(1);opacity:.17;transform:rotate(-16deg);pointer-events:none}
html body #app .xseite img.ep-kic,html body #app .xseite .ep-kic{width:60px!important;height:60px!important;max-width:none!important;object-fit:contain;filter:drop-shadow(0 0 6px rgba(255,255,255,.55)) drop-shadow(0 3px 4px rgba(0,0,0,.3))}
html body #app .xseite :is(.spr-th-emo,.xmt-emo,.xf-emo,.xfo-k-emo,.xs-emo,.hlf-emo,.xof-emo,.xsw-emo):has(.ep-kic){width:auto!important;height:auto!important;font-size:0!important;line-height:0!important;background:none!important;box-shadow:none!important}
html body #app .xseite .ep-kti{font-size:1.18rem!important;line-height:1.15!important}
html body #app .xseite :is(${KACHELN.join(",")})[data-wz] small{font-size:.86rem!important;line-height:1.3!important}
html body #app .xseite .spr-sp img.ep-kic{width:78px!important;height:78px!important}
html body #app .xseite .xf-ab .ep-kti{font-size:inherit!important;line-height:inherit!important}
html body #app .xseite .xf-ab img.ep-kic{width:40px!important;height:40px!important}
@media (max-width:700px){
  html body #app .xseite img.ep-kic,html body #app .xseite .ep-kic{width:44px!important;height:44px!important}
  html body #app .xseite .spr-sp img.ep-kic{width:56px!important;height:56px!important}
  html body #app .xseite .xf-ab img.ep-kic{width:32px!important;height:32px!important}
  html body #app .xseite .ep-kti{font-size:1rem!important}
  html body #app .xseite :is(${KACHELN.join(",")})[data-wz] small{font-size:.74rem!important}
  html body #app .ep-wz{opacity:.15}
}`;
  document.head.appendChild(c);
})();

/* ===== Entdecken-Kacheln: Titel so gross wie möglich, ohne Abschneiden und ohne Trennstrich.
   passe() startet bei der Höchstgrösse und verkleinert, bis der Titel in der Kachel Platz hat (kein Wort ragt hinaus,
   höchstens 3 Zeilen). Danach bekommen alle Titel einer Kachelgruppe die gleiche (kleinste) Grösse. ===== */
(function(){
  const MIN = 11;
  const MAX = el => el.closest(".xf-ab") ? (innerWidth <= 700 ? 13 : 15) : (innerWidth <= 700 ? 14 : 30);
  function passe(el){
    try{
      const k = el.closest("[data-wz]") || el.parentElement; if(!k || !k.clientWidth) return 0;
      const cs = getComputedStyle(k), r = k.getBoundingClientRect();
      const rechts = r.right - (parseFloat(cs.borderRightWidth) || 0) - (parseFloat(cs.paddingRight) || 0) + 2;
      let s = MAX(el); const setz = () => el.style.setProperty("font-size", s + "px", "important"); setz();
      const zu = () => { const e = el.getBoundingClientRect(); return el.scrollWidth > el.clientWidth + 1 || e.right > rechts || e.height > s * 1.12 * 3 + 2; };
      const min = el.closest(".xf-ab") || innerWidth <= 700 ? 8 : MIN; let n = 0; while(zu() && s > min && n++ < 40){ s -= 1; setz(); }
      return s;
    }catch(e){ return 0; }
  }
  function alle(){
    document.querySelectorAll("#app .xseite .xf-ab > small").forEach(x => x.classList.add("ep-kti"));
    const gr = new Map();
    document.querySelectorAll("#app .xseite .ep-kti, #app .x-kacheln .ep-kti").forEach(el => {
      /* Bindestrich nie als Trennstelle: geschützter Bindestrich, weiche Trennstellen weg */
      const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n;
      while((n = tw.nextNode())) if(/[-\u00AD]/.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(/\u00AD/g, "").replace(/-/g, "\u2011");
      const s = passe(el); if(!s || el.closest(".xf-ab")) return;
      const k = el.closest("[data-wz]") || el.parentElement, p = k && k.parentElement; if(!p) return;
      const g = gr.get(p) || []; g.push([el, s]); gr.set(p, g); });
    gr.forEach(g => { const m = Math.min(...g.map(x => x[1])); g.forEach(([el]) => el.style.setProperty("font-size", m + "px", "important")); });
  }
  let t = 0, t2 = 0; const plan = () => { clearTimeout(t); clearTimeout(t2); t = setTimeout(alle, 80); t2 = setTimeout(alle, 900); };
  const app = document.getElementById("app");
  if(app) new MutationObserver(m => { if(m.some(x => [...x.addedNodes].some(n => n.nodeType === 1 && !n.classList.contains("ep-wzbox")))) plan(); }).observe(app, {childList:true, subtree:true});
  addEventListener("resize", plan); if(document.fonts) document.fonts.ready.then(plan);
  const K = ".x-kachel,.wdh-karte,.spr-thema,.spr-sp,.spr-modus,.spr-wdh,.xmt-kachel,.xsw-kachel,.xf-karte,.xfo-karte,.xfo-kat,.xs-stueck,.xs-fxk,.hlf-k,.xel-kpi,.xof-karte,.xui-karte,.fq-karte,.xel-karte";
  const c = document.createElement("style"); c.id = "ep-kti-fit-css";
  c.textContent = `html body #app .ep-kti.ep-kti{display:block!important;max-width:100%!important;min-width:0!important;line-height:1.12!important;hyphens:none!important;-webkit-hyphens:none!important;
  overflow-wrap:normal!important;word-break:normal!important;white-space:normal!important;overflow:visible!important;font-weight:800!important}
html body #app [data-wz],html body #app [data-wz] *:has(> .ep-kti){min-width:0!important}
html body #app .xseite .xmt-kachel .xmt-k1{padding-right:0!important;flex-direction:column!important;align-items:flex-start!important;gap:6px!important}
html body #app .xseite .xmt-kachel .xmt-k1 > .ep-kti{width:100%!important}
html body #app .xseite .xfo-karte.xfo-karte{flex-direction:column!important;align-items:flex-start!important;gap:6px!important}
html body #app .xseite .xfo-karte .xfo-k-tx{width:100%!important;min-width:0!important}
html body #app .xseite .xs-stueck.xs-stueck{flex-wrap:wrap!important;align-items:center!important;row-gap:6px!important;position:relative}
html body #app .xseite .xs-stueck .xs-txt{flex:1 1 100%!important;order:3;min-width:0!important;width:100%!important}
html body #app .xseite .xs-stueck .xs-play{margin-left:auto!important;order:2}
html body #app .xseite .xs-stueck .xs-emo{order:1}
html body #app .xseite .xmt-kachel .xmt-k1 > .ep-kti{flex:1 1 auto!important}
html body #app .xseite :is(${K})[data-wz] small:not(.ep-kti){font-size:1rem!important;line-height:1.3!important;hyphens:none!important;overflow-wrap:normal!important}
@media (max-width:700px){html body #app .xseite :is(${K})[data-wz] small:not(.ep-kti){font-size:.84rem!important}}`;
  document.head.appendChild(c);
})();

/* ===== Entdecken am Handy: Kacheln kompakter (kleinere Schrift, Symbole, Abstände, Silhouette) ===== */
(function(){
  const K = ".x-kachel,.wdh-karte,.spr-thema,.spr-sp,.spr-modus,.spr-wdh,.xmt-kachel,.xsw-kachel,.xf-karte,.xfo-karte,.xfo-kat,.xs-stueck,.xs-fxk,.hlf-k,.xel-kpi,.xof-karte,.xui-karte,.fq-karte,.xel-karte";
  const S = `html body #app :is(${K})`;
  const c = document.createElement("style"); c.id = "ep-entdecken-handy-css";
  c.textContent = `@media (max-width:700px){
  ${S}[data-wz]{min-height:0!important;padding:4px 2px!important;gap:4px!important;border-width:14px!important;border-image-width:14px!important}
  html body #app .xseite img.ep-kic,html body #app .xseite .ep-kic,html body #app .x-kacheln img.ep-kic{width:34px!important;height:34px!important}
  html body #app .xseite .spr-sp img.ep-kic{width:42px!important;height:42px!important}
  ${S}[data-wz] small:not(.ep-kti){font-size:.72rem!important;line-height:1.25!important}
  html body #app .ep-wz{opacity:.12!important}
  html body #app .x-kacheln{gap:10px!important}
  html body #app .xseite .spr-modi,html body #app .xseite .spr-themen,html body #app .xseite .xmt-kacheln,html body #app .xseite .xfo-liste,html body #app .xseite .xs-stuecke{gap:10px!important}
  html body #app .xseite .xmt-kachel .xmt-k1{gap:3px!important}
  html body #app .xseite .xf-karte .ep-kti{font-size:inherit}
}`;
  document.head.appendChild(c);
})();

/* ===== Entdecken am Handy: drei Kacheln pro Reihe, ohne Untertitel, damit die Kacheln klein und ruhig sind ===== */
(function(){
  const G = ["x-kacheln","xmt-kacheln","xsw-kacheln","xs-stuecke","xfo-liste","spr-modi","spr-wahl"];
  const K = ".x-kachel,.xmt-kachel,.xsw-kachel,.xs-stueck,.xfo-karte,.spr-modus,.spr-sp";
  const c = document.createElement("style"); c.id = "ep-entdecken-handy3-css";
  c.textContent = `@media (max-width:700px){
  ${G.map(g => `html body #app .${g}.${g}`).join(",")}{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important}
  html body #app .xseite :is(${K})[data-wz] small:not(.ep-kti),html body #app .x-kacheln :is(${K})[data-wz] small:not(.ep-kti){display:none!important}
  html body #app :is(${K})[data-wz]{min-height:0!important;aspect-ratio:1/1;justify-content:center!important;align-items:flex-start!important;padding:2px!important}
  html body #app :is(${K})[data-wz] img.ep-kic{width:32px!important;height:32px!important}
  html body #app .xseite .xs-stueck .xs-play{transform:scale(.75);transform-origin:right top}
  html body #app .xseite .xmt-kachel .xmt-k2,html body #app .xseite .xfo-karte .xfo-meta{font-size:.62rem!important}
  html body #app :is(${K})[data-wz] .x-tag,html body #app :is(${K})[data-wz] .xmt-tag{font-size:.55rem!important;padding:1px 5px!important}
}`;
  document.head.appendChild(c);
})();

/* ===== Entdecken am Handy: Gruppen mit 2 oder 4 Kacheln als kompakte Zeilen-Kacheln (Symbol links, Titel rechts), 2 pro Reihe ===== */
(function(){
  const c = document.createElement("style"); c.id = "ep-entdecken-handy-zeile-css";
  const K = ".x-kachel,.xsw-kachel,.spr-sp";
  c.textContent = `@media (max-width:700px){
  html body #app .x-kacheln.x-kacheln,html body #app .xsw-kacheln.xsw-kacheln,html body #app .spr-wahl.spr-wahl{grid-template-columns:repeat(2,minmax(0,1fr))!important}
  html body #app :is(${K})[data-wz]{aspect-ratio:auto!important;flex-direction:row!important;align-items:center!important;justify-content:flex-start!important;gap:8px!important;min-height:64px!important;padding:2px 4px!important;text-align:left!important}
  html body #app :is(${K})[data-wz] > *:not(.ep-wzbox){margin:0!important}
  html body #app :is(${K})[data-wz] :is(.x-emo,.spr-th-emo,.xsw-emo,span:first-child:has(img.ep-kic)){flex:none!important}
  html body #app :is(${K})[data-wz] img.ep-kic{width:36px!important;height:36px!important}
  html body #app .xsw-kachel[data-wz] .xsw-best{display:none!important}
  html body #app .xseite .xmt-kachel .xmt-k2{flex-wrap:nowrap!important;white-space:nowrap!important;gap:4px!important}
  html body #app .xseite .xmt-kachel .xmt-k2 > :last-child:not(.xmt-st){display:none!important}
  html body #app .xseite .xmt-kachel .xmt-k2 .xmt-bar{flex:1 1 auto!important;min-width:0!important}
}`;
  document.head.appendChild(c);
})();

/* ===== Anmelden, Konto-Wahl und Registrieren im neuen Stil mit den Kids =====
   Konto-Wahl (.ak-wahl), Anmelden (.ak-login mit Seitenbild .ak-seite), Registrieren Schritt für Schritt (.regbox.ak-steps, regSchritte() in index.html). ===== */
(function(){
  const G = "img/grafik/", E = G + "entdecken/";
  const css = document.createElement("style"); css.id = "ep-anmelden-css";
  css.textContent = `
@keyframes akHuepf{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes akEin{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:none}}
@keyframes akGlanz{0%{background-position:100% 0}60%,100%{background-position:0% 0}}
html body #app .ak-wahl{max-width:980px;margin:6px auto 30px;display:grid;gap:26px}
html body #app :is(.ak-kopf,.ak-seite){border:0 solid transparent;border-width:30px;border-image:url("${E}kopf.webp?v=1") 50 fill / 30px stretch;filter:drop-shadow(0 12px 20px rgba(60,30,160,.3));color:#fff;box-sizing:border-box}
html body #app .ak-kopf{display:flex;align-items:center;justify-content:center;gap:18px;text-align:center;padding:0 4px;min-height:110px}
html body #app .ak-kopf h1{margin:0;font:700 clamp(1.5rem,3.4vw,2.5rem)/1.1 Fredoka,Lexend,system-ui,sans-serif;color:#fff!important;text-shadow:0 3px 6px rgba(30,10,80,.45)}
html body #app .ak-kopf p{margin:6px 0 0;font-weight:700;font-size:1.08rem;color:#fff!important;text-shadow:0 2px 4px rgba(30,10,80,.4)}
html body #app .ak-kopfkid{flex:none;width:120px;height:140px;object-fit:contain;margin:-52px 0 -30px;filter:drop-shadow(0 6px 8px rgba(20,0,60,.35));animation:akHuepf 3.2s ease-in-out infinite}
html body #app .ak-kopfkid.ak-r{animation-delay:-1.6s}
html body #app .ak-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px}
html body #app .ak-karte{all:unset;box-sizing:border-box;cursor:pointer;position:relative;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:6px;min-height:270px;padding:6px 42% 10px 10px;
  border:0 solid transparent;border-width:22px;border-image:url("${E}kachel-01.webp?v=3") 46 fill / 22px stretch;color:#fff;filter:drop-shadow(0 12px 18px rgba(30,30,90,.3));transition:transform .2s,filter .2s;overflow:visible}
html body #app .ak-karte.ak-reg{border-image-source:url("${E}kachel-05.webp?v=3")}
html body #app .ak-karte:hover{transform:translateY(-5px);filter:drop-shadow(0 18px 24px rgba(30,30,90,.35)) brightness(1.04)}
html body #app .ak-karte:focus-visible{outline:4px solid #FFE34D;outline-offset:6px}
html body #app .ak-ic{width:76px;height:76px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 35% 30%,#FFF7CF,#FFC93A 55%,#E58E0C);box-shadow:0 0 0 4px rgba(255,255,255,.75),0 8px 14px rgba(0,0,0,.25)}
html body #app .ak-ic img{width:50px;height:50px;object-fit:contain;filter:drop-shadow(0 2px 3px rgba(0,0,0,.25))}
html body #app .ak-karte b{font:700 2.1rem/1.1 Fredoka,Lexend,system-ui,sans-serif;color:#fff;text-shadow:0 3px 5px rgba(0,0,0,.4);margin-top:4px}
html body #app .ak-karte small{font-size:1.1rem;font-weight:700;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.45)}
html body #app .ak-los{position:relative;overflow:hidden;margin-top:12px;display:inline-flex;align-items:center;height:56px;padding:0 8px;box-sizing:border-box;border:0 solid transparent;border-width:17px 29px;
  border-image:url("${G}knopf-gold.webp?v=1") 52 87 fill / 17px 29px stretch;color:#3A1C00;font:700 1.12rem Fredoka,Lexend,system-ui,sans-serif;filter:drop-shadow(0 4px 6px rgba(120,70,0,.3))}
html body #app .ak-kid{position:absolute;right:-8px;bottom:-22px;height:calc(100% + 30px);max-height:330px;width:auto;max-width:48%;object-fit:contain;object-position:bottom right;pointer-events:none;
  filter:drop-shadow(0 8px 10px rgba(10,0,40,.35));animation:akHuepf 3.4s ease-in-out infinite}
html body #app .ak-reg .ak-kid{animation-delay:-1.7s}
html body #app .ak-karte::after{content:"";position:absolute;inset:-14px;background:linear-gradient(110deg,transparent 40%,rgba(255,255,255,.3) 50%,transparent 60%) no-repeat;background-size:300% 100%;animation:akGlanz 4.5s ease-in-out infinite;pointer-events:none;border-radius:22px;z-index:1}
html body #app .ak-karte > .ak-kid{z-index:2}
html body #app .ak-wahl .ak-vorteile{justify-content:center}
html body #app .ak-vorteile{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:10px}
html body #app .ak-vorteile li{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.94);border:3px solid #fff;border-radius:999px;padding:6px 18px 6px 8px;font-weight:800;color:#2A1F5C;box-shadow:0 8px 18px rgba(40,30,120,.16)}
html body #app .ak-vorteile img{width:32px;height:32px;object-fit:contain}
/* Anmelden */
html body #app .ak-login{max-width:1010px;margin:6px auto 30px;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,480px);gap:26px;align-items:stretch}
html body #app .ak-seite{position:relative;display:flex;flex-direction:column;gap:14px;padding:6px 4px 0;min-height:420px}
html body #app .ak-seite h2{margin:0;font:700 clamp(1.6rem,3vw,2.3rem)/1.1 Fredoka,Lexend,system-ui,sans-serif;color:#fff!important;text-shadow:0 3px 6px rgba(30,10,80,.45)}
html body #app .ak-seite p{margin:0;font-weight:700;font-size:1.05rem;color:#fff!important;text-shadow:0 2px 4px rgba(30,10,80,.4)}
html body #app .ak-seite .ak-vorteile{flex-direction:column;align-items:flex-start}
html body #app .ak-seite .ak-vorteile li{font-size:.95rem}
html body #app .ak-duo{margin-top:auto;align-self:center;width:min(100%,360px);height:auto;margin-bottom:-30px;filter:drop-shadow(0 8px 10px rgba(10,0,40,.35));animation:akHuepf 3.6s ease-in-out infinite}
html body #app .ak-login .authbox{margin:0!important;max-width:none!important;width:100%;box-sizing:border-box}
html body #app .authicon.ak-icon{background:radial-gradient(circle at 35% 30%,#FFF7CF,#FFC93A 55%,#E58E0C)!important;box-shadow:0 0 0 4px #fff,0 10px 18px rgba(200,120,0,.35)!important;width:80px;height:80px}
html body #app .authicon.ak-icon img{width:52px;height:52px;object-fit:contain}
html body #app .ak-lbl{display:flex!important;align-items:center;gap:8px}
html body #app .ak-lbl img{width:26px;height:26px;object-fit:contain}
html body #app .ak-box .big.gold.ak-go{width:100%!important;margin-top:6px}
html body #app .authbox .authkopf h1{font-family:Fredoka,Lexend,system-ui,sans-serif;font-weight:700}
html body #app .authbox :is(input[type=email],input[type=password],input[type=text]){border-radius:18px!important;background:#F6F4FF!important;border-color:#E2DCFA!important}
html body #app .authbox :is(input[type=email],input[type=password],input[type=text]):focus{border-color:#8A5BFF!important;box-shadow:0 0 0 4px rgba(138,91,255,.18)}
html body #app .ak-zukid{width:120px;height:140px;object-fit:contain;margin:-40px auto 0;display:block;filter:drop-shadow(0 6px 8px rgba(40,20,100,.25));animation:akHuepf 3s ease-in-out infinite}
/* Neun-Teile-Bilder (border-image) nie skalieren, sonst entstehen helle Striche an den Nahtstellen */
/* Registrieren Schritt für Schritt */
html body #app .regbox.ak-steps > .regsek{display:none!important;border-top:0!important;padding-top:8px}
html body #app .regbox.ak-steps > .regsek.ak-jetzt{display:grid!important;animation:akEin .35s ease}
html body #app .regbox.ak-steps .authkopf .regav,html body #app .regbox.ak-steps .authkopf > p{display:none}
html body #app .regbox.ak-steps .authkopf h1{font-size:1.5rem;margin:0 0 4px}
html body #app .regbox.ak-steps .regsek h3{font:700 1.45rem Fredoka,Lexend,system-ui,sans-serif;color:#2A1F5C}
html body #app .regbox.ak-steps .regnr{background:radial-gradient(circle at 35% 30%,#FFF7CF,#FFC93A 55%,#E58E0C)!important;color:#3A1C00!important}
html body #app .ak-schritte{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:16px;margin:8px 0 4px;text-align:left;padding:10px 16px;border-radius:24px;background:linear-gradient(135deg,#EFE9FF,#FFF1F8)}
html body #app .ak-skid{width:96px;height:112px;object-fit:contain;margin:-26px 0 -10px;filter:drop-shadow(0 6px 8px rgba(40,20,100,.25));animation:akHuepf 3s ease-in-out infinite}
html body #app .ak-sbalken{display:flex;gap:6px}
html body #app .ak-sbalken i{flex:1;height:12px;border-radius:99px;background:#DCD4F7;transition:background .3s}
html body #app .ak-sbalken i.an{background:linear-gradient(90deg,#FFD84D,#FF9A3C)}
html body #app .ak-sbalken i.fertig{background:linear-gradient(90deg,#6A4BFF,#E8409F)}
html body #app .ak-stxt{margin:8px 0 0!important;font-weight:800;color:#6A4BFF!important;font-size:.9rem!important}
html body #app .ak-ssag{margin:2px 0 0!important;font:700 1.15rem Fredoka,Lexend,system-ui,sans-serif;color:#2A1F5C!important}
html body #app .regbox.ak-steps .regknoepfe{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:14px}
html body #app .regbox.ak-steps .regknoepfe [hidden]{display:none!important}
html body #app .regbox.ak-steps .regknoepfe .gold{margin-left:auto}
html body #app .regbox.ak-steps .social{margin-top:6px}
@media (max-width:820px){
  html body #app .ak-login{grid-template-columns:1fr;gap:14px}
  html body #app .ak-seite{min-height:0;flex-direction:row;align-items:center;padding:0;gap:10px}
  html body #app .ak-seite > :is(p,.ak-vorteile){display:none}
  html body #app .ak-seite h2{flex:1;font-size:1.35rem}
  html body #app .ak-duo{order:-1;width:120px;margin:-20px 0 -24px}
}
@media (max-width:640px){
  html body #app .ak-wahl{gap:16px}
  html body #app .ak-kopf{min-height:0;gap:6px;border-width:22px;border-image-width:22px}
  html body #app .ak-kopf h1{font-size:1.3rem}html body #app .ak-kopf p{font-size:.88rem}
  html body #app .ak-kopfkid{width:62px;height:78px;margin:-30px 0 -20px}
  html body #app .ak-grid{grid-template-columns:1fr;gap:14px}
  html body #app .ak-karte{min-height:150px;padding:2px 40% 4px 4px;border-width:18px;border-image-width:18px;gap:3px}
  html body #app .ak-ic{width:48px;height:48px}html body #app .ak-ic img{width:32px;height:32px}
  html body #app .ak-karte b{font-size:1.5rem}html body #app .ak-karte small{font-size:.9rem}
  html body #app .ak-los{height:46px;border-width:14px 24px;border-image-width:14px 24px;font-size:.98rem;margin-top:6px}
  html body #app .ak-kid{bottom:-18px;height:calc(100% + 24px);max-width:44%}
  html body #app .ak-los{white-space:nowrap}
  html body #app .ak-wahl > .ak-vorteile{display:none}
  html body #app .regbox.ak-steps .namerow{grid-template-columns:1fr!important;gap:0!important}
  html body #app .ak-vorteile{gap:6px}html body #app .ak-vorteile li{font-size:.8rem;padding:4px 12px 4px 6px}html body #app .ak-vorteile img{width:24px;height:24px}
  html body #app .ak-schritte{gap:10px;padding:8px 12px}
  html body #app .ak-skid{width:64px;height:78px;margin:-14px 0 -6px}
  html body #app .ak-ssag{font-size:1rem}
  html body #app .regbox.ak-steps .regsek h3{font-size:1.2rem}
}
@media (prefers-reduced-motion:reduce){html body #app :is(.ak-kid,.ak-kopfkid,.ak-duo,.ak-skid,.ak-karte::after){animation:none!important}html body #app .regbox.ak-steps > .regsek.ak-jetzt{animation:none!important}}`;
  document.head.appendChild(css);
})();

/* ===== Hauptmenü (Knopf «Menü» oben rechts) im neuen Stil: weisse Glas-Karte, Dejans Symbole, gewählt Violett-Pink =====
   Lehrerbereich, Test mit Code, Meine Tests, Suchen und Fragendatenbank sind ausgeblendet (.m-weg), bleiben aber im DOM,
   weil app.js (menuKlick) und lehrer.js sie anklicken. ===== */
(function(){
  const css = document.createElement("style"); css.id = "ep-hauptmenue-css";
  css.textContent = `
html body #hauptmenue.menu{--bg:#F3F6FF;--surface:#FFFFFF;--ink:#1B2240;--line:#E2DCFA;min-width:290px;padding:10px;gap:4px;border:4px solid #fff;border-radius:28px;
  background:linear-gradient(180deg,#FFFFFF,#F3EFFF);box-shadow:0 22px 44px -14px rgba(50,30,130,.45),inset 0 -4px 0 rgba(120,90,220,.1);color:#2A1F5C}
html body #hauptmenue.menu > button{display:flex;align-items:center;gap:12px;padding:8px 14px 8px 8px;border-radius:18px;font:800 1rem Lexend,system-ui,sans-serif;color:#3A2F72;background:transparent;transition:background .15s,color .15s,transform .15s}
html body #hauptmenue .mi{flex:none;width:38px;height:38px;display:grid;place-items:center;border-radius:12px;background:rgba(123,91,255,.08)}
html body #hauptmenue .mi img{width:30px;height:30px;object-fit:contain;filter:drop-shadow(0 2px 3px rgba(40,20,100,.25))}
html body #hauptmenue .mi-av{background:none}
html body #hauptmenue .mi-av :is(img,svg,.avimg){width:34px;height:34px;border-radius:50%;box-shadow:0 0 0 2px #fff,0 2px 5px rgba(40,20,100,.3)}
html body #hauptmenue.menu > button:hover,html body #hauptmenue.menu > button:focus-visible{outline:none;color:#fff;background:linear-gradient(135deg,#6A4BFF 0%,#A43BE0 55%,#E8409F 100%);transform:translateX(2px);box-shadow:0 6px 14px rgba(140,50,200,.35)}
html body #hauptmenue.menu > button:hover .mi,html body #hauptmenue.menu > button:focus-visible .mi{background:rgba(255,255,255,.9)}
html body #hauptmenue hr{border:0;border-top:2px solid #E7E1FA;margin:4px 8px}
html body #hauptmenue.menu > .m-out{color:#D6362E}
html body #hauptmenue .badge2{margin-left:auto}
html body #hauptmenue .mgruppe.m-weg,html body #hauptmenue .m-weg [data-lm],html body #hauptmenue > [data-lm]{display:none!important}
@media (max-width:600px){html body #hauptmenue.menu{min-width:250px}html body #hauptmenue.menu > button{font-size:.95rem}}`;
  document.head.appendChild(css);
})();

/* ===== App-Ansicht Profil-Tab im neuen Stil: abgemeldet zwei Glanz-Kacheln (wie /anmelden), Zahlen auf Glanz-Kacheln,
   Liste «Mehr» (mehrListe() in app.js, auch unter der neuen Profilseite als .ap-mehr) als weisse Glas-Karte mit Dejans Symbolen ===== */
(function(){
  const E = "img/grafik/entdecken/";
  const css = document.createElement("style"); css.id = "ep-appprofil-css";
  css.textContent = `
html body.ep-app #app .ap-akgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0}
html body.ep-app #app .ap-akgrid .ak-karte{min-height:150px;padding:2px 36% 4px 4px;border-width:16px;border-image-width:16px;gap:3px}
html body.ep-app #app .ap-akgrid .ak-ic{width:40px;height:40px}html body.ep-app #app .ap-akgrid .ak-ic img{width:26px;height:26px}
html body.ep-app #app .ap-akgrid .ak-karte b{font-size:1.15rem}
html body.ep-app #app .ap-akgrid .ak-karte small{font-size:.72rem}
html body.ep-app #app .ap-akgrid .ak-los{height:38px;border-width:12px 20px;border-image-width:12px 20px;font-size:.78rem;white-space:nowrap;margin-top:4px;padding:0 2px}
html body.ep-app #app .ap-akgrid .ak-kid{max-width:46%;bottom:-16px;height:calc(100% + 10px)}
html body.ep-app #app .ap-profil .ap-stats > .apf{background:none!important;box-shadow:none!important;border:0 solid transparent!important;border-width:16px!important;border-radius:0!important;
  border-image:url("${E}kachel-07.webp?v=3") 46 fill / 16px stretch!important;filter:drop-shadow(0 6px 10px rgba(30,30,90,.25));color:#fff;padding:0 4px!important}
html body.ep-app #app .ap-profil .ap-stats > .apf.f-orange{border-image-source:url("${E}kachel-03.webp?v=3")!important}
html body.ep-app #app .ap-profil .ap-stats > .apf.f-lila{border-image-source:url("${E}kachel-06.webp?v=3")!important}
html body.ep-app #app .ap-profil .ap-stats > .apf.f-gold{border-image-source:url("${E}kachel-05.webp?v=3")!important}
html body.ep-app #app .ap-profil .ap-stats > .apf :is(small,b,span){color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.4)}
html body.ep-app #app .ap-profil .ap-liste{--surface:#fff;background:linear-gradient(180deg,#FFFFFF,#F3EFFF)!important;border:4px solid #fff!important;border-radius:26px!important;box-shadow:0 14px 30px rgba(40,30,120,.22)!important;padding:8px!important;gap:4px 6px!important;backdrop-filter:none!important}
html body.ep-app #app .ap-profil .ap-liste > *{color:#3A2F72!important;font:800 15px Lexend,system-ui,sans-serif!important;min-height:48px!important;border-radius:16px!important;padding:4px 8px!important;background:none!important;box-shadow:none!important}
html body.ep-app #app .ap-profil .ap-liste > *:hover,html body.ep-app #app .ap-profil .ap-liste > *:focus-visible{background:rgba(123,91,255,.1)!important}
html body.ep-app #app .ap-profil .ap-liste .apb{flex:none;width:36px;height:36px;display:grid;place-items:center;border-radius:12px;background:rgba(123,91,255,.09)}
html body.ep-app #app .ap-profil .ap-liste .apb img{width:28px;height:28px;object-fit:contain;filter:drop-shadow(0 2px 3px rgba(40,20,100,.22))}
html body.ep-app #app .ap-profil .ap-liste > *:not(.x-ein) > svg:first-child{box-sizing:content-box;padding:6px;border-radius:12px;color:#6A4BFF;background:rgba(123,91,255,.09)!important;box-shadow:none!important}
html body.ep-app #app .ap-profil .ap-liste .x-ein{color:#fff!important;background:linear-gradient(120deg,#6A4BFF,#A43BE0 55%,#E8409F)!important}
html body.ep-app #app .ap-profil .ap-liste .rot{color:#D6362E!important}
html body.ep-app #app .ap-profil .ap-liste > * > span:not(.apb){white-space:normal!important;overflow:visible!important;text-overflow:clip!important;line-height:1.15;font-size:14px}
html body.ep-app #app .ap-mehr{margin:16px 0 8px}
html body.ep-app #app .ap-mehr .ap-liste{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}`;
  document.head.appendChild(css);
})();

/* ===== App-Ansicht Profil-Tab: eine Seite ohne Scrollen (profilHTML in app.js, Untermenü «Mehr» über AP_SUB).
   Kopf (angemeldet: Avatar, Name, Level, XP-Balken; sonst Anmelden/Registrieren), drei kleine Zahlen, darunter die weisse
   Menü-Karte, die bis zur unteren Leiste reicht. Versionszeile ausgeblendet. ===== */
(function(){
  const E = "img/grafik/entdecken/";
  const c = document.createElement("style"); c.id = "ep-appprofil3-css";
  c.textContent = `
html body.ep-app #app > .ap-profil3{display:flex!important;flex-direction:column;gap:10px;min-height:0;height:var(--aph,auto)!important;overflow:hidden!important;padding-bottom:0!important}
html body.ep-app #app .ap-profil3 > *{flex:none;grid-column:auto!important;grid-row:auto!important;margin:0!important}
html body.ep-app #app .ap-profil3 .ep-ver,html body.ep-app #app .ap-profil .ep-ver{display:none!important}
html body.ep-app #app .ap-profil3 .ap-pkopf{display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:flex-start!important;gap:12px;width:100%;text-align:left;cursor:pointer;min-height:0!important;padding:0 6px!important;background:none!important;box-shadow:none!important;border:0 solid transparent!important;border-width:22px!important;border-radius:0!important;border-image:url("${E}kachel-06.webp?v=3") 46 fill / 22px stretch!important;filter:drop-shadow(0 8px 14px rgba(30,30,90,.28));color:#fff}
html body.ep-app #app .ap-profil3 .ap-pkopf .apav{flex:none;width:64px;height:64px;border-radius:50%;overflow:hidden;border:3px solid #fff;background:#fff;display:grid;place-items:center}
html body.ep-app #app .ap-profil3 .ap-pkopf .apav :is(img,svg){width:100%;height:100%;object-fit:cover}
html body.ep-app #app .ap-profil3 .ap-pkn{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}
html body.ep-app #app .ap-profil3 .ap-pkn b{font:800 1.3rem/1.1 Fredoka,Lexend,system-ui,sans-serif;color:#fff;text-shadow:0 2px 4px rgba(0,0,0,.35);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
html body.ep-app #app .ap-profil3 .ap-pkn small{font:700 .82rem Lexend,system-ui,sans-serif;color:#fff;opacity:.95;text-shadow:0 1px 3px rgba(0,0,0,.4)}
html body.ep-app #app .ap-profil3 .ap-pbar{display:block;height:10px;border-radius:99px;background:rgba(20,10,60,.45);overflow:hidden;margin-top:3px}
html body.ep-app #app .ap-profil3 .ap-pbar i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#FFE34D,#FFB020)}
html body.ep-app #app .ap-profil3 .ap-pzu{flex:none;font:800 1.8rem Lexend,sans-serif;color:#fff;opacity:.9}
html body.ep-app #app .ap-profil3 .ap-stats{display:grid!important;grid-template-columns:repeat(3,1fr)!important;grid-auto-rows:auto!important;gap:8px!important}
html body.ep-app #app .ap-profil3 .ap-stats > .apf{min-height:0!important;display:flex!important;flex-direction:column;align-items:center;justify-content:center;gap:0;padding:0 2px!important;border-width:14px!important}
html body.ep-app #app .ap-profil3 .ap-stats > .apf small{font:700 .72rem Lexend,sans-serif}
html body.ep-app #app .ap-profil3 .ap-stats > .apf b{font:800 1.3rem/1.1 Fredoka,Lexend,sans-serif;display:flex;align-items:center;gap:3px}
html body.ep-app #app .ap-profil3 .ap-stats > .apf b em{font-style:normal;font-size:.75em;opacity:.85}
html body.ep-app #app .ap-profil3 .ap-akgrid .ak-karte{min-height:132px}
html body.ep-app #app .ap-profil3 .ap-pmenue{flex:1 1 0!important;min-height:0;display:grid!important;grid-template-columns:1fr 1fr;grid-auto-rows:minmax(0,1fr);gap:8px;padding:10px!important;background:linear-gradient(180deg,#FFFFFF,#F3EFFF)!important;border:4px solid #fff!important;border-radius:26px!important;box-shadow:0 14px 30px rgba(40,30,120,.22)!important;backdrop-filter:none!important;--surface:#fff}
html body.ep-app #app .ap-profil3 .ap-pk{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;min-height:0;padding:4px;border:0;border-radius:18px;background:rgba(123,91,255,.07);color:#3A2F72;text-decoration:none;font:800 15px/1.15 Lexend,system-ui,sans-serif;text-align:center;cursor:pointer}
html body.ep-app #app .ap-profil3 .ap-pk:hover,html body.ep-app #app .ap-profil3 .ap-pk:focus-visible{background:rgba(123,91,255,.16)}
html body.ep-app #app .ap-profil3 .ap-pk .apb{flex:none;width:clamp(30px,7vh,52px);height:clamp(30px,7vh,52px);display:grid;place-items:center}
html body.ep-app #app .ap-profil3 .ap-pk .apb img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 3px 4px rgba(40,20,100,.25))}
html body.ep-app #app .ap-profil3 .ap-pk.rot{color:#D6362E}
html body.ep-app #app .ap-profil3 .ap-psub{display:flex!important;flex-direction:column;gap:6px}
html body.ep-app #app .ap-profil3 .ap-psubkopf{display:flex;align-items:center;gap:10px;flex:none}
html body.ep-app #app .ap-profil3 .ap-psubkopf b{font:800 1.15rem Fredoka,Lexend,sans-serif;color:#3A2F72}
html body.ep-app #app .ap-profil3 .ap-pzur{border:0;border-radius:99px;padding:7px 14px;background:linear-gradient(120deg,#6A4BFF,#A43BE0 55%,#E8409F);color:#fff;font:800 14px Lexend,sans-serif;cursor:pointer}
html body.ep-app #app .ap-profil3 .ap-pliste{flex:1;min-height:0;display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:minmax(0,1fr);gap:6px}
html body.ep-app #app .ap-profil3 .ap-pliste .ap-pk{flex-direction:row;justify-content:flex-start;text-align:left;padding:4px 10px;font-size:14px}
html body.ep-app #app .ap-profil3 .ap-pliste .ap-pk .apb{width:clamp(26px,5vh,38px);height:clamp(26px,5vh,38px)}
@media (min-width:700px){html body.ep-app #app .ap-profil3 .ap-pmenue:not(.ap-psub){grid-template-columns:repeat(3,1fr)}html body.ep-app #app .ap-profil3 .ap-pk{font-size:17px}}
html.ep-pfit,html.ep-pfit body{overflow:hidden!important;overscroll-behavior:none!important}`;
  document.head.appendChild(c);
  /* kein Scrollen auf dem Profil-Tab */
  const pr = () => { let an = false; try{ an = document.body.classList.contains("ep-app") && S.screen === "home" && !!document.querySelector("#app .ap-profil3"); }catch(e){}
    document.documentElement.classList.toggle("ep-pfit", an); if(!an) return; if(scrollY) scrollTo(0, 0);
    const ap = document.querySelector("#app .ap-profil3"), tb = document.getElementById("epTabs");
    const quer = tb && tb.getBoundingClientRect().width < innerWidth / 3;   // iPad quer: Leiste an der Seite
    const unten = tb && !quer ? tb.getBoundingClientRect().top - 10 : innerHeight - 12;
    ap.style.setProperty("--aph", Math.max(320, Math.floor(unten - ap.getBoundingClientRect().top)) + "px"); };
  const go2 = () => { const app = document.getElementById("app"); if(!app) return setTimeout(go2, 300); new MutationObserver(() => requestAnimationFrame(pr)).observe(app, {childList:true}); pr(); };
  go2(); addEventListener("resize", () => requestAnimationFrame(pr));
})();

/* ===== App-Ansicht Profil-Tab: ohne weisse Karte (Dejan). Knöpfe als einzelne Glanz-Kacheln direkt auf dem Hintergrund ===== */
(function(){
  const E = "img/grafik/entdecken/";
  const F = ["01","06","05","03","07","02","04","08"];
  const c = document.createElement("style"); c.id = "ep-appprofil4-css";
  c.textContent = `
html body.ep-app #app .ap-profil3 .ap-pmenue{background:none!important;border:0!important;border-radius:0!important;box-shadow:none!important;padding:0!important}
html body.ep-app #app .ap-profil3 .ap-pk{background:none!important;border:0 solid transparent!important;border-width:18px!important;border-radius:0!important;border-image:url("${E}kachel-01.webp?v=3") 46 fill / 18px stretch!important;filter:drop-shadow(0 6px 10px rgba(30,30,90,.28));color:#fff!important;text-shadow:0 1px 3px rgba(0,0,0,.45);padding:0 2px!important}
${F.map((f, i) => `html body.ep-app #app .ap-profil3 .ap-pk:nth-child(8n+${i + 1}){border-image-source:url("${E}kachel-${f}.webp?v=3")!important}`).join("\n")}
html body.ep-app #app .ap-profil3 .ap-pk.rot.rot:nth-child(n){border-image-source:url("${E}kachel-04.webp?v=3")!important;color:#fff!important}
html body.ep-app #app .ap-profil3 .ap-pk:hover,html body.ep-app #app .ap-profil3 .ap-pk:focus-visible{filter:drop-shadow(0 8px 14px rgba(30,30,90,.4)) brightness(1.06)}
html body.ep-app #app .ap-profil3 .ap-pk .apb{background:rgba(255,255,255,.92);border-radius:50%;padding:5px;box-sizing:border-box}
html body.ep-app #app .ap-profil3 .ap-psubkopf b{color:#fff;text-shadow:0 2px 4px rgba(0,0,0,.45)}`;
  document.head.appendChild(c);
})();

/* ===== App-Ansicht Profil-Tab abgemeldet: Anmelden und Registrieren untereinander (Dejan) ===== */
(function(){ const c = document.createElement("style"); c.id = "ep-appprofil5-css";
c.textContent = `
html body.ep-app #app .ap-profil3 .ap-akgrid{grid-template-columns:1fr!important;gap:12px!important}
html body.ep-app #app .ap-profil3 .ap-akgrid .ak-karte{min-height:170px!important;padding:6px 44% 6px 8px!important;align-items:flex-start!important;text-align:left!important}
html body.ep-app #app .ap-profil3 .ap-akgrid .ak-karte b{font-size:1.6rem!important}
html body.ep-app #app .ap-profil3 .ap-akgrid .ak-karte small{font-size:.9rem!important}
html body.ep-app #app .ap-profil3 .ap-akgrid .ak-ic{width:48px!important;height:48px!important}html body.ep-app #app .ap-profil3 .ap-akgrid .ak-ic img{width:30px!important;height:30px!important}
html body.ep-app #app .ap-profil3 .ap-akgrid .ak-los{height:44px!important;font-size:.95rem!important;padding:0 10px!important;margin-top:8px!important}
html body.ep-app #app .ap-profil3 .ap-akgrid .ak-kid{max-width:42%!important;height:calc(100% + 26px)!important;bottom:-18px!important;right:4px!important}
@media (min-width:700px){html body.ep-app #app .ap-profil3 .ap-akgrid .ak-karte{min-height:230px!important}html body.ep-app #app .ap-profil3 .ap-akgrid .ak-karte b{font-size:2.2rem!important}}`;
document.head.appendChild(c); })();
/* Profil-Tab abgemeldet: Schrift besser lesbar */
(function(){ const c = document.createElement("style"); c.id = "ep-appprofil6-css";
c.textContent = `
html body.ep-app #app .ap-profil3 .ap-akgrid .ak-karte b{font-family:Lexend,system-ui,sans-serif!important;font-weight:800!important;letter-spacing:.01em;text-shadow:0 2px 4px rgba(0,0,0,.45)!important}
html body.ep-app #app .ap-profil3 .ap-akgrid .ak-karte small{font:600 .95rem/1.4 Lexend,system-ui,sans-serif!important;color:#fff!important;opacity:1!important;text-shadow:0 1px 3px rgba(0,0,0,.6)!important;max-width:100%}
html body.ep-app #app .ap-profil3 .ap-akgrid .ak-los{font:800 1rem Lexend,system-ui,sans-serif!important}
@media (min-width:700px){html body.ep-app #app .ap-profil3 .ap-akgrid .ak-karte small{font-size:1.2rem!important}html body.ep-app #app .ap-profil3 .ap-akgrid .ak-los{font-size:1.15rem!important;height:52px!important;padding:0 18px!important}}`;
document.head.appendChild(c); })();

/* ===== App-Ansicht Profil-Tab angemeldet: neue Seite (profilEinHTML in app.js) mit Dejans Glanz-Kacheln und Symbolen ===== */
(function(){
  const E = "img/grafik/entdecken/";
  const K = {violett:"06", orange:"03", blau:"01", gruen:"07", mag:"05", tuer:"02", lila:"08"};
  const c = document.createElement("style"); c.id = "ep-appprofil7-css";
  c.textContent = `
html body.ep-app #app .ap-pein{gap:9px!important}
html body.ep-app #app .ap-pein .ap-pkach{position:relative;display:flex;align-items:center;gap:10px;width:100%;margin:0;text-align:left;color:#fff;cursor:pointer;background:none;border:0 solid transparent;border-width:18px;border-radius:0;border-image:url("${E}kachel-06.webp?v=3") 46 fill / 18px stretch;filter:drop-shadow(0 6px 10px rgba(30,30,90,.28));padding:0 2px;font-family:Lexend,system-ui,sans-serif;box-sizing:border-box}
${Object.entries(K).map(([k, n]) => `html body.ep-app #app .ap-pein .ap-pkach.k-${k}{border-image-source:url("${E}kachel-${n}.webp?v=3")}`).join("\n")}
html body.ep-app #app .ap-pein :is(b,small,em){text-shadow:0 1px 3px rgba(0,0,0,.5);font-style:normal}
html body.ep-app #app .ap-pein .ap-pav2{flex:none;width:68px;height:68px;border-radius:50%;overflow:hidden;background:#fff;border:4px solid #FFD54A;box-shadow:0 0 0 3px rgba(255,255,255,.7),0 0 16px rgba(255,214,80,.7)}
html body.ep-app #app .ap-pein .ap-pav2 :is(img,svg){width:100%;height:100%;object-fit:cover;display:block}
html body.ep-app #app .ap-pein .ap-pkn{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
html body.ep-app #app .ap-pein .ap-pkn b{font:800 1.35rem/1.1 Lexend,system-ui,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
html body.ep-app #app .ap-pein .ap-pkn small{font:700 .85rem Lexend,sans-serif}
html body.ep-app #app .ap-pein .ap-pkn em,html body.ep-app #app .ap-pein .ap-ptx em{font:600 .75rem Lexend,sans-serif;opacity:.95}
html body.ep-app #app .ap-pein .ap-pbar{display:block;height:10px;border-radius:99px;background:rgba(20,10,60,.45);overflow:hidden;margin:3px 0 1px;box-shadow:inset 0 1px 2px rgba(0,0,0,.35)}
html body.ep-app #app .ap-pein .ap-pbar i{display:block;height:100%;min-width:6px;border-radius:inherit;background:linear-gradient(90deg,#FFE34D,#FFB020)}
html body.ep-app #app .ap-pein .ap-pzu{flex:none;font:800 1.7rem Lexend,sans-serif;opacity:.9;padding-right:2px}
html body.ep-app #app .ap-pein .ap-pmz{flex:none;width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 35% 30%,#FFF6C8,#FFD54A 55%,#E0A800);box-shadow:0 3px 6px rgba(0,0,0,.3),inset 0 -2px 3px rgba(150,90,0,.35)}
html body.ep-app #app .ap-pein .ap-pmz img{width:72%;height:72%;object-fit:contain;filter:drop-shadow(0 1px 2px rgba(80,40,0,.3))}
html body.ep-app #app .ap-pein .ap-pzahl{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
html body.ep-app #app .ap-pein .ap-pzahl .ap-pkach{flex-direction:column;justify-content:center;gap:1px;text-align:center;cursor:default;border-width:15px;padding:0}
html body.ep-app #app .ap-pein .ap-pzahl .ap-pmz{width:36px;height:36px}
html body.ep-app #app .ap-pein .ap-pzahl b{font:800 1.3rem/1.1 Lexend,sans-serif}
html body.ep-app #app .ap-pein .ap-pzahl small{font:700 .7rem Lexend,sans-serif}
html body.ep-app #app .ap-pein .ap-ptx{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}
html body.ep-app #app .ap-pein .ap-ptx small{font:700 .7rem Lexend,sans-serif;text-transform:uppercase;letter-spacing:.06em;opacity:.95}
html body.ep-app #app .ap-pein .ap-ptx b{font:800 1.02rem/1.2 Lexend,sans-serif}
html body.ep-app #app .ap-pein .ap-pv{flex:1 1 0;min-height:0;flex-direction:column;align-items:stretch;gap:8px;justify-content:center}
html body.ep-app #app .ap-pein .ap-pvk{display:flex;align-items:center;gap:8px}
html body.ep-app #app .ap-pein .ap-pvk img{width:30px;height:30px;object-fit:contain}
html body.ep-app #app .ap-pein .ap-pvk b{flex:1;font:800 1.02rem Lexend,sans-serif}
html body.ep-app #app .ap-pein .ap-pvk span{font:700 .78rem Lexend,sans-serif;background:rgba(255,255,255,.22);border-radius:99px;padding:3px 9px}
html body.ep-app #app .ap-pein .ap-pvg{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;align-items:start}
html body.ep-app #app .ap-pein .ap-pvb{display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center;min-width:0}
html body.ep-app #app .ap-pein .ap-pvm{width:clamp(44px,8vh,64px);aspect-ratio:1;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 35% 30%,#fff,#F4EEFF 60%,#DCD2FF);border:4px solid var(--st);box-shadow:0 0 0 2px #fff,0 0 14px color-mix(in srgb,var(--st) 70%,transparent)}
html body.ep-app #app .ap-pein .ap-pvm img{width:66%;height:66%;object-fit:contain}
html body.ep-app #app .ap-pein .ap-pvb small{font:700 .66rem/1.15 Lexend,sans-serif;overflow-wrap:anywhere}
html body.ep-app #app .ap-pein .ap-pvb.aus .ap-pvm{filter:grayscale(1);opacity:.55;box-shadow:0 0 0 2px rgba(255,255,255,.6)}
html body.ep-app #app .ap-pein .ap-pvb.aus small{opacity:.75}
html body.ep-app #app .ap-pein .ap-pkach:active{filter:drop-shadow(0 3px 6px rgba(30,30,90,.3)) brightness(.97);transform:translateY(1px)}
@media (max-height:700px){html body.ep-app #app .ap-pein .ap-pav2{width:54px;height:54px}html body.ep-app #app .ap-pein .ap-pmz{width:36px;height:36px}html body.ep-app #app .ap-pein .ap-pzahl .ap-pmz{width:28px;height:28px}html body.ep-app #app .ap-pein .ap-pkach{border-width:14px}html body.ep-app #app .ap-pein .ap-ptx em{display:none}}
@media (min-width:700px){html body.ep-app #app .ap-pein .ap-pkn b{font-size:1.8rem}html body.ep-app #app .ap-pein .ap-pav2{width:92px;height:92px}html body.ep-app #app .ap-pein .ap-ptx b{font-size:1.3rem}html body.ep-app #app .ap-pein .ap-pmz{width:58px;height:58px}html body.ep-app #app .ap-pein .ap-pzahl b{font-size:1.8rem}html body.ep-app #app .ap-pein .ap-pvb small{font-size:.9rem}html body.ep-app #app .ap-pein .ap-pvm{width:clamp(60px,9vh,96px)}}`;
  document.head.appendChild(c);
})();
(function(){ const c = document.createElement("style");
c.textContent = `html body.ep-app #app .ap-pein .ap-pv{justify-content:space-evenly!important}
html body.ep-app #app .ap-pein .ap-pvg{row-gap:12px}
@media (max-height:760px){html body.ep-app #app .ap-pein .ap-pvb:nth-child(n+5){display:none}}`;
document.head.appendChild(c); })();

/* ===== Handy/iPad (App-Ansicht): Themen-Kacheln der vier Bereiche und Bibliothek-Kachel im Themen-Tab im Glanz-Stil =====
   Bereich-Seiten (ep-s-bereich, ep-s-submenu): jede Themen-Kachel auf Dejans Glanz-Kachel in der Bereichsfarbe (Tabelle FB),
   Qeels-Symbol gross mit hellem Schein, Titel weiss, Fragenzahl als weisse Pille, Symbol zusätzlich als helle Silhouette unten rechts.
   «Aus allen Themen spielen» als goldener Grafik-Knopf. Themen-Tab: Bibliothek als nachtblaue Glanz-Kachel mit Dejans Büchern. */
(function(){
  const E = "img/grafik/entdecken/";
  const FB = {welt:"01", natur:"04", geld:"02", alltag:"03"};
  const T = "html body.ep-app:is(.ep-s-bereich,.ep-s-submenu) #app .thema";
  const c = document.createElement("style"); c.id = "ep-appthemen-css";
  c.textContent = `
${T}{position:relative;overflow:hidden;background:none!important;box-shadow:none!important;border:0 solid transparent!important;border-width:16px!important;border-radius:0!important;
  border-image:url("${E}kachel-${FB.welt}.webp?v=3") 46 fill / 16px stretch!important;filter:drop-shadow(0 6px 10px rgba(30,30,90,.3));color:#fff!important;padding:0 2px!important;
  display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:4px!important;text-align:center!important;transition:transform .2s,filter .2s}
${Object.entries(FB).map(([b, n]) => `html[data-epb="${b}"] body.ep-app:is(.ep-s-bereich,.ep-s-submenu) #app .thema{border-image-source:url("${E}kachel-${n}.webp?v=3")!important}`).join("\n")}
${T}:active{transform:translateY(2px);filter:drop-shadow(0 3px 5px rgba(30,30,90,.3)) brightness(.97)}
${T} .emo{position:relative;z-index:1;width:46px!important;height:46px!important;flex:none!important;min-width:0!important;margin:0!important;background:radial-gradient(circle,rgba(255,255,255,.95) 0 38%,rgba(255,255,255,.35) 60%,transparent 72%)!important;border:0!important;box-shadow:none!important;border-radius:50%!important;display:grid!important;place-items:center!important}
${T} .emo .ic,${T} .emo img{width:38px!important;height:38px!important;font-size:30px!important;background:none!important;box-shadow:none!important;filter:drop-shadow(0 3px 4px rgba(0,0,0,.28))}
${T} > span:not(.emo){position:relative;z-index:1;display:flex!important;flex-direction:column;align-items:center;gap:4px;min-width:0;width:100%}
${T} b{color:#fff!important;font:800 12px/1.15 Lexend,system-ui,sans-serif!important;text-shadow:0 1px 3px rgba(0,0,0,.5)!important;hyphens:manual!important;-webkit-hyphens:manual!important;overflow-wrap:normal!important;word-break:normal!important;display:block!important;-webkit-line-clamp:unset!important;line-clamp:unset!important;overflow:visible!important;white-space:normal!important;max-height:none!important}
${T} .t{display:none!important}
${T} .n{display:inline-block!important;flex:none;background:rgba(255,255,255,.94)!important;color:#3A2F72!important;font:800 10.5px Lexend,sans-serif!important;border-radius:99px!important;padding:3px 9px!important;box-shadow:0 2px 5px rgba(0,0,0,.2)!important;text-shadow:none!important;margin:0!important;border:0!important}
${T} .ep-wz2{position:absolute;z-index:0;right:-18%;bottom:-20%;width:72%;opacity:.2;transform:rotate(-16deg);filter:brightness(0) invert(1);pointer-events:none}
html body.ep-app:is(.ep-s-bereich,.ep-s-submenu) #app .np-allethemen{background:none!important;box-shadow:none!important;border:0 solid transparent!important;border-width:18px!important;border-radius:0!important;border-image:url("${E}kachel-${FB.welt}.webp?v=3") 46 fill / 18px stretch!important;min-height:0!important;padding:0 4px!important;margin:0 0 10px!important;justify-content:flex-start!important;gap:12px!important;color:#fff!important;filter:drop-shadow(0 7px 12px rgba(30,30,90,.32));overflow:hidden}
${Object.entries(FB).map(([b, n]) => `html body.ep-app:is(.ep-s-bereich,.ep-s-submenu) #app .np-allethemen[data-b="${b}"]{border-image-source:url("${E}kachel-${n}.webp?v=3")!important}`).join("\n")}
html body.ep-app:is(.ep-s-bereich,.ep-s-submenu) #app .np-allethemen > img:first-child{flex:none;width:50px!important;height:50px!important;padding:7px!important;border-radius:50%!important;background:radial-gradient(circle at 35% 30%,#FFF6C8,#FFD54A 55%,#E0A800)!important;box-shadow:0 3px 8px rgba(0,0,0,.35),inset 0 -2px 3px rgba(150,90,0,.35)!important}
html body.ep-app:is(.ep-s-bereich,.ep-s-submenu) #app .np-allethemen > span:not(.ep-play){flex:1;min-width:0;display:flex;flex-direction:column;align-items:flex-start;text-align:left;font:800 17px/1.15 Lexend,system-ui,sans-serif!important;color:#fff!important;text-shadow:0 2px 4px rgba(0,0,0,.45)!important}
html body.ep-app:is(.ep-s-bereich,.ep-s-submenu) #app .np-allethemen > span:not(.ep-play) small{font:600 11.5px/1.3 Lexend,sans-serif;opacity:.95;margin-top:2px}
html body.ep-app:is(.ep-s-bereich,.ep-s-submenu) #app .np-allethemen .ep-play{flex:none;width:46px;height:46px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 35% 30%,#fff,#F1ECFF);box-shadow:0 4px 10px rgba(0,0,0,.3)}
html body.ep-app:is(.ep-s-bereich,.ep-s-submenu) #app .np-allethemen .ep-play img{width:60%;height:60%;object-fit:contain;margin-left:3px}
html body.ep-app:is(.ep-s-bereich,.ep-s-submenu) #app .np-allethemen .ep-wz3{position:absolute;right:56px;top:-30%;width:110px;opacity:.16;transform:rotate(-14deg);filter:brightness(0) invert(1);pointer-events:none}
@media (min-width:700px){${T} .emo{width:76px!important;height:76px!important}${T} .emo .ic,${T} .emo img{width:62px!important;height:62px!important}${T} b{font-size:17px!important}${T} .n{font-size:13px!important}}
/* Bibliothek-Kachel im Themen-Tab */
html body.ep-app #app .ap-bibk{position:relative;overflow:hidden;background:none!important;box-shadow:none!important;border:0 solid transparent!important;border-width:18px!important;border-radius:0!important;border-image:url("${E}kachel-10.webp?v=3") 46 fill / 18px stretch!important;filter:drop-shadow(0 8px 14px rgba(20,20,80,.35));color:#fff!important;padding:0 4px!important;display:flex!important;align-items:center!important;gap:12px!important;min-height:80px}
html body.ep-app #app .ap-bibk .apico{flex:none;width:52px!important;height:52px!important;border-radius:50%!important;display:grid!important;place-items:center!important;background:radial-gradient(circle at 35% 30%,#FFF6C8,#FFD54A 55%,#E0A800)!important;box-shadow:0 3px 8px rgba(0,0,0,.35),inset 0 -2px 3px rgba(150,90,0,.35)!important}
html body.ep-app #app .ap-bibk .apico img{width:72%;height:72%;object-fit:contain}
html body.ep-app #app .ap-bibk .aptx{flex:1;min-width:0;position:relative;z-index:1}
html body.ep-app #app .ap-bibk .aptx b{font:800 1.25rem/1.1 Lexend,system-ui,sans-serif!important;color:#FFE38A!important;text-shadow:0 2px 4px rgba(0,0,0,.5)}
html body.ep-app #app .ap-bibk .aptx small{font:600 .78rem/1.3 Lexend,sans-serif!important;color:#fff!important;opacity:1!important;text-shadow:0 1px 3px rgba(0,0,0,.5)}
html body.ep-app #app .ap-bibb{flex:none;display:flex;align-items:flex-end;height:74px;margin:-10px 0 -18px}
html body.ep-app #app .ap-bibb img{height:100%;width:auto;margin-left:-22px;filter:drop-shadow(-3px 3px 4px rgba(0,0,0,.45))}
html body.ep-app #app .ap-bibb img:nth-child(1){transform:rotate(-8deg) translateY(4px)}
html body.ep-app #app .ap-bibb img:nth-child(3){transform:rotate(7deg) translateY(3px)}
html body.ep-app #app .ap-bibzu{flex:none;font:800 1.7rem Lexend,sans-serif;color:#FFE38A;padding-right:2px}
@media (max-width:360px){html body.ep-app #app .ap-bibb{display:none}}
@media (min-width:700px){html body.ep-app #app .ap-bibk .aptx b{font-size:1.6rem!important}html body.ep-app #app .ap-bibk .aptx small{font-size:1rem!important}html body.ep-app #app .ap-bibb{height:96px}}`;
  document.head.appendChild(c);
  function mach(){
    try{ const b = (typeof S !== "undefined" && S.bereich && S.bereich.id) || ""; if(document.documentElement.dataset.epb !== b) document.documentElement.dataset.epb = b; }catch(e){}
    if(!document.body.classList.contains("ep-app")) return;
    document.querySelectorAll("#app .thema").forEach(k => { if(k.querySelector(".ep-wz2")) return; const i = k.querySelector(".emo img"); if(!i) return;
      const w = document.createElement("img"); w.className = "ep-wz2"; w.src = i.getAttribute("src"); w.alt = ""; w.setAttribute("aria-hidden", "true"); k.appendChild(w); });
    document.querySelectorAll("#app .np-allethemen").forEach(k => { if(k.querySelector(".ep-play")) return; const sp = k.querySelector(":scope > span");
      if(sp) sp.innerHTML = "Aus allen Themen spielen<small>Gemischte Fragen aus dem ganzen Bereich</small>";
      k.insertAdjacentHTML("beforeend", `<img class="ep-wz3" src="img/qeels-icons/themen/zufall.webp?v=2" alt="" aria-hidden="true"><span class="ep-play" aria-hidden="true"><img src="img/grafik/duell/play-symbol.webp" alt=""></span>`); });
    /* Titel: kein Wort darf über die Kachel ragen, höchstens 3 Zeilen; jeder Titel so gross wie möglich */
    if(!document.body.matches(".ep-s-bereich,.ep-s-submenu")) return;
    const bs = [...document.querySelectorAll("#app .thema b")]; if(!bs.length || !bs[0].clientWidth) return;
    const max = innerWidth >= 700 ? 17 : 13; let m = max;
    bs.forEach(b => { let f = max; const set = () => b.style.setProperty("font-size", f + "px", "important"); set();
      let n = 0; while((b.scrollWidth > b.clientWidth + 1 || b.getBoundingClientRect().height > f * 1.15 * 3 + 2) && f > 9 && n++ < 10){ f -= .5; set(); }
      m = Math.min(m, f); });
  }
  const start = () => { const app = document.getElementById("app"); if(!app) return setTimeout(start, 300); let pl = 0; new MutationObserver(() => { clearTimeout(pl); pl = setTimeout(mach, 120); }).observe(app, {childList:true, subtree:true}); mach(); };
  start(); addEventListener("resize", () => setTimeout(mach, 200));
})();
/* Profil-Tab: Seite «Einstellungen» (profilEinstHTML in app.js) als Menü: Gruppen mit Überschrift, weisse Liste mit Zeilen */
(function(){ const c = document.createElement("style"); c.id = "ep-appeinst-css";
c.textContent = `
html body.ep-app #app .ap-peinst{gap:8px!important}
html body.ep-app #app .ap-peinst .ap-psubkopf{display:flex;align-items:center;gap:10px;flex:none}
html body.ep-app #app .ap-peinst .ap-psubkopf b{font:800 1.3rem Lexend,system-ui,sans-serif;color:#fff;text-shadow:0 2px 5px rgba(0,0,0,.45)}
html body.ep-app #app .ap-peinst .ap-pzur{border:0;border-radius:99px;padding:8px 15px;background:rgba(255,255,255,.95);color:#3A2F72;font:800 14px Lexend,sans-serif;cursor:pointer;box-shadow:0 4px 10px rgba(30,20,90,.25)}
html body.ep-app #app .ap-peinst .ap-escroll{flex:1 1 0;min-height:0;overflow-y:auto;overscroll-behavior:contain;display:flex;flex-direction:column;gap:10px;padding:2px 2px 6px;-webkit-overflow-scrolling:touch}
html body.ep-app #app .ap-peinst .ap-eg2 h3{margin:0 0 4px 12px;font:800 11px Lexend,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.5)}
html body.ep-app #app .ap-peinst .ap-el{background:rgba(255,255,255,.96);border-radius:18px;box-shadow:0 8px 20px rgba(30,20,90,.22);overflow:hidden}
html body.ep-app #app .ap-peinst .ap-ez{display:flex;align-items:center;gap:12px;width:100%;min-height:44px;padding:5px 14px;border:0;background:none;color:#2E2560;text-decoration:none;font:700 15px Lexend,system-ui,sans-serif;text-align:left;cursor:pointer;box-sizing:border-box}
html body.ep-app #app .ap-peinst .ap-ez + .ap-ez{border-top:1px solid rgba(58,47,114,.1)}
html body.ep-app #app .ap-peinst .ap-ez:active{background:rgba(123,91,255,.1)}
html body.ep-app #app .ap-peinst .ap-ez img{flex:none;width:28px;height:28px;object-fit:contain}
html body.ep-app #app .ap-peinst .ap-ez span{flex:1;min-width:0}
html body.ep-app #app .ap-peinst .ap-ez i{font:700 20px Lexend,sans-serif;font-style:normal;color:#A79CD6}
html body.ep-app #app .ap-peinst .ap-eab{display:flex;align-items:center;justify-content:center;gap:8px;min-height:44px;border:0;border-radius:18px;background:rgba(255,255,255,.96);color:#D6362E;font:800 15px Lexend,sans-serif;box-shadow:0 8px 20px rgba(30,20,90,.22);cursor:pointer;flex:none}
html body.ep-app #app .ap-peinst .ap-eab img{width:24px;height:24px}
@media (max-height:760px){html body.ep-app #app .ap-peinst .ap-ez{min-height:38px;font-size:14px}html body.ep-app #app .ap-peinst .ap-ez img{width:24px;height:24px}}
@media (min-width:700px){html body.ep-app #app .ap-peinst .ap-escroll{display:grid;grid-template-columns:1fr 1fr;align-content:start;gap:14px}html body.ep-app #app .ap-peinst .ap-eab{grid-column:1/-1}html body.ep-app #app .ap-peinst .ap-ez{min-height:52px;font-size:17px}}`;
document.head.appendChild(c); })();

/* Duell am Handy: Band «Wähle dein Team» kleiner */
(function(){ const c = document.createElement("style");
c.textContent = `@media (max-width:700px){html body #app .du2-team.du2-team2 > h2.tk-titel.lbl{font-size:1rem!important;padding:5px 16px!important;margin:0 auto 12px!important;letter-spacing:0!important;min-height:0!important;line-height:1.3!important}}`;
document.head.appendChild(c); })();

/* ===== Duell am Handy/iPad (App-Ansicht): ganze Seite ohne Scrollen =====
   Kopf kompakt, vier Team-Karten in einer Reihe (nur Kind und Name), der Joker des gewählten Teams als eine Zeile
   darunter (.du-jkz, per JS aus der Karte), Play-Knopf und Einstellungen flacher. Passt es trotzdem nicht, wird #app per zoom verkleinert. */
(function(){
  const D = "html body.ep-app.ep-s-duell #app";
  const c = document.createElement("style"); c.id = "ep-duellfit-css";
  c.textContent = `
${D} .du3-kopf{padding-top:0!important;padding-bottom:0!important;min-height:0!important;margin-bottom:8px!important}
${D} .du3-kopf .du3-titel p,${D} .du3-kopf .du3-kids{display:none!important}
${D} .du3-kopf h1{font-size:1.35rem!important;margin:0!important}
${D} .du3-kopf .du3-ic{width:36px!important;height:36px!important}
${D} .du3-kopf .du3-elo{padding:6px 12px!important;margin-top:6px!important}
${D} .du3-kopf .du3-elo .du3-zahl{font-size:1.2rem!important}
${D} .du2-team.du2-team2 > h2.tk-titel.lbl{font-size:.9rem!important;padding:4px 14px!important;margin:0 auto 8px!important}
${D} .du2-team2 .du2-kids{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:6px!important}
${D} .du2-team2 .du2-tk{min-height:0!important;height:auto!important;aspect-ratio:auto!important;padding:4px 2px 6px!important;gap:0!important;border-width:12px!important;border-image-width:12px!important}
${D} .du2-team2 .du2-tk .tk-joker,${D} .du2-team2 .du2-tk .tk-haken,${D} .du2-team2 .du2-tk .tk-fk{display:none!important}
${D} .du2-team.du2-team2 .du2-kids .du2-tk.du2-tk > span.tk-joker.tk-joker{display:none!important}
${D} .du2-team.du2-team2 .du2-kids .du2-tk.du2-tk .tk-bild{height:78px!important}
@media (min-width:700px){${D} .du2-team.du2-team2 .du2-kids .du2-tk.du2-tk .tk-bild{height:150px!important}}
${D} .du2-team2 .du2-tk .tk-bild{height:78px!important;width:auto!important;max-width:100%!important;margin:0 auto!important;position:static!important;transform:none!important}
${D} .du2-team2 .du2-tk .tk-name{margin:2px 0 0!important;position:static!important}
${D} .du2-team2 .du2-tk .tk-name img{width:100%!important;height:auto!important;max-height:38px!important;object-fit:contain}
${D} .du2-team.du2-team2 .du2-kids:has(.an) .du2-tk.du2-tk:not(.an){opacity:.62!important;filter:saturate(.75)!important}
${D} .du2-team.du2-team2 .du2-kids .du2-tk.du2-tk.an{opacity:1!important;filter:drop-shadow(0 0 3px #FFE34D) drop-shadow(0 0 9px rgba(255,200,40,.9))!important}
${D} .du-jkz{display:flex;align-items:center;gap:10px;margin:8px 0 0;padding:7px 12px;border-radius:16px;background:rgba(255,255,255,.95);box-shadow:0 6px 14px rgba(30,20,90,.2);color:#2E2560;font:600 12px/1.3 Lexend,system-ui,sans-serif}
${D} .du-jkz i{flex:none;width:34px;height:34px;display:grid;place-items:center;font-style:normal}
${D} .du-jkz i img{width:100%;height:100%;object-fit:contain}
${D} .du-jkz b{display:block;font-weight:800;font-size:13px;color:#5A2BB0}
${D} .du2-joker-info{display:none!important}
${D} .du3-play{min-height:0!important;margin:10px auto 6px!important;padding-top:0!important;padding-bottom:0!important;height:64px!important}
${D} .du3-play b{font-size:1.15rem!important}${D} .du3-play small{font-size:.7rem!important}
${D} .du3-play img{width:40px!important;height:40px!important}
${D} .du2-ein{margin-top:4px!important}${D} .du2-ein summary{padding:8px 14px!important;min-height:0!important}
@media (min-width:700px){${D} .du2-team2 .du2-tk .tk-bild{height:150px!important}${D} .du2-team2 .du2-tk .tk-name img{max-height:60px!important}${D} .du-jkz{font-size:15px;padding:10px 16px}${D} .du-jkz b{font-size:16px}${D} .du-jkz i{width:46px;height:46px}${D} .du3-play{height:84px!important}}
html.ep-dfit,html.ep-dfit body{overflow:hidden!important;overscroll-behavior:none!important}`;
  document.head.appendChild(c);
  function jokerZeile(){
    const box = document.querySelector("#app .du2-team2"); if(!box) return;
    const an = box.querySelector(".du2-tk.an") || box.querySelector(".du2-tk"); if(!an) return;
    let z = box.querySelector(".du-jkz"); if(!z){ z = document.createElement("div"); z.className = "du-jkz"; z.setAttribute("aria-live", "polite"); box.appendChild(z); }
    const j = an.querySelector(".tk-joker"); if(!j) return;
    const mz = j.querySelector(".tk-muenze"), b = j.querySelector("b"), s = j.querySelector("small");
    const neu = `<i>${mz ? mz.innerHTML : ""}</i><span><b>${b ? b.textContent : ""}</b>${s ? s.textContent : ""} · 1× pro Duell</span>`;
    if(z.innerHTML !== neu) z.innerHTML = neu;
  }
  function passen(){
    const app = document.getElementById("app"); if(!app) return;
    let an = false; try{ an = document.body.classList.contains("ep-app") && S.screen === "duell" && !document.querySelector("#du2Ein[open]"); }catch(e){}
    document.documentElement.classList.toggle("ep-dfit", an);
    if(!an){ if(app.dataset.dfit){ app.style.zoom = ""; delete app.dataset.dfit; } return; }
    jokerZeile();
    app.style.zoom = ""; app.dataset.dfit = "1"; if(scrollY) scrollTo(0, 0);
    const tb = document.getElementById("epTabs"), quer = tb && tb.getBoundingClientRect().width < innerWidth / 3;
    const unten = tb && !quer ? tb.getBoundingClientRect().top - 8 : innerHeight - 8;
    let last = 0; app.querySelectorAll(":scope > *, :scope .du2 > *").forEach(e => { const r = e.getBoundingClientRect(); if(r.height) last = Math.max(last, r.bottom); });
    const oben = app.getBoundingClientRect().top;
    if(last > unten) app.style.zoom = Math.max(.62, (unten - oben) / (last - oben)).toFixed(3);
  }
  let t = 0; const los = () => { clearTimeout(t); t = setTimeout(passen, 80); };
  const start = () => { const app = document.getElementById("app"); if(!app) return setTimeout(start, 300);
    new MutationObserver(los).observe(app, {childList:true, subtree:true, attributes:true, attributeFilter:["class", "open"]}); los(); };
  start(); addEventListener("resize", los);
  /* Team gewählt: Joker-Zeile sofort mitwechseln, nicht erst 80 ms später (sonst springt die Seite) */
  document.addEventListener("click", e => { if(document.body.classList.contains("ep-app") && e.target.closest && e.target.closest("#app [data-team]")) jokerZeile(); });
})();

/* ===== Duell: Play-Knopf schmaler (nicht ganze Breite) und Einstellungen im neuen Stil ===== */
(function(){
  const A = "html body #app";
  const c = document.createElement("style"); c.id = "ep-duellein-css";
  c.textContent = `
${A} .du3-play.du3-play{width:auto!important;min-width:250px;max-width:min(380px,100%)!important;height:72px!important;padding:0 38px 0 26px!important;margin:14px auto 10px!important;gap:12px!important}
${A} .du3-play.du3-play small{display:none!important}
${A} .du3-play.du3-play b{font-size:1.45rem!important;white-space:nowrap}
${A} .du3-play.du3-play img{width:44px!important;height:44px!important}
html body.ep-app #app .du3-play.du3-play{height:58px!important;min-width:220px;padding:0 30px 0 20px!important;margin:10px auto 8px!important}
html body.ep-app #app .du3-play.du3-play b{font-size:1.2rem!important}
html body.ep-app #app .du3-play.du3-play img{width:36px!important;height:36px!important}
/* Einstellungen */
${A} details.du2-ein#du2Ein{max-width:560px;margin:8px auto 0!important;background:rgba(255,255,255,.96)!important;border:0!important;border-radius:20px!important;box-shadow:0 8px 20px rgba(30,20,90,.2)!important;overflow:hidden;padding:0!important;color:#2E2560!important;backdrop-filter:none!important}
${A} details.du2-ein#du2Ein > summary{display:flex!important;align-items:center;gap:12px;padding:8px 14px!important;min-height:0!important;list-style:none;cursor:pointer;background:none!important;border:0!important;color:#2E2560!important;font:700 14px Lexend,system-ui,sans-serif!important}
${A} details.du2-ein#du2Ein > summary::-webkit-details-marker{display:none}
${A} details.du2-ein#du2Ein .du-eic{flex:none;width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 35% 30%,#FFF6C8,#FFD54A 55%,#E0A800);box-shadow:0 2px 5px rgba(0,0,0,.25),inset 0 -2px 3px rgba(150,90,0,.3)}
${A} details.du2-ein#du2Ein .du-eic img{width:70%;height:70%;object-fit:contain}
${A} details.du2-ein#du2Ein .du-etx{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px;text-align:left}
${A} details.du2-ein#du2Ein .du-etx b{font:800 15px Lexend,sans-serif;color:#2E2560}
${A} details.du2-ein#du2Ein .du-etx .zus{font:600 12px Lexend,sans-serif;color:#6B6295;opacity:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
${A} details.du2-ein#du2Ein .pf{flex:none;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:rgba(123,91,255,.12);color:#6A4BFF;font-size:13px;transition:transform .2s}
${A} details.du2-ein#du2Ein[open] .pf{transform:rotate(90deg)}
${A} details.du2-ein#du2Ein .inhalt{padding:4px 14px 14px!important;border-top:1px solid rgba(58,47,114,.1);background:none!important}
${A} details.du2-ein#du2Ein .pick-lbl{margin:10px 0 6px!important;font:800 11px Lexend,sans-serif!important;letter-spacing:.08em;text-transform:uppercase;color:#7A70A8!important}
${A} details.du2-ein#du2Ein select.sel{width:100%;min-height:44px;border-radius:14px!important;border:2px solid #E4DEFA!important;background:#F7F4FF!important;color:#2E2560!important;font:700 14px Lexend,sans-serif!important;padding:0 12px!important}
${A} details.du2-ein#du2Ein .segs{display:grid!important;grid-template-columns:repeat(4,1fr);gap:6px;background:none!important;padding:0!important;border:0!important}
${A} details.du2-ein#du2Ein .seg{display:flex!important;flex-direction:column;align-items:center;gap:3px;padding:7px 2px!important;border-radius:14px!important;border:2px solid #E4DEFA!important;background:#F7F4FF!important;color:#2E2560!important;font:700 12px Lexend,sans-serif!important;box-shadow:none!important;min-height:0!important}
${A} details.du2-ein#du2Ein .seg .sgi img{width:30px;height:30px;object-fit:contain;display:block}
${A} details.du2-ein#du2Ein .seg[aria-pressed="true"]{background:linear-gradient(135deg,#6A4BFF,#A43BE0 55%,#E8409F)!important;border-color:transparent!important;color:#fff!important;box-shadow:0 4px 10px rgba(110,50,200,.35)!important}
${A} details.du2-ein#du2Ein .anzahl{display:flex!important;align-items:center;gap:12px;background:none!important;padding:0!important}
${A} details.du2-ein#du2Ein .anzahl b{flex:none;min-width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 35% 30%,#FFF6C8,#FFD54A 55%,#E0A800);color:#5A2A00;font:800 17px Lexend,sans-serif;box-shadow:0 2px 5px rgba(0,0,0,.2)}
${A} details.du2-ein#du2Ein .anzahl input[type=range]{flex:1;accent-color:#A43BE0}
html.ep-dfit body.ep-app #app details.du2-ein#du2Ein[open]{position:relative;z-index:5}`;
  document.head.appendChild(c);
})();

/* ===== Profil: Abzeichen anklickbar wie Erfolge in einem Spiel (Fenster #abzFenster aus garderobe.js),
   Vitrine-Medaillen mit Dejans Symbolen, Knopf «Profil verzieren» golden ===== */
(function(){ const c = document.createElement("style"); c.id = "ep-abz-css";
c.textContent = `
.abz-f{position:fixed;inset:0;z-index:9000;background:rgba(18,12,48,.55);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);display:grid;place-items:center;padding:16px}
.abz-f[hidden]{display:none}
html.abz-offen,html.abz-offen body{overflow:hidden}
.abz-k{width:min(640px,100%);max-height:min(88vh,860px);overflow:auto;background:#fff;color:#2E2560;border-radius:26px;box-shadow:0 24px 60px rgba(20,10,60,.45);padding:16px 16px 14px;font-family:Lexend,system-ui,sans-serif}
.abz-kopf{display:flex;align-items:center;gap:10px;margin-bottom:12px}
.abz-kopf h2{flex:1;margin:0;font:800 1.35rem Lexend,sans-serif;color:#2E2560}
.abz-zahl{font:700 12px Lexend,sans-serif;background:#F1ECFF;color:#5A2BB0;border-radius:99px;padding:4px 10px}
.abz-zu,.abz-zur{border:0;cursor:pointer;border-radius:99px;background:#F1ECFF;color:#5A2BB0;font:800 14px Lexend,sans-serif;height:36px;min-width:36px;padding:0 12px}
.abz-gitter{display:grid;grid-template-columns:repeat(auto-fill,minmax(118px,1fr));gap:10px}
.abz-it{display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 6px 10px;border-radius:18px;border:2px solid #EEE9FF;background:#FBFAFF;cursor:pointer;color:#2E2560;font-family:inherit;text-align:center}
.abz-it:hover{border-color:var(--mf)}
.abz-it b{font:800 13px/1.15 Lexend,sans-serif}.abz-it small{font:600 11px Lexend,sans-serif;color:#7A70A8}
.abz-it.aus .abz-med{filter:grayscale(1);opacity:.5}
.abz-med{width:62px;height:62px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 35% 30%,#fff,#F4EEFF 62%,#E2D8FF);border:4px solid var(--mf,#E0A800);box-shadow:0 0 0 2px #fff,0 0 14px color-mix(in srgb,var(--mf,#E0A800) 60%,transparent);font-size:30px}
.abz-med img{width:64%;height:64%;object-fit:contain}
.abz-med.gross{width:96px;height:96px;flex:none;font-size:44px;border-width:5px}
.abz-k em{display:inline-block;font-style:normal;font:800 10.5px Lexend,sans-serif;color:#fff;background:var(--sf);border-radius:99px;padding:2px 8px;letter-spacing:.02em}
.abz-held{display:flex;gap:16px;align-items:center;padding:14px;border-radius:20px;background:linear-gradient(135deg,color-mix(in srgb,var(--mf) 14%,#fff),#fff);border:2px solid color-mix(in srgb,var(--mf) 35%,#fff);margin-bottom:12px}
.abz-held > div{flex:1;min-width:0}
.abz-was{margin:0 0 4px;font:800 1.05rem/1.3 Lexend,sans-serif}
.abz-stand{margin:0 0 8px;font:600 13px Lexend,sans-serif;color:#5D5486}
.abz-bar{height:10px;border-radius:99px;background:#EAE5FA;overflow:hidden;margin-bottom:4px}.abz-bar i{display:block;height:100%;background:linear-gradient(90deg,#FFE34D,#FFB020);border-radius:inherit}
.abz-held small{font:600 12px Lexend,sans-serif;color:#7A70A8}
.abz-stufen{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.abz-stufen li{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:14px;background:#FBFAFF;border:2px solid #EEE9FF}
.abz-stufen li.ok{border-color:color-mix(in srgb,var(--mf) 55%,#fff);background:color-mix(in srgb,var(--mf) 9%,#fff)}
.abz-pkt{flex:none;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:#E7E2F7;color:#7A70A8;font:800 13px Lexend,sans-serif}
.abz-stufen li.ok .abz-pkt{background:var(--mf);color:#fff}
.abz-sn{flex:1;min-width:0;display:flex;flex-direction:column}.abz-sn b{font:800 14px Lexend,sans-serif;color:var(--mf)}.abz-sn small{font:600 11.5px Lexend,sans-serif;color:#7A70A8}
.abz-pz{flex:none;display:flex;flex-direction:column;align-items:flex-end;gap:2px}.abz-pz b{font:800 15px Lexend,sans-serif}
.abz-fuss{margin:12px 2px 0;font:500 11.5px/1.4 Lexend,sans-serif;color:#8A82B0}
@media (max-width:480px){.abz-f{padding:8px;align-items:end}.abz-k{max-height:86vh;border-radius:24px 24px 18px 18px}.abz-gitter{grid-template-columns:repeat(3,1fr);gap:7px}.abz-med{width:52px;height:52px}.abz-it{padding:10px 4px 8px}.abz-it b{font-size:12px}.abz-held{flex-direction:column;text-align:center}}
/* Vitrine und Zahl anklickbar */
html body #app .pp-vit .pp-med{cursor:pointer;font-family:inherit;color:inherit}
html body #app .pp-vit .pp-med > span img{width:70%;height:70%;object-fit:contain}
html body #app .pp-zahl-ab{cursor:pointer;font-family:inherit;color:inherit}
html body #app .pp-alleab{margin:10px auto 0;display:block;border:0;cursor:pointer;border-radius:99px;padding:9px 18px;background:rgba(255,255,255,.95);color:#5A2BB0;font:800 14px Lexend,sans-serif;box-shadow:0 4px 10px rgba(30,20,90,.25)}
html body #app .pp-kopf .pp-knopf.pp-knopf-gold{border:0 solid transparent!important;border-width:12px 24px!important;border-radius:0!important;border-image:url("img/grafik/knopf-gold.webp?v=1") 52 87 fill / 12px 24px stretch!important;background:none!important;color:#5A2A00!important;font:800 15px Lexend,sans-serif!important;padding:0 6px!important;margin-top:10px;box-shadow:none!important;text-shadow:0 1px 0 rgba(255,255,255,.5)}`;
document.head.appendChild(c); })();

/* ===== Themen-Kacheln: Fortschrittsring ums Symbol (Dejans Wahl, Vorschlag B) =====
   Goldener Ring um das Symbol (.emo::before, conic-gradient bis --gp) und Prozent-Pille oben rechts (.emo::after, data-gp).
   Anteil = gelöste Fragen (mindestens einmal richtig) in der gewählten Stufe, aus window.EP_GELOEST (lernen.js). */
(function(){
  const c = document.createElement("style"); c.id = "ep-gring-css";
  c.textContent = `
html body #app .thema[data-gp] .emo{position:relative!important;overflow:visible!important}
html body #app .thema[data-gp] .emo::before{content:"";position:absolute;inset:-7px;border-radius:calc(var(--gr,22px) + 7px);padding:5px;background:conic-gradient(#FFD54A var(--gp), rgba(255,255,255,.28) 0);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0);pointer-events:none;z-index:1;filter:drop-shadow(0 0 4px rgba(255,210,60,.45))}
html body #app .thema[data-gp] .emo::after{content:attr(data-gp);position:absolute;right:-16px;top:-12px;z-index:3;background:#fff;color:#2E2560;font:800 11px/1 Lexend,system-ui,sans-serif;border-radius:99px;padding:3px 7px;box-shadow:0 2px 6px rgba(0,0,0,.25);white-space:nowrap;pointer-events:none}
html body.ep-app #app .thema[data-gp] .emo{--gr:50%;margin-top:7px!important}
html body.ep-app #app .thema[data-gp] .emo::before{inset:-5px;padding:4px;border-radius:50%}
html body.ep-app #app .thema[data-gp] .emo::after{font-size:9.5px;padding:2px 5px;right:-20px;top:auto;bottom:-4px}`;
  document.head.appendChild(c);
  function mach(){
    const G = window.EP_GELOEST; if(!G) return;
    let st = 0; try{ st = S.stufe; }catch(e){}
    let an = false; try{ an = !!S.profil; }catch(e){}
    if(!an){ document.querySelectorAll("#app .thema[data-gp]").forEach(k => { delete k.dataset.gp; const e = k.querySelector(".emo"); if(e) delete e.dataset.gp; }); return; }
    document.querySelectorAll("#app .thema[data-t]").forEach(k => {
      const id = k.dataset.t; let a = 0; try{ if(!THEMA[id]) return; a = G.anteil(id, st); }catch(e){ return; }
      const p = Math.round(a * 100), txt = (a > 0 && p === 0 ? "<1" : p) + " %";
      const e = k.querySelector(".emo"); if(!e) return;
      if(k.dataset.gp !== txt){ k.dataset.gp = txt; e.dataset.gp = txt; }
      e.style.setProperty("--gp", (a * 100).toFixed(1) + "%");
      if(!e.dataset.gr){ const r = getComputedStyle(e).borderTopLeftRadius; e.dataset.gr = "1"; if(r && !/%/.test(r)) e.style.setProperty("--gr", r); }
    });
  }
  let t = 0; const los = () => { clearTimeout(t); t = setTimeout(mach, 60); };
  const start = () => { const app = document.getElementById("app"); if(!app) return setTimeout(start, 300); new MutationObserver(los).observe(app, {childList:true, subtree:true}); los(); };
  start();
})();

/* ===== Duell (Computer und Handy/iPad): Zahnrad mit Hinweis im Kopf, Einstellungen nur offen sichtbar,
   Kachel Rangliste und Season (rangSeasonHTML in duell2.js), Joker-Zeile mit fester Höhe.
   Dazu: Ton- und Sprachknopf oben nur auf der Startseite. Sitzung «App», 03.11. ===== */
(function(){
  const E = "img/grafik/entdecken/", A = "html body #app";
  const c = document.createElement("style"); c.id = "ep-duell-zahn-css";
  c.textContent = `
html:not([data-scr="home"]) body :is(.xs-knopf,.xui-knopf),html body.ep-app #app .ap-kz :is(.xs-knopf,.xui-knopf){display:none!important}
html body.ep-app.ep-s-duell #app > .ap-kz.ap-kz-tab{display:none!important}
${A} .du3-kopf{position:relative}
${A} .du3-zahn{position:absolute;top:2px;right:2px;z-index:4;display:flex;flex-direction:row-reverse;align-items:center;gap:8px;margin:0;padding:0;border:0;background:none;color:#fff;cursor:pointer;-webkit-tap-highlight-color:transparent}
${A} .du3-zm{flex:none;width:46px;height:46px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 35% 30%,#FFF6C8,#FFD54A 55%,#E0A800);box-shadow:0 3px 8px rgba(0,0,0,.3),inset 0 -2px 3px rgba(150,90,0,.35);transition:transform .35s}
${A} .du3-zm img{width:70%;height:70%;object-fit:contain;filter:drop-shadow(0 1px 2px rgba(80,40,0,.3))}
${A} .du3-zahn[aria-expanded="true"] .du3-zm{transform:rotate(60deg)}
${A} .du3-zahn:active .du3-zm{transform:translateY(1px)}
${A} .du3-zh{max-width:min(42vw,260px);padding:4px 10px;border-radius:99px;background:rgba(255,255,255,.95);color:#4A2F9A;font:700 11px/1.2 Lexend,system-ui,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-shadow:0 3px 8px rgba(30,20,90,.25)}
${A} details.du2-ein#du2Ein:not([open]){display:none!important}
${A} .du2-team2 .du-jkz{height:58px;box-sizing:border-box;overflow:hidden}
${A} .du2-team2 .du-jkz > span{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
${A} .du2-joker-info{min-height:4.4em}
/* Kachel Rangliste und Season */
${A} .du-rs{display:grid;grid-template-columns:1fr 1fr;margin:12px auto 4px;max-width:760px;border:0 solid transparent;border-width:18px;border-image:url("${E}kachel-10.webp?v=3") 46 fill / 18px stretch;filter:drop-shadow(0 8px 14px rgba(20,20,80,.35));color:#fff}
${A} .du-rs-k{position:relative;display:flex;align-items:center;gap:10px;min-width:0;margin:0;padding:2px 6px;border:0;background:none;color:#fff;text-align:left;cursor:pointer;font:inherit}
${A} .du-rs-se{border-left:1px solid rgba(255,255,255,.28);padding-left:12px;padding-bottom:14px}
${A} .du-rs-m{flex:none;width:46px;height:46px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 35% 30%,#FFF6C8,#FFD54A 55%,#E0A800);box-shadow:0 3px 6px rgba(0,0,0,.3),inset 0 -2px 3px rgba(150,90,0,.35)}
${A} .du-rs-m img{width:72%;height:72%;object-fit:contain}
${A} .du-rs-t{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}
${A} .du-rs-t :is(small,b,em){text-shadow:0 1px 3px rgba(0,0,0,.5);font-style:normal}
${A} .du-rs-t small{font:800 10px Lexend,sans-serif;letter-spacing:.08em;text-transform:uppercase;opacity:.9}
${A} .du-rs-t b{font:800 15px/1.15 Lexend,sans-serif;overflow-wrap:anywhere}
${A} .du-rs-t em{font:600 11px/1.25 Lexend,sans-serif;opacity:.95}
${A} .du-rs-x{display:inline-block;padding:0 6px;border-radius:99px;background:#FFD54A;color:#5A2A00;font-style:normal;text-shadow:none}
${A} .du-rs-bar{position:absolute;left:12px;right:6px;bottom:0;height:7px;display:flex;border-radius:99px;overflow:visible;background:rgba(0,0,0,.25)}
${A} .du-rs-bar > span{display:block;position:static!important;flex:none;height:100%!important;margin:0!important;background:rgba(255,255,255,.35)}
${A} .du-rs-bar > span:first-child{border-radius:99px 0 0 99px}
${A} .du-rs-bar > span.du-rs-s2{background:#FFB020}
${A} .du-rs-bar > span.du-rs-s3{background:#FF5F6D;border-radius:0 99px 99px 0}
${A} .du-rs-bar > i{position:absolute;top:50%;width:13px;height:13px;margin:-6.5px 0 0 -6.5px;border-radius:50%;background:#fff;box-shadow:0 0 0 3px #FFD54A,0 1px 4px rgba(0,0,0,.4)}
${A} .du-rs-k:active{transform:translateY(1px)}
@media (max-width:420px){${A} .du-rs{border-width:14px;border-image-width:14px}${A} .du-rs-m{width:36px;height:36px}${A} .du-rs-t b{font-size:13px}${A} .du-rs-t em{font-size:10px}${A} .du-rs-k{gap:7px}${A} .du3-zm{width:40px;height:40px}${A} .du3-zh{font-size:10px;max-width:46vw}}
@media (min-width:700px){${A} .du-rs-m{width:58px;height:58px}${A} .du-rs-t b{font-size:19px}${A} .du-rs-t em{font-size:13px}${A} .du-rs-t small{font-size:12px}${A} .du3-zm{width:56px;height:56px}${A} .du3-zh{font-size:13px;padding:5px 12px}${A} .du2-team2 .du-jkz{height:72px}}
/* Computer: Zahnrad in der leeren Zeile unter dem Titel statt über der Liga-Karte */
html body:not(.ep-app) #app .du3-kopf .du3-zahn{position:static;grid-area:modi;justify-self:start;flex-direction:row}
@media (max-width:420px){${A} .du-rs-rang em{display:none}${A} .du3-zh{max-width:40vw}}`;
  document.head.appendChild(c);
})();

/* ===== Rangliste und Season im neuen Stil (renderBoard in index.html), Computer und Handy/iPad. Sitzung «App», 03.11.
   Regeln als weisse Karten mit Symbol in goldener Münze, Umschalter als weisse Glas-Pillen (gewählt Violett-Pink),
   Season-Band als Glanz-Kachel, Zeitstrahl golden, Tier-Karte und Kalender als weisse Karten mit Tier in Münze,
   Podest auf nachtblauer Bühne mit Gold-, Silber- und Bronze-Sockel, Liste als weisse Karte mit violettem Kopfband. ===== */
(function(){
  const E = "img/grafik/entdecken/", G = "img/grafik/diverse/", A = 'html[data-scr="board"] body #app';
  const MZ = "radial-gradient(circle at 35% 30%,#FFF6C8,#FFD54A 55%,#E0A800)";
  const VP = "linear-gradient(135deg,#6A4BFF,#A43BE0 55%,#E8409F)";
  const c = document.createElement("style"); c.id = "ep-rangliste-neu-css";
  c.textContent = `
/* Regeln im Kopf */
${A} .rlkopf .rlregeln>div{background:rgba(255,255,255,.95)!important;border:0!important;border-radius:18px!important;box-shadow:0 6px 16px rgba(20,10,80,.25)!important;color:#3A2F72!important;padding:12px 14px!important}
${A} .rlkopf .rlregeln>div b{display:flex!important;align-items:center;gap:8px;color:#4A2BB0!important;font:800 14px/1.2 Lexend,system-ui,sans-serif!important;margin-bottom:4px}
${A} .rlkopf .rlregeln>div span{color:#4E4880!important;font:500 12.5px/1.4 Lexend,sans-serif!important}
${A} .rl-mz{flex:none;width:30px;height:30px;border-radius:50%;display:inline-grid;place-items:center;background:${MZ};box-shadow:0 2px 4px rgba(0,0,0,.25)}
${A} .rl-mz img{width:72%;height:72%;object-fit:contain}
${A} .rlkopf .rlpokal span{font-size:0!important;width:74%;height:74%;display:grid;place-items:center;line-height:0}
${A} .rlkopf .rlpokal span img{width:100%;height:100%;object-fit:contain;display:block}
/* Umschalter Gesamt/Seasons und Stufen */
${A} .segs.rlmodus,${A} .segs.rlsegs{display:flex!important;flex-wrap:wrap;justify-content:center;gap:6px!important;width:fit-content;max-width:100%;margin:16px auto 12px!important;padding:6px!important;border-radius:999px!important;background:rgba(255,255,255,.9)!important;border:0!important;box-shadow:0 6px 16px rgba(30,20,90,.2)!important;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
${A} .segs.rlmodus .seg,${A} .segs.rlsegs .seg{display:inline-flex!important;align-items:center;gap:6px;min-height:40px!important;padding:6px 16px!important;border-radius:999px!important;border:0!important;background:transparent!important;color:#3A2F72!important;font:700 14px Lexend,system-ui,sans-serif!important;box-shadow:none!important}
${A} .segs.rlmodus .seg[aria-pressed="true"],${A} .segs.rlsegs .seg[aria-pressed="true"]{background:${VP}!important;color:#fff!important;box-shadow:0 4px 10px rgba(110,50,200,.35)!important}
${A} .segs.rlsegs .seg .sgi img,${A} .segs.rlmodus .seg img{width:24px;height:24px;object-fit:contain;vertical-align:middle}
${A} .segs.rlsegs .seg .sgt{color:inherit!important}
/* Auswahlfelder */
${A} :is(.seasonwahl,.kpick){display:flex;align-items:center;justify-content:center;gap:10px;margin:0 auto 14px!important}
${A} .seasonwahl label b{color:#fff;text-shadow:0 1px 3px rgba(20,10,60,.5);font:800 15px Lexend,sans-serif}
${A} :is(.seasonwahl,.kpick) select.sel{min-height:46px;border-radius:16px!important;border:0!important;background:rgba(255,255,255,.96)!important;color:#2E2560!important;font:700 14px Lexend,sans-serif!important;padding:0 14px!important;box-shadow:0 6px 14px rgba(30,20,90,.18)!important}
/* Season-Band als Glanz-Kachel */
${A} .seasonkopf{max-width:1040px;margin:0 auto}
${A} .seasonband{background:none!important;border:0 solid transparent!important;border-width:18px!important;border-radius:0!important;border-image:url("${E}kachel-06.webp?v=3") 46 fill / 18px stretch!important;filter:drop-shadow(0 8px 14px rgba(20,20,80,.3));color:#fff!important;padding:4px 6px!important;box-shadow:none!important;margin:6px 0 10px!important}
${A} .seasonband.phase2{border-image-source:url("${E}kachel-03.webp?v=3")!important}
${A} .seasonband.phase3{border-image-source:url("${E}kachel-04.webp?v=3")!important}
${A} .seasonband .stier{flex:none;width:58px!important;height:58px!important;border-radius:50%!important;display:grid!important;place-items:center;background:${MZ}!important;box-shadow:0 3px 8px rgba(0,0,0,.3),inset 0 -2px 3px rgba(150,90,0,.35)!important;font-size:32px!important;border:0!important}
${A} .seasonband :is(.sbname,strong,small,span){color:#fff!important;text-shadow:0 1px 3px rgba(0,0,0,.45)}
${A} .seasonband .sbname{font:800 11px Lexend,sans-serif!important;letter-spacing:.08em;text-transform:uppercase;opacity:.95}
${A} .seasonband strong{font:800 17px/1.2 Lexend,sans-serif!important}
${A} .seasonband small{font:500 12.5px/1.35 Lexend,sans-serif!important;opacity:.95}
${A} .seasonband .smult{background:${MZ}!important;color:#5A2A00!important;text-shadow:none!important;border:0!important;box-shadow:0 2px 5px rgba(0,0,0,.25)!important;font:900 20px Lexend,sans-serif!important;border-radius:14px!important;padding:6px 10px!important}
/* Zeitstrahl */
${A} .stimeline{margin:4px 6px 14px!important}
${A} .stl-bar{height:16px!important;background:rgba(255,255,255,.75)!important;box-shadow:inset 0 1px 3px rgba(30,20,90,.25),0 3px 8px rgba(30,20,90,.15)}
${A} .stl-bar>span{display:flex;align-items:center;justify-content:center}
${A} .stl-bar .seg1{background:linear-gradient(90deg,#9C8CFF,#7B5BFF)!important;border-radius:999px 0 0 999px}
${A} .stl-bar .seg2{background:linear-gradient(90deg,#FFC23D,#FF9A1F)!important}
${A} .stl-bar .seg3{background:linear-gradient(90deg,#FF6B8B,#E8409F)!important;border-radius:0 999px 999px 0}
${A} .stl-bar i{font:900 10px Lexend,sans-serif!important;color:#fff!important;font-style:normal;text-shadow:0 1px 2px rgba(0,0,0,.35)}
${A} .stl-bar .stl-heute{width:22px!important;height:22px!important;margin-left:-11px!important;top:-3px!important;border-radius:50%!important;background:#fff!important;box-shadow:0 0 0 4px #FFD54A,0 2px 6px rgba(0,0,0,.35)!important;border:0!important}
${A} .stl-lbl span{color:#3A2F72!important;font:700 11.5px Lexend,sans-serif!important;background:rgba(255,255,255,.8);border-radius:99px;padding:1px 8px}
/* Tier-Karte */
${A} .stierkarte{background:rgba(255,255,255,.96)!important;border:0!important;border-left:6px solid var(--tc)!important;border-radius:20px!important;box-shadow:0 6px 16px rgba(30,20,90,.18)!important;color:#3A2F72!important}
${A} .stierkarte .stk-emo{flex:none;width:52px;height:52px;border-radius:50%;display:grid;place-items:center;background:${MZ};box-shadow:0 3px 6px rgba(0,0,0,.25);font-size:28px}
${A} .stierkarte b{color:#4A2BB0!important;font:800 15px Lexend,sans-serif}
${A} .stierkarte p{color:#4E4880!important;font:500 13px/1.45 Lexend,sans-serif;margin:4px 0 0}
${A} .stierkarte .stk-wissen{background:#FFF6D6;border-radius:12px;padding:6px 10px;color:#6A4A00!important}
${A} .seasonkopf>.help{color:#3A2F72!important;background:rgba(255,255,255,.82);border-radius:16px;padding:10px 14px;margin:12px 0!important;font:500 13px/1.45 Lexend,sans-serif}
/* Kalender */
${A} details.skalender{background:rgba(255,255,255,.94);border-radius:22px;padding:6px 14px 14px;box-shadow:0 8px 20px rgba(30,20,90,.18);margin:0 0 18px}
${A} details.skalender>summary{display:flex;align-items:center;gap:10px;padding:10px 2px;cursor:pointer;list-style:none;color:#2E2560;font:800 15px Lexend,sans-serif}
${A} details.skalender>summary::-webkit-details-marker{display:none}
${A} details.skalender>summary::after{content:"▸";margin-left:auto;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:rgba(123,91,255,.12);color:#6A4BFF;font-size:12px;transition:transform .2s}
${A} details.skalender[open]>summary::after{transform:rotate(90deg)}
${A} details.skalender .help{color:#6B6295!important}
${A} .skitem{background:#fff!important;border:0!important;border-top:5px solid var(--tc)!important;border-radius:16px!important;box-shadow:0 4px 10px rgba(30,20,90,.12)!important;color:#3A2F72!important}
${A} .skitem>span{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:color-mix(in srgb,var(--tc) 22%,#fff);font-size:24px;margin-bottom:2px}
${A} .skitem b{color:#2E2560!important;font:800 13px/1.2 Lexend,sans-serif}
${A} .skitem small{color:#6B6295!important}
${A} .skneu{color:#4A2BB0!important;font:800 12px Lexend,sans-serif;background:#F1ECFF;border-radius:99px;padding:4px 12px;width:fit-content;margin:6px auto!important;grid-column:1/-1}
/* Podest auf Bühne */
${A} .podium{background:linear-gradient(165deg,#2E2BA8,#5B2BC8 50%,#B23BA8)!important;border:0!important;box-shadow:0 12px 26px rgba(30,20,90,.35),inset 0 2px 0 rgba(255,255,255,.25)!important;overflow:hidden}
${A} .podium::before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 60% 45% at 50% 0%,rgba(255,255,255,.28),transparent 70%),radial-gradient(ellipse 70% 40% at 50% 100%,rgba(255,214,80,.35),transparent 70%)}
${A} .podium .pname{color:#fff!important;text-shadow:0 1px 3px rgba(0,0,0,.5)}
${A} .podium .pkt{color:#FFE9A8!important;font-weight:800!important;text-shadow:0 1px 2px rgba(0,0,0,.4)}
${A} .podium .pav{box-shadow:0 0 0 4px #FFD54A,0 4px 10px rgba(0,0,0,.35)!important;background:#fff}
${A} .podium .pav.pfrei{background:rgba(255,255,255,.18)!important;color:#fff!important;box-shadow:0 0 0 3px rgba(255,255,255,.55)!important;border:0!important}
/* Dejans Podest-Blöcke (img/grafik/podest/block-1..3.webp, gleicher Massstab) statt gemalter Sockel */
${A} .podium .psockel{height:auto!important;margin:0 auto!important;padding:0!important;border:0!important;border-radius:0!important;box-shadow:none!important;background:center bottom / 100% 100% no-repeat!important;filter:drop-shadow(0 6px 10px rgba(20,10,60,.35))}
${A} .podium .psockel > *{opacity:0!important;font-size:0!important}
${A} .podium .p1 .psockel{width:min(100%,210px)!important;aspect-ratio:408/506;background-image:url("img/grafik/podest/block-1.webp")!important}
${A} .podium .p2 .psockel{width:min(100%,182px)!important;aspect-ratio:368/379;background-image:url("img/grafik/podest/block-2.webp")!important}
${A} .podium .p3 .psockel{width:min(100%,182px)!important;aspect-ratio:367/282;background-image:url("img/grafik/podest/block-3.webp")!important}
${A} .podium .pst.leer .psockel{opacity:1!important}
${A} .podium .pfigur{margin-bottom:-4px}
${A} .podium .pav{display:grid!important;place-items:center!important;overflow:hidden}
${A} .podium .pav > :is(svg,img){width:88%!important;height:88%!important;max-width:none!important;object-fit:contain}
/* Liste */
${A} .rlliste{background:rgba(255,255,255,.96)!important;border:0!important;border-radius:24px!important;box-shadow:0 10px 24px rgba(30,20,90,.2)!important;padding:0 0 12px!important;overflow:hidden}
${A} .rlkopfleiste{margin:0 0 12px!important;padding:12px 18px;background:${VP};color:#fff}
${A} .rlkopfleiste b,${A} .rlkopfleiste span,${A} .rlkopfleiste strong{color:#fff!important;font-family:Lexend,system-ui,sans-serif}
${A} .rlkopfleiste b{font-weight:800;font-size:16px}
${A} .rlkopfleiste strong{background:${MZ};color:#5A2A00!important;border-radius:99px;padding:1px 8px}
${A} .rlsuche{margin:0 14px 10px!important}
${A} .rlsuche input.sel{min-height:44px;border-radius:14px!important;border:2px solid #E4DEFA!important;background:#F7F4FF!important;color:#2E2560!important;font:600 14px Lexend,sans-serif!important}
${A} .board.rlscroll{margin:0 12px!important;border:0!important;background:none!important;display:flex;flex-direction:column;gap:6px}
${A} .rrow{border:0!important;border-left:5px solid #9C8CFF!important;border-radius:14px!important;background:#fff!important;box-shadow:0 3px 8px rgba(30,20,90,.1)!important;color:#2E2560!important}
${A} .rrow:nth-child(3n+2){border-left-color:#FF9A1F!important}${A} .rrow:nth-child(3n){border-left-color:#3FB6C9!important}
${A} .rrow .rnum{display:inline-grid;place-items:center;min-width:34px;height:34px;border-radius:50%;background:#F1ECFF;color:#4A2BB0;font:800 14px Lexend,sans-serif}
${A} .rrow .rav{box-shadow:0 0 0 3px #FFD54A;border-radius:50%;overflow:hidden;background:#fff}
${A} .rrow .rname b{color:#2E2560!important;font:800 15px Lexend,sans-serif}
${A} .rrow .rname span{color:#6B6295!important}
${A} .rrow .rpts{color:#5A2A00!important;background:${MZ};border-radius:14px;padding:4px 12px;text-align:center;font:900 16px/1.1 Lexend,sans-serif}
${A} .rrow .rpts small{display:block;color:#7A4A00!important;font:700 9.5px Lexend,sans-serif}
${A} .rrow.me{background:${VP}!important;border-left-color:#FFD54A!important}
${A} .rrow.me :is(b,span){color:#fff!important}
${A} .rlliste .empty{margin:0 12px;border:2px dashed #DCD2FF!important;border-radius:16px!important;background:#FBF9FF!important;color:#4E4880!important;font:600 14px/1.45 Lexend,sans-serif}
${A} .note{color:#3A2F72;background:rgba(255,255,255,.82);border-radius:14px;padding:8px 12px;max-width:1040px;margin:0 auto 20px;text-align:center}
html body.ep-app.ep-s-board #app .segs.rlmodus{margin:0!important}html body.ep-app.ep-s-board #app{padding-bottom:76px}
@media (max-width:560px){${A} .segs.rlmodus .seg,${A} .segs.rlsegs .seg{padding:5px 10px!important;font-size:12.5px!important;min-height:36px!important}${A} .segs.rlsegs .seg .sgi img{width:20px;height:20px}${A} .rrow{padding:8px 10px!important;gap:8px!important;grid-template-columns:40px 42px 1fr auto!important}${A} .rrow .rpts{font-size:14px;padding:3px 8px}${A} .seasonband{border-width:14px!important;border-image-width:14px!important}${A} .seasonband .stier{width:46px!important;height:46px!important;font-size:24px!important}${A} .seasonband strong{font-size:15px!important}}`;
  document.head.appendChild(c);
  /* Emoji im Kopf durch Dejans Symbole ersetzen */
  const SYM = [["📊", "stern"], ["🚀", "rakete"], ["🏔️", "berg"], ["🏔", "berg"]];
  function schmuck(){
    if(document.documentElement.dataset.scr !== "board") return;
    document.querySelectorAll("#app .rlkopf .rlregeln>div>b").forEach(b => { if(b.dataset.rlz) return;
      for(const [e, n] of SYM){ if(b.textContent.trim().startsWith(e)){ b.dataset.rlz = "1"; b.innerHTML = `<i class="rl-mz"><img src="${G}${n}.webp?v=2" alt=""></i>` + b.innerHTML.replace(e, "").trim(); break; } } });
    const pk = document.querySelector("#app .rlkopf .rlpokal span"); if(pk && !pk.querySelector("img")) pk.innerHTML = `<img src="${G}pokal.webp?v=2" alt="">`;
    document.querySelectorAll("#app .rlmodus .seg").forEach(b => { if(b.dataset.rlz) return;
      const tx = b.textContent.trim(), m = b.dataset.bm || (tx.includes("Hardcore") ? "hc" : "");
      const bild = {gesamt:"pokal", season:"festkalender", hc:"flamme"}[m]; if(!bild) return;
      b.dataset.rlz = "1"; b.innerHTML = `<img src="${G}${bild}.webp?v=2" alt=""> ${{gesamt:"Gesamt", season:"Seasons", hc:"Hardcore"}[m]}`; });
  }
  let t = 0; new MutationObserver(() => { clearTimeout(t); t = setTimeout(schmuck, 30); }).observe(document.documentElement, {childList:true, subtree:true});
})();

/* ===== Season-Zeitstrahl wie der Fortschrittsbalken im Quiz, leuchtend (Rangliste › Seasons). Sitzung «App», 03.11.
   Dick, dunkle Spur mit weissem Rand, Abschnitte ×1/×2/×3 mit wandernden Streifen und Glanz, Lichtstreif läuft darüber,
   alles bis heute leuchtet, der Rest ist gedämpft (--pos aus dem Heute-Punkt), Heute-Punkt pulsiert golden. ===== */
(function(){
  const A = 'html[data-scr="board"] body #app';
  const GL = "linear-gradient(180deg,rgba(255,255,255,.5),rgba(255,255,255,0) 55%)";
  const ST = "repeating-linear-gradient(-45deg,rgba(255,255,255,.24) 0 10px,rgba(255,255,255,0) 10px 20px)";
  const c = document.createElement("style"); c.id = "ep-season-balken-css";
  c.textContent = `
${A} .stimeline{margin:10px 4px 16px!important;background:none!important;box-shadow:none!important;border:0!important;padding:0!important;overflow:visible!important}
${A} .stl-bar.stl-bar{position:relative;height:30px!important;border-radius:999px!important;background:rgba(27,34,64,.9)!important;border:2px solid rgba(255,255,255,.85);box-sizing:border-box;
  box-shadow:inset 0 2px 4px rgba(0,0,0,.3),0 0 12px rgba(255,190,60,.6),0 0 26px rgba(232,64,159,.4)!important;animation:ep-sb-glow 2.6s ease-in-out infinite}
${A} .stl-bar.stl-bar > span{position:relative;height:100%;background-size:100% 100%,28px 28px,100% 100%!important;animation:ep-streifen 1s linear infinite}
${A} .stl-bar.stl-bar > .seg1{background:${GL},${ST},linear-gradient(90deg,#6A4BFF,#8E5BFF 60%,#B05CFF)!important;border-radius:999px 0 0 999px}
${A} .stl-bar.stl-bar > .seg2{background:${GL},${ST},linear-gradient(90deg,#FFB020,#FF8A1F)!important}
${A} .stl-bar.stl-bar > .seg3{background:${GL},${ST},linear-gradient(90deg,#FF5FA2,#E8409F)!important;border-radius:0 999px 999px 0}
${A} .stl-bar.stl-bar > span i{position:relative;z-index:2;font:900 12px/1 Lexend,system-ui,sans-serif!important;color:#fff!important;text-shadow:0 1px 2px rgba(0,0,0,.6),0 0 6px rgba(0,0,0,.3)!important}
/* noch nicht erreicht: gedämpft */
${A} .stl-bar.stl-bar::after{content:"";position:absolute;z-index:1;top:0;bottom:0;left:var(--pos,100%);right:0;border-radius:0 999px 999px 0;background:rgba(27,34,64,.28);pointer-events:none}
/* Lichtstreif läuft über den erreichten Teil */
${A} .stl-bar.stl-bar::before{content:"";position:absolute;z-index:1;top:0;bottom:0;left:0;width:var(--pos,100%);border-radius:999px;pointer-events:none;overflow:hidden;
  background:linear-gradient(100deg,transparent 0 35%,rgba(255,255,255,.65) 48%,transparent 60% 100%) no-repeat;background-size:40% 100%;animation:ep-sb-licht 3.2s ease-in-out infinite}
${A} .stl-bar.stl-bar > .stl-heute{z-index:3;width:26px!important;height:26px!important;margin-left:-13px!important;top:0!important;border-radius:50%!important;
  background:radial-gradient(circle at 35% 30%,#fff,#FFF3C4 60%,#FFD54A)!important;border:0!important;box-shadow:0 0 0 3px #FFD54A,0 0 12px 4px rgba(255,214,80,.9),0 2px 6px rgba(0,0,0,.4)!important;animation:ep-sb-puls 1.6s ease-in-out infinite}
${A} .stl-bar.stl-bar > .stl-heute::after{content:"✦";position:absolute;inset:0;display:grid;place-items:center;color:#E09A00;font-size:13px}
@keyframes ep-sb-glow{0%,100%{box-shadow:inset 0 2px 4px rgba(0,0,0,.3),0 0 10px rgba(255,190,60,.5),0 0 22px rgba(232,64,159,.3)}50%{box-shadow:inset 0 2px 4px rgba(0,0,0,.3),0 0 18px rgba(255,190,60,.85),0 0 36px rgba(232,64,159,.55)}}
@keyframes ep-sb-licht{0%{background-position:-60% 0}60%,100%{background-position:160% 0}}
@keyframes ep-sb-puls{0%,100%{transform:scale(1)}50%{transform:scale(1.14)}}
@keyframes ep-streifen{from{background-position:0 0,0 0,0 0}to{background-position:0 0,28px 0,0 0}}
@media (prefers-reduced-motion:reduce){${A} .stl-bar.stl-bar,${A} .stl-bar.stl-bar > span,${A} .stl-bar.stl-bar::before,${A} .stl-bar.stl-bar > .stl-heute{animation:none!important}}
@media (max-width:560px){${A} .stl-bar.stl-bar{height:26px!important}${A} .stl-bar.stl-bar > .stl-heute{width:22px!important;height:22px!important;margin-left:-11px!important}}`;
  document.head.appendChild(c);
  /* --pos = Stelle von heute (aus dem Heute-Punkt), damit Leuchten und Dämpfung dort wechseln */
  function pos(){ document.querySelectorAll("#app .stl-bar").forEach(b => { const h = b.querySelector(".stl-heute"); const p = h ? h.style.left || "100%" : "100%"; if(b.style.getPropertyValue("--pos") !== p) b.style.setProperty("--pos", p); }); }
  let t = 0; new MutationObserver(() => { clearTimeout(t); t = setTimeout(pos, 40); }).observe(document.documentElement, {childList:true, subtree:true, attributes:true, attributeFilter:["style"]});
})();
/* Joker-Zeile .du-jkz gehört nur in die App-Ansicht; am Computer stehen die Joker in den Team-Karten */
(function(){ const c = document.createElement("style"); c.textContent = `html body:not(.ep-app) #app .du-jkz{display:none!important}`; document.head.appendChild(c); })();
/* ===== Abschluss-Resultate: Dejans Sterne (springen nacheinander auf), Punkte-Bilanz als lesbare Pillen,
   Erklärung nach falscher Antwort im gewerteten Test (.ep-terkl in renderQuiz) ===== */
(function(){ const c = document.createElement("style"); c.textContent = `
html body #app .stars.ep-sterne{display:flex;justify-content:center;align-items:flex-end;gap:6px;margin:2px 0 6px}
html body #app .stars.ep-sterne .ep-st{position:relative;display:inline-block;width:64px;height:64px}
html body #app .stars.ep-sterne .ep-st:nth-child(2){width:84px;height:84px}
html body #app .stars.ep-sterne .ep-st img{width:100%;height:100%;object-fit:contain;display:block}
html body #app .stars.ep-sterne .ep-st.an img{filter:drop-shadow(0 0 10px rgba(255,214,70,.9)) drop-shadow(0 4px 4px rgba(120,60,0,.35));animation:epStPop .55s cubic-bezier(.3,1.6,.5,1) both;animation-delay:var(--d)}
html body #app .stars.ep-sterne .ep-st.an::after{content:"";position:absolute;inset:-18%;background:url("img/grafik/diverse/funkeln.webp?v=2") center/contain no-repeat;opacity:0;animation:epStFunk 1.2s ease-out both;animation-delay:calc(var(--d) + .3s);pointer-events:none}
html body #app .stars.ep-sterne .ep-st.aus img,html body.ep-app #app .card.done .ep-done-kopf .stars.ep-sterne .ep-st.aus img{filter:brightness(0) invert(1) opacity(.5) drop-shadow(0 2px 3px rgba(30,10,80,.3))}
@keyframes epStPop{0%{transform:scale(0) rotate(-40deg);opacity:0}100%{transform:none;opacity:1}}
@keyframes epStFunk{0%{opacity:0;transform:scale(.6)}35%{opacity:1}100%{opacity:0;transform:scale(1.25)}}
@media (prefers-reduced-motion:reduce){html body #app .stars.ep-sterne .ep-st img,html body #app .stars.ep-sterne .ep-st::after{animation:none!important}}
@media (max-width:600px){html body #app .stars.ep-sterne .ep-st{width:48px;height:48px}html body #app .stars.ep-sterne .ep-st:nth-child(2){width:62px;height:62px}}

html body #app .pbilanz.ep-pb{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin:10px 0 6px}
html body #app .pbilanz.ep-pb span{display:inline-flex;align-items:center;gap:6px;padding:6px 14px 6px 8px;border-radius:999px;border:2px solid #fff;
  background:#fff;color:#2E2560!important;text-shadow:none!important;font:600 .95rem Lexend,system-ui,sans-serif;box-shadow:0 3px 8px rgba(30,10,80,.25)}
html body #app .pbilanz.ep-pb span b{font-weight:800;color:inherit}
html body #app .pbilanz.ep-pb span img{width:24px;height:24px;object-fit:contain}
html body #app .pbilanz.ep-pb .pb-ok b{color:#0E8A5F}
html body #app .pbilanz.ep-pb .pb-tempo b{color:#B26A00}
html body #app .pbilanz.ep-pb .pb-serie b{color:#D2451E}
html body #app .pbilanz.ep-pb .pb-ab b{color:#D0213F}
html body #app .card.done .ep-done-kopf .seasonbonus{text-shadow:none!important}
@media (max-width:600px){html body #app .pbilanz.ep-pb{gap:6px}html body #app .pbilanz.ep-pb span{font-size:.8rem;padding:4px 10px 4px 6px}html body #app .pbilanz.ep-pb span img{width:19px;height:19px}}

html body #app .feedback .ep-terkl{display:flex;gap:12px;align-items:flex-start;text-align:left;margin:10px auto 12px;max-width:640px;padding:12px 16px;border-radius:20px;
  background:#fff;border:3px solid #FFD25A;box-shadow:0 6px 16px rgba(40,30,120,.15);color:#2E2560}
html body #app .feedback .ep-terkl .ep-terkl-ic{width:34px;height:34px;flex:none;object-fit:contain}
html body #app .feedback .ep-terkl :is(.ep-terkl-t,.ep-terkl-m){display:block;margin:0 0 6px;color:#2E2560!important;-webkit-text-fill-color:#2E2560!important;opacity:1!important;font:500 1rem/1.45 Lexend,system-ui,sans-serif!important;text-shadow:none!important}
html body #app .feedback .ep-terkl .ep-terkl-m .ep-terkl-mk{display:inline!important;font-weight:800!important;margin:0!important;color:#2E2560!important;-webkit-text-fill-color:#2E2560!important;text-shadow:none!important}
html body #app .feedback .ep-terkl > div > :last-child{margin-bottom:0}
html body #app .feedback .ep-terkl .ep-terkl-m{background:#FFF6D6;border-radius:12px;padding:6px 10px}
@media (max-width:600px){html body #app .feedback .ep-terkl{padding:9px 11px;gap:8px}html body #app .feedback .ep-terkl :is(.ep-terkl-t,.ep-terkl-m){font-size:.88rem!important}html body #app .feedback .ep-terkl .ep-terkl-ic{width:26px;height:26px}}
`; document.head.appendChild(c); })();
/* ===== Rangliste: Auswahl neu geordnet (renderBoard). Oben die Art (Seasons zuerst, Gesamt, Hardcore), darunter eine weisse
   Filter-Karte mit Season, Stufe (Alle Stufen zuerst) und Region. Erklärung und Season-Infos sind aufklappbar (details.rl-auf),
   standardmässig zu. Beim Öffnen der Rangliste immer Seasons und Alle Stufen (go() in index.html). ===== */
(function(){
  const A = 'html[data-scr="board"] body #app', P = 'html[data-scr="board"] body:not(.ep-app) #app';
  const MZ = "radial-gradient(circle at 35% 30%,#FFF6C8,#FFD54A 55%,#E0A800)";
  const VP = "linear-gradient(135deg,#6A4BFF,#A43BE0 55%,#E8409F)";
  const c = document.createElement("style"); c.textContent = `
/* Art der Rangliste: grosse Reiter am Computer */
${P} .segs.rlmodus{gap:8px!important;padding:8px!important;margin:18px auto 14px!important;border-radius:26px!important;box-shadow:0 10px 24px rgba(30,20,90,.22)!important}
${P} .segs.rlmodus .seg{min-height:56px!important;min-width:170px;justify-content:center;padding:8px 22px!important;border-radius:20px!important;font:800 16px Lexend,system-ui,sans-serif!important;gap:10px!important}
${P} .segs.rlmodus .seg img{width:32px!important;height:32px!important}
${P} .segs.rlmodus .seg:not([aria-pressed="true"]):hover{background:#F1ECFF!important}
/* Filter-Karte */
${A} .rl-filter{max-width:1040px;margin:0 auto 18px;padding:12px 16px;border-radius:24px;background:rgba(255,255,255,.95);box-shadow:0 10px 24px rgba(30,20,90,.18);display:grid;gap:10px}
${A} .rl-fz{display:flex;align-items:center;gap:14px;min-width:0}
${A} .rl-fz + .rl-fz{border-top:1px solid #EEE9FB;padding-top:10px}
${A} .rl-fl{flex:none;width:72px;color:#6A4BFF;font:800 11.5px Lexend,sans-serif;letter-spacing:.08em;text-transform:uppercase}
${A} .rl-filter .segs.rlsegs{margin:0!important;width:auto;flex:1 1 auto;justify-content:flex-start!important;background:#F3F0FF!important;box-shadow:none!important;padding:5px!important;border-radius:18px!important}
${A} .rl-filter .segs.rlsegs .seg{flex:1 1 0;justify-content:center;border-radius:14px!important;min-height:44px!important}
${A} .rl-filter .segs.rlsegs .seg .sgi img{width:26px!important;height:26px!important}
${A} .rl-filter :is(.seasonwahl,.kpick){margin:0!important;flex:1 1 auto;justify-content:flex-start;max-width:none!important}
${A} .rl-filter :is(.seasonwahl,.kpick) select.sel{flex:1 1 auto;width:100%;min-height:46px;background:#F3F0FF!important;box-shadow:none!important;border:2px solid #E4DEFA!important;border-radius:14px!important;cursor:pointer}
${A} .rl-filter .kpick .kprev{flex:none;width:40px;height:40px;display:grid;place-items:center}
${A} .rl-filter .kpick .kprev :is(img,svg){width:34px;height:34px;object-fit:contain}
/* Aufklappbare Teile */
${A} details.rl-auf>summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:10px}
${A} details.rl-auf>summary::-webkit-details-marker{display:none}
${A} details.rl-auf>summary::after{content:"▸";flex:none;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:rgba(123,91,255,.14);color:#6A4BFF;font-size:12px;transition:transform .2s}
${A} details.rl-auf[open]>summary::after{transform:rotate(90deg)}
${A} details.rl-auf>summary:focus-visible{outline:3px solid #7B3FE4;outline-offset:3px}
${A} .rlkopf details.rl-erkl{margin:6px auto 0}
${A} .rlkopf details.rl-erkl>summary{width:fit-content;margin:0 auto;padding:6px 10px 6px 6px;border-radius:999px;background:rgba(255,255,255,.95);color:#4A2BB0!important;text-shadow:none!important;font:800 14px Lexend,sans-serif;box-shadow:0 4px 12px rgba(20,10,80,.25)}
${A} .rlkopf details.rl-erkl>summary span{color:#4A2BB0!important;text-shadow:none!important}
${A} .rlkopf details.rl-erkl[open]>summary{margin-bottom:12px}
${A} .seasonkopf details.rl-sinfo{background:rgba(255,255,255,.95);border-radius:24px;box-shadow:0 10px 24px rgba(30,20,90,.18);padding:8px 14px;margin:0 0 14px}
${A} .seasonkopf details.rl-sinfo[open]{padding-bottom:14px}
${A} .seasonkopf details.rl-sinfo>summary{padding:4px 0}
${A} .seasonkopf details.rl-sinfo[open]>summary{margin-bottom:10px}
${A} .rl-sinfo>summary .rl-mz-tier{width:46px;height:46px;font-size:26px;font-style:normal;background:${MZ}}
${A} .rl-sinfo>summary>span{display:flex;flex-direction:column;color:#2E2560;font:800 16px/1.2 Lexend,sans-serif;min-width:0}
${A} .rl-sinfo>summary>span small{color:#6B6295;font:600 12.5px Lexend,sans-serif;margin-top:2px}
${A} .rl-sinfo>summary>em{margin-left:auto;font:700 12.5px Lexend,sans-serif;font-style:normal;color:#6A4BFF;white-space:nowrap}
${A} .rl-sinfo details.skalender{box-shadow:none;background:#F7F4FF;margin:10px 0 0}
${A} .rl-sinfo .rl-swahl{display:flex;align-items:center;gap:12px;margin:0 0 12px;flex-wrap:wrap}
${A} .rl-sinfo .rl-swahl .rl-fl{width:auto}
${A} .rl-sinfo .rl-swahl .seasonwahl{margin:0!important;flex:1 1 260px;justify-content:flex-start}
${A} .rl-sinfo .rl-swahl select.sel{width:100%;background:#F3F0FF!important;box-shadow:none!important;border:2px solid #E4DEFA!important;border-radius:14px!important}
${A} .rl-sinfo>.help{color:#3A2F72!important;background:#F7F4FF!important}
@media (max-width:640px){
  ${A} .rl-filter{padding:10px 10px;border-radius:20px;gap:8px}
  ${A} .rl-fz{flex-direction:column;align-items:stretch;gap:5px}
  ${A} .rl-filter .rl-fl{display:none}
  ${A} .rl-fz + .rl-fz{padding-top:8px}
  ${A} .rl-filter .segs.rlsegs{flex-wrap:nowrap!important}
  ${A} .rl-filter .segs.rlsegs .seg{flex-direction:column;gap:2px!important;padding:5px 4px!important;font-size:11.5px!important;min-height:52px!important;min-width:0}
  ${A} .rl-filter .segs.rlsegs .seg .sgi img{width:22px!important;height:22px!important}
  ${A} .rl-sinfo>summary>em{display:none}
}`;
  document.head.appendChild(c);
})();
html[data-scr="board"] body:not(.ep-app) #app .rlkopf details.rl-erkl>summary{margin:0}
