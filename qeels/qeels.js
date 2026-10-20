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
    {id:1, name:"Entdecker", text:"bis 9 Jahre", emo:"🌱"},
    {id:2, name:"Könner", text:"10 bis 14 Jahre", emo:"🚀"},
    {id:3, name:"Profis", text:"ab 15 Jahre", emo:"🏅"},
    {id:4, name:"Alle Stufen", text:"alles gemischt", emo:"🌍"}
  ];
  function stufenwahl(){
    if(document.getElementById("qstart")) return;
    if(!document.getElementById("qstartCss")){
      const css = document.createElement("style"); css.id = "qstartCss";
      css.textContent = `
#qstart{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;overflow:auto;padding:24px 16px;box-sizing:border-box;
  background:radial-gradient(120% 90% at 50% 0%,#3B2A8F 0%,#1B1F4B 55%,#0E1130 100%);color:#fff;font-family:"Lexend",system-ui,sans-serif}
#qstart .qsbox{width:100%;max-width:880px;margin:auto;display:flex;flex-direction:column;align-items:center;gap:22px;text-align:center}
#qstart .qslogo{display:flex;align-items:center;gap:10px;font-weight:800;font-size:1.7rem;letter-spacing:.01em}
#qstart .qslogo b{display:grid;place-items:center;width:46px;height:46px;border-radius:14px;background:linear-gradient(135deg,#FF4D8D,#FF9A1F);font-size:1.6rem;box-shadow:0 4px 0 rgba(0,0,0,.3)}
#qstart h1{margin:0;font-size:clamp(1.5rem,4.6vw,2.3rem);line-height:1.2}
#qstart p.qsinfo{margin:-8px 0 0;color:rgba(255,255,255,.75);font-size:1rem;line-height:1.45;max-width:520px}
#qstart .qsgrid{width:100%;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
@media (min-width:760px){#qstart .qsgrid{grid-template-columns:repeat(4,minmax(0,1fr));gap:18px}}
#qstart .qsgrid button{--f:#2FBF71;--d:#1C8A4F;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;min-height:150px;padding:18px 10px 16px;border:0;border-radius:22px;cursor:pointer;
  color:#fff;font:inherit;background:linear-gradient(160deg,var(--f),var(--d));box-shadow:0 6px 0 rgba(0,0,0,.28),inset 0 0 0 2px rgba(255,255,255,.18);transition:transform .12s,box-shadow .12s}
#qstart .qsgrid button:hover{transform:translateY(-3px)}
#qstart .qsgrid button:active{transform:translateY(3px);box-shadow:0 2px 0 rgba(0,0,0,.28)}
#qstart .qsgrid button:focus-visible{outline:3px solid #FFD43B;outline-offset:3px}
#qstart .qsgrid button[data-s="2"]{--f:#4D6BFF;--d:#2B3FC2}
#qstart .qsgrid button[data-s="3"]{--f:#FF9A1F;--d:#C9650A}
#qstart .qsgrid button[data-s="4"]{--f:#B26BFF;--d:#7A35CC}
#qstart .qsemo{font-size:2.6rem;line-height:1}
#qstart .qsname{font-weight:800;font-size:1.2rem}
#qstart .qstext{font-size:.9rem;color:rgba(255,255,255,.88)}
#qstart .qszuletzt{font-size:.72rem;font-weight:700;background:rgba(0,0,0,.28);padding:2px 8px;border-radius:999px}
#qstart .qsfuss{font-size:.85rem;color:rgba(255,255,255,.6)}`;
      document.head.appendChild(css);
    }
    let zuletzt = 0; try{ zuletzt = +JSON.parse(localStorage.getItem("ep-stufe")) || 0; }catch(e){}
    const o = document.createElement("div"); o.id = "qstart"; o.setAttribute("role", "dialog"); o.setAttribute("aria-modal", "true"); o.setAttribute("aria-labelledby", "qsTitel");
    o.innerHTML = `<div class="qsbox">
      <div class="qslogo"><b>Q</b> Qeels</div>
      <h1 id="qsTitel">Welche Stufe möchtest du spielen?</h1>
      <p class="qsinfo">Wische durch Quizfragen und kurze Artikel. Die Stufe kannst du später jederzeit oben rechts unter «Was möchtest du sehen?» ändern.</p>
      <div class="qsgrid">${STUFEN_START.map(s => `<button type="button" data-s="${s.id}"><span class="qsemo" aria-hidden="true">${s.emo}</span><span class="qsname">${s.name}</span><span class="qstext">${s.text}</span>${s.id === zuletzt ? '<span class="qszuletzt">Zuletzt gewählt</span>' : ""}</button>`).join("")}</div>
      <div class="qsfuss">Fragen und Artikel aus easyplay</div>
    </div>`;
    document.body.appendChild(o);
    o.addEventListener("click", e => {
      const b = e.target.closest("button[data-s]"); if(!b) return;
      const id = +b.dataset.s;
      try{ if(typeof window.rlStufeSetzen === "function") window.rlStufeSetzen(id); else { localStorage.setItem("ep-stufe", JSON.stringify(id)); S.stufe = id; rlTab(RL.tab); } }catch(err){ console.warn(err); }
      o.animate([{opacity:1}, {opacity:0}], {duration:200}).onfinish = () => o.remove();
      o.style.pointerEvents = "none";
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
