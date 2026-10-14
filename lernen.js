/* easyplay: Lernfunktionen
   Fehler üben, Tagesquiz, Lernserie (Tage am Stück), Abzeichen und Elternansicht.
   Alles wird nur im Browser gespeichert (localStorage). Muster wie hardcore.js: bestehende Funktionen werden umhüllt. */
(function(){
"use strict";
if(typeof window.render !== "function" || typeof window.answer !== "function") return;

const LS = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};
const K = { fehler:"ep-fehler", tage:"ep-lerntage", themen:"ep-lernthemen", tq:"ep-tagesquiz", geuebt:"ep-fehler-geuebt" };
const heute = (d) => { const x = d ? new Date(d) : new Date(); return x.getFullYear() + "-" + String(x.getMonth()+1).padStart(2,"0") + "-" + String(x.getDate()).padStart(2,"0"); };
const gestern = () => heute(Date.now() - 864e5);
const nrVon = f => { try{ return frageNr(f) || 0; }catch(e){ return +f.nr || 0; } };
const h = s => { try{ return esc(s); }catch(e){ return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); } };
const zahl = n => Number(n || 0).toLocaleString("de-CH");

/* ---------- Antworten mitschreiben ---------- */
const vorAnswer = window.answer;
window.answer = function(i){
  const Q = S.quiz, f = Q && Q.list && Q.list[Q.i], schon = Q && Q.picked != null;
  const r = vorAnswer.apply(this, arguments);
  try{
    if(!f || schon || !f.opts || !f.opts[i]) return r;
    const ok = !!f.opts[i].ok, nr = nrVon(f), t = heute();
    // Fehlerliste: falsch = rein, zweimal richtig hintereinander = raus
    if(nr){ const fl = LS.get(K.fehler, {});
      if(!ok){ fl[nr] = {n:((fl[nr]||{}).n||0) + 1, r:0, z:Date.now()}; }
      else if(fl[nr]){ fl[nr].r = (fl[nr].r||0) + 1; if(fl[nr].r >= 2){ delete fl[nr]; LS.set(K.geuebt, LS.get(K.geuebt, 0) + 1); } }
      LS.set(K.fehler, fl); }
    // Lerntage (für Serie und Elternansicht), nur die letzten 120 Tage behalten
    const tg = LS.get(K.tage, {}); tg[t] = (tg[t]||0) + 1;
    const keys = Object.keys(tg).sort(); while(keys.length > 120) delete tg[keys.shift()];
    LS.set(K.tage, tg);
    // Themen: richtig / beantwortet
    if(f.t){ const th = LS.get(K.themen, {}); const e = th[f.t] || [0,0]; e[1]++; if(ok) e[0]++; th[f.t] = e; LS.set(K.themen, th); }
  }catch(e){ console.warn("lernen.js", e); }
  return r;
};

/* ---------- Serie: Tage am Stück mit mindestens 5 beantworteten Fragen ---------- */
function serie(){
  const tg = LS.get(K.tage, {}); const aktiv = d => (tg[d]||0) >= 5;
  let n = 0, d = new Date(); if(!aktiv(heute(d))) d = new Date(Date.now() - 864e5);   // heute noch nicht gelernt: Serie zählt bis gestern
  while(aktiv(heute(d))){ n++; d = new Date(d.getTime() - 864e5); }
  let best = 0, lauf = 0; const alle = Object.keys(tg).sort();
  for(let i = 0; i < alle.length; i++){ if(!aktiv(alle[i])){ lauf = 0; continue; } const vor = alle[i-1]; lauf = (vor && aktiv(vor) && heute(new Date(alle[i]).getTime() - 864e5) === vor) ? lauf + 1 : 1; best = Math.max(best, lauf); }
  return {n, best:Math.max(best, n), heute:(tg[heute()]||0), aktiv:aktiv(heute())};
}

