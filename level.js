/* easyplay: Level, XP und Abzeichen-Stufen
   Level 1 bis 1000. Jedes Level braucht etwas mehr XP als das vorherige.
   Gesamt-XP für Level L:  33 × (L-1)^1.55
     Level 2 ≈ 33 XP · Level 10 ≈ 1'000 XP · Level 100 ≈ 40'900 XP · Level 500 ≈ 502'000 XP · Level 1000 ≈ 1'472'000 XP
   Bei rund 500 XP pro Tag: Level 10 nach 2 Tagen, Level 100 nach rund 3 Monaten, Level 1000 erst nach vielen Jahren.
   Alles wird im Browser gespeichert (localStorage). Muster wie lernen.js: bestehende Funktionen werden umhüllt. */
(function(){
"use strict";
if(typeof window.render !== "function" || typeof window.answer !== "function") return;

const LS = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};
const KEY = "ep-xp";
const heute = (d) => { const x = d ? new Date(d) : new Date(); return x.getFullYear() + "-" + String(x.getMonth()+1).padStart(2,"0") + "-" + String(x.getDate()).padStart(2,"0"); };
const h = s => { try{ return esc(s); }catch(e){ return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); } };
const zahl = n => Math.round(Number(n || 0)).toLocaleString("de-CH");
const ruhig = () => { try{ return matchMedia("(prefers-reduced-motion: reduce)").matches; }catch(e){ return false; } };

/* ---------- Regeln ---------- */
const MAX_LEVEL = 1000;
const XP = {
  richtig: 10,                 // pro richtige Antwort
  falsch: 1,                   // Mitmachen zählt auch ein bisschen
  faktor: {1:1, 2:1.2, 3:1.5}, // schwierigere Stufen geben mehr
  serieSchritt: 1, serieMax: 5,// richtige Antworten am Stück: +1, +2 … bis +5
  runde: 10,                   // fertig gespielte Runde
  tagesquiz: 50, perfekt: 25,  // Tagesquiz (einmal pro Tag)
  serieTag: 20, serieProTag: 5, serieTagMax: 100, // Lerntag geschafft (5 Fragen): 20 + 5 pro Serientag
  tagesgrenze: 2000, nachGrenze: 0.25            // über 2000 XP am Tag zählt nur noch ein Viertel
};
const gesamtFuer = L => L <= 1 ? 0 : Math.round(33 * Math.pow(L - 1, 1.55));
function levelAus(xp){
  let lo = 1, hi = MAX_LEVEL;
  while(lo < hi){ const m = Math.ceil((lo + hi) / 2); if(gesamtFuer(m) <= xp) lo = m; else hi = m - 1; }
  return lo;
}

/* ---------- Titel (Ränge) ---------- */
const TITEL = [
  [1,"🌱","Neuling","#2FA84F"], [5,"🔎","Fragensammler","#3D7BFE"], [10,"🦊","Wissensfuchs","#FF7A1A"],
  [20,"📚","Bücherwurm","#8A3FE0"], [35,"🧩","Rätselprofi","#E043B8"], [50,"💡","Denker","#E0A800"],
  [75,"🔬","Forscher","#1E9BE0"], [100,"🧭","Weltenbummler","#0FA968"], [150,"🎓","Experte","#3D5AFE"],
  [200,"🥋","Meister","#C0392B"], [300,"🏆","Grossmeister","#D4A017"], [400,"🦉","Weiser","#7B5BD6"],
  [500,"📜","Gelehrter","#A0522D"], [600,"🧠","Genie","#E0457B"], [700,"🌟","Legende","#F5A623"],
  [800,"✨","Sternendenker","#5B6CFF"], [900,"🌌","Universalgenie","#4B2A9B"], [1000,"👑","Krone des Wissens","#C9A100"]
];
const titelFuer = L => { let t = TITEL[0]; for(const x of TITEL) if(L >= x[0]) t = x; return t; };
const naechsterTitel = L => TITEL.find(x => x[0] > L) || null;

