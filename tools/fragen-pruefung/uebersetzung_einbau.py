"""Übersetzungen nach dem Einbau anpassen.
Aufruf: python3 uebersetzung_einbau.py <repo> <einbau-bericht.json> [uebersetzung.json]
Gelöschte Fragen werden aus welten/i18n/<lang>/q-*.json entfernt, neu übersetzte ersetzt.
Umgeschriebene Fragen ohne neue Übersetzung werden ebenfalls entfernt (sonst stünde die alte Frage da)."""
import json, glob, sys

repo, bericht = sys.argv[1], json.load(open(sys.argv[2]))
neu = json.load(open(sys.argv[3])) if len(sys.argv) > 3 else {}
weg = {str(n) for n in bericht['geloescht']}
geaendert = {str(n) for n in bericht['umgeschrieben']}

for lang in ('fr', 'it'):
    tr = neu.get(lang, {})
    for f in sorted(glob.glob(f'{repo}/welten/i18n/{lang}/q-*.json')):
        roh = open(f, encoding='utf-8').read()
        d = json.loads(roh)
        fmt = None
        for kand, dump in (('kompakt', lambda x: json.dumps(x, ensure_ascii=False, separators=(',', ':'))),
                           ('normal', lambda x: json.dumps(x, ensure_ascii=False)),
                           ('eingerueckt', lambda x: json.dumps(x, ensure_ascii=False, indent=1))):
            if dump(d) == roh.rstrip('\n'):
                fmt = dump
        if not fmt:
            sys.exit(f'Format von {f} unbekannt')
        alt = dict(d)
        for k in list(d):
            if k in weg:
                del d[k]
            elif k in geaendert:
                if k in tr:
                    d[k] = tr[k]
                else:
                    del d[k]
        if d != alt:
            open(f, 'w', encoding='utf-8').write(fmt(d) + ('\n' if roh.endswith('\n') else ''))
            print(f, len(alt), '->', len(d))
