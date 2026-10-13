# Q-Runde: 10 Varianten des «Ersten Vorschlags». Aufruf: python3 gen8.py <index.html> <ausgabeordner>
import sys
src=open(sys.argv[1],encoding='utf-8').read()
OUT=sys.argv[2]
src=src.replace("navigator.serviceWorker.register","void 0&&navigator.serviceWorker.register")
common=open('common.css').read()+open('HB.css').read()+open('Q.css').read()
LOGO='<img class="ers-logo" src="${ICON_SRC}" alt="easyplay">'
def buehne(kids=True):
  if not kids: return '<div class="ers-b">'+LOGO+'</div>'
  return '<div class="ers-b"><img class="ers-kid l" src="_vs/spring0.webp" alt="">'+LOGO+'<img class="ers-kid r" src="_vs/spring1.webp" alt=""></div>'
SL='<div class="vs-slogan">Spiel dich schlau!</div>'
PILLS='<div class="vs-pills"><span><b>${allCount().toLocaleString("de-CH")}</b> Fragen</span><span><b>75</b> Themen</span><span><b>3</b> Stufen</span><span>🇨🇭 mit Schweiz-Wissen</span></div>'
CTA='<div class="ers-cta"><span class="ers-btn">▶ Los geht\'s</span><span class="ers-btn weiss">📅 Tagesquiz</span></div>'
def heute(cls=''):
  return ('<div class="ers-heute '+cls+'"><div class="ers-karte feuer"><span class="em">🔥</span><span><b>3 Tage Serie</b><small>Noch 5 Fragen für heute</small></span></div>'
   '<div class="ers-karte"><span class="em">📅</span><span><b>Tagesquiz</b><small>5 neue Fragen, jeden Tag</small></span></div>'
   '<div class="ers-karte"><span class="em">🎯</span><span><b>Fehler üben (12)</b><small>Falsche Fragen nochmals</small></span></div></div>')
K=[('k1','📖','Bibliothek','Lesen und entdecken'),('k2','📱','Qeels','Kurze Wissens-Clips'),('k3','⚔️','Wettbewerb &amp; Duell','Gegen Freunde spielen'),('k4','🎲','Zufällige Fragen','Überrasch dich selbst')]
def kacheln(sub=False):
  return '<div class="ers-kacheln">'+''.join(f'<span class="ers-k {c}"><i>{e}</i><b>{t}</b>{"<small>"+s+"</small>" if sub else ""}</span>' for c,e,t,s in K)+'</div>'
H1='<h3 class="ers-h">Heute für dich</h3>'; H2='<h3 class="ers-h">Was willst du machen?</h3>'
V={}

V['q1']='<div class="vsX vsQ vsQ1 vohneleiste">'+buehne()+SL+PILLS+CTA+H1+heute()+H2+kacheln()+'</div>'

V['q2']=('<div class="vsX vsQ vsQ2 vohneleiste"><div class="ers-zwei"><div>'+buehne()+SL+PILLS+CTA+'</div>'
 '<div class="ers-tag"><h3>Heute für dich</h3><p>Lumi hat schon etwas vorbereitet.</p>'+heute()+'</div></div>'+H2+kacheln(True)+'</div>')

V['q3']=('<div class="vsX vsQ vsQ3 vohneleiste"><div class="ers-glas">'+buehne()+SL+PILLS+CTA+
 '<div class="ers-leiste"><div><span>🔥</span><div>3 Tage Serie<small>Noch 5 Fragen für heute</small></div></div><div><span>📅</span><div>Tagesquiz<small>5 neue Fragen, jeden Tag</small></div></div><div><span>🎯</span><div>Fehler üben (12)<small>Falsche Fragen nochmals</small></div></div></div></div>'
 +H2+kacheln(True)+'</div>')

V['q4']=('<div class="vsX vsQ vsQ4 vohneleiste">'+buehne()+SL+PILLS+
 '<span class="ers-gross"><b><span>▶</span>Los geht\'s</b><div class="vbar"><i style="width:50%"></i></div><small>🔥 3 Tage Serie · noch 5 von 10 Fragen für heute</small></span>'
 '<div class="ers-links"><span>📅 Tagesquiz</span><span>🎯 Fehler üben (12)</span></div>'+H2+kacheln(True)+'</div>')

