#!/usr/bin/env python3
"""easyplay: passende, frei lizenzierte Bilder für die Bibliotheksseiten finden.

Läuft als GitHub Action (dort gibt es Internet). Liest tools/bildseiten.json
(Seiten mit Kandidaten-Titeln) und schreibt bildindex.json:
  { seitenKey: [bildUrl, alt, urheber, lizenz, quellseite] }

Quellen, in dieser Reihenfolge:
  1. Hauptbild der passenden deutschen Wikipedia-Artikel (nur Dateien auf Wikimedia Commons)
  2. Suche auf Wikimedia Commons
  3. Openverse (freie Bilder von Flickr und anderen, nur CC-Lizenzen)
Nur freie Lizenzen (CC0, Public Domain, CC BY, CC BY-SA), Mindestgrösse, keine Karten,
Logos, Wappen oder Diagramme (ausser bei Firmen-Seiten).
"""
import json, os, re, sys, time, urllib.parse, urllib.request

UA = "easyplay-bilder/1.0 (https://djsunji.github.io/easyplay/; Lernseite fuer Kinder)"
HIER = os.path.dirname(os.path.abspath(__file__))
WURZEL = os.path.dirname(HIER)
SEITEN = os.path.join(HIER, "bildseiten.json")
ZIEL = os.path.join(WURZEL, "bildindex.json")
BREITE = 800
MAX_ZEIT = float(os.environ.get("MAX_MINUTEN", "300")) * 60
START = time.time()

SCHLECHT = re.compile(r"\.svg|karte|map[_ .\-]|locator|lageplan|lage_|logo|flag|flagge|wappen|coat[_ ]of[_ ]arms|signatur|signature|unterschrift|diagram|schema|chart|graph|icon|symbol|\.pdf|\.tif|\.djvu|stamp|briefmarke|\bplan\b", re.I)
HEIKEL = re.compile(r"nude|naked|nackt|akt\b|erotic|erotik|sex|porn|breast|brust|bikini|lingerie|dessous|topless|corpse|leiche|blood|blut|gore|wound|wunde|autopsy|execution|hinrichtung|weapon|waffe|gun\b|pistol|drug|droge|cigarette|zigarette", re.I)
FREI = re.compile(r"^(cc0|cc[- ]?by(?:[- ]sa)?(?:[- ][0-9.]+)?|public domain|pd|pd-.*|gemeinfrei|attribution|no restrictions)", re.I)


def https_url(u):
    """Nur https-Adressen ohne Sonderzeichen übernehmen."""
    u = str(u or "")
    p = urllib.parse.urlparse(u)
    return u if p.scheme == "https" and p.netloc and not re.search(r"[\s\"'<>]", u) else ""


def holen(url, versuche=4):
    for i in range(versuche):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception as e:
            wart = 2 ** i * 2
            print(f"  Fehler ({e}), warte {wart}s", file=sys.stderr)
            time.sleep(wart)
    return None


def api(host, params):
    p = {"format": "json", "formatversion": "2", **params}
    return holen(f"https://{host}/w/api.php?" + urllib.parse.urlencode(p))


def text(html):
    t = re.sub(r"<[^>]+>", " ", str(html or ""))
    t = re.sub(r"\s+", " ", t).strip()
    return t[:120]


def gut(ii, roh=False):
    """Prüft eine imageinfo-Antwort von Commons."""
    if not ii:
        return False
    mime = ii.get("mime", "")
    w, h = ii.get("width", 0), ii.get("height", 0)
    if roh:
        if mime not in ("image/jpeg", "image/png", "image/webp", "image/svg+xml"):
            return False
    else:
        if mime not in ("image/jpeg", "image/png", "image/webp"):
            return False
        if w < 600 or h < 400:
            return False
        r = w / max(1, h)
        if r < 0.45 or r > 2.6:
            return False
    lic = text((ii.get("extmetadata") or {}).get("LicenseShortName", {}).get("value", ""))
    if not FREI.match(lic):
        return False
    return True


