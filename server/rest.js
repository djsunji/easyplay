// easyplay-Server: Daten unter /rest/v1 (gleiche Adressen und Antworten wie Supabase/PostgREST, soweit easyplay sie nutzt).
//  /rest/v1/rpc/<funktion>  ruft eine SQL-Funktion aus supabase/*.sql auf. Erlaubt ist nur, was dort per
//                           «grant execute ... to anon/authenticated» freigegeben ist.
//  /rest/v1/<tabelle>       Lesen und Schreiben für die wenigen Tabellen, die die Website direkt nutzt.
//                           Die Regeln unten entsprechen den «create policy»-Regeln in supabase/*.sql.
import { sql, alsPerson, FREIGABE } from "./db.js";
import { adminAktionMerken } from "./admin.js";

const NAME = /^[a-z_][a-z0-9_]{0,62}$/;
const LEHRER = "{t}.lehrer = auth.uid() and public.ist_lehrer()";
const KLASSE_EIGEN = "exists (select 1 from public.lehrer_klassen k where k.id = {t}.klasse_id and k.lehrer = auth.uid())";

/* Regeln je Tabelle. lesen/aendern/loeschen: Bedingung für bestehende Zeilen ({t} = Tabelle).
   neu: Prüfung neuer Zeilen; setzen: Werte, die der Server erzwingt; spalten: erlaubte Spalten (wie die
   Spaltenrechte «grant select (…)» in supabase/*.sql); pruefen: Bedingung für geänderte Zeilen. */
const REGELN = {
  fragen:          { lesen: { anon: true, wo: "{t}.status = 'ok'" } },
  likes:           { lesen: { anon: true, wo: "true" } },
  kommentare:      { lesen: { anon: true, wo: "{t}.gemeldet < 3", spalten: ["id", "qeel", "name", "avatar", "text", "gemeldet", "erstellt"] },
                     neu: { wo: "{t}.gemeldet = 0 and {t}.wer = auth.uid()", spalten: ["qeel", "name", "avatar", "text"], setzen: { gemeldet: 0, wer: "uid" } },
                     loeschen: { wo: "{t}.wer = auth.uid()" } },
  lehrer_klassen:  { lesen: { wo: LEHRER }, neu: { wo: LEHRER, setzen: { lehrer: "uid" } }, aendern: { wo: LEHRER }, loeschen: { wo: LEHRER } },
  lehrer_schueler: { lesen: { wo: LEHRER }, neu: { wo: `${LEHRER} and ${KLASSE_EIGEN}`, setzen: { lehrer: "uid" } }, aendern: { wo: LEHRER, pruefen: `${LEHRER} and ${KLASSE_EIGEN}` }, loeschen: { wo: LEHRER } },
  lehrer_tests:    { lesen: { wo: LEHRER }, neu: { wo: `${LEHRER} and ${KLASSE_EIGEN}`, setzen: { lehrer: "uid" } }, aendern: { wo: LEHRER, pruefen: `${LEHRER} and ${KLASSE_EIGEN}` }, loeschen: { wo: LEHRER } },
  lehrer_abgaben:  { lesen: { wo: LEHRER }, aendern: { wo: LEHRER, spalten: ["korrektur", "punkte", "max", "note"] }, loeschen: { wo: LEHRER } },
  liga_klassen:    { lesen: { wo: LEHRER } },
};

