/* easyplay · regionen.js
   Regionen-Duell: Deutschschweiz gegen Westschweiz (Romandie) gegen Tessin (Svizzera italiana).
   Jedes Kind spielt für seine Sprachregion. Online-Duelle und Duelle auf einem Gerät bringen Punkte
   für die eigene Region. Der Wochen-Cup zählt den Schnitt pro Duell (nicht die Summe), damit die
   kleineren Regionen fair mithalten können. Mit Supabase (supabase/regionen.sql) sehen alle denselben
   Cup, ohne Supabase zählt das Gerät nur die eigenen Punkte.
   Lädt nach duell2.js. Speicher: ep-x-regionen-wahl, ep-x-regionen-lokal. */
(function(){
"use strict";
if(!window.EP_EXTRAS || typeof window.renderDuell !== "function" || typeof DU === "undefined") return;

const LS = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};
const h = s => { try{ return esc(s); }catch(e){ return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); } };
const K_WAHL = "ep-x-regionen-wahl", K_LOKAL = "ep-x-regionen-lokal";

const REG = {
  ds:{id:"ds", name:"Deutschschweiz", sub:"Zürich bis Graubünden", emo:"🏔️", ruf:"Hopp Deutschschweiz!", farbe:"linear-gradient(135deg,#C81D4E,#F0603A)", c:"#E0414A"},
  ro:{id:"ro", name:"Westschweiz", sub:"Romandie", emo:"🍇", ruf:"Allez la Romandie!", farbe:"linear-gradient(135deg,#2B45D9,#5C7CFF)", c:"#3D5AFE"},
  ti:{id:"ti", name:"Tessin", sub:"Svizzera italiana", emo:"🌴", ruf:"Forza Ticino!", farbe:"linear-gradient(135deg,#0B8A5E,#2CC07A)", c:"#12A57F"}
};
const IDS = ["ds", "ro", "ti"];

/* Vorschlag aus Sprache und Kanton (zweisprachige Kantone: Kind wählt selbst) */
function vorschlag(){
  try{ const l = window.EP_I18N && window.EP_I18N.sprache(); if(l === "fr") return "ro"; if(l === "it") return "ti"; }catch(e){}
  const k = (typeof S !== "undefined" && S.profil && String(S.profil.kanton || "").toUpperCase()) || "";
  if(["GE", "VD", "NE", "JU"].includes(k)) return "ro";
  if(k === "TI") return "ti";
  return "ds";
}
const meine = () => REG[LS.get(K_WAHL, "")] || null;

/* Woche nach ISO (Montag bis Sonntag) */
function woche(){
  const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const w1 = new Date(d.getFullYear(), 0, 4);
  const n = 1 + Math.round(((d - w1) / 864e5 - 3 + (w1.getDay() + 6) % 7) / 7);
  return d.getFullYear() + "-W" + String(n).padStart(2, "0");
}
function lokal(){ const x = LS.get(K_LOKAL, null); return x && x.woche === woche() ? x : {woche:woche(), ds:{p:0, n:0}, ro:{p:0, n:0}, ti:{p:0, n:0}}; }

/* ---------- Supabase (optional) ---------- */
function supa(){ try{ return typeof lkSupa === "function" ? lkSupa() : null; }catch(e){ return null; } }
async function rpc(name, body){
  const sp = supa(); if(!sp) return null;
  try{ const r = await fetch(sp.u + "/rest/v1/rpc/" + name, {method:"POST", headers:sp.h, body:JSON.stringify(body || {})}); if(!r.ok) return null; return await r.json(); }catch(e){ return null; }
}
let CUP = null, CUP_ZEIT = 0;
async function cupLaden(){
  if(CUP && Date.now() - CUP_ZEIT < 30000) return CUP;
  const r = await rpc("region_stand", {});
  if(Array.isArray(r)){ const c = {ds:{p:0, n:0}, ro:{p:0, n:0}, ti:{p:0, n:0}, vorher:null};
    r.forEach(x => { if(c[x.region]) c[x.region] = {p:+x.punkte || 0, n:+x.spiele || 0}; if(x.vorwoche_sieger) c.vorher = x.vorwoche_sieger; });
    CUP = c; CUP_ZEIT = Date.now(); }
  return CUP;
}
function buchen(region, punkte){
  if(!REG[region]) return;
  const p = Math.max(0, Math.min(3000, Math.round(punkte || 0)));
  const L = lokal(); L[region].p += p; L[region].n += 1; LS.set(K_LOKAL, L);
  CUP = null; rpc("region_buchen", {p_region:region, p_punkte:p});
}
const schnitt = x => x && x.n ? Math.round(x.p / x.n) : 0;

