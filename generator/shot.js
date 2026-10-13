const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();
for(const v of (process.argv[2]||'a,b,c').split(','))for(const [n,w,h,t] of [['computer',1440,900,false],['ipad',820,1180,true],['handy',390,844,true]]){
 const c=await b.newContext({viewport:{width:w,height:h},hasTouch:t,deviceScaleFactor:n==='handy'?2:1});
 const p=await c.newPage(); await p.route(/wikipedia|wikimedia|googleapis|gstatic|supabase/,r=>r.abort());
 const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.clock.setFixedTime(new Date('2026-10-13T11:00:00+02:00')); await p.goto(`http://localhost:8765/vorschlag-${v}.html`); await p.waitForTimeout(4500);
 const H=await p.evaluate(()=>document.body.scrollHeight);
 await p.screenshot({path:`/tmp/claude-0/-home-claude-easyplay/b2721deb-4b21-59b0-bfb5-be1f6a83943a/scratchpad/shots/vorschlag-${v}-${n}.png`,fullPage:true,clip:{x:0,y:0,width:w,height:Math.min(H,Math.round(h*1.6))}});
 if(errs.length)console.log(v,n,errs);await c.close();}
await b.close();})();
