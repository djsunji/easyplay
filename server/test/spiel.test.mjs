// Test für supabase/spiel.sql und die Rundmail (server/admin.js) gegen einen laufenden Server.
// Aufruf wie api.test.mjs: TEST_URL=… MAIL_TEST_DATEI=… DATABASE_URL=… node --test server/test/spiel.test.mjs
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
const mails = an => readFileSync(process.env.MAIL_TEST_DATEI, "utf8").trim().split("\n").map(JSON.parse).filter(m => m.an === an);
async function konto(mail, meta) {
  let r = await post("/auth/v1/signup", { email: mail, password: "geheim-123", data: meta });
  assert.equal(r.status, 200, await r.clone().text());
  const l = mails(mail); const link = /(http\S+verify\S+)/.exec(l[l.length - 1].text)[1];
  r = await fetch(link, { redirect: "manual" });
  const h = new URLSearchParams(new URL(r.headers.get("location")).hash.slice(1));
  const [u] = await db`select id from auth.users where email = ${mail}`;
  return { token: h.get("access_token"), id: u.id, mail };
}
const profil = (t, data) => fetch(B + "/auth/v1/user", { method: "PUT", headers: H(t), body: JSON.stringify({ data }) });

test.after(() => db.end());

test("Rangliste, Vorschläge, Antworten, Auskunft, Lehrpersonen, Qeels, Rundmail", async () => {
  const admin = await konto(`sp-admin-${z}@test.ch`, { vorname: "Ada" });
  const lea = await konto(`sp-lea-${z}@test.ch`, { vorname: "Lea", nachname: "Muster", kanton: "ZH", stufe: 2 });
  const tom = await konto(`sp-tom-${z}@test.ch`, { vorname: "Arschloch", kanton: "BE" });
  const lehrer = await konto(`sp-lehrer-${z}@test.ch`, { vorname: "Frau", nachname: "Keller" });
  await db`insert into public.admins (user_id) values (${admin.id}) on conflict do nothing`;
  assert.equal((await rpc("admin_lehrer_setzen", { p_id: lehrer.id, p_an: true }, admin.token)).status, 200);

  // Rangliste: Punkte ins Konto, öffentlich lesbar ohne Anmeldung, ohne E-Mail und Nachnamen
  assert.equal((await profil(lea.token, { best: { s2_tiere: 2400, s2_ethik: 1800 }, tests: 2, hc: { best: 41, spiele: 3 }, zahlen: { fragen: 50 }, deko: { hg: "sterne" } })).status, 200);
  assert.equal((await profil(tom.token, { best: { s1_tiere: 99999999, x: "abc" }, tests: 1 })).status, 200);
  let r = await rpc("rangliste", {});
  assert.equal(r.status, 200);
  const l = r.j.find(p => p.id === lea.id), t = r.j.find(p => p.id === tom.id);
  assert.equal(l.name, "Lea M."); assert.equal(l.best.s2_tiere, 2400); assert.equal(l.hc.best, 41); assert.equal(l.kanton, "ZH"); assert.equal(l.deko.hg, "sterne");
  assert.ok(!JSON.stringify(r.j).includes("@test.ch")); assert.ok(!JSON.stringify(r.j).includes("Muster"));
  assert.equal(t.name, "Kind"); assert.equal(t.best.s1_tiere, 100000); assert.ok(!("x" in t.best));
  // Verwaltung: auffällig, ausblenden, Punkte löschen
  const a = await rpc("admin_rangliste", {}, admin.token);
  assert.equal(a.status, 200);
  const at = a.j.find(x => x.id === tom.id); assert.ok(at.verdacht); assert.equal(+at.max_wert, 100000);
  assert.notEqual((await rpc("admin_rangliste", {}, lea.token)).status, 200);
  await rpc("admin_rangliste_aus", { p_id: tom.id, p_aus: true }, admin.token);
  assert.ok(!(await rpc("rangliste", {})).j.some(p => p.id === tom.id));
  await rpc("admin_punkte_loeschen", { p_id: lea.id }, admin.token);
  assert.ok(!(await rpc("rangliste", {})).j.some(p => p.id === lea.id));
  r = await fetch(B + "/auth/v1/user", { headers: H(lea.token) }); assert.ok((await r.json()).app_metadata.punkte_geloescht);

  // Vorschläge
  assert.equal((await rpc("frage_vorschlagen", { p_thema: "tiere", p_stufe: 1, p_frage: "Wie viele Beine hat eine Spinne?", p_antworten: ["Acht", "Sechs", "Vier", "Zehn"] })).status, 401);
  let v = await rpc("frage_vorschlagen", { p_thema: "tiere", p_stufe: 1, p_frage: "Wie viele Beine hat eine Spinne?", p_antworten: ["Acht", "Sechs", "Vier", "Zehn"], p_erklaerung: "Spinnen sind keine Insekten." }, lea.token);
  assert.equal(v.status, 200, JSON.stringify(v.j)); assert.ok(v.j.ok);
  assert.equal((await rpc("frage_vorschlagen", { p_thema: "tiere", p_stufe: 1, p_frage: "Schreib mir auf insta @lea", p_antworten: ["a", "b", "c", "d"] }, lea.token)).j.fehler, "kontakt");
  assert.equal((await rpc("frage_vorschlagen", { p_thema: "tiere", p_stufe: 1, p_frage: "Was ist das hier für eine Frage?", p_antworten: ["a", "a", "c", "d"] }, lea.token)).j.fehler, "antworten");
  const vs = await rpc("admin_vorschlaege", { p_status: "neu" }, admin.token);
  const mein = vs.j.find(x => x.id === v.j.id); assert.equal(mein.name, "Lea M."); assert.deepEqual(mein.antworten, ["Acht", "Sechs", "Vier", "Zehn"]);
  assert.equal((await rpc("admin_vorschlag_status", { p_id: v.j.id, p_status: "ok", p_notiz: "", p_nr: 99999 }, admin.token)).status, 200);
  const meine = await rpc("meine_vorschlaege", {}, lea.token); assert.equal(meine.j[0].status, "ok");

  // Antworten zählen (ohne Konto), Verwaltung liest
  for (let i = 0; i < 3; i++) assert.equal((await rpc("antworten_zaehlen", { p_liste: [[1, 0], [1, 0], [1, 1], [2, 1], ["x", 1], [0, 1]] })).status, 200);
  const aw = await rpc("admin_antworten", { p_min: 1 }, admin.token);
  const n1 = aw.j.find(x => x.nr === 1); assert.ok(n1.falsch >= 6 && n1.richtig >= 3); assert.ok(!aw.j.some(x => x.nr === 0));
  assert.ok((await rpc("admin_antworten_summe", {}, admin.token)).j.antworten >= 12);

  // Lehrperson im Detail
  r = await fetch(B + "/rest/v1/lehrer_klassen", { method: "POST", headers: { ...H(lehrer.token), Prefer: "return=representation" }, body: JSON.stringify({ name: "5a" }) });
  assert.equal(r.status, 201, await r.clone().text());
  const d = await rpc("admin_lehrer_detail", { p_id: lehrer.id }, admin.token);
  assert.equal(d.status, 200, JSON.stringify(d.j)); assert.equal(d.j.klassen[0].name, "5a");

  // Beliebte Qeels
  await rpc("like_aendern", { p_id: "q1", p_delta: 1 }, lea.token);
  const q = await rpc("admin_qeels_top", { p_anzahl: 50 }, admin.token); assert.ok(q.j.some(x => x.id === "q1" && x.likes >= 1));

  // Auskunft (wird protokolliert)
  const ak = await rpc("admin_konto_auskunft", { p_id: lea.id }, admin.token);
  assert.equal(ak.status, 200, JSON.stringify(ak.j)); assert.equal(ak.j.konto.email, lea.mail); assert.ok(ak.j.likes.includes("q1")); assert.equal(ak.j.fragen_vorschlaege.length, 1);
  assert.ok(!JSON.stringify(ak.j).includes("scrypt"));
  const dl = await rpc("admin_konto_auskunft", { p_id: lehrer.id }, admin.token); assert.equal(dl.j.lehrerbereich.klassen.length, 1);
  await new Promise(ok => setTimeout(ok, 200));
  const pr = await rpc("admin_protokoll_lesen", { p_anzahl: 50 }, admin.token);
  assert.ok(pr.j.some(x => x.aktion === "admin_konto_auskunft")); assert.ok(!pr.j.some(x => x.aktion === "admin_rangliste"));

  // Rundmail
  r = await fetch(B + "/api/admin/rundmail", { headers: H(admin.token) }); const ri = await r.json(); assert.ok(ri.lehrpersonen >= 1);
  r = await post("/api/admin/rundmail", { an: "ich", betreff: "Probe", text: "Hallo zusammen, das ist eine Probe." }, admin.token);
  assert.equal(r.status, 200); assert.equal((await r.json()).gesendet, 1);
  r = await post("/api/admin/rundmail", { an: "lehrpersonen", betreff: "Neu im Lehrerbereich", text: "Liebe Lehrpersonen, es gibt etwas Neues." }, admin.token);
  assert.equal(r.status, 200); const rr = await r.json(); assert.ok(rr.gesendet >= 1);
  const lm = mails(lehrer.mail).pop(); assert.equal(lm.betreff, "Neu im Lehrerbereich"); assert.match(lm.text, /als Lehrperson registriert/);
  assert.ok(!mails(lea.mail).some(m => m.betreff === "Neu im Lehrerbereich"));
  r = await post("/api/admin/rundmail", { an: "lehrpersonen", betreff: "x", text: "y" }, lehrer.token); assert.equal(r.status, 403);
});
