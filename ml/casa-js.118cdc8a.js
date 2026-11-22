(function(){
  'use strict';
  if (window.CASA) return;
  var CASA = window.CASA = {};
  function L(it, en){ return (window.GB_LANG === 'en') ? en : it; }
  CASA.L = L;
  var A = { ctx:null, out:null, rev:null, revIn:null, noiseBuf:null };
  function muto(){
    try { if (typeof TWS !== 'undefined' && TWS && TWS.on === false) return true; } catch(e){}
    try { if (typeof SL2 !== 'undefined' && SL2 && SL2.soundsEnabled === false) return true; } catch(e){}
    return false;
  }
  function ctx(){
    if (A.ctx) { try { if (A.ctx.state === 'suspended') A.ctx.resume(); } catch(e){} return A.ctx; }
    try {
      if (typeof TWS !== 'undefined' && TWS) {
        if (!TWS.ctx && TWS.init) TWS.init();
        if (TWS.ctx) { A.ctx = TWS.ctx; A.dest = TWS.mg || TWS.ctx.destination; }
      }
      if (!A.ctx) {
        var C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
        A.ctx = new C(); A.dest = A.ctx.destination;
      }
      var c = A.ctx;
      A.out = c.createGain(); A.out.gain.value = 0.9; A.out.connect(A.dest);
      try {
        var n = Math.floor(c.sampleRate * 0.9), ir = c.createBuffer(2, n, c.sampleRate);
        for (var ch = 0; ch < 2; ch++) { var d = ir.getChannelData(ch);
          for (var i = 0; i < n; i++) d[i] = (Math.random()*2-1) * Math.pow(1 - i/n, 3.2); }
        A.rev = c.createConvolver(); A.rev.buffer = ir;
        A.revIn = c.createGain(); A.revIn.gain.value = 0.22;
        A.revIn.connect(A.rev); A.rev.connect(A.out);
      } catch(e){ A.revIn = null; }
      var nb = c.createBuffer(1, c.sampleRate, c.sampleRate), nd = nb.getChannelData(0);
      for (var k = 0; k < nd.length; k++) nd[k] = Math.random()*2-1;
      A.noiseBuf = nb;
      if (c.state === 'suspended') c.resume();
    } catch(e){ A.ctx = null; }
    return A.ctx;
  }
  function dst(wet){
    if (!wet || !A.revIn) return A.out;
    var g = A.ctx.createGain(); g.gain.value = 1;
    g.connect(A.out);
    var s = A.ctx.createGain(); s.gain.value = wet; g.connect(s); s.connect(A.revIn);
    return g;
  }
  function tone(o){
    var c = A.ctx, t0 = c.currentTime + (o.at || 0);
    var os = c.createOscillator(); os.type = o.type || 'sine';
    os.frequency.setValueAtTime(o.f, t0);
    if (o.f2) os.frequency.exponentialRampToValueAtTime(Math.max(1, o.f2), t0 + (o.glide || o.d));
    if (o.det) os.detune.value = o.det;
    var g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.g || 0.2), t0 + (o.a || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.d);
    var n = os;
    if (o.lp) { var f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; os.connect(f); n = f; }
    n.connect(g); g.connect(dst(o.wet));
    os.start(t0); os.stop(t0 + o.d + 0.05);
  }
  function noise(o){
    var c = A.ctx, t0 = c.currentTime + (o.at || 0);
    var s = c.createBufferSource(); s.buffer = A.noiseBuf;
    s.playbackRate.value = o.rate || 1;
    var f = c.createBiquadFilter(); f.type = o.ft || 'bandpass';
    f.frequency.setValueAtTime(o.f || 2000, t0);
    if (o.f2) f.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t0 + o.d);
    f.Q.value = o.q || 1;
    var g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.g || 0.2), t0 + (o.a || 0.003));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.d);
    s.connect(f); f.connect(g); g.connect(dst(o.wet));
    var off = Math.random() * 0.5;
    s.start(t0, off, o.d + 0.05);
  }
  function bell(f, at, g, d, wet){
    var c = A.ctx, t0 = c.currentTime + (at || 0);
    var car = c.createOscillator(), mod = c.createOscillator(), mg = c.createGain(), out = c.createGain();
    car.frequency.value = f; mod.frequency.value = f * 3.5;
    mg.gain.setValueAtTime(f * 2.2, t0); mg.gain.exponentialRampToValueAtTime(1, t0 + d);
    mod.connect(mg); mg.connect(car.frequency);
    out.gain.setValueAtTime(0.0001, t0); out.gain.exponentialRampToValueAtTime(g, t0 + 0.004);
    out.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    car.connect(out); out.connect(dst(wet == null ? 0.35 : wet));
    car.start(t0); mod.start(t0); car.stop(t0 + d + 0.05); mod.stop(t0 + d + 0.05);
  }
  var NOTE = function(semi){ return 440 * Math.pow(2, semi / 12); };
  var RICETTE = {
    click: function(){ tone({f:1700, d:0.035, g:0.06, type:'triangle'}); },
    tick: function(){ noise({f:3800, q:6, d:0.025, g:0.18}); tone({f:1200, d:0.02, g:0.04, type:'square'}); },
    hover: function(){ tone({f:2400, d:0.02, g:0.025, type:'sine'}); },
    deal: function(){ noise({ft:'bandpass', f:5200, f2:1400, q:0.8, d:0.12, g:0.22});
                      noise({ft:'highpass', f:2600, q:0.7, d:0.03, g:0.16, at:0.1}); },
    flip: function(){ noise({ft:'highpass', f:3200, q:0.9, d:0.045, g:0.24});
                      tone({f:900, f2:500, d:0.05, g:0.05, type:'triangle', at:0.01}); },
    shuffle: function(){ for (var i = 0; i < 14; i++) noise({ft:'bandpass', f:3000 + Math.random()*2500, q:1.2, d:0.03, g:0.1, at:i*0.028}); },
    chip: function(){ noise({ft:'bandpass', f:3600, q:8, d:0.03, g:0.32});
                      noise({ft:'bandpass', f:2400, q:9, d:0.04, g:0.22, at:0.035});
                      tone({f:5200 + Math.random()*500, d:0.06, g:0.03, type:'sine', at:0.01}); },
    chips: function(){ for (var i = 0; i < 6; i++) { var at = i*0.045 + Math.random()*0.02;
                         noise({ft:'bandpass', f:2800 + Math.random()*1600, q:8, d:0.035, g:0.22, at:at}); } },
    coin: function(){ bell(NOTE(15) * 2, 0, 0.12, 0.5); bell(NOTE(22) * 2, 0.06, 0.09, 0.6); },
    win: function(){ [0,4,7,12].forEach(function(s,i){ bell(NOTE(s+3), i*0.085, 0.13, 0.7); });
                     tone({f:NOTE(-9), d:0.5, g:0.08, type:'triangle', at:0.02, wet:0.3}); },
    bigwin: function(){
      var seq = [0,4,7,12,16,19,24];
      seq.forEach(function(s,i){ bell(NOTE(s+3), i*0.07, 0.14, 0.9); });
      [0,4,7].forEach(function(s){ tone({f:NOTE(s-9), d:1.4, g:0.07, type:'sawtooth', lp:1800, at:0.5, wet:0.4}); });
      for (var i = 0; i < 14; i++) bell(NOTE(24 + (i%5)*2) * 2, 0.55 + i*0.06 + Math.random()*0.03, 0.05, 0.35);
    },
    lose: function(){ tone({f:NOTE(-2), f2:NOTE(-7), d:0.35, g:0.1, type:'triangle', wet:0.3});
                      tone({f:NOTE(-9), f2:NOTE(-14), d:0.5, g:0.09, type:'sine', at:0.16, wet:0.3}); },
    push: function(){ tone({f:NOTE(0), d:0.25, g:0.08, type:'triangle', wet:0.25}); tone({f:NOTE(0), d:0.3, g:0.06, type:'triangle', at:0.14, wet:0.25}); },
    whoosh: function(){ noise({ft:'bandpass', f:600, f2:3200, q:0.7, d:0.28, g:0.14}); },
    pop: function(){ tone({f:520, f2:1200, d:0.08, g:0.12, type:'sine'}); noise({ft:'highpass', f:4000, d:0.03, g:0.08}); },
    scratch: function(){ noise({ft:'bandpass', f:2600 + Math.random()*1500, q:1.5, d:0.06, g:0.07}); },
    bounce: function(p){ var f = 900 + (p||0)*700 + Math.random()*120; tone({f:f, d:0.07, g:0.06, type:'sine'}); noise({ft:'bandpass', f:f*3, q:10, d:0.02, g:0.08}); },
    lock: function(){ noise({ft:'bandpass', f:1500, q:5, d:0.05, g:0.3}); tone({f:180, d:0.08, g:0.12, type:'square', lp:900, at:0.02}); },
    unlock: function(){ noise({ft:'bandpass', f:2200, q:6, d:0.04, g:0.25}); noise({ft:'bandpass', f:1400, q:6, d:0.05, g:0.25, at:0.07});
                        tone({f:NOTE(7), d:0.3, g:0.07, type:'triangle', at:0.1, wet:0.3}); },
    alarm: function(){ for (var i = 0; i < 3; i++) tone({f:880, f2:440, d:0.18, g:0.07, type:'square', lp:2500, at:i*0.2}); },
    boom: function(){ noise({ft:'lowpass', f:1200, f2:60, q:0.7, d:0.9, g:0.5, wet:0.4}); tone({f:120, f2:30, d:0.7, g:0.4, type:'sine'}); },
    click_gun: function(){ noise({ft:'bandpass', f:3000, q:4, d:0.03, g:0.35}); tone({f:220, d:0.04, g:0.1, type:'square', lp:1200, at:0.01}); },
    bang: function(){ noise({ft:'lowpass', f:5000, f2:200, q:0.5, d:0.45, g:0.6, wet:0.5}); tone({f:90, f2:40, d:0.3, g:0.4}); },
    spin: function(){ for (var i = 0; i < 10; i++) noise({f:4000, q:6, d:0.02, g:0.12, at:i*0.05*(1+i*0.12)}); },
    heart: function(){ tone({f:70, d:0.12, g:0.3}); tone({f:60, d:0.14, g:0.25, at:0.16}); },
    blackjack: function(){ RICETTE.chips(); [0,7,12,16,19].forEach(function(s,i){ bell(NOTE(s+5), 0.1+i*0.06, 0.12, 0.8); }); }
  };
  CASA.sfx = function(nome, arg){
    if (muto()) return;
    if (!ctx() || !A.out) return;
    var r = RICETTE[nome]; if (!r) return;
    try { r(arg); } catch(e){}
  };
  CASA.rombo = function(){
    var vuoto = { set:function(){}, stop:function(){} };
    if (muto() || !ctx() || !A.out) return vuoto;
    try {
      var c = A.ctx, os = c.createOscillator(), os2 = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
      os.type = 'sawtooth'; os2.type = 'square'; os.frequency.value = 80; os2.frequency.value = 80.7;
      f.type = 'lowpass'; f.frequency.value = 500; g.gain.value = 0.0001;
      os.connect(f); os2.connect(f); f.connect(g); g.connect(A.out);
      os.start(); os2.start();
      g.gain.exponentialRampToValueAtTime(0.05, c.currentTime + 0.3);
      return {
        set: function(x){ try { var t = c.currentTime, fr = 80 + Math.min(1, x) * 520;
          os.frequency.setTargetAtTime(fr, t, 0.08); os2.frequency.setTargetAtTime(fr * 1.01, t, 0.08);
          f.frequency.setTargetAtTime(500 + Math.min(1, x) * 3000, t, 0.1); } catch(e){} },
        stop: function(){ try { var t = c.currentTime; g.gain.setTargetAtTime(0.0001, t, 0.05); os.stop(t + 0.3); os2.stop(t + 0.3); } catch(e){} }
      };
    } catch(e){ return vuoto; }
  };
  CASA.hap = function(t){ try { if (typeof hapGioco === 'function') hapGioco(t || 'leggero'); } catch(e){} };
  var lento = false;
  try { lento = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); } catch(e){}
  CASA.lento = function(){ return lento || !!(window.GB_LITE || document.documentElement.classList.contains('gb-lite')); };
  CASA.scoppio = function(el, o){
    o = o || {};
    if (!el || !el.getBoundingClientRect || !document.body.animate) return;
    var n = Math.min(o.n || 26, CASA.lento() ? 10 : 40);
    var r = el.getBoundingClientRect();
    var cx = r.left + r.width * (o.x == null ? 0.5 : o.x), cy = r.top + r.height * (o.y == null ? 0.5 : o.y);
    var col = o.colori || ['#ffd54a','#ffb300','#fff3b0','#3ddc84','#ff5c8a','#6ec6ff'];
    var tipo = o.tipo || 'coriandoli';
    for (var i = 0; i < n; i++) {
      var p = document.createElement('div');
      p.className = 'casa-part casa-part-' + tipo;
      if (tipo === 'monete') p.textContent = '€';
      else p.style.background = col[i % col.length];
      p.style.left = cx + 'px'; p.style.top = cy + 'px';
      document.body.appendChild(p);
      var ang = (o.angolo != null ? o.angolo : -Math.PI/2) + (Math.random() - 0.5) * (o.apertura || Math.PI * 1.6);
      var v = (o.forza || 170) * (0.55 + Math.random() * 0.7);
      var dx = Math.cos(ang) * v, dy = Math.sin(ang) * v, cad = (o.caduta == null ? 260 : o.caduta) * (0.7 + Math.random()*0.6);
      var rot = (Math.random() - 0.5) * 900, dur = (o.durata || 1100) * (0.75 + Math.random()*0.5);
      var a = p.animate([
        { transform:'translate(-50%,-50%) translate(0,0) rotate(0deg) scale(1)', opacity:1 },
        { transform:'translate(-50%,-50%) translate(' + dx*0.75 + 'px,' + dy*0.75 + 'px) rotate(' + rot*0.6 + 'deg) scale(1)', opacity:1, offset:0.45 },
        { transform:'translate(-50%,-50%) translate(' + dx + 'px,' + (dy + cad) + 'px) rotate(' + rot + 'deg) scale(0.7)', opacity:0 }
      ], { duration:dur, easing:'cubic-bezier(.2,.7,.4,1)', delay:Math.random()*90 });
      a.onfinish = (function(q){ return function(){ if (q.parentNode) q.parentNode.removeChild(q); }; })(p);
    }
  };
  CASA.scuoti = function(el, forza){
    if (!el || !el.animate || CASA.lento()) return;
    var f = forza || 6;
    el.animate([{transform:'translate(0,0)'},{transform:'translate(' + (-f) + 'px,' + (f*0.4) + 'px)'},
                {transform:'translate(' + f + 'px,' + (-f*0.3) + 'px)'},{transform:'translate(' + (-f*0.5) + 'px,0)'},
                {transform:'translate(0,0)'}], {duration:320, easing:'ease-out'});
  };
  CASA.pulsa = function(el){
    if (!el || !el.animate) return;
    el.animate([{transform:'scale(1)'},{transform:'scale(1.12)'},{transform:'scale(1)'}], {duration:360, easing:'cubic-bezier(.3,1.6,.5,1)'});
  };
  CASA.conta = function(el, da, a, ms, fmt){
    if (!el) return;
    fmt = fmt || function(x){ return '€' + x.toFixed(2); };
    var t0 = performance.now(), D = ms || 900;
    function passo(t){
      var k = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(da + (a - da) * e);
      if (k < 1) requestAnimationFrame(passo);
    }
    requestAnimationFrame(passo);
  };
  CASA.esito = function(cont, tipo, titolo, sotto, importo){
    if (!cont) return null;
    var vecchio = cont.querySelector('.casa-esito'); if (vecchio) vecchio.remove();
    var d = document.createElement('div');
    d.className = 'casa-esito casa-esito-' + tipo;
    d.innerHTML = '<div class="casa-esito-t">' + titolo + '</div>' +
                  (importo ? '<div class="casa-esito-n">' + importo + '</div>' : '') +
                  (sotto ? '<div class="casa-esito-s">' + sotto + '</div>' : '');
    d.onclick = function(){ d.classList.add('via'); setTimeout(function(){ d.remove(); }, 250); };
    cont.appendChild(d);
    return d;
  };
  CASA.togliEsito = function(cont){ var v = cont && cont.querySelector('.casa-esito'); if (v) v.remove(); };
  var SEMI = ['♠','♥','♦','♣'], RANGHI = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  var PIPS = {
    2:[[50,18],[50,82,1]], 3:[[50,18],[50,50],[50,82,1]],
    4:[[30,18],[70,18],[30,82,1],[70,82,1]], 5:[[30,18],[70,18],[50,50],[30,82,1],[70,82,1]],
    6:[[30,18],[70,18],[30,50],[70,50],[30,82,1],[70,82,1]],
    7:[[30,18],[70,18],[50,34],[30,50],[70,50],[30,82,1],[70,82,1]],
    8:[[30,18],[70,18],[50,34],[30,50],[70,50],[50,66,1],[30,82,1],[70,82,1]],
    9:[[30,16],[70,16],[30,39],[70,39],[50,50],[30,61,1],[70,61,1],[30,84,1],[70,84,1]],
    10:[[30,16],[70,16],[50,28],[30,39],[70,39],[30,61,1],[70,61,1],[50,72,1],[30,84,1],[70,84,1]]
  };
  CASA.normCarta = function(c){
    if (!c) return null;
    if (c.rank != null) return { r: RANGHI[c.rank], s: SEMI[c.suit], rosso: c.suit === 1 || c.suit === 2 };
    var s = c.s; return { r: String(c.r), s: s, rosso: s === '♥' || s === '♦' || !!c.red };
  };
  CASA.carta = function(c, cls){
    cls = cls ? ' ' + cls : '';
    if (!c || c.hidden) return '<div class="casa-carta dorso' + cls + '"><div class="casa-dorso"></div></div>';
    var k = CASA.normCarta(c); if (!k) return '<div class="casa-carta vuota' + cls + '"></div>';
    var col = k.rosso ? ' rossa' : '';
    var angolo = '<div class="casa-ang"><b>' + k.r + '</b><i>' + k.s + '</i></div>';
    var centro = '';
    var n = parseInt(k.r, 10);
    if (PIPS[n]) {
      centro = '<div class="casa-pips">' + PIPS[n].map(function(p){
        return '<span style="left:' + p[0] + '%;top:' + p[1] + '%"' + (p[2] ? ' class="giu"' : '') + '>' + k.s + '</span>';
      }).join('') + '</div>';
    } else if (k.r === 'A') {
      centro = '<div class="casa-asso">' + k.s + '</div>';
    } else {
      centro = '<div class="casa-figura"><div class="casa-fig-l">' + k.r + '</div><div class="casa-fig-s">' + k.s + '</div></div>';
    }
    return '<div class="casa-carta' + col + cls + '">' + angolo + centro + '<div class="casa-ang giu">' + '<b>' + k.r + '</b><i>' + k.s + '</i></div></div>';
  };
  var TAGLI = [[500,'#1a1a1a','#ffd54a'],[100,'#111827','#e5e7eb'],[25,'#15803d','#ecfccb'],[5,'#b91c1c','#fee2e2'],[1,'#1d4ed8','#dbeafe'],[0.5,'#7c3aed','#ede9fe']];
  CASA.fiche = function(eur, max){
    var out = [], resto = Math.round(eur * 100) / 100, lim = max || 7;
    for (var i = 0; i < TAGLI.length && out.length < lim; i++) {
      while (resto + 1e-9 >= TAGLI[i][0] && out.length < lim) { out.push(TAGLI[i]); resto = Math.round((resto - TAGLI[i][0]) * 100) / 100; }
    }
    return '<div class="casa-pila">' + out.reverse().map(function(t, j){
      return '<span class="casa-fic" style="--c:' + t[1] + ';--b:' + t[2] + ';--i:' + j + '"></span>';
    }).join('') + '</div>';
  };
  CASA.ficheBottone = function(eur){
    var t = TAGLI[TAGLI.length - 1];
    for (var i = 0; i < TAGLI.length; i++) if (eur + 1e-9 >= TAGLI[i][0]) { t = TAGLI[i]; break; }
    return 'style="--c:' + t[1] + ';--b:' + t[2] + '"';
  };
  CASA.eur = function(x){ x = Math.round(x * 100) / 100; return '€' + (x % 1 ? x.toFixed(2) : String(x)); };
  var NOMI_IT = ['Carta alta','Coppia','Doppia coppia','Tris','Scala','Colore','Full','Poker','Scala colore','Scala reale'];
  var NOMI_EN = ['High card','Pair','Two pair','Three of a kind','Straight','Flush','Full house','Four of a kind','Straight flush','Royal flush'];
  CASA.nomeMano = function(cat){ return (window.GB_LANG === 'en' ? NOMI_EN : NOMI_IT)[cat] || ''; };
  function val5(cs){
    var rs = cs.map(function(c){ return c.rank; }).sort(function(a,b){ return b-a; });
    var fl = cs.every(function(c){ return c.suit === cs[0].suit; });
    var st = false, top = rs[0];
    if (rs.join() === '12,3,2,1,0') { st = true; top = 3; }
    else st = rs.every(function(r,i){ return i === 0 || rs[i-1] - 1 === r; });
    var cnt = {}; rs.forEach(function(r){ cnt[r] = (cnt[r]||0) + 1; });
    var gr = Object.keys(cnt).map(Number).sort(function(a,b){ return cnt[b]-cnt[a] || b-a; });
    var v = gr.map(function(r){ return cnt[r]; });
    var cat;
    if (st && fl) cat = (top === 12 && rs[1] === 11) ? 9 : 8;
    else if (v[0] === 4) cat = 7; else if (v[0] === 3 && v[1] === 2) cat = 6;
    else if (fl) cat = 5; else if (st) cat = 4; else if (v[0] === 3) cat = 3;
    else if (v[0] === 2 && v[1] === 2) cat = 2; else if (v[0] === 2) cat = 1; else cat = 0;
    var key = st ? [top] : gr;
    return [cat].concat(key);
  }
  function cmp(a,b){ for (var i = 0; i < Math.max(a.length,b.length); i++){ var d = (a[i]||0) - (b[i]||0); if (d) return d; } return 0; }
  CASA.manoMigliore = function(carte){
    carte = (carte || []).filter(function(c){ return c && c.rank != null; });
    if (carte.length < 5) {
      if (carte.length >= 2) {
        var c2 = {}; carte.forEach(function(c){ c2[c.rank] = (c2[c.rank]||0) + 1; });
        var m = 0; for (var k in c2) m = Math.max(m, c2[k]);
        var cat = m >= 3 ? 3 : (m === 2 ? 1 : 0); return { cat:cat, nome:CASA.nomeMano(cat), idx:[] };
      }
      return null;
    }
    var best = null, bi = null, n = carte.length;
    for (var a = 0; a < n; a++) for (var b = a+1; b < n; b++) for (var c = b+1; c < n; c++) for (var d = c+1; d < n; d++) for (var e = d+1; e < n; e++) {
      var v = val5([carte[a],carte[b],carte[c],carte[d],carte[e]]);
      if (!best || cmp(v, best) > 0) { best = v; bi = [a,b,c,d,e]; }
    }
    return { cat: best[0], nome: CASA.nomeMano(best[0]), idx: bi, v: best };
  };
})();
(function(){
  'use strict';
  var L = CASA.L, E = CASA.eur;
  var PAGA = [[9,100],[8,20],[7,10],[6,3],[5,2],[4,1]];
  var CHP = window.CHP = { fase:'punta', ante:1, d:null, busy:false, ultima:0 };
  function $(id){ return document.getElementById(id); }
  try { var a0 = parseFloat(localStorage.getItem('chp_ante')); if (a0 > 0) CHP.ante = a0; } catch(e){}
  function testi(){
    $('chp-l-banco').textContent = L('BANCO', 'DEALER');
    $('chp-l-tu').textContent = L('TU', 'YOU');
    $('chp-t-cambia').textContent = L('CAMBIA PUNTATA', 'CHANGE BET');
    $('chp-t-rigioca').textContent = L('RIGIOCA', 'REBET');
    var rg = $('chp-regole');
    rg.innerHTML = '<b>' + L('COME SI GIOCA', 'HOW TO PLAY') + '</b>' +
      '<p>' + L('Metti l’ante: ricevi 2 carte e vedi subito il flop. Il banco ha 2 carte coperte.',
                'Place the ante: you get 2 cards and see the flop. The dealer has 2 hidden cards.') + '</p>' +
      '<p><span class="r">FOLD</span> ' + L('perdi l’ante.', 'you lose the ante.') +
      ' <span class="v">CALL</span> ' + L('metti 2 volte l’ante, escono turn e river.', 'you add 2x the ante, turn and river are dealt.') + '</p>' +
      '<p>' + L('Il banco gioca solo con una <b>coppia di 4 o meglio</b>. Se non gioca: l’ante paga la tabella e il call torna indietro.',
                'The dealer plays only with a <b>pair of 4s or better</b>. If not: the ante pays the table and the call is returned.') + '</p>' +
      '<p>' + L('Se gioca e vinci: ante a tabella + call 1:1. Pari: tutto indietro.',
                'If the dealer plays and you win: ante per table + call 1:1. Tie: everything back.') + '</p>';
  }
  function tabella(evid){
    var h = '<div class="chp-tab-t">' + L('L’ANTE PAGA', 'ANTE PAYS') + '</div>';
    PAGA.forEach(function(p){
      var nome = p[0] === 4 ? L('Scala o meno', 'Straight or less') : CASA.nomeMano(p[0]);
      h += '<div class="chp-tab-r' + ((evid != null && (evid === p[0] || (p[0] === 4 && evid < 4))) ? ' on' : '') + '"><span>' + nome + '</span><b>' + p[1] + ':1</b></div>';
    });
    $('chp-tabella').innerHTML = h;
  }
  function gettoni(){
    var c = $('chp-gettoni'), h = '';
    (window.BETS || [0.5,1,2,5,10,25,50,100]).forEach(function(b){
      h += '<button class="casa-gettone' + (Math.abs(b - CHP.ante) < 1e-9 ? ' sel' : '') + '" ' + CASA.ficheBottone(b) +
           ' onclick="CHP.scegli(' + b + ')">' + E(b) + '</button>';
    });
    c.innerHTML = h;
    var b = $('chp-dai');
    b.innerHTML = L('DISTRIBUISCI', 'DEAL') + ' · ANTE ' + E(CHP.ante) +
      '<small>' + L('serve ', 'you need ') + E(CHP.ante * 3) + L(' (ante + call)', ' (ante + call)') + '</small>';
    var s = c.querySelector('.sel'); if (s && s.scrollIntoView) try { s.scrollIntoView({inline:'center', block:'nearest'}); } catch(e){}
  }
  CHP.scegli = function(b){
    if (CHP.fase !== 'punta' || CHP.busy) return;
    CHP.ante = b; try { localStorage.setItem('chp_ante', String(b)); } catch(e){}
    CASA.sfx('chip'); gettoni(); cerchi(b, 0);
  };
  function cerchi(ante, call){
    $('chp-f-ante').innerHTML = ante ? CASA.fiche(ante, 6) : '';
    $('chp-v-ante').textContent = ante ? E(ante) : '';
    $('chp-f-call').innerHTML = call ? CASA.fiche(call, 6) : '';
    $('chp-v-call').textContent = call ? E(call) : '';
    $('chp-call').classList.toggle('pieno', !!call);
  }
  function stato(t, accento){ var s = $('chp-stato'); s.textContent = t || ''; s.classList.toggle('accento', !!accento); }
  function comandi(quali){
    $('chp-punta').style.display = quali === 'punta' ? '' : 'none';
    $('chp-decidi').style.display = quali === 'decidi' ? '' : 'none';
    $('chp-ancora').style.display = quali === 'ancora' ? '' : 'none';
  }
  function carte(id, lista, slot, cls, anim){
    var h = '';
    for (var i = 0; i < slot; i++) {
      var c = lista[i];
      var k = (cls || '') + (anim && anim[i] ? ' ' + anim[i] : '');
      h += c ? CASA.carta(c, k) : '<div class="casa-carta vuota' + (cls ? ' ' + cls : '') + '"></div>';
    }
    $(id).innerHTML = h;
    if (anim) $(id).querySelectorAll('.casa-carta').forEach(function(el, i){ if (anim[i]) el.style.animationDelay = (anim.ritardo ? anim.ritardo[i] : 0) + 'ms'; });
  }
  function manoTu(d, comm){
    var m = CASA.manoMigliore((d.player || []).concat(comm || []));
    $('chp-mano-tu').textContent = m ? m.nome : '';
    tabella(m ? m.cat : null);
    return m;
  }
  CHP.enter = function(){
    testi(); tabella(null); gettoni();
    if (CHP.fase === 'punta') nuovo();
  };
  function nuovo(){
    CHP.fase = 'punta'; CHP.d = null;
    CASA.togliEsito($('chp-tavolo'));
    carte('chp-c-banco', [], 2, ''); carte('chp-c-board', [], 5, ''); carte('chp-c-tu', [], 2, 'grande');
    $('chp-mano-tu').textContent = ''; $('chp-mano-banco').textContent = ''; $('chp-qual').textContent = '';
    $('chp-qual').className = 'chp-qual';
    $('chp-scritta').innerHTML = '<span>' + L('IL BANCO GIOCA CON', 'DEALER QUALIFIES WITH') + ' 4·4 ' + L('O MEGLIO', 'OR BETTER') + '</span>';
    cerchi(CHP.ante, 0); comandi('punta'); gettoni(); tabella(null);
    stato(L('Scegli la puntata e distribuisci', 'Pick your ante and deal'));
  }
  CHP.cambia = function(){ CASA.sfx('click'); nuovo(); };
  function chiama(path, body, ok){
    CHP.busy = true;
    fetch(BACKEND + path, { method:'POST', headers:{'Content-Type':'application/json','ngrok-skip-browser-warning':'1'}, body:JSON.stringify(body) })
      .then(function(r){ return r.json(); })
      .then(function(d){
        CHP.busy = false;
        if (!d || d.error) {
          var m = (d && d.error) || 'error';
          if (/3x the ante/.test(m)) m = L('Saldo insufficiente: servono ', 'Insufficient balance: you need ') + E(CHP.ante * 3) + ' (ante + call)';
          toast('⚠️ ' + m, 'err'); if (typeof loadBalance === 'function') loadBalance();
          if (CHP.fase === 'dando') nuovo(); else if (CHP.fase === 'chiamo') { CHP.fase = 'decidi'; comandi('decidi'); }
          return;
        }
        if (d.btc !== undefined || d.cent !== undefined) { try { S.btc = saldoDa(d); refresh(); } catch(e){} }
        ok(d);
      })
      .catch(function(){ CHP.busy = false; toast(L('Errore di rete', 'Network error'), 'err');
        if (CHP.fase === 'dando') nuovo(); else if (CHP.fase === 'chiamo') { CHP.fase = 'decidi'; comandi('decidi'); } });
  }
  CHP.dai = function(){
    if (CHP.busy) return;
    if (!S.userId) { toast(L('Apri dentro Telegram per giocare', 'Open in Telegram to play'), 'err'); return; }
    if (!hasFunds(CHP.ante * 3)) { toast(L('Saldo insufficiente: servono ', 'Insufficient balance: you need ') + E(CHP.ante * 3) + ' (ante + call)', 'err'); return; }
    if (CHP.fase === 'fine') nuovo();
    else if (CHP.fase !== 'punta') return;
    CHP.fase = 'dando'; comandi('nessuno'); stato(L('Distribuisco…', 'Dealing…'));
    CASA.sfx('chips'); CASA.hap('leggero');
    chiama('/poker/deal', Object.assign({ user_id:S.userId }, postaCent(CHP.ante, 'ante')), function(d){
      CHP.d = d; CHP.fase = 'decidi';
      var rit = [0, 160, 320, 480], flop = [700, 830, 960];
      carte('chp-c-tu', d.player, 2, 'grande', { 0:'arriva', 1:'arriva', ritardo:[rit[0], rit[2]] });
      carte('chp-c-banco', [{hidden:true},{hidden:true}], 2, '', { 0:'arriva', 1:'arriva', ritardo:[rit[1], rit[3]] });
      carte('chp-c-board', (d.community || []).slice(0,3), 5, '', { 0:'gira', 1:'gira', 2:'gira', ritardo:flop });
      [0,1,2,3].forEach(function(i){ setTimeout(function(){ CASA.sfx('deal'); }, rit[i]); });
      flop.forEach(function(t){ setTimeout(function(){ CASA.sfx('flip'); }, t); });
      setTimeout(function(){
        var m = manoTu(d, (d.community || []).slice(0,3));
        $('chp-s-fold').textContent = '-' + E(CHP.ante);
        $('chp-s-call').textContent = '+' + E(CHP.ante * 2);
        comandi('decidi');
        stato(m && m.cat >= 1 ? L('Hai ', 'You have ') + m.nome.toLowerCase() + ' — ' + L('chiami?', 'call?') : L('Chiami o lasci?', 'Call or fold?'), true);
      }, 1150);
    });
  };
  CHP.agisci = function(az){
    if (CHP.busy || CHP.fase !== 'decidi') return;
    CHP.fase = 'chiamo'; comandi('nessuno');
    if (az === 'call') { CASA.sfx('chips'); cerchi(CHP.ante, CHP.ante * 2); CASA.pulsa($('chp-call')); stato(L('Turn e river…', 'Turn and river…')); }
    else { CASA.sfx('whoosh'); $('chp-c-tu').querySelectorAll('.casa-carta').forEach(function(el){ el.classList.add('spenta'); }); stato(''); }
    CASA.hap('leggero');
    chiama('/poker/act', { user_id:S.userId, action:az }, function(d){ CHP.d = d; mostra(d, az); });
  };
  function mostra(d, az){
    CHP.fase = 'fine';
    var comm = d.community || [];
    var t = 0;
    if (az === 'call') {
      carte('chp-c-board', comm, 5, '', { 3:'gira', 4:'gira', ritardo:[0,0,0,150,750] });
      setTimeout(function(){ CASA.sfx('flip'); manoTu(d, comm.slice(0,4)); }, 150);
      setTimeout(function(){ CASA.sfx('flip'); manoTu(d, comm); }, 750);
      t = 1350;
    }
    setTimeout(function(){
      carte('chp-c-banco', d.dealer || [], 2, '', { 0:'gira', 1:'gira', ritardo:[0, 140] });
      CASA.sfx('flip'); setTimeout(function(){ CASA.sfx('flip'); }, 140);
      if (az === 'call') {
        var mb = CASA.manoMigliore((d.dealer || []).concat(comm));
        $('chp-mano-banco').textContent = mb ? mb.nome : '';
        var q = $('chp-qual');
        if (d.dealer_qualifies === false) { q.textContent = L('NON GIOCA', 'DOES NOT QUALIFY'); q.className = 'chp-qual no'; }
        else if (d.dealer_qualifies) { q.textContent = L('GIOCA', 'QUALIFIES'); q.className = 'chp-qual si'; }
      }
      setTimeout(function(){ esito(d, az, comm); }, 650);
    }, t);
  }
  function esito(d, az, comm){
    var tav = $('chp-tavolo');
    var ante = CHP.ante, messo = az === 'call' ? ante * 3 : ante;
    var mt = CASA.manoMigliore((d.player || []).concat(comm));
    if (d.result === 'win' && mt && mt.idx && mt.idx.length) {
      var tutte = Array.prototype.slice.call($('chp-c-tu').children).concat(Array.prototype.slice.call($('chp-c-board').children));
      tutte.forEach(function(el, i){ if (mt.idx.indexOf(i) >= 0) el.classList.add('vincente'); else el.classList.add('spenta'); });
    }
    var netto = (d.result === 'win') ? ((d.won_cent || 0) / 100 - messo) : (d.result === 'push' ? 0 : -messo);
    var tipo, tit, sotto = '';
    if (d.result === 'win') {
      var grande = (d.ch_paga || 1) >= 3;
      tipo = grande ? 'big' : 'win';
      tit = grande ? (mt ? mt.nome.toUpperCase() : L('GRANDE VINCITA', 'BIG WIN')) + '!' : L('HAI VINTO', 'YOU WIN');
      sotto = d.reason === 'dealer_no_qualify'
        ? L('Il banco non gioca: l’ante paga ', 'Dealer does not qualify: ante pays ') + (d.ch_paga || 1) + ':1, ' + L('il call torna indietro', 'call returned')
        : (d.your_hand || '') + ' vs ' + (d.dealer_hand || '');
      CASA.sfx(grande ? 'bigwin' : 'win'); setTimeout(function(){ CASA.sfx('chips'); }, 250);
      CASA.scoppio(tav, { tipo: grande ? 'monete' : 'coriandoli', n: grande ? 34 : 22, y:0.55 });
      if (grande) CASA.scuoti(tav, 5);
      CASA.hap('forte');
    } else if (d.result === 'push') {
      tipo = 'push'; tit = L('PAREGGIO', 'PUSH'); sotto = L('Ti torna tutto: ', 'All returned: ') + E(messo);
      CASA.sfx('push');
    } else {
      tipo = 'lose';
      tit = d.reason === 'fold' ? L('HAI LASCIATO', 'YOU FOLDED') : L('VINCE IL BANCO', 'DEALER WINS');
      sotto = d.reason === 'fold' ? '' : (d.dealer_hand || '') + ' vs ' + (d.your_hand || '');
      CASA.sfx('lose');
    }
    var box = CASA.esito(tav, tipo, tit, sotto, (netto >= 0 ? '+' : '-') + E(Math.abs(netto)));
    if (box && netto > 0) CASA.conta(box.querySelector('.casa-esito-n'), 0, netto, 900, function(x){ return '+' + E(x); });
    $('chp-s-rigioca').textContent = 'ANTE ' + E(CHP.ante);
    comandi('ancora'); stato('');
  }
})();
(function(){
  'use strict';
  var L = CASA.L, E = CASA.eur;
  var CBJ = window.CBJ = { fase:'punta', posta:1, d:null, busy:false, visteBanco:0, viste:[] };
  function $(id){ return document.getElementById(id); }
  try { var p0 = parseFloat(localStorage.getItem('cbj_posta')); if (p0 > 0) CBJ.posta = p0; } catch(e){}
  function valore(cs){
    var v = 0, a = 0;
    (cs || []).forEach(function(c){ if (!c || c.hidden) return; var r = c.r;
      if (r === 'A') { v += 11; a++; } else if (r === 'J' || r === 'Q' || r === 'K') v += 10; else v += parseInt(r, 10); });
    var morbido = false;
    while (v > 21 && a > 0) { v -= 10; a--; }
    if (a > 0 && v <= 21) morbido = true;
    return { v:v, morbido:morbido && v !== 21 };
  }
  function scriviVal(el, cs, fine){
    var x = valore(cs);
    if (!cs || !cs.length) { el.textContent = ''; el.className = 'cbj-val'; return; }
    el.textContent = (x.morbido && !fine) ? (x.v - 10) + '/' + x.v : String(x.v);
    el.className = 'cbj-val' + (x.v > 21 ? ' sballa' : (x.v === 21 ? ' ventuno' : ''));
  }
  function testi(){
    $('cbj-arco1').textContent = L('IL BLACKJACK PAGA 3 A 2', 'BLACKJACK PAYS 3 TO 2');
    $('cbj-arco2').textContent = L('IL BANCO STA SU 17', 'DEALER STANDS ON 17');
    $('cbj-t-cambia').textContent = L('CAMBIA PUNTATA', 'CHANGE BET');
    $('cbj-t-rigioca').textContent = L('RIGIOCA', 'REBET');
    $('cbj-regole').innerHTML = '<b>' + L('COME SI GIOCA', 'HOW TO PLAY') + '</b>' +
      '<p>' + L('Arriva più vicino a 21 del banco senza sballare. Le figure valgono 10, l’asso 1 o 11.',
                'Get closer to 21 than the dealer without busting. Faces are 10, aces 1 or 11.') + '</p>' +
      '<p><span class="v">CARTA</span> ' + L('ne chiedi un’altra', 'take another card') + ' · <span class="r">STAI</span> ' + L('ti fermi', 'stop') +
      ' · <b>RADDOPPIA</b> ' + L('raddoppi la posta e prendi una sola carta', 'double the bet and take one card') +
      ' · <b>DIVIDI</b> ' + L('due carte uguali diventano due mani', 'two equal cards become two hands') + '</p>' +
      '<p>' + L('Vinci 1 a 1, il blackjack paga 3 a 2, il pari ti ridà la posta.', 'Wins pay 1 to 1, blackjack pays 3 to 2, a tie returns the bet.') + '</p>';
  }
  function gettoni(){
    var h = '';
    (window.BETS || [0.5,1,2,5,10,25,50,100]).forEach(function(b){
      h += '<button class="casa-gettone' + (Math.abs(b - CBJ.posta) < 1e-9 ? ' sel' : '') + '" ' + CASA.ficheBottone(b) + ' onclick="CBJ.scegli(' + b + ')">' + E(b) + '</button>';
    });
    $('cbj-gettoni').innerHTML = h;
    $('cbj-dai').innerHTML = L('DISTRIBUISCI', 'DEAL') + ' · ' + E(CBJ.posta);
    var s = $('cbj-gettoni').querySelector('.sel'); if (s && s.scrollIntoView) try { s.scrollIntoView({inline:'center', block:'nearest'}); } catch(e){}
  }
  function cerchio(eur){ $('cbj-fic').innerHTML = eur ? CASA.fiche(eur, 7) : ''; $('cbj-v-posta').textContent = eur ? E(eur) : ''; }
  CBJ.scegli = function(b){
    if (CBJ.fase !== 'punta' || CBJ.busy) return;
    CBJ.posta = b; try { localStorage.setItem('cbj_posta', String(b)); } catch(e){}
    CASA.sfx('chip'); gettoni(); cerchio(b);
  };
  function stato(t, acc){ var s = $('cbj-stato'); s.textContent = t || ''; s.classList.toggle('accento', !!acc); }
  function comandi(q){
    $('cbj-punta').style.display = q === 'punta' ? '' : 'none';
    $('cbj-gioca').style.display = q === 'gioca' ? '' : 'none';
    $('cbj-ancora').style.display = q === 'ancora' ? '' : 'none';
  }
  function banco(lista, mostraTutte, nuoveDa, gira1){
    var h = '';
    lista.forEach(function(c, i){
      var cls = '';
      if (i >= nuoveDa) cls = 'arriva';
      if (gira1 && i === 1) cls = 'gira';
      h += CASA.carta(c, cls);
    });
    $('cbj-c-banco').innerHTML = h || '<div class="casa-carta vuota"></div><div class="casa-carta vuota"></div>';
    scriviVal($('cbj-v-banco'), lista.filter(function(c){ return !c.hidden; }), mostraTutte);
  }
  function mani(d, vecchie, fine){
    var hs = d.hands || [], h = '';
    hs.forEach(function(m, i){
      var att = !fine && d.state !== 'done' && i === (d.active_hand || 0) && hs.length > 1;
      var cls = 'cbj-mano' + (att ? ' attiva' : '') + (fine && m.bust ? ' persa' : '');
      var carte = (m.cards || []).map(function(c, j){ return CASA.carta(c, 'grande' + (j >= (vecchie[i] || 0) ? ' arriva' : '')); }).join('');
      var x = valore(m.cards);
      var tag = '';
      if (m.blackjack) tag = '<i class="cbj-tag bj">BLACKJACK</i>';
      else if (m.bust) tag = '<i class="cbj-tag no">' + L('SBALLATO', 'BUST') + '</i>';
      else if (fine && m.won) tag = '<i class="cbj-tag si">' + L('VINTA', 'WIN') + '</i>';
      else if (fine && m.push) tag = '<i class="cbj-tag pari">' + L('PARI', 'PUSH') + '</i>';
      else if (fine) tag = '<i class="cbj-tag no">' + L('PERSA', 'LOST') + '</i>';
      h += '<div class="' + cls + '"><div class="cbj-carte cbj-ventaglio">' + carte + '</div>' +
           '<div class="cbj-sotto"><span class="cbj-val' + (x.v > 21 ? ' sballa' : (x.v === 21 ? ' ventuno' : '')) + '">' +
           ((x.morbido && !fine && !m.done) ? (x.v - 10) + '/' + x.v : x.v) + '</span>' +
           (hs.length > 1 || m.doubled ? '<span class="cbj-posta">' + E((m.bet_cent || 0) / 100) + (m.doubled ? ' ×2' : '') + '</span>' : '') + tag + '</div></div>';
    });
    $('cbj-mani').innerHTML = h;
    $('cbj-mani').classList.toggle('tante', hs.length > 1);
    var tot = hs.reduce(function(a, m){ return a + (m.bet_cent || 0); }, 0) / 100;
    if (tot > 0) cerchio(tot);
  }
  function bottoni(d){
    var m = (d.hands || [])[d.active_hand || 0] || { cards:[] };
    var posta = (m.bet_cent || 0) / 100;
    var due = m.cards && m.cards.length === 2;
    var vv = function(c){ return c.r === 'A' ? 11 : ('JQK'.indexOf(c.r) >= 0 ? 10 : parseInt(c.r, 10)); };
    var puoD = due && !m.doubled && hasFunds(posta);
    var puoS = due && vv(m.cards[0]) === vv(m.cards[1]) && (d.hands || []).length < 4 && hasFunds(posta);
    $('cbj-b-hit').innerHTML = L('CARTA', 'HIT');
    $('cbj-b-stand').innerHTML = L('STAI', 'STAND');
    $('cbj-b-double').innerHTML = L('RADDOPPIA', 'DOUBLE') + '<small>+' + E(posta) + '</small>';
    $('cbj-b-split').innerHTML = L('DIVIDI', 'SPLIT') + '<small>+' + E(posta) + '</small>';
    $('cbj-b-double').disabled = !puoD; $('cbj-b-split').disabled = !puoS;
    var x = valore(m.cards);
    stato((d.hands || []).length > 1 ? L('Mano ', 'Hand ') + ((d.active_hand || 0) + 1) + ' · ' + x.v : (x.v >= 17 ? L('Hai ', 'You have ') + x.v + ' — ' + L('stai?', 'stand?') : ''), true);
  }
  CBJ.enter = function(){ testi(); if (CBJ.fase === 'punta' || CBJ.fase === 'fine') nuovo(CBJ.fase === 'fine'); };
  function nuovo(tieni){
    if (!tieni) {
      CBJ.fase = 'punta'; CBJ.d = null;
      CASA.togliEsito($('cbj-tavolo'));
      banco([], false, 0); $('cbj-mani').innerHTML = '';
      cerchio(CBJ.posta); comandi('punta'); stato(L('Scegli la puntata', 'Choose your bet'));
    }
    gettoni();
  }
  CBJ.cambia = function(){ CASA.sfx('click'); CBJ.fase = 'punta'; nuovo(false); };
  function chiama(path, body, ok){
    CBJ.busy = true;
    fetch(BACKEND + path, { method:'POST', headers:{'Content-Type':'application/json','ngrok-skip-browser-warning':'1'}, body:JSON.stringify(body) })
      .then(function(r){ return r.json(); })
      .then(function(d){
        CBJ.busy = false;
        if (!d || d.error) { toast('⚠️ ' + ((d && d.error) || 'error'), 'err'); if (typeof loadBalance === 'function') loadBalance();
          if (CBJ.fase === 'dando') nuovo(false); else if (CBJ.d) comandi('gioca'); return; }
        if (d.btc !== undefined || d.cent !== undefined) { try { S.btc = saldoDa(d); refresh(); } catch(e){} }
        ok(d);
      })
      .catch(function(){ CBJ.busy = false; toast(L('Errore di rete', 'Network error'), 'err');
        if (CBJ.fase === 'dando') nuovo(false); else if (CBJ.d) comandi('gioca'); });
  }
  CBJ.dai = function(){
    if (CBJ.busy) return;
    if (!S.userId) { toast(L('Apri dentro Telegram per giocare', 'Open in Telegram to play'), 'err'); return; }
    if (!hasFunds(CBJ.posta)) { toast(L('Saldo insufficiente', 'Insufficient balance'), 'err'); return; }
    if (CBJ.fase === 'fine') nuovo(false);
    else if (CBJ.fase !== 'punta') return;
    CBJ.fase = 'dando'; comandi('nessuno'); stato(L('Distribuisco…', 'Dealing…'));
    CASA.sfx('chips'); CASA.hap('leggero');
    chiama('/bj/deal', Object.assign({ user_id:S.userId }, postaCent(CBJ.posta)), function(d){
      CBJ.d = d;
      var h0 = (d.hands && d.hands[0]) ? d.hands[0].cards : [];
      mani({ hands:[{ cards:h0.slice(0,1), bet_cent:CBJ.posta*100 }], state:'play' }, [0], false); CASA.sfx('deal');
      setTimeout(function(){ banco([d.dealer_up || (d.dealer || [])[0]], false, 0); CASA.sfx('deal'); }, 230);
      setTimeout(function(){ mani({ hands:[{ cards:h0, bet_cent:CBJ.posta*100 }], state:'play' }, [1], false); CASA.sfx('deal'); }, 460);
      setTimeout(function(){
        CASA.sfx('deal');
        if (d.state === 'done') { fine(d, [2], 1); return; }
        banco([d.dealer_up, {hidden:true}], false, 1);
        CBJ.fase = 'gioca'; mani(d, [2], false); bottoni(d); comandi('gioca');
      }, 690);
    });
  };
  CBJ.agisci = function(az){
    if (CBJ.busy || CBJ.fase !== 'gioca' || !CBJ.d) return;
    var prima = (CBJ.d.hands || []).map(function(m){ return (m.cards || []).length; });
    if (az === 'double' || az === 'split') CASA.sfx('chips'); else if (az === 'hit') CASA.sfx('click'); else CASA.sfx('tick');
    CASA.hap('leggero'); comandi('nessuno');
    chiama('/bj/' + az, { user_id:S.userId }, function(d){
      var vecchio = CBJ.d; CBJ.d = d;
      if (az === 'split') { prima = (d.hands || []).map(function(m, i){ return i < prima.length ? 1 : 1; }); }
      CASA.sfx('deal');
      if (d.state === 'done') { fine(d, prima, 2); return; }
      mani(d, prima, false); bottoni(d); comandi('gioca');
      var m = d.hands[d.active_hand || 0];
      if (m && valore(m.cards).v === 21) CASA.sfx('coin');
    });
  };
  function fine(d, prima, vistiBanco){
    CBJ.fase = 'finendo';
    mani(d, prima, false);
    var dl = d.dealer || [];
    var t = 380;
    setTimeout(function(){ banco(dl.slice(0, 2), true, 2, true); CASA.sfx('flip'); }, t);
    for (var k = 2; k < dl.length; k++) {
      (function(k){ t += 620; setTimeout(function(){ banco(dl.slice(0, k + 1), true, k); CASA.sfx('deal'); }, t); })(k);
    }
    setTimeout(function(){ esito(d); }, t + 650);
  }
  function esito(d){
    CBJ.fase = 'fine';
    var hs = d.hands || [];
    mani(d, hs.map(function(m){ return (m.cards || []).length; }), true);
    var messo = hs.reduce(function(a, m){ return a + (m.bet_cent || 0); }, 0) / 100;
    var vinto = d.win_mult != null ? messo * d.win_mult : (d.won_eur || 0);
    var netto = Math.round((vinto - messo) * 100) / 100;
    var tav = $('cbj-tavolo'), tipo, tit, sotto = '';
    var bj = hs.length === 1 && hs[0].blackjack && !d.dealer_bj;
    var dv = valore(d.dealer || []).v;
    if (netto > 0) {
      tipo = bj ? 'big' : 'win'; tit = bj ? 'BLACKJACK!' : L('HAI VINTO', 'YOU WIN');
      sotto = bj ? L('Paga 3 a 2', 'Pays 3 to 2') : (dv > 21 ? L('Il banco sballa con ', 'Dealer busts with ') + dv : L('Banco ', 'Dealer ') + dv);
      CASA.sfx(bj ? 'blackjack' : 'win'); setTimeout(function(){ CASA.sfx('chips'); }, 260);
      CASA.scoppio(tav, { tipo: bj ? 'monete' : 'coriandoli', n: bj ? 32 : 22, y:0.6 });
      if (bj) CASA.scuoti(tav, 5);
      CASA.hap('forte');
    } else if (netto === 0 && vinto > 0) {
      tipo = 'push'; tit = L('PAREGGIO', 'PUSH'); sotto = L('Ti torna la posta', 'Bet returned'); CASA.sfx('push');
    } else {
      tipo = 'lose';
      tit = d.dealer_bj ? L('BLACKJACK DEL BANCO', 'DEALER BLACKJACK') : (hs.every(function(m){ return m.bust; }) ? L('SBALLATO', 'BUST') : L('VINCE IL BANCO', 'DEALER WINS'));
      sotto = hs.every(function(m){ return m.bust; }) ? '' : L('Banco ', 'Dealer ') + dv;
      CASA.sfx('lose');
    }
    var box = CASA.esito(tav, tipo, tit, sotto, (netto >= 0 ? '+' : '-') + E(Math.abs(netto)));
    if (box && netto > 0) CASA.conta(box.querySelector('.casa-esito-n'), 0, netto, 900, function(x){ return '+' + E(x); });
    $('cbj-s-rigioca').textContent = E(CBJ.posta);
    comandi('ancora'); stato('');
  }
})();
(function(){
  'use strict';
  if (!window.CASA) return;
  var L = CASA.L, E = CASA.eur;
  var CBR = window.CBR = { fase:'punta', live:1, v:null, busy:false, R:0, posta:2, tBattito:null };
  function $(id){ return document.getElementById(id); }
  try { var p0 = parseFloat(localStorage.getItem('cbr_posta')); if (p0 > 0) CBR.posta = p0; } catch(e){}
  try { var l0 = parseInt(localStorage.getItem('cbr_live'), 10); if (l0 >= 1 && l0 <= 3) CBR.live = l0; } catch(e){}
  try { if (typeof currentBet !== 'undefined' && !localStorage.getItem('cbr_posta')) CBR.posta = currentBet.botrr || 2; } catch(e){}
  function scalaLive(live){
    function comb(n, k){ if (k < 0 || k > n) return 0; var r = 1; for (var i = 0; i < k; i++) r = r * (n - i) / (i + 1); return Math.round(r); }
    var base = comb(6, live), o = [];
    for (var k = 1; k < 6; k++) { var rem = 6 - k; if (rem < live) break; o.push(Math.round(0.95 / (comb(rem, live) / base) * 1e4) / 1e4); }
    return o;
  }
  function mx(x){ x = Number(x) || 0; return x.toFixed(2) + '×'; }
  function soldi(e){ return E(Math.floor((Number(e) || 0) * 100 + 1e-6) / 100); }
  var DESC = [null, ['il più sicuro', 'safest'], ['rischioso', 'risky'], ['folle', 'insane']];
  function testi(){
    $('cbr-t-pericolo').textContent = L('PROIETTILI NEL TAMBURO', 'BULLETS IN THE CYLINDER');
    $('cbr-t-posta').textContent = L('PUNTATA', 'BET');
    $('cbr-t-cambia').textContent = L('Cambia', 'Change');
    $('cbr-t-rigioca').textContent = L('Rigioca', 'Play again');
    $('cbr-regole').innerHTML = '<b>' + L('COME SI GIOCA', 'HOW TO PLAY') + '</b>' +
      '<p>' + L('Il tamburo ha 6 camere e 1, 2 o 3 proiettili veri, in un ordine segreto. A ogni <span class="r">SPARA</span> se la camera è vuota sopravvivi e il moltiplicatore sale; se è carica perdi la puntata.',
                'The cylinder has 6 chambers and 1, 2 or 3 live rounds in a secret order. Each time you <span class="r">FIRE</span>, an empty chamber means you survive and the multiplier climbs; a live one loses the bet.') + '</p>' +
      '<p>' + L('Dopo il primo clic puoi <span class="v">INCASSARE</span> quando vuoi. Ogni colpo sopravvissuto alza il rischio del successivo.',
                'After the first click you can <span class="v">CASH OUT</span> whenever you like. Every survived pull raises the risk of the next.') + '</p>';
  }
  function pericoli(){
    var h = '';
    for (var n = 1; n <= 3; n++) {
      var sc = scalaLive(n);
      h += '<button class="cbr-per' + (n === CBR.live ? ' sel' : '') + '" onclick="CBR.pericolo(' + n + ')">' +
           '<span class="cbr-per-p">' + '<i class="si"></i>'.repeat(n) + '<i></i>'.repeat(6 - n) + '</span>' +
           '<b>' + n + ' ' + L(n > 1 ? 'colpi' : 'colpo', n > 1 ? 'rounds' : 'round') + '</b><small>' + L(DESC[n][0], DESC[n][1]) + '</small>' +
           '<em>' + L('fino a ', 'up to ') + mx(sc[sc.length - 1]) + '</em></button>';
    }
    $('cbr-pericoli').innerHTML = h;
  }
  function gettoni(){
    var h = '';
    (window.BETS || [0.5,1,2,5,10,25,50,100]).forEach(function(b){
      h += '<button class="casa-gettone' + (Math.abs(b - CBR.posta) < 1e-9 ? ' sel' : '') + '" ' + CASA.ficheBottone(b) + ' onclick="CBR.scegli(' + b + ')">' + E(b) + '</button>';
    });
    $('cbr-gettoni').innerHTML = h;
    $('cbr-via').innerHTML = L('Carica e gioca', 'Load & play') + '<small>' + E(CBR.posta) + ' · ' + CBR.live + ' ' + L(CBR.live > 1 ? 'colpi' : 'colpo', CBR.live > 1 ? 'rounds' : 'round') + '</small>';
    var s = $('cbr-gettoni').querySelector('.sel'); if (s && s.scrollIntoView) try { s.scrollIntoView({inline:'center', block:'nearest'}); } catch(e){}
  }
  function camere(fired, extra){
    var h = '';
    for (var i = 0; i < 6; i++) {
      var cls = 'cbr-cam';
      if (fired && i < fired.length) cls += fired[i] === 1 ? ' colpo' : ' salvo';
      if (extra && extra[i]) cls += ' ' + extra[i];
      h += '<div class="' + cls + '" style="--a:' + (i * 60) + 'deg"><i></i></div>';
    }
    $('cbr-camere').innerHTML = h;
  }
  function gira(R, secco){
    var t = $('cbr-tamburo');
    CBR.R = R;
    if (secco) { t.classList.add('secco'); t.style.transform = 'rotate(' + R + 'deg)'; void t.offsetWidth; t.classList.remove('secco'); }
    else t.style.transform = 'rotate(' + R + 'deg)';
  }
  function scala(lad, fatti, rotto){
    var h = '', posta = CBR.v ? CBR.v.bet_eur : CBR.posta;
    for (var i = 0; i < lad.length; i++) {
      var cls = 'cbr-gr' + (i < fatti ? ' fatto' : '') + (i === fatti && CBR.fase === 'gioca' ? ' ora' : '') + (i === fatti && rotto ? ' rotto' : '');
      h += '<div class="' + cls + '"><span>' + L('CLIC ', 'CLICK ') + (i + 1) + '</span><b>' + mx(lad[i]) + '</b><small>' + soldi(posta * lad[i]) + '</small></div>';
    }
    $('cbr-scala').innerHTML = h;
    $('cbr-scala').style.setProperty('--n', lad.length);
  }
  function rischio(v){
    var el = $('cbr-rischio');
    if (!v || v.over || !v.can_pull) { el.style.visibility = 'hidden'; return; }
    var rest = v.chambers - v.fired.length, p = v.live / Math.max(1, rest);
    el.style.visibility = '';
    $('cbr-rischio-t').innerHTML = L('Prossimo colpo: ', 'Next pull: ') + '<b>' + v.live + ' ' + L('su', 'in') + ' ' + rest + '</b> · <b class="cbr-rosso">' + Math.round(p * 100) + '%</b>';
    $('cbr-rischio-b').style.transform = 'scaleX(' + p.toFixed(3) + ')';
  }
  function testa(mult, sotto, cls){
    var m = $('cbr-mult'); m.textContent = mult; m.className = 'cbr-mult' + (cls ? ' ' + cls : '');
    $('cbr-sotto').innerHTML = sotto || '';
  }
  function stato(t, acc){ var s = $('cbr-stato'); s.innerHTML = t || ''; s.className = 'chp-stato cbr-stato' + (acc ? ' ' + acc : ''); }
  function comandi(q){
    $('cbr-punta').style.display = q === 'punta' ? '' : 'none';
    $('cbr-gioca').style.display = q === 'gioca' ? '' : 'none';
    $('cbr-ancora').style.display = q === 'ancora' ? '' : 'none';
  }
  function bottoni(v, fermi){
    var s = $('cbr-spara'), c = $('cbr-incassa');
    s.disabled = fermi || !v || !v.can_pull;
    s.innerHTML = '<span class="c"><svg viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"6.5\"/><circle cx=\"12\" cy=\"12\" r=\"1.2\" fill=\"currentColor\"/><path d=\"M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4\"/></svg></span><span>' + L('Spara', 'Fire') + '<small>' + (v && v.next_mult ? '→ ' + mx(v.next_mult) : L('niente più colpi', 'no pulls left')) + '</small></span>';
    if (v && v.can_cash) {
      c.disabled = !!fermi; c.classList.add('pronto'); c.classList.toggle('urgente', !v.can_pull);
      c.innerHTML = L('Incassa ', 'Cash out ') + soldi(v.cash_eur) + '<small>' + mx(v.mult) + '</small>';
    } else {
      c.disabled = true; c.classList.remove('pronto'); c.classList.remove('urgente');
      c.innerHTML = L('Incassa', 'Cash out') + '<small>' + L('dopo il primo clic', 'after the first click') + '</small>';
    }
  }
  function cane(armato){ $('cbr-cane').classList.toggle('armato', !!armato); }
  function battito(v){
    fermaBattito();
    var rest = v.chambers - v.fired.length, p = v.live / Math.max(1, rest);
    var passo = Math.round(900 - p * 520);
    var wrap = $('cbr-palco');
    wrap.style.setProperty('--batt', passo + 'ms'); wrap.classList.add('batte');
    function uno(){ if (typeof CUR !== 'undefined' && CUR !== 'botrr') { fermaBattito(); return; } CASA.sfx('heart'); }
    uno(); CBR.tBattito = setInterval(uno, passo);
  }
  function fermaBattito(){ if (CBR.tBattito) { clearInterval(CBR.tBattito); CBR.tBattito = null; } var w = $('cbr-palco'); if (w) w.classList.remove('batte'); }
  function anteprima(){
    fermaBattito();
    CBR.v = null; CBR.fase = 'punta';
    CASA.togliEsito($('cbr-palco'));
    var sc = scalaLive(CBR.live);
    camere(null); gira(Math.round(CBR.R / 360) * 360, true); cane(false);
    scala(sc, 0, false); rischio(null);
    testa(mx(sc[sc.length - 1]), L('massimo con ', 'max with ') + CBR.live + ' ' + L(CBR.live > 1 ? 'colpi' : 'colpo', CBR.live > 1 ? 'rounds' : 'round') + L(' su 6 camere', ' in 6 chambers'), 'spento');
    stato(L('Scegli i proiettili e la puntata', 'Pick the bullets and your bet'));
    pericoli(); gettoni(); comandi('punta');
  }
  function gioco(v, msg, secco){
    CBR.v = v; CBR.fase = 'gioca';
    fermaBattito(); cane(false);
    camere(v.fired);
    if (secco) gira(-v.fired.length * 60, true);
    scala(v.ladder, v.survived, false); rischio(v);
    testa(v.survived > 0 ? mx(v.mult) : '1.00×',
          v.next_mult ? L('prossimo clic ', 'next click ') + '<b>' + mx(v.next_mult) + '</b> · ' + soldi(v.next_eur) : L('Hai superato ogni colpo possibile', 'You survived every possible pull'),
          v.survived > 0 ? 'vivo' : '');
    bottoni(v, false);
    stato(msg || (v.can_pull ? (v.survived > 0 ? L('Spara ancora… o incassa', 'Fire again… or cash out') : L('Premi il grilletto', 'Pull the trigger')) : L('Incassa adesso!', 'Cash out now!')), v.can_pull ? 'acc' : 'oro');
    comandi('gioca');
  }
  function chiama(path, body, ok, ko){
    CBR.busy = true;
    fetch(BACKEND + path, { method:'POST', headers:{'Content-Type':'application/json','ngrok-skip-browser-warning':'1'}, body:JSON.stringify(body) })
      .then(function(r){ return r.json(); })
      .then(function(d){
        CBR.busy = false;
        if (!d || d.error) { ko(d && d.error ? String(d.error) : 'error', false); return; }
        ok(d);
      })
      .catch(function(){ CBR.busy = false; ko(L('Errore di rete', 'Network error'), true); });
  }
  function errore(t){ toast('⚠️ ' + t, 'err'); CASA.sfx('lose'); }
  function saldoBalzo(){ try { refresh(); if (typeof CUR !== 'undefined' && CUR === 'profile' && typeof renderProfile === 'function') renderProfile(); } catch(e){} }
  function risincronizza(){
    if (!S.userId) { anteprima(); return; }
    chiama('/botroulette/state', { user_id:S.userId }, function(d){
      if (d.status === 'active' && d.view) gioco(d.view, null, true);
      else { if (typeof loadBalance === 'function') loadBalance(); anteprima(); }
    }, function(){ if (CBR.v) gioco(CBR.v, L('Connessione instabile, riprova', 'Unstable connection, try again')); else anteprima(); });
  }
  CBR.enter = function(){
    testi();
    if (CBR.fase === 'fine' || CBR.fase === 'sparo' || CBR.fase === 'carico') { pericoli(); gettoni(); return; }
    if (!S.userId) { anteprima(); return; }
    if (CBR.fase !== 'gioca') anteprima();
    chiama('/botroulette/state', { user_id:S.userId }, function(d){
      if (d.status === 'active' && d.view) { CBR.live = d.view.live; gioco(d.view, L('Partita in corso: spara o incassa', 'Round in progress: fire or cash out'), true); }
      else if (CBR.fase === 'gioca') anteprima();
    }, function(){ if (CBR.fase === 'gioca') anteprima(); });
  };
  CBR.pericolo = function(n){
    if (CBR.fase !== 'punta' || CBR.busy) return;
    CBR.live = n; try { localStorage.setItem('cbr_live', String(n)); } catch(e){}
    CASA.sfx('click_gun'); anteprima();
  };
  CBR.scegli = function(b){
    if (CBR.fase !== 'punta' || CBR.busy) return;
    CBR.posta = b; try { localStorage.setItem('cbr_posta', String(b)); currentBet.botrr = b; } catch(e){}
    CASA.sfx('chip'); gettoni(); scala(scalaLive(CBR.live), 0, false);
  };
  CBR.cambia = function(){ if (CBR.busy) return; CASA.sfx('click'); anteprima(); };
  CBR.rigioca = function(){ if (CBR.busy) return; CBR.fase = 'punta'; CBR.via(); };
  CBR.via = function(){
    if (CBR.busy || CBR.fase !== 'punta') return;
    var bet = CBR.posta;
    if (!S.userId) { toast(L('Apri dentro Telegram per giocare', 'Open in Telegram to play'), 'err'); return; }
    if (!hasFunds(bet)) { toast(L('Saldo insufficiente', 'Insufficient balance'), 'err'); CASA.sfx('lose'); anteprima(); return; }
    try { currentBet.botrr = bet; } catch(e){}
    CBR.fase = 'carico';
    CASA.sfx('chips'); CASA.hap('leggero');
    comandi('nessuno'); stato(L('Carico il tamburo…', 'Loading the cylinder…'));
    CASA.togliEsito($('cbr-palco'));
    chiama('/botroulette/start', Object.assign({ user_id:S.userId }, postaCent(bet), { live:CBR.live }), function(d){
      if (d.btc !== undefined) S.btc = saldoDa(d);
      if (d.total_bet_eur !== undefined) S.totalBet = d.total_bet_eur;
      saldoBalzo();
      var v = d.view; CBR.v = v; CBR.live = v.live;
      scala(v.ladder, 0, false); rischio(null);
      testa('1.00×', L('Il banco carica ', 'The house loads ') + v.live + ' ' + L(v.live > 1 ? 'colpi' : 'colpo', v.live > 1 ? 'rounds' : 'round'), '');
      if (CASA.lento()) { gira(Math.floor(CBR.R / 360) * 360 - 360, true); gioco(v); return; }
      var base = Math.round(CBR.R / 360) * 360; gira(base, true);
      var ex = {}; camere([], ex);
      var cams = document.querySelectorAll('#cbr-camere .cbr-cam');
      for (var i = 0; i < v.live; i++) (function(i){
        setTimeout(function(){ var c = cams[[0, 2, 4][i]]; if (c) c.classList.add('pallottola'); CASA.sfx('click_gun'); }, 100 + i * 170);
      })(i);
      var tGiro = 100 + v.live * 170 + 180;
      setTimeout(function(){
        for (var k = 0; k < cams.length; k++) cams[k].classList.add('nascondi');
        CASA.sfx('spin'); gira(base - 1080, false);
        stato(L('Il tamburo gira…', 'Spinning the cylinder…'));
      }, tGiro);
      setTimeout(function(){ if (CBR.fase === 'carico') gioco(v); }, tGiro + 1000);
    }, function(err){
      errore(/insufficient/i.test(err) ? L('Saldo insufficiente', 'Insufficient balance') : err);
      if (typeof loadBalance === 'function') loadBalance();
      anteprima();
    });
  };
  CBR.spara = function(){
    var v = CBR.v;
    if (CBR.busy || CBR.fase !== 'gioca' || !v || !v.can_pull) return;
    CBR.fase = 'sparo';
    bottoni(v, true);
    cane(true); CASA.sfx('click'); CASA.hap('leggero');
    stato(L('Il dito sul grilletto…', 'Finger on the trigger…'), 'rosso');
    var cams = document.querySelectorAll('#cbr-camere .cbr-cam'), top = cams[v.fired.length];
    if (top) top.classList.add('mira');
    battito(v);
    var t0 = Date.now(), MIN = CASA.lento() ? 500 : 1350;
    chiama('/botroulette/pull', { user_id:S.userId }, function(d){
      setTimeout(function(){ esito(d, v); }, Math.max(0, MIN - (Date.now() - t0)));
    }, function(err, rete){
      fermaBattito(); cane(false);
      errore(err); CBR.fase = 'gioca';
      if (rete || /no active/i.test(err)) risincronizza(); else gioco(v);
    });
  };
  function esito(d, prima){
    var ev = d.event || {}, v = d.view;
    fermaBattito(); cane(false);
    CBR.v = v;
    var k = prima.fired.length;
    if (ev.live) { bang(d, v, k); return; }
    CASA.sfx('click_gun'); CASA.hap('leggero');
    camere(v.fired, (function(){ var o = {}; o[k] = 'appena'; return o; })());
    var m = $('cbr-mult'); m.className = 'cbr-mult vivo';
    CASA.conta(m, k > 0 ? prima.ladder[k - 1] : 1, v.mult, 550, function(x){ return mx(x); });
    CASA.pulsa(m);
    scala(v.ladder, v.survived, false);
    var gr = document.querySelectorAll('#cbr-scala .cbr-gr')[v.survived - 1]; if (gr) CASA.pulsa(gr);
    stato(L('*clic* — vuota! ', '*click* — empty! ') + L('Incassi ', 'Cash ') + soldi(v.cash_eur) + '?', 'verde');
    setTimeout(function(){ CASA.sfx('coin'); }, 160);
    setTimeout(function(){
      if (CBR.fase !== 'sparo' || CBR.v !== v) return;
      if (v.can_pull) { gira(CBR.R - 60, false); CASA.sfx('tick'); }
      gioco(v, v.can_pull ? null : L('Nessun altro colpo possibile: incassa ', 'No more pulls possible: cash out ') + soldi(v.cash_eur));
      if (!v.can_pull) { CASA.sfx('win'); CASA.scoppio($('cbr-tamburo-wrap'), { tipo:'scintille', n:20, colori:['#ffd54a','#fff3b0','#3ddc84'] }); }
    }, CASA.lento() ? 250 : 600);
  }
  function bang(d, v, k){
    if (d.btc !== undefined || d.cent !== undefined) S.btc = saldoDa(d);
    if (d.losses !== undefined) S.losses = d.losses;
    saldoBalzo();
    CBR.fase = 'fine';
    var pal = $('cbr-palco');
    CASA.sfx('bang'); CASA.hap('forte');
    camere(v.fired, (function(){ var o = {}; o[k] = 'appena'; return o; })());
    pal.classList.remove('sparo'); void pal.offsetWidth; pal.classList.add('sparo');
    CASA.scuoti(pal, 14);
    CASA.scoppio($('cbr-tamburo-wrap'), { tipo:'scintille', n:26, colori:['#ff5c3a','#ffd54a','#ff2d55','#ffffff'], y:0.15, forza:220 });
    scala(v.ladder, v.survived, true); rischio(null);
    testa('BANG', L('Colpo vero alla camera ', 'Live round in chamber ') + (k + 1), 'rotto');
    stato('');
    var posta = v.bet_eur != null ? v.bet_eur : CBR.posta;
    setTimeout(function(){
      CASA.sfx('lose');
      CASA.esito(pal, 'lose', 'BANG!', v.survived > 0 ? L('Avevi ', 'You had ') + mx(v.ladder[v.survived - 1]) + L(' in mano', ' in hand') : L('Al primo colpo', 'On the first pull'), '-' + E(posta));
      fine();
    }, CASA.lento() ? 300 : 800);
  }
  CBR.incassa = function(){
    var v = CBR.v;
    if (CBR.busy || CBR.fase !== 'gioca' || !v || !v.can_cash) return;
    CBR.fase = 'incasso'; bottoni(v, true);
    CASA.sfx('click');
    chiama('/botroulette/cashout', { user_id:S.userId }, function(d){
      if (d.btc !== undefined || d.cent !== undefined) { S.btc = saldoDa(d); saldoBalzo(); }
      else if (typeof loadBalance === 'function') { try { loadBalance(); } catch(e){} }
      CBR.fase = 'fine';
      var vv = d.view || v, posta = vv.bet_eur != null ? vv.bet_eur : CBR.posta, won = Number(d.won_eur) || 0;
      var netto = Math.floor((won - posta) * 100 + 1e-6) / 100, grande = d.mult >= 5;
      CASA.sfx('spin'); gira(CBR.R - 360, false);
      setTimeout(function(){ CASA.sfx(grande ? 'bigwin' : 'win'); CASA.sfx('chips'); }, 250);
      CASA.hap('forte');
      var pal = $('cbr-palco');
      setTimeout(function(){ CASA.scoppio($('cbr-tamburo-wrap'), { tipo:'monete', n: grande ? 34 : 22, forza:200 }); }, 300);
      testa(mx(d.mult), L('Incassato dopo ', 'Cashed after ') + (d.survived || 0) + ' ' + L((d.survived || 0) > 1 ? 'clic' : 'clic', (d.survived || 0) > 1 ? 'clicks' : 'click'), 'oro');
      scala(vv.ladder, vv.survived, false); rischio(null); stato('');
      setTimeout(function(){
        var box = CASA.esito(pal, grande ? 'big' : 'win', L('SALVO!', 'SURVIVED!'), mx(d.mult) + ' · ' + L('vinti ', 'won ') + soldi(won), '+' + soldi(netto));
        if (box) CASA.conta(box.querySelector('.casa-esito-n'), 0, netto, 800, function(x){ return '+' + soldi(x); });
        fine();
      }, CASA.lento() ? 200 : 650);
    }, function(err, rete){
      errore(err); CBR.fase = 'gioca';
      if (rete || /no active/i.test(err)) risincronizza(); else gioco(v);
    });
  };
  function fine(){
    CBR.fase = 'fine';
    $('cbr-s-rigioca').textContent = E(CBR.posta) + ' · ' + CBR.live + ' ' + L(CBR.live > 1 ? 'colpi' : 'colpo', CBR.live > 1 ? 'rounds' : 'round');
    comandi('ancora');
  }
})();
(function(){
  'use strict';
  if (window.CCR) return;
  var L = CASA.L, E = CASA.eur;
  var K = 0.28;
  var CCR = window.CCR = { fase:'pronto', posta:2, auto:0, storia:[], m:1, t:0, t0:0, srv:false,
    raf:null, timer:null, rombo:null, cash:null, ghost:null, esito:null, crashAt:0, prossima:0, prev:0 };
  function $(id){ return document.getElementById(id); }
  try { var p0 = parseFloat(localStorage.getItem('ccr_posta')); if (p0 > 0) CCR.posta = p0;
        else if (typeof currentBet !== 'undefined' && currentBet.crash) CCR.posta = currentBet.crash; } catch(e){}
  try { var a0 = parseFloat(localStorage.getItem('ccr_auto')); if (a0 >= 1.01) CCR.auto = a0; } catch(e){}
  try { var s0 = JSON.parse(localStorage.getItem('ccr_storia') || '[]'); if (Array.isArray(s0)) CCR.storia = s0.slice(0, 16); } catch(e){}
  var TAPPE = [1.5, 2, 3, 5, 10, 20, 50, 100];
  var AUTO = [0, 1.5, 2, 3, 5, 10];
  function visibile(){ var s = $('crash'); return !!(s && s.classList.contains('active')) && !document.hidden; }
  function fmtM(m){ return (m >= 100 ? m.toFixed(0) : m.toFixed(2)) + '×'; }
  function tDaM(m){ return m > 1 ? Math.log(m) / K : 0; }
  function colM(m){ return m < 1.5 ? '#ff5c6c' : m < 2 ? '#ffb547' : m < 5 ? '#3ddc84' : m < 10 ? '#6ec6ff' : '#ffd54a'; }
  function inVolo(){ return CCR.fase === 'volo' || CCR.fase === 'incassa'; }
  function testi(){
    $('ccr-l-posta').textContent = L('PUNTATA', 'BET');
    $('ccr-l-auto').textContent = L('INCASSO AUTOMATICO', 'AUTO CASH OUT');
    $('ccr-l-storia').textContent = L('ULTIMI GIRI', 'LAST ROUNDS');
    $('ccr-regole').innerHTML = '<b>' + L('COME SI GIOCA', 'HOW TO PLAY') + '</b>' +
      '<p>' + L('Punta e il razzo decolla: il moltiplicatore sale finché non esplode. Incassa prima e vinci puntata × moltiplicatore.',
                'Bet and the rocket lifts off: the multiplier climbs until it explodes. Cash out before it does and win bet × multiplier.') + '</p>' +
      '<p>' + L('Il punto di esplosione lo decide il server alla partenza, ed è segreto. Il 5% dei giri esplode subito a 1,00×, il massimo è 100×.',
                'The crash point is set by the server at take-off and kept secret. 5% of rounds crash instantly at 1.00×, the cap is 100×.') + '</p>' +
      '<p>' + L('Con l’incasso automatico il razzo incassa da solo appena tocca il valore che scegli.',
                'With auto cash out the game cashes out for you as soon as your target is reached.') + '</p>';
  }
  function gettoni(){
    var h = '';
    (window.BETS || [0.5,1,2,5,10,25,50,100]).forEach(function(b){
      h += '<button class="casa-gettone' + (Math.abs(b - CCR.posta) < 1e-9 ? ' sel' : '') + '" ' + CASA.ficheBottone(b) +
           ' onclick="CCR.scegli(' + b + ')">' + E(b) + '</button>';
    });
    var g = $('ccr-gettoni'); g.innerHTML = h;
    var s = g.querySelector('.sel'); if (s) try { g.scrollLeft = s.offsetLeft - g.clientWidth / 2 + s.offsetWidth / 2; } catch(e){}
  }
  function autoUI(){
    var h = '';
    AUTO.forEach(function(a){
      h += '<button class="ccr-auto-b' + (Math.abs(a - CCR.auto) < 1e-9 ? ' sel' : '') + '" onclick="CCR.metti(' + a + ')">' +
           (a ? a + '×' : L('NO', 'OFF')) + '</button>';
    });
    $('ccr-auto-l').innerHTML = h;
    $('ccr-auto-v').textContent = CCR.auto ? CCR.auto.toFixed(2) + '×' : L('SPENTO', 'OFF');
    $('ccr-auto-v').classList.toggle('acceso', !!CCR.auto);
  }
  function blocca(si){ $('ccr-pannello').classList.toggle('bloccato', !!si); }
  CCR.scegli = function(b){
    if (inVolo() || CCR.fase === 'parte') return;
    CCR.posta = b; try { localStorage.setItem('ccr_posta', String(b)); currentBet.crash = b; } catch(e){}
    CASA.sfx('chip'); gettoni(); bottone();
  };
  CCR.metti = function(a){
    if (inVolo() || CCR.fase === 'parte') return;
    CCR.auto = a; try { localStorage.setItem('ccr_auto', String(a)); } catch(e){}
    CASA.sfx('click'); autoUI(); bottone();
  };
  CCR.passo = function(dir){
    if (inVolo() || CCR.fase === 'parte') return;
    var a = CCR.auto || (dir > 0 ? 1.0 : 0);
    if (!a) return;
    var st = a < 3 ? 0.1 : a < 10 ? 0.5 : 1;
    if (dir < 0 && a - st < 1.1) { CCR.metti(0); return; }
    a = Math.round((a + dir * st) * 100) / 100;
    if (a < 1.1) a = 1.1; if (a > 100) a = 100;
    CCR.metti(a);
  };
  function bottone(){
    var b = $('ccr-btn'), t = $('ccr-btn-t'), s = $('ccr-btn-s');
    b.className = 'casa-btn ccr-azione';
    b.disabled = false;
    if (CCR.fase === 'volo') {
      b.classList.add('incassa');
      t.textContent = L('INCASSA ', 'CASH OUT ') + E(CCR.posta * CCR.m);
      s.textContent = '@ ' + fmtM(CCR.m) + (CCR.auto ? '  ·  auto ' + CCR.auto + '×' : '');
    } else if (CCR.fase === 'parte' || CCR.fase === 'incassa') {
      b.classList.add(CCR.fase === 'incassa' ? 'incassa' : 'oro'); b.disabled = true;
      t.textContent = CCR.fase === 'parte' ? L('DECOLLO…', 'LIFT-OFF…') : L('INCASSO…', 'CASHING OUT…');
      s.textContent = '';
    } else {
      b.classList.add('oro');
      t.textContent = (CCR.fase === 'fine' ? L('RIGIOCA', 'PLAY AGAIN') : L('PUNTA E DECOLLA', 'BET & LAUNCH')) + ' · ' + E(CCR.posta);
      s.textContent = CCR.auto ? L('incasso automatico a ', 'auto cash out at ') + CCR.auto + '×' : L('incassi tu, quando vuoi', 'you cash out, any time');
    }
  }
  function stato(t, cls){ var s = $('ccr-stato'); s.textContent = t || ''; s.className = 'ccr-stato' + (cls ? ' ' + cls : ''); }
  function hud(){
    var el = $('ccr-mult');
    el.textContent = fmtM(CCR.m);
    var c = 'ccr-mult';
    if (CCR.esito === 'perso') c += ' boom';
    else if (CCR.esploso) c += ' fantasma';
    else if (CCR.esito === 'vinto' && !CCR.ghost) c += ' preso';
    else if (CCR.ghost) c += ' fantasma';
    else if (inVolo()) c += CCR.m < 2 ? ' t1' : CCR.m < 5 ? ' t2' : CCR.m < 10 ? ' t3' : ' t4';
    if (el.className !== c) el.className = c;
  }
  function storiaUI(){
    var el = $('ccr-storia');
    if (!CCR.storia.length) { el.innerHTML = '<span class="ccr-vuota">' + L('Ancora nessun giro', 'No rounds yet') + '</span>'; return; }
    el.innerHTML = CCR.storia.map(function(g, i){
      return '<span class="ccr-chip' + (i === 0 ? ' nuovo' : '') + '" style="--c:' + colM(g.m) + '">' + fmtM(g.m) +
             (g.cash ? '<i>' + L('preso ', 'won ') + g.cash.toFixed(2) + '×</i>' : '') + '</span>';
    }).join('');
  }
  function aggiungiStoria(m, cash){
    CCR.storia.unshift({ m: Math.round(m * 100) / 100, cash: cash || 0 });
    CCR.storia = CCR.storia.slice(0, 16);
    try { localStorage.setItem('ccr_storia', JSON.stringify(CCR.storia)); } catch(e){}
    storiaUI();
  }
  function cartello(tipo, titolo, importo){
    var c = $('ccr-cartello');
    c.className = 'ccr-cartello ' + tipo;
    c.innerHTML = '<b>' + titolo + '</b>' + (importo ? '<span id="ccr-cart-n">' + importo + '</span>' : '');
    void c.offsetWidth; c.classList.add('su');
  }
  function togliCartello(){ var c = $('ccr-cartello'); c.className = 'ccr-cartello'; c.innerHTML = ''; }
  var cv = null, cx = null, W = 340, H = 220, DPR = 1;
  var stelle = [], fumo = [], schegge = [], onda = null, lampo = 0, terraY = 0;
  function misura(){
    cv = $('ccr-cv'); if (!cv) return false;
    var r = cv.getBoundingClientRect();
    if (r.width < 50) return false;
    DPR = Math.min(2, window.devicePixelRatio || 1);
    var w = Math.round(r.width), h = Math.round(r.height);
    if (w !== W || h !== H || !cx || cv.width !== Math.round(w * DPR)) {
      W = w; H = h; cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
      cx = cv.getContext('2d'); cx.setTransform(DPR, 0, 0, DPR, 0, 0);
      var n = CASA.lento() ? 26 : 60; stelle = [];
      for (var i = 0; i < n; i++) stelle.push({ x: Math.random() * W, y: Math.random() * H, z: 0.25 + Math.random() * 0.75 });
    }
    return true;
  }
  var PAD = { l: 38, r: 22, t: 92, b: 26 };
  function scale(){
    var t = CCR.t, m = CCR.m;
    var Tm = Math.max(6, t * 1.18), Mm = Math.max(2, 1 + (m - 1) * 1.28);
    return { Tm: Tm, Mm: Mm,
      x: function(tt){ return PAD.l + (tt / Tm) * (W - PAD.l - PAD.r); },
      y: function(mm){ return H - PAD.b - ((mm - 1) / (Mm - 1)) * (H - PAD.t - PAD.b); } };
  }
  function passoGriglia(span){ var c = [0.1,0.2,0.5,1,2,5,10,20,50]; for (var i = 0; i < c.length; i++) if (span / c[i] <= 4) return c[i]; return 100; }
  function razzo(x, y, ang, fiamma, alfa){
    cx.save(); cx.translate(x, y); cx.rotate(ang); cx.globalAlpha = alfa == null ? 1 : alfa;
    var s = 1.35; cx.scale(s, s);
    if (fiamma > 0) {
      var lun = 10 + fiamma * 14 + Math.random() * 5;
      var g = cx.createLinearGradient(-9, 0, -9 - lun, 0);
      g.addColorStop(0, '#fff7c2'); g.addColorStop(0.35, '#ffb02e'); g.addColorStop(1, 'rgba(255,60,20,0)');
      cx.fillStyle = g; cx.beginPath(); cx.moveTo(-8, -3.6); cx.quadraticCurveTo(-9 - lun * 0.6, 0, -8, 3.6); cx.closePath(); cx.fill();
    }
    cx.fillStyle = '#e0263f';
    cx.beginPath(); cx.moveTo(-6, -4); cx.lineTo(-11, -9); cx.lineTo(-2, -4.6); cx.closePath(); cx.fill();
    cx.beginPath(); cx.moveTo(-6, 4); cx.lineTo(-11, 9); cx.lineTo(-2, 4.6); cx.closePath(); cx.fill();
    var gb = cx.createLinearGradient(0, -6, 0, 6);
    gb.addColorStop(0, '#ffffff'); gb.addColorStop(0.55, '#d9dee8'); gb.addColorStop(1, '#8b93a7');
    cx.fillStyle = gb;
    cx.beginPath(); cx.moveTo(15, 0); cx.quadraticCurveTo(9, -6.2, -4, -5.2); cx.lineTo(-9, -4); cx.lineTo(-9, 4); cx.lineTo(-4, 5.2);
    cx.quadraticCurveTo(9, 6.2, 15, 0); cx.closePath(); cx.fill();
    cx.fillStyle = '#e0263f';
    cx.beginPath(); cx.moveTo(15, 0); cx.quadraticCurveTo(12, -3.6, 8.5, -4.6); cx.lineTo(8.5, 4.6); cx.quadraticCurveTo(12, 3.6, 15, 0); cx.closePath(); cx.fill();
    cx.fillStyle = '#123'; cx.beginPath(); cx.arc(2.5, 0, 2.6, 0, 6.283); cx.fill();
    cx.fillStyle = '#6ec6ff'; cx.beginPath(); cx.arc(2.5, 0, 1.8, 0, 6.283); cx.fill();
    cx.restore();
  }
  function scoppio(x, y){
    schegge = [];
    var n = CASA.lento() ? 14 : 34, col = ['#ffffff','#cdc7ff','#8f86f2','#ff8a8a','#f4f4f6'];
    for (var i = 0; i < n; i++) {
      var a = Math.random() * 6.283, v = 60 + Math.random() * 220;
      schegge.push({ x:x, y:y, vx:Math.cos(a) * v, vy:Math.sin(a) * v - 40, v:1, d:0.7 + Math.random() * 0.7,
                     r:1.5 + Math.random() * 3, c:col[i % col.length], lin: i % 4 === 0 });
    }
    onda = { x:x, y:y, r:4, v:1 }; lampo = 1;
  }
  function disegna(dt){
    if (!cx && !misura()) return;
    var sc = scale();
    cx.clearRect(0, 0, W, H);
    var st = passoGriglia(sc.Mm - 1);
    cx.font = '600 10px Inter, system-ui, sans-serif'; cx.textAlign = 'right'; cx.textBaseline = 'middle';
    for (var mm = 1; mm <= sc.Mm + 1e-6; mm = Math.round((mm + st) * 100) / 100) {
      var yy = Math.round(sc.y(mm)) + 0.5;
      cx.fillStyle = 'rgba(255,255,255,.055)'; cx.fillRect(PAD.l, yy, W - PAD.l - PAD.r + 10, 1);
      cx.fillStyle = 'rgba(255,255,255,.30)'; cx.fillText((st < 1 ? mm.toFixed(1) : mm.toFixed(0)) + '×', PAD.l - 7, yy);
    }
    var perso = CCR.esito === 'perso' && !CCR.ghost, rgb = perso ? '255,138,138' : '255,255,255';
    var rx = sc.x(0), ry = sc.y(1), N = 48, base = H - PAD.b;
    function tratto(t1){ cx.beginPath(); cx.moveTo(sc.x(0), sc.y(1));
      for (var k = 1; k <= N; k++) { var tk = t1 * k / N; cx.lineTo(sc.x(tk), sc.y(Math.exp(K * tk))); } }
    if (CCR.t > 0.001) {
      rx = sc.x(CCR.t); ry = sc.y(CCR.m);
      var tSol = CCR.cash ? Math.min(CCR.t, CCR.cash.t) : CCR.t;
      tratto(tSol); cx.lineTo(sc.x(tSol), base); cx.lineTo(sc.x(0), base); cx.closePath();
      var gf = cx.createLinearGradient(0, sc.y(Math.exp(K * tSol)), 0, base);
      gf.addColorStop(0, 'rgba(' + rgb + ',.26)'); gf.addColorStop(1, 'rgba(' + rgb + ',0)');
      cx.fillStyle = gf; cx.fill();
      cx.lineCap = 'round'; cx.lineJoin = 'round';
      if (CCR.cash && CCR.t > CCR.cash.t + 0.01) {
        tratto(CCR.t); cx.setLineDash([3, 6]); cx.strokeStyle = 'rgba(255,255,255,.28)'; cx.lineWidth = 2; cx.stroke(); cx.setLineDash([]);
      }
      tratto(tSol);
      cx.strokeStyle = 'rgb(' + rgb + ')'; cx.lineWidth = 2.6; cx.stroke();
    }
    if (!perso && !CCR.esploso) {
      var px = CCR.t > 0.001 ? rx : sc.x(0), py = CCR.t > 0.001 ? ry : sc.y(1);
      var al = CCR.ghost ? 0.55 : 1, pul = 1;
      cx.globalAlpha = al; cx.fillStyle = '#8b83f0'; cx.beginPath(); cx.arc(px, py, 5.5, 0, 6.283); cx.fill();
      cx.fillStyle = 'rgba(255,255,255,.85)'; cx.beginPath(); cx.arc(px - 1.4, py - 1.6, 1.6, 0, 6.283); cx.fill(); cx.globalAlpha = 1;
    }
    if (CCR.cash) {
      var fx = sc.x(CCR.cash.t), fy = sc.y(CCR.cash.m);
      cx.strokeStyle = '#fff'; cx.lineWidth = 2; cx.beginPath(); cx.arc(fx, fy, 6, 0, 6.283); cx.stroke();
      cx.fillStyle = '#7fe0a6'; cx.beginPath(); cx.arc(fx, fy, 3, 0, 6.283); cx.fill();
    }
    if (onda) {
      onda.r += dt * 200; onda.v -= dt * 1.7;
      if (onda.v <= 0) onda = null;
      else { cx.globalAlpha = onda.v * 0.8; cx.strokeStyle = '#ffffff'; cx.lineWidth = 2 * onda.v + 0.6; cx.beginPath(); cx.arc(onda.x, onda.y, onda.r, 0, 6.283); cx.stroke(); cx.globalAlpha = 1; }
    }
    for (var e = schegge.length - 1; e >= 0; e--) {
      var sh = schegge[e]; sh.v -= dt / sh.d;
      if (sh.v <= 0) { schegge.splice(e, 1); continue; }
      sh.vy += 200 * dt; sh.vx *= 0.985; sh.x += sh.vx * dt; sh.y += sh.vy * dt;
      cx.globalAlpha = Math.min(1, sh.v * 1.4); cx.fillStyle = sh.c; cx.strokeStyle = sh.c;
      if (sh.lin) { cx.lineWidth = 1.6; cx.beginPath(); cx.moveTo(sh.x, sh.y); cx.lineTo(sh.x - sh.vx * 0.035, sh.y - sh.vy * 0.035); cx.stroke(); }
      else { cx.beginPath(); cx.arc(sh.x, sh.y, sh.r * (0.45 + sh.v * 0.5), 0, 6.283); cx.fill(); }
    }
    cx.globalAlpha = 1;
    if (lampo > 0) { cx.fillStyle = 'rgba(255,138,138,' + (lampo * 0.16).toFixed(3) + ')'; cx.fillRect(0, 0, W, H); lampo -= dt * 3; }
  }
  function vivo(){ return inVolo() || !!CCR.ghost || fumo.length > 0 || schegge.length > 0 || !!onda || lampo > 0; }
  function ciclo(now){
    CCR.raf = null;
    if (!visibile()) { CCR.prev = 0; return; }
    var dt = CCR.prev ? Math.min(0.05, (now - CCR.prev) / 1000) : 0.016; CCR.prev = now;
    if (inVolo()) {
      CCR.t = (now - CCR.t0) / 1000; CCR.m = Math.exp(K * CCR.t);
      tappe(); controlla();
      if (CCR.rombo) CCR.rombo.set(Math.min(1, Math.log(CCR.m) / Math.log(20)));
      hud(); if (CCR.fase === 'volo') bottone();
    } else if (CCR.ghost) {
      CCR.t = Math.min(CCR.ghost.fine, CCR.t + dt * CCR.ghost.k); CCR.m = Math.exp(K * CCR.t);
      hud();
      if (CCR.t >= CCR.ghost.fine - 1e-6) {
        CCR.m = CCR.crashAt; CCR.ghost = null; CCR.esploso = true; hud();
        var sc = scale(); scoppio(sc.x(CCR.t), sc.y(CCR.m)); CASA.sfx('pop');
        $('ccr-mult').textContent = fmtM(CCR.m);
        stato(L('Sarebbe esploso a ', 'It would have crashed at ') + fmtM(CCR.crashAt), 'info');
      }
    }
    disegna(dt);
    if (vivo()) CCR.raf = requestAnimationFrame(ciclo);
  }
  function avvia(){ if (!CCR.raf && visibile()) { CCR.prev = 0; CCR.raf = requestAnimationFrame(ciclo); } }
  function tappe(){
    while (CCR.prossima < TAPPE.length && CCR.m >= TAPPE[CCR.prossima]) {
      CCR.prossima++;
      if (CCR.fase === 'volo') { GBX.fx('tick'); if (!CASA.lento()) CASA.pulsa($('ccr-mult')); }
    }
  }
  function post(path, body){
    return fetch(BACKEND + path, { method:'POST', headers:{'Content-Type':'application/json','ngrok-skip-browser-warning':'1'}, body:JSON.stringify(body) })
      .then(function(r){ return r.json(); });
  }
  function errTesto(e){ return /insufficient/i.test(String(e)) ? L('Saldo insufficiente', 'Insufficient balance') : e; }
  function fermaRombo(){ if (CCR.rombo) { CCR.rombo.stop(); CCR.rombo = null; } }
  function fermaBattito(){ if (CCR.timer) { clearInterval(CCR.timer); CCR.timer = null; } }
  CCR.azione = function(){
    if (CCR.fase === 'volo') { incassa(); return; }
    if (CCR.fase === 'pronto' || CCR.fase === 'fine') parti();
  };
  function parti(){
    var bet = CCR.posta;
    if (!hasFunds(bet)) { toast(L('Saldo insufficiente', 'Insufficient balance'), 'err'); CASA.scuoti($('ccr-btn'), 5); return; }
    if (!S.userId) { toast(L('Apri dentro Telegram per giocare', 'Open in Telegram to play'), 'err'); return; }
    CCR.ghost = null; CCR.cash = null; CCR.esito = null; CCR.esploso = false; CCR.t = 0; CCR.m = 1; schegge = []; onda = null; lampo = 0;
    togliCartello(); hud();
    CCR.fase = 'parte'; blocca(true); bottone(); stato(L('Accensione dei motori…', 'Engines on…'));
    CASA.sfx('chips'); CASA.hap('leggero'); disegna(0.016);
    post('/crash/start', Object.assign({ user_id:S.userId, auto:(CCR.auto > 0 ? CCR.auto : 0) }, postaCent(bet))).then(function(d){
      if (!d || d.error) {
        toast('⚠️ ' + errTesto((d && d.error) || 'error'), 'err');
        if (typeof loadBalance === 'function') loadBalance();
        CCR.fase = 'pronto'; blocca(false); bottone(); stato(''); disegna(0.016); return;
      }
      CCR.puntata = bet; CCR.srv = true; CCR.srvStartMs = d.start_ms; CCR.lastPoll = 0; CCR.prossima = 0;
      if (d.btc !== undefined) S.btc = saldoDa(d); refresh();
      CCR.t0 = performance.now(); CCR.fase = 'volo';
      CASA.sfx('whoosh'); CASA.hap('colpo'); GBX.hap('medium');
      fermaRombo(); if (visibile()) CCR.rombo = CASA.rombo();
      stato(CCR.auto ? L('In volo · incasso automatico a ', 'Flying · auto cash out at ') + CCR.auto + '×' : L('In volo · incassa prima dell’esplosione!', 'Flying · cash out before it blows!'), 'volo');
      fermaBattito(); CCR.timer = setInterval(battito, 300);
      bottone(); avvia();
    }).catch(function(){
      toast(L('Errore di rete', 'Network error'), 'err');
      if (typeof loadBalance === 'function') loadBalance();
      CCR.fase = 'pronto'; blocca(false); bottone(); stato(''); disegna(0.016);
    });
  }
  function battito(){
    if (CCR.fase !== 'volo' || !CCR.srv) { fermaBattito(); return; }
    if (!visibile()) {
      fermaRombo();
      CCR.m = Math.exp(K * (performance.now() - CCR.t0) / 1000);
      if (controlla()) return;
    }
    post('/crash/state', { user_id:S.userId }).then(function(d){
      if (!d || d.error) return;
      if (d.cashed && CCR.fase === 'volo') { incassa(); return; }
      if (d.crashed && CCR.fase === 'volo') esplodi(d.crashAt, d.btc, d.losses);
    }).catch(function(){});
  }
  function controlla(){
    if (CCR.auto > 0 && CCR.fase === 'volo' && CCR.srv && CCR.m >= CCR.auto) { incassa(); return true; }
    return false;
  }
  function incassa(){
    if (CCR.fase !== 'volo' || !CCR.srv) return;
    CASA.hap('colpo');
    CCR.srv = false;
    CCR.fase = 'incassa'; bottone(); fermaBattito();
    post('/crash/cashout', { user_id:S.userId }).then(function(d){
      if (!d || d.error) {
        toast('⚠️ ' + ((d && d.error) || 'error'), 'err');
        if (typeof loadBalance === 'function') loadBalance();
        fine(); return;
      }
      if (d.crashed) { CCR.fase = 'volo'; esplodi(d.crashAt, d.btc, d.losses); return; }
      var mult = d.mult, won = (d.won_eur !== undefined) ? d.won_eur : (CCR.puntata * mult);
      CCR.m = mult; CCR.t = tDaM(mult); CCR.crashAt = d.crashAt || mult;
      CCR.cash = { t: CCR.t, m: mult, eur: won }; CCR.esito = 'vinto';
      if (d.btc !== undefined) S.btc = saldoDa(d);
      if (d.wins !== undefined) S.wins = d.wins;
      if (d.biggest_win_eur !== undefined) S.biggestWin = d.biggest_win_eur;
      refresh(); if (typeof CUR !== 'undefined' && CUR === 'profile' && typeof renderProfile === 'function') renderProfile();
      if (d.btc === undefined && d.cent === undefined && typeof loadBalance === 'function') loadBalance();
      fermaRombo();
      GBX.fx('cash'); setTimeout(function(){ CASA.sfx(mult >= 5 ? 'bigwin' : 'win'); }, 160);
      if (window.XR) XR.vinci($('ccr-scena'), mult >= 5 ? 22 : (mult >= 2 ? 12 : 0));
      cartello('vinto', L('INCASSATO A ', 'CASHED OUT AT ') + fmtM(mult), '+' + E(won));
      var n = $('ccr-cart-n'); if (n) CASA.conta(n, 0, won, 800, function(x){ return '+' + E(x); });
      aggiungiStoria(CCR.crashAt, mult);
      if (CCR.crashAt > mult + 0.009) {
        var fineT = tDaM(CCR.crashAt);
        CCR.ghost = { fine: fineT, k: Math.max(1, (fineT - CCR.t) / 2.2) };
        stato(L('Il razzo prosegue senza di te…', 'The rocket flies on without you…'), 'info');
      } else stato('');
      fine(); hud(); avvia();
    }).catch(function(){
      toast(L('Errore di rete', 'Network error'), 'err');
      if (typeof loadBalance === 'function') loadBalance();
      fine();
    });
  }
  function esplodi(crashAt, btc, losses){
    if (CCR.fase !== 'volo') return;
    CCR.srv = false; fermaBattito(); fermaRombo();
    CCR.m = crashAt || CCR.m; CCR.crashAt = CCR.m; CCR.t = tDaM(CCR.m); CCR.esito = 'perso';
    if (btc !== undefined) S.btc = btc; if (losses !== undefined) S.losses = losses; refresh();
    if (window.XR) XR.boom(); else CASA.sfx('boom'); CASA.hap('morte'); GBX.hap('heavy'); setTimeout(function(){ CASA.sfx('lose'); }, 420);
    if (visibile() && cx) { var sc = scale(); scoppio(sc.x(CCR.t), sc.y(CCR.m)); CASA.scuoti($('ccr-scena'), 5); }
    cartello('perso', L('ESPLOSO A ', 'CRASHED AT ') + fmtM(CCR.m), '-' + E(CCR.puntata || CCR.posta));
    stato(CCR.m <= 1.001 ? L('Esploso al decollo: capita nel 5% dei giri', 'Blew up on the pad: happens in 5% of rounds') : '', 'perso');
    aggiungiStoria(CCR.m, 0);
    fine(); hud(); avvia();
  }
  function fine(){ CCR.fase = 'fine'; blocca(false); bottone(); }
  CCR.enter = function(){
    testi(); gettoni(); autoUI(); storiaUI(); bottone(); hud();
    if (CCR.fase === 'pronto') stato('');
    cx = null; misura(); disegna(0.016);
    if (CCR.fase === 'volo' && !CCR.rombo) CCR.rombo = CASA.rombo();
    avvia();
  };
  window.addEventListener('resize', function(){ if (visibile()) { cx = null; misura(); if (!CCR.raf) disegna(0); } });
  document.addEventListener('visibilitychange', function(){ if (document.hidden) fermaRombo(); else if (visibile()) { if (CCR.fase === 'volo' && !CCR.rombo) CCR.rombo = CASA.rombo(); avvia(); } });
})();
(function(){
  'use strict';
  if (!window.CASA) return;
  var L = CASA.L;
  var CDC = window.CDC = { L: L };
  function $(id){ return document.getElementById(id); }
  function eur2(x){ return '€' + (Math.round(x * 100) / 100).toFixed(2); }
  function posta(){ try { return currentBet.dice; } catch(e){ return 0; } }
  CDC.tasto = function(){
    var b = $('dc-roll'); if (!b) return;
    var p = posta();
    b.innerHTML = '🎲 ' + L('TIRA I DADI', 'ROLL DICE') + (p ? ' <span class="cdc-posta">' + (typeof betLbl === 'function' ? betLbl(p) : CASA.eur(p)) + '</span>' : '');
  };
  CDC.entra = function(){
    var a = document.querySelector('#dice .dc-pick-lbl'); if (a) a.textContent = L('SCEGLI LA PUNTATA', 'PICK YOUR BET');
    var c = document.querySelector('#dice .dc-section-lbl'); if (c) c.textContent = L('VALORE DELLA FICHE', 'CHIP VALUE');
    var t = document.querySelector('#dice .dc-total-lbl'); if (t) t.textContent = L('TOTALE', 'TOTAL');
    var n = { lo: L('BASSO', 'LOW'), '7': L('SETTE', 'LUCKY SEVEN'), hi: L('ALTO', 'HIGH') };
    document.querySelectorAll('#dice .dc-bet-card').forEach(function(b){
      var k = b.getAttribute('data-dc'), el = b.querySelector('.dc-bc-name'); if (el && n[k]) el.textContent = n[k];
    });
    var st = $('dc-status');
    if (st && /Place bet to roll/.test(st.textContent)) st.textContent = L('Scegli e tira', 'Place bet to roll');
    var bets = $('dc-bets');
    if (bets && !bets._cdc) { bets._cdc = 1; bets.addEventListener('click', function(){ setTimeout(CDC.tasto, 0); }); }
    CDC.tasto();
  };
  CDC.via = function(){
    var p = $('cdc-pay'); if (p) { p.className = 'cdc-pay'; p.textContent = ''; }
  };
  CDC.fine = function(r, bet){
    if (!r || r.error) return;
    var st = $('dc-status'), p = $('cdc-pay'), card = document.querySelector('#dice .dc-total-card');
    var conto = r.d1 + ' + ' + r.d2 + ' = ' + r.sum;
    if (r.won) {
      var win = (r.payout_cent != null) ? r.payout_cent / 100 : (r.payout_btc || 0) * S.rate;
      var big = (+r.mult || 0) >= 5;
      if (st) st.textContent = (big ? L('SETTE! ', 'SEVEN! ') : L('Vinto · ', 'Won · ')) + conto + ' · ×' + r.mult;
      if (p) {
        p.className = 'cdc-pay on win' + (big ? ' big' : '');
        p.innerHTML = '<b>+€0.00</b><small>' + L('netto', 'net') + ' +' + eur2(win - bet) + '</small>';
        CASA.conta(p.firstChild, 0, win, big ? 1100 : 700, function(x){ return '+' + eur2(x); });
      }
      if (card) {
        CASA.pulsa($('dc-total'));
        CASA.scoppio(card, big ? { tipo: 'monete', n: 20, forza: 210 } : { n: 16, forza: 160 });
      }
    } else {
      if (st) st.textContent = L('Perso · ', 'Lost · ') + conto;
      if (p) { p.className = 'cdc-pay on lose'; p.innerHTML = '<b>−' + eur2(bet) + '</b>'; }
      if (card) CASA.scuoti(card, 4);
    }
    CDC.tasto();
  };
})();
(function(){
  'use strict';
  if (window.CPL) return;
  var L = CASA.L, E = CASA.eur;
  var G = { W:320, H:256, FONDO:250, PEG_R:7, BALL_R:7, GRAV:0.105, RIMBALZO:0.72, ATTRITO:0.993, CALCIO:0.28, MAX_VY:2.9,
            ZONE:[40,80,120,160,200,240,280], CASE:7, MAX:10 };
  var TAB = { LOW:[2.8,2.2,1.6,0,0,0,0], MEDIUM:[4.4,2.2,0,0,0,0,0], HIGH:[6.6,0,0,0,0,0,0] };
  var CPL = window.CPL = { risk:'LOW', zona:3, posta:1, palle:[], seq:0, volo:false, avvio:false, layout:null, lanci:0, coda:0,
    sparando:false, ultimi:[], giro:null, pioli:[], pioliSrv:null, raf:null, tmr:null, acc:0, prev:0, ultimoTap:0, suonoT:0, copri:null };
  function $(id){ return document.getElementById(id); }
  try { var p0 = parseFloat(localStorage.getItem('cpl_posta')); if (p0 > 0) CPL.posta = p0; } catch(e){}
  try { var r0 = localStorage.getItem('cpl_risk'); if (TAB[r0]) CPL.risk = r0; } catch(e){}
  try { var z0 = parseInt(localStorage.getItem('cpl_zona'), 10); if (z0 >= 0 && z0 < 7) CPL.zona = z0; } catch(e){}
  function visibile(){ var s = $('plinko'); return !!(s && s.classList.contains('active')) && !document.hidden; }
  function aperto(){ return CPL.volo || CPL.avvio || CPL.palle.length > 0; }
  function colM(m){ return m >= 6 ? '#f5c542' : m >= 4 ? '#a855f7' : m >= 2.5 ? '#3b82f6' : m >= 2 ? '#14b8a6' : m >= 1 ? '#22c55e' : '#2b3040'; }
  function fmtM(m){ return (Math.round(m * 100) / 100) + '×'; }
  function saldo(){ var b = $('cpl-bal'); if (b) try { b.textContent = balEur(); } catch(e){} }
  function testi(){
    ['LOW','MEDIUM','HIGH'].forEach(function(r){
      var t = TAB[r], vinc = t.filter(function(x){ return x >= 1; }).length, max = Math.max.apply(null, t);
      $('cpl-r-' + r).innerHTML = '<b>' + ({LOW:L('BASSO','LOW'), MEDIUM:L('MEDIO','MEDIUM'), HIGH:L('ALTO','HIGH')})[r] + '</b>' +
        '<span>' + L('fino a ', 'up to ') + fmtM(max) + '</span><i>' + vinc + '/7 ' + L(vinc === 1 ? 'vincente' : 'vincenti', vinc === 1 ? 'winner' : 'winners') + '</i>';
    });
    $('cpl-l-posta').textContent = L('PUNTATA PER PALLINA', 'BET PER BALL');
    $('cpl-l-ultimi').textContent = L('ULTIME', 'RECENT');
    $('cpl-regole').innerHTML = '<b>' + L('COME SI GIOCA', 'HOW TO PLAY') + '</b>' +
      '<p>' + L('Scegli il punto di caduta con le frecce e lancia: la pallina rimbalza sui pioli e cade in una casella, che paga puntata × il suo valore.',
                'Pick a drop point with the arrows and launch: the ball bounces off the pegs and lands in a bucket, which pays bet × its value.') + '</p>' +
      '<p>' + L('I premi sono coperti: per ogni pallina il server li mescola in segreto e li scopre quando la pallina tocca il fondo. Puoi avere fino a 10 palline in aria.',
                'Prizes are hidden: for every ball the server shuffles them in secret and reveals them when the ball lands. Up to 10 balls can be in the air.') + '</p>' +
      '<p>' + L('Il rischio cambia quante caselle vincono e quanto pagano.', 'Risk changes how many buckets win and how much they pay.') + '</p>';
  }
  function rischioUI(){
    ['LOW','MEDIUM','HIGH'].forEach(function(r){ $('cpl-r-' + r).classList.toggle('sel', r === CPL.risk); });
    $('cpl-rischi').classList.toggle('bloccato', aperto());
  }
  function zoneUI(){
    var h = '';
    for (var i = 0; i < 7; i++) h += '<button class="cpl-zona' + (i === CPL.zona ? ' sel' : '') + '" style="left:' + (G.ZONE[i] / G.W * 100) + '%" onclick="CPL.zonaA(' + i + ')" aria-label="' + (i + 1) + '"></button>';
    $('cpl-zone').innerHTML = h;
    $('cpl-zone').classList.toggle('bloccato', aperto());
  }
  function gettoni(){
    var h = '';
    (window.BETS || [0.5,1,2,5,10,25,50,100]).forEach(function(b){
      h += '<button class="casa-gettone' + (Math.abs(b - CPL.posta) < 1e-9 ? ' sel' : '') + '" ' + CASA.ficheBottone(b) + ' onclick="CPL.scegli(' + b + ')">' + E(b) + '</button>';
    });
    var g = $('cpl-gettoni'); g.innerHTML = h;
    var s = g.querySelector('.sel'); if (s) try { g.scrollLeft = s.offsetLeft - g.clientWidth / 2 + s.offsetWidth / 2; } catch(e){}
  }
  function bottoni(){
    var resto = G.MAX - CPL.lanci - CPL.coda;
    $('cpl-b1-t').textContent = (CPL.giro && !CPL.volo && CPL.giro.fatto ? L('RILANCIA', 'DROP AGAIN') : L('LANCIA', 'DROP')) + ' · ' + E(CPL.posta);
    $('cpl-b1-s').textContent = CPL.volo ? L('ancora ', '') + Math.max(0, resto) + L(' palline in questo giro', ' balls left this round') : L('1 pallina', '1 ball');
    $('cpl-b5-s').textContent = E(CPL.posta * 5);
    $('cpl-b1').disabled = CPL.avvio || resto <= 0;
    $('cpl-b5').disabled = CPL.avvio || resto < 5;
    $('cpl-conta').textContent = CPL.lanci + '/' + G.MAX;
    $('cpl-conta').classList.toggle('pieno', CPL.lanci >= G.MAX);
    $('cpl-conta').classList.toggle('vivo', CPL.volo);
  }
  function caselle(gira){
    var t = CPL.layout, h = '';
    for (var i = 0; i < G.CASE; i++) {
      var m = t ? t[i] : null;
      h += '<div class="cpl-buca' + (t ? (m >= 1 ? ' vince' : ' zero') : ' coperta') + (gira ? ' gira' : '') + '" id="cpl-buca-' + i + '" style="--c:' + (t ? colM(m) : '#3b2a66') + ';animation-delay:' + (i * 45) + 'ms">' +
           '<b>' + (t ? fmtM(m) : '?') + '</b></div>';
    }
    $('cpl-buche').innerHTML = h;
  }
  function ultimiUI(){
    var el = $('cpl-ultimi');
    el.innerHTML = CPL.ultimi.length ? CPL.ultimi.map(function(m, i){
      return '<span class="cpl-u' + (m >= 1 ? ' si' : '') + (i === 0 ? ' nuovo' : '') + '" style="--c:' + colM(m) + '">' + fmtM(m) + '</span>';
    }).join('') : '<span class="cpl-vuota">' + L('Ancora nessun lancio', 'No drops yet') + '</span>';
  }
  function riepilogo(){
    var el = $('cpl-giro'), g = CPL.giro;
    if (!g || !g.n) { el.className = 'cpl-giro'; el.innerHTML = L('Scegli il punto di caduta e lancia', 'Pick a drop point and launch'); return; }
    var netto = Math.round((g.vinto - g.puntato) * 100) / 100;
    var chiuso = g.fatto && !CPL.volo;
    el.className = 'cpl-giro' + (chiuso ? (netto > 0 ? ' su' : netto < 0 ? ' giu' : '') : '');
    el.innerHTML = '<span>' + g.n + ' ' + L(g.n === 1 ? 'pallina' : 'palline', g.n === 1 ? 'ball' : 'balls') + ' · ' + L('puntati ', 'bet ') + E(g.puntato) +
      ' · ' + L('vinti ', 'won ') + E(g.vinto) + '</span><b>' + (netto >= 0 ? '+' : '-') + E(Math.abs(netto)) + '</b>';
  }
  CPL.scegli = function(b){ CPL.posta = b; try { localStorage.setItem('cpl_posta', String(b)); } catch(e){} CASA.sfx('chip'); gettoni(); bottoni(); };
  CPL.zonaA = function(i){
    if (aperto()) { CASA.sfx('lock'); return; }
    CPL.zona = i; try { localStorage.setItem('cpl_zona', String(i)); } catch(e){}
    CASA.sfx('tick'); zoneUI(); disegna(0);
  };
  CPL.rischio = function(r){
    if (aperto() || !TAB[r]) { if (aperto()) CASA.sfx('lock'); return; }
    CPL.risk = r; try { localStorage.setItem('cpl_risk', r); } catch(e){}
    CPL.layout = null; CPL.lanci = 0;
    CASA.sfx('click'); rischioUI(); caselle(false); bottoni();
  };
  var cv = null, cx = null, DPR = 1, PX = 1, fondo = null;
  function pioli(){
    CPL.pioli = [];
    if (CPL.pioliSrv && CPL.pioliSrv.length) CPL.pioliSrv.forEach(function(p){ CPL.pioli.push({ x:+p[0], y:+p[1], h:0 }); });
    else for (var r = 0; r < 6; r++) for (var i = 0; i <= r; i++) CPL.pioli.push({ x: G.W / 2 + (i - r / 2) * (G.W / 7), y: 60 + r * 28, h:0 });
    fondo = null;
  }
  function misura(){
    cv = $('cpl-cv'); if (!cv) return false;
    var r = cv.getBoundingClientRect(); if (r.width < 50) return false;
    DPR = Math.min(2, window.devicePixelRatio || 1);
    var w = Math.round(r.width * DPR), h = Math.round(r.width * G.H / G.W * DPR);
    if (cv.width !== w || cv.height !== h || !cx) { cv.width = w; cv.height = h; cx = cv.getContext('2d'); fondo = null; }
    PX = w / G.W;
    return true;
  }
  function pioliFondo(){
    fondo = document.createElement('canvas'); fondo.width = cv.width; fondo.height = cv.height;
    var c = fondo.getContext('2d'); c.setTransform(PX, 0, 0, PX, 0, 0);
    c.strokeStyle = 'rgba(255,255,255,.09)'; c.lineWidth = 1.5; c.lineCap = 'round';
    for (var i = 1; i < G.CASE; i++) { var x = i * G.W / G.CASE; c.beginPath(); c.moveTo(x, G.FONDO - 16); c.lineTo(x, G.H); c.stroke(); }
    CPL.pioli.forEach(function(p){
      c.fillStyle = 'rgba(255,255,255,.07)'; c.beginPath(); c.arc(p.x, p.y, G.PEG_R, 0, 6.283); c.fill();
      var g = c.createRadialGradient(p.x - 1.5, p.y - 1.5, 0.5, p.x, p.y, G.PEG_R * 0.62);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.6, '#ececf1'); g.addColorStop(1, '#a9a9b2');
      c.fillStyle = g; c.beginPath(); c.arc(p.x, p.y, G.PEG_R * 0.62, 0, 6.283); c.fill();
    });
  }
  function disegna(dt){
    if (!cx && !misura()) return;
    if (!fondo) pioliFondo();
    cx.setTransform(1, 0, 0, 1, 0, 0); cx.clearRect(0, 0, cv.width, cv.height);
    cx.drawImage(fondo, 0, 0);
    cx.setTransform(PX, 0, 0, PX, 0, 0);
    if (!aperto()) {
      var zx = G.ZONE[CPL.zona];
      cx.strokeStyle = 'rgba(255,255,255,.22)'; cx.lineWidth = 1.2; cx.setLineDash([2, 5]);
      cx.beginPath(); cx.moveTo(zx, 16); cx.lineTo(zx, 48); cx.stroke(); cx.setLineDash([]);
      palla(zx, 9, 0.85);
    }
    for (var i = 0; i < CPL.pioli.length; i++) {
      var p = CPL.pioli[i]; if (p.h <= 0) continue;
      cx.globalAlpha = p.h * 0.4; cx.fillStyle = '#8f86f2'; cx.beginPath(); cx.arc(p.x, p.y, G.PEG_R + 5 * p.h, 0, 6.283); cx.fill();
      cx.globalAlpha = p.h; cx.fillStyle = '#ffffff'; cx.beginPath(); cx.arc(p.x, p.y, G.PEG_R * 0.75, 0, 6.283); cx.fill();
      p.h = Math.max(0, p.h - dt * 3.2);
    }
    cx.globalAlpha = 1;
    for (var b = 0; b < CPL.palle.length; b++) {
      var q = CPL.palle[b]; if (q.via) continue;
      for (var t = 0; t < q.scia.length; t++) {
        var s = q.scia[t], k = (t + 1) / q.scia.length;
        cx.globalAlpha = k * 0.26; cx.fillStyle = '#8f86f2'; cx.beginPath(); cx.arc(s.x, s.y, G.BALL_R * (0.25 + 0.6 * k), 0, 6.283); cx.fill();
      }
      cx.globalAlpha = q.fermo ? Math.max(0, 1 - (q.dopo || 0) * 4) : 1;
      palla(q.x, q.y, 1);
      cx.globalAlpha = 1;
    }
  }
  function palla(x, y, a){
    var g = cx.createRadialGradient(x - 2.5, y - 2.5, 0.5, x, y, G.BALL_R);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.3, '#cdc7ff'); g.addColorStop(0.72, '#8f86f2'); g.addColorStop(1, '#4d44b8');
    var old = cx.globalAlpha; cx.globalAlpha = old * a;
    cx.fillStyle = g; cx.beginPath(); cx.arc(x, y, G.BALL_R, 0, 6.283); cx.fill();
    cx.globalAlpha = old;
  }
  function passo(b, suona){
    b.frames++;
    b.vy += G.GRAV; if (b.vy > G.MAX_VY) b.vy = G.MAX_VY;
    b.vx *= G.ATTRITO; b.x += b.vx; b.y += b.vy;
    if (b.x < G.BALL_R) { b.x = G.BALL_R; b.vx = Math.abs(b.vx) * G.RIMBALZO + 0.25; }
    else if (b.x > G.W - G.BALL_R) { b.x = G.W - G.BALL_R; b.vx = -Math.abs(b.vx) * G.RIMBALZO - 0.25; }
    var rr = G.BALL_R + G.PEG_R, rr2 = rr * rr;
    for (var i = 0; i < CPL.pioli.length; i++) {
      var p = CPL.pioli[i], dx = b.x - p.x, dy = b.y - p.y, d2 = dx * dx + dy * dy;
      if (d2 < rr2) {
        var d = Math.sqrt(d2) || 0.0001, nx = dx / d, ny = dy / d, ov = rr - d;
        b.x += nx * ov; b.y += ny * ov;
        var vn = b.vx * nx + b.vy * ny;
        if (vn < 0) { b.vx -= (1 + G.RIMBALZO) * vn * nx; b.vy -= (1 + G.RIMBALZO) * vn * ny; }
        b.vx += (Math.random() - 0.5) * G.CALCIO * 5;
        if (ny < -0.25) b.vx += (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 0.8);
        if (b.vy < 0.4) b.vy = 0.4;
        if (suona && (b.ultimo !== i || b.frames - b.quando > 8)) {
          p.h = 1;
          var ora = performance.now();
          if (ora - CPL.suonoT > 38) { CPL.suonoT = ora; CASA.sfx('bounce', Math.min(1, p.y / G.FONDO)); }
          if (ora - (CPL.xrHap || 0) > 90) { CPL.xrHap = ora; GBX.hap('sel'); }
        }
        b.ultimo = i; b.quando = b.frames;
      }
    }
    if (b.y >= G.FONDO || b.frames > 900) {
      b.y = G.FONDO; b.fermo = true;
      var c = Math.floor(b.x / (G.W / G.CASE)); if (c < 0) c = 0; if (c >= G.CASE) c = G.CASE - 1;
      atterra(b, c);
    }
  }
  function ciclo(now){
    CPL.raf = null;
    if (!visibile()) { veloce(); return; }
    var dt = CPL.prev ? Math.min(0.1, (now - CPL.prev) / 1000) : 1 / 60; CPL.prev = now;
    CPL.acc += dt; var n = 0;
    while (CPL.acc >= 1 / 60 && n < 5) {
      CPL.acc -= 1 / 60; n++;
      for (var i = 0; i < CPL.palle.length; i++) { var b = CPL.palle[i];
        if (!b.fermo) { passo(b, true); b.scia.push({ x:b.x, y:b.y }); if (b.scia.length > 8) b.scia.shift(); } }
    }
    if (CPL.acc > 0.1) CPL.acc = 0;
    CPL.palle.forEach(function(b){ if (b.fermo) { b.dopo = (b.dopo || 0) + dt; if (b.scia.length) b.scia.shift(); } });
    pulisci();
    disegna(dt);
    if (CPL.palle.length || CPL.pioli.some(function(p){ return p.h > 0; })) CPL.raf = requestAnimationFrame(ciclo);
  }
  function avvia(){ if (!CPL.raf && visibile()) { CPL.prev = 0; CPL.acc = 0; CPL.raf = requestAnimationFrame(ciclo); } }
  function veloce(){
    CPL.palle.forEach(function(b){ var k = 0; while (!b.fermo && k++ < 2000) passo(b, false); });
    pulisci();
    if (CPL.palle.length && !CPL.tmr) CPL.tmr = setTimeout(function(){ CPL.tmr = null; if (visibile()) avvia(); else veloce(); }, 250);
  }
  function pulisci(){
    var ora = Date.now(), prima = CPL.palle.length;
    CPL.palle = CPL.palle.filter(function(b){ return !(b.pagata && ora - b.pagata > 1200); });
    if (prima && !CPL.palle.length && CPL.volo && !CPL.coda && !CPL.sparando) fineGiro();
  }
  function post(body){
    return fetch(BACKEND + '/play/plinko', { method:'POST', headers:{'Content-Type':'application/json','ngrok-skip-browser-warning':'1'}, body:JSON.stringify(body) })
      .then(function(r){ return r.json(); });
  }
  CPL.lancia = function(n){
    n = n || 1;
    var ora = Date.now(); if (ora - CPL.ultimoTap < 120) return; CPL.ultimoTap = ora;
    if (!S.userId) { toast(L('Apri dentro Telegram per giocare', 'Open in Telegram to play'), 'err'); return; }
    if (!hasFunds(CPL.posta)) { toast(L('Saldo insufficiente', 'Insufficient balance'), 'err'); CASA.scuoti($('cpl-b1'), 5); return; }
    var spazio = G.MAX - CPL.lanci - CPL.coda;
    if (spazio <= 0) { toast(L('Massimo 10 palline: aspetta che cadano', 'Max 10 balls: let them land first'), 'err', 1500); return; }
    CPL.coda += Math.min(n, spazio);
    if (!CPL.volo) {
      if (CPL.avvio) return;
      CPL.avvio = true; bottoni(); rischioUI(); zoneUI();
      post({ user_id:S.userId, risk:CPL.risk, action:'reveal', v:2 }).then(function(d){
        CPL.avvio = false;
        if (!d || d.error || !d.ok) { CPL.coda = 0; toast('⚠️ ' + ((d && d.error) || L('Errore di rete', 'Network error')), 'err'); bottoni(); rischioUI(); zoneUI(); return; }
        CPL.pioliSrv = (d.pegs && d.pegs.length) ? d.pegs : null; pioli();
        CPL.layout = null; CPL.volo = true; CPL.lanci = 0;
        CPL.giro = { n:0, puntato:0, vinto:0, fatto:false }; CPL.svelata = false;
        caselle(false);
        rischioUI(); zoneUI(); riepilogo();
        spara();
      }).catch(function(){ CPL.avvio = false; CPL.coda = 0; toast(L('Errore di rete', 'Network error'), 'err'); bottoni(); rischioUI(); zoneUI(); });
      return;
    }
    if (!CPL.sparando) spara();
    else bottoni();
  };
  function spara(){
    CPL.sparando = false;
    if (CPL.coda <= 0 || !CPL.volo) { CPL.coda = 0; bottoni(); return; }
    if (CPL.lanci >= G.MAX) { CPL.coda = 0; bottoni(); return; }
    var eur = CPL.posta;
    if (!hasFunds(eur)) { CPL.coda = 0; toast(L('Saldo insufficiente', 'Insufficient balance'), 'err'); bottoni(); if (!CPL.palle.length) fineGiro(); return; }
    CPL.coda--;
    S.btc = Math.max(0, S.btc - eurToBtc(eur)); refresh(); saldo();
    CPL.lanci++; CPL.giro.n++; CPL.giro.puntato += eur;
    var x = G.ZONE[CPL.zona] + (Math.random() - 0.5) * 10;
    CPL.palle.push({ id:++CPL.seq, eur:eur, x:x, y:6, vx:(Math.random() - 0.5) * 0.8, vy:0.5, scia:[], fermo:false, frames:0, ultimo:-1, quando:0 });
    GBX.fx('pop');
    bottoni(); riepilogo(); avvia();
    if (!visibile()) veloce();
    if (CPL.coda > 0) { CPL.sparando = true; setTimeout(spara, 170); }
  }
  function atterra(b, c){
    if (b.mandata) return; b.mandata = true;
    var eur = b.eur, el = $('cpl-buca-' + c);
    if (el && el.animate && !CASA.lento()) el.animate([{ transform:'translateY(0)' }, { transform:'translateY(5px) scaleY(.94)' }, { transform:'translateY(0)' }], { duration:260, easing:'ease-out' });
    post(Object.assign({ user_id:S.userId }, postaCent(eur), { risk:CPL.risk, action:'settle', landed_bucket:c, v:2 })).then(function(d){
      if (!d || d.error) {
        S.btc = Math.max(0, S.btc + eurToBtc(eur)); refresh(); saldo();
        toast('⚠️ ' + ((d && d.error) || L('Errore di rete', 'Network error')), 'err');
        if (typeof loadBalance === 'function') loadBalance();
        CPL.giro.n--; CPL.giro.puntato -= eur;
        b.pagata = Date.now(); riepilogo(); return;
      }
      if (d.buckets && d.buckets.length === G.CASE) {
        var primaSv = !CPL.svelata || !CPL.layout;
        CPL.layout = d.buckets.slice(); caselle(primaSv);
        if (primaSv) { CPL.svelata = true; if (visibile()) CASA.sfx('flip'); }
        clearTimeout(CPL.copri);
        var copriSv = function(){
          var inVolo = CPL.coda > 0 || (CPL.palle || []).some(function(p){ return !p.pagata; });
          if (inVolo) { CPL.copri = setTimeout(copriSv, 300); return; }
          CPL.copri = null; CPL.layout = null; CPL.svelata = false; caselle(false);
        };
        CPL.copri = setTimeout(copriSv, 1300);
      }
      var tav = CPL.layout || TAB[CPL.risk];
      var multi = (d.multi != null) ? d.multi : tav[c];
      CPL.ultimi.unshift(multi); CPL.ultimi = CPL.ultimi.slice(0, 12); ultimiUI();
      if (d.won_btc !== undefined) S.btc = Math.max(0, S.btc + d.won_btc);
      else if (d.btc !== undefined && d.btc !== null) S.btc = d.btc;
      if (d.wins !== undefined) S.wins = d.wins;
      if (d.losses !== undefined) S.losses = d.losses;
      if (d.total_bet_eur !== undefined) S.totalBet = d.total_bet_eur;
      if (d.biggest_win_eur !== undefined) S.biggestWin = d.biggest_win_eur;
      refresh(); saldo(); if (typeof CUR !== 'undefined' && CUR === 'profile' && typeof renderProfile === 'function') renderProfile();
      var vinto = d.won_eur != null ? d.won_eur : eur * multi;
      CPL.giro.vinto += vinto;
      festa(c, multi, vinto);
      b.pagata = Date.now(); riepilogo();
      if (!visibile()) pulisci();
    }).catch(function(){
      S.btc = Math.max(0, S.btc + eurToBtc(eur)); refresh(); saldo();
      toast(L('Errore di rete', 'Network error'), 'err');
      if (typeof loadBalance === 'function') loadBalance();
      CPL.giro.n--; CPL.giro.puntato -= eur;
      b.pagata = Date.now(); riepilogo();
      if (!visibile()) pulisci();
    });
  }
  function festa(c, multi, vinto){
    var el = $('cpl-buca-' + c), box = $('cpl-tav');
    if (!visibile() || !el || !box) return;
    el.classList.add('presa'); setTimeout(function(){ el.classList.remove('presa'); }, 700);
    var f = document.createElement('div');
    f.className = 'cpl-volo' + (multi >= 1 ? ' si' : '');
    f.textContent = multi > 0 ? '+' + E(vinto) : '0×';
    f.style.left = ((c + 0.5) / G.CASE * 100) + '%';
    box.appendChild(f);
    if (f.animate) { var a = f.animate([{ transform:'translate(-50%,0) scale(.7)', opacity:0 }, { transform:'translate(-50%,-26px) scale(1.05)', opacity:1, offset:0.25 },
                                        { transform:'translate(-50%,-56px) scale(1)', opacity:0 }], { duration:1100, easing:'cubic-bezier(.2,.7,.4,1)' });
                     a.onfinish = function(){ f.remove(); }; }
    else setTimeout(function(){ f.remove(); }, 1100);
    if (multi >= 6) { GBX.fx('bigwin'); GBX.sparks(el, 18); CASA.scuoti(box, 4); if (window.XR) XR.alone(box); }
    else if (multi >= 4) { GBX.fx('win'); GBX.sparks(el, 12); if (window.XR) XR.alone(box); }
    else if (multi >= 1) { CASA.sfx('coin'); GBX.hap('light'); }
    else { CASA.sfx('click'); GBX.hap('soft'); }
  }
  function fineGiro(){
    CPL.volo = false; CPL.lanci = 0; CPL.coda = 0;
    if (!CPL.copri) CPL.layout = null;
    if (CPL.giro) {
      CPL.giro.fatto = true;
      var netto = CPL.giro.vinto - CPL.giro.puntato;
      if (visibile() && CPL.giro.n > 1 && netto > 0.004) CASA.sfx('chips');
      if (visibile() && window.XR) try { XR.esitoPlinko(CPL.giro); } catch(e){}
    }
    caselle(false); rischioUI(); zoneUI(); bottoni(); riepilogo(); saldo(); disegna(0);
  }
  CPL.enter = function(){
    testi(); rischioUI(); zoneUI(); gettoni(); caselle(false); bottoni(); ultimiUI(); riepilogo(); saldo();
    if (!CPL.pioli.length) pioli();
    cx = null; misura(); disegna(0); avvia();
  };
  window.addEventListener('resize', function(){ if (visibile()) { cx = null; misura(); disegna(0); } });
})();
(function(){
  'use strict';
  if (!window.CASA) return;
  var L = CASA.L;
  var CRL = window.CRL = {};
  function $(id){ return document.getElementById(id); }
  function eur2(x){ return '€' + (Math.round(x * 100) / 100).toFixed(2); }
  function lbl(x){ return (typeof betLbl === 'function') ? betLbl(x) : CASA.eur(x); }
  function colore(c){ return c === 'red' ? L('ROSSO', 'RED') : (c === 'black' ? L('NERO', 'BLACK') : L('VERDE', 'GREEN')); }
  function totUltime(){ var t = 0; (RL.last || []).forEach(function(b){ t += b.amount; }); return Math.round(t * 100) / 100; }
  CRL.entra = function(){
    var m = { num: [L('NUMERO', 'NUMBER'), 'x36'], cavallo: ['CAVALLO', L('2 numeri', '2 nums') + ' · x18'], quartina: ['QUARTINA', L('4 numeri', '4 nums') + ' · x9'] };
    document.querySelectorAll('#roulette .rl4-modes button').forEach(function(b){
      var k = m[b.getAttribute('data-m')]; if (k) b.innerHTML = k[0] + '<small>' + k[1] + '</small>';
    });
    var tot = document.querySelector('#roulette .rl4-info .tot');
    if (tot && tot.firstChild && tot.firstChild.nodeType === 3) tot.firstChild.textContent = L('PUNTATA', 'BET');
    var a = { undo: L('ANNULLA', '↶ UNDO'), clear: L('TOGLI', 'CLEAR'), rebet: L('RIPETI', 'REBET') };
    for (var k in a) { var el = $('rl4-' + k); if (el) el.textContent = a[k]; }
    var em = document.querySelector('#rl4-hist em'); if (em) em.textContent = L('ULTIMI NUMERI', 'LAST NUMBERS');
  };
  CRL.info = function(n){
    var sp = $('rl4-spin');
    var re = !n && RL.last && RL.last.length && !RL.spinning;
    if (sp) {
      sp.classList.toggle('crl-re', !!re);
      sp.textContent = re ? '↻ ' + L('RIGIOCA', 'REBET') + ' ' + lbl(totUltime()) + ' · ' + L('GIRA', 'SPIN') : L('GIRA', 'SPIN');
    }
    if (RL.spinning) return;
    var t;
    if (n) t = L('Pronto? Gira!', 'Ready? Spin!');
    else if (re) t = L('Punta di nuovo o rigioca le ultime', 'Bet again or replay your last bets');
    else if (RL.mode === 'cavallo') t = L('Cavallo: tocca un numero vicino al bordo che vuoi', 'Cavallo: tap a number near the edge you want');
    else if (RL.mode === 'quartina') t = L('Quartina: tocca un numero vicino all’angolo che vuoi', 'Quartina: tap a number near the corner you want');
    else t = L('Tocca un numero o una puntata esterna', 'Tap a number or an outside bet');
    rl4Msg(t);
  };
  CRL.rigioca = function(){
    if (RL.spinning || !RL.last || !RL.last.length) return 0;
    var need = totUltime();
    if (typeof hasFunds === 'function' && !hasFunds(need)) {
      toast(L('Saldo insufficiente', 'Insufficient balance'), 'err');
      rl4Msg(L('Saldo insufficiente per ', 'Not enough balance for ') + lbl(need), 1);
      return -1;
    }
    RL.bets = {}; RL.order = [];
    var ok = true;
    RL.last.forEach(function(b){
      if (!ok) return;
      ok = rl4Place({ key:b.key, type:b.type, nums:b.nums, edge:b.edge ? b.edge.map(rl4Cell) : null,
        anchor:b.anchor ? (rl4Cell(b.anchor) || document.querySelector('#rl4-grid [data-k="' + b.anchor + '"]')) : null }, b.amount, true);
    });
    if (!ok || Math.abs(rl4Tot() - need) > 0.005) { RL.bets = {}; RL.order = []; rl4RenderChips(); return -1; }
    rl4RenderChips();
    return 1;
  };
  CRL.testo = function(won, tot, n, c){
    var h = n + ' ' + colore(c) + ' · ';
    if (!won) return h + L('niente stavolta', 'no win this time');
    if (won > tot + 0.005) return h + '+' + eur2(won - tot) + ' ' + L('netti', 'net');
    if (Math.abs(won - tot) <= 0.005) return h + L('pari, rientrano ', 'even, back ') + eur2(won);
    return h + L('rientrano ', 'back ') + eur2(won) + L(' su ', ' of ') + eur2(tot);
  };
  CRL.dopo = function(won, tot){
    if (won > tot + 0.005) return L('Vinti ', 'Won ') + eur2(won) + ' (' + L('netto', 'net') + ' +' + eur2(won - tot) + ')';
    return L('Rientrano ', 'Back ') + eur2(won) + L(' su ', ' of ') + eur2(tot);
  };
  CRL.festa = function(won, tot){
    if (!won) return;
    var wh = $('rl4-wheel'), ratio = won / Math.max(0.01, tot);
    if (wh && ratio > 1.005) setTimeout(function(){
      CASA.scoppio(wh, ratio >= 5 ? { tipo:'monete', n:28, forza:230 } : { n:20, forza:170 });
    }, 200);
    CASA.pulsa($('rl4-msg'));
  };
})();
(function(){
  'use strict';
  if (window.CSC || !window.CASA) return;
  var L = CASA.L, E = CASA.eur;
  function $(id){ return document.getElementById(id); }
  var MULT = [3, 1.5, 0.7, 0.3, 0.1, 0];
  var ICONE = [
    '<svg viewBox="0 0 24 24"><path d="M7 4h10l4 5-9 11L3 9z" fill="url(#xk-g-ice)"/><path d="M3 9h18M7 4l2.5 5L12 20M17 4l-2.5 5L12 20M9.5 9 12 4l2.5 5" stroke="rgba(255,255,255,.75)" stroke-width=".7" fill="none"/><path class="xk-tw" d="M19.2 1.6l.55 1.35 1.35.55-1.35.55-.55 1.35-.55-1.35-1.35-.55 1.35-.55z" fill="#fff"/></svg>',
    '<svg viewBox="0 0 24 24"><path d="M12 3.2l7.2 4.2v9.2L12 20.8l-7.2-4.2V7.4z" fill="url(#xk-g-vio)"/><path d="M12 3.2v17.6M4.8 7.4l14.4 9.2M19.2 7.4 4.8 16.6" stroke="rgba(255,255,255,.45)" stroke-width=".6" fill="none"/><path d="M7.4 7.6 12 5l1.6.9" stroke="rgba(255,255,255,.8)" stroke-width=".9" fill="none" stroke-linecap="round"/></svg>',
    '<svg viewBox="0 0 24 24"><path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6l-5.4 2.9 1.2-6-4.5-4.2 6.1-.7z" fill="url(#xk-g-gold)" stroke="rgba(255,255,255,.55)" stroke-width=".6" stroke-linejoin="round"/><path d="M10.6 7.4 12 4.6" stroke="#fff" stroke-width=".9" stroke-linecap="round"/></svg>',
    '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.6" fill="url(#xk-g-silver)" stroke="rgba(255,255,255,.6)" stroke-width=".6"/><circle cx="12" cy="12" r="5" fill="none" stroke="rgba(40,42,50,.45)" stroke-width=".9" stroke-dasharray="1.5 1.3"/><path d="M8.2 9.2a4.6 4.6 0 0 1 3-2.4" stroke="#fff" stroke-width=".9" fill="none" stroke-linecap="round"/></svg>',
    '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" fill="url(#xk-g-glass)" stroke="rgba(255,255,255,.55)" stroke-width=".6"/><circle cx="10.2" cy="10.2" r="1.5" fill="rgba(255,255,255,.75)"/></svg>',
    '<svg viewBox="0 0 24 24"><circle cx="11" cy="14" r="7.2" fill="url(#xk-g-bomb)" stroke="rgba(255,255,255,.28)" stroke-width=".7"/><rect x="13.4" y="5.6" width="4" height="3.4" rx="1" transform="rotate(40 15.4 7.3)" fill="#3a3a40"/><path d="M17.2 5.2c1-1.6 2.6-1.8 3.4-.8" stroke="#c9c3ff" stroke-width="1.2" fill="none" stroke-linecap="round"/><g class="xk-fuse"><circle cx="20.8" cy="4.2" r="3" fill="rgba(255,210,122,.35)"/><circle cx="20.8" cy="4.2" r="1.5" fill="#ffd27a"/></g><circle cx="8.6" cy="11.6" r="1.6" fill="rgba(255,255,255,.35)"/></svg>'
  ];
  var C = window.CSC = { fase:'idle', posta:2, celle:{}, rivelate:[], vinto:0, busy:false, inCorso:-1, esplosa:-1, pulite:{} };
  try { if (window.currentBet && currentBet.scratch > 0) C.posta = currentBet.scratch; } catch(e){}
  function premioEur(sym){ return Math.floor(Math.round(C.posta * 100) * MULT[sym]) / 100; }
  function buone(){ var n = 0; C.rivelate.forEach(function(i){ if (C.celle[i] !== 5) n++; }); return n; }
  function griglia(){
    var g = $('csc-griglia'); if (!g) return;
    if (g.children.length !== 16) { var h = ''; for (var i = 0; i < 16; i++) h += '<div class="csc-cella" data-i="' + i + '"><div class="csc-sotto"></div></div>'; g.innerHTML = h; }
    for (var j = 0; j < 16; j++) cella(j, false);
  }
  function cella(i, nuova){
    var el = $('csc-griglia').children[i]; if (!el) return;
    var s = (i in C.celle) ? C.celle[i] : null, cls = 'csc-cella', h = '';
    if (s == null) {
      if (C.inCorso === i) { cls += ' attesa'; h = '<div class="csc-attesa">?</div>'; }
      else cls += ' coperta';
    } else {
      var aperta = C.rivelate.indexOf(i) >= 0;
      cls += (s === 5 ? ' bomba' : ' premio s' + s) + (aperta ? '' : ' spenta') + (i === C.esplosa ? ' esplosa' : '');
      h = '<div class="csc-ico">' + ICONE[s] + '</div><div class="csc-val">' + (s === 5 ? 'BOOM' : '+' + E(premioEur(s))) + '</div>';
      if (nuova) cls += ' nuova';
    }
    el.className = cls;
    el.firstChild.innerHTML = h;
  }
  var F = { cv:null, g:null, dpr:1, w:0, h:0, rect:[], punti:{}, tok:{} };
  function rettangoli(){
    var g = $('csc-griglia'); F.rect = [];
    for (var i = 0; i < 16; i++) { var c = g.children[i]; F.rect.push({ x:c.offsetLeft, y:c.offsetTop, w:c.offsetWidth, h:c.offsetHeight }); }
  }
  function prepara(){
    var cv = $('csc-foil'), wrap = $('csc-wrap'); if (!cv || !wrap) return false;
    var w = wrap.clientWidth, h = wrap.clientHeight; if (w < 40 || h < 40) return false;
    F.cv = cv; F.dpr = Math.min(2, window.devicePixelRatio || 1); F.w = w; F.h = h;
    cv.width = Math.round(w * F.dpr); cv.height = Math.round(h * F.dpr); cv.style.width = w + 'px'; cv.style.height = h + 'px';
    F.g = cv.getContext('2d'); F.g.setTransform(F.dpr, 0, 0, F.dpr, 0, 0);
    rettangoli();
    return true;
  }
  function tondo(g, x, y, w, h, r){ g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function stagnola(i){
    var g = F.g, r = F.rect[i]; if (!g || !r) return;
    g.save(); g.globalCompositeOperation = 'source-over';
    g.clearRect(r.x - 1, r.y - 1, r.w + 2, r.h + 2);
    var rad = Math.min(14, r.w * 0.2);
    tondo(g, r.x, r.y, r.w, r.h, rad); g.clip();
    var gr = g.createLinearGradient(r.x, r.y, r.x + r.w * 0.7, r.y + r.h);
    gr.addColorStop(0, 'rgba(255,255,255,.02)'); gr.addColorStop(1, 'rgba(255,255,255,.07)');
    g.fillStyle = gr; g.fillRect(r.x, r.y, r.w, r.h);
    var m = Math.max(5, r.w * 0.11), ix = r.x + m, iy = r.y + m, iw = r.w - 2 * m, ih = r.h - 2 * m;
    g.save(); tondo(g, ix, iy, iw, ih, Math.max(4, rad * 0.45)); g.clip();
    g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = Math.max(1.6, r.w * 0.03);
    var passo = Math.max(6, r.w * 0.1);
    for (var k = 0; k < iw + ih; k += passo) { g.beginPath(); g.moveTo(ix + k, iy); g.lineTo(ix + k - ih, iy + ih); g.stroke(); }
    g.restore();
    var hl = g.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
    hl.addColorStop(0, 'rgba(255,255,255,.04)'); hl.addColorStop(0.45, 'rgba(255,255,255,0)');
    g.fillStyle = hl; g.fillRect(r.x, r.y, r.w, r.h);
    g.restore();
    g.save(); tondo(g, r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1, rad); g.lineWidth = 1; g.strokeStyle = 'rgba(255,255,255,.15)'; g.stroke(); g.restore();
    var p = []; for (var q = 0; q < 36; q++) p.push(0); F.punti[i] = p;
  }
  function stagnolaTutta(){
    if (!prepara()) return false;
    F.g.clearRect(0, 0, F.w, F.h);
    for (var i = 0; i < 16; i++) if (!(i in C.celle) && C.pulite[i] !== true) stagnola(i);
    return true;
  }
  function gratta(i, x0, y0, x1, y1, spess){
    var g = F.g, r = F.rect[i]; if (!g || !r) return 0;
    g.save(); tondo(g, r.x - 1, r.y - 1, r.w + 2, r.h + 2, 10); g.clip();
    g.globalCompositeOperation = 'destination-out';
    g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = spess || r.w * 0.3;
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1 + 0.01, y1); g.stroke();
    g.restore();
    var p = F.punti[i]; if (!p) return 0;
    var rad = (spess || r.w * 0.3) / 2, n = 0, dx = x1 - x0, dy = y1 - y0, ll = dx * dx + dy * dy;
    for (var q = 0; q < 36; q++) {
      if (!p[q]) {
        var px = r.x + r.w * ((q % 6) + 0.5) / 6, py = r.y + r.h * (Math.floor(q / 6) + 0.5) / 6;
        var t = ll ? Math.max(0, Math.min(1, ((px - x0) * dx + (py - y0) * dy) / ll)) : 0;
        var ex = x0 + t * dx - px, ey = y0 + t * dy - py;
        if (ex * ex + ey * ey <= rad * rad) p[q] = 1;
      }
      n += p[q];
    }
    return n;
  }
  function pulisci(i, ms, poi){
    var r = F.rect[i]; if (!r) { if (poi) poi(); return; }
    if (C.pulite[i] === true) { if (poi) poi(); return; }
    C.pulite[i] = 'in';
    var mio = F.tok[i] = (F.tok[i] || 0) + 1;
    var t0 = performance.now(), D = CASA.lento() ? 1 : (ms || 260), ult = null, k = 0;
    function giro(now){
      if (F.tok[i] !== mio) return;
      var u = Math.min(1, (now - t0) / D);
      if (u < 1) {
        var yy = r.y + r.h * u, xx = r.x + ((k++ % 2) ? r.w * 0.95 : r.w * 0.05);
        if (ult) gratta(i, ult[0], ult[1], xx, yy, r.w * 0.36);
        ult = [xx, yy];
        requestAnimationFrame(giro);
      } else {
        if (F.g) F.g.clearRect(r.x - 1, r.y - 1, r.w + 2, r.h + 2);
        C.pulite[i] = true; if (poi) poi();
      }
    }
    requestAnimationFrame(giro);
  }
  var T = null, ultSuono = 0, ultScaglie = 0;
  function xy(ev){ var b = F.cv.getBoundingClientRect(); return [ev.clientX - b.left, ev.clientY - b.top]; }
  function quale(x, y){ for (var i = 0; i < 16; i++) { var r = F.rect[i]; if (r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i; } return -1; }
  function giu(ev){
    if (!F.g) return;
    var p = xy(ev), i = quale(p[0], p[1]);
    if (C.fase !== 'attivo') { if (C.fase !== 'attivo' && !C.busy) { CASA.pulsa($('csc-nuovo')); } return; }
    if (i < 0 || (i in C.celle) || C.pulite[i]) return;
    if (C.busy && C.inCorso !== i) { var el = $('csc-griglia').children[i]; CASA.scuoti(el, 3); return; }
    ev.preventDefault();
    try { F.cv.setPointerCapture(ev.pointerId); } catch(e){}
    T = { i:i, x:p[0], y:p[1], mosso:0, id:ev.pointerId };
    if (C.inCorso !== i) { var bombe = 5, resto = 16 - C.rivelate.length; if (bombe / resto >= 0.45) CASA.sfx('heart'); }
  }
  function muovi(ev){
    if (!T || ev.pointerId !== T.id) return;
    ev.preventDefault();
    var p = xy(ev), dx = p[0] - T.x, dy = p[1] - T.y, d = Math.sqrt(dx * dx + dy * dy);
    if (d < 1.5) return;
    var n = gratta(T.i, T.x, T.y, p[0], p[1]);
    T.mosso += d; T.x = p[0]; T.y = p[1];
    var now = performance.now();
    if (now - ultSuono > 55) { ultSuono = now; CASA.sfx('scratch'); }
    if (now - ultScaglie > 130 && !CASA.lento()) { ultScaglie = now;
      CASA.scoppio(F.cv, { n:2, tipo:'scintille', colori:['#e5e7eb','#9ca3af','#f8fafc'], x:p[0] / F.w, y:p[1] / F.h, forza:50, caduta:90, durata:520, apertura:Math.PI }); }
    if (n >= 3 && C.inCorso !== T.i && !(T.i in C.celle)) chiedi(T.i);
  }
  function su(ev){
    if (!T || ev.pointerId !== T.id) return;
    var t = T; T = null;
    if (t.mosso < 8 && C.inCorso !== t.i && !(t.i in C.celle)) { if (chiedi(t.i)) pulisci(t.i, 380); }
  }
  function posta(url, body, ok, ko){
    fetch(BACKEND + url, { method:'POST', headers:{'Content-Type':'application/json','ngrok-skip-browser-warning':'1'}, body:JSON.stringify(body) })
      .then(function(r){ return r.json(); })
      .then(function(d){ if (!d || d.error) { ko(traduci((d && d.error) || 'error'), d); return; } ok(d); })
      .catch(function(){ ko(L('Errore di rete', 'Network error'), null); });
  }
  function traduci(e){
    var t = { 'insufficient balance':['Saldo insufficiente','Insufficient balance'], 'no active scratch':['Nessun biglietto aperto','No active card'],
              'nothing to cash out':['Niente da incassare','Nothing to cash out'], 'already revealed':['Casella già grattata','Cell already scratched'],
              'invalid bet':['Puntata non valida','Invalid bet'] }[String(e).toLowerCase()];
    return t ? L(t[0], t[1]) : String(e);
  }
  function saldoDaRisposta(d){
    if (d.btc !== undefined || d.cent !== undefined) S.btc = saldoDa(d);
    if (d.total_bet_eur !== undefined) S.totalBet = d.total_bet_eur;
    if (d.wins !== undefined) S.wins = d.wins;
    if (d.losses !== undefined) S.losses = d.losses;
    if (d.biggest_win_eur !== undefined) S.biggestWin = d.biggest_win_eur;
    refresh(); if (CUR === 'profile') renderProfile();
  }
  C.nuovo = function(){
    if (C.fase === 'attivo' || C.busy) return;
    var bet = C.posta;
    if (!hasFunds(bet)) { toast(L('Saldo insufficiente', 'Insufficient balance'), 'err'); CASA.scuoti($('csc-nuovo'), 5); return; }
    if (!S.userId) { toast(L('Apri dentro Telegram per giocare', 'Open in Telegram to play'), 'err'); return; }
    C.busy = true; comandi();
    CASA.sfx('chips');
    posta('/scratch/new', Object.assign({ user_id:S.userId }, postaCent(bet)), function(d){
      C.busy = false;
      C.posta = bet; C.fase = 'attivo'; C.vinto = 0; C.rivelate = []; C.celle = {}; C.esplosa = -1; C.inCorso = -1; C.pulite = {};
      saldoDaRisposta(d);
      CASA.togliEsito($('csc-biglietto'));
      $('csc-wrap').classList.remove('chiusa');
      griglia(); stagnolaTutta();
      var b = $('csc-biglietto');
      if (b.animate && !CASA.lento()) b.animate([{transform:'translateY(-26px) rotate(-2deg) scale(.95)', opacity:0.2},{transform:'none', opacity:1}], {duration:380, easing:'cubic-bezier(.2,1.2,.4,1)'});
      CASA.sfx('deal'); setTimeout(function(){ CASA.sfx('whoosh'); }, 90);
      banco(0, true); stato(); comandi();
    }, function(msg){
      C.busy = false; toast('⚠️ ' + msg, 'err'); if (typeof loadBalance === 'function') loadBalance(); comandi();
    });
  };
  function chiedi(i){
    if (C.fase !== 'attivo' || C.busy || (i in C.celle)) return false;
    C.busy = true; C.inCorso = i; cella(i); comandi();
    CASA.hap('leggero');
    posta('/scratch/reveal', { user_id:S.userId, cell:i }, function(d){
      C.busy = false; C.inCorso = -1;
      C.rivelate.push(i); C.celle[i] = d.sym;
      if (d.bomb) {
        C.fase = 'fine'; C.esplosa = i;
        if (d.board) for (var k = 0; k < d.board.length; k++) C.celle[k] = d.board[k];
        saldoDaRisposta(d);
        cella(i, true); pulisci(i, 120);
        if (window.XK && XK.miccia) XK.miccia(i, function(){ boom(i); }); else boom(i);
        return;
      }
      cella(i, true);
      pulisci(i, 240);
      var s = d.sym, prima = C.vinto;
      if (d.won_eur !== undefined) C.vinto = Number(d.won_eur) || 0;
      CASA.sfx(s === 0 ? 'win' : (s === 1 ? 'coin' : 'pop'));
      if (s <= 1) CASA.scoppio($('csc-griglia').children[i], { n: s === 0 ? 22 : 14, tipo:'scintille', colori: s === 0 ? ['#5eead4','#a7f3d0','#fff'] : ['#fde68a','#f59e0b','#fff'], forza:110, caduta:60, durata:700 });
      if (d.perfect) {
        C.fase = 'fine';
        saldoDaRisposta(d);
        for (var q = 0; q < 16; q++) if (!(q in C.celle)) C.celle[q] = 5;
        setTimeout(function(){ scopriResto(); }, 300);
        setTimeout(function(){
          CASA.sfx('bigwin'); CASA.hap('vittoria');
          CASA.scoppio($('csc-biglietto'), { n:38, tipo:'monete', forza:240, durata:1500 });
          CASA.esito($('csc-biglietto'), 'big', L('PERFETTO!', 'PERFECT!'), L('11 caselle su 11 · banco ×2', '11 of 11 cells · bank ×2'), '+' + E(C.vinto));
        }, 420);
        toast('💰 ' + L('Vinti ', 'Won ') + '€' + C.vinto.toFixed(2), 'ok');
      }
      banco(prima); stato(); comandi();
    }, function(msg){
      C.busy = false; C.inCorso = -1;
      toast('⚠️ ' + msg, 'err');
      if (/no active|nessun biglietto/i.test(msg)) { C.fase = 'fine'; $('csc-wrap').classList.add('chiusa'); }
      if (!(i in C.celle)) { F.tok[i] = (F.tok[i] || 0) + 1; C.pulite[i] = false; stagnola(i); }
      cella(i); stato(); comandi();
    });
    return true;
  }
  function boom(i){
    var el = $('csc-griglia').children[i];
    CASA.sfx('boom'); CASA.hap('morte');
    CASA.scuoti($('csc-biglietto'), 9);
    CASA.scoppio(el, { n:28, tipo:'scintille', colori:['#ff3b30','#ff9500','#ffd60a','#ffffff'], forza:190, caduta:120, durata:900, apertura:Math.PI * 2 });
    setTimeout(scopriResto, 380);
    setTimeout(function(){
      CASA.sfx('lose');
      CASA.esito($('csc-biglietto'), 'lose', 'BOOM!', C.vinto > 0 ? L('il banco di ', 'the bank of ') + E(C.vinto) + L(' è saltato', ' blew up') : L('hai trovato una bomba', 'you hit a bomb'), '−' + E(C.posta));
      C.vinto = 0; banco(0, true);
    }, 900);
    stato(); comandi();
  }
  function scopriResto(){
    var resto = []; for (var q = 0; q < 16; q++) if (C.rivelate.indexOf(q) < 0 && (q in C.celle)) resto.push(q);
    resto.forEach(function(q, n){ setTimeout(function(){
      if (F.g && F.rect[q]) F.g.clearRect(F.rect[q].x - 1, F.rect[q].y - 1, F.rect[q].w + 2, F.rect[q].h + 2);
      C.pulite[q] = true; cella(q, true);
      if (n % 3 === 0) CASA.sfx('flip');
    }, n * 55); });
  }
  C.incassa = function(){
    if (C.fase !== 'attivo' || C.busy) return;
    if (C.vinto <= 0) { toast(L('Ancora niente da incassare', 'Nothing to cash out yet'), 'warn'); return; }
    C.busy = true; comandi();
    posta('/scratch/cashout', { user_id:S.userId }, function(d){
      C.busy = false; C.fase = 'fine';
      if (d.won_eur !== undefined) C.vinto = Number(d.won_eur) || 0;
      saldoDaRisposta(d);
      $('csc-wrap').classList.add('chiusa');
      CASA.sfx('chips'); setTimeout(function(){ CASA.sfx(C.vinto >= C.posta * 3 ? 'bigwin' : 'win'); }, 120); CASA.hap('vittoria');
      CASA.scoppio($('csc-incassa'), { n: 26, tipo:'monete', forza:200, durata:1200 });
      CASA.esito($('csc-biglietto'), C.vinto >= C.posta ? 'win' : 'push', L('INCASSATO', 'CASHED OUT'), C.vinto >= C.posta ? L('posta ', 'bet ') + E(C.posta) : L('meno della posta, ma salvato', 'less than the bet, but saved'), '+' + E(C.vinto));
      toast('💰 ' + L('Vinti ', 'Won ') + '€' + C.vinto.toFixed(2), 'ok');
      banco(C.vinto, true); stato(); comandi();
    }, function(msg){
      C.busy = false; toast('⚠️ ' + msg, 'err');
      if (/no active|nessun biglietto/i.test(msg)) { C.fase = 'fine'; }
      stato(); comandi();
    });
  };
  C.aCaso = function(){
    if (C.fase !== 'attivo' || C.busy) return;
    var lib = []; for (var q = 0; q < 16; q++) if (!(q in C.celle) && !C.pulite[q]) lib.push(q);
    if (!lib.length) return;
    var i = lib[Math.floor(Math.random() * lib.length)];
    CASA.sfx('scratch'); if (chiedi(i)) pulisci(i, 380);
    var t = 0, iv = setInterval(function(){ CASA.sfx('scratch'); if (++t > 4) clearInterval(iv); }, 70);
  };
  C.scegli = function(b){
    if (C.fase === 'attivo' || C.busy) return;
    C.posta = b; try { currentBet.scratch = b; } catch(e){}
    CASA.sfx('chip'); gettoni(); tabella(); comandi();
    if (C.fase === 'fine') {   }
  };
  function banco(da, subito){
    var el = $('csc-banco'); if (!el) return;
    if (subito || CASA.lento()) el.textContent = E(C.vinto); else CASA.conta(el, da || 0, C.vinto, 600, function(x){ return E(x); });
    if (!subito && C.vinto > (da || 0)) CASA.pulsa(el.parentNode);
    $('csc-buone').textContent = buone() + '/11';
    var resto = 16 - C.rivelate.length;
    $('csc-rischio').textContent = (C.fase === 'attivo') ? Math.round(5 / resto * 100) + '%' : '—';
  }
  function stato(){
    var s = $('csc-stato'); if (!s) return;
    var t = '';
    if (C.fase === 'idle') t = L('Compra un biglietto e gratta le caselle', 'Buy a card and scratch the cells');
    else if (C.fase === 'attivo') {
      if (C.busy) t = L('Grattando…', 'Scratching…');
      else if (!C.rivelate.length) t = L('Gratta una casella col dito', 'Scratch a cell with your finger');
      else t = L('Incassa ', 'Cash out ') + E(C.vinto) + L(' o rischia ancora: 5 bombe in ', ' or push on: 5 bombs in ') + (16 - C.rivelate.length) + L(' caselle', ' cells');
    } else t = L('Biglietto chiuso · ne vuoi un altro?', 'Card finished · another one?');
    s.textContent = t;
  }
  function comandi(){
    var att = C.fase === 'attivo';
    $('csc-punta').style.display = att ? 'none' : '';
    $('csc-gioco').style.display = att ? '' : 'none';
    var n = $('csc-nuovo');
    n.disabled = C.busy;
    n.innerHTML = (C.fase === 'fine' ? L('Rigioca', 'Play again') : L('Compra biglietto', 'Buy card')) + ' · ' + E(C.posta) +
                  '<small>' + L('5 bombe · 11 premi · incassi quando vuoi', '5 bombs · 11 prizes · cash out any time') + '</small>';
    var c = $('csc-incassa');
    c.disabled = C.busy || C.vinto <= 0;
    c.innerHTML = L('Incassa ', 'Cash out ') + E(C.vinto) + '<small>' + (C.vinto > 0 ? L('chiudi e prendi il banco', 'close and take the bank') : L('gratta per riempire il banco', 'scratch to fill the bank')) + '</small>';
    $('csc-caso').disabled = C.busy;
    $('csc-prezzo').textContent = E(C.posta);
  }
  function gettoni(){
    var h = '';
    (window.BETS || [0.5,1,2,5,10,25,50,100,250,500]).forEach(function(b){
      h += '<button class="casa-gettone' + (Math.abs(b - C.posta) < 1e-9 ? ' sel' : '') + '" ' + CASA.ficheBottone(b) + ' onclick="CSC.scegli(' + b + ')">' + E(b) + '</button>';
    });
    var el = $('csc-gettoni'); el.innerHTML = h;
    var s = el.querySelector('.sel'); if (s) try { el.scrollLeft = s.offsetLeft - el.clientWidth / 2 + s.offsetWidth / 2; } catch(e){}
  }
  function tabella(){
    var h = '';
    for (var s = 0; s < 6; s++) {
      h += '<div class="csc-voce' + (s === 5 ? ' bomba' : '') + '"><i>' + ICONE[s] + '</i><b>' + (s === 5 ? '×0' : '×' + MULT[s]) + '</b><small>' +
           (s === 5 ? L('perdi', 'lose') : E(premioEur(s))) + '</small></div>';
    }
    $('csc-tabella').innerHTML = h;
    $('csc-regole').innerHTML = L('<b>5 bombe</b> fra 16 caselle. Ogni premio si somma nel <b>banco</b>: incassa quando vuoi. Una bomba e il banco salta. Trova <b>tutte le 11</b> caselle buone: <b>banco ×2</b>, incassato da solo.',
      '<b>5 bombs</b> among 16 cells. Every prize adds to your <b>bank</b>: cash out any time. Hit a bomb and the bank is lost. Find <b>all 11</b> safe cells: <b>bank ×2</b>, cashed automatically.');
  }
  function testi(){
    $('csc-t-banco').textContent = L('BANCO', 'BANK');
    $('csc-t-buone').textContent = L('BUONE', 'SAFE');
    $('csc-t-rischio').textContent = L('RISCHIO', 'RISK');
    $('csc-caso').innerHTML = '<span class="c"><svg viewBox=\"0 0 24 24\"><rect x=\"4\" y=\"4\" width=\"16\" height=\"16\" rx=\"4.5\"/><circle cx=\"9\" cy=\"9\" r=\"1.3\" fill=\"currentColor\"/><circle cx=\"15\" cy=\"9\" r=\"1.3\" fill=\"currentColor\"/><circle cx=\"9\" cy=\"15\" r=\"1.3\" fill=\"currentColor\"/><circle cx=\"15\" cy=\"15\" r=\"1.3\" fill=\"currentColor\"/></svg></span><span>' + L('A caso', 'Random') + '</span>';
  }
  var _rz = null, agganciato = false;
  C.enter = function(){
    try { if (C.fase !== 'attivo' && window.currentBet && currentBet.scratch > 0) C.posta = currentBet.scratch; } catch(e){}
    testi(); gettoni(); tabella(); griglia(); banco(C.vinto, true); stato(); comandi();
    if (!agganciato) {
      agganciato = true;
      var cv = $('csc-foil');
      cv.addEventListener('pointerdown', giu); cv.addEventListener('pointermove', muovi);
      cv.addEventListener('pointerup', su); cv.addEventListener('pointercancel', su);
      window.addEventListener('resize', function(){ clearTimeout(_rz); _rz = setTimeout(function(){ if (CUR === 'scratch') stagnolaTutta(); }, 150); });
    }
    requestAnimationFrame(function(){
      var t = $('csc-biglietto').querySelector('.csc-testa'); if (t) $('csc-biglietto').style.setProperty('--csc-tacca', (t.offsetTop + t.offsetHeight - 8) + 'px');
      if (!stagnolaTutta()) setTimeout(stagnolaTutta, 120); });
  };
})();
(function(){
  'use strict';
  if (!window.CASA) return;
  var L = CASA.L, E = CASA.eur;
  var CVK = window.CVK = { fase:'punta', livelloSel:0, v:null, busy:false, giro:0, posta:2 };
  function $(id){ return document.getElementById(id); }
  try { var p0 = parseFloat(localStorage.getItem('cvk_posta')); if (p0 > 0) CVK.posta = p0; } catch(e){}
  try { var l0 = parseInt(localStorage.getItem('cvk_livello'), 10); if (l0 >= 0 && l0 <= 2) CVK.livelloSel = l0; } catch(e){}
  try { if (typeof currentBet !== 'undefined' && !localStorage.getItem('cvk_posta')) CVK.posta = currentBet.vault || 2; } catch(e){}
  var LIV = [
    { nome:'ROOKIE', cols:4, trap:1, depth:6, rtp:0.82 },
    { nome:'PRO',    cols:4, trap:2, depth:6, rtp:0.93 },
    { nome:'EXPERT', cols:4, trap:3, depth:4, rtp:0.93 }
  ];
  function scalaLiv(n){
    var c = LIV[n], p = (c.cols - c.trap) / c.cols, s = 1, o = [];
    for (var i = 0; i < c.depth; i++) { s *= p; o.push(Math.round(c.rtp / s * 1e4) / 1e4); }
    return o;
  }
  function mx(x){ x = Number(x) || 0; return (x >= 100 ? x.toFixed(0) : x.toFixed(2)) + '×'; }
  function soldi(e){ return E(Math.floor((Number(e) || 0) * 100 + 1e-6) / 100); }
  function testi(){
    $('cvk-t-titolo').textContent = 'VAULT CRACKER';
    $('cvk-t-livello').textContent = L('SICUREZZA DEL CAVEAU', 'VAULT SECURITY');
    $('cvk-t-posta').textContent = L('PUNTATA', 'BET');
    $('cvk-t-cambia').textContent = L('Cambia', 'Change');
    $('cvk-t-rigioca').textContent = L('Rigioca', 'Play again');
    $('cvk-regole').innerHTML = '<b>' + L('COME SI GIOCA', 'HOW TO PLAY') + '</b>' +
      '<p>' + L('Ogni chiavistello ha una combinazione: scegli uno dei 4 numeri del quadrante. Se è giusto il chiavistello si apre e il moltiplicatore sale; se è una trappola scatta l’allarme e perdi la puntata.',
                'Each bolt has a combination: pick one of the 4 numbers on the dial. Right number: the bolt opens and the multiplier climbs. Trap: the alarm goes off and you lose the bet.') + '</p>' +
      '<p>' + L('Puoi <span class="v">INCASSARE</span> dopo ogni chiavistello aperto. Più vai a fondo, più vinci.',
                'You can <span class="v">CASH OUT</span> after every bolt you open. The deeper you go, the more you win.') + '</p>';
  }
  function livelli(){
    var h = '';
    LIV.forEach(function(c, i){
      var sc = scalaLiv(i);
      h += '<button class="cvk-liv' + (i === CVK.livelloSel ? ' sel' : '') + '" onclick="CVK.livello(' + i + ')">' +
           '<b>' + c.nome + '</b><span class="cvk-liv-t">' + '<i class="no"></i>'.repeat(c.trap) + '<i></i>'.repeat(c.cols - c.trap) + '</span>' +
           '<small>' + c.trap + ' ' + L(c.trap > 1 ? 'trappole su 4' : 'trappola su 4', c.trap > 1 ? 'traps in 4' : 'trap in 4') + '</small>' +
           '<em>' + L('fino a ', 'up to ') + mx(sc[sc.length - 1]) + '</em></button>';
    });
    $('cvk-livelli').innerHTML = h;
  }
  function gettoni(){
    var h = '';
    (window.BETS || [0.5,1,2,5,10,25,50,100]).forEach(function(b){
      h += '<button class="casa-gettone' + (Math.abs(b - CVK.posta) < 1e-9 ? ' sel' : '') + '" ' + CASA.ficheBottone(b) + ' onclick="CVK.scegli(' + b + ')">' + E(b) + '</button>';
    });
    $('cvk-gettoni').innerHTML = h;
    $('cvk-via').innerHTML = L('Apri il caveau', 'Crack the vault') + '<small>' + E(CVK.posta) + ' · ' + LIV[CVK.livelloSel].nome + '</small>';
    var s = $('cvk-gettoni').querySelector('.sel'); if (s && s.scrollIntoView) try { s.scrollIntoView({inline:'center', block:'nearest'}); } catch(e){}
  }
  function chiavistelli(depth, aperti, rotto){
    var h = '';
    for (var i = 0; i < depth; i++) {
      var a = 360 / depth * i + 360 / depth / 2 + (depth === 6 ? 15 : 0);
      var cls = 'cvk-bolt' + (i < aperti ? ' aperto' : '') + (i === aperti && rotto ? ' rotto' : '') + (i === aperti && !rotto && CVK.fase === 'gioca' ? ' prossimo' : '');
      h += '<div class="' + cls + '" style="transform:rotate(' + a + 'deg)"><i></i></div>';
    }
    $('cvk-bolts').innerHTML = h;
  }
  function scala(lad, fatti, rotto){
    var h = '', posta = CVK.v ? CVK.v.bet_eur : CVK.posta;
    for (var i = 0; i < lad.length; i++) {
      var cls = 'cvk-gr' + (i < fatti ? ' fatto' : '') + (i === fatti && CVK.fase === 'gioca' ? ' ora' : '') + (i === fatti && rotto ? ' rotto' : '');
      h += '<div class="' + cls + '"><span>' + (i + 1) + '</span><b>' + mx(lad[i]) + '</b><small>' + soldi(posta * lad[i]) + '</small></div>';
    }
    $('cvk-scala').innerHTML = h;
    $('cvk-scala').style.setProperty('--n', lad.length);
  }
  function tasti(vivi, mappa, scelto){
    var bs = document.querySelectorAll('#cvk-porta-wrap .cvk-tasto');
    for (var i = 0; i < bs.length; i++) {
      var b = bs[i], cls = 'cvk-tasto';
      if (mappa) {
        var tr = mappa[i] === 1;
        cls += tr ? ' trappola' : ' giusto';
        if (i === scelto) cls += ' scelto';
        b.innerHTML = tr ? '<i class="cvk-ic-bomba"></i>' : '<i class="cvk-ic-ok"></i>';
      } else {
        if (vivi) cls += ' vivo';
        b.innerHTML = '<b>' + (i + 1) + '</b>';
      }
      b.className = cls; b.disabled = !vivi;
    }
  }
  function testa(mult, sotto, cls){
    var m = $('cvk-mult'); m.textContent = mult; m.className = 'cvk-mult' + (cls ? ' ' + cls : '');
    $('cvk-sotto').innerHTML = sotto || '';
  }
  function stato(t, acc){ var s = $('cvk-stato'); s.innerHTML = t || ''; s.className = 'chp-stato cvk-stato' + (acc ? ' ' + acc : ''); }
  function comandi(q){
    $('cvk-punta').style.display = q === 'punta' ? '' : 'none';
    $('cvk-gioca').style.display = q === 'gioca' ? '' : 'none';
    $('cvk-ancora').style.display = q === 'ancora' ? '' : 'none';
  }
  function bottoneIncassa(v){
    var b = $('cvk-incassa');
    if (v && v.can_cash) {
      b.disabled = false;
      b.innerHTML = L('Incassa ', 'Cash out ') + soldi(v.cash_eur) +
        '<small>' + (v.next_mult ? L('o rischia per ', 'or risk it for ') + soldi(v.next_eur) : L('caveau aperto!', 'vault open!')) + '</small>';
      b.classList.add('pronto'); b.classList.toggle('urgente', !v.can_pick);
    } else {
      b.disabled = true; b.classList.remove('pronto'); b.classList.remove('urgente');
      b.innerHTML = L('Incassa', 'Cash out') + '<small>' + L('apri il primo chiavistello', 'open the first bolt') + '</small>';
    }
  }
  function rischio(v){
    var p = Math.round(v.alarms / v.cols * 100);
    return L('Trappole: ', 'Traps: ') + '<b class="cvk-rosso">' + v.alarms + '/' + v.cols + '</b> · ' + L('rischio ', 'risk ') + '<b class="cvk-rosso">' + p + '%</b>';
  }
  function porta(aperta){ $('cvk-porta-wrap').classList.toggle('aperta', !!aperta); }
  function anteprima(){
    CVK.v = null; CVK.fase = 'punta';
    var c = LIV[CVK.livelloSel];
    CASA.togliEsito($('cvk-palco'));
    porta(false); chiavistelli(c.depth, 0, false); scala(scalaLiv(CVK.livelloSel), 0, false); tasti(false);
    var sc = scalaLiv(CVK.livelloSel);
    testa(mx(sc[sc.length - 1]), L('massimo · ', 'max · ') + c.depth + L(' chiavistelli · ', ' bolts · ') + c.trap + L(c.trap > 1 ? ' trappole su 4' : ' trappola su 4', c.trap > 1 ? ' traps in 4' : ' trap in 4'), 'spento');
    stato(L('Scegli la sicurezza e la puntata', 'Pick the security level and your bet'));
    livelli(); gettoni(); comandi('punta');
  }
  function gioco(v, msg){
    CVK.v = v; CVK.fase = 'gioca';
    porta(false);
    chiavistelli(v.depth, v.survived, false); scala(v.ladder, v.survived, false);
    tasti(!!v.can_pick && !CVK.busy);
    testa(v.survived > 0 ? mx(v.mult) : '1.00×',
          v.next_mult ? L('prossimo ', 'next ') + '<b>' + mx(v.next_mult) + '</b> · ' + rischio(v) : L('Tutti i chiavistelli aperti', 'All bolts open'),
          v.survived > 0 ? 'vivo' : '');
    bottoneIncassa(v);
    stato(msg || (v.can_pick ? L('Chiavistello ', 'Bolt ') + (v.survived + 1) + '/' + v.depth + ' — ' + L('scegli un numero', 'pick a number') : L('Incassa il bottino!', 'Cash out the loot!')), 'acc');
    comandi('gioca');
  }
  function chiama(path, body, ok, ko){
    CVK.busy = true;
    fetch(BACKEND + path, { method:'POST', headers:{'Content-Type':'application/json','ngrok-skip-browser-warning':'1'}, body:JSON.stringify(body) })
      .then(function(r){ return r.json(); })
      .then(function(d){
        CVK.busy = false;
        if (!d || d.error) { ko(d && d.error ? String(d.error) : 'error', false); return; }
        ok(d);
      })
      .catch(function(){ CVK.busy = false; ko(L('Errore di rete', 'Network error'), true); });
  }
  function errore(t){ toast('⚠️ ' + t, 'err'); CASA.sfx('lose'); }
  function saldoBalzo(){ try { refresh(); if (typeof CUR !== 'undefined' && CUR === 'profile' && typeof renderProfile === 'function') renderProfile(); } catch(e){} }
  function risincronizza(){
    if (!S.userId) { anteprima(); return; }
    chiama('/vault/state', { user_id:S.userId }, function(d){
      if (d.status === 'active' && d.view) gioco(d.view);
      else { if (typeof loadBalance === 'function') loadBalance(); anteprima(); }
    }, function(){ if (CVK.v) gioco(CVK.v, L('Connessione instabile, riprova', 'Unstable connection, try again')); else anteprima(); });
  }
  CVK.enter = function(){
    testi();
    if (CVK.fase === 'fine' || CVK.fase === 'scatto') { livelli(); gettoni(); return; }
    if (!S.userId) { anteprima(); return; }
    if (CVK.fase !== 'gioca') anteprima();
    chiama('/vault/state', { user_id:S.userId }, function(d){
      if (d.status === 'active' && d.view) { CVK.livelloSel = d.view.level; gioco(d.view, L('Partita in corso: scegli un numero o incassa', 'Round in progress: pick a number or cash out')); }
      else if (CVK.fase === 'gioca') anteprima();
    }, function(){ if (CVK.fase === 'gioca') anteprima(); });
  };
  CVK.livello = function(n){
    if (CVK.fase !== 'punta' || CVK.busy) return;
    CVK.livelloSel = n; try { localStorage.setItem('cvk_livello', String(n)); } catch(e){}
    CASA.sfx('lock'); anteprima();
  };
  CVK.scegli = function(b){
    if (CVK.fase !== 'punta' || CVK.busy) return;
    CVK.posta = b; try { localStorage.setItem('cvk_posta', String(b)); currentBet.vault = b; } catch(e){}
    CASA.sfx('chip'); gettoni(); scala(scalaLiv(CVK.livelloSel), 0, false);
  };
  CVK.cambia = function(){ if (CVK.busy) return; CASA.sfx('click'); anteprima(); };
  CVK.rigioca = function(){ if (CVK.busy) return; CVK.fase = 'punta'; CVK.via(); };
  CVK.via = function(){
    if (CVK.busy || CVK.fase !== 'punta') return;
    var bet = CVK.posta;
    if (!S.userId) { toast(L('Apri dentro Telegram per giocare', 'Open in Telegram to play'), 'err'); return; }
    if (!hasFunds(bet)) { toast(L('Saldo insufficiente', 'Insufficient balance'), 'err'); CASA.sfx('lose'); anteprima(); return; }
    try { currentBet.vault = bet; } catch(e){}
    CASA.sfx('chips'); CASA.hap('leggero');
    comandi('nessuno'); stato(L('Il caveau si chiude…', 'Sealing the vault…'));
    CASA.togliEsito($('cvk-palco')); porta(false);
    chiama('/vault/start', Object.assign({ user_id:S.userId }, postaCent(bet), { level:CVK.livelloSel }), function(d){
      if (d.btc !== undefined) S.btc = saldoDa(d);
      if (d.total_bet_eur !== undefined) S.totalBet = d.total_bet_eur;
      saldoBalzo();
      CVK.giro = 0; $('cvk-pomo').style.transform = '';
      var v = d.view, t = 0;
      gioco(v, L('Chiusura…', 'Locking…')); tasti(false);
      var bs = document.querySelectorAll('#cvk-bolts .cvk-bolt');
      for (var i = 0; i < bs.length; i++) (function(b, k){
        b.classList.add('entra'); b.style.animationDelay = (k * 70) + 'ms';
        setTimeout(function(){ CASA.sfx('lock'); }, k * 70);
      })(bs[i], i);
      t = bs.length * 70 + 200;
      setTimeout(function(){ if (CVK.v === v && CVK.fase === 'gioca') gioco(v); }, CASA.lento() ? 100 : t);
    }, function(err){
      errore(/insufficient/i.test(err) ? L('Saldo insufficiente', 'Insufficient balance') : err);
      if (typeof loadBalance === 'function') loadBalance();
      anteprima();
    });
  };
  CVK.apri = function(pos){
    var v = CVK.v;
    if (CVK.busy || CVK.fase !== 'gioca' || !v || !v.can_pick) return;
    CVK.fase = 'scatto';
    tasti(false); bottoneIncassa(null);
    CASA.hap('leggero');
    if (v.survived >= 2) { CASA.sfx('heart'); setTimeout(function(){ CASA.sfx('heart'); }, 620); }
    stato(L('Combinazione ', 'Dialing ') + (pos + 1) + '…', 'acc');
    var prima = CVK.giro, giri = CASA.lento() ? 0 : 360 * (1 + (Math.random() < 0.5 ? 1 : 0));
    var dest = Math.ceil((prima + 1) / 360) * 360 + giri + pos * 90;
    CVK.giro = dest;
    var pomo = $('cvk-pomo'); pomo.style.transitionDuration = (CASA.lento() ? 250 : 900) + 'ms';
    pomo.style.transform = 'rotate(' + dest + 'deg)';
    var nT = CASA.lento() ? 3 : 11;
    for (var k = 0; k < nT; k++) (function(k){ setTimeout(function(){ CASA.sfx('tick'); }, Math.round(900 * (1 - Math.pow(1 - k / nT, 1.8)))); })(k);
    var t0 = Date.now(), MIN = CASA.lento() ? 300 : 1050, risposta = null;
    function mostra(){
      var d = risposta, ev = d.event || {};
      CVK.v = d.view;
      tasti(false, ev.map || [], ev.pick);
      if (ev.trapped) allarme(d, ev); else scatta(d, ev);
    }
    chiama('/vault/pick', { user_id:S.userId, pos:pos }, function(d){
      risposta = d; setTimeout(mostra, Math.max(0, MIN - (Date.now() - t0)));
    }, function(err, rete){
      errore(err); CVK.fase = 'gioca';
      if (rete || /no active/i.test(err)) risincronizza(); else gioco(v);
    });
  };
  function scatta(d, ev){
    var v = d.view;
    CASA.sfx('unlock'); CASA.hap('leggero');
    chiavistelli(v.depth, v.survived - 1, false);
    var bs = document.querySelectorAll('#cvk-bolts .cvk-bolt');
    var b = bs[v.survived - 1]; if (b) { b.classList.add('apre'); setTimeout(function(){ b.classList.add('aperto'); }, 20); }
    var m = $('cvk-mult');
    var da = v.survived > 1 ? v.ladder[v.survived - 2] : 1;
    CASA.conta(m, da, v.mult, 600, function(x){ return mx(x); });
    m.className = 'cvk-mult vivo'; CASA.pulsa(m);
    scala(v.ladder, v.survived, false);
    var gr = document.querySelectorAll('#cvk-scala .cvk-gr')[v.survived - 1]; if (gr) CASA.pulsa(gr);
    bottoneIncassa(v);
    if (!v.can_pick) {
      CASA.sfx('coin'); setTimeout(function(){ CASA.sfx('win'); }, 200);
      CASA.scoppio($('cvk-porta-wrap'), { tipo:'scintille', n:24, colori:['#7dd3fc','#ffd54a','#ffffff'] });
      stato(L('Caveau aperto! Incassa ', 'Vault open! Cash out ') + soldi(v.cash_eur), 'oro');
      CVK.fase = 'gioca'; CVK.v = v; comandi('gioca');
      $('cvk-sotto').innerHTML = L('Tutti i chiavistelli aperti', 'All bolts open');
      return;
    }
    stato(L('Chiavistello aperto! ', 'Bolt open! ') + L('Incassa ', 'Cash ') + soldi(v.cash_eur) + L(' o rischia', ' or risk it'), 'verde');
    setTimeout(function(){ if (CVK.v === v && CVK.fase === 'scatto') gioco(v, null); }, CASA.lento() ? 300 : 950);
  }
  function allarme(d, ev){
    if (d.btc !== undefined || d.cent !== undefined) S.btc = saldoDa(d);
    if (d.losses !== undefined) S.losses = d.losses;
    saldoBalzo();
    var v = d.view, pal = $('cvk-palco');
    CVK.fase = 'fine';
    CASA.sfx('alarm'); CASA.hap('forte');
    setTimeout(function(){ CASA.sfx('boom'); }, 120);
    pal.classList.remove('allarme'); void pal.offsetWidth; pal.classList.add('allarme');
    CASA.scuoti(pal, 9);
    chiavistelli(v.depth, v.survived, true); scala(v.ladder, v.survived, true);
    testa(L('Allarme', 'Alarm'), L('Trappola al chiavistello ', 'Trap on bolt ') + (v.survived + 1), 'rotto');
    stato('');
    var posta = v.bet_eur != null ? v.bet_eur : CVK.posta;
    setTimeout(function(){
      CASA.sfx('lose');
      CASA.esito(pal, 'lose', L('ALLARME!', 'ALARM!'), L('Il caveau ti ha preso', 'The vault caught you'), '-' + E(posta));
      fine();
    }, CASA.lento() ? 300 : 900);
  }
  CVK.incassa = function(){
    var v = CVK.v;
    if (CVK.busy || CVK.fase !== 'gioca' || !v || !v.can_cash) return;
    CVK.fase = 'incasso'; tasti(false); $('cvk-incassa').disabled = true;
    CASA.sfx('click');
    chiama('/vault/cashout', { user_id:S.userId }, function(d){
      if (d.btc !== undefined || d.cent !== undefined) { S.btc = saldoDa(d); saldoBalzo(); }
      else if (typeof loadBalance === 'function') { try { loadBalance(); } catch(e){} }
      CVK.fase = 'fine';
      var vv = d.view || v, posta = vv.bet_eur != null ? vv.bet_eur : CVK.posta, won = Number(d.won_eur) || 0;
      var netto = Math.floor((won - posta) * 100 + 1e-6) / 100;
      porta(true);
      CASA.sfx('unlock'); setTimeout(function(){ CASA.sfx(d.mult >= 5 ? 'bigwin' : 'win'); CASA.sfx('chips'); }, 260);
      CASA.hap('forte');
      var pal = $('cvk-palco');
      setTimeout(function(){ CASA.scoppio($('cvk-porta-wrap'), { tipo:'monete', n: d.mult >= 5 ? 34 : 22, forza:200 }); }, 300);
      testa(mx(d.mult), L('Incassato dopo ', 'Cashed after ') + (d.survived || 0) + L(' chiavistelli', ' bolts'), 'oro');
      chiavistelli(vv.depth, vv.survived, false); scala(vv.ladder, vv.survived, false);
      stato('');
      setTimeout(function(){
        var box = CASA.esito(pal, d.mult >= 5 ? 'big' : 'win', L('BOTTINO!', 'LOOT!'), mx(d.mult) + ' · ' + L('vinti ', 'won ') + soldi(won), '+' + soldi(netto));
        if (box) CASA.conta(box.querySelector('.casa-esito-n'), 0, netto, 800, function(x){ return '+' + soldi(x); });
        fine();
      }, CASA.lento() ? 200 : 650);
    }, function(err, rete){
      errore(err); CVK.fase = 'gioca';
      if (rete || /no active/i.test(err)) risincronizza(); else gioco(v);
    });
  };
  function fine(){
    CVK.fase = 'fine';
    $('cvk-s-rigioca').textContent = E(CVK.posta) + ' · ' + LIV[CVK.livelloSel].nome;
    comandi('ancora');
  }
})();
(function(){
  'use strict';
  if (window.CWH || !window.CASA) return;
  var L = CASA.L, E = CASA.eur;
  function $(id){ return document.getElementById(id); }
  var CFG = {
    LOW:    [[0,10],[1.5,7],[2,2],[5,1]],
    MEDIUM: [[0,16],[2,2],[5,1],[10,1]],
    HIGH:   [[0,45],[2,2],[5,1],[10,1],[25,1]]
  };
  var NOMI = { LOW:['BASSO','LOW'], MEDIUM:['MEDIO','MEDIUM'], HIGH:['ALTO','HIGH'] };
  var COL = { '0':['#1a1a1d','#55555c','#8b8b92'], '1.5':['#2a2a2e','#c9c9d1','#fff'], '2':['#2a2a2e','#ffffff','#fff'],
              '5':['#5b51cc','#8f86f2','#fff'], '10':['#7c72e6','#cdc7ff','#16141f'], '25':['#b47a24','#f5b14c','#16141f'] };
  function col(m){ return COL[String(m)] || COL['2']; }
  function mtxt(m){ return '×' + String(m); }
  var W = window.CWH = { risk:'LOW', posta:1, fase:'idle', th:0, segs:[], storia:[], giocato:false };
  try { var r0 = localStorage.getItem('cwh_risk'); if (CFG[r0]) W.risk = r0;
        var p0 = parseFloat(localStorage.getItem('cwh_posta')); if (p0 > 0) W.posta = p0; } catch(e){}
  function disponi(risk){
    var c = CFG[risk], n = 0, z = 0, vin = [];
    c.forEach(function(p, ci){
      n += p[1];
      if (p[0] === 0) { z += p[1]; return; }
      var off = (0.5 + ci * 0.381) % 1;
      for (var k = 0; k < p[1]; k++) vin.push({ m:p[0], pos:(k + off) / p[1] });
    });
    vin.sort(function(a, b){ return a.pos - b.pos; });
    var out = []; for (var i = 0; i < n; i++) out.push(0);
    var w = vin.length;
    vin.forEach(function(v, j){ out[Math.floor((j + 0.5) * n / w)] = v.m; });
    return out;
  }
  function disegna(){
    var cv = $('cwh-cv'), disco = $('cwh-disco'); if (!cv || !disco) return;
    var S = disco.offsetWidth || 0;
    if (S < 50) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(S * dpr); cv.height = Math.round(S * dpr);
    cv.style.width = S + 'px'; cv.style.height = S + 'px';
    var g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, S, S);
    var c = S / 2, R = c - 1, segs = W.segs, n = segs.length, s = Math.PI * 2 / n, i, zeri = 0;
    g.beginPath(); g.arc(c, c, R, 0, Math.PI * 2); g.fillStyle = 'rgba(28,28,30,.55)'; g.fill();
    function riemp(m){
      if (m === 0) return (zeri++ % 2) ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.075)';
      if (m < 2) return 'rgba(255,255,255,.20)';
      if (m < 5) return 'rgba(255,255,255,.32)';
      return m < 10 ? '#8b83f0' : m < 25 ? '#c9c4f8' : '#f2c27a';
    }
    for (i = 0; i < n; i++) {
      var a0 = -Math.PI / 2 + i * s;
      g.beginPath(); g.moveTo(c, c); g.arc(c, c, R, a0, a0 + s); g.closePath();
      g.fillStyle = riemp(segs[i]); g.fill();
    }
    g.lineWidth = 1; g.strokeStyle = 'rgba(0,0,0,.5)';
    for (i = 0; i < n; i++) { var a = -Math.PI / 2 + i * s;
      g.beginPath(); g.moveTo(c + Math.cos(a) * R * 0.3, c + Math.sin(a) * R * 0.3); g.lineTo(c + Math.cos(a) * R, c + Math.sin(a) * R); g.stroke(); }
    var sh = g.createRadialGradient(c, c, R * 0.28, c, c, R);
    sh.addColorStop(0, 'rgba(0,0,0,.35)'); sh.addColorStop(0.5, 'rgba(0,0,0,0)'); sh.addColorStop(0.94, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(255,255,255,.12)');
    g.beginPath(); g.arc(c, c, R, 0, Math.PI * 2); g.fillStyle = sh; g.fill();
    var fs = n > 30 ? Math.max(9, R * 0.085) : Math.max(11, R * 0.12);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (i = 0; i < n; i++) {
      var mm = segs[i], am = -Math.PI / 2 + (i + 0.5) * s;
      g.save(); g.translate(c, c); g.rotate(am);
      if (mm === 0) { g.beginPath(); g.arc(R * 0.8, 0, n > 30 ? 1.4 : 2, 0, Math.PI * 2); g.fillStyle = 'rgba(255,255,255,.22)'; g.fill(); }
      else {
        g.font = '500 ' + fs.toFixed(1) + 'px "Inter Tight",Inter,system-ui,sans-serif';
        g.fillStyle = (mm >= 10) ? '#16141f' : '#ffffff';
        g.fillText(mtxt(mm), R * 0.67, 0);
      }
      g.restore();
    }
    var pr = n > 30 ? 1.6 : 2.2, pR = R - (n > 30 ? 5 : 7);
    for (i = 0; i < n; i++) { var ap = -Math.PI / 2 + i * s;
      g.beginPath(); g.arc(c + Math.cos(ap) * pR, c + Math.sin(ap) * pR, pr, 0, Math.PI * 2); g.fillStyle = 'rgba(255,255,255,.75)'; g.fill(); }
    g.beginPath(); g.arc(c, c, R * 0.29, 0, Math.PI * 2); g.fillStyle = '#000'; g.fill();
    g.lineWidth = 1.5; g.strokeStyle = 'rgba(255,255,255,.18)'; g.stroke();
    g.beginPath(); g.arc(c, c, R - 0.5, 0, Math.PI * 2); g.lineWidth = 1.2; g.strokeStyle = 'rgba(255,255,255,.35)'; g.stroke();
    luci(S);
    ruota(W.th);
  }
  function luci(S){
    var box = $('cwh-luci'); if (!box) return;
    var N = 24;
    if (box.children.length !== N) { var h = ''; for (var i = 0; i < N; i++) h += '<i class="' + (i % 2 ? 'b' : 'a') + '"></i>'; box.innerHTML = h; }
    var r = S / 2 + 7;
    for (var j = 0; j < N; j++) box.children[j].style.transform = 'rotate(' + (j * 360 / N) + 'deg) translateY(' + (-r) + 'px)';
  }
  function ruota(th){ var d = $('cwh-disco'); if (d) d.style.transform = 'rotate(' + th.toFixed(2) + 'deg)'; }
  function testi(){
    $('cwh-titolo').textContent = L('Ruota della fortuna', 'Wheel of fortune');
    var h = '';
    ['LOW','MEDIUM','HIGH'].forEach(function(r){
      var mx = 0; CFG[r].forEach(function(p){ if (p[0] > mx) mx = p[0]; });
      h += '<button class="cwh-rischio' + (r === W.risk ? ' sel' : '') + '" data-r="' + r + '" onclick="CWH.rischio(\'' + r + '\')">' +
           '<b>' + L(NOMI[r][0], NOMI[r][1]) + '</b><small>max ×' + mx + '</small></button>';
    });
    $('cwh-rischi').innerHTML = h;
    tabella(); gettoni(); bottone(); perno();
  }
  function tabella(){
    var c = CFG[W.risk], n = 0; c.forEach(function(p){ n += p[1]; });
    var h = '';
    c.forEach(function(p){
      var k = col(p[0]), pc = Math.round(p[1] / n * 1000) / 10;
      h += '<div class="cwh-voce' + (p[0] === 0 ? ' zero' : '') + '" style="--c1:' + k[1] + ';--c0:' + k[0] + '">' +
           '<span class="cwh-tacca"></span><b>' + mtxt(p[0]) + '</b><small>' + pc + '%</small>' +
           (p[0] > 0 ? '<em>' + E(W.posta * p[0]) + '</em>' : '<em>—</em>') + '</div>';
    });
    $('cwh-tabella').innerHTML = h;
  }
  function gettoni(){
    var h = '';
    (window.BETS || [0.5,1,2,5,10,25,50,100,250,500]).forEach(function(b){
      h += '<button class="casa-gettone' + (Math.abs(b - W.posta) < 1e-9 ? ' sel' : '') + '" ' + CASA.ficheBottone(b) + ' onclick="CWH.scegli(' + b + ')">' + E(b) + '</button>';
    });
    var el = $('cwh-gettoni'); el.innerHTML = h;
    var s = el.querySelector('.sel'); if (s) try { el.scrollLeft = s.offsetLeft - el.clientWidth / 2 + s.offsetWidth / 2; } catch(e){}
  }
  function bottone(){
    var b = $('cwh-gira'); if (!b) return;
    if (W.fase === 'gira') { b.disabled = true; b.innerHTML = L('LA RUOTA GIRA…', 'SPINNING…'); return; }
    b.disabled = false;
    b.innerHTML = (W.giocato ? L('↻ RIGIOCA', '↻ SPIN AGAIN') : L('GIRA', 'SPIN')) + ' · ' + E(W.posta) +
                  '<small>' + L('rischio ', 'risk ') + L(NOMI[W.risk][0], NOMI[W.risk][1]).toLowerCase() + '</small>';
  }
  function perno(t, sotto, cls){
    var p = $('cwh-perno'); if (!p) return;
    $('cwh-perno-t').textContent = t || L('GIRA', 'SPIN');
    $('cwh-perno-s').textContent = sotto || '';
    p.className = 'cwh-perno' + (cls ? ' ' + cls : '');
  }
  function saldo(){ var b = $('wh-bal'); if (b) try { b.textContent = balEur(); } catch(e){} }
  function storia(){
    var el = $('cwh-storia'); if (!el) return;
    el.innerHTML = W.storia.map(function(m, i){ var k = col(m);
      return '<span class="' + (i === 0 ? 'nuovo' : '') + (m === 0 ? ' zero' : '') + '" style="--c1:' + k[1] + '">' + mtxt(m) + '</span>'; }).join('');
    el.style.display = W.storia.length ? '' : 'none';
  }
  function scritta(html, cls){ var el = $('cwh-esito'); el.className = 'cwh-esito' + (cls ? ' ' + cls : ''); el.innerHTML = html; }
  W.scegli = function(b){ if (W.fase === 'gira') return; W.posta = b; try { localStorage.setItem('cwh_posta', String(b)); } catch(e){}
    CASA.sfx('chip'); gettoni(); tabella(); bottone(); };
  W.rischio = function(r){
    if (W.fase === 'gira' || !CFG[r] || r === W.risk) return;
    W.risk = r; try { localStorage.setItem('cwh_risk', r); } catch(e){}
    CASA.sfx('click'); W.segs = disponi(r); luce(null);
    var a = $('cwh-disco'); if (a && a.animate && !CASA.lento()) a.animate([{opacity:0.3, transform:'rotate(' + W.th + 'deg) scale(.94)'},{opacity:1, transform:'rotate(' + W.th + 'deg) scale(1)'}], {duration:260, easing:'ease-out'});
    testi(); disegna(); perno();
  };
  function luce(i){
    var svg = $('cwh-luce'); if (!svg) return;
    if (i == null) { svg.innerHTML = ''; svg.classList.remove('on'); return; }
    var n = W.segs.length, sd = 360 / n, a0 = (i * sd + W.th) % 360, a1 = a0 + sd;
    function pt(a, r){ var x = (a - 90) * Math.PI / 180; return (Math.cos(x) * r).toFixed(2) + ' ' + (Math.sin(x) * r).toFixed(2); }
    var R = 50, r = 15;
    svg.innerHTML = '<path d="M ' + pt(a0, r) + ' L ' + pt(a0, R) + ' A ' + R + ' ' + R + ' 0 0 1 ' + pt(a1, R) + ' L ' + pt(a1, r) +
      ' A ' + r + ' ' + r + ' 0 0 0 ' + pt(a0, r) + ' Z" fill="rgba(255,255,255,.16)" stroke="#ffffff" stroke-width="1.2"/>';
    svg.classList.remove('on'); void svg.offsetWidth; svg.classList.add('on');
  }
  var OM = 1.3, TA = 380, RIT = 140;
  var M = null;
  function angolo(now){
    if (M.piano) {
      var u = Math.min(1, (now - M.piano.t0) / M.piano.T);
      return { th: M.piano.th0 + M.piano.D * (1 - Math.pow(1 - u, 4)), fine: u >= 1, lin:false };
    }
    var t = now - M.t0;
    if (t < RIT) return { th: M.th0 - 5 * Math.sin(Math.PI / 2 * t / RIT), lin:false };
    var t2 = t - RIT, A = OM / TA;
    if (t2 < TA) return { th: M.th0 - 5 + 0.5 * A * t2 * t2, lin:false };
    return { th: M.th0 - 5 + 0.5 * A * TA * TA + OM * (t2 - TA), lin:true };
  }
  function pianifica(now, th){
    var n = W.segs.length, sd = 360 / n, D, T;
    if (M.errore) { D = OM * 700 / 4; T = 700; }
    else {
      var multi = M.d.multi, idx = [];
      for (var i = 0; i < n; i++) if (W.segs[i] === multi) idx.push(i);
      var win = idx.length ? idx[Math.floor(Math.random() * idx.length)] : 0;
      M.win = win;
      var j = (Math.random() - 0.5) * 0.6 * sd;
      var dest = (((-(win * sd + sd / 2 + j)) % 360) + 360) % 360;
      var base = ((dest - (th % 360)) % 360 + 360) % 360;
      var Dmin = CASA.lento() ? 360 : 720;
      D = base; while (D < Dmin) D += 360;
      T = 4 * D / OM;
    }
    M.piano = { t0: now, th0: th, D: D, T: T };
    clearTimeout(M.sicura);
    M.sicura = setTimeout(function(){ if (M && !M.chiuso) { var a = angolo(performance.now() + 1e7); chiudi(a.th); } }, T + 600);
  }
  function passo(now){
    if (!M || M.chiuso) return;
    var a = angolo(now), th = a.th, n = W.segs.length, sd = 360 / n;
    if (!M.piano && (M.d || M.errore) && a.lin) { pianifica(now, th); a = angolo(now); th = a.th; }
    if (!M.piano && !M.d && !M.errore && now - M.t0 > 20000) { M.errore = true; M.msg = L('Il server non risponde', 'Server not responding'); }
    var k = Math.floor(th / sd);
    if (k !== M.k) {
      if (now - M.ultTick > 28) { CASA.sfx('tick'); M.ultTick = now;
        if (M.piano && (!window.XW2 || XW2.ultimi(M.piano, now, sd))) GBX.hap('sel'); }
      M.ultPiolo = now; M.k = k;
    }
    var f = th / sd - Math.floor(th / sd), dth = th - M.ult, su;
    su = (dth > sd * 0.5) ? 0.65 : (f > 0.7 ? (f - 0.7) / 0.3 : 0);
    M.ago = su > M.ago ? su : M.ago + (su - M.ago) * 0.38;
    var ago = $('cwh-ago'); if (ago) ago.style.transform = 'rotate(' + (-M.ago * 26).toFixed(1) + 'deg)';
    M.ult = th; W.th = th; ruota(th);
    if (a.fine) { chiudi(th); return; }
    requestAnimationFrame(passo);
  }
  function chiudi(th){
    if (!M || M.chiuso) return;
    M.chiuso = true; clearTimeout(M.sicura);
    W.th = ((th % 360) + 360) % 360; ruota(W.th);
    var ago = $('cwh-ago');
    if (ago && ago.animate && !CASA.lento()) ago.animate([{transform:'rotate(' + (-M.ago * 26) + 'deg)'},{transform:'rotate(5deg)'},{transform:'rotate(0deg)'}], {duration:320, easing:'ease-out'});
    if (ago) ago.style.transform = 'rotate(0deg)';
    var mm = M; M = null;
    if (mm.errore) { fineErrore(mm); return; }
    esito(mm);
  }
  function fineErrore(mm){
    W.fase = 'idle'; $('cwh-ruota').classList.remove('gira');
    var msg = mm.msg || 'error';
    scritta('<b class="no">' + L('Giro annullato', 'Spin cancelled') + '</b><small>' + L('saldo ricaricato dal server', 'balance reloaded from the server') + '</small>', 'err');
    perno(); bottone();
    toast('⚠️ ' + msg, 'err');
    if (typeof loadBalance === 'function') loadBalance();
    setTimeout(saldo, 1200);
  }
  function esito(mm){
    var d = mm.d, multi = d.multi, eur = mm.posta;
    if (d.btc !== undefined || d.cent !== undefined) S.btc = saldoDa(d);
    if (d.wins !== undefined) S.wins = d.wins; if (d.losses !== undefined) S.losses = d.losses;
    if (d.total_bet_eur !== undefined) S.totalBet = d.total_bet_eur; if (d.biggest_win_eur !== undefined) S.biggestWin = d.biggest_win_eur;
    refresh(); if (CUR === 'profile') renderProfile();
    saldo();
    W.fase = 'idle'; W.giocato = true;
    var ru = $('cwh-ruota'); ru.classList.remove('gira');
    W.storia.unshift(multi); if (W.storia.length > 12) W.storia.length = 12; storia();
    if (mm.win != null && W.segs[mm.win] === multi) luce(mm.win);
    var k = col(multi);
    if (multi > 0) {
      var vinto = (d.won_eur != null) ? Number(d.won_eur) : (d.won_btc || 0) * S.rate, utile = vinto - eur;
      perno(mtxt(multi), E(vinto), multi >= 10 ? 'oro' : 'vinto');
      $('cwh-perno').style.setProperty('--c1', k[1]);
      scritta('<b class="si">' + L('VINCI ', 'YOU WIN ') + '<span id="cwh-n">' + E(0) + '</span></b><small>' + mtxt(multi) + ' · ' + (utile >= 0 ? '+' : '−') + E(Math.abs(utile)) + '</small>', 'si');
      CASA.conta($('cwh-n'), 0, vinto, multi >= 10 ? 1400 : 700, function(x){ return E(x); });
      ru.classList.add('vinto'); setTimeout(function(){ ru.classList.remove('vinto'); }, 2400);
      if (multi >= 10) {
        GBX.fx('bigwin'); GBX.sparks($('cwh-perno'), 22); if (window.XR) XR.alone($('cwh-scena'));
        CASA.esito($('cwh-scena'), 'big', multi >= 25 ? 'MEGA JACKPOT' : 'JACKPOT', mtxt(multi) + ' · ' + L('posta ', 'bet ') + E(eur), '+' + E(vinto));
        setTimeout(function(){ var x = $('cwh-scena').querySelector('.casa-esito'); if (x) { x.classList.add('via'); setTimeout(function(){ if (x.parentNode) x.remove(); }, 260); } }, 3200);
      } else {
        GBX.fx(multi >= 2 ? 'win' : 'coin'); if (multi < 2) GBX.hap('light');
        if (multi >= 2) GBX.sparks($('cwh-perno'), multi >= 5 ? 16 : 10); if (window.XR && multi >= 2) XR.alone($('cwh-scena'));
      }
      if (CUR !== 'wheel') toast(mtxt(multi) + ' +€' + utile.toFixed(2), 'ok', 2200);
    } else {
      perno('×0', L('niente', 'no win'), 'perso');
      scritta('<b class="no">' + L('Niente questa volta', 'No luck this time') + '</b><small>−' + E(eur) + '</small>', 'no');
      GBX.fx('lose');
      if (CUR !== 'wheel') toast(L('Ruota: niente', 'Wheel: no win'), 'err', 1500);
    }
    bottone();
  }
  W.gira = function(){
    if (W.fase === 'gira') { toast(L('La ruota sta ancora girando', 'Wheel still spinning'), 'err', 1200); return; }
    var eur = W.posta;
    if (capEur() < eur) { toast(L('Saldo insufficiente', 'Insufficient balance'), 'err'); CASA.scuoti($('cwh-gira'), 5); return; }
    if (!S.userId) { toast(L('Apri dentro Telegram per giocare', 'Open in Telegram to play'), 'err'); return; }
    W.fase = 'gira';
    CASA.togliEsito($('cwh-scena')); luce(null);
    S.btc = Math.max(0, S.btc - eurToBtc(eur)); refresh(); saldo();
    CASA.sfx('chips'); setTimeout(function(){ CASA.sfx('whoosh'); }, 140); CASA.hap('leggero');
    $('cwh-ruota').classList.add('gira');
    perno('…', E(eur), 'attesa');
    scritta('<b>' + L('La ruota gira…', 'Spinning…') + '</b><small>' + L('posta ', 'bet ') + E(eur) + ' · ' + L('rischio ', 'risk ') + L(NOMI[W.risk][0], NOMI[W.risk][1]).toLowerCase() + '</small>', 'gira');
    bottone();
    var t0 = performance.now(), th0 = W.th, sd = 360 / W.segs.length;
    M = { t0:t0, th0:th0, posta:eur, d:null, errore:false, piano:null, chiuso:false, k:Math.floor((th0 - 5) / sd), ult:th0, ultTick:0, ultPiolo:t0, ago:0 };
    var mio = M;
    requestAnimationFrame(passo);
    fetch(BACKEND + '/play/wheel', {
      method:'POST', headers:{'Content-Type':'application/json','ngrok-skip-browser-warning':'1'},
      body:JSON.stringify(Object.assign({ user_id:S.userId }, postaCent(eur), { risk:W.risk }))
    }).then(function(r){ return r.json(); }).then(function(d){
      if (M !== mio) return;
      if (!d || d.error) { mio.errore = true; mio.msg = traduci((d && d.error) || 'error'); return; }
      mio.d = d;
    }).catch(function(){ if (M !== mio) return; mio.errore = true; mio.msg = L('Errore di rete', 'Network error'); });
  };
  function traduci(e){
    var t = { 'insufficient balance':['Saldo insufficiente','Insufficient balance'], 'invalid bet':['Puntata non valida','Invalid bet'] }[String(e).toLowerCase()];
    return t ? L(t[0], t[1]) : String(e);
  }
  var _rz = null;
  W.enter = function(){
    if (!W.segs.length) W.segs = disponi(W.risk);
    testi(); storia(); saldo();
    if (W.fase !== 'gira' && !$('cwh-esito').innerHTML) scritta('<b>' + L('Scegli puntata e rischio', 'Pick your bet and risk') + '</b><small>' + L('tocca GIRA o il centro della ruota', 'tap SPIN or the wheel hub') + '</small>');
    requestAnimationFrame(function(){ disegna(); });
    if (!W._rz) { W._rz = true; window.addEventListener('resize', function(){ clearTimeout(_rz); _rz = setTimeout(function(){ if (CUR === 'wheel') { disegna(); luce(null); } }, 150); }); }
  };
})();
