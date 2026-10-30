/* easyplay: Duell auf einem Gerät wie in der Qeels-App (Stand 30.10.)
   2 bis 4 Kinder spielen abwechselnd auf demselben Handy, iPad oder Computer.
   Vorher: Spieler mit Bild und Namen, Fragen pro Spieler (3/5/10 oder Regler 1 bis 100), Thema (Bereich, alles gemischt, ein Thema).
   Im Spiel: Kärtchen mit Punkten, Band «… ist dran», Frage-Karte im Qeels-Design. Am Schluss Treppchen.
   Eigene Seite S.screen = "duellgeraet". Der Knopf «Auf einem Gerät» im Duell-Menü (duell2.js) führt hierher.
   Lädt nach quizstil.js. */
(function(){
"use strict";
if(typeof window.render !== "function") return;
const SEITE = "duellgeraet";
const h = s => { try{ return esc(s); }catch(e){ return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); } };
const LS = { get(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } }, set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} } };
const ton = n => { try{ window.EP_SOUND && window.EP_SOUND.play(n); }catch(e){} };
const FARBE = [["#FF8A3D", "#E0457B"], ["#3BC3FF", "#5B3CF0"], ["#3EE08A", "#11946A"], ["#FFC93C", "#E07B00"]];
const MEDAILLE = ["🥇", "🥈", "🥉", ""];
const ANZAHL = [3, 5, 10], MAX = 100;
const START_AV = ["e0", "e5", "e12", "e20"];
const KACHEL = {welt:"img/kacheln/bereich-welt.webp", natur:"img/kacheln/bereich-natur.webp", geld:"img/kacheln/bereich-geld.webp", alltag:"img/kacheln/bereich-alltag.webp"};
const QI = n => `img/qeels-icons/themen/${n}.webp`;

/* ---------- Zustand ---------- */
const G = {
  spieler: [0, 1, 2, 3].map(i => ({name:"Spieler " + (i + 1), av:START_AV[i]})),
  zahl: 2, runden: 5, wahl: {art:"mix"},
  phase: "start", zuege: [], nr: 0, punkte: [0, 0, 0, 0], gewaehlt: null, fehler: "", themenAuf: false
};
(function laden(){ const d = LS.get("ep-duellgeraet", {}); if(d.zahl) G.zahl = d.zahl; if(d.runden) G.runden = d.runden; if(d.wahl) G.wahl = d.wahl;
  (d.spieler || []).forEach((x, i) => { if(G.spieler[i] && x){ if(x.name) G.spieler[i].name = String(x.name).slice(0, 16); if(x.av) G.spieler[i].av = x.av; } }); })();
const merken = () => LS.set("ep-duellgeraet", {zahl:G.zahl, runden:G.runden, wahl:G.wahl, spieler:G.spieler});
function avListe(){ try{ return Object.keys(AVATAR_IMG); }catch(e){ return START_AV; } }
function avBild(k){ try{ return avatar(k); }catch(e){ return ""; } }
const aktiv = () => G.spieler.slice(0, G.zahl);
const name = i => (aktiv()[i] && aktiv()[i].name.trim()) || ("Spieler " + (i + 1));
function bereiche(){ try{ return BEREICHE; }catch(e){ return []; } }
function themaInfo(id){ try{ const t = THEMA[id]; const b = bereiche().find(x => x.themen.some(y => y.id === id)); return {t, b}; }catch(e){ return {}; } }
function wahlText(){ const w = G.wahl; if(w.art === "mix") return "Alles gemischt"; if(w.art === "bereich"){ const b = bereiche().find(x => x.id === w.b); return b ? b.name : ""; } const i = themaInfo(w.t); return i.t ? i.t.name : ""; }
function stufe(){ let s = 0; try{ s = +S.stufe || 0; }catch(e){} return s >= 1 && s <= 3 ? s : 0; }

