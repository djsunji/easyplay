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
    const r = await rpc("duell_suchen", {p_token:DU.match.token, p_name:meinName(), p_team:t ? t.id : "", p_stufe:DU.stufe, p_cat:DU.cat, p_n:DU.n, p_list:DU.list});
    if(DU.mode !== "match" || !DU.match) return;
    if(r && r.id){ DU.match.id = r.id; DU.match.rolle = r.rolle;
      if(r.rolle === "gast" && Array.isArray(r.list) && r.list.length){ DU.list = r.list; DU.match.gegner = {name:r.gegner || "Gegner", team:r.gegner_team || "", i:0, score:0, ant:""}; matchLos(); return; }
      DU.match.poll = setInterval(async () => { const st = await rpc("duell_stand", {p_id:DU.match.id, p_token:DU.match.token, p_i:0, p_score:0, p_ant:"", p_fertig:false});
        if(!DU.match || DU.match.laeuft) return; if(st && st.gegner){ DU.match.gegner = {name:st.gegner, team:st.gegner_team || "", i:0, score:0, ant:""}; matchLos(); } }, 1500);
    }
  }
  DU.match.timeout = setTimeout(() => { if(DU.match && !DU.match.laeuft) botStart(); }, sp ? 20000 : 1200);
}
function botStart(){
  const M = DU.match; if(!M) return; clearInterval(M.poll); if(M.id && M.rolle === "host") rpc("duell_abbrechen", {p_id:M.id, p_token:M.token}); M.id = null; M.rolle = "bot";
  const b = BOTS[Math.floor(Math.random() * BOTS.length)];
  M.bot = b; M.gegner = {name:b.name, bild:b.bild, bot:true, i:0, score:0, ant:"", fertig:false};
  matchLos();
}
function matchLos(){
  const M = DU.match; if(!M) return; M.laeuft = true; clearInterval(M.poll); clearTimeout(M.timeout);
  renderDuellLobby2(true);
  setTimeout(() => { if(DU.mode !== "match" || !DU.match) return; soloStart(); if(M.bot) botSpielen(); else M.poll = setInterval(matchSync, 1500); }, 1600);
}
function botSpielen(){
  const M = DU.match, g = M.gegner, quote = [0.62, 0.72, 0.6, 0.5][DU.stufe] || 0.62;
  const schritt = () => { if(!DU.match || DU.match !== M || g.fertig) return;
    if(g.i >= DU.list.length){ g.fertig = true; gegnerZeigen(); if(S.screen === "duellende") renderDuellEnde(); return; }
    const f = DU.list[g.i], ok = Math.random() < quote, ms = 2500 + Math.random() * 7000;
    M.bot = setTimeout(() => { if(!DU.match || DU.match !== M) return; g.ant += ok ? "1" : "0"; if(ok) g.score += duellPunkte(true, ms); g.i++; gegnerZeigen(); schritt(); }, Math.min(ms, DUELL_ZEIT - 200) + 1300);
  };
  schritt();
}
async function matchSync(){
  const M = DU.match; if(!M || !M.id) return; const R = DU.run || {};
  const st = await rpc("duell_stand", {p_id:M.id, p_token:M.token, p_i:R.i || 0, p_score:R.score || 0, p_ant:(R.ant || []).join(""), p_fertig:!!R.fertig});
  if(!DU.match || DU.match !== M || !st) return;
  M.gegner = {name:st.gegner || (M.gegner && M.gegner.name) || "Gegner", team:st.gegner_team || "", i:+st.gegner_i || 0, score:+st.gegner_score || 0, ant:st.gegner_ant || "", fertig:!!st.gegner_fertig};
  gegnerZeigen(); if(st.gegner_fertig && S.screen === "duellende") renderDuellEnde();
  if(st.gegner_fertig && (DU.run || {}).fertig) clearInterval(M.poll);
}
function gegnerZeigen(){ const g = DU.match && DU.match.gegner; if(!g) return;
  const el = document.getElementById("du2Geg"); if(el){ el.querySelector(".pk").textContent = g.score; const sm = el.querySelector("small"); if(sm) sm.innerHTML = gegnerStat(g); }
  const bar = document.querySelector(".du2-bars .geg i"); if(bar) bar.style.width = Math.min(100, (g.i / DU.list.length) * 100) + "%";
}
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
    ${gefunden ? "" : `<div class="du2-such"><i>🔎</i></div><p>Wer jetzt auch auf «Online» tippt, spielt gegen dich. ${M && M.id ? "Nach 20 Sekunden" : "Gleich"} spielt sonst Leni oder Ben mit dir.</p>`}
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

/* ---------- Ergebnis ---------- */
const vorEnde = window.renderDuellEnde;
window.renderDuellEnde = function(){
  if(DU.mode === "match"){
    const R = DU.run || {score:0}, g = DU.match && DU.match.gegner;
    const a = {n:meinName(), s:R.score}, b = g ? {n:g.name, s:g.score || 0, fertig:!!g.fertig} : null;
    const sieg = b && b.fertig ? (a.s > b.s ? "a" : a.s < b.s ? "b" : "u") : null;
    $("#app").innerHTML = `${crumbs()}<div class="card duende">
      ${sieg === "u" ? `<h1>🤝 Unentschieden!</h1>` : sieg ? `<h1>🏆 ${h((sieg === "a" ? a : b).n)} gewinnt!</h1>` : `<h1>⚔️ Deine Punkte: ${a.s}</h1>`}
      ${b ? `<div class="duvs gross"><div class="${sieg === "a" ? "sieger" : ""}"><b>${h(a.n)}</b><span class="dupkt">${a.s}</span></div><span class="vs">:</span><div class="${sieg === "b" ? "sieger" : ""}"><b>${h(b.n)}</b><span class="dupkt">${b.s}</span></div></div>` : ""}
      ${b && !b.fertig ? `<p class="help">${h(b.n)} spielt noch … (Frage ${Math.min((g.i || 0) + 1, DU.list.length)} von ${DU.list.length})</p>` : ""}
      ${g && g.bot ? `<p class="help">${h(g.name)} war dein Übungsgegner. Mit mehr Kindern online spielst du gegen echte Gegner.</p>` : ""}
      <div class="row"><button class="big" id="duNeu" type="button">🔁 Revanche</button><button class="big alt" id="duMenu" type="button">⚔️ Zum Duell-Menü</button></div></div>
      ${sieg && sieg !== "u" ? `<div class="pkonfetti dukonf" aria-hidden="true">${Array.from({length:30}, (_, i) => `<i style="--x:${(i * 37) % 100}%;--d:${(i % 9) * .4}s;--c:${["#FFD34D","#FF6FA8","#7FD1FF","#7BE07B","#B98CFF"][i % 5]}"></i>`).join("")}</div>` : ""}`;
    if(sieg && !R._xp){ R._xp = true; try{ window.EP_LEVEL.gib(sieg === "a" ? 40 : 15); }catch(e){} }
    $("#duNeu").onclick = () => { matchStop(); matchStart(); };
    $("#duMenu").onclick = () => { matchStop(); duellLeave(); go("duell"); };
    return;
  }
  return vorEnde.apply(this, arguments);
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
const app = document.getElementById("app");
if(app){ new MutationObserver(() => { try{ bereitSchmuck(); }catch(e){} }).observe(app, {childList:true}); bereitSchmuck(); }
window.EP_DUELL = { matchStart, matchStop, BOTS };
})();
