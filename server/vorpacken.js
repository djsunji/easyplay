// Beim Bau des Docker-Abbilds: grosse Textdateien schon vorab packen (.br und .gz daneben).
// So muss der Server beim Ausliefern nichts mehr packen (wenig Speicher und Rechenzeit, schnell).
import { readdirSync, statSync, readFileSync, writeFileSync } from "node:fs";
import { join, extname } from "node:path";
import { brotliCompressSync, gzipSync, constants as Z } from "node:zlib";

const WURZEL = process.argv[2] || ".";
const TEXT = new Set([".html", ".js", ".css", ".json", ".webmanifest", ".svg", ".txt", ".xml"]);
const AUSLASSEN = new Set(["node_modules", ".git", "bilder", "server", "app", "tools", "supabase"]);
let n = 0, vorher = 0, nachher = 0;
function gehen(ordner) {
  for (const name of readdirSync(ordner)) {
    if (name.startsWith(".") || AUSLASSEN.has(name)) continue;
    const p = join(ordner, name), st = statSync(p);
    if (st.isDirectory()) { gehen(p); continue; }
    if (!TEXT.has(extname(name).toLowerCase()) || st.size < 1024) continue;
    const roh = readFileSync(p);
    const br = brotliCompressSync(roh, { params: { [Z.BROTLI_PARAM_QUALITY]: 9, [Z.BROTLI_PARAM_SIZE_HINT]: roh.length } });
    writeFileSync(p + ".br", br); writeFileSync(p + ".gz", gzipSync(roh, { level: 9 }));
    n++; vorher += roh.length; nachher += br.length;
  }
}
gehen(WURZEL);
console.log(`vorgepackt: ${n} Dateien, ${(vorher / 1e6).toFixed(0)} MB -> ${(nachher / 1e6).toFixed(0)} MB (br)`);
