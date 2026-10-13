#!/usr/bin/env python3
"""Fügt die Prüfteile zusammen und baut Übersichtsbogen der verdächtigen Bilder (pruefung/bogen-XX.jpg)."""
import glob, json, os
from PIL import Image, ImageDraw, ImageFont
W = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
seiten = {s["k"]: s for s in json.load(open(os.path.join(W, "tools", "bildseiten.json"), encoding="utf-8"))}
werte, kaputt = {}, {}
for f in glob.glob(os.path.join(W, "teile", "**", "pruefung-teil-*.json"), recursive=True):
    d = json.load(open(f, encoding="utf-8")); werte.update(d["werte"]); kaputt.update(d["kaputt"])
json.dump({"werte": werte, "kaputt": kaputt}, open(os.path.join(W, "pruefung", "ergebnis.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
bilder = {os.path.basename(p)[:-4]: p for p in glob.glob(os.path.join(W, "teile", "**", "*.jpg"), recursive=True)}
verd = sorted((k for k in bilder if k in werte), key=lambda k: (-werte[k][0], k))
bogenliste = {}
try:
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 13)
except Exception:
    font = ImageFont.load_default()
SP, ZE, B, H = 5, 6, 230, 290
for s in range(0, len(verd), SP * ZE):
    bogen = Image.new("RGB", (SP * B, ZE * H), "white"); d = ImageDraw.Draw(bogen)
    bogenliste[f"{s // (SP * ZE):03d}"] = verd[s:s + SP * ZE]
    for j, k in enumerate(verd[s:s + SP * ZE]):
        x, y = (j % SP) * B, (j // SP) * H
        im = Image.open(bilder[k]); bogen.paste(im, (x + 5, y + 5))
        d.rectangle([x + 5, y + 5, x + 35, y + 25], fill="black")
        d.text((x + 9, y + 8), f"{j + 1}", fill="yellow", font=font)
        d.text((x + 5, y + 232), f"#{j + 1}  R{werte[k][0]}", fill="gray", font=font)
        d.text((x + 5, y + 248), seiten[k]["t"][:30], fill="black", font=font)
        d.text((x + 5, y + 264), ("≈ " + werte[k][2][0])[:30], fill="darkred", font=font)
    bogen.save(os.path.join(W, "pruefung", f"bogen-{s // (SP * ZE):03d}.jpg"), quality=72)
json.dump(bogenliste, open(os.path.join(W, "pruefung", "bogen.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
json.dump({"werte": werte, "kaputt": kaputt, "bogen": bogenliste}, open(os.path.join(W, "pruefung", "ergebnis.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print(f"::notice::Prüfung zusammen: {len(werte)} geprüft, {len(verd)} verdächtig, {len(kaputt)} nicht ladbar, {(len(verd)+29)//30} Bogen")
