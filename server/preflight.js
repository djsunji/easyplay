// Preflight (easyplay.ch/preflight/): holt den Crew-Kalender (ICS) für den Browser ab,
// weil Crew-Portale keinen direkten Abruf aus dem Browser erlauben (CORS).
// Nur https und nur Hosts aus FEED_HOSTS (Standard ops.helvetic.com), damit der Server kein offener Proxy ist.
// Der Link enthält den persönlichen Schlüssel: nie loggen, nichts speichern.
const E = process.env;
const MAX = 3 * 1024 * 1024;
const zaehler = new Map();

function erlaubteHosts() {
  return String(E.FEED_HOSTS || "ops.helvetic.com").split(",").map(h => h.trim().toLowerCase()).filter(Boolean);
}

export async function feedAnfrage(req, res) {
  if (req.method !== "GET") return res.json(405, { message: "Nur GET" });
  const jetzt = Date.now(), ip = req.ip || "?";
  const z = zaehler.get(ip);
  if (!z || jetzt - z.ab > 600000) zaehler.set(ip, { ab: jetzt, n: 1 });
  else if (++z.n > 30) return res.json(429, { message: "Zu viele Abrufe, bitte in ein paar Minuten nochmals" });
  if (zaehler.size > 5000) zaehler.clear();

  let ziel;
  try { ziel = new URL(String(req.query.url || "")); } catch (e) { return res.json(400, { message: "Ungültiger Link" }); }
  if (ziel.protocol !== "https:" || ziel.username || ziel.password || ziel.port) return res.json(400, { message: "Nur https-Links" });
  if (!erlaubteHosts().includes(ziel.hostname.toLowerCase())) return res.json(403, { message: "Dieser Kalender-Anbieter ist (noch) nicht freigeschaltet: " + ziel.hostname });

  let antwort;
  try {
    antwort = await fetch(ziel, { redirect: "error", signal: AbortSignal.timeout(15000), headers: { Accept: "text/calendar, */*" } });
  } catch (e) { return res.json(502, { message: "Kalender nicht erreichbar" }); }
  if (!antwort.ok) return res.json(502, { message: "Kalender-Anbieter antwortet mit HTTP " + antwort.status });
  const teile = []; let n = 0;
  for await (const c of antwort.body) { n += c.length; if (n > MAX) return res.json(502, { message: "Kalender zu gross" }); teile.push(c); }
  const text = Buffer.concat(teile).toString("utf8");
  if (!/BEGIN:VCALENDAR/.test(text)) return res.json(502, { message: "Keine Kalenderdaten erhalten" });
  res.writeHead(200, { "Content-Type": "text/calendar; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" });
  res.end(text);
}
