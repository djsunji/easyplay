#!/usr/bin/env python3
"""Baut alle geprüften Pakete aus /home/claude/bib-<l>/aus in welten/i18n/<l>/tx/ ein.
Aufruf: einbau.py fr|it|en
Eine Übersetzungsdatei pro deutscher Datei in tx/ (gleicher Name ohne Hash, dafür eigener Hash):
  welten/i18n/<l>/tx/<buch>-<n>-<hash>.json  = { schlüssel: {t: Titel, teile: {...}} }
Dazu welten/i18n/<l>/titel-<hash>.json = { deutscher Titel: übersetzter Titel } für die Oberfläche
und in welten/i18n/index.json unter "bib": { l: { titel: Pfad, tx: { buch-n: Pfad } } }."""
import json, glob, os, sys, hashlib, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pruefe import pruefe
R = "/home/claude/easyplay"; L = sys.argv[1]; Z = os.environ.get("EP_Z", f"/home/claude/bib-{L}")
W = f"{R}/welten/i18n"; O = f"{W}/{L}/tx"; os.makedirs(O, exist_ok=True)
idx = json.load(open(glob.glob(R + "/tx/index-*.json")[0]))
basis = lambda d: re.sub(r"-[0-9a-f]{8}\.json$", "", d.split("/")[-1])
wo = {}
for i, d in enumerate(idx["d"]):
    for k in json.load(open(R + "/" + d)): wo[k] = basis(d)
alle = {}
for f in glob.glob(O + "/*.json"): alle.update(json.load(open(f)))
vorher = len(alle); ok, weg = 0, []
for aus in sorted(glob.glob(f"{Z}/aus/p[0-9][0-9][0-9][0-9].json")):
    if pruefe(aus, aus.replace("/aus/", "/ein/")): weg.append(os.path.basename(aus)); continue
    for k, v in json.load(open(aus)).items():
        T = {f: v["teile"][f] for f in ("einleitung", "wichtigste", "abschnitte", "begriffe", "gewusst") if v["teile"].get(f)}
        alle[k] = {"t": v["t"].strip(), "teile": T}
    ok += 1
gruppe = {}
for k, v in alle.items():
    if k in wo: gruppe.setdefault(wo[k], {})[k] = v
for f in glob.glob(O + "/*.json"): os.remove(f)
tx = {}
for b, inh in sorted(gruppe.items()):
    s = json.dumps(dict(sorted(inh.items())), ensure_ascii=False, separators=(",", ":"))
    name = f"{b}-{hashlib.sha1(s.encode()).hexdigest()[:8]}.json"
    open(f"{O}/{name}", "w", encoding="utf-8").write(s); tx[b] = f"welten/i18n/{L}/tx/{name}"
meta = {x["k"]: x["t"] for x in json.load(open(R + "/tools/artikelseiten.json"))}
titel = {}
for k, v in alle.items():
    de = meta.get(k)
    if de and de != v["t"]: titel[de] = v["t"]
extra = f"{W}/{L}/bibtitel-extra.json"   # Kapitel, Unterkapitel, Buchtexte (von Hand gepflegt)
if os.path.exists(extra): titel.update(json.load(open(extra)))
for f in glob.glob(f"{W}/{L}/titel-*.json"): os.remove(f)
s = json.dumps(dict(sorted(titel.items())), ensure_ascii=False, separators=(",", ":"))
tn = f"welten/i18n/{L}/titel-{hashlib.sha1(s.encode()).hexdigest()[:8]}.json"; open(f"{R}/{tn}", "w", encoding="utf-8").write(s)
ix = json.load(open(f"{W}/index.json")); ix.setdefault("bib", {})[L] = {"titel": tn, "tx": tx}
json.dump(ix, open(f"{W}/index.json", "w"), ensure_ascii=False, indent=2)
print(f"{ok} Pakete, {len(alle) - vorher} neue Artikel, jetzt {len(alle)} Artikel auf {L}" + (f", übersprungen: {' '.join(weg)}" if weg else ""))
