/* easyplay: gemeinsame Rangliste, Fragen vorschlagen und anonyme Antwortstatistik auf dem eigenen Server.
   Läuft nur, wenn die Seite mit dem eigenen Server verbunden ist (AUTH.modus "supabase", siehe authInit in index.html).
   - Rangliste: holt rangliste() vom Server (S.spieler, S.rang = true) und schreibt das eigene öffentliche Profil ins Konto.
   - Vorschläge: Fenster «Frage vorschlagen» (Profil am Computer und in der App), speichert über frage_vorschlagen().
   - Antworten: zählt bei Training und Test je Frage-Nummer richtig/falsch, ohne Person (antworten_zaehlen()).
   Datenbank: supabase/spiel.sql. */
(function(){
"use strict";
if(typeof S === "undefined" || typeof window.render !== "function") return;
const CFG = window.EP_CONFIG || {};
const URL_ = String(CFG.supabaseUrl || "").replace(/\/$/, ""), KEY = CFG.supabaseKey || "easyplay";
if(!URL_) return;
const LS = { get(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } }, set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} } };
const h = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const aktiv = () => { try{ return AUTH && AUTH.modus === "supabase"; }catch(e){ return false; } };
const konto = () => { try{ return AUTH && AUTH.user; }catch(e){ return null; } };
async function token(){ try{ const r = await AUTH.sb.auth.getSession(); return r && r.data && r.data.session ? r.data.session.access_token : ""; }catch(e){ return ""; } }
async function rpc(name, args, mitKonto, keepalive){
  const t = mitKonto ? await token() : "";
  const r = await fetch(URL_ + "/rest/v1/rpc/" + name, { method:"POST", keepalive: !!keepalive, cache:"no-store",
    headers:{ apikey:KEY, "Content-Type":"application/json", ...(t ? {Authorization:"Bearer " + t} : {}) }, body: JSON.stringify(args || {}) });
  const txt = await r.text(); let j = null; try{ j = txt ? JSON.parse(txt) : null; }catch(e){}
  if(!r.ok) throw new Error((j && j.message) || ("Server " + r.status));
  return j;
}

/* ================= Rangliste ================= */
const RG = { zeit:0, laeuft:null };
const RANG_SCREENS = ["home", "board", "profil", "spieler", "hardcoreinfo", "hardcore", "hcboard", "done"];
function eigenesProfil(){ try{ return S.profil && konto() ? spielerSauber(konto().id, oeffentlichesProfil(S.profil)) : null; }catch(e){ return null; } }
function einsetzen(liste){
  const ich = eigenesProfil();
  let l = (liste || []).map(x => { try{ return spielerSauber(x.id, x); }catch(e){ return null; } }).filter(p => p && p.name);
  if(ich){ const alt = l.find(p => p.id === ich.id); l = l.filter(p => p.id !== ich.id); if(!(alt && alt._aus)) l.push({...ich, name: (alt && alt.name) || ich.name}); }
  S.spieler = l; S.rang = true; S.uid = konto() ? konto().id : (S.online ? S.uid : null);
}
function ranglisteLaden(zwingend){
  if(!aktiv() || S.online) return Promise.resolve();
  if(RG.laeuft) return RG.laeuft;
  if(!zwingend && Date.now() - RG.zeit < 60000){ einsetzen(RG.roh); return Promise.resolve(); }
  RG.laeuft = rpc("rangliste", {}).then(l => {
    RG.roh = Array.isArray(l) ? l : []; RG.zeit = Date.now(); einsetzen(RG.roh);
    if(RANG_SCREENS.includes(S.screen)) window.render();
  }).catch(() => {}).finally(() => { RG.laeuft = null; });
  return RG.laeuft;
}

