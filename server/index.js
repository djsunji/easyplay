// easyplay-Server: Website, Anmeldung (/auth/v1) und Daten (/rest/v1) in einem Programm.
// Start: node server/index.js   Einstellungen über Umgebungsvariablen, siehe ANLEITUNG-SERVER.md
import { createServer } from "node:http";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { sql, einrichten } from "./db.js";
import { authAnfrage, personAusAnfrage, sitzungGueltig } from "./auth.js";
import { rpcAnfrage, tabellenAnfrage } from "./rest.js";
import { statischMacher } from "./statisch.js";

const E = process.env;
const WURZEL = E.STATIC_DIR || join(dirname(fileURLToPath(import.meta.url)), "..");
const statisch = statischMacher(WURZEL);
const MAX_BODY = 2 * 1024 * 1024;

/* Wer darf die Schnittstelle aus dem Browser aufrufen (CORS)? Eigene Adresse, SITE_URLS, die App. */
function herkunftErlaubt(o) {
  if (!o) return false;
  const liste = [E.PUBLIC_URL, ...String(E.SITE_URLS || "").split(","), "capacitor://localhost", "https://localhost", "ionic://localhost"]
    .map(x => { try { return new URL(String(x).trim()).origin; } catch (e) { return ""; } }).filter(Boolean);
  if (liste.includes(o)) return true;
  return E.NODE_ENV !== "production" && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o);
}

function antworten(req, res) {
  res.json = (status, daten) => { const t = JSON.stringify(daten); res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Content-Length": Buffer.byteLength(t) }); res.end(t); };
  res.html = (status, t) => { res.writeHead(status, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Frame-Options": "DENY",
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'" }); res.end(t); };
  res.leer = status => { res.writeHead(status, { "Cache-Control": "no-store" }); res.end(); };
  res.weiter = ziel => { res.writeHead(302, { Location: ziel, "Cache-Control": "no-store" }); res.end(); };
  res.umleiten = ziel => { res.writeHead(301, { Location: ziel, "Cache-Control": "public, max-age=86400" }); res.end(); };
}

async function koerper(req) {
  if (req._koerper !== undefined) return req._koerper;
  const teile = []; let n = 0;
  for await (const c of req) { n += c.length; if (n > MAX_BODY) throw Object.assign(new Error("Anfrage zu gross"), { status: 413 }); teile.push(c); }
  const text = Buffer.concat(teile).toString("utf8");
  const typ = String(req.headers["content-type"] || "");
  if (!text) req._koerper = {};
  else if (typ.includes("application/x-www-form-urlencoded")) req._koerper = Object.fromEntries(new URLSearchParams(text));
  else { try { req._koerper = JSON.parse(text); } catch (e) { throw Object.assign(new Error("Ungültiges JSON"), { status: 400 }); } }
  return req._koerper;
}

const server = createServer(async (req, res) => {
  antworten(req, res);
  try {
    const url = new URL(req.url, "http://x");
    req.pfad = url.pathname; req.suche = url.search;
    req.query = {}; for (const [k, v] of url.searchParams) req.query[k] = k in req.query ? [].concat(req.query[k], v) : v;
    req.body = () => koerper(req);
    const fw = String(req.headers["x-forwarded-for"] || "");
    /* Der letzte Eintrag stammt vom Eingang bei Deploio, die vorderen kann der Browser selbst setzen */
    req.ip = (E.TRUST_PROXY === "0" ? "" : fw.split(",").map(x => x.trim()).filter(Boolean).pop()) || req.socket.remoteAddress || "";

    /* www.easyplay.ch und andere Nebenadressen auf die Hauptadresse (PUBLIC_URL) */
    try {
      const haupt = E.PUBLIC_URL ? new URL(E.PUBLIC_URL) : null, host = String(req.headers.host || "").toLowerCase();
      if (haupt && host === "www." + haupt.host) return res.umleiten(haupt.origin + req.pfad + req.suche);
    } catch (e) {}
    const api = req.pfad.startsWith("/auth/v1/") || req.pfad.startsWith("/rest/v1/");
    if (api) {
      const o = req.headers.origin;
      if (o && herkunftErlaubt(o)) {
        res.setHeader("Access-Control-Allow-Origin", o); res.setHeader("Vary", "Origin");
        res.setHeader("Access-Control-Allow-Headers", "apikey, authorization, content-type, prefer, accept, accept-profile, content-profile, x-client-info, range");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
        res.setHeader("Access-Control-Max-Age", "86400");
      }
      if (req.method === "OPTIONS") return res.leer(o && herkunftErlaubt(o) ? 204 : 403);
    }

    /* Gesundheit: auch von fremden Seiten lesbar, die alte Adresse (GitHub Pages) prüft damit, ob der Umzug bereit ist */
    if (req.pfad === "/api/health") { res.setHeader("Access-Control-Allow-Origin", "*"); await sql`select 1`; return res.json(200, { ok: true, app: "easyplay" }); }
    if (req.pfad.startsWith("/auth/v1/")) return await authAnfrage(req, res, req.pfad.slice(8));
    if (req.pfad.startsWith("/rest/v1/")) {
      const person = personAusAnfrage(req);
      if (person === "abgelaufen" || (person && !(await sitzungGueltig(person.sid)))) return res.json(401, { code: "PGRST301", message: "JWT expired" });
      const rest = req.pfad.slice(9);
      if (rest.startsWith("rpc/")) return await rpcAnfrage(req, res, rest.slice(4), person);
      return await tabellenAnfrage(req, res, rest, person);
    }
    if (E.STATIC !== "0" && await statisch(req, res)) return;
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); res.end("Nicht gefunden");
  } catch (e) {
    if (res.headersSent) { res.destroy(); return; }
    if (e.status) return res.json(e.status, { code: String(e.status), message: e.message });
    console.error("Fehler:", e.stack || e.message);
    res.json(500, { code: "500", message: "Interner Fehler" });
  }
});

const PORT = +E.PORT || 8080;
if (!E.JWT_SECRET || E.JWT_SECRET.length < 32) { console.error("JWT_SECRET fehlt oder ist kürzer als 32 Zeichen (siehe ANLEITUNG-SERVER.md)"); process.exit(1); }
if (!E.PUBLIC_URL) console.warn("Achtung: PUBLIC_URL fehlt, Links in Mails und die Anmeldung mit Google/Apple gehen dann nicht.");
await einrichten();
server.headersTimeout = 30000; server.requestTimeout = 60000;
server.listen(PORT, () => console.log(`easyplay-Server läuft auf Port ${PORT}`));
for (const sig of ["SIGTERM", "SIGINT"]) process.on(sig, () => { server.close(); sql.end({ timeout: 5 }).finally(() => process.exit(0)); });
