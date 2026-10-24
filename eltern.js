/* easyplay: Wochenbericht für Eltern (Modul «eltern»)
   Baut auf der bestehenden Elternansicht aus lernen.js auf (Profil > «Für Eltern» > Elternlink #eltern=… mit dem Gesamtstand).
   Diese Welt zeigt dazu einen WOCHENBERICHT (diese Woche und letzte Woche, Montag bis Sonntag, lokale Zeit):
   Tage aktiv, Fragen, Anteil richtig, stärkste und schwächere Themen, gelernte Wiederholungsfragen, neue Abzeichen, Lernzeit,
   Level und Welten-Fortschritt, dazu ein Vorschlag aus der Bibliothek. Kein Vergleich mit anderen Kindern.
   Teilen: Link (#elternwoche=…, kompakt im URL-Fragment, nur Vorname falls gewünscht), E-Mail (mailto:), Drucken/PDF, QR-Code.
   Datenquellen (nur lesen): ep-lerntage, ep-historie (S.historie), ep-xp (EP_LEVEL), ep-fehler-geuebt, EP_LERNEN.abzeichen(),
   EP_LEVEL.familien(), ep-wochenabzeichen, EP_KARTE/EP_ALBUM/EP_GARDEROBE/EP_MATHE/EP_SPRACHEN (falls vorhanden), EP_TRUHE.
   Eigener Speicher: ep-x-eltern-tage   {"JJJJ-MM-TT": {f, r, ms, g, th:{thema:[richtig, total]}}} (letzte 70 Tage)
                     ep-x-eltern-snap   {"JJJJ-MM-TT": {lv, w:{karte:n, album:n, …}}} (letzte 70 Tage)
                     ep-x-eltern-abz    {schluessel: "JJJJ-MM-TT" | "alt"} wann ein Abzeichen zuerst gesehen wurde
                     ep-x-eltern-name   true/false: Vorname im Link zeigen (Standard: aus)
   API: window.EP_ELTERN = { bericht(woche) → Bericht (woche: 0 = diese, -1 = letzte, oder "JJJJ-MM-TT"),
                             link(mitName?) → URL, text(woche) → E-Mail-Text, qr(text) → SVG-Text, oeffne() } */
