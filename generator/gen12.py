# U-Runde: 20 weitere helle, moderne Entwürfe mit Lumi und Milo. Aufruf: python3 gen12.py <index.html> <ausgabeordner>
import sys
src=open(sys.argv[1],encoding='utf-8').read()
OUT=sys.argv[2]
src=src.replace("navigator.serviceWorker.register","void 0&&navigator.serviceWorker.register")
common=open('common.css').read()+open('HB.css').read()+open('Q.css').read()+open('S.css').read()+open('T.css').read()+open('U.css').read()
LOGO='<img class="ers-logo" src="${ICON_SRC}" alt="easyplay">'
def buehne(kids=True):
  if not kids: return '<div class="ers-b">'+LOGO+'</div>'
  return '<div class="ers-b"><img class="ers-kid l" src="_vs/spring0.webp" alt="">'+LOGO+'<img class="ers-kid r" src="_vs/spring1.webp" alt=""></div>'
SL='<div class="vs-slogan">Spiel dich schlau!</div>'
PILLS='<div class="vs-pills"><span><b>${allCount().toLocaleString("de-CH")}</b> Fragen</span><span><b>75</b> Themen</span><span><b>3</b> Stufen</span><span>🇨🇭 mit Schweiz-Wissen</span></div>'
CTA='<div class="ers-cta"><span class="ers-btn">▶ Los geht\'s</span><span class="ers-btn weiss">📅 Tagesquiz</span></div>'
HEUTE=[('feuer','🔥','3 Tage Serie','Noch 5 Fragen für heute'),('','📅','Tagesquiz','5 neue Fragen, jeden Tag'),('','🎯','Fehler üben (12)','Falsche Fragen nochmals')]
def heute():
  return '<div class="ers-heute">'+''.join(f'<div class="ers-karte {c}"><span class="em">{e}</span><span><b>{t}</b><small>{s}</small></span></div>' for c,e,t,s in HEUTE)+'</div>'
K=[('k1','📖','Bibliothek','Lesen und entdecken'),('k2','📱','Qeels','Kurze Wissens-Clips'),('k3','⚔️','Wettbewerb &amp; Duell','Gegen Freunde spielen'),('k4','🎲','Zufällige Fragen','Überrasch dich selbst')]
G={'k1':'g1','k2':'g2','k3':'g3','k4':'g4'}
def kacheln(sub=False):
  return '<div class="ers-kacheln">'+''.join(f'<span class="ers-k {c} hell"><i class="{G[c]}">{e}</i><b>{t}</b>{"<small>"+s+"</small>" if sub else ""}</span>' for c,e,t,s in K)+'</div>'
H1='<h3 class="ers-h">Heute für dich</h3>'; H2='<h3 class="ers-h">Was willst du machen?</h3>'
AV=lambda f:f'<span class="t-av"><span><img src="_vs/{f}" alt=""></span></span>'
PILLS3='<div class="t-pills"><span>🔥 3 Tage Serie</span><span>📅 Tagesquiz: 5 neue</span><span>🎯 12 Fehler üben</span></div>'
W=lambda n,inner:'<div class="vsX vsQ vsS vsT vsU vsU'+str(n)+' vohneleiste">'+inner+'</div>'
V={}

V['u1']=W(1,'<div class="mcard u-banner"><img class="t-fig" src="_vs/duo-hallo.webp" alt=""><div class="t-text">'+buehne(False)+SL+PILLS+CTA+'</div></div>'+H1+heute()+H2+kacheln())

V['u2']=W(2,'<div class="u-zwei"><div>'+buehne(False)+SL+PILLS+'<h3 class="ers-h">Heute für dich</h3><div class="u-liste">'+heute().replace('class="ers-heute"','class="ers-heute" style="grid-template-columns:1fr"')+'</div>'+CTA+'</div><img class="t-fig" src="_vs/duo-cool.webp" alt=""></div>'+H2+kacheln())

V['u3']=W(3,'<div class="s-kleinbuehne">'+buehne(False)+'</div>'+SL+PILLS+
 '<div class="u-bereit" style="margin-top:16px"><div class="u-gegner">'+AV('j1.webp')+'<div>Rakete7 wartet<small>10 Fragen · Schweiz</small></div></div><h2>Bereit für dein Duell?</h2><p>Lumi und Milo sind aufgewärmt. 10 Fragen, wer ist schneller?</p><span class="ers-btn">⚔️ Duell starten</span><img class="t-fig" src="_vs/duo-bereit.webp" alt=""></div>'
 +H1+heute()+H2+kacheln())

