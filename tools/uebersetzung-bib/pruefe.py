#!/usr/bin/env python3
"""Prüft eine übersetzte Paketdatei der Bibliothek. Aufruf: pruefe.py <ausgabe.json> <eingabe.json> [fr|it|en]"""
import json, re, sys
DE = re.compile(r"\b(und|das|nicht|ist|ein|eine|mit|für|auf|wie|wird|sind|oder|auch|zum|vom|beim|werden|sich|dass|einen|einem|einer|nach|bei|über|wurde)\b")
def texte(T):
    out = [T.get("einleitung", "")] + list(T.get("wichtigste", [])) + [x for a in T.get("abschnitte", []) for x in (a.get("titel", ""), a.get("text", ""))]
    out += [x for b in T.get("begriffe", []) or [] for x in (b.get("wort", ""), b.get("erklaerung", ""))] + list(T.get("gewusst", []) or [])
    return out
def pruefe(aus, ein):
    f = []
    try: d = json.load(open(aus, encoding="utf-8"))
    except Exception as e: return [f"JSON ungültig: {e}"]
    if not isinstance(d, dict): return ["Ausgabe muss ein JSON-Objekt sein"]
    E = {x["k"]: x for x in json.load(open(ein, encoding="utf-8"))}
    fehlt = [k for k in E if k not in d]
    if fehlt: f.append(f"Es fehlen {len(fehlt)} Schlüssel: {fehlt[:10]}")
    for k, v in d.items():
        if k not in E: f.append(f"{k}: unbekannter Schlüssel"); continue
        o = E[k]["teile"]
        if not isinstance(v, dict) or not isinstance(v.get("t"), str) or not v["t"].strip(): f.append(f"{k}: «t» (Titel) fehlt"); continue
        T = v.get("teile")
        if not isinstance(T, dict) or not isinstance(T.get("einleitung"), str) or not T["einleitung"].strip(): f.append(f"{k}: teile.einleitung fehlt"); continue
        for feld in ("wichtigste", "abschnitte", "begriffe", "gewusst"):
            a, b = o.get(feld), T.get(feld)
            if a is None: continue
            if not isinstance(b, list) or len(b) != len(a): f.append(f"{k}: «{feld}» braucht genau {len(a)} Einträge"); continue
        if any(f_.startswith(k + ":") for f_ in f): continue
        for i, (a, b) in enumerate(zip(o.get("abschnitte", []), T.get("abschnitte", []))):
            if not isinstance(b, dict) or not str(b.get("titel", "")).strip() or not str(b.get("text", "")).strip(): f.append(f"{k}: abschnitte[{i}] braucht titel und text"); continue
            if a.get("emoji") and b.get("emoji") != a.get("emoji"): f.append(f"{k}: abschnitte[{i}].emoji muss gleich bleiben ({a.get('emoji')})")
        for i, b in enumerate(T.get("begriffe", []) or []):
            if not isinstance(b, dict) or not str(b.get("wort", "")).strip() or not str(b.get("erklaerung", "")).strip(): f.append(f"{k}: begriffe[{i}] braucht wort und erklaerung")
        tx = texte(T); alles = " ".join([v["t"]] + [x for x in tx if isinstance(x, str)])
        if any(not isinstance(x, str) or not x.strip() for x in tx): f.append(f"{k}: leere Texte")
        if re.search(r"[–—]", alles) or re.search(r"\s-\s", alles): f.append(f"{k}: Gedankenstrich (– — oder ' - ')")
        if "ß" in alles: f.append(f"{k}: enthält ß")
        if "„" in alles: f.append(f"{k}: Anführungszeichen „ nicht erlaubt")
        if alles.count("**") % 2: f.append(f"{k}: ungerade Anzahl ** (Fettdruck)")
        de = len(DE.findall(alles)); w = max(1, len(alles.split()))
        if de >= 8 and de / w > 0.02: f.append(f"{k}: sieht nach Deutsch aus ({de} deutsche Wörter): {alles[:80]}")
        lo = len(" ".join(texte(o)))
        if len(alles) > lo * 1.9 + 200: f.append(f"{k}: viel länger als das Original")
        if len(alles) < lo * 0.55: f.append(f"{k}: viel kürzer als das Original (nichts weglassen)")
    return f
if __name__ == "__main__":
    r = pruefe(sys.argv[1], sys.argv[2])
    if r: print(f"{len(r)} Fehler:"); print("\n".join(r[:40])); sys.exit(1)
    print("OK")
