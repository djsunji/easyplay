/* easyplay · duell2.js
   Duell-Menü neu: Online zuerst, kompakt, Einstellungen als Untermenü.
   Online sucht per Zufall einen Gegner, der gerade auch spielen will (Supabase, supabase/duell.sql).
   Findet sich innert 20 Sekunden niemand oder gibt es kein Supabase, spielt Leni oder Ben als Übungsgegner.
   Im Spiel sieht man Name, Fortschritt sowie richtige und falsche Antworten des Gegners.
   Team Lumi oder Milo: gewählte Kachel färbt sich, das Kind leuchtet. Läuft nach app.js und stil.js. */
(function(){
"use strict";
if(typeof window.renderDuell !== "function" || typeof DU === "undefined") return;
const KIDS = "img/kids/";
const h = s => { try{ return esc(s); }catch(e){ return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); } };
const ES = () => window.EP_START || {};
const an = () => !!(window.EP_APP && window.EP_APP.an());
const LS = { get(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } }, set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} } };
const team = () => { try{ return ES().team(); }catch(e){ return null; } };
const BOTS = [{name:"Leni", bild:"leni.webp", c:"#E8364F"}, {name:"Ben", bild:"ben.webp", c:"#12A57F"}];

/* ---------- Elo und Ligen: gewinnen bringt Punkte, Gegner passen sich der Stärke an ---------- */
const LIGEN = [
  {id:"bronze", n:"Bronze", min:0, e:"🥉", c:"#C07A3A"},
  {id:"silber", n:"Silber", min:900, e:"🥈", c:"#8A97B0"},
  {id:"gold", n:"Gold", min:1100, e:"🥇", c:"#E2A400"},
  {id:"platin", n:"Platin", min:1300, e:"💠", c:"#22A9BB"},
  {id:"diamant", n:"Diamant", min:1500, e:"💎", c:"#5B7CFF"},
  {id:"champion", n:"Champion", min:1700, e:"👑", c:"#E043B8"}
];
const ELO_START = 1000;
function eloDaten(){ const d = LS.get("ep-elo", null); return d && typeof d.r === "number" ? d : {r:ELO_START, n:0, s:0, u:0, v:0, hist:[]}; }
function liga(r){ let l = LIGEN[0]; for(const x of LIGEN) if(r >= x.min) l = x; return l; }
const naechsteLiga = r => LIGEN.find(x => x.min > r) || null;
const eloErwartet = (r, g) => 1 / (1 + Math.pow(10, (g - r) / 400));
function eloBuchen(gegElo, sp, name){
  const d = eloDaten(), K = d.n < 10 ? 40 : 24;
  let delta = Math.round(K * (sp - eloErwartet(d.r, gegElo)));
  if(sp === 1 && delta < 1) delta = 1; if(sp === 0 && delta > -1) delta = -1;
  const alt = d.r, neu = Math.max(100, alt + delta);
  d.r = neu; d.n++; if(sp === 1) d.s++; else if(sp === 0) d.v++; else d.u++;
  d.hist = [{t:Date.now(), alt, neu, g:String(name || "").slice(0, 30), ge:gegElo, sp}, ...(d.hist || [])].slice(0, 30);
  LS.set("ep-elo", d);
  return {alt, neu, delta:neu - alt, la:liga(alt), ln:liga(neu)};
}
function ligaChip(r){ const l = liga(r); return `<span class="du2-liga" style="--lc:${l.c}">${l.e} ${l.n} · ${r}</span>`; }
// Übungsgegner: Stärke nahe an der eigenen Wertung, damit es spannend bleibt
const botElo = () => Math.max(500, Math.min(2200, Math.round(eloDaten().r + (Math.random() * 160 - 80))));
const botQuote = e => Math.max(0.3, Math.min(0.95, 0.3 + (e - 600) / 1600 * 0.65));
const botTempo = e => { const max = Math.max(3500, 10000 - (e - 600) * 4); return 1800 + Math.random() * (max - 1800); };

