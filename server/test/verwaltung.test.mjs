// Test der Verwaltungs-Funktionen (supabase/verwaltung.sql, server/admin.js) gegen einen laufenden Server.
// Aufruf wie api.test.mjs: TEST_URL=… MAIL_TEST_DATEI=… DATABASE_URL=… node --test server/test/verwaltung.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import postgres from "postgres";

const B = process.env.TEST_URL || "http://localhost:8090";
const db = postgres(process.env.DATABASE_URL, { onnotice: () => {} });
const z = Math.random().toString(36).slice(2, 8);
const H = (t) => ({ apikey: "ep", "Content-Type": "application/json", ...(t ? { Authorization: "Bearer " + t } : {}) });
const post = (p, b, t) => fetch(B + p, { method: "POST", headers: H(t), body: JSON.stringify(b) });
const rpc = async (name, args, t) => { const r = await post("/rest/v1/rpc/" + name, args || {}, t); const txt = await r.text(); return { status: r.status, j: txt ? JSON.parse(txt) : null }; };
const letzteMail = an => { const l = readFileSync(process.env.MAIL_TEST_DATEI, "utf8").trim().split("\n").map(JSON.parse).filter(m => m.an === an); return l[l.length - 1]; };
async function konto(mail, meta) {
  let r = await post("/auth/v1/signup", { email: mail, password: "geheim-123", data: meta });
  assert.equal(r.status, 200, await r.clone().text());
  const link = /(http\S+verify\S+)/.exec(letzteMail(mail).text)[1];
  r = await fetch(link, { redirect: "manual" });
  const h = new URLSearchParams(new URL(r.headers.get("location")).hash.slice(1));
  const [u] = await db`select id from auth.users where email = ${mail}`;
  return { token: h.get("access_token"), id: u.id };
}

test.after(() => db.end());

