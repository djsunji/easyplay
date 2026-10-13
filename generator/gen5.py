exec(open('gen3.py').read().split('V={}')[0])
V={}
CD='<div class="cd"><span>3<small>Tage</small></span><span>14<small>Std</small></span><span>22<small>Min</small></span></div>'
def karte(tag,titel,text,knopf,inhalt):
  return ('<div class="dunkel" style="margin-top:16px"><div class="kopfz"><div><span class="vtag rot">'+tag+'</span><div class="vh" style="margin-top:8px">'+titel+'</div><p style="margin:4px 0 0">'+text+'</p></div><div>'+CD+'<br><span class="gelb">'+knopf+'</span></div></div>'+inhalt+'</div>')
# M1 Gipfeltour Schweiz
CH='M6,34 L12,24 L22,20 L30,12 L42,10 L52,6 L62,8 L70,4 L80,10 L92,14 L96,24 L90,30 L86,42 L76,40 L70,48 L62,46 L56,56 L48,50 L40,56 L32,50 L22,52 L14,46 Z'
peaks=[(74,15,'Säntis','2502 m',''),(50,26,'Pilatus','2128 m',''),(46,40,'Eiger','3967 m','jetzt'),(34,52,'Matterhorn','4478 m','zu'),(82,40,'Piz Bernina','4048 m','zu')]
pk=''.join(f'<div class="peak {c}" style="left:{x}%;top:{y*100/60}%"><b>🏔️</b><span class="lab {"zu" if c=="zu" else ("p" if c=="jetzt" else "g")}" style="position:static;transform:none">{n}</span></div>' for x,y,n,h,c in peaks)
route='M74,15 L50,26 L46,40'; rest='M46,40 L34,52 M46,40 Q70,50 82,40'
V['m1']=('<div class="vsX vsM vsM1 vohneleiste">'+kopf()+karte('Gipfeltour Schweiz','Team Lumi und Team Milo auf Tour durch die Schweiz','Jede Woche ein neuer Gipfel. Fragen zur Region bringen doppelte Meter.','Weiter zum Eiger 🏔️',
 '<div class="szene"><svg viewBox="0 0 100 60" preserveAspectRatio="none"><path d="'+CH+'" fill="rgba(255,255,255,.16)" stroke="rgba(255,255,255,.7)" stroke-width="2" vector-effect="non-scaling-stroke"/><path d="'+route+'" fill="none" stroke="#FFE34D" stroke-width="4" stroke-linecap="round" vector-effect="non-scaling-stroke"/><path d="'+rest+'" fill="none" stroke="#fff" stroke-dasharray="2 8" stroke-linecap="round" vector-effect="non-scaling-stroke" style="stroke-width:3px;opacity:.7"/></svg>'+pk+
 '<img class="fig" src="_vs/m2.webp" alt="" style="left:41%;top:64%;height:100px"><img class="fig" src="_vs/j3.webp" alt="" style="left:53%;top:66%;height:100px"></div>')+
 '<div class="etappen"><div class="vcard et ok"><span class="ic">✅</span><b>Säntis</b><small>Ostschweiz · Woche 1</small></div><div class="vcard et ok"><span class="ic">✅</span><b>Pilatus</b><small>Zentralschweiz · Woche 2</small></div><div class="vcard et jetzt"><span class="ic">🧗</span><b>Eiger</b><small>Bern · 62 %</small></div><div class="vcard et zu"><span class="ic">🔒</span><b>Matterhorn</b><small>Wallis</small></div><div class="vcard et zu"><span class="ic">🔒</span><b>Piz Bernina</b><small>Graubünden</small></div></div></div>')