/* ---------- Gestaltung ---------- */
const css = document.createElement("style"); css.id = "ep-duell2-css";
css.textContent = `
.du2{max-width:1100px;margin:0 auto;display:flex;flex-direction:column;gap:14px}
.du2-modi{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.du2-m{position:relative;display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px;border:0;border-radius:28px;padding:22px 18px 18px;color:#fff;cursor:pointer;font-family:inherit;overflow:hidden;transition:transform .15s;
  background:radial-gradient(circle at 2px 2px,rgba(255,255,255,.18) 1.5px,transparent 0) 0 0/18px 18px,linear-gradient(150deg,var(--a),var(--b));box-shadow:0 7px 0 var(--s),0 22px 34px -22px var(--b)}
.du2-m:hover{transform:translateY(-3px)}.du2-m:active{transform:translateY(4px);box-shadow:0 3px 0 var(--s)}
.du2-m.online{--a:#2FD1A7;--b:#12A57F;--s:#075A46}
.du2-m.geraet{--a:#5B7CFF;--b:#3D5AFE;--s:#22309A}
.du2-m.link{--a:#A65BFF;--b:#8A3FE0;--s:#5E2398}
.du2-m .ic{display:grid;place-items:center;width:64px;height:64px;border-radius:20px;background:#fff;font-size:2rem;line-height:0;box-shadow:0 10px 20px -10px rgba(0,0,0,.45);transform:rotate(-4deg)}
.du2-m .tx{display:flex;flex-direction:column;gap:4px;align-items:center}
.du2-m b{font:800 1.35rem/1.1 "Bricolage Grotesque",Lexend,system-ui,sans-serif}
.du2-m small{font-size:.9rem;line-height:1.35;color:rgba(255,255,255,.9)}
.du2-m .tag{position:absolute;left:14px;top:14px;background:#FFE34D;color:#1B2240;border-radius:999px;padding:3px 10px;font:800 .7rem Lexend,sans-serif;letter-spacing:.08em;text-transform:uppercase}
.du2-m .los{margin-top:auto;display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,#FFE15A,#FFC23A);color:#1B2240;border-radius:14px;padding:10px 18px;font:700 1rem Lexend,sans-serif;box-shadow:0 5px 0 #C79A12}
.du2-ein{border-radius:24px;background:rgba(15,20,48,.66);border:1px solid rgba(255,255,255,.18);color:#fff;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);overflow:hidden}
.du2-ein summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:10px;padding:14px 18px;font:700 1rem Lexend,sans-serif}
.du2-ein summary::-webkit-details-marker{display:none}
.du2-ein summary .pf{margin-left:auto;transition:transform .2s}
.du2-ein[open] summary .pf{transform:rotate(90deg)}
.du2-ein summary .zus{font-weight:500;color:rgba(255,255,255,.8);font-size:.9rem}
.du2-ein .inhalt{padding:4px 18px 18px;display:grid;gap:12px}
.du2-ein label,.du2-ein .pick-lbl{color:#fff!important;font-weight:700;margin:0}
.du2-ein .sel{background:rgba(255,255,255,.95);color:#1B2240;border:0;border-radius:14px;min-height:44px;padding:8px 12px;font:inherit;width:100%;box-sizing:border-box}
.du2-ein .segs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;background:rgba(255,255,255,.12);border-radius:16px;padding:5px;margin:0}
.du2-ein .seg{border:0!important;border-radius:12px!important;background:transparent!important;color:#fff!important;min-height:42px;padding:6px 4px!important;font-size:.88rem!important;box-shadow:none!important;display:flex;flex-direction:column;gap:0;line-height:1.1}
.du2-ein .seg[aria-pressed="true"]{background:#fff!important;color:#1B2240!important}
.du2-ein .seg .sgi{font-size:1.1rem}.du2-ein .seg .sgt{font-size:.78rem}
.du2-ein .anzahl{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:12px}
.du2-ein .anzahl b{font:800 1.6rem "Bricolage Grotesque",sans-serif}
.du2-ein input[type=range]{width:100%;accent-color:#FFE34D}
.du2-namen{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.du2-pin{display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:6px}
.du2-pin .sel{text-align:center;letter-spacing:.2em;font-weight:800}
.du2-klein{border:1px solid rgba(255,255,255,.4);background:rgba(255,255,255,.14);color:#fff;border-radius:12px;padding:9px 14px;font:700 .9rem Lexend,sans-serif;cursor:pointer}
.du2-fehler{color:#fff;background:#E8364F;border-radius:12px;padding:8px 12px;font-weight:600;margin:0}
.du2-fehler:empty{display:none}
/* Team-Box: Farbe und Leuchten */
.du2-team{display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px;border-radius:24px;color:#fff;background:rgba(15,20,48,.62);border:1px solid rgba(255,255,255,.18)}
.du2-team .lbl{font:700 .72rem Lexend,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.8)}
.du2-kids{display:flex;gap:4px;align-items:flex-end}
.du2-kid{position:relative;border:0;background:none;padding:0;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;font-family:inherit}
.du2-kid img{height:120px;filter:grayscale(.6) brightness(.8);transition:filter .3s,transform .3s}
.du2-kid span{border-radius:999px;padding:4px 14px;font:800 .9rem "Bricolage Grotesque",sans-serif;background:rgba(255,255,255,.14);color:#fff;transition:background .3s}
.du2-kid.an img{filter:none;transform:scale(1.06)}
.du2-kid.an.lumi img{filter:drop-shadow(0 0 14px #FF7AD9) drop-shadow(0 0 30px rgba(224,67,184,.8))}
.du2-kid.an.milo img{filter:drop-shadow(0 0 14px #8FA6FF) drop-shadow(0 0 30px rgba(61,90,254,.8))}
.du2-kid.an.lumi span{background:linear-gradient(135deg,#FF7AD9,#E043B8)}.du2-kid.an.milo span{background:linear-gradient(135deg,#6F86FF,#3D5AFE)}
@media (max-width:860px){.du2-modi{grid-template-columns:1fr}.du2-m{flex-direction:row;text-align:left;padding:14px 16px;gap:12px;align-items:center}.du2-m .ic{width:50px;height:50px;font-size:1.5rem;flex:none}.du2-m .tx{flex:1;min-width:0;align-items:flex-start;gap:2px}.du2-m b{font-size:1.12rem}.du2-m small{font-size:.82rem}.du2-m .los{margin:0;padding:8px 12px;font-size:.85rem;flex:none}.du2-m .tag{position:absolute;left:auto;right:12px;top:8px;font-size:.58rem;padding:2px 7px}.du2-m.online{padding-top:22px}
  .du2-team{flex-direction:row;justify-content:space-between;padding:10px 14px}.du2-kid img{height:74px}.du2-kid span{font-size:.8rem;padding:3px 10px}}
/* iPad hochkant: grössere Kinder, kompakter Kopf */
@media (min-width:700px) and (max-width:999px){
  body.ep-app .dukopf.st-kopf{padding:14px 18px!important;min-height:0}
  body.ep-app .dukopf.st-kopf .dusw{width:56px;height:56px;font-size:1.9rem;margin:0 12px 0 0;vertical-align:middle}
  body.ep-app .dukopf.st-kopf h1{display:inline;vertical-align:middle;font-size:1.8rem}
  body.ep-app .du2-team{justify-content:center;gap:28px;padding:14px}
  body.ep-app .du2-team .lbl{position:absolute;left:18px;top:14px}
  body.ep-app .du2-team{position:relative}
  body.ep-app .du2-kids{gap:28px}
  body.ep-app .du2-kid img{height:120px}
  body.ep-app .du2-kid span{font-size:.95rem;padding:4px 16px}
  body.ep-app .du2-m{padding:16px 18px}body.ep-app .du2-m b{font-size:1.25rem}body.ep-app .du2-m small{font-size:.92rem}
}
/* iPad quer: Team links, Modi rechts, alles auf einem Schirm */
@media (min-width:1000px) and (orientation:landscape){
  body.ep-app .dukopf{display:none}
  body.ep-app .du2{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.7fr);gap:14px;align-items:start}
  body.ep-app .du2 .du2-team{flex-direction:column;justify-content:center;padding:18px;min-height:300px;align-self:stretch}
  body.ep-app .du2 .du2-kid img{height:150px}
  body.ep-app .du2 .du2-modi{grid-template-columns:1fr;gap:10px}
  body.ep-app .du2 .du2-m{flex-direction:row;text-align:left;padding:12px 16px;gap:12px;align-items:center}
  body.ep-app .du2 .du2-m .ic{width:48px;height:48px;font-size:1.4rem;flex:none}
  body.ep-app .du2 .du2-m .tx{flex:1;min-width:0;align-items:flex-start;gap:2px}
  body.ep-app .du2 .du2-m b{font-size:1.1rem}.du2-m small{font-size:.82rem}
  body.ep-app .du2 .du2-m .los{margin:0;padding:8px 14px;font-size:.88rem;flex:none}
  body.ep-app .du2 .du2-m .tag{position:absolute;left:auto;right:12px;top:6px;font-size:.58rem;padding:2px 7px}
  body.ep-app .du2 .du2-ein,body.ep-app .du2 .du2-fehler{grid-column:1/-1}
}
/* App-Tab Duell: Bereit-Karte mit Teamfarbe und leuchtendem Kind */
.ap-bereit .apkids{position:absolute;right:0;bottom:0;height:min(84%,420px);max-width:60%;display:flex;align-items:flex-end;z-index:1}
.ap-bereit .apkids img{height:100%;width:auto;max-width:52%;object-fit:contain;filter:grayscale(.2) brightness(.95);transition:filter .35s,transform .35s,opacity .35s;margin:0 -6px}
.ap-bereit.team-lumi .apkids .k-milo,.ap-bereit.team-milo .apkids .k-lumi{filter:grayscale(.8) brightness(.6);opacity:.75;transform:scale(.92)}
.ap-bereit.team-lumi .apkids .k-lumi,.ap-bereit.team-milo .apkids .k-milo{filter:drop-shadow(0 0 10px #fff) drop-shadow(0 0 22px var(--tg)) drop-shadow(0 0 44px var(--tg));transform:scale(1.08) translateY(-4px);z-index:2;animation:du2leucht 1.8s ease-in-out infinite}
@keyframes du2leucht{50%{filter:drop-shadow(0 0 14px #fff) drop-shadow(0 0 34px var(--tg)) drop-shadow(0 0 60px var(--tg))}}
.ap-bereit.team-lumi{--tg:#FF7AD9;background:linear-gradient(150deg,#B0216F 0%,#E043B8 55%,#8A3FE0 100%)!important}
.ap-bereit.team-milo{--tg:#8FA6FF;background:linear-gradient(150deg,#1E2F9E 0%,#3D5AFE 55%,#5B6CFF 100%)!important}
.ap-bereit .apteam button[aria-pressed="true"]{box-shadow:0 0 0 3px rgba(255,255,255,.5),0 0 18px var(--tg,#fff)}
/* Startseite Computer: Bereit-Karte */
.ep-bereit.team-lumi .epglow.epmilo,.ep-bereit.team-milo .epglow.eplumi{opacity:.12!important;animation:none!important}
.ep-bereit.team-lumi{background:radial-gradient(70% 90% at 50% 100%,#E043B8aa,transparent 70%),linear-gradient(160deg,#1B2240,#7A1F6E 50%,#E043B8)!important}
.ep-bereit.team-milo{background:radial-gradient(70% 90% at 50% 100%,#3D5AFEaa,transparent 70%),linear-gradient(160deg,#1B2240,#2A3AB0 50%,#3D5AFE)!important}
.ep-bereit .epteamwahl{display:flex;gap:8px;justify-content:center;margin-top:10px}
.ep-bereit .epteamwahl button{border:2px solid rgba(255,255,255,.4);background:rgba(255,255,255,.12);color:#fff;border-radius:999px;padding:8px 18px;font:800 1rem "Bricolage Grotesque",sans-serif;cursor:pointer}
.ep-bereit .epteamwahl button[aria-pressed="true"]{background:#fff;color:#1B2240}
/* Spielmaske: alles auf einem Bildschirm, Gegner sichtbar */
.du2-top{display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:center;margin:0 0 8px}
.du2-sp{display:flex;align-items:center;gap:8px;background:rgba(15,20,48,.66);border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:5px 12px 5px 6px;color:#fff;min-width:0;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.du2-sp.geg{flex-direction:row-reverse;text-align:right}
.du2-sp .av{width:34px;height:34px;border-radius:50%;overflow:hidden;background:#fff;flex:none;display:grid;place-items:center;font-size:1.2rem}
.du2-sp .av img{width:100%;height:100%;object-fit:cover;object-position:top}
.du2-sp .n{display:flex;flex-direction:column;min-width:0;line-height:1.15}
.du2-sp .n b{font:800 .95rem "Bricolage Grotesque",sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.du2-sp .n small{font-size:.72rem;color:rgba(255,255,255,.85);white-space:nowrap}
.du2-sp .pk{font:800 1.2rem "Bricolage Grotesque",sans-serif;margin-left:auto}
.du2-sp.geg .pk{margin-left:0;margin-right:auto}
.du2-uhr{display:grid;place-items:center;width:46px;height:46px;border-radius:50%;background:#FFE34D;color:#1B2240;font:800 1.15rem "Bricolage Grotesque",sans-serif;box-shadow:0 4px 0 #C9A200;font-variant-numeric:tabular-nums}
.du2-bars{display:grid;gap:4px;margin:0 0 10px}
.du2-bars div{height:7px;border-radius:4px;background:rgba(255,255,255,.5);overflow:hidden}
.du2-bars i{display:block;height:100%;border-radius:4px;background:linear-gradient(90deg,#3D5AFE,#8A3FE0)}
.du2-bars div.geg i{background:linear-gradient(90deg,#E8364F,#FF8A3D)}
.du2-stat{display:flex;gap:6px;font-size:.72rem;font-weight:700}
.du2-stat span{border-radius:999px;padding:1px 7px;background:rgba(255,255,255,.18)}
body.ep-app.ep-s-duellplay .crumbs{display:none!important}
body.ep-app.ep-s-duellplay .card{padding:14px 14px 10px!important;border-radius:24px!important}
body.ep-app.ep-s-duellplay .modebadge{font-size:.75rem;margin-bottom:6px}
body.ep-app.ep-s-duellplay .question{font-size:clamp(1.02rem,4.5vw,1.3rem)!important;margin:0 0 10px;text-align:center}
body.ep-app.ep-s-duellplay .answers{gap:8px}
body.ep-app.ep-s-duellplay .ans{min-height:48px!important;padding:8px 12px!important;font-size:.95rem!important;border-radius:14px!important;border-width:0!important;box-shadow:0 4px 0 rgba(0,0,0,.18)!important;color:#fff!important}
body.ep-app.ep-s-duellplay .ans:nth-child(1){background:linear-gradient(135deg,#5B7CFF,#3D5AFE)!important}
body.ep-app.ep-s-duellplay .ans:nth-child(2){background:linear-gradient(135deg,#FF6FB5,#E043B8)!important}
body.ep-app.ep-s-duellplay .ans:nth-child(3){background:linear-gradient(135deg,#2FD1A7,#12A57F)!important}
body.ep-app.ep-s-duellplay .ans:nth-child(4){background:linear-gradient(135deg,#FFB347,#FF8A1A)!important}
body.ep-app.ep-s-duellplay .ans .key{background:rgba(255,255,255,.25)!important;color:#fff!important;border:0!important;width:28px;height:28px;min-width:28px;border-radius:8px;font-size:.85rem}
body.ep-app.ep-s-duellplay .ans.right{box-shadow:0 0 0 3px #12B76A,0 4px 0 rgba(0,0,0,.18)!important}
body.ep-app.ep-s-duellplay .ans.wrong,body.ep-app.ep-s-duellplay .ans:disabled:not(.right){opacity:.45}
body.ep-app.ep-s-duellplay .dufb{font-size:.85rem;margin-top:8px}
body.ep-app.ep-s-duellplay .qnr,body.ep-app.ep-s-duellplay .eplegal{display:none!important}
body.ep-app.ep-s-duellplay .qimg{max-height:110px}body.ep-app.ep-s-duellplay .qimg svg,body.ep-app.ep-s-duellplay .qimg img{max-height:110px;width:auto}
body.ep-app.ep-s-duellplay .wrap{padding-top:calc(8px + env(safe-area-inset-top))!important}
@media (max-width:420px){.du2-sp .n small{display:none}.du2-sp .pk{font-size:1.05rem}}
/* Lobby */
.du2-lobby{text-align:center}
.du2-such{display:inline-grid;place-items:center;width:84px;height:84px;border-radius:50%;background:conic-gradient(#3D5AFE,#8A3FE0,#E043B8,#3D5AFE);animation:du2dreh 1.4s linear infinite;margin:10px auto}
.du2-such i{width:68px;height:68px;border-radius:50%;background:var(--surface,#fff);display:grid;place-items:center;font-size:1.8rem;font-style:normal;animation:du2dreh 1.4s linear infinite reverse}
@keyframes du2dreh{to{transform:rotate(360deg)}}

/* Ende: Statistik und Elo */
.du2-liga{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:999px;background:color-mix(in srgb,var(--lc) 18%,#fff);color:color-mix(in srgb,var(--lc) 70%,#1B2240);border:1.5px solid color-mix(in srgb,var(--lc) 45%,transparent);font:700 .82rem Lexend,sans-serif;white-space:nowrap;vertical-align:middle}
.du2-mu{color:var(--soft,#5A6385);font-size:.85rem}
.du2-ende{text-align:left;max-width:640px;padding:18px 18px 16px!important;position:relative;overflow:hidden}
.du2-ek{display:flex;align-items:flex-end;gap:12px;margin:0 0 4px}
.du2-ek img{height:118px;width:auto;flex:none;filter:drop-shadow(0 8px 14px rgba(40,30,120,.25))}
.du2-ek h1{font-size:1.5rem;margin:0 0 4px;line-height:1.15}
.du2-ek p{margin:0;display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.du2-ende .duvs.gross{margin:6px 0 10px;gap:14px}.du2-ende .duvs.gross .dupkt{font-size:2.3rem}
.du2-elo{display:flex;gap:14px;align-items:center;padding:12px 14px;border-radius:20px;background:linear-gradient(135deg,#F2EEFF,#E9F0FF);border:2px solid #DCD5FA;margin:6px 0}
.du2-elo.plus{background:linear-gradient(135deg,#E6FAF1,#EFFFF7);border-color:#B9EBD3}.du2-elo.minus{background:linear-gradient(135deg,#FFF0F0,#FFF6F2);border-color:#F6CACA}
.du2-eloz{display:grid;justify-items:center;min-width:70px}
.du2-eloz b{font:900 2.1rem "Bricolage Grotesque",sans-serif;line-height:1;color:#5B45EE}
.du2-elo.plus .du2-eloz b{color:#12A57F}.du2-elo.minus .du2-eloz b{color:#E5484D}
.du2-eloz span{font:700 .72rem Lexend,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:var(--soft,#5A6385)}
.du2-elol{flex:1;min-width:0;display:grid;gap:4px}
.du2-elol>b{font:800 1.05rem Lexend,sans-serif;color:var(--ink,#1B2240)}
.du2-elol small,.du2-warte small{color:var(--soft,#5A6385);font-size:.8rem}
.du2-elobar{height:9px;border-radius:9px;background:rgba(27,34,64,.1);overflow:hidden}
.du2-elobar i{display:block;height:100%;border-radius:9px;background:linear-gradient(90deg,var(--lc,#8A3FE0),#8A3FE0);transition:width .8s}
.du2-warte{display:grid;gap:4px;margin:0 0 8px}
.du2-auf,.du2-ab{border-radius:16px;padding:10px 14px;font-weight:700;margin:6px 0;animation:du2pop .5s cubic-bezier(.2,1.5,.4,1) both}
.du2-auf{background:linear-gradient(135deg,#FFE15A,#FFC23A);color:#3B2A00}.du2-ab{background:#FFE9E3;color:#8A2B12}
@keyframes du2pop{from{transform:scale(.7);opacity:0}to{transform:none;opacity:1}}
.du2-hinw{margin:4px 2px 8px}
.du2-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:8px 0}
.du2-stats>div{display:grid;gap:1px;padding:8px 10px;border-radius:14px;background:var(--bg,#F4F1FF);border:1.5px solid var(--line,#E2DEF5);min-width:0}
.du2-stats span{font:700 .68rem Lexend,sans-serif;text-transform:uppercase;letter-spacing:.06em;color:var(--soft,#5A6385)}
.du2-stats b{font:800 1.25rem "Bricolage Grotesque",sans-serif;color:var(--ink,#1B2240)}
.du2-stats small{font-size:.72rem;color:var(--soft,#5A6385);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.du2-verlauf{display:grid;gap:6px;margin:6px 0}
.du2-verlauf>div{display:grid;grid-template-columns:72px 1fr;align-items:center;gap:8px}
.du2-verlauf span{font-weight:700;font-size:.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.du2-dots{display:grid;grid-template-columns:repeat(auto-fit,minmax(18px,1fr));gap:4px}
.du2-dots i{height:22px;border-radius:7px;background:rgba(27,34,64,.08);display:grid;place-items:center;font:800 .75rem Lexend,sans-serif;font-style:normal;color:#fff}
.du2-dots i.ok{background:#12B76A}.du2-dots i.no{background:#E5484D}
.du2-bilanz{text-align:center;margin:6px 0 2px}
.du2-ende .row{justify-content:center;margin-top:8px}
.du2-lkid{height:130px;display:block;margin:0 auto 4px}
.du2-rang{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;padding:10px 14px;border-radius:20px;background:rgba(15,20,48,.62);color:#fff;border:1px solid rgba(255,255,255,.18);font:600 .9rem Lexend,sans-serif}
.du2-rang .du2-liga{font-size:.9rem}
.du2-rang small{color:rgba(255,255,255,.8)}
@media (max-width:520px){.du2-ek img{height:84px}.du2-ek h1{font-size:1.15rem}.du2-stats{gap:5px}.du2-stats>div{padding:6px 6px;border-radius:12px}.du2-stats span{font-size:.56rem;letter-spacing:.03em}.du2-stats b{font-size:1rem}.du2-stats small{font-size:.6rem}.du2-auf,.du2-ab{font-size:.85rem;padding:8px 12px}.du2-bilanz{display:none}.du2-elo{padding:8px 10px;gap:10px}.du2-hinw{font-size:.78rem;margin:2px 2px 4px}.du2-ende .row .big{padding:10px 14px;font-size:.95rem}.du2-ende{padding:14px 12px 12px!important}.du2-ende .duvs.gross .dupkt{font-size:1.9rem}.du2-eloz b{font-size:1.7rem}.du2-verlauf>div{grid-template-columns:56px 1fr}.du2-dots i{height:18px;font-size:.62rem}.du2-lkid{height:100px}}
body.ep-app.ep-s-duellende .du2-ende{margin-top:4px}
`;
document.head.appendChild(css);

