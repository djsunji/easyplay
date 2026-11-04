/* easyplay: Hardcore-Modus
   Fragen aus allen Themen und Stufen, ohne Ende, bis zur ersten falschen Antwort.
   45 Sekunden pro Frage. Eigene Hardcore-Rangliste (Feld «hc» im Spielerprofil). */
(function(){
"use strict";
const HC_SEK = 45;
const HC = { timer:null, seen:new Set(), f:null, opts:null, n:0, zeit:0, t0:0, rest:HC_SEK, vorbei:false, grund:"", pick:null, neu:false };

function hcPool(){
  const extra = (S && S.extra) || [];
  return FRAGEN.concat(extra).filter(f => f && f.q && Array.isArray(f.a) && f.a.length >= 2);
}
/* Schwierigkeit steigt mit der Serie: zuerst nur Entdecker, dann Könner, später Profis */
function hcStufe(n){
  const r = Math.random();
  if(n < 5) return 1;
  if(n < 12) return r < .4 ? 1 : 2;
  if(n < 20) return r < .15 ? 1 : 2;
  if(n < 30) return r < .5 ? 2 : 3;
  return r < .15 ? 2 : 3;
}
let HC_STUFEN = null, HC_STUFEN_N = 0;
function hcPoolStufe(l){
  const pool = hcPool();
  if(!HC_STUFEN || HC_STUFEN_N !== pool.length){ HC_STUFEN = {1:[],2:[],3:[]}; pool.forEach(f => { const k = f.l===3 ? 3 : f.l===2 ? 2 : 1; HC_STUFEN[k].push(f); }); HC_STUFEN_N = pool.length; }
  return HC_STUFEN[l] && HC_STUFEN[l].length ? HC_STUFEN[l] : pool;
}
function hcNaechste(){
  const pool = hcPoolStufe(hcStufe(HC.n));
  let f = null;
  for(let v=0; v<60 && !f; v++){ const x = pool[Math.floor(Math.random()*pool.length)]; if(!HC.seen.has(x.q)) f = x; }
  if(!f) f = pool[Math.floor(Math.random()*pool.length)];
  HC.seen.add(f.q);
  HC.f = f;
  HC.opts = shuffle(f.a.map((txt,i)=>({txt, ok:i===0})));
  HC.pick = null; HC.rest = HC_SEK; HC.t0 = performance.now();
}
function hcStop(){ if(HC.timer){ clearInterval(HC.timer); HC.timer=null; } }
function hcStart(){
  hcStop();
  Object.assign(HC, { seen:new Set(), n:0, zeit:0, vorbei:false, grund:"", neu:false });
  hcNaechste();
  go("hardcore");
}
function hcBest(p){ return (p && p.hc && p.hc.best) || 0; }

async function hcSpeichern(){
  if(!S.profil || HC.n <= 0) return;
  const alt = S.profil.hc || {};
  const besser = HC.n > (alt.best||0) || (HC.n === (alt.best||0) && HC.zeit < (alt.zeit||Infinity));
  const hc = { ...alt, spiele:(alt.spiele||0)+1 };
  if(besser){ hc.best = HC.n; hc.zeit = Math.round(HC.zeit); hc.datum = new Date().toISOString(); HC.neu = true; }
  S.profil = { ...S.profil, hc };
  try{ store.set("ep-profil", S.profil); }catch(e){}
  if(S.online){ try{ await S.db.doc(`spieler/${S.uid}`).set(oeffentlichesProfil(S.profil)); }catch(e){ console.warn("hardcore speichern", e); } }
}
function hcEnde(grund){
  if(HC.vorbei) return;
  hcStop();
  HC.vorbei = true; HC.grund = grund;
  hcSpeichern().finally(()=>{ if(S.screen==="hardcore") hcZeichne(); });
  hcZeichne();
}
function hcAntwort(i){
  if(HC.vorbei || HC.pick!=null) return;
  HC.pick = i;
  HC.zeit += performance.now() - HC.t0;
  hcStop();
  if(HC.opts[i].ok){
    HC.n++;
    hcZeichne();
    setTimeout(()=>{ if(S.screen!=="hardcore" || HC.vorbei) return; hcNaechste(); hcZeichne(); hcTick(); }, 650);
  } else hcEnde("falsch");
}
function hcTick(){
  hcStop();
  HC.timer = setInterval(()=>{
    if(S.screen!=="hardcore"){ hcStop(); return; }
    HC.rest = Math.max(0, HC_SEK - (performance.now()-HC.t0)/1000);
    const bar = document.getElementById("hcBar"), zahl = document.getElementById("hcSek");
    if(bar) bar.style.width = (HC.rest/HC_SEK*100)+"%";
    const zs = document.getElementById("hcZuend"); if(zs){ zs.style.setProperty("--p", (1-HC.rest/HC_SEK).toFixed(4)); zs.classList.toggle("knapp", HC.rest <= 5); }
    if(zahl) zahl.textContent = Math.ceil(HC.rest);
    const z2 = document.getElementById("hcSekZ"); if(z2) z2.textContent = Math.ceil(HC.rest);
    const box = document.getElementById("hcUhr"); if(box) box.classList.toggle("knapp", HC.rest <= 5);
    if(HC.rest <= 0){ HC.pick = -1; HC.zeit += HC_SEK*1000; hcStop();
      const z = document.getElementById("hcZuend"); if(z){ z.classList.remove("knapp"); z.classList.add("boom"); }
      document.querySelectorAll("[data-hc]").forEach(b => b.disabled = true);
      setTimeout(() => hcEnde("zeit"), z ? 950 : 0); }
  }, 100);
}

/* Zündschnur, die zum Dynamitfass brennt (Zeit pro Frage) */
function hcZuendschnur(){
  const p = Math.min(1, Math.max(0, 1 - HC.rest/HC_SEK));
  const zustand = HC.vorbei ? (HC.grund==="zeit" ? "weg" : "aus") : (HC.pick!=null ? "halt" : "");
  return `<div class="hczuend ${zustand} ${HC.rest<=5&&!HC.vorbei?"knapp":""}" id="hcZuend" style="--p:${p.toFixed(4)}" role="img" aria-label="Zündschnur: noch ${Math.ceil(HC.rest)} Sekunden">
    <div class="hcz-bahn"><div class="hcz-asche"></div><div class="hcz-seil"></div><div class="hcz-funke"><i></i><i></i><i></i><i></i><i></i></div><div class="hcz-info"><span class="hcz-serie"><img src="img/grafik/diverse/flamme.webp?v=2" alt=""><b>${HC.n}</b> <span class="hcz-w">${HC.n===1?"richtige Antwort":"richtige Antworten"}</span><span class="hcz-k">richtig</span></span><span class="hcz-zeit"><img src="img/grafik/diverse/sanduhr.webp?v=2" alt=""><b id="hcSekZ">${Math.ceil(HC.rest)}</b> s</span></div></div>
    <div class="hcz-fass"><img class="hcz-f1" src="img/grafik/hardcore/fass.webp?v=1" alt=""><img class="hcz-f2" src="img/grafik/hardcore/fass-boom.webp?v=1" alt=""></div>

  </div>`;
}
function themaName(f){ try{ return (THEMA[f.t] && THEMA[f.t].name) || ""; }catch(e){ return ""; } }

function hcZeichne(){
  const f = HC.f, answered = HC.pick!=null;
  const kopf = `<div class="hckopf"><span class="hcserie">🔥 <b>${HC.n}</b> ${HC.n===1?"richtige Antwort":"richtige Antworten"}</span>
    <span class="hcuhr" id="hcUhr"><span id="hcSek">${Math.ceil(HC.rest)}</span> s</span></div>
    ${hcZuendschnur()}`;
  const frage = `<div class="card hckarte">
      <p class="hcmeta">${esc(themaName(f))}${f.l?` · ${STUFE_EMO?.[f.l]||""} Stufe ${f.l}`:""}</p>
      ${f.img?`<div class="qimg">${imgSvg(f.img)}</div>`:""}
      <h2 class="question">${esc(f.q)}</h2>
      <div class="answers">${HC.opts.map((o,i)=>{ let c=""; if(answered){ if(o.ok) c="right"; else if(HC.pick===i) c="wrong"; }
        return `<button class="ans ${c}" type="button" data-hc="${i}" ${answered?"disabled":""}><span class="key">${"ABCD"[i]}</span><span>${esc(o.txt)}</span></button>`; }).join("")}</div>
    </div>`;
  let ende = "";
  if(HC.vorbei){
    const best = hcBest(S.profil);
    ende = `<div class="card hcende pop">
      <div class="hcgross">${HC.grund==="zeit" ? "💥 Bumm! Die Zeit ist abgelaufen." : "💥 Falsche Antwort!"}</div>
      <p class="hcpunkte">Du hast <b>${HC.n}</b> ${HC.n===1?"Frage":"Fragen"} hintereinander richtig beantwortet.</p>
      ${S.profil ? `<p class="hcbest">${HC.neu ? "🏆 Neuer persönlicher Rekord!" : `Dein Rekord: <b>${best}</b>`}</p>` : `<p class="hcbest">Registriere dich, damit dein Ergebnis in die Hardcore-Rangliste kommt.</p>`}
      <div class="hcerkl"><b>Richtig wäre gewesen:</b> ${esc(f.a[0])}${f.e?`<p>${esc(f.e)}</p>`:""}</div>
      <div class="row"><button class="big gold" type="button" id="hcNochmal">🔥 Nochmals versuchen</button>
        <button class="big alt" type="button" id="hcRang">🏆 Hardcore-Rangliste</button>
        ${S.profil?"":`<button class="big alt" type="button" id="hcReg">Registrieren</button>`}</div>
    </div>`;
  }
  $("#app").innerHTML = `<div class="hcwrap">${kopf}${ende}${frage}</div>`;
  document.querySelectorAll("[data-hc]").forEach(b=>b.onclick=()=>hcAntwort(+b.dataset.hc));
  const n=$("#hcNochmal"); n && (n.onclick=hcStart);
  const r=$("#hcRang"); r && (r.onclick=()=>go("hcboard"));
  const g=$("#hcReg"); g && (g.onclick=()=>{ S.after="hardcoreinfo"; go("register"); });
  if(HC.vorbei) $(".hcende")?.scrollIntoView({behavior:"smooth", block:"start"});
}

function hcInfo(){
  hcStop();
  const best = hcBest(S.profil);
  $("#app").innerHTML = `<div class="hcwrap">
    <div class="pagehead hcpagehead"><div class="bigav hcicon">🔥</div><div><h1>Hardcore</h1><p class="help">Wie weit kommst du ohne einen einzigen Fehler?</p></div></div>
    <div class="card hcregeln">
      <div><b>🌍 Alles gemischt</b><span>Fragen aus allen Themen. Am Anfang leicht, dann immer schwieriger: Entdecker, Könner und zuletzt Profis.</span></div>
      <div><b>♾️ Ohne Ende</b><span>Es geht so lange weiter, bis du eine Frage falsch beantwortest.</span></div>
      <div><b>🧨 45 Sekunden</b><span>Pro Frage brennt die Zündschnur 45 Sekunden lang. Erreicht der Funke das Fass, ist das Spiel vorbei.</span></div>
      <div><b>🏆 Eigene Rangliste</b><span>Es zählt deine längste Serie. Bei Gleichstand gewinnt, wer schneller war.</span></div>
    </div>
    ${S.profil ? `<p class="hcbest" style="text-align:center">Dein Rekord: <b>${best}</b> ${best===1?"Frage":"Fragen"}</p>` : `<p class="hcbest" style="text-align:center">Ohne Profil kannst du spielen, kommst aber nicht in die Rangliste.</p>`}
    <div class="row" style="justify-content:center"><button class="big gold" type="button" id="hcLos">🔥 Hardcore starten</button><button class="big alt" type="button" id="hcRang2">🏆 Hardcore-Rangliste</button></div>
  </div>`;
  $("#hcLos").onclick=hcStart; $("#hcRang2").onclick=()=>go("hcboard");
}

function hcBoard(){
  hcStop();
  const meId = (S.online||S.rang) ? S.uid : "me";
  let list = (S.online||S.rang) ? (S.spieler||[]) : (S.profil ? [{...S.profil, id:"me"}] : []);
  list = list.filter(p=>hcBest(p)>0).sort((a,b)=>hcBest(b)-hcBest(a) || ((a.hc.zeit||Infinity)-(b.hc.zeit||Infinity)));
  const sek = ms => ms ? (ms/1000).toLocaleString("de-CH",{maximumFractionDigits:1})+" s" : "";
  $("#app").innerHTML = `<div class="hcwrap">
    <div class="rlkopf"><div class="rlpokal" aria-hidden="true"><span>🔥</span></div>
      <h1>Hardcore-Rangliste</h1>
      <p class="rlintro">Die längsten fehlerfreien Serien aus allen Themen und Stufen. Bei gleich vielen Fragen liegt vorne, wer schneller war.</p></div>
    <div class="row" style="justify-content:center;margin-bottom:16px"><button class="big gold" type="button" id="hcLos3">🔥 Hardcore spielen</button><button class="big alt" type="button" id="hcZurRl">🏆 Normale Rangliste</button></div>
    <div class="rlliste"><div class="rlkopfleiste"><b>🔥 Hardcore</b><span>${list.length} ${list.length===1?"Person":"Personen"}</span></div>
    <div class="board rlscroll">${list.length ? list.map((p,i)=>`<div class="rrow ${p.id===meId?"me":""}" data-pid="${esc(p.id)}" role="button" tabindex="0">
        <span class="rank">${medalSvg(i)}</span><span class="rav" aria-hidden="true">${avatar(p.avatar)}</span>
        <span class="rname"><b>${esc(p.name)}${p.id===meId?" (du)":""}</b><span>${p.kanton? wappen(p.kanton)+" "+esc(KANTONE.find(k=>k.kuerzel===p.kanton)?.kurz||"")+" · ":""}${sek(p.hc.zeit)}</span></span>
        <span class="rpts">${hcBest(p)}<small>${hcBest(p)===1?"Frage":"Fragen"}</small></span></div>`).join("")
      : `<div class="empty">Noch niemand auf der Hardcore-Rangliste. Sei die erste Person!</div>`}</div></div>
    ${(S.online||S.rang)? "" : `<p class="note">In dieser Ansicht gibt es keine gemeinsame Rangliste, du siehst nur dein eigenes Ergebnis.</p>`}
  </div>`;
  $("#hcLos3").onclick=hcStart; $("#hcZurRl").onclick=()=>go("board");
  document.querySelectorAll("[data-pid]").forEach(el=>{ const auf=()=>{ S.spielerId=el.dataset.pid; go("spieler"); }; el.onclick=auf; el.onkeydown=e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); auf(); } }; });
}