# M2 Bergbahn
def gondel(c,x,y,img,txt): return f'<div class="gondel {c}" style="left:{x}%;top:{y}%"><div class="buegel"></div><div class="kabine"><img src="_vs/{img}" alt=""></div><span class="lab {c}">{txt}</span></div>'
V['m2']=('<div class="vsX vsM vsM2 vohneleiste">'+kopf()+karte('Bergbahn-Rennen','Wessen Gondel ist zuerst oben?','Jede richtige Antwort zieht die Gondel deines Teams ein Stück nach oben.','Gondel anschieben 🚡',
 '<div class="szene"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M0,100 L35,55 L48,64 L80,8 L100,30 L100,100Z" fill="rgba(255,255,255,.16)"/><line x1="8" y1="60" x2="88" y2="0" stroke="#fff" stroke-width="2" vector-effect="non-scaling-stroke"/><line x1="14" y1="68" x2="94" y2="8" stroke="#fff" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>'
 '<div class="station" style="left:10%;top:66%">🚉 Talstation</div><div class="station" style="left:90%;top:4%">🏁 Gipfelstation</div>'
 +gondel('p',55,24.7,'m1.webp','Team Lumi · 62 %')+gondel('b',36,51.5,'j1.webp','Team Milo · 48 %')+'</div>')+
 '<div class="grid"><div class="vcard" style="text-align:center"><span class="vtag">💪 Dein Schub</span><div class="gross">+34</div><p class="vsub">Richtige Antworten diese Woche für Team Lumi</p></div><div class="vcard"><span class="vtag gruen">⚡ Turbo</span><div class="mi">🔥 <span>5 richtige am Stück</span><em>Turbo 2×</em></div><div class="mi">🇨🇭 <span>Schweiz-Frage</span><em>+2 Meter</em></div></div><div class="vcard"><span class="vtag rot">🏆 Oben angekommen</span><p class="vsub" style="margin-top:8px">Das Siegerteam bekommt den goldenen Gondel-Sticker und 100 Münzen.</p></div></div></div>')
# M3 Gipfelbuch
ein=[('🦊','Fuchs_12 hat 10 Fragen am Stück geschafft','vor 2 Min'),('🏫','Klasse 4b hat Lager 2 erreicht','vor 8 Min'),('🐼','Panda_Mia stempelt: «Super Team!» 🎉','vor 12 Min'),('🚀','Rakete7 hat das Abzeichen «Bergfuchs»','vor 20 Min'),('🐸','Frosch7 hat das Tagesquiz geknackt','vor 31 Min')]
ee=''.join(f'<div class="eintrag"><span>{e}</span><span>{t}</span><small>{z}</small></div>' for e,t,z in ein)
V['m3']=('<div class="vsX vsM vsM3 vohneleiste">'+kopf()+'<div class="mzwei"><div class="dunkel gfahne"><span class="wimpel">🩷 Team Lumi</span><div class="vh" style="margin-top:12px">Expedition Eiger</div><p style="max-width:60%">Ihr seid 1240 m vor Team Milo. Haltet durch bis Sonntag!</p><div class="zahlen"><div><b>3120 m</b><small>Höhe</small></div><div><b>214</b><small>Kinder im Team</small></div></div><br><span class="gelb">Mitklettern ⛏️</span><img src="_vs/spring1.webp" alt=""></div>'
 '<div class="gbuch"><h3>📖 Gipfelbuch</h3>'+ee+'<div class="stempel"><button>👏 Bravo!</button><button>💪 Weiter so!</button><button>🎉 Super Team!</button><button>🏔️ Gipfelstürmer</button></div></div></div></div>')
# M4 Live-Arena
V['m4']=('<div class="vsX vsM vsM4 vohneleiste">'+kopf()+'<div class="dunkel" style="margin-top:16px"><div class="kopfz"><div><span class="live"><i></i> LIVE · 128 Kinder spielen</span><div class="vh" style="margin-top:8px">Berg-Quiz live: jeden Tag um 17 Uhr</div><p style="margin:4px 0 0">10 Fragen für alle gleichzeitig. Jede richtige Antwort lässt dein Team steigen.</p></div><div><span class="gelb">Jetzt mitspielen ▶</span></div></div>'
 '<div class="arena"><div class="turm p"><div class="fill" style="height:68%"></div><img src="_vs/m5.webp" alt="" style="top:32%"><div class="wert">68 %</div></div>'
 '<div class="frage"><span class="vtag rot">Frage 4 von 10 · ⏱ 0:12</span><div class="q">Welcher Pass verbindet Uri mit dem Tessin?</div><div class="antw"><span>Gotthard</span><span>Furka</span><span>Grimsel</span><span>Simplon</span></div><div class="info"><span>🩷 41 Antworten</span><span>💙 37 Antworten</span></div></div>'
 '<div class="turm b"><div class="fill" style="height:54%"></div><img src="_vs/j5.webp" alt="" style="top:46%"><div class="wert">54 %</div></div></div></div></div>')
