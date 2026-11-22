(function () {
  'use strict';
  if (window.DB3F) return;
  var SERVE = ['derbyEditor', 'dbSkinPrev', 'blg3dBase', 'blg3dSrc', 'blgNormLook', 'derbyLook', 'dbFaccia', 'dbEd3dLookObj'];
  for (var i0 = 0; i0 < SERVE.length; i0++) if (typeof window[SERVE[i0]] !== 'function') return;
  var MAX_ATTESA = 9000, OZIO = 20000, FW = 176, FH = 160, FONDO = '#12301c';
  var ST = { fr: null, g: null, t0: 0, coda: [], cache: {}, giu: false, tim: null, attesa: null, ozio: null, lavora: false, n: 0, err: null };
  window.DB3F = ST;
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function beacon(a, o) { try { blgBeaconStep(a, o); } catch (e) { } }
  function puo() {
    if (ST.giu || window.GXDC_RADICE) return false;
    try { if (typeof RTD !== 'undefined' && (RTD.ui === 'match' || RTD.lite)) return false; } catch (e) { }
    if (lsGet('gb_lite') === '1') return false;
    try { if (typeof derbyLowOn === 'function' && derbyLowOn()) return false; } catch (e) { }
    try { if (typeof dbEdReduced === 'function' && dbEdReduced()) return false; } catch (e) { return false; }
    try { return !!blg3dBase(); } catch (e) { return false; }
  }
  function look3(base, patch, tm) {
    var b = {}, k, o = {};
    base = base || {};
    for (k in base) b[k] = base[k];
    if (patch) for (k in patch) b[k] = patch[k];
    var l = blgNormLook(b);
    for (k in l) o[k] = l[k];
    o.fc = (b.fc == null || b.fc === '') ? dbFaccia() : (l.fc | 0);
    o.tm = tm ? 1 : 0;
    if (!(o.nm | 0)) o.nm = 10;
    o.capitano = ((o.nm | 0) === 10);
    o.colPelle = BLG_SKINC[((l.sk | 0) % BLG_SKINC.length + BLG_SKINC.length) % BLG_SKINC.length];
    o.colCapelli = BLG_HAIRC[((l.hc | 0) % 8 + 8) % 8];
    o.colScarpini = BLG_BOOTC[((l.bt | 0) % 8 + 8) % 8];
    o.colRifiniture = BLG_TRIMC[((l.tr | 0) % 4 + 4) % 4];
    return o;
  }
  window.db3Look = look3;
  function stChiudi() {
    if (ST.tim) { clearTimeout(ST.tim); ST.tim = null; }
    if (ST.attesa) { clearTimeout(ST.attesa); ST.attesa = null; }
    if (ST.ozio) { clearTimeout(ST.ozio); ST.ozio = null; }
    try { if (ST.g && ST.g.vetrina) ST.g.vetrina.ferma(); } catch (e) { }
    try { if (ST.fr && ST.fr.parentNode) ST.fr.parentNode.removeChild(ST.fr); } catch (e) { }
    ST.fr = null; ST.g = null; ST.lavora = false;
  }
  function stGiu(p) {
    ST.giu = true; ST.err = String(p);
    try { console.warn('[derby 3D] foto dei cosmetici spente, resta il 2D: ' + ST.err); } catch (e) { }
    beacon('db3fotogiu', { d: ST.err.slice(0, 120) });
    var c = ST.coda; ST.coda = [];
    c.forEach(function (j) { try { j.no(); } catch (e) { } });
    stChiudi();
  }
  function stApri() {
    if (ST.fr || ST.giu) return;
    if (typeof DB3 !== 'undefined' && DB3.fr && !DB3.ok && !DB3.mai && Date.now() - DB3.t0 < MAX_ATTESA + 2000) {
      if (!ST.attesa) ST.attesa = setTimeout(function () { ST.attesa = null; stApri(); }, 250);
      return;
    }
    try {
      var fr = document.createElement('iframe');
      fr.setAttribute('aria-hidden', 'true'); fr.setAttribute('tabindex', '-1'); fr.setAttribute('scrolling', 'no');
      fr.setAttribute('title', 'foto calciatore 3d');
      fr.style.cssText = 'position:fixed;left:0;bottom:0;width:352px;height:320px;border:0;opacity:.01;pointer-events:none;z-index:-1;';
      fr.src = blg3dSrc();
      document.body.appendChild(fr); ST.fr = fr; ST.g = null; ST.t0 = Date.now();
      var prova = function () {
        ST.tim = null; if (ST.fr !== fr) return;
        var g = null; try { g = fr.contentWindow && fr.contentWindow.BLG3D; } catch (e) { g = null; }
        if (g && g.errore) return stGiu('studio: ' + g.errore);
        if (g && g.pronto) {
          if (!g.vetrina) {
            var rs = ''; try { rs = fr.contentWindow.document.readyState; } catch (e) { }
            if (rs === 'complete' || Date.now() - ST.t0 > MAX_ATTESA) return stGiu('pagina 3D senza vetrina');
            ST.tim = setTimeout(prova, 90); return;
          }
          var j0 = ST.coda[0], ok = false;
          try { ok = g.vetrina.avvia({ look: j0 ? j0.look : look3(derbyLook(), null, 0), sfondo: FONDO }); } catch (e) { return stGiu('avvia: ' + ((e && e.message) || e)); }
          if (!ok) return stGiu('avvia: ' + (g.vetrina.errore || 'rifiutato'));
          ST.g = g; beacon('db3foto', { ms: Date.now() - ST.t0 });
          var w0 = fr.contentWindow, pompa = function () {
            if (ST.g !== g) return;
            try { if (typeof RTD !== 'undefined' && RTD.ui === 'match') { var c = ST.coda; ST.coda = []; c.forEach(function (j) { try { j.no(); } catch (e) { } }); stChiudi(); return; } } catch (e) { }
            try { g.vetrina.mostra('fermo'); g.vetrina.angolo(0.35); } catch (e) { }
            w0.requestAnimationFrame(pompa);
          };
          w0.requestAnimationFrame(pompa);
          return stGira();
        }
        if (Date.now() - ST.t0 > MAX_ATTESA) return stGiu('studio non pronto in ' + MAX_ATTESA + ' ms');
        ST.tim = setTimeout(prova, 90);
      };
      ST.tim = setTimeout(prova, 90);
    } catch (e) { stGiu('apri: ' + ((e && e.message) || e)); }
  }
  function scatta() {
    var cs = ST.fr.contentDocument.getElementsByTagName('canvas'), src = null, k;
    for (k = 0; k < cs.length; k++) if (!src || cs[k].width * cs[k].height > src.width * src.height) src = cs[k];
    if (!src || src.width < 8) return null;
    var W = src.width, H = src.height, sh = H * 0.77, sw = sh * FW / FH;
    var c = document.createElement('canvas'); c.width = FW; c.height = FH;
    var x = c.getContext('2d', { willReadFrequently: true });
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
    x.drawImage(src, (W - sw) / 2, H * 0.05, sw, sh, 0, 0, FW, FH);
    var d = x.getImageData(0, 0, FW, FH), p = d.data, r0 = p[0], g0 = p[1], b0 = p[2], n = 0;
    for (k = 0; k < p.length; k += 4) {
      var dr = p[k] - r0, dg = p[k + 1] - g0, db = p[k + 2] - b0;
      if (dr * dr + dg * dg + db * db <= 108) { p[k + 3] = 0; n++; }
    }
    if (n > p.length / 4 * 0.97) return null;
    x.putImageData(d, 0, 0);
    return c;
  }
  function stGira() {
    if (!ST.g || ST.lavora) return;
    if (ST.ozio) { clearTimeout(ST.ozio); ST.ozio = null; }
    var j = ST.coda.shift();
    if (!j) { ST.ozio = setTimeout(stChiudi, OZIO); return; }
    if (ST.cache[j.k]) { try { j.si(ST.cache[j.k]); } catch (e) { } return stGira(); }
    ST.lavora = true;
    var g = ST.g, v = g.vetrina, w = ST.fr.contentWindow, giri = 0, n0 = 0, vuoti = 0;
    try { v.look(j.look); v.mostra('fermo'); v.angolo(0.35); n0 = v.fotogrammi; } catch (e) { ST.lavora = false; return stGiu('look: ' + ((e && e.message) || e)); }
    var aspetta = function () {
      if (ST.g !== g) return;
      if (v.errore || g.perso) { ST.lavora = false; return stGiu(v.errore || 'contesto WebGL perso'); }
      if (++giri > 240) { ST.lavora = false; return stGiu('foto: nessun fotogramma'); }
      if (v.fotogrammi < n0 + 2) { w.requestAnimationFrame(aspetta); return; }
      var f = null; try { f = scatta(); } catch (e) { f = null; }
      if (!f && ++vuoti < 4) { n0 = v.fotogrammi; w.requestAnimationFrame(aspetta); return; }
      ST.lavora = false;
      if (!f) return stGiu('foto vuota');
      ST.cache[j.k] = f; ST.n++;
      try { j.si(f); } catch (e) { }
      stGira();
    };
    w.requestAnimationFrame(aspetta);
  }
  function foto(lk, si, no) {
    var k = JSON.stringify(lk);
    if (ST.cache[k]) { si(ST.cache[k]); return true; }
    if (!puo()) { if (no) no(); return false; }
    for (var q = 0; q < ST.coda.length; q++) if (ST.coda[q].k === k) { var a = ST.coda[q].si; ST.coda[q].si = function (f) { a(f); si(f); }; return false; }
    ST.coda.push({ k: k, look: lk, si: si, no: no || function () { } });
    if (!ST.fr) stApri(); else stGira();
    return false;
  }
  window.db3Foto = foto;
  function metti(cv, f, buio) {
    var x = cv.getContext('2d'), W = cv.width, H = cv.height, src = f;
    if (buio) {
      var t = document.createElement('canvas'); t.width = f.width; t.height = f.height;
      var tx = t.getContext('2d'); tx.drawImage(f, 0, 0);
      tx.globalCompositeOperation = 'source-in'; tx.fillStyle = '#262e3d'; tx.fillRect(0, 0, t.width, t.height);
      src = t;
    }
    x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    x.clearRect(0, 0, W, H);
    var s = Math.min(W / f.width, H / f.height), w = f.width * s, h = f.height * s;
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
    if (buio) x.globalAlpha = 0.92;
    x.drawImage(src, (W - w) / 2, (H - h) / 2, w, h);
    x.restore();
  }
  var _sp = dbSkinPrev;
  dbSkinPrev = function (cv, patch, buio) {
    var r = _sp.apply(this, arguments);
    if (!cv || !puo()) return r;
    try {
      var lk = look3((typeof DB_ED !== 'undefined' && DB_ED.look) || derbyLook(), patch, (typeof DB_ED !== 'undefined' && DB_ED.tm) | 0);
      if (!cv.__db3) {
        cv.__db3 = 1;
        var t = document.createElement('canvas'); t.width = cv.width; t.height = cv.height; t.getContext('2d').drawImage(cv, 0, 0);
        cv.width = FW; cv.height = FH; cv.style.width = '104px'; cv.style.height = '95px';
        var x = cv.getContext('2d'); x.imageSmoothingEnabled = true;
        x.drawImage(t, (FW - t.width * 2.4) / 2, (FH - t.height * 2.4) / 2 + 4, t.width * 2.4, t.height * 2.4);
      }
      foto(lk, function (f) { if (cv.width === FW) { metti(cv, f, !!buio); cv.classList.add('db3-foto'); } });
    } catch (e) { }
    return r;
  };
  if (typeof dbEd3dProva === 'function') {
    var _pv = dbEd3dProva;
    dbEd3dProva = function () {
      try {
        if (typeof DB3 !== 'undefined' && DB3.fr) {
          var w = DB3.fr.contentWindow, g = w && w.BLG3D;
          if (g && g.pronto && !g.errore && !g.vetrina && w.document.readyState !== 'complete' && Date.now() - DB3.t0 < BLG3D_MAX_ATTESA) {
            DB3.tim = setTimeout(dbEd3dProva, 80); return;
          }
        }
      } catch (e) { }
      return _pv.apply(this, arguments);
    };
  }
  var _lo = dbEd3dLookObj;
  dbEd3dLookObj = function () {
    var o = _lo.apply(this, arguments);
    try { if (!(o.nm | 0)) { o.nm = 10; o.capitano = true; } } catch (e) { }
    return o;
  };
  if (typeof cos3Look === 'function') {
    var _cl = cos3Look;
    cos3Look = function (mode, patch) {
      var o = _cl.apply(this, arguments);
      try { if (mode === 'calcio' && o && !(o.nm | 0)) { o.nm = 10; o.capitano = true; } } catch (e) { }
      return o;
    };
  }
  if (typeof qnAnteprima === 'function') {
    var _qa = qnAnteprima;
    qnAnteprima = function (cv, pr) {
      var r = _qa.apply(this, arguments);
      if (cv && pr && pr.tipo !== 'cent' && pr.mode === 'calcio' && puo()) {
        try {
          var W = cv.width, H = cv.height;
          foto(look3(derbyLook(), pr.look_patch || {}, 0), function (f) {
            if (cv.width !== W || cv.height !== H) return;
            metti(cv, f, false);
            var x = cv.getContext('2d');
            var bg = x.createRadialGradient(W / 2, H * .42, 4, W / 2, H / 2, W * .7); bg.addColorStop(0, 'rgba(40,48,72,.65)'); bg.addColorStop(1, 'rgba(8,10,18,.95)');
            x.globalCompositeOperation = 'destination-over'; x.fillStyle = bg; x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'source-over';
            cv.classList.add('db3-foto');
          });
        } catch (e) { }
      }
      return r;
    };
  }
  try {
    var css = document.createElement('style');
    css.id = 'db3f-css';
    css.textContent = '.action-btn.db3-btn{display:flex!important;align-items:center;justify-content:space-between;gap:10px;text-align:left;padding-top:4px!important;padding-bottom:4px!important;min-height:58px}'
      + '.db3-btn .db3-btn-cv{width:60px;height:55px;flex:none;margin:-6px 0 -6px auto;pointer-events:none}'
      + '.xa-ap-r.db3-btn{overflow:visible}.xa-ap-r.db3-btn .db3-btn-cv{margin:-10px 0 -10px auto}'
      + '#db3d-host .db3-au{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:3}';
    (document.head || document.documentElement).appendChild(css);
  } catch (e) { }
  function lobbyTasto() {
    var righe = document.querySelectorAll('#arc .xa-ap-r, #arc-body .xa-ap-r');
    for (var i = 0; i < righe.length; i++) {
      var oc = righe[i].getAttribute('onclick') || '', bb = righe[i].querySelector('b');
      if ((/derbyEditor/.test(oc) || (bb && /tuo calciatore|your player/i.test(bb.textContent))) && righe[i].offsetParent) return righe[i];
    }
    var b = document.querySelector('#arc-body .mg-extra button[onclick^="derbyEditor"]') || document.querySelector('#arc-body button[onclick^="derbyEditor"]');
    return b && b.offsetParent ? b : null;
  }
  function lobbyCalciatore() {
    try {
      if (typeof RTD === 'undefined' || RTD.game !== 'calcio' || RTD.ui === 'match') return;
      var b = lobbyTasto(); if (!b) return;
      var lk = look3(derbyLook(), null, 0), k = JSON.stringify(lk);
      if (b.getAttribute('data-db3') === k && b.querySelector('canvas.db3-btn-cv')) return;
      foto(lk, function (f) {
        if (!b.isConnected) return;
        b.classList.add('db3-btn'); b.setAttribute('data-db3', k);
        var cv = b.querySelector('canvas.db3-btn-cv');
        if (!cv) { cv = document.createElement('canvas'); cv.className = 'db3-btn-cv'; cv.setAttribute('aria-hidden', 'true'); b.appendChild(cv); }
        cv.width = FW; cv.height = FH; metti(cv, f, false);
      });
    } catch (e) { }
  }
  window.db3LobbyCalciatore = lobbyCalciatore;
  function lobbyPiu() { [80, 500, 1400, 2800].forEach(function (t) { setTimeout(lobbyCalciatore, t); }); }
  if (typeof rtdShowLobby === 'function') {
    var _sl = rtdShowLobby;
    rtdShowLobby = function () {
      var r = _sl.apply(this, arguments);
      try { if (RTD.game === 'calcio') lobbyPiu(); } catch (e) { }
      return r;
    };
  }
  if (typeof dbEdSave === 'function') {
    var _sv = dbEdSave;
    dbEdSave = function () { var r = _sv.apply(this, arguments); lobbyPiu(); return r; };
  }
  var AU = { raf: null, cv: null, p: [], t: 0, em: 0 };
  function auVia() {
    if (AU.raf) { cancelAnimationFrame(AU.raf); AU.raf = null; }
    try { if (AU.cv && AU.cv.parentNode) AU.cv.parentNode.removeChild(AU.cv); } catch (e) { }
    AU.cv = null; AU.p.length = 0; AU.t = 0;
  }
  function auPart(au, W, H, now) {
    var cx = W / 2, piedi = H * 0.79, a = Math.random() * 6.283, r = H * (0.07 + Math.random() * 0.08);
    var x = cx + Math.cos(a) * r, y = piedi - H * 0.02 + Math.sin(a) * r * 0.25, vx = (Math.random() - 0.5) * H * 0.06, vy = -H * (0.10 + Math.random() * 0.16);
    var col, sz = H * (0.008 + Math.random() * 0.008), vita = 0.7 + Math.random() * 0.6, gr = 0;
    if (au === 1) col = Math.random() < 0.5 ? '#ffd700' : '#fff0a0';
    else if (au === 2) { col = Math.random() < 0.5 ? '#ffffff' : '#ffe066'; y = piedi - H * (0.05 + Math.random() * 0.45); x = cx + (Math.random() - 0.5) * H * 0.26; vy = -H * 0.03; vx = (Math.random() - 0.5) * H * 0.18; vita = 0.35 + Math.random() * 0.3; sz *= 0.8; }
    else if (au === 3) { col = Math.random() < 0.5 ? '#ff9a3c' : '#ff5a1c'; sz *= 1.6; vy *= 1.3; gr = -H * 0.2; }
    else col = 'hsl(' + (((now / 6) % 360) | 0) + ',90%,60%)';
    return { x: x, y: y, vx: vx, vy: vy, g: gr, s: sz, c: col, v: vita, t: 0 };
  }
  function auGiro(now) {
    AU.raf = null;
    var host = (typeof DB3 !== 'undefined' && DB3.ok) ? DB3.host : null;
    if (!host || !host.isConnected || typeof DB_ED === 'undefined' || !DB_ED.look) { auVia(); return; }
    var au = DB_ED.look.au | 0;
    if (au <= 0 && !AU.p.length) { auVia(); return; }
    if (!AU.cv) { AU.cv = document.createElement('canvas'); AU.cv.className = 'db3-au'; AU.cv.setAttribute('aria-hidden', 'true'); host.appendChild(AU.cv); }
    var dpr = Math.min(2, window.devicePixelRatio || 1), W = Math.max(1, Math.round(host.clientWidth * dpr)), H = Math.max(1, Math.round(host.clientHeight * dpr));
    if (AU.cv.width !== W || AU.cv.height !== H) { AU.cv.width = W; AU.cv.height = H; }
    var dt = AU.t ? Math.min(0.05, (now - AU.t) / 1000) : 0.016; AU.t = now;
    if (au > 0) { AU.em += dt * (au === 2 ? 40 : 30); while (AU.em >= 1 && AU.p.length < 90) { AU.em -= 1; AU.p.push(auPart(au, W, H, now)); } if (AU.em > 3) AU.em = 0; }
    var x = AU.cv.getContext('2d');
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, W, H); x.globalCompositeOperation = 'lighter';
    for (var i = AU.p.length - 1; i >= 0; i--) {
      var p = AU.p[i]; p.t += dt;
      if (p.t >= p.v) { AU.p.splice(i, 1); continue; }
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      var k = 1 - p.t / p.v;
      x.globalAlpha = Math.max(0, Math.min(1, k * 0.95)); x.fillStyle = p.c;
      x.beginPath(); x.arc(p.x, p.y, p.s * (0.5 + 0.5 * k), 0, 6.283); x.fill();
    }
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    AU.raf = requestAnimationFrame(auGiro);
  }
  function auAvvia() { if (!AU.raf) AU.raf = requestAnimationFrame(auGiro); }
  window.db3Aura = AU;
  if (typeof dbEdMark === 'function') {
    var _mk = dbEdMark;
    dbEdMark = function () { var r = _mk.apply(this, arguments); try { if (typeof DB3 !== 'undefined' && DB3.ok && DB_ED.look && (DB_ED.look.au | 0) > 0) auAvvia(); } catch (e) { } return r; };
  }
  if (typeof dbEd3dMostra === 'function') {
    var _ms = dbEd3dMostra;
    dbEd3dMostra = function () { var r = _ms.apply(this, arguments); try { if (DB_ED.look && (DB_ED.look.au | 0) > 0) auAvvia(); } catch (e) { } return r; };
  }
  if (typeof dbEd3dChiudi === 'function') {
    var _ch = dbEd3dChiudi;
    dbEd3dChiudi = function () { auVia(); return _ch.apply(this, arguments); };
  }
})();
