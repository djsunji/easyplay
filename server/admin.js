// easyplay-Server: Schnittstelle nur für die Verwaltung (/api/admin/…). Jede Anfrage braucht die Anmeldung
// eines Admins (Eintrag in public.admins). Liefert, was die Datenbank allein nicht weiss: Zustand des Servers,
// Mailversand, Anmelde-Anbieter, Sperren bei der Anmeldung und eine Sicherung der Datenbank zum Herunterladen.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { sql, alsPerson } from "./db.js";
import { personAusAnfrage, sitzungGueltig, anmeldeSperren } from "./auth.js";
import { mailAn, mailSenden } from "./mail.js";

const E = process.env;
const START = new Date();

async function istAdmin(req) {
  const p = personAusAnfrage(req);
  if (!p || p === "abgelaufen" || !(await sitzungGueltig(p.sid))) return null;
  const [r] = await alsPerson(p, req.ip, tx => tx`select public.ist_admin() as ja`);
  return r && r.ja ? p : null;
}
async function protokoll(p, aktion, ziel, details) {
  await sql`insert into public.admin_protokoll (wer, email, aktion, ziel, details)
            values (${p.sub}, ${p.email || null}, ${aktion}, ${ziel || ""}, ${sql.json(details || {})})`.catch(() => {});
}
function version(wurzel) {
  try { return (/const VERSION\s*=\s*"([^"]+)"/.exec(readFileSync(join(wurzel, "sw.js"), "utf8")) || [])[1] || ""; } catch (e) { return ""; }
}

/* Tabellen für die Sicherung: alles aus public ausser Zählern, die sich selbst wieder füllen */
const OHNE = new Set(["bremse_log", "ep_migrationen"]);
const KONTO_SPALTEN = "id, email, email_confirmed_at, raw_user_meta_data, raw_app_meta_data, created_at, updated_at, last_sign_in_at, banned_until";

