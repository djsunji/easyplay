// easyplay-Server: Postfach in der Verwaltung (/api/admin/post/…), nur für Admins (Prüfung in admin.js).
// Liest das Postfach bei Hostpoint per IMAP (IMAP_USER, IMAP_PASS, optional IMAP_HOST, IMAP_PORT).
// Die Adressen info@, sponsor@, feedback@, schule@, dejan@ und carla@ sind bei Hostpoint Aliase auf dieses eine Postfach;
// die Verwaltung zeigt sie wie Ordner (Filter nach Empfänger). Gesendet wird über den normalen Mailversand (Brevo),
// danach landet eine Kopie im Ordner «Gesendet» des Postfachs.
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import nodemailer from "nodemailer";
import { mailAn, transportHolen } from "./mail.js";

const E = process.env;
export const postAn = () => !!(E.IMAP_USER && E.IMAP_PASS);
const DOMAIN = () => (E.POST_DOMAIN || "easyplay.ch").toLowerCase();
// Adressen, die nur im Postfach erscheinen, nicht als Empfänger im Kontaktformular
export const NUR_POSTFACH = ["dejan", "carla"];
export const kontaktAdressen = () => adressen().filter(a => !NUR_POSTFACH.includes(a));
export const adressen = () => (E.POST_ADRESSEN || "info,sponsor,feedback,schule,dejan,carla").split(",").map(x => x.trim().toLowerCase()).filter(x => /^[a-z0-9._-]+$/.test(x));
const voll = a => `${a}@${DOMAIN()}`;
const PRO_SEITE = 40;

function verbindung() {
  const port = +E.IMAP_PORT || 993;
  return new ImapFlow({
    host: E.IMAP_HOST || "imap.mail.hostpoint.ch", port, secure: port === 993,
    auth: { user: E.IMAP_USER, pass: E.IMAP_PASS }, logger: false,
    connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 60000, disableAutoIdle: true,
  });
}
async function mitPostfach(fn) {
  const c = verbindung();
  await c.connect();
  try { return await fn(c); } finally { await c.logout().catch(() => {}); }
}
async function imOrdner(c, pfad, fn) {
  const lock = await c.getMailboxLock(pfad);
  try { return await fn(); } finally { lock.release(); }
}

/* Ordner mit Rolle: eingang, gesendet, entwuerfe, spam, papierkorb, archiv, sonst null */
const ROLLE = { "\\Sent": "gesendet", "\\Drafts": "entwuerfe", "\\Junk": "spam", "\\Trash": "papierkorb", "\\Archive": "archiv" };
const NAMEN = [[/^(sent|sent items|sent messages|gesendet|gesendete (objekte|elemente))$/i, "gesendet"], [/^(trash|deleted|deleted items|papierkorb|gelöschte (objekte|elemente))$/i, "papierkorb"],
  [/^(junk|spam|junk e-?mail)$/i, "spam"], [/^(drafts|entwürfe)$/i, "entwuerfe"], [/^(archive|archiv)$/i, "archiv"]];
async function ordnerListe(c) {
  const l = await c.list();
  const r = l.filter(o => !(o.flags && o.flags.has("\\Noselect"))).map(o => {
    let rolle = o.path.toUpperCase() === "INBOX" ? "eingang" : ROLLE[o.specialUse] || null;
    if (!rolle) { const n = (o.name || "").trim(); for (const [re, ro] of NAMEN) if (re.test(n)) rolle = ro; }
    return { pfad: o.path, name: o.name, rolle };
  });
  const gesehen = new Set();   // jede Rolle nur einmal (die erste)
  for (const o of r) { if (o.rolle && gesehen.has(o.rolle)) o.rolle = null; else if (o.rolle) gesehen.add(o.rolle); }
  return r;
}
async function rollenPfad(c, rolle, anlegen) {
  const o = (await ordnerListe(c)).find(x => x.rolle === rolle);
  if (o) return o.pfad;
  if (!anlegen) return null;
  const name = { gesendet: "Sent", papierkorb: "Trash", spam: "Junk", archiv: "Archive" }[rolle];
  const r = await c.mailboxCreate(name).catch(async () => c.mailboxCreate("INBOX." + name));
  return r.path;
}

