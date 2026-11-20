// easyplay-Server: Räume für Live-Spiele (Live-Wettbewerb mit PIN und Online-Duell mit PIN).
// Ersatz für die Räume der claude.ai-Vorschau. Die Website (raum.js im Hauptordner) fragt etwa jede Sekunde nach:
// POST /api/raum {raum, peer, presence|null, weg?} -> {peers:[{peer, presence}]}  (alle Teilnehmenden ausser dir)
// Alles liegt nur im Arbeitsspeicher und verschwindet nach kurzer Zeit: ein Teilnehmender gilt nach 20 s ohne
// Meldung als weg, ein leerer Raum wird gelöscht. Es wird nichts in die Datenbank geschrieben.
const RAEUME = new Map();            // raum -> Map(peer -> {p: presence, t: zeit})
const WEG_NACH = 20e3, MAX_RAEUME = 3000, MAX_PEERS = 120, MAX_GROESSE = 120e3, MAX_GESAMT = 40e6;   // zusammen höchstens etwa 40 MB
let gesamt = 0;   // Grösse aller gespeicherten Stände in Zeichen
const RAUM_OK = /^easyplay-(duell-)?\d{4}$/, PEER_OK = /^[a-z0-9]{8,40}$/i;

/* Mengenbremse: pro IP höchstens 600 Abfragen pro Minute (eine Schulklasse hinter einem Schulnetz pollt jede Sekunde) */
const IP = new Map(); let ipMinute = 0;
function gebremst(ip) {
  const m = Math.floor(Date.now() / 60e3);
  if (m !== ipMinute) { ipMinute = m; IP.clear(); }
  const n = (IP.get(ip) || 0) + 1; IP.set(ip, n); return n > 600;
}

function aufraeumen(jetzt) {
  for (const [r, peers] of RAEUME) {
    for (const [id, x] of peers) if (jetzt - x.t > WEG_NACH) { gesamt -= x.n || 0; peers.delete(id); }
    if (!peers.size) RAEUME.delete(r);
  }
}
let zuletzt = 0;

export async function raumAnfrage(req, res) {
  if (req.method !== "POST") return res.json(405, { message: "Nicht erlaubt" });
  if (gebremst(req.ip || "")) return res.json(429, { message: "Zu viele Anfragen" });
  const b = await req.body();
  const raum = String(b.raum || ""), peer = String(b.peer || "");
  if (!RAUM_OK.test(raum) || !PEER_OK.test(peer)) return res.json(400, { message: "Ungültiger Raum" });
  const jetzt = Date.now();
  if (jetzt - zuletzt > 5e3) { zuletzt = jetzt; aufraeumen(jetzt); }
  let peers = RAEUME.get(raum);
  if (b.weg) { if (peers) { const x = peers.get(peer); if (x) gesamt -= x.n || 0; peers.delete(peer); if (!peers.size) RAEUME.delete(raum); } return res.json(200, { peers: [] }); }
  if (!peers) {
    if (RAEUME.size >= MAX_RAEUME) return res.json(503, { message: "Gerade sind zu viele Spiele offen. Bitte später nochmals." });
    peers = new Map(); RAEUME.set(raum, peers);
  }
  const alt = peers.get(peer);
  if (!alt && peers.size >= MAX_PEERS) return res.json(403, { message: "Dieses Spiel ist voll." });
  let p = alt ? alt.p : {}, n = alt ? alt.n || 0 : 0;
  if (b.presence && typeof b.presence === "object" && !Array.isArray(b.presence)) {
    const neuN = JSON.stringify(b.presence).length;
    if (neuN > MAX_GROESSE) return res.json(413, { message: "Zu gross" });
    if (gesamt - n + neuN > MAX_GESAMT) { aufraeumen(jetzt); if (gesamt - n + neuN > MAX_GESAMT) return res.json(503, { message: "Gerade sind zu viele Spiele offen. Bitte später nochmals." }); }
    p = b.presence; gesamt += neuN - n; n = neuN;
  } else if (!alt) { n = 2; gesamt += n; }
  peers.set(peer, { p, t: jetzt, n });
  const liste = [];
  for (const [id, x] of peers) if (id !== peer) liste.push({ peer: id, presence: x.p });
  return res.json(200, { peers: liste });
}
