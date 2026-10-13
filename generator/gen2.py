src=open('../index.html',encoding='utf-8').read()
src=src.replace("navigator.serviceWorker.register","void 0&&navigator.serviceWorker.register")
common=open('/tmp/claude-0/vs2/gen/common.css').read()
PILLS='<div class="vs-pills"><span><b>${allCount().toLocaleString("de-CH")}</b> Fragen</span><span><b>75</b> Themen</span><span><b>3</b> Stufen</span><span>🇨🇭 mit Schweiz-Wissen</span></div>'
SL='<div class="vs-slogan">Spiel dich schlau!</div>'
LOGO='<img class="vlogo" src="${ICON_SRC}" alt="easyplay">'
def st(cls,x,y,c,s,em,n): return f'<button class="st {cls}" style="left:{x}%;top:{y}%;--c:{c};--s:{s}"><span class="kreis">{em}</span><span class="n">{n}</span></button>'
V={}
V['d']=('<div class="vsD"><div class="kopf">'+LOGO.replace('class="vlogo" ','')+'<div>'+SL+'</div></div>'
 '<div class="xp"><span class="lvl">7</span><div class="vbar"><i style="width:64%"></i></div><small>320 / 500 XP bis Level 8</small></div>'
 '<div class="pfad"><svg viewBox="0 0 1000 380" preserveAspectRatio="none"><path d="M60,300 C180,300 170,150 270,150 S390,236 480,236 S600,236 700,236 S840,110 920,114" fill="none" stroke="#fff" stroke-width="30" stroke-linecap="round" opacity=".85"/><path d="M60,300 C180,300 170,150 270,150 S390,236 480,236 S600,236 700,236 S840,110 920,114" fill="none" stroke="#8A3FE0" stroke-width="6" stroke-dasharray="2 18" stroke-linecap="round"/></svg>'
 +st('fertig',6,79,'linear-gradient(135deg,#3D5AFE,#6E8BFF)','#2A3AB0','📅','Tagesquiz')
 +st('fertig',27,40,'linear-gradient(135deg,#E043B8,#FF8A3D)','#A82B6E','🎲','Zufall')
 +st('jetzt',48,62,'linear-gradient(135deg,#8A3FE0,#C86BFF)','#5B22A8','📖','Bibliothek')
 +st('',70,62,'linear-gradient(135deg,#0FA968,#1E9BE0)','#0B6E6A','⚔️','Duell')
 +st('zu',92,30,'linear-gradient(135deg,#F09A12,#FFC94A)','#A86A00','🎁','Schatz')
 +'<img class="figur" src="_vs/j3.webp" alt="" style="left:84%;top:82%;height:150px"><div class="sprech" style="left:33%;top:27%">Weiter geht\'s, Lumi wartet! 📖</div><img class="figur" src="_vs/m7.webp" alt="" style="left:37%;top:78%;height:140px"></div></div>')
V['e']=('<div class="vsE vohneleiste"><div class="vlinks">'+LOGO+SL+PILLS+'<div class="weiter"><span>📖 Bibliothek</span><span>📱 Qeels</span><span>⚔️ Duell</span><span>🎲 Mehr Fragen</span></div></div>'
 '<div class="vcard quiz"><img class="jubel" src="_vs/m5.webp" alt=""><div class="quizkopf"><span class="vtag rot">⚡ Sofort spielen</span><span class="zeit">⏱ 0:18</span></div><div class="vbar"><i style="width:60%"></i></div>'
 '<div class="frage">Wie lang ist der Gotthard-Basistunnel?</div><div class="antw"><button>17 km</button><button>35 km</button><button data-r="1">57 km</button><button>102 km</button></div>'
 '<div class="quizfuss"><span>Frage 1 von 5 · ohne Anmeldung</span><span class="punkte">⭐ 0 Punkte</span></div><div class="konf"></div><img class="zeigen" src="_vs/zeigen.webp" alt=""></div></div>')
