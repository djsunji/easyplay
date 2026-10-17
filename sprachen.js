/* easyplay Welt «Französisch & Englisch» (x-sprachen): Wörter-Trainer
   Wortlisten: welten/sprachen/fr.json und en.json (18 Themen, je über 500 Wörter, Stufe 1 bis 3)
   Spielmodi: Karteikarten, Auswahl (beide Richtungen), Hören, Schreiben (mit Akzent-Tasten), Memory, Wörterliste
   Aussprache mit speechSynthesis (fr-CH/fr-FR bzw. en-GB), Wiederholen nach Leitner (5 Fächer) pro Wort.
   API: window.EP_SPRACHEN = { stand(), fortschritt() → {hat, alle}, faellig(sprache), sprich(text, sprache), laden(sprache) }
   Speicher: ep-x-sprachen-einst, ep-x-sprachen-fr-leitner, ep-x-sprachen-en-leitner, ep-x-sprachen-xp, ep-x-sprachen-anzahl */
(function(){
"use strict";
if(!window.EP_EXTRAS) return;
const X = window.EP_EXTRAS, A = X.api, h = A.h;

const PRE = "ep-x-sprachen-";
const K = { einst: PRE + "einst", box: sp => PRE + sp + "-leitner", xp: PRE + "xp", anz: PRE + "anzahl" };
const SPRACHEN = { fr: {name:"Französisch", kurz:"FR", fahne:"🥐", lang:"fr-FR", hallo:"Bonjour !"}, en: {name:"Englisch", kurz:"EN", fahne:"☕", lang:"en-GB", hallo:"Hello!"} };
const INTERVALL = [0, 1, 2, 4, 7, 14];       // Tage bis zur nächsten Wiederholung je Fach (1 bis 5)
const RUNDE = 10, XP_TAG_MAX = 150;
const STUFEN = [{id:1, name:"Start", text:"ab 3. Klasse"}, {id:2, name:"Mittel", text:"ab 5. Klasse"}, {id:3, name:"Alle", text:"Oberstufe"}];
const MODI = [
  {id:"karten", name:"Karteikarten", emo:"🃏", text:"Umdrehen und anhören"},
  {id:"wahl", name:"Auswahl", emo:"🔤", text:"Aus 4 Wörtern wählen"},
  {id:"hoeren", name:"Hören", emo:"👂", text:"Hören und Bild finden"},
  {id:"schreiben", name:"Schreiben", emo:"✍️", text:"Wort eintippen"},
  {id:"memory", name:"Memory", emo:"🧩", text:"Paare finden"},
  {id:"liste", name:"Wörterliste", emo:"📋", text:"Alle Wörter ansehen"}
];
const AKZENTE = { fr: ["é", "è", "ê", "à", "â", "ç", "ô", "û", "ù", "î", "ï", "ë", "œ", "'"], en: ["'"] };

/* ---------- Hilfen ---------- */
const tagNr = () => { const t = A.heute(); const [j, m, d] = t.split("-").map(Number); return Math.round(Date.UTC(j, m - 1, d) / 864e5); };
const mische = a => { a = a.slice(); for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const istTouch = () => { try{ return matchMedia("(hover: none)").matches; }catch(e){ return false; } };
const ohneAkzent = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/œ/g, "oe").replace(/æ/g, "ae");
const grund = s => String(s || "").toLowerCase().replace(/[’`´]/g, "'").replace(/\.\.\./g, " ").replace(/[?!.,;:¡¿«»"()]/g, " ").replace(/\s+/g, " ").trim();
const lockern = s => ohneAkzent(grund(s)).replace(/-/g, " ").replace(/\s+/g, " ").trim();
const ohneApo = s => s.replace(/'\s?/g, " ").replace(/\s+/g, " ").trim();   // «l elephant» wie «l'éléphant»
function lev(a, b){
  if(Math.abs(a.length - b.length) > 2) return 9;
  const d = []; for(let i = 0; i <= a.length; i++){ d[i] = [i]; }
  for(let j = 1; j <= b.length; j++) d[0][j] = j;
  for(let i = 1; i <= a.length; i++) for(let j = 1; j <= b.length; j++){
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    if(i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);   // vertauschte Buchstaben zählen als ein Fehler
  }
  return d[a.length][b.length];
}

/* ---------- Einstellungen ---------- */
function einst(){
  const e = A.LS.get(K.einst, null) || {};
  if(!SPRACHEN[e.sp]) e.sp = "fr";
  if(![1, 2, 3].includes(e.stufe)){ const s = A.stufe(); e.stufe = s === 1 ? 1 : s === 2 ? 2 : 3; }
  if(e.richtung !== "fremd") e.richtung = "de";
  return e;
}
const einstSetzen = (k, v) => { const e = einst(); e[k] = v; A.LS.set(K.einst, e); };

/* ---------- Daten ---------- */
const DATA = {}, LADE = {};
function laden(sp){
  if(!LADE[sp]) LADE[sp] = fetch("welten/sprachen/" + sp + ".json", {cache:"no-cache"}).then(r => r.ok ? r.json() : null).then(d => {
    if(d && Array.isArray(d.woerter)){ d.byId = {}; d.woerter.forEach(w => { d.byId[w.id] = w; }); d.themaById = {}; d.themen.forEach(t => { d.themaById[t.id] = t; }); DATA[sp] = d;
      const anz = A.LS.get(K.anz, null) || {}; if(anz[sp] !== d.woerter.length){ anz[sp] = d.woerter.length; A.LS.set(K.anz, anz); }
      return d; }
    LADE[sp] = null; return null;
  }).catch(() => { LADE[sp] = null; return null; });
  return LADE[sp];
}

/* ---------- Leitner (5 Fächer) ----------
   pro Wort: [fach 1-5, fällig ab Tag-Nr., richtig, falsch]. Richtig: ein Fach weiter, falsch: zurück in Fach 1. */
const boxen = sp => A.LS.get(K.box(sp), null) || {};
function buchen(sp, id, ergebnis){   // ergebnis: "ok" | "falsch" | "fast"
  const b = boxen(sp), heute = tagNr();
  const e = b[id] || [0, heute, 0, 0];
  if(ergebnis === "ok"){ e[0] = Math.min(5, (e[0] || 0) + 1); e[1] = heute + INTERVALL[e[0]]; e[2]++; }
  else if(ergebnis === "falsch"){ e[0] = 1; e[1] = heute; e[3]++; }
  else { e[0] = Math.max(1, e[0] || 0); e[1] = heute; }
  b[id] = e; A.LS.set(K.box(sp), b);
}
const fach = (b, id) => (b[id] && b[id][0]) || 0;
function faelligIds(sp){ const b = boxen(sp), t = tagNr(); return Object.keys(b).filter(id => b[id][0] > 0 && b[id][1] <= t); }
function themaStand(sp, tid, stufe){
  const d = DATA[sp]; if(!d) return {n:0, sicher:0, prozent:0};
  const b = boxen(sp); const ws = d.woerter.filter(w => w.t === tid && (!stufe || w.l <= stufe));
  let summe = 0, sicher = 0; ws.forEach(w => { const f = fach(b, w.id); summe += f; if(f >= 3) sicher++; });
  return {n:ws.length, sicher, prozent: ws.length ? Math.round(summe / (ws.length * 5) * 100) : 0};
}

/* ---------- XP (massvoll, mit Tagesgrenze) ---------- */
function xpGeben(n){
  if(!n) return 0;
  const z = A.LS.get(K.xp, null) || {}; const t = A.heute();
  if(z.tag !== t){ z.tag = t; z.n = 0; }
  const rest = Math.max(0, XP_TAG_MAX - z.n); n = Math.min(n, rest); if(!n) return 0;
  const bekam = A.xp(n) || 0; z.n += n; A.LS.set(K.xp, z); return bekam || n;
}

/* ---------- Aussprache ---------- */
const TTS = () => (typeof window.speechSynthesis !== "undefined" && window.speechSynthesis && typeof window.SpeechSynthesisUtterance !== "undefined") ? window.speechSynthesis : null;
function stimme(sp){
  const s = TTS(); if(!s) return null;
  let vs = []; try{ vs = s.getVoices() || []; }catch(e){}
  const pref = (DATA[sp] && DATA[sp].stimmen) || (sp === "fr" ? ["fr-CH", "fr-FR", "fr"] : ["en-GB", "en"]);
  const lg = v => String(v.lang || "").replace("_", "-").toLowerCase();
  for(const p of pref){
    const pl = p.toLowerCase();
    const v = pl.length === 2 ? vs.find(v => lg(v).startsWith(pl + "-") || lg(v) === pl) : vs.find(v => lg(v) === pl);
    if(v) return v;
  }
  return null;
}
function stimmeInfo(sp){
  const s = TTS(); if(!s) return {an:false, text:"Dieses Gerät kann leider nicht vorlesen. Die Spiele ohne Ton funktionieren trotzdem."};
  const v = stimme(sp);
  if(!v) return {an:true, ohne:true, text:`Auf diesem Gerät ist keine ${sp === "fr" ? "französische" : "englische"} Stimme installiert. Die Aussprache kann deshalb falsch klingen.`};
  return {an:true, stimme:v.name, lang:v.lang};
}
const sprechText = t => String(t || "").replace(/\s\/\s/g, ", ").replace(/\.\.\./g, "").replace(/\s+/g, " ").trim();
function sprich(text, sp, langsam){
  const s = TTS(); if(!s || !text) return false;
  try{
    s.cancel();
    const u = new SpeechSynthesisUtterance(sprechText(text));
    const v = stimme(sp); u.lang = v ? v.lang : SPRACHEN[sp].lang; if(v) u.voice = v;
    u.rate = langsam ? 0.6 : 0.88; u.pitch = 1.05;
    s.speak(u); return true;
  }catch(e){ return false; }
}

/* ---------- Wort-Darstellung ---------- */
const anzeige = w => w.w + (w.f && w.f !== w.w ? " / " + w.f : "");
function bild(w, cls){
  cls = cls || "";
  if(w.fb) return `<span class="spr-fb ${cls}" style="background:${h(w.fb)}" role="img" aria-label="${h(w.de)}"></span>`;
  if(w.txt) return `<span class="spr-txt ${cls}" role="img" aria-label="${h(w.de)}">${h(w.txt)}</span>`;
  return `<span class="spr-emo ${cls}" role="img" aria-label="${h(w.de)}">${h(w.emo || "❔")}</span>`;
}
function formen(w){   // alle Schreibweisen, die als «gleich» gelten (damit kein Ablenker auch richtig wäre)
  const f = [w.w, w.kern, w.f, w.fkern].concat(w.alt || []).filter(Boolean).map(lockern);
  return new Set(f.map(x => x.replace(/^(the|to|le|la|les|l') ?/, "")));
}
const bildKey = w => w.emo || w.fb || w.txt;

/* ---------- Schreiben: tolerante Prüfung ----------
   ok (evtl. mit Tipp zu Akzenten/Artikel), fast (Tippfehler oder falscher Artikel), falsch */
function pruefe(eingabe, w, sp){
  const roh = grund(eingabe); if(!roh) return {art:"leer"};
  const voll = [w.w, w.f].concat(w.alt || []).filter(Boolean);
  const kern = [w.kern, w.fkern].filter(Boolean).concat((w.alt || []).map(a => a.replace(/^(le |la |les |l'|the |to )/i, "")));
  const R = w.w;
  if(sp === "en"){
    const ohneArt = s => s.replace(/^(the|to|a|an) /, "");
    const e = ohneArt(roh), el = lockern(e);
    const ziel = voll.concat(kern).map(x => ohneArt(grund(x)));
    if(ziel.includes(e)) return {art:"ok"};
    const zl = ziel.map(lockern);
    if(zl.includes(el) || zl.map(ohneApo).includes(ohneApo(el))) return {art:"ok", tipp:"Achte noch auf die Schreibweise: " + R};
    const gb = [el.replace(/or\b/g, "our"), el.replace(/er\b/g, "re"), el.replace(/iz/g, "is"), el.replace(/og\b/g, "ogue")];
    if(gb.some(x => x !== el && zl.includes(x))) return {art:"ok", tipp:"Das ist amerikanisch. Britisch schreibt man: " + R};
    if(ziel.some(z => z.length >= 4 && lev(lockern(z), el) <= (z.length >= 8 ? 2 : 1))) return {art:"fast"};
    return {art:"falsch"};
  }
  if(voll.map(grund).includes(roh)) return {art:"ok"};
  const ohneAkz = lockern(roh);
  if(voll.map(lockern).includes(ohneAkz) || voll.map(x => ohneApo(lockern(x))).includes(ohneApo(ohneAkz))){
    const fehlt = [...new Set([...R].filter(c => /[àâäéèêëîïôöùûüçœ]/.test(c)))].join(" ");
    return {art:"ok", tipp:"Achte noch auf " + (fehlt ? "die Akzente (" + fehlt + ")" : "die Schreibweise") + ": " + R};
  }
  if(kern.map(grund).includes(roh) || kern.map(lockern).includes(ohneAkz)){
    if(w.art) return {art:"ok", tipp:"Lerne das Wort mit Artikel: " + R};
    return {art:"ok"};
  }
  const m = roh.match(/^(le|la|les|l') ?(.+)$/);
  if(m && w.art && kern.map(lockern).includes(lockern(m[2]))) return {art:"fast", tipp:"Das Wort stimmt, aber der Artikel nicht. Richtig ist: " + R};
  const alle = voll.concat(kern).map(lockern);
  if(alle.some(z => z.length >= 4 && lev(z, ohneAkz) <= (z.length >= 9 ? 2 : 1))) return {art:"fast"};
  return {art:"falsch"};
}

/* ---------- Zustand ---------- */
const ST = { ansicht:"start", thema:null, modus:null, runde:null, box:null };
let tastenAn = false;

function neuZeichnen(){ if(ST.box && ST.box.isConnected) zeichne(); }
function geh(ansicht, extra){ Object.assign(ST, {ansicht}, extra || {}); A.ton("klick"); zeichne(); try{ window.scrollTo({top:0, behavior:"auto"}); }catch(e){} }

try{ const s = TTS(); if(s){ s.getVoices(); if(s.addEventListener) s.addEventListener("voiceschanged", () => { if(ST.ansicht === "start" || ST.ansicht === "thema") neuZeichnen(); }); } }catch(e){}

function zeichne(){
  const box = ST.box; if(!box || !box.isConnected) return;
  const e = einst();
  box.classList.add("spr");
  box.dataset.sp = e.sp;
  box.dataset.ansicht = ST.ansicht;
  if(!DATA[e.sp]){
    box.innerHTML = `<div class="spr-lade">Wörter werden geladen …</div>`;
    laden(e.sp).then(d => { if(d) zeichne(); else if(ST.box) ST.box.innerHTML = `<div class="spr-lade">Die Wortliste konnte nicht geladen werden. Bitte prüfe die Verbindung und lade die Seite neu.</div>`; });
    return;
  }
  if(ST.ansicht === "thema") return themaSeite(box, e);
  if(ST.ansicht === "spiel") return spielSeite(box, e);
  if(ST.ansicht === "ende") return endeSeite(box, e);
  if(ST.ansicht === "liste") return listeSeite(box, e);
  return startSeite(box, e);
}

/* ---------- Startseite ---------- */
function startSeite(box, e){
  const d = DATA[e.sp], fl = faelligIds(e.sp).filter(id => d.byId[id] && d.byId[id].l <= e.stufe).length;
  const info = stimmeInfo(e.sp);
  box.innerHTML = `
  <div class="x-kopf spr-kopf"><span class="x-kopf-emo" aria-hidden="true">🗣️</span><div><h1>Französisch &amp; Englisch</h1><p>Wörter lernen mit Bild, Ton und Spiel</p></div><img src="img/kids/duo-winken.webp" alt=""></div>
  <div class="spr-wahl" role="group" aria-label="Sprache wählen">
    ${Object.keys(SPRACHEN).map(k => `<button type="button" class="spr-sp spr-sp-${k}" data-sp="${k}" aria-pressed="${e.sp === k}"><span aria-hidden="true">${SPRACHEN[k].fahne}</span><b>${SPRACHEN[k].name}</b><small>${h(SPRACHEN[k].hallo)}</small></button>`).join("")}
  </div>
  <div class="spr-leiste">
    <button type="button" class="spr-wdh" data-wdh ${fl ? "" : "disabled"}><span aria-hidden="true">🔁</span><span><b>Wiederholen</b><small>${fl ? fl + (fl === 1 ? " Wort wartet" : " Wörter warten") + " auf dich" : "Heute ist alles wiederholt. Super!"}</small></span></button>
    <div class="spr-stufen" role="group" aria-label="Stufe">${STUFEN.map(s => `<button type="button" data-stufe="${s.id}" aria-pressed="${e.stufe === s.id}"><b>${s.name}</b><small>${s.text}</small></button>`).join("")}</div>
  </div>
  ${info.text ? `<p class="spr-hinweis" role="note">🔈 ${h(info.text)}</p>` : ""}
  <div class="spr-themen">${d.themen.map(t => { const st = themaStand(e.sp, t.id, e.stufe); if(!st.n) return "";
    return `<button type="button" class="spr-thema" data-thema="${h(t.id)}" style="background:${t.farbe}"><span class="spr-th-emo" aria-hidden="true">${t.emo}</span><b>${h(t.name)}</b><small>${st.n} Wörter${st.sicher ? " · " + st.sicher + " sicher" : ""}</small><span class="spr-balken" role="progressbar" aria-label="Fortschritt ${h(t.name)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${st.prozent}"><i style="width:${st.prozent}%"></i></span></button>`; }).join("")}</div>
  <p class="spr-fuss">Tipp: Jedes Wort wandert durch 5 Fächer. Was du sicher kannst, kommt seltener wieder.</p>`;
  box.querySelectorAll("[data-sp]").forEach(b => b.onclick = () => { einstSetzen("sp", b.dataset.sp); A.ton("klick"); zeichne(); });
  box.querySelectorAll("[data-stufe]").forEach(b => b.onclick = () => { einstSetzen("stufe", +b.dataset.stufe); A.ton("klick"); zeichne(); });
  box.querySelectorAll("[data-thema]").forEach(b => b.onclick = () => geh("thema", {thema:b.dataset.thema}));
  const w = box.querySelector("[data-wdh]"); if(w) w.onclick = () => { ST.thema = "_wdh"; starte("wahl"); };
}

/* ---------- Themenseite: Spielmodus wählen ---------- */
function themaSeite(box, e){
  const d = DATA[e.sp], t = d.themaById[ST.thema]; if(!t) return geh("start");
  const st = themaStand(e.sp, t.id, e.stufe), info = stimmeInfo(e.sp), spn = SPRACHEN[e.sp].name;
  box.innerHTML = `
  <div class="spr-top"><button type="button" class="spr-zur" data-zur aria-label="Zurück zu den Themen">‹ Themen</button><span class="spr-pille">${SPRACHEN[e.sp].fahne} ${spn}</span></div>
  <div class="spr-thkopf" style="background:${t.farbe}"><span class="spr-th-emo" aria-hidden="true">${t.emo}</span><div><h2>${h(t.name)}</h2><p>${st.n} Wörter · ${st.sicher} sicher</p><span class="spr-balken" role="progressbar" aria-label="Fortschritt" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${st.prozent}"><i style="width:${st.prozent}%"></i></span></div></div>
  <div class="spr-richtung" role="group" aria-label="Richtung für Auswahl">
    <button type="button" data-ri="de" aria-pressed="${e.richtung === "de"}">Deutsch → ${spn}</button>
    <button type="button" data-ri="fremd" aria-pressed="${e.richtung === "fremd"}">${spn} → Deutsch</button>
  </div>
  <div class="spr-modi">${MODI.map(m => { const aus = m.id === "hoeren" && !info.an;
    return `<button type="button" class="spr-modus spr-m-${m.id}" data-modus="${m.id}" ${aus ? "disabled" : ""}><span aria-hidden="true">${m.emo}</span><b>${m.name}</b><small>${aus ? "Braucht Vorlesen" : m.text}</small></button>`; }).join("")}</div>
  ${info.text ? `<p class="spr-hinweis" role="note">🔈 ${h(info.text)}</p>` : ""}`;
  box.querySelector("[data-zur]").onclick = () => geh("start");
  box.querySelectorAll("[data-ri]").forEach(b => b.onclick = () => { einstSetzen("richtung", b.dataset.ri); A.ton("klick"); zeichne(); });
  box.querySelectorAll("[data-modus]").forEach(b => b.onclick = () => { if(b.dataset.modus === "liste") geh("liste"); else starte(b.dataset.modus); });
}

/* ---------- Wörterliste ---------- */
function listeSeite(box, e){
  const d = DATA[e.sp], t = d.themaById[ST.thema]; if(!t) return geh("start");
  const b = boxen(e.sp);
  const ws = d.woerter.filter(w => w.t === t.id && w.l <= e.stufe);
  box.innerHTML = `
  <div class="spr-top"><button type="button" class="spr-zur" data-zur aria-label="Zurück zum Thema">‹ ${h(t.name)}</button><span class="spr-pille">${ws.length} Wörter</span></div>
  <ul class="spr-liste">${ws.map(w => { const f = fach(b, w.id);
    return `<li style="background:${t.farbe}">${bild(w, "klein")}<span class="spr-li-txt"><b>${h(anzeige(w))}</b><small>${h(w.de)}${w.dh ? " (" + h(w.dh) + ")" : ""}${w.pl ? " · Mehrzahl: " + h(w.pl) : ""}</small>${w.h ? `<small class="spr-li-h">💡 ${h(w.h)}</small>` : ""}</span><span class="spr-fach" title="Fach ${f} von 5" aria-label="Fach ${f} von 5">${"●".repeat(f)}${"○".repeat(5 - f)}</span><button type="button" class="spr-laut" data-laut="${h(w.id)}" aria-label="${h(w.w)} anhören">🔊</button></li>`; }).join("")}</ul>`;
  box.querySelector("[data-zur]").onclick = () => geh("thema");
  box.querySelectorAll("[data-laut]").forEach(x => x.onclick = () => { const w = d.byId[x.dataset.laut]; sprich(anzeige(w), e.sp); });
}

/* ---------- Runde vorbereiten ---------- */
function pool(e){
  const d = DATA[e.sp];
  if(ST.thema === "_wdh"){ const f = new Set(faelligIds(e.sp)); return d.woerter.filter(w => f.has(w.id) && w.l <= e.stufe); }
  return d.woerter.filter(w => w.t === ST.thema && w.l <= e.stufe);
}
function auswahl(ws, n, sp){   // zuerst fällige, dann neue, dann die mit tiefem Fach
  const b = boxen(sp), t = tagNr();
  const prio = w => { const x = b[w.id]; if(!x || !x[0]) return 1; if(x[1] <= t) return 0; return 2 + x[0]; };
  return mische(ws).sort((a, c) => prio(a) - prio(c)).slice(0, n);
}
function ablenker(w, n, e, modus){
  const d = DATA[e.sp]; const fw = formen(w);
  const passt = x => {
    if(x.id === w.id) return false;
    if(bildKey(x) === bildKey(w)) return false;
    if(x.de.toLowerCase() === w.de.toLowerCase()) return false;
    for(const f of formen(x)) if(fw.has(f)) return false;
    return true;
  };
  let kand = mische(d.woerter.filter(x => x.t === w.t && passt(x)));
  const nah = kand.filter(x => Math.abs(x.l - w.l) <= 1);
  kand = nah.concat(kand.filter(x => !nah.includes(x)));
  if(kand.length < n) kand = kand.concat(mische(d.woerter.filter(x => x.t !== w.t && passt(x))));
  const out = [], bilder = new Set([bildKey(w)]), texte = new Set([w.w.toLowerCase(), w.de.toLowerCase()]);
  for(const x of kand){
    if(out.length >= n) break;
    if(bilder.has(bildKey(x)) && modus === "hoeren") continue;
    if(texte.has(x.w.toLowerCase()) || texte.has(x.de.toLowerCase())) continue;
    out.push(x); bilder.add(bildKey(x)); texte.add(x.w.toLowerCase()); texte.add(x.de.toLowerCase());
  }
  return out;
}

function starte(modus){
  const e = einst(); const ws = pool(e);
  if(!ws.length){ A.toast(ST.thema === "_wdh" ? "Heute ist nichts mehr zu wiederholen. Super!" : "Für diese Stufe gibt es hier noch keine Wörter."); return; }
  if(modus === "hoeren" && !TTS()){ A.toast("Dieses Gerät kann leider nicht vorlesen."); return; }
  const R = { modus, sp:e.sp, i:0, richtig:0, total:0, xp:0, fehler:[], erledigt:new Set() };
  if(modus === "memory"){
    const paare = innerWidth < 600 ? 6 : 8;
    const wahl = auswahl(ws, paare * 2, e.sp), gesehen = new Set(), liste = [];
    for(const w of wahl){ const k = lockern(w.w); if(gesehen.has(k) || gesehen.has(bildKey(w))) continue; gesehen.add(k); gesehen.add(bildKey(w)); liste.push(w); if(liste.length >= paare) break; }
    if(liste.length < 3){ A.toast("Für Memory braucht es mindestens 3 Wörter."); return; }
    R.woerter = liste;
    R.karten = mische(liste.flatMap(w => [{id:w.id, seite:"fremd"}, {id:w.id, seite:"bild"}]));
    R.offen = []; R.gefunden = new Set(); R.zuege = 0;
  } else {
    R.liste = auswahl(ws, RUNDE, e.sp);
    R.total = R.liste.length;
  }
  ST.runde = R; ST.modus = modus;
  geh("spiel");
}

/* ---------- Spielseite ---------- */
function kopfzeile(e, R){
  const d = DATA[e.sp], t = d.themaById[ST.thema];
  const name = ST.thema === "_wdh" ? "Wiederholen" : (t ? t.name : "");
  const m = MODI.find(x => x.id === R.modus);
  const mem = R.modus === "memory";
  const fort = mem ? `${R.gefunden.size} / ${R.woerter.length} Paare` : `${Math.min(R.i + 1, R.liste.length)} / ${R.liste.length}`;
  const pz = mem ? R.gefunden.size / R.woerter.length : R.i / R.liste.length;
  return `<div class="spr-bar"><button type="button" class="spr-x" data-ende aria-label="Spiel beenden">✕</button><span class="spr-pille spr-bar-t">${m ? m.emo : ""} ${h(name)}</span><span class="spr-pille spr-bar-n" aria-live="polite">${fort}</span></div>
  <div class="spr-fort" aria-hidden="true"><i style="width:${Math.round(pz * 100)}%"></i></div>`;
}
function farbe(e, w){ const t = DATA[e.sp].themaById[w ? w.t : ST.thema]; return t ? t.farbe : "linear-gradient(135deg,#5B4BF5,#9B4DE0)"; }

function spielSeite(box, e){
  const R = ST.runde; if(!R) return geh("start");
  if(R.modus === "memory") return memorySeite(box, e, R);
  const w = R.liste[R.i];
  if(!w) return beenden();
  R.antwort = null;
  const kopf = kopfzeile(e, R);
  if(R.modus === "karten") return kartenSeite(box, e, R, w, kopf);
  if(R.modus === "schreiben") return schreibSeite(box, e, R, w, kopf);
  return wahlSeite(box, e, R, w, kopf);
}
function bindeKopf(box){
  const x = box.querySelector("[data-ende]"); if(!x) return;
  x.onclick = () => {
    try{ const s = TTS(); if(s) s.cancel(); }catch(e){}
    const R = ST.runde;
    const etwas = R && (R.modus === "memory" ? R.gefunden.size > 0 : R.erledigt.size > 0);
    if(etwas) beenden(true); else { ST.runde = null; geh(ST.thema === "_wdh" ? "start" : "thema"); }
  };
}

/* Auswahl und Hören */
function wahlSeite(box, e, R, w, kopf){
  const hoeren = R.modus === "hoeren", fremd = !hoeren && e.richtung === "fremd";
  const opts = mische([w].concat(ablenker(w, 3, e, R.modus)));
  R.opts = opts;
  let frage;
  if(hoeren) frage = `<div class="spr-frage spr-frage-hoer" style="background:${farbe(e, w)}"><p class="spr-auf">Was hörst du? Tippe das passende Bild an.</p><button type="button" class="spr-gross-laut" data-laut aria-label="Wort nochmals anhören">🔊</button><button type="button" class="spr-langsam" data-langsam>🐢 langsam</button></div>`;
  else if(fremd) frage = `<div class="spr-frage" style="background:${farbe(e, w)}"><p class="spr-auf">Was heisst das auf Deutsch?</p><b class="spr-fwort">${h(anzeige(w))}</b><button type="button" class="spr-laut spr-laut-w" data-laut aria-label="Anhören">🔊</button></div>`;
  else frage = `<div class="spr-frage" style="background:${farbe(e, w)}">${bild(w, "gross")}<b class="spr-dwort">${h(w.de)}</b>${w.dh ? `<small class="spr-dh">${h(w.dh)}</small>` : ""}<p class="spr-auf">Wie heisst das auf ${SPRACHEN[e.sp].name}?</p></div>`;
  const opt = (x, i) => {
    let inhalt, label;
    if(hoeren){ inhalt = `${bild(x, "mittel")}<small>${h(x.de)}</small>`; label = x.de; }
    else if(fremd){ inhalt = `<span class="spr-o-txt">${h(x.de)}</span>`; label = x.de; }
    else { inhalt = `<span class="spr-o-txt">${h(anzeige(x))}</span>`; label = anzeige(x); }
    return `<button type="button" class="spr-opt${hoeren ? " spr-opt-bild" : ""}" data-o="${i}" aria-label="${i + 1}: ${h(label)}"><i class="spr-nr" aria-hidden="true">${i + 1}</i>${inhalt}</button>`;
  };
  box.innerHTML = `<div class="spr-spiel">${kopf}${frage}<div class="spr-opts${hoeren ? " bilder" : ""}">${opts.map(opt).join("")}</div><div class="spr-rueck" aria-live="polite"></div></div>`;
  bindeKopf(box);
  box.querySelectorAll("[data-laut]").forEach(b => b.onclick = () => sprich(anzeige(w), e.sp));
  const ls = box.querySelector("[data-langsam]"); if(ls) ls.onclick = () => sprich(anzeige(w), e.sp, true);
  box.querySelectorAll("[data-o]").forEach(b => b.onclick = () => waehle(+b.dataset.o));
  if(hoeren || fremd) setTimeout(() => { if(ST.runde === R && R.liste[R.i] === w && R.antwort == null) sprich(anzeige(w), e.sp); }, 250);
}
function waehle(i){
  const R = ST.runde, e = einst(); if(!R || R.antwort != null || !R.opts) return;
  const w = R.liste[R.i], x = R.opts[i]; if(!x) return;
  R.antwort = i;
  const ok = x.id === w.id;
  ST.box.querySelectorAll("[data-o]").forEach(b => { const o = R.opts[+b.dataset.o]; b.disabled = true;
    if(o.id === w.id) b.classList.add("ist-richtig"); else if(+b.dataset.o === i) b.classList.add("ist-falsch"); else b.classList.add("ist-aus"); });
  ergebnis(ok ? "ok" : "falsch", w, ok ? null : `Richtig ist: ${anzeige(w)} = ${w.de}`);
  const i0 = R.i; setTimeout(() => { if(ST.runde === R && R.i === i0) sprich(anzeige(w), e.sp); }, 120);
}

/* Karteikarten */
function kartenSeite(box, e, R, w, kopf){
  box.innerHTML = `<div class="spr-spiel">${kopf}
  <div class="spr-karte-wrap"><button type="button" class="spr-karte" data-dreh aria-label="Karte umdrehen: ${h(w.de)}">
    <span class="spr-k-vorne" style="background:${farbe(e, w)}">${bild(w, "gross")}<b class="spr-dwort">${h(w.de)}</b>${w.dh ? `<small class="spr-dh">${h(w.dh)}</small>` : ""}<small class="spr-k-tipp">Tippe zum Umdrehen</small></span>
    <span class="spr-k-hinten" style="background:${farbe(e, w)}">${bild(w, "mittel")}<b class="spr-fwort">${h(anzeige(w))}</b>${w.pl ? `<small>Mehrzahl: ${h(w.pl)}</small>` : ""}${w.h ? `<small class="spr-k-h">💡 ${h(w.h)}</small>` : ""}${w.bsp ? `<span class="spr-bsp"><i>${h(w.bsp)}</i><small>${h(w.bde)}</small></span>` : ""}</span>
  </button></div>
  <div class="spr-k-knoepfe"><button type="button" class="spr-knopf spr-hell" data-laut>🔊 Anhören</button><button type="button" class="spr-knopf" data-dreh2>🔄 Umdrehen</button></div>
  <div class="spr-rueck" aria-live="polite"></div></div>`;
  bindeKopf(box);
  const k = box.querySelector(".spr-karte");
  const dreh = () => {
    k.classList.toggle("um"); A.ton("wisch");
    const um = k.classList.contains("um");
    k.setAttribute("aria-label", um ? "Karte umdrehen: " + anzeige(w) : "Karte umdrehen: " + w.de);
    if(um){ sprich(anzeige(w), e.sp); zeigeSelbst(); }
  };
  k.onclick = dreh;
  box.querySelector("[data-dreh2]").onclick = dreh;
  box.querySelector("[data-laut]").onclick = () => sprich(anzeige(w), e.sp);
  function zeigeSelbst(){
    const r = box.querySelector(".spr-rueck"); if(r.dataset.an) return; r.dataset.an = "1";
    r.innerHTML = `<div class="spr-selbst"><button type="button" class="spr-knopf spr-nochmal" data-s="nein">🔁 Nochmal üben</button><button type="button" class="spr-knopf spr-gewusst" data-s="ja">✅ Gewusst</button></div>`;
    r.querySelectorAll("[data-s]").forEach(b => b.onclick = () => {
      const ok = b.dataset.s === "ja";
      if(!R.erledigt.has(w.id)){ buchen(e.sp, w.id, ok ? "ok" : "falsch"); R.erledigt.add(w.id); if(ok){ R.richtig++; R.xp += 1; } else R.fehler.push(w.id); }
      A.ton(ok ? "richtig" : "klick");
      weiter();
    });
  }
}

/* Schreiben */
function schreibSeite(box, e, R, w, kopf){
  R.tipp = 0;
  const tasten = AKZENTE[e.sp] || [];
  box.innerHTML = `<div class="spr-spiel">${kopf}
  <div class="spr-frage spr-frage-schreib" style="background:${farbe(e, w)}">${bild(w, "mittel")}<span><b class="spr-dwort">${h(w.de)}</b>${w.dh ? `<small class="spr-dh">${h(w.dh)}</small>` : ""}<small class="spr-auf">${e.sp === "fr" ? (w.art ? "Schreib das Wort mit Artikel (le, la, l', les)." : "Schreib das Wort auf Französisch.") : "Schreib das englische Wort."}</small></span></div>
  <form class="spr-form" autocomplete="off" novalidate>
    <label class="spr-sr" for="spr-ein">Deine Antwort auf ${SPRACHEN[e.sp].name}</label>
    <input id="spr-ein" class="spr-ein" type="text" autocapitalize="off" autocorrect="off" spellcheck="false" lang="${e.sp}" placeholder="${e.sp === "fr" ? "z. B. le chien" : "z. B. dog"}">
    ${tasten.length > 1 ? `<div class="spr-akz" role="group" aria-label="Sonderzeichen">${tasten.map(t => `<button type="button" data-akz="${h(t)}" aria-label="${h(t)} einfügen">${h(t)}</button>`).join("")}</div>` : ""}
    <div class="spr-s-knoepfe"><button type="button" class="spr-knopf spr-hell" data-tipp>💡 Tipp</button><button type="submit" class="spr-knopf spr-pruef">Prüfen</button></div>
  </form>
  <div class="spr-rueck" aria-live="polite"></div></div>`;
  bindeKopf(box);
  const ein = box.querySelector(".spr-ein");
  box.querySelectorAll("[data-akz]").forEach(b => {
    b.onmousedown = ev => ev.preventDefault();
    b.onclick = () => { if(ein.readOnly) return; const s = ein.selectionStart ?? ein.value.length, en = ein.selectionEnd ?? ein.value.length; ein.value = ein.value.slice(0, s) + b.dataset.akz + ein.value.slice(en); const p = s + b.dataset.akz.length; ein.focus(); try{ ein.setSelectionRange(p, p); }catch(x){} };
  });
  box.querySelector("[data-tipp]").onclick = () => {
    R.tipp = Math.min(R.tipp + 1, 3);
    const z = w.w; const n = Math.min(z.length, (w.art && w.art !== "to" ? w.art.length + (w.art.endsWith("'") ? 0 : 1) : 0) + R.tipp);
    const r = box.querySelector(".spr-rueck");
    r.innerHTML = `<p class="spr-tipp">💡 ${h(z.slice(0, n))}${[...z.slice(n)].map(c => /[\s'\-]/.test(c) ? c : "_").join("")} <small>(${[...(w.kern || z)].filter(c => /[^\s'\-]/.test(c)).length} Buchstaben)</small></p>`;
    if(R.tipp === 1) sprich(anzeige(w), e.sp);
  };
  box.querySelector(".spr-form").onsubmit = ev => {
    ev.preventDefault(); if(R.antwort != null) return;
    const p = pruefe(ein.value, w, e.sp);
    if(p.art === "leer"){ ein.focus(); return; }
    R.antwort = 1; ein.readOnly = true;
    box.querySelectorAll(".spr-akz button, [data-tipp], .spr-pruef").forEach(b => b.disabled = true);
    ein.classList.add(p.art === "ok" ? "ist-richtig" : "ist-falsch");
    if(p.art === "ok") ergebnis("ok", w, p.tipp || null);
    else if(p.art === "fast") ergebnis("fast", w, p.tipp || `Richtig ist: ${anzeige(w)}`);
    else ergebnis("falsch", w, `Richtig ist: ${anzeige(w)}`);
    sprich(anzeige(w), e.sp);
  };
  if(!istTouch()) setTimeout(() => { try{ ein.focus({preventScroll:true}); }catch(x){} }, 60);
}

/* Rückmeldung nach einer Antwort (Auswahl, Hören, Schreiben) */
const LOB = ["Super!", "Richtig!", "Genau!", "Toll gemacht!", "Bravo!", "Stimmt!"];
function ergebnis(art, w, text){
  const R = ST.runde, e = einst(); const erstes = !R.erledigt.has(w.id);
  if(erstes){ buchen(e.sp, w.id, art); R.erledigt.add(w.id); }
  if(art === "ok"){ if(erstes){ R.richtig++; R.xp += 2; } A.ton("richtig"); }
  else { A.ton("falsch"); if(erstes){ R.fehler.push(w.id); R.liste.push(w); } }
  const r = ST.box.querySelector(".spr-rueck");
  const kopf = art === "ok" ? LOB[Math.floor(Math.random() * LOB.length)] : art === "fast" ? "Fast!" : "Nicht ganz.";
  r.innerHTML = `<div class="spr-meld ${art === "ok" ? "gut" : "naja"}"><span><b>${kopf}</b>${text ? " " + h(text) : ""}${art !== "ok" && erstes ? `<small>Das Wort kommt am Schluss nochmals.</small>` : ""}</span><button type="button" class="spr-knopf spr-weiter" data-weiter>Weiter ›</button></div>`;
  const b = r.querySelector("[data-weiter]"); b.onclick = weiter; try{ b.focus({preventScroll:true}); }catch(x){}
}
function weiter(){
  const R = ST.runde; if(!R) return;
  R.i++;
  if(R.i >= R.liste.length) return beenden();
  zeichne();
}

/* Memory: Fremdwort-Karte und Bild-Karte bilden ein Paar */
function memorySeite(box, e, R){
  const d = DATA[e.sp];
  const karte = (k, i) => { const w = d.byId[k.id]; const gef = R.gefunden.has(k.id), auf = gef || R.offen.includes(i);
    const inhalt = k.seite === "fremd" ? `<span class="spr-mk-fremd">${h(anzeige(w))}</span>` : `${bild(w, "klein")}<small>${h(w.de)}</small>`;
    return `<button type="button" class="spr-mk${auf ? " auf" : ""}${gef ? " gefunden" : ""}" data-mk="${i}" aria-label="${auf ? h(k.seite === "fremd" ? w.w : w.de) : "Verdeckte Karte " + (i + 1)}" ${gef ? "disabled" : ""}><span class="spr-mk-rueck" aria-hidden="true">${SPRACHEN[e.sp].kurz}</span><span class="spr-mk-vorne" style="background:${farbe(e, w)}">${inhalt}</span></button>`; };
  box.innerHTML = `<div class="spr-spiel">${kopfzeile(e, R)}<p class="spr-pille spr-mem-auf">Finde zu jedem Wort das passende Bild. Züge: <b data-zuege>${R.zuege}</b></p><div class="spr-memory n${R.karten.length}">${R.karten.map(karte).join("")}</div></div>`;
  bindeKopf(box);
  box.querySelectorAll("[data-mk]").forEach(b => b.onclick = () => memKlick(+b.dataset.mk));
}
function memKlick(i){
  const R = ST.runde, e = einst(); if(!R || R.sperre) return;
  const k = R.karten[i]; if(!k || R.gefunden.has(k.id) || R.offen.includes(i)) return;
  const d = DATA[e.sp], w = d.byId[k.id];
  R.offen.push(i); A.ton("wisch");
  const el = ST.box.querySelector(`[data-mk="${i}"]`); if(el){ el.classList.add("auf"); el.setAttribute("aria-label", k.seite === "fremd" ? w.w : w.de); }
  if(k.seite === "fremd") sprich(anzeige(w), e.sp);
  if(R.offen.length < 2) return;
  R.zuege++; const z = ST.box.querySelector("[data-zuege]"); if(z) z.textContent = R.zuege;
  const [a, b] = R.offen.map(j => R.karten[j]);
  R.sperre = true;
  if(a.id === b.id){
    R.gefunden.add(a.id); R.richtig++; R.xp += 2; A.ton("richtig");
    if(!R.erledigt.has(a.id)){ buchen(e.sp, a.id, "ok"); R.erledigt.add(a.id); }
    setTimeout(() => { if(ST.runde !== R) return; R.offen = []; R.sperre = false; sprich(anzeige(d.byId[a.id]), e.sp);
      if(R.gefunden.size >= R.woerter.length) setTimeout(() => { if(ST.runde === R) beenden(); }, 700); else zeichne(); }, 420);
  } else {
    setTimeout(() => { if(ST.runde !== R) return; R.offen = []; R.sperre = false; zeichne(); }, 1100);
  }
}

/* Ende */
function beenden(abbruch){
  const R = ST.runde; if(!R) return geh("start");
  try{ const s = TTS(); if(s) s.cancel(); }catch(x){}
  const n = R.modus === "memory" ? R.woerter.length : R.total;
  if(!R.xpGebucht){ R.xpGebucht = true; let x = R.xp; if(!abbruch && n >= 5) x += 5; R.xpBekommen = xpGeben(x); }
  R.abbruch = !!abbruch;
  geh("ende");
  if(!abbruch){ A.ton(R.richtig >= n * 0.8 ? "fanfare" : "xp"); if(R.richtig === n && n >= 5 && !A.ruhig()) A.konfetti(); }
}
function endeSeite(box, e){
  const R = ST.runde; if(!R) return geh("start");
  const d = DATA[e.sp];
  const mem = R.modus === "memory";
  const n = mem ? R.woerter.length : R.total;
  const q = n ? R.richtig / n : 0;
  const sterne = q >= 0.9 ? 3 : q >= 0.6 ? 2 : q > 0 ? 1 : 0;
  const titel = mem ? (R.gefunden.size >= R.woerter.length ? `Alle ${n} Paare gefunden!` : `${R.gefunden.size} von ${n} Paaren gefunden`) : `${R.richtig} von ${n} auf Anhieb gewusst`;
  const satz = q >= 0.9 ? "Wow, das sitzt!" : q >= 0.6 ? "Gut gemacht, weiter so!" : "Jedes Mal üben hilft. Du schaffst das!";
  const img = q >= 0.6 ? "img/kids/duo-jubel.webp" : "img/kids/duo-bereit.webp";
  const fehl = [...new Set(R.fehler)].map(id => d.byId[id]).filter(Boolean);
  box.innerHTML = `<div class="spr-ende" style="background:${farbe(e, null)}">
    <img src="${img}" alt="" class="spr-ende-img">
    <div class="spr-ende-txt"><p class="spr-sterne" aria-label="${sterne} von 3 Sternen">${"★".repeat(sterne)}${"☆".repeat(3 - sterne)}</p><h2>${h(titel)}</h2><p>${satz}${mem ? ` Züge: ${R.zuege}.` : ""}</p>${R.xpBekommen ? `<p class="spr-xp">+${R.xpBekommen} XP</p>` : ""}</div>
  </div>
  ${fehl.length ? `<div class="spr-fehlerliste"><b>Diese Wörter üben wir bald nochmals:</b><ul>${fehl.map(w => `<li>${bild(w, "mini")}<span>${h(anzeige(w))}</span><small>${h(w.de)}</small><button type="button" class="spr-laut" data-laut="${h(w.id)}" aria-label="${h(w.w)} anhören">🔊</button></li>`).join("")}</ul></div>` : ""}
  <div class="spr-ende-knoepfe"><button type="button" class="spr-knopf spr-gross" data-nochmal>🔁 Nochmal spielen</button><button type="button" class="spr-knopf spr-hell" data-andere>${ST.thema === "_wdh" ? "Zu den Themen" : "Anderes Spiel"}</button></div>`;
  box.querySelector("[data-nochmal]").onclick = () => starte(R.modus);
  box.querySelector("[data-andere]").onclick = () => { ST.runde = null; geh(ST.thema === "_wdh" ? "start" : "thema"); };
  box.querySelectorAll("[data-laut]").forEach(b => b.onclick = () => sprich(anzeige(d.byId[b.dataset.laut]), e.sp));
}

/* ---------- Tastatur: 1 bis 4 wählen, Leertaste dreht die Karte ---------- */
function tasten(ev){
  if(!ST.box || !ST.box.isConnected || ST.ansicht !== "spiel" || !ST.runde) return;
  if(ev.altKey || ev.ctrlKey || ev.metaKey) return;
  const tag = (ev.target && ev.target.tagName) || "";
  if(tag === "INPUT" || tag === "TEXTAREA") return;
  const R = ST.runde;
  if((R.modus === "wahl" || R.modus === "hoeren") && /^[1-4]$/.test(ev.key) && R.antwort == null){ ev.preventDefault(); waehle(+ev.key - 1); return; }
  if(R.modus === "karten" && ev.key === " " && tag !== "BUTTON"){ ev.preventDefault(); const k = ST.box.querySelector("[data-dreh]"); if(k) k.click(); }
}

/* ---------- Stand für andere Welten ---------- */
function stand(){
  const out = {};
  Object.keys(SPRACHEN).forEach(sp => {
    if(!DATA[sp]) laden(sp);
    const b = boxen(sp), ids = Object.keys(b), d = DATA[sp];
    const o = {sprache:SPRACHEN[sp].name, geladen:!!d, woerter:d ? d.woerter.length : null, gesehen:ids.filter(id => b[id][0] > 0).length,
      sicher:ids.filter(id => b[id][0] >= 3).length, gemeistert:ids.filter(id => b[id][0] >= 5).length, faellig:faelligIds(sp).length, faecher:[0, 0, 0, 0, 0]};
    ids.forEach(id => { const f = b[id][0]; if(f >= 1 && f <= 5) o.faecher[f - 1]++; });
    if(d){ o.themen = {}; d.themen.forEach(t => { o.themen[t.id] = Object.assign({name:t.name}, themaStand(sp, t.id, 3)); }); }
    out[sp] = o;
  });
  return out;
}

/* ---------- Stil ---------- */
const css = document.createElement("style"); css.id = "ep-x-sprachen";
css.textContent = `
.spr{--spr-glas:rgba(15,20,48,.6);--spr-r:22px;color:#fff}
.spr button{font:inherit;cursor:pointer}
.spr button:focus-visible,.spr input:focus-visible{outline:3px solid #FFE34D;outline-offset:3px}
.spr button:disabled{cursor:default}
.spr-lade{background:var(--spr-glas);color:#fff;padding:14px 18px;border-radius:18px;margin:12px 0;font-weight:700}
.spr-kopf{background:linear-gradient(135deg,#1E5BB8,#5B4BF5 55%,#C2185B)}
.spr-pille,.spr-hinweis,.spr-fuss{background:var(--spr-glas);color:#fff;border-radius:999px;padding:6px 12px;font-weight:700;font-size:.9rem}
.spr-hinweis,.spr-fuss{border-radius:16px;font-weight:600;line-height:1.35;margin:12px 0}
.spr-fuss{font-size:.82rem}
.spr-wahl{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
.spr-sp{display:flex;flex-direction:column;align-items:flex-start;gap:2px;border:0;border-radius:var(--spr-r);padding:14px 16px;color:#fff;box-shadow:0 10px 22px rgba(27,34,64,.22);text-align:left;filter:saturate(.55) brightness(.92);transition:transform .15s,filter .15s}
.spr-sp span{font-size:1.6rem;line-height:1}
.spr-sp b{font-size:1.15rem;color:#fff}.spr-sp small{color:#fff;opacity:.95}
.spr-sp-fr{background:linear-gradient(135deg,#1F3FA8,#3D6BE0 60%,#D6324A)}
.spr-sp-en{background:linear-gradient(135deg,#0E2A6B,#2D4FB0 60%,#C8102E)}
.spr-sp[aria-pressed="true"]{filter:none;box-shadow:0 0 0 3px #fff,0 12px 26px rgba(27,34,64,.3);transform:translateY(-1px)}
.spr-leiste{display:grid;grid-template-columns:1.2fr 1fr;gap:12px;margin-bottom:12px}
.spr-wdh{display:flex;align-items:center;gap:12px;border:0;border-radius:var(--spr-r);padding:12px 16px;color:#fff;text-align:left;background:linear-gradient(135deg,#0B6E6A,#0FA968);box-shadow:0 10px 22px rgba(27,34,64,.22)}
.spr-wdh>span:first-child{font-size:1.7rem}
.spr-wdh b{display:block;font-size:1.08rem;color:#fff}.spr-wdh small{color:#fff;opacity:.95}
.spr-wdh:disabled{background:linear-gradient(135deg,#3E5A70,#58798F)}
.spr-stufen,.spr-richtung{display:flex;gap:6px;background:var(--spr-glas);padding:6px;border-radius:var(--spr-r)}
.spr-stufen button,.spr-richtung button{flex:1;border:0;border-radius:16px;background:transparent;color:#fff;padding:7px 6px;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.15}
.spr-stufen small{font-size:.7rem;opacity:.9;color:inherit}
.spr-stufen button[aria-pressed="true"],.spr-richtung button[aria-pressed="true"]{background:#fff;color:#1B2240}
.spr-themen{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px}
.spr-thema{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:3px;border:0;border-radius:var(--spr-r);padding:14px 14px 12px;min-height:118px;color:#fff;text-align:left;box-shadow:0 10px 22px rgba(27,34,64,.22);transition:transform .15s}
.spr-thema:hover{transform:translateY(-2px)}
.spr-th-emo{font-size:1.9rem;line-height:1}
.spr-thema b{font-size:1.02rem;color:#fff;line-height:1.2}.spr-thema small{color:#fff;opacity:.95;font-size:.8rem}
.spr-balken{display:block;width:100%;height:8px;border-radius:99px;background:rgba(255,255,255,.3);overflow:hidden;margin-top:auto}
.spr-balken i{display:block;height:100%;background:#fff;border-radius:99px}
.spr-top,.spr-bar{display:flex;align-items:center;gap:8px;margin:2px 0 10px}
.spr-zur,.spr-x{border:0;background:var(--spr-glas);color:#fff;border-radius:999px;padding:8px 14px;font-weight:800;max-width:70%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.spr-x{width:40px;height:40px;padding:0;font-size:1.1rem;flex:none}
.spr-top .spr-pille{margin-left:auto;white-space:nowrap}
.spr-bar-t{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.spr-bar-n{flex:none}
.spr-fort{height:6px;border-radius:99px;background:rgba(15,20,48,.35);overflow:hidden;margin:-4px 0 10px}
.spr-fort i{display:block;height:100%;background:linear-gradient(90deg,#FFE34D,#7CF2B0);border-radius:99px;transition:width .3s}
.spr-thkopf{display:flex;align-items:center;gap:14px;border-radius:26px;padding:16px 18px;box-shadow:0 12px 26px rgba(27,34,64,.25);margin-bottom:12px}
.spr-thkopf .spr-th-emo{font-size:2.6rem}
.spr-thkopf>div{flex:1;min-width:0}
.spr-thkopf h2{margin:0;color:#fff;font-size:1.4rem}.spr-thkopf p{margin:2px 0 8px;color:#fff;opacity:.95}
.spr-richtung{margin-bottom:12px}
.spr-richtung button{font-weight:700;font-size:.88rem}
.spr-modi{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.spr-modus{display:flex;flex-direction:column;align-items:flex-start;gap:3px;border:0;border-radius:var(--spr-r);padding:14px;min-height:104px;color:#fff;text-align:left;box-shadow:0 10px 22px rgba(27,34,64,.22)}
.spr-modus span{font-size:1.8rem;line-height:1}.spr-modus b{color:#fff;font-size:1.05rem}.spr-modus small{color:#fff;opacity:.95;font-size:.8rem}
.spr-modus:disabled{opacity:.55}
.spr-m-karten{background:linear-gradient(135deg,#5B4BF5,#9B4DE0)}
.spr-m-wahl{background:linear-gradient(135deg,#1E5BB8,#2FA4E7)}
.spr-m-hoeren{background:linear-gradient(135deg,#0B6E6A,#16A89E)}
.spr-m-schreiben{background:linear-gradient(135deg,#C2185B,#E8541E)}
.spr-m-memory{background:linear-gradient(135deg,#D84A10,#E8951E)}
.spr-m-liste{background:linear-gradient(135deg,#37474F,#607D8B)}
.spr-emo{display:inline-block;line-height:1.1;font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif}
.spr-emo.gross{font-size:4.2rem}.spr-emo.mittel{font-size:2.6rem}.spr-emo.klein{font-size:1.7rem}.spr-emo.mini{font-size:1.25rem}
.spr-fb{display:inline-block;flex:none;border-radius:50%;border:4px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,.25)}
.spr-fb.gross{width:76px;height:76px}.spr-fb.mittel{width:50px;height:50px}.spr-fb.klein{width:32px;height:32px;border-width:3px}.spr-fb.mini{width:22px;height:22px;border-width:2px}
.spr-txt{display:inline-flex;flex:none;align-items:center;justify-content:center;background:#fff;color:#1B2240;font-weight:900;border-radius:16px;box-shadow:0 4px 12px rgba(0,0,0,.2);letter-spacing:-.02em;box-sizing:border-box}
.spr-txt.gross{font-size:2.6rem;min-width:92px;height:76px;padding:0 12px}.spr-txt.mittel{font-size:1.5rem;min-width:56px;height:48px;padding:0 8px}.spr-txt.klein{font-size:1rem;min-width:40px;height:32px;padding:0 6px;border-radius:10px}.spr-txt.mini{font-size:.8rem;min-width:30px;height:24px;padding:0 4px;border-radius:8px}
.spr-spiel{max-width:640px;margin:0 auto}
.spr-frage{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:4px;border-radius:26px;padding:16px 16px 14px;min-height:176px;box-shadow:0 12px 26px rgba(27,34,64,.25);color:#fff;box-sizing:border-box}
.spr-dwort{font-size:1.55rem;color:#fff;line-height:1.15}
.spr-fwort{font-size:1.7rem;color:#fff;line-height:1.15;overflow-wrap:anywhere}
.spr-dh{color:#fff;opacity:.92;font-size:.85rem}
.spr-auf{margin:4px 0 0;color:#fff;opacity:.95;font-weight:600;font-size:.92rem}
.spr-laut{border:0;background:rgba(255,255,255,.22);color:#fff;border-radius:999px;width:42px;height:42px;font-size:1.2rem;flex:none}
.spr-laut-w{margin-top:6px}
.spr-gross-laut{border:0;background:#fff;color:#1B2240;border-radius:50%;width:86px;height:86px;font-size:2.4rem;box-shadow:0 8px 20px rgba(0,0,0,.25);margin-top:6px}
.spr-langsam{border:0;background:rgba(255,255,255,.22);color:#fff;border-radius:999px;padding:6px 14px;font-weight:700;margin-top:6px}
.spr-opts{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}
.spr-opt{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-height:66px;border:0;border-radius:20px;padding:10px 12px 10px 24px;background:rgba(20,28,70,.8);color:#fff;font-weight:800;font-size:1.05rem;line-height:1.2;box-shadow:0 8px 18px rgba(27,34,64,.22);transition:transform .12s,background .2s}
.spr-opt:hover:not(:disabled){transform:translateY(-1px);background:rgba(30,40,95,.88)}
.spr-o-txt{overflow-wrap:anywhere}
.spr-opt-bild{min-height:96px;padding:8px}
.spr-opt-bild small{color:#fff;opacity:.92;font-size:.78rem;font-weight:700}
.spr-nr{position:absolute;left:10px;top:8px;font-style:normal;font-size:.72rem;opacity:.7}
.spr-opt.ist-richtig{background:linear-gradient(135deg,#0E9F5E,#3BC97E);box-shadow:0 0 0 3px #fff,0 8px 18px rgba(27,34,64,.22)}
.spr-opt.ist-falsch{background:linear-gradient(135deg,#9A5A12,#D0882B)}
.spr-opt.ist-aus{opacity:.66}
.spr-rueck{margin-top:12px;min-height:58px}
.spr-meld{display:flex;align-items:center;gap:10px;border-radius:20px;padding:10px 10px 10px 16px;color:#fff;box-shadow:0 8px 18px rgba(27,34,64,.22)}
.spr-meld>span{flex:1;min-width:0;line-height:1.3;font-size:.95rem}
.spr-meld small{display:block;opacity:.92;font-size:.8rem;margin-top:2px}
.spr-meld.gut{background:linear-gradient(135deg,#0E8F55,#2DB872)}
.spr-meld.naja{background:linear-gradient(135deg,#3A3F8F,#5B4BF5)}
.spr-knopf{border:0;border-radius:999px;padding:11px 18px;font-weight:800;color:#fff;background:linear-gradient(135deg,#5B4BF5,#9B4DE0);box-shadow:0 6px 14px rgba(27,34,64,.22);white-space:nowrap}
.spr-knopf:disabled{opacity:.55}
.spr-hell{background:rgba(15,20,48,.62)}
.spr-weiter{background:#fff;color:#1B2240;flex:none}
.spr-karte-wrap{perspective:1200px}
.spr-karte{position:relative;display:block;width:100%;height:clamp(250px,46vh,380px);border:0;padding:0;background:none;transform-style:preserve-3d;transition:transform .5s;border-radius:26px;color:#fff}
.spr-karte.um{transform:rotateY(180deg)}
.spr-k-vorne,.spr-k-hinten{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:16px;border-radius:26px;color:#fff;backface-visibility:hidden;-webkit-backface-visibility:hidden;box-shadow:0 12px 26px rgba(27,34,64,.25);text-align:center;overflow:hidden}
.spr-k-hinten{transform:rotateY(180deg)}
.spr-k-hinten small{color:#fff;opacity:.95}
.spr-k-tipp{position:absolute;bottom:12px;color:#fff;opacity:.85;font-size:.8rem}
.spr-k-h{background:rgba(0,0,0,.18);border-radius:12px;padding:4px 10px}
.spr-bsp{display:flex;flex-direction:column;gap:2px;background:rgba(0,0,0,.18);border-radius:14px;padding:8px 12px;margin-top:4px;max-width:100%}
.spr-bsp i{color:#fff;font-size:.98rem}.spr-bsp small{color:#fff;opacity:.9}
.spr-k-knoepfe,.spr-selbst,.spr-s-knoepfe,.spr-ende-knoepfe{display:flex;gap:10px;justify-content:center;margin-top:12px;flex-wrap:wrap}
.spr-selbst{margin-top:0}
.spr-nochmal{background:linear-gradient(135deg,#3A3F8F,#5B4BF5)}
.spr-gewusst{background:linear-gradient(135deg,#0E8F55,#2DB872)}
.spr-frage-schreib{flex-direction:row;min-height:0;gap:14px;text-align:left;justify-content:flex-start}
.spr-frage-schreib>span{display:flex;flex-direction:column;gap:2px;min-width:0}
.spr-form{margin-top:12px;display:flex;flex-direction:column;gap:10px}
.spr-ein{width:100%;box-sizing:border-box;font:inherit;font-size:1.3rem;font-weight:700;padding:12px 16px;border-radius:18px;border:3px solid rgba(255,255,255,.85);background:#fff;color:#1B2240}
.spr-ein.ist-richtig{border-color:#2DB872}.spr-ein.ist-falsch{border-color:#D0882B}
.spr-akz{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}
.spr-akz button{min-width:40px;height:40px;border:0;border-radius:12px;background:rgba(15,20,48,.62);color:#fff;font-size:1.1rem;font-weight:800}
.spr-s-knoepfe{margin-top:0}
.spr-pruef{min-width:130px}
.spr-tipp{background:var(--spr-glas);border-radius:16px;padding:10px 14px;margin:0;font-size:1.15rem;font-weight:800;letter-spacing:.06em;color:#fff;overflow-wrap:anywhere}
.spr-tipp small{letter-spacing:0;font-size:.75rem;opacity:.85}
.spr-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.spr-mem-auf{display:block;border-radius:16px;margin:0 0 10px;text-align:center;font-size:.85rem}
.spr-memory{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.spr-mk{position:relative;height:118px;border:0;padding:0;background:none;border-radius:18px;color:#fff;min-width:0}
.spr-mk-rueck,.spr-mk-vorne{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;border-radius:18px;backface-visibility:hidden;-webkit-backface-visibility:hidden;transition:transform .35s;box-shadow:0 6px 14px rgba(27,34,64,.22);padding:6px;overflow:hidden}
.spr-mk-rueck{background:repeating-linear-gradient(45deg,#5B4BF5 0 12px,#6E5EFF 12px 24px);color:#fff;font-weight:900;font-size:1.3rem;letter-spacing:.08em}
.spr-mk-vorne{transform:rotateY(180deg);color:#fff}
.spr-mk.auf .spr-mk-rueck{transform:rotateY(180deg)}
.spr-mk.auf .spr-mk-vorne{transform:rotateY(0)}
.spr-mk.gefunden .spr-mk-vorne{box-shadow:0 0 0 3px #7CF2B0,0 6px 14px rgba(27,34,64,.22)}
.spr-mk-fremd{font-weight:800;font-size:.92rem;line-height:1.15;overflow-wrap:anywhere;hyphens:auto}
.spr-mk small{color:#fff;font-size:.72rem;line-height:1.1;overflow-wrap:anywhere}
.spr-liste{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:8px}
.spr-liste li{display:flex;align-items:center;gap:10px;border-radius:18px;padding:8px 10px;box-shadow:0 6px 14px rgba(27,34,64,.18);min-width:0}
.spr-li-txt{flex:1;min-width:0;display:flex;flex-direction:column}
.spr-li-txt b{color:#fff;overflow-wrap:anywhere}.spr-li-txt small{color:#fff;opacity:.92;font-size:.8rem}
.spr-li-h{opacity:1!important}
.spr-fach{font-size:.6rem;letter-spacing:1px;opacity:.9;white-space:nowrap}
.spr-ende{position:relative;display:flex;align-items:center;gap:14px;border-radius:28px;padding:18px 20px;box-shadow:0 14px 30px rgba(27,34,64,.28);color:#fff;min-height:150px;margin-top:8px}
.spr-ende-img{height:150px;width:auto;flex:none;margin:-30px 0 -18px}
.spr-ende-txt h2{margin:0;color:#fff;font-size:1.45rem}.spr-ende-txt p{margin:4px 0;color:#fff}
.spr-ende-txt .spr-sterne{font-size:1.8rem;letter-spacing:4px;color:#FFE34D;margin:0}
.spr-ende-txt .spr-xp{display:inline-block;background:#FFE34D;color:#1B2240;font-weight:900;border-radius:999px;padding:4px 12px}
.spr-fehlerliste{background:var(--spr-glas);border-radius:22px;padding:12px 14px;margin-top:12px;color:#fff}
.spr-fehlerliste ul{list-style:none;margin:8px 0 0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:6px}
.spr-fehlerliste li{display:flex;align-items:center;gap:8px;min-width:0}
.spr-fehlerliste li span{font-weight:800}.spr-fehlerliste li small{opacity:.85;flex:1}
.spr-fehlerliste .spr-laut{width:34px;height:34px;font-size:1rem}
.spr-gross{padding:13px 22px;font-size:1.05rem}
@media (max-width:560px){
  .spr-wahl,.spr-leiste{gap:8px}
  .spr-leiste{grid-template-columns:1fr}
  .spr-sp{padding:10px 12px;border-radius:20px}.spr-sp b{font-size:1rem}.spr-sp span{font-size:1.3rem}
  .spr-themen{grid-template-columns:1fr 1fr;gap:8px}
  .spr-thema{min-height:100px;padding:11px 11px 10px;border-radius:20px}
  .spr-th-emo{font-size:1.5rem}.spr-thema b{font-size:.92rem}.spr-thema small{font-size:.72rem}
  .spr-modi{grid-template-columns:1fr 1fr;gap:8px}
  .spr-modus{min-height:86px;padding:11px;border-radius:20px}.spr-modus span{font-size:1.5rem}
  .spr-thkopf{padding:12px 14px;border-radius:22px}.spr-thkopf .spr-th-emo{font-size:2rem}.spr-thkopf h2{font-size:1.2rem}
  .spr-frage{min-height:150px;padding:12px 12px 10px;border-radius:22px}
  .spr-emo.gross{font-size:3.4rem}.spr-dwort{font-size:1.3rem}.spr-fwort{font-size:1.4rem}
  .spr-fb.gross{width:60px;height:60px}.spr-txt.gross{font-size:2.1rem;height:64px;min-width:76px}
  .spr-opts{gap:8px;margin-top:10px}
  .spr-opt{min-height:58px;font-size:.95rem;border-radius:18px}
  .spr-opt-bild{min-height:84px}
  .spr-gross-laut{width:72px;height:72px;font-size:2rem}
  .spr-memory{grid-template-columns:repeat(3,1fr);gap:8px}
  .spr-mk{height:96px}
  .spr-mk-fremd{font-size:.82rem}
  .spr-karte{height:clamp(230px,42vh,330px)}
  .spr-ende{flex-direction:column;text-align:center;padding:14px}
  .spr-ende-img{height:110px;margin:-6px 0 0}
  .spr-liste{grid-template-columns:1fr}
  .spr-akz{gap:5px}
  .spr-akz button{min-width:34px;height:36px;font-size:1rem;border-radius:10px}
  .spr-ein{font-size:1.15rem;padding:10px 14px}
}
@media (max-width:380px){
  .spr-frage{min-height:132px}
  .spr-emo.gross{font-size:3rem}
  .spr-mk{height:88px}
  .spr-opt-bild{min-height:76px}
  .spr-karte{height:clamp(220px,40vh,300px)}
}
@media (min-width:900px){
  .spr-spiel{max-width:760px}
  .spr-frage{min-height:220px}
  .spr-emo.gross{font-size:5rem}
  .spr-opt{min-height:78px;font-size:1.15rem}
  .spr-opt-bild{min-height:118px}
  .spr-mk{height:132px}
  .spr-mk-fremd{font-size:1.05rem}
}
@media (prefers-reduced-motion:reduce){
  .spr-karte,.spr-mk-rueck,.spr-mk-vorne,.spr-thema,.spr-opt,.spr-fort i,.spr-sp{transition:none!important}
}
`;
document.head.appendChild(css);

/* ---------- Anmelden ---------- */
X.register({
  id:"sprachen", titel:"Französisch & Englisch", text:"Wörter lernen mit Bild, Ton und Spiel", emo:"🗣️",
  farbe:"linear-gradient(135deg,#1E5BB8,#5B4BF5 55%,#C2185B)", reihe:25,
  hinweis(){ try{ const n = faelligIds(einst().sp).length; return n ? n + " wiederholen" : ""; }catch(e){ return ""; } },
  folie(){ try{ const sp = einst().sp, n = faelligIds(sp).length; if(!n) return null;
    return {cls:"hs-spr", ic:"🗣️", lbl:"Wörter-Trainer", titel:SPRACHEN[sp].name + " wiederholen", text:`${n} ${n === 1 ? "Wort wartet" : "Wörter warten"} auf dich.`, btn:"🔁 Los geht's", a:"x-sprachen"}; }catch(e){ return null; } },
  render(box){
    ST.box = box;
    if((ST.ansicht === "spiel" || ST.ansicht === "ende") && !ST.runde) ST.ansicht = "start";
    if(!tastenAn){ tastenAn = true; document.addEventListener("keydown", tasten); }
    zeichne();
  }
});

/* Gelernte Wörter (Fach 3 oder höher) über beide Sprachen; Gesamtzahl aus den geladenen Listen oder dem letzten bekannten Stand */
function fortschritt(){
  let hat = 0, alle = 0; const anz = A.LS.get(K.anz, null) || {};
  Object.keys(SPRACHEN).forEach(sp => {
    if(!DATA[sp]) laden(sp);
    const b = boxen(sp); hat += Object.keys(b).filter(id => b[id][0] >= 3).length;
    alle += DATA[sp] ? DATA[sp].woerter.length : (anz[sp] || 566);
  });
  return {hat, alle};
}

window.EP_SPRACHEN = { stand, fortschritt, faellig: sp => faelligIds(sp || einst().sp).length, sprich: (t, sp) => sprich(t, sp || einst().sp), laden, _pruefe: pruefe };
})();