(function(){
"use strict";
if(!window.EP_EXTRAS) return;
const X = window.EP_EXTRAS, api = X.api, LS = api.LS, h = api.h;

const K = { tage:"ep-x-eltern-tage", snap:"ep-x-eltern-snap", abz:"ep-x-eltern-abz", name:"ep-x-eltern-name" };
const heute = d => api.heute(d);
const zahl = n => Number(n || 0).toLocaleString("de-CH");
const obj = v => (v && typeof v === "object" && !Array.isArray(v)) ? v : {};
const num = (v, max) => Math.max(0, Math.min(Math.round(+v || 0), max || 1e7));
const ton = n => { try{ window.EP_SOUND && window.EP_SOUND.play(n); }catch(e){} };
const MONATE = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
const WT = ["Mo","Di","Mi","Do","Fr","Sa","So"];
const STUFENNAMEN = ["Bronze","Silber","Gold","Platin","Diamant","Regenbogen"];
const kuerzen = (o, n) => { const ks = Object.keys(o).sort(); while(ks.length > n) delete o[ks.shift()]; return o; };
const datum = s => { const [y, m, d] = String(s).split("-").map(Number); return new Date(y, (m || 1) - 1, d || 1, 12); };

/* ---------- Mitschreiben: jede Quiz-Antwort ---------- */
let letzteAntwort = 0, gStand = +LS.get("ep-fehler-geuebt", 0) || 0;
document.addEventListener("ep:antwort", e => {
  try{
    const det = e.detail || {}, d = heute(), alle = obj(LS.get(K.tage, {})), t = obj(alle[d]);
    t.f = (t.f || 0) + 1; if(det.ok) t.r = (t.r || 0) + 1;
    const jetzt = Date.now(), dt = jetzt - letzteAntwort;
    t.ms = (t.ms || 0) + (letzteAntwort && dt > 0 && dt < 180000 ? dt : 15000);   // Pausen über 3 Minuten zählen nicht
    letzteAntwort = jetzt;
    const th = det.thema || (det.frage && det.frage.t);
    if(th && th !== "liste"){ t.th = obj(t.th); const x = Array.isArray(t.th[th]) ? t.th[th] : [0, 0]; x[1]++; if(det.ok) x[0]++; t.th[th] = x; }
    alle[d] = t; LS.set(K.tage, kuerzen(alle, 70));
    // Wiederholungsfragen: lernen.js zählt ep-fehler-geuebt erst nach diesem Ereignis hoch
    setTimeout(() => { try{ const g = +LS.get("ep-fehler-geuebt", 0) || 0;
      if(g > gStand){ const a = obj(LS.get(K.tage, {})), x = obj(a[d]); x.g = (x.g || 0) + (g - gStand); a[d] = x; LS.set(K.tage, a); }
      gStand = g; }catch(e){} }, 0);
  }catch(err){ console.warn("eltern", err); }
});
document.addEventListener("ep:quizende", () => setTimeout(merken, 400));

/* ---------- Stand merken: Level, Welten, Abzeichen (für die Wochen-Differenz) ---------- */
function welten(){
  const r = [], add = (id, o, k1, k2) => { try{ if(!o) return; const a = +(o[k1] ?? o.hat ?? o.frei ?? o.geloest ?? o.n ?? 0), b = +(o[k2] ?? o.alle ?? 0); if(b > 0 && isFinite(a)) r.push({id, jetzt:a, alle:b}); }catch(e){} };
  try{ add("karte", window.EP_KARTE?.fortschritt?.(), "frei", "alle"); }catch(e){}
  try{ add("album", window.EP_ALBUM?.anzahl?.(), "hat", "alle"); }catch(e){}
  try{ add("garderobe", window.EP_GARDEROBE?.anzahl?.(), "hat", "alle"); }catch(e){}
  try{ add("mathe", window.EP_MATHE?.fortschritt?.(), "hat", "alle"); }catch(e){}
  try{ add("sprachen", window.EP_SPRACHEN?.fortschritt?.(), "hat", "alle"); }catch(e){}
  return r;
}
function abzSchluessel(){
  const r = [];
  try{ window.EP_LERNEN.abzeichen().forEach(a => { if(a.hat) r.push("l:" + a.id); }); }catch(e){}
  try{ window.EP_LEVEL.familien().forEach(f => { for(let i = 0; i < f.stufe; i++) r.push("v:" + f.id + i); }); }catch(e){}
  return r;
}
function merken(){
  try{
    const d = heute(), s = obj(LS.get(K.snap, {}));
    let lv = 0; try{ lv = window.EP_LEVEL.stand().level || 0; }catch(e){}
    const w = {}; welten().forEach(x => w[x.id] = x.jetzt);
    s[d] = {lv, w}; LS.set(K.snap, kuerzen(s, 70));
    const az = LS.get(K.abz, null), keys = abzSchluessel();
    if(!az || typeof az !== "object"){ const m = {_start:d}; keys.forEach(k => m[k] = "alt"); LS.set(K.abz, m); }
    else { let neu = false; keys.forEach(k => { if(!az[k]){ az[k] = d; neu = true; } }); if(neu) LS.set(K.abz, az); }
  }catch(e){ console.warn("eltern", e); }
}

/* ---------- Woche berechnen ---------- */
function wocheTage(woche){
  let d;
  if(typeof woche === "string" && /^\d{4}-\d{2}-\d{2}$/.test(woche)) d = datum(woche);
  else { d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + 7 * (Math.round(+woche || 0))); }
  const dow = (d.getDay() + 6) % 7, mo = new Date(d.getFullYear(), d.getMonth(), d.getDate() - dow, 12);
  const r = []; for(let i = 0; i < 7; i++) r.push(heute(new Date(mo.getFullYear(), mo.getMonth(), mo.getDate() + i, 12)));
  return r;
}
function historie(){ try{ if(typeof S !== "undefined" && Array.isArray(S.historie)) return S.historie; }catch(e){} const a = LS.get("ep-historie", []); return Array.isArray(a) ? a : []; }

function bericht(woche){
  merken();
  const tage = wocheTage(woche), hTag = heute(), set = new Set(tage);
  const lt = obj(LS.get("ep-lerntage", {})), eig = obj(LS.get(K.tage, {})), xpTage = obj(obj(LS.get("ep-xp", {})).tage);
  const hist = {}; historie().forEach(e => { try{ const d = heute(e.datum); if(set.has(d)) (hist[d] = hist[d] || []).push(e); }catch(x){} });
  const th = {}, addTh = (t, r, n) => { if(!t || t === "liste" || !n) return; const x = th[t] || (th[t] = [0, 0]); x[0] += r; x[1] += n; };
  let fragen = 0, richtig = 0, mitQuote = 0, ms = 0, geuebt = 0, xp = 0, aktiv = 0;
  const proTag = tage.map(d => {
    const o = obj(eig[d]), he = hist[d] || [];
    const hf = he.reduce((s, e) => s + (Array.isArray(e.log) ? e.log.filter(l => !l.skip).length : (+e.total || 0)), 0);
    const f = Math.max(+lt[d] || 0, +o.f || 0, (+lt[d] || +o.f) ? 0 : hf);
    if(o.f){ richtig += +o.r || 0; mitQuote += +o.f; Object.entries(obj(o.th)).forEach(([t, x]) => Array.isArray(x) && addTh(t, +x[0] || 0, +x[1] || 0)); }
    else he.forEach(e => { richtig += +e.richtig || 0; mitQuote += +e.total || 0; addTh(e.themaId, +e.richtig || 0, +e.total || 0); });
    ms += Math.max(+o.ms || 0, he.reduce((s, e) => s + (+e.zeit || 0) * 1000, 0));
    geuebt += +o.g || 0; xp += +xpTage[d] || 0; fragen += f; if(f > 0) aktiv++;
    return {d, f};
  });
  // Themen: stärkste und schwächere (mindestens 3 Fragen)
  const liste = Object.entries(th).filter(([t, x]) => x[1] >= 3).map(([t, x]) => ({t, q:Math.round(x[0] / x[1] * 100), n:x[1]}));
  const stark = liste.slice().sort((a, b) => b.q - a.q || b.n - a.n).filter(x => x.q >= 60).slice(0, 3);
  const schwach = liste.slice().sort((a, b) => a.q - b.q || b.n - a.n).filter(x => x.q < 80 && !stark.some(s => s.t === x.t)).slice(0, 3);
  let vorschlag = schwach[0] ? schwach[0].t : null;
  if(!vorschlag && liste.length) vorschlag = liste.slice().sort((a, b) => b.n - a.n)[0].t;
  // Neue Abzeichen
  const az = obj(LS.get(K.abz, {})), abz = Object.keys(az).filter(k => k !== "_start" && set.has(az[k]));
  try{ (LS.get("ep-wochenabzeichen", []) || []).forEach(w => { if(w && w.z && set.has(heute(w.z)) && w.t) abz.push("w:" + w.t); }); }catch(e){}
  // Level und Welten: letzter Stand vor der Woche gegen letzter Stand in der Woche
  const sn = obj(LS.get(K.snap, {})), sk = Object.keys(sn).sort();
  const vorK = sk.filter(k => k < tage[0]).pop() || sk.find(k => set.has(k)), endK = sk.filter(k => k <= tage[6]).pop();
  const A = vorK ? obj(sn[vorK]) : null, B = endK && endK >= tage[0] ? obj(sn[endK]) : null;
  const lv = A && B && B.lv ? [+A.lv || 0, +B.lv || 0] : null;
  const wl = [];
  if(B){ welten().forEach(x => { const b = +obj(B.w)[x.id], a = +obj(A && A.w)[x.id]; if(isFinite(b)) wl.push({id:x.id, jetzt:b, alle:x.alle, plus:isFinite(a) ? Math.max(0, b - a) : 0}); }); }
  let serie = 0; try{ serie = window.EP_LERNEN.serie().n || 0; }catch(e){}
  let stufe = 1; try{ stufe = S.stufe || 1; }catch(e){}
  return { von:tage[0], bis:tage[6], laufend:tage.includes(hTag), heute:hTag, tage:proTag, aktiv, fragen, richtig, mitQuote,
    quote: mitQuote >= 3 ? Math.round(richtig / mitQuote * 100) : null, min:Math.round(ms / 60000), geuebt, xp,
    stark, schwach, vorschlag, abz:abz.slice(0, 12), lv, welten:wl, serie, stufe };
}

/* ---------- Kompakt für den Link (#elternwoche=…) ----------
   Format (nur sichere URL-Zeichen, kurz genug für einen QR-Code):
   1~JJJJMMTT~serie~stufe~Vorname - Woche - Woche, Woche = von~f.f.f.f.f.f.f~richtig~mitQuote~min~geuebt~xp~stark~schwach~vorschlag~abzeichen~lvA.lvB~welten
   stark/schwach: thema.q.n,thema.q.n   abzeichen: l:id,v:id   welten: id.jetzt.alle.plus */
const ID = /^[a-z0-9_]{1,40}$/i;
const liste3 = l => l.map(x => x.join(".")).join(",");
function kompakt(R){
  return [R.von.replace(/-/g, ""), R.tage.map(x => x.f).join("."), R.richtig, R.mitQuote, R.min, R.geuebt, R.xp, liste3(R.stark.map(x => [x.t, x.q, x.n])), liste3(R.schwach.map(x => [x.t, x.q, x.n])),
    R.vorschlag || "", R.abz.slice(0, 8).join(","), R.lv ? R.lv.join(".") : "", liste3(R.welten.filter(w => w.plus > 0).map(w => [w.id, w.jetzt, w.alle, w.plus]))].join("~");
}
function ausText(t){
  const f = String(t).split("~"), tr = s => String(s || "").split(",").filter(Boolean).map(x => x.split("."));
  const d8 = String(f[0] || ""), a = /^\d{8}$/.test(d8) ? d8.slice(0, 4) + "-" + d8.slice(4, 6) + "-" + d8.slice(6) : "";
  return {a, t:String(f[1] || "").split("."), r:f[2], q:f[3], m:f[4], g:f[5], x:f[6], s:tr(f[7]).filter(x => ID.test(x[0])), k:tr(f[8]).filter(x => ID.test(x[0])),
    v:ID.test(f[9] || "") ? f[9] : 0, b:String(f[10] || "").split(",").filter(Boolean), l:f[11] ? f[11].split(".") : 0, w:tr(f[12]).filter(x => /^[a-z]{1,20}$/.test(x[0]))};
}
function ausKompakt(W, stand){
  const tage = wocheTage(String(W.a || "").slice(0, 10)), f = (Array.isArray(W.t) ? W.t : []).slice(0, 7).map(n => num(n, 1e5));
  while(f.length < 7) f.push(0);
  const th = l => (Array.isArray(l) ? l : []).slice(0, 3).filter(Array.isArray).map(x => ({t:String(x[0] || "").slice(0, 40), q:num(x[1], 100), n:num(x[2], 1e6)}));
  const q = num(W.q, 1e6), r = Math.min(num(W.r, 1e6), q);
  return { von:tage[0], bis:tage[6], laufend:tage.includes(stand), heute:stand, tage:tage.map((d, i) => ({d, f:f[i]})), aktiv:f.filter(n => n > 0).length,
    fragen:f.reduce((a, b) => a + b, 0), richtig:r, mitQuote:q, quote:q >= 3 ? Math.round(r / q * 100) : null, min:num(W.m, 1e5), geuebt:num(W.g, 1e5), xp:num(W.x, 1e7),
    stark:th(W.s), schwach:th(W.k), vorschlag:W.v ? String(W.v).slice(0, 40) : null,
    abz:(Array.isArray(W.b) ? W.b : []).slice(0, 12).map(x => String(x).slice(0, 40)).filter(x => /^[lvw]:[\w-]+$/.test(x)),
    lv:Array.isArray(W.l) ? [num(W.l[0], 9999), num(W.l[1], 9999)] : null,
    welten:(Array.isArray(W.w) ? W.w : []).slice(0, 8).filter(Array.isArray).map(x => ({id:String(x[0]).slice(0, 20), jetzt:num(x[1], 1e5), alle:num(x[2], 1e5), plus:num(x[3], 1e5)})) };
}
function vorname(){ try{ return String((S.profil && S.profil.name) || "").trim().split(/\s+/)[0].slice(0, 20); }catch(e){ return ""; } }
function nameZeigen(){ return LS.get(K.name, false) === true && !!vorname(); }
function linkText(mitName){
  const R0 = bericht(0), R1 = bericht(-1), n = mitName ? vorname().replace(/[^\p{L}]/gu, "") : "";
  return [["1", heute().replace(/-/g, ""), R0.serie, R0.stufe, encodeURIComponent(n)].join("~"), kompakt(R0), kompakt(R1)].join("-");
}
function linkBasis(){ return ((window.EP_CONFIG || {}).teilenUrl || location.href.split("#")[0]); }
function link(mitName){ return linkBasis() + "#elternwoche=" + linkText(mitName === undefined ? nameZeigen() : mitName); }
function ausLink(){
  const m = /#elternwoche=([^#\s]{10,4000})/.exec(location.hash || ""); if(!m) return null;
  try{ const teile = decodeURIComponent(m[1]).split("-"), k = teile[0].split("~");
    if(k[0] !== "1" || teile.length < 2) return null;
    const d8 = String(k[1] || ""), stand = /^\d{8}$/.test(d8) ? d8.slice(0, 4) + "-" + d8.slice(4, 6) + "-" + d8.slice(6) : heute();
    const w = teile.slice(1, 3).map(ausText).filter(W => W.a).map(W => ausKompakt(W, stand)); if(!w.length) return null;
    return {n:String(k[4] || "").replace(/[^\p{L}]/gu, "").slice(0, 20), d:stand, se:num(k[2], 3650), s:num(k[3], 4) || 1, w};
  }catch(e){ return null; }
}

/* ---------- Namen und Texte ---------- */
function themaName(t){
  try{ if(THEMA[t] && THEMA[t].name) return THEMA[t].name; }catch(e){}
  if(String(t).startsWith("kt_")) return "Kanton " + String(t).slice(3).toUpperCase();
  return String(t);
}
function themaEmo(t){ try{ const e = THEMA[t] && THEMA[t].emo; if(e && !/^[a-z_]+$/i.test(e)) return e; if(e && typeof EMO !== "undefined" && EMO[e]) return EMO[e]; }catch(e){} return String(t).startsWith("kt_") ? "🇨🇭" : "📘"; }
function abzInfo(k){
  const art = k.slice(0, 1), id = k.slice(2);
  try{ if(art === "l"){ const a = window.EP_LERNEN.abzeichen().find(x => x.id === id); if(a) return {emo:a.emo, name:a.name}; } }catch(e){}
  try{ if(art === "v"){ const f = window.EP_LEVEL.familien().find(x => id.startsWith(x.id) && /^\d+$/.test(id.slice(x.id.length))); if(f) return {emo:f.emo, name:f.name + " " + (STUFENNAMEN[+id.slice(f.id.length)] || "")}; } }catch(e){}
  if(art === "w") return {emo:"🏅", name:"Wochen-Abzeichen " + themaName(id)};
  return null;
}
function weltInfo(id){ return ({karte:["🗺️","Schweizer Karte"], album:["📒","Sammelalbum"], garderobe:["🎨","Profil-Verzierungen"], mathe:["➗","Mathe"], sprachen:["💬","Sprachen"]})[id] || ["✨", id]; }
function zeitraum(R){
  const a = datum(R.von), b = datum(R.bis);
  return a.getMonth() === b.getMonth() ? `${a.getDate()}. bis ${b.getDate()}. ${MONATE[b.getMonth()]} ${b.getFullYear()}`
    : `${a.getDate()}. ${MONATE[a.getMonth()]}${a.getFullYear() !== b.getFullYear() ? " " + a.getFullYear() : ""} bis ${b.getDate()}. ${MONATE[b.getMonth()]} ${b.getFullYear()}`;
}
const minText = m => m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} Min.` : `${m} Min.`;
function zusammenfassung(R, name, vor){
  const wer = name || "Ihr Kind";
  if(!R.fragen) return R.laufend ? `Diese Woche hat ${h(wer)} noch nicht gespielt. Ein paar Fragen zusammen sind ein schöner Start!` : `In dieser Woche war Pause. Das ist völlig in Ordnung, Pausen gehören dazu.`;
  let s = `${h(wer)} hat an <b>${R.aktiv} ${R.aktiv === 1 ? "Tag" : "Tagen"}</b> gelernt und <b>${zahl(R.fragen)} Fragen</b> beantwortet.`;
  if(R.quote != null) s += R.quote >= 85 ? ` Davon waren beeindruckende ${R.quote} % richtig.` : R.quote >= 65 ? ` ${R.quote} % waren richtig, das ist eine solide Leistung.` : ` ${R.quote} % waren richtig. Jede falsche Antwort ist eine Chance, etwas Neues zu lernen.`;
  if(vor && vor.fragen && R.fragen > vor.fragen && !R.laufend) s += ` Das sind ${zahl(R.fragen - vor.fragen)} Fragen mehr als in der Woche davor.`;
  if(R.geuebt) s += ` Ausserdem ${R.geuebt === 1 ? "sitzt eine Frage" : `sitzen ${zahl(R.geuebt)} Fragen`}, die vorher falsch waren, jetzt richtig.`;
  return s;
}

/* ---------- QR-Code (eigene kleine Umsetzung: Byte-Modus, Fehlerkorrektur M oder L, Versionen 1 bis 40) ---------- */
const QR = (function(){
  const ECC = {L:[-1,7,10,15,20,26,18,20,24,30,18,20,24,26,30,22,24,28,30,28,28,28,28,30,30,26,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
               M:[-1,10,16,26,18,24,16,18,22,22,26,30,22,22,24,24,28,28,26,26,26,26,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28]};
  const BLK = {L:[-1,1,1,1,1,1,2,2,2,2,4,4,4,4,4,6,6,6,6,7,8,8,9,9,10,12,12,12,13,14,15,16,17,18,19,19,20,21,22,24,25],
               M:[-1,1,1,1,2,2,4,4,4,5,5,5,8,9,9,10,10,11,13,14,16,17,17,18,20,21,23,25,26,28,29,31,33,35,37,38,40,43,45,47,49]};
  const FMT = {L:1, M:0};
  const raw = v => { let r = (16 * v + 128) * v + 64; if(v >= 2){ const n = Math.floor(v / 7) + 2; r -= (25 * n - 10) * n - 55; if(v >= 7) r -= 36; } return r; };
  const dataCw = (v, e) => Math.floor(raw(v) / 8) - ECC[e][v] * BLK[e][v];
  const mul = (x, y) => { let z = 0; for(let i = 7; i >= 0; i--){ z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; } return z & 255; };
  function divisor(deg){ const r = new Array(deg).fill(0); r[deg - 1] = 1; let root = 1;
    for(let i = 0; i < deg; i++){ for(let j = 0; j < r.length; j++){ r[j] = mul(r[j], root); if(j + 1 < r.length) r[j] ^= r[j + 1]; } root = mul(root, 2); } return r; }
  function rest(data, div){ const r = div.map(() => 0); for(const b of data){ const f = b ^ r.shift(); r.push(0); div.forEach((c, i) => r[i] ^= mul(c, f)); } return r; }
  function ausrichtung(v){ if(v === 1) return []; const n = Math.floor(v / 7) + 2, step = v === 32 ? 26 : Math.ceil((v * 4 + 4) / (n * 2 - 2)) * 2;
    const r = [6]; for(let p = v * 4 + 10; r.length < n; p -= step) r.splice(1, 0, p); return r; }
  function bauen(text){
    const bytes = Array.from(unescape(encodeURIComponent(text)), c => c.charCodeAt(0));
    let v = 0, e = "M";
    for(const ee of ["M", "L"]){ for(let vv = 1; vv <= 40; vv++){ const bits = 4 + (vv <= 9 ? 8 : 16) + bytes.length * 8; if(bits <= dataCw(vv, ee) * 8){ v = vv; break; } } if(v){ e = ee; break; } }
    if(!v) return null;
    // Datenbits
    const bb = [], put = (val, len) => { for(let i = len - 1; i >= 0; i--) bb.push((val >>> i) & 1); };
    put(4, 4); put(bytes.length, v <= 9 ? 8 : 16); bytes.forEach(b => put(b, 8));
    const cap = dataCw(v, e) * 8; put(0, Math.min(4, cap - bb.length)); put(0, (8 - bb.length % 8) % 8);
    for(let p = 0xEC; bb.length < cap; p ^= 0xEC ^ 0x11) put(p, 8);
    const data = []; for(let i = 0; i < bb.length; i += 8){ let x = 0; for(let j = 0; j < 8; j++) x = (x << 1) | bb[i + j]; data.push(x); }
    // Fehlerkorrektur und Verschachtelung
    const nb = BLK[e][v], el = ECC[e][v], rc = Math.floor(raw(v) / 8), nShort = nb - rc % nb, sLen = Math.floor(rc / nb), div = divisor(el);
    const blocks = []; for(let i = 0, k = 0; i < nb; i++){ const d = data.slice(k, k + sLen - el + (i < nShort ? 0 : 1)); k += d.length; const ec = rest(d, div); if(i < nShort) d.push(0); blocks.push(d.concat(ec)); }
    const cw = []; for(let i = 0; i < blocks[0].length; i++) blocks.forEach((b, j) => { if(i !== sLen - el || j >= nShort) cw.push(b[i]); });
    // Matrix
    const n = v * 4 + 17, M = [], F = [];
    for(let i = 0; i < n; i++){ M.push(new Array(n).fill(false)); F.push(new Array(n).fill(false)); }
    const set = (x, y, b) => { M[y][x] = b; F[y][x] = true; };
    for(let i = 0; i < n; i++){ set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    [[3, 3], [n - 4, 3], [3, n - 4]].forEach(([x, y]) => { for(let dy = -4; dy <= 4; dy++) for(let dx = -4; dx <= 4; dx++){ const dist = Math.max(Math.abs(dx), Math.abs(dy)), xx = x + dx, yy = y + dy; if(xx >= 0 && xx < n && yy >= 0 && yy < n) set(xx, yy, dist !== 2 && dist !== 4); } });
    const al = ausrichtung(v), na = al.length;
    for(let i = 0; i < na; i++) for(let j = 0; j < na; j++){ if((i === 0 && j === 0) || (i === 0 && j === na - 1) || (i === na - 1 && j === 0)) continue;
      for(let dy = -2; dy <= 2; dy++) for(let dx = -2; dx <= 2; dx++) set(al[i] + dx, al[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1); }
    const format = mask => { const d = FMT[e] << 3 | mask; let r = d; for(let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537); const bits = ((d << 10) | r) ^ 0x5412, bit = i => ((bits >>> i) & 1) === 1;
      for(let i = 0; i <= 5; i++) set(8, i, bit(i)); set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
      for(let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
      for(let i = 0; i < 8; i++) set(n - 1 - i, 8, bit(i)); for(let i = 8; i < 15; i++) set(8, n - 15 + i, bit(i)); set(8, n - 8, true); };
    format(0);
    if(v >= 7){ let r = v; for(let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1F25); const bits = v << 12 | r;
      for(let i = 0; i < 18; i++){ const b = ((bits >>> i) & 1) === 1, a = n - 11 + i % 3, c = Math.floor(i / 3); set(a, c, b); set(c, a, b); } }
    let i = 0;
    for(let right = n - 1; right >= 1; right -= 2){ if(right === 6) right = 5;
      for(let vert = 0; vert < n; vert++) for(let j = 0; j < 2; j++){ const x = right - j, up = ((right + 1) & 2) === 0, y = up ? n - 1 - vert : vert;
        if(!F[y][x] && i < cw.length * 8){ M[y][x] = ((cw[i >>> 3] >>> (7 - (i & 7))) & 1) === 1; i++; } } }
    const maskFn = [(x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x) => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
      (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => x * y % 2 + x * y % 3 === 0, (x, y) => (x * y % 2 + x * y % 3) % 2 === 0, (x, y) => ((x + y) % 2 + x * y % 3) % 2 === 0];
    const anwenden = m => { for(let y = 0; y < n; y++) for(let x = 0; x < n; x++) if(!F[y][x] && maskFn[m](x, y)) M[y][x] = !M[y][x]; };
    const strafe = () => { let p = 0, dunkel = 0;
      for(let a = 0; a < n; a++){ let lx = 0, ly = 0, cx = null, cy = null;
        for(let b = 0; b < n; b++){ const vx = M[a][b], vy = M[b][a]; if(vx) dunkel++;
          if(vx === cx) lx++; else { if(lx >= 5) p += lx - 2; cx = vx; lx = 1; }
          if(vy === cy) ly++; else { if(ly >= 5) p += ly - 2; cy = vy; ly = 1; } }
        if(lx >= 5) p += lx - 2; if(ly >= 5) p += ly - 2; }
      for(let y = 0; y < n - 1; y++) for(let x = 0; x < n - 1; x++){ const c = M[y][x]; if(c === M[y][x + 1] && c === M[y + 1][x] && c === M[y + 1][x + 1]) p += 3; }
      return p + Math.floor(Math.abs(dunkel * 20 - n * n * 10) / (n * n)) * 10; };
    let best = 0, bestP = Infinity;
    for(let m = 0; m < 8; m++){ anwenden(m); format(m); const p = strafe(); if(p < bestP){ bestP = p; best = m; } anwenden(m); }
    anwenden(best); format(best);
    return {n, M, version:v, ecc:e};
  }
  function svg(text, titel){
    const q = bauen(text); if(!q) return "";
    const rand = 4, g = q.n + rand * 2; let d = "";
    for(let y = 0; y < q.n; y++) for(let x = 0; x < q.n; x++) if(q.M[y][x]) d += `M${x + rand} ${y + rand}h1v1h-1z`;
    return `<svg class="xel-qrsvg" viewBox="0 0 ${g} ${g}" shape-rendering="crispEdges" role="img" aria-label="${h(titel || "QR-Code")}"><rect width="${g}" height="${g}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
  }
  return {bauen, svg};
})();

