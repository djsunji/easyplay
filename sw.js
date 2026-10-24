/* easyplay Service Worker
   Sorgt für schnelle Wiederholungsbesuche und Offline-Nutzung.
   Bei jeder Änderung an der App-Hülle VERSION hochzählen, damit alte Caches gelöscht werden. */

const VERSION = "ep-2026-10-24-04";
const CACHE_HUELLE = VERSION + "-huelle";   // App-Hülle, Code, Daten
const CACHE_BILDER = VERSION + "-bilder";
// Grosse Daten (Fragen, Bibliothekstexte, Bildindex) in einem eigenen Speicher, der Updates überlebt.
// Der Name beginnt mit "epoff-", damit weder das Aufräumen bei neuer Version noch die Versionsprüfung der Seite ihn löscht.
// Textdateien in tx/ tragen einen Inhalts-Hash im Namen und ändern sich nie; der Rest wird still aufgefrischt.
const CACHE_DATEN = "epoff-daten";   // Bilder aus bilder/ und img/
const MAX_BILDER = 3000;                    // Obergrenze Einträge im Bilder-Cache

// App-Hülle: wird bei der Installation vorgeladen
const HUELLE = [
  "./",
  "index.html",
  "config.js",
  "lehrer.js",
  "hardcore.js",
  "lernen.js",
  "level.js",
  "startseite.js",
  "app.js", "stil.js", "duell2.js", "extras.js", "sound.js", "karte.js", "album.js", "garderobe.js", "abenteuer.js", "spielwelt.js", "truhe.js", "feste.js", "hilfen.js", "mathe.js", "sprachen.js", "familie.js", "forscher.js", "eltern.js", "offline.js", "i18n.js", "regionen.js", "img/logo.webp", "img/kinder.webp", "img/kids/leni.webp", "img/kids/ben.webp", "img/kids/lb-jubel.webp", "img/kids/lb-schock.webp", "img/kids/lb-daumen.webp", "img/kids/lb-denken.webp", "img/kids/lb-sitzen.webp",
  "img/kids/duo-jubel.webp",
  "img/kids/duo-winken.webp",
  "img/kids/duo-bereit.webp",
  "img/kids/liegen.webp",
  "bibidx.js",
  "img/logo.webp",
  "img/fragezeichen.webp",
  "img/app-192.png", "img/favicon-48.png", "img/apple-touch-icon.png",
  "manifest.webmanifest",
  "impressum.html",
  "datenschutz.html",
  "daten-08.js",
  "daten-09.js",
  "daten-10.js",
  "daten-11.js",
  "daten-12.js"
];

// Dateien für den älteren Knopf «offline verfügbar machen» (Nachricht {typ:"vorladen"})
const VORLADEN = [];
for (let i = 1; i <= 13; i++) VORLADEN.push("fragen-" + i + ".json");
VORLADEN.push("bildindex.json");

/* Offline-Pakete (offline.js, Welt «Offline spielen"):
   Jedes Paket hat einen eigenen Cache "epoff-<paket>", unabhängig von VERSION.
   Diese Caches werden beim Aktivieren NICHT gelöscht (sie beginnen nicht mit "ep-").
   Downloads der Paketverwaltung tragen den Kopf "x-ep-offline" und gehen am Service Worker vorbei. */
const PAKET_PREFIX = "epoff-";
const OFFLINE_KOPF = "x-ep-offline";

/* ---------- Hilfsfunktionen ---------- */

// Nur vollständige, gleich-originige Antworten speichern (kein 206, kein opaque, keine Fehler)
function speicherbar(antwort) {
  return antwort && antwort.status === 200 && antwort.type === "basic";
}

// Schlüssel ohne Query-String, damit ?v=... nicht zu Doppeleinträgen führt
function schluessel(url) {
  const u = new URL(url);
  u.search = "";
  u.hash = "";
  return u.href;
}

const MATCH = { ignoreSearch: true, ignoreVary: true };

// Liste der Paket-Caches, kurz zwischengespeichert
let paketListe = null, paketZeit = 0;
async function paketCaches() {
  if (!paketListe || Date.now() - paketZeit > 15000) {
    paketListe = (await caches.keys()).filter((n) => n.startsWith(PAKET_PREFIX));
    paketZeit = Date.now();
  }
  return paketListe;
}

// Sucht zuerst in den genannten Caches, danach in allen Offline-Paketen. Liefert {name, antwort} oder null.
async function finde(key, zuerst) {
  const namen = [...zuerst, ...(await paketCaches())];
  for (const n of namen) {
    if (n.startsWith(PAKET_PREFIX) && !(await caches.has(n))) continue;
    const t = await (await caches.open(n)).match(key, MATCH);
    if (t) return { name: n, antwort: t };
  }
  return null;
}