/* ---------- Tagesquiz: jeden Tag 5 Fragen, für alle gleich (pro Stufe) ---------- */
function zufall(seed){ let x = 0; for(const c of seed) x = (x * 31 + c.charCodeAt(0)) >>> 0; return () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }
function tagesFragen(){
  const st = S.stufe || 1, rnd = zufall("easyplay-" + heute() + "-" + st);
  const pool = (typeof alleFragen === "function" ? alleFragen() : FRAGEN).filter(f => f && (+st === 4 || +f.l === +st) && THEMA[f.t] && !f.img && Array.isArray(f.a) && f.a.length === 4);
  const raus = [], themen = new Set();
  for(let k = 0; k < 400 && raus.length < 5 && pool.length; k++){ const f = pool[Math.floor(rnd() * pool.length)]; if(!themen.has(f.t) && !raus.includes(f)){ raus.push(f); themen.add(f.t); } }
  return raus;
}
const tagesquizErledigt = () => (LS.get(K.tq, {})[heute()] || null);
function tagesquizStarten(){
  const l = tagesFragen(); if(!l.length) return;
  startListe(l, "Tagesquiz vom " + new Date().toLocaleDateString("de-CH"));
  if(S.quiz){ S.quiz.tagesquiz = heute(); S.quiz.list = S.quiz.list.slice(0, 5); }
}
function fehlerListe(){
  const fl = LS.get(K.fehler, {}); const nrs = new Set(Object.keys(fl).map(Number));
  if(!nrs.size) return [];
  const seen = new Set();
  return (typeof alleFragen === "function" ? alleFragen() : FRAGEN).filter(f => { const n = nrVon(f); if(!nrs.has(n) || seen.has(n)) return false; seen.add(n); return true; });
}
function fehlerUeben(){ const l = fehlerListe(); if(!l.length) return; startListe(l, "Fehler üben"); }

// Abschluss eines Laufs: Tagesquiz als erledigt markieren
const vorFlush = window.flushRun;
if(typeof vorFlush === "function"){
  window.flushRun = async function(finished){
    const Q = S.quiz;
    try{ if(finished && Q && Q.tagesquiz && Q.seen){ const tq = LS.get(K.tq, {}); tq[Q.tagesquiz] = {r:Q.score, n:Q.list.length}; const ks = Object.keys(tq).sort(); while(ks.length > 400) delete tq[ks.shift()]; LS.set(K.tq, tq); } }catch(e){}
    return vorFlush.apply(this, arguments);
  };
}

