#!/bin/bash
# Einbauen und pushen der Profis-Übersetzung. Aufruf: uebersetzung-welle.sh fr|it|en
set -e
L=$1; Z=/home/claude/fragen-${L}3; NAME=$(case $L in fr) echo Französisch;; it) echo Italienisch;; en) echo Englisch;; esac)
cd /home/claude/easyplay && git stash -q 2>/dev/null || true; git pull -q; git stash pop -q 2>/dev/null || true
R=$(EP_Z=$Z python3 tools/uebersetzung-$L/einbau.py); echo "$R"
A=$(grep -o 'ep-[0-9]\{4\}-[0-9-]*' sw.js | head -1); D=$(TZ=Europe/Zurich date +%Y-%m-%d)
if [ "${A:3:10}" = "$D" ]; then N=$((10#${A:14}+1)); else N=1; fi; NEU=$(printf "ep-%s-%02d" $D $N)
sed -i "s/$A/$NEU/" sw.js; sed -i "s/window.EP_BUILD *= *\"$A\"/window.EP_BUILD=\"$NEU\"/" index.html
grep -q "$NEU" index.html || { echo "EP_BUILD nicht gesetzt"; exit 1; }
GES=$(python3 -c "import json,glob;print(sum(len(json.load(open(f))) for f in glob.glob('welten/i18n/$L/q-*.json')))")
python3 - "$NEU" "$GES" "$R" "$NAME" "$L" <<'P'
import sys,re;n,g,r,name,l=sys.argv[1:6];p='CLAUDE.md';s=open(p).read();h="## Erledigt (neueste oben)\n"
z=f"- {n[11:13]}.{n[8:10]}. Sitzung «Hauptseite»: {name}: Fragen der Stufe Profis werden übersetzt (zuletzt {r}; jetzt {g} Fragen auf {name} in `welten/i18n/{l}/`, Werkzeuge `tools/uebersetzung-{l}/`, Welle mit `tools/uebersetzung-welle.sh {l}`). Kein App-Bau. Version {n}.\n"
s=re.sub(r"- [^\n]{0,12}Sitzung «Hauptseite»: "+name+r": Fragen der Stufe Profis werden übersetzt.*\n","",s)
s=s.replace(h,h+z,1);open(p,'w').write(s)
P
git add sw.js index.html CLAUDE.md welten/i18n/index.json welten/i18n/$L/ tools/uebersetzung-$L/ tools/uebersetzung-welle.sh
git commit -qm "$NAME: weitere Fragen Profis übersetzt ($NEU)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015F4ypguKCiePf7SvTB76p6"
timeout 90 git push -q && echo "gepusht $NEU, total $GES"