export async function adminAnfrage(req, res, pfad, wurzel) {
  const p = await istAdmin(req);
  if (!p) return res.json(403, { code: "42501", message: "nur fuer Admins" });

  if (pfad === "status" && req.method === "GET") {
    const db = { ok: false };
    try {
      const [r] = await sql`select version() as v, pg_database_size(current_database()) as groesse, now() as zeit,
        (select count(*) from pg_stat_activity where datname = current_database())::int as verbindungen`;
      db.ok = true; db.version = String(r.v).split(" on ")[0]; db.groesse = Number(r.groesse); db.zeit = r.zeit; db.verbindungen = r.verbindungen;
      db.migrationen = await sql`select datei, zeit from public.ep_migrationen order by datei`;
      db.tabellen = await sql`select c.relname as name, c.reltuples::bigint as zeilen, pg_total_relation_size(c.oid) as groesse
        from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname in ('public', 'auth') and c.relkind = 'r'
        order by pg_total_relation_size(c.oid) desc limit 30`;
    } catch (e) { db.fehler = e.message; }
    const sperren = anmeldeSperren();
    return res.json(200, {
      version: version(wurzel), start: START, laufzeit_s: Math.round(process.uptime()), node: process.version,
      speicher_mb: Math.round(process.memoryUsage().rss / 1048576), umgebung: E.NODE_ENV || "", public_url: E.PUBLIC_URL || "",
      site_urls: String(E.SITE_URLS || "").split(",").map(x => x.trim()).filter(Boolean),
      mail: { an: mailAn(), absender: E.MAIL_FROM || "", host: E.SMTP_HOST || "", port: +E.SMTP_PORT || (E.SMTP_HOST ? 587 : null), test: !!E.MAIL_TEST_DATEI },
      anbieter: { email: true, google: !!(E.GOOGLE_CLIENT_ID && E.GOOGLE_CLIENT_SECRET), apple: !!(E.APPLE_CLIENT_ID && E.APPLE_TEAM_ID && E.APPLE_KEY_ID && E.APPLE_PRIVATE_KEY) },
      registrierung: E.SIGNUP !== "0", admin_email: !!E.ADMIN_EMAIL, trust_proxy: E.TRUST_PROXY !== "0",
      sperren, db,
    });
  }

  if (pfad === "testmail" && req.method === "POST") {
    if (!mailAn()) return res.json(400, { code: "mail", message: "Mailversand ist nicht eingerichtet (SMTP_HOST und MAIL_FROM fehlen)." });
    if (!p.email) return res.json(400, { code: "mail", message: "Dein Konto hat keine E-Mail-Adresse." });
    try {
      await mailSenden(p.email, "easyplay: Testmail aus der Verwaltung",
        `Hallo!\n\nDiese Testmail kommt vom easyplay-Server (${E.PUBLIC_URL || "ohne PUBLIC_URL"}).\nWenn du sie liest, funktioniert der Mailversand.\n\nZeit: ${new Date().toLocaleString("de-CH", { timeZone: "Europe/Zurich" })}`);
      await protokoll(p, "testmail", p.email);
      return res.json(200, { ok: true, an: p.email });
    } catch (e) { return res.json(502, { code: "mail", message: "Senden fehlgeschlagen: " + e.message }); }
  }

  if (pfad === "sicherung" && req.method === "GET") {
    const tabellen = (await sql`select table_name as t from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE' order by 1`)
      .map(r => r.t).filter(t => !OHNE.has(t) && /^[a-z_][a-z0-9_]*$/.test(t));
    const name = `easyplay-sicherung-${new Date().toLocaleString("sv-SE", { timeZone: "Europe/Zurich" }).slice(0, 16).replace(/[-: ]/g, "")}.json`;
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${name}"` });
    const schreiben = t => new Promise(ok => res.write(t) ? ok() : res.once("drain", ok));
    await schreiben(`{"easyplay_sicherung":1,"zeit":${JSON.stringify(new Date())},"version":${JSON.stringify(version(wurzel))},`
      + `"hinweis":"Ohne Passwörter und Anmelde-Tokens. Wiederherstellen nur mit Hilfe (ANLEITUNG-SERVER.md).","tabellen":{`);
    const quellen = [["auth.users", `select ${KONTO_SPALTEN} from auth.users`], ["auth.identities", "select provider, provider_id, user_id, email, created_at from auth.identities"],
      ...tabellen.map(t => ["public." + t, `select * from public."${t}"`])];
    let erste = true; const zahlen = {};
    for (const [key, abfrage] of quellen) {
      await schreiben(`${erste ? "" : ","}${JSON.stringify(key)}:[`); erste = false;
      let n = 0;
      try {
        await sql.unsafe(abfrage).cursor(500, async zeilen => {
          await schreiben(zeilen.map(z => (n++ ? "," : "") + JSON.stringify(z)).join(""));
        });
      } catch (e) { /* Tabelle fehlt: leer lassen */ }
      zahlen[key] = n;
      await schreiben("]");
    }
    await schreiben(`},"zeilen":${JSON.stringify(zahlen)}}`);
    res.end();
    await sql`insert into public.einstellungen (schluessel, wert, geaendert, von) values ('letzte_sicherung', ${sql.json({ zeit: new Date(), zeilen: zahlen })}, now(), ${p.email || ""})
              on conflict (schluessel) do update set wert = excluded.wert, geaendert = excluded.geaendert, von = excluded.von`.catch(() => {});
    await protokoll(p, "sicherung", name, { tabellen: Object.keys(zahlen).length });
    return;
  }
  return res.json(404, { code: "404", message: "Nicht gefunden" });
}

/* Protokoll für Admin-Funktionen, die etwas ändern (aufgerufen aus rest.js nach Erfolg) */
const NUR_LESEN = new Set(["admin_benutzer", "admin_benutzer_profil", "admin_fehlermeldungen", "admin_kommentare", "admin_liga_klassen",
  "admin_statistik", "admin_ip_pruefen", "admin_namen", "admin_spiele", "admin_sicherheit", "admin_einstellungen", "admin_protokoll_lesen", "admin_notiz"]);
export function adminAktionMerken(name, person, args) {
  if (!person || !/^admin_/.test(name) || NUR_LESEN.has(name)) return;
  const d = {}; for (const [k, v] of Object.entries(args || {})) d[k] = typeof v === "string" ? v.slice(0, 300) : v;
  const text = JSON.stringify(d); const details = text.length > 3000 ? { gekuerzt: text.slice(0, 2900) } : d;
  const ziel = String(args && (args.p_id ?? args.p_liga ?? args.p_schluessel ?? args.p_woche ?? "") || "").slice(0, 200);
  sql`insert into public.admin_protokoll (wer, email, aktion, ziel, details)
      values (${person.sub}, ${person.email || null}, ${name}, ${ziel}, ${sql.json(details)})`.catch(() => {});
}