def reel(c,top,q,wer,likes,kom):
  return f'<div class="reel {c}"><span class="play">▶ Qeel</span>{top}<div class="seite"><span><i>❤️</i>{likes}</span><span><i>💬</i>{kom}</span><span><i>↗️</i></span></div><q>{q}</q><div class="wer">{wer}</div></div>'
STORIES=''.join(f'<button class="story{" gesehen" if g else ""}"><span class="ring"><b class="{"neu" if n else ""}">{e}</b></span><span>{t}</span></button>' for e,t,n,g in [('🦁','Tiere',1,0),('🚀','Weltall',1,0),('🇨🇭','Schweiz',0,0),('⚽','Sport',0,0),('💡','Erfindungen',1,0),('🎵','Musik',0,1),('🫀','Körper',0,1),('🏰','Ritter',0,1)])
V['f']=('<div class="vsF"><div class="kopf">'+LOGO+'<div>'+SL+'</div></div><div class="stories">'+STORIES+'</div>'
 '<div class="titel"><b>Qeels für dich</b><a href="#">Alle ansehen →</a></div><div class="reels">'
 +reel('r1','<span class="gross">🐙</span>','Wie viele Herzen hat ein Oktopus?','Natur & Wissen · 🌱 Entdecker','2,4k','318')
 +reel('r2','<img src="_vs/m8.webp" alt="">','Lumi fragt: Welcher Kanton hat die meisten Seen?','Schweiz · 🚀 Könner','1,9k','204')
 +reel('r3','<span class="gross">🌋</span>','Warum spuckt ein Vulkan Feuer? In 30 Sekunden erklärt','Natur & Wissen · 🚀 Könner','3,1k','412')
 +reel('r4','<img src="_vs/j6.webp" alt="">','Milo fordert dich heraus: 5 Fragen zur Raumfahrt','Duell · 🏅 Profis','987','96')
 +'</div><div class="vs-ctas"><button class="big zufall" type="button"><span class="cicon">🎲</span> Zufällige Fragen</button><button class="big bibl" type="button"><span class="cicon">📖</span> Bibliothek</button></div></div>')
V['g']=('<div class="vsG vohneleiste"><div class="bento">'
 '<div class="vcard t gross"><img class="k1" src="_vs/spring0.webp" alt=""><img class="k2" src="_vs/spring1.webp" alt="">'+LOGO+SL+'<div class="vs-ctas"><button class="big zufall" type="button"><span class="cicon">▶</span> Los geht\'s</button></div></div>'
 '<div class="vcard t serie"><span class="vtag rot">🔥 Serie</span><div class="ringw"><div class="ring"><b>3</b></div><div><div class="vh">3 Tage</div><p class="vsub">Noch 2 Fragen für heute</p></div></div><div class="tage"><i class="an"></i><i class="an"></i><i class="an"></i><i></i><i></i><i></i><i></i></div></div>'
 '<div class="vcard t quizt"><span class="vtag">📅 Tagesquiz</span><div class="uhr">05:12:33</div><p class="vsub">bis zum nächsten Quiz</p><p style="margin:10px 0 0"><span class="knopfmini">Heute spielen</span></p></div>'
 '<div class="vcard t rang"><span class="vtag">🏆 Rangliste Woche</span><ol><li>🥇 Mia <em>1240</em></li><li>🥈 Noah <em>1185</em></li><li class="du">⭐ Du <em>960</em></li></ol></div>'
 '<div class="vcard t duell"><span class="vtag gruen">⚔️ Duell</span><div class="vh" style="margin-top:8px">Fordere jemanden heraus</div><p class="vsub" style="max-width:60%">Link schicken und gleichzeitig spielen</p><img src="_vs/duo6.webp" alt=""></div>'
 '<div class="vcard t wusst"><span class="vtag gruen">💡 Wusstest du?</span><div class="vh" style="margin-top:8px">Schnecken können bis zu drei Jahre schlafen.</div><p class="vsub">Tippe für die nächste Überraschung</p><img src="_vs/liegen.webp" alt=""></div>'
 '<div class="vcard t abz"><span class="vtag">🎖 Abzeichen</span><div class="vh" style="margin-top:8px">5 von 17</div><div class="reihe"><span>🌱</span><span>🔥</span><span>📚</span><span class="zu">🦉</span><span class="zu">👑</span></div></div>'
 '<div class="vcard t" style="background:linear-gradient(150deg,#FF8A3D,#E043B8);color:#fff"><span class="vtag">📱 Qeels</span><div class="vh" style="color:#fff;margin-top:8px">Wissen in 30 Sekunden</div><p class="vsub" style="color:#fff">Wischen, lernen, liken</p></div>'
 '</div></div>')
