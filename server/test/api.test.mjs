// Ende-zu-Ende-Test der Schnittstelle gegen einen laufenden Server (TEST_URL) mit Test-Mailablage (MAIL_TEST_DATEI).
// Aufruf: TEST_URL=http://localhost:8090 MAIL_TEST_DATEI=/tmp/mails.jsonl DATABASE_URL=... node --test server/test/
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import postgres from "postgres";

const B = process.env.TEST_URL || "http://localhost:8090";
const db = postgres(process.env.DATABASE_URL, { onnotice: () => {} });
const z = Math.random().toString(36).slice(2, 8);
const H = (t) => ({ apikey: "ep", "Content-Type": "application/json", ...(t ? { Authorization: "Bearer " + t } : {}) });
const post = (p, b, t, h = {}) => fetch(B + p, { method: "POST", headers: { ...H(t), ...h }, body: JSON.stringify(b) });
const letzteMail = an => { const l = readFileSync(process.env.MAIL_TEST_DATEI, "utf8").trim().split("\n").map(JSON.parse).filter(m => m.an === an); return l[l.length - 1]; };
const linkAus = m => /(http\S+verify\S+)/.exec(m.text)[1];
async function konto(mail, pw = "geheim-123") {
  let r = await post("/auth/v1/signup", { email: mail, password: pw, data: { vorname: "Test", kanton: "ZH" } });
  assert.equal(r.status, 200, await r.clone().text());
  const link = linkAus(letzteMail(mail));
  r = await fetch(link, { redirect: "manual" });
  assert.equal(r.status, 302);
  const h = new URLSearchParams(new URL(r.headers.get("location")).hash.slice(1));
  assert.ok(h.get("access_token"), "Sitzung nach Bestätigung");
  return { token: h.get("access_token"), refresh: h.get("refresh_token") };
}

test("Konto, Anmeldung, Profil, Erneuern, Abmelden", async () => {
  const mail = `kind-${z}@test.ch`;
  let r = await post("/auth/v1/token?grant_type=password", { email: mail, password: "x" });
  assert.equal(r.status, 400);
  await post("/auth/v1/signup", { email: mail, password: "geheim-123", data: { vorname: "Lumi" } });
  r = await post("/auth/v1/token?grant_type=password", { email: mail, password: "geheim-123" });
  assert.equal((await r.json()).error_code, "email_not_confirmed");
  const link = linkAus(letzteMail(mail));
  r = await fetch(link, { redirect: "manual" }); assert.equal(r.status, 302);
  r = await post("/auth/v1/token?grant_type=password", { email: mail, password: "geheim-123" });
  const s = await r.json(); assert.equal(r.status, 200); assert.equal(s.user.user_metadata.vorname, "Lumi");
  r = await fetch(B + "/auth/v1/user", { method: "PUT", headers: H(s.access_token), body: JSON.stringify({ data: { tests: 5 } }) });
  const u = await r.json(); assert.equal(u.user_metadata.tests, 5); assert.equal(u.user_metadata.vorname, "Lumi");
  r = await post("/auth/v1/token?grant_type=refresh_token", { refresh_token: s.refresh_token });
  const s2 = await r.json(); assert.equal(r.status, 200); assert.notEqual(s2.refresh_token, s.refresh_token);
  r = await post("/auth/v1/signup", { email: mail, password: "geheim-123" });
  assert.equal(r.status, 422);
  r = await post("/auth/v1/logout", {}, s2.access_token); assert.equal(r.status, 204);
  r = await post("/auth/v1/token?grant_type=refresh_token", { refresh_token: s2.refresh_token }); assert.equal(r.status, 400);
});

test("Passwort vergessen über die Seite des Servers", async () => {
  const mail = `pw-${z}@test.ch`; await konto(mail);
  let r = await post("/auth/v1/recover", { email: mail }); assert.equal(r.status, 200);
  const link = linkAus(letzteMail(mail));
  r = await fetch(link); assert.equal(r.status, 200); const html = await r.text(); assert.match(html, /Neues Passwort/);
  const token = /name="token" value="([^"]+)"/.exec(html)[1];
  r = await fetch(B + "/auth/v1/verify", { method: "POST", redirect: "manual", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ type: "recovery", token, password: "neues-pw-99", password2: "neues-pw-99", redirect_to: B + "/" }) });
  assert.equal(r.status, 302); assert.match(r.headers.get("location"), /access_token=/);
  r = await post("/auth/v1/token?grant_type=password", { email: mail, password: "neues-pw-99" }); assert.equal(r.status, 200);
  r = await post("/auth/v1/token?grant_type=password", { email: mail, password: "geheim-123" }); assert.equal(r.status, 400);
});

