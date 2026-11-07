/* Qeels als eigene Seite: läuft nach dem easyplay-Code.
   Öffnet sofort die Qeels und ersetzt «Zurück» durch einen Link zu easyplay. */
(function(){
  const EASYPLAY = new URL("./", document.baseURI).href;
  // Wegen <base href="../"> würden Links wie href="#..." zur easyplay-Startseite führen
  document.addEventListener("click", e=>{
    const a = e.target.closest && e.target.closest('a[href^="#"]'); if(!a) return;
    e.preventDefault(); const h = a.getAttribute("href"); if(h.length > 1) location.hash = h;
  }, true);
  // Escape schliesst nur Fenster innerhalb der Qeels, nicht die ganze Seite
  window.addEventListener("keydown", e=>{
    if(e.key !== "Escape") return;
    if(document.getElementById("rteilen") || document.getElementById("rsheet")) return;
    e.stopPropagation(); e.preventDefault();
    if(document.getElementById("rbildvoll")){ e.stopPropagation(); e.preventDefault(); window.rlNurBild && rlNurBild(false); return; }
    const k = document.querySelector("#rkomm .rkzu"), l = document.getElementById("rlibZu");
    if(k) k.click(); else if(l && l.offsetParent) l.click();
  }, true);
  // Qeels schliessen heisst hier: zu easyplay wechseln
  window.schliesseReels = function(){ location.href = EASYPLAY; };
  // Der «Zurück»-Knopf wird von app.js nachträglich neu gezeichnet, darum nur die Beschriftung anpassen
  function zuKnopf(){
    const z = document.getElementById("rZu"); if(!z) return;
    z.title = "Zu easyplay"; z.setAttribute("aria-label", "Zu easyplay");
    const t = z.querySelector("span");
    if(t){ if(t.textContent !== "easyplay") t.textContent = "easyplay"; } else if(z.textContent !== "easyplay") z.textContent = "easyplay";
    z.onclick = () => { location.href = EASYPLAY; };
  }
  // Eigenes Qeels-Symbol im Browser-Tab (easyplay setzt sonst sein eigenes)
  function tabSymbol(){ document.querySelectorAll('link[rel~="icon"]').forEach(l => { if(!/qeels\/img\/icon-/.test(l.href)) l.href = "qeels/img/icon-192.png"; }); }
  function start(){
    tabSymbol(); [500, 2000].forEach(ms => setTimeout(tabSymbol, ms));
    try{ if(!RL.offen) oeffneReels("mix"); }catch(e){ console.warn(e); }
    zuKnopf(); [300, 1000, 3000].forEach(ms => setTimeout(zuKnopf, ms));
    const kopf = document.querySelector("#reels .rkopf");
    kopf && new MutationObserver(zuKnopf).observe(kopf, {childList:true, subtree:true, characterData:true});
    // Geteilte Links öffnen direkt das Qeel, sonst kommt zuerst die Stufenwahl
    if(!/#qeel=/.test(location.hash)) stufenwahl();
  }
  // Startseite: Stufe wählen (Entdecker, Könner, Profis oder alle)
  const STUFEN_START = [
    {id:1, name:"Entdecker", text:"Leicht", bild:"img/qeels-icons/stufen/entdecker.webp", k:"04"},
    {id:2, name:"Könner", text:"Mittel", bild:"img/qeels-icons/stufen/koenner.webp", k:"01"},
    {id:3, name:"Profis", text:"Schwer", bild:"img/qeels-icons/stufen/profis.webp", k:"03"},
    {id:4, name:"Alle Stufen", text:"Alles gemischt", bild:"img/grafik/stufe-alle.webp", k:"06"}
  ];
  // Schwebende Symbole im Hintergrund: [Symbol, links %, oben %, Grösse rem, Dauer s, Verzögerung s]
  // Dejans Symbole statt Emoji
  const G = "img/grafik/", D = G + "diverse/";
  const DEKO = [[G+"sym-frage-regenbogen.webp",4,12,2.6,6,0],[D+"stern.webp",90,10,2.2,7,1],[D+"gluehbirne.webp",8,70,2.4,8,.5],[D+"pokal.webp",88,64,2.6,6.5,1.5],[D+"funkeln.webp",48,4,2,7.5,.8],[D+"funkeln.webp",72,30,1.8,5,.3],[D+"ziel.webp",20,40,1.8,9,2],[D+"buecher.webp",94,40,2,8,2.4],[D+"rakete.webp",30,88,2,7,1.2],[D+"konfetti.webp",66,90,2.2,6,.6]];
  const zahl = n => n.toLocaleString("de-CH");
  // Anzahl Fragen pro Stufe eintragen, sobald die Fragen geladen sind
  function fragenZaehlen(o, versuch){
    let alle = []; try{ alle = FRAGEN.filter(f => f && f.q && Array.isArray(f.a) && f.a.length === 4); }catch(e){}
    if(alle.length < 1000 && (versuch || 0) < 40){ setTimeout(() => fragenZaehlen(o, (versuch || 0) + 1), 500); return; }
    if(!alle.length) return;
    o.querySelectorAll("button[data-s]").forEach(b => { const id = +b.dataset.s; const n = id === 4 ? alle.length : alle.filter(f => f.l === id).length;
      const z = b.querySelector(".qszahl"); if(z){ z.textContent = zahl(n) + " Fragen"; z.hidden = false; } });
  }
  function stufenwahl(){
    if(document.getElementById("qstart")) return;
    if(!document.getElementById("qstartCss")){
      const css = document.createElement("style"); css.id = "qstartCss";
      css.textContent = `
body:has(#qstart:not(.zu))>*:not(#qstart):not(#himmel):not(#alpen):not(#flocken):not(#eventlayer){visibility:hidden!important}
#qstart{position:fixed;inset:0;z-index:2147483000;display:flex;overflow:auto;padding:24px 16px;box-sizing:border-box;background:none;color:#fff;font-family:"Lexend",system-ui,sans-serif}
#qstart .qsbox{width:100%;max-width:1000px;margin:auto;display:flex;flex-direction:column;align-items:stretch;gap:18px}
#qstart .qslogo{align-self:center;display:block;width:min(440px,78%);height:auto;margin:-6px 0 -10px;filter:drop-shadow(0 10px 22px rgba(0,0,0,.45));animation:qsHuepf 4s ease-in-out infinite}
#qstart .qshero{position:relative;border-radius:30px;padding:30px 32px;overflow:hidden;color:#2A1F5C;
  background:linear-gradient(120deg,#FFE3F3 0%,#F4E9FF 38%,#E3F0FF 70%,#E6FFF4 100%);box-shadow:0 24px 50px -20px rgba(0,0,0,.6),inset 0 0 0 2px rgba(255,255,255,.7)}
#qstart .qshero::before{content:"";position:absolute;inset:0;background:radial-gradient(40% 70% at 0% 100%,rgba(255,196,74,.35),transparent 70%),radial-gradient(35% 60% at 70% 0%,rgba(124,146,255,.3),transparent 70%);pointer-events:none}
#qstart .qstext1{position:relative;max-width:58%}
#qstart h1{margin:0;font-size:clamp(1.9rem,4.4vw,3.2rem);line-height:1.05;font-weight:800;letter-spacing:-.02em;
  background:linear-gradient(90deg,#5B3CF0,#B23FD8 60%,#E8457C);-webkit-background-clip:text;background-clip:text;color:transparent}
#qstart .qsinfo{margin:12px 0 0;font-size:1.05rem;line-height:1.45;color:#4A3F7A}
#qstart .qschips{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}
#qstart .qschips span{background:#fff;color:#2A1F5C;font-weight:700;font-size:.9rem;padding:7px 14px;border-radius:999px;box-shadow:0 3px 0 rgba(42,31,92,.12)}
#qstart .qsduo{position:absolute;right:18px;bottom:-40px;height:calc(100% + 30px);max-height:300px;pointer-events:none;filter:drop-shadow(0 12px 18px rgba(0,0,0,.25))}
#qstart .qsgrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
#qstart .qsgrid button{--f:#2FBF71;--d:#14824A;position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:4px;min-height:170px;padding:18px 18px 16px;border:0;border-radius:26px;cursor:pointer;
  color:#fff;font:inherit;text-align:left;overflow:hidden;background:linear-gradient(150deg,var(--f),var(--d));box-shadow:0 7px 0 rgba(0,0,0,.3),0 20px 30px -16px var(--f),inset 0 0 0 2px rgba(255,255,255,.2);transition:transform .14s,box-shadow .14s}
#qstart .qsgrid button::after{content:"";position:absolute;right:-30px;top:-30px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,.14);pointer-events:none}
#qstart .qsgrid button:hover{transform:translateY(-4px) rotate(-.6deg)}
#qstart .qsgrid button:active{transform:translateY(4px);box-shadow:0 3px 0 rgba(0,0,0,.3)}
#qstart .qsgrid button:focus-visible{outline:4px solid #FFD43B;outline-offset:3px}
#qstart .qsgrid button[data-s="2"]{--f:#4D6BFF;--d:#2A35B8}
#qstart .qsgrid button[data-s="3"]{--f:#FF9A1F;--d:#D2550A}
#qstart .qsgrid button[data-s="4"]{--f:#C04BFF;--d:#7A23C9}
#qstart .qsemo{display:grid;place-items:center;width:58px;height:58px;border-radius:18px;font-size:2rem;line-height:1;margin-bottom:auto;background:rgba(255,255,255,.22);box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.35)}
#qstart .qsname{margin-top:14px;font-weight:800;font-size:1.35rem;line-height:1.1}
#qstart .qstext{font-size:.95rem;font-weight:600;color:rgba(255,255,255,.9)}
#qstart .qszahl{font-size:.82rem;font-weight:700;background:rgba(0,0,0,.2);padding:3px 10px;border-radius:999px;margin-top:6px}
#qstart .qszahl[hidden]{display:none}
#qstart .qszuletzt{position:absolute;top:14px;right:14px;font-size:.72rem;font-weight:800;color:#2A1F5C;background:#FFD43B;padding:3px 9px;border-radius:999px;box-shadow:0 2px 0 rgba(0,0,0,.2)}
@media (max-width:760px){
  #qstart{padding:16px 16px 24px}
  #qstart .qsbox{gap:14px;margin:0 auto auto}
  #qstart .qslogo{width:min(300px,82%);margin:0 0 -6px}
  #qstart .qshero{padding:20px 18px 18px;border-radius:24px}
  #qstart .qstext1{max-width:64%}
  #qstart h1{font-size:1.65rem}
  #qstart .qsinfo{font-size:.92rem;margin-top:8px}
  #qstart .qschips{display:none}
  #qstart .qsduo{right:-14px;bottom:-22px;height:auto;width:46%;max-height:none}
  #qstart .qsgrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
  #qstart .qsgrid button{min-height:150px;padding:14px 14px 12px;border-radius:22px}
  #qstart .qsemo{width:48px;height:48px;font-size:1.6rem;border-radius:15px}
  #qstart .qsname{font-size:1.15rem;margin-top:10px}
}
@media (max-width:760px) and (max-height:700px){#qstart .qsinfo{display:none}#qstart .qsgrid button{min-height:118px}#qstart .qsemo{width:42px;height:42px;font-size:1.4rem}}
/* Deko: schwebende Symbole, Funkeln, Bewegung */
#qstart .qsdeko{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden}
#qstart .qsdeko i{position:absolute;font-style:normal;font-size:var(--g,2rem);opacity:.85;filter:drop-shadow(0 6px 10px rgba(0,0,0,.35));animation:qsSchweb var(--t,7s) ease-in-out var(--v,0s) infinite alternate}
#qstart .qsbox{position:relative;z-index:1}
@keyframes qsSchweb{from{transform:translateY(0) rotate(-8deg)}to{transform:translateY(-22px) rotate(8deg)}}
@keyframes qsHuepf{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes qsFunkel{0%,100%{transform:scale(.6) rotate(0);opacity:.3}50%{transform:scale(1.15) rotate(20deg);opacity:1}}
@keyframes qsRein{from{opacity:0;transform:translateY(24px) scale(.94)}to{opacity:1;transform:none}}
@keyframes qsGlanz{from{transform:translateX(-120%) skewX(-20deg)}to{transform:translateX(320%) skewX(-20deg)}}
@keyframes qsPuls{0%,100%{box-shadow:0 7px 0 rgba(0,0,0,.3),0 0 0 0 rgba(255,212,59,.7)}50%{box-shadow:0 7px 0 rgba(0,0,0,.3),0 0 0 10px rgba(255,212,59,0)}}
#qstart .qsduo{animation:qsHuepf 3.2s ease-in-out infinite}
#qstart .qsmaskott{position:absolute;right:29%;bottom:26px;width:118px;border-radius:26px;box-shadow:0 0 0 3px rgba(255,255,255,.8);transform:rotate(-10deg);filter:drop-shadow(0 10px 14px rgba(0,0,0,.35));animation:qsSchweb 4s ease-in-out infinite alternate;pointer-events:none;z-index:2}
#qstart .qshero{overflow:visible}
#qstart .qshero .qsfunk{position:absolute;color:#FFC83D;font-size:var(--g,1.4rem);animation:qsFunkel var(--t,2.4s) ease-in-out var(--v,0s) infinite;pointer-events:none;text-shadow:0 0 12px rgba(255,200,61,.8)}
#qstart .qsaufruf{display:inline-flex;align-items:center;gap:8px;margin-top:16px;font-weight:800;font-size:1rem;color:#2A1F5C;background:#FFD43B;padding:9px 16px;border-radius:999px;box-shadow:0 4px 0 #C99A00}
#qstart .qsaufruf b{display:inline-block;animation:qsHuepf 1.1s ease-in-out infinite}
#qstart .qsgrid button{animation:qsRein .5s cubic-bezier(.2,.9,.3,1.3) both}
#qstart .qsgrid button:nth-child(2){animation-delay:.08s}
#qstart .qsgrid button:nth-child(3){animation-delay:.16s}
#qstart .qsgrid button:nth-child(4){animation-delay:.24s}
#qstart .qsgrid button::before{content:"";position:absolute;top:0;bottom:0;left:0;width:40%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent);transform:translateX(-120%) skewX(-20deg);pointer-events:none}
#qstart .qsgrid button:hover::before,#qstart .qsgrid button:focus-visible::before{animation:qsGlanz .8s ease-out}
#qstart .qsgrid button:has(.qszuletzt){animation:qsRein .5s cubic-bezier(.2,.9,.3,1.3) both,qsPuls 2s ease-in-out .8s infinite}
#qstart .qswz{position:absolute;right:-8px;bottom:-14px;font-size:5.5rem;opacity:.18;transform:rotate(-14deg);pointer-events:none;line-height:1}
#qstart .qsemo{transition:transform .2s}
#qstart .qsgrid button:hover .qsemo{transform:scale(1.15) rotate(-8deg)}
#qstart .qslos{position:absolute;right:14px;bottom:14px;width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:#fff;color:var(--d);font-size:.95rem;box-shadow:0 3px 0 rgba(0,0,0,.25);transition:transform .2s}
#qstart .qsgrid button:hover .qslos{transform:scale(1.15)}
#qstart .qsvorteile{display:flex;flex-wrap:wrap;justify-content:center;gap:10px}
#qstart .qsvorteile span{display:inline-flex;align-items:center;gap:6px;font-size:.92rem;font-weight:700;color:#fff;padding:8px 14px;border-radius:999px;background:rgba(255,255,255,.12);box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.22);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
@media (max-width:760px){
  #qstart .qsmaskott{display:none}
  #qstart .qsinfo{display:none}
  #qstart .qsaufruf{font-size:.88rem;padding:7px 12px;margin-top:10px}
  #qstart .qswz{font-size:4.2rem}
  #qstart .qslos{width:30px;height:30px;right:10px;bottom:10px;font-size:.8rem}
  #qstart .qsvorteile{gap:6px}
  #qstart .qsvorteile span{font-size:.8rem;padding:6px 10px}
  #qstart .qsdeko i:nth-child(n+7){display:none}
}
@media (max-width:760px) and (max-height:800px){#qstart .qsvorteile{display:none}}
@media (max-width:400px){#qstart .qslos{display:none}}
@media (max-height:760px){#qstart .qslogo{width:min(300px,70%)}}
@media (max-height:700px){#qstart .qslogo{width:min(220px,66%)}}
/* ===== Neuer Glanz-Stil wie auf easyplay (Dejans Grafiken): Kopf auf kopf.webp, Stufen auf Glanz-Kacheln,
   Symbole in goldener Münze, goldener Grafik-Knopf, weisse Glas-Pillen. Elemente mit border-image nie mit scale() bewegen. */
#qstart .qshero{background:none!important;border:30px solid transparent;border-image:url("img/grafik/entdecken/kopf.webp?v=1") 50 fill / 30px stretch;border-radius:0;padding:4px 10px!important;box-shadow:none!important;filter:drop-shadow(0 14px 24px rgba(60,30,160,.35));color:#fff}
#qstart .qshero::before{display:none}
#qstart h1{background:none!important;-webkit-background-clip:border-box;background-clip:border-box;color:#fff!important;font-family:Fredoka,Lexend,system-ui,sans-serif;text-shadow:0 2px 0 rgba(40,10,110,.45),0 6px 14px rgba(40,10,110,.35)}
#qstart .qsinfo{color:rgba(255,255,255,.94);text-shadow:0 1px 3px rgba(40,10,110,.5)}
#qstart .qsmaskott{display:none}
#qstart .qsaufruf{--gh:52px;height:var(--gh);box-sizing:border-box;background:none;box-shadow:none;border:0 solid transparent;border-width:calc(var(--gh)*.3) calc(var(--gh)*.5);
  border-image:url("img/grafik/knopf-gold.webp?v=1") 52 87 fill / calc(var(--gh)*.3) calc(var(--gh)*.5) stretch;border-radius:0;padding:0 4px;
  color:#3A1C00;font:700 1.05rem Fredoka,Lexend,system-ui,sans-serif;text-shadow:0 1px 0 rgba(255,255,255,.5);filter:drop-shadow(0 4px 6px rgba(20,20,60,.25))}
#qstart .qsaufruf{white-space:nowrap}
#qstart .qsgrid button:focus-visible{outline:none;filter:drop-shadow(0 0 3px #FFD43B) drop-shadow(0 0 10px rgba(255,212,59,.9))}
#qstart .qsaufruf img{width:26px;height:26px;object-fit:contain;animation:qsHuepf 1.1s ease-in-out infinite}
#qstart .qsgrid button{background:none!important;border:24px solid transparent;border-image:var(--k) 46 fill / 24px stretch;border-radius:0;padding:0 2px 2px!important;
  box-shadow:none!important;filter:drop-shadow(0 8px 14px rgba(30,30,90,.3));overflow:visible;text-shadow:0 1px 3px rgba(0,0,0,.35);transition:transform .14s,filter .14s}
#qstart .qsgrid button::after{display:none}
#qstart .qsgrid button::before{display:none}
#qstart .qsgrid button:hover{transform:translateY(-4px);filter:drop-shadow(0 12px 18px rgba(30,30,90,.38))}
#qstart .qsgrid button:active{transform:translateY(3px);box-shadow:none!important}
#qstart .qsgrid button:has(.qszuletzt){animation:qsRein .5s cubic-bezier(.2,.9,.3,1.3) both,qsLeucht 2s ease-in-out .8s infinite}
@keyframes qsRein{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
@keyframes qsLeucht{0%,100%{filter:drop-shadow(0 8px 14px rgba(30,30,90,.3)) drop-shadow(0 0 0 rgba(255,212,59,0))}50%{filter:drop-shadow(0 8px 14px rgba(30,30,90,.3)) drop-shadow(0 0 12px rgba(255,212,59,.95))}}
#qstart .qsemo{width:62px;height:62px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#FFF6C8,#FFD34D 45%,#E59A12 100%);box-shadow:0 0 0 3px #FFF3C2,0 4px 8px rgba(80,40,0,.35)}
#qstart .qsemo img{width:74%;height:74%;object-fit:contain;filter:drop-shadow(0 2px 2px rgba(80,40,0,.3))}
#qstart .qsname{font-family:Fredoka,Lexend,system-ui,sans-serif;font-weight:700;font-size:1.45rem}
#qstart .qszahl{background:#fff;color:#2A1F5C;text-shadow:none;box-shadow:0 2px 0 rgba(0,0,0,.15)}
#qstart .qswz{right:-14px;bottom:-16px;width:46%;max-width:120px;height:auto;opacity:.22;filter:brightness(0) invert(1);font-size:0}
#qstart .qslos{right:2px;bottom:2px;text-shadow:none}
#qstart .qszuletzt{top:-2px;right:-2px;text-shadow:none}
#qstart .qsvorteile span{background:rgba(255,255,255,.88);color:#2A1F5C;box-shadow:0 4px 12px rgba(20,20,60,.18),inset 0 0 0 1.5px #fff}
#qstart .qsvorteile img{width:22px;height:22px;object-fit:contain}
#qstart .qsdeko i img{width:var(--g,2rem);height:var(--g,2rem);object-fit:contain;display:block}
@media (max-width:760px){
  #qstart .qshero{border-width:22px;border-image-width:22px;padding:2px 4px!important}
  #qstart .qsaufruf{--gh:40px;font-size:.84rem;gap:5px}
  #qstart .qsaufruf img{width:20px;height:20px}
  #qstart .qsgrid button{border-width:18px;border-image-width:18px;min-height:136px}
  #qstart .qsemo{width:50px;height:50px}
  #qstart .qsname{font-size:1.2rem}
  #qstart .qswz{width:42%}
}
@media (min-width:761px) and (max-width:1060px){#qstart .qslos{display:none}}
@media (max-width:760px) and (max-height:700px){#qstart .qsgrid button{min-height:108px}#qstart .qsemo{width:42px;height:42px}}
@media (prefers-reduced-motion:reduce){#qstart *,#qstart *::before{animation:none!important}}`;
      document.head.appendChild(css);
    }
    let zuletzt = 0; try{ zuletzt = +JSON.parse(localStorage.getItem("ep-stufe")) || 0; }catch(e){}
    const o = document.createElement("div"); o.id = "qstart"; o.setAttribute("role", "dialog"); o.setAttribute("aria-modal", "true"); o.setAttribute("aria-labelledby", "qsTitel");
    o.innerHTML = `<div class="qsbox">
      <img class="qslogo" src="qeels/img/qeels-logo.webp" alt="Qeels" width="900" height="292">
      <div class="qsdeko" aria-hidden="true">${DEKO.map(([e, x, y, g, t, v]) => `<i style="left:${x}%;top:${y}%;--g:${g}rem;--t:${t}s;--v:${v}s"><img src="${e}" alt=""></i>`).join("")}</div>
      <div class="qshero">
        <img class="qsmaskott" src="qeels/img/icon-512.webp" alt="" aria-hidden="true">
        <span class="qsfunk" style="left:46%;top:14%;--g:1.6rem" aria-hidden="true">✦</span>
        <span class="qsfunk" style="left:60%;top:62%;--g:1.1rem;--v:.8s" aria-hidden="true">✦</span>
        <span class="qsfunk" style="left:3%;top:78%;--g:1.3rem;--v:1.4s" aria-hidden="true">✦</span>
        <div class="qstext1">
          <h1 id="qsTitel">Welche Stufe möchtest du spielen?</h1>
          <p class="qsinfo">Wische durch Quizfragen und kurze Artikel. Die Stufe kannst du jederzeit oben rechts unter «Was möchtest du sehen?» wechseln.</p>
          <div class="qsaufruf"><img src="img/grafik/diverse/zeigefinger.webp" alt=""> Wähle und leg los!</div>
        </div>
        <img class="qsduo" src="img/kids/duo-winken.webp" alt="" aria-hidden="true">
      </div>
      <div class="qsgrid">${STUFEN_START.map(s => `<button type="button" data-s="${s.id}" style="--k:url('img/grafik/entdecken/kachel-${s.k}.webp?v=3')"><span class="qsemo" aria-hidden="true"><img src="${s.bild}" alt=""></span><span class="qsname">${s.name}</span><span class="qstext">${s.text}</span><span class="qszahl" hidden></span><img class="qswz" src="${s.bild}" alt="" aria-hidden="true"><span class="qslos" aria-hidden="true">▶</span>${s.id === zuletzt ? '<span class="qszuletzt">Zuletzt</span>' : ""}</button>`).join("")}</div>
      <div class="qsvorteile"><span><img src="img/grafik/sym-frage-regenbogen.webp" alt="">Quiz und Artikel</span><span><img src="img/grafik/diverse/flamme.webp" alt="">Serien sammeln</span><span><img src="img/grafik/diverse/teilen.webp" alt="">Liken und teilen</span><span><img src="img/grafik/diverse/landkarte.webp" alt="">Schweiz-Wissen</span></div>
    </div>`;
    document.body.appendChild(o);
    fragenZaehlen(o);
    o.addEventListener("click", e => {
      const b = e.target.closest("button[data-s]"); if(!b) return;
      const id = +b.dataset.s;
      try{ if(typeof window.rlStufeSetzen === "function") window.rlStufeSetzen(id); else { localStorage.setItem("ep-stufe", JSON.stringify(id)); S.stufe = id; rlTab(RL.tab); } }catch(err){ console.warn(err); }
      o.classList.add("zu"); o.style.pointerEvents = "none";
      o.animate([{opacity:1}, {opacity:0}], {duration:180}).onfinish = () => o.remove();
      const r = document.getElementById("reels"); r && r.animate([{opacity:0}, {opacity:1}], {duration:260});
    });
    const erster = o.querySelector(`button[data-s="${zuletzt}"]`) || o.querySelector("button[data-s]");
    setTimeout(() => erster && erster.focus({preventScroll:true}), 50);
  }
  // Solange die Stufenwahl offen ist, steuern Tasten nicht die Qeels dahinter
  window.addEventListener("keydown", e => {
    const o = document.getElementById("qstart"); if(!o || o.style.pointerEvents === "none") return;
    if(["Tab", "Enter", " "].includes(e.key)) return;
    e.stopPropagation();
    if(e.key.startsWith("Arrow")){ e.preventDefault(); const bs = [...o.querySelectorAll("button[data-s]")]; const i = bs.indexOf(document.activeElement);
      const n = i < 0 ? 0 : (i + (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : bs.length - 1)) % bs.length; bs[n].focus(); }
  }, true);
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
