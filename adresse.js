/* ===== Adressen für jede Seite (easyplay.ch/bibliothek/natur/…) =====
   Schreibt nach jedem Seitenwechsel die passende Adresse in die Adresszeile (history.pushState) und den Seitentitel,
   öffnet beim Laden die Seite zur Adresse und reagiert auf Zurück/Vorwärts im Browser (popstate).
   Der Server liefert für jede Adresse ohne Dateiendung index.html aus (server/statisch.js), <base href="/"> oben in index.html
   sorgt dafür, dass Bilder und Dateien auch unter /bibliothek/… gefunden werden.
   Nicht in der App (EP_NATIV), nicht in Qeels und nicht auf GitHub Pages. ===== */
(function(){
  if(window.EP_NATIV || window.EP_NUR_QEELS || !/^https?:$/.test(location.protocol) || /github\.io$/.test(location.hostname)) return;
  if(/^\/(qeels|qeels-ch|admin|lehrer)(\/|$)/.test(location.pathname)) return;

  const slug = t => String(t || "").toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "seite";
  const enc = encodeURIComponent;
  /* einfache Seiten: Bildschirm <-> Adresse */
  const EINFACH = {
    lib: "bibliothek", duell: "duell", profil: "profil", konto: "anmelden", login: "login", register: "registrieren",
    board: "rangliste", suche: "suche", meinetests: "meine-tests", live: "live", hardcore: "hardcore", hardcoreinfo: "hardcore/regeln",
    epwoche: "wochen-challenge", spielmodi: "spielmodi", historie: "verlauf", hcboard: "hardcore/rangliste", bibliothek: "fragen",
    chat: "tagesquiz", kontakt: "kontakt", duellgeraet: "duell/ein-geraet"
  };
  const ZURUECK = {}; Object.keys(EINFACH).forEach(k => ZURUECK[EINFACH[k]] = k);
  /* kurzlebige Seiten bekommen die Adresse ihrer Eltern-Seite */
  const ELTERN = { duellplay: "duell", duelllobby: "duell", duellende: "duell", duellannahme: "duell", duellresultat: "duell", duellsplit: "duell",
    livequiz: "live", livehost: "live", liveplay: "live", fremdtest: "", fremddone: "", testergebnis: "meinetests", resinfo: "", check: "", checkdone: "" };

  function buchSeiten(b){ try{ const D = buchDaten(b); return D && D.seiten && D.seiten.length ? D : null; }catch(e){ return null; } }

  function pfad(){
    let sc = ""; try{ sc = S.screen; }catch(e){ return null; }
    if(sc in ELTERN) sc = ELTERN[sc];
    if(!sc || sc === "home") return document.querySelector(".np-wahl") ? "/themen" : "/";
    if(EINFACH[sc]) return "/" + EINFACH[sc];
    if(sc === "x-entdecken") return "/entdecken";
    if(/^x-/.test(sc)) return "/entdecken/" + enc(sc.slice(2));
    if(["bereich", "submenu", "geschmenu", "chmenu", "berufmenu"].includes(sc)){
      const b = S.bereich && S.bereich.id;
      if(sc === "submenu" && S.menu) return "/themen/" + enc(b || "") + "/" + enc(S.menu);
      if(sc !== "bereich") return "/themen/" + enc(b || "") + "/" + ({geschmenu:"geschichte", chmenu:"schweizer-geschichte", berufmenu:"berufswahl"})[sc];
      return b ? "/themen/" + enc(b) : "/themen";
    }
    if(["mode", "quiz", "done"].includes(sc)){ const t = S.thema; return t && THEMA[t.id] ? "/thema/" + enc(t.id) : "/themen"; }
    if(sc === "libbuch") return LIB.buch ? "/bibliothek/" + enc(LIB.buch) : "/bibliothek";
    if(sc === "libkapitel"){ const D = buchSeiten(LIB.buch); const k = D && D.kap.find(x => x.id === LIB.kap);
      return k ? `/bibliothek/${enc(LIB.buch)}/kapitel/${slug(k.titel)}` : "/bibliothek/" + enc(LIB.buch || ""); }
    if(sc === "libseite"){ const D = buchSeiten(LIB.buch); const s = D && D.seiten.find(x => x.nr === LIB.seite);
      if(!s) return "/bibliothek/" + enc(LIB.buch || "");
      const sl = slug(s.titel), doppelt = D.seiten.some(x => x !== s && slug(x.titel) === sl);
      return `/bibliothek/${enc(LIB.buch)}/${sl}${doppelt ? "~" + seiteKey(s) : ""}`; }
    if(sc === "libthema") return LIB.thema ? "/bibliothek/thema/" + enc(LIB.thema) : "/bibliothek";
    if(sc === "libartikel") return LIB.art ? "/bibliothek/artikel/" + enc(LIB.art) : "/bibliothek";
    return null;   // unbekannt: Adresse bleibt wie sie ist
  }

  /* Adresse -> Seite. Gibt true zurück, wenn sie erkannt wurde; braucht die Seite Daten, die noch fehlen, gibt sie "warten" zurück. */
  function oeffnen(p, still, streng){
    const teile = p.replace(/^\/+|\/+$/g, "").split("/").map(x => { try{ return decodeURIComponent(x); }catch(e){ return x; } });
    const ganz = teile.join("/"), a = teile[0] || "";
    const zu = sc => { if(still) S.screen = sc; else go(sc); return true; };
    if(!a){ try{ window.EP_NP_START && window.EP_NP_START(); }catch(e){} return zu("home"); }
    if(ZURUECK[ganz]) return zu(ZURUECK[ganz]);
    if(a === "entdecken"){ if(!teile[1]) return zu("x-entdecken"); return zu("x-" + teile[1]); }
    if(a === "themen"){
      if(!teile[1]){ if(still){ S.screen = "home"; setTimeout(() => { try{ window.EP_NP_WAHL && window.EP_NP_WAHL(); }catch(e){} }, 0); } else { go("home"); try{ window.EP_NP_WAHL && window.EP_NP_WAHL(); }catch(e){} } return true; }
      const b = BEREICHE.find(x => x.id === teile[1]); if(!b) return zu("home"); S.bereich = b;
      if(teile[2] === "geschichte") return zu("geschmenu");
      if(teile[2] === "schweizer-geschichte") return zu("chmenu");
      if(teile[2] === "berufswahl"){ S.thema = THEMA.beruf; return zu("berufmenu"); }
      if(teile[2] && THEMA[teile[2]]){ S.menu = teile[2]; return zu("submenu"); }
      return zu("bereich");
    }
    if(a === "thema"){ const t = THEMA[teile[1]]; if(!t) return zu("home"); S.thema = t; S.bereich = t.bereich || S.bereich;
      if(t.menu === "submenu"){ S.menu = t.id; return zu("submenu"); } if(t.menu && t.menu !== "mix") return zu(t.menu); return zu("mode"); }
    if(a === "bibliothek"){
      if(!teile[1]) return zu("lib");
      if(teile[1] === "thema" && teile[2]){ LIB.thema = teile[2]; return zu("libthema"); }
      if(teile[1] === "artikel" && teile[2]){ LIB.art = teile[2]; LIB.buch = "politik"; return zu("libartikel"); }
      const B = BUECHER.find(x => x.id === teile[1]); if(!B) return zu("lib");
      LIB.buch = B.id;
      if(!teile[2]){ LIB.q = ""; LIB.tab = "inhalt"; return zu("libbuch"); }
      const D = buchSeiten(B.id); if(!D) return "warten";
      if(teile[2] === "kapitel"){ const k = D.kap.find(x => slug(x.titel) === teile[3]); if(!k) return streng ? "warten" : zu("libbuch"); LIB.kap = k.id; return zu("libkapitel"); }
      const [sl, key] = teile[2].split("~");
      const s = (key && D.seiten.find(x => seiteKey(x) === key)) || D.seiten.find(x => slug(x.titel) === sl);
      if(!s) return streng ? "warten" : zu("libbuch");
      LIB.seite = s.nr; LIB.zufall = false; return zu("libseite");
    }
    return false;
  }

  let letzter = location.pathname, still = false;
  function titel(){
    let t = ""; try{ const h = document.querySelector("#app h1"); t = h ? h.textContent.replace(/\s+/g, " ").trim() : "";
      if(S.screen === "home") t = ""; if(S.screen === "libbuch"){ const B = BUECHER.find(x => x.id === LIB.buch); if(B) t = B.titel; } }catch(e){}
    document.title = t && !/^easyplay/i.test(t) ? t.slice(0, 70) + " · easyplay" : "easyplay";
  }
  function nachfuehren(){
    const p = pfad(); if(p == null){ titel(); return; }
    if(p !== location.pathname){
      try{ if(still || letzter === null) history.replaceState(history.state, "", p + location.search + location.hash);
           else history.pushState({ep:1}, "", p + location.search); }catch(e){}
    }
    letzter = p; titel();
  }
  /* Nach jedem Zeichnen (go, render) die Adresse nachführen */
  let plan = 0; const los = () => { if(!plan) plan = requestAnimationFrame(() => { plan = 0; try{ nachfuehren(); }catch(e){} }); };
  const start = () => { const app = document.getElementById("app"); if(!app) return setTimeout(start, 200);
    new MutationObserver(los).observe(app, {childList:true}); los(); };

  /* Zurück und Vorwärts im Browser */
  addEventListener("popstate", () => {
    if(/#(qeel|[trde]|eltern|elternwoche|test|lehrer)=?/.test(location.hash)) return;
    still = true;
    try{ const r = oeffnen(location.pathname, false); if(r === "warten" || r === false) go(r === false ? "home" : "lib"); }catch(e){ try{ go("home"); }catch(x){} }
    setTimeout(() => { still = false; }, 400);
  });

  /* Beim Laden: Seite zur Adresse öffnen, bevor das letzte Skript (__epBootErstAmSchluss) zeichnet */
  const anfang = location.pathname;
  if(anfang !== "/" && anfang !== "/index.html"){
    still = true; let r = false;
    try{ r = oeffnen(anfang, true, true); }catch(e){ r = false; }
    if(r === "warten"){
      /* Bibliotheksseiten brauchen die Fragen: kurz das Buch zeigen, Ladebild wartet bis höchstens 8 s */
      const teile = anfang.split("/"); try{ LIB.buch = decodeURIComponent(teile[2]); S.screen = BUECHER.find(x => x.id === LIB.buch) ? "libbuch" : "lib"; }catch(e){ S.screen = "lib"; }
      window.__epBootWarte = new Promise(fertig => {
        let n = 0; const t = setInterval(() => { n++;
          let ok = false; try{ ok = (typeof FRAGEN_DA === "undefined" || FRAGEN_DA) && oeffnen(anfang, true, n < 80) !== "warten"; }catch(e){}
          if(ok || n >= 80){ if(!ok){ try{ oeffnen(anfang, true, false); }catch(e){} } clearInterval(t); try{ render(); }catch(e){} fertig(); setTimeout(() => { still = false; }, 300); }
        }, 100);
      });
    } else {
      if(r === false) S.screen = "home";
      setTimeout(() => { still = false; }, 1500);
    }
  }
  start();
  window.EP_ADRESSE = { pfad, oeffnen, slug };
})();
