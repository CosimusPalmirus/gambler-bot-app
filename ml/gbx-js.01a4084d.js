(function(){
  'use strict';
  if (window.GBX) return;
  var GBX = window.GBX = {};
  GBX.L = function(it, en){ return (window.GB_LANG === 'en') ? en : it; };
  GBX.lite = function(){
    try { if (window.CASA && CASA.lento) return CASA.lento(); } catch(e){}
    return document.documentElement.classList.contains('gb-lite');
  };
  var HT = null;
  function hapOn(){ try { if (typeof HAP !== 'undefined' && HAP && HAP.on === false) return false; } catch(e){} return true; }
  function H(){ if (HT) return HT; try { HT = window.Telegram && Telegram.WebApp && Telegram.WebApp.HapticFeedback || null; } catch(e){} return HT; }
  var lastSel = 0;
  GBX.hap = function(t){
    if (!hapOn()) return; var h = H(); if (!h) return;
    try {
      if (t === 'sel') { var n = Date.now(); if (n - lastSel < 35) return; lastSel = n; h.selectionChanged(); }
      else if (t === 'success' || t === 'warning' || t === 'error') h.notificationOccurred(t);
      else h.impactOccurred(t || 'light');
    } catch(e){}
  };
  var A = { c:null, out:null, nb:null };
  function muto(){
    try { if (typeof TWS !== 'undefined' && TWS && TWS.on === false) return true; } catch(e){}
    return false;
  }
  function ac(){
    if (A.c) { try { if (A.c.state === 'suspended') A.c.resume(); } catch(e){} return A.c; }
    try {
      var dest;
      if (typeof TWS !== 'undefined' && TWS) { if (!TWS.ctx && TWS.init) TWS.init(); if (TWS.ctx) { A.c = TWS.ctx; dest = TWS.mg || TWS.ctx.destination; } }
      if (!A.c) { var C = window.AudioContext || window.webkitAudioContext; if (!C) return null; A.c = new C(); dest = A.c.destination; }
      A.out = A.c.createGain(); A.out.gain.value = .85; A.out.connect(dest);
      A.nb = A.c.createBuffer(1, A.c.sampleRate, A.c.sampleRate);
      var d = A.nb.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random()*2-1;
      if (A.c.state === 'suspended') A.c.resume();
    } catch(e){ A.c = null; }
    return A.c;
  }
  function tone(f, dur, o){ o = o || {}; var c = A.c, t = c.currentTime + (o.at || 0);
    var os = c.createOscillator(), g = c.createGain(); os.type = o.type || 'sine'; os.frequency.setValueAtTime(f, t);
    if (o.to) os.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(o.g || .12, t + (o.atk || .004)); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    os.connect(g); g.connect(A.out); os.start(t); os.stop(t + dur + .02); }
  function noise(dur, o){ o = o || {}; var c = A.c, t = c.currentTime + (o.at || 0);
    var s = c.createBufferSource(); s.buffer = A.nb; var f = c.createBiquadFilter(); f.type = o.ft || 'bandpass'; f.frequency.setValueAtTime(o.f || 2000, t); f.Q.value = o.q || 1;
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    var g = c.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(o.g || .2, t + (o.atk || .003)); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(A.out); s.start(t, Math.random()*.5); s.stop(t + dur + .02); }
  var UI = {
    tap:    function(){ noise(.022,{f:3400,q:2.5,g:.16}); tone(1700,.035,{to:900,g:.04}); },
    soft:   function(){ tone(740,.07,{g:.05}); tone(1110,.09,{g:.035,at:.035}); },
    open:   function(){ noise(.18,{f:600,to:2600,q:.8,g:.06,atk:.04}); tone(520,.16,{to:780,g:.03,atk:.03}); },
    back:   function(){ noise(.16,{f:2400,to:700,q:.8,g:.055,atk:.03}); },
    tick:   function(){ noise(.012,{f:6000,q:4,g:.1}); },
    toggle: function(){ tone(880,.05,{g:.05,type:'triangle'}); tone(1320,.06,{g:.04,type:'triangle',at:.04}); },
    err:    function(){ tone(150,.09,{type:'square',g:.04}); tone(120,.1,{type:'square',g:.04,at:.1}); },
    cash:   function(){ [1318.5,1760,2637].forEach(function(f,i){ tone(f,.35,{g:.06,at:i*.05}); }); noise(.3,{ft:'highpass',f:7000,g:.03,at:.08,atk:.06}); },
    swipe:  function(){ noise(.1,{f:1800,to:3600,q:1,g:.05}); }
  };
  GBX.sfx = function(n, arg){
    if (muto()) return;
    if (UI[n]) { if (!ac() || !A.out) return; try { UI[n](arg); } catch(e){} return; }
    try { if (window.CASA && CASA.sfx) CASA.sfx(n, arg); } catch(e){}
  };
  var MAPPA = {
    tap:'sel', soft:'sel', tick:'sel', toggle:'light', open:'light', back:'light', swipe:'sel', err:'error', cash:'success',
    click:'sel', hover:null, deal:'soft', flip:'light', shuffle:'light', chip:'light', chips:'medium', coin:'light',
    win:'success', bigwin:'success', blackjack:'success', lose:'error', push:'warning', whoosh:'light', pop:'light',
    scratch:null, bounce:'soft', lock:'medium', unlock:'medium', alarm:'warning', boom:'heavy', click_gun:'rigid',
    bang:'heavy', spin:'light', heart:'soft'
  };
  GBX.fx = function(n, arg){ GBX.sfx(n, arg); var h = MAPPA[n]; if (h) GBX.hap(h); };
  GBX.MAPPA = MAPPA; GBX.UI = UI;
  var TL = { x:0, y:0, tx:0, ty:0, last:0, src:'', els:[], raf:0, tgOn:false };
  function aim(x, y, src){ TL.tx = Math.max(-1, Math.min(1, x)); TL.ty = Math.max(-1, Math.min(1, y)); TL.last = performance.now(); TL.src = src; }
  function tgDO(){ try { return window.Telegram && Telegram.WebApp && Telegram.WebApp.DeviceOrientation; } catch(e){ return null; } }
  function sensori(on){
    var DO = tgDO();
    if (DO && DO.start) {
      try {
        if (on && !TL.tgOn) { DO.start({ refresh_rate: 40 }); TL.tgOn = true; }
        else if (!on && TL.tgOn) { DO.stop(); TL.tgOn = false; }
      } catch(e){}
    }
  }
  try { if (window.Telegram && Telegram.WebApp && Telegram.WebApp.onEvent)
    Telegram.WebApp.onEvent('deviceOrientationChanged', function(){ var DO = tgDO(); if (DO) aim((DO.gamma || 0) / .5, ((DO.beta || 0) - .8) / .5, 'tg'); }); } catch(e){}
  addEventListener('deviceorientation', function(e){ if (e.gamma == null || TL.src === 'tg') return; aim(e.gamma / 28, (e.beta - 45) / 28, 'gyro'); });
  function dito(e){
    if (TL.src === 'tg' || (TL.src === 'gyro' && performance.now() - TL.last < 1500)) return;
    var r = this.getBoundingClientRect(); if (!r.width) return;
    aim((e.clientX - r.left) / r.width * 2 - 1, (e.clientY - r.top) / r.height * 2 - 1, 'dito');
  }
  function visibile(el){ return el.isConnected && el.offsetParent !== null; }
  function siVede(b){ var r = b.getBoundingClientRect(); return r.width > 0 && r.bottom > -80 && r.top < innerHeight + 80; }
  function loop(t){
    TL.raf = 0;
    var vivi = TL.els.filter(visibile);
    if (!vivi.length) { sensori(false); return; }
    sensori(true);
    if (GBX.scorrendo && GBX.scorrendo()) { TL.ferma = 1; TL.raf = requestAnimationFrame(loop); return; }
    if (t - TL.last > 900 && TL.src !== 'tg' && !(TL.src === 'gyro' && t - TL.last < 1500)) { TL.tx *= .94; TL.ty *= .94; }
    var nx = TL.x + (TL.tx - TL.x) * .12, ny = TL.y + (TL.ty - TL.y) * .12;
    if (Math.abs(nx - TL.x) + Math.abs(ny - TL.y) > .0008) {
      TL.x = nx; TL.y = ny;
      var gx = (50 + TL.x * 55).toFixed(1) + '%', gy = (30 + TL.y * 50).toFixed(1) + '%', gxn = (.5 + TL.x * .5).toFixed(3),
          rx = (-TL.y * 9).toFixed(2) + 'deg', ry = (TL.x * 11).toFixed(2) + 'deg', px = (-TL.x * 22).toFixed(1) + 'px', py = (-TL.y * 16).toFixed(1) + 'px';
      vivi.forEach(function(el){
        if (!el.__xt || TL.ferma || t - el.__xtT > 600) { el.__xt = [].slice.call(el.querySelectorAll(BERSAGLI)).filter(siVede); if (el.matches && el.matches(BERSAGLI)) el.__xt.push(el); el.__xtT = t; }
        var flat = el.hasAttribute('data-x-flat');
        var gT = 'translate3d(' + (TL.x * 27.5).toFixed(2) + '%,' + (-10 + TL.y * 25).toFixed(2) + '%,0)',
            dT = 'translate3d(' + (TL.x * 2.64).toFixed(2) + 'px,' + (TL.y * 1.92).toFixed(2) + 'px,0)',
            aT = 'translate3d(' + (-TL.x * 19.8).toFixed(1) + 'px,' + (-TL.y * 14.4).toFixed(1) + 'px,0)',
            lT = 'perspective(900px) rotateX(' + (-TL.y * 5.4).toFixed(2) + 'deg) rotateY(' + (TL.x * 6.6).toFixed(2) + 'deg)',
            fT = 'translate3d(' + (-TL.x * 4.5).toFixed(2) + 'px,' + (2.5 - TL.y * 4).toFixed(2) + 'px,0)',
            rT = 'translate3d(' + (-TL.x * 30).toFixed(2) + '%,' + (-TL.y * 22).toFixed(2) + '%,0)';
        for (var i = 0; i < el.__xt.length; i++) { var b = el.__xt[i], k = b.__xk;
          if (k === undefined) { k = b.__xk = b.classList.contains('x-lastra') ? 4 : b.classList.contains('x-lit') ? 1 : b.classList.contains('x-depth') ? 2 : (b.parentNode && b.parentNode.classList && b.parentNode.classList.contains('x-amb')) ? 3 : 0;
            if (k === 1 && !b.__xg) { var g = document.createElement('i'); g.className = 'x-glint'; g.setAttribute('aria-hidden', 'true'); g.innerHTML = '<i></i>'; b.appendChild(g); b.__xg = g.firstChild; } }
          if (k === 4) { if (!b.__xl) GBX.lastra(b); b.style.transform = lT; b.__xl[0].style.transform = fT; b.__xl[1].style.transform = rT; continue; }
          if (k === 1) { b.__xg.style.transform = gT; continue; }
          if (k === 2) { b.style.transform = dT; continue; }
          if (k === 3) { b.style.transform = aT; continue; }
          var s = b.style;
          s.setProperty('--gx', gx); s.setProperty('--gy', gy); s.setProperty('--gxn', gxn);
          if (!flat) { s.setProperty('--rx', rx); s.setProperty('--ry', ry); }
          s.setProperty('--px', px); s.setProperty('--py', py); }
      });
      TL.ferma = 0;
    }
    TL.raf = requestAnimationFrame(loop);
  }
  var BERSAGLI = '.x-lastra,.x-lit,.x-cin,.x-shine,.x-depth,.x-amb>div,[data-x-tilt],.rl4-glass,'
    + '.xh-wallet,.xw-qr,.dc-die,.cwh-ruota,.xk-shine,.cvk-porta,.xk-riflesso';
  GBX.BERSAGLI = BERSAGLI;
  GBX.lastra = function(b){
    if (!b || b.__xl) return b;
    var f = document.createElement('i'); f.className = 'x-fianco'; f.setAttribute('aria-hidden', 'true');
    var g = document.createElement('i'); g.className = 'x-rifl'; g.setAttribute('aria-hidden', 'true'); g.innerHTML = '<i></i>';
    b.insertBefore(f, b.firstChild); b.appendChild(g); b.__xl = [f, g.firstChild]; return b;
  };
  GBX._aim = function(x, y, src){ if (TL.src === 'tg' || (TL.src === 'gyro' && performance.now() - TL.last < 1500)) return; aim(x, y, src); };
  GBX._tx = function(){ return TL.tx; };
  GBX.tilt = function(el){
    if (!el || TL.els.indexOf(el) >= 0) { GBX.tiltWake(); return; }
    TL.els.push(el); el.addEventListener('pointermove', dito, { passive:true });
    GBX.tiltWake();
  };
  GBX.untilt = function(el){ var i = TL.els.indexOf(el); if (i >= 0) { TL.els.splice(i, 1); el.removeEventListener('pointermove', dito); } };
  function tiltSpento(){
    try { if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return true; } catch(e){}
    try { if (document.documentElement.classList.contains('gb-lite') && localStorage.getItem('gb_lite_perche') === 'ua') return true; } catch(e){}
    try { var u = /Chrome\/(\d+)/.exec(navigator.userAgent || ''); if (u && +u[1] < 110) return true; } catch(e){}
    return false;
  }
  GBX.tiltSpento = tiltSpento;
  try { if (tiltSpento()) document.documentElement.classList.add('gb-notilt'); } catch(e){}
  GBX.tiltWake = function(){ if (!TL.raf && !tiltSpento()) TL.raf = requestAnimationFrame(loop); };
  document.addEventListener('pointerdown', function(){
    try { if (window.DeviceOrientationEvent && DeviceOrientationEvent.requestPermission) DeviceOrientationEvent.requestPermission().catch(function(){}); } catch(e){}
  }, { once:true });
  GBX.count = function(el, da, a, fmt, ms){
    if (!el) return; fmt = fmt || function(v){ return v.toFixed(2); };
    if (GBX.lite() || !window.requestAnimationFrame) { el.textContent = fmt(a); return; }
    var t0 = performance.now(), d = ms || 650, tok = (el.__xc = (el.__xc || 0) + 1);
    (function step(t){ if (el.__xc !== tok) return; var k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(da + (a - da) * e); if (k < 1) requestAnimationFrame(step); })(t0);
  };
  GBX.sparks = function(el, n, colori){
    if (!el || !document.body.animate) return; n = Math.min(n || 22, GBX.lite() ? 8 : 40);
    var r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    colori = colori || ['#f4f4f6', '#8f86f2', '#cdc7ff'];
    for (var i = 0; i < n; i++) {
      var s = document.createElement('i'); s.className = 'x-spark'; s.style.left = cx + 'px'; s.style.top = cy + 'px';
      s.style.background = colori[i % colori.length]; document.body.appendChild(s);
      var a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 120, sz = .4 + Math.random() * .9;
      s.animate([{ transform:'translate(-50%,-50%) scale(' + sz + ')', opacity:1 },
                 { transform:'translate(calc(-50% + ' + (Math.cos(a) * d) + 'px),calc(-50% + ' + (Math.sin(a) * d + 40) + 'px)) scale(0)', opacity:0 }],
                { duration:700 + Math.random() * 500, easing:'cubic-bezier(.2,.8,.2,1)' }).onfinish = (function(x){ return function(){ x.remove(); }; })(s);
    }
  };
  GBX.scrollFx = function(sc, o){
    if (!sc || sc.__xsf) return; sc.__xsf = true; o = o || {};
    var doc = (sc === document.scrollingElement || sc === document.documentElement || sc === document.body);
    var src = doc ? window : sc, last = sc.scrollTop, vel = 0, raf = 0, items = []; o.quieto = (o.quieto !== false);
    var host = o.host || (doc ? document.documentElement : sc);
    function raccogli(){ items = [].slice.call(sc.querySelectorAll('.x-sv')).map(function(el){ return { el:el, j:0 }; }); }
    raccogli(); try { new MutationObserver(function(){ raccogli(); }).observe(doc ? document.body : sc, { childList:true, subtree:true }); } catch(e){}
    function frame(){
      raf = 0; var st = sc.scrollTop, dv = st - last; last = st; vel = vel * .8 + dv * .2;
      if (!o.quieto) (o.host || sc).style.setProperty('--sy', st + 'px');
      if (o.quieto) { if (GBX._aim) GBX._aim(GBX._tx(), Math.max(-1, Math.min(1, vel / 30)), 'scroll'); if (Math.abs(vel) > .3) raf = requestAnimationFrame(frame); return; }
      if (GBX.lite()) return;
      var top = doc ? 0 : sc.getBoundingClientRect().top, h = doc ? innerHeight : sc.clientHeight, moving = Math.abs(vel) > .05;
      for (var i = 0; i < items.length; i++) { var it = items[i]; if (!it.el.isConnected) continue; var r = it.el.getBoundingClientRect();
        if (!r.height || r.bottom < top - 40 || r.top > top + h + 40) { if (it.j) { it.j = 0; it.el.style.setProperty('--j', '0px'); } continue; }
        var f = ((r.top + r.height / 2) - (top + h / 2)) / h, target = Math.max(-22, Math.min(22, -vel * f * 2.6));
        var nj = it.j + (target - it.j) * .22; if (Math.abs(nj) < .05 && !moving) nj = 0;
        if (Math.abs(nj - it.j) > .01 || (nj === 0 && it.j !== 0)) { it.j = nj; it.el.style.setProperty('--j', nj.toFixed(2) + 'px'); }
        if (it.j) moving = true; }
      if (moving) raf = requestAnimationFrame(frame);
    }
    src.addEventListener('scroll', function(){ if (!raf) raf = requestAnimationFrame(frame); }, { passive:true });
    if (!o.quieto && window.IntersectionObserver) {
      [].forEach.call(sc.querySelectorAll('.x-stk'), function(lb){
        new IntersectionObserver(function(es){ es.forEach(function(e){
          var su = e.intersectionRatio < 1 && e.boundingClientRect.top <= (e.rootBounds ? e.rootBounds.top : 0) + 1;
          if (su !== lb.classList.contains('on')) { lb.classList.toggle('on', su); if (su) GBX.fx('tick'); }
        }); }, { root: doc ? null : sc, threshold:[1], rootMargin:'-1px 0px 0px 0px' }).observe(lb);
      });
    }
  };
  var ZITTI = '#arc,#turf,#tank,#glad,#lobby,.x-nosfx,[data-x-silent],canvas';
  document.addEventListener('pointerdown', function(e){
    var t = e.target && e.target.closest ? e.target.closest('button,[onclick],[role="button"],a[href],label,.x-press') : null;
    if (!t || t.disabled) return;
    if (t.closest(ZITTI)) { ac(); return; }
    GBX.fx('tap');
  }, { passive:true, capture:true });
  GBX.avvolgiGo = function(){
    if (typeof window.go !== 'function' || window.go.__gbx) return;
    var orig = window.go;
    var nuovo = function(id){
      var prima = document.querySelector('.screen.active');
      var r = orig.apply(this, arguments);
      try {
        var dopo = document.querySelector('.screen.active');
        if (dopo && dopo !== prima && !GBX.lite()) {
          dopo.classList.remove('x-enter'); void dopo.offsetWidth; dopo.classList.add('x-enter');
          setTimeout(function(){ dopo.classList.remove('x-enter'); }, 320);
        }
        if (dopo && dopo !== prima) { GBX.tiltWake(); document.dispatchEvent(new CustomEvent('gbx:screen', { detail:{ id: dopo.id, da: prima && prima.id } })); }
      } catch(e){}
      return r;
    };
    nuovo.__gbx = true;
    try { window.go = nuovo; } catch(e){}
  };
  GBX.avvolgiGo();
  var G_ALIAS = { unoc:'uno', pool15:'pool8', damaru:'dama', ch:'chess', scacchi:'chess', pkd:'pk1v1', cards:'pk1v1', poker:'pk1v1',
    texas:'pk1v1', holdem:'pk1v1', bjl:'bj1v1', bj:'bj1v1', blackjack:'bj1v1', gcr:'turf', twr:'turf', tk:'tank', gld:'glad' };
  var G_NOMI = { turf:['Gambler City Royale'], race:['Street Race'], glad:['Colosseo','Colosseum'], calcio:['Derby'], scalata:['Dead Peak'],
    uno:['UNO No Mercy'], unoc:['UNO'], cucu:['Cucù','Cuckoo'], uomonero:['Uomo Nero','Old Maid'], burraco:['Burraco'], lupus:['Lupus in Gambler'],
    lastcall:['Last Call'], pk5:['Poker a 5','5-handed poker'], kaiju:['Kaiju Battle'], settemezzo:['Sette e mezzo','Seven and a half'],
    tappo:['Bisca','Slap'], sbanca:['SBANCA!','Break the Bank'], abisso:['Non svegliare il drago','Don’t Wake the Dragon'], hop:['HOP CLASH'], gembrawl:['GEM BRAWL'], geo:['Geo Bet'], deadmoney:['Dead Money'], smash:['Gambler Smash'], tank:['Tank Duel'], pool8:['Biliardo','Pool'],
    pool15:['Biliardo 8-15','Pool 8-15'], pong:['Neon Pong'], sumo:['Sumo'], shove:['Shove'], alley:['Vicoli','Alleys'],
    dama:['Dama italiana','Italian checkers'], damaru:['Dama russa','Russian checkers'], backg:['Backgammon'], scopa:['Scopa'],
    briscola:['Briscola'], snake:['Snake Arena'], basket:['Basket'], archery:['Arco','Archery'], draw:['Quick Draw'], golf:['Minigolf'],
    boxe:['Boxe','Boxing'], dice:['Dadi','Dice'], pk1v1:['Poker 1v1'], bj1v1:['Blackjack 1v1'], rps:['Sasso carta forbice','Rock paper scissors'],
    rr:['Roulette russa','Russian roulette'], bs:['Battaglia navale','Battleship'], chess:['Scacchi','Chess'], hockey:['Air Hockey'],
    kart:['Gambler Kart'], random:['Partita a caso','Random game'] };
  function gId(id){ return String(id == null ? '' : id).trim().toLowerCase(); }
  GBX.gioco = function(id){ var k = gId(id); return G_ALIAS[k] || k; };
  GBX.varianteDi = G_ALIAS;
  function gTitolo(s){
    s = String(s || '').replace(/[^\wÀ-ÿ'’ .·-]/g, '').replace(/\s{2,}/g, ' ').trim(); if (!s) return '';
    if (/[a-zà-ÿ]/.test(s)) return s;
    return s.toLowerCase().replace(/(^|\s)(\S)/g, function(a, b, c){ return b + c.toUpperCase(); })
      .replace(/\b(Uno|Pvp|1v1|Gcr|Bj)\b/gi, function(w){ return w.toLowerCase() === 'pvp' ? 'PvP' : w.toUpperCase(); });
  }
  GBX.nomeGioco = function(id){
    var k = gId(id); if (!k) return '';
    var n = G_NOMI[k] || G_NOMI[G_ALIAS[k]];
    if (n) return GBX.L(n[0], n[1] || n[0]);
    try { var r = window.RTD_G && RTD_G[k]; if (r && r.title) { var t = gTitolo(r.title); if (t) return t; } } catch(e){}
    try { var tabs = [window.LOB_GAMES, window.DL_GAMES], i, j;
      for (i = 0; i < tabs.length; i++) { var T = tabs[i]; if (!T) continue;
        for (j = 0; j < T.length; j++) if (T[j] && T[j][0] === k && T[j][2]) { var t2 = gTitolo(T[j][2]); if (t2) return t2; } } } catch(e){}
    return '';
  };
  function px(v){ v = parseFloat(v); return isFinite(v) && v > 0 ? v : 0; }
  GBX.bordi = function(){
    try {
      var tg = window.Telegram && Telegram.WebApp, de = document.documentElement; if (!tg || !de) return;
      var fs = !!tg.isFullscreen, sa = tg.safeAreaInset || {}, ca = tg.contentSafeAreaInset || {}, cs = de.style;
      if (de.classList.contains('tg-fs') !== fs) de.classList.toggle('tg-fs', fs);
      var t = 0, b = 0;
      if (fs) {
        t = Math.max(px(sa.top) + px(ca.top), px(cs.getPropertyValue('--tg-safe-area-inset-top')) + px(cs.getPropertyValue('--tg-content-safe-area-inset-top')));
        b = Math.max(px(sa.bottom) + px(ca.bottom), px(cs.getPropertyValue('--tg-safe-area-inset-bottom')) + px(cs.getPropertyValue('--tg-content-safe-area-inset-bottom')));
      }
      t = Math.min(200, Math.round(t)); b = Math.min(200, Math.round(b));
      if (cs.getPropertyValue('--x-tg-top') !== t + 'px') cs.setProperty('--x-tg-top', t + 'px');
      if (cs.getPropertyValue('--x-tg-bot') !== b + 'px') cs.setProperty('--x-tg-bot', b + 'px');
      if (fs && typeof window.tgBordi === 'function' && px(cs.getPropertyValue('--tg-top')) < t) window.tgBordi();
    } catch(e){}
  };
  (function(){
    var tg = window.Telegram && Telegram.WebApp;
    if (tg && typeof tg.onEvent === 'function') {
      ['fullscreenChanged', 'safeAreaChanged', 'contentSafeAreaChanged', 'viewportChanged'].forEach(function(n){ try { tg.onEvent(n, function(){ GBX.bordi(); }); } catch(e){} });
    }
    GBX.bordi();
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', GBX.bordi);
    [300, 1200, 3000].forEach(function(ms){ setTimeout(GBX.bordi, ms); });
  })();
})();
;
(function(){
  'use strict';
  var W = window, D = document;
  if (W.XAR) return;
  var XAR = W.XAR = { on:true, v:'1611', morto:false, n:0 };
  var MW = 16, MH = 10, GL = 8.4, LX = 1.4, LY = 5.4;
  var ANELLI = [[1.7, 2, '#f2efe6', '#d9d4c7'], [1.25, 4, '#24242c', '#121217'], [0.85, 6, '#2f8fe0', '#1f6fb8'], [0.5, 8, '#e5483c', '#b8332a'], [0.22, 10, '#ffd23a', '#e9a917']];
  var COL_P = { 10:'#ffd60a', 8:'#ff6b5e', 6:'#64b5ff', 4:'#e5e5ea', 2:'#c7c7cc', 0:'#8e8e93' };
  function L(it, en){ return W.GB_LANG === 'en' ? en : it; }
  function lite(){ try { return !!((W.RTD && RTD.lite) || D.documentElement.classList.contains('gb-lite') || (W.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)); } catch(e){ return false; } }
  function hap(t){ try { if (W.GBX && GBX.hap) GBX.hap(t); } catch(e){} }
  function tws(f){ try { if (typeof TWS !== 'undefined' && TWS.on && TWS.ctx && TWS.tone) f(TWS); } catch(e){} }
  function nomeDi(id){ var n = ''; try { n = String(W.rtdName(id)); } catch(e){} return n.replace(/[^\wÀ-ɏ .'-]/g, '').trim() || L('Avversario', 'Opponent'); }
  var EMO = /\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDD00-\uDFFF]|[☀-➿️‍⏳⌛]/g;
  function pulito(t){ return String(t == null ? '' : t).replace(EMO, '').replace(/\s+/g, ' ').trim(); }
  var FONT = '-apple-system, "SF Pro Display", Inter, system-ui, sans-serif';
  function attivo(){ return XAR.on && !XAR.morto && W.RTD && RTD.game === 'archery'; }
  var IMG = {};
  function img(n){
    var i = IMG[n];
    if (!i) { i = IMG[n] = new Image(); i.decoding = 'async'; i.onload = function(){ i._ok = 1; FONDO.k = ''; }; i.src = n + '.webp'; }
    return i._ok ? i : null;
  }
  function precarica(){ ['xar_sfondo', 'xar_tu_tende', 'xar_lui_tende', 'xar_tu_riposo', 'xar_lui_riposo'].forEach(img); }
  XAR.precarica = precarica;
  var TENDE = { w:181, h:300, gx:167, gy:98, cx:50, cy:88, tx:143, ty:4, bx:142, by:196, fy:297 };
  var RIPOSO = { w:156, h:300, gx:70, fy:297 };
  var SC = 118;
  var PT = LY + (TENDE.fy - TENDE.gy) / SC;
  var S = null;
  function stato(raw){
    var nh = 0; Object.keys(raw.hits || {}).forEach(function(k){ nh += (raw.hits[k] || []).length; });
    if (!S || S.cv !== RTD.cv || nh < S.nh - 1) {
      S = { cv:RTD.cv, tv:0, tl:0, stop:0, ev:[], part:[], pop:[], ring:[], semi:[], trail:[], ang:{}, vib:null, bersT:0, bersA:0, shk:0,
            scocco:{}, turno:null, prevT:null, swapT:0, z:1, vento:0, tf:0, passo:-1, tab:{}, ultFr:null, urto:null };
    }
    S.nh = nh;
    return S;
  }
  function tempo(now, rate){
    var target = now - 85;
    if (!S.tv) { S.tv = target; S.tl = now; }
    var dt = now - S.tl; S.tl = now;
    if (now >= S.stop) {
      var lag = target - S.tv;
      if (lag > 700) S.tv = target;
      else if (rate < 1) S.tv = Math.min(target, S.tv + dt * rate);
      else S.tv = Math.min(target, S.tv + dt * (1 + Math.min(1.5, Math.max(0, lag) / 110)));
    }
    return S.tv;
  }
  function coppia(t){
    var s = RTD.snaps || [];
    if (!s.length) return null;
    if (s.length === 1 || t <= s[0].rx) return { a:s[0], b:s[0], k:0 };
    for (var i = s.length - 1; i > 0; i--) if (t >= s[i - 1].rx) { var a = s[i - 1], b = s[i]; return { a:a, b:b, k:Math.min(1, (t - a.rx) / Math.max(1, b.rx - a.rx)) }; }
    var l = s[s.length - 1]; return { a:l, b:l, k:0 };
  }
  var FONDO = { k:'', c:null };
  function geo(){
    var cv = RTD.cv; if (!cv) return null;
    var wr = cv.parentNode; if (!wr) return null;
    var cw = RTD.cssW || cv.clientWidth || 1, ch = RTD.cssH || cv.clientHeight || 1;
    return { wr:wr, ox:cv.offsetLeft, oy:cv.offsetTop, cw:cw, ch:ch, ww:wr.clientWidth || cw, wh:wr.clientHeight || ch, dpr:cv.width / cw || 1 };
  }
  function prepara(G, raw){
    var tg = raw.tgt || [14.2, 4.6];
    var k = [G.ww, G.wh, G.ox, G.oy, G.cw, G.ch, G.dpr.toFixed(2), !!img('xar_sfondo'), tg.join(','), W.GB_LANG].join('|');
    var el = D.getElementById('xar-fondo');
    if (!el || el.parentNode !== G.wr) {
      el = D.createElement('canvas'); el.id = 'xar-fondo'; el.setAttribute('aria-hidden', 'true');
      G.wr.insertBefore(el, G.wr.firstChild); FONDO.k = '';
    }
    G.wr.classList.add('xar-on');
    if (k === FONDO.k && FONDO.c === el) return el;
    FONDO.k = k; FONDO.c = el;
    el.width = Math.max(1, Math.round(G.ww * G.dpr)); el.height = Math.max(1, Math.round(G.wh * G.dpr));
    el.style.width = G.ww + 'px'; el.style.height = G.wh + 'px';
    dipingiFondo(el.getContext('2d'), G, tg);
    piazzaTab(G);
    S && (S.bers = null, S.vign = null);
    return el;
  }
  function copri(c, im, WW, Ya, fr){
    var kh = Ya / (fr * im.height), kk = Math.max(kh, Math.min(WW / im.width, kh * 1.6)), dw = im.width * kk, dh = im.height * kk, dy = Ya - fr * dh, x0 = (WW - dw) / 2;
    var n = Math.ceil(Math.max(0, x0) / dw);
    for (var i = -n; i <= n; i++) {
      var x = x0 + i * dw;
      if (i % 2 === 0) c.drawImage(im, x, dy, dw, dh);
      else { c.save(); c.translate(x + dw, 0); c.scale(-1, 1); c.drawImage(im, 0, dy, dw, dh); c.restore(); }
    }
    return { dw:dw, dh:dh, dy:dy, x0:x0 };
  }
  function dipingiFondo(c, G, tg){
    var d = G.dpr, cs = G.cw / MW * d, csy = G.ch / MH * d, WW = G.ww * d, WH = G.wh * d;
    function X(x){ return G.ox * d + x * cs; }
    function Y(y){ return G.oy * d + y * csy; }
    var Yg = Y(GL);
    var im = img('xar_sfondo');
    if (im) {
      c.fillStyle = '#4f7a3a'; c.fillRect(0, 0, WW, WH);
      var cp = copri(c, im, WW, Yg, 0.70), dh = cp.dh, dy = cp.dy;
      if (dy + dh < WH) { var gg = c.createLinearGradient(0, dy + dh - 2, 0, WH); gg.addColorStop(0, '#5b8a3f'); gg.addColorStop(1, '#2c4a22'); c.fillStyle = gg; c.fillRect(0, dy + dh - 2, WW, WH - dy - dh + 2); }
    } else {
      var g0 = c.createLinearGradient(0, 0, 0, Yg); g0.addColorStop(0, '#6d5a9a'); g0.addColorStop(0.7, '#f2a77a'); g0.addColorStop(1, '#f7c58c');
      c.fillStyle = g0; c.fillRect(0, 0, WW, Yg); c.fillStyle = '#4f7a3a'; c.fillRect(0, Yg, WW, WH - Yg);
    }
    c.save();
    var gp = c.createLinearGradient(0, Yg, 0, WH); gp.addColorStop(0, 'rgba(255,214,150,.10)'); gp.addColorStop(1, 'rgba(0,0,0,.35)');
    c.fillStyle = gp; c.fillRect(0, Yg, WW, WH - Yg);
    for (var i = 0; i < 9; i++) { if (i % 2) continue; var y0 = Yg + (WH - Yg) * Math.pow(i / 9, 1.6), y1 = Yg + (WH - Yg) * Math.pow((i + 1) / 9, 1.6); c.fillStyle = 'rgba(255,255,255,.035)'; c.fillRect(0, y0, WW, y1 - y0); }
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = Math.max(1, 1 * d); c.beginPath(); c.moveTo(X(2.2), Yg + 0.12 * csy); c.lineTo(WW, Yg + 0.12 * csy); c.stroke();
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '700 ' + Math.round(10 * d) + 'px ' + FONT;
    [[5.5, '30 m'], [9.5, '50 m'], [12.6, '70 m']].forEach(function(q){
      c.fillStyle = 'rgba(255,255,255,.75)'; c.fillRect(X(q[0]) - 0.6 * d, Yg - 0.32 * csy, 1.2 * d, 0.36 * csy);
      c.fillStyle = 'rgba(255,255,255,.55)'; c.fillText(q[1], X(q[0]), Yg + 0.42 * csy);
    });
    c.restore();
    var tx = X(tg[0]), ty = Y(tg[1]);
    c.save(); c.lineCap = 'round';
    c.strokeStyle = '#4a3220'; c.lineWidth = Math.max(3, 0.16 * cs);
    c.beginPath(); c.moveTo(tx + 0.25 * cs, ty + 0.6 * csy); c.lineTo(tx + 0.85 * cs, Yg + 0.05 * csy); c.stroke();
    c.strokeStyle = '#6b4a2e'; c.lineWidth = Math.max(3, 0.18 * cs);
    c.beginPath(); c.moveTo(tx - 0.05 * cs, ty + 1.2 * csy); c.lineTo(tx - 0.45 * cs, Yg + 0.1 * csy); c.moveTo(tx + 0.15 * cs, ty + 1.2 * csy); c.lineTo(tx + 0.35 * cs, Yg + 0.12 * csy); c.stroke();
    c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(tx + 0.2 * cs, Yg + 0.14 * csy, 1.1 * cs, 0.12 * csy, 0, 0, 6.2832); c.fill();
    c.restore();
    var Yp = Y(PT), x1 = X(2.15);
    c.save();
    var gs = c.createLinearGradient(0, Yp, 0, Yg); gs.addColorStop(0, '#6e5a46'); gs.addColorStop(1, '#3a2e24');
    c.fillStyle = gs; c.fillRect(0, Yp + 0.12 * csy, x1, Yg - Yp);
    c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = Math.max(1, d);
    for (var yy = Yp + 0.35 * csy; yy < Yg; yy += 0.28 * csy) { c.beginPath(); c.moveTo(0, yy); c.lineTo(x1, yy); c.stroke(); }
    var gt = c.createLinearGradient(0, Yp - 0.1 * csy, 0, Yp + 0.14 * csy); gt.addColorStop(0, '#c9a77c'); gt.addColorStop(1, '#8a6a49');
    c.fillStyle = gt; c.fillRect(0, Yp - 0.02 * csy, x1 + 0.08 * cs, 0.16 * csy);
    c.fillStyle = 'rgba(255,240,210,.5)'; c.fillRect(0, Yp - 0.02 * csy, x1 + 0.08 * cs, Math.max(1, 0.025 * csy));
    c.fillStyle = 'rgba(255,255,255,.85)'; c.fillRect(x1 - 0.08 * cs, Yp - 0.02 * csy, 0.08 * cs, 0.16 * csy);
    c.restore();
    c.save(); c.strokeStyle = '#d7d2c8'; c.lineWidth = Math.max(1.5, 0.05 * cs);
    c.beginPath(); c.moveTo(X(2.7), Yg + 0.05 * csy); c.lineTo(X(2.7), Y(2.5)); c.stroke();
    c.fillStyle = '#d7d2c8'; c.beginPath(); c.arc(X(2.7), Y(2.5), 0.07 * cs, 0, 6.2832); c.fill(); c.restore();
    var gl = c.createRadialGradient(WW * 0.85, Yg * 0.62, 0, WW * 0.85, Yg * 0.62, WW * 0.7);
    gl.addColorStop(0, 'rgba(255,200,130,.16)'); gl.addColorStop(1, 'rgba(255,200,130,0)');
    c.fillStyle = gl; c.fillRect(0, 0, WW, WH);
    var gv = c.createRadialGradient(WW * 0.5, Yg * 0.6, Math.min(WW, WH) * 0.3, WW * 0.5, Yg * 0.6, Math.max(WW, WH) * 0.8);
    gv.addColorStop(0, 'rgba(0,0,0,0)'); gv.addColorStop(1, 'rgba(10,6,20,.45)');
    c.fillStyle = gv; c.fillRect(0, 0, WW, WH);
  }
  function spriteBersaglio(s, sy){
    var k = Math.round(s * 10) + 'x' + Math.round(sy * 10);
    if (S.bers && S.bers.k === k) return S.bers.c;
    var R = 1.7 * sy, A = 0.34, rx = R * A + 2, c = D.createElement('canvas');
    var dep = 0.32 * s;
    c.width = Math.ceil(rx * 2 + dep + 8); c.height = Math.ceil(R * 2 + 8);
    var g = c.getContext('2d'), cx = rx + 4, cy = R + 4;
    var gs = g.createLinearGradient(cx, 0, cx + dep + rx, 0); gs.addColorStop(0, '#caa45d'); gs.addColorStop(1, '#7d5f2c');
    g.fillStyle = gs; g.beginPath(); g.ellipse(cx + dep, cy, rx * 1.05, R * 1.04, 0, 0, 6.2832); g.fill();
    g.fillRect(cx, cy - R * 1.04, dep, R * 2.08);
    g.strokeStyle = 'rgba(80,55,20,.45)'; g.lineWidth = 1;
    for (var i = -8; i <= 8; i++) { g.beginPath(); g.moveTo(cx, cy + i * R / 8.5); g.lineTo(cx + dep + rx * 0.6, cy + i * R / 8.5 + 2); g.stroke(); }
    ANELLI.forEach(function(a){
      var r = a[0] * sy, gr = g.createLinearGradient(cx - r * A, cy - r, cx + r * A, cy + r); gr.addColorStop(0, a[2]); gr.addColorStop(1, a[3]);
      g.fillStyle = gr; g.beginPath(); g.ellipse(cx, cy, Math.max(1, r * A), r, 0, 0, 6.2832); g.fill();
      g.strokeStyle = a[1] === 4 ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.28)'; g.lineWidth = 1; g.stroke();
    });
    [[1.48, 'rgba(0,0,0,.18)'], [1.05, 'rgba(255,255,255,.2)'], [0.68, 'rgba(0,0,0,.2)'], [0.36, 'rgba(0,0,0,.2)']].forEach(function(q){ g.strokeStyle = q[1]; g.beginPath(); g.ellipse(cx, cy, q[0] * sy * A, q[0] * sy, 0, 0, 6.2832); g.stroke(); });
    g.fillStyle = 'rgba(0,0,0,.5)'; g.beginPath(); g.ellipse(cx, cy, 1.2, 1.6, 0, 0, 6.2832); g.fill();
    var gl = g.createLinearGradient(cx - rx, cy - R, cx + rx, cy + R); gl.addColorStop(0, 'rgba(255,255,255,.22)'); gl.addColorStop(0.5, 'rgba(255,255,255,0)'); gl.addColorStop(1, 'rgba(0,0,0,.18)');
    g.fillStyle = gl; g.beginPath(); g.ellipse(cx, cy, rx - 2, R, 0, 0, 6.2832); g.fill();
    S.bers = { k:k, c:c, cx:cx, cy:cy };
    return c;
  }
  function camDom(el, G, shx, shy, z, fx, fy){
    var v = (shx || shy || z > 1) ? 'translate(' + (shx / G.dpr).toFixed(2) + 'px,' + (shy / G.dpr).toFixed(2) + 'px) scale(' + z.toFixed(4) + ')' : '';
    if (el._cam === v) return; el._cam = v;
    el.style.transformOrigin = (G.ox + fx / G.dpr).toFixed(1) + 'px ' + (G.oy + fy / G.dpr).toFixed(1) + 'px';
    el.style.transform = v;
  }
  function vignetta(w, hh){
    if (S.vign && S.vign.width === w && S.vign.height === hh) return S.vign;
    var c = D.createElement('canvas'); c.width = w; c.height = hh;
    var g = c.getContext('2d'), gr = g.createRadialGradient(w * 0.75, hh * 0.46, Math.min(w, hh) * 0.15, w * 0.6, hh * 0.5, Math.max(w, hh) * 0.75);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.7)'); g.fillStyle = gr; g.fillRect(0, 0, w, hh);
    S.vign = c; return c;
  }
  var FRECCIA_SVG = '<svg class="xar-va" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h15M13 6l6 6-6 6"/></svg>';
  function el(id, cls, html, wr){
    var e = D.getElementById(id);
    if (!e || e.parentNode !== wr) { if (e) e.remove(); e = D.createElement('div'); e.id = id; e.className = cls; e.innerHTML = html; e.setAttribute('aria-hidden', 'true'); wr.appendChild(e); if (S) S.tab = {}; }
    return e;
  }
  function piazzaTab(G){
    var t = el('xar-tab', 'xar-tab',
      '<div class="xar-sq tu"><div class="xar-r1"><span class="xar-n"></span><b class="xar-pt">0</b></div><div class="xar-fr"></div></div>' +
      '<div class="xar-vento">' + FRECCIA_SVG + '<b class="xar-vv"></b><span class="xar-vb"><i></i><i></i><i></i></span></div>' +
      '<div class="xar-sq lui"><div class="xar-r1"><b class="xar-pt">0</b><span class="xar-n"></span></div><div class="xar-fr"></div></div>', G.wr);
    var so = el('xar-sotto', 'xar-sotto', '', G.wr);
    var comp = G.oy < 84;
    t.classList.toggle('compatto', comp);
    t.style.top = (comp ? G.oy + 6 : Math.max(6, Math.round((G.oy - 68) / 2))) + 'px';
    var giu = G.wh - (G.oy + G.ch);
    so.style.display = giu >= 44 ? '' : 'none';
    so.style.top = (G.oy + G.ch + Math.max(8, Math.min(26, Math.round((giu - 34) / 2)))) + 'px';
  }
  function scrivi(e, k, v, html){ if (S.tab[k] !== v) { S.tab[k] = v; if (html) e.innerHTML = v; else e.textContent = v; return true; } return false; }
  function chips(hits, left, prossima){
    var h = '', n = (hits || []).length, tot = n + (left || 0);
    for (var i = 0; i < Math.max(tot, n); i++) {
      if (i < n) { var p = hits[i][1] | 0; h += '<i class="xar-c p' + p + '">' + (p ? p : '·') + '</i>'; }
      else h += '<i class="xar-c vuota' + (i === n && prossima ? ' ora' : '') + '"></i>';
    }
    return h;
  }
  function aggiornaTab(raw, ids, now){
    var t = D.getElementById('xar-tab'), so = D.getElementById('xar-sotto');
    if (!t) return;
    var sc = raw.sc || {}, hits = raw.hits || {}, left = raw.left || {}, sq = t.querySelectorAll('.xar-sq');
    [[0, ids.io], [1, ids.lui]].forEach(function(q){
      var e = sq[q[0]], id = q[1];
      scrivi(e.querySelector('.xar-n'), 'n' + q[0], id == null ? '' : (q[0] === 0 && ids.tu ? L('Tu', 'You') : nomeDi(id).slice(0, 10)));
      var pt = e.querySelector('.xar-pt');
      if (scrivi(pt, 'p' + q[0], String(id != null && sc[id] != null ? sc[id] : 0)) && S.tab['_p' + q[0]]) { pt.classList.remove('pop'); void pt.offsetWidth; pt.classList.add('pop'); }
      S.tab['_p' + q[0]] = 1;
      var turno = id != null && String(raw.turn) === String(id) && !raw.over;
      scrivi(e.querySelector('.xar-fr'), 'f' + q[0], chips(hits[id], left[id], turno && !raw.arrow), true);
      if (S.tab['t' + q[0]] !== turno) { S.tab['t' + q[0]] = turno; e.classList.toggle('turno', turno); }
    });
    var w = +raw.wind || 0, aw = Math.abs(w);
    scrivi(t.querySelector('.xar-vv'), 'vv', aw.toFixed(1).replace('.', W.GB_LANG === 'en' ? '.' : ','));
    var vk = (w < 0 ? 'l' : 'r') + (aw > 1.6 ? 'f' : '') + '|' + (aw >= 0.25 ? 1 : 0) + (aw >= 1.0 ? 1 : 0) + (aw > 1.6 ? 1 : 0);
    if (S.tab.vk !== vk) { S.tab.vk = vk; var v = t.querySelector('.xar-vento'); v.classList.toggle('sx', w < 0); v.classList.toggle('forte', aw > 1.6);
      var bars = v.querySelectorAll('.xar-vb i'); bars[0].className = aw >= 0.25 ? 'on' : ''; bars[1].className = aw >= 1.0 ? 'on' : ''; bars[2].className = aw > 1.6 ? 'on' : ''; }
    if (so && so.style.display !== 'none') {
      var tt = Math.ceil(raw.turn_t || 0), mio = ids.tu && String(raw.turn) === String(RTD.myId), txt, cl = '';
      if (raw.over) txt = L('Fine partita', 'Match over');
      else if (raw.arrow) txt = L('Freccia in volo…', 'Arrow in flight…');
      else if (mio) { txt = L('Tocca a te', 'Your turn') + ' · ' + tt + ' s'; cl = tt <= 5 ? 'rosso' : 'tuo'; }
      else txt = L('Tira ', 'Shooting: ') + nomeDi(raw.turn).slice(0, 10) + ' · ' + tt + ' s';
      if (raw.spa && !raw.over && !raw.arrow) txt = L('Freccia di spareggio · ', 'Shoot-off · ') + txt;
      scrivi(so, 's', txt);
      if (S.tab.scl !== cl) { S.tab.scl = cl; so.className = 'xar-sotto' + (cl ? ' ' + cl : ''); }
    }
  }
  function freccia(ctx, x, y, ang, len, col, dp, alfa){
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); if (alfa != null) ctx.globalAlpha = alfa;
    var t = Math.max(1.2, len * 0.035);
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#5a3d22'; ctx.lineWidth = t + 1; ctx.beginPath(); ctx.moveTo(-len, 0); ctx.lineTo(-len * 0.08, 0); ctx.stroke();
    ctx.strokeStyle = '#e8d3a8'; ctx.lineWidth = t; ctx.beginPath(); ctx.moveTo(-len, 0); ctx.lineTo(-len * 0.08, 0); ctx.stroke();
    ctx.fillStyle = '#cfd6e2'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-len * 0.14, -t * 2.1); ctx.lineTo(-len * 0.11, 0); ctx.lineTo(-len * 0.14, t * 2.1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = col; var fl = len * 0.22;
    ctx.beginPath(); ctx.moveTo(-len + fl * 0.1, 0); ctx.lineTo(-len - fl * 0.12, -t * 3); ctx.lineTo(-len + fl, -t * 0.6); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-len + fl * 0.1, 0); ctx.lineTo(-len - fl * 0.12, t * 3); ctx.lineTo(-len + fl, t * 0.6); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function arciere(ctx, chi, lui, s, sy, now, dp, aim, pull, scocco, dx, alfa, riposo){
    var sp = riposo ? RIPOSO : TENDE, im = img('xar_' + (lui ? 'lui' : 'tu') + '_' + (riposo ? 'riposo' : 'tende'));
    var k = s / SC, gx = LX * s + dx, gy = LY * sy;
    var fy = PT * sy;
    ctx.save(); if (alfa != null) ctx.globalAlpha = alfa;
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(gx - 0.7 * s, fy + 0.04 * sy, 0.65 * s, 0.07 * sy, 0, 0, 6.2832); ctx.fill();
    if (riposo) {
      if (im) ctx.drawImage(im, gx - 0.9 * s - RIPOSO.gx * k, fy - RIPOSO.fy * k, RIPOSO.w * k, RIPOSO.h * k);
      ctx.restore(); return;
    }
    var resp = lite() ? 0 : Math.sin(now / 900) * 0.6 * dp;
    ctx.translate(gx, gy + resp); ctx.rotate(aim);
    if (im) ctx.drawImage(im, -sp.gx * k, -sp.gy * k, sp.w * k, sp.h * k);
    else { ctx.fillStyle = lui ? '#8b83f0' : '#e5e5ea'; ctx.fillRect(-1.2 * s, -0.4 * s, 0.6 * s, 2 * s); }
    var tX = (sp.tx - sp.gx) * k, tY = (sp.ty - sp.gy) * k, bX = (sp.bx - sp.gx) * k, bY = (sp.by - sp.gy) * k;
    var nX = (sp.cx - sp.gx) * k - pull * 0.22 * s, nY = (sp.cy - sp.gy) * k;
    var vib = scocco ? Math.sin(scocco * 60) * Math.exp(-scocco * 9) * 0.25 * s : 0;
    ctx.strokeStyle = 'rgba(255,250,240,.85)'; ctx.lineWidth = Math.max(1, 0.9 * dp);
    ctx.beginPath(); ctx.moveTo(tX, tY);
    if (scocco != null) ctx.quadraticCurveTo((tX + bX) / 2 + vib, (tY + bY) / 2, bX, bY);
    else { ctx.lineTo(nX, nY); ctx.lineTo(bX, bY); }
    ctx.stroke();
    if (scocco == null) freccia(ctx, 0.34 * s, 0, 0, 0.34 * s - nX, lui ? '#8b83f0' : '#ffffff', dp);
    ctx.restore();
  }
  function manica(ctx, s, sy, now, vento, dp){
    var px = 2.7 * s, py = 2.5 * sy, aw = Math.min(1, Math.abs(vento) / 2.5), dir = vento < 0 ? -1 : 1;
    var lunga = (0.55 + aw * 0.75) * s, giu = (1 - aw) * 1.15 + 0.08, n = 5, segL = lunga / n;
    var x = px, y = py, ang = dir > 0 ? giu : Math.PI - giu;
    ctx.save(); ctx.lineCap = 'butt';
    for (var i = 0; i < n; i++) {
      var fl = lite() ? 0 : Math.sin(now / (70 + 40 * (1 - aw)) - i * 0.9) * (0.06 + 0.1 * aw) * (i + 1) / n;
      var a = ang + fl * dir, nx = x + Math.cos(a) * segL, ny = y + Math.sin(a) * segL;
      var r = (0.17 - i * 0.022) * sy;
      ctx.strokeStyle = i % 2 ? '#f5f5f7' : '#ff6b3d'; ctx.lineWidth = r * 2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(nx, ny); ctx.stroke();
      x = nx; y = ny; ang = a;
    }
    ctx.restore();
  }
  function semi(ctx, w, hh, dt, vento, s, sy, dp){
    if (lite()) return;
    if (!S.semi.length) for (var i = 0; i < 22; i++) S.semi.push({ x:Math.random() * w, y:Math.random() * GL * sy, f:Math.random() * 6, v:0.6 + Math.random() * 0.8 });
    ctx.save(); ctx.fillStyle = 'rgba(255,248,225,.75)';
    for (i = 0; i < S.semi.length; i++) {
      var q = S.semi[i]; q.f += dt * 2;
      q.x += (vento * 0.55 * q.v + 0.08) * s * dt; q.y += Math.sin(q.f) * 0.25 * sy * dt;
      if (q.x > w + 6) q.x = -6; if (q.x < -6) q.x = w + 6;
      ctx.globalAlpha = 0.35 + 0.3 * Math.sin(q.f * 1.3); ctx.beginPath(); ctx.arc(q.x, q.y, (0.8 + q.v * 0.6) * dp, 0, 6.2832); ctx.fill();
    }
    ctx.restore();
  }
  function spruzzo(x, y, n, cols, vel, vita, gr, sz){
    if (lite()) return;
    for (var i = 0; i < n; i++) {
      var a = Math.random() * 6.2832, v = vel * (0.35 + Math.random() * 0.9);
      S.part.push({ x:x, y:y, vx:Math.cos(a) * v - vel * 0.3, vy:Math.sin(a) * v - (gr > 0 ? vel * 0.4 : 0), t:0, max:vita * (0.6 + Math.random() * 0.7), col:cols[i % cols.length], g:gr, sz:sz * (0.6 + Math.random() * 0.8) });
    }
    if (S.part.length > 200) S.part.splice(0, S.part.length - 200);
  }
  function particelle(ctx, dt){
    if (!S.part.length) return;
    var keep = [];
    ctx.save();
    for (var i = 0; i < S.part.length; i++) {
      var p = S.part[i]; p.t += dt; if (p.t >= p.max) continue; keep.push(p);
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= (1 - 1.5 * dt);
      ctx.globalAlpha = 1 - p.t / p.max; ctx.fillStyle = p.col; ctx.fillRect(p.x - p.sz / 2, p.y - p.sz * 0.2, p.sz, p.sz * 0.4);
    }
    ctx.restore(); S.part = keep;
  }
  function anello(x, y, r, col, dur){ if (!lite()) S.ring.push({ x:x, y:y, r:r, col:col, t0:performance.now(), dur:dur || 520 }); }
  function anelli(ctx, now, dp){
    var keep = [];
    for (var i = 0; i < S.ring.length; i++) {
      var a = S.ring[i], k = (now - a.t0) / a.dur; if (k >= 1) continue; keep.push(a);
      var e = 1 - Math.pow(1 - k, 3);
      ctx.save(); ctx.globalAlpha = (1 - k) * 0.9; ctx.strokeStyle = a.col; ctx.lineWidth = Math.max(1.5 * dp, a.r * 0.1 * (1 - k));
      ctx.beginPath(); ctx.ellipse(a.x, a.y, a.r * (0.25 + e) * 0.5, a.r * (0.25 + e), 0, 0, 6.2832); ctx.stroke(); ctx.restore();
    }
    S.ring = keep;
  }
  function pillola(ctx, x, y, txt, fs, bg, fg){
    ctx.font = '700 ' + fs + 'px ' + FONT;
    var tw = ctx.measureText(txt).width, h = fs * 1.55, w = tw + fs * 1.1;
    ctx.fillStyle = bg; ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 2); else ctx.rect(x - w / 2, y - h / 2, w, h);
    ctx.fill(); ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, x, y + fs * 0.04);
  }
  function pop(o){ o.t0 = performance.now() + (o.ritardo || 0); o.dur = o.dur || (o.big ? 1300 : 950); S.pop.push(o); if (S.pop.length > 5) S.pop.shift(); }
  function pops(ctx, now, w, hh){
    var keep = [];
    for (var i = 0; i < S.pop.length; i++) {
      var p = S.pop[i], k = (now - p.t0) / p.dur; if (k < 0) { keep.push(p); continue; } if (k >= 1) continue; keep.push(p);
      var ent = Math.min(1, k / 0.16), molla = ent < 1 ? 0.4 + 0.75 * (1 - Math.pow(1 - ent, 3)) : 1 + 0.15 * Math.exp(-(k - 0.16) * 14) * Math.cos((k - 0.16) * 40);
      if (lite()) molla = 1;
      var al = k > 0.72 ? 1 - (k - 0.72) / 0.28 : 1;
      var x = p.x != null ? p.x : w / 2, y = (p.y != null ? p.y : hh * 0.36) - (p.big ? 0 : k * hh * 0.07);
      ctx.save(); ctx.globalAlpha = al; ctx.translate(x, y); ctx.scale(molla, molla);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      var fs = p.big ? Math.min(w * 0.12, hh * 0.19) : Math.min(w * 0.065, hh * 0.11);
      ctx.font = '900 ' + fs + 'px ' + FONT; ctx.lineJoin = 'round'; ctx.lineWidth = fs * 0.16; ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.strokeText(p.txt, 0, 0, w * 0.92);
      if (p.big) { var g = ctx.createLinearGradient(0, -fs * 0.5, 0, fs * 0.5); g.addColorStop(0, '#fff'); g.addColorStop(0.55, p.col); g.addColorStop(1, p.col2 || p.col); ctx.fillStyle = g; } else ctx.fillStyle = p.col;
      ctx.fillText(p.txt, 0, 0, w * 0.92);
      if (p.sub) pillola(ctx, 0, fs * 0.85, p.sub, fs * 0.36, 'rgba(255,255,255,.94)', '#0b0b10');
      ctx.restore();
    }
    S.pop = keep;
  }
  function scossa(v){ if (!lite()) S.shk = Math.min(12 * (RTD.dpr || 1), S.shk + v * (RTD.dpr || 1)); }
  function evento(e){
    if (!attivo() || !e || !e.k || !S) return;
    var raw = RTD.lastRaw, q = { e:e, t:(raw && raw.rx) || performance.now() };
    if (e.k === 'hit_t' && raw && raw.hits) { var h = raw.hits[e.who] || raw.hits[String(e.who)] || []; if (h.length) q.off = h[h.length - 1][0]; }
    S.ev.push(q);
    if (S.ev.length > 30) S.ev.shift();
  }
  function esegui(q, raw, s, sy, ids, w, hh){
    var e = q.e, who = e.who != null ? String(e.who) : '', mio = ids.tu && who === String(RTD.myId), ioV = who === String(ids.io), now = performance.now();
    var tg = raw.tgt || [14.2, 4.6], tx = tg[0] * s, ty = tg[1] * sy;
    if (e.k === 'loose') {
      S.scocco[who] = now;
      tws(function(T){ T.tone({ f:240, f2:120, type:'triangle', d:0.2, g:0.16 }); T.noise({ d:0.06, g:0.08, hp:1500 }); });
    } else if (e.k === 'hit_t') {
      var pts = e.pts | 0, off = q.off != null ? q.off : 0;
      var lista = (S.ang[who] = S.ang[who] || []);
      if (pts > 0) {
        var iy = ty + off * sy, col = COL_P[pts] || '#fff';
        lista.push(S.ultFr && S.ultFr.who === who ? Math.max(-0.5, Math.min(0.5, S.ultFr.a)) : 0.1);
        S.vib = { who:who, i:lista.length - 1, t0:now };
        S.bersT = now; S.bersA = pts >= 10 ? 1 : 0.5;
        spruzzo(tx - 0.05 * s, iy, pts >= 10 ? 26 : 12, ['#e6c27a', '#c9a25a', col], s * (pts >= 10 ? 3.2 : 2), 0.6, s * 5, Math.max(2, s * 0.09));
        anello(tx, iy, (pts >= 10 ? 1.5 : 0.8) * sy, col, pts >= 10 ? 700 : 450);
        if (pts >= 10) { anello(tx, iy, 2.6 * sy, '#ffffff', 900); S.stop = Math.max(S.stop, now + 130); scossa(7); }
        else scossa(pts >= 8 ? 3 : 1.8);
        tws(function(T){ T.tone({ f:170, f2:80, d:0.14, g:0.32 }); T.noise({ d:0.07, g:0.18, lp:1400 }); });
        if (ioV) {
          if (pts >= 10) pop({ txt:L('CENTRO!', 'BULLSEYE!'), sub:'+10', col:'#ffd60a', col2:'#ff9f0a', big:true });
          else pop({ txt:'+' + pts, col:col, x:Math.max(w * 0.18, tx - 2.4 * s), y:Math.max(hh * 0.18, Math.min(hh * 0.8, iy)), dur:1000 });
        } else {
          pop({ txt:(pts >= 10 ? L('Centro ', 'Bullseye ') : '+' + pts + ' ') + nomeDi(who).slice(0, 8), col:pts >= 10 ? '#ffd60a' : '#c9c4ff', x:Math.max(w * 0.22, tx - 3.2 * s), y:Math.max(hh * 0.18, Math.min(hh * 0.8, iy)) });
        }
        if (mio) { hap(pts >= 10 ? 'heavy' : pts >= 8 ? 'medium' : 'light'); if (pts >= 8) setTimeout(function(){ hap('success'); }, 140); }
      } else {
        lista.push(null);
        var u = S.ultFr && S.ultFr.who === who ? S.ultFr : null;
        if (u && u.y > (GL - 0.3) * sy) spruzzo(u.x, GL * sy, 14, ['#7a5a35', '#a07a48', '#5a8a3a'], s * 1.6, 0.5, s * 6, Math.max(2, s * 0.08));
        if (ioV) pop({ txt:L('Mancato', 'Miss'), col:'rgba(235,235,245,.85)', x:u ? Math.max(w * 0.2, Math.min(w * 0.8, u.x)) : w * 0.6, y:u ? Math.max(hh * 0.2, Math.min(hh * 0.75, u.y)) : hh * 0.4, dur:800 });
        if (mio) hap('soft');
      }
    } else if (e.k === 'spa_centro') {
      pop({ txt:L('Più vicina al centro', 'Closest to centre'), sub:nomeDi(who).slice(0, 12), col:'#ffd60a', big:true, dur:1500 });
    }
  }
  function hh0(){ try { return RTD.cv.height * 0.2; } catch(e){ return null; } }
  function cartello(txt, col){
    var t = pulito(txt);
    if (!t) return;
    if (/^\+\d/.test(t) || /^MANCATO$/i.test(t)) return;
    if (/^[123]$/.test(t)) { pop({ txt:t, col:'#ffffff', big:true, dur:600 }); hap('light'); return; }
    if (/^(GO!|VIA!)$/i.test(t)) { pop({ txt:L('VIA!', 'GO!'), col:'#ffd60a', col2:'#ff9f0a', big:true, dur:850 }); hap('medium'); return; }
    if (/^TOCCA A TE$/i.test(t)) { pop({ txt:L('Tocca a te', 'Your turn'), col:'#ffffff', col2:'#b9b3ff', big:true, dur:1000, ritardo:450, y:hh0() }); hap('light'); return; }
    if (/^SPAREGGIO/i.test(t)) { pop({ txt:L('Spareggio', 'Shoot-off'), sub:L('una freccia a testa', 'one arrow each'), col:'#ffd60a', big:true, dur:1500 }); return; }
    pop({ txt:t, col:col || '#ffd60a', big:true });
  }
  function disegna(ctx, raw, now, w, hh){
    XAR.n++;
    precarica();
    stato(raw);
    var G = geo(); if (!G) throw new Error('niente tela');
    var fondo = prepara(G, raw);
    var s = w / MW, sy = hh / MH, dp = RTD.dpr || 1;
    var dt = Math.min(0.05, (now - (S.tf || now)) / 1000); S.tf = now;
    var lento = false;
    if (!lite()) for (var qi = 0; qi < S.ev.length; qi++) { var qe = S.ev[qi]; if (qe.e.k === 'hit_t' && (qe.e.pts | 0) >= 10 && qe.t > S.tv && raw && (S.inVolo || raw.arrow)) lento = true; }
    var tv = tempo(now, lento ? 0.3 : 1), C = coppia(tv) || { a:raw, b:raw, k:0 }, b = C.b || raw;
    var meS = String(RTD.myId), ks = Object.keys(raw.sc || {}), tu = ks.indexOf(meS) >= 0;
    var io = tu ? meS : (ks[0] || meS), lui = null; for (var i = 0; i < ks.length; i++) if (ks[i] !== io) lui = ks[i];
    var ids = { io:io, lui:lui, tu:tu };
    while (S.ev.length && S.ev[0].t <= tv) { var x0 = S.ev.shift(); try { esegui(x0, b, s, sy, ids, w, hh); } catch(e){} }
    if (RTD.stampQ && RTD.stampQ.length) { var q = RTD.stampQ; RTD.stampQ = []; q.forEach(function(st){ cartello(st.txt, st.col); }); }
    var tg = b.tgt || raw.tgt || [14.2, 4.6], tx = tg[0] * s, ty = tg[1] * sy;
    var zt = lento ? 1.5 : 1; S.z += (zt - S.z) * Math.min(1, dt * (lento ? 7 : 4));
    if (Math.abs(S.z - 1) < 0.002) S.z = 1;
    ctx.save();
    var shx = 0, shy = 0, fx = 0, fy = 0;
    if (S.shk > 0.3) { shx = (Math.random() - 0.5) * S.shk; shy = (Math.random() - 0.5) * S.shk; ctx.translate(shx, shy); S.shk *= Math.pow(0.02, dt); } else S.shk = 0;
    if (S.z > 1) { var zk = (S.z - 1) / 0.5; fx = w / 2 + (tx - 1.6 * s - w / 2) * zk; fy = hh / 2 + (ty - hh / 2) * zk; ctx.translate(fx, fy); ctx.scale(S.z, S.z); ctx.translate(-fx, -fy); }
    camDom(fondo, G, shx, shy, S.z, fx, fy);
    ctx.drawImage(fondo, G.ox * G.dpr, G.oy * G.dpr, w, hh, 0, 0, w, hh);
    S.vento += ((+b.wind || 0) - S.vento) * Math.min(1, dt * 3);
    semi(ctx, w, hh, dt, S.vento, s, sy, dp);
    manica(ctx, s, sy, now, S.vento, dp);
    var bk = S.bersT ? (now - S.bersT) / 1000 : 9, wob = bk < 1.2 && !lite() ? Math.sin(bk * 38) * Math.exp(-bk * 6) * S.bersA * 0.07 * s : 0;
    var bs = spriteBersaglio(s, sy);
    ctx.drawImage(bs, tx - S.bers.cx + wob, ty - S.bers.cy);
    var hits = b.hits || {}, LEN = 1.1 * s;
    Object.keys(hits).forEach(function(id){
      var lista = hits[id] || [], angs = S.ang[id] || [], colF = String(id) === String(io) ? '#ffffff' : '#8b83f0';
      for (var j = 0; j < lista.length; j++) {
        var hv = lista[j]; if (!hv || hv[1] <= 0) continue;
        var a = angs[j] != null ? angs[j] : 0.1;
        if (S.vib && S.vib.who === String(id) && S.vib.i === j) { var vt = (now - S.vib.t0) / 1000; if (vt < 1) a += Math.sin(vt * 55) * Math.exp(-vt * 7) * 0.12; }
        freccia(ctx, tx - 0.06 * s + wob, ty + hv[0] * sy, a, LEN, colF, dp);
      }
    });
    var turno = b.turn != null ? String(b.turn) : io;
    if (S.turno !== turno) { S.prevT = S.turno; S.turno = turno; S.swapT = S.prevT == null || lite() ? 0 : now; }
    var mioTurno = tu && turno === meS && !b.arrow && !raw.over;
    var aim = 0, pull = 0;
    if (mioTurno && RTD.drag) {
      var cW = (RTD.cssW || w / dp) / MW, cH = (RTD.cssH || hh / dp) / MH;
      var wx = -RTD.drag.dx / cW, wy = -RTD.drag.dy / cH;
      if (Math.hypot(RTD.drag.dx, RTD.drag.dy) >= 14) { aim = Math.max(-0.6, Math.min(0.35, Math.atan2(wy, Math.max(0.2, wx)))) * 0.75; pull = Math.min(1, RTD.drag.pw || 0); }
      var passo = Math.floor(pull * 5); if (passo !== S.passo) { if (S.passo >= 0 && pull > 0) hap('sel'); S.passo = passo; }
    } else S.passo = -1;
    S.aim = (S.aim || 0) + (aim - (S.aim || 0)) * Math.min(1, dt * 18);
    var sk = S.swapT ? (now - S.swapT) / 380 : 1;
    var scT = S.scocco[turno] && !lite() ? (now - S.scocco[turno]) / 1000 : null;
    var partita = b.arrow || (scT != null && scT < 0.5 && S.inVolo);
    if (sk < 1 && S.prevT != null) {
      var e1 = sk * sk;
      arciere(ctx, S.prevT, S.prevT !== String(io), s, sy, now, dp, 0, 0, 1, -e1 * 1.8 * s, 1 - sk, false);
      var e2 = 1 - Math.pow(1 - sk, 3);
      arciere(ctx, turno, turno !== String(io), s, sy, now, dp, 0, 0, null, -(1 - e2) * 1.8 * s, e2, false);
    } else if (raw.over) {
      arciere(ctx, turno, turno !== String(io), s, sy, now, dp, 0, 0, null, 0, 1, true);
    } else {
      arciere(ctx, turno, turno !== String(io), s, sy, now, dp, S.aim, pull, partita ? (scT != null ? scT : 1) : null, 0, 1, false);
    }
    if (mioTurno && pull > 0) {
      var cx0 = (LX - 0.35) * s, cy0 = (LY - 0.05) * sy, R0 = 1.0 * s;
      ctx.save(); ctx.globalAlpha = 0.25; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3 * dp; ctx.beginPath(); ctx.arc(cx0, cy0, R0, 0, 6.2832); ctx.stroke();
      ctx.globalAlpha = 0.95; ctx.strokeStyle = pull > 0.85 ? '#ffd60a' : '#fff'; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(cx0, cy0, R0, -Math.PI / 2, -Math.PI / 2 + pull * Math.PI * 2); ctx.stroke(); ctx.restore();
    }
    var A = b.arrow, Aa = C.a && C.a.arrow;
    if (A) {
      var ax = A[0], ay = A[1], vx = A[2], vy = A[3];
      if (Aa && C.a !== C.b) { ax = Aa[0] + (A[0] - Aa[0]) * C.k; ay = Aa[1] + (A[1] - Aa[1]) * C.k; vx = Aa[2] + (A[2] - Aa[2]) * C.k; vy = Aa[3] + (A[3] - Aa[3]) * C.k; }
      var fx2 = ax * s, fy2 = ay * sy, fa = Math.atan2(vy * sy / s, vx);
      S.inVolo = true; S.ultFr = { who:turno, x:fx2, y:fy2, a:fa };
      S.trail.push(fx2, fy2); if (S.trail.length > 28) S.trail.splice(0, 2);
      var _fr3 = (typeof tv3Freccia === 'function') ? tv3Freccia({ turn: turno }) : null;
      var colT = _fr3 ? '249,115,22' : (turno === String(io) ? '255,255,255' : '185,179,255');
      ctx.save(); ctx.lineCap = 'round';
      for (var t2 = 2; t2 < S.trail.length; t2 += 2) {
        var kk = t2 / S.trail.length; ctx.globalAlpha = kk * (lento ? 0.95 : 0.75); ctx.strokeStyle = 'rgba(' + colT + ',1)'; ctx.lineWidth = Math.max(1, kk * 0.16 * s * (lento ? 1.6 : 1));
        ctx.beginPath(); ctx.moveTo(S.trail[t2 - 2], S.trail[t2 - 1]); ctx.lineTo(S.trail[t2], S.trail[t2 + 1]); ctx.stroke();
      }
      ctx.restore();
      freccia(ctx, fx2, fy2, fa, LEN, _fr3 ? '#fdba74' : (turno === String(io) ? '#ffffff' : '#8b83f0'), dp);
    } else { S.trail = []; S.inVolo = false; }
    particelle(ctx, dt);
    anelli(ctx, now, dp);
    ctx.restore();
    pops(ctx, now, w, hh);
    aggiornaTab(b.turn !== undefined ? b : raw, ids, now);
  }
  function aggancia(){
    if (XAR.agganciato) return true;
    if (typeof W.rtdDrawArchery !== 'function' || typeof W.rtdFeedEvent !== 'function') return false;
    XAR.agganciato = true;
    var drOrig = W.rtdDrawArchery;
    W.rtdDrawArchery = function(ctx, raw, lp, now, w, hh){
      if (attivo() && raw && W.RTD && RTD.map) {
        ctx.save();
        try { disegna(ctx, raw, now, w, hh); ctx.restore(); return; }
        catch (e) {
          XAR.morto = true;
          try { ctx.restore(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; } catch(_r){}
          try { var f = D.getElementById('xar-fondo'); if (f) f.remove(); ['xar-tab', 'xar-sotto'].forEach(function(k){ var x = D.getElementById(k); if (x) x.remove(); }); var wr = RTD.cv && RTD.cv.parentNode; if (wr) wr.classList.remove('xar-on'); } catch(_x){}
          try { console.warn('XAR giù, torna il disegno di prima: ' + (e && e.message || e)); } catch(_w){}
        }
      }
      return drOrig.apply(this, arguments);
    };
    var feOrig = W.rtdFeedEvent;
    W.rtdFeedEvent = function(e){
      var r = feOrig.apply(this, arguments);
      try { if (W.RTD && RTD.game === 'archery') evento(e); } catch(_e){}
      return r;
    };
    var stOrig = W.rtdStamp;
    if (typeof stOrig === 'function') W.rtdStamp = function(txt, col, alta){
      if (attivo() && RTD.ui === 'match' && S && S.cv === RTD.cv) { try { cartello(txt, col); } catch(e){} return; }
      return stOrig.apply(this, arguments);
    };
    var sbOrig = W.rtdScoreBar;
    if (typeof sbOrig === 'function') W.rtdScoreBar = function(ctx, raw){
      if (attivo() && S && S.cv === RTD.cv && D.getElementById('xar-tab')) return;
      return sbOrig.apply(this, arguments);
    };
    return true;
  }
  if (!aggancia()) { var n = 0, iv = setInterval(function(){ if (aggancia() || ++n > 80) clearInterval(iv); }, 250); }
  D.addEventListener('click', function(ev){ try { var t = ev.target.closest && ev.target.closest('[onclick*="\'archery\'"]'); if (t) precarica(); } catch(e){} }, true);
  XAR.stato = function(){ return S; };
})();
;
(function(){
  'use strict';
  if (window.XA) return;
  var XA = window.XA = { filtro:'all', img:{} };
  function L(it, en){ return (window.GBX && GBX.L) ? GBX.L(it, en) : it; }
  function fx(n){ try { if (window.GBX) GBX.fx(n); } catch(e){} }
  function el(tag, cls, html){ var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function gioco(id){ try { if (window.GBX && GBX.gioco) return GBX.gioco(id); } catch(e){} return String(id || ''); }
  function nomeG(id){ try { if (window.GBX && GBX.nomeGioco) return GBX.nomeGioco(id); } catch(e){} return ''; }
  var ICO = function(id){ return 'gbx_pv_' + id + '.webp'; };
  var BAN = function(id){ return 'gbx_bn_' + id + '.webp'; };
  function prova(url, cb){
    var v = XA.img[url];
    if (v === true || v === false) { cb(v); return; }
    if (v && v.push) { v.push(cb); return; }
    var q = XA.img[url] = [cb], im = new Image();
    im.onload = function(){ XA.img[url] = true; q.forEach(function(f){ f(true); }); };
    im.onerror = function(){ XA.img[url] = false; q.forEach(function(f){ f(false); }); };
    im.src = url;
  }
  XA.prova = prova;
  var CATS = [
    ['all',  'Tutti',       'All'],
    ['live', 'Tempo reale', 'Real time'],
    ['cards','Carte',       'Cards'],
    ['party','Party',       'Party'],
    ['table','Tavolo',      'Table'],
    ['sport','Sport',       'Sport']
  ];
  var CAT_DI = {
    gembrawl:'live', turf:'live', race:'live', glad:'live', scalata:'live', smash:'live', sbanca:'live', hop:'live', tank:'live', alley:'live', snake:'live', draw:'live',
    uno:'cards', cucu:'cards', uomonero:'cards', burraco:'cards', pk5:'cards', settemezzo:'cards', tappo:'cards', scopa:'cards', briscola:'cards', pk1v1:'cards', bj1v1:'cards',
    lupus:'party', lastcall:'party', geo:'party', deadmoney:'party', abisso:'party', rps:'party', rr:'party',
    kaiju:'table', pool8:'table', shove:'table', dama:'table', backg:'table', dice:'table', bs:'table', chess:'table',
    calcio:'sport', pong:'sport', sumo:'sport', basket:'sport', archery:'sport', golf:'sport', boxe:'sport'
  };
  var SEZ = {
    live: ['Tempo reale', 'Real time'], cards:['Carte', 'Cards'], party:['Party', 'Party'],
    table:['Tavolo', 'Table'], sport:['Sport', 'Sport'], altro:['Altri giochi', 'More games'], soon:['In arrivo', 'Coming soon'],
    nuovi:['Novità', 'New games']
  };
  var ORDINE = ['nuovi','live','cards','party','table','sport','altro','soon'];
  var NOMI = {
    turf:['Gambler City Royale','Battle royale in città','City battle royale'],
    race:['Street Race','Piste sempre nuove, derapate e boost','Fresh tracks, drifts and boost'],
    glad:['Colosseo','Tutti contro tutti, spada e scudo','Free for all, sword and shield'],
    calcio:['Derby','Calcio a squadre','Team football'],
    scalata:['Dead Peak','Scalata con trappole e lava','A climb with traps and lava'],
    uno:['UNO','Classico o No Mercy','Classic or No Mercy'],
    cucu:['Cucù','Una carta a testa: tienila o passala','One card each: keep it or pass it'],
    uomonero:['Uomo Nero','Scarta le coppie, non restare col nero','Pair off, don’t get stuck with him'],
    burraco:['Burraco','A coppie o tutti contro tutti','In pairs or free for all'],
    lupus:['Lupus in Gambler','Lupi contro villaggio','Wolves against the village'],
    lastcall:['Last Call','Chi resta in piedi prende tutto','Last one standing takes all'],
    pk5:['Poker · tavolo a 5','Ti siedi e ti alzi quando vuoi','Sit down and leave when you like'],
    kaiju:['Kaiju Battle','Dadi, mostri e una città da prendere','Dice, monsters and a city to take'],
    settemezzo:['Sette e mezzo','Carta o sto? Senza banco','Hit or stand? No dealer'],
    tappo:['Bisca','Quattro uguali, poi la mano sul mazzo','Four of a kind, then slap the deck'],
    sbanca:['SBANCA!','Mira, vento e il terreno che si sbriciola','Aim, wind and ground that crumbles'],
    abisso:['Non svegliare il drago','Avanti o torni su con l’oro? Il drago dorme… per ora','Go on or head back with the gold? The dragon sleeps… for now'],
    hop:['HOP CLASH','Salti tutti insieme nello stagno','Everyone jumps at once in the pond'],
    gembrawl:['GEM BRAWL','Online · Gratis','Online · Free'],
    geo:['Geo Bet','Indovina dove sei','Guess where you are'],
    deadmoney:['Dead Money','Il quiz dove chi sbaglia muore','The quiz where a wrong answer kills'],
    smash:['Gambler Smash','Picchiaduro: buttali fuori','Brawler: knock them out'],
    tank:['Tank Duel','Carri armati, uno contro uno','Tanks, one on one'],
    pool8:['Biliardo','8-ball vero o 15 rapido','Real 8-ball or quick 15'],
    pong:['Neon Pong','Effetti e power-up','Spin and power-ups'],
    sumo:['Sumo','Buttalo giù dal dohyo','Push him out of the ring'],
    shove:['Shove','Curling di strada','Street curling'],
    alley:['Vicoli','Dinamite nel cantiere, una vita','Dynamite on site, one life'],
    dama:['Dama','Italiana o russa','Italian or Russian'],
    backg:['Backgammon','Dadi, punte e bear-off','Dice, points and bear-off'],
    scopa:['Scopa','Carte, denari e primiera','Cards, coins and primiera'],
    briscola:['Briscola','Le napoletane: 61 per vincere','Neapolitan deck: 61 to win'],
    snake:['Snake Arena','Cresci e taglia la strada','Grow and cut them off'],
    basket:['Basket','Tiri ad arco, ferro vero','Arc shots, real rim'],
    archery:['Arco','5 frecce, vento variabile','5 arrows, shifting wind'],
    draw:['Quick Draw','Riflessi western, con le finte','Western reflexes, with feints'],
    golf:['Minigolf','3 buche sempre nuove','3 fresh holes'],
    boxe:['Boxe','Carica il colpo, 3 atterramenti','Charge the punch, 3 knockdowns'],
    dice:['Dadi','Il tiro più alto vince','Higher roll wins'],
    pk1v1:['Poker 1v1','Texas Hold’em testa a testa','Heads-up Texas Hold’em'],
    bj1v1:['Blackjack 1v1','Primo a 5 fiche','First to 5 chips'],
    rps:['Sasso carta forbice','Al meglio di tre','Best of three'],
    rr:['Roulette russa','Un colpo alla volta','One shot at a time'],
    bs:['Battaglia navale','Schiera la flotta, affonda la loro','Deploy your fleet, sink theirs'],
    chess:['Scacchi','Scacchi veri, orologio blitz','Real chess, blitz clock'],
    kart:['Gambler Kart','Kart al neon','Neon karts'],
    bluff:['Bluff','Nascondino al casinò','Hide and seek at the casino']
  };
  var NUOVI = ((window.GXDC_RADICE != null || document.documentElement.classList.contains('gxdc')) ? [] : ['gembrawl']).concat(['hop','abisso','sbanca']);
  XA.NUOVI = NUOVI;
  var CARO = NUOVI.concat(['turf','smash','race','pk5','glad','uno','lupus','lastcall','kaiju','calcio','scalata','burraco','settemezzo','geo','deadmoney','cucu','uomonero','tappo'].filter(function(id){ return NUOVI.indexOf(id) < 0; }));
  function chiave(c){
    var oc = c.getAttribute('onclick') || '', m;
    if ((m = oc.match(/twSoon\('(\w+)'\)/))) return m[1];
    if ((m = oc.match(/RTD_GAME='(\w+)'/))) return m[1];
    if ((m = oc.match(/dlPickGame\('(\w+)'\)/))) return m[1];
    if (/pk5Apri/.test(oc)) return 'pk5';
    if (/gembApri/.test(oc)) return 'gembrawl';
    if ((m = oc.match(/go\('(\w+)'\)/))) return m[1];
    return '';
  }
  function titolo(s){ s = String(s || '').replace(/[^\wÀ-ÿ'’ ·-]/g, '').trim().toLowerCase(); return s.replace(/(^|\s)(\S)/g, function(a, b, c){ return b + c.toUpperCase(); }); }
  function arteVecchia(c){
    try { var v = String(getComputedStyle(c).getPropertyValue('--gb-art') || '').trim(); return (v && v.indexOf('url(') >= 0) ? v : ''; } catch(e){ return ''; }
  }
  function leggi(c){
    var k = chiave(c), mega = c.classList.contains('tw-mega');
    var soon = c.classList.contains('tw-soon') || /twSoon\(/.test(c.getAttribute('onclick') || '');
    var q = function(s){ var x = c.querySelector(s); return x ? x.textContent.trim() : ''; };
    var dat = c.querySelector('.tw-dat');
    var ico = c.querySelector('.pvp-tile-ico'), emo = '';
    if (ico) emo = ico.innerHTML.trim();
    else { var b = q('.tw-mega-badge'); var m = b.match(/^[^\w\s]+/); emo = m ? m[0] : ''; }
    return {
      id:k, oc:c.getAttribute('onclick') || '', mega:mega, soon:soon, nuovo:c.classList.contains('gb-nuovo'),
      cat: soon ? 'soon' : (CAT_DI[k] || 'altro'),
      nome: q('.tw-mega-title, .pvp-tile-name'), sub: q('.tw-mega-sub, .pvp-tile-sub'),
      badge: (q('.pvp-badge') || '').toUpperCase(), dur: q('.pvp-tile-dur').replace(/^[^\w~]+/, ''),
      dat: dat ? { g:dat.getAttribute('data-g') || '', d:dat.getAttribute('data-d') || '', l:dat.getAttribute('data-l') || '' } : null,
      arte: arteVecchia(c), emo: emo, scheda:c
    };
  }
  var D = XA._D = { scr:null, gc:null, giochi:[], secs:{}, righe:[], slides:[], car:null, dots:null, seg:null, segw:null, list:null };
  function iconaHtml(g){
    return '<span class="xa-ico" aria-hidden="true"><img src="' + ICO(g.id) + '" alt="" width="64" height="64" loading="lazy" decoding="async"></span>';
  }
  function rip(span, g){
    if (!span || span.__rip) return; span.__rip = 1;
    var im = span.querySelector('img'); if (im) im.remove();
    if (g.arte) { span.classList.add('xa-ico--crop'); span.style.backgroundImage = g.arte; }
    else {
      var t = (NOMI[g.id] ? NOMI[g.id][0] : (g.nome || g.id || '?')).replace(/[^A-Za-z0-9À-ſ]/g, '');
      span.classList.add('xa-ico--emo'); span.innerHTML = '<i>' + esc((t.charAt(0) || '?').toUpperCase()) + '</i>';
    }
  }
  function datHtml(g){
    if (g.id === 'gembrawl') return '<span class="xa-1v1">' + L('GRATIS', 'FREE') + '</span>';
    if (!g.dat) return '<span class="xa-1v1">1v1</span>';
    return '<span class="tw-dat" data-g="' + esc(g.dat.g) + '" data-d="' + esc(g.dat.d) + '" data-l="' + esc(g.dat.l) + '"><b>' + esc(g.dat.d) + '</b><span>' + esc(g.dat.l) + '</span></span>';
  }
  function badgeHtml(g){
    if (g.soon) return '';
    if (g.badge === 'LIVE') return '<em class="xa-bd xa-bd--live">LIVE</em>';
    if (NUOVI.indexOf(g.id) >= 0) return '<em class="xa-bd xa-bd--new">' + L('NUOVO','NEW') + '</em>';
    return '';
  }
  function rigaHtml(g){
    return iconaHtml(g) +
      '<span class="xa-rt"><b class="xa-nm"></b><span class="xa-sb"></span><small class="xa-meta">' +
        (g.dur ? '<span>' + esc(g.dur) + '</span>' : '') + datHtml(g) + '</small></span>' +
      '<span class="xa-get"><span class="xa-pill">' + (g.soon ? L('PRESTO','SOON') : L('GIOCA','PLAY')) + '</span>' + badgeHtml(g) + '</span>';
  }
  function slideHtml(g){
    return '<span class="xa-bw" aria-hidden="true"><img class="xa-bimg" src="' + BAN(g.id) + '" alt="" width="1200" height="675" loading="lazy" decoding="async">' +
      '<span class="xa-scrim"></span></span>' +
      '<span class="xa-st"><small class="xa-sk"></small><b class="xa-nm"></b><span class="xa-sb"></span><small class="xa-meta">' + datHtml(g) + '</small></span>';
  }
  function montaDuel(){
    var d = document.getElementById('duel'); if (!d || d.__xa) return;
    var gc = d.querySelector(':scope > .game-content'); if (!gc) return;
    var carte = [].slice.call(gc.querySelectorAll(':scope > .tw-mega, :scope > .pvp-grid > .pvp-tile'));
    if (carte.length < 10) return;
    d.__xa = 1; D.scr = d; D.gc = gc;
    var hdr = d.querySelector(':scope > .game-hdr'); if (hdr) hdr.classList.add('x-navf');
    var head = el('div', 'xa-head');
    head.innerHTML = '<h1 class="xa-h1">Arena</h1><p class="xa-lede"></p><div class="xa-liveslot"></div>';
    var live = document.getElementById('dl-live');
    if (live) head.querySelector('.xa-liveslot').appendChild(live);
    var hero = gc.querySelector(':scope > .pvp-hero');
    if (hero) hero.classList.add('xa-hero');
    var st = gc.querySelector(':scope > .pvp-stats');
    if (st) st.classList.add('xa-stats', 'x-lastra');
    var crea = [].slice.call(gc.querySelectorAll(':scope > .action-btn')).filter(function(b){ return /lobOpenCreate/.test(b.getAttribute('onclick') || ''); })[0];
    var rnd = gc.querySelector(':scope > .pvp-random');
    var inc = document.getElementById('pvp-incoming');
    var quick = el('div', 'xa-quick x-gruppo x-lastra');
    if (crea) { crea.classList.add('xa-q'); quick.appendChild(crea); }
    if (rnd) { rnd.classList.add('xa-q'); quick.appendChild(rnd); }
    var chal0 = gc.querySelector(':scope > .pvp-challenge');
    if (chal0) {
      [].forEach.call(gc.querySelectorAll(':scope > .pvp-sec-lbl'), function(lb){
        if (!lb.id && /CHALLENGE|SFIDA/i.test(lb.textContent)) lb.classList.add('xa-via');
      });
      var sfida = el('div', 'xa-q xa-sfida');
      sfida.setAttribute('role', 'button'); sfida.setAttribute('tabindex', '0'); sfida.setAttribute('aria-expanded', 'false');
      sfida.innerHTML = '<span class="xa-qi" aria-hidden="true"></span><span class="xa-qt"><b></b><i></i></span>';
      sfida.addEventListener('click', function(){
        var on = quick.classList.toggle('xa-chal-on');
        sfida.setAttribute('aria-expanded', on ? 'true' : 'false');
        try { if (window.GBX && GBX.fx) GBX.fx(on ? 'open' : 'back'); } catch(e){}
      });
      var cw = el('div', 'xa-chalw'); cw.appendChild(chal0);
      quick.appendChild(sfida); quick.appendChild(cw);
    }
    [[crea, 'lobby'], [rnd, 'caso'], [quick.querySelector('.xa-sfida'), 'sfida']].forEach(function(p){
      if (!p[0]) return;
      p[0].classList.add('xa-qk-' + p[1]);
      if (!p[0].querySelector('.xa-qi')) { var qi = el('span', 'xa-qi'); qi.setAttribute('aria-hidden', 'true'); p[0].insertBefore(qi, p[0].firstChild); }
    });
    var giochi = D.giochi = carte.map(leggi);
    var depo = el('div', 'xa-depo'); depo.setAttribute('aria-hidden', 'true');
    var vecchiaGriglia = gc.querySelector(':scope > .pvp-grid');
    var carw = el('section', 'xa-carw');
    carw.innerHTML = '<div class="xa-car" role="region" aria-roledescription="carousel"></div><div class="xa-dots" role="tablist"></div>';
    var car = D.car = carw.firstChild, dots = D.dots = carw.lastChild;
    var perId = {}; giochi.forEach(function(g){ if (!perId[g.id]) perId[g.id] = g; });
    CARO.forEach(function(id){
      var g = perId[id]; if (!g || g.soon || g.nuovo || !g.mega) return;
      var s = el('div', 'xa-slide x-lastra x-nosfx' + (NUOVI.indexOf(id) >= 0 ? ' xa-slide--nuovo' : ''));
      s.setAttribute('role', 'button'); s.setAttribute('tabindex', '0'); s.setAttribute('data-g', id);
      s.setAttribute('onclick', g.oc);
      s.innerHTML = slideHtml(g);
      var im = s.querySelector('img');
      if (!D.slides.length) { im.loading = 'eager'; try { im.fetchPriority = 'high'; } catch(e){} }
      im.addEventListener('error', function(){ ripBanner(s, g); }, { once:true });
      im.addEventListener('load', function(){ XA.img[BAN(id)] = true; }, { once:true });
      s.__g = g; car.appendChild(s); D.slides.push(s);
      var b = el('button', ''); b.type = 'button'; b.setAttribute('data-x-silent', ''); b.setAttribute('aria-label', g.nome || id); b.__i = D.slides.length - 1;
      dots.appendChild(b);
    });
    var segw = el('div', 'xa-segw'); var seg = el('div', 'x-seg xa-seg'); seg.setAttribute('role', 'tablist');
    segw.appendChild(seg); D.seg = seg; D.segw = segw;
    var list = el('div', 'xa-list'); D.list = list;
    ORDINE.forEach(function(k){
      var s = el('section', 'xa-sec'); s.setAttribute('data-cat', k);
      s.innerHTML = '<h2 class="xa-sh"><span class="xa-lt"></span><span class="xa-ln x-num"></span></h2><div class="xa-grp x-gruppo x-lastra x-nosfx"></div>';
      list.appendChild(s); D.secs[k] = s;
    });
    giochi.forEach(function(g){
      var r = el('div', 'xa-row');
      r.setAttribute('role', 'button'); r.setAttribute('tabindex', '0'); r.setAttribute('data-g', g.id);
      r.setAttribute('onclick', g.oc);
      if (g.nuovo) r.classList.add('xa-nuovo');
      if (g.soon) r.classList.add('xa-soon');
      r.innerHTML = rigaHtml(g);
      var sp = r.querySelector('.xa-ico'), im = sp.querySelector('img');
      im.addEventListener('error', function(){ XA.img[ICO(g.id)] = false; rip(sp, g); }, { once:true });
      im.addEventListener('load', function(){ XA.img[ICO(g.id)] = true; }, { once:true });
      r.__g = g; D.secs[g.cat].querySelector('.xa-grp').appendChild(r); D.righe.push(r);
      depo.appendChild(g.scheda);
    });
    D.righeN = [];
    NUOVI.forEach(function(id){
      var g = perId[id]; if (!g || g.soon || g.nuovo) return;
      var r = el('div', 'xa-row xa-row--nuovo');
      r.setAttribute('role', 'button'); r.setAttribute('tabindex', '0'); r.setAttribute('data-g', id);
      r.setAttribute('onclick', g.oc);
      r.innerHTML = rigaHtml(g);
      var sp = r.querySelector('.xa-ico'), im = sp.querySelector('img');
      im.loading = 'eager';
      im.addEventListener('error', function(){ rip(sp, g); }, { once:true });
      r.__g = g; D.secs.nuovi.querySelector('.xa-grp').appendChild(r); D.righeN.push(r);
    });
    D.secs.nuovi.classList.add('xa-sec--nuovi');
    var rcBox = document.getElementById('pvp-recent'), rcLbl = document.getElementById('pvp-recent-lbl');
    var rcw = null;
    if (rcBox) {
      rcw = el('section', 'xa-rcw');
      rcw.innerHTML = '<h2 class="xa-sh"><span class="xa-lt"></span><span class="xa-ln"></span></h2>';
      if (rcLbl) rcLbl.classList.add('xa-via');
      rcBox.classList.add('xa-rc');
      rcw.appendChild(rcBox);
      D.rcw = rcw;
      rcw.hidden = !rcBox.children.length;
    }
    var top = el('div', 'xa-top');
    [head, carw, hero, st, inc, quick, rcw].forEach(function(x){ if (x) top.appendChild(x); });
    gc.insertBefore(top, gc.firstChild);
    gc.insertBefore(segw, top.nextSibling);
    gc.insertBefore(list, segw.nextSibling);
    gc.appendChild(depo);
    if (vecchiaGriglia && !vecchiaGriglia.children.length) vecchiaGriglia.classList.add('xa-via');
    [].forEach.call(gc.querySelectorAll(':scope > .pvp-sec-lbl'), function(lb){
      if (/1v1|IN ARRIVO|FEELING/i.test(lb.textContent) && !lb.id) lb.classList.add('xa-via');
    });
    [].forEach.call(gc.querySelectorAll(':scope > .pvp-sec-lbl:not(.xa-via)'), function(lb){ lb.classList.add('xa-sublbl'); });
    var chal = gc.querySelector(':scope > .pvp-challenge'); if (chal) chal.classList.add('x-lastra');
    try {
      var v = document.getElementById('pvpHeroVidA');
      if (v) { v.pause(); v.preload = 'none'; }
      window.pvpHeroLoop = function(){ var a = document.getElementById('pvpHeroVidA'); if (a) { try { a.pause(); } catch(e){} } };
    } catch(e){}
    seg.addEventListener('click', function(e){
      var b = e.target.closest && e.target.closest('button[data-cat]'); if (!b) return;
      filtra(b.getAttribute('data-cat'), true);
    });
    var apri = function(e){
      var r = e.target.closest && e.target.closest('.xa-row,.xa-slide'); if (!r) return;
      fx(r.classList.contains('xa-soon') ? 'soft' : 'open');
    };
    list.addEventListener('click', apri); car.addEventListener('click', apri);
    var tasto = function(e){
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var r = e.target.closest && e.target.closest('.xa-row,.xa-slide'); if (!r || r !== e.target) return;
      e.preventDefault(); r.click();
    };
    list.addEventListener('keydown', tasto); car.addEventListener('keydown', tasto);
    montaCarosello();
    montaVetro();
    d.classList.add('xa-on');
    testi();
    disegnaSeg();
    applicaFiltro();
  }
  function ripBanner(s, g){
    XA.img[BAN(g.id)] = false;
    var im = s.querySelector('.xa-bimg'); if (!im) return;
    if (g.arte) { var f = el('span', 'xa-bimg xa-bimg--old'); f.style.backgroundImage = g.arte; im.replaceWith(f); }
    else im.remove();
  }
  function montaCarosello(){
    var car = D.car; if (!car || !D.slides.length) return;
    var attivo = 0;
    var segna = function(i){
      attivo = i;
      [].forEach.call(D.dots.children, function(b, j){ b.classList.toggle('on', j === i); b.setAttribute('aria-selected', j === i); });
    };
    segna(0);
    if (window.IntersectionObserver) {
      var io = new IntersectionObserver(function(es){
        es.forEach(function(e){ if (e.isIntersecting && e.intersectionRatio >= .6) segna(D.slides.indexOf(e.target)); });
      }, { root: car, threshold: [.6] });
      D.slides.forEach(function(s){ io.observe(s); });
      new IntersectionObserver(function(es){ D.carVis = es[0].isIntersecting; }, { threshold: .5 }).observe(car);
    } else {
      car.addEventListener('scroll', function(){ var w = D.slides[0].offsetWidth + 12; segna(Math.round(car.scrollLeft / w)); }, { passive:true });
    }
    var vai = function(i, liscio){
      var s = D.slides[i]; if (!s) return;
      var x = s.offsetLeft - parseFloat(getComputedStyle(car).scrollPaddingLeft || 0);
      try { car.scrollTo({ left: x, behavior: liscio === false ? 'auto' : 'smooth' }); } catch(e){ car.scrollLeft = x; }
    };
    XA.vai = vai;
    D.dots.addEventListener('click', function(e){
      var b = e.target.closest && e.target.closest('button'); if (!b) return;
      ferma(); fx('tick'); vai(b.__i);
    });
    var ferma = function(){ D.autoStop = true; if (D.autoT) { clearInterval(D.autoT); D.autoT = 0; } };
    ['pointerdown', 'touchstart', 'wheel', 'keydown'].forEach(function(t){ car.addEventListener(t, ferma, { passive:true }); });
    var lite = window.GBX && GBX.lite && GBX.lite();
    var ridotto = false; try { ridotto = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){}
    if (!lite && !ridotto && D.slides.length > 1) {
      D.autoT = setInterval(function(){
        if (D.autoStop || document.hidden || !D.carVis || D.car.offsetParent === null) return;
        vai((attivo + 1) % D.slides.length);
      }, 6000);
    }
  }
  function montaVetro(){
    if (!window.GBX || !GBX.tilt) return;
    var lastre = [].slice.call(D.scr.querySelectorAll('.x-lastra')).filter(function(x){ return !x.closest('.xa-depo'); });
    lastre.forEach(function(x){ try { GBX.lastra(x); } catch(e){} });
    if (!window.IntersectionObserver) return;
    var dentro = function(x, on){ try { if (on) GBX.tilt(x); else GBX.untilt(x); } catch(e){} };
    var ioV = new IntersectionObserver(function(es){ es.forEach(function(e){ dentro(e.target, e.isIntersecting); }); }, { root: D.gc, rootMargin: '40px 0px' });
    var ioH = new IntersectionObserver(function(es){ es.forEach(function(e){ dentro(e.target, e.isIntersecting); }); }, { root: D.car, rootMargin: '0px 8px' });
    lastre.forEach(function(x){ (x.classList.contains('xa-slide') ? ioH : ioV).observe(x); });
  }
  function visibili(cat){
    var nuovi = document.documentElement.classList.contains('gb-nuovi');
    return D.righe.filter(function(r){
      var g = r.__g;
      if (g.nuovo && !nuovi) return false;
      if (g.cat === 'soon' || g.cat === 'altro') return cat === 'all' && g.cat === 'altro';
      return cat === 'all' || g.cat === cat;
    }).length;
  }
  function testi(){
    if (!D.scr) return;
    var n = visibili('all');
    var lede = D.scr.querySelector('.xa-lede');
    if (lede) lede.textContent = L(n + ' giochi contro giocatori veri. Chi vince prende il piatto, meno la commissione: 5% nei duelli.',
                                   n + ' games against real players. The winner takes the pot, minus the fee: 5% in duels.');
    var nuovi = document.documentElement.classList.contains('gb-nuovi');
    ORDINE.forEach(function(k){
      var s = D.secs[k], t = SEZ[k]; if (!s) return;
      s.querySelector('.xa-lt').textContent = L(t[0], t[1]);
      var nn = [].filter.call(s.querySelectorAll('.xa-row'), function(r){ return nuovi || !r.classList.contains('xa-nuovo'); }).length;
      if (k === 'nuovi') { s.querySelector('.xa-ln').textContent = L('appena arrivati', 'just landed'); s.classList.toggle('xa-vuota', !nn); return; }
      s.querySelector('.xa-ln').textContent = nn;
      s.classList.toggle('xa-vuota', !nn);
    });
    var scrivi = function(nodo, g){
      var t = NOMI[g.id];
      nodo.querySelector('.xa-nm').textContent = t ? t[0] : titolo(g.nome) || g.id;
      nodo.querySelector('.xa-sb').textContent = t ? L(t[1], t[2]) : g.sub;
    };
    D.righe.concat(D.righeN || []).forEach(function(r){ scrivi(r, r.__g); r.setAttribute('aria-label', r.querySelector('.xa-nm').textContent); });
    D.slides.forEach(function(s){
      scrivi(s, s.__g); s.setAttribute('aria-label', s.querySelector('.xa-nm').textContent);
      var sk = s.querySelector('.xa-sk'), c = SEZ[s.__g.cat];
      if (sk && NUOVI.indexOf(s.__g.id) >= 0) sk.textContent = L('Nuovo', 'New') + (c ? ' · ' + L(c[0], c[1]) : '');
      else if (sk && c) sk.textContent = L(c[0], c[1]);
    });
    if (D.rcw) {
      D.rcw.querySelector('.xa-lt').textContent = L('Sfidanti recenti', 'Recent opponents');
      D.rcw.querySelector('.xa-ln').textContent = L('rivincita con un tocco', 'one-tap rematch');
      if (typeof XA.rcDisegna === 'function') XA.rcDisegna();
    }
    var lbl = { wins:L('Vittorie','Wins'), losses:L('Sconfitte','Losses'), earned:L('Guadagni','Earned') };
    var st = D.scr.querySelectorAll('.xa-stats .pvp-stat-lbl');
    if (st.length === 3) { st[0].textContent = lbl.wins; st[1].textContent = lbl.losses; st[2].textContent = lbl.earned; }
    var crea = D.scr.querySelector('.xa-quick .action-btn');
    if (crea) crea.innerHTML = '<span class="xa-qi" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 10v4h3l5 4V6L7 10z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/></svg></span><span class="xa-qt"><b>' + L('Crea una lobby','Create a lobby') + '</b><i>' + L('Invita il tuo gruppo, scegli posti e posta','Invite your group, pick seats and stake') + '</i></span>';
    var rn = D.scr.querySelector('.xa-quick .pvp-rand-name'), rs = D.scr.querySelector('.xa-quick .pvp-rand-sub');
    if (rn) rn.textContent = L('Partita a caso','Random match');
    if (rs) rs.textContent = L('Una ruota sceglie il gioco per te','A wheel picks the game for you');
    var sf = D.scr.querySelector('.xa-quick .xa-sfida');
    if (sf) { sf.querySelector('b').textContent = L('Sfida un amico','Challenge a friend'); sf.querySelector('i').textContent = L('Invito diretto, scegli gioco e posta','Direct invite, pick game and stake'); sf.setAttribute('aria-label', L('Sfida un amico','Challenge a friend')); }
    var ll = D.scr.querySelector('#dl-live .pvp-live-lbl'); if (ll) ll.textContent = L('in linea adesso','online now');
    [].forEach.call(D.scr.querySelectorAll('.pvp-sec-lbl.xa-sublbl'), function(lb){
      if (lb.id === 'pvp-recent-lbl') lb.textContent = L('Avversari recenti','Recent opponents');
      else if (/CHALLENGE|SFIDA/i.test(lb.textContent)) lb.textContent = L('Sfida un amico','Challenge a friend');
    });
    var cb = D.scr.querySelector('.pvp-challenge .pvp-chal-btn'); if (cb) cb.textContent = L('Invia la sfida','Send challenge');
    var cu = document.getElementById('pvp-chal-user'); if (cu) cu.placeholder = L('@nome utente o ID numerico','@username or numeric ID');
  }
  XA.rcDisegna = function(){
    var box = document.getElementById('pvp-recent'); if (!box || !D.rcw) return;
    var lista = (window._dlRecent || []);
    D.rcw.hidden = !lista.length;
    box.innerHTML = lista.map(function(o, i){
      var nm = String((o && o.name) || L('Giocatore', 'Player'));
      var av = (o && o.photo_url)
        ? '<span class="xa-rc-av" data-ini="' + esc(nm.charAt(0).toUpperCase()) + '"><img src="' + esc(o.photo_url) + '" alt="" decoding="async"></span>'
        : '<span class="xa-rc-av xa-rc-av--ini">' + esc(nm.charAt(0).toUpperCase()) + '</span>';
      var es = o && o.last_won ? '<span class="xa-rc-es xa-rc-es--v">' + L('Hai vinto', 'You won') + '</span>'
                               : '<span class="xa-rc-es xa-rc-es--p">' + L('Hai perso', 'You lost') + '</span>';
      return '<div class="pvp-rc-chip xa-rc-c x-lastra x-nosfx" role="button" tabindex="0" onclick="dlRematch(' + i + ')">' + av +
        '<b class="xa-rc-nm">' + esc(nm) + '</b>' + es + '<span class="xa-pill xa-rc-go">' + L('Rivincita', 'Rematch') + '</span></div>';
    }).join('');
    [].forEach.call(box.querySelectorAll('.xa-rc-av img'), function(im){
      var giu = function(){ var a = im.parentNode; if (!a) return; a.classList.add('xa-rc-av--ini'); a.textContent = a.getAttribute('data-ini') || '?'; };
      if (im.complete && !im.naturalWidth) giu(); else im.addEventListener('error', giu, { once:true });
    });
  };
  (function(){
    var vecchio = window.dlRematch;
    if (typeof vecchio !== 'function') return;
    window.dlRematch = function(i){
      var o = (window._dlRecent || [])[i];
      if (!o || typeof dlModalHTML !== 'function' || typeof dlMenuOpts !== 'function' || typeof dlSendRematch !== 'function' || !window.S || !S.userId) return vecchio.apply(this, arguments);
      var nm = String(o.name || L('Giocatore', 'Player')), uid = String(o.uid).replace(/[^0-9]/g, '');
      var lb = function(b){ try { return betLbl(b); } catch(e){ return '€' + b; } };
      var av = o.photo_url ? '<span class="xa-rc-av" data-ini="' + esc(nm.charAt(0).toUpperCase()) + '"><img src="' + esc(o.photo_url) + '" alt=""></span>'
                           : '<span class="xa-rc-av xa-rc-av--ini">' + esc(nm.charAt(0).toUpperCase()) + '</span>';
      var h = '<div class="xa-rm">' + av +
        '<div class="xa-rm-t">' + L('Rivincita con ', 'Rematch ') + esc(nm) + '</div>' +
        '<div class="xa-rm-d">' + L('Riceve la sfida su Telegram e decide se accettare.', 'They get the challenge on Telegram and choose whether to accept.') + '</div>' +
        '<div class="xa-rm-l">' + L('Gioco', 'Game') + '</div><select id="pvp-rm-mode" class="pvp-select">' + dlMenuOpts() + '</select>' +
        '<div class="xa-rm-l">' + L('Posta', 'Stake') + '</div><div class="xa-rm-bets">' +
        [0.5, 1, 2, 5, 10, 25, 50, 100].map(function(b){ return '<button type="button" class="xa-rm-bet" onclick="dlSendRematch(\'' + uid + '\',' + b + ')">' + lb(b) + '</button>'; }).join('') +
        '</div><button type="button" class="xa-rm-x" onclick="dlCloseOverlay()">' + L('Annulla', 'Cancel') + '</button></div>';
      dlModalHTML(h);
      var im = document.querySelector('#pvp-modal .xa-rm .xa-rc-av img');
      if (im) im.addEventListener('error', function(){ var a = im.parentNode; a.classList.add('xa-rc-av--ini'); a.textContent = a.getAttribute('data-ini') || '?'; }, { once:true });
    };
  })();
  (function(){
    var guarda = function(){
      var box = document.getElementById('pvp-recent'); if (!box || box.__xaRc || !window.MutationObserver) return !!box;
      box.__xaRc = 1;
      new MutationObserver(function(){
        if (!D.rcw || box.__xaIo) return;
        if (box.querySelector('.pvp-rc-chip:not(.xa-rc-c)') || (!box.children.length && !D.rcw.hidden)) {
          box.__xaIo = 1; try { XA.rcDisegna(); } finally { box.__xaIo = 0; }
        }
      }).observe(box, { childList:true });
      return true;
    };
    if (!guarda()) document.addEventListener('DOMContentLoaded', guarda);
  })();
  function disegnaSeg(){
    if (!D.seg) return;
    D.seg.innerHTML = CATS.map(function(c){
      var n = visibili(c[0]); if (c[0] !== 'all' && !n) return '';
      return '<button type="button" role="tab" data-x-silent data-cat="' + c[0] + '" class="' + (c[0] === XA.filtro ? 'on' : '') + '" aria-selected="' + (c[0] === XA.filtro) + '">' +
        L(c[1], c[2]) + ' <span class="xa-sn x-num">' + n + '</span></button>';
    }).join('');
  }
  function applicaFiltro(){
    var f = XA.filtro;
    ORDINE.forEach(function(k){ var s = D.secs[k]; if (s) s.classList.toggle('xa-x', !(f === 'all' || k === f)); });
    D.scr.classList.toggle('xa-filtrato', f !== 'all');
  }
  function filtra(cat, utente){
    if (!D.list || cat === XA.filtro) return;
    XA.filtro = cat;
    if (utente) fx('tick');
    [].forEach.call(D.seg.children, function(b){ var on = b.getAttribute('data-cat') === cat; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
    var b = D.seg.querySelector('button.on');
    if (b) { try { D.seg.scrollTo({ left: b.offsetLeft - (D.seg.clientWidth - b.offsetWidth) / 2, behavior: 'smooth' }); } catch(e){} }
    var lite = window.GBX && GBX.lite && GBX.lite();
    var cambia = function(){
      applicaFiltro();
      var gc = D.gc, top = D.segw.offsetTop;
      if (gc.scrollTop > top) gc.scrollTop = top;
      if (!lite && D.list.animate) D.list.animate([{ opacity:0, transform:'translateY(14px)' }, { opacity:1, transform:'none' }], { duration:320, easing:'cubic-bezier(.2,.8,.2,1)' });
    };
    if (!lite && D.list.animate) {
      var a = D.list.animate([{ opacity:1, transform:'none' }, { opacity:0, transform:'translateY(-6px)' }], { duration:120, easing:'ease-in', fill:'forwards' });
      a.onfinish = function(){ cambia(); a.cancel(); };
    } else cambia();
  }
  XA.filtra = function(c){ filtra(c, false); };
  var FR = [['arc','arc-body'], ['turf','tw-body'], ['tank','tk-body'], ['glad','gld-body']];
  function giocoDi(scr, body){
    var mg = body.querySelector(':scope > .mg-sc'); if (mg && mg.getAttribute('data-g')) return mg.getAttribute('data-g');
    if (scr.id === 'arc') { var r = ''; try { r = (typeof RTD !== 'undefined' && RTD && RTD.game) || window.RTD_GAME || ''; } catch(e){} return String(r || ''); }
    return scr.id;
  }
  function lastreFr(scr, nuove){
    (scr.__xaL || []).forEach(function(x){ try { GBX.untilt(x); } catch(e){} });
    scr.__xaL = nuove || [];
    scr.__xaL.forEach(function(x){ try { GBX.lastra(x); GBX.tilt(x); } catch(e){} });
  }
  function statoFr(scr, body){
    var k = '';
    if (body.querySelector(':scope > .mg-sc')) k = 'mg';
    else if (body.querySelector(':scope > .tw-search-t, :scope > .gbf')) k = 'srch';
    else if (body.querySelector(':scope > .tw-hero, :scope > .gld-splash, :scope > .tw-tiers')) k = 'menu';
    scr.classList.toggle('xa-fr', !!k);
    scr.classList.toggle('xa-menu', k === 'menu' || k === 'mg');
    scr.classList.toggle('xa-mg', k === 'mg');
    scr.classList.toggle('xa-srch', k === 'srch');
    var hdr = scr.querySelector(':scope > .game-hdr'); if (hdr) hdr.classList.toggle('x-navf', !!k);
    if (!k) { lastreFr(scr, []); try { GBX.untilt(scr); } catch(e){} lasciaMenu(body); scheda(scr, body, '', false); return; }
    if (hdr) { var gt = hdr.querySelector('.game-title'); if (gt) noEmo(gt); }
    if (k === 'srch') { lasciaMenu(body); scheda(scr, body, '', false); }
    [].forEach.call(body.querySelectorAll('.tw-tiers'), function(t){ if (t.querySelector(':scope > .tw-tier[data-t]')) t.classList.add('xa-fiches'); });
    var pan = [].slice.call(body.querySelectorAll('.tw-rules, .mg-pan, .twr-prize'));
    pan.forEach(function(s){ s.classList.add('x-lastra'); });
    lastreFr(scr, pan.slice(0, 4));
    guardaMenu(scr, body);
    try { scheda(scr, body, giocoDi(scr, body), true); } catch(e){ try { console.warn('XA scheda', e); } catch(_){} }
    var g = giocoDi(scr, body);
    if (!g) return;
    g = gioco(g);
    var bg = body.querySelector(':scope > .mg-sc .mg-hero .mg-bg');
    if (bg && !bg.__xa) { bg.__xa = 1; prova(BAN(g), function(ok){ if (ok && bg.isConnected) { bg.style.backgroundImage = 'url("' + BAN(g) + '")'; bg.classList.add('xa-bn'); } }); }
    var hero = body.querySelector(':scope > .tw-hero, :scope > .gld-splash');
    if (hero && !hero.querySelector('.xa-fico')) {
      prova(ICO(g), function(ok){
        if (!ok || !hero.isConnected || hero.querySelector('.xa-fico')) return;
        var f = el('span', 'xa-fico', '<img src="' + ICO(g) + '" alt="" width="72" height="72" decoding="async">');
        hero.insertBefore(f, hero.firstChild); hero.classList.add('xa-conico');
      });
    }
  }
  var SVG_IC = {
    dito:'<path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10m0-1.5a1.5 1.5 0 0 1 3 0V11m0-1a1.5 1.5 0 0 1 3 0v4.5a5.5 5.5 0 0 1-5.5 5.5h-.5a5 5 0 0 1-4.2-2.3L5.6 14a1.5 1.5 0 0 1 2.4-1.8L9 13.5"/>',
    fulmine:'<path d="M13 2.5 5 13.5h6l-1 8 8-11h-6z"/>',
    curva:'<path d="M4 19c1.5-8 6-12.5 15-13"/><path d="M15.5 3 19 6l-3.5 3"/>',
    pillola:'<rect x="2.8" y="8.8" width="18.4" height="6.4" rx="3.2" transform="rotate(-38 12 12)"/><path d="M9.6 8.7l4.8 6.6"/>',
    scudo:'<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8 7.5 9.5 4.3-1.5 7.5-4.9 7.5-9.5V6z"/>',
    joystick:'<rect x="3" y="13.5" width="18" height="7" rx="3"/><path d="M12 13.5V8.5"/><circle cx="12" cy="6" r="2.5"/>',
    rimbalzo:'<path d="M3 5l6.5 13L14 9l7 9"/><circle cx="14" cy="5" r="1.6"/>',
    cassa:'<path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/>',
    regalo:'<rect x="3.5" y="9" width="17" height="11.5" rx="2"/><path d="M2.5 9h19M12 9v11.5M12 9c-1.5-4-6-4.5-6-2s4 2 6 2c2 0 6 .5 6-2s-4.5-2-6 2"/>',
    fiamma:'<path d="M12 21c-4 0-6.5-2.7-6.5-6.2 0-4.3 4-6.3 4.5-11.3 3 2 3.2 5 3 7 1-1 1.8-2.3 2-3.5 2 2 3.5 4.5 3.5 7.8 0 3.5-2.5 6.2-6.5 6.2z"/>',
    coppa:'<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v1.5A3.5 3.5 0 0 0 7.5 11M17 6h3v1.5A3.5 3.5 0 0 1 16.5 11M12 14v4M8.5 20.5h7"/>',
    dado:'<rect x="4" y="4" width="16" height="16" rx="3.5"/><circle cx="9" cy="9" r="1.1"/><circle cx="15" cy="15" r="1.1"/><circle cx="15" cy="9" r="1.1"/><circle cx="9" cy="15" r="1.1"/>',
    moneta:'<circle cx="12" cy="12" r="8.5"/><path d="M14.6 9.3a3 3 0 1 0 0 5.4M8 11h5M8 13h5"/>',
    mira:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".9"/>',
    tempo:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9.5 2.5h5"/>',
    persone:'<circle cx="9" cy="8.5" r="3.2"/><path d="M3 19.5c.8-3.3 3.2-5 6-5s5.2 1.7 6 5"/><circle cx="17" cy="9.5" r="2.5"/><path d="M16.5 14.6c2.3.2 3.9 1.7 4.5 4.4"/>',
    carte:'<rect x="3.5" y="6" width="11" height="15" rx="2" transform="rotate(-10 9 13.5)"/><rect x="9.5" y="4" width="11" height="15" rx="2"/>',
    spade:'<path d="M5 4.5l3.6.6 10.3 10.3-3 3L5.6 8.1z"/><path d="M19 4.5l-3.6.6L5.1 15.4l3 3L18.4 8.1z"/><path d="M6.5 17.5l-2 2M17.5 17.5l2 2"/>',
    stella:'<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
    parla:'<path d="M4 5.5h16v10H9.5L5 19.5v-4H4z"/>',
    auto:'<path d="M3.5 15.5v-3l2-5h13l2 5v3z"/><circle cx="7.5" cy="16.5" r="1.8"/><circle cx="16.5" cy="16.5" r="1.8"/>',
    robot:'<rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 8V4.5M9.5 13h.01M14.5 13h.01M9.5 16h5"/>',
    libro:'<path d="M4 5.5c3-1.3 5.7-1.3 8 .5 2.3-1.8 5-1.8 8-.5v13c-3-1.3-5.7-1.3-8 .5-2.3-1.8-5-1.8-8-.5z"/><path d="M12 6v13"/>',
    pennello:'<path d="M14.5 4.5l5 5-8 8-5-5z"/><path d="M6.5 12.5 4 20l7.5-2.5"/>'
  };
  var EMO_IC = { '1F446':'dito', '261D':'dito', '26A1':'fulmine', '1F300':'curva', '1F48A':'pillola', '1F6E1':'scudo', '1F579':'joystick', '1F3AE':'joystick',
    '1F3B1':'rimbalzo', '1F4E6':'cassa', '1F381':'regalo', '1F525':'fiamma', '1F3C6':'coppa', '1F947':'coppa', '1F3B2':'dado', '1F4B0':'moneta', '1F4B6':'moneta', '1F4B8':'moneta',
    '1F3AF':'mira', '1F52B':'mira', '23F1':'tempo', '23F0':'tempo', '231B':'tempo', '1F465':'persone', '1F464':'persone', '1F3B4':'carte', '1F0CF':'carte', '1F0A1':'carte', '2660':'carte',
    '2694':'spade', '1F5E1':'spade', '1F680':'fulmine', '1F4A5':'stella', '2B50':'stella', '1F31F':'stella', '2728':'stella', '1F916':'robot', '1F4AC':'parla', '1F697':'auto', '1F3CE':'auto', '1F4D6':'libro' };
  var PAROLE_IC = [[/JOYSTICK|DITO|TOCCA|TRASCINA/i,'dito'], [/ARM[IA]|ARSENALE|ATTACCO|SPADA|COLTELLO|FENDENTE/i,'spade'], [/PARR|SCUDO|DIFES/i,'scudo'],
    [/CART[AE]|MAZZO|IMPILA|SCARTA/i,'carte'], [/AUTO|GUIDA|PISTA|DERAPA/i,'auto'], [/EVENT|BOOST|TURBO|VELOC/i,'fulmine'], [/ARENA|ZONA|LAVA|BRUCIA|FUOCO/i,'fiamma'],
    [/SPECIAL|POTERE|SUPER/i,'stella'], [/UNO!|ANNUNC|PARLA|VOTO|ACCUS/i,'parla'], [/VINC|PREMIO|PIATTO/i,'coppa'], [/DAD[OI]/i,'dado'], [/TEMPO|OROLOG|SECOND/i,'tempo'], [/SQUADR|AMIC|GRUPPO/i,'persone']];
  var XN_IC = { trofeo:'coppa', moneta:'moneta', spade:'spade', fulmine:'fulmine', stella:'stella', fiamma:'fiamma', bersaglio:'mira', carte:'carte', carta:'carte',
    dadi:'dado', persona:'persone', persone:'persone', scudo:'scudo', tempo:'tempo', clessidra:'tempo', regalo:'regalo', libro:'libro', robot:'robot', mano:'dito',
    pacco:'cassa', biliardo:'rimbalzo', palla:'rimbalzo', auto:'auto', razzo:'fulmine', spirale:'curva', pillola:'pillola', pistola:'mira', scoppio:'stella',
    messaggio:'parla', bomba:'fiamma', pugno:'spade', corona:'coppa', diamante:'stella', megafono:'parla', scacchiera:'carte', pedone:'joystick' };
  function svgIc(k){ return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (SVG_IC[k] || SVG_IC.stella) + '</svg>'; }
  function icRegola(emo, titolo, i, xn){
    var k = xn ? (XN_IC[xn] || '') : '';
    if (!k && emo) { var c = String(emo).codePointAt(0); if (c) k = EMO_IC[c.toString(16).toUpperCase()] || ''; }
    if (!k) for (var j = 0; j < PAROLE_IC.length; j++) if (PAROLE_IC[j][0].test(titolo || '')) { k = PAROLE_IC[j][1]; break; }
    return '<span class="xa-ri" aria-hidden="true">' + (k ? svgIc(k) : '<i>' + (i + 1) + '</i>') + '</span>';
  }
  function pulito(s){ return String(s == null ? '' : s).replace(RE_EMO, '').replace(/\s{2,}/g, ' ').replace(/^[\s—–\-·:]+/, '').trim(); }
  function frase(s){
    s = pulito(s);
    if (s && s === s.toUpperCase() && /[A-ZÀ-Ú]{3}/.test(s)) { s = s.toLowerCase(); s = s.charAt(0).toUpperCase() + s.slice(1); }
    return s.replace(/\bvs bot\b/i, 'contro i bot');
  }
  function soldiT(t){ t = Number(t) || 0; return '€' + (t < 1 ? t.toFixed(2) : (Math.round(t) === t ? String(t) : t.toFixed(2))); }
  function testoSenza(el, via){ var c = el.cloneNode(true); [].forEach.call(c.querySelectorAll(via), function(x){ x.remove(); }); return c.textContent; }
  var CHAL_DI = { sumo:1, pong:1, shove:1, alley:1, dama:1, damaru:1, backg:1, scopa:1, snake:1, basket:1, archery:1, draw:1, golf:1, boxe:1, burraco:1, tank:1, pool8:1, pool15:1, dice:1, rps:1, rr:1, bs:1, chess:1 };
  XA.sfidaAmico = function(modo){
    try { go('duel'); } catch(e){ return; }
    setTimeout(function(){
      var q = document.querySelector('#duel .xa-quick'), s = document.getElementById('pvp-chal-mode');
      if (s && [].some.call(s.options, function(o){ return o.value === modo; })) s.value = modo;
      if (q) { q.classList.add('xa-chal-on'); var r = q.querySelector('.xa-sfida'); if (r) r.setAttribute('aria-expanded', 'true'); q.scrollIntoView({ block:'center', behavior:'smooth' }); }
    }, 260);
  };
  function chalDi(g){
    var s = document.getElementById('pvp-chal-mode');
    return !!(CHAL_DI[g] && s && [].some.call(s.options, function(o){ return o.value === g; }));
  }
  function leggiMenu(body){
    var m = { az:[], regole:[], seg:[], righe:[], fiches:[], note:[], sec:[] };
    var mg = body.querySelector(':scope > .mg-sc');
    var add = function(el){ m.az.push(el); return m.az.length - 1; };
    if (mg) {
      m.tipo = 'm'; m.sc = mg;
      var tg = mg.querySelector('.mg-tag'); m.sub = tg ? pulito(tg.textContent) : '';
      [].forEach.call(mg.querySelectorAll('.mg-feat > div'), function(d){
        var b = d.querySelector('b'); m.regole.push({ titolo: frase(b ? b.textContent : ''), testo: pulito(testoSenza(d, 'b')), emo:'' });
      });
      var ex = mg.querySelector('.mg-extra');
      if (ex) {
        [].forEach.call(ex.querySelectorAll('.mg-mazzi, .mg-scelte'), function(gr){
          var lb = gr.previousElementSibling && gr.previousElementSibling.classList.contains('mg-lbl') ? frase(gr.previousElementSibling.textContent) : L('Modalità', 'Mode');
          m.seg.push({ lbl: lb, voci: [].map.call(gr.querySelectorAll('.mg-modo'), function(b){ var t = b.querySelector('.mg-mt'); return { i: add(b), t: frase(t ? t.textContent : b.textContent), sel: b.classList.contains('sel') }; }) });
        });
        [].forEach.call(ex.querySelectorAll('.action-btn, .twr-editbtn'), function(b, j){
          var sp = b.querySelector('span'), t = frase(testoSenza(b, 'span'));
          if (b.classList.contains('tut2011-btn')) { m.tut = add(b); return; }
          if (!m.regoleBtn && b.classList.contains('action-btn') && /GIOCA|COMBATT|REGOL|ISTRUZ/i.test(b.textContent)) { m.regoleBtn = add(b); return; }
          m.righe.push({ i: add(b), t: t, s: sp && !/NUOVO/i.test(sp.textContent) ? frase(sp.textContent) : '', ic: b.classList.contains('twr-editbtn') ? 'pennello' : 'libro' });
        });
      }
      m.modi = {};
      [].forEach.call(mg.querySelectorAll('#mg-modi > .mg-modo[data-m]'), function(b){ m.modi[b.getAttribute('data-m')] = b; if (b.classList.contains('sel')) m.modo = b.getAttribute('data-m'); });
      var pan = mg.querySelector('#mg-pan');
      if (pan) {
        [].forEach.call(pan.querySelectorAll('.mg-fiche[data-t]'), function(b){ m.fiches.push({ i: add(b), t: Number(b.getAttribute('data-t')), sel: b.classList.contains('sel') }); });
        var cta = pan.querySelector('#mg-cta, .mg-cta'); if (cta) { m.cta = cta; m.ctaOff = cta.classList.contains('spento'); m.ctaTxt = frase(cta.textContent); }
        var lob = pan.querySelector('.mg-lob'); if (lob) m.lob = lob;
        var rp = pan.querySelector('.mg-riep'); if (rp) m.riep = rp;
        [].forEach.call(pan.querySelectorAll('.mg-nota'), function(n){ m.note.push(pulito(n.textContent)); });
      }
      var cas = mg.querySelector('.mg-cas'); if (cas) m.note.push(pulito(cas.textContent));
    } else {
      m.tipo = 'c';
      var hs = body.querySelector('.tw-hero-s'); m.sub = hs ? pulito(hs.textContent) : '';
      [].forEach.call(body.querySelectorAll('.tw-rules .tw-rule'), function(r){
        var ic = r.querySelector('.ic'), b = r.querySelector('b'), sp = r.querySelector('span:not(.ic)');
        var xi = ic ? ic.querySelector('.xn-ic[data-i]') : null;
        m.regole.push({ emo: ic ? ic.textContent.trim() : '', xn: xi ? xi.getAttribute('data-i') : '', titolo: frase(b ? b.textContent : ''), testo: pulito(sp ? testoSenza(sp, 'b') : '') });
      });
      [].forEach.call(body.querySelectorAll('.tw-tiers'), function(tt){
        var bb = tt.querySelectorAll(':scope > .tw-tier');
        if (tt.querySelector(':scope > .tw-tier[data-t]')) [].forEach.call(bb, function(b){ m.fiches.push({ i: add(b), t: Number(b.getAttribute('data-t')), sel: b.classList.contains('sel'), txt: pulito(b.textContent) }); });
        else {
          var pr = tt.previousElementSibling, lb = pr && pr.classList.contains('section-ttl') ? frase(pr.textContent) : L('Modalità', 'Mode');
          m.seg.push({ lbl: lb, voci: [].map.call(bb, function(b){ return { i: add(b), t: frase(b.textContent), sel: b.classList.contains('sel') }; }) });
        }
      });
      [].forEach.call(body.querySelectorAll(':scope > .action-btn, :scope > button, :scope > .tw-btns > button, :scope > .pvp-m-btn'), function(b){
        var oc = b.getAttribute('onclick') || '';
        if (b.classList.contains('tw-tier')) return;
        if (b.classList.contains('tut2011-btn')) { m.tut = add(b); return; }
        if (!m.gioca && (b.classList.contains('gold') || /Join\(|Gioca\(|Play\(|dlStart|dlGo|dlQueue/.test(oc))) { m.gioca = add(b); return; }
        if (b.classList.contains('train-btn') || /practiceStart|Allena/i.test(oc)) { m.allena = add(b); return; }
        if (/lobOpenCreate/.test(oc)) { m.lobby = add(b); return; }
        m.sec.push({ i: add(b), t: frase(b.textContent) });
      });
      [].forEach.call(body.querySelectorAll(':scope > .tw-note, :scope > .tw-hint'), function(n){ var t = pulito(n.textContent); if (t) m.note.push(t); });
    }
    return m;
  }
  function apSheet(titolo, regole, note){
    var o = el('div', 'xa-sheet', '<div class="xa-sheet-p" role="dialog" aria-modal="true"><div class="xa-sheet-h"><b></b><button type="button" class="xa-sheet-x">' + L('Fine', 'Done') + '</button></div><div class="xa-sheet-c"><div class="xa-ap-grp"></div><div class="xa-sheet-n"></div></div></div>');
    o.querySelector('b').textContent = titolo;
    o.querySelector('.xa-ap-grp').innerHTML = regole.map(function(r, i){ return '<div class="xa-ap-r">' + icRegola(r.emo, r.titolo, i, r.xn) + '<span class="xa-ap-rt"><b>' + esc(r.titolo) + '</b><span>' + esc(r.testo) + '</span></span></div>'; }).join('');
    o.querySelector('.xa-sheet-n').innerHTML = note.map(function(n){ return '<p>' + esc(n) + '</p>'; }).join('');
    var chiudi = function(){ o.classList.remove('on'); setTimeout(function(){ o.remove(); }, 260); try { GBX.fx('back'); } catch(e){} };
    o.addEventListener('click', function(e){ if (e.target === o || e.target.closest('.xa-sheet-x')) chiudi(); });
    document.body.appendChild(o); requestAnimationFrame(function(){ o.classList.add('on'); });
    try { GBX.fx('open'); } catch(e){}
  }
  function scheda(scr, body, g, menu){
    var vec = body.querySelector(':scope > .xa-ap');
    if (!menu || !g) { if (vec) vec.remove(); body.classList.remove('xa-ap-on'); scr.classList.remove('xa-ap-scr'); return; }
    var m = leggiMenu(body);
    if (!m.fiches.length && !m.modi && m.gioca == null) { if (vec) vec.remove(); body.classList.remove('xa-ap-on'); return; }
    if (m.tipo === 'm' && m.sc && !m.sc.__xaAuto) {
      m.sc.__xaAuto = 1;
      if (m.modo !== 'gratis' && m.modo !== 'soldi') { var pr = m.modi.gratis || m.modi.soldi; if (pr) { pr.click(); return; } }
    }
    var gv = gioco(g);
    var gi = null; (D.giochi || []).forEach(function(x){ if ((x.id === g || x.id === gv) && !gi) gi = x; });
    var nome = NOMI[g] ? NOMI[g][0] : NOMI[gv] ? NOMI[gv][0] : (gi && gi.nome ? frase(gi.nome) : (nomeG(g) || L('Gioco', 'Game')));
    var sub = m.sub || (NOMI[g] ? L(NOMI[g][1], NOMI[g][2]) : NOMI[gv] ? L(NOMI[gv][1], NOMI[gv][2]) : '');
    var meta = [];
    if (gi && gi.dur) meta.push('<span>' + esc(gi.dur) + '</span>');
    var h = '';
    h += '<div class="xa-ap-ban' + (XA.img[BAN(gv)] === true ? ' xa-ap-ban--ok' : '') + '" aria-hidden="true"><img class="xa-ap-bi" src="' + ICO(gv) + '" alt=""><img class="xa-ap-bb" src="' + BAN(gv) + '" alt="" decoding="async"></div>';
    h += '<div class="xa-ap-hd"><span class="xa-ap-ic"><img src="' + ICO(gv) + '" alt="" width="64" height="64" decoding="async"></span><div class="xa-ap-ht"><h1></h1><p></p><small class="xa-ap-meta">' + meta.join('') + (gi ? datHtml(gi) : '') + '</small></div></div>';
    m.seg.forEach(function(s){
      h += '<h2 class="xa-ap-sez">' + esc(s.lbl) + '</h2><div class="xa-ap-seg" role="radiogroup">' + s.voci.map(function(v){ return '<button type="button" data-xi="' + v.i + '" class="' + (v.sel ? 'sel' : '') + '" role="radio" aria-checked="' + v.sel + '">' + esc(v.t) + '</button>'; }).join('') + '</div>';
    });
    if (m.regole.length) {
      h += '<h2 class="xa-ap-sez">' + L('Come si gioca', 'How to play') + '</h2><div class="xa-ap-grp">';
      m.regole.slice(0, 4).forEach(function(r, i){ h += '<div class="xa-ap-r">' + icRegola(r.emo, r.titolo, i, r.xn) + '<span class="xa-ap-rt"><b>' + esc(r.titolo) + '</b><span>' + esc(r.testo) + '</span></span></div>'; });
      h += '<button type="button" class="xa-ap-r xa-ap-more" data-xa="regole"><span class="xa-ri xa-ri--l" aria-hidden="true">' + svgIc('libro') + '</span><span class="xa-ap-rt"><b>' + L('Regole complete', 'Full rules') + '</b></span></button></div>';
    }
    if (m.righe.length) {
      h += '<div class="xa-ap-grp xa-ap-grp2">' + m.righe.map(function(r){ return '<button type="button" class="xa-ap-r xa-ap-more" data-xi="' + r.i + '"><span class="xa-ri xa-ri--l" aria-hidden="true">' + svgIc(r.ic) + '</span><span class="xa-ap-rt"><b>' + esc(r.t) + '</b>' + (r.s ? '<span>' + esc(r.s) + '</span>' : '') + '</span></button>'; }).join('') + '</div>';
    }
    var posta = '', tiers = m.fiches.slice(), selT = null, gratisSel = false;
    if (m.tipo === 'm') {
      if (m.modi.gratis) { gratisSel = m.modo === 'gratis'; posta += '<button type="button" class="xa-fi xa-fi--g' + (gratisSel ? ' sel' : '') + '" data-xa="gratis">' + L('Gratis', 'Free') + '</button>'; }
      if (m.modi.soldi) {
        if (!tiers.length) tiers = (window.TWR_TIERS || []).map(function(x){ return { t: Number(x[0]), sel:false, finta:true }; });
        tiers.forEach(function(f){ var s = m.modo === 'soldi' && f.sel; if (s) selT = f.t; posta += '<button type="button" class="xa-fi' + (s ? ' sel' : '') + '" ' + (f.finta ? 'data-xt="' + f.t + '"' : 'data-xi="' + f.i + '"') + '>' + soldiT(f.t) + '</button>'; });
      }
    } else tiers.forEach(function(f){ if (f.sel) selT = f.t; posta += '<button type="button" class="xa-fi' + (f.sel ? ' sel' : '') + '" data-xi="' + f.i + '">' + soldiT(f.t) + '</button>'; });
    if (posta) h += '<h2 class="xa-ap-sez">' + L('Posta', 'Stake') + '</h2><div class="xa-ap-fi">' + posta + '</div>';
    if (m.riep) h += '<p class="xa-ap-info">' + esc(pulito(m.riep.textContent).replace(/\s*·\s*/g, ' · ')) + '</p>';
    if (m.lob && (m.modo === 'gratis' || m.modo === 'amici')) h += '<div class="xa-ap-lob"></div>';
    m.note.forEach(function(n){ if (n) h += '<p class="xa-ap-nota">' + esc(n) + '</p>'; });
    var go = '', goOff = false;
    if (m.tipo === 'm') {
      if (m.modo === 'soldi') { goOff = m.ctaOff; go = goOff ? (m.ctaTxt || L('Non disponibile', 'Unavailable')) : L('Gioca', 'Play') + (selT != null ? ' · ' + soldiT(selT) : ''); }
      else if (m.modo === 'gratis') go = L('Gioca gratis', 'Play for free');
    } else if (m.gioca != null) go = L('Gioca', 'Play') + (selT != null ? ' · ' + soldiT(selT) : '');
    var sec = [];
    if (m.tipo === 'm') { if (m.modi.allena) sec.push(['allena', L('Allenati coi bot', 'Practice with bots')]); }
    else if (m.allena != null) sec.push(['xi' + m.allena, L('Allenati coi bot', 'Practice with bots')]);
    if (chalDi(g)) sec.push(['sfida', L('Sfida un amico', 'Challenge a friend')]);
    if (m.tipo === 'm') { if (m.modi.amici) sec.push(['amici', L('Crea una lobby', 'Create a lobby')]); }
    else if (m.lobby != null) sec.push(['xi' + m.lobby, L('Crea una lobby', 'Create a lobby')]);
    m.sec.forEach(function(s){ sec.push(['xi' + s.i, s.t]); });
    if (m.tut != null) sec.push(['xi' + m.tut, L('Tutorial', 'Tutorial')]);
    h += '<div class="xa-ap-bar">' + (go ? '<button type="button" class="xa-ap-go' + (goOff ? ' off' : '') + '" data-xa="gioca">' + esc(go) + '</button>' : '') +
      (sec.length ? '<div class="xa-ap-sec">' + sec.map(function(s){ return '<button type="button" data-xa="' + s[0] + '">' + esc(s[1]) + '</button>'; }).join('') + '</div>' : '') + '</div>';
    var ap = el('div', 'xa-ap'); ap.innerHTML = h;
    ap.querySelector('h1').textContent = nome; ap.querySelector('.xa-ap-ht p').textContent = sub;
    if (m.lob && ap.querySelector('.xa-ap-lob')) { var cl = m.lob.cloneNode(true); cl.removeAttribute('id'); noEmo(cl); ap.querySelector('.xa-ap-lob').appendChild(cl); }
    var bb = ap.querySelector('.xa-ap-bb'), ban = ap.querySelector('.xa-ap-ban');
    bb.addEventListener('load', function(){ XA.img[BAN(gv)] = true; ban.classList.add('xa-ap-ban--ok'); }, { once:true });
    bb.addEventListener('error', function(){ XA.img[BAN(gv)] = false; bb.remove(); }, { once:true });
    if (XA.img[BAN(gv)] === false) bb.remove();
    var vero = function(i){ var b = m.az[i]; if (b && b.isConnected) b.click(); };
    var dopo = function(test, fai, n){ n = n || 0; var b = test(); if (b) { fai(b); return; } if (n < 12) setTimeout(function(){ dopo(test, fai, n + 1); }, 40); };
    var panCta = function(re){ return function(){ var c = document.querySelector('#' + scr.id + ' #mg-pan .mg-cta'); return c && re.test(c.getAttribute('onclick') || '') ? c : null; }; };
    ap.addEventListener('click', function(e){
      var t = e.target.closest('[data-xi], [data-xa], [data-xt]'); if (!t || !ap.contains(t)) return;
      var xi = t.getAttribute('data-xi'), xa = t.getAttribute('data-xa'), xt = t.getAttribute('data-xt');
      if (xi != null) { vero(Number(xi)); return; }
      if (xt != null) { if (m.modi.soldi) { m.modi.soldi.click(); dopo(function(){ return document.querySelector('#' + scr.id + ' #mg-pan .mg-fiche[data-t="' + xt + '"]'); }, function(b){ b.click(); }); } return; }
      if (xa === 'regole') { if (m.regoleBtn != null) vero(m.regoleBtn); else apSheet(nome, m.regole, m.note); return; }
      if (xa === 'gratis') { if (m.modi.gratis) m.modi.gratis.click(); return; }
      if (xa === 'gioca') { if (m.tipo === 'm') { if (m.cta && m.cta.isConnected) m.cta.click(); } else vero(m.gioca); return; }
      if (xa === 'allena') { m.modi.allena.click(); dopo(panCta(/mgAllena/), function(b){ b.click(); }); return; }
      if (xa === 'amici') { m.modi.amici.click(); dopo(panCta(/mgCreaLobby\([^)]*false/), function(b){ b.click(); }); return; }
      if (xa === 'sfida') { XA.sfidaAmico(g); return; }
      if (xa && xa.indexOf('xi') === 0) vero(Number(xa.slice(2)));
    });
    var st = body.scrollTop;
    if (vec) vec.replaceWith(ap); else body.insertBefore(ap, body.firstChild);
    body.classList.add('xa-ap-on'); scr.classList.add('xa-ap-scr');
    body.scrollTop = st;
    lastreFr(scr, []);
    var tt = scr.querySelector(':scope > .game-hdr .game-title'); if (tt) noEmo(tt);
  }
  function guardaMenu(scr, body){
    if (body.__xaMo) return;
    var rif = 0;
    body.__xaMo = new MutationObserver(function(rs){
      for (var i = 0; i < rs.length; i++) {
        var t = rs[i].target, dentro = t.closest ? t.closest('.xa-ap') : null;
        if (t === body) continue;
        if (!dentro) { if (!rif) rif = requestAnimationFrame(function(){ rif = 0; if (scr.classList.contains('xa-menu')) scheda(scr, body, giocoDi(scr, body), true); }); return; }
      }
    });
    body.__xaMo.observe(body, { childList:true, subtree:true, attributes:true, attributeFilter:['class'] });
  }
  XA._scheda = function(id, b){ var scr = document.getElementById(id), body = document.getElementById(b); return scheda(scr, body, giocoDi(scr, body), true); };
  XA._leggi = function(b){ var m = leggiMenu(document.getElementById(b)); return JSON.stringify({ tipo:m.tipo, f:m.fiches.length, g:m.gioca, a:m.allena, l:m.lobby, r:m.regole.length, s:m.seg.length, sec:m.sec.length }); };
  function lasciaMenu(body){ if (body.__xaMo) { body.__xaMo.disconnect(); body.__xaMo = null; } }
  function montaFr(){
    FR.forEach(function(p){
      var scr = document.getElementById(p[0]), body = document.getElementById(p[1]);
      if (!scr || !body || body.__xa) return; body.__xa = 1;
      statoFr(scr, body);
      var soloAp = function(n){ return n.nodeType === 1 && n.classList.contains('xa-ap'); };
      try { new MutationObserver(function(rs){
        if (rs.every(function(r){ return [].every.call(r.addedNodes, soloAp) && [].every.call(r.removedNodes, soloAp); })) return;
        statoFr(scr, body);
      }).observe(body, { childList:true }); } catch(e){}
      body.addEventListener('pointerdown', function(e){
        if (!scr.classList.contains('xa-fr')) return;
        var t = e.target.closest ? e.target.closest('.tw-tier, .mg-fiche, .mg-modo') : null; if (!t) return;
        if (t.matches('.tw-tier[data-t], .mg-fiche')) { try { GBX.sfx('chip'); GBX.hap('light'); } catch(_){} }
        else if (t.matches('.mg-modo')) { try { GBX.sfx('tick'); } catch(_){} }
        else { try { GBX.sfx('tick'); GBX.hap('sel'); } catch(_){} }
      }, { passive:true });
    });
  }
  var RE_EMO = /(?:[\u{1F000}-\u{1FAFF}\u{2600}-\u{2604}\u{2607}-\u{2712}\u{2714}\u{2716}-\u{27BF}\u{2B00}-\u{2BFF}\u{2300}-\u{23FF}\u{25A0}-\u{25FF}\u{1F1E6}-\u{1F1FF}][\u{FE0F}\u{200D}\u{20E3}]*)+|[\u{FE0F}\u{20E3}]/gu;
  var RE_EMO1 = new RegExp(RE_EMO.source, 'u');
  function noEmo(root){
    if (!root) return 0;
    var n = 0, w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: function(t){
      var p = t.parentNode && t.parentNode.nodeName;
      return (p === 'SCRIPT' || p === 'STYLE' || p === 'TEXTAREA') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
    } }), t, v, nv;
    while ((t = w.nextNode())) {
      v = t.nodeValue; if (!v || !RE_EMO1.test(v)) continue;
      nv = v.replace(/✖️?/g, '✕').replace(RE_EMO, '');
      if (RE_EMO1.test(v.trim().slice(0, 2))) nv = nv.replace(/^\s+/, '');
      nv = nv.replace(/[  ]{2,}/g, ' ');
      if (nv !== v) { t.nodeValue = nv; n++; }
    }
    return n;
  }
  XA.noEmo = noEmo;
  var NOMI_LOB = { uno:['UNO No Mercy','UNO No Mercy'], unoc:['UNO','UNO'], pool15:['Biliardo 8-15','Pool 8-15'], damaru:['Dama russa','Russian checkers'],
    dama:['Dama italiana','Italian checkers'], ch:['Scacchi','Chess'], rps:['Morra cinese','Rock paper scissors'], cucu:['Cucù','Cucù'] };
  function codLob(c){ c = String(c || ''); try { if (window.LOB_CODE_ALIAS && LOB_CODE_ALIAS[c]) c = LOB_CODE_ALIAS[c]; } catch(e){} return c; }
  function nomeLob(c, grezzo){
    c = codLob(c); var k = gioco(c);
    if (NOMI_LOB[c]) return L(NOMI_LOB[c][0], NOMI_LOB[c][1]);
    if (NOMI[k]) return NOMI[k][0];
    if (nomeG(c)) return nomeG(c);
    return String(grezzo || L('Gioco', 'Game')).toLowerCase().replace(/(^|\s)([a-zà-ú])/g, function(m, a, b){ return a + b.toUpperCase(); });
  }
  function iniz(s){ s = String(s || '').replace(/[^A-Za-z0-9À-ſ]/g, ''); return (s.charAt(0) || '?').toUpperCase(); }
  function icoLob(c, cls){
    c = codLob(c);
    return '<img class="xa-li' + (cls ? ' ' + cls : '') + '" src="' + ICO(gioco(c)) + '" alt="" decoding="async" data-n="' + esc(iniz(nomeLob(c))) + '">';
  }
  function icoErr(root){
    [].forEach.call(root.querySelectorAll('img.xa-li'), function(im){
      if (im.__xa) return; im.__xa = 1;
      var via = function(){ var i = document.createElement('i'); i.className = im.className + ' xa-li--t'; i.textContent = im.getAttribute('data-n') || '?'; im.replaceWith(i); };
      if (im.complete && !im.naturalWidth && im.src) via(); else im.addEventListener('error', via, { once:true });
    });
  }
  var SVG_SEDUTO = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8.6" r="3.7"/><path d="M4.8 19.6c1.3-3.5 4.1-5.2 7.2-5.2s5.9 1.7 7.2 5.2"/></svg>';
  function primoTesto(el, testo){
    if (!el) return;
    for (var n = el.firstChild; n; n = n.nextSibling) if (n.nodeType === 3 && n.nodeValue.trim()) { n.nodeValue = testo; return; }
  }
  function lobDeco(){
    var sc = document.getElementById('lobby'), body = document.getElementById('lob-body');
    if (!sc || !body || typeof LOB === 'undefined') return;
    sc.classList.add('xa-lob');
    var wrap = body.querySelector('.ut-wrap') || body;
    var tt = document.getElementById('lob-title');
    if (tt) tt.textContent = LOB.ui === 'card' ? L('Lobby', 'Lobby') : L('Crea una lobby', 'Create a lobby');
    [].forEach.call(body.querySelectorAll('.ut-g'), function(b){
      if (b.__xa) return; b.__xa = 1;
      var m = /lobSetGame\('([^']+)'\)/.exec(b.getAttribute('onclick') || ''); if (!m) return;
      var bb = b.querySelector('b'), sp = b.querySelector('span');
      if (bb) bb.innerHTML = icoLob(m[1]);
      if (sp) sp.textContent = nomeLob(m[1], sp.textContent);
    });
    var gg = body.querySelector('.ut-gg');
    if (gg && !body.querySelector('.xa-lgsel') && typeof lobG === 'function') {
      var g = lobG(LOB.game) || LOB_GAMES[0];
      var r = document.createElement('button'); r.type = 'button'; r.className = 'xa-lgsel';
      r.setAttribute('aria-expanded', XA.lobGG ? 'true' : 'false');
      r.innerHTML = icoLob(g[0]) + '<span class="xa-lgt"><b>' + esc(nomeLob(g[0], g[2])) + '</b><i>' +
        (g[3] === 'B' && g[5] > 2 ? L('Al tavolo, da ', 'At the table, ') + g[4] + L(' a ', ' to ') + g[5] : L('1 contro 1', '1 vs 1')) + '</i></span><span class="xa-lgc">' + L('Cambia', 'Change') + '</span>';
      r.addEventListener('click', function(){
        XA.lobGG = !XA.lobGG; wrap.classList.toggle('xa-gg-on', XA.lobGG); r.setAttribute('aria-expanded', XA.lobGG ? 'true' : 'false');
        try { GBX.fx(XA.lobGG ? 'open' : 'back'); } catch(e){}
      });
      gg.parentNode.insertBefore(r, gg);
    }
    wrap.classList.toggle('xa-gg-on', !!XA.lobGG);
    [].forEach.call(body.querySelectorAll('.ut-lr'), function(b){
      if (b.__xa) return; b.__xa = 1;
      var m = /lobOpen\('([^']+)'/.exec(b.getAttribute('onclick') || ''), c = null;
      if (m && LOB.lista) for (var i = 0; i < LOB.lista.length; i++) if (String(LOB.lista[i].lid) === m[1]) c = LOB.lista[i];
      var ic = b.querySelector('.ut-lr-ic'); if (ic && c) { ic.removeAttribute('style'); ic.innerHTML = icoLob(c.game); }
      var n = b.querySelector('.ut-lr-n'); if (n && c) n.textContent = nomeLob(c.game, n.textContent);
    });
    var si = body.querySelector('.ut-sum-r .ic');
    if (si && !si.__xa) { si.__xa = 1; si.innerHTML = icoLob(LOB.game); var g2 = lobG(LOB.game); if (g2) primoTesto(body.querySelector('.ut-sum-r .t'), nomeLob(g2[0], g2[2])); }
    var ti = body.querySelector('.ut-tc-ic');
    if (ti && !ti.__xa && LOB.card) { ti.__xa = 1; ti.innerHTML = icoLob(LOB.card.game, 'xa-li--big'); var g3 = lobG(LOB.card.game); if (g3) primoTesto(body.querySelector('.ut-lc-n'), nomeLob(g3[0], g3[2])); }
    [].forEach.call(body.querySelectorAll('.ut-seat'), function(s){
      if (s.__xa) return; s.__xa = 1;
      if (s.classList.contains('on')) s.innerHTML = SVG_SEDUTO;
    });
    [].forEach.call(body.querySelectorAll('#lob-grp-list .tw-tier'), function(t){
      if (t.__xa) return; t.__xa = 1;
      if (/lobSetGroup\(''\)/.test(t.getAttribute('onclick') || '')) { t.textContent = L('Solo il link', 'Link only'); return; }
      var sp = t.querySelector('span');
      if (sp && /\u{1F515}/u.test(sp.textContent)) { sp.className = 'xa-mut'; sp.removeAttribute('style'); sp.textContent = ' · ' + L('senza cronaca', 'no commentary'); }
    });
    var pz = body.querySelector('.ut-sum-r .p.free'); if (pz) pz.textContent = L('Gratis', 'Free');
    noEmo(body); if (tt) noEmo(tt);
    icoErr(body);
  }
  var lobCoda = false;
  function lobPiu(){ if (lobCoda) return; lobCoda = true; Promise.resolve().then(function(){ lobCoda = false; try { lobDeco(); } catch(e){ try { console.warn('XA lobby', e); } catch(_){} } }); }
  function montaLobby(){
    ['lobRenderCrea', 'lobRenderCard', 'lobListaHTML', 'lobGroupsHTML', 'lobGroupsListHTML'].forEach(function(n){
      var o = window[n]; if (typeof o !== 'function' || o.__xaLob) return;
      var f = function(){ var r = o.apply(this, arguments); lobPiu(); return r; };
      f.__xaLob = true; try { window[n] = f; } catch(e){}
    });
    var sg = window.lobSetGame;
    if (typeof sg === 'function' && !sg.__xaLob) {
      var f2 = function(){ XA.lobGG = false; return sg.apply(this, arguments); };
      f2.__xaLob = true; try { window.lobSetGame = f2; } catch(e){}
    }
    var oc = window.lobOpenCreate;
    if (typeof oc === 'function' && !oc.__xaLob) {
      var f3 = function(){ XA.lobGG = false; return oc.apply(this, arguments); };
      f3.__xaLob = true; try { window.lobOpenCreate = f3; } catch(e){}
    }
  }
  function montaAltre(){
    ['lobby'].forEach(function(id){
      var s = document.getElementById(id); if (!s || s.__xa) return; s.__xa = 1;
      s.classList.add('xa-cor');
      var h = s.querySelector(':scope > .game-hdr'); if (h) h.classList.add('x-navf');
    });
  }
  function statoFoglio(m){
    var ov = m.parentNode; if (!ov) return;
    var k = '';
    if (m.querySelector(':scope > .tw-radar, :scope > .tw-search-t')) k = 'srch';
    else if (m.querySelector(':scope > .tw-tiers, :scope > .tw-hero, :scope > .mg-regole, :scope > .dpt-hd + .tw-rules')) k = 'menu';
    ov.classList.toggle('xa-ms', !!k);
    ov.classList.toggle('xa-ms-srch', k === 'srch');
    if (m.id === 'pvp-modal') {
      var conPosta = k === 'menu' && m.querySelector(':scope > .tw-tiers > .tw-tier[data-t]');
      try { scheda(ov, m, conPosta ? (XA.dlId || '') : '', !!conPosta); } catch(e){ try { console.warn('XA scheda foglio', e); } catch(_){} }
    }
    if (k === 'menu') noEmo(m);
  }
  function montaFogli(){
    ['pvp-modal', 'arc-modal', 'tk-modal', 'gld-modal', 'tw-modal'].forEach(function(id){
      var m = document.getElementById(id); if (!m || m.__xa) return; m.__xa = 1;
      statoFoglio(m);
      var soloAp = function(n){ return n.nodeType === 1 && n.classList.contains('xa-ap'); };
      try { new MutationObserver(function(rs){
        if (rs.every(function(r){ return [].every.call(r.addedNodes, soloAp) && [].every.call(r.removedNodes, soloAp); })) return;
        statoFoglio(m);
      }).observe(m, { childList:true }); } catch(e){}
      if (id === 'pvp-modal') {
        var rif = 0;
        try { new MutationObserver(function(rs){
          for (var i = 0; i < rs.length; i++) {
            var t = rs[i].target; if (t === m || (t.closest && t.closest('.xa-ap'))) continue;
            if (!rif) rif = requestAnimationFrame(function(){ rif = 0; statoFoglio(m); });
            return;
          }
        }).observe(m, { subtree:true, attributes:true, attributeFilter:['class'] }); } catch(e){}
      }
    });
    var pk = window.dlPickGame;
    if (typeof pk === 'function' && !pk.__xa) {
      var f = function(g){ if (g && g !== 'random') XA.dlId = String(g); return pk.apply(this, arguments); };
      f.__xa = true; try { window.dlPickGame = f; } catch(e){}
    }
  }
  function montaPk5(){
    var ov = document.getElementById('pk5-ov'); if (!ov || ov.__xa) return; ov.__xa = 1;
    var sc = document.getElementById('pk5-sc');
    var st = function(){
      var on = ov.classList.contains('on') && sc && sc.offsetParent !== null && !!sc.querySelector('.pk5-poste');
      ov.classList.toggle('xa-pk5l', on);
      var hd = ov.querySelector('.pk5-hd'); if (hd) hd.classList.toggle('x-navf', on);
    };
    try { new MutationObserver(st).observe(ov, { attributes:true, attributeFilter:['class'], childList:true, subtree:false }); if (sc) new MutationObserver(st).observe(sc, { childList:true }); } catch(e){}
    st();
  }
  function avvia(){
    try { montaDuel(); } catch(e){ try { console.warn('XA duel', e); } catch(_){} }
    try { montaFr(); } catch(e){ try { console.warn('XA fr', e); } catch(_){} }
    try { montaAltre(); } catch(e){ try { console.warn('XA altre', e); } catch(_){} }
    try { montaFogli(); } catch(e){ try { console.warn('XA fogli', e); } catch(_){} }
    try { montaLobby(); } catch(e){ try { console.warn('XA lobby', e); } catch(_){} }
  }
  avvia();
  document.addEventListener('gbx:screen', function(e){
    var id = e.detail && e.detail.id;
    avvia();
    if (id === 'duel') { testi(); disegnaSeg(); try { GBX.tiltWake(); } catch(_){} }
    setTimeout(montaPk5, 50);
  });
  if (typeof window.pk5Apri === 'function' && !window.pk5Apri.__xa) {
    var o = window.pk5Apri;
    var n = function(){ var r = o.apply(this, arguments); setTimeout(montaPk5, 0); return r; };
    n.__xa = true; try { window.pk5Apri = n; } catch(e){}
  }
})();
;
(function(){
  'use strict';
  if (window.XV || !window.GBX) return;
  var XV = window.XV = {};
  function $(s, r){ return (r || document).querySelector(s); }
  function $$(s, r){ return [].slice.call((r || document).querySelectorAll(s)); }
  function riduci(){ try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){ return false; } }
  var PROPRI = { GAMBLER:1, "GAMBLER'S":1, 'GAMBLER’S':1, BOT:1, RUN:1, PALAZZO:1, TELEGRAM:1, UNO:1, TON:1, BTC:1 };
  function pulisci(t){ return String(t || '').replace(/^[^0-9A-Za-zÀ-ɏ]+/, '').replace(/[\s▸◂✕›‹»«]+$/, '').trim(); }
  function maiu(w){ return !/\d/.test(w) && /[A-ZÀ-Þ]/.test(w) && w === w.toUpperCase(); }
  function cap(w){ return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(); }
  function frase(t, modo){
    t = pulisci(t); if (!t) return t;
    if (modo === 'testo') return t;
    var parti = t.split(' · ');
    return parti.map(function(p, k){
      var nome = modo === 'nome' || k > 0;
      return p.split(' ').map(function(w, i){
        if (!maiu(w)) return w;
        if (nome || PROPRI[w] || i === 0) return cap(w);
        return w.toLowerCase();
      }).join(' ');
    }).join(' · ');
  }
  function mostra(el, modo){ if (!el) return; var t = frase(el.textContent, modo); el.setAttribute('data-xv-t', t); }
  var SVG = {
    '🤖': '<svg viewBox="0 0 24 24"><rect x="4.5" y="7.5" width="15" height="11" rx="3.5"/><path d="M12 7.5V4.5M9.2 12.2v1.2M14.8 12.2v1.2M9.5 15.8h5M2.5 12v3M21.5 12v3"/><circle cx="12" cy="3.6" r=".9"/></svg>',
    '🏆': '<svg viewBox="0 0 24 24"><path d="M7 4h10v4a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M12 13v4M8.5 20h7M10 17h4"/></svg>',
    '👥': '<svg viewBox="0 0 24 24"><circle cx="9" cy="8.5" r="3.3"/><path d="M2.8 19.5a6.2 6.2 0 0 1 12.4 0"/><path d="M15.5 5.6a3.2 3.2 0 0 1 0 6M17.6 13.7a6 6 0 0 1 3.6 5.8"/></svg>',
    '💶': '<svg viewBox="0 0 24 24"><rect x="2.5" y="6" width="19" height="12" rx="2.5"/><path d="M14.6 9.4a3.4 3.4 0 1 0 0 5.2M8.6 11.2h4.6M8.6 12.9h4.6"/></svg>'
  };
  var CASA_IC = { 't-bj':'cards', 't-slots':'slot', 't-roul':'wheel', 't-dice':'dice', 't-poker':'cards2', 't-scratch':'scratch',
                  't-crash':'crash', 't-botrr':'rr', 't-vault':'vault', 't-plinko':'plinko', 't-wheel':'wheel2' };
  function codice(on){ var m = /obPlay\('(?:prova|gioca)','([a-z0-9]+)'\)/.exec(on || ''); return m ? ((window.GBX && GBX.gioco) ? GBX.gioco(m[1]) : m[1]) : ''; }
  function img(src, cls, emo){
    return '<img class="' + cls + '" src="' + src + '" alt="" draggable="false" decoding="async" onerror="this.parentNode&&this.parentNode.classList.remove(\'xv-ok\');this.remove()">';
  }
  function veste(){
    var ov = $('#onboard'); if (!ov) return;
    ov.classList.add('xv-on', 'x-nosfx');
    $$('.ob-slide', ov).forEach(function(sl, n){
      sl.classList.add('xv-sl');
      [].forEach.call(sl.children, function(c, k){ c.style.setProperty('--xv-k', k); });
      var md = $('.ob-media', sl);
      if (md) {
        var em = $('.ob-emoji', md);
        if (em) {
          var e = (em.textContent || '').trim(); md.classList.add('xv-icona');
          if (SVG[e]) { em.setAttribute('data-xv-e', e); em.innerHTML = SVG[e]; }
        } else {
          md.classList.add('xv-hero', 'x-lastra');
          var im0 = md.querySelector('img');
          if (im0 && /gb_welcome\.webp$/.test(im0.getAttribute('src') || '') && !md.__xvm) {
            md.__xvm = 1; md.classList.add('xv-marchio');
            im0.onerror = function(){ this.onerror = null; md.classList.remove('xv-marchio'); this.src = 'gb_welcome.webp'; };
            im0.src = 'gbx_marchio_512.webp';
          }
        }
      }
      if ($('[onclick*="obTry(\'grun\')"]', sl)) sl.classList.add('xv-oro');
      mostra($('.ob-title', sl));
      $$('.ob-gitem', sl).forEach(function(g){
        var c = codice(g.getAttribute('onclick')), gi = $('.gi', g);
        g.classList.add('x-lastra');
        if (c && gi && !gi.__xv) { gi.__xv = 1; gi.classList.add('xv-ok'); gi.insertAdjacentHTML('beforeend', img('gbx_pv_' + c + '.webp', 'xv-im')); }
        mostra($('.gn', g), 'nome');
      });
      var ls = $('.obf-list', sl); if (ls) ls.classList.add('x-gruppo', 'x-lastra');
      $$('.obf-row', sl).forEach(function(r){
        var c = codice(r.getAttribute('onclick')), ic = $('.obf-ic', r);
        if (c && ic && !ic.__xv) { ic.__xv = 1; ic.classList.add('xv-ok'); ic.insertAdjacentHTML('beforeend', img('gbx_pv_' + c + '.webp', 'xv-im')); }
        mostra($('.obf-tx b', r), 'nome');
        var go = $('.obf-go', r); if (go) go.classList.add('x-chev');
      });
      $$('.obf-ct', sl).forEach(function(t){
        var k = CASA_IC[t.getAttribute('data-t')];
        t.classList.add('x-lastra'); t.style.backgroundImage = 'none';
        if (k && !t.__xv) { t.__xv = 1; t.insertAdjacentHTML('afterbegin', '<i class="xv-ct-ic xv-ok">' + img('gbx_ic_' + k + '.webp', 'xv-im') + '</i>'); }
        mostra($('span', t), 'nome');
      });
      $$('.ob-try', sl).forEach(function(b){ mostra(b); });
      $$('.obf-nota', sl).forEach(function(b){ mostra(b, 'testo'); });
      $$('.obf-lang button', sl).forEach(function(b){ b.setAttribute('data-x-silent', ''); mostra(b, 'testo'); });
    });
    $$('#ob-back,#ob-next,.ob-skip', ov).forEach(function(b){ mostra(b); });
    $$('#ob-back,#ob-next', ov).forEach(function(b){ b.setAttribute('data-x-silent', ''); });
  }
  var trascinato = false;
  function avvolgi(nome, dopo, prima){
    var f = window[nome]; if (typeof f !== 'function' || f.__xv) return false;
    var n = function(){ if (prima) try { prima.apply(this, arguments); } catch(e){}
      var r = f.apply(this, arguments); try { dopo && dopo.apply(this, arguments); } catch(e){ try { console.error('[gbx_avvio]', e); } catch(_){} } return r; };
    n.__xv = true; try { window[nome] = n; } catch(e){ return false; } return true;
  }
  var ultimo = -1;
  function monta(){
    if (!$('#onboard')) return;
    avvolgi('obBuild', veste);
    avvolgi('obGo', function(){
      var ov = $('#onboard'), i = (window.OB && OB.i) || 0, sl = $$('#onboard .ob-slide');
      sl.forEach(function(s, k){ if (k !== i) s.classList.remove('xv-cur', 'xv-cur-fermo'); });
      if (sl[i]) {
        if (trascinato || riduci()) sl[i].classList.add('xv-cur-fermo');
        else { sl[i].classList.remove('xv-cur', 'xv-cur-fermo'); void sl[i].offsetWidth; sl[i].classList.add('xv-cur'); }
      }
      if (ov && ov.classList.contains('show') && ultimo !== -1 && ultimo !== i) GBX.fx('swipe');
      ultimo = i; trascinato = false;
    });
    avvolgi('obOpen', function(){ var ov = $('#onboard'); ultimo = 0; if (ov) { GBX.tilt(ov); ov.classList.remove('xv-esce'); if (GBX.fondoIn && GBX.fondoIn(ov)) ov.classList.add('xv-fondo'); } }, function(){ ultimo = -1; });
    avvolgi('obClose', function(){
      var ov = $('#onboard'); if (!ov) return;
      GBX.untilt(ov);
      if (!ov.__xvAperto || riduci() || GBX.lite()) return;
      ov.classList.add('xv-esce'); clearTimeout(ov.__xvT);
      ov.__xvT = setTimeout(function(){ ov.classList.remove('xv-esce'); }, 380);
    }, function(){ var ov = $('#onboard'); if (ov) ov.__xvAperto = ov.classList.contains('show'); });
    trascina();
  }
  function trascina(){
    var ov = $('#onboard'), tr = $('#ob-track'); if (!ov || !tr || tr.__xv) return; tr.__xv = 1;
    var giu = false, x0 = 0, y0 = 0, dx = 0, asse = 0, t0 = 0, W = 1, id = null, mosso = false;
    var NO = '.obg-arena,.ob-bs,.obg-botwrap,input,textarea';
    tr.addEventListener('pointerdown', function(e){
      if (e.button || !ov.classList.contains('show') || (e.target.closest && e.target.closest(NO))) return;
      giu = true; asse = 0; dx = 0; mosso = false; x0 = e.clientX; y0 = e.clientY; t0 = performance.now(); W = tr.clientWidth || innerWidth; id = e.pointerId;
    });
    tr.addEventListener('pointermove', function(e){
      if (!giu || e.pointerId !== id) return;
      var mx = e.clientX - x0, my = e.clientY - y0;
      if (!asse) { if (Math.abs(mx) + Math.abs(my) < 8) return; asse = Math.abs(mx) > Math.abs(my) * 1.1 ? 1 : 2;
        if (asse === 1) { try { tr.setPointerCapture(id); } catch(_){} tr.classList.add('xv-tira'); mosso = true; } }
      if (asse !== 1) return;
      var i = (window.OB && OB.i) || 0, n = (window.OB && OB.n) || 1;
      dx = mx; if ((i === 0 && dx > 0) || (i === n - 1 && dx < 0)) dx = dx * .32;
      tr.style.transform = 'translateX(calc(' + (-i * 100) + '% + ' + dx.toFixed(1) + 'px))';
    });
    function fine(e){
      if (!giu || (e && e.pointerId !== id)) return; giu = false;
      tr.classList.remove('xv-tira');
      if (asse !== 1) return;
      var i = (window.OB && OB.i) || 0, n = (window.OB && OB.n) || 1, v = dx / Math.max(1, performance.now() - t0), j = i;
      if ((dx < -W * .18 || v < -.45) && i < n - 1) j = i + 1; else if ((dx > W * .18 || v > .45) && i > 0) j = i - 1;
      trascinato = j !== i;
      try { obGo(j); } catch(_){}
    }
    tr.addEventListener('pointerup', fine); tr.addEventListener('pointercancel', fine);
    tr.addEventListener('click', function(e){ if (mosso) { mosso = false; e.stopPropagation(); e.preventDefault(); } }, true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', monta); else monta();
})();
;
(function(){
  'use strict';
  var W = window, D = document;
  if (W.XBK) return;
  var XBK = W.XBK = { on:true, v:'1611', morto:false, n:0 };
  var MW = 14, MH = 10, FL = 8.7, X3 = 4.6;
  function L(it, en){ return W.GB_LANG === 'en' ? en : it; }
  function lite(){ try { return !!((W.RTD && RTD.lite) || D.documentElement.classList.contains('gb-lite') || (W.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)); } catch(e){ return false; } }
  function hap(t){ try { if (W.GBX && GBX.hap) GBX.hap(t); } catch(e){} }
  function suono(k, v){ try { if (typeof W.visSuono === 'function') W.visSuono(k, v); } catch(e){} }
  function nomeDi(id){ var n = ''; try { n = String(W.rtdName(id)); } catch(e){} return n.replace(/[^\wÀ-ɏ .'-]/g, '').trim() || L('Avversario', 'Opponent'); }
  var EMO = /\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDD00-\uDFFF]|[☀-➿️‍⏳⌛]/g;
  function pulito(t){ return String(t == null ? '' : t).replace(EMO, '').replace(/\s+/g, ' ').trim(); }
  var FONT = '-apple-system, "SF Pro Display", Inter, system-ui, sans-serif';
  function attivo(){ return XBK.on && !XBK.morto && W.RTD && RTD.game === 'basket'; }
  var IMG = {};
  function img(n){
    var i = IMG[n];
    if (!i) { i = IMG[n] = new Image(); i.decoding = 'async'; i.onload = function(){ i._ok = 1; FONDO.k = ''; }; i.src = n + '.webp'; }
    return i._ok ? i : null;
  }
  function precarica(){ ['xbk_sfondo', 'xbk_tu_pronto', 'xbk_tu_tiro', 'xbk_lui_pronto', 'xbk_lui_tiro'].forEach(img); }
  XBK.precarica = precarica;
  var SPR = { pronto:{ w:92, h:220, px:40, py:217, mx:84, my:64 }, tiro:{ w:74, h:220, px:26, py:214, mx:60, my:8 } };
  var PH = 2.3;
  var S = null;
  function stato(raw){
    if (!S || S.cv !== RTD.cv || (raw.cap != null && S.capU != null && raw.cap > S.capU + 2)) {
      S = { cv:RTD.cv, tv:0, tl:0, stop:0, ev:[], part:[], pop:[], ring:[], disp:{}, salto:{}, tocco:{}, lancio:{}, trail:{}, ultP:{},
            net:{ k:0, v:0 }, board:0, rimT:0, shk:0, bip:-1, buzz:0, flash:0, tf:0, passo:-1, ultimi:0, tab:{} };
    }
    if (raw.cap != null) S.capU = raw.cap;
    return S;
  }
  function tempo(now){
    var target = now - 85;
    if (!S.tv) { S.tv = target; S.tl = now; }
    var dt = now - S.tl; S.tl = now;
    if (now >= S.stop) {
      var lag = target - S.tv;
      if (lag > 400) S.tv = target; else S.tv = Math.min(target, S.tv + dt * (1 + Math.min(1.5, Math.max(0, lag) / 110)));
    }
    return S.tv;
  }
  function coppia(t){
    var s = RTD.snaps || [];
    if (!s.length) return null;
    if (s.length === 1 || t <= s[0].rx) return { a:s[0], b:s[0], k:0 };
    for (var i = s.length - 1; i > 0; i--) if (t >= s[i - 1].rx) { var a = s[i - 1], b = s[i]; return { a:a, b:b, k:Math.min(1, (t - a.rx) / Math.max(1, b.rx - a.rx)) }; }
    var l = s[s.length - 1]; return { a:l, b:l, k:0 };
  }
  var FONDO = { k:'', c:null, g:null };
  function geo(){
    var cv = RTD.cv; if (!cv) return null;
    var wr = cv.parentNode; if (!wr) return null;
    var cw = RTD.cssW || cv.clientWidth || 1, ch = RTD.cssH || cv.clientHeight || 1;
    return { wr:wr, ox:cv.offsetLeft, oy:cv.offsetTop, cw:cw, ch:ch, ww:wr.clientWidth || cw, wh:wr.clientHeight || ch, dpr:cv.width / cw || 1 };
  }
  function prepara(G){
    var k = [G.ww, G.wh, G.ox, G.oy, G.cw, G.ch, G.dpr.toFixed(2), !!img('xbk_sfondo'), W.GB_LANG].join('|');
    var el = D.getElementById('xbk-fondo');
    if (!el || el.parentNode !== G.wr) {
      el = D.createElement('canvas'); el.id = 'xbk-fondo'; el.setAttribute('aria-hidden', 'true');
      G.wr.insertBefore(el, G.wr.firstChild); FONDO.k = '';
    }
    G.wr.classList.add('xbk-on');
    if (k === FONDO.k && FONDO.c === el) return el;
    FONDO.k = k; FONDO.c = el; FONDO.g = G;
    el.width = Math.max(1, Math.round(G.ww * G.dpr)); el.height = Math.max(1, Math.round(G.wh * G.dpr));
    el.style.width = G.ww + 'px'; el.style.height = G.wh + 'px';
    dipingiFondo(el.getContext('2d'), G);
    piazzaTab(G);
    return el;
  }
  function copri(c, im, WW, Ya, fr){
    var kh = Ya / (fr * im.height), kk = Math.max(kh, Math.min(WW / im.width, kh * 1.6)), dw = im.width * kk, dh = im.height * kk, dy = Ya - fr * dh, x0 = (WW - dw) / 2;
    var n = Math.ceil(Math.max(0, x0) / dw);
    for (var i = -n; i <= n; i++) {
      var x = x0 + i * dw;
      if (i % 2 === 0) c.drawImage(im, x, dy, dw, dh);
      else { c.save(); c.translate(x + dw, 0); c.scale(-1, 1); c.drawImage(im, 0, dy, dw, dh); c.restore(); }
    }
    return { dw:dw, dh:dh, dy:dy, x0:x0 };
  }
  function dipingiFondo(c, G){
    var d = G.dpr, cs = G.cw / MW * d, csy = G.ch / MH * d, WW = G.ww * d, WH = G.wh * d;
    function X(x){ return G.ox * d + x * cs; }
    function Y(y){ return G.oy * d + y * csy; }
    var Yf = Y(FL);
    c.fillStyle = '#05060c'; c.fillRect(0, 0, WW, WH);
    var im = img('xbk_sfondo');
    if (im) {
      var cp = copri(c, im, WW, Yf, 0.695), dh = cp.dh;
      FONDO.folla = [Yf - 0.16 * dh, Yf - 0.03 * dh];
      c.save(); c.globalAlpha = 0.16; c.translate(0, Yf * 2); c.scale(1, -0.55); c.translate(0, -Yf * 0.18);
      copri(c, im, WW, Yf, 0.695); c.restore();
    } else {
      var g0 = c.createLinearGradient(0, 0, 0, Yf); g0.addColorStop(0, '#05070f'); g0.addColorStop(1, '#151233');
      c.fillStyle = g0; c.fillRect(0, 0, WW, Yf); FONDO.folla = [Yf * 0.8, Yf * 0.97];
    }
    var gv = c.createLinearGradient(0, 0, 0, Yf); gv.addColorStop(0, 'rgba(3,4,10,.15)'); gv.addColorStop(0.7, 'rgba(3,4,10,.32)'); gv.addColorStop(1, 'rgba(3,4,10,.55)');
    c.fillStyle = gv; c.fillRect(0, 0, WW, Yf);
    var gp = c.createLinearGradient(0, Yf, 0, WH); gp.addColorStop(0, 'rgba(32,36,58,.92)'); gp.addColorStop(0.35, 'rgba(18,20,34,.95)'); gp.addColorStop(1, '#06070c');
    c.fillStyle = gp; c.fillRect(0, Yf, WW, WH - Yf);
    c.save(); c.globalCompositeOperation = 'lighter';
    [[0.16, 'rgba(140,130,255,.10)'], [0.5, 'rgba(255,214,150,.07)'], [0.84, 'rgba(120,220,255,.09)']].forEach(function(f){
      var x = WW * f[0], gr = c.createLinearGradient(x - WW * 0.08, 0, x + WW * 0.08, 0);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, f[1]); gr.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = gr; c.fillRect(x - WW * 0.08, Yf, WW * 0.16, (WH - Yf) * 0.8);
    });
    c.restore();
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = Math.max(1, 1.2 * d);
    c.beginPath(); c.moveTo(0, Yf + 0.06 * csy); c.lineTo(WW, Yf + 0.06 * csy); c.stroke();
    var vx = X(7), fuga = function(x, y){ return vx + (x - vx) * (1 + (y - Yf) / (csy * 2.2)); };
    var x3 = X(X3);
    c.save();
    c.beginPath(); c.moveTo(-10, Yf); c.lineTo(x3, Yf); c.lineTo(fuga(x3, WH), WH); c.lineTo(-10, WH); c.closePath();
    var gz = c.createLinearGradient(0, Yf, 0, WH); gz.addColorStop(0, 'rgba(255,214,10,.16)'); gz.addColorStop(1, 'rgba(255,214,10,.03)');
    c.fillStyle = gz; c.fill();
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = 'rgba(255,214,10,.95)'; c.lineWidth = 2.2 * d; c.beginPath(); c.moveTo(x3, Yf); c.lineTo(fuga(x3, WH), WH); c.stroke();
    c.globalAlpha = 0.25; c.lineWidth = 9 * d; c.stroke();
    c.restore();
    var xk = X(10.4);
    c.save(); c.beginPath(); c.moveTo(xk, Yf); c.lineTo(WW + 10, Yf); c.lineTo(WW + 10, WH); c.lineTo(fuga(xk, WH), WH); c.closePath();
    var gk = c.createLinearGradient(0, Yf, 0, WH); gk.addColorStop(0, 'rgba(139,131,240,.26)'); gk.addColorStop(1, 'rgba(139,131,240,.04)');
    c.fillStyle = gk; c.fill();
    c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 1.4 * d; c.beginPath(); c.moveTo(xk, Yf); c.lineTo(fuga(xk, WH), WH); c.stroke(); c.restore();
    var sotto = WH - Y(MH);
    c.save(); c.textAlign = 'center'; c.textBaseline = 'middle';
    if (sotto > 40 * d) {
      c.font = '800 ' + Math.round(11 * d) + 'px ' + FONT; c.fillStyle = 'rgba(255,214,10,.75)';
      c.textAlign = 'left'; c.fillText(L('ZONA DA 3', '3-POINT ZONE'), 12 * d, Y(MH) + 12 * d); c.textAlign = 'center';
      c.font = '800 ' + Math.round(30 * d) + 'px ' + FONT; c.fillStyle = 'rgba(255,255,255,.05)';
      if (sotto > 110 * d) c.fillText('GAMBLER', X(7.6), Y(MH) + Math.min(sotto * 0.72, 100 * d));
    }
    c.restore();
    var bx = 12.2 + 0.55 + 0.25;
    var px0 = X(bx + 0.42), pw = 0.24 * cs;
    var gpo = c.createLinearGradient(px0, 0, px0 + pw, 0); gpo.addColorStop(0, '#2a2f40'); gpo.addColorStop(0.45, '#596079'); gpo.addColorStop(1, '#1a1d29');
    c.fillStyle = gpo; c.fillRect(px0, Y(4.2 - 1.3), pw, Yf - Y(4.2 - 1.3) + 0.25 * csy);
    c.fillStyle = '#20232f'; c.fillRect(X(bx + 0.18), Yf - 0.5 * csy, 0.8 * cs, 0.62 * csy);
    c.fillStyle = 'rgba(139,131,240,.85)'; c.fillRect(X(bx + 0.18), Yf - 0.5 * csy, 0.8 * cs, 0.07 * csy);
    c.strokeStyle = '#3c4256'; c.lineWidth = Math.max(2, 0.07 * cs);
    c.beginPath(); c.moveTo(X(bx + 0.3), Y(4.2 - 0.35)); c.lineTo(px0, Y(4.2 - 0.2)); c.moveTo(X(bx + 0.3), Y(4.2 - 1.15)); c.lineTo(px0, Y(4.2 - 0.6)); c.stroke();
    var tx0 = X(bx), tt = Y(4.2 - 1.6), tb = Y(4.2 + 0.3), tw = 0.36 * cs, sk = 0.2 * csy;
    c.save();
    c.beginPath(); c.moveTo(tx0, tt); c.lineTo(tx0 + tw, tt - sk); c.lineTo(tx0 + tw, tb - sk); c.lineTo(tx0, tb); c.closePath();
    var gb = c.createLinearGradient(tx0, tt, tx0 + tw, tb); gb.addColorStop(0, 'rgba(210,230,255,.30)'); gb.addColorStop(0.5, 'rgba(160,190,240,.12)'); gb.addColorStop(1, 'rgba(210,230,255,.26)');
    c.fillStyle = gb; c.fill();
    c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 1.8 * d; c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 1.4 * d;
    c.beginPath(); c.moveTo(tx0 + tw * 0.25, Y(4.2 - 0.62) - sk * 0.25); c.lineTo(tx0 + tw * 0.75, Y(4.2 - 0.62) - sk * 0.75); c.lineTo(tx0 + tw * 0.75, Y(4.2 - 0.12) - sk * 0.75); c.lineTo(tx0 + tw * 0.25, Y(4.2 - 0.12) - sk * 0.25); c.closePath(); c.stroke();
    c.restore();
    var gvi = c.createRadialGradient(WW * 0.5, Yf * 0.85, Math.min(WW, WH) * 0.25, WW * 0.5, Yf * 0.85, Math.max(WW, WH) * 0.75);
    gvi.addColorStop(0, 'rgba(0,0,0,0)'); gvi.addColorStop(1, 'rgba(0,0,0,.55)');
    c.fillStyle = gvi; c.fillRect(0, 0, WW, WH);
  }
  function el(id, cls, html, wr){
    var e = D.getElementById(id);
    if (!e || e.parentNode !== wr) { if (e) e.remove(); e = D.createElement('div'); e.id = id; e.className = cls; e.innerHTML = html; e.setAttribute('aria-hidden', 'true'); wr.appendChild(e); S && (S.tab = {}); }
    return e;
  }
  function piazzaTab(G){
    var t = el('xbk-tab', 'xbk-tab', '<div class="xbk-sq tu"><span class="xbk-n"></span><b class="xbk-pt">0</b></div><div class="xbk-cr"><b class="xbk-t">60</b><span class="xbk-l"></span></div><div class="xbk-sq lui"><b class="xbk-pt">0</b><span class="xbk-n"></span></div>', G.wr);
    var so = el('xbk-sotto', 'xbk-sotto', '', G.wr);
    var comp = G.oy < 66;
    t.classList.toggle('compatto', comp);
    t.style.top = (comp ? G.oy + 6 : Math.max(6, Math.round((G.oy - 54) / 2))) + 'px';
    var giu = G.wh - (G.oy + G.ch);
    so.style.display = giu >= 44 ? '' : 'none';
    so.style.top = (G.oy + G.ch + Math.max(8, Math.min(26, Math.round((giu - 34) / 2)))) + 'px';
  }
  function scrivi(e, k, v){ if (S.tab[k] !== v) { S.tab[k] = v; e.textContent = v; return true; } return false; }
  function aggiornaTab(raw, ids, now){
    var t = D.getElementById('xbk-tab'), so = D.getElementById('xbk-sotto');
    if (!t) return;
    var sc = raw.sc || {}, me = ids.io, op = ids.lui;
    var q = t.querySelectorAll('.xbk-pt'), n = t.querySelectorAll('.xbk-n');
    scrivi(n[0], 'n0', ids.tu ? L('Tu', 'You') : nomeDi(me).slice(0, 10));
    scrivi(n[1], 'n1', op != null ? nomeDi(op).slice(0, 10) : '');
    [[q[0], me], [q[1], op]].forEach(function(r, i){
      if (scrivi(r[0], 'p' + i, String(sc[r[1]] != null ? sc[r[1]] : 0)) && S.tab['_p' + i]) {
        r[0].classList.remove('pop'); void r[0].offsetWidth; r[0].classList.add('pop');
      }
      S.tab['_p' + i] = 1;
    });
    var cap = raw.cap != null ? Math.max(0, Math.ceil(raw.cap)) : 0;
    var cr = t.querySelector('.xbk-cr');
    scrivi(t.querySelector('.xbk-t'), 't', raw.spa ? L('Spareggio', 'Tiebreak') : String(cap));
    scrivi(t.querySelector('.xbk-l'), 'l', raw.spa ? L('chi segna vince', 'next basket wins') : L('secondi', 'seconds'));
    var rosso = !raw.spa && cap <= 10 && !raw.over;
    if (S.tab.rosso !== rosso) { S.tab.rosso = rosso; cr.classList.toggle('rosso', rosso); }
    if (S.tab.spa !== !!raw.spa) { S.tab.spa = !!raw.spa; cr.classList.toggle('spa', !!raw.spa); }
    if (so && so.style.display !== 'none') {
      var r = ids.rIo, txt = '', cl = '';
      if (raw.over) txt = L('Fine partita', 'Full time');
      else if (!r) txt = '';
      else if (r[3]) txt = ids.tu ? L('Palla in volo…', 'Ball in the air…') : '';
      else if ((r[4] || 0) >= 2) { txt = L('In fiamme · il prossimo canestro vale +1', 'On fire · next basket +1'); cl = 'fuoco'; }
      else if (r[1] < X3) { txt = L('Da qui vale 3 punti', 'This spot is worth 3'); cl = 'oro'; }
      else txt = ids.tu ? L('Trascina indietro e lascia per tirare', 'Drag back and release to shoot') : L('Spettatore', 'Spectating');
      scrivi(so, 's', txt);
      if (S.tab.scl !== cl) { S.tab.scl = cl; so.className = 'xbk-sotto' + (cl ? ' ' + cl : ''); }
      so.style.visibility = txt ? '' : 'hidden';
    }
  }
  var PALLA = {};
  function spritePalla(r){
    var k = Math.round(r), c = PALLA[k];
    if (c) return c;
    c = PALLA[k] = D.createElement('canvas'); c.width = c.height = k * 2 + 4;
    var g = c.getContext('2d'), cx = k + 2, cy = k + 2;
    var gr = g.createRadialGradient(cx - k * 0.38, cy - k * 0.42, k * 0.08, cx, cy, k);
    gr.addColorStop(0, '#ffc07a'); gr.addColorStop(0.45, '#f07a2a'); gr.addColorStop(0.85, '#a8450f'); gr.addColorStop(1, '#5c2206');
    g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, k, 0, 6.2832); g.fill();
    g.save(); g.beginPath(); g.arc(cx, cy, k, 0, 6.2832); g.clip();
    g.strokeStyle = 'rgba(35,12,2,.85)'; g.lineWidth = Math.max(1, k * 0.085);
    g.beginPath(); g.moveTo(cx - k, cy); g.lineTo(cx + k, cy); g.stroke();
    g.beginPath(); g.moveTo(cx, cy - k); g.lineTo(cx, cy + k); g.stroke();
    g.beginPath(); g.arc(cx - k * 1.2, cy, k * 0.98, -0.95, 0.95); g.stroke();
    g.beginPath(); g.arc(cx + k * 1.2, cy, k * 0.98, Math.PI - 0.95, Math.PI + 0.95); g.stroke();
    g.restore();
    g.globalAlpha = 0.45; g.fillStyle = '#fff'; g.beginPath(); g.ellipse(cx - k * 0.36, cy - k * 0.46, k * 0.3, k * 0.14, -0.55, 0, 6.2832); g.fill();
    return c;
  }
  function fiamma(ctx, x, y, h, now){
    var f = 1 + Math.sin(now / 70) * 0.08;
    ctx.save(); ctx.translate(x, y); ctx.scale(f, f);
    var g = ctx.createLinearGradient(0, -h, 0, 0); g.addColorStop(0, '#ffd60a'); g.addColorStop(1, '#ff6b00');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -h); ctx.bezierCurveTo(h * 0.55, -h * 0.45, h * 0.42, 0, 0, 0); ctx.bezierCurveTo(-h * 0.42, 0, -h * 0.55, -h * 0.45, 0, -h); ctx.fill();
    ctx.restore();
  }
  function pillola(ctx, x, y, txt, fs, bg, fg, bordo){
    ctx.font = '700 ' + fs + 'px ' + FONT;
    var tw = ctx.measureText(txt).width, h = fs * 1.55, w = tw + fs * 1.1;
    ctx.fillStyle = bg; ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 2); else ctx.rect(x - w / 2, y - h / 2, w, h);
    ctx.fill();
    if (bordo) { ctx.strokeStyle = bordo; ctx.lineWidth = Math.max(1, fs * 0.08); ctx.stroke(); }
    ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, x, y + fs * 0.04);
    return w;
  }
  function giocatore(ctx, R, s, sy, now, dp, tv){
    var lui = !R.io, sc = lui ? 0.88 : 1, base = (FL + (lui ? 0.12 : 0.52)) * sy;
    var sal = S.salto[R.id] ? (now - S.salto[R.id]) / 460 : 1;
    var tiro = sal < 1;
    var sp = SPR[tiro ? 'tiro' : 'pronto'], im = img('xbk_' + (lui ? 'lui' : 'tu') + '_' + (tiro ? 'tiro' : 'pronto'));
    var k = PH * s * sc / sp.h;
    var hop = tiro ? Math.sin(Math.min(1, sal) * Math.PI) * 0.42 * s * sc : 0;
    var x = R.x * s, corre = Math.abs(R.xv - R.x) > 0.05, inclina = corre ? Math.max(-0.18, Math.min(0.18, (R.xv - R.x) * 0.25)) : 0;
    ctx.save(); ctx.globalAlpha = (lui ? 0.35 : 0.5) * (1 - hop / (s * 1.2)); ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(x, base, s * 0.42 * sc * (1 - hop / (s * 2)), s * 0.09 * sc, 0, 0, 6.2832); ctx.fill(); ctx.restore();
    var mano = null;
    ctx.save(); ctx.translate(x, base - hop); ctx.rotate(inclina);
    if (lui) ctx.globalAlpha = 0.92;
    if (im) ctx.drawImage(im, -sp.px * k, -sp.py * k, sp.w * k, sp.h * k);
    else { ctx.fillStyle = lui ? '#8b83f0' : '#f2f2f7'; ctx.fillRect(-0.18 * s, -PH * s * sc, 0.36 * s, PH * s * sc); }
    ctx.restore();
    mano = [x + (sp.mx - sp.px) * k, base - hop - (sp.py - sp.my) * k];
    if (!R.ball && !tiro) {
      var br = 0.3 * s * sc, rot = R.x * 1.9;
      ctx.save(); ctx.translate(mano[0] + br * 0.35, mano[1] - br * 0.15); ctx.rotate(rot);
      if (lui) ctx.globalAlpha = 0.92;
      var pc = spritePalla(br); ctx.drawImage(pc, -pc.width / 2, -pc.height / 2); ctx.restore();
    }
    S.mani[R.id] = SPR.tiro ? [x + (SPR.tiro.mx - SPR.tiro.px) * k, base - 0.42 * s * sc - (SPR.tiro.py - SPR.tiro.my) * k] : mano;
    var fs = Math.max(9 * dp, s * 0.24 * sc), ty = base + fs * 1.05;
    var testo = R.tu ? L('TU', 'YOU') : nomeDi(R.id).slice(0, 9).toUpperCase();
    ctx.save();
    var w0 = pillola(ctx, x, ty, testo, fs, R.io ? 'rgba(255,255,255,.92)' : 'rgba(22,20,40,.85)', R.io ? '#0b0b10' : '#c9c4ff', R.io ? null : 'rgba(139,131,240,.7)');
    var dx = w0 / 2 + fs * 0.35;
    if (R.xv < X3) { ctx.font = '800 ' + fs * 0.9 + 'px ' + FONT; var w3 = pillola(ctx, x + dx + fs * 1.15, ty, '3', fs * 0.9, '#ffd60a', '#1b1300'); dx += w3 + fs * 0.3; }
    if (R.streak >= 2) fiamma(ctx, x - w0 / 2 - fs * 0.7, ty + fs * 0.55, fs * 1.25, now);
    ctx.restore();
  }
  function ferro(ctx, hx, hy, rx, ry, dp, davanti, lampo){
    var a0 = davanti ? 0 : Math.PI, a1 = davanti ? Math.PI : Math.PI * 2;
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = '#5e1f02'; ctx.lineWidth = Math.max(3 * dp, ry * 0.62);
    ctx.beginPath(); ctx.ellipse(hx, hy + ry * 0.12, rx, ry, 0, a0, a1); ctx.stroke();
    ctx.strokeStyle = lampo > 0.15 ? '#fff4d6' : '#ff7a1a'; ctx.lineWidth = Math.max(2 * dp, ry * 0.42);
    ctx.beginPath(); ctx.ellipse(hx, hy, rx, ry, 0, a0, a1); ctx.stroke();
    if (davanti) { ctx.strokeStyle = 'rgba(255,230,190,.8)'; ctx.lineWidth = Math.max(1, ry * 0.12); ctx.beginPath(); ctx.ellipse(hx, hy - ry * 0.15, rx * 0.92, ry * 0.8, 0, 0.5, 1.9); ctx.stroke(); }
    if (lampo > 0.05) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = lampo; ctx.strokeStyle = 'rgba(255,170,60,.9)'; ctx.lineWidth = ry * 1.2; ctx.beginPath(); ctx.ellipse(hx, hy, rx, ry, 0, a0, a1); ctx.stroke(); }
    ctx.restore();
  }
  function rete(ctx, hx, hy, rx, ry, s, now, dp){
    var k = S.net.k, v = S.net.v;
    var Ln = 0.85 * s * (1 + k * 0.55), bw = rx * (0.56 - k * 0.12), n = 8;
    var sway = Math.sin(now / 300) * s * 0.015 + v * Math.sin(now / 38) * s * 0.07;
    var top = [], bot = [];
    for (var i = 0; i < n; i++) {
      var u = i / (n - 1), ang = Math.PI * (1 - u);
      top.push([hx + Math.cos(ang) * rx, hy + Math.sin(ang) * ry * 0.35]);
      bot.push([hx + (u - 0.5) * 2 * bw + sway, hy + Ln + k * Math.sin(now / 45) * s * 0.03]);
    }
    ctx.save(); ctx.strokeStyle = 'rgba(245,247,255,.85)'; ctx.lineWidth = Math.max(1, 1.1 * dp); ctx.lineCap = 'round';
    for (var f = 0; f < 4; f++) {
      var t0 = f / 4, t1 = (f + 1) / 4;
      for (i = 0; i < n; i++) {
        var a = top[i], b = bot[i];
        var p0 = [a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0];
        var j = f % 2 ? Math.max(0, i - 1) : Math.min(n - 1, i + 1);
        var c2 = top[j], d2 = bot[j];
        var p1 = [c2[0] + (d2[0] - c2[0]) * t1, c2[1] + (d2[1] - c2[1]) * t1];
        ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 + sway * 0.2); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
      }
    }
    ctx.restore();
  }
  function spruzzo(x, y, n, cols, vel, vita, gr, sz){
    if (lite()) return;
    for (var i = 0; i < n; i++) {
      var a = Math.random() * 6.2832, v = vel * (0.35 + Math.random() * 0.9);
      S.part.push({ x:x, y:y, vx:Math.cos(a) * v, vy:Math.sin(a) * v - (gr > 0 ? vel * 0.5 : 0), t:0, max:vita * (0.6 + Math.random() * 0.7), col:cols[i % cols.length], g:gr, sz:sz * (0.6 + Math.random() * 0.8), q:Math.random() < 0.5 });
    }
    if (S.part.length > 220) S.part.splice(0, S.part.length - 220);
  }
  function particelle(ctx, dt){
    if (!S.part.length) return;
    var keep = [];
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < S.part.length; i++) {
      var p = S.part[i]; p.t += dt; if (p.t >= p.max) continue; keep.push(p);
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= (1 - 1.4 * dt);
      ctx.globalAlpha = 1 - p.t / p.max; ctx.fillStyle = p.col;
      if (p.q) ctx.fillRect(p.x - p.sz / 2, p.y - p.sz / 2, p.sz, p.sz * 0.6);
      else { ctx.beginPath(); ctx.arc(p.x, p.y, p.sz * 0.32, 0, 6.2832); ctx.fill(); }
    }
    ctx.restore(); S.part = keep;
  }
  function anello(x, y, r, col, dur){ if (!lite()) S.ring.push({ x:x, y:y, r:r, col:col, t0:performance.now(), dur:dur || 520 }); }
  function anelli(ctx, now, dp){
    var keep = [];
    for (var i = 0; i < S.ring.length; i++) {
      var a = S.ring[i], k = (now - a.t0) / a.dur; if (k >= 1) continue; keep.push(a);
      var e = 1 - Math.pow(1 - k, 3);
      ctx.save(); ctx.globalAlpha = (1 - k) * 0.9; ctx.strokeStyle = a.col; ctx.lineWidth = Math.max(1.5 * dp, a.r * 0.12 * (1 - k));
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r * (0.3 + e), 0, 6.2832); ctx.stroke(); ctx.restore();
    }
    S.ring = keep;
  }
  function pop(o){ o.t0 = performance.now(); o.dur = o.dur || (o.big ? 1250 : 900); S.pop.push(o); if (S.pop.length > 5) S.pop.shift(); }
  function pops(ctx, now, w, hh, dp){
    var keep = [];
    for (var i = 0; i < S.pop.length; i++) {
      var p = S.pop[i], k = (now - p.t0) / p.dur; if (k < 0) { keep.push(p); continue; } if (k >= 1) continue; keep.push(p);
      var ent = Math.min(1, k / 0.16), molla = ent < 1 ? 0.4 + 0.75 * (1 - Math.pow(1 - ent, 3)) : 1 + 0.15 * Math.exp(-(k - 0.16) * 14) * Math.cos((k - 0.16) * 40);
      if (lite()) molla = 1;
      var al = k > 0.72 ? 1 - (k - 0.72) / 0.28 : 1;
      var x = p.x != null ? p.x : w / 2, y = (p.y != null ? p.y : hh * 0.36) - (p.big ? 0 : k * hh * 0.08);
      ctx.save(); ctx.globalAlpha = al; ctx.translate(x, y); ctx.scale(molla, molla);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      var fs = p.big ? Math.min(w * 0.13, hh * 0.2) : Math.min(w * 0.06, hh * 0.1);
      ctx.font = '900 ' + fs + 'px ' + FONT;
      ctx.lineJoin = 'round'; ctx.lineWidth = fs * 0.16; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.strokeText(p.txt, 0, 0, w * 0.92);
      if (p.big) { var g = ctx.createLinearGradient(0, -fs * 0.5, 0, fs * 0.5); g.addColorStop(0, '#fff'); g.addColorStop(0.55, p.col); g.addColorStop(1, p.col2 || p.col); ctx.fillStyle = g; }
      else ctx.fillStyle = p.col;
      ctx.fillText(p.txt, 0, 0, w * 0.92);
      if (p.sub) pillola(ctx, 0, fs * 0.85, p.sub, fs * 0.36, 'rgba(255,255,255,.94)', '#0b0b10');
      ctx.restore();
    }
    S.pop = keep;
  }
  function evento(e){
    if (!attivo() || !e || !e.k || !S) return;
    var raw = RTD.lastRaw;
    S.ev.push({ e:e, t:(raw && raw.rx) || performance.now() });
    if (S.ev.length > 40) S.ev.shift();
  }
  function esegui(e, raw, s, sy, ids, w, hh, dp){
    var me = ids.io, who = e.who != null ? String(e.who) : '', mio = who === String(me) && ids.tu, ioVisto = who === String(me);
    var hoop = raw.hoop || [12.2, 4.2, 0.55], hx = hoop[0] * s, hy = hoop[1] * sy, now = performance.now();
    if (e.k === 'shot') {
      S.salto[who] = now; S.tocco[who] = 0; S.lancio[who] = now;
      suono('swish', 0.12); if (mio) hap('light');
    } else if (e.k === 'rim') {
      S.tocco[who] = 1; S.net.v = 1; S.rimT = now;
      var b = S.ultP[who], lato = b ? (b[0] < hx ? -1 : 1) : -1;
      spruzzo(hx + lato * hoop[2] * s, hy, 12, ['#ffd60a', '#fff1c2', '#ff9f0a'], s * 2.4, 0.4, s * 4, Math.max(2, s * 0.08));
      scossa(2.2); suono('ferro', 0.8); if (mio) hap('light');
    } else if (e.k === 'board') {
      S.tocco[who] = 1; S.board = 1; scossa(1.4); suono('tabellone', 0.8); if (mio) hap('soft');
    } else if (e.k === 'bucket') {
      var bonus = (e.streak >= 3) ? 1 : 0, da3 = (e.pts - bonus) >= 3, pulita = !S.tocco[who];
      S.net.k = 1; S.netT = now; S.board = Math.max(S.board, 0.5);
      if (ioVisto) {
        spruzzo(hx, hy + s * 0.5, mio ? 40 : 26, ['#ffd60a', '#ffffff', '#b9b3ff', '#ff9f0a'], s * (da3 ? 4.6 : 3.6), 1.0, s * 7, Math.max(2, s * 0.1));
        anello(hx, hy + s * 0.2, s * 1.6, da3 ? '#ffd60a' : '#ffffff', 600);
        if (da3 || pulita) anello(hx, hy + s * 0.2, s * 2.6, '#b9b3ff', 800);
        if (mio) { S.stop = Math.max(S.stop, now + (da3 ? 110 : 70)); scossa(da3 ? 7 : 3.5); S.flash = now; }
        if (da3) pop({ txt:L('DA TRE!', 'THREE!'), sub:'+' + e.pts, col:'#ffd60a', col2:'#ff9f0a', big:true });
        else if (pulita) pop({ txt:L('SOLO RETE', 'SWISH'), sub:'+' + e.pts, col:'#e9e6ff', col2:'#8b83f0', big:true });
        else if (bonus) pop({ txt:L('IN FIAMME', 'ON FIRE'), sub:'+' + e.pts, col:'#ff9f0a', col2:'#ff453a', big:true });
        else pop({ txt:'+' + e.pts, col:'#ffffff', x:hx - s * 0.9, y:hy - s * 0.9 });
        if (bonus && (da3 || pulita)) pop({ txt:L('+1 striscia', '+1 streak'), col:'#ff9f0a', x:hx - s * 1.2, y:hy - s * 1.5 });
        if (mio) { hap(da3 || pulita ? 'heavy' : 'medium'); setTimeout(function(){ hap('success'); }, 120); }
        suono('swish', 1); suono('folla', da3 ? 1 : 0.6);
      } else {
        spruzzo(hx, hy + s * 0.5, 14, ['#ffffff', '#b9b3ff'], s * 2.6, 0.6, s * 7, Math.max(2, s * 0.08));
        pop({ txt:'+' + e.pts + ' ' + nomeDi(who).slice(0, 8), col:'#c9c4ff', x:hx - s * 2.6, y:hy - s * 0.7 });
        suono('swish', 0.5);
      }
    } else if (e.k === 'miss') {
      if (ioVisto) { var p = S.ultP[who]; pop({ txt:L('Fuori', 'Miss'), col:'rgba(235,235,245,.75)', x:p ? Math.min(w * 0.85, Math.max(w * 0.15, p[0])) : w * 0.6, y:p ? Math.min(hh * 0.75, Math.max(hh * 0.2, p[1])) : hh * 0.4, dur:700 }); }
    }
  }
  function scossa(v){ if (!lite()) S.shk = Math.min(12 * (RTD.dpr || 1), S.shk + v * (RTD.dpr || 1)); }
  function cartello(txt, col){
    var t = pulito(txt);
    if (!t) return;
    if (/^\+\d/.test(t)) return;
    if (/^[123]$/.test(t)) { pop({ txt:t, col:'#ffffff', big:true, dur:600 }); try { hap('light'); } catch(e){} return; }
    if (/^(GO!|VIA!)$/i.test(t)) { pop({ txt:L('VIA!', 'GO!'), col:'#ffd60a', col2:'#ff9f0a', big:true, dur:850 }); hap('medium'); return; }
    pop({ txt:t, col:col || '#ffd60a', big:true });
  }
  function disegna(ctx, raw, now, w, hh){
    XBK.n++;
    precarica();
    stato(raw);
    var G = geo(); if (!G) throw new Error('niente tela');
    var fondo = prepara(G);
    var s = w / MW, sy = hh / MH, dp = RTD.dpr || 1;
    var dt = Math.min(0.05, (now - (S.tf || now)) / 1000); S.tf = now;
    var tv = tempo(now), C = coppia(tv) || { a:raw, b:raw, k:0 };
    var meS = String(RTD.myId), rb = C.b.p || raw.p || [], ra = C.a.p || [];
    var tu = false, io = meS, lui = null, rIo = null;
    for (var i = 0; i < rb.length; i++) if (String(rb[i][0]) === meS) tu = true;
    if (!tu) for (i = 0; i < rb.length; i++) if (rb[i][2] === 0) io = String(rb[i][0]);
    for (i = 0; i < rb.length; i++) { if (String(rb[i][0]) !== io) lui = String(rb[i][0]); else rIo = rb[i]; }
    var ids = { io:io, lui:lui, tu:tu, rIo:rIo };
    while (S.ev.length && S.ev[0].t <= tv) { var x0 = S.ev.shift(); try { esegui(x0.e, C.b, s, sy, ids, w, hh, dp); } catch(e){} }
    if (RTD.stampQ && RTD.stampQ.length) { var q = RTD.stampQ; RTD.stampQ = []; q.forEach(function(st){ cartello(st.txt, st.col); }); }
    var shx = 0, shy = 0;
    if (S.shk > 0.3) { shx = (Math.random() - 0.5) * S.shk; shy = (Math.random() - 0.5) * S.shk; ctx.translate(shx, shy); S.shk *= Math.pow(0.02, dt); } else S.shk = 0;
    var cam = shx || shy ? 'translate(' + (shx / G.dpr).toFixed(2) + 'px,' + (shy / G.dpr).toFixed(2) + 'px)' : '';
    if (fondo._cam !== cam) { fondo._cam = cam; fondo.style.transform = cam; }
    ctx.drawImage(fondo, G.ox * G.dpr, G.oy * G.dpr, w, hh, 0, 0, w, hh);
    if (S.flash && now - S.flash < 900 && FONDO.folla && !lite()) {
      var fk = 1 - (now - S.flash) / 900, y0 = FONDO.folla[0] - G.oy * G.dpr, y1 = FONDO.folla[1] - G.oy * G.dpr;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (var fi = 0; fi < 14; fi++) { if (Math.random() < 0.45) continue; var fx = Math.random() * w, fy = y0 + Math.random() * (y1 - y0);
        ctx.globalAlpha = fk * (0.5 + Math.random() * 0.5); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(fx, fy, (1.5 + Math.random() * 2.5) * dp, 0, 6.2832); ctx.fill(); }
      ctx.restore();
    }
    var hoop = raw.hoop || [12.2, 4.2, 0.55];
    var hx = hoop[0] * s, hy = hoop[1] * sy, rx = hoop[2] * s, ry = Math.max(3 * dp, 0.14 * s);
    S.board = Math.max(0, S.board - dt * 3);
    if (S.board > 0.02) {
      var bx = (hoop[0] + hoop[2] + 0.25) * s, bt = (hoop[1] - 1.6) * sy, bb = (hoop[1] + 0.3) * sy, bw = 0.36 * s, sk = 0.2 * sy;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = S.board * 0.7; ctx.fillStyle = 'rgba(200,225,255,1)';
      ctx.beginPath(); ctx.moveTo(bx, bt); ctx.lineTo(bx + bw, bt - sk); ctx.lineTo(bx + bw, bb - sk); ctx.lineTo(bx, bb); ctx.closePath(); ctx.fill(); ctx.restore();
    }
    ctx.strokeStyle = '#8e95ab'; ctx.lineWidth = Math.max(2 * dp, 0.07 * s); ctx.beginPath(); ctx.moveTo(hx + rx, hy); ctx.lineTo((hoop[0] + hoop[2] + 0.25) * s, hy - 0.05 * s); ctx.stroke();
    var rimK = S.rimT ? Math.max(0, 1 - (now - S.rimT) / 260) : 0, netK = S.netT ? Math.max(0, 1 - (now - S.netT) / 320) : 0;
    S.net.k = Math.max(0, S.net.k - dt * 2.0); S.net.v = Math.max(0, S.net.v - dt * 2.4);
    var vib = rimK * Math.sin(now / 18) * dp * 1.6;
    ferro(ctx, hx, hy + vib, rx, ry, dp, false, Math.max(rimK, netK));
    var rows = [];
    S.mani = S.mani || {};
    for (i = 0; i < rb.length; i++) {
      var r = rb[i], id = String(r[0]), ball = r[3] ? [r[3][0], r[3][1]] : null, ar = null;
      for (var j = 0; j < ra.length; j++) if (String(ra[j][0]) === id) ar = ra[j];
      if (ar && C.a !== C.b && ball && ar[3]) { ball[0] = ar[3][0] + (ball[0] - ar[3][0]) * C.k; ball[1] = ar[3][1] + (ball[1] - ar[3][1]) * C.k; }
      var dsp = S.disp[id]; if (dsp == null) dsp = S.disp[id] = r[1];
      S.disp[id] = dsp + (r[1] - dsp) * Math.min(1, dt * 9);
      rows.push({ id:id, x:S.disp[id], xv:r[1], ball:ball, streak:r[4] || 0, io:id === io, tu:id === meS });
    }
    rows.sort(function(a, b){ return a.io ? 1 : -1; });
    for (i = 0; i < rows.length; i++) giocatore(ctx, rows[i], s, sy, now, dp, tv);
    var mioR = null; for (i = 0; i < rb.length; i++) if (String(rb[i][0]) === meS) mioR = rb[i];
    if (RTD.drag && mioR && !mioR[3]) {
      var cW = (RTD.cssW || w / dp) / MW, cH = (RTD.cssH || hh / dp) / MH;
      var wx = -RTD.drag.dx / cW, wy = -RTD.drag.dy / cH, wm = Math.hypot(wx, wy) || 1; wx /= wm; wy /= wm;
      if (wy > -0.15) { wy = -0.15; var m3 = Math.hypot(wx, wy); wx /= m3; wy /= m3; }
      var pw = Math.max(0.2, RTD.drag.pw || 0), v = 8.5 + 9.5 * pw, px = mioR[1], py = MH - 1.6, vx = wx * v, vy = wy * v, DT = 0.05;
      var valido = Math.hypot(RTD.drag.dx, RTD.drag.dy) >= 14;
      var passo = Math.floor(pw * 5); if (passo !== S.passo) { if (S.passo >= 0 && valido) hap('sel'); S.passo = passo; }
      ctx.save();
      for (var tt = 0; tt < 18; tt++) {
        vy += 14 * DT; px += vx * DT; py += vy * DT;
        var a = (valido ? 0.95 : 0.35) * (1 - tt / 20), rr = Math.max(2 * dp, s * 0.075) * (1 - tt / 28);
        ctx.globalAlpha = a * 0.3; ctx.fillStyle = '#ffd60a'; ctx.beginPath(); ctx.arc(px * s, py * sy, rr * 2.1, 0, 6.2832); ctx.fill();
        ctx.globalAlpha = a; ctx.fillStyle = tt % 3 === 2 ? '#ffd60a' : '#ffffff'; ctx.beginPath(); ctx.arc(px * s, py * sy, rr, 0, 6.2832); ctx.fill();
      }
      var cx0 = mioR[1] * s, cy0 = (FL + 0.52 - PH * 0.55) * sy, R0 = s * 1.25;
      ctx.globalAlpha = 0.25; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3 * dp; ctx.beginPath(); ctx.arc(cx0, cy0, R0, -Math.PI * 0.5, Math.PI * 1.5); ctx.stroke();
      ctx.globalAlpha = 0.95; ctx.strokeStyle = pw > 0.85 ? '#ffd60a' : '#ffffff'; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(cx0, cy0, R0, -Math.PI * 0.5, -Math.PI * 0.5 + pw * Math.PI * 2); ctx.stroke();
      ctx.restore();
    } else S.passo = -1;
    var br = 0.3 * s;
    for (i = 0; i < rows.length; i++) {
      var R = rows[i]; if (!R.ball) { S.trail[R.id] = []; continue; }
      var bxp = R.ball[0] * s, byp = R.ball[1] * sy;
      var lt = S.lancio[R.id] ? (now - S.lancio[R.id]) / 220 : 1, mn = S.mani[R.id];
      if (lt < 1 && mn) { var bl = Math.pow(1 - lt, 2); bxp += (mn[0] - (R.xv * s)) * bl; byp += (mn[1] - (MH - 1.6) * sy) * bl; }
      S.ultP[R.id] = [bxp, byp];
      var trl = S.trail[R.id] || (S.trail[R.id] = []); trl.push(bxp, byp); if (trl.length > 16) trl.splice(0, 2);
      var feet = (FL + (R.io ? 0.52 : 0.12)) * sy, alt = Math.max(0, feet - byp) / sy;
      ctx.save(); ctx.globalAlpha = Math.max(0.08, 0.42 - alt * 0.05); ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.ellipse(bxp, feet, br * (1 + alt * 0.1), br * 0.25, 0, 0, 6.2832); ctx.fill(); ctx.restore();
      var fuoco = R.streak >= 2, pcs = spritePalla(br * (R.io ? 1 : 0.92));
      ctx.save();
      if (fuoco && !lite()) {
        ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
        for (var t2 = 2; t2 < trl.length; t2 += 2) { ctx.globalAlpha = (t2 / trl.length) * 0.75; ctx.strokeStyle = t2 % 4 ? '#ff9f0a' : '#ffd60a'; ctx.lineWidth = br * 1.7 * (t2 / trl.length);
          ctx.beginPath(); ctx.moveTo(trl[t2 - 2], trl[t2 - 1]); ctx.lineTo(trl[t2], trl[t2 + 1]); ctx.stroke(); }
        if (Math.random() < 0.5) spruzzo(bxp, byp, 1, ['#ff9f0a', '#ffd60a'], s * 0.6, 0.35, -s * 2, Math.max(2, s * 0.09));
      } else {
        for (var t3 = 0; t3 < trl.length - 2; t3 += 4) { ctx.globalAlpha = 0.1 + 0.22 * (t3 / trl.length); ctx.drawImage(pcs, trl[t3] - pcs.width / 2, trl[t3 + 1] - pcs.height / 2); }
      }
      ctx.restore();
      ctx.save(); ctx.translate(bxp, byp); ctx.rotate((R.ball[0] * 1.9) % 6.2832); ctx.drawImage(pcs, -pcs.width / 2, -pcs.height / 2); ctx.restore();
      if (!R.io) { ctx.save(); ctx.globalAlpha = 0.85; ctx.strokeStyle = '#8b83f0'; ctx.lineWidth = 1.6 * dp; ctx.beginPath(); ctx.arc(bxp, byp, br + 2 * dp, 0, 6.2832); ctx.stroke(); ctx.restore(); }
    }
    rete(ctx, hx, hy + vib, rx, ry, s, now, dp);
    ferro(ctx, hx, hy + vib, rx, ry, dp, true, Math.max(rimK, netK));
    particelle(ctx, dt);
    anelli(ctx, now, dp);
    if (raw.cap != null && raw.cap <= 10 && !raw.over && !raw.spa) {
      var ci = Math.ceil(raw.cap);
      if (ci !== S.bip && ci > 0) { S.bip = ci; suono('tic', 0.8); }
      if (!S.ultimi && ci <= 10 && ci > 8) { S.ultimi = 1; pop({ txt:L('ULTIMI 10 SECONDI', 'LAST 10 SECONDS'), col:'#ff453a', y:hh * 0.2, dur:1100 }); }
    }
    if (raw.cap != null && raw.cap <= 0.05 && !S.buzz && !raw.spa) { S.buzz = 1; suono('sirena', 1); }
    pops(ctx, now, w, hh, dp);
    aggiornaTab(C.b.sc ? C.b : raw, ids, now);
  }
  function aggancia(){
    if (XBK.agganciato) return true;
    if (typeof W.visFotogramma !== 'function' || typeof W.rtdFeedEvent !== 'function') return false;
    XBK.agganciato = true;
    var visOrig = W.visFotogramma;
    W.visFotogramma = function(g, ctx, raw, lp, now, w, hh){
      if (g === 'basket' && attivo() && raw && W.RTD && RTD.map) {
        ctx.save();
        try { disegna(ctx, raw, now, w, hh); ctx.restore(); return true; }
        catch (e) {
          XBK.morto = true;
          try { ctx.restore(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; } catch(_r){}
          try { var f = D.getElementById('xbk-fondo'); if (f) f.remove(); ['xbk-tab', 'xbk-sotto'].forEach(function(k){ var x = D.getElementById(k); if (x) x.remove(); }); var wr = RTD.cv && RTD.cv.parentNode; if (wr) wr.classList.remove('xbk-on'); } catch(_x){}
          try { console.warn('XBK giù, torna il disegno di prima: ' + (e && e.message || e)); } catch(_w){}
        }
      }
      return visOrig.apply(this, arguments);
    };
    var feOrig = W.rtdFeedEvent;
    W.rtdFeedEvent = function(e){
      var r = feOrig.apply(this, arguments);
      try { if (W.RTD && RTD.game === 'basket') evento(e); } catch(_e){}
      return r;
    };
    var stOrig = W.rtdStamp;
    if (typeof stOrig === 'function') W.rtdStamp = function(txt, col, alta){
      if (attivo() && RTD.ui === 'match' && S && S.cv === RTD.cv) { try { cartello(txt, col); } catch(e){} return; }
      return stOrig.apply(this, arguments);
    };
    var sbOrig = W.rtdScoreBar;
    if (typeof sbOrig === 'function') W.rtdScoreBar = function(ctx, raw){
      if (attivo() && S && S.cv === RTD.cv && D.getElementById('xbk-tab')) return;
      return sbOrig.apply(this, arguments);
    };
    return true;
  }
  if (!aggancia()) { var n = 0, iv = setInterval(function(){ if (aggancia() || ++n > 80) clearInterval(iv); }, 250); }
  D.addEventListener('click', function(ev){ try { var t = ev.target.closest && ev.target.closest('[onclick*="\'basket\'"]'); if (t) precarica(); } catch(e){} }, true);
  XBK.stato = function(){ return S; };
})();
;
(function(){
  'use strict';
  if (!window.GBX || !window.CASA) return;
  var XC = window.XC = {};
  var L = GBX.L;
  function $(id){ return document.getElementById(id); }
  function eur(x){ x = Math.round((+x || 0) * 100) / 100; return '€' + x.toFixed(2); }
  function lab(x){ x = Math.round((+x || 0) * 100) / 100; return x % 1 ? x.toFixed(2) : String(x); }
  function cap(){ try { return capEur(); } catch(e){ return 0; } }
  function wait(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
  function lite(){ return GBX.lite(); }
  XC.eur = eur;
  [['bj','xc-bj'],['poker','xc-pk'],['dice','xc-dc'],['roulette','xc-rl']].forEach(function(p){
    var s = $(p[0]); if (s && s.querySelector('.xc-top')) s.classList.add('xc-scr', p[1]);
  });
  var A = { c:null, out:null, nb:null };
  function muto(){ try { if (typeof TWS !== 'undefined' && TWS && TWS.on === false) return true; } catch(e){} return false; }
  function ac(){
    if (A.c) { try { if (A.c.state === 'suspended') A.c.resume(); } catch(e){} return A.c; }
    try {
      var dest;
      if (typeof TWS !== 'undefined' && TWS) { if (!TWS.ctx && TWS.init) TWS.init(); if (TWS.ctx) { A.c = TWS.ctx; dest = TWS.mg || TWS.ctx.destination; } }
      if (!A.c) { var C = window.AudioContext || window.webkitAudioContext; if (!C) return null; A.c = new C(); dest = A.c.destination; }
      A.out = A.c.createGain(); A.out.gain.value = .9; A.out.connect(dest);
      A.nb = A.c.createBuffer(1, A.c.sampleRate, A.c.sampleRate);
      var d = A.nb.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    } catch(e){ A.c = null; }
    return A.c;
  }
  function tone(f, dur, o){ o = o || {}; var c = A.c, t = c.currentTime + (o.at || 0);
    var os = c.createOscillator(), g = c.createGain(); os.type = o.type || 'sine'; os.frequency.setValueAtTime(f, t);
    if (o.to) os.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(o.g || .15, t + (o.atk || .004)); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    os.connect(g); g.connect(A.out); os.start(t); os.stop(t + dur + .02); }
  function noise(dur, o){ o = o || {}; var c = A.c, t = c.currentTime + (o.at || 0);
    var s = c.createBufferSource(); s.buffer = A.nb; var f = c.createBiquadFilter(); f.type = o.ft || 'bandpass'; f.frequency.setValueAtTime(o.f || 2000, t); f.Q.value = o.q || 1;
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    var g = c.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(o.g || .2, t + (o.atk || .003)); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(A.out); s.start(t, Math.random() * .5); s.stop(t + dur + .02); }
  var SFX = {
    chip: function(){ tone(3100,.045,{type:'triangle',g:.09}); tone(4300,.04,{type:'triangle',g:.06,at:.018}); noise(.03,{f:5000,q:3,g:.12,at:.012}); },
    chips: function(){ for (var i = 0; i < 4; i++){ tone(2900 + Math.random()*1400,.04,{type:'triangle',g:.06,at:i*.045}); noise(.025,{f:5200,q:3,g:.08,at:i*.045+.01}); } },
    deal: function(){ noise(.13,{f:1300,to:4200,q:.9,g:.26,atk:.01}); noise(.03,{f:3000,q:2,g:.12,at:.11}); },
    flip: function(){ noise(.05,{ft:'highpass',f:2600,g:.3}); tone(1250,.05,{to:700,g:.05,at:.012}); },
    win: function(){ [880,1108.7,1318.5,1760].forEach(function(f,i){ tone(f,.55,{g:.09,at:i*.075}); tone(f*2,.3,{g:.02,at:i*.075}); }); noise(.5,{ft:'highpass',f:7000,g:.03,at:.2,atk:.1}); },
    bj: function(){ [659.3,880,1108.7,1318.5,1760,2217.5].forEach(function(f,i){ tone(f,.7,{g:.085,at:i*.06}); }); tone(220,.6,{g:.08,type:'triangle'}); noise(.7,{ft:'highpass',f:6500,g:.05,at:.25,atk:.15}); },
    lose: function(){ tone(196,.42,{to:123,g:.12}); noise(.22,{ft:'lowpass',f:500,g:.12}); },
    push: function(){ tone(523.3,.25,{g:.07}); tone(523.3,.3,{g:.06,at:.14}); },
    fold: function(){ noise(.22,{f:2600,to:600,q:.8,g:.09,atk:.02}); }
  };
  var HAPT = { chip:'light', chips:'medium', deal:'soft', flip:'light', win:'success', bj:'success', lose:'error', push:'warning', fold:'light' };
  XC.fx = function(n){
    if (!SFX[n]) { GBX.fx(n); return; }
    if (!muto() && ac() && A.out) { try { SFX[n](); } catch(e){} }
    GBX.hap(HAPT[n]);
  };
  function Saldo(scr){
    var el = scr.querySelector('.xc-balv'), src = scr.querySelector('.xc-balsrc'), dl = scr.querySelector('.xc-delta');
    var o = { v:null, tieni:false, tm:0 };
    o.mostra = function(anima){
      var a = cap();
      if (o.v === null || !anima) el.textContent = eur(a);
      else if (Math.abs(a - o.v) > .004) GBX.count(el, o.v, a, eur, 650);
      o.v = a;
    };
    o.lascia = function(){ o.tieni = false; o.mostra(true); };
    o.delta = function(x){
      if (!dl || Math.abs(x) < .005) return;
      dl.textContent = (x > 0 ? '+' : '−') + eur(Math.abs(x));
      dl.style.color = x > 0 ? 'var(--x-win)' : 'var(--x-loss)';
      dl.classList.add('show'); clearTimeout(o.tm); o.tm = setTimeout(function(){ dl.classList.remove('show'); }, 1500);
    };
    try { new MutationObserver(function(){
      if (!scr.classList.contains('active')) { o.v = cap(); el.textContent = eur(o.v); return; }
      if (!o.tieni) o.mostra(true);
    }).observe(src, { childList:true, characterData:true, subtree:true }); } catch(e){}
    o.mostra(false);
    return o;
  }
  var SAL = {};
  function prepara(id){
    var scr = $(id); if (!scr) return null;
    if (!SAL[id]) { SAL[id] = Saldo(scr); GBX.tilt(scr); }
    else { SAL[id].tieni = false; SAL[id].mostra(false); GBX.tiltWake(); }
    return SAL[id];
  }
  XC.saldo = function(id){ return SAL[id]; };
  var REG = {};
  XC.regole = function(g){
    var p = $('xc-reg-' + g); if (!p) return;
    var t = p.querySelector('.xc-regtxt'); if (t && REG[g]) t.innerHTML = REG[g]();
    p.classList.add('open'); GBX.fx('open');
  };
  XC.chiudi = function(e, p){ if (e.target === p || (e.target.closest && e.target.closest('.xc-grab'))) { p.classList.remove('open'); GBX.fx('back'); } };
  var SUIT = {
    '♠':'<svg viewBox="0 0 24 24"><path d="M12 1.8C10.2 4.6 7.6 6.9 5.2 9.1 3.6 10.6 2.8 12.1 2.8 13.8c0 2.6 2 4.5 4.5 4.5 1.6 0 3-.7 3.9-1.9-.3 2.3-1.2 4.1-2.8 5.6h7.2c-1.6-1.5-2.5-3.3-2.8-5.6.9 1.2 2.3 1.9 3.9 1.9 2.5 0 4.5-1.9 4.5-4.5 0-1.7-.8-3.2-2.4-4.7-2.4-2.2-5-4.5-6.8-7.3z"/></svg>',
    '♥':'<svg viewBox="0 0 24 24"><path d="M12 21.2c-.3 0-.6-.1-.8-.3C5.9 16.3 2.6 13.2 2.6 9.1 2.6 6 5 3.6 8 3.6c1.7 0 3.1.8 4 2.1.9-1.3 2.3-2.1 4-2.1 3 0 5.4 2.4 5.4 5.5 0 4.1-3.3 7.2-8.6 11.8-.2.2-.5.3-.8.3z"/></svg>',
    '♦':'<svg viewBox="0 0 24 24"><path d="M12 1.8c1.9 3.6 4.6 6.9 7.6 10.2-3 3.3-5.7 6.6-7.6 10.2-1.9-3.6-4.6-6.9-7.6-10.2 3-3.3 5.7-6.6 7.6-10.2z"/></svg>',
    '♣':'<svg viewBox="0 0 24 24"><path d="M12 2.4a4.4 4.4 0 0 0-3.7 6.8 4.4 4.4 0 1 0 1.9 7.6c-.3 2-1.1 3.6-2.6 5h8.8c-1.5-1.4-2.3-3-2.6-5a4.4 4.4 0 1 0 1.9-7.6A4.4 4.4 0 0 0 12 2.4z"/></svg>'
  };
  function faccia(c){ var k = CASA.normCarta(c) || { r:'?', s:'♠' };
    return '<div class="x-cin"><span class="r">' + k.r + '</span><span class="s">' + (SUIT[k.s] || '') + '</span></div>'; }
  var DORSO = '<div class="x-cin bk"><i class="x-stripes"></i></div>';
  function chiave(c){ var k = CASA.normCarta(c); return k ? k.r + k.s : '?'; }
  function cartaEl(c, coperta, fy, anima){
    var e = document.createElement('div'); e.className = 'x-card';
    e.innerHTML = coperta ? DORSO : faccia(c);
    if (anima) { e.__in = 1; e.addEventListener('animationend', function(){ e.classList.remove('in'); }, { once:true }); }
    return e;
  }
  function entra(e){
    if (!e || !e.__in) return; e.__in = 0;
    var r = e.getBoundingClientRect(), W = window.innerWidth || 390;
    var top = 64; try { var t = document.querySelector('.screen.active .xc-top'); if (t) top = t.getBoundingClientRect().bottom; } catch(x){}
    e.style.setProperty('--fx', Math.round((W - 34) - (r.left + r.width / 2)) + 'px');
    e.style.setProperty('--fy', Math.round(top - (r.top + r.height / 2)) + 'px');
    e.classList.add('in');
  }
  function gira(e, html){ return new Promise(function(res){
    e.classList.remove('in');
    if (!e.animate || lite()) { e.innerHTML = html; res(); return; }
    var a = e.animate([{ transform:'scaleX(1)' }, { transform:'scaleX(0) translateY(-8px)' }], { duration:150, easing:'cubic-bezier(.5,0,.9,.5)' });
    a.onfinish = function(){ e.innerHTML = html;
      e.animate([{ transform:'scaleX(0) translateY(-8px)' }, { transform:'scaleX(1.07) translateY(-3px)' }, { transform:'none' }], { duration:360, easing:'cubic-bezier(.2,.8,.2,1)' }).onfinish = res; };
  }); }
  function disponi(box){
    var k = box.children, n = k.length; if (!n) return;
    var cw = k[0].offsetWidth || 82, W = Math.min(box.clientWidth || 300, 340);
    var gap = Math.round(cw * .63);
    if (n > 1 && cw + gap * (n - 1) > W - 4) gap = Math.max(12, (W - 4 - cw) / (n - 1));
    var w = cw + gap * (n - 1);
    for (var i = 0; i < n; i++) k[i].style.left = 'calc(50% - ' + (w / 2) + 'px + ' + (i * gap) + 'px)';
  }
  function scrivi(el, v, poi){
    v = String(v); clearTimeout(el.__xt);
    var fai = function(){ if (el.textContent === v) return; el.textContent = v;
      if (v && el.animate && !lite()) el.animate([{ opacity:.25 }, { opacity:1 }], { duration:260, easing:'ease-out' }); };
    if (poi) el.__xt = setTimeout(fai, poi); else fai();
  }
  var POSA = 470;
  function fiche(el, v){
    el.getAnimations && el.getAnimations().forEach(function(a){ a.cancel(); });
    el.textContent = lab(v); el.classList.remove('gone', 'pop'); void el.offsetWidth; el.classList.add('pop');
  }
  function via(el){ el.getAnimations && el.getAnimations().forEach(function(a){ a.cancel(); }); el.classList.add('gone'); el.classList.remove('pop'); }
  function arco(el, dir){
    if (!el.animate || lite()) { el.classList.add('gone'); return; }
    el.animate([{ transform:'none', opacity:1 }, { transform:'translate(' + (dir * 40) + 'px,' + (dir > 0 ? 60 : -90) + 'px) scale(1.1)', opacity:1, offset:.4 },
      { transform:'translate(0,' + (dir > 0 ? 260 : -240) + 'px) scale(.5)', opacity:0 }], { duration:620, easing:'cubic-bezier(.3,.7,.3,1)', fill:'forwards' });
  }
  function perche(m, hint){
    var t = hint.textContent; hint.textContent = ''; if (!t) return;
    var e = document.createElement('span'); e.className = 'xc-why'; e.textContent = t; m.appendChild(e);
  }
  function messaggio(m, tit, sotto, buono, colore){
    m.innerHTML = tit + (sotto ? '<small class="x-num">' + sotto + '</small>' : '');
    m.style.color = colore || ''; m.classList.toggle('good', !!buono); m.classList.add('show'); try { var tv = m.closest('.xc-table'); if (tv) tv.classList.add('xc-msgon'); } catch(e){}
  }
  function fila(cont, sel){
    var bets = window.BETS || [0.5, 1, 2, 5, 10, 25, 50, 100];
    cont.innerHTML = bets.map(function(b){ return '<button class="x-chipb x-num' + (Math.abs(b - sel) < 1e-9 ? ' on' : '') + '" data-v="' + b + '">' + lab(b) + '</button>'; }).join('');
    var on = cont.querySelector('.on');
    if (on) requestAnimationFrame(function(){ cont.scrollLeft = on.offsetLeft - cont.clientWidth / 2 + on.offsetWidth / 2; });
  }
  function scuoti(el){
    if (!el || !el.animate || lite()) return;
    el.animate([{ transform:'translateX(0)' }, { transform:'translateX(-7px)' }, { transform:'translateX(6px)' }, { transform:'translateX(-3px)' }, { transform:'none' }], { duration:300, easing:'ease-out' });
  }
  function post(path, body){
    return fetch(BACKEND + path, { method:'POST', headers:{ 'Content-Type':'application/json', 'ngrok-skip-browser-warning':'1' }, body:JSON.stringify(body) })
      .then(function(r){ return r.json(); });
  }
  XC._interno = { faccia:faccia, cartaEl:cartaEl, disponi:disponi };
  (function(){
    var CBJ = window.CBJ; if (!CBJ || !$('xcbj-tav')) return;
    var B = { visti:{}, buco:null, banco:[], sal:null, tok:0 };
    function valore(cs){
      var v = 0, a = 0;
      (cs || []).forEach(function(c){ if (!c || c.hidden) return; var r = c.r;
        if (r === 'A') { v += 11; a++; } else if (r === 'J' || r === 'Q' || r === 'K') v += 10; else v += parseInt(r, 10); });
      while (v > 21 && a > 0) { v -= 10; a--; }
      return { v:v, morbido: a > 0 && v < 21 };
    }
    function totTesto(cs, fine){ if (!cs || !cs.length) return ''; var x = valore(cs); return (x.morbido && !fine) ? (x.v - 10) + '/' + x.v : String(x.v); }
    function etichettaDai(){
      $('xcbj-deal').textContent = (CBJ.fase === 'fine' ? L('Rigioca', 'Play again') : L('Distribuisci', 'Deal')) + ' · ' + eur(CBJ.posta);
    }
    function mostraPunta(){
      fila($('xcbj-chips'), CBJ.posta); etichettaDai();
      $('xcbj-betui').hidden = false; $('xcbj-acts').hidden = true;
    }
    function testi(){
      var t = { 'xcbj-split':L('Dividi','Split'), 'xcbj-double':L('Raddoppia','Double'), 'xcbj-stand':L('Stai','Stand'), 'xcbj-hit':L('Carta','Hit') };
      for (var k in t) { var e = $(k); if (e) e.querySelector('.xc-l').textContent = t[k]; }
    }
    function pulisci(){
      B.tok++; B.visti = {}; B.buco = null; B.banco = [];
      $('xcbj-dh').innerHTML = ''; $('xcbj-mani').innerHTML = ''; $('xcbj-mani').className = 'xc-mani n1';
      scrivi($('xcbj-dtot'), ''); $('xcbj-hint').textContent = '';
      var m = $('xcbj-msg'); m.className = 'x-msg'; m.innerHTML = '';
      via($('xcbj-chip'));
    }
    function addBanco(c, coperta, anima){
      var e = cartaEl(c, coperta, '-140px', anima !== false);
      $('xcbj-dh').appendChild(e); disponi($('xcbj-dh')); entra(e);
      if (!coperta) B.banco.push(c); else B.buco = e;
      if (anima !== false) XC.fx('deal');
      scrivi($('xcbj-dtot'), totTesto(B.banco, true), anima !== false && !coperta ? POSA : 0);
      return e;
    }
    function mani(d, fine){
      var hs = d.hands || [], cont = $('xcbj-mani'), suono = false;
      if (cont.children.length !== hs.length) {
        cont.innerHTML = hs.map(function(){ return '<div class="xc-mano"><div class="xc-hand"></div><div class="xc-tot x-num"></div></div>'; }).join('');
      }
      cont.className = 'xc-mani n' + Math.min(4, hs.length) + (hs.length > 1 ? ' tante' : '');
      hs.forEach(function(m, i){
        var box = cont.children[i], h = box.firstChild, cs = m.cards || [];
        var giaQui = [].map.call(h.children, function(e){ return e.getAttribute('data-k'); });
        if (giaQui.join() !== cs.slice(0, giaQui.length).map(chiave).join()) { h.innerHTML = ''; giaQui = []; }
        var arrivo = false;
        for (var j = giaQui.length; j < cs.length; j++) {
          var k = chiave(cs[j]), nuova = !B.visti[k]; B.visti[k] = 1;
          var e = cartaEl(cs[j], false, '-420px', nuova); e.setAttribute('data-k', k); h.appendChild(e);
          if (nuova) { suono = true; arrivo = true; }
        }
        disponi(h); [].forEach.call(h.children, entra);
        var att = !fine && hs.length > 1 && i === (d.active_hand || 0);
        box.classList.toggle('on', fine || hs.length === 1 || att);
        var t = totTesto(cs, fine || m.done);
        if (hs.length > 1 || m.doubled) t += ' · ' + eur((m.bet_cent || 0) / 100);
        scrivi(box.lastChild, t, arrivo ? POSA : 0);
      });
      if (suono) XC.fx('deal');
      var tot = hs.reduce(function(a, m){ return a + (m.bet_cent || 0); }, 0) / 100;
      var ch = $('xcbj-chip');
      if (tot > 0 && ch.textContent !== lab(tot)) fiche(ch, tot);
    }
    function azioni(d){
      var m = (d.hands || [])[d.active_hand || 0] || { cards:[] };
      var posta = (m.bet_cent || 0) / 100, due = m.cards && m.cards.length === 2;
      var vv = function(c){ return c.r === 'A' ? 11 : ('JQK'.indexOf(c.r) >= 0 ? 10 : parseInt(c.r, 10)); };
      var puoD = due && !m.doubled && hasFunds(posta);
      var puoS = due && vv(m.cards[0]) === vv(m.cards[1]) && (d.hands || []).length < 4 && hasFunds(posta);
      $('xcbj-double').disabled = !puoD;
      $('xcbj-split').hidden = !puoS;
      var acts = $('xcbj-acts'); acts.classList.remove('xc-wait');
      if (acts.hidden) { $('xcbj-betui').hidden = true; acts.hidden = false; }
      var hs = d.hands || [];
      $('xcbj-hint').textContent = hs.length > 1 ? L('Mano ', 'Hand ') + ((d.active_hand || 0) + 1) + L(' di ', ' of ') + hs.length : '';
      if (valore(m.cards).v === 21) GBX.fx('coin');
    }
    function chiama(path, body, ok, ko){
      CBJ.busy = true;
      post(path, body).then(function(d){
        CBJ.busy = false;
        if (!d || d.error) { toast('⚠️ ' + ((d && d.error) || 'error'), 'err'); if (typeof loadBalance === 'function') loadBalance(); XC.fx('err'); ko(); return; }
        if (d.state === 'done') B.sal.tieni = true;
        if (d.btc !== undefined || d.cent !== undefined) { try { S.btc = saldoDa(d); refresh(); } catch(e){} }
        ok(d);
      }).catch(function(){ CBJ.busy = false; toast(L('Errore di rete', 'Network error'), 'err'); XC.fx('err'); ko(); });
    }
    CBJ.enter = function(){
      B.sal = prepara('bj'); testi();
      if (CBJ.fase === 'punta') { pulisci(); mostraPunta(); }
      else if (CBJ.fase === 'fine') mostraPunta();
      requestAnimationFrame(function(){ [].forEach.call(document.querySelectorAll('#bj .xc-hand'), disponi); });
    };
    CBJ.scegli = function(b){
      if ((CBJ.fase !== 'punta' && CBJ.fase !== 'fine') || CBJ.busy) return;
      CBJ.posta = b; try { localStorage.setItem('cbj_posta', String(b)); } catch(e){}
      XC.fx('chip'); fila($('xcbj-chips'), b); etichettaDai();
    };
    $('xcbj-chips').addEventListener('click', function(e){ var t = e.target.closest('button'); if (t) CBJ.scegli(parseFloat(t.getAttribute('data-v'))); });
    CBJ.cambia = function(){ if (CBJ.busy) return; CBJ.fase = 'punta'; pulisci(); mostraPunta(); };
    CBJ.dai = function(){
      if (CBJ.busy) return;
      if (!S.userId) { toast(L('Apri dentro Telegram per giocare', 'Open in Telegram to play'), 'err'); XC.fx('err'); return; }
      if (!hasFunds(CBJ.posta)) { toast(L('Saldo insufficiente', 'Insufficient balance'), 'err'); XC.fx('err'); scuoti($('xcbj-deal')); return; }
      if (CBJ.fase !== 'punta' && CBJ.fase !== 'fine') return;
      pulisci(); var tok = B.tok;
      CBJ.fase = 'dando'; $('xcbj-betui').hidden = true;
      fiche($('xcbj-chip'), CBJ.posta); XC.fx('chips');
      chiama('/bj/deal', Object.assign({ user_id:S.userId }, postaCent(CBJ.posta)), async function(d){
        CBJ.d = d;
        var h0 = (d.hands && d.hands[0]) ? d.hands[0].cards : [], bc = (d.hands && d.hands[0] && d.hands[0].bet_cent) || CBJ.posta * 100;
        var su = d.dealer_up || (d.dealer || [])[0];
        await wait(200); if (tok !== B.tok) return;
        mani({ hands:[{ cards:h0.slice(0, 1), bet_cent:bc }] }); await wait(300); if (tok !== B.tok) return;
        addBanco(su); await wait(300); if (tok !== B.tok) return;
        mani({ hands:[{ cards:h0, bet_cent:bc }] }); await wait(300); if (tok !== B.tok) return;
        addBanco(null, true); await wait(380); if (tok !== B.tok) return;
        if (d.state === 'done') { fine(d, tok); return; }
        CBJ.fase = 'gioca'; mani(d); azioni(d);
      }, function(){ CBJ.fase = 'punta'; pulisci(); mostraPunta(); });
    };
    CBJ.agisci = function(az){
      if (CBJ.busy || CBJ.fase !== 'gioca' || !CBJ.d) return;
      if (az === 'double' || az === 'split') XC.fx('chips');
      $('xcbj-acts').classList.add('xc-wait');
      var tok = B.tok;
      chiama('/bj/' + az, { user_id:S.userId }, function(d){
        if (tok !== B.tok) return;
        CBJ.d = d;
        if (d.state === 'done') { fine(d, tok); return; }
        mani(d); azioni(d);
      }, function(){ $('xcbj-acts').classList.remove('xc-wait'); });
    };
    async function fine(d, tok){
      CBJ.fase = 'finendo'; $('xcbj-hint').textContent = '';
      $('xcbj-acts').hidden = true; $('xcbj-acts').classList.remove('xc-wait');
      mani(d, false);
      var dl = d.dealer || [];
      await wait(380); if (tok !== B.tok) return;
      if (B.buco && dl[1]) { XC.fx('flip'); var e = B.buco; B.buco = null; B.banco.push(dl[1]); await gira(e, faccia(dl[1])); }
      else if (dl[1] && B.banco.length < 2) addBanco(dl[1]);
      if (tok !== B.tok) return;
      scrivi($('xcbj-dtot'), totTesto(B.banco, true));
      await wait(260);
      for (var k = B.banco.length; k < dl.length; k++) { if (tok !== B.tok) return; addBanco(dl[k]); await wait(520); }
      if (tok !== B.tok) return;
      esito(d, tok);
    }
    async function esito(d, tok){
      var hs = d.hands || [];
      mani(d, true);
      var messo = hs.reduce(function(a, m){ return a + (m.bet_cent || 0); }, 0) / 100;
      var vinto = d.win_mult != null ? messo * d.win_mult : (d.won_eur || 0);
      var netto = Math.round((vinto - messo) * 100) / 100;
      var bj = hs.length === 1 && hs[0].blackjack && !d.dealer_bj;
      var tutteSballate = hs.every(function(m){ return m.bust; });
      var dv = valore(d.dealer || []).v, m = $('xcbj-msg'), ch = $('xcbj-chip'), cont = $('xcbj-mani');
      [].forEach.call(cont.children, function(box, i){
        var h = hs[i] || {}, persa = h.bust || (!h.won && !h.push && !(netto > 0 && hs.length === 1));
        if (h.won || (hs.length === 1 && netto > 0)) box.firstChild.classList.add('x-glow');
        else if (persa && !h.push) [].forEach.call(box.firstChild.children, function(c){ c.classList.add('dim'); });
        if (hs.length > 1) box.lastChild.textContent += ' · ' + (h.won ? L('vinta', 'won') : h.push ? L('pari', 'push') : L('persa', 'lost'));
      });
      B.sal.lascia();
      if (netto > 0) {
        messaggio(m, bj ? 'Blackjack' : L('Vinci', 'You win'), '+' + eur(netto), true);
        $('xcbj-hint').textContent = bj ? L('Il blackjack paga 3 a 2', 'Blackjack pays 3 to 2') : (dv > 21 ? L('Il banco sballa con ', 'Dealer busts with ') + dv : '');
        XC.fx(bj ? 'bj' : 'win'); arco(ch, 1); GBX.sparks(m, bj ? 36 : 22); setTimeout(function(){ XC.fx('chips'); }, 260);
        B.sal.delta(netto);
      } else if (netto === 0 && vinto > 0) {
        messaggio(m, L('Pari', 'Push'), L('puntata restituita', 'bet returned'), false, 'var(--x-fg)');
        XC.fx('push');
      } else {
        var tit = d.dealer_bj ? L('Blackjack del banco', 'Dealer blackjack') : (tutteSballate ? L('Sballato', 'Bust') : L('Il banco vince', 'Dealer wins'));
        messaggio(m, tit, '−' + eur(Math.abs(netto)), false, 'var(--x-loss)');
        XC.fx('lose'); arco(ch, -1); B.sal.delta(netto);
      }
      perche(m, $('xcbj-hint'));
      CBJ.fase = 'fine';
      await wait(1500); if (tok !== B.tok) return;
      m.classList.remove('show'); try { var tv2 = m.closest('.xc-table'); if (tv2) tv2.classList.remove('xc-msgon'); } catch(e){} mostraPunta();
    }
    REG.bj = function(){
      return '<h3>' + L('Blackjack', 'Blackjack') + '</h3>' +
        '<p>' + L('Arriva più vicino a 21 del banco senza sballare. Le figure valgono 10, l’asso 1 o 11.', 'Get closer to 21 than the dealer without busting. Faces are 10, aces 1 or 11.') + '</p>' +
        '<p><b>' + L('Carta', 'Hit') + '</b> ' + L('ne chiedi un’altra', 'take another card') + ' · <b>' + L('Stai', 'Stand') + '</b> ' + L('ti fermi', 'stop') +
        ' · <b>' + L('Raddoppia', 'Double') + '</b> ' + L('raddoppi la posta e prendi una sola carta', 'double the bet and take one card') +
        ' · <b>' + L('Dividi', 'Split') + '</b> ' + L('due carte uguali diventano due mani', 'two equal cards become two hands') + '</p>' +
        '<div class="xc-pay"><span>' + L('Vincita', 'Win') + '</span><b>1:1</b><span>Blackjack</span><b>3:2</b><span>' + L('Pari', 'Push') + '</span><b>' + L('posta indietro', 'bet back') + '</b></div>' +
        '<p class="xc-mutp">' + L('Il banco sta su 17. Il risultato lo decide il server.', 'Dealer stands on 17. The server decides the result.') + '</p>';
    };
  })();
  (function(){
    var CHP = window.CHP; if (!CHP || !$('xcpk-tav')) return;
    var PAGA = [[9,100],[8,20],[7,10],[6,3],[5,2],[4,1]];
    var P = { tok:0, pEls:[], bEls:[], dEls:[], sal:null };
    function slot(i){ return $('xcpk-board').children[i]; }
    function etichettaDai(){
      $('xcpk-deal').textContent = (CHP.fase === 'fine' ? L('Rigioca', 'Play again') : L('Distribuisci', 'Deal')) + ' · ante ' + eur(CHP.ante);
      $('xcpk-need').textContent = L('servono ', 'you need ') + eur(CHP.ante * 3) + ' (ante + call)';
    }
    function mostraPunta(){
      fila($('xcpk-chips'), CHP.ante); etichettaDai();
      $('xcpk-betui').hidden = false; $('xcpk-acts').hidden = true;
    }
    function nomeMano(comm, poi){
      var m = CASA.manoMigliore((CHP.d && CHP.d.player || []).concat(comm || []));
      var t = m ? m.nome : '';
      if (m && m.cat >= 5) { var p = PAGA.filter(function(x){ return x[0] === m.cat; })[0]; if (p) t += ' · ' + L('l’ante paga ', 'ante pays ') + p[1] + ':1'; }
      scrivi($('xcpk-pname'), t, poi);
      return m;
    }
    function pulisci(){
      P.tok++; P.pEls = []; P.bEls = []; P.dEls = [];
      $('xcpk-dh').innerHTML = ''; $('xcpk-ph').innerHTML = '';
      [].forEach.call($('xcpk-board').children, function(s){ s.innerHTML = ''; });
      $('xcpk-dname').textContent = ''; var q = $('xcpk-qual'); q.className = 'xc-qual'; q.textContent = '';
      scrivi($('xcpk-pname'), ''); $('xcpk-hint').textContent = L('Il banco gioca con coppia di 4 o meglio', 'Dealer qualifies with a pair of 4s or better');
      var m = $('xcpk-msg'); m.className = 'x-msg'; m.innerHTML = '';
      via($('xcpk-ante')); via($('xcpk-call'));
      $('xcpk-tav').classList.remove('xc-fold', 'xc-esito');
    }
    function tu(c){ var e = cartaEl(c, false, '-420px', true); $('xcpk-ph').appendChild(e); disponi($('xcpk-ph')); entra(e); P.pEls.push(e); XC.fx('deal'); }
    function banco(){ var e = cartaEl(null, true, '-140px', true); $('xcpk-dh').appendChild(e); disponi($('xcpk-dh')); entra(e); P.dEls.push(e); XC.fx('deal'); }
    function tavolo(c, i){ var e = cartaEl(c, false, '-260px', true); slot(i).innerHTML = ''; slot(i).appendChild(e); entra(e); P.bEls[i] = e; XC.fx('flip'); }
    function chiama(path, body, ok, ko){
      CHP.busy = true;
      post(path, body).then(function(d){
        CHP.busy = false;
        if (!d || d.error) {
          var m = (d && d.error) || 'error';
          if (/3x the ante/.test(m)) m = L('Saldo insufficiente: servono ', 'Insufficient balance: you need ') + eur(CHP.ante * 3) + ' (ante + call)';
          toast('⚠️ ' + m, 'err'); if (typeof loadBalance === 'function') loadBalance(); XC.fx('err'); ko(); return;
        }
        if (d.done) P.sal.tieni = true;
        if (d.btc !== undefined || d.cent !== undefined) { try { S.btc = saldoDa(d); refresh(); } catch(e){} }
        ok(d);
      }).catch(function(){ CHP.busy = false; toast(L('Errore di rete', 'Network error'), 'err'); XC.fx('err'); ko(); });
    }
    function testi(){
      $('xcpk-fold').querySelector('.xc-l').textContent = L('Lascia', 'Fold');
      $('xcpk-callb').querySelector('.xc-l').textContent = L('Gioca', 'Call');
    }
    CHP.enter = function(){
      P.sal = prepara('poker'); testi();
      if (CHP.fase === 'punta') { pulisci(); mostraPunta(); }
      else if (CHP.fase === 'fine') mostraPunta();
      requestAnimationFrame(function(){ disponi($('xcpk-ph')); disponi($('xcpk-dh')); });
    };
    CHP.scegli = function(b){
      if ((CHP.fase !== 'punta' && CHP.fase !== 'fine') || CHP.busy) return;
      CHP.ante = b; try { localStorage.setItem('chp_ante', String(b)); } catch(e){}
      XC.fx('chip'); fila($('xcpk-chips'), b); etichettaDai();
    };
    $('xcpk-chips').addEventListener('click', function(e){ var t = e.target.closest('button'); if (t) CHP.scegli(parseFloat(t.getAttribute('data-v'))); });
    CHP.cambia = function(){ if (CHP.busy) return; CHP.fase = 'punta'; pulisci(); mostraPunta(); };
    CHP.dai = function(){
      if (CHP.busy) return;
      if (!S.userId) { toast(L('Apri dentro Telegram per giocare', 'Open in Telegram to play'), 'err'); XC.fx('err'); return; }
      if (!hasFunds(CHP.ante * 3)) { toast(L('Saldo insufficiente: servono ', 'Insufficient balance: you need ') + eur(CHP.ante * 3) + ' (ante + call)', 'err'); XC.fx('err'); scuoti($('xcpk-deal')); return; }
      if (CHP.fase !== 'punta' && CHP.fase !== 'fine') return;
      pulisci(); var tok = P.tok;
      CHP.fase = 'dando'; $('xcpk-betui').hidden = true;
      fiche($('xcpk-ante'), CHP.ante); XC.fx('chips');
      chiama('/poker/deal', Object.assign({ user_id:S.userId }, postaCent(CHP.ante, 'ante')), async function(d){
        CHP.d = d; CHP.fase = 'decidi';
        var pl = d.player || [], cm = (d.community || []).slice(0, 3);
        await wait(200); if (tok !== P.tok) return; tu(pl[0]);
        await wait(260); if (tok !== P.tok) return; banco();
        await wait(260); if (tok !== P.tok) return; tu(pl[1]);
        await wait(260); if (tok !== P.tok) return; banco();
        for (var i = 0; i < cm.length; i++) { await wait(300); if (tok !== P.tok) return; tavolo(cm[i], i); }
        await wait(380); if (tok !== P.tok) return;
        var m = nomeMano(cm);
        $('xcpk-hint').textContent = (m && m.cat >= 1 ? L('Hai ', 'You have ') + m.nome.toLowerCase() + ' · ' : '') +
          L('gioca +', 'call +') + eur(CHP.ante * 2) + L(' · lascia −', ' · fold −') + eur(CHP.ante);
        var a = $('xcpk-acts'); a.classList.remove('xc-wait'); a.hidden = false;
        if (m && m.cat >= 2) GBX.fx('coin');
      }, function(){ CHP.fase = 'punta'; pulisci(); mostraPunta(); });
    };
    CHP.agisci = function(az){
      if (CHP.busy || CHP.fase !== 'decidi') return;
      CHP.fase = 'chiamo'; var tok = P.tok, a = $('xcpk-acts');
      a.classList.add('xc-wait');
      if (az === 'call') { fiche($('xcpk-call'), CHP.ante * 2); XC.fx('chips'); $('xcpk-hint').textContent = L('Turn e river…', 'Turn and river…'); }
      else { XC.fx('fold'); $('xcpk-tav').classList.add('xc-fold'); P.pEls.forEach(function(e){ e.classList.add('dim'); }); $('xcpk-hint').textContent = ''; }
      chiama('/poker/act', { user_id:S.userId, action:az }, function(d){
        if (tok !== P.tok) return;
        CHP.d = d; a.hidden = true; a.classList.remove('xc-wait'); mostra(d, az, tok);
      }, function(){
        CHP.fase = 'decidi'; a.classList.remove('xc-wait');
        if (az === 'call') via($('xcpk-call')); else { $('xcpk-tav').classList.remove('xc-fold'); P.pEls.forEach(function(e){ e.classList.remove('dim'); }); }
      });
    };
    async function mostra(d, az, tok){
      CHP.fase = 'finendo';
      var comm = d.community || [];
      if (az === 'call') {
        for (var i = 3; i < 5 && i < comm.length; i++) { await wait(i === 3 ? 200 : 520); if (tok !== P.tok) return; tavolo(comm[i], i); nomeMano(comm.slice(0, i + 1), POSA); }
        await wait(500); if (tok !== P.tok) return;
      } else await wait(300);
      var dl = d.dealer || [];
      for (var k = 0; k < P.dEls.length && k < dl.length; k++) { XC.fx('flip'); await gira(P.dEls[k], faccia(dl[k])); if (tok !== P.tok) return; }
      if (az === 'call') {
        var mb = CASA.manoMigliore(dl.concat(comm));
        $('xcpk-dname').textContent = L('Banco', 'Dealer') + (mb ? ' · ' + mb.nome : '');
        var q = $('xcpk-qual');
        if (d.dealer_qualifies === false) { q.textContent = L('non gioca', 'no qualify'); q.className = 'xc-qual no'; }
        else if (d.dealer_qualifies) { q.textContent = L('gioca', 'qualifies'); q.className = 'xc-qual si'; }
      }
      await wait(520); if (tok !== P.tok) return;
      esito(d, az, comm, tok);
    }
    async function esito(d, az, comm, tok){
      var ante = CHP.ante, messo = az === 'call' ? ante * 3 : ante;
      var mt = CASA.manoMigliore((d.player || []).concat(comm));
      var netto = d.result === 'win' ? Math.round(((d.won_cent || 0) / 100 - messo) * 100) / 100 : (d.result === 'push' ? 0 : -messo);
      var m = $('xcpk-msg'), hint = $('xcpk-hint');
      $('xcpk-tav').classList.add('xc-esito');
      P.sal.lascia();
      if (d.result === 'win') {
        var tutte = P.pEls.concat(P.bEls);
        if (mt && mt.idx && mt.idx.length) tutte.forEach(function(e, i){ if (!e) return; if (mt.idx.indexOf(i) >= 0) e.classList.add('xc-best'); else e.classList.add('dim'); });
        $('xcpk-ph').classList.add('x-glow');
        var grande = (d.ch_paga || 1) >= 3;
        messaggio(m, grande && mt ? mt.nome : L('Vinci', 'You win'), '+' + eur(netto), true);
        hint.textContent = d.reason === 'dealer_no_qualify'
          ? L('Il banco non gioca: l’ante paga ', 'Dealer does not qualify: ante pays ') + (d.ch_paga || 1) + ':1, ' + L('il call torna indietro', 'call returned')
          : (d.your_hand || '') + ' vs ' + (d.dealer_hand || '');
        XC.fx(grande ? 'bj' : 'win'); setTimeout(function(){ XC.fx('chips'); }, 260);
        arco($('xcpk-ante'), 1); arco($('xcpk-call'), 1); GBX.sparks(m, grande ? 36 : 22);
        P.sal.delta(netto);
      } else if (d.result === 'push') {
        messaggio(m, L('Pari', 'Push'), L('ti torna tutto: ', 'all returned: ') + eur(messo), false, 'var(--x-fg)');
        hint.textContent = (d.your_hand || '') + ' vs ' + (d.dealer_hand || '');
        XC.fx('push');
      } else {
        P.pEls.forEach(function(e){ e.classList.add('dim'); });
        messaggio(m, d.reason === 'fold' ? L('Hai lasciato', 'You folded') : L('Il banco vince', 'Dealer wins'), '−' + eur(Math.abs(netto)), false, 'var(--x-loss)');
        hint.textContent = d.reason === 'fold' ? '' : (d.dealer_hand || '') + ' vs ' + (d.your_hand || '');
        XC.fx('lose'); arco($('xcpk-ante'), -1); arco($('xcpk-call'), -1);
        P.sal.delta(netto);
      }
      perche(m, hint);
      CHP.fase = 'fine';
      await wait(1600); if (tok !== P.tok) return;
      m.classList.remove('show'); try { var tv2 = m.closest('.xc-table'); if (tv2) tv2.classList.remove('xc-msgon'); } catch(e){} mostraPunta();
    }
    REG.poker = function(){
      var h = '<h3>Casino Hold’em</h3>' +
        '<p>' + L('Metti l’ante: ricevi 2 carte e vedi subito il flop. Il banco ha 2 carte coperte.', 'Place the ante: you get 2 cards and see the flop. The dealer has 2 hidden cards.') + '</p>' +
        '<p><b>' + L('Lascia', 'Fold') + '</b> ' + L('perdi l’ante.', 'you lose the ante.') + ' <b>' + L('Gioca', 'Call') + '</b> ' + L('metti 2 volte l’ante, escono turn e river.', 'you add 2x the ante, turn and river are dealt.') + '</p>' +
        '<p>' + L('Il banco gioca solo con una coppia di 4 o meglio. Se non gioca: l’ante paga la tabella e il call torna indietro. Se gioca e vinci: ante a tabella + call 1:1. Pari: tutto indietro.',
                 'The dealer plays only with a pair of 4s or better. If not: the ante pays the table and the call is returned. If the dealer plays and you win: ante per table + call 1:1. Tie: everything back.') + '</p>' +
        '<div class="xc-pay">';
      PAGA.forEach(function(p){ h += '<span>' + (p[0] === 4 ? L('Scala o meno', 'Straight or less') : CASA.nomeMano(p[0])) + '</span><b>' + p[1] + ':1</b>'; });
      return h + '</div><p class="xc-mutp">' + L('Il risultato lo decide il server.', 'The server decides the result.') + '</p>';
    };
  })();
  (function(){
    if (!$('xcdc-stage')) return;
    var CDC = window.CDC || (window.CDC = { L:L });
    var D = { sal:null, pronto:false };
    function posta(){ try { return currentBet.dice; } catch(e){ return 0; } }
    function lbl(x){ return (typeof betLbl === 'function') ? betLbl(x) : eur(x); }
    CDC.tasto = function(){ var b = $('dc-roll'); if (!b) return; var p = posta(); b.textContent = L('Tira i dadi', 'Roll the dice') + (p ? ' · ' + lbl(p) : ''); };
    var entraVecchio = CDC.entra;
    CDC.entra = function(){
      if (entraVecchio) try { entraVecchio(); } catch(e){}
      var t = { lo:L('Basso', 'Low'), '7':L('Sette', 'Lucky seven'), hi:L('Alto', 'High') };
      document.querySelectorAll('#dice .dc-bet-card').forEach(function(b){ var e = b.querySelector('.dc-bc-name'); if (e) e.textContent = t[b.getAttribute('data-dc')] || e.textContent; });
      var a = document.querySelector('#dice .dc-pick-lbl'); if (a) a.textContent = L('Scegli la puntata', 'Pick your bet');
      var c = document.querySelector('#dice .dc-section-lbl'); if (c) c.textContent = L('Valore della fiche', 'Chip value');
      var tl = document.querySelector('#dice .dc-total-lbl'); if (tl) tl.textContent = L('Totale', 'Total');
      document.querySelectorAll('#dc-bets .bet-btn').forEach(function(b){ b.classList.add('x-num'); });
      var on = document.querySelector('#dc-bets .bet-btn.sel'), cont = $('dc-bets');
      if (on) requestAnimationFrame(function(){ cont.scrollLeft = on.offsetLeft - cont.clientWidth / 2 + on.offsetWidth / 2; });
      CDC.tasto();
    };
    CDC.via = function(){ var p = $('cdc-pay'); if (p) { p.className = 'cdc-pay'; p.textContent = ''; }
      var st = $('xcdc-stage'); st.classList.remove('x-glow', 'xc-perso'); };
    CDC.fine = function(r, bet){
      if (!r || r.error) return;
      var st = $('dc-status'), p = $('cdc-pay'), stage = $('xcdc-stage');
      var conto = r.d1 + ' + ' + r.d2 + ' = ' + r.sum;
      if (r.won) {
        var win = (r.payout_cent != null) ? r.payout_cent / 100 : (r.payout_btc || 0) * S.rate;
        var big = (+r.mult || 0) >= 5;
        if (st) st.textContent = (big ? L('Sette! ', 'Seven! ') : L('Vinto · ', 'Won · ')) + conto + ' · ×' + r.mult;
        if (p) { p.className = 'cdc-pay on win' + (big ? ' big' : '');
          p.innerHTML = '<b class="x-num">+€0.00</b><small>' + L('netto', 'net') + ' +' + eur(win - bet) + '</small>';
          GBX.count(p.firstChild, 0, win, function(x){ return '+' + eur(x); }, big ? 1100 : 700); }
        stage.classList.add('x-glow'); GBX.sparks($('dc-total'), big ? 36 : 22); GBX.hap('success');
        if (D.sal) D.sal.delta(win - bet);
      } else {
        if (st) st.textContent = L('Perso · ', 'Lost · ') + conto;
        if (p) { p.className = 'cdc-pay on lose'; p.innerHTML = '<b class="x-num">−' + eur(bet) + '</b>'; }
        stage.classList.add('xc-perso'); scuoti(stage); GBX.hap('error');
        if (D.sal) D.sal.delta(-bet);
      }
      CDC.tasto();
    };
    $('dc-bets').addEventListener('click', function(e){ if (e.target.closest('button')) XC.fx('chip'); });
    try { new MutationObserver(function(){ var s = $('dc-status'); if (s && /^⚠️/.test(s.textContent)) { GBX.fx('err'); scuoti($('dc-roll')); } })
      .observe($('dc-status'), { childList:true, characterData:true, subtree:true }); } catch(e){}
    document.addEventListener('gbx:screen', function(ev){
      if (ev.detail.id !== 'dice') return;
      D.sal = prepara('dice');
      if (!D.pronto) { D.pronto = true; GBX.scrollFx($('xcdc-scroll')); }
    });
    REG.dice = function(){
      function m(id){ var e = $(id); return e ? e.textContent : ''; }
      return '<h3>' + L('Dadi', 'Dice') + '</h3><p>' + L('Scegli dove cade la somma dei due dadi, poi tira.', 'Pick where the sum of the two dice lands, then roll.') + '</p>' +
        '<div class="xc-pay"><span>' + L('Basso', 'Low') + ' · 2–6</span><b>' + m('dc-m-lo') + '</b><span>' + L('Sette', 'Lucky seven') + ' · 7</span><b>' + m('dc-m-7') + '</b><span>' + L('Alto', 'High') + ' · 8–12</span><b>' + m('dc-m-hi') + '</b></div>' +
        '<p class="xc-mutp">' + L('I dadi li tira il server: la pagina mostra il tiro che arriva.', 'The server rolls the dice: the page shows the roll it receives.') + '</p>';
    };
  })();
  (function(){
    if (!$('xcrl-scroll') || typeof RL === 'undefined') return;
    var CRL = window.CRL || (window.CRL = {});
    var R = { sal:null, pronto:false };
    function lbl(x){ return (typeof betLbl === 'function') ? betLbl(x) : eur(x); }
    function totUltime(){ var t = 0; (RL.last || []).forEach(function(b){ t += b.amount; }); return Math.round(t * 100) / 100; }
    window.rl4DrawWheel = function(){
      var cv = $('rl4-cv'), wh = $('rl4-wheel'); if (!cv || !wh) return;
      var css = wh.clientWidth || 260, dpr = Math.min(2.5, window.devicePixelRatio || 1), Sz = Math.round(css * dpr);
      if (cv.width === Sz && cv._ok === 2) return; cv.width = cv.height = Sz; cv._ok = 2;
      var x = cv.getContext('2d'), Rr = Sz / 2, step = Math.PI * 2 / 37; x.translate(Rr, Rr);
      function ring(r0, r1, fill){ x.beginPath(); x.arc(0, 0, r1, 0, Math.PI * 2); x.arc(0, 0, r0, 0, Math.PI * 2, true); x.fillStyle = fill; x.fill(); }
      var g = x.createLinearGradient(-Rr, -Rr, Rr, Rr); g.addColorStop(0, '#3a3a40'); g.addColorStop(.5, '#1a1a1e'); g.addColorStop(1, '#0b0b0d'); ring(Rr * .9, Rr, g);
      ring(Rr * .875, Rr * .905, 'rgba(255,255,255,.28)');
      g = x.createRadialGradient(0, 0, Rr * .74, 0, 0, Rr * .875); g.addColorStop(0, '#09090b'); g.addColorStop(.6, '#1d1d22'); g.addColorStop(1, '#0c0c0e'); ring(Rr * .76, Rr * .875, g);
      var COL = { red:['#e2566a', '#8e2a3a'], black:['#25252b', '#101013'], green:['#2fb894', '#14634f'] };
      for (var i = 0; i < 37; i++) {
        var n = ROULETTE_ORDER[i], c = COL[rl4Color(n)], a0 = -Math.PI / 2 + (i - .5) * step, a1 = a0 + step;
        x.beginPath(); x.arc(0, 0, Rr * .76, a0, a1); x.arc(0, 0, Rr * .60, a1, a0, true); x.closePath(); x.fillStyle = c[0]; x.fill();
        x.beginPath(); x.arc(0, 0, Rr * .60, a0, a1); x.arc(0, 0, Rr * .47, a1, a0, true); x.closePath();
        var pg = x.createRadialGradient(0, 0, Rr * .47, 0, 0, Rr * .6); pg.addColorStop(0, c[1]); pg.addColorStop(1, c[0]); x.fillStyle = pg; x.fill();
        x.save(); x.rotate(i * step); x.fillStyle = '#fff'; x.font = '600 ' + Math.round(Rr * .085) + 'px "Inter Tight","Inter",system-ui,sans-serif';
        x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(n), 0, -Rr * .68); x.restore();
      }
      x.strokeStyle = 'rgba(255,255,255,.32)'; x.lineWidth = Math.max(1, Rr * .008);
      for (i = 0; i < 37; i++) { var a = -Math.PI / 2 + (i - .5) * step; x.beginPath(); x.moveTo(Math.cos(a) * Rr * .47, Math.sin(a) * Rr * .47); x.lineTo(Math.cos(a) * Rr * .76, Math.sin(a) * Rr * .76); x.stroke(); }
      x.lineWidth = Math.max(1, Rr * .012); x.beginPath(); x.arc(0, 0, Rr * .60, 0, Math.PI * 2); x.stroke(); x.beginPath(); x.arc(0, 0, Rr * .76, 0, Math.PI * 2); x.stroke();
      g = x.createRadialGradient(-Rr * .12, -Rr * .14, Rr * .02, 0, 0, Rr * .47); g.addColorStop(0, '#4a4a52'); g.addColorStop(.6, '#1d1d22'); g.addColorStop(1, '#0d0d0f');
      x.beginPath(); x.arc(0, 0, Rr * .47, 0, Math.PI * 2); x.fillStyle = g; x.fill(); x.strokeStyle = 'rgba(255,255,255,.22)'; x.lineWidth = Math.max(1, Rr * .01); x.stroke();
      var tg = x.createLinearGradient(-Rr * .2, -Rr * .2, Rr * .2, Rr * .2); tg.addColorStop(0, '#ffffff'); tg.addColorStop(.5, '#c9c7d6'); tg.addColorStop(1, '#6e6c7a');
      x.fillStyle = tg;
      for (i = 0; i < 4; i++) { x.save(); x.rotate(i * Math.PI / 2); x.beginPath(); x.moveTo(-Rr * .02, 0); x.lineTo(-Rr * .012, -Rr * .27); x.arc(0, -Rr * .285, Rr * .026, Math.PI * .6, Math.PI * 2.4); x.lineTo(Rr * .02, 0); x.closePath(); x.fill(); x.restore(); }
      x.beginPath(); x.arc(0, 0, Rr * .085, 0, Math.PI * 2); x.fill();
      x.beginPath(); x.arc(0, 0, Rr * .035, 0, Math.PI * 2); x.fillStyle = '#8f86f2'; x.fill();
    };
    CRL.entra = function(){
      var m = { num:[L('Numero', 'Number'), '×36'], cavallo:['Cavallo', L('2 numeri', '2 nums') + ' · ×18'], quartina:['Quartina', L('4 numeri', '4 nums') + ' · ×9'] };
      document.querySelectorAll('#roulette .rl4-modes button').forEach(function(b){ var k = m[b.getAttribute('data-m')]; if (k) b.innerHTML = k[0] + '<small>' + k[1] + '</small>'; });
      var tot = document.querySelector('#roulette .rl4-info .tot');
      if (tot && tot.firstChild && tot.firstChild.nodeType === 3) tot.firstChild.textContent = L('Puntata', 'Bet');
      var a = { undo:L('Annulla', 'Undo'), clear:L('Togli', 'Clear'), rebet:L('Ripeti', 'Rebet'), double:L('Doppia', 'Double') };
      for (var k in a) { var el = $('rl4-' + k); if (el) el.querySelector('.xc-l').textContent = a[k]; }
      var em = document.querySelector('#rl4-hist em'); if (em) em.textContent = L('Ultimi numeri', 'Last numbers');
    };
    CRL.info = function(n){
      var sp = $('rl4-spin');
      var re = !n && RL.last && RL.last.length && !RL.spinning;
      if (sp) sp.textContent = re ? L('Rigioca', 'Play again') + ' · ' + lbl(totUltime()) : (RL.spinning ? L('Gira…', 'Spinning…') : L('Gira', 'Spin') + (n ? ' · ' + lbl(rl4Tot()) : ''));
      if (RL.spinning) return;
      var t;
      if (n) t = L('Pronto? Gira!', 'Ready? Spin!');
      else if (re) t = L('Punta di nuovo o rigioca le ultime', 'Bet again or replay your last bets');
      else if (RL.mode === 'cavallo') t = L('Tocca un numero vicino al bordo che vuoi', 'Tap a number near the edge you want');
      else if (RL.mode === 'quartina') t = L('Tocca un numero vicino all’angolo che vuoi', 'Tap a number near the corner you want');
      else t = L('Tocca un numero o una puntata esterna', 'Tap a number or an outside bet');
      rl4Msg(t);
    };
    var testoVecchio = CRL.testo;
    CRL.testo = function(won, tot, n, c){
      if (R.sal) R.sal.delta(Math.round((won - tot) * 100) / 100);
      if (!won) { GBX.hap('error'); $('rl4-wheel').classList.add('xc-perso'); }
      return testoVecchio ? testoVecchio(won, tot, n, c) : '';
    };
    CRL.festa = function(won, tot){
      if (!won) return;
      var wh = $('rl4-wheel'), ratio = won / Math.max(.01, tot);
      if (ratio > 1.005) { $('rl4-res').classList.add('x-glow'); setTimeout(function(){ GBX.sparks($('rl4-res'), ratio >= 5 ? 36 : 22); }, 200); }
      var m = $('rl4-msg'); if (m && m.animate) m.animate([{ transform:'scale(1.25)' }, { transform:'none' }], { duration:350, easing:'cubic-bezier(.34,1.56,.64,1)' });
    };
    var spinVecchio = window.rlSpin;
    window.rlSpin = function(){
      var r = spinVecchio.apply(this, arguments);
      if (RL.spinning) {
        $('rl4-res').classList.remove('x-glow'); $('rl4-wheel').classList.remove('xc-perso');
        var sc = $('xcrl-scroll'); if (sc.scrollTop > 4) try { sc.scrollTo({ top:0, behavior: lite() ? 'auto' : 'smooth' }); } catch(e){ sc.scrollTop = 0; }
      }
      return r;
    };
    $('rl4-rack').addEventListener('click', function(e){ if (e.target.closest('button')) GBX.hap('light'); });
    document.querySelector('#roulette .rl4-acts').addEventListener('click', function(e){ if (e.target.closest('button')) GBX.hap('sel'); });
    document.addEventListener('gbx:screen', function(ev){
      if (ev.detail.id !== 'roulette') return;
      R.sal = prepara('roulette');
      if (!R.pronto) { R.pronto = true; GBX.scrollFx($('xcrl-scroll')); }
    });
    REG.roulette = function(){
      return '<h3>Roulette</h3><p>' + L('Tocca il tavolo per puntare con la fiche scelta. Cavallo e quartina: tocca il numero vicino al bordo o all’angolo che vuoi.',
        'Tap the table to bet with the chosen chip. Cavallo and quartina: tap the number near the edge or corner you want.') + '</p>' +
        '<div class="xc-pay"><span>' + L('Numero', 'Number') + '</span><b>×36</b><span>Cavallo</span><b>×18</b><span>Quartina</span><b>×9</b>' +
        '<span>' + L('Dozzina', 'Dozen') + '</span><b>×3</b><span>' + L('Rosso, nero, pari, dispari, 1-18, 19-36', 'Red, black, even, odd, 1-18, 19-36') + '</span><b>×2</b></div>' +
        '<p class="xc-mutp">' + L('Il numero lo decide il server.', 'The server decides the number.') + '</p>';
    };
  })();
})();
;
(function(){
  'use strict';
  if (window.XR || !window.GBX) return;
  var XR = window.XR = {};
  var L = GBX.L;
  var GIOCHI = { crash:'cr-bal', plinko:'cpl-bal', wheel:'wh-bal', slots:'slots-bal' };
  function $(id){ return document.getElementById(id); }
  function num(t){ var s = String(t || '').replace(/[^0-9.,-]/g, ''); if (!s) return NaN;
    if (s.indexOf(',') >= 0 && s.indexOf('.') >= 0) s = s.replace(/,/g, ''); else s = s.replace(',', '.');
    return parseFloat(s); }
  function specchio(g){
    var vero = $(GIOCHI[g]), scr = $(g); if (!vero || !scr || vero.__xr) return;
    vero.__xr = true;
    var box = scr.querySelector('.xr-bal'), bv = box && box.querySelector('.xr-bv'), dl = box && box.querySelector('.xr-dl');
    if (!bv) return;
    var ora = vero.textContent; bv.textContent = ora;
    var tDl = 0;
    function aggiorna(){
      var t = vero.textContent; if (t === ora) return;
      var a = num(ora), b = num(t); ora = t;
      if (!scr.classList.contains('active') || isNaN(a) || isNaN(b) || Math.abs(b - a) < 0.005) { bv.textContent = t; return; }
      GBX.count(bv, a, b, function(v){ return '€' + v.toFixed(2); }, 700);
      setTimeout(function(){ if (vero.textContent === t) bv.textContent = t; }, 760);
      if (b > a && dl) {
        dl.textContent = '+€' + (b - a).toFixed(2); dl.className = 'xr-dl x-num su';
        clearTimeout(tDl); tDl = setTimeout(function(){ dl.className = 'xr-dl x-num'; }, 1500);
        box.classList.remove('x-pop'); void box.offsetWidth; box.classList.add('x-pop');
      }
    }
    try { new MutationObserver(aggiorna).observe(vero, { childList:true, characterData:true, subtree:true }); } catch(e){}
    vero.__xrSync = function(){ ora = vero.textContent; bv.__xc = (bv.__xc || 0) + 1; bv.textContent = ora; if (dl) dl.className = 'xr-dl x-num'; };
  }
  XR.alone = function(cont){
    var a = cont && cont.querySelector('.xr-alone'); if (!a) return;
    a.classList.remove('x-glow'); void a.offsetWidth; a.classList.add('x-glow');
    clearTimeout(a.__t); a.__t = setTimeout(function(){ a.classList.remove('x-glow'); }, 1700);
  };
  XR.vinci = function(cont, n){ XR.alone(cont); if (n > 0) GBX.sparks(cont, n); };
  var tMsg = 0;
  XR.esitoPlinko = function(g){
    if (!g || !g.n) return;
    var m = $('xr-msg-plinko'), box = $('cpl-tav'); if (!m) return;
    var netto = Math.round((g.vinto - g.puntato) * 100) / 100, E = CASA.eur;
    var titolo = netto > 0 ? L('Vinci', 'You win') : netto < 0 ? L('Giro chiuso', 'Round over') : L('Pari', 'Even');
    var sotto = netto > 0 ? '+' + E(netto) : netto < 0 ? '−' + E(-netto) : L('puntata restituita', 'stake back');
    m.innerHTML = titolo + '<small class="x-num">' + sotto + '</small>';
    m.className = 'x-msg xr-msg' + (netto > 0 ? ' good' : netto < 0 ? ' bad' : '');
    void m.offsetWidth; m.classList.add('show');
    if (netto > 0) { XR.alone(box); GBX.sparks(m, 12); }
    clearTimeout(tMsg); tMsg = setTimeout(function(){ m.classList.remove('show'); }, 1600);
  };
  XR.info = function(g){
    if (g === 'slots') { try { slv2OpenPaytable(); } catch(e){} GBX.fx('open'); return; }
    var el = $({ crash:'ccr-regole', plinko:'cpl-regole', wheel:'cwh-tabella' }[g]);
    GBX.fx('open');
    if (el) try { el.scrollIntoView({ behavior:'smooth', block:'center' }); } catch(e){ el.scrollIntoView(); }
  };
  var NB = null;
  XR.boom = function(){
    try {
      if (typeof TWS !== 'undefined' && TWS && TWS.on === false) return;
      if (typeof TWS !== 'undefined' && TWS && !TWS.ctx && TWS.init) TWS.init();
      var c = (typeof TWS !== 'undefined' && TWS && TWS.ctx) || null;
      if (!c) { CASA.sfx('boom'); return; }
      if (c.state === 'suspended') c.resume();
      var out = c.createGain(); out.gain.value = 0.8; out.connect((TWS.mg) || c.destination);
      var t = c.currentTime;
      if (!NB) { NB = c.createBuffer(1, c.sampleRate, c.sampleRate); var d = NB.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
      var s = c.createBufferSource(); s.buffer = NB; var f = c.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 0.6;
      f.frequency.setValueAtTime(1600, t); f.frequency.exponentialRampToValueAtTime(70, t + 0.7);
      var g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.42, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
      s.connect(f); f.connect(g); g.connect(out); s.start(t); s.stop(t + 0.85);
      var o = c.createOscillator(), og = c.createGain(); o.type = 'sine';
      o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.45);
      og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(0.5, t + 0.008); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      o.connect(og); og.connect(out); o.start(t); o.stop(t + 0.55);
      var k = c.createBufferSource(); k.buffer = NB; var kf = c.createBiquadFilter(); kf.type = 'bandpass'; kf.frequency.value = 2400; kf.Q.value = 0.9;
      var kg = c.createGain(); kg.gain.setValueAtTime(0.0001, t); kg.gain.exponentialRampToValueAtTime(0.22, t + 0.002); kg.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      k.connect(kf); kf.connect(kg); kg.connect(out); k.start(t, 0.2); k.stop(t + 0.07);
    } catch(e){ try { CASA.sfx('boom'); } catch(e2){} }
  };
  document.addEventListener('pointerdown', function(e){
    var t = e.target && e.target.closest ? e.target.closest('button,[onclick]') : null;
    if (!t || t.disabled) return;
    var scr = t.closest('.xr-scr'); if (!scr || !t.closest('.game-content')) return;
    GBX.hap('sel');
  }, { passive:true, capture:true });
  function entra(g){
    var scr = $(g); if (!scr) return;
    specchio(g);
    var v = $(GIOCHI[g]); if (v && v.__xrSync) v.__xrSync();
    var gc = scr.querySelector('.game-content');
    if (g === 'slots' && gc) gc.classList.add('x-nosfx');
    GBX.tilt(scr);
    if (gc && GBX.scrollFx) try { GBX.scrollFx(gc); } catch(e){}
  }
  document.addEventListener('gbx:screen', function(e){ var id = e.detail && e.detail.id; if (GIOCHI[id]) entra(id); });
  function subito(){ for (var g in GIOCHI) { specchio(g); var s = $(g); if (s && s.classList.contains('active')) entra(g); } }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', subito); else subito();
})();
;
(function(){
  'use strict';
  if (window.XK || !window.GBX) return;
  var XK = window.XK = {};
  var L = GBX.L;
  var MIE = { scratch:'sc-bal', vault:'vk-bal', botrr:'br-bal', lotto:'lt-bal' };
  function $(id){ return document.getElementById(id); }
  function attiva(){ try { return (typeof CUR !== 'undefined') ? CUR : ''; } catch(e){ return ''; } }
  function mia(){ return MIE.hasOwnProperty(attiva()); }
  function lite(){ return GBX.lite(); }
  function testi(root){
    var els = root.querySelectorAll('[data-it]');
    for (var i = 0; i < els.length; i++) els[i].textContent = L(els[i].getAttribute('data-it'), els[i].getAttribute('data-en'));
  }
  function numero(t){
    t = String(t || '').replace(/[^\d.,-]/g, '');
    if (t.indexOf(',') >= 0 && t.indexOf('.') >= 0) t = t.replace(/,/g, '');
    else t = t.replace(',', '.');
    var v = parseFloat(t); return isNaN(v) ? null : v;
  }
  function saldo(id){
    var vero = $(MIE[id]); if (!vero || vero.__xk) return; vero.__xk = true;
    var box = vero.parentNode, spec = box.querySelector('.xk-balv'), dl = box.querySelector('.xk-delta');
    var ultimo = null, tDelta = 0, tFine = 0;
    function agg(){
      var t = vero.textContent, v = numero(t);
      if (v === null || ultimo === null || attiva() !== id || lite()) { spec.textContent = t; ultimo = v; return; }
      if (Math.abs(v - ultimo) < 0.005) { spec.textContent = t; return; }
      var d = v - ultimo, da = ultimo; ultimo = v;
      GBX.count(spec, da, v, function(x){ return '€' + x.toFixed(2); }, 650);
      clearTimeout(tFine); tFine = setTimeout(function(){ spec.textContent = vero.textContent; }, 720);
      if (dl) {
        dl.textContent = (d > 0 ? '+' : '−') + '€' + Math.abs(d).toFixed(2);
        dl.className = 'xk-delta show ' + (d > 0 ? 'su' : 'giu');
        clearTimeout(tDelta); tDelta = setTimeout(function(){ dl.className = 'xk-delta'; }, 1600);
      }
    }
    try { new MutationObserver(agg).observe(vero, { childList:true, characterData:true, subtree:true }); } catch(e){}
    agg();
  }
  var VIBRA = { tick:'sel', click:'sel', click_gun:'rigid', bang:'heavy', boom:'heavy', unlock:'medium', lock:'light', alarm:'warning',
                heart:'soft', pop:'light', chip:'light', chips:'medium', spin:'light', coin:'light', flip:'sel', deal:'soft', whoosh:'light' };
  var ultGratta = 0;
  function avvolgiCasa(){
    if (!window.CASA || CASA.__xk) return; CASA.__xk = true;
    var s0 = CASA.sfx;
    CASA.sfx = function(n, a){
      var r = s0.apply(this, arguments);
      try {
        if (mia()) {
          if (n === 'scratch') { var t = Date.now(); if (t - ultGratta > 110) { ultGratta = t; GBX.hap('sel'); } }
          else if (VIBRA[n]) GBX.hap(VIBRA[n]);
        }
      } catch(e){}
      return r;
    };
    var p0 = CASA.scoppio;
    CASA.scoppio = function(el, o){
      if (mia() && o) {
        o = Object.assign({}, o);
        o.n = Math.max(5, Math.round((o.n || 26) * 0.4));
        o.tipo = 'scintille'; o.colori = ['#f2f2f4', '#8e8e93', '#8b83f0'];
        if (o.forza) o.forza = Math.round(o.forza * 0.7);
      }
      return p0.call(this, el, o);
    };
    var e0 = CASA.esito;
    CASA.esito = function(cont, tipo, titolo, sotto, importo){
      var box = e0.apply(this, arguments);
      try { if (box && cont && cont.closest && cont.closest('.screen.xk')) esito(box, tipo); } catch(e){}
      return box;
    };
  }
  function esito(box, tipo){
    if (tipo === 'win' || tipo === 'big' || tipo === 'push') {
      setTimeout(function(){ GBX.fx('cash'); }, 220);
    } else if (tipo === 'lose') GBX.hap('error');
    var mio = box.__xkT = setTimeout(function(){ if (box.__xkT === mio) box.classList.add('xk-quiet'); }, 2600);
  }
  function osservaGriglia(){
    var g = $('csc-griglia'); if (!g || g.__xk) return; g.__xk = true;
    try {
      new MutationObserver(function(ms){
        ms.forEach(function(m){
          var el = m.target; if (!el.classList || !el.classList.contains('csc-cella')) return;
          var c = el.className, prima = el.__xkC || ''; el.__xkC = c;
          if (c === prima || c.indexOf('nuova') < 0 || prima.indexOf('nuova') >= 0) return;
          if (c.indexOf('spenta') >= 0 || c.indexOf('bomba') >= 0) return;
          if (/\bs0\b/.test(c)) { GBX.sfx('pop'); GBX.hap('medium'); }
          else if (/\bs1\b/.test(c)) { GBX.sfx('pop'); GBX.hap('light'); }
        });
      }).observe(g, { attributes:true, attributeFilter:['class'], subtree:true });
    } catch(e){}
  }
  var AC = null;
  function audio(){
    try { if (typeof TWS !== 'undefined' && TWS && TWS.on === false) return null; } catch(e){}
    if (AC) return AC;
    try { if (typeof TWS !== 'undefined' && TWS) { if (!TWS.ctx && TWS.init) TWS.init(); if (TWS.ctx) AC = { c:TWS.ctx, out:TWS.mg || TWS.ctx.destination }; } } catch(e){}
    return AC;
  }
  function sfrigola(ms){
    var a = audio(); if (!a) return;
    try {
      var c = a.c, t = c.currentTime, d = ms / 1000, n = Math.floor(c.sampleRate * d), b = c.createBuffer(1, n, c.sampleRate), x = b.getChannelData(0);
      for (var i = 0; i < n; i++) x[i] = (Math.random() * 2 - 1) * (Math.random() < 0.25 ? 1 : 0.35);
      var s = c.createBufferSource(); s.buffer = b;
      var f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.setValueAtTime(3800, t); f.frequency.linearRampToValueAtTime(6500, t + d);
      var g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + 0.05); g.gain.setValueAtTime(0.09, t + d * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      s.connect(f); f.connect(g); g.connect(a.out); s.start(t); s.stop(t + d + 0.02);
    } catch(e){}
  }
  XK.miccia = function(i, poi){
    var el = $('csc-griglia') && $('csc-griglia').children[i];
    var ms = lite() ? 150 : 560;
    if (el) el.classList.add('xk-miccia');
    if (!lite()) { sfrigola(ms); GBX.hap('rigid'); setTimeout(function(){ GBX.hap('light'); }, ms * 0.45); }
    setTimeout(function(){
      if (el) { el.classList.remove('xk-miccia'); el.classList.add('xk-boom'); }
      try { poi(); } catch(e){}
      GBX.hap('heavy');
    }, ms);
  };
  var ltUltimi = null;
  document.addEventListener('gbx:screen', function(e){ if (e.detail && e.detail.id === 'lotto') { try { var b = document.getElementById('lt-rules-body'); if (b) b.innerHTML = regoleLotto(); } catch(x){} } });
  (function(){ var f = window.ltFillRules; if (typeof f === 'function' && !f.__xkr) { var g = function(d){ ltUltimi = d || ltUltimi; var r = f.apply(this, arguments); try { var b = document.getElementById('lt-rules-body'); if (b) b.innerHTML = regoleLotto(); } catch(e){} return r; }; g.__xkr = 1; window.ltFillRules = g; } })();
  function regoleLotto(){
    var F = window.LT_FALLBACK || { pz:{2:10,3:90,4:1200,5:24000}, tick:2, jmin:30000, picks:6, maxn:99, days:'Mon & Thu 20:00' }, d = ltUltimi || {};
    var pz = (d.prizes_eur && typeof d.prizes_eur === 'object') ? d.prizes_eur : F.pz;
    var tick = +d.ticket_eur > 0 ? +d.ticket_eur : F.tick, jmin = +d.jackpot_min_eur > 0 ? +d.jackpot_min_eur : F.jmin;
    var pk = +d.picks > 0 ? +d.picks : F.picks, mx = +d.max_num > 0 ? +d.max_num : F.maxn, days = d.draw_days || F.days;
    var en = window.GB_LANG === 'en';
    if (!en) days = String(days).replace(/Mon/g, 'lunedì').replace(/Tue/g, 'martedì').replace(/Wed/g, 'mercoledì').replace(/Thu/g, 'giovedì').replace(/Fri/g, 'venerdì').replace(/Sat/g, 'sabato').replace(/Sun/g, 'domenica').replace(/&/g, 'e').replace(/ (\d{1,2}:\d{2})/, ' alle $1');
    var eur = function(v){ return '€' + (+v).toLocaleString(en ? 'en-US' : 'it-IT', { maximumFractionDigits:2 }); };
    var comb = 1; for (var i = 0; i < pk; i++) comb = comb * (mx - i) / (i + 1); comb = Math.round(comb).toLocaleString(en ? 'en-US' : 'it-IT');
    var righe = [2, 3, 4, 5].filter(function(k){ return k < pk && (pz[k] !== undefined || pz[String(k)] !== undefined); })
      .map(function(k){ var v = pz[k] !== undefined ? pz[k] : pz[String(k)]; return (en ? k + ' numbers: ' : k + ' numeri: ') + '<b>' + eur(v) + '</b>'; });
    return en
      ? 'Pick <b>' + pk + ' numbers</b> from <b>1 to ' + mx + '</b>, then wait for the draw.<br>Draws run <b>' + days + '</b>; one ticket costs <b>' + eur(tick) + '</b>.<br>Match <b>2 or more</b> and you win.' + (righe.length ? '<br>' + righe.join(' · ') : '') + '<br>Match all ' + pk + ' and you take the <b>whole jackpot</b>, never less than <b>' + eur(jmin) + '</b>: it grows with every ticket until somebody wins it.<span class="lt-odds">Odds of the jackpot: 1 in ' + comb + '. Prizes are paid into your balance.</span>'
      : 'Scegli <b>' + pk + ' numeri</b> da <b>1 a ' + mx + '</b> e aspetta l’estrazione.<br>Le estrazioni sono <b>' + days + '</b>; un biglietto costa <b>' + eur(tick) + '</b>.<br>Con <b>2 o più</b> numeri giusti vinci.' + (righe.length ? '<br>' + righe.join(' · ') : '') + '<br>Con tutti e ' + pk + ' prendi il <b>jackpot intero</b>, mai meno di <b>' + eur(jmin) + '</b>: cresce a ogni biglietto finché qualcuno lo vince.<span class="lt-odds">Probabilità del jackpot: 1 su ' + comb + '. I premi arrivano sul saldo.</span>';
  }
  XK.info = function(id){
    var s = $('xk-sheet-' + id); if (!s) return;
    if (id === 'lotto') { try { var b0 = $('lt-rules-body'); if (b0) b0.innerHTML = regoleLotto(); } catch(e){} var d = $('xk-lt-regole'); if (d) { try { d.innerHTML = regoleLotto(); } catch(e){ var r = $('lt-rules-body'); if (r) d.innerHTML = r.innerHTML; } } }
    s.classList.add('open'); GBX.fx('open');
  };
  XK.chiudi = function(ev, forza){
    var s = ev && ev.currentTarget; if (!s) return;
    if (!s.classList.contains('xk-sheet')) s = s.closest('.xk-sheet');
    if (!s) return;
    if (!forza && ev.target !== s) return;
    if (ev.stopPropagation) ev.stopPropagation();
    s.classList.remove('open'); GBX.fx('back');
  };
  function avvolgi(nome, dopo){
    var f = window[nome]; if (typeof f !== 'function' || f.__xk) return;
    var g = function(){ var r = f.apply(this, arguments); try { dopo.apply(this, arguments); } catch(e){} return r; };
    g.__xk = true; window[nome] = g;
  }
  function estrazione(picks){
    var p = $('lt-picks'); if (!p || lite()) return;
    p.classList.remove('estrae'); void p.offsetWidth; p.classList.add('estrae');
    for (var i = 0; i < 6; i++) (function(k){ setTimeout(function(){ GBX.hap('sel'); }, k * 70); })(i);
    setTimeout(function(){ p.classList.remove('estrae'); }, 1000);
  }
  var ultimaFirma = '', giratoQui = false;
  function tubo(anima){
    var t = $('xk-lt-tubo'), dt = $('xk-lt-data'); if (!t) return;
    var h = (window.LT && LT.history) || [], u = h.length ? h[h.length - 1] : null;
    var box = t.parentNode;
    if (!u || !u.numbers || !u.numbers.length) { box.style.display = 'none'; return; }
    box.style.display = '';
    var nums = u.numbers.slice().sort(function(a, b){ return a - b; }), firma = nums.join(',') + '|' + u.ts;
    if (u.ts) { var d = new Date(u.ts * 1000); dt.textContent = '· ' + d.getDate() + '/' + (d.getMonth() + 1); }
    if (firma !== ultimaFirma) {
      ultimaFirma = firma;
      t.innerHTML = nums.map(function(n, i){ return '<i class="xk-ball' + (i === nums.length - 1 ? ' v' : '') + '" style="animation-delay:' + (i * 0.11) + 's">' + n + '</i>'; }).join('');
    }
    if (anima && !giratoQui && !lite()) {
      giratoQui = true;
      t.classList.remove('gira'); void t.offsetWidth; t.classList.add('gira');
      nums.forEach(function(n, i){ setTimeout(function(){ if (attiva() === 'lotto') GBX.fx(i === nums.length - 1 ? 'pop' : 'tick'); }, 120 + i * 110); });
    }
  }
  function lotto(){
    avvolgi('ltRandom', function(){ estrazione(); });
    avvolgi('ltToggle', function(){ GBX.hap('sel'); });
    avvolgi('ltClear', function(){ GBX.hap('light'); });
    avvolgi('ltSwitchTab', function(t){
      if (t === 'history') { var l = $('lt-history-list'); if (l && !lite()) { l.classList.remove('gira'); void l.offsetWidth; l.classList.add('gira'); } }
    });
    var hl = $('lt-history-list');
    if (hl && !hl.__xk) { hl.__xk = true; try { new MutationObserver(function(){ tubo(attiva() === 'lotto'); }).observe(hl, { childList:true }); } catch(e){} }
  }
  XK.bigliettoOk = function(){
    GBX.fx('chips'); setTimeout(function(){ GBX.hap('success'); }, 160);
    var p = $('lt-picks'); if (!p || lite() || !p.parentNode) return;
    var c = p.cloneNode(true); c.removeAttribute('id');
    c.style.cssText = 'position:absolute;left:' + p.offsetLeft + 'px;top:' + p.offsetTop + 'px;width:' + p.offsetWidth + 'px;pointer-events:none;margin:0';
    c.classList.remove('estrae'); c.classList.add('vola');
    p.parentNode.appendChild(c);
    setTimeout(function(){ c.remove(); }, 900);
    var j = $('lt-jackpot'); if (j && j.animate) j.animate([{ transform:'scale(1)' }, { transform:'scale(1.06)' }, { transform:'scale(1)' }], { duration:420, easing:'cubic-bezier(.34,1.56,.64,1)' });
  };
  XK.bigliettoKo = function(){ GBX.hap('error'); };
  function entra(id){
    var el = $(id); if (!el || !el.classList.contains('xk')) return;
    avvolgiCasa();
    testi(el); saldo(id);
    GBX.tilt(el);
    var sc = el.querySelector('.game-content'); if (sc && GBX.scrollFx) GBX.scrollFx(sc);
    var sh = el.querySelectorAll('.xk-sheet.open'); for (var i = 0; i < sh.length; i++) sh[i].classList.remove('open');
    if (id === 'scratch') osservaGriglia();
    if (id === 'lotto') { lotto(); giratoQui = false; tubo(true); }
  }
  document.addEventListener('gbx:screen', function(e){
    var d = e.detail || {};
    if (MIE.hasOwnProperty(d.id)) entra(d.id);
    if (MIE.hasOwnProperty(d.da)) { var v = $(d.da); if (v) GBX.untilt(v); }
  });
  avvolgiCasa();
  try { var a0 = document.querySelector('.screen.active'); if (a0 && MIE.hasOwnProperty(a0.id)) entra(a0.id); } catch(e){}
})();
;
(function(){
  'use strict';
  if (!window.GBX) return;
  var XV = window.XV = {};
  function $(id){ return document.getElementById(id); }
  var L = GBX.L;
  var TIT = {
    bj:       function(){ return 'Blackjack'; },
    poker:    function(){ return 'Casino Hold’em'; },
    dice:     function(){ return L('Dadi', 'Dice'); },
    roulette: function(){ return 'Roulette'; },
    crash:    function(){ return 'Crash'; },
    plinko:   function(){ return 'Plinko'; },
    wheel:    function(){ return L('Ruota', 'Wheel'); },
    slots:    function(){ return 'Slot'; },
    scratch:  function(){ return L('Gratta', 'Scratch'); },
    vault:    function(){ return L('Caveau', 'Vault'); },
    botrr:    function(){ return L('Roulette russa', 'Russian roulette'); },
    lotto:    function(){ return L('Lotteria', 'Lottery'); }
  };
  var LASTRE = {
    dice:    ['#xcdc-stage'],
    crash:   ['#ccr-scena'],
    plinko:  ['#cpl-tav'],
    wheel:   [],
    slots:   ['.slv2-cabinet'],
    vault:   ['#cvk-palco'],
    botrr:   ['#cbr-palco'],
    lotto:   ['.xk-jkp', '.xk-premi']
  };
  var VETRO = {
    crash:    ['#ccr-regole'],
    plinko:   ['#cpl-regole'],
    wheel:    ['#cwh-tabella'],
    slots:    ['.slv2-stat-card', '.slv2-paytable-btn'],
    scratch:  ['#csc-biglietto'],
    roulette: ['#rl4-table', '.rl4-info'],
    poker:    [],
    lotto:    ['#lt-rules', '.lt-stat-card']
  };
  function testata(id){
    var scr = $(id); if (!scr || scr.__xv) return scr;
    var h = scr.querySelector(':scope > .game-hdr, :scope > .xc-top');
    if (!h) return scr;
    scr.__xv = true;
    scr.classList.add('xv-scr', 'xv-' + id);
    h.classList.add('xv-hdr', 'x-navf');
    var bottoni = [].slice.call(h.querySelectorAll(':scope > button'));
    var indietro = bottoni[0] || null, info = bottoni.length > 1 ? bottoni[bottoni.length - 1] : null;
    var saldo = h.querySelector(':scope > .xc-bal, :scope > .xr-bal, :scope > .xk-bal');
    var t = document.createElement('div'); t.className = 'xv-tit'; t.textContent = TIT[id]();
    var sx = document.createElement('div'); sx.className = 'xv-sx';
    var dx = document.createElement('div'); dx.className = 'xv-dx';
    if (indietro) {
      indietro.classList.add('xv-back'); indietro.setAttribute('data-x-silent', '');
      indietro.addEventListener('click', function(){ GBX.fx('back'); });
      if (!indietro.querySelector('svg')) indietro.innerHTML = '<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>';
      sx.appendChild(indietro);
    }
    if (info) {
      info.classList.add('xv-info');
      if (info.querySelector('svg circle[r="1.4"]')) info.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/></svg>';
      sx.appendChild(info);
    }
    if (saldo) { saldo.classList.add('xv-pill'); dx.appendChild(saldo); }
    h.insertBefore(sx, h.firstChild);
    h.insertBefore(t, sx.nextSibling);
    h.appendChild(dx);
    return scr;
  }
  function vesti(id){
    var scr = testata(id); if (!scr) return;
    (LASTRE[id] || []).forEach(function(sel){
      [].forEach.call(scr.querySelectorAll(sel), function(el){
        if (el.classList.contains('x-lastra')) return;
        el.classList.remove('x-lit');
        var g = el.querySelector(':scope > .x-glint'); if (g) g.remove();
        el.__xk = undefined;
        el.classList.add('x-lastra', 'xv-lastra');
      });
    });
    (VETRO[id] || []).forEach(function(sel){
      [].forEach.call(scr.querySelectorAll(sel), function(el){ el.classList.add('xv-vetro'); });
    });
    var t = scr.querySelector('.xv-tit'); if (t && TIT[id]) t.textContent = TIT[id]();
    if (/^(crash|plinko|wheel|lotto)$/.test(id)) regole(id);
    GBX.tilt(scr);
  }
  function filtri(){
    ['.lt-tab', '#cpl-rischi .cpl-r', '#cwh-rischi button', '#cvk-livelli > *', '#cbr-pericoli > *'].forEach(function(sel){
      [].forEach.call(document.querySelectorAll(sel), function(b){
        if (b.__xv) return; b.__xv = true;
        if (b.closest('.x-nosfx')) return;
        b.setAttribute('data-x-silent', '');
        b.addEventListener('click', function(){ GBX.fx('toggle'); });
      });
    });
  }
  var EMO = /(?:[☀-➿⭐⬆↔-⇿]️?|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDD00-\uDFFF]|️|‍)+/g;
  function senzaEmoji(el){
    if (!el) return;
    var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), n, l = [];
    while ((n = w.nextNode())) if (!(n.parentNode && n.parentNode.closest && n.parentNode.closest('.slv2-pt-sym-box'))) l.push(n);
    l.forEach(function(t){ var v = t.nodeValue.replace(EMO, '').replace(/\s{2,}/g, ' '); if (v !== t.nodeValue) t.nodeValue = v.replace(/^\s+/, t.previousSibling ? ' ' : ''); });
  }
  var FOGLIO = {
    bj:'#xc-reg-bj .xc-sin', poker:'#xc-reg-poker .xc-sin', dice:'#xc-reg-dice .xc-sin', roulette:'#xc-reg-roulette .xc-sin',
    scratch:'#xk-sheet-scratch .xk-sheet-in', vault:'#xk-sheet-vault .xk-sheet-in', botrr:'#xk-sheet-botrr .xk-sheet-in', lotto:'#xk-sheet-lotto .xk-sheet-in',
    slots:'#slots .slv2-paytable-panel', crash:'#ccr-regole', plinko:'#cpl-regole', wheel:'#cwh-tabella'
  };
  var GRUPPI = '.xc-pay,.csc-tabella,.slv2-pt-section,.prize-table';
  function regole(id){
    var f = document.querySelector(FOGLIO[id] || '#_'); if (!f) return;
    f.classList.add('xv-reg');
    var inline = /^(crash|plinko|wheel)$/.test(id);
    if (!inline) {
      var h3 = f.querySelector('.xc-regtxt>h3');
      if (h3) h3.classList.add('xv-regt');
      else {
        var t = f.querySelector(':scope > .xv-regt');
        if (!t) { t = document.createElement('div'); t.className = 'xv-regt';
          var dopo = f.querySelector(':scope > .xk-grab, :scope > .slv2-paytable-handle');
          f.insertBefore(t, dopo ? dopo.nextSibling : f.firstChild); }
        t.textContent = TIT[id]();
      }
      if (id === 'slots') { var pt = f.querySelector('.slv2-paytable-title'); if (pt) pt.textContent = L('Pagamenti e regole', 'Paytable and rules'); }
    }
    [].forEach.call(f.querySelectorAll(GRUPPI), function(g){
      if (g.classList.contains('x-lastra')) return;
      g.classList.add('x-gruppo', 'x-lastra', 'xv-gr');
    });
    [].forEach.call(f.querySelectorAll('.slv2-pt-section>.slv2-pt-section-title'), function(t){ t.parentNode.parentNode.insertBefore(t, t.parentNode); });
    senzaEmoji(f.querySelector('.slv2-pt-content'));
    [].forEach.call(f.querySelectorAll('.slv2-pt-section-title,.xk-sh-t,.chp-regole>b'), senzaEmoji);
    var scr = f.closest('.screen'); if (scr) GBX.tilt(scr);
  }
  XV.regole = regole;
  function dopoApri(obj, nome, quale){
    if (!obj || typeof obj[nome] !== 'function' || obj[nome].__xv) return;
    var f = obj[nome], g = function(x){ var r = f.apply(this, arguments); try { regole(quale(x)); } catch(e){} return r; };
    g.__xv = true; obj[nome] = g;
  }
  function agganci(){
    dopoApri(window.XC, 'regole', function(x){ return x; });
    dopoApri(window.XK, 'info', function(x){ return x; });
    dopoApri(window.XR, 'info', function(x){ return x; });
    dopoApri(window, 'slv2OpenPaytable', function(){ return 'slots'; });
  }
  var FRASE = ['ccr-btn', 'cpl-b1', 'cwh-gira', 'cwh-perno', 'slv2-spin-btn', 'lt-buy-btn', 'csc-nuovo', 'csc-incassa',
               'cvk-via', 'cvk-incassa', 'cbr-via', 'cbr-incassa', 'slv2-fs-intro-btn', 'slv2-bw-spin', 'slv2-bw-collect', 'slv2-vg-collect'];
  var LETTERA = /[A-Za-zÀ-ÖØ-öø-ÿ]/;
  function frase(el){
    var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), n;
    while ((n = w.nextNode())) {
      if (n.parentNode && n.parentNode.closest && n.parentNode.closest('small')) continue;
      var v = n.nodeValue;
      if (!LETTERA.test(v) || v !== v.toUpperCase() || v.replace(/[^A-Za-zÀ-ÿ]/g, '').length < 3) continue;
      var m = v.toLowerCase(), i = m.search(LETTERA);
      n.nodeValue = m.slice(0, i) + m.charAt(i).toUpperCase() + m.slice(i + 1);
    }
  }
  function tastiFrase(){
    FRASE.forEach(function(id){
      var b = $(id); if (!b || b.__xvf) return; b.__xvf = true;
      frase(b);
      try { new MutationObserver(function(){ frase(b); }).observe(b, { childList:true, characterData:true, subtree:true }); } catch(e){}
    });
    [].forEach.call(document.querySelectorAll('#slots .slv2-fs-summary .slv2-fs-intro-btn'), function(b){ if (!b.__xvf) { b.__xvf = true; frase(b); } });
  }
  var IDS = Object.keys(TIT);
  function tutte(){ IDS.forEach(function(id){ try { testata(id); } catch(e){} }); }
  XV.vesti = vesti;
  document.addEventListener('gbx:screen', function(e){
    var id = e.detail && e.detail.id;
    if (TIT[id]) { try { if (id === 'lotto') lottoAttesa(); vesti(id); filtri(); } catch(x){} }
  });
  function lottoAttesa(){
    var p = $('lt-pick-lbl'); if (p && /^PICK 6 NUMBERS/i.test(p.textContent)) p.textContent = L('Scegli 6 numeri (1-99)', 'Pick 6 numbers (1-99)');
    var b = $('lt-buy-btn'); if (b && /^BUY TICKET$/i.test(b.textContent.trim())) b.textContent = L('Compra biglietto', 'Buy ticket');
  }
  function avvio(){
    try { lottoAttesa(); } catch(x){}
    tutte(); agganci(); tastiFrase();
    var a = document.querySelector('.screen.active');
    if (a && TIT[a.id]) try { vesti(a.id); filtri(); } catch(x){}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', avvio); else avvio();
})();
;
(function(){
  'use strict';
  if (window.XV2 || !window.GBX) return;
  var XV2 = window.XV2 = {};
  var L = GBX.L;
  function $(id){ return document.getElementById(id); }
  function E(x){ try { return CASA.eur(x); } catch(e){ return '€' + (Number(x) || 0).toFixed(2); } }
  function mx(x){ x = Number(x) || 0; return (x >= 100 ? x.toFixed(0) : x.toFixed(2)) + '×'; }
  function el(tag, cls, html){ var d = document.createElement(tag); d.className = cls; if (html != null) d.innerHTML = html; return d; }
  function metti(n, t){ if (n && n.textContent !== t) n.textContent = t; }
  var scr = null, testa = null, ora = null, pro = null;
  function fase(){
    var f = window.CVK ? CVK.fase : 'punta';
    return (f === 'gioca' || f === 'scatto' || f === 'incasso') ? 'gioca' : (f === 'fine' ? 'fine' : 'punta');
  }
  function sync(){
    if (!scr) return;
    var f = fase();
    if (scr.getAttribute('data-xv2') !== f) scr.setAttribute('data-xv2', f);
    var v = window.CVK && CVK.v;
    if (f !== 'gioca' || !v) { scr.classList.remove('xv2-pieno'); return; }
    metti(ora.querySelector('.xv2-l'), L('Ora', 'Now'));
    metti(ora.querySelector('.xv2-e'), v.survived > 0 ? E(v.cash_eur) : L('puntata ', 'bet ') + E(v.bet_eur));
    var nx = v.next_mult;
    scr.classList.toggle('xv2-pieno', !nx);
    if (nx) {
      metti(pro.querySelector('.xv2-l'), L('Prossimo', 'Next'));
      metti(pro.querySelector('.xv2-n'), mx(nx));
      metti(pro.querySelector('.xv2-e'), v.next_eur != null ? E(v.next_eur) : '');
    }
  }
  function tastoVia(){
    var b = $('cvk-via'), s = b && b.querySelector('small');
    if (!s || !window.CVK) return;
    var t = E(CVK.posta);
    if (s.textContent !== t) s.textContent = t;
  }
  function tastoRigioca(){
    var s = $('cvk-s-rigioca'); if (!s) return;
    var t = s.textContent, n = t.replace(/\s*·\s*(ROOKIE|PRO|EXPERT)\s*$/i, '');
    if (n !== t) s.textContent = n;
  }
  function livelliFoglio(){
    var box = scr && scr.querySelector('.xv2-livelli'); if (!box) return;
    var h = '';
    [].forEach.call(document.querySelectorAll('#cvk-livelli .cvk-liv'), function(b){
      var n = (b.querySelector('b') || {}).textContent || '', s = (b.querySelector('small') || {}).textContent || '', m = (b.querySelector('em') || {}).textContent || '';
      n = n.charAt(0) + n.slice(1).toLowerCase();
      h += '<div class="xv2-riga"><b>' + n + '</b><span>' + s + '</span><em>' + m.replace(/^(fino a|up to)\s*/i, '') + '</em></div>';
    });
    if (box.__h !== h) { box.__h = h; box.innerHTML = h; }
  }
  function testiFoglio(){
    if (!scr) return;
    metti(scr.querySelector('.xv2-sez-liv'), L('Livelli', 'Levels'));
    metti(scr.querySelector('.xv2-sez-scala'), L('Scala dei moltiplicatori', 'Multiplier ladder'));
    metti(scr.querySelector('.xv2-nota'), L('Vincita a ogni gradino con la puntata scelta. In partita la scala è quella del server.',
                                             'Win at each step with the chosen bet. In a round the ladder comes from the server.'));
  }
  function osserva(n, opz, f){ if (!n) return; try { new MutationObserver(f).observe(n, opz); } catch(e){} }
  function prepara(){
    var s = $('vault');
    if (!s || s.__xv2) return !!s;
    var m = $('cvk-mult'), sc = $('cvk-scala'), sin = s.querySelector('#xk-sheet-vault .xk-sheet-in');
    testa = s.querySelector('.cvk-testa');
    if (!m || !sc || !sin || !testa) return false;
    s.__xv2 = true; scr = s;
    s.classList.add('xv2');
    ora = el('div', 'xv2-col xv2-ora', '<span class="xv2-l"></span>');
    testa.insertBefore(ora, m);
    ora.appendChild(m);
    ora.appendChild(el('span', 'xv2-e'));
    pro = el('div', 'xv2-col xv2-pro', '<span class="xv2-l"></span><b class="xv2-n"></b><span class="xv2-e"></span>');
    testa.insertBefore(pro, ora.nextSibling);
    sin.appendChild(el('div', 'xv2-sez xv2-sez-liv'));
    sin.appendChild(el('div', 'xv2-gr xv2-livelli'));
    sin.appendChild(el('div', 'xv2-sez xv2-sez-scala'));
    sin.appendChild(sc);
    sin.appendChild(el('div', 'xv2-nota'));
    testiFoglio();
    osserva(m, { childList:true, characterData:true, subtree:true, attributes:true, attributeFilter:['class'] }, sync);
    ['cvk-punta', 'cvk-gioca', 'cvk-ancora'].forEach(function(id){ osserva($(id), { attributes:true, attributeFilter:['style'] }, sync); });
    osserva($('cvk-incassa'), { childList:true, attributes:true, attributeFilter:['disabled'] }, sync);
    osserva($('cvk-scala'), { childList:true }, sync);
    osserva($('cvk-via'), { childList:true }, tastoVia);
    osserva($('cvk-s-rigioca'), { childList:true, characterData:true, subtree:true }, tastoRigioca);
    osserva($('cvk-livelli'), { childList:true }, livelliFoglio);
    tastoVia(); tastoRigioca(); livelliFoglio(); sync();
    return true;
  }
  function entra(){
    if (!prepara()) return;
    testiFoglio(); livelliFoglio(); tastoVia(); sync();
  }
  XV2.sync = function(){ entra(); };
  document.addEventListener('gbx:screen', function(e){ if (e && e.detail && e.detail.id === 'vault') setTimeout(entra, 0); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ prepara(); });
  else prepara();
})();
;
(function(){
  'use strict';
  var GIOCHI = ['bj','poker','dice','roulette','wheel','slots','crash','plinko','vault','scratch','botrr','lotto'];
  function $(s, r){ return (r || document).querySelector(s); }
  function ultimoVisibile(p){
    for (var k = p.lastElementChild; k; k = k.previousElementSibling) {
      if (k.tagName === 'SCRIPT' || k.tagName === 'STYLE') continue;
      var c = getComputedStyle(k);
      if (c.display === 'none' || c.position === 'absolute' || c.position === 'fixed') continue;
      return k;
    }
    return null;
  }
  function slot(scr){
    var gia = $('.xs-ciotola', scr); if (gia) return gia;
    var bet = $('.slv2-bet-row', scr), act = $('.slv2-action-row', scr), tab = $('.slv2-paytable-btn', scr);
    if (!bet || !act || !bet.parentNode) return null;
    var c = document.createElement('div');
    c.className = 'x-ciotola xs-ciotola';
    bet.parentNode.insertBefore(c, bet);
    c.appendChild(bet); c.appendChild(act); if (tab) c.appendChild(tab);
    return c;
  }
  function applica(){
    GIOCHI.forEach(function(id){
      var scr = document.getElementById(id); if (!scr) return;
      var b = id === 'slots' ? slot(scr) : $('.x-bowl, .xr-bowl, .xk-bowl', scr);
      if (!b) return;
      b.classList.add('x-ciotola');
      var r = id === 'plinko' ? $('#cpl-rischi', scr) : id === 'wheel' ? $('#cwh-rischi', scr) : null;
      if (r && r.parentNode !== b) b.insertBefore(r, b.firstChild);
      var t = id === 'crash' ? $('#ccr-regole', scr) : id === 'plinko' ? $('#cpl-regole', scr) : null;
      if (t && b.contains(t)) t.classList.add('x-ciotola-testo');
      var p = b.parentNode;
      if (p && p !== scr && ultimoVisibile(p) === b) p.classList.add('x-ciotola-fondo');
    });
  }
  window.XCI = { applica: applica };
  function via(){ try { applica(); } catch(e){} }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(via, 0); });
  else setTimeout(via, 0);
  window.addEventListener('load', function(){ via(); setTimeout(via, 1200); });
})();
;
(function(){
  'use strict';
  if (window.XCL) return;
  var DIR = 'clip/';
  var IDS = { alley:1, archery:1, backg:1, basket:1, bj1v1:1, boxe:1, briscola:1, bs:1, burraco:1, calcio:1, chess:1, cucu:1, dama:1, deadmoney:1, dice:1, draw:1, geo:1, glad:1, golf:1, kaiju:1, lastcall:1, lupus:1, pk1v1:1, pk5:1, pong:1, pool8:1, race:1, rps:1, rr:1, scalata:1, scopa:1, settemezzo:1, shove:1, smash:1, snake:1, sumo:1, tank:1, tappo:1, turf:1, uno:1, uomonero:1, sbanca:1, abisso:1, hop:1 };
  var XCL = window.XCL = { ids: IDS, dir: DIR, v: {}, n: 0 };
  function soloPoster(){
    try { if (window.GBX && GBX.lite && GBX.lite()) return true; } catch(e){}
    if (document.documentElement.classList.contains('gb-lite')) return true;
    try { if (matchMedia('(prefers-reduced-motion: reduce)').matches) return true; } catch(e){}
    try { var c = navigator.connection; if (c && c.saveData) return true; } catch(e){}
    return false;
  }
  function idDi(ap){
    var i = ap.querySelector('.xa-ap-bi') || ap.querySelector('.xa-ap-ic img');
    var m = i && /gbx_pv_([a-z0-9_]+)\.webp/i.exec(i.getAttribute('src') || '');
    return m ? ((window.GBX && GBX.gioco) ? GBX.gioco(m[1]) : m[1]) : '';
  }
  var io = null;
  function vede(v){ return v.__xclVis && document.visibilityState !== 'hidden' && v.isConnected; }
  function aggiorna(v){
    if (vede(v)) {
      if (!v.paused) return;
      if (v.__xclStop && Date.now() - v.__xclStop > 2500) { try { v.currentTime = 0; } catch(e){} }
      var p; try { p = v.play(); } catch(e){ ferma(v); return; }
      if (p && p.catch) p.catch(function(){ ferma(v); });
    } else if (!v.paused) { v.pause(); v.__xclStop = Date.now(); }
    else if (!v.__xclStop) v.__xclStop = Date.now();
  }
  function ferma(v){ var b = v.parentNode; if (b && b.classList) b.classList.add('xcl-poster'); }
  function guarda(v){
    if (!('IntersectionObserver' in window)) { v.__xclVis = true; aggiorna(v); return; }
    if (!io) io = new IntersectionObserver(function(rs){
      rs.forEach(function(r){ r.target.__xclVis = r.isIntersecting && r.intersectionRatio > 0.2; aggiorna(r.target); });
    }, { threshold: [0, 0.2, 0.6] });
    io.unobserve(v); io.observe(v);
  }
  document.addEventListener('visibilitychange', function(){ for (var k in XCL.v) aggiorna(XCL.v[k]); });
  function video(id){
    var v = XCL.v[id];
    if (v) return v;
    v = XCL.v[id] = document.createElement('video');
    v.className = 'xcl-v';
    v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true;
    v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', '');
    v.setAttribute('loop', ''); v.setAttribute('preload', 'none'); v.setAttribute('disablepictureinpicture', '');
    v.setAttribute('disableremoteplayback', ''); v.setAttribute('aria-hidden', 'true'); v.setAttribute('tabindex', '-1');
    v.poster = DIR + id + '_p.webp';
    v.innerHTML = '<source src="' + DIR + id + '.webm" type="video/webm"><source src="' + DIR + id + '.mp4" type="video/mp4">';
    v.addEventListener('playing', function(){ var b = v.parentNode; if (b && b.classList) { b.classList.add('xcl-vivo'); b.classList.remove('xcl-poster'); } });
    v.addEventListener('error', function(){ ferma(v); }, true);
    return v;
  }
  function poster(ban, id){
    var im = document.createElement('img');
    im.className = 'xcl-p'; im.alt = ''; im.decoding = 'async';
    im.addEventListener('load', function(){ ban.classList.add('xcl-poster'); }, { once: true });
    im.addEventListener('error', function(){ im.remove(); }, { once: true });
    im.src = DIR + id + '_p.webp';
    ban.appendChild(im);
  }
  function monta(ap){
    var ban = ap.querySelector(':scope > .xa-ap-ban');
    if (!ban || ban.__xcl) return;
    var id = idDi(ap);
    if (!id || !IDS[id]) return;
    ban.__xcl = 1; ban.classList.add('xcl-ban');
    if (soloPoster()) { poster(ban, id); return; }
    var v = video(id), eraVivo = v.isConnected && !v.paused;
    ban.appendChild(v);
    if (eraVivo || v.readyState >= 3 && v.__xclStop && Date.now() - v.__xclStop < 2500) ban.classList.add('xcl-vivo', 'xcl-subito');
    XCL.n++;
    guarda(v);
  }
  function avvia(){
    [].forEach.call(document.querySelectorAll('.xa-ap'), monta);
    new MutationObserver(function(rs){
      for (var i = 0; i < rs.length; i++) {
        var a = rs[i].addedNodes;
        for (var j = 0; j < a.length; j++) { var n = a[j]; if (n.nodeType === 1 && n.classList.contains('xa-ap')) monta(n); }
      }
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.body) avvia(); else document.addEventListener('DOMContentLoaded', avvia);
})();
;
(function(){
  'use strict';
  if (window.XW || !window.GBX) return;
  var XW = window.XW = { daZero:false, v:null, okKey:'', okTs:0, okPassi:0, annRid:null, tot:null, disp:null };
  function $(id){ return document.getElementById(id); }
  function L(it, en){ return GBX.L(it, en); }
  function fx(n){ try { GBX.fx(n); } catch(e){} }
  function sfx(n){ try { GBX.sfx(n); } catch(e){} }
  function hap(t){ try { GBX.hap(t); } catch(e){} }
  function avvolgi(nome, dopo, prima){
    var o = window[nome];
    if (typeof o !== 'function' || o.__xw) return;
    var f = function(){
      var memo; if (prima) { try { memo = prima.apply(this, arguments); } catch(e){} }
      var r = o.apply(this, arguments);
      if (dopo) { try { dopo.call(this, r, arguments, memo); } catch(e){} }
      return r;
    };
    f.__xw = 1; f.__orig = o;
    try { window[nome] = f; } catch(e){}
  }
  function scatto(el, c, ms){
    if (!el) return; el.classList.remove(c); void el.offsetWidth; el.classList.add(c);
    clearTimeout(el['__t' + c]); el['__t' + c] = setTimeout(function(){ el.classList.remove(c); }, ms || 700);
  }
  function eur(n){ try { return wnEur(n); } catch(e){ return '€ ' + (+n).toFixed(2); } }
  var ultimoTasto = null;
  document.addEventListener('pointerdown', function(e){
    ultimoTasto = (e.target && e.target.closest) ? e.target.closest('button') : null;
  }, { passive:true, capture:true });
  function copiato(btn){
    btn = btn || ultimoTasto;
    if (!btn || !btn.closest || !btn.closest('#wallet,#friends,#fair')) return;
    btn.setAttribute('data-xw-ok', L('Copiato', 'Copied'));
    scatto(btn, 'xw-copiato', 1500);
  }
  function okCopia(btn){ sfx('soft'); hap('success'); copiato(btn); }
  XW.testata = function(scr, sc, titolo, host, primo){
    if (!scr) return;
    var hd = scr.querySelector('.game-hdr');
    if (hd && !hd.__xw) {
      hd.__xw = 1; hd.classList.add('x-navf', 'xw-nav');
      if (titolo) { var t = document.createElement('div'); t.className = 'xw-navt'; t.setAttribute('aria-hidden', 'true'); t.textContent = titolo; hd.appendChild(t); }
    }
    if (titolo && host && !host.querySelector(':scope>.xw-big')) {
      var b = document.createElement('div'); b.className = 'xw-big'; b.setAttribute('role', 'heading'); b.setAttribute('aria-level', '1');
      b.textContent = titolo; host.insertBefore(b, primo || host.firstChild);
    }
    if (sc && !sc.__xwSu) {
      sc.__xwSu = 1; var su = false;
      sc.addEventListener('scroll', function(){ var s = sc.scrollTop > 44; if (s !== su) { su = s; scr.classList.toggle('xw-su', s); } }, { passive:true });
    }
  };
  XW.frase = function(el){
    if (!el || el.__xwF) return; el.__xwF = 1;
    var f = function(){
      var t = String(el.textContent || '').replace(/^[^A-Za-z0-9\u00C0-\u024F]+/, '').trim();
      if (t && t === t.toUpperCase()) t = t.charAt(0) + t.slice(1).toLowerCase();
      el.setAttribute('data-xw-t', t);
    };
    f();
    if (window.MutationObserver) new MutationObserver(f).observe(el, { childList:true, characterData:true, subtree:true });
  };
  XW.vetro = function(el, righe){
    if (!el) return;
    el.classList.add('xw-gr');
    var corto = righe <= 8;
    el.classList.toggle('x-lastra', corto); el.classList.toggle('xw-vetro', !corto);
  };
  var QR = (function(){
    var ECC = [0,10,16,26,18,24,16,18,22,22,26], BLK = [0,1,1,1,2,2,4,4,4,5,5];
    var EXP = [], LOG = [], i, x = 1;
    for (i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11D; }
    function mul(a, b){ return (a && b) ? EXP[(LOG[a] + LOG[b]) % 255] : 0; }
    function raw(v){ var r = (16 * v + 128) * v + 64; if (v >= 2) { var n = Math.floor(v / 7) + 2; r -= (25 * n - 10) * n - 55; if (v >= 7) r -= 36; } return r; }
    function dataCw(v){ return Math.floor(raw(v) / 8) - ECC[v] * BLK[v]; }
    function divisore(d){ var r = [], k, j, root = 1; for (k = 0; k < d - 1; k++) r.push(0); r.push(1);
      for (k = 0; k < d; k++) { for (j = 0; j < r.length; j++) { r[j] = mul(r[j], root); if (j + 1 < r.length) r[j] ^= r[j + 1]; } root = mul(root, 2); } return r; }
    function resto(dat, dv){ var r = dv.map(function(){ return 0; }), k, j;
      for (k = 0; k < dat.length; k++) { var f = dat[k] ^ r.shift(); r.push(0); for (j = 0; j < dv.length; j++) r[j] ^= mul(dv[j], f); } return r; }
    function utf8(s){ var o = [], k, c; s = unescape(encodeURIComponent(s)); for (k = 0; k < s.length; k++) { c = s.charCodeAt(k); o.push(c); } return o; }
    function allineo(v, size){ if (v === 1) return []; var n = Math.floor(v / 7) + 2, step = Math.ceil((v * 4 + 4) / (n * 2 - 2)) * 2, r = [6], p;
      for (p = size - 7; r.length < n; p -= step) r.splice(1, 0, p); return r; }
    return function(testo){
      var by = utf8(testo), v, k, j;
      for (v = 1; v <= 10; v++) if (4 + (v < 10 ? 8 : 16) + by.length * 8 <= dataCw(v) * 8) break;
      if (v > 10) return null;
      var bits = [], cap = dataCw(v) * 8;
      function put(val, n){ for (var q = n - 1; q >= 0; q--) bits.push((val >>> q) & 1); }
      put(4, 4); put(by.length, v < 10 ? 8 : 16); by.forEach(function(b){ put(b, 8); });
      put(0, Math.min(4, cap - bits.length)); put(0, (8 - bits.length % 8) % 8);
      for (k = 0xEC; bits.length < cap; k ^= 0xEC ^ 0x11) put(k, 8);
      var dati = []; for (k = 0; k < bits.length; k += 8) { var b8 = 0; for (j = 0; j < 8; j++) b8 = (b8 << 1) | bits[k + j]; dati.push(b8); }
      var nb = BLK[v], ec = ECC[v], rc = Math.floor(raw(v) / 8), corti = nb - rc % nb, lc = Math.floor(rc / nb), dv = divisore(ec), blocchi = [], pos = 0;
      for (k = 0; k < nb; k++) { var d = dati.slice(pos, pos + lc - ec + (k < corti ? 0 : 1)); pos += d.length; var e = resto(d, dv); if (k < corti) d.push(0); blocchi.push(d.concat(e)); }
      var cw = []; for (k = 0; k < blocchi[0].length; k++) for (j = 0; j < nb; j++) if (k !== lc - ec || j >= corti) cw.push(blocchi[j][k]);
      var size = v * 4 + 17, M = [], F = [], y;
      for (y = 0; y < size; y++) { M.push([]); F.push([]); for (k = 0; k < size; k++) { M[y].push(false); F[y].push(false); } }
      function set(xx, yy, s){ M[yy][xx] = !!s; F[yy][xx] = true; }
      for (k = 0; k < size; k++) { set(6, k, k % 2 === 0); set(k, 6, k % 2 === 0); }
      function finder(cx, cy){ for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) { var dd = Math.max(Math.abs(dx), Math.abs(dy)), xx = cx + dx, yy = cy + dy;
        if (xx >= 0 && xx < size && yy >= 0 && yy < size) set(xx, yy, dd !== 2 && dd !== 4); } }
      finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
      var al = allineo(v, size), na = al.length;
      for (k = 0; k < na; k++) for (j = 0; j < na; j++) {
        if ((k === 0 && j === 0) || (k === 0 && j === na - 1) || (k === na - 1 && j === 0)) continue;
        for (var ay = -2; ay <= 2; ay++) for (var ax = -2; ax <= 2; ax++) set(al[k] + ax, al[j] + ay, Math.max(Math.abs(ax), Math.abs(ay)) !== 1);
      }
      function formato(mask){
        var dat = (0 << 3) | mask, rem = dat, q;
        for (q = 0; q < 10; q++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
        var b = ((dat << 10) | rem) ^ 0x5412; function bit(n){ return ((b >>> n) & 1) !== 0; }
        for (q = 0; q <= 5; q++) set(8, q, bit(q));
        set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
        for (q = 9; q < 15; q++) set(14 - q, 8, bit(q));
        for (q = 0; q < 8; q++) set(size - 1 - q, 8, bit(q));
        for (q = 8; q < 15; q++) set(8, size - 15 + q, bit(q));
        set(8, size - 8, true);
      }
      formato(0);
      if (v >= 7) { var rv = v, q2; for (q2 = 0; q2 < 12; q2++) rv = (rv << 1) ^ ((rv >>> 11) * 0x1F25);
        var vb = (v << 12) | rv; for (q2 = 0; q2 < 18; q2++) { var bt = ((vb >>> q2) & 1) !== 0, aa = size - 11 + q2 % 3, bb = Math.floor(q2 / 3); set(aa, bb, bt); set(bb, aa, bt); } }
      var n = 0;
      for (var right = size - 1; right >= 1; right -= 2) {
        if (right === 6) right = 5;
        for (var vert = 0; vert < size; vert++) for (j = 0; j < 2; j++) {
          var xx = right - j, su = ((right + 1) & 2) === 0, yy = su ? size - 1 - vert : vert;
          if (!F[yy][xx] && n < cw.length * 8) { M[yy][xx] = ((cw[n >>> 3] >>> (7 - (n & 7))) & 1) !== 0; n++; }
        }
      }
      function maschera(m){ for (var yy = 0; yy < size; yy++) for (var xx = 0; xx < size; xx++) { if (F[yy][xx]) continue; var t;
        switch (m) { case 0: t = (xx + yy) % 2 === 0; break; case 1: t = yy % 2 === 0; break; case 2: t = xx % 3 === 0; break; case 3: t = (xx + yy) % 3 === 0; break;
          case 4: t = (Math.floor(xx / 3) + Math.floor(yy / 2)) % 2 === 0; break; case 5: t = xx * yy % 2 + xx * yy % 3 === 0; break;
          case 6: t = (xx * yy % 2 + xx * yy % 3) % 2 === 0; break; default: t = ((xx + yy) % 2 + xx * yy % 3) % 2 === 0; }
        if (t) M[yy][xx] = !M[yy][xx]; } }
      function penale(){ var p = 0, yy, xx, scuri = 0;
        for (yy = 0; yy < size; yy++) { var run = 1; for (xx = 1; xx < size; xx++) { if (M[yy][xx] === M[yy][xx - 1]) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1; } }
        for (xx = 0; xx < size; xx++) { var r2 = 1; for (yy = 1; yy < size; yy++) { if (M[yy][xx] === M[yy - 1][xx]) { r2++; if (r2 === 5) p += 3; else if (r2 > 5) p++; } else r2 = 1; } }
        for (yy = 0; yy < size - 1; yy++) for (xx = 0; xx < size - 1; xx++) { var c = M[yy][xx]; if (c === M[yy][xx + 1] && c === M[yy + 1][xx] && c === M[yy + 1][xx + 1]) p += 3; }
        for (yy = 0; yy < size; yy++) for (xx = 0; xx < size; xx++) if (M[yy][xx]) scuri++;
        p += Math.floor(Math.abs(scuri * 20 - size * size * 10) / (size * size)) * 10; return p; }
      var meglio = 0, pmin = 1e9;
      for (k = 0; k < 8; k++) { maschera(k); formato(k); var pp = penale(); if (pp < pmin) { pmin = pp; meglio = k; } maschera(k); }
      maschera(meglio); formato(meglio);
      return M;
    };
  })();
  XW.qr = QR;
  function qrSvg(M){
    var n = M.length, q = 1, d = '';
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) if (M[y][x]) d += 'M' + (x + q) + ' ' + (y + q) + 'h1v1h-1z';
    return '<svg viewBox="0 0 ' + (n + 2 * q) + ' ' + (n + 2 * q) + '" shape-rendering="crispEdges" aria-hidden="true"><path d="' + d + '"/></svg>';
  }
  var XW_QR_ACCESO = false;
  function disegnaQR(){
    var box = $('xw-qr'); if (!box) return;
    if (!XW_QR_ACCESO) { box.style.display = 'none'; return; }
    var a = (window.S && S.address) || '';
    if (box.getAttribute('data-a') === a) return;
    box.setAttribute('data-a', a);
    var M = a ? QR(a) : null;
    box.innerHTML = '<div class="xw-qr__in">' + (M ? qrSvg(M) : '<i class="xw-qr__vuoto"></i>') + '</div>';
    box.classList.toggle('xw-qr--pronto', !!M);
    if (M) scatto(box, 'xw-qr--su', 900);
  }
  avvolgi('wnEntra', function(){ });
  avvolgi('wnSaldo', function(){
    var n = wnNumeri(), v = (window.WN && WN.v) || 'home';
    var b = $('wn-bal'), p = $('wn-puoi');
    if (XW.daZero || XW.tot === null) { GBX.count(b, 0, n.tot, eur, 900); XW.daZero = false; }
    else if (Math.abs(n.tot - XW.tot) > 0.004) {
      GBX.count(b, XW.tot, n.tot, eur, 800);
      var dl = $('xw-delta');
      if (dl && n.tot > XW.tot) { dl.textContent = '+' + eur(n.tot - XW.tot); scatto(dl, 'on', 1800); }
    }
    if (v === 'preleva' && XW.v !== 'preleva') GBX.count(p, 0, n.disp, eur, 700);
    else if (XW.disp !== null && Math.abs(n.disp - XW.disp) > 0.004) GBX.count(p, XW.disp, n.disp, eur, 600);
    XW.tot = n.tot; XW.disp = n.disp;
  });
  avvolgi('wnRender', function(){
    var w = $('wallet'); if (!w) return;
    var v = WN.v;
    w.setAttribute('data-xw-v', v);
    if (v !== XW.v) {
      var on = $('wn-v-' + v);
      if (on && !GBX.lite()) scatto(on, 'xw-entra', 650);
      XW.v = v;
    }
    if (v === 'carica' && WN.met === 'btc') disegnaQR();
    lastre();
  });
  function lastre(){
    [].forEach.call(document.querySelectorAll('#wallet .wn-card:not(.x-lastra):not(.wn-lista):not(.wn-hero):not(.wn-puoi)'), function(c){
      if (c.parentNode && c.parentNode.classList && c.parentNode.classList.contains('wn-3')) return;
      c.classList.add('x-lastra');
      if (c.classList.contains('wn-sum') || c.classList.contains('wn-passi') || c.classList.contains('wn-corso') || c.classList.contains('wn-altro') || c.classList.contains('wn-btc')) c.classList.add('xw-gr');
    });
  }
  avvolgi('wnMovimenti', function(){
    var box = $('w-tx'); if (!box) return;
    [].forEach.call(box.querySelectorAll('.wn-lista'), function(r){ XW.vetro(r, r.querySelectorAll('.wn-mv').length); });
    [].forEach.call(box.querySelectorAll('.wn-vuoto'), function(r){ r.classList.add('x-lastra'); });
  });
  avvolgi('wnMetodo', function(r, a, prima){ if (prima !== WN.met) fx('toggle'); }, function(){ return WN.met; });
  avvolgi('wnValuta', function(r, a, prima){ if (prima !== WN.val) fx('toggle'); }, function(){ return WN.val; });
  avvolgi('wnDest', function(r, a, prima){ if (prima !== WN.dst) fx('toggle'); }, function(){ return WN.dst; });
  avvolgi('wnAltro', function(){ fx(WN.altro ? 'open' : 'back'); });
  avvolgi('wnSwap', function(){ fx(WN.swap ? 'open' : 'back'); });
  avvolgi('wnIndietro', function(){ fx('back'); });
  function popImporto(sel){
    var c = document.querySelector(sel + ' .wn-chip.on'); if (c) scatto(c, 'xw-hop', 450);
  }
  avvolgi('wnDepImporto', function(){ fx('tick'); popImporto('#wn-dep-chips'); scatto(document.querySelector('#wn-ton-form .wn-inp'), 'xw-bump', 400); });
  avvolgi('wnQuota', function(){ fx('tick'); popImporto('#wn-wd-chips'); scatto(document.querySelector('#wn-wd-form .wn-inp'), 'xw-bump', 400); });
  avvolgi('wnDepAgg', function(){ sfx('tick'); hap('sel'); });
  avvolgi('wnWdAgg', function(r, a){ if (a[0] !== true) { sfx('tick'); hap('sel'); } });
  avvolgi('wnDepRiepilogo', function(r, a, prima){ var e = $('wn-dep-arriva'); if (e && e.textContent !== prima) scatto(e, 'xw-bump', 400); },
    function(){ var e = $('wn-dep-arriva'); return e ? e.textContent : ''; });
  avvolgi('tonUiDici', function(r, a){ if (a[0]) { XW.erred = true; fx('err'); scatto($('tonui-err'), 'xw-trema', 500); } });
  avvolgi('wnWdErr', function(r, a){ if (a[0]) { fx('err'); scatto($('wn-wd-err'), 'xw-trema', 500); scatto(document.querySelector('#wn-wd-form .wn-inp'), 'xw-trema', 500); } });
  avvolgi('tonUiDepositaDalWallet', null, function(){ XW.partito = true; });
  avvolgi('wnDeposita', function(){
    if (!XW.partito && !XW.erred) { fx('err'); var av = $('wn-dep-avv'); scatto(av && av.style.display !== 'none' ? av : document.querySelector('#wn-ton-form .wn-inp'), 'xw-trema', 500); }
  }, function(){ XW.partito = false; XW.erred = false; });
  avvolgi('wnDepFirmato', function(){ fx('cash'); });
  avvolgi('wnWdOk', function(){ fx('cash'); });
  avvolgi('wnDepControlla', function(r, a, aveva){
    if (aveva && !wnDepLeggi() && WN.v !== 'ok') { fx('cash'); }
  }, function(){ return !!wnDepLeggi(); });
  avvolgi('wnOk', function(){
    var o = WN.ok; if (!o) return;
    var fatto = (o.tipo === 'dep') ? !!o.accr : !!o.finito;
    var key = o.ts + '|' + fatto + '|' + (o.fase || 0);
    var ic = $('wn-ok-ic'), passi = document.querySelectorAll('#wn-ok-passi .wn-passo.on');
    if (key !== XW.okKey) {
      var stesso = (XW.okTs === o.ts);
      if (ic) scatto(ic, 'xw-draw', 1300);
      if (stesso && passi.length > XW.okPassi) {
        var nuovo = passi[passi.length - 1]; scatto(nuovo, 'xw-hop', 500);
        if (fatto) { fx('cash'); }
        else { sfx('soft'); hap('success'); }
      }
      if (!stesso) { var box = document.querySelector('#wn-v-ok .wn-ok'); if (box && !GBX.lite()) scatto(box, 'xw-entra', 650); }
      XW.okKey = key; XW.okTs = o.ts;
    }
    XW.okPassi = passi.length;
  });
  avvolgi('wnWdAnnulla', function(r, a){
    var s = WN_ANN[a[0]];
    if (s === 'chiesto') { hap('medium'); sfx('soft'); XW.annRid = a[0]; }
    else { sfx('toggle'); hap('warning'); }
  });
  avvolgi('wnHome', function(){
    var rid = XW.annRid; if (!rid) return;
    if (WN_ANN[rid] === undefined) { XW.annRid = null; fx('err'); }
  });
  avvolgi('toast', function(r, a){
    if (XW.annRid && WN_ANN[XW.annRid] === 'chiesto' && a[1] !== 'error' && a[1] !== 'err') { XW.annRid = null; hap('success'); }
  });
  avvolgi('tonUiCopiaDep', function(r, a, ok){ if (ok) okCopia(); else fx('err'); },
    function(q){ var dep = (TONUI.st || {}).deposit || {}; return !!(q === 'memo' ? dep.memo : dep.address); });
  avvolgi('copyAddr', function(r, a, ok){ if (ok) okCopia(); else fx('err'); }, function(){ return !!(S.address && navigator.clipboard); });
  avvolgi('swapCopy', function(r, a, ok){ if (ok) okCopia(); }, function(id){ var e = $(id); return !!(e && e.textContent && navigator.clipboard); });
  avvolgi('cardOpenMoonpay', function(r, a, ok){ if (ok) { sfx('open'); hap('light'); } else fx('err'); }, function(){ return !!S.address; });
  avvolgi('frCopyLink', function(){ okCopia(); });
  avvolgi('frShareLink', function(){ sfx('open'); hap('light'); });
  function contaQuando(id, leggi, scrivi){
    var el = $(id); if (!el || !window.MutationObserver) return;
    new MutationObserver(function(){
      if (el.__xwScrivo) return;
      var t = el.textContent, v = leggi(t);
      if (t === el.__xwUltimo) return;
      el.__xwUltimo = t;
      if (!isFinite(v) || v <= 0) return;
      el.__xwScrivo = true;
      GBX.count(el, 0, v, function(x){ return scrivi(x, v); }, 800);
      setTimeout(function(){ el.__xwScrivo = false; if (el.textContent !== t) el.textContent = t; }, 900);
    }).observe(el, { childList:true, characterData:true, subtree:true });
  }
  function gruppoVivo(id){
    var el = $(id); if (!el) return;
    var marca = function(){ XW.vetro(el, el.children.length); [].forEach.call(el.querySelectorAll('.fr-ref-status'), XW.frase); };
    if (window.MutationObserver) new MutationObserver(marca).observe(el, { childList:true });
    marca();
  }
  try {
    ['it', 'en'].forEach(function(l){
      var T = FAIR_T[l];
      ['ruota', 'rivelati', 'ultime', 'verifica', 'attesa', 'fatto', 'aperta', 'clientno'].forEach(function(k){
        if (typeof T[k] === 'string') T[k] = T[k].replace(/^\S+\s+/, '');
      });
    });
  } catch(e){}
  avvolgi('fairMsg', function(r, a){
    var m = $('fair-msg'); if (!m || !a[0]) return;
    if (a[1] === 'ok') { sfx('soft'); hap('success'); scatto(m, 'xw-entra', 650); }
    else if (a[1] === 'ko') { fx('err'); scatto(m, 'xw-trema', 500); }
  });
  avvolgi('fairDisegna', function(){
    var st = $('fair-storico'); if (st) { [].forEach.call(st.children, function(c){ c.classList.add('x-lastra', 'xw-gr'); }); [].forEach.call(st.querySelectorAll('.fair-btn'), XW.frase); }
    scatto($('fair-nonce'), 'xw-bump', 400);
  });
  avvolgi('fairApriVerifica', function(){ sfx('open'); hap('light'); });
  function avvio(){
    var w = $('wallet'), f = $('friends'), q = $('fair');
    ['wn-dep-chips', 'wn-wd-chips', 'wn-val', 'wn-dest', 'wn-corso'].forEach(function(id){ var e = $(id); if (e) e.classList.add('x-nosfx'); });
    var sg = document.querySelector('#wn-v-carica .wn-seg'); if (sg) sg.classList.add('x-nosfx');
    [].forEach.call(document.querySelectorAll('#wallet [onclick^="tonUiCopiaDep"],#wallet [onclick^="copyAddr"],#wallet [onclick^="swapCopy"],#wallet #wn-altro-b,#wallet #wn-back,#friends .fr-action-btn,#fair [onclick^="fairApriVerifica"]'),
      function(b){ b.setAttribute('data-x-silent', ''); });
    var hn = $('wn-bal');
    if (hn && !$('xw-delta')) { var dl = document.createElement('span'); dl.id = 'xw-delta'; dl.className = 'xw-delta x-num'; dl.setAttribute('aria-hidden', 'true'); hn.parentNode.insertBefore(dl, hn.nextSibling); }
    var sc = $('wn-scroll'), vh = $('wn-v-home');
    XW.testata(w, sc, null, null);
    if (vh) XW.testata(w, null, 'Wallet', vh);
    var fc = f && f.querySelector('.game-content'), qc = q && q.querySelector('.game-content');
    XW.testata(f, fc, L('Invita amici', 'Invite friends'), fc);
    XW.testata(q, qc, L('Equità', 'Provably fair'), qc);
    var lb = document.querySelector('#friends .fr-link-box'), la = document.querySelector('#friends .fr-link-actions');
    if (lb && la && !lb.parentNode.classList.contains('xw-linkgr')) {
      var g = document.createElement('div'); g.className = 'xw-linkgr x-lastra xw-gr';
      lb.parentNode.insertBefore(g, lb); g.appendChild(lb); g.appendChild(la);
    }
    [].forEach.call(document.querySelectorAll('#friends .fr-hero,#friends .fr-stats,#fair .fair-card'), function(e){ e.classList.add('x-lastra'); });
    var how = document.querySelector('#friends .fr-how-it-works'); if (how) how.classList.add('x-lastra', 'xw-gr');
    [].forEach.call(document.querySelectorAll('#friends .fr-hero-title,#friends .fr-section-title,#friends .fr-stat-lbl,#friends .fr-action-btn,#fair .section-ttl,#fair .fair-btn'), XW.frase);
    gruppoVivo('fr-referrals-list'); gruppoVivo('fr-leaderboard');
    contaQuando('fr-invited', function(t){ return parseInt(t, 10); }, function(x){ return String(Math.round(x)); });
    contaQuando('fr-active', function(t){ return parseInt(t, 10); }, function(x){ return String(Math.round(x)); });
    contaQuando('fr-earned', function(t){ return parseFloat(String(t).replace(/[^\d.]/g, '')); }, function(x){ return '€' + x.toFixed(2); });
    lastre();
    [w, f, q].forEach(function(s){ if (s) GBX.tilt(s); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', avvio); else avvio();
})();
;
(function(){
  'use strict';
  var $ = function(id){ return document.getElementById(id); };
  function L(it, en){ try { if (window.CDC && CDC.L) return CDC.L(it, en); } catch(e){} return it; }
  function eur(x){ try { if (typeof betLbl === 'function') return betLbl(Math.abs(x)); } catch(e){} return '€' + Math.abs(x).toFixed(2); }
  function eur2(x){ return '€' + Math.abs(x).toFixed(2); }
  function lite(){ try { return GBX.lite(); } catch(e){ return false; } }
  var calmo = false; try { calmo = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){}
  var XD = window.XD = { rotto:false, pronto:false };
  var PIP = { 1:[[2,2]], 2:[[1,1],[3,3]], 3:[[1,1],[2,2],[3,3]], 4:[[1,1],[1,3],[3,1],[3,3]],
              5:[[1,1],[1,3],[2,2],[3,1],[3,3]], 6:[[1,1],[1,3],[2,1],[2,3],[3,1],[3,3]] };
  var MIRA = { 1:[0,0], 6:[0,180], 3:[0,-90], 4:[0,90], 2:[-90,0], 5:[90,0] };
  var NORM = { 1:[0,0,1], 6:[0,0,-1], 3:[1,0,0], 4:[-1,0,0], 2:[0,-1,0], 5:[0,1,0] };
  var ORD = [1, 6, 3, 4, 2, 5];
  function faccia(n){
    var h = '<div class="xd-f xd-f' + n + '" data-n="' + n + '">';
    var nit = '', sfo = '';
    PIP[n].forEach(function(p){ var g = ' style="grid-area:' + p[0] + '/' + p[1] + '"></i>'; nit += '<i class="xd-pip"' + g; sfo += '<i class="xd-pips"' + g; });
    return h + '<b class="xd-buio"></b><b class="xd-sfo">' + sfo + '</b><b class="xd-nit">' + nit + '</b></div>';
  }
  function dado(i){
    var h = '<div class="xd-dado xd-d' + i + '"><i class="xd-ombra"></i><div class="xd-salto"><div class="xd-cubo">';
    ORD.forEach(function(n){ h += faccia(n); });
    return h + '</div></div></div>';
  }
  var R = Math.PI / 180;
  function rx(a, v){ var c = Math.cos(a * R), s = Math.sin(a * R); return [v[0], c * v[1] - s * v[2], s * v[1] + c * v[2]]; }
  function ry(a, v){ var c = Math.cos(a * R), s = Math.sin(a * R); return [c * v[0] + s * v[2], v[1], -s * v[0] + c * v[2]]; }
  function rz(a, v){ var c = Math.cos(a * R), s = Math.sin(a * R); return [c * v[0] - s * v[1], s * v[0] + c * v[1], v[2]]; }
  var LUCE = (function(){ var v = [-.3, -.45, .84], m = Math.hypot(v[0], v[1], v[2]); return [v[0] / m, v[1] / m, v[2] / m]; })();
  function herm(a, v, b, T, p){ var p2 = p * p, p3 = p2 * p; return a * (2 * p3 - 3 * p2 + 1) + v * T * (p3 - 2 * p2 + p) + b * (-2 * p3 + 3 * p2); }
  function congruo(a, fine, d, min){
    var b = fine + 360 * Math.round((a + d - fine) / 360);
    if (v0segno(d) >= 0) { while (b < a + min) b += 360; } else { while (b > a - min) b -= 360; }
    return b;
  }
  function v0segno(x){ return x > 0 ? 1 : x < 0 ? -1 : 0; }
  var DD = [
    { face:3, ax:0, ay:-90, az:-4, x:0, y:0, el:null, vx:-11, vy:7 },
    { face:4, ax:0, ay:90,  az:5,  x:0, y:0, el:null, vx:-11, vy:-7 }
  ];
  var A = { fase:'riposo', raf:0, vt:0, tp:0, h:null, fuori:false };
  var TI = { x:0, y:0, ob:null, sent:null, cerca:0 };
  var S0, LH;
  function misura(){
    var d = document.querySelector('#xd-palco .xd-cubo');
    S0 = d ? d.offsetWidth : 128; LH = Math.round(S0 * .62);
  }
  function disegna(d){
    if (!d.el) return;
    var k = Math.max(0, Math.min(1.2, -d.y / LH));
    d.el.salto.style.transform = 'translate3d(' + d.x.toFixed(2) + 'px,' + d.y.toFixed(2) + 'px,0) scale(' + (1 + .05 * k).toFixed(4) + ')';
    var gx = d.vx - TI.y * 9, gy = d.vy + TI.x * 10;
    d.el.cubo.style.transform = 'perspective(' + Math.round(S0 * 8) + 'px) rotateX(' + gx.toFixed(2) + 'deg) rotateY(' + gy.toFixed(2) + 'deg) rotateZ(' + d.az.toFixed(2) + 'deg) rotateX(' + d.ax.toFixed(2) + 'deg) rotateY(' + d.ay.toFixed(2) + 'deg)';
    d.el.ombra.style.transform = 'translate3d(' + d.x.toFixed(2) + 'px,0,0) scale(' + (1 - .34 * k).toFixed(3) + ',' + (1 - .2 * k).toFixed(3) + ')';
    d.el.ombra.style.opacity = (1 - .62 * k).toFixed(3);
    if (lite()) return;
    var P = S0 * 8, mezzo = S0 / 2;
    for (var j = 0; j < 6; j++) {
      var n = ORD[j], v = NORM[n];
      v = ry(d.ay, v); v = rx(d.ax, v); v = rz(d.az, v); v = ry(gy, v); v = rx(gx, v);
      var cx = -v[0] * mezzo, cy = -v[1] * mezzo, cz = P - v[2] * mezzo, cl = Math.sqrt(cx * cx + cy * cy + cz * cz);
      var c = (v[0] * cx + v[1] * cy + v[2] * cz) / cl;
      var lum = v[0] * LUCE[0] + v[1] * LUCE[1] + v[2] * LUCE[2];
      var e = d.el, q;
      q = Math.round(Math.max(0, Math.min(.1, (lum - .25) * .16)) * 100) / 100;
      if (e.buio[j].__o !== q) { e.buio[j].__o = q; e.buio[j].style.opacity = q; }
      q = Math.round((.42 + .58 * liscio(-.35, .75, c)) * 50) / 50;
      if (e.f[j].__o !== q) { e.f[j].__o = q; e.f[j].style.opacity = q; }
      var t = liscio(.12, .62, c);
      q = Math.round(t * 50) / 50;
      if (e.nit[j].__o !== q) { e.nit[j].__o = q; e.nit[j].style.opacity = q; }
      q = Math.round((1 - t) * 50) / 50;
      if (e.sfo[j].__o !== q) { e.sfo[j].__o = q; e.sfo[j].style.opacity = q; }
    }
  }
  function liscio(a, b, x){ var k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); }
  function giro(t){
    A.raf = 0;
    var lento = +window.__xdLento || 1;
    var dt = Math.min(.05, (t - A.tp) / 1000) / lento; A.tp = t; A.vt += dt;
    var vivo = false;
    for (var i = 0; i < 2; i++) { var d = DD[i]; if (d.mov) { vivo = d.mov(d, A.vt) || vivo; } disegna(d); }
    if (vivo) A.raf = requestAnimationFrame(giro);
    else if (A.dopo) { var f = A.dopo; A.dopo = null; f(); }
  }
  function parti(){ if (A.fuori) return; if (!A.raf) { A.tp = performance.now(); A.raf = requestAnimationFrame(giro); } }
  var OM = [[380, 540, 60], [-460, 420, -50]];
  function aria(d, i){
    var t0 = A.vt + i * .045, a0 = [d.ax, d.ay, d.az], x0 = d.x, y0 = d.y, ph = i * 1.7, dir = i ? 1 : -1;
    d.om = [0, 0, 0];
    d.mov = function(d, vt){
      var t = vt - t0; if (t < 0) return true;
      var su = t < .07 ? 3 * Math.sin(t / .07 * Math.PI) : -LH * (1 - Math.pow(1 - Math.min(1, (t - .07) / .34), 3));
      d.y = y0 * Math.max(0, 1 - t / .2) + su + (t > .41 ? -4 * Math.sin((t - .41) * 6.3 + ph) : 0);
      d.x = x0 + (dir * S0 * .14 - x0) * (1 - Math.pow(1 - Math.min(1, t / .45), 3));
      var r = .28;
      for (var k = 0; k < 3; k++) {
        var w = OM[i][k];
        var ang = t < r ? w * t * t / (2 * r) : w * r / 2 + w * (t - r);
        d.om[k] = t < r ? w * t / r : w;
        if (k === 0) d.ax = a0[0] + ang; else if (k === 1) d.ay = a0[1] + ang; else d.az = a0[2] + ang;
      }
      d.vyy = (d.y - (d._py == null ? d.y : d._py)) / Math.max(1e-3, vt - (d._pt || vt - .016)); d._py = d.y; d._pt = vt;
      return true;
    };
  }
  function atterra(d, i, faceN, ritardo, piano){
    var tS = A.vt + (ritardo || 0), via = false, P = null;
    var prima = d.mov;
    function prepara(){
      var g = LH * 22, e = .34, y = d.y, v = isFinite(d.vyy) ? Math.max(-120, Math.min(160, d.vyy)) : 0;
      if (piano) { g = LH * 14; e = .18; }
      var seg = [], ts = 0, colpi = [];
      for (var n = 0; n < 5; n++) {
        var th = (-v + Math.sqrt(Math.max(0, v * v - 2 * g * y))) / g;
        if (!isFinite(th) || th < 0) th = 0;
        seg.push({ ts:ts, y:y, v:v }); ts += th; var vi = v + g * th;
        colpi.push({ t:ts, f:vi }); v = -e * vi; y = 0;
        if (Math.abs(v) < LH * .55) break;
      }
      var T = calmo ? .3 : Math.max(ts + .3, piano ? .7 : .98);
      var m = MIRA[faceN], fz = (i ? 1 : -1) * (3 + Math.random() * 5);
      var om = d.om || [0, 0, 0];
      P = { g:g, seg:seg, tr:ts, colpi:colpi, T:T, x0:d.x, a0:[d.ax, d.ay, d.az], om:om,
            b:[congruo(d.ax, m[0], om[0] * T * .42, Math.abs(om[0]) * T / 3),
               congruo(d.ay, m[1], om[1] * T * .42, Math.abs(om[1]) * T / 3),
               congruo(d.az, fz, om[2] * T * .42, Math.abs(om[2]) * T / 3)], k:0 };
      d.face = faceN;
    }
    d.__fine = faceN;
    d.mov = function(d, vt){
      var t = vt - tS;
      if (t < 0) return prima ? prima(d, vt) : true;
      if (!via) { via = true; prepara(); }
      if (t >= P.tr) d.y = 0;
      else { var s = P.seg[0]; for (var j = P.seg.length - 1; j >= 0; j--) if (t >= P.seg[j].ts) { s = P.seg[j]; break; }
        var u = t - s.ts; d.y = Math.min(0, s.y + s.v * u + .5 * P.g * u * u); }
      while (P.k < P.colpi.length && t >= P.colpi[P.k].t) { impatto(i, P.k, P.colpi[P.k].f / (LH * 7), piano); P.k++; }
      var p = Math.min(1, t / P.T);
      d.x = herm(P.x0, 0, 0, P.T, Math.min(1, t / (P.T * .8)));
      d.ax = herm(P.a0[0], P.om[0], P.b[0], P.T, p);
      d.ay = herm(P.a0[1], P.om[1], P.b[1], P.T, p);
      d.az = herm(P.a0[2], P.om[2], P.b[2], P.T, p);
      if (p >= 1 && t >= P.tr) {
        d.ax = MIRA[faceN][0]; d.ay = MIRA[faceN][1]; d.az = ((P.b[2] % 360) + 540) % 360 - 180; d.x = 0; d.y = 0;
        d.mov = null; d.om = [0, 0, 0]; return false;
      }
      return true;
    };
  }
  function impatto(i, k, f, piano){
    f = Math.max(.08, Math.min(1, f));
    if (k === 0) { try { GBX.hap(piano ? 'soft' : 'light'); } catch(e){} }
    else if (f > .25) { try { GBX.hap('soft'); } catch(e){} }
    if (typeof dd3Suono === 'function') { try { dd3Suono(k === 0 ? 'panno' : 'dado', f * (piano ? .5 : 1)); } catch(e){} }
  }
  function maniglia(){
    var h = { via:0, finito:0, cb:null, annullato:false };
    pulisci();
    var p = $('xd-palco'), ee = $('xd-esito'); if (ee) ee.classList.remove('xd-vuoto'); if (p) { p.classList.remove('xd-vinto', 'xd-perso', 'xd-err'); p.classList.add('xd-tira'); }
    A.dopo = null;
    misura();
    DD.forEach(function(d, i){ aria(d, i); });
    parti();
    h.esito = function(v, cb, vinto){
      h.cb = cb;
      var f1 = +v[0], f2 = +v[1];
      if (!(f1 >= 1 && f1 <= 6 && f2 >= 1 && f2 <= 6)) return false;
      if (A.fuori) {
        DD[0].face = f1; DD[1].face = f2; DD.forEach(function(d){ fermo(d); });
        setTimeout(function(){ var c = h.cb; h.cb = null; if (c) c(); }, 0); return true;
      }
      atterra(DD[0], 0, f1, 0); atterra(DD[1], 1, f2, .075);
      A.dopo = function(){
        setTimeout(function(){ var c = h.cb; h.cb = null; if (c && !h.annullato) c(); }, calmo ? 60 : 240);
      };
      parti();
      setTimeout(function(){ if (h.cb) { var c = h.cb; h.cb = null; A.dopo = null; DD.forEach(function(d){ fermo(d); }); c(); } }, 4000 * (+window.__xdLento || 1));
      return true;
    };
    h.annulla = function(){
      h.annullato = true; h.cb = null;
      atterra(DD[0], 0, DD[0].face, 0, true); atterra(DD[1], 1, DD[1].face, .05, true);
      A.dopo = function(){ var p = $('xd-palco'); if (p) p.classList.remove('xd-tira'); };
      parti();
      setTimeout(errore, 0);
    };
    return h;
  }
  function fermo(d){ var m = MIRA[d.face]; d.mov = null; d.ax = m[0]; d.ay = m[1]; d.x = 0; d.y = 0;
    var z = ((d.az % 360) + 540) % 360 - 180; d.az = Math.max(-8, Math.min(8, z)); disegna(d); }
  function pulisci(){
    var e = $('xd-esito'); if (e) e.classList.remove('on');
  }
  function nomePick(p){ return p === 'lo' ? L('Basso', 'Low') + ' · 2–6' : p === 'hi' ? L('Alto', 'High') + ' · 8–12' : L('Sette', 'Seven'); }
  XD.mostra = function(r, bet){
    var e = $('xd-esito'), p = $('xd-palco'); if (!e || !r || r.error) return;
    var pick = ''; try { pick = DC.pick; } catch(x){}
    $('xd-tot').textContent = r.sum;
    var mult = r.mult ? ' · ×' + r.mult : '';
    if (r.won) {
      var win = (r.payout_cent != null) ? r.payout_cent / 100 : (r.payout_btc || 0) * S.rate;
      var netto = Math.round((win - bet) * 100) / 100;
      $('xd-msg').innerHTML = '<b>' + L('Vinci', 'You win') + '</b><small class="x-num xd-su">+' + eur2(netto) + '</small>';
      $('xd-hint').textContent = nomePick(pick) + mult;
      p.classList.add('xd-vinto');
    } else {
      $('xd-msg').innerHTML = '<b>' + L('Perso', 'You lose') + '</b><small class="x-num xd-giu">−' + eur2(bet) + '</small>';
      $('xd-hint').textContent = nomePick(pick);
      p.classList.add('xd-perso');
    }
    p.classList.remove('xd-tira', 'xd-err');
    e.classList.remove('on'); void e.offsetWidth; e.classList.add('on');
  };
  function errore(){
    var e = $('xd-esito'), p = $('xd-palco'), s = $('dc-status'); if (!e) return;
    var m = s ? s.textContent.replace(/^[^A-Za-zÀ-ÿ0-9]+/, '').trim() : '';
    $('xd-tot').textContent = '';
    $('xd-msg').innerHTML = '<b>' + L('Lancio non riuscito', 'Roll failed') + '</b>';
    $('xd-hint').textContent = m;
    p.classList.add('xd-err');
    e.classList.remove('on'); void e.offsetWidth; e.classList.add('on');
  }
  function costruisci(){
    var scr = $('dice'), sc = $('xcdc-scroll'), st = $('xcdc-stage');
    if (!scr || !sc || !st) return false;
    if (scr.__xd) return true;
    var bowl = scr.querySelector('.xc-dcbowl'), pick = scr.querySelector('.dc-pick');
    if (!bowl || !pick) return false;
    scr.__xd = true;
    scr.classList.add('xd-scr');
    var pal = document.createElement('div'); pal.className = 'xd-palco'; pal.id = 'xd-palco';
    pal.innerHTML = '<i class="xd-sent x-lit" aria-hidden="true"></i><div class="xd-tavolo" id="xd-tavolo"><i class="xd-alone"></i>' + dado(0) + dado(1) + '</div>' +
      '<div class="xd-esito" id="xd-esito"><div class="xd-tot x-num" id="xd-tot"></div><div class="xd-msg" id="xd-msg"></div><div class="xd-hint" id="xd-hint"></div></div>';
    sc.insertBefore(pal, sc.firstChild);
    bowl.insertBefore(pick, bowl.firstChild);
    pick.classList.add('x-nosfx');
    [].forEach.call(pick.querySelectorAll('.dc-bet-card'), function(b){
      var k = b.getAttribute('data-dc'), rg = b.querySelector('.dc-bc-range');
      if (rg && k === '7') rg.textContent = '7';
      b.setAttribute('aria-label', nomePick(k));
      b.classList.remove('x-sv');
      b.addEventListener('click', function(){ try { GBX.fx('toggle'); } catch(e){} });
    });
    [].forEach.call(pal.querySelectorAll('.xd-dado'), function(el, i){
      DD[i].el = { salto:el.querySelector('.xd-salto'), cubo:el.querySelector('.xd-cubo'), ombra:el.querySelector('.xd-ombra'),
                   f:[].map.call(el.querySelectorAll('.xd-f'), function(b){ return b; }),
                   nit:[].map.call(el.querySelectorAll('.xd-nit'), function(b){ return b; }),
                   sfo:[].map.call(el.querySelectorAll('.xd-sfo'), function(b){ return b; }),
                   buio:[].map.call(el.querySelectorAll('.xd-buio'), function(b){ return b; }) };
    });
    misura();
    DD.forEach(function(d){ fermo(d); });
    $('xd-hint').textContent = L('Scegli e lancia', 'Pick and roll');
    $('xd-esito').classList.add('on', 'xd-vuoto');
    XD.pronto = true;
    return true;
  }
  function attivo(){ try { return !XD.rotto && XD.pronto && CUR === 'dice' && !!$('xd-palco'); } catch(e){ return false; } }
  XD.attivo = attivo;
  function aggancia(){
    if (XD.agganciato) return; XD.agganciato = true;
    if (typeof window.dd3Casino === 'function') {
      var dc0 = window.dd3Casino;
      window.dd3Casino = function(){
        if (attivo()) { try { return maniglia(); } catch(e){ XD.rotto = true; spegni(); try { console.warn('[XD] giù: ' + (e && e.message || e)); } catch(x){} } }
        return dc0.apply(this, arguments);
      };
    }
    if (typeof window.dd3Riposo === 'function') {
      var dr0 = window.dd3Riposo;
      window.dd3Riposo = function(){ if (attivo()) return false; return dr0.apply(this, arguments); };
    }
    var C = window.CDC;
    if (C) {
      var t0 = C.tasto, en0 = C.entra, fi0 = C.fine, via0 = C.via;
      C.tasto = function(){
        if (XD.rotto || !($('dice') && $('dice').__xd)) return t0 && t0.apply(this, arguments);
        var b = $('dc-roll'); if (!b) return; var p = 0; try { p = currentBet.dice; } catch(e){}
        b.textContent = L('Lancia', 'Roll') + (p ? ' · ' + eur(p) : '');
      };
      C.entra = function(){
        var r; if (en0) try { r = en0.apply(this, arguments); } catch(e){}
        try { if (!XD.rotto) costruisci(); C.tasto(); } catch(e){ XD.rotto = true; spegni(); }
        return r;
      };
      C.fine = function(r, bet){
        if (!$('dice') || !$('dice').__xd || XD.rotto) return fi0 && fi0.apply(this, arguments);
        var sp = GBX.sparks; GBX.sparks = function(){};
        try { if (fi0) fi0.apply(this, arguments); } catch(e){} finally { GBX.sparks = sp; }
        try { XD.mostra(r, bet); } catch(e){}
      };
      C.via = function(){ if (via0) try { via0.apply(this, arguments); } catch(e){} var e = $('xd-esito'); if (e) e.classList.remove('xd-vuoto'); };
    }
    document.addEventListener('gbx:screen', function(ev){
      if (!ev.detail || XD.rotto) return;
      if (ev.detail.da === 'dice' && ev.detail.id !== 'dice') { try { esci(); } catch(e){} }
      if (ev.detail.id !== 'dice') return;
      A.fuori = false;
      try { costruisci(); if (window.CDC) CDC.tasto(); misura(); DD.forEach(function(d){ if (!d.mov) fermo(d); }); inclina(true); } catch(e){}
    });
  }
  function esci(){
    A.fuori = true;
    inclina(false);
    if (A.raf) { cancelAnimationFrame(A.raf); A.raf = 0; }
    var lancio = DD.some(function(d){ return !!d.mov; });
    DD.forEach(function(d){ if (d.mov && d.__fine) d.face = d.__fine; if (d.mov) fermo(d); });
    if (lancio && A.dopo) { var f = A.dopo; A.dopo = null; f(); }
  }
  function inclina(on){
    clearTimeout(TI.cerca);
    if (!on || lite() || calmo) {
      if (TI.ob) { TI.ob.disconnect(); TI.ob = null; }
      return;
    }
    var s = document.querySelector('#xd-palco .xd-sent');
    var g = s && s.__xg;
    if (!g) { TI.cerca = setTimeout(function(){ if (!A.fuori) inclina(true); }, 250); return; }
    if (TI.ob && TI.sent === g) return;
    if (TI.ob) TI.ob.disconnect();
    TI.sent = g;
    TI.ob = new MutationObserver(function(){
      var m = /translate3d\(([-\d.]+)%,\s*([-\d.]+)%/.exec(g.style.transform || '');
      if (!m) return;
      var x = Math.max(-1, Math.min(1, +m[1] / 27.5)), y = Math.max(-1, Math.min(1, (+m[2] + 10) / 25));
      if (Math.abs(x - TI.x) + Math.abs(y - TI.y) < .002) return;
      TI.x = x; TI.y = y;
      if (!A.raf) DD.forEach(function(d){ disegna(d); });
    });
    TI.ob.observe(g, { attributes:true, attributeFilter:['style'] });
  }
  XD._ti = TI;
  function spegni(){
    var s = $('dice'); if (s) s.classList.remove('xd-scr');
  }
  window.addEventListener('resize', function(){ if (XD.pronto) { misura(); DD.forEach(function(d){ disegna(d); }); } });
  function avvio(){
    try { aggancia(); if ($('dice') && $('dice').classList.contains('active')) costruisci(); } catch(e){ XD.rotto = true; spegni(); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', avvio); else avvio();
})();
;
(function(){
  'use strict';
  var W = window, D = document;
  if (W.XQD) return;
  var XQD = W.XQD = { on:true, v:'1611', n:0 };
  function L(it, en){ return W.GB_LANG === 'en' ? en : it; }
  function $(id){ return D.getElementById(id); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  function vivo(){ return !!(P.el && P.el.isConnected); }
  function hap(t){ try { if (vivo() && W.GBX && GBX.hap) GBX.hap(t); } catch(e){} }
  function fermo(){
    try {
      return (W.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) || (W.GBX && GBX.lite && GBX.lite()) ||
        D.documentElement.classList.contains('gb-lite') || !!(W.RTD && RTD.lite);
    } catch(e){ return false; }
  }
  function tws(){ try { return (typeof TWS !== 'undefined' && TWS && TWS.on && TWS.ctx && vivo()) ? TWS : null; } catch(e){ return null; } }
  var SUONI = {
    vento: function(t){ t.noise({ d:1.9, g:0.045, lp:900, lp2:260 }); t.noise({ d:1.2, g:0.025, lp:2200, lp2:700, hp:500, at:0.5 }); },
    richiamo: function(t){
      t.tone({ f:220, type:'sawtooth', lp:1100, d:0.42, g:0.05, a:0.02 });
      t.tone({ f:330, f2:311, type:'sawtooth', lp:1100, d:0.75, g:0.045, a:0.02, at:0.22 });
      t.tone({ f:110, type:'triangle', d:0.9, g:0.05, at:0.22 });
    },
    battito: function(t){ t.tone({ f:62, f2:44, d:0.12, g:0.16 }); t.tone({ f:56, f2:40, d:0.14, g:0.12, at:0.17 }); },
    schiocco: function(t){ t.noise({ d:0.07, g:0.22, hp:1800, lp:9000 }); t.tone({ f:1400, f2:500, type:'triangle', d:0.09, g:0.06 }); },
    sibilo: function(t){ t.noise({ d:0.35, g:0.05, lp:5200, lp2:900, hp:1200 }); },
    trionfo: function(t){ [392, 494, 587, 784].forEach(function(f, i){ t.tone({ f:f, type:'triangle', d:0.5, g:0.06, at:0.12 + i * 0.07 }); }); }
  };
  function suona(n){ var t = tws(); if (!t || !SUONI[n]) return; try { SUONI[n](t); } catch(e){} }
  var MIS = {
    lui_pronto:{ w:286, h:520, piedi:.504 }, lui_spara:{ w:357, h:520, piedi:.621 }, lui_colpito:{ w:431, h:520, piedi:.667 },
    tu_pronto:{ w:368, h:680, piedi:.548 },  tu_spara:{ w:503, h:680, piedi:.402 },  tu_colpito:{ w:436, h:680, piedi:.467 }
  };
  var PUNTI = {
    tu_spara:  { bocca:[.985, .215] },
    lui_spara: { bocca:[.30, .165] },
    lui_pronto:{ petto:[.50, .40] },
    tu_pronto: { petto:[.52, .33] }
  };
  var FILE = ['xqd_fondo.webp', 'xqd_scritta.webp', 'xqd_rotolo.webp'];
  ['tu', 'lui'].forEach(function(c){ ['pronto', 'spara', 'colpito'].forEach(function(p){ FILE.push('xqd_' + c + '_' + p + '.webp'); }); });
  var PRE = [];
  function precarica(){
    if (PRE.length) return;
    FILE.forEach(function(f){ var i = new Image(); i.decoding = 'async'; i.src = f; PRE.push(i); try { if (i.decode) i.decode().catch(function(){}); } catch(e){} });
  }
  XQD.precarica = precarica;
  var P = { el:null, k:'', fase:'', rnd:0, timers:[], hb:0, hbT:0, cd:'', me:null, op:null, raw:null, fine:false, guardia:0, tap:0 };
  function dopo(ms, f){ var t = setTimeout(function(){ P.timers = P.timers.filter(function(x){ return x !== t; }); if (vivo()) f(); }, ms); P.timers.push(t); }
  function pulisciTimers(){ P.timers.forEach(clearTimeout); P.timers = []; }
  function posa(c, p){
    var m = MIS[c + '_' + p];
    return '<div class="xqd-po ' + p + '" data-k="' + c + '_' + p + '" style="--ar:' + (m.w / m.h).toFixed(4) + ';--pi:' + (-m.piedi * 100).toFixed(1) + '%">' +
      '<img src="xqd_' + c + '_' + p + '.webp" alt="" draggable="false" decoding="async">' +
      (p === 'spara' ? '<i class="xqd-fiamma ' + c + '"><b></b></i>' : '') + '</div>';
  }
  function pips(n, tot, cl){ var s = ''; for (var i = 0; i < tot; i++) s += '<i class="xqd-pip' + (i < n ? ' on' : '') + '"></i>'; return '<span class="xqd-pips ' + (cl || '') + '">' + s + '</span>'; }
  function monta(){
    var b = $('arc-body'); if (!b) return null;
    if (P.el && P.el.parentNode === b) return P.el;
    var s = D.createElement('div'); s.id = 'xqd-stage'; s.className = 'xqd';
    var polvere = ''; for (var i = 0; i < 9; i++) polvere += '<i style="--i:' + i + '"></i>';
    s.innerHTML =
      '<div class="xqd-cam"><div class="xqd-cam2">' +
        '<div class="xqd-fondo"></div><div class="xqd-sole"></div><div class="xqd-foschia"></div>' +
        '<div class="xqd-chi lui"><div class="xqd-ombra"></div>' + posa('lui', 'pronto') + posa('lui', 'spara') + posa('lui', 'colpito') +
          '<i class="xqd-impatto lui"></i></div>' +
        '<div class="xqd-rotolo"><img src="xqd_rotolo.webp" alt="" draggable="false"></div>' +
        '<div class="xqd-polvere">' + polvere + '</div>' +
        '<div class="xqd-chi tu">' + posa('tu', 'pronto') + posa('tu', 'spara') + posa('tu', 'colpito') +
          '<i class="xqd-impatto tu"></i></div>' +
      '</div></div>' +
      '<div class="xqd-traccia"><i></i></div>' +
      '<div class="xqd-vign"></div><div class="xqd-bande"><i class="su"></i><i class="giu"></i></div>' +
      '<div class="xqd-lampo"></div><div class="xqd-rosso"></div>' +
      '<div class="xqd-hud"><div class="xqd-pl tu"></div><div class="xqd-rnd"></div><div class="xqd-pl lui"></div></div>' +
      '<div class="xqd-msg"><div class="xqd-cd"></div><div class="xqd-finta">…?</div><img class="xqd-draw" src="xqd_scritta.webp" alt="DRAW!" draggable="false">' +
        '<div class="xqd-esito"><div class="xqd-big"></div><div class="xqd-sub"></div></div></div>' +
      '<div class="xqd-hint"></div>';
    b.appendChild(s);
    P.el = s; P.k = ''; P.fase = ''; P.cd = ''; P.fine = false;
    var a = $('arc'); if (a) a.classList.add('xqd-on');
    s.classList.toggle('xqd-fermo', fermo());
    s.addEventListener('pointerdown', tocco, { passive:false });
    misura();
    precarica();
    XQD.n++;
    sorveglia();
    return s;
  }
  function smonta(){
    pulisciTimers(); battitoStop();
    var a = $('arc'); if (a) a.classList.remove('xqd-on');
    if (P.el && P.el.parentNode) P.el.parentNode.removeChild(P.el);
    P.el = null; P.k = ''; P.fase = '';
  }
  XQD.smonta = smonta;
  var sorvT = 0;
  function sorveglia(){
    if (sorvT) return;
    sorvT = setInterval(function(){
      var a = $('arc');
      if (!P.el || !P.el.isConnected || !W.RTD || RTD.game !== 'draw' || !a || !a.classList.contains('active')) {
        smonta(); clearInterval(sorvT); sorvT = 0;
      }
    }, 400);
  }
  function misura(){
    if (!P.el) return;
    var r = P.el.getBoundingClientRect();
    P.el.style.setProperty('--h', Math.max(300, r.height) + 'px');
    P.el.style.setProperty('--w', Math.max(280, r.width) + 'px');
  }
  W.addEventListener('resize', function(){ if (P.el) misura(); });
  function tocco(ev){
    if (ev.button > 0) return;
    if (ev.target && ev.target.closest && ev.target.closest('button,a,input')) return;
    try { if (ev.cancelable) ev.preventDefault(); } catch(e){}
    var raw = P.raw;
    if (!W.RTD || RTD.spec || RTD.game !== 'draw') return;
    try { rtdSend({ t:'act', a:'attack' }); } catch(e){}
    if (raw && raw.state === 'go' && !raw.over && P.fase === 'go' && !P.tap) {
      P.tap = 1; hap('medium');
      metti('tu', 'spara'); spara('tu');
    } else if (raw && (raw.state === 'wait' || raw.state === 'fake')) {
      hap('light');
    }
  }
  function ids(raw){
    var ks = Object.keys(raw.sc || {});
    var me = (W.RTD && !RTD.spec && RTD.myId != null) ? String(RTD.myId) : (ks[0] || null);
    var op = null; ks.forEach(function(k){ if (String(k) !== String(me)) op = k; });
    return { me:me, op:op };
  }
  function nome(id){ try { return String(rtdName(id) || '').slice(0, 14); } catch(e){ return ''; } }
  function nomeTu(){ return (W.RTD && RTD.spec) ? nome(P.me) : L('Tu', 'You'); }
  function iniz(s){ return (String(s || '').replace(/[^\wÀ-ÿ]/g, '').charAt(0) || '?').toUpperCase(); }
  function hud(raw){
    var e = P.el; if (!e) return;
    var tot = Math.floor((raw.rounds || 5) / 2) + 1;
    var sc = raw.sc || {};
    var a = sc[P.me] || 0, b = sc[P.op] || 0;
    var nt = nomeTu(), nl = nome(P.op) || L('Avversario', 'Opponent');
    var k = [a, b, raw.rnd, raw.spa, nt, nl, P.fine].join('|');
    if (e._hud === k) return; e._hud = k;
    var prima = e._sc || [0, 0]; e._sc = [a, b];
    e.querySelector('.xqd-pl.tu').innerHTML = '<span class="xqd-av">' + esc(iniz(nt)) + '</span><span class="xqd-nm">' + esc(nt) + '</span>' + pips(a, tot);
    e.querySelector('.xqd-pl.lui').innerHTML = pips(b, tot) + '<span class="xqd-nm">' + esc(nl) + '</span><span class="xqd-av v">' + esc(iniz(nl)) + '</span>';
    var piatto = '';
    try { var g = D.querySelector('#arc-hud .twr-chip.gold'); if (g) piatto = String(g.textContent || '').replace(/\s+/g, ' ').trim(); } catch(x){}
    var riga = P.fine ? L('Sfida chiusa', 'Duel over') : raw.spa ? L('Spareggio ', 'Tiebreak ') + raw.spa : 'Round ' + (raw.rnd || 1) + '<em>/' + (raw.rounds || 5) + '</em>';
    e.querySelector('.xqd-rnd').innerHTML = '<b>' + riga + '</b><small>' + L('al meglio di ', 'best of ') + (raw.rounds || 5) + (piatto && /\d/.test(piatto) && !/^€?0[.,]00$/.test(piatto) ? ' · ' + esc(piatto) : '') + '</small>';
    if (a > prima[0]) { var p = e.querySelectorAll('.xqd-pl.tu .xqd-pip')[a - 1]; if (p) p.classList.add('nuovo'); }
    if (b > prima[1]) { var q = e.querySelectorAll('.xqd-pl.lui .xqd-pip')[b - 1]; if (q) q.classList.add('nuovo'); }
  }
  function metti(c, p){
    var ch = P.el && P.el.querySelector('.xqd-chi.' + c); if (!ch) return;
    ch.setAttribute('data-posa', p);
  }
  function rifai(el, cl){ if (!el) return; el.classList.remove(cl); void el.offsetWidth; el.classList.add(cl); }
  function spara(c){
    var e = P.el; if (!e) return;
    rifai(e.querySelector('.xqd-fiamma.' + c), 'via');
    suona('schiocco');
  }
  function colpito(c){
    var e = P.el; if (!e) return;
    rifai(e.querySelector('.xqd-impatto.' + c), 'via');
    metti(c, 'colpito');
  }
  function scia(){
    var e = P.el; if (!e || e.classList.contains('xqd-fermo')) return;
    try {
      var r0 = e.getBoundingClientRect();
      var pa = e.querySelector('.xqd-chi.tu .xqd-po.spara'), pb = e.querySelector('.xqd-chi.lui .xqd-po.pronto');
      var a = pa.getBoundingClientRect(), b = pb.getBoundingClientRect();
      var x0 = a.left + a.width * PUNTI.tu_spara.bocca[0] - r0.left, y0 = a.top + a.height * PUNTI.tu_spara.bocca[1] - r0.top;
      var x1 = b.left + b.width * PUNTI.lui_pronto.petto[0] - r0.left, y1 = b.top + b.height * PUNTI.lui_pronto.petto[1] - r0.top;
      var t = e.querySelector('.xqd-traccia');
      t.style.left = x0 + 'px'; t.style.top = y0 + 'px';
      t.style.width = Math.hypot(x1 - x0, y1 - y0) + 'px';
      t.style.transform = 'rotate(' + Math.atan2(y1 - y0, x1 - x0) + 'rad)';
      rifai(t, 'via');
    } catch(x){ XQD.errScia = String(x && x.message || x); }
  }
  function testo(big, sub, cl){
    var e = P.el; if (!e) return;
    var es = e.querySelector('.xqd-esito');
    es.className = 'xqd-esito ' + (cl || '');
    es.querySelector('.xqd-big').innerHTML = big || '';
    es.querySelector('.xqd-sub').innerHTML = sub || '';
    if (big || sub) { void es.offsetWidth; es.classList.add('su'); }
  }
  function hint(t){ var h = P.el && P.el.querySelector('.xqd-hint'); if (h) { h.innerHTML = t || ''; h.classList.toggle('vuoto', !t); } }
  function ms(v){ return '<span class="xqd-ms">' + Math.max(0, v | 0) + '</span><span class="xqd-msu">ms</span>'; }
  function battitoStart(){
    battitoStop(); P.hbT = Date.now();
    var giro = function(){
      if (!vivo() || (P.fase !== 'wait' && P.fase !== 'fake')) { P.hb = 0; return; }
      hap('soft'); setTimeout(function(){ hap('light'); }, 150); suona('battito');
      var el = P.el.querySelector('.xqd-vign'); rifai(el, 'batte');
      var dt = Date.now() - P.hbT, per = Math.max(560, 980 - dt * 0.07);
      P.hb = setTimeout(giro, per);
    };
    P.hb = setTimeout(giro, 700);
  }
  function battitoStop(){ if (P.hb) clearTimeout(P.hb); P.hb = 0; }
  function fase(f){
    var e = P.el; if (!e) return;
    e.setAttribute('data-fase', f); P.fase = f;
  }
  function nuovoRound(raw){
    pulisciTimers();
    var e = P.el;
    e.classList.remove('xqd-tuvince', 'xqd-luivince', 'xqd-scossa', 'xqd-fallo');
    e.querySelector('.xqd-draw').classList.remove('via');
    metti('tu', 'pronto'); metti('lui', 'pronto'); P.tap = 0;
    testo('', '');
    fase('wait');
    hint(L('Tocca ovunque al <b>DRAW!</b>', 'Tap anywhere on <b>DRAW!</b>'));
    var ro = e.querySelector('.xqd-rotolo');
    if (Math.random() < 0.7) { ro.style.setProperty('--y', (Math.random() * 6).toFixed(1) + '%'); rifai(ro, 'via'); } else ro.classList.remove('via');
    suona('vento'); dopo(350, function(){ suona('richiamo'); });
    battitoStart();
  }
  function applica(raw){
    var e = P.el; if (!e) return;
    var tot = Math.floor((raw.rounds || 5) / 2) + 1;
    var sc = raw.sc || {};
    P.fine = !!raw.over || (raw.state === 'done' && ((sc[P.me] || 0) >= tot || (sc[P.op] || 0) >= tot));
    hud(raw);
    var st = raw.state, taps = raw.taps || {};
    if (st === 'wait') {
      if (P.fase !== 'wait' && P.fase !== 'fake') nuovoRound(raw);
      else { fase('wait'); e.classList.remove('xqd-sussulto'); }
      return;
    }
    if (st === 'fake') {
      if (P.fase !== 'wait' && P.fase !== 'fake') nuovoRound(raw);
      fase('fake'); rifai(e, 'xqd-sussulto'); hap('rigid');
      return;
    }
    if (st === 'go') {
      if (P.fase === 'go') return;
      battitoStop(); fase('go');
      rifai(e.querySelector('.xqd-draw'), 'via'); rifai(e.querySelector('.xqd-lampo'), 'via');
      hap('heavy'); suona('schiocco');
      hint(L('<b>SPARA!</b>', '<b>SHOOT!</b>'));
      return;
    }
    if (st !== 'done') return;
    if (P.fase === 'esito') return;
    battitoStop(); fase('esito'); hint('');
    e.querySelector('.xqd-draw').classList.remove('via');
    var mio = taps[P.me], suo = taps[P.op], nl = esc(nome(P.op) || L('Avversario', 'Opponent'));
    var spet = !!(W.RTD && RTD.spec), nt = esc(nomeTu());
    var ultimo = P.fine;
    if (mio === -1) {
      e.classList.add('xqd-fallo'); metti('tu', 'spara'); rifai(e.querySelector('.xqd-rosso'), 'via');
      testo(spet ? nt + L(' anticipa', ' jumps the gun') : L('Troppo presto!', 'Too early!'), L('Round a ', 'Round to ') + nl, 'fallo');
      hap('error');
    } else if (suo === -1) {
      metti('lui', 'spara'); e.classList.add('xqd-fallo');
      testo(nl + L(' anticipa!', ' jumped the gun!'), spet ? L('Round a ', 'Round to ') + nt : L('Round tuo', 'Your round'), 'regalo');
      hap('success');
    } else if (raw.rwin && String(raw.rwin) === String(P.me)) {
      e.classList.add('xqd-tuvince');
      if (!P.tap) { metti('tu', 'spara'); spara('tu'); }
      suona('sibilo');
      dopo(fermo() ? 0 : 90, function(){ colpito('lui'); hap('heavy'); });
      testo(ms(mio), spet ? L('Round a ', 'Round to ') + nt : (ultimo ? L('Colpo finale', 'Final shot') : L('Round tuo', 'Your round')), 'vinto');
      dopo(fermo() ? 0 : 420, function(){ hap('success'); });
      if (ultimo) dopo(fermo() ? 0 : 500, function(){ suona('trionfo'); });
    } else if (raw.rwin) {
      e.classList.add('xqd-luivince');
      metti('lui', 'spara'); spara('lui');
      rifai(e.querySelector('.xqd-rosso'), 'via');
      dopo(fermo() ? 0 : 70, function(){ colpito('tu'); hap('heavy'); rifai(e, 'xqd-scossa'); });
      testo(spet ? nl + L(' più veloce', ' was faster') : L('Più lento', 'Too slow'), nl + ' · ' + (suo != null && suo >= 0 ? (suo | 0) + ' ms' : ''), 'perso');
      dopo(fermo() ? 0 : 380, function(){ hap('error'); });
    } else {
      testo(L('Nessuno spara', 'Nobody fired'), L('Il round si rigioca', 'The round is replayed'), 'nullo');
      hap('warning');
    }
  }
  function contoAllaRovescia(now){
    var e = P.el; if (!e || !W.RTD || !RTD.stampQ) return;
    var cur = '';
    for (var i = 0; i < RTD.stampQ.length; i++) {
      var s = RTD.stampQ[i];
      if (!/^(3|2|1|GO!|VIA!)$/.test(s.txt)) continue;
      if (now >= s.t0 && now < s.t0 + (s.dur || 900)) cur = s.txt;
    }
    if (cur === P.cd) return;
    P.cd = cur;
    var c = e.querySelector('.xqd-cd');
    if (!cur) { c.classList.remove('via'); c.innerHTML = ''; e.classList.remove('xqd-conta'); return; }
    var g = /^(GO!|VIA!)$/.test(cur);
    c.innerHTML = g ? '<span class="g">' + L('In guardia', 'Steady') + '</span>' : '<span>' + cur + '</span>';
    e.classList.add('xqd-conta');
    rifai(c, 'via'); hap(g ? 'medium' : 'light');
  }
  function fotogramma(raw, now){
    if (!XQD.on || !W.RTD || RTD.game !== 'draw' || !raw || (raw.g && raw.g !== 'draw')) return false;
    if (!monta()) return false;
    P.raw = raw;
    var w = ids(raw); P.me = w.me; P.op = w.op;
    contoAllaRovescia(now || performance.now());
    var k = [raw.state, raw.rnd, raw.spa || 0, JSON.stringify(raw.taps || {}), raw.rwin, raw.over ? 1 : 0, JSON.stringify(raw.sc || {})].join('|');
    if (k !== P.k) { P.k = k; applica(raw); }
    return true;
  }
  XQD.fotogramma = fotogramma;
  function aggancia(){
    if (typeof W.rtdDrawDrawG !== 'function' || W.rtdDrawDrawG._xqd) return typeof W.rtdDrawDrawG === 'function';
    var orig = W.rtdDrawDrawG;
    var nuovo = function(ctx, raw, lp, now, w, hh){
      if (XQD.on) {
        try { if (fotogramma(raw, now)) return; } catch(e){ XQD.err = String(e && e.message || e); try { smonta(); } catch(x){} XQD.on = false; }
      }
      return orig.apply(this, arguments);
    };
    nuovo._xqd = 1; W.rtdDrawDrawG = nuovo;
    if (typeof W.rtdScoreBar === 'function' && !W.rtdScoreBar._xqd) {
      var sb = W.rtdScoreBar;
      var sb2 = function(){ if (XQD.on && P.el && P.el.isConnected && W.RTD && RTD.game === 'draw') return; return sb.apply(this, arguments); };
      sb2._xqd = 1; W.rtdScoreBar = sb2;
    }
    return true;
  }
  if (!aggancia()) {
    var tent = 0, iv = setInterval(function(){ if (aggancia() || ++tent > 40) clearInterval(iv); }, 250);
    D.addEventListener('DOMContentLoaded', aggancia);
  }
  setInterval(function(){
    if (PRE.length) return;
    try { var a = $('arc'); if (W.RTD_GAME === 'draw' && a && a.classList.contains('active')) (W.requestIdleCallback || setTimeout)(precarica); } catch(e){}
  }, 1500);
})();
;
(function(){
  'use strict';
  if (window.XZ) return;
  var D = document, W = window;
  var XZ = W.XZ = { on:true, n:0 };
  function L(it, en){ return W.GB_LANG === 'en' ? en : it; }
  function hap(t){ try { if (W.GBX && GBX.hap) GBX.hap(t); } catch(e){} }
  function $(id){ return D.getElementById(id); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  function eur(v){ return '€' + (Number(v) || 0).toFixed(2); }
  function M(){ return $('pvp-modal'); }
  function OV(){ return $('pvp-overlay'); }
  var G = {
    rr:   ['rr',    'Roulette russa',      'Russian roulette'],
    bs:   ['bs',    'Battaglia navale',    'Battleship'],
    ch:   ['chess', 'Scacchi',             'Chess'],
    pkd:  ['pk1v1', 'Poker 1v1',           'Poker 1v1'],
    bj:   ['bj1v1', 'Blackjack 1v1',       'Blackjack 1v1'],
    rps:  ['rps',   'Sasso carta forbice', 'Rock paper scissors'],
    dice: ['dice',  'Dadi',                'Dice']
  };
  function sv(p, cl){ return '<svg class="' + (cl || 'xz-sv') + '" viewBox="0 0 24 24" aria-hidden="true">' + p + '</svg>'; }
  var IC = {
    hit:'<path d="M12 5v14M5 12h14"/>',
    stand:'<path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V12M11 11.5v-6a1.5 1.5 0 0 1 3 0v6M14 11.5V7a1.5 1.5 0 0 1 3 0v7c0 4-2.5 6-5.5 6S7 18.5 6 16l-1.6-3.3a1.4 1.4 0 0 1 2.4-1.4L8 13"/>',
    double:'<path d="M7 13l5-5 5 5M7 18l5-5 5 5"/>',
    split:'<path d="M12 20v-6M12 14L6 6M12 14l6-8M6 6v4M6 6h4M18 6v4M18 6h-4"/>',
    ruota:'<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 5v6h-6"/>',
    caso:'<path d="M4 7h3.5c3 0 4.5 10 8 10H20M4 17h3.5c1.4 0 2.4-2 3.3-4.2M13.2 9.2C14 7.9 14.8 7 16 7H20M17.5 4.5L20 7l-2.5 2.5M17.5 14.5L20 17l-2.5 2.5"/>',
    annulla:'<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    dacapo:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    esci:'<path d="M14 4h4.5a1.5 1.5 0 0 1 1.5 1.5v13a1.5 1.5 0 0 1-1.5 1.5H14M10 16l-4-4 4-4M6 12h10"/>',
    cambia:'<path d="M17 4l3 3-3 3M20 7H9a5 5 0 0 0-5 5M7 20l-3-3 3-3M4 17h11a5 5 0 0 0 5-5"/>'
  };
  var RPS = {
    rock:'<g transform="translate(-1.9 -2) scale(1.16)"><path d="M6 11V8.6a1.7 1.7 0 0 1 3.4 0V10M9.4 9.6V7.6a1.7 1.7 0 0 1 3.4 0v2M12.8 9.6V7.9a1.7 1.7 0 0 1 3.4 0V10M16.2 10V9a1.7 1.7 0 0 1 3.4 0v5a7.5 7.5 0 0 1-7.5 7.5h-.6A5.5 5.5 0 0 1 6 16V11"/><path d="M6 12.6h6.3a1.7 1.7 0 0 1 0 3.4H9.6"/></g>',
    paper:'<path d="M18 11V6a2 2 0 0 0-4 0M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>',
    scissors:'<path d="M10.4 11L7.6 3.9a1.9 1.9 0 0 1 3.6-1.3l2.2 7M13.4 9.6l1.5-6.6a1.9 1.9 0 0 1 3.7.9l-1.5 7.2"/><path d="M17.1 11.1a2 2 0 0 1 3.9.6V14a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15v-3a2 2 0 0 1 3.4-1.4M13.4 13.2h3.7"/>'
  };
  var PZ = {
    base:'<path d="M11.5 36.5h22a1.5 1.5 0 0 1 1.5 1.5v2.5H10V38a1.5 1.5 0 0 1 1.5-1.5z"/>',
    p:'<circle cx="22.5" cy="13" r="5"/><path d="M18.6 19.2h7.8M19.6 19.4c0 6.5-3.3 10.8-5.6 17.1h17c-2.3-6.3-5.6-10.6-5.6-17.1"/>',
    r:'<path d="M13 9.5h4v3.2h3.3V9.5h4.4v3.2H28V9.5h4V16l-3.2 2.8v11.4L32 34v2.5H13V34l3.2-3.8V18.8L13 16z"/><path d="M16.2 18.8h12.6M16.2 30.2h12.6"/>',
    b:'<circle cx="22.5" cy="6.8" r="2.2"/><path d="M22.5 9.2c-4.8 3.2-7.6 7.6-7.6 11.6 0 3.4 2.2 5.4 4.4 6.4h6.4c2.2-1 4.4-3 4.4-6.4 0-4-2.8-8.4-7.6-11.6z"/><path d="M25.6 14.2l-4.4 5.6"/><path d="M18.4 27.2h8.2l1 3H17.4zM17.6 30.2h9.8c.4 2.4 2.2 4.4 3.6 6.3H14c1.4-1.9 3.2-3.9 3.6-6.3z"/>',
    n:'<path d="M23.5 8.5c6.2.4 10 6.2 10 14.5 0 5.4-.8 9.6-1.6 13.5H15.5c0-4.6 1.8-7.6 4.6-10.4 1.5-1.5 1.9-3.1 1.6-4.6-1.3 1.6-3.2 2.4-5 2.6l-2.2 1.9c-1.4 1.2-3.4.1-3.2-1.7.1-1 .7-1.8 1.5-2.6l5.4-6.6c.6-2.4 2-4.3 3.6-5.3l-.6-3.4 2.8 2.1z"/><circle class="xz-pd" cx="19.8" cy="13.6" r="1.1"/>',
    q:'<circle cx="9.5" cy="12" r="2"/><circle cx="16" cy="9" r="2"/><circle cx="22.5" cy="8" r="2"/><circle cx="29" cy="9" r="2"/><circle cx="35.5" cy="12" r="2"/><path d="M10.2 14l4.4 15h15.8l4.4-15-6.4 7.2L27.6 11l-3.6 10.2-1.5-11.2-1.5 11.2L17.4 11l-.8 10.2z"/><path d="M14.6 29h15.8l1 3.6H13.6zM13.6 32.6h17.8l.6 3.9H13z"/>',
    k:'<path d="M21.1 3.5h2.8v2.9h2.9v2.8h-2.9v3.3h-2.8V9.2h-2.9V6.4h2.9z"/><path d="M22.5 14c-6.2 0-11 3.1-11 7.8 0 3.3 2 6 4 8h14c2-2 4-4.7 4-8 0-4.7-4.8-7.8-11-7.8z"/><path d="M15.5 29.8h14l1.2 3.4H14.3zM14.3 33.2h16.4l.8 3.3h-18z"/>'
  };
  function pezzo(p){ p = String(p || ''); var k = p.toLowerCase(); if (!PZ[k] || k === 'base') return '';
    return '<svg class="xz-pz ' + (p === p.toUpperCase() ? 'w' : 'b') + '" viewBox="0 0 45 45" aria-hidden="true">' + PZ[k] + PZ.base + '</svg>'; }
  XZ.pezzi = true;
  var RPS_N = { rock:['Sasso','Rock'], paper:['Carta','Paper'], scissors:['Forbice','Scissors'] };
  var SUIT = {
    '♠':'<path d="M12 1.8C10.2 4.6 7.6 6.9 5.2 9.1 3.6 10.6 2.8 12.1 2.8 13.8c0 2.6 2 4.5 4.5 4.5 1.6 0 3-.7 3.9-1.9-.3 2.3-1.2 4.1-2.8 5.6h7.2c-1.6-1.5-2.5-3.3-2.8-5.6.9 1.2 2.3 1.9 3.9 1.9 2.5 0 4.5-1.9 4.5-4.5 0-1.7-.8-3.2-2.4-4.7-2.4-2.2-5-4.5-6.8-7.3z"/>',
    '♥':'<path d="M12 21.2c-.3 0-.6-.1-.8-.3C5.9 16.3 2.6 13.2 2.6 9.1 2.6 6 5 3.6 8 3.6c1.7 0 3.1.8 4 2.1.9-1.3 2.3-2.1 4-2.1 3 0 5.4 2.4 5.4 5.5 0 4.1-3.3 7.2-8.6 11.8-.2.2-.5.3-.8.3z"/>',
    '♦':'<path d="M12 1.8c1.9 3.6 4.6 6.9 7.6 10.2-3 3.3-5.7 6.6-7.6 10.2-1.9-3.6-4.6-6.9-7.6-10.2 3-3.3 5.7-6.6 7.6-10.2z"/>',
    '♣':'<path d="M12 2.4a4.4 4.4 0 0 0-3.7 6.8 4.4 4.4 0 1 0 1.9 7.6c-.3 2-1.1 3.6-2.6 5h8.8c-1.5-1.4-2.3-3-2.6-5a4.4 4.4 0 1 0 1.9-7.6A4.4 4.4 0 0 0 12 2.4z"/>'
  };
  function seme(s){ var k = String(s || '').replace(/️/g, ''); return SUIT[k] ? '<svg class="xz-seme" viewBox="0 0 24 24" aria-hidden="true">' + SUIT[k] + '</svg>' : esc(s); }
  var FR = {
    'YOUR TURN':['Tocca a te','Your turn'], "Opponent's turn…":["Tocca all'avversario…","Opponent's turn…"],
    'PICK YOUR THROW':['Scegli la tua mossa','Pick your throw'], 'Revealing…':['Si scopre…','Revealing…'],
    'Opponent is choosing…':["L'avversario sceglie…",'Opponent is choosing…'],
    'ROUND WON':['Round vinto','Round won'], 'TIE — replay':['Pari, si rigioca','Tie, replay'], 'ROUND LOST':['Round perso','Round lost'],
    'Tap cards to KEEP, then DRAW':['Tocca le carte da tenere, poi cambia','Tap the cards to keep, then draw'],
    'You drew — waiting for opponent…':["Hai cambiato. Aspetti l'avversario…",'You drew. Waiting for opponent…'],
    'YOUR HAND':['La tua mano','Your hand'], 'KEEP':['Tieni','Keep'],
    'FIRE — your turn':['Fuoco: tocca a te','Fire: your turn'], 'enemy is taking aim…':['Il nemico prende la mira…','The enemy is taking aim…'],
    'ENEMY WATERS':['Acque nemiche','Enemy waters'], 'YOUR FLEET':['La tua flotta','Your fleet'],
    'deploy before':['Schiera entro','Deploy within'],
    'your move':['Tocca a te','Your move'], 'opponent thinking…':["L'avversario pensa…",'Opponent thinking…'],
    'STA MIRANDO…':['Sta mirando…','Taking aim…'], 'TOCCA A TE':['Tocca a te','Your turn'],
    'IN CANNA':['In canna','Loaded'], 'VERE':['Vere','Live'], 'RISCHIO':['Rischio','Risk'],
    'TRASCINA LA PISTOLA PER MIRARE':['Trascina la pistola per mirare','Drag the gun to aim'],
    'chiude il tuo turno':['chiude il tuo turno','ends your turn'],
    'ricarica da capo · passa il turno':['ricarica da capo · passa il turno','reloads · passes the turn'],
    'BUST':['Sballato','Bust'], 'YOU':['Tu','You'], 'TU':['Tu','You']
  };
  var NAVI = { Carrier:['Portaerei','Carrier'], Battleship:['Corazzata','Battleship'], Submarine:['Sottomarino','Submarine'], Destroyer:['Cacciatorpediniere','Destroyer'] };
  var EMO = /\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDD00-\uDFFF]/g;
  function chiave(t){ return String(t || '').replace(EMO, '').replace(/^[\s●•▸►✓✔⟳⏳←-⇿☀-➿️‍]+/, '').replace(/[\s▸►☀-➿️‍]+$/, '').trim(); }
  function maiuscola(k){ return k.length > 3 && k === k.toUpperCase() && /[A-ZÀ-Ý]{3}/.test(k); }
  function frase(k){ return k.charAt(0) + k.slice(1).toLowerCase(); }
  function traduciIn(m, sel){ [].forEach.call(m.querySelectorAll(sel), traduci); }
  function traduci(el){
    if (!el) return;
    var tw = D.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), n, tutti = [];
    while ((n = tw.nextNode())) tutti.push(n);
    tutti.forEach(function(n){
      var p = n.parentNode; if (!p || (p.closest && p.closest('.pvp-result,.gbf-in,.trn-ch-duel,.dlbj-timer,.ch-clk,.xz-keep'))) return;
      var t = n.nodeValue, k = chiave(t); if (!k) return;
      var lead = /^\s/.test(t) ? ' ' : '', tail = /\s$/.test(t) ? ' ' : '';
      if (FR[k]) n.nodeValue = lead + L(FR[k][0], FR[k][1]) + tail;
      else if (maiuscola(k) && !/^\d/.test(k) && k.indexOf('€') < 0) n.nodeValue = lead + frase(k) + tail;
      else if (k !== t.trim()) n.nodeValue = lead + k + tail;
    });
  }
  var NOTA = {
    rr:['al vincitore il 95%','winner takes 95%'], bs:['al vincitore il 95%','winner takes 95%'],
    ch:['patta: posta restituita','checkmate: 95% · draw: refund'],
    pkd:['vince la mano migliore · 95%','best hand wins · 95%'], bj:['al vincitore il 95%','winner takes 95%'],
    rps:['al meglio di 3 · 95%','best of 3 · 95%'], dice:['al vincitore il 95%','winner takes 95%']
  };
  function testata(k, d, potEl){
    var m = M(); if (!m) return;
    var g = G[k], sub = '';
    if (d && d.tour) sub = chiave(potEl ? potEl.textContent : L('Torneo', 'Tournament'));
    else if (d && d.pratica) sub = L('Allenamento · gratis', 'Practice · free');
    else {
      var bet = (d && (d.bet_eur != null ? d.bet_eur : d.actual_bet_eur)) || 0;
      sub = '<span>' + L('Piatto', 'Pot') + '</span> <b>' + eur(bet * 2) + '</b><i>' + L(NOTA[k][0], NOTA[k][1]) + '</i>';
    }
    var h = D.createElement('div'); h.className = 'xz-hd';
    h.innerHTML = '<span class="xz-hd-ic"><img src="gbx_pv_' + g[0] + '.webp" alt="" onerror="this.remove()"><em>' + esc(L(g[1], g[2]).charAt(0)) + '</em></span>' +
      '<span class="xz-hd-t"><b>' + esc(L(g[1], g[2])) + '</b><span class="xz-hd-s">' + sub + '</span></span>';
    m.insertBefore(h, m.firstChild);
  }
  function iniziale(nome){ var s = chiave(nome || '?'); return esc((s.charAt(0) || '?').toUpperCase()); }
  function avatar(nome, me){
    var f = ''; if (me) { try { f = (typeof dlMyPhoto === 'function') ? dlMyPhoto() : ''; } catch(e){} }
    return '<span class="xz-av">' + (f ? '<img src="' + esc(f) + '" alt="" onerror="this.remove()">' : '') + '<em>' + (me ? esc(L('T', 'Y')) : iniziale(nome)) + '</em></span>';
  }
  var SEGNI = [['rr', '.dlrr2-wrap'], ['bs', '#dlbs-wrap'], ['ch', '#ch-wrap'], ['pkd', '.dlpkd-side'], ['bj', '.dlbj-side'], ['dice', '#dl-play .dd3-slot,#dl-play .dl-dice-row']];
  function gioco(m){ for (var i = 0; i < SEGNI.length; i++) if (m.querySelector(SEGNI[i][1])) return SEGNI[i][0]; return ''; }
  function stato(){
    var m = M(), ov = OV(); if (!m || !ov) return '';
    var k = XZ.on ? gioco(m) : '';
    ov.classList.toggle('xz-on', !!k);
    SEGNI.forEach(function(s){ ov.classList.toggle('xz-g-' + s[0], s[0] === k); });
    m.classList.toggle('xz-tav', !!k);
    return k;
  }
  function cerchio(b, ic, testo, cl){
    if (!b || b.__xz) return; b.__xz = 1;
    b.classList.add('xz-act'); if (cl) b.classList.add(cl);
    b.innerHTML = '<span class="xz-c">' + sv(ic) + '</span><b>' + esc(testo) + '</b>';
  }
  function esciBtn(m){
    [].forEach.call(m.querySelectorAll('.dl-esci'), function(b){
      if (b.__xz) return; b.__xz = 1;
      b.innerHTML = sv(IC.esci, 'xz-sv xz-sv-s') + '<span>' + esc(L('Esci dalla partita', 'Leave the match')) + '</span>';
    });
  }
  function carte(m, sel, rs, ss){
    [].forEach.call(m.querySelectorAll(sel), function(c){
      if (c.classList.contains('back') || c.__xz) return; c.__xz = 1;
      c.classList.add('xz-cv');
      var s = c.querySelector(ss); if (s) s.innerHTML = seme(s.textContent);
    });
  }
  function rr(d){
    var m = M(); if (!m) return;
    testata('rr', d, m.querySelector('.dlrr2-pot'));
    [['#dlrr2-opp', d.opp_name || 'Opponent', false], ['#dlrr2-you', 'Tu', true]].forEach(function(p){
      var el = m.querySelector(p[0]); if (!el) return;
      var av = el.querySelector('.dlrr2-av'); if (av) av.innerHTML = avatar(p[1], p[2]);
    });
    var ch = m.querySelector('.dlrr2-chips'); if (ch) ch.classList.add('xz-stat');
    var sp = m.querySelector('button[onclick^="dlRrSpin"]');
    if (sp) { sp.classList.add('xz-gira'); var s1 = sp.querySelector('span'); if (s1) s1.insertAdjacentHTML('afterbegin', sv(IC.ruota, 'xz-sv xz-sv-s')); }
    esciBtn(m); traduciIn(m, '.dlrr2-wrap,#dlrr-actions,.xz-gira'); fuoco();
  }
  function fuoco(){ var t = $('dlrr-fire-t'); if (t) traduci(t); var h = $('dlrr-fire-h'); if (h) traduci(h); }
  function vite(n, full){
    n = Math.max(0, n | 0); full = Math.max(full | 0, n);
    var s = ''; for (var i = 0; i < full; i++) s += '<i class="xz-vita' + (i < n ? ' on' : '') + '"></i>';
    return '<span class="xz-vite" aria-label="' + n + '">' + s + '</span>';
  }
  function bsComuni(m){
    [].forEach.call(m.querySelectorAll('.dlbs-chip'), function(c){
      var nm = c.getAttribute('data-bs') || '';
      [].forEach.call(c.childNodes, function(n){ if (n.nodeType === 3) { var k = n.nodeValue.trim(); if (NAVI[k]) n.nodeValue = ' ' + L(NAVI[k][0], NAVI[k][1]) + ' '; } });
      if (nm && NAVI[nm]) c.setAttribute('aria-label', L(NAVI[nm][0], NAVI[nm][1]));
    });
    esciBtn(m);
  }
  function bsSchiera(d){
    var m = M(); if (!m) return;
    testata('bs', d, m.querySelector('.dlbs-pot'));
    var hint = m.querySelector('.dlbs-hint');
    if (hint) {
      var nx = null, tutte = false;
      try { tutte = DLBS.ships.length >= BS_FLEET.length; nx = tutte ? null : dlBsNext(); } catch(e){}
      if (tutte) hint.innerHTML = '<b class="xz-ok">' + esc(L('Flotta pronta: schierala', 'Fleet ready: deploy it')) + '</b>';
      else if (nx) hint.innerHTML = L('Metti la tua ', 'Place your ') + '<b>' + esc(L((NAVI[nx.name] || [nx.name])[0], nx.name)) + '</b> · ' + nx.size + ' ' + L('caselle', 'cells') +
        '<span>' + esc(L('tocca una casella o trascina una nave · toccala per girarla', 'tap a cell or drag a ship · tap it to rotate')) + '</span>';
    }
    [].forEach.call(m.querySelectorAll('.dlbs-ctrls .pvp-m-btn'), function(b){
      var oc = b.getAttribute('onclick') || '';
      if (/dlBsRotate/.test(oc)) { var h = false; try { h = !!DLBS.horiz; } catch(e){} cerchio(b, IC.ruota, h ? L('In riga', 'Rows') : L('In colonna', 'Columns')); }
      else if (/dlBsAuto/.test(oc)) cerchio(b, IC.caso, L('A caso', 'Random'));
      else if (/dlBsUndo/.test(oc)) cerchio(b, IC.annulla, L('Indietro', 'Undo'));
      else if (/dlBsReset/.test(oc)) cerchio(b, IC.dacapo, L('Da capo', 'Reset'));
    });
    var dep = m.querySelector('button[onclick^="dlBsDeploy"]');
    if (dep) { dep.classList.add('xz-bianco'); [].forEach.call(dep.childNodes, function(n){ if (n.nodeType === 3 && n.nodeValue.trim()) n.nodeValue = L('Schiera la flotta', 'Deploy fleet') + ' · '; }); }
    bsComuni(m); traduciIn(m, '.dlbs-tray,.dlbs-deadline');
  }
  function bs(d){
    var m = M(); if (!m) return;
    testata('bs', d, m.querySelector('.dlbs-pot'));
    bsComuni(m); traduciIn(m, '.dlbs-side-lbl,.dlbs-mid');
  }
  function ch(d){
    var m = M(); if (!m) return;
    testata('ch', d, m.querySelector('#ch-wrap .dlbs-pot'));
    var col = 'w'; try { col = DLCH.color; } catch(e){}
    var mio = col === 'w' ? L('bianco', 'white') : L('nero', 'black'), suo = col === 'w' ? L('nero', 'black') : L('bianco', 'white');
    var o = m.querySelector('.ch-pl.opp .ch-pl-nm'); if (o) o.innerHTML = esc(d.opp_name || 'Opponent') + ' <i>' + suo + '</i>';
    var y = m.querySelector('.ch-pl.you .ch-pl-nm'); if (y) y.innerHTML = esc(L('Tu', 'You')) + ' <i>' + mio + '</i>';
    var st = m.querySelector('.ch-status');
    if (st && !d.result) {
      st.innerHTML = d.your_turn ? '<span class="ch-turn-you">' + esc(L('Tocca a te', 'Your move')) + (d.check ? ' · <b>' + esc(L('Scacco', 'Check')) + '</b>' : '') + '</span>'
        : '<span class="ch-turn-opp">' + esc(L("L'avversario pensa…", 'Opponent thinking…')) + (d.check ? ' · ' + esc(L('scacco dato', 'check given')) : '') + '</span>';
    }
    esciBtn(m);
  }
  function pkd(d){
    var m = M(); if (!m) return;
    testata('pkd', d, m.querySelector('.dlbj-pot'));
    carte(m, '.dlpkd-card', '.dlpkd-r', '.dlpkd-s');
    var playing = (d.status !== 'done' && d.state !== 'done');
    var on = m.querySelector('.dlpkd-side.opp .dlpkd-nm');
    if (on) {
      var x = '';
      if (d.opp_drawn) x = '<span class="xz-ok">' + esc(L('ha cambiato', 'drew')) + '</span>';
      else if (playing) x = esc(L('ci pensa…', 'thinking…'));
      var rk = on.querySelector('b'); var rkt = rk ? rk.outerHTML : '';
      on.innerHTML = '<span class="xz-nm">' + esc(d.opp_name || 'Opponent') + '</span>' + (x ? ' · ' + x : '') + (rkt ? ' · ' + rkt : '');
    }
    [].forEach.call(m.querySelectorAll('.dlpkd-keep'), function(k){ k.textContent = L('Tieni', 'Keep'); });
    var dr = m.querySelector('button[onclick^="dlPkdDraw"]');
    if (dr) { dr.classList.add('xz-bianco'); dr.innerHTML = sv(IC.cambia, 'xz-sv xz-sv-s') + '<span>' + esc(L('Cambia le carte', 'Draw')) + '</span>'; }
    esciBtn(m); traduciIn(m, '.dlpkd-mid,.dlpkd-side');
  }
  function bj(d){
    var m = M(); if (!m) return;
    testata('bj', d, m.querySelector('.dlbj-pot'));
    carte(m, '.dlbj-cards .card', '.card-r', '.card-s');
    var nm = m.querySelector('.dlbj-side.opp .dlbj-name');
    if (nm) nm.innerHTML = '<span class="xz-nm">' + esc(d.opp_name || 'Opponent') + '</span>' + ((d.opp || {}).hidden ? ' · ' + esc(L('carte coperte', 'cards hidden')) : '');
    var yn = m.querySelector('.dlbj-side.you .dlbj-name'); if (yn) yn.innerHTML = '<span class="xz-nm">' + esc(L('Tu', 'You')) + '</span>';
    var a = $('dlbj-actions');
    if (a) {
      a.classList.add('xz-acts');
      [].forEach.call(a.querySelectorAll('button[onclick^="dlBjAction"]'), function(b){
        var k = (/'(\w+)'/.exec(b.getAttribute('onclick') || '') || [])[1];
        var t = { hit:L('Carta', 'Hit'), stand:L('Stai', 'Stand'), double:L('Raddoppia', 'Double'), split:L('Dividi', 'Split') }[k];
        if (t) cerchio(b, IC[k], t, 'xz-a-' + k);
      });
    }
    esciBtn(m); traduciIn(m, '.dlbj-mid,.dlbj-side');
  }
  function rps(d){
    var m = M(); if (!m) return;
    testata('rps', d, m.querySelector('.dlbj-pot'));
    var sc = m.querySelector('.dlrps-score');
    if (sc) sc.innerHTML = '<span class="xz-sc you"><i>' + esc(L('Tu', 'You')) + '</i><b>' + (d.you_score || 0) + '</b></span><span class="xz-sc-sep"></span>' +
      '<span class="xz-sc opp"><b>' + (d.opp_score || 0) + '</b><i>' + esc(d.opp_name || 'Opp') + '</i></span>';
    var lr = d.last_round;
    if (lr) {
      var th = m.querySelectorAll('.dlrps-throw');
      var chiaveR = [d.you_score, d.opp_score, lr.you, lr.opp, lr.result, d.tour_gara || 0].join('|'), nuovo = chiaveR !== XZ.ultimoRound;
      XZ.ultimoRound = chiaveR;
      function mano(v){ return RPS[v] ? '<span class="xz-m">' + sv(RPS[v], 'xz-sv xz-rps') + '</span>' : '<span class="xz-vuoto">' + esc(L('niente', 'none')) + '</span>'; }
      var rt = m.querySelector('.dlrps-rt'); if (rt) { rt.removeAttribute('style'); rt.classList.add('xz-r-' + (lr.result || '')); }
      if (!nuovo || fermo()) [lr.you, lr.opp].forEach(function(v, i){ if (th[i]) th[i].innerHTML = mano(v); });
      else {
        if (rt) rt.classList.add('xz-dopo');
        [0, 1].forEach(function(i){ if (th[i]) { th[i].classList.add('xz-conta'); th[i].innerHTML = '<span class="xz-m">' + sv(RPS.rock, 'xz-sv xz-rps') + '</span>'; } });
        setTimeout(function(){
          [lr.you, lr.opp].forEach(function(v, i){ var t = th[i]; if (!t || !t.isConnected) return; t.classList.remove('xz-conta'); t.classList.add('xz-pop'); t.innerHTML = mano(v); });
          if (rt && rt.isConnected) rt.classList.remove('xz-dopo');
          hap(lr.result === 'win' ? 'success' : lr.result === 'lose' ? 'error' : 'warning');
        }, 640);
      }
    }
    [].forEach.call(m.querySelectorAll('.dlrps-ch'), function(b){
      var k = (/'(\w+)'/.exec(b.getAttribute('onclick') || '') || [])[1]; if (!RPS[k] || b.__xz) return; b.__xz = 1;
      b.innerHTML = '<span class="xz-c">' + sv(RPS[k], 'xz-sv xz-rps') + '</span><b>' + esc(L(RPS_N[k][0], RPS_N[k][1])) + '</b>';
    });
    var mid = m.querySelector('.dlrps-mid');
    if (mid && d.your_pick) {
      var t = mid.querySelector('.dlbj-turn-opp');
      if (t) t.innerHTML = esc(L('Hai scelto', 'You picked')) + ' ' + (RPS[d.your_pick] ? sv(RPS[d.your_pick], 'xz-sv xz-sv-s xz-rps') : '') + ' <span>' +
        esc(d.opp_locked ? L("l'avversario è pronto…", 'opponent ready…') : L("aspetti l'avversario…", 'waiting for opponent…')) + '</span>';
    }
    esciBtn(m); traduciIn(m, '.dlrps-reveal,.dlrps-mid,.dlrps-waiting');
  }
  var FACCE = '⚀⚁⚂⚃⚄⚅';
  function dadoF(el){ var f = FACCE.indexOf((el.textContent || '').trim()); el.setAttribute('data-f', f >= 0 ? f + 1 : ''); }
  function dice(d){
    var m = M(); if (!m) return;
    var det = d.detail || {}; if ((det.mode || d.mode) !== 'dice') return;
    testata('dice', d, null);
    var you = d.you_p1, opp = you ? d.p2_name : d.p1_name;
    var f = m.querySelectorAll('.pvp-vs .pvp-fighter');
    if (f[0]) { var a0 = f[0].querySelector('.pvp-fighter-av'); if (a0) a0.innerHTML = avatar('Tu', true); }
    if (f[1]) { var a1 = f[1].querySelector('.pvp-fighter-av'); if (a1) a1.innerHTML = avatar(opp, false); }
    var leg = m.querySelector('.dd3-leg');
    if (leg) leg.innerHTML = '<span class="xz-leg tu"><i></i>' + esc(L('Tu', 'You')) + '</span><span class="xz-leg lui"><i></i>' + esc(chiave(opp || '')) + '</span>';
    [].forEach.call(m.querySelectorAll('.dl-die'), function(el){
      dadoF(el);
      try { new MutationObserver(function(){ dadoF(el); }).observe(el, { childList:true, characterData:true, subtree:true }); } catch(e){}
    });
    traduci(m.querySelector('.pvp-vs')); traduci(m.querySelector('.dl-dice-lbl'));
  }
  var FATTI = {};
  function avvolgi(nome, k, dopo){
    var o = W[nome]; if (typeof o !== 'function' || o.__xz) return false;
    var f = function(){
      var r = o.apply(this, arguments);
      if (XZ.on) { try { if (stato()) { XZ.n++; dopo.apply(null, arguments); } } catch(e){ try { console.warn('XZ ' + nome, e); } catch(_){} } }
      return r;
    };
    f.__xz = true; f.__xzO = o;
    try { W[nome] = f; FATTI[nome] = 1; } catch(e){ return false; }
    return true;
  }
  function monta(){
    var m = M(); if (!m) return false;
    avvolgi('dlRrBoard', 'rr', function(d){ rr(d || {}); });
    avvolgi('dlBsPlacement', 'bs', function(d){ bsSchiera(d || {}); });
    avvolgi('dlBsBoard', 'bs', function(d){ bs(d || {}); });
    avvolgi('dlChBoard', 'ch', function(d){ ch(d || {}); });
    avvolgi('dlPkdBoard', 'pkd', function(d){ pkd(d || {}); });
    avvolgi('dlBjBoard', 'bj', function(d){ bj(d || {}); });
    avvolgi('dlReveal', 'dice', function(d){ dice(d || {}); });
    var vh = W.dlRrHearts;
    if (typeof vh === 'function' && !vh.__xz) { var nv = function(n, full){ return XZ.on ? vite(n, full) : vh.apply(this, arguments); }; nv.__xz = true; try { W.dlRrHearts = nv; } catch(e){} }
    var pp = W.dlBsShipPips;
    if (typeof pp === 'function' && !pp.__xz) { var np = function(n){ if (!XZ.on) return pp.apply(this, arguments); var s = ''; for (var i = 0; i < (n || 0); i++) s += '<i></i>'; return '<span class="xz-flotta">' + (s || '<em>0</em>') + '</span>'; }; np.__xz = true; try { W.dlBsShipPips = np; } catch(e){} }
    var si = W.dlBsShipIcon;
    if (typeof si === 'function' && !si.__xz) { var ns = function(sz){ if (!XZ.on) return si.apply(this, arguments); var s = ''; for (var i = 0; i < (sz || 0); i++) s += '<i></i>'; return '<span class="xz-scafo">' + s + '</span>'; }; ns.__xz = true; try { W.dlBsShipIcon = ns; } catch(e){} }
    var cp = W.chPezzo;
    if (typeof cp === 'function' && !cp.__xz) { var npz = function(p){ return (XZ.on && XZ.pezzi && p && p !== '.') ? (pezzo(p) || cp.apply(this, arguments)) : cp.apply(this, arguments); }; npz.__xz = true; try { W.chPezzo = npz; } catch(e){} }
    var cs = W.dlChCapStrip;
    if (typeof cs === 'function' && !cs.__xz) { var ncs = function(list, edge){ if (!(XZ.on && XZ.pezzi)) return cs.apply(this, arguments);
      var g = (list || []).map(function(k){ return '<span class="ch-cap-pc xz-cap">' + pezzo(k) + '</span>'; }).join('');
      return g + (edge > 0 ? '<span class="ch-cap-edge xz-cap-n">+' + edge + '</span>' : ''); }; ncs.__xz = true; try { W.dlChCapStrip = ncs; } catch(e){} }
    var ta = W.dlRrTastoAggiorna;
    if (typeof ta === 'function' && !ta.__xz) { var nt = function(){ var r = ta.apply(this, arguments); if (XZ.on) { try { fuoco(); } catch(e){} } return r; }; nt.__xz = true; try { W.dlRrTastoAggiorna = nt; } catch(e){} }
    if (!m.__xz) {
      m.__xz = 1;
      try { new MutationObserver(function(){ stato(); }).observe(m, { childList:true }); } catch(e){}
      m.addEventListener('pointerdown', function(e){
        if (!XZ.on || !e.target.closest) return;
        if (e.target.closest('.ch-sq')) hap('sel');
        else if (e.target.closest('.dlbs-cell.aim,.dlpkd-card.tog,.xz-act,.dlbs-cell')) hap('light');
        else if (e.target.closest('.dlrr-fire:not([disabled]),.xz-bianco')) hap('medium');
      }, { passive:true });
    }
    return true;
  }
  function fermo(){ try { return (W.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) || (W.GBX && GBX.lite && GBX.lite()); } catch(e){ return false; } }
  XZ.stato = stato; XZ.vite = vite; XZ.fatti = FATTI;
  function prova(n){ if (monta() && W.dlRrBoard && W.dlRrBoard.__xz) return; if (n < 40) setTimeout(function(){ prova(n + 1); }, 250); }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', function(){ prova(0); }); else prova(0);
})();
;
(function(){
  'use strict';
  if (window.XE) return;
  var XE = window.XE = { v:'1511', ultima:{} };
  var L = function(it, en){ return (window.GB_LANG === 'en') ? en : it; };
  var hap = function(t){ try { GBX.hap(t); } catch(e){} };
  var fx = function(n){ try { GBX.fx(n); } catch(e){} };
  var lite = function(){ try { return GBX.lite(); } catch(e){ return false; } };
  var TIPI = [
    { k:'glad', m:'#glad-edit-cv', g:['Colosseo','Colosseum'], t:['Il tuo gladiatore','Your gladiator'], cats:[
      ['elmo','Elmo','Helmet',['helm','helmCol']], ['arm','Armatura','Armour',['armor','armorCol']],
      ['mant','Mantello','Cape',['cape','capeCol']], ['scudo','Scudo','Shield',['shieldCol','emblem']],
      ['spada','Spada','Sword',['sword']], ['pelle','Pelle','Skin',['skin']] ] },
    { k:'gcr', m:'#gcr-ed-box', g:['Gambler City','Gambler City'], t:['Il tuo mafioso','Your mobster'], d3:'gcr', cats:[
      ['fig','Figura','Figure',['ar','skin']], ['abito','Abito','Outfit',['ab','suit']], ['capp','Cappello','Hat',['hat','hatCol']],
      ['extra','Extra','Extras',['acc','fa']], ['auto','Auto','Car',['au']], ['firma','Firma','Signature',['ins','mo']],
      ['set','Set','Sets',['set']] ] },
    { k:'twr1', m:'#twr-edit-cv', g:['Gambler City','Gambler City'], t:['Il tuo gangster','Your gangster'], cats:[
      ['abito','Abito','Suit',['suit']], ['capp','Cappello','Hat',['hat','hatCol']], ['pelle','Pelle','Skin',['skin']], ['extra','Extra','Extras',['acc']] ] },
    { k:'race', m:'#rc-ed-cv', g:['Street Race','Street Race'], t:['La tua auto','Your car'], cats:[
      ['car','Carrozzeria','Body',['shape','spoiler']], ['vern','Vernice','Paint',['col','col2']], ['ades','Adesivi','Decals',['decal']],
      ['ruote','Ruote','Wheels',['wheel']], ['luci','Luci','Lights',['neon','trail']] ] },
    { k:'derby', m:'#db-ed-cv', g:['Derby','Derby'], t:['Il tuo calciatore','Your player'], d3:'derby', cats:[
      ['viso','Viso','Face',['sk','fc']], ['testa','Testa','Head',['hr','hc','hd']], ['divisa','Divisa','Kit',['pt','sl','tr','nm']],
      ['scarpe','Scarpe','Boots',['bt','sg']], ['gol','Esultanza','Celebration',['ce','au']], ['set','Set','Sets',['set']] ] },
    { k:'dpk', m:'#dpk-ed-cv', g:['Dead Peak','Dead Peak'], t:['Il tuo scalatore','Your climber'], cats:[
      ['col','Colore','Colour',['co','fi']], ['testa','Testa','Head',['ca','ol','oc']], ['corpo','Corpo','Body',['de']],
      ['eff','Effetti','Effects',['sc','mo','ri']], ['vetta','Vetta','Summit',['em']], ['set','Set','Sets',['set']] ] },
    { k:'dp1', m:'#dp-ed-cv', g:['Dead Peak','Dead Peak'], t:['Il tuo scalatore','Your climber'], cats:[
      ['col','Colore','Colour',['ci']], ['testa','Testa','Head',['hm','hr','gg','bd']], ['corpo','Corpo','Body',['st','hb','bp']], ['mani','Mani e piedi','Hands & feet',['gl','bo']],
      ['stile','Stile','Style',['ax','rim']], ['set','Set','Sets',['set']] ] }
  ];
  var MODALI = ['gld-modal', 'tw-modal', 'arc-modal'];
  var MAIU = /\b(GT|SUV|F1|KO|TNT|VIP|MVP|UFO|DJ|BTC|TON)\b/;
  function tipoDi(m){
    for (var i = 0; i < TIPI.length; i++) if (m.querySelector(TIPI[i].m)) return TIPI[i];
    return null;
  }
  function soloTesto(el){
    var s = '';
    for (var n = el.firstChild; n; n = n.nextSibling) if (n.nodeType === 3) s += n.nodeValue;
    return s;
  }
  function frase(s){
    s = String(s || '').replace(/^[^A-Za-zÀ-ÿ0-9]+/, '').replace(/\s+/g, ' ').trim();
    if (!s) return '';
    if (s === s.toUpperCase()) {
      s = s.toLowerCase().replace(/\b(gt|suv|f1|ko|tnt|vip|mvp|ufo|dj|btc|ton)\b/g, function(x){ return x.toUpperCase(); });
    }
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function chiave(row){
    if (row.classList.contains('db-sk-grid')) return 'set';
    var f = row.getAttribute('data-f') || row.getAttribute('data-g');
    if (f) return f;
    var m = (row.id || '').match(/-row-(\w+)$/);
    return m ? m[1] : '';
  }
  function etichetta(row){
    var fld = row.closest('.dp-field'); if (fld) return fld.querySelector('.dp-field-h');
    var p = row.previousElementSibling;
    if (p && (p.classList.contains('twr-edit-lbl') || p.classList.contains('rc-ed-h') || p.classList.contains('xe-lbl'))) return p;
    return null;
  }
  function testoEtichetta(lb){
    if (!lb) return '';
    var nm = lb.querySelector('.dp-field-nm');
    return nm ? nm.textContent : soloTesto(lb);
  }
  var SVG_X = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>';
  function palcoDi(m, T){
    if (T.k === 'glad' || T.k === 'twr1') {
      var cv = m.querySelector(T.m); if (!cv) return null;
      if (cv.parentNode.classList && cv.parentNode.classList.contains('xe-stage')) return cv.parentNode;
      var w = document.createElement('div'); w.className = 'xe-stage xe-st2d';
      cv.parentNode.insertBefore(w, cv); w.appendChild(cv);
      return w;
    }
    if (T.k === 'gcr') return m.querySelector('#gcr-ed-box');
    var c = m.querySelector(T.m);
    return c ? c.closest('.rc-ed-stage') || c.parentNode : null;
  }
  function vesti(m, T){
    var ov = m.parentNode;
    var st = m.__xe || (m.__xe = {});
    if (st.T !== T || !m.querySelector(':scope > .xe-top')) { st.T = T; st.cur = XE.ultima[T.k] || ''; st.scelta = !!XE.ultima[T.k]; }
    m.classList.add('xe-ed'); m.setAttribute('data-xe', T.k);
    if (ov) { ov.classList.add('xe-ov'); }
    var palco = palcoDi(m, T); if (!palco) return;
    palco.classList.add('xe-stage');
    if (!palco.querySelector(':scope > .xe-floor') && (T.k === 'glad' || T.k === 'twr1' || T.k === 'gcr')) {
      var fl = document.createElement('i'); fl.className = 'xe-floor'; palco.insertBefore(fl, palco.firstChild);
    }
    if (T.d3 && !palco.querySelector(':scope > .xe-gira')) {
      var gi = document.createElement('div'); gi.className = 'xe-gira';
      gi.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span></span>';
      palco.appendChild(gi);
    }
    var gis = palco.querySelector(':scope > .xe-gira span'); if (gis) { var tg = L('Trascina per girare', 'Drag to turn'); if (gis.textContent !== tg) gis.textContent = tg; }
    var top = m.querySelector(':scope > .xe-top');
    if (!top) {
      top = document.createElement('div'); top.className = 'xe-top';
      top.innerHTML = '<div class="xe-tt"><div class="xe-k"></div><div class="xe-t"></div></div><div class="xe-tx"></div>';
      m.insertBefore(top, m.firstChild);
    }
    var k = top.querySelector('.xe-k'), t = top.querySelector('.xe-t');
    if (k.textContent !== L(T.g[0], T.g[1])) k.textContent = L(T.g[0], T.g[1]);
    if (t.textContent !== L(T.t[0], T.t[1])) t.textContent = L(T.t[0], T.t[1]);
    var seg = m.querySelector(':scope > .xe-seg');
    if (!seg) { seg = document.createElement('div'); seg.className = 'xe-seg'; seg.setAttribute('role', 'tablist'); seg.innerHTML = '<i class="xe-ind"></i>'; }
    var sc = m.querySelector(':scope > .xe-scroll');
    if (!sc) { sc = document.createElement('div'); sc.className = 'xe-scroll x-nosfx'; }
    var note = sc.querySelector(':scope > .xe-note');
    if (!note) { note = document.createElement('div'); note.className = 'xe-note'; sc.appendChild(note); }
    var bar = m.querySelector(':scope > .xe-bar');
    if (!bar) { bar = document.createElement('div'); bar.className = 'xe-bar'; }
    if (palco.parentNode === m) {
      if (top.nextElementSibling !== palco) {
        var prima = [];
        for (var n = top.nextElementSibling; n && n !== palco; n = n.nextElementSibling) prima.push(n);
        prima.forEach(function(el){ smista(el, m, palco, sc, note, bar, T); });
      }
      if (palco.nextElementSibling !== seg) m.insertBefore(seg, palco.nextSibling);
      if (seg.nextElementSibling !== sc) m.insertBefore(sc, seg.nextSibling);
      var dopo = [];
      for (var d = sc.nextElementSibling; d; d = d.nextElementSibling) if (d !== bar) dopo.push(d);
      dopo.forEach(function(el){ smista(el, m, palco, sc, note, bar, T); });
      if (bar.parentNode !== m || bar.nextElementSibling) m.appendChild(bar);
    }
    if (note.nextElementSibling) sc.appendChild(note);
    var salva = bar.querySelector('.xe-salva');
    if (salva) { var ts = L('Salva', 'Save'); if (salva.textContent !== ts) salva.textContent = ts; }
    if (!bar.firstElementChild) bar.classList.add('xe-vuota'); else bar.classList.remove('xe-vuota');
    var rev = palco.querySelector('.rc-ed-rev');
    if (rev && !rev.__xe) { rev.__xe = 1; rev.textContent = 'Boost'; }
    if (T.k === 'race') fondoGara();
    if (T.k === 'dpk') fondoScalata();
    if (T.k === 'glad' || T.k === 'twr1') telaNitida(m, T);
    tagga(m, T, seg, sc);
    if (T.d3) avvia3d();
  }
  function smista(el, m, palco, sc, note, bar, T){
    if (el.classList.contains('xe-top') || el.classList.contains('xe-seg') || el.classList.contains('xe-scroll') || el.classList.contains('xe-bar')) return;
    if (el.matches('.tw-duel-t, .pvp-m-title')) { el.classList.add('xe-via'); sc.insertBefore(el, sc.firstChild); return; }
    if (el.matches('.twr-optrow[data-f="tm"]')) { el.classList.add('xe-tm'); palco.appendChild(el); return; }
    if (el.matches('.rc-ed-note, #gcr-ed-badge')) { note.appendChild(el); return; }
    var bt = el.matches('button') ? [el] : [].slice.call(el.querySelectorAll(':scope > button'));
    var resto = false;
    if (el.matches('.tw-ov-btns') || el.matches('button.action-btn')) {
      bt.forEach(function(b){ tasto(b, m, bar); });
      if (el.matches('.tw-ov-btns')) { el.classList.add('xe-via'); sc.insertBefore(el, note); }
      return;
    }
    if (!resto) sc.insertBefore(el, note);
  }
  function tasto(b, m, bar){
    var oc = b.getAttribute('onclick') || '';
    if (/(Save|Salva)\s*\(/.test(oc)) { b.classList.add('xe-salva'); bar.appendChild(b); return; }
    if (/(Close|Chiudi)\s*\(/.test(oc)) {
      b.classList.add('xe-chiudi'); b.setAttribute('aria-label', L('Chiudi', 'Close')); b.innerHTML = SVG_X;
      var tx = m.querySelector(':scope > .xe-top .xe-tx'); if (tx) tx.appendChild(b); return;
    }
    bar.appendChild(b);
  }
  function tagga(m, T, seg, sc){
    var st = m.__xe, mappa = {}, nomi = {}, ordine = [];
    T.cats.forEach(function(c){ c[3].forEach(function(f){ mappa[f] = c[0]; }); nomi[c[0]] = L(c[1], c[2]); });
    var prec = null, presenti = [];
    [].forEach.call(sc.querySelectorAll('.twr-optrow, .twr-swrow, .db-sk-grid'), function(row){
      if (row.getAttribute('data-f') === 'tm' || row.closest('.xe-tm')) return;
      var f = chiave(row), c = mappa[f], lb = etichetta(row), tl = testoEtichetta(lb);
      if (!c) {
        if (/^\W*(COLORE|COLOUR|COLOR)\b/i.test(tl) && prec) c = prec;
        else { c = 'g_' + (f || tl); nomi[c] = frase(tl).split(/\s+[—-]\s+/)[0] || '·'; }
      }
      var blocco = row.closest('.dp-field') || row;
      if (blocco.getAttribute('data-xe-c') !== c) blocco.setAttribute('data-xe-c', c);
      row.classList.add('xe-row'); if (blocco !== row) blocco.classList.add('xe-row');
      if (lb) {
        lb.classList.add('xe-lbl');
        if (!lb.closest('.dp-field') && lb.getAttribute('data-xe-c') !== c) lb.setAttribute('data-xe-c', c);
        var ln = lb.querySelector(':scope > .xe-ln');
        if (!ln) { ln = document.createElement('span'); ln.className = 'xe-ln'; lb.appendChild(ln); var vv = document.createElement('span'); vv.className = 'xe-val'; lb.appendChild(vv); }
        var fr = frase(tl); if (ln.textContent !== fr) ln.textContent = fr;
        lb.__xeRow = row;
      }
      [].forEach.call(row.querySelectorAll('.twr-opt'), function(b){ if (!b.__xm) { b.__xm = 1; if (MAIU.test(b.textContent)) b.classList.add('xe-mai'); } });
      prec = c; if (presenti.indexOf(c) < 0) presenti.push(c);
    });
    T.cats.forEach(function(c){ if (presenti.indexOf(c[0]) >= 0) ordine.push(c[0]); });
    presenti.forEach(function(c){ if (ordine.indexOf(c) < 0) ordine.push(c); });
    var firma = ordine.map(function(c){ return c + ':' + nomi[c]; }).join('|');
    if (firma !== seg.__firma) {
      seg.__firma = firma;
      [].slice.call(seg.querySelectorAll('button')).forEach(function(b){ b.remove(); });
      ordine.forEach(function(c){
        var b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('data-c', c); b.setAttribute('data-x-silent', '');
        b.textContent = nomi[c]; seg.appendChild(b);
      });
      seg.classList.toggle('xe-sola', ordine.length < 2);
      if (!st.scelta) st.cur = ordine[0] || '';
    }
    if (ordine.indexOf(st.cur) < 0) st.cur = ordine[0] || '';
    var lunga = seg.scrollWidth > seg.clientWidth + 2;
    if (seg.classList.contains('xe-lunga') !== lunga) seg.classList.toggle('xe-lunga', lunga);
    mostra(m, st.cur, false);
    valori(m);
  }
  function mostra(m, c, anima){
    var st = m.__xe; if (!st) return;
    var cambia = st.cur !== c; st.cur = c; if (st.T && anima) { XE.ultima[st.T.k] = c; st.scelta = true; }
    [].forEach.call(m.querySelectorAll('[data-xe-c]'), function(el){
      var on = el.getAttribute('data-xe-c') === c;
      if (el.classList.contains('xe-off') === on) el.classList.toggle('xe-off', !on);
      if (on && anima && !lite()) { el.classList.remove('xe-in'); void el.offsetWidth; el.classList.add('xe-in'); }
    });
    var seg = m.querySelector(':scope > .xe-seg'); if (!seg) return;
    var on = null;
    [].forEach.call(seg.querySelectorAll('button'), function(b){
      var s = b.getAttribute('data-c') === c; if (s) on = b;
      if (b.classList.contains('on') !== s) b.classList.toggle('on', s);
      b.setAttribute('aria-selected', s ? 'true' : 'false');
    });
    var ind = seg.querySelector('.xe-ind');
    if (ind && on) {
      var x = on.offsetLeft, w = on.offsetWidth;
      if (!anima) ind.style.transition = 'none';
      ind.style.width = w + 'px'; ind.style.transform = 'translateX(' + x + 'px)';
      if (!anima) { void ind.offsetWidth; ind.style.transition = ''; }
      var l = x - (seg.clientWidth - w) / 2;
      if (anima && seg.scrollWidth > seg.clientWidth) { try { seg.scrollTo({ left: l, behavior: 'smooth' }); } catch(e){ seg.scrollLeft = l; } }
      else if (seg.scrollWidth > seg.clientWidth) seg.scrollLeft = l;
    }
    if (anima && cambia) { var sc = m.querySelector(':scope > .xe-scroll'); if (sc) sc.scrollTop = 0; }
  }
  function valori(m){
    [].forEach.call(m.querySelectorAll('.xe-lbl'), function(lb){
      var row = lb.__xeRow, v = lb.querySelector(':scope > .xe-val'); if (!row || !v) return;
      var s = '', col = '';
      if (row.getAttribute('data-f') === 'nm') { var nm = document.getElementById('db-nm'); s = nm ? nm.textContent : ''; }
      else {
        var sel = row.querySelector('.sel');
        if (sel) {
          if (sel.classList.contains('twr-sw')) { s = sel.getAttribute('title') || ''; col = sel.style.background || sel.style.backgroundColor || ''; }
          else s = frase(sel.textContent.replace(/[★✓]/g, ''));
          if (sel.classList.contains('xe-mai')) s = sel.textContent.replace(/[★✓]/g, '').trim();
        }
      }
      var h = (col ? '<i style="background:' + col.replace(/"/g, '') + '"></i>' : '') + (s ? '<b></b>' : '');
      if (v.__h !== h + s) { v.__h = h + s; v.innerHTML = h; var bb = v.querySelector('b'); if (bb) bb.textContent = s; }
    });
  }
  function telaNitida(m, T){
    var cv = m.querySelector(T.m); if (!cv || cv.__xe) return;
    cv.__xe = 1;
    try {
      var k = Math.min(3, Math.max(2, Math.round(window.devicePixelRatio || 2)));
      var z = T.k === 'glad' ? 1.45 : 1.15, cx = 75, cy = T.k === 'glad' ? 86 : 80;
      cv.width = 150 * k; cv.height = 150 * k;
      cv.getContext('2d').setTransform(k * z, 0, 0, k * z, k * cx * (1 - z), k * cy * (1 - z));
    } catch(e){}
  }
  function fondoGara(){
    try {
      if (typeof RC_ED === 'undefined' || !RC_ED || RC_ED.bgCv && RC_ED.bgCv.__xe) return;
      var cv = document.getElementById('rc-ed-cv'); if (!cv) return;
      var W = cv.width, H = cv.height, b = document.createElement('canvas'); b.width = W; b.height = H; b.__xe = 1;
      var c = b.getContext('2d');
      c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
      var g = c.createRadialGradient(W / 2, H * 0.42, 4, W / 2, H * 0.42, W * 0.62);
      g.addColorStop(0, 'rgba(58,58,64,.85)'); g.addColorStop(0.45, 'rgba(26,26,30,.7)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      var p = c.createLinearGradient(0, H * 0.5, 0, H);
      p.addColorStop(0, 'rgba(255,255,255,0)'); p.addColorStop(0.08, 'rgba(255,255,255,.05)'); p.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = p; c.fillRect(0, H * 0.5, W, H * 0.5);
      c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(0, Math.round(H * 0.5), W, 1);
      var k2 = document.createElement('canvas'); k2.width = W; k2.height = H;
      RC_ED.skCv = k2; RC_ED.bgCv = b;
    } catch(e){}
  }
  function fondoScalata(){
    try {
      var cv = document.getElementById('dpk-ed-cv'); if (!cv) return;
      var c = cv.getContext('2d'); if (!c || c.__xe) return; c.__xe = 1;
      var W = cv.width, H = cv.height, fr = c.fillRect;
      var bg = c.createRadialGradient(W * 0.5, H * 0.5, 6, W * 0.5, H * 0.5, W * 0.62);
      bg.addColorStop(0, '#26262b'); bg.addColorStop(0.5, '#0e0e11'); bg.addColorStop(1, '#000');
      var pv = c.createLinearGradient(0, H * 0.84, 0, H);
      pv.addColorStop(0, '#1d1d20'); pv.addColorStop(1, '#050506');
      c.fillRect = function(x, y, w, h){
        if (x === 0 && w === W) {
          var nuovo = null;
          if (y === 0 && h === H) nuovo = bg;
          else if (Math.abs(y - H * 0.84) < 0.5) nuovo = (h <= 5) ? 'rgba(255,255,255,.12)' : pv;
          if (nuovo) { var s = this.fillStyle; this.fillStyle = nuovo; fr.call(this, x, y, w, h); this.fillStyle = s; return; }
        }
        return fr.call(this, x, y, w, h);
      };
      var z = 1.3, px = W * 0.48, py = H * 0.84;
      c.setTransform(z, 0, 0, z, px * (1 - z), py * (1 - z));
    } catch(e){}
  }
  var V3 = { tim:null };
  function vet3d(){
    try { if (typeof GCR_VET !== 'undefined' && GCR_VET && GCR_VET.ok && GCR_VET.fr && GCR_VET.g) return { fr:GCR_VET.fr, g:GCR_VET.g, k:'gcr' }; } catch(e){}
    try { if (typeof DB3 !== 'undefined' && DB3 && DB3.ok && DB3.fr && DB3.g) return { fr:DB3.fr, g:DB3.g, k:'derby' }; } catch(e){}
    return null;
  }
  function avvia3d(){
    if (V3.tim) return;
    V3.tim = setInterval(function(){
      var aperto = false;
      MODALI.forEach(function(id){ var m = document.getElementById(id); if (m && m.classList.contains('xe-ed') && m.parentNode && m.parentNode.classList.contains('show')) aperto = true; });
      if (!aperto) { clearInterval(V3.tim); V3.tim = null; return; }
      var v = vet3d();
      [].forEach.call(document.querySelectorAll('.xe-stage > .xe-gira'), function(gi){
        var su = !!(v && v.g.vetrina && !v.g.vetrina.toccata && gi.parentNode.contains(v.fr));
        if (gi.classList.contains('on') !== su) gi.classList.toggle('on', su);
      });
      if (v && !v.fr.__xe) ritocca(v);
    }, 250);
  }
  function ritocca(v){
    v.fr.__xe = 1;
    var w = null; try { w = v.fr.contentWindow; } catch(e){ return; }
    if (!w) return;
    var r = null; try { r = v.k === 'gcr' ? (w.G3 && w.G3.renderer) : (w.D3 && w.D3.renderer); } catch(e){}
    if (!r) return;
    try { r.setClearColor('#000000', 1); } catch(e){}
    try {
      var r0 = r.render;
      r.render = function(sc, cam){
        try {
          if (sc && !sc.__xe) {
            sc.__xe = 1;
            sc.traverse(function(o){
              var mt = o.material; if (!mt) return;
              if (o.name === 'vetrina_pavimento' && mt.uniforms && mt.uniforms.uPozza) { mt.uniforms.uPozza.value.set(0.135, 0.135, 0.145); mt.uniforms.uOrlo.value.set(0, 0, 0); }
              else if (v.k === 'derby' && o.isMesh && mt.color && mt.color.getHex && mt.color.getHex() === 0x12301c) mt.color.setHex(0x0d0d0f);
            });
          }
        } catch(e){}
        return r0.apply(this, arguments);
      };
    } catch(e){}
    try {
      var cv = r.domElement, vet = v.g.vetrina, I = { v:0, lx:0, lt:0, giu:false, raf:0 };
      var ferma = function(){ if (I.raf) { try { w.cancelAnimationFrame(I.raf); } catch(e){} I.raf = 0; } };
      cv.addEventListener('pointerdown', function(e){ I.giu = true; I.v = 0; I.lx = e.clientX; I.lt = performance.now(); ferma(); hap('light'); }, { passive:true });
      cv.addEventListener('pointermove', function(e){
        if (!I.giu) return;
        var n = performance.now(), dt = Math.max(1, n - I.lt), vv = (e.clientX - I.lx) / dt;
        I.v = I.v * 0.5 + vv * 0.5; I.lx = e.clientX; I.lt = n;
      }, { passive:true });
      var su = function(){
        if (!I.giu) return; I.giu = false;
        if (performance.now() - I.lt > 90) I.v = 0;
        I.v = Math.max(-3, Math.min(3, I.v)) * 0.3;
        if (Math.abs(I.v) < 0.02 || lite()) return;
        var t0 = performance.now();
        var passo = function(n){
          var dt = Math.min(48, Math.max(0, n - t0)); t0 = n;
          I.v *= Math.exp(-dt / 280);
          if (Math.abs(I.v) < 0.004 || !v.fr.isConnected || !vet.attiva || !vet.attiva()) { I.raf = 0; return; }
          try { vet.gira(-I.v * dt * 0.011); } catch(e){ I.raf = 0; return; }
          I.raf = w.requestAnimationFrame(passo);
        };
        I.raf = w.requestAnimationFrame(passo);
      };
      ['pointerup', 'pointercancel'].forEach(function(ev){ cv.addEventListener(ev, su, { passive:true }); });
      XE.inerzia = I;
    } catch(e){}
  }
  function lega(m){
    if (m.__xel) return; m.__xel = 1;
    m.addEventListener('click', function(e){
      if (!m.classList.contains('xe-ed')) return;
      var sb = e.target.closest && e.target.closest('.xe-seg > button');
      if (sb) { var c = sb.getAttribute('data-c'); if (c && c !== (m.__xe && m.__xe.cur)) { fx('tick'); mostra(m, c, true); } return; }
      var t = e.target.closest && e.target.closest('.twr-opt, .twr-sw, .db-sk-btn, .rc-ed-rev');
      if (t) {
        if (t.classList.contains('locked') || t.disabled) hap('warning');
        else hap(t.classList.contains('db-sk-btn') ? 'medium' : 'sel');
        requestAnimationFrame(function(){ valori(m); });
        return;
      }
      if (e.target.closest && e.target.closest('.xe-salva')) { hap('success'); return; }
      if (e.target.closest && e.target.closest('.xe-chiudi')) { hap('light'); return; }
    }, true);
  }
  function spegni(m){
    m.classList.remove('xe-ed'); m.removeAttribute('data-xe');
    if (m.parentNode) m.parentNode.classList.remove('xe-ov');
    if (m.__xe) m.__xe.T = null;
  }
  function controlla(m){
    var T = tipoDi(m);
    if (!T) { if (m.classList.contains('xe-ed')) spegni(m); return; }
    try { vesti(m, T); } catch(e){ try { console.warn('XE vesti', e); } catch(_){} }
  }
  function monta(){
    MODALI.forEach(function(id){
      var m = document.getElementById(id); if (!m || m.__xeo) return; m.__xeo = 1;
      lega(m);
      var ob = new MutationObserver(function(){
        controlla(m);
        ob.takeRecords();
      });
      ob.observe(m, { childList:true, subtree:true });
      controlla(m);
      window.addEventListener('resize', function(){ if (m.classList.contains('xe-ed') && m.__xe) mostra(m, m.__xe.cur, false); }, { passive:true });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', monta); else monta();
  document.addEventListener('gbx:screen', monta);
})();
;
(function(){
  'use strict';
  if (window.XO) return;
  var W = window, D = document;
  var XO = W.XO = { on:true, live:{}, liveT:0, finale:null, dlMode:'', n:{coda:0, vs:0, es:0} };
  function L(it, en){ return (W.GB_LANG === 'en') ? en : it; }
  function lite(){ try { return (W.GBX && GBX.lite()) || D.documentElement.classList.contains('gb-lite'); } catch(e){ return false; } }
  function fermo(){ try { return lite() || (W.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); } catch(e){ return false; } }
  function fx(n){ try { if (W.GBX) GBX.fx(n); } catch(e){} }
  function sfx(n){ try { if (W.GBX) GBX.sfx(n); } catch(e){} }
  function hap(t){ try { if (W.GBX) GBX.hap(t); } catch(e){} }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function el(tag, cls, html){ var x = D.createElement(tag); if (cls) x.className = cls; if (html != null) x.innerHTML = html; return x; }
  var EMO = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2300}-\u{23FF}\u{FE0F}\u{200D}\u{20E3}]/gu;
  function pulito(s){ try { return String(s || '').replace(EMO, '').replace(/^[^\wÀ-ÿ€]+/, '').replace(/\s+/g, ' ').trim(); } catch(e){ return String(s || '').trim(); } }
  var SIGLE = /\b(pvp|uno|bot|lv|vs|ton|btc|usdt|gcr|ko)\b/gi;
  function frase(s){
    s = String(s || ''); if (!/[A-ZÀ-Ý]{2}/.test(s) || /[a-zà-ÿ]/.test(s)) return s;
    var t = s.toLowerCase().replace(SIGLE, function(w){ return w === 'pvp' ? 'PvP' : w.toUpperCase(); });
    var i = t.search(/[a-zà-ÿ]/); return i < 0 ? t : t.slice(0, i) + t.charAt(i).toUpperCase() + t.slice(i + 1);
  }
  var PICCOLE = { di:1, e:1, a:1, da:1, del:1, della:1, the:1, of:1, and:1 };
  function nomeG(s){
    if (W.GB_LANG !== 'en' && /^\s*dice\s*$/i.test(String(s || ''))) return 'Dadi';
    s = pulito(s); if (!/[A-ZÀ-Ý]{2}/.test(s) || /[a-zà-ÿ]/.test(s)) return s;
    return s.toLowerCase().split(' ').map(function(w, i){
      if (/^(uno|pvp|gcr|bj|vs)$/.test(w)) return w === 'pvp' ? 'PvP' : w.toUpperCase();
      if (i && PICCOLE[w]) return w; return w.charAt(0).toUpperCase() + w.slice(1);
    }).join(' ');
  }
  function frasiNodo(n){
    try { var w = D.createTreeWalker(n, NodeFilter.SHOW_TEXT, null), t, v, f;
      while ((t = w.nextNode())) { v = t.nodeValue; f = frase(v); if (f !== v) t.nodeValue = f; } } catch(e){}
  }
  var ALIAS = { unoc:'uno', pool15:'pool8', damaru:'dama', ch:'chess', pkd:'pk1v1', cards:'pk1v1', bjl:'bj1v1', bj:'bj1v1', gcr:'turf', twr:'turf', tk:'tank', gld:'glad' };
  var CON_ICONA = 'alley archery backg basket bj1v1 boxe briscola bs burraco calcio chess cucu dama deadmoney dice draw geo glad golf kaiju lastcall lupus pk1v1 pk5 pong pool8 race rps rr scalata scopa settemezzo shove smash snake sumo tank tappo turf uno uomonero abisso hop'.split(' ');
  function idIcona(g){ g = String(g || '').toLowerCase(); g = ALIAS[g] || ((W.GBX && GBX.gioco) ? GBX.gioco(g) : g);     return CON_ICONA.indexOf(g) >= 0 ? g : ''; }
  function htmlIcona(g, nome){
    var id = idIcona(g), ini = esc((pulito(nome).charAt(0) || 'G').toUpperCase());
    return '<span class="xo-ini">' + ini + '</span>' + (id ? '<img class="xo-img" alt="" decoding="async" src="gbx_pv_' + id + '.webp" onerror="this.remove()">' : '');
  }
  function giocoDi(box){
    var id = box && box.id || '';
    if (/^tw-/.test(id)) return 'turf';
    if (/^tk-/.test(id)) return 'tank';
    if (/^gld-/.test(id)) return 'glad';
    if (/^pvp-/.test(id)) return XO.dlMode || '';
    try { return (W.RTD && RTD.game) || ''; } catch(e){ return ''; }
  }
  function nomeDi(box){
    var id = box && box.id || '';
    if (/^tw-/.test(id)) return 'Gambler City Royale';
    if (/^tk-/.test(id)) return 'Tank Duel';
    if (/^gld-/.test(id)) return L('Colosseo', 'Colosseum');
    if (/^pvp-/.test(id)) { try { if (XO.dlMode === 'random') return L('Partita a caso', 'Random game'); if (XO.dlMode === 'dice') return L('Dadi', 'Dice'); return nomeG(dlModeName(XO.dlMode)); } catch(e){ return ''; } }
    try { return nomeG(rtdMeta().title); } catch(e){ return ''; }
  }
  function avvolgiDat(){
    if (typeof W.dlTwDat !== 'function' || W.dlTwDat.__xe) return;
    var o = W.dlTwDat;
    var n = function(d){
      try { var m = {}; ((d && d.queues) || []).forEach(function(c){ if (c && c.game) m[c.game] = (m[c.game] || 0) + (Number(c.n) || 0); });
        XO.live = m; XO.liveT = Date.now(); aggiornaCode(); } catch(e){}
      return o.apply(this, arguments);
    };
    n.__xe = true; try { W.dlTwDat = n; } catch(e){}
  }
  function avvolgiDl(){
    ['dlSearchView', 'dlRndStart', 'dlBsStart', 'dlBetPick'].forEach(function(f){
      var o = W[f]; if (typeof o !== 'function' || o.__xe) return;
      var n = function(a){ try { XO.dlMode = (f === 'dlRndStart') ? 'random' : (f === 'dlBsStart') ? 'bs' : String(a || ''); } catch(e){} return o.apply(this, arguments); };
      n.__xe = true; try { W[f] = n; } catch(e){}
    });
  }
  var CODE = [];
  var TQ = {};
  function mmss(s){ s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  function rigaCoda(c){
    var g = idIcona(giocoDi(c.box)) || giocoDi(c.box), vivo = (Date.now() - XO.liveT < 90000) ? (XO.live[g] || XO.live[giocoDi(c.box)] || 0) : 0;
    var n = c.box.querySelector('.tw-search-n'), m = n ? /(\d+)\s*\/\s*(\d+)/.exec(n.textContent || '') : null;
    var tt = c.tipo === 'pratica' ? L('Allenamento · arriva il bot', 'Practice · bot on the way')
           : c.tipo === 'torneo' ? L('Match del torneo', 'Tournament match') : L('In coda', 'In queue');
    if (vivo > 1) return tt + ' · ' + vivo + ' ' + L('giocatori cercano adesso', 'players searching now');
    if (m && +m[2] >= 2) return tt + ' · ' + m[1] + ' ' + L('di', 'of') + ' ' + m[2] + ' ' + L('al tavolo', 'at the table');
    if (vivo === 1) return tt + ' · ' + L('1 giocatore cerca adesso', '1 player searching now');
    return tt;
  }
  function aggiornaCode(){
    for (var i = CODE.length - 1; i >= 0; i--) {
      var c = CODE[i];
      if (!c.box.isConnected || !c.hero.isConnected) { CODE.splice(i, 1); continue; }
      var s = (Date.now() - c.t0) / 1000, t = mmss(s);
      if (c.tempo.textContent !== t) c.tempo.textContent = t;
      var r = rigaCoda(c); if (c.riga.textContent !== r) c.riga.textContent = r;
      var n = c.box.querySelector('.tw-search-n'), v = n ? n.textContent : '';
      if (c.nv != null && v !== c.nv && /\d+\s*\/\s*\d+/.test(v)) { hap('light'); sfx('tick'); }
      c.nv = v;
    }
    if (!CODE.length && XO._tq) { clearInterval(XO._tq); XO._tq = 0; }
  }
  function heroCoda(box, tipo, nome){
    var h = el('div', 'xo-q');
    h.innerHTML = '<div class="xo-anello"><i class="xo-alo"></i><i class="xo-filo"></i><span class="xo-ico">' + htmlIcona(giocoDi(box), nome) + '</span></div>'
      + '<div class="xo-gn">' + esc(nome) + '</div>'
      + '<div class="xo-tt">' + esc(tipo === 'torneo' ? L('Raduno del match', 'Match check-in') : tipo === 'pratica' ? L('Allenamento', 'Practice') : L('Cerco un avversario', 'Finding an opponent')) + '</div>'
      + '<div class="xo-tempo">0:00</div><div class="xo-riga"></div>';
    return h;
  }
  function tipoDi(box){
    var tx = (box.textContent || '').toUpperCase();
    if (/RADUNO|TORNEO|TOURNAMENT|CHECK-IN/.test(tx)) return 'torneo';
    if (/ALLENAMENTO|PRATICA|PRACTICE|TRAINING|VS BOT/.test(tx)) return 'pratica';
    return 'coda';
  }
  function tastiCoda(scope){
    [].forEach.call(scope.querySelectorAll('button'), function(b){ etichetta(b); osservaTesto(b, function(){ etichetta(b); }); b.setAttribute('data-x-silent', ''); });
  }
  function registra(box, hero, tipo){
    var k = box.id || 'x', ora = Date.now();
    if (!TQ[k] || ora - TQ[k].visto > 4000) TQ[k] = { t0: ora };
    TQ[k].visto = ora;
    var c = { box:box, hero:hero, tipo:tipo, t0:TQ[k].t0, tempo:hero.querySelector('.xo-tempo'), riga:hero.querySelector('.xo-riga') };
    CODE.push(c);
    if (tipo === 'torneo') { try { XO.finale = { si: !!vsxTorneoInfo().finale, t: ora }; } catch(e){} }
    aggiornaCode();
    if (!XO._tq) XO._tq = setInterval(function(){ for (var i = 0; i < CODE.length; i++) { var b = CODE[i].box.id; if (TQ[b]) TQ[b].visto = Date.now(); } aggiornaCode(); }, 1000);
  }
  function decCoda(body){
    if (!XO.on) return;
    var g = body.querySelector(':scope > .gbc'); if (!g || g.__xe) return; g.__xe = 1;
    var tipo = tipoDi(body), nome = nomeDi(body) || frase(pulito((g.querySelector('.gbf-gioco') || {}).textContent || ''));
    g.classList.add('xo-coda'); body.classList.add('xo-coda-on');
    var eroe = g.querySelector('.gbf-eroe'); if (!eroe) return;
    var hero = heroCoda(body, tipo, nome); eroe.insertBefore(hero, eroe.firstChild);
    var resto = g.querySelector('.gbf-info');
    if (resto) { frasiNodo(resto); [].forEach.call(resto.querySelectorAll('.twr-prize,.tw-search-cd,.gbc-resto'), function(x){ osservaTesto(x, function(){ frasiNodo(x); }); }); }
    tastiCoda(g);
    registra(body, hero, tipo);
    if (!fermo()) entraCoda(hero);
    hap('soft');
  }
  function entraCoda(h){
    try {
      h.querySelector('.xo-anello').animate([{ transform:'scale(.82)', opacity:0 }, { transform:'scale(1)', opacity:1 }], { duration:520, easing:'cubic-bezier(.2,.8,.2,1)' });
      [].forEach.call(h.querySelectorAll('.xo-gn,.xo-tt,.xo-tempo,.xo-riga'), function(x, i){ x.animate([{ transform:'translateY(8px)', opacity:0 }, { transform:'none', opacity:1 }], { duration:420, delay:80 + i * 50, easing:'cubic-bezier(.2,.8,.2,1)', fill:'backwards' }); });
    } catch(e){}
  }
  function decPvpCoda(m){
    if (!XO.on) return;
    var q = m.querySelector(':scope > .tw-radar, :scope > .pvp-search');
    if (!q) { m.classList.remove('xo-pq'); return; }
    if (m.querySelector(':scope > .xo-q')) return;
    var tipo = tipoDi(m), nome = nomeDi(m);
    if (XO.dlMode === 'random' && !m.querySelector(':scope > .tw-radar')) nome = L('Partita a caso', 'Random game');
    var hero = heroCoda(m, tipo, nome);
    m.insertBefore(hero, m.firstChild);
    m.classList.add('xo-pq');
    frasiNodo(m.querySelector(':scope > .twr-prize') || el('i')); [].forEach.call(m.querySelectorAll(':scope > .tw-search-cd, :scope > div[style]'), function(x){ if (!x.querySelector('button')) frasiNodo(x); });
    tastiCoda(m);
    registra(m, hero, tipo);
    if (!fermo()) entraCoda(hero);
  }
  function osservaTesto(x, fn){
    if (!x || x.__xeo) return; x.__xeo = 1; var n = 0, t0 = Date.now();
    try { new MutationObserver(function(){ if (Date.now() - t0 > 2000) { n = 0; t0 = Date.now(); } if (++n > 12) return; fn(); }).observe(x, { childList:true, characterData:true, subtree:true }); } catch(e){}
  }
  function etichetta(b){
    if (!b || !XO.on) return;
    var oc = b.getAttribute('onclick') || '', t = pulito(b.textContent || '').toUpperCase(), nuovo = null; t = t.replace(/^[^A-ZÀ-Ý]+/, '');
    if (/go\(\s*['"]duel['"]\s*\)/.test(oc) || /PVP ARENA/.test(t)) nuovo = L('Torna all’Arena', 'Back to the Arena');
    else if (/ACCETTA LA RIVINCITA|ACCEPT THE REMATCH/.test(t)) nuovo = L('Accetta la rivincita', 'Accept the rematch');
    else if (/^(RIVINCITA|REMATCH)$/.test(t)) nuovo = L('Rivincita', 'Rematch');
    else if (/TORNA AL TORNEO|BACK TO THE TOURNAMENT/.test(t)) nuovo = /GUARDA|WATCH/.test(t) ? L('Torna al torneo · guarda gli altri match', 'Back to the tournament · watch the others') : L('Torna al torneo', 'Back to the tournament');
    else if (/ANCORA\s*·\s*GRATIS|AGAIN\s*·\s*FREE/.test(t)) nuovo = L('Ancora, gratis', 'Again, free');
    else if (/GIOCA VERA|PLAY FOR REAL|GIOCA A SOLDI/.test(t)) nuovo = L('Gioca a soldi', 'Play for money');
    else if (/^(GIOCA ANCORA|PLAY AGAIN)$/.test(t)) nuovo = L('Gioca ancora', 'Play again');
    else if (/^ANNULLA \(RIMBORSO\)|^CANCEL \(REFUND\)|^CANCEL & REFUND$/.test(t)) nuovo = L('Annulla · rimborso', 'Cancel · refund');
    else if (/^ANNULLA$|^CANCEL$/.test(t)) nuovo = L('Annulla', 'Cancel');
    else if (/^(ESCI|LEAVE|EXIT)$/.test(t)) nuovo = L('Esci', 'Leave');
    else if (/^(CHIUDI|CLOSE)$/.test(t)) nuovo = L('Chiudi', 'Close');
    else if (/^(GUARDA|WATCH)$/.test(t)) nuovo = L('Guarda', 'Watch');
    else if (/^ABBANDONA IL MATCH$|^LEAVE THE MATCH$/.test(t)) nuovo = L('Abbandona il match', 'Leave the match');
    else nuovo = null;
    var pezzi = [].some.call(b.children, function(c){ return !c.classList.contains('xn-ic'); });
    if (!nuovo || pezzi) { if (!pezzi && !nuovo) { var f = frase(pulito(b.textContent || '')); if (f && b.textContent !== f) b.textContent = f; } else frasiNodo(b); return; }
    if (b.textContent !== nuovo) b.textContent = nuovo;
  }
  var VSO = null;
  var VC = null;
  function iniz(nm){ var s = String(nm || '').replace(/[^A-Za-z0-9À-ÿ ]+/g, ' ').trim(); if (!s) return '?'; var w = s.split(/\s+/); return ((w[0] || '').charAt(0) + ((w[1] || '').charAt(0) || '')).toUpperCase() || '?'; }
  function fotoDi(p, io){
    var f = String(p.photo_url || '');
    try { if (!f && io) f = vsxFotoMia(); } catch(e){}
    try { if (!f) f = vsxFotoRiserva(p.uid); } catch(e){}
    if (f && !/^(https?:)?\/\//i.test(f) && f.indexOf('/') !== 0) f = '';
    return f;
  }
  function giocatoreVs(p, lato, io){
    var nm = String(p.name || '').trim() || (io ? L('Tu', 'You') : L('Rivale', 'Rival'));
    var f = fotoDi(p, io), lv = null; try { lv = vsxLivello(p); } catch(e){}
    var dw = +p.dw || 0, dl = +p.dl || 0;
    return '<div class="xo-pl ' + lato + (io ? ' io' : '') + '"><div class="xo-av"><b>' + esc(iniz(nm)) + '</b>'
      + (f ? '<img alt="" decoding="async" draggable="false" src="' + esc(f) + '" onerror="this.remove()">' : '') + '</div>'
      + '<div class="xo-pn">' + esc(io ? L('Tu', 'You') : nm) + '</div>'
      + '<div class="xo-pm">' + (lv ? 'LV ' + lv.n : '') + (lv && (dw + dl) ? ' · ' : '') + (dw + dl ? dw + L('V', 'W') + ' ' + dl + L('S', 'L') : '') + '</div></div>';
  }
  function chiudiVs(c, rapido){
    if (!c || c.chiuso) return; c.chiuso = true;
    c.timers.forEach(clearTimeout); c.timers = [];
    var x = c.el, ms = rapido ? 180 : 240;
    try { x.animate([{ opacity:1 }, { opacity:0 }], { duration:ms, fill:'forwards', easing:'ease-in' }); } catch(e){}
    setTimeout(function(){ try { if (x.parentNode) x.parentNode.removeChild(x); } catch(e){} }, ms + 30);
    if (VC === c) VC = null;
  }
  function fattoVs(c){ if (c.fatto) return; c.fatto = true; try { if (typeof c.onDone === 'function') c.onDone(); } catch(e){ try { console.error('[XO vs] onDone', e); } catch(_){} } }
  function giocoVs(o){
    var s = String(o.src || ''), m = /^(?:rtd|dl):(.+)$/.exec(s);
    if (m) return m[1];
    if (s === 'tank') return 'tank';
    if (s === 'mf' || s === 'duel') { try { if (W.CUR === 'arc' && W.RTD) return RTD.game; } catch(e){} return XO.dlMode; }
    return '';
  }
  function vs(o){
    if (!D.body || !Element.prototype.animate) return false;
    if (VC) { var v0 = VC; fattoVs(v0); chiudiVs(v0, true); }
    try { if (W.VSX && VSX.cur) {   } } catch(e){}
    var me = o.me || {}, op = o.op || {}, P = vsxPosta(o), ti = P.ti || {};
    var tit = String(o.title || '').trim(), gn = nomeG(tit) || L('Sfida', 'Duel'), g = giocoVs(o);
    var cd = !!o.countdown, fine = o.dur || (cd ? 3200 : 2800), doneAt = Math.min(fine, o.doneAt || fine);
    var CD = cd ? [1750, 2150, 2550, 2900] : [];
    var tag = '', bet = '';
    if (P.k === 'soldi') {
      tag = L('Sfida a soldi', 'Money match');
      bet = '<div class="xo-bk"><span>' + L('Posta', 'Stake') + '</span><b>' + esc(vsxEur(P.testa)) + '</b><i>' + L('a testa', 'each') + '</i></div>'
          + '<div class="xo-bk"><span>' + L('Piatto', 'Pot') + '</span><b>' + esc(vsxEur(P.pot)) + '</b><i>' + L('al vincitore il 95%', 'winner takes 95%') + '</i></div>';
    } else if (P.k === 'torneo') {
      tag = ti.finale ? L('Finale del torneo', 'Tournament final') : (L('Torneo', 'Tournament') + (ti.turno ? ' · ' + frase(ti.turno) : ''));
      var pv = ti.premio > 0 ? vsxEur(ti.premio / 100) : (ti.testo ? pulito(ti.testo) : '');
      bet = '<div class="xo-bk wide"><span>' + (pv ? L('Montepremi', 'Prize') : L('Match di torneo', 'Tournament match')) + '</span><b>' + esc(pv || L('Torneo', 'Tournament')) + '</b><i>'
          + (ti.finale ? L('chi vince prende la coppa', 'winner takes the cup') : L('chi vince passa il turno', 'winner goes through')) + '</i></div>';
      try { XO.finale = { si: !!ti.finale, t: Date.now() }; } catch(e){}
    } else if (P.k === 'prova') {
      tag = L('Allenamento', 'Practice');
      bet = '<div class="xo-bk wide"><span>' + L('Partita di prova', 'Practice match') + '</span><b>' + L('Gratis', 'Free') + '</b><i>' + L('nessuna posta, nessun premio', 'no stake, no prize') + '</i></div>';
    } else {
      tag = L('Partita gratis', 'Free match');
      bet = '<div class="xo-bk wide"><span>' + L('Partita gratis', 'Free match') + '</span><b>' + L('Gratis', 'Free') + '</b><i>' + L('nessun euro in gioco', 'no money at stake') + '</i></div>';
    }
    var x = el('div', 'xo-vs' + (cd ? ' cd' : '') + ((innerWidth > innerHeight * 1.05) ? ' land' : ''));
    x.id = 'xo-vs'; x.setAttribute('role', 'dialog'); x.setAttribute('aria-label', 'VS'); x.setAttribute('data-x-silent', '');
    x.innerHTML = '<i class="xo-vs-luce"></i>'
      + '<div class="xo-vs-in">'
      +   '<div class="xo-vs-top"><span class="xo-vs-ic">' + htmlIcona(g, gn) + '</span><div class="xo-vs-gn">' + esc(gn) + '</div><div class="xo-vs-tag">' + esc(tag) + '</div></div>'
      +   '<div class="xo-vs-mid">' + giocatoreVs(me, 'a', true)
      +     '<div class="xo-vs-c"><div class="xo-vs-vs">VS</div>' + (cd ? '<div class="xo-vs-n">3</div><div class="xo-vs-n">2</div><div class="xo-vs-n">1</div><div class="xo-vs-n via">' + L('Via', 'Go') + '</div>' : '') + '</div>'
      +     giocatoreVs(op, 'b', false) + '</div>'
      +   '<div class="xo-vs-bet">' + bet + '</div>'
      +   '<div class="xo-vs-skip">' + L('Tocca per saltare', 'Tap to skip') + '</div>'
      + '</div><i class="xo-vs-bar"></i>';
    D.body.appendChild(x);
    var c = { el:x, t0:performance.now(), timers:[], onDone:o.onDone, fatto:false, chiuso:false };
    VC = c; XO.n.vs++;
    function at(ms, fn){ c.timers.push(setTimeout(function(){ if (!c.chiuso) { try { fn(); } catch(e){} } }, ms)); }
    at(doneAt, function(){ fattoVs(c); });
    at(fine, function(){ fattoVs(c); chiudiVs(c, false); });
    setTimeout(function(){ if (!c.fatto) fattoVs(c); chiudiVs(c, true); }, fine + 1500);
    x.addEventListener('pointerdown', function(ev){
      if (performance.now() - c.t0 < 250) return;
      try { ev.preventDefault(); } catch(e){}
      fattoVs(c); chiudiVs(c, true);
    });
    var calmo = fermo(), Q = function(s){ return x.querySelector(s); }, QQ = function(s){ return [].slice.call(x.querySelectorAll(s)); };
    var E = 'cubic-bezier(.2,.8,.2,1)', M = 'cubic-bezier(.34,1.3,.64,1)';
    function an(n, k, o2){ if (!n) return; try { n.animate(k, o2); } catch(e){} }
    if (!calmo) {
      an(x, [{ opacity:0 }, { opacity:1 }], { duration:220, easing:'ease-out' });
      an(Q('.xo-vs-luce'), [{ transform:'translate(-50%,-50%) scale(.4)', opacity:0 }, { transform:'translate(-50%,-50%) scale(1)', opacity:1 }], { duration:900, delay:300, easing:E, fill:'backwards' });
      an(Q('.xo-vs-top'), [{ transform:'translateY(-14px)', opacity:0 }, { transform:'none', opacity:1 }], { duration:480, delay:80, easing:E, fill:'backwards' });
      an(Q('.xo-pl.a'), [{ transform:'translateX(-46vw)', opacity:0 }, { transform:'none', opacity:1 }], { duration:620, delay:120, easing:M, fill:'backwards' });
      an(Q('.xo-pl.b'), [{ transform:'translateX(46vw)', opacity:0 }, { transform:'none', opacity:1 }], { duration:620, delay:180, easing:M, fill:'backwards' });
      an(Q('.xo-vs-vs'), [{ transform:'scale(.6)', opacity:0 }, { transform:'none', opacity:1 }], { duration:420, delay:560, easing:M, fill:'backwards' });
      an(Q('.xo-vs-bet'), [{ transform:'translateY(16px)', opacity:0 }, { transform:'none', opacity:1 }], { duration:480, delay:760, easing:E, fill:'backwards' });
      an(Q('.xo-vs-skip'), [{ opacity:0 }, { opacity:1 }], { duration:300, delay:1250, fill:'backwards' });
    }
    an(Q('.xo-vs-bar'), [{ transform:'scaleX(0)' }, { transform:'scaleX(1)' }], { duration:fine, easing:'linear', fill:'forwards' });
    sfx('open');
    at(calmo ? 0 : 640, function(){ hap(cd ? 'light' : 'medium'); sfx('soft'); });
    if (cd) {
      at(CD[0] - 60, function(){ an(Q('.xo-vs-vs'), [{ opacity:1 }, { opacity:0 }], { duration:160, fill:'forwards' }); });
      QQ('.xo-vs-n').forEach(function(n, i){
        at(CD[i], function(){
          n.style.opacity = '1';
          an(n, i < 3 ? [{ transform:'scale(1.25)', opacity:0 }, { transform:'scale(1)', opacity:1, offset:.35 }, { transform:'scale(.92)', opacity:0 }]
                      : [{ transform:'scale(1.2)', opacity:0 }, { transform:'scale(1)', opacity:1, offset:.4 }, { transform:'scale(1)', opacity:1 }],
             { duration:i < 3 ? 400 : 420, easing:E, fill:'forwards' });
          if (i < 3) { hap('sel'); sfx('tick'); } else { hap('success'); sfx('toggle'); }
        });
      });
    }
    return true;
  }
  function installaVs(){
    if (typeof W.vsxMostra !== 'function' || W.vsxMostra.__xe) return;
    VSO = W.vsxMostra;
    var n = function(o){
      if (!XO.on) return VSO.apply(this, arguments);
      try { var r = vs(o || {}); if (r) return true; } catch(e){ try { console.error('[XO vs]', e); var y = D.getElementById('xo-vs'); if (y) y.remove(); VC = null; } catch(_){} }
      return VSO.apply(this, arguments);
    };
    n.__xe = true; try { W.vsxMostra = n; } catch(e){}
    XO.vsOriginale = VSO;
  }
  function decPresenta(mm){
    var ov = mm.parentNode; if (!ov) return;
    var tav = !!mm.querySelector(':scope > .uno-seats'), gl = (mm.id === 'gld-modal') && !!mm.querySelector(':scope > .pvp-vs-go') && !mm.querySelector('.gbf');
    ov.classList.toggle('xo-pres', XO.on && (tav || gl));
    if ((tav || gl) && XO.on && !mm.__xep) { mm.__xep = 1; frasiNodo(mm); setTimeout(function(){ mm.__xep = 0; }, 400); }
  }
  var VINCE = { vittoria:1, podio:1, tpassa:1, bye:1, pvinto:1 }, PERDE = { sconfitta:1, tfuori:1, fuori:1, abbandono:1, pfinito:1 };
  function campione(e){ return e === 'tpassa' && XO.finale && XO.finale.si && (Date.now() - XO.finale.t < 3 * 3600e3); }
  function titolo(e, vecchio){
    if (e === 'podio') { var r = /^(\d+)°$/.exec(String(vecchio || '').trim()); return r ? L(r[1] + '° posto', r[1] + (r[1] === '2' ? 'nd' : r[1] === '3' ? 'rd' : 'th') + ' place') : L('Sul podio', 'On the podium'); }
    if (campione(e)) return L('Campione', 'Champion');
    return ({ vittoria:L('Hai vinto', 'You won'), pvinto:L('Hai vinto', 'You won'), sconfitta:L('Hai perso', 'You lost'), pfinito:L('Hai perso', 'You lost'),
      pari:L('Pareggio', 'Draw'), annullata:L('Partita annullata', 'Match cancelled'), resa:L('Posta salva', 'Stake saved'),
      abbandono:L('Hai lasciato', 'You left'), fuori:L('Sei fuori', 'You are out'), tpassa:L('Turno superato', 'Round won'),
      bye:L('Turno superato', 'Round won'), tfuori:L('Eliminato', 'Eliminated'), spett:L('Fine partita', 'Match over') })[e] || frase(vecchio);
  }
  var MODI = { soldi:['A soldi', 'For money'], gratis:['Gratis', 'Free'], torneo:['Torneo', 'Tournament'], pratica:['Allenamento', 'Practice'], spett:['Spettatore', 'Spectator'] };
  var CHIP = { 'Posta':['Posta', 'Stake'], 'Piatto':['Piatto', 'Pot'], 'Netto':['Netto', 'Net'], 'Casa':['Commissione', 'House fee'], 'Posizione':['Posizione', 'Position'], 'Kill':['Eliminazioni', 'Kills'], 'Turno':['Turno', 'Round'], 'Montepremi':['Montepremi', 'Prize'] };
  var LAB = { 'VINCITA':['Vincita', 'Winnings'], 'VINCITA NETTA':['Vincita netta', 'Net winnings'], 'POSTA PERSA':['Posta persa', 'Stake lost'], 'POSTA RESA':['Posta resa', 'Stake returned'] };
  function notaSoldi(box, e, modo){
    var n = box.querySelector('.gbf-num'), v = n ? Number(n.getAttribute('data-v')) : NaN, st = box.querySelector('.gbf-stato');
    var att = !!(st && st.classList.contains('att')), cifra = isFinite(v) && v > 0 ? ' ' + L('di', 'of') + ' €' + v.toFixed(2) : '';
    if (modo !== 'soldi') return modo === 'gratis' ? L('Partita gratis: nessun euro in gioco.', 'Free match: no money at stake.') : '';
    if (e === 'pari') return L('Nessuno vince. ', 'Nobody wins. ') + (att ? L('La tua posta' + cifra + ' sta tornando sul saldo.', 'Your stake' + cifra + ' is on its way back to your balance.') : L('La tua posta' + cifra + ' è tornata sul saldo.', 'Your stake' + cifra + ' is back on your balance.'));
    if (e === 'annullata') return att ? L('La tua posta' + cifra + ' torna sul saldo fra poco.', 'Your stake' + cifra + ' returns to your balance shortly.') : L('Rimborso fatto: la tua posta' + cifra + ' è tornata sul saldo.', 'Refunded: your stake' + cifra + ' is back on your balance.');
    if (e === 'resa') return L('La tua posta torna sul saldo.', 'Your stake goes back to your balance.');
    return '';
  }
  function particelle(box, centro){
    if (fermo() || !centro) return;
    var r = centro.getBoundingClientRect(), b = box.getBoundingClientRect(), cx = r.left - b.left + r.width / 2, cy = r.top - b.top + r.height / 2;
    var lay = el('div', 'xo-part'); box.appendChild(lay);
    var N = 16;
    for (var i = 0; i < N; i++) {
      var p = el('i', i % 3 === 0 ? 'v' : ''), a = (i / N) * Math.PI * 2 + (Math.random() - .5) * .5, d = 70 + Math.random() * 90, s = .6 + Math.random() * .7;
      p.style.left = cx + 'px'; p.style.top = cy + 'px'; lay.appendChild(p);
      try { p.animate([{ transform:'translate(-50%,-50%) rotate(0) scale(' + s + ')', opacity:0 }, { opacity:1, offset:.12 },
        { transform:'translate(calc(-50% + ' + (Math.cos(a) * d).toFixed(1) + 'px),calc(-50% + ' + (Math.sin(a) * d + 26).toFixed(1) + 'px)) rotate(' + Math.round((Math.random() - .5) * 260) + 'deg) scale(' + (s * .5).toFixed(2) + ')', opacity:0 }],
        { duration:1000 + Math.random() * 500, delay:260 + Math.random() * 90, easing:'cubic-bezier(.15,.75,.3,1)', fill:'backwards' }); } catch(e){}
    }
    setTimeout(function(){ if (lay.parentNode) lay.parentNode.removeChild(lay); }, 2100);
  }
  function decEsito(box){
    if (!XO.on || box.__xe || box.classList.contains('gbc')) return; box.__xe = 1; XO.n.es++;
    var inline = box.classList.contains('gbf-in'), e = box.getAttribute('data-esito') || '';
    var kind = VINCE[e] ? 'win' : PERDE[e] ? 'lose' : 'neutro';
    var me = box.querySelector('.gbf-modo'), modo = me ? ((/m-(\w+)/.exec(me.className) || [])[1] || '') : '';
    box.classList.add('xo-es', 'xo-k-' + kind, 'xo-e-' + e);
    if (campione(e)) box.classList.add('xo-campione');
    var ov = box.closest('.tw-overlay');
    if (inline) { var po = box.closest('.pvp-overlay'); if (po) po.classList.add('xo-es-pv'); }
    if (ov && !inline) { ov.classList.remove('xo-k-win', 'xo-k-lose', 'xo-k-neutro'); ov.classList.add('xo-es-o', 'xo-k-' + kind); }
    [].forEach.call((inline ? box : (ov || box)).querySelectorAll('.gbf-cv'), function(c){ c.remove(); });
    setTimeout(function(){ [].forEach.call((inline ? box : (ov || box)).querySelectorAll('.gbf-cv'), function(c){ c.remove(); }); }, 300);
    var g = '', gn = '';
    try { var mm = box.closest('.tw-modal,.pvp-modal'); g = giocoDi(mm && mm.id ? { id:mm.id.replace('modal', 'x') } : null); gn = nomeDi(mm && mm.id ? { id:mm.id.replace('modal', 'x') } : null); } catch(x){}
    var gg = box.querySelector('.gbf-gioco'); if (gg) { gg.textContent = gn || nomeG(gg.textContent); }
    var med = box.querySelector('.gbf-med');
    if (med) med.insertAdjacentHTML('beforeend', '<span class="xo-med"><i class="xo-med-f"></i><span class="xo-ico">' + htmlIcona(g, gn || (gg && gg.textContent) || 'G') + '</span></span>');
    if (kind === 'win' && !inline) box.insertAdjacentHTML('afterbegin', '<i class="xo-bagliore"></i>');
    if (me && MODI[modo]) me.textContent = L(MODI[modo][0], MODI[modo][1]);
    var tt = box.querySelector('.gbf-tit');
    if (tt) { var nt = titolo(e, tt.textContent); tt.textContent = nt; tt.setAttribute('data-t', nt); tt.style.removeProperty('--fz'); }
    var fl = box.querySelector('.gbf-fla');
    if (fl) { var fs = frase(pulito(fl.textContent)); fl.textContent = fs; if (tt && fs.toLowerCase() === (tt.textContent || '').toLowerCase()) fl.style.display = 'none'; }
    var lab = box.querySelector('.gbf-lab'); if (lab) { var k = LAB[(lab.textContent || '').trim()]; if (k) lab.textContent = L(k[0], k[1]); }
    var st = box.querySelector('.gbf-stato');
    if (st) st.textContent = st.classList.contains('att') ? L('In arrivo sul saldo', 'On its way to your balance') : L('Tornata sul saldo', 'Back on your balance');
    var pill = box.querySelector('.gbf-pill');
    if (pill) pill.textContent = modo === 'pratica' ? L('Nessun premio: è allenamento', 'No prize: it is practice') : L('Nessun euro in gioco', 'No money at stake');
    var nota = notaSoldi(box, e, modo);
    if (nota && kind === 'neutro') { var info = box.querySelector('.gbf-info') || box; var r = el('div', 'xo-nota'); r.textContent = nota; var sd = info.querySelector('.gbf-soldi'); if (sd && sd.nextSibling) info.insertBefore(r, sd.nextSibling); else info.insertBefore(r, info.firstChild); if (pill && modo === 'gratis') pill.style.display = 'none'; }
    [].forEach.call(box.querySelectorAll('.gbf-chip'), function(c){ var i = c.querySelector('i'), k2 = i && CHIP[(i.textContent || '').trim()]; if (k2) i.textContent = L(k2[0], k2[1]); });
    [].forEach.call(box.querySelectorAll('.gbf-gn'), function(n){ if ((n.textContent || '').trim() === 'TU') n.textContent = L('Tu', 'You'); });
    var inv = box.querySelector('.gbf-inv'); if (inv) inv.textContent = L('La prossima può essere tua.', 'The next one could be yours.');
    var det = box.querySelector('.gbf-det'); if (det) { frasiNodo(det); osservaTesto(det, function(){ frasiNodo(det); }); }
    if (campione(e) && det) { det.style.display = 'none'; var cr = el('div', 'xo-nota'); cr.textContent = L('Hai vinto il torneo. Il premio e le istruzioni per riscuoterlo arrivano in DM dal bot.', 'You won the tournament. The prize and how to claim it arrive in a DM from the bot.'); det.parentNode.insertBefore(cr, det); }
    var bb = box.querySelector('.gbf-btns') || (box.parentNode && box.parentNode.querySelector('.gbf-btns'));
    if (bb) [].forEach.call(bb.querySelectorAll('button'), function(b){ etichetta(b); osservaTesto(b, function(){ etichetta(b); }); });
    if (kind === 'win') {
      setTimeout(function(){ hap('success'); }, 320);
      if (!inline) particelle(box, med || tt);
      if (!fermo()) { var bg = box.querySelector('.xo-bagliore'); if (bg) try { bg.animate([{ transform:'translateX(-50%) scale(.25)', opacity:0 }, { transform:'translateX(-50%) scale(1)', opacity:1 }], { duration:1100, delay:120, easing:'cubic-bezier(.2,.8,.2,1)', fill:'backwards' }); } catch(x){} }
    }
  }
  var CORPI = ['arc-body', 'tw-body', 'tk-body', 'gld-body'], MODALI = ['arc-modal', 'tw-modal', 'tk-modal', 'gld-modal'];
  function guardaCorpo(id){
    var b = D.getElementById(id); if (!b || b.__xeg) return; b.__xeg = 1;
    var f = function(){ if (b.querySelector(':scope > .gbc')) decCoda(b); else b.classList.remove('xo-coda-on'); };
    try { new MutationObserver(f).observe(b, { childList:true }); } catch(e){}
    f();
  }
  function guardaModale(id){
    var m = D.getElementById(id); if (!m || m.__xeg) return; m.__xeg = 1;
    var f = function(){
      var g = m.querySelector(':scope > .gbf'); if (g) decEsito(g);
      else { var ov = m.parentNode; if (ov) ov.classList.remove('xo-es-o', 'xo-k-win', 'xo-k-lose', 'xo-k-neutro'); }
      decPresenta(m);
    };
    try { new MutationObserver(f).observe(m, { childList:true }); } catch(e){}
    f();
  }
  function guardaPvp(){
    var m = D.getElementById('pvp-modal'); if (!m || m.__xeg) return; m.__xeg = 1;
    var f = function(){
      decPvpCoda(m);
      var po = m.parentNode; if (po && !m.querySelector('.gbf-in.xo-es, .gbf-in:not(.xo-es)')) po.classList.remove('xo-es-pv');
      [].forEach.call(m.querySelectorAll('.gbf-in:not(.xo-es)'), decEsito);
    };
    try { new MutationObserver(f).observe(m, { childList:true, subtree:true }); } catch(e){}
    f();
  }
  function tutti(){
    CORPI.forEach(guardaCorpo); MODALI.forEach(guardaModale); guardaPvp();
    avvolgiDat(); avvolgiDl(); installaVs();
  }
  XO.vs = vs; XO.frase = frase; XO.decEsito = decEsito; XO.decCoda = decCoda;
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', tutti); else tutti();
  var giri = 0, tg = setInterval(function(){ tutti(); if (++giri > 40) clearInterval(tg); }, 3000);
})();
;
(function(){
  'use strict';
  if (!window.GBX || GBX.fondo) return;
  var GUSCIO = { home:1, duel:1, wallet:1, friends:1, fair:1, profile:1, leaderboard:1, challenges:1 };
  var VAR = ['nebbia', 'aurora', 'lava', 'spento'];
  var v = 'nebbia'; try { var m = localStorage.getItem('gbx_fondo'); if (VAR.indexOf(m) >= 0) v = m; } catch(e){}
  var H = document.documentElement, box = null, lava = null;
  function riduci(){ try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){ return false; } }
  function macchia(col, a){
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(' + col + ',' + a + ')'); g.addColorStop(.45, 'rgba(' + col + ',' + (a * .55).toFixed(3) + ')');
    g.addColorStop(.75, 'rgba(' + col + ',' + (a * .16).toFixed(3) + ')'); g.addColorStop(1, 'rgba(' + col + ',0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64); return c;
  }
  var COL = { viola:'139,131,240', indaco:'84,96,230', acqua:'72,190,200', ambra:'245,177,76', rosa:'214,110,200' };
  var RICETTE = {
    nebbia: [['viola', .13, 'a'], ['viola', .06, 'c']],
    aurora: [['viola', .5, 'a'], ['acqua', .24, 'b']]
  };
  function monta(){
    var app = document.getElementById('app'); if (!app) return;
    if (!box) { box = document.createElement('div'); box.id = 'xf-fondo'; box.className = 'xf-strato'; box.setAttribute('aria-hidden', 'true'); app.insertBefore(box, app.firstChild); }
    fermaLava();
    box.innerHTML = ''; box.setAttribute('data-v', v);
    H.classList.toggle('xf-on', v !== 'spento');
    if (v === 'spento') return;
    if (v === 'lava') { avviaLava(); return; }
    RICETTE[v].forEach(function(r){ var c = macchia(COL[r[0]], r[1]); c.className = 'xf-m xf-' + r[2]; box.appendChild(c); });
    tinte();
    stato();
  }
  var LW = 40, LH = 86, rafL = 0, lastL = 0, t0 = 0;
  var PALLE = [
    { c:[139,131,240], r:.62, x:.25, y:.18, ax:.22, ay:.12, px:47, py:61, a:.62 },
    { c:[96,104,236],  r:.55, x:.78, y:.32, ax:.18, ay:.16, px:53, py:43, a:.5 },
    { c:[150,120,235], r:.48, x:.5,  y:.62, ax:.26, ay:.14, px:67, py:51, a:.38 },
    { c:[72,180,200],  r:.36, x:.82, y:.85, ax:.12, ay:.1,  px:59, py:71, a:.2 },
    { c:[245,177,76],  r:.3,  x:.12, y:.9,  ax:.1,  ay:.08, px:73, py:57, a:.12 }];
  function avviaLava(){
    lava = document.createElement('canvas'); lava.width = LW; lava.height = LH; lava.className = 'xf-lava'; box.appendChild(lava);
    t0 = performance.now() - Math.random() * 60000; disegnaLava(t0); stato();
  }
  function disegnaLava(t){
    var x = lava.getContext('2d'), s = (t - t0) / 1000, img = x.createImageData(LW, LH), d = img.data, P = [];
    for (var k = 0; k < PALLE.length; k++) { var p = PALLE[k];
      P.push([(p.x + p.ax * Math.sin(s * 6.283 / p.px + k)) * LW, (p.y + p.ay * Math.sin(s * 6.283 / p.py + k * 1.7)) * LH,
              Math.pow(p.r * LW * (1 + .12 * Math.sin(s * 6.283 / (p.px * .7) + k)), 2), p]); }
    for (var j = 0, i = 0; j < LH; j++) for (var q = 0; q < LW; q++, i += 4) {
      var R = 0, G = 0, B = 0;
      for (k = 0; k < P.length; k++) { var dx = q - P[k][0], dy = (j - P[k][1]) * .62, f = P[k][2] / (dx * dx + dy * dy + P[k][2] * .35);
        f = f > 1.6 ? 1.6 : f; f = f * f * .22 * P[k][3].a; R += P[k][3].c[0] * f; G += P[k][3].c[1] * f; B += P[k][3].c[2] * f; }
      d[i] = R > 255 ? 255 : R; d[i + 1] = G > 255 ? 255 : G; d[i + 2] = B > 255 ? 255 : B; d[i + 3] = 255;
    }
    x.putImageData(img, 0, 0);
  }
  function giroLava(t){ rafL = 0; if (!lava || !lava.isConnected) return;
    if (t - lastL >= 32) { lastL = t; disegnaLava(t); }
    if (vivo()) rafL = requestAnimationFrame(giroLava); }
  function fermaLava(){ if (rafL) cancelAnimationFrame(rafL); rafL = 0; lava = null; }
  function attiva(){ var a = document.querySelector('.screen.active'); return a ? a.id : ''; }
  function vivo(){ return !document.hidden && !!GUSCIO[attiva()] && !GBX.lite() && !riduci(); }
  var PAGINE = ['home', 'duel', 'wallet', 'friends', 'fair', 'profile', 'leaderboard', 'challenges'];
  function tinte(){
    if (!box || v === 'spento') return;
    PAGINE.forEach(function(p){ var t = document.createElement('i'); t.className = 'xf-t'; t.setAttribute('data-p', p); box.appendChild(t); });
    box.classList.add('xf-tinte'); pagina();
  }
  function pagina(){
    if (!box) return; var a = attiva(); if (!GUSCIO[a] || box.getAttribute('data-pag') === a) return;
    box.setAttribute('data-pag', a);
  }
  function stato(){
    pagina();
    var on = vivo();
    H.classList.toggle('xf-pausa', !on);
    H.classList.toggle('xf-fuori', !GUSCIO[attiva()]);
    if (lava && on && !rafL) rafL = requestAnimationFrame(giroLava);
  }
  document.addEventListener('gbx:screen', stato);
  document.addEventListener('visibilitychange', stato);
  try { matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', stato); } catch(e){}
  GBX.fondoIn = function(el){
    if (!el || v === 'spento') return null;
    var vv = v === 'lava' ? 'nebbia' : v, s = el.querySelector(':scope>.xf-strato');
    if (!s) { s = document.createElement('div'); s.className = 'xf-strato'; s.setAttribute('aria-hidden', 'true'); el.insertBefore(s, el.firstChild); }
    if (s.getAttribute('data-v') === vv) return s;
    s.innerHTML = ''; s.setAttribute('data-v', vv);
    RICETTE[vv].forEach(function(r){ var c = macchia(COL[r[0]], r[1]); c.className = 'xf-m xf-' + r[2]; s.appendChild(c); });
    return s;
  };
  GBX.fondo = function(n){ if (VAR.indexOf(n) < 0) return v; v = n; try { localStorage.setItem('gbx_fondo', n); } catch(e){} monta(); return v; };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', monta); else monta();
  setTimeout(stato, 1500);
})();
;
(function(){
  'use strict';
  if (window.XG || !window.GBX) return;
  var XG = window.XG = {};
  var ANIM = Element.prototype.animate, RECT = Element.prototype.getBoundingClientRect;
  function $(id){ return document.getElementById(id); }
  function lite(){ return GBX.lite(); }
  function qui(){ try { return (typeof CUR !== 'undefined') && CUR === 'scratch'; } catch(e){ return false; } }
  var B = null, GL = [];
  var RE = /translate3d\((-?[\d.]+)%,\s*(-?[\d.]+)%/;
  function fotogramma(v){
    var m = RE.exec(v); if (!m || !B) return;
    var x = +m[1] / 27.5, y = (+m[2] + 10) / 25;
    B.style.transform = 'perspective(1100px) rotateX(' + (-y * 6).toFixed(2) + 'deg) rotateY(' + (x * 7.5).toFixed(2) + 'deg)';
    var t = 'translate3d(' + (x * 34).toFixed(1) + '%,' + (y * 26).toFixed(1) + '%,0)';
    for (var i = 0; i < GL.length; i++) GL[i].style.transform = t;
  }
  function ponte(){
    if (B.__xgP) return; B.__xgP = true;
    var g = null;
    for (var k = 0; k < B.children.length; k++) if (B.children[k].classList.contains('x-glint')) g = B.children[k];
    if (!g) { g = document.createElement('i'); g.className = 'x-glint'; g.setAttribute('aria-hidden', 'true'); g.innerHTML = '<i></i>'; B.appendChild(g); }
    var vero = g.firstChild, finto = { style:{} };
    Object.defineProperty(finto.style, 'transform', {
      get:function(){ return vero.style.transform; },
      set:function(v){ vero.style.transform = v; try { fotogramma(v); } catch(e){} }
    });
    B.__xk = 1; B.__xg = finto;
    B.classList.add('xg-on');
    B.animate = function(kf, o){
      var s = ''; try { s = JSON.stringify(kf); } catch(e){}
      if (s.indexOf('translateY(-26px)') >= 0) return XG.comparsa();
      if (s.indexOf('translate(') >= 0) return XG.scossa(B, 2);
      return ANIM.call(B, kf, o);
    };
  }
  var CORR = null;
  function tela(){
    var cv = $('csc-foil'), w = $('csc-wrap'); if (!cv || !w || cv.__xg) return; cv.__xg = true;
    function prima(ev){
      CORR = null;
      if (ev.target !== cv || !B || !/rotate/.test(B.style.transform || '')) return;
      if (typeof ev.offsetX !== 'number' || isNaN(ev.offsetX)) return;
      CORR = { l: ev.clientX - ev.offsetX, t: ev.clientY - ev.offsetY };
    }
    function dopo(){ CORR = null; }
    ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'].forEach(function(n){
      w.addEventListener(n, prima, true); w.addEventListener(n, dopo, false);
    });
    cv.getBoundingClientRect = function(){
      var r = RECT.call(cv); if (!CORR) return r;
      var ww = cv.offsetWidth, hh = cv.offsetHeight;
      return { left:CORR.l, top:CORR.t, x:CORR.l, y:CORR.t, width:ww, height:hh, right:CORR.l + ww, bottom:CORR.t + hh };
    };
  }
  function caselle(){
    var g = $('csc-griglia'); if (!g) return;
    GL = [];
    for (var i = 0; i < g.children.length; i++) {
      var c = g.children[i];
      if (!c.__xgG) {
        var a = document.createElement('i'); a.className = 'xg-gl'; a.setAttribute('aria-hidden', 'true'); a.innerHTML = '<i></i>';
        var l = document.createElement('i'); l.className = 'xg-lampo'; l.setAttribute('aria-hidden', 'true');
        c.appendChild(a); c.appendChild(l); c.__xgG = a.firstChild;
        if (GL.length && GL[0].style.transform) c.__xgG.style.transform = GL[0].style.transform;
      }
      GL.push(c.__xgG);
    }
    if (!g.__xg) {
      g.__xg = true;
      try {
        new MutationObserver(function(ms){
          var figli = false;
          ms.forEach(function(m){
            if (m.type === 'childList') { if (m.target === g) figli = true; return; }
            var el = m.target; if (!el.classList || !el.classList.contains('csc-cella')) return;
            var c = el.className, p = el.__xgC || ''; el.__xgC = c;
            if (c === p || !qui()) return;
            if (/\bnuova\b/.test(c) && !/\bnuova\b/.test(p) && /\bs0\b/.test(c) && !/\bspenta\b/.test(c) && !lite())
              setTimeout(function(){ GBX.hap('sel'); }, 560);
            if (/\bxk-boom\b/.test(c) && !/\bxk-boom\b/.test(p)) { setTimeout(function(){ GBX.hap('error'); }, 70); }
          });
          if (figli) caselle();
        }).observe(g, { childList:true, attributes:true, attributeFilter:['class'], subtree:true });
      } catch(e){}
    }
  }
  var MV = 0;
  function molt(){
    var t = $('csc-t-banco'), C = window.CSC; if (!t || !C) return;
    var s = t.querySelector('.xg-molt');
    if (!s) { s = document.createElement('span'); s.className = 'xg-molt'; t.appendChild(s); }
    var v = (C.vinto > 0 && C.posta > 0) ? C.vinto / C.posta : 0;
    var fmt = function(x){ return '×' + x.toFixed(2); };
    if (v <= 0) { s.classList.remove('on'); MV = 0; return; }
    s.classList.add('on');
    if (Math.abs(v - MV) < 1e-6) { s.textContent = fmt(v); return; }
    if (lite() || !qui()) s.textContent = fmt(v); else GBX.count(s, MV, v, fmt, 600);
    MV = v;
  }
  function osservaConti(){
    var b = $('csc-buone'), t = $('csc-t-banco');
    if (b && !b.__xg) { b.__xg = true; try { new MutationObserver(molt).observe(b, { childList:true, characterData:true, subtree:true }); } catch(e){} }
    if (t && !t.__xg) { t.__xg = true; try { new MutationObserver(function(){ if (!t.querySelector('.xg-molt')) molt(); }).observe(t, { childList:true }); } catch(e){} }
  }
  XG.comparsa = function(){
    if (!B || lite() || !ANIM) return null;
    var f = $('csc-foil');
    if (f) try { ANIM.call(f, [{ opacity:0 }, { opacity:1 }], { duration:380, delay:140, easing:'ease-out', fill:'backwards' }); } catch(e){}
    try {
      return ANIM.call(B, [
        { translate:'0 34px', scale:'.965', opacity:0 },
        { translate:'0 -4px', scale:'1.004', opacity:1, offset:.56 },
        { translate:'0 1.5px', scale:'.999', offset:.8 },
        { translate:'0 0', scale:'1', opacity:1 }
      ], { duration:640, easing:'cubic-bezier(.22,.9,.3,1)' });
    } catch(e){ return null; }
  };
  XG.scossa = function(el, f){
    if (!el || lite() || !ANIM) return null;
    try {
      return ANIM.call(el, [{ translate:'0 0' }, { translate:(-f) + 'px 0' }, { translate:(f * .7) + 'px 0' }, { translate:(-f * .35) + 'px 0' }, { translate:'0 0' }],
                       { duration:300, easing:'ease-out' });
    } catch(e){ return null; }
  };
  function luce(){
    if (!B || lite() || !ANIM) return;
    var l = document.createElement('i'); l.className = 'xg-luce'; l.setAttribute('aria-hidden', 'true'); l.innerHTML = '<i></i>';
    B.insertBefore(l, B.querySelector('.casa-esito'));
    var a = ANIM.call(l.firstChild, [
      { opacity:0, transform:'scale(.35)' },
      { opacity:1, transform:'scale(1)', offset:.32 },
      { opacity:0, transform:'scale(1.45)' }
    ], { duration:1400, easing:'cubic-bezier(.2,.8,.2,1)' });
    a.onfinish = function(){ l.remove(); };
  }
  function avvolgiCasa(){
    if (!window.CASA || CASA.__xg) return; CASA.__xg = true;
    var p0 = CASA.scoppio;
    CASA.scoppio = function(el, o){
      if (qui() && el && el.closest && el.closest('#scratch') && el.id !== 'csc-foil') return;
      return p0.apply(this, arguments);
    };
    var e0 = CASA.esito;
    CASA.esito = function(cont, tipo){
      var box = e0.apply(this, arguments);
      try { if (cont && cont.id === 'csc-biglietto' && (tipo === 'win' || tipo === 'big' || tipo === 'push')) luce(); } catch(e){}
      return box;
    };
  }
  function entra(anima){
    B = $('csc-biglietto'); if (!B) return;
    avvolgiCasa(); ponte(); tela(); caselle(); osservaConti(); molt();
    GBX.tilt($('scratch'));
    if (anima) XG.comparsa();
  }
  document.addEventListener('gbx:screen', function(e){
    var d = e.detail || {};
    if (d.id === 'scratch') entra(true);
  });
  avvolgiCasa();
  try { if (qui()) entra(false); } catch(e){}
})();
;
(function(){
  'use strict';
  if (window.XH || !window.GBX) return;
  var XH = window.XH = {};
  var L = GBX.L;
  function $(s, r){ return (r || document).querySelector(s); }
  function crea(html){ var d = document.createElement('div'); d.innerHTML = html; return d.firstElementChild; }
  function oss(el, fn, o){ if (!el || !window.MutationObserver) return; try { new MutationObserver(fn).observe(el, o || { childList:true, characterData:true, subtree:true }); } catch(e){} }
  function riduci(){ try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){ return false; } }
  var IC = {
    piu: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    su: '<svg viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
    spade: '<svg viewBox="0 0 24 24"><path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M9.5 17.5 21 6V3h-3L6.5 14.5M11 19l-6-6M8 16l-4 4M5 21l-2-2"/></svg>',
    coppa: '<svg viewBox="0 0 24 24"><path d="M7 4h10v4a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M12 13v4M8.5 20h7M10 17h4"/></svg>',
    bersaglio: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/></svg>',
    podio: '<svg viewBox="0 0 24 24"><path d="M9 20V9h6v11M3 20v-6h6M15 20v-8h6v8M2 20h20M12 4.2l.9 1.8 2 .3-1.4 1.4.3 2-1.8-.9-1.8.9.3-2-1.4-1.4 2-.3z"/></svg>',
    regalo: '<svg viewBox="0 0 24 24"><rect x="3.5" y="9.5" width="17" height="10.5" rx="1.6"/><path d="M2.5 9.5h19M12 9.5V20M12 9.5S9.6 4.2 7.2 6.1 12 9.5 12 9.5ZM12 9.5s2.4-5.3 4.8-3.4S12 9.5 12 9.5Z"/></svg>',
    scudo: '<svg viewBox="0 0 24 24"><path d="M12 3 5 6v5.5c0 4.4 3 8 7 9.5 4-1.5 7-5.1 7-9.5V6z"/><path d="m8.8 12 2.2 2.2 4.2-4.4"/></svg>',
    stella: '<svg viewBox="0 0 24 24"><path d="M12 3.6l2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8z"/></svg>',
    chev: '<svg class="xh-chev" viewBox="0 0 24 24"><path d="m9.5 6 6 6-6 6"/></svg>',
    pool8: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="11" r="3.4"/><path d="M12 9.6v2.8"/></svg>',
    scopa: '<svg viewBox="0 0 24 24"><rect x="4" y="5" width="10" height="14" rx="2" transform="rotate(-8 9 12)"/><rect x="10" y="5" width="10" height="14" rx="2" transform="rotate(8 15 12)"/></svg>',
    uno: '<svg viewBox="0 0 24 24"><rect x="6" y="3.5" width="12" height="17" rx="2.4"/><ellipse cx="12" cy="12" rx="3.6" ry="5.6" transform="rotate(28 12 12)"/></svg>',
    boxe: '<svg viewBox="0 0 24 24"><path d="M7 11V7.5A3.5 3.5 0 0 1 10.5 4h3A4.5 4.5 0 0 1 18 8.5V13a4 4 0 0 1-4 4H9.5A3.5 3.5 0 0 1 6 13.5V11h4"/><path d="M8 17v3.5h8V17"/></svg>',
    gioco: '<svg viewBox="0 0 24 24"><rect x="2.5" y="7" width="19" height="10" rx="4.5"/><path d="M7 10.5v3M5.5 12h3"/><circle cx="16.2" cy="11" r="1"/><circle cx="18.4" cy="13.4" r="1"/></svg>'
  };
  function riga(cls, onclick, ic, titolo, sotto, destra){
    return '<button type="button" class="x-riga ' + cls + '" onclick="' + onclick + '" data-x-silent>' +
      '<span class="x-ic">' + ic + '</span><span class="x-rt"><b>' + titolo + '</b><span>' + sotto + '</span></span>' + (destra || '') + IC.chev + '</button>';
  }
  var CASA = [
    { go:'bj',       t:'t-bj',      ic:'cards',   wide:1, n:['Blackjack','Blackjack'],          m:['Batti il banco a 21','Beat the dealer to 21'] },
    { go:'crash',    t:'t-crash',   ic:'crash',   n:['Crash','Crash'],                          m:['Incassa in tempo','Cash out in time'] },
    { go:'roulette', t:'t-roul',    ic:'wheel',   n:['Roulette','Roulette'],                    m:['Un solo zero','Single zero'] },
    { go:'dice',     t:'t-dice',    ic:'dice',    n:['Dadi','Dice'],                            m:['Sopra o sotto','Over or under'] },
    { go:'slots',    t:'t-slots',   ic:'slot',    n:['Slot','Slots'],                           m:['Giri gratis','Free spins'] },
    { go:'poker',    t:'t-poker',   ic:'cards2',  n:['Poker','Poker'],                          m:['Casino Hold’em','Casino Hold’em'] },
    { go:'plinko',   t:'t-plinko',  ic:'plinko',  n:['Plinko','Plinko'],                        m:['La pallina decide','The ball decides'] },
    { go:'vault',    t:'t-vault',   ic:'vault',   n:['Caveau','Vault'],                         m:['Apri la cassaforte','Crack the safe'] },
    { go:'wheel',    t:'t-wheel',   ic:'wheel2',  n:['Ruota','Wheel'],                          m:['Un giro, un premio','One spin, one prize'] },
    { go:'scratch',  t:'t-scratch', ic:'scratch', n:['Gratta','Scratch'],                       m:['Diamanti, non bombe','Gems, not bombs'] },
    { go:'botrr',    t:'t-botrr',   ic:'rr',      n:['Roulette russa','Russian roulette'],      m:['Contro il bot','Against the bot'] },
    { go:'lotto',    t:'',          ic:'lotto',   wide:1, n:['Lotteria','Crypto Lotto'],        m:['Biglietto €2 · lun e gio 20:00','Ticket €2 · Mon & Thu 20:00'] }
  ];
  function nm(a){ return L(a[0], a[1]); }
  function moltiplicatore(t){
    if (!t) return '';
    var b = $('#home .gb-tile.' + t + ' .gb-badge'); var v = b ? (b.textContent || '').trim() : '';
    if (/^new$/i.test(v)) return 'NEW';
    return /^[×x]\s*[\d.,]+$/i.test(v) ? v.replace(/^x/i, '×') : '';
  }
  function icona(cls, src){
    return '<img class="' + cls + '" src="' + src + '" alt="" draggable="false" decoding="async"' +
      ' onload="this.classList.add(\'ok\')" onerror="this.remove()">';
  }
  function numDa(txt){ var m = String(txt || '').replace(/,/g, '').match(/-?\d+(\.\d+)?/); return m ? parseFloat(m[0]) : null; }
  function scriviAmt(v){
    var s = (Math.round(v * 100) / 100).toFixed(2), p = s.split('.');
    XH.amtI.textContent = '€' + p[0]; XH.amtD.textContent = '.' + p[1];
  }
  function wm(cls){ return '<span class="xh-wm ' + (cls || '') + '"><b>Gambler</b><i>Bot</i></span>'; }
  XH.monta = function(){
    var home = $('#home'); if (!home || home.classList.contains('xh-on')) return;
    var sc = home.querySelector('.scroll'); if (!sc) return;
    var root = $('#xh-root');
    if (!root) { root = crea('<div id="xh-root" class="xh-root"></div>'); sc.insertBefore(root, sc.firstChild); }
    var amb = home.querySelector('.xh-amb');
    if (!amb) { amb = crea('<div class="x-amb xh-amb" aria-hidden="true"><div><i></i></div></div>'); home.insertBefore(amb, sc); }
    var strato = amb.firstElementChild;
    if (strato && !strato.querySelector('.xh-nastri')) strato.appendChild(crea('<span class="xh-nastri"><i></i><i></i><i></i><i></i><i></i></span>'));
    var cv = crea('<canvas class="xh-monete" aria-hidden="true"></canvas>');
    home.insertBefore(cv, sc);
    var top = crea('<div class="xh-top x-navf">' +
      '<button type="button" class="xh-navt" data-x-silent aria-label="Gambler Bot" tabindex="-1"><span class="xh-badge xh-badge--s xh-marchio"><img src="gbx_marchio.webp" alt="" onerror="this.onerror=null;this.src=\'gb-logo.webp\';this.parentNode.classList.remove(\'xh-marchio\')"></span>' + wm('xh-wm--s') + '</button>' +
      '<div class="xh-navr">' +
        '<button type="button" class="xh-hbal" data-x-silent aria-label="' + L('Saldo', 'Balance') + '">€0.00</button>' +
        '<button type="button" class="xh-av" onclick="go(\'profile\')" data-x-silent aria-label="' + L('Profilo', 'Profile') + '">' +
          '<svg class="xh-ring" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18.5" stroke="rgba(255,255,255,.14)" stroke-width="1.5" fill="none"/>' +
          '<circle class="v" cx="20" cy="20" r="18.5" stroke="#8b83f0" stroke-width="1.8" fill="none" stroke-dasharray="116.2" stroke-dashoffset="116.2" stroke-linecap="round"/></svg>' +
          '<span class="xh-ini">G</span><b class="xh-lv">0</b></button>' +
      '</div></div>');
    home.insertBefore(top, sc);
    root.appendChild(crea('<h1 class="xh-large" role="button" tabindex="0" data-x-silent><span class="xh-badge xh-marchio"><img src="gbx_marchio_512.webp" alt="" onerror="this.onerror=null;this.src=\'gb-logo.webp\';this.parentNode.classList.remove(\'xh-marchio\')"></span>' + wm() + '</h1>'));
    var wal = crea('<div class="xh-wallet x-sv">' +
      '<div class="xh-wl-h"><span class="xh-cap">' + L('Saldo', 'Balance') + '</span></div>' +
      '<div class="xh-amt"><span class="xh-ai">€0</span><small class="xh-ad">.00</small></div>' +
      '<div class="xh-btns">' +
        '<button type="button" class="xh-pill xh-pill--solid" onclick="go(\'deposit\')" data-x-silent>' + IC.piu + L('Deposita', 'Deposit') + '</button>' +
        '<button type="button" class="xh-pill" onclick="go(\'withdraw\')" data-x-silent>' + IC.su + L('Preleva', 'Withdraw') + '</button>' +
      '</div></div>');
    root.appendChild(wal);
    XH.amtI = wal.querySelector('.xh-ai'); XH.amtD = wal.querySelector('.xh-ad'); XH.amt = wal.querySelector('.xh-amt');
    var stato = $('#bal-status'); if (stato) wal.querySelector('.xh-wl-h').appendChild(stato);
    var gbf = $('#gbf-prova');
    if (gbf) {
      var NOMI = { pool8:['Biliardo','Pool'], scopa:['Scopa','Scopa'], uno:['UNO','UNO'], boxe:['Boxe','Boxing'] };
      var tasti = [].map.call(gbf.querySelectorAll('.gbf-row button'), function(b){
        var oc = b.getAttribute('onclick') || '', k = (oc.match(/'([a-z0-9_]+)'\s*\)\s*;?\s*$/i) || [])[1] || '';
        var nome = NOMI[k] ? nm(NOMI[k]) : (b.textContent || '').replace(/^[^A-Za-zÀ-ÿ0-9]+/, '').trim();
        return '<button type="button" class="xh-free-b" data-x-silent onclick="' + oc.replace(/"/g, '&quot;') + '"><span class="x-ic xh-free-ic">' + (k ? '<img src="gbx_pv_' + ((window.GBX && GBX.gioco) ? GBX.gioco(k) : k) + '.webp" alt="" draggable="false" decoding="async" onerror="this.remove()">' : '') + '</span><span>' + nome + '</span></button>';
      }).join('');
      gbf.classList.add('xh-free');
      gbf.insertBefore(crea('<div class="x-sez xh-sez">' + L('Gioca gratis', 'Play for free') + '<span>' + L('contro i bot', 'against the bots') + '</span></div>'), gbf.firstChild);
      gbf.appendChild(crea('<div class="xh-free-g x-lastra x-sv">' + tasti + '</div>'));
      root.appendChild(gbf);
    }
    root.appendChild(crea('<div class="x-sez xh-sez">Arena</div>'));
    root.appendChild(crea('<div class="x-gruppo x-lastra xh-grp x-sv">' +
      riga('xh-r-arena', "go('duel')", IC.spade, L('Arena PvP', 'PvP Arena'),
        '<i class="xh-dot"></i><b class="dm-live-n">·</b>&nbsp;' + L('in linea adesso', 'online now')) +
      riga('xh-r-trn', "go('torneo')", IC.coppa, L('Tornei', 'Tournaments'),
        '<span class="trn-next-txt"></span><span class="xh-trn-vuoto">' + L('Calendario e iscrizioni', 'Schedule and sign-up') + '</span>',
        '<span class="trn-flag xh-flag"></span>') +
      riga('xh-r-ev', "go('evento')", IC.stella, L('Evento', 'Event'), L('In corso adesso', 'Happening now')) +
    '</div>'));
    try { var vtx = $('#home .duel-mega .trn-next-txt'), vcard = vtx && vtx.closest('.trn-card'), mio = root.querySelector('.xh-r-trn .trn-next-txt');
      if (vtx && vcard && vcard.style.display !== 'none' && vtx.innerHTML) { mio.innerHTML = vtx.innerHTML; mio.setAttribute('data-st', 'pieno'); }
      var vf = $('#home .duel-mega .trn-flag'); if (vf && vf.textContent) root.querySelector('.xh-r-trn .trn-flag').textContent = vf.textContent; } catch(e){}
    root.appendChild(crea('<div class="x-sez xh-sez">' + L('Per te', 'For you') + '</div>'));
    root.appendChild(crea('<div class="x-gruppo x-lastra xh-grp x-sv">' +
      riga('xh-r-quest', "go('challenges')", IC.bersaglio, L('Quest', 'Quests'), L('Sfide settimanali e stagionali', 'Weekly and season challenges')) +
      riga('xh-r-top', "go('leaderboard')", IC.podio, L('Classifica', 'Leaderboard'), L('I migliori della settimana', 'Top players of the week')) +
      riga('xh-r-amici', "go('friends')", IC.regalo, L('Invita amici', 'Invite friends'), L('Guadagna con chi inviti', 'Earn from the friends you invite'), '<span class="xh-cnt" hidden>0</span>') +
      riga('xh-r-fair', "go('fair')", IC.scudo, L('Equità', 'Fairness'), L('Verifica ogni giocata', 'Verify every bet')) +
    '</div>'));
    root.appendChild(crea('<div class="x-sez xh-sez xh-casa-lbl">' + L('Contro la casa', 'Against the house') + '<span>' + CASA.length + '</span></div>'));
    var grid = crea('<div class="xh-grid"></div>');
    CASA.forEach(function(h){
      var mul = moltiplicatore(h.t), tag = '', meta = nm(h.m);
      if (h.go === 'lotto') tag = '<span class="xh-tag">Jackpot <b class="xh-jkp"></b></span>';
      else if (h.wide && mul) tag = '<span class="xh-tag">' + L('Paga fino a', 'Pays up to') + ' <b>' + mul + '</b></span>';
      var mtag = '';
      if (h.go !== 'lotto' && !(h.wide && mul) && mul) mtag = '<b class="xh-mul' + (mul === 'NEW' ? ' xh-new' : '') + '">' + (mul === 'NEW' ? L('Nuovo', 'New') : mul) + '</b>';
      grid.appendChild(crea('<button type="button" class="xh-tile x-lastra x-sv' + (h.wide ? ' wide' : '') + '" data-x-silent onclick="go(\'' + h.go + '\')" data-xh-go="' + h.go + '">' +
        '<div class="xh-art">' + icona('xh-icx', 'gbx_ic_' + h.ic + '.webp') + '</div>' + tag +
        '<div class="xh-tt"><div class="xh-name"><span>' + nm(h.n) + '</span>' + mtag + '</div><div class="xh-meta">' + meta + '</div></div></button>'));
    });
    root.appendChild(grid);
    var jk = $('#home-lotto-jkp'), jkPosto = grid.querySelector('.xh-jkp');
    if (jk && jkPosto) { jkPosto.parentNode.replaceChild(jk, jkPosto); jk.classList.add('xh-jkp'); }
    else if (jkPosto) jkPosto.textContent = '€30.000';
    root.appendChild(crea('<div class="x-sez xh-sez">' + L('Avventura', 'Adventure') + '</div>'));
    root.appendChild(crea('<button type="button" class="xh-run x-lastra x-sv" onclick="go(\'grun\')" data-x-silent>' +
      '<div class="xh-run-art"><div class="xh-scala"><i></i><i></i><i></i><i></i><b class="xh-moneta"></b></div>' +
        '<img class="xh-run-ic" src="gbx_ic_run.webp" alt="" draggable="false" decoding="async" onload="this.classList.add(\'ok\');this.parentNode.classList.add(\'xh-ic-ok\')" onerror="this.remove()"></div>' +
      '<div class="xh-run-t"><span class="xh-run-k">' + L('Roguelike · contro la Casa', 'Roguelike · vs THE HOUSE') + '</span><h3>Gambler’s Run</h3>' +
      '<p>' + L('Scendi piano dopo piano. Incassa prima di cadere.', 'Descend floor by floor. Cash out before you fall.') + '</p></div></button>'));
    home.classList.add('xh-on');
    var modo = 'vetro'; try { var m = localStorage.getItem('gbx_scr'); if (/^(vetro|cilindro|onda|magnete)$/.test(m || '')) modo = m; } catch(e){}
    home.setAttribute('data-scr', modo);
    XH.home = home; XH.sc = sc; XH.top = top; XH.root = root; XH.cv = cv;
    collega(home, sc, top, wal, root);
    XH.monete = function(){ cv.style.display = ''; monete(home, sc, cv); };
    XH.monete();
  };
  function collega(home, sc, top, wal, root){
    root.addEventListener('click', function(e){
      var t = e.target.closest && e.target.closest('.xh-tile,.xh-run,.x-riga,.xh-pill,.xh-free-b');
      if (t) GBX.fx(t.classList.contains('xh-pill') ? 'tap' : 'open');
    }, true);
    function livelloToast(){
      GBX.fx('soft');
      try {
        var lv = getLevel(+S.xp || 0);
        var msg = 'Lv.' + lv.level + ' ' + lv.title + (lv.next ? ' · ' + L('mancano ', '') + lv.toNext + ' XP ' + L('al Lv.', 'to Lv.') + lv.next.lv : ' · ' + L('livello massimo', 'max level'));
        if (typeof toast === 'function') toast(msg, '', 2600);
      } catch(e){}
    }
    var large = root.querySelector('.xh-large');
    large.addEventListener('click', livelloToast);
    top.querySelector('.xh-navt').addEventListener('click', function(){ GBX.fx('swipe'); try { sc.scrollTo({ top:0, behavior:'smooth' }); } catch(e){ sc.scrollTop = 0; } });
    var hbal = top.querySelector('.xh-hbal');
    hbal.addEventListener('click', function(){ GBX.fx('tap'); go('wallet'); });
    top.querySelector('.xh-av').addEventListener('click', function(){ GBX.fx('open'); }, true);
    try {
      var u = window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe && Telegram.WebApp.initDataUnsafe.user, ini = top.querySelector('.xh-ini');
      if (u && u.first_name) ini.textContent = String(u.first_name).trim().charAt(0).toUpperCase() || 'G';
      if (u && u.photo_url) { var im = new Image(); im.alt = ''; im.className = 'xh-foto'; im.onload = function(){ ini.textContent = ''; ini.appendChild(im); }; im.src = u.photo_url; }
    } catch(e){}
    var hb = $('#home-bal'), vecchio = null;
    function saldo(){
      var txt = hb ? hb.textContent : '', v = numDa(txt);
      hbal.textContent = txt || '';
      if (v === null) { XH.amtI.textContent = txt; XH.amtD.textContent = ''; return; }
      if (vecchio === null || Math.abs(v - vecchio) < 0.005) { if (vecchio === null) scriviAmt(v); vecchio = v; return; }
      var da = vecchio; vecchio = v;
      var proxy = {}; try { Object.defineProperty(proxy, 'textContent', { set:function(x){ scriviAmt(+x); } }); } catch(e){ scriviAmt(v); return; }
      GBX.count(proxy, da, v, function(x){ return String(x); }, 700);
      if (v > da && home.classList.contains('active') && da > 0) {
        GBX.fx('coin');
        XH.amt.classList.remove('xh-up'); void XH.amt.offsetWidth; XH.amt.classList.add('xh-up');
      }
    }
    oss(hb, saldo); saldo();
    var av = top.querySelector('.xh-av'), ring = av.querySelector('.xh-ring .v'), lvN = av.querySelector('.xh-lv');
    function livello(){
      try {
        var lv = getLevel(+S.xp || 0), pct = lv.next ? lv.pct : 100;
        lvN.textContent = lv.level;
        ring.setAttribute('stroke-dashoffset', (116.2 * (1 - Math.max(0.02, pct / 100))).toFixed(1));
        av.setAttribute('aria-label', L('Profilo', 'Profile') + ' · Lv.' + lv.level + ' ' + lv.title);
      } catch(e){
        var n = $('#lvl-num'); if (n) lvN.textContent = (n.textContent || '').replace(/\D/g, '') || '0';
      }
    }
    oss($('#lvl-num'), livello); livello();
    var rb = $('#refer-badge'), gn = root.querySelector('.xh-r-amici .xh-cnt');
    function inviti(){ if (!rb || !gn) return; var vis = rb.style.display !== 'none' && (rb.textContent || '').trim() && rb.textContent.trim() !== '0';
      gn.hidden = !vis; if (vis) gn.textContent = rb.textContent.trim(); }
    oss(rb, inviti, { childList:true, characterData:true, subtree:true, attributes:true, attributeFilter:['style'] }); inviti();
    GBX.tilt(home);
    var fermo = 0, inPausa = false;
    sc.addEventListener('scroll', function(){
      if (!inPausa) { inPausa = true; GBX.untilt(home); }
      clearTimeout(fermo); fermo = setTimeout(function(){ inPausa = false; GBX.tilt(home); }, 220);
    }, { passive:true });
    var conTL = false; try { conTL = CSS.supports('animation-timeline: scroll()'); } catch(e){}
    if (!conTL) home.classList.add('xh-notl');
    var velo = false, inCoda = false;
    function guarda(){ inCoda = false; var s = sc.scrollTop > 44; if (s !== velo) { velo = s; home.classList.toggle('xh-scr', s); } }
    sc.addEventListener('scroll', function(){ if (!inCoda) { inCoda = true; requestAnimationFrame(guarda); } }, { passive:true });
    guarda();
    var ultimo = -1;
    sc.addEventListener('scrollend', function(){ if (home.getAttribute('data-scr') !== 'magnete') return;
      var y = Math.round(sc.scrollTop); if (Math.abs(y - ultimo) > 20) { ultimo = y; GBX.fx('tick'); } });
    if (typeof window.obCasino === 'function' && !window.obCasino.__xh) {
      var ob = window.obCasino;
      var nuovo = function(){ var r = ob.apply(this, arguments);
        setTimeout(function(){ var l = root.querySelector('.xh-casa-lbl'); if (l) try { sc.scrollTo({ top: Math.max(0, l.offsetTop - 60), behavior:'smooth' }); } catch(e){} }, 800);
        return r; };
      nuovo.__xh = true; try { window.obCasino = nuovo; } catch(e){}
    }
  }
  function inerzia(sc){
    var pts = [], lastNative = 0, raf = 0, mio = false;
    sc.addEventListener('scroll', function(){ if (!mio) lastNative = performance.now(); }, { passive:true });
    sc.addEventListener('touchstart', function(e){ cancelAnimationFrame(raf); raf = 0; pts = [{ y:e.touches[0].clientY, t:performance.now() }]; }, { passive:true });
    sc.addEventListener('touchmove', function(e){ pts.push({ y:e.touches[0].clientY, t:performance.now() }); if (pts.length > 6) pts.shift(); }, { passive:true });
    sc.addEventListener('touchend', function(){
      var t0 = performance.now(); if (pts.length < 2) return;
      var a = pts[0], b = pts[pts.length - 1]; if (t0 - b.t > 80) return;
      var v = (a.y - b.y) / Math.max(8, b.t - a.t);
      if (Math.abs(v) < .25) return;
      setTimeout(function(){
        if (lastNative > t0 + 5) return;
        var last = performance.now();
        (function step(n){ var dt = Math.min(32, n - last); last = n;
          mio = true; var prima = sc.scrollTop; sc.scrollTop += v * dt; mio = false;
          v *= Math.pow(.955, dt / 16);
          if (Math.abs(v) > .02 && sc.scrollTop !== prima) raf = requestAnimationFrame(step); else raf = 0;
        })(last + 16);
      }, 70);
    }, { passive:true });
  }
  function monete(home, sc, cv){
    var cx = cv.getContext && cv.getContext('2d'); if (!cx) return;
    var DPR = Math.min(2, window.devicePixelRatio || 1), W = 0, H = 0, MON = [], raf = 0, last = 0, lastre = [], sporco = true, conta = 0;
    function spento(){ return GBX.lite() || riduci(); }
    function moneta(tipo, R, sfoca){
      var pad=sfoca?14:2, c=document.createElement('canvas'), d=(R+pad)*2; c.width=c.height=Math.ceil(d*DPR);
      var x=c.getContext('2d'); x.scale(DPR,DPR); if(sfoca) x.filter='blur(5px)';
      x.translate(d/2,d/2);
      var Lg=tipo==='btc'
        ? {v:64, bg:'#f7931a', lato:'#9a5a0c', f:'m46.11 27.441c.637-4.258-2.605-6.547-7.038-8.074l1.438-5.768-3.511-.875-1.4 5.616c-.923-.23-1.871-.447-2.813-.662l1.41-5.653-3.509-.875-1.439 5.766c-.764-.174-1.514-.346-2.242-.527l.004-.018-4.842-1.209-.934 3.75s2.605.597 2.55.634c1.422.355 1.679 1.296 1.636 2.042l-1.638 6.571c.098.025.225.061.365.117-.117-.029-.242-.061-.371-.092l-2.296 9.205c-.174.432-.615 1.08-1.609.834.035.051-2.552-.637-2.552-.637l-1.743 4.019 4.569 1.139c.85.213 1.683.436 2.503.646l-1.453 5.834 3.507.875 1.439-5.772c.958.26 1.888.5 2.798.726l-1.434 5.745 3.511.875 1.453-5.823c5.987 1.133 10.489.676 12.384-4.739 1.527-4.36-.076-6.875-3.226-8.515 2.294-.529 4.022-2.038 4.483-5.155zm-8.022 11.249c-1.085 4.36-8.426 2.003-10.806 1.412l1.928-7.729c2.38.594 10.012 1.77 8.878 6.317zm1.086-11.312c-.99 3.966-7.1 1.951-9.082 1.457l1.748-7.01c1.982.494 8.365 1.416 7.334 5.553z'}
        : {v:56, bg:'#0098ea', lato:'#005a8c', f:'M37.5603 15.6277H18.4386C14.9228 15.6277 12.6944 19.4202 14.4632 22.4861L26.2644 42.9409C27.0345 44.2765 28.9644 44.2765 29.7345 42.9409L41.5381 22.4861C43.3045 19.4251 41.0761 15.6277 37.5627 15.6277H37.5603ZM26.2548 36.8068L23.6847 31.8327L17.4833 20.7414C17.0742 20.0315 17.5795 19.1218 18.4362 19.1218H26.2524V36.8092L26.2548 36.8068ZM38.5108 20.739L32.3118 31.8351L29.7417 36.8068V19.1194H37.5579C38.4146 19.1194 38.9199 20.0291 38.5108 20.739Z'};
      x.beginPath(); x.arc(0,R*.1,R,0,7); x.fillStyle=Lg.lato; x.fill();
      x.beginPath(); x.arc(0,0,R,0,7); x.fillStyle=Lg.bg; x.fill();
      x.save(); var k=2*R/Lg.v; x.scale(k,k); x.translate(-Lg.v/2,-Lg.v/2); x.fillStyle='#fff'; x.fill(new Path2D(Lg.f)); x.restore();
      var g=x.createRadialGradient(-R*.4,-R*.5,R*.05,-R*.2,-R*.25,R*1.1);
      g.addColorStop(0,'rgba(255,255,255,.35)'); g.addColorStop(.45,'rgba(255,255,255,.06)'); g.addColorStop(1,'rgba(0,0,0,.18)');
      x.beginPath(); x.arc(0,0,R,0,7); x.fillStyle=g; x.fill();
      return {c:c, d:d};
    }
    function crea(){
      MON = [];
      for (var i = 0; i < 8; i++) {
        var tipo = i % 2 ? 'ton' : 'btc', R = 7 + Math.random() * 7, prof = R / 14;
        MON.push({ R:R, a:.16 + prof * .24, x:Math.random() * W, y:Math.random() * H, v:10 + prof * 26, o:Math.random() * 6.3, w:.4 + Math.random() * .6,
          n:moneta(tipo, R, false), s:moneta(tipo, R, true) });
      }
    }
    function misura(){ var r = home.getBoundingClientRect(); W = r.width; H = r.height; cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); }
    function rilastre(){
      var hr = home.getBoundingClientRect(); lastre = [];
      [].forEach.call(home.querySelectorAll('.x-lastra,.xh-pill,.xh-hbal'), function(e){ var b = e.getBoundingClientRect();
        if (!b.width || b.bottom < hr.top || b.top > hr.bottom) return; lastre.push([b.left - hr.left, b.top - hr.top, b.width, b.height, e.classList.contains('xh-tile') || e.classList.contains('xh-run') ? 24 : 20]); });
      sporco = false;
    }
    function rr(q){ if (cx.roundRect) cx.roundRect(q[0], q[1], q[2], q[3], Math.min(q[4], q[3] / 2)); else cx.rect(q[0], q[1], q[2], q[3]); }
    sc.addEventListener('scroll', function(){ sporco = true; }, { passive:true });
    addEventListener('resize', function(){ W = 0; sporco = true; });
    function frame(t){
      raf = 0;
      if (!home.classList.contains('active') || document.hidden || spento()) { cx.setTransform(1, 0, 0, 1, 0, 0); cx.clearRect(0, 0, cv.width, cv.height); return; }
      raf = requestAnimationFrame(frame);
      var dt = Math.min(.05, (t - (last || t)) / 1000); last = t;
      if (!W) { misura(); if (!MON.length) crea(); }
      if (!W) return;
      if (sporco || (++conta % 20 === 0)) rilastre();
      MON.forEach(function(m){ m.y += m.v * dt; m.o += dt * m.w; m.x += Math.sin(m.o) * 6 * dt; if (m.y > H + 30) { m.y = -30; m.x = Math.random() * W; } });
      cx.setTransform(DPR, 0, 0, DPR, 0, 0); cx.clearRect(0, 0, W, H);
      cx.save(); cx.beginPath(); cx.rect(0, 0, W, H); lastre.forEach(rr); cx.clip('evenodd');
      MON.forEach(function(m){ cx.globalAlpha = m.a; cx.save(); cx.translate(m.x, m.y); cx.rotate(Math.sin(m.o) * .5); cx.drawImage(m.n.c, -m.n.d / 2, -m.n.d / 2, m.n.d, m.n.d); cx.restore(); });
      cx.restore();
      if (lastre.length) {
        cx.save(); cx.beginPath(); lastre.forEach(rr); cx.clip();
        MON.forEach(function(m){ cx.globalAlpha = m.a * .42; cx.drawImage(m.s.c, m.x - m.s.d / 2, m.y - m.s.d / 2, m.s.d, m.s.d); });
        cx.restore();
      }
      cx.globalAlpha = 1;
    }
    function avvia(){ if (!raf && home.classList.contains('active') && !spento()) { last = 0; sporco = true; raf = requestAnimationFrame(frame); } }
    XH.moneteAvvia = avvia;
    document.addEventListener('gbx:screen', function(e){ if (e.detail && e.detail.id === 'home') avvia(); });
    document.addEventListener('visibilitychange', function(){ if (!document.hidden) avvia(); });
    avvia();
  }
  XH.scorrimento = function(m){
    if (!/^(vetro|cilindro|onda|magnete)$/.test(m || '')) return;
    var h = $('#home'); if (h) h.setAttribute('data-scr', m);
    try { localStorage.setItem('gbx_scr', m); } catch(e){}
  };
  XH.nav = function(){
    var nav = $('.bnav'); if (!nav || nav.__xh) return; nav.__xh = true;
    document.body.classList.add('xh-nav');
    var g = crea('<span class="xh-goccia" aria-hidden="true"></span>');
    nav.insertBefore(g, nav.firstChild);
    var lastX = null, lastW = null;
    function sposta(anima){
      var on = nav.querySelector('.bnav-btn.on');
      if (!on || !nav.offsetWidth) { if (g.classList.contains('on')) g.classList.remove('on'); return; }
      var w = on.offsetWidth, x = on.offsetLeft;
      if (w !== lastW) { g.style.width = w + 'px'; lastW = w; }
      if (x === lastX) { if (!g.classList.contains('on')) g.classList.add('on'); return; }
      g.style.transform = 'translateX(' + x + 'px)';
      if (!g.classList.contains('on')) g.classList.add('on');
      if (anima && lastX !== null && lastX !== x && g.animate && !GBX.lite() && !riduci()) {
        var da = lastX;
        if (g.__anim) { try { var mt = new DOMMatrixReadOnly(getComputedStyle(g).transform); da = mt.m41; } catch(e){} try { g.__anim.cancel(); } catch(e){} }
        var k = 420, c = 30, d = x - da, pos = 0, vel = 0, dt = 1 / 120, fr = [], T = 0, picco = 1;
        for (var n = 0; n < 2400; n++) { if (n % 2 === 0) fr.push([pos, vel, T]); var acc = k * (1 - pos) - c * vel; vel += acc * dt; pos += vel * dt; T += dt;
          if (n > 30 && Math.abs(1 - pos) < 0.0015 && Math.abs(vel) < 0.02) break; }
        fr.push([1, 0, T]);
        for (var q = 0; q < fr.length; q++) picco = Math.max(picco, Math.abs(fr[q][1]));
        var ks = fr.map(function(f){
          var st = Math.min(0.14, Math.abs(f[1]) / picco * 0.14 * Math.min(1, Math.abs(d) / 120));
          return { transform:'translateX(' + (da + d * f[0]).toFixed(2) + 'px) scale(' + (1 + st).toFixed(4) + ',' + (1 - st * 0.45).toFixed(4) + ')', offset: f[2] / T };
        });
        ks[0].offset = 0; ks[ks.length - 1].offset = 1;
        g.style.transition = 'none';
        g.__anim = g.animate(ks, { duration: Math.round(T * 1000), easing:'linear' });
        g.__anim.onfinish = function(){ g.style.transition = ''; g.__anim = null; };
        try { var ic = on.querySelector('.gb-ic, svg'); if (ic && ic.animate) ic.animate([{ transform:'scale(.86)' }, { transform:'scale(1.08)', offset:.45 }, { transform:'scale(.98)', offset:.75 }, { transform:'scale(1)' }], { duration:420, easing:'cubic-bezier(.3,.7,.4,1)' }); } catch(e){}
        try { GBX.hap('sel'); } catch(e){}
      }
      lastX = x;
    }
    oss(nav, function(rs){
      for (var i = 0; i < rs.length; i++) { var t = rs[i].target;
        if (t === g || t === nav && rs[i].type === 'attributes') continue;
        if (rs[i].type === 'childList' || (t.classList && t.classList.contains('bnav-btn'))) { sposta(true); return; } }
    }, { attributes:true, attributeFilter:['class'], subtree:true, childList:true });
    addEventListener('resize', function(){ sposta(false); });
    document.addEventListener('gbx:screen', function(){ requestAnimationFrame(function(){ sposta(false); }); });
    nav.setAttribute('data-x-silent', '');
    nav.addEventListener('pointerdown', function(e){ var b = e.target.closest && e.target.closest('.bnav-btn'); if (b && !b.classList.contains('on')) GBX.fx('swipe'); }, { passive:true });
    requestAnimationFrame(function(){ sposta(false); });
    setTimeout(function(){ sposta(false); }, 600);
  };
  document.addEventListener('gbx:screen', function(e){ if (e.detail && e.detail.id === 'home') GBX.tiltWake(); });
  function avvia(){ try { XH.monta(); } catch(e){ try { console.error('[gbx_home]', e); } catch(_){} } try { XH.nav(); } catch(e){ try { console.error('[gbx_home nav]', e); } catch(_){} } }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', avvia); else avvia();
})();
;
(function(){
  'use strict';
  if (window.XL || !window.GBX) return;
  var XL = window.XL = { lv:-1 };
  var L = GBX.L;
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  try { if (typeof LEVELS !== 'undefined' && LEVELS && LEVELS.length === 11 && LEVELS[10].title === 'LEGEND') LEVELS.push({ lv:11, xp:250000, icon:'', title:'IMMORTAL' }); } catch(e){}
  function livelli(){ try { if (typeof LEVELS !== 'undefined' && LEVELS && LEVELS.length) return LEVELS; } catch(e){} return []; }
  function xpOra(){ try { return +S.xp || 0; } catch(e){ return 0; } }
  function livOra(){ try { return getLevel(xpOra()).level; } catch(e){ return 0; } }
  function img(n, grande){ return 'gbx_lv_' + n + (grande ? '_512' : '') + '.webp'; }
  function num(n){ try { return Number(n).toLocaleString(window.GB_LANG === 'en' ? 'en-US' : 'it-IT'); } catch(e){ return String(n); } }
  var LUCCHETTO = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5.5" y="10.5" width="13" height="9.5" rx="2.2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/></svg>';
  function moneta(n){
    var s = img(n);
    return '<span class="xl-gira">'
      + '<i class="xl-sp" style="--z:-1.5px"></i><i class="xl-sp" style="--z:-.5px"></i><i class="xl-sp" style="--z:.5px"></i><i class="xl-sp" style="--z:1.5px"></i>'
      + '<i class="xl-bordo"></i>'
      + '<img class="xl-f xl-fa" src="' + s + '" alt="" draggable="false" decoding="async">'
      + '<img class="xl-f xl-fb" src="' + s + '" alt="" draggable="false" decoding="async">'
      + '<i class="xl-ri xl-ria"></i><i class="xl-ri xl-rib"></i>'
      + '</span>';
  }
  function heroSetup(){
    var av = $('pf-avatar-container'); if (!av || $('xl-mon')) return;
    var b = document.createElement('button');
    b.type = 'button'; b.id = 'xl-mon'; b.className = 'xl-mon'; b.setAttribute('data-x-silent', '');
    b.innerHTML = '<i class="xl-alone" aria-hidden="true"></i><span class="xl-scena" aria-hidden="true"></span>';
    b.addEventListener('click', function(){ apri(livOra()); });
    av.appendChild(b);
  }
  function collezioneSetup(){
    if ($('xl-coll')) return;
    var bar = $('pf-bar'), card = bar && bar.closest('.lvl-card'); if (!card) return;
    var t = document.createElement('div'); t.className = 'section-ttl xl-ttl'; t.id = 'xl-ttl';
    t.__xwF = 1;
    var g = document.createElement('div'); g.className = 'xl-coll x-lastra'; g.id = 'xl-coll';
    g.setAttribute('role', 'list');
    card.parentNode.insertBefore(t, card.nextSibling);
    t.parentNode.insertBefore(g, t.nextSibling);
    g.addEventListener('click', function(e){
      var c = e.target.closest('.xl-c'); if (!c) return;
      apri(+c.getAttribute('data-n'));
    });
  }
  function aggiorna(){
    var lv = livOra(), xp = xpOra(), LV = livelli(); if (!LV.length) return;
    var mon = $('xl-mon');
    if (mon && XL.lv !== lv) {
      mon.querySelector('.xl-scena').innerHTML = moneta(lv);
      var info = LV[lv] || {};
      mon.setAttribute('aria-label', L('Distintivo', 'Badge') + ' ' + (info.title || '') + ' · Lv.' + lv);
      mon.classList.toggle('xl-oro', lv >= 5);
    }
    XL.lv = lv;
    var t = $('xl-ttl'), g = $('xl-coll');
    if (t) t.innerHTML = L('Distintivi', 'Badges') + ' <span class="xl-conta">· ' + (lv + 1) + ' ' + L('di', 'of') + ' ' + LV.length + '</span>';
    if (g) {
      g.innerHTML = LV.map(function(x){
        var ok = xp >= x.xp, ora = x.lv === lv;
        return '<button type="button" role="listitem" data-x-silent class="xl-c' + (ok ? ' ok' : ' no') + (ora ? ' ora' : '') + '" data-n="' + x.lv + '"'
          + ' aria-label="' + esc(x.title) + (ok ? '' : ' · ' + L('bloccato', 'locked')) + '">'
          + '<span class="xl-cb"><img src="' + img(x.lv) + '" alt="" loading="lazy" decoding="async" draggable="false">' + (ok ? '' : '<i class="xl-lk">' + LUCCHETTO + '</i>') + '</span>'
          + '<b>' + esc(x.title) + '</b>'
          + '<small>' + (ok ? (ora ? L('Attuale', 'Current') : 'Lv.' + x.lv) : num(x.xp) + ' XP') + '</small>'
          + '</button>';
      }).join('');
    }
  }
  function apri(n){
    var LV = livelli(), x = LV[n]; if (!x) return;
    var xp = xpOra(), ok = xp >= x.xp, ora = n === livOra();
    var vecchio = document.querySelector('.xl-sheet'); if (vecchio) vecchio.remove();
    var stato;
    if (ora) stato = L('Il tuo livello attuale', 'Your current level');
    else if (ok) stato = L('Sbloccato', 'Unlocked');
    else stato = L('Ti mancano ', 'You need ') + num(x.xp - xp) + ' XP';
    var o = document.createElement('div'); o.className = 'xl-sheet';
    o.innerHTML = '<div class="xl-sheet-p" role="dialog" aria-modal="true" aria-label="' + esc(x.title) + '">'
      + '<div class="xl-sheet-h"><span></span><button type="button" class="xl-sheet-x" data-x-silent>' + L('Fine', 'Done') + '</button></div>'
      + '<div class="xl-sheet-c">'
      + '<div class="xl-big' + (ok ? '' : ' no') + '"><i class="xl-alone"></i><img src="' + img(n, true) + '" alt="" draggable="false">' + (ok ? '' : '<i class="xl-lk">' + LUCCHETTO + '</i>') + '</div>'
      + '<div class="xl-sl">' + L('Livello', 'Level') + ' ' + n + '</div>'
      + '<div class="xl-sn">' + esc(x.title) + '</div>'
      + '<div class="xl-sx">' + (x.xp ? L('Richiede ', 'Requires ') + num(x.xp) + ' XP' : L('Il primo livello, per tutti', 'The first level, for everyone')) + '</div>'
      + '<div class="xl-ss' + (ok ? ' ok' : '') + '">' + stato + '</div>'
      + (ok ? '' : '<div class="xl-bar"><i style="transform:scaleX(' + Math.max(0, Math.min(1, xp / x.xp)).toFixed(3) + ')"></i></div>')
      + '</div></div>';
    var chiudi = function(){
      if (!o.classList.contains('on')) return;
      o.classList.remove('on'); setTimeout(function(){ o.remove(); }, 280);
      try { GBX.fx('back'); } catch(e){}
    };
    o.addEventListener('click', function(e){ if (e.target === o || e.target.closest('.xl-sheet-x')) chiudi(); });
    document.body.appendChild(o);
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ o.classList.add('on'); }); });
    try { GBX.sfx('open'); GBX.hap(ok ? 'medium' : 'light'); } catch(e){}
    XL.chiudi = chiudi;
  }
  XL.apri = apri;
  function avvolgi(nome, dopoFn){
    var f = window[nome];
    if (typeof f !== 'function' || f.__xl) return;
    var w = function(){ var r = f.apply(this, arguments); try { dopoFn(); } catch(e){} return r; };
    w.__xl = true; if (f.__xp) w.__xp = true;
    try { window[nome] = w; } catch(e){}
  }
  try { heroSetup(); collezioneSetup(); aggiorna(); } catch(e){ console.warn('[XL] livelli', e); }
  avvolgi('renderProfile', aggiorna);
  document.addEventListener('gbx:screen', function(e){
    var id = e.detail && e.detail.id;
    if (id === 'profile') { try { heroSetup(); collezioneSetup(); aggiorna(); } catch(_){} }
    else if (XL.chiudi) { var s = document.querySelector('.xl-sheet'); if (s) s.remove(); }
  });
})();
;
(function(){
  'use strict';
  var W = window, D = document;
  if (W.XMR) return;
  var XMR = W.XMR = { on:true, v:'1511', n:0 };
  function L(it, en){ return W.GB_LANG === 'en' ? en : it; }
  function hap(t){ try { if (vivo() && W.GBX && GBX.hap) GBX.hap(t); } catch(e){} }
  function sfx(n){ try { if (vivo() && W.GBX && GBX.sfx) GBX.sfx(n); } catch(e){} }
  function $(id){ return D.getElementById(id); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  function eur(v){ return '€' + (Number(v) || 0).toFixed(2); }
  function M(){ return $('pvp-modal'); }
  function OV(){ return $('pvp-overlay'); }
  function vivo(){ var o = OV(); return !!(o && o.classList.contains('show') && o.classList.contains('xmr-on')); }
  function fermo(){ try { return (W.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) || (W.GBX && GBX.lite && GBX.lite()) || D.documentElement.classList.contains('gb-lite'); } catch(e){ return false; } }
  var EMO = /\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDD00-\uDFFF]|[☀-➿️‍⏳⌛]/g;
  function pulito(t){ return String(t || '').replace(EMO, '').replace(/\s+/g, ' ').trim(); }
  function frase(k){ k = String(k || '').replace(/[A-ZÀ-Ý]{2,}/g, function(w){ return w.toLowerCase(); }); return k.charAt(0).toUpperCase() + k.slice(1); }
  var MANI = { rock:1, paper:1, scissors:1 };
  var NOMI = { rock:['Sasso','Rock'], paper:['Carta','Paper'], scissors:['Forbice','Scissors'] };
  var BATTE = { rock:'scissors', paper:'rock', scissors:'paper' };
  function src(k, lui){ return 'xmr_' + k + (lui ? '_v' : '') + '.webp'; }
  function img(k, lui, cl){ return MANI[k] ? '<img class="xmr-im ' + (cl || '') + '" src="' + src(k, lui) + '" alt="" draggable="false" decoding="async">' : ''; }
  function nome(k){ return NOMI[k] ? L(NOMI[k][0], NOMI[k][1]) : ''; }
  var PRE = [];
  function precarica(){
    if (PRE.length) return;
    ['rock', 'paper', 'scissors'].forEach(function(k){ [false, true].forEach(function(v){
      var i = new Image(); i.decoding = 'async'; i.src = src(k, v); PRE.push(i); try { if (i.decode) i.decode().catch(function(){}); } catch(e){}
    }); });
  }
  XMR.precarica = precarica; XMR.pre = PRE;
  var ATTESA = '<svg class="xmr-cl" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10M7 21h10M8 3v3.5c0 2 4 3.5 4 5.5s-4 3.5-4 5.5V21M16 3v3.5c0 2-4 3.5-4 5.5s4 3.5 4 5.5V21"/></svg>';
  var ESCI = '<svg class="xmr-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h4.5a1.5 1.5 0 0 1 1.5 1.5v13a1.5 1.5 0 0 1-1.5 1.5H14M10 16l-4-4 4-4M6 12h10"/></svg>';
  var LUCCHETTO = '<svg class="xmr-ic" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>';
  function avatar(nm, me, foto){
    var f = foto || ''; if (me) { try { f = (typeof dlMyPhoto === 'function') ? dlMyPhoto() : ''; } catch(e){} }
    var ini = me ? L('T', 'Y') : (pulito(nm).charAt(0) || '?').toUpperCase();
    return '<span class="xmr-av">' + (f ? '<img src="' + esc(f) + '" alt="" onerror="this.remove()">' : '') + '<em>' + esc(ini) + '</em></span>';
  }
  function pips(n, tot){ var s = ''; for (var i = 0; i < tot; i++) s += '<i class="xmr-pip' + (i < n ? ' on' : '') + '"></i>'; return s; }
  var P = { el:null, posa:'', chiave:null, timers:[], svela:false, dopo:null, d:null, ancora:false };
  function palco(){
    var ov = OV(); if (!ov) return null;
    if (P.el && P.el.parentNode === ov) return P.el;
    var s = $('xmr-stage');
    if (!s) {
      s = D.createElement('div'); s.id = 'xmr-stage'; s.className = 'xmr';
      s.innerHTML = '<div class="xmr-hd"></div>' +
        '<div class="xmr-tab"><div class="xmr-pl tu"></div><div class="xmr-rnd"></div><div class="xmr-pl lui"></div></div>' +
        '<div class="xmr-arena"><div class="xmr-scena"></div></div>' +
        '<div class="xmr-stati"><span class="xmr-st tu"></span><span class="xmr-st lui"></span></div>';
    }
    ov.insertBefore(s, M());
    P.el = s; return s;
  }
  function q(sel){ return P.el ? P.el.querySelector(sel) : null; }
  function pulisciTimer(){ P.timers.forEach(clearTimeout); P.timers = []; }
  function dopo(ms, f){ P.timers.push(setTimeout(function(){ try { f(); } catch(e){ try { console.warn('XMR', e); } catch(_){} } }, ms)); }
  function spegni(){
    var ov = OV(); pulisciTimer(); P.svela = false; P.posa = ''; P.dopo = null; P.chiave = null; P.festa = 0;
    if (ov) ov.classList.remove('xmr-on', 'xmr-attesa', 'xmr-svela', 'xmr-fermo', 'xmr-fine');
    var m = M(); if (m) m.classList.remove('xmr-tav');
  }
  function testata(d){
    var h = q('.xmr-hd'); if (!h) return;
    var sub;
    if (d.tour) { var pe = M() && M().querySelector('.dlbj-pot'); sub = '<span>' + esc(frase(pulito(pe ? pe.textContent : L('Torneo', 'Tournament')))) + '</span>'; }
    else if (d.pratica) sub = '<span>' + esc(L('Allenamento · gratis', 'Practice · free')) + '</span>';
    else if (d.gratis || !(Number(d.bet_eur) > 0)) sub = '<span>' + esc(L('Partita gratis · al meglio di 3', 'Free match · best of 3')) + '</span>';
    else sub = '<span>' + L('Piatto', 'Pot') + '</span> <b>' + eur((Number(d.bet_eur) || 0) * 2) + '</b><i>' + L('al meglio di 3 · 95%', 'best of 3 · 95%') + '</i>';
    var t = L('Sasso carta forbice', 'Rock paper scissors');
    var html = '<span class="xmr-hd-ic"><img src="gbx_pv_rps.webp" alt="" onerror="this.remove()"><em>' + esc(t.charAt(0)) + '</em></span>' +
      '<span class="xmr-hd-t"><b>' + esc(t) + '</b><span class="xmr-hd-s">' + sub + '</span></span>';
    if (h.__html !== html) { h.innerHTML = html; h.__html = html; }
  }
  function tabellone(d, ys, os, etichetta){
    var tot = Math.max(2, ys, os);
    var a = q('.xmr-pl.tu'), b = q('.xmr-pl.lui'), r = q('.xmr-rnd');
    var ha = avatar('Tu', true) + '<span class="xmr-pl-t"><b>' + esc(L('Tu', 'You')) + '</b><span class="xmr-pips">' + pips(ys, tot) + '</span></span>';
    var hb = '<span class="xmr-pl-t"><b>' + esc(pulito(d.opp_name || L('Avversario', 'Opponent'))) + '</b><span class="xmr-pips">' + pips(os, tot) + '</span></span>' + avatar(d.opp_name, false, d.opp_photo);
    if (a && a.__html !== ha) { a.innerHTML = ha; a.__html = ha; }
    if (b && b.__html !== hb) { b.innerHTML = hb; b.__html = hb; }
    var fine = (d.status === 'done' || d.state === 'done');
    var rn = etichetta || (fine ? L('Sfida chiusa', 'Match over') : L('Round ', 'Round ') + (d.round || ((d.you_score || 0) + (d.opp_score || 0) + 1)));
    var hr = '<b>' + esc(rn) + '</b><span>' + esc(L('al meglio di 3', 'best of 3')) + '</span>';
    if (r && r.__html !== hr) { r.innerHTML = hr; r.__html = hr; }
  }
  function accendi(lato){
    var tutti = P.el ? P.el.querySelectorAll('.xmr-pl.' + lato + ' .xmr-pip.on') : [];
    var ult = tutti[tutti.length - 1]; if (ult) { ult.classList.remove('pop'); void ult.offsetWidth; ult.classList.add('pop'); }
  }
  function stati(d){
    var a = q('.xmr-st.tu'), b = q('.xmr-st.lui'); if (!a || !b) return;
    var playing = !(d.status === 'done' || d.state === 'done'), sa = '', sb = '';
    if (playing) {
      if (d.your_pick) sa = '<span class="xmr-ok">' + LUCCHETTO + esc(L('Pronto', 'Locked')) + ' · ' + esc(nome(d.your_pick)) + '</span>';
      else sa = '';
      sb = d.opp_locked ? '<span class="xmr-ok">' + LUCCHETTO + esc(L('Pronto', 'Locked')) + '</span>'
                        : '<span class="xmr-pensa">' + esc(L('Sceglie', 'Choosing')) + '<i></i><i></i><i></i></span>';
    }
    if (a.__html !== sa) { a.innerHTML = sa; a.__html = sa; }
    if (b.__html !== sb) { b.innerHTML = sb; b.__html = sb; }
  }
  function mano(lato, kf, kt, extra){
    var lui = lato === 'lui';
    var dentro = kt === 'vuoto'
      ? img('rock', lui, 'f') + '<span class="xmr-vuoto t">' + ATTESA + '<b>' + esc(L('Nessuna mossa', 'No throw')) + '</b></span>'
      : img(kf || 'rock', lui, 'f') + (kt ? img(kt, lui, 't') : '');
    return '<div class="xmr-h ' + lato + (extra || '') + '"><div class="xmr-hb"><div class="xmr-hl"><div class="xmr-ho">' + dentro + '</div></div></div></div>';
  }
  function scena(cl, html){
    var s = q('.xmr-scena'); if (!s) return null;
    var n = D.createElement('div'); n.className = 'xmr-scena ' + cl; n.innerHTML = html;
    s.parentNode.replaceChild(n, s);
    return n;
  }
  function posaPugni(tipo, d){
    var k = 'pugni|' + tipo;
    if (P.posa === k) return;
    var rientra = P.posa.indexOf('esito|') === 0 || P.posa.indexOf('svela|') === 0;
    P.posa = k;
    var parola = tipo === 'attesa' ? '' : '<div class="xmr-parole"><span class="xmr-titolo idle">' + esc(L('Sasso, carta o forbice?', 'Rock, paper or scissors?')) + '</span></div>';
    scena('s-pugni' + (rientra ? ' s-rientra' : '') + (tipo === 'attesa' ? ' s-attesa' : ''), parola + mano('tu', 'rock') + mano('lui', 'rock'));
  }
  function esitoDi(lr){
    var y = MANI[lr.you] ? lr.you : 'vuoto', o = MANI[lr.opp] ? lr.opp : 'vuoto';
    var r = lr.result === 'win' ? 'win' : lr.result === 'lose' ? 'lose' : 'tie';
    var caso = 'pari';
    if (r !== 'tie') {
      var w = r === 'win' ? y : o, l = r === 'win' ? o : y;
      caso = (w === 'vuoto' || l === 'vuoto') ? 'vuoto' : (BATTE[w] === l ? w : 'pari');
    }
    return { y:y, o:o, r:r, caso:caso };
  }
  function spiega(e){
    var nOpp = pulito((P.d && P.d.opp_name) || L('L’avversario', 'Opponent'));
    if (e.caso === 'rock') return L('Il sasso spezza la forbice', 'Rock crushes scissors');
    if (e.caso === 'paper') return L('La carta avvolge il sasso', 'Paper covers rock');
    if (e.caso === 'scissors') return L('La forbice taglia la carta', 'Scissors cut paper');
    if (e.caso === 'vuoto') return (e.y === 'vuoto') ? L('Non hai scelto in tempo', 'You didn’t pick in time') : L(nOpp + ' non ha scelto in tempo', nOpp + ' didn’t pick in time');
    if (e.y === 'vuoto' && e.o === 'vuoto') return L('Nessuno ha scelto', 'Nobody picked');
    return L('Stessa mossa: ', 'Same throw: ') + nome(e.y).toLowerCase() + L(' contro ', ' vs ') + nome(e.o).toLowerCase();
  }
  function titoloDi(e){ return e.r === 'win' ? L('Round vinto', 'Round won') : e.r === 'lose' ? L('Round perso', 'Round lost') : L('Pari · si rigioca', 'Tie · replay'); }
  function htmlEsito(e, anim){
    var vTu = e.r === 'win', vLui = e.r === 'lose';
    var cTu = vTu ? ' vince w-' + e.caso : (vLui ? ' perde l-' + e.caso : (e.r === 'tie' ? ' pari' : ''));
    var cLui = vLui ? ' vince w-' + e.caso : (vTu ? ' perde l-' + e.caso : (e.r === 'tie' ? ' pari' : ''));
    if (e.y === 'vuoto') cTu += ' assente'; if (e.o === 'vuoto') cLui += ' assente';
    var h = '';
    if (anim) {
      h += '<div class="xmr-parole conta"><span class="xmr-w w1">' + esc(L('Sasso', 'Rock')) + '</span><span class="xmr-w w2">' + esc(L('Carta', 'Paper')) + '</span><span class="xmr-w w3">' + esc(L('Forbice!', 'Scissors!')) + '</span></div>';
    }
    h += '<div class="xmr-parole esito r-' + e.r + '"><span class="xmr-titolo">' + esc(titoloDi(e)) + '</span><span class="xmr-spiega">' + esc(spiega(e)) + '</span></div>';
    h += '<div class="xmr-cam"><div class="xmr-cam2">';
    h += mano('tu', 'rock', e.y, cTu) + mano('lui', 'rock', e.o, cLui);
    h += '<div class="xmr-urto"><i class="xmr-lampo"></i><i class="xmr-anello"></i><i class="xmr-anello o2"></i>';
    for (var i = 0; i < 10; i++) h += '<i class="xmr-sc" style="--a:' + (i * 36 + (i % 2 ? 14 : 0)) + 'deg;--l:' + (46 + (i % 3) * 16) + 'px"></i>';
    for (var k = 0; k < 18; k++) {
      var an = (k * 137.5) % 360, ds = 60 + (k * 23) % 70, sz = 4 + (k % 4) * 2;
      h += '<i class="xmr-pt' + (k % 3 ? '' : ' v') + '" style="--a:' + an.toFixed(0) + 'deg;--l:' + ds + 'px;--z:' + sz + 'px"></i>';
    }
    h += '</div>';
    var lato = e.r === 'win' ? 'lui' : 'tu';
    if (e.caso === 'rock') {
      h += '<div class="xmr-fx su-' + lato + ' fx-rock"><i class="xmr-anello a2"></i>';
      var SCH = [[-34, -40, -70], [-8, -54, 40], [22, -44, 120], [40, -12, 200], [30, 26, -150], [-4, 34, 80], [-30, 20, -30], [12, -60, 160]];
      SCH.forEach(function(s, j){ h += '<i class="xmr-sch" style="--x:' + s[0] + 'px;--y:' + s[1] + 'px;--r:' + s[2] + 'deg;--s:' + (0.7 + (j % 3) * 0.25) + '"></i>'; });
      h += '<svg class="xmr-crepa" viewBox="0 0 60 40" aria-hidden="true"><path d="M2 20l12-6 6 9 10-12 8 10 10-7 10 5"/></svg></div>';
    } else if (e.caso === 'paper') {
      h += '<div class="xmr-fx su-' + lato + ' fx-paper"><svg class="xmr-arco a1" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 8a42 42 0 0 1 42 42"/></svg><svg class="xmr-arco a2" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 92A42 42 0 0 1 8 50"/></svg><i class="xmr-onda"></i></div>';
    } else if (e.caso === 'scissors') {
      h += '<div class="xmr-fx su-' + lato + ' fx-scissors"><i class="xmr-taglio"></i></div>';
    } else if (e.caso === 'pari' && e.r === 'tie') {
      h += '<div class="xmr-fx fx-pari"><i class="xmr-anello a3"></i></div>';
    }
    if (e.r !== 'tie') {
      h += '<div class="xmr-fx su-' + (e.r === 'win' ? 'tu' : 'lui') + ' fx-festa">';
      [[-50, -46, .9], [-14, -64, .7], [26, -52, 1], [52, -20, .75], [-62, 4, .6], [40, 30, .65]].forEach(function(s, j){
        h += '<i class="xmr-stella" style="--x:' + s[0] + 'px;--y:' + s[1] + 'px;--s:' + s[2] + ';--dl:' + (j * 45) + 'ms"></i>'; });
      h += '</div>';
    }
    h += '<i class="xmr-vig"></i></div></div>';
    return h;
  }
  function tagliaCarta(n){
    var p = n.querySelector('.xmr-h.l-scissors .xmr-ho'); if (!p) return;
    var t = p.querySelector('img.t'); if (!t) return;
    var su = t.cloneNode(true), giu = t.cloneNode(true);
    su.className = 'xmr-im t meta su'; giu.className = 'xmr-im t meta giu';
    t.classList.add('intera'); p.appendChild(su); p.appendChild(giu);
  }
  function posaEsito(d, lr, anim){
    var e = esitoDi(lr);
    P.posa = (anim ? 'svela|' : 'esito|') + P.chiave;
    var cl = 's-esito c-' + e.caso + ' r-' + e.r + (anim ? ' s-anim' : ' s-subito');
    var n = scena(cl, htmlEsito(e, anim));
    if (n) tagliaCarta(n);
    return e;
  }
  var T = { batti:320, scatto:960, urto:1120, riparte:1720, colpo:2070, festa:2380, fine:2450, chiudi:3050 };
  function svela(d, lr){
    var ov = OV(); pulisciTimer();
    var e = posaEsito(d, lr, true);
    P.svela = true; ov.classList.add('xmr-svela');
    var fine = (d.status === 'done' || d.state === 'done');
    if (fine) ov.classList.add('xmr-attesa');
    var ys = d.you_score || 0, os = d.opp_score || 0;
    tabellone(d, Math.max(0, ys - (e.r === 'win' ? 1 : 0)), Math.max(0, os - (e.r === 'lose' ? 1 : 0)), 'Round ' + (lr.round || Math.max(1, (d.round || 2) - 1)));
    hap('light'); sfx('tick');
    dopo(T.batti, function(){ hap('light'); sfx('tick'); });
    dopo(T.batti * 2, function(){ hap('medium'); sfx('tick'); });
    dopo(T.urto, function(){ hap(e.r === 'tie' ? 'rigid' : 'heavy'); });
    dopo(T.riparte, function(){ hap(e.caso === 'vuoto' ? 'light' : 'medium'); });
    if (e.caso === 'rock') dopo(T.colpo, function(){ hap('heavy'); });
    if (e.caso === 'paper') dopo(T.riparte + 260, function(){ hap('soft'); });
    if (e.caso === 'scissors') { dopo(T.riparte + 90, function(){ hap('rigid'); }); dopo(T.riparte + 250, function(){ hap('rigid'); }); }
    if (e.r === 'tie') dopo(T.riparte + 60, function(){ hap('heavy'); });
    if (e.r === 'win') dopo(T.festa, function(){ hap('light'); });
    dopo(T.fine, function(){
      tabellone(P.d || d, ys, os);
      if (e.r === 'win') accendi('tu'); else if (e.r === 'lose') accendi('lui');
      hap(e.r === 'win' ? 'success' : e.r === 'lose' ? 'error' : 'warning');
    });
    dopo(T.chiudi, function(){
      P.svela = false; ov.classList.remove('xmr-svela', 'xmr-attesa');
      P.posa = 'esito|' + P.chiave;
      var s = q('.xmr-scena'); if (s) s.classList.add('s-ferma');
      if (P.dopo) { var x = P.dopo; P.dopo = null; disegna(x.d, x.ancora, true); }
      else fineSfida(P.d || d);
    });
  }
  function fineSfida(d){
    var ov = OV(); if (!ov) return;
    var fine = (d.status === 'done' || d.state === 'done');
    ov.classList.toggle('xmr-fine', fine);
    if (!P.el) return;
    P.el.classList.toggle('fin-win', fine && !!d.you_win);
    P.el.classList.toggle('fin-lose', fine && !d.you_win);
    if (fine && d.you_win && !P.festa && !fermo()) {
      P.festa = 1;
      var a = q('.xmr-arena'); if (!a || !a.animate) return;
      for (var i = 0; i < 14; i++) {
        var s = D.createElement('i'); s.className = 'xmr-fe' + (i % 3 ? '' : ' v');
        a.appendChild(s);
        var ang = (-160 + Math.random() * 140) * Math.PI / 180, dist = 70 + Math.random() * 90;
        var an = s.animate([
          { transform:'translate(0,0) rotate(0deg) scale(.6)', opacity:1 },
          { transform:'translate(' + (Math.cos(ang) * dist).toFixed(1) + 'px,' + (Math.sin(ang) * dist).toFixed(1) + 'px) rotate(' + (Math.random() * 360 | 0) + 'deg) scale(1)', opacity:0 }
        ], { duration:900 + Math.random() * 500, easing:'cubic-bezier(.2,.8,.2,1)', fill:'forwards' });
        an.onfinish = (function(x){ return function(){ x.remove(); }; })(s);
      }
    }
  }
  function disegna(d, ancora, daCoda){
    d = d || {};
    var ov = OV(), m = M(); if (!ov || !m || !m.querySelector('.dlrps-score')) return;
    if (!palco()) return;
    precarica();
    var era = ov.classList.contains('xmr-on');
    ov.classList.add('xmr-on'); m.classList.add('xmr-tav');
    ov.classList.toggle('xmr-fermo', fermo());
    if (!era) { P.posa = ''; P.festa = 0; P.el.classList.remove('fin-win', 'fin-lose'); ov.classList.remove('xmr-fine'); }
    P.d = d; P.ancora = ancora;
    XMR.n++;
    testata(d); stati(d); foglio(m, d);
    var playing = !(d.status === 'done' || d.state === 'done');
    var lr = d.last_round;
    var k = lr ? [lr.round || 0, lr.you || '-', lr.opp || '-', lr.result || '', d.you_score || 0, d.opp_score || 0, d.tour_gara || 0].join('|') : '';
    var nuovo = !!lr && k !== P.chiave;
    if (P.svela && !nuovo) { P.dopo = { d:d, ancora:ancora }; return; }
    if (nuovo) {
      P.chiave = k;
      if (!fermo() && !daCoda) { svela(d, lr); return; }
      posaEsito(d, lr, false);
      tabellone(d, d.you_score || 0, d.opp_score || 0);
      fineSfida(d);
      return;
    }
    tabellone(d, d.you_score || 0, d.opp_score || 0);
    if (playing && d.your_pick) posaPugni('attesa', d);
    else if (lr && P.posa.indexOf('esito|') !== 0) { posaEsito(d, lr, false); }
    else if (!lr) posaPugni('scegli', d);
    fineSfida(d);
  }
  XMR.disegna = disegna;
  function foglio(m, d){
    [].forEach.call(m.querySelectorAll('.dlrps-ch'), function(b){
      var k = (/'(\w+)'/.exec(b.getAttribute('onclick') || '') || [])[1]; if (!MANI[k] || b.__xmr) return; b.__xmr = 1;
      b.classList.add('xmr-ch', 'xmr-ch-' + k);
      b.setAttribute('aria-label', nome(k));
      b.innerHTML = '<span class="xmr-ch-c">' + img(k, false, 'su') + '</span><b>' + esc(nome(k)) + '</b>';
    });
    var mid = m.querySelector('.dlrps-mid');
    if (mid) {
      var y = mid.querySelector('.dlbj-turn-you');
      if (y && !y.__xmr) { y.__xmr = 1; y.textContent = L('Scegli la tua mossa', 'Pick your throw'); }
      var t = mid.querySelector('.dlbj-turn-opp');
      if (t && !t.__xmr) {
        t.__xmr = 1;
        t.innerHTML = esc(L('Hai scelto', 'You picked')) + ' <b>' + esc(nome(d.your_pick)) + '</b> <span>' +
          esc(d.opp_locked ? L('· si scopre…', '· revealing…') : L('· aspetti l’avversario', '· waiting for your opponent')) + '</span>';
      }
    }
    var w = m.querySelector('.dlrps-waiting'); if (w) w.setAttribute('aria-hidden', 'true');
    [].forEach.call(m.querySelectorAll('.dl-esci'), function(b){
      if (b.__xmr) return; b.__xmr = 1;
      b.innerHTML = ESCI + '<span>' + esc(d.tour ? L('Lascia il turno', 'Leave the round') : L('Esci dalla partita', 'Leave the match')) + '</span>';
    });
    var pr = m.querySelector('.dl-tour-pres');
    if (pr && !pr.__xmr) { pr.__xmr = 1; pr.classList.add('xmr-pres'); pr.removeAttribute('style'); [].forEach.call(pr.childNodes, function(n){ if (n.nodeType === 3) n.nodeValue = n.nodeValue.replace(EMO, '').replace(/^\s+/, ''); }); }
  }
  function tocco(e){
    if (!XMR.on || !e.target.closest) return;
    var b = e.target.closest('.xmr-ch'); if (!b) return;
    var row = b.parentNode;
    [].forEach.call(row.querySelectorAll('.xmr-ch'), function(x){ x.classList.toggle('xmr-sel', x === b); });
    row.classList.add('xmr-scelto');
    var h = q('.xmr-h.tu .xmr-hb'); if (h && h.animate && !fermo()) h.animate([{ transform:'scale(1)' }, { transform:'scale(.93)' }, { transform:'scale(1)' }], { duration:260, easing:'cubic-bezier(.34,1.4,.64,1)' });
    var st = q('.xmr-st.tu'); var k = (/'(\w+)'/.exec(b.getAttribute('onclick') || '') || [])[1];
    if (st && k) { st.innerHTML = '<span class="xmr-ok">' + LUCCHETTO + esc(L('Pronto', 'Locked')) + ' · ' + esc(nome(k)) + '</span>'; st.__html = ''; }
  }
  function monta(){
    var m = M(), o = W.dlRpsBoard; if (!m || typeof o !== 'function') return false;
    if (!PRE.length) { try { (W.requestIdleCallback || function(f){ setTimeout(f, 2500); })(precarica); } catch(e){ setTimeout(precarica, 2500); } }
    if (!o.__xmr) {
      var f = function(d, ancora){
        var r = o.apply(this, arguments);
        if (XMR.on) { try { disegna(d, ancora); } catch(e){ try { console.warn('XMR', e); } catch(_){} } }
        return r;
      };
      f.__xmr = true; f.__xmrO = o;
      try { W.dlRpsBoard = f; } catch(e){ return false; }
    }
    if (!m.__xmr) {
      m.__xmr = 1;
      try { new MutationObserver(function(){ if (!m.querySelector('.dlrps-score')) spegni(); }).observe(m, { childList:true }); } catch(e){}
      m.addEventListener('click', tocco, true);
      m.addEventListener('pointerdown', function(e){ if (XMR.on && e.target.closest && e.target.closest('.xmr-ch')) hap('light'); }, { passive:true });
    }
    return true;
  }
  XMR.spegni = spegni; XMR.P = P;
  function prova(n){ if (monta()) return; if (n < 40) setTimeout(function(){ prova(n + 1); }, 250); }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', function(){ prova(0); }); else prova(0);
})();
;
(function(){
  'use strict';
  if (window.XPC) return;
  var XPC = window.XPC = {};
  var H = document.documentElement;
  var L = function(it, en){ return (window.GB_LANG === 'en') ? en : it; };
  var G = function(n){ return window[n]; };
  var LS = { get:function(k){ try { return localStorage.getItem(k); } catch(e){ return null; } },
             set:function(k,v){ try { localStorage.setItem(k, v); } catch(e){} } };
  var fine = false;
  try { fine = matchMedia('(hover:hover) and (pointer:fine)').matches; } catch(e){}
  function pc(on){ H.classList.toggle('xpc-pc', !!on); if (!on) H.classList.remove('xpc-tast'); specchia(); }
  function tast(){ if (!H.classList.contains('xpc-tast')) { H.classList.add('xpc-tast'); if (!H.classList.contains('xpc-pc')) H.classList.add('xpc-pc'); specchia(); } }
  pc(fine);
  function largo(){ H.classList.toggle('xpc-largo', innerWidth > innerHeight * 1.15); }
  largo(); addEventListener('resize', largo);
  function tocco(){ if (H.classList.contains('xpc-pc')) pc(false); }
  addEventListener('touchstart', tocco, { capture:true, passive:true });
  addEventListener('pointerdown', function(e){
    if (e.pointerType === 'touch' || e.pointerType === 'pen') tocco();
    else if (e.pointerType === 'mouse' && !H.classList.contains('xpc-pc') && fine) pc(true);
  }, true);
  var CORNICI = [['gsrt','smash'],['dprt','scalata'],['luprt','lupus'],['lcrt','lastcall'],['kjrt','kaiju'],
    ['brrt','briscola'],['geort','geo'],['dmrt','deadmoney'],['tprt','tappo'],['sbrt','sbanca'],['abrt','abisso'],['hprt','hop'],['smrt','settemezzo'],
    ['bjrt','bj1v1'],['pkrt','pk1v1'],['bxrt','boxe']];
  function vede(el){ return !!(el && el.style.display !== 'none' && el.offsetWidth > 0 && el.offsetHeight > 0); }
  function attivo(){
    for (var i = 0; i < CORNICI.length; i++) {
      var w = document.getElementById(CORNICI[i][0] + '-wrap');
      if (vede(w)) return { g: CORNICI[i][1], fr: w.querySelector('iframe'), w: w };
    }
    var cur = G('CUR'), T;
    if (cur === 'turf' && (T = G('TWR')) && T.ui === 'match') return { g:'turf', spec: !!T.spec };
    if (cur === 'glad' && (T = G('GLD')) && T.ui === 'match') return { g:'glad', spec: !!T.spec };
    if (cur === 'tank' && (T = G('TKD')) && T.ui === 'match') return { g:'tank', spec: !!T.spec };
    if (cur === 'arc' && (T = G('RTD')) && T.ui === 'match' && T.game) {
      var g = T.game; if (window.GBX && GBX.gioco) g = GBX.gioco(g); else { if (g === 'unoc') g = 'uno'; if (g === 'damaru') g = 'dama'; if (g === 'pool15') g = 'pool8'; }
      return { g: g, spec: !!T.spec };
    }
    var ch = document.getElementById('ch-board'); if (vede(ch)) return { g:'chess' };
    var bs = document.querySelector('.dlbs-grid'); if (bs && bs.offsetWidth) return { g:'bs' };
    return null;
  }
  XPC.attivo = attivo;
  function libero(t){ return !(t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)); }
  var MUOVI = ['W A S D|←↑↓→', 'Muoviti', 'Move'];
  var GUIDA = {
    turf: ['Gambler City Royale', [MUOVI, ['@Clic tenuto', 'Mira e spara verso il puntatore', 'Aim and shoot at the pointer'],
      ['E', 'Sali, scendi, apri, raccogli', 'Enter/leave car, open, pick up'], ['Spazio', 'Freno a mano (in auto)', 'Handbrake (in a car)'],
      ['1 2 3 4 5 6', 'Usa gli oggetti della barra', 'Use the items in the bar'], ['@Rotella|+ -', 'Zoom (quando guardi)', 'Zoom (when watching)']]],
    glad: ['Colosseo', [MUOVI, ['@Clic|J', 'Fendente verso il puntatore (J: il nemico davanti)', 'Slash at the pointer (J: enemy in front)'],
      ['Spazio', 'Schivata', 'Dodge'], ['Shift', 'Scudo, finché tieni premuto', 'Shield, while held'], ['Q|K', 'Colpo speciale', 'Special']]],
    tank: ['Tank Duel', [['W A S D', 'Muovi il carro', 'Drive'], ['@Clic tenuto|←↑↓→', 'Gira la torretta e spara', 'Turn the turret and fire']]],
    race: ['Street Race', [['← →|A D', 'Gira l\'auto a sinistra / a destra (rispetto all\'auto)', 'Turn the car left / right (relative to the car)'],
      ['↓|S|Shift', 'Freno, finché tieni premuto', 'Brake, while held'], ['Spazio', 'Derapata, finché tieni premuto', 'Drift, while held']],
      'Il gas è automatico. Col dito (o col mouse sulla levetta) il muso va dove spingi.', 'Throttle is automatic. With a finger (or the mouse on the stick) the nose goes where you push.'],
    scalata: ['Dead Peak', [['A D|← →', 'Muoviti', 'Move'], ['Spazio|W|↑|Z|K', 'Salta (sul muro: salto dal muro)', 'Jump (on a wall: wall jump)'],
      ['X|J|E|Shift', 'Usa l\'oggetto', 'Use the item'], ['B', 'Sangue sì / no', 'Blood on / off'], ['M', 'Audio', 'Sound']]],
    smash: ['Gambler Smash', [['A D|← →', 'Muoviti', 'Move'], ['W|Spazio|I', 'Salta (due volte: doppio salto)', 'Jump (twice: double jump)'],
      ['S|↓', 'Giù, scendi dalla piattaforma', 'Down, drop through'], ['J|Z', 'Attacco (con una direzione: colpo diverso)', 'Attack (with a direction: other move)'],
      ['K|X', 'Speciale', 'Special'], ['L|Shift|C', 'Scudo e schivata', 'Shield and dodge'], ['L J', 'Presa', 'Grab'], ['Esc|P', 'Pausa', 'Pause']],
      'Funziona anche il controller (A attacco, B speciale).', 'A controller works too (A attack, B special).'],
    alley: ['Vicoli', [MUOVI, ['Spazio', 'Metti la dinamite', 'Drop the dynamite']]],
    sumo: ['Sumo', [MUOVI, ['Spazio', 'Scatto', 'Dash']]],
    snake: ['Snake Arena', [['W A S D|←↑↓→', 'Gira', 'Turn'], ['@Trascina', 'Gira col mouse', 'Turn with the mouse']]],
    draw: ['Quick Draw', [['Spazio|Invio|@Clic', 'Spara, ma solo al segnale', 'Shoot, only on the signal']]],
    calcio: ['Derby', [['W A S D|←↑↓→', 'Corri', 'Run'], ['J|Spazio', 'Passaggio', 'Pass'], ['K', 'Tiro: tieni premuto per caricare', 'Shoot: hold to charge'],
      ['L|Shift', 'Scivolata, cross', 'Slide, cross']]],
    pong: ['Neon Pong', [['← →|A D', 'Muovi la racchetta', 'Move the paddle'], ['@Trascina la barra', 'Muovi la racchetta col mouse', 'Move the paddle with the mouse']]],
    basket: ['Basket', [['@Trascina e lascia', 'Tira: più lungo, più forte', 'Shoot: longer drag, more power']]],
    archery: ['Arco', [['@Trascina e lascia', 'Tendi l\'arco e scocca', 'Draw the bow and release']]],
    golf: ['Minigolf', [['@Premi e trascina', 'Tira: trascina INDIETRO e lascia (più lungo, più forte)', 'Putt: drag BACK and release (longer = stronger)'],
      ['← →|A D', 'Mira (con Shift: fine)', 'Aim (with Shift: fine)'], ['↑ ↓|W S', 'Potenza', 'Power'],
      ['Spazio|Invio', 'Tira (la prima volta mostra la mira)', 'Shoot (first press shows the aim)'],
      ['V|@Clic destro|@Clic', 'Cambia vista', 'Change view'], ['@Rotella|+ -', 'Zoom', 'Zoom']]],
    shove: ['Shove', [['@Trascina e lascia', 'Lancia il disco', 'Shove the puck']]],
    pool8: ['Biliardo', [['@Muovi il mouse', 'Mira', 'Aim'], ['@Clic', 'Blocca o sblocca la mira', 'Lock or unlock the aim'],
      ['@Rotella|← →', 'Mira fine (Shift: più veloce)', 'Fine aim (Shift: faster)'], ['@Trascina la barra', 'Potenza e tiro', 'Power and shot']]],
    uno: ['UNO', [['@Clic sulla carta', 'La scegli; un altro clic la gioca', 'Select it; click again to play'],
      ['@Clic sul mazzo', 'Pesca o passa', 'Draw or pass'], ['@Clic sulla ruota', 'Scegli il colore', 'Pick the colour']]],
    cucu: ['Cucù', [['T|1', 'Tengo la carta', 'Keep the card'], ['C|2', 'Cambio col vicino', 'Swap with the next player'], ['@Clic', 'Anche coi bottoni', 'Or click the buttons']]],
    uomonero: ['Uomo Nero', [['1 … 9', 'Pesca la carta numero N dal vicino', 'Take card number N from the neighbour'],
      ['Spazio', 'Pesca la carta in mezzo', 'Take the middle card'], ['@Clic|@Trascina', 'Scegli col mouse', 'Choose with the mouse']]],
    burraco: ['Burraco', [['@Trascina', 'Sposta le carte: tavolo, scarto, combinazioni', 'Move cards: table, discard, melds'], ['@Clic', 'Pesca, apri la mano grande', 'Draw, open the big hand']]],
    scopa: ['Scopa', [['@Clic sulla carta', 'La giochi (o la scegli, se ci sono più prese)', 'Play it (or select it if several captures)'], ['@Clic sul tavolo', 'Scegli la presa', 'Pick the capture']]],
    briscola: ['Briscola', [['1 2 3', 'Gioca la prima, seconda, terza carta', 'Play the first, second, third card'], ['@Clic', 'Gioca la carta', 'Play the card']]],
    settemezzo: ['Sette e mezzo', [['C|Spazio', 'Carta', 'Card'], ['S|Invio', 'Sto', 'Stand']]],
    tappo: ['Tappo', [['Spazio', 'Metti la mano', 'Slap'], ['@Clic', 'Carte e mazzo', 'Cards and deck']]],
    geo: ['Geo Bet', [['@Clic sulla mappa', 'Metti il segno', 'Drop the pin'], ['@Rotella|@Trascina', 'Zoom e sposta la mappa', 'Zoom and pan'],
      ['Invio', 'Conferma', 'Confirm'], ['M', 'Apri la mappa', 'Open the map']]],
    kaiju: ['Kaiju Battle', [['Spazio|Invio', 'Tira i dadi, continua', 'Roll, continue'], ['1 2 3 4 5 6', 'Tieni o lascia il dado', 'Keep or release a die'], ['@Clic', 'Carte e scelte', 'Cards and choices']]],
    lupus: ['Lupus in Gambler', [['@Clic', 'Scegli e vota', 'Pick and vote'], ['@Trascina|@Rotella', 'Gira e avvicina la scena', 'Rotate and zoom the scene'], ['Invio', 'Manda il messaggio', 'Send the message']]],
    lastcall: ['Last Call', [['@Passa sopra', 'Solleva la carta', 'Lift the card'], ['@Clic', 'Scegli e gioca', 'Pick and play']]],
    deadmoney: ['Dead Money', [['@Clic', 'Rispondi e scegli', 'Answer and choose'], ['Invio', 'Consegna la risposta scritta', 'Send a typed answer']]],
    dama: ['Dama', [['@Clic', 'Pedina, poi la casella dove va', 'Piece, then the square']]],
    backg: ['Backgammon', [['@Clic', 'Pedina, poi la punta o il dado', 'Checker, then point or die']]],
    chess: ['Scacchi', [['@Clic', 'Pezzo, poi la casella', 'Piece, then the square']]],
    bs: ['Battaglia navale', [['@Trascina', 'Piazza le navi', 'Place the ships'], ['@Clic', 'Spara su una casella', 'Fire at a square']]],
    boxe: ['Boxe', [['W A S D|←↑↓→', 'Muoviti', 'Move'], ['J|Spazio|@Clic', 'Colpo: tieni per caricarlo (jab, diretto, montante)', 'Punch: hold to charge (jab, cross, uppercut)'],
      ['K|Shift|@Clic destro', 'Guardia media, finché tieni', 'Mid guard, while held'], ['I', 'Guardia alta', 'High guard'], ['M', 'Guardia bassa', 'Low guard']],
      'Le levette vanno anche col mouse.', 'The sticks work with the mouse too.'],
    bj1v1: ['Blackjack 1v1', [['@Clic', 'Carta o sto', 'Hit or stand']]],
    pk1v1: ['Poker 1v1', [['@Clic', 'Le tue scelte', 'Your moves']]]
  };
  XPC.GUIDA = GUIDA;
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  var NOMI_TASTI = { 'Spazio':['Spazio','Space'], 'Invio':['Invio','Enter'], 'Shift':['Shift','Shift'], 'Esc':['Esc','Esc'] };
  var MOUSE = { 'Clic':['Clic','Click'], 'Clic tenuto':['Clic tenuto','Hold click'], 'Trascina':['Trascina','Drag'], 'Trascina e lascia':['Trascina e lascia','Drag and release'],
    'Rotella':['Rotella','Wheel'], 'Muovi il mouse':['Muovi il mouse','Move the mouse'], 'Trascina la barra':['Trascina la barra','Drag the bar'],
    'Clic sulla carta':['Clic sulla carta','Click a card'], 'Clic sul mazzo':['Clic sul mazzo','Click the deck'], 'Clic sulla ruota':['Clic sulla ruota','Click the wheel'],
    'Clic sul tavolo':['Clic sul tavolo','Click the table'], 'Clic sulla mappa':['Clic sulla mappa','Click the map'], 'Passa sopra':['Passa sopra','Hover'],
    'Trascina le levette':['Trascina le levette','Drag the sticks'], 'Tieni il pugno':['Tieni il pugno','Hold punch'],
    'Clic destro':['Clic destro','Right click'], 'Premi e trascina':['Premi dovunque e trascina','Press anywhere and drag'] };
  function tastiHTML(spec){
    return spec.split('|').map(function(alt){
      if (alt.charAt(0) === '@') { var m = MOUSE[alt.slice(1)] || [alt.slice(1), alt.slice(1)]; return '<span class="xpc-k xpc-mouse">' + esc(L(m[0], m[1])) + '</span>'; }
      return alt.split(' ').map(function(k){ var n = NOMI_TASTI[k]; return '<span class="xpc-k">' + esc(n ? L(n[0], n[1]) : k) + '</span>'; }).join('');
    }).join('<span class="xpc-o">' + L('o', 'or') + '</span>');
  }
  var box = null, btn = null, aperta = false, morbida = false, tChiudi = 0, ultimo = null;
  function righe(g){
    var d = GUIDA[g]; if (!d) return null;
    var r = d[1].slice();
    r.push(['?', 'Apri e chiudi questa guida', 'Open and close this guide']);
    if (g !== 'smash') r.push(['Esc', 'Esci dalla partita (chiede conferma)', 'Leave the match (asks first)']);
    return { t: d[0], r: r, nota: d[2] ? L(d[2], d[3]) : '' };
  }
  function costruisci(){
    if (box) return;
    box = document.createElement('div'); box.className = 'xpc-guida'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'false');
    box.addEventListener('pointerdown', function(e){ if (e.target === box || e.target.classList.contains('xpc-ok')) { e.preventDefault(); XPC.guida(false); } });
    document.body.appendChild(box);
    btn = document.createElement('button'); btn.type = 'button'; btn.className = 'xpc-btn'; btn.tabIndex = -1;
    btn.innerHTML = '<span class="xpc-k">?</span>' + L('Tasti', 'Keys');
    btn.addEventListener('mousedown', function(e){ e.preventDefault(); });
    btn.addEventListener('click', function(e){ e.preventDefault(); XPC.guida(!aperta); });
    document.body.appendChild(btn);
  }
  XPC.guida = function(su, soft){
    costruisci(); clearTimeout(tChiudi);
    var a = attivo(), g = a ? a.g : ultimo;
    if (su && (!g || !GUIDA[g])) su = false;
    if (su) {
      var d = righe(g);
      box.innerHTML = '<div class="xpc-box"><div class="xpc-tit"><b>' + esc(L('Tasti', 'Keys')) + ' · ' + esc(d.t) + '</b><span>' + esc(L('su PC', 'on PC')) + '</span></div>'
        + '<div class="xpc-righe">' + d.r.map(function(x){ return '<div class="xpc-riga"><div class="xpc-cosa">' + esc(L(x[1], x[2])) + '</div><div class="xpc-tasti">' + tastiHTML(x[0]) + '</div></div>'; }).join('') + '</div>'
        + (d.nota ? '<div class="xpc-nota">' + esc(d.nota) + '</div>' : '')
        + '<button type="button" class="xpc-ok" tabindex="-1">' + esc(L('Ho capito', 'Got it')) + '</button></div>';
      morbida = !!soft;
      box.style.pointerEvents = morbida ? 'none' : '';
      box.style.background = morbida ? 'transparent' : '';
      var bx = box.firstChild; if (morbida) bx.style.pointerEvents = 'auto';
      box.classList.add('xpc-su'); aperta = true;
      if (morbida) tChiudi = setTimeout(function(){ XPC.guida(false); }, 12000);
    } else if (box) { box.classList.remove('xpc-su'); aperta = false; }
    return aperta;
  };
  XPC.aperta = function(){ return aperta; };
  XPC.esc = function(){
    if (aperta) { XPC.guida(false); return true; }
    var ids = ['gx-esci', 'eb-esci'];
    for (var i = 0; i < ids.length; i++) { var b = document.getElementById(ids[i]); if (b && b.offsetWidth && getComputedStyle(b).visibility !== 'hidden') { b.click(); return true; } }
    return false;
  };
  var K = { u:0, d:0, l:0, r:0 }, A = { u:0, d:0, l:0, r:0 };
  function dir(k){ var x = k.r - k.l, y = k.d - k.u, m = Math.sqrt(x * x + y * y); return m ? [x / m, y / m] : null; }
  function freccia(code, solo){
    var k = null;
    if (!solo || solo === 'wasd') {
      if (code === 'KeyW') k = 'u'; else if (code === 'KeyS') k = 'd'; else if (code === 'KeyA') k = 'l'; else if (code === 'KeyD') k = 'r';
    }
    if (!solo || solo === 'frecce') {
      if (code === 'ArrowUp') k = 'u'; else if (code === 'ArrowDown') k = 'd'; else if (code === 'ArrowLeft') k = 'l'; else if (code === 'ArrowRight') k = 'r';
    }
    return k;
  }
  function joyRTD(){ var R = G('RTD'); if (!R || !R.joy) return; var d = dir(K);
    if (d) { R.joy.on = true; R.joy.mx = d[0]; R.joy.my = d[1]; } else { R.joy.on = false; R.joy.mx = 0; R.joy.my = 0; } }
  function joyGLD(){ var T = G('GLD'); if (!T || !T.joy) return; var d = dir(K);
    if (d) { T.joy.on = true; T.joy.mx = d[0]; T.joy.my = d[1]; } else { T.joy.on = false; T.joy.mx = 0; T.joy.my = 0; }
    try { if (window.gldPred2 && gldPred2()) gldPumpTick(); } catch(e){} }
  function joyTKD(){ var T = G('TKD'); if (!T || !T.joy) return; var d = dir(K);
    if (d) { T.joy.on = true; T.joy.mx = d[0]; T.joy.my = d[1]; } else { T.joy.on = false; T.joy.mx = 0; T.joy.my = 0; } }
  function aimTKD(){ var T = G('TKD'); if (!T || !T.aim || mouseTank) return; var d = dir(A);
    if (d) { T.aim.on = true; T.aim.ax = d[0]; T.aim.ay = d[1]; } else T.aim.on = false; }
  function azzera(){
    K.u = K.d = K.l = K.r = 0; A.u = A.d = A.l = A.r = 0;
    var a = ultimo;
    try {
      if (a === 'sumo' || a === 'alley' || a === 'race' || a === 'scalata') joyRTD();
      if (a === 'race') { RCC.drift = false; RCC.gas = RC_GAS_AUTO; RTD.aim.on = false; }
      if (a === 'glad') { joyGLD(); if (GLD._shHeld) { GLD._shHeld = 0; gldAct('unshield'); } }
      if (a === 'tank') { joyTKD(); TKD.aim.on = false; }
    } catch(e){}
    pong.d = 0;
  }
  addEventListener('blur', azzera);
  function gldColpo(v){
    var T = G('GLD'); if (!T || T.ui !== 'match' || T.spec) return;
    var now = performance.now(), pil = !!(T.you && T.you.has_pilum);
    if (!v) {
      var tg = gldAutoMira();
      if (tg) { gldSend({ t:'aim', ax:tg[0], ay:tg[1], on:1 }); T._aimHold = now + 300; T._aimLk = { t:now, seen:0 }; if (!pil) T._lkDir = tg; }
      else if (!pil) gldLock(gldLockDir());
      gldAct('atk'); return;
    }
    gldSend({ t:'aim', ax:v[0], ay:v[1], on:1 });
    T._lkDir = pil ? null : v; T.aim.on = false;
    T._aimHold = now + 300; T._aimLk = { t:now, seen:0 };
    gldAct('atk');
  }
  function versoCursore(cv, sx, sy, cx, cy){
    var r = cv.getBoundingClientRect(); if (!r.width) return null;
    var k = r.width / cv.width, px = r.left + sx * k, py = r.top + sy * k;
    var dx = cx - px, dy = cy - py, m = Math.sqrt(dx * dx + dy * dy);
    return m > 4 ? [dx / m, dy / m] : null;
  }
  function gldVerso(cx, cy){
    var T = G('GLD'); if (!T || !T.cv || !T.lastRaw || !T.lastRaw.idx) return null;
    var me = T.lastRaw.idx[T.myId]; if (!me) return null;
    var x = T.pred && T.pred.ok ? T.pred.x : me[1], y = T.pred && T.pred.ok ? T.pred.y : me[2];
    var s = gldW2S(x, y); return versoCursore(T.cv, s[0], s[1], cx, cy);
  }
  var mouseTank = false;
  function tkVerso(cx, cy){
    var T = G('TKD'); if (!T || !T.cv || !T.lastRaw || !T.lastRaw.idx || !T.map) return null;
    var me = T.lastRaw.idx[T.myId]; if (!me) return null;
    var cell = T.cv.width / (T.map.size || 1);
    return versoCursore(T.cv, me[1] * cell, me[2] * cell, cx, cy);
  }
  function suComandi(t){ return !!(t && t.closest && t.closest('.twr-joy,.gld-actions,.gld-btn,button,.twr-aimwrap')); }
  addEventListener('mousedown', function(e){
    var a = attivo(); if (!a || a.spec || a.fr) return;
    if (e.button !== 0) { if (e.target && e.target.closest && e.target.closest('#arc-wrap,#gld-wrap,#tk-wrap')) { e.stopPropagation(); } return; }
    if (!H.classList.contains('xpc-pc') || (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents)) return;
    if (a.g === 'glad' && e.target.closest && e.target.closest('#gld-wrap') && !suComandi(e.target)) {
      e.preventDefault(); var v = gldVerso(e.clientX, e.clientY); gldColpo(v || null);
    } else if (a.g === 'tank' && e.target.closest && e.target.closest('#tk-wrap') && !suComandi(e.target)) {
      e.preventDefault(); var w = tkVerso(e.clientX, e.clientY);
      if (w) { mouseTank = true; TKD.aim.on = true; TKD.aim.ax = w[0]; TKD.aim.ay = w[1]; }
    }
  }, true);
  addEventListener('mousemove', function(e){
    if (!mouseTank) return; var T = G('TKD'); if (!T || T.ui !== 'match') { mouseTank = false; return; }
    var w = tkVerso(e.clientX, e.clientY); if (w) { T.aim.ax = w[0]; T.aim.ay = w[1]; }
  }, true);
  addEventListener('mouseup', function(e){
    if (e.button !== 0) { if (attivo() && e.target && e.target.closest && e.target.closest('#arc-wrap,#gld-wrap,#tk-wrap')) e.stopPropagation(); return; }
    if (mouseTank) { mouseTank = false; try { TKD.aim.on = false; aimTKD(); } catch(x){} }
  }, true);
  var pong = { d:0, t:0, raf:0 };
  function pongPasso(t){
    pong.raf = 0; var R = G('RTD');
    if (!pong.d || !R || R.ui !== 'match' || R.game !== 'pong' || !R.pgBar) { pong.t = 0; return; }
    var MW = (R.map && R.map.w) || 7, dt = pong.t ? Math.min(0.05, (t - pong.t) / 1000) : 0.016; pong.t = t;
    R.pgBar.tx = Math.max(0, Math.min(MW, (R.pgBar.tx == null ? MW / 2 : R.pgBar.tx) + pong.d * MW * 1.15 * dt));
    try { pgBarAxis(); } catch(e){}
    pong.raf = requestAnimationFrame(pongPasso);
  }
  function pongTasti(){
    var d = (pong.r ? 1 : 0) - (pong.l ? 1 : 0), prima = pong.d; pong.d = d;
    if (d && !pong.raf) { pong.t = 0; pong.raf = requestAnimationFrame(pongPasso); }
    if (!d && prima) { try { RTD.pgBar.tx = pgCurX(); pgBarAxis(); } catch(e){} }
  }
  function numero(code){ var m = /^(Digit|Numpad)([0-9])$/.exec(code || ''); return m ? +m[2] : -1; }
  function premi(el){
    if (!el) return; var r = el.getBoundingClientRect(), o = { bubbles:true, cancelable:true, clientX:r.left + r.width / 2, clientY:r.top + r.height / 2, button:0 };
    el.dispatchEvent(new MouseEvent('mousedown', o)); el.dispatchEvent(new MouseEvent('mouseup', o));
  }
  function tastoGioco(a, e, giu){
    var c = e.code || '', g = a.g, k;
    if (a.spec) return false;
    if (g === 'race' && window.PCX && PCX.raceTasto(c, giu, e.repeat)) return true;
    if (g === 'golf' && window.PCX && PCX.golfTasto(c, giu, e.repeat, e)) return true;
    if (g === 'sumo' || g === 'alley' || g === 'race' || g === 'scalata') {
      if ((k = freccia(c))) { if (!!K[k] !== giu) { K[k] = giu ? 1 : 0; joyRTD(); } return true; }
      if (g === 'race') {
        if (c === 'Space') { if (!e.repeat) { RCC.drift = giu; RTD.aim.on = giu; } return true; }
        if (c === 'ShiftLeft' || c === 'ShiftRight') { if (!e.repeat) RCC.gas = giu ? 0 : RC_GAS_AUTO; return true; }
        return false;
      }
      if (g === 'scalata') {
        if (c === 'Space') { if (!e.repeat) { if (giu) sclJump(); else sclJumpUp(); } return true; }
        return false;
      }
      if (c === 'Space' || c === 'KeyJ') { if (giu && !e.repeat) { rtdSend({ t:'act', a:'attack' }); try { TWS.play('whoosh', 0.5); } catch(x){} } return true; }
      return false;
    }
    if (g === 'draw') {
      if (c === 'Space' || c === 'Enter' || c === 'NumpadEnter') { if (giu && !e.repeat) rtdSend({ t:'act', a:'attack' }); return true; }
      return false;
    }
    if (g === 'pong') {
      if (c === 'ArrowLeft' || c === 'KeyA') { pong.l = giu; pongTasti(); return true; }
      if (c === 'ArrowRight' || c === 'KeyD') { pong.r = giu; pongTasti(); return true; }
      return false;
    }
    if (g === 'glad') {
      if ((k = freccia(c))) { if (!!K[k] !== giu) { K[k] = giu ? 1 : 0; joyGLD(); } return true; }
      if (c === 'KeyJ' || c === 'Enter') { if (giu && !e.repeat) gldColpo(null); return true; }
      if (c === 'Space') { if (giu && !e.repeat) gldAct('dodge'); return true; }
      if (c === 'KeyQ' || c === 'KeyK') { if (giu && !e.repeat) gldAct('special'); return true; }
      if (c === 'ShiftLeft' || c === 'ShiftRight') {
        if (e.repeat) return true;
        var b = document.getElementById('gld-b-shield');
        if (giu && !GLD._shHeld) { try { grHaptic('sel'); } catch(x){} GLD._shHeld = 1; if (b) b.classList.add('held'); gldAct('shield'); }
        else if (!giu && GLD._shHeld) { GLD._shHeld = 0; if (b) b.classList.remove('held'); gldAct('unshield'); }
        return true;
      }
      return false;
    }
    if (g === 'tank') {
      if ((k = freccia(c, 'wasd'))) { if (!!K[k] !== giu) { K[k] = giu ? 1 : 0; joyTKD(); } return true; }
      if ((k = freccia(c, 'frecce'))) { if (!!A[k] !== giu) { A[k] = giu ? 1 : 0; aimTKD(); } return true; }
      return false;
    }
    if (g === 'turf') {
      var n = numero(c);
      if (n >= 1 && n <= 9) {
        if (giu && !e.repeat) { var its = [].filter.call(document.querySelectorAll('#turf .twr-item'), function(x){ return x.offsetWidth; }); premi(its[n - 1]); }
        return true;
      }
      return false;
    }
    if (g === 'cucu') {
      if (c === 'KeyT' || c === 'Digit1' || c === 'Numpad1') { if (giu && !e.repeat) cucuMossa(0); return true; }
      if (c === 'KeyC' || c === 'Digit2' || c === 'Numpad2') { if (giu && !e.repeat) cucuMossa(1); return true; }
      return false;
    }
    if (g === 'uomonero') {
      var m = numero(c);
      if (m >= 1) { if (giu && !e.repeat) unrMossa(m - 1); return true; }
      if (c === 'Space') { if (giu && !e.repeat) unrMossa(-1); return true; }
      return false;
    }
    return false;
  }
  function quandoTasto(e, giu){
    var a = attivo();
    if (!a) return;
    var t = e.target;
    if (!libero(t)) return;
    if (giu && (e.key === '?' || (e.code === 'Slash' && e.shiftKey))) { if (GUIDA[a.g]) { e.preventDefault(); XPC.guida(!aperta); } return; }
    if (giu && e.key === 'Escape') { if (aperta || a.g !== 'smash') { if (XPC.esc()) e.preventDefault(); } return; }
    if (giu && aperta && morbida && !e.repeat) XPC.guida(false);
    if (a.fr) {
      if (!e.ctrlKey && !e.metaKey && !e.altKey && /^(Key|Digit|Arrow|Space|Enter|Shift|Numpad)/.test(e.code || '')) {
        e.preventDefault(); fuoco(a, true); passaDentro(a, e, giu);
      }
      return;
    }
    var fatto = false;
    try { fatto = tastoGioco(a, e, giu); } catch(x){ fatto = false; }
    if (fatto) { e.preventDefault(); tast(); }
    else if (/^(Space|Arrow)/.test(e.code || '') || ((e.code === 'Enter') && t && t.tagName === 'BUTTON')) {
      if (t && t !== document.body && t.tagName === 'BUTTON') { e.preventDefault(); try { t.blur(); } catch(x){} }
    }
    if (giu && (a.g === 'turf' || a.g === 'calcio' || a.g === 'snake') && /^(Key[WASDJKLE]|Arrow|Space)/.test(e.code || '')) tast();
  }
  addEventListener('keydown', function(e){ quandoTasto(e, true); });
  addEventListener('keyup', function(e){ quandoTasto(e, false); });
  addEventListener('contextmenu', function(e){ if (attivo() && libero(e.target)) e.preventDefault(); }, true);
  addEventListener('dragstart', function(e){ if (attivo() && e.target && e.target.tagName === 'IMG') e.preventDefault(); }, true);
  function passaDentro(a, e, giu){
    try {
      var w = a.fr.contentWindow, d = null; try { d = a.fr.contentDocument; } catch(x2){}
      if (w && !d && a.g === 'boxe') { try { w.postMessage({ bx:'tasto', code:e.code, giu:!!giu, rep:!!e.repeat }, (typeof BXRT_ORIGIN === 'string' && BXRT_ORIGIN) || '*'); } catch(x3){} return; }
      if (!w || !d) return;
      var ev = new w.KeyboardEvent(giu ? 'keydown' : 'keyup', { key:e.key, code:e.code, keyCode:e.keyCode, which:e.which, shiftKey:e.shiftKey, repeat:e.repeat, bubbles:true, cancelable:true });
      (d.activeElement || d.body || d).dispatchEvent(ev);
    } catch(x){}
  }
  function fuoco(a, subito){
    if (!a || !a.fr || !H.classList.contains('xpc-pc')) return;
    var ae = document.activeElement;
    if (ae === a.fr) return;
    if (!subito && ae && ae !== document.body && !libero(ae)) return;
    try { a.fr.focus({ preventScroll:true }); a.fr.contentWindow.focus(); } catch(x){}
  }
  var CSS_DENTRO = [
    'html.xpc-pc body{-webkit-user-select:none;user-select:none}',
    'html.xpc-pc input,html.xpc-pc textarea{-webkit-user-select:text;user-select:text}',
    'html.xpc-pc.xpc-dp #comandi,html.xpc-pc.xpc-dp #oggetto{display:none!important}',
    '@media (max-height:479px){html.xpc-lup,html.xpc-lup body{min-height:0!important}}'
  ].join('\n');
  function specchia(){
    var a = null; try { a = attivo(); } catch(e){}
    if (!a || !a.fr) return;
    try { var de = a.fr.contentDocument && a.fr.contentDocument.documentElement; if (de) { de.classList.toggle('xpc-pc', H.classList.contains('xpc-pc')); } } catch(e){}
  }
  function scorciatoia(g, d, e){
    var c = e.code || '', n = numero(c), q = function(s){ return d.querySelector(s); };
    var vis = function(el){ return el && el.offsetWidth > 0 && el.offsetHeight > 0 && !el.disabled; };
    var giu = function(el){ if (!vis(el)) return false; var w = d.defaultView, r = el.getBoundingClientRect(),
      o = { bubbles:true, cancelable:true, clientX:r.left + r.width / 2, clientY:r.top + r.height / 2, pointerType:'mouse', isPrimary:true, button:0 };
      el.dispatchEvent(new w.PointerEvent('pointerdown', o)); el.dispatchEvent(new w.PointerEvent('pointerup', o)); return true; };
    var clic = function(el){ if (!vis(el)) return false; el.click(); return true; };
    if (g === 'briscola' && n >= 1 && n <= 3) {
      var mie = [].filter.call(d.querySelectorAll('.mia.viva'), vis).sort(function(a, b){ return a.getBoundingClientRect().left - b.getBoundingClientRect().left; });
      return giu(mie[n - 1]);
    }
    if (g === 'settemezzo') {
      if (c === 'KeyC' || c === 'Space') return giu(q('#bCarta'));
      if (c === 'KeyS' || c === 'Enter' || c === 'NumpadEnter') return giu(q('#bSto'));
    }
    if (g === 'geo') {
      if (c === 'Enter' || c === 'NumpadEnter') return clic(q('#tIndovina'));
      if (c === 'KeyM') return clic(q('#tMappa')) || clic(q('#tVediMappa'));
    }
    if (g === 'kaiju') {
      if (c === 'Space' || c === 'Enter' || c === 'NumpadEnter') return clic(q('#tasti #tA')) || clic(q('#tasti #tB'));
      if (n >= 1 && n <= 6) { var dd = [].filter.call(d.querySelectorAll('#dadi .dado'), vis); return clic(dd[n - 1]); }
    }
    return false;
  }
  function entra(a){
    var fr = a.fr, d, w;
    try { d = fr.contentDocument; w = fr.contentWindow; } catch(e){ return; }
    if (!d || !w || !d.documentElement || d.readyState === 'loading' || d.location.href === 'about:blank') return;
    var de = d.documentElement;
    if (de.__xpc) return;
    de.__xpc = 1;
    de.classList.toggle('xpc-pc', H.classList.contains('xpc-pc'));
    if (a.g === 'scalata') de.classList.add('xpc-dp');
    if (a.g === 'lupus') de.classList.add('xpc-lup');
    try { var st = d.createElement('style'); st.id = 'xpc-css'; st.textContent = CSS_DENTRO; (d.head || de).appendChild(st); } catch(e){}
    var g = a.g;
    w.addEventListener('keydown', function(e){
      var t = e.target;
      if (!libero(t)) return;
      if (e.key === '?' || (e.code === 'Slash' && e.shiftKey)) { e.preventDefault(); e.stopPropagation(); XPC.guida(!aperta); return; }
      if (e.key === 'Escape' && (aperta || g !== 'smash')) { if (XPC.esc()) { e.preventDefault(); e.stopPropagation(); } return; }
      if (aperta && morbida && !e.repeat) XPC.guida(false);
      if (!e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey) {
        var ok = false; try { ok = scorciatoia(g, d, e); } catch(x){}
        if (ok) e.preventDefault();
      }
      if (!H.classList.contains('xpc-pc') && fine) pc(true);
    }, true);
    w.addEventListener('contextmenu', function(e){ if (libero(e.target)) e.preventDefault(); }, true);
    w.addEventListener('touchstart', tocco, { capture:true, passive:true });
    w.addEventListener('pointerdown', function(e){
      if (e.pointerType === 'touch' || e.pointerType === 'pen') tocco();
      if (aperta && morbida) XPC.guida(false);
    }, true);
    w.addEventListener('dragstart', function(e){ if (e.target && e.target.tagName === 'IMG') e.preventDefault(); }, true);
  }
  var NO_RIMISURA = { race:1, calcio:1, burraco:1, pool8:1, pool15:1, boxe:1, scalata:1 };
  var tRim = 0, misuraRim = '';
  addEventListener('resize', function(){
    clearTimeout(tRim);
    tRim = setTimeout(function(){
      try {
        if (!H.classList.contains('xpc-pc') || G('CUR') !== 'arc' || RTD.ui !== 'match' || RTD.spec || NO_RIMISURA[RTD.game]) return;
        var wr = document.getElementById('arc-wrap'); if (!wr) return;
        var k = wr.clientWidth + 'x' + wr.clientHeight; if (k === misuraRim) return; misuraRim = k;
        rtdCanvasInit();
      } catch(e){}
    }, 500);
  });
  var prima = null, primaFr = null;
  function giro(){
    var a = null;
    try { a = attivo(); } catch(e){}
    var g = a ? a.g : null;
    H.classList.toggle('xpc-gioco', !!a);
    if (btn) btn.style.display = (a && GUIDA[g]) ? '' : 'none';
    if (a && a.fr) { entra(a); if (g !== prima || a.fr !== primaFr) fuoco(a, true); else fuoco(a, false); }
    if (g !== prima) {
      azzera(); pong.l = pong.r = 0;
      if (!a) { if (aperta) XPC.guida(false); }
      else {
        ultimo = g; costruisci(); btn.style.display = GUIDA[g] ? '' : 'none';
        H.classList.toggle('xpc-alto', g === 'pong' || g === 'smash');
        H.classList.toggle('xpc-sx', g === 'scalata');
        var ae = document.activeElement; if (ae && ae.tagName === 'BUTTON' && !a.fr) { try { ae.blur(); } catch(x){} }
        if (H.classList.contains('xpc-pc') && GUIDA[g] && !a.spec && innerHeight > 300 && !LS.get('xpc_vista_' + g)) {
          LS.set('xpc_vista_' + g, '1'); XPC.guida(true, true);
        }
      }
      prima = g;
    }
    primaFr = a ? a.fr : null;
    if (g === 'pong') {
      var pc_ = document.getElementById('pg-ctrl'), cv = document.getElementById('arc-cv');
      if (pc_ && cv) { var mw = (H.classList.contains('xpc-pc') && cv.clientWidth) ? (cv.clientWidth + 48) + 'px' : '';
        if (pc_.style.maxWidth !== mw) { pc_.style.maxWidth = mw; pc_.style.marginLeft = pc_.style.marginRight = mw ? 'auto' : ''; } }
    }
  }
  setInterval(giro, 300);
})();
;
(function(){
  'use strict';
  if (window.XM) return;
  var XM = window.XM = { v: '1511p' };
  var doc = document, root = doc.documentElement;
  function lite(){ try { if (window.GBX && GBX.lite && GBX.lite()) return true; } catch(e){} return root.classList.contains('gb-lite'); }
  var mqR = null; try { mqR = matchMedia('(prefers-reduced-motion: reduce)'); } catch(e){}
  function fermo(){ return lite() || (mqR && mqR.matches) || XM.spento; }
  XM.fermo = fermo;
  var WA = !!(doc.body && doc.body.animate) || !!Element.prototype.animate;
  root.classList.add('xm-on');
  var ultimoSuono = 0, swTocco = 0;
  document.addEventListener('pointerdown', function(e){ if (e.target && e.target.closest && e.target.closest('.xp-sw,[role="switch"]')) swTocco = performance.now(); }, { capture:true, passive:true });
  function segna(){ ultimoSuono = performance.now(); }
  function avvolgiSuoni(){
    try {
      if (window.GBX && GBX.sfx && !GBX.sfx.__xm) { var o = GBX.sfx; GBX.sfx = function(n){
        if (n === 'toggle' && swTocco && performance.now() - swTocco < 700) return;
        if (n !== 'tap') segna(); return o.apply(this, arguments); }; GBX.sfx.__xm = 1; }
      if (window.CASA && CASA.sfx && !CASA.sfx.__xm) { var c = CASA.sfx; CASA.sfx = function(){ segna(); return c.apply(this, arguments); }; CASA.sfx.__xm = 1; }
    } catch(e){}
  }
  function fx(nome, hap, sempre){
    if (!sempre && performance.now() - ultimoSuono < 90) return;
    try { if (window.GBX && GBX.fx) GBX.fx(nome); } catch(e){}
    try { if (hap && !(GBX.MAPPA && nome in GBX.MAPPA)) GBX.hap(hap); } catch(e){}
  }
  XM.fx = fx;
  var LIN = false; try { LIN = CSS.supports('transition-timing-function', 'linear(0, 1)'); } catch(e){}
  function molla(k, c, riserva){
    var x = 0, v = 0, dt = 1 / 600, t = 0, pts = [0], passo = 1 / 60, prossimo = passo;
    while (t < 2) {
      var a = k * (1 - x) - c * v; v += a * dt; x += v * dt; t += dt;
      if (t >= prossimo) { pts.push(x); prossimo += passo; if (Math.abs(1 - x) < .002 && Math.abs(v) < .02) break; }
    }
    pts[pts.length - 1] = 1;
    return { e: LIN ? 'linear(' + pts.map(function(p){ return +p.toFixed(4); }).join(',') + ')' : (riserva || 'cubic-bezier(.34,1.4,.64,1)'), ms: Math.round(t * 1000) };
  }
  var M = XM.molle = {
    tasto:  molla(620, 22, 'cubic-bezier(.34,1.56,.64,1)'),
    foglio: molla(300, 33, 'cubic-bezier(.2,.8,.2,1)'),
    toast:  molla(420, 26, 'cubic-bezier(.34,1.3,.64,1)'),
    pagina: molla(330, 34, 'cubic-bezier(.2,.8,.2,1)'),
    salto:  molla(520, 16, 'cubic-bezier(.34,1.8,.64,1)'),
    pop:    molla(560, 20, 'cubic-bezier(.34,1.7,.64,1)'),
    pomello:molla(480, 28, 'cubic-bezier(.34,1.56,.64,1)'),
    cifra:  molla(260, 27, 'cubic-bezier(.2,.9,.25,1.05)')
  };
  try {
    root.style.setProperty('--xm-molla', M.pomello.e);
    root.style.setProperty('--xm-molla-foglio', M.foglio.e);
    root.style.setProperty('--xm-molla-toast', M.toast.e);
    root.style.setProperty('--xm-molla-cifra', M.cifra.e);
  } catch(e){}
  var vivi = [], rafId = 0, tPrima = 0;
  function giro(t){
    rafId = 0; var L = XM.lento || 1, dt = Math.min(L < 1 ? .25 : .034, tPrima ? (t - tPrima) / 1000 : .016) * L; tPrima = t;
    for (var i = vivi.length - 1; i >= 0; i--) { if (!vivi[i].passo(dt)) vivi.splice(i, 1); }
    if (vivi.length) rafId = requestAnimationFrame(giro); else tPrima = 0;
  }
  function anima(o){ if (vivi.indexOf(o) < 0) vivi.push(o); if (!rafId) rafId = requestAnimationFrame(giro); }
  function vis(el){ return !!(el && el.isConnected && el.getClientRects().length); }
  function wa(el, kf, o){ if (!WA || !el || fermo()) return null; try { return el.animate(kf, o); } catch(e){ return null; } }
  var SEG = '.x-seg,.xp-lang,.q-tabs,.rl4-modes,.dc-pick-row,#ccr-auto-l,#cbr-pericoli,#cvk-livelli,#cpl-rischi,#cwh-rischi,#lob-posti,[role="tablist"],.xm-seg-x';
  var NOSEG = '.xc-chips,.casa-gettoni,.xa-ap-fi,#lob-poste,.xa-dots,#cpl-zone';
  var ON = /(^|\s)(on|sel|active|selected|attivo)(\s|$)/;
  var COPIA = ['backgroundColor', 'backgroundImage', 'borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomLeftRadius', 'borderBottomRightRadius',
               'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
               'borderTopStyle', 'borderRightStyle', 'borderBottomStyle', 'borderLeftStyle', 'boxShadow'];
  var ultimoSegTocco = 0;
  function figli(g){ return [].filter.call(g.children, function(c){ return c !== g.__xmInd; }); }
  function scelto(g){
    var k = figli(g), s = k.filter(function(c){ return ON.test(c.className) || c.getAttribute('aria-selected') === 'true' || c.getAttribute('aria-pressed') === 'true'; });
    return s.length === 1 ? s[0] : null;
  }
  function liberaTasto(b){
    if (!b || !b.__xmTx) return; var s = b.style;
    s.removeProperty('background-color'); s.removeProperty('background-image'); s.removeProperty('box-shadow'); s.removeProperty('border-color');
    b.__xmTx = 0; b.classList.remove('xm-tx');
  }
  function vestiTasto(b){
    var s = b.style; s.setProperty('background-color', 'transparent', 'important'); s.setProperty('background-image', 'none', 'important');
    s.setProperty('box-shadow', 'none', 'important'); s.setProperty('border-color', 'transparent', 'important'); b.__xmTx = 1; b.classList.add('xm-tx');
  }
  function chiaveSeg(g){ return g.id ? '#' + g.id : (g.className || '').split(/\s+/).filter(function(c){ return c && !/^xm-/.test(c); }).map(function(c){ return '.' + c; }).join(''); }
  function montaSeg(g, eredita){
    if (g.__xm || g.closest(NOSEG) || g.matches(NOSEG)) return;
    var k = figli(g); if (k.length < 2 || k.length > 12) return;
    g.__xm = { cur: null, st: null, vel: [0, 0, 0, 0], tg: null, mosso: 0, eredita: eredita || null };
    g.classList.add('xm-seg');
    g.classList.add('x-nosfx');
    if (getComputedStyle(g).position === 'static') g.classList.add('xm-rel');
    var ind = doc.createElement('i'); ind.className = 'xm-ind'; ind.setAttribute('aria-hidden', 'true'); g.appendChild(ind); g.__xmInd = ind;
    try { new MutationObserver(function(rs){
      var cambio = false;
      for (var i = 0; i < rs.length; i++) { var r = rs[i];
        if (r.type === 'childList') { if (!ind.isConnected || ind.parentNode !== g) { g.appendChild(ind); } cambio = true; }
        else if (r.target === ind) { if (!ind.classList.contains('xm-ind')) ind.className = 'xm-ind'; }
        else if (r.target.parentNode === g) cambio = true; }
      if (cambio) aggiornaSeg(g, true);
    }).observe(g, { attributes:true, attributeFilter:['class', 'aria-selected', 'aria-pressed'], subtree:true, childList:true }); } catch(e){}
    try { var ro = new ResizeObserver(function(){ aggiornaSeg(g, false, true); }); ro.observe(g); k.forEach(function(c){ ro.observe(c); }); } catch(e){}
    g.addEventListener('pointerdown', function(){ g.__xmTocco = ultimoSegTocco = performance.now(); }, { passive:true, capture:true });
    g.addEventListener('click', function(){ var X = g.__xm, chiave = chiaveSeg(g), scr = g.closest('.screen') || doc;
      if (!X || !X.st || !chiave) return;
      setTimeout(function(){ if (g.isConnected) return; var n = null; try { n = scr.querySelector(chiave); } catch(e){}
        if (n && !n.__xm) montaSeg(n, { st: X.st.slice(), cur: X.cur && X.cur.textContent }); }, 0); });
    aggiornaSeg(g, false);
  }
  function aggiornaSeg(g, daCambio, soloMisura){
    var X = g.__xm, ind = g.__xmInd; if (!X || !ind) return;
    var b = scelto(g);
    if (b !== X.cur) {
      if (X.cur) liberaTasto(X.cur);
      if (!b) { X.cur = null; ind.style.opacity = '0'; return; }
      liberaTasto(b);
      var tr0 = b.style.getPropertyValue('transition'), trP = b.style.getPropertyPriority('transition');
      b.style.setProperty('transition', 'none', 'important');
      var cs = getComputedStyle(b), s = ind.style;
      COPIA.forEach(function(p){ s[p] = cs[p]; });
      vestiTasto(b);
      void b.offsetWidth;
      if (tr0) b.style.setProperty('transition', tr0, trP); else b.style.removeProperty('transition');
      var prima = X.cur; X.cur = b;
      if (daCambio && prima && performance.now() - (g.__xmTocco || 0) < 900) { fx('seg', 'sel'); }
    }
    if (!b) return;
    if (!vis(g) || !b.offsetWidth) { X.sporco = 1; return; }
    var tg = [b.offsetLeft, b.offsetLeft + b.offsetWidth, b.offsetTop, b.offsetHeight];
    ind.style.opacity = '';
    if (X.eredita && !fermo()) { X.st = X.eredita.st; X.eredita = null; disegnaSeg(g); daCambio = true; if (performance.now() - (ultimoSegTocco || 0) < 900) fx('seg', 'sel'); }
    if (!X.st || fermo() || soloMisura && !X.muove || !daCambio && !X.muove) { X.st = tg.slice(); X.tg = tg; X.vel = [0, 0, 0, 0]; disegnaSeg(g); return; }
    X.tg = tg; X.muove = 1;
    if (!X.anim) X.anim = { passo: function(dt){ return passoSeg(g, dt); } };
    anima(X.anim);
  }
  function passoSeg(g, dt){
    var X = g.__xm; if (!X || !X.tg) return false;
    var T = X.tg, S = X.st, V = X.vel;
    var dir = (T[0] + T[1]) >= (S[0] + S[1]) ? 1 : -1;
    for (var j = 0; j < 2; j++) {
      var davanti = (dir > 0 && j === 1) || (dir < 0 && j === 0);
      var k = davanti ? 520 : 210, c = davanti ? 40 : 27;
      V[j] += (k * (T[j] - S[j]) - c * V[j]) * dt; S[j] += V[j] * dt;
    }
    for (var q = 2; q < 4; q++) { V[q] += (420 * (T[q] - S[q]) - 40 * V[q]) * dt; S[q] += V[q] * dt; }
    var minW = Math.min(T[1] - T[0], 12);
    if (S[1] - S[0] < minW) { var m = (S[0] + S[1]) / 2; S[0] = m - minW / 2; S[1] = m + minW / 2; }
    var fermoOra = Math.abs(T[0] - S[0]) < .25 && Math.abs(T[1] - S[1]) < .25 && Math.abs(T[2] - S[2]) < .25 && Math.abs(T[3] - S[3]) < .25 &&
                   Math.abs(V[0]) + Math.abs(V[1]) + Math.abs(V[2]) + Math.abs(V[3]) < 3;
    if (fermoOra) { X.st = T.slice(); X.vel = [0, 0, 0, 0]; X.muove = 0; }
    disegnaSeg(g);
    return !fermoOra;
  }
  function disegnaSeg(g){
    var X = g.__xm, ind = g.__xmInd, S = X.st; if (!S) return;
    var k = S[0].toFixed(1) + '|' + (S[1] - S[0]).toFixed(1) + '|' + S[2].toFixed(1) + '|' + S[3].toFixed(1);
    if (k === X.k) return; X.k = k;
    ind.style.transform = 'translate3d(' + S[0].toFixed(1) + 'px,' + S[2].toFixed(1) + 'px,0)';
    ind.style.width = (S[1] - S[0]).toFixed(1) + 'px'; ind.style.height = S[3].toFixed(1) + 'px';
  }
  function cercaSeg(ambito){
    var r = ambito || doc;
    [].forEach.call(r.querySelectorAll(SEG), montaSeg);
    [].forEach.call(r.querySelectorAll('div,nav'), function(g){
      if (g.__xm || g.__xmNo) return;
      var k = g.children; if (k.length < 2 || k.length > 8) return;
      var ok = 0, on = 0, top = null, alt = 0, i, c;
      for (i = 0; i < k.length; i++) { c = k[i];
        if (!(c.tagName === 'BUTTON' || c.hasAttribute('onclick') || c.getAttribute('role') === 'tab')) { g.__xmNo = 1; return; }
        if (ON.test(c.className)) on++; }
      if (on !== 1) return;
      on = 0;
      for (i = 0; i < k.length; i++) { c = k[i];
        if (!c.offsetWidth) { return; }
        if (top === null) top = c.offsetTop; else if (Math.abs(c.offsetTop - top) > 2) { g.__xmNo = 1; return; }
        alt = Math.max(alt, c.offsetHeight); ok++; if (ON.test(c.className)) on++; }
      if (ok >= 2 && on === 1 && alt <= 52 && !g.closest('canvas,svg,' + NOSEG)) montaSeg(g); else if (ok >= 2) g.__xmNo = 1;
    });
  }
  function risvegliaSeg(scr){
    [].forEach.call((scr || doc).querySelectorAll('.xm-seg'), function(g){ if (g.__xm && (g.__xm.sporco || !g.__xm.st)) { g.__xm.sporco = 0; aggiornaSeg(g, false); } });
  }
  XM.seg = montaSeg;
  function montaSw(sw){
    if (sw.__xm) return; sw.__xm = { on: sw.classList.contains('on') };
    try { new MutationObserver(function(){
      var on = sw.classList.contains('on'); if (on === sw.__xm.on) return; sw.__xm.on = on;
      if (fermo()) return;
      sw.classList.add('xm-va'); clearTimeout(sw.__xmT); sw.__xmT = setTimeout(function(){ sw.classList.remove('xm-va'); }, 200);
      fx(on ? 'toggle-on' : 'toggle-off', 'light', true);
    }).observe(sw, { attributes:true, attributeFilter:['class'] }); } catch(e){}
  }
  var GIA = null;
  function giaScala(el){
    if (GIA === null) {
      var sel = [];
      try { for (var i = 0; i < doc.styleSheets.length; i++) { var rs; try { rs = doc.styleSheets[i].cssRules; } catch(e){ continue; }
        (function giu(rs){ for (var j = 0; j < rs.length; j++) { var r = rs[j];
          if (r.cssRules && !r.selectorText) { giu(r.cssRules); continue; }
          if (!r.selectorText || r.selectorText.indexOf(':active') < 0) continue;
          var st = r.style; if (!(/scale/.test(st.transform || '') || st.scale)) continue;
          r.selectorText.split(',').forEach(function(s){ if (s.indexOf(':active') < 0) return; var p = s.replace(/:active/g, '').trim();
            try { doc.querySelector(p); sel.push(p); } catch(e){} });
        } })(rs); } } catch(e){}
      GIA = sel.length ? sel.join(',') : '';
    }
    try { return !!GIA && el.matches(GIA); } catch(e){ return false; }
  }
  var TASTO = 'button,[role="button"],a[href],.x-press,[onclick]';
  var NOTASTO = 'canvas,.xm-seg>*,.xc-chips>*,.casa-gettoni>*,.xa-ap-fi>*,#lob-poste>*,input,select,textarea,.xp-sw,[data-xm-no]';
  var premuto = null;
  function giaInMovimento(el){ try { var a = el.getAnimations ? el.getAnimations() : []; for (var i = 0; i < a.length; i++) if (a[i].playState === 'running' && !a[i].__xm) return true; } catch(e){} return false; }
  function bianco(cs){ var m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/.exec(cs.backgroundColor || ''); return !!m && +m[1] > 232 && +m[2] > 232 && +m[3] > 232 && (m[4] === undefined || +m[4] > .85); }
  function premi(e){
    if (e.button > 0 || fermo()) return;
    var t = e.target && e.target.closest ? e.target.closest(TASTO) : null;
    if (!t || t.disabled || t.getAttribute('aria-disabled') === 'true' || t.closest(NOTASTO)) return;
    var r = t.getBoundingClientRect();
    if (r.width * r.height > innerWidth * innerHeight * .45 || r.width < 18) return;
    var cs = getComputedStyle(t);
    if (bianco(cs)) luce(t, r, cs);
    if (giaScala(t) || cs.display === 'inline' || giaInMovimento(t)) return;
    var a = wa(t, [{ scale: getComputedStyle(t).scale === 'none' ? '1' : cs.scale }, { scale: '.96' }], { duration: 110, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' });
    if (!a) return; a.__xm = 1;
    if (premuto && premuto.a) rilascia();
    premuto = { el: t, a: a, x: e.clientX, y: e.clientY };
  }
  function rilascia(){
    var p = premuto; premuto = null; if (!p) return;
    var a2 = wa(p.el, [{ scale: '.96' }, { scale: '1' }], { duration: M.tasto.ms, easing: M.tasto.e });
    if (a2) a2.__xm = 1;
    try { p.a.cancel(); } catch(e){}
  }
  function muovi(e){ if (premuto && (Math.abs(e.clientX - premuto.x) > 10 || Math.abs(e.clientY - premuto.y) > 10)) rilascia(); }
  function luce(t, r, cs){
    if (fermo()) return;
    var l = doc.createElement('i'); l.className = 'xm-luce'; l.setAttribute('aria-hidden', 'true');
    var s = l.style; s.left = r.left + 'px'; s.top = r.top + 'px'; s.width = r.width + 'px'; s.height = r.height + 'px'; s.borderRadius = cs.borderTopLeftRadius;
    doc.body.appendChild(l);
    var a = wa(l, [{ opacity: 0, transform: 'scale(.97)' }, { opacity: 1, transform: 'scale(1.03)', offset: .35 }, { opacity: 0, transform: 'scale(1.09)' }], { duration: 440, easing: 'cubic-bezier(.25,.7,.3,1)' });
    if (a) a.onfinish = function(){ l.remove(); }; else l.remove();
  }
  function dissolviDisabled(rs){
    if (fermo()) return;
    for (var i = 0; i < rs.length; i++) { var el = rs[i].target;
      if (el.tagName !== 'BUTTON' || !vis(el)) continue;
      var ora = el.disabled, prima = rs[i].oldValue !== null;
      if (ora === prima) continue;
      var op = parseFloat(getComputedStyle(el).opacity); if (isNaN(op)) continue;
      var da = el.__xmOp != null ? el.__xmOp : (ora ? 1 : Math.min(1, op * .5 + .2));
      el.__xmOp = op;
      if (Math.abs(da - op) < .05) continue;
      wa(el, [{ opacity: da }, { opacity: op }], { duration: 240, easing: 'ease-out' });
    }
  }
  var FOGLI = [
    ['.xa-sheet', '.xa-sheet-p', 'on'], ['.xl-sheet', '.xl-sheet-p', 'on'], ['.xk-sheet', '.xk-sheet-in', 'open'], ['.xc-sheetp', '.xc-sin', 'open']
  ];
  function tipoFoglio(o){ for (var i = 0; i < FOGLI.length; i++) if (o.matches(FOGLI[i][0])) return FOGLI[i]; return null; }
  function montaFoglio(o){
    if (o.__xm) return; var T = tipoFoglio(o); if (!T) return;
    o.__xm = { aperto: o.classList.contains(T[2]) }; o.classList.add('xm-foglio');
    try { new MutationObserver(function(){
      var ap = o.classList.contains(T[2]); if (ap === o.__xm.aperto) return; o.__xm.aperto = ap;
      fx(ap ? 'sheet-open' : 'sheet-close', ap ? 'light' : null);
      if (ap) { var p = o.querySelector(T[1]); if (p) { p.style.removeProperty('translate'); } }
    }).observe(o, { attributes:true, attributeFilter:['class'] }); } catch(e){}
    o.addEventListener('pointerdown', function(e){ trascinaFoglio(e, o, T); });
    if (o.__xm.aperto) fx('sheet-open', 'light');
  }
  function trascinaFoglio(e, o, T){
    if (e.button > 0 || !o.classList.contains(T[2])) return;
    var p = o.querySelector(T[1]); if (!p || !p.contains(e.target)) return;
    if (e.target.closest('input,textarea,select,.xm-seg,.xc-chips,.casa-gettoni,[data-xm-no]')) return;
    var r = p.getBoundingClientRect(), y0 = e.clientY, x0 = e.clientX, dy = 0, deciso = 0, ultimi = [], id = e.pointerId;
    var testata = (e.clientY - r.top) < 70;
    var sc = e.target.closest('.xa-sheet-c,.xl-sheet-c,.xk-sheet-in,.xc-sin') || p;
    function mv(ev){
      if (ev.pointerId !== id) return;
      var d = ev.clientY - y0, dx = ev.clientX - x0;
      if (!deciso) {
        if (Math.abs(d) < 7 && Math.abs(dx) < 7) return;
        if (Math.abs(dx) > Math.abs(d) || d < 0 || (!testata && sc.scrollTop > 0)) { fine(null, true); return; }
        deciso = 1; try { p.setPointerCapture(id); } catch(_){}
        p.classList.add('xm-tira');
      }
      ev.preventDefault();
      dy = d > 0 ? d : -Math.pow(-d, .7);
      ultimi.push([ev.timeStamp, ev.clientY]); if (ultimi.length > 5) ultimi.shift();
      p.style.translate = '0 ' + dy.toFixed(1) + 'px';
    }
    function fine(ev, annulla){
      removeEventListener('pointermove', mv, { capture:true }); removeEventListener('pointerup', fine, true); removeEventListener('pointercancel', fine, true);
      p.removeEventListener('touchmove', blocca, { capture:true });
      if (annulla || !deciso) return;
      p.classList.remove('xm-tira');
      var v = 0; if (ultimi.length > 1) { var a = ultimi[0], b = ultimi[ultimi.length - 1]; v = (b[1] - a[1]) / Math.max(1, b[0] - a[0]); }
      if (dy > Math.min(160, r.height * .28) || (v > .55 && dy > 24)) {
        var chiuso = false;
        try { o.click(); chiuso = !o.classList.contains(T[2]); } catch(_){}
        if (!chiuso) { var x = o.querySelector('[class*="sheet-x"],.xc-x,[aria-label="Chiudi"],[aria-label="Close"]'); if (x) { try { x.click(); } catch(_){} } }
        if (o.classList.contains(T[2])) { molla_su(p, dy); return; }
        var pz = p; setTimeout(function(){ pz.style.removeProperty('translate'); }, 600);
        fx('sheet-close', null);
      } else molla_su(p, dy);
      if (Math.abs(dy) > 6) { var k = function(c){ c.stopPropagation(); c.preventDefault(); removeEventListener('click', k, true); };
        addEventListener('click', k, true); setTimeout(function(){ removeEventListener('click', k, true); }, 350); }
    }
    function blocca(ev){ if (deciso) ev.preventDefault(); }
    addEventListener('pointermove', mv, { capture:true, passive:false }); addEventListener('pointerup', fine, true); addEventListener('pointercancel', fine, true);
    p.addEventListener('touchmove', blocca, { capture:true, passive:false });
  }
  function molla_su(p, dy){
    p.style.removeProperty('translate');
    wa(p, [{ translate: '0 ' + dy + 'px' }, { translate: '0 0' }], { duration: M.foglio.ms, easing: M.foglio.e });
  }
  function montaModal(m){
    if (m.__xm) return; m.__xm = { on: m.classList.contains('show') };
    m.classList.add('x-nosfx');
    try { new MutationObserver(function(){
      var on = m.classList.contains('show'); if (on === m.__xm.on) return; m.__xm.on = on;
      if (on) { fx('sheet-open', 'light'); m.__xmFoto = null; return; }
      fx('sheet-close', null);
      if (fermo() || !m.__xmUltimo) return;
      var g = m.__xmUltimo; m.__xmUltimo = null;
      g.classList.add('xm-fantasma'); g.style.display = 'flex'; m.parentNode.insertBefore(g, m.nextSibling);
      var box = g.querySelector('.modal');
      var a = wa(g, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'ease-in', fill: 'forwards' });
      if (box) wa(box, [{ transform: 'scale(1)' }, { transform: 'scale(.94)' }], { duration: 200, easing: 'ease-in', fill: 'forwards' });
      if (a) a.onfinish = function(){ g.remove(); }; else g.remove();
    }).observe(m, { attributes:true, attributeFilter:['class'] }); } catch(e){}
    m.addEventListener('pointerdown', function(){ if (!m.classList.contains('show')) return; var c = m.cloneNode(true);
      c.removeAttribute('id'); [].forEach.call(c.querySelectorAll('[id]'), function(x){ x.removeAttribute('id'); });
      [].forEach.call(c.querySelectorAll('[onclick]'), function(x){ x.removeAttribute('onclick'); });
      m.__xmUltimo = c; }, true);
  }
  var TAB = { home:0, wallet:1, leaderboard:2, challenges:3, profile:4 };
  function profondita(id){ return id in TAB ? 0 : (id === 'duel' || id === 'friends' || id === 'fair') ? 1 : 2; }
  var fantasmi = [];
  function pulisciFantasmi(){ while (fantasmi.length) { var f = fantasmi.pop(); try { f.a && f.a.cancel(); } catch(e){} fineFantasma(f.el); } }
  function fineFantasma(el){ el.style.removeProperty('display'); el.style.removeProperty('pointer-events'); el.classList.remove('xm-esce'); }
  function avvolgiGo(){
    if (typeof window.go !== 'function' || window.go.__xm) return;
    var orig = window.go;
    var nuovo = function(id){
      pulisciFantasmi(); tSchermo = performance.now();
      var prima = doc.querySelector('.screen.active');
      var r = orig.apply(this, arguments);
      try {
        var dopo = doc.querySelector('.screen.active');
        if (dopo && prima && dopo !== prima) transizione(prima, dopo);
      } catch(e){}
      return r;
    };
    nuovo.__xm = 1; nuovo.__gbx = window.go.__gbx;
    try { window.go = nuovo; } catch(e){}
  }
  function transizione(prima, dopo){
    var a = prima.id, b = dopo.id, pa = profondita(a), pb = profondita(b), verso;
    if (pa === 0 && pb === 0) verso = TAB[b] > TAB[a] ? 1 : -1;
    else verso = pb > pa ? 1 : pb < pa ? -1 : 1;
    if (!(pa === 0 && pb === 0)) fx(verso > 0 ? 'open' : 'back', 'light');
    if (fermo()) return;
    var dx = pa === 0 && pb === 0 ? 16 : 22;
    if (XM.entrata === false) return;
    var da0 = (pa === 0 && pb === 0) ? .6 : .45;
    var aIn = wa(dopo, [{ translate: (verso * dx) + 'px 0', opacity: da0 }, { translate: '0 0', opacity: 1 }],
                 { duration: Math.max(300, Math.min(420, M.pagina.ms)), easing: M.pagina.e });
    if (aIn) aIn.__xm = 1;
    var cs = getComputedStyle(prima);
    if (XM.fantasma === true && cs.display === 'none') {
      prima.style.setProperty('display', 'flex', 'important'); prima.style.setProperty('pointer-events', 'none', 'important'); prima.classList.add('xm-esce');
      var aOut = wa(prima, [{ translate: '0 0', opacity: 1 }, { translate: (-verso * dx * .6) + 'px 0', opacity: 0 }], { duration: 170, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' });
      if (!aOut) { fineFantasma(prima); return; }
      var f = { el: prima, a: aOut }; fantasmi.push(f);
      aOut.onfinish = function(){ var i = fantasmi.indexOf(f); if (i >= 0) fantasmi.splice(i, 1); fineFantasma(prima); try { aOut.cancel(); } catch(e){} };
    }
  }
  var NUM = '[id$="-bal"],.xc-balv,.xk-balv,.xr-bal,#wn-bal,#pf-xp,.xm-num';
  var NONUM = '.xh-hbal,#home-bal,.xm-roll';
  function numero(s){ var m = String(s).replace(/[\s ]/g, '').match(/-?\d[\d.,]*/); if (!m) return null;
    var t = m[0], v; if (/,\d{1,2}$/.test(t)) v = parseFloat(t.replace(/\./g, '').replace(',', '.')); else v = parseFloat(t.replace(/,/g, '')); return isNaN(v) ? null : v; }
  function testoNum(el){
    for (var n = el.firstChild; n; n = n.nextSibling) if (n.nodeType === 3 && /\d/.test(n.nodeValue)) return n;
    return null;
  }
  function montaNum(el){
    if (el.__xmN || el.matches(NONUM) || el.closest(NONUM)) return;
    el.__xmN = { v: numero(el.textContent), t: el.textContent, ult: 0 };
    el.classList.add('xm-tab');
    try { new MutationObserver(function(){ cambioNum(el); }).observe(el, { characterData:true, childList:true, subtree:true }); } catch(e){}
  }
  var tSchermo = 0;
  function cambioNum(el){
    var N = el.__xmN, testo = el.textContent;
    if (testo === N.t) return;
    var v = numero(testo), vecchio = N.t, vv = N.v, ora = performance.now(), svelto = ora - N.ult < 220;
    N.t = testo; N.v = v; N.ult = ora;
    if (ora - tSchermo < 800) return;
    if (v === null || vv === null || v === vv || svelto || el.__xcV || fermo() || !vis(el)) return;
    var tn = testoNum(el); if (!tn) return;
    rotola(el, tn, vecchio, tn.nodeValue, v > vv);
  }
  function rotola(el, tn, da, a, su){
    var dd = (da.match(/[\d.,]+/) || [''])[0], aa = (a.match(/[\d.,]+/) || [''])[0];
    var cs = getComputedStyle(el), h = 0;
    var box = doc.createElement('span'); box.className = 'xm-roll';
    var pezzi = [], ia = a.indexOf(aa), diff = 0;
    var cifreA = aa.replace(/[^\d]/g, ''), cifreD = dd.replace(/[^\d]/g, '');
    while (cifreD.length < cifreA.length) cifreD = '0' + cifreD;
    if (cifreD.length > cifreA.length) cifreD = cifreD.slice(cifreD.length - cifreA.length);
    var ci = 0;
    for (var i = 0; i < a.length; i++) {
      var ch = a[i];
      if (i >= ia && i < ia + aa.length && /\d/.test(ch)) {
        var f = +cifreD[ci], t = +ch; ci++;
        var sp = doc.createElement('span'); sp.className = 'xm-dg'; sp.textContent = ch;
        if (f !== t) {
          var p0 = f, p1 = t;
          if (su && t < f) p1 = t + 10; else if (!su && t > f) p0 = f + 10;
          sp.__xm = [p0, p1, diff++]; sp.classList.add('xm-gira');
        }
        box.appendChild(sp);
      } else box.appendChild(doc.createTextNode(ch));
    }
    if (!diff) return;
    tn.parentNode.replaceChild(box, tn);
    var giri = [].filter.call(box.children, function(s){ return s.__xm; });
    h = giri[0].getBoundingClientRect().height || parseFloat(cs.fontSize) * 1.2;
    box.style.setProperty('--xm-h', h.toFixed(2) + 'px'); box.style.setProperty('--xm-c', cs.color);
    giri.forEach(function(s){ s.style.setProperty('--xm-p', s.__xm[0]); });
    void box.offsetWidth;
    var dur = 0;
    giri.forEach(function(s, k){ var rit = k * 45; s.style.transitionDelay = rit + 'ms'; s.style.setProperty('--xm-p', s.__xm[1]); dur = Math.max(dur, rit); });
    box.classList.add('xm-va');
    if (su) { var n = Math.min(5, diff + 1); for (var q = 0; q < n; q++) setTimeout(function(){ fx('count', null, true); }, q * 70); }
    clearTimeout(el.__xmRT);
    el.__xmRT = setTimeout(function(){ if (box.isConnected) { var testo = box.textContent; box.parentNode.replaceChild(doc.createTextNode(testo), box); } }, dur + M.cifra.ms + 80);
  }
  function avvolgiCount(){
    try { if (window.GBX && GBX.count && !GBX.count.__xm) { var o = GBX.count; GBX.count = function(el, da, a, fmt, ms){ if (el) { el.__xcV = 1; clearTimeout(el.__xcT); el.__xcT = setTimeout(function(){ el.__xcV = 0; }, (ms || 650) + 300); } return o.apply(this, arguments); }; GBX.count.__xm = 1; } } catch(e){}
  }
  var RIGHE = '.x-gruppo>.x-riga,.x-gruppo>button,.xw-gruppo>*,#lb-list>*,.q-list>*,.q-card,#fr-list>*,.wn-mov>*,.xw-movs>*,.xp-gruppo>*,.xn2-row,.x-riga';
  var visti = {}, giaVisti = new WeakSet(), testiVisti = {};
  function cascata(scr, solo){
    if (fermo()) return 0;
    var tv = testiVisti[scr.id] || (testiVisti[scr.id] = {});
    var cand = [].filter.call(scr.querySelectorAll(RIGHE), function(r){
      if (giaVisti.has(r) || r.closest('.x-sv,.xm-seg,.xa-car') || r.closest('.screen') !== scr) return false;
      if (solo && !solo.has(r)) return false;
      var b = r.getBoundingClientRect(); return b.height > 8 && b.top < innerHeight && b.bottom > 0;
    });
    cand = cand.filter(function(r){ return !cand.some(function(o){ return o !== r && o.contains(r); }); }).slice(0, 14);
    cand.sort(function(x, y){ return x.getBoundingClientRect().top - y.getBoundingClientRect().top; });
    var n = 0;
    cand.forEach(function(r){
      giaVisti.add(r);
      var k = (r.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
      if (k && tv[k]) return;
      if (k) tv[k] = 1;
      var a = wa(r, [{ opacity: -1 }, { opacity: 0 }], { duration: 260, delay: Math.min(n, 8) * 26, easing: 'cubic-bezier(.3,.7,.3,1)', fill: 'backwards', composite: 'add' });
      if (a) a.__xm = 1; n++;
    });
    return cand.length;
  }
  function primaVolta(scr){
    if (visti[scr.id]) return; visti[scr.id] = 1;
    cascata(scr);
    var nuovi = new Set(), timer = 0, mo;
    try { mo = new MutationObserver(function(rs){ rs.forEach(function(r){ [].forEach.call(r.addedNodes, function(n){ if (n.nodeType === 1) { nuovi.add(n); if (n.querySelectorAll) [].forEach.call(n.querySelectorAll(RIGHE), function(x){ nuovi.add(x); }); } }); });
      if (scr.classList.contains('active')) cascata(scr, nuovi); nuovi = new Set(); });
      mo.observe(scr, { childList:true, subtree:true }); setTimeout(function(){ mo.disconnect(); }, 3000); } catch(e){}
  }
  function montaToast(){
    var t = doc.getElementById('toast'); if (!t || t.__xm) return; t.__xm = { on: false };
    try { new MutationObserver(function(){
      var on = t.classList.contains('show'); if (on === t.__xm.on) { if (on) rimbalzoToast(t); return; } t.__xm.on = on;
      if (!on) return;
      var tipo = t.classList.contains('err') ? 'error' : t.classList.contains('ok') ? 'success' : 'pop';
      fx(tipo, tipo === 'pop' ? 'soft' : null);
    }).observe(t, { attributes:true, attributeFilter:['class'], childList:true, characterData:true, subtree:true }); } catch(e){}
  }
  function rimbalzoToast(t){ var a = wa(t, [{ scale: '.94' }, { scale: '1' }], { duration: M.pop.ms, easing: M.pop.e }); if (a) a.__xm = 1; }
  var ultimoTocco = null, tTocco = 0;
  function confermaCopia(){
    var el = ultimoTocco; if (!el || performance.now() - tTocco > 2500 || !vis(el)) el = null;
    fx('copy', 'light', true);
    if (fermo()) return;
    var r = el ? el.getBoundingClientRect() : { left: innerWidth / 2 - 50, top: 80, width: 100, height: 0 };
    var c = doc.createElement('div'); c.className = 'xm-copia'; c.setAttribute('aria-hidden', 'true');
    c.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" pathLength="1"/></svg><span>' + (window.GB_LANG === 'en' ? 'Copied' : 'Copiato') + '</span>';
    doc.body.appendChild(c);
    var cx = r.left + r.width / 2, y = r.top - 10;
    if (y < 60) y = r.top + r.height + 44;
    c.style.left = Math.max(70, Math.min(innerWidth - 70, cx)) + 'px'; c.style.top = y + 'px';
    var a = wa(c, [{ opacity: 0, transform: 'translate(-50%,-100%) translateY(8px) scale(.8)' }, { opacity: 1, transform: 'translate(-50%,-100%) scale(1)' }], { duration: M.pop.ms, easing: M.pop.e, fill: 'forwards' });
    var path = c.querySelector('path'); if (path) wa(path, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 320, delay: 90, easing: 'cubic-bezier(.3,.7,.3,1)', fill: 'both' });
    setTimeout(function(){ var b = wa(c, [{ opacity: 1, transform: 'translate(-50%,-100%) scale(1)' }, { opacity: 0, transform: 'translate(-50%,-100%) translateY(-6px) scale(.96)' }], { duration: 220, easing: 'ease-in', fill: 'forwards' });
      if (b) b.onfinish = function(){ c.remove(); }; else c.remove(); }, 1100);
    if (!a) setTimeout(function(){ c.remove(); }, 1200);
  }
  function avvolgiCopia(){
    try { var cb = navigator.clipboard; if (cb && cb.writeText && !cb.writeText.__xm) { var w = cb.writeText.bind(cb);
      var nw = function(t){ var p = w(t); try { Promise.resolve(p).then(confermaCopia, function(){}); } catch(e){} return p; }; nw.__xm = 1;
      try { cb.writeText = nw; } catch(e){ try { Object.defineProperty(cb, 'writeText', { value: nw, configurable:true }); } catch(_){} } } } catch(e){}
    try { if (doc.execCommand && !doc.execCommand.__xm) { var ex = doc.execCommand.bind(doc);
      var ne = function(c){ var r = ex.apply(doc, arguments); if (r && String(c).toLowerCase() === 'copy') confermaCopia(); return r; }; ne.__xm = 1; doc.execCommand = ne; } } catch(e){}
  }
  var FICHE = '.xc-chips,.casa-gettoni,.xa-ap-fi,#lob-poste,.xm-fiche';
  function anello(el, colore){
    if (fermo()) return; var r = el.getBoundingClientRect(); if (!r.width) return;
    var o = doc.createElement('i'); o.className = 'xm-anello'; o.setAttribute('aria-hidden', 'true');
    var s = o.style, d = Math.max(r.width, r.height);
    s.left = (r.left + r.width / 2 - d / 2) + 'px'; s.top = (r.top + r.height / 2 - d / 2) + 'px'; s.width = s.height = d + 'px';
    s.borderRadius = getComputedStyle(el).borderTopLeftRadius === '50%' || r.width === r.height ? '50%' : getComputedStyle(el).borderTopLeftRadius;
    if (colore) s.borderColor = colore;
    doc.body.appendChild(o);
    var a = wa(o, [{ opacity: .95, transform: 'scale(.92)' }, { opacity: 0, transform: 'scale(1.5)' }], { duration: 440, easing: 'cubic-bezier(.15,.7,.3,1)' });
    if (a) a.onfinish = function(){ o.remove(); }; else o.remove();
  }
  function salta(el){
    var a = wa(el, [{ translate: '0 0', easing: 'cubic-bezier(.25,.8,.35,1)' }, { translate: '0 -7px', offset: .26, easing: M.salto.e }, { translate: '0 0' }], { duration: 120 + M.salto.ms * .8 });
    if (a) a.__xm = 1;
  }
  function tocchiFiche(e){
    var g = e.target.closest && e.target.closest(FICHE); if (!g) return;
    var c = e.target.closest('button,[onclick]'); if (!c || !g.contains(c) || c === g || c.disabled) return;
    salta(c); anello(c);
    fx('chip', null);
  }
  XM.anello = anello; XM.salta = salta;
  function pop(el){ var a = wa(el, [{ scale: '.55', opacity: .4 }, { scale: '1', opacity: 1 }], { duration: M.pop.ms, easing: M.pop.e }); if (a) a.__xm = 1; }
  XM.pop = pop;
  function montaBadge(b){
    if (b.__xm) return; b.__xm = { t: b.textContent, ult: 0, timer: 0 };
    try { new MutationObserver(function(){ var X = b.__xm, t = b.textContent; if (t === X.t) return; X.t = t;
        var ora = performance.now(); if (ora - X.ult < 3000) X.timer = 1; X.ult = ora;
        if (!X.timer && vis(b) && t.trim()) { pop(b); fx('pop', null); } })
      .observe(b, { childList:true, characterData:true, subtree:true }); } catch(e){}
  }
  function scansiona(ambito){
    var r = ambito || doc;
    try { cercaSeg(r); } catch(e){}
    try { [].forEach.call(r.querySelectorAll('.xp-sw,[role="switch"]'), montaSw); } catch(e){}
    try { [].forEach.call(doc.querySelectorAll('.xa-sheet,.xl-sheet,.xk-sheet,.xc-sheetp'), montaFoglio); } catch(e){}
    try { [].forEach.call(r.querySelectorAll(NUM), function(el){ if (!el.closest(NONUM)) montaNum(el); }); } catch(e){}
    try { [].forEach.call(r.querySelectorAll('[class*="badge"]'), montaBadge); } catch(e){}
    var m = doc.getElementById('modal'); if (m) montaModal(m);
    montaToast();
  }
  function avvio(){
    avvolgiSuoni(); avvolgiCount(); avvolgiGo(); avvolgiCopia();
    scansiona();
    doc.addEventListener('pointerdown', premi, { capture:true, passive:true });
    doc.addEventListener('pointerdown', function(e){ var t = e.target && e.target.closest && e.target.closest('button,[onclick],[role="button"]'); if (t) { ultimoTocco = t; tTocco = performance.now(); } }, { capture:true, passive:true });
    addEventListener('pointerup', rilascia, true); addEventListener('pointercancel', rilascia, true);
    addEventListener('pointermove', muovi, { capture:true, passive:true });
    doc.addEventListener('click', tocchiFiche, true);
    try { new MutationObserver(dissolviDisabled).observe(doc.body, { attributes:true, attributeFilter:['disabled'], attributeOldValue:true, subtree:true }); } catch(e){}
    try { new MutationObserver(function(rs){ rs.forEach(function(r){ [].forEach.call(r.addedNodes, function(n){ if (n.nodeType === 1 && tipoFoglio(n)) montaFoglio(n); }); }); })
      .observe(doc.body, { childList:true }); } catch(e){}
    doc.addEventListener('gbx:screen', function(e){
      tSchermo = performance.now();
      var scr = e.detail && doc.getElementById(e.detail.id); if (!scr) return;
      avvolgiSuoni();
      try { primaVolta(scr); } catch(x){}
      setTimeout(function(){ scansiona(scr); risvegliaSeg(scr); }, 30);
      setTimeout(function(){ scansiona(scr); risvegliaSeg(scr); }, 700);
    });
    var a = doc.querySelector('.screen.active'); if (a) { visti[a.id] = 1; }
    setInterval(function(){ if (doc.hidden) return; var s = doc.querySelector('.screen.active'); if (s) { try { cercaSeg(s); risvegliaSeg(s); [].forEach.call(s.querySelectorAll(NUM), function(el){ if (!el.closest(NONUM)) montaNum(el); }); } catch(e){} } }, 1500);
  }
  if (doc.readyState === 'complete') setTimeout(avvio, 0); else addEventListener('load', function(){ setTimeout(avvio, 0); });
  XM.scansiona = scansiona; XM.cascata = cascata;
  XM.attivi = function(){ return vivi.length + (rafId ? 1000 : 0); };
})();
;
(function(){
  'use strict';
  if (window.XP || !window.GBX) return;
  var XP = window.XP = { qs:{}, qk:{}, trReg:null, pfShown:false };
  var L = GBX.L;
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function iniziale(n){ var a = Array.from ? Array.from(String(n || '?').trim()) : String(n || '?').split(''); return esc((a[0] || '?').toUpperCase()); }
  function dopo(fn){ requestAnimationFrame(function(){ requestAnimationFrame(fn); }); }
  function visibile(el){ return !!(el && el.offsetParent !== null); }
  function testa(scr, cont, titolo, sotto){
    if (!cont) return;
    if (window.XW && XW.testata) XW.testata(scr, cont, titolo, cont);
    if (sotto && !cont.querySelector('.xp-sub')) {
      var big = cont.querySelector(':scope>.xw-big'), d = document.createElement('div');
      d.className = 'xp-sub'; d.textContent = sotto;
      cont.insertBefore(d, big ? big.nextSibling : cont.firstChild);
    }
  }
  function frase(el){ if (el && window.XW && XW.frase) XW.frase(el); }
  function vetro(el, n){ if (el && window.XW && XW.vetro) XW.vetro(el, n); }
  var IC = {
    snd:'<svg viewBox="0 0 24 24"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>',
    hap:'<svg viewBox="0 0 24 24"><rect x="8" y="3.5" width="8" height="17" rx="2"/><path d="M4.5 8.5v7M19.5 8.5v7"/></svg>',
    lng:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 3.5 5.4 3.5 8.5s-1 5.9-3.5 8.5c-2.5-2.6-3.5-5.4-3.5-8.5s1-5.9 3.5-8.5z"/></svg>',
    fair:'<svg viewBox="0 0 24 24"><path d="M12 3.5l7 3v5.5c0 4.2-2.9 7.3-7 8.5-4.1-1.2-7-4.3-7-8.5V6.5z"/><path d="M9 12l2 2 4-4"/></svg>',
    how:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.2 2.4c-.6.2-.8.7-.8 1.3v.3"/><path d="M12 16.8h.01"/></svg>'
  };
  function riga(b, ic, titolo, sotto){
    if (!b || b.__xp) return; b.__xp = 1;
    var o = document.createElement('span'); o.className = 'xp-orig';
    while (b.firstChild) o.appendChild(b.firstChild);
    b.appendChild(o);
    b.insertAdjacentHTML('beforeend', '<span class="xw-ic" aria-hidden="true">' + ic + '</span><span class="xp-ot"><b>' + titolo + '</b>' + (sotto ? '<small>' + sotto + '</small>' : '') + '</span><i class="x-chev" aria-hidden="true"></i>');
    b.removeAttribute('style');
  }
  function sv(root, sel){ if (!root) return; [].forEach.call(root.querySelectorAll(sel), function(e){ e.classList.add('x-sv'); }); }
  var RING_C = 2 * Math.PI * 49;
  function sndOn(){ try { return !(window.TWS && TWS.on === false); } catch(e){ return true; } }
  function hapOn(){ try { return !(typeof HAP !== 'undefined' && HAP && HAP.on === false); } catch(e){ return true; } }
  function setSnd(v){
    if (v === sndOn()) return;
    if (!v) GBX.fx('toggle');
    try {
      if (typeof window.twrSndToggle === 'function') window.twrSndToggle();
      else { TWS.on = v; localStorage.setItem('gb_tw_snd', v ? '1' : '0'); }
    } catch(e){}
    if (v) GBX.fx('toggle');
  }
  function setHap(v){
    if (v === hapOn()) return;
    try { if (typeof window.gbSetHaptics === 'function') window.gbSetHaptics(v); } catch(e){}
    GBX.sfx('toggle');
  }
  function swSync(){
    var a = $('xp-sw-snd'), b = $('xp-sw-hap');
    if (a) { a.classList.toggle('on', sndOn()); a.setAttribute('aria-checked', sndOn() ? 'true' : 'false'); }
    if (b) { b.classList.toggle('on', hapOn()); b.setAttribute('aria-checked', hapOn() ? 'true' : 'false'); }
  }
  XP.sw = function(k){ if (k === 'snd') setSnd(!sndOn()); else setHap(!hapOn()); swSync(); };
  XP.lingua = function(l){
    if ((window.GB_LANG || 'it') === l) { GBX.fx('tick'); return; }
    [].forEach.call(document.querySelectorAll('.xp-lang button'), function(b){ b.classList.toggle('on', b.getAttribute('data-l') === l); });
    GBX.fx('toggle');
    setTimeout(function(){ try { gbSetLang(l); } catch(e){} }, 200);
  };
  function profiloSetup(){
    var scr = $('profile'); if (!scr) return;
    var cont = scr.querySelector('.game-content');
    testa(scr, cont, L('Profilo', 'Profile'));
    var av = $('pf-avatar-container');
    if (av && !av.querySelector('.xp-ring')) {
      av.insertAdjacentHTML('afterbegin', '<svg class="xp-ring" viewBox="0 0 104 104" aria-hidden="true">'
        + '<circle class="bg" cx="52" cy="52" r="49"/><circle class="fg" cx="52" cy="52" r="49" stroke-dasharray="' + RING_C.toFixed(1) + '" stroke-dashoffset="' + RING_C.toFixed(1) + '"/></svg>');
    }
    var hero = scr.querySelector('.pf-hero'); if (hero) hero.classList.add('x-lastra');
    var bar = $('pf-bar'), lv = bar && bar.closest('.lvl-card');
    if (lv) lv.classList.add('xp-lv', 'x-lastra');
    var sg = $('pf-stat-grid'); if (sg) sg.classList.add('x-lastra', 'xw-gr');
    var it = $('gb-lang-it'), lc = it && it.closest('.lvl-card'); if (lc) lc.style.display = 'none';
    var fair = scr.querySelector('.pf-fair-btn'), help = fair && fair.previousElementSibling;
    if (help && help.classList.contains('section-ttl') && !$('xp-set')) {
      var l = window.GB_LANG || 'it';
      help.insertAdjacentHTML('beforebegin',
        '<div class="section-ttl">' + L('IMPOSTAZIONI', 'SETTINGS') + '</div>'
        + '<div class="xp-set x-lastra xw-gr" id="xp-set">'
        + '<div class="xp-opt"><span class="xw-ic" aria-hidden="true">' + IC.snd + '</span><div class="xp-ot"><b>' + L('Suoni', 'Sounds') + '</b><small>' + L('Effetti della mini app e dei giochi', 'Mini app and game effects') + '</small></div>'
        + '<button class="xp-sw" id="xp-sw-snd" role="switch" data-x-silent onclick="XP.sw(&quot;snd&quot;)" aria-label="' + L('Suoni', 'Sounds') + '"></button></div>'
        + '<div class="xp-opt"><span class="xw-ic" aria-hidden="true">' + IC.hap + '</span><div class="xp-ot"><b>' + L('Vibrazione', 'Haptics') + '</b><small>' + L('Il telefono risponde a ogni tocco', 'Your phone answers every tap') + '</small></div>'
        + '<button class="xp-sw" id="xp-sw-hap" role="switch" data-x-silent onclick="XP.sw(&quot;hap&quot;)" aria-label="' + L('Vibrazione', 'Haptics') + '"></button></div>'
        + '<div class="xp-opt"><span class="xw-ic" aria-hidden="true">' + IC.lng + '</span><div class="xp-ot"><b>' + L('Lingua', 'Language') + '</b></div><div class="xp-lang">'
        + '<button data-x-silent data-l="it" class="' + (l !== 'en' ? 'on' : '') + '" onclick="XP.lingua(&quot;it&quot;)">IT</button>'
        + '<button data-x-silent data-l="en" class="' + (l === 'en' ? 'on' : '') + '" onclick="XP.lingua(&quot;en&quot;)">EN</button></div></div>'
        + '</div>');
    }
    var how = scr.querySelector('button[onclick="obOpen()"]');
    if (fair && !scr.querySelector('.xp-help')) {
      var g = document.createElement('div'); g.className = 'xp-help x-lastra xw-gr';
      fair.parentNode.insertBefore(g, fair); g.appendChild(fair); if (how) g.appendChild(how);
      riga(fair, IC.fair, L('Equità', 'Provably fair'), L('Verifica le giocate', 'Verify your bets'));
      if (how) riga(how, IC.how, L('Come si gioca', 'How to play'), L('Rivedi il tutorial', 'Replay the tutorial'));
    }
    [].forEach.call(scr.querySelectorAll('.section-ttl,.stat-lbl,.pf-title-name'), frase);
    swSync();
  }
  function profiloDopo(){
    var bar = $('pf-bar');
    if (bar) {
      var k = Math.max(0, Math.min(100, parseFloat(bar.style.width) || 0)) / 100;
      var ring = document.querySelector('#pf-avatar-container .xp-ring .fg');
      var primo = !XP.pfShown && CUR === 'profile';
      if (primo) { bar.style.setProperty('--xp-k', '0'); if (ring) ring.setAttribute('stroke-dashoffset', RING_C.toFixed(1)); }
      dopo(function(){ bar.style.setProperty('--xp-k', String(k)); if (ring) ring.setAttribute('stroke-dashoffset', (RING_C * (1 - k)).toFixed(1)); });
    }
    var conta = false;
    ['pf-wins', 'pf-losses', 'pf-bet', 'pf-big'].forEach(function(id){
      var el = $(id); if (!el) return;
      el.__xc = (el.__xc || 0) + 1;
      if (!conta) return;
      var t = el.textContent, euro = t.indexOf('€') === 0, v = parseInt(t.replace(/[^\d]/g, ''), 10) || 0;
      if (!v) return;
      GBX.count(el, 0, v, function(x){ return euro ? '€' + Math.round(x).toLocaleString() : String(Math.round(x)); }, 900);
    });
    if (CUR === 'profile') XP.pfShown = true;
    swSync();
  }
  var CORONA = '<svg class="crown" viewBox="0 0 26 16" aria-hidden="true"><path d="M1 4l6 5 6-8 6 8 6-5-2.5 12h-19z"/></svg>';
  function lbLeggi(it){
    var nm = it.querySelector('.lb-name'), info = nm && nm.querySelector('.lb-info');
    var infoT = info ? info.textContent.trim() : '';
    var nome = nm ? nm.textContent.replace(infoT, '').trim() : '';
    if (nome.indexOf('⭐') === 0) nome = nome.slice(1).trim();
    var val = it.querySelector('.lb-val');
    return { nome: nome || 'Player', info: infoT.replace(/^\S+\s+/, ''), val: val ? val.textContent.trim() : '', me: it.classList.contains('me') };
  }
  function lbTrasforma(){
    var lb = $('lb-list'); if (!lb) return;
    var items = lb.querySelectorAll('.lb-item'); if (!items.length) return;
    var p = [].map.call(items, lbLeggi), tu = '<span class="xp-tu">' + L('TU', 'YOU') + '</span>';
    var h = '<div class="xp-conta"><span>' + L('Per vittorie totali', 'By total wins') + '</span><span>' + p.length + ' ' + L('giocatori', 'players') + '</span></div><div class="xp-lista">';
    for (var i = 0; i < p.length; i++) {
      var r = p[i];
      h += '<div class="xp-row' + (i < 3 ? ' p' + (i + 1) : '') + (r.me ? ' me' : '') + '"><span class="rk">' + (i + 1) + '</span><span class="av">' + iniziale(r.nome) + '</span>'
        + '<div class="t"><b>' + esc(r.nome) + (r.me ? tu : '') + '</b><span>' + esc(r.info) + '</span></div><span class="v">' + esc(r.val) + '</span></div>';
    }
    lb.innerHTML = h + '</div>';
    vetro(lb.querySelector('.xp-lista'), p.length);
    if (CUR === 'leaderboard') GBX.fx('soft');
  }
  function classificaSetup(){
    var scr = $('leaderboard'); if (!scr) return;
    var cont = scr.querySelector('.game-content'), lb = $('lb-list');
    testa(scr, cont, L('Classifica', 'Leaderboard'), L('Gioca, vinci e sali in classifica.', 'Play, win and climb the board.'));
    if (lb && window.MutationObserver) new MutationObserver(function(){ if (lb.querySelector('.lb-item')) lbTrasforma(); }).observe(lb, { childList:true });
    lbTrasforma();
  }
  function questSetup(){
    var scr = $('challenges'); if (!scr) return;
    var cont = scr.querySelector('.game-content');
    testa(scr, cont, 'Quest', L('Completa le missioni e riscuoti il premio sul saldo.', 'Complete missions and claim the prize to your balance.'));
    var rt = $('q-reset-timer'); if (rt) rt.classList.add('x-lastra');
    [].forEach.call(scr.querySelectorAll('.q-tab'), function(t){ t.classList.add('xw-tb'); frase(t); });
  }
  function questDopo(){
    var c = $('ch-list'); if (!c) return;
    var vede = (CUR === 'challenges'), suonoPronta = null, suonoPresa = null;
    var nq = c.querySelectorAll('.q-card').length;
    if (nq) vetro(c, nq); else c.classList.remove('xw-gr', 'x-lastra', 'xw-vetro');
    [].forEach.call(c.querySelectorAll('.q-diff,.q-ok,.q-cta,.q-reward.presa'), frase);
    [].forEach.call(c.querySelectorAll('.q-card'), function(card){
      var nm = card.querySelector('.q-name'), key = (card.className.match(/\b(easy|medium|hard|epic|season)\b/) || [''])[0] + '|' + (nm ? nm.textContent : '');
      var fill = card.querySelector('.q-fill');
      if (fill) {
        var k = Math.max(0, Math.min(100, parseFloat(fill.style.width) || 0)) / 100, prima = XP.qk[key];
        fill.style.setProperty('--xq-k', String(prima == null ? 0 : prima));
        dopo(function(){ fill.style.setProperty('--xq-k', String(k)); });
        XP.qk[key] = k;
      }
      var stato = card.classList.contains('done') ? 'presa' : (card.classList.contains('q-pronta') ? 'pronta' : 'corso');
      var era = XP.qs[key];
      if (vede && stato === 'pronta' && era !== 'pronta') suonoPronta = suonoPronta || card;
      if (vede && stato === 'presa' && era && era !== 'presa') suonoPresa = suonoPresa || card;
      XP.qs[key] = stato;
    });
    if (suonoPronta) setTimeout(function(){
      if (!visibile(suonoPronta)) return;
      GBX.fx('unlock'); suonoPronta.classList.remove('xp-qdone'); void suonoPronta.offsetWidth; suonoPronta.classList.add('xp-qdone');
    }, 950);
    if (suonoPresa) { GBX.fx('cash'); }
  }
  function trnSetup(){
    var scr = $('torneo'); if (!scr) return;
  }
  function trnIscrizioni(){
    var d = window.TRN && TRN.state, m = {};
    if (!d) return null;
    (d.upcoming || []).forEach(function(t){ m[String(t.id)] = !!t.registered; });
    if (d.active && d.id != null) m['cur:' + d.id] = !!d.registered;
    return m;
  }
  function trnDopo(){
    var b = $('trn-body'); if (!b) return;
    sv(b, '.ut-tc,.ut-alb,.ut-hero,.ut-you,.ut-acc,.ut-lv,.ut-card:not(.ut-chat)');
    var ora = trnIscrizioni(), prima = XP.trReg;
    if (ora && prima && CUR === 'torneo') {
      for (var id in ora) {
        if (!(id in prima) || prima[id] === ora[id]) continue;
        if (ora[id]) {
          GBX.fx('chips');
          setTimeout(function(){ GBX.fx('win'); }, 180);
        } else GBX.fx('back');
        break;
      }
    }
    if (ora) XP.trReg = ora;
  }
  function avvolgi(nome, dopoFn){
    var f = window[nome];
    if (typeof f !== 'function' || f.__xp) return;
    var w = function(){ var r = f.apply(this, arguments); try { dopoFn(); } catch(e){} return r; };
    w.__xp = true;
    try { window[nome] = w; } catch(e){}
  }
  try { profiloSetup(); } catch(e){ console.warn('[XP] profilo', e); }
  try { classificaSetup(); } catch(e){ console.warn('[XP] classifica', e); }
  try { questSetup(); } catch(e){ console.warn('[XP] quest', e); }
  try { trnSetup(); } catch(e){ console.warn('[XP] tornei', e); }
  ['profile', 'leaderboard', 'challenges'].forEach(function(id){ var e = $(id); if (e) GBX.tilt(e); });
  avvolgi('renderProfile', profiloDopo);
  avvolgi('renderChallenges', questDopo);
  avvolgi('trnRender', trnDopo);
  avvolgi('trnDetRender', trnDopo);
  document.addEventListener('gbx:screen', function(e){
    var id = e.detail && e.detail.id;
    if (id !== 'profile') XP.pfShown = false;
    if (id === 'profile') swSync();
  });
})();
;
(function(){
  'use strict';
  if (window.__gbxProfIt) return; window.__gbxProfIt = 1;
  function it(){ return (window.GB_LANG || 'it') !== 'en'; }
  function traduci(){
    if (!it()) return;
    var D = { 'lifetime stats':'Statistiche', 'achievements':'Traguardi', 'wins':'Vittorie', 'losses':'Sconfitte',
              'total bet':'Puntato in totale', 'biggest win':'Vincita più alta', 'unranked':'Fuori classifica', 'help':'Aiuto', 'max level':'Livello massimo' };
    var pr = document.getElementById('profile');
    if (pr) { var w = document.createTreeWalker(pr, NodeFilter.SHOW_TEXT, null), n, k;
      while ((n = w.nextNode())) { k = n.nodeValue.trim().toLowerCase(); if (k && D[k]) n.nodeValue = n.nodeValue.replace(n.nodeValue.trim(), D[k]); } }
    var rt = document.getElementById('pf-rank-text');
    if (rt) {
      var t = rt.textContent, m = /^Rank #(\d+) globally$/.exec(t);
      if (t === 'Climb the leaderboard!') rt.textContent = 'Scala la classifica!';
      else if (m) rt.textContent = m[1] + '° in classifica';
    }
    var wr = document.getElementById('pf-winrate');
    if (wr && /Win rate:/.test(wr.innerHTML)) {
      wr.innerHTML = wr.innerHTML.replace('Win rate:', 'Percentuale di vittorie:').replace(/<\/b> games/, '</b> partite')
        .replace('Avg bet:', 'Puntata media:').replace('Net:', 'Saldo:').replace(/ balance<\/small>/, '</small>');
    }
  }
  var TRAG = { first_win:'Prima vittoria', card_master:'Maestro delle carte', duelist:'Duellante', sharp:'Livello Sharp',
               jackpot:'Jackpot', patron:'Patron', big_bet:'High Roller', collector:'Lotteria' };
  var NAV = { 'Home':'Home', 'Wallet':'Wallet', 'Top':'Classifica', 'Quests':'Quest', 'Profile':'Profilo' };
  var NAV_EN = { 'Classifica':'Top', 'Quest':'Quests', 'Profilo':'Profile' };
  function traguardi(){
    try { if (!window.ACHIEVEMENTS) return; ACHIEVEMENTS.forEach(function(a){ if (!a.__en) a.__en = a.name; a.name = it() ? (TRAG[a.id] || a.__en) : a.__en; }); } catch(e){}
  }
  function barra(){
    var D = it() ? NAV : NAV_EN;
    [].forEach.call(document.querySelectorAll('.bnav .bnav-btn'), function(b){
      for (var n = b.lastChild; n; n = n.previousSibling) if (n.nodeType === 3 && n.nodeValue.trim()) {
        var k = n.nodeValue.trim(); if (D[k] && D[k] !== k) n.nodeValue = n.nodeValue.replace(k, D[k]); break; }
    });
  }
  function aggancia(){
    var f = window.renderProfile; if (typeof f !== 'function' || f.__it) return;
    var g = function(){ traguardi(); var r = f.apply(this, arguments); try { traduci(); } catch(e){} return r; };
    g.__it = 1; window.renderProfile = g;
  }
  aggancia(); traguardi(); barra();
  document.addEventListener('gbx:lang', function(){ traguardi(); barra(); });
  document.addEventListener('gbx:screen', function(e){ if (e.detail && e.detail.id === 'profile') { aggancia(); try { traduci(); } catch(x){} } });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ aggancia(); traguardi(); barra(); traduci(); }); else traduci();
})();
;
(function(){
  'use strict';
  if (window.__xp2) return; window.__xp2 = 1;
  function riduci(){ try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){ return false; } }
  function monta(){
    var car = document.querySelector('#duel .xa-car'), dots = document.querySelector('#duel .xa-dots');
    if (!car || !dots || !dots.children.length || dots.__xp2) return !!(dots && dots.__xp2);
    dots.__xp2 = 1; dots.classList.add('xp2-on');
    var pill = document.createElement('i'); pill.className = 'xp2-pill'; pill.setAttribute('aria-hidden', 'true'); dots.appendChild(pill);
    var raf = 0, ultimo = '';
    function centri(){ return [].filter.call(dots.children, function(b){ return b.tagName === 'BUTTON'; }).map(function(b){ return b.offsetLeft + b.offsetWidth / 2; }); }
    function slides(){ return [].slice.call(car.children); }
    function disegna(){
      raf = 0;
      var S = slides(), C = centri(); if (S.length < 2 || C.length < 2) return;
      var pad = parseFloat(getComputedStyle(car).scrollPaddingLeft || 0) || 0, x = car.scrollLeft, n = Math.min(S.length, C.length);
      var pos = S.map(function(s){ return s.offsetLeft - pad; });
      var i = 0; while (i < n - 2 && x >= pos[i + 1]) i++;
      var f = (x - pos[i]) / Math.max(1, pos[i + 1] - pos[i]); f = Math.max(0, Math.min(1, f));
      if (x >= pos[n - 1]) { i = n - 2; f = 1; }
      var a = C[i], b = C[i + 1], d = b - a;
      var testa = a + d * Math.min(1, f * 2), coda = a + d * Math.max(0, f * 2 - 1);
      var meta = 8;
      bersaglio = [coda - meta, testa + meta];
      if (!anima) anima = requestAnimationFrame(passo);
    }
    var bersaglio = null, stato = null, vel = [0, 0], anima = 0, tPrima = 0;
    function passo(t){
      anima = 0; if (!bersaglio) return;
      if (!stato) stato = bersaglio.slice();
      var dt = Math.min(0.034, tPrima ? (t - tPrima) / 1000 : 0.016); tPrima = t;
      var dir = bersaglio[1] + bersaglio[0] >= stato[1] + stato[0] ? 1 : -1;
      for (var j = 0; j < 2; j++) {
        var davanti = (dir > 0 && j === 1) || (dir < 0 && j === 0);
        var k = davanti ? 520 : 210, c = davanti ? 40 : 27;
        var a = k * (bersaglio[j] - stato[j]) - c * vel[j];
        vel[j] += a * dt; stato[j] += vel[j] * dt;
      }
      if (stato[1] - stato[0] < 16) { var m = (stato[0] + stato[1]) / 2; stato[0] = m - 8; stato[1] = m + 8; }
      var sx = stato[0], w = stato[1] - stato[0];
      var kk = sx.toFixed(1) + '|' + w.toFixed(1);
      if (kk !== ultimo) { ultimo = kk; pill.style.transform = 'translate3d(' + sx.toFixed(1) + 'px,-50%,0)'; pill.style.width = w.toFixed(1) + 'px'; }
      var fermo = Math.abs(bersaglio[0] - stato[0]) < .2 && Math.abs(bersaglio[1] - stato[1]) < .2 && Math.abs(vel[0]) + Math.abs(vel[1]) < 2;
      if (fermo) { stato = bersaglio.slice(); vel = [0, 0]; tPrima = 0;
        pill.style.transform = 'translate3d(' + stato[0].toFixed(1) + 'px,-50%,0)'; pill.style.width = (stato[1] - stato[0]).toFixed(1) + 'px'; return; }
      anima = requestAnimationFrame(passo);
    }
    function chiedi(){ if (!raf) raf = requestAnimationFrame(disegna); }
    car.addEventListener('scroll', chiedi, { passive:true });
    addEventListener('resize', chiedi);
    document.addEventListener('gbx:screen', function(e){ if (e.detail && e.detail.id === 'duel') setTimeout(chiedi, 60); });
    if (riduci()) pill.classList.add('xp2-fermo');
    setTimeout(chiedi, 30); setTimeout(chiedi, 600);
    return true;
  }
  var tent = 0;
  (function prova(){ if (monta() || ++tent > 40) return; setTimeout(prova, 500); })();
  document.addEventListener('gbx:screen', function(e){ if (e.detail && e.detail.id === 'duel') monta(); });
})();
;
(function(){
  'use strict';
  if (window.XQ2 || !window.GBX || window.XQ2_OFF) return;
  var XQ2 = window.XQ2 = { on:true };
  var L = GBX.L;
  function $(id){ return document.getElementById(id); }
  function warn(d, e){ try { console.warn('[XQ2] ' + d, e); } catch(_){} }
  var IC = {
    check:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    lock:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8.5 10.5v-3a3.5 3.5 0 0 1 7 0v3"/></svg>',
    dono:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="10.5" rx="1.5"/><path d="M3 7h18v3H3zM12 7v13.5M12 7C10.5 3.5 6.5 3.5 6.5 5.8 6.5 7 9 7 12 7zM12 7c1.5-3.5 5.5-3.5 5.5-1.2C17.5 7 15 7 12 7z"/></svg>',
    vuoto:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l7.5 4.2v8.6L12 20.5l-7.5-4.2V7.7z"/><path d="M4.5 7.7L12 12l7.5-4.3M12 12v8.5"/></svg>',
    rete:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 9.5a12 12 0 0 1 17 0M6.5 12.6a7.6 7.6 0 0 1 11 0M9.5 15.7a3.3 3.3 0 0 1 5 0"/><path d="M12 19.2h.01"/></svg>'
  };
  function frase(t){
    if (!t || t !== t.toUpperCase() || t === t.toLowerCase()) return t;
    var s = t.toLowerCase(), i = s.search(/[a-zà-ɏ]/);
    s = i < 0 ? s : s.slice(0, i) + s.charAt(i).toUpperCase() + s.slice(i + 1);
    return s.replace(/«([a-zà-ɏ])/g, function(m, c){ return '«' + c.toUpperCase(); });
  }
  function fraseIn(el){
    if (!el) return;
    var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), n;
    while ((n = w.nextNode())) {
      if (n.parentNode && n.parentNode.closest && n.parentNode.closest('svg')) continue;
      var v = n.nodeValue; if (!v.trim()) continue;
      var f = frase(v.trim());
      if (f !== v.trim()) n.nodeValue = v.replace(v.trim(), f);
    }
  }
  function nitida(cv, k, disegna){
    if (!cv || cv.__xq2) return; cv.__xq2 = 1;
    var w = cv.width, h = cv.height, tmp = document.createElement('canvas');
    tmp.width = w; tmp.height = h;
    try { tmp.getContext('2d').drawImage(cv, 0, 0); } catch(e){ return; }
    cv.width = w * k; cv.height = h * k;
    try { disegna(cv); }
    catch(e){ try { var x = cv.getContext('2d'); x.clearRect(0, 0, cv.width, cv.height); x.drawImage(tmp, 0, 0, cv.width, cv.height); } catch(_){} }
  }
  var BARRE = {};
  function barra(card, chiave){
    var f = card.querySelector('.q-fill'); if (!f) return;
    var k = Math.max(0, Math.min(100, parseFloat(f.style.width) || 0)) / 100, prima = BARRE[chiave];
    f.style.setProperty('--xq-k', String(prima == null ? 0 : prima));
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ f.style.setProperty('--xq-k', String(k)); }); });
    BARRE[chiave] = k;
  }
  function statoDa(btn, card){
    if (!btn) return card && card.classList.contains('q-pronta') ? 'pronta' : 'lock';
    var oc = btn.getAttribute('onclick') || '';
    if (btn.classList.contains('q-b-eq')) return 'eq';
    if (btn.classList.contains('q-b-oro')) return /Claim\(/.test(oc) ? 'pronta' : 'mio';
    if (btn.classList.contains('q-b-lock')) return 'quest';
    return 'lock';
  }
  function badge(st){
    if (st === 'eq') return '<span class="xq2-bdg eq">' + IC.check + L('In uso', 'Equipped') + '</span>';
    if (st === 'mio') return '<span class="xq2-bdg mio">' + L('Tuo', 'Owned') + '</span>';
    if (st === 'pronta') return '<span class="xq2-bdg pronta">' + IC.dono + L('Pronto', 'Ready') + '</span>';
    return '<span class="xq2-bdg chiuso" aria-label="' + L('Bloccato', 'Locked') + '">' + IC.lock + '</span>';
  }
  function cosCarta(card, mode){
    if (card.__xq2) return; card.__xq2 = 1;
    var cv = card.querySelector('canvas.q-cv'), corpo = card.querySelector(':scope>div'),
        diff = card.querySelector('.q-diff'), nm = card.querySelector('.q-name'), btn = card.querySelector('.cos-btn');
    var st = statoDa(btn, card);
    card.classList.add('xq2-c', 'xq2-st-' + st);
    barra(card, 'c|' + mode + '|' + ((card.querySelector('canvas') || {}).id || ''));
    if (corpo) corpo.classList.add('xq2-corpo');
    if (cv) {
      var arte = document.createElement('div'); arte.className = 'xq2-arte';
      cv.parentNode.insertBefore(arte, cv); arte.appendChild(cv);
      if (diff) { diff.classList.add('xq2-rar'); arte.appendChild(diff); }
      arte.insertAdjacentHTML('beforeend', badge(st));
      var id = cv.id || '';
      if (mode === 'tavolo') {
        var s = (window.TVL_SKIN || []).filter(function(x){ return 'tvlcv_' + x.id === id; })[0];
        if (s && typeof tvlDisegna === 'function') nitida(cv, 4, function(c){ tvlDisegna(c, s.slot, s.idx); });
      } else {
        var cat = (window.COS && COS.data && COS.data.catalog && COS.data.catalog[mode]) || [];
        var cd = cat.filter(function(x){ return 'coscv_' + mode + '_' + x.id === id; })[0];
        if (cd && typeof _cosDrawPreview === 'function') nitida(cv, 2, function(c){
          _cosDrawPreview(c, mode, cd.look_patch);
          if ((mode === 'turf' || mode === 'calcio') && typeof cos3Metti === 'function') cos3Metti(c, mode, cd.look_patch);
        });
      }
    }
    fraseIn(diff); fraseIn(nm); fraseIn(btn);
    [].forEach.call(card.querySelectorAll('.qn-lock span'), fraseIn);
  }
  function cosConta(host){
    var box = $('cosmetics-list'); if (!box) return;
    var c = $('xq2-conta');
    if (!c) { c = document.createElement('div'); c.id = 'xq2-conta'; c.className = 'xq2-conta'; box.insertBefore(c, host); }
    var tot = host.querySelectorAll('.xq2-c').length;
    if (!tot) { c.hidden = true; return; }
    var miei = host.querySelectorAll('.xq2-st-eq,.xq2-st-mio').length, pronte = host.querySelectorAll('.xq2-st-pronta').length;
    c.hidden = false;
    c.innerHTML = '<span>' + L('Sbloccati ', 'Unlocked ') + '<b>' + miei + '</b>' + L(' di ', ' of ') + tot + '</span>'
      + (pronte ? '<span class="pr">' + pronte + ' ' + L('da riscuotere', 'to claim') + '</span>' : '');
  }
  function cosVuoto(host, titolo, testo, ic){
    return '<div class="xq2-vuoto"><span class="ic">' + (ic || IC.vuoto) + '</span><b>' + titolo + '</b>' + (testo ? '<span>' + testo + '</span>' : '') + '</div>';
  }
  function cosDopo(){
    var host = $('cos-cards'); if (!host) return;
    host.classList.add('xq2-g');
    var mode = window._COS_MODE || 'turf';
    [].forEach.call(host.querySelectorAll('.q-card.q-riga'), function(card){ try { cosCarta(card, mode); } catch(e){ warn('carta', e); } });
    [].forEach.call(host.querySelectorAll('.qn-sez'), function(sz){
      if (sz.__xq2) return; sz.__xq2 = 1; sz.classList.add('xq2-sez');
      fraseIn(sz.querySelector(':scope>div')); fraseIn(sz.querySelector('.qn-serie')); fraseIn(sz.querySelector('.cos-btn'));
    });
    if (!host.querySelector('.q-card') && !host.querySelector('.gb-skel-wrap') && host.textContent.trim() === '—')
      host.innerHTML = cosVuoto(host, L('Niente da sbloccare qui', 'Nothing to unlock here'), L('Per questo gioco non ci sono ancora oggetti. Tornano con le prossime quest.', 'No items for this game yet. More arrive with the next quests.'));
    cosConta(host);
  }
  function msgDopo(host){
    if (!host) return;
    var d = host.firstElementChild; if (!d || d.__xq2) return; d.__xq2 = 1;
    var t = d.textContent.trim();
    if (t === '—') { cosDopo(); return; }
    var off = /offline|errore|error/i.test(t);
    d.className = 'xq2-vuoto'; d.removeAttribute('style');
    d.innerHTML = '<span class="ic">' + (off ? IC.rete : IC.vuoto) + '</span><b>' + d.innerHTML + '</b>';
    var c = $('xq2-conta'); if (c) c.hidden = true;
  }
  function qnDopo(){
    var c = $('qn-list'); if (!c) return;
    c.classList.add('xq2-nuove');
    [].forEach.call(c.querySelectorAll('.qn-sez'), function(sz){
      if (sz.__xq2) return; sz.__xq2 = 1; sz.classList.add('xq2-sez'); fraseIn(sz.querySelector(':scope>div'));
    });
    [].forEach.call(c.querySelectorAll('.q-card'), function(card){
      if (card.__xq2) return; card.__xq2 = 1;
      var btn = card.querySelector('.qn-btn button'), st;
      if (card.classList.contains('q-pronta')) st = 'pronta';
      else if (card.classList.contains('qn-fatta')) st = btn ? statoDa(btn, card) : 'presa';
      else st = 'corso';
      card.classList.add('xq2-n', 'xq2-st-' + st);
      barra(card, 'n|' + card.id);
      var cv = card.querySelector('.qn-premio canvas'), id = (card.id || '').replace(/^qnc_/, '');
      var q = typeof qnDi === 'function' ? qnDi(id) : null;
      if (cv && q && typeof qnAnteprima === 'function') nitida(cv, 2, function(x){ qnAnteprima(x, q.premio); });
      var pr = card.querySelector('.qn-premio');
      if (pr && (st === 'eq' || st === 'mio')) pr.insertAdjacentHTML('afterbegin', badge(st));
      fraseIn(card.querySelector('.q-diff')); fraseIn(card.querySelector('.q-name')); fraseIn(card.querySelector('.qn-pnome'));
      fraseIn(card.querySelector('.q-prog b')); fraseIn(btn); fraseIn(card.querySelector('.qn-presa'));
    });
    var e = c.querySelector('.qn-vuoto');
    if (e && !e.__xq2) { e.__xq2 = 1; e.className = 'xq2-vuoto'; e.innerHTML = '<span class="ic">' + IC.vuoto + '</span><b>' + e.innerHTML + '</b>'; }
    var er = c.querySelector('.q-err');
    if (er && !er.__xq2) { er.__xq2 = 1; er.classList.add('xq2-err'); er.insertAdjacentHTML('afterbegin', '<span class="ic">' + IC.rete + '</span>'); fraseIn(er.querySelector('.q-cta')); }
  }
  function sbloccoDopo(q){
    var ovs = document.querySelectorAll('.qn-ov'), o = ovs[ovs.length - 1]; if (!o || o.__xq2) return; o.__xq2 = 1;
    o.classList.add('xq2-ov');
    var cv = o.querySelector('canvas.qn-big');
    if (cv && q && q.premio && typeof qnAnteprima === 'function') nitida(cv, 2, function(x){ qnAnteprima(x, q.premio); });
    [].forEach.call(o.querySelectorAll('.qn-tit,.qn-nm,.action-btn'), fraseIn);
  }
  function avvolgi(nome, dopoFn){
    var f = window[nome];
    if (typeof f !== 'function' || f.__xq2) return;
    var w = function(){ var r = f.apply(this, arguments); try { dopoFn.apply(this, arguments); } catch(e){ warn(nome, e); } return r; };
    w.__xq2 = true;
    try { window[nome] = w; } catch(e){}
  }
  avvolgi('renderCosmeticsCards', cosDopo);
  avvolgi('tvlCards', cosDopo);
  avvolgi('_cosMsg', function(host){ msgDopo(host); });
  avvolgi('qnRender', qnDopo);
  avvolgi('qnSblocco', function(q){ sbloccoDopo(q); });
  try { var h = $('cos-cards'); if (h) h.classList.add('xq2-g'); } catch(e){}
})();
;
(function () {
  'use strict';
  if (window.RC2) return;
  if (typeof rtdDrawRace !== 'function') return;
  var RC2 = window.RC2 = { v: '1611' };
  function lang() { return (window.GB_LANG === 'en') ? 'en' : 'it'; }
  function spento() { try { return localStorage.getItem('gb_rc2') === '0'; } catch (e) { return false; } }
  var LIVC = ['', '#3fa9ff', '#ff9a2e', '#c34dff'];
  var FAN = { mappa: null, g: {}, ora: null };
  function fantasmi(raw, lp, dt, now) {
    var M = RTD.map; if (!M || !M.line || !lp) return;
    if (now != null && FAN.ora === now) return;
    FAN.ora = now;
    if (FAN.mappa !== M) { FAN.mappa = M; FAN.g = {}; }
    var L = M.line, Wd = M.widths || [], n = L.length, tutti = !!raw.over;
    var rows = [lp.a && lp.a.p, lp.b && lp.b.p, raw.p], seen = {};
    var rb = (lp.b && lp.b.p) || raw.p || [];
    for (var i = 0; i < rb.length; i++) {
      var r = rb[i], pid = String(r[0]);
      if (!((r[7] & 8) || tutti)) continue;
      var g = FAN.g[pid];
      if (!g) {
        var ra = null, A = (lp.a && lp.a.p) || [];
        for (var q = 0; q < A.length; q++) if (A[q][0] === r[0]) { ra = A[q]; break; }
        ra = ra || r;
        var k = lp.k || 0, best = 0, bd = 1e9;
        var x0 = ra[1] + (r[1] - ra[1]) * k, y0 = ra[2] + (r[2] - ra[2]) * k;
        for (var j = 0; j < n; j++) { var dx = L[j][0] - x0, dy = L[j][1] - y0, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = j; } }
        g = FAN.g[pid] = { x: x0, y: y0, a: r[3] || 0, v: Math.max(0, r[4] || 0), i: best };
      }
      seen[pid] = g;
    }
    for (var pid2 in seen) {
      var g2 = seen[pid2], b2 = g2.i, bd2 = 1e9;
      for (var o = -4; o <= 10; o++) { var jj = (g2.i + o + n) % n, ex = L[jj][0] - g2.x, ey = L[jj][1] - g2.y, dd = ex * ex + ey * ey; if (dd < bd2) { bd2 = dd; b2 = jj; } }
      g2.i = b2;
      var tg = L[(b2 + 3) % n], ta = Math.atan2(tg[1] - g2.y, tg[0] - g2.x), df = Math.atan2(Math.sin(ta - g2.a), Math.cos(ta - g2.a));
      g2.a += Math.max(-3 * dt, Math.min(3 * dt, df));
      if (g2.v > 4) g2.v = Math.max(4, g2.v - 3.5 * dt);
      g2.x += Math.cos(g2.a) * g2.v * dt; g2.y += Math.sin(g2.a) * g2.v * dt;
      var w = (Wd[b2] || 2.6) - 0.6, ox = g2.x - L[b2][0], oy = g2.y - L[b2][1], od = Math.hypot(ox, oy);
      if (od > w && w > 0) { g2.x = L[b2][0] + ox / od * w; g2.y = L[b2][1] + oy / od * w; }
    }
    for (var s2 = 0; s2 < rows.length; s2++) {
      var R = rows[s2]; if (!R) continue;
      for (var t = 0; t < R.length; t++) {
        var gg = seen[String(R[t][0])]; if (!gg) continue;
        R[t][1] = gg.x; R[t][2] = gg.y; R[t][3] = gg.a; R[t][4] = gg.v; R[t][7] = (R[t][7] & 8); R[t][8] = 0;
        if (R[t].length > 9) R[t][9] = 0;
      }
    }
  }
  RC2.fantasmi = fantasmi; RC2.FAN = FAN;
  var SC2 = {};
  function scia2d(ctx, lp, now) {
    var P = RTD._sc && RTD._sc.fxMap, cell = RTD._sc && RTD._sc.fxCell; if (!P || !cell) return;
    var rb = (lp && lp.b && lp.b.p) || []; var A = {}, ra0 = (lp && lp.a && lp.a.p) || [], k = lp ? lp.k : 0;
    for (var i = 0; i < ra0.length; i++) A[ra0[i][0]] = ra0[i];
    for (var j = 0; j < rb.length; j++) {
      var r = rb[j], pid = String(r[0]), ra = A[r[0]] || r, h = SC2[pid] || (SC2[pid] = []);
      var x = ra[1] + (r[1] - ra[1]) * k, y = ra[2] + (r[2] - ra[2]) * k, an = r[3] || 0;
      var ex = x - Math.cos(an) * 0.5, ey = y - Math.sin(an) * 0.5, on = !!(r[7] & 4);
      if (on) h.unshift({ x: ex, y: ey, t: now });
      while (h.length && (now - h[h.length - 1].t > 480 || h.length > 30)) h.pop();
      if (h.length < 3) continue;
      var car = null; try { car = rcCarOf(pid); } catch (e) { }
      var col = (car && car.neon) || '#22d3ee';
      ctx.save(); ctx.lineCap = 'round'; ctx.globalCompositeOperation = 'lighter';
      for (var q = 1; q < h.length; q++) {
        var f = q / h.length, a = P(h[q - 1].x, h[q - 1].y), b = P(h[q].x, h[q].y);
        ctx.globalAlpha = 0.55 * (1 - f); ctx.strokeStyle = col; ctx.lineWidth = cell * 0.22 * (1 - f * 0.8);
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      }
      ctx.restore();
    }
  }
  var DV = { mappa: null, s: {} };
  function wrap(a) { return Math.atan2(Math.sin(a), Math.cos(a)); }
  function extraDi(st, slip, fl, di, dt) {
    var tgt = 0;
    if (fl & 1) {
      var sg = Math.abs(slip) > 0.03 ? (slip > 0 ? 1 : -1) : ((fl & 64) ? -1 : 1);
      var tot = Math.max(0.44, Math.min(0.79, 0.44 + Math.abs(slip) * 1.2 + di * 0.15));
      tgt = sg * Math.max(0, tot - Math.abs(slip));
    }
    st.ex += (tgt - st.ex) * Math.min(1, dt * ((fl & 1) ? 10 : 6));
    return st.ex;
  }
  RC2.extraDi = extraDi;
  function prepara(raw, lp, dt) {
    if (DV.mappa !== RTD.map) { DV.mappa = RTD.map; DV.s = {}; }
    var rb = (lp && lp.b && lp.b.p) || [], A = {}, ra0 = (lp && lp.a && lp.a.p) || [], k = lp ? lp.k : 0, i;
    for (i = 0; i < ra0.length; i++) A[ra0[i][0]] = ra0[i];
    for (i = 0; i < rb.length; i++) {
      var r = rb[i], pid = String(r[0]), ra = A[r[0]] || r;
      var x = ra[1] + (r[1] - ra[1]) * k, y = ra[2] + (r[2] - ra[2]) * k;
      var st = DV.s[pid] || (DV.s[pid] = { x: x, y: y, vx: 0, vy: 0, ex: 0, sl: 0, tf: 0, fl: 0, di: 0, a: 0 });
      if (dt > 0) {
        var vx = (x - st.x) / dt, vy = (y - st.y) / dt, kv = Math.min(1, dt * 12);
        if (Math.abs(vx) < 40 && Math.abs(vy) < 40) { st.vx += (vx - st.vx) * kv; st.vy += (vy - st.vy) * kv; }
      }
      st.x = x; st.y = y;
      var sp = Math.hypot(st.vx, st.vy), sl = sp > 2 ? wrap((r[3] || 0) - Math.atan2(st.vy, st.vx)) : 0;
      st.sl += (sl - st.sl) * Math.min(1, dt * 12);
      st.fl = r[7] | 0; st.di = (r[8] || 0) / 100; st.a = r[3] || 0;
      extraDi(st, st.sl, st.fl, st.di, dt);
    }
  }
  var SALVA = [];
  function ruota(raw, lp) {
    SALVA.length = 0;
    var liste = [lp && lp.a && lp.a.p, lp && lp.b && lp.b.p, raw && raw.p], fatte = [];
    for (var l = 0; l < liste.length; l++) {
      var R = liste[l]; if (!R || fatte.indexOf(R) >= 0) continue; fatte.push(R);
      for (var i = 0; i < R.length; i++) {
        var st = DV.s[String(R[i][0])]; if (!st || Math.abs(st.ex) < 0.004) continue;
        SALVA.push(R[i], R[i][3]); R[i][3] = (R[i][3] || 0) + st.ex;
      }
    }
  }
  function rimetti() { for (var i = 0; i < SALVA.length; i += 2) SALVA[i][3] = SALVA[i + 1]; SALVA.length = 0; }
  function effetti2d(now, dt) {
    var cell = (RTD._sc && RTD._sc.fxCell) || 26;
    for (var pid in DV.s) {
      var st = DV.s[pid]; if (!(st.fl & 1)) continue;
      st.tf -= dt; if (st.tf > 0) continue; st.tf = 0.045;
      var a = st.a + st.ex, c = Math.cos(a), s = Math.sin(a), ks = Math.min(1.5, 0.7 + Math.abs(st.sl) * 1.5 + st.di * 0.5);
      var col = (st.fl & 256) ? '#d9cdea' : (st.fl & 32) ? '#ecdcc8' : (st.fl & 16) ? '#cbd9ea' : '#cfd3da';
      for (var w = -1; w <= 1; w += 2) {
        var wx = st.x - c * 0.5 - s * 0.3 * w, wy = st.y - s * 0.5 + c * 0.3 * w;
        try { rcFx({ kind: 'smoke', x: wx + (Math.random() - 0.5) * 0.3, y: wy + (Math.random() - 0.5) * 0.3, t0: now, dur: 650 + ks * 250, r0: cell * 0.2 * ks, g: 0.3 + 0.12 * ks, col: col }); } catch (e) { }
      }
      try { rcSkidMark(st.x, st.y, a, Math.min(1, st.di + 0.5)); } catch (e) { }
      if (st.fl & 256) { for (var q = 0; q < 2; q++) { try { rcFx({ kind: 'spark', x: st.x - c * 0.9 + (Math.random() - 0.5) * 0.5, y: st.y - s * 0.9 + (Math.random() - 0.5) * 0.5, t0: now, dur: 260, col: '#c34dff' }); } catch (e) { } } }
    }
  }
  RC2.pillola = function (ctx, x, y, fl, s) {
    if (!(fl & 1)) return;
    var lv = (fl & 256) ? 3 : (fl & 32) ? 2 : (fl & 16) ? 1 : 0; s = s || 1;
    var w = 58 * s, h = 17 * s, x0 = x - w / 2, y0 = y - h;
    ctx.save();
    ctx.fillStyle = 'rgba(8,10,16,.72)';
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x0, y0, w, h, h / 2); ctx.fill(); } else ctx.fillRect(x0, y0, w, h);
    ctx.strokeStyle = lv ? LIVC[lv] : 'rgba(255,255,255,.5)'; ctx.lineWidth = 1.3 * s;
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x0, y0, w, h, h / 2); ctx.stroke(); }
    ctx.fillStyle = lv ? LIVC[lv] : '#e5e7eb'; ctx.font = '800 ' + Math.round(9.5 * s) + 'px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('DRIFT', x0 + 8 * s, y0 + h / 2 + 0.5 * s);
    for (var b = 0; b < 3; b++) { ctx.fillStyle = b < lv ? LIVC[lv] : 'rgba(255,255,255,.22)'; ctx.fillRect(x0 + 37 * s + b * 6 * s, y0 + 5 * s, 4 * s, h - 10 * s); }
    ctx.restore();
  };
  var _r2 = rtdDrawRace;
  rtdDrawRace = function (ctx, raw, lp, now, w, hh, dt) {
    if (spento()) return _r2.apply(this, arguments);
    var d = dt || 0.016;
    try { fantasmi(raw, lp, d, now); } catch (e) { }
    try { prepara(raw, lp, d); ruota(raw, lp); } catch (e) { }
    var r;
    try { r = _r2.apply(this, arguments); } finally { rimetti(); }
    try { effetti2d(now, d); } catch (e) { }
    try { scia2d(ctx, lp, now); } catch (e) { }
    try {
      var me = DV.s[String(RTD.myId)], P = RTD._sc && RTD._sc.fxMap, cell = RTD._sc && RTD._sc.fxCell;
      if (me && P && cell && !RTD.spec) { var q = P(me.x, me.y); RC2.pillola(ctx, q[0], q[1] - cell * 0.82, me.fl, Math.max(1, cell / 26)); }
    } catch (e) { }
    return r;
  };
  if (typeof rtdStamp === 'function') {
    var _st = rtdStamp;
    rtdStamp = function (txt, col, alta) {
      try {
        if (!spento() && alta && RTD.game === 'race' && RTD.stampQ && RTD.stampQ.length)
          RTD.stampQ = RTD.stampQ.filter(function (s0) { return !s0.alta; });
      } catch (e) { }
      return _st.apply(this, arguments);
    };
  }
  if (typeof rtdFeedEvent === 'function') {
    var _fe = rtdFeedEvent;
    rtdFeedEvent = function (e) {
      try { if (!spento() && RTD.game === 'race' && e && e.k === 'lap' && (e.lap | 0) >= ((RTD.map && RTD.map.laps) || 3)) return; } catch (x) { }
      var r = _fe.apply(this, arguments);
      try {
        if (!spento() && RTD.game === 'race' && e && e.who != null && String(e.who) === String(RTD.myId) && !RTD.spec) {
          if (e.k === 'mt1') hapGioco('leggero');
          else if (e.k === 'mt2' || e.k === 'mt3') hapGioco('colpo');
          else if (e.k === 'turbo' && (e.lv | 0) >= 2) hapGioco('colpo');
          else if (e.k === 'mtlost') { hapGioco('colpito'); try { TWS.play('lose', 0.45); } catch (y) { } rtdStamp(lang() === 'en' ? 'CHARGE LOST' : 'CARICA PERSA', '#f87171', true); }
        }
      } catch (x) { }
      return r;
    };
  }
})();
;
(function(){
  'use strict';
  if (window.XI) return;
  var D = document, W = window;
  var XI = W.XI = { on:true, n:0 };
  function L(it, en){ return W.GB_LANG === 'en' ? en : it; }
  var FOGLI = { 'arc-overlay':'rtdOvClose', 'gld-overlay':'gldOvClose', 'tw-overlay':'twrOvClose', 'tk-overlay':'tkOvClose' };
  var NOMI = { 'UNO':'UNO', 'UNO NO MERCY':'UNO No Mercy', 'LUPUS IN GAMBLER':'Lupus in Gambler', 'SETTE E MEZZO':'Sette e mezzo',
    'CUCU’':'Cucù', "CUCU'":'Cucù', 'CUCÙ':'Cucù', 'GAMBLER CITY':'Gambler City', 'GAMBLER CITY ROYALE':'Gambler City Royale',
    'LAST CALL':'Last Call', 'DEAD PEAK':'Dead Peak', 'UOMO NERO':'Uomo Nero', 'STREET RACE':'Street Race', 'DERBY':'Derby',
    'BISCA':'Bisca', 'BURRACO':'Burraco', 'COLOSSEO':'Colosseo', 'BOXE':'Boxe', 'BOXING':'Boxing', 'KAIJU BATTLE':'Kaiju Battle', 'DEAD MONEY':'Dead Money' };
  var SIGLE = /\b(UNO|NO MERCY|XP|PC|WASD|KO|HP|VS|LIVE|OK|GCR|BOT|1V1|2V2|GO|TV)\b/g;
  function tutteMaiuscole(s){ return s && s === s.toUpperCase() && /[A-ZÀ-Ý]{3}/.test(s); }
  function frase(s){
    s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
    if (!tutteMaiuscole(s)) return s;
    var tieni = [];
    s.replace(SIGLE, function(m, a, i){ tieni.push([i, m]); return m; });
    var t = s.toLowerCase();
    t = t.charAt(0).toUpperCase() + t.slice(1);
    t = t.replace(/([.!?:]\s+)([a-zà-ý])/g, function(m, a, b){ return a + b.toUpperCase(); });
    tieni.forEach(function(k){ if (k[0] > 0 || k[1].length > 1) t = t.slice(0, k[0]) + k[1] + t.slice(k[0] + k[1].length); });
    return t.replace(/\bvs\b/g, 'vs');
  }
  function nome(s){
    s = String(s || '').replace(/\s+/g, ' ').trim();
    var k = s.toUpperCase();
    if (NOMI[k]) return NOMI[k];
    if (!tutteMaiuscole(s)) return s;
    return s.toLowerCase().replace(/(^|\s)([a-zà-ý])/g, function(m, a, b){ return a + b.toUpperCase(); })
      .replace(/\s(In|Di|E|A|Da|Del|Della|The|Of)\b/g, function(m){ return m.toLowerCase(); });
  }
  function testo(el){ var c = el.cloneNode(true); [].forEach.call(c.querySelectorAll('.xn-ic, svg, img'), function(x){ x.remove(); }); return c.textContent.replace(/\s+/g, ' ').trim(); }
  function inFrase(el){
    if (!el || el.__xi) return; el.__xi = 1;
    var tutto = testo(el); if (!tutteMaiuscole(tutto)) return;
    var nuovo = frase(tutto).replace(/\s+/g, ''), pos = 0, n;
    if (nuovo.length !== tutto.replace(/\s+/g, '').length) return;
    var w = D.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: function(x){ return x.parentNode.closest('.xn-ic, svg') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; } });
    while ((n = w.nextNode())) {
      var v = n.nodeValue, out = '';
      for (var i = 0; i < v.length; i++) { var ch = v.charAt(i); out += /\s/.test(ch) ? ch : (nuovo.charAt(pos++) || ch); }
      n.nodeValue = out;
    }
  }
  var IC_X = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>';
  function eRegole(m){
    return !!(m && m.querySelector(':scope > .dpt-hd'));
  }
  function chiudi(ov){
    var m = ov.querySelector('.tw-modal'); try { GBX.fx('back'); } catch(e){}
    var bb = m ? [].slice.call(m.querySelectorAll('.action-btn[onclick]')) : [];
    var b = bb.filter(function(x){ return /Chiudi\(|OvClose\(/.test(x.getAttribute('onclick')); })[0];
    if (b) { b.click(); return; }
    var f = W[FOGLI[ov.id]];
    if (typeof f === 'function') { try { f(); } catch(e){} }
    else ov.classList.remove('show');
  }
  var RIGA = '.dpt-hr, .tw-rule, .gcrt-riga:not(.con-clip), .colt-riga:not(.con-clip), .bxi-riga:not(.con-clip), .dpi-it:not(.con)';
  var CARD = '.gcrt-riga.con-clip, .colt-riga.con-clip, .bxi-riga.con-clip, .dpi-it.con, .lct-carta, .dpt-it';
  function raggruppa(box){
    var figli = [].slice.call(box.children), run = [];
    var chiudiRun = function(){
      if (!run.length) return;
      var g = D.createElement('div'); g.className = 'xi-grp';
      run[0].parentNode.insertBefore(g, run[0]);
      run.forEach(function(r){ g.appendChild(r); });
      run = [];
    };
    figli.forEach(function(f){
      if (f.matches(RIGA)) run.push(f);
      else { chiudiRun(); if (f.matches('.gcrt-lista, .colt-lista, .tw-rules, .lct-carte, .bxi-lista, .dpi-lista')) raggruppa(f); }
    });
    chiudiRun();
  }
  function veste(ov, m){
    XI.n++;
    var hd = m.querySelector(':scope > .dpt-hd');
    if (hd && !hd.__xi) {
      hd.__xi = 1;
      var t = testo(hd), p = t.split(/\s+[—–-]\s+/), n = p[0], s = p.slice(1).join(' — ');
      hd.innerHTML = (s ? '<small class="xi-sopra"></small>' : '') + '<span class="xi-tit"></span>';
      if (s && W.GB_LANG !== 'en' && /^how to play$/i.test(s)) s = 'Come si gioca';
      if (s) hd.querySelector('.xi-sopra').textContent = frase(s);
      hd.querySelector('.xi-tit').textContent = nome(n);
    }
    [].forEach.call(m.querySelectorAll('.dpt-tab'), inFrase);
    var sel = m.querySelector('.dpt-tab.sel');
    if (sel && sel.scrollIntoView) { try { var tabs = sel.parentNode; tabs.scrollLeft = sel.offsetLeft - (tabs.clientWidth - sel.offsetWidth) / 2; } catch(e){} }
    [].forEach.call(m.querySelectorAll('.dpt-hr b, .tw-rule b, .dpi-h, .lct-n, .lct-fam b, .dpt-ith b, .lct-q, .lup-carta b'), inFrase);
    [].forEach.call(m.querySelectorAll('.tw-rule > span:not(.ic)'), function(sp){
      if (sp.__xi) return; sp.__xi = 1;
      var b = sp.querySelector('b'); if (!b) return;
      var nx = b.nextSibling;
      if (nx && nx.nodeType === 3) nx.nodeValue = nx.nodeValue.replace(/^\s*[—–-]\s*/, '');
      sp.classList.add('xi-rt');
    });
    [].forEach.call(m.querySelectorAll(':scope > .action-btn, :scope > .tw-ov-btns > .action-btn'), function(b){
      inFrase(b);
      var oc = b.getAttribute('onclick') || '';
      var soloChiudi = /Chiudi\(|OvClose\(/.test(oc) && /chiudi|close/i.test(testo(b));
      b.classList.add(soloChiudi ? 'xi-b2' : 'xi-b1');
    });
    [].forEach.call(m.querySelectorAll(CARD), function(c){ c.classList.add('xi-card'); });
    raggruppa(m);
    if (!ov.querySelector(':scope > .xi-x')) {
      var x = D.createElement('button'); x.type = 'button'; x.className = 'xi-x x-nosfx'; x.setAttribute('aria-label', L('Chiudi', 'Close'));
      x.innerHTML = IC_X;
      x.addEventListener('click', function(e){ e.stopPropagation(); chiudi(ov); });
      ov.appendChild(x);
      var vel = D.createElement('i'); vel.className = 'xi-vel'; vel.setAttribute('aria-hidden', 'true'); ov.appendChild(vel);
    }
  }
  function stato(ov, m){
    var on = XI.on && eRegole(m);
    var era = ov.classList.contains('xi-on');
    ov.classList.toggle('xi-on', on);
    m.classList.toggle('xi-pag', on);
    if (!on) return;
    try { veste(ov, m); } catch(e){ try { console.warn('XI veste', e); } catch(_){} }
    if (!era) { m.scrollTop = 0; try { GBX.fx('open'); } catch(e){} }
  }
  function monta(){
    Object.keys(FOGLI).forEach(function(id){
      var ov = D.getElementById(id); if (!ov || ov.__xi) return;
      var m = ov.querySelector('.tw-modal'); if (!m) return;
      ov.__xi = 1;
      stato(ov, m);
      try {
        new MutationObserver(function(rs){
          if (rs.some(function(r){ return r.target === m; })) stato(ov, m);
        }).observe(m, { childList:true });
        new MutationObserver(function(){ if (!ov.classList.contains('show')) { if (ov.classList.contains('xi-on')) ov.classList.remove('xi-on'); } else stato(ov, m); }).observe(ov, { attributes:true, attributeFilter:['class'] });
      } catch(e){}
    });
  }
  function sopraFoglio(){
    [].forEach.call(D.querySelectorAll('.xa-sheet-h:not([data-xi])'), function(h){ h.setAttribute('data-xi', L('Come si gioca', 'How to play')); });
  }
  try { new MutationObserver(function(rs){ for (var i = 0; i < rs.length; i++) for (var j = 0; j < rs[i].addedNodes.length; j++) { var n = rs[i].addedNodes[j]; if (n.nodeType === 1 && n.classList.contains('xa-sheet')) { sopraFoglio(); return; } } }).observe(D.body || D.documentElement, { childList:true }); } catch(e){}
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', monta); else monta();
  setTimeout(monta, 1500);
  XI.frase = frase; XI.nome = nome; XI.monta = monta;
})();
;
(function(){
  var M = new Image(); M.src = 'xb_marchio.webp';
  var XB = window.XB_RETRO = { marchio: M };
  if (typeof window.tvlDorso !== 'function') return;
  var prima = window.tvlDorso; XB.tvlPrima = prima;
  window.tvlDorso = function(x, X, Y, W, H, idx){
    prima.apply(this, arguments);
    if (idx !== 0 && idx != null) return;
    if (!(M.complete && M.naturalWidth)) return;
    try {
      x.save();
      x.fillStyle = '#3a050d'; x.beginPath(); x.ellipse(X + W/2, Y + H/2, W*.27, W*.27, 0, 0, 7); x.fill();
      x.strokeStyle = '#e8c15a'; x.lineWidth = Math.max(1, W*.02); x.stroke();
      var s = W*.4; x.drawImage(M, X + W/2 - s/2, Y + H/2 - s/2 + W*.005, s, s);
      x.restore();
    } catch (e) {}
  };
})();
;
(function(){
  'use strict';
  if (window.XF2) return;
  var XF2 = window.XF2 = { on: true };
  if (XF2.on === false) return;
  function en(){ return window.GB_LANG === 'en'; }
  function L(it, e){ return en() ? e : it; }
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function warn(dove, e){ try { console.warn('[XF2] ' + dove, e); } catch(_){} }
  function fx(n){ try { if (window.GBX && GBX.fx) GBX.fx(n); } catch(e){} }
  var RE_EMO = /(?:[\u{1F000}-\u{1FAFF}\u{2600}-\u{2604}\u{2607}-\u{2712}\u{2714}\u{2716}-\u{27BF}\u{2B00}-\u{2BFF}\u{2300}-\u{23FF}\u{1F1E6}-\u{1F1FF}][\u{FE0F}\u{200D}\u{20E3}]*)+|[\u{FE0F}\u{20E3}]/gu;
  function senza(s){ return String(s == null ? '' : s).replace(RE_EMO, '').replace(/\s{2,}/g, ' ').replace(/^[\s·—–:-]+/, '').trim(); }
  function frase(s){
    s = senza(s);
    if (s && s === s.toUpperCase() && /[A-ZÀ-Ú]{3}/.test(s)) {
      s = s.toLowerCase();
      s = s.replace(/\bpvp\b/g, 'PvP').replace(/\b(\d+)v(\d+)\b/g, '$1v$2').replace(/\buno\b/g, 'UNO').replace(/\bbtc\b/g, 'BTC').replace(/\bton\b/g, 'TON').replace(/\busdt\b/g, 'USDT').replace(/\beur\b/g, 'EUR');
      s = s.charAt(0).toUpperCase() + s.slice(1);
    }
    return s;
  }
  function fraseMista(s){
    s = senza(s);
    var lett = s.replace(/[^A-Za-zÀ-ú]/g, ''), up = lett.replace(/[^A-ZÀ-Ú]/g, '');
    if (!lett || up.length / lett.length < 0.6) return s;
    s = s.replace(/[A-Za-zÀ-ú']+/g, function(w){ return (w === w.toUpperCase() && !/^(BTC|TON|USDT|EUR|PvP|UNO|TG|ID|QR)$/.test(w)) ? w.toLowerCase() : w; });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  XF2.frase = frase;
  function fraseSeg(s){
    var p = senza(s).split(/\s*·\s*/);
    return p.map(function(x, i){ var f = frase(x); return (i && f && x === x.toUpperCase() && /[A-Z]{3}/.test(x)) ? f.charAt(0).toLowerCase() + f.slice(1) : f; }).join(' · ');
  }
  function avvolgi(nome, dopo, prima){
    var f = window[nome];
    if (typeof f !== 'function' || f.__xf2) return false;
    var w = function(){
      if (prima) { try { prima.apply(this, arguments); } catch(e){ warn(nome + ' prima', e); } }
      var r = f.apply(this, arguments);
      if (dopo) { try { dopo.apply(this, arguments); } catch(e){ warn(nome, e); } }
      return r;
    };
    for (var k in f) { try { if (Object.prototype.hasOwnProperty.call(f, k)) w[k] = f[k]; } catch(e){} }
    w.__xf2 = true;
    try { window[nome] = w; } catch(e){ return false; }
    return true;
  }
  function osserva(el, fn, opz){
    if (!el || !window.MutationObserver) return null;
    var giro = 0, mo = new MutationObserver(function(){ if (giro) return; giro = requestAnimationFrame(function(){ giro = 0; try { fn(); } catch(e){ warn('osserva', e); } }); });
    mo.observe(el, opz || { childList:true, subtree:true, characterData:true });
    return mo;
  }
  var SVG = {
    occhio:'<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    pin:'<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
    tempo:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9.5 2.5h5"/>',
    mondo:'<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 3.6 5.5 3.6 8.5s-1.1 5.9-3.6 8.5c-2.5-2.6-3.6-5.5-3.6-8.5S9.5 6.1 12 3.5z"/>',
    moneta:'<circle cx="12" cy="12" r="8.5"/><path d="M14.6 9.3a3 3 0 1 0 0 5.4M8 11h5M8 13h5"/>',
    esci:'<path d="M14 4.5h4.5v15H14M10 8l-4 4 4 4M6 12h9"/>',
    robot:'<rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 8V4.5M9.5 13h.01M14.5 13h.01M9.5 16h5"/>',
    libro:'<path d="M4 5.5c3-1.3 5.7-1.3 8 .5 2.3-1.8 5-1.8 8-.5v13c-3-1.3-5.7-1.3-8 .5-2.3-1.8-5-1.8-8-.5z"/><path d="M12 6v13"/>',
    carte:'<rect x="3.5" y="6" width="11" height="15" rx="2" transform="rotate(-10 9 13.5)"/><rect x="9.5" y="4" width="11" height="15" rx="2"/>',
    sedia:'<path d="M7 3.5v9h10v-9M6 12.5h12l-1 3H7zM8 15.5V21M16 15.5V21"/>',
    persone:'<circle cx="9" cy="8.5" r="3.2"/><path d="M3 19.5c.8-3.3 3.2-5 6-5s5.2 1.7 6 5"/><circle cx="17" cy="9.5" r="2.5"/><path d="M16.5 14.6c2.3.2 3.9 1.7 4.5 4.4"/>',
    rete:'<path d="M2.5 8.8a14 14 0 0 1 19 0M5.8 12.3a9.2 9.2 0 0 1 12.4 0M9.2 15.8a4.3 4.3 0 0 1 5.6 0"/><circle cx="12" cy="19" r="1"/><path d="M3.5 3.5l17 17"/>',
    ricevuta:'<path d="M6 3h12v18l-2.2-1.5L13.6 21l-1.6-1.5L10.4 21l-2.2-1.5L6 21z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
    podio:'<path d="M8.5 21V11h7v10M3 21v-6h5.5M15.5 21v-5H21v5M2 21h20"/><path d="M12 3.2l1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2-1.6-1.5 2.2-.3z"/>',
    info:'<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8h.01"/>',
    freccia:'<path d="M12 19V5M5.5 11.5 12 5l6.5 6.5"/>'
  };
  function svg(k, cls){ return '<svg' + (cls ? ' class="' + cls + '"' : '') + ' viewBox="0 0 24 24" aria-hidden="true">' + (SVG[k] || SVG.info) + '</svg>'; }
  var NOMI = { turf:'Gambler City Royale', race:'Street Race', glad:'Colosseo', calcio:'Derby', scalata:'Dead Peak', uno:'UNO', cucu:'Cucù',
    uomonero:'Uomo Nero', burraco:'Burraco', lupus:'Lupus in Gambler', lastcall:'Last Call', pk5:'Poker a 5', kaiju:'Kaiju Battle',
    settemezzo:'Sette e mezzo', tappo:'Bisca', sbanca:'SBANCA!', abisso:'Non svegliare il drago', hop:'HOP CLASH', geo:'Geo Bet', deadmoney:'Dead Money', smash:'Gambler Smash', tank:'Tank Duel',
    pool8:'Biliardo', pool15:'Biliardo', pong:'Neon Pong', sumo:'Sumo', shove:'Shove', alley:'Vicoli', dama:'Dama', damaru:'Dama',
    backg:'Backgammon', scopa:'Scopa', briscola:'Briscola', snake:'Snake Arena', basket:'Basket', archery:'Arco', draw:'Quick Draw',
    golf:'Minigolf', boxe:'Boxe', dice:'Dadi', pk1v1:'Poker 1v1', bj1v1:'Blackjack 1v1', rps:'Sasso carta forbice', rr:'Roulette russa',
    bs:'Battaglia navale', chess:'Scacchi', kart:'Gambler Kart' };
  var NOMI_EN = { glad:'Colosseum', calcio:'Derby', cucu:'Cuckoo', uomonero:'Old Maid', pk5:'5-handed poker', settemezzo:'Seven and a half',
    tappo:'Slap', pool8:'Pool', pool15:'Pool', alley:'Alleys', dama:'Checkers', damaru:'Checkers', archery:'Archery', boxe:'Boxing', dice:'Dice',
    rps:'Rock paper scissors', rr:'Russian roulette', bs:'Battleship', chess:'Chess' };
  function nomeGioco(g){ g = String(g || ''); var k = (window.GBX && GBX.gioco) ? GBX.gioco(g) : g;
    return (en() && (NOMI_EN[g] || NOMI_EN[k])) || NOMI[g] || NOMI[k] || ((window.GBX && GBX.nomeGioco) ? GBX.nomeGioco(g) : ''); }
  function titoloCaso(s){
    s = senza(s); if (!s || s !== s.toUpperCase() || !/[A-Z]{3}/.test(s)) return s;
    return s.toLowerCase().replace(/(^|[\s'’-])(\S)/g, function(a, b, c){ return b + c.toUpperCase(); }).replace(/\bUno\b/, 'UNO').replace(/\b(\d+)V(\d+)\b/g, '$1v$2');
  }
  var ERR = {
    'server busy':'Server occupato, riprova fra poco', 'missing user_id':'Apri la mini app da Telegram', 'forbidden':'Operazione non permessa',
    'bad request':'Richiesta non valida', 'insufficient balance':'Saldo insufficiente', 'invalid bet':'Puntata non valida', 'invalid bets':'Puntata non valida',
    'invalid bet type':'Puntata non valida', 'bad total bet':'Puntata non valida', 'no active game':'Nessuna partita in corso',
    'invalid amount':'Importo non valido', 'bad amount':'Importo non valido', 'amount too large':'Importo troppo alto', 'amount too small':'Importo troppo basso',
    'user not found':'Utente non trovato', 'player not found':'Giocatore non trovato', 'not your turn':'Non è il tuo turno', 'invalid game':'Gioco non valido',
    'bad action':'Mossa non valida', 'invalid action':'Mossa non valida', 'illegal action':'Mossa non valida', 'illegal':'Mossa non valida', 'bad move':'Mossa non valida',
    'invalid pick':'Scelta non valida', 'invalid choice':'Scelta non valida', 'bad choice':'Scelta non valida', 'invalid cell':'Scelta non valida',
    'bad cell':'Scelta non valida', 'cell out of range':'Scelta non valida', 'invalid crate':'Scelta non valida', 'invalid nums':'Numeri non validi', 'nums out of range':'Numeri non validi',
    'invalid mode':'Modalità non valida', 'invalid risk':'Rischio non valido', 'invalid ante':'Posta non valida', 'invalid':'Richiesta non valida',
    'network error':'Errore di rete', 'network error - retry':'Errore di rete, riprova', 'failed to fetch':'Rete non disponibile, riprova',
    'error':'Errore', 'failed':'Non riuscito', 'poker error':'Errore del poker', 'service unavailable':'Servizio non disponibile, riprova fra poco',
    'deposits unavailable':'Depositi non disponibili al momento', 'challenge not found':'Missione non trovata', 'unknown challenge':'Missione non trovata',
    'not unlocked':'Non ancora sbloccato', 'already unlocked':'Già sbloccato', 'already revealed':'Già scoperta', 'nothing to cash out':'Niente da incassare',
    'expired':'Scaduto', 'not found':'Non trovato', 'request not found':'Richiesta non trovata', 'not eligible':'Non hai i requisiti', 'not completed':'Non ancora completata',
    'no active run':'Nessuna discesa in corso', 'no active scratch':'Nessun gratta e vinci in corso', 'no active poker hand':'Nessuna mano di poker in corso',
    'no active crash':'Nessuna partita a Crash in corso', 'no active blackjack':'Nessuna mano di blackjack in corso', 'cannot split':'Non puoi dividere',
    'cannot double':'Non puoi raddoppiare', 'cannot challenge yourself':'Non puoi sfidare te stesso', 'account suspended':'Account sospeso',
    'insufficient balance for the call':'Saldo insufficiente per vedere', 'connect your ton wallet first':'Collega prima il tuo wallet TON',
    'ton deposits are not open yet':'I depositi TON non sono ancora aperti', 'usdt deposits are not open yet':'I depositi USDT non sono ancora aperti',
    'usdt withdrawals are not enabled yet':'I prelievi USDT non sono ancora attivi', 'too late to cancel: it is already leaving':'Troppo tardi per annullare: sta già partendo',
    'could not prepare the transfer':'Non riesco a preparare il trasferimento, riprova', 'could not prepare the transfer, try again':'Non riesco a preparare il trasferimento, riprova',
    'could not create the swap. nothing was charged.':'Non riesco a creare la conversione. Non ti è stato addebitato nulla.',
    'open in telegram to play':'Apri da Telegram per giocare', 'too many requests':'Troppe richieste, aspetta un attimo', 'rate limited':'Troppe richieste, aspetta un attimo',
    'timeout':'Il server non ha risposto, riprova', 'unknown cosmetic':'Oggetto non trovato', 'no funds':'Fondi insufficienti', 'missing id':'Richiesta non valida',
    'ante above the max win for a single run':'Posta oltre la vincita massima di una discesa', 'deprecated — use the in-app duel arena':'Usa l’Arena della mini app'
  };
  var ERR_RE = [
    [/^minimum withdrawal is ([\d.,]+) ?eur$/i, function(m){ return 'Il prelievo minimo è di €' + m[1]; }],
    [/^minimum deposit is ([\d.,]+) (ton|usdt)$/i, function(m){ return 'Il deposito minimo è di ' + m[1] + ' ' + m[2].toUpperCase(); }],
    [/^insufficient balance/i, function(){ return 'Saldo insufficiente'; }],
    [/^ton withdrawals are temporarily/i, function(){ return 'I prelievi TON sono sospesi per un momento'; }],
    [/^http \d+$/i, function(){ return 'Il server non ha risposto, riprova'; }]
  ];
  function tradErr(s){
    if (en() || s == null) return s;
    var str = String(s), m = /^([^A-Za-zÀ-ú0-9]*)([\s\S]*?)\s*$/.exec(str), pre = m ? m[1] : '', core = m ? m[2] : str;
    var k = core.trim().toLowerCase(), t = ERR[k];
    if (!t) for (var i = 0; i < ERR_RE.length && !t; i++) { var r = ERR_RE[i][0].exec(core.trim()); if (r) t = ERR_RE[i][1](r); }
    return t ? (pre + t) : str;
  }
  XF2.tradErr = tradErr;
  function errori(){
    var f = window.toast;
    if (typeof f === 'function' && !f.__xf2t) {
      var w = function(msg){ if (!en() && typeof msg === 'string') { var a = [].slice.call(arguments); a[0] = tradErr(msg); return f.apply(this, a); } return f.apply(this, arguments); };
      for (var k in f) { try { w[k] = f[k]; } catch(e){} }
      w.__xf2t = true; try { window.toast = w; } catch(e){}
    }
    var dc = $('dc-status');
    if (dc) osserva(dc, function(){ if (en()) return; var t = dc.textContent, n = tradErr(t); if (/^Place bet to roll$/i.test(t.trim())) n = 'Scegli la puntata e tira'; if (n !== t) dc.textContent = n; });
  }
  var STATO = { 'NO USER (open in Telegram)':'Apri da Telegram', 'Syncing...':'Aggiorno…', '• LIVE':'Aggiornato',
    'OFFLINE (backend unreachable)':'Server non raggiungibile', '⚠ SYNC FAILED — tap to retry':'Aggiornamento non riuscito · tocca per riprovare' };
  function statoSaldo(){
    avvolgi('setBalanceStatus', function(text){
      if (en()) return;
      var s = $('bal-status'); if (!s) return;
      var t = String(text == null ? '' : text), n = STATO[t];
      if (!n && /^Error: /.test(t)) n = 'Errore: ' + tradErr(t.slice(7));
      if (n) s.textContent = n;
      s.title = 'Tocca per aggiornare il saldo';
    });
    var s = $('bal-status'); if (s && !en() && STATO[s.textContent]) s.textContent = STATO[s.textContent];
  }
  var SLOT = {
    'auto spin':'Giri automatici', 'spins will stop on any single win ≥ 50x bet':'Si fermano da soli a ogni vincita da 50 volte la puntata in su',
    'cancel':'Annulla', 'paytable, rules & bonus features':'Pagamenti, regole e bonus', 'paytable & rules':'Pagamenti e regole',
    'progressive':'Progressivo', 'last win':'Ultima vincita', 'free spins':'Giri gratis', 'spin':'Gira', 'turbo':'Turbo', 'auto':'Auto',
    'stop':'Ferma', 'auto:':'Auto:', 'collect':'Incassa', 'start':'Inizia', 'spin the wheel':'Gira la ruota', 'spin to win!':'Gira e vinci',
    'spins played':'Giri giocati', 'total wins':'Vincite totali', 'win!':'Vinto!', 'free spins with 2× multiplier':'Giri gratis con moltiplicatore 2×',
    'free spins!':'Giri gratis!', 'free spins complete':'Giri gratis finiti', 'free spins bonus':'Bonus giri gratis', 'bonus wheel':'Ruota bonus',
    'cascade wins':'Vincite a cascata', '10 paylines':'10 linee', 'gambler slots':'Gambler Slot', 'max win 5000×':'Vincita massima 5000×',
    'gb wild jackpot 5000×':'Jackpot GB Wild 5000×', 'big win!':'Grande vincita!', 'mega win!':'Mega vincita!', 'super win!':'Super vincita!',
    'incredible win!':'Vincita incredibile!', 'nice one!':'Bel colpo!', 'awesome!':'Fantastico!', 'unbelievable!':'Incredibile!', 'get ready...':'Preparati…',
    'spinning…':'Gira…', 'rolling…':'Gira…', 'jackpot':'Jackpot', 'high':'Alto', 'open in telegram to play':'Apri da Telegram per giocare',
    'wild (substitutes any)':'Wild (sostituisce tutti)', 'gb wild':'GB Wild', 'bot scatter':'Scatter bot', 'wheel scatter':'Scatter ruota', 'bell':'Campana', 'lightning':'Fulmine',
    'star':'Stella', 'spade':'Picche', 'gem':'Gemma', 'line payouts (multiplier on bet)':'Pagamenti per linea (volte la puntata)',
    'bot scatter — free spins':'Scatter bot · giri gratis', 'wheel scatter — bonus wheel':'Scatter ruota · ruota bonus', '3+ anywhere → free spins':'3 o più ovunque → giri gratis',
    '3+ anywhere → spin the bonus wheel':'3 o più ovunque → gira la ruota bonus', 'how bonuses work':'Come funzionano i bonus', 'base game rules':'Regole del gioco base',
    'insufficient balance':'Saldo insufficiente', 'network error':'Errore di rete', 'network error - retry':'Errore di rete, riprova'
  };
  var SLOT_REGOLE = [
    '<b>Giri gratis</b> da <b>due</b> strade:<br>· 3 o più scatter bot sui rulli (8/12/18 giri)<br>· lo spicchio <b>giri gratis</b> della ruota bonus (15 giri)<br><i>Durante i giri gratis ogni vincita vale ×2. Ogni wild col logo GB che arriva resta fermo per tutto il turno.</i>',
    '<b>Ruota bonus</b> da <b>due</b> inneschi:<br>· 3 o più scatter ruota sui rulli<br>· ogni 35–70 giri (a caso) la ruota parte da sola<br><b>12 spicchi:</b> moltiplicatori in contanti (quasi sempre da 2× a 6× la puntata, raramente 10× e 30×) · 1 spicchio giri gratis (15) · forziere (apre il Caveau) · mistero (da 1× a 100× a caso) · JACKPOT (rarissimo).',
    '<b>Caveau</b>: si apre <b>solo</b> con lo spicchio forziere della ruota bonus. Scegli 1 casseforte su 3: dentro ci sono <b>soldi</b> (da 15× a 30× la puntata) <b>oppure</b> <b>giri gratis</b> (da 8 a 15).',
    '<b>Jackpot progressivo</b>: è condiviso fra TUTTI i giocatori. Ogni giro di chiunque aggiunge l’1% della puntata. Lo vinci intero con il raro <b>spicchio JACKPOT</b> della ruota bonus (è l’unico modo). Dopo ogni vincita riparte dalla base.',
    '<b>Suspense</b>: se 2 scatter ruota cadono sui primi 3 rulli, i rulli 4 e 5 si accendono. Un’altra ruota e parte il bonus.'
  ];
  var SLOT_BASE = [
    '<b>5 rulli × 3 righe · 10 linee.</b> La puntata si divide sulle 10 linee. Le vincite pagano da sinistra a destra, dal primo rullo.',
    '<b>Logo GB = wild.</b> Il logo di Gambler Bot sostituisce tutti i simboli tranne gli scatter (bot, ruota). Paga anche il premio più alto sulla sua linea.',
    '<b>Vincite a cascata.</b> I simboli vincenti esplodono e ne cadono di nuovi. Possono arrivare reazioni a catena.',
    '<b>Jackpot progressivo.</b> Montepremi fra tutti i giocatori: l’1% di ogni puntata. Si vince con lo spicchio JACKPOT della ruota bonus.',
    '<b>RTP ≈ 85%.</b> Margine della casa circa 15%.'
  ];
  function chiaveSlot(t){ return senza(t).replace(/\s+/g, ' ').trim().toLowerCase(); }
  function slotTesto(root){
    if (en() || !root) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n, l = [];
    while ((n = w.nextNode())) l.push(n);
    l.forEach(function(n){
      var v = n.nodeValue; if (!v || !/[A-Za-z]/.test(v)) return;
      var p = n.parentNode && n.parentNode.nodeName; if (p === 'SCRIPT' || p === 'STYLE') return;
      var k = chiaveSlot(v), t = SLOT[k];
      if (!t && /^auto: ?$/i.test(k)) t = 'Auto:';
      if (t && t !== v.trim()) n.nodeValue = v.replace(v.trim(), t);
    });
  }
  function slot(){
    var s = $('slots'); if (!s) return;
    slotTesto(s);
    osserva(s, function(){ slotTesto(s); }, { childList:true, subtree:true, characterData:true });
    avvolgi('slv2RenderPaytable', function(){
      if (en()) return;
      var pt = $('slv2-paytable-content'); if (!pt) return;
      var r = pt.querySelectorAll('.slv2-pt-rule');
      [].forEach.call(r, function(d, i){ var h = i < 5 ? SLOT_REGOLE[i] : SLOT_BASE[i - 5]; if (h) d.innerHTML = h; });
      slotTesto(pt);
    });
    var pt = $('slv2-paytable-content'); if (pt && pt.children.length && window.slv2RenderPaytable) try { slv2RenderPaytable(); } catch(e){}
  }
  function obNuovo(){
    if (en()) return;
    [].forEach.call(document.querySelectorAll('#onboard .obf-ct > b'), function(b){ if (/^NEW$/i.test(b.textContent.trim())) b.textContent = 'Nuovo'; });
  }
  function onboarding(){
    avvolgi('obBuild', obNuovo); obNuovo();
    if (en()) return;
    var CAMBIA = { 't-slots':'SLOT', 't-scratch':'GRATTA', 't-botrr':'ROULETTE RUSSA', 't-vault':'CAVEAU' };
    try {
      (window.OB_SCHEDE || []).forEach(function(s){
        var c = s && s.it && s.it.casa; if (!c) return;
        c.forEach(function(x){ if (CAMBIA[x[0]]) x[1] = CAMBIA[x[0]]; });
      });
    } catch(e){}
    var ob = $('onboard'); if (!ob) return;
    var V = { 'TREASURE':'GRATTA', 'BOT ROULETTE':'ROULETTE RUSSA', 'VAULT':'CAVEAU', 'SLOTS':'SLOT' };
    var w = document.createTreeWalker(ob, NodeFilter.SHOW_TEXT, null), n;
    while ((n = w.nextNode())) { var k = n.nodeValue.trim(); if (V[k]) n.nodeValue = n.nodeValue.replace(k, V[k]); }
    [].forEach.call(ob.querySelectorAll('[data-xv-t]'), function(e){
      var k = e.getAttribute('data-xv-t'), m = { 'Treasure':'Gratta', 'Bot roulette':'Roulette russa', 'Bot Roulette':'Roulette russa', 'Vault':'Caveau', 'Slots':'Slot' }[k];
      if (m) e.setAttribute('data-xv-t', m);
    });
  }
  function voci(){
    if (en()) return;
    try {
      var T = window.TX_GIOCHI; if (!T) return;
      var V = { wheel:'Ruota', slots:'Slot', vault:'Caveau', scratch:'Gratta e vinci', lotto:'Lotteria', bj1v1:'Blackjack 1v1', pk1v1:'Poker 1v1' };
      for (var k in V) if (T[k]) T[k] = V[k];
    } catch(e){}
  }
  var QUEST = {
    w_warmup:['Riscaldamento','Gioca {g} partite a qualsiasi gioco questa settimana'],
    w_lucky4:['Giro fortunato','Vinci {g} giri alla Roulette questa settimana'],
    w_plinko10:['Plinko, primi lanci','Lancia {g} palline a Plinko questa settimana'],
    w_wheel5:['Maestro della ruota','Gira la Ruota {g} volte questa settimana'],
    w_bj6:['Squalo delle carte','Vinci {g} mani a Blackjack questa settimana'],
    w_slots10:['Vita da rulli','Fai {g} giri alla Slot questa settimana'],
    w_bet80:['Tutto dentro','Punta in totale €{g} su qualsiasi gioco questa settimana'],
    w_plinko5w:['Plinko da professionista','Vinci {g} lanci a Plinko (qualsiasi moltiplicatore) questa settimana'],
    w_wheel3w:['Vincitore della ruota','Vinci {g} giri alla Ruota questa settimana'],
    w_poker5:['Asso del poker','Vinci {g} mani a Poker questa settimana'],
    w_win12:['Senza sosta','Vinci {g} partite a qualsiasi gioco questa settimana'],
    w_streak5:['Serie fortunata','Vinci {g} partite di fila, a qualsiasi gioco'],
    w_highroll:['Puntata grossa','Fai una sola puntata da €{g} o più in una partita'],
    w_triple:['Tripletta','Vinci a {g} giochi diversi questa settimana'],
    w_legend:['Leggenda della settimana','Sii il primo ad arrivare a {g} vittorie questa settimana: chi ci arriva prende la corona'],
    w_sl_wheel3:['Cacciatore di ruote','Fai partire la ruota bonus della Slot {g} volte questa settimana'],
    w_sl_fs2:['Giri gratis','Vinci {g} turni di giri gratis alla Slot questa settimana (scatter bot o ruota)'],
    w_sl_vault1:['Scassinatore','Apri il Caveau della Slot {g} {volta} questa settimana (spicchio forziere della ruota)'],
    w_sl_mystery3:['Cacciatore di misteri','Prendi lo spicchio mistero della ruota della Slot {g} volte questa settimana'],
    w_sl_grind50:['Maratona alla Slot','Fai {g} giri alla Slot questa settimana'],
    w_bj10:['Mani alte','Vinci {g} mani a Blackjack questa settimana'],
    w_rl6:['Corsa alla Roulette','Vinci {g} giri alla Roulette questa settimana'],
    w_dice5:['Duellante dei dadi','Vinci {g} tiri ai Dadi questa settimana'],
    w_lucky7:['Sette fortunato','Vinci {g} partite a qualsiasi gioco questa settimana'],
    w_marathon40:['Maratoneta','Gioca {g} partite a qualsiasi gioco questa settimana'],
    w_bigspender:['Mani bucate','Punta in totale €{g} su qualsiasi gioco questa settimana'],
    w_plinko30:['Malato di Plinko','Lancia {g} palline a Plinko questa settimana'],
    w_rl10:['Re della Roulette','Vinci {g} giri alla Roulette questa settimana'],
    w_wheel15:['Appassionato della ruota','Gira la Ruota {g} volte questa settimana'],
    w_streak3:['Mano calda','Vinci {g} partite di fila, a qualsiasi gioco'],
    w_allround4:['Tuttofare','Vinci a {g} giochi diversi questa settimana'],
    w_slot25:['Appassionato di Slot','Fai {g} giri alla Slot questa settimana'],
    w_pk3:['Conta carte','Vinci {g} mani a Poker questa settimana'],
    w_bj3:['Blackjack, le basi','Vinci {g} mani a Blackjack questa settimana'],
    w_duel6:['Duellante','Vinci {g} duelli PvP (qualsiasi gioco) questa settimana'],
    w_bs3:['Ammiraglio','Vinci {g} duelli a Battaglia navale questa settimana'],
    w_chess2:['Gran maestro','Vinci {g} duelli a Scacchi questa settimana'],
    w_rps5:['Mani veloci','Vinci {g} duelli a Sasso carta forbice questa settimana'],
    w_rr3:['L’ultimo in piedi','Vinci {g} duelli alla Roulette russa questa settimana'],
    s_jackpot:['Jackpot!','Prendi un jackpot alla Slot o in un altro gioco'],
    s_100games:['Centurione','Gioca {g} partite in tutto (da sempre)'],
    s_bigwon:['Contadino di Bitcoin','Vinci in tutto {m} mBTC sommando tutti i giochi'],
    s_whale:['Balena','Punta in tutto {m} mBTC (da sempre)'],
    s_legendary:['Leggendario','Arriva al livello {g}, il più alto di tutti'],
    s_royal:['Tocco reale','Fai una scala reale a Poker: capita una volta nella vita'],
    s_sl_progressive:['Re del jackpot','Vinci il jackpot progressivo della Slot, condiviso fra tutti i giocatori (rarissimo)'],
    s_sl_royale:['Casino Royale','Fai partire la ruota bonus della Slot {g} volte (da sempre)'],
    s_gladiator:['Gladiatore','Vinci {g} duelli PvP (da sempre, qualsiasi gioco)'],
    s_warlord:['Signore dell’arena','Vinci {g} duelli PvP (da sempre): la leggenda dell’arena']
  };
  XF2.QUEST = QUEST;
  function numIt(x){ x = Number(x); if (!isFinite(x)) return ''; return String(Math.round(x * 100) / 100).replace('.', ','); }
  function questIt(){
    var A = window.CHALLENGES_ALL; if (!A || !A.forEach) return;
    A.forEach(function(q){
      if (!q || !q.id) return;
      if (q.__xf2n == null) { q.__xf2n = q.name; q.__xf2d = q.desc; }
      var t = QUEST[q.id];
      if (en() || !t) { q.name = q.__xf2n; q.desc = q.__xf2d; return; }
      var g = q.goal;
      q.name = t[0];
      q.desc = t[1].replace('{g}', numIt(g)).replace('{m}', numIt(Number(g) / 100)).replace('{volta}', Number(g) === 1 ? 'volta' : 'volte');
    });
  }
  function quest(){ avvolgi('renderChallenges', null, questIt); }
  function spMonta(){
    var ov = $('lobsp-ov'); if (!ov || ov.__xf2) return; ov.__xf2 = 1;
    ov.classList.add('xf2-sp');
    var inn = ov.firstElementChild; if (inn) inn.classList.add('xf2-sp-in');
    var tt = $('lobsp-tt'), hd = tt && tt.parentNode;
    if (hd) { hd.removeAttribute('style'); hd.classList.add('xf2-sp-hd'); }
    if (tt) { tt.removeAttribute('style'); tt.className = 'xf2-sp-tt'; tt.innerHTML = '<small>' + L('Spettatore', 'Spectator') + '</small><b>' + L('Lobby', 'Lobby') + '</b>'; }
    var b = hd && hd.querySelector('button');
    if (b) { b.removeAttribute('style'); b.className = 'xf2-sp-esci'; b.textContent = L('Esci', 'Leave'); }
    var st = $('lobsp-st'); if (st) { st.removeAttribute('style'); st.classList.add('xf2-sp-st'); }
    spChat();
  }
  function spChat(){
    var ov = $('lobsp-ov'); if (!ov) return;
    var c = ov.querySelector('#lobsp-chat'); if (!c) return;
    var bt = c.querySelector('.trn-ch-btn');
    if (bt && !bt.__xf2) { bt.__xf2 = 1; bt.innerHTML = svg('freccia'); bt.setAttribute('aria-label', L('Invia', 'Send')); }
    var nt = c.querySelector('.trn-ch-note'); if (nt) nt.textContent = L('La leggono tutti, anche chi gioca', 'Everyone reads it, players too');
    var e = c.querySelector('.trn-ch-empty'); if (e) e.textContent = senza(e.textContent);
  }
  function spDipingi(){
    var box = $('lobsp-st'), p = window.LOBSP && LOBSP.last; if (!box || !p) return;
    spMonta();
    var g = String(p.game || ''), nome = nomeGioco(g);
    if (!nome) { try { nome = titoloCaso(lobSpGioco(g).title); } catch(e){ nome = titoloCaso(g); } }
    var tt = $('lobsp-tt');
    if (tt && (tt.__xf2g !== g || !tt.querySelector('.xf2-sp-tx'))) tt.__xf2g = g, tt.innerHTML = '<span class="xf2-sp-ic"><img src="gbx_pv_' + esc((window.GBX && GBX.gioco) ? GBX.gioco(g) : g) + '.webp" alt="" onerror="this.parentNode.classList.add(\'no\');this.remove()">' +
      '<i>' + esc((nome || '?').charAt(0)) + '</i></span><span class="xf2-sp-tx"><small>' + L('Stai guardando', 'Watching') + '</small><b>' + esc(nome) + '</b></span>';
    var testa = box.firstElementChild;
    if (testa && !testa.classList.contains('xf2-sp-dati')) {
      var nomi = (p.nomi || []).map(function(n){ return String(n); }).join(', ');
      var d = document.createElement('div'); d.className = 'xf2-sp-dati';
      d.innerHTML = '<div><span>' + L('Seduti', 'Seated') + '</span><b>' + (p.seduti || 0) + '/' + (p.posti || '?') + '</b></div>' +
        '<div><span>' + L('Posta', 'Stake') + '</span><b>' + (p.gratis ? L('Gratis', 'Free') : (p.stake_eur != null ? '€' + Number(p.stake_eur).toFixed(2) : '–')) + '</b></div>' +
        '<div><span>' + L('Si chiude fra', 'Closes in') + '</span><b>' + (p.scade_fra != null && p.fase === 'attesa' ? lobSpMMSS(p.scade_fra) : '–') + '</b></div>';
      testa.replaceWith(d);
      if (nomi) { var pn = document.createElement('p'); pn.className = 'xf2-sp-nomi'; pn.textContent = nomi; d.after(pn); }
    }
    [].forEach.call(box.querySelectorAll(':scope > div[style]'), function(r){
      var f = r.getAttribute('style') || '';
      if (/Russo One/.test(f) && /justify-content:center/.test(f)) {
        r.removeAttribute('style'); r.className = 'xf2-sp-vs';
        [].forEach.call(r.querySelectorAll('span[style]'), function(s){ if (/ffd76b/.test(s.getAttribute('style'))) s.className = 'on'; s.removeAttribute('style'); });
      } else if (/Russo One/.test(f)) { r.removeAttribute('style'); r.className = 'xf2-sp-t'; r.textContent = senza(r.textContent); }
    });
    [].forEach.call(box.querySelectorAll(':scope > .tw-note'), function(n){ n.removeAttribute('style'); n.classList.add('xf2-sp-s'); });
    spChat();
  }
  function spettatore(){
    avvolgi('lobSpMonta', spMonta);
    avvolgi('lobSpDipingi', spDipingi);
  }
  var GEO = { scr:null, body:null, sc:null, mo:null, rif:0 };
  function geoTogli(){
    var ap = GEO.body && GEO.body.querySelector(':scope > .xf2-geo'); if (ap) ap.remove();
    if (GEO.scr) GEO.scr.classList.remove('xf2-geo-scr');
    if (GEO.body) GEO.body.classList.remove('xf2-geo-on');
  }
  function geoGuarda(){
    var sc = GEO.body.querySelector(':scope > .geo-sc');
    if (sc !== GEO.sc) {
      if (GEO.mo) { GEO.mo.disconnect(); GEO.mo = null; }
      GEO.sc = sc;
      if (sc && !sc.classList.contains('gs-coda')) {
        GEO.mo = new MutationObserver(function(rs){
          for (var i = 0; i < rs.length; i++) { if (rs[i].target.id === 'gs-dito' || rs[i].target.id === 'gs-guida') continue; geoPiu(); return; }
        });
        GEO.mo.observe(sc, { childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:['class', 'hidden'] });
      }
    }
    geoScheda();
  }
  function geoPiu(){ if (GEO.rif) return; GEO.rif = requestAnimationFrame(function(){ GEO.rif = 0; try { geoScheda(); } catch(e){ warn('geo', e); } }); }
  function soldi(t){ t = String(t || '').trim(); return '€' + (en() ? t.replace(',', '.') : t.replace('.', ',')); }
  function geoScheda(){
    var sc = GEO.sc, menu = sc && !sc.classList.contains('gs-coda') && sc.querySelector('#gs-modi');
    if (!menu) { geoTogli(); return; }
    var modi = {}, modo = '';
    [].forEach.call(sc.querySelectorAll('#gs-modi .gs-modo[data-m]'), function(b){ var k = b.getAttribute('data-m'); modi[k] = b; if (b.classList.contains('sel')) modo = k; });
    if (!sc.__xf2Auto) { sc.__xf2Auto = 1; if (modo !== 'soldi' && modo !== 'gratis' && modi.soldi) { modi.soldi.click(); return; } }
    var az = [], add = function(el){ az.push(el); return az.length - 1; };
    var h = '';
    h += '<div class="xa-ap-ban" aria-hidden="true"><img class="xa-ap-bi" src="gbx_pv_geo.webp" alt=""><img class="xa-ap-bb" src="gbx_bn_geo.webp" alt="" decoding="async"></div>';
    h += '<div class="xa-ap-hd"><span class="xa-ap-ic"><img src="gbx_pv_geo.webp" alt="" width="64" height="64" decoding="async"></span><div class="xa-ap-ht"><h1>Geo Bet</h1><p>' +
      L('Indovina dove sei. Il più vicino vince.', 'Guess where you are. Closest wins.') + '</p><small class="xa-ap-meta"><span>' + L('2-8 giocatori', '2-8 players') + '</span><span>' + L('5 round', '5 rounds') + '</span></small></div></div>';
    var vb = sc.querySelectorAll('#gs-vis .gs-vb');
    if (vb.length) {
      h += '<h2 class="xa-ap-sez">' + L('Mappa', 'Map') + '</h2><div class="xa-ap-seg" role="radiogroup">' + [].map.call(vb, function(b){
        var s = b.classList.contains('sel'); return '<button type="button" data-xf="' + add(b) + '" class="' + (s ? 'sel' : '') + '" role="radio" aria-checked="' + s + '">' + esc(frase(b.textContent)) + '</button>';
      }).join('') + '</div>';
      var vn = $('gs-vnota'); if (vn) h += '<p class="xa-ap-info">' + esc(senza(vn.textContent).replace(/^(\S+)/, function(w){ return frase(w); })) + '</p>';
    }
    var rr = sc.querySelectorAll('.gs-reg .gs-rr'), ICR = ['occhio', 'pin', 'tempo'];
    if (rr.length) {
      h += '<h2 class="xa-ap-sez">' + L('Come si gioca', 'How to play') + '</h2><div class="xa-ap-grp">';
      [].forEach.call(rr, function(r, i){
        var p = r.querySelector('p'), b = p && p.querySelector('b'), bt = b ? b.textContent : '', rest = p ? p.textContent.replace(bt, '') : '';
        h += '<div class="xa-ap-r"><span class="xa-ri" aria-hidden="true">' + svg(ICR[i] || 'info') + '</span><span class="xa-ap-rt"><b>' + esc(bt.replace(/\.$/, '')) + '</b><span>' + esc(rest.trim()) + '</span></span></div>';
      });
      var gb = sc.querySelector('.gs-guida-b');
      if (gb) h += '<button type="button" class="xa-ap-r xa-ap-more" data-xf2="regole"><span class="xa-ri xa-ri--l" aria-hidden="true">' + svg('libro') + '</span><span class="xa-ap-rt"><b>' + L('Regole complete', 'Full rules') + '</b></span></button>';
      h += '</div>';
    }
    var fi = sc.querySelectorAll('#gs-fiches .gs-fiche[data-t]'), posta = '', selT = '';
    if (modi.gratis) posta += '<button type="button" class="xa-fi xa-fi--g' + (modo === 'gratis' ? ' sel' : '') + '" data-xf2="m-gratis">' + L('Gratis', 'Free') + '</button>';
    if (modi.soldi) {
      if (fi.length) [].forEach.call(fi, function(b){ var s = modo === 'soldi' && b.classList.contains('sel'); if (s) selT = soldi(b.textContent); posta += '<button type="button" class="xa-fi' + (s ? ' sel' : '') + '" data-xf="' + add(b) + '">' + esc(soldi(b.textContent)) + '</button>'; });
      else (window.GEO_FASCE || []).forEach(function(f){ posta += '<button type="button" class="xa-fi" data-xf2="t-' + esc(f[0]) + '">' + esc(soldi(f[1] < 1 ? (en() ? '0.50' : '0,50') : String(f[1]))) + '</button>'; });
    }
    if (posta) h += '<h2 class="xa-ap-sez">' + L('Posta', 'Stake') + '</h2><div class="xa-ap-fi">' + posta + '</div>';
    var pan = $('gs-pan');
    if (modo === 'soldi') {
      var rp = $('gs-riep');
      if (rp) {
        var r1 = rp.querySelector('.gs-r1'), r2 = rp.querySelectorAll('.gs-r2 > span');
        if (r1) h += '<p class="xa-ap-info">' + esc([].map.call(r1.querySelectorAll('span'), function(s){ return s.textContent.trim(); }).join(' · ')) + '</p>';
        [].forEach.call(r2, function(s){ h += '<p class="xa-ap-info' + (s.classList.contains('no') ? ' xf2-no' : '') + '">' + esc(s.textContent.trim()) + '</p>'; });
      }
    } else if (pan) {
      var pd = pan.querySelector('.gs-pd'); if (pd) h += '<p class="xa-ap-info">' + esc(senza(pd.textContent)) + '</p>';
    }
    var lob = $('gs-lob');
    if (lob && (modo === 'gratis' || modo === 'amici')) {
      h += '<div class="xa-ap-grp xf2-geo-lob">';
      [].forEach.call(lob.children, function(c){
        if (c.classList.contains('gs-lr')) {
          var n = c.querySelector('.gs-lrn'), pp = c.querySelector('.gs-lrp'), ss = c.querySelector('.gs-lrs');
          h += '<button type="button" class="xa-ap-r xa-ap-more" data-xf="' + add(c) + '"><span class="xa-ri xa-ri--l" aria-hidden="true">' + svg('persone') + '</span><span class="xa-ap-rt"><b>' + esc(n ? n.textContent : '') +
            '</b><span>' + esc((pp ? frase(pp.textContent) : '') + (ss ? ' · ' + ss.textContent + ' ' + L('seduti', 'seated') : '')) + '</span></span></button>';
        } else h += '<p class="xf2-geo-lv">' + esc(senza(c.textContent)) + '</p>';
      });
      h += '</div>';
    }
    if (pan) { var nt = pan.querySelector('.gs-nota'); if (nt) h += '<p class="xa-ap-nota">' + esc(senza(nt.textContent)) + '</p>'; }
    var cta = pan && pan.querySelector('.gs-cta'), go = '', off = false;
    if (cta) {
      off = cta.classList.contains('spento');
      var sm = cta.querySelector('small'), ct = cta.cloneNode(true); [].forEach.call(ct.querySelectorAll('small,svg'), function(x){ x.remove(); });
      go = frase(ct.textContent);
      if (modo === 'soldi' && !off && selT) go = L('Gioca', 'Play') + ' · ' + selT;
      if (off && sm) go += ' · ' + senza(sm.textContent);
    }
    var sec = [];
    if (modi.allena && modo !== 'allena') sec.push(['allena', L('Allenati coi bot', 'Practice with bots')]);
    if (modi.amici && modo !== 'amici') sec.push(['amici', L('Crea una lobby', 'Create a lobby')]);
    if (modi.torneo && !modi.torneo.hidden && modo !== 'torneo') sec.push(['torneo', L('Torneo', 'Tournament')]);
    if (modo === 'allena' || modo === 'amici' || modo === 'torneo') sec.push(['soldi', L('Torna alla posta', 'Back to stakes')]);
    h += '<div class="xa-ap-bar">' + (go ? '<button type="button" class="xa-ap-go' + (off ? ' off' : '') + '" data-xf2="cta">' + esc(go) + '</button>' : '') +
      (sec.length ? '<div class="xa-ap-sec">' + sec.map(function(s){ return '<button type="button" data-xf2="m-' + s[0] + '">' + esc(s[1]) + '</button>'; }).join('') + '</div>' : '') + '</div>';
    var vec = GEO.body.querySelector(':scope > .xf2-geo');
    var ap = document.createElement('div'); ap.className = 'xa-ap xf2-geo'; ap.innerHTML = h;
    var ban = ap.querySelector('.xa-ap-ban'), bb = ap.querySelector('.xa-ap-bb');
    var XA = window.XA || {}, img = XA.img || {};
    if (img['gbx_bn_geo.webp'] === true) ban.classList.add('xa-ap-ban--ok');
    bb.addEventListener('load', function(){ ban.classList.add('xa-ap-ban--ok'); }, { once:true });
    bb.addEventListener('error', function(){ bb.remove(); }, { once:true });
    ap.addEventListener('click', function(e){
      var t = e.target.closest('[data-xf], [data-xf2]'); if (!t || !ap.contains(t)) return;
      var xf = t.getAttribute('data-xf'), x2 = t.getAttribute('data-xf2');
      if (xf != null) { var b = az[Number(xf)]; if (b && b.isConnected) b.click(); return; }
      if (x2 === 'cta') { var c = $('gs-pan') && $('gs-pan').querySelector('.gs-cta'); if (c) c.click(); return; }
      if (x2 === 'regole') { geoRegole(); return; }
      if (x2 && x2.indexOf('t-') === 0) { if (modi.soldi) modi.soldi.click(); var f = sc.querySelector('#gs-fiches .gs-fiche[data-t="' + x2.slice(2) + '"]'); if (f) f.click(); return; }
      if (x2 && x2.indexOf('m-') === 0) {
        var k = x2.slice(2), m = sc.querySelector('#gs-modi .gs-modo[data-m="' + k + '"]'); if (!m) return;
        m.click();
        if (k === 'allena' || k === 'amici' || k === 'torneo') { var c2 = $('gs-pan') && $('gs-pan').querySelector('.gs-cta'); if (c2) c2.click(); }
      }
    });
    var st = GEO.body.scrollTop;
    if (vec) vec.replaceWith(ap); else GEO.body.insertBefore(ap, GEO.body.firstChild);
    GEO.body.classList.add('xf2-geo-on'); GEO.scr.classList.add('xf2-geo-scr');
    GEO.body.scrollTop = st;
  }
  function geoRegole(){
    var gb = GEO.sc && GEO.sc.querySelector('.gs-guida-b'); if (!gb) return;
    gb.click();
    var g = $('gs-guida'), righe = [];
    [].forEach.call(g ? g.querySelectorAll('.gs-gr') : [], function(r){ var b = r.querySelector('b'), p = r.querySelector('p'); righe.push([b ? b.textContent : '', p ? p.textContent : '']); });
    try { geoGuida(false); } catch(e){}
    var IC = ['occhio', 'pin', 'tempo', 'mondo', 'moneta', 'esci', 'robot'];
    var o = document.createElement('div'); o.className = 'xa-sheet';
    o.innerHTML = '<div class="xa-sheet-p" role="dialog" aria-modal="true"><div class="xa-sheet-h"><b>Geo Bet</b><button type="button" class="xa-sheet-x">' + L('Fine', 'Done') +
      '</button></div><div class="xa-sheet-c"><div class="xa-ap-grp">' + righe.map(function(r, i){ return '<div class="xa-ap-r"><span class="xa-ri" aria-hidden="true">' + svg(IC[i] || 'info') + '</span><span class="xa-ap-rt"><b>' + esc(r[0]) + '</b><span>' + esc(r[1]) + '</span></span></div>'; }).join('') + '</div></div></div>';
    var chiudi = function(){ o.classList.remove('on'); setTimeout(function(){ o.remove(); }, 260); fx('back'); };
    o.addEventListener('click', function(e){ if (e.target === o || e.target.closest('.xa-sheet-x')) chiudi(); });
    document.body.appendChild(o); requestAnimationFrame(function(){ o.classList.add('on'); });
    fx('open');
  }
  function geo(){
    var scr = $('arc'), body = $('arc-body'); if (!scr || !body || body.__xf2) return;
    body.__xf2 = 1; GEO.scr = scr; GEO.body = body;
    new MutationObserver(function(rs){
      if (rs.every(function(r){ return [].every.call(r.addedNodes, function(n){ return n.nodeType === 1 && n.classList.contains('xa-ap'); }) && [].every.call(r.removedNodes, function(n){ return n.nodeType === 1 && n.classList.contains('xa-ap'); }); })) return;
      geoGuarda();
    }).observe(body, { childList:true });
    geoGuarda();
  }
  function pkRiga(cls, sx, tit, sub, destra){
    return '<div class="xf2-pk-r ' + (cls || '') + '">' + sx + '<span class="xa-ap-rt"><b>' + tit + '</b>' + (sub ? '<span>' + sub + '</span>' : '') + '</span><span class="xf2-pk-az"></span></div>';
  }
  function pkVeste(){
    var ov = $('pk5-ov'), sc = $('pk5-sc'); if (!ov || !sc || !sc.querySelector('.pk5-poste')) return;
    ov.classList.add('xf2-pk5');
    var tt = ov.querySelector('.pk5-tt'); if (tt) tt.textContent = L('Poker a 5', '5-handed poker');
    var bk = ov.querySelector('.pk5-back'); if (bk && !bk.__xf2) { bk.__xf2 = 1; bk.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>'; }
    var frag = document.createElement('div'); frag.className = 'xf2-pk';
    var sub = sc.querySelector('.pk5-sub');
    frag.innerHTML = '<div class="xa-ap-ban" aria-hidden="true"><img class="xa-ap-bi" src="gbx_pv_pk5.webp" alt=""><img class="xa-ap-bb" src="gbx_bn_pk5.webp" alt="" decoding="async"></div>' +
      '<div class="xa-ap-hd"><span class="xa-ap-ic"><img src="gbx_pv_pk5.webp" alt="" width="64" height="64"></span><div class="xa-ap-ht"><h1>' + L('Poker a 5', '5-handed poker') + '</h1><p>' +
      L('Poker all’italiana, con la teresina', 'Italian poker, with the teresina') + '</p><small class="xa-ap-meta"><span>' + L('2-5 giocatori', '2-5 players') + '</span><span>' + L('entri quando vuoi', 'join any time') + '</span></small></div></div>';
    var bb = frag.querySelector('.xa-ap-bb'), ban = frag.querySelector('.xa-ap-ban');
    if (window.XA && XA.img && XA.img['gbx_bn_pk5.webp'] === true) ban.classList.add('xa-ap-ban--ok');
    bb.addEventListener('load', function(){ ban.classList.add('xa-ap-ban--ok'); }, { once:true });
    bb.addEventListener('error', function(){ bb.remove(); }, { once:true });
    var g = document.createElement('div');
    g.innerHTML = '<h2 class="xa-ap-sez">' + L('Come si gioca', 'How to play') + '</h2><div class="xa-ap-grp">' +
      '<div class="xa-ap-r"><span class="xa-ri" aria-hidden="true">' + svg('carte') + '</span><span class="xa-ap-rt"><b>' + L('Poker all’italiana', 'Italian poker') + '</b><span>' + L('Da 2 a 5 al tavolo, con la teresina.', 'From 2 to 5 at the table, with the teresina.') + '</span></span></div>' +
      '<div class="xa-ap-r"><span class="xa-ri" aria-hidden="true">' + svg('sedia') + '</span><span class="xa-ap-rt"><b>' + L('Ti siedi col saldo', 'Sit down with your balance') + '</b><span>' + L('Porti al tavolo da 20 a 100 poste in fiche.', 'Bring 20 to 100 stakes in chips to the table.') + '</span></span></div>' +
      '<div class="xa-ap-r"><span class="xa-ri" aria-hidden="true">' + svg('esci') + '</span><span class="xa-ap-rt"><b>' + L('Ti alzi quando vuoi', 'Stand up any time') + '</b><span>' + L('Le tue fiche tornano sul saldo.', 'Your chips go back to your balance.') + '</span></span></div></div>';
    var parti = document.createDocumentFragment();
    parti.appendChild(frag); while (g.firstChild) parti.appendChild(g.firstChild);
    if (sub) sub.remove();
    function tasto(b, testo, tipo){ b.className = 'xf2-pill' + (tipo ? ' ' + tipo : ''); b.removeAttribute('style'); b.textContent = testo; return b; }
    var figli = [].slice.call(sc.children);
    figli.forEach(function(c){
      if (c.classList.contains('pk5-sez')) {
        var i = c.querySelector('i'), it = i ? senza(i.textContent) : ''; if (i) i.remove();
        var h2 = document.createElement('h2'); h2.className = 'xa-ap-sez';
        var t = fraseSeg(c.textContent);
        h2.innerHTML = esc(t) + (it ? ' <small>' + esc(it) + '</small>' : ''); parti.appendChild(h2); c.remove(); return;
      }
      if (c.classList.contains('pk5-poste')) {
        var gr = document.createElement('div'); gr.className = 'xa-ap-grp xf2-pk-grp';
        [].forEach.call(c.querySelectorAll('.pk5-po'), function(po){
          var b = po.querySelector('b'), sm = po.querySelector('small'), n = po.querySelector('.n'), bt = po.querySelector('button');
          var d = document.createElement('div');
          d.innerHTML = pkRiga(po.classList.contains('spento') ? 'off' : '', '<span class="xf2-pk-chip">' + esc(b ? b.textContent : '') + '</span>',
            L('Posta ', 'Stake ') + esc(b ? b.textContent : ''), esc((sm ? frase(sm.textContent).replace(/^posta · /i, '').replace(/^stake · /i, '') : '') + (n && n.textContent ? ' · ' + n.textContent : '')));
          var riga = d.firstChild; if (bt) riga.querySelector('.xf2-pk-az').appendChild(tasto(bt, L('Siediti', 'Sit down')));
          gr.appendChild(riga);
        });
        parti.appendChild(gr); c.remove(); return;
      }
      if (c.classList.contains('pk5-tav')) {
        var last = parti.lastChild, grp = (last && last.classList && last.classList.contains('xf2-pk-tav')) ? last : null;
        if (!grp) { grp = document.createElement('div'); grp.className = 'xa-ap-grp xf2-pk-grp xf2-pk-tav'; parti.appendChild(grp); }
        var ps = c.querySelector('.ps'), cb = c.querySelector('.ch b'), cs = c.querySelector('.ch small');
        var d2 = document.createElement('div');
        d2.innerHTML = pkRiga('', '<span class="xf2-pk-chip' + (ps && ps.classList.contains('gr') ? ' g' : '') + '">' + esc(ps ? frase(ps.textContent) : '') + '</span>',
          esc(cb ? cb.textContent : ''), esc(cs ? senza(cs.textContent) : ''));
        var rg = d2.firstChild, az = rg.querySelector('.xf2-pk-az');
        [].forEach.call(c.querySelectorAll('button'), function(bt){ var gu = bt.getAttribute('data-a') === 'guarda'; az.appendChild(tasto(bt, gu ? L('Guarda', 'Watch') : L('Siediti', 'Sit'), gu ? 'vetro' : '')); });
        grp.appendChild(rg); c.remove(); return;
      }
      if (c.classList.contains('pk5-vuoto')) { var p = document.createElement('p'); p.className = 'xa-ap-nota'; p.textContent = senza(c.textContent); parti.appendChild(p); c.remove(); return; }
      if (c.classList.contains('pk5-bot')) {
        c.className = 'xa-ap-grp xf2-pk-bot';
        [].forEach.call(c.querySelectorAll(':scope > div[style]'), function(l){ l.removeAttribute('style'); l.className = 'xf2-pk-lbl'; });
        [].forEach.call(c.querySelectorAll('.pk5-sc2'), function(s){ s.className = 'xa-ap-seg xf2-pk-seg'; [].forEach.call(s.querySelectorAll('button'), function(b){ b.textContent = frase(b.textContent); if (b.classList.contains('on')) b.classList.add('sel'); }); });
        var ab = c.querySelector('.pk5-bt'); if (ab) tasto(ab, L('Allenati', 'Practice'), 'grande');
        parti.appendChild(c); return;
      }
      if (c.classList.contains('pk5-bt')) {
        var a = c.getAttribute('data-a');
        tasto(c, a === 'gratis' ? L('Siediti a un tavolo gratis', 'Sit at a free table') : (a === 'torna' ? L('Torna al tuo tavolo', 'Back to your table') : frase(c.textContent)), a === 'gratis' ? 'grande vetro' : 'grande');
        parti.appendChild(c); return;
      }
      if (c.classList.contains('pk5-nota')) { c.className = 'xa-ap-nota xf2-pk-nota'; parti.appendChild(c); return; }
      parti.appendChild(c);
    });
    sc.innerHTML = ''; sc.appendChild(parti);
  }
  function pkMod(){
    var m = $('pk5-buy'); if (!m) return;
    m.classList.add('xf2-pkm');
    var h3 = m.querySelector('h3'); if (h3) h3.textContent = fraseSeg(h3.textContent);
    var giro = function(){
      [].forEach.call(m.querySelectorAll('button'), function(b){ var t = b.textContent, n = fraseMista(t); if (n !== t) b.textContent = n; });
      var e = m.querySelector('.err'); if (e && e.textContent) { var t2 = tradErr(e.textContent); if (t2 !== e.textContent) e.textContent = t2; }
    };
    giro();
    if (!m.__xf2) { m.__xf2 = 1; osserva(m, giro); }
  }
  function pk5(){
    avvolgi('pk5Disegna', pkVeste);
    avvolgi('pk5Compra', pkMod);
  }
  function rete(){
    avvolgi('wsNetBanner', function(scr, mode){
      var b = $(scr + '-netbn'); if (!b || !mode) return;
      var vivo = (mode === 2 || mode === 3);
      b.style.cssText = ''; b.className = 'xf2-net' + (vivo ? ' xf2-net--tocca' : '') + (mode === 1 ? '' : ' xf2-net--ferma');
      var t = mode === 1 ? L('Connessione persa · mi riconnetto…', 'Connection lost · reconnecting…')
        : (mode === 3 ? L('Sessione aperta altrove · tocca per riprendere qui', 'Session open elsewhere · tap to resume here')
                      : L('Connessione persa · tocca per riprovare', 'Connection lost · tap to retry'));
      b.innerHTML = '<i class="xf2-net-pt" aria-hidden="true"></i><span>' + t + '</span>';
      b.setAttribute('role', 'status');
    });
  }
  function titoli(){
    var T = [['arc', '#arc-title'], ['tank', '#tank > .game-hdr .game-title'], ['glad', '#glad > .game-hdr .game-title'], ['turf', '#turf > .game-hdr .game-title']];
    T.forEach(function(p){
      var el = document.querySelector(p[1]); if (!el || el.__xf2) return; el.__xf2 = 1;
      el.classList.add('xf2-gtitle');
      var fai = function(){
        var t = el.textContent; if (!/[A-Za-z]/.test(t)) return;
        var g = p[0] === 'arc' ? (function(){ try { return (window.RTD && RTD.game) || window.RTD_GAME || ''; } catch(e){ return ''; } })() : p[0];
        var nu = senza(t);
        if (nu === nu.toUpperCase()) nu = nomeGioco(g) || titoloCaso(nu);
        if (nu && nu !== t) el.textContent = nu;
      };
      fai();
      osserva(el, fai, { childList:true, characterData:true, subtree:true });
    });
  }
  function swapTesti(){
    var p = $('swap-panel'); if (!p) return;
    p.classList.add('xf2-swap');
    p.classList.toggle('xf2-it', !en());
    if (en()) return;
    [].forEach.call(p.querySelectorAll('.info-lbl, #swap-r-net-lbl'), function(l){ var t = l.textContent, n = fraseMista(t); if (n !== t) l.textContent = n; });
    [].forEach.call(p.querySelectorAll('button'), function(b){
      var t = b.textContent, n = fraseMista(t);
      if (b.id === 'swap-go-btn') n = /creaz/i.test(t) ? L('Creazione…', 'Creating…') : L('Converti in Bitcoin', 'Convert to Bitcoin');
      if (n !== t) b.textContent = n;
    });
    var mb = $('swap-r-memo-box'); if (mb && mb.firstElementChild) { var mt = mb.firstElementChild, m2 = fraseMista(mt.textContent); if (m2 !== mt.textContent) mt.textContent = m2; }
    var tr = $('swap-tracker'); if (tr && tr.firstElementChild) { var t3 = tr.firstElementChild; if (/^STATO CONVERSIONE$/.test(t3.textContent.trim())) t3.textContent = 'Stato della conversione'; }
    var sel = $('swap-coin');
    if (sel) [].forEach.call(sel.options, function(o){ var t = o.textContent, n = senza(t).replace(/^—\s*/, '').replace(/\s*—$/, ''); if (/^scegli una crypto$/i.test(n)) n = 'Scegli una crypto'; if (n !== t) o.textContent = n; });
    var es = $('swap-estimate'); if (es && /^⚠/.test(es.textContent)) es.textContent = senza(es.textContent);
    var mn = $('swap-min'); if (mn && /^min: /.test(mn.textContent)) mn.textContent = mn.textContent.replace(/^min: /, 'Minimo ');
    var hint = $('ton-hint');
    if (hint && !hint.__xf2) {
      hint.__xf2 = 1;
      var w = document.createTreeWalker(hint, NodeFilter.SHOW_TEXT, null), n2, k = 0;
      while ((n2 = w.nextNode())) {
        var v = n2.nodeValue;
        if (/[1-3]️?⃣/.test(v)) n2.nodeValue = v.replace(/([1-3])️?⃣\s*/, function(a, d){ return d + '. '; });
        else if (/^\s*[1-3]\s+[A-Z]/.test(v) && k < 3) n2.nodeValue = v.replace(/^(\s*)([1-3])\s+/, '$1$2. ');
        if (/CONVERTI IN BTC/.test(n2.nodeValue)) n2.nodeValue = n2.nodeValue.replace('CONVERTI IN BTC', '«Converti in Bitcoin»');
        if (/MEMO \(obbligatorio!\)/.test(n2.nodeValue)) n2.nodeValue = n2.nodeValue.replace('MEMO (obbligatorio!)', 'memo (obbligatorio)');
        k++;
      }
      [].forEach.call(hint.querySelectorAll('strong'), function(s){ s.textContent = senza(s.textContent); s.removeAttribute('style'); });
      [].forEach.call(hint.querySelectorAll('strong'), function(s){ if (/^MEMO/.test(s.textContent)) s.textContent = 'memo (obbligatorio)'; });
    }
  }
  function swap(){
    var p = $('swap-panel'); if (!p) return;
    swapTesti();
    osserva(p, swapTesti, { childList:true, subtree:true, characterData:true });
  }
  function vuoti(){
    var f = window.gbEmpty;
    if (typeof f !== 'function' || f.__xf2) return;
    var w = function(glifo, titolo, testo, azione){
      var g = String(glifo || ''), ic;
      if (/<svg/i.test(g)) ic = g;
      else if (/gb-podio/.test(g)) ic = svg('podio');
      else if (g.indexOf('📡') >= 0) ic = svg('rete');
      else if (g.indexOf('🧾') >= 0) ic = svg('ricevuta');
      else ic = svg('info');
      var tx = String(testo || '');
      if (!en()) tx = tx.replace('e solo da ricaricare', 'è solo da ricaricare').replace('dal piu recente', 'dal più recente');
      return '<div class="gb-empty xf2-vuoto"><div class="gb-empty__ico xf2-vuoto-ic">' + ic + '</div>' +
        '<div class="gb-empty__ttl">' + titolo + '</div><div class="gb-empty__txt">' + tx + '</div>' + (azione || '') + '</div>';
    };
    w.__xf2 = true; w.__xf2orig = f;
    try { window.gbEmpty = w; } catch(e){}
  }
  function grun(){
    var g = $('grun'); if (!g || g.__xf2) return; g.__xf2 = 1;
    g.classList.add('xf2-grun');
    var tt = g.querySelector(':scope > .game-hdr .game-title'); if (tt) { tt.textContent = 'Gambler’s Run'; tt.removeAttribute('style'); }
    var bal = $('gr-bal'); if (bal) bal.removeAttribute('style');
    if (en()) return;
    var ht = g.querySelector('.gr-hero-title'); if (ht && /GAMBLER/.test(ht.textContent)) ht.textContent = 'Gambler’s Run';
    var tag = g.querySelector('.gr-hero-tag'); if (tag) tag.textContent = 'Una discesa ad alto rischio. Fin dove hai il coraggio di arrivare?';
    var FE = { 'twin-stick arena':'Arena a due levette', '14 enemy types':'14 tipi di nemici', '24 power-ups':'24 potenziamenti', 'beat THE HOUSE':'Batti la Casa' };
    [].forEach.call(g.querySelectorAll('.gr-feats span'), function(s){ var k = senza(s.textContent); if (FE[k]) s.textContent = FE[k]; });
    var ST = [
      '<b>Combatti</b>: ripulisci l’arena dalle ondate. Muoviti per schivare, mira per sparare, usa lo <b>scatto</b> per scappare.',
      '<b>Prendi il potenziamento</b> che cade: si somma agli altri e dura per tutta la discesa.',
      'Poi si aprono <b>3 porte</b>. Entra in una: se <b>vinci</b> il piatto cresce, se <b>sbagli</b> perdi una <b>vita</b>; finite le vite sei <b>fuori</b>.'
    ];
    [].forEach.call(g.querySelectorAll('.gr-step'), function(s, i){ var d = s.children[1]; if (d && ST[i]) d.innerHTML = ST[i]; });
    var steps = g.querySelector('.gr-steps'), nota = steps && steps.nextElementSibling;
    if (nota && /fight is just skill/i.test(nota.textContent)) { nota.removeAttribute('style'); nota.className = 'xf2-gr-nota'; nota.innerHTML = 'Il combattimento è solo abilità: a soldi si gioca soltanto la <b>porta che scegli</b>. Puoi incassare quando vuoi: piatto × posta.'; }
    var lbl = g.querySelector('.gr-ante-card .info-lbl'); if (lbl) lbl.textContent = 'Scegli la posta';
    var sb = g.querySelector('.gr-startbtn'); if (sb) sb.textContent = 'Inizia la discesa';
    var gal = $('gr-galbtn'); if (gal) { gal.textContent = 'I finali della notte'; gal.removeAttribute('style'); gal.style.display = 'none'; gal.className = 'gr-galbtn xf2-gr-gal'; }
    var R = { 'YOUR POT · cash out anytime':'Il tuo piatto · incassa quando vuoi', 'LIVES':'Vite', 'GRIT':'Grinta', 'DEPTH':'Profondità', 'DRAG THE GAMBLER INTO A ROOM':'Trascina il Gambler in una stanza', 'Pick a room to begin your descent…':'Scegli una stanza per iniziare la discesa…' };
    var w = document.createTreeWalker(g, NodeFilter.SHOW_TEXT, null), n;
    while ((n = w.nextNode())) { var k = n.nodeValue.trim(); if (R[k]) n.nodeValue = n.nodeValue.replace(k, R[k]); }
    var co = $('gr-cashout');
    if (co) osserva(co, function(){ var t = co.textContent; if (/CASH OUT/i.test(t)) co.textContent = 'Incassa ' + senza(t).replace(/^CASH OUT\s*/i, ''); });
    var lg = $('gr-rooms-legend');
    var leg = function(){ if (!lg) return; [].forEach.call(lg.querySelectorAll('.gr-legend-ttl, .gr-legend-badge'), function(x){ var t = x.textContent, nn = fraseSeg(t); if (nn !== t) x.textContent = nn; }); };
    leg(); if (lg) osserva(lg, leg, { childList:true });
  }
  function modale(){
    avvolgi('showModal', function(){
      var m = $('modal'); if (!m) return;
      m.classList.add('xf2-modal');
      var t = $('m-title'); if (t) t.textContent = frase(t.textContent);
      [].forEach.call(m.querySelectorAll('#m-actions button'), function(b){ b.textContent = frase(b.textContent); });
    });
    var m = $('modal'); if (m) m.classList.add('xf2-modal');
  }
  function passo(nome, fn){ try { fn(); } catch(e){ warn(nome, e); } }
  function avvia(){
    passo('errori', errori); passo('stato', statoSaldo); passo('slot', slot); passo('onboarding', onboarding); passo('voci', voci); passo('quest', quest);
    passo('spettatore', spettatore); passo('geo', geo); passo('pk5', pk5); passo('rete', rete); passo('titoli', titoli);
    passo('swap', swap); passo('vuoti', vuoti); passo('grun', grun); passo('modale', modale);
    try { if (window.CHALLENGES_ALL && CHALLENGES_ALL.length && !en() && $('ch-list') && $('ch-list').querySelector('.q-card')) renderChallenges(); } catch(e){}
    try { var lb = $('lb-list'), e = lb && lb.querySelector('.gb-empty:not(.xf2-vuoto)'); if (e && /Riprova|Retry/.test(e.textContent)) lb.innerHTML = gbEmpty('📡', 'Classifica non raggiungibile', 'La rete non ha risposto. Nessun dato perso: e solo da ricaricare.', '<button class="gb-btn gb-btn--ghost" onclick="loadLeaderboard()">Riprova</button>'); } catch(e2){}
  }
  avvia();
  document.addEventListener('gbx:screen', function(){ passo('titoli', titoli); passo('geo', geo); passo('grun', grun); });
})();
;
(function(){
  'use strict';
  if (window.XQ) return;
  var W = window, D = document;
  var XQ = W.XQ = { on:true, att:null, inv:null, msg:null, log:[] };
  function L(it, en){ return (W.GB_LANG === 'en') ? en : it; }
  function hap(t){ try { if (W.GBX) GBX.hap(t); } catch(e){} }
  function sfx(n){ try { if (W.GBX) GBX.sfx(n); } catch(e){} }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  var EMO = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2300}-\u{23FF}\u{FE0F}\u{200D}\u{20E3}]/gu;
  function pulito(s){ try { return String(s || '').replace(EMO, '').replace(/^[^\wÀ-ÿ€]+/, '').replace(/\s+/g, ' ').trim(); } catch(e){ return String(s || '').trim(); } }
  function nota(k, d){ try { XQ.log.push({ t:Date.now(), k:k, d:d }); if (XQ.log.length > 80) XQ.log.shift(); } catch(e){} }
  var CLI = {
    rtd: { st:function(){ return W.RTD; }, send:'rtdSend', conn:'rtdConnect', again:'rtdAgain', gioco:function(){ return (W.RTD && RTD.game) || ''; }, vai:function(g){ W.RTD_GAME = g; W.go('arc'); } },
    tk:  { st:function(){ return W.TKD; }, send:'tkSend',  conn:'tkConnect',  again:'tkAgain',  gioco:function(){ return 'tank'; }, vai:function(){ W.go('tank'); } },
    gld: { st:function(){ return W.GLD; }, send:'gldSend', conn:'gldConnect', again:'gldAgain', gioco:function(){ return 'glad'; }, vai:function(){ W.go('glad'); } },
    twr: { st:function(){ return W.TWR; }, send:'twrSend', conn:'twrConnect', again:'twrAgain', gioco:function(){ return 'turf'; }, vai:function(){ W.go('turf'); } }
  };
  var DA_ONCLICK = { 'rtdAgain()':'rtd', 'tkAgain()':'tk', 'gldAgain()':'gld', 'twrAgain()':'twr' };
  function cliDi(g){ return g === 'tank' ? 'tk' : g === 'glad' ? 'gld' : g === 'turf' ? 'twr' : 'rtd'; }
  function wsAperta(c){ var s = CLI[c] && CLI[c].st(); return !!(s && s.wsOk && s.ws && s.ws.readyState === 1); }
  function manda(c, o){ try { var f = W[CLI[c].send]; if (typeof f === 'function') { f(o); nota('manda', o); return true; } } catch(e){} return false; }
  function nomeGioco(g){
    var fissi = { tank:'Tank Duel', glad:'Colosseo', turf:'Gambler City Royale' };
    if (fissi[g]) return fissi[g];
    try { var m = W.RTD_G && RTD_G[g]; if (m && m.title) { var s = pulito(m.title);
      if (/[A-Z]{2}/.test(s) && !/[a-z]/.test(s)) s = s.toLowerCase().replace(/(^|\s)(\S)/g, function(a, b, c){ return b + c.toUpperCase(); }).replace(/\b(Uno|1v1|Pvp)\b/gi, function(w){ return w.toUpperCase() === 'PVP' ? 'PvP' : w.toUpperCase(); });
      return s; } } catch(e){}
    try { var n = W.GBX && GBX.nomeGioco && GBX.nomeGioco(g); if (n) return n; } catch(e){}
    return L('Partita', 'Match');
  }
  function euro(v){ try { return '€ ' + Number(v || 0).toFixed(2).replace('.', ','); } catch(e){ return '€ ' + v; } }
  function posta(o){ return o.gratis ? L('Partita gratis', 'Free match') : (euro(o.eur) + ' ' + L('a testa', 'each')); }
  function lista(n){ n = (n || []).filter(Boolean); if (n.length < 2) return n.join(''); return n.slice(0, -1).join(', ') + ' ' + L('e', 'and') + ' ' + n[n.length - 1]; }
  function iniz(nm){ var s = String(nm || '').replace(/[^A-Za-z0-9À-ÿ ]+/g, ' ').trim(); if (!s) return '?'; var w = s.split(/\s+/); return ((w[0] || '').charAt(0) + ((w[1] || '').charAt(0) || '')).toUpperCase(); }
  function idoneo(c){
    if (!XQ.on) return false;
    var s = CLI[c].st(); if (!s) return false;
    if (s.tour || s.practice || s.spec) return false;
    if (c === 'rtd' && (!RTD.game || RTD.game === 'smash')) return false;
    return true;
  }
  var EL = null, TIC = null, TN = 0;
  function strato(){
    if (EL && EL.isConnected) return EL;
    EL = D.createElement('div'); EL.id = 'xq'; EL.className = 'xq'; EL.setAttribute('role', 'dialog'); EL.setAttribute('aria-live', 'polite');
    D.body.appendChild(EL);
    EL.addEventListener('click', function(ev){
      var b = ev.target.closest && ev.target.closest('[data-xq]'); if (!b) return;
      ev.preventDefault(); ev.stopPropagation();
      var a = b.getAttribute('data-xq');
      if (a === 'si') accetta(); else if (a === 'no') rifiuta(); else if (a === 'annulla') annulla(); else if (a === 'chiudi') chiudi();
    });
    return EL;
  }
  function anello(fino, tot){
    var r = 17, C = 2 * Math.PI * r, resta = Math.max(0, (fino - Date.now()) / 1000), f = tot > 0 ? Math.max(0, Math.min(1, resta / tot)) : 0;
    return '<span class="xq-anello"><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="' + r + '" class="xq-a0"/><circle cx="20" cy="20" r="' + r + '" class="xq-a1" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C * (1 - f)).toFixed(1) + '"/></svg><b>' + Math.ceil(resta) + '</b></span>';
  }
  var ICONA = {
    ok:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    no:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    giro:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 8.5A7.5 7.5 0 1 0 19.5 15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M19.6 4.5v4.4h-4.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };
  function disegna(){
    var x = strato(), h = '', cls = 'xq';
    if (XQ.msg) {
      var m = XQ.msg;
      cls += ' on xq-k-msg' + (m.buono ? ' xq-buono' : '');
      h = '<div class="xq-card"><div class="xq-riga"><span class="xq-ic">' + (m.buono ? ICONA.ok : ICONA.no) + '</span><div class="xq-tx"><b>' + esc(m.t1) + '</b>' + (m.t2 ? '<span>' + esc(m.t2) + '</span>' : '') + '</div>'
        + '<button class="xq-x" data-xq="chiudi" aria-label="' + L('Chiudi', 'Close') + '">' + ICONA.no + '</button></div></div>';
    } else if (XQ.inv) {
      var v = XQ.inv, alt = (v.si || []).filter(function(n){ return n !== v.da; });
      cls += ' on xq-k-inv';
      h = '<div class="xq-card"><div class="xq-riga"><span class="xq-av">' + esc(iniz(v.da)) + '</span>'
        + '<div class="xq-tx"><b>' + esc(L(v.da + ' vuole la rivincita', v.da + ' wants a rematch')) + '</b>'
        + '<span>' + esc(nomeGioco(v.game) + ' · ' + posta(v) + (v.tot > 2 ? ' · ' + L('al tavolo in ', 'table of ') + v.tot : '')) + '</span>'
        + (alt.length ? '<span class="xq-pic">' + esc(L('Hanno già accettato: ', 'Already in: ') + lista(alt)) + '</span>' : '')
        + '</div>' + anello(v.fino, v.dur) + '</div>'
        + '<div class="xq-btns"><button class="xq-b xq-b2" data-xq="no">' + L('No', 'No') + '</button><button class="xq-b xq-b1" data-xq="si">' + L('Accetta', 'Accept') + '</button></div>'
        + (v.gratis ? '' : '<div class="xq-nota">' + L('La posta si blocca solo quando la partita parte', 'Your stake is held only when the match starts') + '</div>') + '</div>';
    } else if (XQ.att) {
      var a = XQ.att, tit, sub;
      cls += ' on xq-k-att';
      if (a.stato === 'parte') { tit = L('Si parte', 'Starting'); sub = L('Blocco la posta e apro il tavolo', 'Holding stakes and opening the table'); }
      else if (!a.rid) { tit = L('Chiedo la rivincita', 'Asking for a rematch'); sub = nomeGioco(a.game); }
      else if (a.attesi && a.attesi.length) { tit = L('Aspetto ', 'Waiting for ') + lista(a.attesi); sub = nomeGioco(a.game) + ' · ' + posta(a); }
      else { tit = L('Tutti pronti', 'Everyone is in'); sub = nomeGioco(a.game) + ' · ' + posta(a); }
      var chips = '';
      if (a.io) chips += '<span class="xq-chip si">' + ICONA.ok + L('Tu', 'You') + '</span>';
      (a.si || []).forEach(function(n){ chips += '<span class="xq-chip si">' + ICONA.ok + esc(n) + '</span>'; });
      (a.attesi || []).forEach(function(n){ chips += '<span class="xq-chip">' + '<i class="xq-pall"></i>' + esc(n) + '</span>'; });
      h = '<div class="xq-card"><div class="xq-riga"><span class="xq-ic xq-gira">' + ICONA.giro + '</span>'
        + '<div class="xq-tx"><b>' + esc(tit) + '</b><span>' + esc(sub) + '</span></div>'
        + (a.rid && a.fino ? anello(a.fino, a.dur) : '') + '</div>'
        + (chips ? '<div class="xq-chips">' + chips + '</div>' : '')
        + '<div class="xq-btns"><button class="xq-b xq-b2 xq-wide" data-xq="annulla">' + L('Annulla', 'Cancel') + '</button></div>'
        + (a.gratis || !a.rid ? '' : '<div class="xq-nota">' + L('Nessun addebito finché la partita non parte', 'Nothing is charged until the match starts') + '</div>') + '</div>';
    }
    if (x._k !== h) { x._k = h; x.innerHTML = h; }
    if (x.className !== cls) x.className = cls;
    var serve = !!(XQ.inv || XQ.att);
    if (serve && !TIC) TIC = setInterval(tic, 250);
    if (!serve && TIC) { clearInterval(TIC); TIC = null; }
    segnaTasti();
  }
  function tic(){
    var now = Date.now();
    if (XQ.inv && XQ.inv.fino && now > XQ.inv.fino + 4000) { XQ.inv = null; }
    if (XQ.att && !XQ.att.rid && now - XQ.att.t0 > 8000) {
      XQ.att = null; avviso(L('Rivincita non disponibile', 'Rematch not available'), L('Il server non ha risposto. Sei nel menu del gioco.', 'No answer from the server. You are in the game menu.'));
      return;
    }
    if (XQ.att && XQ.att.fino && now > XQ.att.fino + 6000 && XQ.att.stato !== 'parte') { XQ.att = null; }
    if (XQ.inv && (++TN % 4) === 0) segnaTasti();
    var x = EL; if (!x) return;
    [].forEach.call(x.querySelectorAll('.xq-anello'), function(r){
      var o = XQ.inv || XQ.att; if (!o || !o.fino) return;
      var tot = o.dur || 25, resta = Math.max(0, (o.fino - now) / 1000), C = 2 * Math.PI * 17;
      var b = r.querySelector('b'), c = r.querySelector('.xq-a1');
      if (b && b.textContent !== String(Math.ceil(resta))) { b.textContent = Math.ceil(resta); if (resta <= 5 && resta > 0) hap('sel'); }
      if (c) c.setAttribute('stroke-dashoffset', (C * (1 - Math.max(0, Math.min(1, resta / tot)))).toFixed(1));
    });
    if (!XQ.inv && !XQ.att) disegna();
  }
  var MSGT = null;
  function avviso(t1, t2, buono){
    XQ.msg = { t1:t1, t2:t2 || '', buono:!!buono };
    if (MSGT) clearTimeout(MSGT);
    MSGT = setTimeout(function(){ XQ.msg = null; disegna(); }, 4200);
    disegna();
  }
  function chiudi(){ XQ.msg = null; if (MSGT) { clearTimeout(MSGT); MSGT = null; } disegna(); }
  function tastoFine(){
    try {
      [].forEach.call(D.querySelectorAll('button.xq-riv'), function(b){
        var c = b.getAttribute('data-xq-cli'), inv = XQ.inv && cliDi(XQ.inv.game) === c && (c !== 'rtd' || XQ.inv.game === RTD.game);
        var t = inv ? L('Accetta la rivincita', 'Accept the rematch') : null;
        if (t && b.textContent !== t) { if (!b.hasAttribute('data-xq-prima')) b.setAttribute('data-xq-prima', b.textContent); b.textContent = t; b.classList.add('xq-acc'); }
        else if (!t && b.classList.contains('xq-acc')) { b.textContent = b.getAttribute('data-xq-prima') || L('Rivincita', 'Rematch'); b.classList.remove('xq-acc'); }
      });
    } catch(e){}
  }
  function segnaTasti(){
    try {
      Object.keys(DA_ONCLICK).forEach(function(oc){
        [].forEach.call(D.querySelectorAll('button[onclick="' + oc + '"]'), function(b){
          if (!b.classList.contains('xq-riv')) { b.classList.add('xq-riv'); b.setAttribute('data-xq-cli', DA_ONCLICK[oc]); }
        });
      });
    } catch(e){}
    tastoFine();
  }
  function tornaAlMenu(c){
    try { var f = W[CLI[c].again]; if (typeof f === 'function' && f.__xqOrig) f = f.__xqOrig; if (typeof f === 'function') f(); } catch(e){ try { console.error('[XQ] menu', e); } catch(_){} }
  }
  function quandoAperta(c, fn){
    var n = 0;
    (function prova(){
      if (wsAperta(c)) { fn(); return; }
      if (n === 0) { try { var s = CLI[c].st(); if (!(s && s.ws && (s.ws.readyState === 0 || s.ws.readyState === 1))) W[CLI[c].conn](); } catch(e){} }
      if (++n > 60) { XQ.att = null; avviso(L('Connessione assente', 'No connection'), L('Riprova fra poco', 'Try again shortly')); return; }
      setTimeout(prova, 100);
    })();
  }
  function chiedi(c){
    var g = CLI[c].gioco();
    if (XQ.inv && XQ.inv.game === g) { accetta(); return; }
    hap('medium'); sfx('tap');
    tornaAlMenu(c);
    XQ.msg = null;
    XQ.att = { cli:c, game:g, stato:'chiedo', t0:Date.now(), si:[], attesi:[], rid:'', gratis:true, eur:0 };
    disegna();
    quandoAperta(c, function(){ manda(c, { t:'riv_chiedi', game:g }); });
  }
  function accetta(){
    var v = XQ.inv; if (!v) return;
    var c = cliDi(v.game), s = CLI[c].st();
    hap('medium'); sfx('tap');
    XQ.inv = null;
    XQ.att = { cli:c, game:v.game, stato:'accetto', t0:Date.now(), rid:v.rid, si:(v.si || []).slice(), attesi:[], fino:v.fino, dur:v.dur, gratis:v.gratis, eur:v.eur };
    var qui = false;
    try { qui = (c === 'rtd') ? (W.CUR === 'arc' && RTD.game === v.game) : (W.CUR === (c === 'tk' ? 'tank' : c === 'gld' ? 'glad' : 'turf')); } catch(e){}
    if (qui && s && s.ui === 'over') tornaAlMenu(c);
    else if (!qui) { try { CLI[c].vai(v.game); } catch(e){} }
    disegna();
    quandoAperta(c, function(){ manda(c, { t:'riv_chiedi', rid:v.rid, game:v.game }); });
  }
  function rifiuta(){
    var v = XQ.inv; if (!v) return;
    hap('light');
    XQ.inv = null; disegna();
    manda(v.cli || cliDi(v.game), { t:'riv_no', rid:v.rid });
  }
  function annulla(){
    var a = XQ.att; if (!a) return;
    hap('light');
    XQ.att = null; disegna();
    if (a.rid || a.stato === 'chiedo') manda(a.cli, { t:'riv_no', rid:a.rid || '' });
  }
  var MOTIVI = {
    rifiutata:     function(c){ return [L(c + ' ha detto no', c + ' said no'), L('Niente rivincita. Sei nel menu del gioco.', 'No rematch. You are in the game menu.')]; },
    scaduta:       function(c){ return [L(c + ' non ha risposto in tempo', c + ' did not answer in time'), L('Niente rivincita. Sei nel menu del gioco.', 'No rematch. You are in the game menu.')]; },
    non_collegato: function(c){ return [L(c + ' non è collegato', c + ' is offline'), L('Invito non consegnato. Nessun addebito.', 'Invite not delivered. Nothing was charged.')]; },
    occupato:      function(c){ return [L(c + ' è già in un’altra partita', c + ' is already in another match'), L('Invito non consegnato. Nessun addebito.', 'Invite not delivered. Nothing was charged.')]; },
    saldo:         function(c){ return [L('Saldo insufficiente per ' + c, 'Not enough balance for ' + c), L('Rivincita annullata. Nessun addebito, le poste sono tornate.', 'Rematch cancelled. Nothing was charged.')]; },
    ritirata:      function(c){ return [L(c + ' ha ritirato la rivincita', c + ' withdrew the rematch'), '']; },
    soldi_chiusi:  function(){ return [L('Partite a soldi chiuse adesso', 'Money matches are closed now'), L('Per questo gioco la rivincita a soldi non è disponibile.', 'Rematch for money is not available for this game.')]; },
    in_corso:      function(){ return [L('La partita è ancora in corso', 'The match is still running'), '']; },
    non_disponibile: function(){ return [L('Rivincita non disponibile', 'Rematch not available'), L('Per questa partita non si può. Sei nel menu del gioco.', 'Not possible for this match. You are in the game menu.')]; },
    posti_dispari: function(){ return [L('Posti dispari', 'Odd number of players'), L('La rivincita è partita senza di te. Nessun addebito.', 'The rematch started without you. Nothing was charged.')]; },
    errore:        function(){ return [L('Rivincita non partita', 'Rematch did not start'), L('Nessun addebito. Riprova dal menu.', 'Nothing was charged. Try again from the menu.')]; }
  };
  function ricevi(m, c){
    nota('riceve', m);
    var now = Date.now();
    if (m.t === 'riv_offerta') {
      if (XQ.att && XQ.att.game === m.game && XQ.att.stato === 'chiedo' && !XQ.att.rid) {
      }
      var dur = Number(m.scade) || 25;
      var vecchio = XQ.inv && XQ.inv.rid === m.rid ? XQ.inv : null;
      XQ.inv = { cli:c, rid:String(m.rid || ''), game:String(m.game || ''), da:pulito(m.da) || L('Il tuo avversario', 'Your opponent'),
                 eur:Number(m.eur) || 0, gratis:!!m.gratis, fino:now + dur * 1000, dur:vecchio ? vecchio.dur : dur,
                 si:(m.si || []).map(pulito), tot:Number(m.tot) || 2, n:Number(m.n) || 1 };
      if (!vecchio) { hap('light'); sfx('open'); }
      XQ.msg = null;
      disegna();
      return;
    }
    if (m.t === 'riv_stato') {
      var a = XQ.att && (XQ.att.rid === m.rid || !XQ.att.rid) ? XQ.att : { cli:c, game:m.game, stato:'attesa', t0:now };
      a.rid = String(m.rid || ''); a.game = String(m.game || a.game); a.cli = c;
      a.stato = 'attesa'; a.io = !!m.io; a.si = (m.si || []).map(pulito); a.attesi = (m.attesi || []).map(pulito);
      a.gratis = !!m.gratis; a.eur = Number(m.eur) || 0;
      var d2 = Number(m.scade) || 0; a.fino = now + d2 * 1000; if (!a.dur) a.dur = Math.max(d2, 1);
      if (!a.attesi.length) { a.stato = 'parte'; }
      XQ.att = a;
      if (XQ.inv && XQ.inv.rid === a.rid) XQ.inv = null;
      XQ.msg = null;
      disegna();
      return;
    }
    if (m.t === 'riv_fine') {
      var mio = (XQ.att && (!XQ.att.rid || XQ.att.rid === m.rid)) || (XQ.inv && XQ.inv.rid === m.rid);
      if (XQ.inv && XQ.inv.rid === m.rid) XQ.inv = null;
      if (XQ.att && (!XQ.att.rid || XQ.att.rid === m.rid)) XQ.att = null;
      var chi = (m.chi || []).map(pulito), c1 = m.tu ? L('te', 'you') : lista(chi) || L('l’avversario', 'your opponent');
      var f = MOTIVI[m.motivo] || MOTIVI.errore, tx = f(c1);
      if (m.tu) {
        if (m.motivo === 'saldo') tx = [L('Saldo insufficiente', 'Not enough balance'), m.senza_te ? L('La rivincita è partita senza di te. Nessun addebito.', 'The rematch started without you. Nothing was charged.') : L('Ricarica per giocare la rivincita. Nessun addebito.', 'Top up to play the rematch. Nothing was charged.')];
        else if (m.senza_te) tx = [L('La rivincita è partita senza di te', 'The rematch started without you'), L('Nessun addebito.', 'Nothing was charged.')];
        else if (m.motivo === 'occupato') tx = [L('Sei già in un’altra partita', 'You are already in another match'), ''];
        else if (m.motivo === 'ritirata' || m.motivo === 'rifiutata' || m.motivo === 'scaduta') { disegna(); return; }
      }
      if (mio || m.chiesta) avviso(tx[0], tx[1], false); else disegna();
      if (mio || m.chiesta) hap('warning');
      return;
    }
  }
  function partita(m, c){
    if (!XQ.att && !XQ.inv) return;
    nota('start', { game:m.game, cli:c });
    if (XQ.att && XQ.att.game === m.game) { XQ.att = null; hap('success'); }
    if (XQ.inv) XQ.inv = null;
    XQ.msg = null;
    disegna();
  }
  function avvolgi(nome, c){
    var o = W[nome]; if (typeof o !== 'function' || o.__xq) return;
    var f = function(m){
      try {
        if (XQ.on && m && typeof m.t === 'string' && (m.t === 'riv_offerta' || m.t === 'riv_stato' || m.t === 'riv_fine')) { ricevi(m, c); return; }
        if (m && m.t === 'start') partita(m, c);
      } catch(e){ try { console.error('[XQ]', e); } catch(_){} }
      return o.apply(this, arguments);
    };
    f.__xq = 1; f.__xqOrig = o; W[nome] = f;
  }
  avvolgi('rtdOnMsg', 'rtd'); avvolgi('tkOnMsg', 'tk'); avvolgi('gldOnMsg', 'gld'); avvolgi('twrOnMsg', 'twr');
  D.addEventListener('click', function(ev){
    if (!XQ.on) return;
    var b = ev.target && ev.target.closest && ev.target.closest('button'); if (!b) return;
    var oc = (b.getAttribute('onclick') || '').replace(/\s+/g, ''), c = DA_ONCLICK[oc];
    if (!c || !idoneo(c)) return;
    ev.preventDefault(); ev.stopImmediatePropagation();
    try { chiedi(c); } catch(e){ try { console.error('[XQ] chiedi', e); } catch(_){} tornaAlMenu(c); }
  }, true);
  XQ.chiedi = chiedi; XQ.accetta = accetta; XQ.rifiuta = rifiuta; XQ.annulla = annulla; XQ.ricevi = ricevi; XQ.disegna = disegna;
})();
;
(function(){
  'use strict';
  var W = window, D = document;
  if (W.XY) return;
  var XY = W.XY = { on: true, attivo: null, ver: '1511' };
  function L(it, en){ return (W.GB_LANG === 'en') ? en : it; }
  function be(){ try { return BACKEND; } catch(e){ return ''; } }
  function io(){ try { return S.userId || null; } catch(e){ return null; } }
  function nomeMio(){ try { return S.username || 'Player'; } catch(e){ return 'Player'; } }
  function fx(n){ try { if (W.GBX && GBX.fx) GBX.fx(n); } catch(e){} }
  function esc(s){ return String(s == null ? '' : s).replace(/[<>&"']/g, function(c){ return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function eurLbl(e){ e = Number(e) || 0; return '€' + ((Math.abs(e - Math.round(e)) < 0.005) ? Math.round(e) : e.toFixed(2)); }
  function posta(j){ return j.gratis ? L('gratis', 'free') : eurLbl(j.eur); }
  var NOMI = { rr:['Roulette russa','Russian roulette'], rps:['Morra','Rock paper scissors'], bs:['Battaglia navale','Battleship'],
               chess:['Scacchi','Chess'], dice:['Dadi','Dice'], bj:['Blackjack 1v1','Blackjack 1v1'], cards:['Poker duello','Poker duel'] };
  function gioco(m){ var n = NOMI[m]; return n ? L(n[0], n[1]) : String(m || ''); }
  function chiama(path, corpo){
    corpo = corpo || {}; corpo.user_id = io();
    return fetch(be() + path, { method:'POST', headers:{ 'Content-Type':'application/json', 'ngrok-skip-browser-warning':'1' }, body: JSON.stringify(corpo) })
      .then(function(r){
        var ct = (r.headers && r.headers.get && r.headers.get('content-type')) || '';
        if (r.status === 404 && ct.indexOf('json') < 0) { XY.attivo = false; throw new Error('vecchio'); }
        return r.json().then(function(j){ j = j || {}; j._http = r.status; return j; }, function(){ return { _http: r.status }; });
      });
  }
  function saldoDaRisposta(d){
    try { if (d.balances) S.bal = d.balances; } catch(e){}
    try { if (d.btc !== undefined && d.btc !== null) { S.btc = saldoDa(d); refresh(); } } catch(e){}
  }
  var RE = /^\s*dl(Rr|Rps|Bs|Ch)Start\(\s*([0-9.]+)\s*\)\s*;?\s*$/;
  var MODO = { Rr:'rr', Rps:'rps', Bs:'bs', Ch:'chess' };
  function riconosci(b){
    if (!b || !b.closest('#pvp-modal')) return null;
    var oc = b.getAttribute('onclick') || '', m = RE.exec(oc);
    if (m) return { mode: MODO[m[1]], eur: Number(m[2]) || 0, oc: oc };
    if (/^\s*dlPickGame\(\s*['"]dice['"]\s*\)\s*;?\s*$/.test(oc) && b.closest('#dl-outcome, .gbf-in')) return { mode:'dice', eur: 0, oc: oc };
    return null;
  }
  function vecchio(r){ try { (new Function(r.oc))(); } catch(e){ try { console.warn('XY', e); } catch(_){} } }
  function cercaAltro(r, eur){
    if (r.mode === 'dice' && eur > 0 && typeof W.dlBetPick === 'function') { try { dlBetPick('dice', eur); return; } catch(e){} }
    vecchio(r);
  }
  D.addEventListener('click', function(ev){
    if (!XY.on || XY.attivo === false || !io()) return;
    var b = ev.target && ev.target.closest ? ev.target.closest('button') : null;
    var r = riconosci(b); if (!r) return;
    ev.preventDefault(); ev.stopPropagation(); if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    if (XY.busy) return;
    chiedi(r);
  }, true);
  function segna(){ var m = D.getElementById('pvp-modal'); if (!m) return; [].forEach.call(m.querySelectorAll('button[onclick]'), function(b){ if (riconosci(b)) b.classList.add('xy-riv'); }); }
  var F = null, TK = null;
  function foglio(){
    if (F && F.parentNode) return F;
    F = D.createElement('div'); F.id = 'xy-riv'; F.className = 'xy-o'; F.setAttribute('role', 'dialog'); F.setAttribute('aria-modal', 'true');
    F.innerHTML = '<div class="xy-f"></div>';
    D.body.appendChild(F);
    return F;
  }
  function anello(){ return '<div class="xy-an"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="xy-an-f" cx="60" cy="60" r="54"/><circle class="xy-an-p" cx="60" cy="60" r="54"/></svg><b class="xy-an-n">25</b></div>'; }
  function disegna(html, tipo){
    var o = foglio(); o.className = 'xy-o xy-' + (tipo || 'msg');
    o.firstChild.innerHTML = html;
    requestAnimationFrame(function(){ o.classList.add('xy-su'); });
    return o;
  }
  function chiudi(){
    if (TK) { clearInterval(TK); TK = null; }
    if (!F) return; var o = F; o.classList.remove('xy-su');
    setTimeout(function(){ if (o.parentNode && !o.classList.contains('xy-su')) o.parentNode.removeChild(o); if (F === o && !o.parentNode) F = null; }, 260);
    XY.mostra = null;
  }
  function conto(scade, ttl, alFinire){
    if (TK) clearInterval(TK);
    var giro = function(){
      var o = F; if (!o) { clearInterval(TK); TK = null; return; }
      var resta = Math.max(0, (scade - Date.now()) / 1000), n = o.querySelector('.xy-an-n'), p = o.querySelector('.xy-an-p');
      if (n) n.textContent = String(Math.ceil(resta));
      if (p) p.style.strokeDashoffset = String(339.3 * (1 - resta / Math.max(1, ttl)));
      if (resta <= 0) { clearInterval(TK); TK = null; if (alFinire) alFinire(); }
    };
    TK = setInterval(giro, 200); giro();
  }
  function tasti(lista){
    return '<div class="xy-tasti">' + lista.map(function(t, i){ return '<button type="button" class="xy-b ' + (t[2] || (i ? 'xy-b2' : 'xy-b1')) + '" data-i="' + i + '">' + esc(t[0]) + '</button>'; }).join('') + '</div>';
  }
  function lega(lista){
    var o = F; if (!o) return;
    [].forEach.call(o.querySelectorAll('.xy-b'), function(b){ b.onclick = function(){ var t = lista[+b.getAttribute('data-i')]; if (t && t[1]) t[1](); }; });
  }
  var MIO = null;
  function chiedi(r){
    XY.busy = true; fx('tap');
    chiama('/duel/riv_chiedi', { mode: r.mode, username: nomeMio() }).then(function(j){
      XY.busy = false;
      if (j.status === 'attesa') { attesa(r, j); return; }
      if (j.status === 'matched' || j.status === 'done') { entra(j, j.bet_eur); return; }
      var nome = j.nome || L('L’avversario', 'Your opponent');
      if (j.riv === 'saldo') { esito(r, j, L('Saldo insufficiente', 'Not enough balance'), L('Per la rivincita servono ', 'The rematch needs ') + eurLbl(r.eur) + L('. Nessun addebito.', '. Nothing was charged.'), false); return; }
      if ((j.riv === 'in_partita' || j.riv === 'in_coda') && j.chi === 'altro') { esito(r, j, L(nome + ' sta giocando un’altra partita', nome + ' is in another match'), L('Non gli è arrivato nessun invito. Nessun addebito.', 'No invite was sent. Nothing was charged.'), true); return; }
      if ((j.riv === 'in_partita' || j.riv === 'in_coda') && j.chi === 'tu') { esito(r, j, L('Sei già in un’altra partita', 'You are already in another match'), L('Finiscila o esci dalla coda, poi riprova.', 'Finish it or leave the queue, then try again.'), false); return; }
      if (j.riv === 'suo') { poll(true); return; }
      if (j.riv === 'spento') { try { toast(j.error || L('Gioco non disponibile', 'Game unavailable'), 'err', 2600); } catch(e){} return; }
      vecchio(r);
    }).catch(function(){ XY.busy = false; vecchio(r); });
  }
  function attesa(r, j){
    MIO = { rid: j.rid, r: r, nome: j.nome, eur: j.eur, gratis: !!j.gratis, ttl: j.ttl || 25, scade: Date.now() + (j.resta || 25) * 1000, mode: j.mode };
    var sotto = j.fuori_app
      ? L(esc(j.nome) + ' non è nella mini app: gli è arrivato un messaggio del bot per accettare.', esc(j.nome) + ' isn’t in the mini app: the bot sent them a message to accept.')
      : L('Gli è arrivato l’invito. La posta si blocca solo se accetta.', 'The invite has reached them. Stakes are locked only if they accept.');
    var LA = [[L('Annulla', 'Cancel'), annulla, 'xy-b2']];
    disegna(anello()
      + '<div class="xy-k">' + L('Rivincita chiesta', 'Rematch requested') + '</div>'
      + '<div class="xy-t">' + L('Aspetto ', 'Waiting for ') + esc(j.nome) + '</div>'
      + '<div class="xy-p"><span>' + esc(gioco(j.mode)) + '</span><i></i><span>' + esc(posta(j)) + '</span></div>'
      + '<div class="xy-s">' + sotto + '</div>'
      + tasti(LA), 'attesa');
    lega(LA);
    fx('open');
    conto(MIO.scade, MIO.ttl, function(){ poll(true); });
    poll(true);
  }
  function annulla(){
    var m = MIO; MIO = null; chiudi(); fx('back');
    chiama('/duel/riv_annulla', {}).catch(function(){});
    return m;
  }
  function esito(r, j, titolo, sotto, puoiCercare){
    MIO = null; fx('err');
    var eur = (j && j.eur != null) ? j.eur : r.eur, gratis = !!(j && j.gratis);
    var lista = [];
    if (puoiCercare && !gratis && eur > 0) lista.push([L('Cerca un altro avversario · ', 'Find another opponent · ') + eurLbl(eur), function(){ chiudi(); cercaAltro(r, eur); }]);
    lista.push([L('Chiudi', 'Close'), chiudi, lista.length ? 'xy-b2' : 'xy-b1']);
    disegna('<div class="xy-segno xy-segno-no" aria-hidden="true"></div>'
      + '<div class="xy-t">' + esc(titolo) + '</div>'
      + (j && j.mode ? '<div class="xy-p"><span>' + esc(gioco(j.mode)) + '</span><i></i><span>' + esc(posta(j)) + '</span></div>' : '')
      + '<div class="xy-s">' + esc(sotto) + '</div>' + tasti(lista), 'esito');
    lega(lista);
  }
  function mioFinito(m){
    var r = MIO ? MIO.r : { mode: m.mode, eur: m.eur, oc: '' }, nome = m.nome || L('L’avversario', 'Your opponent');
    if (m.res && (m.stato === 'matched' || m.stato === 'done')) { MIO = null; chiudi(); entra(m.res, m.eur); return; }
    if (!MIO) return;
    var nessun = L('Nessun addebito: la tua posta è rimasta sul saldo.', 'Nothing was charged: your stake stayed in your balance.');
    if (m.stato === 'rifiutata') esito(r, m, L(nome + ' ha detto no', nome + ' said no'), nessun, true);
    else if (m.stato === 'scaduta') esito(r, m, L(nome + ' non ha risposto', nome + ' didn’t answer'), nessun, true);
    else if (m.stato === 'fallita') {
      if (m.motivo === 'saldo') esito(r, m, m.chi === 'tu' ? L('Saldo insufficiente', 'Not enough balance') : L(nome + ' non ha più saldo per questa posta', nome + ' no longer has enough balance'), nessun, m.chi !== 'tu');
      else if (m.motivo === 'in_partita' || m.motivo === 'in_coda') esito(r, m, m.chi === 'tu' ? L('Sei già in un’altra partita', 'You are already in another match') : L(nome + ' è entrato in un’altra partita', nome + ' joined another match'), nessun, m.chi !== 'tu');
      else esito(r, m, L('La rivincita non è partita', 'The rematch didn’t start'), L('Le poste sono rimaste sul saldo.', 'Stakes stayed in the balances.'), true);
    }
  }
  var VISTI = {}, SUO = null;
  var NO_QUI = { arc:1, tank:1, glad:1, turf:1, crash:1, grun:1 };
  function posso(){
    try { if (NO_QUI[CUR]) return false; } catch(e){}
    if (D.getElementById('vsx')) return false;
    var ov = D.getElementById('pvp-overlay'), mm = D.getElementById('pvp-modal');
    if (ov && ov.classList.contains('show') && mm && !mm.querySelector('.pvp-result') && !mm.querySelector('.tw-radar')) return false;
    return true;
  }
  function invito(v){
    SUO = { rid: v.rid, v: v, scade: Date.now() + (v.resta || 25) * 1000 };
    VISTI[v.rid] = 1;
    var lista = [[L('Accetta', 'Accept'), accetta, 'xy-b1'], [L('No', 'No'), rifiuta, 'xy-b2']];
    disegna(anello()
      + '<div class="xy-k">' + L('Rivincita', 'Rematch') + '</div>'
      + '<div class="xy-t">' + L(esc(v.nome) + ' vuole la rivincita', esc(v.nome) + ' wants a rematch') + '</div>'
      + '<div class="xy-p"><span>' + esc(gioco(v.mode)) + '</span><i></i><span>' + esc(posta(v)) + '</span></div>'
      + '<div class="xy-s">' + (v.gratis ? L('Partita gratis, nessun euro in gioco.', 'Free match, no money at stake.')
                                          : L('La posta di ', 'Your stake of ') + eurLbl(v.eur) + L(' si blocca solo quando la partita parte.', ' is locked only when the match starts.')) + '</div>'
      + tasti(lista), 'invito');
    lega(lista);
    fx('open'); try { if (W.GBX && GBX.hap) GBX.hap('medium'); } catch(e){}
    conto(SUO.scade, v.ttl || 25, function(){ if (SUO && SUO.rid === v.rid) { SUO = null; chiudi(); } });
  }
  function accetta(){
    var s = SUO; if (!s || XY.busy) return; XY.busy = true; fx('tap');
    var b = F && F.querySelector('.xy-b1'); if (b) { b.disabled = true; b.textContent = L('Entro…', 'Joining…'); }
    chiama('/duel/riv_rispondi', { rid: s.rid, si: true, username: nomeMio() }).then(function(j){
      XY.busy = false; SUO = null;
      if (j.status === 'matched' || j.status === 'done') { chiudi(); entra(j, s.v.eur); return; }
      var t = L('La rivincita non è partita', 'The rematch didn’t start'), sotto = L('Nessun addebito.', 'Nothing was charged.');
      if (j.motivo === 'saldo') t = L('Saldo insufficiente per ', 'Not enough balance for ') + eurLbl(s.v.eur);
      else if ((j.motivo === 'in_partita' || j.motivo === 'in_coda') && /sei/i.test(j.error || '')) t = L('Sei già in un’altra partita', 'You are already in another match');
      else if (j.motivo === 'in_partita' || j.motivo === 'in_coda') t = L(s.v.nome + ' è entrato in un’altra partita', s.v.nome + ' joined another match');
      else if (j.riv === 'scaduta' || j.riv === 'sparito' || j.riv === 'annullata' || j._http === 410 || j._http === 404) t = L('L’invito non è più valido', 'The invite is no longer valid');
      esito({ mode: s.v.mode, eur: s.v.eur, oc: '' }, s.v, t, sotto, false);
    }).catch(function(){ XY.busy = false; SUO = null; chiudi(); try { toast(L('Errore di rete', 'Network error'), 'err'); } catch(e){} });
  }
  function rifiuta(){
    var s = SUO; SUO = null; chiudi(); fx('back');
    if (s) chiama('/duel/riv_rispondi', { rid: s.rid, si: false }).catch(function(){});
  }
  function entra(res, eur){
    saldoDaRisposta(res);
    try { if (typeof loadBalance === 'function') loadBalance(); } catch(e){}
    if (res.status === 'matched') {
      try { DLRND.bet = (res.bet_eur != null ? res.bet_eur : eur) || 0; } catch(e){}
      try { dlRndEnter(res.game, res); } catch(e){ try { console.warn('XY entra', e); } catch(_){} }
    } else if (res.status === 'done') {
      try { if (CUR !== 'duel') { W._dlEntrando = 1; go('duel'); W._dlEntrando = 0; } } catch(e){}
      try { dlShowResult(res); } catch(e){ try { console.warn('XY dadi', e); } catch(_){} }
    }
  }
  var PT = null, inVolo = false;
  function poll(subito){
    if (PT) { clearTimeout(PT); PT = null; }
    var dopo = function(){ PT = setTimeout(function(){ poll(false); }, MIO ? 1200 : (D.hidden ? 15000 : 4000)); };
    if (!XY.on || XY.attivo === false) return;
    if (!io() || (D.hidden && !MIO) || inVolo) { dopo(); return; }
    inVolo = true;
    chiama('/duel/riv_stato', {}).then(function(j){
      inVolo = false;
      if (j._http === 404 || j._http === 405) { XY.attivo = false; return; }
      if (j.ok) XY.attivo = true;
      var m = j.mio;
      if (m && MIO && m.rid === MIO.rid) {
        if (m.stato === 'attesa') { var sc = Date.now() + (m.resta || 0) * 1000; if (Math.abs(sc - MIO.scade) > 1500) { MIO.scade = sc; conto(sc, MIO.ttl, function(){ poll(true); }); } }
        else mioFinito(m);
      } else if (m && m.res && (m.stato === 'matched' || m.stato === 'done')) mioFinito(m);
      else if (MIO && Date.now() > MIO.scade + 3000)
        mioFinito({ stato:'scaduta', mode: MIO.mode, eur: MIO.eur, gratis: MIO.gratis, nome: MIO.nome });
      var arr = j.in_arrivo || [];
      if (SUO && !arr.some(function(v){ return v.rid === SUO.rid; })) {
        SUO = null; chiudi(); try { toast(L('La rivincita è stata annullata', 'The rematch was cancelled'), 'warn', 2200); } catch(e){}
      }
      if (!SUO && !MIO && !XY.busy && posso()) {
        var nuovo = arr.filter(function(v){ return !VISTI[v.rid] && v.resta > 1; })[0];
        if (nuovo) invito(nuovo);
      }
      dopo();
    }).catch(function(){ inVolo = false; if (XY.attivo !== false) dopo(); });
  }
  D.addEventListener('visibilitychange', function(){ if (!D.hidden) poll(true); });
  function senzaDoppi(){
    var box = D.getElementById('pvp-incoming'); if (!box || XY.attivo === false) return;
    var righe = box.querySelectorAll('.pvp-inc-row'), via = 0;
    [].forEach.call(righe, function(r){ if (r.querySelector('[onclick*="riv:"]')) { r.parentNode.removeChild(r); via++; } });
    if (via && via === righe.length) { box.innerHTML = ''; box.className = ''; }
  }
  function avvia(){
    var inc = D.getElementById('pvp-incoming');
    if (inc && !inc.__xy) { inc.__xy = 1; try { new MutationObserver(senzaDoppi).observe(inc, { childList:true }); } catch(e){} }
    var m = D.getElementById('pvp-modal');
    if (m && !m.__xy) { m.__xy = 1; try { new MutationObserver(segna).observe(m, { childList:true, subtree:true }); } catch(e){} }
    if (!XY.partito && io()) { XY.partito = true; poll(true); }
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', avvia); else avvia();
  var giri = 0, tg = setInterval(function(){ avvia(); if (XY.partito || ++giri > 60) clearInterval(tg); }, 1000);
  XY.poll = poll; XY.chiudi = chiudi;
})();
;
(function(){
  'use strict';
  var ORD = (typeof ROULETTE_ORDER !== 'undefined') ? ROULETTE_ORDER : [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
  var ROSSI = (typeof RL_RED !== 'undefined') ? RL_RED : [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
  var STEP = 360 / 37;
  var FONT = '-apple-system,BlinkMacSystemFont,"SF Pro Display","Inter Tight","Inter",system-ui,sans-serif';
  var NOMI = { 1:'Anello', 2:'Fumé', 3:'Numeri', 4:'Ghiera' };
  function col(n){ return n === 0 ? 'green' : (ROSSI.indexOf(n) >= 0 ? 'red' : 'black'); }
  function dpr(){ return Math.min(2.5, window.devicePixelRatio || 1); }
  function hap(t){ try { if (window.GBX && GBX.hap) GBX.hap(t); } catch(e){} }
  function mk(tag, cls, padre){ var e = document.createElement(tag); if (cls) e.className = cls; if (padre) padre.appendChild(e); return e; }
  function tela(padre, cls, D){ var c = mk('canvas', cls, padre); var S = Math.round(D * dpr()); c.width = c.height = S; var x = c.getContext('2d'); x.translate(S / 2, S / 2); return { c:c, x:x, R:S / 2 }; }
  var C = {
    red:'#e2566a', redT:'#f08a99', green:'#2fb894', greenT:'#7fdcc2', blackT:'rgba(255,255,255,.78)', viola:'#8b83f0'
  };
  var FABBRICA = {};
  FABBRICA[1] = function(el, D){
    var rot = mk('div', 'xr-rot', el), t = tela(rot, 'xr-cv', D), x = t.x, R = t.R, a, i, n, c;
    x.beginPath(); x.arc(0, 0, R * .985, 0, Math.PI * 2); x.arc(0, 0, R * .79, 0, Math.PI * 2, true);
    var g = x.createLinearGradient(-R, -R, R, R); g.addColorStop(0, 'rgba(255,255,255,.10)'); g.addColorStop(.5, 'rgba(255,255,255,.035)'); g.addColorStop(1, 'rgba(255,255,255,.07)');
    x.fillStyle = g; x.fill();
    x.lineWidth = Math.max(1, R * .006);
    x.strokeStyle = 'rgba(255,255,255,.30)'; x.beginPath(); x.arc(0, 0, R * .985, 0, Math.PI * 2); x.stroke();
    x.strokeStyle = 'rgba(255,255,255,.14)'; x.beginPath(); x.arc(0, 0, R * .79, 0, Math.PI * 2); x.stroke();
    for (i = 0; i < 37; i++) {
      n = ORD[i]; c = col(n); a = i * STEP * Math.PI / 180;
      x.save(); x.rotate(a);
      x.fillStyle = c === 'red' ? C.red : (c === 'green' ? C.green : 'rgba(255,255,255,.34)');
      var w = R * .028; x.beginPath();
      if (x.roundRect) x.roundRect(-w / 2, -R * .875, w, R * .07, w / 2); else x.rect(-w / 2, -R * .875, w, R * .07);
      x.fill();
      x.fillStyle = c === 'red' ? C.redT : (c === 'green' ? C.greenT : C.blackT);
      x.font = '400 ' + Math.round(R * .072) + 'px ' + FONT; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(String(n), 0, -R * .93);
      x.restore();
    }
    var ball = mk('i', 'xr-ball', el);
    var rOut = .985, rIn = .84;
    return {
      posa: function(W, B, rn, vis){
        rot.style.transform = 'rotate(' + W.toFixed(2) + 'deg)';
        var rr = (rIn + (rn - .535) / .28 * (rOut - rIn)) * D / 2;
        ball.style.transform = 'rotate(' + B.toFixed(2) + 'deg) translateY(' + (-rr).toFixed(1) + 'px)';
      }
    };
  };
  FABBRICA[2] = function(el, D){
    var rot = mk('div', 'xr-rot', el), t = tela(rot, 'xr-cv', D), x = t.x, R = t.R, i, n, c, a0, a1, s = Math.PI * 2 / 37;
    var g = x.createRadialGradient(0, 0, R * .2, 0, 0, R * .97);
    g.addColorStop(0, 'rgba(255,255,255,.05)'); g.addColorStop(.6, 'rgba(255,255,255,.03)'); g.addColorStop(1, 'rgba(255,255,255,.07)');
    x.beginPath(); x.arc(0, 0, R * .97, 0, Math.PI * 2); x.fillStyle = g; x.fill();
    for (i = 0; i < 37; i++) {
      n = ORD[i]; c = col(n); a0 = -Math.PI / 2 + (i - .5) * s; a1 = a0 + s;
      var sg = x.createRadialGradient(0, 0, R * .56, 0, 0, R * .93);
      if (c === 'red') { sg.addColorStop(0, 'rgba(226,86,106,.16)'); sg.addColorStop(1, 'rgba(226,86,106,.58)'); }
      else if (c === 'green') { sg.addColorStop(0, 'rgba(47,184,148,.14)'); sg.addColorStop(1, 'rgba(47,184,148,.5)'); }
      else { sg.addColorStop(0, 'rgba(0,0,0,.25)'); sg.addColorStop(1, 'rgba(8,8,10,.85)'); }
      x.beginPath(); x.arc(0, 0, R * .93, a0, a1); x.arc(0, 0, R * .56, a1, a0, true); x.closePath(); x.fillStyle = sg; x.fill();
      x.save(); x.rotate(i * s); x.fillStyle = 'rgba(255,255,255,.92)';
      x.font = '400 ' + Math.round(R * .068) + 'px ' + FONT; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(String(n), 0, -R * .85); x.restore();
    }
    x.strokeStyle = 'rgba(0,0,0,.75)'; x.lineWidth = Math.max(1, R * .008);
    for (i = 0; i < 37; i++) { a0 = -Math.PI / 2 + (i - .5) * s; x.beginPath(); x.moveTo(Math.cos(a0) * R * .56, Math.sin(a0) * R * .56); x.lineTo(Math.cos(a0) * R * .93, Math.sin(a0) * R * .93); x.stroke(); }
    x.lineWidth = Math.max(1, R * .006);
    x.strokeStyle = 'rgba(255,255,255,.26)'; x.beginPath(); x.arc(0, 0, R * .97, 0, Math.PI * 2); x.stroke();
    x.strokeStyle = 'rgba(255,255,255,.16)'; x.beginPath(); x.arc(0, 0, R * .56, 0, Math.PI * 2); x.stroke();
    x.strokeStyle = 'rgba(255,255,255,.08)'; x.beginPath(); x.arc(0, 0, R * .93, 0, Math.PI * 2); x.stroke();
    for (var k = 0; k < 2; k++) {
      x.save(); x.rotate(k * Math.PI + .5);
      var lg = x.createLinearGradient(-R * .3, -R, R * .3, -R);
      lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(.5, 'rgba(255,255,255,.07)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
      x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, R * .97, -Math.PI / 2 - .32, -Math.PI / 2 + .32); x.closePath(); x.fillStyle = lg; x.fill(); x.restore();
    }
    mk('i', 'xr-hub', el); mk('i', 'xr-pin', el);
    var ball = mk('i', 'xr-ball', el);
    var rOut = .955, rIn = .70;
    return {
      posa: function(W, B, rn, vis){
        rot.style.transform = 'rotate(' + W.toFixed(2) + 'deg)';
        var rr = (rIn + (rn - .535) / .28 * (rOut - rIn)) * D / 2;
        ball.style.transform = 'rotate(' + B.toFixed(2) + 'deg) translateY(' + (-rr).toFixed(1) + 'px)';
      }
    };
  };
  FABBRICA[3] = function(el, D){
    var rot = mk('div', 'xr-rot', el), r = D / 2 * .895, sp = [], i, n, s;
    var fs = Math.max(10.5, Math.round(D * .043 * 2) / 2);
    el.style.fontSize = fs + 'px';
    for (i = 0; i < 37; i++) {
      n = ORD[i]; s = mk('b', 'xr-n xr-' + col(n), rot); s.textContent = n;
      s._t = 'rotate(' + (i * STEP).toFixed(3) + 'deg) translateY(' + (-r).toFixed(1) + 'px)';
      s.style.transform = s._t + ' scale(1)';
      sp.push(s);
    }
    mk('i', 'xr-lente', el); mk('i', 'xr-velo', el);
    var ind = mk('i', 'xr-ind', el);
    var vinto = null;
    return {
      posa: function(W, B){ rot.style.transform = 'rotate(' + (W - B).toFixed(2) + 'deg)'; },
      tacca: function(){ if (ind.animate) ind.animate([{ transform:'translateX(-50%) rotate(14deg)' }, { transform:'translateX(-50%) rotate(0)' }], { duration:140, easing:'cubic-bezier(.2,.8,.3,1)' }); },
      ferma: function(idx){ this.via(); vinto = sp[idx] || null; if (vinto) { vinto.classList.add('xr-vince'); vinto.style.transform = vinto._t + ' scale(1.45)'; el.classList.add('xr-ha-vinto'); } },
      via: function(){ if (vinto) { vinto.classList.remove('xr-vince'); vinto.style.transform = vinto._t + ' scale(1)'; } vinto = null; el.classList.remove('xr-ha-vinto'); }
    };
  };
  FABBRICA[4] = function(el, D){
    mk('i', 'xr-soleil', el);
    var rot = mk('div', 'xr-rot', el), t = tela(rot, 'xr-cv', D), x = t.x, R = t.R, i, n, c, a, k;
    x.strokeStyle = 'rgba(255,255,255,.22)'; x.lineWidth = Math.max(1, R * .005);
    for (i = 0; i < 37 * 4; i++) {
      if (i % 4 === 0) continue;
      a = (i / 4) * STEP * Math.PI / 180 - Math.PI / 2 - STEP * Math.PI / 360;
      x.beginPath(); x.moveTo(Math.cos(a) * R * .935, Math.sin(a) * R * .935); x.lineTo(Math.cos(a) * R * .965, Math.sin(a) * R * .965); x.stroke();
    }
    for (i = 0; i < 37; i++) {
      n = ORD[i]; c = col(n); x.save(); x.rotate(i * STEP * Math.PI / 180);
      x.fillStyle = c === 'red' ? C.red : (c === 'green' ? C.green : 'rgba(255,255,255,.85)');
      var w = R * .022; x.beginPath();
      if (x.roundRect) x.roundRect(-w / 2, -R * .965, w, R * .085, w / 2); else x.rect(-w / 2, -R * .965, w, R * .085);
      x.fill();
      x.fillStyle = c === 'red' ? C.redT : (c === 'green' ? C.greenT : 'rgba(255,255,255,.82)');
      x.font = '300 ' + Math.round(R * .075) + 'px ' + FONT; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(String(n), 0, -R * .79);
      x.restore();
    }
    x.strokeStyle = 'rgba(255,255,255,.12)'; x.lineWidth = Math.max(1, R * .005);
    x.beginPath(); x.arc(0, 0, R * .70, 0, Math.PI * 2); x.stroke();
    mk('i', 'xr-cassa', el); mk('i', 'xr-data', el);
    var hand = mk('i', 'xr-lancetta', el); mk('i', 'xr-coda', hand); mk('i', 'xr-cap', el);
    return {
      posa: function(W, B){
        rot.style.transform = 'rotate(' + W.toFixed(2) + 'deg)';
        hand.style.transform = 'rotate(' + B.toFixed(2) + 'deg)';
      }
    };
  };
  function Ruota(n, host, D){
    n = FABBRICA[n] ? n : 1;
    var el = mk('div', 'xr-ruota xr-r' + n);
    el.style.setProperty('--d', D + 'px');
    host.insertBefore(el, host.firstChild);
    var me = FABBRICA[n](el, D);
    me.el = el; me.n = n; me.D = D;
    me.palla = function(v){ el.classList.toggle('xr-senza', !v); };
    me.togli = function(){ if (el.parentNode) el.parentNode.removeChild(el); };
    return me;
  }
  var XR = window.XR = window.XR || {};
  XR.Ruota = Ruota; XR.NOMI = NOMI; XR.STEP = STEP; XR.ORD = ORD; XR.col = col;
  var scr = document.getElementById('roulette'), wh = document.getElementById('rl4-wheel');
  if (!scr || !wh || typeof RL === 'undefined') return;
  function scelta(){
    var q = (location.search.match(/[?&]ruota=([1-4])/) || [])[1];
    if (q) { try { localStorage.setItem('xr_ruota', q); } catch(e){} return +q; }
    var v = 0; try { v = +localStorage.getItem('xr_ruota'); } catch(e){}
    return FABBRICA[v] ? v : 3;
  }
  var N = scelta(), RU = null, giro = null, ultimaTacca = -1;
  scr.classList.add('xr-on');
  var ball0 = document.getElementById('rl4-ball');
  var RX = /rotate\((-?[\d.e]+)deg\)\s*translateY\((-?[\d.e]+)px\)/;
  function stato(){
    var W = (typeof RL.Wnow === 'number' && giro) ? RL.Wnow : (RL.W || 0), B = RL.B || 0, rn = .535;
    var m = ball0 && RX.exec(ball0.style.transform || '');
    if (m) { B = +m[1]; var Rw = (wh.clientWidth || 260) / 2; rn = -m[2] / Rw; }
    return { W:W, B:B, rn:rn, vis: !!(ball0 && !ball0.classList.contains('hide')) };
  }
  function posa(){
    if (!RU) return; var s = stato();
    RU.posa(s.W, s.B, s.rn, s.vis); RU.palla(s.vis);
    return s;
  }
  function costruisci(){
    var D = wh.clientWidth; if (!D) return;
    if (RU && RU.D === D && RU.n === N) { posa(); return; }
    if (RU) RU.togli();
    [1, 2, 3, 4].forEach(function(k){ wh.classList.toggle('xr-w' + k, k === N); });
    RU = Ruota(N, wh, D);
    posa();
  }
  function passo(){
    var A = giro; if (!A) return;
    var s = posa();
    if (s && A.res !== null && !A.landed) {
      var t = (performance.now() - A.t0) / 1000;
      if (t > A.tLand - 1.0) {
        var idx = ((Math.round((s.B - s.W) / STEP) % 37) + 37) % 37;
        if (idx !== ultimaTacca) { if (ultimaTacca >= 0) { hap('sel'); if (RU && RU.tacca) RU.tacca(); } ultimaTacca = idx; }
      }
    }
    if (A.landed && !A.__xr) { A.__xr = 1; if (RU && RU.ferma) RU.ferma(A.idx); wh.classList.add('xr-ferma'); }
    if (A.done) { giro = null; posa(); return; }
    requestAnimationFrame(passo);
  }
  if (typeof window.rl4Anim === 'function') {
    var animVecchia = window.rl4Anim;
    window.rl4Anim = function(){
      var A = animVecchia.apply(this, arguments);
      try {
        costruisci(); if (RU && RU.via) RU.via(); wh.classList.remove('xr-ferma');
        ultimaTacca = -1; var giaGira = !!giro; giro = A;
        if (!giaGira) requestAnimationFrame(passo);
      } catch(e){}
      return A;
    };
  }
  if (ball0 && window.MutationObserver) new MutationObserver(function(){ if (!giro) posa(); }).observe(ball0, { attributes:true, attributeFilter:['class'] });
  if (window.ResizeObserver) new ResizeObserver(function(){ costruisci(); }).observe(wh);
  document.addEventListener('gbx:screen', function(ev){ if (ev.detail && ev.detail.id === 'roulette') costruisci(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ if (RU) { RU.togli(); RU = null; costruisci(); } });
  var grid = document.getElementById('rl4-grid'), chips = document.getElementById('rl4-chips');
  function segnaScelte(){
    if (!grid) return;
    var su = {};
    for (var k in RL.bets) {
      var b = RL.bets[k];
      if (b.type === 'num' || b.type === 'cavallo' || b.type === 'quartina') (b.nums || []).forEach(function(x){ su['n' + x] = 1; });
      else if (b.type === 'green') su.n0 = 1;
      else su['k' + b.type] = 1;
    }
    [].forEach.call(grid.children, function(c){
      var n = c.getAttribute('data-n'), k = c.getAttribute('data-k');
      var on = (n !== null && su['n' + n]) || (k && k !== 'green' && su['k' + k]);
      c.classList.toggle('xr-sel', !!on);
    });
  }
  if (chips && window.MutationObserver) new MutationObserver(segnaScelte).observe(chips, { childList:true });
  XR.ruota = function(n){
    n = +n; if (!FABBRICA[n]) return N;
    N = n; try { localStorage.setItem('xr_ruota', String(n)); } catch(e){}
    if (RU) { RU.togli(); RU = null; } costruisci();
    return N;
  };
  XR.quale = function(){ return N; };
  XR._posa = posa;
})();
;
(function(){
  'use strict';
  if (!window.GBX) return;
  var XW2 = window.XW2 = {};
  function $(id){ return document.getElementById(id); }
  function L(it, en){ return (window.GB_LANG === 'en') ? en : it; }
  XW2.ultimi = function(p, now, sd){
    if (!p || !p.T) return true;
    var u = Math.min(1, Math.max(0, (now - p.t0) / p.T));
    return p.D * Math.pow(1 - u, 4) < sd * 5.5;
  };
  var TINTA = { '1.5':'rgba(255,255,255,.075)', '2':'rgba(255,255,255,.11)', '5':'rgba(139,131,240,.30)', '10':'rgba(170,163,250,.42)', '25':'rgba(242,194,122,.34)' };
  var CIFRA = { '1.5':'rgba(244,244,246,.78)', '2':'rgba(244,244,246,.92)', '5':'#d6d2ff', '10':'#ecebff', '25':'#f6d9a8' };
  function disegna(){
    var W = window.CWH, disco = $('cwh-disco'); if (!W || !disco || !W.segs || !W.segs.length) return;
    var cv = disco.querySelector('canvas.xw2-cv');
    if (!cv) { cv = document.createElement('canvas'); cv.className = 'xw2-cv'; cv.setAttribute('aria-hidden', 'true'); disco.appendChild(cv); }
    var S = disco.offsetWidth || 0; if (S < 50) return;
    var dpr = Math.min(3, window.devicePixelRatio || 1), segs = W.segs, chiave = S + '|' + dpr + '|' + segs.join(',');
    if (cv.__k === chiave) return;
    cv.__k = chiave;
    cv.width = Math.round(S * dpr); cv.height = Math.round(S * dpr);
    cv.style.width = S + 'px'; cv.style.height = S + 'px';
    var g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, S, S);
    var c = S / 2, R = c - 1, n = segs.length, s = Math.PI * 2 / n, ri = R * 0.305, i, a;
    var fondo = g.createRadialGradient(c, c, ri, c, c, R);
    fondo.addColorStop(0, '#0c0c0e'); fondo.addColorStop(0.82, '#141416'); fondo.addColorStop(1, '#1b1b1e');
    g.beginPath(); g.arc(c, c, R, 0, Math.PI * 2); g.fillStyle = fondo; g.fill();
    for (i = 0; i < n; i++) {
      var m = segs[i]; if (!m) continue;
      a = -Math.PI / 2 + i * s;
      g.beginPath(); g.arc(c, c, R, a, a + s); g.arc(c, c, ri, a + s, a, true); g.closePath();
      g.fillStyle = TINTA[String(m)] || TINTA['2']; g.fill();
    }
    g.lineWidth = 1; g.strokeStyle = 'rgba(255,255,255,.075)';
    g.beginPath();
    for (i = 0; i < n; i++) { a = -Math.PI / 2 + i * s;
      g.moveTo(c + Math.cos(a) * ri, c + Math.sin(a) * ri); g.lineTo(c + Math.cos(a) * (R - 1), c + Math.sin(a) * (R - 1)); }
    g.stroke();
    g.beginPath(); g.arc(c, c, R - 0.5, 0, Math.PI * 2); g.lineWidth = 1; g.strokeStyle = 'rgba(255,255,255,.26)'; g.stroke();
    g.beginPath(); g.arc(c, c, ri, 0, Math.PI * 2); g.lineWidth = 1; g.strokeStyle = 'rgba(255,255,255,.10)'; g.stroke();
    var fs = Math.max(10, Math.min(15, R * (n > 30 ? 0.068 : 0.082)));
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '400 ' + fs.toFixed(1) + 'px "Inter Tight","SF Pro Display",system-ui,sans-serif';
    for (i = 0; i < n; i++) {
      var mm = segs[i], am = -Math.PI / 2 + (i + 0.5) * s;
      g.save(); g.translate(c, c); g.rotate(am);
      if (!mm) { g.beginPath(); g.arc(R * 0.84, 0, n > 30 ? 0.9 : 1.2, 0, Math.PI * 2); g.fillStyle = 'rgba(255,255,255,.16)'; g.fill(); }
      else { g.fillStyle = CIFRA[String(mm)] || '#fff'; g.fillText('×' + String(mm), R * 0.71, 0); }
      g.restore();
    }
  }
  XW2.disegna = disegna;
  function foglio(){
    var scr = $('wheel'); if (!scr) return null;
    var f = $('xw2-foglio'); if (f) return f;
    f = document.createElement('div'); f.id = 'xw2-foglio'; f.className = 'xw2-foglio';
    f.innerHTML = '<div class="xw2-velo"></div>' +
      '<div class="xw2-pan" role="dialog" aria-modal="true">' +
        '<i class="xw2-grab"></i>' +
        '<div class="xw2-tit"></div>' +
        '<div class="xw2-sez xw2-s-premi"><div class="xw2-st"></div></div>' +
        '<div class="xw2-sez xw2-s-storia"><div class="xw2-st"></div><div class="xw2-vuoto"></div></div>' +
        '<div class="xw2-sez xw2-s-come"><div class="xw2-st"></div><p class="xw2-txt"></p></div>' +
        '<button class="xw2-chiudi" type="button" data-x-silent></button>' +
      '</div>';
    scr.appendChild(f);
    var tab = $('cwh-tabella'), sto = $('cwh-storia');
    if (tab) f.querySelector('.xw2-s-premi').appendChild(tab);
    if (sto) f.querySelector('.xw2-s-storia').insertBefore(sto, f.querySelector('.xw2-vuoto'));
    function via(){ chiudi(true); }
    f.querySelector('.xw2-velo').addEventListener('click', via);
    f.querySelector('.xw2-grab').addEventListener('click', via);
    f.querySelector('.xw2-chiudi').addEventListener('click', via);
    return f;
  }
  function testiFoglio(f){
    var W = window.CWH || {}, nomi = { LOW:L('basso', 'low'), MEDIUM:L('medio', 'medium'), HIGH:L('alto', 'high') };
    f.querySelector('.xw2-tit').textContent = L('Ruota della fortuna', 'Wheel of fortune');
    f.querySelector('.xw2-s-premi .xw2-st').textContent = L('Premi · rischio ', 'Prizes · ') + (nomi[W.risk] || '') + L('', ' risk');
    f.querySelector('.xw2-s-storia .xw2-st').textContent = L('Ultimi giri', 'Last spins');
    f.querySelector('.xw2-vuoto').textContent = L('Ancora nessun giro.', 'No spins yet.');
    f.querySelector('.xw2-s-come .xw2-st').textContent = L('Come funziona', 'How it works');
    f.querySelector('.xw2-txt').textContent = L(
      'Scegli rischio e puntata, poi tocca Gira. Lo spicchio lo estrae il server: la ruota si ferma lì. Più rischio vuol dire premi più alti e più spicchi vuoti.',
      'Pick risk and bet, then tap Spin. The server draws the slice and the wheel stops on it. Higher risk means bigger prizes and more empty slices.');
    f.querySelector('.xw2-chiudi').textContent = L('Chiudi', 'Close');
  }
  function apri(){
    var f = foglio(); if (!f) return;
    testiFoglio(f);
    try { if (window.XV && XV.regole) XV.regole('wheel'); } catch(e){}
    f.querySelector('.xw2-pan').scrollTop = 0;
    f.classList.add('open');
    GBX.fx('open');
  }
  function chiudi(suono){
    var f = $('xw2-foglio'); if (!f || !f.classList.contains('open')) return;
    f.classList.remove('open');
    if (suono) GBX.fx('back');
  }
  XW2.apri = apri; XW2.chiudi = chiudi;
  function luce(){
    var scena = $('cwh-scena'), perno = $('cwh-perno'); if (!scena || !perno || perno.__xw2) return;
    perno.__xw2 = true;
    var l = document.createElement('i'); l.className = 'xw2-luce'; scena.insertBefore(l, scena.firstChild);
    function guarda(){
      var c = ' ' + perno.className + ' ';
      var vinto = c.indexOf(' vinto ') >= 0 || c.indexOf(' oro ') >= 0;
      scena.classList.toggle('xw2-vinto', vinto);
      scena.classList.toggle('xw2-oro', c.indexOf(' oro ') >= 0);
      scena.classList.toggle('xw2-perso', c.indexOf(' perso ') >= 0);
    }
    try { new MutationObserver(guarda).observe(perno, { attributes:true, attributeFilter:['class'] }); } catch(e){}
    guarda();
  }
  function tasto(){
    var b = $('cwh-gira'); if (!b || b.__xw2) return; b.__xw2 = true;
    function pulisci(){
      var w = document.createTreeWalker(b, NodeFilter.SHOW_TEXT, null), n;
      while ((n = w.nextNode())) if (n.nodeValue.indexOf('↻') >= 0) n.nodeValue = n.nodeValue.replace(/↻\s*/g, '');
    }
    try { new MutationObserver(pulisci).observe(b, { childList:true, characterData:true, subtree:true }); } catch(e){}
    pulisci();
  }
  function pronto(){
    var scr = $('wheel'); if (!scr) return;
    scr.classList.add('xw2-scr');
    foglio(); luce(); tasto();
  }
  function avvolgi(obj, nome, dopo){
    if (!obj || typeof obj[nome] !== 'function' || obj[nome].__xw2) return;
    var f = obj[nome], g = function(){ var r = f.apply(this, arguments); try { dopo.apply(this, arguments); } catch(e){} return r; };
    g.__xw2 = true; obj[nome] = g;
  }
  function ridisegna(){ requestAnimationFrame(function(){ requestAnimationFrame(disegna); }); }
  function agganci(){
    var W = window.CWH; if (!W) return false;
    avvolgi(W, 'enter', function(){ pronto(); chiudi(false); ridisegna(); });
    avvolgi(W, 'rischio', function(){ ridisegna(); var f = $('xw2-foglio'); if (f && f.classList.contains('open')) testiFoglio(f); });
    if (window.XR && typeof XR.info === 'function' && !XR.info.__xw2) {
      var vi = XR.info, ni = function(g){ if (g === 'wheel') { apri(); return; } return vi.apply(this, arguments); };
      ni.__xw2 = true; XR.info = ni;
    }
    if (GBX.sparks && !GBX.sparks.__xw2) {
      var vs = GBX.sparks, ns = function(el){ if (el && el.closest && el.closest('#wheel')) return; return vs.apply(this, arguments); };
      ns.__xw2 = true; GBX.sparks = ns;
    }
    return true;
  }
  var tent = 0;
  (function prova(){ if (agganci() || ++tent > 40) return; setTimeout(prova, 250); })();
  window.addEventListener('load', function(){ setTimeout(agganci, 0); });
  var _rz = null;
  window.addEventListener('resize', function(){ clearTimeout(_rz); _rz = setTimeout(function(){ if (window.CUR === 'wheel' || (typeof CUR !== 'undefined' && CUR === 'wheel')) disegna(); }, 160); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') chiudi(false); });
})();
;
(function(){
  'use strict';
  if (!window.GBX || GBX.scorri) return;
  var UA = navigator.userAgent || '', PLAT = '';
  try { PLAT = (window.Telegram && Telegram.WebApp && Telegram.WebApp.platform) || ''; } catch(e){}
  var IOS = PLAT === 'ios' || /iPhone|iPad|iPod/.test(UA) || (/Macintosh/.test(UA) && navigator.maxTouchPoints > 1);
  var MAC = PLAT === 'macos' || (!IOS && /Macintosh/.test(UA));
  function riduci(){ try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){ return false; } }
  function quieto(){ return GBX.lite() || riduci(); }
  var MOLLA = true; try { if (localStorage.getItem('gbx_molla') === '0') MOLLA = false; } catch(e){}
  var ELENCO = ['#home>.scroll', '#duel>.game-content', '#wn-scroll', '#friends>.game-content', '#fair>.game-content',
                '#profile>.game-content', '#leaderboard>.game-content', '#challenges>.game-content'];
  var PEZZI = '.x-lastra,.x-sv,.x-sez,.xw-sez,.xa-sh,.xa-head,.xw-big';
  var SEZ = '.x-sez,.xw-sez,.xa-sh';
  var DOC = document.documentElement;
  function banda(d, dim){ var s = d < 0 ? -1 : 1; d = Math.abs(d); return s * (1 - 1 / (d * .55 / dim + 1)) * dim; }
  GBX.scorri = function(sc){
    if (!sc || sc.__xs) return; sc.__xs = {};
    var S = sc.__xs, raf = 0, last = sc.scrollTop, vel = 0, lastT = 0;
    sc.classList.add('xs-sc');
    if (!IOS) sc.classList.add('xs-elastico');
    var scr = sc.closest('.screen') || sc.parentNode;
    var pezzi = [], sporco = true, vis = new Set(), io = null;
    function raccogli(){
      sporco = false;
      var tutti = [].slice.call(sc.querySelectorAll(PEZZI)), set = new Set(tutti);
      var nuovi = tutti.filter(function(e){
        for (var p = e.parentElement; p && p !== sc; p = p.parentElement) if (set.has(p)) return false;
        return true;
      });
      pezzi.forEach(function(e){ if (nuovi.indexOf(e) < 0) { if (io) io.unobserve(e); vis.delete(e); if (e.__xsa) { try { e.__xsa.cancel(); } catch(_){} e.__xsa = null; } } });
      nuovi.forEach(function(e){ if (pezzi.indexOf(e) < 0 && io) io.observe(e); });
      pezzi = nuovi;
    }
    if (window.IntersectionObserver) io = new IntersectionObserver(function(es){
      es.forEach(function(en){ var e = en.target;
        if (en.isIntersecting) vis.add(e);
        else vis.delete(e); });
    }, { root:sc, rootMargin:'80px 0px' });
    try { new MutationObserver(function(){ sporco = true; }).observe(sc, { childList:true, subtree:true }); } catch(e){}
    var dito = { su:false, y:0, y0:0, t:0, pull:0, bordo:0 };
    function bordoDi(){ var max = sc.scrollHeight - sc.clientHeight; if (max < 2) return 2; if (sc.scrollTop <= 0) return -1; if (sc.scrollTop >= max - 1) return 1; return 0; }
    var off = 0, ritorno = null;
    function scrivi(o){ off = o; sc.style.translate = Math.abs(o) < .3 ? '' : '0 ' + o.toFixed(1) + 'px'; titoloTira(o); }
    function rilascia(da){
      if (!da) { scrivi(0); return; }
      if (ritorno) ritorno.cancel();
      sc.style.translate = '';
      if (!sc.animate || quieto()) { scrivi(0); return; }
      off = 0;
      ritorno = sc.animate([{ translate:'0 ' + da.toFixed(1) + 'px' }, { translate:'0 0' }], { duration:560, easing:'cubic-bezier(.2,.9,.25,1)' });
      ritorno.onfinish = function(){ ritorno = null; };
      titoloTira(0, true);
    }
    function rimbalza(v){
      if (IOS || quieto() || !sc.animate || dito.su || ritorno || fissoAperto()) return;
      var a = Math.max(-26, Math.min(26, -v * 9));
      if (Math.abs(a) < 4) return;
      ritorno = sc.animate([{ translate:'0 0' }, { translate:'0 ' + a.toFixed(1) + 'px', offset:.32 }, { translate:'0 0' }],
        { duration:620, easing:'cubic-bezier(.25,.8,.3,1)' });
      ritorno.onfinish = function(){ ritorno = null; };
    }
    var tit = null;
    function titoloTira(o, anima){
      if (!tit || !tit.isConnected) tit = sc.querySelector('.xw-big,.xa-h1');
      if (!tit) return;
      var k = o > 0 ? 1 + Math.min(.07, o / 900) : 1;
      if (anima && tit.animate && k === 1 && tit.style.scale) { var da = tit.style.scale; tit.style.scale = ''; tit.animate([{ scale:da }, { scale:'1' }], { duration:560, easing:'cubic-bezier(.2,.9,.25,1)' }); return; }
      tit.style.scale = k === 1 ? '' : k.toFixed(4);
    }
    var fissi = null;
    function cercaFissi(){ fissi = [].filter.call(sc.querySelectorAll('*'), function(e){ return getComputedStyle(e).position === 'fixed'; }); }
    (window.requestIdleCallback || function(f){ setTimeout(f, 1200); })(cercaFissi);
    function fissoAperto(){ if (!fissi) return false; for (var i = 0; i < fissi.length; i++) if (fissi[i].getClientRects().length) return true; return false; }
    sc.addEventListener('touchstart', function(e){
      if (e.touches.length !== 1) return;
      dito.no = fissoAperto();
      dito.su = true; dito.y = dito.y0 = e.touches[0].clientY; dito.x0 = e.touches[0].clientX; dito.t = performance.now();
      dito.pull = 0; dito.bordo = 0; dito.asse = 0;
      if (ritorno) { var cur = parseFloat((getComputedStyle(sc).translate || '0 0').split(' ')[1]) || 0; ritorno.cancel(); ritorno = null; if (cur) scrivi(cur); }
      fermaInerzia();
    }, { passive:true });
    sc.addEventListener('touchmove', function(e){
      if (!dito.su || e.touches.length !== 1) return;
      var y = e.touches[0].clientY, x = e.touches[0].clientX, dy = y - dito.y; dito.y = y;
      if (!dito.asse) { var ax = Math.abs(x - dito.x0), ay = Math.abs(y - dito.y0); if (ax + ay > 6) dito.asse = ax > ay ? 1 : 2; }
      if (IOS || dito.no || dito.asse !== 2) return;
      var b = bordoDi();
      if (dito.pull === 0) {
        if ((b === -1 || b === 2) && dy > 0) dito.bordo = -1;
        else if ((b === 1 || b === 2) && dy < 0) dito.bordo = 1;
        else return;
      }
      dito.pull += dy;
      if ((dito.bordo === -1 && dito.pull <= 0) || (dito.bordo === 1 && dito.pull >= 0)) { dito.pull = 0; dito.bordo = 0; scrivi(0); return; }
      scrivi(banda(dito.pull, S.h || sc.clientHeight || 700));
    }, { passive:true });
    function su(){ if (!dito.su) return; dito.su = false; if (off) rilascia(off); dito.pull = 0; }
    sc.addEventListener('touchend', su, { passive:true });
    sc.addEventListener('touchcancel', su, { passive:true });
    var ruota = 0, ruotaT = 0;
    if (!MAC) sc.addEventListener('wheel', function(e){
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY) || fissoAperto()) return;
      var b = bordoDi(), d = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      if (!((b === -1 || b === 2) && d < 0) && !((b === 1 || b === 2) && d > 0) && !ruota) return;
      if (ritorno) { ritorno.cancel(); ritorno = null; }
      ruota -= d * .5;
      if ((ruota > 0 && b === 1) || (ruota < 0 && b === -1) || b === 0) ruota = 0;
      scrivi(banda(ruota, 520));
      clearTimeout(ruotaT); ruotaT = setTimeout(function(){ var o = off; ruota = 0; rilascia(o); }, 110);
    }, { passive:true });
    function frame(t){
      raf = 0;
      var st = sc.scrollTop, ds = st - last, dt = lastT ? Math.min(3, (t - lastT) / 16.67) : 1; last = st; lastT = t;
      vel = vel * .6 + (ds / Math.max(.5, dt)) * .4;
      titolo(st);
      if (Math.abs(ds) > .1 || dito.su) raf = requestAnimationFrame(frame); else lastT = 0;
    }
    function avvia(){ if (!raf) raf = requestAnimationFrame(frame); }
    function molla(v, yDito){
      if (!MOLLA || quieto() || !sc.animate || DOC.classList.contains('xs2-on')) return;
      if (sporco) raccogli();
      var H = sc.clientHeight || 700;
      vis.forEach(function(e){
        if (e.__xsa) { try { e.__xsa.cancel(); } catch(_){} e.__xsa = null; }
        var r = e.getBoundingClientRect(); if (!r.height) return;
        var w = Math.min(1, Math.abs(r.top + Math.min(r.height, H) / 2 - yDito) / (H * .8));
        var a = Math.max(-9, Math.min(9, v * w * 6.5));
        if (Math.abs(a) < .8) return;
        e.__xsa = e.animate([{ translate:'0 0' }, { translate:'0 ' + a.toFixed(2) + 'px', offset:.2 },
                             { translate:'0 ' + (-a * .2).toFixed(2) + 'px', offset:.58 }, { translate:'0 0' }],
                            { duration:760, easing:'cubic-bezier(.33,.66,.4,1)', composite:'replace' });
        e.__xsa.onfinish = function(){ e.__xsa = null; };
      });
    }
    var big = null, navt = null, tPrima = -1;
    function titolo(st){
      if (!big || !big.isConnected || !big.offsetParent) { var n0 = performance.now(); if (S.tc && n0 - S.tc < 1000) return; S.tc = n0; big = null; var bs = sc.querySelectorAll('.xw-big'); for (var i = 0; i < bs.length; i++) if (bs[i].offsetParent) { big = bs[i]; break; } navt = scr && scr.querySelector('.xw-navt'); }
      if (!big) return; S.tc = 0;
      var k = Math.max(0, Math.min(1, st / 52));
      if (k === tPrima) return; tPrima = k;
      if (quieto()) { big.style.cssText = big.style.cssText.replace(/opacity[^;]*;?|scale[^;]*;?|transition[^;]*;?/g, ''); if (navt) navt.style.cssText = ''; return; }
      big.style.transition = 'none'; big.style.opacity = (1 - k).toFixed(3); if (!off) big.style.scale = (1 - .06 * k).toFixed(4);
      if (navt) { var n = Math.max(0, Math.min(1, (st - 26) / 30)); navt.style.transition = 'none'; navt.style.opacity = n.toFixed(3); navt.style.transform = 'translateY(' + (6 * (1 - n)).toFixed(2) + 'px)'; }
    }
    var tickT = 0;
    if (window.IntersectionObserver) {
      var ioS = new IntersectionObserver(function(es){
        if (!(dito.su || performance.now() - dito.t < 2500) || !scr || !scr.classList.contains('active')) return;
        es.forEach(function(en){
          var n = performance.now(); if (n - tickT < 140) return;
          if (en.boundingClientRect.top < (en.rootBounds ? en.rootBounds.top : 0) + 2) { tickT = n; GBX.hap('sel'); }
        });
      }, { root:sc, rootMargin:'-96px 0px 0px 0px', threshold:[0] });
      var osservaSez = function(){ [].forEach.call(sc.querySelectorAll(SEZ), function(s){ if (!s.__xss) { s.__xss = 1; ioS.observe(s); } }); };
      osservaSez(); setTimeout(osservaSez, 1500); document.addEventListener('gbx:screen', function(){ setTimeout(osservaSez, 300); });
    }
    sc.addEventListener('scroll', function(){
      var n = performance.now();
      if (!dito.su) { var b = bordoDi(); if ((b === -1 && vel < -1.2) || (b === 1 && vel > 1.2)) { if (n - (S.rimb || 0) > 500) { S.rimb = n; rimbalza(vel); } } }
      avvia();
    }, { passive:true });
    var pts = [], lastNative = 0, rafI = 0, mio = false;
    function fermaInerzia(){ cancelAnimationFrame(rafI); rafI = 0; }
    sc.addEventListener('scroll', function(){ if (!mio) lastNative = performance.now(); }, { passive:true });
    sc.addEventListener('touchstart', function(e){ pts = [{ y:e.touches[0].clientY, t:performance.now() }]; }, { passive:true });
    sc.addEventListener('touchmove', function(e){ pts.push({ y:e.touches[0].clientY, t:performance.now() }); if (pts.length > 6) pts.shift(); }, { passive:true });
    sc.addEventListener('touchend', function(){
      var t0 = performance.now(); if (pts.length < 2) return;
      var a = pts[0], b = pts[pts.length - 1]; if (t0 - b.t > 80) return;
      var v = (a.y - b.y) / Math.max(8, b.t - a.t); if (Math.abs(v) < .25) return;
      if (Math.abs(v) > .35) molla(v, b.y);
      setTimeout(function(){
        if (lastNative > t0 + 5) return;
        var lt = performance.now();
        (function step(n){ var d = Math.min(32, n - lt); lt = n;
          mio = true; var prima = sc.scrollTop; sc.scrollTop += v * d; mio = false;
          v *= Math.pow(.955, d / 16);
          if (Math.abs(v) > .02 && sc.scrollTop !== prima) rafI = requestAnimationFrame(step);
          else { rafI = 0; if (sc.scrollTop === prima && Math.abs(v) > .4) rimbalza(v * 16); }
        })(lt);
      }, 70);
    }, { passive:true });
    raccogli();
    return sc;
  };
  GBX.scorri.molla = function(on){ MOLLA = !!on; try { localStorage.setItem('gbx_molla', on ? '1' : '0'); } catch(e){} };
  function cerca(){ ELENCO.forEach(function(s){ var e = document.querySelector(s); if (e) GBX.scorri(e); }); }
  document.addEventListener('gbx:screen', function(){ setTimeout(cerca, 60); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(cerca, 400); });
  else setTimeout(cerca, 400);
  setTimeout(cerca, 2500);
})();
;
(function(){
  'use strict';
  if (!window.GBX || GBX.scorri2) return;
  var DOC = document.documentElement;
  var EFFETTI = { A:1, B:1, C:1, spento:1 };
  var PREDEF = 'B';
  var EFF = PREDEF;
  try { var m0 = localStorage.getItem('gbx_scorri2'); if (EFFETTI[m0]) EFF = m0; } catch(e){}
  function riduci(){ try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){ return false; } }
  function quieto(){ return GBX.lite() || riduci(); }
  function modo(){ return quieto() ? 'spento' : EFF; }
  var HA_VT = typeof window.ViewTimeline === 'function';
  var ELENCO = ['#home>.scroll', '#duel>.game-content', '#wn-scroll', '#friends>.game-content', '#fair>.game-content',
                '#profile>.game-content', '#leaderboard>.game-content', '#challenges>.game-content'];
  var SALTA = '.xw-big,.xa-h1,.xh-wallet,.xs2-luce,.x-fianco,.x-rifl,.x-glint,.x-amb,script,style,template';
  var TITOLI = '.x-sez,.xa-sh,.xw-sez,.section-ttl';
  var VETRO = '.x-lastra,.x-gruppo';
  var NO_LUCE = '#home .xh-tile,#home .xh-run,#home .xh-free-g';
  var A_G = 18, A_K = 10, A_P = 190;
  var B_ANG = 20, B_SC = .87, B_OP = .26;
  function parB(K){ return (K && K.sc && K.sc.closest && K.sc.closest('#duel')) ? { ang:5, sc:.985, op:.9 } : { ang:B_ANG, sc:B_SC, op:B_OP }; }
  var C_DA = 84, C_MS = 640, C_RIT = 52, C_AGG = 46;
  var CONT = [], raf = 0, lastT = 0;
  function assoluto(e){ var y = 0; while (e) { y += e.offsetTop; e = e.offsetParent; } return y; }
  function sinistra(e){ var x = 0; while (e) { x += e.offsetLeft; e = e.offsetParent; } return x; }
  function contieneFisso(K, e){ for (var i = 0; i < K.fissi.length; i++) if (e.contains(K.fissi[i])) return true; return false; }
  function raccogli(K, t){
    if (!K.sc.isConnected || !K.sc.clientHeight || !K.sc.getClientRects().length) { K.sporco = true; return; }
    K.sporco = false; K.tc = t || performance.now();
    var sc = K.sc, H = sc.clientHeight || 700, mod = modo(), out = [];
    if (!K.fissi) K.fissi = [];
    (function giu(p, liv){
      for (var e = p.firstElementChild; e; e = e.nextElementSibling) {
        if (e.matches(SALTA)) continue;
        var h = e.offsetHeight; if (!h || !e.getClientRects().length) continue;
        var cs = getComputedStyle(e), pos = cs.position;
        if (pos === 'fixed') { if (K.fissi.indexOf(e) < 0) K.fissi.push(e); continue; }
        if (pos === 'sticky' || pos === 'absolute') continue;
        if (cs.display === 'contents') { giu(e, liv); continue; }
        var figli = 0, hmax = 0; for (var c = e.firstElementChild; c; c = c.nextElementSibling) { var hc = c.offsetHeight; if (hc > 16) figli++; if (hc > hmax) hmax = hc; }
        var intero = mod === 'A' && e.matches('.x-gruppo');
        if (h > H * .6 && (figli >= 2 || hmax > H * .6) && !intero && liv < 5) { giu(e, liv + 1); continue; }
        if (h < 14 || contieneFisso(K, e)) continue;
        out.push(e);
      }
    })(sc, 0);
    var base = assoluto(sc) + (sc.clientTop || 0);
    var vecchi = K.u, mappa = new Map(); vecchi.forEach(function(u){ mappa.set(u.el, u); });
    K.u = out.map(function(e){
      var u = mappa.get(e) || { el:e, ty:0, s:1, w:0, fuori:1, fuoriT:0 };
      mappa.delete(e);
      u.off = assoluto(e) - base; u.h = e.offsetHeight; u.tit = e.matches(TITOLI);
      return u;
    });
    mappa.forEach(function(u){ pulisci(u); });
    K.H = H; K.pt = parseFloat(getComputedStyle(sc).paddingTop) || 0;
    K.iB = sottoBarra(sc);
    if (mod === 'B') K.u.forEach(function(u){ ruotaSu(K, u); });
    coda(K, mod);
  }
  function sottoBarra(sc){
    var n = document.querySelector('.bnav');
    if (n && document.body.classList.contains('gb-nav-on') && n.getClientRects().length) {
      var r = n.getBoundingClientRect(), s = sc.getBoundingClientRect();
      if (r.top < s.bottom) return Math.max(24, Math.round(s.bottom - r.top + 8));
    }
    return 24;
  }
  function coda(K, mod){
    var sc = K.sc, era = K.coda || 0, n = 0;
    if (mod === 'B' && K.u.length && !(sc.closest && sc.closest('#duel'))) {
      var u = K.u.reduce(function(a, b){ return b.off + b.h > a.off + a.h ? b : a; });
      var Hv = Math.max(200, K.H - K.pt - K.iB), RB = Math.min(420, Hv * .5);
      var alto = sc.scrollHeight - era;
      if (alto - K.H > 4) n = Math.max(0, Math.ceil(u.off + K.iB + RB + 2 - alto));
    }
    if (Math.abs(n - era) < 1) return;
    K.coda = n;
    if (n) sc.style.setProperty('--xs2-coda', n + 'px'); else sc.style.removeProperty('--xs2-coda');
  }
  function pulisci(u){
    var s = u.el.style;
    if (u.w) { s.translate = ''; s.scale = ''; s.opacity = ''; s.rotate = ''; u.w = 0; u.ty = 0; u.s = 1; }
    if (u.anB) { try { u.anB.cancel(); } catch(e){} u.anB = null; }
    if (u.anL) { try { u.anL.cancel(); } catch(e){} u.anL = null; }
    if (u.anO) { try { u.anO.cancel(); } catch(e){} u.anO = null; }
    if (u.anC) { try { u.anC.cancel(); } catch(e){} u.anC = null; }
    if (u.og) { u.el.style.transformOrigin = ''; u.og = 0; }
    if (u.luce) { var lw = u.luce.parentNode; if (lw && lw.parentNode) lw.parentNode.removeChild(lw); u.luce = null; }
    u.bH = 0;
  }
  function luce(u){
    if (u.luce || !u.el.matches(VETRO)) return u.luce;
    if (u.el.matches(NO_LUCE)) return null;
    var gia = [].filter.call(u.el.children, function(c){ return c.classList && c.classList.contains('xs2-luce'); });
    if (gia.length) { for (var i = 1; i < gia.length; i++) gia[i].remove(); u.luce = gia[0].firstChild; return u.luce; }
    var l = document.createElement('i'); l.className = 'xs2-luce'; l.setAttribute('aria-hidden', 'true'); l.innerHTML = '<i></i>';
    u.el.appendChild(l); u.luce = l.firstChild; return u.luce;
  }
  function corsaB(K, h, off){
    var H = K.H, tot = H + h, iT = K.pt, iB = K.iB || 90, Hv = Math.max(200, H - iT - iB);
    var RB = Math.min(420, Hv * .5), RT = Math.min(300, Hv * .4);
    if (off != null) RT = Math.max(24, Math.min(RT, off + h - iT - 4));
    var t0 = iB / tot, t1 = (iB + RB) / tot, t2 = (H - (iT + RT - h)) / tot, t3 = (H - iT + h) / tot;
    if (t1 > t2) { var m = (t1 + t2) / 2; t1 = t2 = m; }
    var cl = function(x){ return Math.max(0, Math.min(1, x)); };
    return { t0:cl(t0), t1:cl(t1), t2:cl(t2), t3:cl(t3), tot:tot, mid:iT + Hv / 2 };
  }
  function ruotaSu(K, u){
    var H = K.H, h = u.h, firma = H + '/' + h + '/' + K.pt + '/' + Math.round(Math.min(u.off, 400));
    if (u.anB && u.bH === firma) return;
    if (u.anB) { try { u.anB.cancel(); } catch(e){} u.anB = null; }
    if (u.anO) { try { u.anO.cancel(); } catch(e){} u.anO = null; }
    if (u.anL) { try { u.anL.cancel(); } catch(e){} u.anL = null; }
    u.bH = firma;
    var c = corsaB(K, h, u.off);
    var P = parB(K), B_OP = P.op;
    var ang = h > H * .45 ? P.ang * .4 : P.ang;
    var bordo = function(seg){ return 'perspective(900px) rotateX(' + (seg * ang).toFixed(1) + 'deg) scale(' + P.sc + ')'; };
    var piena = 'perspective(900px) rotateX(0deg) scale(1)';
    var w = u.el.offsetWidth, W = K.sc.clientWidth || 390;
    if (w && w < W * .8) { var x = sinistra(u.el) - sinistra(K.sc); u.el.style.transformOrigin = (W / 2 - x).toFixed(0) + 'px 50%'; u.og = 1; }
    var l = luce(u);
    if (!HA_VT || !u.el.animate) return;
    try {
      var vt = new ViewTimeline({ subject:u.el, axis:'block' });
      var ks = [{ offset:0, transform:bordo(-1), opacity:B_OP }];
      if (c.t0 > 0) ks.push({ offset:c.t0, transform:bordo(-1), opacity:B_OP });
      ks[ks.length - 1].easing = 'cubic-bezier(.4,0,.5,1)';
      ks.push({ offset:c.t1, transform:piena, opacity:1 });
      if (c.t2 > c.t1) ks.push({ offset:c.t2, transform:piena, opacity:1 });
      ks[ks.length - 1].easing = 'cubic-bezier(.5,0,.6,1)';
      ks.push({ offset:c.t3, transform:bordo(1), opacity:B_OP });
      if (c.t3 < 1) ks.push({ offset:1, transform:bordo(1), opacity:B_OP });
      var kT = ks.map(function(k){ var o = { offset:k.offset, transform:k.transform }; if (k.easing) o.easing = k.easing; return o; });
      var kO = ks.map(function(k){ var o = { offset:k.offset, opacity:k.opacity }; if (k.easing) o.easing = k.easing; return o; });
      u.anB = u.el.animate(kT, { timeline:vt, fill:'both', composite:'add' });
      u.anO = u.el.animate(kO, { timeline:vt, fill:'both' });
      if (l) {
        var a = (c.mid - H) / h, b = (c.mid + h) / h;
        u.anL = l.animate([{ translate:'0 ' + ((a - .5) * 100).toFixed(1) + '%' }, { translate:'0 ' + ((b - .5) * 100).toFixed(1) + '%' }],
                          { timeline:vt, fill:'both' });
      }
    } catch(e){ HA_VT = false; }
  }
  function passoB(K, st){
    var H = K.H;
    for (var i = 0; i < K.u.length; i++) {
      var u = K.u[i], y = u.off - st;
      if (y > H + 40 || y + u.h < -40) { if (u.w) { u.el.style.scale = ''; u.el.style.opacity = ''; u.w = 0; } continue; }
      var c = corsaB(K, u.h, u.off), t = (H - y) / c.tot, k = 0;
      if (t < c.t1) k = t <= c.t0 ? 1 : 1 - (t - c.t0) / Math.max(.001, c.t1 - c.t0);
      else if (t > c.t2) k = t >= c.t3 ? 1 : (t - c.t2) / Math.max(.001, c.t3 - c.t2);
      k = k * k * (3 - 2 * k);
      var P = parB(K), s = 1 - (1 - P.sc) * k, o = 1 - (1 - P.op) * k;
      u.el.style.scale = s.toFixed(4) + ' ' + (s - .07 * k).toFixed(4);
      u.el.style.opacity = o.toFixed(3); u.w = 1;
      if (u.luce) { var rel = (c.mid - y) / u.h; u.luce.style.translate = '0 ' + ((rel - .5) * 100).toFixed(1) + '%'; }
    }
  }
  function passoA(K, st, dt){
    var meta = Math.max(-A_G, Math.min(A_G, K.v * A_K));
    if (performance.now() - K.mossoT > 70) meta = 0;
    var k = 210, c = 2 * Math.sqrt(k) * .5;
    var acc = k * (meta - K.s) - c * K.sv;
    K.sv += acc * dt; K.s += K.sv * dt;
    var a = Math.abs(K.s), H = K.H, yc = H / 2, fermo = a < .04 && Math.abs(K.sv) < .05 && meta === 0;
    if (fermo) K.s = K.sv = 0;
    for (var i = 0; i < K.u.length; i++) {
      var u = K.u[i], y = u.off - st;
      if (fermo || y > H + 140 || y + u.h < -140) { if (u.w) { u.el.style.translate = ''; u.el.style.scale = ''; u.w = 0; u.ty = 0; u.s = 1; } continue; }
      var d = Math.max(-H * .62, Math.min(H * .62, y + Math.min(u.h, H) / 2 - yc));
      var ty = a * d / A_P + K.s * .9, sc = 1 - .024 * Math.min(1, a / A_G);
      if (Math.abs(ty - u.ty) < .04 && Math.abs(sc - u.s) < .0004 && u.w) continue;
      u.ty = ty; u.s = sc; u.w = 1;
      u.el.style.translate = '0 ' + ty.toFixed(2) + 'px'; u.el.style.scale = sc.toFixed(4);
    }
    return !fermo;
  }
  function passoC(K, st, t){
    var H = K.H, alto = K.pt * .5, basso = H - 92, coda = 0, dir = K.v >= 0 ? 1 : -1;
    var nuovi = [];
    for (var i = 0; i < K.u.length; i++) {
      var u = K.u[i], y = u.off - st, dentro = y < basso - 6 && y + u.h > alto + 6;
      if (!dentro) { if (!u.fuori) { u.fuori = 1; u.fuoriT = t; } continue; }
      if (u.fuori) {
        u.fuori = 0;
        if (K.utente && t - u.fuoriT > 180 && K.mosso) nuovi.push(u);
      }
    }
    if (!nuovi.length) return;
    nuovi.sort(function(a, b){ return dir > 0 ? a.off - b.off : b.off - a.off; });
    nuovi.forEach(function(u, j){
      if (u.anC) { try { u.anC.cancel(); } catch(e){} }
      var da = dir * C_DA;
      u.anC = u.el.animate([
        { translate:'0 ' + da + 'px', scale:'.9', opacity:0 },
        { translate:'0 ' + (-dir * 5) + 'px', scale:'1.006', opacity:1, offset:.6 },
        { translate:'0 0', scale:'1', opacity:1 }
      ], { duration:C_MS, delay:Math.min(4, j) * C_RIT, easing:'cubic-bezier(.22,.85,.3,1)', fill:'backwards' });
      u.anC.onfinish = function(){ u.anC = null; };
    });
  }
  function aggancia(K){
    var sc = K.sc, st = sc.scrollTop, max = sc.scrollHeight - sc.clientHeight, linea = K.pt + 14;
    if (st < 24 || st > max - 6) return false;
    var best = null, bd = 1e9;
    for (var i = 0; i < K.u.length; i++) {
      var u = K.u[i], d = (u.off - st) - linea, ad = Math.abs(d) * (u.tit ? .7 : 1);
      if (Math.abs(d) <= C_AGG && ad < bd) { bd = ad; best = u; best.d = d; }
    }
    if (!best || Math.abs(best.d) < 2) return false;
    var arrivo = Math.max(0, Math.min(max, st + best.d));
    K.mio = true; K.aggU = best;
    try { sc.scrollTo({ top:arrivo, behavior:'smooth' }); } catch(e){ sc.scrollTop = arrivo; }
    return true;
  }
  function scatto(K){
    var u = K.aggU; K.aggU = null; K.mio = false;
    GBX.hap('sel');
    if (u && u.el.animate && !u.anC) u.el.animate([{ scale:'1' }, { scale:'1.012', offset:.35 }, { scale:'1' }], { duration:300, easing:'ease-out' });
  }
  function frame(t){
    raf = 0;
    var dt = lastT ? Math.min(.05, (t - lastT) / 1000) : 1 / 60; lastT = t;
    var vivo = false;
    for (var i = 0; i < CONT.length; i++) { var K = CONT[i]; if (K.attivo && passo(K, t, dt)) vivo = true; }
    if (vivo) raf = requestAnimationFrame(frame); else lastT = 0;
  }
  function sveglia(){ if (!raf) raf = requestAnimationFrame(frame); }
  function passo(K, t, dt){
    var sc = K.sc;
    if (!sc.isConnected || !sc.getClientRects().length) { K.attivo = false; return false; }
    var mod = modo();
    if (K.iv) {
      var prima = sc.scrollTop; sc.scrollTop = prima + K.iv * dt * 1000;
      K.iv *= Math.pow(.952, dt * 60);
      if (Math.abs(K.iv) < .015 || sc.scrollTop === prima) K.iv = 0;
    }
    var st = sc.scrollTop, ds = st - K.st;
    if (K.ferma) { K.ferma = false; ds = 0; K.v = 0; }
    K.st = st;
    if (Math.abs(ds) > .05) { K.mossoT = t; if (!K.mosso && (K.sporco || t - K.tc > 1500)) raccogli(K, t); K.mosso = true; }
    else if (t - K.mossoT > 90) K.mosso = false;
    var vi = ds / (dt * 1000);
    K.v = K.v * .55 + vi * .45;
    if (mod === 'spento') { return !!K.iv || K.trasc; }
    if (K.sporco && !K.mosso) raccogli(K, t);
    var vivo = K.mosso || !!K.iv || K.trasc;
    if (mod === 'A') vivo = passoA(K, st, dt) || vivo;
    else if (mod === 'B') { if (!HA_VT) passoB(K, st); }
    else if (mod === 'C') {
      passoC(K, st, t);
      var quiete = t - K.mossoT, ruotaFerma = t - K.ruotaT > 180;
      if (K.aggU && quiete > 110) scatto(K);
      else if (!K.dito && !K.trasc && !K.iv && ruotaFerma && quiete > 130 && !K.agganciato && K.utente) {
        K.agganciato = true;
        if (aggancia(K)) vivo = true;
      }
      if (K.aggU || (!K.agganciato && K.utente)) vivo = true;
    }
    return vivo;
  }
  function registra(sc){
    if (!sc || sc.__xs2) return;
    var K = sc.__xs2 = { sc:sc, u:[], st:sc.scrollTop, v:0, s:0, sv:0, iv:0, mossoT:0, tc:0, ruotaT:0, sporco:true, attivo:true, fissi:null };
    CONT.push(K);
    sc.classList.add('xs2-sc');
    function utente(){ K.utente = true; K.agganciato = false; K.mio = false; K.aggU = null; }
    sc.addEventListener('scroll', function(){ K.attivo = true; sveglia(); }, { passive:true });
    sc.addEventListener('wheel', function(){ K.ruotaT = performance.now(); K.iv = 0; utente(); K.attivo = true; sveglia(); }, { passive:true });
    sc.addEventListener('touchstart', function(){ K.dito = true; K.iv = 0; utente(); K.attivo = true; sveglia(); }, { passive:true });
    var fine = function(){ K.dito = false; sveglia(); };
    sc.addEventListener('touchend', fine, { passive:true });
    sc.addEventListener('touchcancel', fine, { passive:true });
    sc.addEventListener('keydown', function(){ utente(); }, { passive:true });
    var tr = null;
    sc.addEventListener('pointerdown', function(e){
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      if (e.target.closest && e.target.closest('input,textarea,select,[contenteditable="true"],canvas,[draggable="true"],.xs2-scelta')) return;
      tr = { y:e.clientY, x0:e.clientX, y0:e.clientY, on:false, pts:[{ y:e.clientY, t:performance.now() }] };
      K.iv = 0;
    });
    addEventListener('pointermove', function(e){
      if (!tr || e.pointerType !== 'mouse') return;
      if (!(e.buttons & 1)) { tr = null; return; }
      if (!tr.on) {
        var ax = Math.abs(e.clientX - tr.x0), ay = Math.abs(e.clientY - tr.y0);
        if (ay < 7 || ay < ax) { if (ax > 10) tr = null; return; }
        tr.on = true; K.trasc = true; utente(); DOC.classList.add('xs2-trascina');
        K.sb = sc.style.scrollBehavior; sc.style.scrollBehavior = 'auto';
        try { getSelection().removeAllRanges(); } catch(_){}
      }
      sc.scrollTop -= e.clientY - tr.y; tr.y = e.clientY;
      var n = performance.now(); tr.pts.push({ y:e.clientY, t:n }); if (tr.pts.length > 6) tr.pts.shift();
      K.attivo = true; sveglia();
    }, { passive:true });
    var su = function(e){
      if (!tr) return; var x = tr; tr = null;
      if (!x.on) return;
      K.trasc = false; DOC.classList.remove('xs2-trascina'); sc.style.scrollBehavior = K.sb || '';
      var n = performance.now(), a = x.pts[0], b = x.pts[x.pts.length - 1];
      if (n - b.t < 90 && b.t > a.t) { var v = -(b.y - a.y) / (b.t - a.t); if (Math.abs(v) > .12) K.iv = Math.max(-6, Math.min(6, v)); }
      K.noClick = n; sveglia();
    };
    addEventListener('pointerup', su, { passive:true });
    addEventListener('pointercancel', su, { passive:true });
    sc.addEventListener('click', function(e){ if (K.noClick && performance.now() - K.noClick < 80) { e.stopPropagation(); e.preventDefault(); K.noClick = 0; } }, true);
    sc.addEventListener('dragstart', function(e){ if (K.trasc) e.preventDefault(); });
    try { new MutationObserver(function(rs){
      for (var i = 0; i < rs.length; i++) {
        var r = rs[i], ns = [].concat([].slice.call(r.addedNodes), [].slice.call(r.removedNodes));
        for (var j = 0; j < ns.length; j++) { var n = ns[j];
          if (n.nodeType === 1 && !(n.classList && (n.classList.contains('xs2-luce') || n.classList.contains('x-rifl') || n.classList.contains('x-fianco') || n.classList.contains('x-glint')))) { K.sporco = true; subito(K); return; } }
      }
    }).observe(sc, { childList:true, subtree:true }); } catch(e){}
    raccogli(K);
    if (modo() === 'B' && !HA_VT) passoB(K, sc.scrollTop);
  }
  function subito(K){
    if (modo() !== 'B' || !K.sc.isConnected || !K.sc.getClientRects().length) return;
    var ora = performance.now();
    if (ora - (K.qT || 0) > 50) { K.qT = ora; K.qN = 0; }
    if (++K.qN <= 4) { raccogli(K, ora); return; }
    if (!K.rq) K.rq = requestAnimationFrame(function(){ K.rq = 0; if (K.sporco && modo() === 'B') raccogli(K); });
  }
  function cerca(){ ELENCO.forEach(function(s){ var e = document.querySelector(s); if (e) registra(e); }); }
  function riprendi(){
    CONT.forEach(function(K){ if (K.sc.getClientRects().length) { K.attivo = true; K.st = K.sc.scrollTop; K.ferma = true; raccogli(K); if (modo() === 'B' && !HA_VT) passoB(K, K.st); } });
  }
  function segna(){
    var m = modo();
    DOC.classList.toggle('xs2-on', m !== 'spento');
    ['A', 'B', 'C'].forEach(function(k){ DOC.classList.toggle('xs2-' + k, m === k); });
  }
  function cambia(){
    CONT.forEach(function(K){ K.u.forEach(pulisci); K.s = K.sv = 0; K.u = []; K.sporco = true; });
    segna();
    setTimeout(riprendi, 30);
  }
  var api = function(x){
    if (x === undefined) return EFF;
    if (!EFFETTI[x]) return EFF;
    EFF = x; try { localStorage.setItem('gbx_scorri2', x); } catch(e){}
    cambia(); scegliSegna(); return EFF;
  };
  GBX.scorri2 = api;
  if (typeof GBX.scorri === 'function' || typeof GBX.scorri === 'object') GBX.scorri.effetto = api;
  else GBX.scorri = { effetto:api };
  try { matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', cambia); } catch(e){}
  var liteEra = GBX.lite();
  try { new MutationObserver(function(){ var l = GBX.lite(); if (l !== liteEra) { liteEra = l; cambia(); } }).observe(DOC, { attributes:true, attributeFilter:['class'] }); } catch(e){}
  segna();
  document.addEventListener('gbx:screen', function(){ try { cerca(); riprendi(); } catch(e){} setTimeout(function(){ cerca(); riprendi(); }, 80); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(cerca, 450); });
  else setTimeout(cerca, 450);
  setTimeout(function(){ cerca(); riprendi(); }, 2600);
  addEventListener('resize', function(){ clearTimeout(api.rt); api.rt = setTimeout(riprendi, 200); });
  var capsula = null;
  function scegliSegna(){ if (!capsula) return; [].forEach.call(capsula.querySelectorAll('button'), function(b){ b.classList.toggle('on', b.getAttribute('data-e') === EFF); }); }
  var vuole = false;
  try { vuole = /[?&]scelta=1\b/.test(location.search) || window.GBX_XS2_SCELTA === 1; } catch(e){}
  if (vuole) {
    var monta = function(){
      if (capsula || !document.body) return;
      capsula = document.createElement('div'); capsula.className = 'xs2-scelta';
      capsula.innerHTML = '<span>Scorrimento</span><button data-e="A">A</button><button data-e="B">B</button><button data-e="C">C</button><button data-e="spento" title="spento">0</button>';
      capsula.addEventListener('click', function(e){ var b = e.target.closest('button'); if (!b) return; e.stopPropagation(); api(b.getAttribute('data-e')); GBX.hap('sel'); });
      document.body.appendChild(capsula); scegliSegna();
    };
    if (document.body) monta(); else document.addEventListener('DOMContentLoaded', monta);
  }
})();
;
(function(){
  'use strict';
  if (window.XSL || typeof SL2 === 'undefined' || typeof slv2Spin !== 'function') return;
  var XSL = window.XSL = { v:'1611' };
  var H = 66, N = 5, LINES = window.SL2_LINES || [];
  var PREMI = { btc:1, gblogo:1, gem:1 };
  var NEUTRI = ['spade', 'star', 'bolt', 'bell', 'ton'];
  function $(id){ return document.getElementById(id); }
  function L(it, en){ return (window.GBX && GBX.L) ? GBX.L(it, en) : (window.GB_LANG === 'en' ? en : it); }
  function ora(){ return performance.now(); }
  function ridotto(){ try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){ return false; } }
  function lite(){ try { if (window.GBX && GBX.lite && GBX.lite()) return true; } catch(e){} return ridotto(); }
  function hap(t){ try { if (window.GBX && GBX.hap) GBX.hap(t); } catch(e){} }
  function warn(c, e){ try { console.warn('[XSL] ' + c, e); } catch(_){} }
  var WAAPI = !!(document.body && document.body.animate);
  var CFG = {
    norm:  { vmax:.026, acc:200, wind:.16, minGiro:620, primo:110, passo:190, dec:3.2, over:.24, molla:300, stira:.10, maxTa:520 },
    turbo: { vmax:.034, acc:110, wind:.08, minGiro:220, primo:40,  passo:70,  dec:3.1, over:.12, molla:170, stira:.08, maxTa:320 },
    lite:  { vmax:.024, acc:80,  wind:0,   minGiro:420, primo:80,  passo:150, dec:3.1, over:0,   molla:0,   stira:0,   maxTa:420 }
  };
  function conf(){ var c = lite() ? CFG.lite : (SL2.turbo ? CFG.turbo : CFG.norm); return c; }
  var NB = null;
  function ac(){
    try {
      if (SL2.soundsEnabled === false || document.hidden) return null;
      if (typeof TWS !== 'undefined' && TWS && TWS.on === false) return null;
      var c = slv2EnsureAudio(); if (!c) return null;
      if (c.state === 'suspended') { try { c.resume(); } catch(e){} }
      if (!NB) { NB = c.createBuffer(1, c.sampleRate, c.sampleRate); var d = NB.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
      return c;
    } catch(e){ return null; }
  }
  function out(){ try { return slv2AudioDest(); } catch(e){ return null; } }
  function nota(c, f, dur, o){
    o = o || {}; var t = c.currentTime + (o.at || 0), os = c.createOscillator(), g = c.createGain();
    os.type = o.type || 'sine'; os.frequency.setValueAtTime(f, t); if (o.to) os.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(o.g || .1, t + (o.atk || .003)); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    os.connect(g); g.connect(out()); os.start(t); os.stop(t + dur + .03);
  }
  function soffio(c, dur, o){
    o = o || {}; var t = c.currentTime + (o.at || 0), s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = NB; f.type = o.ft || 'bandpass'; f.frequency.setValueAtTime(o.f || 2400, t); f.Q.value = o.q || 1;
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(o.g || .08, t + (o.atk || .002)); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(out()); s.start(t, Math.random() * .4); s.stop(t + dur + .03);
  }
  var SU = {
    stop: function(i, forte){ var c = ac(); if (!c) return; try {
      var k = 1 + i * .045;
      nota(c, 128 * k, .13, { to: 50, g: forte ? .30 : .22 });
      soffio(c, .028, { ft:'highpass', f: 2600, g: forte ? .10 : .07 });
      soffio(c, .06, { f: 900 * k, q: 2, g: .035 });
    } catch(e){} },
    centro: function(){ var c = ac(); if (!c) return; try {
      [1318.5, 1975.5, 2637].forEach(function(f, j){ nota(c, f, .42, { type:'triangle', g:.06, at: j * .045 }); });
      soffio(c, .35, { ft:'highpass', f: 6000, g: .025, at: .05, atk: .04 });
    } catch(e){} },
    vuoto: function(){ var c = ac(); if (!c) return; try { nota(c, 220, .22, { to: 140, type:'triangle', g:.05 }); } catch(e){} },
    corsa: null,
    corsaOn: function(){ var c = ac(); if (!c || SU.corsa) return; try {
      var s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      s.buffer = NB; s.loop = true; f.type = 'bandpass'; f.frequency.value = 760; f.Q.value = .8;
      g.gain.setValueAtTime(.0001, c.currentTime); g.gain.exponentialRampToValueAtTime(.022, c.currentTime + .12);
      s.connect(f); f.connect(g); g.connect(out()); s.start();
      SU.corsa = { s:s, g:g, f:f, c:c };
    } catch(e){} },
    corsaLiv: function(n){ var k = SU.corsa; if (!k) return; try { var t = k.c.currentTime; k.g.gain.cancelScheduledValues(t); k.g.gain.setTargetAtTime(Math.max(.0001, .0045 * n), t, .05); k.f.frequency.setTargetAtTime(560 + 60 * n, t, .08); } catch(e){} },
    corsaOff: function(){ var k = SU.corsa; SU.corsa = null; if (!k) return; try { var t = k.c.currentTime; k.g.gain.cancelScheduledValues(t); k.g.gain.setTargetAtTime(.0001, t, .04); k.s.stop(t + .3); } catch(e){} },
    sale: function(dur){ var c = ac(); if (!c) return null; try {
      var t = c.currentTime, d = dur / 1000, o = c.createOscillator(), o2 = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain(), m = c.createGain();
      o.type = 'sawtooth'; o2.type = 'sawtooth'; o.frequency.setValueAtTime(196, t); o.frequency.exponentialRampToValueAtTime(523, t + d);
      o2.frequency.setValueAtTime(198.5, t); o2.frequency.exponentialRampToValueAtTime(528, t + d);
      f.type = 'lowpass'; f.Q.value = 3; f.frequency.setValueAtTime(500, t); f.frequency.exponentialRampToValueAtTime(3200, t + d);
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.032, t + d * .7);
      lfo.frequency.setValueAtTime(6, t); lfo.frequency.linearRampToValueAtTime(15, t + d); lg.gain.value = .45; m.gain.value = .55;
      lfo.connect(lg); lg.connect(m.gain);
      o.connect(f); o2.connect(f); f.connect(m); m.connect(g); g.connect(out());
      o.start(t); o2.start(t); lfo.start(t);
      return { c:c, g:g, os:[o, o2, lfo], o:o };
    } catch(e){ return null; } },
    saleStop: function(h, bene){ if (!h) return; try {
      var t = h.c.currentTime; h.g.gain.cancelScheduledValues(t); h.g.gain.setValueAtTime(h.g.gain.value || .02, t);
      if (!bene) h.o.frequency.cancelScheduledValues(t), h.o.frequency.setValueAtTime(h.o.frequency.value || 400, t), h.o.frequency.exponentialRampToValueAtTime(110, t + .25);
      h.g.gain.exponentialRampToValueAtTime(.0001, t + (bene ? .08 : .28));
      h.os.forEach(function(o){ o.stop(t + .32); });
    } catch(e){} }
  };
  XSL.suoni = SU;
  var SCR = null;
  function monta(){
    SCR = $('slots'); if (!SCR) return false;
    SCR.classList.add('xsl-on');
    var cols = SCR.querySelectorAll('.slv2-reel-col');
    [].forEach.call(cols, function(col){
      var w = col.querySelector('.slv2-reel-window'); if (!w) return;
      if (!w.querySelector('.xsl-velo')) { var v = document.createElement('i'); v.className = 'xsl-velo'; w.appendChild(v); }
      if (!w.querySelector('.xsl-buio')) { var b = document.createElement('i'); b.className = 'xsl-buio'; w.appendChild(b); }
      if (!col.querySelector('.xsl-cornice')) { var c = document.createElement('i'); c.className = 'xsl-cornice'; col.appendChild(c); }
    });
    var w0 = SCR.querySelector('.slv2-reel-window'); if (w0 && w0.clientHeight > 100) MEZZO = w0.clientHeight / 2;
    var cab = SCR.querySelector('.slv2-cabinet');
    if (cab && !SCR.querySelector('.xsl-vinci')) {
      var box = document.createElement('div'); box.className = 'xsl-vinci-box';
      var vi = document.createElement('div'); vi.className = 'xsl-vinci'; vi.setAttribute('aria-live', 'polite');
      vi.innerHTML = '<span class="xsl-vinci-l"></span><span class="xsl-vinci-n"></span>'; box.appendChild(vi);
      var pi = document.createElement('div'); pi.className = 'xsl-pill'; pi.textContent = L('Attendo il server…', 'Waiting for the server…'); box.appendChild(pi);
      cab.parentNode.insertBefore(box, cab.nextSibling);
      var hot = document.createElement('div'); hot.className = 'xsl-caldi'; var g = $('slv2-reels'); if (g) g.appendChild(hot);
    }
    allinea();
    return true;
  }
  function allinea(){
    try {
      var g = $('slv2-reels'), ws = SCR.querySelectorAll('.slv2-reel-window'); if (!g || ws.length < 5) return;
      var gr = g.getBoundingClientRect(), a = ws[0].getBoundingClientRect(), b = ws[4].getBoundingClientRect();
      if (!a.width || !gr.width) return;
      var box = { left: a.left - gr.left - g.clientLeft, top: a.top - gr.top - g.clientTop, width: b.right - a.left, height: a.height };
      [$('slv2-payline-svg'), $('slv2-win-overlay'), SCR.querySelector('.xsl-caldi')].forEach(function(el){
        if (!el) return;
        el.style.inset = 'auto'; el.style.left = box.left + 'px'; el.style.top = box.top + 'px';
        el.style.width = box.width + 'px'; el.style.height = box.height + 'px';
      });
    } catch(e){ warn('allinea', e); }
  }
  window.addEventListener('resize', function(){ if (SCR && SCR.classList.contains('active')) allinea(); });
  function colEl(i){ return SCR ? SCR.querySelectorAll('.slv2-reel-col')[i] : null; }
  var R = [];
  var MEZZO = 99;
  function reel(i){ var r = R[i]; if (!r) r = R[i] = { i:i }; r.el = $('slv2-strip-' + i); return r; }
  function tf(y, k){
    var ty = -(y - 1) * H;
    if (!k || k === 1) return 'translate3d(0,' + ty.toFixed(2) + 'px,0)';
    return 'translate3d(0,' + (MEZZO - k * (MEZZO - ty)).toFixed(2) + 'px,0) scaleY(' + k.toFixed(4) + ')';
  }
  function leggiY(r){
    try {
      var m = getComputedStyle(r.el).transform;
      if (m && m !== 'none') {
        var v = m.match(/\(([^)]+)\)/)[1].split(',').map(parseFloat), ty, k;
        if (v.length === 6) { k = v[3]; ty = v[5]; } else { k = v[5]; ty = v[13]; }
        if (k && Math.abs(k - 1) > 1e-4) ty = MEZZO - (MEZZO - ty) / k;
        return 1 - ty / H;
      }
    } catch(e){}
    return r.y || SL2.positions[r.i] || 1;
  }
  function ferma(r){ if (r.anim) { try { r.anim.cancel(); } catch(e){} r.anim = null; } if (r.velo) { try { r.velo.cancel(); } catch(e){} r.velo = null; } }
  function scrivi(r, y, k){ r.y = y; r.el.style.transform = tf(y, k); }
  function cella(r, idx){ return r.el.children[idx]; }
  function sim(r, idx){ var c = cella(r, idx); return c ? ((c.className.match(/\bsym-(\w+)/) || [])[1] || null) : null; }
  function timbra(r, idx, s){ try { slv2StampCell(r.el, SL2.stripSyms[r.i], idx, s); } catch(e){ warn('timbra', e); } }
  function ribasa(r, nuovo){
    var y = Math.round(r.y);
    for (var k = -2; k <= 2; k++) { var s = sim(r, y + k); if (s) timbra(r, nuovo + k, s); }
    SL2.positions[r.i] = nuovo; scrivi(r, nuovo, 1);
  }
  function veloOpac(r, a, b, ms){
    var v = r.el && r.el.parentElement && r.el.parentElement.querySelector('.xsl-velo'); if (!v) return;
    if (r.velo) { try { r.velo.cancel(); } catch(e){} }
    v.style.opacity = b;
    if (WAAPI && ms) r.velo = v.animate([{ opacity:a }, { opacity:b }], { duration:ms, easing:'ease-out' });
  }
  function parti(r, ritardo, y){
    var c = conf(); ferma(r);
    r.el.classList.remove('spinning', 'stopped', 'wheel-anticipating', 'anticipating');
    r.y = (y != null) ? y : Math.round(leggiY(r));
    if (r.y < 40 || r.y > 70) ribasa(r, 44 + Math.floor(Math.random() * 8));
    r.fase = 'corre'; r.cmd = false; r.imp = false; r.lento = false; r.att = null; r.v = c.vmax; r.rate = 1; r.t0 = ora() + (ritardo || 0);
    SL2.reelSpinning[r.i] = true;
    if (!WAAPI) { r.fase = 'corre'; return; }
    var y0 = r.y, k = 1 + c.stira, giro = 34;
    var dAcc = c.vmax * c.acc / 2;
    var op = c.stira ? .8 : 1;
    var fr = [{ transform: tf(y0, 1), opacity: 1, offset: 0, easing: 'cubic-bezier(.3,0,.6,1)' }];
    var tW = c.wind ? 110 : 0;
    if (c.wind) fr.push({ transform: tf(y0 + c.wind, 1), opacity: 1, offset: tW / (tW + c.acc), easing: 'cubic-bezier(.55,0,1,1)' });
    fr.push({ transform: tf(y0 - dAcc, k), opacity: op, offset: 1 });
    r.anim = r.el.animate(fr, { duration: tW + c.acc, delay: ritardo || 0, fill: 'both' });
    veloOpac(r, 0, 1, (ritardo || 0) + tW + c.acc);
    var me = r.anim;
    me.onfinish = function(){
      if (r.anim !== me || r.fase !== 'corre') return;
      var ya = y0 - dAcc;
      if (ya < 12) { ribasaCorsa(r, ya); ya = r.y; }
      r.anim = r.el.animate([{ transform: tf(ya, k), opacity: op }, { transform: tf(ya - giro, k), opacity: op }], { duration: giro / c.vmax, iterations: Infinity });
      r.anim.playbackRate = r.rate || 1;
    };
  }
  function ribasaCorsa(r, ya){ r.y = ya + 34; }
  function rallenta(r, verso, ms){
    var a = r.anim; if (!a || r.fase !== 'corre') { r.rate = verso; return; }
    var c = conf(), y = leggiY(r), v0 = c.vmax * (r.rate || 1), v1 = c.vmax * verso;
    var dist = (v0 + v1) / 2 * ms;
    ferma(r);
    if (y < 40) y += 34;
    var k0 = 1 + c.stira, k1 = 1 + c.stira * .2, s0 = 2 * v0 / (v0 + v1), s1 = 2 * v1 / (v0 + v1);
    var ez = 'cubic-bezier(.33,' + Math.min(1, .33 * s0).toFixed(3) + ',.67,' + (1 - .33 * s1).toFixed(3) + ')';
    r.anim = r.el.animate([{ transform: tf(y, k0), opacity: c.stira ? .8 : 1, easing: ez }, { transform: tf(y - dist, k1), opacity: 1 }], { duration: ms, fill: 'both' });
    veloOpac(r, 1, .3, ms);
    r.rate = verso;
    var me = r.anim, ya = y - dist;
    me.onfinish = function(){
      if (r.anim !== me || r.fase !== 'corre') return;
      r.anim = r.el.animate([{ transform: tf(ya, k1) }, { transform: tf(ya - 34, k1) }], { duration: 34 / v1, iterations: Infinity });
    };
  }
  function vel(r){ var c = conf(); return c.vmax * (r.rate || 1); }
  function atterra(r, col, modo){
    var c = conf(), y = leggiY(r);
    ferma(r);
    var dec = modo === 'slam' ? Math.max(3.05, c.dec - .1) : c.dec;
    if (modo === 'attesa') dec = 3.25;
    if (Math.floor(y - dec) < 4) { y += 34; }
    var T = Math.floor(y - dec);
    timbra(r, T - 1, col[0]); timbra(r, T, col[1]); timbra(r, T + 1, col[2]);
    for (var k = T + 2; k <= Math.floor(y - 2); k++) pulisci(r, k);
    pulisci(r, T - 2); pulisci(r, T - 3);
    SL2.positions[r.i] = T;
    var over = c.over * (modo === 'attesa' ? 1.4 : modo === 'slam' ? .7 : 1);
    var v0 = Math.max(vel(r), .006);
    var Ta = 3 * (dec + .5 + over) / v0;
    var aa = P && P.att[r.i];
    var maxTa = modo === 'attesa' ? (lite() ? 420 : (aa && aa.maxTa) || 980) : modo === 'slam' ? 260 : c.maxTa;
    Ta = Math.max(lite() ? 140 : 180, Math.min(maxTa, Ta));
    var k0 = r.rate && r.rate < .7 ? 1 + c.stira * .2 : 1 + c.stira;
    r.fase = 'frena'; r.cmd = true; r.tCmd = ora(); r.T = T; r.modo = modo; r.Ta = Ta; nota_('frena ' + r.i + ' ' + modo + ' ' + Math.round(Ta));
    var mol = c.molla * (modo === 'attesa' ? 1.25 : 1);
    if (!WAAPI) { scrivi(r, T, 1); setTimeout(function(){ impatto(r); fine(r); }, 16); return; }
    var op0 = c.stira ? (r.rate && r.rate < .7 ? 1 : .8) : 1;
    var fr = [
      { transform: tf(y, k0), opacity: op0, offset: 0, easing: 'cubic-bezier(.33,1,.68,1)' },
      { transform: tf(T - over, 1), opacity: 1, offset: Ta / (Ta + mol) }
    ];
    if (over) {
      fr[1].easing = 'cubic-bezier(.3,0,.4,1)';
      fr.push({ transform: tf(T + over * .32, 1), opacity: 1, offset: (Ta + mol * .5) / (Ta + mol), easing: 'cubic-bezier(.4,0,.5,1)' });
      fr.push({ transform: tf(T, 1), opacity: 1, offset: 1 });
    }
    r.anim = r.el.animate(fr, { duration: Ta + (over ? mol : 0), fill: 'both' });
    veloOpac(r, 1, 0, Ta * .7);
    var me = r.anim;
    r.tImpPrevisto = ora() + Ta;
    r.timp = setTimeout(function(){ if (r.anim === me) impatto(r); }, Ta);
    me.onfinish = function(){ if (r.anim === me) fine(r); };
  }
  function pulisci(r, idx){
    var s = sim(r, idx); if (!s) return;
    if (s === 'bot' || s === 'wheel' || s === 'btc') timbra(r, idx, NEUTRI[Math.floor(Math.random() * NEUTRI.length)]);
  }
  function fine(r){
    if (r.fase === 'fermo') return;
    if (!r.imp) impatto(r);
    ferma(r); r.fase = 'fermo'; scrivi(r, r.T, 1);
  }
  function finisciSubito(r){
    if (r.fase === 'fermo' || !r.el) return;
    if (r.fase === 'frena') { clearTimeout(r.timp); fine(r); }
  }
  function corsa(cols, line, fino){
    var syms = []; for (var r = 0; r < fino; r++) syms.push(cols[r][line[r]]);
    if (!syms.length || syms[0] === 'bot' || syms[0] === 'wheel') return { n:0, m:null };
    var m = syms[0];
    if (m === 'btc') for (var k = 1; k < syms.length; k++) if (syms[k] !== 'btc' && syms[k] !== 'bot' && syms[k] !== 'wheel') { m = syms[k]; break; }
    var n = 0;
    for (var j = 0; j < syms.length; j++) { var s = syms[j]; if (s === m || (s === 'btc' && m !== 'bot' && m !== 'wheel')) n++; else break; }
    return { n:n, m:m };
  }
  function attesa(cols){
    var out = {};
    if (!cols || cols.length < 5) return out;
    [3, 4].forEach(function(k){
      var a = null;
      for (var li = 0; li < LINES.length && !a; li++) {
        var c = corsa(cols, LINES[li], k);
        if (c.n === k && ((k === 4 && c.m !== 'spade') || (k === 3 && PREMI[c.m]))) {
          a = { why:'linea', line:li, sym:c.m, hot:[] };
          for (var r = 0; r < k; r++) a.hot.push([r, LINES[li][r]]);
        }
      }
      if (!a) {
        var b = [], w = [];
        for (var r2 = 0; r2 < k; r2++) for (var row = 0; row < 3; row++) {
          if (cols[r2][row] === 'bot') b.push([r2, row]);
          if (cols[r2][row] === 'wheel') w.push([r2, row]);
        }
        if (b.length >= 2) a = { why:'bot', sym:'bot', hot:b };
        else if (w.length >= 2) a = { why:'ruota', sym:'wheel', hot:w };
      }
      if (a) out[k] = a;
    });
    return out;
  }
  function centra(cols, k, a){
    if (!a) return false;
    if (a.why === 'linea') return corsa(cols, LINES[a.line], k + 1).n === k + 1;
    return cols[k].indexOf(a.sym) >= 0;
  }
  XSL.attesa = attesa; XSL.centra = centra;
  function caldi(lista, classe){
    var box = SCR && SCR.querySelector('.xsl-caldi'); if (!box) return;
    lista.forEach(function(p){
      var key = p[0] + ',' + p[1];
      if (box.querySelector('[data-k="' + key + '"]')) return;
      var d = document.createElement('i'); d.className = 'xsl-caldo ' + (classe || ''); d.setAttribute('data-k', key);
      d.style.left = (p[0] * 20) + '%'; d.style.top = (p[1] * 100 / 3) + '%';
      box.appendChild(d);
    });
  }
  function spegniCaldi(){ var box = SCR && SCR.querySelector('.xsl-caldi'); if (box) box.innerHTML = ''; }
  function accendiAttesa(k, a){
    if (!SCR) return;
    SCR.classList.add('xsl-suspense');
    SCR.classList.toggle('xsl-sus-oro', a.why !== 'linea' || PREMI[a.sym]);
    for (var i = 0; i < N; i++) { var c = colEl(i); if (c) { c.classList.toggle('xsl-ant', i === k); c.classList.toggle('xsl-scuro', i > k); } }
    caldi(a.hot, 'xsl-c-' + a.why);
  }
  function spegniAttesa(){
    if (SCR) { SCR.classList.remove('xsl-suspense', 'xsl-sus-oro'); [].forEach.call(SCR.querySelectorAll('.xsl-ant,.xsl-scuro,.xsl-preso'), function(c){ c.classList.remove('xsl-ant', 'xsl-scuro', 'xsl-preso'); }); }
    spegniCaldi();
    if (P && P.sale) { SU.saleStop(P.sale, false); P.sale = null; }
    if (P && P.tic) { clearTimeout(P.tic); P.tic = null; }
  }
  function ticSuspense(durata){
    if (!P) return; var t0 = ora();
    (function giro(){
      if (!P) return; var u = (ora() - t0) / durata; if (u >= 1) return;
      hap(u > .7 ? 'light' : 'sel');
      P.tic = setTimeout(giro, Math.max(55, 190 - 150 * u));
    })();
  }
  var P = null;
  XSL.busy = false; XSL.tok = 0; XSL.passo = 0; XSL.log = [];
  function segna(){ XSL.passo = ora(); }
  function nota_(cosa){ XSL.log.push([Math.round(ora() - (XSL.t0 || 0)), cosa]); if (XSL.log.length > 60) XSL.log.shift(); }
  function bloccaComandi(){
    try { slv2DisableSpin(); } catch(e){}
    var slvRoot = document.querySelector('.slv2'); if (slvRoot) slvRoot.classList.add('is-spinning');
  }
  function preparaVista(){
    var svg = $('slv2-payline-svg'); if (svg) svg.innerHTML = '';
    var ov = $('slv2-win-overlay'); if (ov) ov.innerHTML = '';
    for (var r = 0; r < N; r++) {
      var st = $('slv2-strip-' + r);
      if (st) [].forEach.call(st.querySelectorAll('.slv2-sym.winning, .slv2-sym.exploding, .slv2-sym.xsl-pop'), function(el){ el.classList.remove('winning', 'exploding', 'xsl-pop'); el.style.animationDelay = ''; });
    }
    var lw = $('slv2-last-win'); if (lw) { lw.className = 'slv2-stat-val'; lw.textContent = '...'; }
    try { slv2ClearAnticipation(); } catch(e){}
    spegniAttesa(); nascondiVinci();
  }
  function warmup(){
    if (SL2._videosWarmed) return;
    SL2._videosWarmed = true;
    ['slv2-fs-intro-video', 'slv2-bw-video', 'slv2-vg-video'].forEach(function(id){
      var v = $(id); if (!v || !v.getAttribute('src')) return;
      try { v.muted = true; var p = v.play(); if (p && p.then) p.then(function(){ try { v.pause(); v.currentTime = 0; } catch(_e){} }).catch(function(){}); } catch(e){}
    });
    try { var ctx = slv2EnsureAudio(); if (ctx && ctx.state === 'suspended') ctx.resume(); } catch(e){}
  }
  function avvia(){
    if (!monta()) return false;
    warmup();
    SL2.spinning = true; SL2.cascadeLevel = 0; SL2.cascadeWinTotal = 0;
    bloccaComandi(); preparaVista();
    SCR.classList.toggle('xsl-lite', lite());
    SL2.grid = [[], [], [], [], []];
    var prima = [], ys = [], i, r;
    for (i = 0; i < N; i++) { r = reel(i); ys[i] = r.el ? Math.round(leggiY(r)) : null; }
    for (i = 0; i < N; i++) {
      r = R[i]; if (!r.el) continue;
      var y = ys[i]; r.y = y;
      prima.push([sim(r, y - 1), sim(r, y), sim(r, y + 1)]);
      parti(r, i * (lite() ? 0 : 55), y);
    }
    XSL.prima = prima; XSL.t0 = ora(); XSL.log = []; nota_('via'); segna();
    SU.corsaOn(); SU.corsaLiv(5);
    sveglia();
    return true;
  }
  function pianifica(cols, opz){
    opz = opz || {};
    var c = conf(), t = ora(), auto = !!SL2.autoActive;
    var att = opz.annulla ? {} : attesa(cols);
    if (SL2.turbo || lite()) Object.keys(att).forEach(function(k){ att[k].corta = true; });
    var nAtt = Object.keys(att).length;
    Object.keys(att).forEach(function(k, j){
      var a = att[k], ultimo = (j === nAtt - 1);
      a.hold = a.corta ? 180 : (nAtt === 1 ? 430 : (ultimo ? 150 : 150));
      a.rate = a.corta ? (lite() ? 1 : .7) : (ultimo ? .42 : .62);
      a.maxTa = nAtt === 1 || ultimo ? 980 : 720;
      if (auto) a.hold = Math.round(a.hold * .55);
    });
    P = { cols: cols, att: att, t1: Math.max(XSL.t0 + c.minGiro, t + c.primo), annulla: !!opz.annulla, fatto: false, slam: !!opz.annulla, sale: null };
    if (!opz.annulla) {
      try { slv2SetSpinButtonMode('stop'); } catch(e){}
      var b = $('slv2-spin-btn'); if (b) b.disabled = false;
    }
    nota_(opz.annulla ? 'annulla' : 'esito' + (nAtt ? ' suspense ' + Object.keys(att).join('+') : '')); segna(); sveglia();
  }
  XSL.pianifica = pianifica;
  var raf = 0;
  function sveglia(){ if (!raf) raf = requestAnimationFrame(regia); }
  function regia(){
    raf = 0;
    var t = ora(), vivi = 0;
    for (var i = 0; i < N; i++) if (R[i] && R[i].fase && R[i].fase !== 'fermo') vivi++;
    if (P && !P.fatto) dirigi(t);
    if (vivi || (P && !P.fatto)) { segna(); raf = requestAnimationFrame(regia); }
  }
  function dirigi(t){
    var c = conf();
    for (var i = 0; i < N; i++) {
      var r = R[i]; if (!r || r.cmd) continue;
      var prev = i ? R[i - 1] : null, a = P.att[i];
      if (P.slam) {
        if (prev && !prev.cmd) return;
        if (!prev || t >= prev.tCmd + 45) { atterra(r, P.cols[i], 'slam'); continue; }
        return;
      }
      if (!prev) { if (t >= P.t1) atterra(r, P.cols[i], 'norm'); return; }
      if (!prev.cmd) return;
      if (a) {
        if (!prev.imp) return;
        if (!a.acceso) {
          a.acceso = true; a.tOn = t;
          if (r.anim && r.fase === 'corre' && a.rate < 1) rallenta(r, a.rate, 360);
          accendiAttesa(i, a);
          var dur = a.hold + (a.corta ? 260 : 900);
          if (!a.corta) { if (P.sale) SU.saleStop(P.sale, true); P.sale = SU.sale(dur); ticSuspense(dur); }
          hap('medium');
        }
        if (t >= a.tOn + a.hold) atterra(r, P.cols[i], a.corta ? 'norm' : 'attesa');
        return;
      }
      var base = (prev && P.att[i - 1]) ? (prev.imp ? prev.tImp + 110 : Infinity) : prev.tCmd + c.passo;
      if (t >= base) atterra(r, P.cols[i], 'norm');
      return;
    }
  }
  XSL.dirigi = dirigi;
  function impatto(r){
    if (r.imp) return;
    r.imp = true; r.tImp = ora(); segna(); nota_('posa ' + r.i);
    SL2.reelSpinning[r.i] = false;
    if (r.fase === 'corre') r.fase = 'frena';
    var nCorre = 0; for (var i = 0; i < N; i++) if (R[i] && SL2.reelSpinning[i]) nCorre++;
    SU.corsaLiv(nCorre); if (!nCorre) SU.corsaOff();
    try { slv2UpdateGridFromStrip(r.i); } catch(e){ warn('griglia', e); }
    var a = P && P.att[r.i], preso = a && !a.corta ? centra(P.cols, r.i, a) : false;
    var col = colEl(r.i);
    if (col && !lite()) { col.classList.remove('xsl-colpo'); void col.offsetWidth; col.classList.add('xsl-colpo'); }
    if (a && !a.corta) {
      if (P.sale) { SU.saleStop(P.sale, preso); P.sale = null; }
      if (P.tic) { clearTimeout(P.tic); P.tic = null; }
      if (preso) {
        SU.stop(r.i, true); SU.centro(); hap('heavy');
        if (col) col.classList.add('xsl-preso');
        caldi(cellePrese(P.cols, r.i, a), 'xsl-c-' + a.why);
      } else {
        SU.stop(r.i, false); SU.vuoto(); hap('soft');
        if (!P.att[r.i + 1]) spegniAttesa(); else if (col) col.classList.remove('xsl-ant');
      }
    } else {
      SU.stop(r.i, false); hap('light');
    }
    if (P) { var tutti = true; for (var j = 0; j < N; j++) if (!R[j] || !R[j].imp) tutti = false; if (tutti) chiudi(); }
  }
  function cellePrese(cols, k, a){
    if (a.why === 'linea') return [[k, LINES[a.line][k]]];
    var o = []; for (var row = 0; row < 3; row++) if (cols[k][row] === a.sym) o.push([k, row]); return o;
  }
  function chiudi(){
    if (!P || P.fatto) return;
    P.fatto = true; var annulla = P.annulla, hadAtt = Object.keys(P.att).length > 0; nota_('fine');
    SU.corsaOff();
    try { slv2SetSpinButtonMode('spin'); } catch(e){}
    try { slv2DisableSpin(); } catch(e){}
    setTimeout(function(){
      if (hadAtt) spegniAttesa(); else spegniCaldi();
      P = null; segna();
      if (annulla) {
        SL2.spinning = false;
        for (var i = 0; i < N; i++) SL2.reelSpinning[i] = false;
        var slvRoot = document.querySelector('.slv2'); if (slvRoot) slvRoot.classList.remove('is-spinning');
        var lw = $('slv2-last-win'); if (lw && lw.textContent === '...') lw.textContent = '€0.00';
        try { slv2EnableSpinIfIdle(); } catch(e){}
        return;
      }
      try { if (SL2.fsActive) slv2ApplyStickyWilds(); } catch(e){ warn('sticky', e); }
      try { slv2ProcessSpinResult(); } catch(e){ warn('esito', e); try { slv2FinishSpin(0); } catch(_){} }
    }, lite() ? 60 : 100);
  }
  function annullaGiro(){
    var cols = XSL.prima && XSL.prima.length === 5 ? XSL.prima : null;
    if (!cols) { cols = []; for (var i = 0; i < N; i++) cols.push([NEUTRI[0], NEUTRI[1], NEUTRI[2]]); }
    cols = cols.map(function(c){ return c.map(function(s){ return s || 'spade'; }); });
    pianifica(cols, { annulla:true });
  }
  function giroPagato(){
    if (XSL.busy || SL2.spinning || P) return;
    if (SL2.fakeRevealActive || SL2.bonusWheelOpen || SL2.vaultOpen || SL2.fsIntroActive || SL2.scatterIntroActive || SL2.pendingWheelTrigger) return;
    if (SL2.fsActive) return;
    var bet = SL2.bet;
    if (!hasFunds(bet)) { toast('Insufficient balance', 'err'); slv2StopAuto(); return; }
    if (!S.userId) { toast('Open in Telegram to play', 'err'); slv2StopAuto(); return; }
    var tok = ++XSL.tok;
    XSL.busy = true;
    if (!avvia()) { XSL.busy = false; SL2.spinning = false; return; }
    var pill = SCR && SCR.querySelector('.xsl-pill');
    var tLento = setTimeout(function(){ if (tok === XSL.tok && XSL.busy && pill) { pill.textContent = L('Attendo il server…', 'Waiting for the server…'); pill.classList.add('on'); } }, 1600);
    var tMolla = setTimeout(function(){
      if (tok !== XSL.tok || !XSL.busy) return;
      XSL.tok++; XSL.busy = false; if (pill) pill.classList.remove('on');
      slv2StopAuto(); annullaGiro();
      toast(L('Il server non risponde: ricontrollo il saldo', 'The server is not answering: checking your balance'), 'err');
      if (typeof loadBalance === 'function') loadBalance();
    }, 20000);
    function finito(){ clearTimeout(tLento); clearTimeout(tMolla); if (pill) pill.classList.remove('on'); }
    fetch(BACKEND + '/play/slots', {
      method:'POST', headers:{'Content-Type':'application/json','ngrok-skip-browser-warning':'1'},
      body:JSON.stringify(Object.assign({ user_id:S.userId }, postaCent(bet)))
    }).then(function(r){ return r.json(); }).then(function(d){
      finito();
      if (tok !== XSL.tok) { if (typeof loadBalance === 'function') loadBalance(); return; }
      XSL.busy = false;
      if (!d || d.error) {
        toast('⚠️ ' + ((d && d.error) || 'Network error - retry'), 'err');
        slv2StopAuto(); annullaGiro();
        if (typeof loadBalance === 'function') loadBalance();
        return;
      }
      SL2.srv = { round: d.round, cursor: 0, wheelShown: false,
                  finalBtc: d.btc, jackpot: !!d.jackpot,
                  wins: d.wins, losses: d.losses,
                  total_bet_eur: d.total_bet_eur, biggest_win_eur: d.biggest_win_eur,
                  wonCent: (typeof d.won_cent === 'number') ? d.won_cent : null, bet: bet };
      SL2.srvMode = true;
      SL2.srvFsWheelCursor = 0;
      SL2.srvWheel = null;
      if (typeof slv2ContributeJackpot === 'function') { try { slv2ContributeJackpot(bet); } catch(e){} }
      S.btc = Math.max(0, S.btc - eurToBtc(bet)); refresh();
      giraEsito(true);
    }).catch(function(){
      finito();
      if (tok !== XSL.tok) return;
      XSL.busy = false;
      toast('Network error', 'err');
      slv2StopAuto(); annullaGiro();
      if (typeof loadBalance === 'function') loadBalance();
    });
  }
  function giraEsito(pagato){
    var cols, isFree = SL2.fsActive && SL2.fsRemaining > 0;
    if (!isFree && pagato) {
      try { slv2ContributeJackpot(SL2.bet); } catch(e){}
    }
    if (SL2.srvMode && SL2.srv) {
      var ss = SL2.srv.round.spins[SL2.srv.cursor++] ||
               { cols:[['spade','spade','spade'],['spade','spade','spade'],['spade','spade','spade'],['spade','spade','spade'],['spade','spade','spade']], tumbles:[] };
      SL2.srvCols = ss.cols; SL2.srvTumbles = ss.tumbles || []; SL2.srvTumbleCursor = 0;
      cols = ss.cols;
    } else {
      cols = []; for (var i = 0; i < N; i++) { var c = []; for (var j = 0; j < 3; j++) c.push(SL2_REEL[Math.floor(Math.random() * SL2_REEL.length)]); cols.push(c); }
      SL2.srvCols = null;
    }
    pianifica(cols);
  }
  var ORIG = {};
  function sostituisci(nome, f){ if (typeof window[nome] !== 'function') return; ORIG[nome] = window[nome]; window[nome] = f; }
  sostituisci('slv2SpinFetch', giroPagato);
  sostituisci('slv2Spin', function(){
    if (SL2.spinning || XSL.busy || P) return;
    if (SL2.fakeRevealActive || SL2.scatterIntroActive || SL2.pendingWheelTrigger || SL2.bonusWheelOpen || SL2.vaultOpen || SL2.fsIntroActive) return;
    var isFree = SL2.fsActive && SL2.fsRemaining > 0;
    if (!isFree) { giroPagato(); return; }
    if (!avvia()) return;
    giraEsito(!isFree);
  });
  sostituisci('slv2SpinOrStop', function(){
    if (SL2.fakeRevealActive || SL2.bonusWheelOpen || SL2.vaultOpen || SL2.fsIntroActive || SL2.scatterIntroActive || SL2.pendingWheelTrigger) return;
    if (P && !P.fatto && !P.annulla) {
      if (!P.slam) { P.slam = true; hap('medium'); if (P.sale) { SU.saleStop(P.sale, false); P.sale = null; } sveglia(); }
      return;
    }
    if (SL2.spinning || XSL.busy || P) return;
    giroPagato();
  });
  sostituisci('slv2QuickStopAllReels', function(){ if (P && !P.fatto && !P.annulla) { P.slam = true; sveglia(); } });
  sostituisci('slv2QueueSpin', function(delayMs, options){
    var delay = typeof delayMs === 'number' ? delayMs : 600;
    var requireAuto = !!(options && options.requireAuto);
    var t0 = ora();
    function prova(){
      if (requireAuto && !SL2.autoActive) return;
      var blocked = SL2.spinning || XSL.busy || P || SL2.fakeRevealActive || SL2.scatterIntroActive ||
                    SL2.pendingWheelTrigger || SL2.bonusWheelOpen || SL2.vaultOpen || SL2.fsIntroActive;
      if (!blocked) {
        if (SL2.fsActive && SL2.fsRemaining > 0) slv2Spin(); else giroPagato();
        return;
      }
      if (ora() - t0 > 12000) {
        if (SL2.autoActive) { SL2.autoActive = false; try { slv2StopAuto(); } catch(e){} try { slv2EnableSpinIfIdle(); } catch(e){} }
        return;
      }
      setTimeout(prova, 220);
    }
    setTimeout(prova, delay);
  });
  sostituisci('slv2HardResetSpinState', function(){ salva('visibile'); });
  function overlayAperto(){ return SL2.fakeRevealActive || SL2.bonusWheelOpen || SL2.vaultOpen || SL2.fsIntroActive || SL2.scatterIntroActive || SL2.pendingWheelTrigger; }
  function salva(perche){
    if (document.hidden) return;
    var vivo = (ora() - XSL.passo) < 8000;
    if (XSL.busy || vivo) return;
    for (var i = 0; i < N; i++) if (R[i]) finisciSubito(R[i]);
    if (P && !P.fatto) { var ok = true; for (var j = 0; j < N; j++) if (!R[j] || !R[j].imp) ok = false; if (ok) { chiudi(); return; } }
    if (SL2.spinning && !overlayAperto() && !SL2.fsActive) {
      warn('giro fermo da troppo (' + perche + '): chiudo', null);
      P = null; SL2.spinning = false;
      for (var k = 0; k < N; k++) SL2.reelSpinning[k] = false;
      try { slv2ClearAnticipation(); } catch(e){} spegniAttesa();
      var slvRoot = document.querySelector('.slv2'); if (slvRoot) slvRoot.classList.remove('is-spinning');
      try { slv2SetSpinButtonMode('spin'); } catch(e){}
      try { slv2EnableSpinIfIdle(); } catch(e){}
    }
  }
  XSL.salva = salva;
  setInterval(function(){
    if (!SCR || !SCR.classList.contains('active')) return;
    if (!(SL2.spinning || XSL.busy || P)) return;
    if (ora() - XSL.passo > 15000) salva('guardiano');
  }, 2000);
  sostituisci('slv2Init', function(){
    var inCorso = SL2.spinning || XSL.busy || P || SL2.fsActive || SL2.bonusWheelOpen || SL2.vaultOpen || SL2.fakeRevealActive;
    requestAnimationFrame(function(){ if (monta()) allinea(); });
    if (!inCorso) return ORIG.slv2Init.apply(this, arguments);
    try {
      slv2RenderPaytable();
      var disp = $('slv2-spin-bet'); if (disp) disp.textContent = '€' + SL2.bet.toFixed(2);
      slv2UpdateJackpotDisplay(); slv2StartJackpotPolling();
      if (typeof currentBet !== 'undefined') currentBet.slots = SL2.bet;
    } catch(e){ warn('init', e); }
  });
  function vinciEl(){ return SCR && SCR.querySelector('.xsl-vinci'); }
  function nascondiVinci(){ var v = vinciEl(); if (v) { v.classList.remove('on', 'big'); } }
  function fmt(x){ return '€' + x.toFixed(2); }
  function semplice(){ var s = SL2.srv; return !!(s && s.round && s.round.spins && s.round.spins.length === 1 && !s.round.wheel && !(s.round.fs_wheels || []).length); }
  function mostraVinci(importo, primo){
    var v = vinciEl(); if (!v || !(importo > 0)) return;
    var n = v.querySelector('.xsl-vinci-n'), l = v.querySelector('.xsl-vinci-l');
    var ratio = importo / (SL2.bet || 1);
    l.textContent = ratio >= 15 ? L('Mega vincita', 'Mega win') : ratio >= 5 ? L('Grande vincita', 'Big win') : L('Vinci', 'Win');
    var da = primo ? 0 : (v.__val || 0);
    v.__val = importo;
    v.classList.add('on'); v.classList.toggle('big', ratio >= 5);
    var ms = lite() ? 0 : Math.min(1600, 450 + 260 * Math.log(1 + ratio * 2));
    if (!ms) { n.textContent = fmt(importo); return; }
    var t0 = ora(), tok = (v.__tok = (v.__tok || 0) + 1), ult = 0;
    (function passo(){
      if (v.__tok !== tok) return;
      var u = Math.min(1, (ora() - t0) / ms), e = 1 - Math.pow(1 - u, 3);
      n.textContent = fmt(da + (importo - da) * e);
      if (u < 1 && ora() - ult > 60) { ult = ora(); try { if (window.GBX && GBX.sfx) GBX.sfx('count'); } catch(_){} }
      if (u < 1) requestAnimationFrame(passo); else n.textContent = fmt(importo);
    })();
  }
  function festaAperta(){ var c = $('slv2-celeb'); return !!(c && c.classList.contains('visible')); }
  function dopoFesta(fn){
    var t0 = ora();
    (function guarda(){ if (ora() - t0 > 450 && !festaAperta()) return fn(); if (ora() - t0 > 7000) return fn(); setTimeout(guarda, 150); })();
  }
  function premio(wins){
    if (!SCR || !wins || !wins.length) return;
    var primo = SL2.cascadeLevel === 0;
    var visti = {};
    wins.forEach(function(w){ (w.cells || []).forEach(function(c){
      var k = c.reel + ',' + c.row; if (visti[k]) return; visti[k] = 1;
      var st = $('slv2-strip-' + c.reel), el = st && st.children[SL2.positions[c.reel] + (c.row - 1)];
      if (el) { el.classList.remove('xsl-pop'); void el.offsetWidth; el.style.animationDelay = (c.reel * 55) + 'ms'; el.classList.add('xsl-pop'); }
    }); });
    var importo = SL2.cascadeWinTotal || 0, ratio = importo / (SL2.bet || 1);
    if (primo) XSL.ultimoServer = null;
    if (primo && ratio >= 5) dopoFesta(function(){
      mostraVinci((!SL2.srvMode && XSL.ultimoServer != null) ? XSL.ultimoServer : (SL2.cascadeWinTotal || importo), true);
    });
    else if (!(primo === false && festaAperta())) mostraVinci(importo, primo);
    if (primo) {
      var grid = $('slv2-reels');
      var n = ratio < 1 ? 6 : ratio < 3 ? 12 : ratio < 5 ? 22 : 14;
      if (lite()) n = Math.min(n, 6);
      try { if (window.GBX && GBX.sparks && grid) GBX.sparks(grid, n, ratio >= 5 ? ['#fff', '#ffd27a', '#8f86f2', '#cdc7ff'] : ['#f4f4f6', '#8f86f2', '#cdc7ff']); } catch(e){}
      hap(ratio >= 5 ? 'heavy' : 'medium');
      if (ratio >= 5 && !lite()) { var cab = SCR.querySelector('.slv2-cabinet'); if (cab) { cab.classList.remove('xsl-boom'); void cab.offsetWidth; cab.classList.add('xsl-boom'); } }
    }
  }
  function avvolgi(nome, dopo, prima){
    var f = window[nome]; if (typeof f !== 'function') return;
    var w = function(){
      if (prima) { try { prima.apply(this, arguments); } catch(e){ warn(nome + ' prima', e); } }
      var r = f.apply(this, arguments);
      if (dopo) { try { dopo.apply(this, arguments); } catch(e){ warn(nome, e); } }
      return r;
    };
    for (var k in f) { try { if (Object.prototype.hasOwnProperty.call(f, k)) w[k] = f[k]; } catch(e){} }
    window[nome] = w;
  }
  avvolgi('slv2RenderWins', function(wins){ segna(); premio(wins); });
  avvolgi('slv2CascadeStep', function(){ segna(); });
  avvolgi('slv2FinishSpin', function(){ segna(); });
  avvolgi('slv2ProcessSpinResult', function(){
    segna();
    if (!(SL2.cascadeWinTotal > 0) && SCR && !lite()) {
      var g = $('slv2-reels'); if (g) { g.classList.remove('xsl-perso'); void g.offsetWidth; g.classList.add('xsl-perso'); }
    }
  });
  avvolgi('slv2SrvReconcile', null, function(){
    var s = SL2.srv; if (!SL2.srvMode || !s || s.jackpot || s.wonCent == null) return;
    var lw = $('slv2-last-win'); if (!lw) return;
    XSL.ultimoServer = s.wonCent / 100;
    if (s.wonCent > 0) { lw.className = 'slv2-stat-val win'; lw.textContent = '+€' + (s.wonCent / 100).toFixed(2); var v = vinciEl(); if (v && v.classList.contains('on')) mostraVinci(s.wonCent / 100, false); }
    else { lw.className = 'slv2-stat-val lose'; lw.textContent = '-€' + (s.bet || SL2.bet).toFixed(2); }
  });
  XSL.occupato = function(){ var m = false; for (var i = 0; i < N; i++) if (R[i] && R[i].fase && R[i].fase !== 'fermo') m = true; return XSL.busy || !!P || m; };
  XSL.stato = function(){ return { busy: XSL.busy, piano: P ? { att: Object.keys(P.att), slam: P.slam, fatto: P.fatto } : null,
    rulli: R.map(function(r){ return r ? { fase: r.fase, y: r.y, T: r.T, cmd: r.cmd, imp: r.imp, modo: r.modo } : null; }) }; };
  monta();
})();
;
(function(){
  'use strict';
  if (window.XSS) return;
  var XSS = window.XSS = { on: true, tap: 0, passa: false, da: 'duel', modo: 'm2', posta: 'gratis', guida: null, ultimo: null };
  var D = document;
  function L(it, en){ return (window.GB_LANG === 'en') ? en : it; }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function fx(n){ try { if (window.GBX && GBX.fx) GBX.fx(n); } catch(e){} }
  function sfx(n, h){ try { if (window.GBX) { if (GBX.sfx) GBX.sfx(n); if (h && GBX.hap) GBX.hap(h); } } catch(e){} }
  function soldiT(t){ t = Number(t) || 0; return '€' + (t < 1 ? t.toFixed(2) : (Math.round(t) === t ? String(t) : t.toFixed(2))); }
  var MODI = [
    { k:'m2',  n:2, sq:'',        it:'1 contro 1',         en:'1 vs 1',        sit:'Duello secco: tre vite a testa.',            sen:'A straight duel: three lives each.' },
    { k:'m22', n:4, sq:'squadre', it:'2 contro 2',         en:'2 vs 2',        sit:'Squadre da due: vince la coppia che resta.', sen:'Teams of two: last pair standing wins.' },
    { k:'m3',  n:3, sq:'',        it:'Rissa a 3',          en:'3-way brawl',   sit:'Tre lottatori, nessuna alleanza.',           sen:'Three fighters, no alliances.' },
    { k:'m4',  n:4, sq:'',        it:'Tutti contro tutti', en:'Free for all',  sit:'Quattro sul palco. Caos puro.',               sen:'Four on stage. Pure chaos.' }
  ];
  function modo(k){ for (var i = 0; i < MODI.length; i++) if (MODI[i].k === k) return MODI[i]; return MODI[0]; }
  function cartaSel(m){
    return '#gt .gt-modo[data-n="' + m.n + '"]' + (m.sq ? '[data-modo="squadre"]' : ':not([data-modo])');
  }
  var SVG = {
    mira:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".9"/>',
    tempo:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9.5 2.5h5"/>',
    stella:'<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
    cassa:'<path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/>',
    joystick:'<rect x="3" y="13.5" width="18" height="7" rx="3"/><path d="M12 13.5V8.5"/><circle cx="12" cy="6" r="2.5"/>',
    coppa:'<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v1.5A3.5 3.5 0 0 0 7.5 11M17 6h3v1.5A3.5 3.5 0 0 1 16.5 11M12 14v4M8.5 20.5h7"/>',
    persone:'<circle cx="9" cy="8.5" r="3.2"/><path d="M3 19.5c.8-3.3 3.2-5 6-5s5.2 1.7 6 5"/><circle cx="17" cy="9.5" r="2.5"/><path d="M16.5 14.6c2.3.2 3.9 1.7 4.5 4.4"/>',
    spade:'<path d="M5 4.5l3.6.6 10.3 10.3-3 3L5.6 8.1z"/><path d="M19 4.5l-3.6.6L5.1 15.4l3 3L18.4 8.1z"/><path d="M6.5 17.5l-2 2M17.5 17.5l2 2"/>',
    fulmine:'<path d="M13 2.5 5 13.5h6l-1 8 8-11h-6z"/>',
    scudo:'<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8 7.5 9.5 4.3-1.5 7.5-4.9 7.5-9.5V6z"/>',
    dito:'<path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10m0-1.5a1.5 1.5 0 0 1 3 0V11m0-1a1.5 1.5 0 0 1 3 0v4.5a5.5 5.5 0 0 1-5.5 5.5h-.5a5 5 0 0 1-4.2-2.3L5.6 14a1.5 1.5 0 0 1 2.4-1.8L9 13.5"/>',
    curva:'<path d="M4 19c1.5-8 6-12.5 15-13"/><path d="M15.5 3 19 6l-3.5 3"/>',
    rimbalzo:'<path d="M3 5l6.5 13L14 9l7 9"/><circle cx="14" cy="5" r="1.6"/>',
    libro:'<path d="M4 5.5c3-1.3 5.7-1.3 8 .5 2.3-1.8 5-1.8 8-.5v13c-3-1.3-5.7-1.3-8 .5-2.3-1.8-5-1.8-8-.5z"/><path d="M12 6v13"/>',
    robot:'<rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 8V4.5M9.5 13h.01M14.5 13h.01M9.5 16h5"/>',
    moneta:'<circle cx="12" cy="12" r="8.5"/><path d="M14.6 9.3a3 3 0 1 0 0 5.4M8 11h5M8 13h5"/>',
    play:'<path d="M8 5.5v13l10-6.5z"/>'
  };
  function ic(k, liscia){ return '<span class="xa-ri' + (liscia ? ' xa-ri--l' : '') + '" aria-hidden="true"><svg viewBox="0 0 24 24" aria-hidden="true">' + (SVG[k] || SVG.stella) + '</svg></span>'; }
  function riga(k, t, s){ return '<div class="xa-ap-r">' + ic(k) + '<span class="xa-ap-rt"><b>' + esc(t) + '</b><span>' + esc(s) + '</span></span></div>'; }
  function regoleBrevi(){
    return [
      ['mira', L('Buttali fuori', 'Knock them out'), L('Ogni colpo alza la percentuale: più è alta, più voli lontano. Chi esce dallo schermo perde una vita.', 'Every hit raises your percentage: the higher it is, the farther you fly. Leave the screen and you lose a life.')],
      ['tempo', L('3 vite, 4 minuti', '3 lives, 4 minutes'), L('Vince l’ultimo in piedi. A tempo scaduto conta chi ha più vite, poi la percentuale più bassa.', 'Last one standing wins. When time runs out the most lives wins, then the lowest percentage.')],
      ['stella', L('Speciali e ULTI', 'Specials and ULTI'), L('4 speciali per lottatore. Rompi la fiche che vaga per l’arena: si accende la tua ULTI, un colpo imparabile.', '4 specials per fighter. Break the chip floating around the arena: your ULTI lights up, an unblockable blow.')],
      ['cassa', L('Oggetti', 'Items'), L('Fiche esplosiva e dado: ATTACCO per raccoglierli e lanciarli.', 'Explosive chip and die: ATTACK to pick them up and throw them.')]
    ];
  }
  function regoleTutte(){
    var en = window.GB_LANG === 'en';
    var partita = [
      ['joystick', L('I comandi', 'The controls'), L('Levetta per muoverti · ATTACCO, SPECIALE, SALTO, SCUDO · scatto della levetta + ATTACCO = SMASH · anche tastiera e gamepad', 'Stick to move · ATTACK, SPECIAL, JUMP, SHIELD · flick the stick + ATTACK = SMASH · keyboard and gamepad work too')],
      ['mira', L('Come si vince', 'How to win'), L('Ogni colpo alza la tua percentuale: più è alta, più voli lontano · chi esce dallo schermo perde una vita · vince l’ultimo in piedi', 'Every hit raises your percentage: the higher it is, the farther you fly · leave the screen and you lose a life · last one standing wins')],
      ['tempo', L('Vite e tempo', 'Lives and time'), L('3 vite, 4 minuti (5 nelle arene grandi) · a tempo scaduto vince chi ha più vite, poi la percentuale più bassa', '3 lives, 4 minutes (5 in the big arenas) · when time runs out the most lives wins, then the lowest percentage')],
      ['stella', L('La fiche', 'The chip'), L('Rompi la fiche che vaga per l’arena: si accende la tua ULTI, un colpo imparabile', 'Break the chip floating around the arena: your ULTI lights up, an unblockable blow')],
      ['coppa', L('Il premio', 'The prize'), L('Tutto al vincitore, 5% alla casa · chi vince lo decide il server', 'Everything to the winner, 5% to the house · the server decides who wins')]
    ];
    var modi = MODI.map(function(m){ return ['persone', en ? m.en : m.it, en ? m.sen : m.sit]; });
    var G = en ? [
      ['joystick','Moving','Tilt the stick = walk (further = faster). Flick = dash, then run; quick left-right = dash dance. Turning while running = skid. Down = crouch.'],
      ['rimbalzo','Jumping','Tap JUMP = short hop, hold = full hop (3-4 frame jumpsquat). JUMP again in the air = air jump (some have two). Down in the air = fast fall.'],
      ['dito','Ground attacks','ATTACK standing = jab 1-2-3 (press again or hold: boxers do a rapid jab). Tilt + ATTACK = forward, up or down tilt.'],
      ['fulmine','Smash & charge','Flick the stick (centre to edge, fast) + ATTACK = SMASH. Hold ATTACK to charge it. The sweetspot (the tip, or close in for fist fighters) hits harder.'],
      ['fulmine','Dash attack','While running, ATTACK: everyone has their own. Punishable if it whiffs.'],
      ['curva','Aerials','5 aerials: neutral, forward, back (strong: turn around!), up, down (some downs are meteors). Landing mid-aerial = landing lag; at the start or the end = autocancel. Short hop + aerial = pressure.'],
      ['stella','Specials','SPECIAL alone, sideways, down, up: 4 unique moves. Up = recovery.'],
      ['scudo','Shield & dodges','Hold SHIELD = bubble that shrinks as it wears (break it and you’re stunned). SHIELD + side = roll, + down = spot dodge, in the air = air dodge (directional too, but an awkward landing).'],
      ['scudo','Perfect shield','Raise SHIELD right before the hit: flash, PERFECT SHIELD, the attacker is left open.'],
      ['dito','Grabs & throws','SHIELD + ATTACK = grab. While holding: ATTACK = pummel; stick = one of 4 throws. When grabbed, mash buttons and stick to break out sooner (longer at high %).'],
      ['mira','The ledge','You grab it automatically (briefly invincible). Toward the stage = climb, JUMP = leap, ATTACK = climb attack, SHIELD = roll in. Whoever arrives later steals the ledge. After 6 grabs in a row without landing it won’t hold you.'],
      ['curva','After a hit','The higher your %, the further you fly; hit hard enough and you tumble. Stick while flying = DI; flicks during hitlag = SDI. SHIELD on impact with floor or wall = tech (with a direction you roll). Lying down: ATTACK, roll or JUMP.'],
      ['joystick','Right stick (option)','In PAUSE turn on Smash with the right stick: a small stick by the buttons. Push it: on the ground a smash that way, in the air the aerial. Like the C-stick.'],
      ['spade','Stale moves','Spamming the same move weakens it: mix your attacks and they come back fresh.'],
      ['stella','Finisher chip & ULTI','A glowing chip appears and runs away: hit it until it breaks. Whoever breaks it has the ULTI READY: press SPECIAL with no direction (PC: K); with a direction you get the normal special. Hit hard and you lose it; it fades after 15 s.'],
      ['cassa','Items, clashes, walls','Explosive chip and die: ATTACK to pick up and throw. Two similar attacks cancel out. Ninja, Wolf and Lioness wall-jump.'],
      ['joystick','Keyboard and gamepad','Move WASD or arrows · Attack J · Special K · Jump Space · Shield L · Grab L + J · Pause Esc or P. Gamepad (Xbox names): A attack, B special, X or Y jump, LT/RT shield, LB/RB grab, START pause. Plug it in mid-match: the touch buttons go away.']
    ] : [
      ['joystick','Muoversi','Levetta inclinata = cammini (più la inclini, più vai). Spinta di scatto = scatto e poi corsa; avanti-indietro rapido = dash dance. Inversione in corsa = derapata. Giù = ti accovacci.'],
      ['rimbalzo','Saltare','Tocco di SALTO = salto corto, tenuto = salto pieno (lo stacco dura 3-4 fotogrammi). In aria di nuovo SALTO = salto in aria (alcuni ne hanno due). Giù in aria = caduta rapida.'],
      ['dito','Attacchi a terra','ATTACCO da fermo = jab 1-2-3 (premi di nuovo, o tienilo: i pugili fanno la raffica). Levetta inclinata + ATTACCO = colpo inclinato avanti, su o giù.'],
      ['fulmine','Smash e carica','Scatto della levetta (dal centro al bordo, di colpo) + ATTACCO = SMASH. Tieni ATTACCO per caricarlo: brilla, trema, e vola più lontano. Il punto dolce (la punta, o vicino al corpo per chi usa i pugni) fa più male.'],
      ['fulmine','Attacco in corsa','Mentre corri, ATTACCO: ognuno ha il suo. Lascia scoperti se va a vuoto.'],
      ['curva','Attacchi in aria','5 aerei: neutro, avanti, indietro (forte: girati!), su, giù (alcuni giù sono meteore che schiacciano). Atterrare durante l’aereo = qualche fotogramma bloccato; all’inizio o in coda = autocancel. Salto corto + aereo = pressione.'],
      ['stella','Speciali','SPECIALE da solo, di lato, in giù, in su: 4 mosse uniche. Su = risalita per tornare dal vuoto.'],
      ['scudo','Scudo e schivate','SCUDO tenuto = bolla che si consuma e rimpicciolisce (se si rompe resti stordito). SCUDO + lato = rotolata, + giù = schivata sul posto, in aria = schivata aerea (anche direzionale, ma atterri scomodo).'],
      ['scudo','Parata perfetta','Alza lo SCUDO appena prima del colpo: lampo, PARATA PERFETTA, e chi ti ha attaccato resta scoperto.'],
      ['dito','Prese e lanci','SCUDO + ATTACCO = presa. Mentre tieni: ATTACCO = colpetto; levetta = uno dei 4 lanci. Se ti prendono, agita tasti e levetta per liberarti prima (a % alta ci vuole di più).'],
      ['mira','Il bordo','Ti aggrappi da solo (un attimo invulnerabile). Verso il palco = sali, SALTO = balzo, ATTACCO = sali colpendo, SCUDO = rotola dentro. Chi arriva dopo ti ruba il bordo. Dopo 6 prese di fila senza toccare terra il bordo non ti tiene.'],
      ['curva','Dopo i colpi','Più % hai, più voli; oltre una certa forza vai in volo scomposto. Levetta durante il volo = DI (pieghi la traiettoria); spinte durante il fermo del colpo = SDI. SCUDO all’impatto col suolo o col muro = tech (con una direzione rotoli). A terra: ATTACCO, rotolata o SALTO.'],
      ['joystick','Levetta destra (opzione)','In PAUSA attiva Smash con la levetta destra: una piccola levetta accanto ai tasti. Spingila: a terra fa lo smash in quella direzione, in aria l’aereo. Come la C-stick.'],
      ['spade','Mosse ripetute','La stessa mossa usata di continuo perde forza: varia gli attacchi e tornano piene.'],
      ['stella','Fiche finisher e ULTI','Ogni tanto appare una grande fiche luminosa che scappa: colpiscila finché si rompe. Chi la rompe ha l’ULTI PRONTA: premi SPECIALE senza direzione (PC: K); con una direzione esce la speciale normale. Se ti colpiscono forte la perdi; dopo 15 s si spegne.'],
      ['cassa','Oggetti, scontri, muri','Fiche esplosiva e dado: ATTACCO per raccoglierli e lanciarli. Due colpi di forza simile si annullano. Ninja, Lupo e Leonessa saltano sul muro.'],
      ['joystick','Tastiera e gamepad','Muoversi WASD o frecce · Attacco J · Speciale K · Salto Spazio · Scudo L · Presa L + J · Pausa Esc o P. Gamepad (nomi Xbox): A attacco, B speciale, X o Y salto, LT/RT scudo, LB/RB presa, START pausa. Si collega anche a metà partita: i tasti a tocco spariscono.']
    ];
    var note = [
      L('Online a soldi: chi vince prende il piatto meno il 5%. Pareggio perfetto o tavolo non pieno: posta rimborsata.', 'Online for money: the winner takes the pot minus 5%. Perfect tie or table not filled: stakes back.'),
      L('2 contro 2 a soldi: squadre a caso in coda, la coppia che vince si divide il piatto meno il 5%.', '2 vs 2 for money: random teams in the queue, the winning pair splits the pot minus 5%.'),
      L('Gratis: partite online vere, senza posta. Contro i bot e Allenamento: offline, solo per allenarti.', 'Free: real online matches, no stake. Vs bots and Training: offline, just to practise.')
    ];
    return { partita: partita, modi: modi, guida: G, note: note };
  }
  function occupato(){
    try {
      if (typeof RTD === 'undefined') return true;
      if (RTD.ui === 'match' || RTD.ui === 'search' || RTD.tour || RTD.spec) return true;
      if (typeof GSRT_CQ !== 'undefined' && GSRT_CQ) return true;
      if (typeof GSRT_RIV !== 'undefined' && GSRT_RIV && GSRT_RIV.stato !== 'fine') return true;
      if (typeof GSRT !== 'undefined' && GSRT.aperto) return true;
    } catch(e){ return true; }
    return false;
  }
  function fasce(){ try { return GSSOLDI.fasce().map(String); } catch(e){ return ['0.5','1','2','5','10','20','50']; } }
  function saldo(){ try { return Number(GSSOLDI.saldo()) || 0; } catch(e){ return 0; } }
  function infoGioco(){
    try { var gs = (window.XA && XA._D && XA._D.giochi) || []; for (var i = 0; i < gs.length; i++) if (gs[i].id === 'smash') return gs[i]; } catch(e){}
    return null;
  }
  var scr = null, body = null;
  function schermata(){
    if (scr && scr.isConnected) return scr;
    scr = D.createElement('div');
    scr.id = 'xss'; scr.className = 'screen xa-fr xa-ap-scr xss-scr';
    scr.innerHTML = '<div class="game-hdr"><button class="back-btn" type="button" aria-label="Indietro">←</button><div class="game-title">Gambler Smash</div><div class="game-bal" id="xss-bal">€0.00</div></div>' +
      '<div class="game-content xa-ap-on" id="xss-body"></div>';
    var arc = D.getElementById('arc');
    if (arc && arc.parentNode) arc.parentNode.insertBefore(scr, arc.nextSibling); else D.body.appendChild(scr);
    body = scr.querySelector('#xss-body');
    scr.querySelector('.back-btn').addEventListener('click', indietro);
    clonaCss();
    try { new MutationObserver(saldoTesta).observe(D.getElementById('arc-bal'), { childList:true, characterData:true, subtree:true }); } catch(e){}
    return scr;
  }
  function saldoTesta(){ var a = D.getElementById('arc-bal'), b = D.getElementById('xss-bal'); if (a && b && b.textContent !== a.textContent) b.textContent = a.textContent; }
  function indietro(){
    fx('back');
    var d = XSS.da; if (!d || d === 'xss' || d === 'arc' || !D.getElementById(d)) d = 'duel';
    go(d);
  }
  var RE_IS = /:is\(\s*#arc\s*,[^)]*\)/g;
  function pezzi(sel){
    var out = [], d = 0, s = 0;
    for (var i = 0; i < sel.length; i++) { var c = sel.charAt(i); if (c === '(') d++; else if (c === ')') d--; else if (c === ',' && !d) { out.push(sel.slice(s, i)); s = i + 1; } }
    out.push(sel.slice(s)); return out;
  }
  function clonaCss(){
    if (D.getElementById('xss-clone')) return;
    var testo = [];
    var giro = function(rules, dentro){
      for (var i = 0; i < rules.length; i++) {
        var r = rules[i];
        if (r.type === 1 && r.selectorText && r.selectorText.indexOf('#arc') >= 0 && /xa-fr|xa-ap-scr/.test(r.selectorText)) {
          var nuovi = pezzi(r.selectorText).filter(function(p){ RE_IS.lastIndex = 0; return RE_IS.test(p) && /xa-fr|xa-ap-scr/.test(p); })
            .map(function(p){ RE_IS.lastIndex = 0; return p.replace(RE_IS, '#xss').trim(); });
          if (nuovi.length) testo.push((dentro ? dentro + '{' : '') + nuovi.join(',') + '{' + r.style.cssText + '}' + (dentro ? '}' : ''));
        } else if (r.type === 4 && r.cssRules) giro(r.cssRules, '@media ' + r.media.mediaText);
      }
    };
    var ss = D.styleSheets;
    for (var i = 0; i < ss.length; i++) { var n = ss[i].ownerNode; if (!n || n.id !== 'gbx-css') continue; try { giro(ss[i].cssRules, ''); } catch(e){} }
    var st = D.createElement('style'); st.id = 'xss-clone'; st.textContent = testo.join('\n');
    D.head.appendChild(st);
    XSS.regoleCopiate = testo.length;
  }
  function disegna(){
    schermata(); saldoTesta();
    var m = modo(XSS.modo), fs = fasce(), en = window.GB_LANG === 'en';
    if (XSS.posta !== 'gratis' && fs.indexOf(XSS.posta) < 0) XSS.posta = 'gratis';
    var gr = XSS.posta === 'gratis', p = gr ? 0 : parseFloat(XSS.posta), sal = saldo(), basta = gr || sal >= p - 1e-9;
    var gi = infoGioco(), meta = [];
    meta.push('<span>' + esc(gi && gi.dur ? gi.dur : '~4 min') + '</span>');
    if (gi && gi.dat) meta.push('<span class="tw-dat" data-g="' + esc(gi.dat.g) + '" data-d="' + esc(gi.dat.d) + '" data-l="' + esc(gi.dat.l) + '"><b>' + esc(gi.dat.d) + '</b><span>' + esc(gi.dat.l) + '</span></span>');
    else meta.push('<span>' + L('2–4 giocatori', '2–4 players') + '</span>');
    var h = '';
    h += '<div class="xa-ap-ban" aria-hidden="true"><img class="xa-ap-bi" src="gbx_pv_smash.webp" alt=""><img class="xa-ap-bb" src="gbx_bn_smash.webp" alt="" decoding="async"></div>';
    h += '<div class="xa-ap-hd"><span class="xa-ap-ic"><img src="gbx_pv_smash.webp" alt="" width="64" height="64" decoding="async"></span><div class="xa-ap-ht"><h1>Gambler Smash</h1><p>' + L('Picchiaduro: buttali fuori', 'Brawler: knock them out') + '</p><small class="xa-ap-meta">' + meta.join('') + '</small></div></div>';
    h += '<h2 class="xa-ap-sez">' + L('Modalità', 'Mode') + '</h2><div class="xa-ap-seg xss-modi" role="radiogroup">' +
      MODI.map(function(x){ var s = x.k === m.k; return '<button type="button" data-xss-modo="' + x.k + '" class="' + (s ? 'sel' : '') + '" role="radio" aria-checked="' + s + '">' + esc(en ? x.en : x.it) + '</button>'; }).join('') + '</div>';
    h += '<p class="xa-ap-info xss-modo-s">' + esc(en ? m.sen : m.sit) + '</p>';
    h += '<h2 class="xa-ap-sez">' + L('Come si gioca', 'How to play') + '</h2><div class="xa-ap-grp">';
    regoleBrevi().forEach(function(r){ h += riga(r[0], r[1], r[2]); });
    h += '<button type="button" class="xa-ap-r xa-ap-more" data-xss="regole">' + ic('libro', 1) + '<span class="xa-ap-rt"><b>' + L('Regole complete', 'Full rules') + '</b></span></button></div>';
    h += '<div class="xa-ap-grp xa-ap-grp2">' +
      '<button type="button" class="xa-ap-r xa-ap-more" data-xss="pers">' + ic('persone', 1) + '<span class="xa-ap-rt"><b>' + L('Personaggi', 'Fighters') + '</b><span>' + L('Storie, abilità e ULTI di ogni lottatore', 'Story, abilities and ULTI of every fighter') + '</span></span></button>' +
      '<button type="button" class="xa-ap-r xa-ap-more" data-xss="allena">' + ic('mira', 1) + '<span class="xa-ap-rt"><b>' + L('Allenamento', 'Training') + '</b><span>' + L('Vite infinite contro un bersaglio, con la lista delle mosse', 'Endless lives against a target, with the move list') + '</span></span></button>' +
      '<button type="button" class="xa-ap-r xa-ap-more" data-xss="guida">' + ic('play', 1) + '<span class="xa-ap-rt"><b>' + L('Guida animata', 'Animated guide') + '</b><span>' + L('Ogni mossa mostrata dal gioco, con i comandi', 'Every move shown by the game, with the controls') + '</span></span></button></div>';
    var posta = '<button type="button" class="xa-fi xa-fi--g' + (gr ? ' sel' : '') + '" data-xss-posta="gratis">' + L('Gratis', 'Free') + '</button>';
    fs.forEach(function(f){ var s = XSS.posta === f; posta += '<button type="button" class="xa-fi' + (s ? ' sel' : '') + '" data-xss-posta="' + esc(f) + '">' + soldiT(f) + '</button>'; });
    h += '<h2 class="xa-ap-sez">' + L('Posta', 'Stake') + '</h2><div class="xa-ap-fi">' + posta + '</div>';
    if (gr) h += '<p class="xa-ap-info">' + L('Online gratis · ', 'Online for free · ') + esc(en ? m.en : m.it) + L(' · nessuna posta', ' · no stake') + '</p>';
    else h += '<p class="xa-ap-info">' + L('Posta ', 'Stake ') + soldiT(p) + ' · ' + L('piatto fino a ', 'pot up to ') + soldiT(p * m.n) + ' · ' + L('saldo ', 'balance ') + '€' + sal.toFixed(2) + '</p>';
    if (!gr) h += '<p class="xa-ap-nota">' + (m.sq ? L('Squadre a caso · la coppia che vince si divide il piatto meno il 5% · pareggio o tavolo non pieno: posta rimborsata', 'Random teams · the winning pair splits the pot minus 5% · tie or table not filled: stakes back')
      : L('Chi vince prende il piatto meno il 5% · pareggio perfetto o tavolo non pieno: posta rimborsata', 'Winner takes the pot minus 5% · perfect tie or table not filled: stakes back')) + '</p>';
    var tasto = gr ? L('Gioca gratis', 'Play for free') : (basta ? L('Gioca', 'Play') + ' · ' + soldiT(p) : L('Saldo insufficiente', 'Balance too low'));
    h += '<div class="xa-ap-bar"><button type="button" class="xa-ap-go' + (basta ? '' : ' off') + '" data-xss="gioca">' + esc(tasto) + '</button>' +
      '<div class="xa-ap-sec"><button type="button" data-xss="bot">' + L('Allenati coi bot', 'Practice with bots') + '</button><button type="button" data-xss="lobby">' + L('Crea una lobby', 'Create a lobby') + '</button></div></div>';
    var ap = D.createElement('div'); ap.className = 'xa-ap xss-ap'; ap.innerHTML = h;
    var bb = ap.querySelector('.xa-ap-bb'), ban = ap.querySelector('.xa-ap-ban'), ok = (window.XA && XA.img) ? XA.img['gbx_bn_smash.webp'] : null;
    if (ok === true) ban.classList.add('xa-ap-ban--ok');
    bb.addEventListener('load', function(){ try { XA.img['gbx_bn_smash.webp'] = true; } catch(e){} ban.classList.add('xa-ap-ban--ok'); }, { once:true });
    bb.addEventListener('error', function(){ bb.remove(); }, { once:true });
    ap.addEventListener('click', clic);
    var vec = body.querySelector(':scope > .xa-ap'), st = body.scrollTop;
    if (vec) vec.replaceWith(ap); else body.appendChild(ap);
    body.scrollTop = st;
    XSS.ultimo = { modo: m.k, posta: XSS.posta, gratis: gr, basta: basta };
  }
  function ridisegna(){ if (scr && scr.classList.contains('active')) disegna(); }
  function apri(da){
    XSS.da = da || 'duel';
    XSS.modo = XSS.modo || 'm2';
    XSS.posta = 'gratis';
    try { var mm = localStorage.getItem('xss_modo'); if (mm && modo(mm).k === mm) XSS.modo = mm; } catch(e){}
    disegna();
    try { var pr = GSSOLDI.aggiorna && GSSOLDI.aggiorna(); if (pr && pr.then) pr.then(ridisegna, function(){}); } catch(e){}
    if (body) body.scrollTop = 0;
  }
  XSS.apri = function(da){ schermata(); apri(da || (typeof CUR !== 'undefined' ? CUR : 'duel')); go('xss'); };
  window.addEventListener('click', function(e){
    var t = e.target && e.target.closest ? e.target.closest('[onclick]') : null;
    if (t && /RTD_GAME\s*=\s*['"]smash['"]/.test(t.getAttribute('onclick') || '')) XSS.tap = Date.now();
  }, true);
  function avvolgi(){
    if (typeof window.go !== 'function' || window.go.__xss) return;
    var prima = window.go;
    var nuovo = function(id){
      if (id === 'arc' && XSS.on && !XSS.passa && window.RTD_GAME === 'smash' && Date.now() - XSS.tap < 1500 && !occupato() && D.getElementById('arc')) {
        XSS.tap = 0;
        window.RTD_GAME = null;
        var da = (typeof CUR !== 'undefined') ? CUR : 'duel';
        try { schermata(); apri(da); } catch(err){ try { console.warn('XSS', err); } catch(_){} window.RTD_GAME = 'smash'; return prima.apply(this, arguments); }
        return prima.call(this, 'xss');
      }
      return prima.apply(this, arguments);
    };
    nuovo.__xss = 1;
    if (prima.__gbx) nuovo.__gbx = prima.__gbx;
    if (prima.__xm) nuovo.__xm = prima.__xm;
    try { window.go = nuovo; } catch(e){}
  }
  avvolgi();
  function clic(e){
    var t = e.target.closest('[data-xss], [data-xss-modo], [data-xss-posta]'); if (!t) return;
    var mo = t.getAttribute('data-xss-modo'), po = t.getAttribute('data-xss-posta'), a = t.getAttribute('data-xss');
    if (mo) { if (mo !== XSS.modo) { XSS.modo = mo; try { localStorage.setItem('xss_modo', mo); } catch(_){} sfx('tick', 'sel'); disegna(); } return; }
    if (po) { if (po !== XSS.posta) { XSS.posta = po; sfx('chip', 'light'); disegna(); } return; }
    if (a === 'regole') { regolePagina(); return; }
    if (a === 'gioca') { gioca(t); return; }
    if (a === 'bot') { nelGioco(['gioca', 'modo', 'bot']); return; }
    if (a === 'lobby') { lobby(); return; }
    if (a === 'pers') { nelGioco(['pers']); return; }
    if (a === 'allena') { nelGioco(['allena']); return; }
    if (a === 'guida') { nelGioco(['opz', 'guida']); return; }
  }
  function avviso(it, en){
    try { if (typeof gsrtCodaAvviso === 'function' && typeof GSRT !== 'undefined' && GSRT.wrap && GSRT.wrap.style.display === 'block') { gsrtCodaAvviso(L(it, en), 4000); return; } } catch(e){}
    try { toast(L(it, en), 'err', 2600); } catch(e){}
  }
  function preseleziona(){
    var gr = XSS.posta === 'gratis';
    try { localStorage.setItem('gs_mg_soldi', gr ? '0' : '1'); if (!gr) localStorage.setItem('gs_mg_posta', XSS.posta); } catch(e){}
    try { if (!gr) RTD.tier = XSS.posta; } catch(e){}
  }
  function apriSmash(){
    XSS.passa = true;
    try { window.RTD_GAME = 'smash'; go('arc'); } finally { XSS.passa = false; }
    var ok = false; try { ok = !!(GSRT.wrap && GSRT.wrap.style.display === 'block' && GSRT.menu); } catch(e){}
    return ok;
  }
  function gioca(btn){
    var gr = XSS.posta === 'gratis', m = modo(XSS.modo);
    if (!gr && saldo() < parseFloat(XSS.posta) - 1e-9) { sfx('soft'); avviso('Saldo insufficiente per questa posta.', 'Balance too low for this stake.'); return; }
    if (occupato()) { avviso('Sei già a un tavolo o in coda.', 'You are already at a table or in the queue.'); return; }
    fx('open'); preseleziona();
    if (!apriSmash()) { avviso('Gambler Smash non si è aperto: riprova.', 'Gambler Smash did not open: try again.'); return; }
    var r = 'x';
    try { r = GSSOLDI.gioca(gr ? 'gratis' : XSS.posta, m.sq, m.sq ? 0 : m.n); } catch(e){ r = 'x'; }
    XSS.esito = r;
    if (r === 'saldo') avviso('Saldo insufficiente per questa posta.', 'Balance too low for this stake.');
    else if (r === 'posta') avviso('Aggiorna la mini app: coda non disponibile.', 'Update the mini app: queue not available.');
    else if (r !== 'ok') avviso('Sei già a un tavolo o in coda.', 'You are already at a table or in the queue.');
    if (r === 'ok') guida(['gioca', 'modo']);
  }
  function lobby(){
    var gr = XSS.posta === 'gratis', m = modo(XSS.modo);
    if (!gr && saldo() < parseFloat(XSS.posta) - 1e-9) { sfx('soft'); avviso('Saldo insufficiente per questa posta.', 'Balance too low for this stake.'); return; }
    fx('open'); preseleziona();
    var ok = false;
    try { ok = GSSOLDI.crea(gr, m.n, m.sq); } catch(e){ ok = false; }
    if (!ok) { avviso('Sei già a un tavolo o in coda.', 'You are already at a table or in the queue.'); return; }
    try { LOB.from = 'xss'; } catch(e){}
  }
  function nelGioco(passi){
    if (occupato()) { avviso('Sei già a un tavolo o in coda.', 'You are already at a table or in the queue.'); return; }
    fx('open'); preseleziona();
    if (!apriSmash()) { avviso('Gambler Smash non si è aperto: riprova.', 'Gambler Smash did not open: try again.'); return; }
    guida(passi);
  }
  var SEL = {
    gioca: function(){ return '#gt [data-gt="gioca"]'; },
    modo:  function(){ return cartaSel(modo(XSS.modo)); },
    bot:   function(){ return '#gt [data-mg-bot]'; },
    pers:  function(){ return '#gt [data-gt="pers"]'; },
    allena:function(){ return '#gt [data-gt="allena"]'; },
    opz:   function(){ return '#gt [data-gt="opz"]'; },
    guida: function(){ return '#gt [data-gt="guida"]'; }
  };
  function docGioco(){ try { return GSRT.fr && GSRT.fr.contentDocument; } catch(e){ return null; } }
  function fermo(){
    try {
      if (typeof CUR !== 'undefined' && CUR !== 'arc') return true;
      if (!GSRT.wrap || GSRT.wrap.style.display !== 'block' || GSRT.aperto || RTD.ui === 'match') return true;
      var d = docGioco(); if (d && d.body && d.body.classList.contains('gs-tavolo')) return true;
    } catch(e){ return true; }
    return false;
  }
  function guida(passi){
    var giro = XSS.guida = { passi: passi.slice(), i: 0, t0: Date.now(), volte: 0, fatto: [], prima: null, attesa: 0 };
    var tic = function(){
      if (XSS.guida !== giro) return;
      if (fermo() || Date.now() - giro.t0 > 20000) { giro.fine = fermo() ? 'fermo' : 'tempo'; return; }
      var d = docGioco(), k = giro.passi[giro.i];
      if (!k) { giro.fine = 'ok'; return; }
      var el = d && d.querySelector(SEL[k]());
      if (el) {
        try { el.click(); } catch(e){}
        giro.fatto.push(k); giro.volte++; giro.i++;
        if (giro.i >= giro.passi.length) { giro.fine = 'ok'; return; }
        giro.attesa = Date.now(); giro.prima = el;
        setTimeout(tic, 200); return;
      }
      if (giro.prima && giro.prima.isConnected && Date.now() - giro.attesa > 1500 && giro.volte < 8) {
        try { giro.prima.click(); } catch(e){}
        giro.attesa = Date.now(); giro.volte++;
      }
      setTimeout(tic, 120);
    };
    setTimeout(tic, 60);
  }
  function regolePagina(){
    var R = regoleTutte();
    var grp = function(rr){ return '<div class="xa-ap-grp">' + rr.map(function(r){ return riga(r[0], r[1], r[2]); }).join('') + '</div>'; };
    var o = D.createElement('div'); o.className = 'xa-sheet xss-regole';
    o.innerHTML = '<div class="xa-sheet-p" role="dialog" aria-modal="true"><div class="xa-sheet-h"><b>Gambler Smash</b><button type="button" class="xa-sheet-x">' + L('Fine', 'Done') + '</button></div>' +
      '<div class="xa-sheet-c">' + grp(R.partita) +
      '<h2 class="xa-ap-sez">' + L('Modalità', 'Modes') + '</h2>' + grp(R.modi) +
      '<h2 class="xa-ap-sez">' + L('Comandi e mosse', 'Controls and moves') + '</h2>' + grp(R.guida) +
      '<div class="xa-sheet-n">' + R.note.map(function(n){ return '<p>' + esc(n) + '</p>'; }).join('') + '</div></div></div>';
    var chiudi = function(){ o.classList.remove('on'); setTimeout(function(){ o.remove(); }, 260); fx('back'); };
    o.addEventListener('click', function(e){ if (e.target === o || e.target.closest('.xa-sheet-x')) chiudi(); });
    D.body.appendChild(o); requestAnimationFrame(function(){ o.classList.add('on'); });
    fx('open');
  }
})();
;
(function(){
  'use strict';
  if (window.XSN) return;
  var W = window;
  var XSN = W.XSN = { v: '1511n' };
  function qs(k){ try { var m = new RegExp('[?&]' + k + '=([^&#]*)').exec(location.search); return m ? decodeURIComponent(m[1]) : null; } catch(e){ return null; } }
  var SPENTO = qs('xsn') === '0';
  XSN.volume = 1;
  try { var vs = localStorage.getItem('gb_xsn_vol'); if (vs != null && !isNaN(+vs)) XSN.volume = +vs; } catch(e){}
  if (qs('xsn_vol') != null && !isNaN(+qs('xsn_vol'))) XSN.volume = +qs('xsn_vol');
  XSN.setVolume = function(v){ XSN.volume = Math.max(0, Math.min(1.5, +v || 0)); try { localStorage.setItem('gb_xsn_vol', String(XSN.volume)); } catch(e){}
    if (A.bus) try { A.bus.gain.setTargetAtTime(XSN.volume, A.c.currentTime, .02); } catch(e){} };
  try { if (W.XSN_AMBIENTE !== false && navigator.audioSession && navigator.audioSession.type === 'auto') navigator.audioSession.type = 'ambient'; } catch(e){}
  var KIT = {
    'tap':         { db: 0,   pr:1, gap:28, st:1,  dur:.06, g:4000 },
    'tick':        { db: 0,   pr:0, gap:30, st:1,  dur:.03, g:120000 },
    'count':       { db: 0,   pr:0, gap:55, st:.4, dur:.02, g:8000 },
    'seg':         { db: 0,   pr:1, gap:30, st:1,  dur:.06, g:4000 },
    'toggle-on':   { db: 0,   pr:1, gap:40, st:.6, dur:.11, g:4000 },
    'toggle-off':  { db: 0,   pr:1, gap:40, st:.6, dur:.11, g:4000 },
    'chip':        { db: 0,   pr:1, gap:35, st:1,  dur:.09, g:4000 },
    'pop':         { db: 0,   pr:1, gap:35, st:1,  dur:.08, g:4000 },
    'copy':        { db: 0,   pr:1, gap:80, st:.6, dur:.12, g:4000 },
    'swipe':       { db: 0,   pr:1, gap:60, st:1,  dur:.16, g:4000 },
    'open':        { db: 0,   pr:2, gap:60, st:.8, dur:.2,  g:4000 },
    'back':        { db: 0,   pr:2, gap:60, st:.8, dur:.18, g:4000 },
    'sheet-open':  { db: 0,   pr:2, gap:90, st:.6, dur:.24, g:4000 },
    'sheet-close': { db: 0,   pr:2, gap:90, st:.6, dur:.22, g:4000 },
    'success':     { db: 0,   pr:3, gap:250,st:.5, dur:.5,  g:120000 },
    'error':       { db: 0,   pr:3, gap:250,st:.5, dur:.32, g:120000 }
  };
  var CAL = {'back':-11.0, 'chip':-11.1, 'copy':-12.5, 'count':-4.0, 'error':-15.7, 'open':-12.8, 'pop':-12.0, 'seg':-10.5, 'sheet-close':-3.3, 'sheet-open':-5.4, 'success':-17.5, 'swipe':4.5, 'tap':-11.3, 'tick':-7.2, 'toggle-off':-10.6, 'toggle-on':-11.6};
  var FORMA = { 'tap':0, 'tick':-8, 'count':-15, 'seg':0, 'toggle-on':-1, 'toggle-off':-2, 'chip':-1, 'pop':-2, 'copy':-2,
                'swipe':-6, 'open':-2, 'back':-3, 'sheet-open':-5, 'sheet-close':-6, 'success':2, 'error':-1 };
  var ALIAS = { soft:'pop', toggle:'seg', err:'error', cash:'success', click:'tap', sheet:'sheet-open', close:'sheet-close',
                select:'tick', selezione:'tick', ok:'success', errore:'error', copia:'copy' };
  XSN.KIT = KIT; XSN.ALIAS = ALIAS; XSN.FORMA = FORMA; XSN.CAL = CAL;
  XSN.nomi = Object.keys(KIT);
  XSN.risolvi = function(n){ return KIT[n] ? n : (ALIAS[n] && KIT[ALIAS[n]] ? ALIAS[n] : null); };
  function fabbrica(c, dest, t0, k, rnd){
    var V = {};
    var NB = rumore(c, rnd);
    function env(g, at, a, peak, tau){
      var t = t0 + (at || 0);
      g.gain.setValueAtTime(0, t0); g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(peak, t + a);
      g.gain.setTargetAtTime(0, t + a, tau);
      return t + a + tau * 9;
    }
    V.modo = function(f, tau, peak, o){ o = o || {};
      var os = c.createOscillator(), g = c.createGain(), t = t0 + (o.at || 0);
      os.type = o.type || 'sine'; os.frequency.setValueAtTime(f * k, t0);
      if (o.to) os.frequency.exponentialRampToValueAtTime(o.to * k, t + (o.gt || tau * 2));
      var end = env(g, o.at, o.a || .0012, peak, tau);
      var n = os; if (o.lp) { var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = o.lp; lp.Q.value = .5; os.connect(lp); n = lp; }
      n.connect(g); g.connect(dest); os.start(t0); os.stop(end + .01); return end; };
    V.soffio = function(ft, f, q, tau, peak, o){ o = o || {};
      var s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(), t = t0 + (o.at || 0);
      s.buffer = NB; fl.type = ft; fl.frequency.setValueAtTime(f * (o.nk ? k : 1), t0); fl.Q.value = q;
      if (o.to) fl.frequency.exponentialRampToValueAtTime(o.to, t + (o.gt || tau * 4));
      var end = env(g, o.at, o.a || .0006, peak, tau);
      if (o.lp) { var l2 = c.createBiquadFilter(); l2.type = 'lowpass'; l2.frequency.value = o.lp; l2.Q.value = .4; s.connect(fl); fl.connect(l2); l2.connect(g); } else { s.connect(fl); fl.connect(g); }
      g.connect(dest); s.start(t0, (rnd() * .8)); s.stop(end + .01); return end; };
    return V;
  }
  var RUM = typeof WeakMap === 'function' ? new WeakMap() : null;
  function rumore(c, rnd){
    var b = RUM && RUM.get(c); if (b) return b;
    b = c.createBuffer(1, Math.floor(c.sampleRate * 1.6), c.sampleRate);
    var d = b.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = rnd() * 2 - 1;
    if (RUM) RUM.set(c, b); return b;
  }
  var R = {
    'tap': function(V){ V.soffio('bandpass', 3000, 1.3, .0022, .30);
      V.modo(1180, .011, .42); V.modo(2740, .0055, .16); V.modo(430, .016, .26, { to: 380 }); },
    'tick': function(V){ V.soffio('highpass', 6800, .7, .0011, .22); V.modo(4300, .0042, .34); V.modo(7900, .002, .08); },
    'count': function(V){ V.modo(5400, .0026, .30); V.soffio('highpass', 8000, .7, .0008, .10); },
    'seg': function(V){ V.soffio('bandpass', 4200, 1.8, .0018, .26);
      V.modo(1520, .0095, .40); V.modo(3420, .005, .15); V.modo(560, .013, .2); },
    'toggle-on': function(V){ V.soffio('bandpass', 3600, 1.5, .0016, .22);
      V.modo(960, .009, .32); V.modo(2300, .004, .10);
      V.modo(1440, .013, .38, { at:.034 }); V.modo(3350, .005, .12, { at:.034 }); V.soffio('bandpass', 4800, 2, .0014, .16, { at:.034 }); },
    'toggle-off': function(V){ V.soffio('bandpass', 3600, 1.5, .0016, .22);
      V.modo(1440, .009, .30); V.modo(3350, .004, .10);
      V.modo(900, .013, .36, { at:.034 }); V.modo(2100, .005, .10, { at:.034 }); V.soffio('bandpass', 2800, 2, .0014, .14, { at:.034 }); },
    'chip': function(V){ V.soffio('bandpass', 4300, 3, .0018, .30);
      V.modo(3180, .0095, .34); V.modo(5520, .0055, .16); V.modo(1240, .007, .10);
      V.modo(2960, .007, .18, { at:.027 }); V.modo(5150, .004, .08, { at:.027 }); V.soffio('bandpass', 4100, 3, .0012, .12, { at:.027 }); },
    'pop': function(V){ V.modo(540, .02, .46, { to: 1060, gt: .026, a: .0025 }); V.modo(2150, .005, .06, { at:.006 }); },
    'copy': function(V){ V.soffio('bandpass', 4600, 2, .0016, .2);
      V.modo(2380, .0085, .3); V.modo(5100, .004, .08);
      V.modo(3180, .012, .34, { at:.052 }); V.modo(6400, .004, .07, { at:.052 }); },
    'swipe': function(V){ V.soffio('bandpass', 900, 1.6, .03, .20, { a:.03, to: 2300, gt:.09, lp: 3400 }); },
    'open': function(V){ V.modo(640, .042, .34, { to: 700, gt:.05, a:.003 }); V.modo(1925, .018, .10, { a:.003 });
      V.modo(1290, .03, .06, { at:.018, a:.004 }); V.soffio('bandpass', 1500, 1.5, .022, .05, { a:.02, to: 2400, lp: 3400 }); },
    'back': function(V){ V.modo(600, .034, .32, { to: 520, gt:.05, a:.003 }); V.modo(1560, .013, .07, { a:.003 });
      V.soffio('bandpass', 2000, 1.5, .018, .045, { a:.015, to: 1100, lp: 3400 }); },
    'sheet-open': function(V){ V.soffio('bandpass', 520, 1.4, .045, .22, { a:.06, to: 1600, gt:.12, lp: 2800 });
      V.modo(330, .05, .10, { to: 440, gt:.1, a:.04, lp: 1200 }); V.modo(1320, .02, .03, { at:.07, a:.004 }); },
    'sheet-close': function(V){ V.soffio('bandpass', 1500, 1.4, .036, .20, { a:.03, to: 450, gt:.11, lp: 2800 });
      V.modo(440, .045, .09, { to: 330, gt:.09, a:.025, lp: 1200 }); },
    'success': function(V){
      V.modo(1046.5, .055, .30, { a:.003 }); V.modo(2093, .03, .05, { a:.003 }); V.modo(3140, .012, .025, { a:.003 });
      V.modo(1568, .06, .28, { at:.058, a:.003 }); V.modo(3136, .03, .04, { at:.058, a:.003 });
      V.modo(2093, .055, .16, { at:.114, a:.003 }); V.modo(523.25, .045, .06, { a:.006 }); },
    'error': function(V){ V.modo(466, .04, .34, { a:.004, lp: 1500 }); V.modo(932, .02, .05, { a:.004 });
      V.modo(370, .045, .34, { at:.085, a:.004, to: 349, gt:.1, lp: 1500 }); V.modo(740, .02, .04, { at:.085, a:.004 }); }
  };
  XSN.R = R;
  function livello(n){ return Math.pow(10, ((CAL[n] || 0) + (FORMA[n] || 0) + (KIT[n].db || 0)) / 20); }
  var A = { c:null, bus:null };
  function muto(){
    if (SPENTO) return true;
    try { if (typeof TWS !== 'undefined' && TWS && TWS.on === false) return true; } catch(e){}
    try { if (document.hidden) return true; } catch(e){}
    return false;
  }
  function ctx(){
    if (A.c) { try { if (A.c.state === 'suspended' || A.c.state === 'interrupted') A.c.resume(); } catch(e){} return A.c; }
    try {
      if (typeof TWS !== 'undefined' && TWS) { if (!TWS.ctx && TWS.init) TWS.init(); if (TWS.ctx) A.c = TWS.ctx; }
      if (!A.c) { var C = W.AudioContext || W.webkitAudioContext; if (!C) return null; A.c = new C({ latencyHint:'interactive' }); }
      var m = A.c.createGain(); m.gain.value = .55; m.connect(A.c.destination);
      A.bus = A.c.createGain(); A.bus.gain.value = XSN.volume; A.bus.connect(m);
      rumore(A.c, Math.random);
      if (A.c.state === 'suspended') A.c.resume();
    } catch(e){ A.c = null; A.bus = null; }
    return A.c;
  }
  XSN.ctx = function(){ return ctx(); };
  var G = { primo:false, ultimo:0 };
  function gesto(e){
    if (e && e.isTrusted === false) return;
    G.ultimo = performance.now();
    if (!G.primo && !muto()) {
      var c = ctx();
      if (c) { G.primo = true;
        try { var b = c.createBuffer(1, 1, c.sampleRate), s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0); } catch(x){} }
    } else if (A.c && A.c.state !== 'running') { try { A.c.resume(); } catch(x){} }
  }
  ['pointerdown','touchstart','touchend','mousedown','keydown','click','wheel'].forEach(function(ev){
    W.addEventListener(ev, gesto, { capture:true, passive:true });
  });
  XSN.gesto = G;
  var VOCI = [], ULT = {}, CONTA = { n:0, t:0 };
  var MAXV = 3;
  function pulisci(now){ for (var i = VOCI.length - 1; i >= 0; i--) if (VOCI[i].fine <= now) VOCI.splice(i, 1); }
  function ruba(v, now){ try { v.g.gain.cancelScheduledValues(now); v.g.gain.setValueAtTime(v.g.gain.value, now); v.g.gain.linearRampToValueAtTime(0, now + .008); } catch(e){} v.fine = now; }
  XSN.log = null;
  XSN.suona = function(n, o){
    o = o || {};
    n = XSN.risolvi(n); if (!n) return false;
    if (muto()) return false;
    var tp = performance.now(), K = KIT[n];
    if (!o.forza) {
      if (!G.primo) return false;
      if (tp - G.ultimo > K.g) return false;
    }
    if (ULT[n] && tp - ULT[n] < K.gap) return false;
    var c = ctx(); if (!c || !A.bus) return false;
    if (c.state !== 'running' && !o.forza) { try { c.resume(); } catch(e){} }
    var now = c.currentTime;
    pulisci(now);
    if (VOCI.length >= MAXV) {
      var basso = null; VOCI.forEach(function(v){ if (!basso || v.pr < basso.pr || (v.pr === basso.pr && v.t0 < basso.t0)) basso = v; });
      if (!basso || basso.pr > K.pr) return false;
      ruba(basso, now); VOCI.splice(VOCI.indexOf(basso), 1);
    }
    ULT[n] = tp;
    var semi = (Math.random() * 2 - 1) * K.st;
    if (n === 'count') { CONTA.n = (tp - CONTA.t < 260) ? Math.min(CONTA.n + 1, 14) : 0; CONTA.t = tp; semi += CONTA.n * .28; }
    var g = c.createGain(); g.gain.value = livello(n) * (o.vol == null ? 1 : o.vol); g.connect(A.bus);
    try { R[n](fabbrica(c, g, now, Math.pow(2, semi / 12), Math.random)); } catch(e){ return false; }
    VOCI.push({ n:n, pr:K.pr, g:g, t0:now, fine: now + K.dur });
    try { setTimeout(function(){ try { g.disconnect(); } catch(e){} }, (K.dur + .6) * 1000); } catch(e){}
    if (XSN.log) XSN.log.push({ n:n, t:tp, dt: performance.now() - tp, ev: o.ev, stato: c.state, ct: now });
    return true;
  };
  XSN.voci = function(){ if (A.c) pulisci(A.c.currentTime); return VOCI.length; };
  XSN.render = function(n, o){
    o = o || {}; n = XSN.risolvi(n) || n;
    var sr = o.sr || 48000, dur = o.dur || Math.max(.25, KIT[n].dur + .25);
    var OC = W.OfflineAudioContext || W.webkitOfflineAudioContext;
    var c = new OC(1, Math.ceil(sr * dur), sr);
    var seme = o.seme || 12345; function rnd(){ seme = (seme * 1103515245 + 12345) & 0x7fffffff; return seme / 0x7fffffff; }
    var m = c.createGain(); m.gain.value = .55; m.connect(c.destination);
    var b = c.createGain(); b.gain.value = o.volume == null ? 1 : o.volume; b.connect(m);
    var g = c.createGain(); g.gain.value = o.crudo ? 1 : livello(n); g.connect(b);
    R[n](fabbrica(c, g, o.at || 0, Math.pow(2, (o.semi || 0) / 12), rnd));
    return c.startRendering();
  };
  function aggancia(){
    var GBX = W.GBX; if (!GBX || GBX.__xsn) return !!GBX;
    GBX.__xsn = true;
    var sfxPrima = GBX.sfx;
    GBX.sfx = function(n, arg){
      var k = XSN.risolvi(n);
      if (k) { XSN.suona(k); return; }
      if (n === 'hover') return;
      return sfxPrima.apply(this, arguments);
    };
    var M = GBX.MAPPA || {};
    var H = { 'tick':'sel', 'count':null, 'seg':'sel', 'toggle-on':'light', 'toggle-off':'light', 'sheet-open':'light', 'sheet-close':'light',
              'success':'success', 'error':'error', 'copy':'light', 'select':'sel', 'ok':'success', 'errore':'error', 'copia':'light' };
    for (var h in H) if (!(h in M)) M[h] = H[h];
    GBX.suoni = XSN;
    return true;
  }
  if (!aggancia()) { var tent = 0, iv = setInterval(function(){ if (aggancia() || ++tent > 40) clearInterval(iv); }, 250); }
})();
;
(function(){
  'use strict';
  if (window.XN2) return;
  var XN2 = window.XN2 = { v: '20261115' };
  function L(it, en){ return window.GB_LANG === 'en' ? en : it; }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function mmss(s){ s = Math.max(0, Math.floor(+s || 0)); var m = Math.floor(s / 60), x = s % 60; return m + ':' + (x < 10 ? '0' : '') + x; }
  function svg(d, w){ return '<svg class="xn2-i" viewBox="0 0 24 24" width="' + (w || 16) + '" height="' + (w || 16) + '" aria-hidden="true"><path d="' + d + '" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>'; }
  var IC = {
    orologio: 'M12 7v5l3 2 M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
    spunta: 'M5 12.5l4.5 4.5L19 7.5',
    coppa: 'M8 4h8v5a4 4 0 0 1-8 0z M8 6H5v1a3 3 0 0 0 3 3 M16 6h3v1a3 3 0 0 1-3 3 M12 13v4 M8.5 20h7 M10 17h4',
    occhio: 'M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12z M12 14.8a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6z',
    su: 'M12 19V5 M6 11l6-6 6 6',
    chev: 'M9 6l6 6-6 6',
    biglietto: 'M4 8a2 2 0 0 0 0 4v4h16v-4a2 2 0 0 1 0-4V4H4z M14 4v12',
    pausa: 'M9 6v12 M15 6v12',
    persone: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z M2.5 20a6.5 6.5 0 0 1 13 0 M16 4.3a3.5 3.5 0 0 1 0 6.4 M18 14a5.5 5.5 0 0 1 3.5 6',
    avanza: 'M5 12h14 M13 6l6 6-6 6',
    aereo: 'M21 4L3 11l6 2.5L18 7l-7 7.5V20l3.5-4 4 3z'
  };
  XN2.ic = function(n, w){ return svg(IC[n] || '', w); };
  function base(){ try{ return typeof BACKEND !== 'undefined' ? BACKEND : ''; }catch(e){ return ''; } }
  function iniz(n){ var p = String(n || '?').replace(/[^A-Za-z0-9À-ÿ ]/g, ' ').trim().split(/\s+/); return ((p[0] || '?')[0] + ((p[1] || '')[0] || '')).toUpperCase(); }
  function fotoCanale(c){
    if (c && c.foto) return '<img class="xn2-cf" src="' + esc(base() + '/tournament/canale_foto/' + encodeURIComponent(c.id) + '.jpg?v=' + c.foto) + '" alt="" onerror="this.outerHTML=\'<b class=&quot;xn2-cf&quot;>' + esc(iniz(c.nome)) + '</b>\'">';
    return '<b class="xn2-cf">' + esc(iniz(c && c.nome)) + '</b>';
  }
  function canaliHTML(d){
    var cc = (d && d.canali) || [];
    if (!cc.length) return '';
    var h = '<div class="xn2-ci-gt">' + L('Canali del torneo', 'Tournament channels') + '</div><div class="xn2-grp">';
    cc.forEach(function(c, i){
      var sg = /^https:\/\/signal\.group\//.test(c.link || '');
      var tap = c.link ? ' onclick="event.stopPropagation();try{TCAN.entraDa(\'' + esc(String(d.id || '')) + '\',' + i + ')}catch(e){}"' : '';
      h += '<div class="xn2-row"' + tap + '>' + fotoCanale(c) + '<span class="xn2-row-t"><b>' + esc(c.nome) + '</b><span>' + (sg ? 'Signal' : 'Telegram') + '</span></span>'
        + (c.link ? '<span class="xn2-chev">' + XN2.ic('chev', 14) + '</span>' : '') + '</div>';
    });
    return h + '</div>';
  }
  function cifre(id, s){
    return '<div class="xn2-cd" data-xn2-cd="' + id + '"><span class="xn2-cd-v">' + mmss(s) + '</span></div>'
      + '<span id="' + id + '" class="xn2-nascosto">' + s + '</span>';
  }
  function ricopia(){
    ['trn-ci-cd', 'trn-im-cd'].forEach(function(id){
      var src = document.getElementById(id); if (!src) return;
      var box = document.querySelector('[data-xn2-cd="' + id + '"] .xn2-cd-v'); if (!box) return;
      var t = mmss(src.textContent); if (box.textContent !== t) box.textContent = t;
    });
  }
  XN2.ricopia = ricopia;
  var osCd = new MutationObserver(ricopia);
  function guardaCd(){
    ['trn-ci-cd', 'trn-im-cd'].forEach(function(id){
      var src = document.getElementById(id);
      if (src && !src.__xn2){ src.__xn2 = 1; osCd.observe(src, { childList: true, characterData: true, subtree: true }); }
    });
  }
  XN2.checkin = function(d){
    var s = trnCiSecs(d), dentro = d.registered && d.checked_in, manca = d.registered && !d.checked_in;
    var n = d.checkin_count || 0, tot = d.players_count || 0, pc = tot ? Math.min(100, Math.round(100 * n / tot)) : 0;
    var h = '<div class="xn2-ci' + (manca ? ' xn2-manca' : '') + (dentro ? ' xn2-dentro' : '') + '">'
      + '<div class="xn2-ci-k">' + XN2.ic('orologio', 15) + '<span>' + L('Conferma presenza', 'Check-in') + '</span></div>'
      + cifre('trn-ci-cd', s)
      + '<div class="xn2-cd-l">' + L('alla chiusura del check-in', 'until check-in closes') + '</div>';
    if (dentro){
      h += '<div class="xn2-ok">' + XN2.ic('spunta', 17) + '<span>' + L('Sei dentro', 'You are in') + '</span></div>'
        + '<div class="xn2-sub">' + L('Resta in questa schermata: appena scade il tempo si formano le lobby e qui ricevi il tuo match.', 'Stay on this screen: when time is up the lobbies are formed and your match arrives here.') + '</div>';
    } else if (manca){
      h += '<button class="xn2-bt" onclick="trnCheckin()">' + L('Sono presente', 'I’m here') + '</button>'
        + '<div class="xn2-sub">' + L('Le lobby si formano solo con chi conferma. Senza conferma resti fuori dal tabellone.', 'Lobbies are formed only with confirmed players. Without it you are left out of the bracket.') + '</div>';
    } else {
      h += '<div class="xn2-sub">' + L('Il torneo sta per cominciare. Non sei iscritto, ma puoi seguirlo da spettatore: i match in diretta compaiono qui appena partono.', 'The tournament is about to start. You are not registered, but you can watch: live matches appear here as soon as they start.') + '</div>';
    }
    h += '<div class="xn2-pres"><span>' + XN2.ic('persone', 15) + L('Presenti', 'Present') + '</span><b>' + n + '<i> ' + L('su', 'of') + ' ' + tot + '</i></b></div>'
      + '<div class="xn2-bar"><i style="width:' + pc + '%"></i></div>'
      + canaliHTML(d)
      + '</div>';
    return h;
  };
  XN2.ripesca = function(d){
    var r = d && d.ripescaggio;
    if (!r || r.stato === 'ripescato') return '';
    var h = '<div class="xn2-ci xn2-rip"><div class="xn2-ci-k">' + XN2.ic('biglietto', 15) + '<span>' + L('Ripescaggio', 'Second chance') + '</span></div>';
    if (r.stato === 'in_lista'){
      h += '<div class="xn2-big"><span class="xn2-big-v">' + esc(r.posizione || '?') + '</span><span class="xn2-big-d">/ ' + esc(r.in_lista || '?') + '</span></div>'
        + '<div class="xn2-cd-l">' + L('la tua posizione in lista', 'your place in the list') + '</div>';
      if (r.entra === true) h += '<div class="xn2-sub">Entri al <b>round ' + esc(r.round) + '</b>: c’è posto per te. Resta su questa pagina, il tasto Entra compare da solo.</div>';
      else if (r.entra === false && r.ultimo) h += '<div class="xn2-sub">Al round ' + esc(r.round) + ' non c’è posto e dopo resta solo la finale: questa volta il ripescaggio non ti fa entrare. Puoi seguire il torneo da spettatore.</div>';
      else if (r.entra === false) h += '<div class="xn2-sub">Al round ' + esc(r.round) + ' non c’è posto (i vincitori riempiono il tabellone). Resti in lista per il round successivo.</div>';
      else h += '<div class="xn2-sub">Entri al <b>round ' + esc(r.round) + '</b> se si libera un posto (un match deserto o un bye). Resta su questa pagina: il tasto Entra compare da solo.</div>';
    } else if (r.stato === 'puoi'){
      h += '<div class="xn2-tit">' + L('Il check-in è chiuso, ma non sei fuori', 'Check-in is closed, but you are not out') + '</div>'
        + '<button class="xn2-bt" onclick="trnCheckin()">' + L('Sono arrivato, mettimi in lista', 'I’m here, put me on the list') + '</button>'
        + '<div class="xn2-sub">' + L('Puoi rientrare dal round ', 'You can come back from round ') + esc(r.round || 2) + L(' se si libera un posto.', ' if a seat frees up.') + '</div>';
    } else {
      h += '<div class="xn2-sub">' + L('Il check-in è chiuso e il ripescaggio è finito: il torneo è alla finale. Puoi seguirlo da spettatore.', 'Check-in is closed and second chance is over: the tournament is at the final. You can watch it.') + '</div>';
    }
    return h + '</div>';
  };
  XN2.interm = function(d){
    var s = trnImSecs(d);
    if (s <= 0) return '';
    return '<div class="xn2-ci xn2-im"><div class="xn2-ci-k">' + XN2.ic('pausa', 15) + '<span>' + L('Pausa tra i round', 'Break between rounds') + '</span></div>'
      + cifre('trn-im-cd', s)
      + '<div class="xn2-cd-l">' + L('al prossimo round', 'to the next round') + '</div>'
      + '<div class="xn2-sub">' + L('Intanto guarda gli altri match in diretta.', 'Meanwhile, watch the other live matches.') + '</div></div>';
  };
  var FRASI = [
    [/\bIN GARA\b/g, function(){ return L('in gara', 'playing'); }],
    [/\bPLAYING\b/g, function(){ return 'playing'; }]
  ];
  function avvolgi(nome, dopo){
    var f = window[nome];
    if (typeof f !== 'function' || f.__xn2) return false;
    var g = function(){ var r = f.apply(this, arguments); try{ return dopo(r, arguments); }catch(e){ return r; } };
    for (var k in f) if (Object.prototype.hasOwnProperty.call(f, k)) g[k] = f[k];
    g.__xn2 = 1; g.__xn2orig = f;
    window[nome] = g;
    return true;
  }
  function sostituisci(nome, nuova){
    var f = window[nome];
    if (typeof f !== 'function' || f.__xn2) return false;
    var g = function(){ try{ return nuova.apply(this, arguments); }catch(e){ return f.apply(this, arguments); } };
    for (var k in f) if (Object.prototype.hasOwnProperty.call(f, k)) g[k] = f[k];
    g.__xn2 = 1; g.__xn2orig = f;
    window[nome] = g;
    return true;
  }
  function installa(){
    sostituisci('trnCheckinHTML', XN2.checkin);
    sostituisci('trnRipescaHTML', XN2.ripesca);
    sostituisci('trnIntermHTML', XN2.interm);
    avvolgi('trnImBadge', function(r){
      var el = document.getElementById('trn-im-badge');
      if (el){
        var s = trnImSecs(TRN.state);
        var t = '<span class="xn2-ib-k">' + L('Prossimo round', 'Next round') + '</span><b>' + mmss(s) + '</b>';
        if (el.__xn2t !== t){ el.__xn2t = t; el.innerHTML = t; }
      }
      return r;
    });
    avvolgi('utMatchCard', function(h){
      return h.replace('<span class="l">LIVE</span>', '<span class="l">' + L('In diretta', 'Live') + '</span>')
        .replace(/<span class="ut-m-go">[^<]*<\/span>/, '<span class="ut-m-go">' + XN2.ic('occhio', 15) + L('Guarda', 'Watch') + '</span>');
    });
    avvolgi('trnBracketHTML', function(h){
      return h.replace(/(<div class="cup"[^>]*>)[^<]*(<\/div>)/, '$1' + XN2.ic('coppa', 30) + '$2')
        .replace(/<span>[^<]*passa il turno<\/span>/, '<span><i class="xn2-leg-w">' + XN2.ic('avanza', 11) + '</i>passa il turno</span>')
        .replace(/<span>[^<]*goes through<\/span>/, '<span><i class="xn2-leg-w">' + XN2.ic('avanza', 11) + '</i>goes through</span>');
    });
    avvolgi('utStatoPill', function(h){
      return h.replace('>LIVE<', '>' + L('In diretta', 'Live') + '<');
    });
    avvolgi('utLiveHTML', function(h){
      return h.replace(/(<button class="ut-btn" onclick="trnSpecDuel\([^)]*\)">)[^<]*/g, '$1' + XN2.ic('occhio', 16) + ' ' + L('Guarda', 'Watch'))
        .replace(/(<button class="ut-btn" id="trn-watch-[^"]*" onclick="[^"]*">)[^<]*(<span class="v">)/g, '$1' + XN2.ic('occhio', 16) + ' $2');
    });
    avvolgi('trnChatHTML', function(h){
      return h.replace(/(<button class="trn-ch-btn"[^>]*>)[^<]*(<\/button>)/, '$1' + XN2.ic('su', 18) + '$2')
        .replace(/ · ✈️ = dai gruppi Telegram/, ' · con la scritta Telegram arrivano dai gruppi')
        .replace(/ · ✈️ = from Telegram groups/, ' · marked Telegram come from the groups')
        .replace(/(<button onclick="utChatGiu\(this\)">)[^<]*/, '$1' + L('Nuovi messaggi', 'New messages'));
    });
    avvolgi('trnChatRowHTML', function(h){
      FRASI.forEach(function(f){ h = h.replace(f[0], f[1]); });
      return h.replace(/<span class="ut-cr-bd">[^<]*TG<\/span>/, '<span class="ut-cr-bd">Telegram</span>');
    });
    avvolgi('dlTrnLight', function(r, a){
      var st = a[0], t = st === 'open' ? L('Iscrizioni aperte', 'Sign-up open') : (st === 'live' ? L('In diretta', 'Live') : '');
      document.querySelectorAll('.trn-flag').forEach(function(f){ if (f.textContent !== t) f.textContent = t; });
      return r;
    });
    var _dato = window.dlTrnDato;
    if (typeof _dato === 'function' && !_dato.__xn2){
      window.dlTrnDato = function(v, l){
        var m = { 'ISCRITTI': L('iscritti', 'players'), 'ADESSO': L('adesso', 'now'), 'PLAYERS': 'players', 'NOW': 'now' };
        if (v === 'LIVE') v = L('Live', 'Live');
        if (l != null && m[String(l).toUpperCase()]) l = m[String(l).toUpperCase()];
        return _dato.call(this, v, l);
      };
      window.dlTrnDato.__xn2 = 1;
    }
    var _scrivi = window.dlTrnScrivi;
    if (typeof _scrivi === 'function' && !_scrivi.__xn2){
      window.dlTrnScrivi = function(h){
        if (h){
          h = String(h).replace(/ style="color:#ffd76b;?"/g, '')
            .replace('PRESENZA CONFERMATA — entra', 'presenza confermata, entra')
            .replace('CONFERMA LA PRESENZA ORA', 'conferma la presenza ora')
            .replace('LIVE ORA — guarda i match!', 'in diretta, guarda i match')
            .replace(/[⏱✅⚠️\u{1F3C6}]\s?/gu, '');
        }
        return _scrivi.call(this, h);
      };
      window.dlTrnScrivi.__xn2 = 1;
    }
  }
  var STATI = [
    [/ISCRIZION|SIGN-UP/i, 'reg', ['Iscrizioni', 'Sign-up']],
    [/PRESENZ|CHECK-IN/i, 'ci', ['Check-in', 'Check-in']],
    [/LIVE/i, 'live', ['In diretta', 'Live']],
    [/CONCLUS|FINISHED/i, 'fine', ['Concluso', 'Finished']],
    [/ARCHIVIO|ARCHIVE/i, 'fine', ['Archivio', 'Archive']],
    [/ALBO|HALL/i, 'fine', ['Albo d’oro', 'Hall of fame']],
    [/ANNULLAT|CANCELLED/i, 'fine', ['Annullato', 'Cancelled']]
  ];
  function pillola(){
    var src = document.getElementById('trn-hdr-st'); if (!src) return;
    var p = document.getElementById('xn2-st');
    if (!p){ p = document.createElement('div'); p.id = 'xn2-st'; p.className = 'xn2-st'; src.parentNode.insertBefore(p, src.nextSibling); }
    var t = (src.textContent || '').trim(), k = '', txt = '';
    for (var i = 0; i < STATI.length; i++) if (STATI[i][0].test(t)){ k = STATI[i][1]; txt = L(STATI[i][2][0], STATI[i][2][1]); break; }
    if (!k && t) { k = 'fine'; txt = t.replace(/^[^A-Za-zÀ-ÿ]+/, ''); txt = txt.charAt(0) + txt.slice(1).toLowerCase(); }
    var h = txt ? '<i></i><span>' + esc(txt) + '</span>' : '';
    if (p.__h !== h){ p.__h = h; p.innerHTML = h; }
    p.setAttribute('data-k', k);
    p.style.display = txt ? '' : 'none';
  }
  function barra(){
    var sc = document.getElementById('torneo'); if (!sc || sc.__xn2) return;
    sc.__xn2 = 1; sc.classList.add('xn2-on');
    var ti = sc.querySelector('.game-hdr .game-title');
    if (ti){ ti.textContent = L('Tornei', 'Tournaments'); ti.classList.add('xn2-ti'); }
    var src = document.getElementById('trn-hdr-st');
    if (src) new MutationObserver(pillola).observe(src, { childList: true, characterData: true, subtree: true });
    pillola();
    var body = document.getElementById('trn-body');
    if (body) new MutationObserver(function(){ guardaCd(); ricopia(); }).observe(body, { childList: true, subtree: true });
  }
  function via(){
    installa();
    barra();
    guardaCd();
    try{ var rt = document.querySelector('#trn-duel-card .trn-rb-title');
      if (rt && rt.firstChild && rt.firstChild.nodeType === 3) rt.firstChild.nodeValue = L('Tornei ', 'Tournaments '); }catch(e){}
    try{ document.querySelectorAll('.trn-flag').forEach(function(f){
      var c = f.closest && f.closest('.trn-card'), st = c && c.classList.contains('open') ? 'open' : (c && c.classList.contains('live') ? 'live' : '');
      var t = st === 'open' ? L('Iscrizioni aperte', 'Sign-up open') : (st === 'live' ? L('In diretta', 'Live') : f.textContent);
      if (f.textContent !== t) f.textContent = t;
    }); }catch(e){}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', via); else via();
})();
;
(function(){
  'use strict';
  if (window.XT2) return;
  var XT2 = window.XT2 = { v: '20261115', on: true, sala: true, inviati: [] };
  var D = document;
  function L(it, en){ return window.GB_LANG === 'en' ? en : it; }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function warn(k, e){ try { console.warn('XT2 ' + k, e); } catch(_){} }
  var IC = {
    indietro: 'M15 5l-7 7 7 7',
    occhio: 'M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12z M12 14.8a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6z',
    orologio: 'M12 7v5l3 2 M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
    su: 'M12 19V5 M6 11l6-6 6 6',
    giu: 'M12 5v14 M6 13l6 6 6-6'
  };
  function svg(n, w){ return '<svg class="xt2-i" viewBox="0 0 24 24" width="' + (w || 16) + '" height="' + (w || 16) + '" aria-hidden="true"><path d="' + (IC[n] || '') + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'; }
  XT2.ic = svg;
  function tinta(n){ n = String(n || '?'); var h = 0; for (var i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) & 0xffff; return h % 360; }
  function iniziale(n){ var s = String(n || '?').replace(/^[^A-Za-z0-9À-ÿ]+/, ''); return (s.charAt(0) || '?').toUpperCase(); }
  function avatar(nome, foto, cls){
    return '<span class="xt2-av' + (cls ? ' ' + cls : '') + '" style="--xt2-h:' + tinta(nome) + '"><em>' + esc(iniziale(nome)) + '</em>'
      + (foto ? '<img src="' + esc(foto) + '" alt="" onerror="this.remove()">' : '') + '</span>';
  }
  XT2.avatar = avatar;
  function avvolgi(nome, dopo){
    var f = window[nome];
    if (typeof f !== 'function' || f.__xt2) return false;
    var g = function(){ var r = f.apply(this, arguments); try { var x = dopo(r, arguments); return x === undefined ? r : x; } catch(e){ warn(nome, e); return r; } };
    for (var k in f) if (Object.prototype.hasOwnProperty.call(f, k)) g[k] = f[k];
    g.__xt2 = 1; g.__xt2orig = f;
    window[nome] = g; return true;
  }
  function sostituisci(nome, nuova, quando){
    var f = window[nome];
    if (typeof f !== 'function' || f.__xt2) return false;
    var g = function(){
      if (quando && !quando()) return f.apply(this, arguments);
      try { return nuova.apply(this, arguments); } catch(e){ warn(nome, e); return f.apply(this, arguments); }
    };
    for (var k in f) if (Object.prototype.hasOwnProperty.call(f, k)) g[k] = f[k];
    g.__xt2 = 1; g.__xt2orig = f;
    window[nome] = g; return true;
  }
  function ovPv(){ return D.getElementById('pvp-overlay'); }
  function pvVisibile(ov){ var sc = ov.closest('.screen'); return !sc || sc.classList.contains('active'); }
  function bilancio(){ var b = D.getElementById('dl-bal'); return b ? String(b.textContent || '').trim() : ''; }
  function barraPv(ov){
    var bar = ov.querySelector(':scope > .xt2-pv-bar');
    if (!bar){
      bar = D.createElement('div'); bar.className = 'xt2-pv-bar';
      bar.innerHTML = '<button type="button" class="xt2-pv-back" aria-label="' + L('Indietro', 'Back') + '">' + svg('indietro', 20) + '</button><span class="xt2-pv-bal"></span>';
      bar.querySelector('button').addEventListener('click', function(){
        try { if (typeof GBX !== 'undefined' && GBX.fx) GBX.fx('back'); } catch(e){}
        try { dlCloseOverlay(); } catch(e){ warn('indietro', e); }
      });
      ov.insertBefore(bar, ov.firstChild);
    }
    return bar;
  }
  function syncPv(){
    var ov = ovPv(); if (!ov) return;
    var on = !!XT2.on && ov.classList.contains('show') && pvVisibile(ov);
    var pieno = on && !ov.classList.contains('xmr-on');
    if (pieno !== ov.classList.contains('xt2-pieno')) ov.classList.toggle('xt2-pieno', pieno);
    var menu = pieno && ov.classList.contains('xa-ms') && !ov.classList.contains('xa-ms-srch') && !ov.classList.contains('xz-on');
    if (menu !== ov.classList.contains('xt2-pv-menu')) ov.classList.toggle('xt2-pv-menu', menu);
    if (menu){ var bar = barraPv(ov), b = bar.querySelector('.xt2-pv-bal'), t = bilancio(); if (b.textContent !== t) b.textContent = t; }
    var h = D.documentElement;
    if (on !== h.classList.contains('xt2-lobby')) h.classList.toggle('xt2-lobby', on);
    tgSync();
  }
  XT2.syncPv = syncPv;
  var TGS = { mio: false, chiesto: false };
  function inLobby(){
    var ov = ovPv(); if (XT2.on && ov && ov.classList.contains('show') && pvVisibile(ov)) return true;
    var c = window.CUR; if (c === 'arc' || c === 'turf' || c === 'tank' || c === 'glad' || c === 'lobby' || c === 'torneo') return true;
    var p = D.getElementById('pk5-ov'); if (p && p.classList.contains('on')) return true;
    if (D.getElementById('lobsp-ov')) return true;
    return false;
  }
  function tgSync(){
    try {
      if (!XT2.on) return;
      var tg = window.Telegram && Telegram.WebApp;
      if (!tg || typeof tg.isVersionAtLeast !== 'function' || !tg.isVersionAtLeast('8.0') || typeof tg.requestFullscreen !== 'function') return;
      if (inLobby()){
        if (!tg.isFullscreen && !TGS.chiesto){ TGS.chiesto = true; TGS.mio = true; tg.requestFullscreen(); }
      } else {
        TGS.chiesto = false;
        if (TGS.mio){ TGS.mio = false; if (tg.isFullscreen && typeof tg.exitFullscreen === 'function') tg.exitFullscreen(); }
      }
    } catch(e){ warn('tg', e); }
  }
  XT2.tgSync = tgSync; XT2.tgStato = function(){ return { mio: TGS.mio, chiesto: TGS.chiesto, lobby: inLobby() }; };
  function montaPv(){
    var ov = ovPv(); if (!ov || ov.__xt2) return; ov.__xt2 = 1;
    try { new MutationObserver(syncPv).observe(ov, { attributes: true, attributeFilter: ['class'] }); } catch(e){}
    syncPv();
  }
  function mioMsg(c){
    if (!c || c.g || !c.x) return false;
    var x = String(c.x), ts = +c.ts || 0, l = XT2.inviati;
    for (var i = l.length - 1; i >= 0; i--){
      if (l[i].x === x && (!ts || Math.abs(ts * 1000 - l[i].t) < 120000)) return true;
    }
    return false;
  }
  function ora(ts){ if (!ts) return ''; try { var d = new Date(ts * 1000); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); } catch(e){ return ''; } }
  function riga(c, nuovo){
    var n = String(c.n || '?'), me = mioMsg(c);
    return '<div class="ut-cr trn-ch-row xt2-m' + (c.p ? ' ply' : '') + (c.g ? ' tg' : '') + (nuovo ? ' nw' : '') + (me ? ' xt2-me' : '') + '" data-n="' + esc(n) + '" data-ts="' + (+c.ts || 0) + '">'
      + avatar(n, c.f || c.photo_url || '', 's')
      + '<div class="ut-cr-b xt2-mb"><div class="xt2-mh"><span class="ut-cr-n">' + esc(me ? L('Tu', 'You') : n) + '</span>'
      + (c.p ? '<span class="ut-cr-bd">' + L('in gara', 'playing') + '</span>' : '')
      + (c.g ? '<span class="ut-cr-bd">Telegram</span>' : '')
      + (c.ts ? '<span class="ut-cr-t">' + ora(c.ts) + '</span>' : '') + '</div>'
      + '<div class="xt2-mx">' + esc(String(c.x || '')) + '</div></div></div>';
  }
  function raggruppa(){
    [].forEach.call(D.querySelectorAll('.trn-ch-log'), function(b){
      var prev = null;
      [].forEach.call(b.children, function(r){
        if (!r.classList || !r.classList.contains('xt2-m')) { prev = null; return; }
        var seq = !!prev && prev.getAttribute('data-n') === r.getAttribute('data-n') && prev.classList.contains('xt2-me') === r.classList.contains('xt2-me')
          && Math.abs((+r.getAttribute('data-ts') || 0) - (+prev.getAttribute('data-ts') || 0)) < 180;
        r.classList.toggle('xt2-seq', seq);
        if (prev) prev.classList.toggle('xt2-cont', seq);
        prev = r;
      });
      var e = b.querySelector('.trn-ch-empty');
      if (e && /🎙|—/.test(e.textContent)) e.textContent = e.textContent.replace(/\s*—\s*/, '. ').replace(/\s*🎙\s*/, '').replace(/^Nessun messaggio ancora\. scrivi tu il primo$/, 'Nessun messaggio ancora. Scrivi tu il primo');
    });
  }
  function inputSala(){
    var s = D.querySelector('.xt2-sala .trn-ch-in');
    return s && s.offsetParent !== null ? s : null;
  }
  function installaChat(){
    sostituisci('trnChatRowHTML', function(c, nuovo){ return riga(c || {}, nuovo); });
    var ultimo = '';
    avvolgi('trnChatPaint', function(r, a){
      raggruppa();
      var Lc = (window.TRN && TRN.chat) || [], u = Lc.length ? Lc[Lc.length - 1] : null;
      var k = u ? String(u.n) + '|' + String(u.ts) + '|' + String(u.x) : '';
      if (k && ultimo && k !== ultimo && !a[0]){
        [].forEach.call(D.querySelectorAll('.trn-ch-log'), function(b){
          if (b._utSu){ var g = b.parentNode && b.parentNode.querySelector('.ut-chat-giu'); if (g) g.classList.add('on'); }
        });
      }
      ultimo = k;
    });
    var fs = window.trnChatSend;
    if (typeof fs === 'function' && !fs.__xt2){
      window.trnChatSend = function(){
        try {
          var i = (typeof trnChatInput === 'function') ? trnChatInput() : null, v = i ? String(i.value || '').trim() : '';
          if (v){ XT2.inviati.push({ x: v.slice(0, 140), t: Date.now() }); if (XT2.inviati.length > 20) XT2.inviati.shift(); }
        } catch(e){}
        return fs.apply(this, arguments);
      };
      window.trnChatSend.__xt2 = 1;
    }
    var fi = window.trnChatInput;
    if (typeof fi === 'function' && !fi.__xt2){
      window.trnChatInput = function(){ return inputSala() || fi.apply(this, arguments); };
      window.trnChatInput.__xt2 = 1;
    }
    var vv = window.visualViewport, attivo = null;
    function kb(){
      if (!attivo) return;
      var b = vv ? Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)) : 0;
      D.documentElement.style.setProperty('--xt2-kb', b + 'px');
      var bar = attivo.closest('.trn-ch-bar') || attivo;
      try { bar.scrollIntoView({ block: 'end', behavior: 'auto' }); } catch(e){}
    }
    D.addEventListener('focusin', function(e){
      var t = e.target;
      if (!t || !t.classList || !t.classList.contains('trn-ch-in') || t.closest('.gld-spec-chat')) return;
      attivo = t; D.documentElement.classList.add('xt2-kbo');
      setTimeout(kb, 60); setTimeout(kb, 380);
    }, true);
    D.addEventListener('focusout', function(e){
      if (e.target !== attivo) return;
      setTimeout(function(){
        if (D.activeElement === attivo) return;
        attivo = null; D.documentElement.classList.remove('xt2-kbo'); D.documentElement.style.setProperty('--xt2-kb', '0px');
      }, 140);
    }, true);
    if (vv){ vv.addEventListener('resize', kb); vv.addEventListener('scroll', function(){ if (attivo) kb(); }); }
  }
  var GIOCHI = { rr: ['rr', 'Roulette russa', 'Russian roulette'], bjl: ['bj1v1', 'Blackjack 1v1', 'Blackjack 1v1'], pkd: ['pk1v1', 'Poker 1v1', 'Poker 1v1'],
                 rps: ['rps', 'Sasso carta forbice', 'Rock paper scissors'], bs: ['bs', 'Battaglia navale', 'Battleship'], ch: ['chess', 'Scacchi', 'Chess'] };
  function nomeG(g, label){ var x = GIOCHI[g]; if (x) return L(x[1], x[2]); var n = (window.GBX && GBX.nomeGioco) ? GBX.nomeGioco(g) : '';
    return n || String(label || '').replace(/[^\wÀ-ÿ'’ .·-]/g, '').trim() || L('Partita', 'Match'); }
  function icG(g){ var x = GIOCHI[g]; return x ? x[0] : ((window.GBX && GBX.gioco) ? GBX.gioco(g) : String(g || '')); }
  function nmP(pl, i){ return String(((pl || [])[i] || {}).nome || (L('Sfidante ', 'Player ') + (i ? 'B' : 'A'))); }
  function tab(pl, righe){
    var h = '<div class="xt2-tb"><div class="xt2-tb-r xt2-tb-h"><span></span><b>' + esc(nmP(pl, 0)) + '</b><b>' + esc(nmP(pl, 1)) + '</b></div>';
    righe.forEach(function(r){ h += '<div class="xt2-tb-r"><span>' + esc(r[0]) + '</span><b>' + r[1] + '</b><b>' + r[2] + '</b></div>'; });
    return h + '</div>';
  }
  var MOSSE = { rock: ['sasso', 'rock'], paper: ['carta', 'paper'], scissors: ['forbice', 'scissors'], sasso: ['sasso', 'rock'], carta: ['carta', 'paper'], forbice: ['forbice', 'scissors'], forbici: ['forbice', 'scissors'] };
  function mossa(m){ var k = String(m || '').toLowerCase(), x = MOSSE[k]; return x ? L(x[0], x[1]) : String(m || '?'); }
  function scena(g, s, pl){
    s = s || {}; pl = pl || [];
    if (g === 'rr'){
      var v = s.vite || [0, 0], c = s.camere || {}, sp = s.sparate || [];
      try { if (typeof dlInjectCSS === 'function') dlInjectCSS(); } catch(_rc){}
      var R = TRNSP.rr || (TRNSP.rr = {});
      if (R.mid !== TRNSP.mid){ R.mid = TRNSP.mid; R.max = 0; R.n = -1; R.cil = 0; R.ev = ''; R.v = null; }
      R.max = Math.max(R.max || 0, v[0] || 0, v[1] || 0);
      var cil = s.cilindro || 1;
      if (R.n >= 0 && cil === R.cil && sp.length > R.n){
        var bang = !!sp[sp.length - 1], chi = -1;
        if (R.v){ for (var k = 0; k < 2; k++) if ((v[k] || 0) < (R.v[k] || 0)) chi = k; }
        R.ev = bang ? ('bang|' + (chi >= 0 ? nmP(pl, chi) : '')) : 'click|';
      } else if (R.n >= 0 && cil !== R.cil){ R.ev = 'cil|'; }
      R.n = sp.length; R.cil = cil; R.v = [v[0] || 0, v[1] || 0];
      var tu = (TRNSP.ultimo && TRNSP.ultimo.turno) || {};
      var tamb = (typeof dlRrCylHTML === 'function')
        ? dlRrCylHTML({ cyl_fired: sp, loaded: c.dentro || 0 }).replace('id="dlrr-cylsvg"', '').replace('id="dlrr-cylrot"', '') : '';
      var rot = (tu.slot === 1) ? '180deg' : '0deg';
      var vite = function(i){
        var n = Math.max(0, v[i] | 0), m = Math.max(R.max || 0, n), h = '';
        if (n <= 0) return '<span class="xt2-rr-fuori">' + L('Eliminato', 'Out') + '</span>';
        for (var j = 0; j < m; j++) h += '<i' + (j < n ? ' class="on"' : '') + '></i>';
        return '<span class="xt2-vite" aria-label="' + n + '">' + h + '</span>';
      };
      var lato = function(i){
        return '<div class="xt2-rr-p' + (tu.slot === i ? ' t' : '') + '">' + avatar(nmP(pl, i), (pl[i] || {}).foto || (pl[i] || {}).photo_url, 'm')
          + '<span class="xt2-rr-n">' + esc(nmP(pl, i)) + '</span>' + vite(i) + '</div>';
      };
      var ev = '', e = String(R.ev || '').split('|');
      if (e[0] === 'bang') ev = '<div class="xt2-ev bang">' + L('Colpo vero', 'Live round') + (e[1] ? ' · ' + L('colpito ', 'hit ') + esc(e[1]) : '') + '</div>';
      else if (e[0] === 'click') ev = '<div class="xt2-ev">' + L('Click… a salve', 'Click… blank') + '</div>';
      else if (e[0] === 'cil') ev = '<div class="xt2-ev">' + L('Tamburo ricaricato', 'Cylinder reloaded') + '</div>';
      return '<div class="xt2-rr">' + lato(1)
        + '<div class="xt2-rr-mid"><img class="xt2-rr-gun" src="rr_revolver.png" alt="" draggable="false" style="transform:rotate(' + rot + ')">'
        + '<div class="xt2-rr-cyl">' + tamb + '<div class="xt2-rr-c"><span><i class="v"></i>' + (c.vive || 0) + ' ' + L('vere', 'live') + '</span><span><i></i>' + (c.salve || 0) + ' ' + L('a salve', 'blank') + '</span></div>'
        + '<div class="xt2-rr-k">' + L('Tamburo ', 'Cylinder ') + cil + '</div></div></div>'
        + lato(0) + ev + '</div>';
    }
    if (g === 'bjl'){
      var p0 = (s.pile || [])[0] || [], p1 = (s.pile || [])[1] || [];
      var pile = function(x){ return x.map(function(q){ return (q.carte || 0) + ' ' + L('carte', 'cards') + (q.chiusa ? ' · ' + L('sta', 'stands') : ''); }).join('<br>') || '–'; };
      return tab(pl, [[L('Carte', 'Cards'), pile(p0), pile(p1)]]);
    }
    if (g === 'pkd'){
      var d = s.pescato || [false, false], r = [[L('Cambio', 'Draw'), d[0] ? L('Fatto', 'Done') : L('Sta decidendo', 'Deciding'), d[1] ? L('Fatto', 'Done') : L('Sta decidendo', 'Deciding')]];
      if ((s.combinazioni || [])[0]) r.push([L('Mano', 'Hand'), esc(String(s.combinazioni[0])), esc(String(s.combinazioni[1] || ''))]);
      return tab(pl, r);
    }
    if (g === 'rps'){
      var q = s.punti || [0, 0], ch = s.scelto || [false, false];
      return '<div class="xt2-big"><b>' + (q[0] | 0) + '</b><span>–</span><b>' + (q[1] | 0) + '</b></div><div class="xt2-big-k">' + L('Round vinti', 'Rounds won') + '</div>'
        + tab(pl, [[L('Scelta', 'Pick'), ch[0] ? L('Fatta', 'Locked') : L('Sta scegliendo', 'Choosing'), ch[1] ? L('Fatta', 'Locked') : L('Sta scegliendo', 'Choosing')]])
        + (s.ultimo ? '<div class="xt2-nota">' + L('Ultimo round: ', 'Last round: ') + esc(mossa((s.ultimo.mosse || [])[0])) + L(' contro ', ' vs ') + esc(mossa((s.ultimo.mosse || [])[1])) + '</div>' : '');
    }
    if (g === 'bs'){
      var LT = s.lati || [{}, {}];
      return tab(pl, [[L('Navi a galla', 'Ships afloat'), (LT[0].navi_vive != null ? LT[0].navi_vive : '?'), (LT[1].navi_vive != null ? LT[1].navi_vive : '?')],
                      [L('Colpi subiti', 'Hits taken'), (LT[0].colpiti || []).length, (LT[1].colpiti || []).length]])
        + (s.fase === 'placing' ? '<div class="xt2-nota">' + L('Stanno schierando la flotta', 'Placing the fleet') + '</div>' : '');
    }
    if (g === 'ch'){
      var b = String(s.scacchiera || ''), G = '';
      if (b.length === 64){
        var PZ = { p:'♟', n:'♞', b:'♝', r:'♜', q:'♛', k:'♚' };
        var pezzo = function(c){
          if (!PZ[c.toLowerCase()]) return '';
          if (typeof chPezzo === 'function' && window.XZ && XZ.on && XZ.pezzi){ var hz = chPezzo(c); if (/xz-pz/.test(hz)) return hz; }
          var u = (typeof chImgPezzo === 'function') ? chImgPezzo(c) : null;
          if (u) return '<img src="' + u + '" alt="" draggable="false">';
          return '<span class="' + (c !== c.toUpperCase() ? 'n' : 'w') + '">' + PZ[c.toLowerCase()] + '</span>';
        };
        if (typeof chPrecarica === 'function') chPrecarica();
        G = '<div id="trn-ch-mini" class="xt2-ch">';
        for (var r2 = 7; r2 >= 0; r2--) for (var c2 = 0; c2 < 8; c2++){
          var ch2 = b.charAt(r2 * 8 + c2), dk = ((r2 + c2) % 2 === 0);
          G += '<div class="' + (dk ? 'd' : 'l') + '">' + pezzo(ch2) + '</div>';
        }
        G += '</div>';
      }
      var cl = s.colori || [], chi2 = '';
      if (cl[0] || cl[1]){
        var wI = (cl[0] === 'w') ? 0 : ((cl[1] === 'w') ? 1 : -1);
        if (wI >= 0) chi2 = '<div class="xt2-ch-col"><span><i class="w"></i><b>' + esc(nmP(pl, wI)) + '</b> ' + L('bianco', 'white') + '</span><span><i class="n"></i><b>' + esc(nmP(pl, 1 - wI)) + '</b> ' + L('nero', 'black') + '</span></div>';
      }
      var o = s.orologi || [0, 0];
      var mm = function(ms){ var t = Math.max(0, Math.round(ms / 1000)); return Math.floor(t / 60) + ':' + ('0' + (t % 60)).slice(-2); };
      return chi2 + G + tab(pl, [[L('Orologio', 'Clock'), mm(o[0]), mm(o[1])], [L('Materiale', 'Material'), (s.materiale || [0, 0])[0], (s.materiale || [0, 0])[1]]]);
    }
    return '';
  }
  XT2.scena = scena;
  function statoTesto(p, pl){
    var tu = p.turno || {};
    if (p.stato === 'attesa') return String(p.attesa_msg || L('In attesa dei due giocatori…', 'Waiting for both players…'));
    if (p.stato === 'finita') return L('Match finito', 'Match over');
    if (tu.simultaneo) return L('Scelgono insieme', 'Both choosing') + (tu.secs != null ? ' · ' + tu.secs + ' s' : '');
    if (tu.slot != null) return L('Tocca a ', 'Turn: ') + nmP(pl, tu.slot) + (tu.secs != null ? ' · ' + tu.secs + ' s' : '');
    return L('In corso', 'In progress');
  }
  function giocatore(p, pl, i){
    var q = pl[i] || {}, tu = p.turno || {}, t = (tu.slot === i && p.stato !== 'finita' && p.stato !== 'attesa'), pres = '';
    if (q.presenza === 'assente') pres = '<span class="xt2-pres no">' + L('uscito', 'left') + '</span>';
    else if (q.presenza === 'muto') pres = '<span class="xt2-pres">' + L('non risponde', 'not responding') + '</span>';
    else if (t || tu.simultaneo) pres = '<span class="xt2-pres t">' + (tu.simultaneo ? L('sceglie', 'choosing') : L('tocca a lui', 'to play')) + '</span>';
    return '<div class="xt2-gp' + (t ? ' t' : '') + (q.presenza === 'assente' ? ' via' : '') + '">' + avatar(nmP(pl, i), q.foto || q.photo_url, 'l')
      + '<b>' + esc(nmP(pl, i)) + '</b>' + pres + '</div>';
  }
  function sala(p){
    if (!XT2.sala) return false;
    var host = D.getElementById('torneo') || D.body;
    var ov = D.getElementById('trn-spec-ov');
    if (ov && !ov.classList.contains('xt2-sala')){ if (ov.parentNode) ov.parentNode.removeChild(ov); ov = null; }
    var g = String(p.g || ''), pl = p.players || [], tour = p.tour || {};
    if (!ov){
      ov = D.createElement('div'); ov.id = 'trn-spec-ov'; ov.className = 'xt2-sala';
      ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
      ov.innerHTML = '<div class="xt2-sl-hd"><span class="xt2-sl-ic"></span><span class="xt2-sl-tx"><small>' + L('Stai guardando', 'Watching') + '</small><b></b></span>'
        + '<button type="button" class="xt2-sl-esci" onclick="trnSpecDuelChiudi()">' + L('Esci', 'Leave') + '</button></div>'
        + '<div class="xt2-sl-in"><div class="xt2-sl-st"></div><div class="xt2-sl-chat">' + trnChatHTML() + '</div></div>';
      host.appendChild(ov);
      try { if (typeof trnInjectCSS === 'function') trnInjectCSS(); } catch(_c){}
      try { var cc = ov.querySelector('.ut-chat'); if (cc) cc.classList.remove('chiusa'); } catch(_x){}
      try { trnChatPaint(true); } catch(_p){}
      try { if (typeof GBX !== 'undefined' && GBX.hap) GBX.hap('soft'); } catch(_h){}
    }
    var ic = ov.querySelector('.xt2-sl-ic');
    if (ic.__g !== g){ ic.__g = g; ic.innerHTML = '<img src="gbx_pv_' + esc(icG(g)) + '.webp" alt="" onerror="this.remove()"><em>' + esc(nomeG(g, p.label).charAt(0)) + '</em>'; }
    var tt = ov.querySelector('.xt2-sl-tx b'), tn = nomeG(g, p.label); if (tt.textContent !== tn) tt.textContent = tn;
    TRNSP.ultimo = p;
    var rit = ((p.differita || {}).ritardo_s) || 0;
    var h = '<div class="xt2-dati"><div><span>Round</span><b>' + esc(tour.round || 1) + '</b></div>'
      + '<div><span>' + L('Partita', 'Game') + '</span><b>' + esc(tour.gara || 1) + '<i> ' + L('di', 'of') + ' ' + esc(tour.gare || 1) + '</i></b></div>'
      + '<div><span>' + L('Stato', 'Status') + '</span><b class="xt2-live' + (p.stato === 'finita' ? ' fine' : (p.stato === 'attesa' ? ' att' : '')) + '"><i></i>'
      + (p.stato === 'finita' ? L('Finito', 'Over') : (p.stato === 'attesa' ? L('In attesa', 'Waiting') : L('In diretta', 'Live'))) + '</b></div></div>'
      + '<div class="xt2-vs">' + giocatore(p, pl, 0) + '<span class="xt2-vs-x">VS</span>' + giocatore(p, pl, 1) + '</div>'
      + '<div class="xt2-stato">' + svg('orologio', 14) + '<span>' + esc(statoTesto(p, pl)) + '</span></div>'
      + '<div class="xt2-scena">' + scena(g, p.scena || {}, pl) + '</div>'
      + '<div class="xt2-dif">' + L('In differita di ' + rit + ' s: vedi quello che è già successo', rit + ' s delay: you see what has already happened') + '</div>';
    var st = ov.querySelector('.xt2-sl-st');
    if (st.__h !== h){ st.__h = h; st.innerHTML = h; }
    try { if (typeof tv3dSpett === 'function') tv3dSpett(p); } catch(_tsp){}
    return true;
  }
  XT2.salaAperta = function(){ return !!D.querySelector('#trn-spec-ov.xt2-sala'); };
  function fotoRtd(id){ try { var p = (RTD.profiles || {})[id] || {}; return p.photo_url || p.foto || ''; } catch(e){ return ''; } }
  function installaArc(){
    sostituisci('utSpecHd', function(){
      var a = D.getElementById('arc'); if (!a) return;
      var hd = a.querySelector('.game-hdr'); if (!hd) return;
      var x = D.getElementById('ut-sp-hd');
      if (!x){ x = D.createElement('div'); x.id = 'ut-sp-hd'; x.className = 'ut-sp-hd'; hd.appendChild(x); }
      x.classList.add('xt2-sph');
      x.innerHTML = '<span class="xt2-sph-live"><i></i>' + L('In diretta', 'Live') + '</span>'
        + '<span class="xt2-sph-v">' + svg('occhio', 15) + '<span id="ut-sp-v">' + ((window.RTD && RTD.viewers) || 1) + '</span></span>'
        + '<button type="button" class="ut-sp-x xt2-sph-x" onclick="rtdSpecExit()">' + L('Esci', 'Leave') + '</button>';
    });
    avvolgi('rtdHud', function(r, a){
      if (!window.RTD || !RTD.spec) return;
      var v = D.getElementById('ut-sp-v'); if (v && /\D/.test(v.textContent)) v.textContent = String(v.textContent).replace(/\D+/g, '') || '1';
      var hud = D.getElementById('arc-hud'), m = a[0];
      if (!hud || !m || !m.sc || !hud.querySelector('.ut-sp-sc')) return;
      var ids = Object.keys(m.sc).sort(); if (ids.length !== 2) return;
      var t = m.turn, nm = function(id){ try { return String(rtdName(id)); } catch(e){ return String(id); } };
      var c = (m.turn_t != null ? Math.ceil(m.turn_t) + ' s' : (m.cap != null ? Math.ceil(m.cap) + ' s' : 'VS'));
      var lato = function(i){
        var id = ids[i], on = (t != null && String(t) === id);
        return '<div class="s' + (i ? ' r' : '') + (on ? ' t' : '') + '">' + avatar(nm(id), fotoRtd(id), 's') + '<span class="n">' + esc(nm(id)) + '</span><span class="p">' + (m.sc[id] || 0) + '</span></div>';
      };
      var h = '<div class="ut-sp-sc xt2-sc">' + lato(0) + '<div class="c">' + esc(c) + '</div>' + lato(1) + '</div>';
      if (hud.__xt2 !== h || !hud.querySelector('.xt2-sc')){ hud.__xt2 = h; hud.innerHTML = h; }
    });
  }
  function via(){
    try { montaPv(); } catch(e){ warn('pv', e); }
    try { installaChat(); } catch(e){ warn('chat', e); }
    try { sostituisci('trnSpecScena', scena); } catch(e){ warn('scena', e); }
    try { sostituisci('trnSpecDuelDipingi', function(p){ if (!sala(p)) return window.trnSpecDuelDipingi.__xt2orig.apply(this, arguments); }); } catch(e){ warn('sala', e); }
    try { installaArc(); } catch(e){ warn('arc', e); }
    avvolgi('go', function(){ syncPv(); });
    avvolgi('pk5Apri', function(){ tgSync(); });
    avvolgi('pk5Chiudi', function(){ tgSync(); });
    avvolgi('lobSpOpen', function(){ tgSync(); });
    avvolgi('lobSpChiudi', function(){ setTimeout(tgSync, 0); });
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', via); else via();
})();
;
(function(){
  'use strict';
  if (window.__xtCarica) return; window.__xtCarica = 1;
  function L(it, en){ return window.GB_LANG === 'en' ? en : it; }
  function scheda(){ return '<div class="xt-sk x-lastra"><i class="xt-sk-ic"></i><span class="xt-sk-l"><i style="width:58%"></i><i style="width:36%"></i></span><i class="xt-sk-b"></i></div>'; }
  function veste(el){
    if (!el || !el.querySelector('.tw-radar') || el.querySelector('.xt-car')) return;
    el.innerHTML = '<div class="xt-car" aria-busy="true"><span class="xt-ring"></span><div class="xt-t">' + L('Carico i tornei', 'Loading tournaments') + '</div></div>'
      + '<div class="xt-sks">' + scheda() + scheda() + scheda() + '</div>';
  }
  function aggancia(){
    var el = document.getElementById('trn-body'); if (!el) return;
    veste(el);
    new MutationObserver(function(){ veste(el); }).observe(el, { childList:true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', aggancia); else aggancia();
})();
;
(function(){
  'use strict';
  if (!window.GBX || window.XTR) return;
  var D = document, XTR = window.XTR = { v: '1611' }, ultima = null, timer = 0;
  D.addEventListener('gbx:screen', function(e){
    var id = e.detail && e.detail.id, s = id && D.getElementById(id);
    if (!s) return;
    if (ultima && ultima !== s) ultima.classList.remove('xtr-in');
    s.classList.add('xtr-in'); ultima = s;
    clearTimeout(timer);
    timer = setTimeout(function(){ s.classList.remove('xtr-in'); if (ultima === s) ultima = null; }, 900);
  });
  var scorre = false, tm = 0, DOC = D.documentElement;
  function fineScorre(){ scorre = false; DOC.classList.remove('xtr-scorre'); }
  function scorri(){
    if (!scorre) { scorre = true; DOC.classList.add('xtr-scorre'); }
    clearTimeout(tm); tm = setTimeout(fineScorre, 140);
  }
  D.addEventListener('scroll', scorri, { capture:true, passive:true });
  D.addEventListener('touchmove', scorri, { capture:true, passive:true });
  D.addEventListener('wheel', scorri, { capture:true, passive:true });
  GBX.scorrendo = function(){ return scorre; };
  function caldo(){
    try {
      if (!D.fonts || !D.fonts.load) return;
      ['"Inter Tight"', '"Inter"'].forEach(function(f){
        [300, 400, 500, 600, 700].forEach(function(w){ D.fonts.load(w + ' 16px ' + f, 'Aa€0123456789').catch(function(){}); });
      });
    } catch(e){}
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', caldo); else caldo();
})();
;
(function(){
  'use strict';
  if (window.XFIN) return;
  var XFIN = window.XFIN = { on: true, n: {} };
  var W = window, D = document;
  function en(){ return W.GB_LANG === 'en'; }
  function L(it, e){ return en() ? e : it; }
  function $(id){ return D.getElementById(id); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function warn(dove, e){ try { console.warn('[XFIN] ' + dove, e); } catch(_){} }
  function conta(k){ XFIN.n[k] = (XFIN.n[k] || 0) + 1; }
  var RE_EMO = /(?:[\u{1F000}-\u{1FAFF}\u{2600}-\u{2604}\u{2607}-\u{2712}\u{2714}\u{2716}-\u{27BF}\u{2B00}-\u{2BFF}\u{2300}-\u{23FF}\u{1F1E6}-\u{1F1FF}][\u{FE0F}\u{200D}\u{20E3}]*)+|[\u{FE0F}\u{20E3}]/gu;
  function senza(s){ return String(s == null ? '' : s).replace(RE_EMO, '').replace(/\s{2,}/g, ' ').replace(/^[\s·—–:-]+/, '').trim(); }
  function frase(s){
    s = senza(s);
    if (s && s === s.toUpperCase() && /[A-ZÀ-Ú]/.test(s)) {
      s = s.toLowerCase().replace(/\bpvp\b/g, 'PvP').replace(/\buno\b/g, 'UNO').replace(/\bbot\b/g, 'bot');
      s = s.charAt(0).toUpperCase() + s.slice(1);
    }
    return s;
  }
  function fraseSeg(s){
    return senza(s).split(/\s*·\s*/).map(function(x, i){
      if (!(x && x === x.toUpperCase() && /[A-ZÀ-Ú]{3}/.test(x))) return x;
      var f = frase(x); return i ? f.charAt(0).toLowerCase() + f.slice(1) : f;
    }).join(' · ');
  }
  function avvolgi(nome, dopo, prima, arg){
    var f = W[nome];
    if (typeof f !== 'function' || f.__xfin) return false;
    var w = function(){
      var a = arguments;
      if (arg) { try { a = arg([].slice.call(arguments)) || arguments; } catch(e){ warn(nome + ' arg', e); a = arguments; } }
      if (prima) { try { prima.apply(this, a); } catch(e){ warn(nome + ' prima', e); } }
      var r = f.apply(this, a);
      if (dopo) { try { dopo.apply(this, a); } catch(e){ warn(nome, e); } }
      return r;
    };
    for (var k in f) { try { if (Object.prototype.hasOwnProperty.call(f, k)) w[k] = f[k]; } catch(e){} }
    w.__xfin = true;
    try { W[nome] = w; } catch(e){ return false; }
    return true;
  }
  var SVG = {
    esci:'<path d="M14 4.5h4.5v15H14M10 8l-4 4 4 4M6 12h9"/>',
    robot:'<rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 8V4.5M9.5 13h.01M14.5 13h.01M9.5 16h5"/>',
    avviso:'<path d="M12 4 21 19.5H3z"/><path d="M12 10v4.5M12 17h.01"/>',
    coppa:'<path d="M8 4.5h8v4.5a4 4 0 0 1-8 0zM8 6.5H5a2.5 2.5 0 0 0 3 3.5M16 6.5h3a2.5 2.5 0 0 1-3 3.5M12 13v3.5M8.5 20h7M9.5 20l.5-3.5h4l.5 3.5"/>'
  };
  function svg(k){ return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (SVG[k] || SVG.esci) + '</svg>'; }
  function vestiEsci(o){
    var ov = $('gb-esci-ov'); if (!ov || ov.__xfin) return;
    var box = ov.firstElementChild, no = $('gb-esci-no'), si = $('gb-esci-si');
    if (!box || !no || !si || box.children.length < 2) return;
    ov.__xfin = 1; conta('esci');
    o = o || {};
    var tipo = String(o.tipo || 'soldi');
    var pericolo = (tipo === 'soldi' || tipo === 'torneo');
    var tit = frase(box.children[0].textContent);
    var testo = box.children[1].innerHTML.replace(RE_EMO, '');
    var ic = tipo === 'allenamento' ? 'robot' : tipo === 'torneo' ? 'coppa' : tipo === 'soldi' ? 'avviso' : 'esci';
    var al = D.createElement('div');
    al.className = 'xfin-al' + (pericolo ? ' xfin-al--rosso' : '');
    al.setAttribute('role', 'alertdialog'); al.setAttribute('aria-modal', 'true');
    al.innerHTML = '<span class="xfin-al-ic">' + svg(ic) + '</span><h3 class="xfin-al-t"></h3><p class="xfin-al-s"></p><div class="xfin-al-b"></div>';
    al.querySelector('.xfin-al-t').textContent = tit;
    al.querySelector('.xfin-al-s').innerHTML = testo;
    [no, si].forEach(function(b){ b.classList.remove('action-btn', 'gold', 'red'); b.removeAttribute('style'); });
    no.className = 'xfin-al-no'; si.className = 'xfin-al-si';
    no.textContent = frase(no.textContent);
    si.textContent = frase(si.textContent);
    al.querySelector('.xfin-al-b').appendChild(no);
    al.querySelector('.xfin-al-b').appendChild(si);
    al.setAttribute('aria-label', tit);
    ov.innerHTML = '';
    ov.appendChild(al);
    ov.removeAttribute('style');
    ov.className = 'xfin-esci-ov';
    try { if (W.GBX && GBX.sfx) GBX.sfx('open'); } catch(e){}
  }
  function etichettaEsci(){
    ['eb-esci', 'gx-esci'].forEach(function(id){
      var b = $(id); if (!b) return;
      if (!b.querySelector('.xfin-ic')) {
        b.innerHTML = '<span class="xfin-ic">' + svg('esci') + '</span><span>' + L('Esci', 'Exit') + '</span>';
        b.classList.add('xfin-esci'); conta('tasto');
      }
      if (!b.__xfinMo && W.MutationObserver) {
        b.__xfinMo = 1;
        new MutationObserver(function(){ if (!b.querySelector('.xfin-ic')) etichettaEsci(); }).observe(b, { childList:true });
      }
    });
  }
  function nomeCaso(){ return L('Partita a caso', 'Random match'); }
  function vestiCaso(){
    var m = $('pvp-modal'); if (!m) return;
    var ht = m.querySelector(':scope > .tw-hero .tw-hero-t'); if (!ht) return;
    conta('caso');
    ht.textContent = nomeCaso(); ht.removeAttribute('style'); ht.classList.add('xfin-rt');
    var lv = m.querySelector(':scope > .tw-hero .tw-hero-live'); if (lv) { lv.textContent = L('Dal vivo · 1 contro 1', 'Live · 1 vs 1'); lv.classList.add('xfin-rl'); }
    var hs = m.querySelector(':scope > .tw-hero .tw-hero-s'); if (hs) hs.classList.add('xfin-rsub');
    var st = m.querySelector(':scope > .section-ttl'); if (st) { st.textContent = L('Posta', 'Stake'); st.classList.add('xfin-rs'); }
    var go = $('dl-play-btn'); if (go && go.parentNode === m) { go.textContent = L('Gioca', 'Play'); go.classList.add('xfin-rg'); }
    [].forEach.call(m.querySelectorAll(':scope > .action-btn, :scope > .pvp-m-btn'), function(b){
      var oc = b.getAttribute('onclick') || '';
      if (b === go) return;
      if (/practiceStart/.test(oc)) { b.textContent = L('Allenati coi bot', 'Practice with bots'); b.classList.add('xfin-rsec'); }
      else if (/lobOpenCreate/.test(oc)) { b.textContent = L('Crea una lobby · invita il gruppo', 'Create a lobby · invite the group'); b.classList.add('xfin-rsec'); }
      else if (b.classList.contains('pvp-m-btn')) { b.textContent = L('Annulla', 'Cancel'); b.classList.add('xfin-rann'); }
    });
    var nt = m.querySelector(':scope > .tw-note'); if (nt) nt.classList.add('xfin-rnote');
  }
  var RL_IT = { 'Place at least one bet':'Fai almeno una puntata', 'Max 60 bets':'Massimo 60 puntate' };
  function rlTrad(s){ return (!en() && typeof s === 'string' && Object.prototype.hasOwnProperty.call(RL_IT, s)) ? RL_IT[s] : s; }
  function testoSenza(el, via){ var c = el.cloneNode(true); [].forEach.call(c.querySelectorAll(via), function(x){ x.remove(); }); return c.textContent; }
  function nomeModo(s){ s = senza(s); if (s && s === s.toUpperCase()) { s = s.toLowerCase(); s = s.charAt(0).toUpperCase() + s.slice(1); } return s; }
  function vestiScheda(scr){
    var ap = scr.querySelector('.xa-ap'); if (!ap) return;
    var body = ap.parentNode;
    if (!body.querySelector(':scope > .mg-sc')) {
      var gruppi = [].filter.call(body.querySelectorAll('.tw-tiers'), function(g){ return !g.closest('.xa-ap') && !g.querySelector(':scope > .tw-tier[data-t]'); });
      [].forEach.call(ap.querySelectorAll('.xa-ap-seg'), function(seg, k){
        if (seg.classList.contains('xfin-seg2')) return;
        var g = gruppi[k]; if (!g) return;
        var veri = g.querySelectorAll(':scope > .tw-tier'), bb = seg.querySelectorAll(':scope > button');
        if (veri.length !== bb.length || !g.querySelector('.arc-modesub')) return;
        [].forEach.call(bb, function(b, j){
          var v = veri[j], sub = v.querySelector('.arc-modesub');
          var n = nomeModo(testoSenza(v, '.arc-modesub')), d = sub ? senza(sub.textContent) : '';
          if (d) d = d.charAt(0).toUpperCase() + d.slice(1);
          b.innerHTML = '<b>' + esc(n) + '</b>' + (d ? '<small>' + esc(d) + '</small>' : '');
          b.setAttribute('aria-label', n + (d ? ': ' + d : ''));
        });
        seg.classList.add('xfin-seg2'); conta('seg');
      });
    }
    [].forEach.call(ap.querySelectorAll('.xa-ap-sec > button, .xa-ap-grp2 .xa-ap-rt > b'), function(b){
      var t = b.textContent;
      if (/^[A-ZÀ-Ú]{4,}/.test(t) && !/^(UNO|LIVE)\b/.test(t)) { var f = fraseSeg(t); if (f && f !== t) { b.textContent = f; conta('sec'); } }
    });
  }
  function guardaArc(){
    var arc = $('arc'); if (!arc || arc.__xfin || !W.MutationObserver) return;
    arc.__xfin = 1;
    new MutationObserver(function(){
      if (!XFIN.on || !arc.classList.contains('xa-ap-scr')) return;
      try { vestiScheda(arc); } catch(e){ warn('scheda', e); }
    }).observe(arc, { childList:true, subtree:true });
    if (arc.classList.contains('xa-ap-scr')) try { vestiScheda(arc); } catch(e){}
  }
  function argTornei(a){
    if (!en() && typeof a[0] === 'string' && a[0].indexOf('tab TORNEI') >= 0) {
      a[0] = a[0].replace(/tieni d(?:'|\\'|’)occhio la tab TORNEI/g, 'lo trovi nella scheda Tornei');
    }
    return a;
  }
  var LV_IT = { 'Rookie':'Novellino', 'Card Shark':'Squalo', 'Gambler':'Giocatore', 'High Roller':'Temerario',
    'Sharp':'Volpe', 'Kingpin':'Capobanda', 'Boss':'Boss', 'Mafia Don':'Don', 'The House':'Il Banco', 'El Patron':'Il Padrino',
    'LEGEND':'Leggenda', 'IMMORTAL':'Immortale' };
  function livelliIt(){
    if (en()) return;
    try {
      if (typeof LEVELS === 'undefined' || !LEVELS || !LEVELS.length) return;
      LEVELS.forEach(function(x){ if (x && Object.prototype.hasOwnProperty.call(LV_IT, x.title)) { x.titleEn = x.title; x.title = LV_IT[x.title]; } });
      var t = $('lvl-title'); if (t && LV_IT[t.textContent]) t.textContent = LV_IT[t.textContent];
      conta('livelli');
    } catch(e){ warn('livelli', e); }
  }
  var TRAG_IT = { 'Livello Sharp':'Livello Volpe', 'Patron':'Il Padrino', 'High Roller':'Gran colpo' };
  function traguardiIt(){
    if (en()) return;
    [].forEach.call(D.querySelectorAll('#pf-achievements .ach-pill'), function(p){
      for (var n = p.firstChild; n; n = n.nextSibling) if (n.nodeType === 3) {
        var v = n.nodeValue;
        for (var k in TRAG_IT) { var r = new RegExp('(^|\\s)' + k + '\\s*$'); if (r.test(v)) { n.nodeValue = v.replace(r, '$1' + TRAG_IT[k]); break; } }
      }
    });
  }
  function vittorie(){
    var lb = $('lb-list'); if (!lb) return;
    [].forEach.call(lb.querySelectorAll('.xp-row .t > span, .lb-info'), function(s){
      var t = s.textContent, n = t.replace(/(\d+)W\s*$/, function(a, x){ return x + ' ' + (en() ? (x === '1' ? 'win' : 'wins') : (x === '1' ? 'vittoria' : 'vittorie')); });
      if (n !== t) s.textContent = n;
    });
  }
  function guardaLb(){
    var lb = $('lb-list'); if (!lb || lb.__xfin || !W.MutationObserver) return;
    lb.__xfin = 1;
    new MutationObserver(function(){ try { vittorie(); } catch(e){} }).observe(lb, { childList:true, subtree:true });
    vittorie();
  }
  function guardaDpi(){
    var mm = $('arc-modal'); if (!mm || mm.__xfin || !W.MutationObserver) return;
    mm.__xfin = 1;
    var ov = $('arc-overlay');
    var f = function(){
      var att = mm.querySelector(':scope > .dpi-attesa');
      mm.classList.toggle('xfin-carica', !!att);
      if (ov) ov.classList.toggle('xfin-carica', !!att);
      if (att && !att.__xfin) {
        att.__xfin = 1;
        att.removeAttribute('style');
        att.innerHTML = '<span class="xfin-rot" aria-hidden="true"></span><span>' + esc(senza(att.textContent)) + '</span>';
      }
    };
    new MutationObserver(f).observe(mm, { childList:true });
    f();
  }
  function pareggio(m){
    if (!m || m.tour || m.you_won || m.winner != null || m.winner_name) return;
    if (Number(m.your_cut_eur) > 0) return;
    var mm = $('arc-modal'); if (!mm) return;
    var sub = [].filter.call(mm.querySelectorAll('.tw-ov-sub'), function(s){ var b = s.querySelector('b'); return b && /^#/.test(b.textContent.trim()) && /si porta a casa|banks|takes home/.test(s.textContent); })[0];
    if (!sub) return;
    sub.remove();
    var t = mm.querySelector('.tw-lose-t');
    if (t && !m.annullata && /SCONFITTA|DEFEAT/.test(t.textContent)) t.textContent = en() ? 'DRAW' : 'PAREGGIO';
    conta('pari');
  }
  function installa(){
    if (!XFIN.on) return;
    avvolgi('gbEsciConferma', function(o){ vestiEsci(o); });
    if (typeof W.dlModeName === 'function' && !W.dlModeName.__xfinR) {
      var dm = W.dlModeName;
      var dmw = function(m){ if (m === 'random') return nomeCaso(); return dm.apply(this, arguments); };
      for (var k in dm) { try { if (Object.prototype.hasOwnProperty.call(dm, k)) dmw[k] = dm[k]; } catch(e){} }
      dmw.__xfinR = true; try { W.dlModeName = dmw; } catch(e){}
    }
    try { if (typeof dlGameMeta !== 'undefined' && dlGameMeta.random) dlGameMeta.random.hero = nomeCaso(); } catch(e){}
    avvolgi('dlPickGame', function(g){ if (g === 'random') vestiCaso(); }, function(g){ if (g === 'random' && W.XA) XA.dlId = ''; });
    avvolgi('rl4Msg', null, null, function(a){ a[0] = rlTrad(a[0]); return a; });
    avvolgi('toast', null, null, function(a){ a[0] = rlTrad(a[0]); return a; });
    ['rtdOv', 'twrOv', 'tkOv', 'gldOv'].forEach(function(n){ avvolgi(n, null, null, argTornei); });
    avvolgi('rtdShowOver', function(m){ pareggio(m); });
    avvolgi('renderProfile', function(){ traguardiIt(); });
    guardaArc(); guardaLb(); guardaDpi();
  }
  livelliIt();
  installa();
  function tardi(){ installa(); etichettaEsci(); }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', function(){ setTimeout(tardi, 0); });
  else setTimeout(tardi, 0);
  W.addEventListener('load', function(){ setTimeout(tardi, 0); });
  D.addEventListener('gbx:screen', function(){ guardaArc(); guardaLb(); guardaDpi(); etichettaEsci(); });
})();
;
(function(){
  'use strict';
  function rifai(){
    var el = document.getElementById('deposit-cta'); if (!el) return;
    var en = (window.GB_LANG === 'en');
    var btn = el.querySelector('button'); if (!btn) return;
    var vai = btn.onclick;
    el.classList.add('xu-cta');
    el.innerHTML = '<div style="flex:1;min-width:0"><div class="xu-t">' + (en ? 'Insufficient balance' : 'Saldo insufficiente') + '</div>'
      + '<div class="xu-s">' + (en ? 'Top up to keep playing' : 'Ricarica per continuare a giocare') + '</div></div>'
      + '<button type="button">' + (en ? 'Top up' : 'Ricarica') + '</button>';
    el.querySelector('button').onclick = vai;
    try { if (window.GBX) GBX.fx('err'); } catch(e){}
  }
  if (typeof window.depositCta === 'function' && !window.depositCta.__xu) {
    var orig = window.depositCta;
    var nuovo = function(){ var r = orig.apply(this, arguments); try { rifai(); } catch(e){} return r; };
    nuovo.__xu = true;
    try { window.depositCta = nuovo; } catch(e){}
  }
  if (typeof window.toast === 'function' && !window.toast.__xu) {
    var ot = window.toast;
    var nt = function(msg, type){ var r = ot.apply(this, arguments); try { if (type === 'err' && window.GBX) GBX.hap('warning'); } catch(e){} return r; };
    nt.__xu = true;
    try { window.toast = nt; } catch(e){}
  }
})();