# M5 Routenwahl
V['m5']=('<div class="vsX vsM vsM5 vohneleiste">'+kopf()+karte('Routenwahl','Wähle deine Route zum Gipfel','Alle Routen zählen für dein Team. Schwierigere Routen bringen mehr Meter pro Frage.','Route starten 🧭',
 '<div class="wetter"><b>🌬️</b><div><b style="font-size:1rem">Heute Föhn!</b><br><small>Bis 18 Uhr doppelte Meter auf allen Routen</small></div></div>'
 '<div class="szene"><svg viewBox="0 0 100 60" preserveAspectRatio="none"><path d="M0,60 L22,36 L32,44 L52,4 L72,40 L80,34 L100,60Z" fill="rgba(255,255,255,.18)"/><path d="M52,4 L46,14 L50,12 L52,17 L56,11 L59,13Z" fill="#fff"/>'
 '<path d="M6,58 C20,56 18,44 30,42 S40,30 44,24 S50,12 52,5" fill="none" stroke="#4CD08A" stroke-width="3" stroke-dasharray="1 4" stroke-linecap="round" vector-effect="non-scaling-stroke" style="stroke-width:5px"/>'
 '<path d="M50,58 C52,44 46,34 50,24 S52,10 52,5" fill="none" stroke="#8FA6FF" stroke-width="3" stroke-dasharray="1 4" stroke-linecap="round" vector-effect="non-scaling-stroke" style="stroke-width:5px"/>'
 '<path d="M94,58 C82,50 76,38 66,30 S56,14 52,5" fill="none" stroke="#FF6B6B" stroke-width="3" stroke-dasharray="1 4" stroke-linecap="round" vector-effect="non-scaling-stroke" style="stroke-width:5px"/></svg>'
 '<span class="lab g" style="left:18%;top:88%">🌱 Wanderweg</span><span class="lab b" style="left:50%;top:98%">🚀 Klettersteig</span><span class="lab p" style="left:86%;top:88%;background:#E0352B">🏅 Nordwand</span>'
 '<img class="fig" src="_vs/m6.webp" alt="" style="left:31%;top:70%;height:100px"><img class="fig" src="_vs/j7.webp" alt="" style="left:68%;top:52%;height:100px"></div>')+
 '<div class="routen"><div class="vcard route an" style="--c:#0FA968"><div class="kopf"><span class="em">🌱</span><span class="faktor">×1</span></div><b>Wanderweg</b><p class="vsub">Entdecker-Fragen · 6 bis 9 Jahre</p></div><div class="vcard route" style="--c:#3D5AFE"><div class="kopf"><span class="em">🚀</span><span class="faktor">×2</span></div><b>Klettersteig</b><p class="vsub">Könner-Fragen · 10 bis 14 Jahre</p></div><div class="vcard route" style="--c:#E0352B"><div class="kopf"><span class="em">🏅</span><span class="faktor">×3</span></div><b>Nordwand</b><p class="vsub">Profi-Fragen · ab 15 Jahren</p></div></div></div>')
for k,html in V.items():
  css=common+open('M.css').read()
  html=html.replace('`','\\`')
  js='<script>(function(){const o=window.renderHome;window.renderHome=function(){o.apply(this,arguments);const h=document.querySelector(".hero");if(!h)return;h.classList.add("vs");h.innerHTML=`'+html+'`;};})();</script>'
  out=src.replace('</head>','<style id="vs">'+css+'</style></head>',1)
  i=out.rfind('</body>');out=out[:i]+js+out[i:]
  open(f'/mnt/user-data/outputs/easyplay/vorschlag-{k}.html','w',encoding='utf-8').write(out)
print('ok')
