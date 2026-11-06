# Translating easyplay quiz questions into Italian

easyplay is a Swiss learning quiz for children and teenagers. Field `l` gives the level: 1 = Explorers (age 6 to 10), 2 = Achievers (age 10 to 15). The questions should sound natural to Italian-speaking children in Switzerland (Ticino, Italian-speaking Grisons): standard Italian, with Swiss Italian terms for Swiss things.

## Input
A JSON list. Each entry: `nr` (number), `t` (topic), `s` (source/keyword, orientation only), `q` (question), `a` (4 answers, **a[0] is always the correct one**), `e` (explanation), `m` (thing to remember).

## Output
One JSON object, keys = `nr` as a string:
```json
{"1234": {"q": "…", "a": ["corretta", "sbagliata", "sbagliata", "sbagliata"], "e": "…", "m": "…"}}
```
- Answers in exactly the original order (a[0] stays the correct one).
- `e` and `m` only if present in the original.
- Do not output the fields `t`, `l`, `s`.
- If a question makes no sense in Italian (it asks about German words, rhymes, spelling, German grammar, puns, picture puzzles that build German compound words, or the answer depends on the German wording), output `"1234": null`. Use null rarely; most questions can be translated. German sayings: use a matching Italian saying if one fits, otherwise ask about “il proverbio tedesco” and explain its meaning.
- Questions about English or French words (topics `englisch`, `franzoesisch`, `fremdsprachen`): ask them from Italian, e.g. “Come si dice ‘cane’ in inglese?”, answers stay in the foreign language.

## Language
- Italian for children and teenagers: clear sentences, “tu”, friendly, not childish. Achievers may use technical terms as in the original.
- Swiss Italian conventions: Consiglio federale, Consiglio nazionale, Consiglio degli Stati, cantone, comune, AVS, franco (franchi), Posta, FFS. Swiss place names in their Italian form: Zurigo, Ginevra, Lucerna, Berna, Basilea, Grigioni, Ticino, San Gallo, Argovia, Turgovia, Soletta, Friborgo, Vallese, Neuchâtel, Sciaffusa, Appenzello, Glarona, Uri, Svitto, Obvaldo, Nidvaldo, Zugo, Giura, Vaud, Lago Lemano, Lago di Costanza, Lago dei Quattro Cantoni.
- People, works, terms: the usual Italian form (Guglielmo Tell, Giulio Cesare, Carlo Magno).
- Numbers stay as digits; units as in the original.
- Answers as short as in the original; wrong answers must stay wrong and plausible; no two answers the same.
- Quotation marks: « » or “ ”. Never „. Apostrophes ’ or '.
- **No dashes as punctuation** (no – or —, and no " - " used as a dash). For a minus sign write “meno” or “−”.
- Do not change the content, do not invent anything, keep facts exact.
- No sex education. Animals and plants: matter-of-fact as in the original.

## Steps
1. Read the input file.
2. Translate and save as one JSON object with the Write tool (path given in the task).
3. Check: `python3 /home/claude/easyplay/tools/uebersetzung-it/pruefe.py <output.json> <input.json>` and fix every error until it prints "OK".
4. At the end reply with one line only: number translated, number null, "OK".
