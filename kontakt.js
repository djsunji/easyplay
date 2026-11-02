/* ===== Kontaktformular (Seite «kontakt», Adresse /kontakt) =====
   Link «Kontakt» unten neben Impressum und Datenschutz (footer.eplegal, index.html) und im Profil der App (app.js).
   Schickt an /api/kontakt (server/kontakt.js), der Server leitet an <adresse>@easyplay.ch weiter (Antwort geht an die angegebene Adresse).
   Die Adressen kommen vom Server (POST_ADRESSEN, wie im Postfach der Verwaltung), hier stehen Titel und Symbole dazu. ===== */
(function(){
  const D = "img/grafik/diverse/";
  const ART = {
    info:     {t:"Allgemeine Fragen",      s:"Alles rund um easyplay",            i:"brief",       k:"01"},
    feedback: {t:"Feedback & Fehler",      s:"Ideen, Lob, falsche Fragen melden", i:"sprechblase", k:"05"},
    schule:   {t:"Schulen & Lehrpersonen", s:"Klassen, Tests, Lehrerbereich",     i:"doktorhut",   k:"04"},
    sponsor:  {t:"Sponsoring & Werbung",   s:"Partner werden, Werbung in Qeels",  i:"handschlag",  k:"03"}
  };
  const STD = ["info", "feedback", "schule", "sponsor"];
  const K = {an:"info", adressen:null, domain:"easyplay.ch", start:0, gesendet:null, laeuft:false};
  const h = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const basis = () => { try{ return (window.EP_CONFIG && window.EP_CONFIG.supabaseUrl) || ""; }catch(e){ return ""; } };

  async function adressenHolen(){
    if(K.adressen) return;
    K.adressen = STD.slice();
    const b = basis(); if(!b) return;
    try{ const r = await fetch(b + "/api/kontakt", {cache:"no-store"}); if(!r.ok) return; const j = await r.json();
      if(Array.isArray(j.adressen) && j.adressen.length){ K.adressen = j.adressen; if(!K.adressen.includes(K.an)) K.an = K.adressen[0]; }
      if(j.domain) K.domain = j.domain;
      if(S.screen === "kontakt") zeichnen(); }catch(e){}
  }

  function karte(id){
    const a = ART[id] || {t:id.charAt(0).toUpperCase() + id.slice(1), s:"", i:"brief", k:"06"};
    return `<button type="button" class="kf-an${id === K.an ? " an" : ""}" data-kf-an="${h(id)}" aria-pressed="${id === K.an}" style="--kf-k:url('img/grafik/entdecken/kachel-${a.k}.webp?v=3')">
      <span class="kf-ic"><img src="${D}${a.i}.webp?v=2" alt=""></span><span class="kf-tx"><b>${h(a.t)}</b><small>${h(a.s)}</small><em>${h(id)}@${h(K.domain)}</em></span></button>`;
  }

  function zeichnen(){
    const app = document.getElementById("app"); if(!app) return;
    const p = (typeof S !== "undefined" && S.profil) || {};
    let pfad = ""; try{ pfad = crumbsHTML([["Start", () => go("home")]], "Kontakt"); }catch(e){}
    if(K.gesendet){
      app.innerHTML = pfad + `<div class="kf-seite"><div class="kf-fertig">
        <img class="kf-fkid" src="img/kids/duo-jubel.webp" alt="">
        <h1>Danke für deine Nachricht!</h1>
        <p>Sie ist unterwegs an <b>${h(K.gesendet)}</b>. Wir antworten dir so bald wie möglich per E-Mail.</p>
        <div class="kf-knoepfe"><button type="button" class="big alt" id="kfNochmal">Noch eine Nachricht</button><button type="button" class="big gold" id="kfHome">Zur Startseite</button></div>
      </div></div>`;
      app.querySelector("#kfNochmal").onclick = () => { K.gesendet = null; K.start = Date.now(); zeichnen(); };
      app.querySelector("#kfHome").onclick = () => go("home");
      try{ bindCrumbs(); }catch(e){}
      return;
    }
    const alt = {}; app.querySelectorAll(".kf-form [name]").forEach(x => alt[x.name] = x.value);
    const name = alt.name ?? (p.vorname ? (p.vorname + " " + (p.nachname || "")).trim() : (p.name || ""));
    const mail = alt.mail ?? (p.email || "");
    app.innerHTML = pfad + `<div class="kf-seite">
      <div class="kf-kopf"><img class="kf-kid" src="img/kids/lumi-zeigen.webp" alt=""><div><h1>Kontakt</h1><p>Schreib uns! Wähle zuerst, an wen deine Nachricht gehen soll.</p></div><img class="kf-kid kf-r" src="img/kids/milo-winken.webp" alt=""></div>
      <div class="kf-wahl" role="group" aria-label="Empfänger">${(K.adressen || STD).map(karte).join("")}</div>
      <form class="kf-form" novalidate>
        <div class="kf-zeile"><div><label for="kfName"><img src="${D}teddy.webp?v=2" alt="">Dein Name</label><input id="kfName" name="name" maxlength="60" autocomplete="name" value="${h(name)}" placeholder="Vorname und Nachname"></div>
          <div><label for="kfMail"><img src="${D}brief.webp?v=2" alt="">Deine E-Mail-Adresse</label><input id="kfMail" name="mail" type="email" maxlength="200" autocomplete="email" value="${h(mail)}" placeholder="name@beispiel.ch"></div></div>
        <label for="kfBetreff"><img src="${D}notizbuch.webp?v=2" alt="">Betreff</label><input id="kfBetreff" name="betreff" maxlength="120" value="${h(alt.betreff || "")}" placeholder="Worum geht es?">
        <label for="kfText"><img src="${D}sprechblase.webp?v=2" alt="">Deine Nachricht</label><textarea id="kfText" name="text" maxlength="4000" rows="7" placeholder="Schreib hier deine Nachricht …">${h(alt.text || "")}</textarea>
        <div class="kf-falle" aria-hidden="true"><label>Website<input name="website" tabindex="-1" autocomplete="off"></label></div>
        <p class="kf-hinweis">Bist du jünger als 16? Frag bitte zuerst deine Eltern. Schreib keine Adresse, Telefonnummer oder Passwörter in die Nachricht.</p>
        <p class="kf-err" id="kfErr" aria-live="polite"></p>
        <button type="submit" class="big gold kf-los" id="kfLos">Nachricht senden</button>
      </form></div>`;
    app.querySelectorAll("[data-kf-an]").forEach(b => b.onclick = () => { K.an = b.dataset.kfAn; app.querySelectorAll("[data-kf-an]").forEach(x => { const an = x === b; x.classList.toggle("an", an); x.setAttribute("aria-pressed", an); }); });
    app.querySelector(".kf-form").onsubmit = e => { e.preventDefault(); senden(); };
    try{ bindCrumbs(); }catch(e){}
  }

  async function senden(){
    if(K.laeuft) return;
    const f = document.querySelector(".kf-form"), err = document.getElementById("kfErr"), los = document.getElementById("kfLos");
    const w = n => (f.querySelector(`[name="${n}"]`) || {}).value || "";
    const daten = {an:K.an, name:w("name").trim(), mail:w("mail").trim(), betreff:w("betreff").trim(), text:w("text").trim(), website:w("website"), dauer:Date.now() - K.start};
    if(daten.name.length < 2){ err.textContent = "Bitte gib deinen Namen ein."; f.querySelector("#kfName").focus(); return; }
    if(!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(daten.mail)){ err.textContent = "Bitte gib eine gültige E-Mail-Adresse ein, damit wir antworten können."; f.querySelector("#kfMail").focus(); return; }
    if(daten.text.length < 10){ err.textContent = "Deine Nachricht ist noch sehr kurz. Schreib bitte etwas mehr."; f.querySelector("#kfText").focus(); return; }
    const b = basis();
    if(!b){ err.innerHTML = `Hier kann das Formular nicht senden. Schreib uns direkt an <a href="mailto:${h(K.an)}@${h(K.domain)}">${h(K.an)}@${h(K.domain)}</a>.`; return; }
    K.laeuft = true; los.disabled = true; los.textContent = "Wird gesendet …"; err.textContent = "";
    try{
      const r = await fetch(b + "/api/kontakt", {method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify(daten)});
      const j = await r.json().catch(() => ({}));
      if(!r.ok) throw new Error(j.message || "Die Nachricht konnte nicht verschickt werden. Bitte versuche es später nochmals.");
      K.gesendet = j.an || (K.an + "@" + K.domain); zeichnen(); scrollTo(0, 0);
    }catch(e){ err.textContent = e.message || "Die Nachricht konnte nicht verschickt werden."; }
    finally{ K.laeuft = false; const l = document.getElementById("kfLos"); if(l){ l.disabled = false; l.textContent = "Nachricht senden"; } }
  }

  /* Seite einhängen */
  const vorRender = window.render;
  window.render = function(){
    if(typeof S !== "undefined" && S.screen === "kontakt"){
      try{ renderNav(); }catch(e){}
      if(!K.start) K.start = Date.now();
      zeichnen(); adressenHolen(); return;
    }
    K.start = 0; if(K.gesendet && S.screen !== "kontakt") K.gesendet = null;
    return vorRender.apply(this, arguments);
  };
  /* Links «Kontakt» (Fuss der Seite, Profil in der App) öffnen die Seite ohne Neuladen */
  document.addEventListener("click", e => { const a = e.target.closest && e.target.closest("[data-kontakt]"); if(!a) return; e.preventDefault(); go("kontakt"); });
  window.EP_KONTAKT = { oeffnen: () => go("kontakt") };

  const css = document.createElement("style"); css.id = "ep-kontakt-css";
  css.textContent = `
html body #app .kf-seite{max-width:980px;margin:6px auto 30px;display:grid;gap:22px}
html body #app .kf-kopf{display:flex;align-items:center;justify-content:center;gap:18px;text-align:center;min-height:110px;padding:0 4px;box-sizing:border-box;
  border:0 solid transparent;border-width:30px;border-image:url("img/grafik/entdecken/kopf.webp?v=1") 50 fill / 30px stretch;filter:drop-shadow(0 12px 20px rgba(60,30,160,.3));color:#fff}
html body #app .kf-kopf h1{margin:0;font:700 clamp(1.6rem,3.4vw,2.5rem)/1.1 Fredoka,Lexend,system-ui,sans-serif;color:#fff!important;text-shadow:0 3px 6px rgba(30,10,80,.45)}
html body #app .kf-kopf p{margin:6px 0 0;font-weight:700;font-size:1.05rem;color:#fff!important;text-shadow:0 2px 4px rgba(30,10,80,.4)}
html body #app .kf-kid{flex:none;width:110px;height:132px;object-fit:contain;margin:-50px 0 -30px;filter:drop-shadow(0 6px 8px rgba(20,0,60,.35));animation:akHuepf 3.2s ease-in-out infinite}
html body #app .kf-kid.kf-r{animation-delay:-1.6s}
html body #app .kf-wahl{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px}
html body #app .kf-an{all:unset;box-sizing:border-box;cursor:pointer;position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:8px;min-height:150px;padding:2px 4px;
  border:0 solid transparent;border-width:20px;border-image:var(--kf-k) 46 fill / 20px stretch;color:#fff;filter:drop-shadow(0 8px 14px rgba(30,30,90,.25)) saturate(.85) brightness(.95);opacity:.88;transition:transform .2s,filter .2s,opacity .2s}
html body #app .kf-an:hover{transform:translateY(-3px);opacity:1}
html body #app .kf-an.an{opacity:1;transform:translateY(-4px);filter:drop-shadow(0 0 0 #FFD84D) drop-shadow(0 0 14px rgba(255,200,40,.85)) drop-shadow(0 10px 16px rgba(30,30,90,.3))}
html body #app .kf-an.an::after{content:"✓";position:absolute;top:-16px;right:-14px;width:32px;height:32px;border-radius:50%;display:grid;place-items:center;font:900 1.1rem system-ui;color:#3A1C00;
  background:radial-gradient(circle at 35% 30%,#FFF7CF,#FFC93A 55%,#E58E0C);box-shadow:0 0 0 3px #fff,0 4px 8px rgba(0,0,0,.25)}
html body #app .kf-an:focus-visible{outline:4px solid #FFE34D;outline-offset:6px}
html body #app .kf-ic{flex:none;width:58px;height:58px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 35% 30%,#FFF7CF,#FFC93A 55%,#E58E0C);box-shadow:0 0 0 3px rgba(255,255,255,.75),0 6px 12px rgba(0,0,0,.25)}
html body #app .kf-ic img{width:38px;height:38px;object-fit:contain}
html body #app .kf-tx{display:grid;gap:2px;min-width:0}
html body #app .kf-tx b{font:700 1.12rem/1.15 Fredoka,Lexend,system-ui,sans-serif;color:#fff;text-shadow:0 2px 4px rgba(0,0,0,.4)}
html body #app .kf-tx small{font-size:.86rem;font-weight:700;color:#fff;opacity:.95;text-shadow:0 1px 3px rgba(0,0,0,.4)}
html body #app .kf-tx em{font-style:normal;font-size:.76rem;font-weight:800;color:#fff;opacity:.9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
html body #app .kf-form{display:grid;gap:6px;background:rgba(255,255,255,.95);border:4px solid #fff;border-radius:30px;box-shadow:0 16px 36px rgba(40,30,120,.2);padding:clamp(16px,3vw,30px);color:#1B2240}
html body #app .kf-zeile{display:grid;grid-template-columns:1fr 1fr;gap:14px}
html body #app .kf-zeile > div{display:grid;gap:6px;min-width:0}
html body #app .kf-form label{display:flex;align-items:center;gap:8px;font-weight:800;color:#2A1F5C;margin-top:6px}
html body #app .kf-form label img{width:26px;height:26px;object-fit:contain}
html body #app .kf-form :is(input,textarea){width:100%;box-sizing:border-box;border:3px solid #E2DCFA;border-radius:18px;background:#F6F4FF;padding:12px 14px;font:500 1rem Lexend,system-ui,sans-serif;color:#1B2240}
html body #app .kf-form textarea{resize:vertical;min-height:150px}
html body #app .kf-form :is(input,textarea):focus{outline:none;border-color:#8A5BFF;box-shadow:0 0 0 4px rgba(138,91,255,.18)}
html body #app .kf-falle{position:absolute!important;left:-9999px;width:1px;height:1px;overflow:hidden}
html body #app .kf-hinweis{margin:8px 0 0;font-size:.86rem;color:#5A5F86}
html body #app .kf-err{margin:4px 0 0;color:#D6362E;font-weight:700}
html body #app .kf-err:empty{display:none}
html body #app .kf-los{justify-self:center;margin-top:8px;min-width:260px!important}
html body #app .kf-fertig{display:grid;justify-items:center;gap:10px;text-align:center;background:rgba(255,255,255,.95);border:4px solid #fff;border-radius:30px;box-shadow:0 16px 36px rgba(40,30,120,.2);padding:20px clamp(16px,4vw,40px) 30px;color:#1B2240}
html body #app .kf-fkid{width:min(220px,60%);height:auto;margin-top:-10px;animation:akHuepf 3s ease-in-out infinite}
html body #app .kf-fertig h1{margin:0;font:700 clamp(1.5rem,3vw,2.2rem) Fredoka,Lexend,system-ui,sans-serif;color:#2A1F5C}
html body #app .kf-fertig p{margin:0;font-size:1.05rem}
html body #app .kf-knoepfe{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin-top:10px}
html body #app .kf-seite .big.gold{all:unset;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;gap:8px;height:58px;min-width:220px;padding:0 10px;cursor:pointer;
  border:0 solid transparent;border-width:17px 29px;border-image:url("img/grafik/knopf-gold.webp?v=1") 52 87 fill / 17px 29px stretch;color:#3A1C00;font:700 1.15rem Fredoka,Lexend,system-ui,sans-serif;filter:drop-shadow(0 4px 6px rgba(120,70,0,.25))}
html body #app .kf-seite .big.alt{all:unset;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;gap:8px;height:58px;min-width:180px;padding:0 10px;cursor:pointer;
  border:0 solid transparent;border-width:17px 29px;border-image:url("img/grafik/knopf-zurueck.webp?v=1") 70 118 fill / 17px 29px stretch;color:#28304A;font:800 1rem Lexend,system-ui,sans-serif;filter:drop-shadow(0 4px 6px rgba(40,30,120,.2))}
html body #app .kf-seite .big:is(.gold,.alt):hover{filter:brightness(1.05) drop-shadow(0 6px 8px rgba(40,30,120,.25))}
html body #app .kf-seite .big:is(.gold,.alt):focus-visible{outline:3px solid #7B3FE4;outline-offset:3px}
html body #app .kf-seite .kf-los.big.gold{justify-self:center;margin-top:8px;min-width:280px}
html body #app .kf-seite .big.gold[disabled]{opacity:.7;cursor:wait}
@media (max-width:640px){
  html body #app .kf-seite{gap:14px}
  html body #app .kf-kopf{min-height:0;gap:6px;border-width:22px;border-image-width:22px}
  html body #app .kf-kopf h1{font-size:1.4rem}html body #app .kf-kopf p{font-size:.86rem}
  html body #app .kf-kid{width:58px;height:74px;margin:-28px 0 -18px}
  html body #app .kf-wahl{grid-template-columns:1fr 1fr;gap:10px}
  html body #app .kf-an{flex-direction:column;align-items:flex-start;gap:6px;min-height:0;border-width:16px;border-image-width:16px;padding:0}
  html body #app .kf-ic{width:40px;height:40px}html body #app .kf-ic img{width:26px;height:26px}
  html body #app .kf-tx b{font-size:.95rem}html body #app .kf-tx small{display:none}html body #app .kf-tx em{font-size:.7rem}
  html body #app .kf-zeile{grid-template-columns:1fr;gap:0}
  html body #app .kf-form :is(input,textarea){font-size:16px}
  html body #app .kf-seite .kf-los.big.gold{min-width:0;width:100%}
}
@media (prefers-reduced-motion:reduce){html body #app :is(.kf-kid,.kf-fkid){animation:none!important}}`;
  document.head.appendChild(css);
})();
