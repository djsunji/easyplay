#!/usr/bin/env python3
"""easyplay: zweites Bild für jeden Bibliotheksartikel finden (erscheint mitten im Text).

Läuft als GitHub Action (Workflow «Zweite Bilder für die Bibliothek finden»), dort gibt es Internet.
Für jede Seite aus tools/bildseiten.json, die schon ein erstes Bild hat:
  1. weitere Bilder aus dem passenden deutschen Wikipedia-Artikel, in der Reihenfolge im Artikel
     (das Hauptbild und das erste Bild der Seite werden übersprungen)
  2. sonst Suche auf Wikimedia Commons (nur «Quality images»)
Gleiche Regeln wie beim ersten Bild: freie Lizenz, Mindestgrösse, keine Karten, Logos, Wappen, Diagramme,
nichts Heikles. Ergebnis im Bildindex unter dem Schlüssel "z" + Seitenschlüssel.
Schreibt bildindex-teil-z<i>.json, das tools/bilder_zusammen.py übernimmt.
"""
import json, os, re, sys, time, urllib.parse
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bilder_finden as bf

KARTEN_SEITE = re.compile(r"^(kanton |bezirk )", re.I)


def datei_name(url):
    """Commons-Dateiname aus einer Bild- oder Beschreibungs-Adresse."""
    u = urllib.parse.unquote(str(url or ""))
    m = re.search(r"/(?:File|Datei):([^?#]+)", u)
    if m:
        return m.group(1).replace(" ", "_")
    m = re.search(r"/commons/(?:thumb/)?[0-9a-f]/[0-9a-f]{2}/([^/]+)", u)
    return m.group(1).replace(" ", "_") if m else ""


def artikel_bilder(titel):
    """Bilder eines Wikipedia-Artikels in der Reihenfolge im Text."""
    j = bf.api("de.wikipedia.org", {"action": "parse", "page": titel, "prop": "images|properties", "redirects": "1"})
    p = (j or {}).get("parse") or {}
    if not p:
        return None
    props = p.get("properties") or {}
    if isinstance(props, dict) and "disambiguation" in props:
        return None
    if isinstance(props, list) and any(x.get("name") == "disambiguation" for x in props):
        return None
    return [d for d in (p.get("images") or []) if isinstance(d, str)]


def commons_mehr(begriff, begriffe, titel, schon):
    filt = ' incategory:"Quality images" filetype:bitmap'
    j = bf.api("commons.wikimedia.org", {"action": "query", "generator": "search", "gsrnamespace": "6",
                                          "gsrsearch": begriff + filt, "gsrlimit": "20", "prop": "imageinfo",
                                          "iiprop": "url|size|mime|extmetadata", "iiurlwidth": str(bf.BREITE),
                                          "iiextmetadatafilter": "Artist|LicenseShortName"})
    seiten = sorted(((j or {}).get("query", {}).get("pages", []) or []), key=lambda p: p.get("index", 99))
    for p in seiten:
        name = p["title"].split(":", 1)[1]
        ii = (p.get("imageinfo") or [None])[0]
        if name.replace(" ", "_") in schon or bf.HEIKEL.search(name) or bf.SCHLECHT.search(name):
            continue
        if not (bf.passt(begriffe, name) and bf.passt_streng(titel, name)):
            continue
        if bf.gut(ii):
            return name, ii
    return None, None


def main():
    seiten = json.load(open(bf.SEITEN, encoding="utf-8"))
    ix = json.load(open(bf.ZIEL, encoding="utf-8"))
    ohne_alt = set(ix.get("_ohne", []) or [])
    neu = os.environ.get("NEU", "") == "1"
    offen = [s for s in seiten if s["k"] in ix and (neu or "z" + s["k"] not in ix)
             and ("z" + s["k"]) not in ohne_alt and s["t"] not in ("Allgemeines",)]
    i, n = (int(x) for x in os.environ.get("TEIL", "0/1").split("/"))
    offen = [s for j, s in enumerate(offen) if j % n == i]
    ziel = os.path.join(bf.WURZEL, f"bildindex-teil-z{i}.json")
    print(f"Teil {i}/{n}: {len(offen)} Seiten ohne zweites Bild")
    ergebnis, ohne = {}, set()
    # erste Bilder aller Seiten: nie als zweites Bild nehmen (auch nicht das einer Nachbarseite gleich nochmals)
    erste = {s["k"]: datei_name(ix[s["k"]][4]) or datei_name(ix[s["k"]][0]) for s in offen}

    def speichern():
        aus = dict(ergebnis)
        if ohne:
            aus["_ohne"] = sorted(ohne)
        json.dump(aus, open(ziel, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

    gezaehlt = {"w": 0, "c": 0}
    for nr, s in enumerate(offen):
        if time.time() - bf.START > bf.MAX_ZEIT:
            print("Zeitlimit erreicht, der Rest folgt beim nächsten Lauf")
            break
        k = s["k"]
        schon = {erste.get(k, "")}
        treffer = None
        roh = bool(s.get("r"))
        # 1. weitere Bilder aus dem Wikipedia-Artikel
        for c in s.get("c", [])[:3]:
            liste = artikel_bilder(c)
            time.sleep(0.2)
            if not liste:
                continue
            kand = [d for d in liste if d.replace(" ", "_") not in schon
                    and not bf.HEIKEL.search(d) and not bf.SCHLECHT.search(d)
                    and re.search(r"\.(jpe?g|png|webp)$", d, re.I)][:8]
            if not kand:
                break
            infos = bf.commons_infos(kand)
            for d in kand:
                ii = infos.get(d) or infos.get(d.replace("_", " "))
                if ii and bf.gut(ii):
                    treffer = bf.eintrag(d.replace("_", " "), ii, s["t"], "w")
                    if treffer:
                        gezaehlt["w"] += 1
                        break
            break
        # 2. Commons-Suche
        if not treffer and not roh:
            begriffe = bf.woerter(s["t"], *s.get("c", [])[:3])
            if begriffe:
                for begriff in (s["t"], f'{s["t"]} {s["kap"]}'):
                    name, ii = commons_mehr(begriff, begriffe, s["t"], schon)
                    time.sleep(0.4)
                    if name:
                        treffer = bf.eintrag(name, ii, s["t"], "c")
                        if treffer:
                            gezaehlt["c"] += 1
                            break
        if treffer:
            ergebnis["z" + k] = treffer
        else:
            ohne.add("z" + k)
        if nr % 200 == 0:
            print(f"  {nr}/{len(offen)}: {len(ergebnis)} gefunden ({gezaehlt})", flush=True)
            speichern()
    speichern()
    print(f"::notice::Zweite Bilder Teil {i}/{n}: {len(ergebnis)} gefunden "
          f"(Wikipedia {gezaehlt['w']}, Commons {gezaehlt['c']}), {len(ohne)} ohne Treffer")


if __name__ == "__main__":
    main()
