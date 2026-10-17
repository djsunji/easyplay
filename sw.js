/* easyplay Service Worker
   Sorgt für schnelle Wiederholungsbesuche und Offline-Nutzung.
   Bei jeder Änderung an der App-Hülle VERSION hochzählen, damit alte Caches gelöscht werden. */

const VERSION = "ep-2026-10-17-10";
const CACHE_HUELLE = VERSION + "-huelle";   // App-Hülle, Code, Daten
const CACHE_BILDER = VERSION + "-bilder";   // Bilder aus bilder/ und img/
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
  "app.js", "stil.js", "duell2.js", "img/logo.webp", "img/kids/leni.webp", "img/kids/ben.webp", "img/kids/lb-jubel.webp", "img/kids/lb-schock.webp", "img/kids/lb-daumen.webp", "img/kids/lb-denken.webp", "img/kids/lb-sitzen.webp",
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

// Dateien für den Knopf «offline verfügbar machen»
const VORLADEN = [];
for (let i = 1; i <= 13; i++) VORLADEN.push("fragen-" + i + ".json");
VORLADEN.push("bildindex.json");

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

// Holt eine Ressource frisch vom Netz und legt sie im Cache ab
async function holenUndSpeichern(cacheName, anfrage, key) {
  const antwort = await fetch(anfrage);
  if (speicherbar(antwort)) {
    const cache = await caches.open(cacheName);
    await cache.put(key || anfrage, antwort.clone());
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
    await Promise.all(namen
      .filter((n) => n.startsWith("ep-") && n !== CACHE_HUELLE && n !== CACHE_BILDER)
      .map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

/* ---------- Strategien ---------- */

// Seiten: zuerst Netz, sonst gespeicherte index.html
async function netzZuerst(event) {
  try {
    const antwort = await fetch(event.request);
    if (speicherbar(antwort) && new URL(event.request.url).pathname.endsWith("/")) {
      const cache = await caches.open(CACHE_HUELLE);
      event.waitUntil(cache.put("./", antwort.clone()));
    }
    return antwort;
  } catch (e) {
    const cache = await caches.open(CACHE_HUELLE);
    return (await cache.match(event.request, { ignoreSearch: true }))
      || (await cache.match("index.html"))
      || (await cache.match("./"))
      || new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}

// Aus dem Cache antworten, im Hintergrund aktualisieren
async function staleWhileRevalidate(event, key) {
  const cache = await caches.open(CACHE_HUELLE);
  const treffer = await cache.match(key || event.request, { ignoreSearch: true });
  const frisch = holenUndSpeichern(CACHE_HUELLE, event.request, key);
  if (treffer) {
    event.waitUntil(frisch.catch(() => null));
    return treffer;
  }
  return frisch;
}

// Bilder: zuerst Cache, sonst Netz und speichern
async function cacheZuerst(event) {
  const cache = await caches.open(CACHE_BILDER);
  const treffer = await cache.match(event.request);
  if (treffer) return treffer;
  const antwort = await fetch(event.request);
  if (speicherbar(antwort)) {
    event.waitUntil(cache.put(event.request, antwort.clone()).then(bilderTrimmen).catch(() => null));
  }
  return antwort;
}

/* ---------- Fetch-Weiche ---------- */

self.addEventListener("fetch", (event) => {
  const anfrage = event.request;
  if (anfrage.method !== "GET") return;

  const url = new URL(anfrage.url);
  // Fremde Server (Supabase, Wikipedia, Schriften, APIs) normal übers Netz
  if (url.origin !== self.location.origin) return;
  // Admin-Bereich nie cachen
  if (url.pathname.includes("/admin/")) return;
  // Teilanfragen (z.B. Video/Audio) nicht anfassen
  if (anfrage.headers.has("range")) return;

  const pfad = url.pathname;
  const datei = pfad.slice(pfad.lastIndexOf("/") + 1);

  // 1. Navigation / HTML-Seiten
  if (anfrage.mode === "navigate" || (anfrage.headers.get("accept") || "").includes("text/html")) {
    event.respondWith(netzZuerst(event));
    return;
  }

  // 2. Grosse Daten: Fragen, Texte, Bildindex, daten-*.js
  if (/^fragen-.*\.json$/.test(datei) || /^texte.*\.json$/.test(datei)
      || datei === "bildindex.json" || /^daten-.*\.js$/.test(datei)) {
    event.respondWith(staleWhileRevalidate(event, schluessel(anfrage.url)));
    return;
  }

  // 3. Bilder unter bilder/ und img/
  const basis = new URL("./", self.location.href).pathname;
  const relativ = pfad.startsWith(basis) ? pfad.slice(basis.length) : pfad;
  if (relativ.startsWith("bilder/") || relativ.startsWith("img/")) {
    event.respondWith(cacheZuerst(event));
    return;
  }

  // 4. Alles andere (js, css, json, Schriften lokal): aus Cache, im Hintergrund aktualisieren
  event.respondWith(staleWhileRevalidate(event));
});

/* ---------- Nachrichten von der Seite ---------- */

// { typ: "vorladen" }: Fragen und Bildindex für die Offline-Nutzung laden
self.addEventListener("message", (event) => {
  const daten = event.data || {};
  if (daten.typ !== "vorladen") return;

  event.waitUntil((async () => {
    let ok = 0;
    await Promise.all(VORLADEN.map((pfad) =>
      holenUndSpeichern(CACHE_HUELLE, new Request(pfad, { cache: "no-cache" }), schluessel(new URL(pfad, self.location.href).href))
        .then((r) => { if (r.ok) ok++; })
        .catch(() => null)
    ));
    // Rückmeldung an die Seite, z.B. für eine Erfolgsanzeige
    if (event.source) event.source.postMessage({ typ: "vorladen-fertig", ok: ok, total: VORLADEN.length });
  })());
});