test("Lehrerbereich: Klassen, Kinder, Tests, Abgaben, Liga, nur eigene Daten", async () => {
  const L = await konto(`lehrer-${z}@test.ch`), F = await konto(`fremd-${z}@test.ch`);
  let r = await fetch(B + "/rest/v1/lehrer_klassen?select=id", { headers: H(L.token) });
  assert.equal(r.status, 200); assert.deepEqual(await r.json(), []);        // noch nicht freigegeben: sieht nichts
  await db`update auth.users set raw_app_meta_data = raw_app_meta_data || '{"rolle":"lehrperson"}' where email in (${`lehrer-${z}@test.ch`}, ${`fremd-${z}@test.ch`})`;
  const kid = crypto.randomUUID(), sid = crypto.randomUUID();
  r = await post("/rest/v1/lehrer_klassen", { id: kid, name: "3a", schuljahr: "2026/27", zyklus: 2 }, L.token, { Prefer: "resolution=merge-duplicates,return=representation" });
  assert.equal(r.status, 201, await r.clone().text());
  r = await post("/rest/v1/lehrer_schueler", [{ id: sid, klasse_id: kid, name: "Mia", pin: "1234" }], L.token, { Prefer: "resolution=merge-duplicates,return=representation" });
  assert.equal(r.status, 201, await r.clone().text());
  // Fremde Lehrperson: darf kein Kind in diese Klasse legen und die Klasse nicht überschreiben
  r = await post("/rest/v1/lehrer_schueler", [{ id: crypto.randomUUID(), klasse_id: kid, name: "X", pin: "9999" }], F.token, { Prefer: "return=representation" });
  assert.equal(r.status, 403);
  r = await post("/rest/v1/lehrer_klassen", { id: kid, name: "gekapert" }, F.token, { Prefer: "resolution=merge-duplicates,return=representation" });
  assert.deepEqual(await r.json(), []);
  r = await fetch(B + `/rest/v1/lehrer_klassen?select=id,name&id=eq.${kid}`, { headers: H(L.token) });
  assert.equal((await r.json())[0].name, "3a");
  r = await fetch(B + "/rest/v1/lehrer_klassen?select=id", { headers: H(F.token) }); assert.deepEqual(await r.json(), []);
  const code = ("T" + z).toUpperCase().slice(0, 6);
  r = await post("/rest/v1/lehrer_tests", { code, klasse_id: kid, titel: "Probe", fragen: [{ f: "1+1?", a: ["2", "3"], typ: "mc" }], info: {}, lp21: [], aktiv: true }, L.token, { Prefer: "resolution=merge-duplicates,return=representation" });
  assert.equal(r.status, 201, await r.clone().text());
  r = await post("/rest/v1/rpc/test_laden", { test_code: code, pin: "1234" });
  const t = await r.json(); assert.equal(r.status, 200, JSON.stringify(t)); assert.ok(t && !t.fehler, JSON.stringify(t));
  r = await post("/rest/v1/rpc/abgabe_einreichen", { test_code: code, pin: "1234", antworten: [0], dauer_ms: 5000 });
  assert.equal(r.status, 200, await r.clone().text());
  r = await fetch(B + "/rest/v1/lehrer_abgaben?select=id,name,punkte&order=abgegeben", { headers: H(L.token) });
  const ab = await r.json(); assert.equal(ab.length, 1); assert.equal(ab[0].name, "Mia");
  r = await fetch(B + `/rest/v1/lehrer_abgaben?id=eq.${ab[0].id}`, { method: "PATCH", headers: H(L.token), body: JSON.stringify({ name: "Hack" }) });
  assert.equal(r.status, 403);
  r = await fetch(B + `/rest/v1/lehrer_abgaben?id=eq.${ab[0].id}`, { method: "PATCH", headers: { ...H(L.token), Prefer: "return=representation" }, body: JSON.stringify({ korrektur: { 0: true }, punkte: 1 }) });
  assert.equal(r.status, 200); assert.equal((await r.json())[0].punkte, 1);
  r = await post("/rest/v1/lehrer_schueler", [1, 2, 3, 4].map(i => ({ id: crypto.randomUUID(), klasse_id: kid, name: "Kind " + i, pin: "000" + i })), L.token, { Prefer: "resolution=merge-duplicates" });
  assert.equal(r.status, 201, await r.clone().text());
  r = await post("/rest/v1/rpc/liga_anmelden", { p_klasse: kid, p_anzeige: "Klasse 3a", p_kanton: "ZH" }, L.token);
  const la = await r.json(); assert.equal(r.status, 200); assert.ok(!la.fehler, JSON.stringify(la));
  r = await fetch(B + "/rest/v1/liga_klassen?select=klasse_id,anzeige", { headers: H(L.token) });
  assert.equal((await r.json()).length, 1);
  r = await post("/rest/v1/rpc/liga_rangliste", {}); assert.equal(r.status, 200);
  r = await fetch(B + `/rest/v1/lehrer_schueler?id=in.(${sid})`, { method: "DELETE", headers: H(F.token) }); assert.equal(r.status, 204);
  r = await fetch(B + "/rest/v1/lehrer_schueler?select=id", { headers: H(L.token) }); assert.equal((await r.json()).length, 5);  // fremdes Löschen ohne Wirkung
  r = await fetch(B + `/rest/v1/lehrer_klassen?id=eq.${kid}`, { method: "DELETE", headers: H(L.token) }); assert.equal(r.status, 204);
});