/* ---------- Übungsgegner aus den anderen Regionen ---------- */
let botsAlt = null;
function regionBots(eigen){
  const B = window.EP_DUELL && window.EP_DUELL.BOTS; if(!B) return;
  if(!botsAlt) botsAlt = B.map(b => ({...b}));
  const andere = IDS.filter(i => i !== eigen);
  const bilder = [{bild:"leni.webp", c:"#E8364F", n:"Leni"}, {bild:"ben.webp", c:"#12A57F", n:"Ben"}];
  B.length = 0;
  andere.forEach((r, i) => B.push({name:bilder[i].n + " · " + REG[r].name, bild:bilder[i].bild, c:bilder[i].c, region:r}));
}
function botsZurueck(){ const B = window.EP_DUELL && window.EP_DUELL.BOTS; if(B && botsAlt){ B.length = 0; botsAlt.forEach(b => B.push({...b})); } botsAlt = null; }
function regionAus(){ DU.reg = null; DU.regSplit = null; botsZurueck(); }

/* ---------- Stil ---------- */
function stil(){
  if(document.getElementById("ep-x-regionen")) return;
  const s = document.createElement("style"); s.id = "ep-x-regionen";
  s.textContent = `
.rgd{max-width:980px;margin:0 auto;display:grid;grid-template-columns:minmax(0,1fr);gap:14px}
.rgd>*{min-width:0}
.rgd-kopf{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.rgd-kopf h1{margin:0;font-size:clamp(22px,4vw,32px)}
.rgd-pill{background:rgba(15,20,48,.55);color:#fff;border-radius:999px;padding:6px 14px;font-weight:700;font-size:14px}
.rgd-wahl{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.rgd-reg{position:relative;border:0;border-radius:22px;padding:14px 12px 12px;color:#fff;text-align:left;cursor:pointer;box-shadow:0 8px 22px rgba(20,30,80,.18);font:inherit;min-height:112px;display:flex;flex-direction:column;gap:3px;outline-offset:3px;transition:transform .15s}
.rgd-reg .e{font-size:28px;line-height:1}
.rgd-reg b{font-size:17px;hyphens:manual;overflow-wrap:anywhere}
.rgd-reg small{opacity:.9;font-size:12.5px}
.rgd-reg .dein{position:absolute;top:8px;right:10px;background:rgba(255,255,255,.25);border-radius:999px;padding:2px 8px;font-size:11px;font-weight:800}
.rgd-reg.an{box-shadow:0 0 0 4px #fff,0 0 0 7px var(--rc),0 10px 26px rgba(20,30,80,.25);transform:translateY(-2px)}
.rgd-reg:not(.an){filter:saturate(.75)}
.rgd-reg:focus-visible{outline:3px solid #0f1430}
.rgd-cup{background:linear-gradient(135deg,#1B2160,#3A2C8C);color:#fff;border-radius:24px;padding:16px;box-shadow:0 8px 22px rgba(20,30,80,.2)}
.rgd-cup h2{margin:0 0 4px;font-size:19px}
.rgd-cup p{margin:0 0 10px;font-size:13px;opacity:.9}
.rgd-bar{display:grid;grid-template-columns:118px 1fr 74px;align-items:center;gap:8px;margin:7px 0;font-size:14px}
.rgd-bar .sp{height:16px;border-radius:99px;background:rgba(255,255,255,.15);overflow:hidden}
.rgd-bar .sp i{display:block;height:100%;border-radius:99px;background:var(--rc);transition:width .6s}
.rgd-bar .w{text-align:right;font-weight:800}
.rgd-bar .w small{display:block;font-weight:500;opacity:.8;font-size:11px}
.rgd-bar.erst b::after{content:" 👑"}
.rgd-modi{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.rgd-m{border-radius:22px;padding:14px;color:#fff;box-shadow:0 8px 22px rgba(20,30,80,.18);display:flex;flex-direction:column;gap:8px}
.rgd-m.on{background:linear-gradient(135deg,#5B2BD9,#9B5CFF)}
.rgd-m.ge{background:linear-gradient(135deg,#E2711D,#F4A62A)}
.rgd-m h3{margin:0;font-size:17px}
.rgd-m p{margin:0;font-size:13px;opacity:.95}
.rgd-m button.los{margin-top:auto;border:0;border-radius:14px;padding:11px 14px;font:inherit;font-weight:800;background:#fff;color:#2a1d5c;cursor:pointer}
.rgd-m button.los:focus-visible{outline:3px solid #0f1430;outline-offset:2px}
.rgd-gg{display:flex;align-items:center;gap:6px}
.rgd-gg select{flex:1;min-width:0;border-radius:12px;border:0;padding:8px;font:inherit;font-size:14px}
.rgd-gg span{font-weight:900}
.rgd-fehler{color:#b3123b;font-weight:700;min-height:1em;margin:0}
.rgd-banner{margin:12px auto 0;max-width:520px;border-radius:20px;padding:12px 14px;color:#fff;display:flex;align-items:center;gap:10px;box-shadow:0 8px 22px rgba(20,30,80,.18)}
.rgd-banner .e{font-size:26px}
.rgd-banner div{flex:1;min-width:0}
.rgd-banner b{display:block}
.rgd-banner button{border:0;border-radius:12px;padding:8px 12px;font:inherit;font-weight:800;background:#fff;color:#222;cursor:pointer}
@media (min-width:700px){.du2-modi .du2-m.regionen{grid-column:1/-1}}
.du2-m.regionen{background:linear-gradient(135deg,#C81D4E 0%,#3D5AFE 55%,#12A57F 100%)!important;color:#fff}
@media (max-width:600px){
  .rgd-wahl{gap:7px}.rgd-reg{min-height:96px;padding:11px 9px 9px;border-radius:18px}.rgd-reg b{font-size:14.5px}.rgd-reg small{font-size:11px}.rgd-reg .e{font-size:22px}
  .rgd-reg .dein{position:static;align-self:flex-start;order:-1;margin-bottom:2px}
  .rgd-modi{grid-template-columns:minmax(0,1fr)}.rgd-gg{flex-direction:column;align-items:stretch}.rgd-gg span{text-align:center}.rgd-bar{grid-template-columns:92px 1fr 62px;font-size:13px}
}
@media (prefers-reduced-motion:reduce){.rgd-reg,.rgd-bar .sp i{transition:none}}`;
  document.head.appendChild(s);
}

