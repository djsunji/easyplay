# Translating easyplay quiz questions into British English

easyplay is a Swiss learning quiz for children and teenagers. Field `l` gives the level: 1 = Explorers (age 6 to 10), 2 = Achievers (age 10 to 15), 3 = Pros (age 15 to 20). The questions should sound natural to English-speaking children (British English).

## Input
A JSON list. Each entry: `nr` (number), `t` (topic), `s` (source/keyword, orientation only), `q` (question), `a` (4 answers, **a[0] is always the correct one**), `e` (explanation), `m` (thing to remember).

## Output
One JSON object, keys = `nr` as a string:
```json
{"1234": {"q": "…", "a": ["correct", "wrong", "wrong", "wrong"], "e": "…", "m": "…"}}
```
- Answers in exactly the original order (a[0] stays the correct one).
- `e` and `m` only if present in the original.
- Do not output the fields `t`, `l`, `s`.
- If a question makes no sense in English (it asks about German words, rhymes, spelling, German grammar, puns, picture puzzles that build German compound words, or the answer depends on the German wording), output `"1234": null`. Use null rarely; most questions can be translated. German sayings: use a matching English saying if one fits, otherwise ask about “the German saying” and explain its meaning.

## Language
- British English for children and teenagers: clear sentences, "you", friendly, not childish. Achievers and Pros may use technical terms as in the original; Pros questions can be demanding, keep their level.
- British spelling and words: colour, centre, metre, litre, favourite, neighbour, maths, mum, autumn, football, holiday, rubbish, pavement, lorry.
- Numbers stay as digits. Keep units (metres, kilometres, francs). Swiss thousand separators like 1'000 may become 1,000.
- Swiss context stays Swiss: Federal Council, National Council, Council of States, canton, municipality, AHV (old-age insurance), franc, Swiss Post. Place names in the common English form (Zurich, Geneva, Lucerne, Bern, Basel, the Grisons, Ticino, St Gallen, Lake Geneva, Lake Constance); otherwise the local form (umlauts are fine, e.g. Flüeli, Mönch).
- People, works, terms: the usual English form (William Tell, Julius Caesar, Charlemagne).
- Answers as short as in the original; wrong answers must stay wrong and plausible; no two answers the same.
- Quotation marks: English curly quotes “ ” and ‘ ’. Never « » and never „.
- **No dashes as punctuation** (no – or —, and no " - " used as a dash). Hyphens inside words are fine (well-known).
- Do not change the content, do not invent anything, keep facts exact.
- No sex education. Animals and plants: matter-of-fact as in the original.

## Steps
1. Read the input file.
2. Translate and save as one JSON object with the Write tool (path given in the task).
3. Check: `python3 /home/claude/easyplay/tools/uebersetzung-en/pruefe.py <output.json> <input.json>` and fix every error until it prints "OK".
4. At the end reply with one line only: number translated, number null, "OK".