/* Eigenes Profil in das Konto schreiben (nur wenn sich etwas geändert hat, höchstens alle 15 s) */
const SYNC = { sig:"", t:0, timer:null };
function profilSchreiben(){
  if(!aktiv() || !konto() || !S.profil || S.online) return;
  let o; try{ o = oeffentlichesProfil(S.profil); }catch(e){ return; }
  const daten = { best:o.best || {}, tests:o.tests || 0, saison:o.saison || {}, hc:o.hc || null, avatar:o.avatar, stufe:o.stufe, kanton:o.kanton, deko:o.deko || null, zahlen:o.zahlen || {} };
  const sig = JSON.stringify(daten); if(sig === SYNC.sig) return;
  const warten = 15000 - (Date.now() - SYNC.t);
  if(warten > 0){ clearTimeout(SYNC.timer); SYNC.timer = setTimeout(profilSchreiben, warten + 50); return; }
  SYNC.t = Date.now();
  AUTH.sb.auth.updateUser({ data: daten }).then(r => { if(!r || !r.error){ SYNC.sig = sig; RG.zeit = 0; } }).catch(() => {});
}
/* Punkte von der Verwaltung gelöscht (unechte Punkte): lokalen Stand einmal ebenfalls leeren */
function punkteGeloeschtPruefen(){
  const u = konto(); if(!u || !S.profil) return;
  const z = u.app_metadata && u.app_metadata.punkte_geloescht; if(!z) return;
  const schl = "ep-punkte-geloescht-" + u.id; if(LS.get(schl, "") === z) return;
  LS.set(schl, z);
  S.profil = { ...S.profil, best:{}, saison:{}, tests:0, hc:null };
  try{ store.set("ep-profil", S.profil); }catch(e){}
}

/* ================= Antworten zählen ================= */
const AW = { liste:[], timer:null };
function antwortenSenden(keepalive){
  clearTimeout(AW.timer); AW.timer = null;
  if(!AW.liste.length) return;
  const teil = AW.liste.splice(0, 50);
  rpc("antworten_zaehlen", { p_liste: teil }, false, keepalive).catch(() => {});
  if(AW.liste.length) antwortenSenden(keepalive);
}
if(typeof window.answer === "function"){
  const altAnswer = window.answer;
  window.answer = function(i){
    let Q = null, f = null, vorher = null;
    try{ Q = S.quiz; f = Q && Q.list ? Q.list[Q.i] : null; vorher = Q ? Q.picked : null; }catch(e){}
    const r = altAnswer.apply(this, arguments);
    try{
      if(aktiv() && Q && !Q.custom && vorher == null && Q.picked != null && f && +f.nr > 0 && f.opts && f.opts[i]){
        AW.liste.push([+f.nr, f.opts[i].ok ? 1 : 0]);
        if(AW.liste.length >= 25) antwortenSenden(); else if(!AW.timer) AW.timer = setTimeout(antwortenSenden, 60000);
      }
    }catch(e){}
    return r;
  };
}
addEventListener("pagehide", () => antwortenSenden(true));
document.addEventListener("visibilitychange", () => { if(document.visibilityState === "hidden") antwortenSenden(true); });

/* ================= Frage vorschlagen ================= */
function themenFuerVorschlag(){
  const raus = [];
  try{ BEREICHE.forEach(b => b.themen.forEach(t => { if(t.menu){ (t.kids || []).forEach(k => { if(THEMA[k]) raus.push({id:k, name:THEMA[k].name, b:b.name}); }); } else raus.push({id:t.id, name:t.name, b:b.name}); })); }catch(e){}
  try{ (typeof GESCH_EPOCHEN !== "undefined" ? GESCH_EPOCHEN : []).forEach(t => raus.push({id:t.id, name:t.name, b:"Geschichte"})); }catch(e){}
  const ges = new Set(); return raus.filter(t => t.id !== "bilder" && !ges.has(t.id) && ges.add(t.id));
}
const FEHLER = { anmelden:"Bitte zuerst anmelden.", gesperrt:"Dein Konto ist gesperrt.", thema:"Bitte ein Thema wählen.", stufe:"Bitte eine Stufe wählen.",
  frage:"Die Frage braucht 10 bis 300 Zeichen.", erklaerung:"Die Erklärung ist zu lang (höchstens 600 Zeichen).", antworten:"Bitte vier verschiedene Antworten eingeben.",
  kontakt:"Bitte keine Links, Mailadressen, Telefonnummern oder Namen von Apps.", viele:"Heute hast du schon 10 Fragen vorgeschlagen. Morgen wieder!" };
