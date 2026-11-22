(function(){
  "use strict";
  var LOGHI = {"mrpck": "ml/i_713a8ca600.webp", "shamano": "ml/i_d8714ec1e3.webp", "sicilian": "ml/i_ac92481434.webp", "spectrum": "ml/i_ecfdf73730.webp"};
  var JACK = '<svg viewBox="0 0 48 44" aria-hidden="true"><path fill="#140800" d="M12 14l8 6H9zM36 14l3 6H28zM9 26l4 3 3.5-2.5L20 29l4-2.5 4 2.5 3.5-2.5L35 29l4-3c-1.5 7-7 11-15 11S10.5 33 9 26z"/></svg>';
  var ZUCCA = '<svg viewBox="0 0 24 24" aria-hidden="true" class="gb-ic"><path d="M12 7c-5 0-8.5 2.6-8.5 6.5S7 20 12 20s8.5-2.6 8.5-6.5S17 7 12 7Z"/><path d="M12 7c-2 1.5-2.8 3.8-2.8 6.5S10 18.5 12 20"/><path d="M12 7c2 1.5 2.8 3.8 2.8 6.5S14 18.5 12 20"/><path d="M12 7c0-1.6.6-2.8 2-3.5"/></svg>';
  var EVH = { st:null, on:false, btn:null, scr:null, tick:null, poll:null, tutti:false, dt:0, vistoLink:false };
  window.EVH = EVH;
  function en(){ return window.GB_LANG === "en"; }
  function L(it, e){ return en() ? e : it; }
  function LL(o){ return (o && (en() ? (o.en || o.it) : (o.it || o.en))) || ""; }
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]; }); }
  function uid(){ try{ return (typeof S !== "undefined" && S && S.userId) ? String(S.userId) : ""; }catch(e){ return ""; } }
  function cur(){ try{ return (typeof CUR !== "undefined") ? CUR : ""; }catch(e){ return ""; } }
  function ora(){ return Math.floor(Date.now() / 1000) + EVH.dt; }
  function loc(){ return en() ? "en-GB" : "it-IT"; }
  function giorno(ts){ return new Date(ts * 1000).getDate(); }
  function sett(ts){ try{ return new Date(ts * 1000).toLocaleDateString(loc(), {weekday:"short"}).replace(".", ""); }catch(e){ return ""; } }
  function hm(ts){ try{ return new Date(ts * 1000).toLocaleTimeString(loc(), {hour:"2-digit", minute:"2-digit"}); }catch(e){ return ""; } }
  function mese(ts){ try{ return new Date(ts * 1000).toLocaleDateString(loc(), {month:"long"}); }catch(e){ return ""; } }
  function fra(sec){
    if(sec <= 0) return L("adesso", "now");
    var g = Math.floor(sec / 86400), h = Math.floor(sec % 86400 / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
    if(g > 0) return g + L("g ", "d ") + h + "h";
    if(h > 0) return h + "h " + (m < 10 ? "0" : "") + m + "m";
    return m + ":" + (s < 10 ? "0" : "") + s;
  }
  function posto(n){ return en() ? (n + (n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th")) : (n + "°"); }
  function partner(id){ var pp = (EVH.st && EVH.st.partner) || [], i; for(i = 0; i < pp.length; i++) if(pp[i].id === id) return pp[i]; return null; }
  function chiPremio(d, pos){ var pr = (d.premi || [])[pos - 1] || {}; return partner(pr.partner) || {id: "", nome: LL(pr), link: ""}; }
  function logo(id, cl){ return (id && LOGHI[id]) ? '<img' + (cl ? ' class="' + cl + '"' : "") + ' src="' + LOGHI[id] + '" alt="">' : ""; }
  function euro(n){ return en() ? "€" + n : n + " €"; }
  function nomiPartner(d){ var pp = d.partner || [], a = [], i; for(i = 0; i < pp.length; i++) a.push(pp[i].nome); return a.length > 1 ? a.slice(0, -1).join(", ") + L(" e ", " and ") + a[a.length - 1] : a.join(""); }
  EVH.apriLink = function(url){
    url = String(url || "");
    if(/^https:\/\/signal\.group\//.test(url)){
      try{ if(window.Telegram && Telegram.WebApp && Telegram.WebApp.openLink){ Telegram.WebApp.openLink(url); return; } }catch(e0){}
      try{ window.open(url, "_blank"); }catch(e1){}
      return;
    }
    if(!/^https:\/\/(t|telegram)\.me\//.test(url)) return;
    try{ if(window.Telegram && Telegram.WebApp && Telegram.WebApp.openTelegramLink){ Telegram.WebApp.openTelegramLink(url); return; } }catch(e){}
    try{ window.open(url, "_blank"); }catch(e2){}
  };
  EVH.apriPartner = function(id){
    var p = partner(id), co = (EVH.st && EVH.st.collab) || [], i;
    for(i = 0; !p && i < co.length; i++) if(co[i].id === id) p = co[i];
    if(p) EVH.apriLink(p.link);
  };
  function canaliTutti(d){ return (d.partner || []).concat(d.collab || []); }
  function canaliStato(d){
    var c = d.canali || {}, det = c.det || {}, tt = canaliTutti(d), n = 0, i;
    for(i = 0; i < tt.length; i++) if(det[tt[i].id] !== false && c.ts) n++;
    return {n: n, di: tt.length, ok: !!c.ok && !!c.ts, mai: !c.ts};
  }
  function canaliHTML(d){
    if(!d.canali_obbligo || d.finita) return "";
    var c = d.canali || {}, det = c.det || {}, tt = canaliTutti(d), cs = canaliStato(d), h = "", i, p, x;
    if(cs.ok){
      return '<div class="evh-can ok" id="evh-can"><div class="evh-can-t">✓ ' + L("Sei dentro tutti i canali", "You are in all the channels") + "<i>" + cs.di + "/" + cs.di + "</i></div>"
        + '<div class="evh-can-s" style="margin:3px 0 0">' + L("Puoi giocare i tornei e fare punti. Restaci fino ai premi: se esci, esci anche dal tabellone.", "You can play and score. Stay until the prizes: leave and you leave the board too.") + "</div></div>";
    }
    h += '<div class="evh-can' + (EVH.canPulsa ? " pulsa" : "") + '" id="evh-can"><div class="evh-can-t">' + L("Entra nei canali", "Join the channels") + "<i>" + (cs.mai ? "0" : cs.n) + "/" + cs.di + "</i></div>"
      + '<div class="evh-can-s">' + L("<b>Obbligatorio per partecipare.</b> Finché non sei in tutti non ti iscrivi alle serate, i duelli non fanno punti e non entri nel tabellone.", "<b>Required to take part.</b> Until you are in all of them you can’t sign up for the nights, duels score nothing and you are not on the board.") + "</div>";
    for(i = 0; i < tt.length; i++){
      p = tt[i]; x = c.ts ? det[p.id] : undefined;
      var sg = /^https:\/\/signal\.group\//.test(p.link || "");
      h += '<div class="evh-can-r">' + logo(p.id) + "<span>" + esc(p.nome) + "<small>" + (p.pos ? L("premio del ", "prize for ") + posto(p.pos) + L(" posto", " place") : L("in collaborazione", "in collaboration")) + (sg ? " · Signal" : "") + "</small></span>"
        + (x === true ? '<span class="evh-can-ok" style="flex:none">' + L("Sei dentro", "You’re in") + "</span>"
           : (x === null || sg) && p.link ? '<button class="evh-can-e" style="background:transparent;color:var(--ev-a);border:1px solid var(--ev-a)" onclick="EVH.canEntra(\'' + esc(p.id) + '\')">' + (sg ? L("Entra su Signal", "Join on Signal") : L("Entra", "Join")) + " ↗</button>"
           : x === null ? '<span class="evh-can-ok" style="flex:none">' + L("Sei dentro", "You’re in") + "</span>"
           : (p.link ? '<button class="evh-can-e" onclick="EVH.canEntra(\'' + esc(p.id) + '\')">' + L("Entra", "Join") + " ↗</button>" : '<span class="evh-can-s" style="margin:0">' + L("link in arrivo", "link soon") + "</span>"))
        + "</div>";
    }
    h += '<button class="evh-can-v" onclick="EVH.canVerifica()">' + (EVH.canBusy ? "…" : (cs.mai ? L("Controlla se sono dentro", "Check if I’m in") : L("Sono entrato: ricontrolla", "I joined: check again"))) + "</button>"
      + (EVH.canErr ? '<div class="evh-can-x">' + esc(EVH.canErr) + "</div>" : "") + "</div>";
    return h;
  }
  EVH.canEntra = function(id){ EVH.canAperto = true; EVH.apriPartner(id); };
  EVH.canVerifica = function(muto){
    if(EVH.canBusy || !uid()) return;
    EVH.canBusy = true; if(!muto) EVH.canErr = "";
    if(!muto) disegna();
    fetch(BACKEND + "/event/canali", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({user_id: uid()})})
      .then(function(r){ return r.json(); })
      .then(function(d){
        EVH.canBusy = false;
        if(d && d.ok && d.canali && EVH.st){
          var prima = canaliStato(EVH.st).ok;
          EVH.st.canali = d.canali;
          if(!d.canali.ok && !muto){
            var nn = [], tt = canaliTutti(EVH.st), i;
            for(i = 0; i < tt.length; i++) if(d.canali.det[tt[i].id] === false) nn.push(tt[i].nome);
            EVH.canErr = L("Non ti vedo ancora in: ", "Not in yet: ") + nn.join(", ");
          }
          if(d.canali.ok && !prima) setTimeout(chiedi, 400);
        }else if(!muto){ EVH.canErr = L("Controllo non riuscito. Riprova fra poco.", "Check failed. Try again shortly."); }
        disegna();
      })["catch"](function(){ EVH.canBusy = false; if(!muto) EVH.canErr = L("Controllo non riuscito. Riprova fra poco.", "Check failed. Try again shortly."); disegna(); });
  };
  EVH.canPrima = function(){
    EVH.canPulsa = true;
    if(cur() !== "evento"){ try{ go("evento"); }catch(e){} }
    disegna();
    var c = document.getElementById("evh-can");
    if(c && c.scrollIntoView) c.scrollIntoView({block: "center", behavior: "smooth"});
    setTimeout(function(){ EVH.canPulsa = false; }, 2200);
  };
  document.addEventListener("visibilitychange", function(){
    if(!document.hidden && EVH.canAperto && EVH.on){ EVH.canAperto = false; setTimeout(function(){ EVH.canVerifica(true); }, 700); }
  });
  (function(){
    var t0 = window.toast;
    if(typeof t0 !== "function" || t0.__evh) return;
    var t1 = function(m){ var r = t0.apply(this, arguments); try{ if(/scheda HALLOWEEN/.test(String(m)) && EVH.on) setTimeout(EVH.canPrima, 900); }catch(e){} return r; };
    t1.__evh = true;
    window.toast = t1;
  })();
  function riscattoHTML(d){
    var pp = (d.partner || []).concat(d.collab || []), a = [], i;
    if(!LL(d.riscatto) && !pp.length) return "";
    for(i = 0; i < pp.length; i++) a.push(pp[i].link ? '<a onclick="EVH.apriPartner(\'' + esc(pp[i].id) + '\')">' + esc(pp[i].nome) + "</a>" : esc(pp[i].nome));
    return '<div class="evh-risc"><b>' + L("Per riscattare un premio", "To claim a prize") + "</b> "
      + L("devi essere iscritto ai canali di ", "you must be subscribed to the channels of ")
      + (a.length > 1 ? a.slice(0, -1).join(", ") + L(" e ", " and ") + a[a.length - 1] : a.join("")) + ".</div>";
  }
  function chiedi(){
    var u = uid();
    if(!u || typeof BACKEND === "undefined") return;
    fetch(BACKEND + "/event/state?user_id=" + encodeURIComponent(u))
      .then(function(r){ return r.json(); })
      .then(function(d){
        if(!d || d.error) return;
        ricevi(d);
      })["catch"](function(){});
  }
  function ricevi(d){
    if(d.now) EVH.dt = Number(d.now) - Math.floor(Date.now() / 1000);
    var prima = EVH.st, foto = fotoRighe();
    EVH.st = d;
    if(d.active) monta(); else smonta();
    if(EVH.on && cur() === "evento"){ disegna(); muovi(prima, foto, d); }
    segnaLive();
    if(EVH.on) festaSeServe();
    if(EVH.on && cur() === "evento" && d.canali_obbligo && d.canali && !d.canali.ts && !EVH.canAuto && !d.finita){ EVH.canAuto = true; setTimeout(function(){ EVH.canVerifica(true); }, 300); }
    link();
    invitoSeServe();
  }
  EVH.ricevi = ricevi;
  function fotoRighe(){
    var o = {}, i, rr = document.querySelectorAll("#evh-body .evh-r[data-k]");
    for(i = 0; i < rr.length; i++){ var k = rr[i].getAttribute("data-k"); if(k) o[k] = rr[i].getBoundingClientRect().top; }
    return o;
  }
  function muovi(prima, foto, d){
    try{
      if(!prima || !prima.active || !prima.classifica || !d.classifica) return;
      var vecchi = {}, i, x;
      for(i = 0; i < prima.classifica.length; i++){ x = prima.classifica[i]; if(x.k) vecchi[x.k] = x; }
      var nuovi = {}, cambiato = false;
      for(i = 0; i < d.classifica.length; i++){ x = d.classifica[i]; if(x.k) nuovi[x.k] = x; if(x.k && (!vecchi[x.k] || vecchi[x.k].punti !== x.punti)) cambiato = true; }
      if(!cambiato) return;
      var rr = document.querySelectorAll("#evh-body .evh-r[data-k]");
      for(i = 0; i < rr.length; i++){
        var el = rr[i], k = el.getAttribute("data-k"), n = nuovi[k], v = vecchi[k];
        if(!n || !el.animate) continue;
        var sale = v ? (n.punti - v.punti) : n.punti, passi = v ? (v.pos - n.pos) : 0;
        if(foto[k] != null){
          var dy = foto[k] - el.getBoundingClientRect().top;
          if(Math.abs(dy) > 1){
            el.style.zIndex = sale > 0 ? 2 : 1;
            el.animate([{transform: "translateY(" + dy + "px)"}, {transform: "translateY(" + (-dy * 0.04) + "px)", offset: 0.82}, {transform: "none"}],
                       {duration: 900, easing: "cubic-bezier(.2,.8,.2,1)"});
          }
        }else if(v == null){
          el.animate([{opacity: 0, transform: "translateX(24px)"}, {opacity: 1, transform: "none"}], {duration: 500, easing: "ease-out"});
        }
        if(sale > 0){
          el.animate([{boxShadow: "inset 0 0 0 2px #39ff14, 0 0 22px rgba(57,255,20,.55)"}, {boxShadow: "inset 0 0 0 2px #39ff14, 0 0 22px rgba(57,255,20,.55)", offset: 0.7}, {boxShadow: "inset 0 0 0 0 rgba(57,255,20,0)"}], {duration: 2600});
          etichetta(el, "evh-su", "+" + sale, 3200);
          var tot = el.querySelector(".evh-r-t");
          if(tot) tot.animate([{transform: "scale(1)"}, {transform: "scale(1.5)", color: "#39ff14", offset: 0.25}, {transform: "scale(1)"}], {duration: 900, delay: 500});
        }
        if(passi !== 0) etichetta(el, "evh-fr " + (passi > 0 ? "su" : "giu"), String(Math.abs(passi)), 3200);
      }
      if(d.io && prima.io && d.io.punti > prima.io.punti) avviso(d.io.punti - prima.io.punti, d.io.pos, prima.io.pos);
    }catch(e){}
  }
  function etichetta(el, classe, testo, ms){
    var e = document.createElement("span");
    e.className = classe; e.textContent = testo; el.appendChild(e);
    var a = e.animate([{opacity: 0, transform: "scale(.3)"}, {opacity: 1, transform: "scale(1.15)", offset: 0.12}, {opacity: 1, transform: "scale(1)", offset: 0.2}, {opacity: 1, transform: "scale(1)", offset: 0.85}, {opacity: 0, transform: "scale(.8)"}],
                      {duration: ms, fill: "forwards"});
    a.onfinish = function(){ if(e.parentNode) e.parentNode.removeChild(e); };
  }
  function avviso(punti, pos, posPrima){
    var s = document.getElementById("evento");
    if(!s || !s.animate) return;
    var e = document.createElement("div");
    e.className = "evh-avviso";
    e.innerHTML = "<b>+" + punti + "</b><span>" + (pos < posPrima ? L("Sei salito al ", "You climbed to ") + posto(pos) + L(" posto", " place") : L("Punti in classifica: resti ", "Points on the board: still ") + posto(pos)) + "</span>";
    s.appendChild(e);
    var a = e.animate([{opacity: 0, transform: "translateY(-30px)"}, {opacity: 1, transform: "none", offset: 0.1}, {opacity: 1, transform: "none", offset: 0.88}, {opacity: 0, transform: "translateY(-16px)"}], {duration: 3800, fill: "forwards"});
    a.onfinish = function(){ if(e.parentNode) e.parentNode.removeChild(e); };
  }
  function monta(){
    if(EVH.on) return;
    var nav = document.querySelector(".bnav"), app = document.getElementById("app");
    if(!nav || !app) return;
    var b = document.createElement("button");
    b.className = "bnav-btn evh-nav";
    b.setAttribute("onclick", "go('evento')");
    b.innerHTML = '<span class="ic">' + ZUCCA + "</span>Halloween";
    nav.appendChild(b);
    var s = document.createElement("div");
    s.id = "evento"; s.className = "screen";
    s.innerHTML = '<div class="game-hdr"><div class="game-title">' + ZUCCA + '<span id="evh-tit"></span></div></div>'
      + '<div class="game-content" id="evh-body"></div>';
    app.appendChild(s);
    EVH.btn = b; EVH.scr = s; EVH.on = true;
    document.body.classList.add("evh-6");
  }
  function smonta(){
    if(!EVH.on) return;
    if(cur() === "evento"){ try{ go("home"); }catch(e){} }
    if(EVH.btn && EVH.btn.parentNode) EVH.btn.parentNode.removeChild(EVH.btn);
    if(EVH.scr && EVH.scr.parentNode) EVH.scr.parentNode.removeChild(EVH.scr);
    EVH.invChiudi();
    EVH.btn = EVH.scr = null; EVH.on = false;
    document.body.classList.remove("evh-6");
    ferma();
  }
  function segnaLive(){
    if(!EVH.btn || !EVH.st) return;
    var v = false, i, ss = EVH.st.serate || [];
    for(i = 0; i < ss.length; i++) if(ss[i].stato === "live") v = true;
    EVH.btn.classList.toggle("live", v);
  }
  function link(){
    if(EVH.vistoLink || !EVH.on) return;
    EVH.vistoLink = true;
    try{
      var sp = (window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe && Telegram.WebApp.initDataUnsafe.start_param) || "";
      sp = String(sp).replace(/^r\d{4,15}-/, "");
      if(/^evento/.test(sp) || /[?&]screen=evento(?:&|$)/.test(location.search)) go("evento");
    }catch(e){}
  }
  function iscrHTML(d){
    if(d.evento_iscritto == null || !d.promemoria || d.finita || d.chiusa) return "";
    var n = d.iscritti_evento || 0, err = EVH.iscErr ? '<div class="evh-isc-e">' + esc(EVH.iscErr) + "</div>" : "";
    if(!d.evento_iscritto){
      return '<div class="evh-isc"><div class="evh-isc-t">' + L("Iscriviti all’evento", "Join the event") + "</div>"
        + '<div class="evh-isc-s">' + L("È gratis. Il bot ti scrive in privato quando aprono le iscrizioni e un’ora prima di ogni serata: non te ne perdi una.", "It’s free. The bot messages you in private when sign-ups open and one hour before every night: you won’t miss one.") + "</div>"
        + '<button class="evh-btn" onclick="EVH.iscriviti(true)">' + (EVH.iscBusy ? "…" : L("Iscrivimi", "Sign me up")) + "</button>" + err
        + (n >= 5 ? '<div class="evh-isc-n">' + n + L(" già iscritti", " already in") + "</div>" : "") + "</div>";
    }
    if(d.evento_promemoria){
      return '<div class="evh-isc ok"><div class="evh-isc-v">✓</div><div class="evh-isc-tx"><b>' + L("Sei iscritto all’evento", "You joined the event") + "</b><span>"
        + L("Promemoria in privato attivi", "Private reminders on") + (n >= 5 ? " · " + n + L(" iscritti", " players in") : "") + "</span>" + err + "</div>"
        + '<button class="evh-isc-x" onclick="EVH.iscriviti(false)">' + L("Disattiva promemoria", "Reminders off") + "</button></div>";
    }
    return '<div class="evh-isc ok off"><div class="evh-isc-v">✓</div><div class="evh-isc-tx"><b>' + L("Sei iscritto all’evento", "You joined the event") + "</b><span>"
      + L("Promemoria in privato spenti", "Private reminders off") + "</span>" + err + "</div>"
      + '<button class="evh-isc-x" onclick="EVH.iscriviti(true)">' + L("Riattiva", "Turn on") + "</button></div>";
  }
  function iscrRidisegna(){
    if(cur() === "evento") disegna();
    var c = document.getElementById("evh-inv-e");
    if(c) c.textContent = EVH.iscErr || "";
  }
  EVH.iscriviti = function(on){
    if(EVH.iscBusy) return;
    EVH.iscBusy = true; EVH.iscErr = "";
    var partito = false;
    function vai(){
      if(partito) return;
      partito = true;
      fetch(BACKEND + "/event/join", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({user_id: uid(), on: !!on, lang: en() ? "en" : "it"})})
        .then(function(r){ return r.json(); })
        .then(function(d){
          EVH.iscBusy = false;
          if(d && d.ok){
            if(EVH.st){
              if(on) EVH.st.evento_iscritto = true;
              EVH.st.evento_promemoria = !!d.iscritto;
              if(d.nuovo) EVH.st.iscritti_evento = (EVH.st.iscritti_evento || 0) + 1;
            }
            var eraInvito = !!EVH.inv;
            EVH.invChiudi();
            if(eraInvito && on){ try{ go("evento"); }catch(e){} }
            else iscrRidisegna();
            if(on && d.nuovo) iscrFatto();
          }else{
            EVH.iscErr = L("Non riuscito. Riprova fra poco.", "It did not go through. Try again shortly.");
            iscrRidisegna();
          }
        })["catch"](function(){ EVH.iscBusy = false; EVH.iscErr = L("Non riuscito. Riprova fra poco.", "It did not go through. Try again shortly."); iscrRidisegna(); });
    }
    if(on){
      try{
        var w = window.Telegram && Telegram.WebApp, u = w && w.initDataUnsafe && w.initDataUnsafe.user;
        if(u && u.allows_write_to_pm === false && typeof w.requestWriteAccess === "function"){
          setTimeout(vai, 6000);
          w.requestWriteAccess(function(){ vai(); });
          return;
        }
      }catch(e){}
    }
    vai();
  };
  function iscrFatto(){
    var s = document.getElementById("evento");
    if(!s || !s.animate) return;
    var e = document.createElement("div");
    e.className = "evh-avviso";
    e.innerHTML = "<b>✓</b><span>" + L("Sei dentro. Ti ho scritto in privato: da lì arrivano i promemoria.", "You’re in. I just messaged you in private: reminders will arrive there.") + "</span>";
    s.appendChild(e);
    var a = e.animate([{opacity: 0, transform: "translateY(-30px)"}, {opacity: 1, transform: "none", offset: 0.1}, {opacity: 1, transform: "none", offset: 0.9}, {opacity: 0, transform: "translateY(-16px)"}], {duration: 4600, fill: "forwards"});
    a.onfinish = function(){ if(e.parentNode) e.parentNode.removeChild(e); };
  }
  function invApri(){
    var d = EVH.st;
    if(!d || EVH.inv) return;
    var ss = d.serate || [], nome = LL(d.nome), parti = nome.split(" "), ult = parti.pop();
    var t0 = ss.length ? ss[0].ts : d.da, t1 = ss.length ? ss[ss.length - 1].ts : d.a;
    var e = document.createElement("div");
    e.className = "evh-inv";
    e.setAttribute("onclick", "EVH.invChiudi()");
    e.innerHTML = '<div class="evh-inv-f" onclick="event.stopPropagation()">'
      + '<div class="evh-inv-l">' + JACK + "</div>"
      + '<div class="evh-inv-k">' + L("Gambler Bot presenta", "Gambler Bot presents") + "</div>"
      + '<div class="evh-inv-t">' + esc(parti.join(" ")) + " <b>" + esc(ult) + "</b></div>"
      + '<span class="evh-inv-d">' + giorno(t0) + "–" + giorno(t1) + " " + esc(mese(t1)) + " · " + ss.length + L(" tornei gratis", " free tournaments") + "</span>"
      + '<div class="evh-inv-s">' + L("In palio i premi di <b>", "Prizes by <b>") + esc(nomiPartner(d)) + "</b>" + L(", oppure soldi sul saldo.", ", or cash on your balance.") + "</div>"
      + '<button class="evh-btn" onclick="EVH.iscriviti(true)">' + L("Iscrivimi all’evento", "Sign me up") + "<small>" + L("gratis · il bot ti avvisa in privato prima di ogni serata", "free · the bot reminds you in private before every night") + "</small></button>"
      + '<button class="evh-btn gh" onclick="EVH.invChiudi();go(\'evento\')">' + L("Guarda l’evento", "See the event") + "</button>"
      + '<div class="evh-inv-e" id="evh-inv-e"></div>'
      + '<button class="evh-inv-no" onclick="EVH.invChiudi()">' + L("Non ora", "Not now") + "</button></div>";
    document.body.appendChild(e);
    EVH.inv = e;
    if(e.animate){
      e.animate([{opacity: 0}, {opacity: 1}], {duration: 200});
      e.firstChild.animate([{transform: "translateY(70%)"}, {transform: "none"}], {duration: 380, easing: "cubic-bezier(.2,.8,.2,1)"});
    }
  }
  EVH.invApri = invApri;
  EVH.invChiudi = function(){ if(EVH.inv && EVH.inv.parentNode) EVH.inv.parentNode.removeChild(EVH.inv); EVH.inv = null; };
  function invitoSeServe(){
    var d = EVH.st;
    if(EVH.invVisto || !EVH.on || !d || !d.active || d.evento_iscritto !== false || !d.promemoria || d.finita || d.chiusa) return;
    if(cur() !== "home") return;
    var sp = "";
    try{ sp = String((window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe && Telegram.WebApp.initDataUnsafe.start_param) || "").replace(/^r\d{4,15}-/, ""); }catch(e){}
    if(sp && sp !== "g" && !/^ref_/.test(sp)) return;
    var k = "evh_inv_" + (d.id || ""), n = 0;
    try{ n = Number(localStorage.getItem(k) || 0) || 0; }catch(e1){}
    EVH.invVisto = true;
    if(n >= 2) return;
    try{ localStorage.setItem(k, String(n + 1)); }catch(e2){}
    setTimeout(function(){ if(cur() === "home" && !EVH.inv && EVH.st && EVH.st.evento_iscritto === false) invApri(); }, 1400);
  }
  var _go = window.go;
  window.go = function(id){
    if(id === "evento" && !EVH.on) id = "home";
    _go(id);
    if(id === "evento"){
      if(EVH.btn) EVH.btn.classList.add("on");
      document.body.classList.add("gb-nav-on");
      disegna(); chiedi(); avvia();
    }else ferma();
  };
  function avvia(){
    ferma();
    EVH.tick = setInterval(function(){ if(cur() !== "evento"){ ferma(); return; } conto(); }, 1000);
    EVH.poll = setInterval(function(){ if(cur() !== "evento"){ ferma(); return; } if(!document.hidden) chiedi(); }, 8000);
  }
  function ferma(){
    if(EVH.tick){ clearInterval(EVH.tick); EVH.tick = null; }
    if(EVH.poll){ clearInterval(EVH.poll); EVH.poll = null; }
  }
  function prossima(d){
    var ss = d.serate || [], i;
    for(i = 0; i < ss.length; i++) if(ss[i].stato === "live") return ss[i];
    for(i = 0; i < ss.length; i++) if(ss[i].stato !== "fatta" && ss[i].stato !== "annullata") return ss[i];
    return null;
  }
  function conto(){
    var el = document.getElementById("evh-conto"), d = EVH.st;
    if(!el || !d) return;
    var p = prossima(d);
    if(!p || p.stato === "live") return;
    el.textContent = fra(p.ts - ora());
  }
  function apri(tid){
    tid = String(tid || "").replace(/[^A-Za-z0-9_-]/g, "");
    try{ if(tid && typeof TRN !== "undefined"){ TRN.want = tid; TRN.wantN = 0; } }catch(e){}
    go("torneo");
  }
  EVH.apri = apri;
  EVH.tuttiSi = function(){ EVH.tutti = true; disegna(); };
  function disegna(){
    var el = document.getElementById("evh-body"), d = EVH.st, tit = document.getElementById("evh-tit");
    if(tit) tit.textContent = "HALLOWEEN";
    if(!el) return;
    try{ var fo = document.activeElement; if(fo && fo.tagName === "INPUT" && fo.closest && fo.closest(".evh-adm")) return; }catch(e){}
    if(!d || !d.active){ el.innerHTML = '<div class="evh-vuoto">' + L("Caricamento…", "Loading…") + "</div>"; return; }
    var ss = d.serate || [], h = "", i, s, nome = LL(d.nome);
    var t0 = ss.length ? ss[0].ts : d.da, t1 = ss.length ? ss[ss.length - 1].ts : d.a;
    var parti = nome.split(" "), ult = parti.pop();
    h += '<div class="evh-hero">'
      + '<svg class="evh-ragno" viewBox="0 0 92 92" aria-hidden="true"><path d="M92 0 0 0M92 0 20 30M92 0 46 54M92 0 68 74M92 0 92 92M70 0q-2 8-8 11.5q9-1 14 4 6 5 6 12.5q4-5 10-5M44 0q-3 14-13 20.5q14-1 23 9 9 9 10 21.5q7-9 28-11M18 0q-3 20-17 30M30 30q20 2 32 14t14 32"/></svg>'
      + '<svg class="evh-pip" style="right:74px;top:14px;width:40px;--r:-12deg" viewBox="0 0 100 50" aria-hidden="true"><path d="M50 14c2-4 3-7 3-10 2 2 4 5 4 8 10-8 25-9 43-3-12 2-16 9-16 18-5-5-10-6-15-2-3-6-9-6-12 2 0 6-3 10-7 14-4-4-7-8-7-14-3-8-9-8-12-2-5-4-10-3-15 2 0-9-4-16-16-18 18-6 33-5 43 3 0-3 2-6 4-8 0 3 1 6 3 10z"/></svg>'
      + '<svg class="evh-pip" style="right:22px;top:66px;width:26px;--r:10deg;animation-delay:-2s" viewBox="0 0 100 50" aria-hidden="true"><path d="M50 14c2-4 3-7 3-10 2 2 4 5 4 8 10-8 25-9 43-3-12 2-16 9-16 18-5-5-10-6-15-2-3-6-9-6-12 2 0 6-3 10-7 14-4-4-7-8-7-14-3-8-9-8-12-2-5-4-10-3-15 2 0-9-4-16-16-18 18-6 33-5 43 3 0-3 2-6 4-8 0 3 1 6 3 10z"/></svg>'
      + '<svg class="evh-pip" style="left:8px;top:8px;width:24px;--r:-8deg;animation-delay:-3.3s" viewBox="0 0 100 50" aria-hidden="true"><path d="M50 14c2-4 3-7 3-10 2 2 4 5 4 8 10-8 25-9 43-3-12 2-16 9-16 18-5-5-10-6-15-2-3-6-9-6-12 2 0 6-3 10-7 14-4-4-7-8-7-14-3-8-9-8-12-2-5-4-10-3-15 2 0-9-4-16-16-18 18-6 33-5 43 3 0-3 2-6 4-8 0 3 1 6 3 10z"/></svg>'
      + '<svg class="evh-jack" viewBox="0 0 48 44" aria-hidden="true"><path fill="#ff7a1a" d="M24 9c-.6-3.2.8-5.6 3.8-6.8l1 2.4c-1.6.8-2.2 2-2 4 9.2 1 15.2 6 15.2 13.4 0 8.6-7.4 14.6-18 14.6S6 30.6 6 22c0-7.4 6-12.4 15.2-13.4z"/><path fill="#140800" d="M14 17l6 5h-8zM34 17l2 5h-8zM13 27l4 2 3-2 4 2 4-2 3 2 4-2c-1 5-5 8-11 8s-10-3-11-8z"/></svg>'
      + '<div class="evh-luna">' + JACK + "</div><div>"
      + '<div class="evh-k">' + L("Gambler Bot presenta", "Gambler Bot presents") + "</div>"
      + '<div class="evh-t">' + esc(parti.join(" ")) + " <b>" + esc(ult) + "</b></div>"
      + '<span class="evh-d">' + L("Torneo di Halloween", "Halloween tournament") + " · " + giorno(t0) + "–" + giorno(t1) + " " + esc(mese(t1)) + "</span>"
      + "</div></div>";
    h += '<div class="evh-riga">' + ss.length + L(" sere · ", " nights · ") + ss.length + L(" giochi · 1 classifica · ingresso gratuito", " games · 1 leaderboard · free entry") + "</div>";
    var co = d.collab || [];
    for(i = 0; i < co.length; i++)
      h += '<div class="evh-col"' + (co[i].link ? ' onclick="EVH.apriPartner(\'' + esc(co[i].id) + '\')"' : "") + ">" + logo(co[i].id) + "<span>" + L("In collaborazione con", "In collaboration with") + "<b>" + esc(co[i].nome) + "</b></span>" + (co[i].link ? "<i>↗</i>" : "") + "</div>";
    h += iscrHTML(d);
    h += canaliHTML(d);
    h += premioHTML(d);
    var p = prossima(d);
    if(d.finita){
      var primo = (d.classifica || [])[0];
      h += '<div class="evh-ora"><div class="evh-ora-tx"><div class="evh-ora-k">' + L("Evento concluso · vince", "Event over · the winner is") + "</div>"
        + '<div class="evh-ora-v">' + esc(primo ? primo.nome : "—") + "</div></div>"
        + '<div class="evh-ora-n">' + (primo ? primo.punti + L(" pt", " pts") : "") + "</div></div>";
    }else if(p && p.stato === "live"){
      h += '<div class="evh-ora live"><div class="evh-ora-tx"><div class="evh-ora-k">' + L("In corso adesso", "Live now") + "</div>"
        + '<div class="evh-ora-v">' + esc(LL(p.nome)) + "</div></div>"
        + (p.tid ? '<button class="evh-btn" onclick="EVH.apri(\'' + esc(p.tid) + '\')">' + L("Apri", "Open") + "</button>" : "") + "</div>";
    }else if(p){
      h += '<div class="evh-ora"><div class="evh-ora-tx"><div class="evh-ora-k">' + L("Prossima serata", "Next night") + "</div>"
        + '<div class="evh-ora-v">' + esc(LL(p.nome)) + "</div></div>"
        + '<div class="evh-ora-n" id="evh-conto">' + fra(p.ts - ora()) + "</div></div>";
    }
    if(d.io){
      h += '<div class="evh-io"><div class="evh-io-p">' + posto(d.io.pos) + "</div><div>"
        + '<div class="evh-io-t">' + d.io.punti + L(" punti", " points") + " · " + esc(d.io.nome) + "</div>"
        + '<div class="evh-io-s">' + (d.finita ? L("Classifica finale.", "Final standings.") : L("La tua posizione adesso. Ogni serata la può cambiare.", "Your position right now. Every night can change it.")) + "</div></div></div>";
    }else if(!d.finita){
      h += '<div class="evh-io"><div class="evh-io-p">—</div><div>'
        + '<div class="evh-io-t">' + L("Non sei ancora in classifica", "You are not on the board yet") + "</div>"
        + '<div class="evh-io-s">' + (d.canali_obbligo && !canaliStato(d).ok ? L("Prima entra in tutti i canali qui sopra: senza non entri nel tabellone.", "First join all the channels above: without them you are not on the board.") : L("Iscriviti a una serata e presentati: già esserci vale un punto.", "Sign up for a night and show up: just being there is worth a point.")) + "</div></div></div>";
    }
    h += '<div class="evh-h">' + L("Le serate", "The nights") + "<span>" + L("orari del tuo telefono", "your phone local time") + "</span></div><div class=\"evh-ser\">";
    for(i = 0; i < ss.length; i++){
      s = ss[i];
      var io = d.iscritto && d.iscritto[s.game], sotto = "", tasto = "";
      if(s.stato === "fatta"){
        sotto = '<span class="evh-chip">' + L("Conclusa", "Finished") + "</span>" + (s.vincitore ? L("vince ", "won by ") + "<b>" + esc(s.vincitore) + "</b>" : "");
      }else if(s.stato === "live"){
        sotto = '<span class="evh-chip live">Live</span>' + s.iscritti + L(" iscritti", " players");
        tasto = s.tid ? '<button class="evh-btn" onclick="EVH.apri(\'' + esc(s.tid) + '\')">' + L("Apri", "Open") + "</button>" : "";
      }else if(s.stato === "iscrizioni"){
        sotto = (io ? '<span class="evh-chip ok">' + L("Sei iscritto", "You are in") + "</span>" : "") + hm(s.ts) + " · " + s.iscritti + L(" iscritti", " players");
        tasto = s.tid ? '<button class="evh-btn' + (io ? " gh" : "") + '" onclick="' + (!io && d.canali_obbligo && !canaliStato(d).ok ? "EVH.canPrima()" : "EVH.apri(\'" + esc(s.tid) + "\')") + '">' + (io ? L("Vedi", "View") : L("Iscriviti", "Sign up")) + "</button>" : "";
      }else{
        sotto = hm(s.ts) + " · " + L("iscrizioni presto aperte", "sign-ups open soon");
      }
      var gg = String(s.game || "").replace(/[^a-z0-9_]/gi, ""), art = arte(gg);
      h += '<div class="evh-s2 ' + esc(s.stato) + '"><div class="evh-s2-art" onclick="EVH.regole(\'' + gg + '\')"' + (art ? ' style="background-image:' + esc(art) + '"' : "") + ">"
        + '<span class="evh-s2-d"><b>' + giorno(s.ts) + "</b><i>" + esc(sett(s.ts)) + '</i></span><span class="evh-s2-n">' + esc(LL(s.nome)) + "</span></div>"
        + '<div class="evh-s2-b"><div class="evh-s-s">' + sotto + '</div><div class="evh-s2-t">' + tasto
        + '<button class="evh-btn reg" onclick="EVH.regole(\'' + gg + '\')">' + L("Come si gioca", "How to play") + "</button></div></div></div>";
    }
    h += "</div>";
    var du = d.duelli, md = d.miei_duelli || {g:0, s:0};
    if(du){
      var apre = ora() < du.da, chiusi = ora() > du.a;
      var eur = (du.s_min % 100 === 0) ? String(du.s_min / 100) : (du.s_min / 100).toFixed(2).replace(".", ",");
      h += '<div class="evh-h">' + L("Duelli", "Duels") + "<span>" + (apre ? L("dal ", "from ") + giorno(du.da) + " " + esc(mese(du.da)) : (chiusi ? L("chiusi", "closed") : L("aperti fino al ", "open until the ") + giorno(du.a))) + "</span></div>"
        + '<div class="evh-du">'
        + '<div class="evh-du-r"><div class="evh-du-n">+' + du.s_punti + "<small>" + L("punti", "points") + '</small></div><div class="evh-du-t"><b>' + L("Duello vinto a soldi", "Money duel won") + "</b><span>" + L("posta da ", "stake from ") + (en() ? "€" + eur : eur + " €") + L(" in su", " up") + '</span><div class="evh-du-b"><i style="width:' + Math.min(100, Math.round(100 * md.s / Math.max(1, du.s_tetto))) + '%"></i></div></div><div class="evh-du-q">' + md.s + " / " + du.s_tetto + "</div></div>"
        + '<div class="evh-du-r"><div class="evh-du-n">+' + du.g_punti + "<small>" + L(du.g_punti === 1 ? "punto" : "punti", du.g_punti === 1 ? "point" : "points") + '</small></div><div class="evh-du-t"><b>' + L("Duello vinto gratis", "Free duel won") + "</b><span>" + L("qualsiasi gioco dei duelli", "any game in the duels") + '</span><div class="evh-du-b"><i style="width:' + Math.min(100, Math.round(100 * md.g / Math.max(1, du.g_tetto))) + '%"></i></div></div><div class="evh-du-q">' + md.g + " / " + du.g_tetto + "</div></div>"
        + '<div class="evh-du-nota">' + L("Vale solo la partita giocata fino in fondo da tutti e due: se l avversario esce o lascia scadere il tempo, niente punti. Dallo stesso avversario al massimo ", "Only a match both players actually play to the end counts: if your opponent leaves or lets the clock run out, no points. From the same opponent at most ").replace("l avversario", "l\u2019avversario") + du.s_avv + L(" punti a soldi e ", " money points and ") + du.g_avv + L(" gratis.", " free ones.") + "</div>"
        + (chiusi ? "" : '<button class="evh-btn gh" onclick="go(\'duel\')">' + L("Vai ai duelli", "Go to duels") + "</button>")
        + "</div>";
    }
    var cl = d.classifica || [], mostra = EVH.tutti ? cl : cl.slice(0, 10), r, q, k;
    var lg = "", pp = d.partner || [];
    for(i = 0; i < pp.length; i++) lg += logo(pp[i].id);
    h += '<div class="evh-cl"><div class="evh-cl-t">' + (lg ? '<span class="evh-cl-lg">' + lg + "</span>" : "") + "<div><b>" + L("Classifica di Halloween", "Halloween leaderboard") + "</b><span>"
      + '<i class="evh-vivo"></i>' + L("dal vivo", "live") + (d.giocatori ? " · " + d.giocatori + L(" giocatori", " players") : "") + "</span></div></div>";
    if(!cl.length){
      h += '<div class="evh-vuoto">' + (du ? L("La classifica nasce col primo duello vinto o alla fine della prima serata.", "The leaderboard starts with the first duel won or when the first night ends.") : L("La classifica nasce alla fine della prima serata.", "The leaderboard starts when the first night ends.")) + "</div>";
    }else{
      if(du) h += '<div class="evh-leg">' + L("serate 1–" + ss.length + " · duelli · totale", "nights 1–" + ss.length + " · duels · total") + "</div>";
      for(i = 0; i < mostra.length; i++){
        r = mostra[i]; q = "";
        for(k = 0; k < (r.serate || []).length; k++) q += "<i" + (r.serate[k] != null ? ' class="c"' : "") + ">" + (r.serate[k] != null ? r.serate[k] : "·") + "</i>";
        if(du) q += '<i class="d">' + (r.duelli ? r.duelli : "·") + "</i>";
        h += '<div class="evh-r' + (r.pos <= 3 ? " p" + r.pos : "") + (d.io && d.io.pos === r.pos ? " io" : "") + '" data-k="' + esc(r.k || "") + '"><div class="evh-r-p">' + r.pos + "</div>"
          + '<div class="evh-r-n">' + esc(r.nome) + '</div><div class="evh-r-q">' + q + '</div><div class="evh-r-t">' + r.punti + "</div></div>";
      }
      if(!EVH.tutti && cl.length > mostra.length) h += '<button class="evh-piu" onclick="EVH.tuttiSi()">' + L("Mostra tutti", "Show all") + " (" + cl.length + ")</button>";
    }
    h += "</div>";
    var pr = d.premi || [];
    h += '<div class="evh-h">' + L("In palio", "Prizes") + '</div><div class="evh-pr">';
    for(i = 0; i < pr.length; i++){
      var pa = partner(pr[i].partner);
      h += '<div class="evh-p' + (i === 0 ? " p1" : "") + '">' + (pa ? logo(pa.id) : '<div class="evh-p-n">' + posto(i + 1) + "</div>")
        + '<div class="evh-p-tx">' + (pa ? '<div class="evh-p-n2">' + posto(i + 1) + L(" posto", " place") + "</div>" : "") + '<div class="evh-p-t">' + esc(LL(pr[i])) + "</div>"
        + (pr[i].nota ? '<div class="evh-p-s">' + esc(LL(pr[i].nota)) + "</div>" : "") + "</div>"
        + (pa && pa.link ? '<button class="evh-p-k" onclick="EVH.apriPartner(\'' + esc(pa.id) + '\')">' + L("Canale", "Channel") + " ↗</button>" : "") + "</div>";
    }
    h += "</div>" + riscattoHTML(d);
    var pt = d.punti || [];
    h += '<div class="evh-h">' + L("Come funziona", "How it works") + '</div><ul class="evh-reg">'
      + (d.promemoria ? "<li>" + L("<b>Iscriviti all’evento</b> qui in alto: il bot ti scrive in privato quando aprono le iscrizioni e un’ora prima di ogni serata. Poi ogni serata ha la sua iscrizione, che apre due giorni prima.", "<b>Join the event</b> at the top: the bot messages you in private when sign-ups open and one hour before every night. Each night then has its own sign-up, which opens two days before.") + "</li>" : "")
      + "<li>" + L("Un torneo a sera, <b>gratis</b>. Ti iscrivi qui sopra e ti presenti al via: chi non conferma la presenza resta fuori.", "One tournament per night, <b>free</b>. Sign up above and show up at the start: no check-in, no game.") + "</li>"
      + "<li>" + L("Punti per serata: <b>", "Points per night: <b>") + (pt[0] || 0) + "</b>" + L(" a chi vince, <b>", " to the winner, <b>") + (pt[1] || 0) + "</b>" + L(" a chi perde la finale, <b>", " for losing the final, <b>") + (pt[2] || 0) + "</b>" + L(" a chi esce in semifinale, <b>", " for going out in the semifinal, <b>") + (d.presenza || 0) + "</b>" + L(" a chiunque si presenta.", " to anyone who shows up.") + "</li>"
      + "<li>" + L("Puoi giocarne anche una sola, ma i punti si sommano: più serate, più strada.", "You can play just one, but points add up: more nights, more chances.") + "</li>"
      + (du ? "<li>" + L("In più, dal ", "On top of that, from the ") + giorno(du.da) + L(" al ", " to the ") + giorno(du.a) + L(" contano i <b>duelli</b>: <b>", " <b>duels</b> count too: <b>") + du.s_punti + "</b>" + L(" punti per ogni duello vinto a soldi (fino a ", " points per money duel won (up to ") + du.s_tetto + L("), <b>", "), <b>") + du.g_punti + "</b>" + L(" per ogni duello vinto gratis (fino a ", " per free duel won (up to ") + du.g_tetto + L("). Solo partite giocate davvero fino alla fine.", "). Only matches really played to the end.") + "</li>" : "")
      + "<li>" + L("Dopo l ultima serata i <b>primi tre</b> della classifica vincono i premi dei partner: ognuno sceglie il premio della pagina oppure gli euro sul saldo del bot. A pari punti passa chi ha vinto più serate, poi chi è andato meglio nell ultima.", "After the last night the <b>top three</b> on the board take the partners’ prizes: each one picks the page’s prize or the cash on their bot balance. On equal points, more nights won comes first, then the better result on the last night.").replace("l ultima", "l’ultima").replace("nell ultima", "nell’ultima") + "</li>"
      + (LL(d.riscatto) ? "<li><b>" + esc(LL(d.riscatto)) + "</b></li>" : "")
      + "</ul>";
    if(d.admin) h += adminHTML(d);
    el.innerHTML = h;
    festaAggiorna();
  }
  EVH.disegna = disegna;
  var ARTE = {}, CARD = {kaiju: "tw-mega kj-mega", lastcall: "tw-mega lc-mega", scalata: "tw-mega scl-mega", turf: "tw-mega gcr-mega", glad: "tw-mega gl-mega", race: "tw-mega rc-mega"};
  function arte(g){
    if(g in ARTE) return ARTE[g];
    var v = "";
    try{
      var e = document.createElement("div"), casa = document.getElementById("duel") || document.body;
      e.className = CARD[g] || ("pvp-tile pt-" + g);
      e.style.display = "none";
      casa.appendChild(e);
      v = String(getComputedStyle(e).getPropertyValue("--gb-art") || "").replace(/^\s+|\s+$/g, "");
      casa.removeChild(e);
      if(!/^url\(/.test(v)) v = "";
    }catch(err){ v = ""; }
    ARTE[g] = v;
    return v;
  }
  EVH.regole = function(g){
    var sc = document.getElementById("evento"), d = EVH.st;
    if(!sc || !d) return;
    EVH.regoleChiudi();
    var nome = g, i, ss = d.serate || [], righe = [], h = "", art = arte(g), n = 0;
    for(i = 0; i < ss.length; i++) if(ss[i].game === g) nome = LL(ss[i].nome);
    try{ righe = (typeof RTD_G !== "undefined" && RTD_G[g] && RTD_G[g].rules) || []; }catch(e){ righe = []; }
    h += '<div class="evh-reg-f" onclick="event.stopPropagation()">' + (art ? '<div class="evh-reg-art" style="background-image:' + esc(art) + '"></div>' : "")
      + '<div class="evh-reg-k">' + L("Come si gioca", "How to play") + '</div><div class="evh-reg-t">' + esc(nome) + "</div>";
    for(i = 0; i < righe.length; i++){
      if(/come si gioca|premio|buy-?in/i.test(String(righe[i][1]))) continue;
      n++;
      h += '<div class="evh-reg-r"><i>' + n + "</i><div><b>" + esc(righe[i][1]) + "</b><span>" + esc(righe[i][2]) + "</span></div></div>";
    }
    if(!n) h += '<div class="evh-reg-r"><div><span>' + L("Le regole complete sono nella pagina del gioco.", "The full rules are on the game page.") + "</span></div></div>";
    h += '<button class="evh-btn" onclick="EVH.prova(\'' + g + '\')">' + L("Apri il gioco", "Open the game") + "<small>" + L("regole complete e allenamento coi bot", "full rules and practice against bots") + "</small></button>"
      + '<button class="evh-btn gh" onclick="EVH.regoleChiudi()">' + L("Chiudi", "Close") + "</button></div>";
    var v = document.createElement("div");
    v.className = "evh-reg-v";
    v.setAttribute("onclick", "EVH.regoleChiudi()");
    v.innerHTML = h;
    sc.appendChild(v);
    EVH.regoleEl = v;
    if(v.animate){
      v.animate([{opacity: 0}, {opacity: 1}], {duration: 180});
      v.firstChild.animate([{transform: "translateY(60%)"}, {transform: "none"}], {duration: 320, easing: "cubic-bezier(.2,.8,.2,1)"});
    }
  };
  EVH.regoleChiudi = function(){ if(EVH.regoleEl && EVH.regoleEl.parentNode) EVH.regoleEl.parentNode.removeChild(EVH.regoleEl); EVH.regoleEl = null; };
  EVH.prova = function(g){ EVH.regoleChiudi(); try{ window.RTD_GAME = g; go("arc"); }catch(e){} };
  var FPIP = "M50 14c2-4 3-7 3-10 2 2 4 5 4 8 10-8 25-9 43-3-12 2-16 9-16 18-5-5-10-6-15-2-3-6-9-6-12 2 0 6-3 10-7 14-4-4-7-8-7-14-3-8-9-8-12-2-5-4-10-3-15 2 0-9-4-16-16-18 18-6 33-5 43 3 0-3 2-6 4-8 0 3 1 6 3 10z";
  var FZUC = "M12 5.2c-.3-1.6.4-2.8 1.9-3.4l.5 1.2c-.8.4-1.1 1-1 2 4.6.5 7.6 3 7.6 6.7 0 4.3-3.7 7.3-9 7.3s-9-3-9-7.3c0-3.700 3-6.200 7.600-6.700z".replace("3.700", "3.7").replace("6.200", "6.2").replace("7.600-6.700", "7.6-6.7");
  function coriandoli(){
    var h = "", i, semi = [13, 71, 29, 53, 7, 89, 37, 61, 19, 83, 43, 97, 3, 67, 31, 79, 11, 59, 41, 23, 73, 47];
    for(i = 0; i < semi.length; i++){
      var x = (semi[i] * 37) % 100, dur = 4.5 + (semi[i] % 7) * 0.7, rit = -((semi[i] * 13) % 60) / 10, w = 14 + (semi[i] % 4) * 6, giro = (i % 2 ? -1 : 1) * (200 + semi[i] * 3);
      var forma = i % 3 === 0 ? '<svg viewBox="0 0 100 50"><path fill="#0a0410" stroke="#ff7a1a" stroke-width="2" d="' + FPIP + '"/></svg>'
        : (i % 3 === 1 ? '<svg viewBox="0 0 24 22"><path fill="#ff7a1a" d="' + FZUC + '"/></svg>' : '<svg viewBox="0 0 10 10"><rect x="2" y="1" width="6" height="8" rx="1" fill="' + (i % 2 ? "#3ce6ff" : "#ffd76b") + '"/></svg>');
      h += '<span class="evh-f-c" style="left:' + x + "%;width:" + (i % 3 === 0 ? w + 14 : (i % 3 === 1 ? w : w - 6)) + "px;animation-duration:" + dur + "s;animation-delay:" + rit + "s;--g:" + giro + "deg;--d:" + dur + "s;--r:" + rit + 's">' + forma + "</span>";
    }
    return h;
  }
  function sceltaTesto(d, pr){
    var pa = chiPremio(d, pr.pos), eu = ((d.premi || [])[pr.pos - 1] || {}).euro;
    if(pr.scelta === "partner")
      return L("Hai scelto il <b>premio di ", "You chose the <b>") + esc(pa.nome) + L("</b>. Ti scriviamo noi in privato per consegnartelo: resta iscritto ai canali dell’evento.", " prize</b>. We will message you in private to deliver it: stay subscribed to the event channels.");
    if(pr.scelta === "saldo")
      return L("Hai scelto <b>", "You chose <b>") + euro(eu) + L(" sul saldo</b>: arrivano dopo il controllo dei canali.", " on your balance</b>: it arrives after the channel check.");
    return "";
  }
  function sceltaTasti(d, pr, festa){
    var pa = chiPremio(d, pr.pos), eu = ((d.premi || [])[pr.pos - 1] || {}).euro, h = "";
    if(EVH.conf){
      return '<div class="' + (festa ? "evh-f-s" : "evh-vinto-s") + '" style="margin-top:0">' + L("Confermi <b>", "Confirm <b>") + euro(eu) + L(" sul saldo</b> al posto del premio di ", " on your balance</b> instead of the prize by ") + esc(pa.nome) + L("? La scelta non si cambia.", "? The choice is final.") + "</div>"
        + '<button class="evh-btn" onclick="EVH.scegli(\'saldo\')">' + L("Sì, ", "Yes, ") + euro(eu) + L(" sul saldo", " on my balance") + "</button>"
        + '<button class="evh-btn gh" onclick="EVH.confNo()">' + L("Indietro", "Back") + "</button>";
    }
    h += '<div class="' + (festa ? "evh-f-s" : "evh-vinto-s") + '" style="margin-top:0">' + L("Scegli il tuo premio", "Choose your prize") + "</div>"
      + '<button class="evh-btn" onclick="EVH.scegli(\'partner\')">' + L("Premio di ", "Prize by ") + esc(pa.nome) + "<small>" + L("te lo consegniamo noi · serve l’iscrizione ai canali", "we deliver it · channel subscription required") + "</small></button>"
      + '<button class="evh-btn gh" onclick="EVH.confSi()">' + euro(eu) + L(" sul saldo", " on my balance") + "<small>" + L("al posto del premio, accreditati sul saldo del bot", "instead of the prize, credited to your bot balance") + "</small></button>";
    return h;
  }
  function festaDentro(d){
    var pr = d.premio || {}, pa = chiPremio(d, pr.pos), h = "";
    h += '<div class="evh-f-luna">' + JACK + "</div>"
      + '<div class="evh-f-k">' + esc(LL(d.nome)) + " · " + L("classifica finale", "final standings") + "</div>"
      + '<div class="evh-f-t">' + (pr.pos === 1 ? L("Hai vinto!", "You won!") : (posto(pr.pos) + L(" posto!", " place!"))) + "</div>"
      + '<div class="evh-f-s">' + (d.io ? L("Hai chiuso con <b>", "You finished on <b>") + d.io.punti + L(" punti</b>", " points</b>") + (pr.pos === 1 ? L(", davanti a tutti.", ", ahead of everyone.") : ".") : "") + "</div>"
      + '<div class="evh-f-b">' + logo(pa.id, "evh-f-pl");
    if(pr.scelta){
      h += '<div class="evh-f-s" style="margin-top:0">' + sceltaTesto(d, pr) + "</div>"
        + (pr.scelta === "partner" && pa.link ? '<button class="evh-btn" onclick="EVH.apriPartner(\'' + esc(pa.id) + '\')">' + L("Apri il canale di ", "Open the channel of ") + esc(pa.nome) + "</button>" : "")
        + '<button class="evh-f-dopo" onclick="EVH.festaChiudi()">' + L("Chiudi", "Close") + "</button>";
    }else{
      h += sceltaTasti(d, pr, true) + '<button class="evh-f-dopo" onclick="EVH.festaChiudi()">' + L("Decido dopo", "I will decide later") + "</button>";
    }
    if(EVH.errPremio) h += '<div class="evh-f-e">' + esc(EVH.errPremio) + "</div>";
    return h + "</div>";
  }
  function festaApri(){
    var s = document.getElementById("evento"), d = EVH.st;
    if(!s || !d || !d.premio || !d.chiusa || EVH.festa) return;
    var e = document.createElement("div");
    e.className = "evh-festa";
    e.innerHTML = '<div class="evh-f-raggi"></div>' + coriandoli() + '<div id="evh-f-dentro" style="display:contents">' + festaDentro(d) + "</div>";
    s.appendChild(e);
    EVH.festa = e;
  }
  function festaAggiorna(){
    var c = document.getElementById("evh-f-dentro");
    if(!EVH.festa || !c || !EVH.st) return;
    EVH.festa.classList.add("gia");
    c.innerHTML = festaDentro(EVH.st);
  }
  EVH.festaApri = festaApri;
  EVH.festaChiudi = function(){ if(EVH.festa && EVH.festa.parentNode) EVH.festa.parentNode.removeChild(EVH.festa); EVH.festa = null; EVH.conf = false; };
  function festaSeServe(){
    var d = EVH.st;
    if(!d || !d.active || !d.chiusa || !d.premio || EVH.festaVista) return;
    var chiave = "evh_festa_" + (d.id || "") + "_" + d.premio.pos, vista = false;
    try{ vista = localStorage.getItem(chiave) === "1"; }catch(e){}
    if(d.premio.scelta) return;
    if(cur() === "home"){ try{ go("evento"); }catch(e2){} }
    if(cur() !== "evento") return;
    EVH.festaVista = true;
    try{ localStorage.setItem(chiave, "1"); }catch(e3){}
    festaApri();
  }
  function premioHTML(d){
    var pr = d.premio;
    if(!pr || !d.chiusa) return "";
    var pa = chiPremio(d, pr.pos);
    var h = '<div class="evh-vinto">' + logo(pa.id, "evh-f-pl") + '<div class="evh-vinto-k">' + L("Evento concluso · ", "Event over · ") + posto(pr.pos) + L(" classificato", " place") + '</div><div class="evh-vinto-t">'
      + (pr.pos === 1 ? L("Hai vinto ", "You won ") + esc(LL(d.nome)) : L("Sei sul podio", "You made the podium")) + "</div>";
    if(pr.scelta){
      h += '<div class="evh-vinto-s">' + sceltaTesto(d, pr) + "</div>"
        + (pr.scelta === "partner" && pa.link ? '<button class="evh-btn" onclick="EVH.apriPartner(\'' + esc(pa.id) + '\')">' + L("Apri il canale di ", "Open the channel of ") + esc(pa.nome) + "</button>" : "");
    }else{
      h += '<button class="evh-btn gh" onclick="EVH.festaApri()">' + L("Rivedi la festa", "Replay the celebration") + "</button>" + sceltaTasti(d, pr, false);
    }
    if(EVH.errPremio) h += '<div class="evh-vinto-e">' + esc(EVH.errPremio) + "</div>";
    return h + "</div>";
  }
  EVH.confSi = function(){ EVH.conf = true; EVH.errPremio = ""; disegna(); };
  EVH.confNo = function(){ EVH.conf = false; disegna(); };
  EVH.scegli = function(scelta){
    if(EVH.premioBusy) return;
    EVH.premioBusy = true; EVH.errPremio = "";
    fetch(BACKEND + "/event/prize", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({user_id: uid(), scelta: scelta})})
      .then(function(r){ return r.json(); })
      .then(function(d){
        EVH.premioBusy = false; EVH.conf = false;
        if(d && d.canali){ EVH.errPremio = L("Prima rientra in tutti i canali dei partner, poi scegli.", "First join all the partner channels again, then choose."); EVH.festaChiudi(); EVH.canPrima(); return; }
        if(d && d.ok){
          if(EVH.st && EVH.st.premio) EVH.st.premio.scelta = d.scelta;
          disegna();
          if(d.scelta === "partner" && EVH.st && EVH.st.premio){ var pa = chiPremio(EVH.st, EVH.st.premio.pos); if(pa.link) EVH.apriLink(pa.link); }
        }else{
          EVH.errPremio = L("Non riuscito. Riprova fra poco.", "It did not go through. Try again shortly.");
          disegna();
        }
      })["catch"](function(){ EVH.premioBusy = false; EVH.errPremio = L("Non riuscito. Riprova fra poco.", "It did not go through. Try again shortly."); disegna(); });
  };
  function adminHTML(d){
    var tutti = (d.partner || []).concat(d.collab || []), h = "", i, p;
    h += '<div class="evh-adm"><div class="evh-adm-t">' + L("Admin · link dei partner", "Admin · partner links") + "</div>"
      + '<div class="evh-adm-s">' + L("Lo vedi solo tu. Metti il link del canale o del gruppo di ogni pagina (https://t.me/… oppure @nome; va bene anche un gruppo Signal, che però non si può controllare). Vuoto = nessun link.", "Only you see this. Put the channel or group link of each page (https://t.me/… or @name; a Signal group works too, but cannot be checked). Empty = no link.") + "</div>"
      + '<div class="evh-adm-s">' + L("Per controllare chi è dentro, <b>@Master_Gambler_bot deve essere amministratore del canale</b> (nel gruppo basta che ci sia). Dopo il salvataggio vedi accanto a ogni nome se il controllo funziona. Un canale che il bot non può controllare non blocca nessuno.", "To check who is in, <b>@Master_Gambler_bot must be an admin of the channel</b> (in a group it just has to be there). After saving you see next to each name whether the check works. A channel the bot cannot check blocks nobody.") + "</div>";
    for(i = 0; i < tutti.length; i++){
      p = tutti[i];
      h += "<label>" + (p.pos ? posto(p.pos) + " · " : L("Collaborazione · ", "Collaboration · ")) + esc(p.nome)
        + (EVH.admProva && p.id in EVH.admProva ? (EVH.admProva[p.id] === null ? '<span class="pv no">' + L("il bot NON può controllare", "bot CANNOT check") + "</span>" : '<span class="pv si">' + L("controllo attivo", "check on") + "</span>") : "")
        + '<input id="evh-adm-' + esc(p.id) + '" data-pid="' + esc(p.id) + '" type="url" inputmode="url" autocomplete="off" spellcheck="false" placeholder="https://t.me/... o https://signal.group/..." value="' + esc(EVH.admBozza && EVH.admBozza[p.id] != null ? EVH.admBozza[p.id] : p.link) + '" oninput="EVH.admScrivi(this)">'
        + '<input data-chat="' + esc(p.id) + '" type="text" autocomplete="off" spellcheck="false" placeholder="' + L("chat da controllare: -100… o @nome (solo se il link è privato)", "chat to check: -100… or @name (only for private links)") + '" value="' + esc(EVH.admBozzaC && EVH.admBozzaC[p.id] != null ? EVH.admBozzaC[p.id] : ((d.admin_chat || {})[p.id] || "")) + '" oninput="EVH.admScriviC(this)"></label>';
    }
    h += '<button class="evh-btn" onclick="EVH.admSalva()">' + (EVH.admBusy ? "…" : L("Salva i link", "Save links")) + "</button>"
      + (EVH.admMsg ? '<div class="evh-adm-e' + (EVH.admOk ? " ok" : "") + '">' + esc(EVH.admMsg) + "</div>" : "") + "</div>";
    return h;
  }
  EVH.admScrivi = function(el){ EVH.admBozza = EVH.admBozza || {}; EVH.admBozza[el.getAttribute("data-pid")] = el.value; EVH.admMsg = ""; };
  EVH.admScriviC = function(el){ EVH.admBozzaC = EVH.admBozzaC || {}; EVH.admBozzaC[el.getAttribute("data-chat")] = el.value; EVH.admMsg = ""; };
  EVH.admSalva = function(){
    if(EVH.admBusy) return;
    var link = {}, ii = document.querySelectorAll("#evh-body .evh-adm input[data-pid]"), i;
    for(i = 0; i < ii.length; i++) link[ii[i].getAttribute("data-pid")] = ii[i].value;
    var chat = {}, cc = document.querySelectorAll("#evh-body .evh-adm input[data-chat]");
    for(i = 0; i < cc.length; i++) chat[cc[i].getAttribute("data-chat")] = cc[i].value;
    EVH.admBusy = true; EVH.admMsg = "";
    fetch(BACKEND + "/event/admin", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({user_id: uid(), link: link, chat: chat})})
      .then(function(r){ return r.json(); })
      .then(function(d){
        EVH.admBusy = false;
        if(d && d.ok){
          EVH.admOk = true; EVH.admMsg = L("Salvati. I giocatori li vedono subito.", "Saved. Players see them right away."); EVH.admBozza = null; EVH.admBozzaC = null;
          EVH.admProva = d.prova || null;
          if(EVH.st){ EVH.st.admin_chat = d.chat || EVH.st.admin_chat; EVH.st.canali = null; }
          var tt = ((EVH.st && EVH.st.partner) || []).concat((EVH.st && EVH.st.collab) || []), j;
          for(j = 0; j < tt.length; j++) if(d.link && d.link[tt[j].id] != null) tt[j].link = d.link[tt[j].id];
        }else{ EVH.admOk = false; EVH.admMsg = (d && d.error) || L("Non salvati.", "Not saved."); }
        disegna();
      })["catch"](function(){ EVH.admBusy = false; EVH.admOk = false; EVH.admMsg = L("Non salvati: rete. Riprova.", "Not saved: network. Try again."); disegna(); });
  };
  var prove = 0;
  (function primo(){
    if(uid()){ chiedi(); return; }
    if(++prove < 40) setTimeout(primo, 500);
  })();
  setInterval(function(){ if(!document.hidden && cur() !== "evento") chiedi(); }, 300000);
  document.addEventListener("visibilitychange", function(){ if(!document.hidden) chiedi(); });
})();
