"""Ergebnisse einer Stufe in die fragen-*.json einbauen.
Aufruf: python3 einbau.py <repo> <ergebnisordner> [--schreiben]
Ohne --schreiben nur Bericht (Trockenlauf)."""
import json, glob, os, re, sys, unicodedata, collections

repo, ordner = sys.argv[1], sys.argv[2]
schreiben = '--schreiben' in sys.argv

def norm(s):
    s = unicodedata.normalize('NFKC', s or '').lower()
    s = re.sub(r'[^\w ]', ' ', s)
    return ' '.join(s.split())

def dump(d, fmt):
    if fmt == 'kompakt':
        return json.dumps(d, ensure_ascii=False, separators=(',', ':'))
    return '[\n' + ',\n'.join(json.dumps(q, ensure_ascii=False) for q in d) + '\n]'

# Original laden, Reihenfolge je Datei merken
dateien = {}
alle = {}
for f in sorted(glob.glob(f'{repo}/fragen-*.json')):
    d = json.load(open(f))
    roh = open(f, encoding='utf-8').read()
    fmt = None
    for kand in ('zeilen', 'kompakt'):
        if dump(d, kand) == roh.rstrip('\n'):
            fmt = kand
    if not fmt:
        sys.exit(f'Format von {f} nicht reproduzierbar')
    dateien[f] = (d, roh.endswith('\n'), fmt)
    for q in d:
        alle[q['nr']] = q

# Ergebnisse sammeln (nur Nummern aus dem eigenen Paket)
meldungen = {}
for f in glob.glob(f'{ordner}/ergebnis-*.json'):
    n = re.findall(r'\d+', os.path.basename(f))[0]
    paket = {q['nr'] for q in json.load(open(f'{ordner}/paket-{n}.json'))}
    for e in json.load(open(f)):
        if e.get('nr') in paket:
            meldungen[e['nr']] = e

bericht = collections.Counter()
unsicher = []
doppel = []
geloescht = set()
umgeschrieben = {}
stufe = {}

# 1. Löschungen: nur wenn ein Partner bleibt oder Regelverstoss
loesch = {nr: e for nr, e in meldungen.items() if e.get('aktion') == 'loeschen'}
qnorm = collections.defaultdict(set)
for q in alle.values():
    qnorm[norm(q['q'])].add(q['nr'])
for nr in sorted(loesch):
    e = loesch[nr]
    if e.get('problem') == 'regel':
        geloescht.add(nr); bericht['loeschen regel'] += 1; continue
    partner = {int(x) for x in re.findall(r'\d{1,6}', e.get('grund', '')) if int(x) in alle and int(x) != nr
               and (alle[int(x)]['t'] == alle[nr]['t'] or norm(alle[int(x)]['a'][0]) == norm(alle[nr]['a'][0]))}
    partner |= qnorm[norm(alle[nr]['q'])] - {nr}
    if partner - geloescht:
        geloescht.add(nr); bericht['loeschen doppelt'] += 1
    else:
        bericht['loeschen verworfen (kein Partner)'] += 1
        unsicher.append((nr, 'Löschen verworfen, kein bleibender Partner gefunden', e.get('grund', '')))

# 2. Stufe und Umschreiben
for nr, e in meldungen.items():
    if nr in geloescht: continue
    a = e.get('aktion')
    if a == 'stufe' and e.get('stufe') in (1, 2, 3):
        stufe[nr] = e['stufe']; bericht['stufe'] += 1
    elif a == 'umschreiben':
        n = e.get('neu') or {}
        if not n.get('q') or len(n.get('a', [])) != 4 or len(set(map(norm, n['a']))) != 4 or not n.get('e'):
            bericht['umschreiben ungueltig'] += 1
            unsicher.append((nr, 'Umschreiben ungültig, nicht übernommen', e.get('grund', ''))); continue
        txt = json.dumps(n, ensure_ascii=False)
        if 'ß' in txt or '–' in txt or '—' in txt:
            n = json.loads(txt.replace('ß', 'ss').replace(' – ', ', ').replace(' — ', ', ').replace('–', '-').replace('—', '-'))
            bericht['regel automatisch korrigiert'] += 1
        umgeschrieben[nr] = n
    if e.get('unsicher') or e.get('problem') == 'unsicher':
        unsicher.append((nr, 'unsicher', e.get('unsicher') or e.get('grund', '')))

# 3. Doppelte durch Umschreiben (Bilder-Fragen mit Bild vergleichen)
def key(q):
    return norm(q['q']) + '|' + (q.get('img') or '')
bleibt = {nr: q for nr, q in alle.items() if nr not in geloescht}
schluessel = collections.defaultdict(set)
for nr, q in bleibt.items():
    qq = dict(q, **umgeschrieben.get(nr, {}))
    schluessel[key(qq)].add(nr)
for nr in sorted(umgeschrieben):
    n = dict(alle[nr], **umgeschrieben[nr])
    andere = schluessel[key(n)] - {nr}
    if andere:
        del umgeschrieben[nr]; geloescht.add(nr); schluessel[key(n)].discard(nr)
        bericht['umschreiben ergab Doppel, geloescht'] += 1
        doppel.append((nr, sorted(andere)[0], n['q']))
bericht['umschreiben'] = len(umgeschrieben)
bericht['geloescht gesamt'] = len(geloescht)

print(dict(bericht))
json.dump({'geloescht': sorted(geloescht), 'umgeschrieben': sorted(umgeschrieben), 'stufe': stufe,
           'unsicher': unsicher, 'doppel': doppel}, open(f'{ordner}/einbau-bericht.json', 'w'), ensure_ascii=False, indent=1)

if schreiben:
    for f, (d, nl, fmt) in dateien.items():
        out = []
        for q in d:
            nr = q['nr']
            if nr in geloescht: continue
            if nr in umgeschrieben:
                n = umgeschrieben[nr]
                q = dict(q)
                for k in ('q', 'a', 'e'):
                    q[k] = n[k]
                if n.get('m'):
                    q['m'] = n['m']
                else:
                    q.pop('m', None)
            if nr in stufe:
                q = dict(q); q['l'] = stufe[nr]
            out.append(q)
        open(f, 'w', encoding='utf-8').write(dump(out, fmt) + ('\n' if nl else ''))
    print('geschrieben')
