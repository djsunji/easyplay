// easyplay-Server: Anmeldung unter /auth/v1 (gleiche Adressen und Antworten wie Supabase, soweit easyplay sie nutzt).
// E-Mail und Passwort, Bestätigungsmail, «Passwort vergessen», Google und Apple.
import { randomBytes, scrypt as scryptCb, createHash, createHmac, timingSafeEqual, createPrivateKey, sign as signieren } from "node:crypto";
import { promisify } from "node:util";
import { sql } from "./db.js";
import { mailSenden, mailAn } from "./mail.js";

const scrypt = promisify(scryptCb);
const E = process.env;
const ZUGANG_S = 3600;                                 // Gültigkeit des Zugangs-Tokens (Sekunden)
const SEK = () => Math.floor(Date.now() / 1000);
const sha = s => createHash("sha256").update(String(s)).digest("hex");
const zufall = (n = 32) => randomBytes(n).toString("base64url");
const b64u = x => Buffer.from(typeof x === "string" ? x : JSON.stringify(x)).toString("base64url");

function geheimnis() {
  if (!E.JWT_SECRET || E.JWT_SECRET.length < 32) throw new Error("JWT_SECRET fehlt oder ist kürzer als 32 Zeichen");
  return E.JWT_SECRET;
}
const OEFFENTLICH = () => (E.PUBLIC_URL || "").replace(/\/$/, "");

/* ---------- JWT (HS256) ---------- */
export function jwtSignieren(daten) {
  const kopf = b64u({ alg: "HS256", typ: "JWT" }), inhalt = b64u(daten);
  const sig = createHmac("sha256", geheimnis()).update(kopf + "." + inhalt).digest("base64url");
  return `${kopf}.${inhalt}.${sig}`;
}
export function jwtPruefen(token) {
  const t = String(token || "").split(".");
  if (t.length !== 3) return null;
  const soll = createHmac("sha256", geheimnis()).update(t[0] + "." + t[1]).digest();
  let ist; try { ist = Buffer.from(t[2], "base64url"); } catch (e) { return null; }
  if (ist.length !== soll.length || !timingSafeEqual(ist, soll)) return null;
  let d; try { d = JSON.parse(Buffer.from(t[1], "base64url").toString()); } catch (e) { return null; }
  if (!d || typeof d.exp !== "number" || d.exp < SEK()) return null;
  return d;
}
/* Wer schickt die Anfrage? null = ohne Anmeldung; "abgelaufen" = Token ungültig (Antwort 401) */
export function personAusAnfrage(req) {
  const h = req.headers.authorization || "";
  const t = /^Bearer\s+(.+)$/i.exec(h)?.[1]?.trim();
  if (!t || t.split(".").length !== 3) return null;     // öffentlicher Schlüssel statt Token: wie ohne Anmeldung
  const d = jwtPruefen(t);
  if (!d || d.typ === "zustand" || d.role !== "authenticated") return "abgelaufen";
  return { sub: d.sub, email: d.email, sid: d.session_id };
}

