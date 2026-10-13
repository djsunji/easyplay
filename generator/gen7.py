# P-Runde: 10 modernere Startseiten. Aufruf: python3 gen7.py <index.html> <ausgabeordner>
import sys
src=open(sys.argv[1],encoding='utf-8').read()
OUT=sys.argv[2]
src=src.replace("navigator.serviceWorker.register","void 0&&navigator.serviceWorker.register")
common=open('common.css').read()+open('HB.css').read()+open('P.css').read()
LOGO='<img src="${ICON_SRC}" alt="easyplay">'
def kopf(rechts=True):
  r=('<div class="rechts"><span class="stat">🔥 12 Tage</span><span class="stat">🪙 245</span><span class="stat">⭐ Level 7</span></div>' if rechts else '')
  return '<div class="kopfklein">'+LOGO+'<div class="vs-slogan">Spiel dich schlau!</div>'+r+'</div>'
V={}

V['p1']=('<div class="vsX vsN vsN1 vohneleiste"><div class="glas buehne">'
 '<img class="fig l" src="_vs/m4.webp" alt=""><img class="fig r" src="_vs/j6.webp" alt="">'
 +LOGO.replace('<img','<img style="height:clamp(70px,8vw,100px)"')+
 '<div class="vs-slogan" style="text-align:center">Spiel dich schlau!</div>'
 '<div class="gruss">🔥 12 Tage Serie · heute noch 7 Fragen bis zum Ziel</div>'
 '<div class="ring" style="--p:30"><div class="play"><div><span>▶</span><b>Weiterspielen</b><small>Frage 4 von 10</small></div></div></div>'
 '<div class="links"><span class="chip">📅 Tagesquiz</span><span class="chip">🎲 Zufall</span><span class="chip">📚 Bibliothek</span><span class="chip">⚔️ Duell</span><span class="chip">🔁 Fehler üben</span></div>'
 '</div></div>')

covers=[('🧊','Gletscher','10 Fragen · Entdecker','linear-gradient(150deg,#4aa8e8,#1d5fb0)',1),('🏰','Burgen der Schweiz','12 Fragen · Könner','linear-gradient(150deg,#FF8A3D,#C2410C)',1),('🌍','Unser Sonnensystem','10 Fragen · Entdecker','linear-gradient(150deg,#8A3FE0,#3b1f6e)',0),('⚽','Fussball-Wissen','15 Fragen · Könner','linear-gradient(150deg,#0FA968,#0B6E6A)',0),('🧀','Käse & Schokolade','8 Fragen · Entdecker','linear-gradient(150deg,#FFB347,#E0352B)',0)]
cv=''.join(f'<div class="cover" style="background:{g}">{"<span class=neu>NEU</span>" if n else ""}<span class="e">{e}</span><div><b>{t}</b><small>{s}</small></div></div>' for e,t,s,g,n in covers)
kl=[('🦌','Tiere der Alpen','23 aus deiner Klasse','#0FA968'),('🗺️','Kantone & Hauptorte','18 aus deiner Klasse','#3D5AFE'),('🎵','Musikinstrumente','11 aus deiner Klasse','#E043B8')]
kk=''.join(f'<div><span style="background:{c}">{e}</span><div><b>{t}</b><small>{s}</small></div></div>' for e,t,s,c in kl)
V['p2']=('<div class="vsX vsN vsN2 vohneleiste">'+kopf()+'<div class="nacht">'
 '<div class="weiter"><div class="cov">🏔️</div><div><small style="opacity:.85;font-weight:700">WEITERSPIELEN</small><b>Berge der Schweiz</b><div class="vbar"><i style="width:60%"></i></div><small style="opacity:.85">6 von 10 Fragen · noch 2 Minuten</small></div><img src="_vs/m6.webp" alt=""></div>'
 '<h4>Neu für dich <small>Alle ansehen</small></h4><div class="reihe">'+cv+'</div>'
 '<h4>Beliebt in deiner Klasse <small>Diese Woche</small></h4><div class="klein">'+kk+'</div></div></div>')

V['p3']=('<div class="vsX vsN vsN3 vohneleiste">'+kopf()+'<div class="chat">'
 '<div class="lumi"><img src="_vs/m7.webp" alt=""><span class="name">Lumi</span></div>'
 '<div class="glas verlauf">'
 '<div class="bub l">Hoi! 👋 Gestern hast du <b>8 von 10</b> Fragen geschafft. Stark!</div>'
 '<div class="bub l">Worauf hast du heute Lust?</div>'
 '<div class="antw"><span>📅 Tagesquiz</span><span>🎲 Überrasch mich</span><span>🔁 Meine Fehler üben</span><span>⚔️ Gegen Milo spielen</span></div>'
 '<div class="bub m"><img src="_vs/j8.webp" alt=""><span><b>Milo:</b> Ich hab 9 von 10. Schaffst du das auch? 😎</span></div>'
 '<div class="tipp"><i></i><i></i><i></i></div>'
 '</div></div></div>')