/* ---------- Duell-Menü ---------- */
function einstellungen(){
  const kats = duellKats(); if(!kats.some(k => k[0] === DU.cat)) DU.cat = "alle";
  const max = Math.min(20, duellPool(DU.cat, DU.stufe).length); if(DU.n > max) DU.n = Math.max(3, max);
  const kn = (kats.find(k => k[0] === DU.cat) || ["", "Alle Themen"])[1].replace(/^[^:]+: /, "");
  const sn = ["Gemischt", "Entdecker", "Könner", "Profis"][DU.stufe] || "Gemischt";
  return `<details class="du2-ein" id="du2Ein"><summary>⚙️ Einstellungen <span class="zus">${h(kn)} · ${sn} · ${DU.n} Fragen</span><span class="pf">▸</span></summary>
    <div class="inhalt">
      <label class="pick-lbl" for="duCat">Thema</label>
      <select id="duCat" class="sel">${kats.map(([id, l]) => `<option value="${id}" ${id === DU.cat ? "selected" : ""}>${h(l)} (${duellPool(id, DU.stufe).length})</option>`).join("")}</select>
      <p class="pick-lbl">Stufe</p>
      <div class="segs">${[[0,"🎲","Gemischt"],[1,"🌱","Entdecker"],[2,"🚀","Könner"],[3,"🏅","Profis"]].map(([v, e, l]) => `<button class="seg" type="button" data-dst="${v}" aria-pressed="${DU.stufe === v}"><span class="sgi">${e}</span><span class="sgt">${l}</span></button>`).join("")}</div>
      <div class="anzahl"><b id="duNv">${DU.n}</b><input type="range" id="duN" min="3" max="${Math.max(3, max)}" value="${DU.n}"></div>
    </div></details>`;
}
function teamBox(){
  const t = team();
  return `<div class="du2-team"><span class="lbl">Dein Team</span><div class="du2-kids">
    <button type="button" class="du2-kid lumi${t && t.id === "lumi" ? " an" : ""}" data-team="lumi"><img src="${KIDS}m3.webp" alt=""><span>Lumi</span></button>
    <button type="button" class="du2-kid milo${t && t.id === "milo" ? " an" : ""}" data-team="milo"><img src="${KIDS}j3.webp" alt=""><span>Milo</span></button></div></div>`;
}
window.renderDuell = function(){
  duellLeave(); if(DU.match) matchStop();
  const sp = !!(typeof lkSupa === "function" && lkSupa()), offenEin = !!DU.einOffen;
  $("#app").innerHTML = `${crumbs()}
    <div class="dukopf"><span class="dusw">⚔️</span><h1>Duell</h1><p>Wer weiss mehr? Online gegen ein anderes Kind, zu zweit an einem Gerät oder per Link.</p></div>
    <div class="du2">
      ${teamBox()}
      <div class="du2-modi">
        <button type="button" class="du2-m online" id="duRandom"><span class="tag">Neu</span><span class="ic">🌐</span><span class="tx"><b>Online</b><small>${sp ? "Sucht ein Kind, das jetzt auch spielen will. Findet sich niemand, spielt Leni oder Ben." : "Spiel gegen Leni oder Ben. Mit Supabase gegen andere Kinder."}</small></span><span class="los">⚡ Gegner suchen</span></button>
        <button type="button" class="du2-m geraet" id="duSplit"><span class="ic">📱</span><span class="tx"><b>Auf einem Gerät</b><small>Zu zweit, Handy dazwischen, ohne Internet.</small></span><span class="los">⚔️ Starten</span></button>
        <button type="button" class="du2-m link" id="duLink"><span class="ic">🔗</span><span class="tx"><b>Per Link</b><small>Du spielst zuerst, dann schickst du den Link.</small></span><span class="los">▶ Spielen</span></button>
      </div>
      ${einstellungen()}
      <details class="du2-ein" id="du2Namen"><summary>📱 Namen für «Auf einem Gerät» <span class="pf">▸</span></summary><div class="inhalt"><div class="du2-namen"><input id="duP1" class="sel" maxlength="14" placeholder="Spieler 1" value="${h((S.profil && S.profil.name || "").split(" ")[0] || "")}"><input id="duP2" class="sel" maxlength="14" placeholder="Spieler 2"></div></div></details>
      ${typeof liveRoom === "function" && window.claude && window.claude.use ? `<details class="du2-ein"><summary>🔢 Mit PIN beitreten <span class="pf">▸</span></summary><div class="inhalt"><div class="du2-pin"><input id="duPin" class="sel" inputmode="numeric" maxlength="4" placeholder="PIN"><button class="du2-klein" id="duJoin" type="button">Beitreten</button></div><button class="du2-klein" id="duHost" type="button">Eigenes Duell mit PIN erstellen</button></div></details>` : ""}
      <p class="du2-fehler" id="duErr" aria-live="polite"></p>
    </div>`;
  const ein = $("#du2Ein"); if(ein && offenEin) ein.open = true; if(ein) ein.ontoggle = () => { DU.einOffen = ein.open; };
  $("#duCat").onchange = e => { DU.cat = e.target.value; DU.einOffen = true; render(); };
  document.querySelectorAll("[data-dst]").forEach(b => b.onclick = () => { DU.stufe = +b.dataset.dst; DU.einOffen = true; render(); });
  const sl = $("#duN"); sl.oninput = () => { DU.n = +sl.value; $("#duNv").textContent = sl.value; const z = document.querySelector("#du2Ein .zus"); if(z) z.textContent = z.textContent.replace(/\d+ Fragen/, DU.n + " Fragen"); };
  document.querySelectorAll("[data-team]").forEach(b => b.onclick = () => { LS.set("ep-team", b.dataset.team); document.querySelectorAll(".du2-kid").forEach(x => x.classList.toggle("an", x === b)); });
  $("#duSplit").onclick = () => { if(duellPool(DU.cat, DU.stufe).length < 3){ $("#duErr").textContent = "Zu wenige Fragen für dieses Thema."; return; } const n1 = $("#duP1").value.trim() || "Spieler 1", n2 = $("#duP2").value.trim() || "Spieler 2"; splitStart(n1, n2); };
  $("#duLink").onclick = () => { DU.mode = "link"; DU.list = duellFragen(DU.cat, DU.stufe, DU.n); DU.herausf = null; soloStart(); };
  $("#duRandom").onclick = () => matchStart();
  $("#duHost") && ($("#duHost").onclick = duOnlineHost);
  $("#duJoin") && ($("#duJoin").onclick = () => duOnlineJoin($("#duPin").value.trim()));
};

