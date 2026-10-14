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
  /* 2) Spezialseiten: vorhandenen Kopf einfärben */
  const sp = SPEZIAL[S.screen];
  if(sp){
    const el = app.querySelector(sp.sel);
    if(el && !el.classList.contains("st-kopf")){ el.classList.add("st-kopf"); el.style.setProperty("--c", sp.c); el.appendChild(kidImg(sp.kid)); }
  }
}

const app = document.getElementById("app");
if(app){
  new MutationObserver(() => schmuck()).observe(app, {childList:true});
  schmuck();
}
})();