/* ---------- Speicher ---------- */
function laden(){
  let d = LS.get(KEY, null);
  if(!d || d.v !== 1){
    // Erster Start: bisherige Leistung anrechnen, damit niemand bei 0 beginnt
    const st = Object.assign({trainFragen:0,trainRichtig:0,testFragen:0,testRichtig:0}, (typeof S !== "undefined" && S.stats) || {});
    const richtig = (+st.trainRichtig||0) + (+st.testRichtig||0), fragen = (+st.trainFragen||0) + (+st.testFragen||0);
    const tq = Object.keys(LS.get("ep-tagesquiz", {})).length;
    const start = Math.max(0, Math.round(richtig * 8 + Math.max(0, fragen - richtig) * XP.falsch + tq * XP.tagesquiz));
    d = {v:1, xp:start, tage:{}, serieTag:"", abz:null, lvl:levelAus(start), start};
    LS.set(KEY, d);
  }
  return d;
}
let D = laden();
function speichern(){ const ks = Object.keys(D.tage).sort(); while(ks.length > 60) delete D.tage[ks.shift()]; LS.set(KEY, D); }

function stand(){
  const xp = D.xp, L = levelAus(xp), von = gesamtFuer(L), bis = L >= MAX_LEVEL ? von : gesamtFuer(L + 1);
  const t = titelFuer(L), nt = naechsterTitel(L);
  return {xp, level:L, von, bis, imLevel:xp - von, proLevel:Math.max(1, bis - von), anteil:L >= MAX_LEVEL ? 1 : (xp - von) / Math.max(1, bis - von),
    titel:{lvl:t[0], emo:t[1], name:t[2], farbe:t[3]}, naechster:nt ? {lvl:nt[0], emo:nt[1], name:nt[2]} : null, heute:D.tage[heute()] || 0, max:L >= MAX_LEVEL};
}

/* ---------- Abzeichen-Stufen ---------- */
const STUFEN = [["Bronze","#C68346"],["Silber","#9AA4B5"],["Gold","#E0A800"],["Platin","#3FB6C9"],["Diamant","#5B8CFF"],["Regenbogen","#E043B8"]];
function werte(){
  const st = Object.assign({trainRuns:0,trainFragen:0,trainRichtig:0,testRuns:0,testFragen:0,testRichtig:0}, (typeof S !== "undefined" && S.stats) || {});
  const th = LS.get("ep-lernthemen", {}), tq = LS.get("ep-tagesquiz", {});
  let serie = {best:0}; try{ serie = window.EP_LERNEN.serie(); }catch(e){}
  return { level:levelAus(D.xp), richtig:st.trainRichtig + st.testRichtig, runden:st.trainRuns + st.testRuns, serie:serie.best || 0,
    tagesquiz:Object.keys(tq).length, perfekt:Object.values(tq).filter(x => x && x.r === x.n).length,
    geuebt:+LS.get("ep-fehler-geuebt", 0) || 0, themen:Object.keys(th).filter(t => !t.startsWith("kt_") && th[t][1] >= 10).length,
    kantone:Object.keys(th).filter(t => t.startsWith("kt_") && th[t][0] >= 10).length };
}
const FAMILIEN = [
  ["lvl",  "⭐", "Aufsteiger",      "Level erreicht",                 "level",    [10, 50, 100, 250, 500, 1000]],
  ["rich", "✅", "Besserwisser",    "Fragen richtig beantwortet",     "richtig",  [250, 2500, 10000, 25000, 50000, 100000]],
  ["ser",  "🔥", "Feuer und Flamme","Tage am Stück gelernt",          "serie",    [14, 60, 100, 200, 365, 730]],
  ["tq",   "📅", "Tagesquiz-Held",  "Tagesquiz gelöst",               "tagesquiz",[25, 50, 100, 250, 500, 1000]],
  ["perf", "🎯", "Scharfschütze",   "Tagesquiz ohne Fehler",          "perfekt",  [5, 20, 50, 100, 200, 365]],
  ["feh",  "🩹", "Fehlerjäger",     "Fehler ausgebügelt",             "geuebt",   [50, 200, 500, 1000, 2500, 5000]],
  ["run",  "🎮", "Dauerspieler",    "Runden fertig gespielt",         "runden",   [100, 250, 500, 1000, 2500, 5000]],
  ["the",  "🗺️", "Alleswisser",     "Themen mit je 10 Antworten",     "themen",   [15, 30, 45, 60, 70, 75]],
  ["kt",   "🇨🇭", "Schweiz-Profi",   "Kantone mit je 10 richtigen",    "kantone",  [3, 8, 13, 18, 23, 26]]
];
function familien(){
  const w = werte();
  return FAMILIEN.map(([id, emo, name, text, feld, grenzen]) => {
    const wert = w[feld] || 0; let stufe = 0; while(stufe < grenzen.length && wert >= grenzen[stufe]) stufe++;
    return {id, emo, name, text, wert, stufe, grenzen, naechste:grenzen[stufe] ?? null};
  });
}
const abzIds = () => { const r = []; familien().forEach(f => { for(let i = 0; i < f.stufe; i++) r.push(f.id + i); }); return r; };