V['u4']=W(4,'<div class="s-kleinbuehne">'+buehne(False)+'</div>'+SL+PILLS+CTA+
 '<div class="u-fakt"><img class="t-fig" src="_vs/duo-lachen.webp" alt=""><div class="mcard u-zitat"><small>💡 Wusstest du?</small><p>Der Gotthard-Basistunnel ist mit 57 km der längste Eisenbahntunnel der Welt. Ein Zug braucht nur 20 Minuten.</p><span class="ers-btn">Frage dazu spielen ▶</span></div></div>'
 +H1+heute()+H2+kacheln())

V['u5']=W(5,'<div class="s-kleinbuehne">'+buehne(False)+'</div>'+SL+PILLS+H1+
 '<div class="u-wand"><div class="u-pol"><div class="bild"><img src="_vs/m1.webp" alt=""></div><b>🔥 3 Tage Serie</b><small>Noch 5 Fragen für heute</small><br><span class="ers-btn">Weiter</span></div>'
 '<div class="u-pol"><div class="bild"><img src="_vs/duo-sitzen2.webp" alt="" style="height:150px"></div><b>📅 Tagesquiz</b><small>5 neue Fragen, jeden Tag</small><br><span class="ers-btn">Spielen</span></div>'
 '<div class="u-pol"><div class="bild"><img src="_vs/j1.webp" alt=""></div><b>🎯 Fehler üben (12)</b><small>Falsche Fragen nochmals</small><br><span class="ers-btn weiss">Üben</span></div></div>'
 +H2+kacheln())

V['u6']=W(6,'<div class="s-kleinbuehne">'+buehne(False)+'</div>'+SL+PILLS+
 '<div class="mcard u-chat"><div class="u-msg">'+AV('m1.webp')+'<div>Hoi! 👋 Du hast <b>3 Tage Serie</b>. Heute noch 5 Fragen, dann sind es 4!</div></div>'
 '<div class="u-msg r">'+AV('j1.webp')+'<div>Ich hab heute schon 8 richtig. 😎 Spielst du gegen mich?</div></div>'
 '<div class="u-msg">'+AV('m1.webp')+'<div>Oder zuerst das Tagesquiz? 5 neue Fragen warten.</div></div>'
 '<div class="u-antw"><span>📅 Tagesquiz</span><span>⚔️ Gegen Milo</span><span>🎯 Fehler üben</span><span>🎲 Überrasch mich</span></div></div>'
 '<div class="u-kids"><img class="t-fig" src="_vs/m3.webp" alt=""><img class="t-fig" src="_vs/j3.webp" alt=""></div>'+H2+kacheln())

V['u7']=W(7,'<div class="s-kleinbuehne">'+buehne(False)+'</div>'+SL+PILLS+
 '<div class="u-karten"><div class="u-sk u-pastell1"><small>Deine Begleiterin</small><b>Lumi · Level 7</b><div class="vbar"><i style="width:64%"></i></div><p>640 / 1000 XP · 🔥 3 Tage Serie</p><div class="abz">🏅🦊⭐🧊</div><img src="_vs/m4.webp" alt=""></div>'
 '<div class="u-sk u-pastell2"><small>Dein Freund</small><b>Milo · Level 8</b><div class="vbar"><i style="width:30%"></i></div><p>Fordert dich zum Duell: 10 Fragen Schweiz</p><span class="ers-btn" style="align-self:flex-start;margin-top:8px;padding:9px 16px;font-size:.9rem">⚔️ Annehmen</span><img src="_vs/j4.webp" alt=""></div></div>'
 +H1+heute()+H2+kacheln())

V['u8']=W(8,'<div class="s-kleinbuehne">'+buehne(False)+'</div>'+SL+PILLS+H1+
 '<div class="u-drei"><div class="u-hk u-pastell1"><img src="_vs/m2.webp" alt=""><span class="em">🔥</span><b>3 Tage Serie</b><small>Noch 5 Fragen für heute</small><span class="ers-btn">Weiter</span></div>'
 '<div class="u-hk u-pastell2"><img src="_vs/j2.webp" alt=""><span class="em">📅</span><b>Tagesquiz</b><small>5 neue Fragen, jeden Tag</small><span class="ers-btn">Spielen</span></div>'
 '<div class="u-hk u-pastell3"><img src="_vs/m6.webp" alt=""><span class="em">🎯</span><b>Fehler üben</b><small>12 falsche Fragen nochmals</small><span class="ers-btn weiss">Üben</span></div></div>'
 +H2+kacheln())

