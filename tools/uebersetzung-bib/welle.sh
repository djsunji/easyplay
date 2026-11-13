#!/bin/bash
# Einbauen und pushen der Bibliotheks-Übersetzung. Aufruf: welle.sh fr|it|en
set -e
L=$1; NAME=$(case $L in fr) echo Französisch;; it) echo Italienisch;; en) echo Englisch;; esac)
cd /home/claude/easyplay && git stash -q 2>/dev/null || true; git pull -q; git stash pop -q 2>/dev/null || true
R=$(python3 tools/uebersetzung-bib/einbau.py $L); echo "$R"
A=$(grep -o 'ep-[0-9]\{4\}-[0-9-]*' sw.js | head -1); D=$(TZ=Europe/Zurich date +%Y-%m-%d)
if [ "${A:3:10}" = "$D" ]; then N=$((10#${A:14}+1)); else N=1; fi; NEU=$(printf "ep-%s-%02d" $D $N)
sed -i "s/$A/$NEU/" sw.js; sed -i "s/window.EP_BUILD *= *\"$A\"/window.EP_BUILD=\"$NEU\"/" index.html
grep -q "$NEU" index.html || { echo "EP_BUILD nicht gesetzt"; exit 1; }
python3 - "$NEU" "$R" "$NAME" "$L" <<'P'
import sys,re;n,r,name,l=sys.argv[1:5];p='CLAUDE.md';s=open(p).read();h="## Erledigt (neueste oben)\n"
z=f"- {n[11:13]}.{n[8:10]}. Sitzung «Hauptseite»: Bibliothek {name}: Artikel werden übersetzt (zuletzt {r}; `welten/i18n/{l}/tx/`, Welle mit `tools/uebersetzung-bib/welle.sh {l}`). Kein App-Bau. Version {n}.\n"
s=re.sub(r"- [^\n]{0,12}Sitzung «Hauptseite»: Bibliothek "+name+r": Artikel werden übersetzt.*\n","",s)
s=s.replace(h,h+z,1);open(p,'w').write(s)
P
git add sw.js index.html CLAUDE.md welten/i18n/index.json welten/i18n/$L/tx welten/i18n/$L/titel-*.json tools/uebersetzung-bib/
git add -u welten/i18n/$L/
git commit -qm "Bibliothek $NAME: weitere Artikel übersetzt ($NEU)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015F4ypguKCiePf7SvTB76p6"
timeout 90 git push -q && echo "gepusht $NEU"
