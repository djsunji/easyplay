exec(open('gen3.py').read().split('V={}')[0])
V={}
CD='<div class="cd"><span>3<small>Tage</small></span><span>14<small>Std</small></span><span>22<small>Min</small></span></div>'
BERG='<path d="M0,60 L18,40 L26,46 L50,3 L74,44 L82,38 L100,60Z" fill="rgba(255,255,255,.2)"/><path d="M50,3 L43,15 L47,13 L50,18 L54,12 L57,14Z" fill="#fff" opacity=".95"/>'
# K1 Wettlauf
L='M8,58 L20,46 L16,38 L30,28 L26,20 L40,12 L50,3'; R='M92,58 L80,48 L86,40 L72,32 L76,24 L60,12 L50,3'
V['k1']=('<div class="vsX vsK vohneleiste">'+kopf()+
 '<div class="dunkel" style="margin-top:16px"><div class="kopfz"><div><span class="vtag rot">Gipfel-Wettlauf</span><div class="vh" style="margin-top:8px">Team Lumi gegen Team Milo: Wer steht zuerst auf dem Matterhorn?</div><p style="margin:4px 0 0">Jede richtige Antwort bringt dein Team 10 Meter höher.</p></div><div>'+CD+'<br><span class="gelb">Für mein Team klettern ⛏️</span></div></div>'
 '<div class="szene"><svg viewBox="0 0 100 60" preserveAspectRatio="none">'+BERG+f'<path d="{L}" fill="none" stroke="#FF7AD9" stroke-width="3" stroke-dasharray="1 5" stroke-linecap="round" vector-effect="non-scaling-stroke" style="stroke-width:5px"/><path d="{R}" fill="none" stroke="#8FA6FF" stroke-width="3" stroke-dasharray="1 5" stroke-linecap="round" vector-effect="non-scaling-stroke" style="stroke-width:5px"/></svg>'
 '<div class="lab" style="left:50%;top:0%">🏆 4478 m</div><img class="fig" src="_vs/m5.webp" alt="" style="left:28%;top:40%;height:120px"><div class="lab p" style="left:16%;top:30%">Team Lumi · 3120 m</div>'
 '<img class="fig" src="_vs/j5.webp" alt="" style="left:80%;top:70%;height:120px"><div class="lab b" style="left:88%;top:56%">Team Milo · 2680 m</div></div></div>'
 '<div class="grid"><div class="vcard stand"><span class="vtag">⛰️ Stand</span><ul><li class="du">🩷 Team Lumi <em>3120 m</em></li><li>💙 Team Milo <em>2680 m</em></li></ul></div>'
 '<div class="vcard" style="text-align:center"><span class="vtag">💪 Dein Beitrag</span><div class="gross">+340 m</div><p class="vsub">Du hast dein Team 34 Antworten weit gebracht</p></div>'
 '<div class="vcard"><span class="vtag gruen">🎯 Bonus-Meter</span><div class="mi ok">✅ <span>5 richtige am Stück</span><em>+50 m</em></div><div class="mi">🇨🇭 <span>3 Kantone erraten</span><em>+80 m</em></div><div class="mi">⚔️ <span>1 Duell gewinnen</span><em>+120 m</em></div></div></div></div>')
