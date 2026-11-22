(function(){
  "use strict";
  var TC = {ok: {}, st: null, v: null, tid: "", busy: false, err: "", aperto: false};
  window.TCAN = TC;
  function en(){ return window.GB_LANG === "en"; }
  function L(it, e){ return en() ? e : it; }
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]; }); }
  function uid(){ try{ return (typeof S !== "undefined" && S && S.userId) ? String(S.userId) : ""; }catch(e){ return ""; } }
  function base(){ try{ return typeof BACKEND !== "undefined" ? BACKEND : ""; }catch(e){ return ""; } }
  function iniz(n){ var p = String(n || "?").replace(/[^A-Za-z0-9À-ÿ ]/g, " ").trim().split(/\s+/); return ((p[0] || "?")[0] + ((p[1] || "")[0] || "")).toUpperCase(); }
  function foto(c, cls){
    if(c && c.foto) return '<img' + (cls ? ' class="' + cls + '"' : "") + ' src="' + esc(base() + "/tournament/canale_foto/" + encodeURIComponent(c.id) + ".jpg?v=" + c.foto) + '" alt="" onerror="this.outerHTML=\'<b>' + esc(iniz(c.nome)) + '</b>\'">';
    return cls ? '<div class="tcan-ph">' + esc(iniz(c && c.nome)) + "</div>" : "<b>" + esc(iniz(c && c.nome)) + "</b>";
  }
  function torneo(tid){
    try{
      var st = TRN.state || {}, up = st.upcoming || [], i;
      for(i = 0; i < up.length; i++) if(String(up[i].id) === String(tid)) return up[i];
      if(!tid || String(st.id) === String(tid)) return st;
    }catch(e){}
    return null;
  }
  function apri(url){
    url = String(url || "");
    if(window.EVH && EVH.apriLink){ EVH.apriLink(url); return; }
    try{
      if(/^https:\/\/signal\.group\//.test(url) && Telegram.WebApp.openLink){ Telegram.WebApp.openLink(url); return; }
      if(/^https:\/\/(t|telegram)\.me\//.test(url) && Telegram.WebApp.openTelegramLink){ Telegram.WebApp.openTelegramLink(url); return; }
    }catch(e){}
    try{ window.open(url, "_blank"); }catch(e2){}
  }
  if(typeof window.utUpCard === "function" && !window.utUpCard.__tcan){
    var _card = window.utUpCard;
    window.utUpCard = function(t){
      var h = _card.apply(this, arguments);
      try{
        var cc = (t && t.canali) || [];
        if(cc.length){
          var av = "", i;
          for(i = 0; i < cc.length; i++) av += foto(cc[i]);
          var riga = '<div class="tcan-cip"><span class="tcan-av">' + av + "</span>📢 " + L("Obbligatorio entrare in ", "Required: join ") + cc.length + L(cc.length === 1 ? " canale" : " canali", cc.length === 1 ? " channel" : " channels") + "</div>";
          var k = h.lastIndexOf('<div class="ut-more">');
          h = k >= 0 ? h.slice(0, k) + riga + h.slice(k) : h + riga;
        }
      }catch(e){}
      return h;
    };
    window.utUpCard.__tcan = true;
  }
  if(typeof window.utPremiHTML === "function" && !window.utPremiHTML.__tcan){
    var _pr = window.utPremiHTML;
    window.utPremiHTML = function(t, cur){
      var h = _pr.apply(this, arguments);
      try{
        var cc = (t && t.canali) || [], i, x = "";
        if(cc.length){
          for(i = 0; i < cc.length; i++)
            x += '<div class="tcan-r">' + foto(cc[i], "x") + "<span>" + esc(cc[i].nome) + "<small>" + (/^https:\/\/signal\.group\//.test(cc[i].link || "") ? "Signal" : "Telegram") + "</small></span>"
              + (cc[i].link ? '<button class="tcan-e gh" onclick="event.stopPropagation();TCAN.entraDa(\'' + esc(String(t.id || "")) + '\',' + i + ')">' + L("Entra", "Join") + " ↗</button>" : "") + "</div>";
          h += '<div class="tcan-cip" style="display:block;margin-top:12px;padding:10px 12px"><div style="font-size:13px;margin-bottom:4px">📢 ' + L("Canali obbligatori", "Required channels") + '</div><div style="font-weight:600;color:#9fb3c8;font-size:12px;margin-bottom:4px">'
            + L("Per iscriverti devi essere dentro tutti: il bot controlla.", "To sign up you must be in all of them: the bot checks.") + "</div>" + x + "</div>";
        }
      }catch(e){}
      return h;
    };
    window.utPremiHTML.__tcan = true;
  }
  TC.entraDa = function(tid, i){ var t = torneo(tid) || {}, cc = t.canali || []; if(cc[i]){ TC.aperto = false; apri(cc[i].link); } };
  function disegna(){
    if(!TC.v) return;
    var t = torneo(TC.tid) || {}, cc = (TC.st && TC.st.canali) || t.canali || [], det = (TC.st && TC.st.esito && TC.st.esito.det) || {}, h = "", i, c, x, tutti = !!(TC.st && TC.st.esito && TC.st.esito.ok);
    h += '<div class="tcan-f" onclick="event.stopPropagation()"><div class="tcan-t">📢 ' + L("Prima entra nei canali", "Join the channels first") + "</div>"
      + '<div class="tcan-s">' + L("Per iscriverti a <b>", "To sign up for <b>") + esc(t.name || L("questo torneo", "this tournament")) + "</b>" + L(" devi essere dentro tutti questi canali. Tocca «Entra», torna qui e controlliamo.", " you must be in all of these channels. Tap «Join», come back and we check.") + "</div>";
    for(i = 0; i < cc.length; i++){
      c = cc[i]; x = det[c.id];
      var sg = /^https:\/\/signal\.group\//.test(c.link || "");
      h += '<div class="tcan-r">' + foto(c, "x") + "<span>" + esc(c.nome) + "<small>" + (sg ? "Signal" : (c.verifica === false ? L("non controllato", "not checked") : "Telegram")) + "</small></span>"
        + (x === true ? '<span class="tcan-ok">' + L("Sei dentro", "You’re in") + "</span>"
           : (c.link ? '<button class="tcan-e' + (x === null || c.verifica === false ? " gh" : "") + '" onclick="TCAN.entra(' + i + ')">' + (sg ? L("Entra su Signal", "Join on Signal") : L("Entra", "Join")) + " ↗</button>" : ""))
        + "</div>";
    }
    h += '<button class="tcan-go" ' + (TC.busy ? "disabled" : "") + ' onclick="TCAN.controlla(true)">' + (TC.busy ? "…" : (tutti ? L("Iscrivimi", "Sign me up") : L("Sono dentro: controlla e iscrivimi", "I joined: check and sign me up"))) + "</button>"
      + (TC.err ? '<div class="tcan-x">' + esc(TC.err) + "</div>" : "")
      + '<button class="tcan-no" onclick="TCAN.chiudi()">' + L("Chiudi", "Close") + "</button></div>";
    TC.v.innerHTML = h;
  }
  TC.apri = function(tid){
    TC.tid = String(tid || ""); TC.err = ""; TC.st = null;
    if(!TC.v){
      TC.v = document.createElement("div");
      TC.v.className = "tcan-v";
      TC.v.setAttribute("onclick", "TCAN.chiudi()");
      document.body.appendChild(TC.v);
    }
    disegna();
    TC.controlla(false);
  };
  TC.chiudi = function(){ if(TC.v && TC.v.parentNode) TC.v.parentNode.removeChild(TC.v); TC.v = null; };
  TC.entra = function(i){
    var t = torneo(TC.tid) || {}, cc = (TC.st && TC.st.canali) || t.canali || [];
    if(!cc[i]) return;
    TC.aperto = true;
    apri(cc[i].link);
  };
  TC.controlla = function(iscrivi){
    if(TC.busy || !uid()) return;
    TC.busy = true; disegna();
    fetch(base() + "/tournament/canali", {method: "POST", headers: (typeof dlBjHdr === "function" ? dlBjHdr() : {"Content-Type": "application/json"}), body: JSON.stringify({user_id: uid(), tid: TC.tid})})
      .then(function(r){ return r.json(); })
      .then(function(d){
        TC.busy = false;
        if(d && d.ok){
          TC.st = d;
          if(d.esito && d.esito.ok){
            TC.ok[TC.tid] = Date.now();
            if(iscrivi){ TC.chiudi(); try{ trnRegister(TC.tid || undefined); }catch(e){} return; }
            TC.err = "";
          }else if(iscrivi){
            var nn = [], cc = d.canali || [], i;
            for(i = 0; i < cc.length; i++) if(d.esito && d.esito.det && d.esito.det[cc[i].id] === false) nn.push(cc[i].nome);
            TC.err = L("Non ti vedo ancora in: ", "Not in yet: ") + nn.join(", ");
          }
        }else{ TC.err = L("Controllo non riuscito. Riprova fra poco.", "Check failed. Try again shortly."); }
        disegna();
      })["catch"](function(){ TC.busy = false; TC.err = L("Controllo non riuscito. Riprova fra poco.", "Check failed. Try again shortly."); disegna(); });
  };
  document.addEventListener("visibilitychange", function(){
    if(!document.hidden && TC.aperto && TC.v){ TC.aperto = false; setTimeout(function(){ TC.controlla(false); }, 700); }
  });
  if(typeof window.trnRegister === "function" && !window.trnRegister.__tcan){
    var _reg = window.trnRegister;
    window.trnRegister = function(tid){
      try{
        var t = torneo(tid), cc = (t && t.canali) || [];
        if(cc.length && !(TC.ok[String(tid || "")] && Date.now() - TC.ok[String(tid || "")] < 600000)){ TC.apri(tid); return; }
      }catch(e){}
      return _reg.apply(this, arguments);
    };
    window.trnRegister.__tcan = true;
  }
  if(typeof window.trnGC === "function" && !window.trnGC.geoWatch){
    var _gc = window.trnGC;
    window.trnGC = function(g){
      var r = _gc.apply(this, arguments);
      if(g === "geo" && r && r.watch === false){ var o = {}, k; for(k in r) o[k] = r[k]; o.watch = true; return o; }
      return r;
    };
    for(var _k in _gc) if(Object.prototype.hasOwnProperty.call(_gc, _k)) window.trnGC[_k] = _gc[_k];
    window.trnGC.geoWatch = 1;
  }
  (function(){
    var t0 = window.toast;
    if(typeof t0 !== "function" || t0.__tcan) return;
    var t1 = function(m){ var r = t0.apply(this, arguments); try{ if(/canali del torneo/.test(String(m))){ delete TC.ok[TC.tid]; setTimeout(function(){ TC.apri(TC.tid); }, 600); } }catch(e){} return r; };
    t1.__tcan = true; t1.__evh = t0.__evh;
    window.toast = t1;
  })();
})();