/* ---------- Passwörter (scrypt) ---------- */
async function pwHash(pw) {
  const salz = randomBytes(16);
  const h = await scrypt(String(pw), salz, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt$16384$8$1$${salz.toString("base64")}$${h.toString("base64")}`;
}
async function pwPruefen(pw, gespeichert) {
  const t = String(gespeichert || "").split("$");
  if (t[0] !== "scrypt" || t.length !== 6) { await pwHash("x"); return false; }   // gleich lange Antwortzeit
  const soll = Buffer.from(t[5], "base64");
  const ist = await scrypt(String(pw), Buffer.from(t[4], "base64"), soll.length, { N: +t[1], r: +t[2], p: +t[3], maxmem: 64 * 1024 * 1024 });
  return timingSafeEqual(ist, soll);
}

/* ---------- Bremse gegen Durchprobieren ---------- */
const VERSUCHE = new Map();
/* Gesperrte Versuche merken (nur im Speicher, für die Verwaltung): Art und Zeit, ohne IP oder Mailadresse */
const SPERREN = [];
function sperreMerken(schluessel) {
  SPERREN.push({ art: String(schluessel).split(":")[0], zeit: Date.now() });
  if (SPERREN.length > 2000) SPERREN.splice(0, SPERREN.length - 2000);
}
export function anmeldeSperren() {
  const seit = Date.now() - 864e5, z = {};
  for (const s of SPERREN) if (s.zeit > seit) z[s.art] = (z[s.art] || 0) + 1;
  return { letzte_24h: z, zuletzt: SPERREN.length ? new Date(SPERREN[SPERREN.length - 1].zeit) : null };
}
function bremse(schluessel, max, fensterS) {
  max *= +E.BREMSE_FAKTOR || 1;                        // nur für Tests höher setzen
  const jetzt = Date.now(); const v = (VERSUCHE.get(schluessel) || []).filter(t => jetzt - t < fensterS * 1000);
  if (v.length >= max) { VERSUCHE.set(schluessel, v); sperreMerken(schluessel); return false; }
  v.push(jetzt); VERSUCHE.set(schluessel, v);
  if (VERSUCHE.size > 50000) for (const [k, w] of VERSUCHE) if (!w.length || jetzt - w[w.length - 1] > 3600000) VERSUCHE.delete(k);
  return true;
}

/* ---------- Konten und Sitzungen ---------- */
export function benutzerJson(u) {
  return {
    id: u.id, aud: "authenticated", role: "authenticated", email: u.email,
    email_confirmed_at: u.email_confirmed_at, confirmed_at: u.email_confirmed_at,
    last_sign_in_at: u.last_sign_in_at, created_at: u.created_at, updated_at: u.updated_at,
    app_metadata: u.raw_app_meta_data || {}, user_metadata: u.raw_user_meta_data || {},
    identities: [],
  };
}
async function sitzungErstellen(u, req, sitzungId) {
  if (!sitzungId) {
    const [s] = await sql`insert into auth.sessions (user_id, user_agent, ip) values (${u.id}, ${String(req.headers["user-agent"] || "").slice(0, 300)}, ${req.ip || ""}) returning id`;
    sitzungId = s.id;
    await sql`update auth.users set last_sign_in_at = now() where id = ${u.id}`;
  } else await sql`update auth.sessions set updated_at = now() where id = ${sitzungId}`;
  const refresh = zufall(32);
  await sql`insert into auth.refresh_tokens (token, user_id, session_id) values (${sha(refresh)}, ${String(u.id)}, ${sitzungId})`;
  const jetzt = SEK();
  const access = jwtSignieren({
    sub: u.id, aud: "authenticated", role: "authenticated", email: u.email, session_id: sitzungId,
    iat: jetzt, exp: jetzt + ZUGANG_S, app_metadata: u.raw_app_meta_data || {},
  });
  return { access_token: access, token_type: "bearer", expires_in: ZUGANG_S, expires_at: jetzt + ZUGANG_S, refresh_token: refresh, user: benutzerJson(u) };
}
const gesperrt = u => u.banned_until && new Date(u.banned_until) > new Date();

/* ---------- Weiterleitungen nur zu eigenen Seiten ---------- */
function erlaubteZiele() {
  return [OEFFENTLICH(), ...String(E.SITE_URLS || "").split(",")].map(x => x.trim().replace(/\/$/, "")).filter(Boolean);
}
export function zielPruefen(url) {
  const erlaubt = erlaubteZiele();
  try {
    const u = new URL(String(url || ""));
    if (erlaubt.some(e => { const o = new URL(e); return o.origin === u.origin && u.pathname.startsWith(o.pathname); })) return u.origin + u.pathname + u.search;
  } catch (e) {}
  return (erlaubt[0] || "/") + "/";
}
function mitSitzung(ziel, s, typ) {
  const h = new URLSearchParams({ access_token: s.access_token, refresh_token: s.refresh_token, expires_in: String(s.expires_in), expires_at: String(s.expires_at), token_type: "bearer", type: typ });
  return ziel + "#" + h.toString();
}
function mitFehler(ziel, code, text) {
  return ziel + "#" + new URLSearchParams({ error: code, error_description: text }).toString();
}

/* ---------- Mails ---------- */
function mailHtml(titel, text, knopf, link) {
  const e = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  return `<!doctype html><html lang="de-CH"><body style="margin:0;background:#f3f0ff;font-family:Arial,Helvetica,sans-serif;color:#1d1640">
<div style="max-width:520px;margin:0 auto;padding:28px 18px"><div style="background:#fff;border-radius:18px;padding:26px 24px">
<h1 style="font-size:22px;margin:0 0 12px;color:#2B1466">${e(titel)}</h1><p style="font-size:16px;line-height:1.5;margin:0 0 20px">${e(text)}</p>
<p style="margin:0 0 22px"><a href="${e(link)}" style="display:inline-block;background:#5B4BF5;color:#fff;text-decoration:none;font-weight:bold;padding:13px 22px;border-radius:12px">${e(knopf)}</a></p>
<p style="font-size:13px;color:#6b6790;line-height:1.5;margin:0">Falls der Knopf nicht geht, kopiere diesen Link in den Browser:<br>${e(link)}</p>
<p style="font-size:13px;color:#6b6790;line-height:1.5;margin:16px 0 0">Du hast das nicht angefordert? Dann kannst du diese Mail einfach löschen.</p>
</div><p style="font-size:12px;color:#8a85ad;text-align:center;margin:14px 0 0">easyplay, spielend lernen</p></div></body></html>`;
}
async function bestaetigungSenden(u, ziel) {
  const code = zufall(32);
  await sql`update auth.users set confirmation_token = ${sha(code)}, confirmation_sent_at = now() where id = ${u.id}`;
  const link = `${OEFFENTLICH()}/auth/v1/verify?type=signup&token=${code}&redirect_to=${encodeURIComponent(ziel)}`;
  await mailSenden(u.email, "easyplay: Bitte bestätige deine E-Mail-Adresse",
    `Hallo! Bitte bestätige deine E-Mail-Adresse für easyplay:\n\n${link}\n\nDer Link gilt 24 Stunden.`,
    mailHtml("Willkommen bei easyplay!", "Bitte bestätige deine E-Mail-Adresse. Danach kannst du dich anmelden. Der Link gilt 24 Stunden.", "E-Mail bestätigen", link));
}
async function wiederherstellungSenden(u, ziel) {
  const code = zufall(32);
  await sql`update auth.users set recovery_token = ${sha(code)}, recovery_sent_at = now() where id = ${u.id}`;
  const link = `${OEFFENTLICH()}/auth/v1/verify?type=recovery&token=${code}&redirect_to=${encodeURIComponent(ziel)}`;
  await mailSenden(u.email, "easyplay: Neues Passwort",
    `Hallo! Mit diesem Link kannst du ein neues Passwort für easyplay setzen:\n\n${link}\n\nDer Link gilt 1 Stunde.`,
    mailHtml("Neues Passwort", "Tippe auf den Knopf und wähle ein neues Passwort. Der Link gilt 1 Stunde.", "Neues Passwort setzen", link));
}

/* ---------- Seite «Neues Passwort» (vom Server, ohne Website) ---------- */
function passwortSeite(token, ziel, fehler) {
  const e = s => String(s || "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  return `<!doctype html><html lang="de-CH"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Neues Passwort · easyplay</title><style>
body{margin:0;min-height:100vh;display:grid;place-items:center;background:linear-gradient(135deg,#2B1466,#5B4BF5);font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1d1640}
form{background:#fff;border-radius:20px;padding:28px 24px;width:min(380px,calc(100vw - 32px));box-sizing:border-box;box-shadow:0 18px 40px rgba(0,0,0,.25)}
h1{margin:0 0 6px;font-size:24px;color:#2B1466}p{margin:0 0 18px;line-height:1.45}label{display:block;font-weight:600;margin:12px 0 6px}
input{width:100%;box-sizing:border-box;font-size:17px;padding:12px;border:2px solid #d9d4ff;border-radius:12px}
button{margin-top:18px;width:100%;font-size:17px;font-weight:700;padding:13px;border:0;border-radius:12px;background:#5B4BF5;color:#fff}
.f{color:#c0262d;font-weight:600}</style></head><body>
<form method="post" action="${OEFFENTLICH()}/auth/v1/verify"><h1>Neues Passwort</h1><p>Wähle ein neues Passwort für easyplay (mindestens 8 Zeichen).</p>
${fehler ? `<p class="f">${e(fehler)}</p>` : ""}
<input type="hidden" name="type" value="recovery"><input type="hidden" name="token" value="${e(token)}"><input type="hidden" name="redirect_to" value="${e(ziel)}">
<label for="p1">Neues Passwort</label><input id="p1" name="password" type="password" autocomplete="new-password" minlength="8" required>
<label for="p2">Nochmals</label><input id="p2" name="password2" type="password" autocomplete="new-password" minlength="8" required>
<button type="submit">Speichern und anmelden</button></form></body></html>`;
}

/* ---------- Google und Apple ---------- */
const ANBIETER = {
  google: () => E.GOOGLE_CLIENT_ID && E.GOOGLE_CLIENT_SECRET,
  apple: () => E.APPLE_CLIENT_ID && E.APPLE_TEAM_ID && E.APPLE_KEY_ID && E.APPLE_PRIVATE_KEY,
};
function appleGeheimnis() {
  const jetzt = SEK();
  const kopf = b64u({ alg: "ES256", kid: E.APPLE_KEY_ID }), inhalt = b64u({ iss: E.APPLE_TEAM_ID, iat: jetzt, exp: jetzt + 600, aud: "https://appleid.apple.com", sub: E.APPLE_CLIENT_ID });
  const schluessel = createPrivateKey(String(E.APPLE_PRIVATE_KEY).replace(/\\n/g, "\n"));
  const sig = signieren("sha256", Buffer.from(kopf + "." + inhalt), { key: schluessel, dsaEncoding: "ieee-p1363" }).toString("base64url");
  return `${kopf}.${inhalt}.${sig}`;
}
const RUECK = () => `${OEFFENTLICH()}/auth/v1/callback`;
function anmeldenBei(anbieter, ziel) {
  const nonce = zufall(16), pruef = zufall(32);
  const zustand = jwtSignieren({ typ: "zustand", p: anbieter, r: ziel, n: nonce, v: pruef, exp: SEK() + 600 });
  if (anbieter === "google") {
    const q = new URLSearchParams({ client_id: E.GOOGLE_CLIENT_ID, redirect_uri: RUECK(), response_type: "code", scope: "openid email profile", state: zustand, nonce,
      code_challenge: createHash("sha256").update(pruef).digest("base64url"), code_challenge_method: "S256", prompt: "select_account" });
    return (E.GOOGLE_AUTH_URL || "https://accounts.google.com/o/oauth2/v2/auth") + "?" + q;
  }
  const q = new URLSearchParams({ client_id: E.APPLE_CLIENT_ID, redirect_uri: RUECK(), response_type: "code", scope: "name email", response_mode: "form_post", state: zustand, nonce });
  return (E.APPLE_AUTH_URL || "https://appleid.apple.com/auth/authorize") + "?" + q;
}
async function codeEinloesen(anbieter, code, pruef) {
  const body = anbieter === "google"
    ? new URLSearchParams({ code, client_id: E.GOOGLE_CLIENT_ID, client_secret: E.GOOGLE_CLIENT_SECRET, redirect_uri: RUECK(), grant_type: "authorization_code", code_verifier: pruef })
    : new URLSearchParams({ code, client_id: E.APPLE_CLIENT_ID, client_secret: appleGeheimnis(), redirect_uri: RUECK(), grant_type: "authorization_code" });
  const url = anbieter === "google" ? (E.GOOGLE_TOKEN_URL || "https://oauth2.googleapis.com/token") : (E.APPLE_TOKEN_URL || "https://appleid.apple.com/auth/token");
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body, signal: AbortSignal.timeout(15000) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.id_token) throw new Error(j.error_description || j.error || "Anmeldung beim Anbieter fehlgeschlagen");
  /* Das id_token kommt direkt vom Anbieter über TLS (OpenID Connect 3.1.3.7): Inhalt prüfen genügt */
  const d = JSON.parse(Buffer.from(j.id_token.split(".")[1], "base64url").toString());
  const iss = anbieter === "google" ? ["https://accounts.google.com", "accounts.google.com"] : ["https://appleid.apple.com"];
  const aud = anbieter === "google" ? E.GOOGLE_CLIENT_ID : E.APPLE_CLIENT_ID;
  if (!iss.includes(d.iss) || (Array.isArray(d.aud) ? !d.aud.includes(aud) : d.aud !== aud) || d.exp < SEK() - 60) throw new Error("Antwort des Anbieters ungültig");
  return d;
}
async function kontoFuerAnbieter(anbieter, d, nameApple) {
  const sub = String(d.sub), mail = d.email ? String(d.email).toLowerCase() : null;
  const bestaetigt = d.email_verified === true || d.email_verified === "true";
  let [u] = await sql`select u.* from auth.identities i join auth.users u on u.id = i.user_id where i.provider = ${anbieter} and i.provider_id = ${sub}`;
  /* Mit einem bestehenden Konto nur verbinden, wenn dessen E-Mail wirklich bestätigt wurde (per Mail).
     Ohne Mailversand gilt jedes Konto sofort als bestätigt, dann gar nicht verbinden. */
  if (!u && mail && bestaetigt && mailAn()) {
    [u] = await sql`select * from auth.users where lower(email) = ${mail} and email_confirmed_at is not null`;
    if (u) await sql`insert into auth.identities (provider, provider_id, user_id, email) values (${anbieter}, ${sub}, ${u.id}, ${mail}) on conflict do nothing`;
  }
  if (!u && mail) {
    const [schon] = await sql`select id, email_confirmed_at from auth.users where lower(email) = ${mail}`;
    if (schon && schon.email_confirmed_at) throw Object.assign(new Error("Mit dieser E-Mail gibt es schon ein Konto. Melde dich mit E-Mail und Passwort an."), { anzeigen: true });
    if (schon) await sql`delete from auth.users where id = ${schon.id} and email_confirmed_at is null`;   // nie bestätigt: Platz machen
  }
  if (!u && !anmeldungOffen()) throw Object.assign(new Error(GESCHLOSSEN), { anzeigen: true });
  if (!u) {
    const vor = d.given_name || nameApple?.firstName || "", nach = d.family_name || nameApple?.lastName || "";
    const meta = { full_name: d.name || [vor, nach].filter(Boolean).join(" "), given_name: vor, family_name: nach, avatar_url: d.picture || undefined, email: mail };
    const app = { provider: anbieter, providers: [anbieter] };
    [u] = await sql`insert into auth.users (email, email_confirmed_at, raw_user_meta_data, raw_app_meta_data)
                    values (${mail}, ${bestaetigt ? new Date() : null}, ${sql.json(meta)}, ${sql.json(app)}) returning *`;
    await sql`insert into auth.identities (provider, provider_id, user_id, email) values (${anbieter}, ${sub}, ${u.id}, ${mail})`;
  }
  return u;
}

/* Neue Konten nur, wenn Mails bestätigt werden können (sonst könnte jemand fremde Adressen benutzen).
   SIGNUP=0 schliesst immer, SIGNUP=1 öffnet auch ohne Mailversand (nur für Tests). */
const anmeldungOffen = () => E.SIGNUP === "1" || (E.SIGNUP !== "0" && mailAn());
const GESCHLOSSEN = "Die Registrierung ist im Moment geschlossen. Bitte versuche es in ein paar Tagen nochmals.";

/* ---------- Anfragen ---------- */
const fehler = (res, status, code, text) => res.json(status, { code: status, error_code: code, msg: text, error: code, error_description: text });
const mailOk = m => /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(m);

export async function authAnfrage(req, res, pfad) {
  const q = req.query, m = req.method;
  const ip = req.ip || "";

  if (pfad === "/settings" && m === "GET") {
    return res.json(200, { external: { email: true, google: !!ANBIETER.google(), apple: !!ANBIETER.apple(), facebook: false, azure: false },
      disable_signup: !anmeldungOffen(), mailer_autoconfirm: !mailAn() });
  }

  if (pfad === "/signup" && m === "POST") {
    if (!anmeldungOffen()) return fehler(res, 403, "signup_disabled", GESCHLOSSEN);
    if (!bremse("reg:" + ip, 10, 3600)) return fehler(res, 429, "over_request_rate_limit", "Zu viele Versuche. Bitte später nochmals.");
    const b = await req.body();
    const mail = String(b.email || "").trim().toLowerCase(), pw = String(b.password || "");
    if (!mailOk(mail)) return fehler(res, 400, "validation_failed", "Unable to validate email address: invalid format");
    if (pw.length < 8 || pw.length > 200) return fehler(res, 422, "weak_password", "Password should be at least 8 characters.");
    const meta = b.data && typeof b.data === "object" ? b.data : {};
    if (JSON.stringify(meta).length > 32000) return fehler(res, 400, "validation_failed", "Zu viele Profildaten");
    const ziel = zielPruefen(q.redirect_to || b.redirect_to || b.options?.emailRedirectTo);
    const [alt] = await sql`select * from auth.users where lower(email) = ${mail}`;
    if (alt && alt.email_confirmed_at) return fehler(res, 422, "user_already_exists", "User already registered");
    if (!bremse("reg:" + mail, 5, 3600)) return fehler(res, 429, "over_email_send_rate_limit", "Zu viele Versuche. Bitte später nochmals.");
    let u;
    const hash = await pwHash(pw);
    /* Noch nicht bestätigtes Konto: Passwort und Profil gehören zum Link in der neuen Mail und gelten erst,
       wenn genau dieser Link geöffnet wird. So kann niemand ein fremdes, noch offenes Konto übernehmen. */
    if (alt) [u] = await sql`update auth.users set confirmation_pw = ${hash}, confirmation_meta = ${sql.json(meta)}, updated_at = now() where id = ${alt.id} returning *`;
    else [u] = await sql`insert into auth.users (email, encrypted_password, raw_user_meta_data, email_confirmed_at, confirmation_pw, confirmation_meta)
                         values (${mail}, ${mailAn() ? null : hash}, ${sql.json(meta)}, ${mailAn() ? null : new Date()}, ${mailAn() ? hash : null}, ${sql.json(meta)}) returning *`;
    if (mailAn()) {
      try { await bestaetigungSenden(u, ziel); } catch (e) { console.error("Mail:", e.message); return fehler(res, 500, "unexpected_failure", "Error sending confirmation email"); }
      return res.json(200, { user: benutzerJson(u), session: null, ...benutzerJson(u) });
    }
    const s = await sitzungErstellen(u, req);
    return res.json(200, s);
  }

  if (pfad === "/token" && m === "POST") {
    const b = await req.body();
    if (q.grant_type === "password") {
      const mail = String(b.email || "").trim().toLowerCase();
      if (!bremse("login:" + ip, 30, 900) || !bremse("login:" + mail, 10, 900)) return fehler(res, 429, "over_request_rate_limit", "Zu viele Versuche. Bitte in 15 Minuten nochmals.");
      const [u] = await sql`select * from auth.users where lower(email) = ${mail}`;
      const ok = await pwPruefen(String(b.password || ""), u?.encrypted_password || u?.confirmation_pw);
      if (!u || !ok) return fehler(res, 400, "invalid_credentials", "Invalid login credentials");
      if (!u.email_confirmed_at) return fehler(res, 400, "email_not_confirmed", "Email not confirmed");
      if (gesperrt(u)) return fehler(res, 400, "user_banned", "User is banned");
      return res.json(200, await sitzungErstellen(u, req));
    }
    if (q.grant_type === "refresh_token") {
      if (!bremse("refresh:" + ip, 120, 600)) return fehler(res, 429, "over_request_rate_limit", "Zu viele Anfragen");
      const [t] = await sql`select * from auth.refresh_tokens where token = ${sha(b.refresh_token || "")}`;
      if (!t || !t.session_id) return fehler(res, 400, "refresh_token_not_found", "Invalid Refresh Token: Refresh Token Not Found");
      /* Ein schon benutzter Token gilt noch 10 Sekunden (zwei Fenster erneuern gleichzeitig), danach: Sitzung beenden */
      if (t.revoked && Date.now() - new Date(t.updated_at).getTime() > 10000) {
        await sql`delete from auth.sessions where id = ${t.session_id}`;      // alter Token nochmals benutzt: Sitzung beenden
        return fehler(res, 400, "refresh_token_already_used", "Invalid Refresh Token: Already Used");
      }
      const [u] = await sql`select * from auth.users where id = ${t.user_id}::uuid`;
      const [s] = await sql`select id from auth.sessions where id = ${t.session_id} and created_at > now() - interval '180 days'`;
      if (!u || !s || gesperrt(u)) return fehler(res, 400, "session_not_found", "Session not found");
      await sql`update auth.refresh_tokens set revoked = true, updated_at = now() where id = ${t.id} and not revoked`;
      return res.json(200, await sitzungErstellen(u, req, t.session_id));
    }
    return fehler(res, 400, "unsupported_grant_type", "unsupported grant_type");
  }

  if (pfad === "/user") {
    const p = personAusAnfrage(req);
    if (!p || p === "abgelaufen") return fehler(res, 401, "bad_jwt", "invalid JWT");
    if (m === "GET") {
      const [u] = await sql`select * from auth.users where id = ${p.sub}`;
      return u ? res.json(200, benutzerJson(u)) : fehler(res, 404, "user_not_found", "User not found");
    }
    if (m === "PUT") {
      const b = await req.body();
      let [u] = await sql`select * from auth.users where id = ${p.sub}`;
      if (!u) return fehler(res, 404, "user_not_found", "User not found");
      if (b.data && typeof b.data === "object") {
        const neu = { ...(u.raw_user_meta_data || {}), ...b.data };
        if (JSON.stringify(neu).length > 64000) return fehler(res, 400, "validation_failed", "Zu viele Profildaten");
        [u] = await sql`update auth.users set raw_user_meta_data = ${sql.json(neu)}, updated_at = now() where id = ${u.id} returning *`;
      }
      if (b.password) {
        if (String(b.password).length < 8) return fehler(res, 422, "weak_password", "Password should be at least 8 characters.");
        [u] = await sql`update auth.users set encrypted_password = ${await pwHash(b.password)}, updated_at = now() where id = ${u.id} returning *`;
        await sql`delete from auth.sessions where user_id = ${u.id} and id <> ${p.sid || null}`; SITZUNG_OK.clear();
      }
      if (b.email && String(b.email).toLowerCase() !== u.email) return fehler(res, 400, "email_change_not_supported", "E-Mail-Adresse ändern geht nur über die Verwaltung");
      return res.json(200, benutzerJson(u));
    }
  }

  if (pfad === "/logout" && m === "POST") {
    const p = personAusAnfrage(req);
    if (p && p !== "abgelaufen") {
      if (q.scope === "global") { await sql`delete from auth.sessions where user_id = ${p.sub}`; SITZUNG_OK.clear(); }
      else if (p.sid) { await sql`delete from auth.sessions where id = ${p.sid}`; SITZUNG_OK.delete(p.sid); }
    }
    return res.leer(204);
  }

  if (pfad === "/recover" && m === "POST") {
    const b = await req.body();
    const mail = String(b.email || "").trim().toLowerCase();
    if (!bremse("rec:" + ip, 10, 3600) || !bremse("rec:" + mail, 3, 3600)) return fehler(res, 429, "over_email_send_rate_limit", "Zu viele Mails. Bitte später nochmals.");
    if (!mailAn()) return fehler(res, 500, "unexpected_failure", "Mailversand ist nicht eingerichtet");
    const [u] = await sql`select * from auth.users where lower(email) = ${mail}`;
    if (u && u.encrypted_password) {
      try { await wiederherstellungSenden(u, zielPruefen(q.redirect_to || b.redirect_to)); } catch (e) { console.error("Mail:", e.message); return fehler(res, 500, "unexpected_failure", "Error sending recovery email"); }
    }
    return res.json(200, {});                                // nie verraten, ob es das Konto gibt
  }

  if (pfad === "/verify" && m === "GET") {
    const ziel = zielPruefen(q.redirect_to);
    const code = String(q.token || "");
    if (q.type === "signup") {
      const [u] = await sql`select * from auth.users where confirmation_token = ${sha(code)} and confirmation_sent_at > now() - interval '24 hours'`;
      if (!u) return res.weiter(mitFehler(ziel, "access_denied", "Der Bestätigungslink ist ungültig oder abgelaufen."));
      const [v] = await sql`update auth.users set email_confirmed_at = coalesce(email_confirmed_at, now()), confirmation_token = null,
          encrypted_password = coalesce(confirmation_pw, encrypted_password), raw_user_meta_data = coalesce(confirmation_meta, raw_user_meta_data),
          confirmation_pw = null, confirmation_meta = null, updated_at = now() where id = ${u.id} returning *`;
      return res.weiter(mitSitzung(ziel, await sitzungErstellen(v, req), "signup"));
    }
    if (q.type === "recovery") {
      const [u] = await sql`select id from auth.users where recovery_token = ${sha(code)} and recovery_sent_at > now() - interval '1 hour'`;
      if (!u) return res.weiter(mitFehler(ziel, "access_denied", "Der Link ist ungültig oder abgelaufen. Fordere einen neuen an."));
      return res.html(200, passwortSeite(code, ziel));
    }
    return res.weiter(ziel);
  }
  if (pfad === "/verify" && m === "POST") {
    const b = await req.body();
    const ziel = zielPruefen(b.redirect_to);
    if (!bremse("verify:" + ip, 20, 3600)) return res.html(429, passwortSeite(b.token, ziel, "Zu viele Versuche. Bitte später nochmals."));
    const [u] = await sql`select * from auth.users where recovery_token = ${sha(b.token || "")} and recovery_sent_at > now() - interval '1 hour'`;
    if (!u) return res.weiter(mitFehler(ziel, "access_denied", "Der Link ist ungültig oder abgelaufen. Fordere einen neuen an."));
    const pw = String(b.password || "");
    if (pw.length < 8) return res.html(400, passwortSeite(b.token, ziel, "Das Passwort braucht mindestens 8 Zeichen."));
    if (b.password2 !== undefined && pw !== b.password2) return res.html(400, passwortSeite(b.token, ziel, "Die beiden Passwörter sind nicht gleich."));
    const [v] = await sql`update auth.users set encrypted_password = ${await pwHash(pw)}, recovery_token = null, email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now() where id = ${u.id} returning *`;
    await sql`delete from auth.sessions where user_id = ${u.id}`;
    return res.weiter(mitSitzung(ziel, await sitzungErstellen(v, req), "recovery"));
  }

  if (pfad === "/authorize" && m === "GET") {
    const anbieter = String(q.provider || "");
    const ziel = zielPruefen(q.redirect_to);
    if (!ANBIETER[anbieter] || !ANBIETER[anbieter]()) return res.weiter(mitFehler(ziel, "provider_disabled", "Diese Anmeldung ist nicht eingerichtet."));
    if (!bremse("oauth:" + ip, 30, 600)) return res.weiter(mitFehler(ziel, "over_request_rate_limit", "Zu viele Versuche."));
    return res.weiter(anmeldenBei(anbieter, ziel));
  }
  if (pfad === "/callback" && (m === "GET" || m === "POST")) {
    const b = m === "POST" ? await req.body() : {};
    const code = b.code || q.code, st = jwtPruefen(b.state || q.state);
    if (!st || st.typ !== "zustand") return res.weiter(mitFehler(zielPruefen(""), "invalid_request", "Die Anmeldung ist abgelaufen. Bitte nochmals."));
    const ziel = zielPruefen(st.r);
    if (b.error || q.error) return res.weiter(mitFehler(ziel, "access_denied", "Anmeldung abgebrochen."));
    try {
      const d = await codeEinloesen(st.p, String(code || ""), st.v);
      if (d.nonce && d.nonce !== st.n) throw new Error("Antwort des Anbieters ungültig");
      let name = null; try { name = b.user ? JSON.parse(b.user).name : null; } catch (e) {}
      const u = await kontoFuerAnbieter(st.p, d, name);
      if (gesperrt(u)) return res.weiter(mitFehler(ziel, "user_banned", "Dieses Konto ist gesperrt."));
      return res.weiter(mitSitzung(ziel, await sitzungErstellen(u, req), "signin"));
    } catch (e) {
      console.error("OAuth:", e.message);
      return res.weiter(mitFehler(ziel, "server_error", e.anzeigen ? e.message : "Die Anmeldung hat nicht geklappt. Bitte nochmals."));
    }
  }

  return fehler(res, 404, "not_found", "Nicht gefunden");
}

/* Sitzung noch gültig? (abgemeldet, gesperrt, Passwort geändert, gelöscht). Kurz zwischengespeichert. */
const SITZUNG_OK = new Map();
export async function sitzungGueltig(sid) {
  if (!sid) return true;
  const c = SITZUNG_OK.get(sid);
  if (c && Date.now() - c.t < 30000) return c.ok;
  const [s] = await sql`select 1 from auth.sessions s join auth.users u on u.id = s.user_id
                         where s.id = ${sid} and (u.banned_until is null or u.banned_until <= now())`;
  SITZUNG_OK.set(sid, { ok: !!s, t: Date.now() });
  if (SITZUNG_OK.size > 20000) SITZUNG_OK.clear();
  return !!s;
}