const adr = l => (l && l.value ? l.value : (l || [])).map(a => ({ name: a.name || "", mail: (a.address || "").toLowerCase() })).filter(a => a.mail || a.name);
const envAdr = l => (l || []).map(a => ({ name: a.name || "", mail: (a.address || "").toLowerCase() }));
function aliasVon(liste) {   // an welche unserer Adressen ging die Mail?
  const d = "@" + DOMAIN();
  for (const a of liste) if (a.mail.endsWith(d)) { const n = a.mail.slice(0, -d.length); if (adressen().includes(n)) return n; }
  return "";
}
function hatAnhang(s) { if (!s) return false; if (s.disposition === "attachment") return true; return (s.childNodes || []).some(hatAnhang); }

/* Suche: Empfänger-Adresse (im Ordner Gesendet: Absender) und freie Suche */
async function suchen(c, alias, suche, gesendet) {
  // imapflow kennt nur ein «or» pro Ebene: Empfänger-Filter und freie Suche nacheinander anwenden und schneiden
  const s = String(suche || "").slice(0, 100);
  let uids = null;
  if (alias) {
    const a = voll(alias);
    uids = await c.search(gesendet ? { from: a } : { or: [{ to: a }, { cc: a }] }, { uid: true });
  }
  if (s) {
    const t = await c.search({ or: [{ subject: s }, { from: s }, { to: s }, { body: s }] }, { uid: true });
    uids = uids ? uids.filter(x => t.includes(x)) : t;
  }
  if (!uids) uids = await c.search({ all: true }, { uid: true });
  return (uids || []).sort((a, b) => a - b);
}

async function liste(q) {
  return mitPostfach(async c => {
    const ordner = await ordnerListe(c);
    const pfad = ordner.some(o => o.pfad === q.ordner) ? q.ordner : "INBOX";
    const gesendet = (ordner.find(o => o.pfad === pfad) || {}).rolle === "gesendet";
    const alias = adressen().includes(q.an) ? q.an : "";
    return imOrdner(c, pfad, async () => {
      const uids = await suchen(c, alias, q.suche, gesendet);
      const seite = Math.max(1, +q.seite || 1), ende = uids.length - (seite - 1) * PRO_SEITE, auswahl = uids.slice(Math.max(0, ende - PRO_SEITE), Math.max(0, ende));
      const mails = [];
      if (auswahl.length) for await (const m of c.fetch(auswahl.join(","), { uid: true, envelope: true, flags: true, bodyStructure: true, internalDate: true, size: true }, { uid: true })) {
        const an = envAdr(m.envelope.to).concat(envAdr(m.envelope.cc));
        mails.push({ uid: m.uid, betreff: m.envelope.subject || "", von: envAdr(m.envelope.from)[0] || null, an, alias: gesendet ? aliasVon(envAdr(m.envelope.from)) : aliasVon(an),
          datum: m.envelope.date || m.internalDate, gelesen: m.flags.has("\\Seen"), stern: m.flags.has("\\Flagged"), beantwortet: m.flags.has("\\Answered"),
          anhang: hatAnhang(m.bodyStructure), groesse: m.size });
      }
      mails.sort((a, b) => b.uid - a.uid);
      return { ordner: pfad, gesamt: uids.length, seite, seiten: Math.max(1, Math.ceil(uids.length / PRO_SEITE)), mails };
    });
  });
}

async function zaehler() {
  return mitPostfach(async c => {
    const ordner = await ordnerListe(c);
    const r = { ordner, ungelesen: {}, adressen: adressen().map(voll) };
    await imOrdner(c, "INBOX", async () => {
      const neu = await c.search({ seen: false }, { uid: true }) || [];
      r.ungelesen[""] = neu.length;
      for (const a of adressen()) {
        const t = neu.length ? await c.search({ seen: false, or: [{ to: voll(a) }, { cc: voll(a) }] }, { uid: true }) || [] : [];
        r.ungelesen[a] = t.length;
      }
    });
    const spam = ordner.find(o => o.rolle === "spam");
    if (spam) { const s = await c.status(spam.pfad, { unseen: true }).catch(() => null); if (s) r.spamUngelesen = s.unseen; }
    return r;
  });
}