test("Kommentare, Likes, Statistik, Duell, Live, Regionen, Fehlermeldung", async () => {
  const K = await konto(`komm-${z}@test.ch`);
  let r = await post("/rest/v1/kommentare", { qeel: "q-" + z, name: "Lumi", avatar: "", text: "Super erklärt!" }, null);
  assert.equal(r.status, 401);
  r = await post("/rest/v1/kommentare", { qeel: "q-" + z, name: "Lumi", avatar: "", text: "Super erklärt!" }, K.token, { Prefer: "return=minimal" });
  assert.equal(r.status, 201, await r.clone().text());
  r = await fetch(B + `/rest/v1/kommentare?qeel=eq.q-${z}&select=id,name,text,zeit:erstellt,gemeldet&order=erstellt.desc&limit=50`, { headers: H() });
  const k = await r.json(); assert.equal(k.length, 1); assert.ok(k[0].zeit);
  r = await post("/rest/v1/rpc/like_aendern", { p_id: "q-" + z, p_delta: 1 }, K.token); assert.equal(r.status, 200, await r.clone().text());
  r = await fetch(B + `/rest/v1/likes?id=eq.q-${z}&select=n`, { headers: H() }); assert.equal((await r.json())[0]?.n, 1);
  r = await post("/rest/v1/rpc/aufruf_zaehlen", { p_bereich: "home", p_geraet: "handy", p_herkunft: "" }); assert.equal(r.status, 200);
  r = await post("/rest/v1/rpc/bremse", { p_art: "x", p_max: 1, p_intervall: "1 hour" }); assert.equal(r.status, 404);   // nicht freigegeben
  r = await post("/rest/v1/rpc/admin_statistik", {}); assert.equal(r.status, 401);
  r = await post("/rest/v1/rpc/admin_statistik", {}, K.token); assert.ok(r.status >= 400, "kein Admin");
  r = await post("/rest/v1/rpc/live_punkte", { p_key: "2026-10-25-16", p_team: "lumi", p_punkte: 10, p_richtig: 1 }); assert.equal(r.status, 200, await r.clone().text());
  r = await post("/rest/v1/rpc/live_stand", { p_key: "2026-10-25-16" }); assert.equal(r.status, 200);
  r = await post("/rest/v1/rpc/region_stand", {}); assert.equal(r.status, 200);
  r = await post("/rest/v1/rpc/fehler_melden", { p_art: "frage", p_ref: "1", p_titel: "t", p_grund: "falsch", p_text: "Test" }, K.token);
  assert.equal(r.status, 200, await r.clone().text());
});

test("Verwaltung mit Admin-Konto", async () => {
  const mail = `admin-${z}@test.ch`; const A = await konto(mail);
  const [u] = await db`select id from auth.users where email = ${mail}`;
  await db`insert into public.admins (user_id) values (${u.id}) on conflict do nothing`;
  let r = await post("/rest/v1/rpc/admin_statistik", { p_tage: 30 }, A.token); assert.equal(r.status, 200, await r.clone().text());
  r = await post("/rest/v1/rpc/admin_benutzer", {}, A.token); const l = await r.json(); assert.ok(Array.isArray(l) && l.length > 0);
  const lehrer = l.find(x => x.email === `komm-${z}@test.ch`);
  r = await post("/rest/v1/rpc/admin_lehrer_setzen", { p_id: lehrer.id, p_an: true }, A.token); assert.equal(r.status, 200, await r.clone().text());
  r = await post("/rest/v1/rpc/admin_benutzer_sperren", { p_id: lehrer.id, p_tage: 1 }, A.token); assert.equal(r.status, 200, await r.clone().text());
  r = await post("/auth/v1/token?grant_type=password", { email: `komm-${z}@test.ch`, password: "geheim-123" }); assert.equal(r.status, 400);
});