V['q5']=('<div class="vsX vsQ vsQ5 vohneleiste">'+buehne(False)+SL+PILLS+'<div class="ers-cta"><span class="ers-btn">▶ Los geht\'s</span></div>'
 '<div class="ers-pills2"><span>🔥 3 Tage Serie</span><span>📅 Tagesquiz: 5 neue Fragen</span><span>🎯 12 Fehler üben</span></div>'
 '<div class="ers-reihe"><img src="_vs/m3.webp" alt="">'+kacheln(True)+'<img class="r" src="_vs/j3.webp" alt=""></div></div>')

V['q6']=('<div class="vsX vsQ vsQ6 vohneleiste">'+buehne()+SL+PILLS+CTA+H1+
 '<div class="ers-ring"><div class="ers-kreis" style="--p:50"><div><b>5/10</b><small>Fragen heute</small></div></div>'
 '<div><b style="font-size:1.15rem">🔥 3 Tage Serie</b><div class="ers-woche"><span class="an">Mo</span><span class="an">Di</span><span class="an heute">Mi</span><span>Do</span><span>Fr</span><span>Sa</span><span>So</span></div><small style="color:#5D5C80;font-weight:600">Noch 5 Fragen, dann bleibt die Serie.</small></div>'
 '<div class="ers-kn"><span>📅 Tagesquiz</span><span>🎯 Fehler üben (12)</span></div><img class="ers-duo" src="_vs/duo4.webp" alt=""></div>'
 +H2+kacheln(True)+'</div>')

V['q7']=('<div class="vsX vsQ vsQ7 vohneleiste"><div class="ers-nacht">'+buehne()+SL+PILLS+CTA+'</div>'+H1+heute()+H2+kacheln()+'</div>')

V['q8']=('<div class="vsX vsQ vsQ8 vohneleiste"><div class="ers-bw">'
 '<div class="ers-bub l"><b>Lumi:</b> Wusstest du? Der Gotthard-Basistunnel ist mit 57 km der längste Eisenbahntunnel der Welt. 💡</div>'
 '<div class="ers-bub r"><b>Milo:</b> Ich hab heute schon 8 Fragen richtig. Schaffst du mehr? 😎</div>'+buehne()+'</div>'
 +SL+PILLS+CTA+H1+heute()+H2+kacheln()+'</div>')

T=[('k1','📖','Bibliothek','Lesen und entdecken','<img src="_vs/m2.webp" alt="">'),('k2','📱','Qeels','Kurze Wissens-Clips','<img src="_vs/j4.webp" alt="">'),('k3','⚔️','Wettbewerb &amp; Duell','Gegen Freunde spielen','<span class="paar"><img src="_vs/m4.webp" alt=""><img src="_vs/j1.webp" alt=""></span>'),('k4','🎲','Zufällige Fragen','Überrasch dich selbst','<img src="_vs/m6.webp" alt="">')]
V['q9']=('<div class="vsX vsQ vsQ9 vohneleiste">'+buehne(False)+SL+PILLS+CTA+H2+
 '<div class="ers-tueren">'+''.join(f'<div class="ers-tuer {c}">{e} {t}<small>{s}</small>{img}</div>' for c,e,t,s,img in T)+'</div>'+H1+heute()+'</div>')

V['q10']=('<div class="vsX vsQ vsQ10 vohneleiste">'+buehne()+SL+PILLS+'<div class="ers-cta"><span class="ers-btn">▶ Los geht\'s</span></div>'+H1+
 '<div class="ers-bar"><div><span>🔥</span><div>3 Tage Serie<small>Noch 5 Fragen für heute</small></div></div><div><span>📅</span><div>Tagesquiz<small>5 neue Fragen, jeden Tag</small></div></div><div><span>🎯</span><div>Fehler üben (12)<small>Falsche Fragen nochmals</small></div></div></div>'
 +H2+kacheln()+'</div>')

for k,html in V.items():
  html=html.replace('`','\\`')
  js='<script>(function(){const o=window.renderHome;window.renderHome=function(){o.apply(this,arguments);const h=document.querySelector(".hero");if(!h)return;h.classList.add("vs");h.innerHTML=`'+html+'`;};})();</script>'
  out=src.replace('</head>','<style id="vs">'+common+'</style></head>',1)
  i=out.rfind('</body>');out=out[:i]+js+out[i:]
  open(f'{OUT}/vorschlag-{k}.html','w',encoding='utf-8').write(out)
print('ok',len(V))
