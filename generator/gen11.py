# T-Runde: 20 moderne, helle Entwürfe, immer mit Lumi und/oder Milo. Aufruf: python3 gen11.py <index.html> <ausgabeordner>
import sys
src=open(sys.argv[1],encoding='utf-8').read()
OUT=sys.argv[2]
src=src.replace("navigator.serviceWorker.register","void 0&&navigator.serviceWorker.register")
common=open('common.css').read()+open('HB.css').read()+open('Q.css').read()+open('S.css').read()+open('T.css').read()
LOGO='<img class="ers-logo" src="${ICON_SRC}" alt="easyplay">'
def buehne(kids=True):
  if not kids: return '<div class="ers-b">'+LOGO+'</div>'
  return '<div class="ers-b"><img class="ers-kid l" src="_vs/spring0.webp" alt="">'+LOGO+'<img class="ers-kid r" src="_vs/spring1.webp" alt=""></div>'
SL='<div class="vs-slogan">Spiel dich schlau!</div>'
PILLS='<div class="vs-pills"><span><b>${allCount().toLocaleString("de-CH")}</b> Fragen</span><span><b>75</b> Themen</span><span><b>3</b> Stufen</span><span>🇨🇭 mit Schweiz-Wissen</span></div>'
CTA='<div class="ers-cta"><span class="ers-btn">▶ Los geht\'s</span><span class="ers-btn weiss">📅 Tagesquiz</span></div>'
HEUTE=[('feuer','🔥','3 Tage Serie','Noch 5 Fragen für heute'),('','📅','Tagesquiz','5 neue Fragen, jeden Tag'),('','🎯','Fehler üben (12)','Falsche Fragen nochmals')]
def heute(extra=''):
  return '<div class="ers-heute">'+''.join(f'<div class="ers-karte {c}">{extra and extra[i]}<span class="em">{e}</span><span><b>{t}</b><small>{s}</small></span></div>' for i,(c,e,t,s) in enumerate(HEUTE))+'</div>'
K=[('k1','📖','Bibliothek','Lesen und entdecken'),('k2','📱','Qeels','Kurze Wissens-Clips'),('k3','⚔️','Wettbewerb &amp; Duell','Gegen Freunde spielen'),('k4','🎲','Zufällige Fragen','Überrasch dich selbst')]
G={'k1':'g1','k2':'g2','k3':'g3','k4':'g4'}
def kacheln(sub=False,hell=False,extra=None):
  return '<div class="ers-kacheln">'+''.join(f'<span class="ers-k {c} {"hell" if hell else ""}">{extra[i] if extra else ""}<i class="{G[c] if hell else ""}">{e}</i><b>{t}</b>{"<small>"+s+"</small>" if sub else ""}</span>' for i,(c,e,t,s) in enumerate(K))+'</div>'
H1='<h3 class="ers-h">Heute für dich</h3>'; H2='<h3 class="ers-h">Was willst du machen?</h3>'
AV=lambda f:f'<span class="t-av"><span><img src="_vs/{f}" alt=""></span></span>'
W=lambda n,inner:'<div class="vsX vsQ vsS vsT vsT'+str(n)+' vohneleiste">'+inner+'</div>'
V={}

V['t1']=W(1,'<div class="t-grid"><div class="t-lumi"><div class="t-bub">Hoi! 👋 Heute noch <b>5 Fragen</b>, dann bleibt deine Serie. 🔥</div><img class="t-fig" src="_vs/m2.webp" alt=""></div>'
 '<div class="t-text">'+buehne(False)+SL+PILLS+CTA+'</div></div>'+H1+heute()+H2+kacheln(True,True))

V['t2']=W(2,'<div class="mcard t-karte"><div class="t-text">'+buehne(False)+SL+PILLS+CTA+'</div><div class="t-duo"><img class="t-fig" src="_vs/duo-winken.webp" alt=""></div></div>'+H1+heute()+H2+kacheln(False,True))

V['t3']=W(3,'<div class="s-kleinbuehne">'+buehne(False)+'</div>'+SL+PILLS+CTA+
 '<div class="mcard t-liegt"><img class="t-fig" src="_vs/liegen.webp" alt=""><h4>Heute für dich</h4><p style="margin:0 0 12px;color:var(--mut)">Lumi hat schon etwas vorbereitet.</p>'+heute()+'</div>'
 +H2+'<div class="t-milo">'+kacheln(True,True)+'<img class="t-fig" src="_vs/zeigen.webp" alt=""></div>')

