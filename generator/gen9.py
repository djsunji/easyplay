# R-Runde: 10 weitere Varianten des «Ersten Vorschlags». Aufruf: python3 gen9.py <index.html> <ausgabeordner>
import sys
src=open(sys.argv[1],encoding='utf-8').read()
OUT=sys.argv[2]
src=src.replace("navigator.serviceWorker.register","void 0&&navigator.serviceWorker.register")
common=open('common.css').read()+open('HB.css').read()+open('Q.css').read()+open('R.css').read()
LOGO='<img class="ers-logo" src="${ICON_SRC}" alt="easyplay">'
def buehne(kids=True):
  if not kids: return '<div class="ers-b">'+LOGO+'</div>'
  return '<div class="ers-b"><img class="ers-kid l" src="_vs/spring0.webp" alt="">'+LOGO+'<img class="ers-kid r" src="_vs/spring1.webp" alt=""></div>'
SL='<div class="vs-slogan">Spiel dich schlau!</div>'
PILLS='<div class="vs-pills"><span><b>${allCount().toLocaleString("de-CH")}</b> Fragen</span><span><b>75</b> Themen</span><span><b>3</b> Stufen</span><span>🇨🇭 mit Schweiz-Wissen</span></div>'
CTA='<div class="ers-cta"><span class="ers-btn">▶ Los geht\'s</span><span class="ers-btn weiss">📅 Tagesquiz</span></div>'
def heute():
  return ('<div class="ers-heute"><div class="ers-karte feuer"><span class="em">🔥</span><span><b>3 Tage Serie</b><small>Noch 5 Fragen für heute</small></span></div>'
   '<div class="ers-karte"><span class="em">📅</span><span><b>Tagesquiz</b><small>5 neue Fragen, jeden Tag</small></span></div>'
   '<div class="ers-karte"><span class="em">🎯</span><span><b>Fehler üben (12)</b><small>Falsche Fragen nochmals</small></span></div></div>')
K=[('k1','📖','Bibliothek','Lesen und entdecken'),('k2','📱','Qeels','Kurze Wissens-Clips'),('k3','⚔️','Wettbewerb &amp; Duell','Gegen Freunde spielen'),('k4','🎲','Zufällige Fragen','Überrasch dich selbst')]
def kacheln(sub=False):
  return '<div class="ers-kacheln">'+''.join(f'<span class="ers-k {c}"><i>{e}</i><b>{t}</b>{"<small>"+s+"</small>" if sub else ""}</span>' for c,e,t,s in K)+'</div>'
H1='<h3 class="ers-h">Heute für dich</h3>'; H2='<h3 class="ers-h">Was willst du machen?</h3>'
V={}

V['r1']='<div class="vsX vsQ vsR1 vohneleiste">'+buehne()+SL+PILLS+CTA+H1+heute()+H2+kacheln()+'</div>'

V['r2']=('<div class="vsX vsQ vsR2 vohneleiste"><div class="ers-zwei"><div>'+SL+
 '<p class="ers-intro">Quiz-Fragen für Kinder und Jugendliche von 6 bis 20, mit viel Schweiz-Wissen. Lumi und Milo begleiten dich.</p>'+PILLS+CTA+'</div>'+buehne()+'</div>'+H1+heute()+H2+kacheln()+'</div>')

APPS=[('📖','Bibliothek','linear-gradient(135deg,#FF5F9E,#FFB347)',''),('📱','Qeels','linear-gradient(135deg,#FF8A3D,#E043B8)','3'),('⚔️','Duell','linear-gradient(135deg,#0FA968,#1E9BE0)','1'),('🎲','Zufall','linear-gradient(135deg,#5B3FE0,#C86BFF)',''),('📅','Tagesquiz','linear-gradient(135deg,#3D5AFE,#6E8BFF)','NEU'),('🎯','Fehler üben','linear-gradient(135deg,#E0352B,#FF7A5C)','12')]
dock=''.join(f'<div class="ers-app"><span><i style="background:{g}">{e}</i>{"<b>"+b+"</b>" if b else ""}</span>{t}</div>' for e,t,g,b in APPS)
V['r3']=('<div class="vsX vsQ vsR3 vohneleiste">'+buehne()+SL+PILLS+'<div class="ers-cta"><span class="ers-btn">▶ Los geht\'s</span></div>'+H2+
 '<div class="ers-dock">'+dock+'</div>'+H1+heute()+'</div>')

V['r4']=('<div class="vsX vsQ vsR4 vohneleiste">'+buehne()+SL+PILLS+CTA+H1+
 '<div class="ers-plan"><div class="kopf"><b>📋 Dienstag, 13. Oktober</b><small>1 von 3 erledigt</small></div><div class="vbar"><i style="width:33%"></i></div>'
 '<div class="ers-z ok"><div class="box">✓</div><div><span>Morgenfrage</span><small>1 Frage zum Wachwerden</small></div><em>+10 XP</em></div>'
 '<div class="ers-z jetzt"><div class="box"></div><div>Tagesquiz<small>5 neue Fragen, jeden Tag</small></div><em>+50 XP</em></div>'
 '<div class="ers-z"><div class="box"></div><div>Fehler üben<small>12 falsche Fragen nochmals</small></div><em>+30 XP</em></div>'
 '<div class="ers-z"><div class="box"></div><div>🔥 Serie halten<small>Noch 5 Fragen, dann sind es 4 Tage</small></div><em>+20 XP</em></div></div>'
 +H2+kacheln()+'</div>')