/* ---------- Bericht als HTML (Bildschirm) ---------- */
function kpis(R){
  const lvAuf = R.lv && R.lv[1] > R.lv[0];
  const t = [
    ["📅", `${R.aktiv} von 7`, "Tage aktiv", "linear-gradient(135deg,#5B4BF5,#8A5CF6)"],
    ["❓", zahl(R.fragen), "Fragen beantwortet", "linear-gradient(135deg,#0B6E6A,#0FA968)"],
    ["✅", R.quote != null ? R.quote + " %" : "noch offen", "richtig", "linear-gradient(135deg,#1F7A3A,#38A84F)"],
    ["⏱️", R.fragen ? "etwa " + minText(R.min) : "0 Min.", "Lernzeit", "linear-gradient(135deg,#B4570B,#E58A1F)"],
    ["🎯", zahl(R.geuebt), "Wiederholungsfragen gelernt", "linear-gradient(135deg,#B0216F,#E043B8)"],
    ["⭐", lvAuf ? `Level ${R.lv[0]} → ${R.lv[1]}` : `+${zahl(R.xp)} XP`, lvAuf ? `+${zahl(R.xp)} XP gesammelt` : (R.lv ? `Erfahrungspunkte, Level ${R.lv[1]}` : "Erfahrungspunkte"), "linear-gradient(135deg,#2E4BEA,#5B6CFF)"]
  ];
  return `<div class="xel-kpis">${t.map(([e, b, s, f]) => `<div class="xel-kpi" style="background:${f}"><span class="xel-kpi-e" aria-hidden="true">${e}</span><b>${h(b)}</b><small>${h(s)}</small></div>`).join("")}</div>`;
}
function tageHTML(R){
  const max = Math.max(5, ...R.tage.map(x => x.f));
  return `<div class="xel-tage" role="img" aria-label="Fragen pro Tag: ${R.tage.map((x, i) => WT[i] + " " + x.f).join(", ")}">${R.tage.map((x, i) => {
    const zuk = x.d > R.heute;
    return `<div class="xel-tag${x.f ? " an" : ""}${zuk ? " zuk" : ""}${x.d === R.heute ? " heute" : ""}"><span class="xel-bal"><i style="height:${Math.max(x.f ? 8 : 0, Math.round(x.f / max * 100))}%"></i></span><b>${x.f || ""}</b><small>${WT[i]}</small></div>`; }).join("")}</div>`;
}
function themenListe(l, art){
  return `<ul class="xel-th">${l.map(x => `<li><span aria-hidden="true">${themaEmo(x.t)}</span><span class="xel-thn">${h(themaName(x.t))}</span><span class="xel-thq ${art}">${x.q} %</span><small>${zahl(x.n)} Fragen</small></li>`).join("")}</ul>`;
}
function libOk(t){ try{ return !!(t && THEMA[t] && typeof LIB !== "undefined"); }catch(e){ return false; } }
function berichtHTML(R, o){
  const name = o.name || "", abz = R.abz.map(abzInfo).filter(Boolean), wl = R.welten, vt = R.vorschlag;
  return `<section class="xel-karte xel-haupt" aria-labelledby="xelTitel${o.id || ""}">
    <div class="xel-zeit"><h2 id="xelTitel${o.id || ""}">${R.laufend ? "Diese Woche" : "Wochenbericht"}</h2><p>${h(zeitraum(R))}${R.laufend ? " · bisher" : ""}</p></div>
    <p class="xel-satz">${zusammenfassung(R, name, o.vor)}</p>
    ${kpis(R)}
    <details class="xel-mehr"${o.zu ? "" : " open"}><summary>Tage, Themen und Abzeichen</summary>
    <h3 class="xel-h3">Fragen pro Tag</h3>${tageHTML(R)}
    <div class="xel-zwei">
      <div class="xel-box"><h3 class="xel-h3">💪 Das klappt schon gut</h3>${R.stark.length ? themenListe(R.stark, "gut") : `<p class="xel-leise">Sobald in einem Thema ein paar Fragen beantwortet sind, steht es hier.</p>`}</div>
      <div class="xel-box"><h3 class="xel-h3">🌱 Hier lohnt sich Üben</h3>${R.schwach.length ? themenListe(R.schwach, "ueben") : `<p class="xel-leise">${R.fragen ? "Diese Woche gab es kein Thema mit vielen Fehlern. Toll!" : "Noch keine Angaben."}</p>`}</div>
    </div>
    ${abz.length ? `<h3 class="xel-h3">🏅 Neue Abzeichen</h3><div class="xel-abz">${abz.map(a => `<span class="xel-pille"><span aria-hidden="true">${a.emo}</span> ${h(a.name)}</span>`).join("")}</div>` : ""}
    ${wl.length ? `<h3 class="xel-h3">✨ Welten</h3><div class="xel-abz">${wl.map(w => { const i = weltInfo(w.id); return `<span class="xel-pille"><span aria-hidden="true">${i[0]}</span> ${h(i[1])}: ${zahl(w.jetzt)} von ${zahl(w.alle)}${w.plus ? ` <b>(+${zahl(w.plus)})</b>` : ""}</span>`; }).join("")}</div>` : ""}
    </details>
  </section>
  <section class="xel-karte xel-vorschlag">
    <img src="img/kids/duo-winken.webp" alt="" class="xel-vimg" loading="lazy">
    <div><h3>📖 Das könntet ihr diese Woche gemeinsam anschauen</h3>
    ${vt ? `<p><b>${themaEmo(vt)} ${h(themaName(vt))}</b>. ${R.schwach.some(x => x.t === vt) ? "Hier waren noch ein paar Fragen knifflig." : "Dieses Thema hat besonders interessiert."} Lest gemeinsam die Wissenskarten in der Bibliothek und stellt euch danach gegenseitig eine Frage.</p>
      ${libOk(vt) ? `<button type="button" class="xel-btn hell" data-xel-lib="${h(vt)}">In der Bibliothek öffnen</button>` : ""}`
      : `<p>Sucht euch zusammen ein Thema in der Bibliothek aus, das euch beide neugierig macht, und lest die Wissenskarten gemeinsam.</p>
      <button type="button" class="xel-btn hell" data-xel-lib="">Zur Bibliothek</button>`}</div>
  </section>`;
}
function tippsHTML(lesen, zu){
  let pause = null; try{ pause = window.EP_TRUHE ? !!window.EP_TRUHE.pauseAn() : null; }catch(e){}
  const hilfe = (() => { try{ return X.liste().find(m => m.id === "hilfen") || null; }catch(e){ return null; } })();
  return `<section class="xel-karte xel-ecke" aria-labelledby="xelEcke">
    <details class="xel-mehr"${zu ? "" : " open"}><summary><h2 id="xelEcke">👪 Eltern-Ecke</h2></summary>
    <ul class="xel-tipps">
      <li><b>Kurz und regelmässig.</b> Ein paar Minuten an mehreren Tagen helfen oft mehr als eine lange Sitzung.</li>
      <li><b>Gemeinsam lesen.</b> Lasst euch eine Wissenskarte vorlesen und erzählt euch, was ihr Neues gelernt habt.</li>
      <li><b>Neugier loben.</b> Ein «Erzähl mir mehr darüber!» motiviert oft mehr als Punkte.</li>
      <li><b>Fehler sind Lernchancen.</b> Unter «Fehler üben» kommen falsche Fragen wieder, bis sie zweimal richtig sitzen.</li>
      <li><b>Pausen.</b> easyplay erinnert nach 30 Minuten aktiver Nutzung freundlich an eine Pause${lesen || pause === null ? "." : pause ? `. Die Erinnerung ist auf diesem Gerät <b>eingeschaltet</b>.` : `. Die Erinnerung ist auf diesem Gerät <b>ausgeschaltet</b>.`}
        ${!lesen && pause === false ? `<br><button type="button" class="xel-btn klein" data-xel-pause="1">Pausen-Erinnerung einschalten</button>` : ""}</li>
      <li><b>Lesehilfen.</b> ${hilfe ? `In der Welt «${h(hilfe.titel)}» lässt sich das Lesen leichter machen.` : "Fragen und Wissenskarten lassen sich mit dem Knopf «Vorlesen» anhören."}
        ${!lesen && hilfe ? `<br><button type="button" class="xel-btn klein" data-xel-welt="hilfen">${h(hilfe.titel)} öffnen</button>` : ""}</li>
    </ul>
    <p class="xel-schutz">🔒 <b>Datenschutz:</b> Alle Zahlen werden nur auf diesem Gerät im Browser gespeichert. easyplay schickt diesen Bericht nirgendwohin. Ein geteilter Link enthält nur die Wochenzahlen${lesen ? "" : " (und den Vornamen nur, wenn du das einschaltest)"}, keine E-Mail-Adresse und kein Passwort. Die Zahlen stehen hinter dem #-Zeichen und werden beim Öffnen nicht an den Server geschickt. Es gibt keinen Vergleich mit anderen Kindern.</p>
    </details>
  </section>`;
}