/* ---------- Online: zufälligen Gegner suchen ---------- */
async function rpc(name, body){
  const sp = typeof lkSupa === "function" && lkSupa(); if(!sp) return null;
  try{ const r = await fetch(sp.u + "/rest/v1/rpc/" + name, {method:"POST", headers:sp.h, body:JSON.stringify(body)}); if(!r.ok) return null; return await r.json(); }catch(e){ return null; }
}
function matchStop(){ const M = DU.match; if(!M) return; clearInterval(M.poll); clearTimeout(M.timeout); clearInterval(M.bot); if(M.id && M.rolle === "host" && !M.laeuft) rpc("duell_abbrechen", {p_id:M.id, p_token:M.token}); DU.match = null; }
function meinName(){ return (S.profil && S.profil.name) || DU.ich || "Du"; }
async function matchStart(){
  duellLeave(); matchStop();
  if(duellPool(DU.cat, DU.stufe).length < 3){ $("#duErr").textContent = "Zu wenige Fragen für dieses Thema."; return; }
  DU.mode = "match"; DU.run = null; DU.list = duellFragen(DU.cat, DU.stufe, DU.n);
  const t = team();
  DU.match = {rolle:null, id:null, token:Math.random().toString(36).slice(2) + Date.now().toString(36), gegner:null, bot:null, poll:null, timeout:null, laeuft:false, start:Date.now()};
  go("duelllobby");
  const sp = typeof lkSupa === "function" && lkSupa();
  if(sp){
    const arg = {p_token:DU.match.token, p_name:meinName(), p_team:t ? t.id : "", p_stufe:DU.stufe, p_cat:DU.cat, p_n:DU.n, p_list:DU.list};
    const r = (await rpc("duell_suchen", {...arg, p_elo:eloDaten().r})) || (await rpc("duell_suchen", arg));
    if(DU.mode !== "match" || !DU.match) return;
    if(r && r.id){ DU.match.id = r.id; DU.match.rolle = r.rolle;
      if(r.rolle === "gast" && Array.isArray(r.list) && r.list.length){ DU.list = r.list; DU.match.gegner = {name:r.gegner || "Gegner", team:r.gegner_team || "", elo:+r.gegner_elo || eloDaten().r, i:0, score:0, ant:"", letzt:Date.now()}; matchLos(); return; }
      DU.match.poll = setInterval(async () => { const st = await rpc("duell_stand", {p_id:DU.match.id, p_token:DU.match.token, p_i:0, p_score:0, p_ant:"", p_fertig:false});
        if(!DU.match || DU.match.laeuft) return; if(st && st.gegner){ DU.match.gegner = {name:st.gegner, team:st.gegner_team || "", elo:+st.gegner_elo || eloDaten().r, i:0, score:0, ant:"", letzt:Date.now()}; matchLos(); } }, 1500);
    }
  }
  DU.match.timeout = setTimeout(() => { if(DU.match && !DU.match.laeuft) botStart(); }, sp ? 20000 : 1200);
}
function botStart(){
  const M = DU.match; if(!M) return; clearInterval(M.poll); if(M.id && M.rolle === "host") rpc("duell_abbrechen", {p_id:M.id, p_token:M.token}); M.id = null; M.rolle = "bot";
  const b = BOTS[Math.floor(Math.random() * BOTS.length)];
  M.bot = b; M.gegner = {name:b.name, bild:b.bild, bot:true, elo:botElo(), i:0, score:0, ant:"", zeiten:[], fertig:false};
  matchLos();
}
function matchLos(){
  const M = DU.match; if(!M) return; M.laeuft = true; clearInterval(M.poll); clearTimeout(M.timeout);
  renderDuellLobby2(true);
  setTimeout(() => { if(DU.mode !== "match" || !DU.match) return; soloStart(); if(M.bot) botSpielen(); else M.poll = setInterval(matchSync, 1500); }, 1600);
}
function botSpielen(){
  const M = DU.match, g = M.gegner, quote = botQuote(g.elo);
  const schritt = () => { if(!DU.match || DU.match !== M || g.fertig) return;
    clearTimeout(M.bot);
    if(g.i >= DU.list.length){ g.fertig = true; gegnerZeigen(); if(S.screen === "duellende") renderDuellEnde(); return; }
    const ok = Math.random() < quote, ms = Math.min(botTempo(g.elo), DUELL_ZEIT - 200);
    // ist das Kind schon fertig, beantwortet der Übungsgegner den Rest zügig
    const warte = (DU.run && DU.run.fertig) ? 350 : ms + 1300;
    M.bot = setTimeout(() => { if(!DU.match || DU.match !== M) return; g.ant += ok ? "1" : "0"; g.zeiten.push(Math.round(ms)); if(ok) g.score += duellPunkte(true, ms); g.i++; gegnerZeigen(); if(S.screen === "duellende") renderDuellEnde(); schritt(); }, warte);
  };
  M.botWeiter = schritt;
  schritt();
}
async function matchSync(){
  const M = DU.match; if(!M || !M.id) return; const R = DU.run || {};
  const st = await rpc("duell_stand", {p_id:M.id, p_token:M.token, p_i:R.i || 0, p_score:R.score || 0, p_ant:(R.ant || []).join(""), p_fertig:!!R.fertig});
  if(!DU.match || DU.match !== M || !st) return;
  const alt = M.gegner || {}, neuI = +st.gegner_i || 0;
  M.gegner = {name:st.gegner || alt.name || "Gegner", team:st.gegner_team || "", elo:+st.gegner_elo || alt.elo || eloDaten().r, i:neuI, score:+st.gegner_score || 0, ant:st.gegner_ant || "", fertig:!!st.gegner_fertig,
    letzt:(neuI !== alt.i || !alt.letzt) ? Date.now() : alt.letzt};
  gegnerZeigen();
  if(S.screen === "duellende" && (st.gegner_fertig !== !!alt.fertig || neuI !== alt.i || gegnerWeg(M.gegner))) renderDuellEnde();
  if(st.gegner_fertig && (DU.run || {}).fertig) clearInterval(M.poll);
}
function gegnerZeigen(){ const g = DU.match && DU.match.gegner; if(!g) return;
  const el = document.getElementById("du2Geg"); if(el){ el.querySelector(".pk").textContent = g.score; const sm = el.querySelector("small"); if(sm) sm.innerHTML = gegnerStat(g); }
  const bar = document.querySelector(".du2-bars .geg i"); if(bar) bar.style.width = Math.min(100, (g.i / DU.list.length) * 100) + "%";
}
// echter Gegner antwortet 45 Sekunden nicht mehr, obwohl man selbst fertig ist: gilt als aufgegeben
const gegnerWeg = g => !!(g && !g.bot && !g.fertig && DU.run && DU.run.fertig && g.letzt && Date.now() - g.letzt > 45000);
const gegnerStat = g => { const r = (g.ant || "").split("").filter(x => x === "1").length, f = (g.ant || "").length - r; return `Frage ${Math.min(g.i + 1, DU.list.length)} · ✅ ${r} ❌ ${f}`; };