/* ---------- Seite ---------- */
function cupHTML(c, online){
  const daten = online ? c : lokal();
  const w = IDS.map(i => ({id:i, s:schnitt(daten[i]), n:daten[i].n, p:daten[i].p}));
  const max = Math.max(1, ...w.map(x => x.s));
  const erst = w.slice().sort((a, b) => b.s - a.s)[0];
  return `<section class="rgd-cup" aria-label="Regionen-Cup dieser Woche">
    <h2>🏆 Regionen-Cup dieser Woche</h2>
    <p>${online ? "Es zählt der Schnitt pro Duell, nicht die Summe. So hat jede Region die gleiche Chance." : "Hier siehst du deine eigenen Duelle dieser Woche. Der Cup mit allen Kindern erscheint, sobald die Seite online mit der Datenbank verbunden ist."}${online && c.vorher && REG[c.vorher] ? ` Letzte Woche gewann ${REG[c.vorher].emo} ${REG[c.vorher].name}.` : ""}</p>
    ${w.map(x => `<div class="rgd-bar${erst.s > 0 && x.id === erst.id ? " erst" : ""}" style="--rc:${REG[x.id].c}"><b>${REG[x.id].emo} ${REG[x.id].name}</b><span class="sp"><i style="width:${x.s / max * 100}%"></i></span><span class="w">${x.s}<small>${x.n} ${x.n === 1 ? "Duell" : "Duelle"}</small></span></div>`).join("")}
  </section>`;
}
function seite(box, api){
  stil();
  const m = meine(), vs = vorschlag(), akt = m ? m.id : vs;
  const zweit = IDS.find(i => i !== akt);
  box.innerHTML = `<div class="rgd">
    <div class="rgd-kopf"><h1>🇨🇭 Regionen-Duell</h1><span class="rgd-pill">${m ? h(m.ruf) : "Wähle deine Region"}</span></div>
    <div class="rgd-wahl" role="radiogroup" aria-label="Deine Region">
      ${IDS.map(i => `<button type="button" class="rgd-reg${i === akt && m ? " an" : ""}" role="radio" aria-checked="${i === akt && !!m}" data-reg="${i}" style="background:${REG[i].farbe};--rc:${REG[i].c}">${i === akt && m ? `<span class="dein">Deine Region</span>` : ""}<span class="e">${REG[i].emo}</span><b>${REG[i].name.replace("schweiz","&shy;schweiz")}</b><small>${REG[i].sub}</small></button>`).join("")}
    </div>
    <div id="rgdCup">${cupHTML(null, false)}</div>
    <div class="rgd-modi">
      <div class="rgd-m on"><h3>🌐 Online für ${h((m || REG[akt]).name)}</h3><p>Spiel gegen ein anderes Kind. Findet sich niemand, spielen Leni und Ben für die anderen Regionen. Deine Punkte zählen für deine Region.</p><button type="button" class="los" id="rgdOnline">⚔️ Duell starten</button></div>
      <div class="rgd-m ge"><h3>📱 Region gegen Region</h3><p>Zu zweit an einem Gerät, zum Beispiel mit Gotti aus Lausanne oder Cousine aus Lugano.</p>
        <div class="rgd-gg"><select id="rgdA" aria-label="Region Spieler 1">${IDS.map(i => `<option value="${i}"${i === akt ? " selected" : ""}>${REG[i].emo} ${REG[i].name}</option>`).join("")}</select><span>vs</span><select id="rgdB" aria-label="Region Spieler 2">${IDS.map(i => `<option value="${i}"${i === zweit ? " selected" : ""}>${REG[i].emo} ${REG[i].name}</option>`).join("")}</select></div>
        <button type="button" class="los" id="rgdSplit">⚔️ Starten</button></div>
    </div>
    <p class="rgd-fehler" id="duErr" aria-live="polite"></p>
  </div>`;
  box.querySelectorAll("[data-reg]").forEach(b => b.onclick = () => { LS.set(K_WAHL, b.dataset.reg); api.ton && api.ton("klick"); seite(box, api); });
  const bereit = () => { if(!meine()){ LS.set(K_WAHL, akt); } return meine(); };
  const genug = () => { try{ if(duellPool(DU.cat, DU.stufe).length >= 3) return true; DU.cat = "alle"; DU.stufe = 0; return duellPool("alle", 0).length >= 3; }catch(e){ return true; } };
  box.querySelector("#rgdOnline").onclick = () => {
    const r = bereit(); if(!genug()) return;
    DU.regSplit = null; DU.reg = r.id; regionBots(r.id);
    try{ window.EP_DUELL.matchStart(); }catch(e){ console.warn("regionen.js", e); }
  };
  box.querySelector("#rgdSplit").onclick = () => {
    const a = box.querySelector("#rgdA").value, b = box.querySelector("#rgdB").value;
    if(a === b){ box.querySelector("#duErr").textContent = "Wählt zwei verschiedene Regionen."; return; }
    bereit(); if(!genug()) return;
    DU.reg = null; botsZurueck(); DU.regSplit = [a, b];
    splitStart(REG[a].emo + " " + REG[a].name, REG[b].emo + " " + REG[b].name);
  };
  cupLaden().then(c => { const z = box.querySelector("#rgdCup"); if(c && z && document.body.contains(z)) z.innerHTML = cupHTML(c, true); });
}