def eintrag(datei, ii, alt):
    md = ii.get("extmetadata") or {}
    urheber = text(md.get("Artist", {}).get("value", "")) or "Wikimedia Commons"
    lic = text(md.get("LicenseShortName", {}).get("value", ""))
    url = ii.get("thumburl") or ii.get("url")
    if not https_url(url):
        return None
    return [url, alt, urheber, lic, https_url(ii.get("descriptionurl", ""))]


def commons_infos(dateien):
    """imageinfo für viele Dateien (je 50) von Commons holen."""
    aus = {}
    dateien = list(dict.fromkeys(dateien))
    for i in range(0, len(dateien), 50):
        teil = dateien[i:i + 50]
        j = api("commons.wikimedia.org", {"action": "query", "titles": "|".join("File:" + d for d in teil),
                                           "prop": "imageinfo", "iiprop": "url|size|mime|extmetadata",
                                           "iiurlwidth": str(BREITE), "iiextmetadatafilter": "Artist|LicenseShortName"})
        for p in ((j or {}).get("query", {}).get("pages", []) or []):
            if p.get("missing") or not p.get("imageinfo"):
                continue
            name = p["title"].split(":", 1)[1]
            aus[name] = p["imageinfo"][0]
        time.sleep(0.3)
    return aus


def wiki_hauptbilder(titel):
    """Hauptbild (pageimage) der deutschen Wikipedia-Artikel, je 50 Titel."""
    aus = {}
    titel = list(dict.fromkeys(t for t in titel if t))
    for i in range(0, len(titel), 50):
        teil = titel[i:i + 50]
        j = api("de.wikipedia.org", {"action": "query", "titles": "|".join(teil), "prop": "pageimages|pageprops",
                                     "piprop": "name", "ppprop": "disambiguation", "redirects": "1"})
        q = (j or {}).get("query", {})
        weiter = {}
        for n in q.get("normalized", []) or []:
            weiter[n["from"]] = n["to"]
        for n in q.get("redirects", []) or []:
            weiter[n["from"]] = n["to"]
        bild = {}
        for p in q.get("pages", []) or []:
            if p.get("missing") or "disambiguation" in (p.get("pageprops") or {}):
                continue
            if p.get("pageimage"):
                bild[p["title"]] = p["pageimage"]
        for t in teil:
            z = t
            for _ in range(3):
                z = weiter.get(z, z)
            if z in bild:
                aus[t] = bild[z]
        time.sleep(0.3)
        if i % 2000 == 0:
            print(f"  Wikipedia {i}/{len(titel)}")
    return aus


def commons_suche(begriff, roh=False):
    # nur geprüfte Qualitätsbilder, damit für Kinder nichts Unpassendes erscheint
    filt = ' incategory:"Quality images"' + ("" if roh else " filetype:bitmap")
    j = api("commons.wikimedia.org", {"action": "query", "generator": "search", "gsrnamespace": "6",
                                       "gsrsearch": begriff + filt, "gsrlimit": "12", "prop": "imageinfo",
                                       "iiprop": "url|size|mime|extmetadata", "iiurlwidth": str(BREITE),
                                       "iiextmetadatafilter": "Artist|LicenseShortName"})
    seiten = sorted(((j or {}).get("query", {}).get("pages", []) or []), key=lambda p: p.get("index", 99))
    for p in seiten:
        name = p["title"].split(":", 1)[1]
        ii = (p.get("imageinfo") or [None])[0]
        if HEIKEL.search(name):
            continue
        if (roh or not SCHLECHT.search(name)) and gut(ii, roh):
            return name, ii
    return None, None


