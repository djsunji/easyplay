"""Entdecker-Fragen prüfen: zu schwierige oder unpassende Fragen von Stufe 1 auf Stufe 2 schieben.

Entdecker ist für 6 bis 9 Jahre. Eine Frage der Stufe 1 kommt zu den Könnern (Stufe 2), wenn
  - ihr Thema nicht zu dieser Altersgruppe passt (Diktatur, Kommunismus),
  - sie heikle Inhalte hat (Nationalsozialismus, Weltkriege, Folter, Mord, Terror, Drogen …),
  - Frage oder richtige Antwort eine Jahreszahl, ein Jahrhundert, «v. Chr.» oder Prozent verlangt,
  - Frage oder Antwort sehr lange Fachwörter oder Abkürzungen (UNO, FIFA …) enthalten,
  - ein Sprachmodell (trainiert auf Stufe 1 gegen Stufe 3) sie klar als «Profi-Frage» einstuft.
Es wird nichts gelöscht, nur das Feld "l" geändert. Bericht: tools/entdecker_bericht.tsv

Braucht scikit-learn:  pip install scikit-learn
Aufruf im Repo-Ordner:  python3 tools/entdecker_pruefen.py [--nur-bericht]
"""
import glob, json, re, sys

THEMEN_NEIN = {"pol_diktatur", "pol_kommunismus"}
HEIKEL = re.compile(r"diktatur|diktator|holocaust|\bkz\b|konzentrationslager|völkermord|genozid|hinricht|folter|ermord|mörder|\bmord(e|en|es)?\b|"
                    r"selbstmord|suizid|atombombe|hiroshima|hitler|\bnazi|nationalsozial|\bnsdap|gestapo|stalin|mussolini|"
                    r"terror|anschlag auf|attentat|kokain|heroin|drogenhandel|vergewalt|prostitu|erschoss|enthaupt|guillotine|gaskammer|"
                    r"massaker|weltkrieg|bürgerkrieg|bücherverbrennung|judenverfolg|deportier|\bleiche")
JAHR = re.compile(r"\b1\d{3}\b|\b20[0-2]\d\b|v\.\s?chr|n\.\s?chr|jahrhundert|in welchem jahr|seit wann|prozent|%")
ABK = re.compile(r"\b[A-ZÄÖÜ]{3,}\b")
ABK_OK = {"PET", "SOS", "SBB", "USA", "ABC", "SRF", "UFO", "LED", "CHF", "WWF"}
GRENZE_KI = 0.6


def lang_wort(s):
    return any(len(w) >= 21 for w in re.findall(r"[\wäöüÄÖÜ]+", s))


def ki_werte(alle):
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression
    from sklearn.model_selection import cross_val_predict
    from scipy.sparse import hstack
    s = [q for q in alle if q.get("l") in (1, 3)]
    txt = [q["q"] + " || " + " | ".join(q["a"]) for q in s]
    x = hstack([TfidfVectorizer(ngram_range=(1, 2), min_df=3, sublinear_tf=True).fit_transform(txt),
                TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5), min_df=5, sublinear_tf=True,
                                max_features=300000).fit_transform(txt)]).tocsr()
    y = [int(q["l"] == 3) for q in s]
    p = cross_val_predict(LogisticRegression(C=2, max_iter=2000, random_state=0), x, y, cv=5,
                          method="predict_proba")[:, 1]
    return {q["nr"]: float(v) for q, v in zip(s, p) if q["l"] == 1}


def grund(q, ki):
    frage, richtig = q["q"], q["a"][0]
    kern = (frage + " " + richtig).lower()
    if q["t"] in THEMEN_NEIN:
        return "thema"
    if HEIKEL.search((kern + " " + q.get("e", "") + " " + q.get("m", "")).lower()):
        return "heikel"
    if JAHR.search(kern):
        return "jahr/prozent"
    if lang_wort(frage + " " + richtig) or set(ABK.findall(frage + " " + richtig)) - ABK_OK:
        return "fachwort"
    if q["t"] != "mathe" and ki.get(q["nr"], 0) > GRENZE_KI:
        return "ki"
    return None


def main():
    dateien = sorted(glob.glob("fragen-*.json"), key=lambda f: int(re.findall(r"\d+", f)[0]))
    daten = {f: json.load(open(f, encoding="utf-8")) for f in dateien}
    alle = [q for d in daten.values() for q in d]
    ki = ki_werte(alle)
    bericht, zahl = [], {}
    for f, d in daten.items():
        for q in d:
            if q.get("l") != 1:
                continue
            g = grund(q, ki)
            if g:
                zahl[g] = zahl.get(g, 0) + 1
                bericht.append(f"{q['nr']}\t{q['t']}\t{g}\t{q['q']}\t{q['a'][0]}")
                q["l"] = 2
    with open("tools/entdecker_bericht.tsv", "w", encoding="utf-8") as o:
        o.write("nr\tthema\tgrund\tfrage\tantwort\n" + "\n".join(bericht) + "\n")
    print(len(bericht), "Fragen von Entdecker zu Könner:", zahl)
    if "--nur-bericht" in sys.argv:
        return
    for f, d in daten.items():
        kompakt = open(f, encoding="utf-8").read(2) != "[\n"
        with open(f, "w", encoding="utf-8") as o:
            if kompakt:
                json.dump(d, o, ensure_ascii=False, separators=(",", ":"))
            else:
                o.write("[\n" + ",\n".join(json.dumps(q, ensure_ascii=False) for q in d) + "\n]\n")


if __name__ == "__main__":
    main()
