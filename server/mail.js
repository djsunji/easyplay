// easyplay-Server: Mails über den SMTP-Zugang des eigenen Anbieters (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM).
// Ohne SMTP_HOST verschickt der Server keine Mails: neue Konten gelten dann sofort als bestätigt,
// «Passwort vergessen» geht nicht.
import nodemailer from "nodemailer";

const E = process.env;
let transport = null;
export const mailAn = () => !!(E.SMTP_HOST && E.MAIL_FROM);

function holen() {
  if (transport) return transport;
  const port = +E.SMTP_PORT || 587;
  transport = nodemailer.createTransport({
    host: E.SMTP_HOST, port, secure: port === 465, requireTLS: port !== 465 && port !== 25,
    auth: E.SMTP_USER ? { user: E.SMTP_USER, pass: E.SMTP_PASS || "" } : undefined,
    connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 30000,
  });
  return transport;
}

export const transportHolen = () => holen();

export async function mailSenden(an, betreff, text, html) {
  if (!mailAn()) throw new Error("Mailversand ist nicht eingerichtet (SMTP_HOST, MAIL_FROM)");
  if (E.MAIL_TEST_DATEI) {                       // nur für Tests: Mail in eine Datei statt verschicken
    const { appendFileSync } = await import("node:fs");
    appendFileSync(E.MAIL_TEST_DATEI, JSON.stringify({ an, betreff, text }) + "\n");
    return;
  }
  await holen().sendMail({ from: E.MAIL_FROM, to: an, subject: betreff, text, html });
}

/* Design aller Mails («Bühne»): Lumi, Milo und Logo auf hellem Himmel, darunter weisse Karte.
   Mailtauglich: Tabellen, Inline-Styles, Bild als PNG mit absolutem Link. Auswahl Dejan 02.11.2026. */
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const SCHRIFT = "'Trebuchet MS','Segoe UI',Helvetica,Arial,sans-serif";
export function mailVorlage({ titel, text, knopf, link, klein, fuss }) {
  const basis = (E.PUBLIC_URL || "https://easyplay.ch").replace(/\/$/, "");
  const absaetze = String(text || "").split(/\n{2,}/).map(a => `<p style="font-size:16px;line-height:1.55;margin:0 0 14px;text-align:${knopf ? "center" : "left"}">${esc(a).replace(/\n/g, "<br>")}</p>`).join("");
  const kn = knopf && link ? `<p style="margin:10px 0 0;text-align:center"><a href="${esc(link)}" style="display:inline-block;background:#FF7A1A;color:#ffffff;text-decoration:none;font-weight:bold;font-size:17px;white-space:nowrap;padding:15px 28px;border-radius:30px;box-shadow:0 4px 0 #c95700">${esc(knopf)}</a></p>
<p style="font-size:13px;color:#6b6790;line-height:1.5;margin:22px 0 0;text-align:left">Falls der Knopf nicht geht, kopiere diesen Link in den Browser:<br><a href="${esc(link)}" style="color:#5B4BF5;word-break:break-all">${esc(link)}</a></p>` : "";
  const kl = (Array.isArray(klein) ? klein : klein ? [klein] : []).map(k => `<p style="font-size:13px;color:#6b6790;line-height:1.5;margin:12px 0 0;text-align:left">${esc(k)}</p>`).join("");
  return `<!doctype html><html lang="de-CH"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(titel)}</title></head>
<body style="margin:0;padding:0;background:#f2f7fb;font-family:${SCHRIFT};color:#1d1640">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f7fb"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td align="center" style="background:#d9efff;background-image:linear-gradient(180deg,#bfe4ff,#eaf6ff);border-radius:22px 22px 0 0;padding:22px 16px 0">
<img src="${basis}/img/mail/buehne.png" width="330" alt="easyplay mit Lumi und Milo" style="display:block;width:330px;max-width:100%;height:auto;border:0"></td></tr>
<tr><td align="center" style="background:#ffffff;border-radius:0 0 22px 22px;padding:26px 26px 26px;text-align:center">
<h1 style="font-size:25px;margin:0 0 12px;color:#2B1466;font-family:${SCHRIFT}">${esc(titel)}</h1>${absaetze}${kn}${kl}</td></tr>
<tr><td align="center" style="padding:16px 8px 0;font-size:12px;color:#8a85ad;line-height:1.6;font-family:${SCHRIFT}">${fuss ? esc(fuss) + "<br>" : ""}easyplay · Spiel dich schlau!<br><a href="${basis}" style="color:#8a85ad">${esc(basis.replace(/^https?:\/\//, ""))}</a></td></tr>
</table></td></tr></table></body></html>`;
}