test("Duell: zwei Kinder finden sich", async () => {
  const liste = ["a101", "b202", "c303", "d404", "e505"];
  const arg = (t, n) => ({ p_token: t, p_name: n, p_team: "", p_stufe: 1, p_cat: "alle-" + z, p_n: 5, p_list: liste, p_elo: 1000 });
  let r = await post("/rest/v1/rpc/duell_suchen", arg("toka" + z, "Anna")); const a = await r.json();
  assert.equal(r.status, 200, JSON.stringify(a));
  r = await post("/rest/v1/rpc/duell_suchen", arg("tokb" + z, "Ben")); const b = await r.json();
  assert.equal(r.status, 200, JSON.stringify(b));
  assert.equal(b.id, a.id, "gleiches Duell: " + JSON.stringify([a, b]));
  r = await post("/rest/v1/rpc/duell_stand", { p_id: a.id, p_token: "toka" + z, p_i: 1, p_score: 10, p_ant: "r", p_fertig: false });
  const st = await r.json(); assert.equal(r.status, 200, JSON.stringify(st));
  r = await post("/rest/v1/rpc/duell_stand", { p_id: a.id, p_token: "falsch", p_i: 1, p_score: 99, p_ant: "r", p_fertig: true });
  assert.ok(r.status !== 200 || !(await r.json())?.ok, "fremdes Token");
});

test("Sicherheit: Spaltenrechte, fremde Klasse, Übernahme offener Konten, Abmelden wirkt sofort", async () => {
  // Kommentare verraten nie die Konto-Kennung
  let r = await fetch(B + "/rest/v1/kommentare?select=wer", { headers: H() }); assert.equal(r.status, 400);
  r = await fetch(B + "/rest/v1/kommentare?select=*&limit=1", { headers: H() }); const k = await r.json(); assert.ok(!k.length || !("wer" in k[0]), JSON.stringify(k));
  // Test darf nicht in die Klasse einer anderen Lehrperson verschoben werden
  const L = await konto(`sl-${z}@test.ch`), F = await konto(`sf-${z}@test.ch`);
  await db`update auth.users set raw_app_meta_data = raw_app_meta_data || '{"rolle":"lehrperson"}' where email in (${`sl-${z}@test.ch`}, ${`sf-${z}@test.ch`})`;
  const kL = crypto.randomUUID(), kF = crypto.randomUUID(), code = ("S" + z).toUpperCase().slice(0, 6);
  await post("/rest/v1/lehrer_klassen", { id: kL, name: "L" }, L.token, { Prefer: "return=representation" });
  await post("/rest/v1/lehrer_klassen", { id: kF, name: "F" }, F.token, { Prefer: "return=representation" });
  r = await post("/rest/v1/lehrer_tests", { code, klasse_id: kL, titel: "x", fragen: [{ f: "1?", a: ["1", "2"], typ: "mc" }], info: {}, lp21: [] }, L.token, { Prefer: "return=representation" }); assert.equal(r.status, 201, await r.clone().text());
  r = await fetch(B + `/rest/v1/lehrer_tests?code=eq.${code}`, { method: "PATCH", headers: H(L.token), body: JSON.stringify({ klasse_id: kF }) });
  assert.equal(r.status, 403, await r.clone().text());
  // Offenes Konto: zweite Registrierung ändert das Passwort erst mit ihrem eigenen Link
  const mail = `offen-${z}@test.ch`;
  await post("/auth/v1/signup", { email: mail, password: "opfer-pw-1" });
  const linkOpfer = linkAus(letzteMail(mail));
  await post("/auth/v1/signup", { email: mail, password: "angreifer-1" });
  r = await fetch(linkOpfer, { redirect: "manual" }); assert.match(r.headers.get("location"), /error/);   // alter Link ungültig
  await post("/auth/v1/signup", { email: mail, password: "opfer-pw-1" });
  r = await fetch(linkAus(letzteMail(mail)), { redirect: "manual" }); assert.match(r.headers.get("location"), /access_token/);
  r = await post("/auth/v1/token?grant_type=password", { email: mail, password: "angreifer-1" }); assert.equal(r.status, 400);
  r = await post("/auth/v1/token?grant_type=password", { email: mail, password: "opfer-pw-1" }); const s = await r.json(); assert.equal(r.status, 200);
  // Nach dem Abmelden gilt das alte Zugangs-Token nicht mehr
  r = await post("/rest/v1/rpc/ist_lehrer", {}, s.access_token); assert.equal(r.status, 200);
  await post("/auth/v1/logout", {}, s.access_token);
  r = await post("/rest/v1/rpc/ist_lehrer", {}, s.access_token); assert.equal(r.status, 401);
  // Weiterleitung nur auf eigene Pfade
  r = await fetch(B + "/.//evil.com/..%2Fimg", { redirect: "manual" });
  assert.ok(r.status !== 302 || !/^\/\//.test(r.headers.get("location")), r.headers.get("location"));
});

test.after(() => db.end());