function spielmodi(){
  hcStop();
  const k=(id,emo,titel,text,farbe)=>`<button class="smkarte" type="button" data-sm="${id}" style="--f1:${farbe[0]};--f2:${farbe[1]}"><span class="smemo">${emo}</span><b>${titel}</b><span>${text}</span></button>`;
  $("#app").innerHTML = `<div class="hcwrap smwrap">
    <div class="pagehead"><div class="bigav hcicon">🎮</div><div><h1>Wettbewerb, Duell & Hardcore</h1><p class="help">Miss dich mit anderen oder mit dir selbst.</p></div></div>
    <div class="smgitter">
      ${k("live","⚡","Wettbewerb","Eine Person stellt die Fragen, alle spielen gleichzeitig mit einem PIN.",["#3D5AFE","#8A3FE0"])}
      ${k("duell","⚔️","Duell","Fordere jemanden heraus und beantwortet dieselben Fragen gegeneinander.",["#17A35A","#0E7A45"])}
      ${k("hardcoreinfo","🔥","Hardcore","Alle Themen, alle Stufen, 45 Sekunden pro Frage. Ein Fehler und es ist vorbei.",["#E0312B","#F2A000"])}
    </div></div>`;
  document.querySelectorAll("[data-sm]").forEach(b=>b.onclick=()=>{ const m=b.dataset.sm;
    if(m==="live"){ try{ go(L.role==="host"?"livehost":L.role==="player"?"liveplay":"live"); }catch(e){ go("live"); } } else go(m); });
}
const HC_SEITEN = { spielmodi, hardcoreinfo:hcInfo, hardcore:()=>{ hcZeichne(); if(!HC.vorbei && HC.pick==null) hcTick(); }, hcboard:hcBoard };
const vorRender = window.render;
window.render = function(){
  if(S.screen!=="hardcore") hcStop();
  if(HC_SEITEN[S.screen]){
    try{ if(typeof applyDark==="function") applyDark(); }catch(e){}
    try{ if(S.timer){ clearInterval(S.timer); S.timer=null; } }catch(e){}
    try{ renderNav(); }catch(e){}
    try{ if(S.screen==="hardcore" && !HC.f) hcNaechste(); HC_SEITEN[S.screen](); }catch(e){ console.error("hardcore.js", e); }
    try{ bindCrumbs(); }catch(e){}
    return;
  }
  return vorRender.apply(this, arguments);
};