V['r5']=('<div class="vsX vsQ vsR5 vohneleiste"><div class="ers-wolke">'+buehne()+SL+PILLS+CTA+'</div>'+H1+heute()+H2+kacheln(True)+'</div>')

V['r6']=('<div class="vsX vsQ vsR6 vohneleiste">'+buehne(False)+SL+PILLS+H1+heute()+H2+
 '<div class="ers-halb"><div class="ers-h2 lernen"><h4>📚 Lernen</h4><p>In Ruhe lesen und üben.</p><div class="ers-u"><span>📖 Bibliothek</span><span>🎲 Zufällige Fragen</span></div><img src="_vs/m5.webp" alt=""></div>'
 '<div class="ers-h2 spielen"><h4>🎮 Spielen</h4><p>Schnell, laut und mit Freunden.</p><div class="ers-u"><span>📱 Qeels</span><span>⚔️ Wettbewerb &amp; Duell</span></div><img src="_vs/j5.webp" alt=""></div></div></div>')

V['r7']=('<div class="vsX vsQ vsR7 vohneleiste">'+buehne()+SL+PILLS+CTA+
 '<div class="ers-tafel" style="margin-top:28px"><h4>Heute für dich</h4>'+heute()+'<span class="kreide"></span></div>'+H2+kacheln()+'</div>')

V['r8']=('<div class="vsX vsQ vsR8 vohneleiste"><div class="ers-kopf">'+buehne()+'<div>'+SL+PILLS+CTA+'</div></div>'+H1+heute()+H2+kacheln()+'</div>')

V['r9']=('<div class="vsX vsQ vsR9 vohneleiste">'+buehne(False)+SL+PILLS+
 '<div class="ers-konsole" style="margin-top:16px"><div class="ers-screen"><h4>Heute für dich</h4><div class="ok">✅ Morgenfrage</div><div>📅 Tagesquiz · 5 neue Fragen</div><div>🎯 Fehler üben · 12</div><div>🔥 3 Tage Serie</div><div class="vbar"><i style="width:50%"></i></div></div>'
 '<div class="ers-abxy"><span class="o"><i>📖</i>Bibliothek</span><span class="r"><i>📱</i>Qeels</span><span class="u"><i>⚔️</i>Duell</span><span class="l"><i>🎲</i>Zufall</span></div>'
 '<div class="ers-kids"><img src="_vs/m1.webp" alt=""><img src="_vs/j1.webp" alt=""></div>'
 '<div class="ers-cta"><span class="ers-btn gelb">▶ Los geht\'s</span></div></div></div>')

V['r10']=('<div class="vsX vsQ vsR10 vohneleiste">'+buehne(False)+SL+PILLS+
 '<div class="ers-post"><div class="bild"><img src="_vs/duo3.webp" alt=""></div>'
 '<div class="text"><div class="ers-marke">'+LOGO.replace('class="ers-logo"','')+'</div><div class="ers-stempel">EASYPLAY<br>13.10.2026<br>ALPEN</div>'
 '<h4>Liebe Grüsse aus den Alpen!</h4><p>Heute haben wir für dich:</p>'
 '<div class="zeile"><span>🔥</span><div>3 Tage Serie<small>Noch 5 Fragen für heute</small></div></div>'
 '<div class="zeile"><span>📅</span><div>Tagesquiz<small>5 neue Fragen, jeden Tag</small></div></div>'
 '<div class="zeile"><span>🎯</span><div>Fehler üben (12)<small>Falsche Fragen nochmals</small></div></div>'
 '<p style="margin-top:10px">Bis später, Lumi und Milo ✍️</p></div></div>'
 +'<div class="ers-cta" style="margin-top:22px">'+'<span class="ers-btn">▶ Los geht\'s</span><span class="ers-btn weiss">📅 Tagesquiz</span></div>'+H2+kacheln()+'</div>')

for k,html in V.items():
  html=html.replace('`','\\`')
  js='<script>(function(){const o=window.renderHome;window.renderHome=function(){o.apply(this,arguments);const h=document.querySelector(".hero");if(!h)return;h.classList.add("vs");h.innerHTML=`'+html+'`;};})();</script>'
  out=src.replace('</head>','<style id="vs">'+common+'</style></head>',1)
  i=out.rfind('</body>');out=out[:i]+js+out[i:]
  open(f'{OUT}/vorschlag-{k}.html','w',encoding='utf-8').write(out)
print('ok',len(V))