EP_EXTRAS.register({
  id:"regionen", titel:"Regionen-Duell", text:"Deutschschweiz gegen Romandie gegen Tessin", emo:"🇨🇭",
  farbe:"linear-gradient(135deg,#C81D4E,#3D5AFE 60%,#12A57F)", reihe:4,
  hinweis(){ const m = meine(); return m ? m.emo : ""; },
  render(box, api){ seite(box, api); }
});

/* ---------- Duell-Menü: Knopf «Regionen-Duell» ---------- */
const vorDuell = window.renderDuell;
window.renderDuell = function(){
  regionAus();
  const r = vorDuell.apply(this, arguments);
  try{
    stil();
    const modi = document.querySelector("#app .du2-modi");
    if(modi && !modi.querySelector(".regionen")){
      const m = meine();
      const b = document.createElement("button"); b.type = "button"; b.className = "du2-m regionen"; b.id = "duRegionen";
      b.innerHTML = `<span class="tag">Neu</span><span class="ic">🇨🇭</span><span class="tx"><b>Regionen-Duell</b><small>${m ? h(m.emo + " Du spielst für " + m.name + ".") : "Deutschschweiz gegen Romandie gegen Tessin."}</small></span><span class="los">🏆 Zum Cup</span>`;
      b.onclick = () => go("x-regionen");
      modi.appendChild(b);
    }
  }catch(e){ console.warn("regionen.js", e); }
  return r;
};