# K2 Seilschaft
lager=[(6,90,'⛺','Basislager',''),(36,62,'🏕️','Lager 1 · 1500 m',''),(66,34,'🛖','Lager 2 · 3000 m','zu'),(92,8,'🏆','Gipfel 4478 m','zu')]
lg=''.join(f'<div class="lager {c}" style="left:{x}%;top:{y}%"><b>{e}</b>{t}</div>' for x,y,e,t,c in lager)
mit=[(18,79,'🦊',''),(26,71,'🐼',''),(44,55,'⭐','du'),(50,49,'🐸','')]
mt=''.join(f'<div class="mit {c}" style="left:{x}%;top:{y}%">{e}</div>' for x,y,e,c in mit)
crew=[('🐼','Panda_Mia',90,'+620 m'),('⭐','Du',55,'+340 m'),('🦊','Fuchs_12',40,'+260 m'),('🐸','Frosch7',25,'+150 m')]
cr=''.join(f'<div><span>{e}</span><b>{n}</b><div class="vbar"><i style="width:{w}%"></i></div><em>{m}</em></div>' for e,n,w,m in crew)
V['k2']=('<div class="vsX vsK vsK2 vohneleiste">'+kopf()+
 '<div class="dunkel" style="margin-top:16px"><div class="kopfz"><div><span class="vtag rot">Seilschaft</span><div class="vh" style="margin-top:8px">Eure Seilschaft «Klasse 4b» klettert zusammen</div><p style="margin:4px 0 0">24 Kinder, ein Seil, ein Ziel. Ab Lager 2 gibt es für alle einen Sticker.</p></div><div>'+CD+'<br><span class="gelb">Mitklettern ⛏️</span></div></div>'
 '<div class="szene"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M0,100 L30,70 L40,76 L92,6 L100,20 L100,100Z" fill="rgba(255,255,255,.18)"/><path d="M6,90 Q20,84 26,71 T50,49" fill="none" stroke="#FFE34D" stroke-width="4" vector-effect="non-scaling-stroke" style="stroke-width:5px"/><path d="M50,49 Q62,40 66,34 T92,8" fill="none" stroke="#fff" stroke-dasharray="2 6" vector-effect="non-scaling-stroke" style="stroke-width:3px;opacity:.6"/></svg>'
 +lg+mt+'<img class="fig" src="_vs/m6.webp" alt="" style="left:56%;top:58%;height:100px"><img class="fig" src="_vs/j7.webp" alt="" style="left:34%;top:76%;height:110px"><div class="lab" style="left:50%;top:38%">Zusammen 2340 m</div></div></div>'
 '<div class="grid"><div class="vcard" style="grid-column:span 2"><span class="vtag">🧗 Wer zieht am meisten?</span><div class="crew">'+cr+'</div></div>'
 '<div class="vcard"><span class="vtag gruen">🛖 Nächstes Lager</span><div class="vh" style="margin-top:8px">Noch 660 m bis Lager 2</div><p class="vsub">Dort wartet für alle der Sticker «Bergführer».</p></div></div></div>')
# K3 Rennen mehrere Teams
teams=[('🐐','Steinböcke',82,'🥇',''),('🦅','Adler',70,'🥈',''),('🩷','Team Lumi',61,'🥉','du'),('🐿️','Murmeltiere',44,'',''),('🐻','Bären',30,'','')]
def berg(p,du):
  y=100-p
  col='#FFE34D' if du else '#fff'
  return (f'<svg viewBox="0 0 100 100" preserveAspectRatio="none"><defs><clipPath id="c{p}"><path d="M0,100 L50,0 L100,100Z"/></clipPath></defs><path d="M0,100 L50,0 L100,100Z" fill="rgba(255,255,255,.18)"/>'
          f'<rect x="0" y="{y}" width="100" height="{p}" fill="{"rgba(255,227,77,.75)" if du else "rgba(255,255,255,.55)"}" clip-path="url(#c{p})"/><line x1="0" x2="100" y1="{y}" y2="{y}" stroke="{col}" stroke-width="2" vector-effect="non-scaling-stroke" clip-path="url(#c{p})"/></svg>')