/* ---------- Druckansicht ---------- */
function druckHTML(Rs, name, url){
  const teil = R => { const ab = R.abz.map(abzInfo).filter(Boolean);
    return `<h2>${R.laufend ? "Diese Woche" : "Woche"}: ${h(zeitraum(R))}${R.laufend ? " (bisher)" : ""}</h2>
    <p>${zusammenfassung(R, name)}</p>
    <table><tbody>
      <tr><th>Tage aktiv</th><td>${R.aktiv} von 7</td><th>Fragen beantwortet</th><td>${zahl(R.fragen)}</td></tr>
      <tr><th>Anteil richtig</th><td>${R.quote != null ? R.quote + " %" : "noch offen"}</td><th>Lernzeit</th><td>${R.fragen ? "etwa " + minText(R.min) : "0 Min."}</td></tr>
      <tr><th>Wiederholungsfragen gelernt</th><td>${zahl(R.geuebt)}</td><th>Erfahrungspunkte</th><td>+${zahl(R.xp)} XP${R.lv ? ` (Level ${R.lv[1]})` : ""}</td></tr>
    </tbody></table>
    <table class="xel-dt"><tr>${R.tage.map((x, i) => `<th>${WT[i]} ${datum(x.d).getDate()}.</th>`).join("")}</tr><tr>${R.tage.map(x => `<td>${x.f}</td>`).join("")}</tr></table>
    ${R.stark.length ? `<p><b>Das klappt schon gut:</b> ${R.stark.map(x => `${h(themaName(x.t))} (${x.q} %)`).join(", ")}</p>` : ""}
    ${R.schwach.length ? `<p><b>Hier lohnt sich Üben:</b> ${R.schwach.map(x => `${h(themaName(x.t))} (${x.q} %)`).join(", ")}</p>` : ""}
    ${ab.length ? `<p><b>Neue Abzeichen:</b> ${ab.map(a => h(a.name)).join(", ")}</p>` : ""}
    ${R.vorschlag ? `<p><b>Das könntet ihr gemeinsam anschauen:</b> ${h(themaName(R.vorschlag))} (Bibliothek in easyplay)</p>` : ""}`; };
  const qr = url ? QR.svg(url, "QR-Code zum Elternlink") : "";
  return `<div class="xel-dr">
    <header><img src="wordmark.webp" alt="easyplay"><div><h1>Wochenbericht für Eltern${name ? ": " + h(name) : ""}</h1><p>Erstellt am ${h(datum(heute()).toLocaleDateString("de-CH"))}</p></div></header>
    ${Rs.map(teil).join("")}
    <h2>Eltern-Ecke</h2>
    <ul><li>Kurz und regelmässig: ein paar Minuten an mehreren Tagen helfen oft mehr als eine lange Sitzung.</li>
      <li>Gemeinsam lesen: Wissenskarten vorlesen lassen und erzählen, was neu war.</li>
      <li>Neugier und Ausdauer loben, nicht nur Punkte.</li>
      <li>easyplay erinnert nach 30 Minuten aktiver Nutzung freundlich an eine Pause.</li></ul>
    <p class="xel-drklein">Datenschutz: Alle Zahlen stammen aus dem Browser des Kindes und werden auf keinem Server gespeichert. Kein Vergleich mit anderen Kindern.</p>
    ${qr ? `<div class="xel-drqr">${qr}<p>Diesen Bericht auf dem Handy öffnen:<br>QR-Code mit der Kamera scannen.</p></div>` : ""}
  </div>`;
}
function druckVorbereiten(Rs, name, url){
  let d = document.getElementById("xel-druck");
  if(!d){ d = document.createElement("div"); d.id = "xel-druck"; d.setAttribute("aria-hidden", "true"); document.body.appendChild(d); }
  d.innerHTML = druckHTML(Rs, name, url);
  document.documentElement.classList.add("xel-drucken");
}
function druckWeg(){ const d = document.getElementById("xel-druck"); if(d) d.remove(); document.documentElement.classList.remove("xel-drucken"); }
let DRUCK = null;   // () => [Berichte, Name, URL] der gerade offenen Ansicht
function meineSeite(){ try{ return S.screen === "x-eltern" || S.screen === "elternwoche"; }catch(e){ return false; } }
addEventListener("beforeprint", () => { try{ if(DRUCK && meineSeite()){ const [Rs, n, u] = DRUCK(); druckVorbereiten(Rs, n, u); } else druckWeg(); }catch(e){} });

