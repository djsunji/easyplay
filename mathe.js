/* easyplay Welt «Mathe-Trainer» (x-mathe)
   Unendlich viele automatisch erzeugte Rechenaufgaben nach Lehrplan 21 (Zyklus 1 bis 3), adaptiv:
   pro Bereich eine Stufe 1 bis 10 (steigt nach 8 von 10 richtig, sinkt nach weniger als 5 von 10).
   Runde = 10 Aufgaben ohne Zeitdruck; optional Blitz-Modus (60 Sekunden). Bildschirm-Tastatur und echte Tastatur.
   Schwierige Einmaleins-Reihen werden gemerkt und öfter gebracht.
   API: window.EP_MATHE = { stand(), fortschritt() → {hat, alle} (Bereiche ab Stufe 5), bereiche(), aufgabe(bereich, stufe) }
   Speicher: ep-x-mathe-stand (Stufen, Bestwerte, Reihen-Statistik), ep-x-mathe-opt (gewählte Optionen)
   Der Generator ist ohne Browser testbar: require("./mathe.js") liefert das Generator-Objekt. */
(function(){
"use strict";

/* =====================================================================
   Generator
   ===================================================================== */
const GEN = (function(){
const M = "−";               // Minuszeichen
const NB = " ";              // schmales Leerzeichen für Tausendergruppen
let R = Math.random;
const rnd = (a, b) => a + Math.floor(R() * (b - a + 1));
const pick = a => a[Math.floor(R() * a.length)];
const mischen = a => { a = a.slice(); for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const ggt = (a, b) => { a = Math.abs(a); b = Math.abs(b); while(b){ [a, b] = [b, a % b]; } return a; };
const kgv = (a, b) => a / ggt(a, b) * b;
const P10 = k => Math.pow(10, k);

/* Zahlen anzeigen und vergleichen */
function fz(n){ const s = String(Math.abs(n)); const g = s.length > 4 ? s.replace(/\B(?=(\d{3})+(?!\d))/g, NB) : s; return (n < 0 ? M : "") + g; }
function dz(v, k){ // ganze Zahl v mit k Nachkommastellen -> kanonisch "3,5"
  const neg = v < 0; let s = String(Math.abs(v));
  if(k > 0){ s = s.padStart(k + 1, "0"); const i = s.slice(0, s.length - k), f = s.slice(s.length - k).replace(/0+$/, ""); s = i + (f ? "," + f : ""); }
  return (neg && s !== "0" ? "-" : "") + s;
}
function canon(x){
  if(x == null) return null;
  const s = String(x).replace(/[\s ']/g, "").replace(/−/g, "-").replace(".", ",");
  const m = s.match(/^(-?)(\d*)(?:,(\d*))?$/); if(!m || (m[2] === "" && !m[3])) return null;
  const i = m[2].replace(/^0+/, "") || "0", f = (m[3] || "").replace(/0+$/, "");
  const r = i + (f ? "," + f : ""); return (m[1] && r !== "0" ? "-" : "") + r;
}
function fk(c){ c = canon(c); if(c == null) return "?"; const neg = c[0] === "-"; let [i, f] = c.replace("-", "").split(","); if(i.length > 4) i = i.replace(/\B(?=(\d{3})+(?!\d))/g, NB); return (neg ? M : "") + i + (f ? "," + f : ""); }
function fFr(rp){ return Math.floor(rp / 100) + "," + String(rp % 100).padStart(2, "0"); } // 345 -> "3,45"
function quot(num, den){ for(let k = 0; k <= 5; k++){ const z = num * P10(k); if(Number.isInteger(z) && z % den === 0) return dz(z / den, k); } return null; }
const br = (z, n) => n === 1 ? String(z) : `{${z}/${n}}`;
const kuerze = (z, n) => { const g = ggt(z, n); return [z / g, n / g]; };
const gemN = (a, b, c, d, L) => { const t = [[a, b], [c, d]].filter(f => f[1] !== L).map(f => `${br(f[0], f[1])} = ${br(f[0] * L / f[1], L)}`); return `Gemeinsamer Nenner ${L}: ${t.join(" und ")}.`; };

const T = (b, q, ans, erk, x) => Object.assign({b, typ:"zahl", q, ans:canon(ans), erk}, x || {});
const W = (b, q, opts, ok, erk, x) => Object.assign({b, typ:"wahl", q, opts, ok, erk}, x || {});
const VGL = ["<", "=", ">"];
const vgl = (a, b) => a < b ? 0 : a === b ? 1 : 2;

const PL = ["Einer", "Zehner", "Hunderter", "Tausender", "Zehntausender", "Hunderttausender", "Millionen"];
const PLATZ = {10:"Zehner", 100:"Hunderter", 1000:"Tausender", 10000:"Zehntausender", 100000:"Hunderttausender", 1000000:"Millionen"};
const stellen = n => String(Math.abs(n)).length;

/* ---------- Plus & Minus ---------- */
function pmZahlen(zr, sw, op){
  let a = 0, b = 0;
  for(let n = 0; n < 400; n++){
    if(zr === 20){
      if(sw === 0){ if(op === "+"){ a = rnd(1, 9); b = rnd(1, 10 - a); } else { a = rnd(2, 10); b = rnd(1, a); } }
      else if(sw === 1){ if(op === "+"){ a = 10 + rnd(1, 8); b = rnd(1, 9 - a % 10); } else { a = 10 + rnd(2, 9); b = rnd(1, a % 10); } }
      else { if(op === "+"){ a = rnd(2, 9); b = rnd(Math.max(2, 11 - a), 9); } else { a = rnd(11, 18); b = rnd(a % 10 + 1, 9); } }
    } else if(zr === 100){
      const f = rnd(0, 2);
      if(sw === 0){
        if(op === "+"){ if(f === 0){ a = rnd(1, 9) * 10; b = rnd(1, 10 - a / 10) * 10; } else if(f === 1){ a = rnd(1, 8) * 10 + rnd(1, 9); b = rnd(1, 9 - Math.floor(a / 10)) * 10; } else { a = rnd(1, 9) * 10 + rnd(0, 8); b = rnd(1, 9 - a % 10); } }
        else { if(f === 0){ a = rnd(2, 10) * 10; b = rnd(1, a / 10) * 10; } else if(f === 1){ a = rnd(2, 9) * 10 + rnd(1, 9); b = rnd(1, Math.floor(a / 10)) * 10; } else { a = rnd(1, 9) * 10 + rnd(1, 9); b = rnd(1, a % 10); } }
      } else if(sw === 1){
        if(op === "+"){ a = rnd(1, 8) * 10 + rnd(2, 9); b = rnd(10 - a % 10, 9); } else { a = rnd(2, 9) * 10 + rnd(0, 8); b = rnd(a % 10 + 1, 9); }
      } else {
        if(op === "+"){ a = rnd(15, 79); b = rnd(11, 99 - a); if((a % 10) + (b % 10) < 10 || b % 10 === 0) continue; }
        else { a = rnd(31, 99); b = rnd(11, a - 1); if(b % 10 <= a % 10) continue; }
      }
    } else if(zr === 1000){
      if(sw === 0){ a = rnd(op === "+" ? 1 : 2, 9) * 100 + (R() < .5 ? rnd(1, 9) * 10 : 0); b = R() < .5 ? rnd(1, 9) * 100 : rnd(1, 9) * 10; }
      else if(sw === 1){ a = rnd(101, 950); b = rnd(11, 99); }
      else { if(op === "+"){ a = rnd(101, 850); b = rnd(101, 999 - a); } else { a = rnd(300, 999); b = rnd(101, a - 1); } }
    } else {
      if(sw === 0){ a = rnd(10, 950) * 1000; b = rnd(1, 99) * 1000; }
      else if(sw === 1){ a = rnd(1000, 9500) * 100; b = rnd(10, 999) * 100; }
      else { if(op === "+"){ a = rnd(100000, 900000); b = rnd(1000, 999999 - a); } else { a = rnd(100000, 999999); b = rnd(1000, a - 1); } }
    }
    if(b <= 0) continue;
    if(op === "+" ? a + b <= zr : (a - b >= 0 && a <= zr)) return [a, b];
  }
  return op === "+" ? [1, 1] : [2, 1];
}
function erkPM(a, b, op){
  const c = op === "+" ? a + b : a - b, o = op === "+" ? " + " : " " + M + " ", plus = op === "+";
  if(c === 0) return `${fz(a)}${o}${fz(b)} = 0, weil beide Zahlen gleich gross sind.`;
  let k = 0; while(k < 5 && a % P10(k + 1) === 0 && b % P10(k + 1) === 0) k++;
  if(k >= 1){ const p = P10(k), nn = k === 1 ? "die Null" : `die ${k} Nullen`;
    return `Ohne ${nn}: ${fz(a / p)}${o}${fz(b / p)} = ${fz(c / p)}. ${k === 1 ? "Null" : "Nullen"} wieder anhängen: ${fz(c)}`; }
  if(b < 10){
    const u = a % 10;
    if(plus && u !== 0 && u + b > 10){ const x = 10 - u, y = b - x; return `${fz(a)} + ${b} = ${fz(a)} + ${x} + ${y} = ${fz(a + x)} + ${y} = ${fz(c)}`; }
    if(!plus && u !== 0 && b > u){ const y = b - u; return `${fz(a)} ${M} ${b} = ${fz(a)} ${M} ${u} ${M} ${y} = ${fz(a - u)} ${M} ${y} = ${fz(c)}`; }
    if(!plus && u === 0 && a >= 10) return `${fz(a)} ${M} ${b} = ${fz(a - 10)} + (10 ${M} ${b}) = ${fz(a - 10)} + ${10 - b} = ${fz(c)}`;
    if(a >= 10){ const e = plus ? u + b : u - b; return `Rechne mit den Einern: ${u}${o}${b} = ${e}. Also ${fz(a)}${o}${b} = ${fz(c)}`; }
    return plus ? `${a} + ${b} = ${c}. Tipp: Zähle von ${a} aus ${b} weiter.` : `${a} ${M} ${b} = ${c}. Tipp: Zähle von ${a} aus ${b} zurück.`;
  }
  const p = P10(stellen(b) - 1), top = Math.floor(b / p) * p, rest = b - top;
  if(rest === 0) return `${fz(a)}${o}${fz(b)} = ${fz(c)}. Tipp: ${fz(b)} sind ${b / p} ${PLATZ[p]}, rechne zuerst mit den ${PLATZ[p]}n.`;
  const zw = plus ? a + top : a - top;
  return `${fz(a)}${o}${fz(b)} = ${fz(a)}${o}${fz(top)}${o}${fz(rest)} = ${fz(zw)}${o}${fz(rest)} = ${fz(c)}`;
}
const PM_AUTO = {1:[[20,0]], 2:[[20,1]], 3:[[20,2]], 4:[[100,0]], 5:[[100,1]], 6:[[100,2]], 7:[[1000,0],[1000,1]], 8:[[1000,1],[1000,2]], 9:[[1000000,0],[1000000,1]], 10:[[1000000,1],[1000000,2]]};
function pmAufgabe(s, opt){
  let zr, sw; const fix = opt && opt.zr && opt.zr !== "auto" ? +opt.zr : 0;
  if(fix){ zr = fix; sw = s <= 3 ? 0 : s <= 7 ? 1 : 2; if(R() < .25 && sw > 0) sw--; }
  else [zr, sw] = pick(PM_AUTO[s] || PM_AUTO[1]);
  const op = R() < .5 ? "+" : "-";
  const [a, b] = pmZahlen(zr, sw, op);
  const c = op === "+" ? a + b : a - b;
  return T("pm", `${fz(a)} ${op === "+" ? "+" : M} ${fz(b)} = □`, c, erkPM(a, b, op), {meta:{op, a, b, zr}});
}

/* ---------- Einmaleins ---------- */
function erkMal(x, y){
  const c = x * y, L = `${x} · ${y}`;
  if(x > 10 || y > 10){
    const [g, k] = x > 10 ? [x, y] : [y, x];
    const z = Math.floor(g / 10) * 10, e = g - z;
    if(e === 0) return `${L} = ${g / 10} · ${k} · 10 = ${g / 10 * k} · 10 = ${fz(c)}`;
    if(k > 10){ const z2 = Math.floor(k / 10) * 10, e2 = k - z2; return `${L} = ${g} · ${z2} + ${g} · ${e2} = ${fz(g * z2)} + ${g * e2} = ${fz(c)}`; }
    return `${L} = ${z} · ${k} + ${e} · ${k} = ${z * k} + ${e * k} = ${fz(c)}`;
  }
  if(x === 1 || y === 1) return `Mal 1 bleibt die Zahl gleich: ${L} = ${c}`;
  if(x === 10 || y === 10) return `Mal 10 heisst: eine Null anhängen. ${L} = ${c}`;
  if(x === 2 || y === 2){ const o2 = x === 2 ? y : x; return `Mal 2 heisst verdoppeln: ${o2} + ${o2} = ${c}`; }
  if(x === 5 || y === 5){ const o5 = x === 5 ? y : x; return `${o5} · 5 ist die Hälfte von ${o5} · 10 = ${o5 * 10}, also ${c}`; }
  let f = null, o = null;
  for(const p of [8, 4, 9, 6, 7, 3]){ if(y === p){ f = y; o = x; break; } if(x === p){ f = x; o = y; break; } }
  if(f === 8) return `${L} = ${o} · 4 · 2 = ${o * 4} · 2 = ${c}`;
  if(f === 4) return `${L} = ${o} · 2 · 2 = ${o * 2} · 2 = ${c}`;
  if(f === 9) return `${L} = ${o} · 10 ${M} ${o} = ${o * 10} ${M} ${o} = ${c}`;
  if(f === 6 || f === 7) return `${L} = ${o} · 5 + ${o} · ${f - 5} = ${o * 5} + ${o * (f - 5)} = ${c}`;
  if(f === 3) return `${L} = ${o} · 2 + ${o} = ${o * 2} + ${o} = ${c}`;
  return `${L} = ${c}`;
}
function gewichtet(liste, gew){
  const w = liste.map(gew), sum = w.reduce((s, x) => s + x, 0); let r = R() * sum;
  for(let i = 0; i < liste.length; i++){ r -= w[i]; if(r < 0) return liste[i]; } return liste[liste.length - 1];
}
function emmZehner(){
  const x = rnd(2, 9), y = rnd(2, 9), t = R() < .3 ? 100 : 10, X = x * t, p = X * y;
  if(R() < .5){ const [a, b] = R() < .5 ? [X, y] : [y, X]; return T("emm", `${fz(a)} · ${fz(b)} = □`, p, `${fz(a)} · ${fz(b)} = ${x} · ${y} · ${t} = ${x * y} · ${t} = ${fz(p)}`, {meta:{op:"*", x:a, y:b}}); }
  return T("emm", `${fz(p)} : ${y} = □`, X, `Rechne ${x * y} : ${y} = ${x}, dann · ${t}. Also ${fz(p)} : ${y} = ${fz(X)}`, {meta:{op:":", x:p, y}});
}
function emmGross(s){
  if(s >= 10 && R() < .3){ const n = rnd(11, 20); return T("emm", `${n} · ${n} = □`, n * n, erkMal(n, n), {meta:{op:"*", x:n, y:n}}); }
  const g = rnd(11, 20), k = rnd(2, 9), p = g * k;
  if(R() < .65){ const [a, b] = R() < .5 ? [g, k] : [k, g]; return T("emm", `${a} · ${b} = □`, p, erkMal(a, b), {meta:{op:"*", x:a, y:b}}); }
  return T("emm", `${p} : ${k} = □`, g, `${p} : ${k} = ${g}, weil ${erkMal(g, k)}`, {meta:{op:":", x:p, y:k}});
}
function emmAufgabe(s, opt, schwach){
  opt = opt || {};
  const gew = r => 1 + (s >= 4 && r >= 6 && r <= 9 ? 1 : 0) + Math.min(4, (schwach && schwach[r]) || 0);
  let reihen = Array.isArray(opt.reihen) && opt.reihen.length ? opt.reihen : null;
  let modus = opt.modus || "auto";
  if(!reihen){
    if(s >= 9 && R() < .55) return emmGross(s);
    if(s >= 8 && R() < .45) return emmZehner();
    reihen = s <= 1 ? [2, 5, 10] : s === 2 ? [1, 2, 4, 5, 10] : s === 3 ? [2, 3, 4, 5, 6, 10] : [2, 3, 4, 5, 6, 7, 8, 9, 10];
  }
  if(modus === "auto") modus = s <= 4 ? "mal" : s <= 6 ? (R() < .4 ? "durch" : "mal") : "beides";
  const r = gewichtet(reihen, gew), a = s <= 2 ? rnd(1, 10) : rnd(2, 10), p = a * r;
  let form = modus === "mal" ? "mal" : modus === "durch" ? "durch" : (R() < .5 ? "mal" : "durch");
  if(form === "mal" && s >= 7 && R() < .3) form = "luecke";
  if(form === "mal"){ const [x, y] = R() < .5 ? [a, r] : [r, a]; return T("emm", `${x} · ${y} = □`, p, erkMal(x, y), {reihe:r, meta:{op:"*", x, y}}); }
  if(form === "durch") return T("emm", `${p} : ${r} = □`, a, `${p} : ${r} = ${a}, weil ${a} · ${r} = ${p}`, {reihe:r, meta:{op:":", x:p, y:r}});
  return T("emm", `□ · ${r} = ${p}`, a, `Welche Zahl mal ${r} gibt ${p}? ${a} · ${r} = ${p}`, {reihe:r, meta:{op:"?*", x:p, y:r}});
}

/* ---------- Kopfrechnen gemischt ---------- */
function kopfSpezial(art){
  if(art === "doppelt"){ const n = rnd(6, 49), z = Math.floor(n / 10) * 10, e = n % 10;
    return T("kopf", `Das Doppelte von ${n} ist □`, 2 * n, e && z ? `${n} + ${n} = ${z} + ${z} + ${e} + ${e} = ${2 * z} + ${2 * e} = ${2 * n}` : `${n} + ${n} = ${2 * n}`, {meta:{op:"dop", a:n}}); }
  if(art === "haelfte"){ const n = rnd(5, 49) * 2, z = Math.floor(n / 20) * 20, e = n - z;
    return T("kopf", `Die Hälfte von ${n} ist □`, n / 2, z && e ? `${n} : 2 = ${z} : 2 + ${e} : 2 = ${z / 2} + ${e / 2} = ${n / 2}` : `${n} : 2 = ${n / 2}`, {meta:{op:"hal", a:n}}); }
  if(art === "pvs"){ // Punkt vor Strich
    const f = rnd(1, 4);
    if(f === 1){ const a = rnd(2, 40), b = rnd(2, 9), c = rnd(2, 9); return T("kopf", `${a} + ${b} · ${c} = □`, a + b * c, `Punkt vor Strich: ${b} · ${c} = ${b * c}, dann ${a} + ${b * c} = ${a + b * c}`, {meta:{expr:`${a}+${b}*${c}`}}); }
    if(f === 2){ const a = rnd(2, 9), b = rnd(2, 9), c = rnd(1, a * b); return T("kopf", `${a} · ${b} ${M} ${c} = □`, a * b - c, `Punkt vor Strich: ${a} · ${b} = ${a * b}, dann ${a * b} ${M} ${c} = ${a * b - c}`, {meta:{expr:`${a}*${b}-${c}`}}); }
    if(f === 3){ const b = rnd(2, 9), c = rnd(2, 9), a = b * c + rnd(0, 40); return T("kopf", `${a} ${M} ${b} · ${c} = □`, a - b * c, `Punkt vor Strich: ${b} · ${c} = ${b * c}, dann ${a} ${M} ${b * c} = ${a - b * c}`, {meta:{expr:`${a}-${b}*${c}`}}); }
    const b = rnd(2, 9), q = rnd(2, 9), a = b * q, c = rnd(2, 30); return T("kopf", `${a} : ${b} + ${c} = □`, q + c, `Punkt vor Strich: ${a} : ${b} = ${q}, dann ${q} + ${c} = ${q + c}`, {meta:{expr:`${a}/${b}+${c}`}});
  }
  if(art === "klammer"){
    const f = rnd(1, 5);
    if(f === 1){ const a = rnd(2, 12), b = rnd(2, 12), c = rnd(2, 9); return T("kopf", `(${a} + ${b}) · ${c} = □`, (a + b) * c, `Zuerst die Klammer: ${a} + ${b} = ${a + b}, dann ${a + b} · ${c} = ${(a + b) * c}`, {meta:{expr:`(${a}+${b})*${c}`}}); }
    if(f === 2){ const b = rnd(2, 15), a = b + rnd(1, 10), c = rnd(2, 9); return T("kopf", `(${a} ${M} ${b}) · ${c} = □`, (a - b) * c, `Zuerst die Klammer: ${a} ${M} ${b} = ${a - b}, dann ${a - b} · ${c} = ${(a - b) * c}`, {meta:{expr:`(${a}-${b})*${c}`}}); }
    if(f === 3){ const a = rnd(2, 9), b = rnd(2, 12), c = rnd(2, 12); return T("kopf", `${a} · (${b} + ${c}) = □`, a * (b + c), `Zuerst die Klammer: ${b} + ${c} = ${b + c}, dann ${a} · ${b + c} = ${a * (b + c)}`, {meta:{expr:`${a}*(${b}+${c})`}}); }
    if(f === 4){ const c = rnd(2, 9), q = rnd(2, 10), s = c * q, a = rnd(1, s - 1), b = s - a; return T("kopf", `(${a} + ${b}) : ${c} = □`, q, `Zuerst die Klammer: ${a} + ${b} = ${s}, dann ${s} : ${c} = ${q}`, {meta:{expr:`(${a}+${b})/${c}`}}); }
    const b = rnd(5, 40), c = rnd(5, 40), a = b + c + rnd(0, 50); return T("kopf", `${a} ${M} (${b} + ${c}) = □`, a - b - c, `Zuerst die Klammer: ${b} + ${c} = ${b + c}, dann ${a} ${M} ${b + c} = ${a - b - c}`, {meta:{expr:`${a}-(${b}+${c})`}});
  }
  const n = rnd(2, 15); return T("kopf", `${n} · ${n} = □`, n * n, erkMal(n, n), {meta:{op:"*", x:n, y:n}}); // Quadratzahl
}
const KOPF = {1:["pm1","pm1","doppelt"], 2:["pm2","emm1","doppelt"], 3:["pm4","emm2","doppelt","haelfte"], 4:["pm5","emm4","haelfte","doppelt"],
  5:["pm6","emm5","haelfte"], 6:["pm7","emm6","pvs","doppelt"], 7:["pm7","emm7","pvs","pvs"], 8:["pm8","emm8","klammer","pvs"],
  9:["pm8","emm9","quadrat","pvs","klammer"], 10:["pm9","emm10","klammer","pvs","quadrat"]};
function kopfAufgabe(s){
  const art = pick(KOPF[s] || KOPF[1]);
  let t;
  if(art.startsWith("pm")) t = pmAufgabe(+art.slice(2), null);
  else if(art.startsWith("emm")){ t = emmAufgabe(+art.slice(3), null, null); delete t.reihe; }
  else t = kopfSpezial(art);
  t.b = "kopf"; return t;
}

/* ---------- Schriftlich ---------- */
const zahlMit = n => rnd(P10(n - 1), P10(n) - 1);
function erkAddS(z){
  const c = z.reduce((s, x) => s + x, 0), L = stellen(Math.max(...z)); let carry = 0; const out = [];
  for(let i = 0; i < L; i++){
    const d = z.filter(x => x >= P10(i)).map(x => Math.floor(x / P10(i)) % 10);
    const sum = d.reduce((s, x) => s + x, 0) + carry;
    out.push(`${PL[i]}: ${d.join(" + ")}${carry ? ` + ${carry}` : ""} = ${sum}` + (i < L - 1 && sum >= 10 ? `, schreibe ${sum % 10}, merke ${Math.floor(sum / 10)}` : ""));
    carry = Math.floor(sum / 10);
  }
  return out.join(". ") + `. Ergebnis: ${fz(c)}`;
}
function erkSubS(a, b){
  const L = stellen(a), lb = stellen(b); let carry = 0; const out = [];
  for(let i = 0; i < L; i++){
    const o = Math.floor(a / P10(i)) % 10, u = i < lb ? Math.floor(b / P10(i)) % 10 : 0, ab = u + carry;
    if(i >= lb && !carry){ out.push(`${PL[i]}: ${o} bleibt`); continue; }
    const abT = carry ? (i < lb ? `(${u} + 1)` : "1") : `${u}`;
    if(o >= ab){ out.push(`${PL[i]}: ${o} ${M} ${abT} = ${o - ab}`); carry = 0; }
    else { out.push(`${PL[i]}: ${o} ${M} ${abT} geht nicht, also ${o + 10} ${M} ${abT} = ${o + 10 - ab}, merke 1`); carry = 1; }
  }
  return out.join(". ") + `. Ergebnis: ${fz(a - b)}`;
}
function zerlege(x){ const t = []; let p = 1; while(x > 0){ const d = x % 10; if(d) t.unshift(d * p); x = Math.floor(x / 10); p *= 10; } return t; }
function erkMulS(a, b){
  const c = a * b;
  if(b < 10){ const t = zerlege(a); if(t.length < 2) return `${fz(a)} · ${b} = ${fz(c)}`;
    return `${fz(a)} · ${b} = ${t.map(x => `${fz(x)} · ${b}`).join(" + ")} = ${t.map(x => fz(x * b)).join(" + ")} = ${fz(c)}`; }
  const t = zerlege(b);
  return `${fz(a)} · ${fz(b)} = ${t.map(x => `${fz(a)} · ${fz(x)}`).join(" + ")} = ${t.map(x => fz(a * x)).join(" + ")} = ${fz(c)}`;
}
const SCHR = {1:["a33"], 2:["a33","s33"], 3:["a43","s33"], 4:["a44","s44"], 5:["s44","m31"], 6:["a55","m31","m22"], 7:["s55","m32"],
  8:["m32","a555"], 9:["m42","s66"], 10:["m33","m42","a666"]};
function schrAufgabe(s){
  const art = pick(SCHR[s] || SCHR[1]), op = art[0], d = art.slice(1).split("").map(Number);
  if(op === "a"){ const z = d.map(zahlMit), c = z.reduce((x, y) => x + y, 0);
    return T("schr", z.map(fz).join(" + ") + " = □", c, erkAddS(z), {col:{op:"+", z, len:stellen(Math.max(...z)) + 1}, meta:{op:"+", z}}); }
  if(op === "s"){ let a = zahlMit(d[0]), b = zahlMit(d[1]); if(b > a) [a, b] = [b, a]; if(a === b) a += rnd(1, 9);
    return T("schr", `${fz(a)} ${M} ${fz(b)} = □`, a - b, erkSubS(a, b), {col:{op:M, z:[a, b], len:stellen(a) + 1}, meta:{op:"-", z:[a, b]}}); }
  const a = zahlMit(d[0]), b = d[1] === 1 ? rnd(2, 9) : zahlMit(d[1]);
  return T("schr", `${fz(a)} · ${fz(b)} = □`, a * b, erkMulS(a, b), {col:{op:"·", z:[a, b], len:stellen(a) + stellen(b)}, meta:{op:"*", z:[a, b]}});
}

/* ---------- Brüche ---------- */
function echterBruch(nmin, nmax){ let z, n; do{ n = rnd(nmin, nmax); z = rnd(1, n - 1); } while(ggt(z, n) !== 1); return [z, n]; }
function wahlBrueche(korrekt, kandidaten, extraGleich){ // korrekt [z,n] gekürzt; Kandidaten haben einen anderen Wert
  const wert = f => f[0] / f[1], gesehen = new Set([br(...korrekt)]), werte = [wert(korrekt)], opts = [korrekt];
  if(extraGleich && !gesehen.has(br(...extraGleich))){ opts.push(extraGleich); gesehen.add(br(...extraGleich)); }
  const zusatz = [[korrekt[0] + 1, korrekt[1]], [korrekt[0], korrekt[1] + 1], [korrekt[0] + 2, korrekt[1] + 1], [korrekt[0] + 1, korrekt[1] * 2 + 1]];
  for(const k of mischen(kandidaten).concat(zusatz)){
    if(opts.length >= 4) break;
    if(!k || k[0] <= 0 || k[1] <= 1 || !Number.isInteger(k[0]) || !Number.isInteger(k[1])) continue;
    const kk = kuerze(k[0], k[1]); if(kk[1] === 1 && kk[0] > 3) continue;
    const s = br(...kk), v = wert(kk);
    if(gesehen.has(s) || werte.some(w => Math.abs(w - v) < 1e-9)) continue;
    gesehen.add(s); werte.push(v); opts.push(kk);
  }
  const m = mischen(opts); return {opts:m.map(f => br(...f)), ok:m.indexOf(korrekt), vals:m.map(f => f.slice())};
}
function brAufgabe(s){
  if(s === 1){ // erweitern
    const [z, n] = echterBruch(2, 6), k = rnd(2, 5);
    if(R() < .7) return T("br", `${br(z, n)} = {□/${n * k}}`, z * k, `Der Nenner wird mit ${k} malgenommen (${n} · ${k} = ${n * k}), also auch der Zähler: ${z} · ${k} = ${z * k}`, {meta:{art:"erw", z, n, k, frage:"z"}});
    return T("br", `${br(z, n)} = {${z * k}/□}`, n * k, `Der Zähler wird mit ${k} malgenommen (${z} · ${k} = ${z * k}), also auch der Nenner: ${n} · ${k} = ${n * k}`, {meta:{art:"erw", z, n, k, frage:"n"}});
  }
  if(s === 2){ // kürzen
    const [p, q] = echterBruch(2, 9), k = pick([2, 3, 4, 5, 6]), Z = p * k, N = q * k;
    let teil = null; if(k === 4) teil = [p * 2, q * 2]; if(k === 6) teil = R() < .5 ? [p * 2, q * 2] : [p * 3, q * 3];
    const w = wahlBrueche([p, q], [[p + 1, q], [p, q + 1], [p + 1, q + 1], [Z, q], [p, N], [p - 1, q], [q, p + q]], teil);
    return W("br", `Kürze vollständig: ${br(Z, N)} = □`, w.opts, w.ok, `Teile Zähler und Nenner durch ${k}: ${Z} : ${k} = ${p} und ${N} : ${k} = ${q}. Also ${br(p, q)}`, {meta:{art:"kuerz", Z, N, vals:w.vals}});
  }
  if(s === 3 || s === 4 || s === 7){ // vergleichen
    let a, b, c, d, erk;
    if(s === 3){ b = d = rnd(3, 12); a = rnd(1, b - 1); c = R() < .12 ? a : rnd(1, b - 1);
      erk = `Gleicher Nenner: vergleiche die Zähler. ${a} ${VGL[vgl(a, c)]} ${c}`; }
    else if(s === 4){
      if(R() < .3){ [a, b] = echterBruch(2, 6); const k = rnd(2, 4); c = a * k; d = b * k; if(R() < .5) [a, b, c, d] = [c, d, a, b];
        const [g1, g2] = a > c ? [a, b] : [c, d]; erk = `${br(g1, g2)} lässt sich kürzen zu ${br(...kuerze(g1, g2))}. Beide Brüche sind gleich gross`; }
      else { a = c = rnd(1, 5); do{ b = rnd(a + 1, 12); d = rnd(a + 1, 12); } while(b === d);
        erk = `Gleicher Zähler: je grösser der Nenner, desto kleiner die Teile. ${b > d ? br(a, b) : br(c, d)} hat die kleineren Teile`; }
    } else {
      do{ b = rnd(2, 12); d = rnd(2, 12); } while(b === d);
      a = rnd(1, b - 1); c = rnd(1, d - 1);
      const L = kgv(b, d); erk = `${gemN(a, b, c, d, L)} Vergleiche ${a * L / b} und ${c * L / d}`;
    }
    const ok = vgl(a * d, c * b);
    return W("br", `${br(a, b)} □ ${br(c, d)}`, VGL.slice(), ok, erk + `, also ${br(a, b)} ${VGL[ok]} ${br(c, d)}.`, {vgl:true, meta:{art:"vgl", a, b, c, d}});
  }
  if(s === 5 || s === 6){ // gleicher Nenner
    const n = rnd(3, 12); let a, c;
    if(s === 5){ a = rnd(1, n - 1); c = rnd(1, n - a); } else { a = rnd(2, n - 1); c = rnd(1, a - 1); }
    const r = s === 5 ? a + c : a - c, k = kuerze(r, n), o = s === 5 ? "+" : M;
    const w = wahlBrueche(k, [[r, 2 * n], [r + 1, n], [r - 1, n], [r, n + 1], [a * c, n], [r + 2, n], [r - 2, n]]);
    const erk = `Gleicher Nenner: rechne nur mit den Zählern. ${a} ${o} ${c} = ${r}, also ${br(r, n)}` + (k[1] !== n ? ` = ${br(...k)} (gekürzt)` : "");
    return W("br", `${br(a, n)} ${o} ${br(c, n)} = □`, w.opts, w.ok, erk, {meta:{art:s === 5 ? "add" : "sub", a, b:n, c, d:n, vals:w.vals}});
  }
  if(s === 8 || s === 9){ // ungleiche Nenner
    const NN = [2, 3, 4, 5, 6, 8, 10, 12]; let a, b, c, d;
    for(let i = 0; i < 200; i++){
      b = pick(NN); d = pick(NN); if(b === d) continue; a = rnd(1, b - 1); c = rnd(1, d - 1);
      if(ggt(a, b) !== 1 || ggt(c, d) !== 1) continue;
      if(s === 9 && a * d <= c * b) continue; break;
    }
    const L = kgv(b, d), A = a * L / b, C = c * L / d, r = s === 8 ? A + C : A - C, k = kuerze(r, L), o = s === 8 ? "+" : M;
    const w = wahlBrueche(k, [[s === 8 ? a + c : Math.abs(a - c), b + d], [r + 1, L], [r - 1, L], [r, L * 2], [s === 8 ? a + c : a * c, b * d], [r + 2, L]]);
    const erk = `${gemN(a, b, c, d, L)} ${A} ${o} ${C} = ${r}, also ${br(r, L)}` + (k[1] !== L ? ` = ${br(...k)} (gekürzt)` : "");
    return W("br", `${br(a, b)} ${o} ${br(c, d)} = □`, w.opts, w.ok, erk, {meta:{art:s === 8 ? "add" : "sub", a, b, c, d, vals:w.vals}});
  }
  const n = rnd(2, 10), z = rnd(1, n - 1), g = n * rnd(2, 12); // 10: Bruchteil von einer Zahl
  return T("br", `${br(z, n)} von ${g} = □`, g / n * z, `${g} : ${n} = ${g / n}, dann ${g / n} · ${z} = ${g / n * z}`, {meta:{art:"teil", z, n, g}});
}

/* ---------- Dezimalzahlen und Runden ---------- */
const RUNDNAME = {10:"Zehner", 100:"Hunderter", 1000:"Tausender", 10000:"Zehntausender"};
const DEZNAME = {0:"Ganze", 1:"Zehntel", 2:"Hundertstel"};
const rundeGanz = (n, p) => Math.floor((n + p / 2) / p) * p;
const rundText = d => d >= 5 ? "5 oder mehr: aufrunden" : "Kleiner als 5: abrunden";
function rundAufgabe(n, p){
  const r = rundeGanz(n, p), d = Math.floor(n / (p / 10)) % 10;
  return T("dez", `Runde auf ${RUNDNAME[p]}: ${fz(n)} ≈ □`, r, `Schau die Ziffer rechts von den ${RUNDNAME[p]}n an: ${d}. ${rundText(d)}, also ${fz(r)}`, {meta:{art:"rund", n, p}});
}
function rundDez(v, k, j){
  if(v % 10 === 0) v += rnd(1, 9);
  const p = P10(k - j), rj = Math.floor((v + p / 2) / p), d = Math.floor(v / P10(k - j - 1)) % 10;
  return T("dez", `Runde auf ${DEZNAME[j]}: ${fk(dz(v, k))} ≈ □`, dz(rj, j), `Schau die Ziffer rechts davon an: ${d}. ${rundText(d)}, also ${fk(dz(rj, j))}`, {meta:{art:"rundd", v:dz(v, k), j}});
}
function dezAufgabe(s){
  if(s === 1) return R() < .7 ? rundAufgabe(rnd(11, 999), 10) : rundAufgabe(rnd(101, 999), 100);
  if(s === 2) return R() < .6 ? rundAufgabe(rnd(101, 9999), 100) : rundAufgabe(rnd(1001, 9999), pick([10, 1000]));
  if(s === 3){ const n = rnd(1001, 999999); return rundAufgabe(n, pick([100, 1000, 10000].filter(p => p * 10 <= n))); }
  if(s === 4 || s === 5){ // eine Stelle nach dem Komma
    let a = rnd(11, 99), b = rnd(11, 99); const op = s === 4 ? "+" : "-";
    if(a % 10 === 0) a++; if(b % 10 === 0) b++;
    if(op === "-" && b > a) [a, b] = [b, a];
    const r = op === "+" ? a + b : a - b, o = op === "+" ? "+" : M;
    return T("dez", `${fk(dz(a, 1))} ${o} ${fk(dz(b, 1))} = □`, dz(r, 1), `Rechne in Zehnteln: ${a} ${o} ${b} = ${r} Zehntel, also ${fk(dz(r, 1))}`, {meta:{art:op, a:dz(a, 1), b:dz(b, 1)}});
  }
  if(s === 6){ const k = rnd(2, 3), j = rnd(0, k - 1); return rundDez(rnd(P10(k) + 1, 30 * P10(k)), k, j); }
  if(s === 7){ // mal / durch 10, 100, 1000
    const e = rnd(1, 3), f = P10(e), mal = R() < .5, k = mal ? rnd(1, 3) : rnd(0, 2), st = e === 1 ? "Stelle" : "Stellen"; let v; do{ v = rnd(1, 9999); } while(mal && v % 10 === 0);
    if(mal){ const r = dz(v * f, k); return T("dez", `${fk(dz(v, k))} · ${fz(f)} = □`, r, `Mal ${fz(f)}: das Komma rückt ${e} ${st} nach rechts. Also ${fk(r)}`, {meta:{art:"*", a:dz(v, k), f}}); }
    const r = dz(v, k + e); return T("dez", `${fk(dz(v, k))} : ${fz(f)} = □`, r, `Durch ${fz(f)}: das Komma rückt ${e} ${st} nach links. Also ${fk(r)}`, {meta:{art:"/", a:dz(v, k), f}});
  }
  if(s === 8){
    if(R() < .3){ const a = rnd(101, 999), b = rnd(101, 999); return T("dez", `${fk(dz(a, 2))} + ${fk(dz(b, 2))} = □`, dz(a + b, 2), `Rechne in Hundertsteln: ${a} + ${b} = ${a + b} Hundertstel, also ${fk(dz(a + b, 2))}`, {meta:{art:"+", a:dz(a, 2), b:dz(b, 2)}}); }
    const k1 = rnd(1, 2), k2 = rnd(1, 3), v1 = rnd(1, P10(k1) * 3 - 1); let v2;
    if(R() < .2 && k2 > k1) v2 = v1 * P10(k2 - k1); else v2 = rnd(1, P10(k2) * 3 - 1);
    const A = v1 * P10(3 - k1), B = v2 * P10(3 - k2), ok = vgl(A, B), sa = fk(dz(v1, k1)), sb = fk(dz(v2, k2));
    const pad = (v, k) => { const [i, f = ""] = dz(v, k).split(","); return fk(i) + "," + f.padEnd(3, "0"); };
    return W("dez", `${sa} □ ${sb}`, VGL.slice(), ok, `Gleich viele Stellen nach dem Komma: ${pad(v1, k1)} und ${pad(v2, k2)}. Also ${sa} ${VGL[ok]} ${sb}`, {vgl:true, meta:{art:"vgl", a:dz(v1, k1), b:dz(v2, k2)}});
  }
  if(s === 9){ let v; do{ v = rnd(2, 99); } while(v % 10 === 0); const n = rnd(2, 9);
    return T("dez", `${fk(dz(v, 1))} · ${n} = □`, dz(v * n, 1), `Rechne ohne Komma: ${v} · ${n} = ${v * n}. Dann eine Stelle nach dem Komma: ${fk(dz(v * n, 1))}`, {meta:{art:"*", a:dz(v, 1), f:n}}); }
  if(R() < .5) return rundDez(rnd(1001, 20000), 3, 2);
  const a = rnd(2, 20) * 100; let b; do{ b = rnd(101, a - 1); } while(b % 10 === 0);
  return T("dez", `${fk(dz(a, 2))} ${M} ${fk(dz(b, 2))} = □`, dz(a - b, 2), `Rechne in Hundertsteln: ${a} ${M} ${b} = ${a - b} Hundertstel, also ${fk(dz(a - b, 2))}`, {meta:{art:"-", a:dz(a, 2), b:dz(b, 2)}});
}

/* ---------- Masseinheiten ---------- */
const EH = {laenge:{km:1000000, m:1000, cm:10, mm:1}, gewicht:{t:1000000, kg:1000, g:1}, vol:{l:1000, dl:100, ml:1}, zeit:{h:3600, min:60, s:1}, geld:{"Fr.":100, "Rp.":1}};
const katVon = u => Object.keys(EH).find(k => EH[k][u] != null);
const MASS = {
  1:[["m","cm","g",1,9],["Fr.","Rp.","g",1,9],["cm","m","r",1,9],["Rp.","Fr.","r",1,9]],
  2:[["h","min","g",1,5],["min","s","g",1,5],["min","h","r",1,4],["s","min","r",1,5],["m","cm","g",10,20]],
  3:[["kg","g","g",1,9],["g","kg","r",1,9],["l","dl","g",1,9],["dl","l","r",1,9]],
  4:[["km","m","g",1,9],["cm","mm","g",2,30],["mm","cm","r",2,30],["l","ml","g",1,5],["ml","l","r",1,5],["m","km","r",1,9]],
  5:[["m","cm","c"],["Fr.","Rp.","c"],["h","min","c"],["kg","g","c"],["l","dl","c"],["km","m","c"]],
  6:[["kg","g","d"],["km","m","d"],["l","ml","d"],["Fr.","Rp.","d"],["m","cm","d"],["h","min","d"]],
  7:[["cm","m","rd"],["g","kg","rd"],["Rp.","Fr.","rd"],["ml","l","rd"],["dl","l","rd"],["m","km","rd"]],
  8:[["mm","m","rd"],["kg","t","rd"],["t","kg","d"],["min","h","rd"],["km","cm","g",1,9],["s","min","r",2,15]],
  9:[["h","min","c"],["min","s","c"],["h","min","d"],["km","cm","d"],["l","dl","d"],["mm","cm","rd"]]
};
const zeigeMenge = (c, u) => u === "Fr." && c.includes(",") ? fFr(Math.round(Number(c.replace(",", ".")) * 100)) : fk(c);
function massAufgabe(s){
  for(let v = 0; v < 50; v++){
    const st = s === 10 ? pick([6, 7, 8, 9]) : s, [u1, u2, art, lo, hi] = pick(MASS[st]), kat = katVon(u1), f1 = EH[kat][u1], f2 = EH[kat][u2];
    if(art === "c"){ // zusammengesetzt: 2 m 35 cm = □ cm
      const ratio = f1 / f2, a = rnd(1, 9);
      const b = kat === "geld" ? rnd(1, 19) * 5 : (kat === "gewicht" || ratio === 1000) ? rnd(1, 99) * 10 : rnd(1, ratio - 1);
      const ans = a * ratio + b;
      return T("mass", `${a} ${u1} ${b} ${u2} = □ ${u2}`, ans, `${a} ${u1} = ${fz(a * ratio)} ${u2}, dazu ${b} ${u2}: ${fz(a * ratio)} + ${b} = ${fz(ans)} ${u2}`, {meta:{c:true, u1, u2, a, b}});
    }
    let x, base;
    if(art === "g"){ x = String(rnd(lo, hi)); base = +x * f1; }
    else if(art === "r"){ const y = rnd(lo, hi); base = y * f2; x = String(base / f1); }
    else if(art === "d"){
      if(kat === "zeit"){ const hh = rnd(0, 3) * 100 + pick([25, 50, 75]); x = dz(hh, 2); base = hh * f1 / 100; }
      else if(kat === "geld"){ const rp = rnd(1, 20) * 100 + rnd(1, 19) * 5; x = dz(rp, 2); base = rp; }
      else { const k = f1 / f2 >= 100 ? rnd(1, 2) : 1; let xi; do{ xi = rnd(1, 9 * P10(k)); } while(xi % 10 === 0); x = dz(xi, k); base = xi * f1 / P10(k); }
    } else { // rd: kleine Einheit, Antwort mit Komma
      const ratio = f2 / f1;
      if(kat === "zeit"){ const mins = rnd(1, 4) * 60 + pick([15, 30, 45]); base = mins * 60; x = String(mins); }
      else if(kat === "geld"){ let rp; do{ rp = rnd(21, 1999) * 5; } while(rp % 100 === 0); base = rp; x = String(rp); }
      else { let xi; do{ xi = ratio === 10 ? rnd(11, 99) : ratio === 100 ? (R() < .5 ? rnd(11, 99) : rnd(101, 999)) : (R() < .5 ? rnd(11, 99) * 10 : rnd(101, 9999)); } while(xi % ratio === 0);
        base = xi * f1; x = String(xi); }
    }
    const ans = quot(base, f2);
    if(ans == null || !Number.isInteger(base) || base <= 0) continue;
    const xs = zeigeMenge(canon(x), u1), gross = f1 > f2, rel = gross ? f1 / f2 : f2 / f1;
    const erk = gross ? `1 ${u1} = ${fz(rel)} ${u2}, also ${xs} · ${fz(rel)} = ${fk(ans)} ${u2}` : `${fz(rel)} ${u1} = 1 ${u2}, also ${xs} : ${fz(rel)} = ${fk(ans)} ${u2}`;
    return T("mass", `${xs} ${u1} = □ ${u2}`, ans, erk, {meta:{u1, u2, x:canon(x)}});
  }
  return T("mass", `1 m = □ cm`, 100, `1 m = 100 cm`, {meta:{u1:"m", u2:"cm", x:"1"}});
}

/* ---------- Prozent ---------- */
const PROZ_TIPP = {50:"50 % ist die Hälfte", 25:"25 % ist ein Viertel", 10:"10 % ist ein Zehntel", 20:"20 % ist ein Fünftel", 75:"75 % sind drei Viertel", 5:"5 % ist die Hälfte von 10 %", 1:"1 % ist ein Hundertstel"};
function prozVon(p, gmin, gmax){ const st = 100 / ggt(p, 100), lo = Math.ceil(gmin / st), hi = Math.max(lo, Math.floor(gmax / st)); return st * rnd(lo, hi); }
function erkProz(p, g){
  if(PROZ_TIPP[p]) return `${PROZ_TIPP[p]}. ${p} % von ${fz(g)} = ${fk(quot(g * p, 100))}`;
  return `1 % von ${fz(g)} sind ${fk(quot(g, 100))}. ${p} % sind ${p} · ${fk(quot(g, 100))} = ${fk(quot(g * p, 100))}`;
}
function prozAufgabe(s){
  if(s === 10) s = rnd(3, 9);
  if(s <= 3){
    const p = s === 1 ? pick([50, 25, 10]) : s === 2 ? pick([20, 75, 5, 1, 50]) : pick([15, 30, 40, 60, 70, 80, 90, 35, 45, 12]);
    const g = prozVon(p, 20, s === 3 ? 600 : 400);
    return T("proz", `${p} % von ${fz(g)} = □`, g * p / 100, erkProz(p, g), {meta:{art:"von", p, g}});
  }
  if(s === 4){ const p = pick([10, 20, 25, 40, 50, 75, 5, 60, 30]), g = prozVon(p, 20, 300), a = g * p / 100;
    return T("proz", `${fz(a)} von ${fz(g)} sind □ %`, p, `${fz(a)} : ${fz(g)} = ${fk(quot(a, g))}, das sind ${p} Hundertstel, also ${p} %`, {meta:{art:"anteil", a, g}}); }
  if(s === 5){ const p = pick([10, 20, 25, 50, 30, 40, 15]), g = prozVon(p, 40, 900), r = g * p / 100;
    return T("proz", `${fz(g)} Fr. mit ${p} % Rabatt kosten □ Fr.`, g - r, `${p} % von ${fz(g)} sind ${fz(r)}. ${fz(g)} ${M} ${fz(r)} = ${fz(g - r)}`, {meta:{art:"rabatt", p, g}}); }
  if(s === 6){ const n = pick([2, 4, 5, 10, 20, 25, 50]), z = rnd(1, n - 1);
    return T("proz", `${br(z, n)} = □ %`, z * 100 / n, `Erweitere auf Hundertstel: ${br(z, n)} = ${br(z * 100 / n, 100)}, also ${z * 100 / n} %`, {meta:{art:"bruch", z, n}}); }
  if(s === 7){ const p = rnd(1, 99);
    if(R() < .5) return T("proz", `${fk(dz(p, 2))} = □ %`, p, `${fk(dz(p, 2))} sind ${p} Hundertstel, also ${p} %`, {meta:{art:"d2p", d:dz(p, 2)}});
    return T("proz", `${p} % = □`, dz(p, 2), `${p} % sind ${p} Hundertstel, also ${fk(dz(p, 2))}`, {meta:{art:"p2d", p}}); }
  if(s === 8){ const p = pick([10, 20, 25, 50, 5, 40]), g = prozVon(p, 40, 800), w = g * p / 100;
    return T("proz", `${p} % sind ${fz(w)}. 100 % sind □`, g, `${p} % sind ${fz(w)}, also ist 1 % gleich ${fk(quot(w, p))}. 100 % sind 100 · ${fk(quot(w, p))} = ${fz(g)}`, {meta:{art:"grund", p, w}}); }
  const p = pick([10, 20, 25, 50, 5, 15, 30]), g = prozVon(p, 40, 800), r = g * p / 100;
  return T("proz", `${fz(g)} wird um ${p} % erhöht. Neu: □`, g + r, `${p} % von ${fz(g)} sind ${fz(r)}. ${fz(g)} + ${fz(r)} = ${fz(g + r)}`, {meta:{art:"plus", p, g}});
}

/* ---------- Gleichungen ---------- */
const kx = a => (a === 1 ? "" : a) + "x";
function glAufgabe(s){
  if(s === 10) s = rnd(4, 9);
  let x, q, erk;
  if(s === 1){ x = rnd(1, 10); const a = rnd(1, 10); q = `x + ${a} = ${x + a}`; erk = `x + ${a} = ${x + a}  | ${M} ${a}  →  x = ${x + a} ${M} ${a} = ${x}`; }
  else if(s === 2){ if(R() < .5){ const a = rnd(2, 30); x = a + rnd(0, 40); q = `x ${M} ${a} = ${x - a}`; erk = `x ${M} ${a} = ${x - a}  | + ${a}  →  x = ${x - a} + ${a} = ${x}`; }
    else { const a = rnd(5, 50); x = rnd(1, 99 - a); q = `${a} + x = ${a + x}`; erk = `${a} + x = ${a + x}  | ${M} ${a}  →  x = ${a + x} ${M} ${a} = ${x}`; } }
  else if(s === 3){ if(R() < .5){ const a = rnd(10, 99); x = rnd(1, a); q = `${a} ${M} x = ${a - x}`; erk = `Was muss man von ${a} wegnehmen, damit ${a - x} bleibt? x = ${a} ${M} ${a - x} = ${x}`; }
    else { const a = rnd(11, 60); x = rnd(11, 99 - a); q = `x + ${a} = ${x + a}`; erk = `x + ${a} = ${x + a}  | ${M} ${a}  →  x = ${x}`; } }
  else if(s === 4){ const a = rnd(2, 10); x = rnd(2, 10); q = `${a} · x = ${a * x}`; erk = `${a} · x = ${a * x}  | : ${a}  →  x = ${a * x} : ${a} = ${x}`; }
  else if(s === 5){ const a = rnd(2, 9), b = rnd(2, 10); x = a * b; q = `x : ${a} = ${b}`; erk = `x : ${a} = ${b}  | · ${a}  →  x = ${b} · ${a} = ${x}`; }
  else if(s === 6){ const a = rnd(2, 9), b = rnd(1, 20); x = rnd(1, 12); const c = a * x + b; q = `${kx(a)} + ${b} = ${c}`; erk = `${kx(a)} + ${b} = ${c}  | ${M} ${b}  →  ${kx(a)} = ${c - b}  | : ${a}  →  x = ${x}`; }
  else if(s === 7){ const a = rnd(2, 9); x = rnd(1, 12); const b = rnd(1, a * x - 1), c = a * x - b; q = `${kx(a)} ${M} ${b} = ${c}`; erk = `${kx(a)} ${M} ${b} = ${c}  | + ${b}  →  ${kx(a)} = ${c + b}  | : ${a}  →  x = ${x}`; }
  else if(s === 8){ const c = rnd(1, 6), a = c + rnd(1, 5); x = rnd(1, 10); const b = rnd(1, 20), d = (a - c) * x + b; q = `${kx(a)} + ${b} = ${kx(c)} + ${d}`;
    erk = `${kx(a)} + ${b} = ${kx(c)} + ${d}  | ${M} ${kx(c)}  →  ${kx(a - c)} + ${b} = ${d}  | ${M} ${b}  →  ${kx(a - c)} = ${d - b}` + (a - c > 1 ? `  | : ${a - c}  →  x = ${x}` : ""); }
  else { const a = rnd(2, 9), b = rnd(1, 9);
    if(R() < .5){ x = rnd(1, 12); q = `${a} · (x + ${b}) = ${a * (x + b)}`; erk = `${a} · (x + ${b}) = ${a * (x + b)}  | : ${a}  →  x + ${b} = ${x + b}  | ${M} ${b}  →  x = ${x}`; }
    else { x = b + rnd(1, 12); q = `${a} · (x ${M} ${b}) = ${a * (x - b)}`; erk = `${a} · (x ${M} ${b}) = ${a * (x - b)}  | : ${a}  →  x ${M} ${b} = ${x - b}  | + ${b}  →  x = ${x}`; } }
  return T("gl", `${q}\nx = □`, x, erk, {meta:{gl:q}});
}

/* ---------- Textaufgaben (Schweizer Alltag) ---------- */
const NAMEN = [["Lea","sie"],["Nico","er"],["Mia","sie"],["Luca","er"],["Elin","sie"],["Noah","er"],["Lina","sie"],["Jan","er"],["Sofia","sie"],["Leon","er"],
  ["Lumi","sie"],["Milo","er"],["Leni","sie"],["Ben","er"],["Alessia","sie"],["Gian","er"],["Ajla","sie"],["Elias","er"],["Nora","sie"],["Matteo","er"]];
const GR = s => s.charAt(0).toUpperCase() + s.slice(1);
/* Wortformen [Einzahl, Mehrzahl]; die Tests prüfen, dass Zahl und Form zusammenpassen */
const WORT = {murmel:["Murmel","Murmeln"], kind:["Kind","Kinder"], kinddat:["Kind","Kindern"], schnitz:["Apfelschnitz","Apfelschnitze"], tag:["Tag","Tagen"],
  woche:["Woche","Wochen"], stueck:["Stück","Stücken"], reihe:["Reihe","Reihen"], person:["Person","Personen"], stunde:["Stunde","Stunden"]};
const anz = (n, w) => `${fz(n)} ${n === 1 ? WORT[w][0] : WORT[w][1]}`;
const zz = mm => String(mm).padStart(2, "0");
const TEXTE = [
  {id:"murmeln", s:[1, 2], f(){ const [N, p] = pick(NAMEN), a = rnd(2, 12), b = rnd(1, 20 - a);
    return {q:`${N} hat ${anz(a, "murmel")}. ${GR(p)} bekommt noch ${anz(b, "murmel")} dazu. Wie viele Murmeln hat ${p} jetzt?`, ans:a + b, erk:`${a} + ${b} = ${a + b}`, u:""}; }},
  {id:"pausenplatz", s:[1, 2], f(){ const a = rnd(5, 20), b = rnd(1, a - 1);
    return {q:`Auf dem Pausenplatz spielen ${anz(a, "kind")}. ${anz(b, "kind")} ${b === 1 ? "geht" : "gehen"} nach Hause. Wie viele Kinder spielen noch?`, ans:a - b, erk:`${a} ${M} ${b} = ${a - b}`, u:""}; }},
  {id:"znueni", s:[1, 3], f(){ const [N, p] = pick(NAMEN), a = rnd(4, 12), b = rnd(1, a - 1);
    return {q:`In der Znünibox von ${N} sind ${anz(a, "schnitz")}. ${GR(p)} isst ${anz(b, "schnitz")}. Wie viele Apfelschnitze sind noch in der Box?`, ans:a - b, erk:`${a} ${M} ${b} = ${a - b}`, u:""}; }},
  {id:"postauto", s:[2, 4], f(){ const a = rnd(10, 40), b = rnd(1, 9), c = rnd(1, 9);
    return {q:`Im Postauto sitzen ${anz(a, "person")}. Bei der nächsten Haltestelle ${b === 1 ? "steigt" : "steigen"} ${anz(b, "person")} aus und ${anz(c, "person")} ein. Wie viele Personen sitzen jetzt im Postauto?`, ans:a - b + c, erk:`${a} ${M} ${b} + ${c} = ${a - b + c}`, u:""}; }},
  {id:"gipfeli", s:[3, 5], f(){ const [N, p] = pick(NAMEN), a = rnd(4, 18) * 5, b = rnd(4, 18) * 5;
    return {q:`${N} kauft am Kiosk ein Gipfeli für ${a} Rappen und ein Getränk für ${b} Rappen. Wie viele Rappen bezahlt ${p} zusammen?`, ans:a + b, erk:`${a} + ${b} = ${a + b} Rappen`, u:"Rp."}; }},
  {id:"velo", s:[3, 6], f(){ const [N, p] = pick(NAMEN), a = rnd(1, 6), t = rnd(2, 5);
    return {q:`${N} fährt mit dem Velo ${a} km zur Schule und am Abend wieder ${a} km nach Hause. Wie viele Kilometer fährt ${p} an ${anz(t, "tag")}?`, ans:2 * a * t, erk:`Pro Tag ${a} + ${a} = ${2 * a} km. An ${anz(t, "tag")}: ${2 * a} · ${t} = ${2 * a * t} km`, u:"km"}; }},
  {id:"gruppen", s:[3, 5], f(){ const g = rnd(2, 5), m = rnd(3, Math.floor(30 / g)), k = g * m;
    return {q:`In der Klasse sind ${anz(k, "kind")}. Sie bilden Gruppen mit je ${anz(g, "kinddat")}. Wie viele Gruppen gibt es?`, ans:m, erk:`${k} : ${g} = ${m}`, u:""}; }},
  {id:"schoggi", s:[3, 5], f(){ const r = rnd(2, 8), st = rnd(2, 8);
    return {q:`Eine Tafel Schoggi hat ${anz(r, "reihe")} mit je ${anz(st, "stueck")}. Wie viele Stücke hat die Tafel?`, ans:r * st, erk:`${r} · ${st} = ${r * st}`, u:""}; }},
  {id:"glace", s:[5, 7], f(){ const [N, p] = pick(NAMEN), a = rnd(30, 90) * 5;
    return {q:`${N} kauft ein Glace für ${a} Rappen und bezahlt mit einer 5-Franken-Münze. Wie viele Rappen bekommt ${p} zurück?`, ans:500 - a, erk:`5 Franken sind 500 Rappen. 500 ${M} ${a} = ${500 - a} Rappen`, u:"Rp."}; }},
  {id:"zug", s:[5, 8], f(){ const h = rnd(6, 18), m = rnd(0, 11) * 5, d = rnd(3, 19) * 5, t2 = h * 60 + m + d, h2 = Math.floor(t2 / 60), m2 = t2 % 60;
    return {q:`Der Zug fährt um ${h}.${zz(m)} Uhr ab und kommt um ${h2}.${zz(m2)} Uhr an. Wie viele Minuten dauert die Fahrt?`, ans:d, erk:`Von ${h}.${zz(m)} Uhr bis ${h2}.${zz(m2)} Uhr sind es ${d} Minuten`, u:"min"}; }},
  {id:"sackgeld", s:[4, 7], f(){ const [N, p] = pick(NAMEN), a = rnd(5, 60), b = rnd(2, 10), w = rnd(2, 8);
    return {q:`${N} hat ${a} Franken gespart. ${GR(p)} bekommt jede Woche ${b} Franken Sackgeld. Wie viele Franken hat ${p} nach ${anz(w, "woche")}?`, ans:a + b * w, erk:`${b} · ${w} = ${b * w}, dann ${a} + ${b * w} = ${a + b * w} Franken`, u:"Fr."}; }},
  {id:"wagen", s:[5, 8], f(){ const r = rnd(8, 20), w = rnd(2, 8);
    return {q:`Ein Zugwagen hat ${anz(r, "reihe")} mit je 4 Sitzplätzen. Wie viele Sitzplätze hat ein Zug mit ${w} solchen Wagen?`, ans:r * 4 * w, erk:`${r} · 4 = ${r * 4} Plätze pro Wagen, ${r * 4} · ${w} = ${r * 4 * w}`, u:""}; }},
  {id:"wandern", s:[6, 8], f(){ let a, b; do{ a = rnd(21, 89); b = rnd(21, 89); } while(a % 10 === 0 || b % 10 === 0);
    return {q:`Die Klasse wandert am Vormittag ${fk(dz(a, 1))} km und am Nachmittag ${fk(dz(b, 1))} km. Wie viele Kilometer sind das zusammen?`, ans:dz(a + b, 1), erk:`${fk(dz(a, 1))} + ${fk(dz(b, 1))} = ${fk(dz(a + b, 1))} km`, u:"km"}; }},
  {id:"bergbahn", s:[6, 9], f(){ const a = rnd(40, 160) * 10, b = a + rnd(30, 150) * 10;
    return {q:`Die Talstation einer Bergbahn liegt auf ${fz(a)} m über Meer, die Bergstation auf ${fz(b)} m über Meer. Wie viele Höhenmeter überwindet die Bahn?`, ans:b - a, erk:`${fz(b)} ${M} ${fz(a)} = ${fz(b - a)} m`, u:"m"}; }},
  {id:"velotour", s:[7, 9], f(){ const v = rnd(12, 25), t = rnd(2, 4);
    return {q:`Eine Velofahrerin fährt gleichmässig ${v} km pro Stunde. Wie viele Kilometer schafft sie in ${anz(t, "stunde")}?`, ans:v * t, erk:`${v} · ${t} = ${v * t} km`, u:"km"}; }},
  {id:"einkauf", s:[7, 9], f(){ const [N, p] = pick(NAMEN), n = rnd(2, 6), c = rnd(8, 50) * 5;
    return {q:`${N} kauft ${n} Brötli zu je ${fFr(c)} Franken. Wie viele Franken bezahlt ${p}?`, ans:quot(n * c, 100), erk:`${n} · ${fFr(c)} = ${fFr(n * c)} Franken`, u:"Fr."}; }},
  {id:"rabatt", s:[8, 10], f(){ const p = pick([10, 20, 25, 30, 40, 50]), g = prozVon(p, 200, 1200), r = g * p / 100;
    return {q:`Ein Velo kostet ${fz(g)} Franken. Im Ausverkauf gibt es ${p} % Rabatt. Wie viele Franken kostet das Velo jetzt?`, ans:g - r, erk:`${p} % von ${fz(g)} sind ${fz(r)}. ${fz(g)} ${M} ${fz(r)} = ${fz(g - r)} Franken`, u:"Fr."}; }},
  {id:"schnitt", s:[8, 10], f(){ const [N] = pick(NAMEN); let a, b, c; do{ a = rnd(2, 12); b = rnd(2, 12); c = rnd(2, 12); } while((a + b + c) % 3);
    return {q:`${N} joggt am Montag ${a} km, am Mittwoch ${b} km und am Freitag ${c} km. Wie viele Kilometer sind das im Durchschnitt pro Lauf?`, ans:(a + b + c) / 3, erk:`${a} + ${b} + ${c} = ${a + b + c}, dann ${a + b + c} : 3 = ${(a + b + c) / 3} km`, u:"km"}; }},
  {id:"dreisatz", s:[8, 10], f(){ const c = rnd(10, 40) * 5, n = rnd(2, 5); let m; do{ m = rnd(2, 9); } while(m === n);
    return {q:`${n} Gipfeli kosten ${fFr(n * c)} Franken. Wie viele Franken kosten ${m} Gipfeli?`, ans:quot(m * c, 100), erk:`1 Gipfeli kostet ${fFr(n * c)} : ${n} = ${fFr(c)} Franken. ${m} Gipfeli kosten ${m} · ${fFr(c)} = ${fFr(m * c)} Franken`, u:"Fr."}; }},
  {id:"zahldenken", s:[8, 10], f(){ const [N, p] = pick(NAMEN), a = rnd(2, 9), b = rnd(1, 20), x = rnd(2, 15);
    return {q:`${N} denkt sich eine Zahl. ${GR(p)} rechnet sie mal ${a} und zählt ${b} dazu. Das Ergebnis ist ${a * x + b}. Welche Zahl hat ${p} sich gedacht?`, ans:x, erk:`Rückwärts rechnen: ${a * x + b} ${M} ${b} = ${a * x}, dann ${a * x} : ${a} = ${x}`, u:""}; }},
  {id:"bahnfahrt", s:[9, 10], f(){ let v, t, d; do{ v = pick([60, 72, 80, 90, 96, 100, 120]); t = pick([10, 12, 15, 20, 30]); d = v * t / 60; } while(!Number.isInteger(d));
    return {q:`Ein Zug fährt gleichmässig ${d} km in ${t} Minuten. Wie viele Kilometer fährt er in einer Stunde?`, ans:v, erk:`Eine Stunde hat 60 Minuten. 60 : ${t} = ${60 / t}, also ${d} · ${60 / t} = ${v} km`, u:"km"}; }}
];
function textAufgabe(s){
  const pool = TEXTE.filter(t => s >= t.s[0] && s <= t.s[1]);
  const t = pick(pool.length ? pool : TEXTE), r = t.f();
  return T("text", r.q, r.ans, r.erk, {einheit:r.u, meta:{id:t.id}});
}

/* ---------- Bereiche ---------- */
const BEREICHE = [
  {id:"pm",   titel:"Plus & Minus",     emo:"➕", farbe:"linear-gradient(135deg,#2F80ED,#3BB3E0)", text:"Zahlenraum 20, 100, 1000 und 1 Million", gen:pmAufgabe},
  {id:"emm",  titel:"Einmaleins",       emo:'<b class="xmt-mal">×</b>', farbe:"linear-gradient(135deg,#7B3FE4,#A55EEA)", text:"Reihen wählen, mal und geteilt", gen:emmAufgabe},
  {id:"kopf", titel:"Kopfrechnen",      emo:"🧠", farbe:"linear-gradient(135deg,#D6336C,#F06595)", text:"Gemischt, Punkt vor Strich, Klammern", gen:kopfAufgabe},
  {id:"schr", titel:"Schriftlich",      emo:"📝", farbe:"linear-gradient(135deg,#0B7A6B,#20A98A)", text:"Addieren, subtrahieren, multiplizieren", gen:schrAufgabe},
  {id:"br",   titel:"Brüche",           emo:"🍕", farbe:"linear-gradient(135deg,#D9480F,#F08C00)", text:"Erweitern, kürzen, vergleichen, addieren", gen:brAufgabe},
  {id:"dez",  titel:"Dezimal & Runden", emo:"🔢", farbe:"linear-gradient(135deg,#1864AB,#4C6EF5)", text:"Runden und mit Kommazahlen rechnen", gen:dezAufgabe},
  {id:"mass", titel:"Masseinheiten",    emo:"📏", farbe:"linear-gradient(135deg,#2B8A3E,#40A35A)", text:"m, kg, l, Zeit, Franken und Rappen", gen:massAufgabe},
  {id:"proz", titel:"Prozent",          emo:"💯", farbe:"linear-gradient(135deg,#A61E4D,#D6336C)", text:"Anteile, Rabatt und Grundwert", gen:prozAufgabe, profis:true},
  {id:"gl",   titel:"Gleichungen",      emo:"⚖️", farbe:"linear-gradient(135deg,#5F3DC4,#7950F2)", text:`Finde x: von x + 7 = 15 bis 3x ${M} 4 = 11`, gen:glAufgabe},
  {id:"text", titel:"Textaufgaben",     emo:"🚲", farbe:"linear-gradient(135deg,#C2410C,#E8590C)", text:"Rappen, Velo, Zug und Znüni", gen:textAufgabe}
];
function aufgabe(bid, stufe, opt, schwach){
  const B = BEREICHE.find(b => b.id === bid) || BEREICHE[0];
  let s = Math.max(1, Math.min(10, Math.round(stufe || 1)));
  const eigene = bid === "emm" && opt && Array.isArray(opt.reihen) && opt.reihen.length;
  if(s > 2 && !eigene && R() < .2) s -= rnd(1, 2);
  const t = B.gen(s, opt, schwach); t.stufe = s; return t;
}
function zeigeAntwort(t){ // Antwort hübsch: Franken mit 2 Nachkommastellen
  if(t.typ !== "zahl") return t.opts[t.ok];
  const geld = t.einheit === "Fr." || /□ Fr\.$/.test(t.q);
  if(geld && t.ans.includes(",")){ const [i, f] = t.ans.split(","); return fk(i) + "," + f.padEnd(2, "0"); }
  return fk(t.ans);
}
return {aufgabe, zeigeAntwort, BEREICHE, canon, fz, fk, dz, quot, ggt, kgv, kuerze, br, WORT, TEXTE, EH, M, setRandom(f){ R = f || Math.random; }};
})();

if(typeof module !== "undefined" && module.exports){ module.exports = GEN; return; }
if(!window.EP_EXTRAS) return;

/* =====================================================================
   Oberfläche
   ===================================================================== */
const X = window.EP_EXTRAS, A = X.api, h = A.h, M = GEN.M;
const KEY = "ep-x-mathe-stand", OKEY = "ep-x-mathe-opt";
const zufall = a => a[Math.floor(Math.random() * a.length)];
const startStufe = () => { const s = A.stufe(); return s === 3 ? 7 : s === 2 ? 4 : s === 4 ? 3 : 1; };
const leer = () => ({b:{}, reihen:{}, total:0, tag:"", heute:0});
function laden(){ const s = A.LS.get(KEY, null); return s && typeof s === "object" ? Object.assign(leer(), s) : leer(); }
const speichern = s => A.LS.set(KEY, s);
function bstand(st, id){ if(!st.b[id]) st.b[id] = {s:startStufe(), r:0, best:0, zeit:0, blitz:0}; return st.b[id]; }
function optLaden(){ const o = A.LS.get(OKEY, {}) || {};
  return {pm:Object.assign({zr:"auto"}, o.pm || {}), emm:Object.assign({reihen:[], modus:"auto"}, o.emm || {})}; }
const sterne = b => !b || !b.r ? 0 : b.best >= 10 ? 3 : b.best >= 8 ? 2 : b.best >= 5 ? 1 : 0;
const sternHTML = n => `<span class="xmt-stern" aria-label="${n} von 3 Sternen">${"★".repeat(n)}${"☆".repeat(3 - n)}</span>`;
const mmss = ms => { const t = Math.max(0, Math.round(ms / 1000)); return Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0"); };

/* Aufgabentext mit Brüchen, Zeilen und Lücke als HTML */
function qHTML(q){
  const lu = '<b class="xmt-lu">?</b>';
  const zeile = z => h(z).replace(/\{([^{}\/]+)\/([^{}]+)\}/g, (m, a, b) => `<span class="xmt-br" role="math" aria-label="${a === "□" ? "?" : a} ${b === "□" ? "?" : b}tel"><i>${a === "□" ? lu : a}</i><i>${b === "□" ? lu : b}</i></span>`).replace(/□/g, lu);
  const z = String(q).split("\n");
  return z.length > 1 ? z.map(x => `<span class="xmt-zl">${zeile(x)}</span>`).join("") : zeile(q);
}
function colHTML(col){
  const L = Math.max(col.len, ...col.z.map(n => String(n).length + 1)) + 1;
  const zellen = (s, op) => { const c = Array(L).fill(""); const d = String(s).split(""); d.forEach((x, i) => c[L - d.length + i] = x); if(op) c[0] = op; return c; };
  const zeile = (s, op) => `<div class="xmt-cz">${zellen(s, op).map((x, i) => `<span class="${i === 0 && op ? "xmt-op" : ""}">${x ? h(x) : "&nbsp;"}</span>`).join("")}</div>`;
  return `<div class="xmt-col" data-len="${L}">${col.z.map((n, i) => zeile(n, i === col.z.length - 1 ? col.op : "")).join("")}<div class="xmt-strich"></div>
    <div class="xmt-cz xmt-cres">${Array(L).fill(0).map(() => `<span class="xmt-rc">&nbsp;</span>`).join("")}</div></div>`;
}

function render(box){
  const st = laden(); const heute = A.heute(); if(st.tag !== heute){ st.tag = heute; st.heute = 0; }
  const opt = optLaden();
  let ansicht = "menu", runde = null, timer = null, keyH = null;
  const aufraeumen = () => { if(timer){ clearInterval(timer); timer = null; } if(keyH){ document.removeEventListener("keydown", keyH); keyH = null; } };
  const lebt = () => { if(box.isConnected) return true; aufraeumen(); removeEventListener("resize", beiGroesse); return false; };
  const B = id => GEN.BEREICHE.find(b => b.id === id);
  function beiGroesse(){ if(lebt() && ansicht === "runde") messen(); }
  addEventListener("resize", beiGroesse);

  function messen(){
    try{ const r = box.getBoundingClientRect(), top = r.top + scrollY, pb = parseFloat(getComputedStyle(document.body).paddingBottom) || 0;
      const hh = Math.max(400, Math.min(820, innerHeight - top - pb - 12)); box.style.setProperty("--xmt-h", hh + "px"); }catch(e){}
  }

  /* ---------- Menü ---------- */
  function menu(){
    aufraeumen(); ansicht = "menu";
    box.innerHTML = `<div class="xmt">
      <div class="xmt-kopf"><span class="xmt-kopf-emo" aria-hidden="true">🧮</span><div><h1>Mathe-Trainer</h1><p>Aufgaben, die mit dir wachsen</p></div><img src="img/kids/j3.webp" alt=""></div>
      <div class="xmt-info"><span>Heute ${st.heute} richtig</span><span>Gesamt ${GEN.fz(st.total)} richtig</span></div>
      <div class="xmt-kacheln">${GEN.BEREICHE.map(b => { const bs = st.b[b.id], s = bs ? bs.s : startStufe(), stn = sterne(bs);
        return `<button type="button" class="xmt-kachel" data-b="${b.id}" style="background:${b.farbe}" aria-label="${h(b.titel)}, Stufe ${s} von 10, ${stn} von 3 Sternen">
          <span class="xmt-k1"><span class="xmt-emo" aria-hidden="true">${b.emo}</span><b>${h(b.titel)}</b></span>
          <small>${h(b.text)}</small>${b.profis ? '<i class="xmt-tag" aria-hidden="true">Profis</i>' : ""}
          <span class="xmt-k2" aria-hidden="true"><span class="xmt-bar"><span style="width:${s * 10}%"></span></span><span class="xmt-st">Stufe ${s}</span>${sternHTML(stn)}</span>
        </button>`; }).join("")}</div></div>`;
    box.querySelectorAll("[data-b]").forEach(b => b.onclick = () => { A.ton("klick"); panel(b.dataset.b); });
  }

  /* ---------- Bereich-Startseite ---------- */
  function panel(id, fokus){
    aufraeumen(); ansicht = "panel";
    const b = B(id), bs = bstand(st, id);
    let optHTML = "";
    if(id === "pm") optHTML = `<div class="xmt-grp"><span class="xmt-lbl">Zahlenraum</span><div class="xmt-chips" role="group" aria-label="Zahlenraum">${[["auto","Automatisch"],["20","bis 20"],["100","bis 100"],["1000","bis 1000"],["1000000","bis 1 Mio."]].map(([v, l]) => `<button type="button" class="xmt-chip" data-zr="${v}" aria-pressed="${String(opt.pm.zr) === v}">${l}</button>`).join("")}</div></div>`;
    if(id === "emm"){
      const schw = Object.keys(st.reihen).filter(r => (st.reihen[r] || 0) >= 2).map(Number).sort((x, y) => x - y);
      optHTML = `<div class="xmt-grp"><span class="xmt-lbl">Reihen</span><div class="xmt-chips xmt-reihen" role="group" aria-label="Reihen">
        <button type="button" class="xmt-chip xmt-alle" data-r="0" aria-pressed="${!opt.emm.reihen.length}" aria-label="Alle Reihen gemischt">Alle</button>${[1,2,3,4,5,6,7,8,9,10].map(r => `<button type="button" class="xmt-chip xmt-rz" data-r="${r}" aria-pressed="${opt.emm.reihen.includes(r)}" aria-label="${r}er-Reihe">${r}</button>`).join("")}</div></div>
        <div class="xmt-grp"><span class="xmt-lbl">Rechnen</span><div class="xmt-chips" role="group" aria-label="Rechenart">${[["auto","Passend zur Stufe"],["mal","Mal"],["durch","Geteilt"],["beides","Beides"]].map(([v, l]) => `<button type="button" class="xmt-chip" data-m="${v}" aria-pressed="${opt.emm.modus === v}">${l}</button>`).join("")}</div></div>
        ${schw.length ? `<p class="xmt-hint">🔁 Kommt öfter dran: ${schw.map(r => r + "er-Reihe").join(", ")}</p>` : ""}`;
    }
    const stn = sterne(bs);
    box.innerHTML = `<div class="xmt xmt-pn">
      <button type="button" class="xmt-zur" data-zur>‹ Alle Bereiche</button>
      <div class="xmt-panel" style="background:${b.farbe}">
        <div class="xmt-ph"><span class="xmt-emo" aria-hidden="true">${b.emo}</span><div><h2>${h(b.titel)}</h2><p>${h(b.text)}</p></div></div>
        <div class="xmt-stufe"><button type="button" class="xmt-pm" data-s="-1" aria-label="Stufe tiefer" ${bs.s <= 1 ? "disabled" : ""}>−</button>
          <div class="xmt-sv"><b>Stufe ${bs.s} von 10</b><span class="xmt-seg" aria-hidden="true">${Array.from({length:10}, (_, i) => `<i class="${i < bs.s ? "an" : ""}"></i>`).join("")}</span></div>
          <button type="button" class="xmt-pm" data-s="1" aria-label="Stufe höher" ${bs.s >= 10 ? "disabled" : ""}>+</button></div>
        <div class="xmt-best">${sternHTML(stn)}<span>Bestes: ${bs.best} von 10</span>${bs.zeit ? `<span>10/10 in ${mmss(bs.zeit)}</span>` : ""}${bs.blitz ? `<span>⚡ Rekord ${bs.blitz}</span>` : ""}</div>
        ${optHTML}
        <div class="xmt-los"><button type="button" class="xmt-go" data-go="runde">▶ Runde starten<small>10 Aufgaben, ohne Zeitdruck</small></button>
        <button type="button" class="xmt-go xmt-zwei" data-go="blitz">⚡ Blitz<small>60 Sekunden</small></button></div>
      </div></div>`;
    const neu = (f) => { A.LS.set(OKEY, opt); A.ton("klick"); panel(id, f); };
    box.querySelector("[data-zur]").onclick = () => { A.ton("klick"); menu(); };
    box.querySelectorAll("[data-s]").forEach(x => x.onclick = () => { bs.s = Math.max(1, Math.min(10, bs.s + +x.dataset.s)); speichern(st); A.ton("klick"); panel(id, `[data-s="${x.dataset.s}"]`); });
    box.querySelectorAll("[data-zr]").forEach(x => x.onclick = () => { opt.pm.zr = x.dataset.zr; neu(`[data-zr="${x.dataset.zr}"]`); });
    box.querySelectorAll("[data-m]").forEach(x => x.onclick = () => { opt.emm.modus = x.dataset.m; neu(`[data-m="${x.dataset.m}"]`); });
    box.querySelectorAll("[data-r]").forEach(x => x.onclick = () => { const r = +x.dataset.r; let l = opt.emm.reihen;
      l = !r ? [] : l.includes(r) ? l.filter(y => y !== r) : l.concat(r).sort((p, q) => p - q);
      opt.emm.reihen = l; neu(`[data-r="${r}"]`); });
    box.querySelectorAll("[data-go]").forEach(x => x.onclick = () => { A.ton("klick"); start(id, x.dataset.go === "blitz"); });
    try{ const f = fokus && box.querySelector(fokus); if(f && !f.disabled) f.focus({preventScroll:true}); }catch(e){}
  }

  /* ---------- Runde ---------- */
  function neueAufgabe(){
    const bs = bstand(st, runde.id), o = runde.id === "pm" ? opt.pm : runde.id === "emm" ? opt.emm : null;
    let t; for(let i = 0; i < 15; i++){ t = GEN.aufgabe(runde.id, bs.s, o, st.reihen); if(!runde.gesehen.includes(t.q)) break; }
    runde.gesehen.push(t.q); runde.t = t; runde.eingabe = ""; runde.status = "frage";
  }
  function start(id, blitz){
    aufraeumen(); ansicht = "runde";
    runde = {id, blitz, nr:1, richtig:0, start:Date.now(), gesehen:[], fehler:[], t:null, eingabe:"", status:"frage", ende:blitz ? Date.now() + 60000 : 0};
    neueAufgabe();
    try{ scrollTo(0, 0); }catch(e){}
    zeichneRunde();
    timer = setInterval(() => { if(lebt()) tick(); }, 250);
    keyH = e => taste(e); document.addEventListener("keydown", keyH);
  }
  function tick(){
    if(!runde) return; const el = box.querySelector(".xmt-zeit"); if(!el) return;
    if(runde.blitz){ const rest = runde.ende - Date.now(); el.textContent = "⚡ " + Math.max(0, Math.ceil(rest / 1000)) + " s"; if(rest <= 0) fertig(); }
    else el.textContent = "⏱ " + mmss(Date.now() - runde.start);
  }
  function zeichneRunde(){
    const b = B(runde.id), t = runde.t, lang = t.q.length > 60;
    const prog = runde.blitz ? `<span class="xmt-pill">✓ ${runde.richtig}</span>` : `<span class="xmt-pill" aria-label="Aufgabe ${runde.nr} von 10">${runde.nr} / 10</span>`;
    const frage = t.col ? `<div class="xmt-q xmt-qcol" role="img" aria-label="${h(t.q.replace("□", "?"))}">${colHTML(t.col)}</div>`
      : `<div class="xmt-q${lang ? " xmt-lang" : ""}${t.b === "gl" ? " xmt-gl" : ""}">${qHTML(t.q)}</div>`;
    const ohneLuecke = !t.col && !/□/.test(t.q) && t.typ === "zahl";
    box.innerHTML = `<div class="xmt xmt-rw"><div class="xmt-runde">
      <div class="xmt-top"><button type="button" class="xmt-x" data-x aria-label="Runde beenden">✕</button>${prog}
        ${runde.blitz ? '<span class="xmt-dots"></span>' : `<span class="xmt-dots" aria-hidden="true">${Array.from({length:10}, (_, i) => `<i class="${i < runde.nr - 1 ? (runde.fehler.includes(i + 1) ? "f" : "r") : i === runde.nr - 1 ? "j" : ""}"></i>`).join("")}</span>`}
        <span class="xmt-pill xmt-zeit"></span></div>
      <div class="xmt-karte" style="background:${b.farbe}" role="group" aria-label="Aufgabe ${runde.nr}">
        <span class="xmt-kl">${b.emo} ${h(b.titel)} · Stufe ${t.stufe}${t.typ === "wahl" && t.b === "br" && !t.vgl ? " · gekürzt" : ""}</span>
        ${frage}
        ${ohneLuecke ? `<div class="xmt-antw"><b class="xmt-lu">?</b>${t.einheit ? `<span class="xmt-einh">${h(t.einheit)}</span>` : ""}</div>` : ""}
        <span class="xmt-fb" aria-live="polite"></span>
      </div>
      <div class="xmt-pad">${padHTML()}</div>
    </div></div>`;
    messen(); tick(); zeigeEingabe(); binde();
  }
  function padHTML(){
    const t = runde.t;
    if(runde.status === "falsch") return `<div class="xmt-loes" role="alert"><p class="xmt-lk">Fast! Richtig ist <b>${t.typ === "wahl" ? qHTML(t.opts[t.ok]) : h(GEN.zeigeAntwort(t))}${t.einheit && t.typ === "zahl" ? " " + h(t.einheit) : ""}</b></p>
      <p class="xmt-weg"><span>So geht's:</span> ${qHTML(t.erk.replace(/ = /g, "\u00a0= "))}</p>${runde.blitz ? "" : `<button type="button" class="xmt-weiter" data-weiter>Weiter ›</button>`}</div>`;
    if(t.typ === "wahl") return `<div class="xmt-wahl${t.vgl ? " xmt-vgl" : ""}" role="group" aria-label="Antworten">${t.opts.map((o, i) => `<button type="button" class="xmt-opt" data-o="${i}" aria-label="${o === "<" ? "kleiner als" : o === ">" ? "grösser als" : o === "=" ? "gleich" : h(o.replace(/[{}]/g, ""))}">${qHTML(o)}</button>`).join("")}</div>`;
    const k = (v, l, c, a) => `<button type="button" class="xmt-t${c ? " " + c : ""}" data-k="${v}"${a ? ` aria-label="${a}"` : ""}>${l}</button>`;
    return `<div class="xmt-tast">${k("7", "7")}${k("8", "8")}${k("9", "9")}${k("del", "⌫", "xmt-del", "Löschen")}${k("4", "4")}${k("5", "5")}${k("6", "6")}${k(",", ",", "xmt-sym", "Komma")}${k("1", "1")}${k("2", "2")}${k("3", "3")}${k("-", M, "xmt-sym", "Minus")}${k("0", "0", "xmt-0")}${k("ok", "✓ Prüfen", "xmt-ok", "Antwort prüfen")}</div>`;
  }
  function binde(){
    const x = box.querySelector("[data-x]"); if(x) x.onclick = () => { A.ton("klick"); const id = runde.id; aufraeumen(); runde = null; panel(id); };
    box.querySelectorAll("[data-k]").forEach(b => b.onclick = () => druecke(b.dataset.k));
    box.querySelectorAll("[data-o]").forEach(b => b.onclick = () => waehle(+b.dataset.o));
    const w = box.querySelector("[data-weiter]"); if(w){ w.onclick = () => { A.ton("klick"); weiter(); }; try{ w.focus({preventScroll:true}); }catch(e){} }
  }
  function zeigeEingabe(){
    const t = runde.t; if(t.typ === "wahl") return;
    const v = runde.eingabe.replace(/-/g, M);
    if(t.col){ const cs = box.querySelectorAll(".xmt-rc"), ch = v.split(""), L = cs.length;
      cs.forEach((c, i) => { const j = i - (L - ch.length); c.textContent = j >= 0 ? ch[j] : " "; });
      const res = box.querySelector(".xmt-cres"); if(res) res.classList.toggle("voll", !!v); return; }
    const lu = box.querySelector(".xmt-q .xmt-lu, .xmt-antw .xmt-lu"); if(!lu) return;
    lu.textContent = v || "?"; lu.classList.toggle("voll", !!v);
  }
  function druecke(k){
    if(!runde || runde.status !== "frage" || runde.t.typ !== "zahl") return;
    if(k === "ok") return pruefe();
    const max = runde.t.col ? box.querySelectorAll(".xmt-rc").length : 12;
    if(k === "del") runde.eingabe = runde.eingabe.slice(0, -1);
    else if(k === "-") runde.eingabe = runde.eingabe.startsWith("-") ? runde.eingabe.slice(1) : "-" + runde.eingabe;
    else if(runde.eingabe.length < max){
      if(k === ","){ if(runde.eingabe.includes(",")) return; if(!runde.eingabe || runde.eingabe === "-") runde.eingabe += "0"; }
      runde.eingabe += k;
    }
    const fb = box.querySelector(".xmt-fb"); if(fb && fb.classList.contains("hinweis")) fb.className = "xmt-fb";
    A.ton("tick"); zeigeEingabe();
  }
  function taste(e){
    if(!lebt() || ansicht !== "runde" || !runde) return;
    if(e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key, t = runde.t;
    if(runde.status === "falsch"){ if((k === "Enter" || k === " ") && !runde.blitz){ e.preventDefault(); weiter(); } return; }
    if(runde.status !== "frage") return;
    if(k === "Escape"){ const id = runde.id; aufraeumen(); runde = null; panel(id); return; }
    if(t.typ === "wahl"){
      let i = t.vgl ? ({"<":0, "=":1, ">":2}[k] ?? -1) : -1;
      if(i < 0 && /^[1-4]$/.test(k)) i = +k - 1;
      if(i >= 0 && i < t.opts.length){ e.preventDefault(); waehle(i); }
      return;
    }
    if(e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
    if(/^[0-9]$/.test(k)){ e.preventDefault(); druecke(k); }
    else if(k === "," || k === "."){ e.preventDefault(); druecke(","); }
    else if(k === "-" || k === "−"){ e.preventDefault(); druecke("-"); }
    else if(k === "Backspace" || k === "Delete"){ e.preventDefault(); druecke("del"); }
    else if(k === "Enter"){ e.preventDefault(); druecke("ok"); }
  }
  function pruefe(){
    const c = GEN.canon(runde.eingabe);
    if(c == null){ const fb = box.querySelector(".xmt-fb"); if(fb){ fb.textContent = "Tippe zuerst deine Antwort ein."; fb.className = "xmt-fb an hinweis"; } return; }
    antwort(c === runde.t.ans);
  }
  function waehle(i){
    if(!runde || runde.status !== "frage") return;
    const t = runde.t, lu = box.querySelector(".xmt-q .xmt-lu");
    if(lu && t.vgl){ lu.textContent = t.opts[i]; lu.classList.add("voll"); }
    box.querySelectorAll("[data-o]").forEach((b, j) => { b.disabled = true; if(j === t.ok) b.classList.add("ok"); else if(j === i) b.classList.add("nok"); });
    antwort(i === t.ok);
  }
  function antwort(ok){
    const t = runde.t, karte = box.querySelector(".xmt-karte"), fb = box.querySelector(".xmt-fb");
    if(t.reihe){ const r = st.reihen[t.reihe] || 0; st.reihen[t.reihe] = ok ? Math.max(0, r - 1) : Math.min(5, r + 2); }
    if(ok){
      runde.richtig++; st.total++; st.heute++; runde.status = "ok";
      A.ton("richtig"); if(karte) karte.classList.add("xmt-gut");
      if(fb){ fb.textContent = zufall(["Richtig!", "Super!", "Genau!", "Stark!", "Toll gemacht!"]); fb.className = "xmt-fb an gut"; }
      speichern(st);
      setTimeout(() => { if(lebt() && runde && runde.status === "ok") weiter(); }, runde.blitz ? 380 : 850);
    } else {
      runde.status = "falsch"; runde.fehler.push(runde.nr); A.ton("falsch");
      if(karte) karte.classList.add("xmt-schade"); speichern(st);
      const zeige = () => { if(!lebt() || !runde || runde.status !== "falsch") return; const pad = box.querySelector(".xmt-pad"); if(pad){ pad.innerHTML = padHTML(); binde(); }
        if(runde.blitz) setTimeout(() => { if(lebt() && runde && runde.status === "falsch") weiter(); }, 1600); };
      if(t.typ === "wahl") setTimeout(zeige, 500); else zeige();
    }
  }
  function weiter(){
    if(!runde) return;
    if(runde.blitz){ if(Date.now() >= runde.ende) return fertig(); runde.nr++; neueAufgabe(); zeichneRunde(); return; }
    if(runde.nr >= 10) return fertig();
    runde.nr++; neueAufgabe(); zeichneRunde();
  }
  function fertig(){
    if(!runde || ansicht !== "runde") return;
    aufraeumen(); ansicht = "ende";
    const rd = runde, bs = bstand(st, rd.id), b = B(rd.id), zeit = Date.now() - rd.start;
    let msg = "", xp = 0, hoch = false; const neu = [];
    if(rd.blitz){
      if(rd.richtig > bs.blitz){ if(bs.blitz) neu.push("Neuer Blitz-Rekord!"); bs.blitz = rd.richtig; }
      xp = Math.min(rd.richtig, 15);
      msg = rd.richtig ? `${rd.richtig} richtige Antworten in 60 Sekunden.` : "Probier es gleich nochmal, das wird!";
    } else {
      bs.r++;
      if(rd.richtig > bs.best){ if(bs.best) neu.push("Neuer Bestwert!"); bs.best = rd.richtig; }
      if(rd.richtig === 10 && (!bs.zeit || zeit < bs.zeit)){ if(bs.zeit) neu.push("Schnellste 10/10-Runde!"); bs.zeit = zeit; }
      if(rd.richtig >= 8 && bs.s < 10){ bs.s++; hoch = true; msg = `Stark! Du steigst auf Stufe ${bs.s}.`; }
      else if(rd.richtig >= 8) msg = "Höchste Stufe gemeistert. Super!";
      else if(rd.richtig < 5 && bs.s > 1){ bs.s--; msg = `Wir üben noch etwas auf Stufe ${bs.s}. Du schaffst das!`; }
      else msg = rd.richtig >= 5 ? `Gut gemacht! Mit 8 richtigen geht es auf Stufe ${bs.s + 1}.` : "Weiter üben, jede Runde hilft.";
      xp = rd.richtig + (rd.richtig === 10 ? 5 : 0);
    }
    A.ton(hoch ? "levelup" : "fanfare");
    speichern(st);
    let bekam = 0; if(xp > 0) bekam = A.xp(xp) || 0;
    if(!rd.blitz && rd.richtig === 10 && !A.ruhig()) A.konfetti();
    const stn = sterne(bs);
    box.innerHTML = `<div class="xmt xmt-pn"><div class="xmt-ende" style="background:${b.farbe}">
      <img src="img/kids/${rd.richtig >= 8 ? "duo-jubel" : "duo-bereit"}.webp" alt="" class="xmt-eimg">
      <span class="xmt-kl">${b.emo} ${h(b.titel)}${rd.blitz ? " · Blitz" : ""}</span>
      <div class="xmt-gross" aria-label="${rd.richtig} ${rd.blitz ? "richtig" : "von 10 richtig"}">${rd.richtig}<small>${rd.blitz ? " richtig" : " / 10"}</small></div>
      <p class="xmt-msg">${h(msg)}</p>
      <div class="xmt-best">${rd.blitz ? `<span>⚡ Rekord ${bs.blitz}</span>` : `<span>⏱ ${mmss(zeit)}</span>${sternHTML(stn)}<span>Stufe ${bs.s}</span>`}${xp ? `<span>+${bekam || xp} XP</span>` : ""}</div>
      ${neu.length ? `<p class="xmt-neu">🏅 ${h(neu.join(" "))}</p>` : ""}
      <div class="xmt-los"><button type="button" class="xmt-go" data-nochmal>↻ Nochmal</button><button type="button" class="xmt-go xmt-zwei" data-bereich>Bereich</button><button type="button" class="xmt-go xmt-zwei" data-menu>Alle</button></div>
    </div></div>`;
    box.querySelector("[data-nochmal]").onclick = () => { A.ton("klick"); start(rd.id, rd.blitz); };
    box.querySelector("[data-bereich]").onclick = () => { A.ton("klick"); panel(rd.id); };
    box.querySelector("[data-menu]").onclick = () => { A.ton("klick"); menu(); };
    try{ box.querySelector("[data-nochmal]").focus({preventScroll:true}); }catch(e){}
    runde = null;
  }
  box.__xmt = () => runde && runde.t; box.__xmtS = () => runde ? runde.status + ":" + runde.nr : ansicht; // für automatische Tests
  menu();
}

/* ---------- Stil ---------- */
const css = document.createElement("style"); css.id = "ep-x-mathe";
css.textContent = `
.xmt{max-width:980px;margin:0 auto;font-family:"Lexend",system-ui,sans-serif;color:#fff}
.xmt *{box-sizing:border-box}
.xmt button{font-family:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent;color:#fff}
.xmt button:focus-visible{outline:3px solid #FFE34D;outline-offset:2px}
.xmt-kopf{position:relative;display:flex;align-items:center;gap:12px;padding:18px 22px;border-radius:26px;background:linear-gradient(135deg,#3B5BDB,#7048E8 60%,#C2255C);box-shadow:0 14px 30px rgba(60,40,140,.25);margin:4px 0 10px;min-height:86px}
.xmt-kopf h1{margin:0;font:700 clamp(1.4rem,4vw,2rem) "Fredoka",system-ui,sans-serif;color:#fff}
.xmt-kopf p{margin:2px 0 0;opacity:.92;color:#fff;font-size:.95rem}
.xmt-kopf-emo{font-size:2.2rem}
.xmt-kopf>div{padding-right:110px}
.xmt-kopf img{position:absolute;right:14px;bottom:0;height:130%;max-height:132px;pointer-events:none}
.xmt-info{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 10px}
.xmt-info span,.xmt-pill{border:1px solid rgba(255,255,255,.16);background:rgba(15,20,48,.55);color:#fff;border-radius:999px;padding:5px 12px;font-size:.85rem;font-weight:600;white-space:nowrap}
.xmt-kacheln{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
.xmt-kachel{position:relative;display:flex;flex-direction:column;gap:5px;align-items:stretch;text-align:left;border:0;border-radius:22px;padding:14px 14px 12px;box-shadow:0 10px 22px rgba(27,34,64,.22);transition:transform .15s;min-height:118px}
.xmt-kachel:hover{transform:translateY(-2px)}
.xmt-k1{display:flex;align-items:center;gap:8px;padding-right:44px}
.xmt-k1 b{font:700 1.1rem "Fredoka",system-ui,sans-serif;color:#fff;line-height:1.15}
.xmt-emo{font-size:1.6rem;line-height:1}
.xmt-mal{font:800 1.5em/.7 "Fredoka",system-ui,sans-serif;color:#fff;display:inline-block;width:1em;text-align:center}
.xmt-tag{position:absolute;top:9px;right:10px;font-style:normal;background:#FFE34D;color:#1B2240;font-weight:800;font-size:.66rem;padding:2px 7px;border-radius:999px}
.xmt-kachel small{font-size:.8rem;opacity:.95;line-height:1.25;color:#fff}
.xmt-k2{display:flex;align-items:center;gap:8px;margin-top:auto;font-size:.78rem;font-weight:700}
.xmt-bar{flex:1;height:8px;border-radius:99px;background:rgba(255,255,255,.3);overflow:hidden;min-width:20px}
.xmt-bar span{display:block;height:100%;background:#fff;border-radius:99px}
.xmt-stern{color:#FFE34D;letter-spacing:1px;white-space:nowrap}
.xmt-zur{border:0;background:rgba(15,20,48,.55);border-radius:999px;padding:8px 14px;font-weight:700;margin:2px 0 10px}
.xmt-pn{max-width:620px}
.xmt-panel,.xmt-ende{border-radius:26px;padding:20px;box-shadow:0 14px 30px rgba(27,34,64,.25);display:flex;flex-direction:column;gap:14px}
.xmt-ph{display:flex;gap:12px;align-items:center}
.xmt-ph .xmt-emo{font-size:2.4rem}
.xmt-ph h2{margin:0;font:700 1.6rem "Fredoka",system-ui,sans-serif;color:#fff}
.xmt-ph p{margin:2px 0 0;color:#fff;opacity:.92;font-size:.92rem}
.xmt-stufe{display:flex;align-items:center;gap:10px;background:rgba(15,20,48,.25);border-radius:18px;padding:10px}
.xmt-pm{width:46px;height:46px;border-radius:14px;border:0;background:rgba(255,255,255,.22);font-size:1.5rem;font-weight:700}
.xmt-pm:disabled{opacity:.35;cursor:default}
.xmt-sv{flex:1;display:flex;flex-direction:column;gap:6px;align-items:center}
.xmt-seg{display:flex;gap:4px;width:100%}
.xmt-seg i{flex:1;height:10px;border-radius:5px;background:rgba(255,255,255,.28)}
.xmt-seg i.an{background:#fff}
.xmt-best{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.xmt-best>span{background:rgba(15,20,48,.3);border-radius:999px;padding:5px 11px;font-size:.85rem;font-weight:700;color:#fff}
.xmt-best>.xmt-stern{color:#FFE34D}
.xmt-grp{display:flex;flex-direction:column;gap:6px}
.xmt-lbl{font-size:.78rem;font-weight:700;opacity:.92;text-transform:uppercase;letter-spacing:.04em}
.xmt-chips{display:flex;flex-wrap:wrap;gap:6px}
.xmt-chip{border:2px solid rgba(255,255,255,.6);background:rgba(15,20,48,.2);border-radius:999px;padding:6px 12px;font-weight:700;font-size:.88rem;min-height:38px}
.xmt-reihen{display:grid;grid-template-columns:repeat(6,1fr)}
.xmt-reihen .xmt-alle{grid-column:span 2}
.xmt-chip.xmt-rz{padding:6px 0}
.xmt .xmt-chip[aria-pressed="true"]{background:#fff;color:#1B2240;border-color:#fff}
.xmt-hint{margin:0;font-size:.85rem;background:rgba(15,20,48,.3);padding:6px 10px;border-radius:12px}
.xmt-los{display:flex;gap:10px;flex-wrap:wrap}
.xmt .xmt-go{flex:2 1 180px;border:0;border-radius:18px;padding:13px 16px;background:#fff;color:#1B2240;font:700 1.15rem "Fredoka",system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;gap:2px;box-shadow:0 6px 14px rgba(0,0,0,.18)}
.xmt-go small{font:500 .78rem "Lexend",system-ui,sans-serif;opacity:.75}
.xmt .xmt-go.xmt-zwei{flex:1 1 100px;background:rgba(15,20,48,.42);color:#fff}
/* Runde */
.xmt-rw{max-width:600px}
.xmt-runde{height:var(--xmt-h,620px);display:flex;flex-direction:column;gap:8px}
.xmt-top{display:flex;align-items:center;gap:8px;flex:0 0 auto}
.xmt-x{width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,255,255,.16);background:rgba(15,20,48,.55);font-size:1rem;font-weight:700;flex:0 0 auto}
.xmt-dots{display:flex;gap:4px;flex:1;justify-content:center;min-width:0}
.xmt-dots i{width:9px;height:9px;border-radius:50%;background:rgba(255,255,255,.4);box-shadow:0 0 0 1px rgba(15,20,48,.25);flex:0 0 auto}
.xmt-dots i.r{background:#2FB45A}.xmt-dots i.f{background:#F59F00}.xmt-dots i.j{background:#fff;box-shadow:0 0 0 2px rgba(15,20,48,.55)}
.xmt-zeit{min-width:66px;text-align:center;font-variant-numeric:tabular-nums}
.xmt-karte{flex:1 1 auto;min-height:0;border-radius:24px;padding:28px 14px 26px;box-shadow:0 12px 26px rgba(27,34,64,.25);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;position:relative;overflow:hidden;transition:box-shadow .2s}
.xmt-kl{position:absolute;top:10px;left:14px;right:14px;font-size:.75rem;font-weight:700;opacity:.92;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.xmt-ende .xmt-kl{position:static}
.xmt-q{font:700 clamp(1.7rem,7.5vw,2.6rem) "Fredoka",system-ui,sans-serif;text-align:center;line-height:1.3;color:#fff;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;column-gap:.22em;max-width:100%}
.xmt-zl{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;column-gap:.22em;width:100%}
.xmt-q.xmt-gl{font-size:clamp(1.5rem,6.6vw,2.3rem);row-gap:.15em}
.xmt-q.xmt-lang{display:block;font:600 clamp(1rem,4.3vw,1.3rem)/1.45 "Lexend",system-ui,sans-serif;text-align:left}
.xmt-lu{display:inline-flex;align-items:center;justify-content:center;min-width:1.7em;padding:0 .25em;border-radius:.3em;background:rgba(255,255,255,.95);color:#1B2240;line-height:1.25;font-style:normal}
.xmt-lu:not(.voll){color:rgba(27,34,64,.35)}
.xmt-br{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;line-height:1.08;font-size:.82em;margin:0 .08em}
.xmt-br i{font-style:normal;padding:0 .14em;text-align:center;min-width:1em}
.xmt-br i:first-child{border-bottom:.08em solid currentColor;padding-bottom:.05em}
.xmt-br .xmt-lu{min-width:1.3em;font-size:.95em;margin:.04em 0}
.xmt-antw{display:flex;align-items:center;gap:8px;font:700 1.8rem "Fredoka",system-ui,sans-serif}
.xmt-antw .xmt-lu{min-width:3.4em}
.xmt-einh{font-size:1.25rem}
.xmt-col{display:inline-flex;flex-direction:column;font:700 clamp(1.35rem,6.2vw,2rem)/1.22 ui-monospace,"SF Mono",Menlo,Consolas,monospace}
.xmt-cz{display:flex;justify-content:flex-end}
.xmt-cz span{width:.78em;text-align:center}
.xmt-strich{height:3px;background:#fff;border-radius:2px;margin:3px 0 5px}
.xmt-cres{background:rgba(255,255,255,.95);color:#1B2240;border-radius:.25em}
.xmt-cres:not(.voll) .xmt-rc:last-child::after{content:"?";color:rgba(27,34,64,.35)}
.xmt-cres:not(.voll) .xmt-rc:last-child{font-size:0}
.xmt-cres:not(.voll) .xmt-rc:last-child::after{font-size:clamp(1.35rem,6.2vw,2rem)}
.xmt-fb{position:absolute;bottom:7px;left:0;right:0;text-align:center;font-weight:700;font-size:.95rem;opacity:0;transition:opacity .2s;pointer-events:none}
.xmt-fb.an{opacity:1}
.xmt-karte.xmt-gut{box-shadow:0 0 0 5px #2FB45A,0 12px 26px rgba(27,34,64,.25)}
.xmt-karte.xmt-gut .xmt-lu,.xmt-karte.xmt-gut .xmt-cres{background:#D3F9D8}
.xmt-karte.xmt-schade{box-shadow:0 0 0 5px #F59F00,0 12px 26px rgba(27,34,64,.25)}
.xmt-pad{flex:0 0 auto;height:clamp(210px,47%,350px)}
.xmt-tast{display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(4,1fr);gap:7px;height:100%}
.xmt-t{border:0;border-radius:16px;background:linear-gradient(180deg,#4C5FD5,#3B4BC0);font:700 clamp(1.4rem,6vw,1.9rem) "Fredoka",system-ui,sans-serif;box-shadow:0 4px 0 #26318A;touch-action:manipulation;min-height:0}
.xmt-t:active{transform:translateY(3px);box-shadow:0 1px 0 #26318A}
.xmt-t.xmt-sym{background:linear-gradient(180deg,#6A7BE0,#5566CF)}
.xmt-t.xmt-del{background:linear-gradient(180deg,#E8590C,#D9480F);box-shadow:0 4px 0 #A33A0A}
.xmt-t.xmt-0{grid-column:span 2}
.xmt-t.xmt-ok{grid-column:span 2;background:linear-gradient(180deg,#2B9E4F,#237F40);box-shadow:0 4px 0 #17603A;font-size:clamp(1.1rem,4.6vw,1.4rem)}
.xmt-wahl{display:grid;grid-template-columns:1fr 1fr;gap:10px;height:100%}
.xmt-wahl.xmt-vgl{grid-template-columns:1fr 1fr 1fr}
.xmt-opt{border:0;border-radius:18px;background:linear-gradient(180deg,#4C5FD5,#3B4BC0);font:700 clamp(1.5rem,7vw,2.2rem) "Fredoka",system-ui,sans-serif;box-shadow:0 4px 0 #26318A;display:flex;align-items:center;justify-content:center;min-height:0}
.xmt-vgl .xmt-opt{font-size:clamp(2rem,10vw,3rem)}
.xmt-opt.ok{background:linear-gradient(180deg,#2B9E4F,#237F40);box-shadow:0 4px 0 #17603A}
.xmt-opt.nok{background:linear-gradient(180deg,#E8590C,#D9480F);box-shadow:0 4px 0 #A33A0A}
.xmt-opt:disabled{cursor:default;opacity:1}
.xmt-loes{height:100%;border-radius:20px;background:linear-gradient(135deg,#1B2240,#33407A);padding:14px 16px;display:flex;flex-direction:column;gap:8px;overflow:auto}
.xmt-loes p{margin:0;color:#fff}
.xmt-lk{font-size:1.08rem}
.xmt-lk b{font-family:"Fredoka",system-ui,sans-serif;font-size:1.35rem;background:#FFE34D;color:#1B2240;border-radius:10px;padding:1px 10px;display:inline-flex;align-items:center;gap:4px}
.xmt-weg{font-size:.98rem;line-height:1.5}
.xmt-weg>span:first-child{font-weight:700;color:#FFE34D}
.xmt-weg .xmt-br{font-size:.78em}
.xmt .xmt-weiter{margin-top:auto;border:0;border-radius:16px;padding:12px;background:#fff;color:#1B2240;font:700 1.15rem "Fredoka",system-ui,sans-serif;flex:0 0 auto}
/* Ende */
.xmt-ende{position:relative;align-items:flex-start;overflow:hidden}
.xmt-eimg{position:absolute;right:6px;top:8px;height:124px;pointer-events:none}
.xmt-gross{font:700 3.4rem/1 "Fredoka",system-ui,sans-serif;color:#fff}
.xmt-gross small{font-size:1.4rem;opacity:.9}
.xmt-msg{margin:0;font-size:1.05rem;font-weight:600;padding-right:120px}
.xmt-neu{margin:0;background:rgba(15,20,48,.35);padding:6px 12px;border-radius:12px;font-weight:700}
.xmt-ende .xmt-los{width:100%}
@media (max-width:560px){
  .xmt-kopf{padding:12px 14px;min-height:68px;border-radius:22px;margin:0 0 8px}
  .xmt-kopf>div{padding-right:70px}
  .xmt-kopf h1{font-size:1.35rem}.xmt-kopf p{font-size:.8rem}
  .xmt-kopf-emo{font-size:1.7rem}
  .xmt-kopf img{max-height:92px}
  .xmt-info{margin-bottom:8px}.xmt-info span{font-size:.75rem;padding:3px 10px}
  .xmt-kacheln{grid-template-columns:1fr 1fr;gap:8px}
  .xmt-kachel{min-height:0;padding:10px 10px 9px;border-radius:18px;gap:6px}
  .xmt-kachel small{display:none}
  .xmt-k1{padding-right:0}
  .xmt-k1 b{font-size:.95rem}.xmt-emo{font-size:1.25rem}
  .xmt-tag{top:-6px;right:8px}
  .xmt-k2{font-size:.7rem;gap:5px}
  .xmt-panel,.xmt-ende{padding:15px;gap:11px;border-radius:22px}
  .xmt-ph h2{font-size:1.35rem}.xmt-ph .xmt-emo{font-size:2rem}
  .xmt .xmt-go{font-size:1.05rem;padding:11px}
  .xmt-q.xmt-lang{font-size:clamp(.95rem,4.2vw,1.1rem)}
  .xmt-eimg{height:94px}
  .xmt-msg{padding-right:86px}
  .xmt-gross{font-size:2.8rem}
}
@media (max-height:780px) and (max-width:560px){
  .xmt-kacheln{gap:7px}
  .xmt-kachel{padding:8px 10px;gap:5px}
  .xmt-pad{height:clamp(200px,48%,290px)}
  .xmt-tast{gap:6px}
  .xmt-karte{padding-top:26px}
}
@media (min-width:700px){
  .xmt-q{font-size:3.1rem}
  .xmt-q.xmt-gl{font-size:2.7rem}
  .xmt-q.xmt-lang{font-size:1.4rem}
  .xmt-col{font-size:2.4rem}
  .xmt-cres:not(.voll) .xmt-rc:last-child::after{font-size:2.4rem}
  .xmt-antw{font-size:2.3rem}
  .xmt-kl{font-size:.85rem}
}
@media (min-width:700px) and (min-height:900px){
  .xmt-rw{max-width:660px}
  .xmt-pad{height:clamp(260px,45%,390px)}
  .xmt-t{font-size:2.1rem}
}
@media (prefers-reduced-motion:reduce){.xmt-kachel,.xmt-karte,.xmt-fb{transition:none}.xmt-kachel:hover{transform:none}.xmt-t:active{transform:none}}
`;
document.head.appendChild(css);

X.register({
  id:"mathe", titel:"Mathe-Trainer", text:"Unendlich viele Rechenaufgaben, die mit dir wachsen", emo:"🧮",
  farbe:"linear-gradient(135deg,#3B5BDB,#7048E8 60%,#C2255C)", reihe:30,
  hinweis(){ return ""; },
  render(box){ render(box); }
});

window.EP_MATHE = {
  stand(){ const st = laden(), out = {};
    GEN.BEREICHE.forEach(b => { const x = st.b[b.id]; out[b.id] = {titel:b.titel, stufe:x ? x.s : startStufe(), sterne:sterne(x), best:x ? x.best : 0, runden:x ? x.r : 0, blitz:x ? x.blitz : 0}; });
    return {bereiche:out, richtig:st.total || 0, heute:st.tag === A.heute() ? st.heute || 0 : 0, schwacheReihen:Object.keys(st.reihen || {}).filter(r => st.reihen[r] >= 2).map(Number)}; },
  /* für den Eltern-Bericht: Bereiche, die mindestens Stufe 5 erreicht haben */
  fortschritt(){ const st = laden(); return {hat:GEN.BEREICHE.filter(b => st.b[b.id] && st.b[b.id].s >= 5).length, alle:GEN.BEREICHE.length}; },
  bereiche(){ return GEN.BEREICHE.map(b => ({id:b.id, titel:b.titel})); },
  aufgabe(bereich, stufe){ return GEN.aufgabe(bereich, stufe || 1, null, null); }
};
})();
