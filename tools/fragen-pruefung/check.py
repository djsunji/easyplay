import json,sys,glob,os,re
d=sys.argv[1]
bad=0;tot=0
for f in sorted(glob.glob(f'{d}/ergebnis-*.json'),key=lambda x:int(re.findall(r'\d+',os.path.basename(x))[0])):
    n=re.findall(r'\d+',os.path.basename(f))[0]
    p={q['nr']:q for q in json.load(open(f'{d}/paket-{n}.json'))}
    try: r=json.load(open(f))
    except Exception as e: print(f,'UNGUELTIG',e); bad+=1; continue
    for e in r:
        tot+=1
        prob=[]
        if e.get('nr') not in p: prob.append('nr fremd')
        a=e.get('aktion')
        if a=='umschreiben':
            nq=e.get('neu') or {}
            if not nq.get('q') or len(nq.get('a',[]))!=4 or len(set(nq['a']))!=4: prob.append('neu kaputt')
            t=json.dumps(nq,ensure_ascii=False)
            if 'ß' in t or '–' in t or '—' in t: prob.append('regel')
        elif a=='stufe':
            if e.get('stufe') not in (1,2,3): prob.append('stufe fehlt')
        elif a=='loeschen' or a is None and e.get('problem')=='unsicher': pass
        else: prob.append(f'aktion {a}')
        if prob: bad+=1; print(n,e.get('nr'),prob)
print('gemeldet',tot,'Fehler',bad)
