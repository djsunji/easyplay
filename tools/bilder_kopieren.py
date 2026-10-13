#!/usr/bin/env python3
"""easyplay: Bilder aus dem Bildindex herunterladen, verkleinern (WebP) und lokal ablegen.

Damit lädt die Seite die Bilder vom eigenen Server und eine spätere App kann sie offline mitliefern.
Ablage: bilder/<letzte 2 Zeichen>/<seitenKey>.webp, im Index als 7. Feld (e[6]) vermerkt.
Läuft als GitHub Action in Teilen (TEIL="i/n"), schreibt nach kopie/teil-<i>/.
"""
import io, json, os, re, sys, time, concurrent.futures as cf
import requests
from PIL import Image

HIER = os.path.dirname(os.path.abspath(__file__))
W = os.path.dirname(HIER)
UA = "easyplay-bilder/1.0 (https://djsunji.github.io/easyplay/; Lernseite fuer Kinder)"
BREITE, HOEHE, QUAL = 480, 400, 62


def pfad(k):
    return f"bilder/{k[-2:]}/{k}.webp"


def haupt():
    i, n = (int(x) for x in os.environ.get("TEIL", "0/1").split("/"))
    ix = json.load(open(os.path.join(W, "bildindex.json"), encoding="utf-8"))
    ix.pop("_ohne", None)
    alle = sorted(k for k, v in ix.items() if not (len(v) > 6 and v[6] and os.path.exists(os.path.join(W, v[6]))))
    meine = [k for j, k in enumerate(alle) if j % n == i]
    print(f"Teil {i}/{n}: {len(meine)} Bilder zu kopieren")
    ziel = os.path.join(W, "kopie", f"teil-{i}")
    ses = requests.Session(); ses.headers["User-Agent"] = UA

    def eins(k):
        url0 = ix[k][0]
        urls = [re.sub(r"/(\d+)px-", "/500px-", url0), url0] if "/thumb/" in url0 or "px-" in url0 else [url0]
        err = "?"
        for v in range(6):
            url = urls[min(v // 3, len(urls) - 1)]
            try:
                r = ses.get(url, timeout=40)
                if r.status_code == 429:
                    err = "429"; time.sleep(10 * (v + 1)); continue
                if r.status_code != 200:
                    err = f"http {r.status_code}"; urls = urls[1:] or urls; continue
                im = Image.open(io.BytesIO(r.content)).convert("RGB")
                im.thumbnail((BREITE, HOEHE), Image.LANCZOS)
                p = os.path.join(ziel, pfad(k)); os.makedirs(os.path.dirname(p), exist_ok=True)
                im.save(p, "WEBP", quality=QUAL, method=6)
                return k, None
            except Exception as e:
                err = str(e)[:60]; time.sleep(2)
        return k, err

    ok, fehler = [], {}
    with cf.ThreadPoolExecutor(3) as ex:
        for j, (k, err) in enumerate(ex.map(eins, meine)):
            if err: fehler[k] = err
            else: ok.append(k)
            if j % 500 == 0: print(f"  {j}/{len(meine)}", flush=True)
    os.makedirs(ziel, exist_ok=True)
    json.dump({"ok": ok, "fehler": fehler}, open(os.path.join(ziel, "kopie.json"), "w"))
    groesse = sum(os.path.getsize(os.path.join(d, f)) for d, _, fs in os.walk(ziel) for f in fs)
    print(f"::notice::Kopie {i}/{n}: {len(ok)} kopiert, {len(fehler)} Fehler, {groesse // 1024 // 1024} MB")


if __name__ == "__main__":
    try:
        haupt()
    except Exception:
        import traceback
        t = traceback.format_exc(); print(t)
        print("::error::" + t[-1500:].replace("%", "%25").replace("\r", "").replace("\n", "%0A"))
        sys.exit(1)