V['h']=('<div class="vsH vohneleiste"><div class="oben">'+LOGO+'<div>'+SL+'<div class="vcard profil"><span class="lvl">7</span><div style="flex:1"><small>Level 7 · Entdecker</small><div class="vbar"><i style="width:64%"></i></div></div><span class="muenzen">🪙 245</span></div></div></div>'
 '<div class="event"><span class="vtag rot">Wochen-Challenge</span><div class="vh" style="margin-top:10px">Alpen-Expedition 🏔️</div><p>Beantworte 50 Fragen über die Schweiz und hol dir das goldene Steinbock-Abzeichen.</p>'
 '<div class="countdown"><span><b>3</b><small>Tage</small></span><span><b>14</b><small>Std</small></span><span><b>22</b><small>Min</small></span></div>'
 '<div class="ziel"><div class="vbar"><i style="width:46%"></i></div><small>23 von 50 Fragen</small></div><span class="knopf">Weiterspielen →</span><img class="e1" src="_vs/spring1.webp" alt=""><img class="e2" src="_vs/spring0.webp" alt=""></div>'
 '<div class="reihe3"><div class="vcard truhe"><span class="vtag">🎁 Tägliche Truhe</span><div><span class="t">🧰</span></div><div class="vh">Bereit zum Öffnen!</div><p class="vsub">Münzen, Sticker oder ein neues Outfit</p></div>'
 '<div class="vcard begleiter"><span class="vtag">👟 Dein Begleiter</span><div class="vh" style="margin-top:6px">Wer spielt mit dir?</div><div class="wahl"><span class="an"><img src="_vs/m1.webp" alt=""></span><span><img src="_vs/j4.webp" alt=""></span><span class="zu"><img src="_vs/m3.webp" alt=""></span><span class="zu"><img src="_vs/j8.webp" alt=""></span></div></div>'
 '<div class="vcard klasse"><span class="vtag">🏫 Meine Klasse</span><ol><li>🥇 Lea <em>1240</em></li><li>🥈 Jan <em>1185</em></li><li>🥉 Du <em>960</em></li><li>4. Elias <em>905</em></li></ol></div></div></div>')
QUIZJS='document.querySelectorAll(".vsE .antw button").forEach(b=>b.onclick=()=>{const bs=[...b.parentNode.children];bs.forEach(x=>x.classList.add(x.dataset.r?"richtig":"falsch"));if(b.dataset.r){document.querySelector(".vsE .punkte").textContent="⭐ 10 Punkte";const k=document.querySelector(".vsE .konf");for(let i=0;i<18;i++){const e=document.createElement("i");e.textContent=["🎉","⭐","✨","🎊"][i%4];e.style.left="60%";e.style.top="55%";e.style.setProperty("--x",(Math.random()*400-200)+"px");e.style.setProperty("--y",(Math.random()*-300)+"px");k.appendChild(e);}}});'
for k,html in V.items():
  css=common+open(f'/tmp/claude-0/vs2/gen/{k.upper()}.css').read()
  html=html.replace('`','\\`')
  js='<script>(function(){const o=window.renderHome;window.renderHome=function(){o.apply(this,arguments);const h=document.querySelector(".hero");if(!h)return;h.classList.add("vs");h.innerHTML=`'+html+'`;'+(QUIZJS if k=='e' else '')+'};})();</script>'
  out=src.replace('</head>','<style id="vs">'+css+'</style></head>',1)
  i=out.rfind('</body>');out=out[:i]+js+out[i:]
  open(f'/mnt/user-data/outputs/easyplay/vorschlag-{k}.html','w',encoding='utf-8').write(out)
print('ok')
