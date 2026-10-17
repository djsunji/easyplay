/* easyplay: Garderobe
   Das eigene Profilbild (Avatar) mit Zubehör schmücken: Kopf, Brille, Hals, Rahmen und Effekt.
   Alle Teile sind eigene SVG-Zeichnungen im Koordinatensystem 0..200, der runde Avatar liegt bei (100,100) mit Radius 50.
   Freischalten über Level (EP_LEVEL), Serie (EP_LERNEN.serie), Truhe (EP_GARDEROBE.teilGeben) oder von Anfang an.
   Anzeige überall, wo der EIGENE Avatar erscheint: Es werden nur Deko-Elemente (<xg-hg> hinter dem Bild, <xg-vg> darüber)
   in den Avatar-Container gelegt, pointer-events:none, nichts wird verschoben.
   Speicher: ep-x-garderobe-an, -truhe, -gesehen, -gemeldet, -rekord, -reiter */
(function(){
"use strict";

const LS = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};
const K = { an:"ep-x-garderobe-an", truhe:"ep-x-garderobe-truhe", gesehen:"ep-x-garderobe-gesehen", gemeldet:"ep-x-garderobe-gemeldet", rekord:"ep-x-garderobe-rekord", reiter:"ep-x-garderobe-reiter" };
const h = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const ton = n => { try{ window.EP_SOUND && window.EP_SOUND.play(n); }catch(e){} };

/* ---------- Zeichenhilfen ---------- */
const f1 = n => Math.round(n * 10) / 10;
function stern(cx, cy, r, ri){ ri = ri || r * 0.45; let d = ""; for(let i = 0; i < 10; i++){ const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? ri : r; d += (i ? "L" : "M") + f1(cx + rr * Math.cos(a)) + " " + f1(cy + rr * Math.sin(a)); } return d + "Z"; }
function funke(cx, cy, r){ const q = r * 0.22; return `M${cx} ${f1(cy - r)} Q${f1(cx + q)} ${f1(cy - q)} ${f1(cx + r)} ${cy} Q${f1(cx + q)} ${f1(cy + q)} ${cx} ${f1(cy + r)} Q${f1(cx - q)} ${f1(cy + q)} ${f1(cx - r)} ${cy} Q${f1(cx - q)} ${f1(cy - q)} ${cx} ${f1(cy - r)}Z`; }
function herz(cx, cy, s){ return `M${cx} ${f1(cy + s * .9)} C${f1(cx - s * 1.5)} ${f1(cy + s * .05)} ${f1(cx - s * .95)} ${f1(cy - s * 1.05)} ${cx} ${f1(cy - s * .35)} C${f1(cx + s * .95)} ${f1(cy - s * 1.05)} ${f1(cx + s * 1.5)} ${f1(cy + s * .05)} ${cx} ${f1(cy + s * .9)}Z`; }
function bluete(cx, cy, r, farbe, mitte){ let s = ""; for(let i = 0; i < 5; i++){ const a = i * Math.PI * 2 / 5 - Math.PI / 2; s += `<circle cx="${f1(cx + r * .62 * Math.cos(a))}" cy="${f1(cy + r * .62 * Math.sin(a))}" r="${f1(r * .5)}" fill="${farbe}"/>`; } return s + `<circle cx="${cx}" cy="${cy}" r="${f1(r * .38)}" fill="${mitte || "#FFD54A"}"/>`; }
function edelweiss(cx, cy, r){ let s = ""; for(let i = 0; i < 8; i++){ s += `<ellipse cx="${cx}" cy="${f1(cy - r * .55)}" rx="${f1(r * .2)}" ry="${f1(r * .5)}" fill="#FAFAF5" stroke="#C9CDBF" stroke-width=".8" transform="rotate(${i * 45} ${cx} ${cy})"/>`; } return s + `<circle cx="${cx}" cy="${cy}" r="${f1(r * .3)}" fill="#F2C94C" stroke="#C99A00" stroke-width=".6"/>`; }
const glanz = (x1, y1, x2, y2, w) => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="#fff" stroke-opacity=".75" stroke-width="${w || 2.5}" stroke-linecap="round" fill="none"/>`;
const ring = (farbe, w) => `<circle cx="100" cy="100" r="${f1(50 + (w || 5) / 2 - .5)}" fill="none" stroke="${farbe}" stroke-width="${w || 5}"/>`;
const verlauf = (id, farben, vertikal = true) => `<linearGradient id="${id}" x1="0" y1="0" x2="${vertikal ? 0 : 1}" y2="${vertikal ? 1 : 0}">${farben.map((c, i) => `<stop offset="${f1(i / (farben.length - 1))}" stop-color="${c}"/>`).join("")}</linearGradient>`;
const flaeche = (u, farben) => `<defs>${verlauf(u + "b", farben)}</defs><rect x="40" y="40" width="120" height="120" fill="url(#${u}b)"/>`;

/* ---------- Die Teile ----------
   frei: {start:1} | {level:n} | {serie:n} | {truhe:1, level:n}  (Truhen-Teile gibt es zur Sicherheit auch ab einem hohen Level)
   vg(u): Zeichnung über dem Avatar, hg(u): Zeichnung hinter dem Avatar (nur Rahmen), u = eindeutiges Präfix für ids */
const TEILE = [
  /* --- Kopf --- */
  {id:"muetze", kat:"kopf", name:"Wollmütze", emo:"🧶", frei:{start:1}, vg:() => `
    <path d="M62 70 C60 40 78 24 100 24 C122 24 140 40 138 70 Z" fill="#E8384F" stroke="#9E1830" stroke-width="2"/>
    <path d="M81 31 C77 44 77 57 79 68 M100 25 V68 M119 31 C123 44 123 57 121 68" stroke="#C42340" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M98.4 38h3.2v4.6h4.6v3.2h-4.6v4.6h-3.2v-4.6h-4.6v-3.2h4.6z" fill="#fff"/>
    <rect x="58" y="60" width="84" height="18" rx="9" fill="#FFF6EC" stroke="#D9CBB8" stroke-width="2"/>
    <path d="M66 66.5 H134 M66 71.5 H134" stroke="#EADBC6" stroke-width="1.5"/>
    <circle cx="100" cy="22" r="11" fill="#FFF6EC" stroke="#D9CBB8" stroke-width="2"/>${glanz(95, 17, 98, 15, 2)}`},
  {id:"kappe", kat:"kopf", name:"Kappe", emo:"🧢", frei:{start:1}, vg:() => `
    <path d="M64 70 C62 42 80 30 100 30 C120 30 138 42 136 70 Z" fill="#2F6BFF" stroke="#173C9E" stroke-width="2"/>
    <path d="M100 31 V67 M82 36 C78 48 77 59 78 68 M118 36 C122 48 123 59 122 68" stroke="#5A8BFF" stroke-width="2" fill="none"/>
    <path d="${stern(88, 52, 7)}" fill="#FFD54A"/>
    <path d="M64 67 C88 62 112 62 136 67" stroke="#FFD54A" stroke-width="3" fill="none"/>
    <path d="M98 66 C120 59 150 59 167 70 C150 78 122 79 98 74 Z" fill="#1E4FD1" stroke="#173C9E" stroke-width="2"/>
    <circle cx="100" cy="31" r="4" fill="#173C9E"/>`},
  {id:"schleife", kat:"kopf", name:"Schleife", emo:"🎀", frei:{start:1}, vg:() => `
    <g transform="rotate(-12 130 58)">
    <path d="M127 60 L119 78 L125 76 L128 81 L131 62 Z M133 60 L142 77 L136 76 L134 81 L129 62 Z" fill="#E0337E"/>
    <path d="M130 58 C118 44 103 41 103 52 C103 64 118 67 130 58 Z" fill="#FF5FA2" stroke="#C2185B" stroke-width="2"/>
    <path d="M130 58 C142 44 157 41 157 52 C157 64 142 67 130 58 Z" fill="#FF5FA2" stroke="#C2185B" stroke-width="2"/>
    <circle cx="130" cy="58" r="6" fill="#FF8CC0" stroke="#C2185B" stroke-width="2"/>${glanz(109, 50, 116, 47, 2)}</g>`},
  {id:"zipfel", kat:"kopf", name:"Zipfelmütze", emo:"🧝", frei:{level:3}, vg:() => `
    <path d="M62 72 C62 46 76 30 98 24 C118 18 141 15 158 26 C140 30 131 42 137 72 Z" fill="#2FA84F" stroke="#1B6E31" stroke-width="2"/>
    <path d="${stern(92, 44, 5)}" fill="#fff" fill-opacity=".9"/><path d="${stern(116, 36, 3.5)}" fill="#fff" fill-opacity=".8"/>
    <path d="M59 63 C86 57 114 57 141 63 L141 76 C114 70 86 70 59 76 Z" fill="#fff" stroke="#CBD3DA" stroke-width="2"/>
    <circle cx="160" cy="27" r="7.5" fill="#FFD54A" stroke="#C99A00" stroke-width="2"/>`},
  {id:"helm", kat:"kopf", name:"Velohelm", emo:"🚲", frei:{level:5}, vg:() => `
    <path d="M57 75 C55 44 76 26 100 26 C124 26 145 44 143 75 C128 68 72 68 57 75 Z" fill="#FF7A1A" stroke="#B34A00" stroke-width="2"/>
    <path d="M84 35 C80 45 79 54 80 62 M100 31 V62 M116 35 C120 45 121 54 120 62" stroke="#7A2E00" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="M66 58 C70 45 79 37 89 33" stroke="#FFC08A" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M58 73 C80 65 120 65 142 73 L145 80 C120 72 80 72 55 80 Z" fill="#1B2240"/>`},
  {id:"krone", kat:"kopf", name:"Krone", emo:"👑", frei:{level:8}, vg:u => `
    <defs>${verlauf(u + "k", ["#FFE680", "#F2A900"])}</defs>
    <path d="M68 70 L62 34 L82 50 L100 26 L118 50 L138 34 L132 70 Z" fill="url(#${u}k)" stroke="#B47A00" stroke-width="2.5" stroke-linejoin="round"/>
    <rect x="66" y="60" width="68" height="11" rx="4" fill="#F5B800" stroke="#B47A00" stroke-width="2"/>
    <circle cx="62" cy="33" r="4.5" fill="#FFE680" stroke="#B47A00" stroke-width="2"/><circle cx="100" cy="25" r="4.5" fill="#FFE680" stroke="#B47A00" stroke-width="2"/><circle cx="138" cy="33" r="4.5" fill="#FFE680" stroke="#B47A00" stroke-width="2"/>
    <circle cx="100" cy="48" r="6" fill="#E8384F" stroke="#9E1830" stroke-width="1.5"/>
    <circle cx="80" cy="65.5" r="3.5" fill="#2F9BFF"/><circle cx="100" cy="65.5" r="3.5" fill="#2FA84F"/><circle cx="120" cy="65.5" r="3.5" fill="#2F9BFF"/>${glanz(72, 42, 74, 56)}`},
  {id:"blumen", kat:"kopf", name:"Blumenkranz", emo:"🌼", frei:{serie:3}, vg:() => {
    let s = `<path d="M60 72 C70 52 86 46 100 46 C114 46 130 52 140 72" stroke="#3E9B4F" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    const fa = ["#FF6FA8", "#FFFFFF", "#B98CFF", "#FFD54A", "#FF8A3D", "#7FD1FF", "#FF6FA8"];
    for(let i = 0; i < 7; i++){ const a = Math.PI * (1.08 + .84 * i / 6), x = 100 + 41 * Math.cos(a), y = 76 + 30 * Math.sin(a);
      s += `<ellipse cx="${f1(x + 5)}" cy="${f1(y + 3)}" rx="5" ry="2.6" fill="#4CB860" transform="rotate(30 ${f1(x + 5)} ${f1(y + 3)})"/>` + bluete(f1(x), f1(y), i % 2 ? 7 : 8.5, fa[i], i % 2 ? "#FF8A3D" : "#FFD54A"); }
    return s; }},
  {id:"zauber", kat:"kopf", name:"Zauberhut", emo:"🪄", frei:{level:12}, vg:() => `
    <path d="M70 66 C84 50 96 24 113 6 C115 22 120 46 132 66 Z" fill="#6A3FD6" stroke="#3B1F8C" stroke-width="2" stroke-linejoin="round"/>
    <ellipse cx="100" cy="68" rx="50" ry="10" fill="#4B2A9B" stroke="#2C1670" stroke-width="2"/>
    <path d="M72 61 C90 57 112 57 130 61 L131 67 C112 63 90 63 71 67 Z" fill="#FFD54A"/>
    <path d="${stern(97, 44, 6.5)}" fill="#FFD54A"/><path d="${stern(112, 24, 4)}" fill="#FFE680"/><path d="${funke(119, 47, 4)}" fill="#fff"/>`},
  {id:"kopfhoerer", kat:"kopf", name:"Kopfhörer", emo:"🎧", frei:{level:20}, vg:() => `
    <path d="M55 100 C53 56 74 33 100 33 C126 33 147 56 145 100" stroke="#2B2F45" stroke-width="8" fill="none" stroke-linecap="round"/>
    <path d="M60 80 C62 54 78 39 100 38" stroke="#5A6185" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <rect x="42" y="84" width="21" height="34" rx="10" fill="#FF4D8D" stroke="#B0154F" stroke-width="2"/><rect x="137" y="84" width="21" height="34" rx="10" fill="#FF4D8D" stroke="#B0154F" stroke-width="2"/>
    <rect x="57" y="90" width="7" height="22" rx="3.5" fill="#2B2F45"/><rect x="136" y="90" width="7" height="22" rx="3.5" fill="#2B2F45"/>${glanz(47, 92, 47, 104, 2)}`},
  {id:"edelweiss", kat:"kopf", name:"Edelweiss-Hut", emo:"🏔️", frei:{level:30}, vg:() => `
    <path d="M77 60 C70 48 66 38 64 26 C72 34 78 44 81 58 Z" fill="#E9E4D8" stroke="#A8A08C" stroke-width="1.5"/>
    <ellipse cx="100" cy="66" rx="50" ry="9" fill="#3F5F2A" stroke="#26401A" stroke-width="2"/>
    <path d="M72 64 C72 44 80 30 100 30 C120 30 128 44 128 64 Z" fill="#557D38" stroke="#26401A" stroke-width="2"/>
    <path d="M88 32 C96 37 104 37 112 32" stroke="#3F5F2A" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M73 55 C90 59 110 59 127 55 L128 63 C110 67 90 67 72 63 Z" fill="#9C2B1F"/>${edelweiss(118, 54, 10)}`},
  {id:"partyhut", kat:"kopf", name:"Partyhut", emo:"🥳", frei:{truhe:1, level:60}, vg:() => {
    const xl = y => f1(84 + (66 - y) / 54 * 22), xr = y => f1(128 - (66 - y) / 54 * 22);
    const band = (y1, y2, c) => `<path d="M${xl(y1)} ${y1} L${xr(y1)} ${y1} L${xr(y2)} ${y2} L${xl(y2)} ${y2} Z" fill="${c}"/>`;
    return `<g transform="rotate(14 106 64)"><path d="M84 66 L106 12 L128 66 Z" fill="#FFD54A"/>${band(56, 48, "#FF5FA2")}${band(38, 31, "#3D7BFE")}
      <path d="M84 66 L106 12 L128 66 Z" fill="none" stroke="#C99A00" stroke-width="2" stroke-linejoin="round"/>
      ${[86, 94, 102, 110, 118, 126].map((x, i) => `<circle cx="${x}" cy="67" r="4.5" fill="${["#FF5FA2", "#7FD1FF", "#7BE07B", "#B98CFF", "#FF8A3D", "#FF5FA2"][i]}"/>`).join("")}
      <circle cx="106" cy="11" r="6" fill="#FF5FA2"/><circle cx="101" cy="8" r="3.5" fill="#FF8CC0"/><circle cx="111" cy="8" r="3.5" fill="#E0337E"/></g>`; }},
  {id:"katzenohren", kat:"kopf", name:"Katzenohren", emo:"🐱", frei:{truhe:1, level:70}, vg:() => `
    <path d="M62 68 C70 50 84 44 100 44 C116 44 130 50 138 68" stroke="#2B2F45" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M66 60 L64 25 L91 46 Z" fill="#2B2F45" stroke="#14172A" stroke-width="2" stroke-linejoin="round"/><path d="M70 53 L69 34 L84 46 Z" fill="#FF8CC0"/>
    <path d="M134 60 L136 25 L109 46 Z" fill="#2B2F45" stroke="#14172A" stroke-width="2" stroke-linejoin="round"/><path d="M130 53 L131 34 L116 46 Z" fill="#FF8CC0"/>`},

  /* --- Brille --- */
  {id:"rund", kat:"brille", name:"Runde Brille", emo:"👓", frei:{start:1}, vg:() => `
    <g fill="none" stroke="#5A3A1E" stroke-width="3.5"><circle cx="83" cy="98" r="12" fill="#BFE6FF" fill-opacity=".25"/><circle cx="117" cy="98" r="12" fill="#BFE6FF" fill-opacity=".25"/>
    <path d="M95 96 C98 92 102 92 105 96 M71 96 L58 92 M129 96 L142 92" stroke-linecap="round"/></g>${glanz(77, 94, 81, 91, 2)}${glanz(111, 94, 115, 91, 2)}`},
  {id:"sonne", kat:"brille", name:"Sonnenbrille", emo:"🕶️", frei:{level:2}, vg:() => `
    <path d="M66 90 H96 C96 104 92 110 82 110 C72 110 66 104 66 90 Z M104 90 H134 C134 104 128 110 118 110 C108 110 104 104 104 90 Z" fill="#1B2240"/>
    <path d="M62 90 H138 M66 90 L56 87 M134 90 L144 87" stroke="#0E1226" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path d="M72 95 L82 95 M110 95 L120 95" stroke="#7FD1FF" stroke-width="3" stroke-linecap="round" stroke-opacity=".85"/>`},
  {id:"herzbrille", kat:"brille", name:"Herzbrille", emo:"😍", frei:{serie:7}, vg:() => `
    <path d="${herz(82, 99, 13)} ${herz(118, 99, 13)}" fill="#FF3D7F" fill-opacity=".85" stroke="#C2185B" stroke-width="3" stroke-linejoin="round"/>
    <path d="M94 95 C98 91 102 91 106 95 M68 94 L57 90 M132 94 L143 90" stroke="#C2185B" stroke-width="3" fill="none" stroke-linecap="round"/>${glanz(75, 94, 78, 91, 2)}${glanz(111, 94, 114, 91, 2)}`},
  {id:"sternbrille", kat:"brille", name:"Sternbrille", emo:"⭐", frei:{truhe:1, level:45}, vg:() => `
    <path d="${stern(82, 99, 16, 8)} ${stern(118, 99, 16, 8)}" fill="#FFD54A" fill-opacity=".92" stroke="#E08A00" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M95 96 C98 92 102 92 105 96 M67 94 L57 90 M133 94 L143 90" stroke="#E08A00" stroke-width="3" fill="none" stroke-linecap="round"/>`},
  {id:"ski", kat:"brille", name:"Skibrille", emo:"⛷️", frei:{level:15}, vg:u => `
    <defs>${verlauf(u + "s", ["#FFB347", "#E043B8", "#6A3FD6"], false)}</defs>
    <path d="M51 98 H149" stroke="#2F6BFF" stroke-width="7"/>
    <rect x="63" y="84" width="74" height="29" rx="14.5" fill="#fff" stroke="#B9C4DA" stroke-width="2"/>
    <rect x="67.5" y="88.5" width="65" height="20" rx="10" fill="url(#${u}s)"/>${glanz(74, 94, 90, 94, 3)}`},
  {id:"pixel", kat:"brille", name:"Pixelbrille", emo:"😎", frei:{truhe:1, level:55}, vg:() => `
    <path d="M60 88h80v6h-80z M64 94h32v8h-32z M104 94h32v8h-32z M68 102h24v5h-24z M108 102h24v5h-24z M96 94h8v4h-8z" fill="#111"/>
    <path d="M68 95h5v4h-5z M73 99h4v3h-4z M108 95h5v4h-5z M113 99h4v3h-4z" fill="#fff"/>`},

  /* --- Hals --- */
  {id:"fliege", kat:"hals", name:"Fliege", emo:"🎀", frei:{start:1}, vg:() => `
    <path d="M100 146 L79 133 C75 140 75 152 79 159 Z M100 146 L121 133 C125 140 125 152 121 159 Z" fill="#E8384F" stroke="#9E1830" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="86" cy="142" r="2" fill="#fff"/><circle cx="84" cy="151" r="2" fill="#fff"/><circle cx="114" cy="142" r="2" fill="#fff"/><circle cx="116" cy="151" r="2" fill="#fff"/>
    <rect x="94" y="140" width="12" height="12" rx="4" fill="#C42340" stroke="#9E1830" stroke-width="2"/>`},
  {id:"schal", kat:"hals", name:"Schal", emo:"🧣", frei:{level:4}, vg:u => `
    <defs><clipPath id="${u}c"><path d="M60 128 C80 146 120 146 140 128 L144 140 C122 162 78 162 56 140 Z M118 147 L132 149 L130 165 L116 163 Z"/></clipPath></defs>
    <g clip-path="url(#${u}c)"><rect x="50" y="120" width="100" height="60" fill="#E8384F"/>
    <path d="M72 136 L68 160 M88 140 L86 164 M112 140 L114 164 M128 136 L132 160 M110 154 L140 157 M110 160 L140 163" stroke="#fff" stroke-width="4"/></g>
    <path d="M60 128 C80 146 120 146 140 128 L144 140 C122 162 78 162 56 140 Z M118 147 L132 149 L130 165 L116 163 Z" fill="none" stroke="#9E1830" stroke-width="2" stroke-linejoin="round"/>
    <path d="M118 164 L117.5 169 M122 164.5 L121.5 169.5 M126 165 L126 170 M129.5 165.3 L129.8 170" stroke="#E8384F" stroke-width="2" stroke-linecap="round"/>`},
  {id:"medaille", kat:"hals", name:"Goldmedaille", emo:"🥇", frei:{level:10}, vg:u => `
    <defs>${verlauf(u + "m", ["#FFE680", "#F2A900"])}</defs>
    <path d="M78 126 L93 158 L101 158 L89 126 Z" fill="#2F6BFF"/><path d="M122 126 L107 158 L99 158 L111 126 Z" fill="#E8384F"/>
    <circle cx="100" cy="165" r="13" fill="url(#${u}m)" stroke="#B47A00" stroke-width="2.5"/><path d="${stern(100, 165.5, 7)}" fill="#FFF3B0" stroke="#D49B00" stroke-width="1"/>`},
  {id:"halstuch", kat:"hals", name:"Halstuch", emo:"🤠", frei:{serie:14}, vg:() => `
    <path d="M62 131 C84 142 116 142 138 131 L100 171 Z" fill="#2F6BFF" stroke="#173C9E" stroke-width="2" stroke-linejoin="round"/>
    ${[[80, 141], [100, 145], [120, 141], [91, 153], [109, 153], [100, 162]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#fff"/>`).join("")}
    <ellipse cx="62" cy="131" rx="5" ry="4" fill="#1E4FD1"/><ellipse cx="138" cy="131" rx="5" ry="4" fill="#1E4FD1"/>`},
  {id:"kette", kat:"hals", name:"Perlenkette", emo:"📿", frei:{truhe:1, level:50}, vg:() => {
    const fa = ["#FF6FA8", "#FFD54A", "#7FD1FF", "#7BE07B", "#B98CFF", "#FF8A3D"]; let s = `<path d="M64 128 Q100 168 136 128" stroke="#C9A97A" stroke-width="1.5" fill="none"/>`;
    for(let i = 0; i <= 12; i++){ const t = i / 12, x = (1 - t) * (1 - t) * 64 + 2 * (1 - t) * t * 100 + t * t * 136, y = (1 - t) * (1 - t) * 128 + 2 * (1 - t) * t * 168 + t * t * 128;
      s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${i === 6 ? 5.5 : 4}" fill="${fa[i % 6]}" stroke="#fff" stroke-width="1"/>`; }
    return s; }},
  {id:"glocke", kat:"hals", name:"Kuhglocke", emo:"🔔", frei:{level:25}, vg:u => `
    <defs>${verlauf(u + "g", ["#FFE07A", "#D4A017", "#A87A00"], false)}</defs>
    <path d="M58 128 C78 148 122 148 142 128 L144 138 C122 160 78 160 56 138 Z" fill="#8B4A1E" stroke="#5A2E10" stroke-width="2"/>
    ${[[72, 141], [86, 146.5], [114, 146.5], [128, 141]].map(([x, y]) => bluete(x, y, 3.2, "#fff", "#F2C94C")).join("")}
    <g class="xg-a-schw"><rect x="95" y="148" width="10" height="6" rx="2" fill="#5A2E10"/>
    <path d="M88 153 L112 153 L117 177 C117 181 83 181 83 177 Z" fill="url(#${u}g)" stroke="#8A6200" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="100" cy="181" r="3.5" fill="#5A3A1E"/>${glanz(92, 158, 89, 172, 2)}</g>`},

  /* --- Rahmen / Hintergrund --- */
  {id:"himmel", kat:"rahmen", name:"Himmel", emo:"☁️", frei:{start:1},
    hg:u => flaeche(u, ["#7CCBFF", "#E6F7FF"]) + `<ellipse cx="66" cy="132" rx="16" ry="8" fill="#fff"/><ellipse cx="76" cy="127" rx="10" ry="8" fill="#fff"/><ellipse cx="136" cy="70" rx="12" ry="6" fill="#fff" fill-opacity=".9"/>`,
    vg:() => ring("#5BB8F5", 5)},
  {id:"schweiz", kat:"rahmen", name:"Schweizer Fahne", emo:"🇨🇭", frei:{level:7},
    hg:() => `<rect x="40" y="40" width="120" height="120" fill="#E1251B"/><path d="M90 66h20v24h24v20h-24v24h-20v-24h-24v-20h24z" fill="#fff"/>`,
    vg:() => ring("#E1251B", 5) + `<circle cx="100" cy="100" r="55" fill="none" stroke="#fff" stroke-width="1.5"/>`},
  {id:"berge", kat:"rahmen", name:"Berge", emo:"⛰️", frei:{level:3},
    hg:u => flaeche(u, ["#8FD3FF", "#E9F8FF"]) + `<path d="M40 150 L74 100 L90 118 L114 88 L160 150 Z" fill="#7E8CB8"/><path d="M74 100 L66 112 L74 110 L80 114 Z M114 88 L104 102 L112 99 L118 104 L124 101 Z" fill="#fff"/><path d="M40 150 C70 128 120 128 160 146 L160 160 L40 160 Z" fill="#5CC36A"/>`,
    vg:() => ring("#6E7FB0", 5)},
  {id:"abend", kat:"rahmen", name:"Abendrot", emo:"🌇", frei:{level:6},
    hg:u => flaeche(u, ["#8A5BE0", "#FF7BA9", "#FFC86B"]) + `<circle cx="100" cy="132" r="20" fill="#FFE38A" fill-opacity=".85"/>`,
    vg:() => ring("#FF7BA9", 5)},
  {id:"regenbogen", kat:"rahmen", name:"Regenbogen", emo:"🌈", frei:{serie:5},
    hg:() => `<rect x="40" y="40" width="120" height="120" fill="#F2F8FF"/>${["#FF5A5A", "#FF9F40", "#FFD54A", "#59C96A", "#4A9BFF", "#8F64E8"].map((c, i) => `<circle cx="100" cy="152" r="${46 - i * 6}" fill="none" stroke="${c}" stroke-width="6.5"/>`).join("")}`,
    vg:() => { const L = 2 * Math.PI * 52.5, fa = ["#FF5A5A", "#FF9F40", "#FFD54A", "#59C96A", "#4A9BFF", "#8F64E8"];
      return fa.map((c, i) => `<circle cx="100" cy="100" r="52.5" fill="none" stroke="${c}" stroke-width="6" stroke-dasharray="${f1(L / 6 + .6)} ${f1(L)}" stroke-dashoffset="${f1(-i * L / 6)}" transform="rotate(-90 100 100)"/>`).join(""); }},
  {id:"sterne", kat:"rahmen", name:"Sternennacht", emo:"🌌", frei:{level:18},
    hg:u => flaeche(u, ["#1B2250", "#47308F"]) + `<path d="M132 60 A14 14 0 1 0 140 84 A11 11 0 1 1 132 60 Z" fill="#FFE38A"/>` +
      [[62, 66, 2.6], [80, 56, 1.6], [70, 88, 1.4], [148, 112, 2], [58, 120, 1.8], [138, 140, 1.5], [112, 58, 1.4], [86, 140, 1.3]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/>`).join("") + `<path d="${funke(150, 92, 4)}" fill="#fff"/>`,
    vg:() => ring("#2C2F7A", 5) + `<path d="${funke(146, 62, 5)}" fill="#FFE38A"/>`},
  {id:"gold", kat:"rahmen", name:"Goldrahmen", emo:"🖼️", frei:{level:40},
    hg:u => `<defs><radialGradient id="${u}r"><stop offset="0" stop-color="#FFFBEA"/><stop offset="1" stop-color="#FFE39A"/></radialGradient></defs><rect x="40" y="40" width="120" height="120" fill="url(#${u}r)"/>`,
    vg:u => `<defs>${verlauf(u + "o", ["#FFF0A8", "#E0A800", "#FFE07A", "#B47A00"])}</defs><circle cx="100" cy="100" r="53.5" fill="none" stroke="url(#${u}o)" stroke-width="7"/><circle cx="100" cy="100" r="50.2" fill="none" stroke="#B47A00" stroke-width="1.2"/><circle cx="100" cy="100" r="57" fill="none" stroke="#B47A00" stroke-width="1"/>` +
      [[62, 62, "#E8384F"], [138, 62, "#2F9BFF"], [62, 138, "#2FA84F"], [138, 138, "#B98CFF"]].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="4.5" fill="${c}" stroke="#fff" stroke-width="1.5"/>`).join("")},
  {id:"wiese", kat:"rahmen", name:"Blumenwiese", emo:"🌷", frei:{truhe:1, level:65},
    hg:u => flaeche(u, ["#A8E6FF", "#F0FBFF"]) + `<path d="M40 128 C70 116 120 116 160 126 L160 160 L40 160 Z" fill="#6CCB5F"/>` +
      [[62, 134, "#FF6FA8"], [78, 142, "#FFD54A"], [122, 140, "#B98CFF"], [140, 132, "#FF8A3D"], [100, 146, "#fff"]].map(([x, y, c]) => bluete(x, y, 4, c)).join(""),
    vg:() => ring("#57B84E", 5)},
  {id:"meer", kat:"rahmen", name:"Unterwasser", emo:"🐠", frei:{truhe:1, level:75},
    hg:u => flaeche(u, ["#5BC0F8", "#1565C0"]) + `<path d="M58 160 C54 146 64 138 58 124 M66 160 C70 148 62 140 68 128 M142 160 C146 146 136 138 142 126" stroke="#2FBF71" stroke-width="4" fill="none" stroke-linecap="round"/>` +
      [[70, 70, 4], [80, 60, 2.5], [134, 80, 3.5], [128, 66, 2]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="1.2"/>`).join(""),
    vg:() => ring("#1E88E5", 5)},

  /* --- Effekt --- */
  {id:"funkeln", kat:"effekt", name:"Funkeln", emo:"✨", frei:{level:5}, vg:() =>
    [[153, 55, 9, "#FFD54A", 0], [44, 72, 7, "#fff", .7], [161, 128, 6, "#fff", 1.3], [50, 142, 8, "#FFD54A", .4], [130, 36, 5, "#FFE680", 1]].map(([x, y, r, c, d]) =>
      `<path class="xg-a-puls" style="animation-delay:${d}s" d="${funke(x, y, r)}" fill="${c}" stroke="#E0A800" stroke-width=".8"/>`).join("")},
  {id:"herzen", kat:"effekt", name:"Herzchen", emo:"💕", frei:{serie:10}, vg:() =>
    [[152, 82, 6, 0], [47, 98, 5, 1.1], [157, 136, 4.5, 2], [44, 140, 5.5, .5], [138, 46, 4, 1.6]].map(([x, y, s, d]) =>
      `<path class="xg-a-schweb" style="animation-delay:${d}s" d="${herz(x, y, s)}" fill="#FF5FA2" stroke="#fff" stroke-width="1"/>`).join("")},
  {id:"sternkreis", kat:"effekt", name:"Sternenkreis", emo:"💫", frei:{level:50}, vg:() =>
    `<g class="xg-a-dreh">${Array.from({length:8}, (_, i) => { const a = i * Math.PI / 4, x = 100 + 63 * Math.cos(a), y = 100 + 63 * Math.sin(a);
      return `<path d="${stern(f1(x), f1(y), i % 2 ? 4 : 6)}" fill="${i % 2 ? "#FFFFFF" : "#FFD54A"}" stroke="#E0A800" stroke-width=".8"/>`; }).join("")}</g>`},
  {id:"noten", kat:"effekt", name:"Musiknoten", emo:"🎵", frei:{level:35}, vg:() =>
    [[150, 70, "#8A3FE0", 0], [46, 84, "#3D7BFE", .8], [156, 128, "#E043B8", 1.5]].map(([x, y, c, d]) =>
      `<g class="xg-a-wipp" style="animation-delay:${d}s"><path d="M${x} ${y} V${y - 14} L${x + 9} ${y - 17} V${y - 4}" stroke="${c}" stroke-width="2.4" fill="none" stroke-linejoin="round"/><ellipse cx="${x - 3}" cy="${y}" rx="4" ry="3" fill="${c}"/><ellipse cx="${x + 6}" cy="${y - 4}" rx="4" ry="3" fill="${c}"/></g>`).join("")},
  {id:"schnee", kat:"effekt", name:"Schneeflocken", emo:"❄️", frei:{truhe:1, level:80}, vg:() =>
    [[46, 60, 5, 0], [154, 66, 6, 1], [38, 118, 4, 2], [160, 120, 5, .5], [130, 34, 4, 1.6], [70, 34, 4.5, 2.4]].map(([x, y, r, d]) =>
      `<g class="xg-a-fall" style="animation-delay:${d}s"><path d="M${x - r} ${y} H${x + r} M${x} ${y - r} V${y + r} M${f1(x - r * .7)} ${f1(y - r * .7)} L${f1(x + r * .7)} ${f1(y + r * .7)} M${f1(x - r * .7)} ${f1(y + r * .7)} L${f1(x + r * .7)} ${f1(y - r * .7)}" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="${f1(r * .3)}" fill="#BFE6FF"/></g>`).join("")},
  {id:"blasen", kat:"effekt", name:"Seifenblasen", emo:"🫧", frei:{truhe:1, level:85}, vg:() =>
    [[150, 120, 7, 0], [44, 110, 5, 1.2], [158, 76, 4.5, 2], [52, 64, 6, .6], [134, 150, 4, 1.7]].map(([x, y, r, d]) =>
      `<g class="xg-a-steig" style="animation-delay:${d}s"><circle cx="${x}" cy="${y}" r="${r}" fill="#CDEBFF" fill-opacity=".45" stroke="#7FC4F5" stroke-width="1.2"/><path d="M${f1(x - r * .5)} ${f1(y - r * .2)} Q${f1(x - r * .45)} ${f1(y - r * .55)} ${f1(x - r * .1)} ${f1(y - r * .6)}" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round"/></g>`).join("")}
];
const TEIL = Object.fromEntries(TEILE.map(t => [t.id, t]));
const KATS = [["kopf", "Kopf", "🎩"], ["brille", "Brille", "👓"], ["hals", "Hals", "🎀"], ["rahmen", "Rahmen", "🖼️"], ["effekt", "Effekt", "✨"]];
const KAT_NAME = Object.fromEntries(KATS.map(k => [k[0], k[1]]));
const ORDNUNG_VG = ["rahmen", "hals", "kopf", "brille", "effekt"]; // Zeichenreihenfolge über dem Bild
/* Wie weit ein Teil über (oben, kleinstes y) bzw. unter (unten, grösstes y) den Avatar hinausragt; für enge Stellen wird verkleinert */
const AUSMASS = {muetze:[10], kappe:[28], schleife:[38], zipfel:[14], helm:[25], krone:[19], blumen:[36], zauber:[5], kopfhoerer:[28], edelweiss:[24], partyhut:[3], katzenohren:[23],
  fliege:[0, 161], schal:[0, 171], medaille:[0, 180], halstuch:[0, 173], kette:[0, 175], glocke:[0, 186]};

/* ---------- Zustand ---------- */
function stand(){
  let level = 1, serie = 0;
  try{ level = window.EP_LEVEL.stand().level || 1; }catch(e){}
  try{ const s = window.EP_LERNEN.serie(); serie = Math.max(+s.n || 0, +s.best || 0); }catch(e){}
  const r = LS.get(K.rekord, null) || {level:1, serie:0};
  if(level > (r.level || 0) || serie > (r.serie || 0)){ r.level = Math.max(level, r.level || 0); r.serie = Math.max(serie, r.serie || 0); LS.set(K.rekord, r); }
  return {level:Math.max(level, r.level || 1), serie:Math.max(serie, r.serie || 0)};
}
const truheListe = () => { const l = LS.get(K.truhe, []); return Array.isArray(l) ? l : []; };
function hat(t, st){
  st = st || stand(); const f = t.frei || {};
  if(f.start) return true;
  if(f.truhe && truheListe().includes(t.id)) return true;
  if(f.level && st.level >= f.level) return true;
  if(f.serie && st.serie >= f.serie) return true;
  return truheListe().includes(t.id);
}
function wieText(t){
  const f = t.frei || {};
  if(f.start) return "Von Anfang an";
  if(f.truhe) return f.level ? `Aus der Truhe oder ab Level ${f.level}` : "Aus der Truhe";
  if(f.serie) return `Ab ${f.serie} Tagen Serie`;
  if(f.level) return `Ab Level ${f.level}`;
  return "";
}
const wieKurz = t => { const f = t.frei || {}; return f.truhe ? "🎁 Truhe" : f.serie ? `🔥 ${f.serie} Tage` : f.level ? `Ab Level ${f.level}` : ""; };
function outfit(){
  const o = LS.get(K.an, {}) || {}, st = stand(), r = {};
  KATS.forEach(([k]) => { const t = TEIL[o[k]]; if(t && t.kat === k && hat(t, st)) r[k] = t.id; });
  return r;
}
const outfitKey = o => Object.keys(o).length ? KATS.map(([k]) => o[k] || "").join(",") : "";
const gesehen = () => { const l = LS.get(K.gesehen, []); return Array.isArray(l) ? l : []; };
function neuListe(){ const st = stand(), g = gesehen(); return TEILE.filter(t => hat(t, st) && !g.includes(t.id)); }

/* ---------- SVG bauen ---------- */
let uid = 0;
function svgVorne(o, sk, sh){
  const u = "xg" + (++uid) + "_";
  sk = sk || 1; sh = sh || 1; const se = Math.min(sk, sh);
  const gr = (k, x) => { const f = k === "kopf" ? sk : k === "hals" ? sh : k === "effekt" ? se : 1; return f < .999 ? `<g transform="translate(100 100) scale(${f1(f * 100) / 100}) translate(-100 -100)">${x}</g>` : x; };
  const inner = ORDNUNG_VG.map(k => { const t = TEIL[o[k]]; return t && t.vg ? gr(k, t.vg(u + k)) : ""; }).join("");
  return inner ? `<svg viewBox="0 0 200 200" aria-hidden="true" focusable="false">${inner}</svg>` : "";
}
function svgHinten(o){
  const t = TEIL[o.rahmen]; if(!t || !t.hg) return "";
  const u = "xg" + (++uid) + "_";
  return `<svg viewBox="50 50 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">${t.hg(u)}</svg>`;
}
const VB = {kopf:"26 0 148 148", brille:"44 52 112 112", hals:"44 96 112 112", rahmen:"38 38 124 124", effekt:"22 22 156 156"};
function teilBild(t){
  const u = "xgt" + (++uid) + "_";
  const geist = `<circle cx="100" cy="100" r="50" fill="#fff" fill-opacity=".28"/><circle cx="84" cy="99" r="3" fill="#1B2240" fill-opacity=".22"/><circle cx="116" cy="99" r="3" fill="#1B2240" fill-opacity=".22"/><path d="M90 118 Q100 125 110 118" stroke="#1B2240" stroke-opacity=".22" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
  let hg = "";
  if(t.hg) hg = `<defs><clipPath id="${u}k"><circle cx="100" cy="100" r="50"/></clipPath></defs><g clip-path="url(#${u}k)">${t.hg(u + "h")}</g>`;
  return `<svg viewBox="${VB[t.kat]}" aria-hidden="true" focusable="false">${hg || geist}${t.vg ? t.vg(u + "v") : ""}</svg>`;
}

/* Eigener Avatar (auch ohne Profil: Standard-Avatar der Stufe) */
function eigenerAvatarHTML(){
  try{
    const p = (typeof S !== "undefined" && S.profil) || null;
    let k = p && p.avatar;
    if(!k){ try{ k = levelAvatare((typeof S !== "undefined" && S.stufe) || 1)[0]; }catch(e){ k = "e0"; } }
    return avatar(k);
  }catch(e){ return `<img class="avimg" src="img/kids/m1.webp" alt="">`; }
}
/* Fertiger, geschmückter Avatar (Grösse in px oder CSS-Länge) */
function figurHTML(groesse, o){
  o = o || outfit();
  const g = typeof groesse === "number" ? groesse + "px" : (groesse || "64px");
  const hg = svgHinten(o), vg = svgVorne(o);
  return `<span class="xg-av xg-eigen" style="--xg-s:${g}" aria-hidden="true"><span class="xg-avbild">${eigenerAvatarHTML()}</span>${hg ? `<xg-hg class="xg-voll">${hg}</xg-hg>` : ""}${vg ? `<xg-vg class="xg-voll">${vg}</xg-vg>` : ""}</span>`;
}

/* ---------- Schmuck an fremden Stellen (nur der EIGENE Avatar) ---------- */
const ZIELE = [
  ["#navProfil .av"],
  ["#epTabs .tabav"],
  [".ap-konto .apav"],
  [".pst.ich .pav"],
  [".rrow.me .rav"],
  [".rkform .rkav"],
  [".duvs > div:first-child .pav"],
  ["#prevAv"],
  ["#app .pagehead:not(.spkopf) .bigav", () => typeof S !== "undefined" && S.screen === "profil"]
];
const istMeins = n => n && n.nodeType === 1 && (/^XG-/.test(n.tagName) || (n.classList && (n.classList.contains("xg-eigen") || n.classList.contains("xg-tag"))));
function bildIn(C){
  for(const e of C.querySelectorAll(".avimg, .av-ic, img, svg")){ if(!e.closest("xg-vg, xg-hg, .xg-eigen")) return e; }
  return null;
}
function radiusPx(v, w){ v = String(v || "0").split(" ")[0]; return v.endsWith("%") ? parseFloat(v) * w / 100 : parseFloat(v) || 0; }
function entfernen(C){
  C.querySelectorAll(":scope > xg-hg, :scope > xg-vg").forEach(e => e.remove());
  C.querySelectorAll("[data-xg-clip]").forEach(e => { e.style.clipPath = e.dataset.xgClip === "-" ? "" : e.dataset.xgClip; delete e.dataset.xgClip; });
  C.classList.remove("xg-an", "xg-rel"); delete C.dataset.xg;
}
function schmuecke(C, o, key){
  if(C.closest(".xg-eigen")) return;
  if(!key){ if(C.dataset.xg || C.classList.contains("xg-an") || C.querySelector(":scope > xg-vg, :scope > xg-hg")) entfernen(C); return; }
  const cR = C.getBoundingClientRect();
  if(cR.width < 4 || cR.height < 4 || !C.offsetWidth) return;     // gerade unsichtbar
  const A = bildIn(C); if(!A) return;
  const cs = getComputedStyle(C);
  if(cs.display === "inline") return;
  const sc = cR.width / C.offsetWidth || 1;
  const w = C.offsetWidth, hh = C.offsetHeight, bl = C.clientLeft, bt = C.clientTop;
  const rund = Math.abs(w - hh) < 2 && radiusPx(cs.borderTopLeftRadius, w) >= w * .4;
  const aR = A.getBoundingClientRect();
  let x0, y0, d, hx, hy, hd;
  if(rund){ x0 = -bl; y0 = -bt; d = w; hx = 0; hy = 0; hd = C.clientWidth; }
  else { const aw = aR.width / sc, ah = aR.height / sc; d = Math.min(aw, ah);
    x0 = (aR.left - cR.left) / sc - bl + (aw - d) / 2; y0 = (aR.top - cR.top) / sc - bt + (ah - d) / 2; hx = x0; hy = y0; hd = d; }
  if(d < 4) return;
  /* Platz bis zum nächsten abschneidenden Vorfahren: Kopf- und Halsteile bei Bedarf verkleinern, damit nichts abgeschnitten wird */
  let o2 = o;
  if(o.kopf && C.parentElement && C.parentElement.querySelector(":scope > .pkrone")) { o2 = Object.assign({}, o); delete o2.kopf; }  // Podest hat schon eine Krone
  let sk = 1, sh = 1;
  try{
    const top = cR.top + (y0 + bt) * sc, bot = top + d * sc;
    let oben = Infinity, unten = Infinity;
    for(let a = C.parentElement; a && a !== document.body && a !== document.documentElement; a = a.parentElement){
      const as = getComputedStyle(a);
      if(as.overflowX === "visible" && as.overflowY === "visible" && as.overflow !== "clip") continue;
      const r = a.getBoundingClientRect();
      oben = Math.min(oben, top - (r.top + a.clientTop - a.scrollTop));
      unten = Math.min(unten, (r.top + a.clientTop - a.scrollTop + Math.max(a.scrollHeight, a.clientHeight)) - bot);
    }
    const dpx = d * sc;
    const yt = o2.kopf && AUSMASS[o2.kopf] ? AUSMASS[o2.kopf][0] : 50, yb = o2.hals && AUSMASS[o2.hals] ? AUSMASS[o2.hals][1] : 150;
    if(isFinite(oben) && yt < 50) sk = Math.max(.6, Math.min(1, (Math.max(0, oben - 1) * 100 / dpx + 50) / (100 - yt)));
    if(isFinite(unten) && yb > 150) sh = Math.max(.6, Math.min(1, (Math.max(0, unten - 1) * 100 / dpx + 50) / (yb - 100)));
  }catch(e){}
  const sig = key + "|" + [x0, y0, d, hd].map(n => Math.round(n)).join(",") + "|" + f1(sk) + "," + f1(sh) + (o2 === o ? "" : "|ok");
  if(C.dataset.xg === sig) return;
  const war = C.dataset.xg;
  entfernen(C);
  if(cs.position === "static" && !war) C.classList.add("xg-rel");
  else if(war && getComputedStyle(C).position === "static") C.classList.add("xg-rel");
  C.classList.add("xg-an");
  /* Weil overflow jetzt sichtbar ist: Bilder, die grösser als der runde Rahmen sind (z. B. Leiste unten), selbst rund zuschneiden */
  const ovf = war ? "hidden" : cs.overflow;
  if(ovf !== "visible" && rund){
    const ix = cR.left + (bl + C.clientWidth / 2) * sc, iy = cR.top + (bt + C.clientHeight / 2) * sc;
    const ueber = aR.left < cR.left + bl * sc - 1 || aR.top < cR.top + bt * sc - 1 || aR.right > cR.left + (bl + C.clientWidth) * sc + 1 || aR.bottom > cR.top + (bt + C.clientHeight) * sc + 1;
    const ri = Math.min(C.clientWidth, C.clientHeight) / 2;
    const aw0 = A.offsetWidth || (A.width && A.width.baseVal ? A.width.baseVal.value : 0) || aR.width;
    const as = aR.width / aw0 || sc;
    A.dataset.xgClip = A.style.clipPath || "-";
    A.style.clipPath = ueber ? `circle(${f1(ri * sc / as)}px at ${f1((ix - aR.left) / as)}px ${f1((iy - aR.top) / as)}px)` : "circle(50%)";
  }
  const hgS = svgHinten(o2), vgS = svgVorne(o2, sk, sh);
  if(hgS){ const e = document.createElement("xg-hg"); e.setAttribute("aria-hidden", "true");
    e.style.cssText = `left:${f1(hx)}px;top:${f1(hy)}px;width:${f1(hd)}px;height:${f1(hd)}px`; e.innerHTML = hgS; C.insertBefore(e, C.firstChild); }
  if(vgS){ const e = document.createElement("xg-vg"); e.setAttribute("aria-hidden", "true");
    e.style.cssText = `left:${f1(x0 - d / 2)}px;top:${f1(y0 - d / 2)}px;width:${f1(2 * d)}px;height:${f1(2 * d)}px`; e.innerHTML = vgS; C.appendChild(e); }
  C.dataset.xg = sig;
}
/* Kleiner geschmückter Avatar im Widget «Dein Tag» (Startseite Computer) */
function tagAvatar(o, key){
  const w = document.querySelector("#app .ep-w.eptl"); if(!w) return;
  let b = w.querySelector(":scope > .xg-tag");
  if(!b){ b = document.createElement("button"); b.type = "button"; b.className = "xg-tag"; b.title = "Garderobe: Avatar schmücken";
    b.setAttribute("aria-label", "Garderobe öffnen und Avatar schmücken"); b.onclick = () => { ton("klick"); try{ go("x-garderobe"); }catch(e){} }; w.appendChild(b); }
  const n = neuListe().length;
  const sig = key + "|" + ((typeof S !== "undefined" && S.profil && S.profil.avatar) || "") + "|" + n;
  if(b.dataset.sig !== sig){ b.innerHTML = figurHTML(46, o) + (n ? `<i class="xg-tagneu">${n} neu</i>` : ""); b.dataset.sig = sig; }
}
let geplant = false, alleNeu = false;
function scan(){
  geplant = false;
  try{
    const o = outfit(), key = outfitKey(o);
    const gef = new Set();
    ZIELE.forEach(([sel, wenn]) => { if(wenn && !wenn()) return; document.querySelectorAll(sel).forEach(C => gef.add(C)); });
    document.querySelectorAll(".xg-an, [data-xg]").forEach(C => { if(!gef.has(C)) entfernen(C); });
    gef.forEach(C => { if(alleNeu && C.dataset.xg) C.dataset.xg = "neu"; schmuecke(C, o, key); });
    alleNeu = false;
    tagAvatar(o, key);
    if(rO) gef.forEach(C => { if(!C.__xgRO){ C.__xgRO = 1; try{ rO.observe(C); }catch(e){} } });
  }catch(e){ console.warn("garderobe scan", e); }
}
function planen(neu){ if(neu) alleNeu = true; if(geplant) return; geplant = true; requestAnimationFrame(scan); }
const rO = typeof ResizeObserver === "function" ? new ResizeObserver(() => planen(true)) : null;
function beobachten(){
  try{
    new MutationObserver(ms => {
      for(const m of ms){
        if(istMeins(m.target) || (m.target.closest && m.target.closest("xg-vg, xg-hg, .xg-eigen, .xg-tag"))) continue;
        const nodes = [...m.addedNodes, ...m.removedNodes];
        if(nodes.length && nodes.every(n => istMeins(n) || (n.nodeType === 3 && !n.textContent.trim()))) continue;
        planen(); return;
      }
    }).observe(document.body, {childList:true, subtree:true});
  }catch(e){}
  addEventListener("resize", () => planen(true));
  planen();
}

/* ---------- Neue Teile melden (z. B. nach einem Level-Aufstieg) ---------- */
function melden(still){
  const st = stand(), g = LS.get(K.gemeldet, null);
  const besitz = TEILE.filter(t => hat(t, st)).map(t => t.id);
  if(!Array.isArray(g)){ LS.set(K.gemeldet, besitz); return; }
  const neu = besitz.filter(id => !g.includes(id));
  if(!neu.length) return;
  LS.set(K.gemeldet, g.concat(neu));
  planen(true);
  if(still) return;
  const t = TEIL[neu[0]];
  toast(neu.length === 1 ? `Neu in der Garderobe: ${t.emo} ${t.name}` : `${neu.length} neue Teile in der Garderobe!`);
  ton("freischalten");
}
function toast(text){
  try{ document.querySelectorAll(".x-toast").forEach(e => e.remove());
    const d = document.createElement("div"); d.className = "x-toast"; d.setAttribute("role", "status"); d.textContent = text;
    document.body.appendChild(d); requestAnimationFrame(() => d.classList.add("an"));
    setTimeout(() => { d.classList.remove("an"); setTimeout(() => d.remove(), 400); }, 2800); }catch(e){}
}
document.addEventListener("ep:quizende", () => setTimeout(() => melden(false), 900));

/* ---------- Öffentliche Schnittstelle ---------- */
window.EP_GARDEROBE = {
  /* Gibt ein noch nicht vorhandenes Teil (z. B. aus einer Truhe). Mit id: genau dieses, falls noch nicht vorhanden.
     Rückgabe {id, name, emo, kat} oder null */
  teilGeben(id){
    try{
      const st = stand(), l = truheListe();
      let t = null;
      if(id){ t = TEIL[id]; if(!t || hat(t, st)) return null; }
      else {
        const truhe = TEILE.filter(x => x.frei.truhe && !hat(x, st));
        const rest = TEILE.filter(x => !x.frei.truhe && !hat(x, st)).sort((a, b) => ((a.frei.level || a.frei.serie * 5 || 0) - (b.frei.level || b.frei.serie * 5 || 0)));
        const pool = truhe.length ? truhe : rest.slice(0, 3);
        if(!pool.length) return null;
        t = pool[Math.floor(Math.random() * pool.length)];
      }
      l.push(t.id); LS.set(K.truhe, l);
      const g = LS.get(K.gemeldet, null); if(Array.isArray(g) && !g.includes(t.id)){ g.push(t.id); LS.set(K.gemeldet, g); }
      planen(true);
      return {id:t.id, name:t.name, emo:t.emo, kat:t.kat};
    }catch(e){ return null; }
  },
  anzahl(){ const st = stand(); return {hat:TEILE.filter(t => hat(t, st)).length, alle:TEILE.length}; },
  /* HTML eines geschmückten eigenen Avatars, z. B. dekoHTML(48) */
  dekoHTML(groesse){ return figurHTML(groesse || 64); },
  /* Was gerade getragen wird: {kopf:"krone", …} */
  aktuell(){ return outfit(); },
  teile(){ const st = stand(); return TEILE.map(t => ({id:t.id, name:t.name, emo:t.emo, kat:t.kat, hat:hat(t, st), wie:wieText(t)})); },
  neu(){ return neuListe().length; },
  /* Alle Avatare neu schmücken (z. B. nach eigenem DOM-Umbau) */
  auffrischen(){ planen(true); }
};

/* ---------- Stil ---------- */
const css = document.createElement("style"); css.id = "ep-x-garderobe";
css.textContent = `
.xg-an{overflow:visible!important;isolation:isolate}
.xg-rel{position:relative!important}
xg-hg,xg-vg{position:absolute;display:block;pointer-events:none;margin:0;padding:0;border:0;background:none;box-sizing:border-box}
xg-hg{border-radius:50%;overflow:hidden;z-index:-1}
xg-vg{z-index:3}
xg-hg>svg,xg-vg>svg{position:absolute;left:0;top:0;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;min-width:0!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;transform:none!important;overflow:visible!important;display:block!important;background:none!important;filter:none!important;clip-path:none!important;object-fit:fill!important}
xg-hg>svg{overflow:hidden!important}
xg-hg.xg-voll{left:0;top:0;width:100%;height:100%}
xg-vg.xg-voll{left:-50%;top:-50%;width:200%;height:200%}
.xg-av{position:relative;display:inline-block;width:var(--xg-s);height:var(--xg-s);isolation:isolate;flex:none;vertical-align:middle;line-height:0}
.xg-avbild{position:absolute;inset:0;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.92)}
.xg-av:has(xg-hg) .xg-avbild{background:transparent}
.xg-avbild img,.xg-avbild svg{width:100%!important;height:100%!important;object-fit:cover;display:block;border-radius:50%;background:none!important;margin:0!important;padding:0!important}
@keyframes xgPuls{0%,100%{transform:scale(.55);opacity:.45}50%{transform:scale(1.1);opacity:1}}
@keyframes xgSchweb{0%{transform:translateY(6px);opacity:0}25%{opacity:1}100%{transform:translateY(-16px);opacity:0}}
@keyframes xgDreh{to{transform:rotate(360deg)}}
@keyframes xgFall{0%{transform:translateY(-10px);opacity:0}25%{opacity:1}100%{transform:translateY(18px);opacity:0}}
@keyframes xgSteig{0%{transform:translateY(10px) scale(.6);opacity:0}30%{opacity:.95}100%{transform:translateY(-18px) scale(1);opacity:0}}
@keyframes xgWipp{0%,100%{transform:translateY(0) rotate(-7deg)}50%{transform:translateY(-4px) rotate(7deg)}}
@keyframes xgSchw{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(7deg)}}
.xg-a-puls{transform-box:fill-box;transform-origin:center;animation:xgPuls 2.4s ease-in-out infinite}
.xg-a-schweb{transform-box:fill-box;transform-origin:center;animation:xgSchweb 3.4s ease-in infinite}
.xg-a-dreh{transform-box:view-box;transform-origin:100px 100px;animation:xgDreh 24s linear infinite}
.xg-a-fall{animation:xgFall 3.6s linear infinite}
.xg-a-steig{transform-box:fill-box;transform-origin:center;animation:xgSteig 3.8s ease-out infinite}
.xg-a-wipp{transform-box:fill-box;transform-origin:center;animation:xgWipp 2.2s ease-in-out infinite}
.xg-a-schw{transform-box:fill-box;transform-origin:50% 0;animation:xgSchw 2.6s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.xg-a-puls,.xg-a-schweb,.xg-a-dreh,.xg-a-fall,.xg-a-steig,.xg-a-wipp,.xg-a-schw{animation:none!important;opacity:1!important;transform:none!important}}

/* Dein Tag (Startseite Computer) */
.ep-w.eptl:has(> .xg-tag){position:relative}
.xg-tag{position:absolute;top:20px;right:18px;border:0;background:none;padding:0;cursor:pointer;border-radius:50%;line-height:0;z-index:2}
.xg-tag:focus-visible{outline:3px solid #8A3FE0;outline-offset:4px}
.xg-tag .xg-avbild{box-shadow:0 0 0 2px #fff,0 6px 14px -6px rgba(27,34,64,.45)}
.xg-tagneu{position:absolute;right:-14px;bottom:-6px;font:800 .62rem/1 "Lexend",system-ui,sans-serif;font-style:normal;background:#FFE34D;color:#1B2240;border-radius:999px;padding:3px 6px;box-shadow:0 2px 6px rgba(0,0,0,.2);z-index:4;white-space:nowrap}

/* Seite x-garderobe */
.xg-seite{display:grid;gap:12px;grid-template-columns:minmax(0,1fr);max-width:1100px;margin:0 auto}
.xg-kopf{position:relative;display:flex;align-items:center;gap:16px;padding:14px 18px;border-radius:26px;color:#fff;background:linear-gradient(135deg,#E043B8,#8A3FE0 55%,#3D5AFE);box-shadow:0 14px 30px rgba(60,40,140,.25);min-width:0}
.xg-buehne{--xg-gross:92px;flex:none;display:grid;place-items:center;width:calc(var(--xg-gross) * 1.45);height:calc(var(--xg-gross) * 1.45);padding-top:calc(var(--xg-gross) * .18);box-sizing:border-box}
.xg-buehne .xg-avbild{box-shadow:0 0 0 3px rgba(255,255,255,.95),0 12px 24px -10px rgba(20,10,60,.6)}
.xg-info{min-width:0;flex:1}
.xg-info h1{margin:0;font-size:clamp(1.35rem,4.5vw,2rem);color:#fff;line-height:1.1}
.xg-info p{margin:4px 0 0;color:#fff;opacity:.95;font-size:.9rem;line-height:1.3}
.xg-unten{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:8px}
.xg-zahl{display:inline-block;background:rgba(15,20,48,.3);padding:5px 10px;border-radius:999px;font-weight:700;font-size:.8rem;color:#fff}
.xg-ab{border:0;border-radius:999px;padding:8px 14px;font:700 .84rem "Lexend",system-ui,sans-serif;background:#fff;color:#5B2BB5;cursor:pointer;box-shadow:0 6px 14px -8px rgba(0,0,0,.5);min-height:40px}
.xg-ab:disabled{opacity:.6;cursor:default}
.xg-ab:focus-visible,.xg-reiter button:focus-visible,.xg-teil:focus-visible{outline:3px solid #FFE34D;outline-offset:2px}
.xg-rechts{display:grid;gap:10px;min-width:0;align-content:start}
.xg-reiter{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:5px;background:rgba(15,20,48,.55);padding:5px;border-radius:20px;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.xg-reiter button{position:relative;border:0;border-radius:15px;background:none;color:#fff;font:700 .78rem "Lexend",system-ui,sans-serif;padding:6px 2px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:1px;min-height:44px;min-width:0}
.xg-reiter button span{font-size:1.1rem;line-height:1.1}
.xg-reiter button small{font-size:.64rem;opacity:.85;font-weight:600}
.xg-reiter button[aria-selected="true"]{background:linear-gradient(135deg,#3D5AFE,#8A3FE0 60%,#E043B8);box-shadow:0 6px 14px -8px rgba(0,0,0,.6)}
.xg-reiter i{position:absolute;top:4px;right:8px;width:8px;height:8px;border-radius:50%;background:#FFE34D;box-shadow:0 0 0 2px rgba(15,20,48,.6)}
.xg-raster{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.xg-teil{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;border:0;border-radius:20px;padding:6px 4px 7px;cursor:pointer;color:#fff;min-width:0;background:linear-gradient(160deg,#5B6CFF,#8A3FE0);box-shadow:0 8px 16px -10px rgba(27,34,64,.55);transition:transform .12s;font-family:"Lexend",system-ui,sans-serif}
.xg-teil:nth-child(4n+2){background:linear-gradient(160deg,#1E9BE0,#3D5AFE)}
.xg-teil:nth-child(4n+3){background:linear-gradient(160deg,#E043B8,#8A3FE0)}
.xg-teil:nth-child(4n+4){background:linear-gradient(160deg,#0FA968,#0B7E8A)}
.xg-teil:hover{transform:translateY(-2px)}
.xg-teil svg{width:100%;max-width:56px;aspect-ratio:1;height:auto;display:block}
.xg-teil b{font-size:.72rem;line-height:1.15;color:#fff;text-align:center;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.xg-teil small{font-size:.62rem;color:#fff;opacity:.92;line-height:1.1;text-align:center;white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis}
.xg-teil[aria-pressed="true"]{box-shadow:0 0 0 3px #FFE34D,0 8px 16px -8px rgba(27,34,64,.6)}
.xg-teil[aria-pressed="true"]::after{content:"✓";position:absolute;top:5px;left:7px;width:20px;height:20px;border-radius:50%;background:#FFE34D;color:#1B2240;font:900 .75rem/20px system-ui;text-align:center}
.xg-teil.zu{background:linear-gradient(160deg,#5A6185,#3B4066)!important}
.xg-teil.zu svg{opacity:.5;filter:grayscale(.7)}
.xg-teil.zu::before{content:"🔒";position:absolute;top:5px;right:7px;font-size:.8rem}
.xg-neu{position:absolute;top:5px;right:6px;font-style:normal;background:#FFE34D;color:#1B2240;font-weight:800;font-size:.6rem;padding:2px 6px;border-radius:999px}
.xg-tipp{margin:0;color:#fff;background:rgba(15,20,48,.55);padding:8px 14px;border-radius:16px;font-size:.82rem;line-height:1.35}
@media (min-width:700px){
  .xg-raster{grid-template-columns:repeat(6,minmax(0,1fr))}
  .xg-buehne{--xg-gross:112px}
}
@media (min-width:1000px){
  .xg-seite{grid-template-columns:330px minmax(0,1fr);align-items:start}
  .xg-kopf{flex-direction:column;text-align:center;padding:24px 20px 22px;position:sticky;top:12px}
  .xg-unten{justify-content:center}
  .xg-buehne{--xg-gross:150px}
  .xg-raster{grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
  .xg-teil svg{max-width:80px}
  .xg-reiter button{font-size:.92rem;min-height:56px}.xg-reiter button span{font-size:1.45rem}.xg-reiter button small{font-size:.74rem}
  .xg-teil b{font-size:.86rem}.xg-teil small{font-size:.72rem}
}
@media (min-width:1300px){.xg-raster{grid-template-columns:repeat(5,minmax(0,1fr))}}
@media (max-width:380px){
  .xg-kopf{gap:10px;padding:12px 14px}
  .xg-buehne{--xg-gross:80px}
  .xg-info p.xg-txt{font-size:.82rem}
  .xg-teil svg{max-width:50px}
}
@media (max-height:780px) and (max-width:699px){.xg-tipp{display:none}}
`;
document.head.appendChild(css);

/* ---------- Seite ---------- */
let reiter = LS.get(K.reiter, "kopf"); if(!KAT_NAME[reiter]) reiter = "kopf";
function seite(box){
  const st = stand(), g = gesehen();
  const neuJetzt = TEILE.filter(t => hat(t, st) && !g.includes(t.id)).map(t => t.id);
  const az = window.EP_GARDEROBE.anzahl();
  const waehle = (k, fokus) => { reiter = k; LS.set(K.reiter, reiter); zeichne(); if(fokus) box.querySelector(`#xgR-${k}`)?.focus(); };
  const zeichne = () => {
    const o2 = outfit(), st2 = stand(), leer = !Object.keys(o2).length;
    box.querySelector(".xg-buehne").innerHTML = figurHTML("var(--xg-gross)", o2);
    box.querySelector(".xg-ab").disabled = leer;
    box.querySelector(".xg-reiter").innerHTML = KATS.map(([k, n, e]) => { const l = TEILE.filter(t => t.kat === k);
      return `<button type="button" role="tab" id="xgR-${k}" aria-controls="xgRaster" aria-selected="${k === reiter}" tabindex="${k === reiter ? 0 : -1}" data-k="${k}"><span aria-hidden="true">${e}</span>${n}<small>${l.filter(t => hat(t, st2)).length}/${l.length}</small>${l.some(t => neuJetzt.includes(t.id)) && k !== reiter ? `<i aria-hidden="true"></i>` : ""}</button>`; }).join("");
    const raster = box.querySelector(".xg-raster");
    raster.setAttribute("aria-labelledby", "xgR-" + reiter);
    raster.innerHTML = TEILE.filter(t => t.kat === reiter).map(t => { const da = hat(t, st2), an = o2[t.kat] === t.id;
      return `<button type="button" class="xg-teil${da ? "" : " zu"}" data-id="${t.id}" aria-pressed="${an}" aria-label="${h(t.name)}${da ? (an ? ", angezogen" : "") : ", gesperrt, " + h(wieText(t))}">${teilBild(t)}<b>${h(t.name)}</b><small>${da ? (an ? "Angezogen" : "Anziehen") : h(wieKurz(t))}</small>${da && neuJetzt.includes(t.id) && !an ? `<i class="xg-neu">Neu</i>` : ""}</button>`; }).join("");
    box.querySelectorAll(".xg-reiter [data-k]").forEach(b => {
      b.onclick = () => { if(reiter === b.dataset.k) return; ton("wisch"); waehle(b.dataset.k, true); };
      b.onkeydown = ev => { if(ev.key !== "ArrowRight" && ev.key !== "ArrowLeft") return; ev.preventDefault();
        const i = KATS.findIndex(k => k[0] === reiter); waehle(KATS[(i + (ev.key === "ArrowRight" ? 1 : KATS.length - 1)) % KATS.length][0], true); };
    });
    raster.querySelectorAll(".xg-teil").forEach(b => b.onclick = () => {
      const t = TEIL[b.dataset.id]; if(!t) return;
      if(!hat(t, stand())){ ton("fehler"); toast(`${t.emo} ${t.name}: ${wieText(t)}`); return; }
      const a = LS.get(K.an, {}) || {};
      if(a[t.kat] === t.id){ delete a[t.kat]; ton("klick"); }
      else { a[t.kat] = t.id; ton("sammeln"); }
      LS.set(K.an, a); zeichne(); planen(true);
      box.querySelector(`.xg-teil[data-id="${t.id}"]`)?.focus();
    });
  };
  box.innerHTML = `<div class="xg-seite">
    <section class="xg-kopf" aria-label="Vorschau deines Avatars">
      <div class="xg-buehne"></div>
      <div class="xg-info"><h1>Garderobe</h1><p class="xg-txt">Schmück dein Profilbild mit Mützen, Brillen und mehr.</p>
        <div class="xg-unten"><span class="xg-zahl">${az.hat} von ${az.alle} Teilen</span><button type="button" class="xg-ab">🧺 Alles ablegen</button></div></div>
    </section>
    <div class="xg-rechts">
      <div class="xg-reiter" role="tablist" aria-label="Kategorien"></div>
      <div class="xg-raster" id="xgRaster" role="tabpanel"></div>
      <p class="xg-tipp">💡 Neue Teile gibt es mit jedem Level, mit deiner Serie und in Truhen. Antippen zum Anziehen, nochmals antippen zum Ablegen.</p>
    </div></div>`;
  box.querySelector(".xg-ab").onclick = () => { LS.set(K.an, {}); ton("wisch"); toast("Alles abgelegt"); zeichne(); planen(true); };
  zeichne();
  LS.set(K.gesehen, Array.from(new Set(g.concat(neuJetzt))));
  melden(true);
}

/* ---------- Anmelden ---------- */
function anmelden(){
  if(!window.EP_EXTRAS || typeof window.EP_EXTRAS.register !== "function") return false;
  window.EP_EXTRAS.register({
    id:"garderobe", titel:"Garderobe", text:"Schmück dein Profilbild mit Mützen, Brillen und mehr", emo:"👒",
    farbe:"linear-gradient(135deg,#E043B8,#8A3FE0 60%,#3D5AFE)", reihe:30,
    hinweis(){ const n = neuListe().length; return n ? `${n} neu` : ""; },
    folie(){ const n = neuListe().length; if(!n) return null;
      return {cls:"hs-x", ic:"👒", lbl:"Garderobe", titel:n === 1 ? "Ein neues Teil!" : `${n} neue Teile!`, text:"Schmück dein Profilbild mit Mützen, Brillen und Rahmen.", btn:"👒 Anprobieren", a:"x-garderobe"}; },
    render(box){ seite(box); }
  });
  return true;
}
if(!anmelden()) document.addEventListener("DOMContentLoaded", anmelden);
if(document.body) beobachten(); else document.addEventListener("DOMContentLoaded", beobachten);
addEventListener("load", () => { melden(true); planen(true); });
})();
