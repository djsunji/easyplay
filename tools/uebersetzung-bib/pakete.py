#!/usr/bin/env python3
"""Baut Pakete (20 Artikel) aus den Bibliothekstexten in tx/ für eine Sprache.
Aufruf: pakete.py fr|it|en   ->  /home/claude/bib-<l>/ein/p0001.json …  (schon übersetzte Artikel werden übersprungen)
Jeder Eintrag: k (Schlüssel), t (Titel), b (Buch), kap (Kapitel), teile (einleitung, wichtigste, abschnitte, begriffe, gewusst)."""
import json, glob, os, sys
R = "/home/claude/easyplay"; L = sys.argv[1]; Z = os.environ.get("EP_Z", f"/home/claude/bib-{L}")
os.makedirs(Z + "/ein", exist_ok=True); os.makedirs(Z + "/aus", exist_ok=True)
for f in glob.glob(Z + "/ein/p*.json"): os.remove(f)
idx = json.load(open(glob.glob(R + "/tx/index-*.json")[0]))
meta = {x["k"]: x for x in json.load(open(R + "/tools/artikelseiten.json"))}
korr = json.load(open(R + "/korrektur/artikel.json"))
schon = set()
for f in glob.glob(f"{R}/welten/i18n/{L}/tx/*.json"): schon |= set(json.load(open(f)))
alle = []
for d in idx["d"]:
    for k, v in json.load(open(R + "/" + d)).items():
        if k in schon: continue
        T = dict((korr.get(k) or v)["teile"]); T.pop("v", None)
        m = meta.get(k, {})
        alle.append({"k": k, "t": m.get("t", ""), "b": m.get("b", ""), "kap": m.get("kap", ""), "teile": T})
P = int(os.environ.get("EP_P", "20"))
for i in range(0, len(alle), P):
    json.dump(alle[i:i + P], open(f"{Z}/ein/p{i // P + 1:04d}.json", "w"), ensure_ascii=False)
print(len(alle), -(-len(alle) // P))
