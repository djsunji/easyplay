#!/usr/bin/env python3
"""Baut die Pakete (200 Fragen, Entdecker und Könner, ohne sprache/englisch/franzoesisch) nach /home/claude/fragen-en/ein.
Gleiche Reihenfolge wie beim ersten Lauf: nach Thema, dann Nummer. Aufruf: pakete.py"""
import json, glob, os
R = "/home/claude/easyplay"; Z = "/home/claude/fragen-en"
os.makedirs(Z + "/ein", exist_ok=True); os.makedirs(Z + "/aus", exist_ok=True)
Q = [q for f in glob.glob(R + "/fragen-*.json") for q in json.load(open(f))]
E = [q for q in Q if q.get("l") in (1, 2) and q["t"] not in ("sprache", "englisch", "franzoesisch")]
E.sort(key=lambda q: (q["t"], q["nr"]))
P = 200
for i in range(0, len(E), P):
    pk = [{k: q[k] for k in ("nr", "t", "l", "s", "q", "a", "e", "m") if k in q} for q in E[i:i + P]]
    json.dump(pk, open(Z + "/ein/k%03d.json" % (i // P + 1), "w"), ensure_ascii=False)
print(len(E), -(-len(E) // P))
