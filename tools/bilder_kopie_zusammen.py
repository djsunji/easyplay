#!/usr/bin/env python3
"""Übernimmt die kopierten Bilder aus teile/ nach bilder/ und vermerkt den lokalen Pfad im Bildindex (e[6])."""
import glob, json, os, shutil
W = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ziel = os.path.join(W, "bildindex.json")
ix = json.load(open(ziel, encoding="utf-8"))
n = 0
for kj in glob.glob(os.path.join(W, "teile", "**", "kopie.json"), recursive=True):
    basis = os.path.dirname(kj)
    for k in json.load(open(kj))["ok"]:
        if k not in ix:
            continue
        for feld, rel in ((6, f"bilder/{k[-2:]}/{k}.webp"), (7, f"bilder/gross/{k[-2:]}/{k}.webp")):
            src = os.path.join(basis, rel)
            if not os.path.exists(src):
                continue
            os.makedirs(os.path.join(W, os.path.dirname(rel)), exist_ok=True)
            shutil.copyfile(src, os.path.join(W, rel))
            e = ix[k]
            while len(e) <= feld: e.append("")
            e[feld] = rel
            n += 1
        app = os.path.join(basis, "app", k[-2:], k + ".webp")
        if os.path.exists(app):
            z = os.path.join(W, "app-paket", "bilder", k[-2:]); os.makedirs(z, exist_ok=True)
            shutil.copyfile(app, os.path.join(z, k + ".webp"))
# Bilder von Seiten, die nicht mehr im Index sind, entfernen
gueltig = {v[f] for k, v in ix.items() if k != "_ohne" for f in (6, 7) if len(v) > f and v[f]}
weg = 0
for p in glob.glob(os.path.join(W, "bilder", "*", "*.webp")) + glob.glob(os.path.join(W, "bilder", "gross", "*", "*.webp")):
    if os.path.relpath(p, W) not in gueltig:
        os.remove(p); weg += 1
json.dump(ix, open(ziel, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
lokal = len(gueltig)
groesse = sum(os.path.getsize(p) for p in glob.glob(os.path.join(W, "bilder", "**", "*.webp"), recursive=True))
print(f"::notice::Kopie zusammen: {n} neu, {lokal} lokal, {weg} entfernt, {groesse // 1024 // 1024} MB")