// duGegner auch für die Zufallssuche
const vorGegner = window.duGegner;
window.duGegner = function(){ if(DU.mode === "match") return DU.match && DU.match.gegner ? {...DU.match.gegner, fertig:!!DU.match.gegner.fertig} : null; return vorGegner.apply(this, arguments); };
const vorPresence = window.duPresence;
window.duPresence = function(){ if(DU.mode === "match"){ try{ matchSync(); }catch(e){} return; } return vorPresence.apply(this, arguments); };
const vorLeave = window.duellLeave;
window.duellLeave = function(){ if(DU.match && DU.mode === "match" && S.screen !== "duellplay" && S.screen !== "duellende" && S.screen !== "duelllobby") matchStop(); return vorLeave.apply(this, arguments); };

/* ---------- Lobby ---------- */
function renderDuellLobby2(gefunden){
  const M = DU.match, g = M && M.gegner, t = team();
  const av = (name, bild, tm) => `<div><span class="pav">${bild ? `<img src="${KIDS}${bild}" alt="" style="width:100%;height:100%;object-fit:cover;object-position:top">` : (tm === "lumi" ? "🩷" : tm === "milo" ? "💙" : "👤")}</span><b>${h(name)}</b></div>`;
  $("#app").innerHTML = `${crumbs()}<div class="card lwait dulobby du2-lobby">
    <h2>⚔️ ${gefunden ? "Gegner gefunden!" : "Suche einen Gegner …"}</h2>
    ${gefunden ? "" : `<img class="ep-kid du2-lkid" src="${KIDS}lb-denken.webp" alt=""><p class="du2-mu">Gegner in deiner Stärke: ${ligaChip(eloDaten().r)}</p><div class="du2-such"><i>🔎</i></div><p>Wer jetzt auch auf «Online» tippt, spielt gegen dich. ${M && M.id ? "Nach 20 Sekunden" : "Gleich"} spielt sonst Leni oder Ben mit dir.</p>`}
    <div class="duvs">${av(meinName(), t ? (t.id === "lumi" ? "m1.webp" : "j1.webp") : null, t && t.id)}<span class="vs">VS</span>${g ? av(g.name, g.bild || (g.team === "lumi" ? "m1.webp" : g.team === "milo" ? "j1.webp" : null), g.team) : `<div><span class="pav pfrei">?</span><b>Wartet …</b></div>`}</div>
    ${gefunden ? `<p><b>Gleich geht es los!</b> ${DU.list.length} Fragen, ${Math.round(DUELL_ZEIT / 1000)} Sekunden pro Frage.</p>` : `<button class="du2-klein" id="duBot" type="button">Sofort gegen Leni oder Ben spielen</button>`}
    <button class="big alt" id="duAb" type="button">Abbrechen</button></div>`;
  $("#duAb").onclick = () => { matchStop(); duellLeave(); go("duell"); };
  $("#duBot") && ($("#duBot").onclick = () => botStart());
}
const vorLobby = window.renderDuellLobby;
window.renderDuellLobby = function(){ if(DU.mode === "match"){ renderDuellLobby2(!!(DU.match && DU.match.laeuft)); return; } return vorLobby.apply(this, arguments); };

