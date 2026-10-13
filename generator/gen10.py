# S-Runde: 20 moderne Entwürfe. Aufruf: python3 gen10.py <index.html> <ausgabeordner>
import sys
src=open(sys.argv[1],encoding='utf-8').read()
OUT=sys.argv[2]
src=src.replace("navigator.serviceWorker.register","void 0&&navigator.serviceWorker.register")
common=open('common.css').read()+open('HB.css').read()+open('Q.css').read()+open('S.css').read()
LOGO='<img class="ers-logo" src="${ICON_SRC}" alt="easyplay">'
def buehne(kids=True):
  if not kids: return '<div class="ers-b">'+LOGO+'</div>'
  return '<div class="ers-b"><img class="ers-kid l" src="_vs/spring0.webp" alt="">'+LOGO+'<img class="ers-kid r" src="_vs/spring1.webp" alt=""></div>'
SL='<div class="vs-slogan">Spiel dich schlau!</div>'
PILLS='<div class="vs-pills"><span><b>${allCount().toLocaleString("de-CH")}</b> Fragen</span><span><b>75</b> Themen</span><span><b>3</b> Stufen</span><span>🇨🇭 mit Schweiz-Wissen</span></div>'
CTA='<div class="ers-cta"><span class="ers-btn">▶ Los geht\'s</span><span class="ers-btn weiss">📅 Tagesquiz</span></div>'
HEUTE=[('feuer','🔥','3 Tage Serie','Noch 5 Fragen für heute'),('','📅','Tagesquiz','5 neue Fragen, jeden Tag'),('','🎯','Fehler üben (12)','Falsche Fragen nochmals')]
def heute(extra=''):
  return '<div class="ers-heute">'+''.join(f'<div class="ers-karte {c} {extra}"><span class="em">{e}</span><span><b>{t}</b><small>{s}</small></span></div>' for c,e,t,s in HEUTE)+'</div>'
K=[('k1','📖','Bibliothek','Lesen und entdecken'),('k2','📱','Qeels','Kurze Wissens-Clips'),('k3','⚔️','Wettbewerb &amp; Duell','Gegen Freunde spielen'),('k4','🎲','Zufällige Fragen','Überrasch dich selbst')]
G={'k1':'g1','k2':'g2','k3':'g3','k4':'g4'}
def kacheln(sub=False,extra='',icog=False):
  return '<div class="ers-kacheln">'+''.join(f'<span class="ers-k {c} {extra}"><i class="{G[c] if icog else ""}">{e}</i><b>{t}</b>{"<small>"+s+"</small>" if sub else ""}</span>' for c,e,t,s in K)+'</div>'
H1='<h3 class="ers-h">Heute für dich</h3>'; H2='<h3 class="ers-h">Was willst du machen?</h3>'
W=lambda n,inner:'<div class="vsX vsQ vsS vsS'+str(n)+' vohneleiste">'+inner+'</div>'
V={}

V['s1']=W(1,'<div class="bento"><div class="b-stage">'+buehne()+'</div>'
 '<div class="b-slogan">'+SL+PILLS+'</div>'
 '<div class="b-cta"><b>Heute noch 5 Fragen, dann bleibt die Serie.</b><span class="ers-btn weiss">▶ Los geht\'s</span></div>'
 '<div class="b-stat"><small>Serie</small><span class="z">3 🔥</span><p>Noch 5 Fragen für heute</p></div>'
 '<div class="b-stat"><small>Tagesquiz</small><span class="z">5</span><p>neue Fragen, jeden Tag</p></div>'
 '<div class="b-stat"><small>Fehler üben</small><span class="z">12</span><p>Falsche Fragen nochmals</p></div>'
 '<div class="b-stat"><small>Wusstest du?</small><p style="font-weight:700;color:var(--ink)">Der Aletschgletscher ist rund 20 km lang. 🧊</p><p>Zum Quiz →</p></div>'
 +''.join(f'<div class="b-k {G[c]}"><i>{e}</i><span>{t}</span></div>' for c,e,t,s in K)+'</div>')

V['s2']=W(2,'<div class="mesh">'+buehne()+SL+PILLS+CTA+H1+heute('glas')+'</div>'+H2+kacheln(True,'',True))

V['s3']=W(3,'<div class="dark">'+buehne()+SL+PILLS+CTA+H1+heute()+H2+kacheln(True,'',True)+'</div>')