V['p4']=('<div class="vsX vsN vsN4 vohneleiste">'+kopf()+'<div class="wrap4">'
 '<div><span class="eyb">Neu: Themen-Stapel</span><h2 class="t">Wisch dich durchs Wissen</h2><p class="s">Nach rechts wischen heisst spielen, nach links kommt das nächste Thema. Lumi und Milo merken sich, was dir gefällt.</p>'
 '<div class="themen"><span class="chip">🇨🇭 Schweiz</span><span class="chip">🦌 Tiere</span><span class="chip">🌍 Welt</span><span class="chip">🔬 Natur & Technik</span><span class="chip">🎨 Kunst</span><span class="chip">⚽ Sport</span></div>'
 '<div class="hint"><span>👈 Weiter</span><span>👉 Spielen</span><span>👆 Merken</span></div></div>'
 '<div class="stapel"><div class="karte k3"></div><div class="karte k2"></div>'
 '<div class="karte k1"><img src="_vs/m3.webp" alt=""><span class="eyb" style="color:#FFE34D">Thema 1 von 24</span><div class="gr">🦅</div><div><b>Tiere der Alpen</b><div class="meta"><span>10 Fragen</span><span>Entdecker</span><span>⏱ 3 Min</span></div></div></div>'
 '<div class="aktion"><span>✕</span><span class="gross">▶</span><span>♥</span></div></div></div></div>')

V['p5']=('<div class="vsX vsN vsN5 vohneleiste">'+kopf(False)+'<div class="wg">'
 '<div class="w l dunkelw" style="background:linear-gradient(150deg,#3D5AFE,#8A3FE0 60%,#E043B8)"><small>Weiterspielen</small><div><b>Berge der Schweiz</b><div class="vbar" style="margin-top:10px"><i style="width:60%"></i></div><p style="margin:8px 0 0;opacity:.9">6 von 10 Fragen</p></div><span class="knopf gelb2" style="align-self:flex-start">▶ Los</span><img src="_vs/spring1.webp" alt=""></div>'
 '<div class="w orange"><small>Serie</small><div class="zahl">12 🔥</div><div class="tage"><i class="an"></i><i class="an"></i><i class="an"></i><i class="an"></i><i class="an"></i><i></i><i></i></div></div>'
 '<div class="w glas"><small>Münzen</small><div class="zahl">245</div><span>🪙 +30 heute</span></div>'
 '<div class="w m dunkelw"><small>Tagesquiz</small><div class="cdz"><b>04:12:30</b><span>bis neu</span></div><span class="knopf gelb2" style="align-self:flex-start;padding:9px 16px">Jetzt spielen</span></div>'
 '<div class="w m glas"><small>Wusstest du?</small><p style="margin:0;font-weight:700;font-size:1.05rem">Der Aletschgletscher ist rund 20 km lang und der grösste der Alpen. 🧊</p><span style="font-weight:800;color:#3D5AFE">Zum Quiz →</span></div>'
 '<div class="w gruenw"><small>Duell</small><div style="font-weight:800;font-size:1.1rem">🚀 Rakete7 wartet auf dich</div><span style="font-weight:800">Annehmen ⚔️</span></div>'
 '<div class="w glas"><small>Abzeichen</small><div class="abz">🏅🦊⭐</div><span style="font-weight:800">9 von 17</span></div>'
 '</div></div>')

