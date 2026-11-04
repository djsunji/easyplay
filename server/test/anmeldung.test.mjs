// Ende-zu-Ende-Test: Anmelden und Registrieren mit Google, Apple und Microsoft (Website und App) und
// Zugriff aus der App (CORS). Braucht einen Test-Anbieter, der die drei nachspielt (GOOGLE_AUTH_URL,
// GOOGLE_TOKEN_URL, MICROSOFT_AUTH_BASIS, MICROSOFT_TOKEN_URL, APPLE_AUTH_URL, APPLE_TOKEN_URL zeigen darauf).
// Ohne diese Einstellungen wird der Teil mit den Anbietern übersprungen.
import { test } from "node:test";
import assert from "node:assert/strict";

const B = process.env.TEST_URL || "http://localhost:8090";
const APP = "ch.easyplay.app://anmeldung";
const mitAnbietern = !!(process.env.GOOGLE_AUTH_URL && process.env.APPLE_AUTH_URL && process.env.MICROSOFT_AUTH_BASIS);

test("App darf die Schnittstelle aufrufen (iPhone capacitor://localhost, Android https://localhost), fremde Seiten nicht", async () => {
  for (const [o, ok] of [["capacitor://localhost", true], ["https://localhost", true], [new URL(B).origin, true], ["https://boese.example", false], ["null", false]]) {
    const v = await fetch(B + "/auth/v1/settings", { method: "OPTIONS", headers: { Origin: o, "Access-Control-Request-Method": "GET", "Access-Control-Request-Headers": "apikey" } });
    assert.equal(v.status, ok ? 204 : 403, "Vorabfrage " + o);
    const r = await fetch(B + "/auth/v1/settings", { headers: { Origin: o, apikey: "ep" } });
    assert.equal(r.headers.get("access-control-allow-origin"), ok ? o : null, "Antwort " + o);
  }
  const k = await fetch(B + "/api/kontakt", { method: "OPTIONS", headers: { Origin: "capacitor://localhost", "Access-Control-Request-Method": "POST" } });
  assert.equal(k.status, 204, "Kontaktformular aus der iPhone-App");
});

/* Einen Anmeldeweg ganz durchspielen: authorize → Anbieter → callback. Gibt die Sitzung aus dem Rücksprung zurück. */
async function durchspielen(anbieter, ziel) {
  let r = await fetch(B + "/auth/v1/authorize?provider=" + anbieter + "&redirect_to=" + encodeURIComponent(ziel), { redirect: "manual" });
  assert.equal(r.status, 302, anbieter + ": authorize leitet zum Anbieter");
  r = await fetch(r.headers.get("location"), { redirect: "manual" });
  if (anbieter === "apple") {                          // Apple schickt ein Formular (form_post) an den Server
    const h = await r.text(), f = n => (new RegExp(`name=${n} value='?"?([^'">]*)`).exec(h) || [])[1];
    const ziel2 = /action="([^"]+)"/.exec(h)[1];
    const user = /name=user value='([^']*)'/.exec(h)[1];
    r = await fetch(ziel2, { method: "POST", redirect: "manual", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code: f("code"), state: f("state"), user }) });
  } else {
    assert.equal(r.status, 302, anbieter + ": Anbieter schickt zurück");
    r = await fetch(r.headers.get("location"), { redirect: "manual" });
  }
  let link;
  if (ziel.startsWith(APP)) {
    assert.equal(r.status, 200, anbieter + ": Seite «Zurück zur App»");
    const h = await r.text();
    assert.match(h, /Zurück zur App/);
    link = /href="([^"]+)"/.exec(h)[1].replace(/&amp;/g, "&");
    assert.ok(link.startsWith(APP + "#"), anbieter + ": Knopf führt in die App");
    assert.ok(h.includes('http-equiv="refresh"'), "versucht es auch selbst");
  } else {
    assert.equal(r.status, 302, anbieter + ": zurück zur Website");
    link = r.headers.get("location");
  }
  const p = new URLSearchParams(link.slice(link.indexOf("#") + 1));
  assert.equal(p.get("error_description"), null, anbieter + ": " + p.get("error_description"));
  assert.ok(p.get("access_token"), anbieter + ": Sitzung im Rücksprung");
  const u = await (await fetch(B + "/auth/v1/user", { headers: { apikey: "ep", Authorization: "Bearer " + p.get("access_token") } })).json();
  assert.ok(u.id, anbieter + ": Konto lesbar");
  return u;
}

test("Google, Apple, Microsoft: neu registrieren und wieder anmelden, auf der Website und in der App", { skip: !mitAnbietern }, async () => {
  for (const anbieter of ["google", "apple", "azure"]) {
    const neu = await durchspielen(anbieter, B + "/");                 // erstes Mal: Konto entsteht
    const web = await durchspielen(anbieter, B + "/");                 // nochmals: dasselbe Konto
    const app = await durchspielen(anbieter, APP);                     // in der App: dasselbe Konto
    assert.equal(web.id, neu.id, anbieter + ": Website meldet dasselbe Konto an");
    assert.equal(app.id, neu.id, anbieter + ": App meldet dasselbe Konto an");
    assert.ok(neu.email, anbieter + ": E-Mail übernommen");
  }
});

test("App: Abbruch beim Anbieter und unbekannte Adressen", { skip: !mitAnbietern }, async () => {
  /* Fremdes Ziel wird nie angesprungen, sondern auf die eigene Seite umgebogen */
  let r = await fetch(B + "/auth/v1/authorize?provider=google&redirect_to=" + encodeURIComponent("evil://x"), { redirect: "manual" });
  const st = new URL(r.headers.get("location")).searchParams.get("state");
  r = await fetch(B + "/auth/v1/callback?error=access_denied&state=" + encodeURIComponent(st), { redirect: "manual" });
  assert.equal(r.status, 302); assert.ok(!r.headers.get("location").startsWith("evil:"));
  /* Abbruch in der App: Seite mit Fehlertext und Knopf zurück */
  r = await fetch(B + "/auth/v1/authorize?provider=google&redirect_to=" + encodeURIComponent(APP), { redirect: "manual" });
  const st2 = new URL(r.headers.get("location")).searchParams.get("state");
  r = await fetch(B + "/auth/v1/callback?error=access_denied&state=" + encodeURIComponent(st2), { redirect: "manual" });
  assert.equal(r.status, 200);
  const h = await r.text();
  assert.match(h, /Das hat nicht geklappt/); assert.match(h, /Anmeldung abgebrochen/);
  assert.match(h, /href="ch\.easyplay\.app:\/\/anmeldung#error=access_denied/);
});