/* ---------- Spielmaske: Gegner mit Name, Fortschritt, richtig und falsch ---------- */
const vorPlay = window.renderDuellPlay;
window.renderDuellPlay = function(){
  const r = vorPlay.apply(this, arguments);
  try{
    const R = DU.run, g = DU.mode === "match" ? (DU.match && DU.match.gegner) : (DU.mode === "online" ? duGegner() : null);
    const alt = document.querySelector("#app .dutop"), bar = document.querySelector("#app .dubar"); if(!alt) return r;
    const t = team(), mr = (R.ant || []).filter(x => x).length, mf = (R.ant || []).length - mr;
    const top = document.createElement("div"); top.className = "du2-top";
    top.innerHTML = `<div class="du2-sp"><span class="av">${t ? `<img src="${KIDS}${t.id === "lumi" ? "m1.webp" : "j1.webp"}" alt="">` : "👤"}</span><span class="n"><b>${h(meinName())}</b><small>Frage ${R.i + 1} · ✅ ${mr} ❌ ${mf}</small></span><span class="pk">${R.score}</span></div>
      <span class="du2-uhr" id="duZeit">${Math.ceil(DUELL_ZEIT / 1000)}</span>
      ${g ? `<div class="du2-sp geg" id="du2Geg"><span class="av">${g.bild ? `<img src="${KIDS}${g.bild}" alt="">` : g.team === "lumi" ? `<img src="${KIDS}m1.webp" alt="">` : g.team === "milo" ? `<img src="${KIDS}j1.webp" alt="">` : "👤"}</span><span class="n"><b>${h(g.name)}</b><small>${gegnerStat(g)}</small></span><span class="pk">${g.score || 0}</span></div>`
         : DU.herausf ? `<div class="du2-sp geg"><span class="av">👤</span><span class="n"><b>${h(DU.herausf.n)}</b><small>hatte</small></span><span class="pk">${DU.herausf.s}</span></div>` : `<div></div>`}`;
    alt.replaceWith(top);
    if(bar){ const b2 = document.createElement("div"); b2.className = "du2-bars"; b2.innerHTML = `<div><i style="width:${R.i / DU.list.length * 100}%"></i></div>${g ? `<div class="geg"><i style="width:${Math.min(100, (g.i || 0) / DU.list.length * 100)}%"></i></div>` : ""}`; bar.replaceWith(b2); }
  }catch(e){ console.warn("duell2.js", e); }
  return r;
};