/* ---------- Gestaltung ---------- */
const css = document.createElement("style");
css.textContent = `
.lvkarte{display:flex;align-items:center;gap:16px;max-width:980px;margin:12px auto 4px;background:var(--surface);border:3px solid var(--line);border-radius:24px;padding:12px 18px;cursor:pointer;font:inherit;color:inherit;text-align:left;width:100%;transition:transform .15s,border-color .15s}
.lvkarte:hover{transform:translateY(-2px);border-color:var(--lvf)}
.lvring{--p:0;flex:none;width:68px;height:68px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(var(--lvf) calc(var(--p)*1%),color-mix(in srgb,var(--lvf) 16%,var(--line)) 0)}
.lvring b{width:54px;height:54px;border-radius:50%;background:var(--surface);display:flex;flex-direction:column;align-items:center;justify-content:center;font:800 1.25rem/1 "Bricolage Grotesque","Fredoka",system-ui,sans-serif;color:var(--lvf)}
.lvring b small{display:block;font-size:.5rem;font-weight:700;letter-spacing:.06em;color:var(--muted,#5D5C80);margin-bottom:2px;line-height:1}
.lvring.gross{width:120px;height:120px}.lvring.gross b{width:96px;height:96px;font-size:2.2rem}.lvring.gross b small{font-size:.75rem}
.lvtext{flex:1;min-width:0}
.lvtext .t{font-weight:800;font-size:1.08rem;display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.lvtext .t i{font-style:normal;font-weight:600;font-size:.8rem;color:#fff;background:var(--lvf);border-radius:999px;padding:2px 9px}
.lvbar{height:12px;border-radius:999px;background:color-mix(in srgb,var(--lvf) 14%,var(--line));overflow:hidden;margin:7px 0 4px}
.lvbar i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--lvf),color-mix(in srgb,var(--lvf) 55%,#E043B8));transition:width .6s}
.lvtext small{color:var(--muted,#5D5C80);font-size:.84rem}
.lvheute{flex:none;text-align:center;font-weight:800;color:var(--lvf);font-size:1.05rem;line-height:1.1}
.lvheute small{display:block;font-weight:500;font-size:.72rem;color:var(--muted,#5D5C80)}
@media (max-width:560px){.lvkarte{padding:10px 12px;gap:12px}.lvring{width:56px;height:56px}.lvring b{width:44px;height:44px;font-size:1.05rem}.lvheute{display:none}}
.xpflug{position:fixed;right:16px;top:96px;z-index:9998;pointer-events:none;background:linear-gradient(135deg,#FFE34D,#FFB347);color:#1B2240;font:800 1.15rem "Bricolage Grotesque","Fredoka",sans-serif;border-radius:999px;padding:6px 16px;box-shadow:0 10px 24px -8px rgba(0,0,0,.4);animation:xpflug 1.3s ease-out forwards}
@keyframes xpflug{0%{opacity:0;transform:translateY(14px) scale(.8)}15%{opacity:1;transform:translateY(0) scale(1.08)}70%{opacity:1}100%{opacity:0;transform:translateY(-36px) scale(1)}}
.lvtoast{position:fixed;left:50%;top:16px;transform:translateX(-50%);z-index:9998;background:var(--surface);color:var(--ink);border:3px solid var(--lvf,#E0A800);border-radius:18px;padding:10px 16px;font-weight:700;box-shadow:0 14px 30px -12px rgba(0,0,0,.45);display:flex;gap:10px;align-items:center;max-width:92vw;animation:lvtoast 4s ease forwards}
.lvtoast .e{font-size:1.8rem}
.lvtoast small{display:block;font-weight:500;color:var(--muted,#5D5C80)}
@keyframes lvtoast{0%{opacity:0;transform:translate(-50%,-20px)}8%,85%{opacity:1;transform:translate(-50%,0)}100%{opacity:0;transform:translate(-50%,-20px)}}
.lvup{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;background:rgba(16,21,44,.55);backdrop-filter:blur(4px);animation:lvfade .25s ease}
@keyframes lvfade{from{opacity:0}}
.lvup .box{position:relative;background:var(--surface);color:var(--ink);border-radius:30px;padding:28px 30px 22px;text-align:center;max-width:min(380px,90vw);box-shadow:0 30px 60px -20px rgba(0,0,0,.6);animation:lvpop .45s cubic-bezier(.2,1.5,.4,1)}
@keyframes lvpop{from{transform:scale(.6);opacity:0}}
.lvup .box .lvring{margin:0 auto 10px}
.lvup h2{margin:6px 0 2px;font:800 2rem "Bricolage Grotesque","Fredoka",sans-serif}
.lvup p{margin:4px 0;color:var(--muted,#5D5C80)}
.lvup .neutitel{display:inline-flex;gap:8px;align-items:center;margin:10px 0 4px;background:var(--lvf);color:#fff;border-radius:999px;padding:6px 16px;font-weight:800}
.lvup button{margin-top:14px}
.lvup .konf{position:absolute;left:50%;top:40%;font-size:1.5rem;pointer-events:none;animation:lvkonf 1.4s ease-out forwards}
@keyframes lvkonf{to{transform:translate(var(--x),var(--y)) rotate(260deg);opacity:0}}
.lvprofil .kopf{display:flex;gap:20px;align-items:center;flex-wrap:wrap}
.lvprofil .kopf .lvtext{min-width:220px}
.lvprofil .zahlen{display:flex;gap:10px;flex-wrap:wrap;margin-top:8px}
.lvprofil .zahlen span{background:color-mix(in srgb,var(--lvf) 10%,var(--surface));border:2px solid var(--line);border-radius:14px;padding:6px 12px;font-size:.88rem}
.lvprofil .zahlen b{font-size:1rem}
.lvtitel{display:flex;gap:8px;overflow-x:auto;padding:6px 2px 10px;margin-top:6px;scrollbar-width:thin}
.lvtitel div{flex:0 0 auto;min-width:96px;text-align:center;border:2px solid var(--line);border-radius:16px;padding:8px 6px}
.lvtitel div .e{font-size:1.6rem;display:block}
.lvtitel div b{display:block;font-size:.8rem}
.lvtitel div small{font-size:.7rem;color:var(--muted,#5D5C80)}
.lvtitel div.zu{opacity:.4;filter:grayscale(1)}
.lvtitel div.jetzt{border-color:var(--lvf);background:color-mix(in srgb,var(--lvf) 12%,var(--surface))}
.famgitter{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px;margin-top:10px}
.fam{border:2px solid var(--line);border-radius:18px;padding:12px;display:grid;grid-template-columns:auto 1fr;gap:4px 12px;align-items:center}
.fam .med{grid-row:span 3;width:52px;height:52px;border-radius:50%;display:grid;place-items:center;font-size:1.6rem;background:var(--mf,#E3E7F2);box-shadow:inset 0 0 0 4px rgba(255,255,255,.55)}
.fam.leer .med{filter:grayscale(1);opacity:.45}
.fam b{font-size:.95rem}
.fam small{color:var(--muted,#5D5C80);font-size:.78rem}
.fam .pkt{display:flex;gap:4px;margin-top:2px}
.fam .pkt i{width:14px;height:6px;border-radius:3px;background:var(--line)}
.fam .pkt i.an{background:var(--c)}
.fam .vb{height:7px;border-radius:4px;background:var(--line);overflow:hidden}
.fam .vb i{display:block;height:100%;background:var(--violett,#8A3FE0)}
.xprunde{display:inline-flex;gap:8px;align-items:center;background:linear-gradient(135deg,#FFF4C2,#FFE3A3);color:#5A3E00;border-radius:999px;padding:6px 14px;font-weight:800;margin:4px 0}
`;
document.head.appendChild(css);

