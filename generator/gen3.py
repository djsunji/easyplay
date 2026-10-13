src=open('../index.html',encoding='utf-8').read()
src=src.replace("navigator.serviceWorker.register","void 0&&navigator.serviceWorker.register")
common=open('common.css').read()+open('HB.css').read()
LOGO='<img class="vlogo" src="${ICON_SRC}" alt="easyplay">'
def kopf(lvl='7',txt='Level 7 · Entdecker',w='64',m='🪙 245',extra=''):
  return ('<div class="oben">'+LOGO+'<div><div class="vs-slogan">Spiel dich schlau!</div><div class="vcard profil"><span class="lvl">'+lvl+'</span><div style="flex:1"><small>'+txt+'</small><div class="vbar"><i style="width:'+w+'%"></i></div></div><span class="m">'+m+'</span>'+extra+'</div></div></div>')
V={}
# H2 Gipfel
flags=[(14,86,'🏁','Start',''),(32,64,'🚩','1000 m',''),(50,44,'🚩','2000 m',''),(66,28,'🚩','3000 m','zu'),(80,10,'🏆','4478 m','zu')]
fl=''.join(f'<div class="flag {c}" style="left:{x}%;top:{y}%"><b>{e}</b>{t}</div>' for x,y,e,t,c in flags)
V['h2']=('<div class="vsX vsH2 vohneleiste">'+kopf()+
 '<div class="dunkel" style="margin-top:16px"><div class="berg"><div><span class="vtag rot">Gipfel-Challenge</span><div class="vh" style="margin-top:10px">Bezwinge das Matterhorn!</div>'
 '<p>Jede richtige Antwort bringt dich 10 Meter höher. Schaffst du den Gipfel bis Sonntag?</p>'
 '<div class="hoehe">2340 m <small>von 4478 m</small></div><div class="cd"><span>3<small>Tage</small></span><span>14<small>Std</small></span><span>22<small>Min</small></span></div><br><span class="gelb">Weiterklettern ⛏️</span></div>'
 '<div class="gipfel"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M0,100 L30,62 L42,70 L80,8 L100,40 L100,100Z" fill="rgba(255,255,255,.18)"/><path d="M80,8 L72,22 L76,20 L80,26 L84,19 L87,20Z" fill="#fff" opacity=".9"/><path d="M14,86 C24,78 28,68 32,64 S44,48 50,44 S62,32 66,28 S76,14 80,10" fill="none" stroke="#FFE34D" stroke-width="1.2" stroke-dasharray="1.5 2.5" vector-effect="non-scaling-stroke" style="stroke-width:4px"/></svg>'
 +fl+'<img class="kletter" src="_vs/m5.webp" alt="" style="left:55%;top:50%;height:100px"></div></div></div>'
 '<div class="grid">'
 '<div class="vcard mission ok"><span class="ic">✅</span><div style="flex:1"><b>5 Fragen am Stück richtig</b><div class="vbar"><i style="width:100%"></i></div></div><em>+50 m</em></div>'
 '<div class="vcard mission"><span class="ic">🇨🇭</span><div style="flex:1"><b>3 Kantone erraten</b><div class="vbar"><i style="width:33%"></i></div></div><em>+80 m</em></div>'
 '<div class="vcard mission"><span class="ic">⚔️</span><div style="flex:1"><b>1 Duell gewinnen</b><div class="vbar"><i style="width:0%"></i></div></div><em>+120 m</em></div>'
 '</div></div>')
# H3 Glücksrad & Stickerheft
icons=['🪙','🎟️','⭐','🧩','🪙','🎁','🃏','💎']
seg=''.join(f'<i style="--a:{22.5+45*k}deg">{e}</i>' for k,e in enumerate(icons))
st=[('🦌','Hirsch',''),('🦅','Adler','gold'),('🐻','Bär',''),('🦫','Biber','neu'),('🐐','Steinbock',''),('?','','zu'),('🦊','Fuchs',''),('?','','zu'),('🐿️','Eichhörnchen',''),('?','','zu')]
stk=''.join(f'<div class="sticker {c}">{e}<small>{t}</small></div>' for e,t,c in st)
V['h3']=('<div class="vsX vsH3 vohneleiste">'+kopf()+
 '<div class="grid"><div class="vcard rad"><span class="vtag rot">🎡 Tägliches Glücksrad</span><div class="radwrap"><span class="zeiger">🔻</span><div class="scheibe">'+seg+'</div><div class="mitte">DREHEN</div></div><p class="vsub">1 Dreh gratis pro Tag, weitere mit 5 richtigen Antworten</p><img src="_vs/m6.webp" alt=""></div>'
 '<div class="vcard album"><div class="albumkopf"><div><span class="vtag">📒 Stickerheft</span><div class="vh" style="margin-top:6px">Tiere der Schweiz</div><p class="vsub">Sammle alle 30 Sticker und gewinne ein goldenes Album</p></div><div style="min-width:160px"><b>14 / 30</b><div class="vbar"><i style="width:47%"></i></div></div></div><div class="seiten">'+stk+'</div></div></div>'
 '<div class="reihe"><div class="vcard shop"><span class="ic">🛹</span><div><b>Milo als Skater</b><small class="vsub">Neues Outfit</small></div><em>🪙 300</em></div>'
 '<div class="vcard shop"><span class="ic">🎴</span><div><b>Sticker-Päckli</b><small class="vsub">3 zufällige Sticker</small></div><em>🪙 120</em></div>'
 '<div class="vcard shop"><span class="ic">🃏</span><div><b>Joker 50:50</b><small class="vsub">Zwei falsche weg</small></div><em>🪙 80</em></div></div></div>')
