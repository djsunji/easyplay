# Translating easyplay library articles into Italian

easyplay is a Swiss learning website for children and teenagers (age 6 to 20). Its library has about 16,000 short encyclopedia articles written in German (Swiss spelling). You translate them into Italian for Italian-speaking children in Switzerland (Ticino, Italian-speaking Grisons): standard Italian with Swiss Italian terms.

## Input
A JSON list of articles. Each entry: `k` (key), `t` (German title), `b` (book), `kap` (chapter, orientation only), `teile` with:
- `einleitung` (intro paragraph)
- `wichtigste` (list of key points)
- `abschnitte` (list of sections: `emoji`, `titel`, `text`)
- `begriffe` (optional list of glossary terms: `wort`, `erklaerung`)
- `gewusst` (list of "did you know" facts)

## Output
One JSON object, keys = `k`:
```json
{"t9oiqxq": {"t": "translated title", "teile": {"einleitung": "…", "wichtigste": ["…"], "abschnitte": [{"emoji": "🏔️", "titel": "…", "text": "…"}], "begriffe": [{"wort": "…", "erklaerung": "…"}], "gewusst": ["…"]}}}
```
- Same structure and the same number of entries in every list, same order. Keep each `emoji` exactly as it is. Omit `begriffe` if the original has none. Do not output `b`, `kap` or `v`.
- Translate everything: title, intro, key points, section titles and texts, glossary words and explanations, facts. Leave nothing out and add nothing.
- Keep the `**bold**` markers around the matching translated words (always in pairs).
- Titles: the usual Italian name of the thing (e.g. Moorschutz → Protezione delle paludi, Aare → Aar, Bern → Berna). Proper names that have no Italian form stay as they are.
- Glossary `wort`: the Italian term; `erklaerung` explains it.
- Articles about the German language (grammar, spelling, German words, sayings): keep the German examples in German inside quotes and explain them in Italian (e.g. la parola tedesca «Haus» significa «casa»). Do the same for articles about other languages: keep the foreign examples and explain in Italian.

## Language
- Swiss Italian: Consiglio federale, Consiglio nazionale, Consiglio degli Stati, cantone, comune, AVS, franco (franchi), Posta, FFS.
- Swiss place names in their Italian form: Zurigo, Ginevra, Lucerna, Berna, Basilea, Grigioni, Ticino, San Gallo, Argovia, Turgovia, Soletta, Friborgo, Vallese, Neuchâtel, Sciaffusa, Appenzello, Glarona, Uri, Svitto, Obvaldo, Nidvaldo, Zugo, Giura, Vaud, Lago Lemano, Lago di Costanza, Lago dei Quattro Cantoni, Aar.
- People and works in their usual Italian form (Guglielmo Tell, Giulio Cesare, Carlo Magno).
- Use “tu” when the text addresses the reader. Quotation marks « » or “ ”. Apostrophes ’ or '. For a minus sign write “meno” or “−”.
- Clear, friendly language for children and teenagers, not childish. Keep the level and the facts of the original exactly; do not simplify away details and do not invent anything.
- Numbers stay as digits; keep units (metres, kilometres, francs). Swiss thousand separator 1'000 may be written 1'000 (Swiss style).
- **No dashes as punctuation** (no – or —, and no " - " used as a dash). Rewrite with a comma, colon or a new sentence. Hyphens inside words are fine.
- Never use „ quotation marks. Never use ß.
- No sex education. Animals and plants: matter-of-fact as in the original.

## Steps
1. Read the input file.
2. Translate. The files are large: work in parts (for example 5 articles at a time) and write each part as its own JSON file with the Write tool into your own work folder (given in the task), then merge the parts with a short python script into the output file (path given in the task).
3. Check: `python3 /home/claude/easyplay/tools/uebersetzung-bib/pruefe.py <output.json> <input.json>` and fix every error until it prints "OK".
4. At the end reply with one line per package only: name, number of articles, "OK".
