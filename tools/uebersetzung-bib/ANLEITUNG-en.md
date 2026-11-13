# Translating easyplay library articles into British English

easyplay is a Swiss learning website for children and teenagers (age 6 to 20). Its library has about 16,000 short encyclopedia articles written in German (Swiss spelling). You translate them into British English for English-speaking children (British English).

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
- Titles: the usual British English name of the thing (e.g. Moorschutz → Protecting moorland, Aare → River Aare, Bern → Bern). Proper names that have no British English form stay as they are.
- Glossary `wort`: the British English term; `erklaerung` explains it.
- Articles about the German language (grammar, spelling, German words, sayings): keep the German examples in German inside quotes and explain them in British English (e.g. the German word “Haus” means “house”). Do the same for articles about other languages: keep the foreign examples and explain in British English.

## Language
- British spelling and words: colour, centre, metre, litre, favourite, neighbour, maths, mum, autumn, football, holiday, rubbish, pavement, lorry.
- Swiss context stays Swiss: Federal Council, National Council, Council of States, canton, municipality, AVS (old-age insurance), franc, Swiss Post, SBB. Place names in the common English form (Zurich, Geneva, Lucerne, Bern, Basel, the Grisons, Ticino, St Gallen, Lake Geneva, Lake Constance, Lake Lucerne); otherwise the local form.
- People and works in their usual English form (William Tell, Julius Caesar, Charlemagne).
- Use “you” when the text addresses the reader. Quotation marks “ ” and ‘ ’; never « ».
- Clear, friendly language for children and teenagers, not childish. Keep the level and the facts of the original exactly; do not simplify away details and do not invent anything.
- Numbers stay as digits; keep units (metres, kilometres, francs). Swiss thousand separator 1'000 may be written 1,000.
- **No dashes as punctuation** (no – or —, and no " - " used as a dash). Rewrite with a comma, colon or a new sentence. Hyphens inside words are fine.
- Never use „ quotation marks. Never use ß.
- No sex education. Animals and plants: matter-of-fact as in the original.

## Steps
1. Read the input file.
2. Translate. The files are large: work in parts (for example 5 articles at a time) and write each part as its own JSON file with the Write tool into your own work folder (given in the task), then merge the parts with a short python script into the output file (path given in the task).
3. Check: `python3 /home/claude/easyplay/tools/uebersetzung-bib/pruefe.py <output.json> <input.json>` and fix every error until it prints "OK".
4. At the end reply with one line per package only: name, number of articles, "OK".
