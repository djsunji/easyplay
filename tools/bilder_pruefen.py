#!/usr/bin/env python3
"""easyplay: prüft mit CLIP, ob die Bilder im Bildindex zum Seitentitel passen.

Läuft als GitHub Action. Für jedes Bild: Ähnlichkeit zum eigenen Seitentitel im Vergleich zu
allen anderen Titeln (Rang). Ein hoher Rang heisst: das Bild passt besser zu anderen Begriffen.
Schreibt pruefung-teil-<i>.json und kleine Vorschaubilder verdächtiger Bilder nach pruefung/teil-<i>/.
"""
import io, json, os, re, sys, time, concurrent.futures as cf
import requests
from PIL import Image

HIER = os.path.dirname(os.path.abspath(__file__))
W = os.path.dirname(HIER)
UA = "easyplay-bildpruefung/1.0 (https://djsunji.github.io/easyplay/; Lernseite fuer Kinder)"
RANG_VERDACHT = int(os.environ.get("RANG_VERDACHT", "300"))

def haupt():
    global i, n
    i, n = (int(x) for x in os.environ.get("TEIL", "0/1").split("/"))
    seiten = {s["k"]: s for s in json.load(open(os.path.join(HIER, "bildseiten.json"), encoding="utf-8"))}
    ix = json.load(open(os.path.join(W, "bildindex.json"), encoding="utf-8"))
    ix.pop("_ohne", None)
    keys = sorted(k for k in ix if k in seiten)
    meine = [k for j, k in enumerate(keys) if j % n == i]
    print(f"Teil {i}/{n}: {len(meine)} Bilder")


    def klein(url):
        # Wikimedia-Vorschau in 330px statt 960px laden
        u = re.sub(r"/(\d+)px-", "/330px-", url)
        return u


    ses = requests.Session()
    ses.headers["User-Agent"] = UA


    def laden(k):
        url = klein(ix[k][0])
        for v in range(4):
            try:
                r = ses.get(url, timeout=30)
                if r.status_code == 429:
                    time.sleep(5 * (v + 1)); continue
                if r.status_code != 200 and url != ix[k][0]:
                    url = ix[k][0]; continue
                if r.status_code != 200:
                    return k, None, f"http {r.status_code}"
                im = Image.open(io.BytesIO(r.content)).convert("RGB")
                im.thumbnail((336, 336))
                return k, im, None
            except Exception as e:
                err = str(e)[:80]; time.sleep(2)
        return k, None, err


    from sentence_transformers import SentenceTransformer
    import numpy as np
    bildm = SentenceTransformer("clip-ViT-B-32")
    textm = SentenceTransformer("sentence-transformers/clip-ViT-B-32-multilingual-v1")

    titel = sorted({seiten[k]["t"] for k in keys})
    tpos = {t: j for j, t in enumerate(titel)}
    T = textm.encode([f"Ein Foto von {t}" for t in titel], batch_size=128, normalize_embeddings=True, show_progress_bar=False)
    print("Texte:", T.shape)

    aus, kaputt = {}, {}
    os.makedirs(os.path.join(W, "pruefung", f"teil-{i}"), exist_ok=True)
    with cf.ThreadPoolExecutor(8) as ex:
        stapel = []
        def auswerten(stapel):
            ks = [k for k, _ in stapel]
            E = bildm.encode([im for _, im in stapel], batch_size=32, normalize_embeddings=True, show_progress_bar=False)
            S = E @ T.T
            for r, k in enumerate(ks):
                t = seiten[k]["t"]; own = S[r, tpos[t]]
                rang = int((S[r] > own).sum())
                top = [titel[j] for j in np.argsort(-S[r])[:3]]
                aus[k] = [rang, round(float(own), 4), top]
                if rang >= RANG_VERDACHT:
                    im = dict(stapel)[k].copy(); im.thumbnail((220, 220))
                    im.save(os.path.join(W, "pruefung", f"teil-{i}", k + ".jpg"), quality=70)
        for nr, (k, im, err) in enumerate(ex.map(laden, meine)):
            if im is None:
                kaputt[k] = err; continue
            stapel.append((k, im))
            if len(stapel) >= 64:
                auswerten(stapel); stapel = []
            if nr % 300 == 0:
                print(f"  {nr}/{len(meine)}", flush=True)
        if stapel:
            auswerten(stapel)

    json.dump({"werte": aus, "kaputt": kaputt}, open(os.path.join(W, f"pruefung-teil-{i}.json"), "w", encoding="utf-8"), ensure_ascii=False)
    v = sum(1 for x in aus.values() if x[0] >= RANG_VERDACHT)
    print(f"::notice::Prüfung {i}/{n}: {len(aus)} geprüft, {v} verdächtig, {len(kaputt)} nicht ladbar")


if __name__ == "__main__":
    try:
        haupt()
    except Exception:
        import traceback
        t = traceback.format_exc()
        print(t)
        print("::error::" + t[-1500:].replace("%", "%25").replace("\r", "").replace("\n", "%0A"))
        sys.exit(1)