V['t4']=W(4,'<div class="s-kleinbuehne">'+buehne(False)+'</div>'+SL+PILLS+
 '<div class="t-pills" style="margin-top:14px"><span>🔥 3 Tage Serie <small>noch 5 Fragen</small></span><span>📅 Tagesquiz <small>5 neue</small></span><span>🎯 Fehler üben <small>12</small></span></div>'
 +H2+'<div class="t-zwei"><div class="t-beg l"><small>Mit Lumi</small><h4>📚 Lernen</h4><div class="t-u"><span>📖 Bibliothek</span><span>🎲 Zufällige Fragen</span></div><img src="_vs/m5.webp" alt=""></div>'
 '<div class="t-beg m"><small>Mit Milo</small><h4>🎮 Spielen</h4><div class="t-u"><span>📱 Qeels</span><span>⚔️ Wettbewerb &amp; Duell</span></div><img src="_vs/j5.webp" alt=""></div></div>')

V['t5']=W(5,'<div class="t-blob"><img class="t-kid l t-fig" src="_vs/spring0.webp" alt=""><img class="t-kid r t-fig" src="_vs/spring1.webp" alt="">'+buehne(False)+SL+PILLS+CTA+
 '<div class="t-pills" style="margin-top:16px"><span>🔥 3 Tage Serie</span><span>📅 Tagesquiz: 5 neue</span><span>🎯 12 Fehler üben</span></div></div>'+H2+kacheln(True))

V['t6']=W(6,'<div class="s-kleinbuehne">'+buehne(False)+'</div>'+SL+PILLS+CTA+
 '<div class="t-zeigt"><img class="t-fig" src="_vs/m5.webp" alt=""><div class="mcard t-liste"><h4>📋 Heute für dich</h4>'
 '<div class="t-z ok"><div class="box">✓</div><div><span>Morgenfrage</span><small>1 Frage zum Wachwerden</small></div><em>+10 XP</em></div>'
 '<div class="t-z"><div class="box"></div><div>🔥 Serie halten<small>Noch 5 Fragen für heute</small></div><em>+20 XP</em></div>'
 '<div class="t-z"><div class="box"></div><div>📅 Tagesquiz<small>5 neue Fragen, jeden Tag</small></div><em>+50 XP</em></div>'
 '<div class="t-z"><div class="box"></div><div>🎯 Fehler üben<small>12 falsche Fragen nochmals</small></div><em>+30 XP</em></div></div></div>'
 +H2+'<div class="t-kach">'+kacheln(False,True)+'<img class="t-fig" src="_vs/j8.webp" alt=""></div>')

V['t7']=W(7,'<div class="s-kleinbuehne">'+buehne(False)+'</div>'+SL+PILLS+
 '<div class="t-avs"><div class="t-big">'+AV('m1.webp')+'<b>Lumi</b><small>🔥 3 Tage Serie · noch 5 Fragen</small><span class="ers-btn">▶ Mit Lumi weiter</span></div>'
 '<div class="t-big milo">'+AV('j1.webp')+'<b>Milo</b><small>⚔️ Duell: Milo wartet auf dich</small><span class="ers-btn weiss">Duell annehmen</span></div></div>'
 +H1+heute()+H2+kacheln(False,True))

V['t8']=W(8,'<div class="bento"><div class="b-lumi">'+buehne(False)+SL+'<span class="ers-btn">▶ Los geht\'s</span><img src="_vs/m6.webp" alt=""></div>'
 '<div class="b-milo"><b>Milo fordert dich zum Duell</b><span class="ers-btn">⚔️ Annehmen</span><img src="_vs/j7.webp" alt=""></div>'
 '<div class="b-stat"><small>Serie</small><span class="z">3 🔥</span><p>Noch 5 Fragen für heute</p></div>'
 '<div class="b-stat"><small>Tagesquiz</small><span class="z">5</span><p>neue Fragen, jeden Tag</p></div>'
 +''.join(f'<div class="b-k {G[c]}"><i>{e}</i><span>{t}</span></div>' for c,e,t,s in K)+'</div>')

KK=[('c1','Weiterspielen','Berge der Schweiz','6 von 10 Fragen','m6.webp','▶ Weiter'),('c2','Duell','Milo wartet auf dich','10 Fragen, wer ist schneller?','j6.webp','Annehmen'),('c3','Tagesquiz','5 neue Fragen','Jeden Tag für alle gleich','duo-denken.webp','Spielen'),('c4','Fehler üben','12 Fragen nochmals','Lumi hilft dir dabei','m7.webp','Üben')]
V['t9']=W(9,'<div class="s-kleinbuehne">'+buehne(False)+'</div>'+SL+PILLS+
 '<div class="karussell">'+''.join(f'<div class="kk {c}"><small>{a}</small><b>{b}</b><p>{s}</p><span class="ers-btn">{k}</span><img src="_vs/{img}" alt=""></div>' for c,a,b,s,img,k in KK)+'</div>'+H2+kacheln(False,True))