/* ---------- Anzeigen ---------- */
function ringHTML(s, gross){ return `<span class="lvring${gross ? " gross" : ""}" style="--lvf:${s.titel.farbe};--p:${Math.round(s.anteil * 100)}"><b><small>LEVEL</small>${s.level}</b></span>`; }
function karteHTML(){
  const s = stand();
  return `<button type="button" class="lvkarte" id="lvKarte" style="--lvf:${s.titel.farbe}" aria-label="Level ${s.level}, ${h(s.titel.name)}. Zum Profil">
    ${ringHTML(s)}
    <span class="lvtext"><span class="t">${s.titel.emo} ${h(s.titel.name)} <i>Level ${s.level}</i></span>
      <span class="lvbar"><i style="width:${Math.round(s.anteil * 100)}%"></i></span>
      <small>${s.max ? "Höchstes Level erreicht. Du bist eine Krone des Wissens!" : `${zahl(s.imLevel)} / ${zahl(s.proLevel)} XP · noch ${zahl(s.bis - s.xp)} XP bis Level ${s.level + 1}`}</small></span>
    <span class="lvheute">+${zahl(s.heute)}<small>XP heute</small></span>
  </button>`;
}
function xpFlug(n){
  if(!n || ruhig()) return;
  document.querySelectorAll(".xpflug").forEach(e => e.remove());
  const el = document.createElement("div"); el.className = "xpflug"; el.textContent = "+" + n + " XP";
  document.body.appendChild(el); setTimeout(() => el.remove(), 1400);
}
let toastZeit = 0;
function toast(emo, titel, text, farbe){
  const warte = Math.max(0, toastZeit - Date.now()); toastZeit = Date.now() + warte + 4100;
  setTimeout(() => { const el = document.createElement("div"); el.className = "lvtoast"; el.setAttribute("role", "status"); if(farbe) el.style.setProperty("--lvf", farbe);
    el.innerHTML = `<span class="e">${emo}</span><span>${h(titel)}<small>${h(text)}</small></span>`; document.body.appendChild(el); setTimeout(() => el.remove(), 4100); }, warte);
}
function levelUp(alt, neu){
  const s = stand(), altT = titelFuer(alt), neuerTitel = titelFuer(neu)[0] !== altT[0];
  document.querySelectorAll(".lvup").forEach(e => e.remove());
  const el = document.createElement("div"); el.className = "lvup"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", "Level aufgestiegen");
  el.style.setProperty("--lvf", s.titel.farbe);
  el.innerHTML = `<div class="box">${ringHTML(s, true)}<h2>Level ${neu}!</h2>
    <p>${neu - alt > 1 ? `Du bist ${neu - alt} Level aufgestiegen.` : "Du bist ein Level aufgestiegen."}</p>
    ${neuerTitel ? `<span class="neutitel">${s.titel.emo} Neuer Titel: ${h(s.titel.name)}</span>` : ""}
    ${s.naechster ? `<p><small>Nächster Titel: ${s.naechster.emo} ${h(s.naechster.name)} ab Level ${s.naechster.lvl}</small></p>` : ""}
    <button class="big" type="button">Weiter</button></div>`;
  document.body.appendChild(el);
  if(!ruhig()) for(let i = 0; i < 22; i++){ const k = document.createElement("i"); k.className = "konf"; k.textContent = ["🎉","⭐","✨","🎊"][i % 4];
    k.style.setProperty("--x", (Math.random() * 360 - 180) + "px"); k.style.setProperty("--y", (Math.random() * -260 - 20) + "px"); el.querySelector(".box").appendChild(k); }
  const zu = () => el.remove();
  el.querySelector("button").onclick = zu; el.onclick = e => { if(e.target === el) zu(); };
  const tast = e => { if(e.key === "Escape"){ zu(); removeEventListener("keydown", tast); } }; addEventListener("keydown", tast);
  setTimeout(() => { try{ el.querySelector("button").focus(); }catch(e){} }, 50);
}
function karteAktualisieren(){
  const alt = document.getElementById("lvKarte"); if(!alt) return;
  alt.outerHTML = karteHTML(); const neu = document.getElementById("lvKarte"); if(neu) neu.onclick = () => go("profil");
}

