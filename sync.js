/* easyplay: Spielstand mit Konto auf allen Geräten (eigener Server, supabase/spielstand.sql).
   Mit Konto wird der Fortschritt aus dem Browser (alle Einträge «ep-…» ausser Gerät- und Anmeldedaten) im Konto
   gespeichert und beim Öffnen auf einem anderen Gerät dazugemischt:
   - Zahlen: der grössere Wert (XP, Bestwerte, Zähler)
   - Listen mit Zahlen oder Texten: beide zusammen (z. B. gelöste Fragen)
   - Listen mit Einträgen mit «id»: nach id zusammen
   - Objekte: Feld für Feld
   - sonst (Texte, Ja/Nein, Einstellungen): der neuere Stand
   Meldet sich auf einem Gerät ein anderes Konto an, ersetzt der Stand des neuen Kontos den alten (nichts wird vermischt).
   Hat das Mischen etwas geändert, lädt die Seite einmal neu, damit alle Teile den neuen Stand zeigen.
   Hochgeladen wird höchstens alle 20 s, wenn sich etwas geändert hat, und beim Verlassen der Seite. */
(function(){
"use strict";
if(window.claude || window.__epSync) return; window.__epSync = true;
const CFG = window.EP_CONFIG || {};
const URL_ = String(CFG.supabaseUrl || "").replace(/\/$/, ""), KEY = CFG.supabaseKey || "easyplay";
if(!URL_) return;

/* Einträge, die zum Gerät oder zur Anmeldung gehören, nie übertragen */
const NIE = new Set(["ep-app", "ep-boot", "ep-sitzung", "ep-konten", "ep-abgemeldet", "ep-umzug", "ep-neustart", "ep-letztemail",
  "ep-profil", "ep-profil-alt", "ep-lz-nach-login", "ep-hinweis", "ep-x-offline", "ep-voice", "ep-tagmodus", "ep-x-hilfen-schrift",
  "ep-sync-uid", "ep-sync-zeit", "ep-sync-hash"]);
/* Hier gilt immer der neuere Stand (Einträge können auch wegfallen, z. B. geübte Fehler) */
const NEUER = new Set(["ep-fehler", "ep-wiederholen", "ep-stufe", "ep-anzahl", "ep-team", "ep-bg", "ep-duell-modus", "ep-duellgeraet"]);
const MAX_EINTRAG = 300e3, MAX_ALLES = 1400e3;

const passt = k => /^ep-/.test(k) && !NIE.has(k) && !/^ep-sync/.test(k);
const ls = { get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }, set(k, v){ try{ localStorage.setItem(k, v); }catch(e){} }, del(k){ try{ localStorage.removeItem(k); }catch(e){} } };
const konto = () => { try{ return AUTH && AUTH.modus === "supabase" ? AUTH.user : null; }catch(e){ return null; } };
async function token(){ try{ const r = await AUTH.sb.auth.getSession(); return r && r.data && r.data.session ? r.data.session.access_token : ""; }catch(e){ return ""; } }
async function rpc(name, args, keepalive){
  const t = await token(); if(!t) throw new Error("keine Sitzung");
  const r = await fetch(URL_ + "/rest/v1/rpc/" + name, { method:"POST", cache:"no-store", keepalive: !!keepalive,
    headers:{ apikey:KEY, "Content-Type":"application/json", Authorization:"Bearer " + t }, body: JSON.stringify(args || {}) });
  const txt = await r.text(); let j = null; try{ j = txt ? JSON.parse(txt) : null; }catch(e){}
  if(!r.ok) throw new Error((j && j.message) || ("Server " + r.status));
  return j;
}

function sammeln(){
  const o = {}; let n = 0;
  try{
    for(let i = 0; i < localStorage.length; i++){
      const k = localStorage.key(i); if(!passt(k)) continue;
      const v = localStorage.getItem(k); if(v == null || v.length > MAX_EINTRAG) continue;
      if(n + v.length > MAX_ALLES) continue;
      o[k] = v; n += v.length + k.length;
    }
  }catch(e){}
  return o;
}
const istObj = x => x && typeof x === "object" && !Array.isArray(x);
const prim = x => x === null || typeof x !== "object";
function mischen(a, b, bNeuer){
  if(a === undefined) return b; if(b === undefined) return a;
  if(typeof a === "number" && typeof b === "number") return Math.max(a, b);
  if(Array.isArray(a) && Array.isArray(b)){
    if(a.every(prim) && b.every(prim)){ const s = new Set(a.map(x => JSON.stringify(x))), out = a.slice(); b.forEach(x => { const j = JSON.stringify(x); if(!s.has(j)){ s.add(j); out.push(x); } }); return out; }
    const mitId = l => l.length && l.every(x => istObj(x) && x.id != null);
    if(mitId(a) && mitId(b)){ const m = new Map(); a.forEach(x => m.set(String(x.id), x)); b.forEach(x => { const k = String(x.id); m.set(k, m.has(k) ? mischen(m.get(k), x, bNeuer) : x); }); return [...m.values()]; }
    return bNeuer ? (b.length >= a.length ? b : a) : (a.length >= b.length ? a : b);
  }
  if(istObj(a) && istObj(b)){ const out = {...a}; Object.keys(b).forEach(k => { out[k] = mischen(a[k], b[k], bNeuer); }); return out; }
  return bNeuer ? b : a;
}
function eintragMischen(k, lok, fern, fernNeuer){
  if(lok == null) return fern; if(fern == null) return lok;
  if(NEUER.has(k)) return fernNeuer ? fern : lok;
  let a, b; try{ a = JSON.parse(lok); b = JSON.parse(fern); }catch(e){ return fernNeuer ? fern : lok; }
  try{ return JSON.stringify(mischen(a, b, fernNeuer)); }catch(e){ return lok; }
}
const pruef = o => { let h = 0; const s = JSON.stringify(o); for(let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return s.length + ":" + h; };

let schmutzig = false, laeuft = false, bereitFuer = "";
/* Änderungen am Spielstand merken (nur «ep-…») */
try{
  const set = Storage.prototype.setItem, del = Storage.prototype.removeItem;
  Storage.prototype.setItem = function(k, v){ set.call(this, k, v); if(this === window.localStorage && passt(String(k))) schmutzig = true; };
  Storage.prototype.removeItem = function(k){ del.call(this, k); if(this === window.localStorage && passt(String(k))) schmutzig = true; };
}catch(e){}

async function hochladen(keepalive){
  const u = konto(); if(!u || bereitFuer !== u.id || laeuft) return;
  const d = sammeln(), h = pruef(d);
  if(h === ls.get("ep-sync-hash")){ schmutzig = false; return; }
  laeuft = true;
  try{ const r = await rpc("spielstand_speichern", {p_daten:d}, keepalive); if(r && r.ok){ ls.set("ep-sync-hash", h); ls.set("ep-sync-zeit", String(Date.parse(r.geaendert) || Date.now())); schmutzig = false; } }
  catch(e){ console.warn("sync.js hochladen:", e.message); }
  finally{ laeuft = false; }
}

async function abgleich(u){
  let fern;
  try{ fern = await rpc("spielstand_holen", {}); }catch(e){ console.warn("sync.js holen:", e.message); return; }
  const daten = (fern && fern.daten) || {}, fernZeit = Date.parse(fern && fern.geaendert) || 0;
  const altUid = ls.get("ep-sync-uid"), anderesKonto = altUid && altUid !== u.id;
  const fernNeuer = fernZeit > (+ls.get("ep-sync-zeit") || 0);
  let geaendert = false;
  if(anderesKonto){
    /* anderes Konto auf diesem Gerät: dessen Stand ersetzt den alten ganz */
    const weg = []; for(let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); if(passt(k) && !(k in daten)) weg.push(k); }
    weg.forEach(k => { ls.del(k); geaendert = true; });
    Object.keys(daten).forEach(k => { if(passt(k) && ls.get(k) !== daten[k]){ ls.set(k, daten[k]); geaendert = true; } });
    ls.del("ep-sync-hash");
  } else {
    Object.keys(daten).forEach(k => {
      if(!passt(k) || typeof daten[k] !== "string") return;
      const lok = ls.get(k), neu = eintragMischen(k, lok, daten[k], fernNeuer);
      if(neu != null && neu !== lok){ ls.set(k, neu); geaendert = true; }
    });
  }
  ls.set("ep-sync-uid", u.id); bereitFuer = u.id;
  if(fernZeit) ls.set("ep-sync-zeit", String(Math.max(fernZeit, +ls.get("ep-sync-zeit") || 0)));
  await hochladen();
  const merk = "ep-sync-neu-" + u.id;
  let schon = false; try{ schon = sessionStorage.getItem(merk) === "1"; sessionStorage.setItem(merk, "1"); }catch(e){}
  if(geaendert && !schon){
    /* nicht mitten im Spiel neu laden */
    const ruhig = () => { try{ return !["quiz", "duellplay", "liveplay", "livehost", "hardcore"].includes(S.screen); }catch(e){ return true; } };
    const los = () => { if(ruhig()) location.reload(); else setTimeout(los, 3000); };
    los();
  }
}

/* Auf die Anmeldung warten, dann einmal pro Konto abgleichen */
let erledigt = "";
setInterval(() => {
  const u = konto();
  if(u && erledigt !== u.id){ erledigt = u.id; abgleich(u); }
  if(!u){ erledigt = ""; bereitFuer = ""; }
}, 1500);
setInterval(() => { if(schmutzig) hochladen(); }, 20000);
document.addEventListener("ep:quizende", () => setTimeout(() => hochladen(), 2500));
addEventListener("pagehide", () => { if(schmutzig) hochladen(true); });
document.addEventListener("visibilitychange", () => { if(document.visibilityState === "hidden" && schmutzig) hochladen(true); });
window.EP_SYNC = { jetzt: () => hochladen(), mischen };
})();
