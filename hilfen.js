/* easyplay: Hilfen «Lesen & Hören»
   1. Hör-Modus: Fragen und Antworten im Quiz automatisch vorlesen (Standard an für Stufe 1, solange nie eingestellt),
      Lautsprecher-Knopf an jeder Antwort, nach dem Antworten Rückmeldung und kurze Erklärung vorlesen.
   2. Joker im Training: pro Quiz-Runde 2× «50:50» («Tipp von Milo» entfernt) (nie im Test, Duell, Live oder Hardcore).
   3. Lesehilfen: gut lesbare Schrift (Atkinson Hyperlegible, SIL OFL, lokal in welten/hilfen/), Schriftgrösse,
      stärkerer Kontrast, ruhiger Modus, Vorlese-Tempo. Einstellungs-Seite als Welt «x-hilfen».
   Nutzt die Vorlese-Logik der Seite (bestVoice, germanVoices, stopSpeak). Ergänzt das Quiz nach dem Rendern.
   API: window.EP_HILFEN = { einstellungen(), setze(k, v), vorlesen(text), stimmeDa() }
   Speicher: ep-x-hilfen-einst (Objekt mit hoeren, tempo, groesse, schrift, kontrast, ruhig) */
(function(){
"use strict";
if(typeof window.render !== "function") return;

const KEY = "ep-x-hilfen-einst";
const ORDNER = "welten/hilfen/";
const LS = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};
const h = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const STD = { hoeren:null, tempo:1, groesse:0, schrift:false, kontrast:false, ruhig:false };
const TEMPI = [[0.75, "Langsam"], [0.9, "Gemütlich"], [1, "Normal"], [1.2, "Schnell"]];
const GROESSEN = [[0, "Normal"], [1, "Gross"], [2, "Sehr gross"]];

let E = Object.assign({}, STD, LS.get(KEY, {}) || {});
const stufe = () => { try{ return S.stufe || 1; }catch(e){ return 1; } };
/* Hör-Modus: nie eingestellt → an für Stufe 1 (Entdecker) */
const hoerenAn = () => E.hoeren == null ? stufe() === 1 : !!E.hoeren;

function einstellungen(){ return Object.assign({}, E, { hoerenWirksam: hoerenAn(), hoerenAuto: E.hoeren == null }); }
function setze(k, v){
  if(!(k in STD)) return false;
  if(k === "tempo"){ v = Math.max(0.5, Math.min(1.6, +v || 1)); }
  else if(k === "groesse"){ v = Math.max(0, Math.min(2, Math.round(+v || 0))); }
  else if(k === "hoeren"){ v = v == null ? null : !!v; }
  else v = !!v;
  E[k] = v; LS.set(KEY, E);
  anwenden();
  if(k === "hoeren" && !hoerenAn()) stillePlease();
  try{ if(S.screen === "quiz") quizErgaenzen(true); }catch(e){}
  return true;
}

/* ================= Stil ================= */
const CSS = `
.hlf-vlrow{display:flex!important;justify-content:flex-end;margin:0 0 10px!important}
.hlf-vl{display:inline-flex;align-items:center;gap:8px;min-height:40px;padding:0 8px 0 5px;border:0;border-radius:999px;background:rgba(15,20,48,.62);color:#fff;font:600 .9rem "Lexend",system-ui,sans-serif;cursor:pointer;box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.14);transition:background .2s}
.hlf-vl .hlf-vli{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.16)}
.hlf-vl .hlf-vls{position:relative;width:38px;height:22px;border-radius:99px;background:rgba(255,255,255,.22);transition:background .2s}
.hlf-vl .hlf-vls i{position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:transform .2s}
.hlf-vl.an{background:linear-gradient(135deg,#FF8A3D,#E0581C);box-shadow:0 6px 16px rgba(224,88,28,.35)}
.hlf-vl.an .hlf-vli{background:#fff;color:#E0581C}
.hlf-vl.an .hlf-vls{background:rgba(255,255,255,.4)}
.hlf-vl.an .hlf-vls i{transform:translateX(16px)}
.hlf-vl:focus-visible{outline:3px solid #FFD34D;outline-offset:2px}
@media (prefers-reduced-motion:reduce){.hlf-vl,.hlf-vl .hlf-vls,.hlf-vl .hlf-vls i{transition:none}}
.hlf-joker{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:12px 0 0}
.hlf-j{display:inline-flex;align-items:center;gap:6px;min-height:42px;padding:0 14px 0 8px;border:0;border-radius:999px;background:rgba(15,20,48,.62);color:#fff;font:600 .9rem "Lexend",system-ui,sans-serif;cursor:pointer;box-shadow:0 4px 12px rgba(15,20,48,.18)}
.hlf-j:hover{background:rgba(15,20,48,.78)}
.hlf-j:focus-visible,.hlf-sag:focus-visible,.hlf-btn:focus-visible,.hlf-sw:focus-visible,.hlf-seg button:focus-visible{outline:3px solid #FFD34D;outline-offset:2px}
.hlf-j:disabled{opacity:.42;cursor:default}
.hlf-j .hlf-ji{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.18);font-size:.78rem;font-weight:700;overflow:hidden}
.hlf-j .hlf-ji img{width:30px;height:30px;object-fit:cover;object-position:top}
.hlf-j .hlf-n{min-width:22px;height:22px;padding:0 6px;border-radius:999px;background:#FFD34D;color:#1B2240;font-size:.78rem;font-weight:700;display:grid;place-items:center}
.hlf-tipp{display:flex;align-items:center;gap:10px;margin:10px auto 0;max-width:640px;padding:10px 14px 10px 8px;border-radius:20px;background:linear-gradient(135deg,#3D7BFF,#2A4FD6);color:#fff;box-shadow:0 8px 18px rgba(42,79,214,.25)}
.hlf-tipp img{flex:none;width:52px;height:52px;object-fit:contain}
.hlf-tipp p{margin:0;font-size:.98rem;line-height:1.4;color:#fff;min-width:0}
.hlf-tipp b{display:block;font-size:.78rem;opacity:.9;letter-spacing:.02em}
.answers .ans.hlf-weg{opacity:.28!important;filter:grayscale(1)!important;cursor:default}
.answers .ans.hlf-weg>span:not(.key){text-decoration:line-through}
.answers .ans.hlf-mitsag,body:is(.hlf-g1,.hlf-g2) .answers .ans{padding-left:52px!important;padding-right:52px!important}
.hlf-sag{position:absolute;right:8px;top:50%;transform:translateY(-50%);display:grid;place-items:center;width:38px;height:38px;border-radius:50%;background:rgba(15,20,48,.55);color:#fff;font-size:1rem;line-height:1;cursor:pointer;z-index:2}
.hlf-sag:hover{background:rgba(15,20,48,.75)}
.hlf-sag.an{background:#FFD34D;color:#1B2240}
:root[data-theme="dark"] .hlf-j,:root[data-theme="dark"] .hlf-hinweis{background:rgba(255,255,255,.16);box-shadow:inset 0 0 0 1px rgba(255,255,255,.22)}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .hlf-j,:root:not([data-theme="light"]) .hlf-hinweis{background:rgba(255,255,255,.16);box-shadow:inset 0 0 0 1px rgba(255,255,255,.22)}}
.hlf-hinweis{display:inline-block;margin:0 0 8px;padding:6px 12px;border-radius:999px;background:rgba(15,20,48,.62);color:#fff;font-size:.8rem}
/* Lesehilfen: Schriftgrösse (zoom skaliert Text proportional, Breiten bleiben am Behälter) */
body.hlf-g1{--hlf-z:1.15} body.hlf-g2{--hlf-z:1.3}
body:is(.hlf-g1,.hlf-g2) :is(.question,.feedback p,.explain p,.explain .merke,.peek,.hlf-tipp p,.libart p,.libart h1,.libart h2,.libart h3,.libart figcaption,.libart li:not(:has(p,li)),.help,.note,.pagehead p,.hlf-vorschau){zoom:var(--hlf-z)}
body:is(.hlf-g1,.hlf-g2) .answers .ans>span:not(.key):not(.hlf-sag){zoom:var(--hlf-z)}
/* Lesehilfen: stärkerer Kontrast */
body.hlf-kontrast{--soft:#2E3555;--line:#7D89B8}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) body.hlf-kontrast{--soft:#E2E6FA;--line:#8D98C8}}
:root[data-theme="dark"] body.hlf-kontrast{--soft:#E2E6FA;--line:#8D98C8}
body.hlf-kontrast.ep-app .answers .ans{text-shadow:0 1px 2px rgba(0,0,0,.45)}
body.hlf-kontrast.ep-app .answers .ans .key{text-shadow:none}
body.hlf-kontrast:not(.ep-app) .answers .ans{border-color:var(--ad)!important}
body.hlf-kontrast.ep-app .answers .ans:nth-child(1){background:linear-gradient(135deg,#2F49D8,#1E35B8)!important}
body.hlf-kontrast.ep-app .answers .ans:nth-child(2){background:linear-gradient(135deg,#C02A8E,#9C1E73)!important}
body.hlf-kontrast.ep-app .answers .ans:nth-child(3){background:linear-gradient(135deg,#0B7E60,#07664D)!important}
body.hlf-kontrast.ep-app .answers .ans:nth-child(4){background:linear-gradient(135deg,#B85A00,#964800)!important}
body.hlf-kontrast .card{outline:2px solid var(--ink);outline-offset:-2px}
body.hlf-kontrast .question,body.hlf-kontrast .explain p,body.hlf-kontrast .libart p{color:var(--ink)}
body.hlf-kontrast .hlf-j,body.hlf-kontrast .hlf-hinweis,body.hlf-kontrast .hlf-pille,body.hlf-kontrast .hlf-vorschau{background:rgba(10,12,30,.92)}
body.hlf-kontrast :focus-visible{outline:4px solid #FFB800!important;outline-offset:2px}
body.hlf-kontrast :is(.x-kachel,.x-kopf,.hlf-k,.hlf-kopf){text-shadow:0 1px 3px rgba(0,0,0,.45)}
/* Lesehilfen: ruhiger Modus */
body.hlf-ruhig *,body.hlf-ruhig *::before,body.hlf-ruhig *::after{animation-duration:.001ms!important;animation-iteration-count:1!important;animation-delay:0s!important;transition-duration:.001ms!important;transition-delay:0s!important;scroll-behavior:auto!important}
body.hlf-ruhig :is(.confetti,.fxtext,.fxdrop,.pkonfetti,.x-konfetti,.konfetti){display:none!important}
/* Seite «Lesen & Hören» */
.hlf-seite{max-width:980px;margin:0 auto}
.hlf-kopf{position:relative;display:flex;align-items:center;gap:14px;padding:18px 22px;border-radius:28px;color:#fff;background:linear-gradient(135deg,#0E7C86,#2A9D8F 55%,#3D5AFE);box-shadow:0 14px 30px rgba(14,124,134,.25);margin:6px 0 14px;min-height:92px}
.hlf-kopf h1{margin:0;font:800 clamp(1.3rem,4.5vw,1.9rem)/1.15 "Bricolage Grotesque",system-ui,sans-serif;color:#fff}
.hlf-kopf p{margin:4px 0 0;font-size:.95rem;color:#fff;opacity:.95}
.hlf-kopf>div{flex:1;min-width:0}
.hlf-kopf img{flex:none;height:96px;width:auto;margin:-26px -4px -18px 0;filter:drop-shadow(0 6px 10px rgba(0,0,0,.2))}
.hlf-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.hlf-k{position:relative;display:flex;flex-direction:column;gap:8px;min-width:0;padding:14px 14px 12px;border-radius:22px;color:#fff;box-shadow:0 10px 22px rgba(27,34,64,.18)}
.hlf-k h2{margin:0;font:700 1.02rem/1.2 "Lexend",system-ui,sans-serif;color:#fff;display:flex;align-items:center;gap:8px}
.hlf-k h2 span[aria-hidden]{font-size:1.25rem}
.hlf-k p{margin:0;font-size:.84rem;line-height:1.35;color:#fff;opacity:.95}
.hlf-k .hlf-fuss{margin-top:auto;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.hlf-sw{position:relative;display:inline-flex;align-items:center;gap:10px;min-height:44px;padding:0 14px 0 6px;border:0;border-radius:999px;background:rgba(0,0,0,.24);color:#fff;font:700 .9rem "Lexend",system-ui,sans-serif;cursor:pointer}
.hlf-sw i{position:relative;width:46px;height:28px;border-radius:999px;background:rgba(255,255,255,.35);flex:none}
.hlf-sw i::after{content:"";position:absolute;left:3px;top:3px;width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 2px 4px rgba(0,0,0,.25);transition:left .15s}
.hlf-sw[aria-checked="true"] i{background:#FFD34D}
.hlf-sw[aria-checked="true"] i::after{left:21px}
.hlf-seg{display:flex;flex-wrap:wrap;gap:6px}
.hlf-seg button{min-height:40px;padding:0 12px;border:0;border-radius:999px;background:rgba(0,0,0,.24);color:#fff;font:600 .85rem "Lexend",system-ui,sans-serif;cursor:pointer}
.hlf-seg button[aria-pressed="true"]{background:#fff;color:#1B2240}
.hlf-btn{min-height:40px;padding:0 14px;border:0;border-radius:999px;background:rgba(255,255,255,.22);color:#fff;font:600 .85rem "Lexend",system-ui,sans-serif;cursor:pointer}
.hlf-btn:disabled{opacity:.5;cursor:default}
.hlf-auto{font-size:.74rem;padding:3px 9px;border-radius:999px;background:rgba(0,0,0,.24)}
.hlf-unten{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:12px}
.hlf-vorschau{flex:1 1 300px;min-width:0;margin:0;padding:10px 16px;border-radius:18px;background:rgba(15,20,48,.6);color:#fff;font-size:1rem;line-height:1.45}
.hlf-unten .hlf-btn{background:rgba(15,20,48,.6)}
.hlf-pille{display:inline-block;padding:6px 12px;border-radius:14px;background:rgba(15,20,48,.62);color:#fff;font-size:.82rem;line-height:1.35}
.hlf-ein-karte{margin-top:22px}
@media (max-width:900px){.hlf-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.hlf-breit{grid-column:1/-1}.hlf-breit .hlf-fuss{margin-top:0}}
@media (max-width:560px){
  .hlf-kopf{padding:12px 14px;border-radius:22px;min-height:70px;margin-top:2px;margin-bottom:10px}
  .hlf-kopf img{height:70px;margin:-14px -6px -10px 0}
  .hlf-kopf p{font-size:.82rem}
  .hlf-grid{gap:8px}
  .hlf-k{padding:10px;border-radius:18px;gap:6px}
  .hlf-k h2{font-size:.9rem;gap:6px}.hlf-k h2 span[aria-hidden]{font-size:1.05rem}
  .hlf-k p{font-size:.74rem}
  .hlf-k p{display:none}
  .hlf-k.hlf-breit{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;row-gap:6px}
  .hlf-k.hlf-breit h2{grid-column:1}.hlf-k.hlf-breit .hlf-fuss{grid-column:2;grid-row:1}.hlf-k.hlf-breit .hlf-seg{grid-column:1/-1}
  .hlf-seg{flex-wrap:nowrap}.hlf-seg button{flex:1 1 0;min-width:0}
  .hlf-sw{min-height:40px;padding:0 10px 0 5px;font-size:.8rem;gap:6px}
  .hlf-sw i{width:40px;height:24px}.hlf-sw i::after{width:18px;height:18px}.hlf-sw[aria-checked="true"] i::after{left:19px}
  .hlf-seg{gap:4px}.hlf-seg button{min-height:38px;padding:0 8px;font-size:.74rem}
  .hlf-btn{min-height:38px;padding:0 10px;font-size:.76rem}
  .hlf-unten{margin-top:8px;gap:8px}
  .hlf-vorschau{font-size:.84rem;padding:8px 12px;flex:1 1 0}
  .hlf-pille{font-size:.74rem}
  .hlf-j{font-size:.82rem;min-height:40px;padding:0 12px 0 6px}
  .hlf-tipp p{font-size:.9rem}.hlf-tipp img{width:44px;height:44px}
}
@media (max-width:380px){.hlf-kopf p{display:none}.hlf-kopf{min-height:56px}.hlf-kopf img{height:58px}}
@media (prefers-reduced-motion:reduce){.hlf-sw i::after{transition:none}}
`;
function stilEinfuegen(){
  if(document.getElementById("ep-x-hilfen")) return;
  const st = document.createElement("style"); st.id = "ep-x-hilfen"; st.textContent = CSS; document.head.appendChild(st);
  /* Gut lesbare Schrift: die Schriftnamen der Seite (Lexend, Fredoka) zeigen auf Atkinson Hyperlegible.
     Spätere @font-face-Regeln gewinnen, darum steht der Block beim Einschalten am Ende des head. */
  const lat = "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";
  const ext = "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF";
  const ff = (fam, w, file, range) => `@font-face{font-family:"${fam}";font-style:normal;font-display:swap;font-weight:${w};src:url(${ORDNER}${file}) format("woff2");unicode-range:${range}}`;
  const faces = fam => [ff(fam, "100 549", "atkinson-hyperlegible-latin-400-normal.woff2", lat), ff(fam, "550 900", "atkinson-hyperlegible-latin-700-normal.woff2", lat),
    ff(fam, "100 549", "atkinson-hyperlegible-latin-ext-400-normal.woff2", ext), ff(fam, "550 900", "atkinson-hyperlegible-latin-ext-700-normal.woff2", ext)].join("\n");
  const sf = document.createElement("style"); sf.id = "ep-x-hilfen-schrift";
  sf.textContent = faces("Atkinson Hyperlegible") + "\n" + faces("Lexend") + "\n" + faces("Fredoka");
  sf.media = "not all";
  document.head.appendChild(sf);
}

/* ================= Einstellungen anwenden ================= */
function anwenden(){
  try{
    stilEinfuegen();
    const b = document.body; if(!b) return;
    b.classList.toggle("hlf-g1", E.groesse === 1);
    b.classList.toggle("hlf-g2", E.groesse === 2);
    b.classList.toggle("hlf-kontrast", !!E.kontrast);
    b.classList.toggle("hlf-ruhig", !!E.ruhig);
    b.classList.toggle("hlf-schrift", !!E.schrift);
    const sf = document.getElementById("ep-x-hilfen-schrift");
    if(sf){
      const soll = E.schrift ? "all" : "not all";
      if(E.schrift && document.head.lastElementChild !== sf) document.head.appendChild(sf);
      if(sf.media !== soll) sf.media = soll;
    }
  }catch(e){}
}

/* Ruhiger Modus: andere Teile der Seite fragen «prefers-reduced-motion» ab; im ruhigen Modus lautet die Antwort ja.
   Animationen über element.animate() springen sofort ans Ende. */
try{
  const mmVor = window.matchMedia;
  if(typeof mmVor === "function"){
    window.matchMedia = function(q){
      const m = mmVor.apply(this, arguments);
      try{ if(/prefers-reduced-motion\s*:\s*reduce/i.test(String(q)) && E.ruhig) Object.defineProperty(m, "matches", {get(){ return true; }, configurable:true}); }catch(e){}
      return m;
    };
  }
}catch(e){}
try{
  const anVor = Element.prototype.animate;
  if(typeof anVor === "function"){
    Element.prototype.animate = function(){
      const a = anVor.apply(this, arguments);
      if(E.ruhig){ try{ a.finish(); }catch(e){ try{ a.cancel(); }catch(_){} } }
      return a;
    };
  }
}catch(e){}

/* ================= Vorlesen ================= */
let meinSprechen = false;
function stimmeDa(){
  try{
    if(!("speechSynthesis" in window)) return false;
    if(typeof germanVoices === "function") return germanVoices().length > 0;
    return speechSynthesis.getVoices().some(v => /^de\b|^de-/i.test(v.lang));
  }catch(e){ return false; }
}
function stillePlease(){
  if(!meinSprechen) return;
  meinSprechen = false;
  try{ speechSynthesis.cancel(); }catch(e){}
  document.querySelectorAll(".hlf-sag.an").forEach(b => b.classList.remove("an"));
}
/* teile: Liste von Texten, werden satzweise in die Warteschlange gestellt (wie speakText der Seite). */
function sag(teile, knopf){
  if(!stimmeDa()) return false;
  try{ if(typeof stopSpeak === "function") stopSpeak(); else speechSynthesis.cancel(); }catch(e){}
  document.querySelectorAll(".hlf-sag.an").forEach(b => b.classList.remove("an"));
  let v = null; try{ v = typeof bestVoice === "function" ? bestVoice() : null; }catch(e){}
  const saetze = [];
  (Array.isArray(teile) ? teile : [teile]).forEach(t => { const s = String(t || "").trim(); if(!s) return; (s.match(/[^.!?]+[.!?]*/g) || [s]).forEach(x => { x = x.trim(); if(x) saetze.push(x); }); });
  if(!saetze.length) return false;
  meinSprechen = true;
  if(knopf) knopf.classList.add("an");
  saetze.forEach((p, i) => {
    try{
      const u = new SpeechSynthesisUtterance(p);
      if(v){ u.voice = v; u.lang = v.lang; } else u.lang = "de-CH";
      u.rate = E.tempo || 1; u.pitch = 1.05;
      if(i === saetze.length - 1) u.onend = u.onerror = () => { meinSprechen = false; if(knopf) knopf.classList.remove("an"); };
      speechSynthesis.speak(u);
    }catch(e){}
  });
  return true;
}

/* ================= Quiz-Ergänzungen ================= */
const L = "ABCD";
const norm = s => String(s || "").toLowerCase().replace(/ß/g, "ss").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
function jokerErlaubt(Q){
  try{
    if(!Q || S.screen !== "quiz") return false;
    if(Q.mode === "test" || Q.custom || Q.duell || Q.live || Q.hardcore || Q.hc) return false;
    return true;
  }catch(e){ return false; }
}
function zustand(Q){
  if(!Q.__hlf) Object.defineProperty(Q, "__hlf", {value:{f50:2, tipp:2, q:{}}, enumerable:false, writable:true});
  return Q.__hlf;
}
function richtigeOpt(f){ const i = (f.opts || []).findIndex(o => o.ok); return {i, txt: i >= 0 ? f.opts[i].txt : (f.a || [""])[0]}; }
/* Würde dieser Satz die Lösung verraten? */
function verraet(satz, loesung){
  const s = " " + norm(satz) + " ", l = norm(loesung);
  if(!l) return false;
  if(s.includes(" " + l + " ")) return true;
  const woerter = l.split(" ").filter(w => w.length >= 4 || /\d/.test(w));
  if(!woerter.length) return false;
  return woerter.some(w => s.includes(" " + w + " ") || (w.length >= 6 && s.includes(" " + w.slice(0, w.length - 1))));
}
function tippText(f, weg){
  const loes = richtigeOpt(f).txt;
  const saetze = String(f.e || "").match(/[^.!?]+[.!?]+/g) || (f.e ? [f.e] : []);
  const kand = [f.m, ...saetze].map(x => String(x || "").replace(/\*\*/g, "").trim()).filter(x => x.length >= 12 && x.length <= 220);
  const gut = kand.find(x => !verraet(x, loes) && norm(x) !== norm(f.q));
  if(gut) return gut;
  /* Kein Satz ohne Lösung: Anfangsbuchstabe, falls er die Antwort eingrenzt, sonst eine falsche Antwort ausschliessen */
  const erstes = t => (String(t).match(/[A-Za-zÀ-ÿ0-9]/) || [""])[0].toUpperCase();
  const da = (f.opts || []).map((o, i) => ({o, i})).filter(x => !(weg || []).includes(x.i));
  const b = erstes(loes);
  const gleich = da.filter(x => !x.o.ok && erstes(x.o.txt) === b).length;
  if(b && !gleich) return /\d/.test(b) ? `Die richtige Antwort beginnt mit der Ziffer «${b}».` : `Die richtige Antwort beginnt mit «${b}».`;
  const falsche = da.filter(x => !x.o.ok);
  if(falsche.length >= 2){ const x = falsche[Math.floor(Math.random() * falsche.length)]; return `Ich bin sicher: «${x.o.txt}» ist es nicht.`; }
  return "Lies die Frage noch einmal ganz genau. Du schaffst das!";
}
function kurzeErklaerung(f){
  const m = String(f.m || "").replace(/\*\*/g, "").trim();
  if(m && m.length <= 180) return m;
  const e = String(f.e || "").replace(/\*\*/g, "").match(/[^.!?]+[.!?]+/);
  return e ? e[0].trim() : m;
}
function frageTeile(f){ return [f.q, ...(f.opts || []).map((o, i) => `${L[i]}: ${o.txt}.`)]; }
function feedbackTeile(f, picked){
  const r = richtigeOpt(f), ok = f.opts[picked] && f.opts[picked].ok;
  const t = ok ? ["Richtig!"] : ["Leider falsch.", `Richtig ist ${L[r.i]}: ${r.txt}.`];
  const k = kurzeErklaerung(f); if(k) t.push(k);
  return t;
}

let letzt = {Q:null, i:-1, picked:null};
let wartet = 0;
function quizErgaenzen(nurZeichnen){
  let Q; try{ Q = S.quiz; }catch(e){ return; }
  const app = document.getElementById("app"); if(!Q || !app) return;
  const f = Q.list && Q.list[Q.i]; if(!f || !f.opts) return;
  const card = app.querySelector(".card"); if(!card) return;
  const st = zustand(Q), qs = st.q[Q.i] || (st.q[Q.i] = {});
  const answered = Q.picked != null;
  const frageTab = Q.mode === "test" || Q.tab === "frage";
  const answers = card.querySelector(".answers");

  if(answers && frageTab){
    /* 50:50 */
    (qs.weg || []).forEach(i => { const b = answers.querySelector(`.ans[data-i="${i}"]`); if(b && !b.classList.contains("right") && !b.classList.contains("wrong")){ b.classList.add("hlf-weg"); b.disabled = true; b.setAttribute("aria-disabled", "true"); b.title = "Durch 50:50 weggenommen"; } });
    /* Lautsprecher an jeder Antwort (im Hör-Modus, solange die Frage offen ist) */
    answers.querySelectorAll(".hlf-sag").forEach(x => x.remove());
    answers.querySelectorAll(".ans").forEach(b => b.classList.remove("hlf-mitsag"));
    if(hoerenAn() && !answered && stimmeDa()){
      answers.querySelectorAll(".ans").forEach(b => {
        if(b.classList.contains("hlf-weg")) return;
        const i = +b.dataset.i, o = f.opts[i]; if(!o) return;
        const s = document.createElement("span");
        s.className = "hlf-sag"; s.setAttribute("role", "button"); s.tabIndex = 0; s.textContent = "🔊";
        s.setAttribute("aria-label", `Antwort ${L[i]} vorlesen`);
        const los = ev => { ev.preventDefault(); ev.stopPropagation(); if(s.classList.contains("an")){ stillePlease(); return; } sag([`${L[i]}: ${o.txt}.`], s); };
        s.addEventListener("click", los);
        s.addEventListener("pointerdown", ev => ev.stopPropagation());
        s.addEventListener("keydown", ev => { if(ev.key === "Enter" || ev.key === " "){ los(ev); } else ev.stopPropagation(); });
        s.addEventListener("keyup", ev => { if(ev.key === " " || ev.key === "Enter"){ ev.preventDefault(); ev.stopPropagation(); } });
        b.classList.add("hlf-mitsag"); b.appendChild(s);
      });
    }
    /* Joker-Leiste unter den Antworten */
    card.querySelector(".hlf-joker")?.remove(); card.querySelector(".hlf-tipp")?.remove();
    if(jokerErlaubt(Q) && !answered){
      const bar = document.createElement("div"); bar.className = "hlf-joker"; bar.setAttribute("role", "group"); bar.setAttribute("aria-label", "Joker");
      const f50weg = !!(qs.weg && qs.weg.length), tippDa = !!qs.tipp;
      bar.innerHTML = `<button type="button" class="hlf-j" data-hj="f50" ${st.f50 <= 0 || f50weg ? "disabled" : ""} aria-label="Joker 50:50, zwei falsche Antworten wegnehmen, noch ${st.f50}"><span class="hlf-ji" aria-hidden="true"><img src="img/grafik/sym-5050.webp" alt=""></span>50:50<span class="hlf-n" aria-hidden="true">${st.f50}</span></button>`
        /* «Tipp von Milo» auf Wunsch von Dejan entfernt (30.10.) */;
      answers.insertAdjacentElement("afterend", bar);
      if(tippDa){
        const t = document.createElement("div"); t.className = "hlf-tipp"; t.setAttribute("role", "status");
        t.innerHTML = `<img src="img/kids/j1.webp" alt=""><p><b>Milo sagt:</b>${h(qs.tipp)}</p>`;
        bar.insertAdjacentElement("afterend", t);
      }
      /* Per Tastatur ausgelöst (detail 0): Fokus auf einen sinnvollen Knopf, weil der Joker-Knopf deaktiviert wird */
      const fokus = ev => { if(ev && ev.detail === 0) (app.querySelector(".hlf-j:not(:disabled)") || app.querySelector(".answers .ans:not(:disabled)"))?.focus({preventScroll:true}); };
      bar.querySelector('[data-hj="f50"]').onclick = ev => {
        if(st.f50 <= 0 || (qs.weg && qs.weg.length) || Q.picked != null) return;
        const falsch = f.opts.map((o, i) => o.ok ? -1 : i).filter(i => i >= 0);
        for(let k = falsch.length - 1; k > 0; k--){ const j = Math.floor(Math.random() * (k + 1)); [falsch[k], falsch[j]] = [falsch[j], falsch[k]]; }
        qs.weg = falsch.slice(0, 2); st.f50--;
        try{ window.EP_SOUND?.play("wisch"); }catch(e){}
        quizErgaenzen(true); fokus(ev);
      };
      const tippKn = bar.querySelector('[data-hj="tipp"]'); if(tippKn) tippKn.onclick = ev => {
        if(st.tipp <= 0 || qs.tipp || Q.picked != null) return;
        qs.tipp = tippText(f, qs.weg); st.tipp--;
        try{ window.EP_SOUND?.play("klick"); }catch(e){}
        quizErgaenzen(true); fokus(ev);
        if(hoerenAn()) sag(["Milo sagt:", qs.tipp]);
      };
    }
  }

  /* Schalter «Vorlesen» an/aus (ersetzt den alten Vorlese-Knopf) */
  card.querySelectorAll(".hlf-vlrow").forEach(row => {
    const an = hoerenAn();
    row.innerHTML = `<button type="button" class="hlf-vl${an ? " an" : ""}" role="switch" aria-checked="${an}" aria-label="Vorlesen ${an ? "an" : "aus"}"><span class="hlf-vli" aria-hidden="true"><img src="img/grafik/sym-vorlesen.webp" alt=""${an ? "" : ' style="opacity:.55;filter:grayscale(1)"'}></span><span class="hlf-vlt">Vorlesen</span><span class="hlf-vls" aria-hidden="true"><i></i></span></button>`;
    row.querySelector(".hlf-vl").onclick = () => {
      const jetzt = !hoerenAn(); setze("hoeren", jetzt);
      try{ window.EP_SOUND?.play("klick"); }catch(e){}
      if(jetzt){ try{ const Q2 = S.quiz, f2 = Q2.list[Q2.i]; if(Q2.mode === "test" || Q2.tab === "frage"){ if(Q2.picked == null) sag(frageTeile(f2)); else sag(feedbackTeile(f2, Q2.picked)); } else sag([f2.e, "Merke: " + f2.m]); }catch(e){} }
      setTimeout(() => document.querySelector(".hlf-vl")?.focus({preventScroll:true}), 0);
    };
  });

  /* Hinweis, wenn keine deutsche Stimme da ist */
  card.querySelector(".hlf-hinweis")?.remove();
  if(hoerenAn() && frageTab && !answered && !stimmeDa()){
    const p = document.createElement("p"); p.className = "hlf-hinweis"; p.setAttribute("role", "note");
    p.textContent = "🔇 Dieses Gerät hat keine deutsche Vorlesestimme.";
    const q = card.querySelector(".question"); if(q) q.insertAdjacentElement("beforebegin", p);
  }

  if(nurZeichnen) return;
  /* Vorlesen: neue Frage → Frage und Antworten; frisch beantwortet → Rückmeldung und kurze Erklärung */
  const neu = letzt.Q !== Q || letzt.i !== Q.i;
  const frischBeantwortet = !neu && letzt.picked == null && answered;
  letzt = {Q, i:Q.i, picked:Q.picked};
  if(neu){ stillePlease(); clearTimeout(wartet); }
  if(!hoerenAn()) return;
  if(neu && !answered && frageTab){
    const vorlesen = () => { try{ if(S.screen === "quiz" && S.quiz === Q && Q.i === letzt.i && Q.picked == null) sag(frageTeile(f)); }catch(e){} };
    if(stimmeDa()) vorlesen();
    else { /* Stimmen laden manchmal verzögert */
      wartet = setTimeout(() => { if(stimmeDa()){ vorlesen(); try{ if(S.screen === "quiz") quizErgaenzen(true); }catch(e){} } }, 900);
    }
  } else if(frischBeantwortet){
    sag(feedbackTeile(f, Q.picked));
  }
}

/* ================= Einstiege in die Einstellungen ================= */
function einstiege(){
  try{
    const app = document.getElementById("app"); if(!app) return;
    if(S.screen === "profil"){
      const voice = app.querySelector("#voiceSel, #voiceTest")?.closest(".statcard") || [...app.querySelectorAll(".statcard")].pop();
      if(voice && !app.querySelector(".hlf-ein-karte")){
        const d = document.createElement("div"); d.className = "statcard hlf-ein-karte";
        d.innerHTML = `<h2><span aria-hidden="true">👓</span> Lesen &amp; Hören</h2><p class="help" style="margin-top:0">Hör-Modus, gut lesbare Schrift, grössere Schrift, stärkerer Kontrast, ruhiger Modus und Vorlese-Tempo.</p><div class="row" style="justify-content:flex-start"><button class="big alt" type="button" id="hlfZu">👓 Lesen &amp; Hören einstellen</button></div>`;
        voice.insertAdjacentElement("afterend", d);
        d.querySelector("#hlfZu").onclick = () => go("x-hilfen");
      }
    }
    if(S.screen === "home"){
      const nav = app.querySelector(".ap-profil .ap-liste");
      if(nav && !nav.querySelector(".hlf-ein")){
        const b = document.createElement("button"); b.type = "button"; b.className = "hlf-ein";
        b.innerHTML = `<span aria-hidden="true" style="flex:none">👓</span><span>Lesen &amp; Hören</span>`;
        b.onclick = () => go("x-hilfen");
        const ent = nav.querySelector(".x-ein");
        if(ent) ent.insertAdjacentElement("afterend", b); else nav.insertBefore(b, nav.firstChild);
      }
    }
  }catch(e){}
}

/* ================= render umhüllen ================= */
const vorRender = window.render;
window.render = function(){
  const r = vorRender.apply(this, arguments);
  anwenden();
  try{
    if(S.screen === "quiz") requestAnimationFrame(() => { try{ if(S.screen === "quiz") quizErgaenzen(false); }catch(e){ console.warn("hilfen quiz", e); } });
    else { letzt = {Q:null, i:-1, picked:null}; clearTimeout(wartet); stillePlease(); requestAnimationFrame(einstiege); setTimeout(einstiege, 300); setTimeout(einstiege, 1000); }
  }catch(e){}
  return r;
};
/* Durch 50:50 weggenommene Antworten auch per Tastatur sperren */
const vorAnswer = window.answer;
if(typeof vorAnswer === "function"){
  window.answer = function(i){
    try{ const Q = S.quiz, qs = Q && Q.__hlf && Q.__hlf.q[Q.i]; if(qs && qs.weg && qs.weg.includes(+i) && Q.picked == null) return; }catch(e){}
    return vorAnswer.apply(this, arguments);
  };
}
document.addEventListener("visibilitychange", () => { if(document.hidden) stillePlease(); });
window.addEventListener("pagehide", stillePlease);

/* ================= Seite «Lesen & Hören» ================= */
const sw = (k, an, lbl) => `<button type="button" class="hlf-sw" role="switch" aria-checked="${an}" data-sw="${k}" aria-label="${h(lbl)}"><i aria-hidden="true"></i>${an ? "An" : "Aus"}</button>`;
function seiteHTML(){
  const hoer = hoerenAn(), auto = E.hoeren == null;
  const stimme = stimmeDa();
  return `<div class="hlf-seite">
  <div class="hlf-kopf"><div><h1>Lesen &amp; Hören</h1><p>Stell easyplay so ein, wie du am besten lesen und zuhören kannst.</p></div><img src="img/kids/duo-winken.webp" alt=""></div>
  <div class="hlf-grid">
    <section class="hlf-k" style="background:linear-gradient(135deg,#D63A74,#A3168F)">
      <h2><span aria-hidden="true">🎧</span>Hör-Modus</h2>
      <p>Fragen und Antworten im Quiz automatisch vorlesen.</p>
      <div class="hlf-fuss">${sw("hoeren", hoer, "Fragen automatisch vorlesen")}${auto ? `<span class="hlf-auto">${stufe() === 1 ? "automatisch für Entdecker" : "automatisch"}</span>` : ""}</div>
    </section>
    <section class="hlf-k" style="background:linear-gradient(135deg,#0E8F6E,#0A6E55)">
      <h2><span aria-hidden="true">🔤</span>Gut lesbare Schrift</h2>
      <p>Buchstaben wie I, l und 1 sind leichter zu unterscheiden.</p>
      <div class="hlf-fuss">${sw("schrift", !!E.schrift, "Gut lesbare Schrift")}</div>
    </section>
    <section class="hlf-k hlf-breit" style="background:linear-gradient(135deg,#7B4DE0,#5B2DB8)">
      <h2><span aria-hidden="true">🐢</span>Vorlese-Tempo</h2>
      <div class="hlf-seg" role="group" aria-label="Vorlese-Tempo">${TEMPI.map(([v, n]) => `<button type="button" data-tempo="${v}" aria-pressed="${Math.abs((E.tempo || 1) - v) < .01}">${n}</button>`).join("")}</div>
      <div class="hlf-fuss"><button type="button" class="hlf-btn" id="hlfProbe" ${stimme ? "" : "disabled"}>🔊 Probe hören</button></div>
    </section>
    <section class="hlf-k hlf-breit" style="background:linear-gradient(135deg,#2F6BFF,#1E46C8)">
      <h2><span aria-hidden="true">🔠</span>Schriftgrösse</h2>
      <p class="hlf-desk">Für Quiz, Erklärungen und Bibliothek.</p>
      <div class="hlf-seg" role="group" aria-label="Schriftgrösse">${GROESSEN.map(([v, n]) => `<button type="button" data-gr="${v}" aria-pressed="${E.groesse === v}">${n}</button>`).join("")}</div>
    </section>
    <section class="hlf-k" style="background:linear-gradient(135deg,#334166,#1B2240)">
      <h2><span aria-hidden="true">🌗</span>Stärkerer Kontrast</h2>
      <p>Dunklere Farben, klarere Ränder.</p>
      <div class="hlf-fuss">${sw("kontrast", !!E.kontrast, "Stärkerer Kontrast")}</div>
    </section>
    <section class="hlf-k" style="background:linear-gradient(135deg,#C96F1A,#A04E00)">
      <h2><span aria-hidden="true">🍃</span>Ruhiger Modus</h2>
      <p>Keine Animationen, kein Konfetti, keine Partikel.</p>
      <div class="hlf-fuss">${sw("ruhig", !!E.ruhig, "Ruhiger Modus")}</div>
    </section>
  </div>
  <div class="hlf-unten">
    <p class="hlf-vorschau" id="hlfVorschau">Vorschau: Wie viele Kantone hat die Schweiz? Il1 O0 · Lumi und Milo lesen gern.</p>
    <button type="button" class="hlf-btn" id="hlfReset">↺ Zurücksetzen</button>
  </div>
  ${stimme ? "" : `<p style="margin:8px 0 0"><span class="hlf-pille" role="note">🔇 Dieses Gerät bietet keine deutsche Vorlesestimme an. Der Hör-Modus bleibt dann still.</span></p>`}
  <p style="margin:8px 0 0"><span class="hlf-pille">🃏 Im Training gibt es pro Runde 2× 50:50. In Tests gibt es keine Joker.</span></p>
</div>`;
}
function seiteZeichnen(box){
  box.innerHTML = seiteHTML();
  box.querySelectorAll("[data-sw]").forEach(b => b.onclick = () => {
    const k = b.dataset.sw, neu = b.getAttribute("aria-checked") !== "true";
    setze(k, neu);
    try{ window.EP_SOUND?.play("klick"); }catch(e){}
    seiteZeichnen(box); box.querySelector(`[data-sw="${k}"]`)?.focus();
  });
  box.querySelectorAll("[data-tempo]").forEach(b => b.onclick = () => {
    setze("tempo", +b.dataset.tempo); seiteZeichnen(box); box.querySelector(`[data-tempo="${b.dataset.tempo}"]`)?.focus();
    sag(["So schnell lese ich dir vor."]);
  });
  box.querySelectorAll("[data-gr]").forEach(b => b.onclick = () => { setze("groesse", +b.dataset.gr); seiteZeichnen(box); box.querySelector(`[data-gr="${b.dataset.gr}"]`)?.focus(); });
  const pr = box.querySelector("#hlfProbe"); if(pr) pr.onclick = () => sag(["Hallo! Ich bin die Vorlesestimme von easyplay.", "Wie viele Kantone hat die Schweiz?", "A: 20. B: 26. C: 30. D: 12."]);
  box.querySelector("#hlfReset").onclick = () => { stillePlease(); E = Object.assign({}, STD); LS.set(KEY, E); anwenden(); seiteZeichnen(box); };
}

if(window.EP_EXTRAS && typeof EP_EXTRAS.register === "function"){
  EP_EXTRAS.register({
    id:"hilfen", titel:"Lesen & Hören", text:"Vorlesen, grosse Schrift, Joker", emo:"👓",
    farbe:"linear-gradient(135deg,#0E7C86,#3D5AFE)", reihe:90,
    render(box){ seiteZeichnen(box); }
  });
}

window.EP_HILFEN = {
  einstellungen, setze,
  vorlesen(text){ return sag([text]); },
  stimmeDa
};

try{ speechSynthesis.addEventListener?.("voiceschanged", () => { try{ if(S.screen === "quiz") quizErgaenzen(true); else if(S.screen === "x-hilfen"){ const b = document.querySelector('.xseite[data-xwelt="hilfen"]'); if(b) seiteZeichnen(b); } }catch(e){} }); }catch(e){}
if(document.body) anwenden(); else document.addEventListener("DOMContentLoaded", anwenden);
})();