/* ---------- Abzeichen ---------- */
function kennzahlen(){
  const st = Object.assign({trainRuns:0,trainFragen:0,trainRichtig:0,testRuns:0,testFragen:0,testRichtig:0}, S.stats || {});
  const th = LS.get(K.themen, {}); const tq = LS.get(K.tq, {});
  const kantone = Object.keys(th).filter(t => t.startsWith("kt_") && th[t][1] >= 3).length;
  return { laeufe: st.trainRuns + st.testRuns, fragen: st.trainFragen + st.testFragen, richtig: st.trainRichtig + st.testRichtig, tests: st.testRuns,
    serie: serie(), tagesquiz: Object.keys(tq).length, perfekt: Object.values(tq).filter(x => x && x.r === x.n).length,
    geuebt: LS.get(K.geuebt, 0), themen: Object.keys(th).filter(t => th[t][1] >= 10).length, kantone, hc: (S.profil && S.profil.hc && S.profil.hc.best) || 0 };
}
const ABZEICHEN = [
  ["start", "🌱", "Erste Schritte", "Erste Runde beendet", k => k.laeufe >= 1],
  ["fleiss10", "📚", "Fleissig", "10 Runden beendet", k => k.laeufe >= 10],
  ["fleiss50", "🎓", "Quiz-Profi", "50 Runden beendet", k => k.laeufe >= 50],
  ["r100", "✅", "100 richtig", "100 Fragen richtig beantwortet", k => k.richtig >= 100],
  ["r1000", "💯", "1'000 richtig", "1'000 Fragen richtig beantwortet", k => k.richtig >= 1000],
  ["r5000", "🧠", "Wissensriese", "5'000 Fragen richtig beantwortet", k => k.richtig >= 5000],
  ["serie3", "🔥", "Dranbleiben", "3 Tage am Stück gelernt", k => k.serie.best >= 3],
  ["serie7", "🔥", "Eine Woche", "7 Tage am Stück gelernt", k => k.serie.best >= 7],
  ["serie30", "🏆", "Ein Monat", "30 Tage am Stück gelernt", k => k.serie.best >= 30],
  ["tq1", "📅", "Tagesquiz", "Erstes Tagesquiz gelöst", k => k.tagesquiz >= 1],
  ["tq10", "🗓️", "Stammgast", "10 Tagesquiz gelöst", k => k.tagesquiz >= 10],
  ["perfekt", "⭐", "Volltreffer", "Ein Tagesquiz ohne Fehler", k => k.perfekt >= 1],
  ["fehler20", "🎯", "Fehlerjäger", "20 Fehler ausgebügelt", k => k.geuebt >= 20],
  ["themen10", "🧭", "Entdecker", "In 10 Themen je 10 Fragen beantwortet", k => k.themen >= 10],
  ["kantone", "🇨🇭", "Kantonskenner", "Fragen zu allen 26 Kantonen beantwortet", k => k.kantone >= 26],
  ["test", "📝", "Prüfling", "Ersten Test abgeschlossen", k => k.tests >= 1],
  ["hc10", "💪", "Hardcore", "10 Fragen am Stück im Hardcore", k => k.hc >= 10]
];
const abzeichen = () => { const k = kennzahlen(); return ABZEICHEN.map(([id, emo, name, text, fn]) => ({id, emo, name, text, hat: !!fn(k)})); };

/* ---------- Gestaltung ---------- */
const css = document.createElement("style");
css.textContent = `
.lernleiste{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:18px auto 6px;max-width:980px}
.lernleiste .lk{background:var(--surface);border:3px solid var(--line);border-radius:22px;padding:14px 16px;display:flex;gap:12px;align-items:center;text-align:left;font:inherit;color:inherit;cursor:pointer;transition:transform .15s,border-color .15s}
.lernleiste .lk:hover:not(:disabled){transform:translateY(-2px);border-color:var(--violett,#8A3FE0)}
.lernleiste .lk:disabled{cursor:default;opacity:.75}
.lernleiste .lk .em{font-size:30px;line-height:1;flex:none}
.lernleiste .lk b{display:block;font-size:17px}
.lernleiste .lk small{display:block;color:var(--muted);font-size:13px;margin-top:2px}
.lernleiste .lk.serie.an{border-color:#ff8a00;background:linear-gradient(135deg,color-mix(in srgb,#ff8a00 14%,var(--surface)),var(--surface))}
.lernleiste .lk.tq.neu{border-color:var(--violett,#8A3FE0)}
@media (max-width:720px){.lernleiste{grid-template-columns:1fr;gap:8px}.lernleiste .lk{padding:12px 14px}}
.abzgitter{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;margin-top:10px}
.abz{border:2px solid var(--line);border-radius:18px;padding:10px;text-align:center}
.abz .e{font-size:32px;display:block}
.abz b{display:block;font-size:14px;margin-top:4px}
.abz small{display:block;color:var(--muted);font-size:12px}
.abz.nein{opacity:.38;filter:grayscale(1)}
.elternseite{max-width:760px;margin:0 auto}
.elternseite .kpis{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin:14px 0}
.elternseite .kpis div{background:var(--surface);border:3px solid var(--line);border-radius:18px;padding:12px}
.elternseite .kpis b{display:block;font-size:24px}
.elternseite .kpis span{color:var(--muted);font-size:13px}
.elternseite .tagesbalken{display:flex;align-items:flex-end;gap:4px;height:90px;margin:8px 0 4px}
.elternseite .tagesbalken i{flex:1;background:var(--violett,#8A3FE0);border-radius:4px 4px 0 0;min-height:2px}
.elternseite table{width:100%;border-collapse:collapse}
.elternseite td,.elternseite th{padding:6px 8px;border-bottom:1px solid var(--line);text-align:left}
`;
document.head.appendChild(css);

