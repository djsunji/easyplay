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
    alle.update(d)
    print(f, len(d))
ohne -= set(alle)
if ohne:
    alle["_ohne"] = sorted(ohne)
json.dump(alle, open(ziel, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
n_mit = len([k for k in alle if k != "_ohne"])
print("Seiten mit Bild:", n_mit, "ohne Treffer:", len(ohne))
print(f"::notice::Bildindex zusammen: {n_mit} Seiten mit Bild, {len(ohne)} ohne Treffer")
