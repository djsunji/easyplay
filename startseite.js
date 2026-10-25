/* easyplay: neue Startseite und Spielideen
   Banner mit weichen Farbflecken (Mesh), Widgets, «Dein Tag» als Zeitstrahl, Duell «Bereit» mit Teamwahl,
   Gruppenchat fürs Tagesquiz, Wochen-Challenge, Stories bei den Qeels, Live-Quiz alle 4 Stunden,
   Lumi liegt im Profil. Muster wie lernen.js: bestehende Funktionen werden umhüllt. */
(function(){
"use strict";
if(typeof window.render !== "function" || typeof window.renderHome !== "function") return;

const LS = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};
const K = { team:"ep-team", woche:"ep-woche", live:"ep-live", zuletzt:"ep-zuletzt", chatgesehen:"ep-chat-tag", erw:"ep-erwachsen" };
/* Erwachsenenmodus wurde im Oktober 2026 entfernt. Ein früher gespeicherter Wert wird gelöscht und hat keine Wirkung mehr.
   erwachsen() bleibt als Stub (immer false), damit ältere Aufrufe nicht brechen. */
const erwachsen = () => false;
function erwachsenSetzen(){ try{ localStorage.removeItem(K.erw); }catch(e){} try{ document.body.classList.remove("ep-erw"); }catch(e){} }
erwachsenSetzen();
const KIDS = "img/kids/";
const heute = (d) => { const x = d ? new Date(d) : new Date(); return x.getFullYear() + "-" + String(x.getMonth()+1).padStart(2,"0") + "-" + String(x.getDate()).padStart(2,"0"); };
const h = s => { try{ return esc(s); }catch(e){ return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); } };
const zahl = n => Math.round(Number(n || 0)).toLocaleString("de-CH");
const ruhig = () => { try{ return matchMedia("(prefers-reduced-motion: reduce)").matches; }catch(e){ return false; } };
function zufall(seed){ let x = 7; for(const c of String(seed)) x = (x * 31 + c.charCodeAt(0)) >>> 0; return () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }
const themenListe = () => Object.keys(THEMA).filter(id => !THEMA[id].menu && !THEMA[id].kids && !id.startsWith("kt_")).sort();
const tagNr = (d) => { const x = d ? new Date(d) : new Date(); return Math.floor((x - new Date(x.getFullYear(), 0, 0)) / 864e5) + x.getFullYear() * 400; };
function isoWoche(d){ const x = d ? new Date(d) : new Date(); const t = new Date(Date.UTC(x.getFullYear(), x.getMonth(), x.getDate())); const tag = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - tag); const j = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return t.getUTCFullYear() + "-W" + String(Math.ceil(((t - j) / 864e5 + 1) / 7)).padStart(2, "0"); }
const serie = () => { try{ return window.EP_LERNEN.serie(); }catch(e){ return {n:0, best:0, heute:0, aktiv:false}; } };
const tagesquiz = () => (LS.get("ep-tagesquiz", {})[heute()] || null);
const fehlerAnzahl = () => Object.keys(LS.get("ep-fehler", {})).length;
const level = () => { try{ return window.EP_LEVEL.stand(); }catch(e){ return null; } };
const xpGeben = (n) => { try{ return window.EP_LEVEL.gib(n); }catch(e){ return 0; } };
const abzeichenZahl = () => { let a = 0, b = 0; try{ const l = window.EP_LERNEN.abzeichen(); a += l.filter(x => x.hat).length; b += l.length; }catch(e){} try{ window.EP_LEVEL.familien().forEach(f => { a += f.stufe; b += f.grenzen.length; }); }catch(e){} a += LS.get("ep-wochenabzeichen", []).length; return {hat:a, alle:b}; };
const name = () => (S.profil && S.profil.name) || "";

/* ---------- Team ---------- */
const TEAMS = { lumi:{id:"lumi", name:"Team Lumi", emo:"🩷", farbe:"#E043B8", bild:"m3.webp", text:"Ruhig, schlau, mag Tiere und Berge."}, milo:{id:"milo", name:"Team Milo", emo:"💙", farbe:"#3D5AFE", bild:"j3.webp", text:"Schnell, mutig, mag Duelle und Sport."} };
const team = () => TEAMS[LS.get(K.team, "")] || null;
function teamWahl(danach, titel){
  document.querySelectorAll(".ep-modal").forEach(e => e.remove());
  const akt = team();
  const el = document.createElement("div"); el.className = "ep-modal"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", "Team wählen");
  el.innerHTML = `<div class="ep-box ep-teams"><h2>${h(titel || "Für welches Team spielst du?")}</h2><p class="ep-mut">Dein Team bekommt alle Punkte aus Duellen und Live-Quiz. Du kannst es jederzeit wechseln.</p>
    <div class="ep-teamgrid">${Object.values(TEAMS).map(t => `<button type="button" class="ep-team ep${t.id}${akt && akt.id === t.id ? " epan" : ""}" data-team="${t.id}"><small>${h(t.name)}${akt && akt.id === t.id ? " · dein Team" : ""}</small><b>${t.emo} ${h(t.name)}</b><p>${h(t.text)}</p><span class="ep-btn">${akt && akt.id === t.id ? "Weiter mit " : ""}${h(t.name)}</span><img src="${KIDS}${t.bild}" alt=""></button>`).join("")}</div>
    <button type="button" class="ep-zu" aria-label="Schliessen">✕</button></div>`;
  document.body.appendChild(el);
  const zu = () => el.remove();
  el.querySelector(".ep-zu").onclick = zu; el.onclick = e => { if(e.target === el) zu(); };
  el.querySelectorAll("[data-team]").forEach(b => b.onclick = () => { LS.set(K.team, b.dataset.team); zu(); try{ if(typeof danach === "function") danach(TEAMS[b.dataset.team]); }catch(e){} });
}