/* Bilder im Text (cid:) als data:-Adressen einsetzen, damit sie ohne weitere Anfrage erscheinen */
function cidEinsetzen(html, anh) {
  for (const a of anh) if (a.cid && a.content && a.size < 3e6) html = html.split("cid:" + a.cid).join(`data:${a.contentType};base64,${a.content.toString("base64")}`);
  return html;
}
async function lesen(q) {
  const uid = +q.uid; if (!uid) throw Object.assign(new Error("uid fehlt"), { status: 400 });
  return mitPostfach(async c => imOrdner(c, q.ordner || "INBOX", async () => {
    const m = await c.fetchOne(String(uid), { uid: true, source: true, flags: true }, { uid: true });
    if (!m || !m.source) throw Object.assign(new Error("Mail nicht gefunden"), { status: 404 });
    const p = await simpleParser(m.source, { skipImageLinks: true });
    if (!m.flags.has("\\Seen")) await c.messageFlagsAdd(String(uid), ["\\Seen"], { uid: true }).catch(() => {});
    const anh = p.attachments || [];
    const an = adr(p.to), cc = adr(p.cc);
    return { uid, betreff: p.subject || "", von: adr(p.from)[0] || null, an, cc, antwortAn: adr(p.replyTo), datum: p.date || null,
      alias: aliasVon(an.concat(cc)) || aliasVon(adr(p.from)), messageId: p.messageId || "", referenzen: [].concat(p.references || []),
      text: p.text || "", html: p.html ? cidEinsetzen(p.html, anh) : "", stern: m.flags.has("\\Flagged"),
      anhaenge: anh.map((a, nr) => ({ nr, name: a.filename || `Anhang ${nr + 1}`, typ: a.contentType, groesse: a.size, inline: !!a.cid && a.contentDisposition === "inline" })) };
  }));
}
async function anhang(q, res) {
  const uid = +q.uid, nr = +q.nr;
  const a = await mitPostfach(async c => imOrdner(c, q.ordner || "INBOX", async () => {
    const m = await c.fetchOne(String(uid), { uid: true, source: true }, { uid: true });
    if (!m || !m.source) return null;
    return ((await simpleParser(m.source)).attachments || [])[nr] || null;
  }));
  if (!a) return res.json(404, { code: "404", message: "Anhang nicht gefunden" });
  const name = (a.filename || "anhang").replace(/[^\w.\- äöüÄÖÜéèàç]/g, "_");
  res.writeHead(200, { "Content-Type": "application/octet-stream", "Content-Length": a.content.length, "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff", "Content-Disposition": `attachment; filename="${name.replace(/"/g, "")}"; filename*=UTF-8''${encodeURIComponent(a.filename || "anhang")}` });
  res.end(a.content);
}

async function aktion(b) {
  const uids = [].concat(b.uids || []).map(Number).filter(Boolean);
  if (!uids.length) throw Object.assign(new Error("Keine Mail gewählt"), { status: 400 });
  const bereich = uids.join(",");
  return mitPostfach(async c => {
    const ziel = { loeschen: "papierkorb", spam: "spam", archiv: "archiv" }[b.aktion];
    const zielPfad = ziel ? await rollenPfad(c, ziel, true) : b.aktion === "eingang" ? "INBOX" : null;
    return imOrdner(c, b.ordner || "INBOX", async () => {
      const o = { uid: true };
      if (b.aktion === "gelesen") await c.messageFlagsAdd(bereich, ["\\Seen"], o);
      else if (b.aktion === "ungelesen") await c.messageFlagsRemove(bereich, ["\\Seen"], o);
      else if (b.aktion === "stern") await c.messageFlagsAdd(bereich, ["\\Flagged"], o);
      else if (b.aktion === "ohnestern") await c.messageFlagsRemove(bereich, ["\\Flagged"], o);
      else if (b.aktion === "endgueltig") await c.messageDelete(bereich, o);
      else if (zielPfad) { if (zielPfad === (b.ordner || "INBOX")) return { ok: true }; await c.messageMove(bereich, zielPfad, o); }
      else throw Object.assign(new Error("Unbekannte Aktion"), { status: 400 });
      return { ok: true };
    });
  });
}

