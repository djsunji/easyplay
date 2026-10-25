/* easyplay: Hinweis an alle und Themenplan aus der Verwaltung.
   Liest beim Start einmal oeffentlich_lesen() vom eigenen Server (supabase/verwaltung.sql) und merkt sich die Antwort,
   damit Themenplan und Hinweis auch ohne Netz gelten. Ohne Server (GitHub Pages) passiert nichts.
   window.EP_PLAN = {woche:{"2026-W44":"thema"}, live:{"2026-10-26-12":"thema"}} nutzt startseite.js. */
(function(){
"use strict";
const SPEICHER = "ep-oeffentlich", WEG = "ep-hinweis-weg";
const lesen = (k, d) => { try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } };
const schreiben = (k, v) => { try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} };
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));

const alt = lesen(SPEICHER, null);
window.EP_PLAN = (alt && alt.themenplan) || {};

const FARBE = { info:"linear-gradient(135deg,#7B3FE4,#3D5AFE)", wartung:"linear-gradient(135deg,#F28A1A,#E0531F)", warnung:"linear-gradient(135deg,#E0335A,#B4123E)", freude:"linear-gradient(135deg,#17B07C,#0E8E9C)" };
const SYMBOL = { info:"💬", wartung:"🛠️", warnung:"⚠️", freude:"🎉" };

function zeigen(h){
  const da = document.getElementById("ep-hinweis");
  if(!h || !h.text || lesen(WEG, "") === h.id){ if(da) da.remove(); return; }
  if(da && da.dataset.id === h.id) return;
  if(da) da.remove();
  const el = document.createElement("div");
  el.id = "ep-hinweis"; el.dataset.id = h.id || ""; el.setAttribute("role", "status");
  const art = FARBE[h.art] ? h.art : "info";
  const link = h.link && /^(https:\/\/|#|\/)/.test(h.link) ? h.link : "";
  el.innerHTML = `<span class="eph-sym" aria-hidden="true">${SYMBOL[art]}</span><span class="eph-text">${esc(h.text)}${link ? ` <a href="${esc(link)}"${/^https:/.test(link) ? ' target="_blank" rel="noopener"' : ""}>Mehr</a>` : ""}</span><button type="button" aria-label="Hinweis schliessen">✕</button>`;
  /* unten, damit Kopfzeile und Logo frei bleiben; in der App-Ansicht (Handy, iPad) über der Tab-Leiste */
  let app = false; try{ app = matchMedia("(max-width: 760px), (pointer: coarse) and (max-width: 1366px)").matches; }catch(e){}
  el.style.cssText = `position:fixed;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom,0px) + ${app ? 104 : 18}px);z-index:2147483000;display:flex;align-items:center;gap:10px;width:max-content;max-width:min(680px,calc(100vw - 24px));box-sizing:border-box;padding:10px 10px 10px 14px;border-radius:16px;background:${FARBE[art]};color:#fff;font:600 15px/1.35 system-ui,-apple-system,"Segoe UI",sans-serif;box-shadow:0 10px 30px rgba(20,10,60,.28)`;
  const a = el.querySelector("a"); if(a) a.style.cssText = "color:#fff;text-decoration:underline;font-weight:800";
  const b = el.querySelector("button");
  b.style.cssText = "flex:none;width:34px;height:34px;border-radius:50%;border:0;background:rgba(255,255,255,.22);color:#fff;font-size:16px;cursor:pointer";
  b.onclick = () => { schreiben(WEG, h.id || ""); el.remove(); };
  (document.body || document.documentElement).appendChild(el);
}

function wennBereit(f){ if(document.body) f(); else document.addEventListener("DOMContentLoaded", f, {once:true}); }
if(alt && alt.hinweis) wennBereit(() => zeigen(alt.hinweis));

const url = String((window.EP_CONFIG || {}).supabaseUrl || "").replace(/\/$/, "");
if(!url) return;
const ab = typeof AbortController === "function" ? new AbortController() : null;
const zeit = setTimeout(() => { try{ ab && ab.abort(); }catch(e){} }, 8000);
fetch(url + "/rest/v1/rpc/oeffentlich_lesen", { method:"POST", headers:{ apikey:(window.EP_CONFIG || {}).supabaseKey || "easyplay", "Content-Type":"application/json" }, body:"{}", cache:"no-store", signal: ab ? ab.signal : undefined })
  .then(r => r.ok ? r.json() : null)
  .then(j => {
    clearTimeout(zeit);
    if(!j || typeof j !== "object") return;
    const plan = j.themenplan && typeof j.themenplan === "object" ? j.themenplan : {};
    const geaendert = JSON.stringify(plan) !== JSON.stringify(window.EP_PLAN || {});
    schreiben(SPEICHER, { hinweis: j.hinweis || null, themenplan: plan, zeit: Date.now() });
    window.EP_PLAN = plan;
    wennBereit(() => zeigen(j.hinweis || null));
    if(geaendert) try{ window.dispatchEvent(new CustomEvent("ep-plan")); }catch(e){}
  })
  .catch(() => clearTimeout(zeit));
})();