def openverse(begriff):
    url = "https://api.openverse.org/v1/images/?" + urllib.parse.urlencode(
        {"q": begriff, "license": "cc0,pdm,by,by-sa", "mature": "false", "page_size": "10"})
    j = holen(url, versuche=2)
    for r in (j or {}).get("results", []) or []:
        if not https_url(r.get("url")):
            continue
        w, h = r.get("width") or 0, r.get("height") or 0
        if w < 800 or h < 500 or not (0.45 < w / max(1, h) < 2.6):
            continue
        if SCHLECHT.search(r.get("title") or "") or HEIKEL.search((r.get("title") or "") + " " + " ".join(t.get("name", "") for t in (r.get("tags") or []))):
            continue
        lic = ("CC0" if r.get("license") == "cc0" else "Public Domain" if r.get("license") == "pdm"
               else f"CC {str(r.get('license','')).upper()} {r.get('license_version','')}".strip())
        return [r.get("url"), r.get("title") or begriff, (r.get("creator") or "unbekannt")[:120], lic,
                https_url(r.get("foreign_landing_url"))]
    return None


def main():
    seiten = json.load(open(SEITEN, encoding="utf-8"))
    alt = {}
    if os.path.exists(ZIEL) and os.environ.get("NEU", "") != "1":
        alt = json.load(open(ZIEL, encoding="utf-8"))
    # "_ohne": Seiten, für die schon gesucht und nichts gefunden wurde. So macht ein
    # neuer Lauf nach dem Zeitlimit dort weiter, wo der letzte aufgehört hat.
    ohne = set(alt.pop("_ohne", []) or [])
    offen = [s for s in seiten if s["k"] not in alt and s["k"] not in ohne]
    # Aufteilen auf mehrere parallele Läufe: TEIL="2/6" bearbeitet jede sechste Seite ab der dritten
    teil = os.environ.get("TEIL", "")
    ziel = ZIEL
    if teil:
        i, n = (int(x) for x in teil.split("/"))
        offen = [s for j, s in enumerate(offen) if j % n == i]
        ziel = os.path.join(WURZEL, f"bildindex-teil-{i}.json")
        alt, ohne = {}, set()
    print(f"{len(seiten)} Seiten, {len(alt)} schon mit Bild, {len(ohne)} ohne Treffer, {len(offen)} offen")
    ergebnis = dict(alt)

    def speichern():
        aus = dict(ergebnis)
        if ohne:
            aus["_ohne"] = sorted(ohne)
        json.dump(aus, open(ziel, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

    # 1. Wikipedia-Hauptbilder
    haupt = wiki_hauptbilder([c for s in offen for c in s["c"]])
    print(f"Wikipedia: {len(haupt)} Artikel mit Hauptbild")
    infos = commons_infos(list(haupt.values()))
    print(f"Commons: {len(infos)} Dateien mit Infos")
    rest = []
    for s in offen:
        treffer = None
        for c in s["c"]:
            d = haupt.get(c)
            if not d or d not in infos:
                continue
            if not HEIKEL.search(d) and (s.get("r") or not SCHLECHT.search(d)) and gut(infos[d], bool(s.get("r"))):
                treffer = eintrag(d, infos[d], s["t"])
                break
        if treffer:
            ergebnis[s["k"]] = treffer
        else:
            rest.append(s)
    print(f"Nach Wikipedia: {len(ergebnis)} mit Bild, {len(rest)} ohne")
    speichern()

    # 2. Commons-Suche, 3. Openverse
    n = 0
    for s in rest:
        if time.time() - START > MAX_ZEIT:
            print("Zeitlimit erreicht, der Rest folgt beim nächsten Lauf")
            break
        if s["t"] in ("Allgemeines",):
            ohne.add(s["k"])
            continue
        roh = bool(s.get("r"))
        treffer = None
        for begriff in [s["t"], f'{s["t"]} {s["kap"]}']:
            name, ii = commons_suche(begriff, roh)
            if name:
                treffer = eintrag(name, ii, s["t"])
                break
            time.sleep(0.4)
        if not treffer and not roh:
            treffer = openverse(s["t"])
            time.sleep(1.2)
        if treffer:
            ergebnis[s["k"]] = treffer
        else:
            ohne.add(s["k"])
        n += 1
        if n % 200 == 0:
            print(f"  Suche {n}/{len(rest)}, total {len(ergebnis)}")
            speichern()
    speichern()
    print(f"Fertig: {len(ergebnis)} von {len(seiten)} Seiten haben ein Bild")


if __name__ == "__main__":
    main()
