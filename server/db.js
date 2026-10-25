// easyplay-Server: Verbindung zur PostgreSQL-Datenbank, Einrichtung (Migrationen) und Anfragen
// «im Namen» einer Person (auth.uid() in den SQL-Funktionen).
import postgres from "postgres";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HIER = dirname(fileURLToPath(import.meta.url));
const REPO = join(HIER, "..");

/* Verbindung: entweder DATABASE_URL (postgres://…) oder einzeln PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD
   (so wie im Cockpit von Nine unter «Zugang» angezeigt, ohne Umschreiben des Passworts) */
const URL_DB = process.env.DATABASE_URL || "";
const MIT_SSL = /sslmode=(require|verify)/.test(URL_DB) || process.env.DB_SSL === "1" || /^(require|verify)/.test(process.env.PGSSLMODE || "")
  || /\.nineapis\.ch$/.test(process.env.PGHOST || "") || /\.nineapis\.ch[:/]/.test(URL_DB);
const OPTIONEN = {
  max: +process.env.DB_MAX || 10,
  idle_timeout: 30,
  connect_timeout: 15,
  ssl: MIT_SSL ? "require" : false,
  onnotice: () => {},
  transform: { undefined: null },
};
export const sql = URL_DB ? postgres(URL_DB, OPTIONEN)
  : process.env.PGHOST ? postgres({ ...OPTIONEN, host: process.env.PGHOST, port: +process.env.PGPORT || 5432, database: process.env.PGDATABASE || process.env.PGUSER, username: process.env.PGUSER, password: process.env.PGPASSWORD })
  : postgres("postgres://localhost/easyplay", OPTIONEN);

/* Reihenfolge wie in ANLEITUNG-SUPABASE.md «Neu einrichten». sicherheit.sql braucht es bei neuer Datenbank nicht. */
export const DATEIEN = [
  "server/sql/00-auth.sql",
  "supabase/schema.sql", "supabase/lehrer.sql", "supabase/admin.sql", "supabase/lehrer2.sql",
  "supabase/klassenliga.sql", "supabase/live.sql", "supabase/regionen.sql", "supabase/duell.sql", "supabase/verwaltung.sql",
  "server/sql/90-server.sql",
];

// SQL in einzelne Befehle teilen (beachtet Texte, Namen in Anführungszeichen, $$-Körper und Kommentare)
export function teilen(text) {
  const out = []; let start = 0, i = 0; const n = text.length;
  while (i < n) {
    const c = text[i], d = text[i + 1];
    if (c === "-" && d === "-") { const e = text.indexOf("\n", i); i = e < 0 ? n : e + 1; continue; }
    if (c === "/" && d === "*") { const e = text.indexOf("*/", i + 2); i = e < 0 ? n : e + 2; continue; }
    if (c === "'") { i++; while (i < n) { if (text[i] === "'" && text[i + 1] === "'") { i += 2; continue; } if (text[i] === "'") { i++; break; } i++; } continue; }
    if (c === '"') { const e = text.indexOf('"', i + 1); i = e < 0 ? n : e + 1; continue; }
    if (c === "$") {
      const m = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(text.slice(i, i + 64));
      if (m) { const tag = m[0]; const e = text.indexOf(tag, i + tag.length); i = e < 0 ? n : e + tag.length; continue; }
    }
    if (c === ";") { const s = text.slice(start, i).trim(); if (s) out.push(s); start = i + 1; }
    i++;
  }
  const rest = text.slice(start).trim(); if (rest && rest.replace(/--[^\n]*|\s+/g, "")) out.push(rest);
  return out;
}
const ohneKommentar = s => s.replace(/^(\s*(--[^\n]*\n|\/\*[\s\S]*?\*\/))*\s*/, "");
const ROLLEN_BEFEHL = /^(grant|revoke|create\s+policy|drop\s+policy|alter\s+policy|alter\s+default\s+privileges)\b/i;

