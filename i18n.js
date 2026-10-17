/* easyplay: Sprache (Deutsch / Français / Italiano)
   Übersetzt die Oberfläche zur Laufzeit, ohne den bestehenden Code umzuschreiben:
   - Wörterbuch DE → FR/IT in welten/i18n/ui-fr.json und ui-it.json
       {"w": {"Deutsch": "Übersetzung", "# Fragen": "# questions", "Deine Antwort: *": "Ta réponse : *"}, "r": [["^regex$", "Ersatz $1"]]}
       #  steht für eine Zahl (in der Übersetzung der Reihe nach, oder #1, #2 … für eine andere Reihenfolge)
       *  steht für beliebigen Text, der wenn möglich ebenfalls übersetzt wird (*1, *2 … für eine andere Reihenfolge)
   - Ein MutationObserver ersetzt sichtbare Texte (Textknoten, placeholder, aria-label, title, alt).
   - Quizfragen: welten/i18n/index.json listet die Dateien pro Sprache, z. B. welten/i18n/fr/q-1.json
       { "<nr>": {"q": "...", "a": ["richtig","falsch","falsch","falsch"], "e": "...", "m": "..."} }
     nr = Feld nr der Fragen aus fragen-*.json; a in derselben Reihenfolge wie im Original (a[0] ist richtig).
     Die Quizdaten bleiben deutsch (Statistik, Duell-IDs, Fehler üben), übersetzt wird nur die Anzeige.
   - Bei Deutsch passiert nichts (kein Observer).
   API: window.EP_I18N = { sprache(), setze(l), tr(text), frage(f), hatFrage(f), anzahl(l), nurUebersetzt(an?) }
   Ereignis: document "ep:sprache" detail {sprache} nach jedem Wechsel.
   Speicher: ep-x-i18n-sprache, ep-x-i18n-gefragt, ep-x-i18n-nur, ep-x-i18n-cache-<l> (Wörterbuch-Zwischenspeicher) */
(function(){
"use strict";
if(window.EP_I18N) return;

const BASIS = "welten/i18n/";
const K = { spr:"ep-x-i18n-sprache", gefragt:"ep-x-i18n-gefragt", nur:"ep-x-i18n-nur", cache:"ep-x-i18n-cache-" };
const SPRACHEN = ["de", "fr", "it"];
const INFO = {
  de:{ name:"Deutsch", kurz:"DE", lang:"de-CH", hallo:"Hoi!" },
  fr:{ name:"Français", kurz:"FR", lang:"fr-CH", hallo:"Salut !" },
  it:{ name:"Italiano", kurz:"IT", lang:"it-CH", hallo:"Ciao!" }
};
/* Fahnen als SVG (Emoji-Fahnen fehlen unter Windows) */
const FAHNE = {
  de:`<rect width="30" height="10" fill="#1A1A1A"/><rect y="10" width="30" height="10" fill="#DD0000"/><rect y="20" width="30" height="10" fill="#FFCE00"/>`,
  fr:`<rect width="10" height="30" fill="#0055A4"/><rect x="10" width="10" height="30" fill="#FFFFFF"/><rect x="20" width="10" height="30" fill="#EF4135"/>`,
  it:`<rect width="10" height="30" fill="#009246"/><rect x="10" width="10" height="30" fill="#FFFFFF"/><rect x="20" width="10" height="30" fill="#CE2B37"/>`
};
const fahne = (l, cls) => `<span class="xui-fl${cls ? " " + cls : ""}" aria-hidden="true"><svg viewBox="0 0 30 30" focusable="false">${FAHNE[l] || ""}</svg></span>`;
/* Eigene Texte dieses Moduls in allen Sprachen (werden nicht vom Wörterbuch angefasst) */
const T = {
  de:{ knopf:"Sprache wählen", menu:"Sprache", mehr:"Mehr zur Sprache", zurueck:"Zurück" },
  fr:{ knopf:"Choisir la langue", menu:"Langue", mehr:"Plus d’options", inhalt:"Ce contenu est encore en allemand.",
       bald:"Bientôt en français ! Ce thème n’a pas encore de questions traduites.", deutsch:"Jouer en allemand", zurueck:"Retour",
       baldThema:"Bientôt en français ! Ce thème n’a pas encore de questions traduites. Tu peux jouer en allemand.",
       frage:"Auch auf Français?", ja:"Oui, en français", nein:"Nein danke" },
  it:{ knopf:"Scegli la lingua", menu:"Lingua", mehr:"Altre opzioni", inhalt:"Questo contenuto è ancora in tedesco.",
       bald:"Presto in italiano! Questo tema non ha ancora domande tradotte.", deutsch:"Gioca in tedesco", zurueck:"Indietro",
       baldThema:"Presto in italiano! Questo tema non ha ancora domande tradotte. Puoi giocare in tedesco.",
       frage:"Auch auf Italiano?", ja:"Sì, in italiano", nein:"Nein danke" }
};

const LS = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};
const hx = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));

let L = LS.get(K.spr, "de"); if(!SPRACHEN.includes(L)) L = "de";
const LANG_ORIG = document.documentElement.getAttribute("lang") || "de-CH";

