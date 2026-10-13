# V-Runde: 5 Varianten der Cool-Spalte (U2) und 5 Varianten des Hallo-Banners (U1). Aufruf: python3 gen13.py <index.html> <ausgabeordner>
import sys
src=open(sys.argv[1],encoding='utf-8').read()
OUT=sys.argv[2]
src=src.replace("navigator.serviceWorker.register","void 0&&navigator.serviceWorker.register")
common=''.join(open(f).read() for f in ['common.css','HB.css','Q.css','S.css','T.css','U.css','V.css'])
LOGO='<img class="ers-logo" src="${ICON_SRC}" alt="easyplay">'
def buehne(): return '<div class="ers-b">'+LOGO+'</div>'
SL='<div class="vs-slogan">Spiel dich schlau!</div>'
PILLS='<div class="vs-pills"><span><b>${allCount().toLocaleString("de-CH")}</b> Fragen</span><span><b>75</b> Themen</span><span><b>3</b> Stufen</span><span>🇨🇭 mit Schweiz-Wissen</span></div>'
CTA='<div class="ers-cta"><span class="ers-btn">▶ Los geht\'s</span><span class="ers-btn weiss">📅 Tagesquiz</span></div>'
HEUTE=[('feuer','🔥','3 Tage Serie','Noch 5 Fragen für heute'),('','📅','Tagesquiz','5 neue Fragen, jeden Tag'),('','🎯','Fehler üben (12)','Falsche Fragen nochmals')]
def heute():
  return '<div class="ers-heute">'+''.join(f'<div class="ers-karte {c}"><span class="em">{e}</span><span><b>{t}</b><small>{s}</small></span></div>' for c,e,t,s in HEUTE)+'</div>'
K=[('k1','📖','Bibliothek'),('k2','📱','Qeels'),('k3','⚔️','Wettbewerb &amp; Duell'),('k4','🎲','Zufällige Fragen')]
G={'k1':'g1','k2':'g2','k3':'g3','k4':'g4'}
def kacheln():
  return '<div class="ers-kacheln">'+''.join(f'<span class="ers-k {c} hell"><i class="{G[c]}">{e}</i><b>{t}</b></span>' for c,e,t in K)+'</div>'
H1='<h3 class="ers-h">Heute für dich</h3>'; H2='<h3 class="ers-h">Was willst du machen?</h3>'
LISTE=H1+'<div class="v-liste">'+heute()+'</div>'
TEXT=buehne()+SL+PILLS
W=lambda n,inner:'<div class="vsX vsQ vsS vsT vsU vsV vsV'+str(n)+' vohneleiste">'+inner+'</div>'
V={}

# Cool-Spalte: Varianten von U2
V['v1']=W(1,'<div class="v-zwei"><img class="t-fig" src="_vs/duo-cool.webp" alt=""><div>'+TEXT+LISTE+CTA+'</div></div>'+H2+kacheln())

V['v2']=W(2,'<div class="v-zwei"><div>'+TEXT+LISTE+CTA+'</div><div class="v-panel u-pastell2"><img class="t-fig" src="_vs/duo-bereit.webp" alt=""></div></div>'+H2+kacheln())

V['v3']=W(3,'<div class="v-zwei"><div>'+TEXT+'<h3 class="ers-h">Was willst du machen?</h3><div class="v-mini">'+kacheln()+'</div>'+CTA+'</div><img class="t-fig" src="_vs/duo-cool.webp" alt=""></div>'+H1+heute())

V['v4']=W(4,'<div class="v-zwei"><div>'+TEXT+LISTE+CTA+'</div><div class="v-fig"><div class="t-bub r">Wer ist bereit für ein <b>Duell</b>? 😎 Wir schon!</div><img class="t-fig" src="_vs/duo-zeigen.webp" alt=""></div></div>'+H2+kacheln())

V['v5']=W(5,'<div class="mcard v-karte"><div>'+TEXT+LISTE+CTA+'</div><img class="t-fig" src="_vs/duo-praesentieren.webp" alt=""></div>'+H2+kacheln())

# Hallo-Banner: Varianten von U1
V['v6']=W(6,'<div class="mcard v-banner"><img class="t-fig" src="_vs/duo-hallo.webp" alt=""><div class="t-text">'+TEXT+CTA+'</div></div>'+H1+heute()+H2+kacheln())

V['v7']=W(7,'<div class="mcard v-banner"><div class="t-text">'+TEXT+CTA+'</div><img class="t-fig" src="_vs/duo-winken.webp" alt=""></div>'+H1+heute()+H2+kacheln())

V['v8']=W(8,'<div class="mcard v-banner"><img class="t-fig" src="_vs/duo-hallo.webp" alt=""><div class="t-text"><div class="t-bub">Hoi! 👋 Schön, dass du da bist. Heute warten <b>5 neue Fragen</b> auf dich.</div>'+TEXT+CTA+'</div></div>'+H1+heute()+H2+kacheln())

V['v9']=W(9,'<div class="mcard v-banner"><img class="t-fig" src="_vs/duo-lachen.webp" alt=""><div class="t-text">'+TEXT+CTA+'</div><div class="v-heute u-pastell2"><h4>Heute für dich</h4>'+heute().replace('class="ers-heute"','class="ers-heute" style="grid-template-columns:1fr;gap:8px"')+'</div></div>'+H2+kacheln())

V['v10']=W(10,'<div class="mcard v-banner"><img class="t-fig" src="_vs/duo-jubel.webp" alt=""><div class="t-text">'+TEXT+CTA+'</div></div><div class="v-ueber">'+kacheln()+'</div>'+H1+heute())

for k,html in V.items():
  html=html.replace('`','\\`')
  js='<script>(function(){const o=window.renderHome;window.renderHome=function(){o.apply(this,arguments);const h=document.querySelector(".hero");if(!h)return;h.classList.add("vs");h.innerHTML=`'+html+'`;};})();</script>'
  out=src.replace('</head>','<style id="vs">'+common+'</style></head>',1)
  i=out.rfind('</body>');out=out[:i]+js+out[i:]
  open(f'{OUT}/vorschlag-{k}.html','w',encoding='utf-8').write(out)
print('ok',len(V))