V['t10']=W(10,'<div class="split"><div class="links">'+SL+'<p>Quiz-Fragen für Kinder und Jugendliche von 6 bis 20, mit viel Schweiz-Wissen.</p><img src="_vs/duo-sitzen2.webp" alt=""></div>'
 '<div class="rechts">'+buehne(False)+H1.replace('margin','')+heute()+CTA+'</div></div>'+H2+kacheln(True,True))

V['t11']=W(11,'<div class="s-kleinbuehne">'+buehne(False)+'</div>'+SL+PILLS+CTA+
 '<div class="mcard t-schild" style="margin-top:22px"><h4>Heute für dich</h4>'+heute()+'</div><img class="t-duo t-fig" src="_vs/duo-praesentieren.webp" alt="">'+H2+kacheln(False,True))

V['t12']=W(12,'<div class="s-kleinbuehne">'+buehne(False)+'</div>'+SL+PILLS+
 '<div class="t-pills" style="margin-top:12px"><span>🔥 3 Tage Serie</span><span>📅 Tagesquiz: 5 neue</span><span>🎯 12 Fehler üben</span></div>'
 '<div class="t-pfad"><img class="t-fig" src="_vs/m3.webp" alt=""><div class="t-stops">'+''.join(f'<div class="t-stop"><i class="{G[c]}">{e}</i>{t}</div>' for c,e,t,s in K)+'</div><img class="t-fig" src="_vs/j3.webp" alt=""></div>'
 +'<div class="ers-cta"><span class="ers-btn">▶ Los geht\'s</span></div>')

V['t13']=W(13,'<div class="kopfklein" style="justify-content:center;margin-bottom:12px">'+LOGO.replace('class="ers-logo"','style="height:clamp(64px,7vw,90px)"')+SL+'</div>'
 '<div class="heroc"><img src="_vs/duo-jubel.webp" alt=""><small>Weiterspielen</small><b>Berge der Schweiz</b><span style="font-weight:700">6 von 10 Fragen · 🔥 3 Tage Serie</span><div class="vbar"><i style="width:60%"></i></div><div class="ers-cta"><span class="ers-btn">▶ Weiter</span><span class="ers-btn weiss">📅 Tagesquiz</span></div></div>'
 +H1+'<div class="poster"><div class="g5"><i>📅</i>'+AV('m1.webp')+'<span>Tagesquiz<small>5 neue Fragen</small></span></div><div class="g6"><i>🎯</i>'+AV('m4.webp')+'<span>Fehler üben<small>12 Fragen</small></span></div><div class="g3"><i>⚔️</i>'+AV('j1.webp')+'<span>Duell<small>Milo wartet</small></span></div><div class="g4"><i>🎲</i>'+AV('j4.webp')+'<span>Zufall<small>Überrasch dich</small></span></div></div>')

V['t14']=W(14,'<div class="s-kleinbuehne">'+buehne(False)+'</div>'+SL+PILLS+
 '<div class="t-duell"><img class="t-fig" src="_vs/m4.webp" alt=""><div class="mcard t-tafel"><small>Duell der Woche</small><div class="t-score"><div><b class="l">8</b><span>Lumi</span></div><em>:</em><div><b class="m">9</b><span>Milo</span></div></div><p>Milo liegt eine Frage vorn. Hilf Lumi und spiel 10 Fragen!</p><span class="ers-btn">⚔️ Duell annehmen</span></div><img class="t-fig" src="_vs/j4.webp" alt=""></div>'
 +H1+heute()+H2+kacheln(False,True))

V['t15']=W(15,buehne()+SL+PILLS+CTA+H1+heute([AV('m1.webp'),AV('j1.webp'),AV('m4.webp')])+H2+
 '<div class="ers-kacheln">'+''.join(f'<span class="ers-k {c} hell">{AV(a)}<i class="{G[c]}">{e}</i><b>{t}</b><small>mit {n}</small></span>' for (c,e,t,s),(a,n) in zip(K,[('m2.webp','Lumi'),('j2.webp','Milo'),('j5.webp','Milo'),('m5.webp','Lumi')]))+'</div>')