/* =================== Wörterbuch =================== */
const NUM = /\d+(?:['’.,]\d+)*/g;
const NUMS = "\\d+(?:['’.,]\\d+)*";
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const norm = s => String(s).replace(/­/g, "").replace(/\s+/g, " ").trim();
const WB = {};          // l → {map:Map, tpl:[{re, out, typ}], rx:[[RegExp, out]], cache:Map}

function baue(l, daten){
  const map = new Map(), tpl = [], rx = [];
  const w = (daten && daten.w) || {};
  for(const k of Object.keys(w)){
    const v = w[k]; if(typeof v !== "string") continue;
    const nk = norm(k);
    if(nk.includes("*")){
      const typ = [];
      const src = nk.split(/(\*|#)/).map(p => { if(p === "*"){ typ.push("*"); return "(.+?)"; } if(p === "#"){ typ.push("#"); return "(" + NUMS + ")"; } return reEsc(p); }).join("");
      const teile = nk.split(/[*#]/);
      tpl.push({ re:new RegExp("^" + src + "$", "u"), out:v, typ, len:nk.replace(/[*#]/g, "").length, vorn:teile[0], hinten:teile[teile.length - 1] });
    } else map.set(nk, v);
  }
  tpl.sort((a, b) => b.len - a.len);
  for(const r of (daten && daten.r) || []){ try{ rx.push([new RegExp(r[0], "u"), r[1]]); }catch(e){} }
  WB[l] = { map, tpl, rx, cache:new Map() };
}

/* Fragen: nr → Übersetzung (pro Sprache) und Text-Karte Deutsch → Übersetzung (aktive Sprache) */
const FQ = { nr:{}, text:new Map(), stand:"", laden:{}, geladen:{} };

const AFF_L = /^[\s\p{Extended_Pictographic}\p{So}\p{Sm}\p{Sk}‍️⃣›‹•·…←→↑↓▶◀✓✔✕+\-−]+/u;
const AFF_R = /[\s\p{Extended_Pictographic}\p{So}\p{Sm}\p{Sk}‍️⃣›‹•·…←→↑↓▶◀✓✔✕]+$/u;
const hatBuchstaben = s => /\p{L}/u.test(String(s).replace(/\uE000[^\uE001]*\uE001/g, ""));

function fuelle(out, nums, stars){
  let ni = 0, si = 0;
  return out.replace(/([#*])(\d?)/g, (m, z, d) => {
    if(z === "#"){ const v = d ? nums[+d - 1] : nums[ni++]; return v == null ? "" : v; }
    const v = d ? stars[+d - 1] : stars[si++]; return v == null ? "" : v;
  });
}

/* Übersetzt einen Text in die aktive Sprache. Gibt null zurück, wenn es keine Übersetzung gibt. */
function tr(s, tiefe){
  if(L === "de") return s;
  const W = WB[L]; if(!W) return null;
  const k = norm(s); if(!k) return s;
  const c = W.cache.get(k); if(c !== undefined) return c;
  const r = trRoh(k, W, tiefe || 0);
  if(W.cache.size > 30000) W.cache.clear();
  W.cache.set(k, r);
  return r;
}
const MARK = /[\uE000\uE001]/g;
const trAus = s => s == null ? null : String(s).replace(MARK, "");
/* Daten: «Do 1. Jan.», «Montag, 6. April 2026», «Sa 19. Sept. bis Montag, 21. September 2026» */
const WT = { Mo:0, Di:1, Mi:2, Do:3, Fr:4, Sa:5, So:6, Montag:0, Dienstag:1, Mittwoch:2, Donnerstag:3, Freitag:4, Samstag:5, Sonntag:6 };
const MONAT = { "Jan.":0, Januar:0, "Feb.":1, Februar:1, "März":2, "Mär.":2, April:3, "Apr.":3, Mai:4, Juni:5, Juli:6, "Aug.":7, August:7, "Sept.":8, September:8, "Okt.":9, Oktober:9, "Nov.":10, November:10, "Dez.":11, Dezember:11 };
const DATUM = "(?:(Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag|Mo|Di|Mi|Do|Fr|Sa|So),? )?(\\d{1,2})\\. ?(Jan\\.|Januar|Feb\\.|Februar|März|Mär\\.|April|Apr\\.|Mai|Juni|Juli|Aug\\.|August|Sept\\.|September|Okt\\.|Oktober|Nov\\.|November|Dez\\.|Dezember)(?![\\p{L}])(?: (\\d{4}))?";
const RE_SPANNE = new RegExp(DATUM + " bis " + DATUM, "gu"), RE_DATUM = new RegExp(DATUM, "gu");
const RE_MBIS = /(?<![\p{L}])(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember) bis (Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)(?![\p{L}])/gu;
const RE_TAGE = /(?<![\d.])(\d{1,2})\. bis (\d{1,2})\. ?(Jan\.|Januar|Feb\.|Februar|März|Mär\.|April|Apr\.|Mai|Juni|Juli|Aug\.|August|Sept\.|September|Okt\.|Oktober|Nov\.|November|Dez\.|Dezember)(?![\p{L}])(?: (\d{4}))?/gu;
const DZ = {
  fr:{ wk:["lun.","mar.","mer.","jeu.","ven.","sam.","dim."], wl:["lundi","mardi","mercredi","jeudi","vendredi","samedi","dimanche"],
       mk:["janv.","févr.","mars","avr.","mai","juin","juil.","août","sept.","oct.","nov.","déc."], ml:["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"],
       tag:d => d === 1 ? "1er" : String(d), spanne:(a, b) => "du " + a + " au " + b },
  it:{ wk:["lun","mar","mer","gio","ven","sab","dom"], wl:["lunedì","martedì","mercoledì","giovedì","venerdì","sabato","domenica"],
       mk:["gen.","feb.","mar.","apr.","mag.","giu.","lug.","ago.","set.","ott.","nov.","dic."], ml:["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"],
       tag:d => d === 1 ? "1°" : String(d), spanne:(a, b) => "da " + a + " a " + b }
};
function datum(wt, tag, mon, jahr){
  const z = DZ[L]; if(!z) return null;
  const w = wt ? (wt.length > 2 ? z.wl[WT[wt]] : z.wk[WT[wt]]) : "";
  const m = /\./.test(mon) || mon === "Mär." ? z.mk[MONAT[mon]] : z.ml[MONAT[mon]];
  return (w ? w + " " : "") + z.tag(+tag) + " " + m + (jahr ? " " + jahr : "");
}
function datenErsetzen(k){
  if(!DZ[L]) return k;
  let out = k.replace(RE_TAGE, (x, t1, t2, m, j) => "\uE000" + DZ[L].spanne(DZ[L].tag(+t1), datum(null, t2, m, j)) + "\uE001");
  out = out.replace(RE_MBIS, (x, a, b) => { const z = DZ[L], ma = z.ml[MONAT[a]], mb = z.ml[MONAT[b]];
    return "\uE000" + (L === "fr" ? (/^[aeiouéo]/i.test(ma) ? "d’" : "de ") + ma + " à " + mb : "da " + ma + " a " + mb) + "\uE001"; });
  out = out.replace(RE_SPANNE, (x, w1, t1, m1, j1, w2, t2, m2, j2) => "\uE000" + DZ[L].spanne(datum(w1, t1, m1, j1), datum(w2, t2, m2, j2)) + "\uE001");
  out = out.replace(RE_DATUM, (x, w, t, m, j) => "\uE000" + datum(w, t, m, j) + "\uE001");
  return out;
}
function trRoh(k, W, tiefe){
  let v = W.map.get(k); if(v != null) return v;
  v = FQ.text.get(k); if(v != null) return v;
  if(!hatBuchstaben(k) || /^\uE000[^\uE000\uE001]*\uE001$/.test(k)) return k;
  // Zahlen als Platzhalter
  if(/\d/.test(k)){
    const nums = k.match(NUM) || [];
    const t = W.map.get(k.replace(NUM, "#"));
    if(t != null) return fuelle(t, nums, []);
  }
  if(!k.includes("\uE000") && (/\d\. ?[A-ZÄ]/.test(k) || RE_MBIS.test(k))){ RE_MBIS.lastIndex = 0; const k2 = datenErsetzen(k); if(k2 !== k) return tr(k2, tiefe); }
  if(tiefe > 3 || k.length > 220) return null;     // lange Texte: nur genaue Einträge
  // Emoji, Pfeile usw. vorne und hinten abtrennen
  const ml = k.match(AFF_L), mr = k.match(AFF_R);
  if((ml || mr) && !(ml && mr && ml[0].length + mr[0].length >= k.length)){
    const a = ml ? ml[0] : "", b = mr ? mr[0] : "";
    const kern = k.slice(a.length, k.length - b.length);
    if(kern && kern !== k && hatBuchstaben(kern)){ const t = tr(kern, tiefe + 1); if(t != null) return a + t + b; }
  }
  // Vorlagen mit * (und #)
  for(const p of W.tpl){
    if(!k.startsWith(p.vorn) || !k.endsWith(p.hinten) || k.length < p.len) continue;
    const m = p.re.exec(k); if(!m) continue;
    const nums = [], stars = [];
    p.typ.forEach((t, i) => { const g = m[i + 1]; if(t === "#") nums.push(g); else { const x = hatBuchstaben(g) ? tr(g, tiefe + 1) : g; stars.push(x == null ? g : x); } });
    return fuelle(p.out, nums, stars);
  }
  for(const [re, out] of W.rx){ if(re.test(k)) return k.replace(re, out); }
  // Aufzählungen: alle Teile müssen übersetzbar sein
  for(const sep of [" · ", " | ", ", ", " / "]){
    if(!k.includes(sep)) continue;
    const teile = k.split(sep); if(teile.length > 8) continue; const neu = [];
    for(const t of teile){ const x = t.trim() ? (hatBuchstaben(t) ? tr(t, tiefe + 1) : t) : t; if(x == null){ neu.length = 0; break; } neu.push(x); }
    if(neu.length === teile.length) return neu.join(sep);
  }
  // «Titel: Text»
  const dp = k.match(/^(.+?):\s(.+)$/);
  if(dp){ const a = tr(dp[1], tiefe + 1), b = tr(dp[2], tiefe + 1); if(a != null && b != null) return a + (L === "fr" ? " : " : ": ") + b; }
  // mehrere Sätze: jeder Satz einzeln (alle müssen übersetzbar sein)
  const saetze = k.match(/[^.!?]+(?:[.!?]+|$)/g);
  if(saetze && saetze.length > 1 && saetze.length <= 6 && !k.includes("\uE000")){
    const neu = []; for(const x of saetze){ const y = x.trim(); if(!y) continue; const t = hatBuchstaben(y) ? tr(y, tiefe + 1) : y; if(t == null) return null; neu.push(t); }
    return neu.join(" ");
  }
  return null;
}

/* =================== Laden =================== */
const ladeVersprechen = {};
function ladeWB(l, frisch){
  if(l === "de") return Promise.resolve(true);
  if(ladeVersprechen[l] && !frisch) return ladeVersprechen[l];
  ladeVersprechen[l] = fetch(BASIS + "ui-" + l + ".json", {cache:"no-cache"}).then(r => r.ok ? r.text() : null).then(txt => {
    if(!txt) return !!WB[l];
    let alt = null; try{ alt = localStorage.getItem(K.cache + l); }catch(e){}
    if(alt === txt && WB[l]) return true;
    let d = null; try{ d = JSON.parse(txt); }catch(e){ return !!WB[l]; }
    const hatteSchon = !!WB[l];
    baue(l, d);
    try{ localStorage.setItem(K.cache + l, txt); }catch(e){}
    if(l === L && hatteSchon) neuUebersetzen();
    return true;
  }).catch(() => !!WB[l]);
  return ladeVersprechen[l];
}
function ausCache(l){
  if(l === "de" || WB[l]) return true;
  try{ const txt = localStorage.getItem(K.cache + l); if(txt){ baue(l, JSON.parse(txt)); return true; } }catch(e){}
  return false;
}

/* ---------- Fragen ---------- */
let INDEX = null;
function ladeIndex(){
  if(!INDEX) INDEX = fetch(BASIS + "index.json", {cache:"no-cache"}).then(r => r.ok ? r.json() : {}).catch(() => ({}));
  return INDEX;
}
function ladeFragen(l){
  if(l === "de") return Promise.resolve();
  if(FQ.laden[l]) return FQ.laden[l];
  FQ.laden[l] = ladeIndex().then(idx => {
    const liste = Array.isArray(idx && idx[l]) ? idx[l] : [];
    return Promise.all(liste.map(f => fetch(BASIS + l + "/" + f, {cache:"no-cache"}).then(r => r.ok ? r.json() : null).catch(() => null)));
  }).then(teile => {
    const nr = FQ.nr[l] || (FQ.nr[l] = new Map());
    (teile || []).forEach(t => { if(!t || typeof t !== "object") return; for(const k of Object.keys(t)){ const x = t[k]; if(x && typeof x.q === "string" && Array.isArray(x.a) && x.a.length >= 2) nr.set(+k, x); } });
    FQ.geladen[l] = true; FQ.stand = "";
    if(l === L){ fragenTexte(true); neuUebersetzen(); }
  });
  return FQ.laden[l];
}
function alleFr(){ try{ return typeof alleFragen === "function" ? alleFragen() : FRAGEN; }catch(e){ try{ return FRAGEN; }catch(e2){ return []; } } }
const ohne = s => { try{ return typeof ohneStrich === "function" ? ohneStrich(s) : s; }catch(e){ return s; } };
function trFrage(f){ if(L === "de" || !f) return null; const m = FQ.nr[L]; if(!m || !m.size) return null; const n = +f.nr || 0; return n ? (m.get(n) || null) : null; }
/* Karte Deutsch → Übersetzung für alle Fragen mit Übersetzung (neu, wenn sich FRAGEN ändert) */
function fragenTexte(zwingen){
  if(L === "de") return;
  const m = FQ.nr[L]; if(!m || !m.size){ FQ.text = new Map(); return; }
  let fr = []; try{ fr = FRAGEN; }catch(e){}
  let ex = 0; try{ ex = S.extra ? S.extra.length : 0; }catch(e){}
  const stand = L + ":" + fr.length + ":" + (fr[0] && fr[0].nr) + ":" + m.size + ":" + ex;
  if(!zwingen && stand === FQ.stand) return;
  FQ.stand = stand;
  const t = new Map();
  for(const f of alleFr()){
    const x = f && f.nr ? m.get(+f.nr) : null; if(!x) continue;
    if(f.q && x.q) t.set(norm(f.q), ohne(x.q));
    if(Array.isArray(f.a)) f.a.forEach((a, i) => { if(x.a[i] != null && a != null){ const k = norm(a); if(k.length > 3 && !WB[L]?.map.has(k) && (!t.has(k) || i === 0)) t.set(k, ohne(String(x.a[i]))); } });
    if(f.e && x.e) t.set(norm(f.e), ohne(x.e));
    if(f.m && x.m) t.set(norm(f.m), ohne(x.m));
  }
  FQ.text = t;
  if(WB[L]) WB[L].cache.clear();
}

/* Kontext: Fragen des laufenden Quiz haben Vorrang (gleiche deutsche Antwort kann je nach Frage anders heissen) */
const KTX = new Map();
function kontext(){
  KTX.clear();
  if(L === "de") return;
  try{
    const Q = S.quiz; if(!Q || !Array.isArray(Q.list) || !["quiz", "done"].includes(S.screen)) return;
    const reihe = [...Q.list]; const cur = Q.list[Q.i]; if(cur) reihe.push(cur);
    for(const f of reihe){ const x = trFrage(f); if(!x) continue;
      if(f.q && x.q) KTX.set(norm(f.q), ohne(x.q));
      (f.a || []).forEach((a, i) => { if(a != null && x.a[i] != null) KTX.set(norm(a), ohne(String(x.a[i]))); });
      if(f.e && x.e) KTX.set(norm(f.e), ohne(x.e)); if(f.m && x.m) KTX.set(norm(f.m), ohne(x.m)); }
  }catch(e){}
}

/* =================== DOM übersetzen =================== */
const TXT = new WeakMap();   // Textknoten → {o: Original, t: übersetzt}
const ATT = new WeakMap();   // Element → {attr: {o, t}}
const ATTRS = ["placeholder", "aria-label", "title", "alt"];
const NEIN = "script,style,textarea,noscript,[translate=no],.xui-nein,[contenteditable=true],.spr-dwort,.spr-fwort,.spr-dh,.spr-mk-fremd,.spr-mk-vorne small,.spr-bsp,.spr-k-hinten small,.wkq,.wka,.wke";
let langerText = false;      // gab es auf dieser Seite einen langen, nicht übersetzten Text?

const aus = el => !el || !!el.closest(NEIN);
function textKnoten(n){
  const d = n.data; if(!d || d.length > 6000) return;
  const p = n.parentElement; if(!p || aus(p)) return;
  const rec = TXT.get(n); if(rec && rec.t === d) return;
  const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(d); const kern = m[2];
  if(!kern || kern.length < 2 || !hatBuchstaben(kern)) return;   // einzelne Buchstaben (A B C D) nie
  const ant = p.closest(ANTW);
  const t = (KTX.size && KTX.get(norm(kern))) || (ant && !frageDa(ant) ? null : trAus(tr(kern)));
  if(t == null && ant) return;
  if(t == null){ if(kern.length > 110 && p.closest("#app")) langerText = true; return; }
  if(t === kern) return;
  const neu = m[1] + t + m[3];
  TXT.set(n, {o:d, t:neu}); n.data = neu;
}
/* Antworten nur übersetzen, wenn die zugehörige Frage übersetzt ist (sonst gemischte Sprachen) */
const ANTW = ".answers,.spants,.ropts";
const FRAGE_SEL = ".question,.spfrage p,.rfrage";
function frageDa(ant){
  const box = ant.closest(".card,.sphalb,.reel,.xseite,#app") || ant.parentElement; if(!box) return true;
  const q = box.querySelector(FRAGE_SEL); if(!q) return true;
  const w = document.createTreeWalker(q, NodeFilter.SHOW_TEXT); let n;
  while((n = w.nextNode())){ if(n.data.trim()) return TXT.has(n); }
  return true;
}
function attribute(el){
  if(!el.getAttribute || aus(el)) return;
  for(const a of ATTRS){
    if(!el.hasAttribute(a)) continue;
    const v = el.getAttribute(a); if(!v || !hatBuchstaben(v)) continue;
    let rec = ATT.get(el); if(rec && rec[a] && rec[a].t === v) continue;
    const t = trAus(tr(v)); if(t == null || t === norm(v)) continue;
    if(!rec){ rec = {}; ATT.set(el, rec); }
    rec[a] = {o:v, t}; el.setAttribute(a, t);
  }
}
const FILTER = { acceptNode(n){ if(n.nodeType === 1) return /^(SCRIPT|STYLE|TEXTAREA|NOSCRIPT)$/.test(n.tagName) || n.getAttribute("translate") === "no" || n.classList.contains("xui-nein") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; return NodeFilter.FILTER_ACCEPT; } };
function baum(root){
  if(!root) return;
  if(root.nodeType === 3){ textKnoten(root); return; }
  if(root.nodeType !== 1 && root.nodeType !== 11) return;
  if(root.nodeType === 1){ if(aus(root)) return; attribute(root); }
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, FILTER);
  let n; while((n = w.nextNode())){ if(n.nodeType === 3) textKnoten(n); else if(n.attributes && n.attributes.length) attribute(n); }
}
const TITEL = { o:document.title, t:null };
function zurueckAufDeutsch(){
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let n; while((n = w.nextNode())){
    if(n.nodeType === 3){ const r = TXT.get(n); if(r){ if(n.data === r.t) n.data = r.o; TXT.delete(n); } }
    else { const r = ATT.get(n); if(r){ for(const a of Object.keys(r)) if(n.getAttribute(a) === r[a].t) n.setAttribute(a, r[a].o); ATT.delete(n); } }
  }
  try{ if(TITEL.t && document.title === TITEL.t) document.title = TITEL.o; }catch(e){}
}
function titel(){ try{ if(L === "de") return; if(document.title === TITEL.t) return; const t = trAus(tr(document.title)); if(t && t !== document.title){ TITEL.o = document.title; TITEL.t = t; document.title = t; } }catch(e){} }

let MO = null, eigen = false;
const ZEIT = { ms:0, n:0 };
function verarbeite(recs){
  if(L === "de" || !WB[L]) return;
  const t0 = performance.now();
  eigen = true;
  try{
    for(const r of recs){
      if(r.type === "childList"){ r.addedNodes.forEach(n => { if(n.isConnected) baum(n); }); }
      else if(r.type === "characterData"){ if(r.target.isConnected) textKnoten(r.target); }
      else if(r.type === "attributes"){ if(r.target.isConnected) attribute(r.target); }
    }
  }catch(e){ console.warn("i18n", e); }
  if(MO) MO.takeRecords();
  eigen = false;
  ZEIT.ms += performance.now() - t0; ZEIT.n++;
  nachRender();
}
function beobachten(an){
  if(an && !MO){
    MO = new MutationObserver(recs => { if(!eigen) verarbeite(recs); });
    MO.observe(document.body, {childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:ATTRS});
  } else if(!an && MO){ MO.disconnect(); MO = null; }
}
function allesUebersetzen(){
  if(L === "de" || !WB[L]) return;
  eigen = true; langerText = false;
  try{ baum(document.body); titel(); }catch(e){ console.warn("i18n", e); }
  if(MO) MO.takeRecords();
  eigen = false;
  nachRender();
}
function neuUebersetzen(){ if(L === "de") return; eigen = true; zurueckAufDeutsch(); if(MO) MO.takeRecords(); eigen = false; allesUebersetzen(); }

/* nach jeder Änderung (gebündelt pro Bild): Knopf, Hinweise */
let rafAn = false;
function nachRender(){
  if(rafAn) return; rafAn = true;
  requestAnimationFrame(() => { rafAn = false; try{ knopfPlatz(); }catch(e){} try{ inhaltHinweis(); }catch(e){} try{ themaHinweis(); }catch(e){} });
}

/* =================== Sprache wechseln =================== */
function htmlLang(){ document.documentElement.setAttribute("lang", L === "de" ? LANG_ORIG : L); document.documentElement.dataset.xuiSprache = L; }
function setze(l, still){
  if(!SPRACHEN.includes(l)) return;
  const vorher = L;
  LS.set(K.spr, l); LS.set(K.gefragt, true);
  frageZu();
  if(vorher !== "de"){ eigen = true; zurueckAufDeutsch(); if(MO) MO.takeRecords(); eigen = false; }
  L = l; htmlLang();
  if(!still) try{ window.EP_SOUND?.play?.("klick"); }catch(e){}
  if(l === "de"){
    beobachten(false); FQ.text = new Map(); FQ.stand = "";
    document.querySelectorAll(".xui-hinweis,.xui-bald,.xui-dlg").forEach(e => e.remove());
    neuZeichnen(); knopfAktuell(); melden(); return;
  }
  const weiter = () => { fragenTexte(true); beobachten(true); neuZeichnen(); allesUebersetzen(); knopfAktuell(); melden(); };
  if(ausCache(l)){ weiter(); ladeWB(l, true); }
  else { document.documentElement.classList.add("xui-laden"); ladeWB(l).then(() => { document.documentElement.classList.remove("xui-laden"); if(L === l) weiter(); }); }
  ladeFragen(l);
}
function neuZeichnen(){ try{ if(typeof S !== "undefined" && S.quiz && S.screen === "quiz") delete S.quiz.__xui; }catch(e){} try{ if(typeof window.render === "function") window.render(); }catch(e){} }
function melden(){ try{ document.dispatchEvent(new CustomEvent("ep:sprache", {detail:{sprache:L}})); }catch(e){} }

/* =================== Quiz: übersetzte Fragen bevorzugen =================== */
const nurAn = () => LS.get(K.nur, true) !== false;
const hatTr = f => !!trFrage(f);
function mischen(a){ try{ return shuffle(a); }catch(e){ a = [...a]; for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; } }
const mitOpts = f => ({...f, opts:mischen(f.a.map((txt, i) => ({txt, ok:i === 0})))});
let deutschErlaubt = null;   // Quiz-Objekt, für das Deutsch gewählt wurde
function quizVorbereiten(){
  if(typeof S === "undefined" || S.screen !== "quiz" || L === "de") return;
  const Q = S.quiz; if(!Q || Q.__xui || !Array.isArray(Q.list) || !Q.list.length) return;
  if(!FQ.geladen[L]) return;          // Übersetzungen noch nicht da: beim nächsten Zeichnen nochmals
  Q.__xui = true;
  if(!nurAn() || deutschErlaubt === Q) return;
  if(Q.st && Q.st.some(x => x.picked != null)) return;   // schon begonnen
  const liste = Q.list, n = liste.length;
  const ja = liste.filter(hatTr);
  if(ja.length === n) return;
  const themen = new Set(liste.map(f => f.t)), drin = new Set(liste.map(f => f.q));
  let passend = alleFr().filter(f => f && f.nr && Array.isArray(f.a) && f.a.length === 4 && !drin.has(f.q) && themen.has(f.t) && hatTr(f));
  if(Q.zufall && passend.length < n - ja.length) passend = alleFr().filter(f => f && f.nr && Array.isArray(f.a) && f.a.length === 4 && !drin.has(f.q) && hatTr(f) && (() => { try{ return !!THEMA[f.t]; }catch(e){ return true; } })());
  let st = 0; try{ st = S.stufe; }catch(e){}
  passend = mischen(passend);
  if(st && st !== 4) passend.sort((a, b) => Math.abs(a.l - st) - Math.abs(b.l - st));
  const neu = [...ja, ...passend.slice(0, n - ja.length).map(mitOpts)];
  if(!neu.length || (Q.mode === "test" && neu.length < n)){ baldDialog(Q); return; }   // gewertete Tests nur vollständig
  Q.list = mischen(neu); Q.count = Q.list.length; Q.i = 0; delete Q.st;
}
function baldDialog(Q){
  document.querySelectorAll(".xui-dlg").forEach(e => e.remove());
  const t = T[L];
  const d = document.createElement("div"); d.className = "xui-dlg"; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("translate", "no");
  d.innerHTML = `<div class="xui-dlgk"><img src="img/kids/duo-winken.webp" alt="" class="xui-dlgimg"><p class="xui-dlgt">${hx(t.bald)}</p>
    <div class="xui-dlgr"><button type="button" class="xui-dk" data-x="de">${hx(t.deutsch)}</button><button type="button" class="xui-dk alt" data-x="back">${hx(t.zurueck)}</button></div></div>`;
  document.body.appendChild(d);
  d.querySelector('[data-x="de"]').onclick = () => { deutschErlaubt = Q; d.remove(); };
  d.querySelector('[data-x="back"]').onclick = () => { d.remove(); try{ go(S.thema && THEMA[S.thema.id] ? "mode" : "home"); }catch(e){ try{ go("home"); }catch(e2){} } };
  setTimeout(() => d.querySelector("button")?.focus(), 30);
}
/* Themenseite: Hinweis, wenn es noch keine übersetzten Fragen gibt */
function themaHinweis(){
  if(L === "de" || typeof S === "undefined") return;
  const app = document.getElementById("app"); if(!app || S.screen !== "mode" || !S.thema) return;
  if(app.querySelector(".xui-bald") || !FQ.geladen[L]) return;
  let n = 0; try{ n = pool(S.thema.id).filter(hatTr).length; }catch(e){ return; }
  if(n > 0) return;
  const p = document.createElement("p"); p.className = "xui-bald"; p.setAttribute("translate", "no"); p.setAttribute("role", "note");
  p.innerHTML = `<span aria-hidden="true">🕒</span> ${hx(T[L].baldThema)}`;
  const cr = app.querySelector(":scope > .crumbs"); if(cr) cr.after(p); else app.prepend(p);
}
/* Hinweis «Ce contenu est encore en allemand» bei langen deutschen Texten */
function inhaltHinweis(){
  const app = document.getElementById("app"); if(!app) return;
  const alt = app.querySelector(":scope > .xui-hinweis");
  if(L === "de" || !langerText){ if(alt) alt.remove(); return; }
  if(alt) return;
  const p = document.createElement("p"); p.className = "xui-hinweis"; p.setAttribute("translate", "no"); p.setAttribute("role", "note");
  p.innerHTML = `<span aria-hidden="true">🇩🇪</span> ${hx(T[L].inhalt)}`;
  const cr = app.querySelector(":scope > .crumbs");
  if(cr) cr.after(p); else app.prepend(p);
}

/* =================== Vorlesen in der gewählten Sprache =================== */
function stimme(l){
  try{
    const re = new RegExp("^" + l + "(\\b|-|_)", "i");
    const vs = speechSynthesis.getVoices().filter(v => re.test(v.lang)); if(!vs.length) return null;
    const pkt = v => (/natural|neural|online|premium|enhanced/i.test(v.name) ? 50 : 0) + (/[-_]CH/i.test(v.lang) ? 12 : 0) + (/google/i.test(v.name) ? 10 : 0) + (v.localService === false ? 5 : 0);
    return [...vs].sort((a, b) => pkt(b) - pkt(a))[0];
  }catch(e){ return null; }
}
function trSprechen(text){
  const s = String(text || "");
  const ganz = trAus(tr(s)); if(ganz != null && ganz !== norm(s)) return ganz;
  let out = s, geaendert = false;
  try{   // Kontext: aktuelle Quizfrage
    const Q = S.quiz, f = Q && Q.list && Q.list[Q.i], x = trFrage(f);
    if(f && x){
      const paare = [[f.q, x.q], [f.e, x.e], [f.m, x.m]];
      (f.a || []).forEach((a, i) => paare.push([a, x.a[i]]));
      paare.filter(p => p[0] && p[1]).sort((a, b) => String(b[0]).length - String(a[0]).length)
        .forEach(([d, t]) => { if(out.includes(d)){ out = out.split(d).join(ohne(t)); geaendert = true; } });
      const merke = tr("Merke:"); if(merke && out.includes("Merke:")) out = out.split("Merke:").join(merke);
    }
  }catch(e){}
  if(!geaendert){
    const saetze = s.match(/[^.!?]+[.!?]*/g) || [s]; let alle = true;
    const neu = saetze.map(x => { const t = trAus(tr(x.trim())); if(t == null && hatBuchstaben(x)) alle = false; return t == null ? x.trim() : t; });
    if(alle){ out = neu.join(" "); geaendert = true; }
  }
  return geaendert ? out.replace(/([?!…])\s*\./g, "$1") : null;
}
const vorSpeak = window.speakText;
if(typeof vorSpeak === "function"){
  window.speakText = function(text, btn){
    if(L === "de") return vorSpeak.apply(this, arguments);
    const t = trSprechen(text), v = stimme(L);
    if(t == null || !v) return vorSpeak.apply(this, arguments);   // keine Übersetzung oder keine Stimme: wie bisher deutsch
    try{ stopSpeak(); }catch(e){}
    const teile = String(t).match(/[^.!?]+[.!?]*/g) || [t];
    const ic = n => { try{ return ico(n); }catch(e){ return ""; } };
    teile.forEach((p, i) => {
      const u = new SpeechSynthesisUtterance(p.trim()); u.voice = v; u.lang = v.lang; u.rate = 1; u.pitch = 1.05; u.__xui = true;
      if(i === teile.length - 1) u.onend = u.onerror = () => { if(btn){ btn.classList.remove("on"); btn.innerHTML = `${ic("speaker")} Vorlesen`; } };
      speechSynthesis.speak(u);
    });
    if(btn){ btn.classList.add("on"); btn.innerHTML = `${ic("stop")} Stopp`; }
  };
}
/* Andere Ansagen (z. B. Live-Quiz) direkt über speechSynthesis.speak: nur wenn übersetzbar */
try{
  const ss = window.speechSynthesis;
  if(ss && typeof ss.speak === "function"){
    const vor = ss.speak.bind(ss);
    ss.speak = function(u){
      try{ if(L !== "de" && u && !u.__xui && /^de/i.test(u.lang || "de")){ const t = trSprechen(u.text), v = stimme(L); if(t != null && v){ u.text = t; u.voice = v; u.lang = v.lang; } } }catch(e){}
      return vor(u);
    };
  }
}catch(e){}
/* confirm/alert/prompt übersetzen */
["confirm", "alert", "prompt"].forEach(name => {
  const vor = window[name]; if(typeof vor !== "function") return;
  window[name] = function(msg, ...rest){ try{ if(L !== "de" && typeof msg === "string"){ const t = trAus(tr(msg)); if(t != null) msg = t; } }catch(e){} return vor.call(window, msg, ...rest); };
});

/* =================== Seite einhängen =================== */
const vorRender = window.render;
if(typeof vorRender === "function"){
  window.render = function(){
    if(L !== "de"){ try{ fragenTexte(false); }catch(e){} try{ quizVorbereiten(); }catch(e){ console.warn("i18n quiz", e); } kontext(); langerText = false; }
    const r = vorRender.apply(this, arguments);
    nachRender(); platzSpaeter();
    return r;
  };
}

/* =================== Sprachknopf =================== */
let knopfEl = null, menuEl = null;
function knopf(){
  if(knopfEl) return knopfEl;
  const b = document.createElement("button"); b.type = "button"; b.className = "xui-knopf"; b.setAttribute("translate", "no");
  b.setAttribute("aria-haspopup", "dialog"); b.setAttribute("aria-expanded", "false");
  b.onclick = e => { e.stopPropagation(); menuEl ? menuZu() : menuAuf(); };
  knopfEl = b; knopfAktuell(); return b;
}
function knopfAktuell(){
  if(!knopfEl) return;
  knopfEl.innerHTML = fahne(L) + `<span class="xui-kb" aria-hidden="true">${INFO[L].kurz}</span>`;
  knopfEl.setAttribute("aria-label", `${T[L].knopf}: ${INFO[L].name}`);
  knopfEl.title = "Deutsch · Français · Italiano";
  knopfEl.dataset.l = L;
  if(menuEl) menuInhalt();
}
function menuAuf(){
  menuZu(); try{ window.EP_SOUND?.play?.("klick"); }catch(e){}
  const m = document.createElement("div"); m.className = "xui-menu"; m.setAttribute("role", "dialog"); m.setAttribute("translate", "no");
  m.addEventListener("click", e => e.stopPropagation());
  document.body.appendChild(m); menuEl = m; menuInhalt(); menuLage();
  knopfEl && knopfEl.setAttribute("aria-expanded", "true");
  setTimeout(() => m.querySelector(".xui-wahl.an, .xui-wahl")?.focus(), 20);
}
function menuInhalt(){
  if(!menuEl) return;
  menuEl.setAttribute("aria-label", T[L].menu);
  menuEl.innerHTML = `<b class="xui-mt">🌐 ${hx(T[L].menu)}</b>
    <div role="radiogroup" aria-label="${hx(T[L].menu)}" class="xui-wl">${SPRACHEN.map(l => `<button type="button" role="radio" aria-checked="${l === L}" class="xui-wahl${l === L ? " an" : ""}" data-l="${l}" lang="${INFO[l].lang}">${fahne(l)}<span>${INFO[l].name}</span>${l === L ? "<em aria-hidden=\"true\">✓</em>" : ""}</button>`).join("")}</div>
    <button type="button" class="xui-mehr">${hx(T[L].mehr)} ›</button>`;
  menuEl.querySelectorAll(".xui-wahl").forEach(b => b.onclick = () => { const l = b.dataset.l; menuZu(); if(l !== L) setze(l); });
  menuEl.querySelector(".xui-mehr").onclick = () => { menuZu(); try{ go("x-sprache"); }catch(e){} };
  menuEl.addEventListener("keydown", e => {
    const bs = [...menuEl.querySelectorAll(".xui-wahl")]; const i = bs.indexOf(document.activeElement);
    if(i >= 0 && (e.key === "ArrowDown" || e.key === "ArrowUp")){ e.preventDefault(); bs[(i + (e.key === "ArrowDown" ? 1 : bs.length - 1)) % bs.length].focus(); }
  });
}
function menuZu(fokus){ if(menuEl){ menuEl.remove(); menuEl = null; knopfEl && knopfEl.setAttribute("aria-expanded", "false"); if(fokus) knopfEl?.focus(); } }
function menuLage(){
  if(!menuEl || !knopfEl) return;
  if(!knopfEl.isConnected){ menuZu(); return; }
  const r = knopfEl.getBoundingClientRect(), w = menuEl.offsetWidth, hh = menuEl.offsetHeight;
  const links = Math.max(10, Math.min(innerWidth - w - 10, r.left + r.width / 2 - w / 2));
  let oben = r.bottom + 8; if(oben + hh > innerHeight - 10) oben = Math.max(10, r.top - hh - 8);
  menuEl.style.left = links + "px"; menuEl.style.top = oben + "px";
}
document.addEventListener("click", () => menuZu());
document.addEventListener("keydown", e => { if(e.key === "Escape"){ if(menuEl) menuZu(true); } });
addEventListener("resize", () => { menuLage(); platzSpaeter(); });
addEventListener("scroll", menuLage, {passive:true});

/* Platz: neben dem Ton-Knopf von sound.js (davor eingefügt, damit sound.js seine Lage behält) */
function knopfPlatz(){
  const k = knopf();
  const ton = document.querySelector(".xs-knopf");
  const appAn = document.body.classList.contains("ep-app");
  let ort = null, art = "";
  if(ton && ton.isConnected && ton.parentNode && ton.dataset.ort){ ort = ton.parentNode; art = ton.dataset.ort; }
  else if(!appAn){ const nav = document.getElementById("nav"), mw = nav && nav.querySelector(":scope > .menuwrap"); if(mw && getComputedStyle(nav).display !== "none"){ ort = nav; art = "nav"; } }
  else { const app = document.getElementById("app"), gr = app && app.querySelector(".ap-gruss"), kz = app && app.querySelector(":scope > .ap-kz");
    if(gr && gr.parentNode && gr.querySelector(".ap-logo")){ ort = gr.parentNode; art = "gruss"; } else if(kz){ ort = kz; art = "kz"; } }
  if(!ort){ if(k.isConnected) k.remove(); menuZu(); return; }
  k.dataset.ort = art;
  const tonHier = ton && ton.parentNode === ort;
  if(art === "kz"){ if(tonHier){ if(k.previousElementSibling !== ton) ton.after(k); } else if(k.parentNode !== ort) ort.appendChild(k); }
  else if(tonHier){ if(k.nextElementSibling !== ton) ort.insertBefore(k, ton); }
  else if(art === "nav"){ const mw = ort.querySelector(":scope > .menuwrap"); if(k.nextElementSibling !== mw) ort.insertBefore(k, mw); }
  else if(art === "gruss"){ const gr = ort.querySelector(":scope > .ap-gruss"); if(gr && k.nextElementSibling !== gr) ort.insertBefore(k, gr); }
  if(art === "gruss") grussLage(k, tonHier ? ton : null); else { k.style.left = ""; k.style.top = ""; k.style.visibility = ""; }
  menuLage();
}
/* App-Startseite: Knopf absolut beim Logo, ohne Gruss, Logo und Ton-Knopf zu überdecken */
function grussLage(k, ton){
  const gr = k.parentNode && k.parentNode.querySelector(":scope > .ap-gruss"); if(!gr) return;
  const lg = gr.querySelector(".ap-logo"); if(!lg) return;
  const op = k.offsetParent; if(!op) return;
  const O = op.getBoundingClientRect();
  const icb = op === document.body && getComputedStyle(op).position === "static";
  const bx = icb ? -scrollX : O.left + op.clientLeft, by = icb ? -scrollY : O.top + op.clientTop;
  const ox = icb ? 0 : op.scrollLeft, oy = icb ? 0 : op.scrollTop;
  const pos = (x, y) => { k.style.left = Math.round(x - bx + ox) + "px"; k.style.top = Math.round(y - by + oy) + "px"; };
  const rechtecke = () => { const rs = []; gr.querySelectorAll(":scope > b, :scope > span").forEach(el => { const rg = document.createRange(); rg.selectNodeContents(el); rs.push(...rg.getClientRects()); });
    rs.push(lg.getBoundingClientRect()); if(ton && ton.isConnected) rs.push(ton.getBoundingClientRect()); return rs; };
  const stoesst = () => { const kr = k.getBoundingClientRect(); return kr.left < 4 || kr.right > innerWidth - 4 || kr.top < 0 || rechtecke().some(r => r.width && r.right > kr.left - 3 && r.left < kr.right + 3 && r.bottom > kr.top + 1 && r.top < kr.bottom - 1); };
  const kw = k.offsetWidth || 34, kh = k.offsetHeight || 34, L0 = lg.getBoundingClientRect();
  const T0 = ton && ton.isConnected && ton.style.visibility !== "hidden" ? ton.getBoundingClientRect() : null;
  const kand = [];
  if(T0 && T0.width){ kand.push([T0.left - kw - 6, T0.top + (T0.height - kh) / 2]); kand.push([T0.left + (T0.width - kw) / 2, T0.bottom + 6]); }
  else kand.push([L0.left - kw - 6, L0.top + (L0.height - kh) / 2]);
  kand.push([L0.right - kw - 2 - (T0 && T0.top > L0.bottom - 4 ? T0.width + 6 : 0), L0.bottom + 2]);
  kand.push([L0.left + 2, L0.bottom + 2]);
  for(const [x, y] of kand){ pos(x, y); if(!stoesst()){ k.style.visibility = ""; return; } }
  pos(kand[kand.length - 2][0], kand[kand.length - 2][1]); k.style.visibility = "";
}
/* sound.js setzt seinen Knopf zeitversetzt: kurz danach nochmals ausrichten */
let platzT = 0, platzT2 = 0;
function platzSpaeter(){ clearTimeout(platzT); clearTimeout(platzT2); platzT = setTimeout(knopfPlatz, 60); platzT2 = setTimeout(knopfPlatz, 420); }

/* =================== Erster Besuch: «Auch auf Français?» =================== */
let frageEl = null;
function frageZu(){ if(frageEl){ frageEl.remove(); frageEl = null; } }
function frageZeigen(){
  if(LS.get(K.gefragt, false) || LS.get(K.spr, null)) return;
  let nl = ""; try{ nl = String((navigator.languages && navigator.languages[0]) || navigator.language || "").toLowerCase(); }catch(e){}
  const l = nl.startsWith("fr") ? "fr" : nl.startsWith("it") ? "it" : ""; if(!l) return;
  const t = T[l];
  const d = document.createElement("div"); d.className = "xui-frage"; d.setAttribute("role", "dialog"); d.setAttribute("aria-label", t.frage); d.setAttribute("translate", "no");
  d.innerHTML = `<span class="xui-fi" aria-hidden="true">🌐</span><b>${hx(t.frage)}</b><button type="button" class="xui-ja" lang="${INFO[l].lang}">${hx(t.ja)}</button><button type="button" class="xui-nein-k" aria-label="${hx(t.nein)}" title="${hx(t.nein)}">✕</button>`;
  d.querySelector(".xui-ja").onclick = () => setze(l);
  d.querySelector(".xui-nein-k").onclick = () => { LS.set(K.gefragt, true); frageZu(); };
  document.body.appendChild(d); frageEl = d;
  requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add("an")));
}

/* =================== Welt «Sprache» im Entdecken-Menü =================== */
const anzahl = l => { const m = FQ.nr[l]; return m ? m.size : 0; };
function welt(box, api){
  const zeichnen = () => {
    const nur = nurAn();
    box.innerHTML = `<div class="x-kopf xui-kopf" style="background:linear-gradient(135deg,#2E5BFF,#8A3FE0)"><span class="x-kopf-emo" aria-hidden="true">🌐</span><div><h1>Sprache</h1><p>Spiel easyplay auf Deutsch, Französisch oder Italienisch.</p></div><img src="img/kids/duo-winken.webp" alt=""></div>
      <div class="xui-karten" role="radiogroup" aria-label="Sprache">${SPRACHEN.map(l => {
        const n = anzahl(l);
        return `<button type="button" role="radio" aria-checked="${l === L}" class="xui-karte xui-k-${l}${l === L ? " an" : ""}" data-l="${l}">
          ${fahne(l, "gross")}<b translate="no" lang="${INFO[l].lang}">${INFO[l].name}</b>
          <small translate="no" lang="${INFO[l].lang}">${hx(INFO[l].hallo)}</small>
          <span class="xui-kz">${l === "de" ? "Alle Fragen" : (FQ.geladen[l] ? (n ? `${n.toLocaleString("de-CH")} übersetzte Fragen` : "Fragen folgen bald") : "Fragen werden geladen …")}</span>
          ${l === L ? `<em class="xui-kh">✓ Aktiv</em>` : ""}</button>`; }).join("")}</div>
      <section class="xui-box">
        <label class="xui-schalter"><input type="checkbox" id="xuiNur" ${nur ? "checked" : ""}><span class="xui-sl" aria-hidden="true"></span>
          <span><b>Nur übersetzte Fragen</b><small>Im Quiz kommen nur Fragen, die es schon in deiner Sprache gibt. Gibt es zu einem Thema noch keine, kannst du auf Deutsch spielen.</small></span></label>
        <p class="xui-info">🔊 ${L === "de" ? "Vorlesen mit deutscher Stimme" : (stimme(L) ? "Vorlesen in deiner Sprache" : "Dieses Gerät hat keine Stimme in deiner Sprache, darum wird deutsch vorgelesen.")}</p>
        <p class="xui-info">📚 Bibliothek, Abenteuer-Geschichten und lange Erklärtexte gibt es vorerst nur auf Deutsch.</p>
      </section>`;
    box.querySelectorAll(".xui-karte").forEach(b => b.onclick = () => { const l = b.dataset.l; if(l !== L) setze(l); else api.ton("klick"); });
    const cb = box.querySelector("#xuiNur"); if(cb) cb.onchange = () => { LS.set(K.nur, cb.checked); api.ton("klick"); };
  };
  zeichnen();
  const offen = SPRACHEN.filter(l => l !== "de" && !FQ.geladen[l]);
  if(offen.length) Promise.all(offen.map(ladeFragen)).then(() => { if(box.isConnected) zeichnen(); });
}
function registrieren(){
  if(!window.EP_EXTRAS || typeof window.EP_EXTRAS.register !== "function") return;
  window.EP_EXTRAS.register({ id:"sprache", titel:"Sprache", text:"Deutsch, Français, Italiano", emo:"🌐", farbe:"linear-gradient(135deg,#2E5BFF,#8A3FE0)", reihe:95,
    hinweis(){ return L === "de" ? "" : INFO[L].kurz; },
    render:welt });
}

/* =================== Stil =================== */
const css = document.createElement("style"); css.id = "ep-x-i18n";
css.textContent = `
html.xui-laden #app{opacity:0}
.xui-knopf{position:relative;flex:none;display:inline-grid;place-items:center;width:44px;height:44px;padding:0;border-radius:50%;border:2px solid rgba(255,255,255,.55);background:rgba(15,20,48,.55);color:#fff;cursor:pointer;font:800 14px/1 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:.02em;box-shadow:0 6px 14px rgba(27,34,64,.25);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);transition:transform .15s}
.xui-knopf:hover{transform:scale(1.06)}
.xui-fl{position:relative;display:inline-block;flex:none;width:32px;height:32px;border-radius:50%;overflow:hidden;box-shadow:0 0 0 2px #fff,0 3px 8px rgba(0,0,0,.3)}
.xui-fl svg{display:block;width:100%;height:100%}
.xui-fl::after{content:"";position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle at 32% 25%,rgba(255,255,255,.55),rgba(255,255,255,0) 45%),radial-gradient(circle at 70% 85%,rgba(0,0,0,.18),rgba(0,0,0,0) 55%)}
.xui-fl.gross{width:46px;height:46px;box-shadow:0 0 0 3px #fff,0 4px 12px rgba(0,0,0,.3)}
.xui-knopf .xui-fl{width:100%;height:100%;box-shadow:none}
.xui-knopf{overflow:visible;padding:0!important;border:2.5px solid #fff!important;box-shadow:0 4px 12px rgba(10,12,40,.35)!important}
.xui-knopf .xui-kb{position:absolute;right:-7px;bottom:-5px;padding:1px 4px;border-radius:7px;background:#1B2240;color:#fff;font:800 9px/1.2 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:.03em;box-shadow:0 0 0 1.5px #fff}
.xui-knopf[data-ort=gruss] .xui-kb{font-size:8px;right:-6px;bottom:-4px}
#nav>.xui-knopf .xui-kb{font-size:11px;right:-4px;bottom:-3px}
.xui-wahl .xui-fl{width:30px;height:30px}

.xui-knopf:focus-visible{outline:3px solid #FFE34D;outline-offset:2px}
.xui-knopf>*{pointer-events:none}
.xui-knopf[data-ort=gruss]{position:absolute;z-index:6;width:34px;height:34px;margin:0;font-size:12px}
.xui-knopf[data-ort=kz]{margin-left:8px;width:40px;height:40px}
#nav>.xui-knopf{width:58px;height:58px;font-size:17px;border:2px solid var(--line,#E3E1F2);background:var(--surface,#fff);color:var(--ink,#1B2240);box-shadow:none;backdrop-filter:none;-webkit-backdrop-filter:none}
.xui-menu{position:fixed;z-index:10000;width:min(250px,calc(100vw - 20px));box-sizing:border-box;padding:12px;border-radius:22px;background:rgba(20,24,58,.96);color:#fff;box-shadow:0 18px 40px rgba(10,12,40,.45);display:grid;gap:8px;font:15px/1.25 system-ui,-apple-system,"Segoe UI",sans-serif}
.xui-mt{font-size:14px;opacity:.9;padding:2px 4px}
.xui-wl{display:grid;gap:6px}
.xui-wahl{display:flex;align-items:center;gap:10px;width:100%;min-height:46px;padding:6px 12px;border-radius:16px;border:2px solid transparent;background:rgba(255,255,255,.1);color:#fff;font:700 16px/1.2 system-ui,-apple-system,"Segoe UI",sans-serif;cursor:pointer;text-align:left}
.xui-wahl i{font-style:normal;display:inline-grid;place-items:center;width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.18);font-size:12px;font-weight:800}
.xui-wahl em{margin-left:auto;font-style:normal;color:#FFE34D}
.xui-wahl.an{border-color:#FFE34D;background:rgba(255,227,77,.16)}
.xui-wahl:hover{background:rgba(255,255,255,.18)}
.xui-wahl:focus-visible,.xui-mehr:focus-visible{outline:3px solid #FFE34D;outline-offset:2px}
.xui-mehr{border:0;background:none;color:#cfd6ff;font:600 14px/1.2 system-ui,-apple-system,"Segoe UI",sans-serif;padding:6px 4px;text-align:left;cursor:pointer;text-decoration:underline;text-underline-offset:3px}
.xui-frage{position:fixed;left:50%;bottom:calc(110px + env(safe-area-inset-bottom));transform:translate(-50%,20px);opacity:0;z-index:9999;display:flex;align-items:center;gap:8px;width:max-content;max-width:calc(100vw - 24px);box-sizing:border-box;padding:8px 8px 8px 14px;border-radius:999px;background:rgba(15,20,48,.88);color:#fff;box-shadow:0 12px 28px rgba(10,12,40,.35);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);font:15px/1.2 system-ui,-apple-system,"Segoe UI",sans-serif;transition:transform .3s,opacity .3s}
.xui-frage.an{transform:translate(-50%,0);opacity:1}
body:not(.ep-app) .xui-frage{bottom:24px}
.xui-frage b{white-space:nowrap}
.xui-ja{border:0;border-radius:999px;padding:9px 14px;background:#FFE34D;color:#1B2240;font:800 14px/1.1 system-ui,-apple-system,"Segoe UI",sans-serif;cursor:pointer;white-space:nowrap}
.xui-nein-k{border:0;width:34px;height:34px;flex:none;border-radius:50%;background:rgba(255,255,255,.16);color:#fff;font:700 15px/1 system-ui,sans-serif;cursor:pointer}
.xui-ja:focus-visible,.xui-nein-k:focus-visible,.xui-dk:focus-visible{outline:3px solid #FFE34D;outline-offset:2px}
.xui-hinweis,.xui-bald{display:flex;align-items:center;gap:8px;width:fit-content;max-width:100%;box-sizing:border-box;margin:6px 0 10px;padding:7px 14px;border-radius:999px;background:rgba(15,20,48,.55);color:#fff;font:600 13.5px/1.3 system-ui,-apple-system,"Segoe UI",sans-serif;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
.xui-bald{border-radius:18px}
.xui-dlg{position:fixed;inset:0;z-index:10001;display:grid;place-items:center;padding:16px;background:rgba(10,12,40,.45)}
.xui-dlgk{position:relative;width:min(380px,100%);box-sizing:border-box;padding:22px 20px 20px;border-radius:26px;background:linear-gradient(135deg,#2E5BFF,#8A3FE0);color:#fff;box-shadow:0 22px 50px rgba(10,12,40,.45);text-align:center;font:16px/1.35 system-ui,-apple-system,"Segoe UI",sans-serif}
.xui-dlgimg{width:150px;height:auto;display:block;margin:-6px auto 6px}
.xui-dlgt{margin:0 0 14px;font-weight:700}
.xui-dlgr{display:grid;gap:8px}
.xui-dk{border:0;border-radius:16px;padding:12px 16px;background:#FFE34D;color:#1B2240;font:800 15px/1.2 system-ui,-apple-system,"Segoe UI",sans-serif;cursor:pointer}
.xui-dk.alt{background:rgba(255,255,255,.18);color:#fff}
.xui-karten{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin:14px 0}
.xui-karte{position:relative;display:grid;gap:4px;justify-items:start;align-content:start;text-align:left;padding:18px;border:3px solid transparent;border-radius:24px;color:#fff;cursor:pointer;box-shadow:0 10px 24px rgba(27,34,64,.22);font:inherit;min-height:120px}
.xui-k-de{background:linear-gradient(135deg,#D7263D,#F46036)}
.xui-k-fr{background:linear-gradient(135deg,#2E5BFF,#5B4BF5)}
.xui-k-it{background:linear-gradient(135deg,#0B8A5A,#0FA968)}
.xui-karte.an{border-color:#FFE34D;box-shadow:0 0 0 3px rgba(255,227,77,.35),0 10px 24px rgba(27,34,64,.22)}
.xui-karte:focus-visible{outline:3px solid #FFE34D;outline-offset:3px}
.xui-karte b{font-size:22px}
.xui-karte small{font-size:15px;opacity:.95}
.xui-kc{display:inline-grid;place-items:center;width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.22);font-weight:800}
.xui-kz{font-size:13.5px;opacity:.92}
.xui-kh{position:absolute;right:14px;top:14px;font-style:normal;font-weight:800;font-size:13px;background:rgba(255,255,255,.22);padding:4px 10px;border-radius:999px}
.xui-box{display:grid;gap:10px;padding:16px 18px;border-radius:24px;background:linear-gradient(135deg,#3B3F8F,#5B4BF5);color:#fff;box-shadow:0 10px 24px rgba(27,34,64,.22)}
.xui-schalter{display:flex;gap:12px;align-items:flex-start;cursor:pointer}
.xui-schalter input{position:absolute;opacity:0;width:1px;height:1px}
.xui-sl{flex:none;position:relative;width:50px;height:30px;border-radius:999px;background:rgba(255,255,255,.3);transition:background .2s;margin-top:2px}
.xui-sl::after{content:"";position:absolute;left:4px;top:4px;width:22px;height:22px;border-radius:50%;background:#fff;transition:transform .2s}
.xui-schalter input:checked+.xui-sl{background:#17A35A}
.xui-schalter input:checked+.xui-sl::after{transform:translateX(20px)}
.xui-schalter input:focus-visible+.xui-sl{outline:3px solid #FFE34D;outline-offset:2px}
.xui-schalter b{display:block;font-size:16px}
.xui-schalter small{display:block;opacity:.92;font-size:14px;line-height:1.35}
.xui-info{margin:0;font-size:14px;opacity:.95}
@media (prefers-reduced-motion: reduce){.xui-knopf,.xui-frage,.xui-sl,.xui-sl::after{transition:none}}
/* Längere französische und italienische Texte */
html[lang=fr] .ans span:last-child,html[lang=it] .ans span:last-child{overflow-wrap:anywhere}
html[lang=fr] .ap-liste .x-ein-emo,html[lang=it] .ap-liste .x-ein-emo{flex:none}
html[lang=fr] .ap-liste>* span,html[lang=it] .ap-liste>* span{white-space:normal;line-height:1.15}
html[lang=fr] .ap-kopf .aplbl,html[lang=it] .ap-kopf .aplbl,html[lang=fr] .ap-chips .glas,html[lang=it] .ap-chips .glas{white-space:nowrap}
`;
document.head.appendChild(css);

/* =================== Start =================== */
window.EP_I18N = {
  sprache: () => L,
  setze,
  tr: s => (L === "de" ? s : (trAus(tr(s)) ?? s)),
  frage: f => trFrage(f),
  hatFrage: f => !!trFrage(f),
  anzahl: l => anzahl(l || L),
  nurUebersetzt(an){ if(typeof an === "boolean") LS.set(K.nur, an); return nurAn(); },
  _zeit: () => ({...ZEIT}),
  _sprich: t => trSprechen(t),
  _uebersetzt: n => !!(n && (TXT.has(n) || ATT.has(n)))   /* für Tests: wurde dieser Knoten übersetzt? */
};
registrieren();
htmlLang();
if(L !== "de"){
  if(ausCache(L)){ beobachten(true); allesUebersetzen(); ladeWB(L, true); }
  else {
    document.documentElement.classList.add("xui-laden");
    const los = setTimeout(() => document.documentElement.classList.remove("xui-laden"), 2500);
    ladeWB(L).then(() => { clearTimeout(los); document.documentElement.classList.remove("xui-laden"); if(L !== "de"){ beobachten(true); allesUebersetzen(); } });
  }
  ladeFragen(L);
}
requestAnimationFrame(() => { knopfPlatz(); platzSpaeter(); });
setTimeout(frageZeigen, 1500);
})();