/* ---------- XP vergeben ---------- */
function abzeichenPruefen(still){
  const ids = abzIds();
  if(!Array.isArray(D.abz)){ D.abz = ids; speichern(); return; }
  const neu = ids.filter(i => !D.abz.includes(i));
  if(!neu.length) return;
  D.abz = Array.from(new Set(D.abz.concat(ids))); speichern();
  if(still) return;
  const fam = familien();
  neu.forEach(i => { const f = fam.find(x => i.startsWith(x.id) && /^\d+$/.test(i.slice(x.id.length))); if(!f) return; const st = +i.slice(f.id.length);
    toast(f.emo, `Neues Abzeichen: ${f.name} ${STUFEN[st][0]}`, `${zahl(f.grenzen[st])} ${f.text}`, STUFEN[st][1]); });
}
function gib(n, grund){
  n = Math.max(0, Math.round(n)); if(!n) return 0;
  const t = heute(), schon = D.tage[t] || 0;
  if(schon >= XP.tagesgrenze) n = Math.max(1, Math.round(n * XP.nachGrenze));
  const alt = levelAus(D.xp);
  D.xp = Math.min(gesamtFuer(MAX_LEVEL), D.xp + n); D.tage[t] = schon + n;
  const neu = levelAus(D.xp);
  if(neu > (D.lvl || 1)){ D.lvl = neu; speichern(); levelUp(alt, neu); }
  else speichern();
  return n;
}