V['t16']=W(16,'<div class="s-kleinbuehne">'+buehne(False)+'</div>'+SL+PILLS+
 '<h3 class="ers-h" style="text-align:center">Wer begleitet dich heute?</h3>'
 '<div class="t-wahl"><div class="t-w lumi an"><span class="hak">✓ Gewählt</span><b>Lumi</b><small>Ruhig und schlau, mag Tiere und Berge</small><img src="_vs/m8.webp" alt=""></div>'
 '<div class="t-w milo"><b>Milo</b><small>Schnell und mutig, mag Duelle und Sport</small><img src="_vs/j8.webp" alt=""></div></div>'
 '<div class="ers-cta" style="margin-top:18px"><span class="ers-btn">▶ Mit Lumi starten</span></div>'
 +H1+heute()+H2+kacheln(False,True))

V['t17']=W(17,'<div class="s-kleinbuehne">'+buehne(False)+'</div>'+SL+PILLS+
 '<div class="t-knopf"><img class="l t-fig" src="_vs/spring0.webp" alt=""><img class="r t-fig" src="_vs/spring1.webp" alt=""><span class="ers-btn">▶ Los geht\'s</span></div>'
 '<div class="t-pills"><span>🔥 3 Tage Serie</span><span>📅 Tagesquiz: 5 neue</span><span>🎯 12 Fehler üben</span></div>'+H2+kacheln(False,True))

V['t18']=W(18,'<div class="mcard t-mag"><div><span class="kicker">Ausgabe Oktober · Nr. 42</span>'+SL+
 '<div class="t-schlag"><div><em>01</em><div>3 Tage Serie<small>Noch 5 Fragen für heute</small></div></div><div><em>02</em><div>Tagesquiz<small>5 neue Fragen, jeden Tag</small></div></div><div><em>03</em><div>Fehler üben (12)<small>Falsche Fragen nochmals</small></div></div></div>'
 +CTA.replace('ers-cta','ers-cta" style="justify-content:flex-start;margin-bottom:26px')+'</div><img class="t-fig" src="_vs/duo-zeigen.webp" alt=""></div>'
 '<div class="t-rubriken">'+''.join(f'<span>{e} {t}</span>' for c,e,t,s in K)+'</div>')

V['t19']=W(19,'<div class="s-kleinbuehne">'+buehne(False)+'</div>'+SL+PILLS+
 '<div class="t-tag"><img class="t-fig" src="_vs/m8.webp" alt=""><div class="mcard tl"><h4>📋 Dein Tag mit Lumi und Milo</h4>'
 '<div class="e ok"><time>07:00</time>'+AV('m1.webp')+'<div><b>Morgenfrage</b><small>Lumi: 1 Frage zum Wachwerden</small></div></div>'
 '<div class="e jetzt"><time>16:00</time>'+AV('j1.webp')+'<div><b>Tagesquiz</b><small>Milo: 5 neue Fragen, jeden Tag</small></div></div>'
 '<div class="e"><time>18:00</time>'+AV('m4.webp')+'<div><b>Fehler üben</b><small>Lumi: 12 Fragen nochmals</small></div></div>'
 '<div class="e"><time>20:00</time>'+AV('j4.webp')+'<div><b>🔥 Serie halten</b><small>Milo: noch 5 Fragen, dann sind es 4 Tage</small></div></div></div></div>'
 +'<div class="ers-cta" style="margin-top:16px"><span class="ers-btn">▶ Los geht\'s</span></div>'+H2+kacheln(False,True))

EM=[('m2.webp','Lumi empfiehlt','Tiere der Alpen','10 Fragen · Entdecker','Spielen'),('j2.webp','Milo empfiehlt','Fussball-Wissen','15 Fragen · Könner','Spielen'),('m6.webp','Lumi','Fehler üben','12 Fragen nochmals','Üben'),('j6.webp','Milo','Duell','Milo wartet auf dich','Annehmen')]
V['t20']=W(20,'<div class="s-kleinbuehne">'+buehne(False)+'</div>'+SL+PILLS+CTA+
 '<h3 class="ers-h" style="text-align:center;margin-top:30px">Lumi und Milo empfehlen</h3><div class="t-reihe">'+''.join(f'<div class="mcard t-emp"><img src="_vs/{img}" alt=""><small>{a}</small><b>{b}</b><p>{s}</p><span class="ers-btn">{k}</span></div>' for img,a,b,s,k in EM)+'</div>'
 +H2+kacheln(False,True))

for k,html in V.items():
  html=html.replace('`','\\`')
  js='<script>(function(){const o=window.renderHome;window.renderHome=function(){o.apply(this,arguments);const h=document.querySelector(".hero");if(!h)return;h.classList.add("vs");h.innerHTML=`'+html+'`;};})();</script>'
  out=src.replace('</head>','<style id="vs">'+common+'</style></head>',1)
  i=out.rfind('</body>');out=out[:i]+js+out[i:]
  open(f'{OUT}/vorschlag-{k}.html','w',encoding='utf-8').write(out)
print('ok',len(V))
