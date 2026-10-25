/* easyplay: Ergänzungen nur für die App (iPhone, iPad, Android).
   Wird beim Bau der App vor allen anderen Skripten in index.html eingesetzt (app/www-bauen.py),
   auf der Website gibt es diese Datei nicht.
   1. window.EP_NATIV: Website-Code weiss, dass er in der App läuft (keine Versionsprüfung, kein Service Worker).
   2. Bilder der Bibliothek (bilder/…) sind nicht in der App. Sie kommen bei Bedarf aus dem Internet
      und bleiben danach im Gerät gespeichert (IndexedDB «ep-app-bilder»), auch ohne Internet.
   3. Korrekturen (korrektur/…) und Werbung (werbung.json) zuerst frisch von der Website, sonst die eingebaute Fassung.
   4. Echte App-Funktionen: Vibration bei richtig/falsch (Haptics), Teilen-Fenster (Share),
      Erinnerungen für Tagesquiz und Serie (Local Notifications). */
(function(){
"use strict";
window.EP_NATIV = true;
var WEB = "https://easyplay.ch/", WEB_ALT = "https://djsunji.github.io/easyplay/";   /* zuerst easyplay.ch, sonst die alte Adresse */
var holenWeb = function(pfad, opt){ return fetch(WEB + pfad, opt).then(function(r){ if(r.ok) return r; throw new Error(r.status); }).catch(function(){ return fetch(WEB_ALT + pfad, opt); }); };
var P = function(){ return (window.Capacitor && window.Capacitor.Plugins) || {}; };
var nativ = function(){ try{ return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()); }catch(e){ return false; } };
document.documentElement.classList.add("ep-app");

/* ---------- 2. Bilder bei Bedarf laden und speichern ---------- */
var DB = null;
function db(){
  if(DB) return DB;
  DB = new Promise(function(ok){
    try{
      var r = indexedDB.open("ep-app-bilder", 1);
      r.onupgradeneeded = function(){ r.result.createObjectStore("b"); };
      r.onsuccess = function(){ ok(r.result); };
      r.onerror = function(){ ok(null); };
    }catch(e){ ok(null); }
  });
  return DB;
}
function holen(k){ return db().then(function(d){ return new Promise(function(ok){ if(!d) return ok(null);
  try{ var q = d.transaction("b").objectStore("b").get(k); q.onsuccess = function(){ ok(q.result || null); }; q.onerror = function(){ ok(null); }; }catch(e){ ok(null); } }); }); }
function ablegen(k, blob){ return db().then(function(d){ if(!d) return;
  try{ d.transaction("b", "readwrite").objectStore("b").put(blob, k); }catch(e){} }); }

var URLS = {};          /* bilder/… -> blob:-Adresse (in dieser Sitzung) */
var LAEUFT = {};        /* bilder/… -> Promise */
var LEER = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
var BILD = /^(\.\/)?bilder\/[a-z0-9/]+\.webp$/i;

function bildAdresse(pfad){
  pfad = pfad.replace(/^\.\//, "");
  if(URLS[pfad]) return Promise.resolve(URLS[pfad]);
  if(LAEUFT[pfad]) return LAEUFT[pfad];
  LAEUFT[pfad] = holen(pfad).then(function(b){
    if(b) return b;
    return holenWeb(pfad, {mode:"cors"}).then(function(r){
      if(!r.ok) throw new Error(r.status);
      return r.blob();
    }).then(function(b){ ablegen(pfad, b); return b; });
  }).then(function(b){ URLS[pfad] = URL.createObjectURL(b); return URLS[pfad]; })
    .catch(function(){ return WEB + pfad; })      /* geht nicht: Originaladresse, das Bild meldet dann selbst seinen Fehler */
    .then(function(u){ delete LAEUFT[pfad]; return u; });
  return LAEUFT[pfad];
}
function bildPruefen(img){
  var s = img.getAttribute("src");
  if(!s || !BILD.test(s)) return;
  if(URLS[s.replace(/^\.\//, "")]){ img.setAttribute("src", URLS[s.replace(/^\.\//, "")]); return; }
  img.setAttribute("src", LEER);
  bildAdresse(s).then(function(u){ if(img.getAttribute("src") === LEER) img.setAttribute("src", u); });
}
function baumPruefen(n){
  if(!n || n.nodeType !== 1) return;
  if(n.tagName === "IMG") bildPruefen(n);
  else if(n.querySelectorAll){ var l = n.querySelectorAll("img[src^='bilder/'],img[src^='./bilder/']"); for(var i = 0; i < l.length; i++) bildPruefen(l[i]); }
}
new MutationObserver(function(ms){
  for(var i = 0; i < ms.length; i++){
    var m = ms[i];
    if(m.type === "attributes") bildPruefen(m.target);
    else for(var j = 0; j < m.addedNodes.length; j++) baumPruefen(m.addedNodes[j]);
  }
}).observe(document.documentElement, {childList:true, subtree:true, attributes:true, attributeFilter:["src"]});
/* Bilder, die per JavaScript ohne Seite geladen werden (new Image()) */
try{
  var d = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "src");
  if(d && d.set) Object.defineProperty(HTMLImageElement.prototype, "src", {configurable:true, enumerable:d.enumerable,
    get:function(){ return d.get.call(this); },
    set:function(v){ var s = String(v); if(BILD.test(s) && !this.isConnected){ var img = this; d.set.call(img, LEER); bildAdresse(s).then(function(u){ d.set.call(img, u); }); return; } d.set.call(this, v); }});
}catch(e){}

/* ---------- 3. Frische Korrekturen und Werbung von der Website ---------- */
var FRISCH = /^(\.\/)?(korrektur\/[a-z0-9_\-]+\.json|werbung\.json)(\?.*)?$/i;
var fetchAlt = window.fetch.bind(window);
window.fetch = function(input, init){
  try{
    var u = typeof input === "string" ? input : (input && input.url) || "";
    var rel = u.indexOf(location.origin + "/") === 0 ? u.slice(location.origin.length + 1) : u;
    if(FRISCH.test(rel) && navigator.onLine !== false){
      var ctl = window.AbortController ? new AbortController() : null;
      var t = setTimeout(function(){ try{ ctl && ctl.abort(); }catch(e){} }, 5000);
      var rp = rel.replace(/^\.\//, "");
      return fetchAlt(WEB + rp, {cache:"no-cache", signal:ctl ? ctl.signal : undefined}).then(function(r){ return r.ok ? r : fetchAlt(WEB_ALT + rp, {cache:"no-cache"}); }).then(function(r){
        clearTimeout(t); if(r.ok) return r; return fetchAlt(input, init);
      }, function(){ clearTimeout(t); return fetchAlt(input, init); });
    }
    /* Eigene Dateien der App (capacitor://localhost): ohne Cache-Angabe holen. Der iPhone-WebView liefert
       Anfragen mit cache:"force-cache" an das App-Schema nicht zuverlässig aus (Bibliothekstexte fehlten).
       Klappt es trotzdem nicht, kommen Texte und Fragen von der Website. */
    var lokal = typeof input === "string" && !/^[a-z][a-z0-9+.-]*:/i.test(rel);
    if(lokal){
      var i2 = init ? Object.assign({}, init) : undefined; if(i2) delete i2.cache;
      var rp2 = rel.replace(/^\.\//, "");
      var p2 = fetchAlt(input, i2);
      if(/^(tx\/|texte-|fragen|bildindex|welten\/)/.test(rp2)) return p2.then(function(r){ return r.ok ? r : holenWeb(rp2, {}); }, function(){ return holenWeb(rp2, {}); });
      return p2;
    }
  }catch(e){}
  return fetchAlt(input, init);
};

/* ---------- 4. Echte App-Funktionen ---------- */
/* Teilen: immer das Teilen-Fenster des Geräts */
function teilen(daten){
  var S = P().Share;
  if(!S) return Promise.reject(new Error("kein Teilen"));
  daten = daten || {};
  return S.share({title:daten.title || "easyplay", text:daten.text || "", url:daten.url || undefined, dialogTitle:"Teilen"})
    .catch(function(e){ var x = new Error("abgebrochen"); x.name = "AbortError"; throw x; });
}
if(nativ()){ try{ Object.defineProperty(navigator, "share", {configurable:true, value:teilen}); navigator.canShare = function(){ return true; }; }catch(e){} }

/* Vibration bei Rückmeldungen im Quiz */
var SPUER = {richtig:["notification","SUCCESS"], falsch:["notification","ERROR"], fehler:["notification","WARNING"],
  levelup:["notification","SUCCESS"], freischalten:["impact","MEDIUM"], truhe:["impact","HEAVY"], fanfare:["notification","SUCCESS"], sammeln:["impact","LIGHT"]};
function spueren(name){
  var H = P().Haptics, s = SPUER[name]; if(!H || !s) return;
  try{ if(s[0] === "notification") H.notification({type:s[1]}); else H.impact({style:s[1]}); }catch(e){}
}
var wartenSound = setInterval(function(){
  var E = window.EP_SOUND; if(!E || !E.play || E.__app) return;
  var alt = E.play; E.play = function(n){ spueren(n); return alt.apply(this, arguments); }; E.__app = true;
  clearInterval(wartenSound);
}, 200);
setTimeout(function(){ clearInterval(wartenSound); }, 30000);

/* Erinnerungen: Tagesquiz (jeden Tag 17:30) und Serie (19:00, wenn heute noch nicht gelernt) */
var LS = function(k, d){ try{ var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } };
var tag = function(x){ return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); };
function um(tagPlus, h, m){ var d = new Date(); d.setDate(d.getDate() + tagPlus); d.setHours(h, m, 0, 0); return d; }
function erlaubt(){
  var N = P().LocalNotifications; if(!N) return Promise.resolve(false);
  return N.checkPermissions().then(function(p){
    if(p.display === "granted") return true;
    if(p.display === "denied") return false;
    /* erst fragen, wenn schon einmal gespielt wurde, und nur einmal */
    if(!LS("ep-serie", null) || LS("ep-app-gefragt", false)) return false;
    try{ localStorage.setItem("ep-app-gefragt", "true"); }catch(e){}
    return N.requestPermissions().then(function(q){ return q.display === "granted"; });
  }).catch(function(){ return false; });
}
function erinnerungenPlanen(){
  var N = P().LocalNotifications; if(!N || !nativ()) return;
  erlaubt().then(function(ok){
    if(!ok) return;
    var heute = tag(new Date()), jetzt = Date.now();
    var se = LS("ep-serie", {}) || {}, tq = LS("ep-tagesquiz", {}) || {};
    var n = [];
    var tqZeit = tq[heute] || um(0, 17, 30).getTime() <= jetzt ? um(1, 17, 30) : um(0, 17, 30);
    n.push({id:1, title:"Tagesquiz 🌟", body:"Dein Tagesquiz wartet. 5 Fragen, ein paar Minuten.", schedule:{at:tqZeit, allowWhileIdle:true}});
    var gestern = tag(um(-1, 12, 0)), heuteGelernt = se.letzter === heute;
    if(se.n > 0 && (heuteGelernt || se.letzter === gestern)){
      var seZeit = heuteGelernt || um(0, 19, 0).getTime() <= jetzt ? um(1, 19, 0) : um(0, 19, 0);
      var tage = se.n;
      n.push({id:2, title:"Deine Serie 🔥", body:"Du lernst seit " + tage + (tage === 1 ? " Tag" : " Tagen") + " jeden Tag. Mach heute weiter, damit die Serie bleibt!", schedule:{at:seZeit, allowWhileIdle:true}});
    }
    N.cancel({notifications:[{id:1}, {id:2}]}).catch(function(){}).then(function(){ return N.schedule({notifications:n}); }).catch(function(){});
  });
}
document.addEventListener("visibilitychange", function(){ if(document.visibilityState === "hidden") erinnerungenPlanen(); });
setTimeout(erinnerungenPlanen, 8000);
/* Tippen auf eine Erinnerung: Tagesquiz öffnen, wenn möglich */
try{ var N0 = P().LocalNotifications; N0 && N0.addListener && N0.addListener("localNotificationActionPerformed", function(a){
  try{ if(a && a.notification && a.notification.id === 1 && typeof window.go === "function") window.go("home"); }catch(e){}
}); }catch(e){}
})();