/* ---------- Ende eines Spiels: Statistik, Elo, Auf- und Abstieg ---------- */
// Antwortzeit pro Frage merken (für die Statistik)
const vorTipp = window.soloTipp;
window.soloTipp = function(i){ const R = DU.run; if(R && !R.aus){ (R.zeiten = R.zeiten || []).push(i === -1 ? DUELL_ZEIT : Date.now() - R.qStart); } return vorTipp.apply(this, arguments); };
// Fehler: bei der Zufallssuche ging es nach der letzten Frage nicht weiter
const vorSoloEnde = window.soloEnde;
window.soloEnde = function(){
  if(DU.mode === "match"){ const R = DU.run; R.fertig = true; const M = DU.match;
    if(M && M.gegner && M.gegner.bot && M.botWeiter) M.botWeiter(); else if(M && M.id) matchSync();
    go("duellende"); return; }
  return vorSoloEnde.apply(this, arguments);
};
const sek = ms => (Math.round((ms || 0) / 100) / 10).toLocaleString("de-CH") + " s";
const schnitt = l => l && l.length ? l.reduce((a, b) => a + b, 0) / l.length : null;
function punkteReihe(ant, n){ return Array.from({length:n}, (_, i) => { const x = ant[i]; return `<i class="${x == null ? "" : x ? "ok" : "no"}">${x == null ? "" : x ? "✓" : "✕"}</i>`; }).join(""); }
const vorEnde = window.renderDuellEnde;
window.renderDuellEnde = function(){
  if(DU.mode !== "match") return vorEnde.apply(this, arguments);
  const R = DU.run || {score:0, ant:[]}, M = DU.match, g = M && M.gegner, n = DU.list.length;
  const weg = gegnerWeg(g), gFertig = !!(g && (g.fertig || weg));
  const a = {n:meinName(), s:R.score}, b = g ? {n:g.name, s:g.score || 0} : null;
  const sieg = b && gFertig ? (weg ? "a" : a.s > b.s ? "a" : a.s < b.s ? "b" : "u") : null;
  if(sieg && !R._elo){ R._elo = eloBuchen(g.elo || eloDaten().r, sieg === "a" ? 1 : sieg === "u" ? 0.5 : 0, g.name); try{ window.EP_LEVEL.gib(sieg === "a" ? 40 : sieg === "u" ? 25 : 15); }catch(e){} }
  const E = R._elo, d = eloDaten(), r = E ? E.neu : d.r, L = liga(r), nx = naechsteLiga(r);
  const pro = nx ? Math.max(0, Math.min(100, (r - L.min) / (nx.min - L.min) * 100)) : 100;
  const auf = E && E.ln.min > E.la.min, ab = E && E.ln.min < E.la.min;
  const meineR = (R.ant || []).filter(x => x).length, gR = g ? (g.ant || "").split("").filter(x => x === "1").length : 0;
  const mz = R.zeiten || [], gz = (g && g.zeiten) || [];
  const kid = !sieg ? "lb-denken" : sieg === "a" ? "lb-jubel" : sieg === "b" ? "lb-schock" : "lb-daumen";
  const titel = !sieg ? `${h(b ? b.n : "Gegner")} spielt noch …` : sieg === "u" ? "Unentschieden!" : sieg === "a" ? (weg ? `${h(b.n)} hat aufgegeben, du gewinnst!` : "Du gewinnst!") : `${h(b.n)} gewinnt`;
  const tile = (label, ich, er) => `<div><span>${label}</span><b>${ich}</b>${b ? `<small>${h(b.n)}: ${er}</small>` : ""}</div>`;
  $("#app").innerHTML = `${crumbs()}<div class="card duende du2-ende ${sieg === "a" ? "sieg" : sieg === "b" ? "nieder" : ""}">
    <div class="du2-ek"><img class="ep-kid" src="${KIDS}${kid}.webp" alt=""><div><h1>${sieg === "a" ? "🏆 " : sieg === "u" ? "🤝 " : sieg === "b" ? "" : "⏳ "}${titel}</h1>
      <p>gegen ${h(b ? b.n : "?")} ${g && g.elo ? ligaChip(g.elo) : ""}${g && g.bot ? ` <span class="du2-mu">Übungsgegner</span>` : ""}</p></div></div>
    ${b ? `<div class="duvs gross"><div class="${sieg === "a" ? "sieger" : ""}"><b>${h(a.n)}</b><span class="dupkt">${a.s}</span></div><span class="vs">:</span><div class="${sieg === "b" ? "sieger" : ""}"><b>${h(b.n)}</b><span class="dupkt">${b.s}</span></div></div>` : ""}
    ${!sieg && b ? `<div class="du2-warte"><div class="du2-elobar"><i style="width:${Math.min(100, (g.i || 0) / n * 100)}%"></i></div><small>${h(b.n)} ist bei Frage ${Math.min((g.i || 0) + 1, n)} von ${n}. Die Elo-Punkte gibt es, sobald beide fertig sind.</small></div>` : ""}
    <div class="du2-elo ${E ? (E.delta >= 0 ? "plus" : "minus") : ""}">
      <div class="du2-eloz"><b>${E ? (E.delta >= 0 ? "+" : "") + E.delta : "…"}</b><span>Elo</span></div>
      <div class="du2-elol">${ligaChip(r)}<b>${E ? `${E.alt} → ${E.neu}` : `${r} Elo`}</b>
        <div class="du2-elobar" style="--lc:${L.c}"><i style="width:${pro}%"></i></div>
        <small>${nx ? `Noch ${nx.min - r} Elo bis ${nx.e} ${nx.n}` : "Höchste Liga erreicht!"}</small></div>
    </div>
    ${auf ? `<div class="du2-auf">⬆️ Aufstieg in die Liga ${E.ln.e} ${E.ln.n}! Deine nächsten Gegner sind stärker.</div>` : ab ? `<div class="du2-ab">⬇️ Abstieg in die Liga ${E.ln.e} ${E.ln.n}. Die nächsten Gegner sind etwas leichter, du schaffst das!</div>` : E ? `<p class="du2-mu du2-hinw">${E.delta >= 0 ? "Gewonnen: Deine nächsten Gegner werden etwas stärker." : "Verloren: Deine nächsten Gegner werden etwas leichter."}</p>` : ""}
    <div class="du2-stats">
      ${tile("Richtig", `${meineR}/${n}`, g && g.i ? `${gR}/${g.i}` : "?")}
      ${tile("Ø Zeit", mz.length ? sek(schnitt(mz)) : "?", gz.length ? sek(schnitt(gz)) : "?")}
      ${tile("Schnellste", mz.length ? sek(Math.min(...mz)) : "?", gz.length ? sek(Math.min(...gz)) : "?")}
      ${tile("Punkte", a.s, b ? b.s : "?")}
    </div>
    <div class="du2-verlauf"><div><span>${h(a.n)}</span><div class="du2-dots">${punkteReihe(R.ant || [], n)}</div></div>
      ${b ? `<div><span>${h(b.n)}</span><div class="du2-dots">${punkteReihe((g.ant || "").split("").map(x => x === "1"), n)}</div></div>` : ""}</div>
    <p class="du2-mu du2-bilanz">Bilanz: ${d.s} Siege · ${d.u} Unentschieden · ${d.v} Niederlagen</p>
    <div class="row"><button class="big" id="duNeu" type="button">⚔️ Nächstes Duell</button><button class="big alt" id="duMenu" type="button">Zum Duell-Menü</button></div></div>
    ${sieg === "a" || auf ? `<div class="pkonfetti dukonf" aria-hidden="true">${Array.from({length:30}, (_, i) => `<i style="--x:${(i * 37) % 100}%;--d:${(i % 9) * .4}s;--c:${["#FFD34D","#FF6FA8","#7FD1FF","#7BE07B","#B98CFF"][i % 5]}"></i>`).join("")}</div>` : ""}`;
  $("#duNeu").onclick = () => { matchStop(); matchStart(); };
  $("#duMenu").onclick = () => { matchStop(); duellLeave(); go("duell"); };
};