const offlineNetz = () => self.navigator && self.navigator.onLine === false;

// Leere Antwort, wenn offline nichts im Speicher liegt (statt Netzwerkfehler)
const nichtDa = () => new Response("", { status: 504, statusText: "Offline" });

// Unverändert? (gleiches ETag oder Last-Modified) Dann muss nichts neu gespeichert werden
function gleich(alt, neu) {
  if (!alt || !neu) return false;
  const e1 = alt.headers.get("etag"), e2 = neu.headers.get("etag");
  if (e1 && e2) return e1 === e2;
  const l1 = alt.headers.get("last-modified"), l2 = neu.headers.get("last-modified");
  return !!(l1 && l2 && l1 === l2);
}

// Holt eine Ressource frisch vom Netz und legt sie im Cache ab (nur wenn sie sich geändert hat)
async function holenUndSpeichern(cacheName, anfrage, key, alt) {
  const antwort = await fetch(typeof anfrage === "string" ? anfrage : new Request(anfrage, { cache: "no-cache" }));
  if (speicherbar(antwort) && !gleich(alt, antwort)) {
    const cache = await caches.open(cacheName);
    if (cacheName.startsWith(PAKET_PREFIX)) {
      // Offline-Paket: gleiches Format wie offline.js (Schlüssel ohne Query, Grösse im Kopf)
      const blob = await antwort.clone().blob();
      const kopf = new Headers();
      kopf.set("Content-Type", antwort.headers.get("content-type") || "application/octet-stream");
      for (const k of ["last-modified", "etag"]) { const v = antwort.headers.get(k); if (v) kopf.set(k, v); }
      kopf.set("x-ep-groesse", String(blob.size));
      kopf.set("x-ep-paket", cacheName.slice(PAKET_PREFIX.length));
      await cache.put(key || schluessel(anfrage.url || anfrage), new Response(blob, { status: 200, statusText: "OK", headers: kopf }));
    } else {
      await cache.put(key || anfrage, antwort.clone());
    }
  }
  return antwort;
}

// Bilder-Cache begrenzen: älteste Einträge zuerst löschen (keys() liefert Einfügereihenfolge)
let trimmenLaeuft = false;
async function bilderTrimmen() {
  if (trimmenLaeuft) return;
  trimmenLaeuft = true;
  try {
    const cache = await caches.open(CACHE_BILDER);
    const keys = await cache.keys();
    const zuViel = keys.length - MAX_BILDER;
    for (let i = 0; i < zuViel; i++) await cache.delete(keys[i]);
  } finally {
    trimmenLaeuft = false;
  }
}

// Freundliche Seite, wenn offline gar nichts gespeichert ist
const OFFLINE_SEITE = `<!doctype html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>easyplay: offline</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;
background:linear-gradient(180deg,#BFE3FF,#EAF6FF);padding:16px;box-sizing:border-box}
.k{max-width:420px;background:linear-gradient(135deg,#5B4BF5,#9B4DE0);color:#fff;border-radius:26px;padding:28px 24px;text-align:center;
box-shadow:0 14px 34px rgba(40,30,120,.28)}.e{font-size:56px}h1{margin:8px 0 6px;font-size:24px}p{line-height:1.5;margin:0 0 16px}
button{font:inherit;font-weight:700;border:0;border-radius:999px;padding:12px 22px;background:#fff;color:#4B32C8;cursor:pointer}
button:focus-visible{outline:3px solid #FFD84D;outline-offset:3px}</style></head><body><main class="k">
<div class="e" aria-hidden="true">📴</div><h1>Du bist gerade offline</h1>
<p>Diese Seite ist noch nicht auf deinem Gerät gespeichert. Sobald du wieder Internet hast, geht es weiter.
Tipp: In «Offline spielen» kannst du easyplay für unterwegs herunterladen.</p>
<button type="button" onclick="location.reload()">Nochmals versuchen</button></main></body></html>`;

