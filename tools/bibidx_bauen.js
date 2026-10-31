// Baut bibidx.js neu (Bibliothek-Index). Nötig, wenn sich die Fragen ändern (fragen-*.json):
// ohne passenden Index rechnet die Bibliothek beim Laden über 10 s auf dem Hauptfaden.
// Aufruf im Repo-Ordner: NODE_PATH=$(npm root -g) node tools/bibidx_bauen.js   (braucht playwright)
const http = require("http"), fs = require("fs"), path = require("path");
const { chromium } = require("playwright");
const WURZEL = path.resolve(__dirname, ".."), PORT = 8877;
const TYP = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp", ".png": "image/png" };
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split("?")[0]); if (p.endsWith("/")) p += "index.html";
  fs.readFile(path.join(WURZEL, p), (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { "Content-Type": TYP[path.extname(p)] || "application/octet-stream" }); r.end(d); }); }).listen(PORT);
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ serviceWorkers: "block" }); const p = await ctx.newPage();
  await p.route("**/bibidx.js", (r) => r.fulfill({ contentType: "text/javascript", body: "window.EP_BIBIDX=null;" }));
  await p.route(/^https?:\/\/(?!localhost)/, (r) => r.abort());
  await p.goto(`http://localhost:${PORT}/`);
  await p.waitForFunction(() => { try { return FRAGEN.length > 1000 && BUECHER.length > 0; } catch (e) { return false; } }, null, { timeout: 180000, polling: 500 });
  await p.waitForTimeout(2000);
  const out = await p.evaluate(() => { const R = {}; const orig = window.rxTreffer;
    window.rxTreffer = function (uniq, text, re, max, ok) { const res = orig.apply(this, arguments);
      R[re.source + "/" + re.flags + "/" + max + "/" + (text === fTextM ? "m" : "t") + (ok ? "/o" : "")] = res.map((f) => (f.nr != null ? f.nr : "q:" + f.q)); return res; };
    for (const k in BUCHCACHE) delete BUCHCACHE[k];
    for (const bk of BUECHER) { try { buchDaten(bk.id); } catch (e) {} }
    window.rxTreffer = orig; return { n: FRAGEN.length, r: R }; });
  fs.writeFileSync(path.join(WURZEL, "bibidx.js"), "/* easyplay Bibliothek-Index (automatisch) */window.EP_BIBIDX=" + JSON.stringify(out) + ";\n");
  console.log(`bibidx.js neu: ${out.n} Fragen, ${Object.keys(out.r).length} Suchen`);
  await b.close(); srv.close();
})().catch((e) => { console.error(e); process.exit(1); });