/* ---------- Team-Wahl ohne Nachfrage, Bereit-Karte mit Farbe ---------- */
const vorAktion = ES().aktion;
if(window.EP_START && typeof vorAktion === "function"){
  window.EP_START.aktion = function(a, el){
    if(a === "duell"){ if(team()){ go("duell"); return; } }
    return vorAktion.apply(this, arguments);
  };
}
function bereitSchmuck(){
  const t = team();
  document.querySelectorAll(".ap-bereit, .ep-bereit").forEach(k => {
    k.classList.toggle("team-lumi", !!(t && t.id === "lumi")); k.classList.toggle("team-milo", !!(t && t.id === "milo"));
    if(k.classList.contains("ap-bereit")){ const img = k.querySelector(":scope > img"); if(img && !k.querySelector(".apkids")){ const d = document.createElement("div"); d.className = "apkids"; d.innerHTML = `<img class="k-lumi" src="${KIDS}m5.webp" alt=""><img class="k-milo" src="${KIDS}j5.webp" alt="">`; img.replaceWith(d); } }
    if(k.classList.contains("ep-bereit") && !k.querySelector(".epteamwahl")){ const row = k.querySelector(".ep-row"); if(row){ const d = document.createElement("div"); d.className = "epteamwahl";
      d.innerHTML = `<button type="button" data-team2="lumi" aria-pressed="${!!(t && t.id === "lumi")}">🩷 Team Lumi</button><button type="button" data-team2="milo" aria-pressed="${!!(t && t.id === "milo")}">💙 Team Milo</button>`; row.after(d);
      d.querySelectorAll("[data-team2]").forEach(b => b.onclick = () => { LS.set("ep-team", b.dataset.team2); d.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b)); bereitSchmuck(); }); } }
  });
}
function rangSchmuck(){
  const modi = document.querySelector("#app .du2-modi"); if(!modi || document.querySelector("#app .du2-rang")) return;
  const d = eloDaten(), nx = naechsteLiga(d.r), el = document.createElement("div"); el.className = "du2-rang";
  el.innerHTML = `<span>Deine Liga</span>${ligaChip(d.r)}<small>${d.n ? `${d.s} Siege · ${d.v} Niederlagen` : "Gewinne Online-Duelle für Elo-Punkte"}${nx ? ` · noch ${nx.min - d.r} bis ${nx.e} ${nx.n}` : ""}</small>`;
  modi.before(el);
  const on = document.querySelector("#duRandom small"); if(on && !on.dataset.elo){ on.dataset.elo = "1"; on.textContent = "Gegner in deiner Stärke. Gewinnen bringt Elo-Punkte."; }
}
const app = document.getElementById("app");
if(app){ new MutationObserver(() => { try{ bereitSchmuck(); rangSchmuck(); }catch(e){} }).observe(app, {childList:true}); bereitSchmuck(); }
window.EP_DUELL = { matchStart, matchStop, BOTS, eloDaten, liga, LIGEN };
})();