const vorAnswer = window.answer;
window.answer = function(i){
  const Q = S.quiz, f = Q && Q.list && Q.list[Q.i], schon = Q && Q.picked != null;
  const r = vorAnswer.apply(this, arguments);
  try{
    if(!f || schon || !f.opts || !f.opts[i]) return r;
    const ok = !!f.opts[i].ok;
    let n;
    if(ok){ Q._xpSerie = (Q._xpSerie || 0) + 1;
      n = XP.richtig * (XP.faktor[+f.l] || 1) + Math.min(XP.serieMax, (Q._xpSerie - 1) * XP.serieSchritt); }
    else { Q._xpSerie = 0; n = XP.falsch; }
    const bekam = gib(n, ok ? "richtig" : "falsch");
    Q._xp = (Q._xp || 0) + bekam;
    if(ok) xpFlug(bekam);
    // Lerntag geschafft: Bonus einmal pro Tag
    let s = null; try{ s = window.EP_LERNEN.serie(); }catch(e){}
    if(s && s.aktiv && D.serieTag !== heute()){ D.serieTag = heute(); speichern();
      const b = gib(Math.min(XP.serieTagMax, XP.serieTag + XP.serieProTag * Math.max(0, s.n - 1)), "serie"); Q._xp += b;
      toast("🔥", `Lerntag geschafft! +${b} XP`, s.n > 1 ? `${s.n} Tage am Stück` : "Komm morgen wieder für deine Serie", "#FF8A00"); }
    abzeichenPruefen();
  }catch(e){ console.warn("level.js", e); }
  return r;
};