/* ---------- Startseite: Serie, Tagesquiz, Fehler üben ---------- */
function lernleiste(){
  const s = serie(), tq = tagesquizErledigt(), nf = Object.keys(LS.get(K.fehler, {})).length;
  return `<div class="lernleiste" id="lernleiste">
    <button type="button" class="lk serie${s.n ? " an" : ""}" data-l="serie"><span class="em">🔥</span><span><b>${s.n ? `${s.n} ${s.n === 1 ? "Tag" : "Tage"} Serie` : "Starte deine Serie"}</b><small>${s.aktiv ? "Heute geschafft, weiter so!" : `Heute noch ${Math.max(0, 5 - s.heute)} Fragen für die Serie`}</small></span></button>
    <button type="button" class="lk tq${tq ? "" : " neu"}" data-l="tq"><span class="em">${tq ? "✅" : "📅"}</span><span><b>Tagesquiz</b><small>${tq ? `Erledigt: ${tq.r} von ${tq.n} richtig. Morgen gibt es neue Fragen.` : "5 Fragen, jeden Tag neu"}</small></span></button>
    <button type="button" class="lk" data-l="fehler"${nf ? "" : " disabled"}><span class="em">🎯</span><span><b>Fehler üben${nf ? ` (${zahl(nf)})` : ""}</b><small>${nf ? "Falsche Fragen nochmals versuchen" : "Noch keine Fehler gesammelt"}</small></span></button>
  </div>`;
}
const vorHome = window.renderHome;
if(typeof vorHome === "function"){
  window.renderHome = function(){
    const r = vorHome.apply(this, arguments);
    try{ const hero = document.querySelector("#app .hero"); if(hero && !document.getElementById("lernleiste")){ hero.insertAdjacentHTML("afterend", lernleiste());
      document.querySelectorAll("#lernleiste [data-l]").forEach(b => b.onclick = () => { const a = b.dataset.l;
        if(a === "tq"){ if(tagesquizErledigt()){ if(!confirm("Das Tagesquiz ist erledigt. Trotzdem nochmals spielen? (zählt nicht nochmals)")) return; startListe(tagesFragen(), "Tagesquiz (Wiederholung)"); if(S.quiz) S.quiz.list = S.quiz.list.slice(0,5); return; } tagesquizStarten(); }
        if(a === "fehler") fehlerUeben();
        if(a === "serie"){ if(!tagesquizErledigt()) tagesquizStarten(); else go("profil"); }
      }); } }catch(e){ console.warn("lernen.js", e); }
    return r;
  };
}