/* ---------- E-Mail-Text ---------- */
function text(woche, mitName, url){
  const R = bericht(woche === undefined ? 0 : woche), n = mitName ? vorname() : "";
  const z = [`Hallo!`, ``, `Hier ist ${n ? "der Wochenbericht von " + n : "mein Wochenbericht"} aus easyplay (${zeitraum(R)}${R.laufend ? ", bisher" : ""}):`, ``,
    `Tage aktiv: ${R.aktiv} von 7`, `Fragen beantwortet: ${zahl(R.fragen)}`, `Anteil richtig: ${R.quote != null ? R.quote + " %" : "noch offen"}`,
    `Lernzeit: ${R.fragen ? "etwa " + minText(R.min) : "0 Min."}`, `Wiederholungsfragen gelernt: ${zahl(R.geuebt)}`, `Erfahrungspunkte: +${zahl(R.xp)} XP`];
  if(R.stark.length) z.push(`Das klappt schon gut: ${R.stark.map(x => `${themaName(x.t)} (${x.q} %)`).join(", ")}`);
  if(R.schwach.length) z.push(`Hier lohnt sich Üben: ${R.schwach.map(x => `${themaName(x.t)} (${x.q} %)`).join(", ")}`);
  const ab = R.abz.map(abzInfo).filter(Boolean); if(ab.length) z.push(`Neue Abzeichen: ${ab.map(a => a.name).join(", ")}`);
  if(R.vorschlag) z.push(``, `Das könnten wir diese Woche gemeinsam anschauen: ${themaName(R.vorschlag)} (Bibliothek in easyplay)`);
  if(url) z.push(``, `Ganzer Bericht zum Anschauen:`, url);
  z.push(``, `(Die Zahlen stammen nur aus meinem Browser. easyplay speichert sie auf keinem Server.)`);
  return z.join("\n");
}