async function vorschlagFenster(){
  document.querySelectorAll(".ep-modal").forEach(e => e.remove());
  const el = document.createElement("div"); el.className = "ep-modal ep-vorschlag"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", "Frage vorschlagen");
  const zu = () => el.remove();
  if(!konto()){
    el.innerHTML = `<div class="ep-box"><h2>💡 Frage vorschlagen</h2><p class="ep-mut">Melde dich an, dann kannst du eigene Fragen vorschlagen. Wir prüfen jede Frage, bevor sie ins Spiel kommt.</p><button type="button" class="ep-btn" data-anmelden>Anmelden</button><button type="button" class="ep-zu" aria-label="Schliessen">✕</button></div>`;
    document.body.appendChild(el); el.querySelector(".ep-zu").onclick = zu; el.onclick = e => { if(e.target === el) zu(); };
    el.querySelector("[data-anmelden]").onclick = () => { zu(); try{ go("login"); }catch(e){} }; return;
  }
  const themen = themenFuerVorschlag(), gruppen = [...new Set(themen.map(t => t.b))];
  el.innerHTML = `<div class="ep-box" style="max-width:560px;text-align:left"><h2>💡 Frage vorschlagen</h2>
    <p class="ep-mut">Weisst du etwas Spannendes? Schreib eine Frage mit einer richtigen und drei falschen Antworten. Wir prüfen sie und nehmen die besten ins Spiel auf.</p>
    <form class="epv-form">
      <label>Thema<select name="thema" required><option value="">Bitte wählen</option>${gruppen.map(g => `<optgroup label="${h(g)}">${themen.filter(t => t.b === g).map(t => `<option value="${h(t.id)}">${h(t.name)}</option>`).join("")}</optgroup>`).join("")}</select></label>
      <label>Wie schwierig?<select name="stufe"><option value="1">leicht</option><option value="2" selected>mittel</option><option value="3">schwer</option></select></label>
      <label>Deine Frage<textarea name="frage" rows="2" maxlength="300" required placeholder="Zum Beispiel: Wie heisst der höchste Berg der Schweiz?"></textarea></label>
      <label>✅ Richtige Antwort<input name="a0" maxlength="120" required></label>
      <label>❌ Falsche Antwort<input name="a1" maxlength="120" required></label>
      <label>❌ Falsche Antwort<input name="a2" maxlength="120" required></label>
      <label>❌ Falsche Antwort<input name="a3" maxlength="120" required></label>
      <label>Erklärung (freiwillig)<textarea name="erkl" rows="2" maxlength="600" placeholder="Warum ist die Antwort richtig?"></textarea></label>
      <p class="epv-fehler" role="alert"></p>
      <div class="epv-knoepfe"><button type="button" class="ep-btn epv-meine">Meine Vorschläge</button><button type="submit" class="ep-btn">Vorschlagen</button></div>
    </form><div class="epv-liste"></div><button type="button" class="ep-zu" aria-label="Schliessen">✕</button></div>`;
  document.body.appendChild(el);
  const st = document.getElementById("epv-stil") || document.head.appendChild(Object.assign(document.createElement("style"), {id:"epv-stil",
    textContent:`.ep-vorschlag .ep-box{max-height:calc(100vh - 32px);overflow:auto}.epv-form{display:grid;gap:10px;margin-top:10px}.epv-form label{display:grid;gap:4px;font-weight:700;font-size:14px}
      .epv-form input,.epv-form select,.epv-form textarea{font:inherit;font-weight:400;padding:10px 12px;border-radius:12px;border:1.5px solid rgba(120,100,200,.35);background:rgba(255,255,255,.92);color:#1d1b2e;width:100%;box-sizing:border-box}
      .epv-fehler{color:#c4123e;font-weight:700;margin:0;min-height:1em}.epv-knoepfe{display:flex;gap:8px;justify-content:space-between;flex-wrap:wrap}.epv-liste{margin-top:12px;font-size:14px}
      .epv-liste li{margin:6px 0}.epv-st{font-size:12px;font-weight:800;padding:2px 8px;border-radius:999px;margin-left:6px}.epv-st.neu{background:#fff1c2;color:#7a5200}.epv-st.ok{background:#d6f5e3;color:#0f6b3a}.epv-st.abgelehnt{background:#fde0e6;color:#9b1236}`}));
  void st;
  el.querySelector(".ep-zu").onclick = zu; el.onclick = e => { if(e.target === el) zu(); };
  const f = el.querySelector("form"), fe = el.querySelector(".epv-fehler");
  f.onsubmit = async e => {
    e.preventDefault(); fe.textContent = "";
    const d = new FormData(f), sauber = s => String(s || "").replace(/ß/g, "ss").replace(/\s*[–—]\s*/g, ", ").trim();
    const b = f.querySelector('[type="submit"]'); b.disabled = true;
    try{
      const r = await rpc("frage_vorschlagen", { p_thema:d.get("thema"), p_stufe:+d.get("stufe"), p_frage:sauber(d.get("frage")), p_antworten:[0, 1, 2, 3].map(i => sauber(d.get("a" + i))), p_erklaerung:sauber(d.get("erkl")) }, true);
      if(r && r.ok){ f.reset(); f.querySelector('[name="stufe"]').value = "2"; fe.style.color = "#0f6b3a"; fe.textContent = "🎉 Danke! Deine Frage wird geprüft."; setTimeout(() => { fe.style.color = ""; }, 4000); }
      else fe.textContent = FEHLER[r && r.fehler] || "Das hat nicht geklappt. Versuch es nochmals.";
    }catch(err){ fe.textContent = "Das hat nicht geklappt. Versuch es später nochmals."; }
    finally{ b.disabled = false; }
  };
  el.querySelector(".epv-meine").onclick = async () => {
    const box = el.querySelector(".epv-liste"); box.textContent = "Lädt …";
    try{ const l = await rpc("meine_vorschlaege", {}, true) || [];
      box.innerHTML = l.length ? `<b>Deine Vorschläge</b><ul>${l.map(v => `<li>${h(v.frage)} <span class="epv-st ${h(v.status)}">${({neu:"wird geprüft", ok:"im Spiel", abgelehnt:"nicht übernommen"})[v.status] || h(v.status)}</span></li>`).join("")}</ul>` : "Du hast noch keine Fragen vorgeschlagen.";
    }catch(err){ box.textContent = "Konnte nicht geladen werden."; }
  };
}
window.EP_VORSCHLAG = { oeffnen: vorschlagFenster };

