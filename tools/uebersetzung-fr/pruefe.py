#!/usr/bin/env python3
"""Prüft eine französische Übersetzungsdatei. Aufruf: pruefe.py <ausgabe.json> <eingabe.json>"""
import json, re, sys
DE = re.compile(r"\b(und|das|nicht|ist|ein|eine|mit|für|auf|wie|welche[rsn]?|wer|wird|sind|oder|auch|zum|vom|beim)\b")
def pruefe(aus, ein):
    f = []
    try: d = json.load(open(aus, encoding="utf-8"))
    except Exception as e: return [f"JSON ungültig: {e}"]
    if not isinstance(d, dict): return ["Ausgabe muss ein JSON-Objekt sein"]
    E = {str(x["nr"]): x for x in json.load(open(ein, encoding="utf-8"))}
    fehlt = [k for k in E if k not in d]
    if fehlt: f.append(f"Es fehlen {len(fehlt)} Nummern: {fehlt[:10]}")
    fremd = [k for k in d if k not in E]
    if fremd: f.append(f"Unbekannte Nummern: {fremd[:5]}")
    nulls = 0
    for k, v in d.items():
        if k not in E: continue
        o = E[k]
        if v is None: nulls += 1; continue
        if not isinstance(v, dict): f.append(f"{k}: Wert muss Objekt oder null sein"); continue
        a = v.get("a")
        if not isinstance(v.get("q"), str) or len(v["q"].strip()) < 3: f.append(f"{k}: Frage fehlt")
        if not isinstance(a, list) or len(a) != len(o["a"]) or not all(isinstance(x, str) and x.strip() for x in a): f.append(f"{k}: genau {len(o['a'])} Antworten nötig"); continue
        if len(set(x.strip() for x in a)) != len(a): f.append(f"{k}: zwei Antworten sind gleich")
        for feld in ("e", "m"):
            if o.get(feld) and not (isinstance(v.get(feld), str) and v[feld].strip()): f.append(f"{k}: «{feld}» fehlt")
        alles = " ".join([v.get("q", ""), *a, v.get("e", "") or "", v.get("m", "") or ""])
        if re.search(r"[–—]", alles) or re.search(r"\s-\s", alles): f.append(f"{k}: Gedankenstrich")
        if "ß" in alles: f.append(f"{k}: enthält ß")
        if re.search(r"[„]", alles): f.append(f"{k}: guillemets « » ou “ ”")
        if len(DE.findall(alles)) >= 3: f.append(f"{k}: sieht nach Deutsch aus: {alles[:80]}")
        lo = len(" ".join([o["q"], *o["a"], o.get("e", ""), o.get("m", "")]))
        if len(alles) > lo * 2.2 + 40: f.append(f"{k}: viel länger als das Original")
    if nulls > len(E) * 0.15: f.append(f"Zu viele null ({nulls} von {len(E)}); null seulement pour les questions sans sens en français")
    return f
if __name__ == "__main__":
    r = pruefe(sys.argv[1], sys.argv[2])
    if r: print(f"{len(r)} Fehler:"); print("\n".join(r[:40])); sys.exit(1)
    print("OK")