/* ---------- Aufbau der Tabellen und Funktionen (aus der Datenbank, zwischengespeichert) ---------- */
const TAB = new Map(), FN = new Map();
async function tabelle(name) {
  if (TAB.has(name)) return TAB.get(name);
  const spalten = await sql`select a.attname as n, format_type(a.atttypid, a.atttypmod) as typ
    from pg_attribute a where a.attrelid = ${"public." + name}::regclass and a.attnum > 0 and not a.attisdropped order by a.attnum`;
  const pk = await sql`select a.attname as n from pg_index i join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any(i.indkey)
    where i.indrelid = ${"public." + name}::regclass and i.indisprimary`;
  const t = { spalten: new Map(spalten.map(s => [s.n, s.typ])), pk: pk.map(p => p.n) };
  TAB.set(name, t); return t;
}
async function funktion(name) {
  if (FN.has(name)) return FN.get(name);
  const zeilen = await sql`select p.oid::int as oid, p.proretset as menge, format_type(p.prorettype, null) as rueck,
      coalesce(p.proargnames, '{}') as namen, coalesce(p.proargmodes::text[], '{}') as arten, p.pronargdefaults as mitstandard,
      array(select format_type(t, null) from unnest(p.proallargtypes) t) as alletypen,
      array(select format_type(t, null) from unnest(p.proargtypes::oid[]) t) as typen
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = ${name}`;
  const varianten = zeilen.map(z => {
    const ein = [];                                                // nur Eingaben (ohne OUT)
    const alle = z.alletypen.length ? z.alletypen : z.typen;
    z.namen.forEach((n, i) => { const art = z.arten[i] || "i"; if (art === "i" || art === "b" || art === "v") ein.push({ n, typ: alle[i] }); });
    if (!z.namen.length) z.typen.forEach((typ, i) => ein.push({ n: "$" + i, typ }));
    return { menge: z.menge, rueck: z.rueck, ein, pflicht: ein.length - z.mitstandard };
  });
  FN.set(name, varianten); return varianten;
}

/* ---------- Antworten wie PostgREST ---------- */
function pgFehler(res, e, person) {
  const code = e.code || "PGRST000";
  let status = 400;
  if (code === "42501") status = person ? 403 : 401;
  else if (code === "23505" || code === "23503") status = 409;
  else if (code === "42883" || code === "PGRST202") status = 404;
  else if (code === "57014") status = 504;
  else if (/^(08|53|57P)/.test(code)) status = 503;
  else if (code === "XX000" || code === "XX001") status = 500;
  if (status >= 500) console.error("DB:", e.message);
  return res.json(status, { code, message: e.message, details: e.detail || null, hint: e.hint || null });
}
const fehlerAus = (code, message) => Object.assign(new Error(message), { code });

/* ---------- RPC ---------- */
function wertSql(v, typ, params) {
  if (v === null || v === undefined) return `null::${typ}`;
  if (/\[\]$/.test(typ)) { params.push(JSON.stringify(Array.isArray(v) ? v : [v])); return `(select array_agg(x::${typ.slice(0, -2)}) from jsonb_array_elements_text($${params.length}::text::jsonb) x)`; }
  if (typ === "jsonb" || typ === "json") { params.push(JSON.stringify(v)); return `$${params.length}::text::${typ}`; }
  params.push(typeof v === "object" ? JSON.stringify(v) : String(v));
  return `$${params.length}::text::${typ}`;
}
export async function rpcAnfrage(req, res, name, person) {
  if (!NAME.test(name)) return res.json(404, { code: "PGRST202", message: "Funktion nicht gefunden" });
  const frei = FREIGABE.fn.get(name);
  if (!frei || !(person ? frei.auth : frei.anon)) {
    if (frei && frei.auth && !person) return res.json(401, { code: "42501", message: `permission denied for function ${name}` });
    return res.json(404, { code: "PGRST202", message: `Could not find the function public.${name}` });
  }
  let args = req.method === "GET" ? Object.fromEntries(Object.entries(req.query)) : await req.body();
  if (!args || typeof args !== "object" || Array.isArray(args)) args = {};
  const varianten = await funktion(name);
  const gegeben = Object.keys(args);
  const passend = varianten
    .filter(v => gegeben.every(g => v.ein.some(a => a.n === g)) && v.ein.slice(0, v.pflicht).every(a => gegeben.includes(a.n)))
    .sort((a, b) => a.ein.length - b.ein.length);
  const v = passend.find(x => x.ein.length === gegeben.length) || passend[0];
  if (!v) return res.json(404, { code: "PGRST202", message: `Could not find the function public.${name}(${gegeben.join(", ")})` });
  const params = [];
  const teile = v.ein.filter(a => gegeben.includes(a.n)).map(a => `"${a.n}" => ${wertSql(args[a.n], a.typ, params)}`);
  const aufruf = `public."${name}"(${teile.join(", ")})`;
  const abfrage = v.rueck === "void" && !v.menge ? `select ${aufruf} is null as leer`
    : v.menge ? `select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) as r from ${aufruf} t`
    : `select to_jsonb(${aufruf}) as r`;
  try {
    const zeilen = await alsPerson(person, req.ip, tx => tx.unsafe(abfrage, params));
    adminAktionMerken(name, person, args);
    if (v.rueck === "void" && !v.menge) return res.json(200, null);
    return res.json(200, zeilen[0]?.r ?? null);
  } catch (e) { return pgFehler(res, e, person); }
}

