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
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