document.addEventListener("keydown", e=>{
  if(S.screen!=="hardcore" || HC.vorbei || HC.pick!=null || e.ctrlKey || e.metaKey || e.altKey) return;
  const i = "abcd".indexOf(String(e.key).toLowerCase());
  if(i>=0 && HC.opts && i<HC.opts.length){ e.preventDefault(); hcAntwort(i); }
});

// Startseite: Knopf «Hardcore»
if(typeof window.renderHome==="function"){
  const vorHome = window.renderHome;
  window.renderHome = function(){
    const r = vorHome.apply(this, arguments);
    try{ const c=document.querySelector(".hero .ctas"); if(c && !document.getElementById("hcHome")){ const b=document.createElement("button"); b.className="big hardcore"; b.type="button"; b.id="hcHome";
      b.innerHTML=`<span class="cicon" aria-hidden="true">🎮</span> Wettbewerb, Duell & Hardcore`; b.onclick=()=>go("spielmodi"); c.prepend(b); } }catch(e){}
    return r;
  };
}
// Profil: Hintergrund
if(typeof window.renderProfil==="function"){
  const vorProfil = window.renderProfil;
  window.renderProfil = function(){
    const r = vorProfil.apply(this, arguments);
    try{ const app=document.getElementById("app"); if(S.screen==="profil" && app && !document.getElementById("hgProfil")){
      const box=document.createElement("section"); box.className="statcard"; box.id="hgProfil";
      box.innerHTML=`<h2>🎨 Hintergrund</h2><p class="help">Wähle Jahreszeit, Hintergrund und Darstellung der Seite.</p><div class="row"><button class="big" type="button" id="hgOeffnen">⚙️ Hintergrund anpassen</button></div>`;
      app.appendChild(box); box.querySelector("#hgOeffnen").onclick=()=>{ try{ oeffneEinstellungen(); }catch(e){ console.warn(e); } };
    } }catch(e){}
    return r;
  };
}
// Normale Rangliste: Knopf zur Hardcore-Rangliste
if(typeof window.renderBoard==="function"){
  const vorBoard = window.renderBoard;
  window.renderBoard = function(){
    const r = vorBoard.apply(this, arguments);
    try{ const s=document.querySelector(".rlmodus"); if(s && !s.querySelector("[data-hcb]")){ const b=document.createElement("button"); b.className="seg"; b.type="button"; b.dataset.hcb="1"; b.setAttribute("aria-pressed","false"); b.textContent="🔥 Hardcore"; b.onclick=()=>go("hcboard"); s.appendChild(b); } }catch(e){}
    return r;
  };
}