/* ---------- Tabellen ---------- */
function auswahl(t, select, erlaubt) {
  const s = String(select || "*").trim();
  if (s === "*") return erlaubt ? erlaubt.map(k => `{t}."${k}"`).join(", ") : "{t}.*";
  return s.split(",").map(x => x.trim()).filter(Boolean).map(teil => {
    const m = /^(?:([a-z_][a-z0-9_]*):)?([a-z_][a-z0-9_]*)$/.exec(teil);
    if (!m || !t.spalten.has(m[2]) || (erlaubt && !erlaubt.includes(m[2]))) throw fehlerAus("PGRST100", `Spalte nicht erlaubt: ${teil}`);
    return `{t}."${m[2]}" as "${m[1] || m[2]}"`;
  }).join(", ");
}
function liste(text) {                       // in.(a,"b c",d)
  const m = /^\((.*)\)$/.exec(text); if (!m) throw fehlerAus("PGRST100", "in.(...) erwartet");
  const out = []; let cur = "", q = false;
  for (const c of m[1]) { if (c === '"') { q = !q; continue; } if (c === "," && !q) { out.push(cur); cur = ""; continue; } cur += c; }
  if (cur !== "" || m[1].endsWith(",")) out.push(cur);
  return out;
}
const OPS = { eq: "=", neq: "<>", gt: ">", gte: ">=", lt: "<", lte: "<=", like: "like", ilike: "ilike" };
const RESERVIERT = new Set(["select", "order", "limit", "offset", "on_conflict", "columns"]);
function filter(t, query, params, erlaubt) {
  const teile = [];
  for (const [k, roh] of Object.entries(query)) {
    if (RESERVIERT.has(k)) continue;
    if (!t.spalten.has(k) || (erlaubt && !erlaubt.includes(k))) throw fehlerAus("PGRST100", `Spalte nicht erlaubt: ${k}`);
    const typ = t.spalten.get(k);
    for (const wert of [].concat(roh)) {
      let w = String(wert), nicht = false;
      if (w.startsWith("not.")) { nicht = true; w = w.slice(4); }
      const i = w.indexOf("."); const op = w.slice(0, i), v = w.slice(i + 1);
      let teil;
      if (op === "in") { params.push(JSON.stringify(liste(v))); teil = `{t}."${k}" = any(select x::${typ} from jsonb_array_elements_text($${params.length}::text::jsonb) x)`; }
      else if (op === "is") { if (!/^(null|true|false)$/.test(v)) throw fehlerAus("PGRST100", "is.null/true/false erwartet"); teil = `{t}."${k}" is ${v}`; }
      else if (OPS[op]) {
        params.push(op === "like" || op === "ilike" ? v.replace(/\*/g, "%") : v);
        teil = op === "like" || op === "ilike" ? `{t}."${k}"::text ${OPS[op]} $${params.length}::text` : `{t}."${k}" ${OPS[op]} $${params.length}::text::${typ}`;
      } else throw fehlerAus("PGRST100", `Filter nicht unterstützt: ${op}`);
      teile.push(nicht ? `not (${teil})` : teil);
    }
  }
  return teile;
}
function reihenfolge(t, order, erlaubt) {
  if (!order) return "";
  return " order by " + String(order).split(",").map(x => {
    const [s, r, n] = x.trim().split(".");
    if (!t.spalten.has(s) || (erlaubt && !erlaubt.includes(s))) throw fehlerAus("PGRST100", `Spalte nicht erlaubt: ${s}`);
    return `{t}."${s}" ${r === "desc" ? "desc" : "asc"}${n === "nullsfirst" ? " nulls first" : n === "nullslast" ? " nulls last" : ""}`;
  }).join(", ");
}
const mitT = (s, alias) => s.replace(/\{t\}/g, alias);
function prefer(req) {
  const p = String(req.headers.prefer || "").toLowerCase();
  return { zeigen: p.includes("return=representation"), mischen: p.includes("resolution=merge-duplicates"), ignorieren: p.includes("resolution=ignore-duplicates") };
}