test("Verwaltung: Rechte, Einstellungen, Namen, Spiele, Sicherheit, Protokoll, Server", async () => {
  const admin = await konto(`admin-${z}@test.ch`, { vorname: "Ada" });
  const kind = await konto(`kind-${z}@test.ch`, { vorname: "Fuck", nachname: "Muster" });
  await db`insert into public.admins (user_id) values (${admin.id}) on conflict do nothing`;

  // Ohne Admin-Recht: verweigert
  assert.notEqual((await rpc("admin_namen", {}, kind.token)).status, 200);
  let r = await fetch(B + "/api/admin/status", { headers: H(kind.token) }); assert.equal(r.status, 403);
  r = await fetch(B + "/api/admin/status"); assert.equal(r.status, 403);

  // Sperrwörter setzen (gelten sofort für neue Namen)
  assert.equal((await rpc("admin_einstellung_setzen", { p_schluessel: "sperrwoerter", p_wert: ["fuck", "arschloch", "doofi"] }, admin.token)).status, 200);
  assert.notEqual((await rpc("admin_einstellung_setzen", { p_schluessel: "sperrwoerter", p_wert: ["ab"] }, admin.token)).status, 200);

  // Hinweis und Themenplan
  let e = await rpc("admin_einstellung_setzen", { p_schluessel: "hinweis", p_wert: { aktiv: true, text: "Morgen Wartung von 7 bis 8 Uhr", art: "wartung" } }, admin.token);
  assert.equal(e.status, 200, JSON.stringify(e.j));
  e = await rpc("admin_einstellung_setzen", { p_schluessel: "themenplan", p_wert: { woche: { "2026-W44": "ethik" }, live: { "2026-10-26-12": "tiere" } } }, admin.token);
  assert.equal(e.status, 200, JSON.stringify(e.j));
  e = await rpc("admin_einstellung_setzen", { p_schluessel: "themenplan", p_wert: { woche: { "x": "ethik" } } }, admin.token);
  assert.notEqual(e.status, 200);
  const o = await rpc("oeffentlich_lesen", {});
  assert.equal(o.status, 200); assert.equal(o.j.hinweis.art, "wartung"); assert.equal(o.j.themenplan.live["2026-10-26-12"], "tiere");
  assert.ok(o.j.hinweis.id);

  // Sperrwort im Kommentar-Namen wird zu «Kind»
  r = await fetch(B + "/rest/v1/kommentare", { method: "POST", headers: { ...H(kind.token), Prefer: "return=representation" }, body: JSON.stringify({ qeel: "q1", text: "Cooles Video" }) });
  assert.equal(r.status, 201, await r.clone().text());
  assert.equal((await r.json())[0].name, "Kind");

  // Namen: Konto erscheint als verdächtig, Ändern setzt Konto und Kommentare
  const n = await rpc("admin_namen", {}, admin.token);
  assert.equal(n.status, 200, JSON.stringify(n.j));
  const zeile = n.j.find(x => x.quelle === "konto" && x.id === kind.id);
  assert.ok(zeile && zeile.grund, "verdächtig markiert");
  const neu = await rpc("admin_name_aendern", { p_id: kind.id, p_vorname: "Leo", p_nachname: "Muster" }, admin.token);
  assert.equal(neu.j, "Leo M.");
  const [k] = await db`select name from public.kommentare where wer = ${kind.id}`; assert.equal(k.name, "Leo M.");

  // Spiele, Sicherheit, Einstellungen lesen
  await db`insert into public.live_runden (key, team, punkte, richtig, user_id) values ('2026-10-25-20', 'lumi', 999, 10, ${kind.id})`;
  const s = await rpc("admin_spiele", {}, admin.token);
  assert.equal(s.status, 200, JSON.stringify(s.j)); assert.ok(s.j.live.runden.length >= 1); assert.ok(s.j.regionen.woche);
  const top = s.j.live.top.find(x => x.punkte === 999);
  assert.equal((await rpc("admin_live_loeschen", { p_id: top.id }, admin.token)).status, 200);
  assert.equal((await rpc("admin_region_setzen", { p_woche: "2026-W43", p_region: "ds", p_punkte: 100, p_spiele: 2 }, admin.token)).status, 200);
  const si = await rpc("admin_sicherheit", {}, admin.token); assert.equal(si.status, 200, JSON.stringify(si.j)); assert.ok(Array.isArray(si.j.bremse_arten));
  const ei = await rpc("admin_einstellungen", {}, admin.token); assert.deepEqual(ei.j.sperrwoerter.wert.sort(), ["arschloch", "doofi", "fuck"]);

  // Protokoll: Änderungen wurden vom Server festgehalten
  await rpc("admin_notiz", { p_aktion: "github", p_ziel: "werbung.json" }, admin.token);
  const p = await rpc("admin_protokoll_lesen", { p_anzahl: 50 }, admin.token);
  const aktionen = p.j.map(x => x.aktion);
  for (const a of ["admin_einstellung_setzen", "admin_name_aendern", "admin_live_loeschen", "admin_region_setzen", "github"]) assert.ok(aktionen.includes(a), a);
  assert.ok(!aktionen.includes("admin_namen"));

  // Server-Status, Testmail, Sicherung
  r = await fetch(B + "/api/admin/status", { headers: H(admin.token) }); const st = await r.json();
  assert.equal(r.status, 200); assert.equal(st.db.ok, true); assert.equal(st.mail.an, true); assert.ok(st.version);
  r = await post("/api/admin/testmail", {}, admin.token); assert.equal(r.status, 200);
  assert.match(letzteMail(`admin-${z}@test.ch`).betreff, /Testmail/);
  r = await fetch(B + "/api/admin/sicherung", { headers: H(admin.token) }); assert.equal(r.status, 200);
  const sich = await r.json();
  assert.ok(sich.tabellen["auth.users"].length >= 2); assert.ok(!("encrypted_password" in sich.tabellen["auth.users"][0]));
  assert.ok(sich.tabellen["public.kommentare"].length >= 1);
  const ei2 = await rpc("admin_einstellungen", {}, admin.token); assert.ok(ei2.j.letzte_sicherung);
});
