# Translating easyplay quiz questions into French

easyplay is a Swiss learning quiz for children and teenagers. Field `l` gives the level: 1 = Explorers (age 6 to 10), 2 = Achievers (age 10 to 15), 3 = Pros (age 15 to 20). The questions should sound natural to French-speaking children in Switzerland (Romandy): standard French with Swiss conventions (septante, huitante, nonante; déjeuner, dîner, souper).

## Input
A JSON list. Each entry: `nr` (number), `t` (topic), `s` (source/keyword, orientation only), `q` (question), `a` (4 answers, **a[0] is always the correct one**), `e` (explanation), `m` (thing to remember).

## Output
One JSON object, keys = `nr` as a string:
```json
{"1234": {"q": "…", "a": ["juste", "faux", "faux", "faux"], "e": "…", "m": "…"}}
```
- Answers in exactly the original order (a[0] stays the correct one).
- `e` and `m` only if present in the original.
- Do not output the fields `t`, `l`, `s`.
- If a question makes no sense in French (it asks about German words, rhymes, spelling, German grammar, puns, picture puzzles that build German compound words, or the answer depends on the German wording), output `"1234": null`. Use null rarely; most questions can be translated. German sayings: use a matching French saying if one fits, otherwise ask about « le proverbe allemand » and explain its meaning.
- Questions about English or French words (topics `englisch`, `franzoesisch`, `fremdsprachen`): ask them from French, e.g. « Comment dit-on ‹ chien › en anglais ? », answers stay in the foreign language.

## Language
- French for children and teenagers: clear sentences, “tu”, friendly, not childish. Achievers and Pros may use technical terms as in the original; Pros questions can be demanding, keep their level.
- Swiss French conventions: Conseil fédéral, Conseil national, Conseil des États, canton, commune, AVS, franc (francs), La Poste, CFF; numbers septante, huitante, nonante. Swiss place names in their French form: Zurich, Genève, Lucerne, Berne, Bâle, Grisons, Tessin, Saint-Gall, Argovie, Thurgovie, Soleure, Fribourg, Valais, Neuchâtel, Schaffhouse, Appenzell, Glaris, Uri, Schwytz, Obwald, Nidwald, Zoug, Jura, Vaud, Lac Léman, Lac de Constance, Lac des Quatre-Cantons.
- People, works, terms: the usual French form (Guillaume Tell, Jules César, Charlemagne).
- Numbers stay as digits; units as in the original.
- Answers as short as in the original; wrong answers must stay wrong and plausible; no two answers the same.
- Quotation marks: « » or “ ”. Never „. Apostrophes ’ or '.
- **No dashes as punctuation** (no – or —, and no " - " used as a dash). For a minus sign write “moins” or “−”.
- Do not change the content, do not invent anything, keep facts exact.
- No sex education. Animals and plants: matter-of-fact as in the original.

Topic `franzoesisch` is not included (French words make no sense to translate into French).

## Steps
1. Read the input file.
2. Translate and save as one JSON object with the Write tool (path given in the task).
3. Check: `python3 /home/claude/easyplay/tools/uebersetzung-fr/pruefe.py <output.json> <input.json>` and fix every error until it prints "OK".
4. At the end reply with one line only: number translated, number null, "OK".