hs=[(17,62,'🏫','Schulhaus','Tagesquiz','neu','1'),(37,54,'📚','Bibliothek','Alle Themen','',''),(58,64,'🏟️','Arena','Duelle','',''),(80,56,'🛖','Kiosk','Laden mit Münzen','',''),(68,30,'🚠','Bergstation','Gipfel-Challenge','neu','NEU'),(88,82,'🏛️','Museum','Geschichte','','')]
hh=''.join(f'<div class="dhaus {c}" style="left:{x}%;top:{y}%">{"<span class=dpin>"+p+"</span>" if p else ""}<div class="ddach">{e}</div><span class="dschild">{t}<small>{s}</small></span></div>' for x,y,e,t,s,c,p in hs)
li=''.join(f'<div><span>{e}</span><div>{t}<small>{s}</small></div></div>' for x,y,e,t,s,c,p in hs)
V['p6']=('<div class="vsX vsN vsN6 vohneleiste">'+kopf()+'<div class="dorf">'
 '<svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M0,47 L14,26 L24,36 L40,12 L56,34 L68,18 L84,38 L100,22 L100,47Z" fill="#c9d8f2"/><path d="M40,12 L36,18 L40,17 L43,21 L45,17Z M68,18 L65,22 L68,21 L71,24Z" fill="#fff"/>'
 '<path d="M8,98 C20,80 30,72 40,70 S56,74 62,70 S76,66 84,62" fill="none" stroke="#f3e2b5" stroke-width="3" vector-effect="non-scaling-stroke" style="stroke-width:16px;stroke-linecap:round"/>'
 '<path d="M62,70 C64,56 66,44 68,32" fill="none" stroke="#fff" stroke-dasharray="2 6" vector-effect="non-scaling-stroke" style="stroke-width:3px"/></svg>'
 '<div class="glas titel"><span class="eyb">Willkommen im Wissensdorf</span><h2 class="t" style="font-size:1.6rem">Wohin gehst du heute?</h2><p class="s">Jedes Haus ist ein Spiel. Im Schulhaus wartet das Tagesquiz.</p></div>'
 +hh+'<img class="dkid" src="_vs/m2.webp" alt="" style="left:27%;top:86%"><img class="dkid" src="_vs/j2.webp" alt="" style="left:47%;top:90%"></div>'
 '<div class="liste">'+li+'</div></div>')

V['p7']=('<div class="vsX vsN vsN7 vohneleiste">'+kopf()+'<div class="glas samm">'
 '<div class="faecher">'
 '<div class="sk a"><span class="rar" style="background:#0FA968">HÄUFIG</span><div class="bild" style="background:linear-gradient(150deg,#d9f3e6,#9ed98a)">🐿️</div><b>Murmeltier</b><small>Pfeift bei Gefahr laut</small><div class="wert"><span>🏔️ 2500 m</span><span>#12</span></div></div>'
 '<div class="sk b"><span class="rar" style="background:#3D5AFE">SELTEN</span><div class="bild" style="background:linear-gradient(150deg,#e2e8ff,#a9b8ff)">🐐</div><b>Steinbock</b><small>Kletterkönig der Alpen</small><div class="wert"><span>🏔️ 3000 m</span><span>#04</span></div></div>'
 '<div class="sk c"><span class="rar" style="background:linear-gradient(90deg,#FF3D6E,#8A3FE0)">EPISCH</span><div class="bild" style="background:linear-gradient(150deg,#ffe9a8,#ffb2e0,#b8c4ff)">🦅</div><b>Bartgeier</b><small>Spannweite fast 3 Meter</small><div class="wert"><span>🏔️ 3500 m</span><span>#01</span></div></div>'
 '</div><div><span class="eyb">Sammelkarten</span><h2 class="t">Tiere der Schweiz</h2><p class="s">Je 10 richtige Antworten öffnen ein Päckli mit 3 Karten. Auf jeder Karte steht ein echter Fakt zum Tier.</p>'
 '<div class="fort"><div><span>Deine Sammlung</span><span>23 / 60</span></div><div class="vbar"><i style="width:38%"></i></div></div>'
 '<div class="packen"><span class="knopf pink">🎴 Päckli öffnen</span><span style="font-weight:700;color:#5D5C80">noch 3 Fragen bis zum nächsten</span></div>'
 '<div class="seltenheit"><span class="chip">🟢 Häufig 14</span><span class="chip">🔵 Selten 7</span><span class="chip">🟣 Episch 2</span></div></div></div></div>')

V['p8']=('<div class="vsX vsN vsN8 vohneleiste">'+kopf()+'<div class="glas tag">'
 '<div class="figs"><img src="_vs/m8.webp" alt=""><img src="_vs/j4.webp" alt=""></div>'
 '<span class="eyb">Dienstag, 13. Oktober</span><h2 class="t">Deine Tagesreise</h2><p class="s">Vier kurze Stopps über den Tag verteilt. Schaffst du alle, gibt es die Abend-Truhe.</p>'
 '<div class="bogen"><svg viewBox="0 0 100 50" preserveAspectRatio="none"><path d="M4,46 Q50,-30 96,46" fill="none" stroke="#C9C3EE" stroke-width="3" stroke-dasharray="2 5" vector-effect="non-scaling-stroke" style="stroke-width:4px"/>'
 '<path d="M4,46 Q27,-8 50,8" fill="none" stroke="#E043B8" vector-effect="non-scaling-stroke" style="stroke-width:5px;stroke-linecap:round"/></svg>'
 '<span class="stop ok" style="left:4%;top:92%"></span><span class="stop ok" style="left:26%;top:34%"></span><span class="stop jetzt" style="left:60%;top:17%"></span><span class="stop" style="left:96%;top:92%"></span>'
 '<span class="sonne" style="left:50%;top:6%">☀️</span></div>'
 '<div class="plan">'
 '<div class="p ok"><span class="zeit">07:00</span><b>☀️ Morgenfrage</b><small>1 Frage zum Wachwerden</small><br><span class="st">✓ Geschafft</span></div>'
 '<div class="p ok"><span class="zeit">12:00</span><b>💡 Wusstest du?</b><small>Ein Fakt mit Bild</small><br><span class="st">✓ Gelesen</span></div>'
 '<div class="p jetzt"><span class="zeit">16:00</span><b>📅 Tagesquiz</b><small>10 Fragen für alle gleich</small><br><span class="st">▶ Jetzt spielen</span></div>'
 '<div class="p zu"><span class="zeit">19:00</span><b>🎁 Abend-Truhe</b><small>Öffnet nach allen Stopps</small><br><span class="st">🔒 Noch 1 Stopp</span></div>'
 '</div></div></div>')