/* ---------- Profil: Abzeichen und Elternlink ---------- */
function elternDaten(){
  const k = kennzahlen(), tg = LS.get(K.tage, {}), th = LS.get(K.themen, {});
  const tage = []; for(let i = 13; i >= 0; i--){ tage.push(tg[heute(Date.now() - i*864e5)] || 0); }
  const themen = Object.entries(th).filter(([t, e]) => e[1] >= 5).map(([t, e]) => [t, e[0], e[1]]).sort((a, b) => b[2] - a[2]).slice(0, 24);
  return {v:1, n:(S.profil && S.profil.name) || "", d:heute(), s:S.stufe || 1, l:k.laeufe, f:k.fragen, r:k.richtig, se:k.serie.n, sb:k.serie.best, tq:k.tagesquiz,
    fe:Object.keys(LS.get(K.fehler, {})).length, ab:abzeichen().filter(a => a.hat).map(a => a.id), t:tage, th:themen};
}
const vorProfil = window.renderProfil;
if(typeof vorProfil === "function"){
  window.renderProfil = function(){
    const r = vorProfil.apply(this, arguments);
    try{ const app = document.getElementById("app"); if(S.screen === "profil" && app && !document.getElementById("abzProfil")){
      const az = abzeichen(), n = az.filter(a => a.hat).length, s = serie();
      const box = document.createElement("section"); box.className = "statcard"; box.id = "abzProfil";
      box.innerHTML = `<h2>🏅 Abzeichen <small style="font-weight:400;color:var(--muted)">${n} von ${az.length}</small></h2>
        <p class="help">Serie: ${s.n} ${s.n === 1 ? "Tag" : "Tage"} · Rekord: ${s.best} · Tagesquiz gelöst: ${kennzahlen().tagesquiz}</p>
        <div class="abzgitter">${az.map(a => `<div class="abz${a.hat ? "" : " nein"}" title="${h(a.text)}"><span class="e">${a.emo}</span><b>${h(a.name)}</b><small>${h(a.text)}</small></div>`).join("")}</div>`;
      app.appendChild(box);
      const el = document.createElement("section"); el.className = "statcard"; el.id = "elternProfil";
      el.innerHTML = `<h2>👪 Für Eltern</h2><p class="help">Erstelle einen Link, mit dem deine Eltern deinen Lernfortschritt sehen können: Serie, Fragen, Themen und Abzeichen. Der Link zeigt den Stand von heute und enthält keine Passwörter oder E-Mail-Adressen.</p>
        <div class="row"><button class="big" type="button" id="elternLink">🔗 Elternlink erstellen</button></div><p class="help" id="elternInfo" aria-live="polite"></p>`;
      app.appendChild(el);
      el.querySelector("#elternLink").onclick = async () => {
        const basis = ((window.EP_CONFIG || {}).teilenUrl || location.href.split("#")[0]);
        const url = basis + "#eltern=" + b64e(elternDaten());
        try{ if(navigator.share){ await navigator.share({title:"easyplay Lernfortschritt", url}); el.querySelector("#elternInfo").textContent = "Geteilt."; return; } }catch(e){}
        try{ await navigator.clipboard.writeText(url); el.querySelector("#elternInfo").textContent = "Link kopiert. Schicke ihn deinen Eltern."; }
        catch(e){ el.querySelector("#elternInfo").innerHTML = `<input class="sel" style="width:100%" readonly value="${h(url)}">`; }
      };
    } }catch(e){ console.warn("lernen.js", e); }
    return r;
  };
}