/* ---------- Seite «Für Eltern» (Welt) ---------- */
let WAHL = 0;
function renderWelt(box){
  merken();
  const R0 = bericht(0), R1 = bericht(-1), R = WAHL ? R1 : R0, mitName = nameZeigen(), name = mitName ? vorname() : "";
  const vor = WAHL ? bericht(-2) : R1, zu = (() => { try{ return matchMedia("(max-width:560px)").matches; }catch(e){ return false; } })();
  DRUCK = () => [[R0, R1], nameZeigen() ? vorname() : "", link()];
  box.innerHTML = `<div class="x-kopf xel-kopf"><span class="x-kopf-emo" aria-hidden="true">👪</span><div><h1>Für Eltern</h1><p>Dein Wochenbericht zum Teilen</p></div><img src="img/kids/duo-winken.webp" alt=""></div>
    <div class="xel-wahl" role="tablist" aria-label="Woche wählen">
      <button type="button" role="tab" class="xel-tab${WAHL ? "" : " an"}" aria-selected="${!WAHL}" data-xel-w="0">Diese Woche</button>
      <button type="button" role="tab" class="xel-tab${WAHL ? " an" : ""}" aria-selected="${!!WAHL}" data-xel-w="1">Letzte Woche</button>
    </div>
    <div class="xel-gitter">
      <div class="xel-links">${berichtHTML(R, {name, vor, id:"w", zu})}</div>
      <div class="xel-rechts">
        <section class="xel-karte xel-teilen" aria-labelledby="xelTeilen">
          <h2 id="xelTeilen">📤 Mit deinen Eltern teilen</h2>
          <p class="xel-leise2">Der Bericht enthält diese und letzte Woche. Ganz ohne Server.</p>
          ${vorname() ? `<label class="xel-check"><input type="checkbox" id="xelName"${mitName ? " checked" : ""}> Meinen Vornamen «${h(vorname())}» zeigen</label>` : ""}
          <div class="xel-knoepfe">
            <button type="button" class="xel-btn" data-xel-a="link">🔗 Link für Eltern</button>
            <button type="button" class="xel-btn" data-xel-a="mail">✉️ Per E-Mail senden</button>
            <button type="button" class="xel-btn" data-xel-a="druck">🖨️ Drucken / als PDF</button>
            <button type="button" class="xel-btn" data-xel-a="qr" aria-expanded="false" aria-controls="xelQr">📱 QR-Code</button>
          </div>
          <p class="xel-info" id="xelInfo" aria-live="polite"></p>
          <div class="xel-qr" id="xelQr" hidden></div>
        </section>
        ${tippsHTML(false, zu)}
      </div>
    </div>`;
  binden(box);
  box.querySelectorAll("[data-xel-w]").forEach(b => b.onclick = () => { WAHL = +b.dataset.xelW; ton("klick"); renderWelt(box); box.querySelector(`[data-xel-w="${WAHL}"]`)?.focus(); });
  const cb = box.querySelector("#xelName"); if(cb) cb.onchange = () => { LS.set(K.name, cb.checked); const q = box.querySelector("#xelQr"); if(q && !q.hidden) qrZeigen(q); };
  const info = box.querySelector("#xelInfo");
  box.querySelectorAll("[data-xel-a]").forEach(b => b.onclick = async () => {
    const a = b.dataset.xelA; ton("klick");
    if(a === "link"){
      const url = link();
      try{ if(navigator.share && matchMedia("(pointer:coarse)").matches){ await navigator.share({title:"easyplay Wochenbericht", url}); info.textContent = "Geteilt."; return; } }catch(e){ if(e && e.name === "AbortError") return; }
      try{ await navigator.clipboard.writeText(url); info.textContent = "Link kopiert. Schicke ihn deinen Eltern."; }
      catch(e){ info.innerHTML = `<label>Link zum Kopieren:<input class="xel-feld" readonly value="${h(url)}"></label>`; const f = info.querySelector("input"); f.focus(); f.select(); }
    }
    if(a === "mail"){
      const url = link(), m = "mailto:?subject=" + encodeURIComponent("easyplay Wochenbericht" + (nameZeigen() ? " von " + vorname() : "")) + "&body=" + encodeURIComponent(text(WAHL ? -1 : 0, nameZeigen(), url).replace(/\n/g, "\r\n"));
      info.textContent = "Dein E-Mail-Programm öffnet sich mit einem fertigen Text.";
      EP_ELTERN._letzteMail = m;
      location.href = m;
    }
    if(a === "druck"){ const [Rs, n, u] = DRUCK(); druckVorbereiten(Rs, n, u); setTimeout(() => { try{ window.print(); }catch(e){} }, 60); }
    if(a === "qr"){ const q = box.querySelector("#xelQr"); q.hidden = !q.hidden; b.setAttribute("aria-expanded", String(!q.hidden)); if(!q.hidden){ qrZeigen(q); q.scrollIntoView({block:"center", behavior:api.ruhig() ? "auto" : "smooth"}); } }
  });
  box.querySelectorAll("[data-xel-pause]").forEach(b => b.onclick = () => { try{ window.EP_TRUHE.pauseSetzen(true); api.toast("Pausen-Erinnerung ist eingeschaltet."); }catch(e){} renderWelt(box); });
  box.querySelectorAll("[data-xel-welt]").forEach(b => b.onclick = () => go("x-" + b.dataset.xelWelt));
}
function qrZeigen(q){
  const url = link(), s = QR.svg(url, "QR-Code zum Elternlink");
  q.innerHTML = s ? `${s}<p>Mit der Kamera eines Handys scannen, dann öffnet sich der Bericht.</p>` : `<p>Der Link ist zu lang für einen QR-Code.</p>`;
}
function binden(box){
  box.querySelectorAll("[data-xel-lib]").forEach(b => b.onclick = () => {
    const t = b.dataset.xelLib; ton("klick");
    try{ if(t && libOk(t)){ LIB.thema = t; S.libModus = true; document.documentElement.dataset.mode = "lib"; go("libthema"); return; } }catch(e){}
    try{ setLibModus(true); }catch(e){ go("home"); }
  });
}

