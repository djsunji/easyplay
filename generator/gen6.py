exec(open('gen3.py').read().split('V={}')[0])
V={}
CD='<div class="cd"><span>3<small>Tage</small></span><span>14<small>Std</small></span><span>22<small>Min</small></span></div>'
def karte(tag,titel,text,knopf,inhalt,cls='dunkel'):
  return ('<div class="'+cls+'" style="margin-top:16px"><div class="kopfz"><div><span class="vtag rot">'+tag+'</span><div class="vh" style="margin-top:8px">'+titel+'</div><p style="margin:4px 0 0">'+text+'</p></div><div>'+CD+'<br><span class="gelb">'+knopf+'</span></div></div>'+inhalt+'</div>')
def obj(x,y,em,txt,cls='',size='3rem',lab='g'):
  return f'<div class="obj {cls}" style="left:{x}%;top:{y}%"><b style="font-size:{size}">{em}</b><span class="lab {lab}" style="position:static;transform:none;display:inline-block;margin-top:4px">{txt}</span></div>'
BEI=lambda a,b,c: ('<div class="grid"><div class="vcard" style="text-align:center"><span class="vtag">💪 Dein Beitrag</span><div class="gross">'+a+'</div><p class="vsub">'+b+'</p></div><div class="vcard"><span class="vtag gruen">🎯 Bonus</span><div class="mi">🔥 <span>5 richtige am Stück</span><em>Turbo 2×</em></div><div class="mi">📅 <span>Tagesquiz spielen</span><em>+50</em></div><div class="mi">⚔️ <span>1 Duell gewinnen</span><em>+100</em></div></div><div class="vcard"><span class="vtag rot">🏆 Preis</span><p class="vsub" style="margin-top:8px">'+c+'</p></div></div>')
# N1 Weltall
V['n1']=('<div class="vsX vsN vsN1 vohneleiste">'+kopf()+karte('Weltraum-Mission','Team Lumi und Team Milo fliegen zu den Planeten','Jede richtige Antwort ist Treibstoff für die Rakete deines Teams.','Treibstoff tanken 🚀',
 '<div class="szene"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M6,88 Q30,30 52,48 T96,12" fill="none" stroke="rgba(255,255,255,.55)" stroke-dasharray="2 8" stroke-linecap="round" vector-effect="non-scaling-stroke" style="stroke-width:3px"/></svg>'
 +obj(6,86,'🌍','Erde','', '3.4rem')+obj(28,46,'🌙','Mond ✓','','3rem')+obj(52,50,'🔴','Mars','','3.4rem','p')+obj(74,32,'🪐','Saturn','zu','3.8rem','zu')+obj(94,12,'🌟','Fernster Stern','zu','3rem','zu')
 +'<span class="rakete" style="left:44%;top:42%;--g:#FF7AD9">🚀</span><span class="lab p" style="left:44%;top:24%">Team Lumi</span><span class="rakete" style="left:35%;top:56%;--g:#8FA6FF">🚀</span><span class="lab b" style="left:34%;top:72%">Team Milo</span>'
 +'<img class="fig" src="_vs/m5.webp" alt="" style="left:64%;top:100%;height:120px"><img class="fig" src="_vs/j3.webp" alt="" style="left:16%;top:62%;height:110px"></div>')+BEI('+340 l','Treibstoff für Team Lumi diese Woche','Das Siegerteam bekommt das Abzeichen «Astronaut» und einen Weltraum-Hintergrund.')+'</div>')