V['s4']=W(4,'<div class="typo"><div>'+SL+'<p>Quiz-Fragen für Kinder und Jugendliche von 6 bis 20, mit viel Schweiz-Wissen. Lumi und Milo begleiten dich.</p>'+CTA+'</div>'+buehne()+'</div>'
 '<div class="unten"><div class="zahlen"><div><b>🔥 3 Tage</b><small>Serie, noch 5 Fragen heute</small></div><div><b>📅 5</b><small>neue Fragen im Tagesquiz</small></div><div><b>🎯 12</b><small>Fehler zum Üben</small></div></div>'
 +H2+'<div class="liste">'+''.join(f'<div><em>{e}</em>{t}<span>→</span></div>' for c,e,t,s in K)+'</div></div>')

KK=[('g5','Weiterspielen','Berge der Schweiz','6 von 10 Fragen','🏔️',60,'▶ Weiter'),('g1','Serie','3 Tage am Stück','Noch 5 Fragen für heute','🔥',50,'Serie halten'),('g3','Tagesquiz','5 neue Fragen','Jeden Tag für alle gleich','📅',0,'Spielen'),('g6','Fehler üben','12 Fragen nochmals','Aus den letzten Runden','🎯',0,'Üben'),('g4','Duell','Rakete7 wartet','Gegen Freunde spielen','⚔️',0,'Annehmen')]
V['s5']=W(5,'<div class="s-kleinbuehne">'+buehne(False)+'</div>'+SL+PILLS+
 '<div class="karussell">'+''.join(f'<div class="kk {g}"><span class="e">{e}</span><div><small>{a}</small><b>{b}</b><p>{s}</p>{"<div class=vbar><i style=width:"+str(p)+"%></i></div>" if p else ""}</div><span class="ers-btn">{k}</span></div>' for g,a,b,s,e,p,k in KK)+'</div>'
 '<div class="punkte"><i></i><i></i><i></i><i></i><i></i></div>'+H2+kacheln(True,'',True))

V['s6']=W(6,buehne()+SL+PILLS+CTA+H1+heute()+H2+kacheln())

V['s7']=W(7,'<div class="soft">'+buehne()+SL+PILLS+CTA+H1+heute()+H2+kacheln(True)+'</div>')

V['s8']=W(8,'<div class="split"><div class="links">'+SL+'<p>Quiz-Fragen für Kinder und Jugendliche von 6 bis 20, mit viel Schweiz-Wissen.</p>'+PILLS+CTA+'</div>'
 '<div class="rechts">'+buehne()+H1.replace('margin','')+heute()+'</div></div>'+H2+kacheln(True,'',True))

V['s9']=W(9,'<div class="inselwrap"><img class="s-kid l" src="_vs/m2.webp" alt=""><img class="s-kid r" src="_vs/j2.webp" alt=""><div class="insel">'+buehne(False)+SL+PILLS+CTA+'<hr>'+H1+heute()+'<hr>'+H2+kacheln(False,'',True)+'</div></div>')

V['s10']=W(10,'<div class="s-kleinbuehne">'+buehne(False)+'</div>'+SL+PILLS+
 '<div class="dash"><div class="mcard"><small>Heute</small><div class="ring" style="--p:50"><div><b>5/10</b><em>Fragen</em></div></div><p style="margin:10px 0 0;color:var(--mut);text-align:center;font-weight:600">Noch 5 bis zur Serie</p></div>'
 '<div class="mcard"><small>Diese Woche</small><div class="balken"><i class="an" style="height:40%" data-t="Mo"></i><i class="an" style="height:70%" data-t="Di"></i><i class="heute" style="height:50%" data-t="Mi"></i><i style="height:12%" data-t="Do"></i><i style="height:12%" data-t="Fr"></i><i style="height:12%" data-t="Sa"></i><i style="height:12%" data-t="So"></i></div><p style="margin:22px 0 0;color:var(--mut);font-weight:600">🔥 3 Tage Serie</p></div>'
 '<div class="mcard"><small>Deine Zahlen</small><div class="stat"><div><b>1 240</b><span>Fragen gespielt</span></div><div><b>86 %</b><span>richtig</span></div><div><b>9/17</b><span>Abzeichen</span></div></div></div></div>'
 +H2+'<div class="akt">'+''.join(f'<div><i class="{G[c]}">{e}</i>{t}</div>' for c,e,t,s in K)+'<div><i class="g5">📅</i>Tagesquiz</div><div><i class="g6">🎯</i>Fehler üben</div></div>')