/* ---------- Elternansicht aus dem Link (nur lesen) ---------- */
let ANSICHT = null, AWAHL = 0;
function renderAnsicht(){
  const app = document.getElementById("app"), d = ANSICHT; if(!app || !d) return;
  const R = d.w[AWAHL] || d.w[0], name = d.n, vor = AWAHL === 0 ? d.w[1] : null;
  DRUCK = () => [d.w, d.n, location.href];
  const tab = (W, i) => W.laufend ? "Diese Woche" : i === 0 ? "Woche bis " + datum(W.bis).toLocaleDateString("de-CH") : "Woche davor";
  app.innerHTML = `<div class="xseite xel-ansicht">
    <div class="x-kopf xel-kopf"><span class="x-kopf-emo" aria-hidden="true">👪</span><div><h1>${name ? "Wochenbericht von " + h(name) : "Wochenbericht"}</h1><p>Geteilt am ${h(datum(d.d).toLocaleDateString("de-CH"))} · nur zum Ansehen</p></div><img src="img/kids/duo-winken.webp" alt=""></div>
    ${d.w.length > 1 ? `<div class="xel-wahl" role="tablist" aria-label="Woche wählen">${d.w.map((W, i) => `<button type="button" role="tab" class="xel-tab${i === AWAHL ? " an" : ""}" aria-selected="${i === AWAHL}" data-xel-aw="${i}">${h(tab(W, i))}</button>`).join("")}</div>` : ""}
    <div class="xel-gitter">
      <div class="xel-links">${berichtHTML(R, {name, vor, id:"a"})}</div>
      <div class="xel-rechts">
        <section class="xel-karte xel-teilen"><h2>Hallo!</h2><p class="xel-leise2">${name ? h(name) : "Ihr Kind"} hat diesen Bericht mit Ihnen geteilt. Er zeigt den Stand vom ${h(datum(d.d).toLocaleDateString("de-CH"))}${d.se ? ` und eine Lernserie von ${d.se} ${d.se === 1 ? "Tag" : "Tagen"} am Stück` : ""}.</p>
          <div class="xel-knoepfe"><button type="button" class="xel-btn" data-xel-a="druck">🖨️ Drucken / als PDF</button><button type="button" class="xel-btn" data-xel-a="zu">Zu easyplay</button></div></section>
        ${tippsHTML(true)}
      </div>
    </div></div>`;
  binden(app);
  app.querySelectorAll("[data-xel-aw]").forEach(b => b.onclick = () => { AWAHL = +b.dataset.xelAw; renderAnsicht(); app.querySelector(`[data-xel-aw="${AWAHL}"]`)?.focus(); });
  app.querySelector('[data-xel-a="druck"]').onclick = () => { const [Rs, n, u] = DRUCK(); druckVorbereiten(Rs, n, u); setTimeout(() => { try{ window.print(); }catch(e){} }, 60); };
  app.querySelector('[data-xel-a="zu"]').onclick = () => { ANSICHT = null; try{ history.replaceState(null, "", location.pathname); }catch(e){} go("home"); };
}
const vorRender = window.render;
window.render = function(){
  if(typeof S !== "undefined" && S.screen === "elternwoche" && ANSICHT){ try{ renderNav(); }catch(e){} try{ delete document.body.dataset.xwelt; }catch(e){} renderAnsicht(); return; }
  const r = vorRender.apply(this, arguments);
  try{ if(!meineSeite()) druckWeg(); }catch(e){}
  try{ if(S.screen === "profil") requestAnimationFrame(profilKnopf); }catch(e){}
  return r;
};
function ansichtPruefen(){ const d = ausLink(); if(d){ ANSICHT = d; AWAHL = 0; go("elternwoche"); } }
addEventListener("hashchange", ansichtPruefen);
setTimeout(ansichtPruefen, 350);

/* Im Profil neben dem bestehenden Elternlink (lernen.js) einen Knopf zum Wochenbericht ergänzen */
function profilKnopf(){
  try{ const el = document.getElementById("elternProfil"); if(!el || el.querySelector(".xel-pk")) return;
    const row = el.querySelector(".row") || el;
    const b = document.createElement("button"); b.type = "button"; b.className = "big xel-pk"; b.textContent = "📅 Wochenbericht ansehen";
    b.onclick = () => go("x-eltern"); row.appendChild(b); }catch(e){}
}