# N2 Schatzinsel
V['n2']=('<div class="vsX vsN vsN2 vohneleiste">'+kopf()+karte('Schatzinsel','Wer findet zuerst den Schatz?','Segle von Insel zu Insel. Auf jeder Insel wartet ein Teil der Schatzkarte.','Segel setzen ⛵',
 '<div class="szene"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M6,80 C20,60 30,90 42,62 S64,30 74,52 S90,30 94,16" fill="none" stroke="#FFF4D6" stroke-dasharray="1 7" stroke-linecap="round" vector-effect="non-scaling-stroke" style="stroke-width:4px"/></svg>'
 +obj(6,82,'🏝️','Start','','3rem')+obj(30,74,'🏝️','Kokos-Insel ✓','','3rem')+obj(48,48,'🏝️','Papageien-Insel','','3.4rem','p')+obj(74,54,'🌋','Vulkan-Insel','zu','3.2rem','zu')+obj(93,14,'💰','Schatz','zu','3.4rem','zu')
 +'<span class="schiff" style="left:42%;top:58%">⛵</span><span class="lab p" style="left:42%;top:42%">Team Lumi</span><span class="schiff" style="left:22%;top:66%;filter:hue-rotate(180deg)">⛵</span><span class="lab b" style="left:18%;top:52%">Team Milo</span>'
 +'<img class="fig" src="_vs/m7.webp" alt="" style="left:62%;top:98%;height:120px"><img class="fig" src="_vs/j6.webp" alt="" style="left:84%;top:98%;height:120px"></div>')
 +'<div class="grid"><div class="vcard"><span class="vtag">🗺️ Schatzkarte</span><div class="vh" style="margin-top:6px">3 von 6 Teilen</div><div class="teile"><span>🧩</span><span>🧩</span><span>🧩</span><span class="zu">?</span><span class="zu">?</span><span class="zu">?</span></div></div><div class="vcard" style="text-align:center"><span class="vtag">💪 Dein Beitrag</span><div class="gross">+34</div><p class="vsub">Seemeilen für Team Lumi</p></div><div class="vcard"><span class="vtag rot">🏆 Im Schatz</span><p class="vsub" style="margin-top:8px">Piraten-Outfit für Lumi oder Milo, 200 Münzen und der Sticker «Kapitän».</p></div></div></div>')
# N3 Zug
halte=[(6,'Genf','ok'),(27,'Bern','ok'),(50,'Luzern',''),(73,'Zürich',''),(94,'St. Gallen','')]
hh=''.join(f'<div class="halt {c}" style="left:{x}%;top:92%"><i></i><span>{n}</span></div>' for x,n,c in halte)
def zug(x,y,c,img,n): return f'<div class="zug" style="left:{x}%;bottom:calc({100-y}% + 4px);--c:{c}"><img src="_vs/{img}" alt="">'+'<span class="wg"></span>'*n+'<span class="lok"></span></div>'
V['n3']=('<div class="vsX vsN vsN3 vohneleiste">'+kopf()+karte('Zugreise Schweiz','Mit dem Zug von Genf nach St. Gallen','Jede richtige Antwort bringt deinen Zug weiter. An jedem Halt gibt es Fragen zur Stadt.','Einsteigen 🚆',
 '<div class="szene"><div class="gleis" style="top:44%"></div><div class="gleis" style="top:76%"></div>'+hh+zug(48,44,'#E043B8','m4.webp',3)+zug(30,76,'#3D5AFE','j4.webp',2)+'<span class="lab p" style="left:40%;top:14%">Team Lumi · fast in Luzern</span><span class="lab b" style="left:22%;top:50%">Team Milo · nach Bern</span></div>')
 +'<div class="grid"><div class="vcard billett" style="grid-column:span 2;padding:0"><div class="l"><span class="vtag">🎫 Dein Billett</span><div class="vh" style="margin-top:6px">Nächster Halt: Luzern</div><small>Bonus-Frage: Wie heisst die berühmte Holzbrücke in Luzern?</small></div><div class="r">+50<br><small style="font-size:.7rem">Bonus-km</small></div></div><div class="vcard" style="text-align:center"><span class="vtag">💪 Dein Beitrag</span><div class="gross">+34 km</div><p class="vsub">für Team Lumi</p></div></div></div>')
