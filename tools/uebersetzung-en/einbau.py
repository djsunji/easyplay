#!/usr/bin/env python3
"""Baut alle geprüften Pakete aus /home/claude/fragen-en/aus zu den schon vorhandenen englischen Fragen in welten/i18n/en/ ein."""
import json, glob, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pruefe import pruefe
W = "/home/claude/easyplay/welten/i18n"; Z = os.environ.get("EP_Z", "/home/claude/fragen-en")
os.makedirs(f"{W}/en", exist_ok=True)
alle = {}
for f in glob.glob(f"{W}/en/q-*.json"): alle.update(json.load(open(f, encoding="utf-8")))
vorher = len(alle); ok, nul, weg = 0, 0, []
for aus in sorted(glob.glob(f"{Z}/aus/k[0-9][0-9][0-9].json")):
    if pruefe(aus, aus.replace("/aus/", "/ein/")): weg.append(os.path.basename(aus)); continue
    for k, v in json.load(open(aus, encoding="utf-8")).items():
        if v is None: nul += 1; continue
        alle[k] = {f: v[f] for f in ("q", "a", "e", "m") if v.get(f)}
    ok += 1
for f in glob.glob(f"{W}/en/q-*.json"): os.remove(f)
keys = sorted(alle, key=int); PRO = 2500; dateien = []
for i in range(0, len(keys), PRO):
    name = f"q-{1 + i // PRO}.json"
    json.dump({k: alle[k] for k in keys[i:i + PRO]}, open(f"{W}/en/{name}", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    dateien.append(name)
idx = json.load(open(f"{W}/index.json", encoding="utf-8")); idx["en"] = dateien
json.dump(idx, open(f"{W}/index.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print(f"{ok} Pakete, {len(alle) - vorher} neue Fragen, {nul} ausgelassen" + (f", übersprungen: {' '.join(weg)}" if weg else ""))