/* ---------- Installation und Aktivierung ---------- */

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_HUELLE);
    // Einzeln laden: fehlt eine Datei, scheitert die Installation trotzdem nicht
    await Promise.all(HUELLE.map((pfad) =>
      fetch(new Request(pfad, { cache: "reload" }))
        .then((r) => (speicherbar(r) ? cache.put(pfad, r) : null))
        .catch(() => null)
    ));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const namen = await caches.keys();
    // Alle alten Versions-Caches löschen (auch alte Bilder); Offline-Pakete (epoff-…) bleiben
    const alt = namen.filter((n) => n.startsWith("ep-") && n !== CACHE_HUELLE && n !== CACHE_BILDER);
    await Promise.all(alt.map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

/* ---------- Strategien ---------- */

// Startseite auch im Grundpaket auffrischen, falls es geladen ist
async function seiteSpeichern(antwort) {
  const cache = await caches.open(CACHE_HUELLE);
  await cache.put("./", antwort.clone());
  if (await caches.has(PAKET_PREFIX + "grund")) {
    const g = await caches.open(PAKET_PREFIX + "grund");
    await g.put("./", antwort.clone());
    await g.put("index.html", antwort.clone());
  }
}

// Seiten: zuerst Netz, sonst gespeicherte Seite (Hülle oder Offline-Paket), sonst freundliche Offline-Seite
async function netzZuerst(event) {
  try {
    let antwort;
    try { antwort = await fetch(event.request.url, { cache: "no-cache", credentials: "same-origin" }); }
    catch (e1) { antwort = await fetch(event.request); }
    const pfad = new URL(event.request.url).pathname;
    if (speicherbar(antwort) && (pfad.endsWith("/") || pfad.endsWith("/index.html"))) {
      event.waitUntil(seiteSpeichern(antwort.clone()).catch(() => null));
    }
    return antwort;
  } catch (e) {
    const pfad = new URL(event.request.url).pathname;
    const startseite = pfad.endsWith("/") || pfad.endsWith("/index.html");
    const t = (await finde(event.request, [CACHE_HUELLE]))
      || (startseite ? (await finde("./", [CACHE_HUELLE])) || (await finde("index.html", [CACHE_HUELLE])) : null);
    if (t) return t.antwort;
    return new Response(OFFLINE_SEITE, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
}

// Aus dem Cache antworten (Hülle oder Offline-Paket), im Hintergrund dort aktualisieren
async function staleWhileRevalidate(event, key, cacheName) {
  const ziel = cacheName || CACHE_HUELLE;
  const t = await finde(key || event.request, [ziel, CACHE_HUELLE]);
  if (t) {
    if (!offlineNetz()) event.waitUntil(holenUndSpeichern(t.name === CACHE_HUELLE ? ziel : t.name, event.request, key, t.antwort).catch(() => null));
    return t.antwort;
  }
  try {
    return await holenUndSpeichern(ziel, event.request, key);
  } catch (e) {
    return nichtDa();
  }
}

// Code (js, css, json, Schriften): zuerst Netz ohne HTTP-Cache (dank ETag meist nur ein kurzes «unverändert»),
// damit nach einem Update sofort die neue Version läuft. Antwortet das Netz nicht innert 3 Sekunden
// oder ist man offline, kommt die gespeicherte Version.
async function codeNetzZuerst(event) {
  const frisch = (async () => {
    const antwort = await fetch(new Request(event.request, { cache: "no-cache" }));
    if (speicherbar(antwort)) {
      const cache = await caches.open(CACHE_HUELLE);
      await cache.put(event.request, antwort.clone());
    }
    return antwort;
  })();
  if (offlineNetz()) {
    const t = await finde(event.request, [CACHE_HUELLE]);
    if (t) return t.antwort;
  }
  const zeit = new Promise((ok) => setTimeout(() => ok(null), 8000));
  try {
    const r = await Promise.race([frisch, zeit]);
    if (r) return r;
    event.waitUntil(frisch.catch(() => null));
    const t = await finde(event.request, [CACHE_HUELLE]);
    if (t) return t.antwort;
    return await frisch;
  } catch (e) {
    const t = await finde(event.request, [CACHE_HUELLE]);
    return t ? t.antwort : nichtDa();
  }
}

// Bilder: zuerst Cache (Bilder, Hülle, Offline-Pakete), sonst Netz und speichern
async function datenFuerImmer(event, key) {
  const t = await finde(key, [CACHE_DATEN]);
  if (t) return t.antwort;
  try {
    return await holenUndSpeichern(CACHE_DATEN, event.request, key);
  } catch (e) {
    return nichtDa();
  }
}

async function cacheZuerst(event) {
  const t = await finde(event.request, [CACHE_BILDER, CACHE_HUELLE]);
  if (t) return t.antwort;
  try {
    const antwort = await fetch(event.request);
    if (speicherbar(antwort)) {
      const cache = await caches.open(CACHE_BILDER);
      event.waitUntil(cache.put(event.request, antwort.clone()).then(bilderTrimmen).catch(() => null));
    }
    return antwort;
  } catch (e) {
    // Offline: Statt des grossen Bildes das kleine aus einem Offline-Paket nehmen
    const klein = event.request.url.replace(/\/bilder\/gross\//, "/bilder/");
    if (klein !== event.request.url) {
      const k = await finde(klein, [CACHE_BILDER]);
      if (k) return k.antwort;
    }
    return nichtDa();
  }
}

/* ---------- Fetch-Weiche ---------- */

self.addEventListener("fetch", (event) => {
  const anfrage = event.request;
  if (anfrage.method !== "GET") return;

  const url = new URL(anfrage.url);
  // Fremde Server (Supabase, Wikipedia, Schriften, APIs) normal übers Netz, nie cachen
  if (url.origin !== self.location.origin) return;
  // Admin-Bereich nie cachen
  if (url.pathname.includes("/admin/")) return;
  // Teilanfragen (z.B. Video/Audio) nicht anfassen
  if (anfrage.headers.has("range")) return;
  // Downloads der Paketverwaltung (offline.js) direkt übers Netz
  if (anfrage.headers.has(OFFLINE_KOPF)) return;

  // Versionsabfrage der Seite (sw.js?nocache=…) immer direkt beim Server, nie aus dem Speicher
  if (url.searchParams.has("nocache")) return;

  const pfad = url.pathname;
  const datei = pfad.slice(pfad.lastIndexOf("/") + 1);

  // 1. Navigation / HTML-Seiten
  if (anfrage.mode === "navigate" || (anfrage.headers.get("accept") || "").includes("text/html")) {
    event.respondWith(netzZuerst(event));
    return;
  }

  // 2a. Bibliothekstexte tx/…: Name enthält den Inhalts-Hash, also nur einmal laden und behalten
  if (/\/tx\/[^/]+\.json$/.test(pfad)) {
    event.respondWith(datenFuerImmer(event, schluessel(anfrage.url)));
    return;
  }
  // 2b. Grosse Daten: Fragen, alte Texte, Bildindex (Datenspeicher, überlebt Updates; zuerst Speicher, dann still aktualisieren)
  if (/^fragen-.*\.json$/.test(datei) || /^texte.*\.json$/.test(datei) || datei === "bildindex.json") {
    event.respondWith(staleWhileRevalidate(event, schluessel(anfrage.url), CACHE_DATEN));
    return;
  }
  // 2c. daten-*.js gehören zum Code dieser Version
  if (/^daten-.*\.js$/.test(datei)) {
    event.respondWith(staleWhileRevalidate(event, schluessel(anfrage.url)));
    return;
  }

  // 3. Bilder unter bilder/, img/ und flags/
  const basis = new URL("./", self.location.href).pathname;
  const relativ = pfad.startsWith(basis) ? pfad.slice(basis.length) : pfad;
  if (relativ.startsWith("bilder/") || relativ.startsWith("img/") || relativ.startsWith("flags/")) {
    event.respondWith(cacheZuerst(event));
    return;
  }

  // 4. Alles andere (js, css, json, Schriften lokal): zuerst Netz, offline aus dem Speicher
  event.respondWith(codeNetzZuerst(event));
});

/* ---------- Nachrichten von der Seite ---------- */

self.addEventListener("message", (event) => {
  const daten = event.data || {};
  const antworten = (msg) => {
    if (event.ports && event.ports[0]) event.ports[0].postMessage(msg);
    else if (event.source) event.source.postMessage(msg);
  };

  // { typ: "info" }: Version und App-Hülle für die Paketverwaltung (offline.js)
  if (daten.typ === "info") {
    antworten({ typ: "info", version: VERSION, huelle: HUELLE, cacheHuelle: CACHE_HUELLE, cacheBilder: CACHE_BILDER });
    return;
  }

  // { typ: "pakete" }: Paketliste neu einlesen (nach Laden oder Entfernen eines Pakets)
  if (daten.typ === "pakete") {
    paketListe = null;
    antworten({ typ: "pakete-ok" });
    return;
  }

  // { typ: "vorladen" }: Fragen und Bildindex für die Offline-Nutzung laden (älterer Weg)
  if (daten.typ !== "vorladen") return;
  event.waitUntil((async () => {
    let ok = 0;
    await Promise.all(VORLADEN.map((pfad) =>
      holenUndSpeichern(CACHE_HUELLE, new Request(pfad, { cache: "no-cache" }), schluessel(new URL(pfad, self.location.href).href))
        .then((r) => { if (r.ok) ok++; })
        .catch(() => null)
    ));
    antworten({ typ: "vorladen-fertig", ok: ok, total: VORLADEN.length });
  })());
});