/* ---------- Live-Quiz: alle 4 Stunden (8, 12, 16, 20 Uhr), jedes Mal ein anderes Thema ---------- */
const LIVE = { slots:[8, 12, 16, 20], fragen:20, sek:25, pause:5, vor:120 };   // vor: Lobby öffnet 2 Minuten vorher
LIVE.dauer = LIVE.fragen * (LIVE.sek + LIVE.pause);
/* Themenplan aus der Verwaltung (hinweis.js setzt window.EP_PLAN), sonst automatisch */
const planThema = (art, k) => { try{ const id = ((window.EP_PLAN || {})[art] || {})[k]; return id && THEMA[id] ? THEMA[id] : null; }catch(e){ return null; } };
function liveThema(d){ const p = planThema("live", heute(d) + "-" + d.getHours()); if(p) return p; const l = themenListe(); if(!l.length) return null; return THEMA[l[(tagNr(d) * 7 + Math.floor(d.getHours() / 4) * 5 + 3) % l.length]]; }
function liveSlots(){
  const jetzt = new Date(), aus = [];
  for(const tagOffset of [0, 1]) for(const st of LIVE.slots){
    const s = new Date(jetzt); s.setDate(s.getDate() + tagOffset); s.setHours(st, 0, 0, 0);
    aus.push({start:s, ende:new Date(s.getTime() + LIVE.dauer * 1000), key:heute(s) + "-" + st, std:st, thema:liveThema(s)});
  }
  return aus.sort((a, b) => a.start - b.start);
}
function liveStatus(sl){
  const t = Date.now(), gespielt = LS.get(K.live, {})[sl.key];
  if(gespielt) return "ok";
  if(t >= sl.start - LIVE.vor * 1000 && t < sl.ende) return "jetzt";
  if(t >= sl.ende) return "vorbei";
  return "offen";
}
const liveNaechster = () => liveSlots().find(sl => liveStatus(sl) === "jetzt") || liveSlots().find(sl => liveStatus(sl) === "offen");
function liveFragen(sl){
  const rnd = zufall("live-" + sl.key), alle = (typeof alleFragen === "function" ? alleFragen() : FRAGEN);
  const ok = f => f && !f.img && Array.isArray(f.a) && f.a.length === 4 && f.q;
  let pool = alle.filter(f => ok(f) && sl.thema && f.t === sl.thema.id);
  if(pool.length < LIVE.fragen) pool = alle.filter(f => ok(f) && THEMA[f.t]);
  const raus = [], gesehen = new Set();
  for(let k = 0; k < 4000 && raus.length < LIVE.fragen && pool.length; k++){ const f = pool[Math.floor(rnd() * pool.length)]; if(!gesehen.has(f.q)){ gesehen.add(f.q); raus.push(f); } }
  return raus.map(f => { const r = zufall("opt-" + sl.key + "-" + f.q); const o = f.a.map((txt, i) => ({txt, ok:i === 0})); for(let i = o.length - 1; i > 0; i--){ const j = Math.floor(r() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; } return {...f, opts:o}; });
}
function dauerText(ms){ ms = Math.max(0, ms); const s = Math.floor(ms / 1000), hh = Math.floor(s / 3600), mm = Math.floor(s % 3600 / 60), ss = s % 60; return hh ? `${hh}:${String(mm).padStart(2,"0")}:${String(ss).padStart(2,"0")}` : `${mm}:${String(ss).padStart(2,"0")}`; }
let LQ = null;   // laufendes Live-Quiz
async function liveSync(sl, r){
  // Ohne Supabase bleibt der Stand auf dem Gerät. Mit Supabase (supabase/live.sql) werden die Punkte aller Kinder zusammengezählt.
  try{ const sp = typeof lkSupa === "function" && lkSupa(); if(!sp) return null;
    const res = await fetch(sp.u + "/rest/v1/rpc/live_punkte", {method:"POST", headers:sp.h, body:JSON.stringify({p_key:sl.key, p_team:r.team, p_punkte:r.pts, p_richtig:r.r})});
    if(res.ok) return await res.json(); }catch(e){} return null;
}
async function liveStand(sl){
  try{ const sp = typeof lkSupa === "function" && lkSupa(); if(!sp) return null;
    const res = await fetch(sp.u + "/rest/v1/rpc/live_stand", {method:"POST", headers:sp.h, body:JSON.stringify({p_key:sl.key})});
    if(res.ok) return await res.json(); }catch(e){} return null;
}
function lqUhr(ms){ ms = Math.max(0, ms); const s = Math.floor(ms / 1000), z = n => String(n).padStart(2, "0");
  return `<span><b>${z(Math.floor(s / 3600))}</b><small>Std</small></span><i>:</i><span><b>${z(Math.floor(s % 3600 / 60))}</b><small>Min</small></span><i>:</i><span><b>${z(s % 60)}</b><small>Sek</small></span>`; }
function liveAnsage(sl){ try{ const u = new SpeechSynthesisUtterance(`Achtung, Achtung! Um ${sl.std} Uhr startet das Live-Quiz. Das Thema ist ${sl.thema ? sl.thema.name : "gemischt"}. Mach mit und hol Punkte für dein Team!`); u.lang = "de-CH"; const v = speechSynthesis.getVoices().find(x => /^de/.test(x.lang)); if(v) u.voice = v; speechSynthesis.cancel(); speechSynthesis.speak(u); }catch(e){} }
function liveOeffnen(){ if(!team()){ teamWahl(() => go("livequiz"), "Live-Quiz: Für welches Team spielst du?"); return; } go("livequiz"); }
function liveStop(){ if(LQ && LQ.timer){ clearInterval(LQ.timer); } LQ = null; }
function renderLiveQuiz(){
  const app = document.getElementById("app"); if(!app) return;
  const sl = liveNaechster(), t = team(), st = sl ? liveStatus(sl) : "offen";
  if(!sl || !t){ app.innerHTML = `<div class="ep-live"><div class="ep-card"><h1>⚡ Live-Quiz</h1><p>Kein Live-Quiz gefunden.</p></div></div>`; return; }
  const gespielt = LS.get(K.live, {});
  const heuteGespielt = Object.keys(gespielt).filter(k => k.startsWith(heute())).map(k => gespielt[k]);
  if(st !== "jetzt"){
    liveStop();
    const andere = Object.values(TEAMS).find(x => x.id !== t.id);
    const plan = liveSlots().filter(x => liveStatus(x) !== "vorbei").slice(0, 4);
    const tic = sl.thema ? (typeof themaIcon === "function" ? themaIcon(sl.thema) : h(sl.thema.emo || "⚡")) : "⚡";
    app.innerHTML = `<div class="ep-live lq">
      <button type="button" class="lq-zurueck" id="lqZurueck">← Zurück</button>
      <section class="lq-held">
        <div class="lq-ansage"><span class="lq-mega" aria-hidden="true">📣</span><div><small>Ansage von Milo</small><p>Achtung, Achtung! Um <b>${slotLabel(sl)} Uhr</b> geht es los. Das Thema ist <b>${h(sl.thema ? sl.thema.name : "Gemischt")}</b>!</p></div><button type="button" class="lq-vorlesen" id="lqSag" aria-label="Ansage vorlesen">🔊</button></div>
        <span class="lq-tag"><i></i> Live-Quiz · alle 4 Stunden</span>
        <div class="lq-thema"><span class="lq-ic" aria-hidden="true">${tic}</span><div><small>Thema um ${slotLabel(sl)} Uhr</small><h1>${h(sl.thema ? sl.thema.name : "Gemischt")}</h1></div></div>
        <div class="lq-cd" id="lqCountdown">${lqUhr(sl.start - Date.now())}</div>
        <p class="lq-info">${LIVE.fragen} Fragen, je ${LIVE.sek} Sekunden. Schnelle richtige Antworten geben mehr Punkte, Serien geben Bonus. 🔥</p>
        <img class="lq-kids" src="${KIDS}duo-jubel.webp" alt="">
      </section>
      <section class="lq-teams">
        ${[TEAMS.lumi, TEAMS.milo].map(x => `<div class="lq-team lq${x.id}${x.id === t.id ? " dein" : ""}"><img src="${KIDS}${x.id === "lumi" ? "m5" : "j5"}.webp" alt=""><div><b>${x.emo} ${h(x.name)}</b><small>${h(x.text)}</small>${x.id === t.id ? `<span class="lq-dein">👑 Dein Team</span>` : ""}</div></div>`).join(`<div class="lq-vs">VS</div>`)}
      </section>
      <div class="lq-wechsel">Du spielst für <b style="color:${t.farbe}">${t.emo} ${h(t.name)}</b> <button type="button" class="ep-link" id="lqTeam">Zu ${h(andere.name)} wechseln</button></div>
      <section class="lq-plan"><h2>Die nächsten Live-Quiz</h2><div>${plan.map(x => `<span class="${x.key === sl.key ? "an" : ""}"><b>${heute(x.start) === heute() ? "" : "Morgen "}${slotLabel(x)}</b><small>${h(x.thema ? x.thema.name : "Gemischt")}</small></span>`).join("")}</div></section>
      ${heuteGespielt.length ? `<section class="lq-karte"><h2>Heute schon gespielt</h2>${heuteGespielt.map(g => `<p>⚡ ${String(g.std).padStart(2, "0")}:00 Uhr: <b>${g.r} von ${g.n} richtig</b> · ${zahl(g.pts)} Punkte für ${h(TEAMS[g.team] ? TEAMS[g.team].name : "dein Team")}</p>`).join("")}</section>` : ""}
      <section class="lq-regeln"><div><span>⏱</span><b>${LIVE.sek} Sekunden</b><small>pro Frage, alle gleichzeitig</small></div><div><span>🔥</span><b>Serien-Bonus</b><small>ab 2 richtigen am Stück</small></div><div><span>🏆</span><b>Für dein Team</b><small>alle Punkte zählen für ${h(t.name)}</small></div></section>
    </div>`;
    app.querySelector("#lqZurueck").onclick = () => go("home");
    app.querySelector("#lqTeam").onclick = () => { LS.set(K.team, andere.id); render(); };
    app.querySelector("#lqSag").onclick = () => liveAnsage(sl);
    LQ = {timer:setInterval(() => { const el = document.getElementById("lqCountdown"); if(!el || S.screen !== "livequiz"){ liveStop(); return; } const s2 = liveNaechster(); if(s2 && liveStatus(s2) === "jetzt"){ render(); return; } el.innerHTML = lqUhr(sl.start - Date.now()); }, 1000)};
    return;
  }
  // Läuft oder Lobby
  if(!LQ || LQ.key !== sl.key){ liveStop(); LQ = {key:sl.key, sl, fragen:liveFragen(sl), antworten:{}, pts:0, r:0, timer:null, fertig:false, stand:null}; liveStand(sl).then(s => { if(LQ && LQ.key === sl.key && s) LQ.stand = s; }); }
  app.innerHTML = `<div class="ep-live lq"><button type="button" class="lq-zurueck" id="lqRaus">← Zurück</button><div class="ep-dunkel ep-liverun"><div class="ep-livezeile"><span class="ep-livepunkt"><i></i> LIVE</span><b>${h(sl.thema ? sl.thema.name : "Gemischt")}</b><span id="lqUhr" class="ep-uhr"></span></div>
      <div class="ep-arena epklein"><div class="ep-turm eplumi"><div class="ep-fill" id="lqFillLumi"></div><img src="${KIDS}m5.webp" alt=""><span id="lqLumi">Team Lumi</span></div>
        <div class="ep-frage" id="lqFrage"></div>
        <div class="ep-turm epmilo"><div class="ep-fill" id="lqFillMilo"></div><img src="${KIDS}j5.webp" alt=""><span id="lqMilo">Team Milo</span></div></div></div></div>`;
  app.querySelector("#lqRaus").onclick = () => { liveStop(); go("home"); };
  const tick = () => {
    if(S.screen !== "livequiz"){ liveStop(); return; }
    const jetzt = Date.now(), start = sl.start.getTime(), pro = (LIVE.sek + LIVE.pause) * 1000;
    const uhr = document.getElementById("lqUhr"), box = document.getElementById("lqFrage"); if(!uhr || !box){ liveStop(); return; }
    const meins = LQ.pts, mT = t.id;
    const st = LQ.stand || {}; const lumi = (+st.lumi || 0) + (mT === "lumi" ? meins : 0), milo = (+st.milo || 0) + (mT === "milo" ? meins : 0);
    const max = Math.max(100, lumi, milo);
    document.getElementById("lqFillLumi").style.height = Math.round(lumi / max * 100) + "%"; document.getElementById("lqFillMilo").style.height = Math.round(milo / max * 100) + "%";
    document.getElementById("lqLumi").textContent = `Team Lumi · ${zahl(lumi)}`; document.getElementById("lqMilo").textContent = `Team Milo · ${zahl(milo)}`;
    if(jetzt < start){ uhr.textContent = "Start in " + dauerText(start - jetzt);
      if(!box.dataset.lobby){ box.dataset.lobby = "1"; box.innerHTML = `<div class="ep-lobby"><h2>Gleich geht es los!</h2><p>Du spielst für <b style="color:${t.farbe}">${t.emo} ${h(t.name)}</b>. ${LIVE.fragen} Fragen zum Thema «${h(sl.thema ? sl.thema.name : "Gemischt")}».</p><p class="ep-mut">Mach dich bereit, die erste Frage erscheint automatisch.</p></div>`; }
      return; }
    const i = Math.floor((jetzt - start) / pro);
    if(i >= LIVE.fragen || i >= LQ.fragen.length){ liveEnde(sl, t); return; }
    const f = LQ.fragen[i], inFrage = (jetzt - start) - i * pro, rest = LIVE.sek * 1000 - inFrage, aufloesung = rest <= 0;
    uhr.textContent = `Frage ${i + 1} von ${LIVE.fragen} · ${aufloesung ? "Auflösung" : "⏱ " + Math.ceil(rest / 1000) + " s"}`;
    const a = LQ.antworten[i];
    if(box.dataset.i !== String(i)){
      box.dataset.i = String(i); delete box.dataset.lobby;
      box.innerHTML = `<div class="ep-balken"><i id="lqBalken"></i></div><small class="lq-fnr">Frage ${i + 1} · ${h(sl.thema ? sl.thema.name : "Gemischt")}</small><div class="ep-q">${h(f.q)}</div><div class="ep-antw">${f.opts.map((o, k) => `<button type="button" data-k="${k}">${h(o.txt)}</button>`).join("")}</div><p class="ep-punkte" id="lqPts">⭐ ${zahl(LQ.pts)} Punkte · ${LQ.r} richtig</p>`;
      box.querySelectorAll("[data-k]").forEach(b => b.onclick = () => {
        if(LQ.antworten[i] != null) return; const k = +b.dataset.k, dt = (Date.now() - start) - i * pro; if(dt > LIVE.sek * 1000) return;
        const ok = !!f.opts[k].ok; LQ.serie = ok ? (LQ.serie || 0) + 1 : 0; const bonus = ok && LQ.serie >= 2 ? Math.min(50, (LQ.serie - 1) * 10) : 0;
        const p = ok ? 50 + Math.round(50 * Math.max(0, 1 - dt / (LIVE.sek * 1000))) + bonus : 0;
        LQ.antworten[i] = {k, ok, p, bonus}; LQ.pts += p; if(ok) LQ.r++;
        box.querySelectorAll("[data-k]").forEach(x => x.classList.toggle("epgewaehlt", +x.dataset.k === k));
        document.getElementById("lqPts").textContent = `⭐ ${zahl(LQ.pts)} Punkte · ${LQ.r} richtig${LQ.serie >= 2 ? ` · 🔥 ${LQ.serie}er-Serie` : ""}`;
        if(ok){ xpGeben(10); try{ if(typeof fxAnswer === "function") fxAnswer(k, true); }catch(e){} }
      });
    }
    const bal = document.getElementById("lqBalken"); if(bal) bal.style.width = Math.max(0, Math.min(100, rest / (LIVE.sek * 10))) + "%";
    if(aufloesung && !box.dataset.aufgeloest){ box.dataset.aufgeloest = "1";
      box.querySelectorAll("[data-k]").forEach(x => { const k = +x.dataset.k; x.disabled = true; x.classList.toggle("eprichtig", !!f.opts[k].ok); x.classList.toggle("epfalsch", !f.opts[k].ok); });
      const r = document.createElement("p"); r.className = "ep-aufl"; r.innerHTML = a ? (a.ok ? `✅ Richtig! +${a.p} Punkte${a.bonus ? ` (🔥 +${a.bonus} Serien-Bonus)` : ""}` : `❌ Leider falsch.`) : `⏱ Keine Antwort.`; if(f.e) r.innerHTML += ` <small>${h(String(f.e).slice(0, 160))}</small>`; box.appendChild(r); }
    if(!aufloesung) delete box.dataset.aufgeloest;
  };
  tick(); LQ.timer = setInterval(tick, 250);
}
async function liveEnde(sl, t){
  if(!LQ || LQ.fertig) return; LQ.fertig = true; if(LQ.timer) clearInterval(LQ.timer);
  const r = {r:LQ.r, n:LIVE.fragen, pts:LQ.pts, team:t.id, std:sl.std, d:heute()};
  const alle = LS.get(K.live, {}); const ks = Object.keys(alle).sort(); while(ks.length > 200) delete alle[ks.shift()];
  const stand = await liveSync(sl, r); if(stand) r.stand = stand; alle[sl.key] = r; LS.set(K.live, alle);
  const bonus = xpGeben(30 + LQ.r * 2);
  const app = document.getElementById("app"); if(!app || S.screen !== "livequiz") return;
  const st = r.stand || LQ.stand; const lumi = st ? +st.lumi || 0 : (t.id === "lumi" ? r.pts : 0), milo = st ? +st.milo || 0 : (t.id === "milo" ? r.pts : 0);
  app.innerHTML = `<div class="ep-live"><div class="ep-card ep-ende"><span class="ep-tag rot">⚡ Live-Quiz vorbei</span><h1>${r.r} von ${r.n} richtig</h1><p class="ep-gross">⭐ ${zahl(r.pts)} Punkte für ${t.emo} ${h(t.name)}</p><p>+${bonus} XP</p>
      <div class="ep-stand"><div class="eplumi" style="--w:${Math.round(lumi / Math.max(1, lumi, milo) * 100)}%"><b>Team Lumi</b><i></i><span>${zahl(lumi)}</span></div><div class="epmilo" style="--w:${Math.round(milo / Math.max(1, lumi, milo) * 100)}%"><b>Team Milo</b><i></i><span>${zahl(milo)}</span></div></div>
      ${st ? `<p class="ep-mut">${zahl((+st.spieler || 0))} Kinder haben mitgespielt.</p>` : `<p class="ep-mut">Der Stand zeigt deine Punkte. Sobald Supabase eingerichtet ist, werden die Punkte aller Kinder zusammengezählt.</p>`}
      <div class="ep-row"><button type="button" class="ep-btn" id="lqHome">Zur Startseite</button></div></div></div>`;
  app.querySelector("#lqHome").onclick = () => go("home");
  LQ = null;
}

/* ---------- Wochen-Challenge: jede Woche ein anderes Thema ---------- */
const WOCHE_ZIEL = 30, WOCHE_XP = 150;
/* Wochenplan für immer: alle Themen der Reihe nach, abwechselnd aus den Bereichen (Welt, Natur, Geld, Alltag …).
   Jedes Thema kommt einmal dran, dann beginnt der Plan von vorne. Woche 42/2026 bleibt Ethik (Anker). */
let WPLAN = null;
function wochenPlan(){
  if(WPLAN && WPLAN.n === Object.keys(THEMA).length) return WPLAN.l;
  const l = themenListe(), gruppen = {}, reihe = [];
  l.forEach(id => { const b = (THEMA[id].bereich && THEMA[id].bereich.id) || "x"; (gruppen[b] = gruppen[b] || []).push(id); });
  const bs = Object.keys(gruppen);
  for(let k = 0; reihe.length < l.length; k++) bs.forEach(b => { if(gruppen[b][k]) reihe.push(gruppen[b][k]); });
  WPLAN = {n:Object.keys(THEMA).length, l:reihe}; return reihe;
}
function montag(d){ const x = new Date(d || Date.now()); x.setHours(12, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }
function wocheThemaFuer(d){
  const p = planThema("woche", isoWoche(d)); if(p) return p;
  const l = wochenPlan(); if(!l.length) return null;
  const anker = Math.max(0, l.indexOf("ethik"));                       // Woche ab Montag, 12. Oktober 2026 = Ethik
  const k = Math.round((montag(d) - montag(new Date(2026, 9, 12))) / 6048e5);
  return THEMA[l[((k % l.length) + l.length + anker) % l.length]];
}
function wocheThema(){ return wocheThemaFuer(new Date()); }
/* Ziel pro Thema: 30 richtige, bei kleinen Themen weniger (sonst nicht schaffbar) */
function wocheZiel(th){ if(!th) return WOCHE_ZIEL; let n = 0; try{ n = (typeof alleFragen === "function" ? alleFragen() : FRAGEN).filter(f => f.t === th.id).length; }catch(e){} return n && n < 45 ? Math.max(5, Math.floor(n * 0.6)) : WOCHE_ZIEL; }
/* Die nächsten Wochen (für die Vorschau) */
function wocheVorschau(anzahl){ const raus = []; for(let k = 1; k <= (anzahl || 3); k++){ const d = new Date(); d.setDate(d.getDate() + 7 * k); const w = isoWoche(d); raus.push({w, thema:wocheThemaFuer(d)}); } return raus; }
function woche(){
  const w = isoWoche(); let d = LS.get(K.woche, null);
  const plan = planThema("woche", w);
  let th = d && d.w === w && THEMA[d.t] && (!plan || plan.id === d.t) ? THEMA[d.t] : wocheThema();
  if(!d || d.w !== w || (plan && d.t !== plan.id)){ d = {w, t:th ? th.id : "", n:0, r:0, fertig:false}; LS.set(K.woche, d); }
  const so = new Date(); so.setDate(so.getDate() + (7 - (so.getDay() || 7))); so.setHours(23, 59, 59, 999);
  return {...d, thema:th, ziel:wocheZiel(th), ende:so};
}
function wocheZaehlen(f, ok){
  const d = woche(); if(!d.thema || f.t !== d.thema.id) return;
  const neu = {w:d.w, t:d.t, n:d.n + 1, r:d.r + (ok ? 1 : 0), fertig:d.fertig};
  if(!neu.fertig && neu.r >= d.ziel){ neu.fertig = true; const b = xpGeben(WOCHE_XP); setTimeout(() => meldung("🏔️", `Wochen-Challenge geschafft! +${b} XP`, `${d.ziel} richtige Antworten zu «${d.thema.name}»`), 400); }
  LS.set(K.woche, neu);
}
const WOCHE_TEST_XP = 100;
function wocheBonus(){
  const Q = S.quiz; if(S.screen !== "done" || !Q || Q.mode !== "test" || Q._wocheGeprueft) return; Q._wocheGeprueft = true;
  const d = woche(); if(!d.thema || !S.thema || S.thema.id !== d.thema.id) return;
  const n = (Q.list || []).length, r = Q.score || 0; if(!n) return;
  const liste = LS.get("ep-wochenabzeichen", []), hat = liste.some(x => x.w === d.w);
  let text = "";
  if(r / n >= .5 && !hat){ liste.push({w:d.w, t:d.thema.id, name:d.thema.name, r, n, z:Date.now()}); LS.set("ep-wochenabzeichen", liste); const b = xpGeben(WOCHE_TEST_XP); text = `🏅 Neues Wochen-Abzeichen «${d.thema.name}» und +${b} XP Bonus!`; setTimeout(() => meldung("🏅", `Wochen-Abzeichen: ${d.thema.name}`, `+${b} XP Bonus für den Test zum Thema der Woche`), 300); }
  else if(r / n >= .5){ const b = xpGeben(Math.round(WOCHE_TEST_XP / 4)); text = `Thema der Woche: +${b} XP Bonus. Dein Abzeichen hast du schon.`; }
  else { const b = xpGeben(20); text = `Thema der Woche: +${b} XP. Mit der Hälfte richtig gibt es das Wochen-Abzeichen.`; }
  const kopf = document.querySelector("#app .done h1"); if(kopf && text){ const p = document.createElement("p"); p.className = "ep-wochebonus"; p.textContent = text; kopf.after(p); }
}
function wocheStarten(){ const d = woche(); if(!d.thema) return; const l = (typeof alleFragen === "function" ? alleFragen() : FRAGEN).filter(f => f.t === d.thema.id && Array.isArray(f.a) && f.a.length === 4); if(!l.length) return; startListe(l, "Wochen-Challenge: " + d.thema.name); }

/* ---------- Meldungen ---------- */
function meldung(emo, titel, text){
  const el = document.createElement("div"); el.className = "ep-meldung"; el.setAttribute("role", "status");
  el.innerHTML = `<span class="epe">${emo}</span><span>${h(titel)}<small>${h(text || "")}</small></span>`; document.body.appendChild(el); setTimeout(() => el.remove(), 4200);
}

/* ---------- Antworten mitschreiben: zuletzt gespielt, Wochen-Challenge ---------- */
const vorAnswer = window.answer;
window.answer = function(i){
  const Q = S.quiz, f = Q && Q.list && Q.list[Q.i], schon = Q && Q.picked != null;
  const r = vorAnswer.apply(this, arguments);
  try{ if(f && !schon && f.opts && f.opts[i]){ const ok = !!f.opts[i].ok;
    if(f.t && THEMA[f.t]) LS.set(K.zuletzt, {t:f.t, name:THEMA[f.t].name, z:Date.now()});
    wocheZaehlen(f, ok); } }catch(e){ console.warn("startseite.js", e); }
  return r;
};

/* ---------- Wusstest du? ---------- */
function fakt(){
  const rnd = zufall("fakt-" + heute() + "-" + (S.stufe || 1));
  const alle = (typeof alleFragen === "function" ? alleFragen() : FRAGEN).filter(f => f && f.e && String(f.e).length > 40 && String(f.e).length < 170 && !f.img && THEMA[f.t]);
  if(!alle.length) return null; const f = alle[Math.floor(rnd() * alle.length)];
  return {text:String(f.e), t:f.t, name:THEMA[f.t].name};
}

/* ---------- Gestaltung ---------- */
const css = document.createElement("style");
css.textContent = `
:root{--ep-ink:#1B2240;--ep-mut:#5D5C80;--ep-grad:linear-gradient(135deg,#3D5AFE,#8A3FE0 55%,#E043B8)}
body.dark{--ep-ink:#EEF1FF;--ep-mut:#B8BEDF}
.hero.ep{display:block!important;grid-template-columns:none!important;min-height:0!important;padding:0!important;background:none!important;box-shadow:none!important;border:0!important;text-align:center}
.hero.ep::before,.hero.ep::after{display:none!important}
body:has(.hero.ep) .eplernleiste,body:has(.hero.ep) .eplvkarte{display:none!important}
.ep-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:0;border-radius:18px;padding:13px 24px;font:800 1.05rem "Lexend",system-ui,sans-serif;color:#fff;background:var(--ep-grad);box-shadow:0 7px 0 #2A2FA8,0 16px 30px -10px rgba(61,90,254,.6);cursor:pointer;white-space:nowrap;text-decoration:none;transition:transform .1s}
.ep-btn:active{transform:translateY(4px);box-shadow:0 3px 0 #2A2FA8}
.ep-btn.weiss{background:#fff;color:#1B2240;box-shadow:0 7px 0 #CFC8EE,0 16px 30px -12px rgba(27,34,64,.3)}
.ep-btn.gelb{background:#FFE34D;color:#1B2240;box-shadow:0 7px 0 #C9A200}
.ep-btn.klein{padding:9px 16px;font-size:.92rem;border-radius:14px;box-shadow:0 5px 0 #2A2FA8}
.ep-link{background:none;border:0;color:#3D5AFE;font:700 .95rem "Lexend",system-ui,sans-serif;cursor:pointer;text-decoration:underline;padding:0}
.ep-tag{display:inline-block;background:#1B2240;color:#fff;border-radius:999px;padding:3px 10px;font-size:.72rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase}
.ep-tag.rot{background:linear-gradient(135deg,#FF3D6E,#FF8A3D)}.ep-tag.gruen{background:#0FA968}.ep-tag.lila{background:#8A3FE0}
.ep-mut{color:var(--ep-mut)}
.ep-h{font:800 1.5rem "Bricolage Grotesque","Fredoka",system-ui,sans-serif;color:var(--ep-ink);margin:26px 0 12px;text-align:left}
/* Banner mit Mesh */
.hero.ep>.ep-banner{position:relative;isolation:isolate;overflow:hidden;border-radius:36px;background:#fff;display:grid!important;flex-direction:row;grid-template-columns:1fr auto;gap:16px;align-items:end;padding:0 10px 0 30px;text-align:left;box-shadow:0 30px 60px -36px rgba(27,34,64,.55);border:1.5px solid rgba(255,255,255,.9)}
.hero.ep>.ep-banner{overflow:visible!important}
.epzufalltext{display:block;position:relative;z-index:1;max-width:62%;margin:2px 0 10px;font:500 .92rem/1.35 "Lexend",system-ui,sans-serif;color:rgba(255,255,255,.88);text-align:left}
.ep-banner::before{content:"";position:absolute;inset:0;border-radius:inherit;z-index:-1;opacity:.85;background:radial-gradient(circle at 12% 28%,#FF8AD8 0,rgba(255,138,216,.45) 18%,transparent 46%),radial-gradient(circle at 82% 18%,#8FA6FF 0,rgba(143,166,255,.45) 18%,transparent 46%),radial-gradient(circle at 45% 100%,#FFE34D 0,rgba(255,227,77,.4) 16%,transparent 42%),radial-gradient(circle at 92% 88%,#8CE0C8 0,rgba(140,224,200,.4) 16%,transparent 42%)}
.ep-banner>*{min-width:0}
.ep-banner .ept{padding:26px 0 28px;text-align:left}.ep-banner .ept>*{margin-left:0!important;margin-right:auto!important;text-align:left!important}.ep-banner>img{width:auto!important;max-width:none}
.ep-banner .eplogo{height:clamp(80px,9vw,110px);display:block;margin-bottom:4px;filter:drop-shadow(0 12px 18px rgba(60,30,140,.28))}
@media (max-width:1100px),(pointer:coarse) and (max-width:1400px){.ep-banner .eplogo{content:url(img/logo.webp);height:auto;width:min(380px,90%)}}
.ep-banner .epslogan{font:800 clamp(2.3rem,5vw,4rem)/1.02 "Bricolage Grotesque","Fredoka",system-ui,sans-serif;letter-spacing:-.02em;margin:0 0 10px;background:var(--ep-grad);-webkit-background-clip:text;background-clip:text;color:transparent}
.ep-pills{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}
.ep-pills span{background:rgba(255,255,255,.75);border:1px solid #fff;border-radius:999px;padding:6px 14px;font-weight:500;font-size:.92rem;color:#5D5C80}
.ep-pills b{color:#1B2240}
.ep-cta{display:flex;gap:12px;flex-wrap:wrap}
.ep-banner>img{height:clamp(240px,30vw,400px);margin-top:-40px;display:block;filter:drop-shadow(0 16px 16px rgba(27,34,64,.28))}
@media (max-width:860px){.hero.ep>.ep-banner{grid-template-columns:1fr;text-align:center;padding:0 18px}.ep-banner>img{order:-1;height:220px;margin:0 auto}.ep-banner .eplogo{margin:0 auto 4px}.ep-pills,.ep-cta{justify-content:center}.ep-banner .ept{padding:12px 0 24px;text-align:center}.ep-banner .ept>*{margin-left:auto!important;margin-right:auto!important;text-align:center!important}}
/* Widgets */
.ep-wg{display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:minmax(150px,auto);grid-auto-flow:dense;gap:14px;margin-top:18px}
.ep-w{border-radius:28px;padding:16px;position:relative;overflow:hidden;color:var(--ep-ink);text-align:left;display:flex;flex-direction:column;justify-content:space-between;background:rgba(255,255,255,.78);backdrop-filter:blur(16px) saturate(1.3);-webkit-backdrop-filter:blur(16px) saturate(1.3);border:1.5px solid rgba(255,255,255,.9);box-shadow:0 24px 44px -34px rgba(27,34,64,.55);font:inherit;cursor:pointer;min-width:0}
body.dark .ep-w{background:rgba(27,34,68,.88);border-color:rgba(255,255,255,.12);color:#EEF1FF}
body.dark .ep-w .epring b{background:#1B2244}
body.dark .ep-w.eptl .epe i{background:#1B2244}
body.dark .ep-w.eptl .epe::before{background:#3A4274}
body.dark .ep-w.eptl .epe b{color:#EEF1FF}
body.dark .ep-w .epmini{background:#FFE34D;color:#1B2240}
.ep-w:focus-visible{outline:3px solid #8A3FE0}
.ep-w.epm{grid-column:span 2}.ep-w.epl{grid-column:span 2;grid-row:span 2}
.ep-w small{font-weight:800;font-size:.72rem;letter-spacing:.06em;text-transform:uppercase;opacity:.75}
.ep-w .epzahl{font:800 2.6rem/1 "Bricolage Grotesque","Fredoka",system-ui,sans-serif}
.ep-w .epzahl.k{font-size:1.9rem}
.ep-w .epring~.epzahl{padding-right:60px}
.ep-w.dunkel{background:linear-gradient(150deg,#1B2240,#3D3A8F);color:#fff;border:0}
.ep-w.orange{background:linear-gradient(150deg,#FFB347,#FF5F9E);color:#fff;border:0}
.ep-w.gruen{background:linear-gradient(150deg,#0FA968,#1E9BE0);color:#fff;border:0}
.ep-w.eplila{background:linear-gradient(150deg,#5B3FE0,#C86BFF);color:#fff;border:0}
.ep-w.rot{background:linear-gradient(150deg,#FF3D6E,#FF8A3D);color:#fff;border:0}
.ep-w.epm b.epgross{font:800 1.5rem/1.1 "Bricolage Grotesque","Fredoka",system-ui,sans-serif;max-width:62%}
.ep-w.epm img{position:absolute;right:-6px;bottom:-8px;height:92%}
.ep-w .epvbar{height:10px;border-radius:999px;background:rgba(255,255,255,.3);overflow:hidden;max-width:58%}.ep-w .epvbar i{display:block;height:100%;background:#FFE34D;border-radius:inherit}
.ep-w .eptage{display:flex;gap:4px}.ep-w .eptage i{flex:1;height:8px;border-radius:4px;background:rgba(255,255,255,.35)}.ep-w .eptage i.an{background:#fff}
.ep-w .epring{--p:0;width:52px;height:52px;border-radius:50%;background:conic-gradient(var(--c,#8A3FE0) calc(var(--p)*1%),rgba(0,0,0,.08) 0);display:grid;place-items:center;position:absolute;right:14px;top:14px}
.ep-w .epring b{width:40px;height:40px;border-radius:50%;background:#fff;display:grid;place-items:center;font:800 .95rem "Bricolage Grotesque",sans-serif;color:var(--c,#8A3FE0)}
.ep-w .epcd b{font:800 1.9rem/1 "Bricolage Grotesque",sans-serif;letter-spacing:.02em;display:block}
.ep-w .epmini{display:inline-flex;align-items:center;gap:6px;background:#FFE34D;color:#1B2240;border-radius:999px;padding:7px 14px;font-weight:800;font-size:.9rem;align-self:flex-start}
.ep-w .epmini.hell{background:rgba(255,255,255,.9)}
.ep-w .epfakt{margin:0;font-weight:700;font-size:1rem;line-height:1.3;overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical}
.ep-w .epabz{font-size:1.7rem;letter-spacing:-.1em}
/* Zeitstrahl */
.ep-w.eptl{justify-content:flex-start;gap:0;cursor:default;grid-row:span 2;overflow:visible;height:auto}
.ep-w.eptl h4{margin:0 0 8px;font:800 1.2rem "Bricolage Grotesque","Fredoka",sans-serif}
.ep-w.eptl .epe{display:grid;grid-template-columns:52px 20px 1fr;gap:8px;align-items:start;padding:0 0 9px;position:relative;font-size:.92rem}
.ep-w.eptl .epe::before{content:"";position:absolute;left:61px;top:20px;bottom:-2px;width:2px;background:#E6E3F6}
.ep-w.eptl .epe:last-child::before{display:none}
.ep-w.eptl .epe time{font:800 .78rem ui-monospace,monospace;color:var(--ep-mut);padding-top:3px;white-space:nowrap}
.ep-w.eptl .epe i{width:20px;height:20px;border-radius:50%;background:#fff;border:4px solid #C9C3EE;display:block;z-index:1;margin-top:1px}
.ep-w.eptl .epe.st-ok i{background:#0FA968;border-color:#0FA968}.ep-w.eptl .epe.st-jetzt i{border-color:#E043B8;box-shadow:0 0 0 6px rgba(224,67,184,.18)}.ep-w.eptl .epe.st-vorbei i{border-color:#D9D6EA}
.ep-w.eptl .epe b{display:block;color:var(--ep-ink);font-size:.95rem}.ep-w.eptl .epe small{color:var(--ep-mut);text-transform:none;letter-spacing:0;font-weight:500;font-size:.82rem}
.ep-w.eptl .epe.st-ok b{text-decoration:line-through;opacity:.6}.ep-w.eptl .epe.st-vorbei{opacity:.6}
.ep-w.eptl .epe .ep-btn{margin-top:4px;padding:6px 12px;font-size:.85rem}
@media (max-width:860px){.ep-wg{grid-template-columns:repeat(2,1fr);grid-auto-rows:minmax(140px,auto)}.ep-w.epl{grid-row:span 1}.ep-w.eptl{grid-row:span 1;height:auto;overflow:visible}}
@media (max-width:560px){.ep-wg{gap:10px;grid-auto-rows:minmax(132px,auto)}.ep-w .epfakt{-webkit-line-clamp:2}.ep-w{padding:13px}.ep-w .epzahl{font-size:2rem}.ep-w.epm b.epgross{font-size:1.2rem}.ep-w .epcd b{font-size:1.5rem}.ep-w.eptl{grid-row:span 1}.ep-w.eptl .epe{grid-template-columns:44px 20px 1fr}.ep-w.eptl .epe::before{left:53px}}
/* Bereit: Duell */
.ep-bereit{position:relative;border-radius:36px;padding:84px 24px 0;text-align:center;overflow:hidden;margin-top:22px;background:linear-gradient(160deg,#FFE6D6,#FFD6E8 50%,#E6E0FF);box-shadow:0 30px 60px -36px rgba(27,34,64,.5);color:#1B2240}
.ep-bereit h2{margin:0 0 6px;font:800 clamp(1.8rem,4vw,3rem)/1.05 "Bricolage Grotesque","Fredoka",sans-serif}
.ep-bereit p{margin:0 0 14px;color:#5D5C80;font-weight:600}
.ep-bereit>img{display:block;height:clamp(220px,30vw,380px);margin:14px auto 0;filter:drop-shadow(0 16px 16px rgba(27,34,64,.25))}
.ep-bereit .epgegner{position:absolute;right:24px;top:24px;background:#fff;border-radius:18px;padding:10px 14px;text-align:left;box-shadow:0 14px 28px -18px rgba(27,34,64,.6);font-weight:800;display:flex;align-items:center;gap:10px;color:#1B2240}
.ep-bereit .epgegner small{display:block;font-weight:500;color:#5D5C80}
.ep-bereit .epgegner .epav{width:44px;height:44px;border-radius:50%;overflow:hidden;background:#F1EEFF;flex:none}
.ep-bereit .epgegner .epav img{width:100%;height:100%;object-fit:cover;object-position:top;transform:scale(1.5);transform-origin:top center}
.ep-bereit .ep-row{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
@media (max-width:640px){.ep-bereit{padding-top:24px}.ep-bereit .epgegner{position:static;margin:0 auto 10px;width:max-content;max-width:100%}.ep-bereit>img{height:200px}}
/* Team-Wahl */
.ep-modal{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;background:rgba(16,21,44,.55);backdrop-filter:blur(4px);padding:16px;overflow:auto}
.ep-box{position:relative;background:#fff;color:#1B2240;border-radius:30px;padding:26px 24px 22px;max-width:min(880px,96vw);width:100%;box-shadow:0 30px 60px -20px rgba(0,0,0,.6);text-align:center;animation:epPop .4s cubic-bezier(.2,1.4,.4,1)}
@keyframes epPop{from{transform:scale(.7);opacity:0}}
.ep-box h2{margin:0 0 4px;font:800 1.8rem "Bricolage Grotesque","Fredoka",sans-serif}
.ep-box .ep-zu{position:absolute;right:14px;top:14px;border:0;background:#F1EEFF;width:36px;height:36px;border-radius:50%;font-weight:800;cursor:pointer}
.ep-teamgrid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:14px}
.ep-team{position:relative;border:3px solid transparent;border-radius:30px;padding:22px;min-height:210px;text-align:left;overflow:hidden;color:#1B2240;display:flex;flex-direction:column;justify-content:flex-end;cursor:pointer;font:inherit;box-shadow:0 24px 44px -34px rgba(27,34,64,.55);transition:transform .15s}
.ep-team:hover{transform:translateY(-3px)}
.ep-team.eplumi{background:linear-gradient(135deg,#FFE1EC,#FFF0D9)}.ep-team.epmilo{background:linear-gradient(135deg,#DCE6FF,#D9F6E8)}
.ep-team.epan{border-color:#8A3FE0}
.ep-team img{position:absolute;right:0;bottom:0;height:200px;filter:drop-shadow(0 10px 10px rgba(27,34,64,.25))}
.ep-team small{font-weight:800;font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;color:#5D5C80}
.ep-team b{display:block;font:800 1.6rem "Bricolage Grotesque","Fredoka",sans-serif;margin:2px 0 4px}
.ep-team p{margin:0 0 10px;font-weight:600;color:#5D5C80;max-width:55%}
.ep-team .ep-btn{align-self:flex-start;padding:10px 18px;font-size:.95rem}
.ep-team.epmilo .ep-btn{background:linear-gradient(135deg,#3D5AFE,#1E9BE0);box-shadow:0 6px 0 #1F3BB0}
.ep-team.eplumi .ep-btn{background:linear-gradient(135deg,#FF3D6E,#E043B8);box-shadow:0 6px 0 #9B1F7C}
@media (max-width:640px){.ep-teamgrid{grid-template-columns:1fr}.ep-team{min-height:170px}.ep-team img{height:150px}.ep-team p{max-width:60%}}
/* Wochen-Challenge */
.ep-woche{position:relative;overflow:hidden;border-radius:30px;padding:24px 26px;margin:26px 0 6px;color:#fff;background:linear-gradient(120deg,rgba(27,34,64,.93),rgba(61,90,254,.86) 55%,rgba(224,67,184,.82));box-shadow:0 24px 44px -24px rgba(27,34,64,.8);text-align:left;min-height:230px}
.ep-woche h2{margin:8px 0 4px;font:800 clamp(1.5rem,3vw,2.3rem) "Bricolage Grotesque","Fredoka",sans-serif;color:#fff}
.ep-woche p{max-width:55%;margin:4px 0 12px;opacity:.95}
.ep-woche .epcdz{display:flex;gap:8px;margin-bottom:14px}
.ep-woche .epcdz span{background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.3);border-radius:14px;padding:8px 12px;text-align:center;min-width:62px}
.ep-woche .epcdz b{display:block;font:800 1.4rem "Bricolage Grotesque",sans-serif}.ep-woche .epcdz small{font-size:.7rem;opacity:.85}
.ep-woche .epziel{max-width:55%}
.ep-woche .epziel .epvbar{height:12px;border-radius:999px;background:rgba(255,255,255,.2);overflow:hidden}.ep-woche .epziel .epvbar i{display:block;height:100%;background:linear-gradient(90deg,#FFE34D,#FF8A3D);border-radius:inherit}
.ep-woche .epziel small{display:block;margin-top:4px}
.ep-woche .epkids{position:absolute;right:24px;bottom:8px;display:flex;align-items:flex-end}
.ep-woche .epkids img{height:270px;filter:drop-shadow(0 12px 16px rgba(0,0,0,.35))}
.ep-woche .epkids img+img{margin-left:-30px}
.ep-woche .ep-btn{margin-top:14px}
.ep-woche.epfertig{background:linear-gradient(120deg,#0B6E6A,#0FA968 60%,#4CD08A)}
@media (max-width:860px){.ep-woche .epkids img{height:200px}.ep-woche p,.ep-woche .epziel{max-width:62%}}
@media (max-width:560px){.ep-woche{padding:20px 18px 210px}.ep-woche p,.ep-woche .epziel{max-width:none}.ep-woche .epkids{right:50%;transform:translateX(50%)}.ep-woche .epkids img{height:190px}}
/* Gruppenchat */
.ep-chat{max-width:760px;margin:0 auto;text-align:center}
.ep-chatkopf{display:flex;align-items:center;gap:12px;background:rgba(255,255,255,.85);border-radius:999px;padding:8px 18px 8px 10px;margin:0 auto 14px;width:max-content;max-width:100%;color:#1B2240;font-weight:800;box-shadow:0 10px 24px -16px rgba(27,34,64,.6)}
.ep-chatkopf .epavs{display:flex}.ep-chatkopf .epavs span{width:36px;height:36px;border-radius:50%;overflow:hidden;border:2px solid #fff;background:#F1EEFF;margin-right:-10px}
.ep-chatkopf .epavs img{width:100%;height:100%;object-fit:cover;object-position:top;transform:scale(1.5);transform-origin:top center}
.ep-chatkopf small{display:block;font-weight:500;color:#5D5C80;font-size:.78rem}
.ep-chatbox{background:rgba(255,255,255,.92);border-radius:28px;padding:18px 20px;display:flex;flex-direction:column;gap:10px;text-align:left;box-shadow:0 24px 44px -34px rgba(27,34,64,.55);min-height:200px;color:#1B2240}
.ep-msg{display:flex;align-items:flex-end;gap:10px;max-width:85%;animation:epMsg .35s ease}
@keyframes epMsg{from{opacity:0;transform:translateY(8px)}}
.ep-msg.r{align-self:flex-end;flex-direction:row-reverse}
.ep-msg .epav{width:44px;height:44px;border-radius:50%;overflow:hidden;flex:none;padding:2px;background:linear-gradient(135deg,#FFB347,#E043B8,#3D5AFE)}
.ep-msg .epav span{display:block;width:100%;height:100%;border-radius:50%;overflow:hidden;background:#fff}
.ep-msg .epav img{width:100%;height:100%;object-fit:cover;object-position:top;transform:scale(1.5);transform-origin:top center}
.ep-msg div.ept{background:#F1EEFF;border-radius:20px;padding:11px 15px;font-weight:600;line-height:1.35;border-bottom-left-radius:6px}
.ep-msg.r div.t{background:#E2E8FF;border-bottom-left-radius:20px;border-bottom-right-radius:6px}
.ep-msg div.ept.eptippt{color:#8A87A8;letter-spacing:.2em}
.ep-chatantw{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:8px}
.ep-chatantw button{background:#fff;border:2px solid #E6E3F6;border-radius:999px;padding:10px 16px;font:800 .95rem "Lexend",system-ui,sans-serif;color:#1B2240;cursor:pointer}
.ep-chatantw button.ephaupt{border-color:#E043B8;background:linear-gradient(135deg,#FFE9F6,#fff)}
.ep-chatantw button:disabled{opacity:.5}
.ep-chatkids{display:flex;justify-content:center;margin-top:-6px}
.ep-chatkids img{height:clamp(150px,18vw,230px);margin:0 -10px;filter:drop-shadow(0 16px 16px rgba(27,34,64,.28))}
/* Live-Quiz */
.ep-live{max-width:1000px;margin:0 auto;text-align:left}
.ep-dunkel{position:relative;overflow:hidden;border-radius:30px;padding:24px 26px;color:#fff;background:linear-gradient(120deg,#1B2240,#3D5AFE 55%,#8A3FE0);box-shadow:0 24px 44px -24px rgba(27,34,64,.8)}
.ep-dunkel h1,.ep-dunkel h2{color:#fff;margin:8px 0 4px;font:800 clamp(1.6rem,3.4vw,2.4rem) "Bricolage Grotesque","Fredoka",sans-serif}
.ep-livekopf{display:grid;grid-template-columns:1.2fr .8fr;gap:16px;align-items:end}
.ep-cd{font-size:1.1rem;margin:10px 0}.ep-cd b{font:800 1.6rem "Bricolage Grotesque",sans-serif}
.ep-teamzeile{margin:6px 0 14px}.ep-teamzeile .ep-link{color:#FFE34D}
.ep-row{display:flex;gap:10px;flex-wrap:wrap;margin-top:8px}
.ep-arena{display:grid;grid-template-columns:1fr auto 1fr;gap:12px;align-items:end;min-height:200px}
.ep-arena.epklein{grid-template-columns:120px 1fr 120px;align-items:end;margin-top:14px;min-height:0}
.ep-turm{position:relative;height:200px;border-radius:20px;background:rgba(255,255,255,.12);display:flex;flex-direction:column;justify-content:flex-end;align-items:center;overflow:visible;text-align:center}
.ep-turm .ep-fill{position:absolute;left:0;right:0;bottom:0;border-radius:20px;height:0;transition:height .6s}
.ep-turm.eplumi .ep-fill{background:linear-gradient(0deg,#E043B8,#FF7AD9)}.ep-turm.epmilo .ep-fill{background:linear-gradient(0deg,#3D5AFE,#8FA6FF)}
.ep-turm img{position:relative;height:120px;margin-bottom:auto;transform:translateY(-30px);filter:drop-shadow(0 10px 12px rgba(0,0,0,.35));z-index:1}
.ep-turm span{position:relative;font-weight:800;padding:8px 6px;z-index:1;font-size:.9rem}
.ep-vs{font:800 2.4rem "Bricolage Grotesque",sans-serif;color:#FFE34D;text-shadow:0 4px 0 #C9A200;align-self:center}
.ep-liverun{padding:18px 20px 20px}
.ep-livezeile{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.ep-livezeile b{font:800 1.2rem "Bricolage Grotesque",sans-serif}
.ep-uhr{margin-left:auto;font-weight:800;background:rgba(255,255,255,.14);border-radius:999px;padding:6px 14px}
.ep-livepunkt{display:inline-flex;align-items:center;gap:8px;background:#FF3D6E;border-radius:999px;padding:4px 12px;font-weight:800;font-size:.8rem}
.ep-livepunkt i{width:8px;height:8px;border-radius:50%;background:#fff;animation:epPuls 1s infinite}
@keyframes epPuls{50%{opacity:.2}}
.ep-frage{background:#fff;color:#1B2240;border-radius:24px;padding:18px 20px;box-shadow:0 20px 40px -20px rgba(0,0,0,.6);min-height:200px;align-self:stretch}
.ep-balken{height:10px;border-radius:999px;background:#E9E5FF;overflow:hidden;margin-bottom:12px}.ep-balken i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#3D5AFE,#8A3FE0,#E043B8);transition:width .25s linear}
.ep-q{font:800 1.3rem/1.3 "Bricolage Grotesque","Fredoka",sans-serif;margin:0 0 14px}
.ep-antw{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.ep-antw button{border:0;border-radius:16px;padding:14px 12px;font:700 1rem "Lexend",system-ui,sans-serif;color:#fff;cursor:pointer;box-shadow:0 5px 0 rgba(0,0,0,.2);transition:transform .1s;text-align:center}
.ep-antw button:nth-child(1){background:#3D5AFE}.ep-antw button:nth-child(2){background:#E043B8}.ep-antw button:nth-child(3){background:#0FA968}.ep-antw button:nth-child(4){background:#F09A12}
.ep-antw button.epgewaehlt{outline:4px solid #1B2240}
.ep-antw button.eprichtig{outline:4px solid #B9F5D8}.ep-antw button.epfalsch{opacity:.3}
.ep-antw button:disabled{cursor:default}
.ep-punkte{margin:12px 0 0;font-weight:800;color:#5D5C80}
.ep-aufl{margin:10px 0 0;font-weight:700}.ep-aufl small{display:block;font-weight:500;color:#5D5C80;margin-top:4px}
.ep-lobby{text-align:center;padding:20px 0}.ep-lobby h2{color:#1B2240;margin:0 0 8px}
.ep-card{background:rgba(255,255,255,.92);border-radius:26px;padding:20px 22px;margin-top:14px;color:#1B2240;box-shadow:0 20px 40px -30px rgba(27,34,64,.55)}
.ep-card h1,.ep-card h2{margin:0 0 8px;font:800 1.4rem "Bricolage Grotesque","Fredoka",sans-serif}
.ep-liste{margin:0;padding-left:20px}.ep-liste li{margin:4px 0}
.ep-ende{text-align:center}.ep-ende h1{font-size:2.2rem}.ep-gross{font-size:1.3rem;font-weight:800}
.ep-stand{display:grid;gap:8px;max-width:520px;margin:14px auto}
.ep-stand div{display:grid;grid-template-columns:110px 1fr 70px;align-items:center;gap:10px;text-align:left}
.ep-stand i{display:block;height:16px;border-radius:999px;background:#EEEAF9;position:relative;overflow:hidden}
.ep-stand i::after{content:"";position:absolute;left:0;top:0;bottom:0;width:var(--w,0%);border-radius:inherit}
.ep-stand .eplumi i::after{background:linear-gradient(90deg,#E043B8,#FF7AD9)}.ep-stand .epmilo i::after{background:linear-gradient(90deg,#3D5AFE,#8FA6FF)}
.ep-stand span{font-weight:800;text-align:right}
@media (max-width:760px){.ep-livekopf{grid-template-columns:1fr}.ep-arena{min-height:160px}.ep-turm{height:150px}.ep-turm img{height:90px;transform:translateY(-20px)}.ep-arena.epklein{grid-template-columns:1fr 1fr}.ep-arena.epklein .ep-frage{grid-column:1/-1;order:-1}.ep-arena.epklein .ep-turm{height:120px}.ep-arena.epklein .ep-turm img{height:70px;transform:translateY(-14px)}.ep-antw{grid-template-columns:1fr}}
/* Meldung */
.ep-meldung{position:fixed;left:50%;top:16px;transform:translateX(-50%);z-index:9998;background:#fff;color:#1B2240;border:3px solid #0FA968;border-radius:18px;padding:10px 16px;font-weight:700;box-shadow:0 14px 30px -12px rgba(0,0,0,.45);display:flex;gap:10px;align-items:center;max-width:92vw;animation:epMeld 4.2s ease forwards}
.ep-meldung .epe{font-size:1.8rem}.ep-meldung small{display:block;font-weight:500;color:#5D5C80}
@keyframes epMeld{0%{opacity:0;transform:translate(-50%,-20px)}8%,85%{opacity:1;transform:translate(-50%,0)}100%{opacity:0;transform:translate(-50%,-20px)}}
/* Profil: Lumi liegt */
.ep-liegt{position:relative}
.ep-liegt .pagehead{position:relative;padding-right:min(38%,260px);min-height:150px}
.ep-liegt .pagehead>div:not(.bigav){min-width:0}
.ep-liegt .pagehead h1{overflow-wrap:anywhere}
.ep-liegt .pagehead::after{content:"";position:absolute;right:0;top:50%;transform:translateY(-50%);height:min(100%,150px);width:min(34%,230px);background:url(${KIDS}liegen.webp) no-repeat center bottom/contain;filter:drop-shadow(0 12px 14px rgba(27,34,64,.25));pointer-events:none}
@media (max-width:560px){.ep-liegt .pagehead{padding-right:0;padding-bottom:130px;min-height:0}.ep-liegt .pagehead::after{width:210px;height:130px;top:auto;bottom:0;right:50%;transform:translateX(50%)}}
@media (max-width:560px){.segs:not(.rlsegs):not(.btabs){flex-wrap:wrap!important;overflow:visible!important}.segs:not(.rlsegs) .seg{white-space:normal!important}}
/* Qeels: Stories */
.rstories{position:absolute;z-index:5;top:64px;left:50%;transform:translateX(-50%);width:min(100vw,calc(100dvh * 9 / 16));display:flex;gap:8px;overflow-x:auto;overflow-y:visible;padding:6px 12px 8px;scroll-snap-type:x proximity;scroll-padding-left:12px;box-sizing:border-box;scrollbar-width:none;pointer-events:auto;-webkit-overflow-scrolling:touch}
.rstories::-webkit-scrollbar{display:none}
.rstories button{flex:0 0 auto;scroll-snap-align:start;display:flex;flex-direction:column;align-items:center;gap:9px;background:none;border:0;cursor:pointer;color:#fff;font:700 .7rem "Lexend",system-ui,sans-serif;text-shadow:0 1px 3px rgba(0,0,0,.6);width:64px}
.rstories .epring{width:50px;height:50px;flex:none;box-sizing:border-box;border-radius:50%;padding:3px;background:conic-gradient(#FF8A3D,#E043B8,#8A3FE0,#3D5AFE,#0FA968,#FF8A3D);position:relative}
.rstories .epring b{display:grid;place-items:center;width:100%;height:100%;border-radius:50%;background:#fff;border:2px solid #1B2240;font-size:1.5rem;box-sizing:border-box}
.rstories .epring b svg,.rstories .epring b img{width:26px;height:26px}
.rstories button.epgesehen .ring{background:rgba(255,255,255,.35)}
.rstories .epring.epneu::after{content:"NEU";position:absolute;z-index:2;left:50%;bottom:-8px;transform:translateX(-50%);background:#FF3D6E;color:#fff;font-size:.55rem;font-weight:800;line-height:1.3;border-radius:7px;padding:1px 6px;border:2px solid #1B2240;white-space:nowrap}
.rstories button>span:last-child{font-size:.62rem;line-height:1.08;max-width:72px;overflow:hidden;white-space:normal;hyphens:auto;-webkit-hyphens:auto;word-break:break-word;text-align:center;line-height:1.15;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
@media (min-width:761px){.rstories{top:80px;width:min(100vw,calc((100dvh - 32px) * 9 / 16),480px)}}
/* Profil-Code */
.ep-code{display:grid;grid-template-columns:auto auto auto;align-items:center;gap:6px 12px;max-width:1100px;margin:-10px auto 18px;background:rgba(255,255,255,.92);border-radius:20px;padding:12px 18px;color:#1B2240;box-shadow:0 16px 30px -20px rgba(27,34,64,.5)}
.ep-code .ep-codelbl{font-weight:700;color:#5D5C80;font-size:.9rem}
.ep-code b{font:800 1.5rem "Bricolage Grotesque",sans-serif;letter-spacing:.08em;font-variant-numeric:tabular-nums}
.ep-code small{grid-column:1/-1;color:#5D5C80;font-size:.82rem}
.ep-codekopie{border:0;border-radius:999px;background:linear-gradient(135deg,#3D5AFE,#8A3FE0);color:#fff;font:700 .85rem Lexend,system-ui,sans-serif;padding:7px 14px;cursor:pointer;justify-self:start}
body.ep-app .ep-code{margin:0 0 12px}
/* Wordmark auf iPad und iPhone weg */
@media (max-width:1100px),(pointer:coarse) and (max-width:1400px){.topbar .wmimg{display:none!important}.topbar .eplogo{flex:0 0 auto!important;width:auto!important}.topbar .eplogoimg{display:inline-block!important;height:44px!important;width:auto!important}}
`;
document.head.appendChild(css);

/* ---------- Startseite ---------- */
function slotLabel(sl){ return `${String(sl.std).padStart(2,"0")}:00`; }
function zeitstrahl(){
  const tq = tagesquiz(), nf = fehlerAnzahl(), s = serie(), slots = liveSlots().filter(sl => heute(sl.start) === heute() && liveStatus(sl) !== "vorbei").slice(0, 2);
  const e = [];
  e.push({t:"jetzt", st:tq ? "st-ok" : "st-jetzt", b:"Tagesquiz", s:tq ? `Erledigt: ${tq.r} von ${tq.n} richtig` : "5 neue Fragen, jeden Tag", a:"chat", btn:tq ? "" : "▶ Spielen"});
  slots.forEach(sl => { const st = liveStatus(sl); e.push({t:slotLabel(sl), st:"st-" + st, b:"Live-Quiz: " + (sl.thema ? sl.thema.name : "Gemischt"), s:st === "ok" ? `Gespielt: ${LS.get(K.live, {})[sl.key].r} von ${LIVE.fragen} richtig` : st === "jetzt" ? "Läuft gerade!" : st === "vorbei" ? "Verpasst, am Abend oder morgen wieder" : LIVE.fragen + " Fragen, alle gleichzeitig", a:"live", btn:st === "jetzt" ? "⚡ Mitspielen" : ""}); });
  e.splice(2, 0, {t:"", st:nf ? "st-offen" : "st-ok", b:nf ? `Fehler üben (${nf})` : "Fehler üben", s:nf ? "Falsche Fragen nochmals versuchen" : "Keine offenen Fehler", a:"fehler", btn:""});
  e.push({t:"", st:s.aktiv ? "st-ok" : "st-offen", b:"Serie halten", s:s.aktiv ? `Heute geschafft, ${s.n} ${s.n === 1 ? "Tag" : "Tage"} am Stück` : `Noch ${Math.max(0, 5 - s.heute)} Fragen, dann sind es ${s.n + 1} ${s.n + 1 === 1 ? "Tag" : "Tage"}`, a:"zufall", btn:""});
  return `<div class="ep-w epl eptl"><h4>📋 Dein Tag</h4>${e.map(x => `<div class="epe ${x.st}"><time>${x.t}</time><i></i><div><b>${h(x.b)}</b><small>${h(x.s)}</small>${x.btn ? `<br><button type="button" class="ep-btn klein" data-a="${x.a}">${x.btn}</button>` : ""}</div></div>`).join("")}</div>`;
}
function testThema(neu){
  let id = null; try{ id = sessionStorage.getItem("ep-testthema"); }catch(e){}
  const ok = x => x && THEMA[x] && (() => { try{ return pool(x).length >= TEST_MIN; }catch(e){ return false; } })();
  if(neu || !ok(id)){ const l = themenListe().filter(ok); if(!l.length) return null; let n = l[Math.floor(Math.random() * l.length)]; if(l.length > 1) while(n === id) n = l[Math.floor(Math.random() * l.length)]; id = n; try{ sessionStorage.setItem("ep-testthema", id); }catch(e){} }
  return THEMA[id];
}
function testKarte(){
  const t = testThema(); if(!t) return "";
  let bp = 0; try{ bp = myBest(t.id) || 0; }catch(e){}
  const ic = typeof themaIcon === "function" ? themaIcon(t) : h(t.emo || "🏆");
  return `<div class="ep-w epm dunkel ep-testk"><small>🏆 Gewerteter Test · zufälliges Thema</small>
    <div class="eptk-thema"><span class="eptk-ic" aria-hidden="true">${ic}</span><b class="epgross">${h(t.name)}</b></div>
    <span class="epzufalltext">${Math.min(TEST_LEN, (() => { try{ return pool(t.id).length; }catch(e){ return TEST_LEN; } })())} Fragen · 30 Minuten · Punkte für die Rangliste${bp ? ` · dein Bestwert ${bp}` : ""}</span>
    <span class="eptk-knoepfe"><button type="button" class="ep-btn gelb klein" data-a="test" data-t="${h(t.id)}">▶ Test starten</button><button type="button" class="ep-btn weiss klein" data-a="testneu">🎲 Anderes Thema</button></span>
    <img src="${KIDS}spring1.webp" alt=""></div>`;
}
const TACHO = [{id:1, n:"Entdecker", c:"#2BD67B", ic:"🌱"}, {id:2, n:"Könner", c:"#4D7CFF", ic:"🚀"}, {id:3, n:"Profis", c:"#FFC23A", ic:"🏅"}, {id:4, n:"Alle Stufen", c:"#FF5FD2", ic:"🌍"}];
const TC = {cx:120, cy:122, r:92};
const tcWinkel = st => 180 - (st - .5) * 45;               // Grad, 180 = links, 0 = rechts
const tcPunkt = (grad, r) => [TC.cx + r * Math.cos(grad * Math.PI / 180), TC.cy - r * Math.sin(grad * Math.PI / 180)];
function tachoText(st){ const t = TACHO[st - 1]; let n = 0; try{ n = st === 4 ? allCount() : allCountL(st); }catch(e){}
  return {name:t.n, sub:st === 4 ? "aus allen Stufen" : ((STUFEN.find(x => x.id === st) || {}).alter || ""), n:zahl(n) + " Fragen"}; }
function tacho(){
  const st = [1, 2, 3, 4].includes(S.stufe) ? S.stufe : 1, akt = TACHO[st - 1], tx = tachoText(st);
  const [ax, ay] = tcPunkt(180, TC.r), [bx, by] = tcPunkt(0, TC.r);
  const ticks = []; for(let i = 0; i <= 24; i++){ const g = 180 - i * 7.5, gross = i % 6 === 0; const [x1, y1] = tcPunkt(g, TC.r + 16), [x2, y2] = tcPunkt(g, TC.r + (gross ? 25 : 21)); ticks.push(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="rgba(255,255,255,${gross ? .55 : .25})" stroke-width="${gross ? 2 : 1.2}" stroke-linecap="round"/>`); }
  const knoepfe = TACHO.map(x => { const [px, py] = tcPunkt(tcWinkel(x.id), TC.r); return `<button type="button" class="eptc-k${x.id === st ? " an" : ""}" data-stufe="${x.id}" style="left:${(px / 240 * 100).toFixed(2)}%;top:${(py / 140 * 100).toFixed(2)}%;--kc:${x.c}" aria-pressed="${x.id === st}" aria-label="${h(x.n)}"><span>${x.ic}</span></button>`; }).join("");
  return `<div class="ep-w ep-tacho" style="--tc:${akt.c}"><small>Deine Stufe</small>
    <div class="eptc-feld">
      <svg viewBox="0 0 240 140" class="eptc-svg" aria-hidden="true">
        <defs><linearGradient id="tcGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2BD67B"/><stop offset=".36" stop-color="#4D7CFF"/><stop offset=".68" stop-color="#FFC23A"/><stop offset="1" stop-color="#FF5FD2"/></linearGradient>
          <linearGradient id="tcNadel" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fff"/><stop offset="1" style="stop-color:var(--tc)"/></linearGradient>
          <filter id="tcGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter></defs>
        ${ticks.join("")}
        <path d="M${ax} ${ay} A${TC.r} ${TC.r} 0 0 1 ${bx} ${by}" stroke="rgba(255,255,255,.1)" stroke-width="14" fill="none" stroke-linecap="round"/>
        <path class="eptc-glow" d="M${ax} ${ay} A${TC.r} ${TC.r} 0 0 1 ${bx} ${by}" stroke="url(#tcGrad)" stroke-width="14" fill="none" stroke-linecap="round" pathLength="100" stroke-dasharray="100 100" stroke-dashoffset="${100 - st * 25}" filter="url(#tcGlow)" opacity=".7"/>
        <path class="eptc-bogen" d="M${ax} ${ay} A${TC.r} ${TC.r} 0 0 1 ${bx} ${by}" stroke="url(#tcGrad)" stroke-width="14" fill="none" stroke-linecap="round" pathLength="100" stroke-dasharray="100 100" stroke-dashoffset="${100 - st * 25}"/>
        <g class="eptc-nadel" style="transform:rotate(${(180 - tcWinkel(st)).toFixed(1)}deg)"><path d="M${TC.cx - 66} ${TC.cy} L${TC.cx - 2} ${TC.cy - 5} L${TC.cx + 12} ${TC.cy} L${TC.cx - 2} ${TC.cy + 5} Z" fill="url(#tcNadel)"/></g>
        <circle cx="${TC.cx}" cy="${TC.cy}" r="13" fill="#0F1330" stroke="rgba(255,255,255,.35)" stroke-width="2"/><circle class="eptc-hub" cx="${TC.cx}" cy="${TC.cy}" r="5.5" style="fill:var(--tc)"/>
      </svg>
      ${knoepfe}
    </div>
    <div class="eptc-name"><b>${h(tx.name)}</b><small>${h(tx.sub)} · ${h(tx.n)}</small></div></div>`;
}
function qeelsKarte(){
  const l = themenListe().map(id => THEMA[id]).filter(Boolean); const rnd = zufall("qk-" + heute()); const w = [];
  for(let i = 0; i < 4 && l.length; i++) w.push(l.splice(Math.floor(rnd() * l.length), 1)[0]);
  return `<button type="button" class="ep-w ep-qk" data-a="qeels"><span class="epqk-kopf"><img class="epqk-bild" src="img/qeels-logo-klein.webp" alt="Qeels" width="480" height="156" draggable="false"></span>
    <span class="epqk-st">${w.map(t => `<span><i>${typeof themaIcon === "function" ? themaIcon(t) : "📚"}</i></span>`).join("")}</span>
    <span class="epqk-tx">Wissen in 30 Sekunden ▶</span></button>`;
}
function stufeSetzen(n){
  if(![1, 2, 3, 4].includes(n)) return; const alt = S.stufe; S.stufe = n; try{ store.set("ep-stufe", n); }catch(e){ LS.set("ep-stufe", n); }
  tachoZeigen(n);
  if(alt === n) return;
  // Rest der Startseite ohne Neuaufbau nachführen
  try{ document.querySelectorAll("#app .level[data-s]").forEach(b => b.setAttribute("aria-pressed", +b.dataset.s === n));
    const lb = document.querySelector("#bereiche small"); if(lb) lb.textContent = `${allCountL(n)} Fragen für ${stufeObj().name} · ${allCount()} insgesamt`;
    document.querySelectorAll("#app .bereiche .bereich[data-b]").forEach(b => { const be = BEREICHE.find(x => x.id === b.dataset.b), p = b.querySelector(".count-pill"); if(be && p) p.textContent = countBereich(be, n) + " Fragen"; });
  }catch(e){ console.warn("startseite.js", e); }
}
function tachoZeigen(st){
  const k = document.querySelector("#app .ep-tacho"); if(!k) return; const akt = TACHO[st - 1], tx = tachoText(st);
  k.style.setProperty("--tc", akt.c);
  const n = k.querySelector(".eptc-nadel"); if(n){ n.style.transition = ""; n.style.transform = `rotate(${(180 - tcWinkel(st)).toFixed(1)}deg)`; }
  k.querySelectorAll(".eptc-bogen,.eptc-glow").forEach(p => p.setAttribute("stroke-dashoffset", 100 - st * 25));
  k.querySelectorAll(".eptc-k").forEach(b => { const an = +b.dataset.stufe === st; b.classList.toggle("an", an); b.setAttribute("aria-pressed", an); });
  const nm = k.querySelector(".eptc-name"); if(nm){ nm.classList.remove("neu"); void nm.offsetWidth; nm.classList.add("neu"); nm.innerHTML = `<b>${h(tx.name)}</b><small>${h(tx.sub)} · ${h(tx.n)}</small>`; }
}
function tachoBinden(){
  const k = document.querySelector("#app .ep-tacho"); if(!k) return; const feld = k.querySelector(".eptc-feld"), svg = k.querySelector(".eptc-svg"), nadel = k.querySelector(".eptc-nadel");
  let zeiger = false;
  k.querySelectorAll(".eptc-k").forEach(b => b.addEventListener("click", e => { e.stopPropagation(); if(zeiger){ zeiger = false; return; } stufeSetzen(+b.dataset.stufe); }));
  document.querySelectorAll("#app .level[data-s]").forEach(b => b.onclick = () => stufeSetzen(+b.dataset.s));
  const grad = e => { const r = svg.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 240 - TC.cx, y = TC.cy - (e.clientY - r.top) / r.height * 140; return Math.atan2(Math.max(0, y), x) * 180 / Math.PI; };
  const stufeAus = g => Math.min(4, Math.max(1, Math.floor((180 - g) / 45) + 1));
  let zieht = false, bewegt = false, x0 = 0, y0 = 0;
  feld.style.touchAction = "none";
  feld.addEventListener("pointerdown", e => { if(e.button > 0) return; zieht = true; bewegt = false; x0 = e.clientX; y0 = e.clientY; try{ feld.setPointerCapture(e.pointerId); }catch(err){} });
  feld.addEventListener("pointermove", e => { if(!zieht) return; if(Math.hypot(e.clientX - x0, e.clientY - y0) > 4) bewegt = true; if(!bewegt) return;
    const g = grad(e); nadel.style.transition = "none"; nadel.style.transform = `rotate(${(180 - g).toFixed(1)}deg)`;
    const st = stufeAus(g); k.style.setProperty("--tc", TACHO[st - 1].c); k.querySelectorAll(".eptc-k").forEach(b => b.classList.toggle("an", +b.dataset.stufe === st)); });
  feld.addEventListener("pointerup", e => { if(!zieht) return; zieht = false; zeiger = true; setTimeout(() => { zeiger = false; }, 50);
    const kn = !bewegt && e.target.closest && e.target.closest(".eptc-k");
    stufeSetzen(kn ? +kn.dataset.stufe : stufeAus(grad(e))); });
  feld.addEventListener("pointercancel", () => { zieht = false; tachoZeigen(S.stufe); });
}
function widgets(){
  const s = serie(), lv = level(), tq = tagesquiz(), ab = abzeichenZahl(), zl = LS.get(K.zuletzt, null), fk = fakt(), nf = fehlerAnzahl(), nl = liveNaechster();
  const mitternacht = new Date(); mitternacht.setHours(24, 0, 0, 0);
  const wt = []; for(let i = 6; i >= 0; i--){ wt.push((LS.get("ep-lerntage", {})[heute(Date.now() - i * 864e5)] || 0) >= 5); }
  return `<div class="ep-wg">
    ${zeitstrahl()}
    ${testKarte()}
    <button type="button" class="ep-w orange" data-a="zufall"><small>Serie</small><div class="epzahl">${s.n} 🔥</div><div class="eptage">${wt.map(x => `<i class="${x ? "an" : ""}"></i>`).join("")}</div></button>
    <button type="button" class="ep-w" data-a="profil" style="--c:${lv ? lv.titel.farbe : "#8A3FE0"}"><small>Level</small>${lv ? `<span class="epring" style="--p:${Math.round(lv.anteil * 100)}"><b>${lv.level}</b></span><div class="epzahl k">${lv.titel.emo} ${h(lv.titel.name)}</div><span style="font-weight:700;font-size:.85rem;color:var(--ep-mut)">+${zahl(lv.heute)} XP heute</span>` : `<div class="epzahl k">Level 1</div>`}</button>
    <button type="button" class="ep-w epm ${nl && liveStatus(nl) === "jetzt" ? "rot" : "lila"}" data-a="live"><small>⚡ Live-Quiz ${nl ? "· " + slotLabel(nl) + " Uhr" : ""}</small><div class="epcd">${nl ? (liveStatus(nl) === "jetzt" ? `<b>LÄUFT JETZT</b><span>${h(nl.thema ? nl.thema.name : "")}</span>` : `<b id="epLiveCd">${dauerText(nl.start - Date.now())}</b><span>bis zum Start · ${h(nl.thema ? nl.thema.name : "")}</span>`) : ""}</div><span class="epmini">${nl && liveStatus(nl) === "jetzt" ? "Mitspielen ⚡" : "Team wählen"}</span></button>
    ${tacho()}
    <button type="button" class="ep-w" data-a="profil"><small>Abzeichen</small><div class="epabz">🏅🦊⭐</div><span style="font-weight:800">${ab.hat} von ${ab.alle}</span></button>
    <button type="button" class="ep-w epm" data-a="${fk ? "fakt" : "zufall"}" data-t="${fk ? h(fk.t) : ""}"><small>💡 Wusstest du?</small><p class="epfakt">${fk ? h(fk.text) : "Jede richtige Antwort bringt dich weiter."}</p><span style="font-weight:800;color:#3D5AFE">${fk ? "📖 Mehr dazu in der Bibliothek →" : "Los →"}</span></button>
    <button type="button" class="ep-w ${nf ? "gruen" : ""}" data-a="fehler"${nf ? "" : " disabled"}><small>Fehler üben</small><div class="epzahl">${nf ? nf + " 🎯" : "0 🎯"}</div><span style="font-weight:700;font-size:.85rem">${nf ? "Nochmals versuchen" : "Alles geübt"}</span></button>
    ${qeelsKarte()}
  </div>`;
}
function bereit(){
  const t = team(), nl = liveNaechster();
  return `<section class="ep-bereit"><div class="epgegner"><span class="epav"><img src="${KIDS}${t ? (t.id === "lumi" ? "j1.webp" : "m1.webp") : "j1.webp"}" alt=""></span><div>${t ? `${t.emo} ${h(t.name)}` : "Noch kein Team"}<small>${t ? "Dein Team · " : ""}${nl ? "Nächstes Live-Quiz " + slotLabel(nl) : "Team wählen"}</small></div></div>
    <h2>Bereit für dein Duell?</h2><p>Lumi und Milo sind aufgewärmt. Wähle dein Team, dann tritt gegen Freunde, Familie oder deine Klasse an.</p>
    <div class="ep-row"><button type="button" class="ep-btn" data-a="duell">⚔️ Duell starten</button><button type="button" class="ep-btn weiss" data-a="spielmodi">🎮 Wettbewerb &amp; Hardcore</button></div>
    <div class="epduo epbereit-duo"><span class="epglow eplumi"></span><span class="epglow epmilo"></span><img src="${KIDS}duo-bereit.webp" alt=""><span class="epname eplumi">Lumi</span><span class="epname epmilo">Milo</span></div></section>`;
}
function wocheHTML(){
  const d = woche(); if(!d.thema) return "";
  const rest = d.ende - Date.now(), tage = Math.floor(rest / 864e5), std = Math.floor(rest % 864e5 / 36e5), min = Math.floor(rest % 36e5 / 6e4);
  const p = Math.min(100, Math.round(d.r / d.ziel * 100));
  return `<section class="ep-woche${d.fertig ? " epfertig" : ""}"><span class="ep-tag rot">Wochen-Challenge · ${h(d.w.replace("-W", ", Woche "))}</span>
    <h2>${d.fertig ? "Geschafft: " : "Thema der Woche: "}${h(d.thema.name)} ${d.thema.emo && d.thema.emo.length <= 3 && !/^[a-z0-9_-]+$/i.test(d.thema.emo) ? h(d.thema.emo) : ""}</h2>
    <p>${d.fertig ? `Du hast die Challenge dieser Woche geschafft. Nächste Woche gibt es ein neues Thema.` : `Beantworte bis Sonntag ${d.ziel} Fragen zu «${h(d.thema.name)}» richtig und hol dir ${WOCHE_XP} XP extra.`}</p>
    <div class="epcdz"><span><b>${tage}</b><small>Tage</small></span><span><b>${std}</b><small>Std</small></span><span><b>${min}</b><small>Min</small></span></div>
    <div class="epziel"><div class="epvbar"><i style="width:${p}%"></i></div><small>${d.r} von ${d.ziel} richtig · ${d.n} beantwortet</small></div>
    <button type="button" class="ep-btn gelb" data-a="woche">${d.fertig ? "Trotzdem weiterspielen →" : "Mitmachen →"}</button>
    <div class="epkids"><img src="${KIDS}duo-jubel.webp" alt=""></div></section>`;
}
function heldSlides(){
  const rnd = zufall("held-" + heute()), l = themenListe().map(id => THEMA[id]).filter(t => t && t.text);
  const nimm = () => l.length ? l.splice(Math.floor(rnd() * l.length), 1)[0] : null;
  const a1 = nimm(), a2 = nimm(), nl = liveNaechster(), tq = tagesquiz();
  const art = (t, cls) => t ? {cls, lbl:"Aus der Bibliothek", titel:t.name, text:t.text, btn:"📖 Lesen", a:"fakt", t:t.id, ic:(() => { try{ return themaIcon(t); }catch(e){ return "📖"; } })()} : null;
  return [
    {cls:"hs-start", lbl:"", titel:"Spiel dich schlau!", text:"", btn:"▶ Los geht's", a:"themen"},
    art(a1, "hs-lib1"), art(a2, "hs-lib2"),
    {cls:"hs-tq", lbl:"Jeden Tag neu", titel:tq ? "Tagesquiz erledigt" : "Tagesquiz", text:tq ? `Heute ${tq.r} von ${tq.n} richtig. Morgen gibt es 5 neue Fragen.` : "5 Fragen, für alle gleich. Hol dir deine Serie.", btn:"📅 Spielen", a:"chat", ic:"📅"},
    nl ? {cls:"hs-live", lbl:"Live-Quiz " + slotLabel(nl) + " Uhr", titel:nl.thema ? nl.thema.name : "Live-Quiz", text:liveStatus(nl) === "jetzt" ? "Läuft jetzt! Spiel für dein Team." : "20 Fragen, alle gleichzeitig. Jede Antwort zählt für dein Team.", btn:"⚡ Mitspielen", a:"live", ic:"⚡"}
       : {cls:"hs-duell", lbl:"Duell", titel:"Wer weiss mehr?", text:"Tritt gegen Freunde, Familie oder online an.", btn:"⚔️ Duell", a:"duell", ic:"⚔️"}
  ].filter(Boolean);
}
function startseiteHTML(){
  const n = name(), themen = Object.keys(THEMA).filter(id => !THEMA[id].menu).length;
  let anz = 0; try{ anz = allCount(); }catch(e){}
  return `<div class="ep-banner"><div class="ept"><img class="eplogo" src="${typeof ICON_SRC !== "undefined" ? ICON_SRC : "img/fragezeichen.webp"}" alt="easyplay">
      <h1 class="epslogan">${n ? "Hoi " + h(n) + "! " : ""}Spiel dich schlau!</h1>
      <div class="ep-pills"><span><b>${zahl(anz)}</b> Fragen</span><span><b>${themen}</b> Themen</span><span><b>3</b> Stufen</span><span>🇨🇭 mit Schweiz-Wissen</span></div>
      <div class="ep-cta"><button type="button" class="ep-btn" data-a="themen">▶ Los geht's</button><button type="button" class="ep-btn weiss" data-a="lib">📖 Bibliothek</button><button type="button" class="ep-btn weiss" data-a="zufall">🎲 Zufällige Fragen</button></div></div>
    <div class="epduo"><img src="${KIDS}duo-winken.webp" alt=""><span class="epname eplumi">Lumi</span><span class="epname epmilo">Milo</span></div></div>
    ${widgets()}
    ${bereit()}`;
}
function aktion(a, el){
  if(a === "zufall"){ const b = document.getElementById("zufall"); if(b){ b.click(); return; } try{ startListe((typeof alleFragen === "function" ? alleFragen() : FRAGEN).filter(f => (S.stufe === 4 || f.l === S.stufe) && Array.isArray(f.a) && f.a.length === 4), "Zufällige Fragen"); }catch(e){} }
  else if(a === "chat") go("chat");
  else if(a === "mix"){ // Alles gemischt: aus jedem Bereich gleich viele Fragen der gewählten Stufe
    try{ const alle = (typeof alleFragen === "function" ? alleFragen() : FRAGEN).filter(f => (S.stufe === 4 || f.l === S.stufe) && Array.isArray(f.a) && f.a.length === 4 && THEMA[f.t]);
      const je = Math.ceil(25 / BEREICHE.length), raus = [];
      BEREICHE.forEach(b => { const p = alle.filter(f => THEMA[f.t].bereich && THEMA[f.t].bereich.id === b.id); for(let k = 0; k < je && p.length; k++) raus.push(p.splice(Math.floor(Math.random() * p.length), 1)[0]); });
      if(raus.length) startListe(raus, "Alles gemischt"); else aktion("zufall"); }catch(e){ aktion("zufall"); } }
  else if(a === "lib"){ try{ setLibModus(true); scrollTo(0, 0); }catch(e){} }
  else if(a === "tagesquiz"){ try{ window.EP_LERNEN_TQ(); }catch(e){ go("chat"); } }
  else if(a === "fehler"){ try{ const l = window.EP_LERNEN.fehlerListe(); if(l.length) startListe(l, "Fehler üben"); }catch(e){} }
  else if(a === "live") liveOeffnen();
  else if(a === "duell") teamWahl(() => go("duell"), "Duell: Für welches Team spielst du?");
  else if(a === "spielmodi") go("spielmodi");
  else if(a === "profil"){ if(S.profil) go("profil"); else go("register"); }
  else if(a === "qeels"){ try{ oeffneReels(); }catch(e){} }
  else if(a === "woche") go("epwoche");
  else if(a === "wochetrain") wocheStarten();
  else if(a === "themen"){ const z = document.getElementById("bereiche") || document.querySelector("#app .bereiche"); if(z) z.scrollIntoView({behavior:ruhig() ? "auto" : "smooth", block:"start"}); }
  else if(a === "test"){ const t = THEMA[el && el.dataset.t]; if(!t) return; S.thema = t; if(!S.profil){ S.after = "mode"; go("register"); } else { try{ startQuiz(t.id, "test"); }catch(e){ go("mode"); } } }
  else if(a === "testneu"){ testThema(true); render(); }
  else if(a === "weiter"){ const z = LS.get(K.zuletzt, null); if(z && THEMA[z.t]){ const l = (typeof alleFragen === "function" ? alleFragen() : FRAGEN).filter(f => f.t === z.t && Array.isArray(f.a) && f.a.length === 4); if(l.length){ startListe(l, THEMA[z.t].name); return; } } aktion("zufall"); }
  else if(a === "fakt"){ const t = el && el.dataset.t; if(t && THEMA[t]){ try{ LIB.thema = t; LIB.buch = (THEMA[t].bereich && THEMA[t].bereich.id) || LIB.buch; }catch(e){} S.libModus = true; document.documentElement.dataset.mode = "lib"; go("libthema"); return; } aktion("zufall"); }
}
function binden(wurzel){ (wurzel || document).querySelectorAll("[data-a]").forEach(b => { if(b.dataset.gebunden) return; b.dataset.gebunden = "1"; b.addEventListener("click", e => { e.stopPropagation(); aktion(b.dataset.a, b); }); }); }
let cdTimer = null;
const vorHome = window.renderHome;
window.renderHome = function(){
  const r = vorHome.apply(this, arguments);
  try{
    const hero = document.querySelector("#app .hero"); if(!hero) return r;
    hero.classList.add("ep"); hero.innerHTML = startseiteHTML(); ["lernleiste","lvKarte"].forEach(id => { const x = document.getElementById(id); if(x) x.remove(); });
    const ber = document.querySelector("#app .bereiche"); const w = wocheHTML();
    if(w){ const tmp = document.createElement("div"); tmp.innerHTML = w; const duell = hero.querySelector(".ep-bereit"); if(duell) duell.before(tmp.firstElementChild); else (ber || hero).insertAdjacentElement("afterend", tmp.firstElementChild); }
    binden(document.getElementById("app")); tachoBinden();
    if(cdTimer) clearInterval(cdTimer);
    cdTimer = setInterval(() => { const el = document.getElementById("epLiveCd"); if(!el || S.screen !== "home"){ clearInterval(cdTimer); cdTimer = null; return; } const nl = liveNaechster(); if(!nl) return; if(liveStatus(nl) === "jetzt"){ render(); return; } el.textContent = dauerText(nl.start - Date.now()); }, 1000);
  }catch(e){ console.warn("startseite.js", e); }
  return r;
};

/* ---------- Gruppenchat (Tagesquiz) ---------- */
function renderChat(){
  const app = document.getElementById("app"); if(!app) return;
  const s = serie(), tq = tagesquiz(), nf = fehlerAnzahl(), n = name(), nl = liveNaechster();
  const av = k => `<span class="c2-av"><img src="${KIDS}${k}" alt=""></span>`;
  const msgs = [
    ["l", `Hoi${n ? " " + h(n) : ""}! 👋 ${s.n ? `<b>${s.n} ${s.n === 1 ? "Tag" : "Tage"} Serie</b>, weiter so!` : "Starte heute deine Serie: 5 Fragen reichen."}`],
    ["r", nl ? `⚡ Live-Quiz um <b>${slotLabel(nl)}</b>: «${h(nl.thema ? nl.thema.name : "Gemischt")}». Bist du dabei?` : `Lust auf einen <b>Teamkampf</b> gegen mich? 😎`],
    ["l", tq ? `Tagesquiz geschafft: <b>${tq.r} von ${tq.n}</b> richtig! 🎉` : `Zuerst das <b>Tagesquiz</b>? 5 neue Fragen warten.`]
  ];
  app.innerHTML = `<div class="ep-chat2">
    <div class="c2-kopf"><button type="button" class="c2-home" data-c="home">← Startseite</button>
      <div class="c2-wer"><span class="c2-avs"><img src="${KIDS}m1.webp" alt=""><img src="${KIDS}j1.webp" alt=""></span><div><b>Lumi und Milo</b><small>Gruppenchat · ${s.n ? s.n + " Tage Serie" : "heute starten"}</small></div></div></div>
    <div class="c2-mitte">
      <div class="c2-box" id="epChatBox">${msgs.map(([w, t]) => `<div class="c2-msg ${w === "r" ? "r" : ""} c2-wart">${av(w === "r" ? "j1.webp" : "m1.webp")}<div class="c2-bl"><span class="c2-tx">${t}</span><span class="c2-tipp">•••</span></div></div>`).join("")}</div>
      <img class="c2-kids" src="${KIDS}duo-jubel.webp" alt="">
    </div>
    <div class="c2-opts">
      <button type="button" class="c2-o c2-haupt" data-c="tq"><span class="c2-ic">📅</span><span><b>${tq ? "Tagesquiz wiederholen" : "Tagesquiz starten"}</b><small>${tq ? `Heute ${tq.r} von ${tq.n} richtig` : "5 neue Fragen, jeden Tag"}</small></span><span class="c2-pf">▶</span></button>
      <button type="button" class="c2-o c2-blau" data-c="duell"><span class="c2-ic">⚔️</span><span><b>Teamkampf</b><small>Duell gegen Freunde</small></span></button>
      <button type="button" class="c2-o c2-rot" data-c="live"><span class="c2-ic">⚡</span><span><b>Live-Quiz</b><small>${nl ? `${slotLabel(nl)} Uhr · ${h(nl.thema ? nl.thema.name : "Gemischt")}` : "alle 4 Stunden"}</small></span></button>
      <button type="button" class="c2-o c2-gruen" data-c="fehler"${nf ? "" : " disabled"}><span class="c2-ic">🎯</span><span><b>Fehler üben</b><small>${nf ? `${nf} Fragen nochmals` : "Alles geübt"}</small></span></button>
      <button type="button" class="c2-o c2-orange" data-c="zufall"><span class="c2-ic">🎲</span><span><b>Überrasch mich</b><small>Zufällige Fragen</small></span></button>
    </div></div>`;
  const reihe = [...app.querySelectorAll(".c2-msg")];
  let i = 0;
  const naechste = () => { if(S.screen !== "chat" || i >= reihe.length) return; const m = reihe[i++]; m.classList.remove("c2-wart"); m.classList.add("c2-tippt");
    setTimeout(() => { m.classList.remove("c2-tippt"); setTimeout(naechste, ruhig() ? 30 : 350); }, ruhig() ? 30 : 600); };
  naechste();
  app.querySelectorAll("[data-c]").forEach(b => b.onclick = () => { const c = b.dataset.c;
    if(c === "tq"){ try{ if(tq){ startListe(window.EP_LERNEN.tagesFragen(), "Tagesquiz (Wiederholung)"); if(S.quiz) S.quiz.list = S.quiz.list.slice(0, 5); } else { startListe(window.EP_LERNEN.tagesFragen(), "Tagesquiz vom " + new Date().toLocaleDateString("de-CH")); if(S.quiz){ S.quiz.tagesquiz = heute(); S.quiz.list = S.quiz.list.slice(0, 5); } } }catch(e){ go("home"); } }
    else if(c === "duell") teamWahl(() => go("duell"), "Teamkampf: Für welches Team spielst du?");
    else if(c === "live") liveOeffnen();
    else if(c === "fehler") aktion("fehler");
    else if(c === "zufall") aktion("zufall");
    else go("home"); });
}


/* ---------- Profil-Code: 8 Ziffern, automatisch pro Profil. Für die spätere Elternansicht. ---------- */
function profilCode(){
  if(!S.profil) return "";
  if(!/^\d{8}$/.test(String(S.profil.code || ""))){
    let c = ""; try{ const a = new Uint32Array(2); crypto.getRandomValues(a); c = String(10000000 + (a[0] % 90000000)); }catch(e){ c = String(10000000 + Math.floor(Math.random() * 90000000)); }
    S.profil = {...S.profil, code:c}; try{ store.set("ep-profil", S.profil); }catch(e){}
  }
  return String(S.profil.code);
}
const vorProfilCode = window.renderProfil;
if(typeof vorProfilCode === "function"){
  window.renderProfil = function(){
    const r = vorProfilCode.apply(this, arguments);
    try{ const app = document.getElementById("app"); if(S.screen === "profil" && app && S.profil && !document.getElementById("epCode")){
      const code = profilCode(), kopf = app.querySelector(".pagehead");
      const d = document.createElement("div"); d.id = "epCode"; d.className = "ep-code";
      d.innerHTML = `<span class="ep-codelbl">🔑 Profil-Code</span><b>${code.slice(0, 4)} ${code.slice(4)}</b><button type="button" class="ep-codekopie">Kopieren</button><small>Mit diesem Code können deine Eltern später deinen Lernfortschritt ansehen.</small>`;
      d.querySelector("button").onclick = async () => { try{ await navigator.clipboard.writeText(code); d.querySelector("button").textContent = "✅ Kopiert"; }catch(e){} };
      (kopf || app).after(d);
      const lz = document.getElementById("lzProfil"); if(lz) lz.remove();
    } }catch(e){ console.warn("startseite.js code", e); }
    return r;
  };
}
window.EP_PROFILCODE = profilCode;

/* ---------- Bildschirme einhängen ---------- */
const vorRender = window.render;
window.render = function(){
  if(S.screen === "chat"){ try{ renderNav(); }catch(e){} try{ liveStop(); }catch(e){} renderChat(); try{ scrollTo({top:0}); }catch(e){} return; }
  if(S.screen === "livequiz"){ try{ renderNav(); }catch(e){} renderLiveQuiz(); return; }
  try{ if(LQ && S.screen !== "livequiz") liveStop(); }catch(e){}
  const r = vorRender.apply(this, arguments);
  try{ document.body.classList.toggle("ep-liegt", S.screen === "profil"); }catch(e){}
  try{ wocheBonus(); }catch(e){ console.warn("startseite.js", e); }
  return r;
};

/* ---------- Qeels: Stories ---------- */
const vorReels = window.oeffneReels;
if(typeof vorReels === "function"){
  window.oeffneReels = function(tab){
    const r = vorReels.apply(this, arguments);
    try{ const o = document.getElementById("reels"); if(!o || o.querySelector(".rstories")) return r;
      const th = LS.get("ep-lernthemen", {}), rnd = zufall("stories-" + heute());
      const alle = themenListe().map(id => THEMA[id]).filter(t => t && t.name);
      const neu = alle.filter(t => !th[t.id]), alt = alle.filter(t => th[t.id] && th[t.id][1] < 10), gesehen = alle.filter(t => th[t.id] && th[t.id][1] >= 10);
      const nimm = (l, n) => { const o = [...l], aus = []; while(o.length && aus.length < n) aus.push(o.splice(Math.floor(rnd() * o.length), 1)[0]); return aus; };
      const liste = [...nimm(neu, 4).map(t => ({t, k:"neu"})), ...nimm(alt, 3).map(t => ({t, k:""})), ...nimm(gesehen, 3).map(t => ({t, k:"gesehen"}))];
      const d = document.createElement("div"); d.className = "rstories"; d.setAttribute("role", "tablist"); d.setAttribute("aria-label", "Themen");
      d.innerHTML = liste.map(({t, k}) => `<button type="button" class="${k === "gesehen" ? "epgesehen" : ""}" data-st="${h(t.id)}" title="${h(t.name)}"><span class="epring ${k === "neu" ? "epneu" : ""}"><b>${typeof themaIcon === "function" ? themaIcon(t) : (t.emo && t.emo.length <= 3 ? h(t.emo) : "📚")}</b></span><span>${h(t.name)}</span></button>`).join("");
      o.appendChild(d);
      d.querySelectorAll("[data-st]").forEach(b => b.onclick = () => { const t = THEMA[b.dataset.st]; if(!t) return;
        const fr = alleFragen().filter(f => f.t === t.id && f.q && Array.isArray(f.a) && f.a.length === 4); for(let i = fr.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [fr[i], fr[j]] = [fr[j], fr[i]]; }
        if(!fr.length) return; RL.suche = {term:t.name, fragen:fr.slice(0, 300).map(f => ({typ:"q", f})), artikel:[], n:0};
        try{ rlSucheChip(); }catch(e){} rlTab("suche"); d.querySelectorAll("button").forEach(x => x.setAttribute("aria-selected", x === b)); });
    }catch(e){ console.warn("startseite.js", e); }
    return r;
  };
}

window.EP_START = { wocheVorschau, wochenPlan, WOCHE_TEST_XP, erwachsen, erwachsenSetzen, heldSlides, team, teamWahl, liveSlots, liveStatus, liveNaechster, liveFragen, woche, LIVE, TEAMS, aktion, serie, tagesquiz, fehlerAnzahl, level, abzeichenZahl, fakt, dauerText, slotLabel, K };
})();