/* ---------- Elternansicht (#eltern=...) ---------- */
let ELTERN = null;
function elternAusLink(){
  const m = /#eltern=([A-Za-z0-9_-]{10,6000})/.exec(location.hash || ""); if(!m) return null;
  try{ const d = b64d(m[1]); if(!d || d.v !== 1) return null;
    const zahlS = (v, max) => Math.max(0, Math.min(+v || 0, max));
    return {n:String(d.n || "").slice(0, 40), d:String(d.d || "").slice(0, 10), s:zahlS(d.s, 3) || 1, l:zahlS(d.l, 1e6), f:zahlS(d.f, 1e7), r:zahlS(d.r, 1e7), se:zahlS(d.se, 3650), sb:zahlS(d.sb, 3650), tq:zahlS(d.tq, 1e5), fe:zahlS(d.fe, 1e6),
      ab:(Array.isArray(d.ab) ? d.ab : []).filter(x => ABZEICHEN.some(a => a[0] === x)).slice(0, 40), t:(Array.isArray(d.t) ? d.t : []).slice(0, 14).map(x => zahlS(x, 1e5)),
      th:(Array.isArray(d.th) ? d.th : []).slice(0, 30).map(x => [String(x[0] || "").slice(0, 40), zahlS(x[1], 1e6), zahlS(x[2], 1e6)])};
  }catch(e){ return null; }
}
function renderEltern(){
  const d = ELTERN, app = document.getElementById("app"); if(!d || !app) return;
  const quote = d.f ? Math.round(d.r / d.f * 100) : 0, max = Math.max(1, ...d.t);
  const name = d.n || "Ihr Kind", stufe = (typeof stufeObj === "function" ? stufeObj(d.s).name : "Stufe " + d.s);
  const th = d.th.map(([t, r, n]) => ({t, name:(THEMA[t] && THEMA[t].name) || (t.startsWith("kt_") ? "Kanton " + t.slice(3) : t), q:n ? Math.round(r / n * 100) : 0, n}));
  const stark = th.filter(x => x.n >= 5).sort((a, b) => b.q - a.q).slice(0, 5), schwach = th.filter(x => x.n >= 5).sort((a, b) => a.q - b.q).slice(0, 5);
  const az = ABZEICHEN.filter(a => d.ab.includes(a[0]));
  app.innerHTML = `<div class="elternseite"><section class="statcard">
    <h1 style="margin:0 0 4px">👪 ${d.n ? "Lernfortschritt von " + h(d.n) : "Lernfortschritt Ihres Kindes"}</h1>
    <p class="help">Stand ${h(d.d.split("-").reverse().join("."))} · ${h(stufe)} · Diese Ansicht zeigt nur Zahlen, die ${d.n ? h(d.n) : "Ihr Kind"} selbst geteilt hat.</p>
    <div class="kpis">
      <div><b>🔥 ${zahl(d.se)}</b><span>Tage Serie (Rekord ${zahl(d.sb)})</span></div>
      <div><b>${zahl(d.f)}</b><span>Fragen beantwortet</span></div>
      <div><b>${quote} %</b><span>richtig</span></div>
      <div><b>${zahl(d.l)}</b><span>Runden gespielt</span></div>
      <div><b>${zahl(d.tq)}</b><span>Tagesquiz gelöst</span></div>
      <div><b>${zahl(d.fe)}</b><span>Fragen zum Üben offen</span></div>
    </div>
    <h2>Die letzten 14 Tage</h2><div class="tagesbalken">${d.t.map(n => `<i style="height:${Math.round(n / max * 100)}%" title="${n} Fragen"></i>`).join("")}</div><p class="help">Beantwortete Fragen pro Tag, rechts ist der ${h(d.d.split("-").reverse().join("."))}.</p>
    ${stark.length ? `<h2>Stärken</h2><table><tbody>${stark.map(x => `<tr><td>${h(x.name)}</td><td>${x.q} % richtig</td><td class="help">${zahl(x.n)} Fragen</td></tr>`).join("")}</tbody></table>` : ""}
    ${schwach.length ? `<h2>Hier lohnt sich Üben</h2><table><tbody>${schwach.map(x => `<tr><td>${h(x.name)}</td><td>${x.q} % richtig</td><td class="help">${zahl(x.n)} Fragen</td></tr>`).join("")}</tbody></table>` : ""}
    <h2>Abzeichen (${az.length} von ${ABZEICHEN.length})</h2>
    <div class="abzgitter">${az.map(a => `<div class="abz"><span class="e">${a[1]}</span><b>${h(a[2])}</b><small>${h(a[3])}</small></div>`).join("") || '<p class="help">Noch keine Abzeichen.</p>'}</div>
    <div class="row" style="margin-top:18px"><button class="big" type="button" id="elternZu">Zu easyplay</button></div>
  </section></div>`;
  document.getElementById("elternZu").onclick = () => { ELTERN = null; history.replaceState(null, "", location.pathname); go("home"); };
}
const vorRender = window.render;
window.render = function(){
  if(S.screen === "eltern" && ELTERN){ try{ renderNav(); }catch(e){} renderEltern(); return; }
  return vorRender.apply(this, arguments);
};
function elternPruefen(){ const d = elternAusLink(); if(d){ ELTERN = d; go("eltern"); } }
addEventListener("hashchange", elternPruefen);
setTimeout(elternPruefen, 300);

window.EP_LERNEN = { serie, abzeichen, tagesFragen, fehlerListe, elternDaten };
})();