/* Freigaben aus den grant/revoke-Befehlen: welche Funktion und Tabelle anon bzw. authenticated nutzen darf */
export const FREIGABE = { fn: new Map() };   // name -> {anon:bool, auth:bool}
function freigabeLesen(befehl) {
  const s = ohneKommentar(befehl).replace(/\s+/g, " ");
  let m = /^(grant|revoke) (?:execute|all)(?: privileges)? on function ([^;]+?) (to|from) (.+)$/i.exec(s);
  if (!m) return;
  const gib = m[1].toLowerCase() === "grant";
  const wer = m[4].toLowerCase().split(",").map(x => x.trim());
  const namen = [...m[2].matchAll(/(?:public\.)?([a-z_][a-z0-9_]*)\s*\(/gi)].map(x => x[1].toLowerCase());
  for (const name of namen) {
    const f = FREIGABE.fn.get(name) || { anon: false, auth: false };
    if (wer.includes("anon") || wer.includes("public")) f.anon = gib;
    if (wer.includes("authenticated") || wer.includes("public")) f.auth = gib;
    FREIGABE.fn.set(name, f);
  }
}

export async function einrichten(log = console.log) {
  /* Mehrere Kopien starten gleichzeitig: nur eine richtet ein, die anderen warten (Sperre in der Datenbank) */
  await sql.begin(async haupt => {
  await haupt`select pg_advisory_xact_lock(7272401)`;
  for (const datei of DATEIEN) {
    const pfad = join(REPO, datei);
    if (!existsSync(pfad)) continue;
    const text = readFileSync(pfad, "utf8");
    const befehle = teilen(text);
    for (const b of befehle) if (/^(grant|revoke)/i.test(ohneKommentar(b))) freigabeLesen(b);
    const hash = createHash("sha256").update(text).digest("hex");
    let alt = null;
    try { [alt] = await haupt.savepoint(sp => sp`select hash from public.ep_migrationen where datei = ${datei}`); } catch (e) { /* Tabelle gibt es noch nicht */ }
    if (alt && alt.hash === hash) continue;
    const laufen = befehle.filter(b => !ROLLEN_BEFEHL.test(ohneKommentar(b)));
    await haupt.savepoint(async tx => {
      for (const b of laufen) {
        try { await tx.savepoint(sp => sp.unsafe(b)); }
        catch (e) {
          /* Rechte-Befehle in DO-Blöcken (grant ... to authenticated): ohne Supabase-Rollen überspringen */
          if (e.code === "42704" && /role "(anon|authenticated|service_role)"/.test(e.message)) continue;
          e.message = `${datei}: ${e.message}\n--- Befehl:\n${b.slice(0, 400)}`; throw e;
        }
      }
      await tx`insert into public.ep_migrationen (datei, hash) values (${datei}, ${hash})
               on conflict (datei) do update set hash = excluded.hash, zeit = now()`;
    });
    log(`Datenbank: ${datei} eingespielt (${laufen.length} Befehle)`);
  }
  });
  // Wer ist Admin? ADMIN_EMAIL (Komma-Liste) bekommt beim Start Admin-Rechte, sobald das Konto existiert.
  for (const mail of String(process.env.ADMIN_EMAIL || "").split(",").map(x => x.trim().toLowerCase()).filter(Boolean)) {
    /* nur mit echtem Mailversand: sonst könnte jemand die Adresse vorher selbst registrieren */
    if (!(process.env.SMTP_HOST && process.env.MAIL_FROM)) continue;
    await sql`insert into public.admins (user_id) select id from auth.users where lower(email) = ${mail} and email_confirmed_at is not null on conflict do nothing`.catch(() => {});
  }
}

/* Eine Anfrage im Namen einer Person: auth.uid(), auth.jwt() und die IP stehen den SQL-Funktionen zur Verfügung */
export function alsPerson(person, ip, arbeit) {
  return sql.begin(async tx => {
    const claims = person ? { sub: person.sub, role: "authenticated", email: person.email || "", aal: "aal1" } : { role: "anon" };
    await tx`select set_config('statement_timeout', '8s', true),
                    set_config('request.jwt.claim.sub', ${person ? person.sub : ""}, true),
                    set_config('request.jwt.claim.role', ${claims.role}, true),
                    set_config('request.jwt.claims', ${JSON.stringify(claims)}, true),
                    set_config('request.headers', ${JSON.stringify({ "x-forwarded-for": ip || "" })}, true)`;
    return arbeit(tx);
  });
}