const MAILRE = /^[^\s@<>,;"]+@[^\s@<>,;"]+\.[a-z]{2,}$/i;
function empfaenger(t) {
  return String(t || "").split(/[,;\n]/).map(x => x.trim()).filter(Boolean).map(x => { const m = /<([^>]+)>/.exec(x); return (m ? m[1] : x).trim(); });
}
async function senden(b, person) {
  if (!mailAn()) throw Object.assign(new Error("Der Mailversand ist nicht eingerichtet (siehe «Technik»)."), { status: 400 });
  const von = String(b.von || "").toLowerCase();
  if (!adressen().includes(von)) throw Object.assign(new Error("Unbekannte Absenderadresse"), { status: 400 });
  const an = empfaenger(b.an), cc = empfaenger(b.cc), bcc = empfaenger(b.bcc);
  const alle = an.concat(cc, bcc);
  if (!an.length) throw Object.assign(new Error("Bitte einen Empfänger angeben."), { status: 400 });
  const falsch = alle.filter(x => !MAILRE.test(x));
  if (falsch.length) throw Object.assign(new Error("Ungültige Adresse: " + falsch.join(", ")), { status: 400 });
  if (alle.length > 30) throw Object.assign(new Error("Höchstens 30 Empfänger pro Mail."), { status: 400 });
  const betreff = String(b.betreff || "").replace(/[\r\n]+/g, " ").trim().slice(0, 200);
  const text = String(b.text || "").slice(0, 100000);
  if (!betreff && !text.trim()) throw Object.assign(new Error("Betreff oder Text fehlt."), { status: 400 });
  const name = String(b.name || E.POST_NAME || "easyplay").replace(/[<>"\r\n]/g, "").slice(0, 60);
  const nachricht = { from: { name, address: voll(von) }, to: an, cc: cc.length ? cc : undefined, bcc: bcc.length ? bcc : undefined, subject: betreff, text, date: new Date() };
  if (b.antwort && b.antwort.messageId) {
    nachricht.inReplyTo = b.antwort.messageId;
    nachricht.references = [].concat(b.antwort.referenzen || [], b.antwort.messageId).slice(-20).join(" ");
  }
  // Rohe Nachricht einmal bauen: dieselbe geht an Brevo und in den Ordner «Gesendet»
  const roh = await new Promise((ok, nok) => nodemailer.createTransport({ streamTransport: true, buffer: true, newline: "windows" })
    .sendMail(nachricht, (e, i) => e ? nok(e) : ok(i.message)));
  if (E.MAIL_TEST_DATEI) { const { appendFileSync } = await import("node:fs"); appendFileSync(E.MAIL_TEST_DATEI, JSON.stringify({ an: an[0], betreff, text, von: voll(von) }) + "\n"); }
  else await transportHolen().sendMail({ envelope: { from: voll(von), to: alle }, raw: roh });
  let kopie = true;
  if (postAn()) await mitPostfach(async c => {
    const gesendet = await rollenPfad(c, "gesendet", true);
    await c.append(gesendet, roh, ["\\Seen"]);
    if (b.antwort && b.antwort.uid) await imOrdner(c, b.antwort.ordner || "INBOX", () => c.messageFlagsAdd(String(+b.antwort.uid), ["\\Answered"], { uid: true })).catch(() => {});
  }).catch(() => { kopie = false; });
  return { ok: true, an: alle.length, kopie };
}

export async function postAnfrage(req, res, pfad, person, protokoll) {
  if (pfad === "status") return res.json(200, { an: postAn(), mail: mailAn(), adressen: adressen().map(voll), host: E.IMAP_HOST || "imap.mail.hostpoint.ch", benutzer: E.IMAP_USER || "" });
  if (!postAn()) return res.json(400, { code: "post", message: "Das Postfach ist nicht eingerichtet (IMAP_USER und IMAP_PASS bei Deploio fehlen)." });
  try {
    if (pfad === "zaehler" && req.method === "GET") return res.json(200, await zaehler());
    if (pfad === "liste" && req.method === "GET") return res.json(200, await liste(req.query));
    if (pfad === "mail" && req.method === "GET") return res.json(200, await lesen(req.query));
    if (pfad === "anhang" && req.method === "GET") return await anhang(req.query, res);
    if (pfad === "aktion" && req.method === "POST") { const b = await req.body(); const r = await aktion(b);
      if (b.aktion === "endgueltig") await protokoll(person, "post_loeschen", b.ordner || "INBOX", { anzahl: [].concat(b.uids || []).length });
      return res.json(200, r); }
    if (pfad === "senden" && req.method === "POST") { const b = await req.body(); const r = await senden(b, person);
      await protokoll(person, "post_senden", empfaenger(b.an).join(", ").slice(0, 200), { von: voll(String(b.von || "")), betreff: String(b.betreff || "").slice(0, 200) });
      return res.json(200, r); }
    return res.json(404, { code: "404", message: "Nicht gefunden" });
  } catch (e) {
    const auth = e.authenticationFailed || /AUTHENTICATIONFAILED|Invalid credentials|LOGIN failed/i.test(e.responseText || e.message || "");
    return res.json(e.status || (auth ? 401 : 502), { code: "post", message: auth ? "Anmeldung am Postfach fehlgeschlagen. Bitte IMAP_USER und IMAP_PASS bei Deploio prüfen." : e.status ? e.message : "Postfach: " + (e.responseText || e.message) });
  }
}