/* ---------- Fragen ---------- */
function frage(f){ const o = shuffle(f.a.map((t, i) => ({t, ok:i === 0}))); return {id:qid(f), q:f.q, img:f.img || null, opts:o.map(x => x.t), c:o.findIndex(x => x.ok), m:f.m}; }
function fragenHolen(n){
  const st = stufe(); let p = [];
  try{
    if(G.wahl.art === "mix") p = pool("alle");
    else if(G.wahl.art === "thema") p = pool(G.wahl.t);
    else { const b = bereiche().find(x => x.id === G.wahl.b); const ids = new Set(); (b ? b.themen : []).forEach(t => { if(t.id === "bilder") return; pool(t.id).forEach(f => { const k = qid(f); if(!ids.has(k)){ ids.add(k); p.push(f); } }); }); }
  }catch(e){ p = []; }
  const passend = st ? p.filter(f => f.l === st) : p;
  return shuffle([...(passend.length >= n ? passend : p)]).slice(0, n).map(frage);
}
function starten(){
  merken(); G.fehler = "";
  const liste = fragenHolen(G.runden * G.zahl);
  if(liste.length < G.zahl){ G.fehler = "Zu diesem Thema gibt es noch zu wenig Fragen. Wählt ein anderes."; zeichnen(); return; }
  const proKind = Math.floor(liste.length / G.zahl);
  G.zuege = liste.slice(0, proKind * G.zahl); G.nr = 0; G.punkte = [0, 0, 0, 0]; G.gewaehlt = null; G.phase = "spiel";
  ton("duellstart"); zeichnen(); try{ scrollTo(0, 0); }catch(e){}
}
function waehle(i){
  if(G.gewaehlt != null) return; const z = G.zuege[G.nr]; if(!z) return;
  G.gewaehlt = i; const ok = i === z.c; ton(ok ? "richtig" : "falsch");
  if(ok) G.punkte[G.nr % G.zahl]++;
  zeichnen();
}
function weiter(){ G.gewaehlt = null; if(G.nr + 1 >= G.zuege.length){ G.phase = "ende"; ton("sieg"); } else G.nr++; zeichnen(); try{ scrollTo(0, 0); }catch(e){} }

/* ---------- Bausteine ---------- */
const kopf = unter => `<div class="dg-kopf"><button type="button" class="dg-zu" data-dg="zu" aria-label="Zurück">←</button>
  <img class="dg-kic" src="${QI("duell")}" alt=""><div><h1>Duell</h1>${unter ? `<small>${h(unter)}</small>` : ""}</div></div>`;
const wahlKnopf = (an, text, attr, inner = "") => `<button type="button" class="dg-wahl${an ? " an" : ""}" ${attr} aria-pressed="${an}">${inner}<span>${h(text)}</span></button>`;