/* ---------- Stil ---------- */
const css = document.createElement("style"); css.id = "ep-x-eltern";
css.textContent = `
.xel-kopf{background:linear-gradient(135deg,#2E4BEA,#5B4BF5 55%,#9B4DE0)}
.xel-wahl{display:inline-flex;gap:4px;padding:5px;border-radius:999px;background:rgba(15,20,48,.55);margin:0 0 14px;max-width:100%;flex-wrap:wrap;box-sizing:border-box}
.xel-tab{border:0;border-radius:999px;padding:9px 16px;font:inherit;font-weight:800;color:#fff;background:transparent;cursor:pointer;min-height:40px}
.xel-tab.an{background:#fff;color:#2E2A80}
.xel-tab:focus-visible,.xel-btn:focus-visible,.xel-check input:focus-visible{outline:3px solid #FFE34D;outline-offset:2px}
.xel-gitter{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(0,1fr);gap:16px;align-items:start}
.xel-links,.xel-rechts{display:flex;flex-direction:column;gap:16px;min-width:0}
.xel-karte{border-radius:26px;padding:20px 22px;color:#fff;box-shadow:0 14px 30px rgba(27,34,64,.22);box-sizing:border-box;min-width:0}
.xel-karte h2,.xel-karte h3,.xel-karte p,.xel-karte li,.xel-karte b,.xel-karte small,.xel-karte label{color:#fff}
.xel-haupt{background:linear-gradient(160deg,#1F2A6B,#3A2E8C 60%,#5A2E9C)}
.xel-zeit{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 12px}
.xel-zeit h2{margin:0;font-size:1.5rem}
.xel-zeit p{margin:0;opacity:.85;font-weight:700}
.xel-satz{margin:10px 0 14px;line-height:1.5;font-size:1.02rem}
.xel-kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.xel-kpi{border-radius:20px;padding:12px 12px 11px;display:flex;flex-direction:column;gap:2px;min-width:0;box-shadow:0 6px 14px rgba(0,0,0,.18)}
.xel-kpi-e{font-size:1.3rem;line-height:1}
.xel-kpi b{font-size:1.25rem;line-height:1.2;overflow-wrap:anywhere}
.xel-kpi small{font-size:.8rem;opacity:.95;line-height:1.25}
.xel-h3{margin:18px 0 8px;font-size:1.05rem}
.xel-tage{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
.xel-tag{display:flex;flex-direction:column;align-items:center;gap:3px}
.xel-bal{display:flex;align-items:flex-end;width:100%;max-width:44px;height:64px;border-radius:12px;background:rgba(255,255,255,.12);overflow:hidden}
.xel-bal i{display:block;width:100%;background:linear-gradient(180deg,#FFE34D,#FF9F1C);border-radius:10px 10px 0 0}
.xel-tag b{font-size:.85rem;min-height:1em}
.xel-tag small{font-size:.78rem;opacity:.85}
.xel-tag.heute small{background:#fff;color:#2E2A80;border-radius:999px;padding:0 6px;font-weight:800;opacity:1}
.xel-tag.zuk .xel-bal{background:rgba(255,255,255,.05);outline:1px dashed rgba(255,255,255,.25)}
.xel-zwei{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.xel-box{background:rgba(255,255,255,.1);border-radius:20px;padding:4px 14px 12px;min-width:0}
.xel-th{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}
.xel-th li{display:grid;grid-template-columns:auto 1fr auto;grid-template-areas:"e n q" "e s q";column-gap:8px;align-items:center}
.xel-th li>span:first-child{grid-area:e;font-size:1.2rem}
.xel-thn{grid-area:n;font-weight:800;overflow-wrap:anywhere;line-height:1.2}
.xel-th small{grid-area:s;opacity:.8;font-size:.78rem}
.xel-thq{grid-area:q;font-weight:900;border-radius:999px;padding:3px 9px;font-size:.88rem}
.xel-thq.gut{background:#1F9D55}
.xel-thq.ueben{background:#E58A1F}
.xel-leise{opacity:.85;font-size:.9rem;margin:4px 0}
.xel-leise2{opacity:.92;margin:6px 0 10px;line-height:1.45}
.xel-abz{display:flex;flex-wrap:wrap;gap:8px}
.xel-pille{background:rgba(255,255,255,.16);border-radius:999px;padding:6px 12px;font-weight:700;font-size:.9rem}
.xel-vorschlag{position:relative;display:flex;gap:14px;align-items:center;background:linear-gradient(135deg,#8A3B0C,#D97A1A)}
.xel-vorschlag h3{margin:0 0 6px;font-size:1.1rem}
.xel-vorschlag p{margin:0 0 10px;line-height:1.45}
.xel-vimg{width:110px;height:auto;flex:none;align-self:flex-end;margin:-6px 0 -20px -6px}
.xel-teilen{background:linear-gradient(135deg,#0B6E6A,#0FA968)}
.xel-teilen h2,.xel-ecke h2{margin:0;font-size:1.25rem}
.xel-check{display:flex;align-items:center;gap:10px;font-weight:700;margin:4px 0 10px;cursor:pointer}
.xel-check input{width:22px;height:22px;accent-color:#FFE34D;flex:none}
.xel-knoepfe{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.xel-btn{border:0;border-radius:16px;padding:11px 12px;min-height:46px;font:inherit;font-weight:800;color:#1B2240;background:#fff;cursor:pointer;box-shadow:0 4px 10px rgba(0,0,0,.15);text-align:center;line-height:1.2}
.xel-btn:hover{transform:translateY(-1px)}
.xel-btn.hell{background:#FFE34D}
.xel-btn.klein{display:inline-block;margin-top:6px;padding:7px 12px;min-height:36px;font-size:.88rem}
.xel-info{min-height:1.2em;margin:8px 0 0;font-weight:700;overflow-wrap:anywhere}
.xel-feld{display:block;width:100%;box-sizing:border-box;margin-top:4px;border-radius:12px;border:0;padding:8px;font:inherit;color:#1B2240}
.xel-qr{margin-top:10px;background:#fff;border-radius:20px;padding:12px;text-align:center}
.xel-qr p{color:#1B2240!important;margin:6px 0 0;font-size:.85rem}
.xel-qrsvg{width:min(320px,100%);height:auto;display:block;margin:0 auto}
.xel-ecke{background:linear-gradient(135deg,#B0216F,#E043B8)}
.xel-tipps{margin:10px 0 0;padding-left:18px;display:flex;flex-direction:column;gap:7px;line-height:1.4;font-size:.94rem}
.xel-schutz{margin:12px 0 0;background:rgba(15,20,48,.3);border-radius:16px;padding:10px 12px;font-size:.85rem;line-height:1.45}
.xel-pk{margin-left:8px}
#xel-druck{display:none}
.xel-mehr>summary{cursor:pointer;list-style:none;display:flex;align-items:center;gap:8px;font-weight:800;margin-top:14px;padding:8px 12px;border-radius:14px;background:rgba(255,255,255,.12)}
.xel-mehr>summary::-webkit-details-marker{display:none}
.xel-mehr>summary::after{content:"▾";margin-left:auto;transition:transform .2s}
.xel-mehr[open]>summary::after{transform:rotate(180deg)}
.xel-mehr>summary:focus-visible{outline:3px solid #FFE34D;outline-offset:2px}
.xel-ecke .xel-mehr>summary{margin-top:0;background:transparent;padding:0}
.xel-ecke .xel-mehr>summary h2{margin:0}
@media (min-width:561px){ .xel-haupt .xel-mehr>summary{display:none} }
@media (max-width:980px){ .xel-gitter{display:flex;flex-direction:column;align-items:stretch} .xel-links,.xel-rechts{display:contents}
  .xel-haupt{order:1} .xel-teilen{order:2} .xel-vorschlag{order:3} .xel-ecke{order:4} }
@media (max-width:560px){
  .xel-karte{padding:16px 14px;border-radius:22px}
  .xel-kpis{grid-template-columns:1fr 1fr;gap:8px}
  .xel-kpi{padding:10px;border-radius:16px}
  .xel-kpi b{font-size:1.08rem}
  .xel-zwei{grid-template-columns:1fr}
  .xel-bal{height:52px}
  .xel-vimg{width:80px;margin-bottom:-16px}
  .xel-zeit h2{font-size:1.3rem}
  .xel-tab{padding:8px 13px}
  .xel-wahl{margin-bottom:10px}
}
@media (max-width:370px){ .xel-knoepfe{grid-template-columns:1fr} .xel-vimg{display:none} }
@media print{
  html.xel-drucken body>*:not(#xel-druck){display:none!important}
  html.xel-drucken body{background:#fff!important;margin:0!important;padding:0!important}
  html.xel-drucken #xel-druck{display:block!important}
  #xel-druck .xel-dr{font:11pt/1.45 system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#000;max-width:none;padding:0}
  #xel-druck header{display:flex;align-items:center;gap:16px;border-bottom:2px solid #333;padding-bottom:8px;margin-bottom:6px}
  #xel-druck header img{height:34px;width:auto}
  #xel-druck h1{font-size:17pt;margin:0;color:#000}
  #xel-druck header p{margin:2px 0 0;color:#444}
  #xel-druck h2{font-size:13pt;margin:14px 0 4px;color:#000;break-after:avoid}
  #xel-druck p,#xel-druck li{color:#000;margin:4px 0}
  #xel-druck table{width:100%;border-collapse:collapse;margin:6px 0;break-inside:avoid}
  #xel-druck th,#xel-druck td{border:1px solid #999;padding:4px 6px;text-align:left;color:#000;font-size:10pt}
  #xel-druck th{background:#eee}
  #xel-druck .xel-dt th,#xel-druck .xel-dt td{text-align:center}
  #xel-druck .xel-drklein{font-size:9pt;color:#444}
  #xel-druck .xel-drqr{display:flex;align-items:center;gap:14px;margin-top:10px;break-inside:avoid}
  #xel-druck .xel-qrsvg{width:3.6cm;height:3.6cm;margin:0}
  @page{margin:1.5cm}
}
`;
document.head.appendChild(css);

/* ---------- Anmelden ---------- */
X.register({ id:"eltern", titel:"Für Eltern", text:"Dein Wochenbericht zum Zeigen, Mailen und Drucken", emo:"👪",
  farbe:"linear-gradient(135deg,#2E4BEA,#5B4BF5 55%,#9B4DE0)", reihe:90,
  render(box){ renderWelt(box); } });

if(document.readyState === "complete") setTimeout(merken, 800); else addEventListener("load", () => setTimeout(merken, 800));

const EP_ELTERN = window.EP_ELTERN = { bericht, link, text, qr:(t) => QR.svg(t), oeffne:() => go("x-eltern"),
  _qr:QR, _druck:() => { if(DRUCK){ const [Rs, n, u] = DRUCK(); druckVorbereiten(Rs, n, u); } }, _wocheTage:wocheTage };
})();