V['u9']=W(9,'<div class="s-kleinbuehne">'+buehne(False)+'</div>'+SL+PILLS+PILLS3+'<div style="height:50px"></div>'
 '<div class="u-spalten"><div class="u-sp u-pastell1"><img src="_vs/m5.webp" alt=""><b>Mit Lumi lernen</b><small>Ruhig und schlau</small><div class="u-akt"><span>📖 Bibliothek</span><span>🎲 Zufällige Fragen</span><span>🎯 Fehler üben (12)</span></div></div>'
 '<div class="u-sp u-pastell2"><img src="_vs/j5.webp" alt=""><b>Mit Milo spielen</b><small>Schnell und mutig</small><div class="u-akt"><span>📱 Qeels</span><span>⚔️ Wettbewerb &amp; Duell</span><span>📅 Tagesquiz</span></div></div></div>')

V['u10']=W(10,'<div class="u-hero">'+buehne(False).replace('ers-b"','ers-b" style="height:80px"')+SL+PILLS+CTA+'<img class="t-fig" src="_vs/duo-jubel.webp" alt=""></div><div class="u-ueber">'+heute()+'</div>'+H2+kacheln())

V['u11']=W(11,'<div class="u-kreis"><div class="u-l">'+buehne(False).replace('ers-b"','ers-b" style="height:90px;justify-content:flex-start;margin:0 0 4px"')+SL+PILLS+CTA+'</div>'
 '<div class="u-rund"><img src="_vs/duo-cool.webp" alt=""></div>'
 '<div class="u-r"><h3 class="ers-h" style="margin:0">Heute für dich</h3>'+heute().replace('class="ers-heute"','class="ers-heute" style="grid-template-columns:1fr;gap:8px"')+'</div></div>'+H2+kacheln())

V['u12']=W(12,'<div class="s-kleinbuehne">'+buehne(False)+'</div>'+SL+PILLS+
 '<div class="u-zz"><img class="t-fig" src="_vs/m7.webp" alt=""><div class="mcard"><h4>Heute für dich</h4>'+heute()+'</div></div>'
 '<div class="u-zz um"><div class="mcard"><h4>Was willst du machen?</h4>'+kacheln()+'</div><img class="t-fig" src="_vs/j7.webp" alt=""></div>'
 '<div class="ers-cta" style="margin-top:18px"><span class="ers-btn">▶ Los geht\'s</span></div>')

V['u13']=W(13,'<div class="s-kleinbuehne">'+buehne(False)+'</div>'+SL+PILLS+
 '<div class="u-app"><img class="l t-fig" src="_vs/m5.webp" alt=""><div class="u-phone"><h4>Heute für dich</h4><div class="z"><span class="s-ico g1" style="width:40px;height:40px;font-size:1.2rem">🔥</span><div>3 Tage Serie<small>Noch 5 Fragen</small></div></div><div class="z"><span class="s-ico g5" style="width:40px;height:40px;font-size:1.2rem">📅</span><div>Tagesquiz<small>5 neue Fragen</small></div></div><div class="z"><span class="s-ico g6" style="width:40px;height:40px;font-size:1.2rem">🎯</span><div>Fehler üben<small>12 Fragen</small></div></div><span class="ers-btn">▶ Los geht\'s</span></div><img class="r t-fig" src="_vs/zeigen.webp" alt=""></div>'
 +H2+kacheln())

V['u14']=W(14,'<div class="s-kleinbuehne">'+buehne(False)+'</div>'+SL+PILLS+
 '<div class="u-truhe"><img class="t-fig" src="_vs/duo-bereit.webp" alt=""><div class="mcard u-tk"><h4><span>🎁</span>Abend-Truhe</h4><p>Schaff heute alle drei Stopps, dann öffnet sich die Truhe mit Münzen und einem Sticker.</p>'
 '<div class="u-stufen"><span class="ok">✓ Morgenfrage</span><i>›</i><span class="jetzt">📅 Tagesquiz</span><i>›</i><span>🎯 Fehler üben</span><i>›</i><span>🎁 Truhe</span></div>'
 '<div class="ers-cta" style="justify-content:flex-start"><span class="ers-btn">▶ Tagesquiz spielen</span></div></div></div>'
 +H2+kacheln())