function startHTML(){
  const anteil = (G.runden - 1) / (MAX - 1) * 100;
  const themen = G.themenAuf ? bereiche().flatMap(b => b.themen.filter(t => { try{ return !t.menu && pool(t.id).length >= 3; }catch(e){ return false; } }).map(t => ({t, b}))) : [];
  const w = G.wahl;
  let ic = ""; if(w.art === "thema"){ try{ ic = themaIcon(THEMA[w.t]); }catch(e){} }
  return `<div class="dg dg-start">${kopf("")}
    <p class="dg-text">Ein Gerät, bis zu vier Kinder. Ihr antwortet abwechselnd, wer am meisten richtig hat, gewinnt.</p>
    <p class="dg-lbl">WIE VIELE SPIELEN?</p>
    <div class="dg-reihe">${[2, 3, 4].map(n => wahlKnopf(G.zahl === n, n + " Spieler", `data-zahl="${n}"`)).join("")}</div>
    <div class="dg-spieler">${aktiv().map((sp, i) => `<div class="dg-sp" style="--f1:${FARBE[i][0]};--f2:${FARBE[i][1]}">
      <button type="button" class="dg-av" data-av="${i}" aria-label="Bild von ${h(name(i))} wechseln">${avBild(sp.av)}<i>↻</i></button>
      <input class="dg-name" data-name="${i}" value="${h(sp.name)}" maxlength="16" aria-label="Name Spieler ${i + 1}"></div>`).join("")}</div>
    <p class="dg-lbl">FRAGEN PRO SPIELER</p>
    <div class="dg-reihe">${ANZAHL.map(n => wahlKnopf(G.runden === n, n + " Fragen", `data-runden="${n}"`)).join("")}</div>
    <div class="dg-regler"><button type="button" class="dg-plus" data-plus="-1" aria-label="Eine Frage weniger">−</button>
      <div class="dg-bahn"><input type="range" min="1" max="${MAX}" value="${G.runden}" id="dgRegler" aria-label="Fragen pro Spieler" style="--p:${anteil}%"><span class="dg-griff" style="left:${anteil}%">${G.runden}</span></div>
      <button type="button" class="dg-plus" data-plus="1" aria-label="Eine Frage mehr">+</button></div>
    <p class="dg-lbl">THEMA</p>
    <div class="dg-raster">${bereiche().map(b => { const an = w.art === "bereich" && w.b === b.id;
      return `<button type="button" class="dg-kachel${an ? " an" : ""}" data-bereich="${b.id}" aria-pressed="${an}" style="background-image:url(${KACHEL[b.id] || ""})"><span>${h(b.name)}</span>${an ? `<i class="dg-haken">✓</i>` : ""}</button>`; }).join("")}</div>
    <div class="dg-reihe">${wahlKnopf(w.art === "mix", "Alles gemischt", `data-mix="1"`, `<img src="${QI("zufall")}" alt="">`)}
      ${wahlKnopf(w.art === "thema", w.art === "thema" ? wahlText() : "Ein Thema", `data-themen="1"`, w.art === "thema" ? `<span class="dg-tic">${ic}</span>` : `<img src="${QI("suche")}" alt="">`)}</div>
    ${G.themenAuf ? `<div class="dg-themen">${themen.map(({t, b}) => { let ti = ""; try{ ti = themaIcon(t); }catch(e){}
      return `<button type="button" class="dg-thema${w.art === "thema" && w.t === t.id ? " an" : ""}" data-thema="${t.id}" style="--c:var(${b.c})"><span class="dg-tic">${ti}</span>${h(t.name)}</button>`; }).join("")}</div>` : ""}
    ${G.fehler ? `<p class="dg-fehler">${h(G.fehler)}</p>` : ""}
    <div class="dg-unten"><button type="button" class="dg-los" data-dg="los">Los geht’s · ${G.runden * G.zahl} Fragen</button></div>
  </div>`;
}
function spielHTML(){
  const z = G.zuege[G.nr], wer = G.nr % G.zahl, proKind = Math.max(1, G.zuege.length / G.zahl), fertig = G.gewaehlt != null;
  let bild = ""; if(z.img){ try{ bild = `<div class="qimg">${imgSvg(z.img)}</div>`; }catch(e){} }
  return `<div class="dg dg-spiel">${kopf(wahlText())}
    <div class="dg-stand">${aktiv().map((sp, i) => `<div class="dg-sk${wer === i ? " dran" : ""}" style="--f1:${FARBE[i][0]}">${avBild(sp.av)}<small>${h(name(i))}</small><b>${G.punkte[i]}</b></div>`).join("")}</div>
    <div class="dg-dran" style="--f1:${FARBE[wer][0]};--f2:${FARBE[wer][1]}">${avBild(aktiv()[wer].av)}<b>${h(name(wer))} ist dran</b><span>${Math.floor(G.nr / G.zahl) + 1}/${proKind}</span></div>
    <div class="dg-balken"><i style="width:${G.nr / G.zuege.length * 100}%"></i></div>
    <div class="card dg-karte">
      <span class="dg-titel">⚔️ FRAGE ${G.nr + 1} VON ${G.zuege.length}</span>
      ${bild}<h2 class="question dg-frage">${h(z.q)}</h2>
      <div class="answers">${z.opts.map((o, i) => { let cls = ""; if(fertig){ if(i === z.c) cls = " right"; else if(G.gewaehlt === i) cls = " wrong"; }
        return `<button type="button" class="ans${cls}" data-ant="${i}" ${fertig ? "disabled" : ""}><span class="key">${"ABCD"[i]}</span><span>${h(o)}</span></button>`; }).join("")}</div>
      ${fertig && z.m ? `<p class="dg-merk">💡 ${h(z.m)}</p>` : ""}
    </div>
    ${fertig ? `<button type="button" class="dg-los" data-dg="weiter">${G.nr + 1 >= G.zuege.length ? "Ergebnis zeigen 🏆" : "Weiter zu " + h(name((G.nr + 1) % G.zahl))}</button>` : ""}
  </div>`;
}
function endeHTML(){
  const p = G.punkte.slice(0, G.zahl), platz = i => p.filter(x => x > p[i]).length;
  const rang = aktiv().map((_, i) => i).sort((a, b) => p[b] - p[a]);
  const oben = rang.slice(0, 3), treppe = oben.length === 3 ? [oben[1], oben[0], oben[2]] : [oben[1], oben[0]];
  const alleGleich = rang.every(i => p[i] === p[rang[0]]);
  const sieger = rang.filter(i => platz(i) === 0).map(name);
  const titel = alleGleich ? "Unentschieden!" : sieger.length > 1 ? `${sieger.slice(0, -1).join(", ")} und ${sieger[sieger.length - 1]} gewinnen!` : `${sieger[0]} gewinnt!`;
  const proKind = Math.max(1, G.zuege.length / G.zahl);
  return `<div class="dg dg-ende">${kopf("")}
    <h2 class="dg-sieg">${h(titel)}</h2>
    <div class="dg-treppe">${treppe.map(i => { const pl = platz(i);
      return `<div class="dg-tsp"><span class="dg-tav${pl === 0 ? " erst" : ""}">${avBild(aktiv()[i].av)}</span><b>${h(name(i))}</b>
        <div class="dg-stufe" style="--f1:${FARBE[i][0]};--f2:${FARBE[i][1]};height:${[96, 72, 56][Math.min(pl, 2)]}px"><span>${MEDAILLE[Math.min(pl, 3)]}</span><b>${p[i]}</b></div></div>`; }).join("")}</div>
    ${G.zahl === 4 ? `<div class="dg-vierter">${avBild(aktiv()[rang[3]].av)}<b>${platz(rang[3]) + 1}. ${h(name(rang[3]))}</b><span>${p[rang[3]]} richtig</span></div>` : ""}
    <p class="dg-text">${proKind} Fragen pro Spieler · ${h(wahlText())}</p>
    <button type="button" class="dg-los" data-dg="los">Nochmals spielen</button>
    <button type="button" class="dg-zweit" data-dg="aendern">Spieler oder Thema ändern</button>
    ${alleGleich ? "" : `<div class="pkonfetti dukonf" aria-hidden="true">${Array.from({length:30}, (_, i) => `<i style="--x:${(i * 37) % 100}%;--d:${(i % 9) * .4}s;--c:${["#FFD34D","#FF6FA8","#7FD1FF","#7BE07B","#B98CFF"][i % 5]}"></i>`).join("")}</div>`}
  </div>`;
}