V['p9']=('<div class="vsX vsN vsN9 vohneleiste">'+kopf()+'<div class="studio">'
 '<span class="live"><i></i> HEUTE 18:00 · 312 angemeldet</span>'
 '<div><div class="screen"><b>Die grosse Schweiz-Show</b><small>10 Fragen, live mit Lumi und Milo</small></div></div>'
 '<div class="lichter"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>'
 '<div class="podeste"><div class="pod p"><img src="_vs/m1.webp" alt=""><div class="sockel">Team Lumi<small>1 240 Punkte</small></div></div>'
 '<div class="buzz"><div class="buzzer">BUZZ!</div></div>'
 '<div class="pod b"><img src="_vs/j1.webp" alt=""><div class="sockel">Team Milo<small>1 180 Punkte</small></div></div></div></div>'
 '<div class="unten"><div class="vcard"><span class="vtag rot">⏰ Erinnerung</span><p class="vsub" style="margin-top:8px">Wir sagen dir 5 Minuten vorher Bescheid.</p></div>'
 '<div class="vcard"><span class="vtag">🏆 Letzte Show</span><p class="vsub" style="margin-top:8px">Sieger: <b>Panda_Mia</b> mit 10 von 10</p></div>'
 '<div class="vcard"><span class="vtag gruen">🎯 Üben bis zur Show</span><p class="vsub" style="margin-top:8px">5 Probefragen zum Warmwerden</p></div></div></div>')

V['p10']=('<div class="vsX vsN vsN10 vohneleiste">'+kopf()+'<div class="mag">'
 '<div class="feature"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M0,70 L18,40 L30,52 L52,16 L70,46 L84,30 L100,50 L100,100 L0,100Z" fill="rgba(255,255,255,.55)"/><path d="M52,16 L44,30 L50,28 L54,34 L60,27Z M18,40 L14,47 L19,45 L22,49Z" fill="#fff"/></svg>'
 '<span class="num">THEMA DER WOCHE · 42</span><img src="_vs/zeigen.webp" alt="">'
 '<h2>Gletscher: Warum schmelzen sie?</h2><p>Lies drei Fakten, schau dir die Bilder an und mach dann das Quiz zum Thema. Wer alles richtig hat, bekommt das Abzeichen «Eisforscher».</p>'
 '<span class="knopf gelb2">Quiz zum Thema starten ▶</span></div>'
 '<div class="seite">'
 '<div class="glas fakt"><span class="gz">~1400</span><p>Gletscher gibt es ungefähr in der Schweiz.</p></div>'
 '<div class="glas fakt"><span class="gz">20 km</span><p>So lang ist der Aletschgletscher, der grösste der Alpen.</p></div>'
 '<div class="glas auch"><span class="eyb">Auch neu</span><div><span>🧀</span><span>Käse & Schokolade<small>8 Fragen · Entdecker</small></span></div><div><span>🏰</span><span>Burgen der Schweiz<small>12 Fragen · Könner</small></span></div><div><span>🌍</span><span>Unser Sonnensystem<small>10 Fragen · Entdecker</small></span></div></div>'
 '</div></div></div>')

for k,html in V.items():
  html=html.replace('`','\\`')
  js='<script>(function(){const o=window.renderHome;window.renderHome=function(){o.apply(this,arguments);const h=document.querySelector(".hero");if(!h)return;h.classList.add("vs");h.innerHTML=`'+html+'`;};})();</script>'
  out=src.replace('</head>','<style id="vs">'+common+'</style></head>',1)
  i=out.rfind('</body>');out=out[:i]+js+out[i:]
  open(f'{OUT}/vorschlag-{k}.html','w',encoding='utf-8').write(out)
print('ok',len(V))
