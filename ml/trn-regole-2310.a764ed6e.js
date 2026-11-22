(function(){
  var sp = "";
  try{ sp = String((window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe && Telegram.WebApp.initDataUnsafe.start_param) || ""); }catch(e){}
  sp = sp.replace(/^r\d{4,15}-/, "");
  var m = /^regole[_-](?:gioca[_-])?([a-z0-9]{2,12})$/.exec(sp) || /[?&]screen=regole[_-](?:gioca[_-])?([a-z0-9]{2,12})(?:&|$)/.exec(location.search || "");
  if(!m) return;
  var G = m[1], fatto = false, inghiottito = false;
  window.GB_REGOLE = G;
  if(!window.GB_DEEP) window.GB_DEEP = {modo: "regole", gioco: G};
  var DUELLO = {rr: "rr", bjl: "bj", pkd: "cards", rps: "rps", bs: "bs", ch: "chess"};
  var PANNELLO = {
    kaiju: function(){ kjrtSchermo("guida"); }, lastcall: function(){ lctOpen(); },
    lupus: function(){ lupTutOpen(); }, scalata: function(){ sclTutOpen(); },
    glad: function(){ gltOpen(); }, cucu: function(){ cucuTutOpen(); },
    uomonero: function(){ unrTutOpen(); }, burraco: function(){ burTutOpen(); },
    turf: function(){ gcrtOpen(); }, geo: function(){ geoGuida(true); }
  };
  function visibile(el){ return !!(el && el.offsetParent !== null && el.getClientRects().length); }
  function cerca(sel){
    var l = document.querySelectorAll(sel), i;
    for(i = 0; i < l.length; i++) if(visibile(l[i])) return l[i];
    return null;
  }
  function menuPronto(){
    return !!(cerca('[data-g="' + G + '"] .mg-feat') || cerca(".mg-feat") || cerca(".tw-rules") || cerca("#geo-sc") || (window.GSRT && GSRT.aperto));
  }
  function lampo(){
    var el = cerca(".mg-feat") || cerca(".tw-rules");
    if(!el) return false;
    try{ el.scrollIntoView({behavior: "smooth", block: "center"}); }catch(e){ try{ el.scrollIntoView(); }catch(e2){} }
    el.classList.remove("trn-reg-lampo"); void el.offsetWidth; el.classList.add("trn-reg-lampo");
    setTimeout(function(){ el.classList.remove("trn-reg-lampo"); }, 2600);
    return true;
  }
  function apriGioco(){
    if(DUELLO[G]){ go("duel"); return true; }
    if(typeof GB_DEEP_RTD !== "undefined" && GB_DEEP_RTD[G] && typeof RTD_G !== "undefined" && RTD_G[G]){ window.RTD_GAME = G; go("arc"); return true; }
    if(typeof GB_DEEP_SCR !== "undefined" && GB_DEEP_SCR[G]){ go(GB_DEEP_SCR[G]); return true; }
    return false;
  }
  function regole(){
    if(DUELLO[G]){
      if(typeof dlPickGame === "function" && window.S && S.userId){ dlPickGame(DUELLO[G]); return true; }
      return false;
    }
    if(!menuPronto()) return false;
    if(PANNELLO[G]){ try{ PANNELLO[G](); return true; }catch(e){ try{ console.warn("[regole] pannello", G, e); }catch(_w){} } }
    if(typeof MG_GIOCHI !== "undefined" && MG_GIOCHI[G] && MG_GIOCHI[G].regole && typeof mgRegole === "function"){ mgRegole(G); return true; }
    lampo();
    return true;
  }
  function via(){
    if(fatto) return;
    fatto = true;
    var n = 0;
    try{ if(!apriGioco()) return; }catch(e){ try{ console.warn("[regole] apri", G, e); }catch(_w){} return; }
    (function prova(){
      var ok = false;
      try{ ok = regole(); }catch(e){ ok = true; try{ console.warn("[regole]", G, e); }catch(_w){} }
      if(!ok && ++n < 30) setTimeout(prova, 300);
    })();
  }
  var orig = window.gbDeepGo;
  if(typeof orig === "function"){
    window.gbDeepGo = function(D){
      var d = window.GB_DEEP;
      if(D == null && !inghiottito && d && d.gioco === G){ inghiottito = true; via(); return true; }
      return orig.apply(this, arguments);
    };
  }
  function dopo(){ setTimeout(via, 700); }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", dopo);
  else dopo();
})();
