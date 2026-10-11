/* easyplay: Hardcore-Modus
   Fragen aus allen Themen und Stufen, ohne Ende, bis zur ersten falschen Antwort.
   30 Sekunden pro Frage. Eigene Hardcore-Rangliste (Feld «hc» im Spielerprofil). */
(function(){
"use strict";
const HC_SEK = 30;
const HC = { timer:null, seen:new Set(), f:null, opts:null, n:0, zeit:0, t0:0, rest:HC_SEK, vorbei:false, grund:"", pick:null, neu:false };

function hcPool(){
  const extra = (S && S.extra) || [];
  return FRAGEN.concat(extra).filter(f => f && f.q && Array.isArray(f.a) && f.a.length >= 2);
}
function hcNaechste(){
  const pool = hcPool();
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
  if(S.online){ try{ const {vorname, nachname, ...oeffentlich} = S.profil; await S.db.doc(`spieler/${S.uid}`).set(oeffentlich); }catch(e){ console.warn("hardcore speichern", e); } }
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
    if(zahl) zahl.textContent = Math.ceil(HC.rest);
    const box = document.getElementById("hcUhr"); if(box) box.classList.toggle("knapp", HC.rest <= 5);
    if(HC.rest <= 0){ HC.pick = -1; HC.zeit += HC_SEK*1000; hcEnde("zeit"); }
  }, 100);
}

function themaName(f){ try{ return (THEMA[f.t] && THEMA[f.t].name) || ""; }catch(e){ return ""; } }

function hcZeichne(){
  const f = HC.f, answered = HC.pick!=null;
  const kopf = `<div class="hckopf"><span class="hcserie">🔥 <b>${HC.n}</b> ${HC.n===1?"richtige Antwort":"richtige Antworten"}</span>
    <span class="hcuhr" id="hcUhr"><span id="hcSek">${Math.ceil(HC.rest)}</span> s</span></div>
    <div class="hcbalken"><i id="hcBar" style="width:${HC.rest/HC_SEK*100}%"></i></div>`;
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
      <div class="hcgross">${HC.grund==="zeit" ? "⏰ Zeit abgelaufen!" : "💥 Falsche Antwort!"}</div>
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
      <div><b>🌍 Alles gemischt</b><span>Fragen aus allen Themen und allen drei Stufen.</span></div>
      <div><b>♾️ Ohne Ende</b><span>Es geht so lange weiter, bis du eine Frage falsch beantwortest.</span></div>
      <div><b>⏱️ 30 Sekunden</b><span>Pro Frage hast du 30 Sekunden Zeit. Ist die Zeit um, ist das Spiel vorbei.</span></div>
      <div><b>🏆 Eigene Rangliste</b><span>Es zählt deine längste Serie. Bei Gleichstand gewinnt, wer schneller war.</span></div>
    </div>
    ${S.profil ? `<p class="hcbest" style="text-align:center">Dein Rekord: <b>${best}</b> ${best===1?"Frage":"Fragen"}</p>` : `<p class="hcbest" style="text-align:center">Ohne Profil kannst du spielen, kommst aber nicht in die Rangliste.</p>`}
    <div class="row" style="justify-content:center"><button class="big gold" type="button" id="hcLos">🔥 Hardcore starten</button><button class="big alt" type="button" id="hcRang2">🏆 Hardcore-Rangliste</button></div>
  </div>`;
  $("#hcLos").onclick=hcStart; $("#hcRang2").onclick=()=>go("hcboard");
}

function hcBoard(){
  hcStop();
  const meId = S.online ? S.uid : "me";
  let list = S.online ? (S.spieler||[]) : (S.profil ? [{...S.profil, id:"me"}] : []);
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
    ${S.online? "" : `<p class="note">In dieser Ansicht gibt es keine gemeinsame Rangliste, du siehst nur dein eigenes Ergebnis.</p>`}
  </div>`;
  $("#hcLos3").onclick=hcStart; $("#hcZurRl").onclick=()=>go("board");
  document.querySelectorAll("[data-pid]").forEach(el=>{ const auf=()=>{ S.spielerId=el.dataset.pid; go("spieler"); }; el.onclick=auf; el.onkeydown=e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); auf(); } }; });
}

const HC_SEITEN = { hardcoreinfo:hcInfo, hardcore:()=>{ hcZeichne(); if(!HC.vorbei && HC.pick==null) hcTick(); }, hcboard:hcBoard };
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

// Menü
if(typeof window.renderNav==="function"){
  const vorNav = window.renderNav;
  window.renderNav = function(){
    const r = vorNav.apply(this, arguments);
    try{ const menu=document.getElementById("hauptmenue");
      if(menu && !menu.querySelector("[data-hcm]")){
        const ref=menu.querySelector('[data-m="board"]');
        const w=document.createElement("div"); w.innerHTML=`<button role="menuitem" type="button" data-hcm="hardcoreinfo">🔥 Hardcore</button><button role="menuitem" type="button" data-hcm="hcboard">🔥 Hardcore-Rangliste</button>`;
        const items=[...w.children]; if(ref){ items.reverse().forEach(x=>ref.after(x)); } else items.forEach(x=>menu.appendChild(x));
        menu.querySelectorAll("[data-hcm]").forEach(b=>b.onclick=()=>{ const btn=document.getElementById("navMenu"); if(btn && !menu.hidden) btn.click(); try{ if(S.libModus && typeof setLibModus==="function"){ S.libModus=false; document.documentElement.dataset.mode="spiel"; } }catch(e){} go(b.dataset.hcm); });
      } }catch(e){}
    return r;
  };
}
// Startseite: Knopf «Hardcore»
if(typeof window.renderHome==="function"){
  const vorHome = window.renderHome;
  window.renderHome = function(){
    const r = vorHome.apply(this, arguments);
    try{ const c=document.querySelector(".hero .ctas"); if(c && !document.getElementById("hcHome")){ const b=document.createElement("button"); b.className="big hardcore"; b.type="button"; b.id="hcHome";
      b.innerHTML=`<span class="cicon" aria-hidden="true">🔥</span> Hardcore`; b.onclick=()=>go("hardcoreinfo"); c.prepend(b); } }catch(e){}
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
.hcende{text-align:center;margin-bottom:16px;border:3px solid #E0312B}
.hcgross{font-family:"Bricolage Grotesque",system-ui,sans-serif;font-size:2rem;font-weight:800;margin-bottom:6px}
.hcpunkte{font-size:1.15rem}.hcbest{font-size:1.05rem}
.hcerkl{text-align:left;background:rgba(23,163,90,.1);border-radius:14px;padding:12px 14px;margin:12px 0}
.hcerkl p{margin:6px 0 0}
.hcregeln{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin:14px 0}
.hcregeln div{display:flex;flex-direction:column;gap:4px}
.hcicon{font-size:2.2rem;display:grid;place-items:center}
.hero .ctas .big.hardcore{background:linear-gradient(135deg,#E0312B,#F2A000);color:#fff;box-shadow:0 5px 0 #8A1A12}
`;
document.head.appendChild(css);
})();
