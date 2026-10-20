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
  function start(){
    try{ if(!RL.offen) oeffneReels("mix"); }catch(e){ console.warn(e); }
    zuKnopf(); [300, 1000, 3000].forEach(ms => setTimeout(zuKnopf, ms));
    const kopf = document.querySelector("#reels .rkopf");
    kopf && new MutationObserver(zuKnopf).observe(kopf, {childList:true, subtree:true, characterData:true});
    // Geteilte Links öffnen direkt das Qeel, sonst kommt zuerst die Stufenwahl
    if(!/#qeel=/.test(location.hash)) stufenwahl();
  }
  // Startseite: Stufe wählen (Entdecker, Könner, Profis oder alle)
  const STUFEN_START = [
    {id:1, name:"Entdecker", text:"Leicht", emo:"🌱"},
    {id:2, name:"Könner", text:"Mittel", emo:"🚀"},
    {id:3, name:"Profis", text:"Schwer", emo:"🏅"},
    {id:4, name:"Alle Stufen", text:"Alles gemischt", emo:"🌍"}
  ];
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
#qstart .qslogo{align-self:flex-start;display:flex;align-items:center;gap:10px;font-weight:800;font-size:1.5rem;padding:8px 18px 8px 8px;border-radius:999px;
  background:linear-gradient(135deg,#FF7A3D,#E8457C 55%,#B03FE0);box-shadow:0 6px 0 rgba(0,0,0,.25),0 16px 30px -12px rgba(232,69,124,.7)}
#qstart .qslogo b{display:grid;place-items:center;width:38px;height:38px;border-radius:12px;background:#fff;color:#E8457C;font-size:1.35rem}
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
  #qstart .qslogo{font-size:1.25rem}
  #qstart .qslogo b{width:32px;height:32px;font-size:1.15rem}
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
@media (max-width:760px) and (max-height:700px){#qstart .qsinfo{display:none}#qstart .qsgrid button{min-height:132px}}`;
      document.head.appendChild(css);
    }
    let zuletzt = 0; try{ zuletzt = +JSON.parse(localStorage.getItem("ep-stufe")) || 0; }catch(e){}
    const o = document.createElement("div"); o.id = "qstart"; o.setAttribute("role", "dialog"); o.setAttribute("aria-modal", "true"); o.setAttribute("aria-labelledby", "qsTitel");
    o.innerHTML = `<div class="qsbox">
      <div class="qslogo"><b>Q</b> Qeels</div>
      <div class="qshero">
        <div class="qstext1">
          <h1 id="qsTitel">Welche Stufe möchtest du spielen?</h1>
          <p class="qsinfo">Wische durch Quizfragen und kurze Artikel. Die Stufe kannst du jederzeit oben rechts unter «Was möchtest du sehen?» wechseln.</p>
          <div class="qschips"><span>🧠 Quiz</span><span>📖 Artikel</span><span>🇨🇭 Schweiz-Wissen</span></div>
        </div>
        <img class="qsduo" src="img/kids/duo-winken.webp" alt="" aria-hidden="true">
      </div>
      <div class="qsgrid">${STUFEN_START.map(s => `<button type="button" data-s="${s.id}"><span class="qsemo" aria-hidden="true">${s.emo}</span><span class="qsname">${s.name}</span><span class="qstext">${s.text}</span><span class="qszahl" hidden></span>${s.id === zuletzt ? '<span class="qszuletzt">Zuletzt</span>' : ""}</button>`).join("")}</div>
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
