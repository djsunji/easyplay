#!/usr/bin/env python3
"""Baut den Inhalt der App (app/www) aus der Website: alles eingebaut, ausser den Bildern der Bibliothek
(bilder/, kommen bei Bedarf aus dem Internet, siehe app/native.js).
Aufruf aus dem Hauptordner des Repos: python3 app/www-bauen.py
Läuft in den GitHub-Abläufen app-ios.yml und app-android.yml vor «npx cap sync»."""
import os, re, shutil, sys

QUELLE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ZIEL = os.path.join(QUELLE, "app", "www")
WEB = "https://djsunji.github.io"

# Ordner und Dateien, die nicht in die App gehören
ORDNER_WEG = {".git", ".github", "app", "bilder", "admin", "tools", "supabase", "qeels", "node_modules", "server"}
DATEIEN_WEG = {"CLAUDE.md", "README.md", "schema.sql", "sitemap.xml", "robots.txt", "sw.js", "Dockerfile", ".dockerignore"}
ENDUNG_WEG = (".md", ".py", ".sh", ".sql")

def weg(pfad, name, ist_ordner):
    rel = os.path.relpath(os.path.join(pfad, name), QUELLE)
    if ist_ordner: return rel in ORDNER_WEG or name.startswith(".")
    return rel in DATEIEN_WEG or name.endswith(ENDUNG_WEG) or name.startswith(".")

if os.path.isdir(ZIEL): shutil.rmtree(ZIEL)
os.makedirs(ZIEL)
n = groesse = 0
for pfad, ordner, dateien in os.walk(QUELLE):
    ordner[:] = [o for o in ordner if not weg(pfad, o, True)]
    for d in dateien:
        if weg(pfad, d, False): continue
        q = os.path.join(pfad, d); z = os.path.join(ZIEL, os.path.relpath(q, QUELLE))
        os.makedirs(os.path.dirname(z), exist_ok=True); shutil.copy2(q, z)
        n += 1; groesse += os.path.getsize(q)
shutil.copy2(os.path.join(QUELLE, "app", "native.js"), os.path.join(ZIEL, "native.js"))

# index.html: native.js als erstes Skript, Website als erlaubte Verbindung (Bilder, Korrekturen, Werbung)
p = os.path.join(ZIEL, "index.html")
s = open(p, encoding="utf-8").read()
if "<head>" not in s: sys.exit("index.html ohne <head>")
s = s.replace("<head>", '<head>\n<script src="native.js"></script>', 1)
s, k = re.subn(r"(connect-src 'self')", r"\1 " + WEB, s, count=1)
if not k: sys.exit("Content-Security-Policy: connect-src nicht gefunden")
open(p, "w", encoding="utf-8").write(s)

# Schriften von Google Fonts in die App holen (sonst ohne Internet nur Ersatzschrift).
# Läuft auf den Rechnern von GitHub; klappt es nicht, bleibt der Link zu Google.
def schriften_einbauen(html):
    import urllib.request, hashlib
    m = re.search(r'href="(https://fonts\.googleapis\.com/css2\?[^"]+)"', html)
    if not m: return html
    ua = {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"}
    try:
        url = m.group(1).replace("&amp;", "&")
        css = urllib.request.urlopen(urllib.request.Request(url, headers=ua), timeout=30).read().decode()
        os.makedirs(os.path.join(ZIEL, "fonts"), exist_ok=True)
        def holen(mm):
            u = mm.group(1); name = hashlib.sha1(u.encode()).hexdigest()[:12] + ".woff2"
            daten = urllib.request.urlopen(urllib.request.Request(u, headers=ua), timeout=30).read()
            open(os.path.join(ZIEL, "fonts", name), "wb").write(daten)
            return "url(" + name + ")"
        css = re.sub(r"url\((https://fonts\.gstatic\.com/[^)]+)\)", holen, css)
        open(os.path.join(ZIEL, "fonts", "schriften.css"), "w").write(css)
        print("Schriften eingebaut:", len(os.listdir(os.path.join(ZIEL, "fonts"))) - 1, "Dateien")
        return html.replace(m.group(1), "fonts/schriften.css")
    except Exception as e:
        print("Schriften nicht eingebaut (bleibt bei Google Fonts):", e)
        return html
p = os.path.join(ZIEL, "index.html")
s = schriften_einbauen(open(p, encoding="utf-8").read())
open(p, "w", encoding="utf-8").write(s)

# Lehrer-App ebenfalls mit native.js (eigene Seite)
p = os.path.join(ZIEL, "lehrer", "index.html")
if os.path.exists(p):
    s = open(p, encoding="utf-8").read()
    if "<head>" in s:
        s = s.replace("<head>", '<head>\n<script src="../native.js"></script>', 1)
        s = re.sub(r"(connect-src 'self')", r"\1 " + WEB, s, count=1)
        open(p, "w", encoding="utf-8").write(s)

print(f"app/www: {n} Dateien, {groesse/1e6:.0f} MB")