const vorFlush = window.flushRun;
if(typeof vorFlush === "function"){
  window.flushRun = async function(finished){
    const Q = S.quiz;
    try{
      if(Q && !Q.flushed && !Q._xpFertig && finished && Q.seen){
        Q._xpFertig = true; let b = gib(XP.runde, "runde");
        if(Q.tagesquiz && !(LS.get("ep-tagesquiz", {})[Q.tagesquiz])){
          b += gib(XP.tagesquiz, "tagesquiz");
          if(Q.score === Q.list.length) b += gib(XP.perfekt, "perfekt");
        }
        Q._xp = (Q._xp || 0) + b;
      }
    }catch(e){ console.warn("level.js", e); }
    const r = await vorFlush.apply(this, arguments);
    try{ abzeichenPruefen(); }catch(e){}
    return r;
  };
}

/* ---------- Startseite: Level-Karte ---------- */
const vorHome = window.renderHome;
if(typeof vorHome === "function"){
  window.renderHome = function(){
    const r = vorHome.apply(this, arguments);
    try{ if(!document.getElementById("lvKarte")){
      const nach = document.getElementById("lernleiste") || document.querySelector("#app .hero");
      if(nach){ nach.insertAdjacentHTML("afterend", karteHTML()); document.getElementById("lvKarte").onclick = () => go("profil"); } } }catch(e){ console.warn("level.js", e); }
    return r;
  };
}

/* ---------- Ende einer Runde: XP anzeigen ---------- */
const vorDone = window.renderDone;
if(typeof vorDone === "function"){
  window.renderDone = function(){
    const r = vorDone.apply(this, arguments);
    try{ const Q = S.quiz, h1 = document.querySelector("#app .done h1");
      if(Q && Q._xp && h1 && !document.getElementById("xpRunde")){ const s = stand();
        h1.insertAdjacentHTML("afterend", `<p id="xpRunde"><span class="xprunde">⭐ +${zahl(Q._xp)} XP · Level ${s.level} · ${s.titel.emo} ${h(s.titel.name)}</span></p>`); } }catch(e){}
    return r;
  };
}

