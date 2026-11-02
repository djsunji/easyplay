// easyplay-Server: Kontaktformular (Seite /kontakt, kontakt.js auf der Website).
// GET  /api/kontakt  -> Liste der Adressen (dieselben wie im Postfach: POST_ADRESSEN, Standard info, sponsor, feedback, schule)
// POST /api/kontakt  -> {an, name, mail, betreff, text, website (Falle für Roboter), dauer (ms seit Öffnen)}
// Die Nachricht geht über Brevo (mail.js) an <an>@<Domain von MAIL_FROM>, Antworten gehen direkt an die angegebene Adresse (Reply-To).
import { mailAn, transportHolen } from "./mail.js";
import { adressen } from "./postfach.js";

const E = process.env;
const domain = () => { const m = /@([a-z0-9.-]+)/i.exec(String(E.MAIL_FROM || "")); return m ? m[1].toLowerCase() : "easyplay.ch"; };
const mailOk = m => /^[^\s@<>()"',;:]{1,64}@[a-z0-9.-]{1,190}\.[a-z]{2,24}$/i.test(m);
const sauber = (s, n) => String(s ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, n);

/* Mengenbremse: pro IP 5 Nachrichten pro Stunde, gesamt 200 pro Tag */
const PRO_IP = new Map(); let tag = "", heute = 0;
function gebremst(ip) {
  const jetzt = Date.now(), d = new Date().toISOString().slice(0, 10);
  if (d !== tag) { tag = d; heute = 0; }
  if (heute >= 200) return true;
  const l = (PRO_IP.get(ip) || []).filter(t => jetzt - t < 3600e3);
  if (l.length >= 5) { PRO_IP.set(ip, l); return true; }
  l.push(jetzt); PRO_IP.set(ip, l); heute++;
  if (PRO_IP.size > 5000) PRO_IP.clear();
  return false;
}

export async function kontaktAnfrage(req, res) {
  if (req.method === "GET") return res.json(200, { an: mailAn(), adressen: adressen(), domain: domain() });
  if (req.method !== "POST") return res.json(405, { message: "Nicht erlaubt" });
  const b = await req.body();
  if (b.website) return res.json(200, { ok: true });                         // Roboter: so tun, als ob
  const an = sauber(b.an, 30).toLowerCase(), name = sauber(b.name, 60), mail = sauber(b.mail, 200).toLowerCase();
  const betreff = sauber(b.betreff, 120), text = sauber(b.text, 4000);
  if (!adressen().includes(an)) return res.json(400, { message: "Bitte wähle, an wen die Nachricht gehen soll." });
  if (name.length < 2) return res.json(400, { message: "Bitte gib deinen Namen ein." });
  if (!mailOk(mail)) return res.json(400, { message: "Bitte gib eine gültige E-Mail-Adresse ein, damit wir antworten können." });
  if (text.length < 10) return res.json(400, { message: "Deine Nachricht ist noch sehr kurz. Schreib bitte etwas mehr." });
  if ((+b.dauer || 0) < 3000) return res.json(400, { message: "Das ging sehr schnell. Bitte versuche es nochmals." });
  if (!mailAn()) return res.json(503, { message: "Der Mailversand ist im Moment nicht eingerichtet. Schreib uns direkt an " + an + "@" + domain() + "." });
  if (gebremst(req.ip || "")) return res.json(429, { message: "Du hast schon mehrere Nachrichten geschickt. Bitte versuche es später nochmals." });
  const ziel = an + "@" + domain();
  const titel = "[Kontaktformular] " + (betreff || "Nachricht von " + name);
  const inhalt = `Von: ${name} <${mail}>\nAn: ${ziel}\nBetreff: ${betreff || "(ohne)"}\n\n${text}\n\n--\nGesendet über das Kontaktformular auf easyplay.ch. Antworten gehen direkt an ${mail}.`;
  try {
    if (E.MAIL_TEST_DATEI) {
      const { appendFileSync } = await import("node:fs");
      appendFileSync(E.MAIL_TEST_DATEI, JSON.stringify({ an: ziel, betreff: titel, text: inhalt, replyTo: mail }) + "\n");
    } else {
      await transportHolen().sendMail({ from: E.MAIL_FROM, to: ziel, replyTo: `${name.replace(/["<>]/g, "")} <${mail}>`, subject: titel, text: inhalt });
    }
  } catch (e) {
    console.error("Kontaktformular:", e.message);
    return res.json(502, { message: "Die Nachricht konnte nicht verschickt werden. Bitte versuche es später nochmals." });
  }
  return res.json(200, { ok: true, an: ziel });
}