/* ---------- Zeichnen und Knöpfe ---------- */
function binden(app){
  app.querySelectorAll("[data-dg]").forEach(b => b.onclick = () => { const a = b.dataset.dg;
    if(a === "zu"){ if(G.phase === "spiel" && !confirm("Duell wirklich abbrechen?")) return; G.phase = "start"; go("duell"); }
    else if(a === "los") starten();
    else if(a === "weiter") weiter();
    else if(a === "aendern"){ G.phase = "start"; zeichnen(); } });
  app.querySelectorAll("[data-zahl]").forEach(b => b.onclick = () => { G.zahl = +b.dataset.zahl; merken(); zeichnen(); });
  app.querySelectorAll("[data-runden]").forEach(b => b.onclick = () => { G.runden = +b.dataset.runden; merken(); zeichnen(); });
  app.querySelectorAll("[data-plus]").forEach(b => b.onclick = () => { G.runden = Math.max(1, Math.min(MAX, G.runden + +b.dataset.plus)); merken(); zeichnen(); });
  const r = app.querySelector("#dgRegler");
  if(r){ const neu = () => { G.runden = +r.value; r.style.setProperty("--p", (G.runden - 1) / (MAX - 1) * 100 + "%"); const g = app.querySelector(".dg-griff"); if(g){ g.textContent = G.runden; g.style.left = r.style.getPropertyValue("--p"); }
      app.querySelectorAll("[data-runden]").forEach(x => { const an = +x.dataset.runden === G.runden; x.classList.toggle("an", an); x.setAttribute("aria-pressed", an); });
      const l = app.querySelector('[data-dg="los"]'); if(l) l.textContent = `Los geht’s · ${G.runden * G.zahl} Fragen`; };
    r.oninput = neu; r.onchange = () => { neu(); merken(); }; }
  app.querySelectorAll("[data-av]").forEach(b => b.onclick = () => { const i = +b.dataset.av, l = avListe(), sp = G.spieler[i]; sp.av = l[(l.indexOf(sp.av) + 1) % l.length]; merken(); zeichnen(); });
  app.querySelectorAll("[data-name]").forEach(inp => { inp.oninput = () => { G.spieler[+inp.dataset.name].name = inp.value.slice(0, 16); }; inp.onchange = merken; });
  app.querySelectorAll("[data-bereich]").forEach(b => b.onclick = () => { G.wahl = {art:"bereich", b:b.dataset.bereich}; G.themenAuf = false; merken(); zeichnen(); });
  app.querySelectorAll("[data-mix]").forEach(b => b.onclick = () => { G.wahl = {art:"mix"}; G.themenAuf = false; merken(); zeichnen(); });
  app.querySelectorAll("[data-themen]").forEach(b => b.onclick = () => { G.themenAuf = !G.themenAuf; zeichnen(); });
  app.querySelectorAll("[data-thema]").forEach(b => b.onclick = () => { G.wahl = {art:"thema", t:b.dataset.thema}; G.themenAuf = false; merken(); zeichnen(); });
  app.querySelectorAll("[data-ant]").forEach(b => b.onclick = () => waehle(+b.dataset.ant));
}
function zeichnen(){
  const app = document.getElementById("app"); if(!app) return;
  if(G.phase === "spiel" && !G.zuege[G.nr]) G.phase = "start";
  app.innerHTML = G.phase === "spiel" ? spielHTML() : G.phase === "ende" ? endeHTML() : startHTML();
  binden(app);
  const appAn = !!(window.EP_APP && window.EP_APP.an());
  document.body.classList.toggle("ep-app", appAn);
  document.body.classList.remove("ep-home");
  document.body.classList.toggle("ep-ohne", appAn && G.phase === "spiel");
  [...document.body.classList].filter(k => k.startsWith("ep-s-")).forEach(k => document.body.classList.remove(k));
  if(appAn) document.body.classList.add("ep-s-" + SEITE);
  document.documentElement.classList.toggle("dg-an", true);
  const tabs = document.getElementById("epTabs");
  if(tabs) tabs.querySelectorAll("[data-tab]").forEach(b => { if(b.dataset.tab === "duell") b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
}

/* Eigene Seite in render einhängen; im Duell-Menü «Auf einem Gerät» hierher umleiten */
const vorRender = window.render;
window.render = function(){
  if(typeof S !== "undefined" && S.screen === SEITE){ try{ renderNav(); }catch(e){} zeichnen(); return; }
  document.documentElement.classList.remove("dg-an");
  const r = vorRender.apply(this, arguments);
  try{ if(S.screen === "duell"){ const b = document.getElementById("duSplit"); if(b && !b.dataset.dg){ b.dataset.dg = "1";
      const sm = b.querySelector("small"); if(sm) sm.textContent = "2 bis 4 Kinder, abwechselnd auf einem Gerät, ohne Internet.";
      b.onclick = e => { e.preventDefault(); e.stopPropagation(); G.phase = "start"; go(SEITE); }; } } }catch(e){}
  return r;
};
window.EP_DUELL_GERAET = { oeffnen(){ G.phase = "start"; go(SEITE); } };

/* ---------- Stil (Qeels-Duell) ---------- */
const css = document.createElement("style"); css.id = "ep-duellgeraet";
const A = "html.dg-an body #app";
css.textContent = `
${A} > .dg{display:flex;flex-direction:column;gap:9px;max-width:560px;margin:0 auto;padding:0 2px 12px;box-sizing:border-box;color:#fff;font-family:"Lexend","Fredoka",system-ui,sans-serif}
${A} .dg-kopf{display:flex;align-items:center;gap:10px;margin:2px 0}
${A} .dg-kopf h1{margin:0;font:900 24px/1.05 "Lexend","Fredoka",system-ui,sans-serif;color:#fff;text-shadow:0 1.5px 3px rgba(0,0,0,.35)}
${A} .dg-kopf small{display:block;font:800 12px "Lexend",system-ui,sans-serif;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.35)}
${A} .dg-kic{width:36px;height:36px;object-fit:contain;pointer-events:none}
${A} .dg-zu{width:42px;height:42px;border-radius:50%;border:2px solid rgba(255,255,255,.55);background:linear-gradient(180deg,#5BE38A,#22B35C);color:#fff;font:900 20px/1 system-ui;cursor:pointer;box-shadow:0 4px 0 #13874A;flex:none}
${A} .dg-text{margin:0;font:800 13px/1.4 "Lexend",system-ui,sans-serif;text-align:center;color:#fff;text-shadow:0 1.5px 3px rgba(0,0,0,.35)}
${A} .dg-lbl{margin:4px 0 0;font:900 11px "Lexend",system-ui,sans-serif;letter-spacing:.11em;color:#fff;text-shadow:0 1.5px 3px rgba(0,0,0,.35)}
${A} .dg-reihe{display:flex;gap:6px}
${A} .dg-wahl{flex:1 1 0;min-width:0;min-height:40px;position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:6px 6px;border-radius:14px;cursor:pointer;
  background:linear-gradient(180deg,rgba(52,36,140,.86),rgba(30,20,96,.92));border:2px solid rgba(255,255,255,.28);color:#fff;font:900 13px/1.15 "Lexend",system-ui,sans-serif;text-shadow:0 1.5px 3px rgba(0,0,0,.35);transition:transform .1s}
${A} .dg-wahl::before{content:"";position:absolute;left:6px;right:6px;top:1px;height:45%;border-radius:14px;background:linear-gradient(180deg,rgba(255,255,255,.4),rgba(255,255,255,0));pointer-events:none}
${A} .dg-wahl.an{background:linear-gradient(180deg,#FFE27A,#FFC21F 60%,#F59E0B);border-color:#FFF3B0;color:#4A2A00;text-shadow:none;box-shadow:0 0 12px rgba(255,194,31,.7)}
${A} .dg-wahl:active,${A} .dg-kachel:active,${A} .dg-thema:active{transform:scale(.95)}
${A} .dg-wahl img{width:24px;height:24px;object-fit:contain;pointer-events:none}
${A} .dg-tic{display:inline-grid;place-items:center;width:22px;height:22px;flex:none}
${A} .dg-tic .ic,${A} .dg-tic img{width:22px!important;height:22px!important;font-size:18px!important;margin:0!important}
${A} .dg-spieler{display:flex;flex-direction:column;gap:6px}
${A} .dg-sp{display:flex;align-items:center;gap:10px;border-radius:16px;padding:6px;background:linear-gradient(135deg,var(--f1),var(--f2))}
${A} .dg-av{position:relative;width:42px;height:42px;border-radius:50%;border:3px solid rgba(255,255,255,.85);background:rgba(0,0,0,.15);padding:0;cursor:pointer;flex:none;overflow:visible}
${A} .dg-av > img,${A} .dg-av > svg{width:100%;height:100%;border-radius:50%;object-fit:cover;display:block}
${A} .dg-av i{position:absolute;right:-5px;bottom:-5px;width:19px;height:19px;border-radius:50%;background:#fff;color:#2A1F5C;font:900 11px/19px system-ui;font-style:normal;text-align:center}
${A} .dg-name{flex:1;min-width:0;box-sizing:border-box;border:0;border-radius:10px;background:rgba(0,0,0,.15);color:#fff;font:900 16px "Lexend",system-ui,sans-serif;padding:8px 10px;outline:none}
${A} .dg-name:focus{background:rgba(0,0,0,.25);box-shadow:0 0 0 2px rgba(255,255,255,.6)}
${A} .dg-regler{display:flex;align-items:center;gap:10px}
${A} .dg-plus{width:34px;height:34px;border-radius:50%;flex:none;background:rgba(30,20,96,.85);border:2px solid rgba(255,255,255,.28);color:#fff;font:900 18px/1 system-ui;cursor:pointer}
${A} .dg-bahn{position:relative;flex:1;height:40px;display:flex;align-items:center}
${A} .dg-bahn input{-webkit-appearance:none;appearance:none;width:100%;height:10px;margin:0;border-radius:5px;border:1px solid rgba(255,255,255,.3);outline:none;cursor:pointer;
  background:linear-gradient(90deg,#FFE27A,#FFC21F) 0/var(--p) 100% no-repeat,rgba(30,20,96,.75)}
${A} .dg-bahn input::-webkit-slider-thumb{-webkit-appearance:none;width:36px;height:36px;border-radius:50%;background:transparent;border:0}
${A} .dg-bahn input::-moz-range-thumb{width:36px;height:36px;border-radius:50%;background:transparent;border:0}
${A} .dg-griff{position:absolute;top:2px;width:36px;height:36px;margin-left:-18px;border-radius:50%;background:#fff;border:3px solid #FFC21F;box-sizing:border-box;display:grid;place-items:center;color:#4A2A00;font:900 12px "Lexend",system-ui;box-shadow:0 2px 4px rgba(0,0,0,.3);pointer-events:none}
${A} .dg-raster{display:grid;grid-template-columns:1fr 1fr;gap:6px}
${A} .dg-kachel{position:relative;aspect-ratio:900/430;border-radius:14px;border:3px solid transparent;padding:8px;cursor:pointer;background:center/100% 100% no-repeat;text-align:left;display:flex;align-items:flex-start;transition:transform .1s}
${A} .dg-kachel::before,${A} .dg-kachel::after{display:none!important;content:none!important}
${A} .dg-kachel{aspect-ratio:900/515!important;overflow:visible}
${A} .dg-kachel span{position:relative;z-index:1;display:block;padding:2px 0 0 4px;max-width:70%;color:#fff;font:900 13px/1.2 "Lexend",system-ui,sans-serif;text-shadow:0 1.5px 3px rgba(0,0,0,.35)}
${A} .dg-kachel.an{border-color:#FFD43B;box-shadow:0 0 14px rgba(255,194,31,.9)}
${A} .dg-haken{position:absolute;right:-7px;top:-7px;width:26px;height:26px;border-radius:50%;background:#FFD43B;border:2px solid #fff;color:#4A2A00;font:900 14px/22px system-ui;font-style:normal;text-align:center}
${A} .dg-themen{display:flex;flex-wrap:wrap;gap:6px;padding:10px;border-radius:18px;background:rgba(20,12,70,.55);border:1px solid rgba(255,255,255,.18)}
${A} .dg-thema{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;cursor:pointer;border:2px solid rgba(255,255,255,.35);color:#fff;font:800 13px "Lexend",system-ui,sans-serif;text-shadow:0 1.5px 3px rgba(0,0,0,.35);
  background:linear-gradient(135deg,color-mix(in srgb,var(--c) 80%,#fff),var(--c));max-width:100%}
${A} .dg-thema.an{border-color:#FFD43B}
${A} .dg-fehler{margin:0;color:#FFB4B4;font:800 14px "Lexend",system-ui;text-align:center;text-shadow:0 1px 2px rgba(0,0,0,.5)}
${A} .dg-unten{position:sticky;bottom:calc(env(safe-area-inset-bottom) + 8px);z-index:3;padding-top:6px}
${A} .dg-los{width:100%;box-sizing:border-box;min-height:48px;border:0;border-bottom:4px solid #C99A00;border-radius:999px;background:#FFD43B;color:#2A1F5C;font:900 16px "Lexend",system-ui,sans-serif;cursor:pointer;padding:11px 16px;transition:transform .1s}
${A} .dg-los:active{transform:translateY(3px)}
${A} .dg-zweit{align-self:center;border:0;border-radius:999px;background:rgba(30,20,96,.78);color:#fff;font:800 15px "Lexend",system-ui;padding:10px 18px;cursor:pointer}
/* Spiel */
${A} .dg-stand{display:flex;gap:8px}
${A} .dg-sk{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;border-radius:14px;padding:5px 4px;background:rgba(30,20,96,.75);border:2px solid transparent;opacity:.72}
${A} .dg-sk.dran{opacity:1;border-color:var(--f1);background:rgba(52,36,140,.92)}
${A} .dg-sk > img,${A} .dg-sk > svg{width:28px;height:28px;border-radius:50%;object-fit:cover}
${A} .dg-sk small{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:800 11px "Lexend",system-ui;margin-top:2px}
${A} .dg-sk b{font:900 19px/1.1 "Lexend",system-ui}
${A} .dg-dran{display:flex;align-items:center;gap:8px;border-radius:14px;padding:5px 12px 5px 5px;background:linear-gradient(90deg,var(--f1),var(--f2))}
${A} .dg-dran > img,${A} .dg-dran > svg{width:32px;height:32px;border-radius:50%;border:2px solid #fff;object-fit:cover;flex:none}
${A} .dg-dran b{flex:1;min-width:0;font:900 15px "Lexend",system-ui;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
${A} .dg-dran span{font:900 14px "Lexend",system-ui;opacity:.9}
${A} .dg-balken{height:6px;border-radius:3px;background:rgba(30,20,96,.5);overflow:hidden}
${A} .dg-balken i{display:block;height:100%;background:#FFD43B;transition:width .4s}
${A} .card.dg-karte{background:linear-gradient(155deg,#FF5FA2 0%,#7C3AED 50%,#2563EB 100%)!important;border:1px solid rgba(255,255,255,.3)!important;border-radius:24px!important;padding:10px 12px 12px!important;margin:0!important;box-shadow:0 18px 34px -18px rgba(60,20,140,.75)!important;color:#fff}
${A} .card.dg-karte::before,${A} .card.dg-karte::after{display:none!important}
${A} .dg-titel{display:block;margin:6px 6px 0;color:#FFE4F1;font:900 12px "Lexend",system-ui;letter-spacing:.05em}
${A} .dg-karte .answers{gap:8px!important}
${A} .dg-karte .answers .ans[disabled]:not(.right):not(.wrong){opacity:.4!important}
${A} .dg-merk{margin:10px 4px 0;padding:8px 12px;border-radius:14px;background:rgba(20,10,70,.35);border:1px solid rgba(255,255,255,.25);font:700 13px/1.4 "Lexend",system-ui}
/* Treppchen */
${A} .dg-sieg{margin:6px 0 0;text-align:center;font:900 26px/1.15 "Lexend",system-ui;color:#fff;text-shadow:0 2px 4px rgba(0,0,0,.35)}
${A} .dg-treppe{display:flex;align-items:flex-end;justify-content:center;gap:10px;margin-top:10px}
${A} .dg-tsp{flex:1;max-width:130px;display:flex;flex-direction:column;align-items:center}
${A} .dg-tav{width:52px;height:52px;border-radius:50%;border:3px solid #fff;overflow:hidden;margin-bottom:4px;display:block}
${A} .dg-tav.erst{width:66px;height:66px;border-color:#FFD43B}
${A} .dg-tav > img,${A} .dg-tav > svg{width:100%;height:100%;object-fit:cover;display:block}
${A} .dg-tsp > b{font:900 14px "Lexend",system-ui;margin-bottom:6px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
${A} .dg-stufe{width:100%;border-radius:16px 16px 0 0;background:linear-gradient(180deg,var(--f1),var(--f2));display:flex;flex-direction:column;align-items:center;justify-content:center}
${A} .dg-stufe span{font-size:26px;line-height:1}
${A} .dg-stufe b{font:900 22px "Lexend",system-ui}
${A} .dg-vierter{display:flex;align-items:center;gap:10px;background:rgba(30,20,96,.75);border-radius:16px;padding:10px}
${A} .dg-vierter > img,${A} .dg-vierter > svg{width:28px;height:28px;border-radius:50%}
${A} .dg-vierter b{flex:1;font:800 14px "Lexend",system-ui}
${A} .dg-vierter span{font:800 13px "Lexend",system-ui}
/* App-Ansicht: Platz für die Tab-Leiste, iPad grösser */
html.dg-an body.ep-app #app > .dg-start{padding-bottom:calc(84px + env(safe-area-inset-bottom))}
html.dg-an body.ep-app #app > .dg-start .dg-unten{bottom:calc(84px + env(safe-area-inset-bottom))}
@media (min-width:700px){ ${A} > .dg{max-width:640px;gap:12px} ${A} .dg-kopf h1{font-size:30px} ${A} .dg-wahl{min-height:48px;font-size:15px} `;
document.head.appendChild(css);
try{ if(S.screen === SEITE) render(); }catch(e){}
})();
