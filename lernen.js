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
const K = { fehler:"ep-fehler", tage:"ep-lerntage", themen:"ep-lernthemen", tq:"ep-tagesquiz", geuebt:"ep-fehler-geuebt", wdh:"ep-wiederholen" };
const heute = (d) => { const x = d ? new Date(d) : new Date(); return x.getFullYear() + "-" + String(x.getMonth()+1).padStart(2,"0") + "-" + String(x.getDate()).padStart(2,"0"); };
const gestern = () => heute(Date.now() - 864e5);
const nrVon = f => { try{ return frageNr(f) || 0; }catch(e){ return +f.nr || 0; } };
const h = s => { try{ return esc(s); }catch(e){ return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); } };
const zahl = n => Number(n || 0).toLocaleString("de-CH");

/* ---------- Klüger wiederholen: 5 Fächer (verteilte Wiederholung) ----------
   Speicher ep-wiederholen: {v:1, k:{nr:{f:Fach 1-5, d:"JJJJ-MM-TT" fällig ab, z:zuerst falsch (ms), n:wie oft falsch, w:zuletzt geübt}}, gelernt:Zahl}
   ep-fehler bleibt im alten Format {nr:{n,r,z}} bestehen, enthält aber nur noch die HEUTE fälligen Fragen
   (startseite.js und app.js zählen diesen Schlüssel direkt). Alte ep-fehler-Daten werden beim ersten Laden übernommen. */
const FAECHER = [1, 3, 7, 14, 30];      // Tage bis zur nächsten Wiederholung in Fach 1 bis 5
const PRO_RUNDE = 15;
const plusTage = (tag, n) => { const [y, m, d] = String(tag).split("-").map(Number); return heute(new Date(y, m - 1, d + n)); };
function wdhLaden(){
  let st = LS.get(K.wdh, null);
  if(!st || typeof st !== "object" || !st.k || typeof st.k !== "object"){
    // Übernahme der alten Fehlerliste: alles kommt in Fach 1 und ist sofort fällig, nichts geht verloren
    st = {v:1, k:{}, gelernt:0}; const alt = LS.get(K.fehler, {}), t = heute();
    if(alt && typeof alt === "object") Object.keys(alt).forEach(nr => { if(!(+nr > 0)) return; const e = alt[nr] || {};
      st.k[nr] = {f:1, d:t, z:+e.z || Date.now(), n:Math.max(1, +e.n || 1)}; });
    st.mig = Object.keys(st.k).length;
    LS.set(K.wdh, st);
  }
  Object.keys(st.k).forEach(nr => { const e = st.k[nr];
    if(!e || typeof e !== "object"){ delete st.k[nr]; return; }
    e.f = Math.min(5, Math.max(1, Math.round(+e.f || 1))); if(!/^\d{4}-\d{2}-\d{2}$/.test(String(e.d || ""))) e.d = heute(); });
  st.gelernt = Math.max(0, +st.gelernt || 0);
  return st;
}
function spiegeln(st){
  const t = heute(), m = {};
  Object.keys(st.k).forEach(nr => { const e = st.k[nr]; if(e.d <= t) m[nr] = {n:e.n || 1, r:0, z:e.z || 0, f:e.f, d:e.d}; });
  const neu = JSON.stringify(m);
  try{ if(localStorage.getItem(K.fehler) !== neu) localStorage.setItem(K.fehler, neu); }catch(e){}
  return Object.keys(m).length;
}
function wdhSpeichern(st){ LS.set(K.wdh, st); return spiegeln(st); }
function wiederholung(){
  const st = wdhLaden(), t = heute(), l = Object.values(st.k), faecher = [0, 0, 0, 0, 0];
  l.forEach(e => faecher[e.f - 1]++);
  const spaeter = l.filter(e => e.d > t).map(e => e.d).sort(), naechste = spaeter[0] || null;
  return {faellig:l.filter(e => e.d <= t).length, offen:l.length, faecher, gelernt:st.gelernt, naechste,
    naechsteAnzahl:naechste ? spaeter.filter(d => d === naechste).length : 0, intervalle:FAECHER.slice()};
}
function wdhEintraege(nurFaellig){
  const st = wdhLaden(), t = heute();
  return Object.entries(st.k).filter(([, e]) => !nurFaellig || e.d <= t)
    .sort((a, b) => a[1].d < b[1].d ? -1 : a[1].d > b[1].d ? 1 : (a[1].z || 0) - (b[1].z || 0));   // die ältesten fälligen zuerst
}
function fragenZu(eintraege, max){
  if(!eintraege.length) return [];
  const gesucht = new Set(eintraege.map(([nr]) => +nr)), map = new Map();
  (typeof alleFragen === "function" ? alleFragen() : FRAGEN).forEach(f => { if(!f) return; const n = nrVon(f); if(gesucht.has(n) && !map.has(n)) map.set(n, f); });
  const raus = []; for(const [nr] of eintraege){ const f = map.get(+nr); if(f) raus.push(f); if(raus.length >= max) break; }
  return raus;
}

