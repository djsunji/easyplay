/* easyplay: Soundpaket «Musik & Töne»
   Ein Teil der Musik und Töne entsteht im Browser (Web Audio API), der Rest liegt als MP3 in musik/ (DATEI_STUECKE, FX_DATEI).
   Musik je Ort: Startseite sonnenschein (19 bis 7 Uhr zauberlaterne), Quiz quiz, Duell duell, Live-Quiz live, Qeels qeels, Bibliothek bibliothek.

   window.EP_SOUND
     play(name)          Effekt abspielen: klick, richtig, falsch, xp, levelup, sammeln, freischalten, truhe, fanfare, tick, wisch, fehler (+ fertig)
     musik(name|null)    Musik wünschen: sonnenschein, quiz, duell, live, qeels, start, bibliothek, abenteuer, fest; null = keine Musik (spielt nur, wenn Musik eingeschaltet ist)
     an()                true, wenn Töne oder Musik eingeschaltet sind
     effekteAn(), musikAn(), lautstaerke()
     setze({effekte, musik, lautstaerke})   Einstellungen ändern (lautstaerke 0..1), wird gespeichert
     stuecke(), effekte()                   Listen für eigene Menüs
   Speicher: ep-x-sound-effekte (Standard an), ep-x-sound-musik (Standard aus), ep-x-sound-vol (Standard 0.6)
   Audio startet erst nach der ersten Berührung/Taste (AudioContext wird erst dann erzeugt). */
