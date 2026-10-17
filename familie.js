/* easyplay Welt «Familien-Quiz» (x-familie)
   2 bis 4 Personen spielen reihum auf EINEM Gerät (Hot-Seat). Jede Person hat ihre eigene Stufe
   (Entdecker, Könner, Profis oder Alle), damit Kinder und Eltern fair gegeneinander spielen.
   Optional Team-Modus: alle gemeinsam gegen die Uhr, eine Antwort pro Frage.
   Speicher: sessionStorage ep-x-familie-spiel (laufendes Spiel), ep-x-familie-offen (Seite war offen beim Neuladen);
             localStorage ep-x-familie-letzte (letzte Aufstellung), ep-x-familie-best (Bestwerte), ep-x-familie-xp (XP-Tageszähler).
   API: window.EP_FAMILIE = { laeuft(), stand(), bestwerte(), neu(), beenden() } */
(function(){
"use strict";
if(!window.EP_EXTRAS) return;
const X = window.EP_EXTRAS, A = X.api;
const h = s => A.h(s);
const KIDS = "img/kids/";

const K_SPIEL = "ep-x-familie-spiel", K_OFFEN = "ep-x-familie-offen";
const K_LETZTE = "ep-x-familie-letzte", K_BEST = "ep-x-familie-best", K_XP = "ep-x-familie-xp";
const SS = {
  get(k){ try{ const v = sessionStorage.getItem(k); return v ? JSON.parse(v) : null; }catch(e){ return null; } },
  set(k, v){ try{ if(v == null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};

/* ---------- Daten ---------- */
const FIG = [
  {id:"lumi", n:"Lumi", bild:"m1.webp", bereit:"m3.webp", jubel:"m5.webp", c:"#E0479E"},
  {id:"milo", n:"Milo", bild:"j1.webp", bereit:"j3.webp", jubel:"j5.webp", c:"#3A7BEA"},
  {id:"leni", n:"Leni", bild:"leni.webp", bereit:"leni-winken.webp", jubel:"leni-jubel.webp", c:"#E8364F"},
  {id:"ben",  n:"Ben",  bild:"ben.webp",  bereit:"ben-winken.webp",  jubel:"ben-jubel.webp",  c:"#12A57F"}
];
const FARBEN = ["#F08A24", "#7B61FF", "#0F9FB5", "#D9488B"];
const STUFEN = [
  {id:1, n:"Entdecker", k:"bis 9 Jahre", e:"🌱"},
  {id:2, n:"Könner", k:"10 bis 14 Jahre", e:"🚀"},
  {id:3, n:"Profis", k:"ab 15 Jahre", e:"🎓"},
  {id:0, n:"Alle", k:"gemischt", e:"🎲"}
];
const BEMO = {welt:"🌍", natur:"🔬", geld:"🏔️", alltag:"🚲"};
const stufeVon = id => STUFEN.find(s => s.id === id) || STUFEN[3];
const figVon = id => FIG.find(f => f.id === id) || null;
const bereiche = () => { try{ return BEREICHE.map(b => ({id:b.id, n:b.name, kurz:String(b.name).split(/[ ,&]/)[0], e:BEMO[b.id] || "📚"})); }catch(e){ return []; } };
const ZEIT_R = [0, 20, 40], ZEIT_T = [30, 45, 60];

/* ---------- Aufstellung (Einstellungen vor dem Spiel) ---------- */
function startAufstellung(){
  const l = A.LS.get(K_LETZTE, null);
  if(l && Array.isArray(l.spieler) && l.spieler.length >= 2) return normE(l);
  let name1 = ""; try{ const p = A.profil(); if(p && p.name) name1 = String(p.name).slice(0, 14); }catch(e){}
  return normE({spieler:[{name:name1, fig:"lumi", stufe:A.stufe() || 1}, {name:"", fig:"milo", stufe:3}]});
}
function normE(e){
  const sp = (Array.isArray(e.spieler) ? e.spieler : []).slice(0, 4).map((s, i) => ({
    name:String(s.name || "").slice(0, 14), fig:figVon(s.fig) ? s.fig : "", stufe:[0, 1, 2, 3].includes(s.stufe) ? s.stufe : 1, farbe:FARBEN[i % 4]}));
  while(sp.length < 2) sp.push({name:"", fig:"", stufe:1, farbe:FARBEN[sp.length]});
  return {spieler:sp, modus:e.modus === "team" ? "team" : "reihum", runden:[5, 10, 15].includes(e.runden) ? e.runden : 5,
    bereich:e.bereich && (e.bereich === "mix" || bereiche().some(b => b.id === e.bereich)) ? e.bereich : "mix",
    zeit:ZEIT_R.includes(e.zeit) ? e.zeit : 0, tzeit:ZEIT_T.includes(e.tzeit) ? e.tzeit : 45};
}
let E = null;
const speichereE = () => { try{ A.LS.set(K_LETZTE, E); }catch(e){} };

/* ---------- Fragen ---------- */
const POOLS = new Map();
function pool(stufe, bereich){
  const key = stufe + "|" + bereich;
  if(POOLS.has(key)) return POOLS.get(key);
  let l = [];
  try{
    l = A.fragen(f => !f.img && typeof f.q === "string" && f.q.length <= 170 && !/(auf dem Bild|im Bild|Abbildung)/i.test(f.q)
      && f.a.every(x => typeof x === "string" && x.length <= 80)
      && (!stufe || f.l === stufe)
      && (bereich === "mix" || (THEMA[f.t] && THEMA[f.t].bereich && THEMA[f.t].bereich.id === bereich)));
  }catch(e){ l = []; }
  POOLS.set(key, l);
  return l;
}
function mischen(a){ a = a.slice(); for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function zieheFrage(stufe, bereich, used){
  const set = new Set(used);
  let l = pool(stufe, bereich);
  if(l.length < 5) l = pool(stufe, "mix");
  if(!l.length) l = pool(0, "mix");
  let f = null;
  for(let i = 0; i < 60 && !f; i++){ const x = l[Math.floor(Math.random() * l.length)]; if(x && !set.has(x.q)) f = x; }
  if(!f) f = l.find(x => !set.has(x.q)) || l[0];
  if(!f) return null;
  const reihe = mischen([0, 1, 2, 3]);
  return {q:f.q, o:reihe.map(i => f.a[i]), k:reihe.indexOf(0), e:String(f.e || ""), t:f.t, l:f.l};
}

/* ---------- Spielzustand (sessionStorage) ---------- */
let G = SS.get(K_SPIEL);
if(G && (!Array.isArray(G.sp) || !G.phase)) G = null;
const speichern = () => SS.set(K_SPIEL, G);

function neuesSpiel(e, altUsed){
  const namen = {};
  const sp = e.spieler.map((s, i) => {
    let n = String(s.name || "").trim() || (figVon(s.fig) ? figVon(s.fig).n : "Person " + (i + 1));
    const key = n.toLowerCase(); if(namen[key]){ namen[key]++; n = n + " " + namen[key]; } else namen[key] = 1;
    return {name:n, fig:s.fig, stufe:s.stufe, farbe:s.farbe || FARBEN[i], pkt:0, ok:0, serie:0, best:0};
  });
  G = {id:Date.now().toString(36), modus:e.modus, runden:e.runden, bereich:e.bereich,
    zeit:e.modus === "team" ? e.tzeit : e.zeit, sp, team:{pkt:0, ok:0, serie:0, best:0},
    phase:"bereit", runde:0, zug:0, nr:0, fr:null, wahl:null, frist:null, plus:0, bonus:0,
    used:(altUsed || []).slice(-300), xp:false, xpPlus:0, rekord:false, endeDone:false, pause:false, restMs:null};
  speichern();
}
const proRunde = () => G.sp.length;
const gesamt = () => G.runden * proRunde();
const aktSp = () => G.sp[G.zug] || G.sp[0];

function frageStellen(){
  G.fr = zieheFrage(aktSp().stufe, G.bereich, G.used);
  if(G.fr) G.used.push(G.fr.q);
  G.wahl = null; G.plus = 0; G.bonus = 0; G.restMs = null;
  G.frist = G.zeit ? Date.now() + G.zeit * 1000 : null;
  G.phase = "frage"; G.pause = false;
  speichern();
}
function antworten(i){
  if(!G || G.phase !== "frage" || !G.fr || G.pause) return;
  stopTimer();
  G.wahl = i;
  const ok = i === G.fr.k, s = aktSp();
  const z = G.modus === "team" ? G.team : s;     // wer die Punkte bekommt
  if(ok){
    z.ok++; if(z !== s) s.ok++;
    z.serie++; z.best = Math.max(z.best, z.serie);
    G.plus = 10; G.bonus = z.serie >= 5 ? 10 : z.serie >= 3 ? 5 : 0;
    z.pkt += G.plus + G.bonus;
    A.ton("richtig");
  }else{
    z.serie = 0; G.plus = 0; G.bonus = 0;
    A.ton("falsch");
  }
  G.nr++;
  G.phase = "antwort";
  speichern(); zeichne();
}
function weiter(){
  if(!G) return;
  A.ton("klick");
  if(G.phase === "bereit"){ frageStellen(); zeichne(true); return; }
  if(G.phase === "antwort"){
    if(G.zug < proRunde() - 1){
      G.zug++;
      if(G.modus === "team") frageStellen(); else G.phase = "bereit";
    }else if(G.runde >= G.runden - 1){ G.phase = "ende"; spielEnde(); }
    else G.phase = "zwischen";
    speichern(); zeichne(true); return;
  }
  if(G.phase === "zwischen"){ G.runde++; G.zug = 0; G.phase = "bereit"; speichern(); zeichne(true); }
}

/* ---------- Ende, Bestwerte, XP ---------- */
function rangliste(){
  const l = G.sp.map((s, i) => ({...s, i})).sort((a, b) => b.pkt - a.pkt || b.ok - a.ok);
  l.forEach(s => { s.rang = 1 + l.filter(x => x.pkt > s.pkt || (x.pkt === s.pkt && x.ok > s.ok)).length; });
  return l;
}
function bestwerte(){ const b = A.LS.get(K_BEST, null); return b && typeof b === "object" ? b : {spiele:0, hoch:null, team:null, namen:{}}; }
function spielEnde(){
  if(G.endeDone) return;
  G.endeDone = true;
  const b = bestwerte(); b.spiele = (b.spiele || 0) + 1; b.namen = b.namen || {};
  if(G.modus === "team"){
    const t = G.team;
    if(t.pkt > 0 && (!b.team || t.pkt > b.team.pkt)){ b.team = {pkt:t.pkt, ok:t.ok, total:gesamt(), tag:A.heute()}; G.rekord = true; }
  }else{
    const r = rangliste();
    r.forEach(s => { const k = s.name.toLowerCase(); const n = b.namen[k] || {name:s.name, pkt:0, siege:0};
      n.name = s.name; n.pkt = Math.max(n.pkt || 0, s.pkt); if(s.rang === 1 && s.pkt > 0) n.siege = (n.siege || 0) + 1; b.namen[k] = n; });
    const top = r[0];
    if(top && top.pkt > 0 && (!b.hoch || top.pkt > b.hoch.pkt)){ b.hoch = {name:top.name, pkt:top.pkt, tag:A.heute()}; G.rekord = true; }
  }
  const nk = Object.keys(b.namen);
  if(nk.length > 30) nk.sort((x, y) => (b.namen[y].pkt || 0) - (b.namen[x].pkt || 0)).slice(30).forEach(k => delete b.namen[k]);
  A.LS.set(K_BEST, b);
  /* XP nur für das angemeldete Profil, einmal pro Spiel, höchstens 3 Spiele pro Tag, erst ab 5 beantworteten Fragen */
  if(!G.xp && G.nr >= 5){
    G.xp = true;
    let p = null; try{ p = A.profil(); }catch(e){}
    const z = A.LS.get(K_XP, {tag:"", n:0}), t = A.heute(); if(z.tag !== t){ z.tag = t; z.n = 0; }
    if(p && z.n < 3){ const n = A.xp(10); if(n){ z.n++; A.LS.set(K_XP, z); G.xpPlus = n; } }
  }
  speichern();
  setTimeout(() => { A.ton("fanfare"); konfetti(); }, 250);
}
function konfetti(){
  if(A.ruhig()) return;
  try{
    const d = document.createElement("div"); d.className = "fq-konf"; d.setAttribute("aria-hidden", "true");
    const c = ["#FFE34D", "#FF6FB5", "#4DB8FF", "#3DDC97", "#FF9F43", "#A98BFF"];
    let s = "";
    for(let i = 0; i < 90; i++) s += `<i style="left:${(Math.random() * 100).toFixed(1)}%;background:${c[i % c.length]};animation-delay:${(Math.random() * .9).toFixed(2)}s;animation-duration:${(2.2 + Math.random() * 1.6).toFixed(2)}s"></i>`;
    d.innerHTML = s; document.body.appendChild(d); setTimeout(() => d.remove(), 4600);
  }catch(e){}
}

/* ---------- Zeitbalken ---------- */
let tmr = 0, tickLetzt = -1;
function stopTimer(){ if(tmr){ clearInterval(tmr); tmr = 0; } }
function startTimer(){
  stopTimer();
  if(!G || G.phase !== "frage" || !G.frist || G.pause) return;
  const lauf = () => {
    if(!G || G.phase !== "frage" || !G.frist || G.pause || (typeof S !== "undefined" && S.screen !== "x-familie")){ stopTimer(); return; }
    const rest = G.frist - Date.now(), anteil = Math.max(0, Math.min(1, rest / (G.zeit * 1000)));
    const bar = document.querySelector(".fq-zeit i"), txt = document.querySelector(".fq-zeit b");
    const sek = Math.max(0, Math.ceil(rest / 1000));
    if(bar){ bar.style.width = (anteil * 100).toFixed(1) + "%"; bar.parentNode.classList.toggle("knapp", sek <= 5); }
    if(txt) txt.textContent = sek + " s";
    if(sek <= 3 && sek > 0 && sek !== tickLetzt){ tickLetzt = sek; A.ton("tick"); }
    if(rest <= 0) antworten(-1);
  };
  lauf(); if(G && G.phase === "frage") tmr = setInterval(lauf, 200);
}
function pauseUmschalten(an){
  if(!G) return;
  if(an){ if(G.pause) return; G.pause = true; if(G.frist && G.phase === "frage") G.restMs = Math.max(0, G.frist - Date.now()); }
  else{ G.pause = false; if(G.frist && G.restMs != null) G.frist = Date.now() + G.restMs; G.restMs = null; }
  speichern(); zeichne();
}

/* ---------- Darstellung ---------- */
let BOX = null;
function av(s, gross){
  const f = figVon(s.fig);
  const cls = "fq-av" + (gross ? " gross" : "");
  if(f) return `<span class="${cls}" style="--fc:${f.c}"><img src="${KIDS}${gross ? f.bereit : f.bild}" alt="" decoding="async"></span>`;
  return `<span class="${cls} ini" style="--fc:${s.farbe || "#7B61FF"}" aria-hidden="true">${h(String(s.name || "?").trim().charAt(0).toUpperCase() || "?")}</span>`;
}
const stufePill = id => { const s = stufeVon(id); return `<span class="fq-stufe">${s.e} ${h(s.n)}</span>`; };

function setupHTML(){
  const b = bestwerte(), bs = bereiche(), team = E.modus === "team";
  const seg = (name, opts, wert, label) => `<div class="fq-zeile"><span class="fq-lbl" id="fq-l-${name}">${label}</span><div class="fq-seg" role="radiogroup" aria-labelledby="fq-l-${name}">${opts.map(o =>
    `<button type="button" role="radio" aria-checked="${o[0] === wert}" class="${o[0] === wert ? "an" : ""}" data-set="${name}" data-v="${h(String(o[0]))}"${o[2] ? ` title="${h(o[2])}" aria-label="${h(o[2])}"` : ""}>${o[1]}</button>`).join("")}</div></div>`;
  const rek = team ? (b.team ? `🏆 Team-Rekord: ${b.team.pkt} Punkte (${b.team.ok} von ${b.team.total} richtig)` : "")
                   : (b.hoch ? `🏆 Rekord: ${h(b.hoch.name)} mit ${b.hoch.pkt} Punkten` : "");
  return `<div class="fq fq-setup">
    <div class="fq-kopf"><span class="fq-kopf-emo" aria-hidden="true">👪</span><div><h1>Familien-Quiz</h1><p>2 bis 4 Personen, ein Gerät, reihum</p></div><img src="${KIDS}lb-karten.webp" alt=""></div>
    <div class="fq-setup-grid">
      <section class="fq-karte fq-leute" aria-label="Mitspielende">
        <h2>Wer spielt mit?</h2>
        <div class="fq-liste">${E.spieler.map((s, i) => `<div class="fq-person" style="--pc:${s.farbe}">
          <button type="button" class="fq-figwahl" data-fig="${i}" aria-label="Spielfigur für Person ${i + 1} wechseln, jetzt: ${h(figVon(s.fig) ? figVon(s.fig).n : "Anfangsbuchstabe")}">${av({...s, name:s.name || String(i + 1)})}</button>
          <input type="text" class="fq-name" data-name="${i}" maxlength="14" autocomplete="off" enterkeyhint="done" value="${h(s.name)}" placeholder="${h(figVon(s.fig) ? figVon(s.fig).n : "Name " + (i + 1))}" aria-label="Name von Person ${i + 1}">
          <select class="fq-sel" data-stufe="${i}" aria-label="Stufe von Person ${i + 1}">${STUFEN.map(st => `<option value="${st.id}"${st.id === s.stufe ? " selected" : ""}>${st.e} ${h(st.n)}</option>`).join("")}</select>
          ${E.spieler.length > 2 ? `<button type="button" class="fq-weg" data-weg="${i}" aria-label="Person ${i + 1} entfernen">✕</button>` : ""}
        </div>`).join("")}</div>
        ${E.spieler.length < 4 ? `<button type="button" class="fq-plus" data-add="1">＋ Person dazu</button>` : ""}
        <p class="fq-fair">⚖️ <b>Fair spielen:</b> Jede Person bekommt Fragen ihrer Stufe.<span class="fq-lang"> Kinder spielen zum Beispiel als Entdecker, Eltern als Profis. So hat jede Person eine echte Chance.</span><span class="fq-kurz"> Kinder als Entdecker, Eltern als Profis.</span></p>
      </section>
      <section class="fq-karte fq-optionen" aria-label="Einstellungen">
        <h2>Wie spielt ihr?</h2>
        ${seg("modus", [["reihum", "🔁 Reihum"], ["team", "🤝 Team"]], E.modus, "Modus")}
        ${seg("runden", [[5, "5"], [10, "10"], [15, "15"]], E.runden, team ? "Runden" : "Fragen pro Person")}
        ${seg("bereich", [["mix", `<span aria-hidden="true">🎲</span> <span>Alles</span>`, "Alle Themen gemischt"]].concat(bs.map(x => [x.id, `<span aria-hidden="true">${x.e}</span> <span>${h(x.kurz)}</span>`, x.n])), E.bereich, "Themen")}
        ${team ? seg("tzeit", ZEIT_T.map(z => [z, z + " s"]), E.tzeit, "Zeit pro Frage")
               : seg("zeit", ZEIT_R.map(z => [z, z ? z + " s" : "Aus"]), E.zeit, "Zeitbalken")}
        <p class="fq-info">${team ? "🤝 Alle beraten gemeinsam und geben eine Antwort pro Frage. Die Fragen wechseln reihum die Stufe." : "🔁 Jede Person beantwortet ihre eigene Frage. Richtig gibt 10 Punkte, ab 3 richtigen in Folge gibt es Bonus."}</p>
        ${rek ? `<p class="fq-rek">${rek}</p>` : ""}
        <button type="button" class="fq-start" data-start="1">▶ Spiel starten</button>
      </section>
    </div></div>`;
}

function kopfHTML(){
  const s = aktSp(), team = G.modus === "team", pkt = team ? G.team.pkt : s.pkt;
  return `<div class="fq-leiste">
    ${team ? `<span class="fq-wer"><span class="fq-team-av" aria-hidden="true">🤝</span><b>Team</b>${stufePill(s.stufe)}</span>`
           : `<span class="fq-wer" style="--pc:${s.farbe}">${av(s)}<b>${h(s.name)}</b>${stufePill(s.stufe)}</span>`}
    <span class="fq-runde">Runde ${G.runde + 1} von ${G.runden}</span>
    <span class="fq-pkt" aria-label="${pkt} Punkte">⭐ ${pkt}</span>
    <button type="button" class="fq-pause" data-pause="1" aria-label="Pause">⏸</button>
  </div>`;
}

function bereitHTML(){
  const s = aktSp(), f = figVon(s.fig);
  if(G.modus === "team") return `<div class="fq fq-bereit fq-spiel" style="--pc:#7B61FF">
    <div class="fq-bereit-karte">
      <p class="fq-klein">Runde ${G.runde + 1} von ${G.runden} · ${proRunde()} Fragen</p>
      <div class="fq-bereit-figs" aria-hidden="true">${G.sp.map(x => av(x)).join("")}</div>
      <h1>Alle zusammen!</h1>
      <p>Beratet euch und gebt gemeinsam eine Antwort. Ihr habt ${G.zeit} Sekunden pro Frage.</p>
      <button type="button" class="fq-gross" data-weiter="1">Los geht's!</button>
    </div></div>`;
  return `<div class="fq fq-bereit fq-spiel" style="--pc:${s.farbe}">
    <div class="fq-bereit-karte">
      <p class="fq-klein">Runde ${G.runde + 1} von ${G.runden}${G.runde === 0 && G.zug === 0 ? " · Das Spiel beginnt" : ""}</p>
      ${f ? `<img class="fq-bereit-fig" src="${KIDS}${f.bereit}" alt="">` : av(s, true)}
      <h1>Jetzt ist <span>${h(s.name)}</span> dran!</h1>
      <p>📱 Gib das Gerät an ${h(s.name)} weiter. ${stufePill(s.stufe)}</p>
      <button type="button" class="fq-gross" data-weiter="1">Ich bin bereit</button>
    </div></div>`;
}

function frageHTML(){
  const F = G.fr, beant = G.phase === "antwort", s = aktSp(), team = G.modus === "team";
  const ok = beant && G.wahl === F.k;
  let rueck = "";
  if(beant){
    const kurz = F.e.length > 240 ? F.e.slice(0, 236).replace(/\s+\S*$/, "") + " …" : F.e;
    const naechst = G.zug < proRunde() - 1 ? (team ? "Nächste Frage" : `Weiter zu ${h(G.sp[G.zug + 1].name)}`)
                  : G.runde >= G.runden - 1 ? "Zur Rangliste" : "Zum Zwischenstand";
    const titel = ok ? (team ? "Richtig, super Teamwork!" : `Richtig, ${h(s.name)}!`) : G.wahl === -1 ? "Die Zeit ist um." : "Knapp daneben.";
    const serie = team ? G.team.serie : s.serie;
    rueck = `<div class="fq-rueck ${ok ? "gut" : "naja"}" role="status">
      <div class="fq-rueck-kopf"><b>${ok ? "🎉" : "💡"} ${titel}</b>${ok ? `<span class="fq-plusp">+${G.plus}${G.bonus ? ` · Serie ${serie}: +${G.bonus} Bonus` : ""}</span>` : `<span class="fq-plusp">Richtig ist: ${h(F.o[F.k])}</span>`}</div>
      ${kurz ? `<p>${h(kurz)}</p>` : ""}
      <button type="button" class="fq-weiter" data-weiter="1">${naechst} →</button>
    </div>`;
  }
  return `<div class="fq fq-frage fq-spiel${beant ? " beant" : ""}" style="--pc:${team ? "#7B61FF" : s.farbe}">
    ${kopfHTML()}
    ${G.frist && !beant ? `<div class="fq-zeit" role="timer" aria-label="Verbleibende Zeit"><i></i><b>${G.zeit} s</b></div>` : ""}
    <div class="fq-q"><span class="fq-qnr">${team ? `Frage ${G.zug + 1} von ${proRunde()} · Stufe von ${h(s.name)}` : `Frage für ${h(s.name)}`}</span><h2>${h(F.q)}</h2></div>
    <div class="fq-antw" role="group" aria-label="Antworten">${F.o.map((o, i) => {
      let c = "", zeichen = "ABCD"[i];
      if(beant){ if(i === F.k){ c = " richtig"; zeichen = "✓"; } else if(i === G.wahl){ c = " falsch"; zeichen = "✗"; } else c = " aus"; }
      return `<button type="button" class="fq-a fq-a${i}${c}" data-a="${i}"${beant ? " disabled" : ""} aria-label="Antwort ${"ABCD"[i]}: ${h(o)}${beant && i === F.k ? ", richtig" : ""}"><span class="fq-buchst" aria-hidden="true">${zeichen}</span><span class="fq-atext">${h(o)}</span></button>`;
    }).join("")}</div>
    ${rueck}
  </div>`;
}

function standHTML(){
  if(G.modus === "team"){
    const t = G.team, q = Math.min(G.nr, gesamt());
    return `<div class="fq-teamstand"><b>${t.ok}</b><span>von ${q} Fragen richtig</span><em>⭐ ${t.pkt} Punkte · beste Serie ${t.best}</em></div>
      <div class="fq-mini">${G.sp.map(s => `<span style="--pc:${s.farbe}">${av(s)}<b>${h(s.name)}</b></span>`).join("")}</div>`;
  }
  const r = rangliste(), max = Math.max(10, ...r.map(s => s.pkt));
  return `<ol class="fq-rang">${r.map(s => `<li style="--pc:${s.farbe}"><span class="fq-platz">${s.rang}.</span>${av(s)}<span class="fq-rname"><b>${h(s.name)}</b><small>${h(stufeVon(s.stufe).n)} · ${s.ok} richtig${s.serie >= 2 ? `<span class="fq-serie"> · 🔥 ${s.serie} in Folge</span>` : ""}</small></span>
    <span class="fq-balken" aria-hidden="true"><i style="width:${Math.round(s.pkt / max * 100)}%"></i></span><span class="fq-rpkt">${s.pkt}</span></li>`).join("")}</ol>`;
}
function zwischenHTML(){
  return `<div class="fq fq-zwischen fq-spiel">
    <div class="fq-karte fq-zw-karte">
      <p class="fq-klein">Runde ${G.runde + 1} von ${G.runden} geschafft</p>
      <h1>Zwischenstand</h1>
      ${standHTML()}
      <button type="button" class="fq-gross" data-weiter="1">Nächste Runde →</button>
    </div></div>`;
}
function endeHTML(){
  const knoepfe = `<div class="fq-endknoepfe"><button type="button" class="fq-gross" data-revanche="1">🔁 Revanche</button><button type="button" class="fq-zweit" data-neu="1">✏️ Neues Spiel</button></div>`;
  const xp = G.xpPlus ? `<p class="fq-xp">✨ +${G.xpPlus} XP für dein Profil</p>` : "";
  if(G.modus === "team"){
    const t = G.team, q = gesamt(), anteil = q ? t.ok / q : 0;
    const sterne = anteil >= .9 ? 3 : anteil >= .6 ? 2 : anteil >= .3 ? 1 : 0;
    const satz = sterne === 3 ? "Wow, ihr seid ein Super-Team!" : sterne === 2 ? "Stark, zusammen seid ihr gut!" : sterne === 1 ? "Gut gespielt! Nächstes Mal klappt noch mehr." : "Danke fürs Mitspielen! Probiert es gleich nochmals.";
    return `<div class="fq fq-ende fq-spiel">
      <div class="fq-karte fq-ende-karte">
        <img class="fq-ende-duo" src="${KIDS}duo-jubel.webp" alt="">
        <h1>${satz}</h1>
        <p class="fq-sterne" aria-label="${sterne} von 3 Sternen">${"⭐".repeat(sterne)}${"<span class=\"dim\">⭐</span>".repeat(3 - sterne)}</p>
        ${standHTML()}
        ${G.rekord ? `<p class="fq-rek">🏆 Neuer Team-Rekord!</p>` : ""}${xp}
        ${knoepfe}
      </div></div>`;
  }
  const r = rangliste();
  const ord = [r[1], r[0], r[2]].filter(Boolean);
  const pod = ord.map(s => {
    const f = figVon(s.fig), stufe = s.rang === 1 ? "p1" : s.rang === 2 ? "p2" : "p3";
    return `<div class="fq-pod ${stufe}" style="--pc:${s.farbe}">
      ${f ? `<img class="fq-pod-fig" src="${KIDS}${s.rang === 1 ? f.jubel : f.bild}" alt="">` : av(s, true)}
      <b>${h(s.name)}</b><span class="fq-pod-pkt">${s.pkt} Punkte</span>
      <div class="fq-sockel"><span aria-label="Platz ${s.rang}">${["🥇", "🥈", "🥉"][s.rang - 1] || s.rang + "."}</span></div></div>`;
  }).join("");
  const rest = r.slice(3), sieger = r.filter(s => s.rang === 1);
  const und = l => l.length > 1 ? l.slice(0, -1).join(", ") + " und " + l[l.length - 1] : l[0];
  const titel = sieger.length > 1 ? `Unentschieden! ${und(sieger.map(s => h(s.name)))} gewinnen` : `${h(r[0].name)} gewinnt!`;
  return `<div class="fq fq-ende fq-spiel">
    <div class="fq-karte fq-ende-karte">
      <h1>🏆 ${titel}</h1>
      <div class="fq-podest">${pod}</div>
      ${rest.length ? `<p class="fq-rest">${rest.map(s => `${s.rang}. ${h(s.name)}: ${s.pkt} Punkte`).join(" · ")}</p>` : ""}
      <p class="fq-lob">Toll gespielt! ${r.map(s => `${h(s.name)} ${s.ok} von ${G.runden} richtig`).join(", ")}.</p>
      ${G.rekord ? `<p class="fq-rek">🏆 Neuer Rekord: ${h(r[0].name)} mit ${r[0].pkt} Punkten</p>` : ""}${xp}
      ${knoepfe}
    </div></div>`;
}
function pauseHTML(){
  return `<div class="fq-overlay" role="dialog" aria-modal="true" aria-labelledby="fq-pause-t"><div class="fq-karte fq-pause-karte">
    <h2 id="fq-pause-t">⏸ Pause</h2><p>Der Spielstand bleibt gespeichert, auch wenn ihr die Seite neu ladet.</p>
    <button type="button" class="fq-gross" data-pauseweg="1">▶ Weiterspielen</button>
    <button type="button" class="fq-zweit" data-abbruch="1">Spiel beenden</button>
  </div></div>`;
}

function zeichne(oben){
  if(!BOX || !BOX.isConnected) return;
  stopTimer();
  if(G && (G.phase === "frage" || G.phase === "antwort") && !G.fr) G.phase = "bereit";
  let html;
  if(!G) html = setupHTML();
  else if(G.phase === "frage" || G.phase === "antwort") html = frageHTML();
  else if(G.phase === "zwischen") html = zwischenHTML();
  else if(G.phase === "ende") html = endeHTML();
  else { G.phase = "bereit"; html = bereitHTML(); }
  if(G && G.pause && G.phase !== "ende") html += pauseHTML();
  BOX.innerHTML = html;
  binde();
  if(oben) try{ window.scrollTo({top:0}); }catch(e){}
  if(G && G.phase === "frage" && !G.pause){
    if(G.frist && G.frist <= Date.now()){ antworten(-1); return; }
    startTimer();
  }
  const fokus = BOX.querySelector(G && G.pause ? "[data-pauseweg]" : "[data-weiter],[data-revanche]");
  if(fokus) try{ fokus.focus({preventScroll:true}); }catch(e){}
}

function binde(){
  const q = (sel, fn) => BOX.querySelectorAll(sel).forEach(b => b.addEventListener("click", fn));
  q("[data-fig]", e => { const i = +e.currentTarget.dataset.fig, s = E.spieler[i]; const ids = ["", ...FIG.map(f => f.id)];
    s.fig = ids[(ids.indexOf(s.fig) + 1) % ids.length]; A.ton("klick"); speichereE(); zeichne(); BOX.querySelector(`[data-fig="${i}"]`)?.focus(); });
  BOX.querySelectorAll("[data-name]").forEach(inp => {
    inp.addEventListener("input", () => { const i = +inp.dataset.name; E.spieler[i].name = inp.value.slice(0, 14); speichereE();
      const b = BOX.querySelector(`[data-fig="${i}"] .ini`); if(b) b.textContent = (inp.value.trim().charAt(0) || String(i + 1)).toUpperCase(); });
    inp.addEventListener("keydown", e => { if(e.key === "Enter"){ e.preventDefault(); inp.blur(); } });
  });
  BOX.querySelectorAll("[data-stufe]").forEach(sel => sel.addEventListener("change", () => { E.spieler[+sel.dataset.stufe].stufe = +sel.value; speichereE(); }));
  q("[data-weg]", e => { E.spieler.splice(+e.currentTarget.dataset.weg, 1); E.spieler.forEach((s, i) => s.farbe = FARBEN[i]); A.ton("klick"); speichereE(); zeichne(); });
  q("[data-add]", () => { const frei = FIG.find(f => !E.spieler.some(s => s.fig === f.id));
    E.spieler.push({name:"", fig:frei ? frei.id : "", stufe:1, farbe:FARBEN[E.spieler.length]}); A.ton("klick"); speichereE(); zeichne();
    const ins = BOX.querySelectorAll("[data-name]"); ins[ins.length - 1]?.focus(); });
  q("[data-set]", e => { const b = e.currentTarget, k = b.dataset.set; let v = b.dataset.v;
    if(k === "runden" || k === "zeit" || k === "tzeit") v = +v; E[k] = v; A.ton("klick"); speichereE(); zeichne(); BOX.querySelector(`[data-set="${k}"][data-v="${v}"]`)?.focus(); });
  q("[data-start]", () => { A.ton("wisch"); speichereE(); neuesSpiel(E); zeichne(true); });
  q("[data-weiter]", () => weiter());
  q("[data-a]", e => antworten(+e.currentTarget.dataset.a));
  q("[data-pause]", () => { A.ton("klick"); pauseUmschalten(true); });
  q("[data-pauseweg]", () => { A.ton("klick"); pauseUmschalten(false); });
  q("[data-abbruch]", () => { A.ton("klick"); beenden(); });
  q("[data-revanche]", () => { A.ton("wisch");
    const alt = {spieler:G.sp.map(s => ({name:s.name, fig:s.fig, stufe:s.stufe, farbe:s.farbe})), modus:G.modus, runden:G.runden, bereich:G.bereich,
      zeit:G.modus === "team" ? 0 : G.zeit, tzeit:G.modus === "team" ? G.zeit : 45};
    neuesSpiel(alt, G.used); zeichne(true); });
  q("[data-neu]", () => { A.ton("klick"); beenden(); });
}
function beenden(){ stopTimer(); G = null; SS.set(K_SPIEL, null); if(!E) E = startAufstellung(); zeichne(true); }

/* Tastatur: 1 bis 4 oder A bis D wählen eine Antwort, P oder Escape pausiert */
document.addEventListener("keydown", e => {
  try{
    if(typeof S === "undefined" || S.screen !== "x-familie" || !G || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target; if(t && /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName)) return;
    if(G.pause){ if(e.key === "Escape"){ e.preventDefault(); pauseUmschalten(false); } return; }
    if(G.phase === "frage" && e.key.length === 1){
      const k = e.key.toLowerCase(), i = "1234".includes(k) ? "1234".indexOf(k) : "abcd".indexOf(k);
      if(i >= 0){ e.preventDefault(); antworten(i); return; }
    }
    if((e.key === "Escape" || e.key === "p" || e.key === "P") && G.phase !== "ende"){ e.preventDefault(); pauseUmschalten(true); }
  }catch(err){}
});

/* Neuladen mitten im Spiel: war das Familien-Quiz offen, gleich wieder hinein (Spielstand liegt in sessionStorage) */
addEventListener("pagehide", () => { try{ sessionStorage.setItem(K_OFFEN, (typeof S !== "undefined" && S.screen === "x-familie" && G) ? "1" : "0"); }catch(e){} });
function wiederOeffnen(){
  try{
    if(sessionStorage.getItem(K_OFFEN) !== "1" || !G) return;
    sessionStorage.setItem(K_OFFEN, "0");
    setTimeout(() => { try{ if(typeof S !== "undefined" && (S.screen === "home" || !S.screen)) go("x-familie"); }catch(e){} }, 350);
  }catch(e){}
}
if(document.readyState === "complete") wiederOeffnen(); else addEventListener("load", wiederOeffnen);

/* ---------- Stil ---------- */
const css = document.createElement("style"); css.id = "ep-x-familie";
css.textContent = `
.fq{--fq-f:clamp(1rem,.55rem + .9vw + .4vh,1.6rem);color:#fff;box-sizing:border-box}
.fq *{box-sizing:border-box}
.fq button{font-family:inherit;cursor:pointer}
.fq button:focus-visible,.fq input:focus-visible,.fq select:focus-visible,.fq-overlay button:focus-visible{outline:3px solid #FFE34D;outline-offset:3px}
.fq-kopf{position:relative;display:flex;align-items:center;gap:14px;padding:16px 22px;border-radius:28px;background:linear-gradient(135deg,#F08A24,#E0479E 55%,#7B61FF);box-shadow:0 14px 30px rgba(60,40,140,.25);margin:6px 0 14px;min-height:84px}
.fq-kopf h1{margin:0;font-size:clamp(1.4rem,3.4vw,2.1rem);color:#fff}
.fq-kopf p{margin:2px 0 0;color:#fff;opacity:.95}
.fq-kopf>div{padding-right:140px}
.fq-kopf-emo{font-size:2.2rem}
.fq-kopf img{position:absolute;right:14px;bottom:0;height:calc(100% + 26px);max-height:150px;pointer-events:none}
.fq-karte{background:linear-gradient(150deg,#3B2F8F,#5B4BF5 70%,#7B61FF);border-radius:26px;padding:18px 20px;box-shadow:0 12px 28px rgba(27,34,64,.25);color:#fff}
.fq-karte h2{margin:0 0 10px;font-size:1.2rem;color:#fff}
.fq-setup-grid{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:16px;align-items:start}
.fq-setup-grid>*{min-width:0}
.fq-optionen{background:linear-gradient(150deg,#0B6E6A,#0F9F8F 70%,#18B48A)}
.fq-liste{display:flex;flex-direction:column;gap:8px}
.fq-person{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.14);border-radius:18px;padding:6px 8px;border-left:6px solid var(--pc)}
.fq-figwahl{border:0;background:none;padding:0;border-radius:50%;flex:none;line-height:0}
.fq-av{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:50%;background:radial-gradient(circle at 50% 35%,#fff,#E9E4FF);border:3px solid var(--fc);overflow:hidden;flex:none;line-height:1}
.fq-av img{width:100%;height:100%;object-fit:cover;object-position:50% 8%}
.fq-av.ini{background:var(--fc);color:#fff;font-weight:900;font-size:1.25rem;border-color:#fff}
.fq-av.gross{width:clamp(110px,22vh,190px);height:clamp(110px,22vh,190px);font-size:clamp(3rem,8vh,5rem);border-width:6px}
.fq-name{flex:1;min-width:0;font-family:inherit;font-weight:700;font-size:1.05rem;padding:10px 12px;border-radius:14px;border:2px solid transparent;background:rgba(15,20,48,.45);color:#fff}
.fq-name::placeholder{color:rgba(255,255,255,.72)}
.fq-sel{flex:none;max-width:44%;font-family:inherit;font-weight:700;font-size:.92rem;padding:10px 6px;border-radius:14px;border:0;background:rgba(15,20,48,.45);color:#fff}
.fq-sel option{color:#1B2240;background:#fff}
.fq-weg{flex:none;width:34px;height:34px;border:0;border-radius:50%;background:rgba(15,20,48,.4);color:#fff;font-weight:900}
.fq-plus{margin-top:8px;border:2px dashed rgba(255,255,255,.7);background:transparent;color:#fff;border-radius:16px;padding:9px 14px;font-weight:800;width:100%}
.fq-kurz{display:none}
.fq-fair,.fq-info{margin:10px 0 0;font-size:.88rem;line-height:1.35;background:rgba(15,20,48,.3);padding:8px 12px;border-radius:14px;color:#fff}
.fq-zeile{display:flex;flex-direction:column;gap:4px;margin:0 0 10px}
.fq-lbl{font-weight:800;font-size:.85rem;opacity:.95}
.fq-seg{display:flex;flex-wrap:wrap;gap:6px}
.fq-seg button{flex:1 1 auto;min-width:0;min-height:42px;border:0;border-radius:14px;padding:8px 10px;background:rgba(15,20,48,.35);color:#fff;font-weight:800;font-size:.92rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fq-seg button.an{background:#fff;color:#0B6E6A;box-shadow:0 4px 12px rgba(0,0,0,.18)}
.fq-rek{margin:10px 0 0;font-weight:800;background:rgba(15,20,48,.45);color:#FFE34D;padding:8px 12px;border-radius:14px;font-size:.92rem}
.fq-start,.fq-gross{display:block;width:100%;margin-top:12px;border:0;border-radius:20px;padding:14px 20px;font-weight:900;font-size:clamp(1.1rem,.8rem + .9vw,1.7rem);color:#1B2240;background:linear-gradient(180deg,#FFE96B,#FFC93C);box-shadow:0 8px 0 #D99A1E,0 14px 24px rgba(0,0,0,.2);transition:transform .1s;cursor:pointer}
.fq-start:active,.fq-gross:active{transform:translateY(3px)}
.fq-zweit{display:block;width:100%;margin-top:10px;border:2px solid rgba(255,255,255,.85);border-radius:20px;padding:12px 18px;font-weight:800;font-size:clamp(1rem,.8rem + .6vw,1.4rem);color:#fff;background:rgba(15,20,48,.3);cursor:pointer}

.fq-spiel{max-width:1200px;margin:0 auto}
.fq-leiste{display:flex;align-items:center;gap:8px;margin:2px 0 10px}
.fq-wer{display:flex;align-items:center;gap:8px;min-width:0;flex:1;background:rgba(15,20,48,.55);border-radius:999px;padding:4px 12px 4px 4px;border:3px solid var(--pc,#7B61FF)}
.fq-wer b{font-size:var(--fq-f);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.fq-wer .fq-av{width:clamp(36px,5vh,52px);height:clamp(36px,5vh,52px)}
.fq-team-av{font-size:1.6rem;width:40px;text-align:center}
.fq-stufe{display:inline-block;white-space:nowrap;font-size:.8em;font-weight:800;background:rgba(255,255,255,.2);border-radius:999px;padding:3px 9px;color:#fff}
.fq-wer .fq-stufe{font-size:clamp(.75rem,.5rem + .5vw,1.05rem)}
.fq-runde,.fq-pkt{flex:none;background:rgba(15,20,48,.55);color:#fff;border-radius:999px;padding:8px 14px;font-weight:800;font-size:clamp(.85rem,.6rem + .6vw,1.3rem);white-space:nowrap}
.fq-pause{flex:none;width:44px;height:44px;border:0;border-radius:50%;background:rgba(15,20,48,.55);color:#fff;font-size:1.1rem}
.fq-zeit{position:relative;height:22px;border-radius:999px;background:rgba(15,20,48,.45);overflow:hidden;margin:0 0 10px}
.fq-zeit i{position:absolute;left:0;top:0;bottom:0;width:100%;background:linear-gradient(90deg,#3DDC97,#4DB8FF);border-radius:999px;transition:width .2s linear}
.fq-zeit.knapp i{background:linear-gradient(90deg,#FFC93C,#FF9F43)}
.fq-zeit b{position:relative;display:block;text-align:center;font-size:.8rem;line-height:22px;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.4)}
.fq-q{background:linear-gradient(150deg,#2A2470,var(--pc));border-radius:26px;padding:clamp(14px,2.5vh,28px) clamp(16px,2.5vw,32px);box-shadow:0 12px 28px rgba(27,34,64,.25);margin:0 0 12px}
.fq-qnr{display:inline-block;font-weight:800;font-size:clamp(.78rem,.6rem + .4vw,1.1rem);background:rgba(15,20,48,.35);padding:3px 10px;border-radius:999px;margin-bottom:8px}
.fq-q h2{margin:0;color:#fff;font-size:clamp(1.2rem,.7rem + 1.5vw + .6vh,2.7rem);line-height:1.25}
.fq-antw{display:grid;grid-template-columns:1fr 1fr;gap:clamp(8px,1.4vh,16px)}
.fq-a{display:flex;align-items:center;gap:12px;text-align:left;border:0;border-radius:22px;padding:clamp(10px,1.8vh,22px) clamp(12px,1.5vw,22px);min-height:clamp(56px,9vh,110px);color:#fff;font-weight:800;font-size:clamp(1rem,.6rem + 1vw + .4vh,2rem);line-height:1.2;box-shadow:0 8px 18px rgba(27,34,64,.22);transition:transform .12s,opacity .3s}
.fq-a:not(:disabled):hover{transform:translateY(-2px)}
.fq-a0{background:linear-gradient(135deg,#2F6FE0,#4DA3FF)}
.fq-a1{background:linear-gradient(135deg,#8A3FD1,#B36BF0)}
.fq-a2{background:linear-gradient(135deg,#0B8C86,#1BBFA6)}
.fq-a3{background:linear-gradient(135deg,#D9661C,#F59A3A)}
.fq-buchst{flex:none;display:inline-flex;align-items:center;justify-content:center;width:1.8em;height:1.8em;border-radius:50%;background:rgba(255,255,255,.25);font-weight:900;font-size:.85em}
.fq-atext{min-width:0;overflow-wrap:anywhere}
.fq-a.richtig{background:linear-gradient(135deg,#0E9F57,#2BCB7A);box-shadow:0 0 0 4px #fff,0 10px 24px rgba(14,159,87,.45)}
.fq-a.falsch{background:linear-gradient(135deg,#59617D,#7A82A0)}
.fq-a.aus{opacity:.45}
.fq-a:disabled{cursor:default;color:#fff}
.fq-rueck{margin-top:12px;border-radius:22px;padding:12px 16px;background:rgba(15,20,48,.66);color:#fff}
.fq-rueck.gut{background:linear-gradient(135deg,rgba(14,120,70,.94),rgba(20,150,95,.94))}
.fq-rueck-kopf{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px}
.fq-rueck-kopf b{font-size:clamp(1.05rem,.7rem + .9vw,1.8rem)}
.fq-plusp{font-weight:800;background:rgba(255,255,255,.2);padding:3px 10px;border-radius:999px;font-size:clamp(.85rem,.6rem + .5vw,1.2rem)}
.fq-rueck p{margin:6px 0 0;line-height:1.35;font-size:clamp(.88rem,.6rem + .55vw,1.3rem);opacity:.96}
.fq-weiter{display:block;margin:10px 0 0 auto;border:0;border-radius:16px;padding:11px 20px;font-weight:900;font-size:clamp(1rem,.7rem + .7vw,1.5rem);color:#1B2240;background:linear-gradient(180deg,#FFE96B,#FFC93C);box-shadow:0 5px 0 #D99A1E}

.fq-bereit{display:flex;justify-content:center;padding-top:clamp(4px,3vh,30px)}
.fq-bereit-karte{width:min(100%,760px);text-align:center;border-radius:30px;padding:clamp(18px,3.5vh,40px) clamp(16px,3vw,40px);background:linear-gradient(160deg,#2A2470,var(--pc));box-shadow:0 16px 36px rgba(27,34,64,.3);display:flex;flex-direction:column;align-items:center;gap:clamp(6px,1.4vh,14px)}
.fq-bereit-karte h1{margin:0;color:#fff;font-size:clamp(1.7rem,1rem + 2.6vw + 1vh,3.8rem);line-height:1.1}
.fq-bereit-karte h1 span{color:#FFE34D}
.fq-bereit-karte p{margin:0;font-size:clamp(1rem,.7rem + .8vw,1.6rem);color:#fff}
.fq-bereit-fig{height:clamp(150px,30vh,300px);width:auto;max-width:80%;object-fit:contain;filter:drop-shadow(0 10px 18px rgba(0,0,0,.3))}
.fq-bereit-figs{display:flex;gap:8px}
.fq-bereit-figs .fq-av{width:clamp(56px,10vh,90px);height:clamp(56px,10vh,90px)}
.fq-klein{font-weight:800;background:rgba(15,20,48,.35);padding:4px 12px;border-radius:999px;font-size:clamp(.85rem,.6rem + .4vw,1.15rem)!important}
.fq-bereit .fq-gross{max-width:460px}

.fq-zw-karte,.fq-ende-karte{max-width:860px;margin:clamp(0px,2vh,20px) auto 0;text-align:center}
.fq-zw-karte h1,.fq-ende-karte h1{margin:6px 0 12px;color:#fff;font-size:clamp(1.5rem,1rem + 1.8vw,3rem);line-height:1.15}
.fq-zw-karte .fq-klein{display:inline-block;margin:0}
.fq-rang{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px;text-align:left}
.fq-rang li{display:flex;align-items:center;gap:10px;background:rgba(15,20,48,.38);border-radius:18px;padding:8px 12px;border-left:6px solid var(--pc)}
.fq-platz{font-weight:900;font-size:clamp(1.1rem,.8rem + .8vw,1.8rem);width:1.7em;flex:none}
.fq-rname{display:flex;flex-direction:column;min-width:0;flex:0 1 34%}
.fq-rname b{font-size:clamp(1rem,.7rem + .8vw,1.7rem);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fq-rname small{opacity:.92;font-size:clamp(.75rem,.6rem + .3vw,1rem)}
.fq-balken{flex:1;height:14px;border-radius:999px;background:rgba(255,255,255,.18);overflow:hidden;min-width:30px}
.fq-balken i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#FFE34D,#FFB23C)}
.fq-rpkt{font-weight:900;font-size:clamp(1.1rem,.8rem + .9vw,2rem);min-width:2.2em;text-align:right}
.fq-teamstand{display:flex;flex-direction:column;align-items:center;gap:2px;margin-bottom:10px}
.fq-teamstand b{font-size:clamp(2.6rem,2rem + 3vw,5rem);line-height:1;color:#FFE34D}
.fq-teamstand span{font-weight:800;font-size:clamp(1rem,.8rem + .6vw,1.5rem)}
.fq-teamstand em{font-style:normal;opacity:.92}
.fq-mini{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
.fq-mini>span{display:flex;align-items:center;gap:8px;background:rgba(15,20,48,.35);border-radius:999px;padding:4px 12px 4px 4px;border:2px solid var(--pc)}
.fq-podest{display:flex;justify-content:center;align-items:flex-end;gap:clamp(6px,1.5vw,18px);margin:4px 0 8px}
.fq-pod{display:flex;flex-direction:column;align-items:center;width:clamp(96px,22vw,220px);min-width:0}
.fq-pod b{font-size:clamp(.95rem,.7rem + .8vw,1.7rem);max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.fq-pod-pkt{font-weight:800;font-size:clamp(.8rem,.6rem + .5vw,1.2rem);opacity:.95}
.fq-pod-fig{height:clamp(80px,15vh,170px);width:auto;max-width:100%;object-fit:contain;filter:drop-shadow(0 6px 10px rgba(0,0,0,.3))}
.fq-pod .fq-av.gross{width:clamp(64px,11vh,120px);height:clamp(64px,11vh,120px);font-size:clamp(1.8rem,5vh,3.4rem)}
.fq-sockel{width:100%;margin-top:6px;border-radius:16px 16px 6px 6px;background:var(--pc);display:flex;align-items:flex-start;justify-content:center;padding-top:8px;font-size:clamp(1.6rem,1.2rem + 1vw,2.6rem);box-shadow:inset 0 -6px 0 rgba(0,0,0,.15),inset 0 4px 0 rgba(255,255,255,.25)}
.fq-pod.p1 .fq-sockel{height:clamp(70px,13vh,140px)}
.fq-pod.p2 .fq-sockel{height:clamp(50px,9vh,100px)}
.fq-pod.p3 .fq-sockel{height:clamp(36px,6vh,70px)}
.fq-rest,.fq-lob{margin:6px 0 0;font-size:clamp(.85rem,.65rem + .4vw,1.15rem);opacity:.95}
.fq-xp{display:inline-block;margin:8px 0 0;font-weight:800;background:rgba(15,20,48,.4);padding:6px 14px;border-radius:999px;color:#FFE34D}
.fq-ende-karte .fq-rek{display:inline-block;margin:8px 6px 0}
.fq-endknoepfe{display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:end;margin-top:4px}
.fq-endknoepfe .fq-zweit{margin-top:12px;padding:14px 18px}
.fq-ende-duo{height:clamp(90px,16vh,170px);width:auto}
.fq-sterne{font-size:clamp(2rem,1.5rem + 2vw,3.4rem);margin:0 0 8px;letter-spacing:.1em}
.fq-sterne .dim{filter:grayscale(1);opacity:.35}

.fq-overlay{position:fixed;inset:0;z-index:9000;background:rgba(15,20,48,.6);display:flex;align-items:center;justify-content:center;padding:16px}
.fq-pause-karte{max-width:440px;width:100%;text-align:center}
.fq-pause-karte h2{font-size:1.6rem}
.fq-pause-karte p{margin:0 0 4px}

.fq-konf{position:fixed;inset:0;pointer-events:none;z-index:9500;overflow:hidden}
.fq-konf i{position:absolute;top:-20px;width:10px;height:14px;border-radius:3px;animation:fq-fall 3s ease-in forwards}
@keyframes fq-fall{from{transform:translateX(0) rotate(0)}to{top:105%;transform:translateX(40px) rotate(540deg)}}
@media (prefers-reduced-motion:reduce){.fq-a,.fq-zeit i,.fq-start,.fq-gross{transition:none}.fq-konf{display:none}}

@media (max-width:900px){ .fq-setup-grid{grid-template-columns:minmax(0,1fr)} }
@media (max-width:560px){
  .fq-setup .fq-kopf{display:none}
  .fq-lang,.fq-optionen .fq-info{display:none}
  .fq-kurz{display:inline}
  [aria-labelledby="fq-l-bereich"]{flex-wrap:nowrap}
  [aria-labelledby="fq-l-bereich"] button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;padding:4px 2px;font-size:.68rem;line-height:1.1;flex:1 1 0}
  [aria-labelledby="fq-l-bereich"] button span:first-child{font-size:1rem}
  .fq-kopf{padding:10px 14px;min-height:62px;border-radius:22px;margin:0 0 10px}
  .fq-kopf>div{padding-right:84px}
  .fq-kopf h1{font-size:1.3rem}
  .fq-kopf p{font-size:.82rem}
  .fq-kopf-emo{display:none}
  .fq-kopf img{max-height:96px}
  .fq-karte{padding:12px 12px;border-radius:22px}
  .fq-karte h2{font-size:1rem;margin-bottom:6px}
  .fq-setup-grid{gap:10px}
  .fq-person{padding:4px 6px;gap:6px}
  .fq-av{width:38px;height:38px}
  .fq-name{padding:7px 9px;font-size:.95rem}
  .fq-liste{gap:6px}
  .fq-sel{font-size:.82rem;padding:9px 3px}
  .fq-weg{width:28px;height:28px}
  .fq-plus{padding:6px;margin-top:6px}
  .fq-fair,.fq-info{font-size:.76rem;padding:6px 9px;margin-top:6px}
  .fq-zeile{margin-bottom:6px;flex-direction:row;align-items:center;gap:8px}
  .fq-lbl{flex:0 0 70px;font-size:.74rem;line-height:1.15}
  .fq-seg{gap:4px;flex:1;min-width:0}
  .fq-seg button{min-height:36px;padding:6px 6px;font-size:.8rem;border-radius:12px}
  .fq-start{margin-top:8px;padding:12px}
  .fq-leiste{gap:5px;margin-bottom:8px}
  .fq-wer{padding-right:8px;gap:6px}
  .fq-wer .fq-stufe{display:none}
  .fq-runde,.fq-pkt{padding:7px 9px}
  .fq-pause{width:38px;height:38px}
  .fq-antw{grid-template-columns:1fr}
  .fq-a{min-height:52px;border-radius:18px;gap:10px}
  .fq-frage.beant .fq-a.aus{display:none}
  .fq-frage.beant .fq-q{padding:12px 14px}
  .fq-rueck{padding:10px 12px}
  .fq-endknoepfe{gap:8px}
  .fq-endknoepfe .fq-gross,.fq-endknoepfe .fq-zweit{font-size:1rem;padding:12px 8px;margin-top:10px}
  .fq-rname{flex:1}
  .fq-balken{display:none}
  .fq-rang li{padding:6px 10px;gap:8px}
  .fq-rang .fq-serie{display:none}
  .fq-lob{display:none}
  .fq-ende-karte h1{margin:2px 0 6px}
  .fq-pod-fig{height:clamp(70px,13vh,130px)}
  .fq-pod.p1 .fq-sockel{height:clamp(54px,9vh,90px)}
  .fq-pod.p2 .fq-sockel{height:clamp(40px,6.5vh,70px)}
  .fq-pod.p3 .fq-sockel{height:clamp(30px,4.5vh,50px)}
  .fq-sockel{font-size:1.5rem;padding-top:4px}
  .fq-ende-karte .fq-rek,.fq-xp{font-size:.8rem;padding:5px 10px;margin-top:6px}
}
@media (max-width:560px) and (max-height:900px){
  .fq-optionen h2{display:none}
  .fq-karte h2{margin-bottom:4px}
  .fq-person{padding:3px 6px}
  .fq-av{width:34px;height:34px}
  .fq-name,.fq-sel{padding-top:6px;padding-bottom:6px}
  .fq-zeile{margin-bottom:5px}
  .fq-seg button{min-height:34px}
  .fq-fair{margin-top:5px}
}
@media (max-width:560px) and (max-height:760px){
  .fq-fair .fq-kurz{display:none}
}
@media (max-width:380px){ .fq-runde{display:none} [aria-labelledby="fq-l-bereich"] button{font-size:.6rem} }
`;
document.head.appendChild(css);

/* ---------- Anmelden ---------- */
X.register({
  id:"familie", titel:"Familien-Quiz", text:"2 bis 4 Personen spielen reihum auf einem Gerät", emo:"👪",
  farbe:"linear-gradient(135deg,#F08A24,#E0479E 60%,#7B61FF)", reihe:15,
  hinweis(){ return G && G.phase !== "ende" ? "läuft" : ""; },
  render(box){
    BOX = box;
    if(!E) E = startAufstellung();
    zeichne(true);
  }
});

window.EP_FAMILIE = {
  laeuft: () => !!(G && G.phase !== "ende"),
  stand: () => G ? JSON.parse(JSON.stringify(G)) : null,
  bestwerte,
  neu: () => { stopTimer(); G = null; SS.set(K_SPIEL, null); },
  beenden
};
})();
