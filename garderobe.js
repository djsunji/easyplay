/* easyplay: Profil verzieren und Profilseite (ersetzt die frühere Garderobe, Dateiname bleibt für Speicher und Verweise)
   - Jedes Profil hat eine eigene Seite: Kopf mit Hintergrund, Rahmen ums Profilbild, Stickern, Effekt, Titel und Vitrine
     (ausgewählte Abzeichen), dazu Zahlen: Fragen beantwortet, Tests, Artikel gelesen, Level, Serie, Abzeichen.
   - Eigene Seite: Bildschirm «profil» (renderProfil), fremde Seite: «spieler» (renderSpieler, aus der Rangliste).
   - Verzierungen schaltet man frei über Level, Serie, Truhe, gelesene Artikel, beantwortete Fragen und Tests.
     Wer früher Garderobe-Teile hatte, behält sie: Kopf, Brille und Hals werden Sticker, Rahmen und Effekte bleiben.
   - Gelesene Artikel: eine Bibliotheksseite mit Text, die mindestens 12 Sekunden offen ist, zählt einmal (+5 XP).
   Schnittstellen: window.EP_GARDEROBE (teilGeben, anzahl, teile, neu, aktuell) für Truhe, Abenteuer, Eltern;
                   window.EP_PROFIL (gelesen, zahlen, deko, oeffentlich, kopfHTML)
   Speicher: ep-x-profil-deko, ep-x-gelesen, ep-x-garderobe-truhe, -gesehen, -gemeldet, -rekord, ep-x-profil-reiter (alt: -an) */