(function(){
"use strict";

/* ---------- Einstellungen ---------- */
const LS = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};
const K = { fx:"ep-x-sound-effekte", mu:"ep-x-sound-musik", vol:"ep-x-sound-vol" };
const E = { effekte: LS.get(K.fx, true) !== false, musik: LS.get(K.mu, false) === true, vol: (() => { const v = +LS.get(K.vol, 0.6); return isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.6; })() };
const hoerer = new Set();
const melden = () => hoerer.forEach(f => { try{ f(); }catch(e){} });

/* ---------- Grundbausteine (funktionieren mit AudioContext und OfflineAudioContext) ---------- */
const mtof = n => 440 * Math.pow(2, (n - 69) / 12);
const PC = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };
function nr(s){ const m = /^([A-G])([#b]?)(-?\d)$/.exec(s); if(!m) return 60; return 12 * (+m[3] + 1) + PC[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0); }
const RAUSCH = new WeakMap();
function rauschen(c){
  let b = RAUSCH.get(c); if(b) return b;
  b = c.createBuffer(1, Math.floor(c.sampleRate * 1.0), c.sampleRate);
  const d = b.getChannelData(0); let s = 12345; for(let i = 0; i < d.length; i++){ s = (s * 1103515245 + 12345) & 0x7fffffff; d[i] = s / 0x3fffffff - 1; }
  RAUSCH.set(c, b); return b;
}
const PANS = new WeakMap();
function ziel(c, out, pan){
  if(!pan || !c.createStereoPanner) return out;
  pan = Math.round(Math.max(-1, Math.min(1, pan)) * 20) / 20;
  let m = PANS.get(out); if(!m){ m = new Map(); PANS.set(out, m); }
  let p = m.get(pan); if(!p){ p = c.createStereoPanner(); p.pan.value = pan; p.connect(out); m.set(pan, p); }
  return p;
}
/* Kurzer Ton mit Anschlag und Ausklingen (Mallets, Glocken) */
function schlag(c, out, o){
  const t = o.t, a = o.a || 0.004, d = o.d || 0.3, v = o.v || 0.2;
  const osc = c.createOscillator(); osc.type = o.typ || "sine"; osc.frequency.setValueAtTime(o.f, t);
  if(o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t + (o.fz || d));
  const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  let n = osc; if(o.lp){ const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = o.lp; osc.connect(f); n = f; }
  n.connect(g); g.connect(ziel(c, out, o.pan));
  osc.onended = () => { try{ g.disconnect(); if(n !== osc) n.disconnect(); osc.disconnect(); }catch(e){} };   // fertige Noten aus dem Graphen nehmen
  osc.start(t); osc.stop(t + a + d + 0.05);
}
/* Gemeinsamer Tiefpass je Spur (ein Filter für viele Noten spart viel Rechenzeit) */
const FILTER = new WeakMap();
function geteilt(c, out, lp, q, pan){
  let m = FILTER.get(out); if(!m){ m = new Map(); FILTER.set(out, m); }
  const key = lp + "|" + q + "|" + (pan || 0);
  let f = m.get(key); if(!f){ f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = lp; f.Q.value = q; f.connect(ziel(c, out, pan)); m.set(key, f); }
  return f;
}
/* Gehaltener Ton (Bass, Flächen, Bläser) */
function halten(c, out, o){
  const t = o.t, a = o.a || 0.02, s = Math.max(a + 0.01, o.s || 0.5), r = o.r || 0.2, v = o.v || 0.1;
  const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + a);
  g.gain.setValueAtTime(v, t + s); g.gain.exponentialRampToValueAtTime(0.0001, t + s + r);
  g.connect(o.lp ? geteilt(c, out, o.lp, o.q || 0.6, o.pan) : ziel(c, out, o.pan));
  (o.det || [0]).forEach((dt, i) => { const osc = c.createOscillator(); osc.type = o.typ || "triangle"; osc.frequency.value = o.f; if(dt) osc.detune.value = dt;
    osc.connect(g); if(i === 0) osc.onended = () => { try{ g.disconnect(); }catch(e){} };
    osc.start(t); osc.stop(t + s + r + 0.05); });
}
function geraeusch(c, out, o){
  const t = o.t, d = o.d || 0.05, v = o.v || 0.05, a = o.a || 0.003;
  const src = c.createBufferSource(); src.buffer = rauschen(c); src.loop = true;
  const f = c.createBiquadFilter(); f.type = o.ft || "highpass"; f.frequency.setValueAtTime(o.ff || 6000, t); f.Q.value = o.q || 0.7;
  if(o.ff2) f.frequency.exponentialRampToValueAtTime(o.ff2, t + d);
  const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  src.connect(f); f.connect(g); g.connect(ziel(c, out, o.pan));
  src.onended = () => { try{ g.disconnect(); f.disconnect(); }catch(e){} };
  src.start(t, (t * 7.31) % 0.5); src.stop(t + a + d + 0.06);
}

/* Instrumente: (c, out, t, midi, dauer in s, lautstärke, pan) */
const INST = {
  marimba(c, out, t, n, dur, v, pan){ const f = mtof(n), d = Math.min(1.1, 0.35 + dur * 0.35);
    schlag(c, out, {t, f, v: v * 0.8, d, pan});
    schlag(c, out, {t, f: f * 3.93, v: v * 0.16, d: d * 0.25, pan});
    schlag(c, out, {t, f: f * 2, typ:"triangle", v: v * 0.12, d: d * 0.4, pan}); },
  xylo(c, out, t, n, dur, v, pan){ const f = mtof(n);
    schlag(c, out, {t, f, v: v * 0.7, d: 0.32, pan});
    schlag(c, out, {t, f: f * 3, v: v * 0.22, d: 0.09, pan});
    schlag(c, out, {t, f: f * 6.2, v: v * 0.06, d: 0.04, pan}); },
  glock(c, out, t, n, dur, v, pan){ const f = mtof(n);
    schlag(c, out, {t, f, v: v * 0.6, d: Math.min(1.8, 0.8 + dur * 0.5), a: 0.002, pan});
    schlag(c, out, {t, f: f * 2.76, v: v * 0.2, d: 0.35, a: 0.002, pan});
    schlag(c, out, {t, f: f * 5.4, v: v * 0.07, d: 0.12, a: 0.002, pan}); },
  pluck(c, out, t, n, dur, v, pan){ const f = mtof(n);
    schlag(c, out, {t, f, typ:"triangle", v: v * 0.8, d: 0.22, lp: 1400, pan});
    schlag(c, out, {t, f: f * 2, v: v * 0.15, d: 0.08, pan}); },
  bass(c, out, t, n, dur, v, pan){ const f = mtof(n), s = Math.max(0.08, dur * 0.85);
    halten(c, out, {t, f, typ:"triangle", a: 0.012, s, r: 0.12, v: v * 0.75, lp: 700, pan});
    halten(c, out, {t, f, typ:"sine", a: 0.012, s, r: 0.12, v: v * 0.5, pan}); },
  pad(c, out, t, n, dur, v, pan){ const f = mtof(n);
    halten(c, out, {t, f, typ:"sawtooth", det:[-7, 7], a: Math.min(0.6, dur * 0.3), s: dur, r: 0.9, v: v * 0.5, lp: 850, pan}); },
  blaeser(c, out, t, n, dur, v, pan){ const f = mtof(n);
    halten(c, out, {t, f, typ:"sawtooth", a: 0.03, s: Math.max(0.1, dur * 0.9), r: 0.18, v: v * 0.5, lp: 1300, q: 0.9, pan});
    schlag(c, out, {t, f: f * 2, v: v * 0.12, d: 0.12, a: 0.01, pan}); },
  shaker(c, out, t, n, dur, v, pan){ geraeusch(c, out, {t, d: 0.045, v, ff: 7000, pan}); },
  schelle(c, out, t, n, dur, v, pan){ geraeusch(c, out, {t, d: 0.09, v, ft:"bandpass", ff: 8500, q: 2, pan}); },
  pauke(c, out, t, n, dur, v, pan){ schlag(c, out, {t, f: 120, f2: 55, fz: 0.18, v, d: 0.35, a: 0.003, pan}); }
};

/* ---------- Effekte (geben ihre Länge in s zurück) ---------- */
function fol(c, out, t, inst, noten, abst, v, dur, pan){ noten.forEach((n, i) => INST[inst](c, out, t + i * abst, typeof n === "string" ? nr(n) : n, dur || 0.2, v, pan)); }
const FX = {
  klick(c, o, t){ schlag(c, o, {t, f: 1050, f2: 760, fz: 0.05, v: 0.16, d: 0.06, a: 0.002}); schlag(c, o, {t, f: 2100, v: 0.03, d: 0.025, a: 0.001}); return 0.15; },
  tick(c, o, t){ schlag(c, o, {t, f: 1700, v: 0.1, d: 0.035, a: 0.001}); return 0.1; },
  richtig(c, o, t){ INST.marimba(c, o, t, nr("G5"), 0.2, 0.42); INST.marimba(c, o, t + 0.09, nr("C6"), 0.4, 0.46); INST.glock(c, o, t + 0.17, nr("E7"), 0.3, 0.14); return 0.9; },
  falsch(c, o, t){ INST.marimba(c, o, t, nr("E4"), 0.25, 0.42); INST.marimba(c, o, t + 0.15, nr("C4"), 0.5, 0.4); return 0.8; },
  fehler(c, o, t){ schlag(c, o, {t, f: 300, f2: 250, fz: 0.1, v: 0.22, d: 0.14, lp: 1200}); schlag(c, o, {t: t + 0.12, f: 280, f2: 220, fz: 0.12, v: 0.2, d: 0.18, lp: 1200}); return 0.45; },
  xp(c, o, t){ fol(c, o, t, "glock", ["C6", "E6", "G6"], 0.055, 0.22, 0.15); INST.glock(c, o, t + 0.17, nr("C7"), 0.3, 0.1); return 0.9; },
  sammeln(c, o, t){ schlag(c, o, {t, f: 480, f2: 1150, fz: 0.07, v: 0.26, d: 0.12, a: 0.003}); INST.glock(c, o, t + 0.07, nr("A6"), 0.4, 0.22); INST.glock(c, o, t + 0.13, nr("E7"), 0.3, 0.08); return 0.9; },
  freischalten(c, o, t){ fol(c, o, t, "marimba", ["C5", "E5", "G5", "C6"], 0.07, 0.34, 0.2);
    ["C5", "E5", "G5"].forEach(n => INST.pad(c, o, t + 0.28, nr(n), 0.5, 0.11)); INST.glock(c, o, t + 0.3, nr("G6"), 0.6, 0.18); INST.glock(c, o, t + 0.38, nr("C7"), 0.6, 0.12); return 1.8; },
  truhe(c, o, t){ geraeusch(c, o, {t, d: 0.18, v: 0.07, ft:"bandpass", ff: 380, ff2: 260, q: 4, a: 0.02});
    fol(c, o, t + 0.16, "glock", ["C5", "D5", "E5", "G5", "A5", "C6", "D6", "E6", "G6"], 0.045, 0.2, 0.15, 0);
    ["C6", "E6", "G6"].forEach((n, i) => INST.glock(c, o, t + 0.62 + i * 0.012, nr(n), 0.8, 0.16)); INST.pauke(c, o, t + 0.6, 0, 0, 0.18); return 2.2; },
  fanfare(c, o, t){ fol(c, o, t, "blaeser", ["G4", "C5", "E5"], 0.13, 0.3, 0.12);
    ["C4", "G4", "C5", "E5"].forEach(n => INST.blaeser(c, o, t + 0.39, nr(n), 0.75, 0.2)); INST.pauke(c, o, t + 0.39, 0, 0, 0.22);
    fol(c, o, t + 0.39, "glock", ["G6", "C7"], 0.1, 0.16, 0.5); return 1.9; },
  levelup(c, o, t){ fol(c, o, t, "marimba", ["C5", "D5", "E5", "F5", "G5", "A5", "B5", "C6"], 0.05, 0.3, 0.15);
    ["C4", "E4", "G4", "C5"].forEach(n => INST.blaeser(c, o, t + 0.42, nr(n), 0.8, 0.18)); INST.pauke(c, o, t + 0.42, 0, 0, 0.2);
    fol(c, o, t + 0.45, "glock", ["E6", "G6", "C7"], 0.09, 0.18, 0.5); return 2.1; },
  wisch(c, o, t){ geraeusch(c, o, {t, d: 0.22, v: 0.3, ft:"bandpass", ff: 700, ff2: 3200, q: 1.2, a: 0.06}); return 0.35; },
  fertig(c, o, t){ INST.glock(c, o, t, nr("G5"), 0.4, 0.22); INST.glock(c, o, t + 0.2, nr("C6"), 0.6, 0.24);
    ["C4", "E4", "G4"].forEach(n => INST.pad(c, o, t + 0.05, nr(n), 0.6, 0.09)); return 1.6; }
};
const FX_NAMEN = [
  ["klick", "Klick", "👆"], ["richtig", "Richtig", "✅"], ["falsch", "Daneben", "🙃"], ["xp", "XP", "⭐"], ["levelup", "Level auf", "🚀"], ["sammeln", "Sammeln", "🫧"],
  ["freischalten", "Freischalten", "🔓"], ["truhe", "Truhe", "🎁"], ["fanfare", "Fanfare", "🎺"], ["tick", "Tick", "⏱️"], ["wisch", "Wisch", "💨"], ["fehler", "Hoppla", "🤭"],
  ["duellstart", "Duell-Start", "⚔️"], ["countdown", "Countdown", "⏳"]
];

/* ---------- Musik (eigene Kompositionen) ---------- */
const CHQ = { "":[0, 4, 7], m:[0, 3, 7], "7":[0, 4, 7, 10], maj7:[0, 4, 7, 11], m7:[0, 3, 7, 10], sus4:[0, 5, 7] };
function akkord(name){
  const m = /^([A-G])([#b]?)(.*)$/.exec(name); const pc = PC[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
  let base = 48 + ((pc + 12) % 12); if(base < 53) base += 12;           // Grundton zwischen F3 und E4
  return { grund: base, toene: (CHQ[m[3]] || CHQ[""]).map(i => base + i) };
}
function linie(str){
  let b = 0; const r = [];
  str.trim().split(/\s+/).forEach(tok => { if(tok === "|") return; const [n, d] = tok.split(":"); const dd = +d;
    if(n !== "-") r.push({b, n: n.split("+").map(nr), d: dd}); b += dd; });
  r.laenge = b; return r;
}
function folge(str){ let b = 0; return str.trim().split(/\s+/).filter(x => x !== "|").map(tok => { const [n, d] = tok.split(":"); const o = Object.assign({b, d: +d}, akkord(n)); b += +d; return o; }); }

const STUECKE = {
  start: { titel:"Sonnenstart", text:"Fröhlich, für den Start", emo:"☀️", farbe:"linear-gradient(135deg,#FF8A00,#F5487F)", bpm:112,
    akk:"C:4 Am:4 F:4 G:4 | C:4 Em:4 F:4 G:4 | Am:4 F:4 C:4 G:4 | Dm:4 G:4 C:4 G:4",
    mel:{inst:"marimba", v:0.42, pan:-0.1, s:`E5:1 G5:.5 E5:.5 D5:1 C5:1 | E5:.5 D5:.5 C5:1 A4:1.5 -:.5 | A4:.5 C5:.5 F5:1 E5:.5 D5:.5 C5:1 | D5:1.5 B4:.5 G4:1 -:1 |
      G5:.5 E5:.5 G5:.5 A5:.5 G5:1 E5:1 | B4:1 E5:.5 G5:.5 B5:1.5 -:.5 | A5:.5 G5:.5 F5:.5 E5:.5 F5:1 A5:1 | G5:1.5 F5:.5 D5:1 B4:1 |
      C5:.5 E5:.5 A5:1 G5:.5 E5:.5 C5:1 | F5:.5 E5:.5 C5:.5 A4:.5 C5:2 | E5:.5 G5:.5 C6:1 B5:.5 G5:.5 E5:1 | D5:1 G5:1 F5:.5 D5:.5 B4:1 |
      A4:.5 D5:.5 F5:.5 A5:.5 G5:1 F5:1 | E5:.5 D5:.5 B4:1 D5:1 G5:1 | E5:1 D5:.5 C5:.5 G4:1 C5:1 | D5:1 E5:.5 D5:.5 B4:1 -:1`},
    deko:{inst:"glock", v:0.13, pan:0.3, s:"-:12 -:2 D6:.5 G6:.5 B6:1 -:12 -:2 D6:.5 G6:.5 B6:1 -:12 -:2 B5:.5 D6:.5 G6:1 -:12 -:2 D6:.5 B5:.5 G5:1"},
    pad:{v:0.05}, bass:{v:0.3, muster:[[0, 0, 1.4], [1.5, 7, 0.45], [2, 0, 0.9], [3, 7, 0.9]]}, shaker:{v:0.018, raster:0.5, ab:0.5} },
  bibliothek: { titel:"Leseecke", text:"Ruhig, zum Lesen", emo:"📚", farbe:"linear-gradient(135deg,#2F80ED,#6A5AE0)", bpm:74,
    akk:"Fmaj7:4 Dm7:4 Bbmaj7:4 Csus4:2 C:2 | Fmaj7:4 Am7:4 Bbmaj7:4 Gm7:2 C:2 | Dm7:4 Bbmaj7:4 Gm7:4 Csus4:2 C:2",
    mel:{inst:"glock", v:0.24, pan:0.15, s:`A5:2 G5:1 F5:1 | A5:1.5 C6:.5 A5:2 | F5:1 D5:1 A5:2 | G5:3 -:1 |
      C6:1 A5:1 G5:1 F5:1 | E5:2 G5:1 A5:1 | D6:1.5 C6:.5 A5:2 | G5:2 E5:2 |
      F5:1 A5:1 C6:2 | Bb5:1 A5:1 F5:2 | G5:1.5 A5:.5 Bb5:1 D6:1 | C6:2 -:2`},
    arp:{inst:"marimba", v:0.14, pan:-0.25, schritt:1, oktave:12, folge:[0, 1, 2, 3]},
    pad:{v:0.045}, bass:{v:0.26, muster:[[0, 0, 3.6]]} },
  abenteuer: { titel:"Bergpfad", text:"Verspielt, für Abenteuer", emo:"🧭", farbe:"linear-gradient(135deg,#0FA968,#0B6E6A)", bpm:126,
    akk:"Dm:4 C:4 Dm:4 Am:4 | Dm:4 C:4 Bb:4 C:4 | F:4 C:4 Dm:4 Am:4 | Bb:4 C:4 Dm:4 A:4",
    mel:{inst:"xylo", v:0.4, pan:0.12, s:`D5:.5 F5:.5 A5:.5 -:.5 G5:.5 F5:.5 E5:1 | E5:.5 G5:.5 C6:.5 -:.5 B5:.5 G5:.5 E5:1 | F5:.5 A5:.5 D6:1 C6:.5 A5:.5 F5:1 | E5:1.5 -:.5 C5:.5 D5:.5 E5:1 |
      A5:.5 A5:.5 G5:.5 F5:.5 G5:1 A5:1 | G5:.5 G5:.5 F5:.5 E5:.5 G5:1 E5:1 | D5:.5 F5:.5 Bb5:1 A5:.5 F5:.5 D5:1 | E5:.5 F5:.5 G5:1 -:2 |
      C6:.5 A5:.5 F5:.5 A5:.5 C6:1 F6:1 | E6:.5 C6:.5 G5:.5 C6:.5 E6:1 -:1 | D6:.5 C6:.5 A5:.5 F5:.5 G5:.5 A5:.5 D5:1 | E5:1 G5:.5 E5:.5 C5:1 -:1 |
      F5:.5 D5:.5 F5:.5 Bb5:.5 A5:1 F5:1 | G5:.5 E5:.5 G5:.5 C6:.5 B5:1 G5:1 | A5:1 F5:.5 D5:.5 E5:.5 F5:.5 G5:1 | E5:1 C#5:1 A4:1 -:1`},
    pad:{v:0.035}, bassInst:"pluck", bass:{v:0.34, muster:[[0, -12, .4], [.5, -5, .4], [1, 0, .4], [1.5, -5, .4], [2, -12, .4], [2.5, -5, .4], [3, 0, .4], [3.5, 2, .4]]},
    shaker:{v:0.022, raster:0.5, ab:0}, pauke:{v:0.12, schlaege:[0, 2]} },
  fest: { titel:"Festumzug", text:"Festlich, für Feste", emo:"🎉", farbe:"linear-gradient(135deg,#C2185B,#7B3FE4)", bpm:96,
    akk:"G:4 C:4 D:4 G:4 | Em:4 C:4 A:4 D:4 | G:4 C:4 Am:2 D:2 G:2 D:2",
    mel:{inst:"glock", v:0.26, pan:0.15, s:`D5:1 G5:1 B5:1.5 A5:.5 | G5:1 E5:1 C5:2 | A4:.5 D5:.5 F#5:1 A5:1 F#5:1 | G5:3 -:1 |
      B5:1 G5:.5 B5:.5 E6:1.5 D6:.5 | C6:1 G5:1 E5:1 G5:1 | C#6:1 A5:.5 E5:.5 A5:1 C#6:1 | D6:2 A5:1 F#5:1 |
      G5:.5 A5:.5 B5:1 D6:1 B5:1 | C6:1 E6:1 D6:.5 C6:.5 A5:1 | C6:1 A5:1 F#5:1 A5:1 | G5:2 -:1 D5:1`},
    stoesse:{v:0.13, muster:[[0, 1.2], [1.5, 0.4], [2, 1.6]]}, bass:{v:0.3, muster:[[0, 0, .9], [1, 7, .9], [2, 0, .9], [3, 7, .9]]},
    schelle:{v:0.016, raster:0.5, ab:0.5}, pauke:{v:0.14, schlaege:[0]} }
};

/* Stücke als Audiodatei (musik/*.mp3, nahtlose Schleifen, n = exakte Länge in Samples bei 44,1 kHz) */
const DATEI_STUECKE = {
  sonnenschein: { titel:"Sonnenschein", text:"Fröhlich, für die Startseite", emo:"🌞", farbe:"linear-gradient(135deg,#F7B32B,#F2762E)", datei:"musik/loop-startseite.mp3", n:1512000, gain:1.15 },
  zauberlaterne: { titel:"Zauberlaterne", text:"Verträumt, für die Startseite am Abend", emo:"🏮", farbe:"linear-gradient(135deg,#3B3F9E,#1E2A6E)", datei:"musik/loop-startseite-nacht.mp3", n:1924364, gain:1.15 },
  quiz: { titel:"Denkmütze", text:"Ruhig, zum Nachdenken im Quiz", emo:"🤔", farbe:"linear-gradient(135deg,#3B82F6,#2563EB)", datei:"musik/loop-quiz.mp3", n:1693440, gain:1.1 },
  duell: { titel:"Bergduell", text:"Schnell und mutig, für Duelle", emo:"⚔️", farbe:"linear-gradient(135deg,#F05A4F,#C62F3B)", datei:"musik/loop-duell.mp3", n:1209600, gain:1.1 },
  live: { titel:"Showtime", text:"Quizshow, für das Live-Quiz", emo:"🎤", farbe:"linear-gradient(135deg,#B05CEB,#7B3FE4)", datei:"musik/loop-livequiz.mp3", n:1365677, gain:1.1 },
  qeels: { titel:"Chill-Beats", text:"Entspannt, für Qeels", emo:"🎧", farbe:"linear-gradient(135deg,#F0569E,#C2185B)", datei:"musik/loop-qeels.mp3", n:1924364, gain:1.2 }
};
Object.keys(DATEI_STUECKE).forEach(id => { STUECKE[id] = DATEI_STUECKE[id]; });
/* Kurze Klänge als Datei; solange eine Datei noch nicht geladen ist, spielt der eingebaute Ton */
const FX_DATEI = { richtig:"musik/fx-richtig.mp3", falsch:"musik/fx-falsch.mp3", xp:"musik/fx-muenze.mp3", levelup:"musik/fx-stufe.mp3",
  fanfare:"musik/fx-sieg.mp3", klick:"musik/fx-tipp.mp3", duellstart:"musik/fx-duell-start.mp3", countdown:"musik/fx-countdown.mp3" };
const FX_PUFFER = {};
function dekodieren(ab){
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const c = ctx || new OAC(2, 1, 44100);
  return new Promise((ok, err) => { try{ const pr = c.decodeAudioData(ab, ok, err); if(pr && pr.then) pr.then(ok, err); }catch(e){ err(e); } });
}
function dateiHolen(url){ return fetch(url).then(r => { if(!r.ok) throw new Error(url + " " + r.status); return r.arrayBuffer(); }).then(dekodieren); }
function dateiStueck(st){
  return dateiHolen(st.datei).then(buf => {
    /* MP3 hat am Anfang eine kleine Encoder-Verzögerung; falls der Browser sie nicht entfernt, die Schleife dahinter legen */
    const soll = st.n * buf.sampleRate / 44100, extra = buf.length - soll;
    const vor = extra > 200 ? Math.min(extra, 1105 * buf.sampleRate / 44100) : 0;
    buf._ls = vor / buf.sampleRate; buf._le = (vor + soll) / buf.sampleRate; buf._gain = st.gain || 1;
    return buf;
  });
}
function fxDateienLaden(){ Object.keys(FX_DATEI).forEach(n => { if(!FX_PUFFER[n]) FX_PUFFER[n] = dateiHolen(FX_DATEI[n]).then(b => (FX_PUFFER[n] = b)).catch(() => { delete FX_PUFFER[n]; }); }); }

/* Ein Stück in einen Kontext einplanen; gibt die Länge in Sekunden zurück */
/* plan(t, fn): fn erst kurz vor der Zeit t ausführen (spart Rechenzeit beim Rendern) */
function stueckPlanen(c, out, name, plan){
  plan = plan || ((t, fn) => fn());
  const I = (inst, t, n, d, v, pan) => plan(t, () => INST[inst](c, out, t, n, d, v, pan));
  const st = STUECKE[name], sb = 60 / st.bpm, T = b => 0.05 + b * sb;
  const ak = folge(st.akk), laengeB = ak.reduce((s, a) => s + a.d, 0);
  const mel = linie(st.mel.s);
  if(Math.abs(mel.laenge - laengeB) > 0.001) console.warn("sound: Melodie", name, mel.laenge, laengeB);
  mel.forEach(x => x.n.forEach(n => I(st.mel.inst, T(x.b), n, x.d * sb, st.mel.v, st.mel.pan)));
  if(st.deko) linie(st.deko.s).forEach(x => x.n.forEach(n => I(st.deko.inst, T(x.b), n, x.d * sb, st.deko.v, st.deko.pan)));
  ak.forEach(a => {
    if(st.pad) a.toene.forEach((n, i) => I("pad", T(a.b), n, a.d * sb, st.pad.v, i % 2 ? 0.2 : -0.2));
    if(st.stoesse) st.stoesse.muster.forEach(([o, d]) => { if(o < a.d) a.toene.forEach(n => I("blaeser", T(a.b + o), n, Math.min(d, a.d - o) * sb, st.stoesse.v, -0.1)); });
    if(st.bass) st.bass.muster.forEach(([o, iv, d]) => { if(o < a.d) I(st.bassInst || "bass", T(a.b + o), a.grund - 12 + iv, Math.min(d, a.d - o) * sb, st.bass.v, 0); });
    if(st.arp){ const p = st.arp; for(let k = 0; k * p.schritt < a.d - 0.001; k++){ const n = a.toene[p.folge[k % p.folge.length] % a.toene.length] + p.oktave;
      I(p.inst, T(a.b + k * p.schritt), n, p.schritt * sb, p.v, p.pan); } }
    if(st.pauke) st.pauke.schlaege.forEach(o => { if(o < a.d) I("pauke", T(a.b + o), 0, 0, st.pauke.v, 0); });
  });
  ["shaker", "schelle"].forEach(k => { const p = st[k]; if(!p) return; for(let b = p.ab; b < laengeB - 0.001; b += p.raster) I(k, T(b), 0, 0, p.v * (b % 1 === 0 ? 0.7 : 1), 0.35); });
  return laengeB * sb;
}
function stueckLaenge(name){ const st = STUECKE[name]; if(st.datei) return st.n / 44100; return folge(st.akk).reduce((s, a) => s + a.d, 0) * 60 / st.bpm; }

/* Stück offline rendern, Nachklang an den Anfang falten (nahtlose Schleife), auf Zielpegel bringen */
const PUFFER = {};
function stueckRendern(name, sr){
  sr = sr || 24000;
  if(!STUECKE[name]) return Promise.reject(new Error("unbekannt"));
  if(STUECKE[name].datei) return dateiStueck(STUECKE[name]);
  const laenge = stueckLaenge(name), nach = 3;
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const oc = new OAC(2, Math.ceil((laenge + nach + 0.1) * sr), sr);
  const out = oc.createGain(); out.gain.value = 1; out.connect(oc.destination);
  /* Noten in Zeitfenstern erst erzeugen, wenn das Rendern dort ankommt (sonst rechnet der Browser tausende stille Knoten mit) */
  const W = 0.5, fenster = [];
  stueckPlanen(oc, out, name, (t, fn) => { const k = Math.max(0, Math.floor((t - 0.02) / W)); (fenster[k] = fenster[k] || []).push(fn); });
  (fenster[0] || []).forEach(fn => fn());
  for(let k = 1; k < fenster.length; k++){ if(!fenster[k]) continue; const liste = fenster[k];
    oc.suspend(k * W).then(() => { liste.forEach(fn => fn()); oc.resume(); }); }
  return oc.startRendering().then(buf => {
    const L = Math.round(laenge * sr), schl = Math.round(0.05 * sr);
    const neu = oc.createBuffer(2, L, sr);
    let spitze = 0;
    for(let ch = 0; ch < 2; ch++){
      const q = buf.getChannelData(ch), z = neu.getChannelData(ch);
      for(let i = 0; i < L; i++) z[i] = q[i + schl] || 0;                              // Start genau auf Takt 1
      for(let i = 0; i < L && i + L + schl < q.length; i++) z[i] += q[i + L + schl];   // Nachklang an den Anfang falten
      for(let i = 0; i < L; i++){ const a = Math.abs(z[i]); if(a > spitze) spitze = a; }
    }
    /* Lautheit angleichen (Effektivwert), Spitzen begrenzt */
    let qs = 0; for(let ch = 0; ch < 2; ch++){ const z = neu.getChannelData(ch); for(let i = 0; i < L; i++) qs += z[i] * z[i]; }
    const rms = Math.sqrt(qs / (2 * L)) || 1e-6;
    const faktor = spitze > 0 ? Math.min(0.13 / rms, 0.8 / spitze) : 1;
    for(let ch = 0; ch < 2; ch++){ const z = neu.getChannelData(ch); for(let i = 0; i < L; i++) z[i] *= faktor; }
    neu._rohSpitze = spitze;
    return neu;
  });
}
function puffer(name){ if(!PUFFER[name]) PUFFER[name] = stueckRendern(name).catch(e => { delete PUFFER[name]; throw e; }); return PUFFER[name]; }

/* ---------- Live-Audio ---------- */
const LOG = [];
let ctx = null, fxBus = null, muBus = null, muDuck = null, frei = false;
function pegel(){
  if(!ctx) return; const t = ctx.currentTime;
  fxBus.gain.setTargetAtTime(E.vol * 0.85, t, 0.05);
  muBus.gain.setTargetAtTime(E.vol * 0.32, t, 0.15);
}
function aufbauen(){
  if(ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext; if(!AC) return null;
  try{ ctx = new AC(); }catch(e){ ctx = null; return null; }
  const komp = ctx.createDynamicsCompressor(); komp.threshold.value = -8; komp.knee.value = 6; komp.ratio.value = 4; komp.attack.value = 0.004; komp.release.value = 0.2;
  komp.connect(ctx.destination);
  fxBus = ctx.createGain(); fxBus.connect(komp);
  muDuck = ctx.createGain(); muDuck.connect(komp);
  muBus = ctx.createGain(); muBus.connect(muDuck);
  fxBus.gain.value = 0; muBus.gain.value = 0; pegel();
  return ctx;
}
function entsperren(){
  if(document.hidden) return;
  if(!aufbauen()) return;
  const weiter = () => { if(!frei){ frei = true; aktuell = undefined; sync(); fxDateienLaden(); } };
  try{ if(ctx.state !== "running") ctx.resume().then(weiter).catch(() => {}); else weiter(); }catch(e){}
}
["pointerdown", "keydown", "touchend", "click"].forEach(ev => addEventListener(ev, entsperren, {capture:true, passive:true}));

function laeuft(){ return !!(ctx && frei && ctx.state === "running" && !document.hidden); }
function spiele(name, vz, erzwingen){
  if(!FX[name] && !FX_DATEI[name]) return 0;
  if(!erzwingen && !E.effekte) return 0;
  if(!laeuft()) return 0;
  const b = FX_PUFFER[name];
  if(b && b.getChannelData){
    try{ LOG.push(name); if(LOG.length > 30) LOG.shift();
      const s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = b; g.gain.value = 0.6; s.connect(g); g.connect(fxBus);
      s.onended = () => { try{ s.disconnect(); g.disconnect(); }catch(e){} };
      s.start(ctx.currentTime + 0.01 + (vz || 0)); return b.duration; }catch(e){ return 0; }
  }
  if(!FX[name]) return 0;
  try{ LOG.push(name); if(LOG.length > 30) LOG.shift(); return FX[name](ctx, fxBus, ctx.currentTime + 0.01 + (vz || 0)); }catch(e){ return 0; }
}

/* Musik: Wunsch (Ort oder andere Welt) und Vorschau (Player auf der Seite «Musik & Töne») */
let wunsch = null, vorschau = null, aktuell = null, quelle = null, quelleGain = null, ladeNr = 0;
function sollStueck(){ return vorschau || (E.musik ? wunsch : null); }
function sync(){
  const soll = sollStueck();
  if(soll === aktuell) return;
  aktuell = soll; melden();
  if(!ctx || !frei) return;
  const t = ctx.currentTime;
  if(quelle){ const q = quelle, g = quelleGain; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0, t + 0.7);
    setTimeout(() => { try{ q.stop(); q.disconnect(); g.disconnect(); }catch(e){} }, 900); quelle = null; quelleGain = null; }
  if(!soll) return;
  const nr = ++ladeNr;
  puffer(soll).then(buf => {
    if(nr !== ladeNr || aktuell !== soll || !ctx) return;
    const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true;
    const g = ctx.createGain(); const t2 = ctx.currentTime; g.gain.setValueAtTime(0, t2); g.gain.linearRampToValueAtTime(buf._gain || 1, t2 + 1.2);
    s.connect(g); g.connect(muBus);
    if(buf._le){ s.loopStart = buf._ls; s.loopEnd = buf._le; s.start(t2 + 0.02, buf._ls); } else s.start(t2 + 0.02);
    quelle = s; quelleGain = g;
  }).catch(e => console.warn("sound: Musik", e));
}
/* Leiser beim Vorlesen; Qeels-Overlay erkennen */
let qeelsAuf = false;
setInterval(() => {
  if(!ctx || !muDuck) return;
  let spricht = false; try{ spricht = !!(window.speechSynthesis && speechSynthesis.speaking); }catch(e){}
  const z = spricht ? 0.15 : 1;
  const q = document.body.classList.contains("reelsauf");
  if(q !== qeelsAuf){ qeelsAuf = q; let sc = ""; try{ sc = S.screen; }catch(e){} if(sc !== "x-sound"){ const m = ortMusik(); if(m !== undefined){ wunsch = m; sync(); } } }
  if(quelle && Math.abs(muDuck.gain.value - z) > 0.01) muDuck.gain.setTargetAtTime(z, ctx.currentTime, 0.25);
}, 400);
/* Tab im Hintergrund: alles pausieren */
document.addEventListener("visibilitychange", () => {
  if(!ctx) return;
  try{ if(document.hidden){ if(ctx.state === "running") ctx.suspend(); } else if(frei) ctx.resume().catch(() => {}); }catch(e){}
});
addEventListener("pagehide", () => { try{ ctx && ctx.suspend(); }catch(e){} });

/* ---------- Öffentliche Schnittstelle ---------- */
let renderLaeuft = false, externerWunsch, letzterOrt = "";
const API = {
  play(name){ if(GROSS.includes(name)){ return gross(name, 0) > 0; } return spiele(name) > 0; },
  musik(name){ name = name && STUECKE[name] ? name : null; if(renderLaeuft) externerWunsch = name; wunsch = name; sync(); },
  an(){ return E.effekte || E.musik; },
  effekteAn(){ return E.effekte; },
  musikAn(){ return E.musik; },
  lautstaerke(){ return E.vol; },
  setze(o){ o = o || {};
    if(typeof o.effekte === "boolean"){ E.effekte = o.effekte; LS.set(K.fx, E.effekte); }
    if(typeof o.musik === "boolean"){ E.musik = o.musik; LS.set(K.mu, E.musik); }
    if(o.lautstaerke != null && isFinite(+o.lautstaerke)){ E.vol = Math.min(1, Math.max(0, +o.lautstaerke)); LS.set(K.vol, Math.round(E.vol * 100) / 100); pegel(); }
    sync(); melden(); },
  stuecke(){ return Object.keys(STUECKE).map(id => ({id, titel: STUECKE[id].titel, text: STUECKE[id].text, emo: STUECKE[id].emo, sekunden: Math.round(stueckLaenge(id) * 10) / 10})); },
  effekte(){ return FX_NAMEN.map(([id, titel, emo]) => ({id, titel, emo})); },
  aktuell(){ return aktuell || null; },
  bereit(){ return laeuft(); },
  /* nur für Tests: Effekt oder Stück offline rendern (Promise → AudioBuffer) */
  _fxRendern(name, sr){ sr = sr || 44100; const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const oc = new OAC(2, Math.ceil(3 * sr), sr); const g = oc.createGain(); g.gain.value = 0.85; g.connect(oc.destination); FX[name](oc, g, 0.01); return oc.startRendering(); },
  _stueckRendern(name, sr){ return stueckRendern(name, sr); },
  _log: LOG
};
window.EP_SOUND = API;

/* ---------- Automatische Töne ---------- */
/* Grosse Töne nicht übereinander: nacheinander einreihen */
const GROSS = ["levelup", "fanfare", "freischalten", "truhe", "fertig", "duellstart", "countdown"];
let grossBis = 0;
function gross(name, mindVz){
  const jetzt = performance.now() / 1000, vz = Math.min(4, Math.max(mindVz || 0, grossBis - jetzt));
  const d = spiele(name, vz); if(d) grossBis = jetzt + vz + Math.min(d, 1.4);
  return d;
}
document.addEventListener("ep:antwort", e => { try{ spiele(e.detail && e.detail.ok ? "richtig" : "falsch"); }catch(x){} });
document.addEventListener("ep:quizende", e => { try{ const d = e.detail || {}; const gut = d.total > 0 && d.richtig * 2 >= d.total; gross(gut ? "fanfare" : "fertig", 0.15); }catch(x){} });
/* Level-Aufstieg (.lvup) und XP-Meldungen (.lvtoast) aus level.js erkennen */
let xpZuletzt = 0;
try{
  new MutationObserver(ms => { ms.forEach(m => m.addedNodes.forEach(n => {
    if(n.nodeType !== 1 || !n.classList) return;
    if(n.classList.contains("lvup")) gross("levelup", 0.35);
    else if(n.classList.contains("lvtoast")){ const j = Date.now(); if(j - xpZuletzt > 8000){ xpZuletzt = j; spiele("xp", 0.05); } }
  })); }).observe(document.body, {childList:true});
}catch(e){}
/* Duell: Antworten laufen über soloTipp */
if(typeof window.soloTipp === "function"){
  const vorTipp = window.soloTipp;
  window.soloTipp = function(i){
    let R = null, vorher = false; try{ R = DU.run; vorher = !!(R && !R.aus); }catch(e){}
    const r = vorTipp.apply(this, arguments);
    try{ if(vorher && R.aus && Array.isArray(R.ant)) spiele(R.ant[R.ant.length - 1] === 1 ? "richtig" : "falsch"); }catch(e){}
    return r;
  };
}
/* Hardcore (eigenes Modul in einer Kapsel): Klick auf eine Antwort auswerten */
document.addEventListener("click", e => {
  const b = e.target && e.target.closest && e.target.closest("[data-hc]"); if(!b || b.disabled) return;
  const i = b.dataset.hc;
  setTimeout(() => { try{ const x = document.querySelector(`[data-hc="${i}"]`); spiele(x && x.classList.contains("right") ? "richtig" : "falsch"); }catch(err){} }, 30);
}, true);
/* Duell auf einem Gerät: jeder Tipp klingt (richtig oder daneben) */
if(typeof window.splitTipp === "function"){
  const vorSplit = window.splitTipp;
  window.splitTipp = function(p, i){
    let D = null, frei = false, f = null; try{ D = DU.split; frei = !!(D && !D.aus && !D.lock[p]); f = D && D.list[D.i]; }catch(e){}
    const r = vorSplit.apply(this, arguments);
    try{ if(frei && f) spiele(i === f.c ? "richtig" : "falsch"); }catch(e){}
    return r;
  };
}
/* Live-Quiz (PIN): Ton, sobald die Auflösung erscheint */
if(typeof window.renderLivePlay === "function"){
  const vorLive = window.renderLivePlay; let liveZuletzt = "";
  window.renderLivePlay = function(){
    const r = vorLive.apply(this, arguments);
    try{ const w = document.querySelector("#app .lwait.good, #app .lwait.bad");
      if(!w){ liveZuletzt = ""; }
      else { const k = w.textContent.slice(0, 200); if(k !== liveZuletzt){ liveZuletzt = k; spiele(w.classList.contains("good") ? "richtig" : "falsch"); } } }catch(e){}
    return r;
  };
}
/* Berufs-Check: kein richtig oder falsch, aber ein Klick */
document.addEventListener("click", e => { try{ if(S.screen === "check" && e.target.closest && e.target.closest(".ans")) spiele("klick"); }catch(x){} }, true);
/* Qeels: Antwort-Knöpfe .ropt bekommen beim Klick sofort .richtig oder .falsch */
document.addEventListener("click", e => {
  const b = e.target && e.target.closest && e.target.closest(".ropt"); if(!b || b.disabled) return;
  setTimeout(() => { if(b.classList.contains("richtig")) spiele("richtig"); else if(b.classList.contains("falsch")) spiele("falsch"); }, 20);
}, true);

/* ---------- Musik je Ort ---------- */
/* Startseite: am Tag «Sonnenschein», von 19 bis 7 Uhr «Zauberlaterne» */
function nachtJetzt(){ const h = new Date().getHours(); return h >= 19 || h < 7; }
setInterval(() => {
  if(wunsch !== "sonnenschein" && wunsch !== "zauberlaterne") return;
  const soll = nachtJetzt() ? "zauberlaterne" : "sonnenschein";
  if(soll !== wunsch){ wunsch = soll; sync(); }
}, 60000);
const OHNE = ["done", "checkdone", "duellende", "duellresultat", "fremddone", "testergebnis"];   // Ergebnis: Platz für die Fanfare
const ORT_QUIZ = ["quiz", "check", "fremdtest", "hardcore"];
const ORT_DUELL = ["duell", "duelllobby", "duellplay", "duellannahme", "duellsplit"];
const ORT_LIVE = ["live", "livequiz", "liveplay", "livehost"];
function ortMusik(){
  let sc = "", lib = false; try{ sc = S.screen || ""; lib = !!S.libModus; }catch(e){ return undefined; }
  if(sc === "x-sound") return undefined;                     // dort wählt der Player
  if(document.body.classList.contains("reelsauf")) return "qeels";
  if(OHNE.includes(sc)) return null;
  if(ORT_QUIZ.includes(sc)) return "quiz";
  if(ORT_DUELL.includes(sc)) return "duell";
  if(ORT_LIVE.includes(sc)) return "live";
  if(sc === "x-abenteuer") return "abenteuer";
  if(sc === "x-feste") return "fest";
  if(lib || sc.startsWith("lib") || sc === "bibliothek") return "bibliothek";
  return nachtJetzt() ? "zauberlaterne" : "sonnenschein";
}
if(typeof window.render === "function"){
  const vorRender = window.render;
  window.render = function(){
    renderLaeuft = true; externerWunsch = undefined;
    let r;
    try{ r = vorRender.apply(this, arguments); }
    finally{
      renderLaeuft = false;
      try{
        let sc = ""; try{ sc = S.screen; }catch(e){}
        if(sc !== "x-sound") vorschau = null;
        if(sc === "duellplay" && letzterOrt !== "duellplay") gross("duellstart", 0);
        letzterOrt = sc;
        if(externerWunsch === undefined){ const m = ortMusik(); if(m !== undefined) wunsch = m; }
        sync();
      }catch(e){}
      try{ platzieren(); }catch(e){}
      requestAnimationFrame(() => { try{ platzieren(); }catch(e){} });
    }
    return r;
  };
}

/* ---------- Ton-Knopf und Menü ---------- */
const SVG_LS = `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M4 9.2v5.6c0 .4.3.7.7.7h3.1l4.4 3.7c.5.4 1.3.1 1.3-.6V5.4c0-.7-.8-1-1.3-.6L7.8 8.5H4.7c-.4 0-.7.3-.7.7z" fill="currentColor"/>`;
const SVG_AN = `<path d="M16.2 9a4.2 4.2 0 0 1 0 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M18.6 6.4a8 8 0 0 1 0 11.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
const SVG_AUS = `<path d="M16.5 9.5l5 5M21.5 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
const SVG_NOTE = `<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path d="M9 17.2V6.6c0-.5.3-.9.8-1l8.4-2c.6-.1 1.2.3 1.2 1v10.6" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 9.2l10.4-2.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><ellipse cx="6.4" cy="17.6" rx="3" ry="2.4" transform="rotate(-18 6.4 17.6)" fill="currentColor"/><ellipse cx="16.8" cy="15.4" rx="3" ry="2.4" transform="rotate(-18 16.8 15.4)" fill="currentColor"/></svg>`;
let knopfEl = null, menuEl = null;
function knopf(){
  if(knopfEl) return knopfEl;
  const b = document.createElement("button"); b.type = "button"; b.className = "xs-knopf";
  b.setAttribute("aria-haspopup", "dialog"); b.setAttribute("aria-expanded", "false"); b.title = "Ton und Musik";
  b.onclick = e => { e.stopPropagation(); if(menuEl) menuZu(); else { menuAuf(); } };
  knopfEl = b; knopfAktuell(); return b;
}
function knopfAktuell(){
  if(!knopfEl) return;
  const html = (E.musik ? SVG_NOTE : SVG_LS + (API.an() ? SVG_AN : SVG_AUS)) + (E.musik ? `<i class="xs-eqk" aria-hidden="true"><b></b><b></b><b></b></i>` : "");
  if(knopfEl._html !== html){ knopfEl._html = html; knopfEl.innerHTML = html; }
  knopfEl.setAttribute("aria-label", `Ton und Musik: Töne ${E.effekte ? "an" : "aus"}, Musik ${E.musik ? "an" : "aus"}`);
  knopfEl.classList.toggle("aus", !API.an()); knopfEl.classList.toggle("musik", !!E.musik);
}
hoerer.add(knopfAktuell);

function schalterHTML(id, label, an){ return `<button type="button" class="xs-schalter" role="switch" aria-checked="${an}" data-xs="${id}"><span>${label}</span><i aria-hidden="true"><b></b></i></button>`; }
function reglerHTML(){ return `<label class="xs-regler"><span>Lautstärke</span><input type="range" min="0" max="100" step="5" value="${Math.round(E.vol * 100)}" data-xs="vol"></label>`; }
function bedienungBinden(root){
  root.querySelectorAll("[data-xs=fx]").forEach(b => b.onclick = () => { API.setze({effekte: !E.effekte}); if(E.effekte){ entsperren(); spiele("klick"); } });
  root.querySelectorAll("[data-xs=mu]").forEach(b => b.onclick = () => { entsperren(); API.setze({musik: !E.musik}); });
  root.querySelectorAll("[data-xs=vol]").forEach(r => { r.oninput = () => API.setze({lautstaerke: r.value / 100}); r.onchange = () => { entsperren(); spiele("tick", 0, true); }; });
}
function bedienungAktuell(root){
  root.querySelectorAll("[data-xs=fx]").forEach(b => b.setAttribute("aria-checked", String(E.effekte)));
  root.querySelectorAll("[data-xs=mu]").forEach(b => b.setAttribute("aria-checked", String(E.musik)));
  root.querySelectorAll("[data-xs=vol]").forEach(r => { if(document.activeElement !== r) r.value = Math.round(E.vol * 100); });
}
function menuAuf(){
  menuZu();
  const m = document.createElement("div"); m.className = "xs-menu"; m.setAttribute("role", "dialog"); m.setAttribute("aria-label", "Ton und Musik");
  m.innerHTML = `<p class="xs-mt"><span class="xs-mti" aria-hidden="true">${SVG_NOTE}</span>Ton & Musik</p>${schalterHTML("fx", "Töne", E.effekte)}${schalterHTML("mu", "Musik", E.musik)}${reglerHTML()}
    <button type="button" class="xs-mehr"><span aria-hidden="true">▶</span> Alle Musikstücke anhören</button>`;
  document.body.appendChild(m); menuEl = m;
  bedienungBinden(m);
  m.querySelector(".xs-mehr").onclick = () => { menuZu(); try{ go("x-sound"); }catch(e){} };
  m.addEventListener("click", e => e.stopPropagation());
  if(knopfEl) knopfEl.setAttribute("aria-expanded", "true");
  menuLage();
  setTimeout(() => { try{ m.querySelector("[data-xs=fx]").focus({preventScroll:true}); }catch(e){} }, 30);
}
function menuZu(zurueck){
  if(!menuEl) return; menuEl.remove(); menuEl = null;
  if(knopfEl){ knopfEl.setAttribute("aria-expanded", "false"); if(zurueck) try{ knopfEl.focus(); }catch(e){} }
}
function menuLage(){
  if(!menuEl || !knopfEl) return;
  if(!knopfEl.isConnected){ menuZu(); return; }
  const r = knopfEl.getBoundingClientRect(), w = menuEl.offsetWidth, hh = menuEl.offsetHeight;
  const links = Math.max(10, Math.min(innerWidth - w - 10, r.right - w));
  let oben = r.bottom + 8; if(oben + hh > innerHeight - 10) oben = Math.max(10, r.top - hh - 8);
  menuEl.style.left = links + "px"; menuEl.style.top = oben + "px";
}
document.addEventListener("click", () => menuZu());
document.addEventListener("keydown", e => { if(e.key === "Escape" && menuEl) menuZu(true); });
addEventListener("resize", () => { menuLage(); platzSpaeter(); setTimeout(platzSpaeter, 350); });
addEventListener("scroll", menuLage, {passive:true});
hoerer.add(() => { if(menuEl) bedienungAktuell(menuEl); document.querySelectorAll(".xs-seite").forEach(bedienungAktuell); });

/* Knopf in die Kopfzeile setzen: App (Gruss neben dem Logo oder Kopfzeile .ap-kz), Computer (#nav neben «Menü») */
function platzieren(){
  const k = knopf(), app = document.getElementById("app");
  const appAn = document.body.classList.contains("ep-app");
  let ort = null, art = "", gr = null;
  if(appAn && app){
    gr = app.querySelector(".ap-gruss"); const kz = app.querySelector(":scope > .ap-kz");
    if(gr && gr.querySelector(".ap-logo") && gr.parentNode){ ort = gr.parentNode; art = "gruss"; } else if(kz){ ort = kz; art = "kz"; }
  } else if(!appAn){
    const nav = document.getElementById("nav"), mw = nav && nav.querySelector(":scope > .menuwrap");
    if(mw && getComputedStyle(nav).display !== "none"){ ort = nav; art = "nav"; }
  }
  if(!ort){ if(k.isConnected) k.remove(); menuZu(); return; }
  k.dataset.ort = art;
  if(art === "nav"){ const mw = ort.querySelector(":scope > .menuwrap"); if(k.parentNode !== ort || k.nextElementSibling !== mw) ort.insertBefore(k, mw); }
  else if(art === "gruss"){ if(k.parentNode !== ort || k.nextElementSibling !== gr) ort.insertBefore(k, gr); }
  else if(k.parentNode !== ort) ort.appendChild(k);
  if(art === "gruss") grussLage(gr, k); else { k.style.left = ""; k.style.top = ""; k.style.visibility = ""; k.classList.remove("unten"); }
  menuLage();
}
/* App-Startseite: links neben dem Logo (als Geschwister von .ap-gruss, damit das Karussell den Knopf nicht überdeckt) */
function grussLage(gr, k){
  const lg = gr.querySelector(".ap-logo");
  const setzen = () => {
    if(!k.isConnected || k.nextElementSibling !== gr) return;
    if(!(lg.complete && lg.naturalWidth)){ k.style.visibility = "hidden"; return; }
    const op = k.offsetParent; if(!op) return;
    const L = lg.getBoundingClientRect(), O = op.getBoundingClientRect();
    const icb = op === document.body && getComputedStyle(op).position === "static";
    const basisX = icb ? -scrollX : O.left + op.clientLeft, basisY = icb ? -scrollY : O.top + op.clientTop;
    const ox = icb ? 0 : op.scrollLeft, oy = icb ? 0 : op.scrollTop;
    const stoesst = () => { const kr = k.getBoundingClientRect(); let st = false;
      gr.querySelectorAll(":scope > b, :scope > span").forEach(el => { const rg = document.createRange(); rg.selectNodeContents(el);
        [...rg.getClientRects()].forEach(r => { if(r.right > kr.left - 4 && r.left < kr.right + 4 && r.bottom > kr.top + 1 && r.top < kr.bottom - 1) st = true; }); });
      return st; };
    const pos = (x, y) => { k.style.left = Math.round(x - basisX + ox) + "px"; k.style.top = Math.round(y - basisY + oy) + "px"; };
    /* 1. mittig neben dem Logo, 2. oben bündig (oder etwas höher) neben dem Logo, 3. (langer Name) klein unter dem Logo */
    k.classList.remove("unten");
    let kw = k.offsetWidth || 40, kh = k.offsetHeight || 40;
    pos(L.left - kw - 8, L.top + (L.height - kh) / 2);
    if(stoesst()) pos(L.left - kw - 6, L.top);
    if(stoesst()) pos(L.left - kw - 6, Math.max(4, L.top - 8));
    if(stoesst()){ k.classList.add("unten"); kw = k.offsetWidth || 34; pos(L.right - kw - 2, L.bottom + 2); }
    k.style.visibility = "";
  };
  setzen();
  if(!(lg.complete && lg.naturalWidth)) lg.addEventListener("load", setzen, {once:true});
  requestAnimationFrame(setzen);
}
/* Die App ersetzt Inhalte auch ohne render() (Tabs): darum #app, #nav und die Body-Klassen beobachten */
let platzPlan = 0;
function platzSpaeter(){ if(platzPlan) return; platzPlan = requestAnimationFrame(() => { platzPlan = 0; try{ platzieren(); }catch(e){} }); }
function beobachten(){
  try{ const mo = new MutationObserver(platzSpaeter);
    ["app", "nav"].forEach(id => { const el = document.getElementById(id); if(el) mo.observe(el, {childList:true}); });
    mo.observe(document.body, {attributes:true, attributeFilter:["class"]}); }catch(e){}
  platzSpaeter();
}
if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", beobachten); else beobachten();

/* ---------- Welt «Musik & Töne» ---------- */
function seiteRender(box, api){
  const h = api && api.h ? api.h : (s => String(s));
  box.innerHTML = `<div class="x-kopf xs-kopf"><span class="x-kopf-emo" aria-hidden="true">🎵</span><div><h1>Musik & Töne</h1><p>Eigene easyplay-Musik und fröhliche Töne</p></div><img src="img/kids/duo-jubel.webp" alt=""></div>
  <div class="xs-seite">
    <section class="xs-karte" aria-label="Einstellungen">${schalterHTML("fx", "Töne", E.effekte)}${schalterHTML("mu", "Musik beim Spielen", E.musik)}${reglerHTML()}</section>
    <h2 class="xs-h2">Musik anhören</h2>
    <div class="xs-stuecke">${Object.keys(STUECKE).map(id => { const st = STUECKE[id];
      return `<button type="button" class="xs-stueck" data-st="${id}" style="background:${st.farbe}" aria-pressed="false">
        <span class="xs-emo" aria-hidden="true">${st.emo}</span><span class="xs-txt"><b>${h(st.titel)}</b><small>${h(st.text)}</small></span>
        <span class="xs-play" aria-hidden="true"></span><span class="xs-eq" aria-hidden="true"><i></i><i></i><i></i></span></button>`; }).join("")}</div>
    <h2 class="xs-h2">Töne ausprobieren</h2>
    <div class="xs-fx">${FX_NAMEN.map(([id, t, emo]) => `<button type="button" class="xs-fxk" data-fx="${id}"><span aria-hidden="true">${emo}</span>${h(t)}</button>`).join("")}</div>
    <p class="xs-hinweis">Alle Musik ist eigens für easyplay komponiert. Musik läuft nur, wenn du sie einschaltest.</p>
  </div>`;
  bedienungBinden(box.querySelector(".xs-seite"));
  const stAktuell = () => box.querySelectorAll("[data-st]").forEach(b => { const an = aktuell === b.dataset.st;
    b.classList.toggle("spielt", an); b.setAttribute("aria-pressed", String(an)); });
  box.querySelectorAll("[data-st]").forEach(b => b.onclick = () => { entsperren();
    const id = b.dataset.st;
    if(aktuell === id){ vorschau = null; wunsch = null; } else vorschau = id;
    sync(); melden(); });
  box.querySelectorAll("[data-fx]").forEach(b => b.onclick = () => { entsperren(); const n = b.dataset.fx;
    if(laeuft()) spiele(n, 0, true); else setTimeout(() => spiele(n, 0, true), 150); });
  const f = () => { if(!box.isConnected){ hoerer.delete(f); return; } stAktuell(); };
  hoerer.add(f); stAktuell();
}
function anmelden(){
  if(!window.EP_EXTRAS || !window.EP_EXTRAS.register) return false;
  window.EP_EXTRAS.register({ id:"sound", titel:"Musik & Töne", text:"Eigene Musik anhören, Töne ausprobieren", emo:"🎵",
    farbe:"linear-gradient(135deg,#0E7C86,#3B5BDB 55%,#7B3FE4)", reihe:90,
    hinweis(){ return E.musik ? "♪ an" : ""; }, render: seiteRender });
  return true;
}
if(!anmelden()) document.addEventListener("DOMContentLoaded", anmelden);

/* ---------- Stil ---------- */
const css = document.createElement("style"); css.id = "ep-x-sound";
css.textContent = `
.xs-knopf{position:relative;flex:none;display:inline-grid;place-items:center;width:44px;height:44px;padding:0;border-radius:50%;border:2px solid rgba(255,255,255,.55);background:rgba(15,20,48,.55);color:#fff;cursor:pointer;box-shadow:0 6px 14px rgba(27,34,64,.25);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);transition:transform .15s}
.xs-knopf:hover{transform:scale(1.06)}
.xs-knopf>*{pointer-events:none}
.xs-knopf:focus-visible{outline:3px solid #FFE34D;outline-offset:2px}
.xs-knopf.aus{opacity:.85}
.xs-knopf.musik{border-color:rgba(255,255,255,.85);background:linear-gradient(135deg,#FF5FA2,#8A3FE0 60%,#4F6BFF);box-shadow:0 6px 16px rgba(138,63,224,.45),inset 0 1px 0 rgba(255,255,255,.35)}
.xs-knopf.musik svg{filter:drop-shadow(0 1px 1px rgba(40,10,80,.35))}
.xs-knopf .xs-eqk{position:absolute;right:-5px;bottom:-4px;display:flex;align-items:flex-end;gap:1.5px;height:16px;padding:2px 3px;border-radius:7px;background:#FFE34D;box-shadow:0 2px 5px rgba(0,0,0,.25)}
.xs-knopf .xs-eqk b{width:2.5px;height:5px;border-radius:2px;background:#5B2BD9;animation:xseq .7s ease-in-out infinite alternate}
.xs-knopf .xs-eqk b:nth-child(2){animation-delay:.2s}.xs-knopf .xs-eqk b:nth-child(3){animation-delay:.4s}
#nav>.xs-knopf.musik{border-color:transparent;color:#fff;background:linear-gradient(135deg,#FF5FA2,#8A3FE0 60%,#4F6BFF)}
@media (prefers-reduced-motion: reduce){.xs-knopf .xs-eqk b{animation:none;height:9px}}
.xs-knopf[data-ort=gruss]{position:absolute;z-index:6;width:38px;height:38px;margin:0}
.xs-knopf[data-ort=gruss].unten{width:34px;height:34px}
.xs-knopf[data-ort=gruss].unten svg{width:18px;height:18px}
.ap-kz>.xs-knopf{margin-left:auto}
#nav>.xs-knopf{width:58px;height:58px;border:2px solid var(--line,#E3E1F2);background:var(--surface,#fff);color:var(--ink,#1B2240);box-shadow:none;backdrop-filter:none;-webkit-backdrop-filter:none}
#nav>.xs-knopf svg{width:26px;height:26px}
@media (min-width:700px){.xs-knopf[data-ort=gruss]:not(.unten){width:48px;height:48px}.xs-knopf[data-ort=gruss]:not(.unten) svg{width:26px;height:26px}}
.xs-menu{position:fixed;z-index:10000;width:min(270px,calc(100vw - 20px));font-size:15px;line-height:1.25;box-sizing:border-box;padding:14px;border-radius:22px;background:rgba(20,24,58,.96);color:#fff;box-shadow:0 18px 40px rgba(10,12,40,.45);display:grid;gap:8px}
.xs-mt{display:flex;align-items:center;gap:8px;margin:0 0 2px;font-weight:800;font-size:1.05rem;color:#fff}
.xs-mti{display:inline-grid;place-items:center;width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#FF5FA2,#8A3FE0);color:#fff}.xs-mti svg{width:18px;height:18px}
.xs-schalter{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;min-height:46px;padding:6px 12px;border:0;border-radius:14px;background:rgba(255,255,255,.12);color:#fff;font:inherit;font-weight:700;cursor:pointer;text-align:left}
.xs-schalter:focus-visible,.xs-mehr:focus-visible,.xs-regler input:focus-visible,.xs-stueck:focus-visible,.xs-fxk:focus-visible{outline:3px solid #FFE34D;outline-offset:2px}
.xs-schalter i{position:relative;flex:none;width:46px;height:26px;border-radius:999px;background:rgba(255,255,255,.3);transition:background .2s}
.xs-schalter i b{position:absolute;left:3px;top:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:left .2s;box-shadow:0 2px 4px rgba(0,0,0,.3)}
.xs-schalter[aria-checked=true] i{background:#17B26A}
.xs-schalter[aria-checked=true] i b{left:23px}
.xs-regler{display:grid;gap:4px;padding:6px 12px 8px;border-radius:14px;background:rgba(255,255,255,.12);font-weight:700;color:#fff}
.xs-regler input{width:100%;accent-color:#FFE34D;margin:4px 0 0;min-height:24px}
.xs-mehr{min-height:44px;font-size:14px!important;border:0;border-radius:14px;background:linear-gradient(135deg,#5B4BF5,#9B4DE0);color:#fff;font:inherit;font-weight:800;cursor:pointer}
.x-kopf.xs-kopf{background:linear-gradient(135deg,#0E7C86,#3B5BDB 55%,#7B3FE4)}
.xs-seite{display:grid;gap:12px;min-width:0}
.xs-karte{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;padding:14px;border-radius:24px;color:#fff;background:linear-gradient(135deg,#3B5BDB,#7B3FE4);box-shadow:0 10px 22px rgba(27,34,64,.22)}
.xs-karte .xs-schalter,.xs-karte .xs-regler{background:rgba(255,255,255,.16)}
.xs-h2{justify-self:start;margin:4px 0 0;padding:6px 14px;border-radius:999px;background:rgba(15,20,48,.55);color:#fff;font-size:1.05rem}
.xs-stuecke{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.xs-stueck{position:relative;display:flex;align-items:center;gap:10px;min-height:92px;padding:14px;border:0;border-radius:24px;color:#fff;text-align:left;cursor:pointer;box-shadow:0 10px 22px rgba(27,34,64,.22);font:inherit;transition:transform .15s}
.xs-stueck:hover{transform:translateY(-2px)}
.xs-stueck .xs-emo{font-size:2rem;line-height:1}
.xs-stueck .xs-txt{display:grid;gap:2px;min-width:0;flex:1}
.xs-stueck b{font-size:1.1rem;color:#fff}
.xs-stueck small{font-size:.82rem;opacity:.95;color:#fff;line-height:1.25}
.xs-play{flex:none;width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.95);position:relative}
.xs-play::after{content:"";position:absolute;left:15px;top:12px;border-left:13px solid #3B2E8C;border-top:8px solid transparent;border-bottom:8px solid transparent}
.xs-stueck.spielt .xs-play::after{left:13px;top:13px;width:14px;height:14px;border:0;background:#3B2E8C;border-radius:3px}
.xs-eq{position:absolute;left:14px;bottom:8px;display:none;gap:3px;align-items:flex-end;height:12px}
.xs-eq i{width:4px;height:5px;border-radius:2px;background:#fff;animation:xseq .8s ease-in-out infinite alternate}
.xs-eq i:nth-child(2){animation-delay:.25s}.xs-eq i:nth-child(3){animation-delay:.5s}
.xs-stueck.spielt .xs-eq{display:flex}
.xs-stueck.spielt{box-shadow:0 0 0 3px #fff inset,0 10px 22px rgba(27,34,64,.22)}
@keyframes xseq{from{height:3px}to{height:12px}}
@media (prefers-reduced-motion: reduce){.xs-eq i{animation:none;height:9px}.xs-stueck,.xs-knopf,.xs-fxk{transition:none}}
.xs-fx{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}
.xs-fxk{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-height:74px;padding:8px 4px;border:0;border-radius:20px;color:#fff;font:inherit;font-weight:800;font-size:.9rem;cursor:pointer;background:linear-gradient(135deg,#5B4BF5,#9B4DE0);box-shadow:0 8px 18px rgba(27,34,64,.2);transition:transform .1s;min-width:0}
.xs-fxk span{font-size:1.5rem;line-height:1}
.xs-fxk:active{transform:scale(.95)}
.xs-fxk:nth-child(3n+2){background:linear-gradient(135deg,#0FA968,#0B6E6A)}
.xs-fxk:nth-child(3n){background:linear-gradient(135deg,#FF8A00,#F5487F)}
.xs-hinweis{margin:0;justify-self:start;padding:8px 14px;border-radius:16px;background:rgba(15,20,48,.55);color:#fff;font-size:.85rem}
@media (max-width:900px){.xs-stuecke{grid-template-columns:1fr 1fr}.xs-fx{grid-template-columns:repeat(4,minmax(0,1fr))}}
@media (max-width:560px){
  .xs-seite{gap:9px}
  .xs-karte{grid-template-columns:1fr 1fr;gap:8px;padding:10px;border-radius:20px}
  .xs-karte .xs-regler{grid-column:1/-1;grid-template-columns:auto 1fr;align-items:center;gap:12px;padding:6px 12px}
  .xs-karte .xs-regler input{margin:0}
  .x-kopf.xs-kopf{min-height:0;padding:12px 14px;margin:2px 0 8px}
  .x-kopf.xs-kopf p{display:none}
  .x-kopf.xs-kopf h1{font-size:1.35rem}
  .x-kopf.xs-kopf img{max-height:78px}
  .xs-karte .xs-schalter{min-height:42px;font-size:.88rem;padding:6px 8px}
  .xs-stuecke{gap:8px}
  .xs-stueck{min-height:66px;padding:10px;gap:8px;border-radius:20px}
  .xs-stueck .xs-emo{display:none}
  .xs-stueck b{font-size:.95rem}.xs-stueck small{font-size:.72rem}
  .xs-play{width:34px;height:34px}.xs-play::after{left:13px;top:10px;border-left-width:11px;border-top-width:7px;border-bottom-width:7px}
  .xs-stueck.spielt .xs-play::after{left:11px;top:11px;width:12px;height:12px}
  .xs-fx{gap:7px}
  .xs-fxk{min-height:56px;font-size:.74rem;border-radius:16px}
  .xs-fxk span{font-size:1.25rem}
  .xs-h2{font-size:.95rem;padding:4px 12px}
  .xs-hinweis{font-size:.76rem}
}
`;
document.head.appendChild(css);
})();