# H4 Team
V['h4']=('<div class="vsX vsH4 vohneleiste">'+kopf()+
 '<div class="dunkel" style="margin-top:16px;padding:0"><div class="duell"><div class="mitte"><span class="vtag rot">Team-Woche</span><div class="vh" style="margin-top:8px">Team Lumi gegen Team Milo</div><p style="margin:4px 0 0">Jede richtige Antwort zählt für dein Team. Wer gewinnt diese Woche?</p></div>'
 '<div class="team t-l"><div class="name">Team Lumi</div><div class="pkt">12 480</div><span class="du">⭐ Dein Team</span><br><img src="_vs/m2.webp" alt=""></div><div class="vs">VS</div>'
 '<div class="team t-r"><div class="name">Team Milo</div><div class="pkt">10 630</div><br><img src="_vs/j2.webp" alt=""></div>'
 '<div class="tau"><i>⚡</i></div></div></div>'
 '<div class="grid"><div class="vcard live"><span class="vtag rot">● Live</span><ul><li>🦊 Fuchs_12 <span class="p">Team Lumi</span><em class="p">+30</em></li><li>🚀 Rakete7 <span class="b">Team Milo</span><em class="b">+20</em></li><li>🐼 Panda_Mia <span class="p">Team Lumi</span><em class="p">+50</em></li></ul></div>'
 '<div class="vcard beitrag"><span class="vtag">💪 Dein Beitrag</span><div class="gross">340</div><p class="vsub">Punkte für Team Lumi · Platz 12 im Team</p></div>'
 '<div class="vcard"><span class="vtag gruen">🎁 Siegerpreis</span><div class="vh" style="margin-top:8px">Goldener Team-Rahmen</div><p class="vsub">Für alle im Siegerteam. Endet in 3 Tagen 14 Std.</p></div></div></div>')
# H5 Pass
stufen=[('ok','🪙','50 Münzen'),('ok','🦌','Sticker'),('ok','🖼️','Rahmen'),('ok','🪙','100 Münzen'),('ok','🃏','Joker'),('jetzt','<img src="_vs/m3.webp" alt="">','Lumi Outfit'),('zu','🪙','150 Münzen'),('zu','🌟','Gold-Sticker'),('zu','🏔️','Hintergrund'),('zu','<img src="_vs/j8.webp" alt="">','Milo Outfit')]
sp=''.join(f'<div class="stufe {c}"><div class="belohnung">{e}<small>{t}</small></div><span class="nr">{k+1}</span></div>' for k,(c,e,t) in enumerate(stufen))
V['h5']=('<div class="vsX vsH5 vohneleiste">'+kopf('6','Herbst-Pass · Stufe 6 von 20','70','🪙 245')+
 '<div class="dunkel pass" style="margin-top:16px"><div class="passkopf"><div><span class="vtag rot">🍂 Herbst-Pass</span><div class="vh" style="margin-top:8px">Sammle XP und schalte Belohnungen frei</div><p style="margin:2px 0 0">Alles gratis. Noch 18 Tage bis zum Winter-Pass.</p></div><span class="gelb">Belohnung abholen 🎁</span></div><div class="spur">'+sp+'</div></div>'
 '<div class="grid"><div class="vcard aufgaben"><span class="vtag">✅ Heutige Aufgaben</span><ul><li class="ok"><span class="box">✓</span><span>Spiele das Tagesquiz</span><em>+50 XP</em></li><li class="ok"><span class="box">✓</span><span>Lies einen Artikel in der Bibliothek</span><em>+30 XP</em></li><li><span class="box"></span><span>Beantworte 3 Fragen zur Schweiz</span><em>+40 XP</em></li></ul></div>'
 '<div class="vcard zimmer"><span class="vtag">🏠 Dein Zimmer</span><div class="figuren"><span class="deko" style="left:6%;top:10%">🖼️</span><span class="deko" style="right:8%;top:6%">🏆</span><span class="deko" style="left:12%;bottom:10px">🪴</span><span class="deko" style="right:10%;bottom:8px">🎒</span><img src="_vs/m4.webp" alt=""><img src="_vs/j5.webp" alt=""></div><div class="boden"></div></div></div></div>')
for k,html in V.items():
  css=common+open(f'{k.upper()}.css').read()
  html=html.replace('`','\\`')
  js='<script>(function(){const o=window.renderHome;window.renderHome=function(){o.apply(this,arguments);const h=document.querySelector(".hero");if(!h)return;h.classList.add("vs");h.innerHTML=`'+html+'`;};})();</script>'
  out=src.replace('</head>','<style id="vs">'+css+'</style></head>',1)
  i=out.rfind('</body>');out=out[:i]+js+out[i:]
  open(f'/mnt/user-data/outputs/easyplay/vorschlag-{k}.html','w',encoding='utf-8').write(out)
print('ok')