export async function tabellenAnfrage(req, res, name, person) {
  const r = REGELN[name];
  if (!r) return res.json(404, { code: "42P01", message: `relation "public.${name}" does not exist` });
  const m = req.method;
  const art = m === "GET" || m === "HEAD" ? "lesen" : m === "POST" ? "neu" : m === "PATCH" ? "aendern" : m === "DELETE" ? "loeschen" : null;
  const regel = art && r[art];
  if (!regel) return res.json(405, { code: "PGRST105", message: "Nicht erlaubt" });
  if (!regel.anon && !person) return res.json(401, { code: "42501", message: `permission denied for table ${name}` });
  try {
    const t = await tabelle(name);
    const params = [];
    const q = req.query;

    if (art === "lesen") {
      const limit = Math.min(Math.max(parseInt(q.limit, 10) || 1000, 0), 1000), offset = Math.max(parseInt(q.offset, 10) || 0, 0);
      const wo = [regel.wo, ...filter(t, q, params, regel.spalten)].join(" and ");
      const abfrage = mitT(`select to_jsonb(x) as j from (select ${auswahl(t, q.select, regel.spalten)} from public."${name}" {t} where ${wo}${reihenfolge(t, q.order, regel.spalten)} limit ${limit} offset ${offset}) x`, "z");
      const zeilen = await alsPerson(person, req.ip, tx => tx.unsafe(abfrage, params));
      return res.json(200, zeilen.map(z => z.j));
    }

    if (art === "neu") {
      const b = await req.body();
      const reihen = (Array.isArray(b) ? b : [b]).filter(x => x && typeof x === "object");
      if (!reihen.length || reihen.length > 500) throw fehlerAus("PGRST100", "Keine oder zu viele Zeilen");
      const spalten = new Set();
      for (const z of reihen) {
        for (const k of Object.keys(z)) {
          if (!t.spalten.has(k)) throw fehlerAus("PGRST204", `Could not find the '${k}' column of '${name}'`);
          if (regel.spalten && !regel.spalten.includes(k)) throw fehlerAus("42501", `permission denied for column ${k}`);
          spalten.add(k);
        }
        for (const [k, w] of Object.entries(regel.setzen || {})) if (t.spalten.has(k)) { z[k] = w === "uid" ? person.sub : w; spalten.add(k); }
      }
      const s = [...spalten].map(k => `"${k}"`).join(", ");
      params.push(JSON.stringify(reihen));
      const pr = prefer(req);
      let abfrage = `insert into public."${name}" as z (${s}) select ${s} from jsonb_populate_recordset(null::public."${name}", $1::text::jsonb)`;
      if ((pr.mischen || pr.ignorieren) && t.pk.length) {
        const pk = t.pk.map(k => `"${k}"`).join(", ");
        const neu = [...spalten].filter(k => !t.pk.includes(k));
        const darf = r.aendern ? mitT(r.aendern.wo, "z") : "false";
        abfrage += pr.ignorieren || !neu.length ? ` on conflict (${pk}) do nothing` : ` on conflict (${pk}) do update set ${neu.map(k => `"${k}" = excluded."${k}"`).join(", ")} where ${darf}`;
      }
      abfrage += " returning to_jsonb(z) as j";
      const zeilen = await alsPerson(person, req.ip, async tx => {
        const z = await tx.unsafe(abfrage, params);
        if (z.length) {
          const pk = t.pk[0];
          const ok = await tx.unsafe(mitT(`select bool_and(${regel.wo}) as ok from public."${name}" {t} where {t}."${pk}"::text = any(select jsonb_array_elements_text($1::text::jsonb))`, "z"),
            [JSON.stringify(z.map(x => String(x.j[pk])))]);
          if (!ok[0].ok) throw fehlerAus("42501", `new row violates row-level security policy for table "${name}"`);
        }
        return z;
      });
      return pr.zeigen ? res.json(201, zeilen.map(z => z.j)) : res.leer(201);
    }

    if (art === "aendern") {
      const b = await req.body();
      if (!b || typeof b !== "object" || Array.isArray(b)) throw fehlerAus("PGRST100", "Objekt erwartet");
      const erlaubt = regel.spalten || [...t.spalten.keys()].filter(k => !t.pk.includes(k) && k !== "lehrer" && k !== "wer");
      const keys = Object.keys(b);
      for (const k of keys) if (!erlaubt.includes(k)) throw fehlerAus("42501", `permission denied for column ${k}`);
      if (!keys.length) throw fehlerAus("PGRST100", "Nichts zu ändern");
      const f = filter(t, q, params);
      if (!f.length) throw fehlerAus("21000", "UPDATE requires a WHERE clause");
      params.push(JSON.stringify(b)); const n = params.length;
      const abfrage = mitT(`update public."${name}" {t} set ${keys.map(k => `"${k}" = (jsonb_populate_record(null::public."${name}", $${n}::text::jsonb))."${k}"`).join(", ")}
        where ${[regel.wo, ...f].join(" and ")} returning to_jsonb({t}) as j`, "z");
      const zeilen = await alsPerson(person, req.ip, async tx => {
        const z = await tx.unsafe(abfrage, params);
        if (z.length && regel.pruefen) {          /* geänderte Zeilen müssen die Regel weiter erfüllen (z. B. eigene Klasse) */
          const pk = t.pk[0];
          const ok = await tx.unsafe(mitT(`select bool_and(${regel.pruefen}) as ok from public."${name}" {t} where {t}."${pk}"::text = any(select jsonb_array_elements_text($1::text::jsonb))`, "z"),
            [JSON.stringify(z.map(x => String(x.j[pk])))]);
          if (!ok[0].ok) throw fehlerAus("42501", `new row violates row-level security policy for table "${name}"`);
        }
        return z;
      });
      return prefer(req).zeigen ? res.json(200, zeilen.map(z => z.j)) : res.leer(204);
    }

    if (art === "loeschen") {
      const f = filter(t, q, params);
      if (!f.length) throw fehlerAus("21000", "DELETE requires a WHERE clause");
      const abfrage = mitT(`delete from public."${name}" {t} where ${[regel.wo, ...f].join(" and ")} returning to_jsonb({t}) as j`, "z");
      const zeilen = await alsPerson(person, req.ip, tx => tx.unsafe(abfrage, params));
      return prefer(req).zeigen ? res.json(200, zeilen.map(z => z.j)) : res.leer(204);
    }
  } catch (e) { return pgFehler(res, e, person); }
}
