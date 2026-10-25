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

export async function mailSenden(an, betreff, text, html) {
  if (!mailAn()) throw new Error("Mailversand ist nicht eingerichtet (SMTP_HOST, MAIL_FROM)");
  if (E.MAIL_TEST_DATEI) {                       // nur für Tests: Mail in eine Datei statt verschicken
    const { appendFileSync } = await import("node:fs");
    appendFileSync(E.MAIL_TEST_DATEI, JSON.stringify({ an, betreff, text }) + "\n");
    return;
  }
  await holen().sendMail({ from: E.MAIL_FROM, to: an, subject: betreff, text, html });
}
