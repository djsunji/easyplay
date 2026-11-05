/* ===== Konto löschen (05.11.)
   Wer ein Konto hat, kann es selbst löschen: Profil bearbeiten, Einstellungen am Computer (Zahnrad der Profilseite)
   und Profil-Tab › Einstellungen in der App. Der Server löscht Konto, Profil, Punkte, Rangliste, Kommentare, Sitzungen
   und bei Lehrpersonen Klassen, Tests und Abgaben (DELETE /auth/v1/user, server/auth.js).
   Öffnen: window.EP_KONTO_LOESCHEN.oeffnen() ===== */
(function(){
  if(window.EP_KONTO_LOESCHEN) return;
  const hx = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
const KUEBEL = `<svg viewBox="0 0 24 24" aria-hidden="true" class="ep-kl-svg"><path fill="currentColor" d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-3 6h12l-1 11.2A2 2 0 0 1 15 22H9a2 2 0 0 1-2-1.8L6 9Zm4 2v8h1.6v-8H10Zm2.4 0v8H14v-8h-1.6Z"/></svg>`;
  const BEHALTEN = /^(ep-x-i18n-sprache|ep-x-i18n-gefragt|ep-hg|ep-hintergrund|ep-ton|ep-stumm|ep-theme|ep-dunkel)$/;
  const auth = () => { try{ return AUTH; }catch(e){ return null; } };
  const profil = () => { try{ return S.profil; }catch(e){ return null; } };
  const istLehrer = () => { const a = auth(); try{ return !!(a && a.user && (a.user.app_metadata || {}).rolle === "lehrperson"); }catch(e){ return false; } };

  function sitzung(){ try{ return JSON.parse(localStorage.getItem("ep-sitzung") || "null"); }catch(e){ return null; } }
  async function tokenHolen(){
    const a = auth(); if(!a || !a.sb) return null;
    try{ const r = await a.sb.auth.getSession(); const t = r && r.data && r.data.session && r.data.session.access_token; if(t) return t; }catch(e){}
    const s = sitzung(); return s && s.access_token || null;
  }
  async function serverLoeschen(pw){
    const cfg = window.EP_CONFIG || {}; const basis = String(cfg.supabaseUrl || location.origin).replace(/\/$/, "");
    const t = await tokenHolen(); if(!t) throw new Error("Du bist nicht mehr angemeldet. Bitte melde dich neu an und versuche es nochmals.");
    let r;
    try{ r = await fetch(basis + "/auth/v1/user", { method: "DELETE", headers: { apikey: cfg.supabaseKey || "ep", "Content-Type": "application/json", Authorization: "Bearer " + t },
      body: JSON.stringify({ password: pw || "", bestaetigung: "LÖSCHEN" }) }); }
    catch(e){ throw new Error("Keine Verbindung zum Server. Bitte versuche es später nochmals."); }
    if(r.ok) return true;
    let j = {}; try{ j = await r.json(); }catch(e){}
    const code = j.error_code || j.error || "";
    if(code === "invalid_credentials") throw Object.assign(new Error("Das Passwort stimmt nicht."), { feld: "pw" });
    if(code === "admin_konto") throw new Error("Ein Admin-Konto kann nur in der Verwaltung gelöscht werden.");
    if(r.status === 401) throw new Error("Du bist nicht mehr angemeldet. Bitte melde dich neu an und versuche es nochmals.");
    if(r.status === 429) throw new Error("Zu viele Versuche. Bitte versuche es in einer Stunde nochmals.");
    throw new Error(j.msg || j.error_description || "Das Konto konnte nicht gelöscht werden.");
  }
  function geraetLeeren(mail){
    try{
      const weg = [];
      for(let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); if(k && /^ep/.test(k) && !BEHALTEN.test(k)) weg.push(k); }
      weg.forEach(k => localStorage.removeItem(k));
    }catch(e){}
    try{ sessionStorage.clear(); }catch(e){}
    if(mail) try{ const k = JSON.parse(localStorage.getItem("ep-konten") || "{}"); delete k[mail]; localStorage.setItem("ep-konten", JSON.stringify(k)); }catch(e){}
  }

  let el = null;
  function zu(){ if(el){ el.remove(); el = null; document.documentElement.classList.remove("ep-kl-offen"); } }
  function oeffnen(){
    const p = profil(); if(!p){ try{ go("login"); }catch(e){} return; }
    zu();
    const a = auth(), online = !!(a && a.modus === "supabase" && a.user);
    const mitPw = online ? (a.user.hat_passwort !== false) : false;
    el = document.createElement("div"); el.className = "ep-kl"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-labelledby", "epKlT");
    el.innerHTML = `<div class="ep-kl-grund" data-zu></div>
      <section class="ep-kl-box">
        <button type="button" class="ep-kl-x" data-zu aria-label="Schliessen">✕</button>
        <div class="ep-kl-kopf"><span class="ep-kl-ic">${KUEBEL}</span><h2 id="epKlT">Konto löschen</h2></div>
        <p class="ep-kl-txt">Wenn du dein Konto löschst, ist es für immer weg. Das kann man nicht rückgängig machen.</p>
        <ul class="ep-kl-liste">
          <li>Dein Konto${p.email ? ` <b>${hx(p.email)}</b>` : ""} und dein Profil mit Name, Figur und Verzierungen</li>
          <li>Deine Punkte, Level, Abzeichen und dein Platz in der Rangliste</li>
          <li>Deine Kommentare</li>
          ${istLehrer() ? "<li>Deine Klassen, Tests und Abgaben im Lehrerbereich</li>" : ""}
        </ul>
        <p class="ep-kl-tipp">Tipp für Kinder: Frag zuerst deine Eltern.</p>
        <form class="ep-kl-form" novalidate>
          ${mitPw ? `<label class="ep-kl-feld"><span>Dein Passwort</span><input type="password" id="epKlPw" autocomplete="current-password" required></label>` : ""}
          <label class="ep-kl-feld"><span>Tippe zur Bestätigung <b>LÖSCHEN</b></span><input type="text" id="epKlBest" autocomplete="off" autocapitalize="characters" spellcheck="false" required></label>
          <label class="ep-kl-cb"><input type="checkbox" id="epKlGeraet" checked><span>Spielstand auf diesem Gerät auch löschen</span></label>
          <p class="ep-kl-fehler" role="alert" hidden></p>
          <div class="ep-kl-knoepfe">
            <button type="button" class="ep-kl-ab" data-zu>Abbrechen</button>
            <button type="submit" class="ep-kl-los" disabled>Konto endgültig löschen</button>
          </div>
        </form>
      </section>`;
    document.body.appendChild(el); document.documentElement.classList.add("ep-kl-offen");
    const f = el.querySelector("form"), los = el.querySelector(".ep-kl-los"), fehler = el.querySelector(".ep-kl-fehler");
    const best = el.querySelector("#epKlBest"), pw = el.querySelector("#epKlPw");
    const pruefen = () => { los.disabled = best.value.trim().toUpperCase() !== "LÖSCHEN" || (pw && !pw.value); };
    best.oninput = pruefen; if(pw) pw.oninput = pruefen;
    el.querySelectorAll("[data-zu]").forEach(b => b.onclick = zu);
    el.addEventListener("keydown", e => { if(e.key === "Escape") zu(); });
    (pw || best).focus();
    f.onsubmit = async e => {
      e.preventDefault(); if(los.disabled) return;
      fehler.hidden = true; los.disabled = true; los.textContent = "Wird gelöscht …";
      const mail = p.email || "";
      try{
        if(online) await serverLoeschen(pw ? pw.value : "");
        try{ if(a && a.sb) await a.sb.auth.signOut(); }catch(err){}
        try{ if(a) a.user = null; }catch(err){}
        if(el.querySelector("#epKlGeraet").checked) geraetLeeren(mail);
        else{ try{ localStorage.removeItem("ep-profil"); localStorage.removeItem("ep-profil-alt"); localStorage.removeItem("ep-sitzung");
          const k = JSON.parse(localStorage.getItem("ep-konten") || "{}"); delete k[mail]; localStorage.setItem("ep-konten", JSON.stringify(k)); }catch(err){} }
        try{ S.profil = null; }catch(err){}
        fertig();
      }catch(err){
        fehler.textContent = err.message || "Das Konto konnte nicht gelöscht werden."; fehler.hidden = false;
        los.textContent = "Konto endgültig löschen"; pruefen();
        if(err.feld === "pw" && pw){ pw.value = ""; pw.focus(); pruefen(); }
      }
    };
  }
  function fertig(){
    const box = el && el.querySelector(".ep-kl-box"); if(!box) return;
    box.innerHTML = `<div class="ep-kl-kopf ep-kl-ok"><img class="ep-kl-kids" src="img/kids/duo-winken.webp" alt=""><h2 id="epKlT">Dein Konto ist gelöscht</h2></div>
      <p class="ep-kl-txt">Schade, dass du gehst. Du kannst easyplay weiter ohne Konto spielen oder jederzeit ein neues Konto erstellen.</p>
      <div class="ep-kl-knoepfe"><button type="button" class="ep-kl-los ep-kl-weiter">Zur Startseite</button></div>`;
    box.querySelector(".ep-kl-weiter").onclick = () => { zu(); try{ go("home"); }catch(e){} setTimeout(() => location.replace(location.origin + "/"), 150); };
    box.querySelector(".ep-kl-weiter").focus();
  }

  /* Knopf «Konto löschen» an drei Stellen einsetzen */
  function knopf(cls){ const b = document.createElement("button"); b.type = "button"; b.className = "ep-kl-knopf " + (cls || ""); b.innerHTML = `${KUEBEL}<span>Konto löschen</span>`; b.onclick = e => { e.preventDefault(); e.stopPropagation(); oeffnen(); }; return b; }
  function einsetzen(){
    if(!profil()) return;
    let scr = ""; try{ scr = S.screen; }catch(e){}
    const app = document.getElementById("app"); if(!app) return;
    /* 1 Profil bearbeiten (Seite register mit Profil) */
    if(scr === "register" && !app.querySelector(".ep-kl-zone")){
      const ziel = app.querySelector(".regw") || app;
      const w = document.createElement("div"); w.className = "ep-kl-zone";
      w.innerHTML = `<b>Konto löschen</b><small>Dein Konto und alles, was dazugehört, für immer löschen.</small>`;
      w.appendChild(knopf()); ziel.appendChild(w);
    }
    /* 2 Zahnrad-Fenster der Profilseite (Computer) */
    const ein = document.querySelector("#ppEinst .pp-einst-box");
    if(ein && !ein.querySelector(".ep-kl-knopf")) ein.appendChild(knopf("ep-kl-imfenster"));
    /* 3 App: Profil-Tab › Einstellungen, unter «Abmelden» */
    const ab = app.querySelector(".ap-escroll .ap-eab");
    if(ab && !ab.parentNode.querySelector(".ep-kl-knopf")) ab.insertAdjacentElement("afterend", knopf("ep-kl-app"));
  }
  let plan = 0;
  const bald = () => { cancelAnimationFrame(plan); plan = requestAnimationFrame(einsetzen); };
  const los = () => { const app = document.getElementById("app"); if(!app) return setTimeout(los, 300);
    new MutationObserver(bald).observe(app, { childList: true, subtree: true });
    new MutationObserver(m => { if(m.some(x => [...x.addedNodes].some(n => n.id === "ppEinst" || (n.querySelector && n.querySelector("#ppEinst"))))) bald(); }).observe(document.body, { childList: true, subtree: true });
    bald(); };
  los();

  const c = document.createElement("style"); c.id = "ep-kontoloeschen-css";
  c.textContent = `
.ep-kl{position:fixed;inset:0;z-index:12000;display:grid;place-items:center;padding:16px;box-sizing:border-box;font-family:Lexend,system-ui,-apple-system,"Segoe UI",sans-serif}
.ep-kl-grund{position:absolute;inset:0;background:rgba(14,10,40,.62);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px)}
.ep-kl-box{position:relative;width:min(470px,100%);max-height:calc(100dvh - 32px);overflow:auto;box-sizing:border-box;padding:22px 22px 20px;border-radius:28px;background:#fff;color:#2E2560;box-shadow:0 24px 60px rgba(10,8,40,.45);animation:epKlRein .22s ease-out}
@keyframes epKlRein{from{transform:translateY(14px) scale(.98);opacity:0}}
.ep-kl-x{position:absolute;right:12px;top:12px;width:40px;height:40px;border-radius:50%;border:0;background:#F1EEFF;color:#2E2560;font:900 1rem system-ui;cursor:pointer}
.ep-kl-kopf{display:flex;align-items:center;gap:12px;margin:0 40px 10px 0}
.ep-kl-kopf h2{margin:0;font-size:1.35rem;line-height:1.2;color:#2E2560}
.ep-kl-ic{flex:0 0 auto;display:grid;place-items:center;width:52px;height:52px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#FFD9D9,#FF6B6B 60%,#D7263D)}
.ep-kl-ic .ep-kl-svg{width:28px;height:28px;color:#fff}
.ep-kl-txt{margin:0 0 10px;font-size:1rem;line-height:1.45}
.ep-kl-liste{margin:0 0 10px;padding:10px 12px 10px 30px;border-radius:16px;background:#FFF1F1;color:#7A1F2B;font-size:.94rem;line-height:1.45}
.ep-kl-liste li{margin:2px 0}
.ep-kl-liste b{word-break:break-all}
.ep-kl-tipp{margin:0 0 12px;font-size:.9rem;color:#5C5590}
.ep-kl-form{display:grid;gap:12px}
.ep-kl-feld{display:grid;gap:5px;font-size:.95rem;font-weight:700}
.ep-kl-feld input{box-sizing:border-box;width:100%;min-height:48px;padding:10px 14px;border-radius:14px;border:2px solid #DCD6FF;background:#FAF9FF;color:#2E2560;font:600 1.05rem Lexend,system-ui,sans-serif}
.ep-kl-feld input:focus{outline:none;border-color:#6A4BFF;box-shadow:0 0 0 3px rgba(106,75,255,.2)}
.ep-kl-cb{display:flex;align-items:center;gap:10px;font-size:.95rem;cursor:pointer}
.ep-kl-cb input{width:22px;height:22px;accent-color:#6A4BFF;flex:0 0 auto}
.ep-kl-fehler{margin:0;padding:10px 12px;border-radius:12px;background:#FFE3E3;color:#B3122A;font-weight:700;font-size:.95rem}
.ep-kl-knoepfe{display:flex;flex-wrap:wrap;gap:10px;justify-content:flex-end;margin-top:4px}
.ep-kl-knoepfe button{min-height:48px;padding:10px 18px;border-radius:999px;border:0;font:800 1rem Lexend,system-ui,sans-serif;cursor:pointer}
.ep-kl-ab{background:#F1EEFF;color:#2E2560}
.ep-kl-los{background:linear-gradient(135deg,#FF5A5F,#D7263D);color:#fff;box-shadow:0 8px 18px -8px rgba(215,38,61,.7)}
.ep-kl-los:disabled{opacity:.45;cursor:not-allowed;box-shadow:none}
.ep-kl-weiter{background:linear-gradient(135deg,#6A4BFF,#A43BE0 55%,#E8409F)}
.ep-kl-ok{flex-direction:column;text-align:center;margin-right:0}
.ep-kl-kids{width:150px;height:auto}
@media (max-width:420px){.ep-kl-box{padding:18px 16px 16px}.ep-kl-kopf h2{font-size:1.2rem}.ep-kl-ic{width:44px;height:44px}.ep-kl-txt,.ep-kl-liste{font-size:.9rem}.ep-kl-knoepfe button{flex:1 1 100%}}
html.ep-kl-offen{overflow:hidden}
/* Knopf an den drei Orten */
.ep-kl-knopf{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:8px 16px;border-radius:999px;border:2px solid #FF8A8F;background:#fff;color:#C2183A;font:800 .95rem Lexend,system-ui,sans-serif;cursor:pointer}
.ep-kl-knopf .ep-kl-svg{width:22px;height:22px;flex:0 0 auto}
.ep-kl-knopf:hover{background:#FFF1F1}
.ep-kl-zone{display:grid;gap:6px;justify-items:start;margin:18px 0 6px;padding:14px 16px;border-radius:20px;background:rgba(255,255,255,.92);color:#2E2560;box-shadow:0 8px 20px -10px rgba(30,20,90,.35)}
.ep-kl-zone b{font-size:1.05rem}
.ep-kl-zone small{font-size:.9rem;color:#5C5590}
.ep-kl-imfenster{margin:18px 2px 0}
html body #app .ap-escroll .ep-kl-app{display:flex;width:100%;justify-content:center;margin-top:8px;box-sizing:border-box}`;
  document.head.appendChild(c);

  window.EP_KONTO_LOESCHEN = { oeffnen };
})();
