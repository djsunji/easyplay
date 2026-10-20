"""Erzeugt qeels/index.html aus index.html.

Qeels ist eine eigene Seite (https://djsunji.github.io/easyplay/qeels/), nutzt aber
denselben Code und dieselben Daten wie easyplay: Fragen, Bibliothekstexte, Bilder,
Bildindex und Supabase (Likes, Kommentare, Konten). Nichts wird kopiert.
<base href="../"> sorgt dafür, dass alle Dateien aus dem easyplay-Ordner geladen werden.

Aufruf: python3 tools/qeels_bauen.py  (läuft auch automatisch über .github/workflows/qeels.yml)
"""
import pathlib
import re
import sys

WURZEL = pathlib.Path(__file__).resolve().parent.parent
QUELLE = WURZEL / "index.html"
ZIEL = WURZEL / "qeels" / "index.html"
URL = "https://djsunji.github.io/easyplay/qeels/"
TITEL = "Qeels, Quiz und Wissen im Kurzformat"
TEXT = "Wische durch Quizfragen und Bibliotheksartikel von easyplay, im Stil von Shorts und Reels"


def ersetze(html, muster, neu, pflicht=True):
    html2, n = re.subn(muster, neu, html, count=1, flags=re.S)
    if pflicht and n != 1:
        sys.exit(f"qeels_bauen: Stelle nicht gefunden: {muster}")
    return html2


def bauen():
    html = QUELLE.read_text(encoding="utf-8")
    hinweis = "<!-- Automatisch erzeugt aus index.html mit tools/qeels_bauen.py. Nicht von Hand ändern. -->\n"
    html = ersetze(html, r'<meta charset="utf-8">', lambda m: m.group(0) + '\n<base href="../">')
    html = ersetze(html, r"<title>.*?</title>", f"<title>{TITEL}</title>")
    html = ersetze(html, r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{TEXT}">')
    html = ersetze(html, r'<link rel="manifest" href="[^"]*">', '<link rel="manifest" href="qeels/manifest.webmanifest">')
    html = ersetze(html, r'<meta name="apple-mobile-web-app-title" content="[^"]*">', '<meta name="apple-mobile-web-app-title" content="Qeels">')
    html = ersetze(html, r'<meta property="og:site_name" content="[^"]*">', '<meta property="og:site_name" content="Qeels">')
    html = ersetze(html, r'<meta property="og:title" content="[^"]*">', f'<meta property="og:title" content="{TITEL}">')
    html = ersetze(html, r'<meta property="og:description" content="[^"]*">', f'<meta property="og:description" content="{TEXT}">')
    html = ersetze(html, r'<meta property="og:url" content="[^"]*">', f'<meta property="og:url" content="{URL}">')
    html = ersetze(html, r'<link rel="icon" type="image/png" sizes="192x192" href="[^"]*">', '<link rel="icon" type="image/png" sizes="192x192" href="qeels/img/icon-192.png">')
    html = ersetze(html, r'<link rel="apple-touch-icon" href="[^"]*">', '<link rel="apple-touch-icon" href="qeels/img/apple-touch-icon.png">')
    html = re.sub(r'https://djsunji\.github\.io/easyplay/img/vorschau\.jpg', URL + "img/vorschau.jpg", html)
    html = ersetze(html, r'<script src="config.js"></script>', lambda m: m.group(0) + '\n<script src="qeels/qeels-vorher.js"></script>')
    i = html.rfind("</body>")
    if i < 0:
        sys.exit("qeels_bauen: </body> nicht gefunden")
    html = html[:i] + '<script src="qeels/qeels.js"></script>\n' + html[i:]
    html = ersetze(html, r"<!DOCTYPE html>\n", lambda m: m.group(0) + hinweis)
    alt = ZIEL.read_text(encoding="utf-8") if ZIEL.exists() else ""
    if alt != html:
        ZIEL.write_text(html, encoding="utf-8")
        print("qeels/index.html aktualisiert")
    else:
        print("qeels/index.html ist aktuell")


if __name__ == "__main__":
    bauen()