/* Knopf im Profil: am Computer als Karte, in der App als Zeile in der Liste */
function knoepfeEinbauen(){
  if(!aktiv()) return;
  const liste = document.querySelector(".ap-profil .ap-liste");
  if(liste && !liste.querySelector("[data-vorschlag]")){
    const b = document.createElement("button"); b.type = "button"; b.dataset.vorschlag = "1";
    b.innerHTML = `<span style="font-size:19px;width:20px;text-align:center" aria-hidden="true">💡</span><span>Frage vorschlagen</span><span aria-hidden="true" style="margin-left:auto;opacity:.6">›</span>`;
    b.onclick = vorschlagFenster;
    const ziel = liste.querySelector('a[href="impressum.html"]'); liste.insertBefore(b, ziel || null);
  }
  if(S.screen === "profil" && !document.querySelector("#app .ap-profil") && !document.querySelector("#app [data-vorschlag]")){
    const app = document.getElementById("app"); if(!app) return;
    const k = document.createElement("div"); k.className = "statcard"; k.style.marginTop = "22px"; k.dataset.vorschlag = "1";
    k.innerHTML = `<h2>💡 Frage vorschlagen</h2><p class="help" style="margin-top:0">Weisst du etwas Spannendes? Schlag eine eigene Frage vor. Wir prüfen sie und nehmen die besten ins Spiel auf.</p><button type="button" class="big gold">Frage vorschlagen</button>`;
    k.querySelector("button").onclick = vorschlagFenster;
    app.appendChild(k);
  }
}

/* ================= Einhängen ================= */
const altRender = window.render;
window.render = function(){
  if(aktiv() && !S.online){
    if(konto()) punkteGeloeschtPruefen();
    if(RANG_SCREENS.includes(S.screen)){ if(RG.roh) einsetzen(RG.roh); ranglisteLaden(false); }
    profilSchreiben();
  }
  const r = altRender.apply(this, arguments);
  try{ knoepfeEinbauen(); }catch(e){}
  return r;
};
/* Nach der Anmeldung (authInit ist asynchron) einmal laden */
let versuche = 0;
const warte = setInterval(() => {
  versuche++;
  try{ if(AUTH.bereit){ clearInterval(warte); if(aktiv()){ ranglisteLaden(true); if(konto()) punkteGeloeschtPruefen(); } } }catch(e){}
  if(versuche > 60) clearInterval(warte);
}, 500);
})();