# N4 Tierpark
gehege=[('🦁','Löwe','',''),('🐘','Elefant','',''),('🐧','Pinguin','wasser',''),('🦒','Giraffe','','neu'),('🐬','Delfin','wasser',''),('🦓','Zebra','',''),('🐼','Panda','',''),('🐊','Krokodil','wasser',''),('🦘','Känguru','bald',''),('🔒','','zu',''),('🔒','','zu',''),('🔒','','zu','')]
gg=''.join((f'<div class="gehege bald">{e}<small>{n}</small><div class="vbar"><i style="width:70%"></i></div></div>' if c=='bald' else f'<div class="gehege {c} {x}">{e}<small>{n}</small></div>') for e,n,c,x in gehege)
V['n4']=('<div class="vsX vsN vsN4 vohneleiste">'+kopf()+'<div class="dunkel" style="margin-top:16px;padding-bottom:28px"><div class="kopfz"><div><span class="vtag rot">Team-Tierpark</span><div class="vh" style="margin-top:8px">Baut zusammen den grössten Tierpark</div><p style="margin:4px 0 0">Alle 50 richtigen Antworten zieht ein neues Tier bei Team Lumi ein. Wer hat am Sonntag mehr Tiere?</p></div><div>'+CD+'<br><span class="gelb">Futter sammeln 🥕</span></div></div>'
 '<div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap"><span class="lab p" style="position:static;transform:none">🩷 Team Lumi · 8 Tiere</span><span class="lab b" style="position:static;transform:none">💙 Team Milo · 6 Tiere</span></div>'
 '<div class="park">'+gg+'</div><img class="kids" src="_vs/duo5.webp" alt=""></div>'+BEI('+34','Futter für den Tierpark von Team Lumi','Das Siegerteam bekommt ein goldenes Tier für sein Profil und den Sticker «Tierpfleger».')+'</div>')
# N5 Liga
tab=[('1.','🩷 Team Lumi','12 Pkt',''),('2.','💙 Team Milo','10 Pkt',''),('3.','🦊 Füchse','9 Pkt',''),('4.','🐻 Bären','7 Pkt',''),('5.','🦅 Adler','4 Pkt','')]
tt=''.join(f'<tr class="{"du" if i==0 else ""}"><td>{a}</td><td>{b}</td><td>{c}</td></tr>' for i,(a,b,c,d) in enumerate(tab))
V['n5']=('<div class="vsX vsN vsN5 vohneleiste">'+kopf()+'<div class="rasen" style="margin-top:16px"><div class="kopfz"><div><span class="vtag rot">Wissens-Liga · Spieltag 5</span><div class="vh" style="margin-top:8px">Jede richtige Antwort ist ein Tor!</div><p style="margin:4px 0 0">Das Spiel dauert bis Sonntag. Danach gibt es die neue Tabelle.</p></div><div><span class="gelb">Aufs Feld ⚽</span></div></div>'
 '<div class="spiel"><div class="mann"><img src="_vs/m8.webp" alt=""><b>Team Lumi</b></div><div class="tafel"><div class="stand">3<span>:</span>2</div><small>⏱ noch 3 Tage 14 Std</small></div><div class="mann"><img src="_vs/j2.webp" alt=""><b>Team Milo</b></div></div></div>'
 '<div class="grid"><div class="vcard"><span class="vtag">📋 Tabelle</span><table>'+tt+'</table></div><div class="vcard" style="text-align:center"><span class="vtag">⚽ Deine Tore</span><div class="gross">7</div><p class="vsub">Du bist Torschützenkönig in Team Lumi!</p></div><div class="vcard"><span class="vtag gruen">🎯 Bonus</span><div class="mi">🔥 <span>5 richtige am Stück</span><em>Doppeltor</em></div><div class="mi">🧤 <span>Fehlerfrei 10 Fragen</span><em>Zu null</em></div><div class="mi">🏆 <span>Meister am Saisonende</span><em>Pokal</em></div></div></div></div>')
for k,html in V.items():
  css=common+open('N.css').read()
  html=html.replace('`','\\`')
  js='<script>(function(){const o=window.renderHome;window.renderHome=function(){o.apply(this,arguments);const h=document.querySelector(".hero");if(!h)return;h.classList.add("vs");h.innerHTML=`'+html+'`;};})();</script>'
  out=src.replace('</head>','<style id="vs">'+css+'</style></head>',1)
  i=out.rfind('</body>');out=out[:i]+js+out[i:]
  open(f'/mnt/user-data/outputs/easyplay/vorschlag-{k}.html','w',encoding='utf-8').write(out)
print('ok')
