#!/usr/bin/env python3
"""Fügt die Teilergebnisse der parallelen Bildersuche (bildindex-teil-*.json) in bildindex.json zusammen."""
import glob, json, os
W = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ziel = os.path.join(W, "bildindex.json")
alle = json.load(open(ziel, encoding="utf-8")) if os.path.exists(ziel) else {}
ohne = set(alle.pop("_ohne", []) or [])
for f in sorted(glob.glob(os.path.join(W, "teile", "**", "bildindex-teil-*.json"), recursive=True)):
    d = json.load(open(f, encoding="utf-8"))
    ohne |= set(d.pop("_ohne", []) or [])
    # In der Verwaltung von Hand gesetzte Bilder (e = eigenes, m = manuell gewählt) nie überschreiben
    for k, v in d.items():
        alt = alle.get(k)
        if isinstance(alt, list) and len(alt) > 5 and alt[5] in ("e", "m"):
            continue  # manuell
        alle[k] = v
    print(f, len(d))
ohne -= set(alle)
# Titel ohne HTML-Reste, Seitentitel aus bildseiten.json bevorzugen
import re
try:
    titel = {s["k"]: s["t"] for s in json.load(open(os.path.join(W, "tools", "bildseiten.json"), encoding="utf-8"))}
except Exception:
    titel = {}
for k, v in alle.items():
    if k == "_ohne" or not isinstance(v, list):
        continue
    for i in (1, 2):
        if len(v) > i and isinstance(v[i], str) and "<" in v[i]:
            v[i] = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", v[i])).strip()[:120]
    if len(v) > 5 and v[5] == "o" and k in titel:
        v[1] = titel[k]
if ohne:
    alle["_ohne"] = sorted(ohne)
json.dump(alle, open(ziel, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
n_mit = len([k for k in alle if k != "_ohne"])
print("Seiten mit Bild:", n_mit, "ohne Treffer:", len(ohne))
print(f"::notice::Bildindex zusammen: {n_mit} Seiten mit Bild, {len(ohne)} ohne Treffer")
