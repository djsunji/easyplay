/* ===== Sponsoren auf der Startseite (Dejans Wahl vom 2.11.2026: Vorschlag 1 und 6) =====
   1. Partnerleiste im Fuss der Startseite (Computer): Logos der Sponsoren und «Sponsor werden».
   2. Eigene Folie im Karussell oben (Handy/iPad): an dritter Stelle, nie als erste Folie, immer mit «Werbung» angeschrieben.
   Daten stehen in werbung.json unter "startseite" (gleiche Datei wie die Qeels-Werbung):
     "folie":   {aktiv, sponsor, titel, text, bild, link, knopf, von, bis}
     "partner": [{aktiv, name, logo, link, von, bis}, …]
     "platzhalter": true  → solange nichts aktiv ist, steht dort «Hier könnte Ihre Werbung stehen» (führt zum Kontakt, Adresse sponsor@).
   Ohne Tracking: nur ein Link, keine Zählpixel. */
(function(){
  const W = {daten:null, laden:null};
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
  const heuteKey = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  const laeuft = a => !!(a && a.aktiv && (!a.von || a.von <= heuteKey()) && (!a.bis || a.bis >= heuteKey()));
  const sichererLink = l => /^https:\/\//i.test(l || "") ? l : "";
  const bildPfad = b => !b ? "" : /^https:\/\//i.test(b) ? b : /^img\/[\w\-./]+$/i.test(b) ? b : "";

  function laden(){
    if(W.laden) return W.laden;
    W.laden = fetch("werbung.json", {cache:"no-cache"}).then(r => r.ok ? r.json() : null).then(d => {
      W.daten = (d && d.startseite) || {platzhalter:true};
      zeichnen();
      try{ if(typeof S !== "undefined" && S.screen === "home" && document.querySelector("#apKaru")) render(); }catch(e){}
    }).catch(() => { W.daten = {platzhalter:true}; zeichnen(); });
    return W.laden;
  }
  const daten = () => W.daten || {platzhalter:true};
  const platzhalter = () => daten().platzhalter !== false;
  const aktivePartner = () => (Array.isArray(daten().partner) ? daten().partner : []).filter(p => laeuft(p) && p.name).slice(0, 6);

  /* Kontaktseite mit Empfänger «sponsor» öffnen */
  function sponsorWerden(){
    try{ if(window.EP_KONTAKT && EP_KONTAKT.oeffnen) return EP_KONTAKT.oeffnen("sponsor"); }catch(e){}
    try{ go("kontakt"); }catch(e){}
  }
  function linkOeffnen(l){ const u = sichererLink(l); if(!u) return sponsorWerden(); try{ window.open(u, "_blank", "noopener"); }catch(e){ location.href = u; } }

  /* ---------- 1. Partnerleiste im Fuss (nur Startseite, nicht in der App-Ansicht) ---------- */
  function leisteHTML(){
    const l = aktivePartner();
    if(l.length){
      return `<span class="spw-t">easyplay wird unterstützt von</span>${l.map(p => {
        const logo = bildPfad(p.logo), link = sichererLink(p.link);
        const inhalt = `${logo ? `<img src="${esc(logo)}" alt="" loading="lazy">` : ""}<span>${esc(p.name)}</span>`;
        return link ? `<a class="spw-p" href="${esc(link)}" target="_blank" rel="noopener sponsored">${inhalt}</a>` : `<span class="spw-p">${inhalt}</span>`;
      }).join("")}<button type="button" class="spw-mehr" data-spw-werden>Sponsor werden ›</button>`;
    }
    if(!platzhalter()) return "";
    return `<span class="spw-t">Hier könnte Ihre Werbung stehen</span>
      <span class="spw-leer" aria-hidden="true"><i>Ihr Logo</i><i>Ihr Logo</i><i>Ihr Logo</i></span>
      <button type="button" class="spw-mehr" data-spw-werden>Sponsor werden ›</button>`;
  }
  function zeichnen(){
    const f = document.querySelector("footer.eplegal"); if(!f) return;
    let z = f.querySelector(".spw-reihe");
    const zeigen = W.daten && (() => { try{ return S.screen === "home" && !document.body.classList.contains("ep-app"); }catch(e){ return false; } })();
    const html = zeigen ? leisteHTML() : "";
    if(!html){ if(z) z.remove(); f.classList.remove("spw-mit"); return; }
    if(!z){ z = document.createElement("div"); z.className = "spw-reihe"; z.setAttribute("role", "region"); z.setAttribute("aria-label", "Sponsoren"); f.prepend(z); }
    if(z.dataset.h !== html){ z.innerHTML = `<div class="spw-leiste">${html}</div>`; z.dataset.h = html; }
    f.classList.add("spw-mit");
  }
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("[data-spw-werden]"); if(!b) return;
    e.preventDefault(); sponsorWerden();
  });

  /* ---------- 2. Folie im Karussell (Handy/iPad) ---------- */
  function folie(){
    const f = daten().folie;
    if(laeuft(f) && f.titel){
      return {cls:"hs-werbung", lbl:"Werbung" + (f.sponsor ? " · " + f.sponsor : ""), titel:f.titel, text:f.text || "", btn:f.knopf || "Mehr erfahren", a:"sponsorlink",
        ic:`<img src="img/grafik/diverse/handschlag.webp" alt="">`, _bild:bildPfad(f.bild), _link:f.link};
    }
    if(!platzhalter()) return null;
    return {cls:"hs-werbung hs-werbung-leer", lbl:"Für Sponsoren", titel:"Hier könnte Ihre Werbung stehen",
      text:"Erreichen Sie Familien und Schulklassen in der ganzen Schweiz. Klar gekennzeichnet, ohne Tracking.",
      btn:"Sponsor werden", a:"sponsorwerden", ic:`<img src="img/grafik/diverse/handschlag.webp" alt="">`, _bild:"img/kids/lumi-zeigen.webp"};
  }
  function einhaengen(){
    const ES = window.EP_START; if(!ES || ES.__spw) return; ES.__spw = true;
    const vorSlides = ES.heldSlides, vorAktion = ES.aktion;
    if(typeof vorSlides === "function") ES.heldSlides = function(){
      const l = vorSlides.apply(this, arguments) || [];
      if(!W.daten){ laden(); return l; }
      try{ const f = folie(); if(!f) return l; W.aktuell = f; const n = Math.min(2, l.length); return l.slice(0, n).concat([f], l.slice(n)); }catch(e){ return l; }
    };
    if(typeof vorAktion === "function") ES.aktion = function(a, el){
      if(a === "sponsorwerden") return sponsorWerden();
      if(a === "sponsorlink") return linkOeffnen(W.aktuell && W.aktuell._link);
      return vorAktion.apply(this, arguments);
    };
  }
  /* Bild der Werbefolie setzen (app.js wählt sonst Leni oder Ben) */
  function folieBild(){
    const s = document.querySelector(".ap-karu .ap-held.hs-werbung"); if(!s || !W.aktuell) return;
    const img = s.querySelector("img.hs-kid"), b = W.aktuell._bild;
    if(img && b && img.getAttribute("src") !== b){ img.src = b; img.alt = ""; }
    if(img && !b) img.remove();
    if(!s.querySelector(".spw-ecke")){ const e = document.createElement("span"); e.className = "spw-ecke"; e.textContent = "Werbung"; s.appendChild(e); }
  }

  /* nach jedem Zeichnen nachführen */
  const vorRender = window.render;
  if(typeof vorRender === "function") window.render = function(){
    const r = vorRender.apply(this, arguments);
    try{ einhaengen(); zeichnen(); folieBild(); }catch(e){}
    return r;
  };
  let tm; new MutationObserver(() => { clearTimeout(tm); tm = setTimeout(() => { try{ folieBild(); zeichnen(); }catch(e){} }, 60); })
    .observe(document.documentElement, {childList:true, subtree:true});
  document.addEventListener("DOMContentLoaded", () => { einhaengen(); laden(); });
  addEventListener("load", () => { einhaengen(); laden(); });
  window.EP_SPONSOREN = {laden, daten: () => W.daten};

  const css = document.createElement("style"); css.id = "ep-sponsoren-css";
  css.textContent = `
footer.eplegal.spw-mit{flex-wrap:wrap}
.spw-reihe{flex:0 0 100%;display:flex;justify-content:center;margin-bottom:4px}
.spw-leiste{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:12px 22px;padding:12px 24px;border-radius:999px;
  background:rgba(255,255,255,.82);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);box-shadow:0 3px 14px rgba(42,16,82,.10);
  font:600 14px/1.2 Lexend,system-ui,sans-serif;color:#3D2C5C;max-width:calc(100% - 32px);box-sizing:border-box}
.spw-leiste .spw-t{font-weight:700;color:#2A1052}
.spw-leiste .spw-p{display:inline-flex;align-items:center;gap:8px;color:#2A1052;font-weight:700;text-decoration:none;opacity:1;background:none;padding:0}
.spw-leiste a.spw-p:hover{text-decoration:underline}
.spw-leiste .spw-p img{height:28px;width:auto;max-width:110px;object-fit:contain}
.spw-leiste .spw-leer{display:inline-flex;gap:10px}
.spw-leiste .spw-leer i{display:grid;place-items:center;width:58px;height:34px;border:1.5px dashed #A898C8;border-radius:10px;font:600 10.5px/1 Lexend,system-ui,sans-serif;font-style:normal;color:#7A6A99}
.spw-leiste .spw-mehr{all:unset;cursor:pointer;color:#5B2CB8;font:800 14px/1 Lexend,system-ui,sans-serif;padding:8px 4px;border-radius:8px}
.spw-leiste .spw-mehr:hover{text-decoration:underline}
.spw-leiste .spw-mehr:focus-visible{outline:3px solid #7B3FE4;outline-offset:2px}
html body.ep-app .ap-karu .ap-held.hs-werbung{border-image-source:url("img/grafik/entdecken/kachel-13.webp?v=3")!important}
html body.ep-app .ap-karu .ap-held.hs-werbung .spw-ecke{position:absolute;right:6px;top:4px;z-index:5;background:rgba(255,255,255,.95);color:#0E5F6E;border-radius:999px;
  padding:4px 9px;font:800 10px/1 Lexend,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;box-shadow:0 2px 6px rgba(0,0,0,.18)}
html body.ep-app .ap-karu .ap-held.hs-werbung-leer>img.hs-kid{transform:scaleX(-1)}
html body.ep-app .ap-karu .ap-held.hs-werbung h1.aph-klein{font-size:clamp(17px,4.6vw,24px)!important;line-height:1.12!important;white-space:normal!important}
@media (prefers-color-scheme:dark){.spw-leiste{background:rgba(255,255,255,.88)}}
`;
  document.head.appendChild(css);
})();
