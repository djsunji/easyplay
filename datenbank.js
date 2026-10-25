/* easyplay: Verbindung zum eigenen Server (server/), ersetzt die Supabase-Bibliothek.
   Gleiche Bedienung wie supabase-js, soweit easyplay sie nutzt: window.supabase.createClient(url, schluessel)
   mit .auth (Anmeldung) und .from(tabelle) / .rpc(funktion). Kein Code von fremden Servern nötig.
   Speicher: ep-sitzung (Anmeldung dieses Geräts). */
(function(){
"use strict";
const SPEICHER = "ep-sitzung";
const lesen = () => { try{ return JSON.parse(localStorage.getItem(SPEICHER) || "null"); }catch(e){ return null; } };
const schreiben = s => { try{ s ? localStorage.setItem(SPEICHER, JSON.stringify(s)) : localStorage.removeItem(SPEICHER); }catch(e){} };
const fehlerAus = (j, status) => ({ message: (j && (j.message || j.msg || j.error_description || j.error)) || ("Fehler " + status), code: j && (j.code !== undefined ? String(j.code) : j.error_code) || String(status), details: j && j.details || null, hint: j && j.hint || null, status });

function createClient(url, schluessel){
  const B = String(url || "").replace(/\/$/, "");
  const hoerer = new Set();
  let sitzung = lesen(), zeit = 0, laeuft = null;

  const melden = (ereignis, s) => hoerer.forEach(f => { try{ f(ereignis, s); }catch(e){ console.error(e); } });
  function setzen(s, ereignis){
    sitzung = s || null; schreiben(sitzung); clearTimeout(zeit);
    if(sitzung && sitzung.expires_at){ const ms = Math.max(5000, sitzung.expires_at * 1000 - Date.now() - 120000); zeit = setTimeout(() => erneuern().catch(() => {}), ms); }
    if(ereignis) melden(ereignis, sitzung);
  }
  async function anfrage(pfad, opt = {}){
    const h = { apikey: schluessel, "Content-Type": "application/json", ...(opt.headers || {}) };
    let r;
    try{ r = await fetch(B + pfad, { ...opt, headers: h }); }
    catch(e){ return { status: 0, j: null, fehler: { message: "Keine Verbindung zum Server", code: "netz", status: 0 } }; }
    const t = await r.text(); let j = null; try{ j = t ? JSON.parse(t) : null; }catch(e){}
    return { status: r.status, j, fehler: r.ok ? null : fehlerAus(j, r.status) };
  }
  async function erneuern(){
    if(laeuft) return laeuft;
    laeuft = (async () => {
      /* Hat ein anderes Fenster schon erneuert? Dann dessen Sitzung übernehmen (Tokens gelten nur einmal) */
      const g = lesen();
      if(g && sitzung && g.refresh_token !== sitzung.refresh_token && g.expires_at * 1000 > Date.now() + 60000){ setzen(g, "TOKEN_REFRESHED"); return { data: { session: g, user: g.user }, error: null }; }
      const s = sitzung; if(!s || !s.refresh_token) return { data: { session: null, user: null }, error: null };
      const r = await anfrage("/auth/v1/token?grant_type=refresh_token", { method: "POST", body: JSON.stringify({ refresh_token: s.refresh_token }) });
      if(r.fehler){
        if(r.status >= 400 && r.status < 500){ setzen(null, "SIGNED_OUT"); }   // abgelaufen oder abgemeldet
        return { data: { session: null, user: null }, error: r.fehler };
      }
      setzen(r.j, "TOKEN_REFRESHED");
      return { data: { session: r.j, user: r.j.user }, error: null };
    })();
    try{ return await laeuft; } finally{ laeuft = null; }
  }
  async function gueltigeSitzung(){
    if(sitzung && sitzung.expires_at && sitzung.expires_at * 1000 - Date.now() < 60000) await erneuern();
    return sitzung;
  }
  const kopf = async () => { const s = await gueltigeSitzung(); return s ? { Authorization: "Bearer " + s.access_token } : {}; };

  /* Anmeldung aus dem Link (Bestätigung, neues Passwort, Google, Apple): #access_token=… in der Adresse */
  (function ausAdresse(){
    try{
      const h = location.hash || "";
      if(!/(^#|&)(access_token|error_description)=/.test(h)) return;
      const p = new URLSearchParams(h.slice(1));
      history.replaceState(null, "", location.pathname + location.search);
      if(p.get("error_description")){ setTimeout(() => melden("ERROR", null), 0); window.EP_ANMELDEFEHLER = p.get("error_description"); return; }
      const s = { access_token: p.get("access_token"), refresh_token: p.get("refresh_token"), expires_in: +p.get("expires_in") || 3600, expires_at: +p.get("expires_at") || Math.floor(Date.now() / 1000) + 3600, token_type: "bearer", user: null };
      sitzung = s; schreiben(s);
      anfrage("/auth/v1/user", { headers: { Authorization: "Bearer " + s.access_token } }).then(r => {
        if(r.fehler) return setzen(null, "SIGNED_OUT");
        setzen({ ...s, user: r.j }, p.get("type") === "recovery" ? "PASSWORD_RECOVERY" : "SIGNED_IN");
      });
    }catch(e){}
  })();
  if(sitzung) setzen(sitzung);   // Zeitgeber für das Erneuern starten

  const auth = {
    async getSession(){ return { data: { session: await gueltigeSitzung() }, error: null }; },
    async getUser(){ const r = await anfrage("/auth/v1/user", { headers: await kopf() }); return { data: { user: r.j && !r.fehler ? r.j : null }, error: r.fehler }; },
    onAuthStateChange(f){
      hoerer.add(f);
      setTimeout(() => { if(hoerer.has(f)) try{ f("INITIAL_SESSION", sitzung && sitzung.user ? sitzung : null); }catch(e){} }, 0);
      return { data: { subscription: { unsubscribe(){ hoerer.delete(f); } } } };
    },
    async signInWithPassword({ email, password }){
      const r = await anfrage("/auth/v1/token?grant_type=password", { method: "POST", body: JSON.stringify({ email, password }) });
      if(r.fehler) return { data: { user: null, session: null }, error: r.fehler };
      setzen(r.j, "SIGNED_IN"); return { data: { user: r.j.user, session: r.j }, error: null };
    },
    async signUp({ email, password, options = {} }){
      const ziel = options.emailRedirectTo ? "?redirect_to=" + encodeURIComponent(options.emailRedirectTo) : "";
      const r = await anfrage("/auth/v1/signup" + ziel, { method: "POST", body: JSON.stringify({ email, password, data: options.data || {} }) });
      if(r.fehler) return { data: { user: null, session: null }, error: r.fehler };
      if(r.j && r.j.access_token){ setzen(r.j, "SIGNED_IN"); return { data: { user: r.j.user, session: r.j }, error: null }; }
      return { data: { user: r.j && r.j.user, session: null }, error: null };
    },
    async signOut(){
      const h = sitzung ? { Authorization: "Bearer " + sitzung.access_token } : {};
      setzen(null, "SIGNED_OUT");
      if(h.Authorization) await anfrage("/auth/v1/logout", { method: "POST", headers: h });
      return { error: null };
    },
    async refreshSession(){ return erneuern(); },
    async resetPasswordForEmail(email, opt = {}){
      const ziel = opt.redirectTo ? "?redirect_to=" + encodeURIComponent(opt.redirectTo) : "";
      const r = await anfrage("/auth/v1/recover" + ziel, { method: "POST", body: JSON.stringify({ email }) });
      return { data: {}, error: r.fehler };
    },
    async updateUser(daten){
      const r = await anfrage("/auth/v1/user", { method: "PUT", headers: await kopf(), body: JSON.stringify(daten || {}) });
      if(r.fehler) return { data: { user: null }, error: r.fehler };
      if(sitzung){ sitzung = { ...sitzung, user: r.j }; schreiben(sitzung); melden("USER_UPDATED", sitzung); }
      return { data: { user: r.j }, error: null };
    },
    async signInWithOAuth({ provider, options = {} }){
      const ziel = options.redirectTo || (location.origin + location.pathname);
      location.assign(B + "/auth/v1/authorize?provider=" + encodeURIComponent(provider) + "&redirect_to=" + encodeURIComponent(ziel));
      return { data: { provider }, error: null };
    },
  };

  /* ---------- Tabellen (Abfrage wie bei supabase-js) ---------- */
  function from(tabelle){
    const q = { art: "lesen", select: "*", filter: [], order: [], limit: null, offset: null, body: null, prefer: [] };
    const b = {
      select(s){ if(q.art === "lesen") q.select = s || "*"; else { q.prefer.push("return=representation"); if(s) q.select = s; } return b; },
      eq(k, v){ q.filter.push([k, "eq." + v]); return b; },
      neq(k, v){ q.filter.push([k, "neq." + v]); return b; },
      gt(k, v){ q.filter.push([k, "gt." + v]); return b; }, gte(k, v){ q.filter.push([k, "gte." + v]); return b; },
      lt(k, v){ q.filter.push([k, "lt." + v]); return b; }, lte(k, v){ q.filter.push([k, "lte." + v]); return b; },
      is(k, v){ q.filter.push([k, "is." + v]); return b; },
      in(k, liste){ q.filter.push([k, "in.(" + (liste || []).map(x => /[,()"]/.test(String(x)) ? '"' + String(x).replace(/"/g, "") + '"' : String(x)).join(",") + ")"]); return b; },
      order(k, opt = {}){ q.order.push(k + "." + (opt.ascending === false ? "desc" : "asc")); return b; },
      limit(n){ q.limit = n; return b; },
      range(a, z){ q.offset = a; q.limit = z - a + 1; return b; },
      insert(rows){ q.art = "neu"; q.body = rows; q.prefer.push("return=representation"); return b; },
      upsert(rows, opt = {}){ q.art = "neu"; q.body = rows; q.prefer.push(opt.ignoreDuplicates ? "resolution=ignore-duplicates" : "resolution=merge-duplicates", "return=representation"); return b; },
      update(werte){ q.art = "aendern"; q.body = werte; q.prefer.push("return=representation"); return b; },
      delete(){ q.art = "loeschen"; return b; },
      async ausfuehren(){
        const p = new URLSearchParams();
        if(q.art === "lesen") p.set("select", q.select);
        q.filter.forEach(([k, v]) => p.append(k, v));
        if(q.order.length) p.set("order", q.order.join(","));
        if(q.limit != null) p.set("limit", q.limit); if(q.offset != null) p.set("offset", q.offset);
        const methode = { lesen: "GET", neu: "POST", aendern: "PATCH", loeschen: "DELETE" }[q.art];
        const h = await kopf(); if(q.prefer.length) h.Prefer = [...new Set(q.prefer)].join(",");
        const r = await anfrage("/rest/v1/" + tabelle + (p.toString() ? "?" + p : ""), { method: methode, headers: h, body: q.body != null ? JSON.stringify(q.body) : undefined });
        if(r.status === 401 && sitzung){ const n = await erneuern(); if(!n.error) return b.ausfuehren(); }
        return { data: r.fehler ? null : r.j, error: r.fehler, status: r.status };
      },
      then(ok, nein){ return b.ausfuehren().then(ok, nein); },
    };
    return b;
  }
  async function rpc(name, args){
    const r = await anfrage("/rest/v1/rpc/" + name, { method: "POST", headers: await kopf(), body: JSON.stringify(args || {}) });
    if(r.status === 401 && sitzung){ const n = await erneuern(); if(!n.error){ const r2 = await anfrage("/rest/v1/rpc/" + name, { method: "POST", headers: await kopf(), body: JSON.stringify(args || {}) }); return { data: r2.fehler ? null : r2.j, error: r2.fehler }; } }
    return { data: r.fehler ? null : r.j, error: r.fehler };
  }
  return { auth, from, rpc };
}
window.supabase = { createClient };
})();
