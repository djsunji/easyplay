/* easyplay · handy.js
   Handy-Design «aufgeräumt im heutigen Stil»: Tagesziel in der Hero-Karte, Bereich-Blatt statt Seitenwechsel,
   Profil mit vier Reitern, farbiges Quiz mit Antwort-Blatt. Greift nur in der App-Ansicht (body.ep-app). */
(function(){
"use strict";
const app = () => document.body.classList.contains("ep-app");
const $ = (s, w) => (w || document).querySelector(s);
const $$ = (s, w) => [...(w || document).querySelectorAll(s)];
const h = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const KIDS = "img/kids/";
const PLAY = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M7 4l13 8-13 8z"/></svg>';

/* ---------- Stil ---------- */
const css = document.createElement("style"); css.id = "ep-handy-css";
css.textContent = `
/* Start: Tagesziel in der Hero-Karte */
body.ep-app .ap-heute .hd-tag{display:flex;flex-direction:column;gap:6px;margin:2px 0 4px}
@media (max-width:375px){body.ep-app .ap-heute .hs-start .epname{display:none}body.ep-app .ap-heute .hd-tag b{font-size:13px!important}}
body.ep-app .ap-heute .hd-tag b{font:600 14px "Lexend",system-ui,sans-serif;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.25)}
body.ep-app .ap-heute .hd-bars{display:flex;gap:5px;width:150px;max-width:100%}
body.ep-app .ap-heute .hd-bars s{flex:1;height:9px;border-radius:5px;background:rgba(255,255,255,.35);text-decoration:none}
body.ep-app .ap-heute .hd-bars s.an{background:#FFD85E;box-shadow:0 0 8px rgba(255,216,94,.8)}
body.ep-app .ap-heute .hs-start .apzahlen{display:none}
body.ep-app .ap-heute .ap-kopf .aplbl{display:none}
body.ep-app .ap-heute .ap-kopf{justify-content:flex-start}
/* Themen: Bibliothek immer sichtbar */
body.ep-app .ap-themen .ap-unten{display:grid;grid-template-columns:1fr 1fr;gap:10px}
body.ep-app .ap-themen .ap-unten .apzeile{min-height:64px}
body.ep-app .ap-themen .ap-unten .apzeile small{display:none}
body.ep-app .ap-themen .ap-unten .apzeile b{font-size:16px}
/* Bereich-Blatt */
.hd-sheet{position:fixed;inset:0;z-index:95;display:flex;align-items:flex-end;background:rgba(8,5,30,.72);-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);animation:hdEin .18s ease}
.hd-sheet .hd-blatt{position:relative;width:100%;max-height:82vh;max-height:82dvh;box-sizing:border-box;padding:10px 16px calc(22px + env(safe-area-inset-bottom));border-radius:34px 34px 0 0;background:linear-gradient(170deg,var(--c2,#25C9AB) 0%,var(--c,#109C86) 45%,var(--c3,#0A7766) 100%);color:#fff;box-shadow:0 -10px 40px rgba(0,0,0,.5),inset 0 2px 0 rgba(255,255,255,.3);display:flex;flex-direction:column;gap:12px;animation:hdHoch .26s cubic-bezier(.2,.9,.3,1.1);overflow:hidden}
.hd-sheet .hd-griff{align-self:center;width:44px;height:5px;border-radius:3px;background:rgba(255,255,255,.5);flex:none}
.hd-sheet .hd-kopf{display:flex;align-items:center;gap:12px;flex:none}
.hd-sheet .hd-kopf .hd-ico{width:58px;height:58px;border-radius:18px;background:#fff;display:grid;place-items:center;font-size:32px;box-shadow:0 6px 12px -4px rgba(0,0,0,.35);flex:none}
.hd-sheet .hd-kopf .hd-ico svg,.hd-sheet .hd-kopf .hd-ico img{width:36px;height:36px}
.hd-sheet .hd-kopf h2{margin:0;font:800 24px/1.05 "Bricolage Grotesque","Fredoka",system-ui,sans-serif;text-shadow:0 1px 2px rgba(0,0,0,.3)}
.hd-sheet .hd-kopf p{margin:2px 0 0;font:500 13px "Lexend",system-ui,sans-serif;text-shadow:0 1px 2px rgba(0,0,0,.3)}
.hd-sheet .hd-zu{margin-left:auto;width:44px;height:44px;border-radius:22px;border:0;background:rgba(0,0,0,.2);color:#fff;font-size:20px;cursor:pointer;flex:none}
.hd-sheet .hd-themen{display:grid;grid-template-columns:1fr 1fr;gap:10px;overflow:auto;min-height:0;padding:2px;margin:-2px;-webkit-overflow-scrolling:touch}
.hd-sheet .hd-thema{position:relative;min-height:86px;border:1px solid rgba(255,255,255,.22);border-radius:22px;background:rgba(255,255,255,.16);box-shadow:inset 0 -4px 0 rgba(0,0,0,.12);color:#fff;text-align:left;padding:12px;display:flex;flex-direction:column;justify-content:space-between;gap:6px;cursor:pointer;font-family:"Lexend",system-ui,sans-serif}
.hd-sheet .hd-thema .hd-ti{font-size:28px;line-height:1}
.hd-sheet .hd-thema .hd-ti svg,.hd-sheet .hd-thema .hd-ti img{width:30px;height:30px}
.hd-sheet .hd-thema b{font:700 16px/1.15 "Lexend",system-ui,sans-serif;text-shadow:0 1px 2px rgba(0,0,0,.3)}
.hd-sheet .hd-thema small{position:absolute;right:12px;top:12px;font:700 11px "Lexend",system-ui,sans-serif;padding:3px 8px;border-radius:9px;background:rgba(0,0,0,.22)}
.hd-sheet .hd-thema.leer{opacity:.5}
.hd-sheet .hd-alle{flex:none;display:flex;align-items:center;justify-content:center;gap:8px;height:56px;border:0;border-radius:28px;background:linear-gradient(180deg,#FFD85E,#FFB21E);color:#2A1D5C;font:700 17px "Lexend",system-ui,sans-serif;box-shadow:0 5px 0 #D2860A,0 12px 20px -8px rgba(255,178,30,.7);cursor:pointer}
@keyframes hdEin{from{opacity:0}to{opacity:1}}
@keyframes hdHoch{from{transform:translateY(60px);opacity:.6}to{transform:none;opacity:1}}
@media (prefers-reduced-motion:reduce){.hd-sheet,.hd-sheet .hd-blatt{animation:none}}
/* Profil: Reiter */
body.ep-app .ap-profil .hd-ptabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;padding:4px;border-radius:19px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.1)}
body.ep-app .ap-profil .hd-ptabs button{height:44px;border:0;border-radius:15px;background:transparent;color:#D7D2FF;font:500 13px "Lexend",system-ui,sans-serif;cursor:pointer;padding:0 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
body.ep-app .ap-profil .hd-ptabs button[aria-selected="true"]{background:linear-gradient(140deg,#FF5C9E,#D92472);color:#fff;font-weight:700;box-shadow:0 6px 14px -4px rgba(226,48,122,.7)}
body.ep-app .ap-profil .hd-garde{position:relative;overflow:hidden;min-height:92px;border:0;border-radius:26px;padding:0 16px;text-align:left;color:#fff;background:linear-gradient(140deg,#FF5C9E 0%,#E2307A 50%,#B5175A 100%);box-shadow:0 14px 26px -12px rgba(0,0,0,.6),inset 0 -5px 0 rgba(0,0,0,.18),inset 0 2px 0 rgba(255,255,255,.28);display:flex;align-items:center;gap:12px;cursor:pointer}
body.ep-app .ap-profil .hd-garde b{font:800 21px "Bricolage Grotesque","Fredoka",system-ui,sans-serif;text-shadow:0 1px 2px rgba(0,0,0,.3)}
body.ep-app .ap-profil .hd-garde small{display:block;font:500 13px "Lexend",system-ui,sans-serif;text-shadow:0 1px 2px rgba(0,0,0,.3)}
body.ep-app .ap-profil .hd-garde img{position:absolute;right:-10px;bottom:-4px;height:100px;width:auto}
body.ep-app .ap-profil .hd-garde .hd-gt{position:relative;flex:1;padding-right:90px}
body.ep-app .ap-profil .hd-erfolge{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
body.ep-app .ap-profil .hd-abz{min-height:96px;border-radius:22px;padding:12px 8px;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;text-align:center;color:#fff;background:linear-gradient(140deg,#FF9B3D,#C3540A);box-shadow:0 10px 20px -10px rgba(0,0,0,.6),inset 0 -4px 0 rgba(0,0,0,.18)}
body.ep-app .ap-profil .hd-abz.aus{background:rgba(255,255,255,.07);border:2px dashed rgba(255,255,255,.3);box-shadow:none;color:#C9C3FF}
body.ep-app .ap-profil .hd-abz i{font-style:normal;font-size:30px;line-height:1}
body.ep-app .ap-profil .hd-abz.aus i{filter:grayscale(1);opacity:.45}
body.ep-app .ap-profil .hd-abz b{font:700 12px/1.15 "Lexend",system-ui,sans-serif}
body.ep-app .ap-profil .hd-leer{padding:14px 16px;border-radius:22px;background:rgba(255,255,255,.08);color:#D7D2FF;font:500 14px/1.45 "Lexend",system-ui,sans-serif}
body.ep-app .ap-profil [data-hdp][hidden]{display:none!important}
/* Quiz: farbige Antworten, dicker Balken, Hilfe-Knöpfe */
body.ep-app .qtop .bar{height:10px;border-radius:5px;background:rgba(255,255,255,.18)}
body.ep-app .qtop .bar i{border-radius:5px;background:linear-gradient(90deg,#4FCB62,#FFD85E);box-shadow:0 0 8px rgba(255,216,94,.7)}
body.ep-app .qtop .count{font:700 15px "Lexend",system-ui,sans-serif}
body.ep-app.ep-s-quiz .answers .ans{padding:10px 48px 10px 54px!important;border-radius:22px!important;min-height:60px!important}
body.ep-app .answers .ans{border:0;border-radius:22px;min-height:60px;color:#fff;font:600 16px "Lexend",system-ui,sans-serif;box-shadow:0 6px 0 rgba(0,0,0,.22),0 12px 20px -10px rgba(0,0,0,.6),inset 0 2px 0 rgba(255,255,255,.3);transition:transform .12s ease,opacity .2s ease}
body.ep-app .answers .ans:nth-child(1){background:linear-gradient(140deg,#5A8BFF,#1D45BF)}
body.ep-app .answers .ans:nth-child(2){background:linear-gradient(140deg,#4FCB62,#1D7F33)}
body.ep-app .answers .ans:nth-child(3){background:linear-gradient(140deg,#FF9B3D,#C3540A)}
body.ep-app .answers .ans:nth-child(4){background:linear-gradient(140deg,#FF5C9E,#B5175A)}
body.ep-app .answers .ans .key{width:34px;height:34px;border-radius:17px;background:#fff;color:#2A1D5C;font:800 15px "Lexend",system-ui,sans-serif;display:inline-grid;place-items:center;flex:none;box-shadow:none}
body.ep-app .answers .ans:active{transform:translateY(3px);box-shadow:0 3px 0 rgba(0,0,0,.22)}
body.ep-app .answers .ans.right{background:linear-gradient(140deg,#4FCB62,#1D7F33)!important;outline:3px solid #fff;box-shadow:0 0 22px rgba(79,203,98,.75),inset 0 -4px 0 rgba(0,0,0,.18)}
body.ep-app .answers .ans.right .key{background:#fff;color:#1D7F33}
body.ep-app .answers .ans.wrong{background:linear-gradient(140deg,#FF6B6B,#B51B1B)!important;outline:3px solid rgba(255,255,255,.7)}
body.ep-app .answers.hd-fertig .ans:not(.right):not(.wrong){background:#E9E6F5!important;color:#8B86A8!important;box-shadow:none;opacity:.9}
body.ep-app .answers.hd-fertig .ans:not(.right):not(.wrong) .key{background:#fff;color:#8B86A8}
:root[data-theme="dark"] body.ep-app .answers.hd-fertig .ans:not(.right):not(.wrong){background:rgba(255,255,255,.1)!important;color:rgba(255,255,255,.5)!important}
:root[data-theme="dark"] body.ep-app .answers.hd-fertig .ans:not(.right):not(.wrong) .key{background:rgba(255,255,255,.15);color:rgba(255,255,255,.6)}
body.ep-app .hlf-joker{display:grid;grid-template-columns:1fr 1fr;gap:10px}
body.ep-app .hlf-joker .hlf-j{min-height:48px;border:0;border-radius:16px;color:#fff;font:600 14px "Lexend",system-ui,sans-serif;box-shadow:0 4px 0 rgba(0,0,0,.25),inset 0 2px 0 rgba(255,255,255,.25)}
body.ep-app .hlf-joker .hlf-j:nth-child(1){background:linear-gradient(140deg,#9070FF,#4A2FC0)}
body.ep-app .hlf-joker .hlf-j:nth-child(2){background:linear-gradient(180deg,#FFD85E,#FFB21E);color:#2A1D5C}
body.ep-app .hlf-joker .hlf-j .hlf-n{background:rgba(0,0,0,.22);color:#fff;border-radius:9px;padding:1px 7px}
/* Antwort-Blatt */
body.ep-app .feedback.pop{position:relative;overflow:hidden;margin:12px -4px 0;padding:18px 16px 16px;border-radius:28px;color:#fff;box-shadow:0 14px 30px -12px rgba(0,0,0,.6),inset 0 2px 0 rgba(255,255,255,.35)}
body.ep-app .feedback.pop.hd-ok{background:linear-gradient(170deg,#4FCB62 0%,#2CA343 45%,#1D7F33 100%)}
body.ep-app .feedback.pop.hd-nein{background:linear-gradient(170deg,#FF7A7A 0%,#E0393E 45%,#A71B20 100%)}
body.ep-app .feedback.pop>p{margin:0 0 14px;min-height:60px;font:800 24px "Bricolage Grotesque","Fredoka",system-ui,sans-serif;text-shadow:0 1px 2px rgba(0,0,0,.3);display:flex;align-items:center;gap:8px;padding-right:96px}
body.ep-app .feedback.pop .hd-kid{position:absolute;right:2px;top:2px;height:76px;width:auto;pointer-events:none}
body.ep-app .feedback.pop .row{display:grid;grid-template-columns:1fr 1fr;gap:10px;position:relative}
body.ep-app .feedback.pop .row .big{min-height:52px;border-radius:26px;font:700 16px "Lexend",system-ui,sans-serif;box-shadow:none}
body.ep-app .feedback.pop .row .big.alt{background:rgba(0,0,0,.2);color:#fff;border:2px solid rgba(255,255,255,.6)}
body.ep-app .feedback.pop .row .big:not(.alt){background:linear-gradient(180deg,#FFD85E,#FFB21E);color:#2A1D5C;box-shadow:0 5px 0 #D2860A}
body.ep-app .feedback.pop .row .big:only-child{grid-column:1/-1}

/* ===== Dunkler Grundton: Nachthimmel immer in der Handy-Ansicht ===== */
body.ep-app.hd-dunkel .ap-heute .ap-gruss > b,body.ep-app.hd-dunkel .ap-heute .ap-gruss > span{padding-right:0!important}
/* Kopfzeile: Logo links, Pillen rechts (Ton und Fahne bleiben Geschwister, nur fest platziert) */
body.ep-app .ap-heute{position:relative}
body.ep-app .ap-heute .ap-gruss.hd-schlicht{display:grid!important;grid-template-columns:1fr;gap:2px;padding:0 0 0!important;margin:0!important;min-height:0!important}
body.ep-app .ap-heute .ap-gruss.hd-schlicht > .ap-logo{position:static!important;order:-1;height:34px!important;width:auto!important;margin:3px 0 6px!important;transform:none!important;justify-self:start}
body.ep-app .ap-heute .ap-gruss.hd-schlicht > b{display:block;font:800 26px/1.1 "Bricolage Grotesque","Fredoka",system-ui,sans-serif;padding:0!important}
body.ep-app .ap-heute .ap-gruss.hd-schlicht > span{display:block;font-size:14px;opacity:.9;padding:0!important}
body.ep-app .ap-heute > .xs-knopf,body.ep-app .ap-heute > .xui-knopf{position:absolute!important;left:auto!important;top:12px!important;visibility:visible!important;width:36px!important;height:36px!important;transform:none!important;z-index:5}
body.ep-app .ap-heute > .xs-knopf{right:0!important}
body.ep-app .ap-heute > .xui-knopf{right:44px!important}
body.ep-app .ap-heute .hd-pillen{position:absolute;right:88px;top:12px;display:flex;align-items:center;gap:6px;z-index:5}
body.ep-app .ap-heute .hd-pillen > *{position:static!important;margin:0!important;transform:none!important}
body.ep-app .ap-heute .hd-pillen > span.glas{display:inline-flex;align-items:center;gap:5px;height:34px;padding:0 11px;border-radius:17px;font:700 14px "Lexend",system-ui,sans-serif;color:#fff;background:rgba(27,34,64,.55);border:1px solid rgba(255,255,255,.18);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
body.ep-app .ap-heute .hd-pillen > span.glas svg{width:16px;height:16px}
body.ep-app .ap-heute .hd-pillen .xt-pw{display:inline-flex}
body.ep-app .ap-heute .hd-pillen .xt-pw .xt-p-t{display:none}
body.ep-app .ap-heute .ap-kopf.hd-weg{display:none!important}
body.ep-app .ap-heute .hd-schlicht ~ .ap-karu{margin-top:44px!important;min-height:196px!important}
@media (max-height:780px){body.ep-app .ap-heute .ap-gruss.hd-schlicht > .ap-logo{margin-bottom:2px!important;height:30px!important}body.ep-app .ap-heute .hd-schlicht ~ .ap-karu{margin-top:40px!important;min-height:176px!important}body.ep-app .ap-heute .ap-woche small,body.ep-app .ap-heute .x-app small{display:none!important}body.ep-app .ap-heute .hs-start .epname{display:none}}
/* Tableiste: «Start» statt «Hauptmenü», aktiver Reiter pink */
body.ep-app #epTabs button[aria-current="page"]{background:linear-gradient(140deg,#FF5C9E,#D92472)!important;color:#fff!important;box-shadow:0 8px 18px -8px rgba(226,48,122,.8)}
/* Themen: Suchknopf im Titel */
body.ep-app .ap-themen .ap-titel{display:flex;align-items:center;justify-content:space-between}
body.ep-app .ap-themen .ap-titel .hd-such{width:40px;height:40px;border-radius:20px;border:1px solid rgba(255,255,255,.18);background:rgba(27,34,64,.55);color:#fff;display:grid;place-items:center;cursor:pointer;flex:none}
body.ep-app .ap-themen .ap-titel .hd-such svg{width:20px;height:20px}
body.ep-app .ap-themen .ap-info{display:none!important}
/* Quiz: keine weisse Karte, Frage weiss auf dunklem Grund, Kinder rechts */
:root[data-theme="dark"] body.ep-app.ep-s-quiz .card{background:transparent!important;box-shadow:none!important;border:0!important;padding:0!important;color:#fff!important}
:root[data-theme="dark"] body.ep-app.ep-s-quiz .card .tabs{display:flex;gap:6px;margin:0 0 10px}
:root[data-theme="dark"] body.ep-app.ep-s-quiz .card .tabs button,:root[data-theme="dark"] body.ep-app.ep-s-quiz .card .tabs .seg{background:rgba(255,255,255,.12)!important;color:#fff!important;border:1px solid rgba(255,255,255,.14)!important;box-shadow:none!important}
:root[data-theme="dark"] body.ep-app.ep-s-quiz .card .tabs button[aria-selected="true"],:root[data-theme="dark"] body.ep-app.ep-s-quiz .card .tabs .seg.on,:root[data-theme="dark"] body.ep-app.ep-s-quiz .card .tabs .seg[aria-pressed="true"]{background:linear-gradient(140deg,#4FCB62,#1D7F33)!important;border-color:transparent!important}
:root[data-theme="dark"] body.ep-app.ep-s-quiz .card .hlf-vlrow{background:rgba(255,255,255,.1)!important;border:1px solid rgba(255,255,255,.14)!important;color:#fff!important;box-shadow:none!important}
:root[data-theme="dark"] body.ep-app.ep-s-quiz .card .hlf-hinweis,:root[data-theme="dark"] body.ep-app.ep-s-quiz .card .vlhinweis{background:rgba(255,255,255,.1)!important;color:#fff!important}
body.ep-app.ep-s-quiz .card h2.question{text-align:left!important;margin:0!important;font-weight:800!important}
body.ep-app.ep-s-quiz .card .qbox{position:relative;padding-right:104px;min-height:104px;display:flex;align-items:center}
:root[data-theme="dark"] body.ep-app.ep-s-quiz .card h2.question{color:#fff!important;text-align:left!important;font:800 clamp(1.15rem,5.2vw,1.45rem)/1.25 "Bricolage Grotesque","Fredoka",system-ui,sans-serif!important;text-shadow:0 1px 3px rgba(0,0,0,.4);margin:0!important}
body.ep-app.ep-s-quiz .card .hd-qkid{position:absolute;right:-4px;bottom:-6px;height:110px;width:auto;pointer-events:none;filter:drop-shadow(0 8px 14px rgba(0,0,0,.45))}
@media (max-height:780px){body.ep-app.ep-s-quiz .card .qbox{min-height:120px!important;padding-right:110px!important}body.ep-app.ep-s-quiz .card .hd-qkid{height:150px!important;right:-12px!important}body.ep-app .feedback.pop .hd-erkl{-webkit-line-clamp:3}body.ep-app .feedback.pop{margin-top:50px!important}body.ep-app .feedback.pop .hd-kid{height:100px!important;top:-70px!important}}
body.ep-app.ep-s-quiz .card .answers{margin-top:14px}
:root[data-theme="dark"] body.ep-app.ep-s-quiz .card .explain,:root[data-theme="dark"] body.ep-app.ep-s-quiz .card .erklaerung{background:rgba(255,255,255,.1);color:#fff;border-radius:18px;padding:12px 14px}
body.ep-app.ep-s-quiz .hlf-joker .hlf-j{border:0!important;box-shadow:0 5px 0 rgba(0,0,0,.25)!important}
/* Profil: dunkle Karten */
body.ep-app .ap-profil .hd-ptabs{background:rgba(255,255,255,.1)}

/* ===== Genau wie der Entwurf: pinke Hero-Karte, ein Held, Glas-Pillen, Musiknote ===== */
body.ep-app .ap-heute .ap-karu-spur > .apf.f-held.hs-start{background:linear-gradient(140deg,#FF5C9E 0%,#E2307A 50%,#B5175A 100%)!important}
body.ep-app .ap-heute .hd-schlicht ~ .ap-karu .ap-karu-spur > .apf:not(.hs-start){display:none!important}
body.ep-app .ap-heute .hd-schlicht ~ .ap-karu .ap-karu-punkte{display:none!important}
body.ep-app .ap-heute .hs-start .ap-weissbtn{color:#D92472!important;background:#fff!important}
body.ep-app .ap-heute .hs-start .epname{display:none!important}
body.ep-app .ap-heute .hs-start .hd-tag b{color:#FFF0F6}
body.ep-app .ap-heute .hd-bars s.an{box-shadow:0 0 8px rgba(255,216,94,.8)}
body.ep-app .ap-heute .ap-gruss.hd-schlicht > b{font-size:32px!important;line-height:1.05!important}
body.ep-app .ap-heute .ap-gruss.hd-schlicht > span{font-size:15px!important;color:#D7D2FF!important;opacity:1}
:root[data-theme="light"] body.ep-app .ap-heute .ap-gruss.hd-schlicht > span{color:#fff!important;opacity:.9}
body.ep-app .ap-heute .hd-pillen > span.glas,body.ep-app .ap-heute > .xs-knopf,body.ep-app .ap-heute > .xui-knopf{background:rgba(255,255,255,.14)!important;border:1px solid rgba(255,255,255,.18)!important;box-shadow:none!important;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
:root[data-theme="light"] body.ep-app .ap-heute .hd-pillen > span.glas,:root[data-theme="light"] body.ep-app .ap-heute > .xs-knopf,:root[data-theme="light"] body.ep-app .ap-heute > .xui-knopf{background:rgba(27,34,64,.5)!important}
body.ep-app .ap-heute .hd-pillen > span.glas{height:36px;font-weight:700}
body.ep-app .ap-heute .hd-pillen .xt-pw{display:none!important}
body.ep-app .ap-heute > .xs-knopf > svg{display:none!important}
body.ep-app .ap-heute > .xs-knopf::before{content:"";width:20px;height:20px;background:currentColor;-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M9 18V5l11-2v13'/%3E%3Ccircle cx='6' cy='18' r='3' fill='%23000'/%3E%3Ccircle cx='17' cy='16' r='3' fill='%23000'/%3E%3C/svg%3E") center/contain no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M9 18V5l11-2v13'/%3E%3Ccircle cx='6' cy='18' r='3' fill='%23000'/%3E%3Ccircle cx='17' cy='16' r='3' fill='%23000'/%3E%3C/svg%3E") center/contain no-repeat}
body.ep-app .ap-heute > .xs-knopf.aus::before{opacity:.55}

/* ===== Themen wie im Entwurf ===== */
body.ep-app .ap-themen .ap-titel h2{font-size:32px!important}
body.ep-app .ap-themen .ap-stufen{border-radius:20px;background:rgba(255,255,255,.1)!important;border:1px solid rgba(255,255,255,.1)!important}
body.ep-app .ap-themen .ap-stufen button[aria-pressed="true"]{background:linear-gradient(140deg,#9070FF,#5B3FD9)!important;box-shadow:0 6px 14px -4px rgba(91,63,217,.8)!important}
body.ep-app .ap-themen .ap-ber{gap:12px!important;min-height:0!important;flex:none!important}
body.ep-app .ap-themen .ap-ber .apb{border-radius:26px!important;background-image:none!important;box-shadow:0 14px 30px -14px rgba(0,0,0,.6)!important}
body.ep-app .ap-themen .ap-ber .apb[style*="--welt"]{background:linear-gradient(140deg,#5A8BFF 0%,#2F63EC 50%,#1D45BF 100%)!important}
body.ep-app .ap-themen .ap-ber .apb[style*="--natur"]{background:linear-gradient(140deg,#25C9AB 0%,#109C86 50%,#0A7766 100%)!important}
body.ep-app .ap-themen .ap-ber .apb[style*="--schweiz"],body.ep-app .ap-themen .ap-ber .apb[style*="--leben"]{background:linear-gradient(140deg,#FF5C9E 0%,#E2307A 50%,#B5175A 100%)!important}
body.ep-app .ap-themen .ap-ber .apb[style*="--alltag"]{background:linear-gradient(140deg,#FF9B3D 0%,#EF7418 50%,#C3540A 100%)!important}
body.ep-app .ap-themen .ap-ber .apb::after{content:"";position:absolute;width:130px;height:130px;border-radius:50%;right:-40px;bottom:-50px;background:rgba(255,255,255,.12);pointer-events:none}
body.ep-app .ap-themen .ap-ber .apwm{display:none!important}
body.ep-app .ap-themen .ap-ber .apb-kopf{min-height:172px!important;height:172px;padding:14px!important;grid-template-rows:auto 1fr auto!important;align-content:space-between}
body.ep-app .ap-themen .ap-ber .apem{width:48px!important;height:48px!important;border-radius:14px!important;font-size:30px!important;background:#fff!important}
body.ep-app .ap-themen .ap-ber .apem svg,body.ep-app .ap-themen .ap-ber .apem img{width:30px!important;height:30px!important}
body.ep-app .ap-themen .ap-ber .apn{font:600 12px "Lexend",system-ui,sans-serif!important;background:rgba(255,255,255,.18)!important;padding:4px 9px!important;border-radius:11px!important}
body.ep-app .ap-themen .ap-ber .apn i{display:none}
body.ep-app .ap-themen .ap-ber .apb-kopf b{grid-row:3!important;font:800 21px/1.05 "Bricolage Grotesque","Fredoka",system-ui,sans-serif!important;text-shadow:0 1px 3px rgba(0,0,0,.3)}
body.ep-app .ap-themen .ap-ber .apb-kopf small{display:none!important}
body.ep-app .ap-themen .ap-unten{display:flex!important;flex-direction:column;gap:12px}
body.ep-app .ap-themen .ap-unten .apzeile[data-x="mix"]{min-height:72px!important;border-radius:26px!important;background:linear-gradient(140deg,#9070FF 0%,#6446E6 50%,#4A2FC0 100%)!important;padding:0 14px!important}
body.ep-app .ap-themen .ap-unten .apzeile[data-x="mix"] .apico{width:46px;height:46px;border-radius:15px;background:rgba(255,255,255,.22)}
body.ep-app .ap-themen .ap-unten .apzeile[data-x="mix"] .aptx b{font:600 17px "Lexend",system-ui,sans-serif}
body.ep-app .ap-themen .ap-unten .apzeile[data-x="mix"] .aptx small{color:#EEEAFF;font-size:13px}
body.ep-app .ap-themen .ap-unten .apzeile[data-x="lib"]{display:none!important}
body.ep-app .ap-themen .hd-weiter{display:flex;align-items:center;gap:8px}
body.ep-app .ap-themen .hd-weiter > span{font:600 12px "Lexend",system-ui,sans-serif;letter-spacing:.06em;color:#C9C3FF;white-space:nowrap}
body.ep-app .ap-themen .hd-weiter button{flex:1;display:flex;align-items:center;gap:8px;height:46px;padding:0 12px;border-radius:16px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.12);color:#fff;font:500 14px "Lexend",system-ui,sans-serif;cursor:pointer;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
body.ep-app .ap-themen .hd-weiter button .ic,body.ep-app .ap-themen .hd-weiter button svg,body.ep-app .ap-themen .hd-weiter button img{width:20px;height:20px;flex:none}
:root[data-theme="light"] body.ep-app .ap-themen .hd-weiter > span{color:#fff}
:root[data-theme="light"] body.ep-app .ap-themen .hd-weiter button{background:rgba(27,34,64,.45)}
/* Bereich-Blatt: Kinder schauen oben rein */
body.ep-app .hd-sheet .hd-schau{position:absolute;right:8px;top:92px;height:150px;width:auto;pointer-events:none;filter:drop-shadow(0 10px 16px rgba(0,0,0,.5))}
/* ===== Duell wie im Entwurf ===== */
body.ep-app .ap-duell .ap-titel{justify-content:center!important;position:relative}
body.ep-app .ap-duell .ap-titel h2{display:flex;align-items:center;gap:8px;font-size:30px!important}
body.ep-app .ap-duell .ap-titel h2::before{content:"";width:38px;height:38px;border-radius:13px;background:linear-gradient(180deg,#FFD85E,#FFB21E) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%232A1D5C'%3E%3Cpath d='M13 2L4 14h7l-1 8 9-12h-7z'/%3E%3C/svg%3E") center/22px no-repeat;box-shadow:0 4px 0 #D2860A}
body.ep-app .ap-duell .ap-bereit{background:linear-gradient(140deg,#FF5C9E 0%,#E2307A 50%,#B5175A 100%)!important;border-radius:26px!important}
body.ep-app .ap-duell .ap-bereit .apteam button{border-radius:21px!important;height:42px}
body.ep-app .ap-duell .ap-bereit .apteam button[aria-pressed="true"]{color:#D92472!important;box-shadow:0 4px 0 rgba(0,0,0,.2)}
/* ===== Profil wie im Entwurf ===== */
body.ep-app .ap-profil .ap-konto.hd-konto{min-height:136px!important;padding:16px!important;flex-direction:row!important;align-items:center;gap:14px;background:linear-gradient(140deg,#9070FF 0%,#6446E6 50%,#4A2FC0 100%)!important;border-radius:26px!important}
body.ep-app .ap-profil .ap-konto.hd-konto > img{display:none!important}
body.ep-app .ap-profil .hd-avr{position:relative;width:96px;height:96px;flex:none}
body.ep-app .ap-profil .hd-avr .hd-ring{width:96px;height:96px;border-radius:48px;background:linear-gradient(180deg,#FFD85E,#FFB21E);padding:4px;box-sizing:border-box;box-shadow:0 6px 14px -4px rgba(0,0,0,.45)}
body.ep-app .ap-profil .hd-avr .hd-ring > span{display:block;width:88px;height:88px;border-radius:44px;overflow:hidden;background:#FF8FC0}
body.ep-app .ap-profil .hd-avr .hd-ring > span > *{width:88px!important;height:88px!important;object-fit:cover;border-radius:0!important}
body.ep-app .ap-profil .hd-avr .hd-ring > span img{height:126px!important;object-position:30% 0}
body.ep-app .ap-profil .hd-avr .hd-lvl{position:absolute;right:-4px;bottom:-2px;width:32px;height:32px;border-radius:16px;background:#D92472;border:3px solid #fff;display:grid;place-items:center;font:800 15px "Bricolage Grotesque","Fredoka",system-ui,sans-serif;color:#fff;box-sizing:content-box}
body.ep-app .ap-profil .hd-kn{position:relative;flex:1;display:flex;flex-direction:column;gap:5px;min-width:0;color:#fff}
body.ep-app .ap-profil .hd-kn b{font:800 26px/1 "Bricolage Grotesque","Fredoka",system-ui,sans-serif;text-shadow:0 1px 3px rgba(0,0,0,.3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
body.ep-app .ap-profil .hd-kn span{font:400 14px "Lexend",system-ui,sans-serif}
body.ep-app .ap-profil .hd-kn small{font:400 12px "Lexend",system-ui,sans-serif}
body.ep-app .ap-profil .hd-kn .hd-xp{height:10px;border-radius:5px;background:rgba(0,0,0,.25);overflow:hidden}
body.ep-app .ap-profil .hd-kn .hd-xp i{display:block;height:100%;border-radius:5px;background:#FFD85E;box-shadow:0 0 8px rgba(255,216,94,.7)}
body.ep-app .ap-profil .ap-stats{gap:10px!important}
body.ep-app .ap-profil .ap-stats > div{border-radius:22px!important;padding:12px!important;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;text-align:center}
body.ep-app .ap-profil .ap-stats > div small{display:none}
body.ep-app .ap-profil .ap-stats > div b{font:800 21px "Bricolage Grotesque","Fredoka",system-ui,sans-serif;display:flex;align-items:center;gap:5px}
body.ep-app .ap-profil .ap-stats > div b svg{width:18px;height:18px}
body.ep-app .ap-profil .ap-stats > div span{font:400 12px "Lexend",system-ui,sans-serif}
body.ep-app .ap-profil .ap-stats > div:nth-child(1){background:linear-gradient(140deg,#FF9B3D,#C3540A)!important}
body.ep-app .ap-profil .ap-stats > div:nth-child(2){background:linear-gradient(140deg,#25C9AB,#0A7766)!important}
body.ep-app .ap-profil .ap-stats > div:nth-child(3){background:linear-gradient(140deg,#FF5C9E,#B5175A)!important}
body.ep-app .ap-profil .hd-woche{position:relative;overflow:hidden;border-radius:26px;padding:14px 16px;background:linear-gradient(140deg,#5A8BFF 0%,#2F63EC 50%,#1D45BF 100%);color:#fff;display:flex;flex-direction:column;gap:8px;box-shadow:0 14px 30px -14px rgba(0,0,0,.6)}
body.ep-app .ap-profil .hd-woche::after{content:"";position:absolute;width:140px;height:140px;border-radius:50%;right:-40px;top:-70px;background:rgba(255,255,255,.12)}
body.ep-app .ap-profil .hd-woche .hd-wk{display:flex;justify-content:space-between;align-items:baseline;position:relative}
body.ep-app .ap-profil .hd-woche .hd-wk b{font:600 16px "Lexend",system-ui,sans-serif}
body.ep-app .ap-profil .hd-woche .hd-wk span{font-size:13px}
body.ep-app .ap-profil .hd-woche .hd-wb{position:relative;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px;align-items:end;height:84px}
body.ep-app .ap-profil .hd-woche .hd-wb > div{display:flex;flex-direction:column;align-items:center;gap:4px;justify-content:flex-end;height:84px}
body.ep-app .ap-profil .hd-woche .hd-wb i{display:block;width:100%;border-radius:7px;background:rgba(255,255,255,.28);min-height:6px}
body.ep-app .ap-profil .hd-woche .hd-wb i.an{background:#FFD85E;box-shadow:0 0 10px rgba(255,216,94,.7)}
body.ep-app .ap-profil .hd-woche .hd-wb span{font-size:11px}
body.ep-app .ap-profil .hd-garde{min-height:92px}
body.ep-app .ap-profil .hd-stark{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
body.ep-app .ap-profil .hd-stark > span{font:600 12px "Lexend",system-ui,sans-serif;letter-spacing:.06em;color:#C9C3FF}
body.ep-app .ap-profil .hd-stark button{display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 12px;border-radius:18px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.12);color:#fff;font:500 13px "Lexend",system-ui,sans-serif;cursor:pointer}
body.ep-app .ap-profil .hd-stark button .ic,body.ep-app .ap-profil .hd-stark button svg{width:18px;height:18px}
:root[data-theme="light"] body.ep-app .ap-profil .hd-stark > span{color:#fff}
:root[data-theme="light"] body.ep-app .ap-profil .hd-stark button{background:rgba(27,34,64,.45)}
/* ===== Quiz wie im Entwurf ===== */
body.ep-app.ep-s-quiz .qtop,body.ep-app.ep-s-quiz .qnav,body.ep-app.ep-s-quiz .crumbs{display:none!important}
body.ep-app.ep-s-quiz .hd-qtop{display:flex;align-items:center;gap:10px;height:44px;margin:0 0 12px}
body.ep-app.ep-s-quiz .hd-qtop .hd-x{width:44px;height:44px;border-radius:22px;border:0;background:rgba(255,255,255,.16);color:#fff;display:grid;place-items:center;cursor:pointer;flex:none;font-size:22px;line-height:1}
body.ep-app.ep-s-quiz .hd-qtop .hd-segs{flex:1;display:flex;gap:5px}
body.ep-app.ep-s-quiz .hd-qtop .hd-segs i{flex:1;height:10px;border-radius:5px;background:rgba(255,255,255,.2)}
body.ep-app.ep-s-quiz .hd-qtop .hd-segs i.ok{background:#4FCB62;box-shadow:0 0 8px rgba(79,203,98,.8)}
body.ep-app.ep-s-quiz .hd-qtop .hd-segs i.nein{background:#FF6B6B;box-shadow:0 0 8px rgba(255,107,107,.7)}
body.ep-app.ep-s-quiz .hd-qtop .hd-segs i.jetzt{background:#FFD85E;box-shadow:0 0 8px rgba(255,216,94,.8)}
body.ep-app.ep-s-quiz .hd-qtop .hd-serie{display:flex;align-items:center;gap:3px;height:34px;padding:0 10px;border-radius:17px;background:linear-gradient(140deg,#FF9B3D,#C3540A);color:#fff;font:600 14px "Lexend",system-ui,sans-serif;box-shadow:inset 0 -3px 0 rgba(0,0,0,.18)}
body.ep-app.ep-s-quiz .hd-qtop .hd-serie.an{box-shadow:0 0 14px rgba(255,155,61,.8),inset 0 -3px 0 rgba(0,0,0,.18)}
:root[data-theme="light"] body.ep-app.ep-s-quiz .hd-qtop .hd-x{background:rgba(27,34,64,.55)}
body.ep-app.ep-s-quiz .card .tabs{display:none!important}
body.ep-app.ep-s-quiz .card .hd-chips{display:flex;gap:6px;margin:0 0 8px}
body.ep-app.ep-s-quiz .card .hd-chips span{display:inline-flex;align-items:center;gap:5px;height:30px;padding:0 11px;border-radius:15px;background:rgba(255,255,255,.16);font:600 13px "Lexend",system-ui,sans-serif;color:#fff}
body.ep-app.ep-s-quiz .card .hd-chips span .ic,body.ep-app.ep-s-quiz .card .hd-chips span svg,body.ep-app.ep-s-quiz .card .hd-chips span img{width:16px;height:16px}
:root[data-theme="light"] body.ep-app.ep-s-quiz .card .hd-chips span{background:rgba(27,34,64,.55)}
body.ep-app.ep-s-quiz .card .qbox{min-height:150px;padding-right:128px;align-items:flex-start}
body.ep-app.ep-s-quiz .card h2.question{font:800 clamp(1.3rem,6vw,1.9rem)/1.12 "Bricolage Grotesque","Fredoka",system-ui,sans-serif!important}
body.ep-app.ep-s-quiz .card .hd-qkid{height:180px;right:-18px;bottom:-8px}
body.ep-app.ep-s-quiz .card .answers{gap:10px!important;margin-top:10px!important}
body.ep-app.ep-s-quiz .answers .ans{min-height:56px!important;border-radius:20px!important;padding:8px 14px 8px 60px!important;text-align:left!important;justify-content:flex-start!important;font:600 16px "Lexend",system-ui,sans-serif!important;box-shadow:inset 0 -4px 0 rgba(0,0,0,.18),0 8px 18px -10px rgba(0,0,0,.6)!important}
body.ep-app.ep-s-quiz .answers .ans .key{width:32px!important;height:32px!important;left:14px!important}
body.ep-app.ep-s-quiz .answers .ans:nth-child(1) .key{color:#2F63EC!important}
body.ep-app.ep-s-quiz .answers .ans:nth-child(2) .key{color:#2CA343!important}
body.ep-app.ep-s-quiz .answers .ans:nth-child(3) .key{color:#EF7418!important}
body.ep-app.ep-s-quiz .answers .ans:nth-child(4) .key{color:#E2307A!important}
body.ep-app.ep-s-quiz .card .hd-hilfen{display:grid;grid-template-columns:repeat(auto-fit,minmax(0,1fr));gap:10px;margin-top:12px}
body.ep-app.ep-s-quiz .card .hd-hilfen > *{margin:0!important}
body.ep-app.ep-s-quiz .card .hd-hilfen .hlf-vlrow{display:block!important;padding:0!important;background:none!important;border:0!important;box-shadow:none!important}
body.ep-app.ep-s-quiz .card .hd-hilfen .hlf-vl{width:100%;height:50px;border:0!important;border-radius:16px!important;background:linear-gradient(140deg,#25C9AB,#0A7766)!important;color:#fff!important;font:600 14px "Lexend",system-ui,sans-serif!important;display:flex;align-items:center;justify-content:center;gap:6px;box-shadow:inset 0 -4px 0 rgba(0,0,0,.18)!important;padding:0 8px!important}
body.ep-app.ep-s-quiz .card .hd-hilfen .hlf-vl:not(.an){opacity:.6}
body.ep-app.ep-s-quiz .card .hd-hilfen .hlf-vl .hlf-vls{display:none!important}
body.ep-app.ep-s-quiz .card .hd-hilfen .hlf-vl .hlf-vli svg{width:18px;height:18px}
body.ep-app.ep-s-quiz .card .hd-hilfen .hlf-j{height:50px;border:0!important;border-radius:16px!important;font:600 14px "Lexend",system-ui,sans-serif!important;display:flex;align-items:center;justify-content:center;gap:6px;position:relative;padding:0 8px!important;box-shadow:inset 0 -4px 0 rgba(0,0,0,.18)!important;white-space:nowrap}
body.ep-app.ep-s-quiz .card .hd-hilfen .hlf-j[data-hj="f50"]{background:linear-gradient(140deg,#9070FF,#4A2FC0)!important;color:#fff!important}
body.ep-app.ep-s-quiz .card .hd-hilfen .hlf-j[data-hj="tipp"]{background:linear-gradient(180deg,#FFD85E,#FFB21E)!important;color:#2A1D5C!important}
body.ep-app.ep-s-quiz .card .hd-hilfen .hlf-j .hlf-ji{display:none!important}
body.ep-app.ep-s-quiz .card .hd-hilfen .hlf-j .hlf-n{position:absolute;right:6px;top:6px;width:18px;height:18px;border-radius:9px;background:rgba(0,0,0,.25);color:#fff;font-size:11px;display:grid;place-items:center}
body.ep-app.ep-s-quiz .card .hd-hilfen .hlf-j[data-hj="tipp"]::before{content:"💡";font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif}
body.ep-app.ep-s-quiz .card .hlf-joker:not(.hd-drin){display:none!important}
body.ep-app.ep-s-quiz .card .hlf-hinweis,body.ep-app.ep-s-quiz .card .tasthinweis,body.ep-app.ep-s-quiz .card .qnr{display:none!important}
/* Antwort-Blatt */
body.ep-app .feedback.pop{overflow:visible!important;margin-top:56px!important;padding:22px 16px 20px!important;border-radius:34px 34px 28px 28px!important}
body.ep-app .feedback.pop .hd-kid{right:8px!important;top:-84px!important;height:122px!important}
body.ep-app .feedback.pop>p{font-size:30px!important;min-height:0!important;margin:0 0 10px!important;padding-right:0!important}
body.ep-app .feedback.pop>p .hd-xp{display:inline-flex;align-items:center;gap:4px;font:700 14px "Lexend",system-ui,sans-serif;padding:5px 11px;border-radius:12px;background:linear-gradient(180deg,#FFD85E,#FFB21E);color:#2A1D5C;box-shadow:0 3px 0 #D2860A;text-shadow:none;margin-left:4px}
body.ep-app.ep-s-quiz .card.hd-beantwortet .qbox{min-height:0;padding-right:0}
body.ep-app.ep-s-quiz .card.hd-beantwortet .hd-qkid,body.ep-app.ep-s-quiz .card.hd-beantwortet .hd-chips{display:none!important}
body.ep-app.ep-s-quiz .card.hd-beantwortet h2.question{font-size:22px!important;line-height:1.15!important}
body.ep-app .feedback.pop .hd-erkl{margin:0 0 12px;font:400 15px/1.45 "Lexend",system-ui,sans-serif;color:#fff;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
body.ep-app .feedback.pop .row{display:flex!important;flex-direction:column;gap:10px;width:100%!important;box-sizing:border-box}
body.ep-app .feedback.pop .row .big.alt{align-self:flex-start;min-height:40px!important;height:40px;padding:0 14px;border-radius:20px!important;background:rgba(0,0,0,.2)!important;border:0!important;font:500 14px "Lexend",system-ui,sans-serif!important}
body.ep-app .feedback.pop .row .big:not(.alt){width:100%!important;max-width:none!important;align-self:stretch;display:flex!important;justify-content:center;align-items:center;box-sizing:border-box;min-height:58px!important;font:700 18px "Lexend",system-ui,sans-serif!important;border-radius:29px!important}
body.ep-app .answers.hd-fertig .ans.right .key{background:#fff!important;color:#1D7F33!important}

/* Bibliothek aus dem Quiz: goldener Rückweg unten */
body.ep-app.ep-ausquiz.ep-s-libseite .hd-zurueck{position:fixed;left:20px;right:20px;bottom:calc(22px + env(safe-area-inset-bottom));height:62px;border:0;border-radius:31px;background:linear-gradient(180deg,#FFD85E,#FFB21E);color:#2A1D5C;font:700 17px "Lexend",system-ui,sans-serif;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 6px 0 #D2860A,0 16px 30px -10px rgba(0,0,0,.6);z-index:70;cursor:pointer}
body.ep-app.ep-s-libseite .hd-zurueck small{font-weight:500;font-size:14px}
body.ep-app.ep-ausquiz.ep-s-libseite #app{padding-bottom:100px}
body.ep-app.ep-ausquiz.ep-s-libseite .ap-kz .ap-zbtn{opacity:.001;pointer-events:none;position:absolute}
body.ep-app.ep-s-libseite .libart .speak,body.ep-app.ep-s-libseite .libart .vorlesen{background:linear-gradient(140deg,#25C9AB,#0A7766)!important;color:#fff!important;border:0!important;box-shadow:inset 0 -3px 0 rgba(0,0,0,.2)!important}

body.ep-app .ap-heute .hd-kapsel{position:absolute;top:8px;right:-6px;height:48px;border-radius:24px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.12);z-index:4;pointer-events:none;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
:root[data-theme="light"] body.ep-app .ap-heute .hd-kapsel{background:rgba(27,34,64,.4)}
body.ep-app .ap-heute .hd-pillen > span.glas,body.ep-app .ap-heute > .xs-knopf,body.ep-app .ap-heute > .xui-knopf{background:rgba(255,255,255,.12)!important;border:0!important}
/* Hero so hoch wie im Entwurf, Rest bekommt Platz */
body.ep-app .ap-heute .hd-schlicht ~ .ap-karu{flex:0 0 auto!important;height:218px!important;min-height:0!important}
@media (max-height:740px){body.ep-app .ap-heute .hd-schlicht ~ .ap-karu{height:196px!important}}

/* Mond und Sonne auf der Startseite nicht über die Begrüssung legen */
body.ep-app.ep-home #mond,body.ep-app.ep-home #sonne{left:74%!important;top:118px!important}
@media (max-height:700px){body.ep-app .ap-heute .hd-schlicht ~ .ap-karu{height:172px!important}body.ep-app .ap-heute .x-app .apkids,body.ep-app .ap-heute .x-app img{max-height:96px}body.ep-app .ap-heute .ap-tag .apf{min-height:0!important}}
body.ep-app .ap-heute > .hd-platz{visibility:hidden!important;pointer-events:none!important}

/* ===== Abgleich mit dem Entwurf (Nr. 6 bis 12) ===== */
/* Nachthimmel im Violett des Entwurfs, Berge violett getönt */
:root[data-theme="dark"] body.ep-app.hd-handy{background:linear-gradient(180deg,#22197A 0%,#17115A 45%,#0F0B3A 100%) fixed!important}
:root[data-theme="dark"] body.ep-app.hd-handy #alpen{filter:hue-rotate(18deg) saturate(1.25) brightness(.85)}
/* Start: Kacheln kurz wie im Entwurf, damit die Wochen-Challenge Platz hat */
body.hd-handy .ap-heute .ap-tag .apf small,body.hd-handy .ap-heute .ap-tag .apf .aptx small{display:none!important}
body.hd-handy .ap-heute .ap-tag .apf{min-height:0!important;height:auto!important;padding:12px!important}
body.hd-handy .ap-heute .ap-tag{flex:0 0 auto!important;height:auto!important}
/* Duell: Blitz-Symbol und Kartenhöhe */
body.ep-app .ap-duell .ap-titel h2::before{background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%232A1D5C'%3E%3Cpath d='M13 2L4 14h7l-1 8 9-12h-7z'/%3E%3C/svg%3E") center/22px no-repeat,linear-gradient(180deg,#FFD85E,#FFB21E)!important;flex:none}
body.hd-handy .ap-duell .ap-bereit{flex:0 0 auto!important;height:288px!important;min-height:0!important}
body.hd-handy .ap-duell .ap-bereit .apkids img,body.hd-handy .ap-duell .ap-bereit > img{height:270px!important;max-height:none!important}
/* Profil: ohne Titel, Karte ganz oben */
body.hd-handy .ap-profil > .ap-titel{display:none!important}
/* Quiz: kein Rahmen, Frage gross oben, Kinder gross rechts, Antworten unten */
body.hd-handy.ep-s-quiz #mond,body.hd-handy.ep-s-quiz #sonne{display:none!important}
html:root[data-theme="dark"] body.ep-app.hd-handy.ep-s-quiz #app .card{outline:0!important;border:0!important;box-shadow:none!important;background:transparent!important}
body.hd-handy.ep-s-quiz .card{display:flex!important;flex-direction:column;min-height:calc(100dvh - 92px - env(safe-area-inset-top));box-sizing:border-box}
body.hd-handy.ep-s-quiz .card .qbox{flex:1 1 auto;min-height:190px!important;padding-right:0!important;align-items:flex-start!important;display:block!important}
body.hd-handy.ep-s-quiz .card h2.question{width:64%;margin:14px 0 0!important;font-size:clamp(1.45rem,7.6vw,1.95rem)!important;line-height:1.12!important}
body.hd-handy.ep-s-quiz .card .hd-qkid{height:min(236px,32dvh)!important;right:-26px!important;bottom:-4px!important}
body.hd-handy.ep-s-quiz .card .answers{margin-top:12px!important;gap:12px!important}
body.hd-handy.ep-s-quiz .card .hd-hilfen{margin-top:14px}
/* Nach der Antwort: Frage klein oben, Blatt von unten über die ganze Breite */
body.hd-handy.ep-s-quiz .card.hd-beantwortet{min-height:0}
body.hd-handy.ep-s-quiz .card.hd-beantwortet .qbox{flex:none;min-height:0!important}
body.hd-handy.ep-s-quiz .card.hd-beantwortet h2.question{width:auto;font-size:22px!important;margin:0!important}
body.hd-handy.ep-s-quiz .card.hd-beantwortet .answers{gap:8px!important}
body.hd-handy.ep-s-quiz .card.hd-beantwortet .answers .ans{min-height:52px!important}
body.hd-handy .feedback.pop{position:fixed!important;left:0!important;right:0!important;bottom:0!important;margin:0!important;z-index:80;border-radius:34px 34px 0 0!important;padding:22px 16px calc(24px + env(safe-area-inset-bottom))!important;box-shadow:0 -10px 40px rgba(0,0,0,.45),inset 0 2px 0 rgba(255,255,255,.35)!important;animation:hdHoch .3s cubic-bezier(.2,.9,.3,1.2) both}
body.hd-handy.ep-s-quiz .card.hd-beantwortet{padding-bottom:var(--hd-blatt,320px)!important}
`;
document.head.appendChild(css);


const handy = () => app() && Math.min(innerWidth, (screen && screen.width) || innerWidth) < 700;
function nacht(){}
let dunkelDa = false;

/* ---------- Start: Kopfzeile mit Logo links und Pillen rechts ---------- */
function kopf(){
  if(!handy()) return;
  const heute = $("#app .ap-heute"); if(!heute || heute.querySelector(".hd-pillen")) return;
  const gruss = heute.querySelector(":scope > .ap-gruss"); if(!gruss) return;
  const pillen = document.createElement("div"); pillen.className = "hd-pillen";
  const chips = heute.querySelector(".ap-kopf .ap-chips");
  if(chips){ const serie = [...chips.querySelectorAll(":scope > span.glas")].find(x => !/Lv/.test(x.textContent)); if(serie) pillen.appendChild(serie); }
  heute.appendChild(pillen); gruss.classList.add("hd-schlicht");
  const k = heute.querySelector(".ap-kopf"); if(k) k.classList.add("hd-weg");
}

/* ---------- Themen: Suche im Titel ---------- */
function suche(){
  if(!handy()) return;
  const t = $("#app .ap-themen .ap-titel"); if(!t || t.querySelector(".hd-such")) return;
  const b = document.createElement("button"); b.type = "button"; b.className = "hd-such"; b.setAttribute("aria-label", "Fragen suchen");
  b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>';
  b.onclick = () => { try{ go("suche"); }catch(e){} }; t.appendChild(b);
}

/* ---------- Quiz: Frage mit Lumi und Milo ---------- */
function frage(){
  if(!handy()) return;
  const q = $("#app .card h2.question"); if(!q) return;
  const alt = q.closest(".qbox"); if(alt){ [...alt.children].forEach(c => { if(c !== q && !c.classList.contains("hd-qkid")) alt.before(c); }); return; }
  const box = document.createElement("div"); box.className = "qbox"; q.before(box); box.appendChild(q);
  const img = document.createElement("img"); img.className = "hd-qkid"; img.alt = ""; img.src = KIDS + "lb-denken.webp"; box.appendChild(img);
}
/* Tableiste: «Start» statt «Hauptmenü» */
function tabname(){ if(!handy()) return; $$("#epTabs button[data-tab='heute'] span:last-child").forEach(sp => { if(sp.textContent === "Hauptmenü") sp.textContent = "Start"; }); }

/* ---------- Start: Tagesziel in der Hero-Karte ---------- */
function start(){
  if(!app()) return;
  const held = $("#app .ap-heute .hs-start .apht"); if(!held || held.querySelector(".hd-tag")) return;
  let n = 0; const lbl = $("#app .ap-heute .ap-kopf .aplbl"); const m = lbl && /(\d+)\s*von\s*(\d+)/.exec(lbl.textContent); if(m) n = Math.min(3, +m[1]);
  const t = document.createElement("span"); t.className = "hd-tag";
  t.innerHTML = `<b>Dein Tag: ${n} von 3 Quiz</b><i class="hd-bars" aria-hidden="true">${[0,1,2].map(i => `<s${i < n ? ' class="an"' : ""}></s>`).join("")}</i>`;
  const z = held.querySelector(".apzahlen"); if(z) z.after(t); else held.querySelector("h1")?.after(t);
  const b = held.querySelector(".ap-weissbtn");
  if(b){ if(n >= 3) b.innerHTML = PLAY + " Noch eins!"; else if(n > 0) b.innerHTML = PLAY + " Weiterspielen"; if(n > 0) b.dataset.x = "zufall"; }
}

/* ---------- Themen: Bereich-Blatt ---------- */
function blattZu(){ const s = $(".hd-sheet"); if(s) s.remove(); document.removeEventListener("keydown", escZu); }
function escZu(e){ if(e.key === "Escape") blattZu(); }
function blattAuf(apb){
  blattZu();
  const kopf = apb.querySelector(".apb-kopf"), name = kopf.querySelector("b")?.textContent || "", text = kopf.querySelector("small")?.textContent || "";
  const zahl = kopf.querySelector(".apn")?.textContent || "";
  const em = kopf.querySelector(".apem")?.innerHTML || "";
  const chips = $$(".apb-liste > *", apb), alle = apb.querySelector(".apb-alle");
  const cs = getComputedStyle(apb).getPropertyValue("--c").trim() || "#109C86";
  const s = document.createElement("div"); s.className = "hd-sheet"; s.setAttribute("role", "dialog"); s.setAttribute("aria-modal", "true"); s.setAttribute("aria-label", name);
  s.style.setProperty("--c", cs); s.style.setProperty("--c2", `color-mix(in srgb, ${cs} 70%, #fff)`); s.style.setProperty("--c3", `color-mix(in srgb, ${cs} 70%, #000)`);
  s.innerHTML = `<div class="hd-blatt"><div class="hd-griff" aria-hidden="true"></div>
    <div class="hd-kopf"><span class="hd-ico" aria-hidden="true">${em}</span><div><h2>${h(name)}</h2><p>${h(zahl || text)}</p></div><button type="button" class="hd-zu" aria-label="Schliessen">✕</button></div>
    <div class="hd-themen">${chips.map((c, i) => `<button type="button" class="hd-thema${c.classList.contains("leer") ? " leer" : ""}" data-i="${i}"><span class="hd-ti" aria-hidden="true">${c.querySelector(".apci")?.innerHTML || ""}</span><b>${h(c.querySelector(".apcn")?.textContent || c.textContent)}</b>${c.querySelector("small") ? `<small>${h(c.querySelector("small").textContent)}</small>` : ""}</button>`).join("")}</div>
    ${alle ? `<button type="button" class="hd-alle">${PLAY} ${h(alle.textContent.trim().replace(/\s+/g, " "))}</button>` : ""}</div>`;
  s.addEventListener("click", e => { if(e.target === s) blattZu(); });
  s.querySelector(".hd-zu").onclick = blattZu;
  $$(".hd-thema", s).forEach(b => b.onclick = () => { const c = chips[+b.dataset.i]; blattZu(); c && c.click(); });
  const a = s.querySelector(".hd-alle"); if(a) a.onclick = () => { blattZu(); alle.click(); };
  const schau = document.createElement("img"); schau.className = "hd-schau"; schau.alt = ""; schau.src = KIDS + "lb-denken.webp"; s.appendChild(schau);
  document.body.appendChild(s); document.addEventListener("keydown", escZu);
  try{ window.EP_SOUND && EP_SOUND.play("klick"); }catch(e){}
}
document.addEventListener("click", e => {
  if(!app()) return; const k = e.target.closest && e.target.closest("#app .ap-themen .apb-kopf"); if(!k) return;
  const apb = k.closest(".apb"); if(!apb || !apb.querySelector(".apb-liste")) return;
  e.preventDefault(); e.stopImmediatePropagation(); blattAuf(apb);
}, true);

/* ---------- Profil: vier Reiter ---------- */
let ptab = "ueber";
function profil(){
  if(!app()) return;
  const ap = $("#app .ap-profil"); if(!ap || ap.querySelector(".hd-ptabs")) return;
  const stats = ap.querySelector(".ap-stats"), liste = ap.querySelector(".ap-liste"); if(!stats || !liste) return;
  const tabs = document.createElement("div"); tabs.className = "hd-ptabs"; tabs.setAttribute("role", "tablist"); tabs.setAttribute("aria-label", "Profil-Bereiche");
  const T = [["ueber", "Übersicht"], ["album", "Album"], ["erfolge", "Erfolge"], ["einst", "Einstell."]];
  tabs.innerHTML = T.map(([id, n]) => `<button type="button" role="tab" data-t="${id}" aria-selected="${ptab === id}">${n}</button>`).join("");
  stats.after(tabs);
  /* Übersicht: Garderobe-Karte */
  const hatGarde = (() => { try{ return (window.EP_EXTRAS.liste() || []).some(w => w.id === "garderobe"); }catch(e){ return false; } })();
  if(hatGarde){ const g = document.createElement("button"); g.type = "button"; g.className = "hd-garde"; g.dataset.hdp = "ueber";
    g.innerHTML = `<span class="hd-gt"><b>Garderobe</b><small>Mützen, Brillen und mehr</small></span><img src="${KIDS}liegen.webp" alt="">`;
    g.onclick = () => { try{ window.EP_EXTRAS.oeffne("garderobe"); }catch(e){} }; tabs.after(g); }
  /* Erfolge */
  const ef = document.createElement("div"); ef.className = "hd-erfolge"; ef.dataset.hdp = "erfolge";
  let abz = []; try{ abz = window.EP_LERNEN.abzeichen() || []; }catch(e){}
  if(abz.length) ef.innerHTML = abz.slice().sort((a, b) => (b.hat ? 1 : 0) - (a.hat ? 1 : 0)).map(a => `<div class="hd-abz${a.hat ? "" : " aus"}" title="${h(a.text)}"><i>${a.emo}</i><b>${h(a.name)}</b></div>`).join("");
  else { ef.className = "hd-leer"; ef.textContent = "Spiel ein paar Runden, dann sammelst du hier deine Abzeichen."; }
  tabs.after(ef);
  /* Zuordnung */
  ap.querySelector(".ap-konto")?.setAttribute("data-hdp", "ueber"); stats.setAttribute("data-hdp", "ueber");
  liste.setAttribute("data-hdp", "einst"); ap.querySelector(".ep-ver")?.setAttribute("data-hdp", "einst");
  const zeig = () => { $$("[data-hdp]", ap).forEach(el => el.hidden = el.dataset.hdp !== ptab); $$("button", tabs).forEach(b => b.setAttribute("aria-selected", String(b.dataset.t === ptab)));
    try{ window.EP_MOBILPAGER && EP_MOBILPAGER.neu && EP_MOBILPAGER.neu(); }catch(e){} };
  $$("button", tabs).forEach(b => b.onclick = () => { const t = b.dataset.t;
    if(t === "album"){ try{ window.EP_EXTRAS.oeffne("album"); }catch(e){} return; }
    ptab = t; zeig(); try{ window.EP_SOUND && EP_SOUND.play("klick"); }catch(e){} });
  zeig();
}

/* ---------- Quiz: Antwort-Blatt ---------- */
function quiz(){
  if(!app()) return;
  const fb = $("#app .feedback.pop"); if(!fb || fb.dataset.hd) return; fb.dataset.hd = "1";
  const ok = !!$("#app .answers .ans.right") && !$("#app .answers .ans.wrong");
  fb.classList.add(ok ? "hd-ok" : "hd-nein");
  const an = $("#app .answers"); if(an) an.classList.add("hd-fertig");
  const p = fb.querySelector("p"); if(p && !fb.querySelector(".hd-kid")){ const img = document.createElement("img"); img.className = "hd-kid"; img.alt = ""; img.src = KIDS + (ok ? "duo-jubel.webp" : "lb-denken.webp"); fb.appendChild(img); }
}


/* ---------- Themen: «Weiter»-Zeile mit Bibliothek und zuletzt gespielten Themen ---------- */
function weiter(){
  if(!handy()) return;
  const u = $("#app .ap-themen .ap-unten"); if(!u || u.querySelector(".hd-weiter")) return;
  const mix = u.querySelector('[data-x="mix"] .aptx small'); if(mix) mix.textContent = "Aus jedem Bereich, passend zu dir";
  const z = document.createElement("div"); z.className = "hd-weiter";
  let th = []; try{ th = (window.EP_LERNEN.elternDaten().th || []).slice(0, 2); }catch(e){}
  const chip = (html, fn) => { const b = document.createElement("button"); b.type = "button"; b.innerHTML = html; b.onclick = fn; return b; };
  z.innerHTML = "<span>WEITER</span>";
  const lib = u.querySelector('[data-x="lib"]');
  z.appendChild(chip('<span class="ic emo-i" aria-hidden="true">📚</span>Bibliothek', () => lib ? lib.click() : go("lib")));
  th.forEach(([id]) => { const t = window.THEMA && THEMA[id]; if(!t) return;
    z.appendChild(chip(`${(() => { try{ return ico(t.emo); }catch(e){ return ""; } })()}${h(t.name)}`, () => { try{ startQuiz(id, "train", 10); }catch(e){} })); });
  u.appendChild(z);
}

/* ---------- Profil: Konto-Karte, Wochen-Diagramm, «Stark in» ---------- */
function profilKarte(){
  if(!handy()) return;
  const ap = $("#app .ap-profil"); if(!ap) return;
  const konto = ap.querySelector(".ap-konto"); if(!konto || konto.classList.contains("hd-konto") || !S.profil) return;
  let lv = null; try{ lv = window.EP_LEVEL.stand(); }catch(e){}
  const av = konto.querySelector(".apav"); const name = konto.querySelector(".apgross")?.textContent || "";
  const stufe = (() => { try{ return (STUFEN.find(x => x.id === S.stufe) || {}).name || ""; }catch(e){ return ""; } })();
  konto.classList.add("hd-konto");
  const altKn = konto.querySelector(".apkn"), btns = konto.querySelector(".apbtns");
  const avr = document.createElement("div"); avr.className = "hd-avr";
  avr.innerHTML = `<div class="hd-ring"><span></span></div><span class="hd-lvl">${lv ? lv.level : 1}</span>`;
  if(av) avr.querySelector(".hd-ring > span").appendChild(av);
  const kn = document.createElement("div"); kn.className = "hd-kn";
  kn.innerHTML = `<b>${h(name)}</b><span>${h(lv && lv.titel ? lv.titel.name : "Neuling")}${stufe ? " · " + h(stufe) : ""}</span>` +
    (lv ? `<div class="hd-xp"><i style="width:${Math.round(Math.min(1, lv.anteil) * 100)}%"></i></div><small>${lv.max ? "Höchstes Level erreicht" : `${lv.imLevel} von ${lv.proLevel} XP bis Level ${lv.level + 1}`}</small>` : "");
  if(altKn) altKn.remove(); if(btns) btns.remove();
  konto.prepend(kn); konto.prepend(avr);
  konto.style.cursor = "pointer"; konto.onclick = () => { try{ go("profil"); }catch(e){} };
  /* Stats: Serie, richtig, Abzeichen */
  const st = ap.querySelector(".ap-stats");
  if(st && st.children.length === 3){ let r = 0; try{ r = EP_LERNEN.elternDaten().r || 0; }catch(e){}
    const mitte = st.children[1]; mitte.innerHTML = `<small>Richtig</small><b>${r}</b><span>richtig</span>`; }
}
function woche(){
  if(!handy()) return;
  const ap = $("#app .ap-profil"); if(!ap) return;
  const tabs = ap.querySelector(".hd-ptabs"); if(!tabs || ap.querySelector(".hd-woche") || !S.profil) return;
  let d = null; try{ d = EP_LERNEN.elternDaten(); }catch(e){} if(!d) return;
  const t = (d.t || []).slice(-7), max = Math.max(1, ...t), sum = t.reduce((a, b) => a + b, 0);
  const N = ["So","Mo","Di","Mi","Do","Fr","Sa"]; const heute = new Date().getDay();
  const w = document.createElement("div"); w.className = "hd-woche"; w.dataset.hdp = "ueber";
  w.innerHTML = `<div class="hd-wk"><b>Diese Woche</b><span>${sum} Fragen</span></div><div class="hd-wb">${t.map((n, i) => { const tag = (heute - 6 + i + 7) % 7; return `<div><i class="${i === 6 ? "an" : ""}" style="height:${Math.max(6, Math.round(n / max * 64))}px"></i><span>${N[tag]}</span></div>`; }).join("")}</div>`;
  const g = ap.querySelector(".hd-garde"); if(g) g.before(w); else tabs.after(w);
  /* Stark in */
  const th = (d.th || []).filter(x => x[2] >= 5).map(x => [x[0], x[1] / Math.max(1, x[2])]).sort((a, b) => b[1] - a[1]).slice(0, 3);
  if(th.length){ const s = document.createElement("div"); s.className = "hd-stark"; s.dataset.hdp = "ueber"; s.innerHTML = "<span>STARK IN</span>";
    th.forEach(([id]) => { const t = window.THEMA && THEMA[id]; if(!t) return; const b = document.createElement("button"); b.type = "button"; b.innerHTML = `${(() => { try{ return ico(t.emo); }catch(e){ return ""; } })()}${h(t.name)}`; b.onclick = () => { try{ startQuiz(id, "train", 10); }catch(e){} }; s.appendChild(b); });
    (g || w).after(s); }
  try{ window.EP_MOBILPAGER && EP_MOBILPAGER.neu && EP_MOBILPAGER.neu(); }catch(e){}
}

/* ---------- Quiz: Kopfzeile mit Segmenten, Chips, Hilfen-Reihe ---------- */
function quizKopf(){
  if(!handy() || !document.body.classList.contains("ep-s-quiz")) return;
  const card = $("#app .card"); if(!card) return; const Q = S.quiz; if(!Q || !Q.list) return;
  const wrap = card.parentElement;
  let top = wrap.querySelector(".hd-qtop");
  if(!top){ top = document.createElement("div"); top.className = "hd-qtop";
    top.innerHTML = `<button type="button" class="hd-x" aria-label="Quiz beenden">✕</button><div class="hd-segs" role="progressbar"></div><span class="hd-serie"><span class="ic emo-i" aria-hidden="true">🔥</span><b>0</b></span>`;
    top.querySelector(".hd-x").onclick = () => { const b = $("#qAbgabe"); if(b) b.click(); };
    card.before(top); }
  const st = Q.st || [];
  top.querySelector(".hd-segs").innerHTML = Q.list.map((f, i) => `<i class="${st[i] && st[i].picked != null ? (st[i].ok ? "ok" : "nein") : (i === Q.i ? "jetzt" : "")}"></i>`).join("");
  let serie = 0; for(let i = Q.i; i >= 0; i--){ if(!st[i] || st[i].picked == null) continue; if(st[i].ok) serie++; else break; }
  top.querySelector(".hd-serie b").textContent = serie; top.querySelector(".hd-serie").classList.toggle("an", serie >= 2);
  /* Chips */
  if(!card.querySelector(".hd-chips")){ const c = document.createElement("div"); c.className = "hd-chips";
    const t = S.thema, stufe = (() => { try{ return STUFEN.find(x => x.id === S.stufe); }catch(e){ return null; } })();
    c.innerHTML = (t ? `<span>${(() => { try{ return ico(t.emo); }catch(e){ return ""; } })()}${h(t.name)}</span>` : "") + (stufe ? `<span>${["", "🌱", "🚀", "🎓"][stufe.id] || ""} ${h(stufe.name)}</span>` : "");
    card.prepend(c); }
  /* Hilfen-Reihe: Vorlesen, 50:50, Tipp */
  const joker = card.querySelector(".hlf-joker"), vl = card.querySelector(".hlf-vlrow"), an = card.querySelector(".answers");
  if(an && !card.querySelector(".hd-hilfen") && (joker || vl)){ const r = document.createElement("div"); r.className = "hd-hilfen";
    if(vl) r.appendChild(vl); if(joker){ joker.classList.add("hd-drin"); [...joker.querySelectorAll(".hlf-j")].forEach(j => { r.appendChild(j); if(j.dataset.hj === "tipp"){ [...j.childNodes].forEach(n => { if(n.nodeType === 3) n.textContent = "Tipp"; }); } }); joker.remove(); }
    const fb = card.querySelector(".feedback"); if(fb) fb.before(r); else an.after(r); }
}

/* ---------- Antwort-Blatt: Erklärung, XP, «Weiter» ---------- */
function blatt(){
  if(!handy()) return;
  const fb = $("#app .feedback.pop"); if(!fb || fb.dataset.hdb) return; fb.dataset.hdb = "1";
  const Q = S.quiz, f = Q && Q.list && Q.list[Q.i]; const p = fb.querySelector("p");
  if(p && Q && Q.lastPts > 0 && !p.querySelector(".hd-xp")){ const x = document.createElement("span"); x.className = "hd-xp"; x.textContent = `+${Q.lastPts} XP`; p.appendChild(x); }
  if(f && f.e && p){ const e = document.createElement("div"); e.className = "hd-erkl"; e.textContent = f.e; p.after(e); }
  const te = fb.querySelector("#toExplain"); if(te){ te.innerHTML = '<span class="ic emo-i" aria-hidden="true">📚</span> Mehr dazu'; }
  const nx = fb.querySelector("#next"); if(nx && /Nächste Frage/.test(nx.textContent)) nx.textContent = "Weiter →";
  const hil = $("#app .card .hd-hilfen"); if(hil) hil.style.display = "none";
  const card = fb.closest(".card"); if(card) card.classList.add("hd-beantwortet");
  setTimeout(() => { try{ if(card) card.style.setProperty("--hd-blatt", Math.ceil(fb.getBoundingClientRect().height + 12) + "px"); }catch(e){} }, 60);
}


/* ---------- Bibliothek aus dem Quiz: «Zurück zum Quiz» unten ---------- */
function zurueck(){
  if(!handy() || !document.body.classList.contains("ep-ausquiz") || !document.body.classList.contains("ep-s-libseite")) return;
  if($(".hd-zurueck")) return;
  const z = $("#app .ap-kz .ap-zbtn[data-ausquiz]"); if(!z) return;
  const b = document.createElement("button"); b.type = "button"; b.className = "hd-zurueck";
  const Q = S.quiz; const n = Q && Q.list ? `<small>· Frage ${Q.i + 1} von ${Q.list.length}</small>` : "";
  b.innerHTML = `${PLAY} Zurück zum Quiz ${n}`; b.onclick = () => z.click();
  document.body.appendChild(b);
}
const moZ = new MutationObserver(() => { const b = $(".hd-zurueck"); if(b && !(document.body.classList.contains("ep-ausquiz") && document.body.classList.contains("ep-s-libseite"))) b.remove(); });
moZ.observe(document.body, {attributes:true, attributeFilter:["class"]});


function kapsel(){
  if(!handy()) return; const heute = $("#app .ap-heute"); const pil = heute && heute.querySelector(".hd-pillen"); if(!pil) return;
  let k = heute.querySelector(".hd-kapsel"); if(!k){ k = document.createElement("div"); k.className = "hd-kapsel"; heute.appendChild(k); }
  const hr = heute.getBoundingClientRect(), pr = pil.getBoundingClientRect(); if(!pr.width) return;
  k.style.width = Math.round(hr.right - pr.left + 6 + 6) + "px";
}
addEventListener("resize", () => { try{ kapsel(); }catch(e){} try{ einpassen(); }catch(e){} });


/* Startseite: Kästen, die nicht mehr ganz über die Tableiste passen, ausblenden statt anschneiden */
function einpassen(){
  if(!handy()) return; const heute = $("#app .ap-heute"); const tabs = document.getElementById("epTabs"); if(!heute || !tabs) return;
  $$(".hd-platz", heute).forEach(e => e.classList.remove("hd-platz"));
  const grenze = tabs.getBoundingClientRect().top - 6;
  [...heute.children].reverse().forEach(e => {
    if(e.classList.contains("hd-kapsel") || e.classList.contains("hd-pillen") || e.matches(".xs-knopf,.xui-knopf,.ap-gruss,.ap-karu")) return;
    const st = getComputedStyle(e); if(st.display === "none" || st.position === "absolute" || st.position === "fixed") return;
    if(e.getBoundingClientRect().bottom > grenze) e.classList.add("hd-platz");
  });
}
addEventListener("resize", () => { try{ einpassen(); }catch(e){} });

/* ---------- Anstossen: nach jedem Rendern und bei App-Umbauten ---------- */
function alles(){ try{ document.body.classList.toggle("hd-handy", handy()); }catch(e){} try{ nacht(); }catch(e){} try{ kopf(); }catch(e){} try{ start(); }catch(e){} try{ suche(); }catch(e){} try{ weiter(); }catch(e){} try{ profilKarte(); }catch(e){} try{ woche(); }catch(e){} try{ quizKopf(); }catch(e){} try{ blatt(); }catch(e){} try{ zurueck(); }catch(e){} try{ kapsel(); }catch(e){} try{ einpassen(); }catch(e){} try{ frage(); }catch(e){} try{ tabname(); }catch(e){} try{ profil(); }catch(e){} try{ quiz(); }catch(e){} }
if(typeof window.render === "function"){ const vor = window.render; window.render = function(){ const r = vor.apply(this, arguments); setTimeout(alles, 0); setTimeout(alles, 80); return r; }; }
let plan = 0;
const mo = new MutationObserver(() => { if(plan) return; plan = setTimeout(() => { plan = 0; alles(); }, 30); });
function beobachten(){ const a = document.getElementById("app"); if(a) mo.observe(a, {childList:true, subtree:true}); alles(); }
if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", beobachten); else beobachten();
window.EP_HANDY = { start, profil, quiz, blattZu, kopf };
addEventListener("resize", () => { dunkelDa = false; try{ nacht(); }catch(e){} });
})();