(function(){
"use strict";

const LS = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};
const K = { deko:"ep-x-profil-deko", gelesen:"ep-x-gelesen", an:"ep-x-garderobe-an", truhe:"ep-x-garderobe-truhe", gesehen:"ep-x-garderobe-gesehen",
  gemeldet:"ep-x-garderobe-gemeldet", rekord:"ep-x-garderobe-rekord", reiter:"ep-x-profil-reiter" };
const h = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const zahl = n => (+n || 0).toLocaleString("de-CH");
const ton = n => { try{ window.EP_SOUND && window.EP_SOUND.play(n); }catch(e){} };
const svgUrl = s => `url('data:image/svg+xml,${encodeURIComponent(s)}')`;

/* ---------- Katalog ----------
   frei: {start} | {level} | {serie} | {truhe, level} | {artikel} | {fragen} | {tests} */
const BERGE = svgUrl('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120" preserveAspectRatio="none"><path d="M0 120 L0 80 L60 40 L95 65 L150 15 L205 70 L250 35 L310 80 L350 55 L400 85 L400 120Z" fill="#5B7A99"/><path d="M150 15 L170 33 L160 31 L150 40 L138 30 L131 31Z M250 35 L265 48 L240 47Z" fill="#fff"/><path d="M0 120 L0 100 L80 70 L160 100 L240 75 L320 100 L400 85 L400 120Z" fill="#2F8F4E"/></svg>');
const KREUZE = svgUrl('<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><path d="M24 14h12v10h10v12H36v10H24V36H14V24h10z" fill="#fff" fill-opacity=".16"/></svg>');
const HG = [
  ["hg_lila",       "Lila Traum",     "💜", {start:1}, "linear-gradient(135deg,#E043B8,#8A3FE0 55%,#3D5AFE)"],
  ["hg_ozean",      "Ozean",          "🌊", {start:1}, "linear-gradient(160deg,#0B7E8A,#1E9BE0 55%,#3D5AFE)", "wellen"],
  ["hg_abend",      "Abendrot",       "🌇", {level:4}, "linear-gradient(160deg,#FF8A3D,#E043B8 60%,#6B2BB5)"],
  ["hg_wald",       "Wald",           "🌲", {serie:3}, "linear-gradient(170deg,#0FA968,#0B6E4F 60%,#08402F)"],
  ["hg_alpen",      "Alpen",          "🏔️", {level:8}, `${BERGE} bottom/100% 55% no-repeat, linear-gradient(180deg,#5FB8F0,#BFE9FF)`, "wolken"],
  ["hg_schweiz",    "Schweiz",        "🇨🇭", {level:12}, `${KREUZE}, linear-gradient(160deg,#E8384F,#B5121B)`],
  ["hg_weltall",    "Weltall",        "🌌", {level:16}, "radial-gradient(circle at 20% 30%,#fff 0 1px,transparent 2px) 0 0/60px 60px, radial-gradient(circle at 70% 70%,#fff 0 1px,transparent 2px) 0 0/90px 90px, radial-gradient(circle at 80% 20%,#B98CFF55,transparent 40%), linear-gradient(160deg,#0B1030,#2A1B5E)", "funkeln"],
  ["hg_bibliothek", "Bibliothek",     "📚", {artikel:25}, "repeating-linear-gradient(90deg,#8A3F2A 0 14px,#B5652E 14px 26px,#2F6E8A 26px 38px,#E0A800 38px 46px,#5B2BB5 46px 60px) bottom/100% 38% no-repeat, linear-gradient(180deg,#5A3A22,#3B2414)"],
  ["hg_nordlicht",  "Nordlicht",      "🌠", {level:28}, "linear-gradient(160deg,#081C3A,#0FA968 42%,#3FB6C9 62%,#6B2BB5)", "fliessen"],
  ["hg_gold",       "Goldglanz",      "🏆", {tests:25}, "linear-gradient(135deg,#8A5A00,#E0A800 40%,#FFE680 55%,#C68346)"],
  ["hg_regenbogen", "Regenbogen",     "🌈", {serie:30}, "linear-gradient(135deg,#FF6FA8,#FFB347 22%,#FFE34D 40%,#7BE07B 58%,#7FD1FF 76%,#B98CFF)", "fliessen"],
  ["hg_wissen",     "Wissensnebel",   "🧠", {fragen:5000}, "radial-gradient(circle at 30% 40%,#FF6FA8aa,transparent 45%), radial-gradient(circle at 75% 60%,#7FD1FFaa,transparent 45%), linear-gradient(160deg,#2A1B5E,#5B2BB5)"],
  ["hg_konfetti",   "Konfetti",       "🎉", {truhe:1, level:60}, "radial-gradient(circle,#FFE34D 0 3px,transparent 4px) 0 0/40px 40px, radial-gradient(circle,#7FD1FF 0 3px,transparent 4px) 20px 20px/40px 40px, radial-gradient(circle,#FF6FA8 0 2px,transparent 3px) 10px 30px/50px 50px, linear-gradient(135deg,#8A3FE0,#3D5AFE)"],
  // bewegte Hintergründe als besondere Belohnung
  ["hg_wolkenzug",  "Ziehende Wolken", "☁️", {serie:14}, "linear-gradient(180deg,#5FB8F0,#BFE9FF)", "wolken"],
  ["hg_lava",       "Lavalampe",       "🫠", {serie:60}, "radial-gradient(circle at 30% 30%,#FF6FA8,transparent 35%), radial-gradient(circle at 70% 70%,#FFB347,transparent 35%), radial-gradient(circle at 60% 25%,#B98CFF,transparent 30%), linear-gradient(160deg,#6B2BB5,#E043B8)", "lava"],
  ["hg_feuerwerk",  "Feuerwerk",       "🎆", {serie:100}, "linear-gradient(180deg,#0B1030,#2A1B5E)", "feuerwerk"],
  ["hg_schnee",     "Schneegestöber",  "🌨️", {artikel:250}, "linear-gradient(180deg,#5B7A99,#A9C4DE)", "schnee"],
  ["hg_polar",      "Tanzende Polarlichter","🌌", {tests:250}, "linear-gradient(120deg,#081C3A,#0FA968,#3FB6C9,#B98CFF,#E043B8,#0FA968,#081C3A)", "fliessen"],
  ["hg_strudel",    "Zeitstrudel",     "🌀", {artikel:1000}, "conic-gradient(from 0deg,#3D5AFE,#E043B8,#FFE34D,#0FA968,#3D5AFE)", "drehen"],
  ["hg_farbwelle",  "Farbwelle",       "🎨", {fragen:10000}, "linear-gradient(90deg,#FF6FA8,#FFB347,#FFE34D,#7BE07B,#7FD1FF,#B98CFF,#FF6FA8,#FFB347)", "fliessen"],
  // hohe Level: alle 50 Level etwas Neues
  ["hg_vulkan",     "Vulkan",         "🌋", {level:100}, "radial-gradient(ellipse at 50% 100%,#FFB347,#E8384F 30%,transparent 60%), linear-gradient(180deg,#2B0F1E,#5A1A1A 60%,#1B0A0A)", "gluehen"],
  ["hg_tiefsee",    "Tiefsee",        "🐋", {level:300}, "radial-gradient(circle at 25% 75%,#7FD1FF33 0 6px,transparent 7px) 0 0/70px 70px, radial-gradient(ellipse at 50% 0%,#3FB6C980,transparent 60%), linear-gradient(180deg,#0B3D91,#061A40 70%,#020A1C)", "blasen"],
  ["hg_galaxie",    "Galaxie",        "🌀", {level:500}, "radial-gradient(circle,#fff 0 1px,transparent 2px) 0 0/50px 50px, conic-gradient(from 200deg at 55% 50%,#0B1030,#E043B8,#3D5AFE,#0B1030,#7FD1FF,#0B1030)", "drehen"],
  ["hg_kristall",   "Kristallhöhle",  "💠", {level:700}, "conic-gradient(from 30deg at 30% 60%,#7FD1FF,#B98CFF,#3FB6C9,#E6FBFF,#5B8CFF,#7FD1FF), linear-gradient(#000,#000)"],
  ["hg_sonne",      "Sonnenkrone",    "☀️", {level:900}, "repeating-conic-gradient(from 0deg at 50% 45%,#FFE34D 0 10deg,#FFB347 10deg 20deg), radial-gradient(circle,#fff,#FFE34D)", "strahlen"],
  ["hg_krone",      "Krone des Wissens","👑", {level:1000}, "radial-gradient(circle at 50% 40%,#FFF4C2,#E0A800 35%,transparent 60%), repeating-linear-gradient(45deg,#4B2A9B 0 18px,#5B2BB5 18px 36px)", "glanz"]
];
const RA = [
  ["ohne",       "Ohne Rahmen",     "⭕", {start:1}, "transparent"],
  ["himmel",     "Himmel",          "☁️", {start:1}, "linear-gradient(160deg,#BFE9FF,#3D8BFE)"],
  ["berge",      "Berge",           "⛰️", {level:3}, "linear-gradient(180deg,#D9E2EC,#7C8EA3 50%,#2F8F4E)"],
  ["abend",      "Abendrot",        "🌇", {level:6}, "linear-gradient(160deg,#FFB347,#E043B8)"],
  ["schweiz",    "Schweizer Fahne", "🇨🇭", {level:7}, "repeating-conic-gradient(#E8384F 0 45deg,#fff 0 90deg)"],
  ["regenbogen", "Regenbogen",      "🌈", {serie:5}, "conic-gradient(#FF6FA8,#FFB347,#FFE34D,#7BE07B,#7FD1FF,#B98CFF,#FF6FA8)"],
  ["sterne",     "Sternennacht",    "🌌", {level:18}, "radial-gradient(circle,#fff 0 1px,transparent 2px) 0 0/12px 12px, linear-gradient(160deg,#0B1030,#5B2BB5)"],
  ["buecher",    "Bücherwurm",      "📖", {artikel:250}, "repeating-conic-gradient(#8A3F2A 0 20deg,#E0A800 0 40deg,#2F6E8A 0 60deg)"],
  ["gold",       "Goldrahmen",      "🖼️", {level:40}, "conic-gradient(#8A5A00,#FFE680,#E0A800,#FFF4C2,#C68346,#FFE680,#8A5A00)"],
  ["diamant",    "Diamant",         "💎", {tests:100}, "conic-gradient(#E6FBFF,#5B8CFF,#E6FBFF,#3FB6C9,#E6FBFF,#B98CFF,#E6FBFF)"],
  ["wiese",      "Blumenwiese",     "🌷", {truhe:1, level:65}, "linear-gradient(160deg,#FF6FA8,#7BE07B)"],
  ["meer",       "Unterwasser",     "🐠", {truhe:1, level:75}, "linear-gradient(160deg,#3FB6C9,#0B3D91)"],
  ["feuer",      "Feuerring",       "🔥", {level:150}, "conic-gradient(#FFE34D,#FF8A3D,#E8384F,#FF8A3D,#FFE34D,#E8384F,#FFE34D)"],
  ["gletscher",  "Gletscher",       "🧊", {level:350}, "conic-gradient(#fff,#BFE9FF,#7FD1FF,#fff,#3FB6C9,#BFE9FF,#fff)"],
  ["smaragd",    "Smaragd",         "💚", {level:550}, "conic-gradient(#0B6E4F,#7BE07B,#0FA968,#E6FFE6,#0B6E4F,#7BE07B,#0B6E4F)"],
  ["plasma",     "Plasma",          "🟣", {level:750}, "conic-gradient(#E043B8,#3D5AFE,#7FD1FF,#B98CFF,#E043B8,#3D5AFE,#E043B8)"],
  ["rubin",      "Rubin",           "❤️", {level:950}, "conic-gradient(#7A0019,#FF6FA8,#E8384F,#FFD6E0,#B5121B,#FF6FA8,#7A0019)"]
];
const ST = [
  // frühere Garderobe: Kopf, Brille, Hals
  ["muetze","Wollmütze","🧶",{start:1}], ["kappe","Kappe","🧢",{start:1}], ["schleife","Schleife","🎀",{start:1}], ["zipfel","Zipfelmütze","🧝",{level:3}],
  ["helm","Velohelm","🚲",{level:5}], ["krone","Krone","👑",{level:8}], ["blumen","Blumenkranz","🌼",{serie:3}], ["zauber","Zauberhut","🪄",{level:12}],
  ["kopfhoerer","Kopfhörer","🎧",{level:20}], ["edelweiss","Edelweiss","🏔️",{level:30}], ["partyhut","Partyhut","🥳",{truhe:1, level:60}], ["katzenohren","Katze","🐱",{truhe:1, level:70}],
  ["rund","Runde Brille","👓",{start:1}], ["sonne","Sonnenbrille","🕶️",{level:2}], ["herzbrille","Herzaugen","😍",{serie:7}], ["sternbrille","Stern","⭐",{truhe:1, level:45}],
  ["ski","Skifahrer","⛷️",{level:15}], ["pixel","Cool","😎",{truhe:1, level:55}], ["fliege","Fliege","🎀",{start:1}], ["schal","Schal","🧣",{level:4}],
  ["medaille","Goldmedaille","🥇",{level:10}], ["halstuch","Cowboy","🤠",{serie:14}], ["kette","Perlenkette","📿",{truhe:1, level:50}], ["glocke","Kuhglocke","🔔",{level:25}],
  // neu: für Lesen, Fragen und Tests
  ["buch","Buch","📚",{artikel:5}], ["eule","Eule","🦉",{artikel:50}], ["lupe","Lupe","🔎",{artikel:100}], ["globus","Globus","🌍",{artikel:500}],
  ["rakete","Rakete","🚀",{fragen:500}], ["gehirn","Gehirn","🧠",{fragen:2500}], ["blitz","Blitz","⚡",{fragen:10000}],
  ["pokal","Pokal","🏆",{tests:10}], ["diplom","Diplom","🎓",{tests:50}], ["einhorn","Einhorn","🦄",{tests:250}],
  ["drache","Drache","🐉",{level:200}], ["adler","Adler","🦅",{level:400}], ["komet","Komet","☄️",{level:600}], ["planet","Planet","🪐",{level:800}],
];
const EF = [
  ["kein",       "Kein Effekt",     "▫️", {start:1}, ""],
  ["funkeln",    "Funkeln",         "✨", {level:5}, "✨"],
  ["herzen",     "Herzchen",        "💕", {serie:10}, "💗"],
  ["noten",      "Musiknoten",      "🎵", {level:35}, "🎵"],
  ["sternkreis", "Sternschnuppen",  "💫", {level:50}, "💫"],
  ["seiten",     "Fliegende Seiten","📄", {artikel:100}, "📄"],
  ["fragezeichen","Fragezeichen",   "❓", {fragen:1000}, "❓"],
  ["schnee",     "Schneeflocken",   "❄️", {truhe:1, level:80}, "❄️"],
  ["blasen",     "Seifenblasen",    "🫧", {truhe:1, level:85}, "🫧"],
  ["flammen",    "Flammen",         "🔥", {level:250}, "🔥"],
  ["blitze",     "Blitze",          "⚡", {level:450}, "⚡"],
  ["diamanten",  "Diamantenregen",  "💎", {level:650}, "💎"],
  ["sternregen", "Sternenregen",    "🌟", {level:850}, "🌟"]
];
const TEILE = [
  ...HG.map(([id, name, emo, frei, css, anim]) => ({id, kat:"hg", name, emo, frei, css, anim})),
  ...RA.map(([id, name, emo, frei, css]) => ({id, kat:"rahmen", name, emo, frei, css})),
  ...ST.map(([id, name, emo, frei]) => ({id, kat:"sticker", name, emo, frei})),
  ...EF.map(([id, name, emo, frei, z]) => ({id, kat:"effekt", name, emo, frei, z}))
];
const TEIL = Object.fromEntries(TEILE.map(t => [t.id, t]));
const KATS = [["hg", "Hinter\u00ADgrund", "🖼️"], ["rahmen", "Rahmen", "⭕"], ["sticker", "Sticker", "🦉"], ["effekt", "Effekt", "✨"], ["titel", "Titel", "🏷️"], ["vitrine", "Vitrine", "🏅"]];
const MAX_STICKER = 4, MAX_VITRINE = 3;

/* ---------- Zahlen ---------- */
let GEL = null;
function gelesenListe(){ if(!GEL){ const l = LS.get(K.gelesen, []); GEL = Array.isArray(l) ? l : []; } return GEL; }
addEventListener("storage", e => { if(e.key === K.gelesen) GEL = null; });
const gelesen = () => gelesenListe().length;
function zahlen(){
  const st = Object.assign({trainFragen:0, testFragen:0, testRuns:0}, (typeof S !== "undefined" && S.stats) || {});
  let level = 1, serie = 0, ab = 0, abAlle = 0;
  try{ level = window.EP_LEVEL.stand().level || 1; }catch(e){}
  try{ const s = window.EP_LERNEN.serie(); serie = Math.max(+s.n || 0, +s.best || 0); }catch(e){}
  try{ const x = window.EP_START.abzeichenZahl(); ab = x.hat; abAlle = x.alle; }catch(e){ try{ window.EP_LEVEL.familien().forEach(f => { ab += f.stufe; abAlle += f.grenzen.length; }); }catch(e2){} }
  return {fragen:(+st.trainFragen || 0) + (+st.testFragen || 0), tests:+st.testRuns || 0, artikel:gelesen(), level, serie, abzeichen:ab, abzeichenAlle:abAlle};
}
function stand(){
  const z = zahlen();
  const r = LS.get(K.rekord, null) || {level:1, serie:0};
  if(z.level > (r.level || 0) || z.serie > (r.serie || 0)){ r.level = Math.max(z.level, r.level || 0); r.serie = Math.max(z.serie, r.serie || 0); LS.set(K.rekord, r); }
  return {...z, level:Math.max(z.level, r.level || 1), serie:Math.max(z.serie, r.serie || 0)};
}
const truheListe = () => { const l = LS.get(K.truhe, []); return Array.isArray(l) ? l : []; };
function hat(t, st){
  st = st || stand(); const f = t.frei || {};
  if(f.start) return true;
  if(truheListe().includes(t.id)) return true;
  if(f.level && st.level >= f.level) return true;
  if(f.serie && st.serie >= f.serie) return true;
  if(f.artikel && st.artikel >= f.artikel) return true;
  if(f.fragen && st.fragen >= f.fragen) return true;
  if(f.tests && st.tests >= f.tests) return true;
  return false;
}
function wieText(t){
  const f = t.frei || {};
  if(f.start) return "Von Anfang an";
  if(f.truhe) return f.level ? `Aus der Truhe oder ab Level ${f.level}` : "Aus der Truhe";
  if(f.serie) return `Ab ${f.serie} Tagen Serie`;
  if(f.level) return `Ab Level ${f.level}`;
  if(f.artikel) return `${zahl(f.artikel)} Artikel gelesen`;
  if(f.fragen) return `${zahl(f.fragen)} Fragen beantwortet`;
  if(f.tests) return `${zahl(f.tests)} Tests gemacht`;
  return "";
}
// Fortschritt zu einem gesperrten Teil (0..1), für «Nächste Belohnungen»
function fortschritt(t, st){ const f = t.frei || {}; const [feld, ziel] = f.artikel ? ["artikel", f.artikel] : f.fragen ? ["fragen", f.fragen] : f.tests ? ["tests", f.tests] : f.serie ? ["serie", f.serie] : f.level ? ["level", f.level] : [null, 0];
  return feld ? {wert:st[feld], ziel, anteil:Math.min(1, st[feld] / ziel), feld} : null; }

/* ---------- Gewählte Verzierung ---------- */
function titelListe(level){ try{ return (window.EP_LEVEL.TITEL || []).filter(t => level >= t[0]); }catch(e){ return []; } }
function famListe(){ try{ return window.EP_LEVEL.familien(); }catch(e){ return []; } }
function rohDeko(){
  let d = LS.get(K.deko, null);
  if(!d || typeof d !== "object"){ // Übernahme aus der Garderobe
    const a = LS.get(K.an, {}) || {};
    d = {hg:"hg_lila", rahmen:a.rahmen || "himmel", effekt:a.effekt || "kein", sticker:[a.kopf, a.brille, a.hals].filter(Boolean), titel:"", vitrine:[]};
    LS.set(K.deko, d);
  }
  return d;
}
function deko(){
  const d = rohDeko(), st = stand(), ok = (id, kat) => { const t = TEIL[id]; return t && t.kat === kat && hat(t, st); };
  const titel = titelListe(st.level), fam = famListe().filter(f => f.stufe > 0);
  return {
    hg: ok(d.hg, "hg") ? d.hg : "hg_lila",
    rahmen: ok(d.rahmen, "rahmen") ? d.rahmen : "himmel",
    effekt: ok(d.effekt, "effekt") ? d.effekt : "kein",
    sticker: (Array.isArray(d.sticker) ? d.sticker : []).filter(id => ok(id, "sticker")).slice(0, MAX_STICKER),
    titel: titel.some(t => t[2] === d.titel) ? d.titel : (titel.length ? titel[titel.length - 1][2] : ""),
    vitrine: (Array.isArray(d.vitrine) && (d.vitrine.length || d.vitrineGewaehlt) ? d.vitrine.filter(id => fam.some(f => f.id === id)) : fam.slice().sort((a, b) => b.stufe - a.stufe).map(f => f.id)).slice(0, MAX_VITRINE)
  };
}
function dekoSetzen(teil){ const d = {...rohDeko(), ...teil}; LS.set(K.deko, d); veroeffentlichen(); }

/* Was andere sehen dürfen (geht mit dem Profil in die Rangliste): nur Ids und Zahlen */
function oeffentlich(){
  const d = deko(), z = stand(), fam = famListe();
  return { deko:{hg:d.hg, ra:d.rahmen, ef:d.effekt, st:d.sticker, ti:d.titel, vi:d.vitrine.map(id => { const f = fam.find(x => x.id === id); return f ? id + ":" + f.stufe : null; }).filter(Boolean)},
    zahlen:{f:z.fragen, t:z.tests, a:z.artikel, l:z.level, s:z.serie, ab:z.abzeichen} };
}
let pubT = null, zuletztGesendet = "";
function veroeffentlichen(){
  clearTimeout(pubT);
  pubT = setTimeout(() => { try{
    if(typeof S === "undefined" || !S.profil) return;
    const o = oeffentlich(); S.profil.deko = o.deko; S.profil.zahlen = o.zahlen;
    const sig = JSON.stringify(o); if(sig === zuletztGesendet) return; zuletztGesendet = sig;   // nur bei echter Änderung schreiben
    if(S.online && S.db && S.uid && typeof oeffentlichesProfil === "function"){ const pr = S.db.doc(`spieler/${S.uid}`).set(oeffentlichesProfil(S.profil)); if(pr && pr.catch) pr.catch(() => {}); }
  }catch(e){} }, 1500);
}

/* ---------- Profilkopf ---------- */
const SPOTS = [["9%","15%",-12], ["89%","13%",10], ["10%","72%",8], ["89%","70%",-9]];
function effektHTML(id){
  const t = TEIL[id]; if(!t || !t.z) return "";
  return `<div class="pp-eff" aria-hidden="true">${Array.from({length:12}, (_, i) => `<i style="left:${(i * 37 + 7) % 96}%;--d:${((i * .63) % 4.2).toFixed(2)}s;--t:${(3.4 + (i % 4) * .7).toFixed(1)}s;--g:${.8 + (i % 3) * .25}">${t.z}</i>`).join("")}</div>`;
}
/* p: {name, avatar, kanton, deko:{hg,ra,ef,st,ti,vi}, zahlen:{f,t,a,l,s,ab}}; ich: eigenes Profil (Knopf zum Verzieren) */
function kopfHTML(p, ich){
  const d = p.deko || {}, z = p.zahlen || {};
  const hgT = TEIL[d.hg] && TEIL[d.hg].kat === "hg" ? TEIL[d.hg] : TEIL.hg_lila, hg = hgT.css;
  const ra = TEIL[d.ra] && TEIL[d.ra].kat === "rahmen" ? TEIL[d.ra] : TEIL.himmel;
  let av = ""; try{ av = avatar(p.avatar); }catch(e){}
  let ti = null; try{ ti = (window.EP_LEVEL.TITEL || []).find(t => t[2] === d.ti) || null; }catch(e){}
  let kt = ""; try{ if(p.kanton){ const k = KANTONE.find(x => x.kuerzel === p.kanton); kt = `${wappen(p.kanton)} ${h(k ? k.kurz : p.kanton)}`; } }catch(e){}
  const st = (Array.isArray(d.st) ? d.st : []).slice(0, MAX_STICKER).map(id => TEIL[id]).filter(t => t && t.kat === "sticker");
  return `<section class="pp-kopf${hgT.anim ? " pa pa-" + hgT.anim : ""}" style="background:${hg}">
    ${effektHTML(d.ef)}
    ${st.map((t, i) => `<span class="pp-st" style="left:${SPOTS[i][0]};top:${SPOTS[i][1]};--r:${SPOTS[i][2]}deg" title="${h(t.name)}" aria-hidden="true">${t.emo}</span>`).join("")}
    <div class="pp-mitte">
      <div class="pp-av${ra.id === "ohne" ? " ohne" : ""}" style="--ra:${ra.css}"><span class="pp-avbild">${av}</span></div>
      <h1 class="pp-name">${h(p.name || "")}</h1>
      <p class="pp-unter">${ti ? `<span class="pp-titel" style="--tf:${ti[3]}">${ti[1]} ${h(ti[2])}</span>` : ""}<span>Level ${zahl(z.l || 1)}</span>${kt ? `<span>${kt}</span>` : ""}</p>
      ${ich ? `<button type="button" class="pp-knopf" id="ppVerzieren">🎨 Profil verzieren</button>` : ""}
    </div>
  </section>`;
}
function zahlenHTML(z){
  const k = [["❓", z.f, "Fragen beantwortet"], ["📝", z.t, "Tests gemacht"], ["📚", z.a, "Artikel gelesen"], ["⭐", z.l, "Level"], ["🔥", z.s, "Tage Serie (Rekord)"], ["🏅", z.ab, "Abzeichen"]];
  return `<div class="pp-zahlen">${k.map(([e, n, t]) => `<div class="pp-zahl"><span aria-hidden="true">${e}</span><b>${zahl(n)}</b><small>${t}</small></div>`).join("")}</div>`;
}
function vitrineHTML(vi, ich){
  const fam = famListe(), stufen = (window.EP_LEVEL && window.EP_LEVEL.STUFEN) || [];
  const l = (vi || []).map(x => { const [id, s] = String(x).split(":"); const f = fam.find(y => y.id === id); return f ? {f, s:Math.max(1, Math.min(+s || 1, stufen.length || 6))} : null; }).filter(Boolean);
  if(!l.length) return ich ? `<section class="pp-vitrine leer"><h2>🏅 Vitrine</h2><p>Hier zeigst du deine besten Abzeichen. Lies Artikel, beantworte Fragen und mach Tests, dann kommen die ersten.</p></section>` : "";
  return `<section class="pp-vitrine"><h2>🏅 Vitrine</h2><div class="pp-vit">${l.map(({f, s}) => { const st = stufen[s - 1] || ["", "#E0A800"];
    return `<div class="pp-med" style="--mf:${st[1]}"><span>${f.emo}</span><b>${h(f.name)}</b><small>${h(st[0])}</small></div>`; }).join("")}</div></section>`;
}
function naechsteHTML(){
  const st = stand();
  const l = TEILE.filter(t => !hat(t, st) && !t.frei.truhe).map(t => ({t, p:fortschritt(t, st)})).filter(x => x.p && x.p.feld !== "level")
    .sort((a, b) => b.p.anteil - a.p.anteil).slice(0, 3);
  if(!l.length) return "";
  return `<section class="pp-naechst"><h2>🎁 Nächste Belohnungen</h2>${l.map(({t, p}) => `<div class="pp-nz"><span class="pp-ne">${t.emo}</span><span class="pp-nt"><b>${h(t.name)}</b> <small>${h(KATS.find(k => k[0] === t.kat)[1])} · ${h(wieText(t))}</small>
    <span class="pp-bar"><i style="width:${Math.round(p.anteil * 100)}%"></i></span></span><span class="pp-nw">${zahl(p.wert)} / ${zahl(p.ziel)}</span></div>`).join("")}</section>`;
}
function eigenesProfil(){ const p = (typeof S !== "undefined" && S.profil) || {}; const o = oeffentlich(); return {...p, deko:o.deko, zahlen:o.zahlen}; }

/* ---------- Gelesene Artikel zählen ---------- */
const LESE_S = 12;
let lese = {k:null, s:0};
function aktuelleSeite(){
  try{ if(typeof S === "undefined" || S.screen !== "libseite" || !LIB.buch) return null;
    const s = buchDaten(LIB.buch).seiten.find(x => x.nr === LIB.seite); if(!s || s.typ === "art") return null;
    const k = seiteKey(s); return S.texte && S.texte[k] ? k : null; }catch(e){ return null; }
}
setInterval(() => {
  if(document.visibilityState !== "visible") return;
  const k = aktuelleSeite(); if(!k){ lese = {k:null, s:0}; return; }
  if(lese.k !== k) lese = {k, s:0};
  if(++lese.s !== LESE_S) return;
  const l = gelesenListe(); if(l.includes(k)) return;
  l.push(k); LS.set(K.gelesen, l);
  try{ window.EP_LEVEL.gib(5, "lesen"); }catch(e){}
  try{ window.EP_LEVEL.pruefen(); }catch(e){}
  melden(false); veroeffentlichen();
}, 1000);

/* ---------- Neue Verzierungen melden ---------- */
const gesehen = () => { const l = LS.get(K.gesehen, []); return Array.isArray(l) ? l : []; };
function neuListe(){ const st = stand(), g = gesehen(); return TEILE.filter(t => !t.frei.start && hat(t, st) && !g.includes(t.id)); }
function melden(still){
  const st = stand(), da = TEILE.filter(t => hat(t, st)).map(t => t.id);
  const g = LS.get(K.gemeldet, null);
  if(!Array.isArray(g)){ LS.set(K.gemeldet, da); return; }
  const neu = da.filter(id => !g.includes(id));
  if(!neu.length) return;
  LS.set(K.gemeldet, g.concat(neu));
  if(still) return;
  const t = TEIL[neu[0]];
  toast(neu.length === 1 ? `🎨 Neue Verzierung: ${t.emo} ${t.name}` : `🎨 ${neu.length} neue Verzierungen für dein Profil`);
  ton("sammeln");
}
function toast(text){
  try{ document.querySelectorAll(".x-toast").forEach(e => e.remove());
    const d = document.createElement("div"); d.className = "x-toast"; d.setAttribute("role", "status"); d.textContent = text;
    document.body.appendChild(d); requestAnimationFrame(() => d.classList.add("an"));
    setTimeout(() => { d.classList.remove("an"); setTimeout(() => d.remove(), 400); }, 2800); }catch(e){}
}
document.addEventListener("ep:quizende", () => setTimeout(() => { melden(false); veroeffentlichen(); }, 900));

/* ---------- Schnittstellen ---------- */
window.EP_GARDEROBE = {
  /* Gibt eine noch nicht vorhandene Verzierung (z. B. aus einer Truhe). Rückgabe {id, name, emo, kat} oder null */
  teilGeben(id){
    try{
      const st = stand(), l = truheListe();
      let t = null;
      if(id){ t = TEIL[id]; if(!t || hat(t, st)) return null; }
      else {
        const truhe = TEILE.filter(x => x.frei.truhe && !hat(x, st));
        const rest = TEILE.filter(x => !x.frei.truhe && !x.frei.start && !hat(x, st))
          .sort((a, b) => ((fortschritt(b, st) || {anteil:0}).anteil - (fortschritt(a, st) || {anteil:0}).anteil));
        const pool = truhe.length ? truhe : rest.slice(0, 3);
        if(!pool.length) return null;
        t = pool[Math.floor(Math.random() * pool.length)];
      }
      l.push(t.id); LS.set(K.truhe, l);
      const g = LS.get(K.gemeldet, null); if(Array.isArray(g) && !g.includes(t.id)){ g.push(t.id); LS.set(K.gemeldet, g); }
      return {id:t.id, name:t.name, emo:t.emo, kat:t.kat};
    }catch(e){ return null; }
  },
  anzahl(){ const st = stand(); return {hat:TEILE.filter(t => hat(t, st)).length, alle:TEILE.length}; },
  aktuell(){ return deko(); },
  teile(){ const st = stand(); return TEILE.map(t => ({id:t.id, name:t.name, emo:t.emo, kat:t.kat, hat:hat(t, st), wie:wieText(t)})); },
  neu(){ return neuListe().length; },
  dekoHTML(){ return ""; },
  auffrischen(){}
};
window.EP_PROFIL = { gelesen, zahlen, deko, oeffentlich, kopfHTML, zahlenHTML };

/* ---------- Stil ---------- */
const css = document.createElement("style"); css.id = "ep-x-profil";
css.textContent = `
.pp-kopf{position:relative;overflow:hidden;border-radius:28px;padding:22px 16px 18px;color:#fff;box-shadow:0 16px 34px -18px rgba(27,34,64,.7);isolation:isolate;margin:6px 0 12px;min-height:220px;display:grid;place-items:center}
.pp-kopf::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 45%,rgba(10,12,40,.35));z-index:-1;pointer-events:none}
.pp-mitte{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;max-width:100%}
.pp-av{--ra:transparent;width:116px;height:116px;border-radius:50%;padding:7px;background:var(--ra);box-shadow:0 10px 24px -10px rgba(0,0,0,.6);box-sizing:border-box}
.pp-av.ohne{padding:0;box-shadow:0 0 0 4px rgba(255,255,255,.9),0 10px 24px -10px rgba(0,0,0,.6)}
.pp-avbild{display:block;width:100%;height:100%;border-radius:50%;overflow:hidden;background:#fff;box-shadow:inset 0 0 0 3px rgba(255,255,255,.95)}
.pp-avbild img,.pp-avbild svg{width:100%!important;height:100%!important;object-fit:cover;display:block}
.pp-name{margin:4px 0 0;font-size:clamp(1.5rem,6vw,2.2rem);line-height:1.05;color:#fff!important;text-shadow:0 2px 10px rgba(0,0,0,.35);overflow-wrap:anywhere}
.pp-unter{margin:0;display:flex;flex-wrap:wrap;justify-content:center;gap:6px}
.pp-unter>span{background:rgba(10,14,40,.38);border-radius:999px;padding:4px 10px;font-weight:700;font-size:.82rem;color:#fff;display:inline-flex;align-items:center;gap:4px}
.pp-unter .pp-titel{background:var(--tf,#8A3FE0);box-shadow:0 0 0 2px rgba(255,255,255,.75)}
.pp-unter img,.pp-unter svg{height:1em;width:auto}
.pp-knopf{margin-top:6px;border:0;border-radius:999px;padding:9px 16px;font:800 .9rem "Lexend",system-ui,sans-serif;background:#FFE34D;color:#1B2240!important;cursor:pointer;box-shadow:0 8px 16px -8px rgba(0,0,0,.55);min-height:42px}
.pp-knopf:focus-visible{outline:3px solid #fff;outline-offset:3px}
.pp-st{position:absolute;z-index:1;font-size:clamp(2rem,9vw,3rem);line-height:1;transform:translate(-50%,-50%) rotate(var(--r));filter:drop-shadow(0 0 2px #fff) drop-shadow(0 0 2px #fff) drop-shadow(0 6px 8px rgba(0,0,0,.35));pointer-events:none}
.pp-eff{position:absolute;inset:0;pointer-events:none;z-index:0}
.pp-eff i{position:absolute;bottom:-12%;font-style:normal;font-size:calc(1.1rem * var(--g));opacity:0;animation:ppSteig var(--t) linear var(--d) infinite}
@keyframes ppSteig{0%{transform:translateY(0) rotate(-8deg);opacity:0}15%{opacity:.95}100%{transform:translateY(-260px) rotate(12deg);opacity:0}}
@media (prefers-reduced-motion:reduce){.pp-eff i{animation:none;opacity:.8;bottom:auto;top:calc(var(--d) * 20%)}}
/* Bewegte Hintergründe: Ebene .pa::before über dem Hintergrund, unter dem Inhalt */
.pa{position:relative;overflow:hidden;isolation:isolate}
.pa::before{content:"";position:absolute;pointer-events:none;z-index:-1}
.pv-bild.pa{position:relative}
.pv-bewegt{position:absolute;left:3px;bottom:3px;font-style:normal;font-size:.5rem;font-weight:800;background:rgba(15,20,48,.65);color:#fff;border-radius:999px;padding:1px 5px;z-index:2}
.pa-fliessen{background-size:300% 300%!important;animation:paFliess 12s ease-in-out infinite alternate}
@keyframes paFliess{0%{background-position:0% 50%}100%{background-position:100% 50%}}
.pa-wellen::before{left:0;right:0;bottom:0;height:45%;background:radial-gradient(ellipse 40px 14px at 50% 0,transparent 70%,rgba(255,255,255,.22) 72%,transparent 82%) 0 0/80px 22px repeat;animation:paWelle 5s linear infinite}
@keyframes paWelle{to{background-position:80px 0}}
.pa-funkeln::before{inset:0;background:radial-gradient(circle,#fff 0 1.5px,transparent 2.5px) 12px 18px/70px 70px,radial-gradient(circle,#FFE34D 0 1.5px,transparent 2.5px) 40px 50px/110px 90px;animation:paBlink 2.6s ease-in-out infinite alternate}
@keyframes paBlink{0%{opacity:.15}100%{opacity:1}}
.pa-gluehen::before{left:-20%;right:-20%;bottom:-30%;height:80%;background:radial-gradient(ellipse at 50% 100%,#FFE34D,#FF8A3D 25%,#E8384F 45%,transparent 70%);animation:paGlueh 3.4s ease-in-out infinite alternate}
@keyframes paGlueh{0%{opacity:.45;transform:scale(.92)}100%{opacity:1;transform:scale(1.08)}}
.pa-blasen::before{inset:0;background:radial-gradient(circle,rgba(255,255,255,.55) 0 2px,transparent 3px) 10px 0/60px 60px,radial-gradient(circle,rgba(191,233,255,.45) 0 3.5px,transparent 4.5px) 35px 20px/90px 80px;animation:paSteig 7s linear infinite}
@keyframes paSteig{to{background-position:10px -60px,35px -140px}}
.pa-drehen::before{inset:-60%;background:inherit;animation:paDreh 40s linear infinite}
.pa-strahlen::before{inset:-80%;background:repeating-conic-gradient(rgba(255,255,255,.28) 0 6deg,transparent 6deg 18deg);animation:paDreh 30s linear infinite}
@keyframes paDreh{to{transform:rotate(360deg)}}
.pa-glanz::before{top:0;bottom:0;left:-60%;width:45%;background:linear-gradient(100deg,transparent,rgba(255,244,194,.55),transparent);animation:paGlanz 4.5s ease-in-out infinite}
@keyframes paGlanz{0%{transform:translateX(0)}60%,100%{transform:translateX(400%)}}
.pa-wolken::before{left:0;right:0;top:4%;height:45%;background:radial-gradient(ellipse 50px 18px at 50% 50%,rgba(255,255,255,.9) 60%,transparent 62%) 0 10px/260px 60px repeat-x,radial-gradient(ellipse 34px 13px at 50% 50%,rgba(255,255,255,.75) 60%,transparent 62%) 120px 0/200px 50px repeat-x;animation:paZieh 26s linear infinite}
@keyframes paZieh{to{background-position:260px 10px,320px 0}}
.pa-lava{background-size:180% 180%!important;animation:paLava 9s ease-in-out infinite alternate}
@keyframes paLava{0%{background-position:0% 0%,100% 100%,50% 0%,0 0}100%{background-position:100% 60%,0% 30%,20% 100%,0 0}}
.pa-feuerwerk::before{inset:0;background:radial-gradient(circle,#FFE34D 0 2px,transparent 3px) 20px 20px/90px 80px,radial-gradient(circle,#FF6FA8 0 2px,transparent 3px) 60px 50px/120px 100px,radial-gradient(circle,#7FD1FF 0 2px,transparent 3px) 5px 60px/70px 110px,radial-gradient(circle at 30% 35%,rgba(255,111,168,.45),transparent 22%),radial-gradient(circle at 72% 30%,rgba(255,227,77,.4),transparent 20%);animation:paKnall 2.2s ease-out infinite}
@keyframes paKnall{0%{opacity:0;transform:scale(.7)}25%{opacity:1}100%{opacity:0;transform:scale(1.25)}}
.pa-schnee::before{inset:0;background:radial-gradient(circle,#fff 0 2px,transparent 3px) 0 0/50px 50px,radial-gradient(circle,rgba(255,255,255,.8) 0 1.5px,transparent 2.5px) 25px 10px/35px 40px;animation:paFall 6s linear infinite}
@keyframes paFall{to{background-position:20px 50px,5px 80px}}
@media (prefers-reduced-motion:reduce){.pa,.pa::before{animation:none!important}}
.pp-zahlen{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:0 0 12px}
.pp-zahl{background:var(--surface,#fff);border:2px solid var(--line,#E3E7F2);border-radius:18px;padding:10px 6px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:1px;min-width:0}
.pp-zahl span{font-size:1.3rem;line-height:1}
.pp-zahl b{font:800 1.35rem/1.1 "Bricolage Grotesque","Fredoka",system-ui,sans-serif;color:var(--ink,#1B2240)}
.pp-zahl small{font-size:.74rem;color:var(--muted,#5D5C80);line-height:1.15}
.pp-vitrine,.pp-naechst{background:var(--surface,#fff);border:2px solid var(--line,#E3E7F2);border-radius:22px;padding:12px 14px;margin:0 0 12px}
.pp-vitrine h2,.pp-naechst h2{margin:0 0 8px;font-size:1.1rem}
.pp-vitrine.leer p{margin:0;color:var(--muted,#5D5C80);font-size:.9rem}
.pp-vit{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.pp-med{display:flex;flex-direction:column;align-items:center;text-align:center;gap:2px;padding:10px 4px;border-radius:18px;background:color-mix(in srgb,var(--mf) 14%,transparent);border:2px solid var(--mf);min-width:0}
.pp-med span{font-size:1.8rem;line-height:1;width:52px;height:52px;display:grid;place-items:center;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,color-mix(in srgb,var(--mf) 45%,#fff));box-shadow:0 0 0 3px var(--mf)}
.pp-med b{font-size:.82rem;line-height:1.15;margin-top:4px}
.pp-med small{font-size:.72rem;font-weight:700;color:var(--mf)}
.pp-nz{display:flex;align-items:center;gap:10px;padding:6px 0;border-top:1px solid var(--line,#E3E7F2)}
.pp-naechst h2+.pp-nz{border-top:0}
.pp-ne{font-size:1.6rem;flex:none;width:40px;text-align:center}
.pp-nt{flex:1;min-width:0;font-size:.88rem;line-height:1.2}
.pp-nt small{color:var(--muted,#5D5C80)}
.pp-bar{display:block;height:8px;border-radius:999px;background:var(--line,#E3E7F2);overflow:hidden;margin-top:5px}
.pp-bar i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#8A3FE0,#E043B8)}
.pp-nw{flex:none;font-weight:800;font-size:.8rem;color:var(--muted,#5D5C80)}
@media (min-width:700px){.pp-zahlen{grid-template-columns:repeat(6,minmax(0,1fr))}.pp-kopf{min-height:260px}.pp-av{width:140px;height:140px}}
@media (max-width:380px){.pp-av{width:96px;height:96px}.pp-zahl b{font-size:1.15rem}.pp-zahl small{font-size:.68rem}}

/* Seite «Profil verzieren» */
.pv-seite{display:grid;gap:12px;grid-template-columns:minmax(0,1fr);max-width:1100px;margin:0 auto}
.pv-seite .pp-kopf{margin:0;min-height:200px}
.pv-reiter{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:4px;background:rgba(15,20,48,.55);padding:5px;border-radius:20px;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.pv-reiter button{position:relative;border:0;border-radius:15px;background:none;color:#fff;font:700 .7rem/1.1 "Lexend",system-ui,sans-serif;padding:6px 1px;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;min-width:0;overflow:hidden;text-align:center;hyphens:manual}
.pv-reiter button span{font-size:1.15rem;line-height:1.1}
.pv-reiter button[aria-selected="true"]{background:linear-gradient(135deg,#3D5AFE,#8A3FE0 60%,#E043B8);box-shadow:0 6px 14px -8px rgba(0,0,0,.6)}
.pv-reiter button:focus-visible,.pv-teil:focus-visible{outline:3px solid #FFE34D;outline-offset:2px}
.pv-reiter i{position:absolute;top:4px;right:6px;width:8px;height:8px;border-radius:50%;background:#FFE34D}
.pv-raster{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.pv-teil{position:relative;display:flex;flex-direction:column;align-items:center;gap:3px;border:0;border-radius:18px;padding:8px 4px;cursor:pointer;color:#fff;min-width:0;background:linear-gradient(160deg,#5B2BB5,#3D5AFE);font:inherit}
.pv-teil .pv-bild{width:100%;max-width:64px;aspect-ratio:1;border-radius:14px;display:grid;place-items:center;font-size:1.8rem;line-height:1;background:rgba(255,255,255,.14)}
.pv-teil .pv-ring{border-radius:50%;padding:7px;box-sizing:border-box}
.pv-teil .pv-ring>span{display:block;width:100%;height:100%;border-radius:50%;background:#fff}
.pv-teil b{font-size:.72rem;line-height:1.15;text-align:center;max-width:100%;overflow-wrap:anywhere;color:#fff}
.pv-teil small{font-size:.62rem;opacity:.9;line-height:1.1;text-align:center;color:#fff}
.pv-teil[aria-pressed="true"]{box-shadow:0 0 0 3px #FFE34D,0 8px 16px -8px rgba(27,34,64,.6)}
.pv-teil[aria-pressed="true"]::after{content:"✓";position:absolute;top:5px;left:6px;width:20px;height:20px;border-radius:50%;background:#FFE34D;color:#1B2240;font:900 .75rem/20px system-ui;text-align:center}
.pv-teil.zu{background:linear-gradient(160deg,#5A6185,#3B4066)}
.pv-teil.zu .pv-bild{opacity:.45;filter:grayscale(.8)}
.pv-teil.zu::before{content:"🔒";position:absolute;top:5px;right:6px;font-size:.8rem}
.pv-neu{position:absolute;top:5px;right:6px;font-style:normal;background:#FFE34D;color:#1B2240;font-weight:800;font-size:.6rem;padding:2px 6px;border-radius:999px}
.pv-tipp{margin:0;color:#fff;background:rgba(15,20,48,.55);padding:8px 14px;border-radius:16px;font-size:.82rem;line-height:1.35}
@media (min-width:700px){.pv-raster{grid-template-columns:repeat(6,minmax(0,1fr))}.pv-reiter button{font-size:.86rem}}
@media (min-width:1000px){.pv-seite{grid-template-columns:400px minmax(0,1fr);align-items:start}.pv-links{position:sticky;top:12px}.pv-raster{grid-template-columns:repeat(5,minmax(0,1fr))}}
`;
document.head.appendChild(css);

/* ---------- Seite «Profil verzieren» ---------- */
let reiter = LS.get(K.reiter, "hg"); if(!KATS.some(k => k[0] === reiter)) reiter = "hg";
function seite(box){
  const neuJetzt = neuListe().map(t => t.id), g = gesehen();
  const waehle = (k, fokus) => { reiter = k; LS.set(K.reiter, reiter); zeichne(); if(fokus) box.querySelector(`#pvR-${k}`)?.focus(); };
  const kachel = (id, aktiv, da, bild, name, unter, neu) => `<button type="button" class="pv-teil${da ? "" : " zu"}" data-id="${h(id)}" aria-pressed="${aktiv}" aria-label="${h(name)}${da ? (aktiv ? ", gewählt" : "") : ", gesperrt, " + h(unter)}">${bild}<b>${h(name)}</b>${da ? "" : `<small>${h(unter)}</small>`}${neu ? '<i class="pv-neu">neu</i>' : ""}</button>`;
  const zeichne = () => {
    const st = stand(), d = deko();
    box.querySelector(".pv-links").innerHTML = kopfHTML(eigenesProfil(), false);
    box.querySelector(".pv-reiter").innerHTML = KATS.map(([k, n, e]) => { const neu = TEILE.some(t => t.kat === k && neuJetzt.includes(t.id) && !g.includes(t.id));
      return `<button type="button" role="tab" id="pvR-${k}" aria-selected="${k === reiter}" tabindex="${k === reiter ? 0 : -1}" data-k="${k}"><span aria-hidden="true">${e}</span>${h(n)}${neu ? "<i></i>" : ""}</button>`; }).join("");
    const raster = box.querySelector(".pv-raster"); let html = "", tipp = "";
    if(reiter === "titel"){
      const alle = (window.EP_LEVEL && window.EP_LEVEL.TITEL) || [];
      html = alle.map(t => kachel("t:" + t[2], d.titel === t[2], st.level >= t[0], `<span class="pv-bild" style="background:${t[3]}">${t[1]}</span>`, t[2], `Ab Level ${t[0]}`, false)).join("");
      tipp = "🏷️ Wähle, welcher Titel unter deinem Namen steht. Neue Titel gibt es mit höheren Leveln.";
    } else if(reiter === "vitrine"){
      const fam = famListe(), stufen = (window.EP_LEVEL && window.EP_LEVEL.STUFEN) || [];
      html = fam.map(f => { const s = f.stufe ? stufen[f.stufe - 1] : null;
        return kachel("v:" + f.id, d.vitrine.includes(f.id), f.stufe > 0, `<span class="pv-bild" style="${s ? `box-shadow:inset 0 0 0 3px ${s[1]}` : ""}">${f.emo}</span>`, f.name + (s ? " · " + s[0] : ""), `${zahl(f.naechste || 0)} ${f.text}`, false); }).join("");
      tipp = `🏅 Wähle bis zu ${MAX_VITRINE} Abzeichen für deine Vitrine. Neue Stufen gibt es fürs Lesen, Antworten, Tests und deine Serie.`;
    } else {
      html = TEILE.filter(t => t.kat === reiter).map(t => { const da = hat(t, st);
        const aktiv = reiter === "sticker" ? d.sticker.includes(t.id) : d[reiter] === t.id;
        const bild = reiter === "hg" ? `<span class="pv-bild${t.anim ? " pa pa-" + t.anim : ""}" style="background:${t.css}">${t.anim ? '<i class="pv-bewegt">bewegt</i>' : ""}</span>` : reiter === "rahmen" ? `<span class="pv-bild pv-ring" style="background:${t.id === "ohne" ? "rgba(255,255,255,.14)" : t.css}"><span></span></span>` : `<span class="pv-bild">${t.emo}</span>`;
        return kachel(t.id, aktiv, da, bild, t.name, wieText(t), neuJetzt.includes(t.id) && !g.includes(t.id)); }).join("");
      tipp = reiter === "sticker" ? `🦉 Bis zu ${MAX_STICKER} Sticker kleben auf deinem Profil. Nochmals antippen nimmt einen weg.` : "💡 Neue Verzierungen gibt es mit Level, Serie, Truhen, gelesenen Artikeln, Fragen und Tests.";
    }
    raster.innerHTML = html; box.querySelector(".pv-tipp").textContent = tipp;
    box.querySelectorAll(".pv-reiter [data-k]").forEach(b => {
      b.onclick = () => { if(reiter === b.dataset.k) return; ton("wisch"); waehle(b.dataset.k, true); };
      b.onkeydown = ev => { if(ev.key !== "ArrowRight" && ev.key !== "ArrowLeft") return; ev.preventDefault();
        const i = KATS.findIndex(k => k[0] === reiter); waehle(KATS[(i + (ev.key === "ArrowRight" ? 1 : KATS.length - 1)) % KATS.length][0], true); };
    });
    raster.querySelectorAll(".pv-teil").forEach(b => b.onclick = () => {
      const id = b.dataset.id, st2 = stand(), d2 = deko();
      if(b.classList.contains("zu")){ ton("fehler"); toast(b.getAttribute("aria-label").replace(", gesperrt, ", ": ")); return; }
      if(id.startsWith("t:")) dekoSetzen({titel:id.slice(2)});
      else if(id.startsWith("v:")){ const f = id.slice(2); let v = d2.vitrine.slice();
        if(v.includes(f)) v = v.filter(x => x !== f); else { v.push(f); if(v.length > MAX_VITRINE) v.shift(); }
        dekoSetzen({vitrine:v, vitrineGewaehlt:true}); }
      else { const t = TEIL[id]; if(!t || !hat(t, st2)) return;
        if(t.kat === "sticker"){ let s = d2.sticker.slice(); if(s.includes(id)) s = s.filter(x => x !== id); else { s.push(id); if(s.length > MAX_STICKER) s.shift(); } dekoSetzen({sticker:s}); }
        else dekoSetzen({[t.kat]:id}); }
      ton("sammeln"); zeichne(); box.querySelector(`.pv-teil[data-id="${CSS.escape(id)}"]`)?.focus();
    });
  };
  box.innerHTML = `<div class="pv-seite">
    <div class="pv-links"></div>
    <div class="pv-rechts" style="display:grid;gap:10px;min-width:0;align-content:start">
      <div class="pv-reiter" role="tablist" aria-label="Verzierungen"></div>
      <div class="pv-raster" role="tabpanel"></div>
      <p class="pv-tipp"></p>
    </div></div>`;
  zeichne();
  LS.set(K.gesehen, Array.from(new Set(g.concat(neuJetzt))));
  melden(true);
}

/* ---------- Einbau in Profil (eigenes) und Spieler (fremdes) ---------- */
function einbauen(p, ich){
  const app = document.getElementById("app"); if(!app) return;
  const alt = app.querySelector(".pagehead"); if(!alt) return;
  const box = document.createElement("div"); box.className = "pp-seite";
  box.innerHTML = kopfHTML(p, ich) + zahlenHTML(p.zahlen || {}) + vitrineHTML((p.deko || {}).vi, ich) + (ich ? naechsteHTML() : "");
  alt.replaceWith(box);
  const k = document.getElementById("ppVerzieren"); if(k) k.onclick = () => { ton("klick"); go("x-garderobe"); scrollTo(0, 0); };
}
const vorProfil = window.renderProfil;
if(typeof vorProfil === "function") window.renderProfil = function(){
  const r = vorProfil.apply(this, arguments);
  try{ if(S.screen === "profil" && S.profil){ einbauen(eigenesProfil(), true); veroeffentlichen(); } }catch(e){ console.warn("profil", e); }
  return r;
};
const vorSpieler = window.renderSpieler;
if(typeof vorSpieler === "function") window.renderSpieler = function(){
  const r = vorSpieler.apply(this, arguments);
  try{ if(S.screen === "spieler"){ const id = S.spielerId; const ich = id === "me" || (S.uid && id === S.uid);
    const p = ich ? eigenesProfil() : (S.spieler || []).find(x => x.id === id); if(p) einbauen(p, ich); } }catch(e){ console.warn("spieler", e); }
  return r;
};

/* ---------- Anmelden als Welt ---------- */
function anmelden(){
  if(!window.EP_EXTRAS || typeof window.EP_EXTRAS.register !== "function") return false;
  window.EP_EXTRAS.register({
    id:"garderobe", titel:"Profil verzieren", text:"Schmück deine Profilseite mit Hintergründen, Rahmen, Stickern und Effekten", emo:"🎨",
    farbe:"linear-gradient(135deg,#E043B8,#8A3FE0 60%,#3D5AFE)", reihe:30,
    hinweis(){ const n = neuListe().length; return n ? `${n} neu` : ""; },
    folie(){ const n = neuListe().length; if(!n) return null;
      return {cls:"hs-x", ic:"🎨", lbl:"Profil", titel:n === 1 ? "Eine neue Verzierung!" : `${n} neue Verzierungen!`, text:"Schmück deine Profilseite mit Hintergründen, Rahmen und Stickern.", btn:"🎨 Verzieren", a:"x-garderobe"}; },
    render(box){ seite(box); }
  });
  return true;
}
if(!anmelden()) document.addEventListener("DOMContentLoaded", anmelden);
addEventListener("load", () => { melden(true); veroeffentlichen(); });
})();