/* ---------- Antworten mitschreiben ---------- */
const vorAnswer = window.answer;
window.answer = function(i){
  const Q = S.quiz, f = Q && Q.list && Q.list[Q.i], schon = Q && Q.picked != null;
  const r = vorAnswer.apply(this, arguments);
  try{
    if(!f || schon || !f.opts || !f.opts[i]) return r;
    const ok = !!f.opts[i].ok, nr = nrVon(f), t = heute();
    // Wiederholen: falsch = Fach 1 (morgen wieder). Richtig, wenn fällig = ein Fach weiter. Nach Fach 5 = gelernt.
    if(nr){ const st = wdhLaden(), e = st.k[nr], zr = Q.__wdh || (Q.__wdh = {weiter:0, gelernt:0, nochmals:0});
      if(!ok){ st.k[nr] = {f:1, d:plusTage(t, FAECHER[0]), z:e ? e.z : Date.now(), n:((e && e.n) || 0) + 1, w:t}; if(e) zr.nochmals++; }
      else if(e && e.d <= t){
        if(e.f >= 5){ delete st.k[nr]; st.gelernt++; zr.gelernt++; }
        else { if(e.f === 1) LS.set(K.geuebt, (+LS.get(K.geuebt, 0) || 0) + 1); e.f++; e.d = plusTage(t, FAECHER[e.f - 1]); e.w = t; zr.weiter++; }
      }
      wdhSpeichern(st); }
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
// Heute fällige Fragen (höchstens 15, die ältesten zuerst). Name bleibt, startseite.js ruft fehlerListe() auf.
function fehlerListe(){ return fragenZu(wdhEintraege(true), PRO_RUNDE); }
// Alle offenen Fragen, auch die noch nicht fälligen (für Neugierige)
function alleOffenenListe(){ return fragenZu(wdhEintraege(false), PRO_RUNDE); }
function fehlerUeben(alle){ const l = alle ? alleOffenenListe() : fehlerListe(); if(!l.length) return false; startListe(l, alle ? "Alle offenen üben" : "Fehler üben"); return true; }

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
  const s = serie(), tq = tagesquizErledigt(), nf = wiederholung().faellig;
  return `<div class="lernleiste" id="lernleiste">
    <button type="button" class="lk serie${s.n ? " an" : ""}" data-l="serie"><span class="em">🔥</span><span><b>${s.n ? `${s.n} ${s.n === 1 ? "Tag" : "Tage"} Serie` : "Starte deine Serie"}</b><small>${s.aktiv ? "Heute geschafft, weiter so!" : `Heute noch ${Math.max(0, 5 - s.heute)} Fragen für die Serie`}</small></span></button>
    <button type="button" class="lk tq${tq ? "" : " neu"}" data-l="tq"><span class="em">${tq ? "✅" : "📅"}</span><span><b>Tagesquiz</b><small>${tq ? `Erledigt: ${tq.r} von ${tq.n} richtig. Morgen gibt es neue Fragen.` : "5 Fragen, jeden Tag neu"}</small></span></button>
    <button type="button" class="lk" data-l="fehler"${nf ? "" : " disabled"}><span class="em">🎯</span><span><b>Fehler üben${nf ? ` (${zahl(nf)})` : ""}</b><small>${nf ? "Diese Fragen wollen nochmals geübt werden" : "Heute ist nichts fällig"}</small></span></button>
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
    fe:wiederholung().offen, ge:wiederholung().gelernt, ab:abzeichen().filter(a => a.hat).map(a => a.id), t:tage, th:themen};
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
    return {n:String(d.n || "").slice(0, 40), d:String(d.d || "").slice(0, 10), s:zahlS(d.s, 3) || 1, l:zahlS(d.l, 1e6), f:zahlS(d.f, 1e7), r:zahlS(d.r, 1e7), se:zahlS(d.se, 3650), sb:zahlS(d.sb, 3650), tq:zahlS(d.tq, 1e5), fe:zahlS(d.fe, 1e6), ge:zahlS(d.ge, 1e6),
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
      <div><b>${zahl(d.fe)}</b><span>Fragen zum Wiederholen</span></div>
      ${d.ge ? `<div><b>🌟 ${zahl(d.ge)}</b><span>Fragen durch Wiederholen gelernt</span></div>` : ""}
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
  try{ spiegeln(wdhLaden()); }catch(e){}
  if(S.screen === "eltern" && ELTERN){ try{ renderNav(); }catch(e){} renderEltern(); return; }
  const r = vorRender.apply(this, arguments);
  requestAnimationFrame(knoepfeAnpassen);
  return r;
};
function elternPruefen(){ const d = elternAusLink(); if(d){ ELTERN = d; go("eltern"); } }
addEventListener("hashchange", elternPruefen);
setTimeout(elternPruefen, 300);

/* ---------- Wiederholen: Anzeige auf der Startseite, Welt im Entdecken-Menü ---------- */
const wannText = d => { if(!d) return ""; const t = heute(); if(d <= t) return "heute"; if(d === plusTage(t, 1)) return "morgen"; if(d === plusTage(t, 2)) return "übermorgen";
  const [y, m, dd] = d.split("-").map(Number); const x = new Date(y, m - 1, dd);
  return "am " + ["So","Mo","Di","Mi","Do","Fr","Sa"][x.getDay()] + " " + dd + "." + m + "."; };
const fragenWort = n => n === 1 ? "Frage" : "Fragen";
// «Fehler üben»-Knöpfe der Startseite (App und Computer): Text «heute fällig»; ist heute nichts fällig, aber noch etwas offen, führt der Knopf zur Übersicht
function knoepfeAnpassen(){
  try{
    if(typeof S === "undefined" || S.screen !== "home") return;
    const w = wiederholung();
    document.querySelectorAll('#app button[data-x="fehler"], #app button[data-a="fehler"], #app button[data-c="fehler"], #lernleiste button[data-l="fehler"]').forEach(b => {
      const lbl = b.matches("[data-a]") && b.classList.contains("ep-w") ? b.querySelector("span:last-child") : b.querySelector("small:last-of-type");
      if(w.faellig){ delete b.dataset.wdhWelt; if(lbl && !b.matches("[data-l]")) lbl.textContent = b.matches("[data-a]") && b.classList.contains("ep-w") ? "Heute fällig" : `${w.faellig} heute fällig`; }
      else if(w.offen){ b.disabled = false; b.dataset.wdhWelt = "1"; if(lbl) lbl.textContent = "Heute nichts fällig";
        b.setAttribute("aria-label", `Fehler üben: heute nichts fällig, ${w.offen} ${fragenWort(w.offen)} warten auf später. Übersicht öffnen`); }
    });
  }catch(e){ console.warn("lernen.js", e); }
}
document.addEventListener("click", e => {
  const b = e.target && e.target.closest && e.target.closest("button[data-wdh-welt]"); if(!b) return;
  e.preventDefault(); e.stopImmediatePropagation(); e.stopPropagation(); go("x-wiederholen");
}, true);
// Tageswechsel bei offener Seite: Zahl neu berechnen
let letzteFaellig = null;
setInterval(() => { try{ const n = spiegeln(wdhLaden()); if(letzteFaellig != null && n !== letzteFaellig && S.screen === "home") render(); letzteFaellig = n; }catch(e){} }, 60000);
// Nach einer Übungsrunde freundlich zusammenfassen
document.addEventListener("ep:quizende", () => {
  try{ const Q = S.quiz, z = Q && Q.__wdh; if(!z || !(z.weiter || z.gelernt || z.nochmals)) return;
    const teile = [];
    if(z.weiter) teile.push(`${z.weiter} ${fragenWort(z.weiter)} ${z.weiter === 1 ? "ist" : "sind"} ein Fach weitergewandert`);
    if(z.gelernt) teile.push(`${z.gelernt} ${fragenWort(z.gelernt)} jetzt gelernt 🌟`);
    if(z.nochmals && !teile.length) teile.push(`${z.nochmals === 1 ? "Diese Frage kommt" : "Diese Fragen kommen"} morgen nochmals, dann klappt es bestimmt`);
    const txt = teile.join(", ") + (z.weiter || z.gelernt ? ". Super!" : ".");
    setTimeout(() => { try{ window.EP_EXTRAS && window.EP_EXTRAS.meldung(txt, 3600); }catch(e){} }, 600);
  }catch(e){}
});

const wcss = document.createElement("style"); wcss.id = "ep-wiederholen";
wcss.textContent = `
.wdh-kopf{background:linear-gradient(135deg,#0B6E6A,#0FA968)!important}
.wdh-gitter{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.35fr);gap:16px}
.wdh-karte{border-radius:26px;padding:20px 22px;color:#fff;box-shadow:0 12px 26px rgba(27,34,64,.22);min-width:0;box-sizing:border-box}
.wdh-karte h2{margin:0 0 4px;color:#fff;font-size:1.15rem}
.wdh-karte p{margin:6px 0 0;color:#fff;line-height:1.35}
.wdh-heute{background:linear-gradient(135deg,#D9480F,#B83280);display:flex;flex-direction:column;gap:6px}
.wdh-lbl{font-weight:800;font-size:.85rem;letter-spacing:.04em;text-transform:uppercase;opacity:.95}
.wdh-zahl{font-size:3.4rem;line-height:1;font-weight:900;color:#fff;display:flex;align-items:baseline;gap:10px}
.wdh-zahl small{font-size:1rem;font-weight:700}
.wdh-heute small.wdh-naechst{display:block;color:#fff;opacity:.95;font-size:.9rem;margin-top:2px}
.wdh-btn,.wdh-btn2{font:inherit;font-weight:800;border:0;border-radius:999px;cursor:pointer;min-height:48px;padding:12px 20px;transition:transform .15s}
.wdh-btn{background:#fff;color:#B83280;margin-top:8px;align-self:flex-start;font-size:1.05rem;box-shadow:0 6px 14px rgba(0,0,0,.18)}
.wdh-btn:hover:not(:disabled),.wdh-btn2:hover:not(:disabled){transform:translateY(-2px)}
.wdh-btn:focus-visible,.wdh-btn2:focus-visible{outline:3px solid #FFE34D;outline-offset:3px}
.wdh-btn:disabled,.wdh-btn2:disabled{opacity:.55;cursor:default}
.wdh-faecher{background:linear-gradient(135deg,#3D5AFE,#7B3FE0)}
.wdh-balken{list-style:none;margin:10px 0 0;padding:0;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;align-items:end;height:150px}
.wdh-balken li{display:flex;flex-direction:column;align-items:center;height:100%;min-width:0}
.wdh-spur{flex:1 1 auto;min-height:0;width:100%;display:flex;flex-direction:column;align-items:center;justify-content:flex-end}
.wdh-balken b{font-size:1.1rem;color:#fff;line-height:1.2}
.wdh-balken i{flex:none;display:block;width:100%;max-width:56px;border-radius:12px 12px 6px 6px;background:rgba(255,255,255,.92);min-height:6px;margin-top:4px;transform-origin:bottom;animation:wdhWachs .6s ease-out both}
.wdh-balken li.leer i{background:rgba(255,255,255,.3)}
.wdh-balken span{font-size:.8rem;font-weight:800;margin-top:6px;white-space:nowrap;color:#fff}
.wdh-balken small{font-size:.72rem;opacity:.92;white-space:nowrap;color:#fff}
@keyframes wdhWachs{from{transform:scaleY(0)}to{transform:scaleY(1)}}
@media (prefers-reduced-motion:reduce){.wdh-balken i{animation:none}.wdh-btn,.wdh-btn2{transition:none}}
.wdh-fuss{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;margin-top:14px}
.wdh-gelernt{background:#FFE34D;color:#1B2240;font-weight:800;border-radius:999px;padding:6px 14px}
.wdh-unten{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-top:16px}
.wdh-btn2{background:rgba(15,20,48,.62);color:#fff}
.wdh-pille{flex:1 1 320px;margin:0;background:rgba(15,20,48,.55);color:#fff;border-radius:18px;padding:10px 14px;font-size:.9rem;line-height:1.4}
.wdh-pille summary{cursor:pointer;font-weight:800;list-style-position:inside}
.wdh-pille summary:focus-visible{outline:3px solid #FFE34D;outline-offset:3px;border-radius:8px}
.wdh-pille p{margin:6px 0 0}
.wdh-kopfzeile{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap}
.ap-held.hs-wdh{background:linear-gradient(140deg,#D9480F,#B83280)!important}
@media (max-width:760px){
  .wdh-gitter{grid-template-columns:1fr;gap:12px}
  .wdh-karte{padding:14px 16px;border-radius:22px}
  .wdh-kopf p{display:none}
  .wdh-kopf.x-kopf{min-height:64px;padding:12px 16px;margin-bottom:12px}
  .wdh-kopf.x-kopf img{max-height:96px}
  .wdh-heute{gap:2px}
  .wdh-zahl{font-size:2.4rem}
  .wdh-heute p{margin-top:2px;font-size:.92rem}
  .wdh-btn{width:100%;margin-top:6px}
  .wdh-balken{height:118px;gap:6px;margin-top:6px}
  .wdh-balken span{font-size:.74rem}
  .wdh-balken small{font-size:.66rem}
  .wdh-fuss{margin-top:10px}
  .wdh-unten{margin-top:12px;gap:8px}
  .wdh-btn2{width:100%}
  .wdh-pille{flex-basis:100%;font-size:.82rem;padding:8px 12px}
}
`;
document.head.appendChild(wcss);

function wdhRender(box, api){
  const w = wiederholung(), max = Math.max(1, ...w.faecher), runde = Math.min(PRO_RUNDE, w.faellig);
  const tage = n => n === 1 ? "1 Tag" : n + " Tage";
  let text;
  if(w.faellig) text = w.faellig === 1 ? "Diese Frage will nochmals geübt werden." : "Diese Fragen wollen nochmals geübt werden.";
  else if(w.offen) text = "Heute ist nichts fällig. Deine Fragen ruhen sich aus und kommen bald wieder.";
  else text = w.gelernt ? "Alles gelernt! Wenn du eine Frage falsch beantwortest, kommt sie hierher." : "Noch nichts zu wiederholen. Wenn du eine Frage falsch beantwortest, kommt sie hierher.";
  box.innerHTML = `<div class="x-kopf wdh-kopf"><span class="x-kopf-emo" aria-hidden="true">🔁</span><div><h1>Wiederholen</h1><p>Jede Frage kommt genau dann wieder, wenn es am meisten bringt.</p></div><img src="img/kids/duo-bereit.webp" alt=""></div>
    <div class="wdh-gitter">
      <section class="wdh-karte wdh-heute" aria-label="Heute fällig">
        <div class="wdh-kopfzeile"><b class="wdh-zahl">${zahl(w.faellig)}<small>${fragenWort(w.faellig)}</small></b><span class="wdh-lbl">heute fällig</span></div>
        <p>${h(text)}</p>
        ${w.faellig ? `<button type="button" class="wdh-btn" data-w="faellig">▶ Jetzt üben${w.faellig > PRO_RUNDE ? ` (${runde} von ${zahl(w.faellig)})` : ""}</button>` : ""}
        ${w.naechste ? `<small class="wdh-naechst">Danach: ${w.naechsteAnzahl} ${fragenWort(w.naechsteAnzahl)} ${h(wannText(w.naechste))}</small>` : ""}
      </section>
      <section class="wdh-karte wdh-faecher" aria-label="Deine 5 Fächer">
        <h2>Deine 5 Fächer</h2>
        <ol class="wdh-balken">${w.faecher.map((n, i) => `<li class="${n ? "" : "leer"}" aria-label="Fach ${i + 1}: ${n} ${fragenWort(n)}, kommen nach ${tage(FAECHER[i])} wieder"><div class="wdh-spur"><b>${n}</b><i style="height:${Math.max(4, Math.round(n / max * 72))}%"></i></div><span>Fach ${i + 1}</span><small>${tage(FAECHER[i])}</small></li>`).join("")}</ol>
        <div class="wdh-fuss"><span class="wdh-gelernt">🌟 ${zahl(w.gelernt)} gelernt</span><small>${zahl(w.offen)} ${w.offen === 1 ? "Frage wartet" : "Fragen warten"} in den Fächern</small></div>
      </section>
    </div>
    <div class="wdh-unten">
      <button type="button" class="wdh-btn2" data-w="alle"${w.offen ? "" : " disabled"}>🔍 Alle offenen üben${w.offen ? ` (${Math.min(PRO_RUNDE, w.offen)})` : ""}</button>
      <details class="wdh-pille"><summary>So geht's</summary><p>Eine falsche Antwort kommt in Fach 1. Weisst du sie beim Wiederholen, wandert sie ein Fach weiter und kommt später wieder: nach 1, 3, 7, 14 und 30 Tagen. Nach Fach 5 hast du sie gelernt. Klappt es einmal nicht, beginnt sie einfach wieder in Fach 1. Beim freien Üben wandert nichts.</p></details>
    </div>`;
  box.querySelectorAll("[data-w]").forEach(b => b.onclick = () => { api.ton("klick"); fehlerUeben(b.dataset.w === "alle"); });
}
try{
  if(window.EP_EXTRAS && typeof window.EP_EXTRAS.register === "function") window.EP_EXTRAS.register({
    id:"wiederholen", titel:"Wiederholen", text:"Fehler üben mit 5 Fächern", emo:"🔁", farbe:"linear-gradient(135deg,#D9480F,#B83280)", reihe:5,
    hinweis(){ const n = wiederholung().faellig; return n ? n + " fällig" : ""; },
    folie(){ const n = wiederholung().faellig; if(!n) return null;
      return {cls:"hs-wdh", ic:"🔁", lbl:"Wiederholen", titel:`${n} ${fragenWort(n)} heute fällig`, text:n === 1 ? "Diese Frage will nochmals geübt werden." : "Diese Fragen wollen nochmals geübt werden.", btn:"🔁 Wiederholen", a:"x-wiederholen"}; },
    render:wdhRender
  });
}catch(e){ console.warn("lernen.js", e); }
try{ letzteFaellig = spiegeln(wdhLaden()); }catch(e){}
// Die Startseite (App) wird teils nachträglich neu aufgebaut: Knöpfe danach nochmals anpassen
try{ const app = document.getElementById("app"); if(app && window.MutationObserver){ let warte = false;
  new MutationObserver(() => { if(warte) return; warte = true; requestAnimationFrame(() => { warte = false; knoepfeAnpassen(); }); }).observe(app, {childList:true}); } }catch(e){}

window.EP_LERNEN = { serie, abzeichen, tagesFragen, fehlerListe, alleOffenenListe, fehlerUeben, wiederholung, elternDaten };
})();
