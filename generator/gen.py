import re
src=open('../index.html',encoding='utf-8').read()
src=src.replace("navigator.serviceWorker.register","void 0&&navigator.serviceWorker.register")
common=open('/tmp/claude-0/vs2/gen/common.css').read()
PILLS='<div class="vs-pills"><span><b>${allCount().toLocaleString("de-CH")}</b> Fragen</span><span><b>75</b> Themen</span><span><b>3</b> Stufen</span><span>🇨🇭 mit Schweiz-Wissen</span></div>'
CTAS='<div class="vs-ctas"><button class="big zufall" type="button"><span class="cicon">🎲</span> Zufällige Fragen</button><button class="big bibl" type="button"><span class="cicon">📖</span> Bibliothek</button><button class="big duell" type="button"><span class="cicon">⚔️</span> Wettbewerb &amp; Duell</button></div>'
SL='<div class="vs-slogan">Spiel dich schlau!</div>'
V={
'A':f'<div class="vsA"><div class="buehne"><img class="vkid l" src="_vs/spring0.webp" alt=""><img class="vlogo" src="${{ICON_SRC}}" alt="easyplay"><img class="vkid r" src="_vs/spring1.webp" alt=""></div><div class="vs-slogan-wrap">{SL}</div>{PILLS}{CTAS}</div>',
'B':f'<div class="vsB"><div class="vlinks"><img class="vlogo" src="${{ICON_SRC}}" alt="easyplay">{SL}{PILLS}{CTAS}</div><div class="vrechts"><img class="liegen" src="_vs/liegen.webp" alt=""><div class="tagkarte"><h3>Heute für dich</h3><p>Lumi hat schon etwas vorbereitet.</p><div class="vzeilen"><div class="vzeile"><em>📅</em><span>Tagesquiz<small>5 neue Fragen, jeden Tag</small></span></div><div class="vzeile feuer"><em>🔥</em><span>3 Tage Serie<small>Mach heute weiter!</small></span></div><div class="vzeile"><em>🎯</em><span>Fehler üben<small>12 Fragen nochmals versuchen</small></span></div></div></div><img class="zeigen" src="_vs/zeigen.webp" alt=""></div></div>',
'C':f'<div class="vsC"><div class="kopfzeile"><img class="vlogo" src="${{ICON_SRC}}" alt="easyplay"><div>{SL}{PILLS}</div></div><div class="vkacheln"><button class="vkachel k1"><img src="_vs/m2.webp" alt="">🎲 Zufällige Fragen<small>Überrasch dich selbst</small></button><button class="vkachel k2"><img src="_vs/j4.webp" alt="">📖 Bibliothek<small>Lesen und entdecken</small></button><button class="vkachel k3"><span class="paar"><img src="_vs/m4.webp" alt=""><img src="_vs/j1.webp" alt=""></span>⚔️ Duell<small>Gegen Freunde spielen</small></button><button class="vkachel k4"><img src="_vs/m6.webp" alt="">📅 Tagesquiz<small>5 Fragen pro Tag</small></button></div></div>',
}
for k,html in V.items():
  css=common+open(f'/tmp/claude-0/vs2/gen/{k}.css').read()
  extra=''
  if k=='C':
    extra='const lb=document.getElementById("bereiche");if(lb&&!document.querySelector(".vs-duo")){const d=document.createElement("img");d.className="vs-duo";d.src="_vs/duo5.webp";d.alt="";lb.before(d);}'
    css+='.vs-duo{display:block;height:150px;margin:30px auto -14px;filter:drop-shadow(0 10px 12px rgba(27,34,64,.25))}'
  js='<script>(function(){const o=window.renderHome;window.renderHome=function(){o.apply(this,arguments);const h=document.querySelector(".hero");if(!h)return;h.classList.add("vs");h.innerHTML=`'+html+'`;'+extra+'};})();</script>'
  out=src.replace('</head>','<style id="vs">'+css+'</style></head>',1)
  i=out.rfind('</body>');out=out[:i]+js+out[i:]
  open(f'/mnt/user-data/outputs/easyplay/vorschlag-{k.lower()}.html','w',encoding='utf-8').write(out)
print('ok')