/* ---------- Profil: Level, Titel und Abzeichen-Stufen ---------- */
function profilHTML(){
  const s = stand(), fam = familien(), w = werte();
  const total = fam.reduce((a, f) => a + f.grenzen.length, 0), hat = fam.reduce((a, f) => a + f.stufe, 0);
  return `<h2>⭐ Level und Titel</h2>
    <div class="kopf">${ringHTML(s, true)}
      <div class="lvtext"><span class="t">${s.titel.emo} ${h(s.titel.name)} <i>Level ${s.level} von ${MAX_LEVEL}</i></span>
        <span class="lvbar"><i style="width:${Math.round(s.anteil * 100)}%"></i></span>
        <small>${s.max ? "Alle Level geschafft!" : `${zahl(s.imLevel)} / ${zahl(s.proLevel)} XP in diesem Level · noch ${zahl(s.bis - s.xp)} XP bis Level ${s.level + 1}`}</small>
        <div class="zahlen"><span><b>${zahl(s.xp)}</b> XP gesamt</span><span><b>+${zahl(s.heute)}</b> XP heute</span>${s.naechster ? `<span>Nächster Titel: ${s.naechster.emo} <b>${h(s.naechster.name)}</b> ab Level ${s.naechster.lvl}</span>` : ""}</div>
      </div></div>
    <p class="help" style="margin-top:12px">So sammelst du XP: richtige Antwort ${XP.richtig} XP (Könner ×1.2, Profis ×1.5), richtige Antworten am Stück bis +${XP.serieMax}, fertige Runde +${XP.runde}, Tagesquiz +${XP.tagesquiz} (ohne Fehler +${XP.perfekt} extra), Lerntag geschafft +${XP.serieTag} und mehr mit langer Serie. Jedes Level braucht etwas mehr XP als das letzte.</p>
    <h3 style="margin:14px 0 2px">Titel</h3>
    <div class="lvtitel">${TITEL.map(t => `<div class="${s.level >= t[0] ? (s.titel.lvl === t[0] ? "jetzt" : "") : "zu"}"><span class="e">${t[1]}</span><b>${h(t[2])}</b><small>ab Level ${t[0]}</small></div>`).join("")}</div>
    <h3 style="margin:14px 0 2px">Abzeichen-Stufen <small style="font-weight:400;color:var(--muted,#5D5C80)">${hat} von ${total}</small></h3>
    <p class="help">Jedes Abzeichen hat 6 Stufen: ${STUFEN.map(x => x[0]).join(", ")}.</p>
    <div class="famgitter">${fam.map(f => { const st = f.stufe ? STUFEN[f.stufe - 1] : null, ziel = f.naechste, vor = f.stufe ? f.grenzen[f.stufe - 1] : 0;
      const anteil = ziel ? Math.max(0, Math.min(1, (f.wert - vor) / (ziel - vor))) : 1;
      return `<div class="fam${f.stufe ? "" : " leer"}" style="--mf:${st ? st[1] : "#E3E7F2"}" title="${h(f.text)}"><span class="med">${f.emo}</span>
        <b>${h(f.name)}${st ? ` · ${st[0]}` : ""}</b>
        <small>${ziel ? `${zahl(f.wert)} / ${zahl(ziel)} ${h(f.text)}` : `Alle Stufen geschafft (${zahl(f.wert)})`}</small>
        <span><span class="vb"><i style="width:${Math.round(anteil * 100)}%"></i></span><span class="pkt">${STUFEN.map((x, k) => `<i class="${k < f.stufe ? "an" : ""}" style="--c:${x[1]}"></i>`).join("")}</span></span></div>`; }).join("")}</div>`;
}
const vorProfil = window.renderProfil;
if(typeof vorProfil === "function"){
  window.renderProfil = function(){
    const r = vorProfil.apply(this, arguments);
    try{ const app = document.getElementById("app"); if(S.screen === "profil" && app && !document.getElementById("lvProfil")){
      const box = document.createElement("section"); box.className = "statcard lvprofil"; box.id = "lvProfil"; box.style.setProperty("--lvf", stand().titel.farbe);
      box.innerHTML = profilHTML();
      const vor = document.getElementById("abzProfil"); if(vor) app.insertBefore(box, vor); else app.appendChild(box);
    } }catch(e){ console.warn("level.js", e); }
    return r;
  };
}

// Beim Laden still prüfen, damit bestehende Abzeichen nicht alle als «neu» erscheinen
try{ abzeichenPruefen(true); }catch(e){}
addEventListener("storage", e => { if(e.key === KEY){ D = laden(); karteAktualisieren(); } });

window.EP_LEVEL = { stand, gesamtFuer, levelAus, familien, TITEL, XP, MAX_LEVEL, gib };
})();