bb=''.join(f'<div class="bg {d}"><span class="platz">{pl}</span>'+(f'<img src="_vs/m2.webp" alt="" style="bottom:calc(22% + {p*0.78*0.55}%)">' if d else '')+berg(p,d)+f'<div class="nm">{e} {n}<small>{int(p*44.78)} m</small></div></div>' for e,n,p,pl,d in teams)
V['k3']=('<div class="vsX vsK vsK3 vohneleiste">'+kopf()+
 '<div class="dunkel" style="margin-top:16px"><div class="kopfz"><div><span class="vtag rot">Gipfel-Rennen</span><div class="vh" style="margin-top:8px">5 Teams, 5 Berge, 1 Woche</div><p style="margin:4px 0 0">Dein Team: Team Lumi. Noch 410 m bis zu den Adlern!</p></div><div>'+CD+'<br><span class="gelb">Punkte holen ⛏️</span></div></div>'
 '<div class="berge">'+bb+'</div></div>'
 '<div class="grid"><div class="vcard" style="text-align:center"><span class="vtag">💪 Dein Beitrag</span><div class="gross">+340 m</div><p class="vsub">Noch 410 m bis Platz 2</p></div>'
 '<div class="vcard"><span class="vtag gruen">🎯 Bonus-Meter</span><div class="mi ok">✅ <span>Tagesquiz gespielt</span><em>+50 m</em></div><div class="mi">🇨🇭 <span>3 Kantone erraten</span><em>+80 m</em></div><div class="mi">⚔️ <span>1 Duell gewinnen</span><em>+120 m</em></div></div>'
 '<div class="vcard"><span class="vtag rot">🏆 Preise</span><div class="mi">🥇 <span>Goldener Gipfel-Rahmen</span></div><div class="mi">🥈 <span>Sticker «Adlerauge»</span></div><div class="mi">🥉 <span>100 Münzen für alle</span></div></div></div></div>')
# K4 Zwei Berge mit Hütten
def seite(name,pkt,p,img,farbe,spiegel=False):
  y=100-p
  return (f'<div class="bseite"><div class="t">{name}<b>{pkt}</b></div><svg viewBox="0 0 100 100" preserveAspectRatio="none"><defs><clipPath id="s{name[5]}"><path d="M5,100 L50,22 L95,100Z"/></clipPath></defs><path d="M5,100 L50,22 L95,100Z" fill="rgba(255,255,255,.38)"/>'
          f'<rect x="0" y="{y}" width="100" height="100" fill="{farbe}" opacity=".75" clip-path="url(#s{name[5]})"/><path d="M50,22 L44,33 L48,31 L50,36 L53,30 L56,32Z" fill="#fff"/></svg>'
          f'<img class="fig" src="_vs/{img}" alt="" style="left:50%;top:{y+2}%;height:110px"><div class="lab" style="left:{18 if not spiegel else 82}%;top:66%">🛖 Hütte</div></div>')
V['k4']=('<div class="vsX vsK vsK4 vohneleiste">'+kopf()+
 '<div class="dunkel" style="margin-top:16px"><div class="kopfz"><div><span class="vtag rot">Berg-Duell</span><div class="vh" style="margin-top:8px">Lumis Berg gegen Milos Berg</div><p style="margin:4px 0 0">Wähle dein Team und bring es als erstes auf den Gipfel. Unterwegs gibt es Hütten mit Belohnungen.</p></div><div>'+CD+'<br><span class="gelb">Weiterklettern ⛏️</span></div></div>'
 '<div class="zwei">'+seite('Team Lumi','3120 m',58,'m1.webp','#E043B8')+'<div class="vsz">VS</div>'+seite('Team Milo','2680 m',46,'j1.webp','#3D5AFE',True)+'</div></div>'
 '<div class="huetten"><div class="vcard huette ok"><div class="ic">🛖</div><b>Hörnlihütte</b><small>1000 m · 50 Münzen ✓</small></div><div class="vcard huette ok"><div class="ic">🏕️</div><b>Solvay-Biwak</b><small>2000 m · Sticker ✓</small></div><div class="vcard huette"><div class="ic">🎒</div><b>Schulter</b><small>3500 m · Joker 50:50</small></div><div class="vcard huette zu"><div class="ic">🏆</div><b>Gipfel</b><small>4478 m · Gold-Rahmen fürs Team</small></div></div></div>')
for k,html in V.items():
  css=common+open('K.css').read()
  html=html.replace('`','\\`')
  js='<script>(function(){const o=window.renderHome;window.renderHome=function(){o.apply(this,arguments);const h=document.querySelector(".hero");if(!h)return;h.classList.add("vs");h.innerHTML=`'+html+'`;};})();</script>'
  out=src.replace('</head>','<style id="vs">'+css+'</style></head>',1)
  i=out.rfind('</body>');out=out[:i]+js+out[i:]
  open(f'/mnt/user-data/outputs/easyplay/vorschlag-{k}.html','w',encoding='utf-8').write(out)
print('ok')