TG=[('Mo','ok','m1.webp'),('Di','ok','j1.webp'),('Mi','ok heute','m4.webp'),('Do','','') ,('Fr','',''),('Sa','',''),('So','','')]
V['u15']=W(15,'<div class="s-kleinbuehne">'+buehne(False)+'</div>'+SL+PILLS+
 '<div class="u-woche"><img class="t-fig" src="_vs/m8.webp" alt=""><div class="mcard u-kal"><h4>🔥 Deine Woche: 3 Tage am Stück</h4><div class="u-tage">'+''.join(f'<div class="{c}">{t}{AV(a) if a else "<i>·</i>"}</div>' for t,c,a in TG)+'</div><p>Heute noch 5 Fragen, dann sind es 4 Tage. Lumi und Milo wechseln sich ab.</p></div></div>'
 +'<div class="ers-cta" style="margin-top:16px"><span class="ers-btn">▶ Los geht\'s</span><span class="ers-btn weiss">📅 Tagesquiz</span></div>'+H2+kacheln())

V['u16']=W(16,'<div class="s-kleinbuehne">'+buehne(False)+'</div>'+SL+PILLS+H1+
 '<div class="u-faecher"><img class="t-fig" src="_vs/m6.webp" alt=""><div class="u-fan"><div class="u-fc a u-pastell1"><span class="em">🔥</span><div><b>3 Tage Serie</b><small>Noch 5 Fragen für heute</small></div></div><div class="u-fc b u-pastell2"><span class="em">📅</span><div><b>Tagesquiz</b><small>5 neue Fragen, jeden Tag</small></div></div><div class="u-fc c u-pastell3"><span class="em">🎯</span><div><b>Fehler üben</b><small>12 falsche Fragen nochmals</small></div></div></div><img class="t-fig" src="_vs/j6.webp" alt=""></div>'
 +'<div class="ers-cta" style="margin-top:10px"><span class="ers-btn">▶ Los geht\'s</span></div>'+H2+kacheln())

V['u17']=W(17,'<div class="t-grid"><div class="t-text">'+buehne(False)+SL+PILLS+CTA+'</div><div class="u-milo"><div class="t-bub r">Yo! 😎 Lust auf ein <b>Duell</b>? Ich hab heute schon 8 richtig.</div><img class="t-fig" src="_vs/j2.webp" alt=""></div></div>'+H1+heute()+H2+kacheln())

V['u18']=W(18,'<div class="s-kleinbuehne">'+buehne(False)+'</div>'+SL+
 '<div class="u-zahl"><b>5</b><img class="t-fig" src="_vs/zeigen.webp" alt=""><div class="u-txt"><b>Fragen bis zur Serie</b><small>Dann sind es 4 Tage am Stück. Milo zählt mit.</small></div></div>'
 +'<div class="ers-cta" style="margin-top:14px"><span class="ers-btn">▶ Jetzt 5 Fragen</span><span class="ers-btn weiss">📅 Tagesquiz</span></div>'+H1+heute()+H2+kacheln())

V['u19']=W(19,'<div class="s-kleinbuehne">'+buehne(False)+'</div>'+SL+PILLS+PILLS3+
 '<div class="u-teams"><div class="u-team lumi u-pastell1"><small>Team Lumi</small><b>214 Kinder</b><p>Ruhig, schlau, mag Tiere und Berge. Diese Woche vorn.</p><span class="ers-btn">🩷 Team Lumi beitreten</span><img src="_vs/m3.webp" alt=""></div>'
 '<div class="u-team milo u-pastell2"><small>Team Milo</small><b>198 Kinder</b><p>Schnell, mutig, mag Duelle und Sport. Holt auf!</p><span class="ers-btn">💙 Team Milo beitreten</span><img src="_vs/j3.webp" alt=""></div></div>'
 +H2+kacheln())

V['u20']=W(20,'<div class="s-kleinbuehne">'+buehne(False)+'</div>'+SL+
 '<div class="mcard u-gruss"><div><small class="dat">Dienstag, 13. Oktober</small><h2>Guten Tag! 👋</h2><p>Lumi und Milo haben heute drei Sachen für dich vorbereitet.</p>'+heute()+CTA+'</div><img class="t-fig" src="_vs/duo-lachen.webp" alt=""></div>'
 +H2+kacheln())

for k,html in V.items():
  html=html.replace('`','\\`')
  js='<script>(function(){const o=window.renderHome;window.renderHome=function(){o.apply(this,arguments);const h=document.querySelector(".hero");if(!h)return;h.classList.add("vs");h.innerHTML=`'+html+'`;};})();</script>'
  out=src.replace('</head>','<style id="vs">'+common+'</style></head>',1)
  i=out.rfind('</body>');out=out[:i]+js+out[i:]
  open(f'{OUT}/vorschlag-{k}.html','w',encoding='utf-8').write(out)
print('ok',len(V))