V['s11']=W(11,'<div class="logoring"><div>'+LOGO+'</div></div>'+SL+PILLS+CTA+H1+heute('gb')+H2+kacheln(True,'gb'))

V['s12']=W(12,'<div class="s-kleinbuehne">'+buehne(False)+'</div>'+SL+PILLS+
 '<div class="pnav"><span class="an">Heute</span><span>Spielen</span><span>Lernen</span><span>Freunde</span></div>'
 '<div class="mcard panel"><div class="z"><span class="s-ico g1">🔥</span><div>3 Tage Serie<small>Noch 5 Fragen für heute</small></div><em>›</em></div><div class="z"><span class="s-ico g5">📅</span><div>Tagesquiz<small>5 neue Fragen, jeden Tag</small></div><em>›</em></div><div class="z"><span class="s-ico g6">🎯</span><div>Fehler üben (12)<small>Falsche Fragen nochmals</small></div><em>›</em></div></div>'
 '<div class="ers-cta" style="margin-top:18px"><span class="ers-btn">▶ Los geht\'s</span></div>'
 '<div class="pillen">'+''.join(f'<span>{e} {t}</span>' for c,e,t,s in K)+'</div>')

V['s13']=W(13,buehne()+'<div class="boden"></div>'+SL+PILLS+CTA+H1+heute()+H2+kacheln())

V['s14']=W(14,'<div class="kopfklein" style="justify-content:center;margin-bottom:8px">'+LOGO.replace('class="ers-logo"','style="height:clamp(70px,8vw,100px)"')+SL+'</div>'
 '<div class="stories"><div class="st"><i><span><img src="_vs/m1.webp" alt=""></span></i>Lumi</div><div class="st"><i><span><img src="_vs/j1.webp" alt=""></span></i>Milo</div><div class="st"><i><span>🏔️</span></i>Berge</div><div class="st"><i><span>🦌</span></i>Tiere</div><div class="st gesehen"><i><span>🇨🇭</span></i>Kantone</div><div class="st gesehen"><i><span>🪐</span></i>Weltraum</div></div>'
 +H1+'<div class="feed">'
 '<div class="mcard post"><div class="cover g5"><span>JEDEN TAG</span>📅</div><div class="txt"><div><b>Tagesquiz</b><small>5 neue Fragen, für alle gleich</small></div><span class="ers-btn">Spielen</span></div></div>'
 '<div class="mcard post"><div class="cover g1"><span>SERIE</span>🔥</div><div class="txt"><div><b>3 Tage am Stück</b><small>Noch 5 Fragen für heute</small></div><span class="ers-btn">Weiter</span></div></div>'
 '<div class="mcard post"><div class="cover g6"><span>ÜBEN</span>🎯</div><div class="txt"><div><b>Fehler üben</b><small>12 falsche Fragen nochmals</small></div><span class="ers-btn weiss">Üben</span></div></div>'
 '<div class="mcard post"><div class="cover g3"><span>DUELL</span>⚔️</div><div class="txt"><div><b>Rakete7 fordert dich</b><small>10 Fragen, wer ist schneller?</small></div><span class="ers-btn weiss">Annehmen</span></div></div></div>'
 +H2+kacheln(False,'',True))

V['s15']=W(15,'<div class="zs"><div>'+buehne()+SL.replace('vs-slogan','vs-slogan" style="text-align:left')+PILLS.replace('vs-pills','vs-pills" style="justify-content:flex-start')+CTA.replace('ers-cta','ers-cta" style="justify-content:flex-start')+'</div>'
 '<div class="mcard tl"><h4>📋 Dein Tag</h4>'
 '<div class="e ok"><time>07:00</time><i></i><div><b>Morgenfrage</b><small>1 Frage zum Wachwerden</small></div></div>'
 '<div class="e jetzt"><time>16:00</time><i></i><div><b>Tagesquiz</b><small>5 neue Fragen, jeden Tag</small><br><span class="ers-btn">▶ Jetzt spielen</span></div></div>'
 '<div class="e"><time>18:00</time><i></i><div><b>Fehler üben</b><small>12 falsche Fragen nochmals</small></div></div>'
 '<div class="e"><time>20:00</time><i></i><div><b>🔥 Serie halten</b><small>Noch 5 Fragen, dann sind es 4 Tage</small></div></div></div></div>'
 +H2+kacheln(False,'',True))

