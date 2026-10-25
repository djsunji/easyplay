// easyplay-Server: liefert die Website (Dateien aus dem Repo) aus, mit ETag, gzip und Teilabrufen für Musik.
import { stat, readFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { join, normalize, extname, sep } from "node:path";
import { gzip as gzipCb, brotliCompress as brCb, constants as Z } from "node:zlib";
import { promisify } from "node:util";

const gzip = promisify(gzipCb), brotli = promisify(brCb);
const TYP = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif",
  ".ico": "image/x-icon", ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".wav": "audio/wav", ".woff2": "font/woff2", ".woff": "font/woff",
  ".txt": "text/plain; charset=utf-8", ".xml": "application/xml; charset=utf-8", ".pdf": "application/pdf",
};
const PACKEN = new Set([".html", ".js", ".mjs", ".css", ".json", ".webmanifest", ".svg", ".txt", ".xml"]);
/* Nicht ausliefern: Server, Werkzeuge, Datenbank-Dateien, Abläufe, App-Bau, versteckte Dateien, Anleitungen */
const GESPERRT = /^(server|tools|supabase|app|node_modules|\.github|\.git)(\/|$)|(^|\/)\.|\.(md|py|sh|sql|mjs\.map|br|gz)$|^(CLAUDE|README|Dockerfile)/i;

const PUFFER = new Map(); let pufferBytes = 0; const PUFFER_MAX = (+process.env.PUFFER_MB || 24) * 1024 * 1024;   // klein halten (micro: 256 MB)
async function gepackt(pfad, groesse, mtime, art) {
  const k = `${pfad}|${mtime}|${art}`;
  if (PUFFER.has(k)) return PUFFER.get(k);
  const roh = await readFile(pfad);
  const daten = art === "br" ? await brotli(roh, { params: { [Z.BROTLI_PARAM_QUALITY]: 6, [Z.BROTLI_PARAM_SIZE_HINT]: groesse } }) : await gzip(roh, { level: 6 });
  if (daten.length < 2 * 1024 * 1024) {
    PUFFER.set(k, daten); pufferBytes += daten.length;
    while (pufferBytes > PUFFER_MAX) { const [ak, av] = PUFFER.entries().next().value; PUFFER.delete(ak); pufferBytes -= av.length; }
  }
  return daten;
}

export function statischMacher(wurzel) {
  return async function statisch(req, res) {
    if (req.method !== "GET" && req.method !== "HEAD") return false;
    let rel;
    try { rel = decodeURIComponent(req.pfad).replace(/^\/+/, ""); } catch (e) { return false; }
    if (rel === "" || rel.endsWith("/")) rel += "index.html";
    rel = normalize(rel).split(sep).join("/");
    if (rel.startsWith("..") || GESPERRT.test(rel)) return false;
    const pfad = join(wurzel, rel);
    let st; try { st = await stat(pfad); } catch (e) { return false; }
    if (st.isDirectory()) { res.weiter("/" + rel.replace(/^\/+/, "") + "/" + (req.suche || "")); return true; }
    const ext = extname(rel).toLowerCase();
    const etag = `W/"${st.size.toString(36)}-${Math.floor(st.mtimeMs).toString(36)}"`;
    const h = {
      "Content-Type": TYP[ext] || "application/octet-stream", ETag: etag, "Last-Modified": st.mtime.toUTCString(),
      "X-Content-Type-Options": "nosniff", "Referrer-Policy": "strict-origin-when-cross-origin",
      /* Kein Text- und Data-Mining, kein KI-Training; Daten (JSON, Bilder der Bibliothek) nicht in Suchmaschinen */
      "TDM-Reservation": "1", "TDM-Policy": "https://easyplay.ch/impressum.html",
      /* Suchmaschinen: Startseite, Impressum und Datenschutz finden und anschauen, mehr nicht */
      "X-Robots-Tag": /^(index|impressum|datenschutz)\.html$/.test(rel) ? "index, nofollow, noarchive, nosnippet, noimageindex, max-image-preview:none, notranslate, noai, noimageai"
        : "noindex, nofollow, noarchive, nosnippet, noimageindex, noai, noimageai",
      "Access-Control-Allow-Origin": "*",            // öffentliche Dateien: die App lädt Bilder und Korrekturen von hier
      "Cache-Control": ext === ".html" || rel === "sw.js" ? "no-cache" : /^(bilder|img|flags|musik|tx)\//.test(rel) ? "public, max-age=86400" : "public, max-age=600",
    };
    if (ext === ".html") { h["X-Frame-Options"] = "SAMEORIGIN"; h["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"; }
    if (rel === "sw.js") h["Service-Worker-Allowed"] = "/";
    if (req.headers["if-none-match"] === etag) { res.writeHead(304, h); res.end(); return true; }
    const enc = String(req.headers["accept-encoding"] || "");
    if (PACKEN.has(ext) && st.size > 1024) {
      const art = /\bbr\b/.test(enc) ? "br" : /\bgzip\b/.test(enc) ? "gzip" : null;
      if (art) {
        /* Vorgepackt beim Bau (server/vorpacken.js)? Sonst einmal packen und kleine Dateien merken */
        let daten = null;
        try { const v = await stat(pfad + (art === "br" ? ".br" : ".gz")); if (v.mtimeMs >= st.mtimeMs - 1000) daten = await readFile(pfad + (art === "br" ? ".br" : ".gz")); } catch (e) {}
        if (!daten) daten = await gepackt(pfad, st.size, st.mtimeMs, st.size > 512 * 1024 ? "gzip" : art);
        const artIst = daten && daten[0] === 0x1f && daten[1] === 0x8b ? "gzip" : art;
        res.writeHead(200, { ...h, "Content-Encoding": artIst, "Content-Length": daten.length, Vary: "Accept-Encoding" });
        res.end(req.method === "HEAD" ? undefined : daten); return true;
      }
    }
    h["Accept-Ranges"] = "bytes";
    const bereich = /^bytes=(\d*)-(\d*)$/.exec(String(req.headers.range || ""));
    if (bereich && (bereich[1] || bereich[2])) {
      let a = bereich[1] ? +bereich[1] : st.size - +bereich[2], b = bereich[1] && bereich[2] ? +bereich[2] : st.size - 1;
      if (a < 0) a = 0; if (b >= st.size) b = st.size - 1;
      if (a > b) { res.writeHead(416, { "Content-Range": `bytes */${st.size}` }); res.end(); return true; }
      res.writeHead(206, { ...h, "Content-Range": `bytes ${a}-${b}/${st.size}`, "Content-Length": b - a + 1 });
      if (req.method === "HEAD") { res.end(); return true; }
      createReadStream(pfad, { start: a, end: b }).pipe(res); return true;
    }
    res.writeHead(200, { ...h, "Content-Length": st.size });
    if (req.method === "HEAD") { res.end(); return true; }
    createReadStream(pfad).pipe(res); return true;
  };
}
