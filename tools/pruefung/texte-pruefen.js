// Prüft alle sichtbaren Texte auf Abschneiden (durch overflow eines Vorfahren, Ellipse, Zeilenbegrenzung oder Bildschirmrand).
// Beispiel: Seite lokal starten (python3 -m http.server 8766 im Ordner app/www bzw. im Repo), dann: NODE_PATH=$(npm root -g) node tools/pruefung/texte-pruefen.js http://localhost:8766/index.html 393 800 "" /tmp
// Für die Computer-Ansicht PC=1 davor setzen. Meldet jeden angeschnittenen, gekürzten («…») oder über den Rand ragenden Text.
// Aufruf: node texte.js <url> <breite> <hoehe> <seiten-json|""> [foto-ordner]
const { chromium, devices } = require('playwright');
const [url, w, h, seitenArg = '', ordner = ''] = process.argv.slice(2);
const STANDARD = [
  ['heute', "EP_APP.setTab('heute');go('home')"], ['themen', "EP_APP.setTab('themen');go('home')"],
  ['duell', "EP_APP.setTab('duell');go('duell')"], ['profil', "EP_APP.setTab('profil');go('home')"],
  ['bereich-1', "S.bereich=BEREICHE[0];go('bereich')"], ['bereich-2', "S.bereich=BEREICHE[1];go('bereich')"],
  ['bereich-3', "S.bereich=BEREICHE[2];go('bereich')"], ['bereich-4', "S.bereich=BEREICHE[3];go('bereich')"],
  ['mode', "S.thema=THEMA[Object.keys(THEMA).find(k=>!THEMA[k].menu&&!THEMA[k].versteckt)];go('mode')"],
  ['lib', "EP_APP.setTab('themen');S.libModus=true;document.documentElement.dataset.mode='lib';go('lib')"],
  ['konto', "S.libModus=false;document.documentElement.dataset.mode='spiel';go('konto')"], ['login', "go('login')"], ['register', "go('register')"],
  ['kontakt', "go('kontakt')"], ['epwoche', "go('epwoche')"], ['board', "S.boardModus='gesamt';go('board')"],
  ['season', "S.boardModus='season';S.boardSeason=aktuelleSeason().id;go('board')"], ['x-entdecken', "go('x-entdecken')"],
  ['quiz', "startQuiz(Object.keys(THEMA).find(k=>!THEMA[k].menu&&!THEMA[k].versteckt),'training',10)"],
];
const PRUEF = `(()=>{
  const out=[]; const vw=innerWidth;
  const sichtbar=e=>{const c=getComputedStyle(e);return c.visibility!=='hidden'&&c.display!=='none'&&+c.opacity>0.05};
  const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  let n; const gesehen=new Set();
  while((n=w.nextNode())){
    const t=n.textContent.trim(); if(t.length<2) continue;
    const el=n.parentElement; if(!el||gesehen.has(el)) continue;
    if(el.closest('script,style,noscript,option,select,[aria-hidden="true"],.sr-only,[hidden],.btitel,.count')) continue;
    let ok=true; for(let a=el;a;a=a.parentElement){ if(!sichtbar(a)){ok=false;break;} } if(!ok) continue;
    const r=document.createRange(); r.selectNodeContents(n); const rs=[...r.getClientRects()].filter(x=>x.width>1&&x.height>1); if(!rs.length) continue;
    const box={l:Math.min(...rs.map(x=>x.left)),r:Math.max(...rs.map(x=>x.right)),t:Math.min(...rs.map(x=>x.top)),b:Math.max(...rs.map(x=>x.bottom))};
    if(box.b<0||box.t>innerHeight*3) continue;
    let grund='';
    const cs=getComputedStyle(el);
    if(cs.textOverflow==='ellipsis'&&el.scrollWidth>el.clientWidth+1) grund='Ellipse';
    if(!grund&&cs.webkitLineClamp&&cs.webkitLineClamp!=='none'&&el.scrollHeight>el.clientHeight+2) grund='Zeilen gekürzt';
    if(!grund) for(let a=el;a&&a!==document.body;a=a.parentElement){ const c=getComputedStyle(a);
      if(/(hidden|clip)/.test(c.overflowX+c.overflowY)){ const ar=a.getBoundingClientRect();
        const ganzDraussen=box.b<=ar.top||box.t>=ar.bottom||box.r<=ar.left||box.l>=ar.right; if(ganzDraussen) break; const tol=a===el?8:3; if(box.l<ar.left-tol||box.r>ar.right+tol||box.t<ar.top-tol||box.b>ar.bottom+tol){ grund='abgeschnitten durch '+(a.id?'#'+a.id:'.'+String(a.className).split(' ')[0]); break; } } }
    if(!grund&&(box.r>vw+1||box.l<-1)) grund='über Bildschirmrand';
    if(grund){ gesehen.add(el); out.push({t:t.slice(0,40),grund,el:(el.tagName.toLowerCase()+'.'+String(el.className).split(' ')[0]).slice(0,30)}); }
  }
  return out;
})()`;
(async () => {
  const seiten = seitenArg ? JSON.parse(seitenArg) : STANDARD;
  const proxy = { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' };
  const b = await chromium.launch({ proxy });
  const ctx = await b.newContext({ ...(process.env.PC ? {} : +w >= 700 ? devices['iPad Pro 11'] : devices['iPhone 14 Pro']), viewport: { width: +w, height: +h }, locale: 'de-CH' });
  await ctx.addInitScript(() => { const T = new Date('2026-11-04T08:00:00+01:00').getTime(), st = Date.now(), D = Date;
    class FD extends D { constructor(...a){ if(a.length) super(...a); else super(T + (D.now() - st)); } static now(){ return T + (D.now() - st); } } window.Date = FD; });
  await ctx.route('https://easyplay.ch/**', r => r.request().url().includes('/auth/v1/settings') ? r.fulfill({ json: { external: { email: true, google: true, apple: true, azure: true }, disable_signup: false } }) : r.fulfill({ status: 200, json: [] }));
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'load', timeout: 60000 }); await p.waitForTimeout(4000);
  let fehler = 0;
  for (const [name, js] of seiten) {
    await p.evaluate(js + ';1').catch(() => {});
    await p.waitForTimeout(1500);
    // Karussell: alle Folien prüfen
    const folien = await p.evaluate(() => document.querySelectorAll('#app .ap-karu .ap-held').length).catch(() => 0);
    const runden = Math.max(1, folien);
    const alle = [];
    for (let i = 0; i < runden; i++) {
      if (folien) { await p.evaluate(i => { const f = document.querySelectorAll('#app .ap-karu .ap-held')[i]; if (f) f.scrollIntoView({ inline: 'center', block: 'nearest' }); }, i); await p.waitForTimeout(400); }
      const r = await p.evaluate(PRUEF).catch(e => [{ t: 'FEHLER', grund: e.message.slice(0, 60), el: '' }]);
      r.forEach(x => { if (!alle.some(y => y.t === x.t && y.grund === x.grund)) alle.push(x); });
      if (alle.length && ordner && i === 0) await p.screenshot({ path: `${ordner}/clip-${w}x${h}-${name}.png` });
    }
    // Folien des Karussells werden nebeneinander gescrollt: Texte ausserhalb des sichtbaren Fensters nicht melden
    const echt = alle.filter(x => !(folien && /ap-karu|über Bildschirmrand/.test(x.grund)));
    fehler += echt.length;
    console.log((echt.length ? 'CLIP ' : 'ok   ') + name.padEnd(12), echt.map(x => `«${x.t}» ${x.grund} [${x.el}]`).join(' | '));
  }
  console.log('Total abgeschnittene Texte:', fehler);
  await b.close();
})();
