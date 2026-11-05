// Ende-zu-Ende-Test: eigenes Konto löschen (DELETE /auth/v1/user).
// Aufruf wie die anderen Tests: TEST_URL=http://localhost:8090 node --test server/test/
import { test } from "node:test";
import assert from "node:assert/strict";

const B = process.env.TEST_URL || "http://localhost:8090";
const H = { apikey: "ep", "Content-Type": "application/json" };
const neu = async () => {
  const email = `loesch${Date.now()}${Math.floor(Math.random() * 1e6)}@example.ch`, password = "geheim12345";
  const r = await fetch(B + "/auth/v1/signup", { method: "POST", headers: H, body: JSON.stringify({ email, password, data: { name: "Testkind" } }) });
  const j = await r.json();
  let s = j.access_token ? j : null;
  if (!s) {                                              // Mail-Bestätigung an: nicht testbar ohne Mailablage
    const t = await fetch(B + "/auth/v1/token?grant_type=password", { method: "POST", headers: H, body: JSON.stringify({ email, password }) });
    s = await t.json();
  }
  return { email, password, s };
};
const loeschen = (s, body) => fetch(B + "/auth/v1/user", { method: "DELETE", headers: { ...H, Authorization: "Bearer " + s.access_token }, body: JSON.stringify(body) });

test("Konto löschen: ohne Anmeldung, ohne Bestätigung oder mit falschem Passwort geht es nicht", async (t) => {
  const { s } = await neu();
  if (!s.access_token) return t.skip("Registrierung braucht Mail-Bestätigung");
  assert.equal((await fetch(B + "/auth/v1/user", { method: "DELETE", headers: H, body: "{}" })).status, 401);
  assert.equal((await loeschen(s, { password: "geheim12345" })).status, 400, "ohne LÖSCHEN");
  assert.equal((await loeschen(s, { password: "falsch", bestaetigung: "LÖSCHEN" })).status, 400, "falsches Passwort");
  const u = await fetch(B + "/auth/v1/user", { headers: { ...H, Authorization: "Bearer " + s.access_token } });
  assert.equal(u.status, 200, "Konto ist noch da");
  assert.equal((await u.json()).hat_passwort, true);
});

test("Konto löschen: mit Passwort und LÖSCHEN ist das Konto weg, Sitzung und Anmeldung gehen nicht mehr", async (t) => {
  const { email, password, s } = await neu();
  if (!s.access_token) return t.skip("Registrierung braucht Mail-Bestätigung");
  const r = await loeschen(s, { password, bestaetigung: "löschen" });
  assert.equal(r.status, 200);
  assert.equal((await r.json()).geloescht, true);
  const u = await fetch(B + "/auth/v1/user", { headers: { ...H, Authorization: "Bearer " + s.access_token } });
  assert.notEqual(u.status, 200, "alte Sitzung gilt nicht mehr");
  const a = await fetch(B + "/auth/v1/token?grant_type=password", { method: "POST", headers: H, body: JSON.stringify({ email, password }) });
  assert.equal(a.status, 400, "Anmeldung geht nicht mehr");
  const z = await fetch(B + "/auth/v1/token?grant_type=refresh_token", { method: "POST", headers: H, body: JSON.stringify({ refresh_token: s.refresh_token }) });
  assert.equal(z.status, 400, "Erneuern geht nicht mehr");
  const n = await fetch(B + "/auth/v1/signup", { method: "POST", headers: H, body: JSON.stringify({ email, password, data: {} }) });
  assert.equal(n.status, 200, "gleiche Adresse kann sich neu registrieren");
});