const css = document.createElement("style");
css.textContent = `
.hcwrap{max-width:820px;margin:0 auto}
.hckopf{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:6px 0 8px;font-family:"Bricolage Grotesque",system-ui,sans-serif}
.hcserie{font-size:1.15rem;background:var(--surface);color:var(--ink);border:2px solid #E0312B;border-radius:999px;padding:4px 16px}.hcserie b{font-size:1.7rem}
.hcuhr{font-weight:800;font-size:1.4rem;padding:4px 14px;border-radius:999px;background:var(--surface);color:var(--ink);border:2px solid var(--gold,#F2A000);font-variant-numeric:tabular-nums;transition:color .2s}
.hcuhr.knapp{color:#E0312B;animation:hcpuls .5s ease-in-out infinite alternate}
@keyframes hcpuls{to{transform:scale(1.12)}}
.hcbalken{height:10px;border-radius:999px;background:rgba(0,0,0,.08);overflow:hidden;margin-bottom:14px}
.hcbalken i{display:block;height:100%;background:linear-gradient(90deg,#E0312B,#F2A000);border-radius:999px;transition:width .1s linear}
.hcmeta{margin:0 0 6px;opacity:.7;font-size:.9rem}
#hcUhr{display:none}
.hczuend{--p:0;--fh:130px;--sy:15px;--sd:8px;position:relative;display:flex;align-items:flex-start;height:var(--fh);margin:2px 0 12px;padding:0 4px}
.hcz-bahn{position:relative;flex:1 1 auto;height:var(--fh);min-width:0;z-index:1}
.hcz-seil,.hcz-asche{position:absolute;top:calc(var(--sy) - var(--sd) / 2);height:var(--sd)}
.hcz-asche{left:0;right:0;top:calc(var(--sy) - 1px);height:3px;border-radius:2px;background:repeating-linear-gradient(90deg,rgba(70,60,70,.45) 0 6px,transparent 6px 11px)}
.hcz-seil{left:calc(var(--p) * 100%);right:-10px;background:url("img/grafik/hardcore/zuendschnur.webp?v=1") left center / auto 100% repeat-x;filter:drop-shadow(0 2px 2px rgba(0,0,0,.3))}
.hcz-funke{position:absolute;top:var(--sy);left:calc(var(--p) * 100%);width:0;height:0;z-index:2}
.hcz-funke::before{content:"";position:absolute;left:-17px;top:-17px;width:34px;height:34px;border-radius:50%;background:radial-gradient(circle,#FFFDE8 0 18%,#FFD54A 32%,rgba(255,120,30,.75) 52%,rgba(255,80,0,0) 72%);animation:hczFlacker .12s ease-in-out infinite alternate;filter:drop-shadow(0 0 10px #FF9A1F)}
.hcz-funke i{position:absolute;left:-2px;top:-2px;width:4px;height:4px;border-radius:50%;background:#FFE27A;box-shadow:0 0 6px #FF9A1F;animation:hczSpritz .55s linear infinite}
.hcz-funke i:nth-child(1){--dx:-14px;--dy:-22px}.hcz-funke i:nth-child(2){--dx:12px;--dy:-24px;animation-delay:.11s}.hcz-funke i:nth-child(3){--dx:-22px;--dy:10px;animation-delay:.22s}.hcz-funke i:nth-child(4){--dx:20px;--dy:14px;animation-delay:.33s}.hcz-funke i:nth-child(5){--dx:2px;--dy:-28px;animation-delay:.44s}
@keyframes hczFlacker{from{transform:scale(.85)}to{transform:scale(1.15)}}
@keyframes hczSpritz{0%{transform:translate(0,0);opacity:1}100%{transform:translate(var(--dx),var(--dy));opacity:0}}
.hcz-fass{position:relative;flex:none;width:var(--fh);height:var(--fh);z-index:2}
.hcz-fass img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 6px 8px rgba(0,0,0,.3));transform-origin:50% 100%;pointer-events:none;-webkit-user-drag:none}
.hcz-fass .hcz-f2{opacity:0;transform:scale(.4)}
.hczuend.knapp .hcz-fass .hcz-f1{animation:hczWackel .18s ease-in-out infinite alternate}
.hczuend.knapp .hcz-funke::before{filter:drop-shadow(0 0 16px #FF3B1F)}
@keyframes hczWackel{from{transform:rotate(-3deg)}to{transform:rotate(3deg)}}
.hczuend.boom .hcz-f1,.hczuend.weg .hcz-f1{opacity:0}
.hczuend.boom .hcz-f2{animation:hczBoom .6s cubic-bezier(.2,1.5,.4,1) forwards}
.hczuend.weg .hcz-f2{opacity:1;transform:scale(1.1)}
.hczuend.boom .hcz-funke,.hczuend.aus .hcz-funke,.hczuend.weg .hcz-funke,.hczuend.boom .hcz-seil,.hczuend.weg .hcz-seil{display:none}
.hczuend.halt .hcz-funke::before{animation:none;opacity:.6}
@keyframes hczBoom{0%{opacity:0;transform:scale(.4)}60%{opacity:1;transform:scale(1.25)}100%{opacity:1;transform:scale(1.1)}}
.hckopf{display:none!important}
.hczuend{background:rgba(255,255,255,.94);border-radius:26px;padding:14px 18px 14px 22px;box-shadow:0 12px 28px rgba(20,10,60,.28);box-sizing:content-box;margin:6px 0 16px}
.hcz-info{position:absolute;left:0;right:6px;bottom:4px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.hcz-info>span{display:inline-flex;align-items:center;gap:8px;color:#2E2560;font:600 1rem Lexend,system-ui,sans-serif}
.hcz-info img{width:34px;height:34px;object-fit:contain;flex:none}
.hcz-serie b{font:900 1.9rem/1 Lexend,system-ui,sans-serif;color:#E0312B}
.hcz-zeit{padding:5px 16px 5px 8px;border-radius:999px;background:#F3F0FF;font-variant-numeric:tabular-nums}
.hcz-zeit b{font:900 1.6rem/1 Lexend,system-ui,sans-serif;color:#4A2BB0;min-width:1.4em;text-align:right}
.hczuend.knapp .hcz-zeit{background:#FFE3E3}
.hcz-k{display:none}
.hcz-info{flex-wrap:nowrap}
.hczuend.knapp .hcz-zeit b{color:#E0312B;animation:hcpuls .5s ease-in-out infinite alternate;display:inline-block}
.hcz-asche{background:repeating-linear-gradient(90deg,rgba(70,60,70,.3) 0 6px,transparent 6px 11px)}
@media (max-width:600px){.hczuend{--fh:96px;--sy:11px;--sd:6px;padding:10px 12px 10px 14px;border-radius:20px}.hcz-info{bottom:0;gap:6px}.hcz-info>span{font-size:.8rem;gap:5px}.hcz-info img{width:24px;height:24px}.hcz-serie b{font-size:1.4rem}.hcz-zeit{padding:3px 11px 3px 6px}.hcz-zeit b{font-size:1.2rem}.hcz-w{display:none}.hcz-k{display:inline}}
@media (prefers-reduced-motion:reduce){.hcz-funke::before,.hcz-funke i,.hczuend.knapp .hcz-fass .hcz-f1{animation:none}}
.hcende{text-align:center;margin-bottom:16px;border:3px solid #E0312B}
.hcgross{font-family:"Bricolage Grotesque",system-ui,sans-serif;font-size:2rem;font-weight:800;margin-bottom:6px}
.hcpunkte{font-size:1.15rem}.hcbest{font-size:1.05rem}
.hcerkl{text-align:left;background:rgba(23,163,90,.1);border-radius:14px;padding:12px 14px;margin:12px 0}
.hcerkl p{margin:6px 0 0}
.hcregeln{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin:14px 0}
.hcregeln div{display:flex;flex-direction:column;gap:4px}
.hcicon{font-size:2.2rem;display:grid;place-items:center}
.smgitter{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-top:10px}
.smkarte{display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;padding:26px 18px;border:0;border-radius:26px;color:#fff;cursor:pointer;background:linear-gradient(150deg,var(--f1),var(--f2));box-shadow:0 7px 0 rgba(0,0,0,.25);transition:transform .15s}
.smkarte:hover{transform:translateY(-4px)}.smkarte .smemo{font-size:3rem}.smkarte b{font-family:"Bricolage Grotesque",system-ui,sans-serif;font-size:1.6rem}.smkarte span{font-size:.95rem;opacity:.95}
.hero .ctas .big.hardcore{background:linear-gradient(135deg,#E0312B,#F2A000);color:#fff;box-shadow:0 5px 0 #8A1A12}
`;
document.head.appendChild(css);
})();