/* ---------- Ende eines Duells: Punkte für die Region buchen ---------- */
const vorEnde = window.renderDuellEnde;
window.renderDuellEnde = function(){
  const r = vorEnde.apply(this, arguments);
  try{
    let zeilen = [];
    if(DU.mode === "match" && DU.reg && DU.run && DU.run.fertig !== false){
      const R = DU.run; if(!R._reg){ R._reg = true; buchen(DU.reg, R.score); }
      zeilen.push([DU.reg, R.score]);
    } else if(DU.mode !== "match" && DU.mode !== "online" && DU.mode !== "link" && DU.regSplit && DU.split){
      const D = DU.split; if(!D._reg){ D._reg = true; buchen(DU.regSplit[0], D.score[0]); buchen(DU.regSplit[1], D.score[1]); }
      zeilen = [[DU.regSplit[0], D.score[0]], [DU.regSplit[1], D.score[1]]];
    }
    if(zeilen.length){
      stil();
      const karte = document.querySelector("#app .duende") || document.querySelector("#app .card");
      const el = document.createElement("div");
      el.innerHTML = zeilen.map(([g, p]) => `<div class="rgd-banner" style="background:${REG[g].farbe}"><span class="e">${REG[g].emo}</span><div><b>+${p} Punkte für ${REG[g].name}</b><small>${h(REG[g].ruf)}</small></div></div>`).join("")
        + `<div class="rgd-banner" style="background:linear-gradient(135deg,#1B2160,#3A2C8C)"><span class="e">🏆</span><div><b>Regionen-Cup</b><small>Wie steht deine Region diese Woche?</small></div><button type="button" id="rgdZumCup">Ansehen</button></div>`;
      if(karte) karte.after(el); else document.getElementById("app").appendChild(el);
      el.querySelector("#rgdZumCup").onclick = () => { try{ duellLeave(); }catch(e){} if(window.EP_DUELL) window.EP_DUELL.matchStop(); go("x-regionen"); };
    }
  }catch(e){ console.warn("regionen.js", e); }
  return r;
};

window.EP_REGIONEN = { meine:() => { const m = meine(); return m ? m.id : null; }, vorschlag, REG, buchen };
})();