TH=[('🦌 Tiere','c1 gross'),('🏔️ Berge','c2'),('🇨🇭 Kantone','c3 gross'),('⚽ Sport','c4'),('🪐 Weltraum','c5 gross'),('🏰 Burgen','c2'),('🧀 Essen','c4'),('🎵 Musik','c1'),('🔬 Natur','c3'),('🌍 Welt','c5'),('🚂 Züge','c2 gross'),('🎨 Kunst','c1')]
V['s16']=W(16,buehne()+SL+PILLS+CTA+H1+'<div class="bar"><div><span>🔥</span><div>3 Tage Serie<small>Noch 5 Fragen für heute</small></div></div><div><span>📅</span><div>Tagesquiz<small>5 neue Fragen, jeden Tag</small></div></div><div><span>🎯</span><div>Fehler üben (12)<small>Falsche Fragen nochmals</small></div></div></div>'
 '<h3 class="ers-h">Wähl ein Thema</h3><div class="s-themen">'+''.join(f'<span class="{c}">{t}</span>' for t,c in TH)+'</div>')

V['s17']=W(17,'<div class="kopfklein" style="justify-content:center;margin-bottom:12px">'+LOGO.replace('class="ers-logo"','style="height:clamp(64px,7vw,90px)"')+SL+'</div>'
 '<div class="heroc"><img src="_vs/duo5.webp" alt=""><small>Weiterspielen</small><b>Berge der Schweiz</b><span>6 von 10 Fragen · 🔥 3 Tage Serie</span><div class="vbar"><i style="width:60%"></i></div><div class="ers-cta"><span class="ers-btn">▶ Weiter</span><span class="ers-btn weiss">📅 Tagesquiz</span></div></div>'
 +H1+'<div class="poster"><div class="g5"><i>📅</i><span>Tagesquiz<small>5 neue Fragen</small></span></div><div class="g6"><i>🎯</i><span>Fehler üben<small>12 Fragen</small></span></div><div class="g3"><i>⚔️</i><span>Duell<small>Rakete7 wartet</small></span></div><div class="g4"><i>🎲</i><span>Zufall<small>Überrasch dich</small></span></div></div>')

V['s18']=W(18,buehne()+SL+'<div class="zz"><div class="mcard"><b>${allCount().toLocaleString("de-CH")}</b><span>Fragen</span><small>in 3 Stufen von 6 bis 20 Jahren</small></div><div class="mcard"><b>75</b><span>Themen</span><small>von Tieren bis Weltraum</small></div><div class="mcard"><b>🇨🇭</b><span>Schweiz-Wissen</span><small>Kantone, Berge, Geschichte</small></div></div>'
 '<div class="ers-cta" style="margin-top:18px">'+'<span class="ers-btn">▶ Los geht\'s</span><span class="ers-btn flach">📅 Tagesquiz</span></div>'+H1+heute()+H2+kacheln())

V['s19']=W(19,'<div class="s-kleinbuehne">'+buehne()+'</div>'+SL+PILLS+'<div class="ers-cta"><span class="ers-btn">▶ Los geht\'s</span></div>'
 +H1+'<div class="mcard gruppe"><div class="z"><span class="s-ico g1">🔥</span><div>3 Tage Serie<small>Noch 5 Fragen für heute</small></div><span class="pfeil">›</span></div><div class="z"><span class="s-ico g5">📅</span><div>Tagesquiz<small>5 neue Fragen, jeden Tag</small></div><span class="pfeil">›</span></div><div class="z"><span class="s-ico g6">🎯</span><div>Fehler üben<small>Falsche Fragen nochmals</small></div><span class="badge">12</span><span class="pfeil">›</span></div></div>'
 +H2+'<div class="mcard gruppe">'+''.join(f'<div class="z"><span class="s-ico {G[c]}">{e}</span><div>{t}<small>{s}</small></div><span class="pfeil">›</span></div>' for c,e,t,s in K)+'</div>')

V['s20']=W(20,buehne()+SL+PILLS+H1+heute()+H2+kacheln()+'<div class="fab"><i>▶</i>Los geht\'s</div>')

for k,html in V.items():
  html=html.replace('`','\\`')
  js='<script>(function(){const o=window.renderHome;window.renderHome=function(){o.apply(this,arguments);const h=document.querySelector(".hero");if(!h)return;h.classList.add("vs");h.innerHTML=`'+html+'`;};})();</script>'
  out=src.replace('</head>','<style id="vs">'+common+'</style></head>',1)
  i=out.rfind('</body>');out=out[:i]+js+out[i:]
  open(f'{OUT}/vorschlag-{k}.html','w',encoding='utf-8').write(out)
print('ok',len(V))
