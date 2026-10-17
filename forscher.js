/* easyplay Welt «Forscher-Aufträge» (x-forscher)
   Kleine Missionen für draussen und zu Hause: ohne Fotos, ohne Uploads, ohne Standort.
   Daten: welten/forscher/auftraege.json (Aufträge mit Schritten, Sicherheits-Hinweisen, Wissensfragen, Beobachtungs-Formular).
   Ablauf: Auftrag öffnen → Schritte abhaken → «Erledigt!» → Beobachtungen → Fragen → Forscher-Abzeichen.
   Alles bleibt lokal im Browser (localStorage, Schlüssel ep-x-forscher-…).
   API: window.EP_FORSCHER = { stand(), heute(), oeffne(id), liste(), laden() } */
(function(){
"use strict";
if(!window.EP_EXTRAS) return;
const X = window.EP_EXTRAS, A = X.api, h = A.h;

/* ---------- Speicher ---------- */
const K = {
  erledigt: "ep-x-forscher-erledigt",   // { id: {n, d, erst} }
  tagebuch: "ep-x-forscher-tagebuch",   // [ {k, id, d, t, emo, kat, f:[[label, wert]], w, wf, n, r} ] neueste zuerst
  abz:      "ep-x-forscher-abzeichen",  // { kat: 0..3 }
  heute:    "ep-x-forscher-heute",      // {d, id} Auftrag des Tages (bleibt den ganzen Tag gleich)
  gesehen:  "ep-x-forscher-gesehen",    // "YYYY-MM-DD" Seite heute schon angeschaut
  laufend:  "ep-x-forscher-laufend",    // { id: [true,false,...] } abgehakte Schritte
  kat:      "ep-x-forscher-kat"         // zuletzt gewählte Kategorie
};
const MAX_TB = 150, MAX_NOTIZ = 200;
const erledigt = () => A.LS.get(K.erledigt, {}) || {};
const tagebuch = () => { const t = A.LS.get(K.tagebuch, []); return Array.isArray(t) ? t : []; };

/* ---------- Datum (window.__epDatum zum Testen, wie im Rest der Seite) ---------- */
function jetzt(){ let d = new Date(); try{ if(window.__epDatum) d = new Date(window.__epDatum); }catch(e){} return d; }
const heuteISO = () => A.heute(jetzt());
const monat = () => jetzt().getMonth() + 1;
const MOL = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const datumText = iso => { const p = String(iso || "").split("-"); return p.length === 3 ? `${+p[2]}. ${MOL[+p[1] - 1]} ${p[0]}` : ""; };

/* ---------- Kategorien und Abzeichen ---------- */
const KATS = [
  {id:"natur",      name:"Natur",          emo:"🌿", farbe:"linear-gradient(135deg,#1B6E36,#3E9E45)"},
  {id:"jahreszeit", name:"Jahreszeiten",   emo:"🍂", farbe:"linear-gradient(135deg,#B04A12,#E0861F)"},
  {id:"zuhause",    name:"Zuhause",        emo:"🏠", farbe:"linear-gradient(135deg,#4F32B8,#8552E0)"},
  {id:"ort",        name:"Stadt und Dorf", emo:"🏘️", farbe:"linear-gradient(135deg,#12569F,#2A80CF)"},
  {id:"sinne",      name:"Sinne",          emo:"👂", farbe:"linear-gradient(135deg,#A01F6E,#D6478F)"},
  {id:"wetter",     name:"Wetter",         emo:"⛅", farbe:"linear-gradient(135deg,#0A6878,#1497AB)"}
];
const KAT = Object.fromEntries(KATS.map(k => [k.id, k]));
const STUFEN = [
  {n:3,  name:"Bronze", emo:"🥉", xp:10},
  {n:6,  name:"Silber", emo:"🥈", xp:15},
  {n:10, name:"Gold",   emo:"🥇", xp:25}
];
const XP_AUFTRAG = 10, XP_FRAGE = 2;

/* ---------- Daten laden ---------- */
let DATEN = null, LADEN = null;
function laden(){
  if(DATEN) return Promise.resolve(DATEN);
  if(!LADEN) LADEN = fetch("welten/forscher/auftraege.json", {cache:"no-cache"})
    .then(r => r.ok ? r.json() : null)
    .then(j => {
      const l = (j && Array.isArray(j.auftraege) ? j.auftraege : []).filter(a => a && a.id && KAT[a.kat] && Array.isArray(a.schritte) && a.schritte.length);
      if(!l.length) throw new Error("leer");
      l.forEach(a => { a.fragen = (a.fragen || []).filter(q => q && q.q && Array.isArray(q.a) && q.a.length === 4); });
      DATEN = l; return l;
    })
    .catch(e => { LADEN = null; throw e; });
  return LADEN;
}
const auftrag = id => (DATEN || []).find(a => a.id === id) || null;
const passtJetzt = a => !a.monate || !a.monate.length || a.monate.indexOf(monat()) >= 0;
const anzahlKat = kat => { const e = erledigt(); return (DATEN || []).filter(a => a.kat === kat && e[a.id]).length; };
const stufeKat = n => STUFEN.reduce((s, x, i) => n >= x.n ? i + 1 : s, 0);
function monateText(a){
  const set = new Set(a.monate || []);
  if(!set.size || set.size === 12) return "ganzes Jahr";
  // Anfang eines Bereichs: Monat drin, Vormonat nicht (auch über den Jahreswechsel)
  const teile = [];
  for(let x = 1; x <= 12; x++){
    if(!set.has(x) || set.has(x === 1 ? 12 : x - 1)) continue;
    let y = x; while(set.has((y % 12) + 1)) y = (y % 12) + 1;
    teile.push(x === y ? MOL[x - 1] : `${MOL[x - 1]} bis ${MOL[y - 1]}`);
  }
  return teile.join(", ");
}

/* ---------- Auftrag des Tages (passt zum Monat, bleibt den ganzen Tag gleich) ---------- */
function hash(s){ let x = 2166136261; for(let i = 0; i < s.length; i++){ x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; }
function tagesAuftrag(){
  if(!DATEN) return null;
  const tag = heuteISO(), gem = A.LS.get(K.heute, null);
  if(gem && gem.d === tag && auftrag(gem.id)) return auftrag(gem.id);
  const e = erledigt();
  let pool = DATEN.filter(a => passtJetzt(a) && !e[a.id]);
  if(!pool.length) pool = DATEN.filter(passtJetzt);
  if(!pool.length) pool = DATEN.slice();
  // Bevorzugt Aufträge, die nur in bestimmten Monaten gehen (Jahreszeiten-Aufträge doppelt):
  // so passt der Auftrag des Tages zur Jahreszeit
  const saison = pool.filter(a => a.monate && a.monate.length && a.monate.length < 12);
  const gew = saison.length >= 3 ? saison.concat(saison.filter(a => a.kat === "jahreszeit")) : pool;
  const t = gew[hash("forscher-" + tag) % gew.length];
  A.LS.set(K.heute, {d:tag, id:t.id, titel:t.titel, emo:t.emo, kurz:t.kurz});  // Kopie für die Karussell-Folie (schon bevor die Daten geladen sind)
  return t;
}

/* ---------- Zustand der Seite ---------- */
let BOX = null;
let ansicht = "start";               // start | auftrag | abzeichen | tagebuch
let wahlKat = A.LS.get(K.kat, "") || "";
let lauf = null;                     // {id, phase:"schritte"|"form"|"fragen"|"fertig", haken, werte, wahl, notiz, qi, richtig, antwort, ordnung, ergebnis}
let tbLoeschen = null;               // k des Eintrags, der auf Bestätigung wartet ("*" = alle)

function zeichne(fokus){
  if(!BOX || !BOX.isConnected) return;
  let html;
  if(!DATEN) html = `<p class="x-leer">Die Aufträge werden geladen …</p>`;
  else if(ansicht === "auftrag" && lauf && auftrag(lauf.id)) html = auftragHTML();
  else { if(ansicht === "auftrag") ansicht = "start"; html = kopfHTML() + tabsHTML() + (ansicht === "abzeichen" ? abzeichenHTML() : ansicht === "tagebuch" ? tagebuchHTML() : startHTML()); }
  BOX.innerHTML = html;
  binden();
  if(fokus){
    const z = BOX.querySelector(fokus);
    if(z){ try{ z.focus({preventScroll:true}); }catch(e){} }
    try{ window.scrollTo(0, 0); }catch(e){}
  }
}

/* ---------- Kopf und Tabs ---------- */
function kopfHTML(){
  return `<div class="x-kopf xfo-kopf"><span class="x-kopf-emo" aria-hidden="true">🔎</span><div><h1>Forscher-Aufträge</h1><p>Kleine Missionen für draussen und zu Hause</p></div><img src="img/kids/duo-bereit.webp" alt=""></div>`;
}
function tabsHTML(){
  const e = erledigt(), n = DATEN.filter(a => e[a.id]).length;
  const abz = KATS.reduce((s, k) => s + stufeKat(anzahlKat(k.id)), 0);
  const t = tagebuch().length;
  const tab = (id, ic, txt, zahl) => `<button type="button" role="tab" class="xfo-tab${ansicht === id ? " an" : ""}" data-tab="${id}" aria-selected="${ansicht === id}" tabindex="${ansicht === id ? 0 : -1}"><span aria-hidden="true">${ic}</span> ${txt}<i>${zahl}</i></button>`;
  return `<div class="xfo-tabs" role="tablist" aria-label="Bereiche">${tab("start", "🧭", "Aufträge", `${n}/${DATEN.length}`)}${tab("abzeichen", "🏅", "Abzeichen", abz)}${tab("tagebuch", "📓", "Tagebuch", t)}</div>`;
}

/* ---------- Übersicht ---------- */
function metaHTML(a){
  return `<span class="xfo-pille">⏱️ ${h(a.dauer)}</span><span class="xfo-pille" role="img" aria-label="Stufe ${a.stufe || 1}">${"⭐".repeat(a.stufe || 1)}</span><span class="xfo-pille">${a.ort === "zuhause" ? "🏠 zu Hause" : "🌳 draussen"}</span>`;
}
function startHTML(){
  const t = tagesAuftrag(), e = erledigt(), k = KAT[t.kat];
  if(!wahlKat || !KAT[wahlKat]) wahlKat = t.kat;
  const liste = DATEN.filter(a => a.kat === wahlKat).sort((a, b) => (passtJetzt(b) - passtJetzt(a)) || (!!e[a.id] - !!e[b.id]));
  const kk = KAT[wahlKat], nk = anzahlKat(wahlKat), sk = stufeKat(nk), naechste = STUFEN[sk];
  return `<section class="xfo-held" style="background:${k.farbe}" aria-labelledby="xfoHeldT">
      <div class="xfo-held-tx">
        <span class="xfo-pille hell">✨ Auftrag des Tages · ${h(MOL[monat() - 1])}</span>
        <h2 id="xfoHeldT"><span aria-hidden="true">${t.emo}</span> ${h(t.titel)}</h2>
        <p>${h(t.kurz)}</p>
        <div class="xfo-meta">${metaHTML(t)}${e[t.id] ? `<span class="xfo-pille">✅ schon erforscht</span>` : ""}</div>
      </div>
      <img class="xfo-held-bild" src="img/kids/duo-winken.webp" alt="">
      <button type="button" class="xfo-btn" data-auf="${h(t.id)}">🔎 Los geht's</button>
    </section>
    <div class="xfo-kats" role="radiogroup" aria-label="Kategorie wählen">${KATS.map(c => { const s = stufeKat(anzahlKat(c.id));
      return `<button type="button" role="radio" class="xfo-kat${c.id === wahlKat ? " an" : ""}" data-kat="${c.id}" aria-checked="${c.id === wahlKat}" tabindex="${c.id === wahlKat ? 0 : -1}" style="background:${c.farbe}"><span aria-hidden="true">${c.emo}</span><b>${h(c.name)}</b>${s ? `<i role="img" aria-label="Abzeichen ${STUFEN[s - 1].name}">${STUFEN[s - 1].emo}</i>` : ""}</button>`; }).join("")}</div>
    <div class="xfo-liste-kopf"><h2 class="xfo-titel">${kk.emo} ${h(kk.name)}</h2><span class="xfo-pille dunkel">${nk} von ${DATEN.filter(a => a.kat === wahlKat).length} erforscht${naechste ? ` · ${naechste.emo} ab ${naechste.n}` : " · 🥇 Gold!"}</span></div>
    <div class="xfo-liste">${liste.map(a => { const fertig = !!e[a.id], jetzt = passtJetzt(a);
      return `<button type="button" class="xfo-karte${jetzt ? "" : " spaeter"}${fertig ? " fertig" : ""}" data-auf="${h(a.id)}" style="background:${kk.farbe}" aria-label="${h(a.titel)}${fertig ? ", erledigt" : ""}${jetzt ? "" : ", am besten " + h(monateText(a))}">
        <span class="xfo-k-emo" aria-hidden="true">${a.emo}</span>
        <span class="xfo-k-tx"><b>${h(a.titel)}</b><small>${jetzt ? `⏱️ ${h(a.dauer)} · ${"⭐".repeat(a.stufe || 1)}` : `🗓️ ${h(monateText(a))}`}</small></span>
        ${fertig ? `<span class="xfo-k-ok" aria-hidden="true">✅</span>` : ""}</button>`; }).join("")}</div>`;
}

/* ---------- Abzeichen ---------- */
function fortschritt(n){
  const s = stufeKat(n), nx = STUFEN[s], vorher = s ? STUFEN[s - 1].n : 0;
  return {s, nx, proz:nx ? Math.round((n - vorher) / (nx.n - vorher) * 100) : 100};
}
function abzeichenHTML(){
  return `<div class="xfo-abz">${KATS.map(k => { const n = anzahlKat(k.id), alle = DATEN.filter(a => a.kat === k.id).length, {s, nx, proz} = fortschritt(n);
    return `<section class="xfo-abz-k" style="background:${k.farbe}" aria-label="${h(k.name)}: ${n} von ${alle} Aufträgen erforscht">
      <div class="xfo-abz-top"><span class="xfo-abz-emo" aria-hidden="true">${k.emo}</span><b>${h(k.name)}</b><small>${n}/${alle}</small></div>
      <div class="xfo-medaillen">${STUFEN.map((x, i) => `<span class="xfo-med${s > i ? " hat" : ""}"><span aria-hidden="true">${x.emo}</span><small>${x.name}</small><span class="xfo-sr">${s > i ? "gesammelt" : `ab ${x.n} Aufträgen`}</span></span>`).join("")}</div>
      <div class="xfo-balken" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${proz}" aria-label="Fortschritt bis ${nx ? nx.name : "Gold"}"><i style="width:${proz}%"></i></div>
      <small class="xfo-abz-tx">${nx ? `Noch ${nx.n - n} bis ${nx.name}` : "Alle Abzeichen!"}</small>
    </section>`; }).join("")}</div>
    <p class="xfo-tipp">🥉 Bronze ab 3, 🥈 Silber ab 6 und 🥇 Gold ab 10 erforschten Aufträgen pro Kategorie.</p>`;
}

/* ---------- Tagebuch ---------- */
function tagebuchHTML(){
  const t = tagebuch();
  if(!t.length) return `<div class="xfo-leer"><span aria-hidden="true">📓</span><b>Dein Forscher-Tagebuch ist noch leer.</b><span>Wenn du einen Auftrag erledigst, landen deine Zählungen und Notizen hier. Alles bleibt nur auf diesem Gerät.</span><button type="button" class="xfo-btn" data-tab="start">🧭 Zu den Aufträgen</button></div>`;
  return `<p class="xfo-tipp">🔒 Dein Tagebuch bleibt nur auf diesem Gerät. Du kannst Einträge jederzeit löschen.</p>
    <div class="xfo-tb">${t.map(x => { const k = KAT[x.kat] || KATS[0], best = tbLoeschen === x.k;
      return `<article class="xfo-eintrag" style="background:${k.farbe}">
        <div class="xfo-e-kopf"><span class="xfo-e-emo" aria-hidden="true">${h(x.emo || "🔎")}</span><div><b>${h(x.t || "")}</b><small>${h(datumText(x.d))}${x.r ? ` · ${h(x.r)} Fragen richtig` : ""}</small></div>
          <button type="button" class="xfo-mini${best ? " warn" : ""}" data-tbdel="${h(x.k)}" aria-label="${best ? "Wirklich löschen?" : "Eintrag löschen"}">${best ? "Wirklich löschen?" : "🗑️"}</button></div>
        ${(x.f && x.f.length) || x.w ? `<ul class="xfo-e-werte">${(x.f || []).map(f => `<li>${h(f[0])}: <b>${h(f[1])}</b></li>`).join("")}${x.w ? `<li>${h(x.wf || "Auswahl")} <b>${h(x.w)}</b></li>` : ""}</ul>` : ""}
        ${x.n ? `<p class="xfo-e-notiz">«${h(x.n)}»</p>` : ""}
      </article>`; }).join("")}</div>
    <div class="xfo-tb-fuss"><button type="button" class="xfo-mini dunkel${tbLoeschen === "*" ? " warn" : ""}" data-tbdel="*">${tbLoeschen === "*" ? "Ja, alle Einträge löschen" : "🗑️ Ganzes Tagebuch löschen"}</button></div>`;
}
function tbLoeschenKlick(k){
  if(tbLoeschen !== k){
    tbLoeschen = k; A.ton("klick"); zeichne();
    const b = [...BOX.querySelectorAll("[data-tbdel]")].find(x => x.dataset.tbdel === k); if(b) b.focus({preventScroll:true});
    return;
  }
  tbLoeschen = null;
  A.LS.set(K.tagebuch, k === "*" ? [] : tagebuch().filter(x => x.k !== k));
  A.ton("wisch"); A.toast(k === "*" ? "Tagebuch gelöscht." : "Eintrag gelöscht.");
  zeichne(".xfo-tab.an");
}

/* ---------- Auftrag ---------- */
function oeffneAuftrag(id){
  const a = auftrag(id); if(!a) return;
  const gespeichert = (A.LS.get(K.laufend, {}) || {})[id];
  lauf = {id, phase:"schritte", haken:a.schritte.map((_, i) => !!(gespeichert && gespeichert[i])), werte:{}, wahl:"", notiz:"", qi:0, richtig:0, antwort:null, ordnung:null, ergebnis:null};
  ansicht = "auftrag"; tbLoeschen = null;
  A.ton("klick");
  zeichne("#xfoAufT");
}
function hakenSpeichern(){
  const l = A.LS.get(K.laufend, {}) || {};
  if(lauf.haken.some(Boolean)) l[lauf.id] = lauf.haken; else delete l[lauf.id];
  A.LS.set(K.laufend, l);
}
function auftragHTML(){
  const a = auftrag(lauf.id), k = KAT[a.kat];
  const kopf = `<section class="xfo-auf-kopf" style="background:${k.farbe}">
      <button type="button" class="xfo-zurueck" data-tab="start">← Alle Aufträge</button>
      <div class="xfo-auf-t"><span class="xfo-auf-emo" aria-hidden="true">${a.emo}</span><div><small>${k.emo} ${h(k.name)}</small><h2 id="xfoAufT" tabindex="-1">${h(a.titel)}</h2></div></div>
      <p>${h(a.kurz)}</p>
      <div class="xfo-meta">${metaHTML(a)}<span class="xfo-pille">${passtJetzt(a) ? "✅ passt jetzt" : "🗓️ am besten " + h(monateText(a))}</span></div>
    </section>`;
  const sicher = a.sicher ? `<div class="xfo-sicher" role="note"><span aria-hidden="true">🛡️</span><div><b>Sicherheit zuerst</b><span>${h(a.sicher)}</span></div></div>` : "";
  const inhalt = lauf.phase === "schritte" ? schritteHTML(a) : lauf.phase === "form" ? formHTML(a) : lauf.phase === "fragen" ? frageHTML(a) : fertigHTML(a);
  return `<div class="xfo-auf">${kopf}<div class="xfo-auf-rechts">${lauf.phase === "schritte" ? sicher : ""}${inhalt}</div></div>`;
}
function schritteHTML(a){
  const n = lauf.haken.filter(Boolean).length, alle = n === a.schritte.length;
  return `<section class="xfo-panel" aria-labelledby="xfoSchrT">
    <div class="xfo-panel-kopf"><h3 id="xfoSchrT">🧭 So geht's</h3><span class="xfo-pille dunkel" aria-live="polite">${n} von ${a.schritte.length}</span></div>
    <ol class="xfo-schritte">${a.schritte.map((s, i) => `<li><button type="button" role="checkbox" class="xfo-schritt${lauf.haken[i] ? " an" : ""}" data-haken="${i}" aria-checked="${lauf.haken[i]}"><span class="xfo-box" aria-hidden="true">${lauf.haken[i] ? "✓" : i + 1}</span><span>${h(s)}</span></button></li>`).join("")}</ol>
    <button type="button" class="xfo-btn gross${alle ? "" : " aus"}" data-erledigt aria-disabled="${!alle}">${alle ? "🎉 Erledigt!" : "Hake alle Schritte ab"}</button>
  </section>`;
}
function formHTML(a){
  const f = a.form || {};
  const zaehler = (f.zaehler || []).map(z => { const v = +lauf.werte[z[0]] || 0;
    return `<div class="xfo-zaehler"><span>${h(z[1])}</span><div class="xfo-z-knoepfe"><button type="button" class="xfo-rund" data-z="${h(z[0])}" data-d="-1" aria-label="${h(z[1])}: eins weniger">−</button><output aria-live="polite">${v}</output><button type="button" class="xfo-rund" data-z="${h(z[0])}" data-d="1" aria-label="${h(z[1])}: eins mehr">+</button></div></div>`; }).join("");
  const zahlen = (f.zahlen || []).map(z => `<label class="xfo-zahl"><span>${h(z[1])}</span><span class="xfo-zahl-in"><input type="number" inputmode="decimal" min="0" max="99999" step="any" data-zahl="${h(z[0])}" value="${h(lauf.werte[z[0]] ?? "")}"><small>${h(z[2] || "")}</small></span></label>`).join("");
  const wahl = f.auswahl ? `<div class="xfo-wahl" role="radiogroup" aria-labelledby="xfoWahlT"><p id="xfoWahlT">${h(f.auswahl.f)}</p><div>${f.auswahl.o.map((o, i) => `<button type="button" role="radio" class="xfo-chip${lauf.wahl === o ? " an" : ""}" data-wahl="${i}" aria-checked="${lauf.wahl === o}">${h(o)}</button>`).join("")}</div></div>` : "";
  const weiter = a.fragen.length ? "Weiter zu den Fragen →" : "📓 Speichern und fertig";
  return `<section class="xfo-panel" aria-labelledby="xfoFormT">
    <div class="xfo-panel-kopf"><h3 id="xfoFormT" tabindex="-1">📝 Deine Beobachtungen</h3></div>
    ${zaehler ? `<div class="xfo-zaehlers">${zaehler}</div>` : ""}${zahlen ? `<div class="xfo-zahlen">${zahlen}</div>` : ""}${wahl}
    <label class="xfo-notiz"><span>${h(f.notiz || "Notiz (freiwillig)")}</span><textarea maxlength="${MAX_NOTIZ}" rows="2" data-notiz placeholder="Was hast du entdeckt?">${h(lauf.notiz)}</textarea><small><span data-zz>${lauf.notiz.length}</span>/${MAX_NOTIZ} · Bitte keine Namen, Adressen oder Telefonnummern.</small></label>
    <button type="button" class="xfo-btn gross" data-formweiter>${weiter}</button>
  </section>`;
}
function mischen(n){ const o = [...Array(n).keys()]; for(let i = n - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; } return o; }
function frageHTML(a){
  const q = a.fragen[lauf.qi]; if(!lauf.ordnung) lauf.ordnung = mischen(q.a.length);
  const beantwortet = lauf.antwort != null, ok = lauf.antwort === 0;
  return `<section class="xfo-panel" aria-labelledby="xfoFrT">
    <div class="xfo-panel-kopf"><h3>🧠 Forscher-Frage</h3><span class="xfo-pille dunkel">${lauf.qi + 1} von ${a.fragen.length}</span></div>
    <p class="xfo-frage" id="xfoFrT" tabindex="-1">${h(q.q)}</p>
    <div class="xfo-antw">${lauf.ordnung.map(i => { let c = ""; if(beantwortet){ if(i === 0) c = " ok"; else if(i === lauf.antwort) c = " nein"; }
      return `<button type="button" class="xfo-a${c}" data-antw="${i}"${beantwortet ? ` aria-disabled="true"` : ""}>${h(q.a[i])}${beantwortet && i === 0 ? ` <span aria-hidden="true">✓</span>` : ""}</button>`; }).join("")}</div>
    <div class="xfo-erkl" aria-live="polite">${beantwortet ? `<b>${ok ? "Richtig, super!" : "Nicht ganz. Die richtige Antwort ist grün markiert."}</b> ${h(q.e)}` : ""}</div>
    ${beantwortet ? `<button type="button" class="xfo-btn gross" data-fweiter>${lauf.qi + 1 < a.fragen.length ? "Nächste Frage →" : "Fertig!"}</button>` : ""}
  </section>`;
}
function naechsterAuftrag(a){
  const e = erledigt();
  const l = DATEN.filter(x => x.id !== a.id && !e[x.id] && passtJetzt(x));
  return l.find(x => x.kat === a.kat) || l[0] || null;
}
function fertigHTML(a){
  const r = lauf.ergebnis || {}, k = KAT[a.kat], n = anzahlKat(a.kat), {nx, proz} = fortschritt(n);
  const nxA = naechsterAuftrag(a), lib = a.thema && typeof THEMA !== "undefined" && THEMA[a.thema];
  return `<section class="xfo-panel xfo-fertig" aria-labelledby="xfoFertT">
    <img src="img/kids/${r.neuStufe ? "duo-jubel" : "lb-daumen"}.webp" alt="" class="xfo-fertig-bild">
    <h3 id="xfoFertT" tabindex="-1">${r.neuStufe ? `${STUFEN[r.neuStufe - 1].emo} Neues Forscher-Abzeichen!` : "🎉 Super geforscht!"}</h3>
    ${r.neuStufe ? `<p class="xfo-gross">${STUFEN[r.neuStufe - 1].name} für ${h(k.name)}</p>` : ""}
    <ul class="xfo-ergebnis">
      ${r.fragen ? `<li>🧠 ${r.richtig} von ${r.fragen} Fragen richtig</li>` : ""}
      <li>${r.xp ? `⭐ +${r.xp} XP` : r.wieder ? "🔁 Schon erforscht. Schön, dass du nochmals geforscht hast!" : "⭐ Danke fürs Forschen!"}</li>
      <li>📓 Im Tagebuch gespeichert</li>
    </ul>
    <div class="xfo-balken hell" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${proz}" aria-label="${h(k.name)}: Fortschritt"><i style="width:${proz}%"></i></div>
    <small class="xfo-fortschritt">${k.emo} ${h(k.name)}: ${n} erforscht${nx ? ` · noch ${nx.n - n} bis ${nx.emo} ${nx.name}` : " · 🥇 Gold!"}</small>
    <div class="xfo-knoepfe">${nxA ? `<button type="button" class="xfo-btn" data-auf="${h(nxA.id)}">${nxA.emo} Nächster Auftrag</button>` : ""}
      ${lib ? `<button type="button" class="xfo-btn hell" data-lib="${h(a.thema)}">📚 Mehr über ${h(THEMA[a.thema].name)}</button>` : ""}
      <button type="button" class="xfo-btn hell" data-tab="tagebuch">📓 Tagebuch</button>
      <button type="button" class="xfo-btn hell" data-tab="start">🧭 Übersicht</button></div>
  </section>`;
}

/* ---------- Abschluss eines Auftrags ---------- */
function abschliessen(a){
  const e = erledigt(), vorher = e[a.id], katVor = stufeKat(anzahlKat(a.kat));
  e[a.id] = {n:(vorher ? vorher.n : 0) + 1, d:heuteISO(), erst:vorher ? vorher.erst : heuteISO()};
  A.LS.set(K.erledigt, e);
  const l = A.LS.get(K.laufend, {}) || {}; delete l[a.id]; A.LS.set(K.laufend, l);
  // Tagebuch-Eintrag
  const f = a.form || {}, felder = [];
  (f.zaehler || []).forEach(z => felder.push([z[1], String(+lauf.werte[z[0]] || 0)]));
  (f.zahlen || []).forEach(z => { const v = lauf.werte[z[0]]; if(v !== undefined && v !== "") felder.push([z[1], `${v}${z[2] ? " " + z[2] : ""}`]); });
  const fr = a.fragen.length;
  const eintrag = {k:Date.now().toString(36) + Math.random().toString(36).slice(2, 6), id:a.id, d:heuteISO(), t:a.titel, emo:a.emo, kat:a.kat, f:felder,
    w:lauf.wahl || "", wf:f.auswahl ? f.auswahl.f : "", n:String(lauf.notiz || "").slice(0, MAX_NOTIZ).trim(), r:fr ? `${lauf.richtig}/${fr}` : ""};
  const tb = tagebuch(); tb.unshift(eintrag); A.LS.set(K.tagebuch, tb.slice(0, MAX_TB));
  // XP und Abzeichen: massvoll und nur beim ersten Mal
  let xp = 0, neuStufe = 0;
  if(!vorher){
    xp += A.xp(XP_AUFTRAG + XP_FRAGE * lauf.richtig);
    const katNach = stufeKat(anzahlKat(a.kat));
    if(katNach > katVor){
      neuStufe = katNach;
      const abz = A.LS.get(K.abz, {}) || {}; abz[a.kat] = katNach; A.LS.set(K.abz, abz);
      xp += A.xp(STUFEN[katNach - 1].xp);
    }
  }
  lauf.ergebnis = {xp, neuStufe, wieder:!!vorher, richtig:lauf.richtig, fragen:fr};
  lauf.phase = "fertig";
  if(neuStufe){ A.ton("freischalten"); if(!A.ruhig()) A.konfetti(); A.toast(`${STUFEN[neuStufe - 1].emo} Forscher-Abzeichen ${STUFEN[neuStufe - 1].name}: ${KAT[a.kat].name}!`, 3600); }
  else A.ton(xp ? "xp" : "sammeln");
  zeichne("#xfoFertT");
}

/* ---------- Ereignisse ---------- */
function pfeile(gruppe, sel, waehlen){
  if(!gruppe) return;
  gruppe.addEventListener("keydown", ev => {
    const l = [...gruppe.querySelectorAll(sel)], i = l.indexOf(document.activeElement); if(i < 0) return;
    const d = ev.key === "ArrowRight" || ev.key === "ArrowDown" ? 1 : ev.key === "ArrowLeft" || ev.key === "ArrowUp" ? -1 : 0; if(!d) return;
    ev.preventDefault(); const z = l[(i + d + l.length) % l.length]; z.focus(); if(waehlen) z.click();
  });
}
function binden(){
  const B = BOX;
  B.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => {
    ansicht = b.dataset.tab; lauf = null; tbLoeschen = null; A.ton("klick");
    zeichne(".xfo-tab.an");
  });
  B.querySelectorAll("[data-auf]").forEach(b => b.onclick = () => oeffneAuftrag(b.dataset.auf));
  B.querySelectorAll("[data-kat]").forEach(b => b.onclick = () => {
    if(wahlKat === b.dataset.kat) return;
    wahlKat = b.dataset.kat; A.LS.set(K.kat, wahlKat); A.ton("klick"); zeichne();
    const x = BOX.querySelector(`[data-kat="${wahlKat}"]`); if(x) x.focus({preventScroll:true});
  });
  pfeile(B.querySelector(".xfo-tabs"), "[data-tab]", false);
  pfeile(B.querySelector(".xfo-kats"), "[data-kat]", true);
  B.querySelectorAll("[data-tbdel]").forEach(b => b.onclick = () => tbLoeschenKlick(b.dataset.tbdel));
  B.querySelectorAll("[data-lib]").forEach(b => b.onclick = () => {
    const id = b.dataset.lib; A.ton("klick");
    try{ if(typeof libThemaOeffnen === "function"){ libThemaOeffnen(id); return; } }catch(e){}
    try{ LIB.thema = id; LIB.buch = (THEMA[id].bereich && THEMA[id].bereich.id) || LIB.buch; S.libModus = true; document.documentElement.dataset.mode = "lib"; go("libthema"); }
    catch(e){ A.toast("Die Bibliothek ist gerade nicht erreichbar."); }
  });
  if(!lauf || ansicht !== "auftrag") return;
  const a = auftrag(lauf.id);
  B.querySelectorAll("[data-haken]").forEach(b => b.onclick = () => {
    const i = +b.dataset.haken; lauf.haken[i] = !lauf.haken[i]; hakenSpeichern();
    A.ton(lauf.haken[i] ? "tick" : "klick");
    zeichne(); const x = BOX.querySelector(`[data-haken="${i}"]`); if(x) x.focus({preventScroll:true});
  });
  const erl = B.querySelector("[data-erledigt]");
  if(erl) erl.onclick = () => {
    if(!lauf.haken.every(Boolean)){ A.ton("klick"); A.toast("Hake zuerst alle Schritte ab. Du schaffst das!"); const o = BOX.querySelector(".xfo-schritt:not(.an)"); if(o) o.focus(); return; }
    A.ton("richtig");
    if(a.form){ lauf.phase = "form"; zeichne("#xfoFormT"); }
    else if(a.fragen.length){ lauf.phase = "fragen"; zeichne("#xfoFrT"); }
    else abschliessen(a);
  };
  B.querySelectorAll("[data-z]").forEach(b => b.onclick = () => {
    const id = b.dataset.z; lauf.werte[id] = Math.max(0, Math.min(9999, (+lauf.werte[id] || 0) + (+b.dataset.d)));
    const o = b.parentNode.querySelector("output"); if(o) o.textContent = lauf.werte[id]; A.ton("tick");
  });
  B.querySelectorAll("[data-zahl]").forEach(inp => inp.oninput = () => {
    const n = parseFloat(String(inp.value || "").replace(",", "."));
    lauf.werte[inp.dataset.zahl] = isFinite(n) ? String(Math.round(Math.max(0, Math.min(99999, n)) * 10) / 10) : "";
  });
  const wahlBox = B.querySelector(".xfo-wahl");
  B.querySelectorAll("[data-wahl]").forEach(b => b.onclick = () => {
    const o = a.form.auswahl.o[+b.dataset.wahl]; lauf.wahl = lauf.wahl === o ? "" : o; A.ton("klick");
    wahlBox.querySelectorAll("[data-wahl]").forEach(x => { const an = a.form.auswahl.o[+x.dataset.wahl] === lauf.wahl; x.classList.toggle("an", an); x.setAttribute("aria-checked", an); });
  });
  const ta = B.querySelector("[data-notiz]");
  if(ta) ta.oninput = () => { if(ta.value.length > MAX_NOTIZ) ta.value = ta.value.slice(0, MAX_NOTIZ); lauf.notiz = ta.value; const z = BOX.querySelector("[data-zz]"); if(z) z.textContent = ta.value.length; };
  const fw = B.querySelector("[data-formweiter]");
  if(fw) fw.onclick = () => { A.ton("klick"); if(a.fragen.length){ lauf.phase = "fragen"; zeichne("#xfoFrT"); } else abschliessen(a); };
  B.querySelectorAll("[data-antw]").forEach(b => b.onclick = () => {
    if(lauf.antwort != null) return;
    lauf.antwort = +b.dataset.antw; const ok = lauf.antwort === 0; if(ok) lauf.richtig++;
    A.ton(ok ? "richtig" : "falsch");
    zeichne();
    const w = BOX.querySelector("[data-fweiter]");
    if(w){ w.focus({preventScroll:true}); const r = w.getBoundingClientRect(), frei = innerHeight - 120; // Platz für die Leiste unten
      if(r.bottom > frei) window.scrollBy({top:r.bottom - frei, behavior:A.ruhig() ? "auto" : "smooth"}); }
  });
  const fwe = B.querySelector("[data-fweiter]");
  if(fwe) fwe.onclick = () => {
    A.ton("klick");
    if(lauf.qi + 1 < a.fragen.length){ lauf.qi++; lauf.antwort = null; lauf.ordnung = null; zeichne("#xfoFrT"); }
    else abschliessen(a);
  };
}

/* ---------- Stil ---------- */
const css = document.createElement("style"); css.id = "ep-x-forscher";
css.textContent = `
.xfo-kopf{background:linear-gradient(135deg,#1B6E36,#2A80CF 70%,#4F32B8)!important;margin-bottom:12px!important}
.xfo-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.xfo-tabs{display:flex;gap:8px;margin:0 0 12px}
.xfo-tab{flex:1 1 0;min-width:0;border:0;border-radius:999px;padding:10px 12px;min-height:44px;background:rgba(15,20,48,.72);color:#fff;font:700 .95rem "Lexend",system-ui,sans-serif;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-shadow:0 6px 14px rgba(27,34,64,.15)}
.xfo-tab i{font-style:normal;font-size:.75rem;background:rgba(255,255,255,.22);border-radius:999px;padding:1px 7px;margin-left:6px}
.xfo-tab.an{background:#fff;color:#1B2240}
.xfo-tab.an i{background:#1B2240;color:#fff}
.xfo-tab:focus-visible,.xfo-btn:focus-visible,.xfo-kat:focus-visible,.xfo-karte:focus-visible,.xfo-schritt:focus-visible,.xfo-a:focus-visible,.xfo-chip:focus-visible,.xfo-rund:focus-visible,.xfo-mini:focus-visible,.xfo-zurueck:focus-visible,.xfo-zahl input:focus-visible,.xfo-notiz textarea:focus-visible{outline:3px solid #FFE34D;outline-offset:3px}
.xfo-pille{display:inline-flex;align-items:center;gap:4px;background:rgba(15,20,48,.3);color:#fff;font-weight:700;font-size:.78rem;padding:4px 10px;border-radius:999px;max-width:100%;box-sizing:border-box}
.xfo-pille.hell{background:rgba(255,255,255,.24)}
.xfo-pille.dunkel{background:rgba(15,20,48,.55)}
.xfo-meta{display:flex;flex-wrap:wrap;gap:6px}
.xfo-btn{border:0;border-radius:999px;background:#fff;color:#1B2240;font:800 1rem "Lexend",system-ui,sans-serif;padding:12px 20px;min-height:46px;cursor:pointer;box-shadow:0 6px 14px rgba(0,0,0,.18)}
.xfo-btn:hover{transform:translateY(-1px)}
.xfo-btn.hell{background:rgba(255,255,255,.16);color:#fff;box-shadow:none;border:2px solid rgba(255,255,255,.55)}
.xfo-btn.gross{width:100%;margin-top:12px;font-size:1.08rem}
.xfo-btn.aus{background:rgba(255,255,255,.3);color:#fff;box-shadow:none;cursor:default;transform:none}
.xfo-held{position:relative;display:flex;align-items:center;gap:16px;border-radius:28px;padding:20px 22px;color:#fff;box-shadow:0 14px 30px rgba(27,34,64,.25);margin-bottom:12px;overflow:hidden}
.xfo-held::before{content:"";position:absolute;inset:0;background:radial-gradient(60% 80% at 10% 0%,rgba(255,255,255,.25),transparent 60%);pointer-events:none}
.xfo-held-tx{position:relative;flex:1;min-width:0;display:flex;flex-direction:column;gap:7px;align-items:flex-start}
.xfo-held h2{margin:0;font:800 clamp(1.3rem,3.4vw,2rem)/1.15 "Bricolage Grotesque","Fredoka",system-ui,sans-serif;color:#fff}
.xfo-held p{margin:0;color:#fff;opacity:.96;line-height:1.4}
.xfo-held .xfo-btn{position:relative;flex:0 0 auto}
.xfo-held-bild{display:none}
.xfo-kats{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin-bottom:12px}
.xfo-kat{position:relative;border:0;border-radius:20px;padding:10px 6px;min-height:66px;color:#fff;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;box-shadow:0 8px 18px rgba(27,34,64,.18);opacity:.9;font:inherit;transition:opacity .15s}
.xfo-kat span{font-size:1.4rem;line-height:1}
.xfo-kat b{font-size:.8rem;color:#fff;line-height:1.15;text-align:center}
.xfo-kat i{position:absolute;top:4px;right:6px;font-style:normal;font-size:.9rem}
.xfo-kat.an{opacity:1;box-shadow:0 0 0 3px #fff,0 0 0 6px rgba(15,20,48,.35),0 8px 18px rgba(27,34,64,.18)}
.xfo-liste-kopf{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:2px 0 10px}
.xfo-titel{margin:0;background:rgba(15,20,48,.55);color:#fff;font:800 1.05rem "Lexend",system-ui,sans-serif;padding:7px 14px;border-radius:999px}
.xfo-liste{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px}
.xfo-karte{position:relative;display:flex;align-items:center;gap:10px;border:0;border-radius:20px;padding:10px 12px;min-height:64px;color:#fff;text-align:left;cursor:pointer;box-shadow:0 8px 18px rgba(27,34,64,.18);font:inherit;transition:transform .15s;min-width:0}
.xfo-karte:hover{transform:translateY(-2px)}
.xfo-karte.spaeter{filter:saturate(.4);opacity:.85}
.xfo-k-emo{font-size:1.7rem;line-height:1;flex:0 0 auto}
.xfo-k-tx{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}
.xfo-k-tx b{font-size:.95rem;color:#fff;line-height:1.2}
.xfo-k-tx small{font-size:.74rem;color:#fff;opacity:.95;line-height:1.25}
.xfo-k-ok{flex:0 0 auto;font-size:1.1rem}
.xfo-abz{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}
.xfo-abz-k{border-radius:24px;padding:14px 16px;color:#fff;box-shadow:0 10px 22px rgba(27,34,64,.2);display:flex;flex-direction:column;gap:8px;min-width:0}
.xfo-abz-top{display:flex;align-items:center;gap:8px}
.xfo-abz-emo{font-size:1.5rem}
.xfo-abz-top b{flex:1;min-width:0;font-size:1.05rem;color:#fff}
.xfo-abz-top small{font-weight:700;color:#fff}
.xfo-medaillen{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
.xfo-med{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;background:rgba(15,20,48,.25);border-radius:16px;padding:6px 4px}
.xfo-med>span:first-child{font-size:1.6rem;line-height:1;filter:grayscale(1);opacity:.45}
.xfo-med.hat{background:rgba(255,255,255,.28)}
.xfo-med.hat>span:first-child{filter:none;opacity:1}
.xfo-med small{font-size:.72rem;font-weight:700;color:#fff}
.xfo-balken{height:10px;border-radius:999px;background:rgba(15,20,48,.3);overflow:hidden}
.xfo-balken i{display:block;height:100%;background:#FFE34D;border-radius:999px}
.xfo-balken.hell{background:rgba(255,255,255,.18);margin-top:6px}
.xfo-abz-tx{font-weight:700;color:#fff;font-size:.8rem}
.xfo-tipp{display:inline-block;margin:12px 0 0;background:rgba(15,20,48,.55);color:#fff;font-size:.86rem;padding:8px 14px;border-radius:16px;line-height:1.4}
.xfo-tb{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;margin-top:10px}
.xfo-eintrag{border-radius:22px;padding:12px 14px;color:#fff;box-shadow:0 8px 18px rgba(27,34,64,.18);min-width:0}
.xfo-e-kopf{display:flex;align-items:center;gap:10px}
.xfo-e-kopf>div{flex:1;min-width:0;display:flex;flex-direction:column}
.xfo-e-kopf b{color:#fff}.xfo-e-kopf small{color:#fff;opacity:.92;font-size:.76rem}
.xfo-e-emo{font-size:1.5rem}
.xfo-e-werte{list-style:none;margin:8px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:5px}
.xfo-e-werte li{background:rgba(15,20,48,.25);border-radius:12px;padding:3px 9px;font-size:.78rem;color:#fff;max-width:100%;box-sizing:border-box}
.xfo-e-notiz{margin:8px 0 0;font-style:italic;color:#fff;overflow-wrap:anywhere;line-height:1.35;font-size:.9rem}
.xfo-mini{border:0;border-radius:999px;background:rgba(255,255,255,.22);color:#fff;font:700 .85rem "Lexend",system-ui,sans-serif;padding:8px 12px;min-height:40px;min-width:44px;cursor:pointer;flex:0 0 auto}
.xfo-mini.warn{background:#fff;color:#1B2240}
.xfo-mini.dunkel{background:rgba(15,20,48,.55)}
.xfo-mini.dunkel.warn{background:#fff;color:#1B2240}
.xfo-tb-fuss{margin-top:12px}
.xfo-leer{display:flex;flex-direction:column;align-items:flex-start;gap:8px;background:rgba(15,20,48,.55);color:#fff;border-radius:24px;padding:18px}
.xfo-leer>span:first-child{font-size:2rem}
.xfo-leer b,.xfo-leer span{color:#fff}
/* Auftrag */
.xfo-auf{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.25fr);gap:14px;align-items:start}
.xfo-auf-kopf{position:relative;border-radius:28px;padding:16px 18px 18px;color:#fff;box-shadow:0 14px 30px rgba(27,34,64,.25);display:flex;flex-direction:column;gap:8px;min-width:0}
.xfo-zurueck{align-self:flex-start;border:0;border-radius:999px;background:rgba(15,20,48,.3);color:#fff;font:700 .85rem "Lexend",system-ui,sans-serif;padding:8px 14px;min-height:40px;cursor:pointer}
.xfo-auf-t{display:flex;align-items:center;gap:12px}
.xfo-auf-emo{font-size:2.6rem;line-height:1}
.xfo-auf-t small{color:#fff;font-weight:700;opacity:.92}
.xfo-auf-t h2{margin:0;color:#fff;font:800 clamp(1.3rem,3.4vw,2rem)/1.12 "Bricolage Grotesque","Fredoka",system-ui,sans-serif}
.xfo-auf-t h2:focus{outline:none}
.xfo-auf-kopf p{margin:0;color:#fff;line-height:1.4}
.xfo-auf-rechts{display:flex;flex-direction:column;gap:12px;min-width:0}
.xfo-sicher{display:flex;gap:10px;align-items:flex-start;border-radius:20px;padding:12px 14px;background:linear-gradient(135deg,#A9500E,#D98318);color:#fff;box-shadow:0 8px 18px rgba(27,34,64,.18)}
.xfo-sicher>span{font-size:1.5rem;line-height:1}
.xfo-sicher div{display:flex;flex-direction:column;gap:2px}
.xfo-sicher b,.xfo-sicher span{color:#fff}
.xfo-sicher div span{font-size:.92rem;line-height:1.35}
.xfo-panel{border-radius:26px;padding:16px;background:linear-gradient(160deg,#243066,#3A2F7A);color:#fff;box-shadow:0 14px 30px rgba(27,34,64,.25);min-width:0}
.xfo-panel-kopf{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}
.xfo-panel h3{margin:0;color:#fff;font:800 1.15rem "Lexend",system-ui,sans-serif}
.xfo-panel h3:focus,.xfo-frage:focus{outline:none}
.xfo-schritte{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.xfo-schritt{width:100%;display:flex;align-items:center;gap:12px;border:0;border-radius:18px;padding:10px 12px;min-height:52px;background:rgba(255,255,255,.12);color:#fff;text-align:left;cursor:pointer;font:600 .96rem/1.35 "Lexend",system-ui,sans-serif;transition:background .15s}
.xfo-schritt.an{background:rgba(70,200,120,.35)}
.xfo-box{flex:0 0 auto;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.2);font-weight:800;color:#fff}
.xfo-schritt.an .xfo-box{background:#2FA65E}
.xfo-zaehlers{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px}
.xfo-zaehler{display:flex;align-items:center;justify-content:space-between;gap:8px;background:rgba(255,255,255,.12);border-radius:16px;padding:6px 8px 6px 12px;min-width:0}
.xfo-zaehler>span{font-weight:700;font-size:.9rem;color:#fff;min-width:0}
.xfo-z-knoepfe{display:flex;align-items:center;gap:6px;flex:0 0 auto}
.xfo-z-knoepfe output{min-width:30px;text-align:center;font:800 1.15rem "Lexend",system-ui,sans-serif;color:#fff}
.xfo-rund{width:44px;height:44px;border-radius:50%;border:0;background:#fff;color:#1B2240;font:800 1.3rem/1 "Lexend",system-ui,sans-serif;cursor:pointer;padding:0}
.xfo-zahlen{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:8px;margin-top:8px}
.xfo-zahl{display:flex;flex-direction:column;gap:4px;background:rgba(255,255,255,.12);border-radius:16px;padding:8px 12px;min-width:0}
.xfo-zahl>span:first-child{font-weight:700;font-size:.88rem;color:#fff}
.xfo-zahl-in{display:flex;align-items:center;gap:6px}
.xfo-zahl input{width:100%;min-width:0;box-sizing:border-box;border:0;border-radius:12px;padding:8px 10px;font:700 1.05rem "Lexend",system-ui,sans-serif;background:#fff;color:#1B2240;min-height:42px}
.xfo-zahl small{color:#fff;font-weight:700;white-space:nowrap}
.xfo-wahl{margin:10px 0 0}
.xfo-wahl p{font-weight:700;color:#fff;margin:0 0 6px}
.xfo-wahl>div{display:flex;flex-wrap:wrap;gap:6px}
.xfo-chip{border:2px solid rgba(255,255,255,.5);border-radius:999px;background:transparent;color:#fff;font:700 .9rem "Lexend",system-ui,sans-serif;padding:8px 14px;min-height:42px;cursor:pointer}
.xfo-chip.an{background:#fff;color:#1B2240;border-color:#fff}
.xfo-notiz{display:flex;flex-direction:column;gap:4px;margin-top:10px}
.xfo-notiz>span{font-weight:700;color:#fff;font-size:.9rem}
.xfo-notiz textarea{width:100%;box-sizing:border-box;border:0;border-radius:14px;padding:10px 12px;font:500 1rem/1.35 "Lexend",system-ui,sans-serif;resize:vertical;min-height:58px;background:#fff;color:#1B2240}
.xfo-notiz small{color:#fff;opacity:.88;font-size:.74rem}
.xfo-frage{margin:0 0 12px;font:700 1.12rem/1.4 "Lexend",system-ui,sans-serif;color:#fff}
.xfo-antw{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.xfo-a{border:0;border-radius:16px;padding:12px;min-height:54px;background:rgba(255,255,255,.14);color:#fff;font:700 .95rem/1.3 "Lexend",system-ui,sans-serif;text-align:left;cursor:pointer}
.xfo-a:hover{background:rgba(255,255,255,.22)}
.xfo-a.ok,.xfo-a.ok:hover{background:#2FA65E}
.xfo-a.nein{background:rgba(255,255,255,.06);opacity:.7}
.xfo-erkl{margin-top:10px;color:#fff;line-height:1.4;font-size:.95rem}
.xfo-erkl:empty{display:none}
.xfo-fertig{text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px}
.xfo-fertig-bild{height:110px;width:auto;max-width:100%;object-fit:contain}
.xfo-fertig h3{font-size:1.4rem}
.xfo-gross{margin:0;font-weight:800;color:#FFE34D}
.xfo-ergebnis{list-style:none;margin:4px 0 0;padding:0;display:flex;flex-direction:column;gap:4px;color:#fff;font-weight:700}
.xfo-fertig .xfo-balken{width:100%;max-width:360px}
.xfo-fortschritt{color:#fff;font-weight:700}
.xfo-knoepfe{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:8px}
.xfo-knoepfe .xfo-btn{padding:10px 16px;font-size:.92rem;min-height:44px}
/* App-Startseite: Karussell-Folie */
.ap-held.hs-forscher{background:linear-gradient(140deg,#1B6E36,#2A80CF)!important}
@media (max-width:900px){
  .xfo-auf{grid-template-columns:1fr}
  .xfo-kats{grid-template-columns:repeat(3,minmax(0,1fr))}
}
@media (max-width:560px){
  .xfo-kopf{display:none!important}
  .xfo-held-bild{display:block;position:absolute;right:6px;top:8px;height:96px;width:auto;pointer-events:none}
  .xfo-held h2{padding-right:96px}
  .xfo-held p{padding-right:84px}
  .xfo-tabs{gap:6px}
  .xfo-tab{padding:8px 4px;font-size:.84rem}
  .xfo-tab i{display:none}
  .xfo-held{flex-direction:column;align-items:stretch;padding:14px 16px;border-radius:22px;gap:10px}
  .xfo-held p{font-size:.9rem}
  .xfo-held .xfo-btn{width:100%}
  .xfo-kats{gap:6px}
  .xfo-kat{min-height:54px;padding:6px 4px;border-radius:16px}
  .xfo-kat span{font-size:1.2rem}
  .xfo-kat b{font-size:.72rem}
  .xfo-liste{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
  .xfo-karte{gap:7px;padding:8px 9px;min-height:58px;border-radius:16px}
  .xfo-k-emo{font-size:1.25rem}
  .xfo-k-tx b{font-size:.8rem;overflow-wrap:anywhere;hyphens:auto}
  .xfo-k-tx small{font-size:.66rem}
  .xfo-k-ok{position:absolute;top:-4px;right:-2px;font-size:.85rem}
  .xfo-auf-kopf{padding:12px 14px 14px;border-radius:22px;gap:6px}
  .xfo-auf-emo{font-size:2rem}
  .xfo-auf-kopf p{font-size:.9rem}
  .xfo-panel{padding:12px;border-radius:22px}
  .xfo-schritt{min-height:46px;padding:8px 10px;font-size:.9rem}
  .xfo-box{width:28px;height:28px}
  .xfo-antw{grid-template-columns:1fr}
  .xfo-a{min-height:48px;padding:10px 12px}
  .xfo-fertig-bild{height:84px}
  .xfo-abz{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
  .xfo-abz-k{padding:10px;border-radius:20px;gap:6px}
  .xfo-abz-top{gap:5px}
  .xfo-abz-top b{font-size:.84rem}
  .xfo-abz-emo{font-size:1.15rem}
  .xfo-med{padding:4px 2px;border-radius:12px}
  .xfo-med>span:first-child{font-size:1.2rem}
  .xfo-med small{font-size:.6rem}
  .xfo-abz-tx{font-size:.7rem}
  .xfo-tb{grid-template-columns:1fr}
}
@media (prefers-reduced-motion:reduce){.xfo-btn:hover,.xfo-karte:hover{transform:none}.xfo-karte,.xfo-kat,.xfo-schritt{transition:none}}
`;
document.head.appendChild(css);

/* ---------- Anmelden ---------- */
X.register({
  id:"forscher", titel:"Forscher-Aufträge", text:"Missionen für draussen und zu Hause", emo:"🔎",
  farbe:"linear-gradient(135deg,#1B6E36,#2A80CF)", reihe:70,
  hinweis(){ return A.LS.get(K.gesehen, "") === heuteISO() ? "" : "Neuer Auftrag"; },
  folie(){
    let t = null;
    if(DATEN) t = tagesAuftrag();
    else { laden().catch(() => {}); const g = A.LS.get(K.heute, null); if(g && g.d === heuteISO() && g.titel) t = g; }
    if(!t) return null;
    return {cls:"hs-forscher", ic:t.emo, lbl:"Forscher-Auftrag des Tages", titel:t.titel, text:t.kurz, btn:"🔎 Los geht's", a:"x-forscher"};
  },
  render(box){
    BOX = box;
    A.LS.set(K.gesehen, heuteISO());
    if(ansicht === "auftrag" && !lauf) ansicht = "start";
    if(DATEN){ zeichne(); return; }
    box.innerHTML = `<p class="x-leer">Die Forscher-Aufträge werden geladen …</p>`;
    laden().then(() => { if(BOX === box) zeichne(); })
      .catch(() => { if(BOX === box) box.innerHTML = `<p class="x-leer">Die Aufträge konnten nicht geladen werden. Bitte versuch es später nochmals.</p>`; });
  }
});

/* ---------- Öffentliche API ---------- */
window.EP_FORSCHER = {
  /* {erledigt, alle, tagebuch, abzeichen:{kat:{name, n, stufe 0..3, medaille}}, heute:{id,titel,emo,kat}|null, geladen} */
  stand(){
    const e = erledigt(), d = DATEN || [], abzeichen = {};
    KATS.forEach(k => { const n = d.filter(a => a.kat === k.id && e[a.id]).length, s = stufeKat(n); abzeichen[k.id] = {name:k.name, n, stufe:s, medaille:s ? STUFEN[s - 1].name : ""}; });
    const t = tagesAuftrag();
    return {erledigt:d.filter(a => e[a.id]).length, alle:d.length, tagebuch:tagebuch().length, abzeichen, heute:t ? {id:t.id, titel:t.titel, emo:t.emo, kat:t.kat} : null, geladen:!!DATEN};
  },
  heute(){ const t = tagesAuftrag(); return t ? {id:t.id, titel:t.titel, emo:t.emo, kat:t.kat, kurz:t.kurz} : null; },
  oeffne(id){ laden().then(() => { lauf = null; ansicht = "start"; go("x-forscher"); if(id && auftrag(id)) oeffneAuftrag(id); }).catch(() => go("x-forscher")); },
  liste(){ return (DATEN || []).map(a => ({id:a.id, titel:a.titel, emo:a.emo, kat:a.kat, jetzt:passtJetzt(a)})); },
  laden(){ return laden().then(l => l.length); }
};
// Daten früh im Hintergrund laden, damit Karussell-Folie und stand() bereit sind
laden().then(() => tagesAuftrag()).catch(() => {});
})();
